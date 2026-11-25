import fs from 'node:fs';
import path from 'node:path';

const ROOT = String.raw`e:\JavAncode`;
const PRO_DIR = path.join(ROOT, 'content', 'vi', 'pro192');
const SLOTS_DIR = path.join(PRO_DIR, 'slots');
const META_PATH = path.join(ROOT, 'metadata', 'pro192.json');
const IMG_DISK_DIR = path.join(ROOT, 'public', 'media', 'pro192', 'images');

const issues = [];
let totalExercises = 0;
let markdownFilesChecked = 0;

// 1. Assert zero legacy giai-doan-*.md files remain
const leftoverLegacy = fs.readdirSync(PRO_DIR).filter((f) => /^giai-doan-.*\.md$/i.test(f));
if (leftoverLegacy.length > 0) {
  issues.push({ file: 'content/vi/pro192/', issue: `Legacy monolithic stage files still exist: ${leftoverLegacy.join(', ')}` });
}

// 2. Assert README.md, pe-patterns.md & pe-challenges.md exist + no references to giai-doan-
for (const coreFile of ['README.md', 'pe-patterns.md', 'pe-challenges.md']) {
  const abs = path.join(PRO_DIR, coreFile);
  if (!fs.existsSync(abs)) {
    issues.push({ file: coreFile, issue: 'Missing core PRO192 Markdown file' });
  } else {
    markdownFilesChecked++;
    const txt = fs.readFileSync(abs, 'utf8');
    if (/giai-doan-\d+/.test(txt)) {
      issues.push({ file: coreFile, issue: 'Contains stale reference to legacy giai-doan-*.md' });
    }
    checkCommonMarkdown(coreFile, txt, { allowHeapSlideTerms: coreFile === 'README.md' });
    if (coreFile === 'pe-challenges.md') {
      const peHeadings = txt.match(/^##\s+Đề PE \d+\s+—\s+.+?\([^)]+\)\s*$/gm) || [];
      if (peHeadings.length !== 19) {
        issues.push({
          file: coreFile,
          issue: `Expected 19 canonical PE headings, found ${peHeadings.length}`,
        });
      }
    }
  }
}

function checkCommonMarkdown(label, txt, { allowHeapSlideTerms = false } = {}) {
  const lines = txt.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let h1Count = 0;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const fm = l.match(/^\s*(`{3,}|~{3,})/);
    if (fm) {
      if (!inFence) { inFence = true; fenceChar = fm[1][0]; }
      else if (fm[1][0] === fenceChar) inFence = false;
      continue;
    }
    if (!inFence && /^#\s+/.test(l)) {
      h1Count++;
    }
  }

  if (inFence) issues.push({ file: label, issue: 'Unclosed code fence' });
  if (/new\s+int\s*;/.test(txt)) issues.push({ file: label, issue: 'Broken array syntax (new int;)' });
  if (/\\\\\(|\\\\\[|\\rightarrow|\\longrightarrow|\\mathbf/.test(txt)) {
    issues.push({ file: label, issue: 'Unconverted LaTeX macro remains' });
  }

  const noCode = txt.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  if (/\$[^$\n]+\$/.test(noCode)) {
    issues.push({ file: label, issue: 'Unconverted inline $...$ LaTeX outside code blocks' });
  }

  if (!allowHeapSlideTerms && /(?:Static|Dynamic)\s+Heap/i.test(txt)) {
    issues.push({ file: label, issue: 'Stale slide term Static/Dynamic Heap found outside Slots 06-07' });
  }

  return h1Count;
}

// 3. Validate all 30 standalone slot files
let slotsChecked = 0;
for (let n = 1; n <= 30; n++) {
  const n2 = String(n).padStart(2, '0');
  const relLabel = `slots/slot-${n2}.md`;
  const abs = path.join(SLOTS_DIR, `slot-${n2}.md`);
  if (!fs.existsSync(abs)) {
    issues.push({ file: relLabel, issue: 'Missing standalone slot file' });
    continue;
  }

  slotsChecked++;
  markdownFilesChecked++;
  const txt = fs.readFileSync(abs, 'utf8');

  // YAML frontmatter check
  const fmMatch = txt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fmMatch) {
    issues.push({ file: relLabel, issue: 'Missing YAML frontmatter' });
  } else {
    const fm = fmMatch[1];
    for (const key of ['slot:', 'stage:', 'title:', 'examFocus:', 'estimatedMinutes:', 'slidePdf:', 'slidePptx:']) {
      if (!fm.includes(key)) {
        issues.push({ file: relLabel, issue: `Frontmatter missing field "${key}"` });
      }
    }
  }

  const h1Count = checkCommonMarkdown(relLabel, txt, { allowHeapSlideTerms: n === 6 || n === 7 });
  if (h1Count !== 1) {
    issues.push({ file: relLabel, issue: `Expected strictly 1 H1 outside code fences, found ${h1Count}` });
  }

  // Verify 5 standard H2 blocks outside code fences
  const bodyNoCode = txt.replace(/```[\s\S]*?```/g, '');
  for (const h2 of [
    /^## 1\. Mục tiêu đầu ra & Định vị bài học/m,
    /^## 2\. Lý thuyết cốt lõi/m,
    /^## 3\. Góc Giảng viên:/m,
    /^## 4\. Luyện tập Chủ động/m,
    /^## 5\. Study Bridge/m,
  ]) {
    if (!h2.test(bodyNoCode)) {
      issues.push({ file: relLabel, issue: `Missing standard section heading: ${h2}` });
    }
  }

  // Verify 5 exercises and balanced <details>
  const exMatches = bodyNoCode.match(/^### Bài \d+\.\d+:/gm) || [];
  if (exMatches.length !== 5) {
    issues.push({ file: relLabel, issue: `Expected 5 exercises, found ${exMatches.length}` });
  }
  totalExercises += exMatches.length;

  const openDetails = (bodyNoCode.match(/<details>/g) || []).length;
  const closeDetails = (bodyNoCode.match(/<\/details>/g) || []).length;
  if (openDetails !== closeDetails) {
    issues.push({ file: relLabel, issue: `Unbalanced <details> (${openDetails} open vs ${closeDetails} close)` });
  }
  if (openDetails < 5) {
    issues.push({ file: relLabel, issue: `Expected at least 5 <details> blocks for Active Recall, found ${openDetails}` });
  }
}

// 4. Validate metadata/pro192.json
const mappedImages = new Set();
if (!fs.existsSync(META_PATH)) {
  issues.push({ file: 'metadata/pro192.json', issue: 'Missing metadata/pro192.json' });
} else {
  const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
  if (meta.stages.length !== 8) {
    issues.push({ file: 'metadata/pro192.json', issue: `Expected 8 stages, got ${meta.stages.length}` });
  }
  if (meta.slots.length !== 30) {
    issues.push({ file: 'metadata/pro192.json', issue: `Expected 30 slots, got ${meta.slots.length}` });
  }

  const coveredSlots = new Set();
  for (const st of meta.stages) {
    if (!Array.isArray(st.slotFiles) || st.slotFiles.length !== st.slots.length) {
      issues.push({ file: 'metadata/pro192.json', issue: `Stage ${st.id} missing matching slotFiles[]` });
    } else {
      for (const sf of st.slotFiles) {
        if (!fs.existsSync(path.join(ROOT, 'content', 'vi', sf))) {
          issues.push({ file: 'metadata/pro192.json', issue: `Missing stage slotFile on disk: ${sf}` });
        }
      }
    }
    st.slots.forEach((s) => coveredSlots.add(s));
  }
  if (coveredSlots.size !== 30) {
    issues.push({ file: 'metadata/pro192.json', issue: `Stages do not cover all 30 slots cleanly (covered ${coveredSlots.size})` });
  }

  for (const s of meta.slots) {
    if (!/^pro192\/slots\/slot-\d{2}\.md$/.test(s.file)) {
      issues.push({ file: 'metadata/pro192.json', issue: `Slot ${s.slot} file path not pointing to slots/slot-XX.md: ${s.file}` });
    }
    if (!fs.existsSync(path.join(ROOT, 'content', 'vi', s.file))) {
      issues.push({ file: 'metadata/pro192.json', issue: `Missing slot file: ${s.file}` });
    }
    if (!Array.isArray(s.examFocus) || s.examFocus.length === 0) {
      issues.push({ file: 'metadata/pro192.json', issue: `Slot ${s.slot} missing examFocus` });
    }
    if (!Array.isArray(s.objectives) || s.objectives.length !== 3) {
      issues.push({ file: 'metadata/pro192.json', issue: `Slot ${s.slot} must have 3 objectives` });
    }
    if (!Array.isArray(s.examTraps) || s.examTraps.length < 2) {
      issues.push({ file: 'metadata/pro192.json', issue: `Slot ${s.slot} must have >= 2 examTraps` });
    }
    if (!(s.estimatedMinutes > 0)) {
      issues.push({ file: 'metadata/pro192.json', issue: `Slot ${s.slot} missing estimatedMinutes > 0` });
    }
    for (const asset of [s.slidePdf, s.slidePptx, ...(s.slideImages || [])]) {
      const disk = path.join(ROOT, 'public', decodeURIComponent(asset).slice(1));
      if (!fs.existsSync(disk)) {
        issues.push({ file: 'metadata/pro192.json', issue: `Missing asset on disk for Slot ${s.slot}: ${asset}` });
      }
      if ((s.slideImages || []).includes(asset)) {
        mappedImages.add(path.basename(decodeURIComponent(asset)));
      }
    }
    for (const bridgeRel of s.studyBridge) {
      if (!fs.existsSync(path.join(ROOT, 'content', 'vi', bridgeRel))) {
        issues.push({ file: 'metadata/pro192.json', issue: `Missing VI Study Bridge target: ${bridgeRel}` });
      }
      if (!fs.existsSync(path.join(ROOT, 'content', 'en', bridgeRel))) {
        issues.push({ file: 'metadata/pro192.json', issue: `Missing EN Study Bridge target: ${bridgeRel}` });
      }
    }
  }

  for (const img of meta.assets.images) {
    const disk = path.join(ROOT, 'public', decodeURIComponent(img).slice(1));
    if (!fs.existsSync(disk)) issues.push({ file: 'metadata/pro192.json', issue: `Missing asset.images file: ${img}` });
  }

  // 5. Validate 19 real PE challenges + slots[].peRefs + JDK 8 / ASCII compliance
  if (meta.course?.totalPeChallenges !== 19) {
    issues.push({
      file: 'metadata/pro192.json',
      issue: `Expected course.totalPeChallenges === 19, got ${meta.course?.totalPeChallenges}`,
    });
  }
  const peList = Array.isArray(meta.peChallenges) ? meta.peChallenges : [];
  if (peList.length !== 19) {
    issues.push({
      file: 'metadata/pro192.json',
      issue: `Expected 19 entries in peChallenges, found ${peList.length}`,
    });
  }
  const peCodes = new Set();
  for (let idx = 0; idx < peList.length; idx++) {
    const ch = peList[idx];
    if (ch.id !== idx + 1) {
      issues.push({
        file: 'metadata/pro192.json',
        issue: `peChallenges[${idx}] expected id=${idx + 1}, got ${ch.id}`,
      });
    }
    if (!ch.code || !ch.title || !ch.starterCode || !ch.cleanCode) {
      issues.push({
        file: 'metadata/pro192.json',
        issue: `PE id=${ch.id} missing required code/title/starterCode/cleanCode`,
      });
    }
    peCodes.add(ch.code);

    for (const field of ['starterCode', 'entityCode', 'interfaceCode', 'cleanCode']) {
      const code = ch[field];
      if (typeof code !== 'string' || code.length === 0) continue;
      if (/^\s*package\s+/m.test(code)) {
        issues.push({
          file: 'metadata/pro192.json',
          issue: `${ch.code}.${field} declares forbidden package statement`,
        });
      }
      if (/\.isBlank\s*\(|\b(?:List|Set|Map)\.of\s*\(|\.toList\s*\(|\.strip\s*\(|\.repeat\s*\(/.test(code)) {
        issues.push({
          file: 'metadata/pro192.json',
          issue: `${ch.code}.${field} uses Java 11+ API instead of JDK 1.8`,
        });
      }
      if (/[^\x00-\x7F]/.test(code)) {
        issues.push({
          file: 'metadata/pro192.json',
          issue: `${ch.code}.${field} contains non-ASCII character (violates PEA/EOS ASCII rule)`,
        });
      }
    }
  }

  for (const s of meta.slots) {
    for (const ref of s.peRefs || []) {
      if (!peCodes.has(ref)) {
        issues.push({
          file: 'metadata/pro192.json',
          issue: `Slot ${s.slot} references unknown peRef "${ref}"`,
        });
      }
    }
  }
}

const diskImages = fs.readdirSync(IMG_DISK_DIR);
const unmappedImages = diskImages.filter((f) => !mappedImages.has(f));
if (unmappedImages.length !== 1 || unmappedImages[0] !== 'Logo-FU-01.png') {
  issues.push({ file: 'public/media/pro192/images/', issue: `Expected only Logo-FU-01.png unmapped, got: ${unmappedImages.join(', ')}` });
}

console.log(JSON.stringify({
  markdownFilesChecked,
  slotsChecked,
  totalExercisesDetected: totalExercises,
  mappedTeachingImages: mappedImages.size,
  diskImagesTotal: diskImages.length,
  issueCount: issues.length,
  issues,
}, null, 2));

if (issues.length > 0) process.exit(1);
