---
title: "Khóa chính tự tăng (AUTO_INCREMENT) trong MySQL có luôn liên tục không?"
description: "Giải thích chi tiết nguyên nhân khóa chính tự tăng trong MySQL không liên tục, phân tích cơ chế cấp phát giá trị tự tăng trong các kịch bản như xung đột khóa duy nhất (Unique Key), rollback giao dịch, chèn hàng loạt (Batch Insert), cũng như cấu hình và ảnh hưởng của các chế độ khóa tự tăng trong InnoDB."
category: Cơ sở dữ liệu
tag:
  - MySQL
  - Phỏng vấn Big Tech
head:
  - - meta
    - name: keywords
      content: Khóa chính tự tăng MySQL,AUTO_INCREMENT,Khóa chính không liên tục,Rollback giao dịch,Chèn hàng loạt,Xung đột Unique Key,innodb_autoinc_lock_mode
lang: vi
sourceRef: zh-ref/database/mysql/mysql-auto-increment-primary-key-continuous.md
---

> Tác giả: Feitian Xiaoniuruo
>
> Bài gốc: <https://mp.weixin.qq.com/s/qci10h9rJx_COZbHV3aygQ>

Như chúng ta đã biết, khóa chính tự tăng (auto-increment primary key) giúp Clustered Index chèn dữ liệu theo thứ tự tăng dần một cách tối đa, tránh truy vấn ngẫu nhiên, từ đó nâng cao hiệu năng truy vấn.

Nhưng trên thực tế, khóa chính tự tăng của MySQL không thể đảm bảo luôn tăng liên tục không bị gián đoạn.

Hãy cùng xem một ví dụ sau đây bằng cách tạo một bảng như bên dưới:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3e6b80ba50cb425386b80924e3da0d23-tplv-k3u1fbpfcp-4bffa98e.png)

## Giá trị tự tăng được lưu ở đâu?

Dùng câu lệnh `insert into test_pk values(null, 1, 1)` để chèn một dòng dữ liệu, sau đó thực thi lệnh `show create table` để xem định nghĩa cấu trúc bảng:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c17e46230bd34150966f0d86b2ad5e91-tplv-k3u1fbpfcp-c4e31a62.png)

Định nghĩa cấu trúc bảng ở trên được lưu trong một tệp cục bộ có phần mở rộng `.frm`, có thể tìm thấy trong thư mục `data` dưới thư mục cài đặt MySQL:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3ec0514dd7be423d80b9e7f2d52f5902-tplv-k3u1fbpfcp-3bc2055d.png)

Từ cấu trúc bảng ở trên có thể thấy, trong định nghĩa bảng xuất hiện `AUTO_INCREMENT=2`, biểu thị lần chèn dữ liệu tiếp theo nếu cần tự động sinh giá trị tự tăng thì sẽ sinh ra `id = 2`.

Tuy nhiên cần lưu ý rằng giá trị tự tăng không hề được lưu trong cấu trúc bảng tức tệp `.frm` này; các Storage Engine khác nhau có chiến lược lưu trữ giá trị tự tăng khác nhau:

1) Engine MyISAM lưu giá trị tự tăng trong tệp dữ liệu (data file).

2) Engine InnoDB thực chất lưu giá trị tự tăng trong bộ nhớ (RAM) chứ không lưu bền vững xuống đĩa (trước bản 8.0). Lần đầu tiên mở bảng, InnoDB đều đi tìm giá trị lớn nhất `max(id)`, rồi lấy `max(id)+1` làm giá trị tự tăng hiện tại của bảng đó.

Lấy ví dụ: hiện tại trong bảng của chúng ta, `id` lớn nhất trong các dòng dữ liệu là `1`, và `AUTO_INCREMENT=2`, đúng chứ? Lúc này, chúng ta xóa dòng `id=1`, thì `AUTO_INCREMENT` vẫn là `2`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/61b8dc9155624044a86d91c368b20059-tplv-k3u1fbpfcp-374f934e.png)

Nhưng nếu khởi động lại (restart) instance MySQL ngay lập tức, sau khi khởi động lại thì `AUTO_INCREMENT` của bảng này sẽ biến thành `1`. Nói cách khác, việc khởi động lại MySQL có thể làm thay đổi giá trị `AUTO_INCREMENT` của một bảng.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/27fdb15375664249a31f88b64e6e5e66-tplv-k3u1fbpfcp-6c5b8038.png)

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/dee15f93e65d44d384345a03404f3481-tplv-k3u1fbpfcp-2264f3ef.png)

Thử nghiệm trên được thực hiện trên phiên bản MySQL 5.x tại máy cục bộ. Trên thực tế, **từ phiên bản MySQL 8.0 trở đi, bản ghi thay đổi giá trị tự tăng được đặt trong Redo Log, cung cấp khả năng lưu trữ bền vững (persistence) cho giá trị tự tăng**, tức là đạt được cơ chế: "nếu xảy ra khởi động lại, giá trị tự tăng của bảng có thể được khôi phục theo Redo Log về đúng giá trị trước khi MySQL khởi động lại".

Nói cách khác, với ví dụ trên, sau khi khởi động lại instance thì `AUTO_INCREMENT` của bảng vẫn là `2`.

Sau khi đã hiểu giá trị tự tăng trong MySQL được lưu ở đâu, hãy tiếp tục xem cơ chế cập nhật giá trị tự tăng, qua đó dẫn ra kịch bản đầu tiên khiến giá trị tự tăng không liên tục.

## Các kịch bản giá trị tự tăng không liên tục

### Kịch bản 1: Giá trị khởi tạo và bước nhảy tự tăng

Trong MySQL, nếu cột `id` được định nghĩa là `AUTO_INCREMENT`, khi chèn một dòng dữ liệu, hành vi của giá trị tự tăng như sau:

- Nếu khi chèn dữ liệu, cột `id` được chỉ định là `0`, `null` hoặc không chỉ định giá trị, thì lấy giá trị `AUTO_INCREMENT` hiện tại của bảng điền vào cột tự tăng;
- Nếu khi chèn dữ liệu, cột `id` được chỉ định một giá trị cụ thể, thì dùng trực tiếp giá trị được chỉ định trong câu lệnh.

Tùy vào quan hệ lớn nhỏ giữa giá trị cần chèn và giá trị tự tăng hiện tại, kết quả cập nhật giá trị tự tăng cũng khác nhau. Giả sử giá trị cần chèn là `insert_num` và giá trị tự tăng hiện tại là `autoIncrement_num`:

- Nếu `insert_num < autoIncrement_num`, thì giá trị tự tăng của bảng không đổi.
- Nếu `insert_num >= autoIncrement_num`, thì cần cập nhật giá trị tự tăng hiện tại thành một giá trị tự tăng mới.

Tức là nếu `id` chèn vào là `100` và giá trị tự tăng hiện tại là `90`, do `insert_num >= autoIncrement_num`, giá trị tự tăng sẽ được cập nhật thành giá trị mới là `101`.

Có chắc chắn luôn như vậy không?

Không hề~

Những bạn từng tìm hiểu về Distributed ID hẳn đều biết, để tránh xung đột khóa chính sinh ra bởi hai database khác nhau, ta có thể cho một database sinh toàn `id` tự tăng là số lẻ, và database còn lại sinh toàn `id` tự tăng là số chẵn.

Quy luật chẵn lẻ này thực chất được quyết định bởi hai tham số `auto_increment_offset` và `auto_increment_increment`, lần lượt biểu thị giá trị khởi tạo ban đầu và bước nhảy (step) của cơ chế tự tăng; giá trị mặc định của cả hai đều là `1`.

Do đó, trong ví dụ trên, các bước thực tế để sinh giá trị tự tăng mới là: bắt đầu từ `auto_increment_offset`, cộng dồn liên tiếp theo bước nhảy `auto_increment_increment` cho đến khi tìm được giá trị đầu tiên lớn hơn `100`, rồi lấy giá trị đó làm giá trị tự tăng mới.

Vì vậy, trong trường hợp này, giá trị tự tăng mới có thể là `102`, `103`, v.v., dẫn đến khóa chính `id` không liên tục.

Đáng tiếc hơn là ngay cả khi cả hai tham số giá trị khởi tạo và bước nhảy đều đặt là `1`, khóa chính tự tăng `id` vẫn chưa chắc đảm bảo liên tục.

### Kịch bản 2: Xung đột Unique Key

Lấy ví dụ: hiện tại chúng ta chèn một bản ghi `(null,1,1)` vào bảng, khóa chính sinh ra là `1`, và `AUTO_INCREMENT=2`, đúng chứ?

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c22c4f2cea234c7ea496025eb826c3bc-tplv-k3u1fbpfcp-b0ea7363.png)

Lúc này tôi thực thi thêm một lệnh chèn `(null,1,1)`, hiển nhiên sẽ báo lỗi `Duplicate entry` vì chúng ta đã đặt một chỉ mục duy nhất (Unique Index) trên cột `a`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c0325e31398d4fa6bb1cbe08ef797b7f-tplv-k3u1fbpfcp-09387cc4.png)

Thế nhưng bạn sẽ ngạc nhiên phát hiện ra rằng tuy chèn thất bại, giá trị tự tăng vẫn tăng từ `2` lên `3`!

Tại sao lại như vậy?

Hãy phân tích luồng thực thi của câu lệnh `INSERT` này:

1. Executor (bộ thực thi) gọi interface của InnoDB Engine để chuẩn bị chèn một dòng bản ghi `(null,1,1)`.
2. InnoDB phát hiện người dùng không chỉ định giá trị `id` tự tăng, nên lấy giá trị tự tăng hiện tại là `2` của bảng `test_pk`.
3. Đổi bản ghi truyền vào thành `(2,1,1)`.
4. Cập nhật giá trị tự tăng của bảng thành `3`.
5. Tiếp tục thực hiện thao tác chèn dữ liệu; do đã tồn tại bản ghi `a=1` nên báo lỗi `Duplicate key error` và câu lệnh trả về lỗi.

Có thể thấy thao tác cập nhật giá trị tự tăng diễn ra **trước** thao tác chèn dữ liệu thực sự.

Khi câu lệnh này thực sự chạy, vì gặp xung đột Unique Key `a` nên dòng `id = 2` không chèn thành công, nhưng MySQL cũng không khôi phục (revert) lại giá trị tự tăng. Do đó, sau đó khi chèn dòng dữ liệu mới, `id` tự tăng nhận được sẽ là `3`. Tức là xuất hiện tình trạng khóa chính tự tăng không liên tục.

Đến đây chúng ta đã liệt kê hai trường hợp khóa chính tự tăng không liên tục:

1. Giá trị khởi tạo và bước nhảy tự tăng không đặt bằng `1`
2. Xung đột Unique Key

Ngoài ra, việc rollback giao dịch (transaction rollback) cũng gây ra tình trạng này.

### Kịch bản 3: Rollback giao dịch (Transaction Rollback)

Hiện tại trong bảng của chúng ta có một bản ghi `(1,1,1)`, `AUTO_INCREMENT = 3`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/6220fcf7dac54299863e43b6fb97de3e-tplv-k3u1fbpfcp-e3520af6.png)

Trước tiên chúng ta chèn một dòng dữ liệu `(null, 2, 2)`, tức là `(3, 2, 2)`, và `AUTO_INCREMENT` biến thành `4`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3f02d46437d643c3b3d9f44a004ab269-tplv-k3u1fbpfcp-5eedbc51.png)

Tiếp theo thực thi đoạn SQL như sau:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/faf5ce4a2920469cae697f845be717f5-tplv-k3u1fbpfcp-54135f69.png)

Mặc dù chúng ta đã chèn một bản ghi `(null, 3, 3)`, nhưng lại dùng `rollback` để hoàn tác nên trong cơ sở dữ liệu không có bản ghi này:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/6cb4c02722674dd399939d3d03a431c1-tplv-k3u1fbpfcp-3205f80d.png)

Trong tình huống rollback giao dịch này, giá trị tự tăng **không** hề rollback theo! Như hình bên dưới, giá trị tự tăng vẫn nhất quyết tăng từ `4` lên `5`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/e6eea1c927424ac7bda34a511ca521ae-tplv-k3u1fbpfcp-1bce5a5c.png)

Vì thế lúc này khi chúng ta chèn tiếp một dòng dữ liệu `(null, 3, 3)`, khóa chính `id` sẽ được tự động gán là `5`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/80da69dd13b543c4a32d6ed832a3c568-tplv-k3u1fbpfcp-8351cb26.png)

Vậy tại sao khi xảy ra xung đột Unique Key hoặc rollback, MySQL lại không sửa ngược giá trị tự tăng của bảng về như cũ? Nếu lùi lại được thì chẳng phải sẽ không xảy ra tình trạng `id` tự tăng bị gián đoạn sao?

Trên thực tế, nguyên nhân chính để làm như vậy là nhằm **tối ưu hiệu năng**.

Hãy dùng phương pháp phản chứng để kiểm chứng: giả sử MySQL sửa ngược giá trị tự tăng về như cũ khi rollback giao dịch thì chuyện gì sẽ xảy ra?

Giả sử có hai giao dịch A và B đang chạy song song; khi xin cấp phát giá trị tự tăng, để tránh hai giao dịch xin trùng cùng một `id` tự tăng, chắc chắn phải dùng khóa (lock) rồi cấp phát tuần tự, đúng chứ?

1. Giả sử giao dịch A xin được `id = 1`, giao dịch B xin được `id = 2`, lúc này giá trị tự tăng của bảng `t` là `3`, sau đó hai giao dịch tiếp tục thực thi.
2. Giao dịch B commit thành công, nhưng giao dịch A gặp xung đột Unique Key, tức dòng `id = 1` chèn thất bại. Nếu cho phép giao dịch A lùi giá trị `id` tự tăng—tức sửa giá trị tự tăng hiện tại của bảng về `1`—thì sẽ xuất hiện tình trạng: trong bảng đã có dòng `id = 2`, nhưng giá trị `id` tự tăng hiện tại lại là `1`.
3. Tiếp theo, các giao dịch khác chạy sau đó sẽ xin được `id = 2`. Lúc này, câu lệnh chèn sẽ báo lỗi "xung đột khóa chính" (primary key conflict).

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/5f26f02e60f643c9a7cab88a9f1bdce9-tplv-k3u1fbpfcp-1a4f2cd5.png)

Để giải quyết lỗi xung đột khóa chính này, có hai cách:

1. Trước mỗi lần xin cấp phát `id`, kiểm tra xem trong bảng đã tồn tại `id` này hay chưa, nếu có thì bỏ qua `id` đó.
2. Mở rộng phạm vi khóa `id` tự tăng: bắt buộc phải đợi một giao dịch thực thi xong và commit thì giao dịch tiếp theo mới được xin `id` tự tăng.

Rõ ràng cả hai cách trên đều có chi phí rất cao và gây ra vấn đề hiệu năng. Mà nguồn cơn lại xuất phát từ chính giả thiết "cho phép lùi `id` tự tăng" của chúng ta.

Do đó, InnoDB đã từ bỏ thiết kế này: dù câu lệnh thực thi thất bại cũng không lùi lại `id` tự tăng. Chính vì thế, MySQL chỉ đảm bảo `id` tự tăng là **tăng dần (monotonically increasing)** chứ không đảm bảo **liên tục (continuous)**.

Tổng kết lại, chúng ta đã phân tích 3 kịch bản giá trị tự tăng không liên tục, và còn một kịch bản thứ 4: chèn dữ liệu hàng loạt (batch insert).

### Kịch bản 4: Chèn dữ liệu hàng loạt (Batch Insert)

Đối với các câu lệnh chèn dữ liệu hàng loạt, MySQL có một chiến lược xin cấp phát `id` tự tăng theo lô (batch):

1. Trong quá trình thực thi câu lệnh, lần xin `id` tự tăng đầu tiên sẽ được cấp `1` ID;
2. Sau khi dùng hết `1` ID đó, lần xin thứ hai của câu lệnh này sẽ được cấp `2` ID;
3. Sau khi dùng hết `2` ID đó, vẫn trong câu lệnh này, lần xin thứ ba sẽ được cấp `4` ID;
4. Cứ như vậy suy ra, trong cùng một câu lệnh khi xin `id` tự tăng, số lượng `id` được cấp mỗi lần đều gấp đôi lần trước.

Lưu ý: "chèn dữ liệu hàng loạt" ở đây **không phải** là câu lệnh `INSERT` thông thường chứa nhiều giá trị `VALUES`! Bởi vì loại câu lệnh `INSERT ... VALUES (...), (...)` đó có thể tính chính xác cần bao nhiêu `id` ngay khi xin cấp phát, nên chỉ cần xin một lần là xong và giải phóng khóa ngay lập tức.

Còn đối với các loại câu lệnh như `insert … select`, `replace … select` và `load data`, MySQL không biết trước rốt cuộc cần xin bao nhiêu `id`, nên mới áp dụng chiến lược cấp phát theo lô như vậy—dù sao nếu xin từng cái một thì quá chậm.

Lấy ví dụ: giả sử bảng hiện tại của chúng ta có các dữ liệu sau:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/6453cfc107f94e3bb86c95072d443472-tplv-k3u1fbpfcp-bccd814f.png)

Chúng ta tạo một bảng `test_pk2` có định nghĩa cấu trúc giống hệt bảng `test_pk` hiện tại:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/45248a6dc34f431bba14d434bee2c79e-tplv-k3u1fbpfcp-2718ed3a.png)

Sau đó dùng `insert...select` để chèn hàng loạt dữ liệu vào bảng `teset_pk2`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c1b061e86bae484694d15ceb703b10ca-tplv-k3u1fbpfcp-c4e962d5.png)

Có thể thấy dữ liệu đã được import thành công.

Hãy kiểm tra lại xem giá trị tự tăng của `test_pk2` là bao nhiêu:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/0ff9039366154c738331d64ebaf88d3b-tplv-k3u1fbpfcp-57f1f307.png)

Như phân tích ở trên, kết quả là `8` chứ không phải `6`.

Cụ thể, `insert……select` thực chất đã chèn vào bảng 5 dòng dữ liệu: `(1, 1)`, `(2, 2)`, `(3, 3)`, `(4, 4)`, `(5, 5)`. Tuy nhiên, 5 dòng dữ liệu này đã xin `id` tự tăng qua 3 lần; kết hợp chiến lược cấp phát theo lô với số lượng mỗi lần gấp đôi lần trước:

- Lần đầu xin được 1 ID: `id=1`
- Lần thứ hai được cấp 2 ID: `id=2` và `id=3`
- Lần thứ ba được cấp 4 ID: `id=4`, `id=5`, `id=6`, `id=7`

Do câu lệnh này thực tế chỉ dùng đến 5 ID nên `id=6` và `id=7` bị lãng phí bỏ đi. Sau đó, khi thực thi tiếp `insert into test_pk2 values(null,6,6)`, dữ liệu thực tế được chèn sẽ là `(8,6,6)`:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/51612fbac3804cff8c5157df21d6e355-tplv-k3u1fbpfcp-1855f2f3.png)

## Tổng kết

Bài viết tổng kết lại 4 kịch bản khiến giá trị tự tăng trong MySQL không liên tục:

1. Giá trị khởi tạo và bước nhảy tự tăng không đặt bằng `1`
2. Xung đột Unique Key
3. Rollback giao dịch
4. Chèn hàng loạt (như các câu lệnh `insert...select`)
