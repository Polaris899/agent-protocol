# Skill 注册中心

这个目录收录了 OpenClaw 生态中所有声明了 `agent.json` 的 Skill。  
每个文件命名格式：`<skill-name>.agent.json`

## 公开索引

**当前 Registry 规模：5,051 个 Manifest**

| 来源 | 数量 |
|------|------|
| 原生收录 | 19 |
| GPT Store 转换 | 5,032 |

全部索引可通过 Web UI 或 CLI 搜索：
- **Web UI**: [polaris899.github.io/agent-protocol/](https://polaris899.github.io/agent-protocol/)
- **CLI**: `npx agent-protocol-cli search "关键词"`

## 安装

```bash
# 从 CLI 搜索安装
npx agent-protocol-cli search 天气
npx agent-protocol-cli install openclaw/weather-skill

# 或直接复制 agent.json 到你自己的仓库根目录
```

## 如何添加你的 Skill

1. 在你的 GitHub 仓库根目录创建 `agent.json`（参考 [spec/manifest.md](../spec/manifest.md)）
2. 提一个 PR 把文件加入 `registry/` 目录
3. 或者通过 API 注册：`curl -X POST https://agent-trust-protocol.org/api/register`

## 原生收录

| Skill | 能力数 | 引擎 |
|---|---|---|
| weather | 2 | openclaw |
| fsa-analyzer | 5 | openclaw |
| xiaoyi-web-search | 1 | openclaw |
| xiaoyi-image-understanding | 3 | openclaw |
| xiaoyi-ppt | 2 | openclaw |
| xiaoyi-pdf | 5 | openclaw |
| xiaoyi-xlsx | 3 | openclaw |
| xiaoyi-doc-convert | 1 | openclaw |
| xiaoyi-image-search | 1 | openclaw |
| xiaoyi-health | 2 | openclaw |
| fitness-coach | 3 | openclaw |
| huawei-drive | 2 | openclaw |
| seedream-image_gen | 3 | openclaw |
| xiaoyi-vlog-gen | 1 | openclaw |
| xiaoyi-docx | 2 | openclaw |
| xiaoyi-report | 1 | openclaw |
| minimax-music-gen | 2 | openclaw |
| xiaoyi-file-upload | 1 | openclaw |
| amper | 1 | openclaw |

**共 19 个原生 Skill，40+ 项能力 + 5,032 个 GPTs 转换索引**
