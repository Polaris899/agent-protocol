# agent-protocol-cli

**Discover and install AI Skills — no store needed.**

The official CLI for the [Agent Manifest Protocol](https://github.com/Polaris899/agent-protocol) — an open, decentralized registry of **5,051 AI capabilities** that work across any runtime.

```bash
npx agent-protocol-cli search 财报分析
npx agent-protocol-cli install Polaris899/fsa-analyzer
```

## Features

- 🔍 **Semantic search** — TF-IDF vector matching across 5,051 manifests. Search in any language (CJK supported).
- 📦 **One-command install** — `agent install user/repo` clones, validates, and registers a Skill.
- ✅ **Schema validation** — Every manifest is validated against the AMP Schema v1.0.
- 🔄 **Update management** — `agent update` checks all installed Skills for new versions.
- 🏷️ **Rich metadata** — Capabilities, intents, permissions, audit status, all in the search results.

## Quick Start

```bash
# Search across 5,051 Skills
npx agent-protocol-cli search 天气

# Install a Skill
npx agent-protocol-cli install Polaris899/fsa-analyzer

# List installed Skills
npx agent-protocol-cli list

# Get detailed info
npx agent-protocol-cli info fsa-analyzer

# Validate a manifest
npx agent-protocol-cli validate ./agent.json

# Check version
npx agent-protocol-cli --version
```

## Registry

Browse the full 5,051-Skill registry at **[polaris899.github.io/agent-protocol](https://polaris899.github.io/agent-protocol/)**

## Protocol Spec

The Agent Manifest Protocol defines a standard JSON schema for describing AI Skills:

- **Interoperable** — Works with any agent runtime (OpenClaw, OpenAI GPTs, custom)
- **Decentralized** — Skills live on GitHub, no central store required
- **Safe by design** — Sandbox levels, permission declarations, verified audits
- **Scaled** — 5,051 manifests already indexed

Read the spec: [`spec/manifest.md`](https://github.com/Polaris899/agent-protocol/blob/main/spec/manifest.md)

## License

MIT
