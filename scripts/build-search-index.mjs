import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAV_PATH = path.join(ROOT, 'metadata', 'navigation.json');
const PRO_PATH = path.join(ROOT, 'metadata', 'pro192.json');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'search-index.json');

function parseFrontmatterAndHeadings(raw) {
  let body = raw;
  let meta = {};
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    try {
      const parsed = yaml.load(fmMatch[1]);
      if (parsed && typeof parsed === 'object') meta = parsed;
    } catch {
      // ignore malformed frontmatter
    }
    body = raw.slice(fmMatch[0].length);
  }

  // Strip fenced code blocks before scanning headings
  const cleanLines = [];
  let inFence = false;
  let fenceChar = '';
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*(`{3,}|~{3,})/);
    if (m) {
      if (!inFence) {
        inFence = true;
        fenceChar = m[1][0];
      } else if (m[1][0] === fenceChar) {
        inFence = false;
      }
      continue;
    }
    if (!inFence) cleanLines.push(line);
  }

  const headings = [];
  for (const line of cleanLines) {
    const hm = line.match(/^##\s+(.+)$/);
    if (hm) {
      headings.push(hm[1].replace(/[`*_[\]]/g, '').trim());
      if (headings.length >= 12) break;
    }
  }

  return {
    description: typeof meta.description === 'string' ? meta.description.trim() : '',
    tags: Array.isArray(meta.tag) ? meta.tag.map(String) : typeof meta.tag === 'string' ? [meta.tag] : [],
    headings,
  };
}

async function main() {
  const nav = JSON.parse(await fs.readFile(NAV_PATH, 'utf8'));
  const pro = JSON.parse(await fs.readFile(PRO_PATH, 'utf8'));

  const articles = [];

  for (const domain of nav.domains) {
    for (const group of domain.groups) {
      for (const art of group.articles) {
        const viPath = path.join(ROOT, 'content', 'vi', art.rel);
        const enPath = path.join(ROOT, 'content', 'en', art.rel);

        let viMeta = { description: '', tags: [], headings: [] };
        let enMeta = { description: '', tags: [], headings: [] };

        if (fssync.existsSync(viPath)) {
          viMeta = parseFrontmatterAndHeadings(await fs.readFile(viPath, 'utf8'));
        }
        if (fssync.existsSync(enPath)) {
          enMeta = parseFrontmatterAndHeadings(await fs.readFile(enPath, 'utf8'));
        }

        articles.push({
          rel: art.rel,
          domain: domain.id,
          domainLabelVi: domain.labelVi,
          domainLabelEn: domain.labelEn,
          group: group.id,
          groupLabelVi: group.labelVi,
          groupLabelEn: group.labelEn,
          titleVi: art.titleVi || art.titleEn,
          titleEn: art.titleEn || art.titleVi,
          descriptionVi: viMeta.description,
          descriptionEn: enMeta.description,
          tags: Array.from(new Set([...viMeta.tags, ...enMeta.tags])).slice(0, 6),
          headingsVi: viMeta.headings,
          headingsEn: enMeta.headings,
          chars: art.chars,
          lines: art.lines,
          images: art.images,
        });
      }
    }
  }

  // Index PRO192 exercises from stage markdown files
  const exercises = [];
  for (const stage of pro.stages) {
    const abs = path.join(ROOT, 'content', 'vi', stage.file);
    if (!fssync.existsSync(abs)) continue;
    const raw = await fs.readFile(abs, 'utf8');
    const matches = raw.matchAll(/^#{3,4}\s+Bài(?:\s+tập)?\s+(\d+)\.(\d+)\s*[:：]?\s*(.*)$/gm);
    for (const m of matches) {
      const slot = Number(m[1]);
      const indexInSlot = Number(m[2]);
      exercises.push({
        id: `${slot}.${indexInSlot}`,
        stageId: stage.id,
        slot,
        indexInSlot,
        title: m[3].replace(/[`*_]/g, '').trim(),
      });
    }
  }

  // Index PE Challenges
  const pePath = path.join(ROOT, 'content', 'vi', 'pro192', 'pe-challenges.md');
  const peChallenges = [];
  if (fssync.existsSync(pePath)) {
    const peRaw = await fs.readFile(pePath, 'utf8');
    for (const m of peRaw.matchAll(/^##\s+(Đề PE \d+\s+—\s+.+?)\s*\(([^)]+)\)\s*$/gm)) {
      peChallenges.push({
        id: m[1].match(/\d+/)?.[0] || String(peChallenges.length + 1),
        title: m[1].trim(),
        meta: m[2].trim(),
      });
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    OUT_FILE,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalArticles: articles.length,
      totalExercises: exercises.length,
      totalPeChallenges: peChallenges.length,
      articles,
      pro192Slots: pro.slots.map((s) => ({
        slot: s.slot,
        stage: s.stage,
        title: s.title,
        file: s.file,
      })),
      pro192Exercises: exercises,
      peChallenges,
    }),
    'utf8'
  );

  console.log(
    `Built search-index.json: ${articles.length} articles, ${pro.slots.length} slots, ${exercises.length} exercises, ${peChallenges.length} PE challenges.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
