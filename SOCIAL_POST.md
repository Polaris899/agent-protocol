我们不需要另一个 AI 应用商店 🧵

过去两年，OpenAI/Coze/字节… 都在做自己的 GPT Store/Bot Store。
一个也没真正跑起来。

因为商店模式在 AI 时代有 3 个死结：
1️⃣ 审核是瓶颈 — 百万级 Skill 没法人工审
2️⃣ 平台锁定 — 开发者不愿为每个平台单独打包
3️⃣ 发现效率低 — 用户翻几千个 Skill 跟翻 App Store 一样

换个思路。
HTTP 不需要中心化注册表，SMTP 不需要，Git 不需要。
AI Skill 分发为什么需要？

我写了一个开放协议：Agent Manifest Protocol (AMP)。
你只需在 GitHub 仓库根目录放一个 agent.json，你的 Skill 就能被任何 AI Runtime 发现和调用。

```
agent install openclaw/weather-skill
# = git clone + 注册，就是这么简单
```

核心设计：
• 意图优先 — 不是描述"有什么 API"，而是描述"能解决什么意图"
• Git 即分发 — 没有中心服务器，没有上架流程，没有分成
• 协议中立 — 不绑定任何平台，OpenClaw/LangChain/CrewAI 都能跑

项目已开源 → github.com/Polaris899/agent-protocol

#AgentProtocol #AIAgent #OpenSource #AI
