import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../components/studio/StudioAiMentorPane';
import {
  buildOfflineMentorReply,
  readMentorStyle,
  saveMentorStyle,
  streamAiMentor,
  type AiMentorContext,
  type AiMentorModel,
  type AiMentorStyle,
  type AiServerStatus,
} from '../services/aiMentorService';
import type { JavaDiagnostic, JavaTestCaseResult } from '../services/javaCompilerService';
import type { PeDiagnosisCard } from '../utils/peEvaluator';

interface UseStudioAiMentorOptions {
  playgroundMode: boolean;
  canRunContext: boolean;
  title: string;
  description?: string;
  checklist?: string[];
  activeFileName: string;
  getFilesForAiContext: () => Array<{ name: string; content: string }>;
  diagnostics: JavaDiagnostic[];
  testResults: JavaTestCaseResult[];
  diagnosisCards: PeDiagnosisCard[];
  byokKey: string;
  aiModel: AiMentorModel;
  aiServerStatus: AiServerStatus | null;
  updateAiServerQuota: (remaining: number, limit?: number) => void;
  onOpenAiPane: () => void;
}

export function useStudioAiMentor(options: UseStudioAiMentorOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [chatInput, setChatInput] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [mentorStyle, setMentorStyle] = useState<AiMentorStyle>(readMentorStyle);

  const aiAbortRef = useRef<AbortController | null>(null);
  const lastInteractionIdRef = useRef<string | null>(null);
  const lastAiFilesSigRef = useRef<string>('');

  const abortActiveAi = useCallback(() => {
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
      aiAbortRef.current = null;
    }
    setAiBusy(false);
    setPendingPrompt('');
    setChatHistory((prev) =>
      prev.map((m) =>
        m.streaming
          ? {
              ...m,
              streaming: false,
              reply: m.reply || 'Đã dừng phản hồi AI.',
            }
          : m
      )
    );
  }, []);

  useEffect(() => {
    return () => {
      aiAbortRef.current?.abort();
      aiAbortRef.current = null;
    };
  }, []);

  const clearChat = useCallback(() => {
    abortActiveAi();
    setChatHistory([]);
    lastInteractionIdRef.current = null;
    lastAiFilesSigRef.current = '';
  }, [abortActiveAi]);

  const resetTrackingOnModeSwitch = useCallback(() => {
    abortActiveAi();
    lastInteractionIdRef.current = null;
    lastAiFilesSigRef.current = '';
  }, [abortActiveAi]);

  const resetSessionOnPeChange = useCallback(() => {
    abortActiveAi();
    setChatHistory([]);
    setPendingPrompt('');
    lastInteractionIdRef.current = null;
    lastAiFilesSigRef.current = '';
  }, [abortActiveAi]);

  const handleMentorStyleChange = useCallback((nextStyle: AiMentorStyle) => {
    setMentorStyle(nextStyle);
    saveMentorStyle(nextStyle);
    lastInteractionIdRef.current = null;
  }, []);

  const sendAiPrompt = useCallback(
    async (promptText: string, opts?: { overrideStyle?: AiMentorStyle }) => {
      const cur = optionsRef.current;
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt || aiBusy || !cur.canRunContext) return;
      setChatInput('');

      const filesForContext = cur.getFilesForAiContext();
      const effectiveStyle = opts?.overrideStyle ?? mentorStyle;

      const context: AiMentorContext = {
        mode: cur.playgroundMode ? 'playground' : 'pe',
        title: cur.title,
        description: cur.description,
        checklist: cur.checklist,
        activeFileName: cur.activeFileName,
        files: filesForContext,
        diagnostics: cur.diagnostics,
        testResults: cur.testResults,
        diagnosisHints: cur.diagnosisCards
          .filter((c) => c.tone !== 'green')
          .map((c) => `${c.title}: ${c.description}`),
      };

      const canUseLiveAi = Boolean(cur.byokKey || cur.aiServerStatus?.available);
      if (canUseLiveAi) {
        const filesSig = filesForContext.map((f) => `${f.name}:${f.content}`).join('\n---\n');
        const codeChanged = !lastInteractionIdRef.current || filesSig !== lastAiFilesSigRef.current;
        const targetModel = cur.byokKey ? cur.aiModel : cur.aiServerStatus?.defaultModel || cur.aiModel;
        const initialBadge = cur.byokKey ? targetModel : `AI Tự động · ${targetModel}`;

        aiAbortRef.current?.abort();
        const controller = new AbortController();
        aiAbortRef.current = controller;

        const msgId = `msg-${Date.now()}`;
        setAiBusy(true);
        setPendingPrompt('');
        setChatHistory((prev) => [
          ...prev,
          {
            id: msgId,
            prompt: cleanPrompt,
            reply: '',
            tone: 'ai',
            badgeLabel: initialBadge,
            streaming: true,
            liveStreamed: true,
          },
        ]);

        try {
          const res = await streamAiMentor({
            apiKey: cur.byokKey || undefined,
            model: targetModel,
            mentorStyle: effectiveStyle,
            prompt: cleanPrompt,
            context,
            previousInteractionId: lastInteractionIdRef.current,
            codeChanged,
            signal: controller.signal,
            onMeta: (meta) => {
              if (aiAbortRef.current !== controller) return;
              const badge = meta.source === 'byok' ? meta.model : `AI Tự động · ${meta.model}`;
              setChatHistory((prev) =>
                prev.map((m) => (m.id === msgId ? { ...m, badgeLabel: badge } : m))
              );
              if (typeof meta.remaining === 'number') {
                optionsRef.current.updateAiServerQuota(meta.remaining, meta.limit);
              }
            },
            onDelta: (chunk) => {
              if (aiAbortRef.current !== controller) return;
              setChatHistory((prev) =>
                prev.map((m) => (m.id === msgId ? { ...m, reply: m.reply + chunk } : m))
              );
            },
          });

          if (aiAbortRef.current !== controller) return;

          if (res.ok) {
            if (res.interactionId) {
              lastInteractionIdRef.current = res.interactionId;
            }
            lastAiFilesSigRef.current = filesSig;
            if (typeof res.remaining === 'number') {
              optionsRef.current.updateAiServerQuota(res.remaining, res.limit);
            }
            const finalBadge =
              res.source === 'server' ? `AI Tự động · ${res.model}` : res.model;
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
              optionsRef.current.updateAiServerQuota(0, res.limit);
            } else if (typeof res.remaining === 'number') {
              optionsRef.current.updateAiServerQuota(res.remaining, res.limit);
            }
            setChatHistory((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? {
                      ...m,
                      reply: res.errorMessage,
                      tone: 'error',
                      streaming: false,
                      quotaExceeded: res.quotaExceeded,
                      badgeLabel: res.quotaExceeded
                        ? 'Hết lượt hôm nay'
                        : res.status
                          ? `Lỗi HTTP ${res.status}`
                          : 'Lỗi kết nối',
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
                  ? {
                      ...m,
                      streaming: false,
                      reply: m.reply || 'Đã dừng phản hồi AI.',
                    }
                  : m
              )
            );
          } else {
            setChatHistory((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? {
                      ...m,
                      reply: 'Không thể hoàn tất yêu cầu tới Gemini API. Hãy kiểm tra lại kết nối.',
                      tone: 'error',
                      streaming: false,
                      badgeLabel: 'Lỗi mạng',
                    }
                  : m
              )
            );
          }
        } finally {
          if (aiAbortRef.current === controller) {
            aiAbortRef.current = null;
            setAiBusy(false);
            setPendingPrompt('');
          }
        }
        return;
      }

      const offlineReply = buildOfflineMentorReply(cleanPrompt, context);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          prompt: cleanPrompt,
          reply: offlineReply,
          tone: 'offline',
          badgeLabel: 'Gợi ý cục bộ',
        },
      ]);
    },
    [aiBusy, mentorStyle]
  );

  const handleAskDiagnostic = useCallback(
    (diag: JavaDiagnostic) => {
      const cur = optionsRef.current;
      cur.onOpenAiPane();
      const files = cur.getFilesForAiContext();
      const matchedFile =
        files.find((f) => f.name.toLowerCase() === diag.file.toLowerCase()) || files[0];
      let snippetNote = '';
      if (matchedFile) {
        const lines = matchedFile.content.split(/\r?\n/);
        const start = Math.max(0, diag.line - 6);
        const end = Math.min(lines.length, diag.line + 5);
        const numbered = lines
          .slice(start, end)
          .map((line, i) => `${start + i + 1}: ${line}`)
          .join('\n');
        snippetNote = `\nĐoạn code quanh dòng ${diag.line} trong ${matchedFile.name}:\n\`\`\`java\n${numbered}\n\`\`\``;
      }
      void sendAiPrompt(
        `Giải thích lỗi javac tại ${diag.file}:${diag.line}:${diag.column}: "${diag.message}" và chỉ cách sửa.${snippetNote}`
      );
    },
    [sendAiPrompt]
  );

  const handleAskFailedTest = useCallback(
    (tc: JavaTestCaseResult) => {
      optionsRef.current.onOpenAiPane();
      const details = [
        `Tại sao ${tc.id} (${tc.name}) bị FAIL?`,
        tc.expected ? `- Kỳ vọng: ${tc.expected}` : '',
        tc.actual ? `- Thực tế: ${tc.actual}` : '',
        tc.error ? `- Ghi chú: ${tc.error}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      void sendAiPrompt(details);
    },
    [sendAiPrompt]
  );

  const handleAskCleanCodeReview = useCallback(() => {
    optionsRef.current.onOpenAiPane();
    void sendAiPrompt(
      'Hãy chấm điểm Clean Code theo tiêu chí thi PE PRO192 (tương thích JDK 8, bỏ package, xử lý null/chuỗi rỗng, chuẩn định dạng toString/số thực và đặt tên biến/hàm) và chỉ ra chỗ cần cải thiện.',
      { overrideStyle: 'deep' }
    );
  }, [sendAiPrompt]);

  return {
    chatInput,
    setChatInput,
    pendingPrompt,
    chatHistory,
    aiBusy,
    mentorStyle,
    abortActiveAi,
    clearChat,
    resetTrackingOnModeSwitch,
    resetSessionOnPeChange,
    handleMentorStyleChange,
    sendAiPrompt,
    handleAskDiagnostic,
    handleAskFailedTest,
    handleAskCleanCodeReview,
  };
}
