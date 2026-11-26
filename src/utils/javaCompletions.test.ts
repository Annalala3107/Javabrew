import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { JAVA_COMPLETIONS, javaCompletionSource } from './javaCompletions';

describe('javaCompletions', () => {
  it('provides PRO192 / JDK 8 snippets and core Java API completions', () => {
    const labels = JAVA_COMPLETIONS.map((c) => c.label);
    expect(labels).toContain('sysout');
    expect(labels).toContain('psvm');
    expect(labels).toContain('iter');
    expect(labels).toContain('Character.isDigit');
    expect(labels).toContain('StringBuilder');
  });

  it('returns matching options on typed Java tokens and null when empty without explicit trigger', () => {
    const typedState = EditorState.create({ doc: 'sys' });
    const typedCtx = new CompletionContext(typedState, 3, false);
    const res = javaCompletionSource(typedCtx);
    expect(res).not.toBeNull();
    expect(res?.from).toBe(0);
    expect(res?.options.some((o) => o.label === 'sysout')).toBe(true);

    const emptyState = EditorState.create({ doc: '   ' });
    const emptyCtx = new CompletionContext(emptyState, 3, false);
    expect(javaCompletionSource(emptyCtx)).toBeNull();
  });
});
