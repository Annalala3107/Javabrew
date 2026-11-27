import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_DIR = path.join(ROOT, 'public', 'media');
const TARGET_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const MIN_CONVERT_BYTES = 50 * 1024; // 50 KB

async function walkImages(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkImages(full, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTS.has(ext)) {
        const stat = await fs.stat(full);
        out.push({ path: full, ext, bytes: stat.size });
      }
    }
  }
  return out;
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const applyMode = process.argv.includes('--apply');
  const images = await walkImages(MEDIA_DIR);
  const totalBytes = images.reduce((acc, item) => acc + item.bytes, 0);
  const largeImages = images.filter((item) => item.bytes > MIN_CONVERT_BYTES);
  const largeBytes = largeImages.reduce((acc, item) => acc + item.bytes, 0);

  if (!applyMode) {
    console.log(`[optimize-media-webp] --dry-run report for ${path.relative(ROOT, MEDIA_DIR)}`);
    console.log(`- Total PNG/JPG/JPEG files: ${images.length} (${formatMb(totalBytes)})`);
    console.log(
      `- Eligible (> 50 KB) for WebP: ${largeImages.length} (${formatMb(largeBytes)}, estimated savings ~${formatMb(largeBytes * 0.65)})`
    );
    const top10 = [...images].sort((a, b) => b.bytes - a.bytes).slice(0, 10);
    console.log('- Top 10 largest raster images:');
    for (const img of top10) {
      console.log(`  * ${(img.bytes / 1024).toFixed(1)} KB  ${path.relative(ROOT, img.path)}`);
    }
    console.log('Run with "--apply" (requires optional devDependency "sharp") to generate .webp siblings.');
    return;
  }

  let sharpFn;
  try {
    const mod = await import('sharp');
    sharpFn = mod.default || mod;
  } catch {
    console.error('[optimize-media-webp] Missing optional package "sharp" for --apply mode.');
    console.error('Install temporarily with: npm i -D sharp && node scripts/optimize-media-webp.mjs --apply');
    process.exit(1);
  }

  let converted = 0;
  let savedBytes = 0;

  for (const item of largeImages) {
    const webpPath = item.path.replace(/\.(png|jpe?g)$/i, '.webp');
    const buffer = await sharpFn(item.path).webp({ quality: 82 }).toBuffer();
    if (buffer.byteLength < item.bytes) {
      await fs.writeFile(webpPath, buffer);
      converted++;
      savedBytes += item.bytes - buffer.byteLength;
    }
  }

  console.log(
    `[optimize-media-webp] --apply complete: converted ${converted}/${largeImages.length} files, saved ${formatMb(savedBytes)}.`
  );
}

main().catch((err) => {
  console.error('optimize-media-webp failed:', err);
  process.exit(1);
});
