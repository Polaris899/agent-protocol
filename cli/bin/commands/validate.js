import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, '..', 'data', 'manifest.schema.json');

export async function validateCommand(path) {
  if (!existsSync(path)) {
    console.error(chalk.red(`❌ File not found: ${path}`));
    process.exit(1);
  }

  console.log(chalk.blue(`🔍 Validating: ${path}`));
  console.log();

  let manifest;
  try {
    const content = readFileSync(path, 'utf-8');
    // Try JSON first, could also support YAML later
    manifest = JSON.parse(content);
  } catch (err) {
    console.error(chalk.red(`❌ Parse failed: ${err.message}`));
    process.exit(1);
  }

  // Load schema
  let schema;
  try {
    schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  } catch {
    console.log(chalk.yellow('  ⚠ Schema file unavailable, running basic validation...'));
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
      console.log(chalk.green('✅ Manifest validation passed!'));
      console.log();
      printSummary(manifest);
    } else {
      console.log(chalk.red(`❌ Found ${validate.errors.length} issues:`));
      for (const err of validate.errors) {
        const path = err.instancePath || '/';
        console.log(`  ${chalk.red('✗')} ${path} ${err.message}`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ Advanced validation unavailable: ${err.message}`));
    basicValidate(manifest);
  }
}

function basicValidate(manifest) {
  const errors = [];

  if (!manifest.id) errors.push('Missing required field: id');
  if (!manifest.name) errors.push('Missing required field: name');
  if (!manifest.version) errors.push('Missing required field: version');
  if (!manifest.capabilities || !Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    errors.push('Must declare at least one capability');
  }

  if (errors.length > 0) {
    console.log(chalk.red(`❌ Found ${errors.length} issues:`));
    for (const err of errors) {
      console.log(`  ${chalk.red('✗')} ${err}`);
    }
    process.exit(1);
  }

  console.log(chalk.green('✅ Basic validation passed!'));
  printSummary(manifest);
}

function printSummary(manifest) {
  console.log(`  ${chalk.bold(manifest.name)} v${manifest.version}`);
  console.log(`  ID: ${chalk.cyan(manifest.id)}`);
  console.log(`  Capabilities: ${chalk.green(manifest.capabilities?.length || 0)}`);
  
  const caps = manifest.capabilities || [];
  for (const cap of caps) {
    const intentCount = cap.intents?.length || 0;
    const hasInput = cap.input ? '✓' : '✗';
    console.log(`    ${chalk.cyan('·')} ${cap.name} (intents: ${intentCount}, input: ${hasInput})`);
  }

  if (manifest.trust?.permissions?.length) {
    console.log(`  Declared permissions: ${chalk.yellow(manifest.trust.permissions.join(', '))}`);
  }
}
