---
title: Hướng dẫn ngắn gọn về Công nghệ phần mềm
description: Giải thích chi tiết kiến thức nền tảng về Công nghệ phần mềm, bao gồm khủng hoảng phần mềm, mô hình quy trình phát triển phần mềm, mô hình thác nước (Waterfall) và phát triển linh hoạt (Agile).
category: Thiết kế hệ thống (System Design)
head:
  - - meta
    - name: keywords
      content: Công nghệ phần mềm,Khủng hoảng phần mềm,Quy trình phát triển phần mềm,Mô hình thác nước,Phát triển Agile,Phân tích yêu cầu,Vòng đời phần mềm,Phương pháp kỹ nghệ hóa
lang: vi
sourceRef: zh-ref/system-design/basis/software-engineering.md
---

Phần lớn những người làm phát triển phần mềm thường bỏ qua một số khái niệm cơ bản và nền tảng nhất trong phát triển phần mềm. Tuy nhiên, những khái niệm này lại vô cùng quan trọng đối với phát triển phần mềm—giống như viên đá tảng vậy. Đây cũng là lý do tôi viết bài này.

## Công nghệ phần mềm là gì?

Năm 1968, NATO (Tổ chức Hiệp ước Bắc Đại Tây Dương) đã đưa ra thuật ngữ **Khủng hoảng phần mềm (Software Crisis)**. Cùng năm đó, để giải quyết vấn đề khủng hoảng phần mềm, khái niệm "**Công nghệ phần mềm (Software Engineering)**" ra đời, kéo theo sự hình thành của một ngành học mang tên Công nghệ phần mềm.

Theo thời gian, ngành Công nghệ phần mềm cũng đã trải qua nhiều vòng hoàn thiện, và các nội dung cốt lõi của nó như các mô hình phát triển phần mềm ngày càng trở nên phong phú và thiết thực hơn!

**Khủng hoảng phần mềm là gì?**

Nói đơn giản, khủng hoảng phần mềm mô tả một nỗi đau lớn trong phát triển phần mềm thời bấy giờ: chúng ta rất khó phát triển được phần mềm chất lượng cao một cách hiệu quả.

Dijkstra (tác giả của thuật toán Dijkstra) trong bài phát biểu nhận giải Turing năm 1972 cũng từng nhắc tới khủng hoảng phần mềm, ông nói như sau: "Nguyên nhân chính dẫn đến khủng hoảng phần mềm là máy móc đã trở nên mạnh mẽ hơn vài bậc độ lớn! Nói thẳng ra là: hễ chưa có máy móc thì việc lập trình hoàn toàn chẳng có vấn đề gì. Khi chúng ta mới có những chiếc máy tính yếu ớt, lập trình chỉ là một vấn đề nhẹ nhàng; còn bây giờ khi đã có những chiếc máy tính khổng lồ, lập trình cũng theo đó trở thành một vấn đề khổng lồ tương ứng."

**Nói nhiều như vậy, rốt cuộc Công nghệ phần mềm là gì?**

Kỹ nghệ (Engineering) là việc áp dụng lý thuyết vào thực tiễn để giải quyết các bài toán thực tế. Công nghệ phần mềm chính là việc áp dụng tư duy kỹ thuật (Engineering) vào phát triển phần mềm.

Trên đây là định nghĩa của tôi về công nghệ phần mềm; bây giờ hãy xem một định nghĩa mang tính chuẩn mực hơn. Định nghĩa do IEEE Std 610.12-1990 (*Bảng thuật ngữ tiêu chuẩn về Công nghệ phần mềm của IEEE*) đưa ra là: (1) Áp dụng một phương pháp tiếp cận có hệ thống, chuẩn mực và có thể định lượng vào quá trình phát triển, vận hành và bảo trì phần mềm; tức là áp dụng phương pháp kỹ nghệ hóa vào phần mềm. (2) Nghiên cứu về các phương pháp được đề cập trong mục (1).

Tóm lại, mục tiêu tối thượng của công nghệ phần mềm là: **với mức tiêu hao tài nguyên ít hơn, tạo ra phần mềm tốt hơn và dễ bảo trì hơn.**

## Quy trình phát triển phần mềm

[Wikipedia định nghĩa quy trình phát triển phần mềm](https://zh.wikipedia.org/wiki/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91%E8%BF%87%E7%A8%8B) như sau:

> Quy trình phát triển phần mềm (tiếng Anh: software development process), hay quy trình phần mềm (software process), là vòng đời phát triển phần mềm (software development life cycle), mà các giai đoạn của nó thực hiện việc xác định và phân tích yêu cầu, thiết kế, hiện thực (lập trình), kiểm thử, bàn giao và bảo trì phần mềm. Quy trình phần mềm là các bước cần tuân theo khi phát triển và xây dựng hệ thống, là lộ trình cho việc phát triển phần mềm.

- Phân tích yêu cầu (Requirements Analysis): Phân tích nhu cầu của người dùng, xây dựng mô hình logic.
- Thiết kế phần mềm (Software Design): Thiết kế kiến trúc phần mềm dựa trên kết quả phân tích yêu cầu.
- Lập trình (Coding): Viết mã nguồn để chạy chương trình.
- Kiểm thử (Testing): Xác định các ca kiểm thử (Test Case), viết báo cáo kiểm thử.
- Bàn giao (Delivery): Bàn giao phần mềm đã hoàn thiện cho khách hàng.
- Bảo trì (Maintenance): Bảo trì phần mềm, chẳng hạn như sửa bug, hoàn thiện thêm tính năng.

Quy trình phát triển phần mềm chỉ mới định nghĩa ở mức độ khá khái quát các công đoạn mà một dự án phát triển phần mềm có thể liên quan.

Các mô hình phát triển phần mềm định nghĩa cụ thể hơn về quy trình phát triển phần mềm, cung cấp nền tảng lý thuyết vững chắc cho quy trình phát triển.

## Các mô hình phát triển phần mềm

Có rất nhiều mô hình và phương pháp phát triển phần mềm, như Mô hình thác nước (Waterfall Model), Mô hình nguyên mẫu nhanh (Rapid Prototype Model), Mô hình chữ V (V-model), Mô hình chữ W (W-model) và phương pháp phát triển linh hoạt (Agile). Trong đó tiêu biểu nhất vẫn là **Mô hình thác nước** và **Phát triển Agile**.

**Mô hình thác nước (Waterfall Model)** định nghĩa một chu kỳ phát triển phần mềm hoàn chỉnh, thể hiện trọn vẹn vòng đời của một phần mềm.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/up-264f2750a3d30366e36c375ec3a30ec2775-e828743b.png)

**Phát triển linh hoạt (Agile Development)** không phải là một mô hình phát triển phần mềm đơn lẻ, mà là một tập hợp các giá trị và nguyên tắc; các phương pháp cụ thể phổ biến gồm có Scrum, Extreme Programming (XP) và Kanban,... Agile đề cao cá nhân và sự tương tác, phần mềm chạy được, sự hợp tác với khách hàng và khả năng phản hồi với thay đổi, đồng thời liên tục thu nhận phản hồi thông qua các vòng lặp (Iteration) và bàn giao thường xuyên.

**Tích hợp liên tục (Continuous Integration)**, **Refactor**, **Phát hành phiên bản nhỏ (Small Releases)**, **Lập trình cặp (Pair Programming)** và **Phát triển hướng kiểm thử (TDD)** là các thực hành kỹ thuật phổ biến trong Extreme Programming (XP), còn **Họp đứng hằng ngày (Stand-up Meeting)** thường gặp trong Scrum—chúng không phải là các thực hành bắt buộc ở mọi phương pháp Agile. Phát triển Agile cũng không đồng nghĩa với ít tài liệu, mà là coi trọng phần mềm chạy được hơn, đồng thời vẫn giữ lại những tài liệu cần thiết và có giá trị.

## Các chiến lược cơ bản trong phát triển phần mềm

### Tái sử dụng phần mềm (Software Reuse)

Khi xây dựng một phần mềm mới, chúng ta không cần bắt đầu lại từ con số 0. Bằng cách tái sử dụng các thành phần có sẵn (Framework, thư viện bên thứ ba,...), Design Patterns, các nguyên tắc thiết kế cùng nhiều tài nguyên sẵn có khác, chúng ta có thể xây dựng nhanh hơn một phần mềm đáp ứng yêu cầu.

Các dự án mã nguồn mở mà chúng ta tiếp xúc hằng ngày chính là ví dụ rõ ràng nhất. Tôi nghĩ nếu không có mã nguồn mở, công sức và thời gian chúng ta phải bỏ ra để xây dựng một phần mềm đáp ứng yêu cầu sẽ lớn hơn hiện tại rất nhiều lần!

### Chia để trị (Divide and Conquer)

Trong quá trình xây dựng phần mềm, chúng ta sẽ gặp rất nhiều vấn đề phức tạp. Chúng ta có thể tách các bài toán lớn phức tạp thành nhiều bài toán nhỏ, rồi lần lượt giải quyết từng phần một.

Hãy liên hệ với phương pháp thiết kế phần mềm đang rất thịnh hành hiện nay—Domain-Driven Design (Thiết kế hướng miền, viết tắt là DDD)—để nói rõ hơn.

Trong Domain-Driven Design, một khái niệm rất quan trọng là **Miền (Domain)**, chính là bài toán mà chúng ta cần giải quyết. Điều cần làm trong DDD là tách một Domain (bài toán) tương đối lớn thành nhiều Domain nhỏ hơn (Subdomain - miền con).

Ngoài ra, chia để trị cũng là một tư tưởng thuật toán rất phổ biến, tương ứng với thuật toán Chia để trị (Divide and Conquer). Nếu muốn tìm hiểu về thuật toán Chia để trị, bạn có thể tham khảo khóa học [*Design and Analysis of Algorithms*](https://www.coursera.org/learn/algorithms) của Đại học Bắc Kinh.

### Tiến hóa từng bước (Incremental Evolution)

Phát triển phần mềm là một quá trình tiến hóa từng bước: chúng ta cần liên tục phát triển theo hướng lặp và tăng dần (Iterative & Incremental), cuối cùng bàn giao sản phẩm mang lại giá trị phù hợp cho khách hàng.

Ở đây bổ sung một khái niệm rất quan trọng trong lĩnh vực phát triển phần mềm: **MVP (Minimum Viable Product - Sản phẩm khả dụng tối thiểu)**.

Sản phẩm khả dụng tối thiểu là phiên bản sản phẩm giúp thu được nhiều nhận thức đã được kiểm chứng nhất về khách hàng với chi phí bỏ ra ít nhất, nhằm nhanh chóng kiểm chứng các giả định then chốt, chứ không nhất thiết phải là một sản phẩm đáp ứng trọn vẹn mọi nhu cầu của khách hàng. Hình dưới đây minh họa tư tưởng này rất tinh tế.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/schedule-task/up-a99961ff7725106c0592abca845d555568a-48620d5b.png)

Tận dụng MVP, chúng ta còn có thể sớm thực hiện phân tích thị trường—điều này vô cùng hữu ích trên hành trình khám phá tính bất định của sản phẩm, giúp định hướng rất hiệu quả cho bước đi tiếp theo của chúng ta.

### Tối ưu hóa và Đánh đổi (Optimization & Trade-offs)

Phát triển phần mềm là một quá trình không ngừng tối ưu và cải tiến. Bất kỳ phần mềm nào cũng có rất nhiều điểm có thể tối ưu, không thể nào hoàn hảo tuyệt đối. Chúng ta cần liên tục cải tiến và nâng cao chất lượng phần mềm.

Tuy nhiên, cũng đừng rơi vào cái vòng luẩn quẩn của chủ nghĩa hoàn hảo. Hãy biết cách đánh đổi (Trade-off), trong phạm vi nguồn lực đầu tư hữu hạn mà nâng cao chất lượng phần mềm hiện có theo cách hiệu quả nhất.

## Tài liệu tham khảo

- [IEEE Std 610.12-1990: IEEE Standard Glossary of Software Engineering Terminology](https://standards.ieee.org/ieee/610.12/855/)
- [Tuyên ngôn Phát triển phần mềm Linh hoạt (Manifesto for Agile Software Development)](https://agilemanifesto.org/)
- [Minimum Viable Product: a guide - Eric Ries](https://www.startuplessonslearned.com/2009/08/minimum-viable-product-guide.html)
- Khái niệm cơ bản về Công nghệ phần mềm - Lưu Cường, Khoa Phần mềm Đại học Thanh Hoa: <https://www.xuetangx.com/course/THU08091000367>
- Quy trình phát triển phần mềm - Wikipedia: <https://zh.wikipedia.org/wiki/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91%E8%BF%87%E7%A8%8B>
