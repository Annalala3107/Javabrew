---
title: "Hệ thống kiến thức Công cụ phát triển: Maven, Gradle, Git, GitHub, Docker và IDEA"
description: "Lộ trình học tập công cụ phát triển Backend, bao gồm Maven, Gradle, Git, GitHub, Docker, IDEA, build dự án, quản lý dependency, kiểm soát phiên bản, cộng tác mã nguồn và triển khai container hóa."
category: Công cụ phát triển
tag:
  - Công cụ phát triển
  - Maven
  - Git
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Công cụ phát triển,Maven,Gradle,Git,GitHub,Docker,IDEA,Quản lý dependency,Build dự án,Kiểm soát phiên bản,Triển khai container hóa,Phát triển Backend
lang: vi
sourceRef: zh-ref/tools/README.md
---

Tài liệu **Hệ thống kiến thức Công cụ phát triển** này hướng tới việc học Backend và phát triển hằng ngày, tổng hợp các bài viết về công cụ phát triển trên trang theo trình tự "Build dự án -> Quản lý dependency -> Kiểm soát phiên bản -> Tăng hiệu suất cộng tác -> Bàn giao container hóa".

Công cụ phát triển không chỉ dừng lại ở việc gõ vài câu lệnh, mà quan trọng hơn là hiểu vai trò của chúng trong cộng tác nhóm, quy chuẩn kỹ thuật, tính nhất quán môi trường và hiệu quả bàn giao phần mềm.

## Phù hợp với ai

- Các bạn đang học phát triển Backend và cần bổ sung kiến thức về các công cụ kỹ thuật thông dụng.
- Độc giả đang chuẩn bị phỏng vấn cho vị trí mới tốt nghiệp hoặc đã có kinh nghiệm, muốn trả lời chắc chắn hơn các câu hỏi về Maven, Git, Docker, v.v.
- Lập trình viên đã viết được code nghiệp vụ nhưng chưa thành thạo xử lý xung đột dependency, cộng tác nhánh Git, quản lý Docker image và container.
- Kỹ sư muốn nâng cao hiệu suất build dự án, cộng tác mã nguồn, bàn giao môi trường và phát triển phần mềm hằng ngày.

## Trọng tâm học tập

- Maven và Gradle giải quyết các bài toán về build dự án, quản lý dependency, lifecycle (vòng đời), Wrapper và mở rộng bằng plugin.
- Git là năng lực nền tảng cho cộng tác nhóm; trọng tâm không phải là học thuộc lệnh, mà là hiểu vùng làm việc (working directory), vùng staging (staging area), commit, branch, merge và xử lý xung đột.
- GitHub không chỉ là nền tảng lưu trữ mã nguồn, mà còn hỗ trợ cộng tác mã nguồn mở, xây dựng hồ sơ cá nhân, đọc mã nguồn, tự động hóa với Actions và quản lý dự án.
- Docker chủ yếu giải quyết vấn đề nhất quán môi trường, cô lập triển khai, phân phối image, dựng nhanh dịch vụ phụ thuộc ở local và điều phối ứng dụng nhiều container.
- Kiến thức về công cụ nên được thực hành gắn với dự án thực tế; nếu chỉ đọc khái niệm đơn lẻ sẽ rất dễ rơi vào tình trạng đọc thì hiểu nhưng khi làm lại lúng túng.

## Thứ tự đọc khuyến nghị

1. [Tổng kết khái niệm cốt lõi Git](./git/git-intro.md): Nắm vững kiểm soát phiên bản, commit, branch, merge và quy trình cộng tác trước.
2. [Tổng kết khái niệm cốt lõi Maven](./maven/maven-core-concepts.md): Hiểu về build dự án Java, POM, tọa độ (coordinates), repository, dependency và lifecycle.
3. [Thực hành tốt nhất với Maven (Best Practices)](./maven/maven-best-practices.md): Bổ sung kiến thức về quản lý phiên bản dependency, BOM, Maven Wrapper, CI và quy chuẩn sử dụng hằng ngày.
4. [Tổng kết khái niệm cốt lõi Docker](./docker/docker-intro.md): Xây dựng nhận thức cơ bản về image, container, registry và Docker Engine.
5. [Docker thực chiến](./docker/docker-in-action.md): Thực hành quản lý container, build image, volume và xử lý sự cố phổ biến qua câu lệnh và tình huống thực tế.
6. [Tổng kết khái niệm cốt lõi Gradle](./gradle/gradle-core-concepts.md) và [Tổng hợp mẹo hay thực tế trên GitHub](./git/github-tips.md): Bổ sung kiến thức về Gradle Wrapper, GitHub Actions và kỹ năng đọc mã nguồn tùy theo nhu cầu dự án.

## Bài viết cốt lõi

### Build dự án và quản lý dependency

- [Chuyên đề Maven](./maven/): Giải thích rõ các khái niệm cốt lõi và thực hành tốt nhất của Maven; đây là chuyên đề công cụ build được sử dụng phổ biến nhất trong các dự án Java Backend.
- [Tổng kết khái niệm cốt lõi Maven](./maven/maven-core-concepts.md): Hiểu về POM, tọa độ, repository, dependency scope, lifecycle, plugin và dự án đa module (multi-module).
- [Thực hành tốt nhất với Maven (Best Practices)](./maven/maven-best-practices.md): Tổng hợp cấu trúc thư mục chuẩn, phiên bản biên dịch, quản lý dependency, Maven Wrapper, CI và các khuyến nghị thực hành phổ biến.
- [Tổng kết khái niệm cốt lõi Gradle](./gradle/gradle-core-concepts.md): Tìm hiểu các khái niệm cốt lõi như Gradle, Groovy/Kotlin DSL, Gradle Wrapper, plugin và Task.

### Kiểm soát phiên bản và cộng tác mã nguồn

- [Chuyên đề Git](./git/): Triển khai xoay quanh các khái niệm cốt lõi của Git, workflow và mẹo nâng cao hiệu suất với GitHub.
- [Tổng kết khái niệm cốt lõi Git](./git/git-intro.md): Hiểu về kiểm soát phiên bản, vùng làm việc, vùng staging, commit, branch, merge, xung đột và remote repository.
- [Tổng hợp mẹo hay thực tế trên GitHub](./git/github-tips.md): Tổng hợp các mẹo liên quan đến trang cá nhân, huy hiệu dự án (badge), đọc mã nguồn, Actions, Explore/Trending và cộng tác mã nguồn mở.

### Container hóa và môi trường local

- [Chuyên đề Docker](./docker/): Đi từ khái niệm cốt lõi đến thao tác thực chiến, giúp bạn hiểu về bàn giao container hóa và tính nhất quán môi trường.
- [Tổng kết khái niệm cốt lõi Docker](./docker/docker-intro.md): Hiểu về container, image, registry, Docker Engine cũng như sự khác biệt giữa container và máy ảo (VM).
- [Docker thực chiến](./docker/docker-in-action.md): Hoàn thành bước nhập môn thực hành Docker thông qua các lệnh về image, container, mạng, volume, log và gỡ lỗi.

### IDE và công cụ nâng cao hiệu suất

- [Hướng dẫn IDEA](https://gitee.com/SnailClimb/awesome-idea-tutorial): Tổng hợp cấu hình thường dùng, plugin, phím tắt và mẹo nâng cao hiệu suất cho IntelliJ IDEA.

## Câu hỏi tần suất cao

- POM, tọa độ, repository và dependency scope trong Maven lần lượt là gì?
- Vòng đời (lifecycle) Maven và plugin có mối quan hệ như thế nào?
- Dự án Maven đa module quản lý các dependency dùng chung và phiên bản build thông qua BOM, `dependencyManagement` và Maven Wrapper như thế nào?
- Gradle và Maven có gì khác nhau? Khi nào cần tìm hiểu Gradle?
- Vùng làm việc, vùng staging, local repository và remote repository trong Git lần lượt là gì?
- `git merge` và `git rebase` có gì khác nhau? Nên xử lý xung đột như thế nào?
- Ngoài lưu trữ mã nguồn, GitHub còn có thể giúp lập trình viên làm những gì thông qua Profile README, Actions, Codespaces và Explore/Trending?
- Docker image và container có mối quan hệ gì? Container và máy ảo (VM) khác nhau ở đâu?
- Tại sao Docker giải quyết được vấn đề không đồng nhất giữa môi trường phát triển, kiểm thử và triển khai? Compose phù hợp để giải quyết vấn đề gì?

## Chuyên đề liên quan

- [Java cơ bản](../java/basis/java-basic-questions-01.md)
- [Spring & Spring Boot](../system-design/framework/spring/)
