# Agent Manifest 协议规范 v1.0

> 版本：v1.0-stable | 状态：稳定 | 生效日期：2026-06-16

## 概述

Agent Manifest 是一个声明式配置文件，描述一个 Skill/Agent 的能力、安全约束、运行时信息和组合方式。

**核心哲学：** Manifest 是 AI Runtime 与 Skill 之间的契约——它告诉 Runtime "你能期望我解决什么意图、在什么条件下运行、需要什么信任级别"。

### 文件位置

```
<repo-root>/agent.json      # JSON 格式（唯一强制支持格式）
<repo-root>/agent.yaml      # YAML 格式（备选，Runtime 可选支持）
<repo-root>/.agent/manifest.json  # 隐藏目录（备选位置）
```

---

## 1. 顶层字段

### 1.1 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `$schema` | string | 协议版本 URL，当前为 `https://agent-protocol.dev/v1.0/manifest.schema.json` |
| `id` | string | 全局唯一标识符，反向域名风格，如 `com.example.weather-agent` |
| `name` | string | 人类可读的名称 |
| `version` | string | [语义化版本号 2.0](https://semver.org/spec/v2.0.0.html)，如 `1.2.0` |
| `capabilities` | array | 能力声明列表（见第 2 节） |

### 1.2 推荐字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 简短描述（建议 ≤ 200 字），用于搜索排序 |
| `description_i18n` | object | 多语言描述（见第 2.4 节） |
| `runtime` | object | 运行时配置（见第 3 节） |
| `trust` | object | 安全与信任信息（见第 4 节） |
| `author` | object | 作者信息 |
| `tags` | string[] | 标签数组 |
| `icon` | string | 图标 URL 或 data URI |
| `homepage` | string | 项目主页 URL |
| `license` | string | SPDX 许可证标识，如 `MIT`、`Apache-2.0` |
| `repository` | string | 源码仓库 URL |
| `dependencies` | object | 依赖声明（见第 6 节） |
| `lifecycle` | object | 生命周期钩子（见第 7 节） |
| `keywords` | string[] | SEO 关键词，辅助搜索引擎发现 |
| `category` | string | 分类标识，如 `weather`、`finance`、`productivity` |

### 1.3 自描述信息

```json
{
  "$schema": "https://agent-protocol.dev/v1.0/manifest.schema.json",
  "id": "com.example.weather-agent",
  "name": "天气助手",
  "version": "1.2.0",
  "description": "查询实时天气、未来预报和历史天气数据",
  "description_i18n": {
    "zh-CN": "查询实时天气、未来预报和历史天气数据",
    "en": "Query real-time weather, forecasts and historical weather data",
    "ja": "リアルタイムの天気、予報、過去の天気データを検索"
  },
  "keywords": ["天气", "weather", "forecast", "温度", "降水"],
  "category": "weather",
  "tags": ["weather", "天气", "forecast"],
  "license": "MIT",
  "icon": "https://example.com/icon.png",
  "homepage": "https://github.com/developer/weather-agent",
  "repository": "https://github.com/developer/weather-agent"
}
```

---

## 2. Capabilities（能力声明）

**能力是协议的核心。** 每个 Skill 可能包含一个或多个能力，每个能力描述它能解决的一类意图。

### 2.1 能力结构

```json
{
  "capabilities": [
    {
      "id": "get_weather",
      "name": "查询天气",
      "name_i18n": {
        "zh-CN": "查询天气",
        "en": "Get Weather",
        "ja": "天気を取得"
      },
      "description": "根据城市名查询当前天气和未来预报",
      "type": "query",
      "mode": "sync",
      "intents": [
        "查一下{城市}的天气",
        "今天{城市}冷吗",
        "what's the weather in {city}"
      ],
      "input": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "description": "城市名称" },
          "days": { "type": "integer", "description": "预报天数", "default": 3 }
        },
        "required": ["city"]
      },
      "output": {
        "type": "object",
        "description": "天气信息，包含温度、湿度、风速等",
        "example": {
          "city": "北京",
          "temperature": 22,
          "humidity": 65,
          "condition": "晴"
        }
      },
      "latency": "real-time",
      "security_level": "low",
      "cost_per_call": 0,
      "timeout_ms": 10000,
      "rate_limit": {
        "max_per_minute": 60,
        "max_per_day": 10000
      },
      "dependencies": [],
      "alternatives_to": []
    }
  ]
}
```

### 2.2 能力字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 能力内部标识，在 Skill 内唯一 |
| `name` | string | ✓ | 能力名称 |
| `name_i18n` | object | | 多语言名称（见第 2.4 节） |
| `description` | string | ✓ | 能力描述 |
| `type` | enum | | `query` / `action` / `composite` / `stream` / `batch` |
| `mode` | enum | | `sync` / `async` / `stream` / `webhook` |
| `intents` | string[] | | 意图模板列表，支持 `{参数}` 变量 |
| `input` | object | | JSON Schema 格式的输入描述 |
| `output` | object | | 输出描述，可包含 `example` 字段 |
| `latency` | enum | | `real-time` / `low` / `medium` / `high` |
| `security_level` | enum | | `low` / `medium` / `high` / `critical` |
| `cost_per_call` | number | | 每次调用成本（USD 分），0 = 免费 |
| `timeout_ms` | number | | 超时时间（毫秒），0 = 无限制 |
| `rate_limit` | object | | 频率限制（见第 2.5 节） |
| `dependencies` | string[] | | 依赖的其他能力 ID |
| `alternatives_to` | string[] | | 替代的能力 ID（用于 fallback） |

### 2.3 能力类型（type）

| 类型 | 说明 | 示例 |
|------|------|------|
| `query` | 查询信息，无副作用 | 查天气、搜资料 |
| `action` | 执行操作，有副作用 | 发送邮件、创建文件 |
| `composite` | 组合多个能力 | "分析财报" → 读取 + 计算 + 生成报告 |
| `stream` | 流式输出 | 实时翻译、语音转文字 |
| `batch` | 批量处理 | 批量转 PDF、批量翻译 |

### 2.4 多语言支持（i18n）

```json
{
  "description_i18n": {
    "zh-CN": "查询实时天气和预报",
    "en": "Query real-time weather and forecasts",
    "ja": "リアルタイムの天気予報を検索",
    "zh-TW": "查詢即時天氣和預報"
  },
  "capabilities": [
    {
      "name": "查询天气",
      "name_i18n": {
        "zh-CN": "查询天气",
        "en": "Get Weather",
        "ja": "天気を取得"
      },
      "intents": [
        "查一下{城市}的天气",
        "what's the weather in {city}",
        "{city}の天気は？"
      ]
    }
  ]
}
```

**规则：** 如果提供 i18n，intents 数组可以包含多种语言。AI Runtime 根据用户语言环境做语义匹配。

### 2.5 频率限制（rate_limit）

```json
{
  "rate_limit": {
    "max_per_minute": 60,
    "max_per_hour": 1000,
    "max_per_day": 10000,
    "enforcement": "soft",
    "error_message": "请求过于频繁，请稍后再试"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `max_per_minute` | number | 每分钟最大调用次数 |
| `max_per_hour` | number | 每小时最大调用次数 |
| `max_per_day` | number | 每天最大调用次数 |
| `enforcement` | enum | `soft`（建议）/ `hard`（强制拒绝） |
| `error_message` | string | 超出限制时的提示消息 |

---

## 3. Runtime（运行时配置）

描述 Skill 需要什么运行时环境来执行。

### 3.1 基本结构

```json
{
  "runtime": {
    "engine": "openclaw",
    "min_version": "1.0.0",
    "max_version": "2.0.0",
    "engines": ["openclaw", "langchain", "crewai"],
    "type": "skill",
    "entrypoint": "main.py",
    "config_url": "https://raw.githubusercontent.com/user/repo/main/config.yaml",
    "config_schema": {
      "type": "object",
      "properties": {
        "api_key": { "type": "string", "description": "API 密钥" },
        "model": { "type": "string", "default": "gpt-4" }
      }
    },
    "env": {
      "OPENWEATHER_API_KEY": {
        "description": "OpenWeatherMap API Key",
        "required": true,
        "source": "user"
      },
      "DEBUG": {
        "description": "调试模式",
        "required": false,
        "default": "false"
      }
    },
    "requirements": {
      "system": {
        "memory_mb": 512,
        "disk_mb": 100,
        "network": true,
        "bins": ["curl", "python3"]
      },
      "packages": {
        "pip": ["requests>=2.28", "pydantic"],
        "npm": [],
        "apt": []
      }
    }
  }
}
```

### 3.2 运行时字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `engine` | string | ✓ | 首选运行时引擎 |
| `min_version` | string | | 最低版本要求 |
| `max_version` | string | | 最高版本限制（含） |
| `engines` | string[] | | 兼容引擎列表（用于引擎选择） |
| `type` | string | | `skill` / `agent` / `plugin` / `tool` / `workflow` |
| `entrypoint` | string | | 入口文件或命令 |
| `config_url` | string | | 运行时配置文件的 URL |
| `config_schema` | object | | 配置项的 JSON Schema |
| `env` | object | | 环境变量声明（见第 3.3 节） |
| `requirements` | object | | 系统要求（见第 3.4 节） |

### 3.3 环境变量声明（env）

```json
{
  "env": {
    "API_KEY": {
      "description": "第三方服务 API 密钥",
      "required": true,
      "source": "user",
      "sensitive": true
    },
    "MODEL": {
      "description": "使用的 AI 模型",
      "required": false,
      "default": "gpt-4",
      "source": "user"
    },
    "LOG_LEVEL": {
      "description": "日志级别",
      "required": false,
      "default": "info",
      "source": "runtime"
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 变量用途说明 |
| `required` | boolean | 是否必需 |
| `default` | any | 默认值 |
| `source` | enum | `user`（用户提供）/ `runtime`（运行时自动注入） |
| `sensitive` | boolean | 是否敏感（需要加密存储） |

### 3.4 系统要求（requirements）

```json
{
  "requirements": {
    "system": {
      "memory_mb": 1024,
      "disk_mb": 500,
      "network": true,
      "gpu": false,
      "bins": ["python3", "ffmpeg"],
      "os": ["linux", "macos"],
      "arch": ["x64", "arm64"]
    },
    "packages": {
      "pip": ["requests", "numpy"],
      "npm": [],
      "apt": ["ffmpeg"],
      "brew": []
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `memory_mb` | number | 最低内存要求（MB） |
| `disk_mb` | number | 最低磁盘空间（MB） |
| `network` | boolean | 是否需要网络 |
| `gpu` | boolean | 是否需要 GPU |
| `bins` | string[] | 依赖的系统命令 |
| `os` | string[] | 支持的操作系统 |
| `arch` | string[] | 支持的 CPU 架构 |
| `pip` / `npm` / `apt` / `brew` | string[] | 各包管理器的依赖 |

---

## 4. Trust（信任与安全）

### 4.1 信任结构

```json
{
  "trust": {
    "permissions": ["network", "read_file"],
    "sandbox_level": "isolated",
    "verified_by": ["community_audit_202606"],
    "approval_required": false,
    "audit_url": "https://github.com/audit-repo/report-001.md",
    "signature": {
      "algorithm": "ed25519",
      "key_id": "key-2026-01",
      "value": "MC0CFQ...",
      "timestamp": "2026-06-01T00:00:00Z",
      "key_url": "https://keys.example.com/key-2026-01.pub"
    },
    "attestation": {
      "type": "witness",
      "url": "https://witness.example.com/attestations/com.example.weather-agent/1.2.0"
    }
  }
}
```

### 4.2 权限声明（permissions）

权限使用作用域字符串描述，支持参数化路径：

| 权限 | 说明 | 风险等级 |
|------|------|---------|
| `network` | 网络访问 | 中 |
| `network:api.openweathermap.org` | 限定域名 | 低 |
| `read_file` | 读取任意文件 | 高 |
| `read_file:~/Documents` | 读取指定目录 | 中 |
| `write_file` | 写入任意文件 | 高 |
| `write_file:~/Downloads` | 写入指定目录 | 中 |
| `execute_command` | 执行任意命令 | 严重 |
| `execute_command:python3` | 执行指定命令 | 高 |
| `read_location` | 读取位置信息 | 高 |
| `read_calendar` | 读取日历 | 中 |
| `read_contacts` | 读取联系人 | 高 |
| `access_camera` | 访问摄像头 | 严重 |
| `access_microphone` | 访问麦克风 | 严重 |
| `identity:user` | 获取用户身份 | 中 |
| `storage:app` | 应用沙箱存储 | 低 |

### 4.3 沙箱级别（sandbox_level）

| 级别 | 说明 | 适用场景 |
|------|------|---------|
| `none` | 不隔离 | 高信任内部工具 |
| `basic` | 进程级隔离 | 常规查询类 Skill |
| `isolated` | 容器级隔离 | 执行代码或文件操作 |
| `air_gapped` | 无网络全隔离 | 处理敏感数据 |
| `custom` | 自定义沙箱策略 | 需要精细控制 |

### 4.4 签名与验证（v0.2 新增）

```json
{
  "signature": {
    "algorithm": "ed25519",
    "key_id": "key-2026-01",
    "key_url": "https://keys.example.com/key-2026-01.pub",
    "value": "MC0CFQ...",
    "timestamp": "2026-06-01T00:00:00Z",
    "revoked_at": null
  }
}
```

**验证流程：**
1. Runtime 从 `key_url` 下载公钥
2. 验证 `signature.value` 是否匹配整个 manifest 的 hash
3. 检查 `key_id` 是否在撤销列表中
4. 检查 `timestamp` 是否在有效期内
5. 通过 `attestation.url` 可查询第三方见证报告

### 4.5 批准机制（approval_required）

```json
{
  "approval_required": true,
  "approval_message": "此 Skill 将发送一封邮件到你的联系人列表，是否允许？",
  "one_time": false
}
```

- `approval_required: true` — 每次调用前需要用户确认
- `one_time: true` — 仅首次调用需要确认
- `approval_message` — 展示给用户的风险提示

---

## 5. Dependencies（依赖声明）

### 5.1 依赖结构

Skill 可以依赖其他 Skill 或外部资源。

```json
{
  "dependencies": {
    "skills": [
      {
        "id": "com.openclaw.weather",
        "version": ">=1.0.0",
        "optional": false,
        "description": "基础天气数据服务"
      }
    ],
    "apis": [
      {
        "url": "https://api.openweathermap.org/data/2.5",
        "description": "OpenWeatherMap API",
        "required": true,
        "auth_type": "api_key"
      }
    ],
    "models": [
      {
        "id": "gpt-4",
        "provider": "openai",
        "min_version": "0613",
        "required": true
      }
    ]
  }
}
```

### 5.2 依赖解析规则

1. **版本范围** — 支持语义化版本范围，如 `>=1.0.0 <2.0.0`
2. **可选依赖** — `optional: true` 表示此依赖不存在时能力降级而非报错
3. **循环检测** — Runtime 必须检测循环依赖并拒绝安装
4. **冲突解决** — 两个依赖要求同一 Skill 的不同版本时，取兼容的最大版本
5. **传递依赖** — 依赖的依赖也需满足（传递性）

### 5.3 API 依赖认证

| 类型 | 说明 |
|------|------|
| `none` | 无需认证 |
| `api_key` | API Key（需用户提供） |
| `oauth2` | OAuth 2.0 流程 |
| `bearer` | Bearer Token |
| `basic` | HTTP Basic Auth |
| `custom` | 自定义认证方案 |

---

## 6. Lifecycle（生命周期钩子）

### 6.1 钩子定义

```json
{
  "lifecycle": {
    "on_install": {
      "type": "hook",
      "url": "https://raw.githubusercontent.com/user/repo/main/scripts/install.sh",
      "timeout_ms": 30000,
      "requires_approval": true,
      "description": "安装依赖包和初始化配置"
    },
    "on_update": {
      "type": "hook",
      "command": "./scripts/migrate.sh",
      "timeout_ms": 30000,
      "description": "版本升级数据迁移"
    },
    "on_uninstall": {
      "type": "hook",
      "command": "./scripts/cleanup.sh",
      "description": "清理临时文件"
    },
    "on_error": {
      "type": "webhook",
      "url": "https://hooks.example.com/error",
      "description": "错误上报"
    },
    "health_check": {
      "type": "command",
      "command": "./scripts/health.sh",
      "interval_seconds": 300,
      "timeout_ms": 5000,
      "description": "每 5 分钟检查服务健康状态"
    }
  }
}
```

### 6.2 钩子类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `hook` | 本地执行的脚本或命令 | `install.sh` |
| `webhook` | HTTP 回调 | 错误上报、事件通知 |
| `command` | 运行时命令 | 健康检查 |
| `http` | HTTP API 调用 | 预热缓存 |

### 6.3 钩子字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | enum | ✓ | `hook` / `webhook` / `command` / `http` |
| `url` | string | | 脚本或 Webhook URL |
| `command` | string | | 本地命令（与 url 互斥） |
| `timeout_ms` | number | | 超时时间 |
| `requires_approval` | boolean | | 是否需要用户确认 |
| `description` | string | | 钩子用途描述 |
| `interval_seconds` | number | | 健康检查间隔 |

---

## 7. Capability Chaining（能力链式调用）

### 7.1 链式调用声明

能力可以声明依赖其他能力，形成调用链。

```json
{
  "capabilities": [
    {
      "id": "analyze_financial_report",
      "name": "分析财务报表",
      "description": "读取 Excel 报表并执行杜邦分析",
      "type": "composite",
      "mode": "sync",
      "intents": [
        "分析这份财务报表",
        "帮我看看这份报表的财务状况"
      ],
      "input": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string", "description": "报表文件路径" }
        },
        "required": ["file_path"]
      },
      "dependencies": ["read_excel", "dupont_analysis", "generate_report"],
      "chain": {
        "strategy": "sequential",
        "timeout_ms": 60000
      }
    },
    {
      "id": "read_excel",
      "name": "读取 Excel",
      "type": "query",
      "mode": "sync"
    },
    {
      "id": "dupont_analysis",
      "name": "杜邦分析",
      "type": "query",
      "mode": "sync",
      "dependencies": ["read_excel"]
    },
    {
      "id": "generate_report",
      "name": "生成报告",
      "type": "action",
      "mode": "sync",
      "dependencies": ["dupont_analysis"]
    }
  ]
}
```

### 7.2 链式策略

| 策略 | 说明 |
|------|------|
| `sequential` | 按序执行，前一个的输出是后一个的输入 |
| `parallel` | 并行执行所有依赖，汇总结果 |
| `conditional` | 按条件分支执行 |
| `pipeline` | 流水线模式，每个阶段加工后传给下一阶段 |
| `dag` | 有向无环图，允许复杂的工作流 |

---

## 8. Error Handling（错误处理）

### 8.1 标准错误码

所有能力返回错误时，应遵循以下错误码规范：

| 错误码 | 说明 | 是否可重试 |
|--------|------|-----------|
| `ERR_RATE_LIMIT` | 超出频率限制 | ✅ 等待后重试 |
| `ERR_TIMEOUT` | 超时 | ✅ 可重试 |
| `ERR_AUTH` | 认证失败 | ❌ |
| `ERR_PERMISSION` | 权限不足 | ❌ |
| `ERR_INPUT` | 输入无效 | ❌ |
| `ERR_DEPENDENCY` | 依赖不可用 | ✅ 降级 |
| `ERR_INTERNAL` | 内部错误 | ❌ 需修复 |
| `ERR_NOT_FOUND` | 资源不存在 | ❌ |

### 8.2 错误响应格式

```json
{
  "error": {
    "code": "ERR_RATE_LIMIT",
    "message": "请求过于频繁，请 30 秒后重试",
    "retry_after_ms": 30000,
    "details": {
      "current_count": 62,
      "limit": 60,
      "period": "minute"
    }
  }
}
```

---

## 9. 协议演进

### 版本历史

| 版本 | 日期 | 状态 | 变更 |
|------|------|------|------|
| v0.1 | 2026-06-15 | ❌ 已冻结 | 初始草案 |
| v0.2 | 2026-06-16 | ❌ 已冻结 | 新增：依赖声明、生命周期钩子、链式调用、i18n、能力类型、错误码、频率限制 |
| **v1.0** | **2026-06-16** | ✅ **当前稳定** | **向后兼容 v0.2，稳定承诺，Schema 冻结** |

### v1.0 稳定承诺

> 从 v1.0 开始，协议进入稳定期：
> 1. **向后兼容** — v0.2 的所有可用字段均保持不变
> 2. **必需字段冻结** — 不会新增必需字段
> 3. **新增可选** — 新功能以可选字段引入
> 4. **弃用期** — 字段移除前至少有一个大版本作为弃用期
> 5. **弃用通知** — 弃用字段会在 schema 中用 `$deprecated` 标记

### 版本兼容性

| 变更类型 | 示例 | 版本号变化 |
|---------|------|-----------|
| 新增可选字段 | 增加 `lifecycle` | 小版本 |
| 新增必需字段 | 强制作者签名 | 大版本 |
| 删除字段 | 移除 `tags` | 大版本 |
| 语义变更 | intents 语法变化 | 大版本 |

---

## 10. 附录

### 与 OpenAI GPTs 的映射

| OpenAI GPTs | AMP | 说明 |
|-------------|-----|------|
| `name` | `name` | 名称 |
| `description` | `description` | 描述 |
| `instructions` | `runtime.config_url` | 系统提示词 |
| `tools` | `capabilities` | 能力声明 |
| `actions` | `capabilities[].input` | 输入 Schema |
| `conversation_starters` | `capabilities[].intents` | 意图模板 |
| `knowledge` | `dependencies` | 知识库依赖 |
| — | `trust` | 安全约束（GPTs 没有） |

### 与 OpenAPI 的映射

| OpenAPI | AMP |
|---------|-----|
| `paths` | `capabilities` |
| `requestBody` | `capabilities[].input` |
| `responses` | `capabilities[].output` |
| `parameters` | `input.properties` |
| `security` | `trust.permissions` |

### 意图匹配策略（推荐）

Runtime 实现意图匹配时，建议以下组合策略：

1. **嵌入向量匹配**（主要）— 将 intents 向量化，与用户输入计算余弦相似度
2. **关键词增强**（辅助）— 结合 `tags`、`keywords`、`category` 
3. **LLM 路由**（高级）— 用 LLM 判断意图归属（适合模糊匹配场景）
4. **上下文补全** — 结合对话历史补全缺失的意图参数
5. **fallback 链** — 当主能力不匹配时，检查 `alternatives_to` 链

### 参考实现

- [OpenClaw amper skill](https://github.com/Polaris899/agent-protocol/registry/amper.agent.json) — AMP Runtime 桥梁
- [CLI 工具](https://github.com/Polaris899/agent-protocol/tree/main/cli) — 验证、搜索、安装
