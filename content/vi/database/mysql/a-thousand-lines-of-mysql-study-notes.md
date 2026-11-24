---
title: Một nghìn dòng ghi chú học MySQL
description: Tổng hợp tinh hoa ghi chú học MySQL dài một nghìn dòng, bao quát các kiến thức cốt lõi như thao tác cơ sở dữ liệu, quản lý bảng, cú pháp SQL, chỉ mục (Index), View, Stored Procedure, Trigger, phù hợp để tra cứu nhanh và ôn tập.
category: Cơ sở dữ liệu
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: Ghi chú học MySQL,tổng hợp lệnh MySQL,cú pháp SQL,thao tác cơ sở dữ liệu,thao tác với bảng,Index,View,Stored Procedure,Trigger
lang: vi
sourceRef: zh-ref/database/mysql/a-thousand-lines-of-mysql-study-notes.md
---

> Địa chỉ bài viết gốc: <https://shockerli.net/post/1000-line-mysql-note/>, JavaGuide đã tiến hành định dạng đơn giản cho bài viết và bổ sung thêm mục lục.

Bản tổng hợp rất chất lượng, khuyến nghị bạn nên lưu lại để tra cứu khi cần thiết.

### Thao tác cơ bản

```sql
/* Windows Service */
-- Khởi động MySQL
			net start mysql
-- Tạo Windows Service
				sc create mysql binPath= mysqld_bin_path(Lưu ý: giữa dấu bằng và giá trị phải có dấu cách)
/* Kết nối và ngắt kết nối máy chủ */
-- Kết nối MySQL
				mysql -h địa_chỉ -P cổng -u tên_người_dùng -p mật_khẩu
-- Hiển thị các thread đang chạy
				SHOW PROCESSLIST
-- Hiển thị thông tin biến hệ thống
				SHOW VARIABLES
```

### Thao tác cơ sở dữ liệu

```sql
/* Thao tác cơ sở dữ liệu */
-- Xem database hiện tại
    SELECT DATABASE();
-- Hiển thị thời gian hiện tại, người dùng, phiên bản database
    SELECT now(), user(), version();
-- Tạo database
    CREATE DATABASE[ IF NOT EXISTS] tên_database các_tùy_chọn_database
    Các tùy chọn database:
        CHARACTER SET charset_name
        COLLATE collation_name
-- Xem các database hiện có
    SHOW DATABASES[ LIKE 'PATTERN']
-- Xem thông tin database hiện tại
    SHOW CREATE DATABASE tên_database
-- Sửa đổi thông tin tùy chọn của database
    ALTER DATABASE tên_database thông_tin_tùy_chọn
-- Xóa database
    DROP DATABASE[ IF EXISTS] tên_database
        Đồng thời xóa thư mục liên quan đến database đó cùng toàn bộ nội dung bên trong
```

### Thao tác với bảng

```sql
/* Thao tác với bảng */
-- Tạo bảng
    CREATE [TEMPORARY] TABLE[ IF NOT EXISTS] [tên_db.]tên_bảng ( định_nghĩa_cấu_trúc_bảng )[ các_tùy_chọn_bảng]
        Mỗi trường bắt buộc phải có kiểu dữ liệu
        Sau trường cuối cùng không được có dấu phẩy
        TEMPORARY Bảng tạm, tự động biến mất khi phiên kết nối kết thúc
        Định nghĩa cho từng trường:
            tên_trường kiểu_dữ_liệu [NOT NULL | NULL] [DEFAULT default_value] [AUTO_INCREMENT] [UNIQUE [KEY] | [PRIMARY] KEY] [COMMENT 'string']
-- Tùy chọn bảng
    -- Bộ ký tự (Charset)
        CHARSET = charset_name
        Nếu bảng không thiết lập thì sẽ sử dụng charset của database
    -- Storage Engine (Engine lưu trữ)
        ENGINE = engine_name
        Cấu trúc dữ liệu khác nhau được bảng áp dụng khi quản lý dữ liệu, cấu trúc khác nhau dẫn đến phương thức xử lý và tính năng hỗ trợ khác nhau
        Các engine phổ biến: InnoDB MyISAM Memory/Heap BDB Merge Example CSV MaxDB Archive
        Các engine khác nhau sẽ sử dụng các phương thức khác nhau khi lưu cấu trúc bảng và dữ liệu
        Ý nghĩa các file của bảng MyISAM: .frm định nghĩa bảng, .MYD dữ liệu bảng, .MYI chỉ mục bảng
        Ý nghĩa các file của bảng InnoDB: .frm định nghĩa bảng, file tablespace chứa dữ liệu và file log
        SHOW ENGINES -- Hiển thị thông tin trạng thái của các storage engine
        SHOW ENGINE tên_engine {LOGS|STATUS} -- Hiển thị log hoặc thông tin trạng thái của storage engine
    -- Giá trị tự tăng khởi đầu
    	AUTO_INCREMENT = số_hàng
    -- Thư mục file dữ liệu
        DATA DIRECTORY = 'thư_mục'
    -- Thư mục file chỉ mục
        INDEX DIRECTORY = 'thư_mục'
    -- Chú thích bảng (Comment)
        COMMENT = 'string'
    -- Tùy chọn phân vùng (Partition)
        PARTITION BY ... (Xem chi tiết tài liệu hướng dẫn)
-- Xem tất cả các bảng
    SHOW TABLES[ LIKE 'pattern']
    SHOW TABLES FROM tên_db
-- Xem cấu trúc bảng
    SHOW CREATE TABLE tên_bảng (Thông tin chi tiết hơn)
    DESC tên_bảng / DESCRIBE tên_bảng / EXPLAIN tên_bảng / SHOW COLUMNS FROM tên_bảng [LIKE 'PATTERN']
    SHOW TABLE STATUS [FROM db_name] [LIKE 'pattern']
-- Sửa đổi bảng
    -- Sửa đổi tùy chọn của chính bảng đó
        ALTER TABLE tên_bảng tùy_chọn_của_bảng
        Ví dụ: ALTER TABLE tên_bảng ENGINE=MYISAM;
    -- Đổi tên bảng
        RENAME TABLE tên_bảng_cũ TO tên_bảng_mới
        RENAME TABLE tên_bảng_cũ TO tên_db.tên_bảng_mới (Có thể di chuyển bảng sang database khác)
        -- RENAME có thể hoán đổi tên của hai bảng
    -- Sửa đổi cấu trúc trường của bảng (Cú pháp 13.1.2. ALTER TABLE)
        ALTER TABLE tên_bảng tên_thao_tác
        -- Tên thao tác
            ADD[ COLUMN] định_nghĩa_trường       -- Thêm trường
                AFTER tên_trường                -- Biểu thị thêm vào sau tên trường đó
                FIRST                           -- Biểu thị thêm vào vị trí đầu tiên
            ADD PRIMARY KEY(tên_trường)         -- Tạo khóa chính (Primary Key)
            ADD UNIQUE [tên_chỉ_mục] (tên_trường)-- Tạo chỉ mục duy nhất (Unique Index)
            ADD INDEX [tên_chỉ_mục] (tên_trường) -- Tạo chỉ mục thông thường (Normal Index)
            DROP[ COLUMN] tên_trường            -- Xóa trường
            MODIFY[ COLUMN] tên_trường thuộc_tính_trường     -- Hỗ trợ sửa đổi thuộc tính của trường, không sửa đổi tên trường (cần viết lại toàn bộ các thuộc tính cũ)
            CHANGE[ COLUMN] tên_trường_cũ tên_trường_mới thuộc_tính_trường      -- Hỗ trợ sửa đổi tên trường
            DROP PRIMARY KEY    -- Xóa khóa chính (Trước khi xóa khóa chính cần xóa thuộc tính AUTO_INCREMENT của nó)
            DROP INDEX tên_chỉ_mục -- Xóa chỉ mục
            DROP FOREIGN KEY khóa_ngoại    -- Xóa khóa ngoại
-- Xóa bảng
    DROP TABLE[ IF EXISTS] tên_bảng ...
-- Xóa trắng dữ liệu trong bảng
    TRUNCATE [TABLE] tên_bảng
-- Sao chép cấu trúc bảng
    CREATE TABLE tên_bảng LIKE tên_bảng_cần_sao_chép
-- Sao chép cấu trúc và dữ liệu bảng
    CREATE TABLE tên_bảng [AS] SELECT * FROM tên_bảng_cần_sao_chép
-- Kiểm tra bảng có lỗi hay không
    CHECK TABLE tbl_name [, tbl_name] ... [option] ...
-- Tối ưu hóa bảng
    OPTIMIZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...
-- Sửa chữa bảng
    REPAIR [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ... [QUICK] [EXTENDED] [USE_FRM]
-- Phân tích bảng
    ANALYZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...
```

### Thao tác dữ liệu

```sql
/* Thao tác dữ liệu */ ------------------
-- Thêm (Insert)
    INSERT [INTO] tên_bảng [(danh_sách_trường)] VALUES (danh_sách_giá_trị)[, (danh_sách_giá_trị), ...]
        -- Nếu danh sách giá trị cần chèn chứa tất cả các trường và theo đúng thứ tự, có thể bỏ qua danh sách trường.
        -- Có thể chèn đồng thời nhiều bản ghi dữ liệu!
        REPLACE tương tự như INSERT, điểm khác biệt duy nhất là đối với các dòng trùng khớp, dữ liệu của dòng hiện tại (so sánh với khóa chính/khóa duy nhất) sẽ bị thay thế; nếu không có dòng nào trùng thì sẽ chèn dòng mới.
    INSERT [INTO] tên_bảng SET tên_trường=giá_trị[, tên_trường=giá_trị, ...]
-- Truy vấn (Select)
    SELECT danh_sách_trường FROM tên_bảng[ các_mệnh_đề_khác]
        -- Có thể đến từ nhiều trường của nhiều bảng
        -- Các mệnh đề khác có thể không cần sử dụng
        -- Danh sách trường có thể dùng * để thay thế, biểu thị tất cả các trường
-- Xóa (Delete)
    DELETE FROM tên_bảng[ mệnh_đề_điều_kiện_xóa]
        Nếu không có mệnh đề điều kiện thì sẽ xóa toàn bộ
-- Cập nhật (Update)
    UPDATE tên_bảng SET tên_trường=giá_trị_mới[, tên_trường=giá_trị_mới] [điều_kiện_cập_nhật]
```

### Bộ mã ký tự (Character Set)

```sql
/* Bộ mã ký tự (Character Set) */ ------------------
-- MySQL, database, bảng, trường đều có thể thiết lập encoding
-- Encoding của dữ liệu và encoding của client không nhất thiết phải giống nhau
SHOW VARIABLES LIKE 'character_set_%'   -- Xem tất cả các mục cấu hình bộ mã ký tự
    character_set_client        Encoding được client sử dụng khi gửi dữ liệu đến máy chủ
    character_set_results       Encoding máy chủ sử dụng khi trả kết quả về cho client
    character_set_connection    Encoding tầng kết nối
SET tên_biến = giá_trị_biến
    SET character_set_client = gbk;
    SET character_set_results = gbk;
    SET character_set_connection = gbk;
SET NAMES GBK;  -- Tương đương với việc hoàn thành cả ba thiết lập trên
-- Collation (Tập quy tắc đối chiếu)
    Collation dùng để sắp xếp và so sánh chuỗi
    SHOW CHARACTER SET [LIKE 'pattern']/SHOW CHARSET [LIKE 'pattern']   Xem tất cả các bộ ký tự (charset)
    SHOW COLLATION [LIKE 'pattern']     Xem tất cả các collation
    CHARSET mã_ký_tự     Thiết lập encoding bộ ký tự
    COLLATE mã_đối_chiếu     Thiết lập mã collation
```

### Kiểu dữ liệu (Kiểu cột)

```sql
/* Kiểu dữ liệu (Kiểu cột) */ ------------------
1. Kiểu số (Numeric Types)
-- a. Kiểu số nguyên (Integer) ----------
    Kiểu         Số byte     Phạm vi (Có dấu)
    tinyint     1 byte      -128 ~ 127      Không dấu (Unsigned): 0 ~ 255
    smallint    2 byte      -32768 ~ 32767
    mediumint   3 byte      -8388608 ~ 8388607
    int         4 byte
    bigint      8 byte
    int(M)  M biểu thị tổng số chữ số hiển thị
    - Mặc định có dấu, dùng thuộc tính unsigned để chuyển thành không dấu
    - Độ rộng hiển thị (display width): nếu một số không đủ số chữ số được chỉ định khi định nghĩa trường thì phía trước sẽ được điền thêm số 0, dùng thuộc tính zerofill để thiết lập
        Ví dụ: int(5), chèn số '123', sau khi điền thêm sẽ thành '00123'
    - Trong trường hợp thỏa mãn yêu cầu, chọn kiểu càng nhỏ càng tốt.
    - 1 biểu thị giá trị boolean đúng (true), 0 biểu thị sai (false). MySQL không có kiểu boolean thực sự mà biểu diễn qua số nguyên 0 và 1. Thường dùng tinyint(1) để biểu thị kiểu boolean.
-- b. Kiểu số thực dấu phẩy động (Floating-Point) ----------
    Kiểu                 Số byte     Phạm vi
    float (độ chính xác đơn)   4 byte
    double (độ chính xác kép)  8 byte
    Kiểu số thực dấu phẩy động hỗ trợ cả thuộc tính unsigned và thuộc tính độ rộng hiển thị zerofill.
        Khác với kiểu số nguyên, cả phần trước và sau đều có thể được bù thêm số 0.
    Khi định nghĩa kiểu floating-point, cần chỉ định tổng số chữ số và số chữ số thập phân.
        float(M, D)     double(M, D)
        M biểu thị tổng số chữ số, D biểu thị số chữ số thập phân.
        Kích thước của M và D sẽ quyết định phạm vi của số dấu phẩy động. Khác với phạm vi cố định của kiểu số nguyên.
        M vừa biểu thị tổng số chữ số (không bao gồm dấu chấm thập phân và dấu âm dương), vừa biểu thị độ rộng hiển thị (bao gồm tất cả các ký tự hiển thị).
        Hỗ trợ biểu diễn theo ký hiệu khoa học (scientific notation).
        Số dấu phẩy động biểu thị giá trị xấp xỉ.
-- c. Kiểu số dấu phẩy tĩnh / chính xác cao (Fixed-Point) ----------
    decimal -- Chiều dài khả biến
    decimal(M, D)   M cũng biểu thị tổng số chữ số, D biểu thị số chữ số thập phân.
    Lưu trữ một giá trị số chính xác, không xảy ra sai lệch dữ liệu, khác với việc làm tròn số của kiểu dấu phẩy động.
    Chuyển đổi số dấu phẩy động thành dạng chuỗi để lưu trữ, cứ mỗi 9 chữ số được lưu thành 4 byte.
2. Kiểu chuỗi (String Types)
-- a. char, varchar ----------
    char    Chuỗi có độ dài cố định (fixed length), tốc độ nhanh nhưng lãng phí không gian lưu trữ
    varchar Chuỗi có độ dài khả biến (variable length), tốc độ chậm hơn nhưng tiết kiệm không gian lưu trữ
    M biểu thị độ dài tối đa có thể lưu trữ, độ dài này tính theo số ký tự chứ không phải số byte.
    Với các encoding khác nhau, dung lượng chiếm dụng sẽ khác nhau.
    char: tối đa 255 ký tự, không phụ thuộc vào encoding.
    varchar: tối đa 65535 ký tự (theo lý thuyết), phụ thuộc vào encoding.
    Một bản ghi hợp lệ (dòng) không được vượt quá 65535 byte.
        utf8 tối đa là 21844 ký tự, gbk tối đa là 32766 ký tự, latin1 tối đa là 65532 ký tự
    varchar là kiểu khả biến, cần dùng không gian lưu trữ để lưu độ dài của varchar; nếu dữ liệu nhỏ hơn 255 byte thì dùng 1 byte để lưu độ dài, ngược lại cần 2 byte để lưu.
    Độ dài hiệu dụng tối đa của varchar được xác định bởi kích thước dòng tối đa (maximum row size) và bộ ký tự được sử dụng.
    Độ dài hiệu dụng tối đa là 65532 byte, vì khi varchar lưu chuỗi, byte đầu tiên để trống không chứa dữ liệu, sau đó cần 2 byte để lưu độ dài chuỗi, do đó độ dài hiệu dụng là 65535-1-2=65532 byte.
    Ví dụ: Nếu một bảng được định nghĩa là CREATE TABLE tb(c1 int, c2 char(30), c3 varchar(N)) charset=utf8; hỏi giá trị lớn nhất của N là bao nhiêu? Trả lời: (65535-1-2-4-30*3)/3
-- b. blob, text ----------
    blob Chuỗi nhị phân (chuỗi byte)
        tinyblob, blob, mediumblob, longblob
    text Chuỗi phi nhị phân (chuỗi ký tự)
        tinytext, text, mediumtext, longtext
    Khi định nghĩa text, không cần chỉ định độ dài và cũng không tính vào tổng độ dài hàng.
    Kiểu text khi định nghĩa không được gán giá trị mặc định (default).
-- c. binary, varbinary ----------
    Tương tự như char và varchar, dùng để lưu chuỗi nhị phân, tức là lưu chuỗi byte thay vì chuỗi ký tự.
    char, varchar, text tương ứng với binary, varbinary, blob.
3. Kiểu ngày tháng thời gian (Date & Time Types)
    Thông thường sử dụng kiểu số nguyên để lưu timestamp (dấu thời gian), vì PHP (và các ngôn ngữ khác) có thể định dạng timestamp rất thuận tiện.
    datetime    8 byte    Ngày và giờ     1000-01-01 00:00:00 đến 9999-12-31 23:59:59
    date        3 byte    Ngày            1000-01-01 đến 9999-12-31
    timestamp   4 byte    Timestamp       19700101000000 đến 2038-01-19 03:14:07
    time        3 byte    Thời gian       -838:59:59 đến 838:59:59
    year        1 byte    Năm             1901 đến 2155
datetime    YYYY-MM-DD hh:mm:ss
timestamp   YY-MM-DD hh:mm:ss
            YYYYMMDDhhmmss
            YYMMDDhhmmss
            YYYYMMDDhhmmss
            YYMMDDhhmmss
date        YYYY-MM-DD
            YY-MM-DD
            YYYYMMDD
            YYMMDD
            YYYYMMDD
            YYMMDD
time        hh:mm:ss
            hhmmss
            hhmmss
year        YYYY
            YY
            YYYY
            YY
4. Kiểu Enum và Set
-- Enum (enum) ----------
enum(val1, val2, val3...)
    Chọn một giá trị duy nhất trong danh sách các giá trị đã biết. Số lượng tối đa là 65535.
    Các giá trị enum khi lưu trữ được lưu dưới dạng số nguyên 2 byte (smallint). Mỗi giá trị enum tăng dần từng đơn vị bắt đầu từ 1 theo thứ tự vị trí lưu trữ.
    Biểu hiện bề ngoài là kiểu chuỗi, nhưng thực chất lưu trữ bên dưới là số nguyên.
    Chỉ số của giá trị NULL là NULL.
    Chỉ số của chuỗi rỗng bị lỗi là 0.
-- Set (tập hợp) ----------
set(val1, val2, val3...)
    create table tab ( gender set('Nam', 'Nữ', 'Không xác định') );
    insert into tab values ('Nam, Nữ');
    Tối đa có thể có 64 phần tử khác nhau. Được lưu trữ dưới dạng bigint, tổng cộng 8 byte. Sử dụng phép toán thao tác bit.
    Khi tạo bảng, khoảng trắng ở cuối giá trị phần tử SET sẽ tự động bị loại bỏ.
```

### Thuộc tính cột (Ràng buộc cột)

```sql
/* Thuộc tính cột (Ràng buộc cột) */ ------------------
1. PRIMARY Khóa chính (Primary Key)
    - Trường có thể định danh duy nhất một bản ghi có thể làm khóa chính.
    - Một bảng chỉ có thể có duy nhất một khóa chính.
    - Khóa chính có tính duy nhất (uniqueness).
    - Khi khai báo trường, dùng primary key để đánh dấu.
        Cũng có thể khai báo sau danh sách các trường
            Ví dụ: create table tab ( id int, stu varchar(10), primary key (id));
    - Giá trị của trường khóa chính không được là null.
    - Khóa chính có thể bao gồm nhiều trường kết hợp lại (khóa chính phức hợp). Trường hợp này cần khai báo sau danh sách các trường.
        Ví dụ: create table tab ( id int, stu varchar(10), age int, primary key (stu, age));
2. UNIQUE Chỉ mục duy nhất (Ràng buộc duy nhất - Unique Constraint)
    Làm cho giá trị của một trường nhất định không được trùng lặp.
3. Ràng buộc NULL (NULL Constraint)
    null không phải là một kiểu dữ liệu mà là một thuộc tính của cột.
    Biểu thị cột hiện tại có cho phép nhận giá trị null hay không, biểu thị trạng thái không có gì.
    null: cho phép rỗng. Đây là mặc định.
    not null: không cho phép rỗng.
    insert into tab values (null, 'val');
        -- Lúc này biểu thị gán giá trị của trường đầu tiên thành null, phụ thuộc vào việc trường đó có cho phép null hay không
4. Thuộc tính giá trị mặc định DEFAULT (Default Value)
    Giá trị mặc định của trường hiện tại.
    insert into tab values (default, 'val');    -- Lúc này biểu thị bắt buộc sử dụng giá trị mặc định.
    create table tab ( add_time timestamp default current_timestamp );
        -- Biểu thị lấy timestamp của thời gian hiện tại làm giá trị mặc định.
        current_date, current_time
5. Ràng buộc tự tăng AUTO_INCREMENT (Auto Increment)
    Trường tự tăng bắt buộc phải là chỉ mục (khóa chính hoặc unique)
    Chỉ có thể tồn tại duy nhất một trường tự tăng trong một bảng.
    Mặc định bắt đầu tự tăng từ 1. Có thể thiết lập thông qua thuộc tính bảng auto_increment = x, hoặc alter table tbl auto_increment = x;
6. Chú thích COMMENT
    Ví dụ: create table tab ( id int ) comment 'Nội dung chú thích';
7. Ràng buộc khóa ngoại FOREIGN KEY (Foreign Key Constraint)
    Dùng để ràng buộc tính toàn vẹn dữ liệu giữa bảng chính (bảng cha) và bảng phụ (bảng con).
    alter table t1 add constraint `t1_t2_fk` foreign key (t1_id) references t2(id);
        -- Liên kết khóa ngoại t1_id của bảng t1 tới trường id của bảng t2.
        -- Mỗi khóa ngoại đều có một tên, có thể chỉ định thông qua constraint
    Bảng tồn tại khóa ngoại được gọi là bảng phụ (bảng con), bảng mà khóa ngoại trỏ tới được gọi là bảng chính (bảng cha).
    Tác dụng: Duy trì tính nhất quán và toàn vẹn dữ liệu, mục đích chính là kiểm soát dữ liệu được lưu trữ trong bảng khóa ngoại (bảng con).
    Trong MySQL, có thể sử dụng ràng buộc khóa ngoại cho engine InnoDB:
    Cú pháp:
    foreign key (trường_khóa_ngoại) references tên_bảng_chính (trường_liên_kết) [hành_động_khi_xóa_bản_ghi_bảng_chính] [hành_động_khi_cập_nhật_bản_ghi_bảng_chính]
    Lúc này cần kiểm tra khóa ngoại của bảng con phải bị ràng buộc vào giá trị đã tồn tại của bảng cha. Khóa ngoại khi chưa có liên kết có thể đặt thành null, với điều kiện cột khóa ngoại đó không có ràng buộc not null.
    Có thể không chỉ định hành động khi bản ghi bảng chính thay đổi hoặc cập nhật, khi đó thao tác trên bảng chính sẽ bị từ chối.
    Nếu chỉ định on update hoặc on delete: khi xóa hoặc cập nhật, có các lựa chọn thao tác sau:
    1. cascade: thao tác theo tầng (liên hoàn). Dữ liệu bảng chính được cập nhật (giá trị khóa chính cập nhật) thì bảng con cũng được cập nhật (giá trị khóa ngoại cập nhật). Bản ghi bảng chính bị xóa thì các bản ghi liên quan ở bảng con cũng bị xóa theo.
    2. set null: đặt thành null. Dữ liệu bảng chính được cập nhật (giá trị khóa chính cập nhật) thì khóa ngoại của bảng con được đặt thành null. Bản ghi bảng chính bị xóa thì khóa ngoại của các bản ghi liên quan ở bảng con được đặt thành null. Nhưng lưu ý, yêu cầu cột khóa ngoại đó không có ràng buộc thuộc tính not null.
    3. restrict: từ chối việc xóa và cập nhật ở bảng cha.
    Lưu ý: Khóa ngoại chỉ được hỗ trợ bởi storage engine InnoDB. Các engine khác không hỗ trợ.
```

### Quy chuẩn thiết kế bảng

```sql
/* Quy chuẩn thiết kế bảng */ ------------------
    -- Normal Format, NF (Dạng chuẩn)
        - Mỗi bảng lưu trữ thông tin của một thực thể
        - Mỗi bảng có một trường ID làm khóa chính
        - Khóa chính ID + Bảng nguyên tử (atomic table)
    -- 1NF, Dạng chuẩn 1 (First Normal Form)
        Các trường không thể phân chia nhỏ hơn nữa thì thỏa mãn dạng chuẩn 1.
    -- 2NF, Dạng chuẩn 2 (Second Normal Form)
        Dưới tiền đề thỏa mãn dạng chuẩn 1, không được xuất hiện phụ thuộc một phần (partial dependency).
        Loại bỏ khóa chính phức hợp có thể tránh được phụ thuộc một phần. Thêm khóa đơn cột.
    -- 3NF, Dạng chuẩn 3 (Third Normal Form)
        Dưới tiền đề thỏa mãn dạng chuẩn 2, không được xuất hiện phụ thuộc bắc cầu (transitive dependency).
        Một trường nào đó phụ thuộc vào khóa chính, trong khi lại có trường khác phụ thuộc vào trường này, đó chính là phụ thuộc bắc cầu.
        Đưa dữ liệu thông tin của một thực thể vào trong một bảng duy nhất để hiện thực hóa.
```

### SELECT

```sql
/* SELECT */ ------------------
SELECT [ALL|DISTINCT] select_expr FROM -> WHERE -> GROUP BY [hàm tổng hợp] -> HAVING -> ORDER BY -> LIMIT
a. select_expr
    -- Có thể dùng * để biểu thị tất cả các trường.
        select * from tb;
    -- Có thể sử dụng biểu thức (công thức tính toán, lời gọi hàm; bản thân trường dữ liệu cũng là một biểu thức)
        select stu, 29+25, now() from tb;
    -- Có thể đặt bí danh (alias) cho mỗi cột. Thích hợp để rút gọn định danh cột, tránh trùng lặp định danh nhiều cột.
        - Sử dụng từ khóa as, cũng có thể bỏ qua as.
        select stu+10 as add10 from tb;
b. Mệnh đề FROM
    Dùng để xác định nguồn dữ liệu truy vấn.
    -- Có thể đặt bí danh cho bảng. Sử dụng từ khóa as.
        SELECT * FROM tb1 AS tt, tb2 AS bb;
    -- Sau mệnh đề from có thể xuất hiện đồng thời nhiều bảng.
        -- Nhiều bảng sẽ được xếp chồng theo chiều ngang, và dữ liệu sẽ tạo thành một tích Descartes (Cartesian product).
        SELECT * FROM tb1, tb2;
    -- Gợi ý cho bộ tối ưu hóa (Optimizer Hint) cách lựa chọn chỉ mục
        USE INDEX, IGNORE INDEX, FORCE INDEX
        SELECT * FROM table1 USE INDEX (key1,key2) WHERE key1=1 AND key2=2 AND key3=3;
        SELECT * FROM table1 IGNORE INDEX (key3) WHERE key1=1 AND key2=2 AND key3=3;
c. Mệnh đề WHERE
    -- Lọc dữ liệu từ nguồn dữ liệu thu được từ from.
    -- Số nguyên 1 biểu thị true, 0 biểu thị false.
    -- Biểu thức được cấu thành từ toán tử và toán hạng.
        -- Toán hạng: biến (trường), giá trị hằng, giá trị trả về của hàm
        -- Toán tử:
            =, <=>, <>, !=, <=, <, >=, >, !, &&, ||,
            in (not) null, (not) like, (not) in, (not) between and, is (not), and, or, not, xor
            is/is not kết hợp với true/false/unknown để kiểm tra tính chân trị của một giá trị
            <=> có chức năng tương tự <>, nhưng <=> có thể dùng để so sánh với null
d. Mệnh đề GROUP BY, mệnh đề gom nhóm
    GROUP BY trường/bí_danh [thứ_tự_sắp_xếp]
    Sau khi gom nhóm sẽ tiến hành sắp xếp. Tăng dần: ASC, giảm dần: DESC
    Các [hàm tổng hợp] sau đây cần phối hợp sử dụng với GROUP BY:
    count Trả về số lượng giá trị khác NULL: count(*), count(trường)
    sum Tính tổng
    max Tìm giá trị lớn nhất
    min Tìm giá trị nhỏ nhất
    avg Tính giá trị trung bình
    group_concat Trả về kết quả chuỗi nối các giá trị khác NULL từ một nhóm. Nối chuỗi nội bộ trong nhóm.
e. Mệnh đề HAVING, mệnh đề điều kiện sau gom nhóm
    Có chức năng và cách dùng tương tự where, nhưng thời điểm thực thi khác nhau.
    where thực thi kiểm tra dữ liệu ngay từ đầu để lọc dữ liệu gốc.
    having thực hiện lọc lại một lần nữa trên tập kết quả đã được sàng lọc và gom nhóm.
    Trường trong having bắt buộc phải là trường được truy vấn ra (trong SELECT), còn trường trong where bắt buộc phải tồn tại trong bảng dữ liệu.
    where không thể sử dụng bí danh của trường, having có thể sử dụng. Vì khi thực thi mã WHERE, giá trị của cột có thể chưa được xác định.
    where không thể sử dụng hàm tổng hợp. Thông thường khi cần dùng hàm tổng hợp mới sử dụng having
    Tiêu chuẩn SQL yêu cầu HAVING phải tham chiếu đến các cột trong mệnh đề GROUP BY hoặc các cột được sử dụng trong hàm tổng hợp.
f. Mệnh đề ORDER BY, mệnh đề sắp xếp
    order by trường_sắp_xếp/bí_danh kiểu_sắp_xếp [,trường_sắp_xếp/bí_danh kiểu_sắp_xếp]...
    Tăng dần: ASC, giảm dần: DESC
    Hỗ trợ sắp xếp theo nhiều trường.
g. Mệnh đề LIMIT, mệnh đề giới hạn số lượng kết quả
    Chỉ giới hạn số lượng trên tập kết quả đã được xử lý xong. Coi kết quả đã xử lý như một tập hợp, chỉ số bắt đầu từ 0 theo thứ tự xuất hiện của các bản ghi.
    limit vị_trí_bắt_đầu, số_bản_ghi_cần_lấy
    Nếu bỏ qua tham số thứ nhất thì mặc định bắt đầu từ chỉ số 0: limit số_bản_ghi_cần_lấy
h. Tùy chọn DISTINCT, ALL
    distinct Loại bỏ các bản ghi trùng lặp
    Mặc định là all, lấy tất cả các bản ghi
```

### UNION

```sql
/* UNION */ ------------------
      Kết hợp kết quả của nhiều truy vấn select thành một tập kết quả duy nhất.
      SELECT ... UNION [ALL|DISTINCT] SELECT ...
      Mặc định theo phương thức DISTINCT, tức là tất cả các dòng trả về đều là duy nhất
      Khuyến nghị nên dùng dấu ngoặc đơn bao bọc từng truy vấn SELECT.
      Khi sắp xếp bằng ORDER BY, cần kết hợp thêm LIMIT.
      Yêu cầu số lượng trường của các truy vấn select phải bằng nhau.
      Danh sách trường (số lượng, kiểu dữ liệu) của mỗi truy vấn select nên nhất quán, vì tên trường trong kết quả cuối cùng sẽ lấy theo câu lệnh select đầu tiên.
```

### Subquery (Truy vấn con)

```sql
/* Subquery (Truy vấn con) */ ------------------
    - Truy vấn con cần được bao bọc trong dấu ngoặc đơn.
-- Dạng from (from subquery)
    Sau from yêu cầu phải là một bảng, bắt buộc phải đặt bí danh cho kết quả của truy vấn con.
    - Đơn giản hóa các điều kiện bên trong mỗi truy vấn.
    - Dạng from cần tạo kết quả thành một bảng tạm thời, có thể dùng để giải phóng khóa của bảng gốc.
    - Truy vấn con trả về một bảng (truy vấn con dạng bảng - table subquery).
    select * from (select * from tb where id>0) as subfrom where id>1;
-- Dạng where (where subquery)
    - Truy vấn con trả về một giá trị duy nhất (truy vấn con vô hướng - scalar subquery).
    - Không cần đặt bí danh cho truy vấn con.
    - Bảng bên trong truy vấn con where không thể trực tiếp dùng để update.
    select * from tb where money = (select max(money) from tb);
    -- Truy vấn con dạng cột (Column subquery)
        Nếu kết quả của truy vấn con trả về là một cột.
        Sử dụng in hoặc not in để hoàn thành truy vấn
        Điều kiện exists và not exists
            Nếu truy vấn con trả về dữ liệu thì trả về 1 hoặc 0. Thường dùng cho điều kiện phán đoán.
            select column1 from t1 where exists (select * from t2);
    -- Truy vấn con dạng hàng (Row subquery)
        Điều kiện truy vấn là một hàng.
        select * from t1 where (id, gender) in (select id, gender from t2);
        Toán tử tạo hàng (Row constructor): (col1, col2, ...) hoặc ROW(col1, col2, ...)
        Toán tử tạo hàng thường dùng để so sánh với truy vấn con có khả năng trả về từ hai cột trở lên.
    -- Các toán tử đặc biệt
    != all()    Tương đương với not in
    = some()    Tương đương với in. any là bí danh của some
    != some()   Không tương đương với not in, mà là không bằng một phần tử nào đó trong số chúng.
    all, some có thể phối hợp sử dụng cùng với các toán tử khác.
```

### Join Query (Truy vấn kết nối)

```sql
/* Join Query (Truy vấn kết nối) */ ------------------
    Kết nối các trường của nhiều bảng lại với nhau, có thể chỉ định điều kiện kết nối.
-- Inner Join (Kết nối trong)
    - Mặc định là kết nối trong, có thể bỏ qua từ khóa inner.
    - Chỉ khi dữ liệu tồn tại ở cả hai phía thì mới thực hiện kết nối. Tức là kết quả kết nối không xuất hiện dòng trống.
    on Biểu thị điều kiện kết nối. Biểu thức điều kiện của nó tương tự như where. Cũng có thể bỏ qua điều kiện (biểu thị điều kiện luôn luôn đúng)
    Cũng có thể dùng where để biểu thị điều kiện kết nối.
    Còn có using, nhưng yêu cầu tên trường phải giống nhau: using(tên_trường)
    -- Cross Join (Kết nối chéo)
        Chính là inner join không có điều kiện.
        select * from tb1 cross join tb2;
-- Outer Join (Kết nối ngoài)
    - Dù dữ liệu không tồn tại ở một bên, bản ghi vẫn sẽ xuất hiện trong kết quả kết nối.
    -- Left Outer Join (Kết nối ngoài bên trái - Left Join)
        Nếu dữ liệu không tồn tại ở bảng phải, bản ghi bảng trái vẫn xuất hiện, còn bảng phải được điền null
    -- Right Outer Join (Kết nối ngoài bên phải - Right Join)
        Nếu dữ liệu không tồn tại ở bảng trái, bản ghi bảng phải vẫn xuất hiện, còn bảng trái được điền null
-- Natural Join (Kết nối tự nhiên)
    Tự động suy xét điều kiện kết nối để hoàn thành phép nối.
    Tương đương với việc bỏ qua using, nó sẽ tự động tìm kiếm các trường có cùng tên.
    natural join
    natural left join
    natural right join
select info.id, info.name, info.stu_num, extra_info.hobby, extra_info.sex from info, extra_info where info.stu_num = extra_info.stu_id;
```

### TRUNCATE

```sql
/* TRUNCATE */ ------------------
TRUNCATE [TABLE] tbl_name
Xóa sạch dữ liệu
Xóa bảng và tạo lại
Sự khác biệt:
1. truncate là xóa bảng rồi tạo lại, delete là xóa từng dòng một
2. truncate đặt lại giá trị của auto_increment, còn delete thì không
3. truncate không biết đã xóa bao nhiêu dòng, còn delete thì biết được số dòng bị xóa.
4. Khi áp dụng cho bảng có phân vùng (partition), truncate sẽ giữ nguyên các phân vùng
```

### Sao lưu và phục hồi

```sql
/* Sao lưu và phục hồi */ ------------------
Sao lưu: lưu trữ cấu trúc dữ liệu và dữ liệu bên trong bảng.
Sử dụng lệnh mysqldump để thực hiện.
-- Xuất dữ liệu (Export)
mysqldump [options] db_name [tables]
mysqldump [options] ---database DB1 [DB2 DB3...]
mysqldump [options] --all--database
1. Xuất một bảng
　　mysqldump -u tên_người_dùng -p mật_khẩu tên_database tên_bảng > tên_file(D:/a.sql)
2. Xuất nhiều bảng
　　mysqldump -u tên_người_dùng -p mật_khẩu tên_database bảng1 bảng2 bảng3 > tên_file(D:/a.sql)
3. Xuất tất cả các bảng
　　mysqldump -u tên_người_dùng -p mật_khẩu tên_database > tên_file(D:/a.sql)
4. Xuất một database
　　mysqldump -u tên_người_dùng -p mật_khẩu --lock-all-tables --database tên_database > tên_file(D:/a.sql)
Có thể kèm theo điều kiện WHERE bằng tùy chọn -w
-- Nhập dữ liệu (Import)
1. Trong trường hợp đã đăng nhập vào mysql:
　　source file_sao_lưu
2. Trong trường hợp không đăng nhập
　　mysql -u tên_người_dùng -p mật_khẩu tên_database < file_sao_lưu
```

### View (Khung nhìn)

```sql
Khái niệm View:
    View (khung nhìn) là một bảng ảo, nội dung của nó được định nghĩa bởi một câu truy vấn. Giống như một bảng thật, view chứa một tập hợp các hàng và cột dữ liệu có tên gọi. Tuy nhiên, view không tồn tại trong cơ sở dữ liệu dưới dạng một tập hợp các giá trị dữ liệu được lưu trữ. Dữ liệu hàng và cột đến từ các bảng được tham chiếu bởi câu truy vấn định nghĩa view, và được tạo động khi tham chiếu đến view.
    View có file cấu trúc bảng, nhưng không có file dữ liệu.
    Đối với các bảng cơ sở mà nó tham chiếu, view có tác dụng tương tự như một bộ lọc. Bộ lọc định nghĩa view có thể đến từ một hoặc nhiều bảng của database hiện tại hoặc database khác, hoặc từ các view khác. Việc truy vấn thông qua view không có bất kỳ giới hạn nào, và các giới hạn khi sửa đổi dữ liệu qua view cũng rất ít.
    View là câu lệnh truy vấn SQL được lưu trữ trong database, nó chủ yếu xuất phát từ hai lý do: lý do bảo mật (view có thể ẩn đi một số dữ liệu nhạy cảm, ví dụ: bảng quỹ bảo hiểm xã hội có thể dùng view để chỉ hiển thị họ tên, địa chỉ mà không hiển thị số bảo hiểm xã hội và mức lương), và lý do làm cho các truy vấn phức tạp trở nên dễ hiểu và dễ sử dụng hơn.
-- Tạo View
CREATE [OR REPLACE] [ALGORITHM = {UNDEFINED | MERGE | TEMPTABLE}] VIEW view_name [(column_list)] AS select_statement
    - Tên view bắt buộc phải là duy nhất, đồng thời không được trùng tên với bảng.
    - View có thể sử dụng tên cột truy vấn được từ câu lệnh select, hoặc có thể tự chỉ định tên cột tương ứng.
    - Có thể chỉ định thuật toán thực thi của view thông qua ALGORITHM.
    - Nếu có column_list thì số lượng cột bắt buộc phải bằng số lượng cột được truy vấn bởi câu lệnh SELECT
-- Xem cấu trúc View
    SHOW CREATE VIEW view_name
-- Xóa View
    - Sau khi xóa view, dữ liệu trong bảng gốc vẫn tồn tại bình thường.
    - Có thể xóa đồng thời nhiều view.
    DROP VIEW [IF EXISTS] view_name ...
-- Sửa đổi cấu trúc View
    - Thông thường không nên sửa đổi view, vì không phải mọi thao tác cập nhật view đều có thể ánh xạ được về bảng gốc.
    ALTER VIEW view_name [(column_list)] AS select_statement
-- Tác dụng của View
    1. Đơn giản hóa logic nghiệp vụ
    2. Ẩn cấu trúc bảng thật đối với phía client
-- Thuật toán của View (ALGORITHM)
    MERGE       Hợp nhất
        Câu lệnh truy vấn của view và truy vấn bên ngoài cần được hợp nhất trước rồi mới thực thi!
    TEMPTABLE   Bảng tạm
        Sau khi thực thi view xong, tạo thành bảng tạm thời (temporary table), sau đó mới thực hiện truy vấn bên ngoài!
    UNDEFINED   Chưa định nghĩa (Mặc định), MySQL sẽ tự động lựa chọn thuật toán phù hợp nhất.
```

### Transaction (Giao dịch)

```sql
Transaction (Giao dịch) là một nhóm các thao tác về mặt logic, các đơn vị cấu thành nhóm thao tác này hoặc là tất cả đều thành công, hoặc là tất cả đều thất bại.
    - Hỗ trợ thành công tập thể hoặc hoàn tác tập thể cho một chuỗi các câu lệnh SQL liên tiếp.
    - Transaction là một tính năng của cơ sở dữ liệu về mặt bảo toàn tính toàn vẹn dữ liệu.
    - Cần tận dụng storage engine InnoDB hoặc BDB để hoàn thành việc hỗ trợ tính năng tự động commit (autocommit).
    - InnoDB được gọi là engine an toàn giao dịch (transaction-safe engine).
-- Bắt đầu Transaction
    START TRANSACTION; hoặc BEGIN;
    Sau khi bắt đầu giao dịch, tất cả các câu lệnh SQL được thực thi đều được coi là câu lệnh SQL nằm trong transaction hiện tại.
-- Commit Transaction (Xác nhận giao dịch)
    COMMIT;
-- Rollback Transaction (Hoàn tác giao dịch)
    ROLLBACK;
    Nếu một phần thao tác xảy ra sự cố, khôi phục trạng thái về thời điểm trước khi transaction bắt đầu.
-- Các đặc tính của Transaction (ACID)
    1. Tính nguyên tử (Atomicity)
        Transaction là một đơn vị công việc không thể phân chia, các thao tác trong transaction hoặc là đều xảy ra, hoặc là đều không xảy ra.
    2. Tính nhất quán (Consistency)
        Tính toàn vẹn của dữ liệu trước và sau transaction bắt buộc phải duy trì nhất quán.
        - Khi transaction bắt đầu và kết thúc, dữ liệu bên ngoài phải nhất quán
        - Trong toàn bộ quá trình transaction diễn ra, các thao tác là liên tục
    3. Tính cô lập (Isolation)
        Khi nhiều người dùng đồng thời truy cập cơ sở dữ liệu, transaction của một người dùng không được can thiệp vào transaction của người dùng khác, dữ liệu giữa nhiều transaction đồng thời phải được cô lập với nhau.
    4. Tính bền vững (Durability)
        Một khi transaction đã được commit thì những thay đổi của nó đối với dữ liệu trong database là vĩnh viễn.
-- Hiện thực hóa Transaction
    1. Bắt buộc phải là loại bảng hỗ trợ transaction
    2. Bắt đầu transaction trước khi thực thi một nhóm các thao tác có liên quan
    3. Sau khi toàn bộ nhóm thao tác hoàn thành, nếu tất cả đều thành công thì commit; nếu có thao tác thất bại, chọn rollback để quay trở lại điểm sao lưu lúc transaction bắt đầu.
-- Nguyên lý của Transaction
    Được hoàn thành bằng cách tận dụng đặc tính autocommit của InnoDB.
    Sau khi thực thi câu lệnh MySQL thông thường, thao tác commit dữ liệu hiện tại ngay lập tức hiển thị đối với các client khác.
    Còn transaction sẽ tạm thời tắt cơ chế "autocommit", cần phải dùng lệnh commit để xác nhận lưu dữ liệu vĩnh viễn.
-- Lưu ý
    1. Các câu lệnh thuộc ngôn ngữ định nghĩa dữ liệu (DDL) không thể rollback, ví dụ câu lệnh tạo hoặc hủy database, câu lệnh tạo, hủy hoặc sửa đổi bảng hoặc routine đã lưu trữ.
    2. Transaction không thể lồng nhau (nesting)
-- Savepoint (Điểm lưu)
    SAVEPOINT tên_savepoint -- Thiết lập một điểm lưu trong transaction
    ROLLBACK TO SAVEPOINT tên_savepoint -- Rollback về điểm lưu chỉ định
    RELEASE SAVEPOINT tên_savepoint -- Xóa điểm lưu
-- Thiết lập đặc tính autocommit của InnoDB
    SET autocommit = 0|1;   0 biểu thị tắt autocommit, 1 biểu thị bật autocommit.
    - Nếu tắt, kết quả của các thao tác thông thường cũng không hiển thị với các client khác, cần phải commit mới có thể lưu dữ liệu vĩnh viễn.
    - Cũng có thể tắt autocommit để mở transaction. Nhưng điểm khác biệt so với START TRANSACTION là:
        SET autocommit thay đổi vĩnh viễn thiết lập của server cho đến khi thiết lập này được sửa đổi lại lần sau (áp dụng cho connection hiện tại)
        Trong khi START TRANSACTION ghi lại trạng thái trước khi mở, và một khi transaction được commit hoặc rollback thì cần phải mở lại transaction lần nữa (chỉ áp dụng cho transaction hiện tại)
```

### Khóa bảng (Table Lock)

```sql
/* Khóa bảng (Table Lock) */
Khóa bảng chỉ dùng để ngăn chặn các client khác thực hiện đọc và ghi không đúng quy cách
MyISAM hỗ trợ khóa cấp bảng (Table Lock), InnoDB hỗ trợ khóa cấp dòng (Row Lock)
-- Khóa
    LOCK TABLES tbl_name [AS alias]
-- Mở khóa
    UNLOCK TABLES
```

### Trigger (Trình kích hoạt)

```sql
/* Trigger (Trình kích hoạt) */ ------------------
    Trigger là một đối tượng database có tên gắn liền với bảng, đối tượng này sẽ được kích hoạt khi bảng xuất hiện sự kiện cụ thể
    Lắng nghe: thêm, sửa, xóa bản ghi.
-- Tạo Trigger
CREATE TRIGGER trigger_name trigger_time trigger_event ON tbl_name FOR EACH ROW trigger_stmt
    Tham số:
    trigger_time là thời điểm hành động của trigger. Nó có thể là before hoặc after, để chỉ rõ trigger được kích hoạt trước hay sau câu lệnh kích hoạt nó.
    trigger_event chỉ rõ loại câu lệnh kích hoạt trigger
        INSERT: Kích hoạt trigger khi chèn một dòng mới vào bảng
        UPDATE: Kích hoạt trigger khi sửa đổi một dòng nào đó
        DELETE: Kích hoạt trigger khi xóa một dòng nào đó khỏi bảng
    tbl_name: Bảng được lắng nghe, bắt buộc phải là bảng vĩnh viễn, không thể liên kết trigger với bảng TEMPORARY hoặc View.
    trigger_stmt: Câu lệnh được thực thi khi trigger được kích hoạt. Để thực thi nhiều câu lệnh, có thể dùng cấu trúc câu lệnh ghép BEGIN...END
-- Xóa Trigger
DROP TRIGGER [schema_name.]trigger_name
Có thể sử dụng old và new để đại diện cho dữ liệu cũ và dữ liệu mới
    Thao tác update: trước khi cập nhật là old, sau khi cập nhật là new.
    Thao tác delete: chỉ có old.
    Thao tác insert: chỉ có new.
-- Lưu ý
    1. Đối với một bảng nhất định, không thể có hai trigger có cùng trigger_time và trigger_event.
-- Hàm nối chuỗi
concat(str1,str2,...])
concat_ws(separator,str1,str2,...)
-- Câu lệnh rẽ nhánh
if điều_kiện then
    câu_lệnh_thực_thi
elseif điều_kiện then
    câu_lệnh_thực_thi
else
    câu_lệnh_thực_thi
end if;
-- Thay đổi ký tự kết thúc câu lệnh ngoài cùng
delimiter ký_tự_kết_thúc_tự_định_nghĩa
    câu_lệnh_SQL
ký_tự_kết_thúc_tự_định_nghĩa
delimiter ;     -- Đổi lại thành dấu chấm phẩy ban đầu
-- Khối lệnh bao bọc
begin
    khối_lệnh
end
-- Các trường hợp thực thi đặc biệt
1. Chỉ cần thêm bản ghi là sẽ kích hoạt trigger.
2. Cú pháp Insert into on duplicate key update sẽ kích hoạt:
    Nếu không có bản ghi trùng lặp, sẽ kích hoạt before insert, after insert;
    Nếu có bản ghi trùng lặp và được cập nhật, sẽ kích hoạt before insert, before update, after update;
    Nếu có bản ghi trùng lặp nhưng không phát sinh cập nhật, sẽ kích hoạt before insert, before update
3. Cú pháp Replace: nếu đã có bản ghi thì sẽ thực thi before insert, before delete, after delete, after insert
```

### Lập trình SQL

```sql
/* Lập trình SQL */ ------------------
--// Biến cục bộ (Local Variable) ----------
-- Khai báo biến
    declare var_name[,...] type [default value]
    Câu lệnh này được dùng để khai báo biến cục bộ. Để gán giá trị mặc định cho biến, vui lòng thêm mệnh đề default. Giá trị có thể được chỉ định dưới dạng một biểu thức, không nhất thiết phải là hằng số. Nếu không có mệnh đề default, giá trị khởi tạo sẽ là null.
-- Gán giá trị
    Sử dụng câu lệnh set và select into để gán giá trị cho biến.
    - Lưu ý: bên trong hàm có thể sử dụng biến toàn cục (biến do người dùng tự định nghĩa)
--// Biến toàn cục / Biến người dùng (User-defined Variable) ----------
-- Định nghĩa, gán giá trị
Câu lệnh set có thể định nghĩa và gán giá trị cho biến.
set @var = value;
Cũng có thể dùng câu lệnh select into để khởi tạo và gán giá trị cho biến. Cách này yêu cầu câu lệnh select chỉ được trả về một dòng duy nhất, nhưng có thể có nhiều trường, đồng nghĩa với việc gán giá trị cho nhiều biến cùng lúc; số lượng biến cần phải khớp với số cột truy vấn.
Ngoài ra còn có thể coi câu lệnh gán giá trị như một biểu thức, hoàn thành việc thực thi thông qua select. Lúc này để tránh dấu = bị coi là toán tử quan hệ so sánh, ta sử dụng := để thay thế (câu lệnh set có thể dùng cả = và :=).
select @var:=20;
select @v1:=id, @v2=name from t1 limit 1;
select * from tbl_name where @var:=30;
select into có thể gán dữ liệu truy vấn được từ bảng vào biến.
    -| select max(height) into @max_height from tb;
-- Tên biến tự định nghĩa
Để tránh xung đột giữa biến do người dùng tự định nghĩa với định danh hệ thống (thường là tên trường) trong câu lệnh select, biến người dùng sử dụng ký tự @ làm tiền tố bắt đầu trước tên biến.
@var=10;
    - Sau khi biến được định nghĩa, nó có hiệu lực trong toàn bộ chu kỳ phiên kết nối (từ lúc đăng nhập đến khi thoát)
--// Cấu trúc điều khiển (Control Structures) ----------
-- Câu lệnh if
if search_condition then
    statement_list
[elseif search_condition then
    statement_list]
...
[else
    statement_list]
end if;
-- Câu lệnh case
CASE value WHEN [compare-value] THEN result
[WHEN [compare-value] THEN result ...]
[ELSE result]
END
-- Vòng lặp while
[begin_label:] while search_condition do
    statement_list
end while [end_label];
- Nếu cần kết thúc sớm vòng lặp while bên trong thân vòng lặp, cần sử dụng nhãn (label); các nhãn cần xuất hiện theo cặp.
    -- Thoát vòng lặp
        Thoát toàn bộ vòng lặp: leave
        Bỏ qua vòng lặp hiện tại để sang lần lặp tiếp theo: iterate
        Xác định thoát khỏi vòng lặp nào thông qua nhãn tương ứng
--// Hàm tích hợp sẵn (Built-in Functions) ----------
-- Hàm xử lý số học
abs(x)          -- Giá trị tuyệt đối: abs(-10.9) = 10
format(x, d)    -- Định dạng số phân tách hàng nghìn: format(1234567.456, 2) = 1,234,567.46
ceil(x)         -- Làm tròn lên: ceil(10.1) = 11
floor(x)        -- Làm tròn xuống: floor (10.1) = 10
round(x)        -- Làm tròn số nguyên theo quy tắc bốn bỏ năm lên
mod(m, n)       -- m%n, m mod n chia lấy dư: 10%3=1
pi()            -- Lấy số Pi
pow(m, n)       -- m^n, lũy thừa
sqrt(x)         -- Căn bậc hai số học
rand()          -- Số ngẫu nhiên
truncate(x, d)  -- Cắt lấy d chữ số thập phân
-- Hàm ngày tháng thời gian
now(), current_timestamp();     -- Ngày giờ hiện tại
current_date();                 -- Ngày hiện tại
current_time();                 -- Giờ hiện tại
date('yyyy-mm-dd hh:ii:ss');    -- Lấy phần ngày
time('yyyy-mm-dd hh:ii:ss');    -- Lấy phần giờ
date_format('yyyy-mm-dd hh:ii:ss', '%d %y %a %d %m %b %j'); -- Định dạng thời gian
unix_timestamp();               -- Lấy unix timestamp
from_unixtime();                -- Lấy thời gian từ timestamp
-- Hàm xử lý chuỗi
length(string)          -- Chiều dài chuỗi tính theo byte
char_length(string)     -- Số lượng ký tự của chuỗi
substring(str, position [,length])      -- Trích xuất length ký tự từ vị trí position của str
replace(str ,search_str ,replace_str)   -- Thay thế search_str bằng replace_str trong str
instr(string ,substring)    -- Trả về vị trí xuất hiện đầu tiên của substring trong string
concat(string [,...])   -- Nối chuỗi
charset(str)            -- Trả về bộ ký tự (charset) của chuỗi
lcase(string)           -- Chuyển thành chữ thường
left(string, length)    -- Lấy length ký tự từ phía bên trái của chuỗi
load_file(file_name)    -- Đọc nội dung từ file
locate(substring, string [,start_position]) -- Tương tự instr, nhưng có thể chỉ định vị trí bắt đầu
lpad(string, length, pad)   -- Lặp lại chèn pad vào đầu string cho đến khi chuỗi đạt độ dài length
ltrim(string)           -- Xóa khoảng trắng ở đầu chuỗi
repeat(string, count)   -- Lặp lại count lần
rpad(string, length, pad)   -- Bổ sung pad vào sau str cho đến khi độ dài đạt length
rtrim(string)           -- Xóa khoảng trắng ở cuối chuỗi
strcmp(string1 ,string2)    -- So sánh độ lớn hai chuỗi theo từng ký tự
-- Hàm rẽ nhánh dòng chảy (Flow Control Functions)
case when [condition] then result [when [condition] then result ...] [else result] end   Rẽ nhiều nhánh
if(expr1,expr2,expr3)  Rẽ hai nhánh.
-- Hàm tổng hợp (Aggregate Functions)
count()
sum();
max();
min();
avg();
group_concat()
-- Các hàm thông dụng khác
md5();
default();
--// Stored Function, hàm tự định nghĩa ----------
-- Tạo mới
    CREATE FUNCTION function_name (danh_sách_tham_số) RETURNS kiểu_giá_trị_trả_về
        thân_hàm
    - Tên hàm phải là định danh hợp lệ và không được trùng với các từ khóa hiện có.
    - Một hàm phải thuộc về một database nhất định, có thể dùng dạng db_name.function_name để chỉ định database sở hữu hàm, nếu không sẽ thuộc về database hiện tại.
    - Phần tham số bao gồm "tên tham số" và "kiểu tham số". Nhiều tham số phân tách nhau bằng dấu phẩy.
    - Thân hàm bao gồm nhiều câu lệnh MySQL hợp lệ, điều khiển luồng, khai báo biến, v.v.
    - Nhiều câu lệnh nên được bao bọc trong khối lệnh begin...end.
    - Bắt buộc phải có câu lệnh trả về giá trị return.
-- Xóa
    DROP FUNCTION [IF EXISTS] function_name;
-- Xem
    SHOW FUNCTION STATUS LIKE 'partten'
    SHOW CREATE FUNCTION function_name;
-- Sửa đổi
    ALTER FUNCTION function_name tùy_chọn_hàm
--// Stored Procedure, chức năng tự định nghĩa ----------
-- Định nghĩa
Stored Procedure (thủ tục lưu trữ) là một đoạn mã (quy trình) bao gồm các câu lệnh SQL được lưu trữ trong database.
Một stored procedure thường dùng để hoàn thành một chuỗi logic nghiệp vụ, ví dụ đăng ký, đóng quỹ lớp, nhập kho đơn hàng, v.v.
Còn một function thường tập trung vào một chức năng cụ thể nhằm phục vụ cho các chương trình khác, cần phải gọi hàm bên trong các câu lệnh khác; stored procedure không thể được gọi lồng trong câu lệnh khác mà tự thực thi thông qua lệnh call.
-- Tạo mới
CREATE PROCEDURE sp_name (danh_sách_tham_số)
    thân_thủ_tục
Danh sách tham số: khác với danh sách tham số của hàm, cần chỉ rõ kiểu tham số:
IN: biểu thị kiểu đầu vào
OUT: biểu thị kiểu đầu ra
INOUT: biểu thị kiểu kết hợp cả vào và ra
Lưu ý: không có giá trị trả về.
```

### Stored Procedure (Thủ tục lưu trữ)

```sql
/* Stored Procedure (Thủ tục lưu trữ) */ ------------------
Stored procedure là một tập hợp các đoạn mã có thể thực thi. So với hàm, nó thiên về logic nghiệp vụ hơn.
Gọi thủ tục: CALL tên_thủ_tục
-- Lưu ý
- Không có giá trị trả về.
- Chỉ có thể gọi riêng lẻ, không thể lồng ghép bên trong các câu lệnh khác
-- Tham số
IN|OUT|INOUT tên_tham_số kiểu_dữ_liệu
IN      Đầu vào: tham số nhận dữ liệu đưa vào bên trong thân thủ tục trong quá trình gọi
OUT     Đầu ra: trả kết quả sau khi thân thủ tục xử lý xong về cho client trong quá trình gọi
INOUT   Vào ra kết hợp: vừa có thể nhận đầu vào, vừa có thể trả về đầu ra
-- Cú pháp
CREATE PROCEDURE tên_thủ_tục (danh_sách_tham_số)
BEGIN
    thân_thủ_tục
END
```

### Quản lý người dùng và phân quyền

```sql
/* Quản lý người dùng và phân quyền */ ------------------
-- Đặt lại mật khẩu root
1. Dừng dịch vụ MySQL
2.  [Linux] /usr/local/mysql/bin/safe_mysqld --skip-grant-tables &
    [Windows] mysqld --skip-grant-tables
3. use mysql;
4. UPDATE `user` SET PASSWORD=PASSWORD("mật_khẩu") WHERE `user` = "root";
5. FLUSH PRIVILEGES;
Bảng thông tin người dùng: mysql.user
-- Làm mới quyền hạn
FLUSH PRIVILEGES;
-- Thêm người dùng
CREATE USER tên_người_dùng IDENTIFIED BY [PASSWORD] 'mật_khẩu_dạng_chuỗi'
    - Bắt buộc phải có quyền CREATE USER toàn cục trong database mysql, hoặc có quyền INSERT.
    - Chỉ tạo người dùng, không gán quyền.
    - Tên người dùng, chú ý dấu nháy: ví dụ 'user_name'@'192.168.1.1'
    - Mật khẩu cũng cần dấu nháy, mật khẩu thuần số cũng phải thêm dấu nháy
    - Muốn chỉ định mật khẩu ở dạng plain text, cần bỏ qua từ khóa PASSWORD. Muốn chỉ định mật khẩu là giá trị băm được trả về bởi hàm PASSWORD(), cần thêm từ khóa PASSWORD
-- Đổi tên người dùng
RENAME USER old_user TO new_user
-- Thiết lập mật khẩu
SET PASSWORD = PASSWORD('mật_khẩu')  -- Thiết lập mật khẩu cho người dùng hiện tại
SET PASSWORD FOR tên_người_dùng = PASSWORD('mật_khẩu') -- Thiết lập mật khẩu cho người dùng chỉ định
-- Xóa người dùng
DROP USER tên_người_dùng
-- Phân quyền / Thêm người dùng
GRANT danh_sách_quyền ON tên_bảng TO tên_người_dùng [IDENTIFIED BY [PASSWORD] 'password']
    - all privileges biểu thị tất cả các quyền
    - *.* biểu thị tất cả các bảng của tất cả các database
    - tên_db.tên_bảng biểu thị một bảng cụ thể trong một database nhất định
    GRANT ALL PRIVILEGES ON `pms`.* TO 'pms'@'%' IDENTIFIED BY 'pms0817';
-- Xem quyền hạn
SHOW GRANTS FOR tên_người_dùng
    -- Xem quyền hạn của người dùng hiện tại
    SHOW GRANTS; hoặc SHOW GRANTS FOR CURRENT_USER; hoặc SHOW GRANTS FOR CURRENT_USER();
-- Thu hồi quyền hạn
REVOKE danh_sách_quyền ON tên_bảng FROM tên_người_dùng
REVOKE ALL PRIVILEGES, GRANT OPTION FROM tên_người_dùng   -- Thu hồi tất cả các quyền
-- Các cấp độ phân quyền (Privilege Levels)
-- Để sử dụng GRANT hoặc REVOKE, bạn phải sở hữu quyền GRANT OPTION và phải có các quyền mà bạn đang cấp hoặc thu hồi.
Cấp độ toàn cục (Global level): Quyền toàn cục áp dụng cho tất cả các database trong một máy chủ nhất định, mysql.user
    GRANT ALL ON *.* và REVOKE ALL ON *.* chỉ cấp và thu hồi quyền ở cấp độ toàn cục.
Cấp độ database (Database level): Quyền database áp dụng cho tất cả các đối tượng trong một database nhất định, mysql.db, mysql.host
    GRANT ALL ON db_name.* và REVOKE ALL ON db_name.* chỉ cấp và thu hồi quyền ở cấp độ database.
Cấp độ bảng (Table level): Quyền bảng áp dụng cho tất cả các cột trong một bảng nhất định, mysql.talbes_priv
    GRANT ALL ON db_name.tbl_name và REVOKE ALL ON db_name.tbl_name chỉ cấp và thu hồi quyền ở cấp độ bảng.
Cấp độ cột (Column level): Quyền cột áp dụng cho một cột duy nhất trong một bảng nhất định, mysql.columns_priv
    Khi sử dụng REVOKE, bạn phải chỉ định cột giống với cột đã được cấp quyền.
-- Danh sách các quyền (Privilege List)
ALL [PRIVILEGES]    -- Thiết lập tất cả các quyền đơn giản ngoại trừ GRANT OPTION
ALTER   -- Cho phép sử dụng ALTER TABLE
ALTER ROUTINE   -- Sửa đổi hoặc hủy bỏ routine (thủ tục/hàm) đã lưu trữ
CREATE  -- Cho phép sử dụng CREATE TABLE
CREATE ROUTINE  -- Tạo routine đã lưu trữ
CREATE TEMPORARY TABLES     -- Cho phép sử dụng CREATE TEMPORARY TABLE
CREATE USER     -- Cho phép sử dụng CREATE USER, DROP USER, RENAME USER và REVOKE ALL PRIVILEGES.
CREATE VIEW     -- Cho phép sử dụng CREATE VIEW
DELETE  -- Cho phép sử dụng DELETE
DROP    -- Cho phép sử dụng DROP TABLE
EXECUTE     -- Cho phép người dùng chạy routine đã lưu trữ
FILE    -- Cho phép sử dụng SELECT...INTO OUTFILE và LOAD DATA INFILE
INDEX   -- Cho phép sử dụng CREATE INDEX và DROP INDEX
INSERT  -- Cho phép sử dụng INSERT
LOCK TABLES     -- Cho phép sử dụng LOCK TABLES đối với bảng mà bạn có quyền SELECT
PROCESS     -- Cho phép sử dụng SHOW FULL PROCESSLIST
REFERENCES  -- Chưa được triển khai
RELOAD  -- Cho phép sử dụng FLUSH
REPLICATION CLIENT  -- Cho phép người dùng truy vấn địa chỉ của máy chủ slave hoặc master
REPLICATION SLAVE   -- Dùng cho máy chủ phụ kiểu sao chép (đọc các sự kiện binlog từ máy chủ master)
SELECT  -- Cho phép sử dụng SELECT
SHOW DATABASES  -- Hiển thị tất cả các database
SHOW VIEW   -- Cho phép sử dụng SHOW CREATE VIEW
SHUTDOWN    -- Cho phép sử dụng mysqladmin shutdown
SUPER   -- Cho phép sử dụng CHANGE MASTER, KILL, PURGE MASTER LOGS và câu lệnh SET GLOBAL, lệnh mysqladmin debug; cho phép bạn kết nối (một lần) ngay cả khi đã đạt max_connections.
UPDATE  -- Cho phép sử dụng UPDATE
USAGE   -- Từ đồng nghĩa với "không có quyền" (no privileges)
GRANT OPTION    -- Cho phép cấp quyền cho người khác
```

### Bảo trì bảng

```sql
/* Bảo trì bảng */
-- Phân tích và lưu trữ phân phối khóa của bảng
ANALYZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tên_bảng ...
-- Kiểm tra một hoặc nhiều bảng có lỗi hay không
CHECK TABLE tbl_name [, tbl_name] ... [option] ...
option = {QUICK | FAST | MEDIUM | EXTENDED | CHANGED}
-- Chống phân mảnh cho file dữ liệu
OPTIMIZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...
```

### Các mục khác

```sql
/* Các mục khác */ ------------------
1. Có thể dùng dấu backtick (`) để bao bọc định danh (tên db, tên bảng, tên trường, chỉ mục, bí danh) nhằm tránh trùng tên với từ khóa! Tiếng Trung/ký tự Unicode cũng có thể dùng làm định danh!
2. Trong thư mục của mỗi database đều tồn tại một file db.opt dùng để lưu các tùy chọn của database hiện tại.
3. Chú thích (Comment):
    Chú thích một dòng: # Nội dung chú thích
    Chú thích nhiều dòng: /* Nội dung chú thích */
    Chú thích một dòng: -- Nội dung chú thích     (Phong cách chú thích chuẩn của SQL, yêu cầu sau hai dấu gạch nối phải có một ký tự khoảng trắng (dấu cách, TAB, xuống dòng, v.v.))
4. Ký tự đại diện mẫu (Wildcard):
    _   Khớp với một ký tự đơn bất kỳ
    %   Khớp với nhiều ký tự bất kỳ, thậm chí bao gồm cả chuỗi rỗng (không có ký tự nào)
    Dấu nháy đơn cần được escape: \'
5. Ký tự kết thúc câu lệnh trong giao diện dòng lệnh CMD có thể là ";", "\G", "\g", chỉ ảnh hưởng đến định dạng hiển thị kết quả. Những nơi khác vẫn kết thúc bằng dấu chấm phẩy. delimiter có thể sửa đổi ký tự kết thúc câu lệnh của phiên hiện tại.
6. SQL không phân biệt chữ hoa chữ thường (case-insensitive)
7. Hủy bỏ câu lệnh đã nhập: \c
```
