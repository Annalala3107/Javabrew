---
title: Quy trình thực thi câu lệnh SQL trong MySQL
description: Giải thích chi tiết toàn bộ quy trình thực thi câu lệnh SQL trong MySQL, từ xác thực danh tính ở Connector, Query Cache, phân tích cú pháp ở Analyzer, tạo Execution Plan ở Optimizer cho đến việc Executor gọi Storage Engine.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: Quy trình thực thi MySQL,Quy trình thực thi SQL,Connector,Parser,Optimizer,Executor,Server Layer,Storage Engine,InnoDB
lang: vi
sourceRef: zh-ref/database/mysql/how-sql-executed-in-mysql.md
---

> Bài viết được đóng góp bởi [Mumujiang](https://github.com/kinglaw1204).

Bài viết này sẽ phân tích quy trình thực thi một câu lệnh SQL trong MySQL, bao gồm cách câu truy vấn SQL luân chuyển bên trong MySQL và cách câu lệnh cập nhật SQL được hoàn tất.

Trước khi đi vào phân tích, mình sẽ dẫn bạn xem qua kiến trúc cơ bản của MySQL. Khi biết MySQL gồm những thành phần nào và vai trò của từng thành phần là gì, chúng ta sẽ dễ dàng hiểu và giải quyết những vấn đề này hơn.

## 1. Phân tích kiến trúc cơ bản của MySQL

### 1.1 Tổng quan kiến trúc cơ bản của MySQL

Hình dưới đây là sơ đồ kiến trúc tóm tắt của MySQL. Từ hình này, bạn có thể thấy rất rõ câu lệnh SQL của người dùng được thực thi như thế nào bên trong MySQL.

Trước hết hãy giới thiệu ngắn gọn vai trò cơ bản của các thành phần liên quan trong hình để giúp mọi người dễ hình dung; mục 1.2 sẽ trình bày chi tiết chức năng của từng thành phần này.

- **Connector (Bộ kết nối):** Xử lý xác thực danh tính và kiểm tra phân quyền (khi đăng nhập vào MySQL).
- **Query Cache (Bộ nhớ đệm truy vấn):** Khi thực thi câu lệnh truy vấn, MySQL sẽ kiểm tra cache trước (đã bị loại bỏ từ phiên bản MySQL 8.0 vì tính năng này không thực dụng trong thực tế).
- **Analyzer (Bộ phân tích):** Nếu không trúng cache (cache miss), câu lệnh SQL sẽ đi qua Analyzer. Nói đơn giản, Analyzer trước tiên xem câu SQL của bạn định làm gì, sau đó kiểm tra xem cú pháp câu SQL có hợp lệ hay không.
- **Optimizer (Bộ tối ưu hóa):** Thực thi theo phương án mà MySQL cho là tối ưu nhất.
- **Executor (Bộ thực thi):** Thực thi câu lệnh, sau đó trả về dữ liệu từ Storage Engine.

![](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

Nói một cách đơn giản, MySQL chủ yếu được chia thành **Server Layer (tầng Server)** và **Storage Engine Layer (tầng Storage Engine)**:

- **Server Layer**: Chủ yếu bao gồm Connector, Query Cache, Analyzer, Optimizer, Executor, v.v. Toàn bộ các tính năng xuyên Storage Engine đều được triển khai tại tầng này, chẳng hạn như Stored Procedure, Trigger, View, Function, cùng một module log dùng chung là module `binlog`.
- **Storage Engine Layer**: Chủ yếu chịu trách nhiệm lưu trữ và đọc dữ liệu, sử dụng kiến trúc dạng plugin có thể thay thế được, hỗ trợ nhiều Storage Engine như InnoDB, MyISAM, Memory, trong đó InnoDB có module log riêng là module `redo log`. **Hiện nay Storage Engine được sử dụng phổ biến nhất là InnoDB; nó đã trở thành Storage Engine mặc định kể từ phiên bản MySQL 5.5.**

### 1.2 Giới thiệu các thành phần cơ bản của Server Layer

#### 1) Connector

Connector chủ yếu phụ trách các chức năng liên quan đến xác thực danh tính và quyền hạn, giống như một người gác cổng cấp cao.

Thành phần này chịu trách nhiệm cho việc người dùng đăng nhập cơ sở dữ liệu, thực hiện xác thực danh tính người dùng, bao gồm kiểm tra tài khoản, mật khẩu, quyền hạn, v.v. Nếu tài khoản và mật khẩu hợp lệ, Connector sẽ tra cứu toàn bộ quyền của người dùng đó trong bảng phân quyền. Sau đó, mọi phán đoán logic về quyền hạn trong kết nối này đều phụ thuộc vào dữ liệu quyền đã đọc tại thời điểm đó; nói cách khác, chỉ cần kết nối này chưa ngắt, ngay cả khi quản trị viên thay đổi quyền của người dùng đó thì người dùng vẫn không bị ảnh hưởng.

#### 2) Query Cache (Đã bị loại bỏ sau MySQL 8.0)

Query Cache chủ yếu dùng để lưu trữ tạm các câu lệnh `SELECT` mà chúng ta đã thực thi cùng tập kết quả (result set) của câu lệnh đó.

Sau khi kết nối được thiết lập, khi thực thi câu truy vấn, MySQL sẽ kiểm tra Query Cache trước để xác minh xem câu SQL này đã từng được thực thi hay chưa. Dữ liệu được cache trong bộ nhớ dưới dạng Key-Value, trong đó Key là câu truy vấn và Value là tập kết quả. Nếu cache key trúng (cache hit), kết quả được trả thẳng về cho client; nếu không trúng (cache miss), các bước tiếp theo mới được thực thi, và sau khi xong cũng lưu kết quả vào cache để thuận tiện cho lần gọi kế tiếp. Tất nhiên, khi thực sự kiểm tra Query Cache, MySQL vẫn sẽ xác thực quyền của người dùng, chẳng hạn xem người dùng có quyền truy vấn bảng đó hay không.

MySQL không khuyến nghị dùng Query Cache, bởi trong các kịch bản nghiệp vụ thực tế, việc Query Cache bị vô hiệu hóa có thể xảy ra rất thường xuyên: giả sử bạn cập nhật một bảng, toàn bộ Query Cache trên bảng đó sẽ bị xóa sạch. Đối với dữ liệu ít khi cập nhật thì dùng cache vẫn chấp nhận được.

Vì vậy, trong đa số trường hợp chúng ta đều không khuyến nghị sử dụng Query Cache.

Kể từ phiên bản MySQL 8.0, tính năng Query Cache đã bị xóa bỏ hoàn toàn vì phía phát triển chính thức cũng nhận thấy tính năng này có quá ít kịch bản ứng dụng thực tế nên đã loại bỏ thẳng.

#### 3) Analyzer

Nếu MySQL không trúng cache, câu lệnh sẽ đi vào Analyzer. Analyzer chủ yếu phân tích xem câu lệnh SQL định làm gì và cũng chia làm các bước:

**Bước 1: Phân tích từ vựng (Lexical Analysis).** Một câu lệnh SQL gồm nhiều chuỗi ký tự cấu thành; trước tiên cần trích xuất các từ khóa như `select`, trích xuất tên bảng cần truy vấn, tên các cột, điều kiện truy vấn, v.v. Sau khi hoàn tất các thao tác này sẽ bước sang bước thứ hai.

**Bước 2: Phân tích cú pháp (Syntax Analysis).** Chủ yếu phán đoán xem câu SQL bạn nhập có đúng hay không, có tuân thủ ngữ pháp của MySQL hay không.

Sau khi hoàn thành 2 bước này, MySQL đã sẵn sàng bắt đầu thực thi, nhưng thực thi như thế nào, cách nào cho kết quả tốt nhất? Lúc này Optimizer cần vào cuộc.

#### 4) Optimizer

Vai trò của Optimizer là thực thi theo phương án mà nó cho là tối ưu nhất (đôi khi có thể cũng không phải tối ưu nhất; bài viết này có đề cập đến phần giải thích chuyên sâu về mảng kiến thức này), ví dụ khi có nhiều Index thì nên chọn Index nào, khi truy vấn nhiều bảng thì chọn thứ tự nối bảng (Join) ra sao, v.v.

Có thể nói, sau khi đi qua Optimizer, việc câu lệnh này sẽ được thực thi cụ thể ra sao đã được chốt định.

#### 5) Executor

Sau khi phương án thực thi được lựa chọn, MySQL chuẩn bị bắt đầu thực thi. Trước tiên, trước khi chạy, hệ thống sẽ kiểm tra xem người dùng có quyền hay không: nếu không có quyền thì trả về thông báo lỗi; nếu có quyền thì gọi tới interface của Storage Engine và trả về kết quả thực thi từ engine.

## 2. Phân tích câu lệnh

### 2.1 Câu lệnh truy vấn

Nói nhiều như vậy rồi, rốt cuộc một câu lệnh SQL được thực thi như thế nào? Thực ra SQL của chúng ta có thể chia làm hai loại: một là truy vấn (query), hai là cập nhật (thêm, sửa, xóa). Trước tiên hãy phân tích câu lệnh truy vấn với câu SQL sau:

```sql
select * from tb_student  A where A.age='18' and A.name=' 张三 ';
```

Kết hợp với giải thích ở trên, hãy phân tích quy trình thực thi của câu lệnh này:

- Đầu tiên thực hiện xác thực danh tính và lấy thông tin quyền thông qua Connector (nếu xác thực thất bại sẽ từ chối trực tiếp). Trước phiên bản MySQL 8.0, sau khi xác thực thành công, hệ thống sẽ kiểm tra Query Cache trước, dùng chính câu SQL này làm key để tìm kết quả trong bộ nhớ; nếu có thì trả thẳng từ cache, nếu không thì thực hiện bước tiếp theo.
- Thực hiện phân tích từ vựng qua Analyzer, trích xuất các thành phần cốt lõi của câu SQL: chẳng hạn xác định câu lệnh trên là truy vấn `select`, trích xuất tên bảng cần truy vấn là `tb_student`, cần truy vấn tất cả các cột và điều kiện truy vấn của bảng này là `id='1'`. Sau đó kiểm tra xem câu SQL có lỗi cú pháp không (như từ khóa có đúng không, v.v.), nếu kiểm tra không có vấn đề gì thì sang bước tiếp theo.
- Tiếp theo là Optimizer xác định Execution Plan. Với câu SQL trên, có thể có hai phương án thực thi: a. trước tiên truy vấn các sinh viên có tên là `' 张三 '` (Zhang San) trong bảng `tb_student`, sau đó kiểm tra xem tuổi có phải 18 không; b. trước tiên tìm các sinh viên có tuổi là 18, sau đó kiểm tra xem tên có phải `' 张三 '` hay không. Khi đó Optimizer dựa vào thuật toán tối ưu của mình để chọn một phương án có hiệu suất thực thi tốt nhất (theo đánh giá của Optimizer, đôi khi chưa chắc là tốt nhất). Sau khi chốt Execution Plan thì chuẩn bị bắt đầu thực thi.
- Thực hiện kiểm tra quyền hạn: nếu không có quyền sẽ trả về thông báo lỗi; nếu có quyền sẽ gọi interface của Storage Engine cơ sở dữ liệu và trả về kết quả thực thi của engine.

### 2.2 Câu lệnh cập nhật

Trên đây là quy trình thực thi của một câu SQL truy vấn, vậy tiếp theo hãy xem một câu lệnh cập nhật được thực thi như thế nào? Câu lệnh SQL như sau:

```plain
update tb_student A set A.age='19' where A.name=' 张三 ';
```

Chúng ta cập nhật tuổi cho `' 张三 '`. Trong cơ sở dữ liệu thực tế chắc chắn sẽ không thiết kế cột `age` như vậy đâu, không thì sẽ bị Tech Lead "xử đẹp" mất. Thực ra câu lệnh này về cơ bản cũng đi theo quy trình giống câu truy vấn trước, chỉ khác là khi thực thi cập nhật chắc chắn phải ghi log, từ đó kéo theo sự tham gia của các module log. Module log tích hợp sẵn của MySQL là **`binlog` (log lưu trữ nhị phân)** dùng được cho mọi Storage Engine, còn InnoDB Engine chúng ta hay dùng có thêm module log riêng là **`redo log`**. Hãy cùng tìm hiểu quy trình thực thi của câu lệnh này dưới chế độ InnoDB:

- Đầu tiên truy vấn tìm ra bản ghi của `' 张三 '`. Bước này sẽ không đi qua Query Cache, vì quy tắc thiết kế của Query Cache là chỉ phục vụ các câu lệnh dạng truy vấn đọc.
- Tiếp theo lấy kết quả vừa truy vấn, sửa `age` thành `19`, rồi gọi API của engine để ghi dòng dữ liệu này. InnoDB Engine lưu dữ liệu trong bộ nhớ đồng thời ghi `redo log`; lúc này `redo log` chuyển sang trạng thái `prepare`, sau đó báo cho Executor biết đã thực thi xong và sẵn sàng commit bất kỳ lúc nào.
- Executor sau khi nhận thông báo sẽ ghi `binlog`, rồi xóa Query Cache của bảng này. Xóa cache tại thời điểm này giúp đảm bảo các câu `SELECT` tiếp theo không đọc phải cache cũ — bởi vì Transaction sắp commit cuối cùng và dữ liệu sắp chuyển sang trạng thái mới nhất, nên thời điểm làm mất hiệu lực cache khớp đúng với thời điểm cập nhật dữ liệu thực tế.
- Executor gọi interface của engine để commit `redo log` sang trạng thái `commit`.
- Quá trình cập nhật hoàn tất.

**Chắc chắn sẽ có bạn thắc mắc: tại sao phải dùng tới hai module log, chỉ dùng một module log không được sao?**

Điều này là do ban đầu MySQL không có InnoDB Engine (InnoDB Engine do một công ty khác tích hợp vào MySQL dưới dạng plugin). Engine có sẵn của MySQL là MyISAM, nhưng chúng ta biết `redo log` là đặc thù riêng của InnoDB Engine mà các Storage Engine khác không có, dẫn tới không có khả năng `crash-safe` (khả năng `crash-safe` nghĩa là ngay cả khi cơ sở dữ liệu gặp sự cố khởi động lại bất thường, các bản ghi đã commit trước đó vẫn không bị mất); còn `binlog` chỉ dùng được cho mục đích lưu trữ/sao chép.

Không phải cứ chỉ dùng một module log là bất khả thi, mà là InnoDB Engine vốn hỗ trợ Transaction thông qua `redo log`. Vậy lại có bạn hỏi: tôi dùng hai module log, nhưng không cần phức tạp thế có được không, tại sao `redo log` phải đưa thêm trạng thái tiền commit `prepare`? Ở đây ta dùng phương pháp chứng minh phản chứng để giải thích lý do phải làm như vậy:

- **Ghi `redo log` rồi commit thẳng trước, sau đó mới ghi `binlog`**: Giả sử sau khi ghi xong `redo log` thì máy bị sập, `binlog` chưa được ghi. Khi máy khởi động lại, máy này sẽ khôi phục dữ liệu thông qua `redo log`, nhưng lúc này `binlog` lại không ghi nhận bản ghi đó; về sau khi sao lưu/khôi phục từ `binlog` sẽ bị mất dòng dữ liệu này, đồng thời sao chép Master-Replica cũng bị thiếu dòng dữ liệu này.
- **Ghi `binlog` trước, sau đó mới ghi `redo log`**: Giả sử sau khi ghi xong `binlog` thì máy khởi động lại bất thường. Do không có `redo log`, máy cục bộ không thể khôi phục bản ghi này, nhưng trong `binlog` lại có ghi nhận; theo đúng lý lẽ như trên, sẽ phát sinh tình trạng dữ liệu không nhất quán.

Nếu áp dụng cơ chế Two-Phase Commit (commit hai pha) của `redo log` thì mọi chuyện sẽ khác: đầu tiên ghi xong `redo log` và đánh dấu là `prepare`, ngay sau đó ghi xong `binlog`, rồi cuối cùng đánh dấu `redo log` là `commit` là có thể ngăn chặn các vấn đề nêu trên, qua đó đảm bảo tính nhất quán dữ liệu.

Vậy câu hỏi đặt ra là: có tình huống cực đoan nào không? Giả sử `redo log` đang ở trạng thái `prepare`, `binlog` cũng đã ghi xong rồi, đúng lúc đó xảy ra khởi động lại bất thường thì sẽ thế nào?

Điều này phụ thuộc vào cơ chế xử lý của MySQL. Quy trình xử lý của MySQL như sau:

- Kiểm tra xem `redo log` có ở trạng thái `commit` hay không; nếu có, chứng tỏ `binlog` chắc chắn đã hoàn tất ghi xuống đĩa (flush), nên commit ngay lập tức.
- Nếu `redo log` mới chỉ ở trạng thái `prepare` chứ chưa phải `commit`, lúc này hệ thống sẽ lấy `XID` của Transaction để kiểm tra trong `binlog` xem Transaction đó đã hoàn tất flush xuống đĩa hay chưa: nếu rồi thì commit `redo log`, ngược lại thì rollback Transaction.

Như vậy đã giải quyết được triệt để bài toán nhất quán dữ liệu.

## 3. Tổng kết

- MySQL chủ yếu được chia thành Server Layer và Engine Layer. Server Layer bao gồm Connector, Query Cache, Analyzer, Optimizer, Executor cùng một module log (`binlog`) dùng chung cho mọi Storage Engine, còn `redo log` chỉ riêng InnoDB mới có.
- Engine Layer có kiến trúc dạng plugin, hiện chủ yếu gồm MyISAM, InnoDB, Memory, v.v.
- Quy trình thực thi câu lệnh truy vấn như sau: Kiểm tra quyền (nếu trúng cache) ---> Query Cache ---> Analyzer ---> Optimizer ---> Kiểm tra quyền ---> Executor ---> Storage Engine.
- Quy trình thực thi câu lệnh cập nhật như sau: Analyzer ----> Kiểm tra quyền ----> Executor ---> Storage Engine --- `redo log` (trạng thái `prepare`) ---> `binlog` ---> `redo log` (trạng thái `commit`).

## 4. Tài liệu tham khảo

- *MySQL in Practice: 45 Lectures* (45 bài giảng thực chiến MySQL)
- Tài liệu tham khảo MySQL 5.6: <https://dev.MySQL.com/doc/refman/5.6/en/>
