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

  console.log(chalk.yellow(`  Skill "${name}" not found.`));
  console.log(chalk.gray('  Use agent search <query> to search, or check the name'));
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
  console.log(`  Version: ${chalk.green(manifest.version)}`);
  if (manifest.author?.name) console.log(`  Author:  ${manifest.author.name}`);
  if (manifest.license) console.log(`  License: ${manifest.license}`);
  if (manifest.tags?.length) console.log(`  Tags:    ${chalk.gray(manifest.tags.join(', '))}`);
  console.log();

  // Capabilities
  const caps = manifest.capabilities || [];
  console.log(chalk.blue(`🎯 Capabilities (${caps.length}):`));
  for (const cap of caps) {
    console.log(`  ${chalk.bold(cap.name)} (${cap.id})`);
    console.log(`    ${chalk.gray(cap.description)}`);
    if (cap.intents?.length) {
      const samples = cap.intents.slice(0, 3);
      console.log(`    ${chalk.gray('Intent examples: ' + samples.join(' | '))}`);
    }
    console.log(`    ${cap.latency ? chalk.gray(`Latency: ${cap.latency}  |  `) : ''}${chalk.gray(`Security: ${cap.security_level || 'low'}  |  Cost: ¥${cap.cost_per_call || 0}/call`)}`);
    console.log();
  }

  // Runtime
  if (manifest.runtime) {
    console.log(chalk.blue('⚙ Runtime'));
    console.log(`  Engine:   ${manifest.runtime.engine}`);
    console.log(`  Type:     ${manifest.runtime.type || 'skill'}`);
    if (manifest.runtime.config_url) console.log(`  Config:   ${chalk.gray(manifest.runtime.config_url)}`);
    console.log();
  }

  // Trust
  if (manifest.trust) {
    console.log(chalk.blue('🔒 Security & Trust'));
    const perms = manifest.trust.permissions || [];
    console.log(`  Permissions: ${perms.length > 0 ? chalk.yellow(perms.join(', ')) : chalk.gray('None')}`);
    console.log(`  Sandbox:     ${manifest.trust.sandbox_level || 'basic'}`);
    if (manifest.trust.verified_by?.length) {
      console.log(`  ${chalk.green('✓ Audited by: ' + manifest.trust.verified_by.join(', '))}`);
    }
    console.log();
  }
}
