import { describe, it, expect } from 'vitest';
import {
  buildChapterPlan,
  buildExtensionPlan,
  buildResearchPlan,
  resolveExecutionMode,
} from '../src/lib/work-orchestrator.js';

describe('resolveExecutionMode', () => {
  it('reports parallel adapter mode for Claude', () => {
    expect(resolveExecutionMode('claude')).toBe('parallel');
  });

  it('uses sequential packets for non-Claude tools', () => {
    expect(resolveExecutionMode('cursor')).toBe('sequential');
    expect(resolveExecutionMode('copilot')).toBe('sequential');
    expect(resolveExecutionMode('antigravity')).toBe('sequential');
  });
});

describe('buildChapterPlan', () => {
  it('creates sequential one-by-one packets for Claude chapter plans', () => {
    const plan = buildChapterPlan('my-book', [3, 1], 'claude', 'parallel');
    expect(plan.executionMode).toBe('sequential');
    expect(plan.packets).toHaveLength(2);
    expect(plan.packets[0]?.id).toBe('chapter-1');
    expect(plan.packets[1]?.id).toBe('chapter-3');
    expect(plan.packets[1]?.dependsOn).toEqual(['chapter-1']);
  });

  it('creates one-by-one sequential packets for non-Claude tools by default', () => {
    const plan = buildChapterPlan('my-book', [2, 4], 'copilot', 'sequential');
    expect(plan.executionMode).toBe('sequential');
    expect(plan.packets).toHaveLength(2);
    expect(plan.packets[0]?.id).toBe('chapter-2');
    expect(plan.packets[1]?.id).toBe('chapter-4');
    expect(plan.packets[1]?.dependsOn).toEqual(['chapter-2']);
  });

  it('uses the pages directory for pages-type work plans', () => {
    const plan = buildChapterPlan('picture-book', [1], 'copilot', 'sequential', 1, 'pages');
    expect(plan.packets[0]?.writeTargets).toContain('picture-book/pages/*.md');
  });

  it('creates one uninterrupted packet when batch size is all', () => {
    const plan = buildChapterPlan('my-book', [1, 2, 3], 'cursor', 'sequential', 'all');
    expect(plan.executionMode).toBe('sequential');
    expect(plan.packets).toHaveLength(1);
    expect(plan.packets[0]?.id).toBe('chapter-sequence-all');
  });

  it('creates grouped sequential packets when batch size is greater than 1', () => {
    const plan = buildChapterPlan('my-book', [1, 2, 3, 4, 5], 'antigravity', 'sequential', 2);
    expect(plan.executionMode).toBe('sequential');
    expect(plan.packets).toHaveLength(3);
    expect(plan.packets[0]?.id).toBe('chapter-group-1');
    expect(plan.packets[1]?.dependsOn).toEqual(['chapter-group-1']);
    expect(plan.packets[2]?.dependsOn).toEqual(['chapter-group-2']);
  });
});

describe('buildResearchPlan', () => {
  it('creates one research packet per topic for Claude', () => {
    const plan = buildResearchPlan('my-book', ['timeline', 'history'], 'claude', 'parallel');
    expect(plan.executionMode).toBe('parallel');
    expect(plan.packets).toHaveLength(2);
  });

  it('creates a serialized research packet for non-Claude tools', () => {
    const plan = buildResearchPlan('my-book', ['timeline', 'history'], 'cursor', 'sequential');
    expect(plan.executionMode).toBe('sequential');
    expect(plan.packets).toHaveLength(1);
    expect(plan.packets[0]?.id).toBe('research-sequence');
  });
});

describe('buildExtensionPlan', () => {
  it('creates one-by-one extension packets by default', () => {
    const plan = buildExtensionPlan('my-book', [3, 1], 'copilot', 'sequential');
    expect(plan.executionMode).toBe('sequential');
    expect(plan.workKind).toBe('extensions');
    expect(plan.packets).toHaveLength(2);
    expect(plan.packets[0]?.id).toBe('chapter-extension-1');
    expect(plan.packets[1]?.dependsOn).toEqual(['chapter-extension-1']);
  });

  it('creates one uninterrupted packet for all-chapter extensions', () => {
    const plan = buildExtensionPlan('my-book', [1, 2, 3], 'cursor', 'sequential', 'all');
    expect(plan.packets).toHaveLength(1);
    expect(plan.packets[0]?.id).toBe('chapter-extension-sequence-all');
    expect(plan.packets[0]?.writeTargets).toContain('.spec/my-book/assets/chapter-word-counts.json');
  });

  it('uses the pages directory for pages-type extension plans', () => {
    const plan = buildExtensionPlan('picture-book', [1], 'cursor', 'sequential', 1, 'pages');
    expect(plan.packets[0]?.writeTargets).toContain('picture-book/pages/*.md');
  });
});
