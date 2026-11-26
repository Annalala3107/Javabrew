// Lucian UX/UI Prompt #127 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#127
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { computeLineDiff } from '../utils/lineDiff';
import './lucian/lucian-127.css';

interface CodeDiffViewProps {
  mainFileName: string;
  currentMain: string;
  cleanMain: string;
  entityFileName?: string;
  currentEntity?: string;
  cleanEntity?: string;
  onApplyCleanCode: () => void;
  onRestoreEntityCode?: () => void;
}

const JAVA_KEYWORDS = new Set([
  'public',
  'private',
  'protected',
  'class',
  'interface',
  'extends',
  'implements',
  'return',
  'if',
  'else',
  'for',
  'while',
  'new',
  'super',
  'this',
  'void',
  'int',
  'double',
  'boolean',
  'char',
  'long',
  'null',
  'true',
  'false',
  'import',
]);

function highlightJavaLine(line: string): ReactNode {
  if (!line) return '\u00A0';
  const commentIdx = line.indexOf('//');
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

  const tokenRegex = /("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/g;
  const nodes: ReactNode[] = [];
  let lastIdx = 0;
  let k = 0;

  for (const m of codePart.matchAll(tokenRegex)) {
    const idx = m.index ?? 0;
    if (idx > lastIdx) {
      nodes.push(<Fragment key={`t-${k++}`}>{codePart.slice(lastIdx, idx)}</Fragment>);
    }
    const tok = m[0];
    if (tok.startsWith('"') || tok.startsWith("'")) {
      nodes.push(
        <span key={`s-${k++}`} className="text-[var(--success-text)]">
          {tok}
        </span>
      );
    } else if (/^\d/.test(tok)) {
      nodes.push(
        <span key={`n-${k++}`} className="text-[var(--accent-text)]">
          {tok}
        </span>
      );
    } else if (JAVA_KEYWORDS.has(tok)) {
      nodes.push(
        <span key={`k-${k++}`} className="font-semibold text-[var(--accent-text)]">
          {tok}
        </span>
      );
    } else if (/^[A-Z]/.test(tok)) {
      nodes.push(
        <span key={`c-${k++}`} className="text-[var(--info-text)]">
          {tok}
        </span>
      );
    } else {
      nodes.push(<Fragment key={`i-${k++}`}>{tok}</Fragment>);
    }
    lastIdx = idx + tok.length;
  }

  if (lastIdx < codePart.length) {
    nodes.push(<Fragment key={`r-${k++}`}>{codePart.slice(lastIdx)}</Fragment>);
  }
  if (commentPart) {
    nodes.push(
      <span key={`cm-${k++}`} className="italic text-[var(--text-dim)]">
        {commentPart}
      </span>
    );
  }

  return nodes;
}

export function CodeDiffView({
  mainFileName,
  currentMain,
  cleanMain,
  entityFileName,
  currentEntity = '',
  cleanEntity = '',
  onApplyCleanCode,
  onRestoreEntityCode,
}: CodeDiffViewProps) {
  const hasEntity = Boolean(entityFileName && cleanEntity);
  const [selectedFile, setSelectedFile] = useState<'main' | 'entity'>('main');
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [confirmApply, setConfirmApply] = useState(false);

  const showingEntity = hasEntity && selectedFile === 'entity';
  const beforeText = showingEntity ? currentEntity : currentMain;
  const afterText = showingEntity ? cleanEntity : cleanMain;
  const activeName = showingEntity ? entityFileName! : mainFileName;

  const diff = useMemo(() => computeLineDiff(beforeText, afterText), [beforeText, afterText]);
  const currentLines = useMemo(() => beforeText.replace(/\r\n/g, '\n').split('\n'), [beforeText]);
  const targetLines = useMemo(() => afterText.replace(/\r\n/g, '\n').split('\n'), [afterText]);
  const isIdentical = diff.added === 0 && diff.removed === 0;

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-auto p-3.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[var(--text-primary)]">So sánh từng dòng (Diff)</span>
          <div role="tablist" aria-label="Tệp đang so sánh" className="inline-flex gap-1">
            <button
              type="button"
              role="tab"
              aria-selected={!showingEntity}
              onClick={() => {
                setSelectedFile('main');
                setConfirmApply(false);
              }}
              className={[
                'min-h-[32px] rounded-md border px-2.5 py-1 font-mono text-xs font-semibold',
                !showingEntity
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]',
              ].join(' ')}
            >
              {mainFileName}
            </button>
            {hasEntity && (
              <button
                type="button"
                role="tab"
                aria-selected={showingEntity}
                onClick={() => {
                  setSelectedFile('entity');
                  setConfirmApply(false);
                }}
                className={[
                  'min-h-[32px] rounded-md border px-2.5 py-1 font-mono text-xs font-semibold',
                  showingEntity
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]',
                ].join(' ')}
              >
                {entityFileName}
              </button>
            )}
          </div>
          <span className="font-mono text-xs font-semibold text-[var(--success-text)]">
            +{diff.added}
          </span>
          <span className="font-mono text-xs font-semibold text-[var(--danger-text)]">
            −{diff.removed}
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5">
          {(['unified', 'split'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              aria-pressed={viewMode === m}
              className={[
                'min-h-[30px] rounded-md px-2.5 py-1 text-xs font-semibold',
                viewMode === m
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {m === 'unified' ? 'Unified' : '2 Cột'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'unified' ? (
        <div className="ux u127 overflow-hidden border border-[var(--border-default)]">
          <div className="code" aria-label={`Diff ${activeName}`}>
            {diff.lines.map((line, idx) => (
              <div
                key={`${idx}-${line.type}`}
                className={[
                  'line',
                  line.type === 'remove' ? 'minus' : line.type === 'add' ? 'plus' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="ln">{line.oldLine ?? ''}</span>
                <span className="ln">{line.newLine ?? ''}</span>
                <span className="sig" aria-hidden="true">
                  {line.type === 'remove' ? '−' : line.type === 'add' ? '+' : ' '}
                </span>
                <span className="txt">{highlightJavaLine(line.text)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="overflow-auto rounded-lg border border-[var(--danger)]/35 bg-[var(--bg-surface)] p-3">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
              <span className="font-semibold text-[var(--danger-text)]">
                Code hiện tại ({activeName})
              </span>
              <span className="font-mono text-xs text-[var(--text-dim)]">
                {currentLines.length} dòng
              </span>
            </div>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[var(--text-secondary)]">
              {currentLines.map((l, idx) => (
                <div key={idx}>{highlightJavaLine(l)}</div>
              ))}
            </pre>
          </div>

          <div className="overflow-auto rounded-lg border border-[var(--success)]/40 bg-[var(--bg-surface)] p-3">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
              <span className="font-semibold text-[var(--success-text)]">
                Bản chuẩn / Tối ưu ({activeName})
              </span>
              <span className="font-mono text-xs text-[var(--text-dim)]">
                {targetLines.length} dòng
              </span>
            </div>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[var(--text-primary)]">
              {targetLines.map((l, idx) => (
                <div key={idx}>{highlightJavaLine(l)}</div>
              ))}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
        {showingEntity ? (
          isIdentical ? (
            <span className="font-medium text-[var(--success-text)]">
              ✔ Tệp {entityFileName} khớp với bản chuẩn đề bài.
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onRestoreEntityCode?.()}
              className="min-h-[38px] rounded-lg border border-[var(--warning)]/50 bg-[var(--warning-soft)] px-4 py-2 font-bold text-[var(--accent-text)] hover:opacity-90"
            >
              Khôi phục {entityFileName} gốc đề bài
            </button>
          )
        ) : confirmApply ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-[var(--accent-text)]">
              Áp dụng code tối ưu sẽ thay thế nháp hiện tại (có nút Hoàn tác nếu đổi ý):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmApply(false);
                  onApplyCleanCode();
                }}
                className="min-h-[38px] rounded-lg bg-[var(--success)] px-4 py-2 font-bold text-[#1C1917] hover:opacity-90"
              >
                Xác nhận ghi đè code hiện tại
              </button>
              <button
                type="button"
                onClick={() => setConfirmApply(false)}
                className="min-h-[38px] rounded-lg border border-[var(--border-default)] px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isIdentical}
            onClick={() => setConfirmApply(true)}
            className="min-h-[38px] w-full rounded-lg bg-[var(--success)] py-2 font-bold text-[#1C1917] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isIdentical
              ? '✔ Code của bạn đã khớp với bản Clean Code'
              : '✔ Áp dụng đoạn code tối ưu này'}
          </button>
        )}
      </div>
    </div>
  );
}
