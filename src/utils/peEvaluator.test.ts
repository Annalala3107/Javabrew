import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Pro192Data } from '../types/content';
import { evaluatePeCode } from './peEvaluator';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('evaluatePeCode against real metadata/pro192.json PE challenges', () => {
  const proData = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'metadata', 'pro192.json'), 'utf8')
  ) as Pro192Data;

  const challenges = proData.peChallenges || [];

  it('has all 19 real PE1-PE5 challenges with starterCode and cleanCode', () => {
    expect(challenges).toHaveLength(19);
  });

  it('fails starterCode edge cases (without comment false-positives) and passes 3/3 with cleanCode for every real PE challenge', () => {
    for (const ch of challenges) {
      const starterResult = evaluatePeCode(ch.id, ch.starterCode, ch.entityCode);
      expect(starterResult.allPassed).toBe(false);
      expect(starterResult.passedCount).toBeLessThan(3);

      const cleanResult = evaluatePeCode(ch.id, ch.cleanCode, ch.entityCode);
      expect(cleanResult.allPassed).toBe(true);
      expect(cleanResult.passedCount).toBe(3);
    }
  });

  it('rejects forbidden Integer.toBinaryString in PE3-Q4 and unescaped replaceAll(".", ":") in PE4-Q4', () => {
    const pe3Q4Forbidden = `public class MyStringNumberTool implements IStringNumberTool {
        @Override
        public String buildAcronym(String string) {
            if (string == null || string.isEmpty()) return "";
            String[] words = string.split(" ");
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty() && Character.isLetter(w.charAt(0))) sb.append(Character.toUpperCase(w.charAt(0)));
            }
            return sb.toString();
        }
        @Override
        public String decimalToBinary(int n) {
            if (n == 0) return "0";
            return Integer.toBinaryString(n);
        }
    }`;
    const res11 = evaluatePeCode(11, pe3Q4Forbidden, '');
    expect(res11.allPassed).toBe(false);
    expect(res11.consoleTestOutput).toContain('Integer.toBinaryString()');

    const pe4Q4RegexTrap = `public class MyLink implements ILink {
        @Override
        public String f1(String str) {
            if (str == null) return "";
            return str.replaceAll(".", ":");
        }
        @Override
        public String f2(String str) {
            if (str == null) return "";
            int idx = str.indexOf('.');
            if (idx == -1) return str;
            return str.substring(0, idx + 1) + str.substring(idx + 1).toUpperCase();
        }
    }`;
    const res15 = evaluatePeCode(15, pe4Q4RegexTrap, '');
    expect(res15.allPassed).toBe(false);
    expect(res15.consoleTestOutput).toContain('replaceAll');
  });
});
