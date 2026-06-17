<!-- This is the Chinese version for domestic deployment. -->

<p align="center">
  <img src="https://img.shields.io/badge/status-stable-brightgreen?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/registry-5051%20manifests-success?style=flat-square" alt="Registry">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

<div align="center">
  <h1>⚡ Agent Manifest Protocol</h1>
  <p><strong>意图即服务的底层协议。</strong><br>
  让 AI 发现、理解、调用 Skill 的开放标准 — <strong>无需商店，无需审查</strong>。</p>
  <p>
    <a href="https://github.com/Polaris899/agent-protocol"><code>github.com/Polaris899/agent-protocol</code></a> &nbsp;·&nbsp;
    <a href="https://polaris899.github.io/agent-protocol/">🌐 Web Registry (5051 Skills)</a> &nbsp;·&nbsp;
    <a href="https://www.npmjs.com/package/agent-protocol-cli"><code>npm: agent-protocol-cli</code></a>
  </p>
</div>

---

## 🌟 概述

AMP (Agent Manifest Protocol) 是一个开放协议，定义了 AI Agent/Skill 之间如何互相发现和协作。它不依赖任何中心化平台——**一个 `agent.json` 文件就够了。**

```
npx agent-protocol-cli search "分析财报"
     ↓
语义路由器 → top 3 匹配的 Manifest（5051 个候选中）
     ↓
npx agent-protocol-cli install Polaris899/fsa-analyzer
     ↓
git clone + schema 校验 + 注册 → 即装即用
```

### 为什么是协议，而不是商店？

| 商店模式 | 协议模式 |
|---------|---------|
| 需要审核上架 | 无需审核，Git 即分发 |
| 平台锁定 | 协议中立，任何 Runtime 可用 |
| 用户手动浏览 | AI 自动语义匹配 |
| 中心化服务器 | 去中心化，GitHub 原生 |
| 冷启动难题 | 5051 个 Skill 立即可搜索 |

---

## 📋 快速开始

### 搜索 Skill（零安装）

```bash
# 自然语言搜索 — 英中皆可
npx agent-protocol-cli search "天气"
npx agent-protocol-cli search "财务报表分析"
npx agent-protocol-cli search "生成 PPT"
npx agent-protocol-cli search "music generator"
```

### 安装 Skill

```bash
# 一步安装：git clone + schema 校验 + 注册
npx agent-protocol-cli install Polaris899/fsa-analyzer
npx agent-protocol-cli install openclaw/weather-skill

# 查看详情
npx agent-protocol-cli info fsa-analyzer
```

### 管理已安装

```bash
npx agent-protocol-cli list       # 列出已安装
npx agent-protocol-cli update     # 检查并更新所有 Skill
npx agent-protocol-cli validate ./agent.json  # 校验 manifest
```

### 🌐 Web UI（客户端搜索，零后端）

打开 **[polaris899.github.io/agent-protocol/](https://polaris899.github.io/agent-protocol/)** — 纯浏览器端语义搜索，所有 5051 个 Skill 的索引在首次搜索时按需加载（9.8MB），无需后端服务器。

---

## 🗂 当前 Registry 规模

| 指标 | 数据 |
|------|------|
| 已索引 Manifest | **5,051** |
| GitHub 爬虫原生 | 19 |
| GPT Store 转换 | 5,032 |
| 可用引擎 | OpenClaw, OpenAI GPTs, 任意自定义 Runtime |
| 搜索能力 | 英中双语 TF-IDF 语义匹配 |
| 搜索速度 | 毫秒级（客户端本地执行） |

**核心 Skill（原生收录）：**

| Skill | 能力数 | 引擎 |
|---|---|---|
| 天气查询 (weather) | 2 | openclaw |
| 财报分析专家 (fsa-analyzer) | 5 | openclaw |
| PPT 生成器 | 2 | openclaw |
| PDF 工具箱 | 5 | openclaw |
| 电子表格工具 | 3 | openclaw |
| 联网搜索 | 1 | openclaw |
| 图像理解 | 3 | openclaw |
| 科学健身教练 | 3 | openclaw |
| AI 图像创作 | 3 | openclaw |
| 深度研究报告 | 1 | openclaw |
| 音乐生成 | 2 | openclaw |
| 文档转换 | 1 | openclaw |
| 手机录屏成片 | 1 | openclaw |
| ... 另有 5,032 个 GPTs 转换索引 | | |

📦 **完整索引 → [polaris899.github.io/agent-protocol/](https://polaris899.github.io/agent-protocol/)**

---

## 📐 协议规范

核心是一个 `agent.json` 文件，声明 Skill 的能力、运行时和信任信息。

**最小示例：**

```json
{
  "$schema": "https://agent-protocol.dev/v1.0/manifest.schema.json",
  "id": "com.openclaw.weather",
  "name": "天气助手",
  "version": "1.0.0",
  "capabilities": [
    {
      "id": "get_weather",
      "name": "查询天气",
      "description": "根据城市名查询实时天气",
      "intents": [
        "现在{城市}的天气怎么样",
        "{城市}今天冷吗",
        "what's the weather in {city}"
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

📖 **完整规范 → [spec/manifest.md](spec/manifest.md)**

核心设计原则：

- **意图优先** — 描述"能解决什么意图"，而非"有什么 API"
- **语义匹配** — AI 通过 TF-IDF 向量匹配意图模板，无需精确关键词
- **信任透明** — 签名 + 社区审计 + 沙箱级别
- **链式调用** — 能力之间可声明依赖关系
- **去中心化** — Git 即分发，GitHub Pages 即索引，PR 即上架

---

## 🏗 项目架构

```
agent-protocol/
├── spec/               ← 协议规范 v1.0 + JSON Schema
├── cli/                ← CLI 工具（npm: agent-protocol-cli）
│   ├── bin/agent.js    ← search/install/list/update/info/validate
│   └── src/            ← 搜索引擎、安装器、更新检查
├── crawler/            ← GitHub 爬虫 + OpenAI GPTs 转换器
├── converter/          ← GPT Store → AMP 转换器（批量寄生兼容层）
│   ├── gpt-generator.js  ← 自动生成 5000+ GPT manifests
│   └── bulk-register.js  ← 批量注册到索引
├── registry/           ← 原生收录 Skill 清单（18 个）
├── web/                ← Web 搜索 UI 源码
├── api/                ← Vercel Serverless 函数（备选 API 后端）
│   ├── /route          ← 意图路由中心
│   ├── /register       ← 动态注册
│   ├── /search         ← HTTP 搜索接口
│   └── /health         ← 健康检查
├── index.html          ← Web 搜索 UI（**纯客户端，零后端依赖**）
├── search-engine.js    ← TF-IDF 客户端搜索引擎（2KB）
└── search-data.js      ← 搜索索引数据（9.8MB, 按需加载）
```

**搜索无需后端服务。** Web UI 内置完整的 TF-IDF 搜索引擎，浏览器本地完成语义匹配。
API 服务（`api/`）为 CLI 和第三方集成提供备选搜索/注册通道。

---

## 🔧 注册你的 Skill

有两种方式让你的 Skill 出现在公开索引中：

### 方式一：提 PR

将你的 `agent.json` 复制到 `registry/` 目录并提 PR。

### 方式二：自托管

确保你的 GitHub 仓库根目录包含 `agent.json`，然后通过 API 注册：

```bash
curl -X POST https://agent-trust-protocol.org/api/register \
  -H "Content-Type: application/json" \
  -d '{"repo": "your-org/your-skill"}'
```

---

## 🛠 技术栈

- **协议定义**: JSON Schema v1.0
- **CLI**: Node.js, Commander, TF-IDF 语义搜索
- **搜索引擎**: 纯前端 TF-IDF + cosine similarity（支持 CJK）
- **前端**: 原生 HTML + JS（零框架，零依赖）
- **后端 API**: Vercel Serverless Functions
- **转换器**: Node.js, YAML 解析, GPT Store API
- **运行时兼容**: OpenClaw, OpenAI GPTs, 任意 Runtime

---

## 🤝 如何贡献

AMP 是一个开放的社区协议。欢迎各种形式的参与：

- **🐛 报告 Bug** → [提 Issue](https://github.com/Polaris899/agent-protocol/issues/new)
- **💡 建议功能** → [开 Discussion](https://github.com/Polaris899/agent-protocol/discussions/new)
- **📦 注册你的 Skill** → 提 PR 到 `registry/` 目录
- **📖 完善文档** → PR 修改 `spec/manifest.md`
- **🛠 实现 Runtime 兼容** → 在任何 AI Runtime 中实现 AMP 协议

---

## 🌐 社区

- **知乎** → [我们不需要另一个 AI 应用商店](https://www.zhihu.com/pin/2050191125743417137)
- **Hacker News** → *[等待发布窗口]*
- **GitHub Issues** → [提 Bug / 建议](https://github.com/Polaris899/agent-protocol/issues)
- **GitHub Discussions** → [参与讨论](https://github.com/Polaris899/agent-protocol/discussions)

---

## 📄 许可

MIT License — **协议本身无版权。你的 Skill，你做主。**

---

<p align="center">
  <sub>最强大的分发，不是让用户找到 Skill，而是让意图直接流向执行节点。</sub>
  <br>
  <sub>5,051 个 Skill 已就绪，等待一个 Runtime 来调用它们。</sub>
</p>
