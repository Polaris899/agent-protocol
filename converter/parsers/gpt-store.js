/**
 * GPT Store 配置解析器
 *
 * 支持多种输入格式：
 * - OpenAI GPT Store openapi.yaml + instructions
 * - GPTs JSON 配置
 * - 从页面提取的元数据
 */

import { extname } from 'path';

/**
 * 解析 GPT 配置源数据
 * @param {string} content - 文件内容
 * @param {string} fileExt - 文件扩展名
 * @returns {object} 标准化的原始数据
 */
export function parse(content, fileExt) {
  // Try JSON
  if (fileExt === '.json') {
    try {
      const data = JSON.parse(content);
      return normalizeGptData(data);
    } catch (err) {
      throw new Error(`JSON 解析失败: ${err.message}`);
    }
  }

  // Try YAML
  if (fileExt === '.yaml' || fileExt === '.yml') {
    try {
      // Simple YAML-like parse for openapi.yaml format
      return parseGptYaml(content);
    } catch (err) {
      throw new Error(`YAML 解析失败: ${err.message}`);
    }
  }

  // Unknown format
  throw new Error(`不支持的文件格式: ${fileExt}。支持: .json, .yaml, .yml`);
}

/**
 * 从页面提取的元数据标准化
 */
export function fromPageMetadata(metadata) {
  return normalizeGptData(metadata);
}

/**
 * 标准化为统一内部格式
 */
function normalizeGptData(raw) {
  const data = {
    source: raw.source || 'gpt-store',
    gpt_id: raw.gpt_id || raw.id || 'unknown',
    name: raw.name || raw.title || 'Unnamed GPT',
    description: raw.description || '',
    instructions: raw.instructions || raw.prompt || '',
    openapi: raw.openapi || raw.api || raw.schema || null,
    plugins: raw.plugins || [],
    actions: raw.actions || [],
    url: raw.url || '',
    author: raw.author || null,
    category: raw.category || '',
    is_verified: raw.is_verified || raw.verified || false,
  };

  // Extract from nested GPTs format
  if (raw.openapi?.info) {
    data.name = raw.openapi.info.title || data.name;
    data.description = raw.openapi.info.description || data.description;
  }

  return data;
}

/**
 * 简单 YAML 解析器 (专为 openapi.yaml 设计)
 * 实际生产环境建议使用 js-yaml
 */
function parseGptYaml(content) {
  const lines = content.split('\n');
  const result = {
    openapi: {
      info: {},
      paths: {},
      components: { schemas: {} },
    },
    instructions: '',
  };

  let currentSection = null;
  let currentPath = null;
  let currentMethod = null;
  let inInstructions = false;
  let instructionsLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (inInstructions) instructionsLines.push('');
      continue;
    }

    // Detect instructions mark
    if (trimmed.toLowerCase().startsWith('instructions:') ||
        trimmed.toLowerCase().startsWith('# instructions') ||
        trimmed.toLowerCase().startsWith('prompt:')) {
      inInstructions = true;
      if (trimmed.includes(':') && !trimmed.startsWith('#')) {
        instructionsLines.push(trimmed.split(':').slice(1).join(':').trim());
      }
      continue;
    }

    if (inInstructions) {
      // Collect until next top-level key
      if (trimmed.startsWith('openapi:') || trimmed.startsWith('paths:') ||
          trimmed.match(/^[a-z_]+:/) && !trimmed.startsWith(' ')) {
        inInstructions = false;
      } else {
        instructionsLines.push(trimmed.replace(/^"/, '').replace(/"$/, ''));
        continue;
      }
    }

    // Parse info
    const infoMatch = trimmed.match(/^title:\s*(.+)/);
    if (infoMatch) {
      result.openapi.info.title = infoMatch[1].replace(/["']/g, '');
      continue;
    }

    const descMatch = trimmed.match(/^description:\s*(.+)/);
    if (descMatch) {
      result.openapi.info.description = descMatch[1].replace(/["']/g, '');
      continue;
    }

    // Detect paths (indentation-based)
    const pathMatch = trimmed.match(/^\/([a-zA-Z0-9_/-]+):/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      if (!result.openapi.paths[currentPath]) {
        result.openapi.paths[currentPath] = {};
      }
      continue;
    }

    // Detect HTTP methods
    if ((trimmed.startsWith('get:') || trimmed.startsWith('post:') ||
         trimmed.startsWith('put:') || trimmed.startsWith('delete:')) && currentPath) {
      currentMethod = trimmed.replace(':', '');
      if (!result.openapi.paths[currentPath][currentMethod]) {
        result.openapi.paths[currentPath][currentMethod] = { summary: '', parameters: [] };
      }
      continue;
    }

    // Detect path summary
    const summaryMatch = trimmed.match(/^summary:\s*(.+)/);
    if (summaryMatch && currentPath && currentMethod) {
      result.openapi.paths[currentPath][currentMethod].summary = summaryMatch[1].replace(/["']/g, '');
      continue;
    }

    // Detect operationId
    const opMatch = trimmed.match(/^operationId:\s*(.+)/);
    if (opMatch && currentPath && currentMethod) {
      result.openapi.paths[currentPath][currentMethod].operationId = opMatch[1].replace(/["']/g, '');
      continue;
    }

    // Detect other fields (name, description, etc.)
    const nameMatch = trimmed.match(/^name:\s*(.+)/);
    if (nameMatch) {
      result.name = nameMatch[1].replace(/["']/g, '');
      continue;
    }
  }

  result.instructions = instructionsLines.join('\n').trim();
  return result;
}

/**
 * 标准化 GPT 标签
 */
export function inferTags(gptData) {
  const tags = new Set();
  tags.add('gpt-store');

  if (gptData.category) tags.add(gptData.category.toLowerCase());
  if (gptData.name) {
    const words = gptData.name.toLowerCase().split(/[\s/]+/);
    for (const w of words) {
      if (w.length > 2 && !['the', 'and', 'for', 'with'].includes(w)) {
        tags.add(w);
      }
    }
  }

  // Infer from API paths
  if (gptData.openapi?.paths) {
    for (const path of Object.keys(gptData.openapi.paths)) {
      const parts = path.split('/').filter(Boolean);
      for (const p of parts) {
        if (p.length > 2 && !p.startsWith('{')) tags.add(p);
      }
    }
  }

  return [...tags].slice(0, 10);
}
