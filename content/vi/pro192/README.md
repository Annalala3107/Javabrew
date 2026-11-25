---
title: "PRO192 — Lập trình Hướng đối tượng với Java (30 Slots)"
category: PRO192
slots: "Slot 1 – 30"
lang: vi
description: "Giáo trình PRO192 tái cấu trúc thành 30 bài học Slot độc lập theo khung 5 khối sư phạm, ẩn đáp án Active Recall, gắn 186 sơ đồ slide, Study Bridge sang JavaGuide và kho đề PE."
---

# PRO192 — Lập trình Hướng đối tượng với Java (`30 Slots × 8 Giai đoạn`)

Kho giáo trình **PRO192 (Object-Oriented Programming with Java)** đã được tái cấu trúc theo chuẩn **1 Slot = 1 Bài học Độc lập**, tối ưu cho tự học & ôn thi trên **JavaBrew**:

1. **Khung Sư phạm 5 Khối Thống nhất:** Mỗi Slot dài gọn để học trong **20–30 phút**, gồm: *(1) Mục tiêu đầu ra & trọng tâm thi*, *(2) Lý thuyết cốt lõi chuẩn cấp tiêu đề*, *(3) Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8*, *(4) 5 bài tập Active Recall ẩn đáp án mặc định*, và *(5) Study Bridge sang JavaGuide + Thư viện sơ đồ Slide*.
2. **Đính chính Kiến thức & Sửa Lỗi Biên dịch:** Đã sửa lỗi code mảng bị mất ngoặc vuông, nâng cấp File I/O sang `try-with-resources` + `StringBuilder`, thêm thẻ `Modern JVM Note` (*Metaspace / JVM Heap / JVM Stack*, *G1GC/ZGC*) và thống nhất thuật ngữ Heap hiện đại xuyên suốt cả 30 Slots.
3. **Đồng bộ Offline 100%:** Gắn toàn bộ **186 sơ đồ bài giảng** từ `/media/pro192/images/`, liên kết **14 slide `.pptx`** + **14 `.pdf`** gốc, và nối chéo tới **JavaGuide (`EN/VI`)**.

---

## Lộ trình 30 Slots theo 8 Giai đoạn (`150` Bài tập Active Recall)

### Giai đoạn 1: Khởi động, Môi trường & Nền tảng Cú pháp Java

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 01** | [Tổng quan Công nghệ Java & Kiến trúc Nền tảng (JDK/JRE/JVM)](./slots/slot-01.md) | `Nền tảng` `Thi FE` | ~20 phút | [Get Start.pdf](/media/pro192/resources/Get%20Start.pdf) |
| **Slot 02** | [Cài đặt Môi trường, Công cụ NetBeans & Chương trình HelloWorld](./slots/slot-02.md) | `Nền tảng` `Quy chế PE` | ~20 phút | [Download & Install JDK & NetBeans 8.pdf](/media/pro192/resources/Download%20%26%20Install%20JDK%20%26%20NetBeans%208.pdf) |
| **Slot 03** | [Cấu trúc Chương trình Java & Quy trình Biên dịch CLI (javac/java/jar)](./slots/slot-03.md) | `Nền tảng` `Thi FE` | ~25 phút | [Learning the Java Language.pdf](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) |
| **Slot 04** | [Kiểu dữ liệu Nguyên thủy, Tham chiếu, Toán tử & Phạm vi Biến](./slots/slot-04.md) | `Thi PE (Q1–Q4)` `Thi FE` | ~30 phút | [Learning the Java Language.pdf](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) |
| **Slot 05** | [Cấu trúc Điều khiển Rẽ nhánh, Vòng lặp, For-each & Java Style](./slots/slot-05.md) | `Thi PE (Q1–Q4)` `Thi FE` | ~25 phút | [Learning the Java Language.pdf](/media/pro192/resources/Learning%20the%20Java%20Language.pdf) |

### Giai đoạn 2: Quản lý Bộ nhớ, Wrapper/Math & Chuỗi String/Scanner

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 06** | [Kiến trúc Bộ nhớ JVM (Stack / Heap & Modern JVM Note)](./slots/slot-06.md) | `Thi FE` `Nền tảng JVM` | ~25 phút | [Memory Management in Java.pdf](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) |
| **Slot 07** | [Cơ chế Cấp phát Bộ nhớ & Bộ dọn rác Tự động (Garbage Collection)](./slots/slot-07.md) | `Thi FE` `Nền tảng JVM` | ~25 phút | [Memory Management in Java.pdf](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) |
| **Slot 08** | [Wrapper Classes, Number Hierarchy, Autoboxing/Unboxing & Math](./slots/slot-08.md) | `Thi PE (Q1/Q2/Q4)` `Thi FE` | ~25 phút | [Numbers and Strings.pdf](/media/pro192/resources/Numbers%20and%20Strings.pdf) |
| **Slot 09** | [Xử lý Chuỗi (String Pool, StringBuilder/StringBuffer) & Scanner](./slots/slot-09.md) | `Thi PE (Q1/Q2/Q4)` `Thi FE` | ~30 phút | [Numbers and Strings.pdf](/media/pro192/resources/Numbers%20and%20Strings.pdf) |

### Giai đoạn 3: 4 Trụ cột OOP, Thiết kế Class & Encapsulation

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 10** | [4 Trụ cột OOP & Tư duy Mô hình hóa Hướng đối tượng](./slots/slot-10.md) | `Nền tảng OOP` `Thi FE` | ~20 phút | [Introduction.pdf](/media/pro192/resources/Introduction.pdf) |
| **Slot 11** | [Kỹ thuật Thiết kế Class, Nguyên lý Cohesion & Coupling](./slots/slot-11.md) | `Nền tảng OOP` `Thi FE` | ~20 phút | [Introduction.pdf](/media/pro192/resources/Introduction.pdf) |
| **Slot 12** | [Vòng đời Đối tượng, Constructor, Tham chiếu & Từ khóa this](./slots/slot-12.md) | `Thi PE (Q1/Q2)` `Thi FE` | ~25 phút | [Encapsulation.pdf](/media/pro192/resources/Encapsulation.pdf) |
| **Slot 13** | [Đóng gói (Encapsulation), Access Modifiers & Tổ chức Package](./slots/slot-13.md) | `Thi PE (Q1/Q2)` `Thi FE` | ~25 phút | [Encapsulation.pdf](/media/pro192/resources/Encapsulation.pdf) |

### Giai đoạn 4: Kế thừa (Inheritance), Array of Objects & Casting

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 14** | [Bản chất Kế thừa (Inheritance), Từ khóa extends & Quan hệ is-a/has-a](./slots/slot-14.md) | `Thi PE (Q2)` `Thi FE` | ~25 phút | [Inheritance.pdf](/media/pro192/resources/Inheritance.pdf) |
| **Slot 15** | [Chuỗi Hàm khởi tạo (Constructor Chaining) & Từ khóa super](./slots/slot-15.md) | `Thi PE (Q2)` `Thi FE` | ~25 phút | [Inheritance.pdf](/media/pro192/resources/Inheritance.pdf) |
| **Slot 16** | [Ghi đè Phương thức (@Override) & Che giấu Phương thức Tĩnh](./slots/slot-16.md) | `Thi PE (Q2)` `Thi FE` | ~25 phút | [Inheritance.pdf](/media/pro192/resources/Inheritance.pdf) |
| **Slot 17** | [Kiểu tĩnh vs Kiểu động, instanceof, Casting & Mảng Đối tượng (ItemList)](./slots/slot-17.md) | `Thi PE (Q2/Q3)` `Thi FE` | ~30 phút | [ArrayOfObjects.pdf](/media/pro192/resources/ArrayOfObjects.pdf) |

### Giai đoạn 5: Đa hình, Abstract Class, Interface & Anonymous Class

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 18** | [Bản chất Tính Đa hình, Dynamic Binding & Overloading vs Overriding](./slots/slot-18.md) | `Thi PE (Q2/Q3)` `Thi FE` | ~25 phút | [Polymorphism.pdf](/media/pro192/resources/Polymorphism.pdf) |
| **Slot 19** | [Lớp Trừu tượng (Abstract Class) & Phương thức Trừu tượng](./slots/slot-19.md) | `Thi FE` `OOP Nâng cao` | ~25 phút | [Polymorphism.pdf](/media/pro192/resources/Polymorphism.pdf) |
| **Slot 20** | [Giao diện (Interface) & Kỹ thuật Đa kế thừa Hành vi](./slots/slot-20.md) | `Thi PE (Q3/Q4)` `Thi FE` | ~25 phút | [Polymorphism.pdf](/media/pro192/resources/Polymorphism.pdf) |
| **Slot 21** | [Lớp Nội danh (Anonymous Class) & Tổng kết Đa hình](./slots/slot-21.md) | `Thi PE (Q3)` `Thi FE` | ~25 phút | [Polymorphism.pdf](/media/pro192/resources/Polymorphism.pdf) |

### Giai đoạn 6: Xử lý Ngoại lệ (Exception Handling) & Mã nguồn An toàn

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 22** | [Bản chất Ngoại lệ, Phân cấp Throwable & Checked vs Unchecked](./slots/slot-22.md) | `Thi FE` `Thực chiến` | ~20 phút | [Exception Handling.pdf](/media/pro192/resources/Exception%20Handling.pdf) |
| **Slot 23** | [Cấu trúc try-catch-finally & Dọn dẹp Tài nguyên An toàn](./slots/slot-23.md) | `Thi FE` `Thực chiến` | ~25 phút | [Exception Handling.pdf](/media/pro192/resources/Exception%20Handling.pdf) |
| **Slot 24** | [Ủy quyền throws, Ném Ngoại lệ throw & Tạo Custom Exception](./slots/slot-24.md) | `Thi FE` `Thực chiến` | ~20 phút | [Exception Handling.pdf](/media/pro192/resources/Exception%20Handling.pdf) |

### Giai đoạn 7: Java Collections Framework, Collections/Arrays & So sánh

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 25** | [Tổng quan Java Collections Framework, List & Iterator An toàn](./slots/slot-25.md) | `Thi PE (Q3)` `Thi FE` | ~30 phút | [Collections.pdf](/media/pro192/resources/Collections.pdf) |
| **Slot 26** | [Cấu trúc Set (HashSet vs TreeSet) & Map (HashMap vs TreeMap)](./slots/slot-26.md) | `Thi PE (Q3/Q4)` `Thi FE` | ~30 phút | [Collections.pdf](/media/pro192/resources/Collections.pdf) |
| **Slot 27** | [Thuật toán Collections / Arrays & Comparable vs Comparator](./slots/slot-27.md) | `Thi PE (Q3)` `Thi FE` | ~30 phút | [Support Classes.pdf](/media/pro192/resources/Support%20Classes.pdf) |

### Giai đoạn 8: File I/O Streams, Character/Byte Streams & Serialization

| Slot | Bài học | Trọng tâm | Thời lượng | Slide PDF |
| :---: | :--- | :--- | :---: | :--- |
| **Slot 28** | [Tổng quan I/O Streams, java.io.File & Thao tác Thư mục](./slots/slot-28.md) | `Thi FE` `Thực chiến` | ~25 phút | [File IO.pdf](/media/pro192/resources/File%20IO.pdf) |
| **Slot 29** | [Luồng Ký tự (Character Streams), UTF-8, BufferedReader & try-with-resources](./slots/slot-29.md) | `Thi FE` `Thực chiến` | ~25 phút | [File IO.pdf](/media/pro192/resources/File%20IO.pdf) |
| **Slot 30** | [Luồng Nhị phân, RandomAccessFile & Tuần tự hóa (Serialization)](./slots/slot-30.md) | `Thi FE` `Thực chiến` | ~25 phút | [File IO.pdf](/media/pro192/resources/File%20IO.pdf) |

### Thực chiến Practical Exam (`M5 & M7`)

- [Kho Đề Practical Exam (PE)](./pe-challenges.md) — Ôn luyện dạng bài Q1–Q4 thực tế trước giờ thi.

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
- **187 Hình ảnh & Sơ đồ động GIF:** `/media/pro192/images/` (`186` sơ đồ đã gắn vào từng Slot + `Logo-FU-01.png`).
