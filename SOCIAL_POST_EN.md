We don't need another AI app store 🧵

Over the past two years, every AI platform built their own "store":
— OpenAI made GPT Store
— Coze made Bot Store
— ByteDance, Google, everyone followed

None of them really took off.

Not because of execution. Because the store model has 3 fatal flaws:

1️⃣ Moderation is a bottleneck — millions of skills can't be manually reviewed
2️⃣ Platform lock-in — devs won't package separately for every store
3️⃣ Discovery sucks — browsing thousands of skills is 2010 App Store all over again

What if we flipped the model?

HTTP doesn't need a central registry. SMTP doesn't. Git doesn't.
Why should AI skill distribution?

I built an open protocol: **Agent Manifest Protocol (AMP).**

Put an `agent.json` in your GitHub repo root, and any AI Runtime can discover and invoke your skill.

```json
{
  "$schema": "https://agent-protocol.dev/v0.2/manifest.schema.json",
  "id": "com.openclaw.weather",
  "name": "Weather Assistant",
  "capabilities": [
    {
      "id": "get_weather",
      "name": "Current Weather",
      "intents": [
        "what's the weather in {city} now",
        "is it cold in {city} today"
      ]
    }
  ]
}
```

Install is just git:

```
agent install openclaw/weather-skill
# = git clone + register. That's it.
```

No central server. No submission process. No revenue cut.
Versioning, forking, PRs — the entire GitHub ecosystem, aligned.

**Core design principles:**

• **Intent-first** — not "what endpoints do you have", but "what intents can you resolve". AI routing via semantic matching.

• **Git-as-distribution** — `agent search "analyze financial report"` → top 5 matching manifests → `agent install user/repo`. Decentralized by default.

• **Protocol-neutral** — not tied to any platform. OpenClaw, LangChain, CrewAI, or your own runtime. AMP is a capability routing layer, not another walled garden.

**What's shipping today:**

✅ Protocol spec v0.2 — intent declarations, runtime config, trust & permissions
✅ CLI — `search`, `install`, `list`, `update`, `info`, `validate`
✅ Search engine — GitHub crawler + semantic search API
✅ GPT Store converter — auto-transforms existing GPTs into AMP format
✅ Web search UI
✅ 50+ skills already indexed

All open source → **github.com/Polaris899/agent-protocol**

This isn't a product launch. It's a protocol proposal.

If you build AI runtimes, agent frameworks, or you're a skill dev tired of repackaging for every store — let's talk.

PRs, Issues, Discussions. Whatever.
Protocols grow when people build on them.

---

*"The most powerful distribution isn't helping users find skills. It's making intent flow directly to the right node."*
