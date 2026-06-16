/**
 * 原始 GPT 数据 → Agent Manifest 转换器
 */

import { inferTags } from '../parsers/gpt-store.js';

/**
 * 将标准化的 GPT Store 数据转换为 AMP manifest
 * @param {object} raw - 标准化后的原始数据
 * @returns {object} AMP 兼容的 manifest 对象
 */
export function toManifest(raw) {
  const gptId = raw.gpt_id || raw.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown';

  const manifest = {
    $schema: 'https://agent-protocol.dev/v1.0/manifest.schema.json',
    id: `com.openai.gpt-${gptId}`,
    name: raw.name || 'Unnamed Skill',
    description: raw.description || 'Converted from GPT Store',
    version: '1.0.0',
    author: raw.author ? { name: raw.author } : null,
    tags: inferTags(raw),
    license: 'custom',
    capabilities: extractCapabilities(raw),
    runtime: {
      engine: 'openai-gpts',
      type: 'skill',
      config_url: raw.url || '',
    },
    trust: {
      permissions: inferPermissions(raw),
      sandbox_level: raw.is_verified ? 'basic' : 'isolated',
      verified_by: raw.is_verified ? ['openai_gpt_store'] : [],
    },
  };

  return manifest;
}

/**
 * 从 GPT 数据中提取能力声明
 */
function extractCapabilities(raw) {
  const capabilities = [];

  // Strategy 1: From openapi paths
  if (raw.openapi?.paths) {
    for (const [path, methods] of Object.entries(raw.openapi.paths)) {
      for (const [method, detail] of Object.entries(methods)) {
        if (typeof detail !== 'object') continue;

        const cap = {
          id: method === 'get' ? `fetch_${path.replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '')}` : 
                                path.replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, ''),
          name: detail.summary || `${method.toUpperCase()} ${path}`,
          description: detail.summary || `${method.toUpperCase()} endpoint: ${path}`,
          intents: inferIntents(raw.name, raw.description, detail.summary, path),
          input: extractInputSchema(detail),
          latency: 'low',
          security_level: 'low',
          cost_per_call: 0,
        };

        capabilities.push(cap);
      }
    }
  }

  // Strategy 2: From actions (GPT Actions format)
  if (raw.actions && raw.actions.length > 0) {
    for (const action of raw.actions) {
      const cap = {
        id: action.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `action_${capabilities.length}`,
        name: action.name || action.description?.slice(0, 40) || 'GPT Action',
        description: action.description || 'GPT Store Action',
        intents: [action.description || action.name || ''].filter(Boolean),
        latency: 'low',
        security_level: 'low',
        cost_per_call: 0,
      };
      capabilities.push(cap);
    }
  }

  // Strategy 3: From name + description (no API → pure chat GPT)
  if (capabilities.length === 0) {
    capabilities.push({
      id: 'chat',
      name: raw.name || 'Chat',
      description: raw.description || 'AI chat capability',
      intents: inferIntents(raw.name, raw.description, raw.instructions || ''),
      latency: 'low',
      security_level: 'low',
      cost_per_call: 0,
    });
  }

  return capabilities.slice(0, 10); // Max 10 capabilities per manifest
}

/**
 * 从名称、描述和指令推断意图模板
 */
function inferIntents(name, description, instructions, path) {
  const intents = new Set();
  const text = [name, description, instructions, path].filter(Boolean).join(' ').toLowerCase();

  // Common GPT task patterns
  const patterns = [
    { match: /分析|analyze|analyze|summary|总结/, intent: '分析{内容}' },
    { match: /翻译|translate/, intent: '翻译{文本}到{语言}' },
    { match: /搜索|search|find/, intent: '搜索{query}' },
    { match: /生成|generate|create|写/, intent: '生成{内容}' },
    { match: /转换|convert|转/, intent: '将{source}转换为{target}' },
    { match: /提取|extract/, intent: '从{source}提取{信息}' },
    { match: /比较|compare|对比/, intent: '比较{a}和{b}' },
    { match: /计算|calculate/, intent: '计算{表达式}' },
    { match: /推荐|recommend/, intent: '推荐{类别}' },
    { match: /解释|explain|解释/, intent: '解释{概念}' },
    { match: /画|生成.*图|image|图片/, intent: '生成{描述}的图片' },
    { match: /天气|weather/, intent: '查{城市}的天气' },
    { match: /邮件|email/, intent: '写邮件给{收件人}' },
    { match: /代码|code|编程/, intent: '写{语言}代码来实现{功能}' },
    { match: /规划|plan|计划|行程/, intent: '规划{目的地}的{天数}天行程' },
    { match: /订|book|预订|预约/, intent: '预订{服务}' },
    { match: /PDF|pdf|文档/, intent: '分析{文件}的内容' },
    { match: /数据|data|表格/, intent: '分析这份{类型}数据' },
  ];

  for (const { match, intent } of patterns) {
    if (text.match(match)) {
      intents.add(intent);
    }
  }

  // Extract action verbs for additional intents
  const verbs = text.match(/(帮我|帮我把|请|could you|please|I need|帮我)[^，。\n]{2,30}/g);
  if (verbs) {
    for (const v of verbs.slice(0, 3)) {
      intents.add(v.trim());
    }
  }

  // If nothing matched, add a generic intent
  if (intents.size === 0 && name) {
    intents.add(name);
  }

  return [...intents].slice(0, 5); // Max 5 intents per capability
}

/**
 * 从 API 参数提取 JSON Schema
 */
function extractInputSchema(detail) {
  if (!detail || !detail.parameters || detail.parameters.length === 0) {
    return null;
  }

  const schema = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const param of detail.parameters) {
    const name = param.name || 'param';
    schema.properties[name] = {
      type: param.schema?.type || param.type || 'string',
      description: param.description || name,
    };
    if (param.required) {
      schema.required.push(name);
    }
  }

  if (detail.requestBody?.content) {
    // Merge request body schema
    const jsonContent = detail.requestBody.content['application/json'];
    if (jsonContent?.schema?.properties) {
      Object.assign(schema.properties, jsonContent.schema.properties);
      if (jsonContent.schema.required) {
        schema.required.push(...jsonContent.schema.required);
      }
    }
  }

  return schema;
}

/**
 * 推断权限
 */
function inferPermissions(raw) {
  const permissions = new Set();

  if (raw.openapi?.paths && Object.keys(raw.openapi.paths).length > 0) {
    permissions.add('network');
  }

  if (raw.instructions?.toLowerCase().includes('file') ||
      raw.instructions?.toLowerCase().includes('upload') ||
      raw.instructions?.toLowerCase().includes('pdf')) {
    permissions.add('read_file');
  }

  if (raw.plugins && raw.plugins.length > 0) {
    permissions.add('network');
    if (raw.plugins.some(p => p.type === 'web_browsing')) {
      permissions.add('web_browsing');
    }
  }

  return [...permissions];
}
