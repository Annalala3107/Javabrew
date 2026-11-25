import { describe, expect, it } from 'vitest';
import {
  MAX_PLAYGROUND_FILES,
  prepareJavaPlaygroundFiles,
  validateNewJavaFileName,
} from './javaPlayground';

describe('javaPlayground utilities', () => {
  it('keeps complete class with main() and strips package declaration safely', () => {
    const snippet = `package com.demo.oop;

public class HelloApp {
    public static void main(String[] args) {
        System.out.println("Hi JavaBrew");
    }
}`;
    const res = prepareJavaPlaygroundFiles(snippet, 'java/basis/hello.md');
    expect(res.files).toHaveLength(1);
    expect(res.files[0].name).toBe('HelloApp.java');
    expect(res.files[0].content).toContain('// package com.demo.oop;');
    expect(res.files[0].content).toContain('public class HelloApp');
  });

  it('adds companion Main.java when lesson snippet defines a class without main()', () => {
    const snippet = `public class Car {
    private String brand = "Honda";
    public String getBrand() { return brand; }
}`;
    const res = prepareJavaPlaygroundFiles(snippet);
    expect(res.files).toHaveLength(2);
    expect(res.files.map((f) => f.name)).toEqual(['Car.java', 'Main.java']);
    expect(res.files[1].content).toContain('public static void main(String[] args)');
  });

  it('wraps raw statements into Main.java with needed Java standard imports', () => {
    const snippet = `import java.time.LocalDate;
BigDecimal price = new BigDecimal("99.50");
List<String> tags = List.of("Java", "OOP");
System.out.println(price + " " + tags + " " + LocalDate.now());`;
    const res = prepareJavaPlaygroundFiles(snippet);
    expect(res.files).toHaveLength(1);
    expect(res.files[0].name).toBe('Main.java');
    expect(res.files[0].content).toContain('import java.util.*;');
    expect(res.files[0].content).toContain('import java.time.LocalDate;');
    expect(res.files[0].content).toContain('import java.math.*;');
    expect(res.files[0].content).toContain('public static void main(String[] args)');
  });

  it('wraps method-only snippet as member method of Main', () => {
    const snippet = `public static int sum(int a, int b) {
    return a + b;
}`;
    const res = prepareJavaPlaygroundFiles(snippet);
    expect(res.files).toHaveLength(1);
    expect(res.files[0].content).toContain('public class Main');
    expect(res.files[0].content).toContain('public static int sum(int a, int b)');
    expect(res.files[0].content).toContain('public static void main(String[] args)');
  });

  it('validates new file names strictly and enforces max file limit', () => {
    expect(validateNewJavaFileName('Student', ['Main.java'])).toEqual({
      ok: true,
      fileName: 'Student.java',
    });
    expect(validateNewJavaFileName('../Evil', ['Main.java']).ok).toBe(false);
    expect(validateNewJavaFileName('__JavaBrewHacker', ['Main.java']).ok).toBe(false);
    expect(validateNewJavaFileName('main.java', ['Main.java']).ok).toBe(false);

    const fullList = Array.from({ length: MAX_PLAYGROUND_FILES }, (_, i) => `C${i}.java`);
    expect(validateNewJavaFileName('Extra.java', fullList).ok).toBe(false);
  });
});
