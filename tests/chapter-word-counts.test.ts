import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  countMarkdownWords,
  syncChapterWordCountRegistry,
} from '../src/lib/chapter-word-counts.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'book-fw-word-counts-'));
  await fs.ensureDir(path.join(tmpDir, '.spec', 'my-book', 'assets'));
  await fs.ensureDir(path.join(tmpDir, 'my-book', 'chapters'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('countMarkdownWords', () => {
  it('ignores frontmatter and HTML comments when counting words', () => {
    const content = [
      '---',
      'chapter: 1',
      'title: "Chapter 1: Opening"',
      '---',
      '',
      '# Chapter 1: Opening',
      '',
      'One two three.',
      '<!-- hidden note should not count -->',
      'Four five.',
      '',
    ].join('\n');

    expect(countMarkdownWords(content)).toBe(8);
  });
});

describe('syncChapterWordCountRegistry', () => {
  it('syncs actual counts and target counts from chapter files into JSON', async () => {
    const chapterContent = [
      '---',
      'chapter: 19',
      'title: "Chapter 19: The Breaking Point"',
      'status: draft',
      'word_count_target: 3300',
      'word_count_actual: 824',
      'assigned_agent: chapter-writer',
      'reviewer_notes: ""',
      'pov: "Clara"',
      'heat_level: "Low"',
      '---',
      '',
      '# Chapter 19: The Breaking Point',
      '',
      'This chapter is intentionally short for the test fixture only.',
      '',
    ].join('\n');

    await fs.writeFile(path.join(tmpDir, 'my-book', 'chapters', '19-breaking-point.md'), chapterContent, 'utf-8');

    const registry = await syncChapterWordCountRegistry(
      path.join(tmpDir, '.spec', 'my-book'),
      path.join(tmpDir, 'my-book')
    );

    expect(registry.chapters).toHaveLength(1);
    expect(registry.chapters[0]?.chapter).toBe(19);
    expect(registry.chapters[0]?.targetWordCount).toBe(3300);
    expect(registry.chapters[0]?.actualWordCount).toBeLessThan(3300);
    expect(registry.chapters[0]?.status).toBe('under-target');

    const saved = await fs.readJSON(path.join(tmpDir, '.spec', 'my-book', 'assets', 'chapter-word-counts.json'));
    expect(saved.chapters[0].targetWordCount).toBe(3300);
    expect(saved.chapters[0].actualWordCount).toBe(registry.chapters[0]?.actualWordCount);
  });

  it('marks chapters without a target as missing-target', async () => {
    const legacyChapterContent = [
      '---',
      'chapter: 1',
      'title: "The Glass Tower"',
      'pov: "Clara"',
      'heat_level: "Low"',
      '---',
      '',
      '# The Glass Tower',
      '',
      'Legacy chapter content lives here.',
      '',
    ].join('\n');

    await fs.writeFile(path.join(tmpDir, 'my-book', 'chapters', '01-the-glass-tower.md'), legacyChapterContent, 'utf-8');

    const registry = await syncChapterWordCountRegistry(
      path.join(tmpDir, '.spec', 'my-book'),
      path.join(tmpDir, 'my-book')
    );

    expect(registry.chapters[0]?.status).toBe('missing-target');
    expect(registry.chapters[0]?.title).toBe('The Glass Tower');
  });
});