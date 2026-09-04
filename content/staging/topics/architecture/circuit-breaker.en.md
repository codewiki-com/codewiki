---
title: Circuit Breaker Pattern
description: Learn circuit breaker pattern to protect distributed systems
track: architecture
section: distributed
difficulty: intermediate
tags:
  - circuit breaker
  - fault tolerance
  - Resilience4j
  - high availability
status: imported
origin: old/src/content/docs/architecture/circuit-breaker.en.md
divergence: 0.313
issues: []
legacy:
  category: Architecture
  subcategory: Resilience
  order: 16
  lastUpdated: 2026-01-07
---

## Introduction

The Circuit Breaker pattern is a critical design pattern for building resilient distributed systems. Inspired by electrical circuit breakers that prevent electrical fires by cutting off power when current exceeds safe levels, the software circuit breaker prevents cascading failures by stopping requests to a failing service.

### Why Do We Need Circuit Breakers?

In distributed systems, services depend on each other through network calls. When one service fails or becomes slow, several problems can occur:

1. **Cascading Failures**: One failing service can bring down dependent services
2. **Resource Exhaustion**: Threads waiting for timeouts consume system resources
3. **Degraded User Experience**: Users wait indefinitely for responses
4. **System Instability**: Retry storms can overwhelm already struggling services

The Circuit Breaker pattern addresses these issues by:

- **Failing Fast**: Immediately returning errors instead of waiting for timeouts
- **Providing Fallbacks**: Offering alternative responses when services fail
- **Allowing Recovery**: Giving failing services time to recover
- **Enabling Monitoring**: Providing visibility into system health

---

## Circuit Breaker States

A circuit breaker operates in three states, transitioning between them based on the success or failure of calls to the protected resource.

```
                    Success Rate OK
              +------------------------+
              |                        |
              v                        |
         +--------+              +-----------+
         | CLOSED |---Failure--->|   OPEN    |
         +--------+   Threshold  +-----------+
              ^                        |
              |                        | Timeout
              |                        v
              |                  +-----------+
              +-----Success------| HALF-OPEN |
                                 +-----------+
                                       |
                                       | Failure
                                       v
                                 +-----------+
                                 |   OPEN    |
                                 +-----------+
```

### Closed State

In the **Closed** state, the circuit breaker allows all requests to pass through to the protected service. This is the normal operating mode.

- All requests are forwarded to the service
- Success and failure counts are tracked
- If failures exceed a threshold, the circuit transitions to Open

```java
// Closed state behavior
public class CircuitBreaker {
    private State state = State.CLOSED;
    private int failureCount = 0;
    private int failureThreshold = 5;

    public Response call(Request request) {
        if (state == State.CLOSED) {
            try {
                Response response = service.call(request);
                onSuccess();
                return response;
            } catch (Exception e) {
                onFailure();
                throw e;
            }
        }
        // ... handle other states
    }

    private void onFailure() {
        failureCount++;
        if (failureCount >= failureThreshold) {
            tripBreaker();
        }
    }

    private void tripBreaker() {
        state = State.OPEN;
        openedAt = Instant.now();
    }
}
```

### Open State

In the **Open** state, the circuit breaker immediately rejects all requests without calling the protected service. This prevents resource exhaustion and gives the failing service time to recover.

- Requests fail immediately with a circuit breaker exception
- No calls are made to the protected service
- After a timeout period, the circuit transitions to Half-Open

```java
// Open state behavior
public Response call(Request request) {
    if (state == State.OPEN) {
        if (shouldAttemptReset()) {
            state = State.HALF_OPEN;
            // Allow this request through for testing
        } else {
            throw new CircuitBreakerOpenException(
                "Circuit breaker is open, failing fast"
            );
        }
    }
    // ...
}

private boolean shouldAttemptReset() {
    Duration openDuration = Duration.between(openedAt, Instant.now());
    return openDuration.compareTo(resetTimeout) >= 0;
}
```

### Half-Open State

The **Half-Open** state is a test state that determines whether the protected service has recovered.

- A limited number of test requests are allowed through
- If requests succeed, the circuit transitions to Closed
- If requests fail, the circuit transitions back to Open

```java
// Half-Open state behavior
public class CircuitBreaker {
    private int halfOpenSuccessThreshold = 3;
    private int halfOpenRequestCount = 0;
    private int halfOpenSuccessCount = 0;

    public Response call(Request request) {
        if (state == State.HALF_OPEN) {
            halfOpenRequestCount++;
            try {
                Response response = service.call(request);
                halfOpenSuccessCount++;

                if (halfOpenSuccessCount >= halfOpenSuccessThreshold) {
                    reset();
                }
                return response;
            } catch (Exception e) {
                tripBreaker();
                throw e;
            }
        }
        // ...
    }

    private void reset() {
        state = State.CLOSED;
        failureCount = 0;
        halfOpenRequestCount = 0;
        halfOpenSuccessCount = 0;
    }
}
```

---

## Failure Detection Strategies

Effective circuit breakers use sophisticated failure detection to avoid false positives while still protecting the system.

### Failure Rate Threshold

Track the percentage of failed requests over a sliding window:

```java
public class SlidingWindowCircuitBreaker {
    private final int windowSize = 100;
    private final double failureRateThreshold = 0.5; // 50%
    private final CircularBuffer<Boolean> results = new CircularBuffer<>(windowSize);

    public void recordResult(boolean success) {
        results.add(success);

        if (results.isFull() && calculateFailureRate() >= failureRateThreshold) {
            tripBreaker();
        }
    }

    private double calculateFailureRate() {
        long failures = results.stream().filter(success -> !success).count();
        return (double) failures / results.size();
    }
}
```

### Slow Call Rate Threshold

Consider calls that exceed a duration threshold as slow:

```java
public class SlowCallCircuitBreaker {
    private final Duration slowCallThreshold = Duration.ofSeconds(2);
    private final double slowCallRateThreshold = 0.8; // 80%
    private final int windowSize = 100;

    public void recordCallDuration(Duration duration, boolean success) {
        boolean isSlow = duration.compareTo(slowCallThreshold) > 0;
        slowCallBuffer.add(isSlow);

        if (calculateSlowCallRate() >= slowCallRateThreshold) {
            tripBreaker();
        }
    }
}
```

### Count-Based vs Time-Based Windows

**Count-Based Window**: Evaluates the last N calls regardless of time:

```java
// Count-based sliding window
public class CountBasedWindow {
    private final int size;
    private final Queue<CallResult> calls = new LinkedList<>();

    public void record(CallResult result) {
        calls.offer(result);
        if (calls.size() > size) {
            calls.poll();
        }
    }

    public double getFailureRate() {
        if (calls.isEmpty()) return 0.0;
        long failures = calls.stream()
            .filter(CallResult::isFailed)
            .count();
        return (double) failures / calls.size();
    }
}
```

**Time-Based Window**: Evaluates calls within a time period:

```java
// Time-based sliding window
public class TimeBasedWindow {
    private final Duration windowDuration;
    private final Deque<TimestampedResult> calls = new ConcurrentLinkedDeque<>();

    public void record(CallResult result) {
        calls.addLast(new TimestampedResult(Instant.now(), result));
        evictOldEntries();
    }

    private void evictOldEntries() {
        Instant cutoff = Instant.now().minus(windowDuration);
        while (!calls.isEmpty() && calls.peekFirst().timestamp().isBefore(cutoff)) {
            calls.pollFirst();
        }
    }

    public double getFailureRate() {
        evictOldEntries();
        if (calls.isEmpty()) return 0.0;
        long failures = calls.stream()
            .filter(tr -> tr.result().isFailed())
            .count();
        return (double) failures / calls.size();
    }
}
```

---

## Fallback Strategies

When the circuit breaker is open, fallback strategies provide alternative responses to maintain partial system functionality.

### Static Fallback

Return a predefined default value:

```java
public class ProductService {
    private final CircuitBreaker circuitBreaker;
    private static final Product DEFAULT_PRODUCT = new Product(
        "unknown", "Product Unavailable", BigDecimal.ZERO
    );

    public Product getProduct(String productId) {
        try {
            return circuitBreaker.run(
                () -> remoteProductService.getProduct(productId),
                throwable -> DEFAULT_PRODUCT  // Static fallback
            );
        } catch (Exception e) {
            return DEFAULT_PRODUCT;
        }
    }
}
```

### Cache Fallback

Return cached data when the service is unavailable:

```java
public class ProductService {
    private final CircuitBreaker circuitBreaker;
    private final Cache<String, Product> productCache;

    public Product getProduct(String productId) {
        return circuitBreaker.run(
            () -> {
                Product product = remoteProductService.getProduct(productId);
                productCache.put(productId, product);  // Update cache
                return product;
            },
            throwable -> {
                // Cache fallback
                Product cached = productCache.get(productId);
                if (cached != null) {
                    return cached;
                }
                throw new ServiceUnavailableException(
                    "Product service unavailable and no cached data"
                );
            }
        );
    }
}
```

### Degraded Service Fallback

Provide reduced functionality:

```java
public class RecommendationService {
    private final CircuitBreaker circuitBreaker;

    public List<Product> getRecommendations(String userId) {
        return circuitBreaker.run(
            () -> mlRecommendationService.getPersonalizedRecommendations(userId),
            throwable -> getPopularProducts()  // Degraded fallback
        );
    }

    private List<Product> getPopularProducts() {
        // Return generic popular products instead of personalized recommendations
        return productRepository.findTopByOrderByPurchaseCountDesc(10);
    }
}
```

### Fallback Chain

Chain multiple fallback strategies:

```java
public class PricingService {
    private final CircuitBreaker primaryCircuitBreaker;
    private final CircuitBreaker secondaryCircuitBreaker;
    private final Cache<String, Price> priceCache;

    public Price getPrice(String productId) {
        // Try primary service
        try {
            return primaryCircuitBreaker.run(
                () -> primaryPricingService.getPrice(productId)
            );
        } catch (Exception e) {
            // Primary failed, try secondary
        }

        // Try secondary service
        try {
            return secondaryCircuitBreaker.run(
                () -> secondaryPricingService.getPrice(productId)
            );
        } catch (Exception e) {
            // Secondary failed, try cache
        }

        // Try cache
        Price cached = priceCache.get(productId);
        if (cached != null) {
            return cached;
        }

        // All fallbacks exhausted
        throw new PriceUnavailableException(productId);
    }
}
```

---

## Implementation with Resilience4j

Resilience4j is a lightweight fault tolerance library designed for Java 8 and functional programming. It is the recommended replacement for Netflix Hystrix.

### Basic Configuration

```java
// Add dependencies (build.gradle)
// implementation 'io.github.resilience4j:resilience4j-circuitbreaker:2.1.0'
// implementation 'io.github.resilience4j:resilience4j-spring-boot3:2.1.0'

// Circuit Breaker Configuration
@Configuration
public class CircuitBreakerConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            // Failure rate threshold percentage
            .failureRateThreshold(50)
            // Slow call rate threshold percentage
            .slowCallRateThreshold(80)
            // Duration threshold for slow calls
            .slowCallDurationThreshold(Duration.ofSeconds(2))
            // Wait duration in open state before transitioning to half-open
            .waitDurationInOpenState(Duration.ofSeconds(60))
            // Number of permitted calls in half-open state
            .permittedNumberOfCallsInHalfOpenState(5)
            // Minimum number of calls before calculating failure rate
            .minimumNumberOfCalls(10)
            // Sliding window type
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            // Sliding window size
            .slidingWindowSize(100)
            // Record exceptions as failures
            .recordExceptions(IOException.class, TimeoutException.class)
            // Ignore exceptions (don't count as failures)
            .ignoreExceptions(BusinessException.class)
            .build();

        return CircuitBreakerRegistry.of(config);
    }
}
```

### Using Circuit Breaker with Annotations

```java
@Service
public class OrderService {

    private final PaymentClient paymentClient;

    public OrderService(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }

    @CircuitBreaker(name = "paymentService", fallbackMethod = "processPaymentFallback")
    public PaymentResult processPayment(Order order) {
        return paymentClient.processPayment(
            new PaymentRequest(order.getId(), order.getTotal())
        );
    }

    // Fallback method - must have same return type
    private PaymentResult processPaymentFallback(Order order, Exception e) {
        log.warn("Payment service unavailable, queuing for later: {}", e.getMessage());

        // Queue payment for later processing
        paymentQueue.enqueue(new PendingPayment(order.getId(), order.getTotal()));

        return PaymentResult.pending(order.getId(), "Payment queued for processing");
    }
}
```

### Programmatic Usage

```java
@Service
public class InventoryService {

    private final CircuitBreaker circuitBreaker;
    private final InventoryClient inventoryClient;

    public InventoryService(CircuitBreakerRegistry registry, InventoryClient client) {
        this.circuitBreaker = registry.circuitBreaker("inventoryService");
        this.inventoryClient = client;

        // Register event listeners
        circuitBreaker.getEventPublisher()
            .onStateTransition(event ->
                log.info("Circuit breaker state transition: {} -> {}",
                    event.getStateTransition().getFromState(),
                    event.getStateTransition().getToState()))
            .onFailureRateExceeded(event ->
                log.warn("Failure rate exceeded: {}", event.getFailureRate()))
            .onSlowCallRateExceeded(event ->
                log.warn("Slow call rate exceeded: {}", event.getSlowCallRate()));
    }

    public InventoryStatus checkInventory(String productId) {
        Supplier<InventoryStatus> decoratedSupplier = CircuitBreaker
            .decorateSupplier(circuitBreaker,
                () -> inventoryClient.getInventoryStatus(productId));

        return Try.ofSupplier(decoratedSupplier)
            .recover(CallNotPermittedException.class,
                e -> InventoryStatus.unknown(productId))
            .recover(Exception.class,
                e -> InventoryStatus.unknown(productId))
            .get();
    }
}
```

### Combining with Other Patterns

Resilience4j allows combining circuit breaker with other resilience patterns:

```java
@Service
public class ExternalApiService {

    private final CircuitBreaker circuitBreaker;
    private final Retry retry;
    private final RateLimiter rateLimiter;
    private final TimeLimiter timeLimiter;
    private final Bulkhead bulkhead;

    public ExternalApiService(
            CircuitBreakerRegistry cbRegistry,
            RetryRegistry retryRegistry,
            RateLimiterRegistry rlRegistry,
            TimeLimiterRegistry tlRegistry,
            BulkheadRegistry bhRegistry) {

        this.circuitBreaker = cbRegistry.circuitBreaker("externalApi");
        this.retry = retryRegistry.retry("externalApi");
        this.rateLimiter = rlRegistry.rateLimiter("externalApi");
        this.timeLimiter = tlRegistry.timeLimiter("externalApi");
        this.bulkhead = bhRegistry.bulkhead("externalApi");
    }

    public CompletableFuture<ApiResponse> callExternalApi(ApiRequest request) {
        // Decoration order matters:
        // Bulkhead -> TimeLimiter -> RateLimiter -> CircuitBreaker -> Retry
        Supplier<CompletableFuture<ApiResponse>> supplier = () ->
            CompletableFuture.supplyAsync(() -> externalClient.call(request));

        Supplier<CompletableFuture<ApiResponse>> decoratedSupplier =
            Decorators.ofSupplier(supplier)
                .withBulkhead(bulkhead)
                .withTimeLimiter(timeLimiter, Executors.newSingleThreadScheduledExecutor())
                .withRateLimiter(rateLimiter)
                .withCircuitBreaker(circuitBreaker)
                .withRetry(retry)
                .decorate();

        return Try.ofSupplier(decoratedSupplier)
            .recover(Exception.class, e ->
                CompletableFuture.completedFuture(ApiResponse.error(e.getMessage())))
            .get();
    }
}
```

### Spring Boot Configuration

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        registerHealthIndicator: true
        slidingWindowSize: 100
        slidingWindowType: COUNT_BASED
        minimumNumberOfCalls: 10
        permittedNumberOfCallsInHalfOpenState: 5
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 30s
        failureRateThreshold: 50
        slowCallRateThreshold: 80
        slowCallDurationThreshold: 2s
        recordExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.client.HttpServerErrorException
        ignoreExceptions:
          - com.example.BusinessException

      inventoryService:
        slidingWindowSize: 50
        failureRateThreshold: 60
        waitDurationInOpenState: 60s

  retry:
    instances:
      paymentService:
        maxAttempts: 3
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.io.IOException

  ratelimiter:
    instances:
      paymentService:
        limitForPeriod: 100
        limitRefreshPeriod: 1s
        timeoutDuration: 500ms
```

---

## Implementation with Hystrix (Legacy)

While Netflix Hystrix is now in maintenance mode, many legacy systems still use it. Here is an example for reference:

```java
// Hystrix Command implementation
public class PaymentCommand extends HystrixCommand<PaymentResult> {

    private final PaymentClient paymentClient;
    private final PaymentRequest request;

    public PaymentCommand(PaymentClient paymentClient, PaymentRequest request) {
        super(Setter
            .withGroupKey(HystrixCommandGroupKey.Factory.asKey("PaymentService"))
            .andCommandKey(HystrixCommandKey.Factory.asKey("ProcessPayment"))
            .andThreadPoolKey(HystrixThreadPoolKey.Factory.asKey("PaymentThreadPool"))
            .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                .withCircuitBreakerEnabled(true)
                .withCircuitBreakerRequestVolumeThreshold(20)
                .withCircuitBreakerSleepWindowInMilliseconds(5000)
                .withCircuitBreakerErrorThresholdPercentage(50)
                .withExecutionTimeoutInMilliseconds(3000)
                .withExecutionIsolationStrategy(
                    HystrixCommandProperties.ExecutionIsolationStrategy.THREAD))
            .andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
                .withCoreSize(10)
                .withMaxQueueSize(100)));

        this.paymentClient = paymentClient;
        this.request = request;
    }

    @Override
    protected PaymentResult run() throws Exception {
        return paymentClient.processPayment(request);
    }

    @Override
    protected PaymentResult getFallback() {
        return PaymentResult.pending(request.getOrderId(),
            "Payment service unavailable");
    }
}

// Usage
PaymentResult result = new PaymentCommand(paymentClient, request).execute();
```

---

## Monitoring and Observability

Effective monitoring is essential for operating circuit breakers in production.

### Metrics to Track

```java
@Component
public class CircuitBreakerMetrics {

    private final MeterRegistry meterRegistry;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    public CircuitBreakerMetrics(
            MeterRegistry meterRegistry,
            CircuitBreakerRegistry circuitBreakerRegistry) {
        this.meterRegistry = meterRegistry;
        this.circuitBreakerRegistry = circuitBreakerRegistry;

        // Register metrics for all circuit breakers
        circuitBreakerRegistry.getAllCircuitBreakers().forEach(this::registerMetrics);
    }

    private void registerMetrics(CircuitBreaker circuitBreaker) {
        String name = circuitBreaker.getName();
        CircuitBreaker.Metrics metrics = circuitBreaker.getMetrics();

        // Gauge for circuit breaker state
        Gauge.builder("circuit_breaker_state", circuitBreaker,
                cb -> cb.getState().getOrder())
            .tag("name", name)
            .description("Current state of the circuit breaker")
            .register(meterRegistry);

        // Gauge for failure rate
        Gauge.builder("circuit_breaker_failure_rate", metrics,
                CircuitBreaker.Metrics::getFailureRate)
            .tag("name", name)
            .description("Current failure rate percentage")
            .register(meterRegistry);

        // Gauge for slow call rate
        Gauge.builder("circuit_breaker_slow_call_rate", metrics,
                CircuitBreaker.Metrics::getSlowCallRate)
            .tag("name", name)
            .description("Current slow call rate percentage")
            .register(meterRegistry);

        // Counter for state transitions
        circuitBreaker.getEventPublisher()
            .onStateTransition(event -> {
                Counter.builder("circuit_breaker_state_transitions_total")
                    .tag("name", name)
                    .tag("from", event.getStateTransition().getFromState().name())
                    .tag("to", event.getStateTransition().getToState().name())
                    .register(meterRegistry)
                    .increment();
            });
    }
}
```

### Health Indicators

```java
@Component
public class CircuitBreakerHealthIndicator implements HealthIndicator {

    private final CircuitBreakerRegistry circuitBreakerRegistry;

    public CircuitBreakerHealthIndicator(CircuitBreakerRegistry registry) {
        this.circuitBreakerRegistry = registry;
    }

    @Override
    public Health health() {
        Map<String, Object> details = new HashMap<>();
        boolean allHealthy = true;

        for (CircuitBreaker cb : circuitBreakerRegistry.getAllCircuitBreakers()) {
            CircuitBreaker.State state = cb.getState();
            CircuitBreaker.Metrics metrics = cb.getMetrics();

            Map<String, Object> cbDetails = new HashMap<>();
            cbDetails.put("state", state.name());
            cbDetails.put("failureRate", metrics.getFailureRate());
            cbDetails.put("slowCallRate", metrics.getSlowCallRate());
            cbDetails.put("bufferedCalls", metrics.getNumberOfBufferedCalls());
            cbDetails.put("failedCalls", metrics.getNumberOfFailedCalls());
            cbDetails.put("successfulCalls", metrics.getNumberOfSuccessfulCalls());

            details.put(cb.getName(), cbDetails);

            if (state == CircuitBreaker.State.OPEN) {
                allHealthy = false;
            }
        }

        return allHealthy
            ? Health.up().withDetails(details).build()
            : Health.down().withDetails(details).build();
    }
}
```

### Dashboard Integration

```java
// Expose circuit breaker status via REST endpoint
@RestController
@RequestMapping("/api/circuit-breakers")
public class CircuitBreakerController {

    private final CircuitBreakerRegistry circuitBreakerRegistry;

    @GetMapping
    public List<CircuitBreakerStatus> getAllStatus() {
        return circuitBreakerRegistry.getAllCircuitBreakers().stream()
            .map(this::toStatus)
            .collect(Collectors.toList());
    }

    @GetMapping("/{name}")
    public CircuitBreakerStatus getStatus(@PathVariable String name) {
        return circuitBreakerRegistry.find(name)
            .map(this::toStatus)
            .orElseThrow(() -> new ResourceNotFoundException("Circuit breaker not found: " + name));
    }

    @PostMapping("/{name}/reset")
    public CircuitBreakerStatus reset(@PathVariable String name) {
        CircuitBreaker cb = circuitBreakerRegistry.find(name)
            .orElseThrow(() -> new ResourceNotFoundException("Circuit breaker not found: " + name));
        cb.reset();
        return toStatus(cb);
    }

    private CircuitBreakerStatus toStatus(CircuitBreaker cb) {
        CircuitBreaker.Metrics metrics = cb.getMetrics();
        return new CircuitBreakerStatus(
            cb.getName(),
            cb.getState().name(),
            metrics.getFailureRate(),
            metrics.getSlowCallRate(),
            metrics.getNumberOfBufferedCalls(),
            metrics.getNumberOfFailedCalls(),
            metrics.getNumberOfSuccessfulCalls(),
            metrics.getNumberOfSlowCalls(),
            metrics.getNumberOfNotPermittedCalls()
        );
    }
}
```

---

## Practical Examples

### E-Commerce Order Processing

```java
@Service
public class OrderProcessingService {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;
    private final ShippingService shippingService;

    public OrderResult processOrder(Order order) {
        // Check inventory with circuit breaker
        CircuitBreaker inventoryCB = circuitBreakerRegistry
            .circuitBreaker("inventory");

        InventoryResult inventoryResult = inventoryCB.executeSupplier(() ->
            inventoryService.reserveItems(order.getItems()));

        if (!inventoryResult.isSuccess()) {
            return OrderResult.failed("Insufficient inventory");
        }

        // Process payment with circuit breaker
        CircuitBreaker paymentCB = circuitBreakerRegistry
            .circuitBreaker("payment");

        PaymentResult paymentResult;
        try {
            paymentResult = paymentCB.executeSupplier(() ->
                paymentService.charge(order.getCustomerId(), order.getTotal()));
        } catch (CallNotPermittedException e) {
            // Payment service circuit is open, release inventory
            inventoryService.releaseItems(order.getItems());
            return OrderResult.failed("Payment service temporarily unavailable");
        }

        if (!paymentResult.isSuccess()) {
            inventoryService.releaseItems(order.getItems());
            return OrderResult.failed("Payment failed: " + paymentResult.getMessage());
        }

        // Schedule shipping with circuit breaker and fallback
        CircuitBreaker shippingCB = circuitBreakerRegistry
            .circuitBreaker("shipping");

        ShippingResult shippingResult = Try.ofSupplier(
                shippingCB.decorateSupplier(() ->
                    shippingService.scheduleShipping(order)))
            .recover(e -> {
                // Fallback: Queue for later processing
                shippingQueue.enqueue(order);
                return ShippingResult.queued();
            })
            .get();

        return OrderResult.success(order.getId(), shippingResult.getTrackingNumber());
    }
}
```

### Microservices API Gateway

```java
@Component
public class ServiceRouter {

    private final Map<String, CircuitBreaker> circuitBreakers;
    private final WebClient webClient;

    public Mono<ResponseEntity<String>> routeRequest(
            String serviceName,
            ServerHttpRequest request) {

        CircuitBreaker circuitBreaker = circuitBreakers.get(serviceName);

        if (circuitBreaker == null) {
            return Mono.just(ResponseEntity.notFound().build());
        }

        return CircuitBreakerOperator.of(circuitBreaker)
            .compose(executeRequest(serviceName, request))
            .onErrorResume(CallNotPermittedException.class, e ->
                Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Service temporarily unavailable")))
            .onErrorResume(Exception.class, e ->
                Mono.just(ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Error communicating with service")));
    }

    private Function<Mono<ResponseEntity<String>>, Mono<ResponseEntity<String>>>
            executeRequest(String serviceName, ServerHttpRequest request) {
        return mono -> webClient
            .method(request.getMethod())
            .uri(buildUri(serviceName, request))
            .headers(h -> h.addAll(request.getHeaders()))
            .exchangeToMono(response -> response.toEntity(String.class));
    }
}
```

### Database Connection Circuit Breaker

```java
@Component
public class ResilientDataSource implements DataSource {

    private final DataSource delegate;
    private final CircuitBreaker circuitBreaker;

    public ResilientDataSource(
            DataSource delegate,
            CircuitBreakerRegistry registry) {
        this.delegate = delegate;
        this.circuitBreaker = registry.circuitBreaker("database",
            CircuitBreakerConfig.custom()
                .failureRateThreshold(30)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .slowCallDurationThreshold(Duration.ofSeconds(5))
                .slowCallRateThreshold(50)
                .slidingWindowSize(20)
                .minimumNumberOfCalls(5)
                .recordExceptions(SQLException.class)
                .build());
    }

    @Override
    public Connection getConnection() throws SQLException {
        try {
            return circuitBreaker.executeCallable(delegate::getConnection);
        } catch (CallNotPermittedException e) {
            throw new SQLException("Database circuit breaker is open", e);
        } catch (SQLException e) {
            throw e;
        } catch (Exception e) {
            throw new SQLException("Unexpected error getting connection", e);
        }
    }

    @Override
    public Connection getConnection(String username, String password)
            throws SQLException {
        try {
            return circuitBreaker.executeCallable(() ->
                delegate.getConnection(username, password));
        } catch (CallNotPermittedException e) {
            throw new SQLException("Database circuit breaker is open", e);
        } catch (SQLException e) {
            throw e;
        } catch (Exception e) {
            throw new SQLException("Unexpected error getting connection", e);
        }
    }

    // Delegate other methods...
}
```

---

## Best Practices

### Choose Appropriate Thresholds

```java
// Production-ready configuration considerations
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    // Allow enough calls for meaningful statistics
    .minimumNumberOfCalls(20)
    // Use realistic failure threshold (not too sensitive)
    .failureRateThreshold(50)
    // Consider slow calls as partial failures
    .slowCallRateThreshold(80)
    .slowCallDurationThreshold(Duration.ofSeconds(3))
    // Give services time to recover
    .waitDurationInOpenState(Duration.ofSeconds(60))
    // Test recovery gradually
    .permittedNumberOfCallsInHalfOpenState(10)
    .build();
```

### Use Meaningful Fallbacks

```java
// Good: Provide degraded but useful functionality
public List<Product> getRecommendations(String userId) {
    return circuitBreaker.run(
        () -> mlService.getPersonalizedRecommendations(userId),
        e -> cacheService.getTopProducts() // Meaningful fallback
    );
}

// Bad: Silent failure that confuses users
public List<Product> getRecommendationsBad(String userId) {
    return circuitBreaker.run(
        () -> mlService.getPersonalizedRecommendations(userId),
        e -> Collections.emptyList() // Confusing empty response
    );
}
```

### Separate Circuit Breakers per Integration

```java
// Good: Each service has its own circuit breaker
CircuitBreaker paymentCB = registry.circuitBreaker("payment");
CircuitBreaker inventoryCB = registry.circuitBreaker("inventory");
CircuitBreaker shippingCB = registry.circuitBreaker("shipping");

// Bad: Sharing circuit breaker across unrelated services
CircuitBreaker sharedCB = registry.circuitBreaker("external");
```

### Log State Transitions

```java
circuitBreaker.getEventPublisher()
    .onStateTransition(event -> {
        log.warn("Circuit breaker '{}' transitioned from {} to {}",
            event.getCircuitBreakerName(),
            event.getStateTransition().getFromState(),
            event.getStateTransition().getToState());

        // Send alert for OPEN state
        if (event.getStateTransition().getToState() == State.OPEN) {
            alertingService.sendAlert(
                AlertLevel.WARNING,
                String.format("Circuit breaker '%s' opened",
                    event.getCircuitBreakerName())
            );
        }
    });
```

### Test Circuit Breaker Behavior

```java
@Test
void shouldOpenCircuitAfterFailures() {
    CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(
        CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .minimumNumberOfCalls(4)
            .slidingWindowSize(4)
            .waitDurationInOpenState(Duration.ofMinutes(1))
            .build());

    CircuitBreaker circuitBreaker = registry.circuitBreaker("test");

    // Simulate failures
    for (int i = 0; i < 4; i++) {
        try {
            circuitBreaker.executeRunnable(() -> {
                throw new RuntimeException("Service error");
            });
        } catch (Exception ignored) {}
    }

    // Circuit should be open
    assertThat(circuitBreaker.getState()).isEqualTo(State.OPEN);

    // Subsequent calls should fail immediately
    assertThatThrownBy(() ->
        circuitBreaker.executeRunnable(() -> {}))
        .isInstanceOf(CallNotPermittedException.class);
}
```

---

## Summary

The Circuit Breaker pattern is essential for building resilient distributed systems. Key takeaways:

1. **Three States**: Closed (normal), Open (failing fast), Half-Open (testing recovery)
2. **Failure Detection**: Use sliding windows to track failure rates and slow calls
3. **Fallback Strategies**: Provide meaningful alternatives when services fail
4. **Resilience4j**: Modern, lightweight library for implementing circuit breakers
5. **Monitoring**: Track metrics and state transitions for operational visibility
6. **Best Practices**: Choose appropriate thresholds, use separate breakers per integration, and test behavior

By implementing circuit breakers correctly, you can prevent cascading failures, improve system stability, and provide better user experiences even when parts of your system are struggling.
