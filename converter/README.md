# GPTs → AMP 自动转换器

**将 OpenAI GPT Store、Coze Bot 等现有生态的配置自动转换为 Agent Manifest 格式。**  
这是寄生策略的核心引擎——你的路由中心第一天就能宣称"兼容数万个已有 Skill"。

---

## 工作原理

```
GPT Store API / 爬虫
      │
      ▼
原始 GPT 配置 (openapi.yaml + instructions)
      │
      ▼
GPTs → AMP 转换器
      │
      ├─ 提取意图（从 GPT name + description + instructions）
      ├─ 映射输入输出（从 openapi.yaml）
      ├─ 推断信任等级（从权限声明）
      └─ 标准化为 agent.json
      │
      ▼
写入 crawler/data/index.json
```

---

## 支持的源格式

| 来源 | 格式 | 提取策略 |
|---|---|---|
| OpenAI GPT Store | openapi.yaml + instructions | LLM 意图推断 |
| Coze Bot | API 配置 | 功能提取 |
| Dify Agent | DSL 配置 | 工具链提取 |
| GitHub agent.json | 原生 AMP | 直接索引 |

---

## 安装

```bash
cd converter
npm install
```

## 使用

```bash
# 从本地 GPTs 配置文件转换
node convert.js --input ./gpts/my-gpt.yaml --output ./output/agent.json

# 批量转换目录
node convert.js --dir ./gpts/ --out-dir ./output/

# 从 GPT Store URL 抓取并转换
node convert.js --url https://chatgpt.com/g/g-xxxxxxx

# 爬取 GPT Store 热门 GPTs（需要设置 OPENAI_API_KEY）
OPENAI_API_KEY=sk-xxx node convert.js --scrape-store --limit 100
```

---

## 架构

```
converter/
├── index.js              # 主入口
├── parsers/
│   ├── gpt-store.js      # OpenAI GPT Store 解析器
│   ├── coze.js           # Coze 配置解析器
│   └── generic.js        # 通用 fallback 解析器
└── transformers/
    ├── to-manifest.js    # 原始数据 → AMP 格式
    └── intents.js        # 从描述推断意图模板
```

---

## GPTs → AMP 映射规则

### 基本映射

| GPT Store 字段 | AMP 字段 | 规则 |
|---|---|---|
| `name` | `name` | 直接映射 |
| `description` | `description` | 直接映射 |
| GPT ID | `id` | 转为反向域名格式: `com.openai.gpt-{id}` |
| 版本号 | `version` | 默认为 `1.0.0` |
| `openapi.yaml` | `capabilities[].input/output` | 从端点定义提取 |
| GPT slug | `tags` | 自动生成标签 |

### 意图推断

GPT Store 格式没有标准化的"意图"字段，所以转换器需要从以下来源推断：

1. **GPT name**: `"PDF 分析师"` → `"分析PDF文件"`, `"从PDF提取信息"`
2. **GPT description**: `"我可以帮你分析和总结PDF文件的内容"` → `"总结{文件}的内容"`
3. **Instructions**: 提取动作关键词 → 构建意图模板
4. **openapi.yaml endpoints**: `GET /weather` → `"查天气"`

### 信任推断

| GPT Store 信号 | AMP trust 映射 |
|---|---|
| 有 API | `permissions: ["network"]` |
| 无需登录 | `permissions: []` |
| 有 verified 标识 | `verified_by: ["openai_gpt_store"]` |
| 有 plugins | `permissions: ["network", "read_file"]` |
