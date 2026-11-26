import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { useApp, type ByokPersistMode } from '../context/AppContext';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  AI_MENTOR_MODELS,
  testGeminiApiKey,
  type AiMentorModel,
} from '../services/aiMentorService';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    byokKey,
    byokPersist,
    setByokConfig,
    aiModel,
    setAiModel,
    theme,
    setTheme,
    lang,
    setLang,
    exportProgressJson,
    importProgressJson,
    resetProgress,
  } = useApp();

  const [draftKey, setDraftKey] = useState(byokKey);
  const [draftPersist, setDraftPersist] = useState<ByokPersistMode>(byokPersist);
  const [draftModel, setDraftModel] = useState<AiMentorModel>(aiModel);
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetIncludeDrafts, setResetIncludeDrafts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalA11y({
    open: isSettingsOpen,
    containerRef: dialogRef,
    onClose: () => setIsSettingsOpen(false),
  });

  useEffect(() => {
    if (isSettingsOpen) {
      setDraftKey(byokKey);
      setDraftPersist(byokPersist);
      setDraftModel(aiModel);
      setKeyStatus(null);
      setTestingKey(false);
      setStatusMsg(null);
      setConfirmReset(false);
      setResetIncludeDrafts(false);
    }
  }, [isSettingsOpen, byokKey, byokPersist, aiModel]);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setByokConfig(draftKey, draftPersist);
    setAiModel(draftModel);
    setStatusMsg('Đã lưu cấu hình cục bộ trên trình duyệt.');
    window.setTimeout(() => setIsSettingsOpen(false), 350);
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setKeyStatus(null);
    try {
      const res = await testGeminiApiKey(draftKey, draftModel);
      if (res.ok) {
        setKeyStatus({
          ok: true,
          msg: `Kết nối thành công với model ${res.model}!`,
        });
      } else {
        setKeyStatus({ ok: false, msg: res.errorMessage });
      }
    } finally {
      setTestingKey(false);
    }
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
      <div
        ref={dialogRef}
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 text-xs shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Settings className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            <span>Cài đặt AI Key &amp; Sandbox</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Đóng cài đặt"
            className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="leading-relaxed text-[var(--text-muted)]">
          Kiến trúc bảo mật (BYOK): Tài liệu lưu nội bộ, không quảng cáo. Để gọi trực tiếp AI Mentor bằng khóa cá nhân, API Key mặc định chỉ lưu trong{' '}
          <code className="rounded bg-[var(--bg-code)] px-1 py-0.5 text-[var(--accent-text)]">
            sessionStorage
          </code>{' '}
          (tự xóa khi đóng tab, an toàn trên máy phòng Lab).
        </p>

        {/* BYOK API Key & Model */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="byok-key-input" className="font-semibold text-[var(--text-primary)]">
              Gemini API Key (Tùy chọn):
            </label>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--info-text)] hover:underline"
            >
              <span>Lấy key miễn phí tại AI Studio</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          <input
            id="byok-key-input"
            type="password"
            value={draftKey}
            onChange={(e) => {
              setDraftKey(e.target.value);
              setKeyStatus(null);
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="AIzaSy… (Gửi qua header x-goog-api-key)"
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="ai-model-select" className="font-semibold text-[var(--text-primary)]">
              Model AI Mentor:
            </label>
            <select
              id="ai-model-select"
              value={draftModel}
              onChange={(e) => {
                setDraftModel(e.target.value as AiMentorModel);
                setKeyStatus(null);
              }}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              {AI_MENTOR_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)]/70 p-2.5 text-[11px] leading-snug text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={draftPersist === 'local'}
              onChange={(e) => setDraftPersist(e.target.checked ? 'local' : 'session')}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span>
              Ghi nhớ API Key trên máy cá nhân này (<code>localStorage</code>). Bỏ tick nếu dùng máy phòng Lab để tự xóa khi đóng tab.
            </span>
          </label>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={testingKey || !draftKey.trim()}
              onClick={() => void handleTestKey()}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1 font-semibold text-[var(--info-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{testingKey ? 'Đang kiểm tra…' : 'Kiểm tra kết nối Key'}</span>
            </button>
          </div>

          {keyStatus && (
            <p
              role="status"
              className={
                keyStatus.ok
                  ? 'rounded-lg border border-[var(--success)]/35 bg-[var(--success-soft)] px-2.5 py-1.5 text-xs text-[var(--success-text)]'
                  : 'rounded-lg border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-2.5 py-1.5 text-xs text-[var(--danger-text)]'
              }
            >
              {keyStatus.msg}
            </p>
          )}
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
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[var(--text-primary)]">
              Sao lưu &amp; dữ liệu học tập:
            </span>
            <span className="text-[11px] text-[var(--text-dim)]">JSON v2 (+ code nháp PE/Lab)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Xuất JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Nhập JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
            {!confirmReset && (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--danger-text)] hover:border-[var(--danger)]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {confirmReset && (
            <div
              role="alert"
              className="space-y-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3"
            >
              <p className="font-semibold text-[var(--danger-text)]">
                Xác nhận đặt lại toàn bộ tiến độ, bookmark và ghi chú?
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={resetIncludeDrafts}
                  onChange={(e) => setResetIncludeDrafts(e.target.checked)}
                  className="accent-[var(--danger)]"
                />
                <span>Xóa luôn toàn bộ code nháp PE &amp; JavaBrew Live Lab</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetProgress(resetIncludeDrafts);
                    setConfirmReset(false);
                    setStatusMsg(
                      resetIncludeDrafts
                        ? 'Đã đặt lại tiến độ và xóa toàn bộ code nháp.'
                        : 'Đã đặt lại tiến độ học tập.'
                    );
                  }}
                  className="min-h-[32px] rounded-md bg-[var(--danger)] px-3 py-1 font-bold text-white hover:opacity-90"
                >
                  Xác nhận đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmReset(false);
                    setResetIncludeDrafts(false);
                  }}
                  className="min-h-[32px] rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {statusMsg && <p className="text-xs text-[var(--success-text)]">{statusMsg}</p>}
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
