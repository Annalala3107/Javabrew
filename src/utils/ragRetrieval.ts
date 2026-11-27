import type { RagSearchSource } from '../services/aiMentorService';
import type { Pro192Data, SearchIndexData } from '../types/content';
import { normalizeSearchText, stageFileToSlug } from './text';

const STOPWORDS = new Set([
  // Vietnamese normalized stopwords
  'la',
  'gi',
  'va',
  'hoac',
  'nhu',
  'the',
  'nao',
  'cua',
  'cho',
  'voi',
  'trong',
  've',
  'tai',
  'sao',
  'co',
  'khong',
  'khac',
  'nhau',
  'diem',
  'giong',
  'phan',
  'biet',
  'cach',
  'dung',
  'khi',
  'de',
  'bi',
  'hay',
  'tu',
  'nhung',
  'cac',
  'mot',
  'o',
  'ma',
  'thi',
  'neu',
  'hoi',
  'giup',
  'giai',
  'thich',
  'chi',
  'tiet',
  'tom',
  'tat',
  'nao',
  'nay',
  'kia',
  // English stopwords
  'what',
  'is',
  'are',
  'was',
  'were',
  'the',
  'a',
  'an',
  'in',
  'on',
  'at',
  'for',
  'with',
  'how',
  'why',
  'when',
  'where',
  'compare',
  'vs',
  'versus',
  'between',
  'and',
  'or',
  'to',
  'of',
  'from',
  'explain',
  'difference',
  'differences',
  'about',
]);

interface WeightedField {
  text: string;
  weight: number;
}

interface ScoredRagSource {
  score: number;
  source: RagSearchSource;
}

export function extractRagTokens(query: string): string[] {
  const normalized = normalizeSearchText(query);
  const rawTokens = normalized.split(/[^a-z0-9_+.#-]+/i).filter(Boolean);
  const meaningful = rawTokens.filter((token) => !STOPWORDS.has(token) && token.length >= 2);
  const fallback = rawTokens.filter((token) => token.length >= 2);
  const chosen = meaningful.length > 0 ? meaningful : fallback;
  return Array.from(new Set(chosen)).slice(0, 12);
}

function scoreWeightedFields(
  fields: WeightedField[],
  tokens: string[],
  fullPhrase: string
): number {
  if (tokens.length === 0) return 0;

  let score = 0;
  const matchedTokens = new Set<string>();
  const normalizedFields = fields.map((f) => ({
    norm: normalizeSearchText(f.text),
    weight: f.weight,
  }));

  if (fullPhrase.length >= 4 && normalizedFields[0]?.norm.includes(fullPhrase)) {
    score += 10;
  }

  for (const token of tokens) {
    let tokenMatched = false;
    for (const field of normalizedFields) {
      if (!field.norm) continue;
      if (field.norm.includes(token)) {
        score += field.weight;
        tokenMatched = true;
      }
    }
    if (tokenMatched) {
      matchedTokens.add(token);
    }
  }

  if (matchedTokens.size === 0) return 0;
  if (matchedTokens.size > 1) {
    score += matchedTokens.size * 3;
  }
  if (matchedTokens.size === tokens.length && tokens.length >= 2) {
    score += 6;
  }
  return score;
}

export function retrieveRagSources(
  query: string,
  searchIndex: SearchIndexData | null,
  pro192: Pro192Data | null,
  lang: 'vi' | 'en',
  limit = 5
): RagSearchSource[] {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return [];

  const tokens = extractRagTokens(cleanQuery);
  if (tokens.length === 0) return [];
  const fullPhrase = normalizeSearchText(cleanQuery);

  const candidates: ScoredRagSource[] = [];

  if (pro192?.slots?.length) {
    for (const slot of pro192.slots) {
      const slotLabel = `Slot ${String(slot.slot).padStart(2, '0')} — ${slot.title}`;
      const objectivesText = (slot.objectives || []).join('; ');
      const trapsText = (slot.examTraps || []).join('; ');
      const focusText = (slot.examFocus || []).join(', ');
      const bridgeText = (slot.studyBridge || []).join(', ');

      const score = scoreWeightedFields(
        [
          { text: `${slotLabel} slot ${slot.slot}`, weight: 6 },
          { text: `${focusText} ${objectivesText}`, weight: 4 },
          { text: `${trapsText} ${bridgeText}`, weight: 3 },
        ],
        tokens,
        fullPhrase
      );

      if (score > 0) {
        const snippet =
          [objectivesText, focusText ? `Trọng tâm: ${focusText}` : '', trapsText]
            .filter(Boolean)
            .join(' · ')
            .slice(0, 280) || `PRO192 Stage ${slot.stage} · ${slot.exercisesCount} bài tập`;
        candidates.push({
          score: score + 1,
          source: {
            title: slotLabel,
            route: `/pro192/${stageFileToSlug(slot.file)}`,
            badge: `PRO192 Slot ${String(slot.slot).padStart(2, '0')}`,
            snippet,
          },
        });
      }
    }
  } else if (searchIndex?.pro192Slots?.length) {
    for (const slot of searchIndex.pro192Slots) {
      const slotLabel = `Slot ${String(slot.slot).padStart(2, '0')} — ${slot.title}`;
      const score = scoreWeightedFields(
        [{ text: `${slotLabel} slot ${slot.slot} stage ${slot.stage}`, weight: 6 }],
        tokens,
        fullPhrase
      );
      if (score > 0) {
        candidates.push({
          score,
          source: {
            title: slotLabel,
            route: `/pro192/${stageFileToSlug(slot.file)}`,
            badge: `PRO192 Slot ${String(slot.slot).padStart(2, '0')}`,
            snippet: `PRO192 Stage ${slot.stage} · ${slot.file}`,
          },
        });
      }
    }
  }

  if (pro192?.peChallenges?.length) {
    for (const pe of pro192.peChallenges) {
      const code = pe.code || `PE${pe.id}`;
      const title = `${code}: ${pe.title}`;
      const checklistText = (pe.checklist || []).join('; ');
      const score = scoreWeightedFields(
        [
          { text: `${title} ${pe.cat}`, weight: 5 },
          { text: `${pe.meta} ${pe.desc}`, weight: 3 },
          { text: checklistText, weight: 2 },
        ],
        tokens,
        fullPhrase
      );
      if (score > 0) {
        candidates.push({
          score,
          source: {
            title,
            route: `/studio/${pe.id}`,
            badge: `PE Studio · ${pe.cat}`,
            snippet: [pe.meta, pe.desc, checklistText].filter(Boolean).join(' — ').slice(0, 280),
          },
        });
      }
    }
  } else if (searchIndex?.peChallenges?.length) {
    for (const pe of searchIndex.peChallenges) {
      const score = scoreWeightedFields(
        [
          { text: pe.title, weight: 5 },
          { text: pe.meta, weight: 3 },
        ],
        tokens,
        fullPhrase
      );
      if (score > 0) {
        candidates.push({
          score,
          source: {
            title: pe.title,
            route: `/studio/${pe.id}`,
            badge: 'PE Studio',
            snippet: pe.meta,
          },
        });
      }
    }
  }

  if (searchIndex?.articles?.length) {
    for (const article of searchIndex.articles) {
      const title =
        lang === 'vi' ? article.titleVi || article.titleEn : article.titleEn || article.titleVi;
      const altTitle = lang === 'vi' ? article.titleEn : article.titleVi;
      const desc =
        lang === 'vi'
          ? article.descriptionVi || article.descriptionEn
          : article.descriptionEn || article.descriptionVi;
      const headings = (lang === 'vi' ? article.headingsVi : article.headingsEn) || [];
      const domainLabel =
        lang === 'vi'
          ? article.domainLabelVi || article.domainLabelEn || article.domain
          : article.domainLabelEn || article.domainLabelVi || article.domain;
      const tagsText = (article.tags || []).join(' ');

      const score = scoreWeightedFields(
        [
          { text: `${title} ${altTitle}`, weight: 5 },
          { text: `${tagsText} ${headings.slice(0, 10).join(' ')}`, weight: 3 },
          { text: `${desc} ${domainLabel} ${article.groupLabelVi}`, weight: 2 },
        ],
        tokens,
        fullPhrase
      );

      if (score > 0) {
        const snippet =
          [desc, headings.slice(0, 5).join(' · '), tagsText]
            .filter(Boolean)
            .join(' — ')
            .slice(0, 280) || `${domainLabel} (${article.lines} dòng)`;
        candidates.push({
          score,
          source: {
            title: title || article.rel,
            route: `/docs/${article.rel}`,
            badge: domainLabel,
            snippet,
          },
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.source.title.length - b.source.title.length);

  const unique: RagSearchSource[] = [];
  const seenRoutes = new Set<string>();
  for (const item of candidates) {
    if (seenRoutes.has(item.source.route)) continue;
    seenRoutes.add(item.source.route);
    unique.push(item.source);
    if (unique.length >= limit) break;
  }

  return unique;
}
