---
title: "Chuyên đề Java IO: BIO, NIO, AIO, Mô hình I/O và Design Pattern"
description: "Lộ trình học Java IO và NIO, bao gồm BIO, NIO, AIO, blocking/non-blocking, đồng bộ/bất đồng bộ, I/O Multiplexing, mô hình Reactor và các Design Pattern trong IO."
category: Java
tag:
  - Java
  - Java IO
  - Phỏng vấn Java
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Java IO,Java NIO,BIO,NIO,AIO,Mô hình IO,I/O Multiplexing,Reactor,Selector,Channel,Buffer,Câu hỏi phỏng vấn Java IO
lang: vi
sourceRef: zh-ref/java/io/README.md
---

Java IO là nền tảng quan trọng để hiểu về đọc ghi file, lập trình mạng, Netty, RPC framework và server hiệu năng cao. Khi học IO, bạn nên tìm hiểu song song giữa Java API, mô hình I/O của hệ điều hành và các Design Pattern phổ biến, từ đó mới có thể xâu chuỗi được BIO, NIO, AIO, `Selector`, `Channel`, `Buffer` và Reactor.

## Phù hợp với ai

- Lập trình viên Backend muốn học Java IO/NIO một cách bài bản.
- Các bạn chuẩn bị cho câu hỏi phỏng vấn liên quan đến BIO, NIO, AIO, I/O Multiplexing và Reactor.
- Độc giả muốn học tiếp về Netty, RPC, message queue, database driver và các framework giao tiếp mạng khác.
- Kỹ sư dễ nhầm lẫn giữa các khái niệm blocking/non-blocking, đồng bộ/bất đồng bộ, `Selector`, `Channel`, `Buffer`.

## Trọng tâm học tập

- Hệ thống luồng Java IO, Byte Stream, Character Stream, Buffered Stream và các thao tác file phổ biến.
- Ứng dụng của các Design Pattern như Decorator Pattern, Adapter Pattern trong IO.
- Sự khác biệt về mô hình, kịch bản áp dụng cũng như ưu nhược điểm của BIO, NIO, AIO.
- Đồng bộ/bất đồng bộ, Blocking/Non-blocking, I/O Multiplexing, Reactor và Proactor.
- Mối quan hệ phối hợp giữa `Buffer`, `Channel`, `Selector` và vai trò của chúng trong lập trình mạng.

## Thứ tự đọc khuyến nghị

1. [Tổng kết kiến thức cơ bản Java IO](./io-basis.md): Nắm vững hệ thống luồng IO, các lớp thường dùng và nền tảng đọc ghi file trước.
2. [Tổng kết Design Pattern trong Java IO](./io-design-patterns.md): Hiểu cách Decorator Pattern, Adapter Pattern và các mẫu thiết kế khác được áp dụng vào IO API.
3. [Giải thích chi tiết các mô hình Java IO](./io-model.md): Làm rõ BIO, NIO, AIO, đồng bộ/bất đồng bộ, blocking/non-blocking và I/O Multiplexing.
4. [Tổng kết kiến thức cốt lõi Java NIO](./nio-basis.md): Tìm hiểu sâu về `Buffer`, `Channel`, `Selector` và mô hình lập trình NIO.

## Bài viết cốt lõi

- [Tổng kết kiến thức cơ bản Java IO](./io-basis.md): Giới thiệu hệ thống về Byte Stream, Character Stream, Buffered Stream, file truy cập ngẫu nhiên và các lớp IO phổ biến.
- [Tổng kết Design Pattern trong Java IO](./io-design-patterns.md): Giải thích ứng dụng của Decorator Pattern, Adapter Pattern và các Design Pattern khác trong IO.
- [Giải thích chi tiết các mô hình Java IO](./io-model.md): Phân biệt BIO, NIO, AIO, đồng bộ/bất đồng bộ, blocking/non-blocking và I/O Multiplexing.
- [Tổng kết kiến thức cốt lõi Java NIO](./nio-basis.md): Hiểu về `Buffer`, `Channel`, `Selector`, `SelectionKey` và lập trình server NIO.

## Câu hỏi tần suất cao

- Byte Stream và Character Stream có gì khác nhau? Khi nào nên dùng Buffered Stream?
- Tại sao Java IO lại sử dụng rất nhiều Decorator Pattern?
- BIO, NIO, AIO có gì khác nhau?
- Đồng bộ và bất đồng bộ, blocking và non-blocking lần lượt có nghĩa là gì?
- I/O Multiplexing giải quyết vấn đề gì?
- `select`, `poll`, `epoll` có gì khác nhau?
- Mô hình Reactor là gì? Có gì khác với Proactor?
- Trong NIO, `Buffer`, `Channel`, `Selector` lần lượt đảm nhiệm trách nhiệm gì?
- Tại sao Netty được xây dựng dựa trên NIO thay vì dùng trực tiếp BIO truyền thống?

## Chuyên đề liên quan

- [Hệ thống kiến thức Java](../)
- [Chuyên đề lập trình đồng thời Java](../concurrent/)
- [Chuyên đề JVM](../jvm/)
- [Mạng máy tính](../../cs-basics/network/)
