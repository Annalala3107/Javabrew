import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Download, FileText, Presentation, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeSearchText, stageFileToSlug } from '../utils/text';

interface DeckRow {
  name: string;
  pdfUrl: string;
  pptxUrl: string;
  stages: { id: number; slug: string }[];
  slots: number[];
}

export function ResourcesPage() {
  const { pro192, openPdfPreview } = useApp();
  const [query, setQuery] = useState('');

  const decks = useMemo<DeckRow[]>(() => {
    if (!pro192) return [];
    return pro192.assets.slides.map((pptxUrl) => {
      const fileName = decodeURIComponent(pptxUrl.split('/').pop() || '');
      const baseName = fileName.replace(/\.pptx$/i, '');
      const pdfUrl = `/media/pro192/resources/${encodeURIComponent(`${baseName}.pdf`)}`;

      const matchingStages = pro192.stages
        .filter((st) => st.slides.includes(fileName))
        .map((st) => ({ id: st.id, slug: stageFileToSlug(st.file) }));

      const matchingSlots = pro192.slots
        .filter((sl) => decodeURIComponent(sl.slidePptx).endsWith(`/${fileName}`))
        .map((sl) => sl.slot);

      return {
        name: baseName,
        pdfUrl,
        pptxUrl,
        stages: matchingStages,
        slots: matchingSlots,
      };
    });
  }, [pro192]);

  const filteredDecks = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return decks;
    return decks.filter((d) =>
      normalizeSearchText(`${d.name} slot ${d.slots.join(' ')}`).includes(q)
    );
  }, [decks, query]);

  const bankingArchive = pro192?.assets.resources.find((r) => r.endsWith('.rar'));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1.5 border-b border-[var(--border-default)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Kho Tài nguyên Offline PRO192
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Toàn bộ {pro192?.course.totalSlides ?? 14} bộ slide PDF (xem trực tiếp),{' '}
          {pro192?.course.totalSlides ?? 14} tệp PowerPoint gốc (.pptx), source code demo MVC và{' '}
          {pro192?.course.totalImages ?? 187} sơ đồ minh họa được lưu cục bộ 100%.
        </p>
      </header>

      {/* Featured MVC Demo */}
      {bankingArchive && (
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--accent-soft)] p-2.5 text-[var(--accent)]">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                banking.rar — Dự án mẫu kiến trúc MVC Java OOP
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Source code mẫu đi kèm giáo trình PRO192 để tham khảo cấu trúc package và tách lớp.
              </p>
            </div>
          </div>

          <a
            href={bankingArchive}
            download
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải banking.rar</span>
          </a>
        </section>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên slide hoặc số Slot (ví dụ: Collections, Inheritance, Slot 14)..."
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      {/* Slides table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Bộ Slide bài giảng
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Ánh xạ Giai đoạn & Slots
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredDecks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                    Không tìm thấy bộ slide nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredDecks.map((deck) => (
                  <tr
                    key={deck.name}
                    className="transition-colors hover:bg-[var(--bg-surface-muted)]"
                  >
                    <td className="px-4 py-3.5 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <Presentation className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                        <span>{deck.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {deck.stages.map((st) => (
                          <Link
                            key={st.id}
                            to={`/pro192/${st.slug}`}
                            className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                          >
                            GĐ {st.id}
                          </Link>
                        ))}
                        {deck.slots.length > 0 && (
                          <span className="px-1.5 py-0.5 text-xs tabular-nums text-[var(--text-muted)]">
                            Slot {deck.slots.join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openPdfPreview({
                              title: deck.name,
                              pdfUrl: deck.pdfUrl,
                              pptxUrl: deck.pptxUrl,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                        >
                          <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                          <span>Xem PDF</span>
                        </button>
                        <a
                          href={deck.pptxUrl}
                          download
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PPTX</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
