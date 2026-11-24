import type { NavigationData } from '../types/content';

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function stageFileToSlug(file: string): string {
  return file.replace(/^pro192\//, '').replace(/\.md$/, '');
}

export function estimateReadingMinutes(chars: number): number {
  return Math.max(1, Math.round(chars / 1200));
}

export function findArticleTitle(
  navigation: NavigationData | null,
  rel: string,
  lang: 'vi' | 'en'
): string {
  if (!navigation) return rel.split('/').pop()?.replace(/\.md$/, '') || rel;
  for (const domain of navigation.domains) {
    for (const group of domain.groups) {
      const found = group.articles.find((a) => a.rel === rel);
      if (found) {
        return lang === 'vi' ? found.titleVi || found.titleEn : found.titleEn || found.titleVi;
      }
    }
  }
  return rel.split('/').pop()?.replace(/\.md$/, '') || rel;
}
