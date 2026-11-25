import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { CopyCodeButton } from '../components/lucian/CopyCodeButton';
import { LucianChecklistItem } from '../components/lucian/LucianChecklistItem';
import { MorphActionButton } from '../components/lucian/MorphActionButton';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { StreamingAiBubble } from '../components/lucian/StreamingAiBubble';
import { useApp } from '../context/AppContext';
import { evaluatePeCode, type PeDiagnosisCard } from '../utils/peEvaluator';
import { clearPeDraft, readPeDraft, savePeDraft } from '../utils/studioDrafts';
import { stageFileToSlug } from '../utils/text';

interface ChatMessage {
  id: string;
  prompt: string;
  reply: string;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LEFT_TAB_OPTIONS = [
  { id: 'spec' as const, label: 'Đề bài PE' },
  { id: 'theory' as const, label: 'Lý thuyết nhanh' },
];

export function CodeStudioPage() {
  const { peId } = useParams<{ peId?: string }>();
  const navigate = useNavigate();
  const { pro192, byokKey, markPeStatus, addMistake, recordVisit, pushToast } = useApp();

  const challenges = useMemo(() => pro192?.peChallenges ?? [], [pro192]);
  const numericId = Number(peId) || 1;
  const activePe = useMemo(
    () => challenges.find((c) => c.id === numericId) || challenges[0] || null,
    [challenges, numericId]
  );

  const [leftTab, setLeftTab] = useState<'spec' | 'theory'>('spec');
  const [activeFile, setActiveFile] = useState<'main' | 'entity'>('main');
  const [showAiPane, setShowAiPane] = useState(true);
  const [showDiff, setShowDiff] = useState(false);

  const [loadedPeId, setLoadedPeId] = useState<number | null>(null);
  const [mainCode, setMainCode] = useState('');
  const [entityCode, setEntityCode] = useState('');
  const [draftState, setDraftState] = useState<'clean' | 'saving' | 'saved'>('clean');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  const [consoleStatus, setConsoleStatus] = useState('Sẵn sàng biên dịch (Static Sandbox)');
  const [consoleTone, setConsoleTone] = useState<'muted' | 'amber' | 'green' | 'red'>('muted');
  const [consoleOutput, setConsoleOutput] = useState(
    'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để kiểm tra lỗi.'
  );
  const [diagnosisCards, setDiagnosisCards] = useState<PeDiagnosisCard[]>([]);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [chatInput, setChatInput] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  const gutterRef = useRef<HTMLDivElement>(null);
  const draftTimerRef = useRef<number>(0);
  const latestDraftRef = useRef<{ peId: number; main: string; entity: string; dirty: boolean } | null>(
    null
  );

  // Compact PE Timer matching real exam pacing
  const suggestedMinutes = useMemo(() => {
    if (!activePe) return 25;
    const m = activePe.meta.match(/(\d+)\s*phút/i);
    return m ? Number(m[1]) : 35;
  }, [activePe]);

  const [secondsLeft, setSecondsLeft] = useState(suggestedMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Sync starter/draft immediately when activePe changes to prevent 1-frame empty textarea flash
  if (activePe && loadedPeId !== activePe.id) {
    const draft = readPeDraft(activePe.id);
    const initMain = draft ? draft.mainCode : activePe.starterCode;
    const initEntity = draft ? draft.entityCode : activePe.entityCode;
    const isModified =
      draft !== null &&
      (draft.mainCode !== activePe.starterCode || draft.entityCode !== activePe.entityCode);

    setLoadedPeId(activePe.id);
    setMainCode(initMain);
    setEntityCode(initEntity);
    setDraftState(isModified ? 'saved' : 'clean');
    setCheckedCriteria({});
    setActiveFile('main');
    setShowDiff(false);
    setConsoleStatus('Sẵn sàng biên dịch (Static Sandbox)');
    setConsoleTone('muted');
    setConsoleOutput(
      'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để kiểm tra lỗi.'
    );
    setRevealedHints({});
    setChatHistory([]);
    setPendingPrompt('');
    setTimerRunning(false);
    setSecondsLeft(suggestedMinutes * 60);
  }

  // Flush unsaved draft helper
  const flushLatestDraft = () => {
    window.clearTimeout(draftTimerRef.current);
    const snap = latestDraftRef.current;
    if (snap && snap.dirty) {
      savePeDraft(snap.peId, snap.main, snap.entity);
      snap.dirty = false;
    }
  };

  // Sync refs, initial diagnosis & visit history when active PE changes
  useEffect(() => {
    if (!activePe) return;
    if (latestDraftRef.current && latestDraftRef.current.peId !== activePe.id) {
      flushLatestDraft();
    }

    const draft = readPeDraft(activePe.id);
    const initMain = draft ? draft.mainCode : activePe.starterCode;
    const initEntity = draft ? draft.entityCode : activePe.entityCode;

    if (!latestDraftRef.current || latestDraftRef.current.peId !== activePe.id) {
      latestDraftRef.current = {
        peId: activePe.id,
        main: initMain,
        entity: initEntity,
        dirty: false,
      };
    }

    const initialEval = evaluatePeCode(activePe.id, initMain, initEntity);
    setDiagnosisCards(initialEval.diagnosisCards);

    recordVisit({
      path: `/studio/${activePe.id}`,
      title: `${activePe.code}: ${activePe.title}`,
      kind: 'studio',
      updatedAt: new Date().toISOString(),
    });
  }, [activePe, recordVisit]);

  useEffect(() => {
    return () => {
      flushLatestDraft();
    };
  }, []);

  const updateCodeAndScheduleDraft = (target: 'main' | 'entity', nextValue: string) => {
    if (!activePe) return;
    const nextMain = target === 'main' ? nextValue : mainCode;
    const nextEntity = target === 'entity' ? nextValue : entityCode;

    if (target === 'main') setMainCode(nextValue);
    else setEntityCode(nextValue);

    setDraftState('saving');
    latestDraftRef.current = {
      peId: activePe.id,
      main: nextMain,
      entity: nextEntity,
      dirty: true,
    };

    window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      savePeDraft(activePe.id, nextMain, nextEntity);
      if (latestDraftRef.current) latestDraftRef.current.dirty = false;
      setDraftState(
        nextMain === activePe.starterCode && nextEntity === activePe.entityCode ? 'clean' : 'saved'
      );
    }, 180);
  };

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && timerRunning) setTimerRunning(false);
  }, [secondsLeft, timerRunning]);

  const relatedSlot = useMemo(() => {
    if (!activePe || !pro192 || activePe.relatedSlots.length === 0) return null;
    return pro192.slots.find((s) => s.slot === activePe.relatedSlots[0]) || null;
  }, [activePe, pro192]);

  const fileTabs = useMemo(
    () =>
      activePe
        ? [
            { id: 'main' as const, label: 'Main.java' },
            { id: 'entity' as const, label: activePe.entityFileName },
          ]
        : [],
    [activePe]
  );

  const handleRunCode = (): boolean => {
    if (!activePe) return false;
    flushLatestDraft();
    const res = evaluatePeCode(activePe.id, mainCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleOutput(res.consoleRunOutput);
    if (res.allPassed) {
      setConsoleStatus('✔ Biên dịch & Chạy thành công (0.8s)');
      setConsoleTone('green');
      return true;
    }
    setConsoleStatus('✕ Cảnh báo Runtime / Thiếu điều kiện');
    setConsoleTone('red');
    if (res.detectedMistake) addMistake(res.detectedMistake);
    return false;
  };

  const handleSubmitTests = (): boolean => {
    if (!activePe) return false;
    flushLatestDraft();
    const res = evaluatePeCode(activePe.id, mainCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleStatus(res.statusText);
    setConsoleOutput(res.consoleTestOutput);
    if (res.allPassed) {
      setConsoleTone('green');
      markPeStatus(activePe.id, 'pass');
      pushToast({
        title: `Chúc mừng! Đã Pass ${activePe.code}`,
        description: `${res.passedCount}/${res.totalCount} test cases đạt chuẩn Clean Code`,
        tone: 'success',
      });
      return true;
    }
    setConsoleTone('amber');
    markPeStatus(activePe.id, 'in-progress');
    if (res.detectedMistake) addMistake(res.detectedMistake);
    return false;
  };

  const handleApplyCleanCode = () => {
    if (!activePe) return;
    setMainCode(activePe.cleanCode);
    savePeDraft(activePe.id, activePe.cleanCode, entityCode);
    setDraftState('saved');
    if (latestDraftRef.current) {
      latestDraftRef.current = {
        peId: activePe.id,
        main: activePe.cleanCode,
        entity: entityCode,
        dirty: false,
      };
    }
    setActiveFile('main');
    setShowDiff(false);
    const res = evaluatePeCode(activePe.id, activePe.cleanCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleStatus('Đã áp dụng bản tối ưu ✨');
    setConsoleTone('green');
    setConsoleOutput(
      'Code đã gọn hơn! Hãy bấm "✔ Chấm Test Case PE" để xác nhận Pass toàn bộ test.'
    );
    pushToast({
      title: 'Đã áp dụng Clean Code',
      description: 'Nháp của bạn đã được cập nhật tự động.',
      tone: 'success',
    });
  };

  const handleReset = () => {
    if (!activePe) return;
    const prevMain = mainCode;
    const prevEntity = entityCode;
    const hadChanges = prevMain !== activePe.starterCode || prevEntity !== activePe.entityCode;

    window.clearTimeout(draftTimerRef.current);
    clearPeDraft(activePe.id);
    setMainCode(activePe.starterCode);
    setEntityCode(activePe.entityCode);
    setDraftState('clean');
    latestDraftRef.current = {
      peId: activePe.id,
      main: activePe.starterCode,
      entity: activePe.entityCode,
      dirty: false,
    };

    setActiveFile('main');
    setShowDiff(false);
    setConsoleStatus('Sẵn sàng biên dịch (Static Sandbox)');
    setConsoleTone('muted');
    setConsoleOutput(
      'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để kiểm tra lỗi.'
    );
    setDiagnosisCards(
      evaluatePeCode(activePe.id, activePe.starterCode, activePe.entityCode).diagnosisCards
    );

    if (hadChanges) {
      pushToast({
        title: `Đã khôi phục code gốc (${activePe.code})`,
        tone: 'info',
        undoLabel: 'Hoàn tác',
        onUndo: () => {
          setMainCode(prevMain);
          setEntityCode(prevEntity);
          savePeDraft(activePe.id, prevMain, prevEntity);
          setDraftState('saved');
        },
      });
    }
  };

  const sendAiPrompt = async (promptText: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || !activePe) return;
    setChatInput('');

    // If BYOK Gemini key is configured, query Gemini; otherwise answer intelligently offline
    if (byokKey) {
      setPendingPrompt(cleanPrompt);
      setAiBusy(true);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(byokKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Bạn là AI Code Mentor cho môn PRO192 (Java OOP). Hãy trả lời ngắn gọn, thực tế bằng tiếng Việt cho câu hỏi "${cleanPrompt}" dựa trên đề ${activePe.code} (${activePe.title}) và code hiện tại:\n\n${mainCode}`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Không nhận được phản hồi từ Gemini API.';
          setChatHistory((prev) => [
            ...prev,
            { id: `msg-${Date.now()}`, prompt: cleanPrompt, reply },
          ]);
          setAiBusy(false);
          setPendingPrompt('');
          return;
        }
      } catch {
        // fall through to offline smart mentor
      }
      setAiBusy(false);
      setPendingPrompt('');
    }

    const fallbackReply =
      /tối ưu|ngắn|clean/i.test(cleanPrompt)
        ? `AI Mentor: Với ${activePe.code}, hãy ưu tiên kiểm tra dữ liệu biên (null / mảng rỗng) ở đầu hàm bằng Early Return, sau đó tách phần kiểm tra hoặc dùng Comparator / try-with-resources để giảm độ sâu if-else.`
        : `AI Mentor: Đoạn code ${activePe.code} tập trung vào ${activePe.meta}. Kiểm tra kỹ tiêu chí: ${activePe.checklist[0] || 'xử lý null an toàn'} và bấm "⚡ So sánh Bản Tối ưu (Diff)" để đối chiếu trực quan.`;

    setChatHistory((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, prompt: cleanPrompt, reply: fallbackReply },
    ]);
  };

  const statusColorCls =
    consoleTone === 'green'
      ? 'text-[var(--success-text)]'
      : consoleTone === 'red'
        ? 'text-[var(--danger-text)]'
        : consoleTone === 'amber'
          ? 'text-[var(--accent-text)]'
          : 'text-[var(--text-muted)]';

  const activeCode = activeFile === 'main' ? mainCode : entityCode;
  const activeLinesCount = Math.max(14, activeCode.split(/\r?\n/).length);
  const currentLineCount = mainCode.split(/\r?\n/).length;
  const cleanLineCount = activePe ? activePe.cleanCode.split(/\r?\n/).length : 0;

  if (!activePe) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-xs text-[var(--text-muted)]">
        Đang tải dữ liệu Code Studio...
      </div>
    );
  }

  const javacCommand = `javac ${activePe.entityFileName} Main.java && java Main`;

  return (
    <div className="flex flex-1 flex-col">
      {/* Studio Sub-toolbar */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pe"
              className="inline-flex min-h-[36px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← Kho đề PE
            </Link>

            <select
              aria-label="Chọn đề PE trong Code Studio"
              value={activePe.id}
              onChange={(e) => {
                flushLatestDraft();
                navigate(`/studio/${e.target.value}`);
              }}
              className="min-h-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>

            <div className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono tabular-nums">
              <Timer className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span
                className={
                  secondsLeft === 0
                    ? 'text-[var(--danger-text)]'
                    : secondsLeft <= 300
                      ? 'text-[var(--accent-text)]'
                      : 'text-[var(--text-primary)]'
                }
              >
                {formatClock(secondsLeft)}
              </span>
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                aria-label={timerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ'}
                className="ml-1 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(suggestedMinutes * 60);
                }}
                aria-label="Đặt lại đồng hồ"
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              role="status"
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-muted)]"
            >
              {draftState === 'saving'
                ? 'Đang lưu nháp...'
                : draftState === 'saved'
                  ? '✓ Đã lưu nháp'
                  : 'Code gốc'}
            </span>

            <MorphActionButton
              label="▶ Run Code"
              variant="secondary"
              onClick={handleRunCode}
            />
            <MorphActionButton
              label="✔ Chấm Test Case PE"
              variant="primary"
              onClick={handleSubmitTests}
            />
            <button
              type="button"
              onClick={() => setShowAiPane((s) => !s)}
              className="min-h-[36px] rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1.5 font-medium text-[var(--info-text)] transition-colors hover:opacity-90"
            >
              ✨ AI Review &amp; Tối ưu
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Khôi phục code gốc (Starter Code)"
              className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ↺ Khôi phục gốc
            </button>
          </div>
        </div>
      </div>

      {/* 3-Pane Studio Workspace */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left Pane: Problem & Theory */}
        <aside className="space-y-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-xs lg:col-span-3 lg:border-b-0 lg:border-r">
          <SlidingPillTabs
            options={LEFT_TAB_OPTIONS}
            value={leftTab}
            onChange={setLeftTab}
            ariaLabel="Chuyển đề bài PE hoặc lý thuyết nhanh"
            tone="neutral"
          />

          {leftTab === 'spec' ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Yêu cầu bài toán:
              </div>
              <p className="leading-relaxed text-[var(--text-muted)]">{activePe.desc}</p>

              <div className="space-y-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
                <div className="font-semibold text-[var(--text-primary)]">Checklist tiêu chí:</div>
                <div className="space-y-1.5">
                  {activePe.checklist.map((criterion) => {
                    const checked = Boolean(checkedCriteria[criterion]);
                    return (
                      <LucianChecklistItem
                        key={criterion}
                        checked={checked}
                        strikethrough
                        ariaLabel={`Đánh dấu tiêu chí: ${criterion}`}
                        onToggle={() =>
                          setCheckedCriteria((prev) => ({
                            ...prev,
                            [criterion]: !prev[criterion],
                          }))
                        }
                        label={<span className="leading-snug">{criterion}</span>}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 font-mono text-[var(--text-muted)]">
                <div className="mb-1 text-[var(--text-dim)]">Thông tin đề:</div>
                <div>{activePe.meta}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 leading-relaxed text-[var(--text-muted)]">
              <div className="font-semibold text-[var(--accent-text)]">
                Mẹo làm nhanh {activePe.code}:
              </div>
              <p>
                1. Luôn kiểm tra dữ liệu biên (<code className="text-[var(--accent-text)]">null</code>, chuỗi rỗng, giới hạn mảng) ngay dòng đầu tiên của hàm.
              </p>
              <p>
                2. Chú ý annotation <code className="text-[var(--accent-text)]">@Override</code>, đóng luồng bằng <code className="text-[var(--accent-text)]">try-with-resources</code> và định dạng <code className="text-[var(--accent-text)]">toString()</code> chính xác từng ký tự.
              </p>
              {relatedSlot ? (
                <Link
                  to={`/pro192/${stageFileToSlug(relatedSlot.file)}?slot=${relatedSlot.slot}`}
                  className="inline-block text-[var(--info)] underline"
                >
                  Mở đầy đủ Slot {relatedSlot.slot} →
                </Link>
              ) : (
                <Link to="/pro192" className="inline-block text-[var(--info)] underline">
                  Mở giáo trình PRO192 →
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* Center Pane: Code Editor with Line Gutter / Diff View + Bottom Console */}
        <div
          className={[
            'flex flex-col border-b border-[var(--border-default)] bg-[var(--bg-code)] lg:border-b-0',
            showAiPane ? 'lg:col-span-6 lg:border-r' : 'lg:col-span-9',
          ].join(' ')}
        >
          {/* File Tabs & Diff Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-xs">
            <SlidingPillTabs
              options={fileTabs}
              value={activeFile}
              onChange={setActiveFile}
              ariaLabel="Chọn tệp mã nguồn Java"
              tone="neutral"
              className="font-mono"
            />

            <button
              type="button"
              onClick={() => setShowDiff((d) => !d)}
              className="min-h-[36px] rounded-md border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent-text)] hover:opacity-90"
            >
              ⚡ {showDiff ? 'Quay lại Code Editor' : 'So sánh Bản Tối ưu (Diff)'}
            </button>
          </div>

          {!showDiff ? (
            <div className="flex min-h-[270px] flex-1 overflow-hidden bg-[var(--bg-code)]">
              <div
                ref={gutterRef}
                aria-hidden="true"
                data-testid="code-line-gutter"
                className="select-none overflow-hidden border-r border-[var(--border-default)] bg-[var(--bg-surface-muted)]/60 px-3 py-4 text-right font-mono text-xs leading-relaxed text-[var(--text-dim)] tabular-nums"
              >
                {Array.from({ length: activeLinesCount }, (_, idx) => (
                  <div key={idx + 1}>{idx + 1}</div>
                ))}
              </div>
              <textarea
                aria-label="Trình soạn thảo mã nguồn Java"
                spellCheck={false}
                rows={14}
                value={activeCode}
                onChange={(e) => updateCodeAndScheduleDraft(activeFile, e.target.value)}
                onBlur={flushLatestDraft}
                onScroll={(e) => {
                  if (gutterRef.current) {
                    gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const nextVal =
                      el.value.substring(0, start) + '    ' + el.value.substring(end);
                    updateCodeAndScheduleDraft(activeFile, nextVal);
                    window.requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 4;
                    });
                  }
                }}
                className="h-full min-h-[270px] w-full flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-xs leading-relaxed text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid min-h-[270px] flex-1 grid-cols-1 gap-3 overflow-auto p-4 text-xs md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--bg-surface)] p-3">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                  <span className="font-semibold text-[var(--danger-text)]">
                    Code hiện tại
                  </span>
                  <span className="font-mono tabular-nums text-[var(--text-dim)]">
                    {currentLineCount} dòng
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[var(--text-secondary)]">
                  {mainCode}
                </pre>
              </div>

              <div className="flex flex-col justify-between space-y-2 rounded-lg border border-[var(--success)]/50 bg-[var(--bg-surface)] p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                    <span className="font-semibold text-[var(--success-text)]">
                      Gợi ý Clean Code (Tối ưu)
                    </span>
                    <span className="font-mono tabular-nums text-[var(--text-dim)]">
                      {cleanLineCount} dòng
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[var(--text-primary)]">
                    {activePe.cleanCode}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCleanCode}
                  className="min-h-[38px] w-full rounded-lg bg-[var(--success)] py-2 font-bold text-[#1C1917] transition-opacity hover:opacity-90"
                >
                  ✔ Áp dụng đoạn code tối ưu này
                </button>
              </div>
            </div>
          )}

          {/* Bottom Console + Static Pattern Evaluator Clarity */}
          <div className="space-y-2 border-t border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)]">
                  Console &amp; Kết quả Test PE
                </span>
                <span
                  title="Sandbox trình duyệt chấm bằng Static Pattern Evaluator (phân tích cú pháp & trường hợp biên). Hãy chạy thêm bằng JDK/NetBeans trên máy để biên dịch JVM thật."
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]"
                >
                  Static Pattern Evaluator
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono ${statusColorCls}`}>{consoleStatus}</span>
                <CopyCodeButton
                  code={javacCommand}
                  label="Copy lệnh javac"
                  copiedLabel="Đã chép"
                  ariaLabel="Sao chép lệnh biên dịch javac local"
                  onCopied={() =>
                    pushToast({
                      title: 'Đã chép lệnh javac local',
                      description: javacCommand,
                      tone: 'success',
                    })
                  }
                />
              </div>
            </div>
            <pre className="min-h-[76px] whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 font-mono text-xs text-[var(--text-muted)]">
              {consoleOutput}
            </pre>
            <p className="text-xs text-[var(--text-dim)]">
              Lưu ý: Sandbox dùng <strong>Static Pattern Evaluator</strong> để kiểm tra lỗi biên &amp; Clean Code; dùng nút <code className="text-[var(--text-muted)]">Copy lệnh javac</code> khi muốn biên dịch bằng JDK thật trên NetBeans/Terminal.
            </p>
          </div>
        </div>

        {/* Right Pane: AI Code Mentor (#086 Streaming Answer) */}
        {showAiPane && (
          <aside className="flex flex-col justify-between gap-3 bg-[var(--bg-surface)] p-4 text-xs lg:col-span-3">
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                <span className="flex items-center gap-1.5 font-bold text-[var(--info-text)]">
                  ✨ AI Code Mentor
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiPane(false)}
                  aria-label="Ẩn AI Code Mentor"
                  className="rounded border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {diagnosisCards.map((card) => {
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
                            onClick={() =>
                              setRevealedHints((prev) => ({
                                ...prev,
                                [card.id]: !prev[card.id],
                              }))
                            }
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
                          onClick={() => setShowDiff(true)}
                          className="min-h-[34px] w-full rounded-lg bg-[var(--accent)] py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                        >
                          So sánh Trước / Sau (Diff)
                        </button>
                      )}
                    </div>
                  );
                })}

                {chatHistory.map((msg) => (
                  <StreamingAiBubble key={msg.id} prompt={msg.prompt} reply={msg.reply} />
                ))}

                {aiBusy && pendingPrompt && (
                  <StreamingAiBubble prompt={pendingPrompt} thinking />
                )}
              </div>
            </div>

            {/* Ask AI Input */}
            <div className="space-y-2 border-t border-[var(--border-default)] pt-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => void sendAiPrompt('Giải thích đoạn code này giúp em')}
                  className="min-h-[32px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Giải thích code
                </button>
                <button
                  type="button"
                  onClick={() => void sendAiPrompt('Làm sao tối ưu ngắn hơn nữa?')}
                  className="min-h-[32px] rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cách tối ưu?
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendAiPrompt(chatInput);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi AI về code của bạn..."
                  className="min-h-[36px] flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={aiBusy}
                  className="min-h-[36px] rounded-lg bg-[var(--info)] px-3 py-1.5 font-bold text-[#1C1917] disabled:opacity-50"
                >
                  {aiBusy ? '...' : 'Gửi'}
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
