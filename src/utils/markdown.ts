import yaml from 'js-yaml';
import type {
  FrontmatterMeta,
  PeChallenge,
  Pro192CodingDrill,
  Pro192Exercise,
  TocHeading,
} from '../types/content';

/**
 * Deterministic slugifier compatible with GitHub / rehype-slug heading IDs.
 */
export function createSlugger() {
  const counts = new Map<string, number>();

  return function slug(rawText: string): string {
    const cleaned = rawText
      .trim()
      .toLowerCase()
      .replace(/[`*_~[\]()<>!@#$%^&+=|\\:;"',.?/]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const base = cleaned || 'section';
    const prev = counts.get(base) ?? 0;
    counts.set(base, prev + 1);
    return prev === 0 ? base : `${base}-${prev}`;
  };
}

export interface ParsedMarkdown {
  meta: FrontmatterMeta;
  body: string;
  headings: TocHeading[];
}

/**
 * Normalizes VitePress `::: tip ... :::` containers and safe inline `<img>` tags
 * inside markdown (outside fenced code blocks) before passing to react-markdown.
 */
export function preprocessMarkdown(body: string): string {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  let fenceChar = '';
  let inContainer: { kind: string; title: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[1][0];
      } else if (fenceMatch[1][0] === fenceChar) {
        inFence = false;
      }
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // Handle ::: tip / warning / info / danger / note containers
    const openContainer = line.match(/^:::\s*(tip|warning|info|danger|note)(?:\s+(.*))?$/i);
    if (openContainer && !inContainer) {
      const kind = openContainer[1].toLowerCase();
      const defaultTitle: Record<string, string> = {
        tip: 'Mẹo & Lưu ý',
        warning: 'Cảnh báo',
        info: 'Thông tin',
        danger: 'Quan trọng',
        note: 'Ghi chú',
      };
      const title = (openContainer[2] || defaultTitle[kind] || kind).trim();
      inContainer = { kind, title };
      out.push(`> [!${kind.toUpperCase()}] ${title}`);
      continue;
    }

    if (inContainer && /^:::\s*$/.test(line)) {
      inContainer = null;
      out.push('');
      continue;
    }

    // Convert HTML <img ...> tags outside fences into clean Markdown images
    // (Skip non-local http:// demo CSRF URLs such as mybank.com)
    const processedLine = line.replace(/<img\s+([^>]*?)\/?\s*>/gi, (_full, attrs: string) => {
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) return '';
      const src = srcMatch[1];
      if (/^http:\/\/www\.mybank\.com/i.test(src)) {
        return '`[Minh họa URL CSRF: ' + src + ']`';
      }
      const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : '';
      return `![${alt}](${src})`;
    });

    if (inContainer) {
      out.push(processedLine.trim() === '' ? '>' : `> ${processedLine}`);
    } else {
      out.push(processedLine);
    }
  }

  return out.join('\n');
}

export interface ParseMarkdownOptions {
  stripLeadingH1?: boolean;
  deduplicateGalleryImages?: boolean;
}

function stripLeadingH1Line(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  let fenceChar = '';
  let stripped = false;
  let seenH2 = false;
  let skipFollowingBlanks = false;

  for (const line of lines) {
    const fm = line.match(/^\s*(`{3,}|~{3,})/);
    if (fm) {
      if (!inFence) {
        inFence = true;
        fenceChar = fm[1][0];
      } else if (fm[1][0] === fenceChar) {
        inFence = false;
      }
      skipFollowingBlanks = false;
      out.push(line);
      continue;
    }

    if (!inFence && !stripped && !seenH2) {
      if (/^##+\s+/.test(line)) {
        seenH2 = true;
      } else if (/^#\s+\S/.test(line)) {
        stripped = true;
        skipFollowingBlanks = true;
        continue;
      }
    }

    if (skipFollowingBlanks && line.trim() === '') {
      continue;
    }
    skipFollowingBlanks = false;
    out.push(line);
  }

  return out.join('\n');
}

function deduplicateGalleryDetails(markdown: string): string {
  const galleryRegex = /<details>\s*<summary>([^<]*🖼️[^<]*)<\/summary>([\s\S]*?)<\/details>/g;
  return markdown.replace(galleryRegex, (_full, summaryText: string, body: string, offset: number) => {
    const beforeSlice = markdown.slice(0, offset);
    const seenUrls = new Set<string>();
    for (const m of beforeSlice.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      seenUrls.add(m[1].trim());
    }

    const keptLines: string[] = [];
    for (const m of body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const url = m[1].trim();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        keptLines.push(m[0]);
      }
    }

    if (keptLines.length === 0) {
      return '';
    }

    const updatedSummary = summaryText.replace(
      /\(\d+\s*ảnh\)/i,
      `(${keptLines.length} ảnh)`
    );
    return `<details>\n<summary>${updatedSummary}</summary>\n\n${keptLines.join('\n\n')}\n\n</details>`;
  });
}

export function parseMarkdownDocument(
  raw: string,
  options?: ParseMarkdownOptions
): ParsedMarkdown {
  let body = raw;
  const meta: FrontmatterMeta = { tags: [] };

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    try {
      const parsed = yaml.load(fmMatch[1]);
      if (parsed && typeof parsed === 'object') {
        const rec = parsed as Record<string, unknown>;
        if (typeof rec.title === 'string') meta.title = rec.title;
        if (typeof rec.description === 'string') meta.description = rec.description;
        if (typeof rec.category === 'string') meta.category = rec.category;
        if (typeof rec.slots === 'string') meta.slots = rec.slots;
        if (typeof rec.lang === 'string') meta.lang = rec.lang;
        if (Array.isArray(rec.tag)) meta.tags = rec.tag.map(String);
        else if (typeof rec.tag === 'string') meta.tags = [rec.tag];
      }
    } catch {
      // Ignore malformed YAML frontmatter
    }
    body = raw.slice(fmMatch[0].length);
  }

  let normalizedBody = preprocessMarkdown(body);
  if (options?.stripLeadingH1) {
    normalizedBody = stripLeadingH1Line(normalizedBody);
  }
  if (options?.deduplicateGalleryImages) {
    normalizedBody = deduplicateGalleryDetails(normalizedBody);
  }
  const headings = extractHeadings(normalizedBody);

  return {
    meta,
    body: normalizedBody,
    headings,
  };
}

export function extractHeadings(markdownBody: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = markdownBody.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  const slugger = createSlugger();

  for (const line of lines) {
    const fm = line.match(/^\s*(`{3,}|~{3,})/);
    if (fm) {
      if (!inFence) {
        inFence = true;
        fenceChar = fm[1][0];
      } else if (fm[1][0] === fenceChar) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const hm = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (!hm) continue;

    const level = hm[1].length as 1 | 2 | 3;
    const rawText = hm[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[`*_~]/g, '')
      .trim();

    if (!rawText) continue;
    const id = slugger(rawText);
    headings.push({ id, text: rawText, level });
  }

  return headings;
}

/**
 * Resolves relative markdown links inside either `/docs/...` or `/pro192/...`
 * into internal SPA paths, or returns null if external/media.
 */
export function resolveMarkdownHref(
  currentRel: string,
  href: string
): { kind: 'internal' | 'media' | 'hash' | 'external'; target: string } {
  const trimmed = href.trim();
  if (!trimmed) return { kind: 'hash', target: '#' };
  if (trimmed.startsWith('#')) return { kind: 'hash', target: trimmed };
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return { kind: 'external', target: trimmed };
  }
  if (trimmed.startsWith('/media/')) {
    return { kind: 'media', target: trimmed };
  }
  if (/^\/(?:studio|pe|pro192|dashboard|resources|docs)(?:[/?#]|$)/.test(trimmed)) {
    return { kind: 'internal', target: trimmed };
  }

  const [rawPath, hashPart] = trimmed.split('#');
  const hash = hashPart ? `#${hashPart}` : '';

  // Compute POSIX path resolution relative to currentRel's directory
  const baseParts = currentRel.split('/').slice(0, -1);
  const relSegments = rawPath.startsWith('/')
    ? rawPath.slice(1).split('/')
    : [...baseParts, ...rawPath.split('/')];

  const resolved: string[] = [];
  for (const seg of relSegments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      resolved.pop();
    } else {
      resolved.push(seg);
    }
  }

  let joined = resolved.join('/');
  if (rawPath.endsWith('/') && !joined.endsWith('.md')) {
    joined = joined ? `${joined}/README.md` : 'README.md';
  }

  if (joined.startsWith('pro192/')) {
    const file = joined.slice('pro192/'.length);
    if (file === 'pe-challenges.md') return { kind: 'internal', target: `/pe${hash}` };
    if (file === 'README.md') return { kind: 'internal', target: `/pro192${hash}` };
    return { kind: 'internal', target: `/pro192/${file.replace(/\.md$/, '')}${hash}` };
  }

  return { kind: 'internal', target: `/docs/${joined}${hash}` };
}

export type StageSegment =
  | { type: 'markdown'; content: string }
  | { type: 'exercise'; exercise: Pro192Exercise }
  | { type: 'drill'; drill: Pro192CodingDrill };

function collectSectionLines(
  lines: string[],
  startIndex: number,
  isBoundary: (line: string) => boolean
): { blockLines: string[]; nextIndex: number } {
  const blockLines: string[] = [];
  let i = startIndex;
  let innerFence = false;
  let innerFenceChar = '';

  while (i < lines.length) {
    const cur = lines[i];
    const curFm = cur.match(/^\s*(`{3,}|~{3,})/);
    if (curFm) {
      if (!innerFence) {
        innerFence = true;
        innerFenceChar = curFm[1][0];
      } else if (curFm[1][0] === innerFenceChar) {
        innerFence = false;
      }
      blockLines.push(cur);
      i++;
      continue;
    }

    if (!innerFence && isBoundary(cur)) {
      break;
    }
    blockLines.push(cur);
    i++;
  }

  return { blockLines, nextIndex: i };
}

/**
 * Splits a PRO192 stage markdown body into alternating markdown prose segments,
 * interactive exercise blocks, and Live Lab coding drills.
 */
export function splitPro192StageContent(markdownBody: string): StageSegment[] {
  const lines = markdownBody.split(/\r?\n/);
  const segments: StageSegment[] = [];
  let buffer: string[] = [];
  let inFence = false;
  let fenceChar = '';

  const exHeaderRegex = /^#{3,4}\s+Bài(?:\s+tập)?\s+(\d+)\.(\d+)\s*[:：]?\s*(.*)$/;
  const drillHeaderRegex = /^####\s+(?:(🟢|🟡|🔴)\s*)?Thực hành\s+(\d+[A-Z])\s*[:：]\s*(.+)$/;
  const stopSectionRegex = /^##\s+/;

  const isBlockBoundary = (cur: string) =>
    exHeaderRegex.test(cur) ||
    drillHeaderRegex.test(cur) ||
    stopSectionRegex.test(cur) ||
    /^#\s+/.test(cur) ||
    /^###\s+/.test(cur) ||
    /^---\s*$/.test(cur);

  const flushMarkdownBuffer = () => {
    if (buffer.length > 0) {
      const text = buffer.join('\n').trim();
      if (text) segments.push({ type: 'markdown', content: text });
      buffer = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fm = line.match(/^\s*(`{3,}|~{3,})/);
    if (fm) {
      if (!inFence) {
        inFence = true;
        fenceChar = fm[1][0];
      } else if (fm[1][0] === fenceChar) {
        inFence = false;
      }
      buffer.push(line);
      i++;
      continue;
    }

    if (!inFence) {
      const exMatch = line.match(exHeaderRegex);
      if (exMatch) {
        flushMarkdownBuffer();
        const slot = Number(exMatch[1]);
        const indexInSlot = Number(exMatch[2]);
        const title = exMatch[3].trim();
        const { blockLines, nextIndex } = collectSectionLines(lines, i + 1, isBlockBoundary);
        i = nextIndex;

        const rawExBody = blockLines.join('\n').trim();
        const detailsMarker = /<details>\s*<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i;
        const detailsMatch = rawExBody.match(detailsMarker);
        const solMarker = /^([*-]\s+\*\*(?:Đáp án\s*&\s*)?Lời giải chi tiết:\*\*|\*Lời giải chi tiết:\*)/im;
        const solMatch = rawExBody.match(solMarker);

        let promptMd = rawExBody;
        let solutionMd = '';
        if (detailsMatch && detailsMatch.index !== undefined) {
          promptMd = rawExBody.slice(0, detailsMatch.index).trim();
          solutionMd = detailsMatch[1].trim();
        } else if (solMatch && solMatch.index !== undefined) {
          promptMd = rawExBody.slice(0, solMatch.index).trim();
          solutionMd = rawExBody.slice(solMatch.index + solMatch[0].length).trim();
          solutionMd = solutionMd
            .split(/\r?\n/)
            .map((l) => l.replace(/^ {2}/, ''))
            .join('\n')
            .trim();
        }

        segments.push({
          type: 'exercise',
          exercise: {
            id: `${slot}.${indexInSlot}`,
            slot,
            indexInSlot,
            title,
            promptMd,
            solutionMd,
          },
        });
        continue;
      }

      const drillMatch = line.match(drillHeaderRegex);
      if (drillMatch) {
        flushMarkdownBuffer();
        const badgeEmoji = drillMatch[1] || '';
        const id = drillMatch[2].trim();
        const slot = Number(id.match(/^\d+/)?.[0]) || 1;
        const title = drillMatch[3].trim();
        const level: 'basic' | 'advanced' =
          badgeEmoji === '🟢' || (!badgeEmoji && id.endsWith('A')) ? 'basic' : 'advanced';

        const { blockLines, nextIndex } = collectSectionLines(lines, i + 1, isBlockBoundary);
        i = nextIndex;

        const rawBody = blockLines.join('\n').trim();
        const detailsMatch = rawBody.match(
          /<details>\s*<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i
        );
        const promptMd =
          detailsMatch && detailsMatch.index !== undefined
            ? rawBody.slice(0, detailsMatch.index).trim()
            : rawBody;
        const solutionMd = detailsMatch ? detailsMatch[1].trim() : '';

        const goalMatch = promptMd.match(/^-\s*\*\*Mục tiêu:\*\*\s*(.+)$/im);
        const goal = goalMatch ? goalMatch[1].trim() : title;

        const expectedMatch = promptMd.match(
          /\*\*Expected Output:\*\*([\s\S]*?)(?=```|\n-\s*🔗|\n####|$)/i
        );
        const expectedOutputLines = (expectedMatch?.[1] || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => /^[-*]\s+/.test(l) && !l.includes('🔗'))
          .map((l) => l.replace(/^[-*]\s+/, '').trim().replace(/^`([\s\S]*)`$/, '$1'));

        const labMatch = promptMd.match(/\/studio\/playground\?example=([A-Za-z0-9-]+)/);
        const codeMatch = promptMd.match(/```java\s*\r?\n([\s\S]*?)```/i);

        segments.push({
          type: 'drill',
          drill: {
            id,
            slot,
            level,
            title,
            goal,
            expectedOutputLines,
            starterCode: codeMatch ? codeMatch[1].trimEnd() : '',
            labExampleId: labMatch ? labMatch[1] : undefined,
            solutionMd,
          },
        });
        continue;
      }
    }

    buffer.push(line);
    i++;
  }

  flushMarkdownBuffer();
  return segments;
}

/**
 * Parses `content/vi/pro192/pe-challenges.md` into structured PE Challenge cards.
 */
export function parsePeChallenges(markdownBody: string): PeChallenge[] {
  const parts = markdownBody.split(/^##\s+(?=Đề PE \d+)/gm);
  const challenges: PeChallenge[] = [];

  for (const part of parts) {
    const headMatch = part.match(/^(Đề PE (\d+)\s+—\s+.+?)\s*\(([^)]+)\)\s*\r?\n([\s\S]*)$/);
    if (!headMatch) continue;

    const title = headMatch[1].trim();
    const id = headMatch[2].trim();
    const meta = headMatch[3].trim();
    const durationMatch = meta.match(/(\d+)\s*phút/i);
    const durationMinutes = durationMatch ? Number(durationMatch[1]) : 45;

    const rest = headMatch[4].replace(/\r?\n---\s*$/g, '').trim();

    const reqSplit = rest.split(/^###\s+/gm);
    let requirementsMd = '';
    let pitfallsMd = '';
    let solutionMd = '';

    for (const sec of reqSplit) {
      const trimmedSec = sec.trim();
      if (!trimmedSec) continue;
      if (trimmedSec.startsWith('Yêu cầu đề bài')) {
        requirementsMd = trimmedSec.replace(/^Yêu cầu đề bài\s*/, '').trim();
      } else if (trimmedSec.startsWith('Bẫy thường gặp')) {
        pitfallsMd = trimmedSec.replace(/^Bẫy thường gặp\s*/, '').trim();
      } else if (trimmedSec.startsWith('Lời giải chuẩn')) {
        solutionMd = trimmedSec.replace(/^Lời giải chuẩn\s*/, '').trim();
      }
    }

    challenges.push({
      id,
      title,
      meta,
      durationMinutes,
      requirementsMd,
      pitfallsMd,
      solutionMd,
    });
  }

  return challenges;
}
