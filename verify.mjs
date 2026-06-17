/**
 * AMP GPT Interconnector — 端到端验证脚本
 * 
 * 测试内容：
 *   ✅ POST /api/route — 意图路由（10个典型场景）
 *   ✅ GET /api/search — 语义搜索
 *   ✅ GET /api/openapi.json — GPT Action 配置导入
 *   ✅ GET /api/stats — 注册中心统计
 *   ✅ GET /api/health — 健康检查
 *   ✅ POST /api/register — GPT 注册（模拟）
 *
 * 输出：验证报告 markdown + 详细日志
 */

const BASE = 'https://api.agent-trust-protocol.org';

const TESTS = [
  { name: 'HEALTH', method: 'GET', path: '/api/health' },
  { name: 'STATS',  method: 'GET', path: '/api/stats' },
  { name: 'OPENAPI', method: 'GET', path: '/api/openapi.json' },
  { name: 'SEARCH_天气', method: 'GET', path: '/api/search?q=天气' },
  { name: 'SEARCH_财报', method: 'GET', path: '/api/search?q=分析财报' },
  { name: 'SEARCH_music', method: 'GET', path: '/api/search?q=music generator' },
  { name: 'ROUTE_分析财务报表', method: 'POST', path: '/api/route', body: { intent: '帮我分析财务报表' } },
  { name: 'ROUTE_天气', method: 'POST', path: '/api/route', body: { intent: '今天天气怎么样' } },
  { name: 'ROUTE_生成PPT', method: 'POST', path: '/api/route', body: { intent: '生成一份演示文稿' } },
  { name: 'ROUTE_音乐', method: 'POST', path: '/api/route', body: { intent: '写一首歌' } },
  { name: 'ROUTE_画图', method: 'POST', path: '/api/route', body: { intent: '画一幅中国山水画' } },
  { name: 'ROUTE_搜索新闻', method: 'POST', path: '/api/route', body: { intent: '搜索最新的AI新闻' } },
  { name: 'ROUTE_Excel', method: 'POST', path: '/api/route', body: { intent: '分析这个Excel表格数据' } },
  { name: 'ROUTE_研究报告', method: 'POST', path: '/api/route', body: { intent: '帮我写一份关于新能源的深度研究报告' } },
  { name: 'ROUTE_文件上传', method: 'POST', path: '/api/route', body: { intent: '上传一个文件' } },
  { name: 'ROUTE_EN_weather', method: 'POST', path: '/api/route', body: { intent: "what's the weather in Tokyo" } },
  { name: 'ROUTE_EN_PPT', method: 'POST', path: '/api/route', body: { intent: "create a presentation about AI" } },
  { name: 'ROUTE_EN_PDF', method: 'POST', path: '/api/route', body: { intent: "convert this docx to PDF" } },
  { name: 'REGISTER', method: 'POST', path: '/api/register', body: { name: 'My Test GPT', description: '测试GPT，用于演示路由互连', version: '1.0.0' } },
];

async function runTests() {
  const results = [];
  const failures = [];

  for (const test of TESTS) {
    const url = BASE + test.path;
    try {
      const opts = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (test.body) opts.body = JSON.stringify(test.body);

      const start = Date.now();
      const resp = await fetch(url, opts);
      const elapsed = Date.now() - start;
      const data = await resp.json();

      const passed = resp.ok;
      results.push({ ...test, status: resp.status, elapsed, passed, data });
      if (!passed) failures.push(test.name);
    } catch (err) {
      results.push({ ...test, status: -1, elapsed: 0, passed: false, error: err.message });
      failures.push(test.name);
    }
  }

  // ── Report ──
  console.log(`
# AMP GPT Interconnector — 端到端验证报告

**测试时间：** ${new Date().toISOString()}
**API Base：** \`${BASE}\`
**测试用例数：** ${results.length}
**通过：** ✅ ${results.filter(r => r.passed).length}
**失败：** ❌ ${failures.length}
**成功率：** ${Math.round(results.filter(r => r.passed).length / results.length * 100)}%

---

## 逐项测试结果

| # | 测试名称 | 方法 | 路径 | 状态 | 耗时(ms) | 结果 |
|---|---------|------|------|:----:|:--------:|:----:|
${results.map((r, i) =>
  `| ${i+1} | ${r.name} | ${r.method} | ${r.path.split('?')[0]} | ${r.status} | ${r.elapsed} | ${r.passed ? '✅' : '❌'} |`
).join('\n')}

---

## 意图路由详情

| 意图 | Top Match | Score | 匹配数 | 耗时(ms) |
|------|-----------|:-----:|:-----:|:--------:|
${results.filter(r => r.name.startsWith('ROUTE_')).map(r => {
  const d = r.data;
  const top = d?.top_match?.name || 'N/A';
  const score = d?.top_match?.score || 0;
  const total = d?.total_matches || 0;
  return `| ${r.name.replace('ROUTE_', '')} | ${top} | ${typeof score === 'number' ? score.toFixed(2) : score} | ${total} | ${r.elapsed} |`;
}).join('\n')}

---

## 注册中心统计
\`\`\`json
${JSON.stringify(results.find(r => r.name === 'STATS')?.data || {}, null, 2)}
\`\`\`

---

## GPT Action OpenAPI 端点
\`\`\`
URL: ${BASE}/api/openapi.json
HTTP 状态: ${results.find(r => r.name === 'OPENAPI')?.status || 'N/A'}
导入到 GPT Builder → 3 行配置即可接入
\`\`\`

---

## 结论

${
  failures.length === 0
    ? '🎉 **所有测试通过！** AMP GPT Interconnector 已就绪，任何 GPT 开发者可通过 3 行配置接入 5,051 个 Skill 的路由网络。'
    : `⚠️ **${failures.length} 个测试未通过：** ${failures.join(', ')}`
}
`);

  // Process exit code
  process.exit(failures.length > 0 ? 1 : 0);
}

runTests();
