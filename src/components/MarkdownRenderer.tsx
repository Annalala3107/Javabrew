import {
  Children,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  FileText,
  Info,
  Lightbulb,
  Play,
  ShieldAlert,
  X,
  ZoomIn,
} from 'lucide-react';
import { CopyCodeButton } from './lucian/CopyCodeButton';
import { useApp } from '../context/AppContext';
import { prepareJavaPlaygroundFiles, savePlaygroundWorkspace } from '../utils/javaPlayground';
import { resolveMarkdownHref } from '../utils/markdown';

interface MarkdownRendererProps {
  content: string;
  currentRel: string;
}

function extractNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }
  return '';
}

function CodeBlock({
  children,
  currentRel,
}: {
  children?: ReactNode;
  currentRel: string;
}) {
  const { pushToast } = useApp();
  const navigate = useNavigate();

  let language = 'text';
  const childArray = Children.toArray(children);
  const firstChild = childArray[0];
  if (isValidElement<{ className?: string }>(firstChild)) {
    const cls = firstChild.props.className || '';
    const match = cls.match(/language-([a-zA-Z0-9_+-]+)/);
    if (match) language = match[1];
  }

  const rawCode = extractNodeText(children).replace(/\n$/, '');
  const isRunnableJava = language.toLowerCase() === 'java' && rawCode.trim().length >= 8;

  const handleTryInPlayground = () => {
    const prepared = prepareJavaPlaygroundFiles(rawCode, currentRel);
    const nextState = {
      files: prepared.files,
      activeFileId: prepared.files[0].id,
      stdin: '',
      sourceLabel: currentRel,
    };
    savePlaygroundWorkspace(nextState);
    pushToast({
      title: 'Đã nạp code vào Java Playground',
      description: prepared.note,
      tone: 'info',
    });
    navigate('/studio/playground', {
      state: { playgroundImport: nextState, note: prepared.note },
    });
  };

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-code)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-3.5 py-1.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {language}
        </span>
        <div className="flex items-center gap-2">
          {isRunnableJava && (
            <button
              type="button"
              onClick={handleTryInPlayground}
              aria-label="Chạy thử đoạn mã Java trong Code Studio Playground"
              className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-text)] transition-opacity hover:opacity-90"
            >
              <Play className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Chạy thử</span>
            </button>
          )}
          <CopyCodeButton
            code={rawCode}
            label="Sao chép"
            copiedLabel="Đã chép"
            ariaLabel="Sao chép đoạn mã"
            onCopied={() =>
              pushToast({
                title: 'Đã sao chép đoạn mã',
                tone: 'success',
              })
            }
          />
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-[13.5px] leading-relaxed">{children}</pre>
    </div>
  );
}

const CALLOUT_STYLES: Record<
  string,
  { bg: string; border: string; icon: typeof Info; color: string }
> = {
  TIP: {
    bg: 'var(--success-soft)',
    border: 'rgba(21, 128, 61, 0.3)',
    icon: Lightbulb,
    color: 'var(--success)',
  },
  WARNING: {
    bg: 'var(--warning-soft)',
    border: 'rgba(180, 83, 9, 0.35)',
    icon: AlertTriangle,
    color: 'var(--warning)',
  },
  DANGER: {
    bg: 'var(--danger-soft)',
    border: 'rgba(185, 28, 28, 0.35)',
    icon: ShieldAlert,
    color: 'var(--danger)',
  },
  INFO: {
    bg: 'var(--info-soft)',
    border: 'rgba(3, 105, 161, 0.3)',
    icon: Info,
    color: 'var(--info)',
  },
  NOTE: {
    bg: 'var(--info-soft)',
    border: 'rgba(3, 105, 161, 0.3)',
    icon: BookOpen,
    color: 'var(--info)',
  },
};

export function MarkdownRenderer({ content, currentRel }: MarkdownRendererProps) {
  const { openPdfPreview } = useApp();
  const [zoomedImg, setZoomedImg] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!zoomedImg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomedImg(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomedImg]);

  return (
    <>
      <div className="jb-prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
          components={{
            pre({ children }) {
              return <CodeBlock currentRel={currentRel}>{children}</CodeBlock>;
            },
            table({ children }) {
              return (
                <div className="my-5 overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
                  <table className="w-full border-collapse text-left text-sm">{children}</table>
                </div>
              );
            },
            thead({ children }) {
              return (
                <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-muted)]">
                  {children}
                </thead>
              );
            },
            th({ children }) {
              return (
                <th className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="border-t border-[var(--border-default)] px-3.5 py-2.5 align-top text-[var(--text-primary)]">
                  {children}
                </td>
              );
            },
            a({ href, children }) {
              const resolved = resolveMarkdownHref(currentRel, href || '');
              if (resolved.kind === 'internal') {
                return <Link to={resolved.target}>{children}</Link>;
              }
              if (resolved.kind === 'media') {
                if (resolved.target.toLowerCase().endsWith('.pdf')) {
                  return (
                    <button
                      type="button"
                      onClick={() =>
                        openPdfPreview({
                          title: extractNodeText(children) || 'Tài liệu PDF',
                          pdfUrl: resolved.target,
                        })
                      }
                      className="inline-flex items-center gap-1 font-medium text-[var(--accent-text)] underline underline-offset-3 hover:text-[var(--accent-hover)]"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>{children}</span>
                    </button>
                  );
                }
                return (
                  <a href={resolved.target} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              }
              if (resolved.kind === 'hash') {
                return <a href={resolved.target}>{children}</a>;
              }
              return (
                <a
                  href={resolved.target}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <span>{children}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                </a>
              );
            },
            img({ src, alt }) {
              if (!src) return null;
              const safeAlt = alt || '';
              return (
                <figure className="my-5">
                  <button
                    type="button"
                    onClick={() => setZoomedImg({ src, alt: safeAlt })}
                    aria-label={`Phóng to hình ảnh: ${safeAlt || 'Sơ đồ minh họa'}`}
                    className="group relative block overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-left"
                  >
                    <img
                      src={src}
                      alt={safeAlt}
                      loading="lazy"
                      className="max-h-[480px] w-auto max-w-full object-contain"
                    />
                    <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)]/90 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100">
                      <ZoomIn className="h-3 w-3" />
                      <span>Phóng to</span>
                    </span>
                  </button>
                  {safeAlt && (
                    <figcaption className="mt-1.5 text-xs text-[var(--text-muted)]">
                      {safeAlt}
                    </figcaption>
                  )}
                </figure>
              );
            },
            blockquote({ children }) {
              const rawText = extractNodeText(children).trim();
              const calloutMatch = rawText.match(/^\[!(TIP|WARNING|INFO|DANGER|NOTE)\]\s*([^\n]*)/);
              if (calloutMatch) {
                const kind = calloutMatch[1];
                const style = CALLOUT_STYLES[kind] || CALLOUT_STYLES.INFO;
                const Icon = style.icon;
                const childArr = Children.toArray(children);

                return (
                  <div
                    role="note"
                    style={{
                      backgroundColor: style.bg,
                      borderColor: style.border,
                    }}
                    className="my-5 rounded-xl border p-4"
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: style.color }}
                      />
                      <div className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--text-primary)]">
                        {childArr.map((c, idx) => {
                          if (idx === 0 && isValidElement<{ children?: ReactNode }>(c)) {
                            const txt = extractNodeText(c.props.children);
                            const titleMatch = txt.match(
                              /^\[!(TIP|WARNING|INFO|DANGER|NOTE)\]\s*(.*)$/s
                            );
                            if (titleMatch) {
                              const [firstLine, ...restLines] = titleMatch[2].split('\n');
                              return (
                                <div key={idx} className="mb-1.5">
                                  <div
                                    className="font-semibold"
                                    style={{ color: style.color }}
                                  >
                                    {firstLine}
                                  </div>
                                  {restLines.length > 0 && (
                                    <p className="mt-1">{restLines.join('\n')}</p>
                                  )}
                                </div>
                              );
                            }
                          }
                          return <div key={idx}>{c}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              return <blockquote>{children}</blockquote>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Image Lightbox */}
      {zoomedImg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomedImg.alt || 'Xem ảnh phóng to'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setZoomedImg(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[92vw] overflow-auto rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-overlay)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedImg(null)}
              aria-label="Đóng ảnh phóng to"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={zoomedImg.src}
              alt={zoomedImg.alt}
              className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
            />
            {zoomedImg.alt && (
              <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
                {zoomedImg.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
