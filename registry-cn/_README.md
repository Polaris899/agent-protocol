# 中国区 Registry

此目录用于部署到中国境内的 AMP Registry 实例。

中文版 agent.json 从这里发布到国内 API。

格式与 `registry/` 相同，但 name/description 使用中文，intents 中文优先。

提交 PR 到本目录即视为申请发布到中国区。

---

## 说明

- 国际版 `registry/`：name/description 为英文，intents 优先英文，同时保留中文
- 国内版 `registry-cn/`：name/description 为中文，intents 优先中文，同时保留英文
- 两个 Registry 使用同一套协议格式，开发者只需维护一个 `agent.json`，通过 `name`/`name_zh` 等字段同时出现在两个生态
