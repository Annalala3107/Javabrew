import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const ROOT = String.raw`e:\JavAncode`;
const prefix = (process.argv[2] || '').replace(/^\/+|\/+$/g, '');

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

async function checkLang(lang) {
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
  const en = await checkLang('en');
  const vi = await checkLang('vi');
  console.log(JSON.stringify({ prefix, en, vi }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
