import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const AGENTS_DIR = join(homedir(), '.agents');
const CONFIG_PATH = join(AGENTS_DIR, '.agent-config.json');

export async function listCommand(options) {
  const asJson = options.json || false;

  if (!existsSync(CONFIG_PATH)) {
    console.log(chalk.yellow('  No Skills installed yet.'));
    console.log(chalk.gray('  Use agent search <query> to find Skills, then agent install <repo> to install'));
    return;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    console.log(chalk.red('❌ Config file corrupted'));
    process.exit(1);
  }

  const installed = config.installed || {};
  const names = Object.keys(installed);

  if (names.length === 0) {
    console.log(chalk.yellow('  No Skills installed yet.'));
    return;
  }

  if (asJson) {
    console.log(JSON.stringify(installed, null, 2));
    return;
  }

  console.log(chalk.blue(`📋 Installed Skills (${names.length}):`));
  console.log();

  for (const [i, name] of names.entries()) {
    const skill = installed[name];
    const manifestPath = join(skill.dir, 'agent.json');
    let displayName = name;
    let desc = '';

    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        displayName = manifest.name || name;
        const caps = manifest.capabilities || [];
        desc = `${caps.length} capabilities`;
      } catch {}
    }

    const date = new Date(skill.installed_at).toLocaleDateString('en-US');
    console.log(`  ${chalk.cyan(String(i + 1).padStart(2, ' '))}. ${chalk.bold(displayName)}`);
    console.log(`     ${chalk.gray(`Repo: ${skill.repo}  |  Installed: ${date}  |  ${desc}`)}`);
    console.log();
  }
}
