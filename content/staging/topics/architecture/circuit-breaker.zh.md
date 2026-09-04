---
title: 断路器模式
description: 学习断路器模式保护分布式系统
track: architecture
section: distributed
difficulty: intermediate
tags:
  - 断路器
  - 容错
  - Resilience4j
  - 高可用
status: imported
origin: old/src/content/docs/architecture/circuit-breaker.zh.md
divergence: 0.313
issues: []
legacy:
  category: Architecture
  subcategory: Resilience
  order: 16
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是断路器模式

断路器模式（Circuit Breaker Pattern）是一种用于处理分布式系统中远程服务调用失败的设计模式。它的核心思想借鉴自电气工程中的断路器：当电路中出现过载或短路时，断路器会自动切断电路，防止火灾或设备损坏。

在软件系统中，断路器模式用于监控对远程服务的调用。当失败次数超过阈值时，断路器会"跳闸"，后续的调用将立即失败，而不是等待超时。这可以防止故障在分布式系统中蔓延，给下游服务恢复的时间，同时保护调用方资源不被耗尽。

```
┌─────────────────────────────────────────────────────────────┐
│                      断路器工作原理                           │
│                                                             │
│   服务A          断路器           服务B                       │
│    │               │               │                        │
│    │── 请求1 ──→   │── 转发 ──→   │ ✓ 成功                  │
│    │               │               │                        │
│    │── 请求2 ──→   │── 转发 ──→   │ ✗ 失败                  │
│    │               │               │                        │
│    │── 请求3 ──→   │── 转发 ──→   │ ✗ 失败                  │
│    │               │               │                        │
│    │               │ [失败阈值达到，断路器打开]               │
│    │               │               │                        │
│    │── 请求4 ──→   │── 快速失败 ──│                         │
│    │               │  (不再调用)   │                        │
│    │               │               │                        │
│    │               │ [等待超时后，进入半开状态]               │
│    │               │               │                        │
│    │── 请求5 ──→   │── 探测 ──→   │ ✓ 成功 → 关闭断路器     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 为什么需要断路器模式

在微服务架构中，服务之间存在复杂的调用关系。当某个下游服务出现故障时，如果没有适当的保护机制，可能会导致：

1. **级联故障（Cascade Failure）**：一个服务的故障导致调用方也出现故障，故障像多米诺骨牌一样在系统中蔓延
2. **资源耗尽**：调用方的线程池被阻塞的请求占满，无法处理其他请求
3. **系统雪崩**：大量请求堆积，最终导致整个系统崩溃
4. **恢复困难**：即使故障服务恢复，大量积压的请求可能再次将其压垮

```
┌─────────────────────────────────────────────────────────────┐
│                    级联故障示意图                            │
│                                                             │
│  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐               │
│  │网关  │ ──→│服务A │ ──→│服务B │ ──→│服务C │ ← 故障点      │
│  └─────┘     └─────┘     └─────┘     └─────┘               │
│     ↓           ↓           ↓                               │
│   超时等待    超时等待    超时等待                             │
│     ↓           ↓           ↓                               │
│   线程耗尽    线程耗尽    线程耗尽                             │
│     ↓           ↓           ↓                               │
│   系统崩溃    系统崩溃    系统崩溃 ← 故障蔓延                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 断路器的三种状态

断路器有三种核心状态：关闭（Closed）、打开（Open）和半开（Half-Open）。

### 状态转换图

```
         ┌──────────────────────────────────────────────┐
         │                                              │
         ▼                                              │
    ┌─────────┐      失败率超过阈值      ┌─────────┐     │
    │         │ ─────────────────────→ │         │     │
    │  关闭   │                         │  打开   │     │
    │ CLOSED  │ ←───────────────────── │  OPEN   │     │
    │         │      探测成功，恢复      │         │     │
    └─────────┘                         └─────────┘     │
         ▲                                   │          │
         │                              等待超时         │
         │                                   │          │
         │                                   ▼          │
         │                             ┌─────────┐      │
         │          探测成功            │         │      │
         └──────────────────────────── │  半开   │      │
                                       │HALF-OPEN│      │
                   探测失败             │         │ ─────┘
                                       └─────────┘
```

### 关闭状态（Closed）

这是断路器的正常状态。在此状态下：

- 所有请求都会正常转发到下游服务
- 断路器会记录调用的成功和失败次数
- 当失败率超过设定阈值时，断路器切换到打开状态

```java
// 关闭状态的核心逻辑
public class ClosedState implements CircuitBreakerState {
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final int failureThreshold;
    private final int minimumNumberOfCalls;

    public ClosedState(int failureThreshold, int minimumNumberOfCalls) {
        this.failureThreshold = failureThreshold;
        this.minimumNumberOfCalls = minimumNumberOfCalls;
    }

    @Override
    public boolean allowRequest() {
        return true; // 关闭状态允许所有请求通过
    }

    @Override
    public void recordSuccess() {
        successCount.incrementAndGet();
    }

    @Override
    public void recordFailure() {
        failureCount.incrementAndGet();
    }

    @Override
    public boolean shouldTransitionToOpen() {
        int totalCalls = successCount.get() + failureCount.get();
        if (totalCalls < minimumNumberOfCalls) {
            return false; // 调用次数不足，不进行状态判断
        }
        double failureRate = (double) failureCount.get() / totalCalls * 100;
        return failureRate >= failureThreshold;
    }
}
```

### 打开状态（Open）

当失败率超过阈值时，断路器进入打开状态：

- 所有请求立即失败，不会调用下游服务
- 这样可以快速失败，避免资源浪费
- 经过一段时间（等待时间窗口）后，自动切换到半开状态

```java
// 打开状态的核心逻辑
public class OpenState implements CircuitBreakerState {
    private final long openedAt;
    private final long waitDurationInMillis;

    public OpenState(long waitDurationInMillis) {
        this.openedAt = System.currentTimeMillis();
        this.waitDurationInMillis = waitDurationInMillis;
    }

    @Override
    public boolean allowRequest() {
        return false; // 打开状态拒绝所有请求
    }

    @Override
    public void recordSuccess() {
        // 打开状态不会有成功调用
    }

    @Override
    public void recordFailure() {
        // 打开状态不会真正调用服务
    }

    @Override
    public boolean shouldTransitionToHalfOpen() {
        long now = System.currentTimeMillis();
        return (now - openedAt) >= waitDurationInMillis;
    }
}
```

### 半开状态（Half-Open）

半开状态是一个试探性的恢复状态：

- 允许有限数量的请求通过（探测请求）
- 如果探测请求成功，断路器切换到关闭状态
- 如果探测请求失败，断路器切换回打开状态

```java
// 半开状态的核心逻辑
public class HalfOpenState implements CircuitBreakerState {
    private final AtomicInteger permittedNumberOfCalls;
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final int successThreshold;

    public HalfOpenState(int permittedNumberOfCalls, int successThreshold) {
        this.permittedNumberOfCalls = new AtomicInteger(permittedNumberOfCalls);
        this.successThreshold = successThreshold;
    }

    @Override
    public boolean allowRequest() {
        // 只允许有限数量的探测请求
        return permittedNumberOfCalls.getAndDecrement() > 0;
    }

    @Override
    public void recordSuccess() {
        successCount.incrementAndGet();
    }

    @Override
    public void recordFailure() {
        failureCount.incrementAndGet();
    }

    @Override
    public boolean shouldTransitionToClosed() {
        return successCount.get() >= successThreshold;
    }

    @Override
    public boolean shouldTransitionToOpen() {
        return failureCount.get() > 0;
    }
}
```

## 失败检测机制

### 滑动窗口

断路器通常使用滑动窗口来统计调用结果，有两种类型：

#### 基于计数的滑动窗口

```java
// 基于计数的滑动窗口实现
public class CountBasedSlidingWindow {
    private final int windowSize;
    private final boolean[] results;  // true=成功, false=失败
    private int index = 0;
    private int totalCalls = 0;
    private int failureCount = 0;

    public CountBasedSlidingWindow(int windowSize) {
        this.windowSize = windowSize;
        this.results = new boolean[windowSize];
    }

    public synchronized void record(boolean success) {
        if (totalCalls >= windowSize) {
            // 窗口已满，需要移除最老的记录
            if (!results[index]) {
                failureCount--;  // 移除的是失败记录
            }
        } else {
            totalCalls++;
        }

        results[index] = success;
        if (!success) {
            failureCount++;
        }

        index = (index + 1) % windowSize;
    }

    public double getFailureRate() {
        if (totalCalls == 0) {
            return 0.0;
        }
        return (double) failureCount / totalCalls * 100;
    }
}
```

#### 基于时间的滑动窗口

```java
// 基于时间的滑动窗口实现
public class TimeBasedSlidingWindow {
    private final long windowDurationMillis;
    private final ConcurrentLinkedQueue<CallResult> results = new ConcurrentLinkedQueue<>();

    public TimeBasedSlidingWindow(long windowDurationSeconds) {
        this.windowDurationMillis = windowDurationSeconds * 1000;
    }

    public void record(boolean success) {
        long now = System.currentTimeMillis();
        results.add(new CallResult(now, success));
        evictOldResults(now);
    }

    private void evictOldResults(long now) {
        long threshold = now - windowDurationMillis;
        while (!results.isEmpty() && results.peek().timestamp < threshold) {
            results.poll();
        }
    }

    public double getFailureRate() {
        evictOldResults(System.currentTimeMillis());

        if (results.isEmpty()) {
            return 0.0;
        }

        long failures = results.stream()
            .filter(r -> !r.success)
            .count();

        return (double) failures / results.size() * 100;
    }

    private static class CallResult {
        final long timestamp;
        final boolean success;

        CallResult(long timestamp, boolean success) {
            this.timestamp = timestamp;
            this.success = success;
        }
    }
}
```

### 失败类型识别

不是所有的异常都应该被视为断路器需要处理的失败：

```java
// 定义哪些异常应该被记录为失败
public class FailurePredicate implements Predicate<Throwable> {
    private final Set<Class<? extends Throwable>> recordableExceptions;
    private final Set<Class<? extends Throwable>> ignoredExceptions;

    public FailurePredicate() {
        this.recordableExceptions = new HashSet<>();
        this.ignoredExceptions = new HashSet<>();

        // 默认记录这些异常为失败
        recordableExceptions.add(IOException.class);
        recordableExceptions.add(TimeoutException.class);
        recordableExceptions.add(ServiceUnavailableException.class);

        // 这些异常不应触发断路器
        ignoredExceptions.add(IllegalArgumentException.class);
        ignoredExceptions.add(ValidationException.class);
    }

    @Override
    public boolean test(Throwable throwable) {
        // 忽略的异常不计入失败
        for (Class<? extends Throwable> ignored : ignoredExceptions) {
            if (ignored.isInstance(throwable)) {
                return false;
            }
        }

        // 检查是否是需要记录的异常
        for (Class<? extends Throwable> recordable : recordableExceptions) {
            if (recordable.isInstance(throwable)) {
                return true;
            }
        }

        return false;
    }
}
```

## 降级策略（Fallback）

当断路器打开或调用失败时，需要提供合理的降级策略：

### 返回默认值

```java
// 返回默认值的降级策略
@Service
public class ProductService {

    private final ProductClient productClient;

    public Product getProduct(String productId) {
        try {
            return productClient.getProduct(productId);
        } catch (CircuitBreakerOpenException e) {
            // 断路器打开时返回默认商品信息
            return getDefaultProduct(productId);
        }
    }

    private Product getDefaultProduct(String productId) {
        return Product.builder()
            .id(productId)
            .name("商品信息暂不可用")
            .price(BigDecimal.ZERO)
            .available(false)
            .build();
    }
}
```

### 返回缓存数据

```java
// 返回缓存数据的降级策略
@Service
public class UserService {

    private final UserClient userClient;
    private final Cache<String, User> userCache;

    public User getUser(String userId) {
        try {
            User user = userClient.getUser(userId);
            // 成功时更新缓存
            userCache.put(userId, user);
            return user;
        } catch (Exception e) {
            // 失败时尝试返回缓存
            User cachedUser = userCache.getIfPresent(userId);
            if (cachedUser != null) {
                log.warn("使用缓存的用户数据: {}", userId);
                return cachedUser;
            }
            throw new UserNotFoundException(userId);
        }
    }
}
```

### 调用备用服务

```java
// 调用备用服务的降级策略
@Service
public class PaymentService {

    private final PrimaryPaymentGateway primaryGateway;
    private final SecondaryPaymentGateway secondaryGateway;
    private final CircuitBreaker primaryCircuitBreaker;

    public PaymentResult processPayment(PaymentRequest request) {
        try {
            return primaryCircuitBreaker.executeSupplier(
                () -> primaryGateway.process(request)
            );
        } catch (CircuitBreakerOpenException e) {
            log.warn("主支付网关不可用，切换到备用网关");
            return secondaryGateway.process(request);
        }
    }
}
```

### 队列稍后处理

```java
// 将请求放入队列稍后处理
@Service
public class OrderService {

    private final OrderProcessor orderProcessor;
    private final Queue<Order> pendingOrders;
    private final CircuitBreaker circuitBreaker;

    public OrderResult submitOrder(Order order) {
        try {
            return circuitBreaker.executeSupplier(
                () -> orderProcessor.process(order)
            );
        } catch (CircuitBreakerOpenException e) {
            // 订单放入待处理队列
            pendingOrders.offer(order);
            log.info("订单已加入待处理队列: {}", order.getId());
            return OrderResult.pending(order.getId(),
                "系统繁忙，订单将在稍后处理");
        }
    }

    // 定时任务处理队列中的订单
    @Scheduled(fixedDelay = 60000)
    public void processPendingOrders() {
        if (circuitBreaker.getState() == State.CLOSED) {
            while (!pendingOrders.isEmpty()) {
                Order order = pendingOrders.poll();
                if (order != null) {
                    try {
                        orderProcessor.process(order);
                    } catch (Exception e) {
                        pendingOrders.offer(order);
                        break;
                    }
                }
            }
        }
    }
}
```

## Resilience4j 实现

Resilience4j 是一个轻量级的容错库，专为 Java 8 和函数式编程设计。

### 基本配置

```xml
<!-- Maven 依赖 -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-circuitbreaker</artifactId>
    <version>2.2.0</version>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.2.0</version>
</dependency>
```

```yaml
# application.yml 配置
resilience4j:
  circuitbreaker:
    instances:
      userService:
        # 失败率阈值（百分比）
        failure-rate-threshold: 50
        # 慢调用比例阈值
        slow-call-rate-threshold: 100
        # 慢调用时间阈值
        slow-call-duration-threshold: 2s
        # 半开状态允许的调用数
        permitted-number-of-calls-in-half-open-state: 3
        # 滑动窗口类型：COUNT_BASED 或 TIME_BASED
        sliding-window-type: COUNT_BASED
        # 滑动窗口大小
        sliding-window-size: 10
        # 最小调用次数
        minimum-number-of-calls: 5
        # 打开状态持续时间
        wait-duration-in-open-state: 30s
        # 是否自动从打开状态转换到半开状态
        automatic-transition-from-open-to-half-open-enabled: true
        # 需要记录为失败的异常
        record-exceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.client.HttpServerErrorException
        # 忽略的异常（不计入失败率）
        ignore-exceptions:
          - com.example.BusinessException
```

### 使用注解方式

```java
@Service
public class UserService {

    private final UserClient userClient;
    private final UserCacheService cacheService;

    @CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
    public User getUser(String userId) {
        return userClient.getUser(userId);
    }

    // 降级方法，参数需要与原方法一致，最后加上异常参数
    private User getUserFallback(String userId, Exception e) {
        log.warn("获取用户信息失败，使用降级策略: userId={}, error={}",
            userId, e.getMessage());

        // 尝试从缓存获取
        User cachedUser = cacheService.getFromCache(userId);
        if (cachedUser != null) {
            return cachedUser;
        }

        // 返回默认用户
        return User.builder()
            .id(userId)
            .name("用户")
            .status(UserStatus.UNKNOWN)
            .build();
    }
}
```

### 编程式使用

```java
@Configuration
public class CircuitBreakerConfig {

    @Bean
    public CircuitBreaker orderServiceCircuitBreaker(
            CircuitBreakerRegistry circuitBreakerRegistry) {

        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .slowCallRateThreshold(50)
            .slowCallDurationThreshold(Duration.ofSeconds(2))
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(5)
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .recordExceptions(IOException.class, TimeoutException.class)
            .ignoreExceptions(BusinessException.class)
            .build();

        return circuitBreakerRegistry.circuitBreaker("orderService", config);
    }
}

@Service
public class OrderService {

    private final CircuitBreaker circuitBreaker;
    private final OrderClient orderClient;

    public Order getOrder(String orderId) {
        // 使用装饰器模式包装调用
        Supplier<Order> decoratedSupplier = CircuitBreaker
            .decorateSupplier(circuitBreaker, () -> orderClient.getOrder(orderId));

        return Try.ofSupplier(decoratedSupplier)
            .recover(CallNotPermittedException.class, e -> getOrderFallback(orderId))
            .recover(Exception.class, e -> getOrderFallback(orderId))
            .get();
    }

    private Order getOrderFallback(String orderId) {
        return Order.builder()
            .id(orderId)
            .status(OrderStatus.UNKNOWN)
            .message("订单服务暂时不可用")
            .build();
    }
}
```

### 与其他模式组合

Resilience4j 支持多种容错模式的组合使用：

```java
@Service
public class ProductService {

    private final ProductClient productClient;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;
    private final Bulkhead bulkhead;
    private final RateLimiter rateLimiter;
    private final TimeLimiter timeLimiter;

    public Product getProduct(String productId) {
        // 组合多个容错模式
        // 执行顺序：RateLimiter -> TimeLimiter -> Bulkhead -> CircuitBreaker -> Retry

        Supplier<Product> supplier = () -> productClient.getProduct(productId);

        // 包装重试
        Supplier<Product> retryingSupplier = Retry.decorateSupplier(retry, supplier);

        // 包装断路器
        Supplier<Product> circuitBreakerSupplier = CircuitBreaker
            .decorateSupplier(circuitBreaker, retryingSupplier);

        // 包装舱壁（并发限制）
        Supplier<Product> bulkheadSupplier = Bulkhead
            .decorateSupplier(bulkhead, circuitBreakerSupplier);

        // 包装限流
        Supplier<Product> rateLimitedSupplier = RateLimiter
            .decorateSupplier(rateLimiter, bulkheadSupplier);

        return Try.ofSupplier(rateLimitedSupplier)
            .recover(this::handleException)
            .get();
    }

    private Product handleException(Throwable throwable) {
        if (throwable instanceof CallNotPermittedException) {
            log.warn("断路器打开，快速失败");
        } else if (throwable instanceof BulkheadFullException) {
            log.warn("并发请求过多，被舱壁拒绝");
        } else if (throwable instanceof RequestNotPermitted) {
            log.warn("请求被限流");
        }

        return Product.unavailable();
    }
}
```

```yaml
# 组合使用的配置
resilience4j:
  circuitbreaker:
    instances:
      productService:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        sliding-window-size: 10

  retry:
    instances:
      productService:
        max-attempts: 3
        wait-duration: 500ms
        retry-exceptions:
          - java.io.IOException

  bulkhead:
    instances:
      productService:
        max-concurrent-calls: 25
        max-wait-duration: 100ms

  ratelimiter:
    instances:
      productService:
        limit-for-period: 100
        limit-refresh-period: 1s
        timeout-duration: 0s
```

## Hystrix 实现（参考）

虽然 Hystrix 已进入维护模式，但了解其设计思想仍有价值：

```java
// Hystrix 命令模式
public class GetUserCommand extends HystrixCommand<User> {

    private final UserClient userClient;
    private final String userId;

    public GetUserCommand(UserClient userClient, String userId) {
        super(Setter
            .withGroupKey(HystrixCommandGroupKey.Factory.asKey("UserService"))
            .andCommandKey(HystrixCommandKey.Factory.asKey("GetUser"))
            .andCommandPropertiesDefaults(
                HystrixCommandProperties.Setter()
                    // 启用断路器
                    .withCircuitBreakerEnabled(true)
                    // 请求量阈值
                    .withCircuitBreakerRequestVolumeThreshold(20)
                    // 失败率阈值
                    .withCircuitBreakerErrorThresholdPercentage(50)
                    // 断路器打开后的休眠时间
                    .withCircuitBreakerSleepWindowInMilliseconds(5000)
                    // 执行超时时间
                    .withExecutionTimeoutInMilliseconds(1000)
            )
            .andThreadPoolPropertiesDefaults(
                HystrixThreadPoolProperties.Setter()
                    .withCoreSize(10)
                    .withMaxQueueSize(100)
            )
        );

        this.userClient = userClient;
        this.userId = userId;
    }

    @Override
    protected User run() throws Exception {
        return userClient.getUser(userId);
    }

    @Override
    protected User getFallback() {
        return User.builder()
            .id(userId)
            .name("默认用户")
            .build();
    }
}

// 使用方式
User user = new GetUserCommand(userClient, "123").execute();
```

## 监控与可观测性

### 断路器指标

```java
@Component
public class CircuitBreakerMetrics {

    private final MeterRegistry meterRegistry;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    @PostConstruct
    public void registerMetrics() {
        circuitBreakerRegistry.getAllCircuitBreakers().forEach(circuitBreaker -> {
            String name = circuitBreaker.getName();

            // 注册状态指标
            Gauge.builder("circuit_breaker_state", circuitBreaker,
                    cb -> cb.getState().getOrder())
                .tag("name", name)
                .description("断路器状态: 0=CLOSED, 1=HALF_OPEN, 2=OPEN, 3=DISABLED, 4=FORCED_OPEN")
                .register(meterRegistry);

            // 注册失败率指标
            Gauge.builder("circuit_breaker_failure_rate", circuitBreaker,
                    cb -> cb.getMetrics().getFailureRate())
                .tag("name", name)
                .description("断路器失败率")
                .register(meterRegistry);

            // 注册调用次数指标
            Gauge.builder("circuit_breaker_calls", circuitBreaker,
                    cb -> cb.getMetrics().getNumberOfSuccessfulCalls())
                .tag("name", name)
                .tag("outcome", "successful")
                .register(meterRegistry);

            Gauge.builder("circuit_breaker_calls", circuitBreaker,
                    cb -> cb.getMetrics().getNumberOfFailedCalls())
                .tag("name", name)
                .tag("outcome", "failed")
                .register(meterRegistry);
        });
    }
}
```

### 事件监听

```java
@Component
public class CircuitBreakerEventListener {

    private final Logger log = LoggerFactory.getLogger(getClass());

    @Autowired
    public void registerEventConsumers(CircuitBreakerRegistry registry) {
        registry.getAllCircuitBreakers().forEach(circuitBreaker -> {
            circuitBreaker.getEventPublisher()
                .onStateTransition(this::handleStateTransition)
                .onError(this::handleError)
                .onSuccess(this::handleSuccess)
                .onCallNotPermitted(this::handleCallNotPermitted);
        });
    }

    private void handleStateTransition(CircuitBreakerOnStateTransitionEvent event) {
        log.warn("断路器状态变更: {} - {} -> {}",
            event.getCircuitBreakerName(),
            event.getStateTransition().getFromState(),
            event.getStateTransition().getToState());

        // 发送告警
        if (event.getStateTransition().getToState() == CircuitBreaker.State.OPEN) {
            sendAlert("断路器打开告警",
                String.format("断路器 %s 已打开", event.getCircuitBreakerName()));
        }
    }

    private void handleError(CircuitBreakerOnErrorEvent event) {
        log.debug("断路器记录失败: {} - {} - {}ms",
            event.getCircuitBreakerName(),
            event.getThrowable().getMessage(),
            event.getElapsedDuration().toMillis());
    }

    private void handleSuccess(CircuitBreakerOnSuccessEvent event) {
        log.debug("断路器记录成功: {} - {}ms",
            event.getCircuitBreakerName(),
            event.getElapsedDuration().toMillis());
    }

    private void handleCallNotPermitted(CircuitBreakerOnCallNotPermittedEvent event) {
        log.warn("断路器拒绝调用: {}", event.getCircuitBreakerName());
    }

    private void sendAlert(String title, String message) {
        // 实现告警发送逻辑
    }
}
```

### Prometheus + Grafana 监控

```yaml
# Prometheus 告警规则
groups:
  - name: circuit-breaker-alerts
    rules:
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 2
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "断路器 {{ $labels.name }} 处于打开状态"
          description: "断路器已打开超过1分钟，下游服务可能不可用"

      - alert: CircuitBreakerHighFailureRate
        expr: circuit_breaker_failure_rate > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "断路器 {{ $labels.name }} 失败率过高"
          description: "当前失败率: {{ $value }}%"
```

## 实践案例

### 电商系统中的断路器应用

```java
// 订单服务调用多个下游服务
@Service
public class OrderProcessingService {

    private final CircuitBreaker inventoryCircuitBreaker;
    private final CircuitBreaker paymentCircuitBreaker;
    private final CircuitBreaker shippingCircuitBreaker;

    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final ShippingService shippingService;

    @Transactional
    public OrderResult processOrder(Order order) {
        // 1. 检查库存（使用断路器保护）
        InventoryResult inventoryResult = checkInventory(order);
        if (!inventoryResult.isAvailable()) {
            return OrderResult.failed("库存不足");
        }

        // 2. 处理支付（使用断路器保护）
        PaymentResult paymentResult = processPayment(order);
        if (!paymentResult.isSuccess()) {
            // 回滚库存预留
            releaseInventory(order);
            return OrderResult.failed("支付失败: " + paymentResult.getMessage());
        }

        // 3. 安排发货（使用断路器保护，但允许降级）
        ShippingResult shippingResult = arrangeShipping(order);
        // 发货服务失败不影响订单，后续可重试

        return OrderResult.success(order.getId());
    }

    private InventoryResult checkInventory(Order order) {
        try {
            return inventoryCircuitBreaker.executeSupplier(
                () -> inventoryService.checkAndReserve(order.getItems())
            );
        } catch (CallNotPermittedException e) {
            log.error("库存服务断路器打开，订单处理失败");
            throw new ServiceUnavailableException("库存服务暂不可用，请稍后重试");
        }
    }

    private PaymentResult processPayment(Order order) {
        try {
            return paymentCircuitBreaker.executeSupplier(
                () -> paymentService.process(order.getPaymentInfo())
            );
        } catch (CallNotPermittedException e) {
            log.error("支付服务断路器打开");
            return PaymentResult.failed("支付服务暂不可用，请稍后重试");
        }
    }

    private ShippingResult arrangeShipping(Order order) {
        try {
            return shippingCircuitBreaker.executeSupplier(
                () -> shippingService.arrange(order)
            );
        } catch (Exception e) {
            log.warn("发货服务调用失败，订单将进入待发货队列: {}", order.getId());
            // 降级处理：将订单放入待发货队列
            pendingShipmentQueue.add(order);
            return ShippingResult.pending();
        }
    }
}
```

### Spring Cloud Gateway 中的断路器

```yaml
# Spring Cloud Gateway 配置
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - name: CircuitBreaker
              args:
                name: userServiceCB
                fallbackUri: forward:/fallback/users

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: CircuitBreaker
              args:
                name: orderServiceCB
                fallbackUri: forward:/fallback/orders

resilience4j:
  circuitbreaker:
    instances:
      userServiceCB:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        sliding-window-size: 10
      orderServiceCB:
        failure-rate-threshold: 60
        wait-duration-in-open-state: 20s
        sliding-window-size: 20
```

```java
// 降级处理控制器
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/users/**")
    public ResponseEntity<Map<String, Object>> usersFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "code", "SERVICE_UNAVAILABLE",
                "message", "用户服务暂时不可用，请稍后重试",
                "timestamp", Instant.now()
            ));
    }

    @GetMapping("/orders/**")
    public ResponseEntity<Map<String, Object>> ordersFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "code", "SERVICE_UNAVAILABLE",
                "message", "订单服务暂时不可用，请稍后重试",
                "timestamp", Instant.now()
            ));
    }
}
```

## 最佳实践

### 合理设置阈值

```java
// 根据服务特性设置不同的阈值
CircuitBreakerConfig.custom()
    // 对于关键服务，设置较低的失败率阈值
    .failureRateThreshold(30)
    // 对于响应时间敏感的服务，设置慢调用阈值
    .slowCallRateThreshold(50)
    .slowCallDurationThreshold(Duration.ofSeconds(1))
    // 确保有足够的样本量
    .minimumNumberOfCalls(10)
    .build();
```

### 区分可重试和不可重试的错误

```java
// 网络错误可以触发断路器
recordExceptions(
    IOException.class,
    TimeoutException.class,
    ServiceUnavailableException.class
)
// 业务错误不应触发断路器
ignoreExceptions(
    ValidationException.class,
    BusinessException.class,
    NotFoundException.class
)
```

### 提供有意义的降级响应

```java
// 降级响应应该提供有用的信息
private Product getProductFallback(String productId, Exception e) {
    return Product.builder()
        .id(productId)
        .name("商品信息加载中...")
        .description("商品详情暂时无法获取，请刷新页面重试")
        .available(false)
        .fallbackReason(e.getMessage())
        .build();
}
```

### 监控和告警

```java
// 关键指标监控
- 断路器状态变化
- 失败率趋势
- 响应时间分布
- 降级调用次数

// 告警策略
- 断路器打开立即告警
- 失败率超过阈值预警
- 降级调用频繁告警
```

### 测试断路器行为

```java
@Test
void shouldOpenCircuitBreakerWhenFailureRateExceeds() {
    CircuitBreaker circuitBreaker = CircuitBreaker.of("test",
        CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .minimumNumberOfCalls(4)
            .slidingWindowSize(4)
            .build()
    );

    // 模拟调用
    circuitBreaker.onSuccess(0, TimeUnit.MILLISECONDS);
    circuitBreaker.onSuccess(0, TimeUnit.MILLISECONDS);
    circuitBreaker.onError(0, TimeUnit.MILLISECONDS, new IOException());
    circuitBreaker.onError(0, TimeUnit.MILLISECONDS, new IOException());

    // 验证断路器打开
    assertThat(circuitBreaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
}
```

## 常见问题与解决方案

### 问题1：断路器频繁切换状态

**原因**：阈值设置过于敏感，或者服务本身不稳定

**解决方案**：
- 增加 `minimumNumberOfCalls` 确保有足够的样本
- 适当提高 `failureRateThreshold`
- 增加 `waitDurationInOpenState` 给服务更多恢复时间

### 问题2：半开状态探测失败后立即打开

**原因**：默认一次失败就会回到打开状态

**解决方案**：
```java
CircuitBreakerConfig.custom()
    // 增加半开状态的允许调用数
    .permittedNumberOfCallsInHalfOpenState(5)
    // 设置半开状态的最大等待时间
    .maxWaitDurationInHalfOpenState(Duration.ofSeconds(10))
    .build();
```

### 问题3：断路器误判正常的业务错误

**原因**：没有正确区分技术错误和业务错误

**解决方案**：
```java
CircuitBreakerConfig.custom()
    // 只记录技术错误
    .recordExceptions(IOException.class, TimeoutException.class)
    // 忽略业务错误
    .ignoreExceptions(BusinessException.class)
    .build();
```

## 总结

断路器模式是构建弹性分布式系统的关键模式之一。通过本文，我们学习了：

1. **核心概念**：断路器的三种状态及其转换逻辑
2. **失败检测**：滑动窗口和失败类型识别
3. **降级策略**：默认值、缓存、备用服务、队列处理
4. **工具实践**：Resilience4j 的详细使用方法
5. **监控运维**：指标收集、事件监听、告警配置
6. **最佳实践**：阈值设置、错误区分、降级设计

合理使用断路器模式，可以有效防止故障蔓延，提高系统的整体可用性和用户体验。在实际应用中，需要根据业务特性和服务特点，合理配置断路器参数，并建立完善的监控告警体系。
