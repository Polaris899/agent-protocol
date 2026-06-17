import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { createInterface } from 'readline';

const AGENTS_DIR = join(homedir(), '.agents');
const CONFIG_PATH = join(AGENTS_DIR, '.agent-config.json');

export async function updateCommand(skillName, options) {
  const all = options.all || !skillName;
  const isRollback = options.rollback || false;
  const force = options.force || false;
  const checkOnly = options.check || options.dryRun || false;

  // Load config
  const config = loadConfig();
  const installed = config.installed || {};
  const names = Object.keys(installed);

  // If a specific skill name is given, update only that one
  const targets = skillName
    ? (installed[skillName] ? [skillName] : [])
    : names;

  if (names.length === 0) {
    console.log(chalk.yellow('  No Skills installed yet.'));
    console.log(chalk.gray('  Use: agent install user/repo'));
    return;
  }

  if (skillName && !installed[skillName]) {
    console.error(chalk.red(`❌ Installed Skill not found: ${skillName}`));
    console.log(chalk.gray('  Installed: ' + names.join(', ')));
    process.exit(1);
  }

  if (targets.length === 0) {
    console.log(chalk.yellow('  Nothing to update.'));
    return;
  }

  // ── Rollback mode ──
  if (isRollback) {
    await rollbackSkill(skillName, options, installed);
    return;
  }

  // ── Check-only mode ──
  if (checkOnly) {
    await checkUpdates(targets, installed);
    return;
  }

  // ── Update mode ──
  console.log(chalk.blue(all
    ? `🔄 Updating all installed Skills (${targets.length})...`
    : `🔄 Updating ${chalk.bold(skillName)}...`));
  console.log('');

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const name of targets) {
    const skill = installed[name];

    if (!existsSync(skill.dir)) {
      console.log(chalk.yellow(`  ⚠ ${chalk.bold(name)}: directory does not exist, skipping`));
      const answer = await ask(chalk.yellow(`    Remove from config? [y/N] `));
      if (answer.toLowerCase() === 'y') {
        delete installed[name];
        writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log(chalk.gray(`    ✓ ${name} removed from registry`));
      }
      skippedCount++;
      continue;
    }

    // Check if update is available
    const updateAvailable = await checkRemoteUpdate(name, skill);
    if (!updateAvailable && !force) {
      console.log(chalk.gray(`  - ${chalk.bold(name)}: already up to date (v${skill.version})`));
      skippedCount++;
      continue;
    }

    // Stash local changes before pull
    try {
      const stashResult = spawnSync('git', ['stash'], {
        cwd: skill.dir, stdio: 'pipe', encoding: 'utf-8', timeout: 10000,
      });
      const hasStash = stashResult.stdout?.includes('Saved') || false;

      // Pull latest
      console.log(chalk.gray(`  ${chalk.bold(name)}: git pull...`));
      const pullResult = spawnSync('git', ['pull', '--rebase', '--autostash'], {
        cwd: skill.dir, stdio: 'pipe', encoding: 'utf-8', timeout: 30000,
      });

      if (pullResult.status !== 0) {
        // Fallback to simple pull
        const fallback = spawnSync('git', ['pull'], {
          cwd: skill.dir, stdio: 'pipe', encoding: 'utf-8', timeout: 30000,
        });
        if (fallback.status !== 0) {
          throw new Error(fallback.stderr?.split('\n')[0]?.slice(0, 100) || 'git pull 失败');
        }
      }

      // Get new commit hash
      const newCommit = getCommitHash(skill.dir);
      const newManifestVersion = getUpdatedManifestVersion(skill.dir);

      // Update config
      installed[name].updated_at = new Date().toISOString();
      installed[name].last_commit = newCommit;
      if (newManifestVersion) {
        installed[name].previous_version = skill.version;
        installed[name].version = newManifestVersion;
      }

      // Run on_update lifecycle hook if manifest has one
      const manifest = tryLoadManifest(skill.dir);
      if (manifest?.lifecycle?.on_update) {
        console.log(chalk.blue(`    🎣 Running update hook...`));
        await runHook(skill.dir, manifest.lifecycle.on_update, 'on_update');
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log(chalk.green(`  ✓ ${chalk.bold(name)}: ${newManifestVersion ? `v${skill.version} → v${newManifestVersion}` : 'updated'}`));
      successCount++;

    } catch (err) {
      // Attempt to restore stash
      try {
        spawnSync('git', ['stash', 'pop'], { cwd: skill.dir, stdio: 'ignore', timeout: 5000 });
      } catch {}

      console.log(chalk.red(`  ✗ ${chalk.bold(name)}: ${err.message}`));
      failCount++;
    }
  }

  // ── Summary ──
  console.log('');
  if (checkOnly) return;

  const total = successCount + failCount + skippedCount;
  console.log(all
    ? chalk.green(`✅ Update complete: ${successCount} succeeded, ${failCount} failed, ${skippedCount} skipped`)
    : (failCount === 0
      ? chalk.green(`✅ ${skillName} has been updated`)
      : chalk.red(`❌ ${skillName} update failed`)));
}

// ─── Check-only mode ───
async function checkUpdates(targets, installed) {
  console.log(chalk.blue('🔍 Checking for updates...'));
  console.log('');

  let hasUpdates = false;

  for (const name of targets) {
    const skill = installed[name];
    if (!existsSync(skill.dir)) {
      console.log(chalk.yellow(`  ⚠ ${name}: directory does not exist`));
      continue;
    }

    const localVersion = skill.version || '?';
    const remoteVersion = await getRemoteVersion(name, skill);

    if (remoteVersion && remoteVersion !== localVersion) {
      console.log(chalk.green(`  📦 ${chalk.bold(name)}: v${localVersion} → v${remoteVersion}`));
      hasUpdates = true;
    } else {
      console.log(chalk.gray(`  ✓ ${chalk.bold(name)}: v${localVersion} (up to date)`));
    }
  }

  console.log('');
  if (!hasUpdates) {
    console.log(chalk.green('✅ All Skills are up to date'));
  } else {
    console.log(chalk.green('  Use agent update --all to update all'));
  }
}

async function checkRemoteUpdate(name, skill) {
  try {
    const result = spawnSync('git', ['fetch', '--dry-run'], {
      cwd: skill.dir, stdio: 'pipe', encoding: 'utf-8', timeout: 15000,
    });
    return result.stderr?.includes('->') || false;
  } catch {
    return false;
  }
}

async function getRemoteVersion(name, skill) {
  try {
    // Try to get version from remote agent.json
    const rawUrl = `https://raw.githubusercontent.com/${skill.repo}/main/agent.json`;
    // We'll use a simpler approach: fetch via git
    const fetchResult = spawnSync('git', ['ls-remote', '--tags', `https://github.com/${skill.repo}.git`], {
      stdio: 'pipe', encoding: 'utf-8', timeout: 15000,
    });
    const tags = fetchResult.stdout?.match(/v?\d+\.\d+\.\d+/g);
    if (tags?.length) {
      return tags.sort(semverSort).pop();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Rollback ───
async function rollbackSkill(name, options, installed) {
  if (!name) {
    console.error(chalk.red('❌ Specify the Skill to rollback: agent update <name> --rollback'));
    process.exit(1);
  }

  const skill = installed[name];
  if (!skill) {
    console.error(chalk.red(`❌ Installed Skill not found: ${name}`));
    process.exit(1);
  }

  if (!existsSync(skill.dir)) {
    console.error(chalk.red(`❌ Directory does not exist: ${skill.dir}`));
    process.exit(1);
  }

  // List recent git refs
  console.log(chalk.blue(`🕒 Viewing ${name} version history...`));
  const logResult = spawnSync('git', ['log', '--oneline', '-10'], {
    cwd: skill.dir, stdio: 'pipe', encoding: 'utf-8', timeout: 10000,
  });
  console.log(chalk.gray(logResult.stdout || 'No history'));

  const targetRef = options.ref || options.to;
  if (!targetRef) {
    console.log(chalk.yellow('  Use --to <commit> to specify rollback target'));
    process.exit(1);
  }

  console.log(chalk.blue(`  git checkout ${targetRef}...`));
  const result = spawnSync('git', ['checkout', targetRef], {
    cwd: skill.dir, stdio: 'pipe', encoding: 'utf-8', timeout: 15000,
  });

  if (result.status === 0) {
    console.log(chalk.green(`✅ ${name} rolled back to ${targetRef}`));
    installed[name].rollback_ref = targetRef;
    installed[name].updated_at = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify({ installed }, null, 2));
  } else {
    console.error(chalk.red(`❌ Rollback failed: ${result.stderr?.slice(0, 200)}`));
  }
}

// ─── Helpers ───
function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
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

function getUpdatedManifestVersion(dir) {
  try {
    const path = join(dir, 'agent.json');
    if (existsSync(path)) {
      const manifest = JSON.parse(readFileSync(path, 'utf-8'));
      return manifest.version || null;
    }
  } catch {}
  return null;
}

function tryLoadManifest(dir) {
  try {
    const path = join(dir, 'agent.json');
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8'));
    }
  } catch {}
  return null;
}

async function runHook(dir, hook, hookName) {
  if (!hook) return;

  if (hook.requires_approval) {
    const answer = await ask(chalk.yellow(`  更新钩子: ${hook.description || hookName}\n  确认？[y/N] `));
    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.gray(`  Skipping ${hookName}`));
      return;
    }
  }

  try {
    if (hook.command) {
      spawnSync(hook.command, { cwd: dir, shell: true, timeout: hook.timeout_ms || 30000, stdio: 'pipe', encoding: 'utf-8' });
    }
  } catch {}
}

function semverSort(a, b) {
  const clean = v => v.replace(/^v/, '').split('.').map(Number);
  const [a1, a2, a3] = clean(a);
  const [b1, b2, b3] = clean(b);
  return a1 - b1 || a2 - b2 || a3 - b3;
}

function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}
