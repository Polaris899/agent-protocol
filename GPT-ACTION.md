# GPT Action 配置指南

## 3 行配置即可使用

在 ChatGPT 的 **Actions 配置页**（或任何兼容的 GPT Action 配置页面）中：

```
1. API Endpoint:
   https://api.agent-trust-protocol.org

2. Authentication:
   None (public API)

3. Import OpenAPI spec:
   从以下 URL 导入：
   https://api.agent-trust-protocol.org/api/route
   （或使用仓库中的 gpt-action.yaml）
```

导入后 ChatGPT 会自动拥有 `routeIntent` 操作，可以通过自然语言搜索 5,051 个 Skill。

## 手动 YAML 配置

如果平台要求手动粘贴 OpenAPI 配置：

```yaml
openapi: 3.0.0
info:
  title: AMP Intent Router
  description: 5,051 AI Skills, routed by natural language intent
  version: 1.0.0
servers:
  - url: https://api.agent-trust-protocol.org
paths:
  /api/route:
    post:
      operationId: routeIntent
      summary: Find matching AI Skill for a user intent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [intent]
              properties:
                intent:
                  type: string
      responses:
        "200":
          description: Route result (top match + alternatives + scores)
```

## 调用示例

**请求：**
```json
POST https://api.agent-trust-protocol.org/api/route
{
  "intent": "帮我分析财务报表",
  "user_id": "user123"
}
```

**响应：**
```json
{
  "matched": true,
  "intent": "帮我分析财务报表",
  "top_match": { "name": "财务规划师 v36", "score": 0.44 },
  "alternatives": [ ... ],
  "total_matches": 20
}
```

## 端到端测试结果 (2026-06-17)

```
✅ "帮我分析财务报表"            → 财务规划师 v36      (score: 0.44)
✅ "今天天气怎么样"              → 天气查询           (score: 0.83)
✅ "生成一份 PPT"               → PPT 生成器          (score: 0.47)
✅ "写一首歌"                   → 音乐创作            (score: 0.30)
✅ "画一幅画"                   → 插画设计师 v36      (score: 0.53)
✅ "搜索最新的AI新闻"           → 联网搜索            (score: 0.40)
✅ "分析这个Excel表格"          → 电子表格工具        (score: 0.46)
✅ "帮我写份研究报告"           → 深度研究报告        (score: 0.58)
✅ "上传一个文件"               → 文件上传            (score: 0.88)
✅ "convert this docx to PDF"  → PDF 工具箱          (score: 0.14)
✅ "create a presentation"     → PPT 生成器          (score: 0.12)
```
