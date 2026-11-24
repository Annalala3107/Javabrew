import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const ROOT = String.raw`e:\JavAncode`;
const manifestPath = path.join(ROOT, 'metadata', 'manifest.json');

function extractTitle(text) {
  if (!text) return '';
  if (text.startsWith('---\n') || text.startsWith('---\r\n')) {
    const endIdx = text.indexOf('\n---', 3);
    if (endIdx !== -1) {
      const fm = text.slice(4, endIdx);
      const m = fm.match(/^title:\s*(.+)$/m);
      if (m) return m[1].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  const h1 = text.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : '';
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  let enReady = 0;
  let viReady = 0;

  for (const art of manifest.articles) {
    const enAbs = path.join(ROOT, 'content', 'en', art.rel);
    const viAbs = path.join(ROOT, 'content', 'vi', art.rel);

    if (fssync.existsSync(enAbs)) {
      const txt = await fs.readFile(enAbs, 'utf8');
      art.titleEn = extractTitle(txt);
      enReady++;
    }
    if (fssync.existsSync(viAbs)) {
      const txt = await fs.readFile(viAbs, 'utf8');
      art.titleVi = extractTitle(txt);
      viReady++;
    }
  }

  manifest.updatedAt = new Date().toISOString();
  manifest.translationSummary = {
    totalArticles: manifest.articles.length,
    enFilesPresent: enReady,
    viFilesPresent: viReady,
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(JSON.stringify(manifest.translationSummary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
