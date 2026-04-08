import fs from 'fs-extra';
import path from 'path';
import type {
  ChapterWordCountEntry,
  ChapterWordCountRegistry,
  ChapterWordCountStatus,
} from './types.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;
const DEFAULT_REGISTRY: ChapterWordCountRegistry = {
  version: 1,
  lastSyncedAt: null,
  chapters: [],
};

interface ParsedFrontmatter {
  chapter?: number;
  title?: string;
  word_count_target?: number;
}

function parseFrontmatter(raw: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {};

  for (const line of raw.split('\n')) {
    const match = /^([A-Za-z_][\w]*):\s*(.*)$/.exec(line.trim());
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const cleanedValue = rawValue.replace(/^["']|["']$/g, '');
    const numericValue = Number(cleanedValue);
    const value = Number.isNaN(numericValue) ? cleanedValue : numericValue;

    if (key === 'chapter' && typeof value === 'number') {
      result.chapter = value;
    } else if (key === 'title' && typeof value === 'string') {
      result.title = value;
    } else if (key === 'word_count_target' && typeof value === 'number') {
      result.word_count_target = value;
    }
  }

  return result;
}

export function getChapterWordCountRegistryPath(bookIdeaFolder: string): string {
  return path.join(bookIdeaFolder, 'assets', 'chapter-word-counts.json');
}

export function stripFrontmatter(markdown: string): string {
  return markdown.replace(FRONTMATTER_RE, '');
}

export function countMarkdownWords(markdown: string): number {
  const withoutFrontmatter = stripFrontmatter(markdown);
  const withoutComments = withoutFrontmatter.replace(/<!--([\s\S]*?)-->/g, ' ');
  const withoutMarkdownSyntax = withoutComments
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '');
  const normalized = withoutMarkdownSyntax.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(' ').length;
}

export async function readChapterWordCountRegistry(
  bookIdeaFolder: string
): Promise<ChapterWordCountRegistry> {
  const registryPath = getChapterWordCountRegistryPath(bookIdeaFolder);
  if (!(await fs.pathExists(registryPath))) {
    return { ...DEFAULT_REGISTRY, chapters: [] };
  }

  return (await fs.readJSON(registryPath)) as ChapterWordCountRegistry;
}

export async function writeChapterWordCountRegistry(
  bookIdeaFolder: string,
  registry: ChapterWordCountRegistry
): Promise<void> {
  const registryPath = getChapterWordCountRegistryPath(bookIdeaFolder);
  await fs.ensureDir(path.dirname(registryPath));
  await fs.writeJSON(registryPath, registry, { spaces: 2 });
}

function buildStatus(targetWordCount: number | null, actualWordCount: number): ChapterWordCountStatus {
  if (targetWordCount === null) {
    return 'missing-target';
  }

  return actualWordCount < targetWordCount ? 'under-target' : 'meets-target';
}

function compareEntries(left: ChapterWordCountEntry, right: ChapterWordCountEntry): number {
  if (left.chapter !== right.chapter) {
    return left.chapter - right.chapter;
  }

  return left.file.localeCompare(right.file);
}

export async function syncChapterWordCountRegistry(
  bookIdeaFolder: string,
  bookContentDir: string,
  contentSubdir: 'chapters' | 'pages' = 'chapters'
): Promise<ChapterWordCountRegistry> {
  const directory = path.join(bookContentDir, contentSubdir);
  const syncedAt = new Date().toISOString();

  if (!(await fs.pathExists(directory))) {
    const emptyRegistry: ChapterWordCountRegistry = {
      version: 1,
      lastSyncedAt: syncedAt,
      chapters: [],
    };
    await writeChapterWordCountRegistry(bookIdeaFolder, emptyRegistry);
    return emptyRegistry;
  }

  const entries = await fs.readdir(directory);
  const files = entries.filter((entry) => entry.endsWith('.md')).sort();

  const chapters: ChapterWordCountEntry[] = [];

  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const frontmatterMatch = FRONTMATTER_RE.exec(content);
    const frontmatter = frontmatterMatch ? parseFrontmatter(frontmatterMatch[1]) : {};
    const chapter = typeof frontmatter.chapter === 'number' ? frontmatter.chapter : Number.MAX_SAFE_INTEGER;
    const targetWordCount = typeof frontmatter.word_count_target === 'number'
      ? frontmatter.word_count_target
      : null;
    const actualWordCount = countMarkdownWords(content);
    const shortfall = targetWordCount === null ? 0 : Math.max(targetWordCount - actualWordCount, 0);

    chapters.push({
      chapter,
      title: frontmatter.title ?? null,
      file,
      targetWordCount,
      actualWordCount,
      shortfall,
      status: buildStatus(targetWordCount, actualWordCount),
      lastSyncedAt: syncedAt,
    });
  }

  chapters.sort(compareEntries);

  const registry: ChapterWordCountRegistry = {
    version: 1,
    lastSyncedAt: syncedAt,
    chapters,
  };

  await writeChapterWordCountRegistry(bookIdeaFolder, registry);
  return registry;
}