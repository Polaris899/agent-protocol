# Agent Manifest 协议规范 v0.1

## 概述

Agent Manifest 是一个声明式配置文件，描述一个 Skill/Agent 的能力、安全约束和运行时信息。  
它面向两种读者：

- **机器（AI Runtime）** — 解析 manifest，决定是否调用以及如何调用
- **人类（开发者/审计者）** — 理解 Skill 的能力和风险

---

## 文件位置

推荐放置在仓库根目录：

```
<repo-root>/agent.json      # JSON 格式（推荐）
<repo-root>/agent.yaml      # YAML 格式（备选）
```

---

## 顶层字段

### 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `$schema` | string | 协议版本 URL，当前为 `https://agent-protocol.dev/v0.1/manifest.schema.json` |
| `id` | string | 全局唯一标识符，采用反向域名风格，如 `com.example.weather-agent` |
| `name` | string | 人类可读的名称，如 `天气助手` |
| `version` | string | 语义化版本号，如 `1.2.0` |
| `capabilities` | array | 该 Skill 能处理的能力列表（见下文） |

### 推荐字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 简短描述（建议≤200字），用于搜索和排序 |
| `runtime` | object | 运行时配置（见下文） |
| `trust` | object | 安全与信任信息（见下文） |
| `author` | object | 作者信息 |
| `tags` | string[] | 标签数组，辅助发现 |
| `icon` | string | 图标 URL 或相对路径 |
| `homepage` | string | 项目主页 URL |
| `license` | string | 开源许可证标识，如 `MIT` |

---

## capabilities（能力声明）

**这是整个协议最核心的部分**——Skill 必须详细描述自己能解决什么意图。

### 结构

```json
{
  "capabilities": [
    {
      "id": "get_weather",
      "name": "查询天气",
      "description": "根据城市名查询当前天气和未来预报",
      "intents": [
        "查一下{城市}的天气",
        "今天{城市}冷吗",
        "明天{城市}会下雨吗",
        "what's the weather in {city}"
      ],
      "input": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "城市名称，如'北京'、'Shanghai'"
          },
          "days": {
            "type": "integer",
            "description": "预报天数",
            "default": 3
          }
        },
        "required": ["city"]
      },
      "output": {
        "type": "object",
        "description": "天气信息，包含温度、湿度、风速、天气状况等"
      },
      "latency": "medium",
      "security_level": "low",
      "cost_per_call": 0
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 能力内部标识，用于路由 |
| `name` | string | ✓ | 能力名称 |
| `description` | string | ✓ | 能力描述 |
| `intents` | string[] | | 意图模板列表，帮助 AI 理解何时调用此能力。支持 `{参数}` 变量 |
| `input` | object | | JSON Schema 格式的输入描述 |
| `output` | object | | JSON Schema 格式的输出描述 |
| `latency` | enum | | `real-time` / `low` / `medium` / `high`，帮助路由中心做调度决策 |
| `security_level` | enum | | `low` / `medium` / `high` / `critical` |
| `cost_per_call` | number | | 每次调用的成本（USD 分），0 表示免费 |
| `dependencies` | string[] | | 依赖的其他能力 ID 列表，用于链式调用 |

### intents 的设计原则

intents 不是正则表达式，而是**意图模板**。  
AI 会使用语义匹配（而非关键字匹配）来判断用户意图是否对齐。  
模板中的 `{变量}` 仅作为提示，表示"这个意图需要这些参数"。

示例：

```json
"intents": [
  "帮我订一张从{出发}到{目的}的{日期}机票",
  "从{出发}飞{目的}的航班",
  "book a flight from {origin} to {destination}"
]
```

---

## runtime（运行时配置）

```json
{
  "runtime": {
    "engine": "openclaw",
    "min_version": "1.0.0",
    "config_url": "https://raw.githubusercontent.com/user/repo/main/config.yaml",
    "entrypoint": "main.py",
    "type": "skill",
    "engines": ["openclaw", "langchain", "crewai"]
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `engine` | string | ✓ | 首选运行时引擎 |
| `min_version` | string | | 引擎最低版本要求 |
| `config_url` | string | | 运行时配置文件的 URL，供引擎下载 |
| `entrypoint` | string | | 入口文件或命令 |
| `type` | string | | `skill` / `agent` / `plugin` / `tool` |
| `engines` | string[] | | 兼容的引擎列表 |

---

## trust（信任与安全）

```json
{
  "trust": {
    "permissions": ["read_weather_data", "network"],
    "sandbox_level": "isolated",
    "verified_by": ["community_audit_202606"],
    "signature": {
      "algorithm": "ed25519",
      "key_id": "key-2026-01",
      "value": "MC0CFQ..."
    },
    "audit_url": "https://github.com/audit-repo/report-001.md"
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `permissions` | string[] | ✓ | 声明所需的权限 |
| `sandbox_level` | enum | | `none` / `basic` / `isolated` / `air_gapped` |
| `verified_by` | string[] | | 审计方标识列表 |
| `signature` | object | | 开发者签名，用于验证 manifest 完整性 |
| `audit_url` | string | | 安全审计报告 URL |

### 权限声明示例

```json
"permissions": [
  "network",                    // 可访问网络
  "read_file:~/Documents",      // 可读取指定目录
  "write_file:~/Downloads",     // 可写入指定目录
  "read_location",              // 可读取位置
  "read_calendar",              // 可读取日历
  "execute_command",            // 可执行命令（高风险）
  "access_camera"               // 可访问摄像头（高风险）
]
```

---

## 完整示例

```json
{
  "$schema": "https://agent-protocol.dev/v0.1/manifest.schema.json",
  "id": "com.example.weather-agent",
  "name": "天气助手",
  "description": "查询实时天气、未来预报和历史天气数据",
  "version": "1.2.0",
  "author": {
    "name": "开发者名字",
    "url": "https://github.com/developer"
  },
  "tags": ["weather", "天气", "forecast", "天气预报"],
  "license": "MIT",
  "icon": "https://example.com/icon.png",
  "homepage": "https://github.com/developer/weather-agent",
  "capabilities": [
    {
      "id": "get_current_weather",
      "name": "当前天气",
      "description": "查询指定城市的实时温度、湿度、风速和天气状况",
      "intents": [
        "现在{城市}的天气怎么样",
        "{城市}现在多少度",
        "what's the weather in {city} now"
      ],
      "input": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "description": "城市名，如北京、上海" },
          "unit": { "type": "string", "enum": ["celsius", "fahrenheit"], "default": "celsius" }
        },
        "required": ["city"]
      },
      "latency": "real-time",
      "security_level": "low",
      "cost_per_call": 0
    },
    {
      "id": "get_forecast",
      "name": "天气预报",
      "description": "查询未来多天的天气预报",
      "intents": [
        "未来{天数}天{城市}的天气",
        "{城市}这周天气",
        "forecast for {city} for {days} days"
      ],
      "input": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "description": "城市名" },
          "days": { "type": "integer", "description": "预报天数", "default": 3 }
        },
        "required": ["city"]
      },
      "latency": "real-time",
      "security_level": "low",
      "cost_per_call": 0
    }
  ],
  "runtime": {
    "engine": "openclaw",
    "min_version": "1.0.0",
    "config_url": "https://raw.githubusercontent.com/developer/weather-agent/main/config.yaml",
    "entrypoint": "main.py",
    "type": "skill",
    "engines": ["openclaw"]
  },
  "trust": {
    "permissions": ["network"],
    "sandbox_level": "basic",
    "verified_by": ["community_audit_202606"],
    "audit_url": "https://github.com/audit-repo/weather-agent-audit.md"
  }
}
```

---

## 协议演进

### 版本策略

- `v0.1` — 草案阶段，可随时更改
- `v1.0` — 稳定版本，向后兼容
- 小版本号增加 = 新增可选字段
- 大版本号增加 = 破坏性变更

### 反馈

通过 GitHub Issues 提交建议和意见。

---

## 附录

### 与现有标准的关系

- **OpenAPI/Swagger**：描述 HTTP API 端点 → AMP 描述 AI 意图
- **JSON Schema**：描述数据结构 → AMP 直接用它定义输入输出
- **OpenAI GPT manifest**：面向单一平台 → AMP 面向全平台

### 意图匹配建议

AI Runtime 在判断是否调用 Skill 时，推荐以下匹配策略：

1. **语义匹配**：将用户意图和 intents 模板都向量化，计算语义相似度
2. **关键词增强**：结合 `tags` 和 `description` 做关键词匹配
3. **上下文感知**：结合对话历史判断意图是否完整
4. **fallback 机制**：无匹配时回退到通用 AI 能力
