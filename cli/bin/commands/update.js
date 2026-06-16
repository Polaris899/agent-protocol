import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const AGENTS_DIR = join(homedir(), '.agents');
const CONFIG_PATH = join(AGENTS_DIR, '.agent-config.json');

export async function updateCommand() {
  if (!existsSync(CONFIG_PATH)) {
    console.log(chalk.yellow('  尚未安装任何 Skill，无需更新。'));
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

  console.log(chalk.blue('🔄 更新所有已安装的 Skill...'));
  console.log();

  let successCount = 0;
  let failCount = 0;

  for (const name of names) {
    const skill = installed[name];
    if (!existsSync(skill.dir)) {
      console.log(chalk.yellow(`  ⚠ ${name}: 目录不存在，跳过`));
      continue;
    }

    try {
      console.log(chalk.gray(`  ${name}: git pull...`));
      execSync(`cd "${skill.dir}" && git pull --rebase`, {
        stdio: 'pipe',
        timeout: 30000,
      });
      console.log(chalk.green(`  ✓ ${name}: 已更新到最新版本`));
      successCount++;
    } catch (err) {
      console.log(chalk.red(`  ✗ ${name}: 更新失败 - ${err.stderr?.toString().split('\n')[0] || err.message}`));
      failCount++;
    }
  }

  console.log();
  console.log(chalk.green(`✅ 更新完成: ${successCount} 成功, ${failCount} 失败`));
}
