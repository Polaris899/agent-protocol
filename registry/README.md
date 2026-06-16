# Skill 注册中心

这个目录收录了 OpenClaw 生态中所有声明了 `agent.json` 的 Skill。  
每个文件命名格式：`<skill-name>.agent.json`

## 安装

```bash
# 从注册中心安装
agent install openclaw/weather

# 或直接复制 agent.json 到你自己的仓库根目录
```

## 索引

注册的 Skill 已自动编入 [crawler/data/index.json](../crawler/data/index.json)，可通过搜索 API 查询。

## 如何添加你的 Skill

1. 在你的 GitHub 仓库根目录创建 `agent.json`（参考 [spec/manifest.md](../spec/manifest.md)）
2. 提一个 PR 把文件加入 `registry/` 目录
3. 或者直接在项目中添加并提交

## 当前收录

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

**共 18 个 Skill，40+ 项能力**
