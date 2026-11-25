export function stripJavaComments(code: string): string {
  return code.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n\r]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (match) => (match.startsWith('//') || match.startsWith('/*') ? match.replace(/[^\n\r]/g, ' ') : match)
  );
}

export function inferJavaFileName(sourceCode: string, fallbackName = 'Main.java'): string {
  const cleaned = stripJavaComments(sourceCode);
  const match = cleaned.match(
    /\bpublic\s+(?:(?:final|abstract|sealed|non-sealed)\s+)*(?:class|interface|enum|record)\s+([A-Za-z_][A-Za-z0-9_]*)\b/
  );
  if (match && match[1]) {
    const candidate = `${match[1]}.java`;
    if (/^[A-Za-z_][A-Za-z0-9_]*\.java$/.test(candidate)) {
      return candidate;
    }
  }
  return fallbackName;
}

export function hasMainMethod(sourceCode: string): boolean {
  const cleaned = stripJavaComments(sourceCode);
  return (
    /\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String(?:\s*\[\s*\]|\s*\.\.\.)\s+[A-Za-z_][A-Za-z0-9_]*\s*\)/.test(
      cleaned
    ) ||
    /\b(?:public\s+static|static\s+public)\s+void\s+main\s*\(\s*String\s+[A-Za-z_][A-Za-z0-9_]*\s*\[\s*\]\s*\)/.test(
      cleaned
    )
  );
}
