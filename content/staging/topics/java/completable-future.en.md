---
title: CompletableFuture
description: Java CompletableFuture完全指南，异步编程与函数式组合
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - CompletableFuture
  - 异步
  - 并发
status: imported
origin: old/src/content/docs/java/completable-future.en.md
divergence: 0.223
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: 并发编程
  order: 17
  lastUpdated: 2026-01-07
---

`CompletableFuture` is a powerful asynchronous programming tool introduced in Java 8. It implements both the `Future` interface and the `CompletionStage` interface, providing rich functional programming capabilities. We explore various uses and best practices of `CompletableFuture` in depth.

## Why Do We Need CompletableFuture

The `Future` interface introduced in Java 5 has the following limitations:

```java
// Problems with traditional Future
ExecutorService executor = Executors.newFixedThreadPool(10);
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "Result";
});

// Problem 1: get() is blocking
String result = future.get(); // Must wait for result

// Problem 2: Cannot combine multiple Futures
// Problem 3: No exception handling mechanism
// Problem 4: Cannot complete manually
```

`CompletableFuture` solves these problems by providing:
- Non-blocking callback mechanism
- Powerful composition capabilities
- Comprehensive exception handling
- Ability to complete manually

## Creating CompletableFuture

### Basic Creation Methods

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureCreation {

    public static void main(String[] args) throws Exception {
        // 1. Create an already completed CompletableFuture
        CompletableFuture<String> completed = CompletableFuture.completedFuture("Completed value");
        System.out.println(completed.get()); // Returns immediately: Completed value

        // 2. Create a failed CompletableFuture (Java 9+)
        CompletableFuture<String> failed = CompletableFuture.failedFuture(
            new RuntimeException("Operation failed")
        );

        // 3. Create an empty CompletableFuture to complete manually later
        CompletableFuture<String> manual = new CompletableFuture<>();

        // Complete in another thread
        new Thread(() -> {
            try {
                Thread.sleep(500);
                manual.complete("Manually completed value");
            } catch (InterruptedException e) {
                manual.completeExceptionally(e);
            }
        }).start();

        System.out.println(manual.get()); // Wait and get: Manually completed value
    }
}
```

### Creating Async Tasks Using Factory Methods

```java
public class AsyncTaskCreation {

    private static final ExecutorService customExecutor =
        Executors.newFixedThreadPool(4);

    public static void main(String[] args) throws Exception {
        // 1. runAsync - Async task with no return value
        CompletableFuture<Void> runFuture = CompletableFuture.runAsync(() -> {
            System.out.println("Execution thread: " + Thread.currentThread().getName());
            // Perform some operations without returning a result
        });

        // 2. supplyAsync - Async task with return value (using default ForkJoinPool)
        CompletableFuture<String> supplyFuture = CompletableFuture.supplyAsync(() -> {
            System.out.println("Execution thread: " + Thread.currentThread().getName());
            return "Asynchronously computed result";
        });

        // 3. Using a custom thread pool
        CompletableFuture<Integer> customFuture = CompletableFuture.supplyAsync(() -> {
            System.out.println("Custom thread pool: " + Thread.currentThread().getName());
            return 42;
        }, customExecutor);

        // Wait for all tasks to complete
        runFuture.join();
        System.out.println(supplyFuture.get());
        System.out.println(customFuture.get());

        customExecutor.shutdown();
    }
}
```

## Transforming and Processing Results

### thenApply - Synchronous Transformation

`thenApply` is used for synchronous transformation of results, similar to Stream's `map` operation.

```java
public class ThenApplyExample {

    public static void main(String[] args) throws Exception {
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "Hello")
            .thenApply(s -> s + " World")        // Transformation 1
            .thenApply(String::toUpperCase)      // Transformation 2
            .thenApply(s -> s + "!");            // Transformation 3

        System.out.println(future.get()); // HELLO WORLD!

        // thenApplyAsync - Execute transformation in a different thread
        CompletableFuture<Integer> asyncFuture = CompletableFuture
            .supplyAsync(() -> "12345")
            .thenApplyAsync(s -> {
                System.out.println("Transformation thread: " + Thread.currentThread().getName());
                return Integer.parseInt(s);
            })
            .thenApplyAsync(n -> n * 2);

        System.out.println(asyncFuture.get()); // 24690
    }
}
```

### thenAccept and thenRun - Consuming Results

```java
public class ThenAcceptRunExample {

    public static void main(String[] args) throws Exception {
        // thenAccept - Consume result with no return value
        CompletableFuture<Void> acceptFuture = CompletableFuture
            .supplyAsync(() -> "Processing result")
            .thenAccept(result -> {
                System.out.println("Received result: " + result);
                // Can save to database, send notifications, etc.
            });

        // thenRun - Don't care about result, just execute an action after completion
        CompletableFuture<Void> runFuture = CompletableFuture
            .supplyAsync(() -> {
                // Perform some calculations
                return 100;
            })
            .thenRun(() -> {
                System.out.println("Task completed, performing cleanup");
            });

        acceptFuture.join();
        runFuture.join();
    }
}
```

### thenCompose - Flattening Composition (flatMap)

`thenCompose` is used to flatten nested `CompletableFuture`, similar to Stream's `flatMap`.

```java
public class ThenComposeExample {

    // Simulate getting user info by user ID
    static CompletableFuture<User> getUserById(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate database query
            return new User(userId, "John", "john@example.com");
        });
    }

    // Simulate getting order list by user
    static CompletableFuture<List<Order>> getOrdersByUser(User user) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate database query
            return Arrays.asList(
                new Order(1L, user.getId(), 100.0),
                new Order(2L, user.getId(), 200.0)
            );
        });
    }

    public static void main(String[] args) throws Exception {
        // Using thenApply causes nesting - Not recommended
        CompletableFuture<CompletableFuture<List<Order>>> nestedFuture =
            getUserById(1L).thenApply(user -> getOrdersByUser(user));

        // Using thenCompose for flattening - Recommended
        CompletableFuture<List<Order>> flatFuture =
            getUserById(1L).thenCompose(user -> getOrdersByUser(user));

        List<Order> orders = flatFuture.get();
        orders.forEach(System.out::println);
    }

    // Helper classes
    static class User {
        private Long id;
        private String name;
        private String email;

        User(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        Long getId() { return id; }
    }

    static class Order {
        private Long id;
        private Long userId;
        private Double amount;

        Order(Long id, Long userId, Double amount) {
            this.id = id;
            this.userId = userId;
            this.amount = amount;
        }

        @Override
        public String toString() {
            return "Order{id=" + id + ", amount=" + amount + "}";
        }
    }
}
```

## Combining Multiple CompletableFutures

### thenCombine - Merging Two Results

```java
public class ThenCombineExample {

    public static void main(String[] args) throws Exception {
        // Simulate getting user basic info
        CompletableFuture<String> userInfoFuture = CompletableFuture.supplyAsync(() -> {
            sleep(100);
            return "User: John";
        });

        // Simulate getting user points
        CompletableFuture<Integer> pointsFuture = CompletableFuture.supplyAsync(() -> {
            sleep(150);
            return 1500;
        });

        // Combine two results
        CompletableFuture<String> combinedFuture = userInfoFuture.thenCombine(
            pointsFuture,
            (userInfo, points) -> userInfo + ", Points: " + points
        );

        System.out.println(combinedFuture.get()); // User: John, Points: 1500

        // thenAcceptBoth - Consume two results with no return value
        userInfoFuture.thenAcceptBoth(pointsFuture, (user, points) -> {
            System.out.println("Send email to " + user + ", current points " + points);
        });

        // runAfterBoth - Execute action after both complete, without caring about results
        userInfoFuture.runAfterBoth(pointsFuture, () -> {
            System.out.println("Both queries completed");
        });
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### allOf - Wait for All to Complete

```java
public class AllOfExample {

    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();

        // Create multiple async tasks
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "Task 1 completed";
        });

        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "Task 2 completed";
        });

        CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> {
            sleep(1200);
            return "Task 3 completed";
        });

        // allOf waits for all to complete (returns CompletableFuture<Void>)
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            future1, future2, future3
        );

        // After all complete, collect results
        CompletableFuture<List<String>> resultsFuture = allFutures.thenApply(v -> {
            return Stream.of(future1, future2, future3)
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
        });

        List<String> results = resultsFuture.get();
        long end = System.currentTimeMillis();

        System.out.println("All results: " + results);
        System.out.println("Total time: " + (end - start) + "ms"); // About 1200ms, parallel execution
    }

    // More general method: Execute in parallel and collect results
    public static <T> CompletableFuture<List<T>> allOfWithResults(
            List<CompletableFuture<T>> futures) {

        CompletableFuture<Void> allDone = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0])
        );

        return allDone.thenApply(v ->
            futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList())
        );
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### anyOf - Any One Completes

```java
public class AnyOfExample {

    public static void main(String[] args) throws Exception {
        // Simulate multiple data sources, use the fastest result
        CompletableFuture<String> source1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "Result from source 1";
        });

        CompletableFuture<String> source2 = CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return "Result from source 2";
        });

        CompletableFuture<String> source3 = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "Result from source 3";
        });

        // anyOf returns the first completed result (returns Object type)
        CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(
            source1, source2, source3
        );

        Object result = anyFuture.get();
        System.out.println("Fastest result: " + result); // Result from source 2

        // applyToEither - More type-safe way to handle two Futures
        CompletableFuture<String> eitherFuture = source1.applyToEither(
            source2,
            result2 -> "Got result: " + result2
        );

        System.out.println(eitherFuture.get());
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Exception Handling

### exceptionally - Handle Exception and Recover

```java
public class ExceptionallyExample {

    public static void main(String[] args) throws Exception {
        // exceptionally - Catch exception and return default value
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> {
                if (Math.random() > 0.5) {
                    throw new RuntimeException("Simulated exception");
                }
                return "Success result";
            })
            .exceptionally(ex -> {
                System.out.println("Caught exception: " + ex.getMessage());
                return "Default value"; // Return fallback value
            });

        System.out.println(future.get()); // Success result or Default value

        // Exception handling in chained calls
        CompletableFuture<Integer> chainedFuture = CompletableFuture
            .supplyAsync(() -> "123abc")
            .thenApply(Integer::parseInt) // This will throw NumberFormatException
            .exceptionally(ex -> {
                System.out.println("Parsing failed: " + ex.getCause().getMessage());
                return 0; // Return default value
            });

        System.out.println(chainedFuture.get()); // 0
    }
}
```

### handle - Unified Handling of Results and Exceptions

```java
public class HandleExample {

    public static void main(String[] args) throws Exception {
        // handle - Called regardless of success or failure
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> {
                if (Math.random() > 0.5) {
                    throw new RuntimeException("Processing failed");
                }
                return "Processing successful";
            })
            .handle((result, ex) -> {
                if (ex != null) {
                    System.out.println("Exception occurred: " + ex.getMessage());
                    return "Error recovery value";
                }
                return result + " - processed";
            });

        System.out.println(future.get());

        // Difference from exceptionally: handle is always called
        CompletableFuture<String> future2 = CompletableFuture
            .supplyAsync(() -> "Normal result")
            .handle((result, ex) -> {
                // This executes even when there's no exception
                System.out.println("Result: " + result + ", Exception: " + ex);
                return result;
            });

        future2.get();
    }
}
```

### whenComplete - Observe Results (Without Changing Them)

```java
public class WhenCompleteExample {

    public static void main(String[] args) throws Exception {
        // whenComplete - Observe result or exception without changing them
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "Computed result")
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    System.out.println("Log error: " + ex.getMessage());
                    // Can log, send alerts, etc.
                } else {
                    System.out.println("Log success: " + result);
                }
                // Note: Cannot change the result here
            });

        // Result is still the original value
        System.out.println(future.get()); // Computed result

        // If there's an exception, it still propagates after whenComplete executes
        CompletableFuture<String> failedFuture = CompletableFuture
            .<String>supplyAsync(() -> {
                throw new RuntimeException("Original exception");
            })
            .whenComplete((result, ex) -> {
                System.out.println("Observed exception: " + ex.getMessage());
            });

        try {
            failedFuture.get();
        } catch (Exception e) {
            System.out.println("Exception still propagates: " + e.getCause().getMessage());
        }
    }
}
```

### Comprehensive Exception Handling Example

```java
public class ComprehensiveExceptionHandling {

    public static void main(String[] args) {
        // Real scenario: Call external API with retry and fallback
        String result = callExternalApiWithFallback("https://api.example.com/data");
        System.out.println("Final result: " + result);
    }

    static String callExternalApiWithFallback(String url) {
        return CompletableFuture
            .supplyAsync(() -> callPrimaryApi(url))
            .handle((result, ex) -> {
                if (ex != null) {
                    System.out.println("Primary API failed, trying backup API: " + ex.getMessage());
                    return callBackupApi(url);
                }
                return result;
            })
            .exceptionally(ex -> {
                System.out.println("All APIs failed, using cache: " + ex.getMessage());
                return getFromCache(url);
            })
            .join();
    }

    static String callPrimaryApi(String url) {
        // Simulate API call
        throw new RuntimeException("Primary API unavailable");
    }

    static String callBackupApi(String url) {
        // Simulate backup API call
        throw new RuntimeException("Backup API also unavailable");
    }

    static String getFromCache(String url) {
        return "Cached data";
    }
}
```

## Timeout Handling

### orTimeout and completeOnTimeout (Java 9+)

```java
public class TimeoutExample {

    public static void main(String[] args) throws Exception {
        // orTimeout - Throws TimeoutException after timeout
        CompletableFuture<String> future1 = CompletableFuture
            .supplyAsync(() -> {
                sleep(5000); // Simulate long-running operation
                return "Result";
            })
            .orTimeout(2, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex.getCause() instanceof TimeoutException) {
                    return "Operation timed out, returning default value";
                }
                return "Other error";
            });

        System.out.println(future1.get()); // Operation timed out, returning default value

        // completeOnTimeout - Returns default value after timeout (no exception)
        CompletableFuture<String> future2 = CompletableFuture
            .supplyAsync(() -> {
                sleep(5000);
                return "Delayed result";
            })
            .completeOnTimeout("Timeout default value", 2, TimeUnit.SECONDS);

        System.out.println(future2.get()); // Timeout default value
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### Timeout Handling in Java 8

```java
public class Java8TimeoutExample {

    private static final ScheduledExecutorService scheduler =
        Executors.newScheduledThreadPool(1);

    public static void main(String[] args) throws Exception {
        CompletableFuture<String> future = supplyAsyncWithTimeout(
            () -> {
                sleep(5000);
                return "Result";
            },
            2,
            TimeUnit.SECONDS,
            "Timeout default value"
        );

        System.out.println(future.get()); // Timeout default value
        scheduler.shutdown();
    }

    // Java 8 compatible timeout method
    public static <T> CompletableFuture<T> supplyAsyncWithTimeout(
            Supplier<T> supplier,
            long timeout,
            TimeUnit unit,
            T defaultValue) {

        CompletableFuture<T> future = CompletableFuture.supplyAsync(supplier);

        // Schedule timeout task
        scheduler.schedule(() -> {
            if (!future.isDone()) {
                future.complete(defaultValue);
            }
        }, timeout, unit);

        return future;
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Practical Application Scenarios

### Scenario 1: Parallel Service Calls

```java
public class ParallelServiceCallExample {

    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();

        // Call multiple services in parallel
        CompletableFuture<UserInfo> userFuture = getUserInfoAsync(1L);
        CompletableFuture<List<Order>> ordersFuture = getOrdersAsync(1L);
        CompletableFuture<List<Address>> addressesFuture = getAddressesAsync(1L);
        CompletableFuture<CreditInfo> creditFuture = getCreditInfoAsync(1L);

        // Wait for all to complete and assemble results
        CompletableFuture<UserProfile> profileFuture = CompletableFuture
            .allOf(userFuture, ordersFuture, addressesFuture, creditFuture)
            .thenApply(v -> {
                UserInfo user = userFuture.join();
                List<Order> orders = ordersFuture.join();
                List<Address> addresses = addressesFuture.join();
                CreditInfo credit = creditFuture.join();

                return new UserProfile(user, orders, addresses, credit);
            });

        UserProfile profile = profileFuture.get();

        long end = System.currentTimeMillis();
        System.out.println("User profile retrieval completed, time: " + (end - start) + "ms");
        System.out.println(profile);
    }

    // Simulate various service calls
    static CompletableFuture<UserInfo> getUserInfoAsync(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(300);
            return new UserInfo(userId, "John", "john@example.com");
        });
    }

    static CompletableFuture<List<Order>> getOrdersAsync(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return Arrays.asList(
                new Order(1L, 100.0),
                new Order(2L, 200.0)
            );
        });
    }

    static CompletableFuture<List<Address>> getAddressesAsync(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(200);
            return Arrays.asList(new Address("123 Main Street, New York"));
        });
    }

    static CompletableFuture<CreditInfo> getCreditInfoAsync(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(400);
            return new CreditInfo(750);
        });
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // Helper class definitions
    static class UserInfo {
        Long id;
        String name;
        String email;
        UserInfo(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }
    }

    static class Order {
        Long id;
        Double amount;
        Order(Long id, Double amount) {
            this.id = id;
            this.amount = amount;
        }
    }

    static class Address {
        String detail;
        Address(String detail) {
            this.detail = detail;
        }
    }

    static class CreditInfo {
        int score;
        CreditInfo(int score) {
            this.score = score;
        }
    }

    static class UserProfile {
        UserInfo user;
        List<Order> orders;
        List<Address> addresses;
        CreditInfo credit;

        UserProfile(UserInfo user, List<Order> orders,
                   List<Address> addresses, CreditInfo credit) {
            this.user = user;
            this.orders = orders;
            this.addresses = addresses;
            this.credit = credit;
        }

        @Override
        public String toString() {
            return "UserProfile{user=" + user.name +
                   ", orders=" + orders.size() +
                   ", addresses=" + addresses.size() +
                   ", creditScore=" + credit.score + "}";
        }
    }
}
```

### Scenario 2: Async Operations with Retry

```java
public class RetryExample {

    public static void main(String[] args) {
        String result = executeWithRetry(
            () -> callUnstableApi(),
            3,
            Duration.ofSeconds(1)
        ).join();

        System.out.println("Final result: " + result);
    }

    // Async execution with retry
    public static <T> CompletableFuture<T> executeWithRetry(
            Supplier<T> action,
            int maxRetries,
            Duration delay) {

        return CompletableFuture.supplyAsync(action)
            .handle((result, ex) -> {
                if (ex == null) {
                    return CompletableFuture.completedFuture(result);
                }
                if (maxRetries <= 0) {
                    return CompletableFuture.<T>failedFuture(ex);
                }

                System.out.println("Operation failed, retrying after " + delay.toMillis() +
                    "ms, remaining attempts: " + maxRetries);

                sleep(delay.toMillis());
                return executeWithRetry(action, maxRetries - 1, delay);
            })
            .thenCompose(Function.identity());
    }

    static String callUnstableApi() {
        // Simulate unstable API (50% failure rate)
        if (Math.random() > 0.5) {
            throw new RuntimeException("API call failed");
        }
        return "API call successful";
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### Scenario 3: Async Cache Loading

```java
public class AsyncCacheExample {

    private final ConcurrentHashMap<String, CompletableFuture<Object>> cache =
        new ConcurrentHashMap<>();

    // Get or compute cached value
    public <T> CompletableFuture<T> getOrCompute(String key,
            Supplier<CompletableFuture<T>> loader) {

        @SuppressWarnings("unchecked")
        CompletableFuture<T> future = (CompletableFuture<T>) cache.computeIfAbsent(
            key,
            k -> loader.get()
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        // Remove cache entry on load failure, allow retry
                        cache.remove(key);
                    }
                })
        );

        return future;
    }

    public static void main(String[] args) throws Exception {
        AsyncCacheExample asyncCache = new AsyncCacheExample();

        // First call - triggers actual loading
        CompletableFuture<String> future1 = asyncCache.getOrCompute(
            "user:1",
            () -> CompletableFuture.supplyAsync(() -> {
                System.out.println("Loading data...");
                sleep(1000);
                return "User 1 data";
            })
        );

        // Second call (same key) - reuses the first Future
        CompletableFuture<String> future2 = asyncCache.getOrCompute(
            "user:1",
            () -> CompletableFuture.supplyAsync(() -> {
                System.out.println("This line won't print");
                return "Won't execute";
            })
        );

        // Both Futures are the same object
        System.out.println("Same Future: " + (future1 == future2));
        System.out.println("Result: " + future1.get());
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### Scenario 4: Async Pipeline Processing

```java
public class PipelineExample {

    public static void main(String[] args) throws Exception {
        // Simulate order processing pipeline
        String orderId = "ORDER-12345";

        CompletableFuture<OrderResult> pipeline = validateOrder(orderId)
            .thenCompose(order -> checkInventory(order))
            .thenCompose(order -> processPayment(order))
            .thenCompose(order -> arrangeShipment(order))
            .thenApply(order -> {
                System.out.println("Order processing completed: " + order.status);
                return order;
            })
            .exceptionally(ex -> {
                System.out.println("Order processing failed: " + ex.getMessage());
                return new OrderResult(orderId, "FAILED", ex.getMessage());
            });

        OrderResult result = pipeline.get();
        System.out.println("Final status: " + result);
    }

    static CompletableFuture<OrderResult> validateOrder(String orderId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("1. Validating order...");
            sleep(100);
            return new OrderResult(orderId, "VALIDATED", null);
        });
    }

    static CompletableFuture<OrderResult> checkInventory(OrderResult order) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("2. Checking inventory...");
            sleep(150);
            // Simulate inventory check passed
            return new OrderResult(order.orderId, "INVENTORY_CHECKED", null);
        });
    }

    static CompletableFuture<OrderResult> processPayment(OrderResult order) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("3. Processing payment...");
            sleep(200);
            // Simulate payment successful
            return new OrderResult(order.orderId, "PAID", null);
        });
    }

    static CompletableFuture<OrderResult> arrangeShipment(OrderResult order) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("4. Arranging shipment...");
            sleep(100);
            return new OrderResult(order.orderId, "SHIPPED", null);
        });
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    static class OrderResult {
        String orderId;
        String status;
        String error;

        OrderResult(String orderId, String status, String error) {
            this.orderId = orderId;
            this.status = status;
            this.error = error;
        }

        @Override
        public String toString() {
            return "OrderResult{orderId='" + orderId +
                   "', status='" + status + "'}";
        }
    }
}
```

## Best Practices

### Use Custom Thread Pools

```java
public class ThreadPoolBestPractice {

    // Not recommended: Default uses ForkJoinPool.commonPool()
    // This thread pool is shared by all CompletableFutures, may cause resource contention

    // Recommended: Create dedicated thread pools for different types of tasks
    private static final ExecutorService cpuIntensivePool =
        Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors(),
            r -> new Thread(r, "cpu-pool-" + System.currentTimeMillis())
        );

    private static final ExecutorService ioIntensivePool =
        Executors.newCachedThreadPool(
            r -> new Thread(r, "io-pool-" + System.currentTimeMillis())
        );

    public static void main(String[] args) throws Exception {
        // CPU-intensive tasks use fixed-size thread pool
        CompletableFuture<Long> cpuTask = CompletableFuture.supplyAsync(() -> {
            return computeIntensiveTask();
        }, cpuIntensivePool);

        // IO-intensive tasks use elastic thread pool
        CompletableFuture<String> ioTask = CompletableFuture.supplyAsync(() -> {
            return callExternalService();
        }, ioIntensivePool);

        System.out.println("CPU task result: " + cpuTask.get());
        System.out.println("IO task result: " + ioTask.get());

        // Remember to shutdown thread pools
        cpuIntensivePool.shutdown();
        ioIntensivePool.shutdown();
    }

    static Long computeIntensiveTask() {
        // Simulate CPU-intensive computation
        long sum = 0;
        for (int i = 0; i < 1000000; i++) {
            sum += i;
        }
        return sum;
    }

    static String callExternalService() {
        // Simulate IO operation
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "Service response";
    }
}
```

### Avoid Blocking Operations

```java
public class AvoidBlockingExample {

    // Not recommended: Using blocking operations in callbacks
    public void badPractice() {
        CompletableFuture.supplyAsync(() -> "data")
            .thenApply(data -> {
                // Wrong! Calling get() in callback blocks thread pool threads
                return anotherFuture().get();
            });
    }

    // Recommended: Use thenCompose to chain async operations
    public void goodPractice() {
        CompletableFuture.supplyAsync(() -> "data")
            .thenCompose(data -> anotherFuture())
            .thenApply(result -> process(result));
    }

    private CompletableFuture<String> anotherFuture() {
        return CompletableFuture.supplyAsync(() -> "another result");
    }

    private String process(String data) {
        return data.toUpperCase();
    }
}
```

### Handle Exceptions Properly

```java
public class ExceptionHandlingBestPractice {

    public static void main(String[] args) {
        // Method 1: Use exceptionally to provide default value
        CompletableFuture<String> future1 = riskyOperation()
            .exceptionally(ex -> {
                log("Operation failed: " + ex.getMessage());
                return "Default value";
            });

        // Method 2: Use handle for unified handling
        CompletableFuture<Result<String>> future2 = riskyOperation()
            .handle((result, ex) -> {
                if (ex != null) {
                    return Result.failure(ex.getMessage());
                }
                return Result.success(result);
            });

        // Method 3: Use whenComplete to log without changing result
        CompletableFuture<String> future3 = riskyOperation()
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log("Operation failed, exception will propagate: " + ex.getMessage());
                } else {
                    log("Operation successful: " + result);
                }
            });
    }

    static CompletableFuture<String> riskyOperation() {
        return CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("Random failure");
            }
            return "Success";
        });
    }

    static void log(String message) {
        System.out.println("[LOG] " + message);
    }

    // Generic result wrapper class
    static class Result<T> {
        private final T value;
        private final String error;
        private final boolean success;

        private Result(T value, String error, boolean success) {
            this.value = value;
            this.error = error;
            this.success = success;
        }

        static <T> Result<T> success(T value) {
            return new Result<>(value, null, true);
        }

        static <T> Result<T> failure(String error) {
            return new Result<>(null, error, false);
        }
    }
}
```

### Use Timeouts Appropriately

```java
public class TimeoutBestPractice {

    public static void main(String[] args) {
        // Set reasonable timeouts for critical operations
        CompletableFuture<String> result = fetchDataWithTimeout()
            .orTimeout(5, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex.getCause() instanceof TimeoutException) {
                    // Log timeout, possibly trigger alert
                    System.out.println("Operation timed out, using fallback strategy");
                    return getFromCache();
                }
                return "Error: " + ex.getMessage();
            });

        System.out.println(result.join());
    }

    // For less critical operations, use completeOnTimeout
    public static CompletableFuture<List<String>> fetchOptionalData() {
        return fetchRecommendations()
            .completeOnTimeout(Collections.emptyList(), 2, TimeUnit.SECONDS);
    }

    static CompletableFuture<String> fetchDataWithTimeout() {
        return CompletableFuture.supplyAsync(() -> {
            sleep(3000);
            return "Remote data";
        });
    }

    static CompletableFuture<List<String>> fetchRecommendations() {
        return CompletableFuture.supplyAsync(() -> {
            sleep(3000);
            return Arrays.asList("Recommendation 1", "Recommendation 2");
        });
    }

    static String getFromCache() {
        return "Cached data";
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### Using join() vs get()

```java
public class JoinVsGetExample {

    public static void main(String[] args) {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "Result");

        // get() - Throws checked exceptions, must handle them
        try {
            String result1 = future.get();
            String result2 = future.get(5, TimeUnit.SECONDS); // With timeout
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            e.printStackTrace();
        }

        // join() - Throws unchecked CompletionException, cleaner code
        // Suitable for use in Streams and Lambdas
        String result3 = future.join();

        // Using join() in Stream is more convenient
        List<CompletableFuture<String>> futures = Arrays.asList(
            CompletableFuture.supplyAsync(() -> "a"),
            CompletableFuture.supplyAsync(() -> "b"),
            CompletableFuture.supplyAsync(() -> "c")
        );

        List<String> results = futures.stream()
            .map(CompletableFuture::join) // Using join(), cleaner code
            .collect(Collectors.toList());

        System.out.println(results);
    }
}
```

## Common Pitfalls

### Pitfall 1: Ignoring Return Values

```java
public class PitfallIgnoringReturnValue {

    public static void main(String[] args) throws Exception {
        // Wrong: Ignored the return value of thenApply
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "hello");
        future.thenApply(String::toUpperCase); // Returns a new Future, but it's ignored
        System.out.println(future.get()); // Outputs "hello", not "HELLO"

        // Correct: Use the returned new Future
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "hello");
        CompletableFuture<String> upperFuture = future2.thenApply(String::toUpperCase);
        System.out.println(upperFuture.get()); // Outputs "HELLO"
    }
}
```

### Pitfall 2: Swallowing Exceptions in Callbacks

```java
public class PitfallSwallowingException {

    public static void main(String[] args) throws Exception {
        // Wrong: Swallowing exception in callback
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                throw new RuntimeException("Error");
            } catch (Exception e) {
                return null; // Swallow exception, return null
            }
        });

        System.out.println(future.get()); // Outputs null, caller doesn't know an error occurred

        // Correct: Let exception propagate, use exceptionally to handle
        CompletableFuture<String> future2 = CompletableFuture
            .<String>supplyAsync(() -> {
                throw new RuntimeException("Error");
            })
            .exceptionally(ex -> {
                System.out.println("Caught exception: " + ex.getMessage());
                return "Default value"; // Explicit exception handling
            });

        System.out.println(future2.get()); // Outputs "Default value"
    }
}
```

### Pitfall 3: Shared Mutable State

```java
public class PitfallSharedMutableState {

    public static void main(String[] args) throws Exception {
        // Wrong: Multiple async tasks sharing mutable state
        List<String> results = new ArrayList<>(); // Not thread-safe

        CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> results.add("a")),
            CompletableFuture.runAsync(() -> results.add("b")),
            CompletableFuture.runAsync(() -> results.add("c"))
        ).get();

        System.out.println(results); // Result uncertain, may lose data

        // Correct: Use thread-safe collection or collect results
        List<CompletableFuture<String>> futures = Arrays.asList(
            CompletableFuture.supplyAsync(() -> "a"),
            CompletableFuture.supplyAsync(() -> "b"),
            CompletableFuture.supplyAsync(() -> "c")
        );

        List<String> safeResults = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());

        System.out.println(safeResults); // ["a", "b", "c"]
    }
}
```

## Summary

`CompletableFuture` is a powerful tool for asynchronous programming in Java, providing:

| Category | Main Methods | Purpose |
|---------|---------|------|
| Creation | `supplyAsync`, `runAsync`, `completedFuture` | Create async tasks |
| Transformation | `thenApply`, `thenCompose` | Transform results |
| Consumption | `thenAccept`, `thenRun` | Consume results |
| Combination | `thenCombine`, `allOf`, `anyOf` | Combine multiple Futures |
| Exception | `exceptionally`, `handle`, `whenComplete` | Exception handling |
| Timeout | `orTimeout`, `completeOnTimeout` | Timeout control |

**Key Points**:

1. Prefer `thenCompose` over nested `thenApply`
2. Use different thread pools for IO-intensive and CPU-intensive tasks
3. Always handle exceptions, avoid silent failures
4. Set reasonable timeouts for critical operations
5. Don't ignore return values in chained calls
6. Avoid sharing mutable state in async callbacks

Mastering `CompletableFuture` allows you to write efficient, readable, and maintainable async code, and is an essential skill for modern Java developers.
