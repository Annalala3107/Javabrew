export type DiffLineType = 'same' | 'add' | 'remove';

export interface DiffLine {
  type: DiffLineType;
  oldLine?: number;
  newLine?: number;
  text: string;
}

export interface LineDiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  unchanged: number;
}

function splitLines(text: string): string[] {
  if (!text) return [];
  return text.replace(/\r\n/g, '\n').split('\n');
}

function buildLinearFallback(a: string[], b: string[]): LineDiffResult {
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix++;
  }

  const lines: DiffLine[] = [];
  for (let i = 0; i < prefix; i++) {
    lines.push({ type: 'same', oldLine: i + 1, newLine: i + 1, text: a[i] });
  }
  for (let i = prefix; i < a.length - suffix; i++) {
    lines.push({ type: 'remove', oldLine: i + 1, text: a[i] });
  }
  for (let j = prefix; j < b.length - suffix; j++) {
    lines.push({ type: 'add', newLine: j + 1, text: b[j] });
  }
  for (let k = 0; k < suffix; k++) {
    const oldIdx = a.length - suffix + k;
    const newIdx = b.length - suffix + k;
    lines.push({ type: 'same', oldLine: oldIdx + 1, newLine: newIdx + 1, text: a[oldIdx] });
  }

  return {
    lines,
    added: b.length - prefix - suffix,
    removed: a.length - prefix - suffix,
    unchanged: prefix + suffix,
  };
}

/**
 * Computes a deterministic line-by-line LCS diff for Code Studio Diff Viewer.
 */
export function computeLineDiff(before: string, after: string): LineDiffResult {
  const a = splitLines(before);
  const b = splitLines(after);

  if (a.length === 0 && b.length === 0) {
    return { lines: [], added: 0, removed: 0, unchanged: 0 };
  }

  if (before.replace(/\r\n/g, '\n') === after.replace(/\r\n/g, '\n')) {
    return {
      lines: a.map((text, idx) => ({ type: 'same', oldLine: idx + 1, newLine: idx + 1, text })),
      added: 0,
      removed: 0,
      unchanged: a.length,
    };
  }

  if (a.length > 600 || b.length > 600) {
    return buildLinearFallback(a, b);
  }

  const m = a.length;
  const n = b.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
      }
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      lines.push({ type: 'same', oldLine: i + 1, newLine: j + 1, text: a[i] });
      unchanged += 1;
      i += 1;
      j += 1;
    } else if (i < m && (j === n || dp[i + 1][j] >= dp[i][j + 1])) {
      lines.push({ type: 'remove', oldLine: i + 1, text: a[i] });
      removed += 1;
      i += 1;
    } else if (j < n) {
      lines.push({ type: 'add', newLine: j + 1, text: b[j] });
      added += 1;
      j += 1;
    }
  }

  return { lines, added, removed, unchanged };
}
