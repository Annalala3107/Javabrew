import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  hasMainMethod,
  inferJavaFileName,
  MAX_TOTAL_SOURCE_BYTES,
  parseJavacDiagnostics,
  validateCompilePayload,
} from '../../server/javaValidation';
import { buildPeHarness } from '../../server/peHarnesses';
import type { Pro192Data } from '../types/content';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('javaValidation & peHarnesses', () => {
  const proData = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'metadata', 'pro192.json'), 'utf8')
  ) as Pro192Data;

  it('infers exact public class filename across all real PE challenges (including EBook & ItemList)', () => {
    const challenges = proData.peChallenges || [];
    expect(challenges).toHaveLength(4);

    const names = challenges.map((ch) => inferJavaFileName(ch.starterCode, 'Main.java'));
    expect(names).toEqual(['Main.java', 'EBook.java', 'ItemList.java', 'Main.java']);

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

  it('rejects path traversal, reserved harness names, duplicate names, and oversized payloads', () => {
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
        { name: 'EBook.java', content: 'public class EBook extends Book {}' },
        { name: 'Book.java', content: 'public class Book {}' },
      ],
      stdin: 'input',
    });
    expect(valid.ok).toBe(true);
  });

  it('parses javac stderr diagnostics with accurate file, line, column, and grader mapping', () => {
    const stderr = [
      '/vercel/sandbox/work/Student.java:7: error: \';\' expected',
      '        this.gpa = gpa',
      '                      ^',
      'Main.java:3: warning: [unchecked] unchecked conversion',
      '__JavaBrewPe01Grader.java:18: error: cannot find symbol filterHonor',
    ].join('\n');

    const diags = parseJavacDiagnostics(stderr, 'Main.java');
    expect(diags).toEqual([
      {
        file: 'Student.java',
        line: 7,
        column: 23,
        severity: 'error',
        message: "';' expected",
      },
      {
        file: 'Main.java',
        line: 3,
        column: 1,
        severity: 'warning',
        message: '[unchecked] unchecked conversion',
      },
      {
        file: 'Main.java',
        line: 1,
        column: 1,
        severity: 'error',
        message:
          'Chữ ký class hoặc phương thức chưa khớp đề bài PE (cannot find symbol filterHonor).',
      },
    ]);
  });

  it('builds server-side OpenJDK harnesses for all 4 PE problems in both run and grade modes', () => {
    for (const id of [1, 2, 3, 4]) {
      const gradeSpec = buildPeHarness(id, 'grade');
      expect(gradeSpec).not.toBeNull();
      expect(gradeSpec?.content).toContain('Locale.setDefault(Locale.US)');
      expect(gradeSpec?.content).toContain('__JB_TESTS_START__');

      const runSpec = buildPeHarness(id, 'run');
      expect(runSpec).not.toBeNull();
      expect(runSpec?.content).toContain('public static void main');
    }
    const pe4 = buildPeHarness(4, 'grade');
    expect(pe4?.extraFiles?.[0]?.path).toBe('/tmp/jb-work/products.csv');
  });
});
