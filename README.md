# Agent Manifest Protocol (AMP) — v0.1

**意图即服务的基础协议。**

AMP 定义了一种机器可读的格式，让任何 AI Agent / Runtime 发现、理解并调用 Skill。  
它不依赖任何中心化平台——一个 `agent.json` 文件就够了。

---

## 核心原则

1. **声明式** — Skill 描述自己"能解决什么意图"，而非"如何实现"
2. **可发现** — 任何公开的 `agent.json` 都是可发现的
3. **无平台锁定** — 协议层中立，任何 Runtime 均可实现
4. **信任透明** — 签名 + 审计 + 开源

---

## 目录结构

```
agent-protocol/
├── README.md              ← 本文件
├── spec/
│   ├── manifest.md         ← 协议规范正文
│   ├── manifest.schema.json ← JSON Schema 校验
│   └── examples/           ← 示例 manifest
├── cli/                    ← CLI 工具源码
├── crawler/                ← GitHub 爬虫 + 索引
└── web/                    ← 搜索 Web UI
```

---

## 快速开始

```bash
# 安装 CLI
npm install -g @agent-protocol/cli

# 搜索 Skill
agent search "分析财报"

# 安装 Skill
agent install openclaw/fsa-analyzer

# 列出已安装
agent list

# 更新所有已安装
agent update
```

---

## 设计哲学

### 为什么是 JSON/YAML？

- 无处不在，任何语言都能解析
- JSON Schema 原生校验
- 便于嵌入 GitHub

### 为什么不用中心化注册表？

参考历史：HTTP 没有中心化注册表，SMTP 没有，Git 没有。  
去中心化的协议比任何中心化平台都活得久。

### 意图优先，能力其次

传统 API 描述"我有什么功能"（端点列表）。  
AMP 描述"我能解决什么意图"（自然语言场景），让 AI 自己判断匹配。

---

## 当前状态

**协议版本：v0.1-draft** — 原型阶段，欢迎讨论和贡献。

---

## License

MIT
