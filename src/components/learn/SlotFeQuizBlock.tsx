import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateSlotFeQuiz,
  readCachedSlotQuiz,
  saveCachedSlotQuiz,
  type SlotQuizSet,
} from '../../services/aiMentorService';
import type { Pro192Slot } from '../../types/content';

interface SlotFeQuizBlockProps {
  slot: Pro192Slot;
  excerpt: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function SlotFeQuizBlock({ slot, excerpt }: SlotFeQuizBlockProps) {
  const {
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    setIsSettingsOpen,
    pushToast,
  } = useApp();

  const [quiz, setQuiz] = useState<SlotQuizSet | null>(() => readCachedSlotQuiz(slot.slot)?.quiz ?? null);
  const [selected, setSelected] = useState<Record<string, number>>(
    () => readCachedSlotQuiz(slot.slot)?.selectedAnswers ?? {}
  );
  const [submitted, setSubmitted] = useState<boolean>(
    () => Boolean(readCachedSlotQuiz(slot.slot)?.submitted)
  );
  const [score, setScore] = useState<number | null>(
    () => readCachedSlotQuiz(slot.slot)?.score ?? null
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cachedNote, setCachedNote] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setErrorMsg(null);
    setCachedNote(false);
    const saved = readCachedSlotQuiz(slot.slot);
    setQuiz(saved?.quiz ?? null);
    setSelected(saved?.selectedAnswers ?? {});
    setSubmitted(Boolean(saved?.submitted));
    setScore(saved?.score ?? null);
  }, [slot.slot]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleGenerate = async (regenerate = false) => {
    if (loading) return;
    setErrorMsg(null);
    setLoading(true);
    setCachedNote(false);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!aiServerStatus) {
      await refreshAiServerStatus();
    }

    const targetModel = byokKey ? aiModel : aiServerStatus?.defaultModel || aiModel;

    try {
      const res = await generateSlotFeQuiz({
        apiKey: byokKey || undefined,
        model: targetModel,
        quizContext: {
          slot: slot.slot,
          title: slot.title,
          objectives: slot.objectives,
          examTraps: slot.examTraps,
          examFocus: slot.examFocus,
          excerpt,
          regenerate,
        },
        signal: controller.signal,
      });

      if (abortRef.current !== controller) return;

      if (res.ok) {
        if (typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
        setQuiz(res.quiz);
        setSelected({});
        setSubmitted(false);
        setScore(null);
        setCachedNote(res.cached);
        saveCachedSlotQuiz(slot.slot, {
          quiz: res.quiz,
          selectedAnswers: {},
          submitted: false,
          updatedAt: new Date().toISOString(),
        });
      } else {
        if (res.quotaExceeded) {
          updateAiServerQuota(0, res.limit);
        } else if (typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
        setErrorMsg(res.errorMessage);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setErrorMsg('Không thể tạo Mini-Quiz lúc này. Vui lòng thử lại.');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    let correctCount = 0;
    for (const q of quiz.questions) {
      if (selected[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    }
    setSubmitted(true);
    setScore(correctCount);
    saveCachedSlotQuiz(slot.slot, {
      quiz,
      selectedAnswers: selected,
      submitted: true,
      score: correctCount,
      updatedAt: new Date().toISOString(),
    });
    pushToast({
      title: `Mini-Quiz FE Slot ${String(slot.slot).padStart(2, '0')}: ${correctCount}/${quiz.questions.length} câu đúng`,
      tone: correctCount >= Math.ceil(quiz.questions.length * 0.6) ? 'success' : 'info',
    });
  };

  const handleRetrySameQuiz = () => {
    if (!quiz) return;
    setSelected({});
    setSubmitted(false);
    setScore(null);
    saveCachedSlotQuiz(slot.slot, {
      quiz,
      selectedAnswers: {},
      submitted: false,
      updatedAt: new Date().toISOString(),
    });
  };

  const slotLabel = String(slot.slot).padStart(2, '0');
  const answeredCount = quiz
    ? quiz.questions.filter((q) => typeof selected[q.id] === 'number').length
    : 0;

  return (
    <section
      data-no-ai-popover
      aria-label={`Mini-Quiz FE Slot ${slotLabel}`}
      className="space-y-4 rounded-xl border border-[var(--info)]/35 bg-[var(--bg-canvas)] p-4 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-[var(--info-text)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mini-Quiz ôn FE · Slot {slotLabel}</span>
            </span>
            {cachedNote && (
              <span className="rounded border border-[var(--success)]/35 bg-[var(--success-soft)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--success-text)]">
                Cache · 0 lượt
              </span>
            )}
            {submitted && score !== null && quiz && (
              <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2 py-0.5 font-mono font-bold text-[var(--accent-text)] tabular-nums">
                Kết quả: {score}/{quiz.questions.length}
              </span>
            )}
          </div>
          <p className="text-[var(--text-muted)]">
            5 câu trắc nghiệm nhanh chuẩn JDK 8 bám sát trọng tâm &amp; bẫy thi Slot {slotLabel} để kiểm tra trước khi chuyển bài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!quiz ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleGenerate(false)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--info)] px-3.5 py-1.5 font-bold text-[#1C1917] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{loading ? 'Đang sinh câu hỏi…' : '✨ Sinh Mini-Quiz FE (5 câu)'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleGenerate(true)}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1 font-semibold text-[var(--text-primary)] hover:border-[var(--info)] disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{loading ? 'Đang tạo bộ mới…' : '✨ Sinh 5 câu mới'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-[var(--danger-text)]"
        >
          <span>{errorMsg}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded border border-current px-2.5 py-1 font-semibold"
            >
              Mở Cài đặt Key
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate(Boolean(quiz))}
              className="rounded border border-current px-2.5 py-1 font-semibold"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {quiz && (
        <div className="space-y-4">
          {quiz.questions.map((q, qIdx) => {
            const chosenIdx = selected[q.id];
            const isCorrect = submitted && chosenIdx === q.correctIndex;
            return (
              <fieldset
                key={q.id}
                className="space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <legend className="font-semibold leading-relaxed text-[var(--text-primary)]">
                    Câu {qIdx + 1}: {q.question}
                  </legend>
                  <span className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                    {q.topicTag}
                  </span>
                </div>

                {q.codeSnippet && (
                  <pre className="overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 font-mono text-xs leading-relaxed text-[var(--text-primary)]">
                    <code>{q.codeSnippet}</code>
                  </pre>
                )}

                <div className="grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const checked = chosenIdx === optIdx;
                    const isAnswer = q.correctIndex === optIdx;
                    let cls =
                      'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--info)]';
                    if (submitted) {
                      if (isAnswer) {
                        cls =
                          'border-[var(--success)]/50 bg-[var(--success-soft)] font-semibold text-[var(--success-text)]';
                      } else if (checked && !isAnswer) {
                        cls =
                          'border-[var(--danger)]/50 bg-[var(--danger-soft)] text-[var(--danger-text)]';
                      }
                    } else if (checked) {
                      cls =
                        'border-[var(--info)] bg-[var(--info-soft)] font-semibold text-[var(--info-text)]';
                    }

                    return (
                      <label
                        key={`${q.id}-${optIdx}`}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 transition-colors ${cls}`}
                      >
                        <input
                          type="radio"
                          name={`slot-quiz-${slot.slot}-${q.id}`}
                          value={optIdx}
                          checked={checked}
                          disabled={submitted}
                          onChange={() =>
                            setSelected((prev) => ({
                              ...prev,
                              [q.id]: optIdx,
                            }))
                          }
                          className="mt-0.5 accent-[var(--info)]"
                        />
                        <span className="leading-snug">
                          <strong className="font-mono">{OPTION_LETTERS[optIdx]}.</strong> {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-2.5 leading-relaxed ${
                      isCorrect
                        ? 'border-[var(--success)]/35 bg-[var(--success-soft)] text-[var(--success-text)]'
                        : 'border-[var(--warning)]/40 bg-[var(--warning-soft)] text-[var(--accent-text)]'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger-text)]" aria-hidden="true" />
                    )}
                    <div>
                      <span className="font-semibold">
                        {isCorrect
                          ? 'Chính xác!'
                          : `Đáp án đúng là ${OPTION_LETTERS[q.correctIndex]}.`}
                      </span>{' '}
                      <span className="text-[var(--text-primary)]">{q.explanation}</span>
                    </div>
                  </div>
                )}
              </fieldset>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {!submitted ? (
              <button
                type="button"
                disabled={answeredCount === 0}
                onClick={handleSubmitQuiz}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                <span>
                  ✔ Nộp bài &amp; xem giải thích ({answeredCount}/{quiz.questions.length})
                </span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetrySameQuiz}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  🔁 Làm lại bộ này
                </button>
                <span className="text-[var(--text-muted)]">
                  Điểm gần nhất đã lưu cục bộ trên trình duyệt.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
