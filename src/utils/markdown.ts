import yaml from 'js-yaml';
import type {
  FrontmatterMeta,
  PeChallenge,
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

export function parseMarkdownDocument(raw: string): ParsedMarkdown {
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

  const normalizedBody = preprocessMarkdown(body);
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
  | { type: 'exercise'; exercise: Pro192Exercise };

/**
 * Splits a PRO192 stage markdown body into alternating markdown prose segments
 * and interactive exercise blocks (with prompt vs hidden-by-default solution).
 */
export function splitPro192StageContent(markdownBody: string): StageSegment[] {
  const lines = markdownBody.split(/\r?\n/);
  const segments: StageSegment[] = [];
  let buffer: string[] = [];
  let inFence = false;
  let fenceChar = '';

  const exHeaderRegex = /^#{3,4}\s+Bài(?:\s+tập)?\s+(\d+)\.(\d+)\s*[:：]?\s*(.*)$/;
  const stopSectionRegex = /^##\s+/;

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
        if (buffer.length > 0) {
          const text = buffer.join('\n').trim();
          if (text) segments.push({ type: 'markdown', content: text });
          buffer = [];
        }

        const slot = Number(exMatch[1]);
        const indexInSlot = Number(exMatch[2]);
        const title = exMatch[3].trim();
        const exLines: string[] = [];
        i++;

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
            exLines.push(cur);
            i++;
            continue;
          }

          if (!innerFence) {
            if (
              exHeaderRegex.test(cur) ||
              stopSectionRegex.test(cur) ||
              /^#\s+/.test(cur) ||
              /^###\s+BỘ\s+\d*\s*BÀI TẬP/i.test(cur) ||
              /^###\s+\d+\.\d+\.\s+(?:Trọn Bộ|Bộ\s+\d+\s+bài tập)/i.test(cur) ||
              /^###\s+Bài tập Slot\s+\d+/i.test(cur) ||
              /^---\s*$/.test(cur)
            ) {
              break;
            }
          }
          exLines.push(cur);
          i++;
        }

        const rawExBody = exLines.join('\n').trim();
        const solMarker = /^([*-]\s+\*\*(?:Đáp án\s*&\s*)?Lời giải chi tiết:\*\*|\*Lời giải chi tiết:\*)/im;
        const solMatch = rawExBody.match(solMarker);

        let promptMd = rawExBody;
        let solutionMd = '';
        if (solMatch && solMatch.index !== undefined) {
          promptMd = rawExBody.slice(0, solMatch.index).trim();
          solutionMd = rawExBody.slice(solMatch.index + solMatch[0].length).trim();
          // Strip leading bullet indentation if solution lines are indented under `* **Lời giải chi tiết:**`
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
    }

    buffer.push(line);
    i++;
  }

  if (buffer.length > 0) {
    const text = buffer.join('\n').trim();
    if (text) segments.push({ type: 'markdown', content: text });
  }

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
