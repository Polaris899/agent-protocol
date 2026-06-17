<p align="center">
  <img src="https://img.shields.io/badge/status-stable-brightgreen?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/registry-5051%20manifests-success?style=flat-square" alt="Registry">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

<div align="center">
  <h1>⚡ Agent Manifest Protocol</h1>
  <p><strong>Intent-as-a-Service protocol.</strong><br>
  An open standard for AI agents to discover, understand, and invoke skills — <strong>no store, no permission needed</strong>.</p>
  <p>
    <a href="https://github.com/Polaris899/agent-protocol"><code>github.com/Polaris899/agent-protocol</code></a> &nbsp;·&nbsp;
    <a href="https://polaris899.github.io/agent-protocol/">🌐 Web Registry (5051 Skills)</a> &nbsp;·&nbsp;
    <a href="https://www.npmjs.com/package/agent-protocol-cli"><code>npm: agent-protocol-cli</code></a>
  </p>
</div>

---

## 🌟 Overview

AMP (Agent Manifest Protocol) is an open protocol that defines how AI Agents and Skills discover and collaborate with each other. It requires no centralized platform — **a single `agent.json` file is all it takes.**

```
npx agent-protocol-cli search "financial analysis"
     ↓
Semantic router → top 3 matching Manifests (out of 5,051 candidates)
     ↓
npx agent-protocol-cli install Polaris899/fsa-analyzer
     ↓
git clone + schema validation + registration → ready to use
```

### Why a Protocol, Not a Store?

| Store Model | Protocol Model |
|------------|---------------|
| Requires review and listing | No review needed — Git is distribution |
| Platform lock-in | Protocol-neutral, any Runtime works |
| Manual browsing | AI-powered semantic matching |
| Centralized server | Decentralized, GitHub-native |
| Cold start problem | 5,051 Skills searchable instantly |

---

## 📋 Quick Start

### Search Skills (Zero Install)

```bash
# Natural language search — English and Chinese
npx agent-protocol-cli search "weather"
npx agent-protocol-cli search "financial statement analysis"
npx agent-protocol-cli search "create presentation"
npx agent-protocol-cli search "music generator"
```

### Install a Skill

```bash
# One-step install: git clone + schema validation + registration
npx agent-protocol-cli install Polaris899/fsa-analyzer
npx agent-protocol-cli install openclaw/weather-skill

# View details
npx agent-protocol-cli info fsa-analyzer
```

### Manage Installed Skills

```bash
npx agent-protocol-cli list       # List installed Skills
npx agent-protocol-cli update     # Check and update all Skills
npx agent-protocol-cli validate ./agent.json  # Validate a manifest
```

### 🌐 Web UI (Client-side Search, Zero Backend)

Open **[polaris899.github.io/agent-protocol/](https://polaris899.github.io/agent-protocol/)** — pure browser-based semantic search. The full index of 5,051 Skills loads on first search (9.8MB). No backend server required.

---

## 🗂 Registry Scale

| Metric | Value |
|--------|-------|
| Indexed Manifests | **5,051** |
| Native GitHub Crawler | 19 |
| GPT Store Conversions | 5,032 |
| Supported Engines | OpenClaw, OpenAI GPTs, any custom Runtime |
| Search Capability | Bilingual TF-IDF semantic matching (EN/ZH) |
| Search Speed | Millisecond-level (client-side, local execution) |

**Core Skills (Native Collection):**

| Skill | Capabilities | Engine |
|-------|-------------|--------|
| Weather | 2 | openclaw |
| Financial Statement Analyzer (fsa-analyzer) | 5 | openclaw |
| PPT Generator | 2 | openclaw |
| PDF Toolkit | 5 | openclaw |
| Spreadsheet Tools | 3 | openclaw |
| Web Search | 1 | openclaw |
| Image Understanding | 3 | openclaw |
| Fitness Coach | 3 | openclaw |
| AI Image Generation | 3 | openclaw |
| Deep Research Report | 1 | openclaw |
| Music Generation | 2 | openclaw |
| Document Conversion | 1 | openclaw |
| Vlog Generation | 1 | openclaw |
| ... plus 5,032 GPT conversion indexes | | |

📦 **Full index → [polaris899.github.io/agent-protocol/](https://polaris899.github.io/agent-protocol/)**

---

## 📐 Protocol Specification

At the core is an `agent.json` file that declares the Skill's capabilities, runtime, and trust information.

**Minimal example:**

```json
{
  "$schema": "https://agent-protocol.dev/v1.0/manifest.schema.json",
  "id": "com.openclaw.weather",
  "name": "Weather",
  "version": "1.0.0",
  "capabilities": [
    {
      "id": "get_weather",
      "name": "Current Weather",
      "description": "Get real-time weather for any city",
      "intents": [
        "what's the weather in {city}",
        "{city} temperature today",
        "现在{城市}的天气怎么样"
      ],
      "input": {
        "type": "object",
        "properties": {
          "city": { "type": "string", "description": "City name" }
        },
        "required": ["city"]
      }
    }
  ]
}
```

📖 **Full specification → [spec/manifest.md](spec/manifest.md)**

Core design principles:

- **Intent-first** — describe "what intent can you fulfill", not "what API do you have"
- **Semantic matching** — AI matches intent templates via TF-IDF vectors, no exact keywords needed
- **Trust transparency** — signatures + community audit + sandbox levels
- **Chainable calls** — capabilities can declare dependencies on each other
- **Decentralized** — Git is distribution, GitHub Pages is the index, PRs are listings

---

## 🏗 Architecture

```
agent-protocol/
├── spec/               ← Protocol specification v1.0 + JSON Schema
├── cli/                ← CLI tool (npm: agent-protocol-cli)
│   ├── bin/agent.js    ← search/install/list/update/info/validate
│   └── src/            ← Search engine, installer, update checker
├── crawler/            ← GitHub crawler + OpenAI GPTs converter
├── converter/          ← GPT Store → AMP converter (mass compatibility layer)
│   ├── gpt-generator.js  ← Auto-generate 5000+ GPT manifests
│   └── bulk-register.js  ← Batch register into index
├── registry/           ← Native Skill manifests (18 Skills)
├── web/                ← Web search UI source
├── api/                ← Vercel Serverless functions (optional API backend)
│   ├── /route          ← Intent routing center
│   ├── /register       ← Dynamic registration
│   ├── /search         ← HTTP search interface
│   └── /health         ← Health check
├── index.html          ← Web search UI (**pure client-side, zero backend dependencies**)
├── search-engine.js    ← TF-IDF client-side search engine (2KB)
└── search-data.js      ← Search index data (9.8MB, loaded on demand)
```

**No backend required for search.** The Web UI has a complete TF-IDF search engine built in, performing semantic matching entirely in the browser.
The API service (`api/`) provides an optional search/registration channel for CLI and third-party integrations.

---

## 🔧 Register Your Skill

Two ways to get your Skill into the public index:

### Option 1: Submit a PR

Copy your `agent.json` to `registry/` directory and submit a PR.

### Option 2: Self-host

Make sure your GitHub repository root contains `agent.json`, then register via the API:

```bash
curl -X POST https://agent-trust-protocol.org/api/register \
  -H "Content-Type: application/json" \
  -d '{"repo": "your-org/your-skill"}'
```

---

## 🛠 Tech Stack

- **Protocol definition**: JSON Schema v1.0
- **CLI**: Node.js, Commander, TF-IDF semantic search
- **Search engine**: Pure frontend TF-IDF + cosine similarity (CJK-compatible)
- **Frontend**: Vanilla HTML + JS (zero framework, zero dependencies)
- **Backend API**: Vercel Serverless Functions
- **Converter**: Node.js, YAML parsing, GPT Store API
- **Runtime compatible**: OpenClaw, OpenAI GPTs, any Runtime

---

## 🤝 How to Contribute

AMP is an open community protocol. All forms of participation are welcome:

- **🐛 Report Bugs** → [Open an Issue](https://github.com/Polaris899/agent-protocol/issues/new)
- **💡 Suggest Features** → [Start a Discussion](https://github.com/Polaris899/agent-protocol/discussions/new)
- **📦 Register Your Skill** → Submit a PR to `registry/`
- **📖 Improve Docs** → PR on `spec/manifest.md`
- **🛠 Implement Runtime Compatibility** → Implement AMP in any AI Runtime

---

## 🌐 Community

- **Zhihu** → [We Don't Need Another AI App Store](https://www.zhihu.com/pin/2050191125743417137)
- **Hacker News** → *[Awaiting release window]*
- **GitHub Issues** → [Report Bugs / Suggestions](https://github.com/Polaris899/agent-protocol/issues)
- **GitHub Discussions** → [Join the Discussion](https://github.com/Polaris899/agent-protocol/discussions)

---

## 📄 License

MIT License — **The protocol itself has no copyright. Your Skill, your rules.**

---

<p align="center">
  <sub>The most powerful distribution isn't helping users find Skills — it's letting intents flow directly to execution nodes.</sub>
  <br>
  <sub>5,051 Skills ready, waiting for a Runtime to invoke them.</sub>
</p>
