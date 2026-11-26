import type { Element, ElementContent, Root, RootContent } from 'hast';
import type { LanguageFn } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import http from 'highlight.js/lib/languages/http';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import properties from 'highlight.js/lib/languages/properties';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { createLowlight } from 'lowlight';

const COMPACT_LANGUAGES: Record<string, LanguageFn> = {
  java,
  sql,
  bash,
  json,
  markdown,
  xml,
  c,
  yaml,
  typescript,
  javascript,
  ini,
  properties,
  plaintext,
  python,
  http,
};

const lowlight = createLowlight(COMPACT_LANGUAGES);

lowlight.registerAlias({
  bash: ['shell', 'sh', 'zsh'],
  plaintext: ['text', 'plain', 'txt'],
  xml: ['html'],
  javascript: ['js'],
  typescript: ['ts'],
  python: ['py'],
  yaml: ['yml'],
  markdown: ['md'],
});

const REGISTERED_LANGUAGES = new Set(lowlight.listLanguages());

function extractText(node: ElementContent): string {
  if (node.type === 'text') return node.value;
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractText).join('');
  }
  return '';
}

function extractLanguage(node: Element): string | false | undefined {
  const classList = node.properties?.className;
  if (!Array.isArray(classList)) return undefined;

  let detected: string | undefined;
  for (const item of classList) {
    const cls = String(item);
    if (cls === 'no-highlight' || cls === 'nohighlight') return false;
    if (!detected && cls.startsWith('lang-')) detected = cls.slice(5).toLowerCase();
    if (!detected && cls.startsWith('language-')) detected = cls.slice(9).toLowerCase();
  }
  return detected;
}

function visitPreCode(node: Root | RootContent): void {
  if (!('children' in node) || !Array.isArray(node.children)) return;

  if (node.type === 'element' && node.tagName === 'pre') {
    for (const child of node.children) {
      if (child.type !== 'element' || child.tagName !== 'code') continue;
      const lang = extractLanguage(child);
      if (!lang || !REGISTERED_LANGUAGES.has(lang)) continue;

      const raw = child.children.map(extractText).join('');
      if (!raw) continue;

      try {
        const result = lowlight.highlight(lang, raw, { prefix: 'hljs-' });
        const classes = Array.isArray(child.properties?.className)
          ? [...child.properties.className]
          : [];
        if (!classes.includes('hljs')) {
          classes.unshift('hljs');
        }
        child.properties = { ...child.properties, className: classes };
        if (result.children.length > 0) {
          child.children = result.children as ElementContent[];
        }
      } catch {
        // Leave code block unhighlighted rather than breaking Markdown rendering
      }
    }
    return;
  }

  for (const child of node.children) {
    visitPreCode(child);
  }
}

export function rehypeCodeHighlight() {
  return (tree: Root): undefined => {
    visitPreCode(tree);
    return undefined;
  };
}
