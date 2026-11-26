import { useRef } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useModalA11y } from '../hooks/useModalA11y';

export function PdfPreviewModal() {
  const { pdfPreview, closePdfPreview } = useApp();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useModalA11y({
    open: Boolean(pdfPreview),
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
    onClose: closePdfPreview,
  });

  if (!pdfPreview) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem tài liệu PDF: ${pdfPreview.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePdfPreview();
      }}
    >
      <div
        ref={dialogRef}
        className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden overscroll-contain rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {pdfPreview.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={pdfPreview.pdfUrl}
              download
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tải PDF</span>
            </a>

            {pdfPreview.pptxUrl && (
              <a
                href={pdfPreview.pptxUrl}
                download
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tải PPTX</span>
              </a>
            )}

            <a
              href={pdfPreview.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mở tab mới</span>
            </a>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={closePdfPreview}
              aria-label="Đóng trình xem PDF"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile fallback notice for iOS Safari / Android browsers with limited inline iframe PDF support */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--info-soft)] px-3 py-2 text-xs text-[var(--info-text)] sm:hidden">
          <span>Nếu khung xem bên dưới không cuộn được trên điện thoại:</span>
          <a
            href={pdfPreview.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md bg-[var(--accent)] px-2.5 py-1.5 font-bold text-[var(--accent-contrast)]"
          >
            Mở toàn màn hình
          </a>
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
