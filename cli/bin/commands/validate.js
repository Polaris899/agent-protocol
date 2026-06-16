import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, '..', 'data', 'manifest.schema.json');

export async function validateCommand(path) {
  if (!existsSync(path)) {
    console.error(chalk.red(`❌ 文件不存在: ${path}`));
    process.exit(1);
  }

  console.log(chalk.blue(`🔍 校验: ${path}`));
  console.log();

  let manifest;
  try {
    const content = readFileSync(path, 'utf-8');
    // Try JSON first, could also support YAML later
    manifest = JSON.parse(content);
  } catch (err) {
    console.error(chalk.red(`❌ 解析失败: ${err.message}`));
    process.exit(1);
  }

  // Load schema
  let schema;
  try {
    schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  } catch {
    console.log(chalk.yellow('  ⚠ 无法加载 Schema 文件，执行基础校验...'));
    basicValidate(manifest);
    return;
  }

  // Dynamic import of ajv for JSON Schema validation
  try {
    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    if (valid) {
      console.log(chalk.green('✅ Manifest 验证通过！'));
      console.log();
      printSummary(manifest);
    } else {
      console.log(chalk.red(`❌ 发现 ${validate.errors.length} 个问题：`));
      for (const err of validate.errors) {
        const path = err.instancePath || '/';
        console.log(`  ${chalk.red('✗')} ${path} ${err.message}`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ 高级校验不可用: ${err.message}`));
    basicValidate(manifest);
  }
}

function basicValidate(manifest) {
  const errors = [];

  if (!manifest.id) errors.push('缺少必需字段: id');
  if (!manifest.name) errors.push('缺少必需字段: name');
  if (!manifest.version) errors.push('缺少必需字段: version');
  if (!manifest.capabilities || !Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    errors.push('必须至少声明一个 capability');
  }

  if (errors.length > 0) {
    console.log(chalk.red(`❌ 发现 ${errors.length} 个问题：`));
    for (const err of errors) {
      console.log(`  ${chalk.red('✗')} ${err}`);
    }
    process.exit(1);
  }

  console.log(chalk.green('✅ 基础验证通过！'));
  printSummary(manifest);
}

function printSummary(manifest) {
  console.log(`  ${chalk.bold(manifest.name)} v${manifest.version}`);
  console.log(`  ID: ${chalk.cyan(manifest.id)}`);
  console.log(`  能力数: ${chalk.green(manifest.capabilities?.length || 0)}`);
  
  const caps = manifest.capabilities || [];
  for (const cap of caps) {
    const intentCount = cap.intents?.length || 0;
    const hasInput = cap.input ? '✓' : '✗';
    console.log(`    ${chalk.cyan('·')} ${cap.name} (intents: ${intentCount}, input: ${hasInput})`);
  }

  if (manifest.trust?.permissions?.length) {
    console.log(`  声明的权限: ${chalk.yellow(manifest.trust.permissions.join(', '))}`);
  }
}
