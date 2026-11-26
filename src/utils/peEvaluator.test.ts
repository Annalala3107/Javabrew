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

  it('accepts alternative student variable names and labels Static Preview output transparently', () => {
    const crocusAlt = `public class Crocus {
      private String name;
      private int weight;
      public Crocus() {}
      public Crocus(String name, int weight) { this.name = name; this.weight = weight; }
      public String getName() {
        if (name == null) return "";
        for (int idx = name.length() - 1; idx >= 0; idx--) {
          if (Character.isDigit(name.charAt(idx))) return name.substring(0, idx) + name.substring(idx + 1);
        }
        return name;
      }
      public void setWeight(int w) {
        int dem = 0;
        if (name != null) {
          for (int k = 0; k < name.length(); k++) {
            if (!Character.isDigit(name.charAt(k))) dem++;
          }
        }
        this.weight = w - dem;
      }
    }`;
    const pe1 = evaluatePeCode(1, crocusAlt, '');
    expect(pe1.allPassed).toBe(true);
    expect(pe1.passedCount).toBe(3);
    expect(pe1.statusText).toContain('Static Preview');
    expect(pe1.consoleTestOutput).toContain('[Static Preview');

    const personAlt = `public class Person {
      private String name;
      private double sickLeave;
      public double getSickLeave() { return sickLeave; }
      public void setName(String hoTen) { this.name += " " + hoTen; }
      public String toString() { return name + "," + sickLeave; }
    }`;
    const pe12 = evaluatePeCode(12, personAlt, '');
    expect(pe12.allPassed).toBe(true);

    const linkAlt = `public class MyLink implements ILink {
      public String f1(String str) {
        if (str == null) return "";
        return str.replace(".", ":");
      }
      public String f2(String str) {
        if (str == null) return "";
        int pos = str.indexOf('.');
        if (pos < 0) return str;
        return str.substring(0, pos + 1) + str.substring(pos + 1).toUpperCase();
      }
    }`;
    const pe15 = evaluatePeCode(15, linkAlt, '');
    expect(pe15.allPassed).toBe(true);

    const ladderAlt = `import java.util.Iterator;
    import java.util.List;
    public class MyLadder implements ILadder {
      public int f1(List<Ladder> t) {
        int sum = 0;
        for (Ladder item : t) {
          int upperCount = 0, lowerCount = 0;
          String s = item.getType();
          for (int i = 0; i < s.length(); i++) {
            if (Character.isUpperCase(s.charAt(i))) upperCount++;
            else if (Character.isLowerCase(s.charAt(i))) lowerCount++;
          }
          if (upperCount > lowerCount) sum += item.getPrice();
        }
        return sum;
      }
      public void f2(List<Ladder> t) {
        int best = 0;
        for (Ladder item : t) best = Math.max(best, item.getType().length());
        for (Ladder item : t) if (item.getType().length() == best) item.setPrice(0);
      }
      public void f3(List<Ladder> t) {
        Iterator<Ladder> it = t.iterator();
        while (it.hasNext()) {
          String s = it.next().getType();
          if (Character.isLetter(s.charAt(0))) it.remove();
        }
      }
    }`;
    const pe18 = evaluatePeCode(18, ladderAlt, '');
    expect(pe18.allPassed).toBe(true);
  });
});
