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

  it('has all 4 PE challenges with starterCode, entityCode, and cleanCode', () => {
    expect(challenges).toHaveLength(4);
  });

  it('fails starterCode edge cases and passes 3/3 with cleanCode for every real PE challenge', () => {
    for (const ch of challenges) {
      const starterResult = evaluatePeCode(ch.id, ch.starterCode, ch.entityCode);
      expect(starterResult.allPassed).toBe(false);
      expect(starterResult.passedCount).toBeLessThan(3);

      const cleanResult = evaluatePeCode(ch.id, ch.cleanCode, ch.entityCode);
      expect(cleanResult.allPassed).toBe(true);
      expect(cleanResult.passedCount).toBe(3);
    }
  });
});
