import fs from 'fs-extra';
import path from 'path';
import type { ChapterBatchSize, OrchestrationMode } from './types.js';

export type SupportedTool = 'claude' | 'copilot' | 'cursor' | 'antigravity';
export type WorkKind = 'chapters' | 'research' | 'extensions';
export type ExecutionMode = 'parallel' | 'sequential';
export type ContentSubdir = 'chapters' | 'pages';

export interface WorkPacket {
  id: string;
  title: string;
  objective: string;
  instructions: string[];
  writeTargets: string[];
  dependsOn: string[];
}

export interface WorkPlan {
  slug: string;
  tool: SupportedTool;
  workKind: WorkKind;
  executionMode: ExecutionMode;
  stateMode: OrchestrationMode;
  summary: string;
  instructionFiles: string[];
  packets: WorkPacket[];
}

interface ContentLabels {
  singular: 'chapter' | 'page';
  plural: 'chapters' | 'pages';
}

/**
 * Return the effective execution mode for a requested tool.
 */
export function resolveExecutionMode(tool: SupportedTool): ExecutionMode {
  return tool === 'claude' ? 'parallel' : 'sequential';
}

/**
 * Create a compact chapter work plan for the requested tool.
 */
export function buildChapterPlan(
  slug: string,
  chapters: number[],
  tool: SupportedTool,
  stateMode: OrchestrationMode,
  chapterBatchSize: ChapterBatchSize | null = null,
  contentSubdir: ContentSubdir = 'chapters'
): WorkPlan {
  return buildChapterLikePlan(slug, chapters, tool, stateMode, chapterBatchSize, 'chapters', contentSubdir);
}

export function buildExtensionPlan(
  slug: string,
  chapters: number[],
  tool: SupportedTool,
  stateMode: OrchestrationMode,
  chapterBatchSize: ChapterBatchSize | null = null,
  contentSubdir: ContentSubdir = 'chapters'
): WorkPlan {
  return buildChapterLikePlan(slug, chapters, tool, stateMode, chapterBatchSize, 'extensions', contentSubdir);
}

function buildChapterLikePlan(
  slug: string,
  chapters: number[],
  tool: SupportedTool,
  stateMode: OrchestrationMode,
  chapterBatchSize: ChapterBatchSize | null,
  workKind: 'chapters' | 'extensions',
  contentSubdir: ContentSubdir
): WorkPlan {
  const executionMode: ExecutionMode = 'sequential';
  const contentLabels = getContentLabels(contentSubdir);
  const chapterTargets = chapters
    .slice()
    .sort((leftChapter, rightChapter) => leftChapter - rightChapter);

  const packets = workKind === 'chapters'
    ? buildSequentialChapterPackets(slug, chapterTargets, chapterBatchSize, contentSubdir, contentLabels)
    : buildSequentialExtensionPackets(slug, chapterTargets, chapterBatchSize, contentSubdir, contentLabels);

  const sequentialSummary = describeSequentialSummary(chapterTargets.length, chapterBatchSize, workKind, contentLabels);

  return {
    slug,
    tool,
    workKind,
    executionMode,
    stateMode,
    summary: sequentialSummary,
    instructionFiles: [
      '.book-framework/AGENTS.md',
      `.book-framework/tooling/${tool}.md`,
      '.book-framework/framework/09-orchestration-policy.md',
    ],
    packets,
  };
}

function buildSequentialChapterPackets(
  slug: string,
  chapterTargets: number[],
  chapterBatchSize: ChapterBatchSize | null,
  contentSubdir: ContentSubdir,
  contentLabels: ContentLabels
): WorkPacket[] {
  if (chapterTargets.length === 0) {
    return [];
  }

  const normalizedBatchSize = normalizeBatchSize(chapterBatchSize, chapterTargets.length);

  if (normalizedBatchSize === 'all') {
    return [
      {
        id: 'chapter-sequence-all',
        title: `Draft all requested ${contentLabels.plural} (${chapterTargets.join(', ')})`,
        objective: `Draft all requested ${contentLabels.plural} sequentially, one ${contentLabels.singular} at a time, without interruption.`,
        instructions: [
          `Read stage, design, and continuity context before each ${contentLabels.singular} write.`,
          `Write ${contentLabels.singular} files in numeric order only.`,
          `Finish one ${contentLabels.singular} fully before starting the next ${contentLabels.singular}.`,
          `After each ${contentLabels.singular}, update implementation tracking and chapter-memory before continuing.`,
        ],
        writeTargets: [
          `${slug}/${contentSubdir}/*.md`,
          `.spec/${slug}/04-implementation.md`,
          `.spec/${slug}/assets/chapter-memory.json`,
        ],
        dependsOn: [],
      },
    ];
  }

  const packets: WorkPacket[] = [];
  const chunks = chunkChapters(chapterTargets, normalizedBatchSize);

  for (const [chunkIndex, chunk] of chunks.entries()) {
    const packetId =
      normalizedBatchSize === 1
        ? `chapter-${chunk[0]}`
        : `chapter-group-${chunkIndex + 1}`;
    const dependsOn = chunkIndex === 0 ? [] : [packets[chunkIndex - 1]!.id];
    const chunkLabel = chunk.length === 1 ? `${chunk[0]}` : `${chunk[0]}-${chunk[chunk.length - 1]}`;

    packets.push({
      id: packetId,
      title:
        chunk.length === 1
          ? `Draft ${contentLabels.singular} ${chunk[0]}`
          : `Draft ${contentLabels.singular} group ${chunkLabel} (${chunk.join(', ')})`,
      objective:
        chunk.length === 1
          ? `Draft ${contentLabels.singular} ${chunk[0]} and complete memory updates before the next packet.`
          : `Draft ${contentLabels.plural} ${chunk.join(', ')} sequentially, one ${contentLabels.singular} at a time, then stop.`,
      instructions: [
        `Read stage, design, and continuity context before each ${contentLabels.singular} write.`,
        `Write ${contentLabels.plural} in numeric order only.`,
        `Finish one ${contentLabels.singular} fully before starting the next ${contentLabels.singular} in this packet.`,
        `After each ${contentLabels.singular}, update implementation tracking and chapter-memory before continuing.`,
      ],
      writeTargets: [
        `${slug}/${contentSubdir}/*.md`,
        `.spec/${slug}/04-implementation.md`,
        `.spec/${slug}/assets/chapter-memory.json`,
      ],
      dependsOn,
    });
  }

  return packets;
}

function buildSequentialExtensionPackets(
  slug: string,
  chapterTargets: number[],
  chapterBatchSize: ChapterBatchSize | null,
  contentSubdir: ContentSubdir,
  contentLabels: ContentLabels
): WorkPacket[] {
  if (chapterTargets.length === 0) {
    return [];
  }

  const normalizedBatchSize = normalizeBatchSize(chapterBatchSize, chapterTargets.length);

  if (normalizedBatchSize === 'all') {
    return [
      {
        id: 'chapter-extension-sequence-all',
        title: `Extend all requested ${contentLabels.plural} (${chapterTargets.join(', ')})`,
        objective: `Extend all requested ${contentLabels.plural} sequentially, one ${contentLabels.singular} at a time, until each ${contentLabels.singular} reaches or exceeds its target word count.`,
        instructions: [
          `Read stage, design, continuity, and word-count registry context before each ${contentLabels.singular} extension.`,
          `Extend ${contentLabels.plural} in numeric order only.`,
          'Keep continuity intact and avoid filler or repetitive scenes.',
          `After each ${contentLabels.singular}, sync chapter-memory, reviewer notes, and chapter-word-count registry before continuing.`,
        ],
        writeTargets: [
          `${slug}/${contentSubdir}/*.md`,
          `.spec/${slug}/04-implementation.md`,
          `.spec/${slug}/05-review.md`,
          `.spec/${slug}/assets/chapter-memory.json`,
          `.spec/${slug}/assets/chapter-word-counts.json`,
        ],
        dependsOn: [],
      },
    ];
  }

  const packets: WorkPacket[] = [];
  const chunks = chunkChapters(chapterTargets, normalizedBatchSize);

  for (const [chunkIndex, chunk] of chunks.entries()) {
    const packetId =
      normalizedBatchSize === 1
        ? `chapter-extension-${chunk[0]}`
        : `chapter-extension-group-${chunkIndex + 1}`;
    const dependsOn = chunkIndex === 0 ? [] : [packets[chunkIndex - 1]!.id];
    const chunkLabel = chunk.length === 1 ? `${chunk[0]}` : `${chunk[0]}-${chunk[chunk.length - 1]}`;

    packets.push({
      id: packetId,
      title:
        chunk.length === 1
          ? `Extend ${contentLabels.singular} ${chunk[0]}`
          : `Extend ${contentLabels.singular} group ${chunkLabel} (${chunk.join(', ')})`,
      objective:
        chunk.length === 1
          ? `Extend ${contentLabels.singular} ${chunk[0]} to meet its target word count, then sync review and registry files before the next packet.`
          : `Extend ${contentLabels.plural} ${chunk.join(', ')} sequentially, one ${contentLabels.singular} at a time, then stop.`,
      instructions: [
        `Read stage, design, continuity, and word-count registry context before each ${contentLabels.singular} extension.`,
        `Extend ${contentLabels.plural} in numeric order only.`,
        'Keep continuity intact and avoid filler or repetitive scenes.',
        `After each ${contentLabels.singular}, sync chapter-memory, reviewer notes, and chapter-word-count registry before continuing.`,
      ],
      writeTargets: [
        `${slug}/${contentSubdir}/*.md`,
        `.spec/${slug}/04-implementation.md`,
        `.spec/${slug}/05-review.md`,
        `.spec/${slug}/assets/chapter-memory.json`,
        `.spec/${slug}/assets/chapter-word-counts.json`,
      ],
      dependsOn,
    });
  }

  return packets;
}

function normalizeBatchSize(
  chapterBatchSize: ChapterBatchSize | null,
  chapterCount: number
): ChapterBatchSize {
  if (chapterBatchSize === 'all') {
    return 'all';
  }

  if (typeof chapterBatchSize === 'number' && Number.isInteger(chapterBatchSize) && chapterBatchSize > 0) {
    return Math.min(chapterBatchSize, chapterCount);
  }

  return 1;
}

function chunkChapters(chapters: number[], size: number): number[][] {
  const chunks: number[][] = [];
  for (let index = 0; index < chapters.length; index += size) {
    chunks.push(chapters.slice(index, index + size));
  }
  return chunks;
}

function describeSequentialSummary(
  chapterCount: number,
  chapterBatchSize: ChapterBatchSize | null,
  workKind: 'chapters' | 'extensions',
  contentLabels: ContentLabels
): string {
  const subject = workKind === 'extensions'
    ? `${contentLabels.singular} extension packets`
    : `${contentLabels.singular} packets`;
  const action = workKind === 'extensions'
    ? `extend each ${contentLabels.singular} to the expected word count`
    : `draft ${contentLabels.plural}`;

  if (chapterBatchSize === 'all') {
    return `Sequential ${subject} for all ${chapterCount} requested ${contentLabels.plural} (one-by-one with no interruption) to ${action}.`;
  }
  if (typeof chapterBatchSize === 'number' && chapterBatchSize > 1) {
    return `Sequential ${subject} for ${chapterCount} ${contentLabels.plural} grouped in batches of ${chapterBatchSize} (one-by-one inside each batch) to ${action}.`;
  }
  return `Sequential ${subject} for ${chapterCount} ${contentLabels.plural} in one-by-one mode (all tools, including Claude) to ${action}.`;
}

function getContentLabels(contentSubdir: ContentSubdir): ContentLabels {
  if (contentSubdir === 'pages') {
    return {
      singular: 'page',
      plural: 'pages',
    };
  }

  return {
    singular: 'chapter',
    plural: 'chapters',
  };
}

/**
 * Create a compact research work plan for the requested tool.
 */
export function buildResearchPlan(
  slug: string,
  topics: string[],
  tool: SupportedTool,
  stateMode: OrchestrationMode
): WorkPlan {
  const executionMode = resolveExecutionMode(tool);
  const cleanedTopics = topics.map((topic) => topic.trim()).filter(Boolean);

  const packets =
    executionMode === 'parallel' && cleanedTopics.length > 1
      ? cleanedTopics.map((topic, index) => ({
          id: `research-${index + 1}`,
          title: `Research: ${topic}`,
          objective: `Prepare a research note for "${topic}" without editing another topic file.`,
          instructions: [
            'Capture sources, constraints, and open questions relevant to the active book.',
            'Write findings into the assigned research note only.',
            'Do not alter chapter prose while research packets are in progress.',
          ],
          writeTargets: [`.spec/${slug}/assets/research/${slugifyTopic(topic, index + 1)}.md`],
          dependsOn: [],
        }))
      : [
          {
            id: 'research-sequence',
            title: `Research sequence (${cleanedTopics.join('; ')})`,
            objective: 'Work through each research topic in order and consolidate the notes.',
            instructions: [
              'Capture sources, constraints, and open questions relevant to the active book.',
              'Finish one topic before starting the next.',
              'Keep chapter writing serialized while the research packet is active.',
            ],
            writeTargets: [`.spec/${slug}/assets/research/*.md`],
            dependsOn: [],
          },
        ];

  return {
    slug,
    tool,
    workKind: 'research',
    executionMode,
    stateMode,
    summary:
      executionMode === 'parallel'
        ? `Parallel research packets for ${cleanedTopics.length} independent topic(s).`
        : `Sequential research packet covering ${cleanedTopics.length} topic(s).`,
    instructionFiles: [
      '.book-framework/AGENTS.md',
      `.book-framework/tooling/${tool}.md`,
      '.book-framework/framework/09-orchestration-policy.md',
    ],
    packets,
  };
}

/**
 * Persist the latest work plan under the book assets folder for tool handoff.
 */
export async function writeWorkPlan(repoRoot: string, plan: WorkPlan): Promise<string> {
  const planDir = path.join(repoRoot, '.spec', plan.slug, 'assets', 'orchestration');
  const planPath = path.join(planDir, `${plan.workKind}-${plan.tool}.json`);
  await fs.ensureDir(planDir);
  await fs.writeJSON(planPath, plan, { spaces: 2 });
  return planPath;
}

/**
 * Slugify a research topic for note-file generation.
 */
function slugifyTopic(topic: string, index: number): string {
  const slug = topic
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `topic-${index}`;
}
