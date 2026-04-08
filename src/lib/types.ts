/**
 * Shared TypeScript types for book-producer CLI.
 */

/** Workflow stage identifiers. */
export type StageId =
  | '1-book-init'
  | '2-book-planner'
  | '3-book-designer'
  | '4-chapter-writer'
  | '5-book-reviewer'
  | '6-publish-assembler';

/** Tool-specific orchestration mode. */
export type OrchestrationMode = 'parallel' | 'sequential';

/** Preferred chapter batching strategy for non-Claude stage-4 writing. */
export type ChapterBatchSize = 'all' | number;

/** Machine-readable runtime state for a book idea. */
export interface BookIdeaState {
  bookIdeaName: string;
  sanitizedBookIdeaName: string;
  bookIdeaMemoryFolder: string;   // .spec/<slug>/ — spec files only
  bookContentDir: string;          // <slug>/ at repo root — chapters + manuscript
  currentStage: StageId | 'none';
  completedSteps: StageId[];
  incompletedStages: StageId[];
  nextRecommendedStep: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  initialized: boolean;
  finalized: boolean;
  orchestrationMode: OrchestrationMode;
  chapterBatchSize: ChapterBatchSize | null;
  instructionLanguage: string | null;
  mainLanguage: string | null;
  otherLanguages: string[];
  bookType: 'chapters' | 'pages';
  pageCount: number | null;
  textLength: TextLength | null;
  contentCategory: 'fiction' | 'non-fiction';
  imageConfig: ImageConfig | null;
  researchConfig: ResearchConfig | null;
  chapterCount: number;
  manuscriptFile: string | null;
}

export type TextLength = 'minimal' | 'small' | 'medium' | 'large';

export type ImagePlacement = 'none' | 'end-of-chapter' | 'per-page' | 'on-event' | 'custom';

export interface ImageConfig {
  enabled: boolean;
  strategy: 'auto' | 'generate' | 'download' | 'custom' | 'skip';
  customInstructions: string | null;
  placement: ImagePlacement;
  placementDescription: string;
  visualContinuity: 'prompt-injection' | 'seed' | 'reference-image' | 'none';
}

export interface ResearchConfig {
  enabled: boolean;
  strategy: 'auto' | 'active-web' | 'ai-knowledge';
}

/** Chapter frontmatter parsed from a chapter .md file. */
export interface ChapterFrontmatter {
  chapter: number;
  title: string;
  status: 'draft' | 'revised' | 'approved';
  word_count_target: number;
  word_count_actual: number;
  assigned_agent: string;
  reviewer_notes: string;
}

/** A single chapter summary entry in chapter-memory.json. */
export interface ChapterMemoryEntry {
  chapter: number;
  title: string;
  status: 'draft' | 'revised' | 'approved';
  summary: string;
  key_facts: string[];
  open_threads: string[];
  word_count: number;
  image_references?: string[];
  image_seeds?: string[];
}

/** Full chapter-memory.json structure. */
export interface ChapterMemory {
  version: number;
  globalVisualGuidance?: string;
  chapters: ChapterMemoryEntry[];
}

export type ChapterWordCountStatus = 'missing-target' | 'under-target' | 'meets-target';

export interface ChapterWordCountEntry {
  chapter: number;
  title: string | null;
  file: string;
  targetWordCount: number | null;
  actualWordCount: number;
  shortfall: number;
  status: ChapterWordCountStatus;
  lastSyncedAt: string;
}

export interface ChapterWordCountRegistry {
  version: number;
  lastSyncedAt: string | null;
  chapters: ChapterWordCountEntry[];
}

/** Result of a book-idea name match lookup. */
export type BookIdeaMatchResult =
  | { kind: 'exact'; slug: string }
  | { kind: 'close'; slug: string; suggestion: string }
  | { kind: 'none'; slug: string };

/** Options shared across commands that support --force. */
export interface ForceOptions {
  force?: boolean;
  yes?: boolean;
}
