#!/usr/bin/env node

/**
 * Agent Manifest Protocol CLI
 * 
 * Usage:
 *   agent search <query>       — Search for Skills
 *   agent install <repo>       — Install a Skill from GitHub
 *   agent list                  — List installed Skills
 *   agent update                — Update all installed Skills
 *   agent info <name|id>       — Show Skill info
 *   agent validate <path>      — Validate a manifest file
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { searchCommand } from './commands/search.js';
import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { updateCommand } from './commands/update.js';
import { infoCommand } from './commands/info.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('agent')
  .description('Agent Manifest Protocol CLI — discover and manage AI Skills')
  .version('0.1.0');

program
  .command('search')
  .description('Search for Skills matching your intent')
  .argument('<query>', 'Search query (natural language or keywords)')
  .option('-l, --limit <n>', 'Max results', '10')
  .option('--json', 'Output as JSON')
  .action(searchCommand);

program
  .command('install')
  .description('Install a Skill from GitHub (user/repo)')
  .argument('<repo>', 'GitHub repository (e.g., openclaw/weather-skill)')
  .option('--dir <path>', 'Install directory', '~/.agents')
  .action(installCommand);

program
  .command('list')
  .description('List installed Skills')
  .option('--json', 'Output as JSON')
  .action(listCommand);

program
  .command('update')
  .description('Update all installed Skills')
  .action(updateCommand);

program
  .command('info')
  .description('Show detailed info about a Skill')
  .argument('<name>', 'Skill name or ID')
  .option('--json', 'Output as JSON')
  .action(infoCommand);

program
  .command('validate')
  .description('Validate a manifest file against the schema')
  .argument('<path>', 'Path to agent.json or agent.yaml')
  .action(validateCommand);

program.parse(process.argv);
