import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { stageFileToSlug } from '../utils/text';

export function RouteEnhancer() {
  const location = useLocation();
  const { pro192, navigation, lang } = useApp();

  // Scroll to top (or hash anchor) on pathname changes
  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  // Synchronize document.title with active route and loaded metadata
  useEffect(() => {
    const path = location.pathname;
    let nextTitle = 'JavaBrew — Nền tảng Học PRO192 & Luyện PE Java';

    if (path === '/' || path === '') {
      nextTitle = 'JavaBrew — Nền tảng Học PRO192 & Luyện PE Java';
    } else if (path.startsWith('/dashboard')) {
      nextTitle = 'Dashboard — JavaBrew';
    } else if (path === '/pe') {
      nextTitle = 'Kho 19 Đề PE (PE1–PE5) — JavaBrew';
    } else if (path.startsWith('/resources')) {
      nextTitle = 'Tài nguyên & Slide PRO192 — JavaBrew';
    } else if (path.startsWith('/studio/playground')) {
      nextTitle = 'JavaBrew Live Lab — Code Studio';
    } else if (path.startsWith('/studio')) {
      const rawId = path.replace(/^\/studio\/?/, '');
      const numId = Number(rawId) || 1;
      const pe = pro192?.peChallenges?.find((c) => c.id === numId);
      nextTitle = pe ? `${pe.code}: ${pe.title} — JavaBrew Code Studio` : 'Code Studio — JavaBrew';
    } else if (path.startsWith('/pro192')) {
      const slug = path.replace(/^\/pro192\/?/, '');
      const slot = pro192?.slots.find((s) => stageFileToSlug(s.file) === slug);
      if (slot) {
        nextTitle = `Slot ${slot.slot}: ${slot.title} — JavaBrew PRO192`;
      } else if (slug === 'pe-patterns') {
        nextTitle = 'Khuôn mẫu PE (Clean Code) — JavaBrew PRO192';
      } else {
        nextTitle = 'Giáo trình PRO192 — JavaBrew';
      }
    } else if (path.startsWith('/docs')) {
      const docRel = path.replace(/^\/docs\/?/, '');
      let matchedTitle: string | null = null;
      if (navigation && docRel) {
        for (const d of navigation.domains) {
          for (const g of d.groups) {
            const found = g.articles.find((a) => a.rel === docRel);
            if (found) {
              matchedTitle = lang === 'vi' ? found.titleVi || found.titleEn : found.titleEn || found.titleVi;
              break;
            }
          }
          if (matchedTitle) break;
        }
      }
      nextTitle = matchedTitle ? `${matchedTitle} — JavaBrew Docs` : 'Tài liệu JavaGuide — JavaBrew';
    }

    document.title = nextTitle;
  }, [location.pathname, pro192, navigation, lang]);

  return null;
}
