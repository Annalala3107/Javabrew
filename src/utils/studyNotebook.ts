import type { Lang, NavigationData, Pro192Data } from '../types/content';
import { stageFileToSlug } from './text';

export interface ResolvedStudyItem {
  key: string;
  kind: 'pro192' | 'docs';
  title: string;
  badge: string;
  route: string;
  completed: boolean;
}

export function resolveStudyItem(
  key: string,
  pro192: Pro192Data | null,
  navigation: NavigationData | null,
  lang: Lang,
  completedSlots: readonly number[] = [],
  completedArticles: readonly string[] = []
): ResolvedStudyItem {
  if (key.startsWith('pro192:')) {
    const slug = key.slice('pro192:'.length).replace(/^\/+|\/+$/g, '');
    if (slug === 'pe-patterns') {
      return {
        key,
        kind: 'pro192',
        title: 'Bí kíp & 7 Khuôn mẫu PE (JDK 8)',
        badge: 'PRO192 · Bí kíp PE',
        route: '/pro192/pe-patterns',
        completed: false,
      };
    }

    const matchedSlot = pro192?.slots.find(
      (s) => stageFileToSlug(s.file) === slug || `slot-${String(s.slot).padStart(2, '0')}` === slug
    );
    if (matchedSlot) {
      const num = String(matchedSlot.slot).padStart(2, '0');
      return {
        key,
        kind: 'pro192',
        title: `Slot ${num}: ${matchedSlot.title}`,
        badge: `PRO192 · GĐ ${matchedSlot.stage}`,
        route: `/pro192/${stageFileToSlug(matchedSlot.file)}`,
        completed: completedSlots.includes(matchedSlot.slot),
      };
    }

    const matchedStage = pro192?.stages.find((st) => stageFileToSlug(st.file) === slug || `stage-${st.id}` === slug);
    if (matchedStage) {
      return {
        key,
        kind: 'pro192',
        title: matchedStage.title,
        badge: `PRO192 · Giai đoạn ${matchedStage.id}`,
        route: `/pro192/${stageFileToSlug(matchedStage.file)}`,
        completed: matchedStage.slots.every((sl) => completedSlots.includes(sl)),
      };
    }

    return {
      key,
      kind: 'pro192',
      title: slug || 'PRO192',
      badge: 'PRO192',
      route: slug ? `/pro192/${slug}` : '/pro192',
      completed: false,
    };
  }

  if (key.startsWith('docs:')) {
    const rel = key.slice('docs:'.length).replace(/^\/+/, '');
    if (navigation) {
      for (const dom of navigation.domains) {
        for (const grp of dom.groups) {
          const art = grp.articles.find((a) => a.rel === rel);
          if (art) {
            const title =
              lang === 'vi'
                ? art.titleVi || art.titleEn
                : art.titleEn || art.titleVi;
            const domLabel = lang === 'vi' ? dom.labelVi : dom.labelEn;
            const grpLabel = lang === 'vi' ? grp.labelVi : grp.labelEn;
            return {
              key,
              kind: 'docs',
              title,
              badge: `JavaGuide · ${domLabel} / ${grpLabel}`,
              route: `/docs/${rel}`,
              completed: completedArticles.includes(rel),
            };
          }
        }
      }
    }
    return {
      key,
      kind: 'docs',
      title: rel || 'JavaGuide',
      badge: 'JavaGuide',
      route: rel ? `/docs/${rel}` : '/docs',
      completed: completedArticles.includes(rel),
    };
  }

  return {
    key,
    kind: 'docs',
    title: key,
    badge: 'Ghi chú',
    route: '/dashboard',
    completed: false,
  };
}

export interface ExportNoteEntry {
  title: string;
  badge: string;
  route: string;
  kind: 'pro192' | 'docs';
  note: string;
}

export function buildNotesMarkdownExport(
  entries: ExportNoteEntry[],
  exportedAt = new Date().toISOString()
): string {
  const proItems = entries.filter((e) => e.kind === 'pro192');
  const docItems = entries.filter((e) => e.kind === 'docs');

  const lines: string[] = [
    '# Sổ tay Học tập JavaBrew (PRO192 × JavaGuide)',
    '',
    `> Xuất lúc: ${exportedAt} · Tổng số: ${entries.length} ghi chú`,
    '',
  ];

  const appendSection = (heading: string, list: ExportNoteEntry[]) => {
    lines.push(`## ${heading} (${list.length})`, '');
    if (list.length === 0) {
      lines.push('_Chưa có ghi chú trong nhóm này._', '');
      return;
    }
    for (const item of list) {
      lines.push(`### ${item.title}`);
      lines.push(`- Chủ đề: \`${item.badge}\` · Đường dẫn: \`${item.route}\``);
      lines.push('', item.note.trim(), '');
    }
  };

  appendSection('PRO192 (30 Slots & Bí kíp PE)', proItems);
  appendSection('JavaGuide (Kiến thức chuyên sâu)', docItems);

  return lines.join('\n').trim() + '\n';
}
