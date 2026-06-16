# 📦 将你的 Skill 注册到 AMP

> 让任何 AI Runtime 发现和调用你的 Skill。整个过程只需要一个文件 + 5 分钟。

---

## 三步完成注册

### 1️⃣ 创建 `agent.json`

在你的 GitHub 仓库根目录放一个 `agent.json` 文件。这是你的 Skill 对 AI 世界的"自我介绍"。

**最小示例：**

```json
{
  "$schema": "https://agent-protocol.dev/v0.2/manifest.schema.json",
  "id": "com.yourname.your-skill",
  "name": "你的 Skill 名称",
  "version": "1.0.0",
  "description": "简单描述你的技能",
  "tags": ["你的标签1", "标签2"],
  "author": {
    "name": "你的名字",
    "url": "https://github.com/你的用户名"
  },
  "capabilities": [
    {
      "id": "your_capability",
      "name": "能力名称",
      "description": "这个能力做什么",
      "intents": [
        "用户说{什么}时会触发",
        "users might say {something} to trigger this"
      ],
      "input": {
        "type": "object",
        "properties": {
          "param": { "type": "string", "description": "参数说明" }
        },
        "required": ["param"]
      }
    }
  ],
  "runtime": {
    "engine": "openclaw",
    "engines": ["openclaw"]
  },
  "trust": {
    "permissions": [],
    "sandbox_level": "basic"
  }
}
```

### 2️⃣ 验证格式

用我们的 CLI 工具验证 `agent.json` 是否合规：

```bash
npm install -g @agent-protocol/cli
agent validate ./agent.json
```

或者直接在线验证（开发中）。

### 3️⃣ 提交注册

两种方式：

**方式 A — 提 PR（推荐）**

1. Fork `github.com/Polaris899/agent-protocol`
2. 把你的 `agent.json` 复制到 `registry/<skill-name>.agent.json`
3. 提 Pull Request

**方式 B — 提 Issue**

使用 [Skill 注册模板](https://github.com/Polaris899/agent-protocol/issues/new/choose)，填写 agent.json 内容。

---

## 注册后会发生什么

| 环节 | 说明 |
|------|------|
| ✅ 索引收录 | 你的 Skill 被编入 AMP 路由中心索引 |
| 🔍 可被发现 | 用户搜索意图时，你的 Skill 会出现在结果中 |
| 📈 使用统计 | （开发中）查看你的 Skill 被调用的次数 |
| 🔄 版本更新 | 提 PR 更新索引中的 agent.json |

---

## 最佳实践

### 意图写得好，匹配率就高

```json
// ❌ 差 — 太笼统
"intents": ["查天气"]

// ✅ 好 — 包含不同说法和参数
"intents": [
  "查一下{城市}的天气",
  "今天{城市}冷吗",
  "what's the weather in {city}",
  "{city} の天気は？"
]
```

### 标签选得好，搜索就找得到

```json
// ❌ 差
"tags": ["工具"]

// ✅ 好
"tags": ["天气", "weather", "温度", "降水", "天气预报"]
```

### 描述写清楚，排序就靠前

用一句话说清楚你的 Skill 解决什么问题。前 100 个字符最重要。

```json
"description": "查询实时天气、未来预报和历史数据，支持 200+ 国内外城市"
```

---

## FAQ

**需要安装 OpenClaw 吗？**
不需要。agent.json 只是一个声明文件，任何兼容 AMP 的 Runtime 都可以使用。

**注册收费吗？**
完全不收费。AMP 是开放协议。

**我的代码会开源吗？**
不强制。agent.json 只是一个能力声明。你的核心代码可以保持私有。

**我只有 GPTs（没有代码）能注册吗？**
能。AMP 协议跟实现无关，只描述能力。

**注册后能修改吗？**
能。提 PR 修改 registry/ 下的对应文件即可。

---

有疑问？[提 Issue](https://github.com/Polaris899/agent-protocol/issues) 或 [开始 Discussion](https://github.com/Polaris899/agent-protocol/discussions)。
