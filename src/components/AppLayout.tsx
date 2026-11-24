import { Outlet } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PdfPreviewModal } from './PdfPreviewModal';
import { SearchModal } from './SearchModal';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  const { metaError, retryMeta } = useApp();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Chuyển đến nội dung chính
      </a>

      <TopBar />

      {metaError && (
        <div
          role="alert"
          className="border-b border-[var(--border-default)] bg-[var(--danger-soft)] px-4 py-2.5 text-sm text-[var(--danger)]"
        >
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{metaError}</span>
            </span>
            <button
              type="button"
              onClick={retryMeta}
              className="inline-flex items-center gap-1.5 rounded-md border border-current px-2.5 py-1 text-xs font-semibold hover:opacity-80"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>

      <SearchModal />
      <PdfPreviewModal />
    </div>
  );
}
