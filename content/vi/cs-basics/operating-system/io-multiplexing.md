---
title: "Giải mã I/O Đa đường (I/O Multiplexing): Nguyên lý và So sánh select, poll, epoll"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về I/O Multiplexing, bắt đầu từ hai giai đoạn của thao tác đọc mạng, bóc tách chi tiết nguyên lý hiện thực, cấu trúc dữ liệu, khác biệt hiệu năng, chế độ kích hoạt LT/ET của select, poll, epoll, cùng ứng dụng thực chiến trong Redis, Nginx, Java NIO và Netty."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Lập trình mạng
  - Linux
head:
  - - meta
    - name: keywords
      content: I/O đa đường,IO Multiplexing,select,poll,epoll,Linux epoll,LT,ET,Java NIO,Netty,Redis,Nginx,câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/io-multiplexing.md
---

Khi viết một TCP Server, cách viết trực quan và tự nhiên nhất là: Thread chính gọi `accept()` một kết nối đến, lập tức đẩy kết nối đó cho một Thread mới để thực hiện `read()`, xử lý nghiệp vụ rồi `write()` trả về. Khi số lượng kết nối ít, mô hình này chạy rất mượt mà.

Thế nhưng ngay khi số lượng kết nối đồng thời vọt lên hàng chục nghìn, rắc rối sẽ lập tức ập tới. Trong không ít bản phân phối Linux, mỗi Thread mới mặc định sẽ được cấp trước vài MB không gian Stack, cấu hình phổ biến là 8 MB (giá trị thực tế tùy thuộc vào `ulimit -s`, thư viện runtime và thuộc tính Thread). Một vạn kết nối đồng nghĩa với việc dù các trang nhớ của Stack có được cấp phát theo nhu cầu đi chăng nữa, thì không gian địa chỉ đặt trước, các trang Stack thực sự sử dụng cộng với metadata của Thread dồn lại vẫn là một lượng bộ nhớ vô cùng lớn; nguy hiểm hơn nữa là hàng nghìn, hàng vạn Thread cùng chen chúc nhau trên một số ít CPU Core, chỉ riêng chi phí chuyển đổi ngữ cảnh (Context Switch) giữa các Thread đã gặm nhấm gần hết tài nguyên CPU, thời gian thực sự dùng để xử lý logic nghiệp vụ chẳng còn lại bao nhiêu. Đó là còn chưa kể phần lớn các kết nối thực chất đều đang ở trạng thái rảnh rỗi (idle) — mỗi kết nối chiếm trọn một Thread chỉ để nằm im chờ đợi dữ liệu tới.

Đó chính là bài toán kinh điển **C10K**: **Làm sao để một (hoặc một số ít) Thread có thể đồng thời theo dõi hàng vạn kết nối, kết nối nào có dữ liệu đến thì mới xử lý kết nối đó?**

Câu trả lời chính là **I/O Đa đường (I/O Multiplexing)**.

Dưới đây chúng ta sẽ lần lượt tìm hiểu theo thứ tự `select`, `poll`, `epoll`. Cả ba cùng giải quyết một bài toán, nhưng thế hệ sau luôn thông minh và tinh tế hơn thế hệ trước.

## I/O Multiplexing là gì?

Để giải thích cặn kẽ, trước hết bạn cần nắm rõ một thao tác đọc mạng (Network Read) bên trong Kernel thực chất được chia làm hai giai đoạn:

1. **Chờ dữ liệu sẵn sàng (Wait for data ready)**: Dữ liệu vẫn đang trên đường truyền mạng hoặc vừa cập bến card mạng (NIC); Kernel phải chờ các gói tin đến đủ và sao chép vào bộ đệm nhận (receive buffer) của Kernel. Giai đoạn này thường rất chậm.
2. **Sao chép dữ liệu (Copy data)**: Dữ liệu đã nằm gọn trong bộ đệm Kernel, sau đó được sao chép từ Kernel Space sang bộ đệm ứng dụng ở User Space. Giai đoạn này diễn ra rất nhanh.

![Hai giai đoạn trong thao tác đọc mạng: Chờ dữ liệu từ card mạng vào bộ đệm Kernel, sau đó qua copy_to_user sao chép sang bộ đệm người dùng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-io-two-phases-4cdb6dd8.png)

Mô hình Blocking truyền thống theo kiểu "mỗi kết nối một Thread" gặp bế tắc chính ở Giai đoạn 1: Thread gọi hàm `recv()` xong thì bị kẹt cứng (block) ở đó, dành riêng toàn bộ thời gian chỉ để chờ dữ liệu của một kết nối duy nhất, trong lúc chờ thì không thể làm thêm bất cứ việc gì khác.

I/O Multiplexing đổi sang một hướng tiếp cận khác: giao toàn bộ các file descriptor (fd - bộ mô tả file) cần theo dõi cho Kernel, và cho Thread chặn (block) tại một lời gọi hệ thống (system call) giám sát chuyên trách. Chỉ cần trong nhóm fd này có bất kỳ một fd nào sẵn sàng (sẵn sàng đọc hoặc sẵn sàng ghi), lời gọi này sẽ lập tức trả về, báo cho bạn biết chính xác fd nào đã sẵn sàng, sau đó bạn mới tiến hành xử lý các fd đó.

Hãy liên tưởng tới một ví dụ thực tế: Một người phục vụ bàn quản lý cùng lúc mười bàn ăn. Thay vì đứng chết trân ở bàn số một chờ khách nghĩ xem gọi món gì, người phục vụ đứng bao quát cả phòng, bàn nào giơ tay gọi thì mới tiến lại phục vụ bàn đó.

**Đa đường (Multi-path / Multiplexing)** ám chỉ việc xử lý nhiều kết nối cùng lúc; **Tái sử dụng (Reuse)** ám chỉ việc tái sử dụng cùng một Thread duy nhất để điều phối tất cả các kết nối đó.

Xin lưu ý một điểm rất dễ gây nhầm lẫn: Bản thân I/O Multiplexing vẫn thuộc về mô hình **I/O Đồng bộ (Synchronous I/O)**. Các lời gọi như `select` chỉ làm nhiệm vụ thông báo rằng fd đã sẵn sàng; ứng dụng sau đó vẫn phải chủ động tự gọi lệnh `recv()` hoặc `read()` để hoàn tất việc đọc dữ liệu. Đồng bộ không đồng nghĩa với việc bị chặn: thao tác `recv()` lần này có phải chờ đợi hay không còn tùy thuộc vào việc socket có được gắn cờ non-blocking hay không và trạng thái dữ liệu có bị biến động trước khi đọc hay không. Các Event Loop hiệu năng cao luôn kết hợp I/O Multiplexing cùng các file descriptor non-blocking.

## Vị trí của I/O Multiplexing trong 5 Mô hình I/O

Cuốn sách kinh điển *UNIX Network Programming* (UNP) của W. Richard Stevens đã phân loại I/O trên Unix thành 5 mô hình. Định vị rõ I/O Multiplexing nằm ở đâu sẽ giúp bạn có cái nhìn sáng tỏ hơn rất nhiều:

- **Blocking I/O (I/O chặn)**: Sau khi gọi `recv()`, Thread ngủ li bì suốt cả hai giai đoạn: chờ dữ liệu sẵn sàng và sao chép dữ liệu. Đơn giản nhất, nhưng lãng phí Thread nhất.
- **Non-blocking I/O (I/O không chặn)**: Gọi `recv()` mà chưa có dữ liệu sẽ lập tức trả về mã lỗi `EWOULDBLOCK`. Thread không ngủ, nhưng ứng dụng phải liên tục dùng vòng lặp bận (busy loop) để hỏi "xong chưa", gây quay cuồng và thiêu đốt CPU vô ích.
- **I/O Multiplexing (I/O đa đường)**: Thread bị chặn trên lời gọi `select`/`poll`/`epoll`, một Thread cùng lúc chờ nhiều fd, fd nào sẵn sàng thì xử lý fd đó. Đây chính là nhân vật chính của bài viết này.
- **Signal-driven I/O (I/O hướng tín hiệu)**: Đăng ký cờ `SIGIO`, khi dữ liệu sẵn sàng thì Kernel sẽ gửi tín hiệu thông báo cho ứng dụng, bình thường Thread vẫn tự do làm việc khác. Mô hình này ít khi được dùng trong thực tế.
- **Asynchronous I/O (AIO - I/O bất đồng bộ)**: Sau khi gửi yêu cầu I/O thì lập tức trả về; Kernel tự động xử lý cả việc chờ dữ liệu lẫn sao chép dữ liệu, sau khi hoàn tất trọn vẹn mới thông báo cho ứng dụng. Ở đây đang mô tả mô hình ngữ nghĩa; việc hiện thực cụ thể còn tùy thuộc vào hệ điều hành và API; chẳng hạn chuẩn POSIX `aio_read` trên Linux glibc chủ yếu do các worker thread ở User Space hiện thực, không thể đánh đồng trực tiếp với AIO gốc trong nhân Kernel.

![So sánh 5 mô hình I/O: Blocking I/O, Non-blocking I/O, I/O Multiplexing, Signal-driven I/O và Asynchronous I/O](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-five-io-models-4f34464f.png)

Điểm khác biệt mấu chốt nằm ở chỗ: **Ai là người thực hiện hành động "chuyển dữ liệu từ bộ đệm Kernel sang bộ đệm User Space"?** Trong 4 mô hình đầu tiên, cuối cùng ứng dụng vẫn phải tự mình chủ động gọi `read()`/`recv()` để thực hiện lần sao chép này, sau khi lời gọi hàm trả về thì ứng dụng mới có dữ liệu để dùng, vì thế tất cả chúng đều được xếp vào nhóm **Đồng bộ (Synchronous)** (việc lời gọi này có thực sự bị ngủ hay không phụ thuộc vào cờ non-blocking và trạng thái dữ liệu lúc đó); chỉ có I/O Bất đồng bộ (AIO) mới giao cả việc chờ lẫn việc sao chép cho Kernel, làm xong xuôi hết mới báo cho bạn. Giá trị cốt lõi của I/O Multiplexing không nằm ở việc làm cho một lần đọc dữ liệu chạy nhanh hơn, mà nằm ở việc cho phép một Thread duy nhất có thể dàn trải chi phí "chờ đợi" ra cho hàng nghìn kết nối cùng lúc.

## select hoạt động như thế nào?

`select` là phương án hiện thực ra đời sớm nhất và hầu như mọi nền tảng hệ điều hành đều hỗ trợ nó. Chữ ký hàm của nó như sau:

```c
#include <sys/select.h>

int select(int nfds, fd_set *readfds, fd_set *writefds,
           fd_set *exceptfds, struct timeval *timeout);
```

Cấu trúc dữ liệu trung tâm là `fd_set`, bản chất là một **mảng bit (bitmap)**: mỗi bit tương ứng với một fd, bit nào được gán giá trị 1 nghĩa là chúng ta đang quan tâm tới fd đó. Đi kèm với nó là 4 macro chuyên dụng để thao tác:

```c
void FD_ZERO(fd_set *set);          // Xóa trắng toàn bộ các bit về 0
void FD_SET(int fd, fd_set *set);   // Gán bit tương ứng với fd lên 1
void FD_CLR(int fd, fd_set *set);   // Đặt lại bit tương ứng với fd về 0
int  FD_ISSET(int fd, fd_set *set); // Kiểm tra xem bit của fd có bằng 1 hay không
```

Vòng lặp chính của một Echo Server viết bằng `select` có dạng đại thể như sau:

```c
fd_set rset;
int maxfd = listenfd;

while (1) {
    FD_ZERO(&rset);                       // Mỗi vòng lặp đều phải xóa trắng lại từ đầu
    FD_SET(listenfd, &rset);              // Rồi lại nhét từng fd đang quan tâm vào
    for (int i = 0; i < n; i++)
        if (conns[i] >= 0) FD_SET(conns[i], &rset);

    // Tập ghi và tập ngoại lệ không quan tâm thì truyền NULL; NULL ở cuối nghĩa là chặn vô hạn
    int ready = select(maxfd + 1, &rset, NULL, NULL, NULL);

    if (FD_ISSET(listenfd, &rset)) {      // Listener fd sẵn sàng, có kết nối mới
        int connfd = accept(listenfd, NULL, NULL);
        // Lưu vào conns[], cập nhật maxfd
    }
    for (int i = 0; i < n; i++)           // O(N) duyệt từng fd để hỏi: Bạn đã sẵn sàng chưa?
        if (conns[i] >= 0 && FD_ISSET(conns[i], &rset)) {
            // Xử lý sự kiện đọc trên kết nối này
        }
}
```

Đoạn mã trên ẩn chứa những vết thương chí mạng của `select`. Hiểu rõ chúng thì bạn mới hiểu được poll và epoll sinh ra để cải tiến điều gì.

**Thứ nhất, số lượng fd bị giới hạn cứng.** Trong môi trường Linux/glibc, kích thước mảng bit `fd_set` do hằng số `FD_SETSIZE` của glibc quy định, mặc định là 1024, và chỉ có thể đại diện an toàn cho các fd có giá trị từ 0 đến 1023 — giới hạn này xuất phát từ cấu trúc dữ liệu kích thước cố định ở User Space của glibc và các macro `FD_*`, chứ không phải từ bản thân nhân Linux. Việc áp dụng các macro này cho các fd nằm ngoài phạm vi nói trên sẽ dẫn đến hành vi không xác định (undefined behavior), và bạn cũng đừng mong định nghĩa lại `FD_SETSIZE` hay biên dịch lại Kernel để lách luật. Muốn theo dõi nhiều kết nối hơn, cách làm chuẩn xác là chuyển sang dùng `poll` hoặc `epoll`.

**Thứ hai, mỗi lần gọi hàm đều phải sao chép toàn bộ mảng bit qua lại giữa User Space và Kernel Space.** Trước khi gọi, bạn điền mảng bit ở User Space, `select` sao chép nó vào Kernel; khi trả về, Kernel sửa đổi trực tiếp mảng bit (xóa các bit của các fd chưa sẵn sàng) rồi sao chép ngược lại User Space. Phạm vi Kernel thực sự kiểm tra và ghi trả do tham số `nfds` quyết định, do đó số hiệu fd càng lớn, lượng fd theo dõi càng nhiều thì chi phí sao chép qua lại này càng đắt đỏ.

**Thứ ba, mảng bit là tham số "vừa vào vừa ra" (value-result parameter).** Khi Kernel trả về, nó sẽ xóa các bit chưa sẵn sàng về 0, vì vậy sang vòng lặp tiếp theo bạn bắt buộc phải gọi `FD_ZERO` rồi `FD_SET` lại toàn bộ danh sách quan tâm từ đầu. Câu lệnh "mỗi vòng lặp đều phải xóa trắng lại" trong code chính là bị ép buộc bởi đặc tính này.

**Thứ tư, khi trả về ứng dụng vẫn phải tự mình duyệt tuyến tính $O(N)$.** Giá trị trả về của `select` chỉ cho biết số lượng fd đã sẵn sàng, còn cụ thể fd nào sẵn sàng thì lại nằm rải rác trong `fd_set` vừa bị ghi đè. Ứng dụng vẫn buộc phải duyệt qua toàn bộ dải ứng viên và gọi `FD_ISSET`; một vạn kết nối dù chỉ có đúng một kết nối có dữ liệu thì bạn vẫn có thể phải duyệt kiểm tra đủ cả một vạn lần.

Tham số `timeout` thì khá linh hoạt: truyền `NULL` sẽ chặn vô hạn; truyền struct `timeval` với giá trị 0 nghĩa là không chờ mà trả về ngay lập tức (thăm dò - polling); truyền giá trị cụ thể biểu thị thời gian chờ tối đa.

## poll đã cải tiến những gì?

`poll` là sản phẩm cùng thời với `select`, tư tưởng thiết kế tương tự nhưng đã thay thế cấu trúc dữ liệu bên dưới. Nó không dùng mảng bit nữa mà chuyển sang dùng một mảng các struct `pollfd`:

```c
#include <poll.h>

struct pollfd {
    int   fd;       // File descriptor cần theo dõi
    short events;   // Sự kiện bạn quan tâm, điền trước khi gọi, ví dụ POLLIN (sẵn sàng đọc)
    short revents;  // Sự kiện thực tế phát sinh, do Kernel điền trả về
};

int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

Vòng lặp chính có dạng:

```c
struct pollfd fds[MAX];
fds[0].fd = listenfd;
fds[0].events = POLLIN;
// Các phần tử còn lại: fds[i].fd = connfd; fds[i].events = POLLIN;

while (1) {
    int ready = poll(fds, nfds, -1);      // timeout truyền -1 biểu thị chặn vô hạn
    for (int i = 0; i < nfds; i++) {
        if (fds[i].revents & POLLIN) {    // Kernel ghi kết quả vào revents
            // Xử lý sự kiện đọc
        }
    }
}
```

So với `select`, `poll` đã sửa đúng được hai điểm nghẽn:

**Không còn giới hạn cứng 1024.** Bạn muốn theo dõi bao nhiêu fd phụ thuộc vào kích thước mảng bạn cấp phát và truyền vào, không còn bị trói buộc bởi `FD_SETSIZE`. Giới hạn thực tế chủ yếu phụ thuộc vào số lượng fd tối đa mà Process được phép mở (`RLIMIT_NOFILE`).

**Tách rời sự kiện quan tâm và sự kiện thực tế phát sinh.** Trường `events` là do bạn điền (đầu vào), còn `revents` là do Kernel điền trả về (đầu ra), hai trường này hoạt động độc lập. Nhờ đó sang vòng lặp tiếp theo, bạn không cần phải reset lại toàn bộ danh sách quan tâm như `select`, trường `events` cứ giữ nguyên mà dùng tiếp.

Tuy vậy, `poll` vẫn chưa thể giải quyết được hai vấn đề hiệu năng nhức nhối nhất của `select`: Mỗi lần gọi vẫn phải sao chép toàn bộ mảng dữ liệu từ User Space sang Kernel Space, và khi trả về ứng dụng vẫn phải duyệt tuyến tính $O(N)$ toàn bộ mảng để mò ra xem fd nào đã sẵn sàng. Khi quy mô kết nối phình to, chi phí vẫn tăng tuyến tính.

Nói một cách sòng phẳng, `poll` chỉ làm sạch giao diện của `select`, chứ mô hình hiệu năng bên dưới không hề thay đổi. Bước nhảy vọt về chất thực sự chỉ đến khi có `epoll`.

## Vì sao epoll là một cuộc cách mạng về chất?

`epoll` là cơ chế độc quyền của riêng Linux, do kỹ sư Davide Libenzi thiết kế và hiện thực, được đưa vào từ nhân Linux **2.5.44**, và glibc 2.3.2 bắt đầu cung cấp hàm bao gói. Nó đã tách lời gọi hệ thống "một hàm ôm trọn tất cả" thành ba hàm chuyên biệt, mỗi hàm chịu một trách nhiệm riêng:

```c
#include <sys/epoll.h>

int epoll_create1(int flags);  // Khởi tạo một thực thể epoll, trả về một fd (thay thế giao diện cũ epoll_create(int size))
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);  // Thêm, sửa, xóa fd cần theo dõi
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);  // Chờ sự kiện sẵn sàng
```

Trong đó, tham số `op` của `epoll_ctl` gồm có 3 thao tác: `EPOLL_CTL_ADD` (đăng ký mới), `EPOLL_CTL_MOD` (sửa đổi sự kiện), `EPOLL_CTL_DEL` (hủy theo dõi). Sự kiện được mô tả bằng struct `epoll_event`:

```c
typedef union epoll_data {
    void     *ptr;
    int       fd;
    uint32_t  u32;
    uint64_t  u64;
} epoll_data_t;

struct epoll_event {
    uint32_t     events;   // Loại sự kiện, như EPOLLIN, EPOLLOUT, EPOLLET
    epoll_data_t data;     // Dữ liệu người dùng, epoll_wait trả về nguyên vẹn, thường dùng để lưu fd
};
```

Một quy trình sử dụng hoàn chỉnh diễn ra như sau:

```c
int epfd = epoll_create1(0);              // Bước 1: Khởi tạo thực thể epoll

struct epoll_event ev;
ev.events = EPOLLIN;                       // Quan tâm sự kiện sẵn sàng đọc, mặc định Level Triggered
ev.data.fd = listenfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, listenfd, &ev);  // Bước 2: Đăng ký một lần là đủ

struct epoll_event events[MAX_EVENTS];
while (1) {
    // Bước 3: Chỉ trả về những fd THỰC SỰ đã sẵn sàng, n là số lượng sự kiện sẵn sàng
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    for (int i = 0; i < n; i++) {          // Chỉ duyệt qua các sự kiện sẵn sàng, không quét toàn bộ
        int fd = events[i].data.fd;
        if (fd == listenfd) {
            int connfd = accept(listenfd, NULL, NULL);
            ev.events = EPOLLIN;
            ev.data.fd = connfd;
            epoll_ctl(epfd, EPOLL_CTL_ADD, connfd, &ev);  // Đăng ký kết nối mới vào
        } else {
            // Xử lý sự kiện đọc trên fd này
        }
    }
}
```

Đối chiếu với đoạn mã `select` ban nãy, sự khác biệt đập ngay vào mắt: việc đăng ký fd và chờ đợi sự kiện đã được tách rời hoàn toàn; mảng `events` do `epoll_wait` trả về **chứa toàn bộ là các fd đã sẵn sàng**, chỉ cần duyệt đúng mảng này là xong, không bao giờ phải đem toàn bộ các fd ra tra hỏi từng cái một nữa.

Sự khác biệt mang tính bước ngoặt này không phải là mẹo vặt trong thiết kế giao diện, mà là do cấu trúc dữ liệu bên dưới Kernel đã được thay máu toàn diện. Một thực thể epoll bên trong Kernel tương ứng với một cấu trúc `struct eventpoll`, bên trong chứa hai thành phần cốt lõi:

- **Một Cây đỏ-đen (Red-Black Tree - `rbr`)**: Lưu trữ toàn bộ các fd được đăng ký vào thông qua `epoll_ctl` (mỗi fd tương ứng với một node `epitem`). Việc thêm, sửa, xóa là các thao tác trên cây có độ phức tạp $O(\log N)$. fd chỉ cần đăng ký vào đây một lần duy nhất và nằm cố định ở đó, không giống như select/poll cứ mỗi lần gọi hàm là phải bê nguyên toàn bộ danh sách nhét vào Kernel.
- **Một Danh sách sẵn sàng (Ready List - `rdllist`)**: Một danh sách liên kết đôi, chuyên lưu trữ các fd "đã thực sự sẵn sàng".

![Kiến trúc nội bộ của epoll: epoll_ctl duy trì interest list, khi fd sẵn sàng sẽ qua callback vào ready list, epoll_wait trả về các sự kiện sẵn sàng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-epoll-architecture-3236afce.png)

Chìa khóa nằm ở **cơ chế Callback**. Khi gọi `epoll_ctl` để đăng ký fd, Kernel sẽ gắn một hàm callback vào hàng đợi chờ của fd đó. Khi card mạng nhận được dữ liệu và socket trở nên sẵn sàng đọc, hàm callback này được kích hoạt tự động, đưa đối tượng sẵn sàng tương ứng vào Danh sách sẵn sàng, đồng thời đánh thức Thread đang ngủ trong `epoll_wait`. Lúc này công việc duy nhất của `epoll_wait` chỉ là liếc nhìn xem Danh sách sẵn sàng có trống hay không — nếu có thì sao chép các sự kiện đó sang User Space, nếu không thì ngủ tiếp chờ callback đánh thức. (Lưu ý: Cây đỏ-đen và danh sách liên kết là cách cài đặt hiện tại của Kernel; giao diện `epoll` cam kết với User Space là ngữ nghĩa trừu tượng "tập đăng ký + danh sách sẵn sàng", đừng coi cấu trúc cây là một ABI bất biến.)

Đó chính là cội nguồn sức mạnh của epoll: Trong các kịch bản kết nối khổng lồ nhưng số lượng hoạt động tích cực thấp, những gì `epoll_wait` cần duyệt chỉ là các sự kiện đã sẵn sàng trong đợt đó, hoàn toàn độc lập với "tổng số lượng fd đã đăng ký". Đăng ký mười vạn kết nối mà chỉ có 3 kết nối có dữ liệu tới, `epoll_wait` chỉ cần xử lý đúng 3 kết nối đó, không bao giờ phải quét qua toàn bộ mười vạn kết nối như select/poll. Tuy nhiên cũng cần nhấn mạnh: Chi phí tổng thể của epoll không chỉ có lúc `epoll_wait` trả về — các thao tác sửa đổi đăng ký (`epoll_ctl`), gọi hàm callback, tranh chấp khóa đồng thời và sao chép sự kiện về User Space đều tốn chi phí; khi tỷ lệ kết nối hoạt động tích cực tiệm cận 100%, lợi thế của nó so với select/poll cũng sẽ thu hẹp lại. Tóm lại một câu: select và poll mỗi lần chờ đều phải nộp toàn bộ danh sách cho Kernel và quét tuyến tính; epoll giữ danh sách theo dõi lâu dài trong Kernel, lúc chờ chỉ lấy ra các sự kiện đã sẵn sàng, do đó cực kỳ phù hợp cho kịch bản lượng fd cực lớn nhưng lượng kết nối tích cực ít.

Việc sao chép dữ liệu cũng được cắt giảm tối đa. fd thông qua `epoll_ctl` đăng ký một lần duy nhất trên Cây đỏ-đen, sau đó gọi `epoll_wait` lặp đi lặp lại hàng triệu lần cũng không cần phải truyền lại danh sách fd nữa.

Ở đây cần đính chính một lời đồn đại cực kỳ phổ biến nhưng hoàn toàn sai lầm: *"epoll sở dĩ nhanh là vì nó dùng mmap để chia sẻ bộ nhớ giữa Kernel và User Space, giúp loại bỏ thao tác sao chép."* **Khẳng định này là sai hoàn toàn.** Lật mở mã nguồn Kernel của epoll, bạn sẽ thấy rõ mười mươi rằng khi `epoll_wait` trả về, Kernel thực sự dùng lệnh `__put_user` / `copy_to_user` để sao chép các sự kiện sẵn sàng sang mảng `events` ở User Space, hoàn toàn không có vùng nhớ chia sẻ mmap nào ở đây cả. Thứ mà epoll tiết kiệm được là thao tác "mỗi lần gọi đều phải bê toàn bộ danh sách fd vào Kernel" của select/poll, chứ không phải triệt tiêu lần sao chép sự kiện sẵn sàng khi trả về. Tuyệt đối đừng đánh đồng hai chuyện này với nhau!

## Kích hoạt theo mức (LT) và Kích hoạt theo cạnh (ET) khác nhau ở đâu?

`epoll` hỗ trợ hai chế độ kích hoạt sự kiện, đây là năng lực vượt trội của nó so với select/poll, đồng thời cũng là cái bẫy dễ sập nhất trong phỏng vấn và thực chiến.

**Kích hoạt theo mức (Level Triggered - LT)** là chế độ mặc định. Chừng nào trên fd vẫn còn dữ liệu chưa đọc hết (hoặc bộ đệm gửi vẫn còn chỗ trống để ghi), thì mỗi lần gọi `epoll_wait`, Kernel sẽ liên tục thông báo cho bạn. `select` và `poll` chỉ hỗ trợ duy nhất chế độ này.

**Kích hoạt theo cạnh (Edge Triggered - ET)** đòi hỏi phải gắn thêm cờ `EPOLLET` một cách tường minh khi đăng ký. Nó chỉ thông báo đúng một lần duy nhất vào khoảnh khắc trạng thái **vừa phát sinh thay đổi**.

Hãy dùng một ví dụ cụ thể để thấy rõ sự khác biệt (đây cũng là ví dụ kinh điển trong Linux man page): Giả sử phía đầu bên kia gửi 2 KB dữ liệu vào một socket:

- Chế độ LT: `epoll_wait` báo socket có thể đọc. Bạn chỉ đọc 1 KB, trong bộ đệm vẫn còn lại 1 KB. Lần gọi `epoll_wait` tiếp theo, hệ thống sẽ tiếp tục báo: *"Ở đây vẫn còn dữ liệu chưa đọc xong nhé!"*, và sẽ báo liên tục cho đến khi bạn đọc sạch 2 KB đó mới thôi.
- Chế độ ET: `epoll_wait` thông báo cho bạn một lần duy nhất. Bạn chỉ đọc 1 KB rồi bỏ đi làm việc khác, vậy thì 1 KB còn lại nằm trong bộ đệm — trừ khi đầu bên kia gửi thêm dữ liệu mới để tạo ra sự thay đổi trạng thái lần nữa, còn không thì `epoll_wait` sẽ **không bao giờ chủ động thông báo cho bạn về 1 KB đó nữa**. 1 KB này có thể sẽ nằm chết dí trong bộ đệm mãi mãi, khiến kết nối bị tắc nghẽn vô thời hạn.

![So sánh Kích hoạt theo mức (LT) và Kích hoạt theo cạnh (ET): LT liên tục thông báo khi dữ liệu chưa đọc hết, ET chỉ thông báo một lần khi trạng thái thay đổi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-lt-vs-et-6c7d8e92.png)

Do đó, khi dùng chế độ ET, bạn bắt buộc phải tuân thủ hai quy tắc sắt đá: **Gắn cờ Non-blocking cho fd**, và **dùng vòng lặp `read()` liên tục cho đến khi hàm trả về lỗi `EAGAIN` (hoặc `EWOULDBLOCK`)**, đảm bảo một lần rút cạn sạch sành sanh toàn bộ dữ liệu trong bộ đệm. Cách đọc điển hình của chế độ ET như sau:

```c
// Tiền đề: connfd đã được đặt non-blocking và đăng ký với cờ EPOLLET
while (1) {
    ssize_t n = read(connfd, buf, sizeof(buf));
    if (n > 0) {
        // Xử lý khối dữ liệu này, sau đó tiếp tục vòng lặp để rút cạn bộ đệm
    } else if (n == 0) {
        close(connfd);                 // Đầu bên kia đã đóng kết nối
        break;
    } else {  // n < 0
        if (errno == EAGAIN || errno == EWOULDBLOCK)
            break;                      // Dữ liệu đã đọc sạch, đây là điểm thoát bình thường
        if (errno == EINTR)
            continue;                   // Bị ngắt bởi tín hiệu, thử lại
        close(connfd);                  // Lỗi thực sự xảy ra
        break;
    }
}
```

Nếu fd là Blocking, thì lần gọi `read()` cuối cùng khi không còn dữ liệu sẽ làm toàn bộ Thread bị kẹt cứng tại đó — đó chính là lý do vì sao chế độ ET và socket Non-blocking bắt buộc phải đi liền với nhau như hình với bóng.

Ưu điểm của ET là làm giảm số lần đánh thức `epoll_wait`, phù hợp cho những hệ thống theo đuổi thông lượng tột đỉnh và đội ngũ phát triển có năng lực kiểm soát logic đọc ghi cực kỳ chặt chẽ; cái giá phải trả là độ phức tạp lập trình cao hơn hẳn, việc đọc sót dữ liệu do không lặp tới `EAGAIN` khiến kết nối bị treo cứng là lỗi phổ biến nhất ở loại mã nguồn này. Ngược lại, nếu vì muốn "đọc cho sạch" mà vòng lặp cứ đọc mãi trên một fd hoạt động dồn dập, nó lại có thể làm "bỏ đói" (starvation) các kết nối khác; do đó trong thực tế người ta thường gán cho mỗi fd một hạn mức (budget) đọc trong mỗi vòng và đưa vào hàng đợi sẵn sàng ở tầng ứng dụng để luân chuyển. Chế độ LT lập trình đơn giản, khó mắc lỗi, tuyệt đại đa số các nghiệp vụ chỉ cần dùng LT là đã quá đủ. Chỉ những dịch vụ cực kỳ nhạy cảm với hiệu năng như Nginx mới tận dụng triệt để ET.

Khi viết một Event Loop chuẩn Production, chỉ biết đọc thôi là chưa đủ, bạn còn phải xử lý hàng loạt chi tiết góc cạnh: `epoll_wait` bị tín hiệu ngắt trả về `EINTR` thì phải thử lại; ở chế độ ET thì hàm `accept()` cũng phải lặp cho tới `EAGAIN`; các cờ `EPOLLERR`/`EPOLLHUP`/`EPOLLRDHUP` phải được kiểm tra đồng thời cùng sự kiện đọc/ghi; `read()` trả về 0 nghĩa là đầu bên kia đã đóng hướng ghi; lệnh `write()` có thể chỉ ghi được một phần (short write), ứng dụng phải tự đệm lại phần dữ liệu chưa gửi hết và đăng ký `EPOLLOUT` khi cần; khi nhiều Thread cùng xử lý một fd, nên cân nhắc dùng cờ `EPOLLONESHOT` kết hợp với thao tác tái vũ trang (rearm).

## So sánh ngang giữa select, poll và epoll

Bảng tổng hợp đối chiếu toàn diện giữa ba cơ chế:

| Tiêu chí | `select` | `poll` | `epoll` |
| --- | --- | --- | --- |
| **Nền tảng hỗ trợ** | Đa nền tảng rất tốt; Unix, Windows đều có (Windows chủ yếu cho socket) | Chủ yếu dùng trên các hệ thống Unix-like | Độc quyền của Linux (Linux 2.6+) |
| **Quản lý phía Kernel** | Kiểm tra tạm thời tập hợp fd mỗi lần gọi | Kiểm tra tạm thời mảng fd mỗi lần gọi | Duy trì lâu dài interest list và ready list; hiện tại dùng Cây đỏ-đen và Danh sách sẵn sàng |
| **Giới hạn số lượng fd** | Bị giới hạn bởi `FD_SETSIZE`; Linux glibc thường là 1024, chỉ xử lý an toàn fd 0–1023 | Không bị `FD_SETSIZE` giới hạn; phụ thuộc vào `RLIMIT_NOFILE` và RAM | Không bị `FD_SETSIZE` giới hạn; phụ thuộc vào file descriptor toàn hệ thống, RAM và `max_user_watches` |
| **Truyền tham số mỗi lần chờ** | Mỗi vòng truyền toàn bộ mảng bit, trả về bị sửa đổi, vòng sau phải tạo lại | Mỗi vòng truyền toàn bộ mảng `pollfd`, Kernel điền vào `revents` (`events` không bị sửa) | Tập theo dõi duy trì qua `epoll_ctl`, `epoll_wait` chỉ nhận về các sự kiện đã sẵn sàng |
| **Chi phí tìm kiếm fd sẵn sàng** | Quét tới `nfds - 1`, độ phức tạp $O(N)$ | Duyệt toàn bộ mảng, độ phức tạp $O(N)$ | Lúc chờ không quét toàn bộ danh sách, chi phí trả về chủ yếu tỷ lệ với số lượng sự kiện sẵn sàng |
| **Chế độ kích hoạt** | Chỉ hỗ trợ LT | Chỉ hỗ trợ LT | Mặc định là LT, hỗ trợ cả ET (`EPOLLET`) |

![So sánh select, poll và epoll: Cấu trúc dữ liệu, giới hạn fd, tham số truyền vào mỗi lần chờ, chi phí tìm kiếm fd sẵn sàng và chế độ kích hoạt](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-select-poll-epoll-6d5bee4f.png)

## epoll không phải là viên đạn bạc

Nói tới đây rất dễ dẫn tới kết luận phiến diện rằng "epoll đè bẹp hoàn toàn", nhưng trong thực chiến không có gì là tuyệt đối:

**Khi số lượng kết nối ít và tất cả đều hoạt động liên tục, epoll chưa chắc đã nhanh hơn.** Bản thân việc epoll duy trì Cây đỏ-đen, gắn hàm callback và đồng bộ hóa Danh sách sẵn sàng đều có chi phí cố định. Nếu bạn chỉ theo dõi vài chục fd mà lần nào chúng cũng có dữ liệu sẵn sàng, thì cách duyệt tuyến tính một mạch của select/poll lại trực diện hơn và tiết kiệm hơn. Sân nhà thực sự của epoll là **lượng kết nối khổng lồ nhưng đại đa số đều nhàn rỗi** — hàng vạn kết nối dài (long-lived connection) treo ở đó mà cùng một thời điểm chỉ có số ít có dữ liệu, lúc này chỉ theo dõi những cái sẵn sàng mới thực sự phát huy giá trị.

**Nó là cơ chế độc quyền của Linux.** Trên macOS và BSD cơ chế tương ứng là `kqueue`, trên Windows là IOCP. Để viết ứng dụng mạng đa nền tảng, lập trình viên hiếm khi gọi trực tiếp epoll mà sử dụng các thư viện bao gói như libevent, libuv hay Netty để chúng tự động dùng epoll trên Linux và dùng cơ chế tương đương trên các hệ điều hành khác.

**Vấn đề Thundering Herd (Bầy đàn thức giấc).** Khi nhiều Process/Thread cùng chờ sự kiện trên một listening socket, một kết nối mới ập tới có thể làm toàn bộ chúng cùng bừng tỉnh, nhưng cuối cùng chỉ có một bên `accept()` thành công, những bên còn lại bị đánh thức vô ích. Từ Linux 4.5 trở đi, lập trình viên có thể dùng cờ `EPOLLEXCLUSIVE` để giảm thiểu hiện tượng này, hướng dẫn Kernel chỉ đánh thức một hoặc số ít waiter; tuy nhiên đây không phải là cam kết tuyệt đối trong mọi mô hình triển khai phức tạp.

**Cái bẫy của chế độ ET như đã nêu:** Chỉ cần đọc sót dữ liệu mà không lặp tới `EAGAIN`, phần dữ liệu còn lại có thể sẽ không bao giờ được thông báo nữa, khiến kết nối bị treo vĩnh viễn. Đây là lỗi ảnh hưởng tới tính đúng đắn của chương trình và cực kỳ khó gỡ lỗi. Nếu không nắm chắc, hãy cứ yên tâm dùng LT.

## Những cơ chế này được ứng dụng ở đâu?

Các cơ chế này không hề nằm yên trong sách vở, mà là trái tim vận hành của các hạ tầng phần mềm hiệu năng cao phổ biến nhất hiện nay:

**Redis** là đại diện tiêu biểu cho mô hình Event Loop đơn luồng kết hợp I/O Multiplexing. Nó không tạo Thread cho từng client, mà dùng một Thread duy nhất thông qua I/O Multiplexing để lắng nghe hàng loạt socket, socket nào sẵn sàng thì gọi trình xử lý sự kiện tương ứng. Redis tự xây dựng một tầng trừu tượng riêng (`ae.c`), tùy thuộc vào nền tảng mà tự chọn epoll, kqueue hay select. Đó là một trong những bí quyết giúp Redis dù chạy đơn luồng vẫn có thể gánh được mức độ đồng thời cực cao, loại bỏ hoàn toàn chi phí chuyển đổi ngữ cảnh và tranh chấp khóa của đa luồng.

![Bộ xử lý sự kiện file trong Redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-event-handler-2997bc21.png)

Bổ sung một điểm hay bị hiểu lầm: Redis 6.0 có đưa vào đa luồng, nhưng đa luồng đó chỉ dùng để gánh phần đọc ghi I/O mạng và phân tích cú pháp giao thức (protocol parsing), còn việc thực thi các câu lệnh nghiệp vụ thực tế thì vẫn là đơn luồng. Lõi Event Loop của I/O Multiplexing vẫn giữ nguyên, đa luồng chỉ giúp san sẻ những công việc nặng nhọc tốn CPU để tránh biến chúng thành nút thắt cổ chai của luồng chính.

**Nginx** sử dụng kiến trúc đa tiến trình (multi-process) kết hợp cùng epoll ở chế độ ET, phối hợp với socket non-blocking để ép số lần xử lý sau mỗi lần đánh thức xuống mức tối thiểu. Đó là nền tảng giúp Nginx chỉ cần rất ít tiến trình mà vẫn gánh nổi hàng trăm nghìn kết nối đồng thời.

Trong **Java NIO**, class `Selector` chính là lớp vỏ bọc hướng đối tượng của I/O Multiplexing. Trên Linux, tầng dưới của `Selector` gọi trực tiếp tới epoll (thông qua lớp nội bộ `EPollSelectorImpl`); chuyển sang hệ điều hành khác nó sẽ tự đổi sang phương án hiện thực tương ứng, hoàn toàn trong suốt với mã nguồn Java bên trên.

![Sơ đồ hoạt động của Selector trong Java NIO](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/selector-channel-selectionkey-005fb037.png)

Bên cạnh Java NIO tiêu chuẩn, Netty còn cung cấp hẳn một bộ Native epoll transport riêng biệt (`EpollEventLoop`), kết nối trực tiếp với các system call của epoll bỏ qua tầng bọc trung gian của JDK, giúp vắt kiệt tối đa hiệu năng trên môi trường Linux. Cần lưu ý sự khác biệt giữa các phiên bản: Native transport của Netty 4.0 từng lấy Edge Triggered làm điểm nhấn; nhưng đến Netty 4.2, `EpollMode` đã bị đánh dấu deprecated (bị loại bỏ), và tài liệu ghi rõ transport luôn luôn sử dụng Level Triggered. Hành vi ở các bản Netty 4.1 cụ thể cần đối chiếu theo mã nguồn và API của phiên bản tương ứng.

## Trả lời thế nào trong buổi phỏng vấn?

Khi bị hỏi *"I/O Multiplexing giải quyết vấn đề gì?"*, đừng trả lời là "giúp một lần read chạy nhanh hơn". Nó giải quyết bài toán **chờ đợi**: một Thread không cần phải bị chặn trên một kết nối duy nhất, mà giao cả một nhóm fd cho `select`, `poll` hoặc `epoll`, fd nào sẵn sàng thì mới thức dậy xử lý. Lần gọi `read()`/`recv()` thực sự để bốc dữ liệu từ bộ đệm Kernel sang bộ đệm User Space vẫn do chính ứng dụng thực hiện, vì thế nó thuộc về mô hình I/O Đồng bộ.

Sự khác biệt giữa `select`, `poll`, `epoll` có thể triển khai mạch lạc theo ba trụ cột:

Thứ nhất là **cấu trúc dữ liệu**: `select` dùng mảng bit `fd_set` cố định kích thước, trên Linux glibc thường bị giới hạn ở 1024; `poll` đổi sang mảng `pollfd`, phá bỏ rào cản `FD_SETSIZE` nhưng mỗi lần gọi vẫn phải truyền toàn bộ mảng vào Kernel; `epoll` duy trì tập hợp theo dõi lâu dài trong Kernel bằng Cây đỏ-đen, thêm sửa xóa qua `epoll_ctl`, và `epoll_wait` chỉ lấy ra các sự kiện đã sẵn sàng.

Thứ hai là **mô hình hiệu năng**: `select` và `poll` mỗi lần chờ đều phải nộp toàn bộ danh sách và sau đó quét tuyến tính, kết nối càng nhiều mà hoạt động càng ít thì càng lãng phí; `epoll` cực kỳ tối ưu cho kịch bản lượng fd lớn nhưng số lượng hoạt động ít, vì lúc chờ không quét toàn bộ danh sách, chi phí trả về chủ yếu phụ thuộc vào số lượng sự kiện thực sự sẵn sàng trong đợt đó. Tuy nhiên khi số kết nối rất ít và kết nối nào cũng hoạt động liên tục thì select/poll vẫn có thể chạy nhanh không kém do không tốn chi phí quản lý nội bộ của epoll.

Thứ ba là **chế độ kích hoạt LT/ET của epoll**: LT là mặc định, chừng nào bộ đệm còn dữ liệu thì lần sau vẫn báo tiếp; ET chỉ báo một lần khi trạng thái thay đổi, vì thế bắt buộc phải dùng socket non-blocking và lặp lệnh `read()` cho đến khi nhận mã lỗi `EAGAIN`. Trong phỏng vấn, nếu nói rõ được câu này, đồng thời bổ sung thêm các chi tiết thực chiến như xử lý `EINTR`, ghi một phần (short write), và cờ `EPOLLONESHOT`, bạn sẽ chứng minh được mình là một kỹ sư có kinh nghiệm thực chiến dày dạn chứ không chỉ học vẹt lý thuyết.

## Tài liệu tham khảo

- [W. Richard Stevens《UNIX Network Programming》Chapter 6 (select/poll và 5 mô hình I/O)](https://notes.shichao.io/unp/ch6/)
- [epoll(7) - Linux manual page](https://man7.org/linux/man-pages/man7/epoll.7.html)
- [epoll_create(2) / epoll_ctl(2) / epoll_wait(2) - Linux manual pages](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html)
- [epoll final interface (LWN, ghi nhận epoll được đưa vào bản 2.5.44)](https://lwn.net/Articles/16026/)
