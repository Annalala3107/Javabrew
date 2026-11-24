---
title: "Phân tích chi tiết về Cơ chế Khóa và Đồng bộ trong Hệ điều hành: Mutex, Semaphore, Condition Variable, Spinlock và Futex"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về cơ chế khóa và đồng bộ trong hệ điều hành, làm rõ miền găng (critical section), mutex, spinlock, semaphore, condition variable, futex, chỉ lệnh nguyên tử, thứ tự bộ nhớ, nghịch đảo độ ưu tiên (priority inversion), cùng sự khác biệt giữa khóa user space và khóa kernel Linux."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
  - Lập trình đồng thời
head:
  - - meta
    - name: keywords
      content: Khóa hệ điều hành,Cơ chế đồng bộ,Miền găng,Mutex,Khóa tự xoay,Spinlock,Semaphore,Condition Variable,futex,Chỉ lệnh nguyên tử,Rào cản bộ nhớ,Nghịch đảo độ ưu tiên,Khóa kernel Linux,Câu hỏi phỏng vấn hệ điều hành,Lập trình đồng thời
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/os-lock-and-sync.md
---

Hai thread đồng thời tăng một biến đếm lên 1, nhìn qua tưởng chừng là một việc rất đơn giản, nhưng kết quả cuối cùng hoàn toàn có thể bị thiếu mất một lần tăng.

Nguyên nhân thực ra rất dễ hiểu. Trong mã nguồn, `count++` chỉ là một dòng lệnh, nhưng khi vi xử lý thực thi, nó thường trải qua ba bước tách biệt: đọc giá trị cũ, tính toán và ghi ngược lại bộ nhớ. Thread A vừa đọc được giá trị cũ, chưa kịp ghi đè kết quả mới thì Thread B cũng đã đọc đúng giá trị cũ đó. Cả hai thread tự tính ra giá trị mới của riêng mình, và cuối cùng cùng ghi đè lên bộ nhớ một kết quả giống hệt nhau.

Để giải quyết triệt để những lỗi tương tranh (concurrency bug) như vậy, hệ điều hành cung cấp các loại khóa (lock) cùng hàng loạt cơ chế đồng bộ (synchronization mechanisms). Bài toán mà chúng giải quyết không chỉ dừng lại ở việc đoạn code đó có được thực thi đồng thời hay không, mà còn bao gồm: thread có nên bị chặn hay không, số lượng tài nguyên giới hạn quản lý ra sao, và khi điều kiện chưa thỏa mãn thì thread phải chờ đợi như thế nào. Đi sâu vào tầng kernel, hệ điều hành còn phải cân nhắc thêm các yếu tố ngắt phần cứng (interrupt), quyền ưu tiên (preemption), kiến trúc đa CPU, tính thời gian thực (real-time) và độ trễ lập lịch.

Bài viết này tập trung phân tích các cơ chế đồng bộ thuần túy dưới góc nhìn hệ điều hành. Các kiến thức về `synchronized`, `ReentrantLock`, AQS, CAS và tối ưu hóa khóa trong Java đã được trình bày chi tiết trong bài [Phân tích chi tiết về Khóa trong Java](../../java/concurrent/java-lock.md) và sẽ không lặp lại ở đây. Trọng tâm của bài viết này là làm rõ các khái niệm Mutex, Semaphore, Condition Variable, Spinlock, Futex giải quyết những bài toán riêng biệt nào. Khi đã hiểu vững các nguyên thủy đồng bộ này, việc đọc tiếp bài [Phân tích chi tiết về Deadlock](./dead-lock.md) sẽ giúp bạn dễ dàng nắm bắt được "tại sao quan hệ chờ đợi lại tạo thành chu trình khép kín".

Bảng sau tóm lược nhanh các cơ chế đồng bộ và bài toán tương ứng mà chúng giải quyết:

| Cơ chế | Vấn đề giải quyết chính | Cách thức chờ đợi | Tình huống thường gặp |
| --- | --- | --- | --- |
| mutex | Loại trừ tương hỗ trong miền găng (Critical Section) | Về mặt ngữ nghĩa là chờ khóa sẵn sàng; triển khai có thể spin hoặc block | Bảo vệ cấu trúc dữ liệu dùng chung |
| spinlock | Loại trừ tương hỗ trong miền găng cực ngắn | Chờ bận (busy-waiting) | Các luồng trong kernel không được phép ngủ |
| semaphore | Đếm tài nguyên, giới hạn số lượng truy cập đồng thời | Chờ khi biến đếm bằng 0 | Vị trí ô đệm (buffer slot), giới hạn kết nối, số lượng tác vụ đồng thời |
| condition variable | Chờ một trạng thái dùng chung trở thành đúng (true) | Giải phóng mutex một cách nguyên tử và chờ | Hàng đợi có phần tử, tác vụ hoàn thành, bộ đệm còn chỗ trống |
| futex | Nền tảng chặn/đánh thức cho khóa ở user space | Đường nhanh (fast path) ở user space, đường chậm (slow path) vào kernel | pthread mutex, các bộ đồng bộ hóa của runtime |
| memory barrier | Ràng buộc thứ tự truy cập bộ nhớ và tính khả kiến (visibility) | Thường không chịu trách nhiệm chặn luồng | Cấu trúc dữ liệu lock-free, đồng bộ tầng kernel, truy cập thanh ghi thiết bị |

## Miền găng (Critical Section) thực chất bảo vệ điều gì?

**Miền găng (Critical Section)** là đoạn mã truy cập vào trạng thái khả biến dùng chung (shared mutable state) mà không được phép để nhiều luồng thực thi đan xen nhau một cách tùy tiện. Đó có thể là một đoạn code cập nhật biến đếm trong ứng dụng người dùng, hoặc đoạn mã trong kernel cập nhật hàng đợi lập lịch, bảng file descriptor, bảng trang (page table) hay trạng thái thiết bị phần cứng.

![Sơ đồ giao thức truy cập bảo vệ miền găng: Nhiều thread truy cập trạng thái dùng chung qua một lối vào có khóa đồng nhất; bỏ qua khóa hoặc đổi đối tượng khóa đều phá vỡ quan hệ loại trừ tương hỗ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-critical-section-67226b1b.png)

Khi đánh giá một loại khóa hoặc một cơ chế đồng bộ, bạn có thể xem xét dựa trên 4 tiêu chí cốt lõi: tính chính xác, tính tiến triển, tính công bằng và hiệu năng.

1. **Tính chính xác (Correctness)**: Tại cùng một thời điểm, không được để nhiều luồng thực thi đan xen nhau làm sai lệch trạng thái dùng chung; trong môi trường đa CPU, cần có thêm ngữ nghĩa đồng bộ bộ nhớ cần thiết để các thay đổi do một thread ghi vào trước khi giải phóng khóa có thể được thread tiếp theo nhận khóa nhìn thấy một cách chính xác.
2. **Tính tiến triển (Progress)**: Bản thân cơ chế đồng bộ không được tự giam cầm toàn bộ các thread đang chờ, khiến hệ thống rơi vào trạng thái không còn thread nào có thể tiếp tục chạy.
3. **Tính công bằng (Fairness)**: Khi nhiều thread cùng chờ một khóa, cần hạn chế tối đa việc một thread nào đó bị bỏ đói (starvation) trong thời gian dài. Hệ thống thực tế không nhất thiết phải tuân theo thứ tự FIFO tuyệt đối, nhưng vấn đề starvation luôn phải được xử lý nghiêm túc.
4. **Hiệu năng (Performance)**: Khi không có tranh chấp (uncontended), đường dẫn xin khóa và giải phóng khóa phải thật nhẹ nhàng; khi tranh chấp gay gắt, các thread đang chờ không được lãng phí tài nguyên CPU vào các vòng lặp vô nghĩa.

Trong giáo trình OSTEP khi giảng về khóa cũng tập trung vào các câu hỏi này: Có thực sự đảm bảo loại trừ tương hỗ không? Thread chờ có bị chết đói không? Khi không có tranh chấp thì tốn bao nhiêu chi phí? Biểu hiện trên đơn CPU và đa CPU khác nhau thế nào? Chỉ hỏi "loại khóa nào nhanh nhất" là vô nghĩa, bởi cùng một loại khóa đặt trên các phần cứng khác nhau, độ dài miền găng khác nhau và cường độ tranh chấp khác nhau sẽ mang lại kết quả hoàn toàn trái ngược.

## Mutex: Đóng cửa trước, sửa trạng thái sau

Quay lại ví dụ `count++` ở trên. Nếu thao tác tự tăng này bắt buộc phải tính đúng, cách trực tiếp nhất là bọc thao tác đọc, cộng và ghi vào bên trong một **khóa loại trừ tương hỗ (Mutex - Mutual Exclusion Lock)**. Thread nào lấy được khóa trước thì được vào sửa trước; thread nào chưa lấy được khóa thì đứng chờ ngoài cửa.

Viết bằng POSIX Threads (pthreads) trong C sẽ có dạng:

```c
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
int count = 0;

void increase(void) {
    pthread_mutex_lock(&mutex);
    count++;
    pthread_mutex_unlock(&mutex);
}
```

Trong đoạn code này, `pthread_mutex_lock()` không chỉ đơn thuần là bật một lá cờ đánh dấu. Theo ngữ nghĩa POSIX, nếu khóa đã bị thread khác nắm giữ, calling thread sẽ chờ cho đến khi khóa sẵn sàng, và chỉ khi hàm trả về thành công thì thread mới thực sự sở hữu khóa đó.

Triển khai cụ thể có thể linh hoạt hơn. Nhiều thư viện pthread mutex hoặc runtime của các ngôn ngữ có thể cho thread tự xoay (spin) ngắn ở user space trước; nếu tranh chấp vẫn chưa được giải phóng, nó mới chuyển sang đường dẫn chặn luồng như gọi futex. Đối với người lập trình, trọng tâm là nắm vững ngữ nghĩa: trước khi lấy được khóa thì không được bước vào miền găng, và sau khi lấy được khóa mới có quyền truy cập vào dữ liệu được bảo vệ.

Mutex rất phù hợp để bảo vệ việc chỉnh sửa các trạng thái dùng chung có ranh giới rõ ràng: cập nhật reference count, thay đổi con trỏ danh sách liên kết, bảo trì bảng tiến trình, cập nhật một vùng cache trong bộ nhớ. Khi viết những đoạn code này, điều đầu tiên cần làm rõ là: khóa này chịu trách nhiệm bảo vệ trạng thái nào, và tất cả các lối vào truy cập trạng thái đó đã tuân thủ cùng một quy tắc hay chưa.

Một lỗi sai kinh điển: một đối tượng dùng chung có 5 đường truy cập. Bốn đường đều nghiêm túc xin cùng một khóa mutex, riêng đường thứ năm vì "tiện tay" nên truy cập và sửa trực tiếp giá trị. Như vậy, dù 4 đường kia viết cẩn thận đến đâu thì cơ chế loại trừ tương hỗ cũng đã bị phá vỡ hoàn toàn. Khóa bảo vệ giao thức truy cập, chứ chỉ đặt một biến bên cạnh cái khóa thì chẳng có tác dụng gì.

Một chi tiết quan trọng nữa: Mutex thường đi kèm **ngữ nghĩa người sở hữu (owner semantics)**. Hiểu đơn giản là: ai lấy khóa thì người đó phải giải phóng khóa. Tài liệu Linux kernel khi giới thiệu về các loại khóa đã nhấn mạnh điều này: phần lớn các khóa đều yêu cầu chính ngữ cảnh đã lấy khóa phải thực hiện giải phóng. Semaphore thì khác, nó giống một biến đếm hơn, và khi nói về Semaphore chúng ta sẽ thấy rõ sự khác biệt này.

## Spinlock: Đừng ngủ, hãy đứng đợi tại chỗ một lát

Khi không lấy được Mutex, thread có thể đi ngủ để kernel đánh thức sau. **Khóa tự xoay (Spinlock)** thì ngược lại: khoan hãy ngủ, hãy tiếp tục chạy vòng lặp trên CPU để liên tục kiểm tra xem khóa đã được giải phóng hay chưa.

Nghe có vẻ lãng phí, nhưng thực tế hiệu quả lại phụ thuộc vào thời gian chờ đợi.

![So sánh cơ chế chờ giữa mutex và spinlock: mutex ngủ chờ trong các luồng có thể bị chặn; spinlock bận chờ ngắn trong các luồng ngắn không được phép ngủ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-mutex-spinlock-54933375.png)

Nếu một khóa chỉ bảo vệ vài dòng lệnh ngắn ngủi, thread đang giữ khóa sẽ rời khỏi miền găng gần như ngay lập tức. Trong trường hợp đó, việc bắt thread đang chờ đi ngủ là một hạ sách: đưa thread vào giấc ngủ rồi đánh thức dậy đều phải thông qua scheduler của hệ điều hành, kèm theo chi phí chuyển đổi ngữ cảnh (context switch). Trên máy tính đa CPU, thread giữ khóa có thể đang chạy trên một CPU core khác và sẽ nhả khóa chỉ sau vài chu kỳ lệnh. Lúc này, thread đang chờ chỉ cần xoay vài vòng tại chỗ trên CPU thì chi phí tổng thể sẽ thấp hơn rất nhiều so với context switch.

Tuy nhiên, Spinlock có 2 giới hạn ngặt nghèo:

1. **Miền găng bắt buộc phải cực ngắn.** Nếu thread giữ khóa thực hiện truy cập đĩa cứng, chờ mạng, hoặc cấp phát bộ nhớ có thể gây ngủ, bên chờ sẽ đốt sạch chu kỳ CPU vào việc chạy vòng lặp vô ích.
2. **Cực kỳ cẩn trọng trong môi trường đơn CPU hoặc có thể bị chiếm quyền (preemptible).** Nếu thread giữ khóa bị chiếm quyền (preempted), trong khi thread chờ lại liên tục chạy vòng lặp trên chính CPU đó, thread chờ có quay bao nhiêu vòng đi chăng nữa cũng không bao giờ đợi được hành động nhả khóa từ thread kia.

Trong Linux kernel không bật PREEMPT_RT, khi lấy một `spinlock_t` thông thường, hệ thống sẽ ngầm vô hiệu hóa tính năng chiếm quyền (disable preemption) trên CPU hiện tại; nếu muốn ngăn không cho trình xử lý ngắt (interrupt handler) ngắt quãng miền găng trên CPU này, lập trình viên kernel sẽ dùng các hàm có hậu tố như `spin_lock_irq()`, `spin_lock_irqsave()`. Nghĩa là, hàm `spin_lock()` trần trụi KHÔNG đồng nghĩa với việc luôn tắt ngắt phần cứng.

Tài liệu Linux kernel chia khóa thành: sleeping locks, CPU local locks và spinning locks. `mutex`, `semaphore`, `rw_semaphore` thuộc nhóm có thể ngủ; `raw_spinlock_t` trong cả kernel thường lẫn PREEMPT_RT đều là spinlock nghiêm ngặt. Ngữ nghĩa của `spinlock_t` thay đổi tùy theo cấu hình PREEMPT_RT: ở kernel thông thường, nó ánh xạ tới `raw_spinlock_t`; dưới PREEMPT_RT, nó được triển khai dựa trên `rt_mutex`, không còn ngầm vô hiệu hóa preemption, và các hậu tố `_irq` / `_irqsave` cũng không can thiệp trực tiếp vào trạng thái ngắt phần cứng nữa.

Trong code ứng dụng ở user space, lập trình viên thông thường tuyệt đối không nên tự viết spinlock. Các thư viện hoặc runtime có thể áp dụng cơ chế tự xoay thích ứng (adaptive spinning) trên các luồng thực thi siêu ngắn, nhưng việc tự viết vòng lặp `while` trong code nghiệp vụ phần lớn chỉ làm CPU nóng lên vô ích.

## Semaphore: Không chỉ là chiếc khóa 0 và 1

**Semaphore (đèn hiệu)** có thể coi là một biến đếm số nguyên không bao giờ giảm xuống số âm. Hàm `sem_wait()` cố gắng giảm biến đếm đi 1; nếu giá trị hiện tại lớn hơn 0, nó giảm giá trị rồi tiếp tục chạy; nếu giá trị hiện tại là 0, calling thread sẽ bị chặn lại. Hàm `sem_post()` tăng biến đếm lên 1 và có thể đánh thức thread đang chờ.

Khi khởi tạo giá trị ban đầu là 1, Semaphore có thể hoạt động như một Mutex (Binary Semaphore):

```c
sem_t sem;

sem_init(&sem, 0, 1);

sem_wait(&sem);
// critical section
sem_post(&sem);
```

Tuy nhiên, công dụng phổ biến và tự nhiên nhất của Semaphore là **đếm tài nguyên và giới hạn tải**. Ví dụ: một bộ đệm có N vị trí trống, một connection pool chỉ cho phép tối đa N kết nối, hoặc một loại tác vụ chỉ cho phép chạy tối đa N luồng đồng thời. Khi đó, giá trị khởi tạo của Semaphore chính là tổng số lượng tài nguyên sẵn có.

Binary Semaphore có thể mô phỏng loại trừ tương hỗ, nhưng nó KHÔNG đồng nhất với Mutex. Mutex nhấn mạnh vào quyền sở hữu và ranh giới miền găng, trong khi Semaphore nhấn mạnh vào số lượng giấy phép (permits). Trong bài toán bộ đệm giới hạn (bounded buffer), hai vấn đề này thường được tách bạch: Semaphore quản lý số lượng slot, còn Mutex quản lý cấu trúc nội bộ của buffer.

![Sơ đồ semaphore quản lý số lượng tài nguyên của bộ đệm giới hạn: empty_slots ghi nhận số chỗ trống, filled_slots ghi nhận số phần tử sẵn sàng tiêu thụ, buffer_mutex bảo vệ cấu trúc bộ đệm](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-semaphore-buffer-28f42541.png)

Đoạn code sau lược bỏ chi tiết kiểu `item_t` và triển khai buffer để làm nổi bật khung xương đồng bộ:

```c
#include <errno.h>
#include <pthread.h>
#include <semaphore.h>
#include <stdlib.h>

#define BUFFER_SIZE 1024

sem_t empty_slots;
sem_t filled_slots;
pthread_mutex_t buffer_mutex = PTHREAD_MUTEX_INITIALIZER;

void init_buffer(void) {
    if (sem_init(&empty_slots, 0, BUFFER_SIZE) == -1) {
        abort();
    }
    if (sem_init(&filled_slots, 0, 0) == -1) {
        abort();
    }
}

static void wait_sem(sem_t *sem) {
    while (sem_wait(sem) == -1) {
        if (errno == EINTR) {
            continue;
        }
        abort();
    }
}

void producer(void) {
    item_t item = produce_item();

    wait_sem(&empty_slots);
    pthread_mutex_lock(&buffer_mutex);
    put_item(item);
    pthread_mutex_unlock(&buffer_mutex);
    sem_post(&filled_slots);
}

void consumer(void) {
    wait_sem(&filled_slots);
    pthread_mutex_lock(&buffer_mutex);
    item_t item = take_item();
    pthread_mutex_unlock(&buffer_mutex);
    sem_post(&empty_slots);

    consume(item);
}
```

`empty_slots` ghi nhận số lượng ô trống còn lại, `filled_slots` ghi nhận số phần tử sẵn sàng để lấy ra. Bên sản xuất (producer) trước tiên tiêu hao một ô trống, đưa dữ liệu vào dưới sự bảo vệ của lock, rồi tăng thêm một phần tử khả dụng; bên tiêu thụ (consumer) làm quy trình ngược lại. `buffer_mutex` chỉ chịu trách nhiệm duy nhất là bảo vệ cấu trúc mảng của bộ đệm khi gọi `put_item()` và `take_item()`.

Việc xử lý thử lại khi gặp lỗi `EINTR` trong hàm `wait_sem()` là bắt buộc trong thực tế. Tài liệu Linux man-pages nêu rõ `sem_wait()` có thể trả về `-1` và gán `errno = EINTR` nếu bị ngắt bởi một signal handler. Nếu bỏ qua nhánh kiểm tra này, chương trình sẽ dễ xuất hiện các lỗi chập chờn rất khó tái hiện.

Tài liệu Linux Kernel locking cũng chỉ ra rằng Semaphore có thể dùng để tuần tự hóa và chờ đợi; tuy nhiên khi viết mã mới, cộng đồng kernel khuyến khích tách bạch ngữ nghĩa loại trừ tương hỗ sang `mutex` và chờ sự kiện sang `completion`. Một lý do quan trọng là Semaphore không có chủ sở hữu rõ ràng (no owner), khiến hệ thống PREEMPT_RT không thể áp dụng cơ chế thừa kế độ ưu tiên (priority inheritance), dẫn tới nguy cơ nghịch đảo độ ưu tiên (priority inversion).

## Condition Variable: Thứ ta chờ không phải là khóa, mà là một điều kiện thành sự thật

Mutex giải quyết câu hỏi: "Ai được quyền vào miền găng tại thời điểm này?". Nhưng trong rất nhiều trường hợp, thread bước vào miền găng rồi mới phát hiện điều kiện nghiệp vụ vẫn chưa thỏa mãn.

Ví dụ: consumer lấy được khóa, kiểm tra thấy hàng đợi rỗng. Nó không thể lấy dữ liệu, nhưng cũng không thể cứ ôm khư khư cái khóa rồi đi ngủ. Nếu consumer ôm khóa ngủ, producer sẽ không bao giờ xin được khóa để đẩy dữ liệu vào, và toàn bộ hệ thống sẽ bị đóng băng.

**Biến điều kiện (Condition Variable)** sinh ra để giải quyết bài toán chờ đợi điều kiện này. Nó luôn được sử dụng cặp đôi với Mutex:

```c
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t not_empty = PTHREAD_COND_INITIALIZER;
queue_t queue;

void consumer(void) {
    pthread_mutex_lock(&mutex);

    while (queue_empty(&queue)) {
        pthread_cond_wait(&not_empty, &mutex);
    }

    item_t item = queue_pop(&queue);
    pthread_mutex_unlock(&mutex);

    consume(item);
}

void producer(item_t item) {
    pthread_mutex_lock(&mutex);
    queue_push(&queue, item);
    pthread_cond_signal(&not_empty);
    pthread_mutex_unlock(&mutex);
}
```

Hàm `pthread_cond_wait()` thực hiện một chuỗi thao tác nguyên tử mang tính quyết định: nó nguyên tử giải phóng mutex và đưa thread hiện tại vào trạng thái ngủ chờ trên biến điều kiện; trước khi thức dậy và trả về cho caller, nó sẽ tự động xin lại quyền sở hữu mutex. Hành động "nhả khóa và đi ngủ" bắt buộc phải diễn ra nguyên tử, nếu không sẽ xuất hiện lỗi mất tín hiệu (missed wakeup): thread vừa chuẩn bị ngủ thì producer đã gửi xong tín hiệu đánh thức, sau đó consumer mới chính thức ngủ, và vĩnh viễn không còn ai đánh thức nó nữa.

![Lưu đồ chờ điều kiện thỏa mãn của condition variable: Thread kiểm tra trạng thái dùng chung trong vòng lặp while; khi điều kiện chưa thỏa mãn, nhả mutex và đi ngủ; sau khi được signal đánh thức, kiểm tra lại điều kiện](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-condition-variable-400a44aa.png)

Có 3 quy tắc sống còn khi sử dụng Condition Variable:

1. **Luôn kiểm tra điều kiện chờ trong vòng lặp `while`, tuyệt đối không dùng `if`.** Chuẩn POSIX cho phép xảy ra hiện tượng **thức giấc giả (spurious wakeup)**, nghĩa là thread có thể tỉnh dậy ngay cả khi không có ai gửi signal. Ngoài ra, ngay cả khi có signal hợp lệ, nếu nhiều consumer cùng được đánh thức đồng thời, có thể chỉ có một thread lấy được dữ liệu, các thread còn lại kiểm tra lại sẽ thấy hàng đợi lại rỗng.
2. **Condition Variable bản thân nó không lưu trữ trạng thái; trạng thái thực sự phải nằm trong biến dùng chung được mutex bảo vệ.** `pthread_cond_signal()` không phải là một tấm vé vĩnh cửu nhét vào hòm thư. Nếu lúc signal phát ra mà không có thread nào đang chờ, thông báo đó sẽ bị biến mất. Thứ thực sự quyết định consumer có được chạy tiếp hay không là độ dài hàng đợi đằng sau hàm `queue_empty()`.
3. **Trong suốt thời gian có thread đang chờ, một biến điều kiện chỉ được đi kèm với duy nhất một mutex.** POSIX gọi đây là liên kết động (dynamic binding): nếu có thread đang bị chặn trên một biến điều kiện mà thread khác lại dùng một mutex khác để chờ trên chính biến điều kiện đó, hành vi là không xác định (undefined behavior). Đây là lý do trong thực tế, các biến trạng thái, mutex và condvar luôn được đóng gói chung trong một cấu trúc dữ liệu duy nhất.

Hầu hết các lỗi liên quan đến Condition Variable đều xuất phát từ việc coi signal như trạng thái, hoặc không kiểm tra lại điều kiện sau khi thức dậy.

## Futex: Thử ở User Space trước, thất bại mới gọi Kernel

Trong thế giới Linux, bạn sẽ rất thường nghe đến thuật ngữ **Futex** (Fast Userspace Mutex). Dù tên chứa chữ "mutex", futex thực chất là một khối nền tảng để xây dựng nên các loại khóa chứ không phải là khóa ở tầng ứng dụng.

Ý tưởng thiết kế của futex là: khi không có tranh chấp (uncontended), việc xin khóa và nhả khóa diễn ra hoàn toàn ở user space thông qua các chỉ lệnh nguyên tử tác động lên một số nguyên 32-bit; chỉ khi phát sinh tranh chấp thực sự—cần đưa thread vào giấc ngủ hoặc đánh thức thread dậy—chương trình mới gọi system call `futex()` để nhờ kernel can thiệp. Cách này loại bỏ hoàn toàn chi phí gọi system call trong trường hợp không có tranh chấp.

Quy trình giản lược diễn ra như sau:
1. Thread dùng thao tác nguyên tử ở user space để cố gắng đổi giá trị từ 0 thành 1.
2. Nếu thành công (không ai tranh chấp), thread lập tức bước vào miền găng mà không tốn một lời gọi kernel nào.
3. Nếu thất bại (khóa đang bị chiếm), thread gọi `futex()` với cờ `FUTEX_WAIT` để kernel đưa mình vào danh sách ngủ.
4. Thread giữ khóa sau khi hoàn thành và nhả khóa, nếu thấy có thread đang chờ, sẽ gọi `futex()` với cờ `FUTEX_WAKE` để kernel đánh thức các thread trong hàng đợi.

![Sơ đồ đường nhanh user space và đường chậm kernel của futex: Khi không tranh chấp, lấy khóa qua thao tác nguyên tử ở user space; tranh chấp thất bại thì vào FUTEX_WAIT; khi nhả khóa gọi FUTEX_WAKE để đánh thức thread đang chờ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-futex-e072e8d9.png)

Lệnh gọi `FUTEX_WAIT` áp dụng cơ chế so sánh và chặn nguyên tử (**compare-and-block**): kernel sẽ kiểm tra xem giá trị tại địa chỉ futex có đúng bằng giá trị kỳ vọng mà caller truyền vào hay không. Chỉ khi giá trị khớp nhau thì kernel mới đưa thread vào giấc ngủ. Thao tác so sánh và đưa vào hàng đợi ngủ này diễn ra nguyên tử, giúp hàn gắn hoàn hảo giữa thao tác nguyên tử ở user space và hàng đợi ngủ trong kernel.

Tài liệu man-pages nhấn mạnh: futex thao tác xoay quanh một giá trị 32-bit trong không gian địa chỉ user space. Ứng dụng thông thường không gọi trực tiếp system call futex; các thư viện như `pthread_mutex`, condition variable hay runtime của các ngôn ngữ lập trình sẽ sử dụng futex bên dưới để hiện thực hóa các nguyên thủy đồng bộ cấp cao.

Tóm lại: **Đường nhanh giữ trọn vẹn ở user space, chỉ khi vào đường chậm mới cần nhờ kernel xếp hàng đi ngủ.**

## Chỉ lệnh nguyên tử: Điểm khởi đầu không thể phân cắt của Khóa

Dù là Mutex, Spinlock hay Futex, tầng dưới cùng đều bắt buộc phải dựa vào các chỉ lệnh nguyên tử (atomic instructions) được phần cứng hỗ trợ. Nếu không có phần cứng bảo đảm, thì khoảng trống giữa thao tác "kiểm tra khóa có rảnh không" và "đánh dấu khóa đã bị chiếm" sẽ lập tức bị thread khác xen vào gây lỗi.

Các chỉ lệnh nguyên tử phần cứng phổ biến bao gồm Test-and-Set, Compare-and-Swap (CAS), Fetch-and-Add. Chúng đảm bảo thao tác đọc-sửa-ghi trên một ô nhớ nhất định không bao giờ bị các CPU core khác nhìn thấy ở trạng thái dở dang.

Một số giáo trình cơ bản thường nhắc tới kỹ thuật "tắt ngắt để làm khóa". Trong kernel đơn CPU, tắt ngắt có thể ngăn luồng thực thi hiện tại bị ngắt quãng bởi interrupt handler, từ đó bảo vệ miền găng của kernel. Nhưng phương pháp này có ranh giới rất hẹp: nó chỉ có tác dụng trên chính CPU hiện tại, hoàn toàn không thể ngăn cản một CPU core khác truy cập vào cùng ô nhớ đó trên hệ thống đa nhân. Trên kiến trúc đa xử lý, việc đảm bảo loại trừ tương hỗ bắt buộc phải dựa vào chỉ lệnh nguyên tử phần cứng, giao thức nhất quán bộ đệm (cache coherence như MESI) và cơ chế khóa bus bộ nhớ.

Đó là lý do tại sao các khóa học hệ điều hành luôn giảng về chỉ lệnh nguyên tử trước khi nói về cách làm khóa. Khóa cung cấp cho lập trình viên giao diện `lock()` / `unlock()`, nhưng bên dưới là sự phối hợp chặt chẽ giữa CPU và kernel để duy trì các cập nhật không thể phân cắt.

## Khóa còn chịu trách nhiệm đảm bảo thứ tự bộ nhớ (Memory Ordering)

Khóa không chỉ đơn thuần là việc xếp hàng trước cửa miền găng. Trong hệ thống đa CPU, cả vi xử lý lẫn compiler tối ưu hóa đều có thể tự ý sắp xếp lại thứ tự các lệnh truy cập bộ nhớ (instruction reordering). Nếu thiếu ngữ nghĩa đồng bộ, dữ liệu do một CPU ghi vào có thể sẽ không được CPU khác nhìn thấy theo đúng thứ tự logic trong mã nguồn.

Do đó, hành động xin khóa và nhả khóa luôn đi kèm các ràng buộc về thứ tự bộ nhớ:

- **Acquire semantics**: Mọi thao tác truy cập bộ nhớ diễn ra *sau* khi lấy khóa không được phép bị sắp xếp nhảy lên *trước* thời điểm lấy khóa.
- **Release semantics**: Mọi thao tác truy cập bộ nhớ diễn ra *trước* khi nhả khóa không được phép bị sắp xếp nhảy xuống *sau* thời điểm nhả khóa.

Tài liệu rào cản bộ nhớ (memory barrier) của Linux kernel xếp thao tác LOCK vào nhóm Acquire, và UNLOCK vào nhóm Release. Khi sử dụng đúng chuẩn các công cụ như Mutex hay Spinlock, lập trình viên ứng dụng không cần tự tay chèn memory barrier; chỉ khi tự xây dựng các cấu trúc dữ liệu lock-free, viết driver, hoặc can thiệp sâu vào kernel thì mới cần làm việc trực tiếp với memory barrier.

Một lưu ý chuyên sâu: Acquire và Release là các đảm bảo tối thiểu một chiều; việc kết hợp cả hai không đồng nghĩa với việc tạo ra một Full Memory Barrier hai chiều hoàn chỉnh trong mọi tình huống. Code nghiệp vụ thông thường không cần bận tâm chi tiết này, nhưng nếu bạn làm việc với hàng đợi lock-free, RCU, driver hoặc bộ nhớ MMIO, sự khác biệt này là không thể xem nhẹ.

## Nghịch đảo độ ưu tiên (Priority Inversion): Khóa tác động tới việc lập lịch

Khóa cũng kéo theo những vấn đề phức tạp trong việc lập lịch CPU.

Hiện tượng kinh điển nhất là **nghịch đảo độ ưu tiên (Priority Inversion)**: Giả sử thread L có độ ưu tiên thấp đang giữ một khóa chung. Thread H có độ ưu tiên cao cần khóa này nên bị chặn lại chờ L. Đúng lúc đó, một thread M có độ ưu tiên trung bình xuất hiện và chiếm lấy CPU để chạy liên tục vì độ ưu tiên của M cao hơn L. Kết quả là thread H dù có độ ưu tiên cao nhất hệ thống lại bị kẹt vô thời hạn, không thể chạy vì phải đợi L, trong khi L lại bị M đè bẹp.

Giải pháp kinh điển cho vấn đề này là **thừa kế độ ưu tiên (Priority Inheritance)**: Thread L có độ ưu tiên thấp trong thời gian giữ khóa sẽ tạm thời được nâng độ ưu tiên lên bằng độ ưu tiên cao nhất trong số các thread đang chờ khóa đó (chính là H). Nhờ vậy, L có thể chạy nhanh qua miền găng mà không bị thread trung bình M cướp quyền, nhanh chóng giải phóng khóa để H vào thực thi.

Thuộc tính giao thức của POSIX Mutex hỗ trợ các cờ `PTHREAD_PRIO_INHERIT` và `PTHREAD_PRIO_PROTECT`. Trong Linux kernel, cấu trúc `rt_mutex` được thiết kế chuyên biệt xoay quanh Priority Inheritance để phục vụ PI-futex và các pthread mutex thời gian thực.

Điều này giải thích tại sao việc Semaphore không có chủ sở hữu (no owner) lại là một bất lợi lớn: do không biết ai đang thực sự giữ quyền, hệ thống không thể biết cần nâng độ ưu tiên của ai; tài liệu Linux kernel nhấn mạnh rằng Semaphore dưới PREEMPT_RT không thể hỗ trợ thừa kế độ ưu tiên, và việc bị chặn trên Semaphore có thể gây ra nghịch đảo độ ưu tiên không thể kiểm soát.

## Sự khác biệt giữa Khóa ở User Space và Khóa trong Kernel

Chương trình ở user space chủ yếu quan tâm đến việc các thread phối hợp với nhau thế nào. Pthreads cung cấp Mutex, Condition Variable, Semaphore; các ngôn ngữ như C++, Java, Go, Rust đóng gói thành các công cụ đồng bộ thân thiện hơn ở tầng runtime.

Trong khi đó, khóa trong kernel chịu thêm vô số ràng buộc về ngữ cảnh thực thi (execution context). Mã nguồn kernel có thể chạy trong ngữ cảnh tiến trình thông thường (process context), hoặc chạy trong ngữ cảnh ngắt phần cứng (interrupt context / top half), ngắt mềm (softirq / bottom half), hoặc các vùng không được phép chiếm quyền (non-preemptible). Một số ngữ cảnh được phép đi ngủ, nhưng một số ngữ cảnh tuyệt đối cấm ngủ; một số khóa khi nắm giữ sẽ vô hiệu hóa preemption hoặc ngắt; và kernel thời gian thực còn phải kiểm soát chặt chẽ hiện tượng nghịch đảo độ ưu tiên cùng độ trễ lập lịch.

Do đó, khi phân tích khóa trong kernel, bạn cần tự đặt ra các câu hỏi:

- Ngữ cảnh hiện tại có được phép ngủ hay không?
- Trong thời gian giữ khóa có thể bị chiếm quyền hay không?
- Khóa này có nguy cơ bị trình xử lý ngắt gọi lặp lại (re-entrant) hay không?
- Nó đang bảo vệ dữ liệu riêng của từng CPU (per-CPU) hay dữ liệu dùng chung giữa các CPU?
- Hệ thống đang chạy kernel thông thường hay PREEMPT_RT?
- Có cần cơ chế thừa kế độ ưu tiên để kiểm soát độ trễ thời gian thực hay không?

![Sơ đồ khác biệt về ngữ cảnh giữa khóa user space và khóa kernel: User space tập trung vào phối hợp giữa các thread; kernel space phải phán đoán thêm việc có được ngủ, có bị chiếm quyền, có nằm trên luồng xử lý ngắt và có chia sẻ giữa các CPU hay không](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/os-lock-kernel-context-85016b1b.png)

Một số nguyên tắc cốt lõi cần nhớ:
- Các loại sleeping lock như `mutex` cho phép tác vụ đi ngủ, phù hợp cho miền găng tương đối dài, nhưng tuyệt đối không được dùng trong ngữ cảnh ngắt.
- `spinlock` dành riêng cho các đoạn mã kernel cực ngắn và không được phép ngủ; trong lúc giữ spinlock, tuyệt đối không được gọi bất kỳ hàm nào có khả năng gây ngủ hoặc chặn luồng.
- `rw_semaphore` và `rwlock` phục vụ mô hình nhiều đọc một ghi, nhưng tính công bằng và ngữ nghĩa thời gian thực phụ thuộc nhiều vào cấu hình kernel.
- Local lock, tắt preemption, tắt ngắt cục bộ chỉ bảo vệ dữ liệu trên CPU hiện tại, không thể thay thế cho khóa liên CPU trên hệ thống đa nhân.

Tài liệu Linux Kernel locking mô tả các quy tắc này rất chi tiết, đặc biệt là sự biến đổi của khóa dưới PREEMPT_RT. Lập trình viên ứng dụng không cần học thuộc lòng từng chi tiết nhỏ của kernel, nhưng cần thấu hiểu bản chất: khóa kernel không thể chỉ nhìn qua tên gọi "mutex/rwlock/spinlock", mà nó gắn chặt với câu hỏi liệu ngữ cảnh thực thi hiện tại có được ngủ, có bị chiếm quyền hay có được nhận ngắt hay không.

## Tiêu chí lựa chọn nguyên thủy đồng bộ

- **Bảo vệ một đoạn cập nhật trạng thái dùng chung**: Hãy ưu tiên cân nhắc **Mutex**. Nó mang ngữ nghĩa rõ ràng, cho phép ngủ khi chờ đợi, và đáp ứng hoàn hảo phần lớn các miền găng ở user space.
- **Giới hạn số lượng truy cập tài nguyên đồng thời**: Dùng **Semaphore**. Ví dụ: tối đa 10 tác vụ download chạy song song, connection pool tối đa 50 kết nối. Trọng tâm bài toán là "số lượng hạn ngạch", không phải ai được vào cửa trước.
- **Thread cần chờ một trạng thái nào đó biến đổi**: Dùng **Condition Variable**. Ví dụ: hàng đợi từ rỗng thành có phần tử, tác vụ từ chưa xong thành đã xong, bộ đệm từ đầy thành còn chỗ trống. Nhớ lưu trữ trạng thái trong biến dùng chung, bảo vệ bằng Mutex và luôn kiểm tra trong vòng lặp `while`.
- **Bảo vệ luồng thực thi cực ngắn trong kernel không được phép ngủ**: Dùng **Spinlock**. Trong code nghiệp vụ ở user space, việc để thread tự xoay trong thời gian dài hầu như luôn là một thiết kế tồi.
- **Tự phát triển runtime ngôn ngữ, thư viện thread hoặc bộ đồng bộ hiệu năng cao**: Lúc này các cơ chế như **Futex** mới cần được trực tiếp sử dụng. Code ứng dụng thông thường luôn nên dùng các thư viện chuẩn đã được kiểm chứng thay vì tự gọi system call futex.

Những tiêu chí này cũng giải thích vì sao tài liệu Java lại đặt `synchronized`, `ReentrantLock`, AQS và CAS trong một bức tranh tổng thể. Lập trình viên Java làm việc với các tầng trừu tượng cấp ngôn ngữ; còn hệ điều hành bên dưới đối mặt trực tiếp với việc lập lịch thread, đánh thức, chỉ lệnh nguyên tử CPU và các ràng buộc ngữ cảnh kernel.

## Các sai lầm thường gặp

1. **Coi khóa là nút bật tắt hiệu năng.** Khóa sinh ra trước hết để bảo vệ tính chính xác, sau đó mới bàn đến hiệu năng. Nếu trạng thái dùng chung bị ghi đè sai lệch, việc bỏ bớt một cái khóa chỉ đơn thuần là trao số phận của bug cho sự ngẫu nhiên của bộ lập lịch.
2. **Dùng câu lệnh `if` để chờ Condition Variable.** Việc biến điều kiện được đánh thức không đồng nghĩa với việc điều kiện nghiệp vụ đã thỏa mãn. Sau khi tỉnh dậy, bắt buộc phải kiểm tra lại điều kiện trong vòng lặp `while` để phòng tránh hiện tượng thức giấc giả (spurious wakeup) và tranh chấp giữa các thread cùng thức dậy.
3. **Coi Semaphore là chiếc khóa vạn năng.** Semaphore có thể làm được nhiều việc, nhưng chính vì thế nó rất dễ làm mất ngữ nghĩa của code. Chỉ cần loại trừ tương hỗ thì hãy dùng Mutex; chỉ chờ sự kiện một lần thì dùng Completion; khi cần đếm tài nguyên hạn ngạch mới dùng Semaphore.
4. **Thực hiện các thao tác chậm chạp bên trong miền găng.** Truy cập đĩa cứng, gửi request qua mạng, hay chờ phản hồi từ hệ thống bên ngoài trong lúc đang giữ khóa sẽ kéo dài miền găng một cách tai hại. Số lượng thread càng tăng, tranh chấp khóa sẽ càng khuếch đại thành thảm họa sụt giảm throughput, tích tụ hàng đợi và nguy cơ deadlock.
5. **Bỏ qua thứ tự lấy khóa.** Hai thread lấy khóa theo thứ tự chéo nhau (`A -> B` và `B -> A`) rất dễ hình thành chu trình chờ đợi khép kín dẫn tới Deadlock. Hệ điều hành, cơ sở dữ liệu hay Java Thread đều đối mặt với đúng một bản chất này. Để hiểu cặn kẽ, hãy xem tiếp bài [Phân tích chi tiết về Deadlock](./dead-lock.md).

## Tổng kết

Khóa trong hệ điều hành không thể chỉ hiểu một cách đơn lẻ qua từng hàm API. Nó là một tập hợp các cơ chế đồng bộ được thiết kế xoay quanh trạng thái dùng chung, điều kiện chờ đợi, số lượng tài nguyên và ngữ cảnh lập lịch của CPU.

- **Mutex** chịu trách nhiệm loại trừ tương hỗ với cơ chế ngủ chờ.
- **Spinlock** đánh đổi việc bận chờ trên CPU để tránh chi phí chuyển đổi ngữ cảnh.
- **Semaphore** chịu trách nhiệm đếm tài nguyên và giới hạn lưu lượng đồng thời.
- **Condition Variable** giúp thread đi ngủ một cách an toàn khi điều kiện chưa thỏa mãn.
- **Futex** kết nối hoàn hảo giữa thao tác nguyên tử siêu nhanh ở user space và hàng đợi ngủ chặn của kernel.

Tất cả các cơ chế này nhìn bề ngoài đều liên quan đến chữ "chờ", nhưng đối tượng mà chúng thực sự chờ đợi lại hoàn toàn khác nhau: có cơ chế chờ vào miền găng, có cơ chế chờ số lượng tài nguyên, có cơ chế chờ trạng thái biến đổi, và có cơ chế chờ kernel xếp mình trở lại hàng đợi sẵn sàng thực thi.

Khi học về khóa trong Java, rất nhiều chi tiết tầng dưới đã được JVM và thư viện chuẩn che giấu; nhưng khi quay trở lại tầng hệ điều hành, mấu chốt sẽ quy về những câu hỏi rất thực tế: Khi nào thread nên ngủ? Khi nào có thể tự xoay? Ai chịu trách nhiệm đánh thức? Đoạn code nào không được phép bị cướp quyền? Và ngữ cảnh nào tuyệt đối không được phép chặn luồng?

## Tài liệu tham khảo

- [OSTEP: Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf)
- [OSTEP: Condition Variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf)
- [OSTEP: Semaphores](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf)
- [POSIX Programmer's Manual: pthread_mutex_lock](https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html)
- [POSIX Programmer's Manual: pthread_cond_wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)
- [POSIX Programmer's Manual: pthread_mutexattr_getprotocol](https://man7.org/linux/man-pages/man3/pthread_mutexattr_getprotocol.3p.html)
- [Linux man-pages: sem_wait](https://man7.org/linux/man-pages/man3/sem_wait.3.html)
- [Linux man-pages: futex](https://man7.org/linux/man-pages/man2/futex.2.html)
- [Linux Kernel Documentation: Lock types and their rules](https://docs.kernel.org/locking/locktypes.html)
- [Linux Kernel Documentation: Memory Barriers](https://www.kernel.org/doc/Documentation/memory-barriers.txt)
- [Linux Kernel Documentation: RT-mutex subsystem with PI support](https://docs.kernel.org/locking/rt-mutex.html)
