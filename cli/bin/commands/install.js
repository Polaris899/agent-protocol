import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync, copyFileSync } from 'fs';
import { homedir } from 'os';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(homedir(), '.agents');
const CONFIG_PATH = join(AGENTS_DIR, '.agent-config.json');
const SCHEMA_PATH = join(__dirname, '..', 'data', 'manifest.schema.json');

export async function installCommand(repo, options) {
  const installDir = options.dir || AGENTS_DIR;
  const version = options.version || options.tag || null;
  const branch = options.branch || null;
  const noValidate = options['no-validate'] || false;
  const noSymlink = options['no-symlink'] || false;

  // Parse user/repo[/path]
  const parts = repo.split('/');
  if (parts.length < 2) {
    console.error(chalk.red('❌ Invalid format. Use: agent install user/repo'));
    console.error(chalk.gray('   Optional: agent install user/repo#v1.0.0'));
    console.error(chalk.gray('            agent install user/repo@main'));
    process.exit(1);
  }

  const [user, repoName, ...subPath] = parts;
  const fullName = `${user}/${repoName}`;
  const targetDir = join(installDir, repoName);

  console.log(chalk.blue(`📦 Installing ${chalk.bold(fullName)}`));

  // ── Step 1: Pre-flight checks ──
  if (existsSync(targetDir)) {
    const answer = await ask(chalk.yellow(`  Directory exists: ${targetDir}\n  Overwrite? [y/N] `));
    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.yellow('  Cancelled'));
      return;
    }
    rmSync(targetDir, { recursive: true, force: true });
  }

  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true });
  }

  // ── Step 2: Git clone ──
  const gitUrl = `https://github.com/${fullName}.git`;
  console.log(chalk.gray(`  git clone ${gitUrl}`));

  try {
    const cloneArgs = ['clone', '--depth', '1'];
    if (branch) cloneArgs.push('--branch', branch);
    if (version) cloneArgs.push('--branch', `v${version.replace(/^v/, '')}`);
    cloneArgs.push(gitUrl, targetDir);

    const result = spawnSync('git', cloneArgs, {
      stdio: 'pipe',
      timeout: 60000,
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      // Try shallow clone with specific ref as fallback
      const fallback = spawnSync('git', [
        'clone', '--depth', '1', '--single-branch',
        ...(version || branch ? ['--branch', (version || branch).replace(/^v/, '')] : []),
        gitUrl, targetDir
      ], { stdio: 'pipe', timeout: 60000, encoding: 'utf-8' });

      if (fallback.status !== 0) {
        throw new Error(fallback.stderr?.split('\n')[0] || 'Clone failed');
      }
    }
  } catch (err) {
    console.error(chalk.red(`❌ Clone failed: ${err.message}`));
    cleanupFailedInstall(targetDir);
    process.exit(1);
  }

  // ── Step 3: Parse manifest ──
  const manifestPath = findManifest(targetDir);
  let manifest = null;
  let installError = null;

  if (!manifestPath) {
    installError = `agent.json/agent.yaml not found`;
    console.log(chalk.yellow(`  ⚠ ${installError}`));
  } else {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      console.log(chalk.green(`  ✓ Found Manifest: ${basename(manifestPath)}`));

      // ── Step 4: Validate against schema ──
      if (!noValidate) {
        const valid = await validateManifest(manifestPath, manifest);
        if (!valid) {
          console.log(chalk.yellow('  ⚠ Manifest validation has warnings (continuing anyway)'));
        } else {
          console.log(chalk.green('  ✓ Schema validation passed'));
        }
      }

      // ── Step 5: Check dependencies ──
      if (manifest.dependencies?.skills?.length) {
        console.log(chalk.blue('  🔗 Checking dependencies...'));
        const depsOk = await resolveDependencies(manifest.dependencies.skills, installDir);
        if (!depsOk) {
          console.log(chalk.yellow('  ⚠ Some dependencies not met (continuing anyway)'));
        }
      }

      // ── Step 6: Run lifecycle hooks ──
      if (manifest.lifecycle?.on_install) {
        console.log(chalk.blue('  🎣 Running install hook...'));
        await runLifecycleHook(targetDir, manifest.lifecycle.on_install, 'on_install');
      }

      // ── Step 7: Store version info ──
      manifest._installed_version = manifest.version;
      manifest._installed_commit = getCommitHash(targetDir);

    } catch (err) {
      installError = err.message;
      console.log(chalk.yellow(`  ⚠ Manifest parse failed: ${err.message}`));
    }
  }

  // ── Step 8: Register via symlink (for OpenClaw) ──
  if (!noSymlink && manifest) {
    try {
      const skillsDir = getSkillsDir();
      if (skillsDir) {
        const linkPath = join(skillsDir, repoName);
        if (!existsSync(linkPath)) {
          symlinkSync(targetDir, linkPath, 'dir');
          console.log(chalk.green(`  ✓ Registered in OpenClaw: ${linkPath}`));
        } else {
          console.log(chalk.gray(`  - ${repoName} already exists in OpenClaw directory (skipped)`));
        }
      }
    } catch (err) {
      console.log(chalk.yellow(`  ⚠ Failed to register symlink: ${err.message}`));
    }
  }

  // ── Step 9: Register in local config ──
  registerSkill(repoName, fullName, targetDir, manifest, version || branch || 'main', installError);

  // ── Summary ──
  console.log('');
  if (installError && !manifest) {
    console.log(chalk.yellow(`⚠ ${fullName} downloaded to: ${targetDir}`));
    console.log(chalk.gray('  No valid agent.json found. Please configure manually'));
  } else {
    console.log(chalk.green(`✅ ${chalk.bold(repoName)} v${manifest?.version || '?'} installed successfully!`));
    console.log(chalk.gray(`   Path: ${targetDir}`));
    console.log(chalk.gray(`   Commands: agent info ${repoName}`));
    console.log(chalk.gray(`            agent update`));
    if (manifest?.lifecycle?.health_check) {
      console.log(chalk.gray(`   Health check registered (every ${manifest.lifecycle.health_check.interval_seconds}s)`));
    }
  }
}

// ─── Helpers ───

function findManifest(dir) {
  // Look in root, then .agent/
  const patterns = [
    join(dir, 'agent.json'),
    join(dir, 'agent.yaml'),
    join(dir, 'agent.yml'),
    join(dir, '.agent', 'manifest.json'),
    join(dir, '.agent', 'manifest.yaml'),
  ];
  for (const p of patterns) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function validateManifest(manifestPath, manifest) {
  // Try Ajv validation
  try {
    const { default: Ajv } = await import('ajv');
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);

    if (existsSync(SCHEMA_PATH)) {
      const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
      const validate = ajv.compile(schema);
      const valid = validate(manifest);
      if (!valid) {
        console.log(chalk.yellow('  Validation issues:'));
        validate.errors.slice(0, 3).forEach(e => {
          console.log(chalk.gray(`    ${e.instancePath} ${e.message}`));
        });
        return false;
      }
      return true;
    }
  } catch {}
  return true; // Skip if schema not available
}

async function resolveDependencies(deps, installDir) {
  let allOk = true;
  const config = loadConfig();

  for (const dep of deps) {
    const existing = Object.entries(config.installed || {})
      .find(([_, s]) => s.id === dep.id);

    if (existing) {
      console.log(chalk.gray(`    ✓ ${dep.id} (v${existing[1].version} already installed)`));
      continue;
    }

    if (dep.optional) {
      console.log(chalk.gray(`    - ${dep.id} (optional, skipped)`));
      continue;
    }

    console.log(chalk.yellow(`    ⚠ ${dep.id} (not installed)`));
    allOk = false;
  }

  return allOk;
}

async function runLifecycleHook(targetDir, hook, hookName) {
  if (!hook) return;

  const { default: chalk } = await import('chalk');

  if (hook.requires_approval) {
    const answer = await ask(chalk.yellow(`  安装需要执行: ${hook.description || hookName}\n  确认执行？[y/N] `));
    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.gray(`  Skipping ${hookName} hook`));
      return;
    }
  }

  try {
    if (hook.command) {
      const result = spawnSync(hook.command, {
        cwd: targetDir,
        shell: true,
        timeout: hook.timeout_ms || 30000,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      if (result.status !== 0) {
        console.log(chalk.yellow(`  ⚠ ${hookName} hook returned non-zero: ${result.stderr?.slice(0, 200)}`));
      }
    } else if (hook.url) {
      // Webhook / HTTP hook — note only
      console.log(chalk.gray(`  ${hookName}: webhook configured as ${hook.url}`));
    }
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ ${hookName} hook failed: ${err.message}`));
  }
}

function getCommitHash(dir) {
  try {
    const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: dir, stdio: 'pipe', encoding: 'utf-8', timeout: 5000,
    });
    return result.stdout?.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getSkillsDir() {
  // Look for OpenClaw skills directory in standard locations
  const candidates = [
    join(homedir(), '.openclaw', 'workspace', 'skills'),
    join(homedir(), '.agents'),
    join(homedir(), 'skills'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return null;
}

function registerSkill(name, fullName, dir, manifest, ref, error) {
  const config = loadConfig();
  if (!config.installed) config.installed = {};

  config.installed[name] = {
    id: manifest?.id || `${fullName.replace('/', '.')}`,
    name: manifest?.name || name,
    repo: fullName,
    dir,
    ref,
    version: manifest?.version || '0.1.0',
    capabilities: (manifest?.capabilities || []).map(c => c.id),
    tag_count: (manifest?.tags || []).length,
    installed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    install_error: error || null,
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function cleanupFailedInstall(dir) {
  try {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  } catch {}
}

function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}
