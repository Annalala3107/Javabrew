import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, RefreshCw, Sparkles, Timer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { streamStudyCoach, type StudyCoachContext } from '../../services/aiMentorService';
import { readMockExamHistory } from '../../utils/mockExam';
import { findArticleTitle, stageFileToSlug } from '../../utils/text';
import { StreamingAiBubble } from '../lucian/StreamingAiBubble';

const STORAGE_STUDY_COACH = 'javabrew:study_coach_v1';

interface CachedStudyCoachPlan {
  fingerprint: string;
  reply: string;
  badge?: string;
  generatedAt: string;
}

function readCachedStudyCoachPlan(fingerprint: string): CachedStudyCoachPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_STUDY_COACH);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedStudyCoachPlan>;
    if (
      parsed &&
      parsed.fingerprint === fingerprint &&
      typeof parsed.reply === 'string' &&
      parsed.reply.trim().length > 0
    ) {
      return {
        fingerprint: parsed.fingerprint,
        reply: parsed.reply,
        badge: typeof parsed.badge === 'string' ? parsed.badge : undefined,
        generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : '',
      };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeCachedStudyCoachPlan(plan: CachedStudyCoachPlan): void {
  try {
    localStorage.setItem(STORAGE_STUDY_COACH, JSON.stringify(plan));
  } catch {
    // ignore quota errors
  }
}

export function AiStudyCoachCard() {
  const {
    navigation,
    pro192,
    lang,
    progress,
    byokKey,
    aiModel,
    aiServerStatus,
    refreshAiServerStatus,
    updateAiServerQuota,
    setIsSettingsOpen,
  } = useApp();

  const totalSlots = pro192?.course.totalSlots ?? 30;
  const doneSlots = progress.completedSlots.length;
  const totalExercises = pro192?.course.totalExercises ?? 150;
  const doneExercises = progress.solvedExercises.length;
  const totalPe = pro192?.peChallenges?.length ?? pro192?.course.totalPeChallenges ?? 19;
  const passedPeCount = pro192?.peChallenges
    ? pro192.peChallenges.filter((p) => progress.peStatus[p.id] === 'pass').length
    : progress.completedPe.length;

  const nextSlot =
    pro192?.slots.find((s) => !progress.completedSlots.includes(s.slot)) || pro192?.slots[0];

  const unresolvedMistakes = useMemo(
    () => progress.mistakes.filter((m) => !m.resolved),
    [progress.mistakes]
  );

  const mockHistory = useMemo(() => readMockExamHistory(), []);
  const recentMock = mockHistory[0];

  const nextPeChallenge = useMemo(() => {
    const list = pro192?.peChallenges || [];
    return (
      list.find((pe) => progress.peStatus[pe.id] !== 'pass') ||
      list[0] || { id: 1, code: 'PE1-Q1', title: 'Đề PE PRO192' }
    );
  }, [pro192?.peChallenges, progress.peStatus]);

  const peCodeById = useMemo(() => {
    const map = new Map<number, string>();
    for (const pe of pro192?.peChallenges || []) {
      map.set(pe.id, pe.code);
    }
    return map;
  }, [pro192?.peChallenges]);

  const bridgeCandidates = nextSlot?.studyBridge ?? ['java/collection/hashmap-source-code.md'];
  const primaryDocRel =
    bridgeCandidates.find((rel) => !progress.completedArticles.includes(rel)) ||
    bridgeCandidates[0] ||
    'java/collection/hashmap-source-code.md';
  const primaryDocTitle = findArticleTitle(navigation, primaryDocRel, lang);

  const fingerprint = useMemo(
    () =>
      [
        doneSlots,
        doneExercises,
        passedPeCount,
        nextSlot?.slot ?? 0,
        unresolvedMistakes
          .slice(0, 4)
          .map((m) => m.id)
          .join(','),
        recentMock ? `${recentMock.paper}:${recentMock.totalScore}` : 'nomock',
      ].join('|'),
    [doneSlots, doneExercises, passedPeCount, nextSlot?.slot, unresolvedMistakes, recentMock]
  );

  const [cachedPlan, setCachedPlan] = useState<CachedStudyCoachPlan | null>(() =>
    readCachedStudyCoachPlan(fingerprint)
  );
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [liveStreamed, setLiveStreamed] = useState(false);
  const [streamReply, setStreamReply] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorTone, setErrorTone] = useState<'error' | 'offline'>('error');
  const [badgeLabel, setBadgeLabel] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const matched = readCachedStudyCoachPlan(fingerprint);
    setCachedPlan(matched);
  }, [fingerprint]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleGeneratePlan = async () => {
    if (loading || streaming) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setStreaming(false);
    setLiveStreamed(false);
    setStreamReply('');
    setErrorMsg(null);

    const statusSnapshot = aiServerStatus || (await refreshAiServerStatus());
    if (abortRef.current !== controller) return;

    const targetModel = byokKey ? aiModel : statusSnapshot?.defaultModel || aiModel;

    const studyCoachContext: StudyCoachContext = {
      completedSlotsCount: doneSlots,
      totalSlots,
      nextSlot: nextSlot
        ? {
            slot: nextSlot.slot,
            title: nextSlot.title,
            route: `/pro192/${stageFileToSlug(nextSlot.file)}`,
          }
        : undefined,
      solvedExercisesCount: doneExercises,
      totalExercises,
      passedPeCount,
      totalPe,
      unresolvedMistakes: unresolvedMistakes.slice(0, 6).map((m) => ({
        peId: m.peId,
        code: peCodeById.get(m.peId),
        title: m.title,
        detail: m.detail,
      })),
      recentMock: recentMock
        ? {
            paper: recentMock.paper,
            score: recentMock.totalScore,
            maxScore: recentMock.maxScore,
          }
        : undefined,
      suggestedDocs: bridgeCandidates.slice(0, 3).map((rel) => ({
        title: findArticleTitle(navigation, rel, lang),
        route: `/docs/${rel}`,
      })),
    };

    let firstDelta = false;
    try {
      const res = await streamStudyCoach({
        apiKey: byokKey || undefined,
        model: targetModel,
        studyCoachContext,
        signal: controller.signal,
        onMeta: (meta) => {
          if (abortRef.current !== controller) return;
          if (!meta.cached && typeof meta.remaining === 'number') {
            updateAiServerQuota(meta.remaining, meta.limit);
          }
          setBadgeLabel(
            meta.source === 'server'
              ? `${meta.model}${typeof meta.remaining === 'number' ? ` · Còn ${meta.remaining}/${meta.limit} lượt` : ''}`
              : `BYOK · ${meta.model}`
          );
        },
        onDelta: (chunk) => {
          if (abortRef.current !== controller) return;
          firstDelta = true;
          setLoading(false);
          setStreaming(true);
          setLiveStreamed(true);
          setStreamReply((prev) => prev + chunk);
        },
      });

      if (abortRef.current !== controller) return;

      if (res.ok) {
        if (!res.cached && typeof res.remaining === 'number') {
          updateAiServerQuota(res.remaining, res.limit);
        }
        const finalBadge =
          res.source === 'server'
            ? `${res.model}${typeof res.remaining === 'number' ? ` · Còn ${res.remaining}/${res.limit} lượt` : ''}`
            : `BYOK · ${res.model}`;
        const savedPlan: CachedStudyCoachPlan = {
          fingerprint,
          reply: res.reply,
          badge: finalBadge,
          generatedAt: new Date().toISOString(),
        };
        writeCachedStudyCoachPlan(savedPlan);
        setCachedPlan(savedPlan);
        setStreamReply(res.reply);
        setBadgeLabel(finalBadge);
        setLoading(false);
        setStreaming(false);
        setLiveStreamed(firstDelta);
      } else {
        setLoading(false);
        setStreaming(false);
        setErrorMsg(res.errorMessage);
        setErrorTone(res.quotaExceeded ? 'offline' : 'error');
        setBadgeLabel(res.quotaExceeded ? 'Hết lượt hôm nay' : 'AI lỗi');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (abortRef.current !== controller) return;
      setLoading(false);
      setStreaming(false);
      setErrorMsg('Không kết nối được AI Study Coach lúc này. Hãy thử lại sau.');
      setErrorTone('error');
    }
  };

  const activeReply = streamReply || cachedPlan?.reply || '';
  const activeBadge = badgeLabel || cachedPlan?.badge;
  const showBubble = loading || streaming || Boolean(activeReply) || Boolean(errorMsg);
  const topMistake = unresolvedMistakes[0];

  return (
    <section
      data-reveal
      className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Study Coach · Gợi ý lộ trình hôm nay</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--text-dim)]">
            3 đề xuất tức thì dựa trên tiến độ hiện tại · Bấm nút bên phải khi cần AI lập thời khóa biểu 30 phút
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGeneratePlan()}
          disabled={loading || streaming}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-wait disabled:opacity-70"
        >
          {activeReply ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>🔄 Tạo kế hoạch mới</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>✨ Lập kế hoạch 30 phút bằng AI</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Instant Deterministic Recommendations (0 API calls on mount) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link
          to={topMistake ? `/studio/${topMistake.peId}` : `/studio/${nextPeChallenge.id}`}
          className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 transition-colors hover:border-[var(--accent)]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--warning-text)]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {topMistake
                ? `Sửa lỗi PE (${unresolvedMistakes.length} chưa xong)`
                : `Luyện PE (${passedPeCount}/${totalPe} Pass)`}
            </span>
          </div>
          <div className="line-clamp-2 text-xs font-medium text-[var(--text-primary)]">
            {topMistake
              ? `${peCodeById.get(topMistake.peId) || `PE #${topMistake.peId}`}: ${topMistake.title}`
              : `${nextPeChallenge.code}: ${nextPeChallenge.title}`}
          </div>
          <span className="text-[11px] text-[var(--accent-text)]">Mở Code Studio →</span>
        </Link>

        <div className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--info-text)]">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>
              {nextSlot
                ? `Slot kế tiếp (${String(nextSlot.slot).padStart(2, '0')}/${totalSlots})`
                : 'Ôn lại JavaGuide'}
            </span>
          </div>
          <Link
            to={nextSlot ? `/pro192/${stageFileToSlug(nextSlot.file)}` : '/pro192'}
            className="line-clamp-2 text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent-text)]"
          >
            {nextSlot ? nextSlot.title : 'Xem toàn bộ 30 Slots PRO192'}
          </Link>
          <Link
            to={`/docs/${primaryDocRel}`}
            className="truncate text-[11px] text-[var(--text-dim)] hover:text-[var(--info-text)]"
          >
            Đọc kèm: {primaryDocTitle} →
          </Link>
        </div>

        <Link
          to="/pe/mock"
          className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5 transition-colors hover:border-[var(--accent)]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]">
            <Timer className="h-3.5 w-3.5 shrink-0" />
            <span>Phòng thi thử PE (85 phút)</span>
          </div>
          <div className="line-clamp-2 text-xs font-medium text-[var(--text-primary)]">
            {recentMock
              ? `Gần nhất: ${recentMock.paper} · ${recentMock.totalScore}/${recentMock.maxScore}đ`
              : 'Khóa Diff & AI Mentor — rèn áp lực thi thật'}
          </div>
          <span className="text-[11px] text-[var(--accent-text)]">
            {recentMock ? 'Thi thử đề khác →' : 'Bắt đầu thi thử →'}
          </span>
        </Link>
      </div>

      {showBubble && (
        <StreamingAiBubble
          prompt="Lập kế hoạch 30 phút học tập hôm nay"
          reply={errorMsg || activeReply}
          thinking={loading && !streamReply}
          streaming={streaming}
          liveStreamed={liveStreamed}
          tone={errorMsg ? errorTone : 'ai'}
          badgeLabel={activeBadge}
          onAbortStream={() => {
            abortRef.current?.abort();
            abortRef.current = null;
            setLoading(false);
            setStreaming(false);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
    </section>
  );
}
