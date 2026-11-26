import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Download, FileText, Presentation, Search } from 'lucide-react';
import type { PdfPreviewState } from '../../context/AppContext';
import type { Pro192Data } from '../../types/content';
import { normalizeSearchText, stageEntrySlug } from '../../utils/text';

interface ResourcesVaultViewProps {
  pro192: Pro192Data | null;
  openPdfPreview: (preview: PdfPreviewState) => void;
}

export function ResourcesVaultView({ pro192, openPdfPreview }: ResourcesVaultViewProps) {
  const [resourceQuery, setResourceQuery] = useState('');

  const slideDecks = useMemo(() => {
    if (!pro192) return [];
    const q = normalizeSearchText(resourceQuery);
    return pro192.assets.slides
      .map((pptxUrl) => {
        const fileName = decodeURIComponent(pptxUrl.split('/').pop() || '');
        const baseName = fileName.replace(/\.pptx$/i, '');
        const pdfUrl = `/media/pro192/resources/${encodeURIComponent(`${baseName}.pdf`)}`;
        const matchingStages = pro192.stages
          .filter((st) => st.slides.includes(fileName))
          .map((st) => ({ id: st.id, slug: stageEntrySlug(st) }));
        const matchingSlots = pro192.slots
          .filter((sl) => decodeURIComponent(sl.slidePptx).endsWith(`/${fileName}`))
          .map((sl) => sl.slot);
        return { name: baseName, pdfUrl, pptxUrl, stages: matchingStages, slots: matchingSlots };
      })
      .filter((d) =>
        !q ? true : normalizeSearchText(`${d.name} slot ${d.slots.join(' ')}`).includes(q)
      );
  }, [pro192, resourceQuery]);

  const bankingArchive = pro192?.assets.resources.find((r) => r.endsWith('.rar'));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1.5 border-b border-[var(--border-default)] pb-4">
        <span className="inline-block rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-text)]">
          Tài nguyên Offline · PRO192
        </span>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Kho Slide PDF, PowerPoint &amp; Source Code
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Toàn bộ {pro192?.course.totalSlides ?? 14} slide PDF (xem trực tiếp), 14 tệp .pptx gốc và
          dự án mẫu MVC lưu nội bộ 100%.
        </p>
      </header>

      {bankingArchive && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--accent-soft)] p-2.5 text-[var(--accent)]">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                banking.rar — Dự án mẫu kiến trúc MVC Java OOP
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Source code mẫu đi kèm giáo trình PRO192 để tham khảo tách lớp.
              </div>
            </div>
          </div>
          <a
            href={bankingArchive}
            download
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải banking.rar</span>
          </a>
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-dim)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={resourceQuery}
          onChange={(e) => setResourceQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label="Tìm theo tên slide hoặc số Slot"
          placeholder="Tìm theo tên slide hoặc số Slot (VD: Collections, Inheritance)…"
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase text-[var(--text-muted)]">
                  Bộ Slide bài giảng
                </th>
                <th className="px-4 py-3 font-semibold uppercase text-[var(--text-muted)]">
                  Giai đoạn &amp; Slots
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--text-muted)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {slideDecks.map((deck) => (
                <tr key={deck.name} className="hover:bg-[var(--bg-surface)]/50">
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <Presentation className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <span>{deck.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {deck.stages.map((st) => (
                        <Link
                          key={st.id}
                          to={`/pro192/${st.slug}`}
                          className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                        >
                          GĐ {st.id}
                        </Link>
                      ))}
                      {deck.slots.length > 0 && (
                        <span className="tabular-nums text-[var(--text-dim)]">
                          Slot {deck.slots.join(', ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
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
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                        <span>Xem PDF</span>
                      </button>
                      <a
                        href={deck.pptxUrl}
                        download
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>PPTX</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
