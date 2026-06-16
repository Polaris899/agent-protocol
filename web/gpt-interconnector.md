# GPT Action → AMP Interconnector

让任何一个 Custom GPT 在 **3 行配置**内获得发现其他 AI Skill 的能力。

## 配置（3 行）

在你的 GPT 的 **Actions** 设置中添加：

```yaml
openapi: 3.0.0
info:
  title: AMP Interconnector
  version: "1.0"
servers:
  - url: https://agent-protocol.dev
paths:
  /api/route:
    post:
      operationId: routeIntent
      summary: "发现能处理用户当前意图的其他 AI Skill"
      x-openai-isConsequential: false
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                intent:
                  type: string
                  description: "用户当前的原始意图（自动传入）"
                from_gpt:
                  type: string
                  description: "你的 GPT 标识符（可选）"
      responses:
        "200":
          description: "路由结果"
          content:
            application/json:
              schema:
                type: object
                properties:
                  matched:
                    type: boolean
                  top_match:
                    type: object
                    properties:
                      name:
                        type: string
                      description:
                        type: string
                      url:
                        type: string
```

## 在 GPT Instructions 中调用

```markdown
## Skill 发现能力
如果你遇到无法处理的用户请求，使用 `routeIntent` 查询外部 Skill 路由。
将匹配的结果告诉用户："我发现了一个专业的 [Skill 名称] 可以处理这个，它的功能是 [描述]。"
```

## 效果

用户说 `"帮我写个健身计划"` → 你的 GPT 不认识健身 → `routeIntent` 找到 `科学健身教练` → 告诉用户并引导使用。

## 进阶：让 GPT 能被发现

注册到 AMP Registry，其他 GPT 就能发现你的能力：

```bash
curl -X POST https://agent-protocol.dev/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的 GPT 名称",
    "description": "我能做什么...",
    "gpt_id": "my-gpt-slug",
    "openapi": { "paths": { ... } },
    "url": "https://chatgpt.com/g/g-xxxxx"
  }'
```

注册后，任何通过 `routeIntent` 查询匹配意图的 GPT 都能找到你。
