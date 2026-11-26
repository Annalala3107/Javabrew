import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = (process.argv[2] || '').replace(/^\/+|\/+$/g, '');

async function walkMd(dir, out = []) {
  if (!fssync.existsSync(dir)) return out;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function extractMediaPaths(text) {
  const found = new Set();
  const re = /\/media\/jg\/[a-zA-Z0-9._\-\/]+/g;
  let m;
  while ((m = re.exec(text)) !== null) found.add(m[0]);
  return [...found].sort();
}

function countCodeFences(text) {
  const lines = text.split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) count++;
  }
  return count;
}

function findResidualCjkOutsideCode(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
    if (/^\s*sourceRef:\s*/.test(line)) continue;
    // Ignore inline code spans, SQL string literals ('...'), and URLs (including anchor fragments)
    if (/^\s*\|/.test(line)) continue; // ignore markdown table rows with dataset sample values
    const stripped = line
      .replace(/`[^`]*`/g, '')
      .replace(/'[^']*'/g, '')
      .replace(/\]\([^)]+\)/g, ']()')
      .replace(/https?:\/\/[^\s)>]+/g, '');
    const m = stripped.match(/[\u4e00-\u9fff]{2,}/g);
    if (m) {
      hits.push({ line: i + 1, sample: m.slice(0, 3).join(', ') });
    }
  }
  return hits;
}

function countHeadings(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let count = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^#{1,6}\s+/.test(line)) count++;
  }
  return count;
}

async function main() {
  const zhDir = path.join(ROOT, 'content', 'zh-ref', prefix);
  const zhFiles = (await walkMd(zhDir)).sort();

  let okCount = 0;
  const issues = [];

  for (const zhAbs of zhFiles) {
    const rel = path.relative(path.join(ROOT, 'content', 'zh-ref'), zhAbs).replace(/\\/g, '/');
    const enAbs = path.join(ROOT, 'content', 'en', rel);
    const viAbs = path.join(ROOT, 'content', 'vi', rel);

    const zhText = await fs.readFile(zhAbs, 'utf8');
    const zhImgs = extractMediaPaths(zhText);
    const zhHeadings = countHeadings(zhText);

    const fileIssues = [];

    for (const [lang, targetAbs] of [['en', enAbs], ['vi', viAbs]]) {
      if (!fssync.existsSync(targetAbs)) {
        fileIssues.push(`${lang}: missing file`);
        continue;
      }
      const txt = await fs.readFile(targetAbs, 'utf8');
      if (txt.trim().length < 50) {
        fileIssues.push(`${lang}: unexpectedly short (${txt.length} chars)`);
      }
      const fences = countCodeFences(txt);
      if (fences % 2 !== 0) {
        fileIssues.push(`${lang}: unbalanced code fences (${fences})`);
      }
      const targetImgs = extractMediaPaths(txt);
      const missingImgs = zhImgs.filter((img) => !targetImgs.includes(img));
      if (missingImgs.length > 0) {
        fileIssues.push(`${lang}: missing ${missingImgs.length} image(s): ${missingImgs.slice(0, 3).join(', ')}`);
      }
      for (const img of targetImgs) {
        if (!fssync.existsSync(path.join(ROOT, 'public', img.slice(1)))) {
          fileIssues.push(`${lang}: broken local image on disk: ${img}`);
        }
      }
      const cjk = findResidualCjkOutsideCode(txt);
      if (cjk.length > 0) {
        fileIssues.push(`${lang}: residual CJK prose at lines ${cjk.slice(0, 5).map((x) => `${x.line}(${x.sample})`).join('; ')}`);
      }
      const hCount = countHeadings(txt);
      if (Math.abs(hCount - zhHeadings) > 2) {
        fileIssues.push(`${lang}: heading count drift (zh=${zhHeadings}, ${lang}=${hCount})`);
      }
    }

    if (fileIssues.length === 0) okCount++;
    else issues.push({ rel, fileIssues });
  }

  console.log(JSON.stringify({
    prefix: prefix || 'all',
    totalZhFiles: zhFiles.length,
    cleanPairs: okCount,
    filesWithIssues: issues.length,
    issues,
  }, null, 2));
  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
