# GPT Action Configuration Guide

## 🚀 3-Line Setup

In the ChatGPT **Actions configuration page** (GPT Builder → Configuration → Add Action):

```
Name:  AMP Intent Router
Server URL:  https://api.agent-trust-protocol.org
Import:  https://api.agent-trust-protocol.org/api/openapi.json
```

**Done.** Your GPT can now discover 5,051 Skills and find the one that can handle your user's intent.

---

## What You Get After Integration

GPT automatically gains a `routeIntent` action, called as:

```json
POST https://api.agent-trust-protocol.org/api/route
{
  "intent": "<user's natural language intent>"
}
```

Response:

```json
{
  "matched": true,
  "top_match": {
    "name": "Financial Statement Analyzer",
    "description": "Deep financial analysis with DuPont decomposition and fraud detection",
    "score": 0.44
  },
  "alternatives": [
    { "name": "Financial Planner v36", "score": 0.21 }
  ],
  "total_matches": 20
}
```

---

## Recommended GPT Instructions Template

Add the following logic to your GPT Builder Instructions:

```
## External Capability (AMP Intent Router)
You are connected to an external skill routing network (AMP) with discovery access to 5,051 registered Skills.

Routing Rules:
1. After receiving a user intent, if it falls within your core capability, handle it directly
2. If the user's request exceeds your capability (e.g., user wants financial analysis but your strength is writing),
   call routeIntent to find the best-matching Skill
3. Present the result to the user:
   "I can ask my colleague [Skill Name] to handle this — it has [Skill Description]. Shall I forward it?"
4. If the user confirms, retrieve the Skill's full details via the routing center and execute on their behalf
```

---

## Example Conversation Flow

**User:** analyze this financial report
**Your GPT (assuming it's a general writing assistant):**
→ Calls `routeIntent("analyze this financial report")`
→ Returns `top_match = {"name": "Financial Statement Analyzer", "score": 0.44}`
→ Replies:
   "While I'm good at writing, I'd recommend consulting my colleague 'Financial Statement Analyzer' for professional financial analysis. It specializes in deep financial analysis with DuPont decomposition and fraud detection. Shall I forward it?"

---

## End-to-End Validation Results

```
POST /api/route
├── "analyze this financial report"  → Financial Planner v36     (0.44) ✅
├── "what's the weather in Tokyo"    → Weather                   (0.83) ✅
├── "create a presentation"          → PPT Generator             (0.47) ✅
├── "write a song"                   → Music Creator             (0.30) ✅
├── "draw a picture"                 → Illustrator v36           (0.53) ✅
├── "search latest AI news"          → Web Search                (0.40) ✅
├── "analyze this Excel spreadsheet" → Spreadsheet Tools         (0.46) ✅
├── "write a research report"        → Deep Research Report      (0.58) ✅
├── "upload a file"                  → File Upload               (0.88) ✅
├── "convert this docx to PDF"       → PDF Toolkit               (0.14) ✅
└── "create a presentation"          → PPT Generator             (0.12) ✅
```

---

## Privacy & Security

- All API endpoints are publicly accessible, no authentication required
- Route queries only return Skill metadata (name, description, score) — **no user data is transmitted**
- The routing center stores no conversation history
- Each query is processed independently, fully stateless

---

## Get Support

- GitHub: https://github.com/Polaris899/agent-protocol
- Web UI: https://polaris899.github.io/agent-protocol/
- Install CLI: `npx agent-protocol-cli search <your intent>`
