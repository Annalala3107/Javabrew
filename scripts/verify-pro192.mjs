import fs from 'node:fs';
import path from 'node:path';

const ROOT = String.raw`e:\JavAncode`;
const PRO_DIR = path.join(ROOT, 'content', 'vi', 'pro192');
const META_PATH = path.join(ROOT, 'metadata', 'pro192.json');

const expectedMdFiles = [
  'README.md',
  'giai-doan-1-slot-01-05.md',
  'giai-doan-2-slot-06-09.md',
  'giai-doan-3-slot-10-13.md',
  'giai-doan-4-slot-14-17.md',
  'giai-doan-5-slot-18-21.md',
  'giai-doan-6-slot-22-24.md',
  'giai-doan-7-slot-25-27.md',
  'giai-doan-8-slot-28-30.md',
  'pe-challenges.md',
];

const issues = [];
let totalExercises = 0;

for (const f of expectedMdFiles) {
  const abs = path.join(PRO_DIR, f);
  if (!fs.existsSync(abs)) {
    issues.push({ file: f, issue: 'Missing Markdown file' });
    continue;
  }
  const txt = fs.readFileSync(abs, 'utf8');
  const lines = txt.split(/\r?\n/);

  // Count balanced code fences
  let inFence = false;
  let fenceChar = '';
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (m) {
      if (!inFence) {
        inFence = true;
        fenceChar = m[1][0];
      } else if (m[1][0] === fenceChar) {
        inFence = false;
      }
    }
  }
  if (inFence) issues.push({ file: f, issue: 'Unclosed code fence' });

  // Verify no leftover NotebookLM bugs or raw LaTeX delimiters
  if (/new\s+int\s*;/.test(txt)) issues.push({ file: f, issue: 'Broken array syntax (new int;)' });
  if (/\\\\\(|\\\\\[|\\rightarrow|\\longrightarrow|\\mathbf/.test(txt)) {
    issues.push({ file: f, issue: 'Unconverted LaTeX macro remains' });
  }
  if (/\$[^$\n]+\$/.test(txt)) {
    // Allow Java classfile example or $ variables only inside backticks/code; check outside code
    const noCode = txt.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
    if (/\$[^$\n]+\$/.test(noCode)) {
      issues.push({ file: f, issue: 'Unconverted inline $...$ LaTeX outside code blocks' });
    }
  }

  // Count exercises in giai-doan-*
  if (f.startsWith('giai-doan-')) {
    const exMatches = txt.match(/^#{3,4}\s+Bài(?:\s+tập)?\s+\d+\.\d+/gm) || [];
    totalExercises += exMatches.length;
  }
}

// Validate metadata/pro192.json
if (!fs.existsSync(META_PATH)) {
  issues.push({ file: 'metadata/pro192.json', issue: 'Missing metadata/pro192.json' });
} else {
  const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
  if (meta.slots.length !== 30) issues.push({ file: 'metadata/pro192.json', issue: `Expected 30 slots, got ${meta.slots.length}` });
  if (meta.stages.length !== 8) issues.push({ file: 'metadata/pro192.json', issue: `Expected 8 stages, got ${meta.stages.length}` });

  for (const s of meta.slots) {
    if (!fs.existsSync(path.join(ROOT, 'content', 'vi', s.file))) {
      issues.push({ file: 'metadata/pro192.json', issue: `Missing slot file: ${s.file}` });
    }
    for (const asset of [s.slidePdf, s.slidePptx]) {
      const disk = path.join(ROOT, 'public', decodeURIComponent(asset).slice(1));
      if (!fs.existsSync(disk)) issues.push({ file: 'metadata/pro192.json', issue: `Missing slot slide/pdf: ${asset}` });
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
    if (!fs.existsSync(disk)) issues.push({ file: 'metadata/pro192.json', issue: `Missing image asset: ${img}` });
  }
}

console.log(JSON.stringify({
  markdownFilesChecked: expectedMdFiles.length,
  totalExercisesDetected: totalExercises,
  issueCount: issues.length,
  issues,
}, null, 2));

if (issues.length > 0) process.exit(1);
