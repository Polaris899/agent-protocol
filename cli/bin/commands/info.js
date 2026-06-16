import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const AGENTS_DIR = join(homedir(), '.agents');
const CONFIG_PATH = join(AGENTS_DIR, '.agent-config.json');

export async function infoCommand(name, options) {
  const asJson = options.json || false;

  // Try local installed first
  if (existsSync(CONFIG_PATH)) {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    const installed = config.installed || {};

    if (installed[name]) {
      const skill = installed[name];
      const manifestPath = join(skill.dir, 'agent.json');

      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        renderManifest(manifest, asJson);
        return;
      }
    }
  }

  // Try searching the registry
  const registryUrls = [
    process.env.AGENT_REGISTRY || '',
    'http://localhost:3456',
    'https://api.agent-protocol.dev',
  ].filter(Boolean);

  for (const baseUrl of registryUrls) {
    try {
      // Try by exact id first
      const idRes = await fetch(`${baseUrl}/manifest?id=${encodeURIComponent(name)}`);
      if (idRes.ok) {
        const manifest = await idRes.json();
        renderManifest(manifest, asJson);
        return;
      }

      // Fallback: search by name
      const searchRes = await fetch(`${baseUrl}/search?q=${encodeURIComponent(name)}&limit=1`);
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.results && data.results.length > 0) {
          renderManifest(data.results[0], asJson);
          return;
        }
      }
    } catch {}
  }

  console.log(chalk.yellow(`  未找到名为 "${name}" 的 Skill。`));
  console.log(chalk.gray('  使用 agent search <query> 搜索，或确认名称是否准确'));
}

function renderManifest(manifest, asJson) {
  if (asJson) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  console.log(chalk.blue(`📄 ${chalk.bold(manifest.name)}`));
  console.log(`  ${chalk.gray(manifest.description || '')}`);
  console.log();
  console.log(`  ID:      ${chalk.cyan(manifest.id)}`);
  console.log(`  版本:    ${chalk.green(manifest.version)}`);
  if (manifest.author?.name) console.log(`  作者:    ${manifest.author.name}`);
  if (manifest.license) console.log(`  许可:    ${manifest.license}`);
  if (manifest.tags?.length) console.log(`  标签:    ${chalk.gray(manifest.tags.join(', '))}`);
  console.log();

  // Capabilities
  const caps = manifest.capabilities || [];
  console.log(chalk.blue(`🎯 能力 (${caps.length})：`));
  for (const cap of caps) {
    console.log(`  ${chalk.bold(cap.name)} (${cap.id})`);
    console.log(`    ${chalk.gray(cap.description)}`);
    if (cap.intents?.length) {
      const samples = cap.intents.slice(0, 3);
      console.log(`    ${chalk.gray('意图示例: ' + samples.join(' | '))}`);
    }
    console.log(`    ${cap.latency ? chalk.gray(`延迟: ${cap.latency}  |  `) : ''}${chalk.gray(`安全: ${cap.security_level || 'low'}  |  费用: ¥${cap.cost_per_call || 0}/次`)}`);
    console.log();
  }

  // Runtime
  if (manifest.runtime) {
    console.log(chalk.blue('⚙ 运行时'));
    console.log(`  引擎:     ${manifest.runtime.engine}`);
    console.log(`  类型:     ${manifest.runtime.type || 'skill'}`);
    if (manifest.runtime.config_url) console.log(`  配置:     ${chalk.gray(manifest.runtime.config_url)}`);
    console.log();
  }

  // Trust
  if (manifest.trust) {
    console.log(chalk.blue('🔒 安全与信任'));
    const perms = manifest.trust.permissions || [];
    console.log(`  权限:     ${perms.length > 0 ? chalk.yellow(perms.join(', ')) : chalk.gray('无')}`);
    console.log(`  沙箱:    ${manifest.trust.sandbox_level || 'basic'}`);
    if (manifest.trust.verified_by?.length) {
      console.log(`  ${chalk.green('✓ 已通过审计: ' + manifest.trust.verified_by.join(', '))}`);
    }
    console.log();
  }
}
