---
title: Giải thích chi tiết về Transaction trong Spring
description: "Giải thích chi tiết quản lý transaction trong Spring, bao gồm annotation @Transactional, hành vi lan truyền transaction (Transaction Propagation), mức độ cô lập (Isolation Level), các kịch bản transaction mất hiệu lực và quy tắc rollback."
category: Framework
tag:
  - Spring
head:
  - - meta
    - name: keywords
      content: Spring Transaction,@Transactional,Transaction Propagation,Isolation Level,Transaction mất hiệu lực,Quy tắc rollback,Declarative Transaction,AOP Transaction
lang: vi
sourceRef: zh-ref/system-design/framework/spring/spring-transaction.md
---

Bài tổng hợp và phân tích về **Spring Transaction** mà mình đã hứa với độc giả cách đây không lâu cuối cùng cũng đã ra mắt. Phần nội dung này rất quan trọng đối với cả công việc thực tế lẫn phỏng vấn, nhưng tài liệu tham khảo chất lượng trên mạng lại khá ít.

## Transaction là gì?

**Transaction (giao dịch) là một nhóm các thao tác về mặt logic: hoặc tất cả cùng được thực thi, hoặc không thao tác nào được thực thi.**

Chắc hẳn ai cũng đã thuộc nằm lòng câu nói trên rồi; dưới đây mình sẽ kết hợp với thực tế phát triển phần mềm hằng ngày để cùng bàn luận sâu hơn.

Mỗi phương thức nghiệp vụ trong hệ thống của chúng ta có thể bao gồm nhiều thao tác cơ sở dữ liệu mang tính nguyên tử (atomic). Ví dụ, trong phương thức `savePerson()` dưới đây có hai thao tác cơ sở dữ liệu nguyên tử. Các thao tác cơ sở dữ liệu nguyên tử này có sự phụ thuộc lẫn nhau: hoặc tất cả cùng thực thi, hoặc không cái nào thực thi.

```java
  public void savePerson() {
    personDao.save(person);
    personDetailDao.save(personDetail);
  }
```

Ngoài ra, cần đặc biệt lưu ý một điểm: **Việc transaction có phát huy tác dụng được hay không phụ thuộc then chốt vào việc database engine có hỗ trợ transaction hay không. Chẳng hạn, cơ sở dữ liệu MySQL phổ biến mặc định sử dụng engine `innodb` có hỗ trợ transaction. Tuy nhiên, nếu bạn đổi database engine sang `myisam`, thì chương trình sẽ không còn hỗ trợ transaction nữa!**

Ví dụ kinh điển và hay được nhắc tới nhất về transaction chính là chuyển khoản. Giả sử Xiao Ming muốn chuyển cho Xiao Hong 1.000 nhân dân tệ; giao dịch chuyển khoản này sẽ liên quan đến hai thao tác then chốt:

> 1. Trừ 1.000 nhân dân tệ trong số dư của Xiao Ming.
> 2. Cộng 1.000 nhân dân tệ vào số dư của Xiao Hong.

Nhỡ đâu giữa hai thao tác này bất ngờ xảy ra sự cố, chẳng hạn hệ thống ngân hàng bị sập hoặc mất kết nối mạng, dẫn đến số dư của Xiao Ming bị trừ nhưng số dư của Xiao Hong lại không tăng, thì như vậy là sai rồi. Transaction sinh ra để đảm bảo hai thao tác then chốt này hoặc cùng thành công, hoặc cùng thất bại.

![Sơ đồ minh họa transaction](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-a0059ccb.png)

```java
public class OrdersService {
  private AccountDao accountDao;

  public void setOrdersDao(AccountDao accountDao) {
    this.accountDao = accountDao;
  }

  @Transactional(propagation = Propagation.REQUIRED,
                isolation = Isolation.DEFAULT, readOnly = false, timeout = -1)
  public void accountMoney() {
    // Tài khoản Xiao Hong tăng thêm 1000
    accountDao.addMoney(1000,xiaohong);
    // Mô phỏng ngoại lệ xảy ra đột ngột, ví dụ ngân hàng bất ngờ mất điện
    // Nếu không cấu hình quản lý transaction, tài khoản Xiao Hong sẽ nhận thêm 1000 trong khi tài khoản Xiao Ming không bị trừ tiền
    int i = 10 / 0;
    // Tài khoản Xiao Wang (xiaoming) bị trừ 1000
    accountDao.reduceMoney(1000,xiaoming);
  }
}
```

Ngoài ra, bốn đặc tính ACID của transaction trong cơ sở dữ liệu là nền tảng của transaction; hãy cùng tìm hiểu sơ lược dưới đây.

## Bạn có nắm rõ các đặc tính của Transaction (ACID) không?

1. **Tính nguyên tử (`Atomicity`)**: Transaction là đơn vị thực thi nhỏ nhất, không cho phép chia nhỏ. Tính nguyên tử đảm bảo các hành động hoặc hoàn thành toàn bộ, hoặc hoàn toàn không có tác dụng gì;
2. **Tính nhất quán (`Consistency`)**: Trước và sau khi thực thi transaction, dữ liệu luôn giữ trạng thái nhất quán. Ví dụ trong nghiệp vụ chuyển khoản, dù transaction thành công hay thất bại, tổng số tiền của người chuyển và người nhận phải không đổi;
3. **Tính cô lập (`Isolation`)**: Khi truy cập cơ sở dữ liệu đồng thời, transaction của một người dùng không bị các transaction khác can thiệp; góc nhìn cơ sở dữ liệu giữa các transaction đồng thời là độc lập với nhau;
4. **Tính bền vững (`Durability`)**: Sau khi một transaction đã được commit, những thay đổi của nó đối với dữ liệu trong cơ sở dữ liệu là lâu dài, ngay cả khi cơ sở dữ liệu gặp sự cố cũng không được ảnh hưởng tới dữ liệu đó.

🌈 Ở đây xin bổ sung thêm một điểm: **Chỉ khi đảm bảo được tính bền vững (Durability), tính nguyên tử (Atomicity) và tính cô lập (Isolation) của transaction thì tính nhất quán (Consistency) mới được đảm bảo. Nói cách khác, A, I, D là phương tiện, còn C mới là mục đích!** Chắc hẳn nhiều bạn cũng giống mình, từng bị khái niệm ACID đánh lừa suốt một thời gian dài! Mình cũng chỉ ngộ ra khi xem khóa học công khai của thầy Chu Chí Minh (Zhou Zhiming): [Khóa học Kiến trúc phần mềm của Chu Chí Minh](https://time.geekbang.org/opencourse/intro/100064201) (hãy đọc thật nhiều sách hay nhé!!!).

![AID->C](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/AID--C-94fef59c.png)

Ngoài ra, tác giả cuốn DDIA — tức [*Designing Data-Intensive Applications* (Thiết kế hệ thống dữ liệu chuyên sâu)](https://book.douban.com/subject/30329536/) — đã viết trong cuốn sách của ông như sau:

> Atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. The application may rely on the database’s atomicity and isolation properties in order to achieve consistency, but it’s not up to the database alone.
>
> Dịch sang tiếng Việt có nghĩa là: Tính nguyên tử, tính cô lập và tính bền vững là thuộc tính của cơ sở dữ liệu, còn tính nhất quán (theo nghĩa của ACID) là thuộc tính của ứng dụng. Ứng dụng có thể dựa vào các thuộc tính nguyên tử và cô lập của cơ sở dữ liệu để đạt được tính nhất quán, nhưng điều này không chỉ phụ thuộc vào riêng cơ sở dữ liệu. Vì vậy, chữ C không thuộc về ACID.

Cuốn *Designing Data-Intensive Applications* thực sự rất đáng đọc đi đọc lại nhiều lần! Trên Douban có gần 90% độc giả chấm 5 sao cho cuốn sách này. Ngoài ra, bản dịch tiếng Trung đã được mã nguồn mở trên GitHub tại địa chỉ: [https://github.com/Vonng/ddia](https://github.com/Vonng/ddia).

## Bàn sâu về sự hỗ trợ Transaction của Spring

> ⚠️ Nhắc lại một lần nữa: Chương trình của bạn có hỗ trợ transaction hay không trước tiên phụ thuộc vào cơ sở dữ liệu. Chẳng hạn khi dùng MySQL, nếu bạn chọn engine `innodb` thì xin chúc mừng, hệ thống có thể hỗ trợ transaction. Nhưng nếu cơ sở dữ liệu MySQL của bạn đang dùng engine `myisam` thì rất tiếc, về bản chất là hoàn toàn không hỗ trợ transaction.

Ở đây cũng xin nhắc thêm một kiến thức cực kỳ quan trọng: **MySQL đảm bảo tính nguyên tử (Atomicity) bằng cách nào?**

Chúng ta biết rằng để đảm bảo tính nguyên tử của transaction, khi xảy ra ngoại lệ cần phải **rollback** những thao tác đã thực thi. Trong MySQL, cơ chế khôi phục được thực hiện thông qua **nhật ký rollback (`undo log`)**: mọi thay đổi do transaction thực hiện đều được ghi vào `undo log` trước rồi mới thực thi các thao tác liên quan. Nếu gặp ngoại lệ trong quá trình thực thi, ta chỉ việc dùng thông tin trong **`undo log`** để khôi phục dữ liệu về trạng thái trước khi chỉnh sửa! Hơn nữa, `undo log` được lưu bền vững xuống đĩa trước khi dữ liệu thực tế được ghi xuống đĩa. Nhờ vậy, ngay cả khi gặp tình huống cơ sở dữ liệu đột ngột sập nguồn, lúc khởi động lại, cơ sở dữ liệu vẫn có thể tra cứu `undo log` để rollback các transaction chưa hoàn tất trước đó.

### Spring hỗ trợ hai cách quản lý Transaction

#### Quản lý Transaction theo cách lập trình (Programmatic Transaction Management)

Quản lý transaction thủ công thông qua `TransactionTemplate` hoặc `TransactionManager`. Cách này ít dùng trong dự án thực tế, nhưng rất hữu ích để bạn hiểu nguyên lý quản lý transaction của Spring.

Ví dụ code quản lý transaction theo cách lập trình bằng `TransactionTemplate` như sau:

```java
@Autowired
private TransactionTemplate transactionTemplate;
public void testTransaction() {

        transactionTemplate.execute(new TransactionCallbackWithoutResult() {
            @Override
            protected void doInTransactionWithoutResult(TransactionStatus transactionStatus) {

                try {

                    // ....  Code nghiệp vụ
                } catch (Exception e){
                    // Rollback
                    transactionStatus.setRollbackOnly();
                }

            }
        });
}
```

Ví dụ code quản lý transaction theo cách lập trình bằng `TransactionManager` như sau:

```java
@Autowired
private PlatformTransactionManager transactionManager;

public void testTransaction() {

  TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
          try {
               // ....  Code nghiệp vụ
              transactionManager.commit(status);
          } catch (Exception e) {
              transactionManager.rollback(status);
          }
}
```

#### Quản lý Transaction theo cách khai báo (Declarative Transaction Management)

Được khuyến nghị sử dụng (mức độ xâm lấn vào code là nhỏ nhất). Thực tế cơ chế này được hiện thực qua AOP (cách dùng toàn bộ bằng annotation dựa trên `@Transactional` là phổ biến nhất).

Ví dụ code sử dụng annotation `@Transactional` để quản lý transaction như sau:

```java
@Transactional(propagation = Propagation.REQUIRED)
public void aMethod() {
  //do something
  B b = new B();
  C c = new C();
  b.bMethod();
  c.cMethod();
}
```

### Giới thiệu các Interface quản lý Transaction trong Spring

Trong Spring Framework, 3 interface quan trọng nhất liên quan đến quản lý transaction gồm:

- **`PlatformTransactionManager`**: Trình quản lý transaction (nền tảng), là hạt nhân trong chiến lược transaction của Spring.
- **`TransactionDefinition`**: Thông tin định nghĩa transaction (mức độ cô lập, hành vi lan truyền, thời gian chờ tối đa/timeout, chỉ đọc/read-only, v.v.).
- **`TransactionStatus`**: Trạng thái vận hành của transaction.

Chúng ta có thể xem interface **`PlatformTransactionManager`** như người quản lý tầng trên của transaction, còn hai interface **`TransactionDefinition`** và **`TransactionStatus`** có thể xem như phần mô tả của transaction.

**`PlatformTransactionManager`** sẽ quản lý transaction dựa trên các định nghĩa trong **`TransactionDefinition`** như thời gian timeout, mức độ cô lập (Isolation Level), hành vi lan truyền (Propagation Behavior), v.v., trong khi interface **`TransactionStatus`** cung cấp các phương thức để lấy trạng thái tương ứng của transaction như có phải transaction mới hay không, có thể rollback hay không, v.v.

#### PlatformTransactionManager: Interface quản lý Transaction

**Spring không trực tiếp quản lý transaction mà cung cấp nhiều trình quản lý transaction khác nhau.** Interface trình quản lý transaction của Spring là: **`PlatformTransactionManager`**.

Thông qua interface này, Spring cung cấp sẵn các trình quản lý transaction tương ứng cho từng nền tảng như JDBC (`DataSourceTransactionManager`), Hibernate (`HibernateTransactionManager`), JPA (`JpaTransactionManager`),... còn phần cài đặt cụ thể sẽ do từng nền tảng đảm nhiệm.

**Các lớp cài đặt cụ thể của interface `PlatformTransactionManager` như sau:**

![](/media/jg/local/system-design/framework/spring/images/spring-transaction/PlatformTransactionManager-3c604a.png)

Interface `PlatformTransactionManager` định nghĩa ba phương thức:

```java
package org.springframework.transaction;

import org.springframework.lang.Nullable;

public interface PlatformTransactionManager {
    // Lấy transaction
    TransactionStatus getTransaction(@Nullable TransactionDefinition var1) throws TransactionException;
    // Commit transaction
    void commit(TransactionStatus var1) throws TransactionException;
    // Rollback transaction
    void rollback(TransactionStatus var1) throws TransactionException;
}

```

**Xin nói thêm một chút: vì sao phải định nghĩa hay trừu tượng hóa interface `PlatformTransactionManager` này?**

Chủ yếu là để trừu tượng hóa hành vi quản lý transaction, sau đó để các nền tảng khác nhau tự cài đặt nó; nhờ vậy hành vi cung cấp ra bên ngoài không thay đổi và rất thuận tiện cho việc mở rộng.

Cách đây không lâu mình từng chia sẻ trên [Knowledge Planet (Zhishi Xingqiu)](https://javaguide.cn/about-the-author/zhishixingqiu-two-years.html): **"Vì sao chúng ta phải dùng interface?"**

> Cuốn *Design Patterns* (của nhóm GoF) từ nhiều năm trước đã từng nhắc đến việc phải lập trình dựa trên interface chứ không dựa trên implementation — bạn có thực sự hiểu vì sao phải lập trình hướng interface không?
>
> Nhìn xuyên suốt mã nguồn của các framework và dự án mã nguồn mở, interface là thành phần không thể thiếu. Để hiểu vì sao cần dùng interface, trước tiên phải hiểu interface cung cấp chức năng gì. Ta có thể hiểu interface như một bản giao ước (contract) liệt kê các chức năng; bản thân interface không cung cấp sẵn phần thực thi mà chỉ định nghĩa hành vi. Nhưng ai muốn dùng thì trước tiên phải implement tôi, tuân thủ giao ước của tôi, rồi tự mình hiện thực hóa các chức năng mà tôi đã định nghĩa.
>
> Lấy một ví dụ: dự án trước đây của mình có nhu cầu gửi tin nhắn SMS, vì vậy tụi mình đã định nghĩa một interface chỉ có hai phương thức:
>
> 1. Gửi tin nhắn; 2. Xử lý kết quả gửi.
>
> Ban đầu tụi mình dùng dịch vụ SMS của Alibaba Cloud, nên đã implement interface này để hoàn thiện dịch vụ SMS Alibaba Cloud. Sau đó, tụi mình bất ngờ chuyển sang nền tảng dịch vụ SMS khác — lúc này chỉ cần implement lại interface đó là xong. Cách làm này đảm bảo hành vi cung cấp cho bên ngoài không thay đổi. Gần như không cần sửa đổi code ở chỗ khác, tụi mình đã chuyển đổi yêu cầu một cách nhẹ nhàng, nâng cao tính linh hoạt và khả năng mở rộng của mã nguồn.
>
> Khi nào nên dùng interface? Khi module chức năng bạn muốn hiện thực có thiết kế hành vi mang tính trừu tượng, chẳng hạn như dịch vụ gửi SMS, dịch vụ lưu trữ ảnh, v.v.

#### TransactionDefinition: Thuộc tính Transaction

Interface trình quản lý transaction **`PlatformTransactionManager`** lấy một transaction thông qua phương thức **`getTransaction(TransactionDefinition definition)`**. Tham số của phương thức này có kiểu **`TransactionDefinition`** — lớp/interface này định nghĩa một số thuộc tính cơ bản của transaction.

**Thuộc tính transaction là gì?** Có thể hiểu thuộc tính transaction là một số cấu hình cơ bản của transaction, mô tả cách thức áp dụng chiến lược transaction lên phương thức.

`TransactionDefinition` chủ yếu bao gồm 4 khía cạnh cấu hình transaction sau:

- Mức độ cô lập (Isolation Level)
- Hành vi lan truyền (Propagation Behavior)
- Có chỉ đọc hay không (`readOnly`)
- Thời gian hết hạn / timeout của transaction (`timeout`)

Ngoài ra, phương thức `getName()` có thể trả về tên của transaction. Quy tắc rollback không thuộc bản thân `TransactionDefinition`; `TransactionAttribute` được sử dụng trong quản lý transaction khai báo (Declarative Transaction) của Spring kế thừa `TransactionDefinition` và bổ sung thêm các năng lực như quy tắc rollback trên đó.

```java
package org.springframework.transaction;

import org.springframework.lang.Nullable;

public interface TransactionDefinition {
    int PROPAGATION_REQUIRED = 0;
    int PROPAGATION_SUPPORTS = 1;
    int PROPAGATION_MANDATORY = 2;
    int PROPAGATION_REQUIRES_NEW = 3;
    int PROPAGATION_NOT_SUPPORTED = 4;
    int PROPAGATION_NEVER = 5;
    int PROPAGATION_NESTED = 6;
    int ISOLATION_DEFAULT = -1;
    int ISOLATION_READ_UNCOMMITTED = 1;
    int ISOLATION_READ_COMMITTED = 2;
    int ISOLATION_REPEATABLE_READ = 4;
    int ISOLATION_SERIALIZABLE = 8;
    int TIMEOUT_DEFAULT = -1;
    // Trả về hành vi lan truyền của transaction, mặc định là REQUIRED.
    int getPropagationBehavior();
    // Trả về mức độ cô lập của transaction, mặc định là DEFAULT.
    int getIsolationLevel();
    // Trả về thời gian timeout của transaction (tính bằng giây), mặc định là -1. Nếu quá giới hạn này mà transaction chưa hoàn thành thì tự động rollback.
    int getTimeout();
    // Trả về việc có phải transaction chỉ đọc (read-only) hay không, mặc định là false.
    boolean isReadOnly();

    @Nullable
    String getName();
}
```

#### TransactionStatus: Trạng thái Transaction

Interface `TransactionStatus` dùng để ghi lại trạng thái của transaction. Interface này định nghĩa một nhóm các phương thức để lấy hoặc kiểm tra các thông tin trạng thái tương ứng của transaction.

`PlatformTransactionManager.getTransaction(…)` trả về một đối tượng `TransactionStatus`.

**Nội dung interface `TransactionStatus` như sau:**

```java
public interface TransactionStatus{
    boolean isNewTransaction(); // Có phải transaction mới hay không
    boolean hasSavepoint(); // Có điểm khôi phục (savepoint) hay không
    void setRollbackOnly();  // Đánh dấu chỉ cho phép rollback
    boolean isRollbackOnly(); // Có đang ở trạng thái chỉ rollback hay không
    boolean isCompleted(); // Đã hoàn thành hay chưa
}
```

### Giải thích chi tiết các thuộc tính Transaction

Trong quá trình phát triển nghiệp vụ thực tế, mọi người thường dùng annotation `@Transactional` để mở transaction, nhưng nhiều người chưa nắm rõ các tham số bên trong annotation này có ý nghĩa gì và công dụng ra sao. Để sử dụng quản lý transaction tốt hơn trong dự án, bạn rất nên đọc kỹ phần nội dung bên dưới.

#### Hành vi lan truyền Transaction (Transaction Propagation)

**Hành vi lan truyền transaction sinh ra để giải quyết vấn đề transaction khi các phương thức ở tầng nghiệp vụ (Service) gọi lẫn nhau.**

Khi một phương thức có transaction được gọi bởi một phương thức có transaction khác, cần phải chỉ định cách thức transaction đó lan truyền. Ví dụ: phương thức có thể tiếp tục chạy trong transaction hiện có, hoặc mở một transaction mới và chạy trong transaction riêng của chính nó.

Lấy ví dụ: chúng ta gọi phương thức `bMethod()` của lớp `B` bên trong phương thức `aMethod()` của lớp `A`. Lúc này sẽ phát sinh bài toán transaction khi các phương thức tầng nghiệp vụ gọi lẫn nhau. Nếu `bMethod()` gặp ngoại lệ và cần rollback, làm thế nào cấu hình hành vi lan truyền transaction để `aMethod()` cũng rollback theo? Đây chính là lúc cần tới kiến thức về hành vi lan truyền transaction — nếu chưa rõ thì bạn nhất định phải xem thật kỹ.

Các đoạn code về hành vi lan truyền dưới đây đều là đoạn minh họa đã lược bỏ phần `import` và một số chi tiết cài đặt, trong đó `Propagation.xxx` là phần giữ chỗ cần thay thế chứ không phải lớp hoàn chỉnh có thể biên dịch trực tiếp.

```java
@Service
class A {
    @Autowired
    B b;
    @Transactional(propagation = Propagation.xxx)
    public void aMethod() {
        //do something
        b.bMethod();
    }
}

@Service
class B {
    @Transactional(propagation = Propagation.xxx)
    public void bMethod() {
       //do something
    }
}
```

Trong định nghĩa của `TransactionDefinition` bao gồm các hằng số biểu thị hành vi lan truyền như sau:

```java
public interface TransactionDefinition {
    int PROPAGATION_REQUIRED = 0;
    int PROPAGATION_SUPPORTS = 1;
    int PROPAGATION_MANDATORY = 2;
    int PROPAGATION_REQUIRES_NEW = 3;
    int PROPAGATION_NOT_SUPPORTED = 4;
    int PROPAGATION_NEVER = 5;
    int PROPAGATION_NESTED = 6;
    ......
}
```

Tuy nhiên, để thuận tiện khi sử dụng, Spring cũng định nghĩa một enum tương ứng là `Propagation`:

```java
package org.springframework.transaction.annotation;

import org.springframework.transaction.TransactionDefinition;

public enum Propagation {

    REQUIRED(TransactionDefinition.PROPAGATION_REQUIRED),

    SUPPORTS(TransactionDefinition.PROPAGATION_SUPPORTS),

    MANDATORY(TransactionDefinition.PROPAGATION_MANDATORY),

    REQUIRES_NEW(TransactionDefinition.PROPAGATION_REQUIRES_NEW),

    NOT_SUPPORTED(TransactionDefinition.PROPAGATION_NOT_SUPPORTED),

    NEVER(TransactionDefinition.PROPAGATION_NEVER),

    NESTED(TransactionDefinition.PROPAGATION_NESTED);

    private final int value;

    Propagation(int value) {
        this.value = value;
    }

    public int value() {
        return this.value;
    }

}

```

**Các giá trị hợp lệ của hành vi lan truyền transaction gồm:**

**1. `TransactionDefinition.PROPAGATION_REQUIRED`**

Đây là hành vi lan truyền transaction được dùng nhiều nhất, và cũng là hành vi mặc định khi chúng ta dùng annotation `@Transactional`. Nếu hiện tại đã tồn tại transaction thì tham gia vào transaction đó; nếu hiện tại chưa có transaction thì tạo một transaction mới. Nói cách khác:

- Nếu phương thức bên ngoài chưa mở transaction, thì phương thức bên trong được gắn `Propagation.REQUIRED` sẽ tự mở một transaction mới của riêng nó, và các transaction được mở ra độc lập với nhau, không can thiệp lẫn nhau.
- Nếu phương thức bên ngoài đã mở transaction và dùng `Propagation.REQUIRED`, thì tất cả các phương thức bên trong được gắn `Propagation.REQUIRED` cùng với phương thức bên ngoài đều thuộc về cùng một transaction — chỉ cần một phương thức rollback, toàn bộ transaction sẽ rollback.

Ví dụ: nếu cả `aMethod()` và `bMethod()` ở trên đều sử dụng hành vi lan truyền `PROPAGATION_REQUIRED`, cả hai sẽ dùng chung một transaction; chỉ cần một trong hai phương thức rollback, toàn bộ transaction đều rollback.

```java
@Service
class A {
    @Autowired
    B b;
    @Transactional(propagation = Propagation.REQUIRED)
    public void aMethod() {
        //do something
        b.bMethod();
    }
}
@Service
class B {
    @Transactional(propagation = Propagation.REQUIRED)
    public void bMethod() {
       //do something
    }
}
```

**2. `TransactionDefinition.PROPAGATION_REQUIRES_NEW`**

Tạo một transaction mới; nếu hiện tại đã có transaction thì tạm treo (suspend) transaction hiện tại lại. Tức là bất kể phương thức bên ngoài có mở transaction hay không, phương thức bên trong được gắn `Propagation.REQUIRES_NEW` sẽ luôn tự mở một transaction mới của riêng nó, và các transaction này độc lập với nhau, không can thiệp lẫn nhau.

Ví dụ: giả sử `bMethod()` được gắn hành vi lan truyền `PROPAGATION_REQUIRES_NEW`, còn `aMethod()` vẫn dùng `PROPAGATION_REQUIRED`. Nếu `aMethod()` gặp ngoại lệ và rollback, `bMethod()` sẽ không bị rollback theo, vì `bMethod()` đã mở một transaction độc lập. Tuy nhiên, nếu `bMethod()` ném ra một ngoại lệ chưa được bắt (uncaught exception) và ngoại lệ này thỏa mãn quy tắc rollback của transaction, thì `aMethod()` cũng sẽ rollback theo, vì ngoại lệ này đã bị cơ chế quản lý transaction của `aMethod()` phát hiện.

```java
@Service
class A {
    @Autowired
    B b;
    @Transactional(propagation = Propagation.REQUIRED)
    public void aMethod() {
        //do something
        b.bMethod();
    }
}

@Service
class B {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void bMethod() {
       //do something
    }
}
```

**3. `TransactionDefinition.PROPAGATION_NESTED`**

Nếu hiện tại đã tồn tại transaction, tạo một transaction để thực thi như một transaction lồng nhau (nested transaction) của transaction hiện tại; nếu hiện tại chưa có transaction, thực hiện thao tác tương tự `TransactionDefinition.PROPAGATION_REQUIRED`. Nói cách khác:

- Trong trường hợp phương thức bên ngoài đã mở transaction, bên trong sẽ mở một transaction mới đóng vai trò như một nested transaction.
- Nếu phương thức bên ngoài không có transaction, hệ thống sẽ mở riêng một transaction độc lập, tương tự `PROPAGATION_REQUIRED`.

Transaction lồng nhau do `TransactionDefinition.PROPAGATION_NESTED` đại diện thể hiện theo quan hệ cha-con. Ý tưởng cốt lõi là transaction con không commit độc lập mà phụ thuộc vào transaction cha và chạy bên trong transaction cha; khi transaction cha commit, transaction con cũng commit theo, và dĩ nhiên khi transaction cha rollback, transaction con cũng sẽ rollback.

> Điểm khác biệt so với `TransactionDefinition.PROPAGATION_REQUIRES_NEW`: `PROPAGATION_REQUIRES_NEW` là transaction độc lập, không phụ thuộc vào transaction bên ngoài, tồn tại theo quan hệ ngang hàng; ngay khi thực thi xong nó sẽ commit lập tức, không liên quan đến transaction bên ngoài.

Transaction con cũng có đặc tính riêng: nó có thể tự rollback độc lập mà không làm transaction cha phải rollback, nhưng với điều kiện phải xử lý ngoại lệ của transaction con để tránh ngoại lệ bị transaction cha nhận biết dẫn đến toàn bộ transaction bên ngoài bị rollback.

Ví dụ:

- Nếu `aMethod()` rollback, thì `bMethod()` với tư cách là transaction lồng nhau cũng sẽ rollback.
- Nếu `bMethod()` rollback, việc `aMethod()` có rollback hay không phụ thuộc vào việc ngoại lệ của `bMethod()` có được xử lý hay không:

  - Ngoại lệ của `bMethod()` không được xử lý — tức là bản thân `bMethod()` không xử lý ngoại lệ, và `aMethod()` cũng không xử lý ngoại lệ — khi đó `aMethod()` sẽ nhận biết ngoại lệ và dẫn tới rollback toàn bộ.

    ```java
    @Service
    class A {
        @Autowired
        B b;
        @Transactional(propagation = Propagation.REQUIRED)
        public void aMethod (){
            //do something
            b.bMethod();
        }
    }

    @Service
    class B {
        @Transactional(propagation = Propagation.NESTED)
        public void bMethod (){
           //do something and throw an exception
        }
    }
    ```

  - `bMethod()` tự xử lý ngoại lệ hoặc `aMethod()` xử lý ngoại lệ, thì `aMethod()` sẽ không rollback.

    ```java
    @Service
    class A {
        @Autowired
        B b;
        @Transactional(propagation = Propagation.REQUIRED)
        public void aMethod (){
            //do something
            try {
                b.bMethod();
            } catch (Exception e) {
                System.out.println("Phương thức rollback");
            }
        }
    }

    @Service
    class B {
        @Transactional(propagation = Propagation.NESTED)
        public void bMethod() {
           //do something and throw an exception
        }
    }
    ```

**4. `TransactionDefinition.PROPAGATION_MANDATORY`**

Nếu hiện tại đã tồn tại transaction thì tham gia vào transaction đó; nếu hiện tại chưa có transaction thì ném ra ngoại lệ. (`mandatory`: bắt buộc)

Loại này rất ít khi được sử dụng nên mình xin không nêu ví dụ.

**3 hành vi lan truyền dưới đây có cách xử lý khác với transaction hiện có, không thể hiểu theo cùng một quy tắc rollback:**

- **`TransactionDefinition.PROPAGATION_SUPPORTS`**: Nếu hiện tại đã tồn tại transaction thì tham gia vào transaction đó, các thao tác bên trong sẽ tham gia vào quá trình commit hoặc rollback của transaction này; nếu hiện tại chưa có transaction thì chạy theo cách phi transaction (non-transactional).
- **`TransactionDefinition.PROPAGATION_NOT_SUPPORTED`**: Luôn chạy theo cách phi transaction; nếu hiện tại đã tồn tại transaction thì tạm treo (suspend) nó lại trước. Do đó, các thao tác thực thi trong ranh giới lan truyền này không chịu sự kiểm soát rollback của transaction bên ngoài đang bị tạm treo.
- **`TransactionDefinition.PROPAGATION_NEVER`**: Chỉ cho phép chạy theo cách phi transaction; nếu phát hiện hiện tại đang có transaction thì ném ngoại lệ trực tiếp.

Để xem thêm nội dung về hành vi lan truyền transaction, bạn có thể đọc bài viết này: [Quá khó~ Người phỏng vấn bảo mình kết hợp ví dụ để trình bày cách hiểu về hành vi lan truyền transaction của Spring](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486668&idx=2&sn=0381e8c836442f46bdc5367170234abb&chksm=cea24307f9d5ca11c96943b3ccfa1fc70dc97dd87d9c540388581f8fe6d805ff548dff5f6b5b&token=1776990505&lang=zh_CN#rd).

#### Mức độ cô lập Transaction (Isolation Level)

Trong interface `TransactionDefinition` có định nghĩa năm hằng số biểu thị mức độ cô lập:

```java
public interface TransactionDefinition {
    ......
    int ISOLATION_DEFAULT = -1;
    int ISOLATION_READ_UNCOMMITTED = 1;
    int ISOLATION_READ_COMMITTED = 2;
    int ISOLATION_REPEATABLE_READ = 4;
    int ISOLATION_SERIALIZABLE = 8;
    ......
}
```

Giống như phần hành vi lan truyền transaction, để thuận tiện sử dụng, Spring cũng định nghĩa một enum tương ứng: `Isolation`

```java
public enum Isolation {

  DEFAULT(TransactionDefinition.ISOLATION_DEFAULT),

  READ_UNCOMMITTED(TransactionDefinition.ISOLATION_READ_UNCOMMITTED),

  READ_COMMITTED(TransactionDefinition.ISOLATION_READ_COMMITTED),

  REPEATABLE_READ(TransactionDefinition.ISOLATION_REPEATABLE_READ),

  SERIALIZABLE(TransactionDefinition.ISOLATION_SERIALIZABLE);

  private final int value;

  Isolation(int value) {
    this.value = value;
  }

  public int value() {
    return this.value;
  }

}
```

Dưới đây mình sẽ lần lượt giới thiệu từng mức độ cô lập transaction:

- **`TransactionDefinition.ISOLATION_DEFAULT`**: Sử dụng mức độ cô lập mặc định của cơ sở dữ liệu phía backend. MySQL mặc định dùng mức độ cô lập `REPEATABLE_READ`, còn Oracle mặc định dùng mức độ cô lập `READ_COMMITTED`.
- **`TransactionDefinition.ISOLATION_READ_UNCOMMITTED`**: Mức độ cô lập thấp nhất, rất ít khi được dùng vì nó cho phép đọc các thay đổi dữ liệu chưa được commit, **có thể dẫn đến đọc bẩn (Dirty Read), đọc ảo (Phantom Read) hoặc không thể đọc lặp lại (Non-repeatable Read)**.
- **`TransactionDefinition.ISOLATION_READ_COMMITTED`**: Cho phép đọc dữ liệu đã được các transaction đồng thời khác commit; **có thể ngăn chặn Dirty Read, nhưng Phantom Read hoặc Non-repeatable Read vẫn có khả năng xảy ra**.
- **`TransactionDefinition.ISOLATION_REPEATABLE_READ`**: Nhiều lần đọc cùng một trường dữ liệu đều cho kết quả nhất quán, trừ trường hợp dữ liệu do chính transaction hiện tại tự sửa đổi; **có thể ngăn chặn Dirty Read và Non-repeatable Read, nhưng Phantom Read vẫn có khả năng xảy ra**.
- **`TransactionDefinition.ISOLATION_SERIALIZABLE`**: Mức độ cô lập cao nhất, tuân thủ hoàn toàn tính cô lập của ACID. Tất cả các transaction được thực thi tuần tự từng cái một, nhờ vậy hoàn toàn không thể phát sinh nhiễu loạn giữa các transaction — tức là **mức độ này có thể phòng tránh Dirty Read, Non-repeatable Read cũng như Phantom Read**. Tuy nhiên điều này sẽ ảnh hưởng nghiêm trọng tới hiệu năng chương trình, nên thông thường cũng không dùng đến mức độ này.

Đọc thêm: [Giải thích chi tiết các mức độ cô lập Transaction trong MySQL](https://javaguide.cn/database/mysql/transaction-isolation-level.html).

#### Thuộc tính Timeout của Transaction

Timeout của transaction chỉ thời gian tối đa mà một transaction được phép thực thi; nếu vượt quá giới hạn thời gian này mà transaction vẫn chưa hoàn thành, nó sẽ tự động rollback. Trong `TransactionDefinition`, giá trị timeout được biểu diễn bằng kiểu `int` theo đơn vị giây, giá trị mặc định là `-1`, nghĩa là thời gian timeout của transaction phụ thuộc vào hệ thống transaction bên dưới hoặc không đặt timeout.

#### Thuộc tính chỉ đọc (Read-Only) của Transaction

```java
package org.springframework.transaction;

import org.springframework.lang.Nullable;

public interface TransactionDefinition {
    ......
    // Trả về việc có phải transaction chỉ đọc hay không, mặc định là false
    boolean isReadOnly();

}
```

Đối với những transaction chỉ đọc dữ liệu qua các câu lệnh truy vấn, có thể chỉ định loại transaction là `readonly`, tức transaction chỉ đọc. Transaction chỉ đọc không liên quan đến việc sửa đổi dữ liệu nên cơ sở dữ liệu sẽ cung cấp một số biện pháp tối ưu hóa, phù hợp dùng trong các phương thức có nhiều thao tác truy vấn cơ sở dữ liệu.

Nhiều bạn sẽ thắc mắc: vì sao một thao tác chỉ truy vấn dữ liệu mà tôi lại phải bật hỗ trợ transaction?

Lấy ví dụ với InnoDB của MySQL, theo mô tả trong tài liệu chính thức [https://dev.mysql.com/doc/refman/5.7/en/innodb-autocommit-commit-rollback.html](https://dev.mysql.com/doc/refman/5.7/en/innodb-autocommit-commit-rollback.html):

> MySQL mặc định bật chế độ `autocommit` cho mỗi kết nối mới được thiết lập. Ở chế độ này, mỗi câu lệnh `sql` gửi tới máy chủ MySQL sẽ được xử lý trong một transaction riêng biệt; sau khi thực thi xong sẽ tự động commit transaction và mở một transaction mới.

Tuy nhiên, nếu bạn gắn annotation `@Transactional` cho phương thức, toàn bộ các câu lệnh SQL do phương thức này thực thi sẽ được đặt trong cùng một transaction. Khi khai báo transaction chỉ đọc, Spring sẽ truyền gợi ý read-only xuống hệ thống transaction bên dưới; việc có tối ưu hay không và tối ưu như thế nào phụ thuộc vào cơ sở dữ liệu, driver và transaction manager, đồng thời nó cũng không đảm bảo thao tác ghi chắc chắn sẽ thất bại.

Nếu không gắn `@Transactional`, mỗi câu lệnh `sql` sẽ mở một transaction riêng; nếu ở giữa bị transaction khác sửa dữ liệu thì các câu lệnh sau sẽ đọc trực tiếp giá trị mới nhất theo thời gian thực.

Chia sẻ thêm giải đáp của người khác về thuộc tính chỉ đọc của transaction:

- Nếu bạn chỉ thực thi một câu lệnh truy vấn duy nhất trong một lần, thì không cần bật hỗ trợ transaction vì cơ sở dữ liệu mặc định hỗ trợ tính nhất quán đọc trong thời gian thực thi câu SQL đó;
- Nếu bạn thực thi nhiều câu lệnh truy vấn trong một lần — ví dụ truy vấn thống kê, truy vấn báo cáo — trong kịch bản này nhiều câu SQL truy vấn phải đảm bảo tính nhất quán đọc tổng thể; nếu không, sau câu SQL trước và trước câu SQL sau mà dữ liệu bị người dùng khác thay đổi, thì toàn bộ truy vấn thống kê đó sẽ gặp trạng thái dữ liệu đọc không nhất quán. Lúc này cần bật hỗ trợ transaction.

#### Quy tắc Rollback của Transaction

Các quy tắc này định nghĩa ngoại lệ nào sẽ khiến transaction rollback và ngoại lệ nào thì không. Mặc định, transaction chỉ rollback khi gặp ngoại lệ runtime (các lớp con của `RuntimeException`), `Error` cũng khiến transaction rollback; tuy nhiên, khi gặp ngoại lệ kiểm tra (Checked Exception) thì transaction sẽ không rollback.

![](/media/jg/local/system-design/framework/spring/images/spring-transaction/roollbackFor-9f314e.png)

Nếu bạn muốn rollback đối với một kiểu ngoại lệ cụ thể do mình tự định nghĩa, bạn có thể viết như sau:

```java
@Transactional(rollbackFor= MyException.class)
```

### Hướng dẫn chi tiết cách sử dụng annotation `@Transactional`

#### Phạm vi tác dụng của `@Transactional`

1. **Phương thức (Method)**: Khuyến nghị đặt annotation trên phương thức. Proxy dựa trên lớp (class-based proxy) của Spring 6 mặc định còn hỗ trợ phương thức `protected` và package-visible; proxy dựa trên interface yêu cầu phương thức phải là phương thức `public` được định nghĩa trong interface. Các phiên bản proxy mode cũ hơn thường chỉ hỗ trợ phương thức `public`.
2. **Lớp (Class)**: Nếu đặt annotation này trên lớp, điều đó có nghĩa là tất cả các phương thức trong lớp thỏa mãn quy tắc khả kiến của proxy nêu trên đều áp dụng cùng một ngữ nghĩa transaction.
3. **Interface**: Không khuyến nghị sử dụng trên interface.

#### Các tham số cấu hình thường dùng của `@Transactional`

Mã nguồn annotation `@Transactional` như sau, bên trong bao gồm cấu hình các thuộc tính transaction cơ bản:

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Transactional {

  @AliasFor("transactionManager")
  String value() default "";

  @AliasFor("value")
  String transactionManager() default "";

  Propagation propagation() default Propagation.REQUIRED;

  Isolation isolation() default Isolation.DEFAULT;

  int timeout() default TransactionDefinition.TIMEOUT_DEFAULT;

  boolean readOnly() default false;

  Class<? extends Throwable>[] rollbackFor() default {};

  String[] rollbackForClassName() default {};

  Class<? extends Throwable>[] noRollbackFor() default {};

  String[] noRollbackForClassName() default {};

}
```

**Tổng hợp các tham số cấu hình thường dùng của `@Transactional` (chỉ liệt kê 5 tham số mình hay dùng nhất):**

| Tên thuộc tính | Mô tả |
| :---------- | :------------------------------------------------------------------------------------------- |
| propagation | Hành vi lan truyền của transaction, mặc định là `REQUIRED`; các giá trị hợp lệ đã giới thiệu ở trên |
| isolation   | Mức độ cô lập của transaction, mặc định dùng `DEFAULT`; các giá trị hợp lệ đã giới thiệu ở trên |
| timeout     | Thời gian timeout của transaction, mặc định là `-1` (không timeout). Nếu quá giới hạn này mà transaction chưa hoàn thành thì tự động rollback. |
| readOnly    | Chỉ định transaction có phải chỉ đọc hay không, mặc định là `false`. |
| rollbackFor | Dùng để chỉ định các kiểu ngoại lệ có thể kích hoạt rollback transaction, và có thể chỉ định nhiều kiểu ngoại lệ. |

#### Nguyên lý hoạt động của annotation `@Transactional`

Đây là một câu hỏi có thể gặp trong phỏng vấn khi hỏi về AOP. Hãy cùng giải thích ngắn gọn!

Chúng ta biết rằng **cơ chế hoạt động của `@Transactional` được hiện thực dựa trên AOP, còn AOP lại được hiện thực bằng Dynamic Proxy. Nếu đối tượng đích có implement interface, mặc định sẽ dùng JDK Dynamic Proxy; nếu đối tượng đích không implement interface, sẽ dùng CGLIB Dynamic Proxy.**

🤐 Nói thêm một chút: phương thức `createAopProxy()` quyết định xem nên dùng JDK hay CGLIB để tạo Dynamic Proxy, mã nguồn như sau:

```java
public class DefaultAopProxyFactory implements AopProxyFactory, Serializable {

  @Override
  public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
    if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
      Class<?> targetClass = config.getTargetClass();
      if (targetClass == null) {
        throw new AopConfigException("TargetSource cannot determine target class: " +
            "Either an interface or a target is required for proxy creation.");
      }
      if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
        return new JdkDynamicAopProxy(config);
      }
      return new ObjenesisCglibAopProxy(config);
    }
    else {
      return new JdkDynamicAopProxy(config);
    }
  }
  .......
}
```

Nếu một lớp hoặc một phương thức `public` trong lớp được gắn annotation `@Transactional`, Spring container sẽ tạo cho nó một lớp proxy khi khởi động. Khi gọi phương thức `public` được gắn `@Transactional`, thực chất thứ được gọi là phương thức `invoke()` trong lớp `TransactionInterceptor`. Tác dụng của phương thức này là mở transaction trước khi chạy phương thức đích, rollback transaction nếu gặp ngoại lệ trong quá trình thực thi phương thức, và commit transaction sau khi phương thức gọi xong.

> Bên trong phương thức `invoke()` của lớp `TransactionInterceptor` thực chất gọi đến phương thức `invokeWithinTransaction()` của lớp `TransactionAspectSupport`. Do các phiên bản Spring mới đã viết lại phần này rất nhiều và sử dụng nhiều kiến thức về Reactive Programming, nên ở đây mình xin không trích dẫn mã nguồn.

#### Vấn đề tự gọi nội bộ (Self-Invocation) trong Spring AOP

Khi một phương thức được gắn annotation `@Transactional`, trình quản lý transaction của Spring sẽ chỉ có hiệu lực khi phương thức đó được gọi từ phương thức của một lớp khác, chứ không có hiệu lực khi được gọi từ một phương thức khác trong cùng một lớp.

Điều này do nguyên lý hoạt động của Spring AOP quyết định. Vì Spring AOP sử dụng Dynamic Proxy để quản lý transaction, nó sẽ tạo đối tượng proxy vào thời điểm runtime cho phương thức có gắn `@Transactional` và áp dụng logic transaction trước/sau lời gọi phương thức. Nếu phương thức đó được lớp khác gọi, đối tượng proxy của chúng ta sẽ chặn (intercept) lời gọi phương thức và xử lý transaction. Nhưng khi gọi nội bộ từ một phương thức khác ngay trong cùng một lớp, đối tượng proxy không thể chặn được lời gọi nội bộ này, do đó transaction bị mất hiệu lực.

Trong lớp `MyService` dưới đây, việc `method1()` gọi `method2()` sẽ khiến transaction của `method2()` mất hiệu lực:

```java
@Service
public class MyService {

private void method1() {
     method2();
     //......
}
@Transactional
 public void method2() {
     //......
  }
}
```

Cách giải quyết là tránh tự gọi nội bộ trong cùng một lớp hoặc sử dụng AspectJ thay thế cho Spring AOP proxy.

[Issue #2091](https://github.com/Snailclimb/JavaGuide/issues/2091) đã bổ sung thêm một ví dụ:

```java
@Service
public class MyService {

private void method1() {
     // Cần cấu hình @EnableAspectJAutoProxy(exposeProxy = true) trước
     ((MyService) AopContext.currentProxy()).method2();
     //......
}
@Transactional
 public void method2() {
     //......
  }
}
```

Đoạn code trên chỉ có thể lấy được đối tượng proxy hiện tại thông qua `AopContext.currentProxy()` sau khi bật `exposeProxy` (ví dụ cấu hình `@EnableAspectJAutoProxy(exposeProxy = true)`). Gọi `method2()` theo cách này sẽ đi qua proxy, nhờ đó annotation transaction mới có hiệu lực. Vì cách viết này khiến code nghiệp vụ bị phụ thuộc vào AOP context, thông thường người ta vẫn khuyến nghị tách nhỏ trách nhiệm của lớp để tránh tự gọi nội bộ.

#### Tổng kết các lưu ý khi sử dụng `@Transactional`

- Giới hạn mức độ khả kiến của phương thức đối với `@Transactional` phụ thuộc vào loại proxy và phiên bản Spring: proxy dựa trên lớp của Spring 6 mặc định hỗ trợ các phương thức `public`, `protected` và package-visible, còn proxy dựa trên interface yêu cầu phương thức phải là `public` được định nghĩa trên interface; các phiên bản proxy mode cũ hơn thường chỉ hỗ trợ phương thức `public`;
- Tránh gọi các phương thức gắn `@Transactional` trong cùng một lớp, vì điều này sẽ khiến transaction mất hiệu lực;
- Thiết lập đúng thuộc tính `rollbackFor` và `propagation` của `@Transactional`, nếu không transaction có thể rollback thất bại;
- Lớp chứa phương thức được gắn `@Transactional` bắt buộc phải do Spring quản lý, nếu không sẽ không có hiệu lực;
- Cơ sở dữ liệu bên dưới bắt buộc phải hỗ trợ cơ chế transaction, nếu không sẽ không có hiệu lực;
- ……

## Tham khảo

- [Tổng kết] Các tham số của `@Transactional` trong quản lý Transaction của Spring: [Bài viết gốc trên mobabel.net](http://www.mobabel.net/spring事务管理中transactional的参数/)
- Tài liệu chính thức của Spring: [https://docs.spring.io/spring/docs/4.2.x/spring-framework-reference/html/transaction.html](https://docs.spring.io/spring/docs/4.2.x/spring-framework-reference/html/transaction.html)
- *Pro Spring 5* (bản tiếng Trung: *Spring 5 Gaoji Biancheng*)
- Nắm vững tường tận cách sử dụng `@Transactional` trong Spring: [https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html](https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html)
- Đặc tính lan truyền của Spring Transaction: [GitHub Wiki - Đặc tính lan truyền của Spring Transaction](https://github.com/love-somnus/Spring/wiki/Spring事务的传播特性)
- [Giải thích chi tiết hành vi lan truyền Transaction trong Spring](https://segmentfault.com/a/1190000013341344): [https://segmentfault.com/a/1190000013341344](https://segmentfault.com/a/1190000013341344)
- Phân tích toàn diện quản lý Transaction theo cách lập trình và khai báo của Spring: [https://www.ibm.com/developerworks/cn/education/opensource/os-cn-spring-trans/index.html](https://www.ibm.com/developerworks/cn/education/opensource/os-cn-spring-trans/index.html)
