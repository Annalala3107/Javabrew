---
title: "Phân tích nguyên lý Annotation @Async"
description: "Giải thích chi tiết nguyên lý annotation bất đồng bộ @Async trong Spring, bao gồm cấu hình tác vụ bất đồng bộ, thiết lập Thread Pool, cơ chế @EnableAsync và các lỗi thường gặp khi sử dụng."
category: Framework
tag:
  - Spring
lang: vi
sourceRef: zh-ref/system-design/framework/spring/async.md
head:
  - - meta
    - name: keywords
      content: Spring bất đồng bộ,@Async,EnableAsync,Thread Pool,TaskExecutor,Tác vụ bất đồng bộ,Spring Annotation,Phương thức bất đồng bộ
---

Annotation `@Async` được cung cấp bởi Spring Framework; class hoặc phương thức được đánh dấu bằng annotation này sẽ được thực thi trên một **Thread bất đồng bộ**. Điều này đồng nghĩa với việc khi phương thức được gọi, bên gọi (caller) sẽ không phải chờ phương thức đó thực thi xong mà có thể tiếp tục chạy ngay các đoạn code phía sau.

Cách sử dụng annotation `@Async` rất đơn giản, chỉ cần hai bước:

1. Thêm annotation `@EnableAsync` vào class khởi chạy (startup class) để bật tính năng tác vụ bất đồng bộ.
2. Thêm annotation `@Async` vào phương thức hoặc class cần thực thi bất đồng bộ.

```java
@SpringBootApplication
// Bật tác vụ bất đồng bộ
@EnableAsync
public class YourApplication {

    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}

// Class service bất đồng bộ
@Service
public class MyService {

    // Khuyến nghị dùng Thread Pool tùy chỉnh; ở đây chỉ minh họa cách dùng cơ bản
    @Async
    public CompletableFuture<String> doSomethingAsync() {

        // Ở đây sẽ có các thao tác nghiệp vụ tốn thời gian
        // ...
        // Dùng CompletableFuture giúp xử lý kết quả tác vụ bất đồng bộ thuận tiện hơn, tránh block luồng chính
        return CompletableFuture.completedFuture("Async Task Completed");
    }

}
```

Tiếp theo, hãy cùng tìm hiểu nguyên lý bên dưới của `@Async`.

## Phân tích nguyên lý `@Async`

`@Async` có thể thực thi tác vụ bất đồng bộ thực chất là nhờ sử dụng **Dynamic Proxy**. Thông qua bộ hậu xử lý `BeanPostProcessor` trong Spring để tạo Dynamic Proxy cho các class có dùng annotation `@Async`, sau đó các lời gọi tới phương thức gắn `@Async` sẽ bị Dynamic Proxy chặn lại; bên trong interceptor, quá trình thực thi phương thức sẽ được đóng gói thành một tác vụ bất đồng bộ rồi đưa vào Thread Pool xử lý.

Hãy cùng phân tích chi tiết từng bước.

### Bật hỗ trợ bất đồng bộ

Trước khi dùng `@Async`, cần gắn `@EnableAsync` lên class khởi chạy để kích hoạt chế độ bất đồng bộ. Annotation `@EnableAsync` có định nghĩa như sau:

```JAVA
// Lược bỏ các annotation khác ...
@Import(AsyncConfigurationSelector.class)
public @interface EnableAsync { /* ... */ }
```

Trên annotation `@EnableAsync` có sử dụng `@Import` để nạp `AsyncConfigurationSelector`, do đó Spring sẽ tải các class được import thông qua `@Import`.

Class `AsyncConfigurationSelector` triển khai interface `ImportSelector` (thông qua `AdviceModeImportSelector`), vì vậy nó ghi đè (`Override`) phương thức `selectImports()` để tùy chỉnh logic nạp Bean như sau:

```JAVA
public class AsyncConfigurationSelector extends AdviceModeImportSelector<EnableAsync> {
	@Override
	@Nullable
	public String[] selectImports(AdviceMode adviceMode) {
		switch (adviceMode) {
	   // Advice được weave dựa trên Spring AOP proxy, cụ thể có thể dùng JDK Dynamic Proxy hoặc CGLIB
			case PROXY:
				return new String[] {ProxyAsyncConfiguration.class.getName()};
   // Advice được weave dựa trên AspectJ
			case ASPECTJ:
				return new String[] {ASYNC_EXECUTION_ASPECT_CONFIGURATION_CLASS_NAME};
			default:
				return null;
		}
	}
}
```

Trong phương thức `selectImports()`, tùy vào loại Advice mà hệ thống sẽ chọn nạp class khác nhau, trong đó giá trị mặc định của `adviceMode` là `PROXY`.

Lấy ví dụ với Advice dựa trên Spring AOP proxy, lúc này class `ProxyAsyncConfiguration` sẽ được nạp như sau:

```JAVA
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class ProxyAsyncConfiguration extends AbstractAsyncConfiguration {
	@Bean(name = TaskManagementConfigUtils.ASYNC_ANNOTATION_PROCESSOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public AsyncAnnotationBeanPostProcessor asyncAdvisor() {
		 // ...
  // Nạp hậu xử lý (BeanPostProcessor)
		AsyncAnnotationBeanPostProcessor bpp = new AsyncAnnotationBeanPostProcessor();

  // ...
		return bpp;
	}
}
```

### Hậu xử lý (`BeanPostProcessor`)

Trong class `ProxyAsyncConfiguration`, thông qua `@Bean`, hệ thống nạp một bộ hậu xử lý là `AsyncAnnotationBeanPostProcessor`; đây chính là thành phần mấu chốt giúp annotation `@Async` phát huy tác dụng.

Nếu một class hoặc phương thức có gắn annotation `@Async`, bộ xử lý `AsyncAnnotationBeanPostProcessor` sẽ tạo một Dynamic Proxy cho class đó.

Khi các phương thức của class này được thực thi, chúng sẽ bị interceptor của đối tượng proxy chặn lại, trong đó những phương thức được đánh dấu `@Async` sẽ được thực thi bất đồng bộ.

Mã nguồn của `AsyncAnnotationBeanPostProcessor` như sau:

```JAVA
public class AsyncAnnotationBeanPostProcessor extends AbstractBeanFactoryAwareAdvisingPostProcessor {
	@Override
	public void setBeanFactory(BeanFactory beanFactory) {
		super.setBeanFactory(beanFactory);
  // Tạo AsyncAnnotationAdvisor, đây là một Advisor
  // dùng để chặn các phương thức có annotation @Async và thực thi chúng bất đồng bộ.
		AsyncAnnotationAdvisor advisor = new AsyncAnnotationAdvisor(this.executor, this.exceptionHandler);
  // Nếu có cấu hình asyncAnnotationType tùy chỉnh thì thiết lập vào advisor.
  // asyncAnnotationType dùng để chỉ định annotation bất đồng bộ tùy chỉnh, ví dụ @MyAsync.
		if (this.asyncAnnotationType != null) {
			advisor.setAsyncAnnotationType(this.asyncAnnotationType);
		}
		advisor.setBeanFactory(beanFactory);
		this.advisor = advisor;
	}
}
```

Class cha của `AsyncAnnotationBeanPostProcessor` triển khai interface `BeanFactoryAware`, nên ở đây nó ghi đè (`Override`) phương thức `setBeanFactory()` làm điểm mở rộng để khởi tạo `AsyncAnnotationAdvisor`.

#### Khởi tạo Advisor

`Advisor` là lớp trừu tượng của `Spring AOP` kết hợp giữa `Advice` và `Pointcut`: `Advice` là logic thông báo được thực thi, còn `Pointcut` là điểm cắt xác định nơi Advice được áp dụng.

Trong bộ hậu xử lý `AsyncAnnotationBeanPostProcessor` sẽ khởi tạo `AsyncAnnotationAdvisor`; bên trong constructor của nó sẽ xây dựng `Advice` và `Pointcut` tương ứng như sau:

```JAVA
public class AsyncAnnotationAdvisor extends AbstractPointcutAdvisor implements BeanFactoryAware {

    private Advice advice; // Advice thực thi bất đồng bộ
    private Pointcut pointcut; // Pointcut khớp với các phương thức gắn @Async

    // Constructor
    public AsyncAnnotationAdvisor(/* Lược bỏ tham số */) {
        // 1. Tạo Advice, phụ trách logic thực thi bất đồng bộ
        this.advice = buildAdvice(executor, exceptionHandler);
        // 2. Tạo Pointcut, chọn các phương thức mục tiêu cần tăng cường
        this.pointcut = buildPointcut(asyncAnnotationTypes);
    }

    // Tạo Advice
    protected Advice buildAdvice(/* Lược bỏ tham số */) {
        // Tạo interceptor xử lý thực thi bất đồng bộ
        AnnotationAsyncExecutionInterceptor interceptor = new AnnotationAsyncExecutionInterceptor(null);
        // Cấu hình interceptor với executor và exceptionHandler
        interceptor.configure(executor, exceptionHandler);
        return interceptor;
    }

    // Tạo Pointcut
    protected Pointcut buildPointcut(Set<Class<? extends Annotation>> asyncAnnotationTypes) {
        ComposablePointcut result = null;
        for (Class<? extends Annotation> asyncAnnotationType : asyncAnnotationTypes) {
            // 1. Pointcut cấp class: khớp nếu trên class có gắn annotation
            Pointcut cpc = new AnnotationMatchingPointcut(asyncAnnotationType, true);
            // 2. Pointcut cấp phương thức: khớp nếu trên phương thức có gắn annotation
            Pointcut mpc = new AnnotationMatchingPointcut(null, asyncAnnotationType, true);

            if (result == null) {
                result = new ComposablePointcut(cpc);
            } else {
                // Dùng union để gộp với pointcut trước đó
                result.union(cpc);
            }
            // Thêm pointcut cấp phương thức vào ComposablePointcut
            result = result.union(mpc);
        }
        // Trả về pointcut kết hợp; nếu không có annotation type nào thì trả về Pointcut.TRUE
        return (result != null ? result : Pointcut.TRUE);
    }
}
```

Trọng tâm của `AsyncAnnotationAdvisor` nằm ở việc xây dựng `Advice` và `Pointcut`:

- Xây dựng `Advice`: Khởi tạo interceptor `AnnotationAsyncExecutionInterceptor`; logic của Advice sẽ được thực thi bên trong phương thức `invoke()` của interceptor này.
- Xây dựng `Pointcut`: Cấu thành từ `ClassFilter` và `MethodMatcher`, dùng để đối khớp xem những phương thức nào cần áp dụng logic của `Advice`.

#### Logic hậu xử lý

Phương thức `postProcessAfterInitialization()` trong bộ hậu xử lý `AsyncAnnotationBeanPostProcessor` thực chất nằm ở class cha `AbstractAdvisingBeanPostProcessor`. Sau khi `Bean` khởi tạo xong, luồng chạy sẽ đi vào `postProcessAfterInitialization()` để thực hiện hậu xử lý.

Trong phương thức hậu xử lý, Spring kiểm tra xem `Bean` có thỏa mãn điều kiện của `Advisor` hay không; nếu thỏa mãn thì tạo đối tượng proxy như sau:

```JAVA
// AbstractAdvisingBeanPostProcessor
public Object postProcessAfterInitialization(Object bean, String beanName) {
	if (this.advisor == null || bean instanceof AopInfrastructureBean) {
		return bean;
	}
	if (bean instanceof Advised) {
		Advised advised = (Advised) bean;
		if (!advised.isFrozen() && isEligible(AopUtils.getTargetClass(bean))) {
			if (this.beforeExistingAdvisors) {
				advised.addAdvisor(0, this.advisor);
			}
			else {
				advised.addAdvisor(this.advisor);
			}
			return bean;
		}
	}
 // Kiểm tra xem Bean được truyền vào có đáp ứng điều kiện áp dụng Advisor hay không; nếu có thì tạo đối tượng proxy.
	if (isEligible(bean, beanName)) {
		ProxyFactory proxyFactory = prepareProxyFactory(bean, beanName);
		if (!proxyFactory.isProxyTargetClass()) {
			evaluateProxyInterfaces(bean.getClass(), proxyFactory);
		}
  // Thêm Advisor.
		proxyFactory.addAdvisor(this.advisor);
		customizeProxyFactory(proxyFactory);
  // Trả về đối tượng proxy.
		return proxyFactory.getProxy(getProxyClassLoader());
	}
	return bean;
}
```

### Chặn lời gọi phương thức gắn `@Async`

Việc thực thi phương thức gắn `@Async` sẽ bị chặn lại trong `AnnotationAsyncExecutionInterceptor`, và logic của interceptor được chạy bên trong `invoke()`. Tại đây, phương thức đánh dấu `@Async` được đóng gói thành tác vụ bất đồng bộ rồi giao cho executor thực thi.

Phương thức `invoke()` được định nghĩa trong `AsyncExecutionInterceptor` (class cha của `AnnotationAsyncExecutionInterceptor`) như sau:

```JAVA
public class AsyncExecutionInterceptor extends AsyncExecutionAspectSupport implements MethodInterceptor, Ordered {
	@Override
	@Nullable
	public Object invoke(final MethodInvocation invocation) throws Throwable {
		Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);
		Method specificMethod = ClassUtils.getMostSpecificMethod(invocation.getMethod(), targetClass);
		final Method userDeclaredMethod = BridgeMethodResolver.findBridgedMethod(specificMethod);

  // 1. Xác định Executor cho tác vụ bất đồng bộ
		AsyncTaskExecutor executor = determineAsyncExecutor(userDeclaredMethod);

  // 2. Đóng gói phương thức cần chạy thành tác vụ bất đồng bộ Callable
		Callable<Object> task = () -> {
			try {
    // 2.1 Thực thi phương thức
				Object result = invocation.proceed();
    // 2.2 Nếu giá trị trả về thuộc kiểu Future, block để chờ lấy kết quả
				if (result instanceof Future) {
					return ((Future<?>) result).get();
				}
			}
			catch (ExecutionException ex) {
				handleError(ex.getCause(), userDeclaredMethod, invocation.getArguments());
			}
			catch (Throwable ex) {
				handleError(ex, userDeclaredMethod, invocation.getArguments());
			}
			return null;
		};
		// 3. Gửi tác vụ (submit)
		return doSubmit(task, executor, invocation.getMethod().getReturnType());
	}
}
```

Trong phương thức `invoke()` có 3 bước chính:

1. Xác định executor sẽ thực thi tác vụ bất đồng bộ.
2. Đóng gói phương thức gắn `@Async` thành một tác vụ bất đồng bộ `Callable`.
3. Gửi tác vụ cho executor thực thi.

#### 1. Lấy Executor cho tác vụ bất đồng bộ

Trong phương thức `determineAsyncExecutor()`, Spring sẽ lấy ra executor của tác vụ bất đồng bộ (tức **Thread Pool** thực thi tác vụ bất đồng bộ). Mã nguồn như sau:

```JAVA
// Xác định executor cho tác vụ bất đồng bộ
protected AsyncTaskExecutor determineAsyncExecutor(Method method) {
 // 1. Lấy từ cache trước.
	AsyncTaskExecutor executor = this.executors.get(method);
	if (executor == null) {
		Executor targetExecutor;
  // 2. Lấy qualifier của executor.
		String qualifier = getExecutorQualifier(method);
		if (StringUtils.hasLength(qualifier)) {
   // 3. Tìm executor tương ứng dựa vào qualifier.
			targetExecutor = findQualifiedExecutor(this.beanFactory, qualifier);
		}
		else {
   // 4. Nếu không có qualifier thì dùng executor mặc định do Spring cung cấp: SimpleAsyncTaskExecutor.
			targetExecutor = this.defaultExecutor.get();
		}
		if (targetExecutor == null) {
			return null;
		}
  // 5. Bọc executor thành adapter TaskExecutorAdapter.
  // TaskExecutorAdapter là một lớp trừu tượng của Spring bọc quanh Thread Pool của JDK (kế thừa Executor).
  // Ở đây không cần đi quá sâu, chỉ cần hiểu nó là Thread Pool là được.
		executor = (targetExecutor instanceof AsyncListenableTaskExecutor ?
				(AsyncListenableTaskExecutor) targetExecutor : new TaskExecutorAdapter(targetExecutor));
		this.executors.put(method, executor);
	}
	return executor;
}
```

Trong `determineAsyncExecutor()`, việc xác định executor (Thread Pool) cho tác vụ bất đồng bộ chủ yếu dựa vào thuộc tính `value` của annotation `@Async` để lấy qualifier, sau đó dùng qualifier này tìm kiếm executor tương ứng trong `BeanFactory`.

Nếu trong `@Async` không chỉ định Thread Pool, Spring sẽ lấy Thread Pool mặc định thông qua `this.defaultExecutor.get()`, trong đó `defaultExecutor` được gán giá trị bởi phương thức dưới đây:

```JAVA
// AsyncExecutionInterceptor
protected Executor getDefaultExecutor(@Nullable BeanFactory beanFactory) {
 // 1. Thử lấy Thread Pool từ beanFactory.
	Executor defaultExecutor = super.getDefaultExecutor(beanFactory);
 // 2. Nếu trong beanFactory không có thì khởi tạo SimpleAsyncTaskExecutor.
	return (defaultExecutor != null ? defaultExecutor : new SimpleAsyncTaskExecutor());
}
```

Trong đó `super.getDefaultExecutor()` sẽ thử tìm Thread Pool kiểu `Executor` trong `beanFactory`. Mã nguồn như sau:

```JAVA
protected Executor getDefaultExecutor(@Nullable BeanFactory beanFactory) {
	if (beanFactory != null) {
		try {
   // 1. Lấy Thread Pool kiểu TaskExecutor từ beanFactory.
			return beanFactory.getBean(TaskExecutor.class);
		}
		catch (NoUniqueBeanDefinitionException ex) {
			try {
				// 2. Nếu có nhiều bean, thử lấy Executor theo tên mặc định từ beanFactory.
				return beanFactory.getBean(DEFAULT_TASK_EXECUTOR_BEAN_NAME, Executor.class);
			}
			catch (NoSuchBeanDefinitionException ex2) {
				if (logger.isInfoEnabled()) {
					// ...
				}
			}
		}
		catch (NoSuchBeanDefinitionException ex) {
			try {
    // 3. Nếu không có, thử lấy Executor theo tên mặc định từ beanFactory.
				return beanFactory.getBean(DEFAULT_TASK_EXECUTOR_BEAN_NAME, Executor.class);
			}
			catch (NoSuchBeanDefinitionException ex2) {
				// ...
			}
		}
	}
	return null;
}
```

Trong `getDefaultExecutor()`, nếu không lấy được Thread Pool từ `beanFactory`, Spring sẽ tạo `SimpleAsyncTaskExecutor`.

Executor này mỗi khi chạy một tác vụ bất đồng bộ đều tạo một Thread hoàn toàn mới để thực thi chứ không tái sử dụng lại Thread, khiến chi phí chạy tác vụ bất đồng bộ rất lớn. Một khi lưu lượng truy cập vào phương thức gắn `@Async` tăng đột biến trong một thời điểm, ứng dụng sẽ tạo ra hàng loạt Thread, làm suy giảm chất lượng dịch vụ thậm chí khiến dịch vụ ngừng hoạt động.

Nếu tại cùng một thời điểm gửi 10.000 tác vụ vào `SimpleAsyncTaskExecutor`, nó sẽ tạo ra đúng 10.000 Thread; phương thức `doExecute()` của nó như sau:

```JAVA
// SimpleAsyncTaskExecutor: execute() bên trong sẽ gọi doExecute()
protected void doExecute(Runnable task) {
    // Tạo Thread mới
    Thread thread = (this.threadFactory != null ? this.threadFactory.newThread(task) : createThread(task));
    thread.start();
}
```

**Khuyến nghị: Khi dùng `@Async`, bắt buộc nên tự chỉ định Thread Pool riêng để tránh rủi ro từ executor mặc định của Spring.**

Thuộc tính `value` trong `@Async` dùng để chỉ định qualifier của Thread Pool, nhờ đó có thể lấy được **Thread Pool tùy chỉnh**. Mã nguồn lấy qualifier như sau:

```JAVA
// AnnotationAsyncExecutionInterceptor
protected String getExecutorQualifier(Method method) {
	// 1. Lấy annotation @Async trên phương thức.
	Async async = AnnotatedElementUtils.findMergedAnnotation(method, Async.class);
 // 2. Nếu trên phương thức không có @Async, thử tìm @Async trên class chứa phương thức đó.
	if (async == null) {
		async = AnnotatedElementUtils.findMergedAnnotation(method.getDeclaringClass(), Async.class);
	}
 // 3. Nếu tìm thấy @Async thì lấy giá trị value trả về làm qualifier của Thread Pool.
 //    Nếu thuộc tính "value" là chuỗi rỗng thì dùng Thread Pool mặc định.
 //    Nếu không tìm thấy @Async thì trả về null, cũng dùng Thread Pool mặc định.
	return (async != null ? async.value() : null);
}
```

#### 2. Đóng gói phương thức thành tác vụ bất đồng bộ

Sau khi `invoke()` lấy được executor, phương thức sẽ được đóng gói thành tác vụ bất đồng bộ như sau:

```JAVA
// Đóng gói phương thức cần chạy thành tác vụ bất đồng bộ Callable
Callable<Object> task = () -> {
    try {
        // 2.1 Thực thi phương thức bị chặn (proceed() là phương thức cốt lõi của AOP để chạy phương thức mục tiêu)
        Object result = invocation.proceed();

        // 2.2 Giá trị proxy trả về cho bên gọi là Future bất đồng bộ thực sự, còn phương thức mục tiêu
        //     do bị ràng buộc bởi chữ ký hàm nên trước mắt trả về một Future tạm thời; do đó worker thread
        //     cần giải gói (unwrap) kết quả từ Future tạm thời này tại đây.
        if (result instanceof Future) {
            return ((Future<?>) result).get(); // Block chờ kết quả của Future
        }
    }
    catch (ExecutionException ex) {
        // 2.3 Xử lý ngoại lệ ExecutionException do Future.get() ném ra
        handleError(ex.getCause(), userDeclaredMethod, invocation.getArguments()); // Xử lý ngoại lệ gốc
    }
    catch (Throwable ex) {
        // 2.4 Xử lý các loại ngoại lệ khác bằng cách truyền exception, phương thức và tham số vào handleError()
        handleError(ex, userDeclaredMethod, invocation.getArguments());
    }
    // 2.5 Nếu kiểu trả về của phương thức không phải Future hoặc xảy ra ngoại lệ thì trả về null
    return null;
};
```

So với `Runnable`, `Callable` có thể trả về kết quả và ném ra ngoại lệ.

Việc thực thi `invocation.proceed()` (tức phương thức gốc) được đóng gói thành một tác vụ bất đồng bộ `Callable`. Ở đây chỉ khi `result` (giá trị trả về của phương thức) thuộc kiểu `Future` thì mới trả về kết quả, còn nếu thuộc kiểu khác thì trả về trực tiếp `null`.

Vì vậy, nếu phương thức gắn `@Async` sử dụng kiểu trả về khác `Future` thì bên gọi sẽ không thể lấy được kết quả thực thi của phương thức.

#### 3. Gửi tác vụ bất đồng bộ đi thực thi

Sau khi đóng gói phương thức thành tác vụ `Callable` trong `AsyncExecutionInterceptor#invoke()`, tác vụ sẽ được giao cho executor thực thi. Dưới đây là đoạn trích mã nguồn `doSubmit()` của Spring Framework 5.3.x, trong đó có chứa API liên quan đến `ListenableFuture` mà sau này đã bị deprecated và gỡ bỏ:

```JAVA
protected Object doSubmit(Callable<Object> task, AsyncTaskExecutor executor, Class<?> returnType) {
    // Dựa vào kiểu trả về của phương thức để chọn cách thực thi bất đồng bộ và trả kết quả tương ứng.
    // 1. Nếu kiểu trả về của phương thức là CompletableFuture
    if (CompletableFuture.class.isAssignableFrom(returnType)) {
        // Dùng CompletableFuture.supplyAsync() để thực thi tác vụ bất đồng bộ.
        return CompletableFuture.supplyAsync(() -> {
            try {
                return task.call();
            }
            catch (Throwable ex) {
                throw new CompletionException(ex); // Bọc ngoại lệ vào CompletionException để ném ra khi gọi future.get()
            }
        }, executor);
    }
    // 2. Nếu kiểu trả về của phương thức là ListenableFuture
    else if (ListenableFuture.class.isAssignableFrom(returnType)) {
        // Ép kiểu AsyncTaskExecutor sang AsyncListenableTaskExecutor
        // và gọi submitListenable() để gửi tác vụ.
        // AsyncListenableTaskExecutor là executor chuyên dụng cho ListenableFuture,
        // trả về đối tượng ListenableFuture cho phép gắn callback lắng nghe khi tác vụ hoàn thành.
        return ((AsyncListenableTaskExecutor) executor).submitListenable(task);
    }
    // 3. Nếu kiểu trả về của phương thức là Future
    else if (Future.class.isAssignableFrom(returnType)) {
        // Gọi trực tiếp submit() của AsyncTaskExecutor để gửi tác vụ và trả về đối tượng Future.
        return executor.submit(task);
    }
    // 4. Nếu kiểu trả về là void hoặc kiểu khác
    else {
        // Gọi trực tiếp submit() của AsyncTaskExecutor để gửi tác vụ.
        // Do kiểu trả về là void nên không cần trả về kết quả, trả thẳng null.
        executor.submit(task);
        return null;
    }
}
```

Trong phương thức `doSubmit()`, dựa vào kiểu trả về khác nhau của phương thức gắn `@Async`, Spring chọn cách submit tác vụ phù hợp, và cuối cùng tác vụ sẽ được executor (Thread Pool) thực thi.

### Tổng kết

![Tổng kết nguyên lý @Async](/media/jg/local/system-design/framework/spring/images/async/async-fdac6b.png)

Cốt lõi để hiểu nguyên lý của `@Async` là hiểu annotation `@EnableAsync`—annotation kích hoạt tính năng tác vụ bất đồng bộ.

Luồng chính như hình trên: thông qua bộ hậu xử lý (`BeanPostProcessor`) để tạo đối tượng proxy, sau đó khi gọi phương thức `@Async` trên đối tượng proxy, luồng chạy sẽ đi vào interceptor bên trong `Advice`, rồi đóng gói phương thức thành tác vụ bất đồng bộ và đưa vào Thread Pool xử lý.

## Khuyến nghị khi sử dụng `@Async`

### Tùy chỉnh Thread Pool

Nếu không cấu hình Thread Pool một cách tường minh, ở tầng dưới của `@Async`, Spring sẽ thử lấy Thread Pool từ `BeanFactory` trước; nếu không lấy được thì sẽ khởi tạo `SimpleAsyncTaskExecutor`. `SimpleAsyncTaskExecutor` về bản chất không phải là một Thread Pool thực thụ vì nó tạo mới một Thread cho mỗi yêu cầu thay vì tái sử dụng các Thread hiện có, điều này dẫn tới nhiều vấn đề tiềm ẩn như tiêu tốn tài nguyên quá mức.

Chi tiết về cách lấy Thread Pool bạn có thể tham khảo bài viết này: [Phân tích nguyên lý Thread Pool bất đồng bộ bên dưới annotation @Async trong Spring | Dewu Tech](https://mp.weixin.qq.com/s/FySv5L0bCdrlb5MoSfQtAA).

Nhất định phải cấu hình tường minh một Thread Pool, khuyến nghị dùng `ThreadPoolTaskExecutor`. Ngoài ra, tùy theo tính chất và yêu cầu của từng tác vụ, bạn còn có thể chỉ định các Thread Pool khác nhau cho những phương thức bất đồng bộ khác nhau.

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "executor1")
    public Executor executor1() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("AsyncExecutor1-");
        executor.initialize();
        return executor;
    }

    @Bean(name = "executor2")
    public Executor executor2() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("AsyncExecutor2-");
        executor.initialize();
        return executor;
    }
}
```

Chỉ định tên Bean của Thread Pool trong annotation `@Async`:

```java
@Service
public class AsyncService {

    @Async("executor1")
    public void performTask1() {
        // Logic của tác vụ 1
        System.out.println("Executing Task1 with Executor1");
    }

    @Async("executor2")
    public void performTask2() {
        // Logic của tác vụ 2
        System.out.println("Executing Task2 with Executor2");
    }
}
```

### Tránh để annotation `@Async` bị vô hiệu

Annotation `@Async` sẽ mất tác dụng bất đồng bộ trong các tình huống sau, cần đặc biệt lưu ý:

**1. Gọi phương thức bất đồng bộ trong cùng một class**

Nếu bạn gọi một phương thức có gắn `@Async` ngay từ bên trong chính class đó, phương thức này sẽ không chạy bất đồng bộ.

```java
@Service
public class MyService {

    public void myMethod() {
        // Gọi trực tiếp qua tham chiếu this sẽ đi vòng qua cơ chế proxy của Spring, khiến thực thi bất đồng bộ bị vô hiệu
        asyncMethod();
    }

    @Async
    public void asyncMethod() {
        // Logic thực thi bất đồng bộ
    }
}
```

Nguyên nhân là do cơ chế bất đồng bộ của Spring được hiện thực thông qua **proxy**, trong khi lời gọi phương thức nội bộ trong cùng một class sẽ đi vòng qua cơ chế proxy của Spring—tức đi qua đối tượng proxy và gọi trực tiếp bằng tham chiếu `this`. Vì không đi qua proxy nên mọi xử lý liên quan đến proxy (như đưa tác vụ vào Thread Pool để chạy bất đồng bộ) đều không diễn ra.

Để tránh lỗi này, cách làm được khuyến nghị là tách phương thức bất đồng bộ sang một Spring Bean khác:

```java
@Service
public class AsyncService {
    @Async
    public void asyncMethod() {
        // Logic thực thi bất đồng bộ
    }
}

@Service
public class MyService {
    @Autowired
    private AsyncService asyncService;

    public void myMethod() {
        asyncService.asyncMethod();
    }
}
```

**2. Dùng từ khóa `static` trên phương thức bất đồng bộ**

Nếu phương thức gắn `@Async` được khai báo với từ khóa `static`, phương thức đó sẽ không chạy bất đồng bộ.

Bởi vì cơ chế bất đồng bộ của Spring hoạt động qua proxy; phương thức static không thuộc về instance mà thuộc về class và không tham gia vào cơ chế kế thừa, nên cơ chế proxy của Spring (dù là dựa trên JDK hay CGLIB) đều không thể chặn phương thức static để bổ sung tính năng tăng cường như chạy bất đồng bộ.

Do giới hạn độ dài, bài viết không đi sâu thêm ở đây; các bạn chưa nắm rõ cơ chế proxy có thể tham khảo bài viết [Giải thích chi tiết Proxy Pattern trong Java](https://javaguide.cn/java/basis/proxy.html).

Nếu cần chạy bất đồng bộ logic của một phương thức static, bạn có thể thiết kế một phương thức bọc (wrapper) không phải static, gắn `@Async` lên phương thức bọc đó rồi gọi phương thức static ở bên trong:

```java
@Service
public class AsyncService {

    @Async
    public void asyncWrapper() {
        // Gọi phương thức static
        SClass.staticMethod();
    }
}

public class SClass {
    public static void staticMethod() {
        // Thực hiện một số thao tác
    }
}
```

**3. Quên bật hỗ trợ bất đồng bộ**

Spring Boot mặc định không bật hỗ trợ bất đồng bộ; hãy đảm bảo đã thêm annotation `@EnableAsync` trên class cấu hình chính `Application` để kích hoạt tính năng này:

```java
@SpringBootApplication
@EnableAsync
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

**4. Class chứa phương thức `@Async` phải là một Spring Bean**

Phương thức gắn `@Async` bắt buộc phải nằm trong một Bean do Spring quản lý; chỉ khi đó Spring mới có thể áp dụng proxy lúc tạo Bean, giúp proxy chặn lời gọi phương thức và hiện thực logic chạy bất đồng bộ. Nếu phương thức nằm ngoài Bean do Spring quản lý, Spring không thể tạo proxy cần thiết và `@Async` sẽ hoàn toàn không có tác dụng.

### Kiểu giá trị trả về

Khuyến nghị khai báo kiểu giá trị trả về của phương thức gắn `@Async` là `void` hoặc `Future`.

- Nếu không cần lấy kết quả trả về từ phương thức bất đồng bộ, hãy đặt kiểu trả về là `void`.
- Nếu cần lấy kết quả trả về từ phương thức bất đồng bộ, hãy đặt kiểu trả về là `Future` (thường dùng `CompletableFuture`). `ListenableFuture` thuộc API cũ của Spring và không nên tiếp tục sử dụng trong Spring 6.1 trở lên.

Nếu khai báo kiểu trả về của phương thức gắn `@Async` là các kiểu khác (như `Object`, `String`, v.v.), bạn sẽ không lấy được giá trị trả về của phương thức.

Thiết kế này phù hợp với nguyên tắc cơ bản của lập trình bất đồng bộ: bên gọi không nên kỳ vọng có kết quả ngay lập tức, mà cần có khả năng nhận kết quả ở một thời điểm nào đó trong tương lai. Nếu kiểu trả về là `Future`, bên gọi có thể dùng đối tượng `Future` nhận được để kiểm tra trạng thái tác vụ, hủy tác vụ hoặc lấy kết quả khi tác vụ hoàn tất.

### Xử lý ngoại lệ trong phương thức bất đồng bộ

Ngoại lệ ném ra bên trong phương thức bất đồng bộ sẽ không bị Thread gọi trực tiếp bắt được. Phương thức bất đồng bộ trả về `Future` hoặc `CompletableFuture` sẽ truyền ngoại lệ thông qua đối tượng Future, có thể xử lý bằng `get()`, `join()` hoặc các phương thức xử lý ngoại lệ của `CompletableFuture`; còn phương thức bất đồng bộ trả về `void` không thể truyền ngoại lệ về cho bên gọi, do đó có thể cấu hình `AsyncUncaughtExceptionHandler` toàn cục.

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer{

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new CustomAsyncExceptionHandler();
    }

}

// Exception handler tùy chỉnh
class CustomAsyncExceptionHandler implements AsyncUncaughtExceptionHandler {

    @Override
    public void handleUncaughtException(Throwable ex, Method method, Object... params) {
        // Ghi log hoặc logic xử lý khác
    }
}
```

### Chưa chú ý đến quản lý Transaction

Khi phương thức gắn `@Async` cần hỗ trợ Transaction, nhất định phải khai báo `@Transactional` độc lập ngay trên chính phương thức bất đồng bộ đó:

```java
@Service
public class AsyncTransactionalService {

    @Async
    // Propagation.REQUIRES_NEW cho biết Spring khi thực thi phương thức bất đồng bộ sẽ mở một Transaction mới, độc lập với Transaction hiện tại
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void asyncTransactionalMethod() {
        // Các thao tác ở đây sẽ chạy trong một Transaction mới
        // Thực hiện một số thao tác cơ sở dữ liệu
    }
}
```

### Chưa kiểm soát thứ tự thực thi các phương thức bất đồng bộ

Các phương thức gắn `@Async` thực thi không chặn (non-blocking), nên chúng có thể hoàn tất theo thứ tự bất kỳ. Nếu cần xử lý kết quả theo một thứ tự xác định, bạn có thể đặt kiểu trả về của phương thức là `Future` hoặc `CompletableFuture`, rồi dựa vào đối tượng trả về để đảm bảo một phương thức chỉ chạy sau khi phương thức kia hoàn thành:

```java
@Async
public CompletableFuture<String> fetchDataAsync() {
    return CompletableFuture.completedFuture("Data");
}

@Async
public CompletableFuture<String> processDataAsync(String data) {
    // Bản thân phương thức đã được @Async điều phối sang executor do Spring quản lý, không nên submit tiếp vào commonPool.
    return CompletableFuture.completedFuture("Processed " + data);
}
```

Phương thức `processDataAsync` thực thi sau `fetchDataAsync`:

```java
CompletableFuture<String> dataFuture = asyncService.fetchDataAsync();
dataFuture.thenCompose(data -> asyncService.processDataAsync(data))
          .thenAccept(result -> System.out.println(result));
```
