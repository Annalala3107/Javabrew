---
title: Giải thích chi tiết về các mức cô lập Transaction trong MySQL
description: Giải thích chi tiết đặc điểm và sự khác biệt giữa bốn mức cô lập Transaction trong MySQL (Read Uncommitted, Read Committed, Repeatable Read, Serializable), phân tích các vấn đề đồng thời như Dirty Read, Non-repeatable Read, Phantom Read, cùng cách InnoDB giải quyết Phantom Read thông qua MVCC và cơ chế khóa.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: Mức cô lập Transaction MySQL,Read Uncommitted,Read Committed,Repeatable Read,Serializable,Dirty Read,Non-repeatable Read,Phantom Read,MVCC,Gap Lock
lang: vi
sourceRef: zh-ref/database/mysql/transaction-isolation-level.md
---

> Bài viết được hoàn thành chung bởi [SnailClimb](https://github.com/Snailclimb) và [guang19](https://github.com/guang19).

Để tìm hiểu tổng quan cơ bản về Transaction, vui lòng xem bài viết này: [Tổng hợp kiến thức nền tảng & câu hỏi phỏng vấn MySQL thường gặp](./mysql-questions-01.md#MySQL-事务).

## Tổng hợp các mức cô lập Transaction

Chuẩn SQL định nghĩa bốn mức cô lập Transaction (Transaction Isolation Level) nhằm cân bằng giữa tính cô lập (Isolation) của Transaction và hiệu năng xử lý đồng thời. Mức cô lập càng cao thì tính nhất quán dữ liệu càng tốt, nhưng hiệu năng đồng thời có thể giảm xuống. Bốn mức này gồm:

- **READ-UNCOMMITTED (Đọc chưa commit)**: Mức cô lập thấp nhất, cho phép đọc các thay đổi dữ liệu chưa được commit, có thể dẫn đến Dirty Read, Phantom Read hoặc Non-repeatable Read. Mức này rất ít được dùng trong ứng dụng thực tế vì mức độ đảm bảo tính nhất quán dữ liệu quá yếu.
- **READ-COMMITTED (Đọc đã commit)**: Cho phép đọc dữ liệu mà các Transaction đồng thời đã commit; có thể ngăn chặn Dirty Read, nhưng Phantom Read hoặc Non-repeatable Read vẫn có khả năng xảy ra. Đây là mức cô lập mặc định của đa số hệ quản trị cơ sở dữ liệu (như Oracle, SQL Server).
- **REPEATABLE-READ (Đọc lặp lại được)**: Kết quả nhiều lần đọc cùng một trường đều nhất quán, trừ khi dữ liệu bị chính Transaction hiện tại sửa đổi; có thể ngăn chặn Dirty Read và Non-repeatable Read, nhưng Phantom Read vẫn có khả năng xảy ra. Mức cô lập mặc định của Storage Engine InnoDB trong MySQL chính là `REPEATABLE READ`. Hơn nữa, ở mức này InnoDB thông qua cơ chế MVCC (Multi-Version Concurrency Control — Kiểm soát đồng thời đa phiên bản) và Next-Key Lock (Gap Lock + Record Lock) đã giải quyết được phần lớn vấn đề Phantom Read.
- **SERIALIZABLE (Tuần tự hóa)**: Mức cô lập cao nhất, tuân thủ hoàn toàn tính cô lập của ACID. Tất cả các Transaction được thực thi tuần tự từng cái một, nên giữa các Transaction hoàn toàn không thể xảy ra can thiệp lẫn nhau; nói cách khác, mức này ngăn chặn được cả Dirty Read, Non-repeatable Read lẫn Phantom Read.

| Mức cô lập (Isolation Level) | Dirty Read (Đọc bẩn) | Non-Repeatable Read (Đọc không lặp lại) | Phantom Read (Đọc ảo)       |
| ---------------------------- | -------------------- | --------------------------------------- | --------------------------- |
| READ UNCOMMITTED             | √                    | √                                       | √                           |
| READ COMMITTED               | ×                    | √                                       | √                           |
| REPEATABLE READ              | ×                    | ×                                       | √ (Chuẩn) / ≈× (InnoDB)     |
| SERIALIZABLE                 | ×                    | ×                                       | ×                           |

**Kiểm tra mức cô lập mặc định:**

Mức cô lập mặc định của Storage Engine InnoDB trong MySQL là **REPEATABLE READ**. Có thể kiểm tra bằng lệnh sau:

- Trước MySQL 8.0: `SELECT @@tx_isolation;`
- Từ MySQL 8.0 trở đi: `SELECT @@transaction_isolation;`

```bash
mysql> SELECT @@transaction_isolation;
+-------------------------+
| @@transaction_isolation |
+-------------------------+
| REPEATABLE-READ         |
+-------------------------+
```

**Cách REPEATABLE READ của InnoDB xử lý Phantom Read:**

Trong định nghĩa chuẩn của SQL về các mức cô lập, `REPEATABLE READ` không ngăn được Phantom Read. Nhưng cách triển khai của InnoDB đã hạn chế phần lớn Phantom Read thông qua các cơ chế sau:

- **Snapshot Read (Đọc ảnh chụp)**: Các câu lệnh `SELECT` thông thường, được thực hiện thông qua cơ chế **MVCC**. Khi Transaction bắt đầu, một snapshot dữ liệu được tạo ra, và các lần Snapshot Read tiếp theo đều đọc phiên bản dữ liệu này, qua đó tránh nhìn thấy các dòng mới do Transaction khác chèn vào (Phantom Read) hoặc sửa đổi (Non-repeatable Read).
- **Current Read (Đọc hiện tại)**: Các thao tác như `SELECT ... FOR UPDATE`, `SELECT ... LOCK IN SHARE MODE`, `INSERT`, `UPDATE`, `DELETE`. InnoDB sử dụng **Next-Key Lock** để khóa các bản ghi Index được quét tới cùng khoảng trống (gap) giữa chúng, ngăn các Transaction khác chèn bản ghi mới vào phạm vi này, từ đó tránh Phantom Read. Next-Key Lock là sự kết hợp giữa Record Lock (khóa dòng) và Gap Lock (khóa khoảng trống).

Đáng lưu ý rằng mặc dù thông thường người ta cho rằng mức cô lập càng cao thì khả năng xử lý đồng thời càng kém, nhưng Storage Engine InnoDB đã tối ưu hóa mức `REPEATABLE READ` bằng cơ chế MVCC. Đối với nhiều kịch bản chỉ đọc hoặc đọc nhiều ghi ít phổ biến, hiệu năng của nó **so với `READ COMMITTED` có thể không có sự khác biệt đáng kể**. Tuy nhiên, trong các kịch bản ghi nhiều (write-intensive) và xung đột đồng thời cao, cơ chế Gap Lock của RR có thể gây ra nhiều thời gian chờ khóa (lock wait) hơn so với RC.

Ngoài ra, trong một số kịch bản đặc thù như Transaction phân tán đòi hỏi tính nhất quán nghiêm ngặt (XA Transactions), InnoDB có thể yêu cầu hoặc khuyến nghị mức cô lập `SERIALIZABLE` để đảm bảo tính nhất quán dữ liệu toàn cục.

Mục 7.7 của cuốn *MySQL Internals: InnoDB Storage Engine (2nd Edition)* (Kỹ thuật nội bộ MySQL: Storage Engine InnoDB, tái bản lần 2) viết như sau:

> Storage Engine InnoDB hỗ trợ XA Transaction và thông qua XA Transaction để hỗ trợ triển khai Transaction phân tán. Transaction phân tán cho phép nhiều tài nguyên giao dịch độc lập (transactional resources) cùng tham gia vào một Transaction toàn cục. Tài nguyên giao dịch thường là hệ quản trị cơ sở dữ liệu quan hệ, nhưng cũng có thể là các loại tài nguyên khác. Transaction toàn cục đòi hỏi tất cả các Transaction thành phần tham gia hoặc đều phải commit, hoặc đều phải rollback, điều này đặt ra yêu cầu cao hơn nữa so với chuẩn ACID vốn có của Transaction đơn lẻ. Ngoài ra, khi sử dụng Transaction phân tán, mức cô lập Transaction của Storage Engine InnoDB bắt buộc phải thiết lập thành `SERIALIZABLE`.

## Minh họa tình huống thực tế

Dưới đây mình sẽ dùng 2 cửa sổ dòng lệnh MySQL để mô phỏng đa luồng (nhiều Transaction) gặp vấn đề Dirty Read trên cùng một phần dữ liệu.

Trong cấu hình mặc định của dòng lệnh MySQL, mọi Transaction đều tự động commit (autocommit), tức là ngay sau khi thực thi câu lệnh SQL sẽ thực hiện thao tác `COMMIT` ngay lập tức. Nếu muốn mở một Transaction một cách tường minh thì cần dùng lệnh: `START TRANSACTION`.

Chúng ta có thể thiết lập mức cô lập thông qua lệnh sau:

```sql
SET [SESSION|GLOBAL] TRANSACTION ISOLATION LEVEL [READ UNCOMMITTED|READ COMMITTED|REPEATABLE READ|SERIALIZABLE]
```

Hãy xem lại một số câu lệnh kiểm soát đồng thời sẽ sử dụng trong phần thực hành bên dưới:

- `START TRANSACTION` | `BEGIN`: Mở một Transaction một cách tường minh.
- `COMMIT`: Commit Transaction, biến mọi thay đổi đối với cơ sở dữ liệu thành vĩnh viễn.
- `ROLLBACK`: Rollback để kết thúc Transaction của người dùng và hủy bỏ toàn bộ các thay đổi chưa commit đang thực hiện.

### Dirty Read (Read Uncommitted)

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-31-1--56de2c6e.png)

### Tránh Dirty Read (Read Committed)

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-31-2-162f70a6.png)

### Non-Repeatable Read (Đọc không lặp lại)

Vẫn với hình minh họa Read Committed ngay phía trên: mặc dù đã tránh được Dirty Read của Read Uncommitted, nhưng lại xuất hiện tình huống một Transaction chưa kết thúc đã xảy ra vấn đề Non-Repeatable Read.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-32-1-6916fdbe.png)

### Repeatable Read (Đọc lặp lại được)

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/2019-33-2-e2fd7d76.png)

### Phantom Read (Đọc ảo)

#### Minh họa trường hợp xảy ra Phantom Read

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/phantom_read-54471741.png)

Ở lần truy vấn đầu tiên tìm các bản ghi có mức lương 500, script SQL 1 chỉ thấy 1 bản ghi; script SQL 2 chèn thêm 1 bản ghi có mức lương 500 và commit; sau đó script SQL 1 trong cùng Transaction truy vấn lại bằng Current Read thì phát hiện xuất hiện 2 bản ghi có mức lương 500 — đây chính là Phantom Read.

Lưu ý: Ví dụ này về bản chất là do ngữ nghĩa đọc của lần đầu (Snapshot Read) và lần hai (Current Read) khác nhau. Dưới mức RR, MVCC có thể đảm bảo Snapshot Read không gặp Phantom Read, còn Next-Key Lock ràng buộc Current Read; nhưng khi dùng lẫn lộn Snapshot Read và Current Read trong cùng một Transaction, kết quả hai lần đọc có thể khác nhau.

#### Cách giải quyết Phantom Read

Có nhiều cách giải quyết Phantom Read, nhưng tư tưởng cốt lõi của chúng đều là: khi một Transaction đang thao tác trên dữ liệu của một bảng nào đó, không cho phép Transaction khác thêm mới hoặc xóa dữ liệu trong bảng đó nữa. Các cách giải quyết Phantom Read chủ yếu gồm:

1. Nâng mức cô lập Transaction lên `SERIALIZABLE`.
2. Dưới mức cô lập Repeatable Read, gắn khóa bảng (Table Lock) cho bảng mà Transaction đang thao tác.
3. Dưới mức cô lập Repeatable Read, áp dụng `Next-key Lock (Record Lock + Gap Lock)` trên bảng mà Transaction đang thao tác.

### Tài liệu tham khảo

- *MySQL Internals: InnoDB Storage Engine* (Kỹ thuật nội bộ MySQL: Storage Engine InnoDB)
- <https://dev.MySQL.com/doc/refman/5.7/en/>
- [Khóa trong MySQL: Bảy câu hỏi xoáy tận tâm can](https://tech.youzan.com/seven-questions-about-the-lock-of-MySQL/)
- [Mối quan hệ giữa mức cô lập Transaction và khóa trong InnoDB](https://tech.meituan.com/2014/08/20/innodb-lock.html)
