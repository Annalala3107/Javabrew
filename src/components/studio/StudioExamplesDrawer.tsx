import { useMemo, useState } from 'react';
import { PLAYGROUND_TEMPLATES, type PlaygroundTemplateCategory } from '../../utils/javaPlayground';

const EXAMPLE_CATEGORIES: Array<'Tất cả' | PlaygroundTemplateCategory> = [
  'Tất cả',
  'Cơ bản',
  'OOP',
  'Collections',
  'Exception & File I/O',
  'Thực chiến PE',
];

interface StudioExamplesDrawerProps {
  activeExampleId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

export function StudioExamplesDrawer({
  activeExampleId,
  onSelectTemplate,
  onClose,
}: StudioExamplesDrawerProps) {
  const [exampleCategory, setExampleCategory] = useState<'Tất cả' | PlaygroundTemplateCategory>('Tất cả');
  const [exampleSearch, setExampleSearch] = useState('');

  const filteredTemplates = useMemo(() => {
    const q = exampleSearch.trim().toLowerCase();
    return PLAYGROUND_TEMPLATES.filter((t) => {
      if (exampleCategory !== 'Tất cả' && t.category !== exampleCategory) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.slotRef.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [exampleCategory, exampleSearch]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            JavaBrew Live Lab ({PLAYGROUND_TEMPLATES.length} mẫu)
          </div>
          <p className="text-[var(--text-muted)]">Chọn mẫu để nạp vào Split-Pane</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng danh sách mẫu"
          className="rounded border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ✕
        </button>
      </div>

      <input
        type="search"
        value={exampleSearch}
        onChange={(e) => setExampleSearch(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-label="Tìm mẫu Java theo tên hoặc Slot"
        placeholder="Tìm theo Slot (vd: Slot 09) hoặc từ khóa…"
        className="min-h-[38px] sm:min-h-[34px] w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      />

      <div className="flex flex-wrap gap-1">
        {EXAMPLE_CATEGORIES.map((cat) => {
          const active = exampleCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setExampleCategory(cat)}
              className={[
                'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="max-h-[480px] space-y-1.5 overflow-y-auto overscroll-contain pr-1">
        {filteredTemplates.length === 0 ? (
          <div className="space-y-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-center text-[var(--text-muted)]">
            <div>Không tìm thấy mẫu khớp "{exampleSearch}".</div>
            <button
              type="button"
              onClick={() => {
                setExampleSearch('');
                setExampleCategory('Tất cả');
              }}
              className="rounded border border-[var(--border-default)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-text)] hover:border-[var(--accent)]"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          filteredTemplates.map((tpl) => {
            const isSelected = activeExampleId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={[
                  'w-full rounded-lg border p-2.5 text-left transition-colors',
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-canvas)] hover:border-[var(--accent)]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-[var(--text-primary)]">{tpl.title}</span>
                  <span className="shrink-0 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent-text)]">
                    {tpl.slotRef}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">{tpl.subtitle}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
