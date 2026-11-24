---
title: Unit Test thực chất là gì? Nên thực hiện thế nào?
description: Hướng dẫn nhập môn Unit Test, bao gồm khái niệm Unit Test, kỹ thuật Mock và Stub, Kim tự tháp kiểm thử và cách sử dụng framework kiểm thử JUnit.
category: Chất lượng code
head:
  - - meta
    - name: keywords
      content: Unit Test,Kiểm thử đơn vị,Mock,Stub,Fake,Kim tự tháp kiểm thử,Khả năng kiểm thử,TDD,JUnit
lang: vi
sourceRef: zh-ref/system-design/basis/unit-test.md
---

> Bài viết này được viết lại và hoàn thiện từ bài [Bàn về lý do viết Unit Test - Bàn Phím Nam - 2016](https://www.jianshu.com/p/fa41fb80d2b8).

## Unit Test là gì?

Wikipedia giới thiệu về Unit Test (kiểm thử đơn vị) như sau:

> Trong lập trình máy tính, kiểm thử đơn vị (Unit Testing) là hoạt động kiểm tra tính đúng đắn đối với các module chương trình (đơn vị nhỏ nhất trong thiết kế phần mềm).
>
> Đơn vị chương trình là **thành phần nhỏ nhất có thể kiểm thử được** của ứng dụng. Trong lập trình thủ tục, một đơn vị là một chương trình đơn lẻ, một hàm hoặc một thủ tục; đối với lập trình hướng đối tượng (OOP), đơn vị nhỏ nhất là phương thức, bao gồm các phương thức trong lớp cơ sở (lớp cha), lớp trừu tượng (Abstract Class) hoặc lớp dẫn xuất (lớp con).

Do mỗi đơn vị có logic độc lập riêng, khi thực hiện Unit Test, để cô lập các phụ thuộc bên ngoài (External Dependencies) nhằm đảm bảo những phụ thuộc này không làm ảnh hưởng đến việc kiểm chứng logic, chúng ta thường sử dụng Fake, Stub và Mock.

Về giải thích các khái niệm Fake, Mock và Stub, bạn có thể tham khảo thêm bài viết này: [Làm rõ khái niệm Fakes, Mocks và Stubs trong kiểm thử - Vương Hạ Yêu Nguyệt Hùng - 2018](https://zhuanlan.zhihu.com/p/26942686).

## Vì sao cần Unit Test?

### Bảo vệ quá trình Refactor

Trong bài viết [Hướng dẫn Refactor code](./refactoring.md), tôi từng viết như sau:

> Unit Test giúp bạn tự tin hơn khi Refactor và giảm thiểu chi phí Refactor. Chúng ta cần coi trọng Unit Test không kém gì code Production.

Mỗi lập trình viên đều sẽ trải qua việc Refactor, và chuyện sửa hỏng code sau khi Refactor không hề hiếm gặp—rất có thể bạn chỉ sửa một phương thức rất đơn giản thôi nhưng lại khiến hệ thống phát sinh lỗi khá nghiêm trọng.

Unit Test có thể kịp thời phát hiện một phần lỗi logic, giảm thiểu rủi ro gây ra lỗi hồi quy (Regression) khi Refactor. Viết xong một lớp thì bổ sung Unit Test cho nó; viết lớp thứ hai thì tiếp tục bổ sung Unit Test... Tuy nhiên, việc từng lớp riêng lẻ vượt qua bài test không đồng nghĩa rằng khi ghép chúng lại với nhau sẽ chắc chắn không có vấn đề; các vấn đề về khế ước giao tiếp (Interface Contract), cấu hình, cơ sở dữ liệu, mạng và Transaction vẫn cần được phát hiện thông qua Integration Test, End-to-End Test,...

### Nâng cao chất lượng code

Vì mỗi đơn vị có logic độc lập nên khi làm Unit Test cần cô lập các phụ thuộc bên ngoài, đảm bảo chúng không ảnh hưởng đến việc kiểm chứng logic. Chính vì phải tách rời các phụ thuộc khác nhau, Unit Test sẽ thúc đẩy dự án tách nhỏ Component và sắp xếp lại các mối quan hệ phụ thuộc trong dự án, giảm đáng kể sự ràng buộc (Coupling) trong code. Code được viết ra theo cách này sẽ dễ bảo trì, dễ mở rộng hơn, từ đó nâng cao chất lượng code.

### Giảm thiểu Bug

Một cỗ máy được cấu thành từ nhiều linh kiện nhỏ bé; nếu một linh kiện nào đó hỏng, cỗ máy sẽ gặp sự cố khi vận hành. Phải đảm bảo từng linh kiện đều đạt đúng thông số trên bản vẽ thiết kế thì cỗ máy mới chạy ổn định được.

Một dự án có thể viết Unit Test sẽ chia tách nghiệp vụ và tính năng thành những thành phần logic độc lập có quy mô nhỏ hơn, gọi là đơn vị (Unit). Mục tiêu của Unit Test là xác minh xem từng đơn vị có hoạt động đúng như kỳ vọng hay không, từ đó giảm xác suất xuất hiện lỗi logic cục bộ và lỗi hồi quy. Việc toàn bộ dự án có vận hành đúng đắn hay không vẫn cần các tầng kiểm thử khác phối hợp xác minh.

### Định vị Bug nhanh chóng

Nếu chương trình có bug, chúng ta chỉ cần chạy toàn bộ Unit Test một lần, tìm ra những bài test bị lỗi là có thể nhanh chóng định vị tới đoạn code thực thi tương ứng. Sau khi sửa code xong, chạy lại Unit Test tương ứng; nếu vẫn chưa đạt thì sửa tiếp, chạy test tiếp... cho đến khi **test vượt qua (Pass)**.

### Continuous Integration (CI) phụ thuộc vào kiểm thử tự động

Tích hợp liên tục (Continuous Integration) cần dựa vào các bài kiểm thử tự động nhanh và đáng tin cậy. Khi dịch vụ CI tự động build code mới, nó sẽ tự động chạy Unit Test, Integration Test,... để phát hiện lỗi trong code, trong đó Unit Test thường là tầng cho phản hồi nhanh nhất.

## Ai ép bạn viết Unit Test?

### Yêu cầu từ cấp trên

Một số quản lý kỹ thuật có kinh nghiệm ít nhiều đều sẽ yêu cầu nhóm viết Unit Test. Với những thành viên đã có kinh nghiệm làm việc nhất định, yêu cầu này rất hợp lý; nhưng với những bạn còn non kinh nghiệm hay mới ra trường thì chắc hẳn là "sống dở chết dở"—code còn viết chưa xong mà còn bắt viết Unit Test, *"are you kidding me?"*

Đào tạo người mới cách viết Unit Test là một nhiệm vụ đầy thử thách. Người mới chưa hình thành phong cách viết code ổn định và cũng chưa hiểu Unit Test quan trọng đến mức nào; ép viết Unit Test sẽ khiến họ bối rối, không thể viết code theo đúng mạch tư duy của bản thân.

### Các cao thủ đều viết Unit Test

Rất nhiều dự án mã nguồn mở nổi tiếng ở nước ngoài đều có lượng Unit Test đồ sộ, ví dụ [retrofit](https://link.jianshu.com?t=https://github.com/square/retrofit/tree/master/retrofit/src/test/java/retrofit2), [okhttp](https://link.jianshu.com?t=https://github.com/square/okhttp/tree/master/okhttp-tests/src/test/java/okhttp3), [butterknife](https://link.jianshu.com?t=https://github.com/JakeWharton/butterknife/tree/master/butterknife-compiler/src/test/java/butterknife)... Các cao thủ nước ngoài đều viết Unit Test, vậy chúng ta cũng viết đi!

Nhiều bạn đọc đều từng có suy nghĩ này, ban đầu hừng hực khí thế. Đến khi bắt tay vào viết Unit Test cho chính dự án của mình thì lại gặp muôn vàn trở ngại, phần lớn nguyên nhân là do dự án không thân thiện với Unit Test. Cuối cùng chỉ có thể viết Unit Test cho vài lớp tiện ích vô thưởng vô phạt, lâu dần nhiệt huyết ban đầu cũng chẳng đi đến đâu.

### Giữ thể diện

Đều là dân kỳ cựu có vài năm kinh nghiệm rồi mà ngày nào cũng bị các bạn Tester (QA) dí bug thì còn ra thể thống gì nữa? Bỏ thêm chút thời gian viết Unit Test để đảm bảo không dính mấy lỗi sơ đẳng, vừa thể hiện phong thái cao thủ, tội gì không làm?

### Không yên tâm về code của chính mình

Bản thân tác giả cũng là người không quá tin tưởng vào code của chính mình, lúc nào cũng cảm giác nhỡ đâu một góc nào đó bất ngờ mọc ra bug kỳ quặc, lại còn sợ người khác lỡ tay sửa nhầm code của mình (hội chứng hoang tưởng nhẹ), mỗi lần lên phiên bản mới là nơm nớp lo âu... Bỏ chút thời gian viết Unit Test, rảnh rỗi hay có việc lại chạy test một lượt để đảm bảo logic cũ vẫn ổn thỏa, ít nhất tối về cũng ngủ ngon hơn một chút.

## TDD - Phát triển hướng kiểm thử

### TDD là gì?

TDD là viết tắt của **Test-Driven Development (Phát triển hướng kiểm thử)**—đây vừa là một thực hành và kỹ thuật cốt lõi của Agile Development, vừa là một phương pháp luận thiết kế.

Nguyên lý của TDD là trước khi phát triển code tính năng, hãy viết code cho các ca kiểm thử (Test Case) trước, sau đó mới viết code tính năng xoay quanh các Test Case đó để làm sao cho test chạy qua.

Nhịp điệu của TDD là: **"Red - Green - Refactor"** (Đỏ - Xanh - Tái cấu trúc).

![](/media/jg/ext/static001.geekbang.org/image/09/7f/090e1fc6aff08b4aa66376f776c2337f-6caf50c2.webp)

Vì TDD đòi hỏi rất cao ở lập trình viên và đi ngược với tư duy lập trình truyền thống, nên việc triển khai trong thực tế tương đối khó khăn.

Trong mắt nhiều người, TDD có vẻ thiếu thực tế: một phần vì họ chưa hiểu đúng ý nghĩa của việc kiểm thử "dẫn dắt" (Driven) phát triển, nhưng quan trọng hơn là họ ít khi thực hiện chia nhỏ tác vụ (Task Decomposition). Trong khi đó, chia nhỏ tác vụ lại là điểm mấu chốt để làm tốt TDD. Chỉ khi chia nhỏ tác vụ tới mức có thể kiểm thử được thì mới có thể viết test một cách có chủ đích.

### Phân tích ưu và nhược điểm của TDD

Phát triển hướng kiểm thử vừa có ưu điểm vừa có nhược điểm. Bởi vì mỗi Test Case đều xuất phát từ yêu cầu—hoặc nói cách khác là tách một yêu cầu lớn thành nhiều yêu cầu nhỏ để viết Test Case—nên sau khi viết Test Case xong, code thực thi mà lập trình viên viết ra bắt buộc phải thỏa mãn Test Case đó. Nếu test không qua thì sửa code thực thi cho tới khi Test Case đạt yêu cầu.

**Ưu điểm**:

1. Giúp bạn hệ thống hóa yêu cầu, làm rõ mạch tư duy;
2. Giúp bạn thiết kế ra các Interface hợp lý hơn (nếu chỉ ngồi nghĩ suông thì rất dễ thiết kế ra những thứ thảm họa);
3. Giảm xác suất phát sinh bug trong code;
4. Nâng cao hiệu suất phát triển (với tiền đề sử dụng đúng cách và thành thạo TDD).

**Nhược điểm**:

1. Số người sử dụng tốt TDD rất ít—nhìn tưởng đơn giản nhưng thực tế rào cản rất cao;
2. Chi phí nguồn lực phát triển bỏ ra (thời gian và công sức) thường nhiều hơn;
3. Vì Test Case được viết trước khi thiết kế code nên rất dễ làm bó hẹp tư duy thiết kế tổng thể của lập trình viên;
4. Có thể gây ra tâm lý bất mãn ở lập trình viên—tôi thấy điểm này khá nghiêm trọng, xét cho cùng không phải ai cũng thích viết Unit Test, dù Unit Test mang lại cho chúng ta rất nhiều lợi ích.

Đọc thêm: [Cách tiếp cận TDD đúng đắn là gì? - Trần Thiên - 2017](https://zhuanlan.zhihu.com/p/24997923).

## Chọn Framework Unit Test và công cụ Mock như thế nào?

Đối với Unit Test, JUnit và Spock thuộc nhóm Framework kiểm thử, còn Mockito, PowerMock, JMockit, TestableMock,... chủ yếu dùng để tạo các đối tượng thay thế kiểm thử (Test Double) như Mock.

JUnit gần như là lựa chọn mặc định, nhưng bản thân nó không cung cấp khả năng Mock nên thường phải kết hợp cùng các công cụ Mock như Mockito. Trong khi đó, Spock cung cấp đồng thời cả quy chuẩn viết test lẫn khả năng Mock.

Rốt cuộc nên chọn JUnit kết hợp Mockito hay chọn Spock? Dưới đây là một vài so sánh nhanh của tôi:

- Spock 2.4 có thể giả lập (Mock) các phương thức tĩnh (`static`) của Java và Groovy thông qua `SpyStatic()` kết hợp với Mock Maker hỗ trợ phương thức tĩnh; từ Mockito 3.4.0 trở đi cũng đã hỗ trợ Mock phương thức tĩnh. Chi tiết có thể xem tại [Ghi chú phát hành Spock 2.4](https://spockframework.org/spock/docs/2.4/release_notes.html) và [Tài liệu chính thức của Mockito](https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html).
- Spock dựa trên Groovy nên code test viết ra rõ ràng, dễ đọc và chuẩn mực hơn (có sẵn quy chuẩn cấu trúc kiểm thử `given-when-then` quen thuộc). Mockito không ép buộc một quy chuẩn cấu trúc cụ thể nào, nên nhóm dự án cần tự quy ước hoặc tuân theo các thực hành viết code test tốt. Thông thường, cùng một Test Case thì code của Spock gọn gàng hơn.
- Mockito có cộng đồng người dùng rộng rãi hơn, ổn định và đáng tin cậy. Hơn nữa, Mockito là công cụ Mock được tích hợp mặc định trong Spring Boot Test.

Cả JUnit kết hợp Mockito lẫn Spock đều là những lựa chọn rất tốt; xét về tính phổ biến và khả năng áp dụng rộng rãi thì JUnit kết hợp Mockito nhỉnh hơn một chút.

## Tổng kết

Unit Test chắc chắn mang lại cho bạn rất nhiều lợi ích, chỉ là không thấy hiệu quả ngay lập tức mà thôi. Cũng giống như mua bảo hiểm bệnh hiểm nghèo vậy: đóng rất nhiều phí bảo hiểm, khỏe mạnh không đau ốm gì, mười mấy hay thậm chí vài chục năm chẳng dùng tới—tốt nhất là cả đời không bao giờ phải yêu cầu bồi thường, sức khỏe vẫn là quan trọng nhất. Unit Test cũng thế: viết vào để mua sự an tâm, là một lớp bảo đảm cho code; có bug thì phát hiện sớm, không có bug thì càng tốt, chẳng lẽ lại đi nói *"viết bao nhiêu Unit Test, kết quả chẳng bắt được con bug nào, tốn thời gian"* sao?

Dưới đây là một vài lời khuyên cá nhân về Unit Test:

> - Code càng quan trọng thì càng phải viết Unit Test;
> - Khi thấy code không thể viết Unit Test được, hãy suy nghĩ cách cải tiến thiết kế chứ đừng bỏ cuộc;
> - Vừa viết code nghiệp vụ vừa viết Unit Test, đừng đợi làm xong cả một tính năng mới rồi mới viết;
> - Chịu khó suy nghĩ cách cải tiến và đơn giản hóa code test;
> - Code test cần được Refactor hoặc chỉnh sửa cùng với sự tiến hóa của code Production; nếu không giữ cho bài test sạch sẽ gọn gàng, chúng sẽ ngày càng khó sửa đổi.

Là một lập trình viên có kinh nghiệm, viết Unit Test trước hết là **có trách nhiệm với chính code của mình**. Code có Test Case đi kèm thì người khác dễ đọc hiểu hơn, và sau này khi người khác tiếp nhận code của bạn, họ cũng có thể yên tâm sửa đổi.

**Hãy thực hành viết nhiều code hơn, trao đổi nhiều hơn với những kỹ sư có kinh nghiệm về Unit Test**, bạn sẽ thấy giá trị thu được từ việc viết Unit Test còn lớn hơn rất nhiều.
