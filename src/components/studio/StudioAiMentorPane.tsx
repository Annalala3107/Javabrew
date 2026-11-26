import { Settings } from 'lucide-react';
import type { PeDiagnosisCard } from '../../utils/peEvaluator';
import { StreamingAiBubble } from '../lucian/StreamingAiBubble';

export interface ChatMessage {
  id: string;
  prompt: string;
  reply: string;
  tone: 'ai' | 'offline' | 'error';
  badgeLabel?: string;
}

interface StudioAiMentorPaneProps {
  playgroundMode: boolean;
  activeFileName: string;
  byokKey: string;
  aiModel: string;
  onOpenSettings: () => void;
  chatHistory: ChatMessage[];
  onClearChat: () => void;
  onClose: () => void;
  diagnosisCards: PeDiagnosisCard[];
  revealedHints: Record<string, boolean>;
  onToggleHint: (cardId: string) => void;
  onOpenDiff: () => void;
  aiBusy: boolean;
  pendingPrompt: string;
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onSendPrompt: (prompt: string) => void;
}

export function StudioAiMentorPane({
  playgroundMode,
  activeFileName,
  byokKey,
  aiModel,
  onOpenSettings,
  chatHistory,
  onClearChat,
  onClose,
  diagnosisCards,
  revealedHints,
  onToggleHint,
  onOpenDiff,
  aiBusy,
  pendingPrompt,
  chatInput,
  onChatInputChange,
  onSendPrompt,
}: StudioAiMentorPaneProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs lg:w-80 lg:border-l lg:border-t-0">
      <div className="max-h-[460px] space-y-3 overflow-y-auto overscroll-contain pr-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 font-bold text-[var(--info-text)]">
              ✨ AI Code Mentor
            </span>
            {byokKey ? (
              <span className="rounded border border-[var(--info)]/35 bg-[var(--info-soft)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--info-text)]">
                {aiModel}
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
              >
                <Settings className="h-2.5 w-2.5" aria-hidden="true" />
                <span>Cài đặt Key</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {chatHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                className="rounded border border-[var(--border-default)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Xóa chat
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Ẩn AI Code Mentor"
              className="rounded border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {playgroundMode ? (
            <div className="space-y-2 rounded-xl border border-[var(--info)]/35 bg-[var(--info-soft)] p-3">
              <div className="font-semibold text-[var(--info-text)]">
                ☕ Trợ lý JavaBrew Live Lab
              </div>
              <p className="leading-relaxed text-[var(--text-secondary)]">
                Đang chỉnh sửa <code className="font-mono">{activeFileName}</code>. Bạn có thể tạo
                thêm class OOP qua nút <strong>+ Thêm tệp</strong>, nhập dữ liệu đầu vào với{' '}
                <strong>+ Nhập stdin</strong> hoặc hỏi AI bên dưới.
              </p>
            </div>
          ) : (
            diagnosisCards.map((card) => {
              const toneClasses =
                card.tone === 'sky'
                  ? 'border-[var(--info)]/35 bg-[var(--info-soft)]'
                  : card.tone === 'green'
                    ? 'border-[var(--success)]/35 bg-[var(--success-soft)]'
                    : 'border-[var(--warning)]/35 bg-[var(--warning-soft)]';
              const headingColor =
                card.tone === 'sky'
                  ? 'text-[var(--info-text)]'
                  : card.tone === 'green'
                    ? 'text-[var(--success-text)]'
                    : 'text-[var(--accent-text)]';
              const hintOpen = Boolean(revealedHints[card.id]);

              return (
                <div
                  key={card.id}
                  className={`space-y-2 rounded-xl border p-3 ${toneClasses}`}
                >
                  <div className={`font-semibold ${headingColor}`}>{card.title}</div>
                  <p className="leading-relaxed text-[var(--text-secondary)]">
                    {card.description}
                  </p>

                  {card.tone === 'sky' && card.hintCode && (
                    <>
                      <button
                        type="button"
                        onClick={() => onToggleHint(card.id)}
                        className="min-h-[34px] w-full rounded-lg border border-[var(--info)]/40 bg-[var(--bg-canvas)] py-1.5 font-medium text-[var(--info-text)]"
                      >
                        {hintOpen ? 'Ẩn gợi ý (Lớp 2)' : 'Xem gợi ý cách sửa (Lớp 2)'}
                      </button>
                      {hintOpen && (
                        <pre className="whitespace-pre-wrap rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2 font-mono text-xs text-[var(--text-primary)]">
                          {card.hintCode}
                        </pre>
                      )}
                    </>
                  )}

                  {card.tone === 'amber' && (
                    <button
                      type="button"
                      onClick={onOpenDiff}
                      className="min-h-[34px] w-full rounded-lg bg-[var(--accent)] py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                    >
                      So sánh Trước / Sau (Diff)
                    </button>
                  )}
                </div>
              );
            })
          )}

          {chatHistory.map((msg) => (
            <StreamingAiBubble
              key={msg.id}
              prompt={msg.prompt}
              reply={msg.reply}
              tone={msg.tone}
              badgeLabel={msg.badgeLabel}
              onOpenSettings={onOpenSettings}
            />
          ))}

          {aiBusy && pendingPrompt && (
            <StreamingAiBubble prompt={pendingPrompt} thinking badgeLabel={aiModel} />
          )}
        </div>
      </div>

      {/* Ask AI Input */}
      <div className="space-y-2 border-t border-[var(--border-default)] pt-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSendPrompt('Giải thích đoạn code này giúp em')}
            className="min-h-[32px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Giải thích code
          </button>
          <button
            type="button"
            onClick={() => onSendPrompt('Làm sao tối ưu ngắn hơn nữa?')}
            className="min-h-[32px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Cách tối ưu?
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendPrompt(chatInput);
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Hỏi AI Mentor về mã nguồn Java"
            placeholder="Hỏi AI về code của bạn…"
            className="min-h-[40px] sm:min-h-[36px] flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
          />
          <button
            type="submit"
            disabled={aiBusy}
            className="min-h-[40px] sm:min-h-[36px] rounded-lg bg-[var(--info)] px-3 py-1.5 font-bold text-[#1C1917] disabled:opacity-50"
          >
            {aiBusy ? '…' : 'Gửi'}
          </button>
        </form>
      </div>
    </aside>
  );
}
