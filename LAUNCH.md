# Agent Manifest Protocol — 我们不需要另一个应用商店

## 开门见山

过去两年，每个 AI 平台都在做自己的"应用商店"：
- OpenAI 做了 GPT Store
- Coze 做了 Bot Store
- 字节做了扣子商店
- 各家都有自己的插件市场

**但一个也没真正跑起来。**

不是执行的问题，是模式的问题。商店模式天生有三个死结：

1. **审核是瓶颈** — 百万级 Skill 不可能靠人工审
2. **平台锁定** — 开发者不愿意为每个平台单独打包
3. **发现效率低** — 用户在一个商店里翻几千个 Skill，跟早期 App Store 一样

## 换个思路

HTTP 不需要中心化注册表，SMTP 不需要，Git 不需要。  
AI Skill 分发为什么需要？

**Agent Manifest Protocol (AMP)** 是一个开放的、去中心化的协议。  
你只需要在 GitHub 仓库根目录放一个 `agent.json`，你的 Skill 就能被任何 AI Runtime 发现和调用。

```json
{
  "$schema": "https://agent-protocol.dev/v0.2/manifest.schema.json",
  "id": "com.openclaw.weather",
  "name": "天气助手",
  "capabilities": [
    {
      "id": "get_weather",
      "name": "查询当天天气",
      "intents": [
        "现在{城市}的天气怎么样",
        "{城市}现在多少度"
      ],
      "input": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "description": "城市名称" }
        },
        "required": ["city"]
      }
    }
  ]
}
```

## 核心设计

**意图优先，能力其次**  
传统的 API 描述"我有什么端点"，AMP 描述"我能解决什么意图"。  
AI 通过语义匹配来路由，而不是翻文档。

**Git 即分发**  
```
agent install openclaw/weather-skill
# = git clone + 读取 manifest + 注册到本地 Runtime
```

没有中心服务器，没有上架流程，没有分成。版本管理、Fork、PR——所有 GitHub 生态的能力天然对齐。

**协议中立**  
AMP 不绑定任何 Runtime。你可以跑在 OpenClaw、LangChain、CrewAI 或任何兼容引擎上。  
它是一层"能力路由协议"，不是又一个平台。

## 今天能做什么

**如果你是 Skill 开发者：**
- 在你的仓库根目录放一个 `agent.json`（参考 [spec/examples/weather-agent.json](spec/examples/weather-agent.json)）
- 用 `agent validate` 校验格式
- 你的 Skill 自动进入公开索引

**如果你是 AI Runtime 开发者：**
- 实现 AMP 协议的搜索 API 和 manifest 解析
- 让用户的查询自动路由到最优 Skill

**如果你只是好奇：**
```
npm install -g @agent-protocol/cli
agent search "财报分析"
agent info "天气助手"
```

## 当前状态

- 协议规范 v0.2-draft ✅
- CLI 工具（search/install/list/update/validate） ✅
- GitHub 爬虫 + 搜索 API ✅
- GPT Store → AMP 转换器（寄生兼容层） ✅
- Web 搜索 UI ✅

项目完全开源：**github.com/Polaris899/agent-protocol**

## 下一步

这不是又一个产品发布。这是一个标准提案。  
如果你是做 AI Runtime、Agent 框架、或者被应用商店折磨过的 Skill 开发者——欢迎来聊聊。

PR、Issue、讨论，什么都行。  
协议是大家一起长出来的。

---

*"最强大的分发，不是让用户找到 Skill，而是让意图直接流向执行节点。"*
