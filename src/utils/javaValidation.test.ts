import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  hasMainMethod,
  inferJavaFileName,
  MAX_PE_ID,
  MAX_TOTAL_SOURCE_BYTES,
  parseJavacDiagnostics,
  validateCompilePayload,
} from '../../server/javaValidation';
import { buildPeHarness, getPeInterfaceFiles } from '../../server/peHarnesses';
import {
  buildPistonPayload,
  mergeJavaFilesForJudge0,
  resolveExternalRunnerConfig,
} from '../../server/externalRunner';
import type { Pro192Data } from '../types/content';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('javaValidation & peHarnesses', () => {
  const proData = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'metadata', 'pro192.json'), 'utf8')
  ) as Pro192Data;

  it('infers exact public class filename across all 19 real PE challenges', () => {
    const challenges = proData.peChallenges || [];
    expect(challenges).toHaveLength(19);

    const names = challenges.map((ch) => inferJavaFileName(ch.starterCode, 'Main.java'));
    expect(names).toEqual([
      'Crocus.java',
      'SpecDaisy.java',
      'MyDaisy.java',
      'MyString.java',
      'Camel.java',
      'SpecCala.java',
      'TicketList.java',
      'CoffeeShop.java',
      'OLEDScreen.java',
      'EmployeeList.java',
      'MyStringNumberTool.java',
      'Person.java',
      'SpecChair.java',
      'MyShoes.java',
      'MyLink.java',
      'Coral.java',
      'SpecLadder.java',
      'MyLadder.java',
      'MyString.java',
    ]);

    const commentTrap = `
      // public class FakeCommentedClass {}
      /* public class AnotherFake {} */
      public class RealStudent {
        String label = "public class InsideString {}";
      }
    `;
    expect(inferJavaFileName(commentTrap)).toBe('RealStudent.java');
  });

  it('detects public static void main signatures cleanly while ignoring comments', () => {
    expect(hasMainMethod('public class App { public static void main(String[] args) {} }')).toBe(
      true
    );
    expect(hasMainMethod('public class App { static public void main(String... argv) {} }')).toBe(
      true
    );
    expect(
      hasMainMethod(
        'public class App { // public static void main(String[] args) {}\n public int calc() { return 1; } }'
      )
    ).toBe(false);
  });

  it('rejects invalid peId, path traversal, reserved harness names, duplicate names, and oversized payloads', () => {
    expect(MAX_PE_ID).toBe(19);

    expect(
      validateCompilePayload({
        mode: 'grade',
        peId: 0,
        files: [{ name: 'Crocus.java', content: 'public class Crocus {}' }],
      }).ok
    ).toBe(false);

    expect(
      validateCompilePayload({
        mode: 'grade',
        peId: 20,
        files: [{ name: 'Crocus.java', content: 'public class Crocus {}' }],
      }).ok
    ).toBe(false);

    expect(
      validateCompilePayload({
        mode: 'grade',
        peId: 19,
        files: [{ name: 'MyString.java', content: 'public class MyString implements IString {}' }],
      }).ok
    ).toBe(true);

    const badPath = validateCompilePayload({
      mode: 'run',
      files: [{ name: '../Evil.java', content: 'class Evil {}' }],
    });
    expect(badPath.ok).toBe(false);

    const reservedName = validateCompilePayload({
      mode: 'grade',
      peId: 1,
      files: [{ name: '__JavaBrewPe01Grader.java', content: 'class X {}' }],
    });
    expect(reservedName.ok).toBe(false);

    const dupCase = validateCompilePayload({
      mode: 'run',
      files: [
        { name: 'Main.java', content: 'class Main {}' },
        { name: 'main.java', content: 'class main {}' },
      ],
    });
    expect(dupCase.ok).toBe(false);

    const huge = validateCompilePayload({
      mode: 'run',
      files: [{ name: 'Main.java', content: 'a'.repeat(MAX_TOTAL_SOURCE_BYTES + 10) }],
    });
    expect(huge.ok).toBe(false);

    const valid = validateCompilePayload({
      mode: 'grade',
      peId: 2,
      files: [
        { name: 'SpecDaisy.java', content: 'public class SpecDaisy extends Daisy {}' },
        { name: 'Daisy.java', content: 'public class Daisy {}' },
      ],
      stdin: 'input',
    });
    expect(valid.ok).toBe(true);
  });

  it('parses javac stderr diagnostics with accurate file, line, column, and grader mapping', () => {
    const stderr = [
      '/vercel/sandbox/work/Daisy.java:7: error: \';\' expected',
      '        this.age = age',
      '                      ^',
      'SpecDaisy.java:3: warning: [unchecked] unchecked conversion',
      '__JavaBrewPe01Grader.java:18: error: cannot find symbol getWeight',
    ].join('\n');

    const diags = parseJavacDiagnostics(stderr, 'Crocus.java');
    expect(diags).toEqual([
      {
        file: 'Daisy.java',
        line: 7,
        column: 23,
        severity: 'error',
        message: "';' expected",
      },
      {
        file: 'SpecDaisy.java',
        line: 3,
        column: 1,
        severity: 'warning',
        message: '[unchecked] unchecked conversion',
      },
      {
        file: 'Crocus.java',
        line: 1,
        column: 1,
        severity: 'error',
        message:
          'Chữ ký class hoặc phương thức chưa khớp đề bài PE (cannot find symbol getWeight).',
      },
    ]);
  });

  it('builds server-side OpenJDK harnesses and interface extraFiles for all 19 PE problems', () => {
    const assertAllJavaStringsBalanced = (javaSource: string) => {
      for (const line of javaSource.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
        let inString = false;
        let inChar = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if ((inString || inChar) && ch === '\\') {
            i++;
            continue;
          }
          if (!inChar && ch === '"') {
            inString = !inString;
          } else if (!inString && ch === "'") {
            inChar = !inChar;
          }
        }
        expect(inString, `Unclosed Java string literal on line: ${line}`).toBe(false);
        expect(inChar, `Unclosed Java char literal on line: ${line}`).toBe(false);
      }
    };

    for (let id = 1; id <= 19; id++) {
      const gradeSpec = buildPeHarness(id, 'grade');
      expect(gradeSpec).not.toBeNull();
      expect(gradeSpec?.content).toContain('Locale.setDefault(Locale.US)');
      expect(gradeSpec?.content).toContain('__JB_TESTS_START__');
      assertAllJavaStringsBalanced(gradeSpec!.content);

      const runSpec = buildPeHarness(id, 'run');
      expect(runSpec).not.toBeNull();
      expect(runSpec?.content).toContain('public static void main');
      expect(runSpec?.content).toContain('Locale.setDefault(Locale.US)');
      assertAllJavaStringsBalanced(runSpec!.content);
    }

    expect(getPeInterfaceFiles(3)[0]?.path).toBe('/tmp/jb-work/IDaisy.java');
    expect(getPeInterfaceFiles(4)[0]?.path).toBe('/tmp/jb-work/IString.java');
    expect(getPeInterfaceFiles(11)[0]?.path).toBe('/tmp/jb-work/IStringNumberTool.java');
    expect(getPeInterfaceFiles(14)[0]?.path).toBe('/tmp/jb-work/IShoes.java');
    expect(getPeInterfaceFiles(15)[0]?.path).toBe('/tmp/jb-work/ILink.java');
    expect(getPeInterfaceFiles(18)[0]?.path).toBe('/tmp/jb-work/ILadder.java');
    expect(getPeInterfaceFiles(19)[0]?.path).toBe('/tmp/jb-work/IString.java');
  });

  it('resolves external Piston / Judge0 runner config and formats multi-file payloads safely', () => {
    expect(resolveExternalRunnerConfig({})).toBeNull();
    expect(resolveExternalRunnerConfig({ JAVA_RUNNER_URL: 'ftp://invalid.local' })).toBeNull();
    expect(resolveExternalRunnerConfig({ JAVA_RUNNER_URL: 'not a url' })).toBeNull();

    const piston = resolveExternalRunnerConfig({
      JAVA_RUNNER_URL: 'https://emkc.org/api/v2/piston/execute/',
    });
    expect(piston).toEqual({
      provider: 'piston',
      url: 'https://emkc.org/api/v2/piston/execute',
      apiKey: undefined,
      judge0LanguageId: 91,
    });

    const judge0 = resolveExternalRunnerConfig({
      JAVA_RUNNER_URL: 'https://ce.judge0.com/submissions',
      JAVA_RUNNER_API_KEY: 'secret-key',
      JUDGE0_JAVA_LANGUAGE_ID: '62',
    });
    expect(judge0).toEqual({
      provider: 'judge0',
      url: 'https://ce.judge0.com/submissions',
      apiKey: 'secret-key',
      judge0LanguageId: 62,
    });

    const files = [
      {
        name: 'Student.java',
        content: 'package demo;\nimport java.util.*;\npublic class Student { String id = "SE1"; }',
      },
      {
        name: 'Main.java',
        content: 'import java.util.*;\npublic class Main { public static void main(String[] a) {} }',
      },
    ];

    const pistonPayload = buildPistonPayload(files, 'Main', 'input');
    expect(pistonPayload.files.map((f) => f.name)).toEqual(['Main.java', 'Student.java']);
    expect(pistonPayload.stdin).toBe('input');

    const merged = mergeJavaFilesForJudge0(files, 'Main');
    expect(merged).not.toContain('package demo;');
    expect(merged).toContain('class Student');
    expect(merged).not.toContain('public class Student');
    expect(merged).toContain('public class Main');

    const mergedNonMain = mergeJavaFilesForJudge0(
      [{ name: 'App.java', content: 'public class App { public static void main(String[] a) {} }' }],
      'App'
    );
    expect(mergedNonMain).toContain('class App');
    expect(mergedNonMain).toContain('public class Main');
    expect(mergedNonMain).toContain('App.main(args);');
  });
});
