export interface PePolicyViolation {
  code: 'PACKAGE_FORBIDDEN' | 'PE3_Q4_BINARY_API';
  file: string;
  line: number;
  message: string;
}

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

export function hasPackageDeclaration(sourceCode: string): { found: boolean; line: number } {
  const cleaned = stripJavaComments(sourceCode);
  const lines = cleaned.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*package\s+[A-Za-z_][A-Za-z0-9_.]*\s*;/.test(lines[i])) {
      return { found: true, line: i + 1 };
    }
  }
  return { found: false, line: 1 };
}

export function validateJavaPolicy(
  files: Array<{ name: string; content: string }>,
  peId?: number
): PePolicyViolation[] {
  const violations: PePolicyViolation[] = [];

  for (const file of files) {
    const pkg = hasPackageDeclaration(file.content);
    if (pkg.found) {
      violations.push({
        code: 'PACKAGE_FORBIDDEN',
        file: file.name,
        line: pkg.line,
        message: peId
          ? 'Quy chế PE PRO192 yêu cầu default package — hãy xóa dòng khai báo package ở đầu tệp.'
          : 'Sandbox chạy trực tiếp không dùng khai báo package — hãy xóa dòng package ...; ở đầu tệp.',
      });
    }

    if (peId === 11) {
      const cleaned = stripJavaComments(file.content);
      const match = cleaned.match(
        /\bInteger\.toBinaryString\s*\(|\bLong\.toBinaryString\s*\(|\bInteger\.toString\s*\([^,]+,\s*2\s*\)/
      );
      if (match && match.index !== undefined) {
        const line = cleaned.slice(0, match.index).split(/\r?\n/).length;
        violations.push({
          code: 'PE3_Q4_BINARY_API',
          file: file.name,
          line,
          message:
            'Vi phạm quy chế PE3-Q4: Cấm dùng Integer.toBinaryString() / Integer.toString(n, 2). Hãy tự chia % 2 và / 2 thủ công.',
        });
      }
    }
  }

  return violations;
}
