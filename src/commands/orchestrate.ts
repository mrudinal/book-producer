import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { patchState, readState } from '../lib/state-manager.js';
import { resolveActiveBook } from '../lib/branch-mapper.js';
import { syncChapterWordCountRegistry } from '../lib/chapter-word-counts.js';
import type { SupportedTool, WorkPlan } from '../lib/work-orchestrator.js';
import type { ChapterBatchSize } from '../lib/types.js';
import {
  buildChapterPlan,
  buildExtensionPlan,
  buildResearchPlan,
  writeWorkPlan,
} from '../lib/work-orchestrator.js';

const SUPPORTED_TOOLS = ['claude', 'copilot', 'cursor', 'antigravity'] as const;

/**
 * Resolve a book slug from the CLI arg or current branch context.
 */
async function resolveSlug(slugArg: string | undefined, repoRoot: string): Promise<string> {
  if (slugArg) {
    return slugArg;
  }

  const resolution = await resolveActiveBook(repoRoot);
  if (resolution.kind === 'resolved') {
    return resolution.slug;
  }

  throw new Error('Unable to resolve an active book. Pass an explicit slug.');
}

/**
 * Validate and normalize the requested tool name.
 */
function parseTool(rawTool: string): SupportedTool {
  if ((SUPPORTED_TOOLS as readonly string[]).includes(rawTool)) {
    return rawTool as SupportedTool;
  }
  throw new Error(`Unsupported tool "${rawTool}". Use one of: ${SUPPORTED_TOOLS.join(', ')}`);
}

function parseBatchSize(rawBatchSize: string): ChapterBatchSize {
  const trimmed = rawBatchSize.trim().toLowerCase();
  if (trimmed === 'all') {
    return 'all';
  }

  const parsed = Number(trimmed);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  throw new Error('Invalid batch size. Use "all" or a positive integer (1, 2, 3, ...).');
}

function normalizeStoredBatchSize(rawBatchSize: unknown): ChapterBatchSize | null {
  if (rawBatchSize === 'all') {
    return 'all';
  }
  if (typeof rawBatchSize === 'number' && Number.isInteger(rawBatchSize) && rawBatchSize > 0) {
    return rawBatchSize;
  }
  return null;
}

async function promptForBatchSizePreference(): Promise<ChapterBatchSize> {
  const { preference } = await inquirer.prompt<{ preference: 'all' | 'one-by-one' | 'custom' }>([
    {
      type: 'list',
      name: 'preference',
      message:
        'Stage 4 (non-Claude) chapter batching: choose run mode. Large batches may hit model/API token limits.',
      choices: [
        { name: 'All requested chapters in one run (still writes one-by-one)', value: 'all' },
        { name: 'One chapter at a time', value: 'one-by-one' },
        { name: 'Grouped batches (2, 3, 4, ... chapters per run)', value: 'custom' },
      ],
    },
  ]);

  if (preference === 'all') {
    console.log(chalk.yellow('Warning: larger uninterrupted runs may exhaust model/API limits.'));
    return 'all';
  }

  if (preference === 'one-by-one') {
    return 1;
  }

  const { customSize } = await inquirer.prompt<{ customSize: string }>([
    {
      type: 'input',
      name: 'customSize',
      message: 'Enter chapter batch size (2 or greater):',
      validate: (value: string): true | string => {
        const parsed = Number(value.trim());
        return Number.isInteger(parsed) && parsed >= 2
          ? true
          : 'Enter a whole number greater than or equal to 2.';
      },
    },
  ]);

  const parsed = Number(customSize.trim());
  if (parsed >= 4) {
    console.log(chalk.yellow('Warning: larger uninterrupted runs may exhaust model/API limits.'));
  }
  return parsed;
}

function formatBatchPreference(batchSize: ChapterBatchSize): string {
  if (batchSize === 'all') {
    return 'all chapters in one uninterrupted run (written one-by-one)';
  }
  if (batchSize === 1) {
    return 'one chapter at a time';
  }
  return `groups of ${batchSize} chapters (written one-by-one inside each group)`;
}

/**
 * Render a markdown-style summary for terminal output.
 */
function formatPlan(plan: WorkPlan, planPath: string): string {
  const lines = [
    '',
    `Tool: ${plan.tool}`,
    `Book: ${plan.slug}`,
    `Work kind: ${plan.workKind}`,
    `Execution mode: ${plan.executionMode}`,
    `Saved plan: ${planPath}`,
    '',
    `${plan.summary}`,
    '',
    'Instruction files:',
    ...plan.instructionFiles.map((instructionFile) => `  - ${instructionFile}`),
    '',
    'Packets:',
    ...plan.packets.flatMap((packet) => [
      `  - ${packet.id}: ${packet.title}`,
      `    objective: ${packet.objective}`,
      `    write targets: ${packet.writeTargets.join(', ')}`,
    ]),
    '',
  ];

  return lines.join('\n');
}

/**
 * Register the orchestration helper command for tool-specific work plans.
 */
export function orchestrateCommand(): Command {
  const command = new Command('orchestrate')
    .description('Generate tool-specific chapter or research work packets');

  command
    .command('chapters [slug]')
    .description('Generate chapter-writing packets for a supported AI tool')
    .requiredOption('--chapters <chapters>', 'Comma-separated chapter numbers')
    .requiredOption('--tool <tool>', 'claude, copilot, cursor, or antigravity')
    .option('--batch-size <size>', 'For non-Claude tools: all, 1, 2, 3, ... (saved to state.json)')
    .option('--json', 'Output machine-readable JSON')
    .action(async (slugArg: string | undefined, opts: { chapters: string; tool: string; batchSize?: string; json?: boolean }) => {
      try {
        const repoRoot = process.cwd();
        const slug = await resolveSlug(slugArg, repoRoot);
        const tool = parseTool(opts.tool);
        const specFolder = path.join(repoRoot, '.spec', slug);

        if (!(await fs.pathExists(specFolder))) {
          throw new Error(`Book idea not found: ${slug}`);
        }

        const state = await readState(specFolder);
        const contentSubdir = state.bookType === 'pages' ? 'pages' : 'chapters';
        const chapters = opts.chapters
          .split(',')
          .map((chapterNumber) => Number(chapterNumber.trim()))
          .filter((chapterNumber) => Number.isInteger(chapterNumber) && chapterNumber > 0);

        if (chapters.length === 0) {
          throw new Error('At least one valid chapter number is required.');
        }

        let chapterBatchSize: ChapterBatchSize | null = null;

        if (tool !== 'claude') {
          const requestedBatchSize =
            typeof opts.batchSize === 'string' ? parseBatchSize(opts.batchSize) : null;
          const savedBatchSize = normalizeStoredBatchSize(state.chapterBatchSize);
          const resolvedBatchSize = requestedBatchSize ?? savedBatchSize ?? (await promptForBatchSizePreference());

          chapterBatchSize = resolvedBatchSize;

          if (savedBatchSize !== resolvedBatchSize) {
            await patchState(specFolder, { chapterBatchSize: resolvedBatchSize });
          }

          if (resolvedBatchSize === 'all' || (typeof resolvedBatchSize === 'number' && resolvedBatchSize >= 4)) {
            console.log(chalk.yellow('Warning: large uninterrupted chapter runs can exhaust model/API limits.'));
          }

          if (!opts.json) {
            console.log(chalk.dim(`Using non-Claude chapter batch preference: ${formatBatchPreference(resolvedBatchSize)}`));
          }
        } else if (!opts.json) {
          if (opts.batchSize) {
            console.log(chalk.yellow('Note: --batch-size is ignored for Claude chapter packets. Claude chapter writing is forced sequential one-by-one.'));
          }
          console.log(chalk.dim('Claude chapter packets are generated in strict numeric sequence to preserve continuity.'));
        }

        const plan = buildChapterPlan(slug, chapters, tool, state.orchestrationMode, chapterBatchSize, contentSubdir);
        const planPath = await writeWorkPlan(repoRoot, plan);

        if (opts.json) {
          console.log(JSON.stringify({ ...plan, planPath }, null, 2));
          return;
        }

        console.log(chalk.cyan(formatPlan(plan, planPath)));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  command
    .command('extend [slug]')
    .description('Generate chapter-extension packets for a supported AI tool')
    .option('--chapters <chapters>', 'Comma-separated chapter numbers to extend')
    .requiredOption('--tool <tool>', 'claude, copilot, cursor, or antigravity')
    .option('--batch-size <size>', 'For non-Claude tools: all, 1, 2, 3, ... (saved to state.json)')
    .option('--under-target', 'Extend every chapter currently below its target word count')
    .option('--json', 'Output machine-readable JSON')
    .action(async (slugArg: string | undefined, opts: { chapters?: string; tool: string; batchSize?: string; underTarget?: boolean; json?: boolean }) => {
      try {
        const repoRoot = process.cwd();
        const slug = await resolveSlug(slugArg, repoRoot);
        const tool = parseTool(opts.tool);
        const specFolder = path.join(repoRoot, '.spec', slug);

        if (!(await fs.pathExists(specFolder))) {
          throw new Error(`Book idea not found: ${slug}`);
        }

        const state = await readState(specFolder);
        const contentSubdir = state.bookType === 'pages' ? 'pages' : 'chapters';
        const registry = await syncChapterWordCountRegistry(specFolder, state.bookContentDir, contentSubdir);

        const explicitChapters = (opts.chapters ?? '')
          .split(',')
          .map((chapterNumber) => Number(chapterNumber.trim()))
          .filter((chapterNumber) => Number.isInteger(chapterNumber) && chapterNumber > 0);

        const underTargetChapters = registry.chapters
          .filter((entry) => entry.status === 'under-target')
          .map((entry) => entry.chapter)
          .filter((chapterNumber) => Number.isInteger(chapterNumber) && chapterNumber !== Number.MAX_SAFE_INTEGER);

        const chapters = opts.underTarget ? underTargetChapters : explicitChapters;

        if (chapters.length === 0) {
          throw new Error(
            opts.underTarget
              ? 'No under-target chapters found in chapter-word-counts.json.'
              : 'At least one valid chapter number is required.'
          );
        }

        let chapterBatchSize: ChapterBatchSize | null = null;

        if (tool !== 'claude') {
          const requestedBatchSize =
            typeof opts.batchSize === 'string' ? parseBatchSize(opts.batchSize) : null;
          const savedBatchSize = normalizeStoredBatchSize(state.chapterBatchSize);
          const resolvedBatchSize = requestedBatchSize ?? savedBatchSize ?? (await promptForBatchSizePreference());

          chapterBatchSize = resolvedBatchSize;

          if (savedBatchSize !== resolvedBatchSize) {
            await patchState(specFolder, { chapterBatchSize: resolvedBatchSize });
          }

          if (resolvedBatchSize === 'all' || (typeof resolvedBatchSize === 'number' && resolvedBatchSize >= 4)) {
            console.log(chalk.yellow('Warning: large uninterrupted chapter runs can exhaust model/API limits.'));
          }

          if (!opts.json) {
            console.log(chalk.dim(`Using non-Claude chapter batch preference: ${formatBatchPreference(resolvedBatchSize)}`));
          }
        } else if (!opts.json) {
          if (opts.batchSize) {
            console.log(chalk.yellow('Note: --batch-size is ignored for Claude extension packets. Claude chapter extension is forced sequential one-by-one.'));
          }
          console.log(chalk.dim('Claude chapter extension packets are generated in strict numeric sequence to preserve continuity.'));
        }

        const plan = buildExtensionPlan(slug, chapters, tool, state.orchestrationMode, chapterBatchSize, contentSubdir);
        const planPath = await writeWorkPlan(repoRoot, plan);

        if (opts.json) {
          console.log(JSON.stringify({ ...plan, planPath }, null, 2));
          return;
        }

        console.log(chalk.cyan(formatPlan(plan, planPath)));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  command
    .command('research [slug]')
    .description('Generate research packets for a supported AI tool')
    .requiredOption('--topics <topics>', 'Comma-separated research topics')
    .requiredOption('--tool <tool>', 'claude, copilot, cursor, or antigravity')
    .option('--json', 'Output machine-readable JSON')
    .action(async (slugArg: string | undefined, opts: { topics: string; tool: string; json?: boolean }) => {
      try {
        const repoRoot = process.cwd();
        const slug = await resolveSlug(slugArg, repoRoot);
        const tool = parseTool(opts.tool);
        const specFolder = path.join(repoRoot, '.spec', slug);

        if (!(await fs.pathExists(specFolder))) {
          throw new Error(`Book idea not found: ${slug}`);
        }

        const state = await readState(specFolder);
        const topics = opts.topics
          .split(',')
          .map((topic) => topic.trim())
          .filter(Boolean);

        if (topics.length === 0) {
          throw new Error('At least one research topic is required.');
        }

        const plan = buildResearchPlan(slug, topics, tool, state.orchestrationMode);
        const planPath = await writeWorkPlan(repoRoot, plan);

        if (opts.json) {
          console.log(JSON.stringify({ ...plan, planPath }, null, 2));
          return;
        }

        console.log(chalk.cyan(formatPlan(plan, planPath)));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  return command;
}
