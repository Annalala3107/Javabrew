import { Link } from 'react-router-dom';
import {
  BookOpen,
  Columns2,
  Pause,
  Play,
  RotateCcw,
  Rows2,
  Share2,
  Timer,
} from 'lucide-react';
import type { Pro192PeChallengeMeta } from '../../types/content';
import { MorphActionButton } from '../lucian/MorphActionButton';
import { StretchySwitch } from '../lucian/StretchySwitch';

interface StudioToolbarProps {
  playgroundMode: boolean;
  activePeId?: number;
  challengesByPaper: Array<[string, Pro192PeChallengeMeta[]]>;
  maxPlaygroundFiles: number;
  examplesCount: number;
  draftState: 'clean' | 'saving' | 'saved';
  pgDraftState: 'clean' | 'saving' | 'saved';
  secondsLeft: number;
  timerRunning: boolean;
  formattedClock: string;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  showExamplesDrawer: boolean;
  onToggleExamplesDrawer: () => void;
  autoRun: boolean;
  onAutoRunChange: (checked: boolean) => void;
  onSharePlayground: () => void;
  splitOrientation: 'horizontal' | 'vertical';
  onToggleOrientation: () => void;
  isExecuting: boolean;
  onRunCode: () => void;
  onSubmitTests: () => void;
  onToggleAiPane: () => void;
  onReset: () => void;
  onSwitchToPlayground: () => void;
  onSwitchToPe: (peId: number) => void;
  onSelectModeOrPe: (value: string) => void;
}

export function StudioToolbar({
  playgroundMode,
  activePeId,
  challengesByPaper,
  maxPlaygroundFiles,
  examplesCount,
  draftState,
  pgDraftState,
  secondsLeft,
  timerRunning,
  formattedClock,
  onToggleTimer,
  onResetTimer,
  showExamplesDrawer,
  onToggleExamplesDrawer,
  autoRun,
  onAutoRunChange,
  onSharePlayground,
  splitOrientation,
  onToggleOrientation,
  isExecuting,
  onRunCode,
  onSubmitTests,
  onToggleAiPane,
  onReset,
  onSwitchToPlayground,
  onSwitchToPe,
  onSelectModeOrPe,
}: StudioToolbarProps) {
  return (
    <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 sm:px-4">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <Link
            to="/pe"
            className="inline-flex min-h-[40px] sm:min-h-[36px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← Kho đề PE
          </Link>

          <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5">
            <button
              type="button"
              onClick={onSwitchToPlayground}
              className={[
                'min-h-[36px] sm:min-h-[32px] rounded-md px-2.5 py-1 font-semibold transition-colors',
                playgroundMode
                  ? 'bg-[var(--success)] font-bold text-[#1C1917]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              ☕ Brew Lab
            </button>
            <button
              type="button"
              onClick={() => onSwitchToPe(activePeId ?? 1)}
              className={[
                'min-h-[36px] sm:min-h-[32px] rounded-md px-2.5 py-1 font-semibold transition-colors',
                !playgroundMode
                  ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              🎯 Luyện Đề PE
            </button>
          </div>

          <select
            aria-label="Chọn chế độ hoặc đề PE trong Code Studio"
            value={playgroundMode ? 'playground' : String(activePeId ?? 1)}
            onChange={(e) => onSelectModeOrPe(e.target.value)}
            className="min-h-[40px] sm:min-h-[36px] min-w-0 w-full sm:w-auto sm:max-w-[260px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <option value="playground">
              ☕ JavaBrew Live Lab (Tự do · tối đa {maxPlaygroundFiles} file)
            </option>
            {challengesByPaper.map(([paperName, groupItems]) => (
              <optgroup key={paperName} label={`Bộ đề ${paperName}`}>
                {groupItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {!playgroundMode && (
            <div className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono tabular-nums">
              <Timer className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              <span
                className={
                  secondsLeft === 0
                    ? 'text-[var(--danger-text)]'
                    : secondsLeft <= 300
                      ? 'text-[var(--accent-text)]'
                      : 'text-[var(--text-primary)]'
                }
              >
                {formattedClock}
              </span>
              <button
                type="button"
                onClick={onToggleTimer}
                aria-label={timerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ'}
                className="ml-1 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {timerRunning ? (
                  <Pause className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Play className="h-3 w-3" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={onResetTimer}
                aria-label="Đặt lại đồng hồ"
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <span
            role="status"
            className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]"
          >
            {playgroundMode
              ? pgDraftState === 'saving'
                ? 'Đang lưu…'
                : pgDraftState === 'saved'
                  ? '✓ Đã lưu Playground'
                  : 'Mẫu gốc'
              : draftState === 'saving'
                ? 'Đang lưu nháp…'
                : draftState === 'saved'
                  ? '✓ Đã lưu nháp'
                  : 'Code gốc'}
          </span>

          {playgroundMode && (
            <>
              <button
                type="button"
                onClick={onToggleExamplesDrawer}
                aria-expanded={showExamplesDrawer}
                className={[
                  'inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition-colors',
                  showExamplesDrawer
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mẫu ({examplesCount})</span>
              </button>

              <StretchySwitch
                checked={autoRun}
                onChange={onAutoRunChange}
                label="Auto-Run"
                title="Tự động chạy khi mở mẫu mới"
              />

              <button
                type="button"
                onClick={onSharePlayground}
                className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Chia sẻ</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleOrientation}
            aria-label="Xoay bố cục Ngang hoặc Dọc"
            title={
              splitOrientation === 'horizontal'
                ? 'Đang chia Trái / Phải — bấm để xếp Trên / Dưới'
                : 'Đang xếp Trên / Dưới — bấm để chia Trái / Phải'
            }
            className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {splitOrientation === 'horizontal' ? (
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Rows2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{splitOrientation === 'horizontal' ? 'Ngang ⇄ Dọc' : 'Dọc ⇄ Ngang'}</span>
          </button>

          <MorphActionButton
            label="▶ Run Code"
            variant={playgroundMode ? 'primary' : 'secondary'}
            className={playgroundMode ? '!bg-[var(--success)] !text-[#1C1917] hover:opacity-90' : ''}
            disabled={isExecuting}
            onClick={onRunCode}
          />
          {!playgroundMode && (
            <MorphActionButton
              label="✔ Chấm Test Case PE"
              variant="primary"
              disabled={isExecuting}
              onClick={onSubmitTests}
            />
          )}
          <button
            type="button"
            onClick={onToggleAiPane}
            className="min-h-[36px] rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1.5 font-medium text-[var(--info-text)] transition-colors hover:opacity-90"
          >
            {playgroundMode ? '✨ Hỏi AI Mentor' : '✨ AI Review & Tối ưu'}
          </button>
          <button
            type="button"
            onClick={onReset}
            title={
              playgroundMode
                ? 'Khôi phục mẫu hiện tại về bản gốc'
                : 'Khôi phục code gốc (Starter Code)'
            }
            className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {playgroundMode ? '↺ Khôi phục mẫu' : '↺ Khôi phục gốc'}
          </button>
        </div>
      </div>
    </div>
  );
}
