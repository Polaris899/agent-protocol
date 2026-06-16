import chalk from 'chalk';

// Registry URLs (ordered by preference)
const REGISTRY_URLS = [
  process.env.AGENT_REGISTRY || '',
  'http://localhost:3456',
  'https://api.agent-protocol.dev',
].filter(Boolean);

export async function searchCommand(query, options) {
  const limit = parseInt(options.limit) || 10;
  const asJson = options.json || false;

  console.log(chalk.blue(`🔍 搜索: "${query}"`));
  console.log(chalk.gray(`   路由中心查询中...`));
  console.log();

  // Try registry URLs
  for (const url of REGISTRY_URLS) {
    try {
      const searchUrl = `${url}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const res = await fetch(searchUrl);
      if (res.ok) {
        const data = await res.json();
        renderResults(data.results || [], query, limit, asJson);
        return;
      }
    } catch {
      continue;
    }
  }

  // Fallback: check local cache
  console.log(chalk.yellow('   ⚠ 路由中心未响应，使用本地缓存...'));
  const results = getCachedResults(query);
  renderResults(results, query, limit, asJson);
}

function renderResults(results, query, limit, asJson) {
  if (asJson) {
    console.log(JSON.stringify(results.slice(0, limit), null, 2));
    return;
  }

  if (!results || results.length === 0) {
    console.log(chalk.yellow('  未找到匹配的 Skill。'));
    console.log(chalk.gray('  提示：可以尝试更宽泛的关键词，或者访问 https://agent-protocol.dev 在线搜索'));
    return;
  }

  const display = results.slice(0, limit);
  console.log(chalk.green(`  找到 ${results.length} 个匹配的 Skill（显示前 ${display.length} 个）：`));
  console.log();

  display.forEach((skill, i) => {
    const prefix = chalk.cyan(`  ${i + 1}.`);
    const name = chalk.bold(skill.name || skill.id);
    const desc = skill.description ? chalk.gray(skill.description.slice(0, 100)) : '';
    const author = skill.author?.name || skill._repo?.split('/')[0] || 'unknown';
    const badge = chalk.green(`⬡ ${skill.trust?.verified_by?.length > 0 ? '已审计' : '未审计'}`);

    console.log(`${prefix} ${name} ${badge}`);
    console.log(`     ${desc}`);
    console.log(`     ${chalk.gray(`作者: ${author}  |  能力数: ${skill.capabilities?.length || 0}`)}`);
    if (skill._repo) {
      console.log(`     ${chalk.gray(`安装: agent install ${skill._repo}`)}`);
    }
    console.log();
  });
}

function getCachedResults(query) {
  // Simple local search through cached manifests
  // In production this would use a local vector index
  const keywords = query.toLowerCase().split(/\s+/);
  return [];
}
