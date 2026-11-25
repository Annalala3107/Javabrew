import { Outlet, useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PdfPreviewModal } from './PdfPreviewModal';
import { SearchModal } from './SearchModal';
import { SettingsModal } from './SettingsModal';
import { TopBar } from './TopBar';
import { LucianToastStack } from './lucian/LucianToastStack';

export function AppLayout() {
  const location = useLocation();
  const { metaError, retryMeta } = useApp();
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-xs font-bold focus:text-[var(--accent-contrast)]"
      >
        Chuyển đến nội dung chính
      </a>

      {!isLanding && <TopBar />}

      {metaError && (
        <div
          role="alert"
          className="border-b border-[var(--border-default)] bg-[var(--danger-soft)] px-4 py-2.5 text-xs text-[var(--danger-text)]"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{metaError}</span>
            </span>
            <button
              type="button"
              onClick={retryMeta}
              className="inline-flex items-center gap-1.5 rounded-md border border-current px-2.5 py-1 text-xs font-semibold hover:opacity-80"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      )}

      <main id="main-content" className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <SearchModal />
      <SettingsModal />
      <PdfPreviewModal />
      <LucianToastStack />
    </div>
  );
}
