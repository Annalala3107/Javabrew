---
title: Hướng dẫn Refactor code
description: Hướng dẫn thực hành Refactor code, bao gồm định nghĩa Refactor, nguyên tắc Refactor, nhận diện Code Smell cùng các kỹ thuật và thực hành tốt nhất thường dùng.
category: Chất lượng code
head:
  - - meta
    - name: keywords
      content: Refactor code,Kỹ thuật Refactor,Nguyên tắc Refactor,Design Patterns,SOLID,Code Smell,Khả năng bảo trì,Unit Test
lang: vi
sourceRef: zh-ref/system-design/basis/refactoring.md
---

Thời gian trước, tôi đọc lại cuốn [*Refactoring: Improving the Design of Existing Code* (Tái cấu trúc: Cải thiện thiết kế của mã nguồn hiện có)](https://book.douban.com/subject/30468597/) và thu hoạch được rất nhiều điều. Thế nên, tôi viết một bài ngắn chia sẻ góc nhìn của mình về Refactor.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220311155746549-102ce4a8.png)

## Refactor là gì?

Cuốn sách kinh điển bắt buộc phải đọc khi học Refactor là *Refactoring: Improving the Design of Existing Code* đưa ra định nghĩa về Refactor dưới hai góc độ:

> - Refactor (danh từ): Một sự điều chỉnh đối với cấu trúc bên trong của phần mềm, nhằm nâng cao tính dễ hiểu và giảm chi phí sửa đổi mà không làm thay đổi hành vi có thể quan sát được của phần mềm.
> - Refactor (động từ): Sử dụng hàng loạt kỹ thuật Refactor để điều chỉnh cấu trúc phần mềm mà không làm thay đổi hành vi có thể quan sát được của nó.

Diễn đạt theo ngôn ngữ gần gũi với kỹ sư hơn: **Refactor là quá trình thông qua hàng loạt bước điều chỉnh cấu trúc nhỏ để làm cho code dễ hiểu và dễ sửa đổi hơn, trên tiền đề không làm thay đổi hành vi có thể quan sát được của phần mềm.** Design Patterns và các nguyên tắc thiết kế phần mềm đóng vai trò định hướng cho việc Refactor, còn kiểm thử tự động (Automated Testing) là lớp bảo chứng quan trọng cho việc Refactor.

Các nguyên tắc thiết kế phần mềm hướng dẫn chúng ta tổ chức và chuẩn hóa code; đồng thời, mục đích của Refactor cũng là để cố gắng tạo ra phần mềm đáp ứng tối đa các nguyên tắc thiết kế phần mềm đó.

Cốt lõi của việc Refactor đúng cách nằm ở chỗ **bước đi phải thật nhỏ—mỗi bước Refactor đều không làm ảnh hưởng đến hoạt động bình thường của phần mềm, và có thể dừng Refactor bất cứ lúc nào.**

**Các Design Patterns phổ biến như sau**:

![Các Design Patterns phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/common-design-patterns-d21b921f.png)

Để xem tổng hợp đầy đủ hơn về Design Patterns, bạn có thể tham khảo dự án mã nguồn mở **[java-design-patterns](https://github.com/iluwatar/java-design-patterns)**.

**Các nguyên tắc thiết kế phần mềm phổ biến như sau**:

![Các nguyên tắc thiết kế phần mềm phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/programming-principles-27e032f4.png)

Để xem tổng hợp đầy đủ hơn về các nguyên tắc thiết kế, bạn có thể tham khảo hai dự án mã nguồn mở **[java-design-patterns](https://github.com/iluwatar/java-design-patterns)** và **[hacker-laws-zh](https://github.com/nusr/hacker-laws-zh)**.

## Vì sao phải Refactor?

Khi giới thiệu định nghĩa Refactor ở trên, tôi đã nêu lợi ích của Refactor ở góc độ khá trừu tượng: mục đích chính của Refactor là giúp code dễ hiểu hơn và giảm chi phí sửa đổi về sau.

Nếu áp vào một dự án thực tế, Refactor cụ thể mang lại cho chúng ta những lợi ích gì?

1. **Làm cho code dễ hiểu hơn**: Thông qua việc bổ sung chú thích hợp lý, chuẩn hóa đặt tên, tối ưu hóa logic,... code sẽ trở nên dễ đọc và dễ nắm bắt hơn.
2. **Tránh sự thối rữa của code (Code Rot)**: Loại bỏ các đoạn code mang "mùi xấu" (Code Smell) thông qua Refactor.
3. **Hiểu sâu hơn về code**: Quá trình Refactor sẽ giúp bạn hiểu sâu sắc hơn về một phần code nào đó.
4. **Phát hiện các bug tiềm ẩn**: Đúng vậy, rất nhiều bug tiềm ẩn đã được chúng ta phát hiện ra ngay trong quá trình Refactor.
5. ......

Sau khi xem những lợi ích mà Refactor mang lại ở trên, bạn sẽ nhận ra mục tiêu cuối cùng của Refactor là **nâng cao tốc độ và chất lượng phát triển phần mềm**.

Refactor không hề làm chậm tốc độ phát triển phần mềm. Ngược lại, nếu chất lượng code và thiết kế phần mềm kém, mỗi khi muốn thêm tính năng mới, tốc độ phát triển sẽ ngày càng chậm lại. Tới cuối cùng, thậm chí bạn còn nảy sinh thôi thúc muốn viết lại toàn bộ hệ thống từ đầu.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/bad-good-design-039e0129.png)

Cuốn *Refactoring: Improving the Design of Existing Code* viết rằng:

> Mục đích duy nhất của Refactor là giúp chúng ta phát triển nhanh hơn, tạo ra giá trị lớn hơn với ít công sức hơn.

## Tối ưu hóa hiệu năng có phải là Refactor không?

Mục đích của Refactor là nâng cao tính dễ đọc, khả năng bảo trì và tính linh hoạt của code; nó tập trung vào cấu trúc bên trong của code—làm sao để lập trình viên dễ hiểu code hơn, làm sao để việc phát triển tính năng mới và bảo trì sau này hiệu quả hơn. Trong khi đó, tối ưu hóa hiệu năng (Performance Optimization) nhằm giúp code chạy nhanh hơn và tiêu tốn ít tài nguyên hơn; nó tập trung vào biểu hiện bên ngoài của chương trình—làm sao giảm thời gian phản hồi, giảm tiêu thụ tài nguyên và tăng thông lượng hệ thống. Hai việc này thoạt nhìn có vẻ đối lập, nhưng thực chất mục tiêu của chúng là thống nhất: đều nhằm nâng cao chất lượng tổng thể của phần mềm.

Trong phát triển thực tế, cách làm lý tưởng là trước tiên **đảm bảo tính dễ đọc và khả năng bảo trì của code**, sau đó mới lựa chọn các biện pháp tối ưu hóa hiệu năng phù hợp theo nhu cầu thực tế. Một thiết kế phần mềm xuất sắc không phải là mù quáng chạy theo hiệu năng tối đa, mà là tìm được điểm cân bằng giữa khả năng bảo trì và hiệu năng. Bằng cách này, chúng ta có thể xây dựng được những hệ thống phần mềm vừa **dễ quản lý**, vừa có **hiệu năng tốt**.

## Khi nào nên tiến hành Refactor?

Refactor có thể được thực hiện bất cứ lúc nào trong quá trình phát triển tùy theo tình hình thực tế, hoàn toàn không cần phải tách riêng một hay hai ngày chỉ để dành cho việc Refactor.

### Trước khi Commit code

Cuốn *Refactoring: Improving the Design of Existing Code* giới thiệu khái niệm **Quy tắc Hướng đạo sinh / Quy tắc khu cắm trại (Boy Scout Rule / Campground Rule)**:

> Khi lập trình, cần tuân theo quy tắc khu cắm trại: đảm bảo codebase lúc bạn rời đi luôn khỏe mạnh hơn lúc bạn mới đến.

Tư tưởng cốt lõi mà khái niệm này truyền tải thực ra rất đơn giản: trước khi bạn commit code, hãy dành một chút thời gian suy nghĩ xem lần commit này của mình khiến code dự án trở nên khỏe mạnh hơn, thối rữa hơn, hay chẳng thay đổi gì?

Chỉ khi mỗi thành viên trong đội ngũ dự án đều đảm bảo các lần commit của mình không làm code dự án xấu đi, thì code dự án mới phát triển theo chiều hướng lành mạnh.

**Khi chúng ta rời khỏi "khu cắm trại" (code dự án), xin đừng để lại rác (Code Smell)! Hãy cố gắng hết sức để đảm bảo khu cắm trại trở nên sạch sẽ hơn!**

### Trước và sau khi phát triển một tính năng mới

Sau khi phát triển xong một tính năng mới, chúng ta nên nhìn lại xem có chỗ nào có thể cải thiện được không. Trước khi thêm một tính năng mới, chúng ta có thể cân nhắc xem liệu có nên Refactor code hiện tại trước để việc phát triển tính năng mới trở nên dễ dàng hơn hay không.

Việc phát triển một tính năng mới không nên chỉ dừng lại ở mức kiểm tra tính năng chạy đúng là xong, mà chúng ta còn phải cố gắng đảm bảo chất lượng code.

Có một phép ẩn dụ về **hai chiếc mũ (Two Hats)**: trước khi phát triển tính năng mới, nếu nhận thấy Refactor sẽ giúp việc làm tính năng mới dễ hơn, tôi đội chiếc mũ Refactor lên. Refactor xong, tôi đổi lại chiếc mũ ban đầu để tiếp tục phát triển tính năng mới. Sau khi phát triển xong tính năng mới, tôi lại phát hiện code của mình khó hiểu, thế là tôi lại đội chiếc mũ Refactor lên. Trạng thái phát triển tốt nhất chính là liên tục chuyển đổi qua lại giữa Refactor và phát triển tính năng mới như vậy.

![Hai chiếc mũ khi Refactor](/media/jg/ext/oss.javaguide.cn/github/javaguide/refractor-two-hats-50767619.png)

### Sau khi Code Review

Code Review có thể nâng cao rất hiệu quả chất lượng tổng thể của code—nó giúp chúng ta phát hiện ra các Code Smell cũng như những chỗ có nguy cơ phát sinh lỗi. Hơn nữa, Code Review còn giúp các lập trình viên khác trong đội ngũ hiểu được module nghiệp vụ mà bạn phụ trách, tránh hiệu quả rủi ro phụ thuộc vào một cá nhân duy nhất (Single Point of Failure về nhân sự).

Sau một lần Code Review, code của bạn có thể sẽ nhận được rất nhiều gợi ý cải thiện quý giá.

### Refactor kiểu "nhặt rác"

Khi phát hiện ra Code Smell (rác), nếu chúng ta không muốn dừng ngang công việc hiện tại đang làm, nhưng cũng không muốn bỏ mặc đống rác đó, chúng ta có thể làm như sau:

- Nếu đống rác đó dễ Refactor, chúng ta có thể Refactor ngay lập tức.
- Nếu đống rác đó không dễ Refactor ngay, chúng ta có thể ghi chú lại, đợi khi hoàn thành nhiệm vụ hiện tại rồi quay lại Refactor nó.

### Trong lúc đọc hiểu code

Các bạn làm phát triển phần mềm hẳn đều rất thấu hiểu cảm giác này: chúng ta thường xuyên phải đọc code do người khác trong nhóm viết, và cũng thường xuyên phải đọc lại code do chính mình viết trước đây. Thời gian đọc code thường nhiều hơn hẳn so với thời gian viết code.

Trong lúc đọc hiểu code, nếu phát hiện ra một số Code Smell, chúng ta có thể tiến hành Refactor luôn.

Chẳng hạn khi bạn đọc một đoạn code do đồng nghiệp viết và nhận thấy logic đoạn code đó quá phức tạp, khó hiểu, trong khi bạn có cách viết tốt hơn, vậy thì bạn hoàn toàn có thể Refactor đoạn logic đó.

## Cần lưu ý những gì khi Refactor?

### Kiểm thử tự động là lưới an toàn cho việc Refactor

**Kiểm thử tự động (Automated Testing) giúp bạn tự tin hơn khi Refactor và giảm thiểu chi phí Refactor. Unit Test thường là tầng cho phản hồi nhanh nhất; Integration Test, Acceptance Test,... cũng cùng nhau tạo thành lưới an toàn. Chúng ta cần coi trọng code test không kém gì code Production.**

Ngoài ra, nói thêm một ý: tích hợp liên tục (Continuous Integration - CI) cũng phụ thuộc vào kiểm thử tự động nhanh và đáng tin cậy. Khi dịch vụ CI tự động build code mới, nó sẽ tự động chạy các bài test để phát hiện lỗi trong code.

**Thế nào mới được tính là Unit Test?** Định nghĩa trên mạng có rất nhiều, rất trừu tượng, dễ khiến người đọc bị rối. Tôi cho rằng định nghĩa Unit Test chủ yếu phụ thuộc vào dự án của bạn: một hàm hay thậm chí một lớp đều có thể được xem là một đơn vị (Unit). Ví dụ, chúng ta viết một phương thức tính tỷ suất sinh lời cổ phiếu cá nhân và viết riêng một bài Unit Test để xác minh tính đúng đắn của nó; hoặc trong code có một lớp chuyên trách che giấu dữ liệu (Data Masking) và chúng ta viết riêng một Unit Test cho lớp này để xác minh việc che giấu dữ liệu có đúng như kỳ vọng hay không.

**Unit Test cũng cần được Refactor hoặc chỉnh sửa.** Cuốn [*Clean Code: A Handbook of Agile Software Craftsmanship*](https://book.douban.com/subject/4199741/) viết như sau:

> Code test cần được sửa đổi cùng với sự tiến hóa của code Production; nếu không giữ được sự gọn gàng sạch sẽ cho các bài test, chúng sẽ ngày càng khó sửa đổi hơn.

### Đừng Refactor chỉ để mà Refactor

**Refactor nhất định phải mang lại giá trị cho dự án!** Trong một số trường hợp, chúng ta không nên tiến hành Refactor:

- Sau khi học một Design Pattern hoặc kỹ thuật thực hành nào đó, bất chấp tình hình thực tế của dự án mà cố tình nhét vào dự án (tránh lập trình sùng bái hình thức — Cargo Cult Programming).
- Khi tiến độ dự án đang gấp, lại đi Refactor code tầng dưới của một API mà dự án gọi tới (trong khi việc Refactor đó không mang lại giá trị đáng kể nào cho việc gọi API của dự án).
- Viết lại từ đầu dễ dàng và đỡ tốn công hơn so với Refactor.
- ......

### Tuân thủ phương pháp bài bản

Cuốn *Refactoring: Improving the Design of Existing Code* liệt kê nhiều Code Smell phổ biến (như code lặp lại — Duplicated Code, hàm quá dài — Long Function) và các kỹ thuật Refactor (như trích xuất hàm — Extract Function, trích xuất biến — Extract Variable, trích xuất lớp — Extract Class). Chúng ta nên dành thời gian học các kiến thức lý thuyết về Refactor này và thực hành áp dụng chúng vào code thực tế.

## Luyện tập Refactor như thế nào?

Ngoài việc rèn luyện nâng cao tay nghề thông qua quá trình Refactor code trong dự án thực tế, bạn còn có thể tận dụng những kênh sau:

- [Khi Refactor, tôi đang nghĩ những gì?](https://mp.weixin.qq.com/s/pFaFKMXzNCOuW2SD9Co40g): Bài viết này của đội ngũ kỹ thuật Zhuanzhuan tổng kết các kịch bản và phương pháp Refactor phổ biến.
- [Bài tập thực hành Refactor](https://linesh.gitbook.io/refactoring/): Dẫn dắt bạn từng bước học Refactor thông qua một vài tình huống nhỏ!
- [Trang web học Design Patterns + Refactor](https://refactoringguru.cn/): Học trực tuyến miễn phí về Refactor code, Design Patterns và nguyên tắc SOLID (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation và Dependency Inversion).
- [Tài liệu hướng dẫn Refactor code chính thức của IntelliJ IDEA](https://www.jetbrains.com/help/idea/refactoring-source-code.html#popular-refactorings): Hướng dẫn bạn cách sử dụng IntelliJ IDEA để thực hiện Refactor.

## Tài liệu tham khảo

- [Đọc lại *Refactoring* - ThoughtWorks Insights - 2020](https://insights.thoughtworks.cn/reread-refactoring/): Giới thiệu chi tiết các điểm trọng tâm của Refactor như Refactor từng bước nhỏ, Refactor kiểu nhặt rác, chủ yếu xoay quanh các khái niệm về Refactor.
- [Các kỹ thuật Refactor code thường gặp - VectorJin - 2021](https://juejin.cn/post/6954378167947624484): Trình bày cách thực hiện Refactor dưới góc độ nguyên tắc thiết kế phần mềm, Design Patterns, phân tầng code, quy chuẩn đặt tên,... khá thiên về thực chiến.
