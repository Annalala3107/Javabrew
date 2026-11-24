---
title: "Chuyên đề Maven: POM, Tọa độ, Repository, Quản lý Dependency, Lifecycle, Plugin và Dự án đa module"
description: "Lộ trình học tập phỏng vấn và build dự án với Maven, bao gồm POM, tọa độ, repository, dependency scope, lifecycle, plugin, dự án đa module, Maven Wrapper và các thực hành tốt nhất, phù hợp cho lập trình viên Java Backend."
category: Công cụ phát triển
tag:
  - Maven
  - Build dự án
  - Quản lý dependency
sitemap:
  changefreq: weekly
  priority: 0.85
head:
  - - meta
    - name: keywords
      content: Maven,POM,Tọa độ Maven,Maven Repository,Quản lý dependency,Dependency scope,Vòng đời Maven,Plugin Maven,Dự án đa module,Build dự án Java
lang: vi
sourceRef: zh-ref/tools/maven/README.md
---

Maven là công cụ build và quản lý dependency phổ biến nhất trong các dự án Java Backend. Khi học Maven, đừng chỉ dừng lại ở việc sao chép `pom.xml`, mà còn cần hiểu các khái niệm nền tảng như tọa độ (coordinates), repository, phụ thuộc bắc cầu (transitive dependency), vòng đời (lifecycle), plugin và quản lý đa module.

## Phù hợp với ai

- Các bạn đang học về build dự án Java và quản lý dependency.
- Lập trình viên sử dụng Maven trong dự án nhưng hay bị vướng khi gặp xung đột dependency, phiên bản không đồng nhất, quản lý đa module hoặc build CI.
- Độc giả chuẩn bị phỏng vấn, cần trình bày rõ ràng các khái niệm cốt lõi và thực hành tốt nhất về Maven.
- Kỹ sư cần bảo trì các dự án Spring Boot, microservices hoặc dự án Java đa module.

## Trọng tâm học tập

- POM là cấu hình cốt lõi của dự án Maven, còn tọa độ dùng để định danh duy nhất một artifact (cấu kiện).
- Repository của Maven được chia thành local repository (kho cục bộ), private repository (kho nội bộ/private) và central repository (kho trung tâm); quá trình phân giải dependency sẽ tìm kiếm theo một trình tự nhất định.
- Dependency scope (phạm vi phụ thuộc), phụ thuộc bắc cầu, loại trừ dependency và quản lý phiên bản quyết định dự án cuối cùng sẽ sử dụng những file JAR nào.
- Vòng đời (lifecycle) định nghĩa các giai đoạn (phase) build, còn plugin chịu trách nhiệm thực thi thực sự các tác vụ như biên dịch, kiểm thử, đóng gói.
- Maven Wrapper giúp cố định phiên bản Maven mà dự án sử dụng, rất phù hợp cho cộng tác nhóm và môi trường CI.
- Với dự án đa module, cần tập trung vào POM cha (parent POM), `dependencyManagement`, `pluginManagement` và ranh giới giữa các module.

## Thứ tự đọc khuyến nghị

1. [Tổng kết khái niệm cốt lõi Maven](./maven-core-concepts.md): Hiểu về POM, tọa độ, repository, dependency, lifecycle, plugin và dự án đa module trước.
2. [Thực hành tốt nhất với Maven (Best Practices)](./maven-best-practices.md): Tiếp tục học cấu trúc thư mục chuẩn, phiên bản biên dịch, BOM, quản lý phiên bản dependency, Maven Wrapper, CI và các thực hành phổ biến.
3. Kết hợp xem file `pom.xml` của một dự án Spring Boot: Tập trung quan sát dự án cha, dependency scope, cấu hình plugin và cây dependency cuối cùng.

## Bài viết cốt lõi

- [Tổng kết khái niệm cốt lõi Maven](./maven-core-concepts.md): Giới thiệu có hệ thống về vai trò của Maven, POM, tọa độ, repository, dependency, lifecycle, plugin và dự án đa module.
- [Thực hành tốt nhất với Maven (Best Practices)](./maven-best-practices.md): Tổng hợp cấu trúc thư mục chuẩn, phiên bản biên dịch, đồng bộ phiên bản dependency, Maven Wrapper, CI và các khuyến nghị sử dụng hằng ngày.

## Câu hỏi tần suất cao

- Maven là gì? Nó chủ yếu giải quyết những vấn đề nào?
- POM, `groupId`, `artifactId`, `version` lần lượt là gì?
- Local repository, private repository và central repository có gì khác nhau?
- Phụ thuộc bắc cầu (transitive dependency) trong Maven là gì? Kiểm tra và xử lý xung đột dependency như thế nào?
- `dependencyManagement` và `dependencies` có gì khác nhau?
- Vòng đời (lifecycle) Maven và plugin có mối quan hệ gì?
- Tại sao các dự án làm việc nhóm được khuyến nghị commit cả Maven Wrapper?
- Các dependency scope như `compile`, `provided`, `runtime`, `test` khác nhau ở điểm nào?
- Tại sao dự án đa module thường cần một parent POM?

## Chuyên đề liên quan

- [Hệ thống kiến thức Công cụ phát triển](../)
- [Tổng kết khái niệm cốt lõi Gradle](../gradle/gradle-core-concepts.md)
- [Chuyên đề Git](../git/)
- [Java cơ bản](../../java/basis/java-basic-questions-01.md)
