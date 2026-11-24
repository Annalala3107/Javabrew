---
title: Tìm hiểu nguyên lý và ứng dụng của AQS thông qua cách triển khai ReentrantLock
description: "Phân tích chuyên sâu nguyên lý ReentrantLock và AQS: giải thích chi tiết cơ chế Reentrant Lock của ReentrantLock, sự khác biệt giữa Fair Lock và Non-fair Lock, luồng khóa/mở khóa dựa trên AQS và so sánh hiệu năng với synchronized."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/reentrantlock.md
head:
  - - meta
    - name: keywords
      content: ReentrantLock,AQS,Fair Lock,Non-fair Lock,Reentrant Lock,lock unlock,nguyên lý ReentrantLock,so sánh synchronized
---

> Bài viết được đăng lại từ: <https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html>
>
> Tác giả: Đội ngũ kỹ thuật Meituan

Phần lớn các lớp đồng bộ hóa trong Java (`Semaphore`, `ReentrantLock`, v.v.) đều được triển khai dựa trên `AbstractQueuedSynchronizer` (viết tắt là AQS). AQS là một framework đơn giản cung cấp khả năng quản lý trạng thái đồng bộ một cách nguyên tử (atomic), cơ chế chặn (block) và đánh thức (wake up) thread, cùng với mô hình hàng đợi.

Bài viết này sẽ đi dần từ tầng ứng dụng xuống tầng nguyên lý, thông qua các đặc tính cơ bản của `ReentrantLock` và mối liên hệ giữa `ReentrantLock` với AQS để giải mã sâu các kiến thức liên quan đến khóa độc quyền (exclusive lock) trong AQS, đồng thời áp dụng hình thức hỏi đáp nhằm giúp các bạn dễ dàng nắm bắt AQS hơn. Do giới hạn dung lượng, bài viết chủ yếu trình bày logic khóa độc quyền và Sync Queue trong AQS, không đề cập đến phần khóa chia sẻ (Shared Lock) và Condition Queue (trọng tâm của bài viết là phân tích nguyên lý AQS, chỉ giới thiệu sơ lược về `ReentrantLock`; các bạn quan tâm có thể đọc thêm mã nguồn của `ReentrantLock`).

> Phần phân tích mã nguồn trong bài viết này dựa trên JDK 8. Cài đặt bên trong của AQS về sau vẫn tiếp tục tiến hóa: trong JDK 11 vẫn có thể thấy các trường và phương thức chính được đề cập trong bài, còn từ JDK 17 đến các phiên bản hiện tại, các trường của node cũng như cơ chế đưa vào hàng đợi và chờ đợi đã có nhiều thay đổi đáng kể. Tuy nhiên, tư tưởng cốt lõi về trạng thái đồng bộ, hàng đợi chờ và việc giành/giải phóng tài nguyên vẫn là nền tảng quan trọng để hiểu rõ cơ chế này.

## 1 ReentrantLock

### 1.1 Tổng quan đặc tính của ReentrantLock

`ReentrantLock` có nghĩa là Reentrant Lock (khóa khả tái nhập), tức là một thread (luồng) có thể khóa lặp lại nhiều lần trên cùng một tài nguyên găng (critical resource). Để giúp các bạn hiểu rõ hơn đặc tính của `ReentrantLock`, trước tiên hãy so sánh `ReentrantLock` với `Synchronized` thường dùng; các đặc tính cụ thể như sau (phần màu xanh là trọng tâm phân tích trong bài viết này):

![](/media/jg/ext/p0.meituan.net/travelcube/412d294ff5535bbcddc0d979b2a339e6102264-2c011342.png)

Dưới đây là phần so sánh trực quan hơn thông qua mã giả (pseudocode):

```java
// ************************** Cách sử dụng Synchronized **************************
// 1. Dùng cho khối mã (code block)
synchronized (this) {}
// 2. Dùng cho đối tượng
synchronized (object) {}
// 3. Dùng cho phương thức
public synchronized void test () {}
// 4. Có tính khả tái nhập (Reentrant)
for (int i = 0; i < 100; i++) {
  synchronized (this) {}
}
// ************************** Cách sử dụng ReentrantLock **************************
public void test () throws Exception {
  // 1. Khởi tạo và chọn Fair Lock hoặc Non-fair Lock
  ReentrantLock lock = new ReentrantLock(true);
  // 2. Có thể dùng cho khối mã
  lock.lock();
  try {
    // 3. Hỗ trợ nhiều phương thức khóa linh hoạt; có đặc tính Reentrant
    if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
      try {
        // Logic thực thi sau khi lấy được khóa lần thứ hai
      } finally {
        // Mỗi lần khóa thành công đều phải tương ứng với một lần giải phóng
        lock.unlock();
      }
    }
  } finally {
    lock.unlock();
  }
}
```

### 1.2 Mối liên hệ giữa ReentrantLock và AQS

Qua phần trên chúng ta đã biết `ReentrantLock` hỗ trợ Fair Lock (khóa công bằng) và Non-fair Lock (khóa không công bằng) (về phân tích nguyên lý Fair Lock và Non-fair Lock, có thể tham khảo bài "[Những điều cần biết về 'Lock' trong Java](https://mp.weixin.qq.com/s?__biz=MjM5NjQ5MTI5OA==&mid=2651749434&idx=3&sn=5ffa63ad47fe166f2f1a9f604ed10091&chksm=bd12a5778a652c61509d9e718ab086ff27ad8768586ea9b38c3dcf9e017a8e49bcae3df9bcc8&scene=38#wechat_redirect)"), và tầng dưới của `ReentrantLock` được cài đặt bằng AQS. Vậy `ReentrantLock` liên kết với AQS thông qua Fair Lock và Non-fair Lock như thế nào? Chúng ta tập trung vào quá trình lấy khóa (lock acquisition) của cả hai để hiểu mối quan hệ giữa chúng với AQS (trong quá trình lấy khóa thì mối liên hệ với AQS thể hiện rất rõ, còn luồng mở khóa sẽ được giới thiệu ở phần sau).

Luồng lấy khóa trong mã nguồn của Non-fair Lock như sau:

```java
// java.util.concurrent.locks.ReentrantLock#NonfairSync

// Non-fair Lock
static final class NonfairSync extends Sync {
  ...
  final void lock() {
    if (compareAndSetState(0, 1))
      setExclusiveOwnerThread(Thread.currentThread());
    else
      acquire(1);
    }
  ...
}
```

Đoạn mã này có ý nghĩa như sau:

- Nếu thiết lập biến `State` (trạng thái đồng bộ) bằng CAS thành công — tức là lấy khóa thành công — thì đặt thread hiện tại làm thread sở hữu độc quyền.
- Nếu thiết lập biến `State` (trạng thái đồng bộ) bằng CAS thất bại — tức là lấy khóa thất bại — thì đi vào phương thức `Acquire` để xử lý tiếp.

Bước đầu tiên rất dễ hiểu, nhưng ở bước thứ hai, sau khi lấy khóa thất bại, chiến lược xử lý tiếp theo sẽ như thế nào? Điều này dẫn đến các câu hỏi sau:

- Luồng xử lý tiếp theo khi một thread lấy khóa thất bại là gì? Có hai khả năng sau:

(1) Đánh dấu kết quả lấy khóa của thread hiện tại là thất bại và kết thúc quá trình lấy khóa. Thiết kế này sẽ làm giảm mạnh mức độ đồng thời (concurrency) của hệ thống và không đáp ứng nhu cầu thực tế. Vì vậy cần đến luồng bên dưới, chính là luồng xử lý của framework AQS.

(2) Tồn tại một cơ chế xếp hàng chờ đợi nào đó, thread tiếp tục chờ, vẫn giữ khả năng lấy được khóa và quy trình lấy khóa vẫn tiếp diễn.

- Đối với trường hợp thứ hai của câu hỏi 1, đã nói đến cơ chế xếp hàng chờ đợi thì chắc chắn sẽ hình thành một loại hàng đợi nào đó; hàng đợi như vậy dùng cấu trúc dữ liệu gì?
- Khi nào thì thread đang trong cơ chế xếp hàng chờ đợi mới có cơ hội lấy được khóa?
- Nếu thread trong cơ chế xếp hàng chờ đợi mãi vẫn không lấy được khóa thì có phải chờ vô thời hạn không, hay có chiến lược nào khác để giải quyết vấn đề này?

Mang theo những câu hỏi này từ Non-fair Lock, hãy xem cách lấy khóa trong mã nguồn của Fair Lock:

```java
// java.util.concurrent.locks.ReentrantLock#FairSync

static final class FairSync extends Sync {
  ...
  final void lock() {
    acquire(1);
  }
  ...
}
```

Nhìn vào đoạn mã này, chúng ta có thể nảy sinh thắc mắc: hàm `Lock` thực hiện khóa thông qua phương thức `Acquire`, nhưng cụ thể nó khóa như thế nào?

Kết hợp luồng lấy khóa của Fair Lock và Non-fair Lock, tuy luồng có phần khác nhau nhưng cả hai đều gọi phương thức `Acquire`, mà `Acquire` lại là phương thức cốt lõi trong AQS — lớp cha của `FairSync` và `UnfairSync`.

Thực tế, những câu hỏi nêu trên đều không thể tìm được câu trả lời ngay trong mã nguồn lớp `ReentrantLock`; đáp án cho tất cả các câu hỏi này đều nằm trong lớp `AbstractQueuedSynchronizer` nơi chứa phương thức `Acquire`, tức là trọng tâm của bài viết này — AQS. Dưới đây chúng ta sẽ giới thiệu chi tiết về AQS cũng như mối liên hệ giữa `ReentrantLock` và AQS (câu trả lời cho các câu hỏi liên quan sẽ được giải đáp trong mục 2.3.5).

## 2 AQS

Trước tiên, hãy cùng tìm hiểu tổng thể framework AQS thông qua sơ đồ kiến trúc dưới đây:

![](/media/jg/ext/p1.meituan.net/travelcube/82077ccf14127a87b77cefd1ccf562d3253591-9543192d.png)

- Trong hình trên, phần có màu là Method (phương thức), phần không màu là Attribution (thuộc tính).
- Nhìn chung, framework AQS được chia thành 5 tầng, đi từ trên xuống dưới, từ nông đến sâu, từ các API mà AQS cung cấp ra bên ngoài cho đến dữ liệu nền tảng ở tầng dưới cùng.
- Khi tích hợp một synchronizer tùy chỉnh, chỉ cần ghi đè (`Override`) một số phương thức cần thiết ở tầng thứ nhất là được, không cần quan tâm đến luồng triển khai cụ thể ở tầng dưới. Khi synchronizer tùy chỉnh thực hiện thao tác khóa hoặc mở khóa, trước hết nó đi qua API tầng thứ nhất để vào phương thức nội bộ của AQS, sau đó qua tầng thứ hai để tiến hành lấy khóa; tiếp đó đối với luồng lấy khóa thất bại, nó đi vào tầng thứ ba và tầng thứ tư để xử lý hàng đợi chờ, và tất cả các cách xử lý này đều phụ thuộc vào tầng thứ năm — tầng cung cấp dữ liệu cơ sở.

Dưới đây chúng ta sẽ mổ xẻ framework AQS từng bước từ tổng thể đến chi tiết, từ luồng thực thi đến từng phương thức; trình tự phân tích chính như sau:

![](/media/jg/ext/p1.meituan.net/travelcube/d2f7f7fffdc30d85d17b44266c3ab05323338-776adf5d.png)

### 2.1 Tổng quan nguyên lý

Tư tưởng cốt lõi của AQS là: nếu tài nguyên chia sẻ được yêu cầu đang rảnh, thì đặt thread đang yêu cầu tài nguyên làm thread làm việc hiệu lực (worker thread) và đánh dấu tài nguyên chia sẻ ở trạng thái đã khóa; nếu tài nguyên chia sẻ đang bị chiếm giữ, cần có một cơ chế chặn (block), chờ đợi và đánh thức (wake up) để đảm bảo việc phân phối khóa. Cơ chế này chủ yếu được cài đặt bằng biến thể của hàng đợi CLH, đưa các thread tạm thời chưa lấy được khóa vào trong hàng đợi.

CLH: hàng đợi Craig, Landin and Hagersten, là danh sách liên kết đơn; hàng đợi trong AQS là hàng đợi hai chiều ảo biến thể từ CLH (FIFO). AQS thực hiện phân phối khóa bằng cách đóng gói mỗi thread yêu cầu tài nguyên chia sẻ thành một node (nút).

Sơ đồ nguyên lý chính như sau:

![](/media/jg/ext/p0.meituan.net/travelcube/7132e4cef44c26f62835b197b239147b18062-bb51f9e2.png)

AQS sử dụng một biến thành viên kiểu `int` có từ khóa `Volatile` để biểu thị trạng thái đồng bộ, hoàn thành việc xếp hàng giành tài nguyên thông qua hàng đợi FIFO tích hợp sẵn, và thực hiện sửa đổi giá trị `State` thông qua CAS.

#### 2.1.1 Cấu trúc dữ liệu của AQS

Trước tiên hãy xem cấu trúc dữ liệu cơ bản nhất trong AQS — `Node`; `Node` chính là các nút trong hàng đợi biến thể CLH nêu trên.

![](/media/jg/ext/p1.meituan.net/travelcube/960271cf2b5c8a185eed23e98b72c75538637-2bc2c0fe.png)

Giải thích ý nghĩa của một số phương thức và giá trị thuộc tính:

| Phương thức và thuộc tính | Ý nghĩa |
| :--- | :--- |
| `waitStatus` | Trạng thái của node hiện tại trong hàng đợi |
| `thread` | Biểu thị thread đang nằm ở node này |
| `prev` | Con trỏ trỏ tới node trước (predecessor) |
| `predecessor` | Trả về node trước, nếu không có sẽ ném ngoại lệ NPE |
| `nextWaiter` | Trỏ tới node tiếp theo đang ở trạng thái `CONDITION` (do bài viết này không trình bày về Condition Queue nên không giới thiệu nhiều về con trỏ này) |
| `next` | Con trỏ trỏ tới node sau (successor) |

Hai chế độ khóa của thread:

| Chế độ | Ý nghĩa |
| :--- | :--- |
| `SHARED` | Biểu thị thread đang chờ khóa theo chế độ chia sẻ (shared mode) |
| `EXCLUSIVE` | Biểu thị thread đang chờ khóa theo chế độ độc quyền (exclusive mode) |

`waitStatus` có các giá trị enum dưới đây:

| Enum | Ý nghĩa |
| :--- | :--- |
| `0` | Giá trị mặc định khi một `Node` được khởi tạo |
| `CANCELLED` | Bằng `1`, biểu thị yêu cầu lấy khóa của thread đã bị hủy |
| `CONDITION` | Bằng `-2`, biểu thị node đang nằm trong hàng đợi chờ điều kiện, thread của node đang chờ được đánh thức |
| `PROPAGATE` | Bằng `-3`, trường này chỉ được sử dụng khi thread hiện tại đang ở chế độ `SHARED` |
| `SIGNAL` | Bằng `-1`, biểu thị thread đã sẵn sàng, chỉ chờ tài nguyên được giải phóng |

#### 2.1.2 Trạng thái đồng bộ State

Sau khi tìm hiểu cấu trúc dữ liệu, tiếp theo hãy tìm hiểu về trạng thái đồng bộ của AQS — `State`. AQS duy trì một trường tên là `state`, mang ý nghĩa trạng thái đồng bộ, được khai báo với từ khóa `Volatile`, dùng để thể hiện tình trạng giữ khóa của tài nguyên găng tại thời điểm hiện tại.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private volatile int state;
```

Dưới đây cung cấp một số phương thức để truy cập trường này:

| Tên phương thức | Mô tả |
| :--- | :--- |
| `protected final int getState()` | Lấy giá trị của `State` |
| `protected final void setState(int newState)` | Thiết lập giá trị của `State` |
| `protected final boolean compareAndSetState(int expect, int update)` | Cập nhật `State` bằng phương thức CAS |

Các phương thức này đều được khai báo với từ khóa `Final`, điều này cho thấy các lớp con không thể ghi đè (`Override`) chúng. Chúng ta có thể hiện thực hóa chế độ độc quyền và chế độ chia sẻ đa luồng (quá trình lấy khóa) thông qua việc sửa đổi trạng thái đồng bộ biểu thị bởi trường `State`.

![](/media/jg/ext/p0.meituan.net/travelcube/27605d483e8935da683a93be015713f331378-8678d705.png)

![](/media/jg/ext/p0.meituan.net/travelcube/3f1e1a44f5b7d77000ba4f9476189b2e32806-0dee12a2.png)

Đối với công cụ đồng bộ tùy chỉnh của chúng ta, cần tự định nghĩa cách lấy trạng thái đồng bộ và giải phóng trạng thái, chính là tầng thứ nhất trong sơ đồ kiến trúc AQS: tầng API.

### 2.2 Các phương thức quan trọng của AQS và mối liên hệ với ReentrantLock

Từ sơ đồ kiến trúc có thể thấy, AQS cung cấp hàng loạt phương thức `Protected` phục vụ cho việc triển khai synchronizer tùy chỉnh. Các phương thức liên quan khi triển khai synchronizer tùy chỉnh thực chất cũng chỉ nhằm sửa đổi trường `State` để thực hiện chế độ độc quyền hoặc chế độ chia sẻ đa luồng. Synchronizer tùy chỉnh cần triển khai các phương thức sau (các phương thức mà `ReentrantLock` cần triển khai nằm trong danh sách dưới đây, không phải tất cả):

| Tên phương thức | Mô tả |
| :--- | :--- |
| `protected boolean isHeldExclusively()` | Thread này có đang giữ độc quyền tài nguyên hay không. Chỉ khi dùng đến `Condition` mới cần triển khai phương thức này. |
| `protected boolean tryAcquire(int arg)` | Chế độ độc quyền. `arg` là số lần lấy khóa; thử lấy tài nguyên, thành công trả về `True`, thất bại trả về `False`. |
| `protected boolean tryRelease(int arg)` | Chế độ độc quyền. `arg` là số lần giải phóng khóa; thử giải phóng tài nguyên, thành công trả về `True`, thất bại trả về `False`. |
| `protected int tryAcquireShared(int arg)` | Chế độ chia sẻ. `arg` là số lần lấy khóa; thử lấy tài nguyên. Số âm biểu thị thất bại; `0` biểu thị thành công nhưng không còn tài nguyên khả dụng; số dương biểu thị thành công và vẫn còn tài nguyên dư. |
| `protected boolean tryReleaseShared(int arg)` | Chế độ chia sẻ. `arg` là số lần giải phóng khóa; thử giải phóng tài nguyên, nếu sau khi giải phóng cho phép đánh thức các node chờ phía sau thì trả về `True`, ngược lại trả về `False`. |

Thông thường, synchronizer tùy chỉnh hoặc là chế độ độc quyền, hoặc là chế độ chia sẻ, nên chỉ cần triển khai một trong hai cặp `tryAcquire`–`tryRelease` hoặc `tryAcquireShared`–`tryReleaseShared` là đủ. AQS cũng hỗ trợ synchronizer tùy chỉnh triển khai đồng thời cả chế độ độc quyền và chia sẻ, ví dụ như `ReentrantReadWriteLock`. `ReentrantLock` là khóa độc quyền nên đã triển khai `tryAcquire`–`tryRelease`.

Lấy Non-fair Lock làm ví dụ, phần này chủ yếu trình bày các điểm liên kết phương thức giữa Non-fair Lock và AQS; vai trò cụ thể của từng phương thức cốt lõi sẽ được phân tích chi tiết ở phần sau của bài viết.

![](/media/jg/ext/p1.meituan.net/travelcube/b8b53a70984668bc68653efe9531573e78636-42bbd33b.png)

> 🐛 Đính chính (xem: [issue#1761](https://github.com/Snailclimb/JavaGuide/issues/1761)): Có một lỗi nhỏ trong hình: sau khi `(AQS) CAS` sửa đổi tài nguyên chia sẻ `State` thành công thì phải là lấy khóa thành công (Non-fair Lock).
>
> Mã nguồn tương ứng như sau:
>
> ```java
> final boolean nonfairTryAcquire(int acquires) {
>          final Thread current = Thread.currentThread();// Lấy thread hiện tại
>          int c = getState();
>          if (c == 0) {
>              if (compareAndSetState(0, acquires)) {// Tranh khóa bằng CAS
>                  setExclusiveOwnerThread(current);// Đặt thread hiện tại làm thread độc quyền
>                  return true;// Lấy khóa thành công
>              }
>          }
>          else if (current == getExclusiveOwnerThread()) {
>              int nextc = c + acquires;
>              if (nextc < 0) // overflow
>                  throw new Error("Maximum lock count exceeded");
>              setState(nextc);
>              return true;
>          }
>          return false;
>      }
> ```

Để giúp các bạn hiểu rõ quá trình tương tác phương thức giữa `ReentrantLock` và AQS, lấy Non-fair Lock làm ví dụ, chúng ta tách riêng và nhấn mạnh luồng tương tác khi khóa và mở khóa để thuận tiện cho việc theo dõi các nội dung tiếp theo.

![](/media/jg/ext/p1.meituan.net/travelcube/7aadb272069d871bdee8bf3a218eed8136919-734aa4af.png)

Lấy khóa (Lock):

- Thực hiện thao tác khóa thông qua phương thức `Lock` của `ReentrantLock`.
- Sẽ gọi tới phương thức `Lock` của lớp nội bộ `Sync`; vì `Sync#lock` là phương thức trừu tượng, nên tùy thuộc vào việc `ReentrantLock` được khởi tạo là Fair Lock hay Non-fair Lock mà thực thi phương thức `Lock` của lớp nội bộ tương ứng — về bản chất cả hai đều sẽ thực thi phương thức `Acquire` của AQS.
- Phương thức `Acquire` của AQS sẽ thực thi phương thức `tryAcquire`, nhưng vì `tryAcquire` cần được synchronizer tùy chỉnh triển khai nên thực chất sẽ gọi phương thức `tryAcquire` trong `ReentrantLock`; do `ReentrantLock` triển khai `tryAcquire` thông qua hai lớp nội bộ Fair Lock và Non-fair Lock nên tùy loại khóa khác nhau mà thực thi `tryAcquire` khác nhau.
- `tryAcquire` là logic lấy khóa; sau khi lấy khóa thất bại, sẽ thực thi logic tiếp theo của framework AQS, không liên quan đến synchronizer tùy chỉnh của `ReentrantLock`.

Mở khóa (Unlock):

- Thực hiện mở khóa thông qua phương thức `Unlock` của `ReentrantLock`.
- `Unlock` sẽ gọi phương thức `Release` của lớp nội bộ `Sync`, phương thức này kế thừa từ AQS.
- Bên trong `Release` sẽ gọi phương thức `tryRelease`; `tryRelease` cần được synchronizer tùy chỉnh triển khai và chỉ được triển khai trong `Sync` của `ReentrantLock`, do đó có thể thấy quá trình giải phóng khóa không phân biệt Fair Lock hay Non-fair Lock.
- Sau khi giải phóng thành công, toàn bộ quá trình xử lý còn lại do framework AQS hoàn thành, không liên quan đến synchronizer tùy chỉnh.

Qua mô tả trên, có thể tóm tắt sơ lược mối quan hệ ánh xạ giữa các phương thức cốt lõi ở tầng API khi `ReentrantLock` thực hiện khóa và mở khóa.

![](/media/jg/ext/p0.meituan.net/travelcube/f30c631c8ebbf820d3e8fcb6eee3c0ef18748-fdbdf51e.png)

## 3 Hiểu về AQS thông qua ReentrantLock

Trong `ReentrantLock`, Fair Lock và Non-fair Lock ở tầng dưới là giống nhau; ở đây chúng ta lấy Non-fair Lock làm ví dụ để phân tích.

Trong Non-fair Lock có một đoạn mã như sau:

```java
// java.util.concurrent.locks.ReentrantLock

static final class NonfairSync extends Sync {
  ...
  final void lock() {
    if (compareAndSetState(0, 1))
      setExclusiveOwnerThread(Thread.currentThread());
    else
      acquire(1);
  }
  ...
}
```

Hãy xem phương thức `Acquire` này được viết như thế nào:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final void acquire(int arg) {
  if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
    selfInterrupt();
}
```

Xem tiếp phương thức `tryAcquire`:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

protected boolean tryAcquire(int arg) {
  throw new UnsupportedOperationException();
}
```

Có thể thấy ở đây chỉ là cài đặt đơn giản trong AQS; phương thức triển khai lấy khóa cụ thể được Fair Lock và Non-fair Lock tự triển khai riêng (lấy `ReentrantLock` làm ví dụ). Nếu phương thức này trả về `True`, điều đó chứng tỏ thread hiện tại đã lấy khóa thành công và không cần thực thi tiếp phía sau; nếu lấy khóa thất bại thì cần đưa vào hàng đợi chờ. Dưới đây sẽ giải thích chi tiết khi nào và bằng cách nào thread được đưa vào hàng đợi chờ.

### 3.1 Đưa thread vào hàng đợi chờ

#### 3.1.1 Thời điểm vào hàng đợi

Khi thực thi `Acquire(1)`, nó sẽ thử lấy khóa thông qua `tryAcquire`. Trong trường hợp này, nếu lấy khóa thất bại, `addWaiter` sẽ được gọi để đưa thread vào hàng đợi chờ.

#### 3.1.2 Cách thức vào hàng đợi

Sau khi lấy khóa thất bại, `addWaiter(Node.EXCLUSIVE)` sẽ được thực thi để gia nhập hàng đợi chờ; cách triển khai cụ thể như sau:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private Node addWaiter(Node mode) {
  Node node = new Node(Thread.currentThread(), mode);
  // Try the fast path of enq; backup to full enq on failure
  Node pred = tail;
  if (pred != null) {
    node.prev = pred;
    if (compareAndSetTail(pred, node)) {
      pred.next = node;
      return node;
    }
  }
  enq(node);
  return node;
}
private final boolean compareAndSetTail(Node expect, Node update) {
  return unsafe.compareAndSwapObject(this, tailOffset, expect, update);
}
```

Luồng xử lý chính như sau:

- Tạo mới một node dựa trên thread hiện tại và chế độ khóa.
- Con trỏ `Pred` trỏ tới node đuôi `Tail`.
- Cho con trỏ `Prev` của `Node` mới trỏ tới `Pred`.
- Thông qua phương thức `compareAndSetTail`, hoàn tất việc thiết lập node đuôi. Phương thức này chủ yếu so sánh `tailOffset` với `Expect`; nếu địa chỉ của `Node` tại `tailOffset` và `Node` `Expect` giống nhau thì đặt giá trị của `Tail` thành `Update`.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

static {
  try {
    stateOffset = unsafe.objectFieldOffset(AbstractQueuedSynchronizer.class.getDeclaredField("state"));
    headOffset = unsafe.objectFieldOffset(AbstractQueuedSynchronizer.class.getDeclaredField("head"));
    tailOffset = unsafe.objectFieldOffset(AbstractQueuedSynchronizer.class.getDeclaredField("tail"));
    waitStatusOffset = unsafe.objectFieldOffset(Node.class.getDeclaredField("waitStatus"));
    nextOffset = unsafe.objectFieldOffset(Node.class.getDeclaredField("next"));
  } catch (Exception ex) {
    throw new Error(ex);
  }
}
```

Từ khối static initializer của AQS có thể thấy, tất cả đều nhằm lấy độ lệch bộ nhớ (offset) của một thuộc tính đối tượng so với đối tượng đó trong bộ nhớ, nhờ vậy chúng ta có thể dựa vào offset này để tìm ra thuộc tính tương ứng trong bộ nhớ của đối tượng. `tailOffset` là offset tương ứng với `tail`, nên lúc này `Node` mới tạo sẽ được đặt làm node đuôi hiện tại của hàng đợi. Đồng thời, vì đây là danh sách liên kết đôi (doubly-linked list) nên cũng cần cho node trước đó trỏ tới node đuôi mới.

- Nếu con trỏ `Pred` là `Null` (chứng tỏ trong hàng đợi chờ chưa có phần tử nào), hoặc con trỏ `Pred` hiện tại và `Tail` trỏ tới vị trí khác nhau (chứng tỏ đã bị thread khác sửa đổi), thì cần xem xét phương thức `Enq`.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private Node enq(final Node node) {
  for (;;) {
    Node t = tail;
    if (t == null) { // Must initialize
      if (compareAndSetHead(new Node()))
        tail = head;
    } else {
      node.prev = t;
      if (compareAndSetTail(t, node)) {
        t.next = node;
        return t;
      }
    }
  }
}
```

Nếu chưa được khởi tạo thì cần khởi tạo một node đầu (head node). Nhưng xin lưu ý, node đầu được khởi tạo không phải là node của thread hiện tại, mà là node được tạo bằng constructor không tham số. Nếu đã qua khởi tạo hoặc do thực thi đồng thời mà trong hàng đợi đã có phần tử thì xử lý giống như phương thức trước đó. Thực chất, `addWaiter` chính là thao tác thêm node đuôi vào danh sách liên kết đôi; cần chú ý rằng node đầu của danh sách liên kết đôi này là một node đầu được tạo bằng constructor không tham số.

Tóm lại, khi các thread lấy khóa, quá trình đại khái như sau:

1. Khi chưa có thread nào lấy được khóa, thread 1 lấy khóa thành công.

2. Thread 2 xin cấp khóa, nhưng khóa đang bị thread 1 chiếm giữ.

![img](/media/jg/ext/p0.meituan.net/travelcube/e9e385c3c68f62c67c8d62ab0adb613921117-35a65eeb.png)

3. Nếu tiếp tục có thêm thread muốn lấy khóa, chỉ cần xếp hàng lần lượt về phía sau trong hàng đợi.

Quay lại đoạn mã phía trên, `hasQueuedPredecessors` là phương thức dùng khi Fair Lock lấy khóa để phán đoán xem trong hàng đợi chờ có tồn tại node hợp lệ hay không. Nếu trả về `False`, chứng tỏ thread hiện tại có thể tranh giành tài nguyên chia sẻ; nếu trả về `True`, chứng tỏ trong hàng đợi có tồn tại node hợp lệ và thread hiện tại bắt buộc phải gia nhập hàng đợi chờ.

```java
// java.util.concurrent.locks.ReentrantLock

public final boolean hasQueuedPredecessors() {
  // The correctness of this depends on head being initialized
  // before tail and on head.next being accurate if the current
  // thread is first in queue.
  Node t = tail; // Read fields in reverse initialization order
  Node h = head;
  Node s;
  return h != t && ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

Nhìn đến đây, hãy hiểu biểu thức `h != t && ((s = h.next) == null || s.thread != Thread.currentThread());`: tại sao phải kiểm tra node tiếp theo của node đầu? Node đầu tiên lưu trữ dữ liệu gì?

> Trong danh sách liên kết đôi, node đầu tiên là node ảo (dummy node), thực chất không lưu trữ bất kỳ thông tin nào mà chỉ mang tính giữ chỗ. Node đầu tiên thực sự có dữ liệu bắt đầu từ node thứ hai. Khi `h != t`: nếu `(s = h.next) == null`, có thread đang khởi tạo hàng đợi chờ, nhưng mới chỉ thực hiện tới bước `Tail` trỏ tới `Head` mà chưa để `Head` trỏ tới `Tail`; lúc này trong hàng đợi đã có phần tử nên cần trả về `True` (chi tiết xem phân tích mã nguồn bên dưới). Nếu `(s = h.next) != null`, chứng tỏ lúc này trong hàng đợi có ít nhất một node hợp lệ. Nếu lúc này `s.thread == Thread.currentThread()`, nghĩa là thread trong node hợp lệ đầu tiên của hàng đợi chờ trùng với thread hiện tại, vậy thread hiện tại có thể lấy tài nguyên; nếu `s.thread != Thread.currentThread()`, nghĩa là thread trong node hợp lệ đầu tiên của hàng đợi chờ khác với thread hiện tại, thread hiện tại bắt buộc phải gia nhập hàng đợi chờ.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer#enq

if (t == null) { // Must initialize
  if (compareAndSetHead(new Node()))
    tail = head;
} else {
  node.prev = t;
  if (compareAndSetTail(t, node)) {
    t.next = node;
    return t;
  }
}
```

Thao tác đưa node vào hàng đợi không phải là thao tác nguyên tử, nên sẽ xuất hiện trạng thái thoáng qua `head != tail`: lúc này `Tail` trỏ tới node cuối cùng, đồng thời `Tail` trỏ tới `Head`. Nếu `Head` chưa trỏ tới `Tail` (xem các dòng 5, 6, 7), trong tình huống này cũng cần đưa thread liên quan vào hàng đợi. Vì vậy đoạn mã này được viết để giải quyết vấn đề đồng thời trong các tình huống cực đoan.

#### 3.1.3 Thời điểm thread trong hàng đợi chờ rời khỏi hàng đợi

Quay lại mã nguồn ban đầu:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final void acquire(int arg) {
  if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
    selfInterrupt();
}
```

Phần trên đã giải thích phương thức `addWaiter` — phương thức này thực chất là đưa thread tương ứng dưới dạng cấu trúc dữ liệu `Node` vào hàng đợi hai đầu và trả về một `Node` chứa thread đó. `Node` này sẽ được truyền làm tham số vào phương thức `acquireQueued`. Phương thức `acquireQueued` có thể thực hiện thao tác "lấy khóa" cho các thread đang xếp hàng.

Nhìn chung, sau khi lấy khóa thất bại, một thread sẽ được đưa vào hàng đợi chờ; `acquireQueued` sẽ khiến nó liên tục chờ đợi và thử lấy khóa cho đến khi thành công. `acquire(int)` là cơ chế lấy khóa không thể bị ngắt (non-interruptible): khi xảy ra ngắt (interrupt) trong lúc chờ, nó sẽ ghi nhận lại trạng thái ngắt trước, sau khi lấy khóa thành công mới khôi phục qua `selfInterrupt()`, chứ không vì vậy mà hủy bỏ lần lấy khóa này.

Dưới đây chúng ta phân tích mã nguồn `acquireQueued` theo hai hướng "Khi nào rời hàng đợi?" và "Rời hàng đợi như thế nào?":

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

final boolean acquireQueued(final Node node, int arg) {
  // Đánh dấu xem đã lấy được tài nguyên thành công hay chưa
  boolean failed = true;
  try {
    // Đánh dấu xem trong quá trình chờ có từng bị interrupt hay không
    boolean interrupted = false;
    // Bắt đầu spin: hoặc lấy được khóa, hoặc bị interrupt
    for (;;) {
      // Lấy node trước của node hiện tại
      final Node p = node.predecessor();
      // Nếu p là head node, chứng tỏ node hiện tại đứng đầu hàng đợi dữ liệu thực, thì thử lấy khóa (đừng quên head node là node ảo)
      if (p == head && tryAcquire(arg)) {
        // Lấy khóa thành công, dịch chuyển con trỏ head sang node hiện tại
        setHead(node);
        p.next = null; // help GC
        failed = false;
        return interrupted;
      }
      // Chứng tỏ p là head node nhưng hiện tại chưa lấy được khóa (có thể bị tranh mất trong Non-fair Lock) hoặc p không phải head node; lúc này phải phán đoán xem node hiện tại có cần bị block hay không (điều kiện bị block: waitStatus của node trước là -1), nhằm tránh vòng lặp vô hạn gây lãng phí tài nguyên. Hai phương thức cụ thể được phân tích kỹ bên dưới
      if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
        interrupted = true;
    }
  } finally {
    if (failed)
      cancelAcquire(node);
  }
}
```

Chú thích: phương thức `setHead` biến node hiện tại thành node ảo, nhưng không sửa `waitStatus` vì đây là dữ liệu vẫn luôn cần dùng đến.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private void setHead(Node node) {
  head = node;
  node.thread = null;
  node.prev = null;
}

// java.util.concurrent.locks.AbstractQueuedSynchronizer

// Dựa vào node trước để phán đoán xem thread hiện tại có nên bị block hay không
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
  // Lấy trạng thái của node trước
  int ws = pred.waitStatus;
  // Chứng tỏ node trước đang ở trạng thái sẵn sàng đánh thức
  if (ws == Node.SIGNAL)
    return true;
  // Qua các giá trị enum ta biết waitStatus > 0 là trạng thái đã hủy
  if (ws > 0) {
    do {
      // Lặp ngược về phía trước để tìm các node bị hủy và loại bỏ chúng khỏi hàng đợi
      node.prev = pred = pred.prev;
    } while (pred.waitStatus > 0);
    pred.next = node;
  } else {
    // Đặt trạng thái chờ của node trước thành SIGNAL
    compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
  }
  return false;
}
```

`parkAndCheckInterrupt` chủ yếu dùng để tạm dừng (suspend/park) thread hiện tại, chặn ngăn xếp lời gọi (call stack) và trả về trạng thái ngắt của thread hiện tại.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    return Thread.interrupted();
}
```

Sơ đồ luồng của các phương thức trên như sau:

![](/media/jg/ext/p0.meituan.net/travelcube/c124b76dcbefb9bdc778458064703d1135485-14478dce.png)

Từ hình trên có thể thấy, điều kiện để thoát khỏi vòng lặp hiện tại là khi "node đứng trước là node đầu (head node), đồng thời thread hiện tại lấy khóa thành công". Để ngăn chặn vòng lặp vô hạn gây lãng phí tài nguyên CPU, chúng ta sẽ phán đoán trạng thái của node đứng trước nhằm quyết định có tạm dừng thread hiện tại hay không; luồng tạm dừng cụ thể được biểu diễn qua sơ đồ dưới đây (luồng `shouldParkAfterFailedAcquire`):

![](/media/jg/ext/p0.meituan.net/travelcube/9af16e2481ad85f38ca322a225ae737535740-19e9ad5b.png)

Khi mối băn khoăn về việc giải phóng node khỏi hàng đợi đã được làm rõ, lại có thêm câu hỏi mới:

- Các node bị hủy trong `shouldParkAfterFailedAcquire` được tạo ra như thế nào? Khi nào `waitStatus` của một node bị đặt thành `-1`?
- Vào thời điểm nào thì node được giải phóng và thông báo tới thread đang bị tạm dừng?

### 3.2 Quá trình tạo node ở trạng thái `CANCELLED`

Đoạn mã `Finally` trong phương thức `acquireQueued`:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

final boolean acquireQueued(final Node node, int arg) {
  boolean failed = true;
  try {
    ...
    for (;;) {
      final Node p = node.predecessor();
      if (p == head && tryAcquire(arg)) {
        ...
        failed = false;
        ...
      }
      ...
  } finally {
    if (failed)
      cancelAcquire(node);
    }
}
```

Thông qua phương thức `cancelAcquire`, trạng thái của `Node` được đánh dấu thành `CANCELLED`. Tiếp theo, hãy phân tích từng dòng nguyên lý của phương thức này:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private void cancelAcquire(Node node) {
  // Lọc bỏ node không hợp lệ
  if (node == null)
    return;
  // Đặt node này không gắn với bất kỳ thread nào, tức là thành node ảo
  node.thread = null;
  Node pred = node.prev;
  // Duyệt qua node trước để bỏ qua các node ở trạng thái hủy
  while (pred.waitStatus > 0)
    node.prev = pred = pred.prev;
  // Lấy node sau của node trước đã được lọc
  Node predNext = pred.next;
  // Đặt trạng thái của node hiện tại thành CANCELLED
  node.waitStatus = Node.CANCELLED;
  // Nếu node hiện tại là tail node, đặt node đầu tiên không ở trạng thái hủy tính từ sau ra trước làm tail node
  // Nếu cập nhật thất bại thì vào nhánh else; nếu cập nhật thành công thì đặt node sau của tail thành null
  if (node == tail && compareAndSetTail(node, pred)) {
    compareAndSetNext(pred, predNext, null);
  } else {
    int ws;
    // Nếu node hiện tại không phải node kế tiếp của head: 1) kiểm tra xem trạng thái node trước có phải SIGNAL không; 2) nếu không, thử đặt node trước thành SIGNAL xem có thành công không
    // Nếu một trong hai điều kiện 1 hoặc 2 là true, tiếp tục kiểm tra thread của node trước có khác null không
    // Nếu các điều kiện trên đều thỏa mãn, trỏ con trỏ next của node trước tới node sau của node hiện tại
    if (pred != head && ((ws = pred.waitStatus) == Node.SIGNAL || (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) && pred.thread != null) {
      Node next = node.next;
      if (next != null && next.waitStatus <= 0)
        compareAndSetNext(pred, predNext, next);
    } else {
      // Nếu node hiện tại là node kế tiếp của head, hoặc không thỏa mãn các điều kiện trên, thì đánh thức node kế tiếp của node hiện tại
      unparkSuccessor(node);
    }
    node.next = node; // help GC
  }
}
```

Luồng xử lý hiện tại:

- Lấy node trước của node hiện tại; nếu trạng thái của node trước là `CANCELLED` thì tiếp tục duyệt ngược về phía trước cho đến khi tìm thấy node đầu tiên có `waitStatus <= 0`, liên kết node `Pred` tìm được với `Node` hiện tại, và đặt `Node` hiện tại thành `CANCELLED`.
- Dựa theo vị trí của node hiện tại, xét ba trường hợp sau:

(1) Node hiện tại là node đuôi (tail node).

(2) Node hiện tại là node kế tiếp của `Head`.

(3) Node hiện tại không phải node kế tiếp của `Head`, cũng không phải node đuôi.

Dựa theo gạch đầu dòng thứ hai nêu trên, chúng ta hãy phân tích luồng xử lý của từng trường hợp.

Node hiện tại là node đuôi.

![](/media/jg/ext/p1.meituan.net/travelcube/b845211ced57561c24f79d56194949e822049-e5269cbd.png)

Node hiện tại là node kế tiếp của `Head`.

![](/media/jg/ext/p1.meituan.net/travelcube/ab89bfec875846e5028a4f8fead32b7117975-19128a86.png)

Node hiện tại không phải node kế tiếp của `Head`, cũng không phải node đuôi.

![](/media/jg/ext/p0.meituan.net/travelcube/45d0d9e4a6897eddadc4397cf53d6cd522452-b7756457.png)

Qua các luồng trên, chúng ta đã có cái nhìn khái quát về cách trạng thái node `CANCELLED` hình thành và thay đổi; nhưng tại sao mọi thay đổi đều thao tác trên con trỏ `Next` mà không thao tác trên con trỏ `Prev`? Trong trường hợp nào thì con trỏ `Prev` mới được thao tác?

> Khi thực thi `cancelAcquire`, node đứng trước của node hiện tại có thể đã rời khỏi hàng đợi rồi (đã thực thi phương thức `shouldParkAfterFailedAcquire` trong khối `Try`). Nếu lúc này sửa đổi con trỏ `Prev`, rất có thể dẫn đến việc `Prev` trỏ tới một `Node` khác đã bị xóa khỏi hàng đợi, nên việc thay đổi con trỏ `Prev` ở đây là không an toàn. Trong phương thức `shouldParkAfterFailedAcquire`, đoạn mã sau sẽ được thực thi — thực chất đây chính là lúc xử lý con trỏ `Prev`. `shouldParkAfterFailedAcquire` chỉ được thực thi khi lấy khóa thất bại; đi vào phương thức này chứng tỏ tài nguyên chia sẻ đã bị chiếm giữ và các node đứng trước node hiện tại đều sẽ không thay đổi, do đó việc sửa đổi con trỏ `Prev` vào thời điểm này tương đối an toàn.
>
> ```java
> do {
>   node.prev = pred = pred.prev;
> } while (pred.waitStatus > 0);
> ```

### 3.3 Cách thức mở khóa

Chúng ta đã phân tích luồng cơ bản trong quá trình lấy khóa; tiếp theo hãy phân tích luồng cơ bản khi mở khóa. Vì `ReentrantLock` không phân biệt Fair Lock hay Non-fair Lock khi mở khóa nên chúng ta xem thẳng mã nguồn mở khóa:

```java
// java.util.concurrent.locks.ReentrantLock

public void unlock() {
  sync.release(1);
}
```

Có thể thấy, nơi thực sự giải phóng khóa được hoàn thành thông qua framework.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final boolean release(int arg) {
  if (tryRelease(arg)) {
    Node h = head;
    if (h != null && h.waitStatus != 0)
      unparkSuccessor(h);
    return true;
  }
  return false;
}
```

Lớp cha `Sync` của cả Fair Lock và Non-fair Lock bên trong `ReentrantLock` định nghĩa cơ chế giải phóng khóa cho Reentrant Lock.

```java
// java.util.concurrent.locks.ReentrantLock.Sync

// Phương thức trả về xem khóa hiện tại có còn bị thread nào giữ hay không
protected final boolean tryRelease(int releases) {
  // Giảm số lần tái nhập (reentrant count)
  int c = getState() - releases;
  // Thread hiện tại không phải thread đang giữ khóa thì ném ngoại lệ
  if (Thread.currentThread() != getExclusiveOwnerThread())
    throw new IllegalMonitorStateException();
  boolean free = false;
  // Nếu thread đang giữ đã giải phóng hết, đặt thread độc quyền hiện tại về null và cập nhật state
  if (c == 0) {
    free = true;
    setExclusiveOwnerThread(null);
  }
  setState(c);
  return free;
}
```

Hãy cùng giải thích đoạn mã nguồn dưới đây:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

public final boolean release(int arg) {
  // Nếu tryRelease tùy chỉnh ở trên trả về true, chứng tỏ khóa không bị bất kỳ thread nào giữ
  if (tryRelease(arg)) {
    // Lấy head node
    Node h = head;
    // Head node khác rỗng và waitStatus của head node không phải trạng thái node mới khởi tạo, tiến hành đánh thức thread đang bị tạm dừng
    if (h != null && h.waitStatus != 0)
      unparkSuccessor(h);
    return true;
  }
  return false;
}
```

Vì sao điều kiện kiểm tra ở đây là `h != null && h.waitStatus != 0`?

> `h == null`: `Head` vẫn chưa được khởi tạo. Trong trường hợp ban đầu, `head == null`; khi node đầu tiên vào hàng đợi, `Head` sẽ được khởi tạo thành một node ảo. Do đó nếu ở đây vẫn chưa kịp có thread nào vào hàng đợi thì sẽ xuất hiện tình huống `head == null`.
>
> `h != null && waitStatus == 0`: biểu thị thread tương ứng với node kế tiếp vẫn đang chạy, không cần đánh thức.
>
> `h != null && waitStatus < 0`: biểu thị node kế tiếp có thể đã bị block, cần đánh thức.

Xem tiếp phương thức `unparkSuccessor`:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private void unparkSuccessor(Node node) {
  // Lấy waitStatus của head node
  int ws = node.waitStatus;
  if (ws < 0)
    compareAndSetWaitStatus(node, ws, 0);
  // Lấy node tiếp theo của node hiện tại
  Node s = node.next;
  // Nếu node tiếp theo là null hoặc bị cancelled, hãy tìm node không ở trạng thái cancelled ở đầu hàng đợi nhất
  if (s == null || s.waitStatus > 0) {
    s = null;
    // Bắt đầu tìm từ tail node ngược về đầu hàng đợi để tìm node đầu tiên trong hàng đợi có waitStatus < 0.
    for (Node t = tail; t != null && t != node; t = t.prev)
      if (t.waitStatus <= 0)
        s = t;
  }
  // Nếu node tiếp theo của node hiện tại khác rỗng và trạng thái <= 0, thì unpark node đó
  if (s != null)
    LockSupport.unpark(s.thread);
}
```

Tại sao lại phải tìm node không ở trạng thái `Cancelled` đầu tiên theo chiều từ sau ra trước? Nguyên nhân như sau.

Phương thức `addWaiter` trước đó:

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private Node addWaiter(Node mode) {
  Node node = new Node(Thread.currentThread(), mode);
  // Try the fast path of enq; backup to full enq on failure
  Node pred = tail;
  if (pred != null) {
    node.prev = pred;
    if (compareAndSetTail(pred, node)) {
      pred.next = node;
      return node;
    }
  }
  enq(node);
  return node;
}
```

Từ đây ta có thể thấy thao tác đưa node vào hàng đợi không phải là thao tác nguyên tử; tức là hai chỗ `node.prev = pred; compareAndSetTail(pred, node)` có thể xem như thao tác nguyên tử đưa vào `Tail`, nhưng lúc này `pred.next = node;` vẫn chưa thực thi. Nếu đúng thời điểm đó lại thực thi phương thức `unparkSuccessor` thì sẽ không thể tìm từ trước ra sau được, nên cần phải tìm từ sau ra trước. Một nguyên nhân nữa là khi sinh ra node ở trạng thái `CANCELLED`, con trỏ bị ngắt trước là con trỏ `Next`, còn con trỏ `Prev` chưa bị ngắt, do đó cũng bắt buộc phải duyệt từ sau ra trước mới có thể duyệt hết toàn bộ các `Node`.

Tóm lại, nếu tìm từ trước ra sau, do thao tác đưa vào hàng đợi không nguyên tử trong các trường hợp cực đoan và thao tác ngắt con trỏ `Next` trong quá trình sinh node `CANCELLED`, có thể dẫn đến không duyệt hết tất cả các node. Vì vậy, sau khi đánh thức thread tương ứng, thread đó sẽ tiếp tục thực thi xuống dưới. Sau khi tiếp tục thực thi phương thức `acquireQueued`, việc ngắt (interrupt) được xử lý như thế nào?

### 3.4 Luồng thực thi sau khi khôi phục từ ngắt (Interrupt)

Sau khi được đánh thức, sẽ thực thi `return Thread.interrupted();`; hàm này trả về trạng thái interrupt của thread đang thực thi hiện tại và xóa cờ đó.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private final boolean parkAndCheckInterrupt() {
  LockSupport.park(this);
  return Thread.interrupted();
}
```

Quay lại mã nguồn `acquireQueued`, khi `parkAndCheckInterrupt` trả về `True` hoặc `False`, giá trị của `interrupted` sẽ khác nhau, nhưng đều thực thi vòng lặp tiếp theo. Nếu lúc này lấy khóa thành công thì sẽ trả về giá trị `interrupted` hiện tại.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

final boolean acquireQueued(final Node node, int arg) {
  boolean failed = true;
  try {
    boolean interrupted = false;
    for (;;) {
      final Node p = node.predecessor();
      if (p == head && tryAcquire(arg)) {
        setHead(node);
        p.next = null; // help GC
        failed = false;
        return interrupted;
      }
      if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
        interrupted = true;
      }
  } finally {
    if (failed)
      cancelAcquire(node);
  }
}
```

Nếu `acquireQueued` trả về `True`, sẽ thực thi phương thức `selfInterrupt`.

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

static void selfInterrupt() {
  Thread.currentThread().interrupt();
}
```

Phương thức này thực chất là để ngắt (interrupt) thread. Nhưng tại sao đã lấy được khóa rồi mà vẫn phải interrupt thread? Phần này thuộc kiến thức về cơ chế ngắt cộng tác (cooperative interruption) do Java cung cấp, các bạn quan tâm có thể tìm hiểu thêm. Ở đây xin giới thiệu ngắn gọn:

1. Khi một thread đang bị ngắt được đánh thức, nó không biết lý do mình được đánh thức: có thể là thread hiện tại bị interrupt trong lúc chờ, cũng có thể là được đánh thức sau khi khóa được giải phóng. Vì vậy chúng ta dùng phương thức `Thread.interrupted()` để kiểm tra cờ interrupt (phương thức này trả về trạng thái interrupt của thread hiện tại và đặt lại cờ interrupt của thread hiện tại về `False`) rồi ghi nhận lại; nếu phát hiện thread đó từng bị interrupt thì thực hiện interrupt lại một lần nữa.
2. Thread bị đánh thức trong quá trình chờ tài nguyên, sau khi được đánh thức vẫn sẽ liên tục đi thử lấy khóa cho đến khi giành được khóa mới thôi. Tức là trong toàn bộ quy trình, nó không phản hồi interrupt ngay mà chỉ ghi nhận lại lịch sử interrupt. Cuối cùng khi đã giành được khóa và trả về, nếu từng bị interrupt thì cần bổ sung một lần interrupt.

Cách xử lý này cũng được áp dụng chủ yếu trong `runWorker` của đơn vị vận hành cơ bản `Worker` thuộc Thread Pool, thông qua `Thread.interrupted()` để tiến hành kiểm tra bổ sung; các bạn quan tâm có thể xem mã nguồn của `ThreadPoolExecutor`.

### 3.5 Tổng kết

Trong mục 1.3 chúng ta đã đặt ra một số câu hỏi, bây giờ hãy cùng giải đáp lại.

> Q: Luồng xử lý tiếp theo khi một thread lấy khóa thất bại là gì?
>
> A: Tồn tại một cơ chế xếp hàng chờ đợi, thread tiếp tục chờ, vẫn giữ khả năng lấy được khóa và quy trình lấy khóa vẫn tiếp diễn.
>
> Q: Đã nói đến cơ chế xếp hàng chờ đợi thì chắc chắn sẽ hình thành một loại hàng đợi nào đó; hàng đợi như vậy dùng cấu trúc dữ liệu gì?
>
> A: Là hàng đợi hai đầu FIFO biến thể CLH.
>
> Q: Khi nào thì thread đang trong cơ chế xếp hàng chờ đợi mới có cơ hội lấy được khóa?
>
> A: Có thể xem chi tiết ở mục 2.3.1.3.
>
> Q: Nếu thread trong cơ chế xếp hàng chờ đợi mãi vẫn không lấy được khóa thì có phải chờ vô thời hạn không, hay có chiến lược nào khác để giải quyết vấn đề này?
>
> A: Trạng thái của node chứa thread sẽ chuyển thành trạng thái hủy (`CANCELLED`), và node ở trạng thái hủy sẽ được giải phóng khỏi hàng đợi; chi tiết xem ở mục 2.3.2.
>
> Q: Hàm `Lock` thực hiện khóa thông qua phương thức `Acquire`, nhưng cụ thể nó khóa như thế nào?
>
> A: `Acquire` của AQS sẽ gọi phương thức `tryAcquire`, `tryAcquire` do từng synchronizer tùy chỉnh triển khai, thông qua `tryAcquire` để hoàn thành quá trình lấy khóa.

## 4 Ứng dụng của AQS

### 4.1 Ứng dụng tính khả tái nhập (Reentrant) của ReentrantLock

Tính khả tái nhập của `ReentrantLock` là một trong những ứng dụng rất hay của AQS; sau khi nắm vững các kiến thức trên, chúng ta rất dễ nhận ra cách `ReentrantLock` hiện thực hóa tính khả tái nhập. Bên trong `ReentrantLock`, dù là Fair Lock hay Non-fair Lock thì đều có một đoạn logic tương tự.

Fair Lock:

```java
// java.util.concurrent.locks.ReentrantLock.FairSync#tryAcquire

if (c == 0) {
  if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
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
```

Non-fair Lock:

```java
// java.util.concurrent.locks.ReentrantLock.Sync#nonfairTryAcquire

if (c == 0) {
  if (compareAndSetState(0, acquires)){
    setExclusiveOwnerThread(current);
    return true;
  }
}
else if (current == getExclusiveOwnerThread()) {
  int nextc = c + acquires;
  if (nextc < 0) // overflow
    throw new Error("Maximum lock count exceeded");
  setState(nextc);
  return true;
}
```

Từ cả hai đoạn mã trên đều có thể thấy có một trạng thái đồng bộ `State` dùng để kiểm soát tổng thể tình huống tái nhập. `State` được khai báo với từ khóa `Volatile`, dùng để đảm bảo tính khả kiến (`Visibility`) và tính tuần tự (`Ordering`).

```java
// java.util.concurrent.locks.AbstractQueuedSynchronizer

private volatile int state;
```

Tiếp theo hãy xem quá trình thay đổi chính của trường `State` này:

1. Khi `State` mới khởi tạo có giá trị bằng `0`, biểu thị chưa có thread nào giữ khóa.
2. Khi có thread giữ khóa này, giá trị sẽ cộng thêm `+1` trên nền giá trị ban đầu; khi cùng một thread lấy khóa nhiều lần thì sẽ cộng thêm `+1` nhiều lần — đây chính là khái niệm tái nhập (reentrancy).
3. Mở khóa cũng là trừ `-1` trên trường này cho đến khi về `0`, khi đó thread này giải phóng khóa.

### 4.2 Các kịch bản ứng dụng trong JUC

Ngoài ứng dụng tính khả tái nhập của `ReentrantLock` ở trên, AQS với vai trò là framework cho lập trình đồng thời còn cung cấp giải pháp rất tốt cho nhiều công cụ đồng bộ khác. Dưới đây liệt kê một số công cụ đồng bộ trong JUC, giới thiệu khái quát các kịch bản ứng dụng của AQS:

| Công cụ đồng bộ | Mối liên hệ giữa công cụ đồng bộ và AQS |
| :--- | :--- |
| `ReentrantLock` | Dùng AQS để lưu số lần khóa được giữ lặp lại. Khi một thread lấy khóa, `ReentrantLock` ghi nhận định danh của thread đang giữ khóa hiện tại để kiểm tra việc lấy khóa lặp lại, cũng như xử lý các trường hợp ngoại lệ khi thread sai cố gắng thực hiện thao tác mở khóa. |
| `Semaphore` | Dùng trạng thái đồng bộ của AQS để lưu số lượng tín hiệu (permit) hiện tại của semaphore. `tryRelease` sẽ tăng số đếm, `acquireShared` sẽ giảm số đếm. |
| `CountDownLatch` | Dùng trạng thái đồng bộ của AQS để biểu thị bộ đếm. Chỉ khi bộ đếm bằng `0`, tất cả các thao tác `Acquire` (phương thức `await` của `CountDownLatch`) mới có thể đi qua. |
| `ReentrantReadWriteLock` | Dùng 16 bit của trạng thái đồng bộ AQS để lưu số lần giữ khóa ghi (write lock), 16 bit còn lại dùng để lưu số lần giữ khóa đọc (read lock). |
| `ThreadPoolExecutor` | `Worker` tận dụng trạng thái đồng bộ của AQS để thực hiện việc thiết lập biến thread độc quyền (`tryAcquire` và `tryRelease`). |

### 4.3 Công cụ đồng bộ tùy chỉnh

Sau khi hiểu nguyên lý cơ bản của AQS, dựa theo các kiến thức về AQS đã trình bày ở trên, hãy tự mình hiện thực hóa một công cụ đồng bộ.

```java
public class LeeLock  {

    private static class Sync extends AbstractQueuedSynchronizer {
        @Override
        protected boolean tryAcquire (int arg) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }

        @Override
        protected boolean tryRelease (int arg) {
            if (getState() == 0 || getExclusiveOwnerThread() != Thread.currentThread()) {
                throw new IllegalMonitorStateException();
            }
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }

        @Override
        protected boolean isHeldExclusively () {
            return getState() == 1 && getExclusiveOwnerThread() == Thread.currentThread();
        }
    }

    private final Sync sync = new Sync();

    public void lock () {
        sync.acquire(1);
    }

    public void unlock () {
        sync.release(1);
    }
}
```

Sử dụng `Lock` do chính chúng ta định nghĩa để hoàn thành một chức năng đồng bộ đơn giản.

```java
public class LeeMain {

    static int count = 0;
    static LeeLock leeLock = new LeeLock();

    public static void main (String[] args) throws InterruptedException {

        Runnable runnable = new Runnable() {
            @Override
            public void run () {
                try {
                    leeLock.lock();
                    for (int i = 0; i < 10000; i++) {
                        count++;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    leeLock.unlock();
                }

            }
        };
        Thread thread1 = new Thread(runnable);
        Thread thread2 = new Thread(runnable);
        thread1.start();
        thread2.start();
        thread1.join();
        thread2.join();
        System.out.println(count);
    }
}
```

Đoạn mã trên sẽ cho kết quả `20000` trong mỗi lần chạy. Chỉ với vài dòng mã đơn giản đã có thể hiện thực hóa chức năng đồng bộ — đó chính là sức mạnh của AQS.

## 5 Tổng kết

Trong công việc phát triển hằng ngày chúng ta gặp rất nhiều kịch bản đồng thời, nhưng số người hiểu rõ nguyên lý framework nền tảng bên trong lại không nhiều. Do giới hạn dung lượng, bài viết này chỉ giới thiệu nguyên lý của khóa khả tái nhập `ReentrantLock` và nguyên lý AQS, hy vọng có thể trở thành "viên gạch lót đường" giúp mọi người tìm hiểu sâu hơn về AQS, `ReentrantLock` cũng như các synchronizer khác.

## Tài liệu tham khảo

- Lea D. The java. util. concurrent synchronizer framework\[J]. Science of Computer Programming, 2005, 58(3): 293-309.
- *Java Concurrency in Practice*
- [Những điều cần biết về "Lock" trong Java](https://tech.meituan.com/2018/11/15/java-lock.html)
