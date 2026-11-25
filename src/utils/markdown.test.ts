import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  parseMarkdownDocument,
  parsePeChallenges,
  resolveMarkdownHref,
  splitPro192StageContent,
} from './markdown';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('parseMarkdownDocument', () => {
  it('extracts YAML frontmatter and converts VitePress containers & local <img> tags', () => {
    const raw = `---
title: "Test Article"
description: "Sample desc"
category: Java
tag:
  - JVM
  - GC
---

# Heading 1

::: tip Lưu ý quan trọng
Nội dung callout ở đây.
:::

<img src="/media/jg/ext/sample.png" alt="Demo" style="zoom:50%" />
<img src="http://www.mybank.com/Transfer?bankId=11&money=10000" />
`;

    const parsed = parseMarkdownDocument(raw);
    expect(parsed.meta.title).toBe('Test Article');
    expect(parsed.meta.description).toBe('Sample desc');
    expect(parsed.meta.tags).toEqual(['JVM', 'GC']);
    expect(parsed.body).toContain('> [!TIP] Lưu ý quan trọng');
    expect(parsed.body).toContain('> Nội dung callout ở đây.');
    expect(parsed.body).toContain('![Demo](/media/jg/ext/sample.png)');
    expect(parsed.body).not.toContain('<img src="http://www.mybank.com');
    expect(parsed.body).toContain('[Minh họa URL CSRF:');
  });

  it('does not touch ::: markers inside fenced code blocks', () => {
    const raw = `\`\`\`markdown
::: warning inside code
should stay literal
:::
\`\`\``;
    const parsed = parseMarkdownDocument(raw);
    expect(parsed.body).toContain('::: warning inside code');
    expect(parsed.body).not.toContain('[!WARNING]');
  });
});

describe('resolveMarkdownHref', () => {
  it('resolves relative JavaGuide and PRO192 markdown links into SPA routes', () => {
    expect(resolveMarkdownHref('pro192/README.md', './slots/slot-01.md')).toEqual({
      kind: 'internal',
      target: '/pro192/slots/slot-01',
    });

    expect(
      resolveMarkdownHref('pro192/slots/slot-01.md', '../../java/basis/java-basic-questions-01.md#oop')
    ).toEqual({
      kind: 'internal',
      target: '/docs/java/basis/java-basic-questions-01.md#oop',
    });

    expect(resolveMarkdownHref('java/README.md', './basis/')).toEqual({
      kind: 'internal',
      target: '/docs/java/basis/README.md',
    });

    expect(resolveMarkdownHref('pro192/README.md', './pe-challenges.md')).toEqual({
      kind: 'internal',
      target: '/pe',
    });

    expect(resolveMarkdownHref('pro192/README.md', './pe-patterns.md')).toEqual({
      kind: 'internal',
      target: '/pro192/pe-patterns',
    });

    expect(
      resolveMarkdownHref('pro192/slots/slot-01.md', '/media/pro192/resources/Get%20Start.pdf')
    ).toEqual({
      kind: 'media',
      target: '/media/pro192/resources/Get%20Start.pdf',
    });

    expect(resolveMarkdownHref('java/README.md', 'https://openjdk.org')).toEqual({
      kind: 'external',
      target: 'https://openjdk.org',
    });
  });
});

describe('Real PRO192 data integrity', () => {
  it('parses all 150 exercises across all 30 real slot files with non-empty prompts & <details> solutions', () => {
    const slotsDir = path.join(ROOT, 'content', 'vi', 'pro192', 'slots');
    const slotFiles = fs
      .readdirSync(slotsDir)
      .filter((f) => /^slot-\d{2}\.md$/.test(f))
      .sort();

    expect(slotFiles).toHaveLength(30);

    const allExercises = [];
    for (const file of slotFiles) {
      const raw = fs.readFileSync(path.join(slotsDir, file), 'utf8');
      const parsed = parseMarkdownDocument(raw);
      const segments = splitPro192StageContent(parsed.body);
      const exercises = segments
        .filter((s) => s.type === 'exercise')
        .map((s) => s.exercise);
      expect(exercises).toHaveLength(5);
      allExercises.push(...exercises);
    }

    expect(allExercises).toHaveLength(150);
    for (const ex of allExercises) {
      expect(ex.id).toMatch(/^\d+\.\d+$/);
      expect(ex.title.length).toBeGreaterThan(2);
      expect(ex.promptMd.length).toBeGreaterThan(10);
      expect(ex.solutionMd.length).toBeGreaterThan(10);
      expect(ex.solutionMd).not.toContain('</details>');
    }
  });

  it('parses all 19 real PE challenges from pe-challenges.md', () => {
    const pePath = path.join(ROOT, 'content', 'vi', 'pro192', 'pe-challenges.md');
    const raw = fs.readFileSync(pePath, 'utf8');
    const parsed = parseMarkdownDocument(raw);
    const challenges = parsePeChallenges(parsed.body);

    expect(challenges).toHaveLength(19);
    for (const ch of challenges) {
      expect(ch.durationMinutes).toBeGreaterThan(0);
      expect(ch.requirementsMd.length).toBeGreaterThan(20);
      expect(ch.pitfallsMd.length).toBeGreaterThan(10);
      expect(ch.solutionMd.length).toBeGreaterThan(50);
    }
  });
});
