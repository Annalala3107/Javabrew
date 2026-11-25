import { useEffect, useRef } from 'react';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import {
  HighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { Compartment, EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import type { JavaDiagnostic } from '../services/javaCompilerService';

export const MAX_CODE_CHARS = 10_000;

export interface JumpTarget {
  line: number;
  column?: number;
  nonce: number;
}

interface JavaCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onRunShortcut?: () => void;
  onLimitReached?: (maxLength: number) => void;
  maxLength?: number;
  theme: 'dark' | 'light';
  diagnostics?: JavaDiagnostic[];
  jumpTarget?: JumpTarget | null;
  ariaLabel?: string;
  minHeight?: number;
}

const darkSyntax = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.controlKeyword], color: '#f59e0b', fontWeight: '600' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#38bdf8' },
  { tag: [tags.string, tags.character], color: '#4ade80' },
  { tag: [tags.number, tags.bool, tags.null], color: '#fbbf24' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#78716c', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#fde68a' },
  { tag: [tags.annotation, tags.meta], color: '#c084fc' },
  { tag: [tags.operator, tags.punctuation], color: '#d6d3d1' },
]);

const lightSyntax = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.controlKeyword], color: '#b45309', fontWeight: '600' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#0369a1' },
  { tag: [tags.string, tags.character], color: '#15803d' },
  { tag: [tags.number, tags.bool, tags.null], color: '#9a3412' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#78716c', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#7c2d12' },
  { tag: [tags.annotation, tags.meta], color: '#7e22ce' },
  { tag: [tags.operator, tags.punctuation], color: '#44403c' },
]);

function buildEditorTheme(mode: 'dark' | 'light', minHeight: number) {
  const isDark = mode === 'dark';
  return [
    EditorView.theme(
      {
        '&': {
          backgroundColor: isDark ? '#0c0a09' : '#f5f1ea',
          color: isDark ? '#fafaf9' : '#1c1917',
          fontSize: '13px',
          minHeight: `${minHeight}px`,
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          lineHeight: '1.65',
          overflow: 'auto',
        },
        '.cm-content': {
          padding: '14px 0',
          caretColor: isDark ? '#f59e0b' : '#b45309',
        },
        '.cm-line': {
          padding: '0 14px 0 10px',
        },
        '.cm-gutters': {
          backgroundColor: isDark ? '#141210' : '#ece6dc',
          color: isDark ? '#78716c' : '#78716c',
          borderRight: isDark ? '1px solid #292524' : '1px solid #e6dfd3',
          userSelect: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(180, 83, 9, 0.1)',
          color: isDark ? '#fbbf24' : '#92400e',
          fontWeight: '600',
        },
        '.cm-activeLine': {
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.06)' : 'rgba(180, 83, 9, 0.06)',
        },
        '&.cm-focused': {
          outline: 'none',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.24)' : 'rgba(180, 83, 9, 0.2)',
        },
        '.cm-matchingBracket': {
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(3, 105, 161, 0.16)',
          outline: isDark ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(3, 105, 161, 0.4)',
        },
        '.cm-tooltip': {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          border: isDark ? '1px solid #44403c' : '1px solid #d4c8b5',
          color: isDark ? '#fafaf9' : '#1c1917',
          borderRadius: '8px',
          fontSize: '12px',
        },
      },
      { dark: isDark }
    ),
    syntaxHighlighting(isDark ? darkSyntax : lightSyntax),
  ];
}

export function JavaCodeEditor({
  value,
  onChange,
  onBlur,
  onRunShortcut,
  onLimitReached,
  maxLength = MAX_CODE_CHARS,
  theme,
  diagnostics = [],
  jumpTarget = null,
  ariaLabel = 'Trình soạn thảo mã nguồn Java',
  minHeight = 290,
}: JavaCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef(new Compartment());

  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onRunShortcutRef = useRef(onRunShortcut);
  const onLimitReachedRef = useRef(onLimitReached);
  const maxLengthRef = useRef(maxLength);

  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;
  onRunShortcutRef.current = onRunShortcut;
  onLimitReachedRef.current = onLimitReached;
  maxLengthRef.current = maxLength;

  // Create EditorView once
  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const themeCompartment = themeCompartmentRef.current;
    const initialDoc = value.length > maxLength ? value.slice(0, maxLength) : value;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        java(),
        indentUnit.of('    '),
        lintGutter(),
        EditorState.transactionFilter.of((tr) => {
          if (!tr.docChanged) return tr;
          const cap = maxLengthRef.current;
          const nextLen = tr.newDoc.length;
          if (nextLen <= cap || nextLen <= tr.startState.doc.length) {
            return tr;
          }

          let removedCount = 0;
          const ops: Array<{ fromA: number; toA: number; text: string }> = [];
          tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
            removedCount += toA - fromA;
            ops.push({ fromA, toA, text: inserted.toString() });
          });

          let remaining = Math.max(0, cap - (tr.startState.doc.length - removedCount));
          const clampedChanges = ops.map((op) => {
            if (!op.text) return { from: op.fromA, to: op.toA, insert: '' };
            const allowed = op.text.slice(0, remaining);
            remaining -= allowed.length;
            return { from: op.fromA, to: op.toA, insert: allowed };
          });

          queueMicrotask(() => onLimitReachedRef.current?.(cap));

          if (clampedChanges.every((c) => c.from === c.to && c.insert.length === 0)) {
            return [];
          }
          return tr.startState.update({ changes: clampedChanges, sequential: false });
        }),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onRunShortcutRef.current?.();
              return true;
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        EditorView.contentAttributes.of({
          'aria-label': ariaLabel,
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          blur: () => {
            onBlurRef.current?.();
            return false;
          },
        }),
        themeCompartment.of(buildEditorTheme(theme, minHeight)),
      ],
    });

    const view = new EditorView({ state, parent });
    viewRef.current = view;

    const gutterEl = parent.querySelector('.cm-gutters');
    if (gutterEl) {
      gutterEl.setAttribute('data-testid', 'code-line-gutter');
    }

    return () => {
      viewRef.current = null;
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconfigure Dark/Light theme seamlessly without losing cursor position
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartmentRef.current.reconfigure(buildEditorTheme(theme, minHeight)),
    });
  }, [theme, minHeight]);

  // Sync external value changes (switching PE, file tab, diff apply, undo/reset)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const safeValue = value.length > maxLength ? value.slice(0, maxLength) : value;
    const current = view.state.doc.toString();
    if (current !== safeValue) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: safeValue },
      });
    }
  }, [value, maxLength]);

  // Sync javac compiler diagnostics directly onto CodeMirror lines/columns
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const doc = view.state.doc;
    const mapped: Diagnostic[] = diagnostics.map((diag) => {
      const clampedLine = Math.min(Math.max(1, diag.line), doc.lines);
      const lineInfo = doc.line(clampedLine);
      const rawFrom = lineInfo.from + Math.max(0, (diag.column || 1) - 1);
      const from = Math.min(rawFrom, lineInfo.to);
      let to = lineInfo.to;
      if (from === lineInfo.to && lineInfo.length > 0) {
        return {
          from: Math.max(lineInfo.from, lineInfo.to - 1),
          to: lineInfo.to,
          severity: diag.severity === 'error' ? 'error' : 'warning',
          message: diag.message,
          source: 'javac',
        };
      }
      const tailSlice = doc.sliceString(from, lineInfo.to);
      const tokenMatch = tailSlice.match(/^[A-Za-z0-9_$.]+|\S/);
      if (tokenMatch) {
        to = Math.min(lineInfo.to, from + tokenMatch[0].length);
      }
      return {
        from,
        to,
        severity: diag.severity === 'error' ? 'error' : 'warning',
        message: diag.message,
        source: 'javac',
      };
    });

    view.dispatch(setDiagnostics(view.state, mapped));
  }, [diagnostics, value]);

  // Jump to diagnostic line when clicked in Console
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !jumpTarget) return;

    const doc = view.state.doc;
    const clampedLine = Math.min(Math.max(1, jumpTarget.line), doc.lines);
    const lineInfo = doc.line(clampedLine);
    const pos = Math.min(lineInfo.from + Math.max(0, (jumpTarget.column || 1) - 1), lineInfo.to);

    view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    });
    view.focus();
  }, [jumpTarget]);

  return (
    <div
      ref={containerRef}
      className="min-h-[290px] flex-1 overflow-hidden bg-[var(--bg-code)]"
    />
  );
}
