import {
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';

export const JAVA_COMPLETIONS: Completion[] = [
  snippetCompletion('System.out.println(${});', {
    label: 'sysout',
    detail: 'In ra dòng mới',
    type: 'keyword',
    boost: 95,
  }),
  snippetCompletion('System.out.println(${});', {
    label: 'syso',
    detail: 'In ra dòng mới',
    type: 'keyword',
    boost: 92,
  }),
  snippetCompletion('public static void main(String[] args) {\n    ${}\n}', {
    label: 'psvm',
    detail: 'Hàm main JDK chuẩn',
    type: 'keyword',
    boost: 90,
  }),
  snippetCompletion('for (int ${i} = 0; ${i} < ${len}; ${i}++) {\n    ${}\n}', {
    label: 'fori',
    detail: 'Vòng lặp chỉ số for (int i)',
    type: 'keyword',
    boost: 88,
  }),
  snippetCompletion('for (${Type} ${item} : ${collection}) {\n    ${}\n}', {
    label: 'foreach',
    detail: 'Vòng lặp enhanced for-each',
    type: 'keyword',
    boost: 86,
  }),
  snippetCompletion(
    'Iterator<${Type}> ${it} = ${list}.iterator();\nwhile (${it}.hasNext()) {\n    ${Type} ${cur} = ${it}.next();\n    if (${cond}) {\n        ${it}.remove();\n    }\n}',
    {
      label: 'iter',
      detail: 'Xóa an toàn với Iterator.remove()',
      type: 'keyword',
      boost: 85,
    }
  ),
  snippetCompletion('if (${str} == null || ${str}.isEmpty()) {\n    return ${""};\n}', {
    label: 'ifnull',
    detail: 'Guard null/empty (Early Return)',
    type: 'keyword',
    boost: 84,
  }),
  snippetCompletion('try {\n    ${}\n} catch (${Exception} e) {\n    ${}\n}', {
    label: 'tryc',
    detail: 'Khối try-catch xử lý ngoại lệ',
    type: 'keyword',
    boost: 80,
  }),
  snippetCompletion('StringBuilder ${sb} = new StringBuilder();', {
    label: 'sb',
    detail: 'Khởi tạo StringBuilder',
    type: 'class',
    boost: 82,
  }),

  // High-frequency PRO192 / JDK 8 APIs & keywords
  { label: 'String', type: 'class', detail: 'java.lang.String' },
  { label: 'StringBuilder', type: 'class', detail: 'Nối chuỗi hiệu quả trong vòng lặp' },
  { label: 'Character.isDigit', type: 'method', detail: '(char ch) -> boolean' },
  { label: 'Character.isLetter', type: 'method', detail: '(char ch) -> boolean' },
  { label: 'Character.isUpperCase', type: 'method', detail: '(char ch) -> boolean' },
  { label: 'Character.isLowerCase', type: 'method', detail: '(char ch) -> boolean' },
  { label: 'Character.toUpperCase', type: 'method', detail: '(char ch) -> char' },
  { label: 'Character.toLowerCase', type: 'method', detail: '(char ch) -> char' },
  { label: 'ArrayList', type: 'class', detail: 'java.util.ArrayList' },
  { label: 'List', type: 'interface', detail: 'java.util.List' },
  { label: 'HashMap', type: 'class', detail: 'java.util.HashMap' },
  { label: 'Map', type: 'interface', detail: 'java.util.Map' },
  { label: 'Collections.sort', type: 'method', detail: 'Sắp xếp List theo Comparator' },
  { label: 'Comparator', type: 'interface', detail: 'java.util.Comparator' },
  { label: 'Iterator', type: 'interface', detail: 'java.util.Iterator' },
  { label: 'Scanner', type: 'class', detail: 'java.util.Scanner(System.in)' },
  { label: 'Arrays', type: 'class', detail: 'java.util.Arrays' },
  { label: 'Math.max', type: 'method', detail: 'Tìm giá trị lớn nhất' },
  { label: 'Math.min', type: 'method', detail: 'Tìm giá trị nhỏ nhất' },
  { label: 'System.out.println', type: 'method', detail: 'In ra stdout kèm xuống dòng' },
  { label: 'Override', type: 'keyword', detail: '@Override annotation' },
  { label: 'implements', type: 'keyword', detail: 'Triển khai interface' },
  { label: 'extends', type: 'keyword', detail: 'Kế thừa lớp cha (superclass)' },
];

export function javaCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_.]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  return {
    from: word.from,
    options: JAVA_COMPLETIONS,
    validFor: /^[A-Za-z0-9_.]*$/,
  };
}
