import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const AGENTS_DIR = join(homedir(), '.agents');
const CONFIG_PATH = join(AGENTS_DIR, '.agent-config.json');

export async function listCommand(options) {
  const asJson = options.json || false;

  if (!existsSync(CONFIG_PATH)) {
    console.log(chalk.yellow('  尚未安装任何 Skill。'));
    console.log(chalk.gray('  使用 agent search <query> 查找 Skill，然后用 agent install <repo> 安装'));
    return;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    console.log(chalk.red('❌ 配置文件损坏'));
    process.exit(1);
  }

  const installed = config.installed || {};
  const names = Object.keys(installed);

  if (names.length === 0) {
    console.log(chalk.yellow('  尚未安装任何 Skill。'));
    return;
  }

  if (asJson) {
    console.log(JSON.stringify(installed, null, 2));
    return;
  }

  console.log(chalk.blue(`📋 已安装的 Skill (${names.length})：`));
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
        desc = `${caps.length} 个能力`;
      } catch {}
    }

    const date = new Date(skill.installed_at).toLocaleDateString('zh-CN');
    console.log(`  ${chalk.cyan(String(i + 1).padStart(2, ' '))}. ${chalk.bold(displayName)}`);
    console.log(`     ${chalk.gray(`仓库: ${skill.repo}  |  安装: ${date}  |  ${desc}`)}`);
    console.log();
  }
}
