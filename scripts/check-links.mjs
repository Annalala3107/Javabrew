import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = (process.argv[2] || '').replace(/^\/+|\/+$/g, '');

async function loadPlaygroundTemplateIds() {
  const ids = new Set();
  for (const rel of ['src/utils/javaPlayground.ts', 'src/utils/slotLabTemplates.ts']) {
    const abs = path.join(ROOT, rel);
    if (!fssync.existsSync(abs)) continue;
    const raw = await fs.readFile(abs, 'utf8');
    for (const m of raw.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)) {
      ids.add(m[1]);
    }
  }
  return ids;
}

async function walkMd(dir, out = []) {
  if (!fssync.existsSync(dir)) return out;
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walkMd(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function stripFences(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let ch = '';
  const out = [];
  for (const l of lines) {
    const m = l.match(/^\s*(`{3,}|~{3,})/);
    if (m) {
      if (!inFence) { inFence = true; ch = m[1][0]; }
      else if (m[1][0] === ch) inFence = false;
      continue;
    }
    if (!inFence) out.push(l);
  }
  return out.join('\n');
}

async function checkLang(lang, validPlaygroundIds) {
  const base = path.join(ROOT, 'content', lang);
  const files = await walkMd(path.join(base, prefix));
  const brokenLinks = [];
  const brokenImages = [];

  for (const abs of files) {
    const rel = path.relative(base, abs).replace(/\\/g, '/');
    const txt = stripFences(await fs.readFile(abs, 'utf8'));

    // Check /media/jg/ and /media/pro192/ asset paths
    for (const m of txt.matchAll(/\/media\/(?:jg|pro192)\/[a-zA-Z0-9._\-\/%]+/g)) {
      const cleanAsset = decodeURIComponent(m[0]).slice(1);
      const diskPath = path.join(ROOT, 'public', cleanAsset);
      if (!fssync.existsSync(diskPath)) {
        brokenImages.push({ rel, img: m[0] });
      }
    }

    // Check relative .md / folder links (ignoring http(s), mailto, #anchors, /media)
    for (const m of txt.matchAll(/\[[^\]]*\]\((<[^>]+>|[^)\s]+)[^)]*\)/g)) {
      const raw = m[1].trim().replace(/^<|>$/g, '');
      if (/^(https?:|mailto:|#|\/media\/)/i.test(raw)) continue;
      const pgMatch = raw.match(/^\/studio\/playground\?example=([a-z0-9-]+)$/i);
      if (pgMatch) {
        if (!validPlaygroundIds.has(pgMatch[1])) {
          brokenLinks.push({ rel, link: raw, resolvedRel: `missing-playground-example:${pgMatch[1]}` });
        }
        continue;
      }
      if (/^\/(?:studio|pe|pro192|dashboard|resources)(?:[/?#]|$)/i.test(raw)) continue;
      const targetNoHash = raw.split('#')[0];
      if (!targetNoHash) continue;
      let resolved = targetNoHash.startsWith('/')
        ? path.join(base, targetNoHash.slice(1))
        : path.resolve(path.dirname(abs), targetNoHash);
      if (targetNoHash.endsWith('/')) resolved = path.join(resolved, 'README.md');
      // Check in lang first; if target belongs to another folder not yet translated, check zh-ref
      const relFromLang = path.relative(base, resolved).replace(/\\/g, '/');
      const inLang = fssync.existsSync(resolved);
      const inZhRef = fssync.existsSync(path.join(ROOT, 'content', 'zh-ref', relFromLang));
      if (!inLang && !inZhRef) {
        brokenLinks.push({ rel, link: raw, resolvedRel: relFromLang });
      }
    }
  }

  return { lang, filesChecked: files.length, brokenImages, brokenLinks };
}

async function main() {
  const validPlaygroundIds = await loadPlaygroundTemplateIds();
  const en = await checkLang('en', validPlaygroundIds);
  const vi = await checkLang('vi', validPlaygroundIds);
  console.log(JSON.stringify({ prefix, en, vi }, null, 2));
  if (
    en.brokenImages.length > 0 ||
    en.brokenLinks.length > 0 ||
    vi.brokenImages.length > 0 ||
    vi.brokenLinks.length > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
