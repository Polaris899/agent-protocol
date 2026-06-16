<p align="center">
  <img src="https://img.shields.io/badge/status-active--development-blue?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/version-0.1.0--draft-orange?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
</p>

<div align="center">
  <h1>⚡ Agent Manifest Protocol</h1>
  <p><strong>意图即服务的底层协议。</strong><br>
  让 AI 发现、理解、调用 Skill 的开放标准。</p>
</div>

---

## 🌟 概述

AMP 是一个开放协议，定义了 AI Agent/Skill 之间如何互相发现和协作。它不依赖任何中心化平台——**一个 `agent.json` 文件就够了。**

```
agent search "分析财报"
     ↓
路由中心 → top 3 匹配的 Manifest
     ↓
agent install openclaw/fsa-analyzer
     ↓
git clone + 注册 → 即装即用
```

### 为什么是协议，而不是商店？

| 商店模式 | 协议模式 |
|---------|---------|
| 需要审核上架 | 无需审核，Git 即分发 |
| 平台锁定 | 协议中立，任何 Runtime 可用 |
| 用户手动浏览 | AI 自动语义匹配 |
| 中心化服务器 | 去中心化，GitHub 原生 |

---

## 📋 快速开始

### 安装 CLI

```bash
npm install -g @agent-protocol/cli
```

### 搜索 Skill

```bash
# 自然语言搜索
agent search "天气"
agent search "财务报表分析"
agent search "生成 PPT"

# 查看详情
agent info 天气助手
```

### 安装 Skill

```bash
agent install openclaw/weather-skill
```

### 管理已安装

```bash
agent list      # 列出已安装
agent update    # 更新所有
```

---

## 📐 协议规范

核心是一个 `agent.json` 文件，声明 Skill 的能力、运行时和信任信息。

**最小示例：**

```json
{
  "$schema": "https://agent-protocol.dev/v0.2/manifest.schema.json",
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
- **语义匹配** — AI 通过意图模板匹配，不需要精确关键词
- **信任透明** — 签名 + 社区审计 + 沙箱级别
- **链式调用** — 能力之间可声明依赖关系

---

## 🗂 注册 Skill

如果你的 Skill 有 `agent.json`，想让它在公开索引中被发现：

### 方式一：提 PR

将你的 `agent.json` 复制到 `registry/` 目录并提 PR。

### 方式二：自托管

确保你的 GitHub 仓库根目录包含 `agent.json`，搜索引擎会自动发现它。

### 当前收录

| Skill | 能力数 | 引擎 |
|---|---|---|
| 天气查询 | 2 | openclaw |
| 财报分析专家 | 5 | openclaw |
| PPT 生成器 | 2 | openclaw |
| PDF 工具箱 | 5 | openclaw |
| 电子表格工具 | 3 | openclaw |
| 联网搜索 | 1 | openclaw |
| 图像理解 | 3 | openclaw |
| 科学健身教练 | 3 | openclaw |
| AI 图像创作 | 3 | openclaw |
| 深度研究报告 | 1 | openclaw |
| ... 更多 | | |

**共 18 个 OpenClaw Skill + 30+ 个 GPT Store Skill，50+ Manifest 编入索引**

📦 **完整列表 → [registry/](registry/)**

---

## 🏗 项目架构

```
agent-protocol/
├── spec/               ← 协议规范 + JSON Schema
├── cli/                ← CLI 工具（search/install/list/update/info/validate）
├── crawler/            ← GitHub 爬虫 + 搜索 API
├── converter/          ← GPT Store → AMP 转换器（寄生兼容层）
├── registry/           ← 已注册的 Skill 清单
├── web/                ← Web 搜索 UI
└── ...
```

---

## 🛠 技术栈

- **协议定义**: JSON Schema
- **CLI**: Node.js, Commander
- **搜索引擎**: Node.js + 语义搜索
- **转换器**: Node.js, YAML 解析
- **运行时**: OpenClaw (及任何兼容 Runtime)

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
- **GitHub Issues** → [提 Bug / 建议](https://github.com/Polaris899/agent-protocol/issues)
- **GitHub Discussions** → [参与讨论](https://github.com/Polaris899/agent-protocol/discussions)

## 📄 许可

MIT License

---

<p align="center">
  <sub>最强大的分发，不是让用户找到 Skill，而是让意图直接流向执行节点。</sub>
</p>
