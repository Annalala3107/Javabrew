import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Download,
  ExternalLink,
  NotebookPen,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { SlidingPillTabs } from '../components/lucian/SlidingPillTabs';
import { useApp } from '../context/AppContext';
import {
  buildNotesMarkdownExport,
  resolveStudyItem,
  type ResolvedStudyItem,
} from '../utils/studyNotebook';
import { normalizeSearchText } from '../utils/text';

type NotebookTab = 'notes' | 'bookmarks' | 'mistakes';
type SourceFilter = 'all' | 'pro192' | 'docs';
type MistakeFilter = 'unresolved' | 'resolved' | 'all';

interface ResolvedNoteRow extends ResolvedStudyItem {
  note: string;
}

export function NotesHubPage() {
  const {
    progress,
    pro192,
    navigation,
    lang,
    saveNote,
    deleteNote,
    toggleBookmark,
    toggleMistakeResolved,
    deleteMistake,
    pushToast,
  } = useApp();

  const [tab, setTab] = useState<NotebookTab>('notes');
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [mistakeFilter, setMistakeFilter] = useState<MistakeFilter>('unresolved');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  const noteRows = useMemo<ResolvedNoteRow[]>(() => {
    return Object.entries(progress.notes)
      .filter(([, text]) => Boolean(text && text.trim()))
      .map(([key, note]) => ({
        ...resolveStudyItem(
          key,
          pro192,
          navigation,
          lang,
          progress.completedSlots,
          progress.completedArticles
        ),
        note,
      }));
  }, [progress.notes, progress.completedSlots, progress.completedArticles, pro192, navigation, lang]);

  const bookmarkRows = useMemo<ResolvedStudyItem[]>(() => {
    return progress.bookmarks.map((key) =>
      resolveStudyItem(
        key,
        pro192,
        navigation,
        lang,
        progress.completedSlots,
        progress.completedArticles
      )
    );
  }, [progress.bookmarks, progress.completedSlots, progress.completedArticles, pro192, navigation, lang]);

  const normQuery = normalizeSearchText(query);

  const filteredNotes = useMemo(() => {
    return noteRows.filter((row) => {
      if (sourceFilter !== 'all' && row.kind !== sourceFilter) return false;
      if (!normQuery) return true;
      return (
        normalizeSearchText(row.title).includes(normQuery) ||
        normalizeSearchText(row.note).includes(normQuery) ||
        normalizeSearchText(row.badge).includes(normQuery)
      );
    });
  }, [noteRows, sourceFilter, normQuery]);

  const filteredBookmarks = useMemo(() => {
    return bookmarkRows.filter((row) => {
      if (sourceFilter !== 'all' && row.kind !== sourceFilter) return false;
      if (!normQuery) return true;
      return (
        normalizeSearchText(row.title).includes(normQuery) ||
        normalizeSearchText(row.badge).includes(normQuery)
      );
    });
  }, [bookmarkRows, sourceFilter, normQuery]);

  const filteredMistakes = useMemo(() => {
    return progress.mistakes.filter((m) => {
      if (mistakeFilter === 'unresolved' && m.resolved) return false;
      if (mistakeFilter === 'resolved' && !m.resolved) return false;
      if (!normQuery) return true;
      return (
        normalizeSearchText(m.title).includes(normQuery) ||
        normalizeSearchText(m.detail).includes(normQuery)
      );
    });
  }, [progress.mistakes, mistakeFilter, normQuery]);

  const peById = useMemo(() => {
    const map = new Map<number, { code: string; title: string }>();
    if (pro192?.peChallenges) {
      for (const pe of pro192.peChallenges) {
        map.set(pe.id, { code: pe.code, title: pe.title });
      }
    }
    return map;
  }, [pro192]);

  const handleExportMarkdown = () => {
    const md = buildNotesMarkdownExport(noteRows);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `javabrew-so-tay-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast({
      title: 'Đã xuất Sổ tay Markdown (.md)',
      description: `${noteRows.length} ghi chú đã sẵn sàng để ôn thi offline.`,
      tone: 'success',
    });
  };

  const tabOptions = [
    { id: 'notes' as const, label: `📝 Ghi chú (${noteRows.length})` },
    { id: 'bookmarks' as const, label: `🔖 Đã lưu (${bookmarkRows.length})` },
    { id: 'mistakes' as const, label: `⚠️ Lỗi cần tránh (${progress.mistakes.length})` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]">
            <NotebookPen className="h-4 w-4" aria-hidden="true" />
            <span>Sổ tay Học tập JavaBrew (Lưu cục bộ)</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Ghi chú, Bookmark &amp; Lỗi hay mắc
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Tổng hợp toàn bộ ghi chú cá nhân qua 30 Slots PRO192 &amp; 354 bài JavaGuide để ôn tập nước rút trước kỳ thi FE/PE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            disabled={noteRows.length === 0}
            onClick={handleExportMarkdown}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>⬇ Xuất Markdown (.md)</span>
          </button>
          <Link
            to="/pro192"
            className="inline-flex min-h-[38px] items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-1.5 font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
          >
            ← Quay lại học bài
          </Link>
        </div>
      </div>

      {/* Tabs + Search + Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SlidingPillTabs
          options={tabOptions}
          value={tab}
          onChange={setTab}
          ariaLabel="Chuyển mục Sổ tay học tập"
          tone="accent"
        />

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--text-dim)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm trong Sổ tay học tập"
              placeholder="Tìm tiêu đề hoặc nội dung…"
              className="min-h-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
          </label>

          {tab === 'mistakes' ? (
            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5">
              {(
                [
                  { id: 'unresolved', label: 'Chưa khắc phục' },
                  { id: 'resolved', label: 'Đã khắc phục' },
                  { id: 'all', label: 'Tất cả' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMistakeFilter(opt.id)}
                  className={[
                    'rounded-md px-2.5 py-1 font-medium transition-colors',
                    mistakeFilter === opt.id
                      ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pro192', label: 'PRO192' },
                  { id: 'docs', label: 'JavaGuide' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSourceFilter(opt.id)}
                  className={[
                    'rounded-md px-2.5 py-1 font-medium transition-colors',
                    sourceFilter === opt.id
                      ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Personal Notes */}
      {tab === 'notes' && (
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-muted)]">
              {noteRows.length === 0
                ? 'Bạn chưa có ghi chú nào. Hãy mở 1 Slot PRO192 hoặc bài JavaGuide và viết vào khung "🗒 Ghi chú cá nhân" ở cuối trang.'
                : 'Không tìm thấy ghi chú nào khớp bộ lọc hiện tại.'}
            </div>
          ) : (
            filteredNotes.map((row) => {
              const isEditing = editingKey === row.key;
              return (
                <article
                  key={row.key}
                  className="space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-block rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[11px] text-[var(--accent-text)]">
                        {row.badge}
                      </span>
                      <h2 className="text-sm font-bold text-[var(--text-primary)]">{row.title}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKey(row.key);
                            setEditingDraft(row.note);
                          }}
                          className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:border-[var(--info)]"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>Sửa</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const prevNote = row.note;
                          deleteNote(row.key);
                          if (editingKey === row.key) setEditingKey(null);
                          pushToast({
                            title: 'Đã xóa ghi chú',
                            description: row.title,
                            tone: 'info',
                            undoLabel: 'Hoàn tác',
                            onUndo: () => saveNote(row.key, prevNote),
                          });
                        }}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-2.5 py-1 font-medium text-[var(--danger-text)]"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        <span>Xóa</span>
                      </button>
                      <Link
                        to={row.route}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 font-semibold text-[var(--accent-text)] hover:border-[var(--accent)]"
                      >
                        <span>Mở bài</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editingDraft}
                        onChange={(e) => setEditingDraft(e.target.value)}
                        aria-label={`Chỉnh sửa ghi chú cho ${row.title}`}
                        className="w-full rounded-lg border border-[var(--info)] bg-[var(--bg-canvas)] p-2.5 text-xs text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            saveNote(row.key, editingDraft);
                            setEditingKey(null);
                            pushToast({
                              title: 'Đã cập nhật ghi chú',
                              description: row.title,
                              tone: 'success',
                            });
                          }}
                          className="rounded-md bg-[var(--accent)] px-3 py-1 font-bold text-[var(--accent-contrast)]"
                        >
                          Lưu thay đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingKey(null)}
                          className="rounded-md border border-[var(--border-default)] px-3 py-1 text-[var(--text-muted)]"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 leading-relaxed text-[var(--text-secondary)]">
                      {row.note}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Bookmarks */}
      {tab === 'bookmarks' && (
        <div className="space-y-3">
          {filteredBookmarks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-muted)]">
              {bookmarkRows.length === 0
                ? 'Bạn chưa đánh dấu Bookmark bài nào. Hãy bấm nút "Lưu bài" trên thanh công cụ khi đọc bài.'
                : 'Không có bài đã lưu nào khớp từ khóa tìm kiếm.'}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredBookmarks.map((row) => (
                <div
                  key={row.key}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[11px] text-[var(--info-text)]">
                        <Bookmark className="h-3 w-3" aria-hidden="true" />
                        <span>{row.badge}</span>
                      </span>
                      {row.completed && (
                        <span className="inline-flex items-center gap-1 rounded border border-[var(--success)]/35 bg-[var(--success-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--success-text)]">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          <span>Đã xong</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">{row.title}</h2>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        toggleBookmark(row.key);
                        pushToast({
                          title: 'Đã bỏ lưu bài học',
                          description: row.title,
                          tone: 'info',
                          undoLabel: 'Hoàn tác',
                          onUndo: () => toggleBookmark(row.key),
                        });
                      }}
                      className="rounded-md border border-[var(--border-default)] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Bỏ lưu
                    </button>
                    <Link
                      to={row.route}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                    >
                      <span>Mở bài →</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mistakes */}
      {tab === 'mistakes' && (
        <div className="space-y-3">
          {filteredMistakes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center text-xs text-[var(--text-muted)]">
              {progress.mistakes.length === 0
                ? 'Chưa ghi nhận lỗi PE nào! Khi bạn gặp lỗi lúc chấm Test Case hoặc Clean Code ở Code Studio, lỗi sẽ tự được lưu tại đây.'
                : 'Không có lỗi nào khớp bộ lọc hiện tại.'}
            </div>
          ) : (
            filteredMistakes.map((m) => {
              const peMeta = peById.get(m.peId);
              return (
                <article
                  key={m.id}
                  className="space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            m.type === 'runtime'
                              ? 'inline-flex items-center gap-1 rounded border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--danger-text)]'
                              : 'inline-flex items-center gap-1 rounded border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--accent-text)]'
                          }
                        >
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          <span>{m.type === 'runtime' ? 'Runtime / Test Fail' : 'Clean Code / JDK 8'}</span>
                        </span>
                        <span className="rounded border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                          {peMeta ? `${peMeta.code}: ${peMeta.title}` : `PE #${m.peId}`}
                        </span>
                        {m.resolved && (
                          <span className="rounded border border-[var(--success)]/35 bg-[var(--success-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--success-text)]">
                            ✔ Đã khắc phục
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-bold text-[var(--text-primary)]">{m.title}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleMistakeResolved(m.id)}
                        className={[
                          'rounded-md border px-2.5 py-1 font-medium',
                          m.resolved
                            ? 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)]'
                            : 'border-[var(--success)]/45 bg-[var(--success-soft)] text-[var(--success-text)]',
                        ].join(' ')}
                      >
                        {m.resolved ? 'Mở lại lỗi' : 'Đánh dấu đã sửa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMistake(m.id)}
                        aria-label={`Xóa lỗi ${m.title}`}
                        className="rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-2 py-1 text-[var(--danger-text)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <Link
                        to={`/studio/${m.peId}`}
                        className="rounded-md bg-[var(--accent)] px-3 py-1 font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                      >
                        Luyện lại PE →
                      </Link>
                    </div>
                  </div>
                  <p className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 leading-relaxed text-[var(--text-secondary)]">
                    {m.detail}
                  </p>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
