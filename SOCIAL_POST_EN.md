# Show HN: Agent Manifest Protocol – Decentralized AI Skill Distribution

We built an open protocol for discovering and installing AI Skills — no store required.

Put an `agent.json` in your GitHub repo, and `agent install user/repo` just works.

**Why not another store?**

Every AI platform (OpenAI, Coze, ByteDance) built their own store. None took off. Three fatal flaws:
- Moderation bottleneck — millions of skills can't be manually reviewed
- Platform lock-in — devs won't package separately for every store
- Discovery sucks — browsing thousands of skills is 2010 App Store all over again

**What we did instead → an open protocol**

```
# Semantic search (TF-IDF vector matching, CJK support)
agent search "analyze financial statements"

# One-command install
agent install Polaris899/fsa-analyzer
# = git clone + schema validate + register. Done.
```

**Key design decisions:**
- Intent-first routing → not "what endpoints", but "what intents can you resolve"
- Git-as-distribution → versioning, forking, PRs — the entire GitHub ecosystem
- Protocol-neutral → works with any runtime (OpenClaw, LangChain, GPTs, custom)

**What ships today:**
- Protocol spec v1.0 (stable) with JSON Schema
- CLI: search (semantic), install, list, update, info, validate
- Web registry with semantic search
- 50+ skills indexed (OpenClaw skills + GPTs)
- GPT-to-AMP converter

Everything open source → github.com/Polaris899/agent-protocol

This isn't a product launch. It's a protocol proposal. PRs, issues, discussions welcome.

---

*"The most powerful distribution isn't helping users find skills. It's making intent flow directly to the right node."*
