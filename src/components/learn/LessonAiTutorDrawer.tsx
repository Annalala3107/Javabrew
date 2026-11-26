import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings, Sparkles, Square, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  streamLearnTutor,
  type LearnTutorContext,
  type LearnTutorIntent,
} from '../../services/aiMentorService';
import { StreamingAiBubble } from '../lucian/StreamingAiBubble';

export interface LessonTutorInitialRequest {
  nonce: number;
  selectedText?: string;
  intent: LearnTutorIntent;
  prompt: string;
}

interface LessonChatItem {
  id: string;
  prompt: string;
  reply: string;
  tone: 'ai' | 'error';
  badgeLabel?: string;
  streaming?: boolean;
}

interface LessonAiTutorDrawerProps {
  open: boolean;
  onClose: () => void;
  lessonContext: LearnTutorContext;
  initialRequest?: LessonTutorInitialRequest | null;
}

export function LessonAiTutorDrawer({
  open,
  onClose,
  lessonContext,
  initialRequest,
}: LessonAiTutorDrawerProps) {
  const {
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    setIsSettingsOpen,
  } = useApp();

  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastInteractionIdRef = useRef<string | null>(null);
  const handledNonceRef = useRef<number>(-1);

  const [chatHistory, setChatHistory] = useState<LessonChatItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState('');

  useModalA11y({
    open,
    containerRef: drawerRef,
    initialFocusRef: inputRef,
    onClose,
  });

  const abortActive = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setAiBusy(false);
  }, []);

  useEffect(() => {
    if (open && !aiServerStatus) {
      void refreshAiServerStatus();
    }
  }, [open, aiServerStatus, refreshAiServerStatus]);

  useEffect(() => {
    abortActive();
    setChatHistory([]);
    setSelectedQuote('');
    lastInteractionIdRef.current = null;
  }, [lessonContext.itemKey, abortActive]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && chatHistory.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatHistory]);

  const sendPrompt = useCallback(
    async (
      promptText: string,
      intent: LearnTutorIntent = 'custom',
      selectedTextOverride?: string
    ) => {
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt || aiBusy) return;
      setChatInput('');

      const activeSelection = selectedTextOverride ?? (selectedQuote || undefined);
      if (selectedTextOverride !== undefined) {
        setSelectedQuote(selectedTextOverride);
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const targetModel = byokKey ? aiModel : aiServerStatus?.defaultModel || aiModel;
      const initialBadge = byokKey ? targetModel : `AI Tự động · ${targetModel}`;
      const msgId = `learn-msg-${Date.now()}`;

      setAiBusy(true);
      setChatHistory((prev) => [
        ...prev,
        {
          id: msgId,
          prompt: cleanPrompt,
          reply: '',
          tone: 'ai',
          badgeLabel: initialBadge,
          streaming: true,
        },
      ]);

      try {
        const res = await streamLearnTutor({
          apiKey: byokKey || undefined,
          model: targetModel,
          prompt: cleanPrompt,
          learnContext: {
            ...lessonContext,
            intent,
            selectedText: activeSelection,
          },
          previousInteractionId: lastInteractionIdRef.current,
          signal: controller.signal,
          onMeta: (meta) => {
            if (abortRef.current !== controller) return;
            const prefix = meta.cached
              ? 'Cache · 0 lượt'
              : meta.source === 'byok'
                ? meta.model
                : `AI Tự động · ${meta.model}`;
            setChatHistory((prev) =>
              prev.map((m) => (m.id === msgId ? { ...m, badgeLabel: prefix } : m))
            );
            if (!meta.cached && typeof meta.remaining === 'number') {
              updateAiServerQuota(meta.remaining, meta.limit);
            }
          },
          onDelta: (chunk) => {
            if (abortRef.current !== controller) return;
            setChatHistory((prev) =>
              prev.map((m) => (m.id === msgId ? { ...m, reply: m.reply + chunk } : m))
            );
          },
        });

        if (abortRef.current !== controller) return;

        if (res.ok) {
          if (res.interactionId) {
            lastInteractionIdRef.current = res.interactionId;
          }
          if (!res.cached && typeof res.remaining === 'number') {
            updateAiServerQuota(res.remaining, res.limit);
          }
          const finalBadge = res.cached
            ? 'Cache · 0 lượt'
            : res.source === 'server'
              ? `AI Tự động · ${res.model}`
              : res.model;
          setChatHistory((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    reply: res.reply || m.reply,
                    streaming: false,
                    badgeLabel: finalBadge,
                  }
                : m
            )
          );
        } else {
          if (res.quotaExceeded) {
            updateAiServerQuota(0, res.limit);
          } else if (typeof res.remaining === 'number') {
            updateAiServerQuota(res.remaining, res.limit);
          }
          setChatHistory((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    reply: res.errorMessage,
                    tone: 'error',
                    streaming: false,
                    badgeLabel: res.quotaExceeded
                      ? 'Hết lượt hôm nay'
                      : res.status
                        ? `Lỗi HTTP ${res.status}`
                        : 'Chưa kết nối AI',
                  }
                : m
            )
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setChatHistory((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? { ...m, streaming: false, reply: m.reply || 'Đã dừng phản hồi AI.' }
                : m
            )
          );
        } else {
          setChatHistory((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    reply: 'Mất kết nối tới AI Trợ lý bài học. Hãy thử lại.',
                    tone: 'error',
                    streaming: false,
                    badgeLabel: 'Lỗi mạng',
                  }
                : m
            )
          );
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setAiBusy(false);
        }
      }
    },
    [aiBusy, aiModel, aiServerStatus, byokKey, lessonContext, selectedQuote, updateAiServerQuota]
  );

  useEffect(() => {
    if (
      open &&
      initialRequest &&
      initialRequest.nonce !== handledNonceRef.current
    ) {
      handledNonceRef.current = initialRequest.nonce;
      void sendPrompt(
        initialRequest.prompt,
        initialRequest.intent,
        initialRequest.selectedText
      );
    }
  }, [open, initialRequest, sendPrompt]);

  if (!open) return null;

  const statusBadge = byokKey ? (
    <span className="rounded border border-[var(--info)]/35 bg-[var(--info-soft)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--info-text)]">
      Key cá nhân · {aiModel}
    </span>
  ) : aiServerStatus?.available ? (
    <span className="rounded border border-[var(--success)]/35 bg-[var(--success-soft)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--success-text)] tabular-nums">
      ✨ AI Tự động ({aiServerStatus.remaining}/{aiServerStatus.dailyLimit})
    </span>
  ) : (
    <button
      type="button"
      onClick={() => setIsSettingsOpen(true)}
      className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:border-[var(--accent)]"
    >
      <Settings className="h-2.5 w-2.5" aria-hidden="true" />
      <span>Cài đặt Key</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Trợ lý bài học"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col justify-between border-l border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-start justify-between gap-2 border-b border-[var(--border-default)] pb-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 font-bold text-[var(--info-text)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>AI Trợ lý bài học</span>
              </span>
              {statusBadge}
            </div>
            <div className="truncate font-medium text-[var(--text-muted)]">
              {lessonContext.title}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {chatHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  abortActive();
                  setChatHistory([]);
                  setSelectedQuote('');
                  lastInteractionIdRef.current = null;
                }}
                className="rounded border border-[var(--border-default)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Xóa chat
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng AI Trợ lý bài học"
              className="rounded border border-[var(--border-default)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-3 pr-1"
        >
          {selectedQuote && (
            <div className="flex items-start justify-between gap-2 rounded-lg border border-[var(--info)]/35 bg-[var(--info-soft)] p-2.5 text-[var(--text-secondary)]">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--info-text)]">Đoạn đang hỏi:</div>
                <p className="mt-0.5 line-clamp-3 italic">“{selectedQuote}”</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote('')}
                aria-label="Bỏ trích đoạn đang chọn"
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
          )}

          {chatHistory.length === 0 && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 leading-relaxed text-[var(--text-muted)]">
              Chọn 1 thao tác nhanh bên dưới hoặc bôi đen bất kỳ đoạn nào trong bài để AI giải thích,
              tạo ví dụ Java chạy thử trên Live Lab hoặc tóm tắt ý chính.
            </div>
          )}

          {chatHistory.map((msg) => (
            <StreamingAiBubble
              key={msg.id}
              prompt={msg.prompt}
              reply={msg.reply}
              thinking={msg.streaming && msg.reply.length === 0}
              streaming={msg.streaming}
              liveStreamed
              allowJavaRun
              tone={msg.tone}
              badgeLabel={msg.badgeLabel}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onAbortStream={msg.streaming ? abortActive : undefined}
            />
          ))}
        </div>

        <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={aiBusy}
              onClick={() =>
                void sendPrompt('Tóm tắt 5 ý cốt lõi quan trọng nhất của bài học này', 'summarize', '')
              }
              className="min-h-[30px] rounded border border-[var(--info)]/40 bg-[var(--info-soft)] px-2.5 py-1 font-medium text-[var(--info-text)] hover:opacity-90 disabled:opacity-50"
            >
              📝 Tóm tắt 5 ý cốt lõi
            </button>
            <button
              type="button"
              disabled={aiBusy}
              onClick={() =>
                void sendPrompt('Lập bảng so sánh các khái niệm và bẫy quan trọng trong bài này', 'compare-table')
              }
              className="min-h-[30px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-secondary)] hover:border-[var(--info)] disabled:opacity-50"
            >
              📊 Bảng so sánh
            </button>
            <button
              type="button"
              disabled={aiBusy}
              onClick={() =>
                void sendPrompt('Cho 1 ví dụ Java ngắn có main() chạy thử được minh họa bài này', 'java-example')
              }
              className="min-h-[30px] rounded border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-text)] hover:opacity-90 disabled:opacity-50"
            >
              ☕ Ví dụ Java chạy thử
            </button>
            <button
              type="button"
              disabled={aiBusy}
              onClick={() =>
                void sendPrompt('Giải thích các thuật ngữ tiếng Anh chuyên ngành quan trọng trong bài', 'glossary-en-vi')
              }
              className="min-h-[30px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-secondary)] hover:border-[var(--info)] disabled:opacity-50"
            >
              🔤 Thuật ngữ EN → VI
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!aiBusy) {
                void sendPrompt(chatInput, 'custom');
              }
            }}
            className="flex gap-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              autoComplete="off"
              aria-label="Hỏi AI Trợ lý về bài học"
              placeholder="Hỏi thêm về bài học này…"
              className="min-h-[38px] flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
            />
            {aiBusy ? (
              <button
                type="button"
                onClick={abortActive}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[var(--danger)]/45 bg-[var(--danger-soft)] px-3 py-1.5 font-bold text-[var(--danger-text)]"
              >
                <Square className="h-3 w-3" aria-hidden="true" />
                <span>Dừng</span>
              </button>
            ) : (
              <button
                type="submit"
                className="min-h-[38px] rounded-lg bg-[var(--info)] px-3.5 py-1.5 font-bold text-[#1C1917]"
              >
                Gửi
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
