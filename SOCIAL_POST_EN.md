Show HN: Agent Manifest Protocol – Decentralized AI Skill Distribution

I built an open protocol for discovering and installing AI Skills.

Put an `agent.json` in your GitHub repo, and anyone can install it:

```
npx agent-protocol-cli search "analyze financial reports"
npx agent-protocol-cli install Polaris899/fsa-analyzer
# git clone + schema validate + register. That's it.
```

Why I built this: Every AI platform (OpenAI, Coze, ByteDance) built their own "stores." None worked. Moderation bottlenecks, platform lock-in, and 2010 App Store discovery are unsolvable with centralization.

HTTP doesn't need a central registry. Git doesn't. AI skills shouldn't either.

Key design decisions:
- Intent-first routing → not "what endpoints", but "what intents can you resolve"
- Git-as-distribution → versioning, forking, PRs — everything you already know
- Protocol-neutral → works with any runtime (OpenClaw, LangChain, custom agents)
- Semantic search → TF-IDF vector matching with CJK support, runs locally

What's shipping today:
- Protocol spec v1.0 (stable) with JSON Schema
- CLI: semantic search, install, list, update, info, validate
- npm package: npx agent-protocol-cli
- Web registry with semantic search: polaris899.github.io/agent-protocol
- 50+ skills already indexed (including GPTs)
- GPT-to-AMP converter included

Everything is open source: github.com/Polaris899/agent-protocol

This isn't a product launch. It's a protocol proposal. PRs, issues, discussions welcome.
