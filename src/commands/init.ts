/**
 * init command — create or resume a named book idea.
 *
 * OPTIONAL: This command is provided as a CLI convenience. 
 * In chat-first workflow, the agent creates .spec/<book-idea>/ directly without using this command.
 *
 * Usage (CLI):
 *   book-producer init "My Book Title"
 *   book-producer init "My Book Title" --type pages --category fiction --text-length small
 *   book-producer init "My Book Title" --images --image-strategy auto --image-placement per-page --image-continuity prompt-injection
 *   book-producer init "My Book Title" --category non-fiction --research-strategy active-web
 *   book-producer init "My Book Title" --language English --other-languages "Spanish,French" --instruction-language Spanish
 *   book-producer init "My Book Title" --mode sequential
 *   book-producer init "My Book Title" --force
 *   book-producer init "My Book Title" --force --yes
 */
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import {
  normalizeSlug,
  findBookIdeaMatch,
  createBookIdea,
} from '../lib/book-idea-manager.js';
import { bootstrapBookIdeaTemplates } from '../lib/template-engine.js';
import { detectOrchestrationMode, describeMode } from '../lib/orchestration.js';
import { requireForceConfirmation } from '../lib/force-policy.js';
import { patchState, readState } from '../lib/state-manager.js';
import type { BookIdeaState, OrchestrationMode, ImageConfig, ResearchConfig, TextLength, ImagePlacement } from '../lib/types.js';

interface InitOpts {
  type?: string;
  category?: string;
  language?: string;
  instructionLanguage?: string;
  otherLanguages?: string;
  textLength?: string;
  images?: boolean;
  imagePlacement?: string;
  imagePlacementNotes?: string;
  imageStrategy?: string;
  imageCustomInstructions?: string;
  imageContinuity?: string;
  researchStrategy?: string;
  mode?: string;
  force?: boolean;
  yes?: boolean;
}

interface RequestedLanguageSettings {
  mainLanguage: string | null;
  otherLanguages: string[];
  instructionLanguage: string | null;
  hasBookLanguageOverride: boolean;
  hasInstructionLanguageOverride: boolean;
}

function parseOtherLanguages(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const unique: string[] = [];
  for (const token of value.split(',').map((part) => part.trim()).filter(Boolean)) {
    if (!unique.some((existing) => existing.toLowerCase() === token.toLowerCase())) {
      unique.push(token);
    }
  }
  return unique;
}

/**
 * Normalize explicit language overrides from CLI input.
 */
function normalizeLanguageSettings(
  mainLanguage: string | undefined,
  otherLanguagesInput: string | undefined,
  instructionLanguage: string | undefined
): RequestedLanguageSettings {
  const normalizedMain = mainLanguage?.trim() ? mainLanguage.trim() : null;
  const parsedOthers = parseOtherLanguages(otherLanguagesInput);
  const filteredOthers = normalizedMain
    ? parsedOthers.filter((value) => value.toLowerCase() !== normalizedMain.toLowerCase())
    : parsedOthers;
  const normalizedInstructionLanguage = instructionLanguage?.trim() ? instructionLanguage.trim() : null;
  return {
    mainLanguage: normalizedMain,
    otherLanguages: filteredOthers,
    instructionLanguage: normalizedInstructionLanguage,
    hasBookLanguageOverride: mainLanguage !== undefined || otherLanguagesInput !== undefined,
    hasInstructionLanguageOverride: instructionLanguage !== undefined,
  };
}

/**
 * Format persisted language settings for CLI feedback.
 */
function formatLanguageSettingsSummary(
  settings: Pick<BookIdeaState, 'instructionLanguage' | 'mainLanguage' | 'otherLanguages'>
): string {
  return (
    `instruction=${settings.instructionLanguage ?? 'unset'}, ` +
    `main=${settings.mainLanguage ?? 'unset'}, ` +
    `others=${settings.otherLanguages.join(', ') || 'none'}`
  );
}

/**
 * Update stored language settings only when the user passed explicit overrides.
 */
async function updateLanguageSettings(
  folder: string,
  state: Pick<BookIdeaState, 'instructionLanguage' | 'mainLanguage' | 'otherLanguages'>,
  requested: RequestedLanguageSettings
): Promise<boolean> {
  const patch: Partial<BookIdeaState> = {};
  let hasChanges = false;
  const existingOtherLanguages = state.otherLanguages ?? [];
  const sameBookLanguage =
    (state.mainLanguage ?? null) === requested.mainLanguage &&
    existingOtherLanguages.length === requested.otherLanguages.length &&
    existingOtherLanguages.every((value, index) => value === requested.otherLanguages[index]);

  if (requested.hasBookLanguageOverride && !sameBookLanguage) {
    Object.assign(patch, {
      mainLanguage: requested.mainLanguage,
      otherLanguages: requested.otherLanguages,
    });
    hasChanges = true;
  }

  if (
    requested.hasInstructionLanguageOverride &&
    (state.instructionLanguage ?? null) !== requested.instructionLanguage
  ) {
    patch.instructionLanguage = requested.instructionLanguage;
    hasChanges = true;
  }

  if (hasChanges) {
    await patchState(folder, patch);
  }

  return hasChanges;
}

export function initCommand(): Command {
  return new Command('init')
    .description('Create or resume a named book idea')
    .argument('[name]', 'Book idea name or title')
    .option('--type <type>', 'Book type: chapters or pages', 'chapters')
    .option('--category <category>', 'Content category: fiction or non-fiction', 'fiction')
    .option('--language <language>', 'Primary book language to store in state')
    .option('--other-languages <languages>', 'Comma-separated additional languages used in the book')
    .option('--instruction-language <language>', 'Language for spec files and book-scoped workflow instructions')
    .option('--text-length <length>', 'Default text length for pages')
    .option('--images', 'Enable images')
    .option('--image-placement <placement>', 'none, end-of-chapter, per-page, on-event, custom')
    .option('--image-placement-notes <notes>', 'Notes for image placement')
    .option('--image-strategy <strategy>', 'auto, generate, download, custom, skip')
    .option('--image-custom-instructions <instructions>', 'Custom instructions for image generation')
    .option('--image-continuity <mode>', 'prompt-injection, seed, reference-image, none')
    .option('--research-strategy <strategy>', 'auto, active-web, ai-knowledge')
    .option('--mode <mode>', 'Orchestration mode: parallel or sequential')
    .option('--force', 'Reset bootstrap files for the selected book idea')
    .option('--yes', 'Skip confirmation prompts (CI use only)')
    .action(async (nameArg: string | undefined, opts: InitOpts): Promise<void> => {
      const repoRoot = process.cwd();
      let rawName = nameArg;
      const requestedLanguages = normalizeLanguageSettings(
        opts.language,
        opts.otherLanguages,
        opts.instructionLanguage
      );
      
      const bookType = (opts.type as 'chapters' | 'pages') || 'chapters';
      const contentCategory = (opts.category as 'fiction' | 'non-fiction') || 'fiction';
      const textLength = opts.textLength ? (opts.textLength as TextLength) : (bookType === 'pages' ? 'small' : null);
      
      let imageConfig: ImageConfig | null = null;
      if (opts.images || bookType === 'pages') {
        imageConfig = {
          enabled: true,
          strategy: (opts.imageStrategy as ImageConfig['strategy']) || 'auto',
          customInstructions: opts.imageCustomInstructions || null,
          placement: (opts.imagePlacement as ImagePlacement) || (bookType === 'pages' ? 'per-page' : 'end-of-chapter'),
          placementDescription: opts.imagePlacementNotes || '',
          visualContinuity: (opts.imageContinuity as ImageConfig['visualContinuity']) || 'prompt-injection',
        };
      }
      
      let researchConfig: ResearchConfig | null = null;
      if (contentCategory === 'non-fiction') {
        researchConfig = {
          enabled: true,
          strategy: (opts.researchStrategy as ResearchConfig['strategy']) || 'auto',
        };
      }

      if (!rawName) {
        const answer = await inquirer.prompt<{ name: string }>([
          {
            type: 'input',
            name: 'name',
            message: 'What is the name or title of your book idea?',
            validate: (v: string): true | string => v.trim().length > 0 || 'Name cannot be empty.',
          },
        ]);
        rawName = answer.name;
      }

      const slug = normalizeSlug(rawName);
      if (!slug) {
        console.error(chalk.red('  ✗  Could not derive a valid slug from the provided name.'));
        process.exit(1);
      }

      const hasClaudeDir = await fs.pathExists(path.join(repoRoot, '.claude'));
      const detectedMode = detectOrchestrationMode(process.env, hasClaudeDir);
      let orchMode: OrchestrationMode = detectedMode;
      if (opts.mode === 'parallel' || opts.mode === 'sequential') {
        orchMode = opts.mode as OrchestrationMode;
      }

      const match = await findBookIdeaMatch(repoRoot, slug);

      if (match.kind === 'exact') {
        const { choice } = await inquirer.prompt<{ choice: string }>([
          {
            type: 'list',
            name: 'choice',
            message: `Book idea "${slug}" already exists. What would you like to do?`,
            choices: [
              { name: 'Continue existing book idea', value: 'continue' },
              { name: 'Create a new book idea (new name required)', value: 'new' },
            ],
          },
        ]);

        if (choice === 'continue') {
          const folder = path.join(repoRoot, '.spec', slug);
          if (opts.force) {
            const confirmed = await requireForceConfirmation({
              action: `This will reset the bootstrap files (00-current-status.md, 01-init.md) for book idea "${slug}". Chapter files will NOT be deleted.`,
              targets: [path.join(folder, '00-current-status.md'), path.join(folder, '01-init.md')],
              ...(opts.yes !== undefined ? { autoYes: opts.yes } : {}),
            });
            if (!confirmed) {
              console.log(chalk.dim('  Aborted.'));
              process.exit(0);
            }
          }
          
          const existingState = await readState(folder);
          
          if (fs.existsSync(path.join(folder, '02-plan.md'))) {
            if (opts.type && opts.type !== existingState.bookType) {
              console.error(chalk.red(`  ✗  bookType cannot be changed after planning has begun. To use a different book type, run: book-producer init "<New Title>" --type ${opts.type}`));
              process.exit(1);
            }
            if (opts.category && opts.category !== existingState.contentCategory) {
              console.error(chalk.red(`  ✗  contentCategory cannot be changed after planning has begun. To use a different content category, run: book-producer init "<New Title>" --category ${opts.category}`));
              process.exit(1);
            }
          }
          
          const vars = { BOOK_IDEA_NAME: rawName, BOOK_IDEA_SLUG: slug, DATE: new Date().toISOString().split('T')[0] };
          await bootstrapBookIdeaTemplates(folder, vars, opts.force ?? false);
          
          const languageSettingsChanged = await updateLanguageSettings(folder, existingState, requestedLanguages);
          console.log(chalk.green(`\n  ✓  Book idea "${slug}" resumed at ${folder}\n`));
          console.log(chalk.dim(`  Orchestration mode: ${describeMode(orchMode)}`));
          if (languageSettingsChanged) {
            console.log(
              chalk.dim(
                `  Language settings updated: ${formatLanguageSettingsSummary(requestedLanguages)}`
              )
            );
          }
          console.log(chalk.dim('  Run stage 1-book-init to begin or continue.\n'));
          return;
        }

        const { newName } = await inquirer.prompt<{ newName: string }>([
          {
            type: 'input',
            name: 'newName',
            message: 'Enter a different name for the new book idea:',
            validate: (v: string): true | string => {
              const s = normalizeSlug(v);
              return s.length > 0 && s !== slug ? true : 'Please provide a different name.';
            },
          },
        ]);
        rawName = newName;
      } else if (match.kind === 'close') {
        console.log(chalk.yellow(`\n  Similar book idea found: "${match.suggestion}"`));
        const { choice } = await inquirer.prompt<{ choice: string }>([
          {
            type: 'list',
            name: 'choice',
            message: 'Would you like to continue that book idea or create a new one?',
            choices: [
              { name: `Continue "${match.suggestion}"`, value: 'existing' },
              { name: `Create new book idea "${slug}"`, value: 'new' },
            ],
          },
        ]);

        if (choice === 'existing') {
          const folder = path.join(repoRoot, '.spec', match.suggestion);
          const existingState = await readState(folder);
          
          if (fs.existsSync(path.join(folder, '02-plan.md'))) {
            if (opts.type && opts.type !== existingState.bookType) {
              console.error(chalk.red(`  ✗  bookType cannot be changed after planning has begun. To use a different book type, run: book-producer init "<New Title>" --type ${opts.type}`));
              process.exit(1);
            }
            if (opts.category && opts.category !== existingState.contentCategory) {
              console.error(chalk.red(`  ✗  contentCategory cannot be changed after planning has begun. To use a different content category, run: book-producer init "<New Title>" --category ${opts.category}`));
              process.exit(1);
            }
          }
          
          const vars = { BOOK_IDEA_NAME: rawName, BOOK_IDEA_SLUG: match.suggestion, DATE: new Date().toISOString().split('T')[0] };
          await bootstrapBookIdeaTemplates(folder, vars, false);
          
          const languageSettingsChanged = await updateLanguageSettings(folder, existingState, requestedLanguages);
          console.log(chalk.green(`\n  ✓  Book idea "${match.suggestion}" resumed at ${folder}\n`));
          if (languageSettingsChanged) {
            console.log(
              chalk.dim(
                `  Language settings updated: ${formatLanguageSettingsSummary(requestedLanguages)}`
              )
            );
          }
          return;
        }
      }

      const { folder, bookContentDir, state } = await createBookIdea(repoRoot, rawName, orchMode, {
        instructionLanguage: requestedLanguages.instructionLanguage,
        mainLanguage: requestedLanguages.mainLanguage,
        otherLanguages: requestedLanguages.otherLanguages,
        bookType,
        contentCategory,
        textLength,
        imageConfig,
        researchConfig,
      });
      const vars = {
        BOOK_IDEA_NAME: rawName,
        BOOK_IDEA_SLUG: state.sanitizedBookIdeaName,
        DATE: new Date().toISOString().split('T')[0],
      };
      await bootstrapBookIdeaTemplates(folder, vars, true);

      console.log('');
      console.log(chalk.green(`  ✓  Book idea "${state.sanitizedBookIdeaName}" created`));
      console.log(chalk.dim(`     Spec   : ${folder}`));
      console.log(chalk.dim(`     Content: ${bookContentDir}`));
      console.log(chalk.dim(`     Orchestration mode: ${describeMode(orchMode)}`));
      if (requestedLanguages.hasBookLanguageOverride || requestedLanguages.hasInstructionLanguageOverride) {
        console.log(
          chalk.dim(
            `     Language settings: ${formatLanguageSettingsSummary(state)}`
          )
        );
      }
      console.log('');
      console.log(chalk.white('  Next step: run stage  1-book-init  to capture your book idea.'));
      console.log('');
    });
}
