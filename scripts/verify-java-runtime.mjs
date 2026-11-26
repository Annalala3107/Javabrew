import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireJdk = process.argv.includes('--require-jdk');
const MARKER_TOKEN = 'VerifyRuntime2026';

function runCommand(cmd, args, cwd = ROOT, timeoutMs = 15_000) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
  });
}

async function bundleTsModule(entryRel, outFile) {
  await build({
    entryPoints: [path.join(ROOT, entryRel)],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    logLevel: 'silent',
  });
  return import(pathToFileURL(outFile).href);
}

async function main() {
  const probe = runCommand('javac', ['-version']);
  if (probe.error || probe.status !== 0) {
    if (requireJdk) {
      console.error('ERROR: javac not found on PATH (--require-jdk passed).');
      process.exit(1);
    }
    console.log(
      JSON.stringify(
        {
          skipped: true,
          reason: 'javac not found on PATH; run in CI with JDK 21 or install OpenJDK locally.',
        },
        null,
        2
      )
    );
    return;
  }

  const jdkVersion = (probe.stdout || probe.stderr || '').trim();
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'javabrew-jdk-verify-'));

  try {
    const [harnessesMod, extMod, validationMod, pgMod] = await Promise.all([
      bundleTsModule('server/peHarnesses.ts', path.join(tmpBase, 'peHarnesses.mjs')),
      bundleTsModule('server/externalRunner.ts', path.join(tmpBase, 'externalRunner.mjs')),
      bundleTsModule('server/javaValidation.ts', path.join(tmpBase, 'javaValidation.mjs')),
      bundleTsModule('src/utils/javaPlayground.ts', path.join(tmpBase, 'javaPlayground.mjs')),
    ]);

    const { buildPeHarness } = harnessesMod;
    const { extractTestMarkerBlock } = extMod;
    const { inferJavaFileName } = validationMod;
    const { PLAYGROUND_TEMPLATES } = pgMod;

    const proData = JSON.parse(
      await fs.readFile(path.join(ROOT, 'metadata', 'pro192.json'), 'utf8')
    );
    const challenges = proData.peChallenges || [];
    const failures = [];
    let pePassed = 0;
    let peStarterRejected = 0;
    let templatesCompiled = 0;

    const writeChallengeFiles = async (dir, ch, studentMainCode, harness) => {
      const filesMap = new Map();
      const mainFile = inferJavaFileName(
        studentMainCode,
        inferJavaFileName(ch.starterCode, 'Main.java')
      );
      filesMap.set(mainFile, studentMainCode);

      if (ch.entityCode && ch.entityCode.trim()) {
        const entityFile = inferJavaFileName(ch.entityCode, ch.entityFileName || 'Entity.java');
        if (!filesMap.has(entityFile)) {
          filesMap.set(entityFile, ch.entityCode);
        }
      }

      filesMap.set(harness.fileName, harness.content);
      for (const extra of harness.extraFiles || []) {
        const baseName = path.basename(extra.path);
        if (!filesMap.has(baseName)) {
          filesMap.set(baseName, extra.content);
        }
      }

      const fileNames = [];
      for (const [name, content] of filesMap.entries()) {
        await fs.writeFile(path.join(dir, name), content, 'utf8');
        fileNames.push(name);
      }
      return fileNames;
    };

    // Part A: Verify all 19 PE challenges (cleanCode must pass 100%, starterCode must fail)
    for (const ch of challenges) {
      const harness = buildPeHarness(ch.id, 'grade', MARKER_TOKEN);
      if (!harness) {
        failures.push({ scope: `PE#${ch.id} (${ch.code})`, error: 'Missing grade harness' });
        continue;
      }

      // 1. Clean code check (--release 8)
      const cleanDir = path.join(tmpBase, `pe-${ch.id}-clean`);
      const cleanOut = path.join(cleanDir, 'out');
      await fs.mkdir(cleanOut, { recursive: true });
      const cleanFiles = await writeChallengeFiles(cleanDir, ch, ch.cleanCode, harness);

      const javacClean = runCommand(
        'javac',
        ['--release', '8', '-encoding', 'UTF-8', '-d', cleanOut, ...cleanFiles],
        cleanDir
      );
      if (javacClean.status !== 0) {
        failures.push({
          scope: `PE#${ch.id} (${ch.code}) cleanCode`,
          error: `javac --release 8 failed: ${(javacClean.stderr || javacClean.stdout).slice(0, 400)}`,
        });
        continue;
      }

      const javaClean = runCommand('java', ['-cp', cleanOut, harness.entryClass], cleanDir, 10_000);
      if (javaClean.error || javaClean.status !== 0) {
        failures.push({
          scope: `PE#${ch.id} (${ch.code}) cleanCode`,
          error: `java exited with ${javaClean.status}: ${(javaClean.stderr || javaClean.stdout).slice(0, 400)}`,
        });
        continue;
      }

      const { testResults } = extractTestMarkerBlock(javaClean.stdout || '', MARKER_TOKEN);
      if (!testResults || testResults.length < 3 || !testResults.every((t) => t.passed)) {
        failures.push({
          scope: `PE#${ch.id} (${ch.code}) cleanCode`,
          error: `Expected >=3 passing test cases, got: ${JSON.stringify(testResults || []).slice(0, 400)}`,
        });
        continue;
      }
      pePassed += 1;

      // 2. Starter code negative check
      const starterDir = path.join(tmpBase, `pe-${ch.id}-starter`);
      const starterOut = path.join(starterDir, 'out');
      await fs.mkdir(starterOut, { recursive: true });
      const starterFiles = await writeChallengeFiles(starterDir, ch, ch.starterCode, harness);

      const javacStarter = runCommand(
        'javac',
        ['--release', '8', '-encoding', 'UTF-8', '-d', starterOut, ...starterFiles],
        starterDir
      );
      if (javacStarter.status !== 0) {
        peStarterRejected += 1;
      } else {
        const javaStarter = runCommand(
          'java',
          ['-cp', starterOut, harness.entryClass],
          starterDir,
          10_000
        );
        const starterParsed = extractTestMarkerBlock(javaStarter.stdout || '', MARKER_TOKEN);
        const passedAll =
          javaStarter.status === 0 &&
          starterParsed.testResults &&
          starterParsed.testResults.length > 0 &&
          starterParsed.testResults.every((t) => t.passed);
        if (passedAll) {
          failures.push({
            scope: `PE#${ch.id} (${ch.code}) starterCode`,
            error: 'Starter code falsely passed all grade test cases!',
          });
        } else {
          peStarterRejected += 1;
        }
      }
    }

    // Part B: Verify all 45 JavaBrew Live Lab templates compile cleanly
    for (const tpl of PLAYGROUND_TEMPLATES) {
      const tplDir = path.join(tmpBase, `tpl-${tpl.id}`);
      const tplOut = path.join(tplDir, 'out');
      await fs.mkdir(tplOut, { recursive: true });

      const names = [];
      for (const f of tpl.files) {
        await fs.writeFile(path.join(tplDir, f.name), f.content, 'utf8');
        names.push(f.name);
      }

      const javacTpl = runCommand(
        'javac',
        ['-encoding', 'UTF-8', '-d', tplOut, ...names],
        tplDir
      );
      if (javacTpl.status !== 0) {
        failures.push({
          scope: `Template (${tpl.id})`,
          error: `javac failed: ${(javacTpl.stderr || javacTpl.stdout).slice(0, 400)}`,
        });
      } else {
        templatesCompiled += 1;
      }
    }

    const summary = {
      skipped: false,
      jdkVersion,
      totalPe: challenges.length,
      pePassed,
      peStarterRejected,
      totalTemplates: PLAYGROUND_TEMPLATES.length,
      templatesCompiled,
      failureCount: failures.length,
      failures,
    };

    console.log(JSON.stringify(summary, null, 2));
    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await fs.rm(tmpBase, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
