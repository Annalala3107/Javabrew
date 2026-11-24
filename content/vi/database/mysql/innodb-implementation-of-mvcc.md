---
title: "Cách Storage Engine InnoDB triển khai MVCC"
description: "Phân tích chuyên sâu nguyên lý triển khai MVCC của Storage Engine InnoDB, giải thích chi tiết các cột ẩn (hidden columns), chuỗi phiên bản undo log, cơ chế ReadView, cũng như sự khác biệt giữa Snapshot Read (đọc ảnh chụp) và Current Read (đọc hiện tại) để hiểu cách MySQL hiện thực hóa cô lập giao dịch."
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MVCC,Kiểm soát đồng thời đa phiên bản,InnoDB,Snapshot Read,Current Read,Consistent View,ReadView,undo log,Cột ẩn,Cô lập giao dịch
lang: vi
sourceRef: zh-ref/database/mysql/innodb-implementation-of-mvcc.md
---

## Kiểm soát đồng thời đa phiên bản (Multi-Version Concurrency Control)

MVCC là một cơ chế kiểm soát đồng thời (concurrency control) dùng để duy trì tính nhất quán và tính cô lập (isolation) của dữ liệu khi nhiều giao dịch đồng thời vừa đọc vừa ghi vào cơ sở dữ liệu. Nó hoạt động bằng cách duy trì nhiều phiên bản dữ liệu trên mỗi dòng bản ghi. Khi một giao dịch sửa đổi dữ liệu, InnoDB sẽ **cập nhật trực tiếp lên dòng dữ liệu hiện tại** (cập nhật tại chỗ - in-place update) và **lưu phiên bản dữ liệu cũ vào Undo Log**. Khi các giao dịch khác thực hiện đọc ảnh chụp (Snapshot Read), chúng sẽ dựa vào **ReadView** và chuỗi phiên bản trong **Undo Log** để đọc được một góc nhìn nhất quán (consistent view) của dữ liệu tại một thời điểm xác định, qua đó tránh việc thao tác đọc bị chặn bởi thao tác ghi.

1. Thao tác đọc (`SELECT`):

Khi một giao dịch thực hiện thao tác đọc, nó sẽ sử dụng cơ chế đọc ảnh chụp (Snapshot Read). Ảnh chụp này được tạo dựa trên trạng thái cơ sở dữ liệu tại thời điểm giao dịch (hoặc truy vấn) bắt đầu, do đó giao dịch sẽ không đọc phải các thay đổi chưa được commit của giao dịch khác. Cụ thể như sau:

- Đối với thao tác đọc, giao dịch sẽ tìm các dòng thỏa mãn điều kiện và chọn phiên bản dữ liệu phù hợp với thời điểm bắt đầu của mình để đọc.
- Nếu một dòng dữ liệu có nhiều phiên bản, giao dịch sẽ chọn phiên bản mới nhất nhưng không muộn hơn thời điểm bắt đầu của nó, đảm bảo giao dịch chỉ đọc dữ liệu đã tồn tại trước khi nó bắt đầu.
- Giao dịch đọc dữ liệu từ ảnh chụp, vì vậy việc các giao dịch đồng thời khác sửa đổi dòng dữ liệu sẽ không ảnh hưởng đến thao tác đọc của giao dịch hiện tại.

2. Thao tác ghi (`INSERT`, `UPDATE`, `DELETE`):

Khi một giao dịch thực hiện thao tác ghi, nó sẽ tạo ra một phiên bản dữ liệu mới và ghi dữ liệu đã sửa đổi vào cơ sở dữ liệu. Cụ thể như sau:

- Đối với thao tác ghi, giao dịch sẽ tạo một phiên bản mới cho dòng dữ liệu cần sửa đổi và ghi dữ liệu sau khi cập nhật vào phiên bản mới.
- Dữ liệu phiên bản mới sẽ mang số hiệu phiên bản (ID giao dịch) của giao dịch hiện tại để các giao dịch khác có thể đọc đúng phiên bản tương ứng.
- Phiên bản dữ liệu gốc vẫn được giữ lại để các giao dịch khác sử dụng khi đọc ảnh chụp, điều này đảm bảo các giao dịch khác không bị ảnh hưởng bởi thao tác ghi của giao dịch hiện tại.

3. Commit và Rollback giao dịch:

- Khi một giao dịch commit, các thay đổi do nó thực hiện sẽ trở thành phiên bản mới nhất trong cơ sở dữ liệu và trở nên khả kiến (visible) đối với các giao dịch khác.
- Khi một giao dịch rollback, các thay đổi do nó thực hiện sẽ bị hủy bỏ và không khả kiến đối với các giao dịch khác.

4. Thu hồi phiên bản (Version Reclamation):

Để ngăn số lượng phiên bản trong cơ sở dữ liệu tăng lên vô hạn, MVCC sẽ định kỳ thực hiện thu hồi các phiên bản cũ. Cơ chế thu hồi sẽ xóa những phiên bản dữ liệu cũ không còn cần thiết nhằm giải phóng không gian lưu trữ.

MVCC thực hiện kiểm soát đồng thời thông qua việc tạo nhiều phiên bản dữ liệu và sử dụng Snapshot Read. Thao tác đọc sử dụng ảnh chụp của dữ liệu cũ, còn thao tác ghi tạo phiên bản mới đồng thời vẫn đảm bảo phiên bản gốc khả dụng. Nhờ đó, các giao dịch khác nhau có thể thực thi đồng thời ở một mức độ nhất định mà không gây nhiễu lẫn nhau, giúp nâng cao hiệu năng đồng thời và tính nhất quán dữ liệu của cơ sở dữ liệu.

## Đọc nhất quán không khóa và Đọc có khóa

### Đọc nhất quán không khóa (Consistent Nonlocking Reads)

Để triển khai [**Consistent Nonlocking Reads (Đọc nhất quán không khóa)**](https://dev.mysql.com/doc/refman/5.7/en/innodb-consistent-read.html), cách thông thường là thêm một trường số phiên bản (version) hoặc dấu thời gian (timestamp); khi cập nhật dữ liệu thì đồng thời tăng version + 1 hoặc cập nhật timestamp. Khi truy vấn, so sánh phiên bản hiện đang khả kiến với số phiên bản của bản ghi tương ứng; nếu phiên bản của bản ghi nhỏ hơn phiên bản khả kiến thì bản ghi đó được phép nhìn thấy.

Trong Storage Engine `InnoDB`, [đa phiên bản (multi-versioning)](https://dev.mysql.com/doc/refman/5.7/en/innodb-multi-versioning.html) chính là cách hiện thực hóa cơ chế đọc không khóa. Nếu dòng đang đọc đồng thời bị thực hiện thao tác `DELETE` hoặc `UPDATE`, lúc này thao tác đọc sẽ không chờ giải phóng khóa trên dòng đó. Thay vào đó, Storage Engine `InnoDB` sẽ đọc một dữ liệu ảnh chụp của dòng đó; cách đọc dữ liệu lịch sử này được chúng ta gọi là **Snapshot Read (đọc ảnh chụp)**.

Ở hai mức cô lập `Repeatable Read` và `Read Committed`, nếu thực thi câu lệnh `select` thông thường (không bao gồm `select ... lock in share mode`, `select ... for update`), hệ thống sẽ sử dụng `Consistent Nonlocking Read (MVCC)`. Ngoài ra, dưới mức `Repeatable Read`, `MVCC` giúp đạt được khả năng đọc lặp lại (repeatable read) và ngăn chặn một phần hiện tượng đọc bóng ma (Phantom Read).

### Đọc có khóa (Locking Reads)

Nếu thực thi các câu lệnh sau đây thì đó là [**Locking Reads (Đọc có khóa)**](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-reads.html):

- `select ... lock in share mode`
- `select ... for update`
- Các thao tác `insert`, `update`, `delete`

Trong Locking Read, dữ liệu được đọc là phiên bản mới nhất; kiểu đọc này còn được gọi là **`Current Read` (đọc hiện tại)**. Locking Read sẽ gắn khóa (lock) lên các bản ghi đọc được:

- `select ... lock in share mode`: gắn khóa `S` (Shared Lock) lên bản ghi; giao dịch khác vẫn có thể gắn khóa `S`, nhưng nếu gắn khóa `X` thì sẽ bị chặn.
- `select ... for update`, `insert`, `update`, `delete`: gắn khóa `X` (Exclusive Lock) lên bản ghi, và các giao dịch khác không thể gắn bất kỳ loại khóa nào lên đó.

Trong Consistent Nonlocking Read, ngay cả khi bản ghi đang đọc đã bị giao dịch khác gắn khóa `X`, bản ghi đó vẫn có thể đọc được—tức đọc dữ liệu ảnh chụp. Như đã nói ở trên, dưới mức `Repeatable Read`, `MVCC` ngăn chặn *một phần* Phantom Read; chữ "một phần" ở đây chỉ trường hợp trong `Consistent Nonlocking Read`, giao dịch chỉ đọc được dữ liệu đã chèn trước lần truy vấn đầu tiên (dựa trên `ReadView` để phán đoán tính khả kiến, và `ReadView` được tạo ở lần truy vấn đầu tiên). Thế nhưng! Nếu là **`Current Read`**, mỗi lần đọc đều lấy dữ liệu mới nhất; lúc này nếu giữa hai lần truy vấn có giao dịch khác chèn thêm dữ liệu thì sẽ phát sinh Phantom Read. Vì vậy, **khi `InnoDB` triển khai `Repeatable Read`, nếu câu lệnh thực thi là Current Read thì nó sẽ sử dụng `Next-key Lock` lên các bản ghi đọc được để ngăn giao dịch khác chèn dữ liệu vào các khoảng trống (gap)**.

## Cách InnoDB triển khai MVCC

Việc triển khai `MVCC` phụ thuộc vào: **các cột ẩn (hidden columns), ReadView và undo log**. Trong hiện thực nội bộ, `InnoDB` dựa vào `DB_TRX_ID` của dòng dữ liệu và `ReadView` để xác định tính khả kiến của dữ liệu; nếu không khả kiến, nó sẽ thông qua `DB_ROLL_PTR` của dòng dữ liệu để tìm phiên bản lịch sử trong `undo log`. Phiên bản dữ liệu mà mỗi giao dịch đọc được có thể khác nhau; trong cùng một giao dịch, người dùng chỉ có thể nhìn thấy các thay đổi đã commit trước khi giao dịch tạo `ReadView` và các thay đổi do chính giao dịch đó thực hiện.

### Các cột ẩn (Hidden Columns)

Ở bên trong, Storage Engine `InnoDB` thêm ba [cột ẩn](https://dev.mysql.com/doc/refman/5.7/en/innodb-multi-versioning.html) cho mỗi dòng dữ liệu:

- `DB_TRX_ID (6 byte)`: biểu thị ID của giao dịch cuối cùng đã chèn hoặc cập nhật dòng đó. Ngoài ra, thao tác `delete` ở bên trong cũng được coi là một lần cập nhật, chỉ khác ở chỗ nó đánh dấu bit `deleted_flag` trong phần đầu bản ghi `Record header` là đã xóa.
- `DB_ROLL_PTR (7 byte)`: con trỏ rollback, trỏ đến `undo log` của dòng đó. Nếu dòng chưa từng được cập nhật thì giá trị này trống.
- `DB_ROW_ID (6 byte)`: nếu bảng không thiết lập khóa chính và cũng không có Unique Index khác null (non-null), `InnoDB` sẽ dùng ID này để tạo Clustered Index.

### ReadView

```c
class ReadView {
  /* ... */
private:
  trx_id_t m_low_limit_id;      /* Mọi giao dịch có ID >= giá trị này đều không khả kiến */

  trx_id_t m_up_limit_id;       /* Mọi giao dịch có ID < giá trị này đều khả kiến */

  trx_id_t m_creator_trx_id;    /* ID của giao dịch tạo ra ReadView này */

  trx_id_t m_low_limit_no;      /* Số hiệu giao dịch; Undo Logs nhỏ hơn số này đều có thể bị Purge */

  ids_t m_ids;                  /* Danh sách các giao dịch đang hoạt động tại thời điểm tạo ReadView */

  m_closed;                     /* Cờ đánh dấu ReadView đã đóng (close) hay chưa */
}
```

[`ReadView`](https://github.com/facebook/mysql-8.0/blob/8.0/storage/innobase/include/read0types.h#L298) chủ yếu dùng để kiểm tra tính khả kiến, bên trong lưu giữ "các giao dịch đang hoạt động khác hiện không khả kiến đối với giao dịch này".

Nó chủ yếu gồm các trường sau:

- `m_low_limit_id`: ID giao dịch lớn nhất từng xuất hiện tính đến hiện tại + 1, tức là ID giao dịch tiếp theo sẽ được cấp phát. Mọi phiên bản dữ liệu có ID lớn hơn hoặc bằng giá trị này đều không khả kiến.
- `m_up_limit_id`: ID giao dịch nhỏ nhất trong danh sách giao dịch đang hoạt động `m_ids`; nếu `m_ids` rỗng thì `m_up_limit_id` bằng `m_low_limit_id`. Mọi phiên bản dữ liệu có ID nhỏ hơn giá trị này đều khả kiến.
- `m_ids`: danh sách ID của các giao dịch khác đang hoạt động (chưa commit) tại thời điểm `ReadView` được tạo. Khi tạo `ReadView`, các ID giao dịch chưa commit hiện tại được ghi lại; về sau dù chúng có sửa đổi giá trị dòng bản ghi thì đối với giao dịch hiện tại vẫn không khả kiến. `m_ids` không bao gồm chính giao dịch hiện tại và các giao dịch đã commit (được giữ trong bộ nhớ).
- `m_creator_trx_id`: ID của giao dịch đã tạo ra `ReadView` này.

**Sơ đồ minh họa tính khả kiến của giao dịch** ([Nguồn ảnh](https://leviathan.vip/2019/03/20/InnoDB%E7%9A%84%E4%BA%8B%E5%8A%A1%E5%88%86%E6%9E%90-MVCC/#MVCC-1)):

![trans_visible](/media/jg/local/database/mysql/images/mvvc/trans_visible-4cbbb3.png)

### Undo Log

`undo log` có hai công dụng chính:

- Khi giao dịch rollback, dùng để khôi phục dữ liệu về trạng thái trước khi sửa đổi.
- Công dụng khác là phục vụ `MVCC`: khi đọc bản ghi, nếu bản ghi đang bị giao dịch khác chiếm giữ hoặc phiên bản hiện tại không khả kiến với giao dịch đang đọc, có thể thông qua `undo log` để đọc dữ liệu phiên bản trước đó, qua đó hiện thực hóa cơ chế đọc không khóa.

**Trong Storage Engine `InnoDB`, `undo log` được chia làm hai loại: `insert undo log` và `update undo log`:**

1. **`insert undo log`**: chỉ `undo log` sinh ra trong thao tác `insert`. Vì bản ghi từ thao tác `insert` chỉ khả kiến với chính giao dịch đó chứ không khả kiến với giao dịch khác, nên `undo log` này có thể được xóa trực tiếp ngay sau khi giao dịch commit mà không cần thao tác `purge`.

**Trạng thái ban đầu của dữ liệu khi `insert`:**

![](/media/jg/local/database/mysql/images/mvvc/317e91e1-1ee1-42ad-9412-9098d5c6a9ad-4380e2.png)

2. **`update undo log`**: `undo log` sinh ra trong thao tác `update` hoặc `delete`. Vì `undo log` này có thể cần phục vụ cơ chế `MVCC`, nên không thể xóa ngay khi giao dịch commit. Khi commit, nó được đưa vào danh sách liên kết `undo log` và chờ `purge thread` thực hiện xóa sau cùng.

**Khi dữ liệu bị sửa đổi lần thứ nhất:**

![](/media/jg/local/database/mysql/images/mvvc/c52ff79f-10e6-46cb-b5d4-3c9cbcc1934a-dc85da.png)

**Khi dữ liệu bị sửa đổi lần thứ hai:**

![](/media/jg/local/database/mysql/images/mvvc/6a276e7a-b0da-4c7b-bdf7-c0c7b7b3b31c-912d05.png)

Các sửa đổi của những giao dịch khác nhau hoặc cùng một giao dịch lên cùng một dòng bản ghi sẽ khiến `undo log` của dòng đó trở thành một danh sách liên kết: đầu danh sách là bản ghi mới nhất, và cuối danh sách là bản ghi cũ sớm nhất.

### Thuật toán kiểm tra khả năng hiển thị dữ liệu

Trong Storage Engine `InnoDB`, sau khi tạo một giao dịch mới, trước khi thực thi câu lệnh `select`, hệ thống sẽ tạo một ảnh chụp (`ReadView`), **trong đó lưu giữ số ID của các giao dịch hiện đang ở trạng thái hoạt động (chưa commit) trong hệ quản trị cơ sở dữ liệu**. Nói đơn giản thì nó lưu danh sách ID của các giao dịch khác (`m_ids`) mà hiện tại giao dịch này không được phép nhìn thấy. Khi người dùng đọc một dòng bản ghi trong giao dịch này, `InnoDB` sẽ đem `DB_TRX_ID` của dòng đó so sánh với các biến trong `ReadView` và ID giao dịch hiện tại để phán đoán xem có thỏa mãn điều kiện khả kiến hay không.

[Thuật toán so sánh cụ thể](https://github.com/facebook/mysql-8.0/blob/8.0/storage/innobase/include/read0types.h#L161) như sau ([Nguồn ảnh](https://leviathan.vip/2019/03/20/InnoDB%E7%9A%84%E4%BA%8B%E5%8A%A1%E5%88%86%E6%9E%90-MVCC/#MVCC-1)):

![](/media/jg/local/database/mysql/images/mvvc/8778836b-34a8-480b-b8c7-654fe207a8c2-3b7325.png)

1. Nếu `DB_TRX_ID < m_up_limit_id` của bản ghi, điều đó chứng tỏ giao dịch sửa đổi dòng này gần nhất (`DB_TRX_ID`) đã commit từ trước khi giao dịch hiện tại tạo ảnh chụp, nên giá trị của dòng bản ghi này khả kiến đối với giao dịch hiện tại.

2. Nếu `DB_TRX_ID >= m_low_limit_id`, điều đó chứng tỏ giao dịch sửa đổi dòng này gần nhất (`DB_TRX_ID`) mới sửa đổi dòng này *sau* khi giao dịch hiện tại tạo ảnh chụp, nên giá trị của dòng bản ghi này không khả kiến đối với giao dịch hiện tại. Nhảy tới Bước 5.

3. Nếu `m_ids` rỗng, chứng tỏ trước khi giao dịch hiện tại tạo ảnh chụp, giao dịch sửa đổi dòng này đã commit rồi, nên giá trị của dòng bản ghi này khả kiến đối với giao dịch hiện tại.

4. Nếu `m_up_limit_id <= DB_TRX_ID < m_low_limit_id`, chứng tỏ giao dịch sửa đổi dòng này gần nhất (`DB_TRX_ID`) tại thời điểm giao dịch hiện tại tạo ảnh chụp có thể đang ở "trạng thái hoạt động" hoặc "trạng thái đã commit"; do đó phải tìm kiếm trong danh sách giao dịch đang hoạt động `m_ids` (trong mã nguồn dùng tìm kiếm nhị phân vì danh sách đã được sắp xếp):

   - Nếu tìm thấy `DB_TRX_ID` trong danh sách giao dịch đang hoạt động `m_ids`, chứng tỏ: (1) trước khi giao dịch hiện tại tạo ảnh chụp, giá trị dòng này đã bị giao dịch có ID là `DB_TRX_ID` sửa đổi nhưng chưa commit; hoặc (2) sau khi giao dịch hiện tại tạo ảnh chụp, giá trị dòng này bị giao dịch có ID là `DB_TRX_ID` sửa đổi. Trong các trường hợp này, giá trị dòng bản ghi đều không khả kiến với giao dịch hiện tại. Nhảy tới Bước 5.

   - Nếu không tìm thấy trong danh sách giao dịch đang hoạt động, chứng tỏ "giao dịch có ID là `trx_id`" sau khi sửa đổi "giá trị dòng bản ghi này" đã commit từ trước khi "giao dịch hiện tại" tạo ảnh chụp, nên dòng bản ghi khả kiến với giao dịch hiện tại.

5. Lấy bản ghi ảnh chụp từ `undo log` được trỏ tới bởi con trỏ `DB_ROLL_PTR` của dòng bản ghi này, dùng `DB_TRX_ID` của bản ghi ảnh chụp đó quay lại Bước 1 để phán đoán lại từ đầu, cho đến khi tìm được phiên bản ảnh chụp thỏa mãn điều kiện hoặc trả về rỗng.

## Sự khác biệt của MVCC ở hai mức cô lập RC và RR

Ở hai mức cô lập giao dịch `RC` và `RR` (mức cô lập mặc định của Storage Engine InnoDB), Storage Engine `InnoDB` đều sử dụng `MVCC` (đọc nhất quán không khóa), nhưng thời điểm chúng tạo `ReadView` lại khác nhau:

- Ở mức cô lập `RC`, hệ thống tạo một `ReadView` (danh sách `m_ids`) trước **`mỗi lần select`**.
- Ở mức cô lập `RR`, hệ thống chỉ tạo một `ReadView` (danh sách `m_ids`) trước **`lần select đầu tiên`** sau khi giao dịch bắt đầu.

## MVCC giải quyết vấn đề Non-Repeatable Read (Đọc không lặp lại) như thế nào

Mặc dù cả `RC` và `RR` đều thông qua `MVCC` để đọc dữ liệu ảnh chụp, nhưng do **thời điểm tạo `ReadView` khác nhau**, ở mức `RR` sẽ đạt được tính năng đọc lặp lại (Repeatable Read).

Lấy ví dụ:

![](/media/jg/local/database/mysql/images/mvvc/6fb2b9a1-5f14-4dec-a797-e4cf388ed413-8e96e8.png)

### Tình huống tạo ReadView ở mức RC

**1. Giả sử mốc thời gian đến `T4`, lúc này chuỗi phiên bản của dòng dữ liệu `id = 1` là:**

![](/media/jg/local/database/mysql/images/mvvc/a3fd1ec6-8f37-42fa-b090-7446d488fd04-fab9f1.png)

Do ở mức `RC` mỗi lần truy vấn đều tạo `ReadView`, và hai giao dịch `101`, `102` vẫn chưa commit, nên lúc này trong `ReadView` do giao dịch `103` tạo ra có các giao dịch đang hoạt động **`m_ids` là: `[101, 102]`**, `m_low_limit_id` là `104`, `m_up_limit_id` là `101`, `m_creator_trx_id` là `103`.

- Lúc này bản ghi mới nhất có `DB_TRX_ID` là `101`, thỏa `m_up_limit_id <= 101 < m_low_limit_id`, nên phải tìm trong danh sách `m_ids`, phát hiện `DB_TRX_ID` có trong danh sách, vậy bản ghi này không khả kiến.
- Dựa theo `DB_ROLL_PTR` tìm bản ghi phiên bản trước trong `undo log`, `DB_TRX_ID` của bản ghi trước vẫn là `101`, không khả kiến.
- Tiếp tục tìm bản ghi trước nữa có `DB_TRX_ID` là `1`, thỏa `1 < m_up_limit_id`, khả kiến; vì vậy giao dịch `103` truy vấn được dữ liệu là `name = Caihua`.

**2. Mốc thời gian đến `T6`, chuỗi phiên bản dữ liệu là:**

![](/media/jg/local/database/mysql/images/mvvc/528559e9-dae8-4d14-b78d-a5b657c88391-d75ed8.png)

Vì ở mức `RC` nên hệ thống tạo lại `ReadView`; lúc này giao dịch `101` đã commit còn `102` chưa commit, nên trong `ReadView` lúc này có các giao dịch đang hoạt động **`m_ids`: `[102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `102`, `m_creator_trx_id`: `103`.

- Lúc này bản ghi mới nhất có `DB_TRX_ID` là `102`, thỏa `m_up_limit_id <= 102 < m_low_limit_id`, tìm trong danh sách `m_ids` phát hiện `DB_TRX_ID` nằm trong danh sách, nên bản ghi này không khả kiến.
- Dựa theo `DB_ROLL_PTR` tìm bản ghi phiên bản trước trong `undo log`, `DB_TRX_ID` của bản ghi trước là `101`, thỏa `101 < m_up_limit_id`, bản ghi khả kiến; do đó tại thời điểm `T6` truy vấn được dữ liệu là `name = Li Si`, khác với kết quả truy vấn ở thời điểm `T4`—xảy ra hiện tượng đọc không lặp lại (Non-Repeatable Read)!

**3. Mốc thời gian đến `T9`, chuỗi phiên bản dữ liệu là:**

![](/media/jg/local/database/mysql/images/mvvc/6f82703c-36a1-4458-90fe-d7f4edbac71a-df999e.png)

Tạo lại `ReadView`; lúc này cả giao dịch `101` và `102` đều đã commit nên **`m_ids` rỗng**, suy ra `m_up_limit_id = m_low_limit_id = 104`, ID giao dịch của phiên bản mới nhất là `102`, thỏa `102 < m_low_limit_id`, khả kiến, kết quả truy vấn là `name = Zhao Liu`.

> **Tổng kết:** **Ở mức cô lập RC, giao dịch đều tạo và thiết lập một ReadView mới khi bắt đầu mỗi lần truy vấn, do đó dẫn đến hiện tượng đọc không lặp lại (Non-Repeatable Read).**

### Tình huống tạo ReadView ở mức RR

Ở mức cô lập Repeatable Read, hệ thống chỉ tạo một `ReadView` (danh sách `m_ids`) khi đọc dữ liệu lần đầu tiên sau khi giao dịch bắt đầu.

**1. Chuỗi phiên bản trong tình huống tại `T4`:**

![](/media/jg/local/database/mysql/images/mvvc/0e906b95-c916-4f30-beda-9cb3e49746bf-f19672.png)

Khi thực thi câu lệnh `select` hiện tại, một `ReadView` được tạo ra, lúc này **`m_ids`: `[101, 102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `101`, `m_creator_trx_id`: `103`.

Lúc này giống như ở mức `RC`:

- Bản ghi mới nhất có `DB_TRX_ID` là `101`, thỏa `m_up_limit_id <= 101 < m_low_limit_id`, tìm trong danh sách `m_ids` phát hiện `DB_TRX_ID` nằm trong danh sách, nên bản ghi này không khả kiến.
- Dựa theo `DB_ROLL_PTR` tìm bản ghi phiên bản trước trong `undo log`, `DB_TRX_ID` vẫn là `101`, không khả kiến.
- Tiếp tục tìm bản ghi trước nữa có `DB_TRX_ID` là `1`, thỏa `1 < m_up_limit_id`, khả kiến, nên giao dịch `103` truy vấn được dữ liệu là `name = Caihua`.

**2. Tại thời điểm `T6`:**

![](/media/jg/local/database/mysql/images/mvvc/79ed6142-7664-4e0b-9023-cf546586aa39-e565bf.png)

Ở mức `RR` chỉ tạo `ReadView` một lần, nên lúc này vẫn tiếp tục dùng lại **`m_ids`: `[101, 102]`**, `m_low_limit_id`: `104`, `m_up_limit_id`: `101`, `m_creator_trx_id`: `103`.

- Bản ghi mới nhất có `DB_TRX_ID` là `102`, thỏa `m_up_limit_id <= 102 < m_low_limit_id`, tìm trong danh sách `m_ids` phát hiện `DB_TRX_ID` có trong danh sách, vậy bản ghi này không khả kiến.
- Dựa theo `DB_ROLL_PTR` tìm bản ghi phiên bản trước trong `undo log`, `DB_TRX_ID` là `101`, không khả kiến.
- Tiếp tục dựa theo `DB_ROLL_PTR` tìm bản ghi phiên bản trước trong `undo log`, `DB_TRX_ID` vẫn là `101`, không khả kiến.
- Tiếp tục tìm bản ghi trước nữa có `DB_TRX_ID` là `1`, thỏa `1 < m_up_limit_id`, khả kiến, vì vậy giao dịch `103` truy vấn được dữ liệu là `name = Caihua`.

**3. Tại thời điểm `T9`:**

![](/media/jg/local/database/mysql/images/mvvc/cbbedbc5-0e3c-4711-aafd-7f3d68a4ed4e-23e882.png)

Tình huống lúc này giống hệt `T6`: vì đã tạo `ReadView` từ trước nên vẫn dùng lại **`m_ids`: `[101, 102]`**, do đó kết quả truy vấn vẫn là `name = Caihua`.

## MVCC + Next-Key Lock ngăn chặn Phantom Read

Storage Engine `InnoDB` giải quyết bài toán Phantom Read (đọc bóng ma) ở mức `RR` thông qua sự kết hợp giữa `MVCC` và `Next-key Lock`:

**1. Thực thi `select` thông thường: lúc này dữ liệu được đọc theo cơ chế Snapshot Read của `MVCC`**

Trong trường hợp Snapshot Read, mức cô lập `RR` chỉ tạo `ReadView` ở lần truy vấn đầu tiên sau khi mở giao dịch và giữ nguyên cho đến khi giao dịch commit. Vì thế các bản ghi được giao dịch khác cập nhật hoặc chèn mới sau khi `ReadView` được tạo đều không khả kiến đối với giao dịch hiện tại, giúp đạt được khả năng đọc lặp lại và ngăn chặn "Phantom Read" dưới chế độ Snapshot Read.

**2. Thực thi các lệnh Current Read như `select ... for update` / `lock in share mode`, `insert`, `update`, `delete`**

Trong Current Read, dữ liệu đọc được luôn là dữ liệu mới nhất; nếu giao dịch khác chèn thêm bản ghi mới và đúng vào phạm vi truy vấn của giao dịch hiện tại thì sẽ phát sinh Phantom Read! `InnoDB` sử dụng [Next-key Lock](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html#innodb-next-key-locks) để ngăn tình huống này. Khi thực thi Current Read, hệ thống vừa khóa các bản ghi đọc được, vừa khóa các khoảng trống (gap) của chúng, ngăn các giao dịch khác chèn dữ liệu vào phạm vi truy vấn. Chỉ cần không cho bạn chèn vào thì sẽ không xảy ra Phantom Read.

## Tài liệu tham khảo

- *MySQL Technology Insider: InnoDB Storage Engine (Ấn bản thứ 2)*
- [Mối quan hệ giữa các mức cô lập giao dịch và khóa trong InnoDB](https://tech.meituan.com/2014/08/20/innodb-lock.html)
- [Giao dịch MySQL và MVCC triển khai các mức cô lập như thế nào](https://blog.csdn.net/qq_35190492/article/details/109044141)
- [Phân tích giao dịch InnoDB - MVCC](https://leviathan.vip/2019/03/20/InnoDB%E7%9A%84%E4%BA%8B%E5%8A%A1%E5%88%86%E6%9E%90-MVCC/)
