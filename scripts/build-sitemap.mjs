import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAV_PATH = path.join(ROOT, 'metadata', 'navigation.json');
const PRO_PATH = path.join(ROOT, 'metadata', 'pro192.json');
const OUT_PATH = path.join(ROOT, 'public', 'sitemap.xml');

const SITE_URL = (process.env.SITE_URL || 'https://javabrew.vercel.app').replace(/\/+$/, '');

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stageFileToSlug(file) {
  return String(file || '').replace(/^pro192\//, '').replace(/\.md$/, '');
}

async function main() {
  const [navRaw, proRaw] = await Promise.all([
    fs.readFile(NAV_PATH, 'utf8'),
    fs.readFile(PRO_PATH, 'utf8'),
  ]);
  const nav = JSON.parse(navRaw);
  const pro = JSON.parse(proRaw);
  const lastmod = new Date().toISOString().slice(0, 10);

  const routes = new Set([
    '/',
    '/dashboard',
    '/pro192',
    '/pro192/pe-patterns',
    '/docs',
    '/pe',
    '/pe/mock',
    '/studio/playground',
    '/notes',
    '/resources',
  ]);

  const mockPapers = new Set();
  for (const pe of pro.peChallenges || []) {
    if (pe.id) routes.add(`/studio/${pe.id}`);
    const match = String(pe.paper || pe.code || '').match(/^(PE\d+)/i);
    if (match?.[1]) mockPapers.add(match[1].toUpperCase());
  }
  for (const paper of Array.from(mockPapers).sort()) {
    routes.add(`/pe/mock/${paper}`);
  }

  for (const slot of pro.slots || []) {
    if (slot.file) {
      routes.add(`/pro192/${stageFileToSlug(slot.file)}`);
    }
  }

  for (const domain of nav.domains || []) {
    for (const group of domain.groups || []) {
      for (const art of group.articles || []) {
        if (art.rel) {
          routes.add(`/docs/${art.rel}`);
        }
      }
    }
  }

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const route of routes) {
    const priority = route === '/' ? '1.0' : route.startsWith('/pe/mock') || route === '/pro192' ? '0.9' : '0.7';
    const loc = `${SITE_URL}${route === '/' ? '/' : route}`;
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(loc)}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`    <priority>${priority}</priority>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>', '');
  await fs.writeFile(OUT_PATH, lines.join('\n'), 'utf8');
  console.log(`Generated sitemap with ${routes.size} URLs -> ${path.relative(ROOT, OUT_PATH)}`);
}

main().catch((err) => {
  console.error('build-sitemap failed:', err);
  process.exit(1);
});
