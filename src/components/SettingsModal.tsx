import { useEffect, useRef, useState } from 'react';
import { Download, Moon, RotateCcw, Settings, Sun, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    byokKey,
    setByokKey,
    theme,
    setTheme,
    lang,
    setLang,
    exportProgressJson,
    importProgressJson,
    resetProgress,
  } = useApp();

  const [draftKey, setDraftKey] = useState(byokKey);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      setDraftKey(byokKey);
      setStatusMsg(null);
    }
  }, [isSettingsOpen, byokKey]);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setByokKey(draftKey);
    setStatusMsg('Đã lưu cấu hình cục bộ trên trình duyệt.');
    window.setTimeout(() => setIsSettingsOpen(false), 350);
  };

  const handleExport = () => {
    const json = exportProgressJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `javabrew-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Đã xuất tệp sao lưu tiến độ.');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = importProgressJson(text);
    setStatusMsg(
      ok
        ? 'Đã khôi phục tiến độ và ghi chú thành công.'
        : 'Tệp JSON không hợp lệ, không thể nhập.'
    );
    e.target.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cài đặt AI Key & Sandbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSettingsOpen(false);
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 text-xs shadow-[var(--shadow-overlay)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Settings className="h-4 w-4 text-[var(--accent)]" />
            <span>Cài đặt AI Key &amp; Sandbox</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Đóng cài đặt"
            className="rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="leading-relaxed text-[var(--text-muted)]">
          Kiến trúc bảo mật (BYOK): Tài liệu đọc hoàn toàn Offline. Để gọi trực tiếp AI Mentor trên bản web tĩnh, khóa API cá nhân được lưu riêng tại{' '}
          <code className="rounded bg-[var(--bg-code)] px-1 py-0.5 text-[var(--accent-text)]">
            localStorage
          </code>{' '}
          trên trình duyệt của bạn.
        </p>

        {/* BYOK API Key */}
        <div className="space-y-1.5">
          <label htmlFor="byok-key-input" className="block font-semibold text-[var(--text-primary)]">
            Gemini API Key (Tùy chọn):
          </label>
          <input
            id="byok-key-input"
            type="password"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="AIzaSy... (Lưu cục bộ trên máy)"
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Theme & Language */}
        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-default)] pt-3">
          <div className="space-y-1.5">
            <span className="block font-semibold text-[var(--text-primary)]">Giao diện:</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={[
                  'inline-flex items-center justify-center gap-1 rounded-md py-1 font-medium transition-colors',
                  theme === 'dark'
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                <Moon className="h-3 w-3" />
                <span>Night</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={[
                  'inline-flex items-center justify-center gap-1 rounded-md py-1 font-medium transition-colors',
                  theme === 'light'
                    ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                <Sun className="h-3 w-3" />
                <span>Light</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block font-semibold text-[var(--text-primary)]">JavaGuide:</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-1">
              {(['vi', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={[
                    'rounded-md py-1 font-semibold uppercase transition-colors',
                    lang === code
                      ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Backup & Reset */}
        <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
          <div className="font-semibold text-[var(--text-primary)]">Sao lưu &amp; dữ liệu học tập:</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Nhập JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Đặt lại toàn bộ tiến độ, bookmark và ghi chú đã lưu?')) {
                  resetProgress();
                  setStatusMsg('Đã đặt lại tiến độ học tập.');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--danger-text)] hover:border-[var(--danger)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại</span>
            </button>
          </div>
          {statusMsg && <p className="text-[11px] text-[var(--success-text)]">{statusMsg}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="rounded-lg border border-[var(--border-default)] px-3.5 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
