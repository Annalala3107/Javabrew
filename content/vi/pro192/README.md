---
title: "PRO192 — Lập trình Hướng đối tượng với Java (30 Slots)"
category: PRO192
slots: "Slot 1 – 30"
lang: vi
description: "Tổng quan giáo trình PRO192 chuẩn 30 Slots chia thành 8 giai đoạn, kèm 150 bài tập tự luyện, kho ảnh & slide offline, bảng ánh xạ Study Bridge sang JavaGuide và bộ đề luyện thi Practical Exam (PE)."
---

# PRO192 — Lập trình Hướng đối tượng với Java (`30 Slots × 8 Giai đoạn`)

Kho tài liệu học tập chuẩn hóa của môn **PRO192 (Object-Oriented Programming with Java)** dành cho nền tảng **JavaBrew**, đã được:

1. **Làm sạch & biên dịch hóa code mẫu:** Khắc phục lỗi mất ngoặc vuông mảng từ NotebookLM (`int[] a = new int[3]`), sửa lỗi Scanner `nextInt()` + `nextLine()`, bổ sung `StringBuilder`, `try-with-resources` (Java 7+) và `serialVersionUID`.
2. **Đính chính kiến thức JVM/Collections cũ trên slide:** Thêm thẻ `Modern JVM Note` tách rõ thuật ngữ cũ (*Static/Dynamic Heap*, *GC chỉ chạy khi cạn Heap*) sang kiến trúc HotSpot hiện đại (**Metaspace / Heap / JVM Stack**, **G1GC/ZGC**), và chuẩn hóa `TreeSet` (Red-Black Tree) + quy tắc `hashCode()`/`equals()`.
3. **Đồng bộ offline 100%:** Gắn sơ đồ minh họa từ **187 ảnh/GIF** (`/media/pro192/images/`), liên kết tải trực tiếp **14 slide `.pptx`** + **14 `.pdf`**, và kết nối chéo **Study Bridge** tới kho bài chuyên sâu **JavaGuide**.

---

## Mục lục 8 Giai đoạn Giáo trình (30 Slots · 150 Bài tập Tự luyện)

| Giai đoạn | Phạm vi Slots | Chủ đề trọng tâm | Tài liệu |
|---|---|---|---|
| **Giai đoạn 1** | Slot 1 – 5 | Khởi động, JDK/JRE/JVM, biến, kiểu nguyên thủy, toán tử, vòng lặp & Java Style | [giai-doan-1-slot-01-05.md](./giai-doan-1-slot-01-05.md) |
| **Giai đoạn 2** | Slot 6 – 9 | Bộ nhớ Stack/Heap (+ `Modern JVM Note`), GC, Wrapper/Math, String Pool & Scanner | [giai-doan-2-slot-06-09.md](./giai-doan-2-slot-06-09.md) |
| **Giai đoạn 3** | Slot 10 – 13 | 4 Trụ cột OOP, Thiết kế Class (Cohesion/Coupling), Constructor, `this`, Encapsulation & Package | [giai-doan-3-slot-10-13.md](./giai-doan-3-slot-10-13.md) |
| **Giai đoạn 4** | Slot 14 – 17 | Kế thừa (`is-a`/`has-a`, `extends`), `super()`, Overriding, `instanceof` & Array of Objects | [giai-doan-4-slot-14-17.md](./giai-doan-4-slot-14-17.md) |
| **Giai đoạn 5** | Slot 18 – 21 | Đa hình (Dynamic Binding), Overloading vs Overriding, `abstract`, `interface` & Anonymous Class | [giai-doan-5-slot-18-21.md](./giai-doan-5-slot-18-21.md) |
| **Giai đoạn 6** | Slot 22 – 24 | Xử lý Ngoại lệ (`Throwable`, Checked/Unchecked), `try-catch-finally`, `throws`/`throw` & Custom Exception | [giai-doan-6-slot-22-24.md](./giai-doan-6-slot-22-24.md) |
| **Giai đoạn 7** | Slot 25 – 27 | Collections (`List`, `Set`, `Map`), `Collections`/`Arrays` & `Comparable` vs `Comparator` | [giai-doan-7-slot-25-27.md](./giai-doan-7-slot-25-27.md) |
| **Giai đoạn 8** | Slot 28 – 30 | `java.io.File`, Character/Byte Streams, UTF-8, `try-with-resources`, `RandomAccessFile` & `Serializable` | [giai-doan-8-slot-28-30.md](./giai-doan-8-slot-28-30.md) |
| **Thực chiến PE** | Ôn thi Q1–Q4 | Kho 4 bộ đề Practical Exam chuẩn form (Car/Student, Book Inheritance, AntiqueShop/ItemList, Collections+File I/O) | [pe-challenges.md](./pe-challenges.md) |

---

## Bảng Ánh xạ Study Bridge (`PRO192 × JavaGuide`)

| Cụm PRO192 | Bài đào sâu tương ứng trong JavaGuide (`content/vi/`) | Slide PDF gốc Offline |
|---|---|---|
| Slot 1–5 (Java Platform & Syntax) | [Java Basics Part 1](../java/basis/java-basic-questions-01.md) · [Từ khóa Java](../java/basis/java-keyword-summary.md) · [JVM Intro](../java/jvm/jvm-intro.md) | [Get Start.pdf](/media/pro192/resources/Get%20Start.pdf) · [Learning the Java Language.pdf](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) |
| Slot 6–9 (Memory, GC, String, Math) | [Vùng nhớ Runtime JVM](../java/jvm/memory-area.md) · [Garbage Collection](../java/jvm/jvm-garbage-collection.md) · [Value Passing](../java/basis/why-there-only-value-passing-in-java.md) | [Memory Management in Java.pdf](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) · [Numbers and Strings.pdf](/media/pro192/resources/Numbers%20and%20Strings.pdf) |
| Slot 10–17 (OOP Core & Inheritance) | [Java Basics Part 2](../java/basis/java-basic-questions-02.md) · [Design Patterns](../system-design/design-pattern.md) | [Introduction.pdf](/media/pro192/resources/Introduction.pdf) · [Encapsulation.pdf](/media/pro192/resources/Encapsulation.pdf) · [Inheritance.pdf](/media/pro192/resources/Inheritance.pdf) · [ArrayOfObjects.pdf](/media/pro192/resources/ArrayOfObjects.pdf) |
| Slot 18–24 (Polymorphism & Exception) | [Java Basics Part 2](../java/basis/java-basic-questions-02.md) · [Java Basics Part 3](../java/basis/java-basic-questions-03.md) · [Dynamic Proxy](../java/basis/proxy.md) | [Polymorphism.pdf](/media/pro192/resources/Polymorphism.pdf) · [Exception Handling.pdf](/media/pro192/resources/Exception%20Handling.pdf) |
| Slot 25–27 (Collections & Comparator) | [Collections Part 1](../java/collection/java-collection-questions-01.md) · [Collections Part 2](../java/collection/java-collection-questions-02.md) · [HashMap Source Code](../java/collection/hashmap-source-code.md) · [ArrayList Source Code](../java/collection/arraylist-source-code.md) | [Collections.pdf](/media/pro192/resources/Collections.pdf) · [Support Classes.pdf](/media/pro192/resources/Support%20Classes.pdf) |
| Slot 28–30 (File IO & Serialization) | [Java IO Basis](../java/io/io-basis.md) · [IO Decorator Pattern](../java/io/io-design-patterns.md) · [Java Serialization](../java/basis/serialization.md) | [File IO.pdf](/media/pro192/resources/File%20IO.pdf) |

---

## Tài nguyên Gốc Đính kèm Offline

- **Kho Slide PowerPoint (14 tệp):** `/media/pro192/slides/` (`ArrayOfObjects.pptx`, `Collections.pptx`, `Encapsulation.pptx`, `Exception Handling.pptx`, `File IO.pptx`, `Get Start.pptx`, `Inheritance.pptx`, `Introduction.pptx`, `Learning the Java Language.pptx`, `Memory Management in Java.pptx`, `Numbers and Strings.pptx`, `Polymorphism.pptx`, `Support Classes.pptx`, `Download & Install JDK & NetBeans 8.pptx`).
- **Tài liệu PDF + Demo MVC (`banking.rar`):** `/media/pro192/resources/` (`banking.rar` cùng 14 tệp `.pdf` tương ứng).
- **187 Hình ảnh & Sơ đồ động GIF:** `/media/pro192/images/`.
