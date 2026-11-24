import { useEffect } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PdfPreviewModal() {
  const { pdfPreview, closePdfPreview } = useApp();

  useEffect(() => {
    if (!pdfPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePdfPreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pdfPreview, closePdfPreview]);

  if (!pdfPreview) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem tài liệu PDF: ${pdfPreview.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePdfPreview();
      }}
    >
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {pdfPreview.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfPreview.pdfUrl}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải PDF</span>
            </a>

            {pdfPreview.pptxUrl && (
              <a
                href={pdfPreview.pptxUrl}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tải PPTX</span>
              </a>
            )}

            <a
              href={pdfPreview.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>

            <button
              type="button"
              onClick={closePdfPreview}
              aria-label="Đóng trình xem PDF"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[var(--bg-canvas)]">
          <iframe
            src={pdfPreview.pdfUrl}
            title={pdfPreview.title}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
