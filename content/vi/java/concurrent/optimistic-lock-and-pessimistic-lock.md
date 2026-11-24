---
title: Giải thích chi tiết Khóa lạc quan và Khóa bi quan
description: "So sánh chuyên sâu giữa Khóa lạc quan (Optimistic Lock) và Khóa bi quan (Pessimistic Lock): giải thích chi tiết cài đặt khóa bi quan với synchronized/ReentrantLock, cơ chế khóa lạc quan bằng CAS/số phiên bản (version), phân tích kịch bản áp dụng, so sánh hiệu năng và gợi ý lựa chọn."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/optimistic-lock-and-pessimistic-lock.md
head:
  - - meta
    - name: keywords
      content: Khóa lạc quan,Khóa bi quan,Optimistic Lock,Pessimistic Lock,synchronized,ReentrantLock,CAS,cơ chế version,kiểm soát đồng thời,tối ưu khóa
---

Nếu liên hệ khóa bi quan (`Pessimistic Lock`) và khóa lạc quan (`Optimistic Lock`) với đời sống thực tế: khóa bi quan giống như một người có phần bi quan (cũng có thể gọi là lo xa, phòng bị trước), luôn giả định tình huống xấu nhất để tránh xảy ra sự cố. Còn khóa lạc quan giống như một người khá lạc quan, luôn giả định tình huống tốt nhất và nhanh chóng xử lý ngay trước khi vấn đề phát sinh.

## Khóa bi quan (`Pessimistic Lock`) là gì?

Khóa bi quan luôn giả định tình huống xấu nhất, cho rằng mỗi lần tài nguyên chia sẻ (shared resource) được truy cập đều sẽ xảy ra vấn đề (ví dụ dữ liệu chia sẻ bị sửa đổi). Do đó, mỗi lần lấy tài nguyên để thao tác đều sẽ khóa (lock) lại, khiến các Thread khác muốn lấy tài nguyên này phải bị chặn (block) cho đến khi người giữ khóa trước đó giải phóng khóa. Nói cách khác, **tài nguyên chia sẻ mỗi lần chỉ cấp cho một Thread sử dụng, các Thread khác bị chặn lại, dùng xong mới nhường tài nguyên cho Thread khác**.

Các khóa độc quyền (exclusive lock) trong Java như `synchronized` và `ReentrantLock` chính là hiện thực của tư tưởng khóa bi quan.

```java
public void performSynchronisedTask() {
    synchronized (this) {
        // Các thao tác cần đồng bộ
    }
}

private Lock lock = new ReentrantLock();
lock.lock();
try {
   // Các thao tác cần đồng bộ
} finally {
    lock.unlock();
}
```

Trong kịch bản đồng thời cao (high concurrency), tranh chấp khóa gay gắt sẽ khiến Thread bị chặn, số lượng lớn Thread bị chặn sẽ dẫn đến chuyển đổi ngữ cảnh (context switch) của hệ thống, làm tăng chi phí hiệu năng của hệ thống. Hơn nữa, khóa bi quan còn có thể tồn tại vấn đề Deadlock (khi thứ tự lấy khóa của các Thread không hợp lý), ảnh hưởng đến hoạt động bình thường của mã nguồn.

## Khóa lạc quan (`Optimistic Lock`) là gì?

Khóa lạc quan luôn giả định tình huống tốt nhất, cho rằng mỗi lần tài nguyên chia sẻ được truy cập sẽ không xảy ra vấn đề. Các Thread có thể thực thi liên tục mà không cần khóa cũng không cần chờ, chỉ khi xác nhận (commit) sửa đổi mới kiểm tra xem tài nguyên tương ứng (tức là dữ liệu) có bị Thread khác sửa đổi hay không (cách cụ thể có thể dùng cơ chế số phiên bản hoặc thuật toán CAS).

Trong Java, các lớp biến nguyên tử nằm trong package `java.util.concurrent.atomic` (như `AtomicInteger`, `LongAdder`) được cài đặt bằng **CAS** — một trong những cách triển khai khóa lạc quan.
![Tổng quan các lớp Atomic trong JUC](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/JUC-20230814005211968-8956b754.png)

```java
// LongAdder có hiệu năng tốt hơn AtomicInteger và AtomicLong trong kịch bản đồng thời cao
// Đánh đổi là tiêu tốn nhiều không gian bộ nhớ hơn (đổi không gian lấy thời gian)
LongAdder sum = new LongAdder();
sum.increment();
```

Trong kịch bản đồng thời cao, so với khóa bi quan, khóa lạc quan không có tình trạng tranh chấp khóa gây chặn Thread và cũng không có vấn đề Deadlock, nên về hiệu năng thường vượt trội hơn. Tuy nhiên, nếu xung đột xảy ra thường xuyên (tỷ lệ thao tác ghi rất cao), thao tác sẽ liên tục thất bại và thử lại (retry), điều này cũng ảnh hưởng rất lớn đến hiệu năng và khiến CPU tăng vọt.

Khi mức độ tranh chấp gay gắt, `LongAdder` sẽ phân tán việc cập nhật sang nhiều cell nội bộ, qua đó giảm xác suất tất cả Thread cùng tranh chấp một giá trị duy nhất; tuy nhiên việc cập nhật nội bộ vẫn có thể dùng CAS và thử lại, nên không loại bỏ hoàn toàn tranh chấp. Ngoài ra, giá trị do `sum()` trả về cũng không phải là một snapshot nhất quán nguyên tử với các thao tác cập nhật đồng thời.

Về mặt lý thuyết:

- Khóa bi quan thường được dùng nhiều hơn trong các trường hợp ghi nhiều (kịch bản nhiều ghi, tranh chấp gay gắt), nhằm tránh thất bại và thử lại liên tục gây ảnh hưởng hiệu năng. Tuy nhiên, các giải pháp như `LongAdder` — giảm xác suất thử lại bằng cách phân tán tranh chấp — cũng có thể được cân nhắc khi chỉ cần các ngữ nghĩa đặc thù như cộng dồn, nhưng vẫn cần đánh giá theo kịch bản thực tế.
- Khóa lạc quan thường được dùng nhiều hơn trong các trường hợp ghi ít (kịch bản nhiều đọc, ít tranh chấp), nhằm tránh việc khóa liên tục gây ảnh hưởng hiệu năng. Tuy nhiên, đối tượng mà khóa lạc quan hướng tới chủ yếu là một biến chia sẻ đơn lẻ (tham khảo các lớp biến nguyên tử trong package `java.util.concurrent.atomic`).

## Làm thế nào để triển khai Khóa lạc quan?

Khóa lạc quan thường được triển khai bằng cơ chế số phiên bản (version) hoặc thuật toán CAS; trong đó thuật toán CAS được dùng phổ biến hơn, điểm này cần đặc biệt lưu ý.

### Cơ chế số phiên bản (Version)

Thông thường, người ta thêm một trường số phiên bản dữ liệu `version` vào bảng dữ liệu, biểu thị số lần dữ liệu bị sửa đổi. Khi dữ liệu bị sửa đổi, giá trị `version` sẽ tăng lên 1. Khi Thread A muốn cập nhật giá trị dữ liệu, trong lúc đọc dữ liệu nó cũng đọc luôn giá trị `version`; khi gửi yêu cầu cập nhật, chỉ khi giá trị `version` đọc được lúc nãy bằng với giá trị `version` hiện tại trong cơ sở dữ liệu thì mới cập nhật, nếu không thì thử lại thao tác cập nhật cho đến khi cập nhật thành công.

**Ví dụ đơn giản**: Giả sử trong bảng thông tin tài khoản của cơ sở dữ liệu có một trường `version` với giá trị hiện tại là 1, và trường số dư tài khoản hiện tại (`balance`) là \$100.

1. Nhân viên thao tác A lúc này đọc dữ liệu ra (`version`=1), và trừ \$50 từ số dư tài khoản (\$100-\$50).
2. Trong quá trình nhân viên A đang thao tác, nhân viên thao tác B cũng đọc thông tin người dùng này (`version`=1), và trừ \$20 từ số dư tài khoản (\$100-\$20).
3. Nhân viên A hoàn tất chỉnh sửa, gửi số phiên bản dữ liệu (`version`=1) cùng số dư sau khi trừ (`balance`=\$50) lên cơ sở dữ liệu để cập nhật. Lúc này, do phiên bản dữ liệu gửi lên bằng với phiên bản hiện tại của bản ghi trong cơ sở dữ liệu, dữ liệu được cập nhật và `version` của bản ghi trong cơ sở dữ liệu được cập nhật thành 2.
4. Nhân viên B hoàn tất thao tác, cũng gửi phiên bản (`version`=1) cùng dữ liệu (`balance`=\$80) lên cơ sở dữ liệu để cập nhật. Tuy nhiên khi đối chiếu với phiên bản bản ghi trong cơ sở dữ liệu thì phát hiện phiên bản dữ liệu nhân viên B gửi lên là 1, còn phiên bản hiện tại của bản ghi trong cơ sở dữ liệu là 2, không thỏa mãn chiến lược khóa lạc quan "phiên bản gửi lên phải bằng phiên bản hiện tại mới được thực hiện cập nhật", nên yêu cầu cập nhật của nhân viên B bị từ chối.

Nhờ vậy đã tránh được khả năng nhân viên B dùng kết quả sửa đổi dựa trên dữ liệu cũ có `version`=1 để ghi đè lên kết quả thao tác của nhân viên A.

### Thuật toán CAS

CAS là viết tắt của **Compare And Swap (So sánh và Hoán đổi)**, được dùng để triển khai khóa lạc quan và được ứng dụng rộng rãi trong các framework lớn. Tư tưởng của CAS rất đơn giản: dùng một giá trị kỳ vọng để so sánh với giá trị của biến cần cập nhật, hai giá trị bằng nhau thì mới tiến hành cập nhật.

CAS là một thao tác nguyên tử (`atomic operation`), ở tầng dưới dựa vào một lệnh nguyên tử của CPU.

> **Thao tác nguyên tử** là thao tác nhỏ nhất không thể chia nhỏ hơn được nữa, tức là một khi thao tác đã bắt đầu thì không thể bị ngắt quãng cho đến khi thao tác hoàn tất.

CAS liên quan đến ba toán hạng:

- **V**: Giá trị biến cần cập nhật (Var)
- **E**: Giá trị kỳ vọng (Expected)
- **N**: Giá trị mới dự kiến ghi vào (New)

Khi và chỉ khi giá trị của V bằng E, CAS mới cập nhật giá trị của V thành giá trị mới N theo cách nguyên tử. Nếu không bằng, điều đó cho thấy đã có Thread khác cập nhật V, nên Thread hiện tại từ bỏ việc cập nhật.

**Ví dụ đơn giản**: Thread A muốn sửa giá trị biến `i` thành 6, giá trị ban đầu của `i` là 1 (V = 1, E = 1, N = 6, giả sử không tồn tại vấn đề ABA).

1. So sánh `i` với 1, nếu bằng nhau tức là chưa bị Thread khác sửa đổi, có thể thiết lập thành 6.
2. So sánh `i` với 1, nếu không bằng nhau tức là đã bị Thread khác sửa đổi, Thread hiện tại từ bỏ cập nhật, thao tác CAS thất bại.

Khi nhiều Thread cùng sử dụng CAS để thao tác trên một biến, chỉ có một Thread thắng và cập nhật thành công, các Thread còn lại đều thất bại; nhưng Thread thất bại sẽ không bị tạm dừng (suspend), mà chỉ được thông báo thất bại và được phép thử lại, tất nhiên cũng cho phép Thread thất bại từ bỏ thao tác.

Để tìm hiểu thêm về CAS, bạn có thể đọc bài viết này của tác giả: [Giải thích chi tiết CAS](./cas.md), trong đó trình bày chi tiết cách triển khai CAS trong Java cũng như một số vấn đề còn tồn tại của CAS.

## Tổng kết

Bài viết này đã giới thiệu chi tiết khái niệm về khóa lạc quan và khóa bi quan cũng như các cách triển khai phổ biến của khóa lạc quan:

- Khóa bi quan dựa trên giả định bi quan, cho rằng tài nguyên chia sẻ mỗi lần được truy cập đều sẽ phát sinh xung đột, nên mỗi lần thao tác đều sẽ khóa lại. Cơ chế khóa này khiến các Thread khác bị chặn cho đến khi khóa được giải phóng. `synchronized` và `ReentrantLock` trong Java là các cài đặt điển hình của khóa bi quan. Mặc dù khóa bi quan có thể tránh hiệu quả tranh chấp dữ liệu (data race), nhưng trong kịch bản đồng thời cao sẽ dẫn đến chặn Thread, chuyển đổi ngữ cảnh thường xuyên, từ đó ảnh hưởng đến hiệu năng hệ thống và còn có thể gây ra vấn đề Deadlock.
- Khóa lạc quan dựa trên giả định lạc quan, cho rằng tài nguyên chia sẻ mỗi lần được truy cập sẽ không phát sinh xung đột, nên không cần khóa, chỉ cần kiểm tra xem dữ liệu có bị Thread khác sửa đổi hay không khi xác nhận cập nhật. Các lớp như `AtomicInteger` và `LongAdder` trong Java triển khai khóa lạc quan thông qua thuật toán CAS (Compare-And-Swap). Khóa lạc quan tránh được tình trạng chặn Thread và vấn đề Deadlock, đạt hiệu năng vượt trội trong các kịch bản đọc nhiều ghi ít. Tuy nhiên trong trường hợp thao tác ghi thường xuyên, nó có thể dẫn đến rất nhiều lần thử lại và thất bại, làm ảnh hưởng đến hiệu năng.
- Khóa lạc quan chủ yếu được triển khai thông qua cơ chế số phiên bản hoặc thuật toán CAS. Cơ chế số phiên bản đảm bảo tính nhất quán dữ liệu bằng cách so sánh số phiên bản, còn CAS triển khai thao tác nguyên tử thông qua lệnh phần cứng, trực tiếp so sánh và hoán đổi giá trị biến.

Khóa bi quan và khóa lạc quan đều có ưu và nhược điểm riêng, phù hợp với các kịch bản ứng dụng khác nhau. Trong phát triển thực tế, việc lựa chọn cơ chế khóa phù hợp có thể nâng cao hiệu quả hiệu năng đồng thời và tính ổn định của hệ thống.

## Tài liệu tham khảo

- *78 bài giảng cốt lõi về lập trình đồng thời Java* (*78 Core Lectures on Java Concurrent Programming*)
- Dễ hiểu về Khóa bi quan, Khóa lạc quan, Reentrant Lock, Spin Lock, Biased Lock, Lightweight/Heavyweight Lock, Read-Write Lock, các loại khóa và cách triển khai bằng Java: <https://zhuanlan.zhihu.com/p/71156910>
