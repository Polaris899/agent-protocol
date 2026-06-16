import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join, basename } from 'path';
import chalk from 'chalk';
import { createInterface } from 'readline';

const AGENTS_DIR = join(homedir(), '.agents');

export async function installCommand(repo, options) {
  const installDir = options.dir || AGENTS_DIR;

  // Parse user/repo
  const parts = repo.split('/');
  if (parts.length < 2) {
    console.error(chalk.red('❌ 仓库格式无效。请使用 user/repo 格式，如：openclaw/weather-skill'));
    process.exit(1);
  }

  const fullRepo = parts.length === 2 ? `github.com/${parts[0]}/${parts[1]}` : repo;
  const repoName = basename(repo);
  const targetDir = join(installDir, repoName);

  console.log(chalk.blue(`📦 安装 Skill: ${chalk.bold(repo)}`));
  console.log();

  // Check if already installed
  if (existsSync(targetDir)) {
    const answer = await ask(`  目录 ${targetDir} 已存在。覆盖？[y/N] `);
    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.yellow('  已取消。'));
      return;
    }
  }

  // Create agents directory if needed
  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true });
  }

  const gitUrl = `https://github.com/${parts[0]}/${parts[1]}.git`;

  try {
    console.log(chalk.gray(`  git clone ${gitUrl} → ${targetDir}`));
    
    execSync(`git clone --depth 1 ${gitUrl} "${targetDir}"`, {
      stdio: 'inherit',
      timeout: 60000,
    });

    // Validate manifest
    const manifestPath = findManifest(targetDir);
    if (!manifestPath) {
      console.log(chalk.yellow('  ⚠ 未找到 agent.json 或 agent.yaml，这可能不是一个有效的 Agent Skill'));
    } else {
      console.log(chalk.green(`  ✓ 找到 Manifest: ${manifestPath}`));
    }

    // Register in local config
    registerSkill(repoName, repo, targetDir);

    console.log();
    console.log(chalk.green(`✅ ${chalk.bold(repoName)} 安装成功！`));
    console.log(chalk.gray(`   路径: ${targetDir}`));
    
    if (manifestPath) {
      console.log(chalk.gray(`   使用: agent info ${repoName}`));
    }
  } catch (err) {
    console.error(chalk.red(`❌ 安装失败: ${err.message}`));
    process.exit(1);
  }
}

function findManifest(dir) {
  const candidates = ['agent.json', 'agent.yaml', 'agent.yml'];
  for (const name of candidates) {
    const path = join(dir, name);
    if (existsSync(path)) return path;
  }
  return null;
}

function registerSkill(name, repo, dir) {
  const configPath = join(AGENTS_DIR, '.agent-config.json');
  let config = {};
  
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  if (!config.installed) config.installed = {};
  
  config.installed[name] = {
    repo,
    dir,
    installed_at: new Date().toISOString(),
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}
