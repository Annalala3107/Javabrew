import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { evaluatePeCode, type PeDiagnosisCard } from '../utils/peEvaluator';
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

export function CodeStudioPage() {
  const { peId } = useParams<{ peId?: string }>();
  const navigate = useNavigate();
  const { pro192, byokKey, markPeStatus, addMistake, recordVisit } = useApp();

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

  const [mainCode, setMainCode] = useState('');
  const [entityCode, setEntityCode] = useState('');

  const [consoleStatus, setConsoleStatus] = useState('Sẵn sàng biên dịch (Sandbox)');
  const [consoleTone, setConsoleTone] = useState<'muted' | 'amber' | 'green' | 'red'>('muted');
  const [consoleOutput, setConsoleOutput] = useState(
    'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để kiểm tra lỗi.'
  );
  const [diagnosisCards, setDiagnosisCards] = useState<PeDiagnosisCard[]>([]);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  // Compact PE Timer matching real exam pacing
  const suggestedMinutes = useMemo(() => {
    if (!activePe) return 25;
    const m = activePe.meta.match(/(\d+)\s*phút/i);
    return m ? Number(m[1]) : 35;
  }, [activePe]);

  const [secondsLeft, setSecondsLeft] = useState(suggestedMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Reset workspace cleanly when active PE changes
  useEffect(() => {
    if (!activePe) return;
    setMainCode(activePe.starterCode);
    setEntityCode(activePe.entityCode);
    setActiveFile('main');
    setShowDiff(false);
    setConsoleStatus('Sẵn sàng biên dịch (Sandbox)');
    setConsoleTone('muted');
    setConsoleOutput(
      'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để kiểm tra lỗi.'
    );
    setRevealedHints({});
    setChatHistory([]);
    setTimerRunning(false);

    const m = activePe.meta.match(/(\d+)\s*phút/i);
    setSecondsLeft((m ? Number(m[1]) : 35) * 60);

    const initialEval = evaluatePeCode(activePe.id, activePe.starterCode, activePe.entityCode);
    setDiagnosisCards(initialEval.diagnosisCards);

    recordVisit({
      path: `/studio/${activePe.id}`,
      title: `${activePe.code}: ${activePe.title}`,
      kind: 'studio',
      updatedAt: new Date().toISOString(),
    });
  }, [activePe, recordVisit]);

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

  const handleRunCode = () => {
    if (!activePe) return;
    const res = evaluatePeCode(activePe.id, mainCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleOutput(res.consoleRunOutput);
    if (res.allPassed) {
      setConsoleStatus('✔ Biên dịch & Chạy thành công (0.8s)');
      setConsoleTone('green');
    } else {
      setConsoleStatus(`✕ Cảnh báo Runtime / Thiếu điều kiện`);
      setConsoleTone('red');
      if (res.detectedMistake) addMistake(res.detectedMistake);
    }
  };

  const handleSubmitTests = () => {
    if (!activePe) return;
    const res = evaluatePeCode(activePe.id, mainCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleStatus(res.statusText);
    setConsoleOutput(res.consoleTestOutput);
    if (res.allPassed) {
      setConsoleTone('green');
      markPeStatus(activePe.id, 'pass');
    } else {
      setConsoleTone('amber');
      markPeStatus(activePe.id, 'in-progress');
      if (res.detectedMistake) addMistake(res.detectedMistake);
    }
  };

  const handleApplyCleanCode = () => {
    if (!activePe) return;
    setMainCode(activePe.cleanCode);
    setActiveFile('main');
    setShowDiff(false);
    const res = evaluatePeCode(activePe.id, activePe.cleanCode, entityCode);
    setDiagnosisCards(res.diagnosisCards);
    setConsoleStatus('Đã áp dụng bản tối ưu ✨');
    setConsoleTone('green');
    setConsoleOutput(
      'Code đã gọn hơn! Hãy bấm "✔ Chấm Test Case PE" để xác nhận Pass toàn bộ test.'
    );
  };

  const handleReset = () => {
    if (!activePe) return;
    setMainCode(activePe.starterCode);
    setEntityCode(activePe.entityCode);
    setActiveFile('main');
    setShowDiff(false);
    setConsoleStatus('Sẵn sàng biên dịch (Sandbox)');
    setConsoleTone('muted');
    setConsoleOutput(
      'Nhấn "▶ Run Code" để chạy thử hoặc "✔ Chấm Test Case PE" để kiểm tra lỗi.'
    );
    setDiagnosisCards(
      evaluatePeCode(activePe.id, activePe.starterCode, activePe.entityCode).diagnosisCards
    );
  };

  const sendAiPrompt = async (promptText: string) => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || !activePe) return;
    setChatInput('');

    // If BYOK Gemini key is configured, query Gemini; otherwise answer intelligently offline
    if (byokKey) {
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
          return;
        }
      } catch {
        // fall through to offline smart mentor
      }
      setAiBusy(false);
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

  const currentLineCount = mainCode.split(/\r?\n/).length;
  const cleanLineCount = activePe ? activePe.cleanCode.split(/\r?\n/).length : 0;

  if (!activePe) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-xs text-[var(--text-muted)]">
        Đang tải dữ liệu Code Studio...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Studio Sub-toolbar (matches view-m7) */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pe"
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← Kho đề PE
            </Link>

            <select
              aria-label="Chọn đề PE trong Code Studio"
              value={activePe.id}
              onChange={(e) => navigate(`/studio/${e.target.value}`)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 font-bold text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono tabular-nums">
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
                className="ml-1 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunCode}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 py-1.5 font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
            >
              ▶ Run Code
            </button>
            <button
              type="button"
              onClick={handleSubmitTests}
              className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              ✔ Chấm Test Case PE
            </button>
            <button
              type="button"
              onClick={() => setShowAiPane((s) => !s)}
              className="rounded-lg border border-[var(--info)]/40 bg-[var(--info-soft)] px-3 py-1.5 font-medium text-[var(--info-text)] transition-colors hover:opacity-90"
            >
              ✨ AI Review &amp; Tối ưu
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* 3-Pane Studio Workspace (matches view-m7) */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left Pane: Problem & Theory */}
        <aside className="space-y-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-xs lg:col-span-3 lg:border-b-0 lg:border-r">
          <div className="flex gap-1.5 border-b border-[var(--border-default)] pb-2.5">
            <button
              type="button"
              onClick={() => setLeftTab('spec')}
              className={[
                'rounded-md px-2.5 py-1 font-semibold',
                leftTab === 'spec'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Đề bài PE
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('theory')}
              className={[
                'rounded-md px-2.5 py-1 font-semibold',
                leftTab === 'theory'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Lý thuyết nhanh
            </button>
          </div>

          {leftTab === 'spec' ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Yêu cầu bài toán:
              </div>
              <p className="leading-relaxed text-[var(--text-muted)]">{activePe.desc}</p>

              <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
                <div className="font-semibold text-[var(--text-primary)]">Checklist tiêu chí:</div>
                {activePe.checklist.map((c) => (
                  <div key={c} className="text-[var(--text-muted)]">
                    • {c}
                  </div>
                ))}
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

        {/* Center Pane: Code Editor / Diff View + Bottom Console */}
        <div
          className={[
            'flex flex-col border-b border-[var(--border-default)] bg-[var(--bg-code)] lg:border-b-0',
            showAiPane ? 'lg:col-span-6 lg:border-r' : 'lg:col-span-9',
          ].join(' ')}
        >
          {/* File Tabs & Diff Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => setActiveFile('main')}
                className={[
                  'rounded-md px-3 py-1',
                  activeFile === 'main'
                    ? 'border border-[var(--border-strong)] bg-[var(--bg-surface)] font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                Main.java
              </button>
              <button
                type="button"
                onClick={() => setActiveFile('entity')}
                className={[
                  'rounded-md px-3 py-1',
                  activeFile === 'entity'
                    ? 'border border-[var(--border-strong)] bg-[var(--bg-surface)] font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {activePe.entityFileName}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowDiff((d) => !d)}
              className="rounded-md border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[#FDE68A] hover:opacity-90"
            >
              ⚡ {showDiff ? 'Quay lại Code Editor' : 'So sánh Bản Tối ưu (Diff)'}
            </button>
          </div>

          {!showDiff ? (
            <div className="min-h-[260px] flex-1 overflow-auto p-4 font-mono text-xs">
              <textarea
                aria-label="Trình soạn thảo mã nguồn Java"
                spellCheck={false}
                rows={14}
                value={activeFile === 'main' ? mainCode : entityCode}
                onChange={(e) => {
                  if (activeFile === 'main') setMainCode(e.target.value);
                  else setEntityCode(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const nextVal =
                      el.value.substring(0, start) + '    ' + el.value.substring(end);
                    if (activeFile === 'main') setMainCode(nextVal);
                    else setEntityCode(nextVal);
                    window.requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 4;
                    });
                  }
                }}
                className="h-full min-h-[250px] w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid min-h-[260px] flex-1 grid-cols-1 gap-3 overflow-auto p-4 text-xs md:grid-cols-2">
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
                  className="w-full rounded-lg bg-[var(--success)] py-2 font-bold text-[#1C1917] transition-opacity hover:opacity-90"
                >
                  ✔ Áp dụng đoạn code tối ưu này
                </button>
              </div>
            </div>
          )}

          {/* Bottom Console */}
          <div className="space-y-2 border-t border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-primary)]">
                Console &amp; Kết quả Test PE
              </span>
              <span className={`font-mono ${statusColorCls}`}>{consoleStatus}</span>
            </div>
            <pre className="min-h-[76px] whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-code)] p-3 font-mono text-xs text-[var(--text-muted)]">
              {consoleOutput}
            </pre>
          </div>
        </div>

        {/* Right Pane: AI Code Mentor */}
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
                  className="rounded border border-[var(--border-default)] px-2 py-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                        : 'text-[#FDE68A]';
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
                            className="w-full rounded-lg border border-[var(--info)]/40 bg-[var(--bg-canvas)] py-1.5 font-medium text-[var(--info-text)]"
                          >
                            {hintOpen ? 'Ẩn gợi ý (Lớp 2)' : 'Xem gợi ý cách sửa (Lớp 2)'}
                          </button>
                          {hintOpen && (
                            <pre className="whitespace-pre-wrap rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2 font-mono text-[11px] text-[var(--text-primary)]">
                              {card.hintCode}
                            </pre>
                          )}
                        </>
                      )}

                      {card.tone === 'amber' && (
                        <button
                          type="button"
                          onClick={() => setShowDiff(true)}
                          className="w-full rounded-lg bg-[var(--accent)] py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                        >
                          So sánh Trước / Sau (Diff)
                        </button>
                      )}
                    </div>
                  );
                })}

                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className="space-y-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3"
                  >
                    <div className="font-semibold text-[var(--accent-text)]">
                      Bạn hỏi: “{msg.prompt}”
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-[var(--text-secondary)]">
                      {msg.reply}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask AI Input */}
            <div className="space-y-2 border-t border-[var(--border-default)] pt-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => void sendAiPrompt('Giải thích đoạn code này giúp em')}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Giải thích code
                </button>
                <button
                  type="button"
                  onClick={() => void sendAiPrompt('Làm sao tối ưu ngắn hơn nữa?')}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                  className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--info)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={aiBusy}
                  className="rounded-lg bg-[var(--info)] px-3 py-1.5 font-bold text-[#1C1917] disabled:opacity-50"
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
