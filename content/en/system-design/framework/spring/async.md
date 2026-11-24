---
title: "@Async Annotation Principles Analysis"
description: "In-depth guide to Spring's @Async annotation principles, covering asynchronous task configuration, thread pool setup, the @EnableAsync mechanism, and common usage pitfalls."
category: Framework
tag:
  - Spring
lang: en
sourceRef: zh-ref/system-design/framework/spring/async.md
head:
  - - meta
    - name: keywords
      content: Spring Async,@Async,EnableAsync,Thread Pool,TaskExecutor,Asynchronous Tasks,Spring Annotations,Async Methods
---

The `@Async` annotation is provided by the Spring Framework. A class or method annotated with `@Async` executes in an **asynchronous thread**. This means that when the method is called, the caller does not wait for the method to finish executing and can immediately proceed with subsequent code.

Using `@Async` is very straightforward and requires only two steps:

1. Add `@EnableAsync` to the main startup class to enable asynchronous task execution.
2. Add `@Async` to the method or class that needs to run asynchronously.

```java
@SpringBootApplication
// Enable asynchronous tasks
@EnableAsync
public class YourApplication {

    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}

// Asynchronous service class
@Service
public class MyService {

    // Using a custom thread pool is recommended; this only demonstrates basic usage
    @Async
    public CompletableFuture<String> doSomethingAsync() {

        // Time-consuming business operations go here
        // ...
        // Using CompletableFuture makes it easier to handle async results without blocking the main thread
        return CompletableFuture.completedFuture("Async Task Completed");
    }

}
```

Next, let's examine how `@Async` works under the hood.

## How `@Async` Works Under the Hood

Under the hood, `@Async` achieves asynchronous task execution through **dynamic proxies**. Spring uses a `BeanPostProcessor` to create a dynamic proxy for classes annotated with `@Async`. Subsequent calls to `@Async`-annotated methods are intercepted by the dynamic proxy, and the interceptor wraps the method execution as an asynchronous task and submits it to a thread pool for processing.

Let's walk through the implementation step by step.

### Enabling Asynchronous Execution

Before using `@Async`, you need to add `@EnableAsync` on your startup/configuration class to enable async support. The `@EnableAsync` annotation is defined as follows:

```JAVA
// Other annotations omitted ...
@Import(AsyncConfigurationSelector.class)
public @interface EnableAsync { /* ... */ }
```

`@EnableAsync` imports `AsyncConfigurationSelector` via `@Import`, so Spring loads the configuration class selected by `@Import`.

Because `AsyncConfigurationSelector` implements `ImportSelector` (via `AdviceModeImportSelector`), it overrides `selectImports()` to customize which beans are loaded, as shown below:

```JAVA
public class AsyncConfigurationSelector extends AdviceModeImportSelector<EnableAsync> {
	@Override
	@Nullable
	public String[] selectImports(AdviceMode adviceMode) {
		switch (adviceMode) {
	   // Advice woven via Spring AOP proxy, which may use JDK dynamic proxy or CGLIB
			case PROXY:
				return new String[] {ProxyAsyncConfiguration.class.getName()};
   // Advice woven via AspectJ
			case ASPECTJ:
				return new String[] {ASYNC_EXECUTION_ASPECT_CONFIGURATION_CLASS_NAME};
			default:
				return null;
		}
	}
}
```

Inside `selectImports()`, different classes are loaded depending on the advice mode, where `adviceMode` defaults to `PROXY`.

Taking Spring AOP proxy-based advice as an example, `ProxyAsyncConfiguration` is loaded:

```JAVA
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class ProxyAsyncConfiguration extends AbstractAsyncConfiguration {
	@Bean(name = TaskManagementConfigUtils.ASYNC_ANNOTATION_PROCESSOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public AsyncAnnotationBeanPostProcessor asyncAdvisor() {
		 // ...
  // Load the BeanPostProcessor
		AsyncAnnotationBeanPostProcessor bpp = new AsyncAnnotationBeanPostProcessor();

  // ...
		return bpp;
	}
}
```

### BeanPostProcessor

Inside `ProxyAsyncConfiguration`, a `@Bean` method registers the post-processor `AsyncAnnotationBeanPostProcessor`, which is the key component that makes `@Async` work.

If a class or method is annotated with `@Async`, `AsyncAnnotationBeanPostProcessor` creates a dynamic proxy for that class.

When methods on that class are invoked, they pass through the proxy object's interceptor, and methods marked with `@Async` are executed asynchronously.

The code for `AsyncAnnotationBeanPostProcessor` is as follows:

```JAVA
public class AsyncAnnotationBeanPostProcessor extends AbstractBeanFactoryAwareAdvisingPostProcessor {
	@Override
	public void setBeanFactory(BeanFactory beanFactory) {
		super.setBeanFactory(beanFactory);
  // Create AsyncAnnotationAdvisor, which is an Advisor
  // used to intercept @Async-annotated methods and execute them asynchronously.
		AsyncAnnotationAdvisor advisor = new AsyncAnnotationAdvisor(this.executor, this.exceptionHandler);
  // If a custom asyncAnnotationType is configured, pass it into the advisor.
  // asyncAnnotationType allows specifying a custom async annotation, such as @MyAsync.
		if (this.asyncAnnotationType != null) {
			advisor.setAsyncAnnotationType(this.asyncAnnotationType);
		}
		advisor.setBeanFactory(beanFactory);
		this.advisor = advisor;
	}
}
```

The parent class of `AsyncAnnotationBeanPostProcessor` implements `BeanFactoryAware`, so `setBeanFactory()` is overridden as an extension hook to initialize `AsyncAnnotationAdvisor`.

#### Creating the Advisor

An `Advisor` is Spring AOP's abstraction combining an `Advice` and a `Pointcut`: the `Advice` defines the cross-cutting logic to execute, and the `Pointcut` specifies the join points where that advice applies.

When `AsyncAnnotationBeanPostProcessor` creates `AsyncAnnotationAdvisor`, its constructor builds the corresponding `Advice` and `Pointcut`, as shown below:

```JAVA
public class AsyncAnnotationAdvisor extends AbstractPointcutAdvisor implements BeanFactoryAware {

    private Advice advice; // Advice responsible for asynchronous execution
    private Pointcut pointcut; // Pointcut matching @Async-annotated methods

    // Constructor
    public AsyncAnnotationAdvisor(/* parameters omitted */) {
        // 1. Create the Advice responsible for async execution logic
        this.advice = buildAdvice(executor, exceptionHandler);
        // 2. Create the Pointcut to select target methods to enhance
        this.pointcut = buildPointcut(asyncAnnotationTypes);
    }

    // Build Advice
    protected Advice buildAdvice(/* parameters omitted */) {
        // Create the interceptor that handles async execution
        AnnotationAsyncExecutionInterceptor interceptor = new AnnotationAsyncExecutionInterceptor(null);
        // Configure the interceptor with the executor and exception handler
        interceptor.configure(executor, exceptionHandler);
        return interceptor;
    }

    // Build Pointcut
    protected Pointcut buildPointcut(Set<Class<? extends Annotation>> asyncAnnotationTypes) {
        ComposablePointcut result = null;
        for (Class<? extends Annotation> asyncAnnotationType : asyncAnnotationTypes) {
            // 1. Class-level pointcut: matches if the annotation is present on the class
            Pointcut cpc = new AnnotationMatchingPointcut(asyncAnnotationType, true);
            // 2. Method-level pointcut: matches if the annotation is present on the method
            Pointcut mpc = new AnnotationMatchingPointcut(null, asyncAnnotationType, true);

            if (result == null) {
                result = new ComposablePointcut(cpc);
            } else {
                // Combine with the previous pointcut using union
                result.union(cpc);
            }
            // Add the method-level pointcut to the composable pointcut
            result = result.union(mpc);
        }
        // Return the combined pointcut, or Pointcut.TRUE if no annotation types were provided
        return (result != null ? result : Pointcut.TRUE);
    }
}
```

The core of `AsyncAnnotationAdvisor` lies in building the `Advice` and `Pointcut`:

- Building the `Advice`: Creates an `AnnotationAsyncExecutionInterceptor`, whose `invoke()` method executes the advice logic.
- Building the `Pointcut`: Composed of a `ClassFilter` and a `MethodMatcher`, used to match which methods should have the `Advice` logic applied.

#### Post-Processing Logic

The `postProcessAfterInitialization()` method implemented for `AsyncAnnotationBeanPostProcessor` resides in its parent class `AbstractAdvisingBeanPostProcessor`. After a bean is initialized, Spring invokes `postProcessAfterInitialization()` to run post-processing.

In this post-processing method, Spring checks whether the bean matches the `Advisor` condition; if it does, a proxy object is created:

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
 // Check if the given Bean is eligible for the Advisor; if so, create a proxy object.
	if (isEligible(bean, beanName)) {
		ProxyFactory proxyFactory = prepareProxyFactory(bean, beanName);
		if (!proxyFactory.isProxyTargetClass()) {
			evaluateProxyInterfaces(bean.getClass(), proxyFactory);
		}
  // Add the Advisor.
		proxyFactory.addAdvisor(this.advisor);
		customizeProxyFactory(proxyFactory);
  // Return the proxy object.
		return proxyFactory.getProxy(getProxyClassLoader());
	}
	return bean;
}
```

### Intercepting `@Async` Methods

Invocations of `@Async`-annotated methods are intercepted by `AnnotationAsyncExecutionInterceptor`, and the interception logic executes inside `invoke()`. At this point, the `@Async`-annotated method is wrapped as an asynchronous task and handed off to an executor.

The `invoke()` method is defined in `AsyncExecutionInterceptor`, the superclass of `AnnotationAsyncExecutionInterceptor`:

```JAVA
public class AsyncExecutionInterceptor extends AsyncExecutionAspectSupport implements MethodInterceptor, Ordered {
	@Override
	@Nullable
	public Object invoke(final MethodInvocation invocation) throws Throwable {
		Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);
		Method specificMethod = ClassUtils.getMostSpecificMethod(invocation.getMethod(), targetClass);
		final Method userDeclaredMethod = BridgeMethodResolver.findBridgedMethod(specificMethod);

  // 1. Determine the async task executor
		AsyncTaskExecutor executor = determineAsyncExecutor(userDeclaredMethod);

  // 2. Wrap the target method invocation as a Callable async task
		Callable<Object> task = () -> {
			try {
    // 2.1 Execute the target method
				Object result = invocation.proceed();
    // 2.2 If the return value is a Future, block to unwrap its result
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
		// 3. Submit the task
		return doSubmit(task, executor, invocation.getMethod().getReturnType());
	}
}
```

Inside `invoke()`, there are three main steps:

1. Determine the executor for the asynchronous task.
2. Wrap the `@Async`-annotated method as a `Callable` asynchronous task.
3. Submit the task to the executor for execution.

#### 1. Resolving the Asynchronous Task Executor

The `determineAsyncExecutor()` method obtains the executor (i.e., the **thread pool**) that runs the asynchronous task:

```JAVA
// Determine the executor for the async task
protected AsyncTaskExecutor determineAsyncExecutor(Method method) {
 // 1. Try retrieving from the cache first.
	AsyncTaskExecutor executor = this.executors.get(method);
	if (executor == null) {
		Executor targetExecutor;
  // 2. Get the executor qualifier.
		String qualifier = getExecutorQualifier(method);
		if (StringUtils.hasLength(qualifier)) {
   // 3. Look up the matching executor by qualifier.
			targetExecutor = findQualifiedExecutor(this.beanFactory, qualifier);
		}
		else {
   // 4. If no qualifier is specified, fall back to the default executor: SimpleAsyncTaskExecutor.
			targetExecutor = this.defaultExecutor.get();
		}
		if (targetExecutor == null) {
			return null;
		}
  // 5. Wrap the executor in a TaskExecutorAdapter.
  // TaskExecutorAdapter is a Spring abstraction over JDK executors implementing Executor;
  // simply think of it as a thread pool adapter.
		executor = (targetExecutor instanceof AsyncListenableTaskExecutor ?
				(AsyncListenableTaskExecutor) targetExecutor : new TaskExecutorAdapter(targetExecutor));
		this.executors.put(method, executor);
	}
	return executor;
}
```

`determineAsyncExecutor()` resolves the async task's executor (thread pool) mainly by reading the `value` attribute of `@Async` as a qualifier and looking up the corresponding executor bean in `BeanFactory`.

If no thread pool is specified in `@Async`, Spring obtains the default executor via `this.defaultExecutor.get()`, where `defaultExecutor` is populated by the following method:

```JAVA
// AsyncExecutionInterceptor
protected Executor getDefaultExecutor(@Nullable BeanFactory beanFactory) {
 // 1. Attempt to obtain a thread pool from beanFactory.
	Executor defaultExecutor = super.getDefaultExecutor(beanFactory);
 // 2. If none is found in beanFactory, create SimpleAsyncTaskExecutor.
	return (defaultExecutor != null ? defaultExecutor : new SimpleAsyncTaskExecutor());
}
```

Here, `super.getDefaultExecutor()` attempts to look up an `Executor` bean in `beanFactory`, as shown below:

```JAVA
protected Executor getDefaultExecutor(@Nullable BeanFactory beanFactory) {
	if (beanFactory != null) {
		try {
   // 1. Search beanFactory for a TaskExecutor bean.
			return beanFactory.getBean(TaskExecutor.class);
		}
		catch (NoUniqueBeanDefinitionException ex) {
			try {
				// 2. If multiple exist, try looking up the Executor bean by default name.
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
    // 3. If none exist, try looking up the Executor bean by default name.
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

In `getDefaultExecutor()`, if retrieving a thread pool from `beanFactory` fails, Spring creates a `SimpleAsyncTaskExecutor`.

This executor creates a brand-new thread every time it executes an asynchronous task and does not reuse threads, resulting in high overhead for async execution. If traffic on an `@Async`-annotated method spikes suddenly, the application will spawn a huge number of threads, degrading service quality or even causing service unavailability.

If 10,000 tasks are submitted to `SimpleAsyncTaskExecutor` simultaneously, it will create 10,000 threads, as shown in its `doExecute()` method:

```JAVA
// SimpleAsyncTaskExecutor: execute() internally delegates to doExecute()
protected void doExecute(Runnable task) {
    // Create a new thread
    Thread thread = (this.threadFactory != null ? this.threadFactory.newThread(task) : createThread(task));
    thread.start();
}
```

**Recommendation: Always configure a custom thread pool when using `@Async` to avoid the risks of Spring's default executor.**

The `value` attribute of `@Async` specifies the qualifier of the thread pool, which allows resolving a **custom thread pool**. The code for retrieving the qualifier is as follows:

```JAVA
// AnnotationAsyncExecutionInterceptor
protected String getExecutorQualifier(Method method) {
	// 1. Look for the @Async annotation on the method.
	Async async = AnnotatedElementUtils.findMergedAnnotation(method, Async.class);
 // 2. If not found on the method, look for @Async on the declaring class.
	if (async == null) {
		async = AnnotatedElementUtils.findMergedAnnotation(method.getDeclaringClass(), Async.class);
	}
 // 3. If @Async is found, return its value attribute as the executor qualifier.
 //    If "value" is an empty string, the default executor is used.
 //    If @Async is not found, return null, which also falls back to the default executor.
	return (async != null ? async.value() : null);
}
```

#### 2. Wrapping the Method as an Asynchronous Task

After resolving the executor in `invoke()`, Spring wraps the method invocation as an asynchronous task:

```JAVA
// Wrap the target method invocation as a Callable async task
Callable<Object> task = () -> {
    try {
        // 2.1 Execute the intercepted method (proceed() is the core AOP method that runs the target)
        Object result = invocation.proceed();

        // 2.2 The proxy returns the real async Future to the caller, while the target method—constrained
        //     by its method signature—returns a temporary Future, so the worker thread must unwrap it here.
        if (result instanceof Future) {
            return ((Future<?>) result).get(); // Block waiting for the Future result
        }
    }
    catch (ExecutionException ex) {
        // 2.3 Handle ExecutionException thrown by Future.get()
        handleError(ex.getCause(), userDeclaredMethod, invocation.getArguments()); // Handle the underlying cause
    }
    catch (Throwable ex) {
        // 2.4 Handle other exceptions by passing the exception, method, and arguments to handleError()
        handleError(ex, userDeclaredMethod, invocation.getArguments());
    }
    // 2.5 Return null if the method's return value is not a Future or if an exception occurred
    return null;
};
```

Compared to `Runnable`, `Callable` can return a result and throw checked exceptions.

The execution of `invocation.proceed()` (the original method) is wrapped inside a `Callable` asynchronous task. Notice that it only returns a value when `result` (the method's return value) is an instance of `Future`; for any other type, it returns `null`.

Therefore, if an `@Async`-annotated method declares any return type other than `Future` (or its subtypes), the caller cannot obtain its return value.

#### 3. Submitting the Asynchronous Task

After wrapping the target method into a `Callable` task inside `AsyncExecutionInterceptor#invoke()`, the task is submitted to the executor. Below is an excerpt of `doSubmit()` from Spring Framework 5.3.x, which still includes the `ListenableFuture`-related API that was later deprecated and removed:

```JAVA
protected Object doSubmit(Callable<Object> task, AsyncTaskExecutor executor, Class<?> returnType) {
    // Choose how to execute and return the result based on the method's return type.
    // 1. If the return type is CompletableFuture
    if (CompletableFuture.class.isAssignableFrom(returnType)) {
        // Execute asynchronously using CompletableFuture.supplyAsync().
        return CompletableFuture.supplyAsync(() -> {
            try {
                return task.call();
            }
            catch (Throwable ex) {
                throw new CompletionException(ex); // Wrap exception in CompletionException so future.get() throws it
            }
        }, executor);
    }
    // 2. If the return type is ListenableFuture
    else if (ListenableFuture.class.isAssignableFrom(returnType)) {
        // Cast AsyncTaskExecutor to AsyncListenableTaskExecutor
        // and submit the task via submitListenable().
        // AsyncListenableTaskExecutor is a dedicated executor for ListenableFuture,
        // returning a ListenableFuture that supports completion callbacks.
        return ((AsyncListenableTaskExecutor) executor).submitListenable(task);
    }
    // 3. If the return type is Future
    else if (Future.class.isAssignableFrom(returnType)) {
        // Submit directly via AsyncTaskExecutor.submit() and return a Future object.
        return executor.submit(task);
    }
    // 4. If the return type is void or any other type
    else {
        // Submit directly via AsyncTaskExecutor.submit().
        // Since the return type is void (or non-Future), return null without awaiting any result.
        executor.submit(task);
        return null;
    }
}
```

Inside `doSubmit()`, Spring chooses the appropriate submission strategy based on the return type of the `@Async`-annotated method, and the task is ultimately executed by the executor (thread pool).

### Summary

![Summary of @Async Principles](/media/jg/local/system-design/framework/spring/images/async/async-fdac6b.png)

The key to understanding `@Async` is understanding `@EnableAsync`, which enables asynchronous task execution.

As illustrated above, the overall flow uses a `BeanPostProcessor` to create a proxy object. When an `@Async` method on the proxy object is invoked, execution passes into the interceptor inside the `Advice`, which wraps the method as an asynchronous task and submits it to a thread pool for processing.

## Best Practices for Using `@Async`

### Custom Thread Pools

If no thread pool is explicitly configured, `@Async` first tries to look up a thread pool from `BeanFactory`; if none exists, it creates a `SimpleAsyncTaskExecutor`. `SimpleAsyncTaskExecutor` is not really a true thread pool because it spins up a new thread for every request instead of reusing existing threads, introducing potential hazards such as excessive resource consumption.

For more details on how the thread pool is resolved, refer to this article: [An Analysis of the Underlying Asynchronous Thread Pool Principle of Spring's `@Async` Annotation | Dewu Tech](https://mp.weixin.qq.com/s/FySv5L0bCdrlb5MoSfQtAA).

Be sure to configure a thread pool explicitly—`ThreadPoolTaskExecutor` is recommended. Moreover, you can assign different thread pools to different async methods depending on task characteristics and workload requirements.

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

Specify the bean name of the thread pool in the `@Async` annotation:

```java
@Service
public class AsyncService {

    @Async("executor1")
    public void performTask1() {
        // Logic for task 1
        System.out.println("Executing Task1 with Executor1");
    }

    @Async("executor2")
    public void performTask2() {
        // Logic for task 2
        System.out.println("Executing Task2 with Executor2");
    }
}
```

### Avoiding `@Async` Failures

Keep in mind that the `@Async` annotation silently fails to execute asynchronously in the following scenarios:

**1. Calling an async method within the same class**

If you call an `@Async`-annotated method from inside the same class, the method will not run asynchronously.

```java
@Service
public class MyService {

    public void myMethod() {
        // Invoking directly via the `this` reference bypasses Spring's proxy mechanism, disabling async execution
        asyncMethod();
    }

    @Async
    public void asyncMethod() {
        // Asynchronous execution logic
    }
}
```

This happens because Spring's async mechanism is implemented via **proxies**. Calling a method within the same class invokes it directly through `this`, bypassing Spring's proxy object. Since the call never passes through the proxy, none of the proxy-driven logic (submitting the task to a thread pool) takes place.

To avoid this issue, the recommended approach is to move the asynchronous method into another Spring Bean:

```java
@Service
public class AsyncService {
    @Async
    public void asyncMethod() {
        // Asynchronous execution logic
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

**2. Annotating a `static` method with `@Async`**

If an `@Async`-annotated method is declared with the `static` keyword, it will not run asynchronously.

Because Spring's async mechanism relies on proxies—and static methods belong to the class rather than an instance and cannot be overridden via inheritance—Spring's proxy mechanisms (whether JDK dynamic proxy or CGLIB) cannot intercept static methods to apply enhancements such as asynchronous execution.

Due to space limitations, we won't go deeper into proxies here; if you are unfamiliar with proxy patterns, you can read [Java Proxy Pattern Explained](https://javaguide.cn/java/basis/proxy.html).

If you need to execute static-method logic asynchronously, consider creating a non-static wrapper method annotated with `@Async` that calls the static method internally:

```java
@Service
public class AsyncService {

    @Async
    public void asyncWrapper() {
        // Invoke the static method
        SClass.staticMethod();
    }
}

public class SClass {
    public static void staticMethod() {
        // Perform some operations
    }
}
```

**3. Forgetting to enable async support**

Spring Boot does not enable asynchronous execution by default. Make sure `@EnableAsync` is added to your main configuration class `Application` to turn on async support:

```java
@SpringBootApplication
@EnableAsync
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

**4. The class containing the `@Async` method must be a Spring Bean**

The `@Async`-annotated method must reside in a Spring-managed bean so that Spring can create the proxy when instantiating the bean, allowing the proxy to intercept calls and execute them asynchronously. If the class is not a Spring-managed bean, Spring cannot create the necessary proxy, and `@Async` will have no effect.

### Return Types

It is recommended to define the return type of `@Async`-annotated methods as `void` or `Future`.

- If you do not need to retrieve a result from the async method, define the return type as `void`.
- If you do need to retrieve a result from the async method, define the return type as `Future` (typically `CompletableFuture`). `ListenableFuture` is a legacy Spring API and should no longer be used in Spring 6.1 and later.

If an `@Async` method is declared with any other return type (such as `Object`, `String`, etc.), the caller will not be able to obtain the method's return value.

This design follows the core principle of asynchronous programming: the caller should not expect a result immediately, but should be able to retrieve it at a later point in time. With a `Future` return type, the caller can inspect task status, cancel the task, or retrieve the result once execution completes.

### Handling Exceptions in Asynchronous Methods

Exceptions thrown inside an asynchronous method cannot be caught directly by the calling thread. Async methods returning `Future` or `CompletableFuture` expose exceptions through the future object, which can be handled via `get()`, `join()`, or `CompletableFuture` exception-handling methods. Async methods returning `void`, however, cannot propagate exceptions back to the caller; instead, you can configure a global `AsyncUncaughtExceptionHandler`.

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer{

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new CustomAsyncExceptionHandler();
    }

}

// Custom exception handler
class CustomAsyncExceptionHandler implements AsyncUncaughtExceptionHandler {

    @Override
    public void handleUncaughtException(Throwable ex, Method method, Object... params) {
        // Logging or other exception-handling logic
    }
}
```

### Failing to Account for Transaction Management

When an `@Async`-annotated method requires transaction support, make sure to declare `@Transactional` directly on that async method itself:

```java
@Service
public class AsyncTransactionalService {

    @Async
    // Propagation.REQUIRES_NEW tells Spring to start a new transaction independent of any caller transaction when executing the async method
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void asyncTransactionalMethod() {
        // Operations here execute inside a new transaction
        // Perform database operations
    }
}
```

### Failing to Coordinate Execution Order of Async Methods

Execution of `@Async`-annotated methods is non-blocking, meaning multiple calls may finish in arbitrary order. If results must be processed in a specific sequence, define the return type as `Future` or `CompletableFuture` and chain via the returned future so that one method executes after another completes:

```java
@Async
public CompletableFuture<String> fetchDataAsync() {
    return CompletableFuture.completedFuture("Data");
}

@Async
public CompletableFuture<String> processDataAsync(String data) {
    // The method itself is already dispatched by @Async to a Spring-managed executor; avoid submitting again to commonPool.
    return CompletableFuture.completedFuture("Processed " + data);
}
```

Executing `processDataAsync` after `fetchDataAsync`:

```java
CompletableFuture<String> dataFuture = asyncService.fetchDataAsync();
dataFuture.thenCompose(data -> asyncService.processDataAsync(data))
          .thenAccept(result -> System.out.println(result));
```
