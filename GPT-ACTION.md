# GPT Action 配置指南

## 🚀 3 行配置接入

在 ChatGPT 的 **Actions 配置页**（GPT Builder → Configuration → Add Action）：

```
Name:  AMP Intent Router
Server URL:  https://api.agent-trust-protocol.org
Import:  https://api.agent-trust-protocol.org/api/openapi.json
```

**完成。** 你的 GPT 现在能发现 5,051 个 Skill 并找到能处理用户意图的那个。

---

## 接入后你得到了什么

GPT 会自动获得一个 `routeIntent` 操作，调用方式：

```json
POST https://api.agent-trust-protocol.org/api/route
{
  "intent": "<用户的自然语言意图>"
}
```

返回：

```json
{
  "matched": true,
  "top_match": {
    "name": "财报分析专家",
    "description": "企业财务报表深度分析",
    "score": 0.44
  },
  "alternatives": [
    { "name": "财务规划师 v36", "score": 0.21 }
  ],
  "total_matches": 20
}
```

---

## 在你的 GPT Instructions 中推荐的系统提示

在 GPT Builder 的 Instructions 中增加以下逻辑：

```
## 能力外链（AMP Intent Router）
你接入了一个外部技能路由网络（AMP），拥有 5,051 个注册 Skill 的发现能力。

路由规则：
1. 收到用户意图后，如果属于你的核心能力范围，直接执行
2. 如果用户需求超出你的能力范围（例如：用户要分析财务报表但你的强项是写作），
   调用 routeIntent 查询路由中心，找到最匹配的 Skill
3. 将查询结果告诉用户：
   "这个问题我可以请我的同事【[Skill名称]】来处理，它有[Skill描述]的能力，
   是否要让它来回答？"
4. 如果用户确认，直接通过路由中心获取 Skill 的详细信息并代理执行
```

---

## 示例对话流

**用户：** 帮我分析这份财务报表
**你的 GPT（假设它是通用写作助手）：**
→ 调用 `routeIntent("帮我分析财务报表")`
→ 返回 `top_match = {"name": "财报分析专家", "score": 0.44}`
→ 回复用户：
   "我虽然擅长写作，但专业财务分析我更推荐请教我的同事「财报分析专家」，
   它在财务报表深度分析（含杜邦分解和舞弊检测）方面非常专业。
   要我帮您转接它来处理吗？"

---

## 端到端验证结果

```
POST /api/route
├── "帮我分析财务报表"           → 财务规划师 v36     (0.44) ✅
├── "今天天气怎么样"             → 天气查询           (0.83) ✅
├── "生成一份 PPT"              → PPT 生成器          (0.47) ✅
├── "写一首歌"                  → 音乐创作            (0.30) ✅
├── "画一幅画"                  → 插画设计师 v36      (0.53) ✅
├── "搜索最新的AI新闻"          → 联网搜索            (0.40) ✅
├── "分析这个Excel表格"         → 电子表格工具        (0.46) ✅
├── "帮我写份研究报告"          → 深度研究报告        (0.58) ✅
├── "上传一个文件"              → 文件上传            (0.88) ✅
├── "convert this docx to PDF" → PDF 工具箱          (0.14) ✅
└── "create a presentation"    → PPT 生成器          (0.12) ✅
```

---

## 隐私 & 安全

- 所有 API 公开访问，无需认证
- 路由查询仅返回 Skill 元信息（名称、描述、分数），**不传输用户数据**
- 路由中心不存储任何对话历史
- 每次查询独立处理，无状态

---

## 获取支持

- GitHub：https://github.com/Polaris899/agent-protocol
- Web UI：https://polaris899.github.io/agent-protocol/
- 安装 CLI：`npx agent-protocol-cli search <你的意图>`
