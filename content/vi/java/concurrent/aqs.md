---
title: Phân tích chi tiết AQS
description: "Phân tích chuyên sâu AbstractQueuedSynchronizer (AQS): nguyên lý cốt lõi của AQS, cấu trúc hàng đợi CLH, cơ chế triển khai khóa độc quyền và khóa chia sẻ, ứng dụng các bộ đồng bộ như ReentrantLock/Semaphore, cơ chế chặn và đánh thức Thread."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/aqs.md
head:
  - - meta
    - name: keywords
      content: AQS,AbstractQueuedSynchronizer,bộ đồng bộ hàng đợi,khóa độc quyền,khóa chia sẻ,hàng đợi CLH,nguyên lý triển khai ReentrantLock
---

<!-- markdownlint-disable MD024 -->

## Giới thiệu AQS

Tên đầy đủ của AQS là `AbstractQueuedSynchronizer`, dịch ra nghĩa là Bộ đồng bộ hàng đợi trừu tượng (Abstract Queued Synchronizer). Lớp này nằm trong gói `java.util.concurrent.locks`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/AQS-10959fb3.png)

AQS là một lớp trừu tượng (`abstract class`), chủ yếu dùng để xây dựng khóa (lock) và các bộ đồng bộ (synchronizer).

```java
public abstract class AbstractQueuedSynchronizer extends AbstractOwnableSynchronizer implements java.io.Serializable {
}
```

AQS cung cấp sẵn phần cài đặt cho các tính năng phổ biến khi xây dựng khóa và bộ đồng bộ. Nhờ đó, sử dụng AQS giúp xây dựng một cách đơn giản và hiệu quả hàng loạt bộ đồng bộ được ứng dụng rộng rãi, chẳng hạn như `ReentrantLock`, `Semaphore`, `ReentrantReadWriteLock`, v.v. Dù `SynchronousQueue` cũng sử dụng hàng đợi chờ và CAS để ghép cặp các Thread, nhưng nó không dựa trên AQS.

## Nguyên lý AQS

> Lưu ý: Phần phân tích mã nguồn AQS và trạng thái Node bên dưới chủ yếu dựa trên JDK 8. Cách cài đặt nội bộ của AQS sau này tiếp tục được cải tiến: trong JDK 11 vẫn có thể thấy các trường hoặc phương thức được đề cập trong bài viết này như `waitStatus`, `addWaiter()`, `acquireQueued()`, nhưng từ JDK 17 đến các phiên bản hiện tại thì các trường của Node cũng như cách cài đặt đưa vào hàng đợi và chờ đã có thay đổi khá lớn. Tuy nhiên, tư tưởng tổng thể về việc xây dựng bộ đồng bộ dựa trên trạng thái đồng bộ, hàng đợi chờ và phương thức khuôn mẫu (Template Method) không hề thay đổi.

Khi phỏng vấn về kiến thức đồng thời (Concurrency), đa số ứng viên đều sẽ gặp câu hỏi: "Hãy trình bày hiểu biết của bạn về nguyên lý của AQS". Dưới đây là một câu trả lời mẫu để mọi người tham khảo; phỏng vấn không phải là học thuộc lòng, bạn nhất định phải lồng ghép tư duy của riêng mình vào, ngay cả khi chưa thêm được góc nhìn riêng thì cũng phải đảm bảo diễn đạt một cách tự nhiên, dễ hiểu chứ không phải đọc vẹt.

### Tìm hiểu nhanh về AQS

Trước khi thực sự đi vào phân tích mã nguồn AQS, chúng ta cần có một cái nhìn tổng thể về AQS. Phần này sẽ thông qua một vài câu hỏi để giúp bạn nhận diện AQS ở tầng tổng quan, hiểu được vị trí của AQS trong toàn bộ hệ sinh thái Java Concurrency; từ đó trong quá trình học mã nguồn AQS sau này, bạn sẽ hiểu rõ hơn mối quan hệ giữa các bộ đồng bộ và AQS.

#### Vai trò của AQS là gì?

AQS giải quyết bài toán phức tạp mà lập trình viên gặp phải khi tự cài đặt bộ đồng bộ. Nó cung cấp một framework chung để triển khai nhiều loại bộ đồng bộ khác nhau, ví dụ như **Reentrant Lock** (`ReentrantLock`), **Semaphore** (`Semaphore`) và **CountDownLatch** (`CountDownLatch`). Bằng cách đóng gói cơ chế đồng bộ Thread ở tầng dưới, AQS ẩn đi logic quản lý Thread phức tạp, giúp lập trình viên chỉ cần tập trung vào logic đồng bộ cụ thể.

Nói một cách đơn giản, AQS là một lớp trừu tượng cung cấp **framework thực thi** chung cho các bộ đồng bộ. Nó định nghĩa **quy trình chung để lấy và giải phóng tài nguyên**, còn logic lấy tài nguyên cụ thể sẽ do từng bộ đồng bộ cụ thể cài đặt thông qua việc ghi đè (`Override`) các phương thức khuôn mẫu (Template Method). Vì vậy, có thể xem AQS là **"phần nền móng" cơ bản** của các bộ đồng bộ, còn các bộ đồng bộ là **"ứng dụng cụ thể"** được xây dựng trên nền AQS.

#### Tại sao AQS sử dụng biến thể của hàng đợi khóa CLH?

Khóa CLH (CLH Lock) là một cài đặt được tối ưu hóa dựa trên **Spin Lock** (khóa tự xoay).

Trước hết hãy nói về vấn đề tồn tại của Spin Lock: Spin Lock hoạt động bằng cách cho Thread liên tục thực hiện thao tác `compareAndSet` (viết tắt là `CAS`) trên một biến nguyên tử để cố gắng lấy khóa. Trong kịch bản đồng thời cao, nhiều Thread sẽ cùng lúc cạnh tranh trên cùng một biến nguyên tử, dễ khiến thao tác `CAS` của một số Thread thất bại kéo dài, dẫn đến **vấn đề "đói tài nguyên" (`Starvation`)** (một số Thread có thể vĩnh viễn không lấy được khóa).

Khóa CLH cải tiến Spin Lock bằng cách đưa vào một hàng đợi để tổ chức các Thread đang cạnh tranh đồng thời:

- Mỗi Thread sẽ tham gia vào hàng đợi như một nút (Node), và theo dõi trạng thái của nút Thread đứng trước mình thông qua tự xoay (spin), thay vì trực tiếp cạnh tranh trên cùng một biến dùng chung.
- Các Thread xếp hàng theo thứ tự, đảm bảo tính công bằng, qua đó tránh được vấn đề `Starvation`.

AQS (`AbstractQueuedSynchronizer`) tối ưu hóa thêm trên nền tảng khóa CLH, hình thành **biến thể hàng đợi CLH** bên trong nó. Có hai điểm cải tiến chính như sau:

1. **Spin + Blocking (Tự xoay + Chặn):** Khóa CLH sử dụng cách tự xoay thuần túy để chờ giải phóng khóa, nhưng lượng lớn thao tác spin sẽ tiêu tốn quá nhiều tài nguyên CPU. AQS đưa vào cơ chế kết hợp **Spin + Blocking**:
   - Nếu Thread lấy khóa thất bại, nó sẽ spin ngắn hạn trước để thử lấy khóa;
   - Nếu vẫn thất bại, Thread sẽ chuyển sang trạng thái bị chặn (Blocked), chờ được đánh thức nhằm giảm lãng phí CPU.
2. **Đổi hàng đợi một chiều thành hàng đợi hai chiều:** Khóa CLH dùng hàng đợi một chiều, nút chỉ biết trạng thái của nút tiền nhiệm (predecessor), nhưng khi một nút giải phóng khóa thì cần thông qua hàng đợi để đánh thức nút kế tiếp. AQS chuyển hàng đợi sang **hàng đợi hai chiều (doubly linked queue)**, bổ sung thêm con trỏ `next`, giúp một nút không chỉ biết nút đứng trước mà còn có thể trực tiếp đánh thức nút kế nhiệm (successor), từ đó đơn giản hóa thao tác trên hàng đợi và nâng cao hiệu quả đánh thức.

#### Tại sao hiệu năng của AQS lại tốt như vậy?

Bởi vì bên trong AQS sử dụng rất nhiều thao tác `CAS`.

Bên trong AQS dùng hàng đợi để lưu các nút Thread đang chờ. Vì hàng đợi là tài nguyên dùng chung, nên trong môi trường đa Thread cần phải đảm bảo truy cập đồng bộ vào hàng đợi.

AQS sử dụng thao tác `CAS` bên trong để kiểm soát việc truy cập đồng bộ vào hàng đợi; thao tác `CAS` chủ yếu được dùng để đảm bảo an toàn đồng thời cho hai thao tác là `khởi tạo hàng đợi` và `đưa nút Thread vào hàng đợi (enqueue)`. Mặc dù việc dùng `CAS` kiểm soát an toàn đồng thời mang lại hiệu năng khá tốt, nhưng đồng thời cũng kéo theo **độ phức tạp lập trình** cao hơn.

#### Tại sao Node trong AQS lại cần các trạng thái khác nhau?

Trạng thái `waitStatus` trong AQS tương tự như một **máy trạng thái (state machine)**: thông qua các trạng thái khác nhau để biểu thị ý nghĩa khác nhau của Node, và dựa theo từng thao tác để điều khiển quá trình chuyển đổi giữa các trạng thái.

- Trạng thái `0`: Sau khi một Node mới được thêm vào hàng đợi, trạng thái khởi tạo ban đầu là `0`.
- Trạng thái `SIGNAL`: Khi có Node mới tham gia vào hàng đợi, trạng thái của nút tiền nhiệm (predecessor) đứng trước Node mới đó sẽ được cập nhật từ `0` thành `SIGNAL`, biểu thị rằng sau khi nút tiền nhiệm giải phóng khóa thì cần thực hiện thao tác đánh thức Node mới. Nếu đánh thức nút kế tiếp của một Node đang ở trạng thái `SIGNAL`, trạng thái `SIGNAL` sẽ được cập nhật về `0`. Tức là thông qua việc xóa bỏ trạng thái `SIGNAL` để biểu thị rằng thao tác đánh thức đã được thực hiện.
- Trạng thái `CANCELLED`: Nếu một Node trong hàng đợi khi đang chờ lấy khóa bị thất bại vì lý do nào đó, trạng thái của Node đó sẽ chuyển thành `CANCELLED`, biểu thị việc hủy lấy khóa; Node ở trạng thái này là bất thường, không thể bị đánh thức và cũng không thể đánh thức nút kế nhiệm.

### Tư tưởng cốt lõi của AQS

Tư tưởng cốt lõi của AQS là: nếu tài nguyên chia sẻ được yêu cầu đang rảnh, thì thiết lập Thread đang yêu cầu tài nguyên đó thành Thread làm việc hợp lệ, đồng thời đặt tài nguyên chia sẻ sang trạng thái bị khóa (locked). Nếu tài nguyên chia sẻ được yêu cầu đang bị chiếm giữ, thì cần một cơ chế để Thread bị chặn chờ đợi và cơ chế phân phối khóa khi được đánh thức; cơ chế này của AQS được xây dựng dựa trên việc tối ưu hóa thêm từ **CLH Lock** (Craig, Landin, and Hagersten locks).

**CLH Lock** cải tiến Spin Lock và là một Spin Lock dựa trên danh sách liên kết đơn (singly linked list). Trong kịch bản đa Thread, các Thread yêu cầu lấy khóa được tổ chức thành một hàng đợi một chiều; mỗi Thread đang chờ sẽ kiểm tra trạng thái của nút Thread đứng ngay trước nó bằng cách tự xoay (spin), và chỉ sau khi nút đứng trước giải phóng khóa thì nút hiện tại mới có thể lấy được khóa. Cấu trúc hàng đợi của **CLH Lock** được minh họa như hình dưới đây.

![Cấu trúc hàng đợi của CLH Lock](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/clh-lock-queue-structure-229709df.png)

**Hàng đợi chờ (Wait Queue)** được sử dụng trong AQS là một biến thể của hàng đợi khóa CLH (sau đây gọi tắt là hàng đợi biến thể CLH).

Hàng đợi biến thể CLH của AQS là một hàng đợi hai chiều: các Thread tạm thời không lấy được khóa sẽ được đưa vào hàng đợi này. Sự khác biệt giữa hàng đợi biến thể CLH và hàng đợi khóa CLH nguyên bản chủ yếu nằm ở hai điểm:

- Tối ưu từ **Spin (tự xoay)** thành **Spin + Blocking (tự xoay + chặn)**: Thao tác spin có hiệu năng rất cao, nhưng spin quá nhiều sẽ chiếm dụng đáng kể tài nguyên CPU, vì vậy trong hàng đợi biến thể CLH, Thread sẽ thử lấy khóa qua spin trước, nếu thất bại mới tiến hành chặn chờ (blocking).
- Tối ưu từ **hàng đợi một chiều** thành **hàng đợi hai chiều**: Trong hàng đợi biến thể CLH, các Thread đang chờ sẽ bị chặn (block); khi Thread đứng trước trong hàng đợi giải phóng khóa, cần phải đánh thức Thread đứng sau, do đó AQS bổ sung con trỏ `next` để trở thành hàng đợi hai chiều.

AQS đóng gói mỗi Thread yêu cầu tài nguyên chia sẻ thành một nút (`Node`) trong hàng đợi biến thể CLH để thực hiện việc cấp phát khóa. Trong hàng đợi biến thể CLH, một Node đại diện cho một Thread, lưu giữ tham chiếu tới Thread (`thread`), trạng thái hiện tại của Node trong hàng đợi (`waitStatus`), nút tiền nhiệm (`prev`), và nút kế nhiệm (`next`).

Cấu trúc hàng đợi biến thể CLH trong AQS được minh họa như hình dưới đây:

![Cấu trúc hàng đợi biến thể CLH](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/clh-queue-structure-bianti-877c7ae8.png)

Để tìm hiểu chi tiết về cấu trúc dữ liệu cốt lõi của AQS - CLH Lock, bạn rất nên đọc bài viết [Cấu trúc dữ liệu cốt lõi của Java AQS - CLH Lock - Qunar Tech Salon](https://mp.weixin.qq.com/s/jEx-4XhNGOFdCo4Nou5tqg).

Sơ đồ nguyên lý cốt lõi của AQS (`AbstractQueuedSynchronizer`):

![Hàng đợi biến thể CLH](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/clh-queue-state-7830440b.png)

AQS sử dụng **biến thành viên `int state` để biểu thị trạng thái đồng bộ**, và thông qua **hàng đợi chờ FIFO tích hợp sẵn** để hoàn thành công việc xếp hàng cho các Thread đang chờ lấy tài nguyên.

Biến `state` được khai báo với từ khóa `volatile`, dùng để biểu thị tình trạng chiếm giữ hiện tại của tài nguyên tới hạn (critical resource). Ở đây, vai trò của `volatile` không chỉ là đảm bảo tính khả kiến (`Visibility`), mà quan trọng hơn là thông qua quy tắc happens-before (thao tác ghi vào biến `volatile` xảy ra trước thao tác đọc tiếp theo) để ngăn trình biên dịch và bộ xử lý sắp xếp lại lệnh (`Instruction Reordering`), từ đó đảm bảo tính đúng đắn về mặt ngữ nghĩa của khóa.

```java
// Biến dùng chung, sử dụng volatile để đảm bảo tính khả kiến giữa các thread và ngăn sắp xếp lại lệnh
private volatile int state;
```

Ngoài ra, thông tin trạng thái `state` có thể được thao tác thông qua các phương thức kiểu `protected` gồm `getState()`, `setState()` và `compareAndSetState()`. Hơn nữa, các phương thức này đều được gắn `final`, nên ở lớp con không thể ghi đè (`Override`) chúng.

```java
// Trả về giá trị hiện tại của trạng thái đồng bộ
protected final int getState() {
     return state;
}
 // Thiết lập giá trị của trạng thái đồng bộ
protected final void setState(int newState) {
     state = newState;
}
// Cập nhật nguyên tử (thao tác CAS) giá trị trạng thái đồng bộ thành giá trị update nếu giá trị hiện tại bằng expect (giá trị kỳ vọng)
protected final boolean compareAndSetState(int expect, int update) {
      return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

Lấy khóa loại trừ tương hỗ có thể tái nhập `ReentrantLock` làm ví dụ: bên trong nó duy trì một biến `state` dùng để biểu thị trạng thái chiếm giữ khóa. Giá trị ban đầu của `state` là 0, biểu thị khóa đang ở trạng thái chưa bị khóa. Khi Thread A gọi phương thức `lock()`, nó sẽ thử chiếm độc quyền khóa đó thông qua phương thức `tryAcquire()`, và làm cho giá trị `state` tăng thêm 1. Nếu thành công, Thread A đã lấy được khóa. Nếu thất bại, Thread A sẽ được đưa vào hàng đợi chờ (hàng đợi biến thể CLH) cho đến khi Thread khác giải phóng khóa đó. Giả sử Thread A lấy khóa thành công, trước khi giải phóng khóa, bản thân Thread A có thể lấy lại khóa này nhiều lần (`state` sẽ cộng dồn). Đây chính là biểu hiện của tính tái nhập (reentrancy): một Thread có thể lấy cùng một khóa nhiều lần mà không bị chặn. Tuy nhiên, điều này cũng có nghĩa là một Thread phải giải phóng khóa đúng bằng số lần đã lấy, thì mới đưa giá trị `state` về 0, tức là đưa khóa trở lại trạng thái chưa bị khóa. Chỉ như vậy, các Thread đang chờ khác mới có cơ hội lấy được khóa đó.

Quá trình Thread A thử lấy khóa được minh họa như hình dưới đây (nguồn ảnh: [Phân tích nguyên lý và ứng dụng của AQS qua cài đặt ReentrantLock - Đội ngũ kỹ thuật Meituan](./reentrantlock.md)):

![AQS lấy khóa ở chế độ độc quyền](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-exclusive-mode-acquire-lock-3dddd84f.png)

Lấy thêm `CountDownLatch` (bộ đếm ngược) làm ví dụ: có thể khởi tạo `state` bằng N, biểu thị cần chờ N lần gọi `countDown()`. N biểu thị số sự kiện hoặc số lần đếm, không bắt buộc phải trùng với số lượng Thread; cùng một Thread có thể gọi `countDown()` nhiều lần, hoặc nhiều Thread gọi riêng rẽ. Khi `state` giảm về 0, AQS sẽ đánh thức các Thread đang bị chặn trong hàng đợi chờ do gọi `await()`, và các Thread này sau đó có thể tiếp tục thực thi.

### Ý nghĩa các trạng thái waitStatus của Node

Trạng thái `waitStatus` trong AQS giống như một **máy trạng thái**, sử dụng các trạng thái khác nhau để biểu thị ý nghĩa khác nhau của Node và điều khiển quá trình chuyển đổi trạng thái theo từng thao tác tương ứng.

| Trạng thái Node | Giá trị | Ý nghĩa                                                                                                                                              |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CANCELLED`     | 1       | Biểu thị Thread đã hủy lấy khóa. Khi Thread đang chờ lấy tài nguyên bị ngắt (interrupt) hoặc hết thời gian chờ (timeout), trạng thái sẽ cập nhật thành giá trị này. |
| `SIGNAL`        | -1      | Biểu thị nút kế nhiệm cần được nút hiện tại đánh thức. Sau khi nút Thread hiện tại giải phóng khóa, nó cần đánh thức nút kế nhiệm.                     |
| `CONDITION`     | -2      | Biểu thị Node đang chờ trong `Condition`. Khi Thread khác gọi phương thức `signal()` của `Condition`, Node sẽ được chuyển từ hàng đợi chờ điều kiện sang hàng đợi đồng bộ để chờ lấy tài nguyên. |
| `PROPAGATE`     | -3      | Dùng cho chế độ chia sẻ (Share mode). Ở chế độ chia sẻ, có thể xảy ra trường hợp Thread trong hàng đợi không thể được đánh thức, vì vậy trạng thái `PROPAGATE` được đưa vào để giải quyết vấn đề này. |
|                 | 0       | Trạng thái ban đầu của một Node mới khi gia nhập hàng đợi.                                                                                           |

Trong mã nguồn của AQS, thường xuyên sử dụng `> 0` và `< 0` để kiểm tra `waitStatus`.

Nếu `waitStatus > 0`, biểu thị trạng thái của Node đã hủy chờ lấy tài nguyên.

Nếu `waitStatus < 0`, biểu thị Node đang ở trạng thái bình thường, tức là chưa hủy chờ.

Trong đó trạng thái `SIGNAL` là quan trọng nhất; quá trình chuyển trạng thái Node và các thao tác tương ứng như sau:

| Chuyển trạng thái | Thao tác tương ứng                                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`               | Khi Node mới vào hàng đợi, trạng thái khởi tạo là `0`.                                                                                                                                 |
| `0 -> SIGNAL`     | Khi Node mới vào hàng đợi, trạng thái của nút tiền nhiệm của nó sẽ được cập nhật từ `0` thành `SIGNAL`. Trạng thái `SIGNAL` cho biết nút kế tiếp của Node này cần được đánh thức.      |
| `SIGNAL -> 0`     | Khi đánh thức nút kế nhiệm, cần xóa trạng thái của nút hiện tại. Thường xảy ra ở nút `head`, ví dụ trạng thái của nút `head` được cập nhật từ `SIGNAL` thành `0`, biểu thị đã thực hiện đánh thức nút kế nhiệm của `head`. |
| `0 -> PROPAGATE`  | Bên trong AQS đưa vào trạng thái `PROPAGATE` để giải quyết tình trạng trong kịch bản đồng thời có thể khiến nút Thread không được đánh thức. (Sẽ trình bày chi tiết trong phần phân tích mã nguồn lấy tài nguyên ở chế độ chia sẻ của AQS). |

### Bộ đồng bộ tùy chỉnh

Dựa trên AQS, ta có thể cài đặt các bộ đồng bộ tùy chỉnh. AQS cung cấp 5 phương thức khuôn mẫu (Template Method Pattern). Nếu muốn tự định nghĩa một bộ đồng bộ, cách làm thông thường như sau (một ứng dụng rất kinh điển của Template Method Pattern):

1. Bộ đồng bộ tùy chỉnh kế thừa `AbstractQueuedSynchronizer`.
2. Ghi đè (`Override`) các phương thức khuôn mẫu mà AQS để lộ ra.

**AQS sử dụng Template Method Pattern; khi tự định nghĩa bộ đồng bộ cần ghi đè các phương thức hook (hook method) mà AQS cung cấp dưới đây:**

```java
// Chế độ độc quyền. Thử lấy tài nguyên, thành công trả về true, thất bại trả về false.
protected boolean tryAcquire(int)
// Chế độ độc quyền. Thử giải phóng tài nguyên, thành công trả về true, thất bại trả về false.
protected boolean tryRelease(int)
// Chế độ chia sẻ. Thử lấy tài nguyên. Số âm là thất bại; 0 là thành công nhưng không còn tài nguyên dư; số dương là thành công và vẫn còn tài nguyên dư.
protected int tryAcquireShared(int)
// Chế độ chia sẻ. Thử giải phóng tài nguyên, thành công trả về true, thất bại trả về false.
protected boolean tryReleaseShared(int)
// Thread này có đang giữ độc quyền tài nguyên hay không. Chỉ khi dùng Condition mới cần cài đặt phương thức này.
protected boolean isHeldExclusively()
```

**Phương thức hook (hook method) là gì?** Phương thức hook là một phương thức được khai báo trong lớp trừu tượng, thường được gắn từ khóa `protected`; nó có thể là phương thức rỗng (do lớp con cài đặt), hoặc là phương thức có cài đặt mặc định. Mẫu thiết kế Template Method kiểm soát việc thực thi các bước cố định thông qua các phương thức hook.

Vì dung lượng bài viết có hạn nên phần này sẽ không đi sâu vào Template Method Pattern; nếu bạn chưa nắm rõ có thể tham khảo bài viết: [Template Method Pattern sau khi cải tiến bằng Java 8 thực sự quá đỉnh!](https://mp.weixin.qq.com/s/zpScSCktFpnSWHWIQem2jg).

Ngoài các phương thức hook kể trên, các phương thức khác trong lớp AQS đều là `final`, do đó không thể bị lớp khác ghi đè (`Override`).

### Phương thức chia sẻ tài nguyên của AQS

AQS định nghĩa hai phương thức chia sẻ tài nguyên: `Exclusive` (độc quyền, tại một thời điểm chỉ có một Thread có thể thực thi, như `ReentrantLock`) và `Share` (chia sẻ, nhiều Thread có thể thực thi đồng thời, như `Semaphore`/`CountDownLatch`).

Thông thường, chế độ chia sẻ của bộ đồng bộ tùy chỉnh sẽ là độc quyền hoặc chia sẻ; chúng chỉ cần cài đặt một trong hai cặp `tryAcquire-tryRelease` hoặc `tryAcquireShared-tryReleaseShared` là đủ. Tuy nhiên, AQS cũng hỗ trợ bộ đồng bộ tùy chỉnh cài đặt đồng thời cả hai chế độ độc quyền và chia sẻ, chẳng hạn như `ReentrantReadWriteLock`.

### So sánh chuyên sâu giữa chế độ độc quyền và chế độ chia sẻ

Phần trên đã giới thiệu sơ lược về hai phương thức chia sẻ tài nguyên của AQS; dưới đây sẽ so sánh có hệ thống giữa chế độ độc quyền và chế độ chia sẻ trên nhiều khía cạnh, giúp bạn hiểu sâu hơn sự khác biệt giữa chúng.

#### So sánh đặc điểm

| Tiêu chí so sánh              | Chế độ độc quyền (Exclusive)                           | Chế độ chia sẻ (Share)                                                                                                      |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Mức độ đồng thời**          | Tại cùng một thời điểm chỉ có một Thread lấy được tài nguyên | Tại cùng một thời điểm có thể có nhiều Thread cùng lấy được tài nguyên                                                      |
| **Cổng vào lấy tài nguyên**   | `acquire(int arg)`                                     | `acquireShared(int arg)`                                                                                                    |
| **Cổng vào giải phóng tài nguyên** | `release(int arg)`                                | `releaseShared(int arg)`                                                                                                    |
| **Phương thức khuôn mẫu cần ghi đè** | `tryAcquire(int)` / `tryRelease(int)`           | `tryAcquireShared(int)` / `tryReleaseShared(int)`                                                                           |
| **Giá trị trả về của tryXxx** | `boolean`, `true` biểu thị lấy/giải phóng thành công   | `int` (khi lấy): số âm là thất bại, 0 là thành công nhưng hết tài nguyên dư, số dương là thành công và còn tài nguyên dư; `boolean` (khi giải phóng) |
| **Đánh thức nút kế nhiệm**    | Khi giải phóng tài nguyên sẽ đánh thức một nút kế nhiệm | Sau khi lấy tài nguyên thành công, nếu vẫn còn tài nguyên dư thì sẽ tiếp tục đánh thức các nút phía sau (đánh thức lan truyền) |
| **Định danh loại Node**       | `Node.EXCLUSIVE` (`null`)                              | `Node.SHARED` (một thể hiện `Node` tĩnh)                                                                                    |
| **Cài đặt điển hình**         | `ReentrantLock`, khóa ghi của `ReentrantReadWriteLock` | `Semaphore`, `CountDownLatch`, khóa đọc của `ReentrantReadWriteLock`                                                        |

#### Ngữ nghĩa của `state` trong các bộ đồng bộ khác nhau

Biến `state` trong AQS là một biến trạng thái đồng bộ tổng quát; các bộ đồng bộ khác nhau gán cho nó những ý nghĩa khác nhau:

| Bộ đồng bộ               | Chế độ            | Ngữ nghĩa của `state`                                                                                             |
| ------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ReentrantLock`          | Độc quyền         | Biểu thị số lần tái nhập (reentrant count) của khóa. `state == 0` là khóa rảnh; `state > 0` là khóa đang bị giữ, giá trị là số lần tái nhập |
| `ReentrantReadWriteLock` | Độc quyền + Chia sẻ | 16 bit cao biểu thị số lượng khóa đọc đang được giữ (chia sẻ), 16 bit thấp biểu thị số lần tái nhập của khóa ghi (độc quyền) |
| `Semaphore`              | Chia sẻ           | Biểu thị số lượng giấy phép (permit) khả dụng. Mỗi lần `acquire()` sẽ giảm, `release()` sẽ tăng                   |
| `CountDownLatch`         | Chia sẻ           | Biểu thị bộ đếm cần chờ. Mỗi lần `countDown()` giảm đi 1, khi về 0 sẽ đánh thức toàn bộ Thread đang chờ           |

Dưới đây là một ví dụ mã nguồn giúp cảm nhận trực quan sự khác biệt khi sử dụng giữa chế độ độc quyền và chế độ chia sẻ:

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.locks.ReentrantLock;

public class ExclusiveVsSharedDemo {
    public static void main(String[] args) {
        // Chế độ độc quyền: tại cùng một thời điểm chỉ có 1 thread vào được vùng tới hạn
        ReentrantLock lock = new ReentrantLock();

        // Chế độ chia sẻ: tại cùng một thời điểm tối đa 3 thread vào được vùng tới hạn
        Semaphore semaphore = new Semaphore(3);

        // Ví dụ chế độ độc quyền
        Runnable exclusiveTask = () -> {
            lock.lock();
            try {
                System.out.println(Thread.currentThread().getName()
                        + " đã lấy được khóa độc quyền, đang thực thi...");
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                lock.unlock();
            }
        };

        // Ví dụ chế độ chia sẻ
        Runnable sharedTask = () -> {
            boolean acquired = false;
            try {
                semaphore.acquire();
                acquired = true;
                System.out.println(Thread.currentThread().getName()
                        + " đã lấy được giấy phép (permit), đang thực thi...");
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                if (acquired) {
                    semaphore.release();
                }
            }
        };

        System.out.println("=== Chế độ độc quyền (ReentrantLock) ===");
        for (int i = 0; i < 5; i++) {
            new Thread(exclusiveTask, "ExclusiveThread-" + i).start();
        }

        try { Thread.sleep(3000); } catch (InterruptedException e) { }

        System.out.println("\n=== Chế độ chia sẻ (Semaphore) ===");
        for (int i = 0; i < 5; i++) {
            new Thread(sharedTask, "SharedThread-" + i).start();
        }
    }
}
```

Khi chạy đoạn mã trên, có thể quan sát thấy: ở chế độ độc quyền tại cùng một thời điểm chỉ có một Thread thực thi, nhưng `ReentrantLock` không công bằng (Non-fair) mặc định không đảm bảo các Thread nhận được khóa theo đúng thứ tự khởi chạy hoặc thứ tự chờ; còn ở chế độ chia sẻ, tối đa có 3 Thread thực thi đồng thời.

### Phân tích mã nguồn lấy tài nguyên trong AQS (Chế độ độc quyền)

Phương thức đầu vào để lấy tài nguyên theo chế độ độc quyền trong AQS là `acquire()`, như sau:

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

Trong `acquire()`, Thread sẽ thử lấy tài nguyên chia sẻ trước; nếu lấy thất bại, nó sẽ đóng gói Thread thành nút `Node` và đưa vào hàng đợi chờ của AQS; sau khi đưa vào hàng đợi, sẽ cho Thread trong hàng đợi chờ thử lấy tài nguyên, đồng thời tiến hành chặn Thread đó. Quá trình này tương ứng với ba phương thức sau:

- `tryAcquire()`: Thử lấy khóa (phương thức khuôn mẫu), `AQS` không cung cấp cài đặt cụ thể mà do lớp con cài đặt.
- `addWaiter()`: Nếu lấy khóa thất bại, sẽ đóng gói Thread hiện tại thành nút `Node` và đưa vào hàng đợi biến thể CLH của AQS để chờ lấy khóa.
- `acquireQueued()`: Thực hiện chặn Thread và gọi phương thức `tryAcquire()` để cho Thread trong hàng đợi thử lấy khóa.

#### Phân tích `tryAcquire()`

Phương thức khuôn mẫu `tryAcquire()` tương ứng trong AQS như sau:

```java
// AQS
protected boolean tryAcquire(int arg) {
    throw new UnsupportedOperationException();
}
```

Phương thức `tryAcquire()` là phương thức khuôn mẫu do AQS cung cấp và không có cài đặt mặc định.

Do đó, khi phân tích phương thức `tryAcquire()` ở đây, chúng ta lấy khóa không công bằng (khóa độc quyền) của `ReentrantLock` làm ví dụ: `tryAcquire()` được cài đặt bên trong `ReentrantLock` sẽ gọi tới `nonfairTryAcquire()` dưới đây:

```java
// ReentrantLock
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    // 1. Lấy trạng thái state trong AQS
    int c = getState();
    // 2. Nếu state bằng 0, chứng tỏ khóa chưa bị thread khác chiếm giữ
    if (c == 0) {
        // 2.1. Cập nhật state thông qua CAS
        if (compareAndSetState(0, acquires)) {
            // 2.2. Nếu cập nhật CAS thành công, đặt thread giữ khóa là thread hiện tại
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    // 3. Nếu thread hiện tại trùng với thread đang giữ khóa, nghĩa là đã xảy ra "tái nhập khóa" (reentrancy)
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        // 3.1. Tăng số lần tái nhập khóa thêm 1 (cộng acquires)
        setState(nextc);
        return true;
    }
    // 4. Nếu khóa đang bị thread khác chiếm giữ, trả về false biểu thị lấy khóa thất bại
    return false;
}
```

Bên trong phương thức `nonfairTryAcquire()`, việc lấy tài nguyên được hoàn thành chủ yếu thông qua hai thao tác cốt lõi:

- Cập nhật biến `state` thông qua `CAS`. `state == 0` biểu thị tài nguyên chưa bị chiếm giữ. `state > 0` biểu thị tài nguyên đang bị chiếm giữ, lúc này `state` biểu thị số lần tái nhập.
- Thiết lập Thread đang giữ tài nguyên thông qua `setExclusiveOwnerThread()`.

Nếu Thread cập nhật biến `state` thành công, điều đó chứng tỏ nó đã lấy được tài nguyên, vì vậy chỉ cần thiết lập Thread giữ tài nguyên là Thread hiện tại.

#### Phân tích `addWaiter()`

Sau khi thử lấy tài nguyên qua `tryAcquire()` thất bại, AQS sẽ gọi phương thức `addWaiter()` để đóng gói Thread hiện tại thành nút `Node` và đưa vào hàng đợi nội bộ của `AQS`. Mã nguồn của `addWaiter()` như sau:

```java
// AQS
private Node addWaiter(Node mode) {
    // 1. Đóng gói thread hiện tại thành nút Node.
    Node node = new Node(Thread.currentThread(), mode);
    Node pred = tail;
    // 2. Nếu pred != null, chứng tỏ nút tail đã được khởi tạo, trực tiếp thêm Node vào hàng đợi.
    if (pred != null) {
        node.prev = pred;
        // 2.1. Kiểm soát an toàn đồng thời thông qua CAS.
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    // 3. Khởi tạo hàng đợi và đưa nút Node mới tạo vào hàng đợi.
    enq(node);
    return node;
}
```

**An toàn đồng thời khi đưa Node vào hàng đợi:**

Trong phương thức `addWaiter()`, cần thực hiện thao tác **đưa nút `Node` vào hàng đợi (enqueue)**. Vì đang chạy trong môi trường đa Thread nên cần sử dụng thao tác `CAS` để đảm bảo an toàn đồng thời.

Thông qua thao tác `CAS` để cập nhật con trỏ `tail` trỏ tới nút `Node` mới vào hàng đợi, `CAS` đảm bảo tại một thời điểm chỉ có duy nhất một Thread sửa đổi thành công con trỏ `tail`, qua đó đảm bảo an toàn đồng thời khi đưa nút `Node` vào hàng đợi.

**Khởi tạo hàng đợi nội bộ của AQS:**

Khi thực thi `addWaiter()`, nếu phát hiện `pred == null`, tức con trỏ `tail` là `null`, thì chứng tỏ hàng đợi chưa được khởi tạo; cần gọi phương thức `enq()` để khởi tạo hàng đợi và đưa nút `Node` vào hàng đợi vừa khởi tạo, mã nguồn như sau:

```java
// AQS
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        if (t == null) {
            // 1. Đảm bảo an toàn đồng thời khi khởi tạo hàng đợi bằng thao tác CAS
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            // 2. Giống với thao tác đưa Node vào hàng đợi trong phương thức addWaiter()
            node.prev = t;
            if (compareAndSetTail(t, node)) {
                t.next = node;
                return t;
            }
        }
    }
}
```

Trong phương thức `enq()` để khởi tạo hàng đợi, quá trình khởi tạo cũng cần dùng `CAS` để đảm bảo an toàn đồng thời.

Việc khởi tạo hàng đợi bao gồm tổng cộng hai bước: khởi tạo nút `head`, và cho `tail` trỏ tới nút `head`.

**Hàng đợi sau khi khởi tạo được minh họa như hình dưới đây:**

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/clh-queue-structure-init-e0d2df20.png)

#### Phân tích `acquireQueued()`

Để tiện theo dõi, dưới đây dán lại đoạn mã `acquire()` lấy tài nguyên trong `AQS`:

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

Trong phương thức `acquire()`, sau khi đưa nút `Node` vào hàng đợi thông qua phương thức `addWaiter()`, nó sẽ gọi phương thức `acquireQueued()`. Mã nguồn như sau:

```java
// AQS: cho phép node trong hàng đợi thử lấy khóa và chặn thread.
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            // 1. Thử lấy khóa.
            final Node p = node.predecessor();
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            // 2. Kiểm tra xem thread có thể bị chặn hay không; nếu có thể thì chặn thread hiện tại.
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        // 3. Nếu lấy khóa thất bại, hủy lấy khóa và cập nhật trạng thái node thành CANCELLED.
        if (failed)
            cancelAcquire(node);
    }
}
```

Trong phương thức `acquireQueued()`, chủ yếu thực hiện hai việc:

- **Thử lấy tài nguyên:** Sau khi Thread hiện tại vào hàng đợi, nếu phát hiện nút tiền nhiệm là nút `head`, điều đó có nghĩa Thread hiện tại là nút đầu tiên đang chờ trong hàng đợi, do đó nó gọi `tryAcquire()` để thử lấy tài nguyên.
- **Chặn Thread hiện tại:** Nếu thử lấy tài nguyên thất bại, cần chặn Thread hiện tại lại để chờ sau khi được đánh thức sẽ lấy tài nguyên.

**1. Thử lấy tài nguyên**

Trong phương thức `acquireQueued()`, việc thử lấy tài nguyên gồm 2 bước:

- `p == head`: Biểu thị nút tiền nhiệm của nút hiện tại là nút `head`. Lúc này nút hiện tại là nút đầu tiên đang chờ trong hàng đợi AQS.
- `tryAcquire(arg) == true`: Biểu thị Thread hiện tại thử lấy tài nguyên thành công.

Sau khi lấy tài nguyên thành công, cần **xóa nút của Thread hiện tại khỏi hàng đợi chờ**. Thao tác xóa là: đặt nút Thread đang chờ hiện tại làm nút `head` (nút `head` là nút ảo, không tham gia xếp hàng chờ lấy tài nguyên).

**2. Chặn Thread hiện tại**

Trong `AQS`, việc đánh thức nút hiện tại cần phụ thuộc vào nút đứng trước nó. Nếu nút đứng trước hủy lấy khóa, trạng thái của nó sẽ trở thành `CANCELLED`; một nút ở trạng thái `CANCELLED` không lấy được khóa, nên cũng không thể thực hiện thao tác mở khóa để đánh thức nút hiện tại. Do đó, trước khi chặn Thread hiện tại, cần bỏ qua các nút có trạng thái `CANCELLED`.

Thông qua phương thức `shouldParkAfterFailedAcquire()` để phán đoán xem nút Thread hiện tại có thể bị chặn hay không, như sau:

```java
// AQS: Kiểm tra xem node của thread hiện tại có thể bị chặn hay không.
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    int ws = pred.waitStatus;
    // 1. Trạng thái nút tiền nhiệm bình thường, trả về true trực tiếp.
    if (ws == Node.SIGNAL)
        return true;
    // 2. ws > 0 biểu thị trạng thái nút tiền nhiệm bất thường (CANCELLED), cần bỏ qua các nút có trạng thái bất thường.
    if (ws > 0) {
        do {
            node.prev = pred = pred.prev;
        } while (pred.waitStatus > 0);
        pred.next = node;
    } else {
        // 3. Nếu trạng thái nút tiền nhiệm không phải SIGNAL và cũng không phải CANCELLED, đặt trạng thái thành SIGNAL.
        compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
    }
    return false;
}
```

Logic phán đoán trong phương thức `shouldParkAfterFailedAcquire()`:

- Nếu phát hiện trạng thái của nút tiền nhiệm là `SIGNAL`, thì có thể chặn Thread hiện tại.
- Nếu phát hiện trạng thái của nút tiền nhiệm là `CANCELLED`, thì cần bỏ qua các nút ở trạng thái `CANCELLED`.
- Nếu phát hiện trạng thái của nút tiền nhiệm không phải `SIGNAL` và `CANCELLED`, điều đó cho thấy nút tiền nhiệm đang ở trạng thái bình thường chờ tài nguyên, do đó đặt trạng thái của nút tiền nhiệm thành `SIGNAL`, biểu thị rằng nút tiền nhiệm này cần đánh thức nút kế tiếp.

Sau khi xác định Thread hiện tại có thể bị chặn, nó gọi phương thức `parkAndCheckInterrupt()` để chặn Thread hiện tại. Bên trong sử dụng `LockSupport` để thực hiện việc chặn. Tầng dưới của `LockSupport` dựa trên lớp `Unsafe` để chặn Thread, mã nguồn như sau:

```java
// AQS
private final boolean parkAndCheckInterrupt() {
    // 1. Thread bị chặn tại đây
    LockSupport.park(this);
    // 2. Sau khi thread được đánh thức, trả về trạng thái ngắt (interrupt) của thread
    return Thread.interrupted();
}
```

**Tại sao sau khi Thread được đánh thức lại phải trả về trạng thái ngắt của Thread?**

Trong phương thức `parkAndCheckInterrupt()`, sau khi thực thi `LockSupport.park(this)`, Thread sẽ bị chặn lại, mã nguồn như sau:

```java
// AQS
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    // Sau khi thread được đánh thức, cần trả về trạng thái ngắt của thread
    return Thread.interrupted();
}
```

Sau khi Thread được đánh thức, cần thực thi `Thread.interrupted()` để trả về trạng thái ngắt của Thread, tại sao lại như vậy?

Điều này liên quan đến cơ chế phối hợp ngắt (interrupt) của Thread: sau khi Thread được đánh thức, không thể chắc chắn nó được đánh thức bởi tín hiệu ngắt hay được đánh thức bởi `LockSupport.unpark()`, vì vậy cần dựa vào trạng thái ngắt của Thread để xác định.

**Trong phương thức `acquire()`, tại sao cần phải gọi `selfInterrupt()`?**

Mã nguồn phương thức `acquire()` như sau:

```java
// AQS
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

Trong phương thức `acquire()`, khi điều kiện trong câu lệnh `if` trả về `true`, nó sẽ gọi `selfInterrupt()`, phương thức này sẽ ngắt Thread hiện tại; tại sao cần phải ngắt Thread hiện tại?

Để câu lệnh `if` đánh giá là `true`, cần `tryAcquire()` trả về `false` và `acquireQueued()` trả về `true`.

Trong đó, phương thức `acquireQueued()` trả về **trạng thái ngắt** sau khi Thread được đánh thức, thông qua việc thực thi `Thread.interrupted()`. Phương thức này vừa trả về trạng thái ngắt, đồng thời cũng xóa cờ trạng thái ngắt của Thread.

Do đó, nếu biểu thức `if` là `true`, điều đó chứng tỏ trạng thái ngắt của Thread từng là `true`, nhưng sau khi gọi `Thread.interrupted()` thì trạng thái ngắt của Thread đã bị xóa thành `false`, vì vậy cần thực thi lại `selfInterrupt()` để thiết lập lại trạng thái ngắt cho Thread.

### Phân tích mã nguồn giải phóng tài nguyên trong AQS (Chế độ độc quyền)

Phương thức đầu vào để giải phóng tài nguyên theo chế độ độc quyền trong AQS là `release()`, mã nguồn như sau:

```java
// AQS
public final boolean release(int arg) {
    // 1. Thử giải phóng khóa
    if (tryRelease(arg)) {
        Node h = head;
        // 2. Đánh thức nút kế nhiệm
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

Trong phương thức `release()`, chủ yếu làm hai việc: thử giải phóng khóa và đánh thức nút kế nhiệm. Các phương thức tương ứng như sau:

**1. Thử giải phóng khóa**

Thử giải phóng khóa thông qua phương thức `tryRelease()`; đây là phương thức khuôn mẫu do bộ đồng bộ tùy chỉnh cài đặt, vì vậy ở đây vẫn lấy `ReentrantLock` làm ví dụ để trình bày.

Phương thức `tryRelease()` được cài đặt trong `ReentrantLock` như sau:

```java
// ReentrantLock
protected final boolean tryRelease(int releases) {
    int c = getState() - releases;
    // 1. Kiểm tra xem thread giữ khóa có phải là thread hiện tại hay không
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
    // 2. Nếu state bằng 0, chứng tỏ thread hiện tại không còn lần tái nhập nào. Đặt free thành true, biểu thị thread sẽ giải phóng hoàn toàn khóa.
    if (c == 0) {
        free = true;
        // 3. Cập nhật thread đang giữ tài nguyên về null
        setExclusiveOwnerThread(null);
    }
    // 4. Cập nhật giá trị state
    setState(c);
    return free;
}
```

Trong phương thức `tryRelease()`, trước tiên sẽ tính toán giá trị `state` sau khi giải phóng khóa và kiểm tra xem giá trị `state` có bằng 0 hay không.

- Nếu `state == 0`, chứng tỏ Thread này không còn lần tái nhập nào nữa, cập nhật `free = true`, và sửa lại Thread giữ tài nguyên thành `null`, biểu thị Thread này đã giải phóng hoàn toàn khóa.
- Nếu `state != 0`, chứng tỏ Thread này vẫn còn số lần tái nhập, vì vậy không cập nhật `free`; giá trị `free` là `false` biểu thị Thread này chưa giải phóng hoàn toàn khóa.

Sau đó cập nhật giá trị `state` và trả về giá trị `free`, giá trị `free` cho biết Thread đã giải phóng hoàn toàn khóa hay chưa.

**2. Đánh thức nút kế nhiệm**

Nếu `tryRelease()` trả về `true`, chứng tỏ Thread không còn lần tái nhập nào nữa và khóa đã được giải phóng hoàn toàn, do đó cần đánh thức nút kế nhiệm.

Trước khi đánh thức nút kế nhiệm, cần kiểm tra xem có thể đánh thức nút kế nhiệm hay không với điều kiện: `h != null && h.waitStatus != 0`. Dưới đây là giải thích lý do kiểm tra như vậy:

- `h == null`: Biểu thị nút `head` chưa được khởi tạo, tức là hàng đợi trong AQS chưa được khởi tạo, do đó không thể đánh thức nút Thread nào trong hàng đợi.
- `h != null && h.waitStatus == 0`: Biểu thị nút đầu hàng đợi vừa mới khởi tạo xong (trạng thái khởi tạo của nút là 0), nút Thread kế nhiệm vẫn chưa vào hàng đợi thành công, vì vậy không cần đánh thức nút kế tiếp. (Khi nút kế nhiệm vào hàng đợi, nó sẽ sửa trạng thái của nút tiền nhiệm thành `SIGNAL`, biểu thị cần đánh thức nút kế nhiệm).
- `h != null && h.waitStatus != 0`: Trong đó `waitStatus` có thể lớn hơn 0 hoặc nhỏ hơn 0. Giá trị `> 0` biểu thị nút đã hủy chờ lấy tài nguyên, giá trị `< 0` biểu thị nút đang ở trạng thái chờ bình thường.

Tiếp theo đi vào phương thức `unparkSuccessor()` để xem cách đánh thức nút kế nhiệm:

```java
// AQS: tham số truyền vào node ở đây là nút đầu của hàng đợi (nút head ảo)
private void unparkSuccessor(Node node) {
    int ws = node.waitStatus;
    // 1. Xóa trạng thái của nút đầu để chuẩn bị cho việc đánh thức tiếp theo.
    if (ws < 0)
        compareAndSetWaitStatus(node, ws, 0);

    Node s = node.next;
    // 2. Nếu nút kế nhiệm bất thường, cần duyệt ngược từ tail về trước để tìm nút có trạng thái bình thường và đánh thức.
    if (s == null || s.waitStatus > 0) {
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null)
        // 3. Đánh thức nút kế nhiệm
        LockSupport.unpark(s.thread);
}
```

Trong `unparkSuccessor()`, nếu trạng thái của nút đầu `< 0` (trong trường hợp bình thường, chỉ cần có nút kế nhiệm thì trạng thái của nút đầu phải là `SIGNAL`, tức -1), điều đó biểu thị cần đánh thức nút kế nhiệm, do đó ở đây sẽ xóa trước cờ trạng thái của nút đầu, sửa trạng thái thành 0 để biểu thị đã thực hiện thao tác đánh thức nút kế tiếp.

Nếu `s == null` hoặc `s.waitStatus > 0`, biểu thị nút kế nhiệm bị bất thường; lúc này không thể đánh thức nút bất thường mà phải tìm một nút có trạng thái bình thường để đánh thức.

Vì vậy cần duyệt ngược từ con trỏ `tail` về phía trước để tìm nút đầu tiên (gần `head` nhất) có trạng thái bình thường (`waitStatus <= 0`) và đánh thức nó.

**Tại sao lại phải duyệt ngược từ con trỏ `tail` về trước, thay vì duyệt xuôi từ con trỏ `head` về sau để tìm nút có trạng thái bình thường?**

Hướng duyệt có liên quan đến **thao tác đưa nút vào hàng đợi (enqueue)**. Phương thức enqueue như sau:

```java
// AQS: Phương thức đưa node vào hàng đợi
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    Node pred = tail;
    if (pred != null) {
        // 1. Sửa con trỏ prev trước.
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
            // 2. Sau đó mới sửa con trỏ next.
            pred.next = node;
            return node;
        }
    }
    enq(node);
    return node;
}
```

Trong phương thức `addWaiter()`, việc đưa `node` vào hàng đợi cần sửa hai con trỏ là `node.prev` và `pred.next`, nhưng hai thao tác này không phải là **thao tác nguyên tử (`Atomic`)**: nó sửa con trỏ `node.prev` trước, sau đó mới sửa con trỏ `pred.next`.

Trong tình huống cực đoan, có thể xảy ra trường hợp nút đứng ngay sau nút `head` có trạng thái là `CANCELLED`, đồng thời lúc này nút mới vào hàng đợi chỉ mới cập nhật con trỏ `node.prev` mà chưa kịp cập nhật con trỏ `pred.next`, như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-addWaiter-0f34ed0a.png)

Như vậy nếu duyệt xuôi từ con trỏ `head` về sau thì sẽ không tìm thấy nút mới vào hàng đợi, do đó cần duyệt ngược từ con trỏ `tail` về trước để tìm nút mới vào hàng đợi.

### Minh họa nguyên lý hoạt động của AQS bằng sơ đồ (Chế độ độc quyền)

Đến đây, phần mã nguồn lấy tài nguyên và giải phóng tài nguyên theo chế độ độc quyền trong AQS đã được trình bày xong. Để có cái nhìn rõ ràng hơn về nguyên lý hoạt động và sự thay đổi trạng thái Node của AQS, phần tiếp theo sẽ minh họa toàn bộ nguyên lý hoạt động của AQS bằng hình vẽ.

Vì AQS là công cụ đồng bộ tầng dưới, các phương thức lấy và giải phóng tài nguyên không có cài đặt cụ thể, nên ở đây sẽ vẽ sơ đồ dựa trên `ReentrantLock` để giải thích.

Giả sử có tổng cộng 3 Thread cùng thử lấy khóa, lần lượt là `T1`, `T2` và `T3`.

Lúc này, giả sử Thread `T1` lấy được khóa trước, Thread `T2` xếp hàng chờ lấy khóa. Trước khi Thread `T2` vào hàng đợi, cần khởi tạo hàng đợi nội bộ của AQS. Nút `head` sau khi khởi tạo có trạng thái là `0`. Hàng đợi nội bộ của AQS sau khi khởi tạo như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-a624a1bb.png)

Lúc này, Thread `T2` thử lấy khóa. Do Thread `T1` đang giữ khóa nên Thread `T2` sẽ đi vào hàng đợi chờ lấy khóa. Đồng thời cập nhật trạng thái của nút tiền nhiệm (nút `head`) từ `0` thành `SIGNAL`, biểu thị cần đánh thức nút kế nhiệm của nút `head`. Lúc này, hàng đợi nội bộ của AQS như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-2-f9c98303.png)

Lúc này, Thread `T3` thử lấy khóa. Do Thread `T1` đang giữ khóa nên Thread `T3` sẽ đi vào hàng đợi chờ lấy khóa. Đồng thời cập nhật trạng thái của nút tiền nhiệm (nút Thread `T2`) từ `0` thành `SIGNAL`, biểu thị nút Thread `T2` cần đánh thức nút kế nhiệm. Lúc này, hàng đợi nội bộ của AQS như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-3-6b417ddc.png)

Lúc này, giả sử Thread `T1` giải phóng khóa, nó sẽ đánh thức nút kế nhiệm `T2`. Sau khi Thread `T2` được đánh thức sẽ lấy được khóa và thoát khỏi hàng đợi chờ.

Ở đây, việc nút Thread `T2` thoát khỏi hàng đợi chờ không phải là xóa trực tiếp khỏi hàng đợi, mà là biến nút Thread `T2` thành nút `head` mới để kết thúc việc chờ lấy tài nguyên. Lúc này hàng đợi nội bộ của AQS như sau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-4-3965bc62.png)

Lúc này, giả sử Thread `T2` giải phóng khóa, nó sẽ đánh thức nút kế nhiệm `T3`. Sau khi Thread `T3` lấy được khóa, nó cũng tương tự thoát khỏi hàng đợi chờ, tức là biến nút Thread `T3` thành nút `head` để kết thúc việc chờ lấy tài nguyên. Lúc này hàng đợi nội bộ của AQS như sau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/aqs-acquire-and-release-process-5-ddd173bc.png)

### Phân tích mã nguồn lấy tài nguyên trong AQS (Chế độ chia sẻ)

Phương thức đầu vào để lấy tài nguyên theo chế độ chia sẻ trong AQS là `acquireShared()`, như sau:

```java
// AQS
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```

Trong phương thức `acquireShared()`, trước tiên Thread sẽ thử lấy khóa chia sẻ; nếu lấy thất bại, sẽ đưa Thread hiện tại vào hàng đợi và chặn lại, chờ sau khi được đánh thức để thử lấy khóa chia sẻ, tương ứng với hai phương thức là `tryAcquireShared()` và `doAcquireShared()`.

Trong đó phương thức `tryAcquireShared()` là phương thức khuôn mẫu do AQS cung cấp, logic cụ thể do bộ đồng bộ cài đặt. Do đó ở đây lấy `Semaphore` làm ví dụ để phân tích cách lấy tài nguyên ở chế độ chia sẻ.

#### Phân tích `tryAcquireShared()`

`Semaphore` cài đặt cả Fair Lock và Non-fair Lock; tiếp theo sẽ lấy Non-fair Lock làm ví dụ để phân tích mã nguồn `tryAcquireShared()`.

Phương thức `tryAcquireShared()` được ghi đè (`Override`) trong `Semaphore` sẽ gọi phương thức `nonfairTryAcquireShared()` dưới đây:

```java
// Semaphore ghi đè phương thức khuôn mẫu của AQS
protected int tryAcquireShared(int acquires) {
    return nonfairTryAcquireShared(acquires);
}

// Semaphore
final int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        // 1. Lấy số lượng tài nguyên khả dụng.
        int available = getState();
        // 2. Tính số lượng tài nguyên còn lại.
        int remaining = available - acquires;
        // 3. Nếu số lượng tài nguyên còn lại < 0, chứng tỏ không đủ tài nguyên, trả về trực tiếp; nếu CAS cập nhật state thành công, chứng tỏ thread hiện tại lấy được tài nguyên chia sẻ, trả về trực tiếp.
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```

Ở chế độ chia sẻ, giá trị `state` trong AQS biểu thị số lượng tài nguyên chia sẻ.

Trong phương thức `nonfairTryAcquireShared()`, Thread sẽ liên tục thử lấy tài nguyên trong vòng lặp vô hạn; nếu "số lượng tài nguyên còn lại không đủ" hoặc "Thread hiện tại lấy tài nguyên thành công" thì thoát khỏi vòng lặp. Phương thức trả về **số lượng tài nguyên còn lại**, tùy theo giá trị trả về sẽ chia làm 3 trường hợp:

- **Số lượng tài nguyên còn lại > 0**: Biểu thị lấy tài nguyên thành công, và các Thread tiếp theo cũng có thể lấy tài nguyên thành công.
- **Số lượng tài nguyên còn lại = 0**: Biểu thị lấy tài nguyên thành công, nhưng các Thread tiếp theo sẽ không thể lấy tài nguyên thành công nữa.
- **Số lượng tài nguyên còn lại < 0**: Biểu thị lấy tài nguyên thất bại.

#### Phân tích `doAcquireShared()`

Để tiện theo dõi, dưới đây dán lại phương thức đầu vào lấy tài nguyên `acquireShared()`:

```java
// AQS
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```

Trong phương thức `acquireShared()`, trước tiên sẽ thử lấy tài nguyên qua `tryAcquireShared()`.

Nếu phát hiện giá trị trả về của phương thức `< 0`, tức số tài nguyên còn lại nhỏ hơn 0, chứng tỏ Thread hiện tại lấy tài nguyên thất bại. Vì vậy sẽ đi vào phương thức `doAcquireShared()` để đưa Thread hiện tại vào hàng đợi AQS chờ đợi. Cụ thể như sau:

```java
// AQS
private void doAcquireShared(int arg) {
    // 1. Đưa thread hiện tại vào hàng đợi để chờ.
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                // 2. Nếu thread hiện tại là nút đầu tiên trong hàng đợi chờ, thử lấy tài nguyên.
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    // 3. Đưa nút thread hiện tại ra khỏi hàng đợi chờ và đánh thức các nút thread phía sau.
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        // 3. Nếu lấy tài nguyên thất bại, hủy lấy tài nguyên và cập nhật trạng thái node thành CANCELLED.
        if (failed)
            cancelAcquire(node);
    }
}
```

Vì Thread hiện tại đã thử lấy tài nguyên thất bại, nên trong phương thức `doAcquireShared()`, cần đóng gói Thread hiện tại thành nút `Node` và đưa vào hàng đợi để chờ.

Điểm khác biệt lớn nhất giữa lấy tài nguyên theo **chế độ chia sẻ** và lấy tài nguyên theo **chế độ độc quyền** nằm ở chỗ: ở chế độ chia sẻ, số lượng tài nguyên có thể lớn hơn 1, tức là nhiều Thread có thể cùng lúc giữ tài nguyên.

Vì vậy ở chế độ chia sẻ, sau khi Thread được đánh thức và lấy được tài nguyên, nếu phát hiện vẫn còn tài nguyên dư thì sẽ thử đánh thức các Thread đứng sau để chúng thử lấy tài nguyên. Phương thức `setHeadAndPropagate()` tương ứng như sau:

```java
// AQS
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head;
    // 1. Đưa nút thread hiện tại ra khỏi hàng đợi chờ.
    setHead(node);
    // 2. Đánh thức các nút đang chờ tiếp theo.
    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next;
        if (s == null || s.isShared())
            doReleaseShared();
    }
}
```

Trong phương thức `setHeadAndPropagate()`, việc đánh thức nút tiếp theo cần thỏa mãn những điều kiện nhất định, chủ yếu gồm 2 điều kiện:

- `propagate > 0`: `propagate` đại diện cho số lượng tài nguyên còn lại sau khi lấy tài nguyên; nếu `> 0` thì có thể đánh thức các Thread tiếp theo đi lấy tài nguyên.
- `h.waitStatus < 0`: Nút `h` ở đây là nút `head` trước khi thực thi `setHead()`. Khi kiểm tra `head.waitStatus` lại dùng `< 0`, chủ yếu là để xác định trạng thái của nút `head` là `SIGNAL` hoặc `PROPAGATE`. Nếu nút `head` là `SIGNAL`, có thể đánh thức nút kế tiếp; nếu nút `head` ở trạng thái `PROPAGATE`, cũng có thể đánh thức nút kế tiếp (đây là để giải quyết vấn đề phát sinh trong kịch bản đồng thời, sẽ giải thích kỹ ngay sau đây).

Trong đoạn mã, điều kiện `if` liên quan đến việc **đánh thức các nút đang chờ tiếp theo** hơi phức tạp một chút, hãy cùng xem tại sao lại viết như vậy:

```java
if (propagate > 0 || h == null || h.waitStatus < 0 ||
    (h = head) == null || h.waitStatus < 0)
```

- `h == null || h.waitStatus < 0`: `h == null` dùng để phòng tránh ngoại lệ con trỏ rỗng (`NullPointerException`). Trong trường hợp bình thường `h` sẽ không phải `null`, vì trước khi chạy tới đây thì nút hiện tại đã gia nhập hàng đợi rồi, hàng đợi không thể chưa được khởi tạo.

  `h.waitStatus < 0` chủ yếu kiểm tra xem trạng thái của nút `head` có phải là `SIGNAL` hoặc `PROPAGATE` hay không; dùng trực tiếp `< 0` để phán đoán sẽ thuận tiện hơn.

- `(h = head) == null || h.waitStatus < 0`: Nếu chạy tới điều kiện này, nghĩa là trước đó phép kiểm tra `h.waitStatus < 0` không đúng (hoặc không thỏa mãn), cho thấy có tồn tại đồng thời (concurrency).

  Đồng thời có Thread khác đang đánh thức các nút kế tiếp và đã sửa giá trị của nút `head` từ `SIGNAL` thành `0`. Do đó ở đây lấy lại nút `head` mới — nút `head` mới lần này chính là nút của Thread hiện tại vừa được thiết lập thông qua `setHead()` — sau đó kiểm tra lại trạng thái `waitStatus`.

Nếu điều kiện `if` thỏa mãn, sẽ đi tới phương thức `doReleaseShared()` để đánh thức các nút đang chờ phía sau, như sau:

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        // 1. Trong hàng đợi cần có ít nhất một nút thread đang chờ.
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            // 2. Nếu trạng thái của nút head là SIGNAL, có thể đánh thức nút kế nhiệm.
            if (ws == Node.SIGNAL) {
                // 2.1 Xóa trạng thái SIGNAL của nút head, cập nhật thành 0. Biểu thị đã đánh thức nút kế nhiệm của nút này.
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;
                // 2.2 Đánh thức nút kế nhiệm
                unparkSuccessor(h);
            }
            // 3. Nếu trạng thái của nút head là 0, cập nhật thành PROPAGATE. Điều này nhằm giải quyết vấn đề tồn tại trong kịch bản đồng thời, sẽ trình bày chi tiết ngay sau đây.
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;
        }
        if (h == head)
            break;
    }
}
```

Trong phương thức `doReleaseShared()`, sẽ kiểm tra trạng thái `waitStatus` của nút `head` để quyết định thao tác tiếp theo, có hai trường hợp:

- Trạng thái của nút `head` là `SIGNAL`: Biểu thị nút `head` có nút kế nhiệm cần đánh thức, do đó cập nhật trạng thái `SIGNAL` của nút `head` thành `0` thông qua thao tác `CAS`. Việc xóa bỏ trạng thái `SIGNAL` là để biểu thị rằng đã thực hiện thao tác đánh thức nút kế nhiệm của nút `head`.
- Trạng thái của nút `head` là `0`: Biểu thị đang có tình huống đồng thời xảy ra, cần sửa `0` thành `PROPAGATE` để đảm bảo trong kịch bản đồng thời vẫn có thể đánh thức Thread bình thường.

#### Tại sao cần trạng thái `PROPAGATE`?

Khi giải phóng tài nguyên trong `doReleaseShared()`, bước 3 khá khó hiểu: tức là nếu phát hiện trạng thái của nút `head` là `0`, thì lại cập nhật trạng thái của nút `head` từ `0` thành `PROPAGATE`.

Trong AQS, trạng thái `PROPAGATE` của Node sinh ra chính là để xử lý vấn đề có thể không đánh thức được nút Thread trong kịch bản đồng thời. `PROPAGATE` chỉ được dùng một lần duy nhất trong phương thức `doReleaseShared()`.

**Tiếp theo hãy phân tích qua ví dụ cụ thể: tại sao cần trạng thái `PROPAGATE`?**

Ở chế độ chia sẻ, chuỗi lời gọi phương thức lấy và giải phóng tài nguyên của Thread như sau:

- Chuỗi lời gọi phương thức lấy tài nguyên của Thread là: `acquireShared() -> tryAcquireShared() -> Thread bị chặn chờ đánh thức -> tryAcquireShared() -> setHeadAndPropagate() -> if (số tài nguyên dư > 0) || (head.waitStatus < 0) thì đánh thức nút tiếp theo`.
- Chuỗi lời gọi phương thức giải phóng tài nguyên của Thread là: `releaseShared() -> tryReleaseShared() -> doReleaseShared()`.

**Nếu khi giải phóng tài nguyên không sửa trạng thái của nút `head` từ `0` thành `PROPAGATE`:**

Giả sử có tổng cộng 4 Thread thử lấy tài nguyên theo chế độ chia sẻ, và có tổng cộng 2 tài nguyên. Ban đầu Thread `T3` và `T4` đã lấy được tài nguyên, Thread `T1` và `T2` chưa lấy được nên xếp hàng chờ trong hàng đợi.

- Tại thời điểm 1: Thread `T1` và `T2` đang ở trong hàng đợi chờ, `T3` và `T4` đang giữ tài nguyên. Lúc này các nút trong hàng đợi chờ và trạng thái tương ứng là (trong ngoặc là trạng thái `waitStatus` của nút):

  `head(-1) -> T1(-1) -> T2(0)`.

- Tại thời điểm 2: Thread `T3` giải phóng tài nguyên, thông qua phương thức `doReleaseShared()` cập nhật trạng thái của nút `head` từ `SIGNAL` thành `0`, và đánh thức Thread `T1`, sau đó Thread `T3` thoát ra.

  Thread `T1` sau khi được đánh thức lấy được tài nguyên qua `tryAcquireShared()`, nhưng lúc này chưa kịp thực thi `setHeadAndPropagate()` để đặt bản thân thành nút `head`. Lúc này trạng thái các nút trong hàng đợi chờ là:

  `head(0) -> T1(-1) -> T2(0)`.

- Tại thời điểm 3: Thread `T4` giải phóng tài nguyên; vì lúc này trạng thái của nút `head` là `0`, nếu trong `doReleaseShared()` khi `ws == 0` không làm gì cả (tức là không có trạng thái `PROPAGATE`), thì `T4` không thể đánh thức nút kế nhiệm của `head`, sau đó Thread `T4` thoát ra.

- Tại thời điểm 4: Thread `T1` tiếp tục thực thi phương thức `setHeadAndPropagate()`. Trước tiên lưu lại `head` cũ (`waitStatus == 0`), sau đó thực thi `setHead(T1)` để đặt bản thân làm nút `head`.

  Lúc này `propagate == 0`, `head.waitStatus` cũ `== 0`, hai điều kiện đầu không thỏa mãn. Nhưng vì `setHead()` không đặt lại `waitStatus`, nên `waitStatus` của `head` mới (tức là nút `T1` ban đầu) vẫn là `-1` (`SIGNAL`), vì thế phép kiểm tra lần hai `(h = head).waitStatus < 0` vẫn đúng và sẽ gọi `doReleaseShared()` để đánh thức `T2`.

  Trong trình tự thời gian này, phép kiểm tra `head` lần hai quả thực có thể đỡ được. Vậy `PROPAGATE` giải quyết vấn đề gì?

- Tại thời điểm 5 (trình tự thời gian cực đoan hơn), hãy xét sự xen kẽ sau: sau khi Thread `T1` thực thi xong `setHead(T1)` nhưng **trước khi** kiểm tra `head.waitStatus` mới, `doReleaseShared()` của Thread `T4` vừa đúng lúc thực thi `unparkSuccessor()` để đánh thức `T2`, `T2` nhanh chóng lấy tài nguyên và thực thi `setHead(T2)` để đặt bản thân làm `head` mới. Vì `T2` vốn là nút cuối hàng đợi nên `waitStatus` của nó là `0`. Khi `T1` tiếp tục chạy và đọc `head` mới, nó đọc phải nút `T2` (`waitStatus == 0`), lúc này phép kiểm tra lần hai cũng không thể vượt qua được nữa.

  Trong trình tự thời gian đồng thời cực đoan này, `propagate == 0`, `head.waitStatus` cũ `== 0`, `head.waitStatus` mới `== 0`, cả ba điều kiện đều không thỏa mãn, `T1` sẽ không gọi `doReleaseShared()`. Nếu lúc này trong hàng đợi vẫn còn các nút đang chờ phía sau, thì sẽ dẫn đến mất tín hiệu đánh thức.

Bảng diễn biến thời gian tương ứng như sau:

| Thời điểm   | Thread T1                                                                                            | Thread T2                                                                  | Thread T3          | Thread T4                                                                   | Hàng đợi chờ                      |
| ----------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------- | --------------------------------- |
| Thời điểm 1 | Trong hàng đợi chờ                                                                                   | Trong hàng đợi chờ                                                         | Đang giữ tài nguyên | Đang giữ tài nguyên                                                         | `head(-1) -> T1(-1) -> T2(0)`     |
| Thời điểm 2 | (Thực thi) Sau khi được đánh thức đã lấy được tài nguyên, nhưng chưa kịp đặt bản thân làm nút `head` | Trong hàng đợi chờ                                                         | (Thực thi) Giải phóng tài nguyên | Đang giữ tài nguyên                                                         | `head(0) -> T1(-1) -> T2(0)`      |
| Thời điểm 3 |                                                                                                      | Trong hàng đợi chờ                                                         | Đã thoát           | (Thực thi) Giải phóng tài nguyên. Nhưng nút `head` ở trạng thái `0`, không thể đánh thức nút kế nhiệm | `head(0) -> T1(-1) -> T2(0)`      |
| Thời điểm 4 | (Thực thi) Hoàn tất `setHead(T1)`, chưa kịp kiểm tra `head.waitStatus` mới                           | Trong hàng đợi chờ                                                         | Đã thoát           | Đã thoát                                                                    | `head(-1, nút Thread T1) -> T2(0)` |
| Thời điểm 5 |                                                                                                      | (Thực thi) Được T4 đánh thức, lấy tài nguyên, thực thi `setHead(T2)` thành `head` mới | Đã thoát           | (Thực thi) `doReleaseShared()` đánh thức T2                                 | `head(0, nút Thread T2)`          |
| Thời điểm 6 | (Thực thi) Đọc `head` mới là nút T2, `waitStatus == 0`, kiểm tra lần hai thất bại, không đánh thức nút tiếp theo | Đã lấy tài nguyên                                                          | Đã thoát           | Đã thoát                                                                    | `head(0, nút Thread T2)`          |

**Nếu khi Thread giải phóng tài nguyên sửa trạng thái nút `head` từ `0` thành `PROPAGATE`, thì có thể giải quyết vấn đề đồng thời xuất hiện ở trên, cụ thể như sau:**

Điểm mấu chốt của `PROPAGATE` là: nó sửa đổi trạng thái của **`head` cũ**, mà tham chiếu của `head` cũ đã được lưu vào biến cục bộ `h` ngay từ đầu phương thức `setHeadAndPropagate()`, nên sẽ không bị ảnh hưởng bởi các thay đổi đồng thời về sau.

- Tại thời điểm 1~2, giống với kịch bản trên:

  Thời điểm 1: `head(-1) -> T1(-1) -> T2(0)`.

  Thời điểm 2: `T3` giải phóng tài nguyên, trạng thái `head` chuyển thành `0` và đánh thức `T1`.

- Tại thời điểm 3: Thread `T4` giải phóng tài nguyên; vì lúc này trạng thái của nút `head` là `0`, `doReleaseShared()` sẽ cập nhật trạng thái của nút `head` từ `0` thành `PROPAGATE(-3)`, sau đó Thread `T4` thoát ra. Lúc này trạng thái các nút trong hàng đợi chờ là:

  `head(PROPAGATE) -> T1(-1) -> T2(0)`.

- Tại thời điểm 4: Thread `T1` tiếp tục thực thi phương thức `setHeadAndPropagate()`. Trước tiên lưu `head` cũ vào biến cục bộ `h`, lúc này `h.waitStatus == PROPAGATE(-3)`. Sau đó thực thi `setHead(T1)` để đặt bản thân làm nút `head`.

- Tại thời điểm 5: Ngay cả khi xảy ra sự xen kẽ cực đoan tương tự như trước (`T4` đánh thức `T2`, `T2` trở thành `head` mới), khi `T1` kiểm tra:

  - `propagate > 0` → `0 > 0` → false
  - `h == null` → false
  - `h.waitStatus < 0` → `PROPAGATE(-3) < 0` → **true**!

  Vì tham chiếu `h` của `head` cũ đã được lưu từ đầu phương thức, không chịu ảnh hưởng của `setHead()` và các thao tác đồng thời sau đó, nên trạng thái `PROPAGATE` đảm bảo `h.waitStatus < 0` chắc chắn đi qua được. Do đó Thread `T1` sẽ gọi `doReleaseShared()` trong phương thức `setHeadAndPropagate()` để đánh thức các nút tiếp theo.

Nhờ có trạng thái `PROPAGATE`, có thể tránh được vấn đề mất tín hiệu đánh thức trong kịch bản đồng thời cực đoan. Bảng diễn biến thời gian tương ứng như sau:

| Thời điểm   | Thread T1                                                                                                     | Thread T2                                                               | Thread T3          | Thread T4                                                                         | Hàng đợi chờ                          |
| ----------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- | ------------------------------------- |
| Thời điểm 1 | Trong hàng đợi chờ                                                                                            | Trong hàng đợi chờ                                                      | Đang giữ tài nguyên | Đang giữ tài nguyên                                                               | `head(-1) -> T1(-1) -> T2(0)`         |
| Thời điểm 2 | (Thực thi) Sau khi được đánh thức đã lấy được tài nguyên, nhưng chưa kịp đặt bản thân làm nút `head`          | Trong hàng đợi chờ                                                      | (Thực thi) Giải phóng tài nguyên | Đang giữ tài nguyên                                                               | `head(0) -> T1(-1) -> T2(0)`          |
| Thời điểm 3 | Chưa tiếp tục chạy xuống dưới                                                                                 | Trong hàng đợi chờ                                                      | Đã thoát           | (Thực thi) Giải phóng tài nguyên. Lúc này sẽ cập nhật trạng thái nút `head` từ `0` thành `PROPAGATE` | `head(PROPAGATE) -> T1(-1) -> T2(0)`  |
| Thời điểm 4 | (Thực thi) Lưu `head` cũ (`waitStatus == PROPAGATE`), thực thi `setHead(T1)`                                  | Trong hàng đợi chờ                                                      | Đã thoát           | Đã thoát                                                                          | `head(-1, nút Thread T1) -> T2(0)`    |
| Thời điểm 5 | (Thực thi) Phán đoán `h.waitStatus < 0` cũ (`PROPAGATE(-3) < 0`) đúng, gọi `doReleaseShared()` đánh thức nút tiếp theo | Trong hàng đợi chờ                                                      | Đã thoát           | Đã thoát                                                                          | `head(0, nút Thread T1) -> T2(0)`     |
| Thời điểm 6 | Đã thoát                                                                                                      | (Thực thi) Thread `T2` sau khi được đánh thức lấy tài nguyên và đặt bản thân làm nút `head` | Đã thoát           | Đã thoát                                                                          | `head(0, nút Thread T2)`              |

Tóm tắt ngắn gọn: Trạng thái `PROPAGATE` và phép kiểm tra `head` lần hai trong `setHeadAndPropagate()` chính là **lớp bảo hiểm kép** cho cùng một bản sửa lỗi ([JDK-6801020](https://bugs.openjdk.org/browse/JDK-6801020)) trong JDK 7. `PROPAGATE` mang lại sự đảm bảo đáng tin cậy hơn thông qua việc sửa trạng thái của `head` cũ, bởi vì tham chiếu tới `head` cũ đã được lưu vào biến cục bộ ngay từ đầu phương thức, không bị thao tác `setHead()` đồng thời thay thế.

### Phân tích mã nguồn giải phóng tài nguyên trong AQS (Chế độ chia sẻ)

Phương thức đầu vào để giải phóng tài nguyên theo chế độ chia sẻ trong AQS là `releaseShared()`, mã nguồn như sau:

```java
// AQS
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

Trong đó phương thức `tryReleaseShared()` là phương thức khuôn mẫu do AQS cung cấp; ở đây vẫn lấy `Semaphore` để giải thích, như sau:

```java
// Semaphore
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();
        int next = current + releases;
        if (next < current) // overflow
            throw new Error("Maximum permit count exceeded");
        if (compareAndSetState(current, next))
            return true;
    }
}
```

Trong phương thức `tryReleaseShared()` do `Semaphore` cài đặt, bên trong vòng lặp vô hạn sẽ liên tục thử giải phóng tài nguyên, tức là cập nhật giá trị `state` thông qua thao tác `CAS`.

Nếu cập nhật thành công, chứng tỏ giải phóng tài nguyên thành công và sẽ đi vào phương thức `doReleaseShared()`.

Phương thức `doReleaseShared()` đã được phân tích chi tiết mã nguồn ở phần lấy tài nguyên (chế độ chia sẻ) phía trên, nên sẽ không lặp lại ở đây nữa.

### Cơ chế hoạt động của hàng đợi điều kiện Condition

Trước đó trong bảng trạng thái `waitStatus` đã nhắc đến trạng thái `CONDITION` (giá trị là -2), biểu thị nút đang chờ trong hàng đợi điều kiện `Condition`. Phần này sẽ trình bày có hệ thống cơ chế hoạt động của hàng đợi điều kiện `Condition`.

#### `Condition` là gì?

`Condition` là interface được định nghĩa trong gói `java.util.concurrent.locks`, cung cấp cơ chế chờ/thông báo cho Thread tương tự như `Object.wait()` / `Object.notify()`, nhưng mạnh mẽ và linh hoạt hơn. `Condition` bắt buộc phải dùng kết hợp với `Lock`, giống như `wait/notify` bắt buộc phải dùng kết hợp với `synchronized`.

So với `wait/notify` của `Object`, các ưu điểm chính của `Condition` bao gồm:

- **Hỗ trợ nhiều hàng đợi chờ:** Một `Lock` có thể tạo ra nhiều thể hiện `Condition`, các Thread khác nhau có thể chờ trên các điều kiện khác nhau, giúp phối hợp giữa các Thread tinh tế hơn. Trong khi `synchronized` chỉ có một hàng đợi chờ duy nhất.
- **Hỗ trợ chờ không phản hồi ngắt (uninterruptible wait):** `Condition` cung cấp phương thức `awaitUninterruptibly()`.
- **Hỗ trợ chờ có thời hạn (timeout wait):** `Condition` cung cấp các phương thức `awaitNanos(long)` và `await(long, TimeUnit)` cho phép thiết lập thời hạn chờ.

#### Hai loại hàng đợi trong AQS

Thực tế bên trong AQS duy trì **hai loại hàng đợi**:

1. **Hàng đợi đồng bộ (Sync Queue / hàng đợi biến thể CLH):** Chính là hàng đợi hai chiều đã phân tích chi tiết ở phần trước, dùng để chứa các nút Thread bị đưa vào chờ do lấy tài nguyên thất bại.
2. **Hàng đợi điều kiện (Condition Queue):** Là một danh sách liên kết đơn (singly linked list), dùng để chứa các nút Thread đang chờ do đã gọi phương thức `Condition.await()`. Mỗi thể hiện `Condition` duy trì một hàng đợi điều kiện độc lập.

Các nút trong hàng đợi điều kiện sử dụng con trỏ `nextWaiter` của `Node` để liên kết tới nút tiếp theo, tạo thành danh sách liên kết đơn. Nút đầu của hàng đợi điều kiện là `firstWaiter`, nút cuối là `lastWaiter`.

#### Quy trình hoạt động cốt lõi của `Condition`

Lớp nội bộ `ConditionObject` của AQS cài đặt interface `Condition`, hai phương thức cốt lõi của nó là `await()` và `signal()`.

**Quy trình hoạt động của phương thức `await()`:**

1. Đóng gói Thread hiện tại thành nút `Node` (`waitStatus` đặt thành `CONDITION`) và thêm vào cuối hàng đợi điều kiện.
2. Giải phóng hoàn toàn khóa mà Thread hiện tại đang giữ (tức đưa giá trị `state` về 0), đồng thời lưu lại giá trị `state` trước khi giải phóng.
3. Chặn Thread hiện tại, chờ được `signal()` đánh thức hoặc bị ngắt (interrupt).
4. Sau khi được đánh thức, quay lại hàng đợi đồng bộ thông qua `acquireQueued()` để cạnh tranh lại khóa, và khôi phục giá trị `state` (số lần tái nhập) đã lưu trước đó.

**Quy trình hoạt động của phương thức `signal()`:**

1. Kiểm tra xem Thread gọi `signal()` có đang giữ khóa hay không (nếu không giữ thì ném ra `IllegalMonitorStateException`).
2. Gỡ nút đầu tiên đang chờ khỏi hàng đợi điều kiện.
3. Sửa `waitStatus` của nút đó từ `CONDITION` thành `0`, và đưa nó vào cuối hàng đợi đồng bộ thông qua phương thức `enq()`.
4. Nếu trạng thái của nút tiền nhiệm trong hàng đợi đồng bộ bất thường (`CANCELLED`) hoặc việc đặt trạng thái nút tiền nhiệm thành `SIGNAL` bằng CAS thất bại, thì trực tiếp đánh thức Thread đó.

Phương thức `signalAll()` tương tự như `signal()`, điểm khác biệt là nó sẽ chuyển **toàn bộ** các nút trong hàng đợi điều kiện sang hàng đợi đồng bộ.

Ví dụ mã nguồn dưới đây minh họa cách dùng điển hình của `Condition` — cài đặt một hàng đợi chặn có giới hạn (bounded blocking queue) đơn giản:

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class SimpleBlockingQueue<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    // Hai hàng đợi điều kiện khác nhau: lần lượt dùng cho "hàng đợi chưa đầy" và "hàng đợi không rỗng"
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public SimpleBlockingQueue(int capacity) {
        this.capacity = capacity;
    }

    /**
     * Thêm phần tử vào hàng đợi, nếu hàng đợi đã đầy thì chờ.
     */
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            // Khi hàng đợi đầy, chờ trên điều kiện notFull
            while (queue.size() == capacity) {
                notFull.await();
            }
            queue.offer(item);
            // Sau khi thêm phần tử, thông báo cho thread tiêu thụ đang chờ trên điều kiện notEmpty
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    /**
     * Lấy phần tử ra khỏi hàng đợi, nếu hàng đợi rỗng thì chờ.
     */
    public T take() throws InterruptedException {
        lock.lock();
        try {
            // Khi hàng đợi rỗng, chờ trên điều kiện notEmpty
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            T item = queue.poll();
            // Sau khi lấy phần tử, thông báo cho thread sản xuất đang chờ trên điều kiện notFull
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        SimpleBlockingQueue<Integer> blockingQueue = new SimpleBlockingQueue<>(5);

        // Thread sản xuất
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    blockingQueue.put(i);
                    System.out.println("Sản xuất: " + i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Producer");

        // Thread tiêu thụ
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    int item = blockingQueue.take();
                    System.out.println("Tiêu thụ: " + item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Consumer");

        producer.start();
        consumer.start();
    }
}
```

Trong ví dụ trên, `notFull` và `notEmpty` là hai thể hiện `Condition` độc lập, lần lượt duy trì hàng đợi điều kiện riêng. Thread sản xuất khi hàng đợi đầy sẽ chờ trên `notFull`, Thread tiêu thụ khi hàng đợi rỗng sẽ chờ trên `notEmpty`. Thiết kế tách biệt điều kiện chờ như vậy giúp tránh đánh thức Thread không cần thiết, hiệu quả hơn so với `synchronized` + `wait/notifyAll`.

#### Phân tích mã nguồn cốt lõi của `await()`

```java
// Lớp nội bộ ConditionObject của AQS
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    // 1. Đóng gói thread hiện tại thành nút Node, đưa vào hàng đợi điều kiện
    Node node = addConditionWaiter();
    // 2. Giải phóng hoàn toàn khóa và lưu lại giá trị state trước khi giải phóng
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    // 3. Nếu nút chưa nằm trong hàng đợi đồng bộ thì chặn thread hiện tại
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    // 4. Sau khi được đánh thức, vào lại hàng đợi đồng bộ để cạnh tranh khóa
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null)
        unlinkCancelledWaiters();
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

Trong phương thức `await()` có hai thao tác then chốt:

- `fullyRelease(node)`: Giải phóng hoàn toàn khóa (chứ không chỉ giải phóng một lần), nhờ đó ngay cả khi Thread đã tái nhập khóa nhiều lần thì trong thời gian chờ các Thread khác vẫn có thể lấy được khóa. Sau khi được đánh thức sẽ khôi phục lại số lần tái nhập trước đó thông qua `acquireQueued(node, savedState)`.
- `isOnSyncQueue(node)`: Kiểm tra xem nút đã được chuyển sang hàng đợi đồng bộ hay chưa. Khi Thread khác gọi `signal()`, nút sẽ được chuyển từ hàng đợi điều kiện sang hàng đợi đồng bộ; lúc này `isOnSyncQueue()` trả về `true`, Thread thoát khỏi vòng lặp `while` và bắt đầu cạnh tranh khóa.

### Phân tích sự khác biệt hiệu năng giữa Fair Lock và Non-fair Lock

Trong phần phân tích mã nguồn trước đó, chúng ta đã lấy Non-fair Lock của `ReentrantLock` làm ví dụ để trình bày cách cài đặt `tryAcquire()`. Thực tế, `ReentrantLock` hỗ trợ đồng thời cả hai chế độ là Fair Lock (khóa công bằng) và Non-fair Lock (khóa không công bằng). Phần này sẽ phân tích sâu sự khác biệt trong cài đặt giữa hai chế độ và tác động của chúng tới hiệu năng.

#### Khác biệt ở tầng mã nguồn

`ReentrantLock` mặc định sử dụng Non-fair Lock, có thể chuyển sang Fair Lock thông qua tham số hàm khởi tạo:

```java
// Non-fair Lock (mặc định)
ReentrantLock unfairLock = new ReentrantLock();
// Fair Lock
ReentrantLock fairLock = new ReentrantLock(true);
```

Sự khác biệt cốt lõi giữa hai chế độ nằm ở cách cài đặt phương thức `tryAcquire()`. `nonfairTryAcquire()` của Non-fair Lock đã được phân tích ở trên, dưới đây là cài đặt của Fair Lock:

```java
// ReentrantLock.FairSync
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // Điểm khác biệt then chốt: gọi hasQueuedPredecessors() trước để kiểm tra xem trong hàng đợi đồng bộ có thread nào đang chờ lâu hơn không
        if (!hasQueuedPredecessors() &&
            compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0)
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```

**Điểm khác biệt duy nhất** là trước khi dùng CAS sửa `state`, Fair Lock có thêm một phép kiểm tra `hasQueuedPredecessors()`:

```java
// AQS
public final boolean hasQueuedPredecessors() {
    Node t = tail;
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

Phương thức này dùng để kiểm tra xem trước Thread hiện tại có Thread nào khác đang xếp hàng hay không. Nếu có, Thread hiện tại không thể trực tiếp lấy khóa mà bắt buộc phải xếp hàng chờ, qua đó đảm bảo tính công bằng theo thứ tự **FIFO**.

Trong khi đó, Non-fair Lock không có phép kiểm tra này: khi khóa vừa được giải phóng, Thread mới đến có thể dùng CAS giành lấy khóa ngay lập tức, ngay cả khi trong hàng đợi đồng bộ đã có các Thread khác đang chờ.

#### So sánh sự khác biệt về hiệu năng

| Tiêu chí so sánh            | Non-fair Lock (Mặc định)                                                                                  | Fair Lock                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Thông lượng (Throughput)** | Cao hơn. Thread mới có cơ hội lấy khóa trực tiếp, giảm chuyển đổi ngữ cảnh (context switch) của Thread    | Thấp hơn. Tất cả Thread đều phải xếp hàng, làm tăng chi phí chuyển đổi ngữ cảnh                       |
| **Tình trạng đói (`Starvation`)** | Có thể xảy ra. Trong trường hợp cực đoan, một số Thread không lấy được khóa trong thời gian dài     | Thường ít xảy ra hơn, nhưng Fair Lock không đảm bảo lập lịch Thread ở mức hệ điều hành                 |
| **Chuyển đổi ngữ cảnh**     | Ít hơn. Sau khi Thread giữ khóa giải phóng khóa, Thread mới đến có thể lấy khóa ngay mà không cần đánh thức Thread trong hàng đợi | Nhiều hơn. Mỗi lần giải phóng khóa đều cần đánh thức Thread tiếp theo trong hàng đợi             |
| **Kịch bản áp dụng**        | Đa số kịch bản (yêu cầu cao về thời gian phản hồi và thông lượng)                                         | Các kịch bản có yêu cầu nghiêm ngặt về tính công bằng (như cấp phát tài nguyên, lập lịch tác vụ)      |

**Tại sao hiệu năng của Non-fair Lock thường tốt hơn?**

Nguyên nhân cốt lõi nằm ở việc **giảm số lần chuyển đổi ngữ cảnh (context switch) của Thread**. Sau khi Thread A đang giữ khóa giải phóng khóa:

- **Non-fair Lock:** Lúc này nếu vừa hay có Thread B đang thử lấy khóa (chưa đi vào hàng đợi đồng bộ), Thread B có thể lấy được khóa trực tiếp thông qua CAS và thực thi ngay, tiết kiệm được chi phí đánh thức Thread đang nằm trong hàng đợi. Còn Thread đang chờ trong hàng đợi sau khi được đánh thức nếu thấy khóa đang bị chiếm thì sẽ bị chặn trở lại; tuy nhìn bề ngoài có vẻ "lãng phí" một lần đánh thức, nhưng xét tổng thể lại giảm được số lần chuyển đổi Thread.
- **Fair Lock:** Thread B bắt buộc phải xếp vào cuối hàng đợi, sau đó đánh thức Thread ở đầu hàng đợi. Trong khoảng thời gian từ lúc Thread được đánh thức đến lúc thực sự bắt đầu chạy tồn tại một **độ trễ lập lịch (scheduling latency)** (trạng thái Thread chuyển từ bị chặn sang đang chạy); trong khoảng trễ này khóa đang ở trạng thái rảnh, làm giảm hiệu suất sử dụng khóa.

Doug Lea từng chỉ ra trong tài liệu của `ReentrantLock`: các chương trình sử dụng Fair Lock trong môi trường đa Thread thường có thông lượng tổng thể thấp hơn các chương trình dùng Non-fair Lock (tức chậm hơn), do đó `ReentrantLock` mặc định dùng chế độ Non-fair. Tuy nhiên, trong các kịch bản cần đảm bảo thứ tự xử lý yêu cầu hoặc tránh tình trạng `Starvation` của Thread (như cấp phát từ connection pool), Fair Lock lại là lựa chọn tốt hơn.

Ví dụ mã nguồn dưới đây minh họa sự khác biệt về hành vi giữa Fair Lock và Non-fair Lock:

```java
import java.util.concurrent.locks.ReentrantLock;

public class FairVsUnfairLockDemo {
    // Kiểm thử riêng Fair Lock và Non-fair Lock
    private static void testLock(ReentrantLock lock, String lockType) {
        System.out.println("=== " + lockType + " ===");
        Runnable task = () -> {
            for (int i = 0; i < 2; i++) {
                lock.lock();
                try {
                    System.out.println(Thread.currentThread().getName() + " đã lấy được khóa");
                } finally {
                    lock.unlock();
                }
            }
        };

        Thread[] threads = new Thread[5];
        for (int i = 0; i < 5; i++) {
            threads[i] = new Thread(task, lockType + "-Thread-" + i);
        }
        for (Thread t : threads) {
            t.start();
        }
        for (Thread t : threads) {
            try { t.join(); } catch (InterruptedException e) { }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        // Non-fair Lock: cùng một thread có thể lấy được khóa nhiều lần liên tiếp
        testLock(new ReentrantLock(false), "Non-fair Lock");

        // Fair Lock: khi có cạnh tranh sẽ ưu tiên cấp khóa cho thread chờ lâu hơn
        testLock(new ReentrantLock(true), "Fair Lock");
    }
}
```

Khi chạy đoạn mã trên, thông thường có thể quan sát thấy: ở chế độ Non-fair Lock, cùng một Thread dễ lấy được khóa nhiều lần liên tiếp hơn (vì sau khi giải phóng khóa nó lập tức cạnh tranh lại ngay, có cơ hội giành được khóa trước khi Thread trong hàng đợi kịp được đánh thức); còn Fair Lock khi có các Thread đang chờ sẽ có xu hướng phân phối khóa theo đúng thứ tự hàng đợi. Tuy vậy, tính công bằng không đồng nghĩa với công bằng lập lịch của hệ điều hành: nếu các Thread khác chưa chạy tới điểm chờ, cùng một Thread vẫn có thể lấy khóa liên tiếp.

## Các lớp công cụ đồng bộ phổ biến

### Semaphore (Cờ hiệu / Bộ đếm giấy phép)

#### Giới thiệu

`synchronized` và `ReentrantLock` đều chỉ cho phép một Thread truy cập vào một tài nguyên tại một thời điểm, trong khi `Semaphore` (cờ hiệu) có thể dùng để kiểm soát số lượng Thread truy cập đồng thời vào một tài nguyên cụ thể.

Cách sử dụng `Semaphore` rất đơn giản; giả sử ở đây có `N (N > 5)` Thread cùng lấy tài nguyên chia sẻ trong `Semaphore`, đoạn mã dưới đây biểu thị tại cùng một thời điểm trong N Thread chỉ có 5 Thread lấy được tài nguyên chia sẻ, các Thread khác đều sẽ bị chặn, chỉ những Thread lấy được tài nguyên chia sẻ mới có thể thực thi. Đợi đến khi có Thread giải phóng tài nguyên chia sẻ thì các Thread đang bị chặn khác mới có thể lấy được.

```java
// Số lượng tài nguyên chia sẻ ban đầu
final Semaphore semaphore = new Semaphore(5);
// Lấy 1 giấy phép (permit)
semaphore.acquire();
// Giải phóng 1 giấy phép (permit)
semaphore.release();
```

Khi số lượng tài nguyên ban đầu là 1, `Semaphore` suy biến thành khóa loại trừ tương hỗ (exclusive lock).

`Semaphore` có hai chế độ:

- **Chế độ công bằng (Fair mode):** Khi có cạnh tranh, phương thức `acquire` dạng chặn sẽ chọn Thread theo thứ tự FIFO tại điểm xếp hàng nội bộ; điều này không đồng nghĩa với việc sắp xếp tuyệt đối theo thời gian thực (wall-clock time) của lời gọi phương thức. Ngoài ra, `tryAcquire()` không tham số không tuân theo thiết lập công bằng và vẫn có thể chen ngang thành công;
- **Chế độ không công bằng (Non-fair mode):** Mang tính tranh giành (preemptive).

Hai hàm khởi tạo tương ứng của `Semaphore` như sau:

```java
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}

public Semaphore(int permits, boolean fair) {
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
```

**Cả hai hàm khởi tạo này đều bắt buộc phải cung cấp số lượng giấy phép (`permits`), hàm khởi tạo thứ hai có thể chỉ định chế độ Fair hay Non-fair, mặc định là chế độ Non-fair.**

`Semaphore` thường được dùng trong các kịch bản có giới hạn rõ ràng về số lượng truy cập tài nguyên, chẳng hạn như giới hạn lưu lượng / rate limiting (chỉ giới hạn ở chế độ single-node; trong dự án thực tế nên dùng Redis + Lua để làm rate limiting).

#### Nguyên lý

`Semaphore` là một cài đặt của khóa chia sẻ; mặc định nó khởi tạo giá trị `state` của AQS bằng `permits` — bạn có thể hiểu giá trị `permits` là số lượng giấy phép (permit), chỉ Thread nào lấy được giấy phép mới có thể thực thi.

Lấy phương thức `acquire` không tham số làm ví dụ: khi gọi `semaphore.acquire()`, Thread sẽ thử lấy giấy phép; nếu `state > 0` thì biểu thị có thể lấy thành công, nếu `state <= 0` thì biểu thị số lượng giấy phép không đủ, lấy thất bại.

Nếu có thể lấy thành công (`state > 0`), nó sẽ thử dùng thao tác CAS để sửa giá trị `state` thành `state = state - 1`. Nếu lấy thất bại thì sẽ tạo một nút `Node` đưa vào hàng đợi chờ và treo (suspend) Thread hiện tại.

```java
// Lấy 1 giấy phép
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}

// Lấy một hoặc nhiều giấy phép
public void acquire(int permits) throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireSharedInterruptibly(permits);
}
```

Phương thức `acquireSharedInterruptibly` là cài đặt mặc định trong `AbstractQueuedSynchronizer`.

```java
// Lấy giấy phép ở chế độ chia sẻ; nếu lấy thành công thì trả về, thất bại thì đưa vào hàng đợi chờ và treo thread
public final void acquireSharedInterruptibly(int arg)
    throws InterruptedException {
    if (Thread.interrupted())
      throw new InterruptedException();
        // Thử lấy giấy phép, arg là số lượng giấy phép cần lấy; khi lấy thất bại sẽ tạo nút đưa vào hàng đợi chờ và treo thread hiện tại.
    if (tryAcquireShared(arg) < 0)
      doAcquireSharedInterruptibly(arg);
}
```

Ở đây tiếp tục lấy chế độ Non-fair (`NonfairSync`) làm ví dụ để xem cách cài đặt phương thức `tryAcquireShared`.

```java
// Thử lấy tài nguyên ở chế độ chia sẻ (tài nguyên trong Semaphore chính là giấy phép):
protected int tryAcquireShared(int acquires) {
    return nonfairTryAcquireShared(acquires);
}

// Lấy giấy phép theo chế độ chia sẻ không công bằng
final int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        // Số lượng giấy phép khả dụng hiện tại
        int available = getState();
        /*
         * Thử lấy giấy phép: khi số lượng giấy phép khả dụng <= 0 sẽ trả về giá trị âm, biểu thị lấy thất bại;
         * chỉ khi giấy phép khả dụng > 0 mới có thể lấy thành công; nếu CAS thất bại sẽ lặp lại để đọc giá trị mới nhất và thử lại
         */
        int remaining = available - acquires;
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```

Lấy phương thức `release` không tham số làm ví dụ: khi gọi `semaphore.release();`, Thread thử giải phóng giấy phép và dùng thao tác CAS để sửa giá trị `state` thành `state = state + 1`. Sau khi giải phóng giấy phép thành công, đồng thời sẽ đánh thức một Thread trong hàng đợi chờ. Thread được đánh thức sẽ thử lại việc sửa giá trị `state` thành `state = state - 1`; nếu `state > 0` (sau khi trừ vẫn hợp lệ) thì lấy token thành công, ngược lại sẽ quay lại hàng đợi chờ và tiếp tục treo Thread.

```java
// Giải phóng một giấy phép
public void release() {
    sync.releaseShared(1);
}

// Giải phóng một hoặc nhiều giấy phép
public void release(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.releaseShared(permits);
}
```

Phương thức `releaseShared` là cài đặt mặc định trong `AbstractQueuedSynchronizer`.

```java
// Giải phóng khóa chia sẻ
// Nếu tryReleaseShared trả về true, đánh thức một hoặc nhiều thread trong hàng đợi chờ.
public final boolean releaseShared(int arg) {
    // Giải phóng khóa chia sẻ
    if (tryReleaseShared(arg)) {
      // Đánh thức nút chờ kế tiếp của nút hiện tại
      doReleaseShared();
      return true;
    }
    return false;
}
```

Phương thức `tryReleaseShared` là một phương thức được lớp nội bộ `Sync` của `Semaphore` ghi đè (`Override`); cài đặt mặc định trong `AbstractQueuedSynchronizer` chỉ ném ra ngoại lệ `UnsupportedOperationException`.

```java
// Một phương thức được ghi đè trong lớp nội bộ Sync
// Thử giải phóng tài nguyên
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();
        // Tăng số giấy phép khả dụng
        int next = current + releases;
        if (next < current) // overflow
            throw new Error("Maximum permit count exceeded");
         // Sửa giá trị state bằng CAS
        if (compareAndSetState(current, next))
            return true;
    }
}
```

Có thể thấy, các phương thức đề cập ở trên về cơ bản đều được triển khai ở tầng dưới thông qua bộ đồng bộ `sync`. `Sync` là lớp nội bộ của `CountDownLatch`, kế thừa `AbstractQueuedSynchronizer` và ghi đè một số phương thức trong đó. Đồng thời, ứng với `Sync` còn có hai lớp con là `NonfairSync` (ứng với chế độ không công bằng) và `FairSync` (ứng với chế độ công bằng).

```java
private static final class Sync extends AbstractQueuedSynchronizer {
  // ...
}
static final class NonfairSync extends Sync {
  // ...
}
static final class FairSync extends Sync {
  // ...
}
```

#### Thực chiến

```java
public class SemaphoreExample {
  // Số lượng yêu cầu
  private static final int threadCount = 550;

  public static void main(String[] args) throws InterruptedException {
    // Tạo một đối tượng Thread Pool với số lượng thread cố định (nếu cấp số lượng thread cho Thread Pool ở đây quá ít, bạn sẽ thấy chạy rất chậm)
    ExecutorService threadPool = Executors.newFixedThreadPool(300);
    // Số lượng giấy phép ban đầu
    final Semaphore semaphore = new Semaphore(20);

    for (int i = 0; i < threadCount; i++) {
      final int threadnum = i;
      threadPool.execute(() -> {// Sử dụng biểu thức Lambda
        try {
          semaphore.acquire();// Lấy một giấy phép, do đó số thread có thể chạy đồng thời là 20/1 = 20
          test(threadnum);
          semaphore.release();// Giải phóng một giấy phép
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }

      });
    }
    threadPool.shutdown();
    System.out.println("finish");
  }

  public static void test(int threadnum) throws InterruptedException {
    Thread.sleep(1000);// Mô phỏng thao tác tốn thời gian của yêu cầu
    System.out.println("threadnum:" + threadnum);
    Thread.sleep(1000);// Mô phỏng thao tác tốn thời gian của yêu cầu
  }
}
```

Khi thực thi phương thức `acquire()`, Thread sẽ bị chặn cho tới khi có một giấy phép khả dụng rồi lấy đi một giấy phép; mỗi phương thức `release` sẽ tăng thêm một giấy phép, điều này có thể giải phóng một lời gọi `acquire()` đang bị chặn. Tuy nhiên, thực chất không hề có đối tượng vật lý nào gọi là giấy phép cả, `Semaphore` chỉ duy trì một con số biểu thị số lượng giấy phép có thể nhận được. `Semaphore` thường dùng để giới hạn số lượng Thread được phép lấy một loại tài nguyên nào đó.

Tất nhiên cùng một lúc cũng có thể lấy và giải phóng nhiều giấy phép, nhưng thông thường không cần thiết làm vậy:

```java
semaphore.acquire(5);// Lấy 5 giấy phép, do đó số thread có thể chạy đồng thời là 20/5 = 4
test(threadnum);
semaphore.release(5);// Giải phóng 5 giấy phép
```

Ngoài phương thức `acquire()`, một phương thức tương ứng khá hay dùng khác là `tryAcquire()`, phương thức này nếu không lấy được giấy phép sẽ trả về `false` ngay lập tức.

[Nội dung bổ sung từ issue645](https://github.com/Snailclimb/JavaGuide/issues/645):

> `Semaphore` được cài đặt dựa trên AQS để kiểm soát số lượng Thread truy cập đồng thời, nhưng nó có điểm khác biệt so với khái niệm khóa chia sẻ thuần túy. Hàm khởi tạo của `Semaphore` dùng tham số `permits` để khởi tạo biến `state` của AQS, biến này biểu thị số lượng giấy phép khả dụng. Khi Thread gọi phương thức `acquire()` để thử lấy giấy phép, `state` sẽ được giảm đi 1 một cách nguyên tử. Nếu sau khi giảm 1 mà `state >= 0`, thì `acquire()` trả về thành công và Thread có thể tiếp tục thực thi. Nếu sau khi giảm 1 mà `state < 0`, điều đó biểu thị số lượng Thread truy cập đồng thời hiện tại đã đạt tới giới hạn `permits`, Thread này sẽ được đưa vào hàng đợi chờ của AQS và bị chặn, **chứ không phải tự xoay chờ (spin wait)**. Khi Thread khác hoàn thành nhiệm vụ và gọi phương thức `release()`, `state` sẽ tăng thêm 1 một cách nguyên tử. Thao tác `release()` sẽ đánh thức một hoặc nhiều Thread đang bị chặn trong hàng đợi chờ của AQS. Các Thread được đánh thức này sẽ thử lại thao tác `acquire()`, cạnh tranh để lấy giấy phép khả dụng. Do đó, `Semaphore` kiểm soát số lượng giấy phép để giới hạn số Thread truy cập đồng thời, chứ không phải thông qua cơ chế tự xoay (spin) và khóa chia sẻ.

### CountDownLatch (Bộ đếm ngược)

#### Giới thiệu

`CountDownLatch` cho phép `count` Thread (hoặc một hay nhiều Thread chờ `count` tác vụ) bị chặn tại một điểm, cho đến khi toàn bộ nhiệm vụ đều hoàn thành xong.

`CountDownLatch` chỉ sử dụng được một lần duy nhất: giá trị của bộ đếm chỉ có thể khởi tạo một lần trong hàm khởi tạo, sau đó không có cơ chế nào để thiết lập lại giá trị cho nó nữa; khi `CountDownLatch` đã sử dụng xong thì không thể tái sử dụng lại được.

#### Nguyên lý

`CountDownLatch` là một cài đặt của khóa chia sẻ; mặc định nó khởi tạo giá trị `state` của AQS bằng `count`. Điều này chúng ta có thể thấy ngay thông qua hàm khởi tạo của `CountDownLatch`.

```java
public CountDownLatch(int count) {
    if (count < 0) throw new IllegalArgumentException("count < 0");
    this.sync = new Sync(count);
}

private static final class Sync extends AbstractQueuedSynchronizer {
    Sync(int count) {
        setState(count);
    }
  //...
}
```

Khi Thread gọi `countDown()`, thực chất là sử dụng phương thức `tryReleaseShared` với thao tác CAS để giảm dần `state`, cho đến khi `state` bằng 0. Khi `state` bằng 0, biểu thị tất cả các lượt đếm (hoặc toàn bộ Thread) đều đã gọi phương thức `countDown`, lúc này các Thread đang chờ trên `CountDownLatch` sẽ được đánh thức và tiếp tục thực thi.

```java
public void countDown() {
    // Sync là lớp nội bộ của CountDownLatch, kế thừa AbstractQueuedSynchronizer
    sync.releaseShared(1);
}
```

Phương thức `releaseShared` là cài đặt mặc định trong `AbstractQueuedSynchronizer`.

```java
// Giải phóng khóa chia sẻ
// Nếu tryReleaseShared trả về true, đánh thức một hoặc nhiều thread trong hàng đợi chờ.
public final boolean releaseShared(int arg) {
    // Giải phóng khóa chia sẻ
    if (tryReleaseShared(arg)) {
      // Đánh thức nút chờ kế tiếp của nút hiện tại
      doReleaseShared();
      return true;
    }
    return false;
}
```

Phương thức `tryReleaseShared` là phương thức được lớp nội bộ `Sync` của `CountDownLatch` ghi đè (`Override`); cài đặt mặc định trong `AbstractQueuedSynchronizer` chỉ ném ra ngoại lệ `UnsupportedOperationException`.

```java
// Giảm dần state cho đến khi state bằng 0;
// chỉ khi count giảm về 0 thì countDown (tryReleaseShared) mới trả về true
protected boolean tryReleaseShared(int releases) {
    // Tự xoay (spin) kiểm tra xem state đã bằng 0 hay chưa
    for (;;) {
        int c = getState();
        // Nếu state đã là 0 rồi thì trả về false trực tiếp
        if (c == 0)
            return false;
        // Giảm dần state
        int nextc = c-1;
        // Cập nhật giá trị state bằng thao tác CAS
        if (compareAndSetState(c, nextc))
            return nextc == 0;
    }
}
```

Lấy phương thức `await` không tham số làm ví dụ: khi gọi `await()`, nếu `state` khác 0 thì chứng tỏ nhiệm vụ vẫn chưa thực thi xong, `await()` sẽ bị chặn liên tục — tức là các câu lệnh phía sau `await()` sẽ không được thực thi (Thread `main` đã được đưa vào hàng đợi chờ, tức là hàng đợi biến thể CLH). Sau đó `CountDownLatch` kiểm tra `state == 0` thông qua cơ chế spin CAS; nếu `state == 0` thì sẽ giải phóng toàn bộ các Thread đang chờ, và các câu lệnh phía sau phương thức `await()` mới được thực thi.

```java
// Chờ (cũng có thể gọi là lấy khóa)
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
// Chờ có thời gian chờ tối đa (timeout)
public boolean await(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
}
```

Phương thức `acquireSharedInterruptibly` là cài đặt mặc định trong `AbstractQueuedSynchronizer`.

```java
// Thử lấy khóa; nếu lấy thành công thì trả về, thất bại thì đưa vào hàng đợi chờ và treo thread
public final void acquireSharedInterruptibly(int arg)
    throws InterruptedException {
    if (Thread.interrupted())
      throw new InterruptedException();
        // Thử lấy khóa, lấy thành công thì trả về
    if (tryAcquireShared(arg) < 0)
      // Lấy thất bại thì đưa vào hàng đợi chờ và treo thread
      doAcquireSharedInterruptibly(arg);
}
```

Phương thức `tryAcquireShared` là phương thức được lớp nội bộ `Sync` của `CountDownLatch` ghi đè (`Override`), tác dụng của nó là kiểm tra xem giá trị của `state` có bằng 0 hay không: nếu bằng 0 thì trả về 1, ngược lại trả về -1.

```java
protected int tryAcquireShared(int acquires) {
    return (getState() == 0) ? 1 : -1;
}
```

#### Thực chiến

**Hai cách sử dụng điển hình của `CountDownLatch`**:

1. Một Thread nào đó trước khi bắt đầu chạy phải chờ `n` Thread khác thực thi xong: Khởi tạo bộ đếm của `CountDownLatch` bằng `n` (`new CountDownLatch(n)`), mỗi khi một Thread tác vụ thực thi xong thì giảm bộ đếm đi 1 (`countdownlatch.countDown()`); khi giá trị bộ đếm về 0, Thread đang gọi `await()` trên `CountDownLatch` sẽ được đánh thức. Một kịch bản ứng dụng điển hình là khi khởi động một dịch vụ, Thread chính cần chờ nhiều thành phần tải xong hoàn toàn rồi mới chạy tiếp.
2. Đạt được tính song song tối đa (maximum parallelism) khi nhiều Thread bắt đầu thực thi tác vụ: Lưu ý đây là tính song song (parallelism), không phải đồng thời (concurrency), nhấn mạnh việc nhiều Thread đồng loạt bắt đầu chạy tại cùng một thời điểm. Tương tự như chạy đua: đặt nhiều Thread ở vạch xuất phát, chờ tiếng súng phát lệnh rồi cùng lúc xuất phát. Cách làm là khởi tạo một đối tượng `CountDownLatch` dùng chung với bộ đếm bằng 1 (`new CountDownLatch(1)`); nhiều Thread trước khi bắt đầu thực thi tác vụ sẽ gọi `coundownlatch.await()` trước; khi Thread chính gọi `countDown()`, bộ đếm về 0 và toàn bộ các Thread sẽ được đánh thức cùng một lúc.

**Ví dụ mã nguồn `CountDownLatch`**:

```java
public class CountDownLatchExample {
  // Số lượng yêu cầu
  private static final int THREAD_COUNT = 550;

  public static void main(String[] args) throws InterruptedException {
    // Tạo một đối tượng Thread Pool có số lượng thread cố định (nếu cấp số lượng thread ở đây quá ít thì sẽ thấy chạy rất chậm)
    // Chỉ dùng để kiểm thử; trong thực tế vui lòng tự cấu hình tham số Thread Pool phù hợp
    ExecutorService threadPool = Executors.newFixedThreadPool(300);
    final CountDownLatch countDownLatch = new CountDownLatch(THREAD_COUNT);
    for (int i = 0; i < THREAD_COUNT; i++) {
      final int threadNum = i;
      threadPool.execute(() -> {
        try {
          test(threadNum);
        } catch (InterruptedException e) {
          e.printStackTrace();
        } finally {
          // Biểu thị một yêu cầu đã được xử lý xong
          countDownLatch.countDown();
        }

      });
    }
    countDownLatch.await();
    threadPool.shutdown();
    System.out.println("finish");
  }

  public static void test(int threadnum) throws InterruptedException {
    Thread.sleep(1000);
    System.out.println("threadNum:" + threadnum);
    Thread.sleep(1000);
  }
}
```

Trong đoạn mã trên, chúng ta định nghĩa số lượng yêu cầu là 550; chỉ sau khi 550 yêu cầu này được xử lý hoàn tất thì câu lệnh `System.out.println("finish");` mới được thực thi.

Tương tác đầu tiên với `CountDownLatch` là việc Thread chính chờ các Thread khác. Thread chính phải gọi ngay phương thức `CountDownLatch.await()` sau khi khởi chạy các Thread khác. Như vậy hoạt động của Thread chính sẽ bị chặn tại phương thức này cho đến khi các Thread khác hoàn thành nhiệm vụ riêng của mình.

`N` Thread còn lại đều phải giữ tham chiếu tới đối tượng chốt đếm (latch), vì chúng cần thông báo cho đối tượng `CountDownLatch` biết rằng mình đã hoàn thành xong công việc. Cơ chế thông báo này được thực hiện qua phương thức `CountDownLatch.countDown()`; mỗi lần gọi phương thức này, giá trị `count` được khởi tạo trong hàm khởi tạo sẽ giảm đi 1. Vì thế khi cả `N` Thread đều đã gọi phương thức này, giá trị `count` sẽ bằng 0, và khi đó Thread chính có thể vượt qua phương thức `await()` để tiếp tục thực thi công việc của mình.

Nói thêm một chút: phương thức `await()` của `CountDownLatch` nếu dùng không đúng rất dễ gây ra `Deadlock` (chờ vô hạn), chẳng hạn nếu vòng lặp `for` trong đoạn mã trên sửa thành:

```java
for (int i = 0; i < threadCount-1; i++) {
.......
}
```

Như vậy sẽ khiến giá trị `count` không thể nào giảm về 0 được, dẫn đến tình trạng chờ đợi mãi mãi.

### CyclicBarrier (Rào chắn tuần hoàn)

#### Giới thiệu

`CyclicBarrier` rất giống với `CountDownLatch`, nó cũng có thể thực hiện việc chờ theo bộ đếm giữa các Thread, nhưng tính năng của nó phức tạp và mạnh mẽ hơn `CountDownLatch`. Các kịch bản ứng dụng chính cũng tương tự `CountDownLatch`.

> Cài đặt của `CountDownLatch` dựa trực tiếp trên AQS, còn `CyclicBarrier` dựa trên `ReentrantLock` (`ReentrantLock` cũng thuộc bộ đồng bộ AQS) và `Condition`.

Nghĩa đen của `CyclicBarrier` là rào chắn (Barrier) có thể tái sử dụng tuần hoàn (Cyclic). Nhiệm vụ của nó là: làm cho một nhóm Thread bị chặn khi chạm tới một rào chắn (còn gọi là điểm đồng bộ), cho đến khi Thread cuối cùng chạm tới rào chắn thì rào chắn mới mở cửa, và tất cả các Thread bị rào chắn giữ lại mới cùng tiếp tục làm việc.

#### Nguyên lý

Bên trong `CyclicBarrier` sử dụng một biến `count` làm bộ đếm; giá trị khởi tạo của `count` bằng giá trị khởi tạo của thuộc tính `parties`. Mỗi khi có một Thread đi tới rào chắn, bộ đếm sẽ giảm đi 1. Nếu giá trị `count` về 0, biểu thị đây là Thread cuối cùng của thế hệ (generation) này chạm tới rào chắn, khi đó nó sẽ thử thực thi tác vụ được truyền vào trong hàm khởi tạo.

```java
// Số lượng thread bị chặn mỗi đợt
private final int parties;
// Bộ đếm
private int count;
```

Dưới đây chúng ta hãy kết hợp với mã nguồn để xem sơ qua.

1. Hàm khởi tạo mặc định của `CyclicBarrier` là `CyclicBarrier(int parties)`, tham số của nó biểu thị số lượng Thread bị rào chắn chặn lại; mỗi Thread gọi phương thức `await()` để báo cho `CyclicBarrier` biết mình đã tới rào chắn, sau đó Thread hiện tại bị chặn.

```java
public CyclicBarrier(int parties) {
    this(parties, null);
}

public CyclicBarrier(int parties, Runnable barrierAction) {
    if (parties <= 0) throw new IllegalArgumentException();
    this.parties = parties;
    this.count = parties;
    this.barrierCommand = barrierAction;
}
```

Trong đó, `parties` đại diện cho số lượng Thread cần chặn; khi số lượng Thread bị chặn đạt tới giá trị này thì sẽ mở rào chắn, cho phép tất cả các Thread đi qua.

2. Khi gọi phương thức `await()` trên đối tượng `CyclicBarrier`, thực tế nó gọi phương thức `dowait(false, 0L)`. Phương thức `await()` giống như hành động dựng lên một hàng rào để giữ các Thread lại; chỉ khi số Thread bị chặn đạt đến giá trị `parties` thì hàng rào mới mở ra để các Thread tiếp tục thực thi.

```java
public int await() throws InterruptedException, BrokenBarrierException {
  try {
      return dowait(false, 0L);
  } catch (TimeoutException toe) {
      throw new Error(toe); // cannot happen
  }
}
```

Phân tích mã nguồn phương thức `dowait(false, 0L)` như sau:

```java
    // Khi số lượng thread hoặc số lượng yêu cầu đạt tới count thì các câu lệnh sau await mới được thực thi. Trong ví dụ trên, giá trị của count là 5.
    private int count;
    /**
     * Main barrier code, covering the various policies.
     */
    private int dowait(boolean timed, long nanos)
        throws InterruptedException, BrokenBarrierException,
               TimeoutException {
        final ReentrantLock lock = this.lock;
        // Khóa lại
        lock.lock();
        try {
            final Generation g = generation;

            if (g.broken)
                throw new BrokenBarrierException();

            // Nếu thread bị ngắt (interrupt), ném ngoại lệ
            if (Thread.interrupted()) {
                breakBarrier();
                throw new InterruptedException();
            }
            // Giảm count đi 1
            int index = --count;
            // Khi count giảm về 0 nghĩa là thread cuối cùng đã tới rào chắn, tức là đạt điều kiện thực thi tiếp sau phương thức await
            if (index == 0) {  // tripped
                boolean ranAction = false;
                try {
                    final Runnable command = barrierCommand;
                    if (command != null)
                        command.run();
                    ranAction = true;
                    // Đặt lại count về giá trị khởi tạo của thuộc tính parties
                    // Đánh thức các thread đang chờ trước đó
                    // Bắt đầu lượt thực thi tiếp theo
                    nextGeneration();
                    return 0;
                } finally {
                    if (!ranAction)
                        breakBarrier();
                }
            }

            // loop until tripped, broken, interrupted, or timed out
            for (;;) {
                try {
                    if (!timed)
                        trip.await();
                    else if (nanos > 0L)
                        nanos = trip.awaitNanos(nanos);
                } catch (InterruptedException ie) {
                    if (g == generation && ! g.broken) {
                        breakBarrier();
                        throw ie;
                    } else {
                        // We're about to finish waiting even if we had not
                        // been interrupted, so this interrupt is deemed to
                        // "belong" to subsequent execution.
                        Thread.currentThread().interrupt();
                    }
                }

                if (g.broken)
                    throw new BrokenBarrierException();

                if (g != generation)
                    return index;

                if (timed && nanos <= 0L) {
                    breakBarrier();
                    throw new TimeoutException();
                }
            }
        } finally {
            lock.unlock();
        }
    }
```

#### Thực chiến

Ví dụ 1:

```java
public class CyclicBarrierExample1 {
  // Số lượng yêu cầu
  private static final int threadCount = 550;
  // Số lượng thread cần đồng bộ
  private static final CyclicBarrier cyclicBarrier = new CyclicBarrier(5);

  public static void main(String[] args) throws InterruptedException {
    // Tạo Thread Pool
    ExecutorService threadPool = Executors.newFixedThreadPool(10);

    for (int i = 0; i < threadCount; i++) {
      final int threadNum = i;
      Thread.sleep(1000);
      threadPool.execute(() -> {
        try {
          test(threadNum);
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        } catch (BrokenBarrierException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      });
    }
    threadPool.shutdown();
  }

  public static void test(int threadnum) throws InterruptedException, BrokenBarrierException {
    System.out.println("threadnum:" + threadnum + "is ready");
    try {
      /** Chờ tối đa 60 giây, đảm bảo thread con thực thi xong hoàn toàn */
      cyclicBarrier.await(60, TimeUnit.SECONDS);
    } catch (Exception e) {
      System.out.println("-----CyclicBarrierException------");
    }
    System.out.println("threadnum:" + threadnum + "is finish");
  }

}
```

Kết quả chạy như sau:

```plain
threadnum:0is ready
threadnum:1is ready
threadnum:2is ready
threadnum:3is ready
threadnum:4is ready
threadnum:4is finish
threadnum:0is finish
threadnum:1is finish
threadnum:2is finish
threadnum:3is finish
threadnum:5is ready
threadnum:6is ready
threadnum:7is ready
threadnum:8is ready
threadnum:9is ready
threadnum:9is finish
threadnum:5is finish
threadnum:8is finish
threadnum:7is finish
threadnum:6is finish
......
```

Có thể thấy khi số lượng Thread (tức số lượng yêu cầu) đạt đúng con số 5 mà chúng ta đã định nghĩa, thì các câu lệnh sau phương thức `await()` mới được thực thi.

Ngoài ra, `CyclicBarrier` còn cung cấp một hàm khởi tạo nâng cao hơn là `CyclicBarrier(int parties, Runnable barrierAction)`, dùng để ưu tiên thực thi `barrierAction` khi các Thread chạm tới rào chắn, rất thuận tiện cho việc xử lý các kịch bản nghiệp vụ phức tạp hơn.

Ví dụ 2:

```java
public class CyclicBarrierExample2 {
  // Số lượng yêu cầu
  private static final int threadCount = 550;
  // Số lượng thread cần đồng bộ
  private static final CyclicBarrier cyclicBarrier = new CyclicBarrier(5, () -> {
    System.out.println("------Khi số lượng Thread đạt ngưỡng, thực thi ưu tiên------");
  });

  public static void main(String[] args) throws InterruptedException {
    // Tạo Thread Pool
    ExecutorService threadPool = Executors.newFixedThreadPool(10);

    for (int i = 0; i < threadCount; i++) {
      final int threadNum = i;
      Thread.sleep(1000);
      threadPool.execute(() -> {
        try {
          test(threadNum);
        } catch (InterruptedException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        } catch (BrokenBarrierException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      });
    }
    threadPool.shutdown();
  }

  public static void test(int threadnum) throws InterruptedException, BrokenBarrierException {
    System.out.println("threadnum:" + threadnum + "is ready");
    cyclicBarrier.await();
    System.out.println("threadnum:" + threadnum + "is finish");
  }

}
```

Kết quả chạy như sau:

```plain
threadnum:0is ready
threadnum:1is ready
threadnum:2is ready
threadnum:3is ready
threadnum:4is ready
------Khi số lượng Thread đạt ngưỡng, thực thi ưu tiên------
threadnum:4is finish
threadnum:0is finish
threadnum:2is finish
threadnum:1is finish
threadnum:3is finish
threadnum:5is ready
threadnum:6is ready
threadnum:7is ready
threadnum:8is ready
threadnum:9is ready
------Khi số lượng Thread đạt ngưỡng, thực thi ưu tiên------
threadnum:9is finish
threadnum:5is finish
threadnum:6is finish
threadnum:8is finish
threadnum:7is finish
......
```

## Tài liệu tham khảo

- Giải thích chi tiết AQS trong Java Concurrency: <https://www.cnblogs.com/waterystone/p/4920797.html>
- Phân tích nguyên lý và ứng dụng của AQS qua cài đặt ReentrantLock: <https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html>
