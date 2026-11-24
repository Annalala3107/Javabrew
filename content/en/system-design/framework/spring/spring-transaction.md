---
title: Spring Transactions Explained
description: "A comprehensive guide to Spring transaction management, covering the @Transactional annotation, transaction propagation behaviors, isolation levels, scenarios where transactions fail to take effect, and rollback rules."
category: Frameworks
tag:
  - Spring
head:
  - - meta
    - name: keywords
      content: Spring Transactions,@Transactional,Transaction Propagation,Isolation Levels,Transaction Failure Scenarios,Rollback Rules,Declarative Transactions,AOP Transactions
lang: en
sourceRef: zh-ref/system-design/framework/spring/spring-transaction.md
---

The analysis and summary of **Spring transactions** that I promised readers some time ago is finally here. This topic is quite important for both day-to-day work and interviews, yet high-quality reference materials online are relatively scarce.

## What Is a Transaction?

**A transaction is a logical group of operations that either all execute or none execute.**

I believe everyone can recite the sentence above by heart, so below I will explain it in the context of real-world day-to-day development.

Each business method in our system may include multiple atomic database operations. For example, the `savePerson()` method below contains two atomic database operations. These atomic database operations depend on one another—they must either all execute or none execute.

```java
  public void savePerson() {
    personDao.save(person);
    personDetailDao.save(personDetail);
  }
```

In addition, pay special attention to this: **Whether a transaction can take effect depends crucially on whether the database engine supports transactions. For example, the commonly used MySQL database uses the transaction-supporting `innodb` engine by default. However, if you change the database engine to `myisam`, then the application will no longer support transactions!**

The most classic and frequently cited example of a transaction is a money transfer. Suppose Xiao Ming wants to transfer 1,000 yuan to Xiao Hong. This transfer involves two key operations:

> 1. Deduct 1,000 yuan from Xiao Ming's balance.
> 2. Add 1,000 yuan to Xiao Hong's balance.

If an error suddenly occurs between these two operations—such as a bank system crash or a network failure—causing Xiao Ming's balance to decrease without Xiao Hong's balance increasing, that would be wrong. Transactions ensure that these two key operations either both succeed or both fail.

![Transaction illustration](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-a0059ccb.png)

```java
public class OrdersService {
  private AccountDao accountDao;

  public void setOrdersDao(AccountDao accountDao) {
    this.accountDao = accountDao;
  }

  @Transactional(propagation = Propagation.REQUIRED,
                isolation = Isolation.DEFAULT, readOnly = false, timeout = -1)
  public void accountMoney() {
    // Add 1000 to Xiao Hong's account
    accountDao.addMoney(1000,xiaohong);
    // Simulate a sudden exception, such as an unexpected power outage at the bank
    // Without transaction management configured, Xiao Hong's account would gain 1000 while Xiao Ming's account would not lose money
    int i = 10 / 0;
    // Deduct 1000 from Xiao Wang's (xiaoming's) account
    accountDao.reduceMoney(1000,xiaoming);
  }
}
```

In addition, the four ACID properties of database transactions are the foundation of transactions. Let's take a brief look at them below.

## Do You Know the Properties of Transactions (ACID)?

1. **Atomicity**: A transaction is the smallest unit of execution and cannot be divided. Atomicity guarantees that actions either all complete or have no effect at all;
2. **Consistency**: Data remains consistent before and after a transaction executes. For example, in a transfer workflow, whether the transaction succeeds or fails, the combined balance of the sender and recipient should remain unchanged;
3. **Isolation**: When accessing a database concurrently, one user's transaction is not interfered with by other transactions, and the database view across concurrent transactions is independent;
4. **Durability**: Once a transaction is committed, its changes to data in the database are permanent and should not be lost even if the database encounters a failure.

🌈 Here is an extra point worth adding: **Consistency can only be guaranteed after atomicity, isolation, and durability of a transaction are guaranteed. In other words, A, I, and D are the means, and C is the goal!** Many of us, myself included, were misled by the ACID acronym for a long time! I only got this clear after watching Professor Zhou Zhiming's open course [Zhou Zhiming's Software Architecture Course](https://time.geekbang.org/opencourse/intro/100064201) (read more great books!!!).

![AID->C](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/AID--C-94fef59c.png)

In addition, the author of DDIA—[*Designing Data-Intensive Applications*](https://book.douban.com/subject/30329536/)—writes the following in his book:

> Atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. The application may rely on the database’s atomicity and isolation properties in order to achieve consistency, but it’s not up to the database alone.
>
> What this means in plain terms is: atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. An application may rely on the database's atomicity and isolation properties to achieve consistency, yet it does not depend on the database alone. Therefore, the letter C does not belong in ACID.

I strongly recommend *Designing Data-Intensive Applications*—it is worth reading multiple times! Nearly 90% of readers on Douban gave it a five-star rating. Moreover, its Chinese translation is open-sourced on GitHub at [https://github.com/Vonng/ddia](https://github.com/Vonng/ddia).

## A Deep Dive into Spring's Support for Transactions

> ⚠️ One more reminder: Whether your application supports transactions depends first on the database. For example, if you use MySQL and choose the `innodb` engine, congratulations—transactions are supported. However, if your MySQL database uses the `myisam` engine, then unfortunately it fundamentally does not support transactions.

Let's mention another very important point here: **How does MySQL guarantee atomicity?**

We know that to guarantee transaction atomicity, already-executed operations must be **rolled back** when an exception occurs. In MySQL, the recovery mechanism is implemented via the **undo log**. All modifications made by a transaction are recorded in the undo log first before the corresponding operations are executed. If an exception happens during execution, we simply use the information in the **undo log** to roll the data back to its state before the modification! Furthermore, the undo log is persisted to disk before the data itself. This ensures that even if the database suddenly crashes, when the database is restarted, it can still query the undo log to roll back previously unfinished transactions.

### Spring Supports Two Approaches to Transaction Management

#### Programmatic Transaction Management

Transactions are managed manually via `TransactionTemplate` or `TransactionManager`. This is rarely used in practice, but it helps you understand how Spring transaction management works.

An example of programmatic transaction management using `TransactionTemplate` is as follows:

```java
@Autowired
private TransactionTemplate transactionTemplate;
public void testTransaction() {

        transactionTemplate.execute(new TransactionCallbackWithoutResult() {
            @Override
            protected void doInTransactionWithoutResult(TransactionStatus transactionStatus) {

                try {

                    // ....  Business logic
                } catch (Exception e){
                    // Rollback
                    transactionStatus.setRollbackOnly();
                }

            }
        });
}
```

An example of programmatic transaction management using `TransactionManager` is as follows:

```java
@Autowired
private PlatformTransactionManager transactionManager;

public void testTransaction() {

  TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
          try {
               // ....  Business logic
              transactionManager.commit(status);
          } catch (Exception e) {
              transactionManager.rollback(status);
          }
}
```

#### Declarative Transaction Management

Recommended (minimal code intrusion). It is actually implemented via AOP (annotation-based configuration using `@Transactional` is the most widely used approach).

An example of transaction management using the `@Transactional` annotation is as follows:

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

### Introduction to Spring Transaction Management Interfaces

In the Spring framework, the 3 most important interfaces related to transaction management are:

- **`PlatformTransactionManager`**: The (platform) transaction manager, the core of Spring's transaction strategy.
- **`TransactionDefinition`**: Transaction definition information (transaction isolation level, propagation behavior, timeout, read-only, etc.).
- **`TransactionStatus`**: Transaction runtime status.

We can view the **`PlatformTransactionManager`** interface as the upper-level manager of transactions, while **`TransactionDefinition`** and **`TransactionStatus`** can be viewed as descriptions of a transaction.

**`PlatformTransactionManager`** manages transactions based on the definitions in **`TransactionDefinition`**—such as transaction timeout, isolation level, and propagation behavior—while the **`TransactionStatus`** interface provides methods to retrieve the corresponding status of a transaction, such as whether it is a new transaction, whether it is marked for rollback-only, and so on.

#### PlatformTransactionManager: Transaction Management Interface

**Spring does not manage transactions directly; instead, it provides a variety of transaction managers.** Spring's transaction manager interface is **`PlatformTransactionManager`**.

Through this interface, Spring provides corresponding transaction managers for various platforms such as JDBC (`DataSourceTransactionManager`), Hibernate (`HibernateTransactionManager`), and JPA (`JpaTransactionManager`), while the concrete implementation is left to each respective platform.

**The concrete implementations of the `PlatformTransactionManager` interface are as follows:**

![](/media/jg/local/system-design/framework/spring/images/spring-transaction/PlatformTransactionManager-3c604a.png)

Three methods are defined in the `PlatformTransactionManager` interface:

```java
package org.springframework.transaction;

import org.springframework.lang.Nullable;

public interface PlatformTransactionManager {
    // Obtain a transaction
    TransactionStatus getTransaction(@Nullable TransactionDefinition var1) throws TransactionException;
    // Commit the transaction
    void commit(TransactionStatus var1) throws TransactionException;
    // Rollback the transaction
    void rollback(TransactionStatus var1) throws TransactionException;
}

```

**A quick aside here: why define or abstract out the `PlatformTransactionManager` interface?**

Mainly to abstract out transaction management behavior and let different platforms implement it. That way, we can keep the behavior exposed to external callers unchanged and make extensions easy.

I previously shared on my [Knowledge Planet (Zhishi Xingqiu)](https://javaguide.cn/about-the-author/zhishixingqiu-two-years.html): **"Why should we use interfaces?"**

> Years ago, the GoF book *Design Patterns* stated that you should program to an interface, not an implementation. Do you truly know why we should program to interfaces?
>
> Looking across the source code of open-source frameworks and projects, interfaces are an indispensable part of them. To understand why interfaces are used, you first have to understand what functionality an interface provides. You can think of an interface as a contract defining a list of capabilities. The interface itself does not provide functionality; it only defines behavior. Whoever wants to use it must implement the contract, abide by the agreement, and then implement the required capabilities themselves.
>
> For example, in my previous project there was a requirement to send SMS messages. To handle this, we defined an interface with only two methods:
>
> 1. Send SMS; 2. Handle the sending result.
>
> At first, we used Alibaba Cloud SMS service, so we implemented this interface to build an Alibaba Cloud SMS service implementation. Later, we suddenly switched to another SMS service platform—at that point, we only needed to implement this interface again. That ensured the behavior exposed to external callers remained unchanged. With almost no code changes elsewhere, we easily adapted to the new requirement, improving code flexibility and extensibility.
>
> When should you use an interface? Whenever the feature module you are designing involves abstract behaviors—such as an SMS-sending service, an image-hosting storage service, and so on.

#### TransactionDefinition: Transaction Attributes

The transaction manager interface **`PlatformTransactionManager`** obtains a transaction through the **`getTransaction(TransactionDefinition definition)`** method. The parameter to this method is the **`TransactionDefinition`** type, which defines basic transaction attributes.

**What are transaction attributes?** Transaction attributes can be understood as basic configurations of a transaction that describe how the transaction strategy should be applied to a method.

`TransactionDefinition` mainly covers the following 4 transaction configuration aspects:

- Isolation level
- Propagation behavior
- Read-only flag
- Transaction timeout

In addition, the `getName()` method can return the transaction name. Rollback rules do not belong to `TransactionDefinition` itself; `TransactionAttribute`, which is used by Spring declarative transactions, extends `TransactionDefinition` and adds capabilities such as rollback rules on top of it.

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
    // Return the transaction propagation behavior; default is REQUIRED.
    int getPropagationBehavior();
    // Return the transaction isolation level; default is DEFAULT.
    int getIsolationLevel();
    // Return the transaction timeout in seconds; default is -1. If the transaction does not complete within this limit, it rolls back automatically.
    int getTimeout();
    // Return whether this is a read-only transaction; default is false.
    boolean isReadOnly();

    @Nullable
    String getName();
}
```

#### TransactionStatus: Transaction Status

The `TransactionStatus` interface is used to record the status of a transaction. It defines a set of methods for querying or checking corresponding status information about the transaction.

`PlatformTransactionManager.getTransaction(…)` returns a `TransactionStatus` object.

**The `TransactionStatus` interface is defined as follows:**

```java
public interface TransactionStatus{
    boolean isNewTransaction(); // Whether this is a new transaction
    boolean hasSavepoint(); // Whether there is a savepoint
    void setRollbackOnly();  // Set the transaction to rollback-only
    boolean isRollbackOnly(); // Whether it is marked rollback-only
    boolean isCompleted(); // Whether the transaction is completed
}
```

### Detailed Explanation of Transaction Attributes

In real-world business development, people generally use the `@Transactional` annotation to enable transactions, yet many do not fully understand what the parameters inside this annotation mean or what they do. To use transaction management effectively in your projects, I strongly recommend reading the content below carefully.

#### Transaction Propagation Behavior

**Transaction propagation behavior exists to solve transaction issues when service-layer methods call one another.**

When a transactional method is called by another transactional method, you must specify how the transaction should propagate. For instance, the method might continue running within the existing transaction, or it might start a new transaction and run in its own transaction.

For example, suppose we call `bMethod()` of class `B` inside `aMethod()` of class `A`. This involves transaction coordination between service-layer methods calling each other. If `bMethod()` encounters an exception and needs to roll back, how should you configure transaction propagation so that `aMethod()` also rolls back? This is where knowledge of transaction propagation behavior is needed—if you don't know it yet, be sure to read carefully.

The propagation behavior code snippets below are illustrative examples with imports and some implementation details omitted, where `Propagation.xxx` is a placeholder to be replaced rather than a complete compilable class.

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

`TransactionDefinition` defines the following constants representing propagation behaviors:

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

However, for ease of use, Spring correspondingly defines an enum class: `Propagation`

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

**The valid values for transaction propagation behavior are as follows:**

**1. `TransactionDefinition.PROPAGATION_REQUIRED`**

This is the most commonly used transaction propagation behavior, and it is the default used by the `@Transactional` annotation. If a transaction currently exists, join that transaction; if no transaction currently exists, create a new transaction. In other words:

- If the outer method has not started a transaction, an inner method annotated with `Propagation.REQUIRED` will start its own new transaction, and these transactions are independent of each other without interfering with one another.
- If the outer method has started a transaction and is annotated with `Propagation.REQUIRED`, then all inner methods annotated with `Propagation.REQUIRED` and the outer method belong to the same transaction—as long as any one method rolls back, the entire transaction rolls back.

For example, if both `aMethod()` and `bMethod()` above use the `PROPAGATION_REQUIRED` propagation behavior, they share the same transaction; if either method rolls back, the entire transaction rolls back.

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

Create a new transaction, and if a transaction currently exists, suspend the current transaction. That means regardless of whether the outer method has started a transaction, an inner method annotated with `Propagation.REQUIRES_NEW` will start its own new transaction, and the transactions are independent of each other without mutual interference.

For example, suppose `bMethod()` uses `PROPAGATION_REQUIRES_NEW`, while `aMethod()` still uses `PROPAGATION_REQUIRED`. If `aMethod()` throws an exception and rolls back, `bMethod()` will not roll back along with it, because `bMethod()` opened an independent transaction. However, if `bMethod()` throws an uncaught exception and that exception satisfies the transaction rollback rules, `aMethod()` will also roll back, because that exception is detected by `aMethod()`'s transaction management mechanism.

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

If a transaction currently exists, create a transaction to execute as a nested transaction within the current transaction; if no transaction currently exists, behave similarly to `TransactionDefinition.PROPAGATION_REQUIRED`. That means:

- When the outer method has started a transaction, a new transaction is started inside as a nested transaction.
- When the outer method has no transaction, a standalone transaction is started, similar to `PROPAGATION_REQUIRED`.

A nested transaction represented by `TransactionDefinition.PROPAGATION_NESTED` exhibits a parent-child relationship. Its core idea is that the child transaction does not commit independently; it depends on the parent transaction and runs inside the parent transaction. When the parent transaction commits, the child transaction commits along with it, and naturally, when the parent transaction rolls back, the child transaction also rolls back.

> How it differs from `TransactionDefinition.PROPAGATION_REQUIRES_NEW`: `PROPAGATION_REQUIRES_NEW` is an independent transaction that does not depend on the outer transaction; it exists as a sibling peer, commits immediately upon completion, and is unrelated to the outer transaction.

The child transaction also has its own characteristic: it can roll back independently without triggering a rollback of the parent transaction, provided that the child transaction's exception is handled so the outer transaction does not perceive the exception and roll back.

For example:

- If `aMethod()` rolls back, `bMethod()`, being a nested transaction, will roll back.
- If `bMethod()` rolls back, whether `aMethod()` rolls back depends on whether `bMethod()`'s exception is handled:

  - If `bMethod()`'s exception is not handled—meaning neither `bMethod()` internally nor `aMethod()` handles the exception—then `aMethod()` will observe the exception and roll back the entire transaction.

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

  - If `bMethod()` handles the exception or `aMethod()` handles the exception, `aMethod()` will not roll back.

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
                System.out.println("Method rolled back");
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

If a transaction currently exists, join that transaction; if no transaction currently exists, throw an exception.

This one is rarely used, so I will omit an example.

**The following 3 propagation behaviors handle existing transactions differently and must not be understood under the same rollback rule:**

- **`TransactionDefinition.PROPAGATION_SUPPORTS`**: If a transaction currently exists, join that transaction, and the operations within it participate in that transaction's commit or rollback; if no transaction currently exists, execute non-transactionally.
- **`TransactionDefinition.PROPAGATION_NOT_SUPPORTED`**: Always execute non-transactionally; if a transaction currently exists, suspend it first. Therefore, operations executed within this propagation boundary are not governed by the rollback of the suspended outer transaction.
- **`TransactionDefinition.PROPAGATION_NEVER`**: Only allowed to execute non-transactionally; if an active transaction is detected, throw an exception directly.

For more on transaction propagation behaviors, see this article: [Too Hard~ The Interviewer Asked Me to Explain Spring Transaction Propagation Behaviors Using Examples](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486668&idx=2&sn=0381e8c836442f46bdc5367170234abb&chksm=cea24307f9d5ca11c96943b3ccfa1fc70dc97dd87d9c540388581f8fe6d805ff548dff5f6b5b&token=1776990505&lang=zh_CN#rd).

#### Transaction Isolation Levels

Five constants representing isolation levels are defined in the `TransactionDefinition` interface:

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

Just like with transaction propagation behaviors, Spring also defines a corresponding enum class for convenience: `Isolation`

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

Below I introduce each transaction isolation level in turn:

- **`TransactionDefinition.ISOLATION_DEFAULT`**: Uses the default isolation level of the backend database. MySQL defaults to `REPEATABLE_READ`, while Oracle defaults to `READ_COMMITTED`.
- **`TransactionDefinition.ISOLATION_READ_UNCOMMITTED`**: The lowest isolation level and rarely used because it allows reading uncommitted data changes, **which may lead to dirty reads, phantom reads, or non-repeatable reads**.
- **`TransactionDefinition.ISOLATION_READ_COMMITTED`**: Allows reading data already committed by concurrent transactions. **It prevents dirty reads, but phantom reads or non-repeatable reads can still occur.**
- **`TransactionDefinition.ISOLATION_REPEATABLE_READ`**: Multiple reads of the same field return consistent results unless the data was modified by the transaction itself. **It prevents dirty reads and non-repeatable reads, though phantom reads can still occur.**
- **`TransactionDefinition.ISOLATION_SERIALIZABLE`**: The highest isolation level, fully compliant with ACID isolation. All transactions execute sequentially one by one, making interference between transactions impossible—that is, **this level prevents dirty reads, non-repeatable reads, and phantom reads**. However, it severely impacts application performance and is rarely used under normal circumstances.

Related reading: [MySQL Transaction Isolation Levels Explained](https://javaguide.cn/database/mysql/transaction-isolation-level.html).

#### Transaction Timeout Attribute

Transaction timeout refers to the maximum amount of time a transaction is allowed to execute. If the transaction has not completed after exceeding this time limit, it is automatically rolled back. In `TransactionDefinition`, the timeout is represented as an `int` in seconds, with a default value of `-1`, indicating that the transaction timeout depends on the underlying transaction system or has no timeout.

#### Transaction Read-Only Attribute

```java
package org.springframework.transaction;

import org.springframework.lang.Nullable;

public interface TransactionDefinition {
    ......
    // Return whether this is a read-only transaction; default is false
    boolean isReadOnly();

}
```

For transactions that only read data via queries, you can specify the transaction type as `readonly`, i.e., a read-only transaction. Because read-only transactions involve no data modifications, the database can apply certain optimizations, making it suitable for methods that execute multiple database queries.

Many people wonder: why should I enable transaction support for a data query operation?

Take MySQL's InnoDB as an example. According to the official documentation at [https://dev.mysql.com/doc/refman/5.7/en/innodb-autocommit-commit-rollback.html](https://dev.mysql.com/doc/refman/5.7/en/innodb-autocommit-commit-rollback.html):

> MySQL enables `autocommit` mode for each newly established connection by default. In this mode, every `sql` statement sent to the MySQL server is processed in a separate transaction; once execution completes, the transaction is automatically committed and a new transaction begins.

However, if you add the `@Transactional` annotation to a method, all SQL statements executed by that method are placed inside a single transaction. When a read-only transaction is declared, Spring passes the read-only hint to the underlying transaction system; whether and how optimizations are applied depends on the database, driver, and transaction manager, and it does not guarantee that write operations will fail.

Without `@Transactional`, each SQL statement starts a separate transaction, so if data is modified by other transactions in between, subsequent queries will read the latest committed values in real time.

Here is another explanation from others regarding the read-only transaction attribute:

- If you execute a single query statement at a time, there is no need to enable transaction support, because the database supports read consistency during the execution of that SQL statement by default;
- If you execute multiple query statements in one go—such as statistical queries or report queries—the multiple query SQL statements must guarantee overall read consistency. Otherwise, if data is modified by another user after an earlier SQL query finishes and before a later SQL query runs, the overall statistical query will suffer from inconsistent read data. In this scenario, transaction support should be enabled.

#### Transaction Rollback Rules

These rules define which exceptions cause a transaction to roll back and which do not. By default, a transaction only rolls back when encountering runtime exceptions (subclasses of `RuntimeException`), and `Error` also causes a rollback; however, it does not roll back when encountering checked exceptions.

![](/media/jg/local/system-design/framework/spring/images/spring-transaction/roollbackFor-9f314e.png)

If you want to roll back on a specific custom exception type, you can configure it like this:

```java
@Transactional(rollbackFor= MyException.class)
```

### Detailed Usage of the `@Transactional` Annotation

#### Scope of `@Transactional`

1. **Method**: Recommended to place the annotation on methods. Spring 6's class-based proxies also support `protected` and package-visible methods by default; interface-based proxies require the method to be a `public` method defined in the interface. Earlier versions of proxy mode generally supported only `public` methods.
2. **Class**: If this annotation is placed on a class, it indicates that all methods in the class matching the proxy visibility rules above share the same transaction semantics.
3. **Interface**: Not recommended for use on interfaces.

#### Common Configuration Parameters of `@Transactional`

The source code of the `@Transactional` annotation is shown below, containing basic transaction attribute configurations:

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

**Summary of common `@Transactional` configuration parameters (only the 5 I use most frequently are listed):**

| Attribute Name | Description |
| :---------- | :------------------------------------------------------------------------------------------- |
| propagation | Transaction propagation behavior. Default is `REQUIRED`; valid values were introduced above. |
| isolation   | Transaction isolation level. Default is `DEFAULT`; valid values were introduced above. |
| timeout     | Transaction timeout in seconds. Default is `-1` (no timeout). If the transaction does not complete within this limit, it rolls back automatically. |
| readOnly    | Specifies whether the transaction is read-only. Default is `false`. |
| rollbackFor | Used to specify exception types that trigger transaction rollback; multiple exception types can be specified. |

#### Principle of the `@Transactional` Annotation

This is a question that may come up when interviewing about AOP. Let's explain it briefly!

We know that **`@Transactional` works based on AOP, and AOP is implemented using dynamic proxies. If the target object implements interfaces, JDK dynamic proxy is used by default; if the target object does not implement any interfaces, CGLIB dynamic proxy is used.**

🤐 On a side note: the `createAopProxy()` method decides whether to use JDK or CGLIB for dynamic proxying. Its source code is as follows:

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

When a class or a `public` method in a class is annotated with `@Transactional`, the Spring container creates a proxy class for it at startup. When the `public` method annotated with `@Transactional` is invoked, what is actually executed is the `invoke()` method in the `TransactionInterceptor` class. This method opens a transaction before invoking the target method, rolls back the transaction if an exception occurs during method execution, and commits the transaction after the method invocation completes.

> Internally, `TransactionInterceptor.invoke()` actually calls the `invokeWithinTransaction()` method of `TransactionAspectSupport`. Since newer versions of Spring have heavily rewritten this part using extensive reactive programming concepts, I won't list the source code here.

#### Spring AOP Self-Invocation Issue

When a method is annotated with `@Transactional`, the Spring transaction manager only takes effect when invoked by a method in another class, and does not take effect when invoked by another method within the same class.

This is determined by how Spring AOP works. Because Spring AOP uses dynamic proxies to manage transactions, it generates a proxy object at runtime for methods annotated with `@Transactional` and applies transaction logic before and after method invocation. When the method is called by another class, the proxy object intercepts the method call and handles the transaction. However, during an internal call from another method within the same class, the proxy object cannot intercept that internal call, so the transaction fails to take effect.

In the `MyService` class below, `method1()` calling `method2()` causes `method2()`'s transaction to fail:

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

The solution is to avoid self-invocation within the same class or use AspectJ instead of Spring AOP proxies.

[Issue #2091](https://github.com/Snailclimb/JavaGuide/issues/2091) added an example:

```java
@Service
public class MyService {

private void method1() {
     // Requires configuring @EnableAspectJAutoProxy(exposeProxy = true) first
     ((MyService) AopContext.currentProxy()).method2();
     //......
}
@Transactional
 public void method2() {
     //......
  }
}
```

In the code above, retrieving the current proxy object via `AopContext.currentProxy()` only works after enabling `exposeProxy` (for example, configuring `@EnableAspectJAutoProxy(exposeProxy = true)`). Calling `method2()` this way goes through the proxy so the transaction annotation takes effect. Because this approach makes business code depend on the AOP context, splitting class responsibilities is usually preferred to avoid self-invocation.

#### Summary of Caveats When Using `@Transactional`

- Method visibility restrictions for `@Transactional` depend on the proxy type and Spring version: Spring 6 class-based proxies support `public`, `protected`, and package-visible methods by default, while interface-based proxies require `public` methods defined on the interface; earlier proxy modes generally supported only `public` methods.
- Avoid calling `@Transactional`-annotated methods within the same class, as this causes the transaction to fail to take effect.
- Properly configure the `rollbackFor` and `propagation` attributes of `@Transactional`; otherwise, transaction rollback may fail.
- The class containing the `@Transactional`-annotated method must be managed by Spring; otherwise, it will not take effect.
- The underlying database must support transactions; otherwise, it will not take effect.
- ...

## References

- [Summary] Parameters of `@Transactional` in Spring Transaction Management: [Original article on mobabel.net](http://www.mobabel.net/spring事务管理中transactional的参数/)
- Spring Official Documentation: [https://docs.spring.io/spring/docs/4.2.x/spring-framework-reference/html/transaction.html](https://docs.spring.io/spring/docs/4.2.x/spring-framework-reference/html/transaction.html)
- *Pro Spring 5* (Chinese edition: *Spring 5 Gaoji Biancheng*)
- Thoroughly Mastering the Usage of `@Transactional` in Spring: [https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html](https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html)
- Propagation Characteristics of Spring Transactions: [GitHub Wiki - Propagation Characteristics of Spring Transactions](https://github.com/love-somnus/Spring/wiki/Spring事务的传播特性)
- [Detailed Explanation of Spring Transaction Propagation Behavior](https://segmentfault.com/a/1190000013341344): [https://segmentfault.com/a/1190000013341344](https://segmentfault.com/a/1190000013341344)
- Comprehensive Analysis of Programmatic and Declarative Transaction Management in Spring: [https://www.ibm.com/developerworks/cn/education/opensource/os-cn-spring-trans/index.html](https://www.ibm.com/developerworks/cn/education/opensource/os-cn-spring-trans/index.html)
