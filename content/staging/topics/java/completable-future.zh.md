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
origin: old/src/content/docs/java/completable-future.zh.md
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

`CompletableFuture` 是 Java 8 引入的强大异步编程工具，它不仅实现了 `Future` 接口，还实现了 `CompletionStage` 接口，提供了丰富的函数式编程能力。本文将深入探讨 `CompletableFuture` 的各种用法和最佳实践。

## 为什么需要 CompletableFuture

在 Java 5 引入的 `Future` 接口存在以下局限性：

```java
// 传统 Future 的问题
ExecutorService executor = Executors.newFixedThreadPool(10);
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "结果";
});

// 问题1：get() 是阻塞的
String result = future.get(); // 必须等待结果

// 问题2：无法组合多个 Future
// 问题3：没有异常处理机制
// 问题4：无法手动完成
```

`CompletableFuture` 解决了这些问题，提供了：
- 非阻塞的回调机制
- 强大的组合能力
- 完善的异常处理
- 手动完成的能力

## 创建 CompletableFuture

### 基本创建方式

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureCreation {

    public static void main(String[] args) throws Exception {
        // 1. 创建一个已完成的 CompletableFuture
        CompletableFuture<String> completed = CompletableFuture.completedFuture("已完成的值");
        System.out.println(completed.get()); // 立即返回：已完成的值

        // 2. 创建一个失败的 CompletableFuture（Java 9+）
        CompletableFuture<String> failed = CompletableFuture.failedFuture(
            new RuntimeException("操作失败")
        );

        // 3. 创建空的 CompletableFuture，稍后手动完成
        CompletableFuture<String> manual = new CompletableFuture<>();

        // 在另一个线程中完成
        new Thread(() -> {
            try {
                Thread.sleep(500);
                manual.complete("手动完成的值");
            } catch (InterruptedException e) {
                manual.completeExceptionally(e);
            }
        }).start();

        System.out.println(manual.get()); // 等待并获取：手动完成的值
    }
}
```

### 使用工厂方法创建异步任务

```java
public class AsyncTaskCreation {

    private static final ExecutorService customExecutor =
        Executors.newFixedThreadPool(4);

    public static void main(String[] args) throws Exception {
        // 1. runAsync - 无返回值的异步任务
        CompletableFuture<Void> runFuture = CompletableFuture.runAsync(() -> {
            System.out.println("执行线程: " + Thread.currentThread().getName());
            // 执行一些操作，不返回结果
        });

        // 2. supplyAsync - 有返回值的异步任务（使用默认 ForkJoinPool）
        CompletableFuture<String> supplyFuture = CompletableFuture.supplyAsync(() -> {
            System.out.println("执行线程: " + Thread.currentThread().getName());
            return "异步计算的结果";
        });

        // 3. 使用自定义线程池
        CompletableFuture<Integer> customFuture = CompletableFuture.supplyAsync(() -> {
            System.out.println("自定义线程池: " + Thread.currentThread().getName());
            return 42;
        }, customExecutor);

        // 等待所有任务完成
        runFuture.join();
        System.out.println(supplyFuture.get());
        System.out.println(customFuture.get());

        customExecutor.shutdown();
    }
}
```

## 转换和处理结果

### thenApply - 同步转换

`thenApply` 用于对结果进行同步转换，类似于 Stream 的 `map` 操作。

```java
public class ThenApplyExample {

    public static void main(String[] args) throws Exception {
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "Hello")
            .thenApply(s -> s + " World")        // 转换1
            .thenApply(String::toUpperCase)      // 转换2
            .thenApply(s -> s + "!");            // 转换3

        System.out.println(future.get()); // HELLO WORLD!

        // thenApplyAsync - 在不同线程中执行转换
        CompletableFuture<Integer> asyncFuture = CompletableFuture
            .supplyAsync(() -> "12345")
            .thenApplyAsync(s -> {
                System.out.println("转换线程: " + Thread.currentThread().getName());
                return Integer.parseInt(s);
            })
            .thenApplyAsync(n -> n * 2);

        System.out.println(asyncFuture.get()); // 24690
    }
}
```

### thenAccept 和 thenRun - 消费结果

```java
public class ThenAcceptRunExample {

    public static void main(String[] args) throws Exception {
        // thenAccept - 消费结果，无返回值
        CompletableFuture<Void> acceptFuture = CompletableFuture
            .supplyAsync(() -> "处理结果")
            .thenAccept(result -> {
                System.out.println("收到结果: " + result);
                // 可以在这里保存到数据库、发送通知等
            });

        // thenRun - 不关心结果，只在完成后执行某个操作
        CompletableFuture<Void> runFuture = CompletableFuture
            .supplyAsync(() -> {
                // 执行某些计算
                return 100;
            })
            .thenRun(() -> {
                System.out.println("任务完成，执行清理工作");
            });

        acceptFuture.join();
        runFuture.join();
    }
}
```

### thenCompose - 扁平化组合（flatMap）

`thenCompose` 用于将嵌套的 `CompletableFuture` 扁平化，类似于 Stream 的 `flatMap`。

```java
public class ThenComposeExample {

    // 模拟根据用户ID获取用户信息
    static CompletableFuture<User> getUserById(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            // 模拟数据库查询
            return new User(userId, "张三", "zhangsan@example.com");
        });
    }

    // 模拟根据用户获取订单列表
    static CompletableFuture<List<Order>> getOrdersByUser(User user) {
        return CompletableFuture.supplyAsync(() -> {
            // 模拟数据库查询
            return Arrays.asList(
                new Order(1L, user.getId(), 100.0),
                new Order(2L, user.getId(), 200.0)
            );
        });
    }

    public static void main(String[] args) throws Exception {
        // 使用 thenApply 会导致嵌套 - 不推荐
        CompletableFuture<CompletableFuture<List<Order>>> nestedFuture =
            getUserById(1L).thenApply(user -> getOrdersByUser(user));

        // 使用 thenCompose 扁平化 - 推荐
        CompletableFuture<List<Order>> flatFuture =
            getUserById(1L).thenCompose(user -> getOrdersByUser(user));

        List<Order> orders = flatFuture.get();
        orders.forEach(System.out::println);
    }

    // 辅助类
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

## 组合多个 CompletableFuture

### thenCombine - 合并两个结果

```java
public class ThenCombineExample {

    public static void main(String[] args) throws Exception {
        // 模拟获取用户基本信息
        CompletableFuture<String> userInfoFuture = CompletableFuture.supplyAsync(() -> {
            sleep(100);
            return "用户: 张三";
        });

        // 模拟获取用户积分
        CompletableFuture<Integer> pointsFuture = CompletableFuture.supplyAsync(() -> {
            sleep(150);
            return 1500;
        });

        // 合并两个结果
        CompletableFuture<String> combinedFuture = userInfoFuture.thenCombine(
            pointsFuture,
            (userInfo, points) -> userInfo + ", 积分: " + points
        );

        System.out.println(combinedFuture.get()); // 用户: 张三, 积分: 1500

        // thenAcceptBoth - 消费两个结果，无返回值
        userInfoFuture.thenAcceptBoth(pointsFuture, (user, points) -> {
            System.out.println("发送邮件给 " + user + "，当前积分 " + points);
        });

        // runAfterBoth - 两个都完成后执行操作，不关心结果
        userInfoFuture.runAfterBoth(pointsFuture, () -> {
            System.out.println("两个查询都完成了");
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

### allOf - 等待所有完成

```java
public class AllOfExample {

    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();

        // 创建多个异步任务
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "任务1完成";
        });

        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "任务2完成";
        });

        CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> {
            sleep(1200);
            return "任务3完成";
        });

        // allOf 等待所有完成（返回 CompletableFuture<Void>）
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            future1, future2, future3
        );

        // 等待所有完成后，收集结果
        CompletableFuture<List<String>> resultsFuture = allFutures.thenApply(v -> {
            return Stream.of(future1, future2, future3)
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
        });

        List<String> results = resultsFuture.get();
        long end = System.currentTimeMillis();

        System.out.println("所有结果: " + results);
        System.out.println("总耗时: " + (end - start) + "ms"); // 约1200ms，并行执行
    }

    // 更通用的方法：并行执行并收集结果
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

### anyOf - 任意一个完成

```java
public class AnyOfExample {

    public static void main(String[] args) throws Exception {
        // 模拟多个数据源，使用最快返回的结果
        CompletableFuture<String> source1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "数据源1的结果";
        });

        CompletableFuture<String> source2 = CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return "数据源2的结果";
        });

        CompletableFuture<String> source3 = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "数据源3的结果";
        });

        // anyOf 返回第一个完成的结果（返回 Object 类型）
        CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(
            source1, source2, source3
        );

        Object result = anyFuture.get();
        System.out.println("最快的结果: " + result); // 数据源2的结果

        // applyToEither - 更类型安全的方式处理两个 Future
        CompletableFuture<String> eitherFuture = source1.applyToEither(
            source2,
            result2 -> "获得结果: " + result2
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

## 异常处理

### exceptionally - 处理异常并恢复

```java
public class ExceptionallyExample {

    public static void main(String[] args) throws Exception {
        // exceptionally - 捕获异常并返回默认值
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> {
                if (Math.random() > 0.5) {
                    throw new RuntimeException("模拟异常");
                }
                return "成功结果";
            })
            .exceptionally(ex -> {
                System.out.println("捕获异常: " + ex.getMessage());
                return "默认值"; // 返回备用值
            });

        System.out.println(future.get()); // 成功结果 或 默认值

        // 链式调用中的异常处理
        CompletableFuture<Integer> chainedFuture = CompletableFuture
            .supplyAsync(() -> "123abc")
            .thenApply(Integer::parseInt) // 这里会抛出 NumberFormatException
            .exceptionally(ex -> {
                System.out.println("解析失败: " + ex.getCause().getMessage());
                return 0; // 返回默认值
            });

        System.out.println(chainedFuture.get()); // 0
    }
}
```

### handle - 统一处理结果和异常

```java
public class HandleExample {

    public static void main(String[] args) throws Exception {
        // handle - 无论成功还是失败都会调用
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> {
                if (Math.random() > 0.5) {
                    throw new RuntimeException("处理失败");
                }
                return "处理成功";
            })
            .handle((result, ex) -> {
                if (ex != null) {
                    System.out.println("发生异常: " + ex.getMessage());
                    return "错误恢复值";
                }
                return result + " - 已处理";
            });

        System.out.println(future.get());

        // 与 exceptionally 的区别：handle 总是被调用
        CompletableFuture<String> future2 = CompletableFuture
            .supplyAsync(() -> "正常结果")
            .handle((result, ex) -> {
                // 即使没有异常，这里也会执行
                System.out.println("结果: " + result + ", 异常: " + ex);
                return result;
            });

        future2.get();
    }
}
```

### whenComplete - 观察结果（不改变结果）

```java
public class WhenCompleteExample {

    public static void main(String[] args) throws Exception {
        // whenComplete - 观察结果或异常，但不改变它们
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "计算结果")
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    System.out.println("记录错误: " + ex.getMessage());
                    // 可以在这里记录日志、发送告警等
                } else {
                    System.out.println("记录成功: " + result);
                }
                // 注意：这里不能改变结果
            });

        // 结果仍然是原始值
        System.out.println(future.get()); // 计算结果

        // 如果有异常，whenComplete 执行后异常仍会传播
        CompletableFuture<String> failedFuture = CompletableFuture
            .<String>supplyAsync(() -> {
                throw new RuntimeException("原始异常");
            })
            .whenComplete((result, ex) -> {
                System.out.println("观察到异常: " + ex.getMessage());
            });

        try {
            failedFuture.get();
        } catch (Exception e) {
            System.out.println("异常仍然传播: " + e.getCause().getMessage());
        }
    }
}
```

### 完整的异常处理示例

```java
public class ComprehensiveExceptionHandling {

    public static void main(String[] args) {
        // 实际场景：调用外部API，带有重试和降级
        String result = callExternalApiWithFallback("https://api.example.com/data");
        System.out.println("最终结果: " + result);
    }

    static String callExternalApiWithFallback(String url) {
        return CompletableFuture
            .supplyAsync(() -> callPrimaryApi(url))
            .handle((result, ex) -> {
                if (ex != null) {
                    System.out.println("主API失败，尝试备用API: " + ex.getMessage());
                    return callBackupApi(url);
                }
                return result;
            })
            .exceptionally(ex -> {
                System.out.println("所有API都失败，使用缓存: " + ex.getMessage());
                return getFromCache(url);
            })
            .join();
    }

    static String callPrimaryApi(String url) {
        // 模拟API调用
        throw new RuntimeException("主API不可用");
    }

    static String callBackupApi(String url) {
        // 模拟备用API调用
        throw new RuntimeException("备用API也不可用");
    }

    static String getFromCache(String url) {
        return "缓存的数据";
    }
}
```

## 超时处理

### orTimeout 和 completeOnTimeout（Java 9+）

```java
public class TimeoutExample {

    public static void main(String[] args) throws Exception {
        // orTimeout - 超时后抛出 TimeoutException
        CompletableFuture<String> future1 = CompletableFuture
            .supplyAsync(() -> {
                sleep(5000); // 模拟长时间操作
                return "结果";
            })
            .orTimeout(2, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex.getCause() instanceof TimeoutException) {
                    return "操作超时，返回默认值";
                }
                return "其他错误";
            });

        System.out.println(future1.get()); // 操作超时，返回默认值

        // completeOnTimeout - 超时后返回默认值（不抛异常）
        CompletableFuture<String> future2 = CompletableFuture
            .supplyAsync(() -> {
                sleep(5000);
                return "延迟的结果";
            })
            .completeOnTimeout("超时默认值", 2, TimeUnit.SECONDS);

        System.out.println(future2.get()); // 超时默认值
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

### Java 8 中的超时处理

```java
public class Java8TimeoutExample {

    private static final ScheduledExecutorService scheduler =
        Executors.newScheduledThreadPool(1);

    public static void main(String[] args) throws Exception {
        CompletableFuture<String> future = supplyAsyncWithTimeout(
            () -> {
                sleep(5000);
                return "结果";
            },
            2,
            TimeUnit.SECONDS,
            "超时默认值"
        );

        System.out.println(future.get()); // 超时默认值
        scheduler.shutdown();
    }

    // Java 8 兼容的超时方法
    public static <T> CompletableFuture<T> supplyAsyncWithTimeout(
            Supplier<T> supplier,
            long timeout,
            TimeUnit unit,
            T defaultValue) {

        CompletableFuture<T> future = CompletableFuture.supplyAsync(supplier);

        // 安排超时任务
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

## 实际应用场景

### 场景一：并行调用多个服务

```java
public class ParallelServiceCallExample {

    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();

        // 并行调用多个服务
        CompletableFuture<UserInfo> userFuture = getUserInfoAsync(1L);
        CompletableFuture<List<Order>> ordersFuture = getOrdersAsync(1L);
        CompletableFuture<List<Address>> addressesFuture = getAddressesAsync(1L);
        CompletableFuture<CreditInfo> creditFuture = getCreditInfoAsync(1L);

        // 等待所有完成并组装结果
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
        System.out.println("获取用户画像完成，耗时: " + (end - start) + "ms");
        System.out.println(profile);
    }

    // 模拟各个服务调用
    static CompletableFuture<UserInfo> getUserInfoAsync(Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(300);
            return new UserInfo(userId, "张三", "zhangsan@example.com");
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
            return Arrays.asList(new Address("北京市朝阳区"));
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

    // 辅助类定义
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

### 场景二：带重试的异步操作

```java
public class RetryExample {

    public static void main(String[] args) {
        String result = executeWithRetry(
            () -> callUnstableApi(),
            3,
            Duration.ofSeconds(1)
        ).join();

        System.out.println("最终结果: " + result);
    }

    // 带重试的异步执行
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

                System.out.println("操作失败，" + delay.toMillis() +
                    "ms后重试，剩余次数: " + maxRetries);

                sleep(delay.toMillis());
                return executeWithRetry(action, maxRetries - 1, delay);
            })
            .thenCompose(Function.identity());
    }

    static String callUnstableApi() {
        // 模拟不稳定的API（50%失败率）
        if (Math.random() > 0.5) {
            throw new RuntimeException("API调用失败");
        }
        return "API调用成功";
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

### 场景三：异步缓存加载

```java
public class AsyncCacheExample {

    private final ConcurrentHashMap<String, CompletableFuture<Object>> cache =
        new ConcurrentHashMap<>();

    // 获取或计算缓存值
    public <T> CompletableFuture<T> getOrCompute(String key,
            Supplier<CompletableFuture<T>> loader) {

        @SuppressWarnings("unchecked")
        CompletableFuture<T> future = (CompletableFuture<T>) cache.computeIfAbsent(
            key,
            k -> loader.get()
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        // 加载失败时移除缓存条目，允许重试
                        cache.remove(key);
                    }
                })
        );

        return future;
    }

    public static void main(String[] args) throws Exception {
        AsyncCacheExample asyncCache = new AsyncCacheExample();

        // 第一次调用 - 会触发实际加载
        CompletableFuture<String> future1 = asyncCache.getOrCompute(
            "user:1",
            () -> CompletableFuture.supplyAsync(() -> {
                System.out.println("正在加载数据...");
                sleep(1000);
                return "用户1的数据";
            })
        );

        // 第二次调用（同一个key） - 会复用第一次的Future
        CompletableFuture<String> future2 = asyncCache.getOrCompute(
            "user:1",
            () -> CompletableFuture.supplyAsync(() -> {
                System.out.println("这行不会打印");
                return "不会执行";
            })
        );

        // 两个Future是同一个对象
        System.out.println("是同一个Future: " + (future1 == future2));
        System.out.println("结果: " + future1.get());
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

### 场景四：异步流水线处理

```java
public class PipelineExample {

    public static void main(String[] args) throws Exception {
        // 模拟订单处理流水线
        String orderId = "ORDER-12345";

        CompletableFuture<OrderResult> pipeline = validateOrder(orderId)
            .thenCompose(order -> checkInventory(order))
            .thenCompose(order -> processPayment(order))
            .thenCompose(order -> arrangeShipment(order))
            .thenApply(order -> {
                System.out.println("订单处理完成: " + order.status);
                return order;
            })
            .exceptionally(ex -> {
                System.out.println("订单处理失败: " + ex.getMessage());
                return new OrderResult(orderId, "FAILED", ex.getMessage());
            });

        OrderResult result = pipeline.get();
        System.out.println("最终状态: " + result);
    }

    static CompletableFuture<OrderResult> validateOrder(String orderId) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("1. 验证订单...");
            sleep(100);
            return new OrderResult(orderId, "VALIDATED", null);
        });
    }

    static CompletableFuture<OrderResult> checkInventory(OrderResult order) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("2. 检查库存...");
            sleep(150);
            // 模拟库存检查通过
            return new OrderResult(order.orderId, "INVENTORY_CHECKED", null);
        });
    }

    static CompletableFuture<OrderResult> processPayment(OrderResult order) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("3. 处理支付...");
            sleep(200);
            // 模拟支付成功
            return new OrderResult(order.orderId, "PAID", null);
        });
    }

    static CompletableFuture<OrderResult> arrangeShipment(OrderResult order) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("4. 安排发货...");
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

## 最佳实践

### 使用自定义线程池

```java
public class ThreadPoolBestPractice {

    // 不推荐：默认使用 ForkJoinPool.commonPool()
    // 这个线程池被所有 CompletableFuture 共享，可能导致资源竞争

    // 推荐：为不同类型的任务创建专用线程池
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
        // CPU密集型任务使用固定大小线程池
        CompletableFuture<Long> cpuTask = CompletableFuture.supplyAsync(() -> {
            return computeIntensiveTask();
        }, cpuIntensivePool);

        // IO密集型任务使用弹性线程池
        CompletableFuture<String> ioTask = CompletableFuture.supplyAsync(() -> {
            return callExternalService();
        }, ioIntensivePool);

        System.out.println("CPU任务结果: " + cpuTask.get());
        System.out.println("IO任务结果: " + ioTask.get());

        // 记得关闭线程池
        cpuIntensivePool.shutdown();
        ioIntensivePool.shutdown();
    }

    static Long computeIntensiveTask() {
        // 模拟CPU密集型计算
        long sum = 0;
        for (int i = 0; i < 1000000; i++) {
            sum += i;
        }
        return sum;
    }

    static String callExternalService() {
        // 模拟IO操作
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "服务响应";
    }
}
```

### 避免阻塞操作

```java
public class AvoidBlockingExample {

    // 不推荐：在回调中使用阻塞操作
    public void badPractice() {
        CompletableFuture.supplyAsync(() -> "data")
            .thenApply(data -> {
                // 错误！在回调中调用 get() 会阻塞线程池中的线程
                return anotherFuture().get();
            });
    }

    // 推荐：使用 thenCompose 链接异步操作
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

### 正确处理异常

```java
public class ExceptionHandlingBestPractice {

    public static void main(String[] args) {
        // 方式1：使用 exceptionally 提供默认值
        CompletableFuture<String> future1 = riskyOperation()
            .exceptionally(ex -> {
                log("操作失败: " + ex.getMessage());
                return "默认值";
            });

        // 方式2：使用 handle 统一处理
        CompletableFuture<Result<String>> future2 = riskyOperation()
            .handle((result, ex) -> {
                if (ex != null) {
                    return Result.failure(ex.getMessage());
                }
                return Result.success(result);
            });

        // 方式3：使用 whenComplete 记录日志但不改变结果
        CompletableFuture<String> future3 = riskyOperation()
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log("操作失败，将传播异常: " + ex.getMessage());
                } else {
                    log("操作成功: " + result);
                }
            });
    }

    static CompletableFuture<String> riskyOperation() {
        return CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("随机失败");
            }
            return "成功";
        });
    }

    static void log(String message) {
        System.out.println("[LOG] " + message);
    }

    // 通用结果包装类
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

### 合理使用超时

```java
public class TimeoutBestPractice {

    public static void main(String[] args) {
        // 为关键操作设置合理的超时时间
        CompletableFuture<String> result = fetchDataWithTimeout()
            .orTimeout(5, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex.getCause() instanceof TimeoutException) {
                    // 记录超时，可能触发告警
                    System.out.println("操作超时，使用降级策略");
                    return getFromCache();
                }
                return "错误: " + ex.getMessage();
            });

        System.out.println(result.join());
    }

    // 对于不那么关键的操作，使用 completeOnTimeout
    public static CompletableFuture<List<String>> fetchOptionalData() {
        return fetchRecommendations()
            .completeOnTimeout(Collections.emptyList(), 2, TimeUnit.SECONDS);
    }

    static CompletableFuture<String> fetchDataWithTimeout() {
        return CompletableFuture.supplyAsync(() -> {
            sleep(3000);
            return "远程数据";
        });
    }

    static CompletableFuture<List<String>> fetchRecommendations() {
        return CompletableFuture.supplyAsync(() -> {
            sleep(3000);
            return Arrays.asList("推荐1", "推荐2");
        });
    }

    static String getFromCache() {
        return "缓存数据";
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

### 使用 join() vs get()

```java
public class JoinVsGetExample {

    public static void main(String[] args) {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "结果");

        // get() - 抛出受检异常，必须处理
        try {
            String result1 = future.get();
            String result2 = future.get(5, TimeUnit.SECONDS); // 带超时
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            e.printStackTrace();
        }

        // join() - 抛出非受检异常 CompletionException，代码更简洁
        // 适合在 Stream 和 Lambda 中使用
        String result3 = future.join();

        // 在 Stream 中使用 join() 更方便
        List<CompletableFuture<String>> futures = Arrays.asList(
            CompletableFuture.supplyAsync(() -> "a"),
            CompletableFuture.supplyAsync(() -> "b"),
            CompletableFuture.supplyAsync(() -> "c")
        );

        List<String> results = futures.stream()
            .map(CompletableFuture::join) // 使用 join()，代码简洁
            .collect(Collectors.toList());

        System.out.println(results);
    }
}
```

## 常见陷阱

### 陷阱一：忽略返回值

```java
public class PitfallIgnoringReturnValue {

    public static void main(String[] args) throws Exception {
        // 错误：忽略了 thenApply 的返回值
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "hello");
        future.thenApply(String::toUpperCase); // 返回新的 Future，但被忽略了
        System.out.println(future.get()); // 输出 "hello"，不是 "HELLO"

        // 正确：使用返回的新 Future
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "hello");
        CompletableFuture<String> upperFuture = future2.thenApply(String::toUpperCase);
        System.out.println(upperFuture.get()); // 输出 "HELLO"
    }
}
```

### 陷阱二：在回调中捕获异常

```java
public class PitfallSwallowingException {

    public static void main(String[] args) throws Exception {
        // 错误：在回调中吞掉异常
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                throw new RuntimeException("错误");
            } catch (Exception e) {
                return null; // 吞掉异常，返回 null
            }
        });

        System.out.println(future.get()); // 输出 null，调用者不知道发生了错误

        // 正确：让异常传播，使用 exceptionally 处理
        CompletableFuture<String> future2 = CompletableFuture
            .<String>supplyAsync(() -> {
                throw new RuntimeException("错误");
            })
            .exceptionally(ex -> {
                System.out.println("捕获到异常: " + ex.getMessage());
                return "默认值"; // 明确的异常处理
            });

        System.out.println(future2.get()); // 输出 "默认值"
    }
}
```

### 陷阱三：共享可变状态

```java
public class PitfallSharedMutableState {

    public static void main(String[] args) throws Exception {
        // 错误：多个异步任务共享可变状态
        List<String> results = new ArrayList<>(); // 非线程安全

        CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> results.add("a")),
            CompletableFuture.runAsync(() -> results.add("b")),
            CompletableFuture.runAsync(() -> results.add("c"))
        ).get();

        System.out.println(results); // 结果不确定，可能丢失数据

        // 正确：使用线程安全的集合或收集结果
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

## 总结

`CompletableFuture` 是 Java 中进行异步编程的强大工具，它提供了：

| 功能类别 | 主要方法 | 用途 |
|---------|---------|------|
| 创建 | `supplyAsync`, `runAsync`, `completedFuture` | 创建异步任务 |
| 转换 | `thenApply`, `thenCompose` | 转换结果 |
| 消费 | `thenAccept`, `thenRun` | 消费结果 |
| 组合 | `thenCombine`, `allOf`, `anyOf` | 组合多个Future |
| 异常 | `exceptionally`, `handle`, `whenComplete` | 异常处理 |
| 超时 | `orTimeout`, `completeOnTimeout` | 超时控制 |

**关键要点**：

1. 优先使用 `thenCompose` 而非嵌套的 `thenApply`
2. 为 IO 密集型和 CPU 密集型任务使用不同的线程池
3. 始终处理异常，避免静默失败
4. 为关键操作设置合理的超时时间
5. 注意不要忽略链式调用的返回值
6. 避免在异步回调中共享可变状态

掌握 `CompletableFuture` 可以让你编写出高效、可读、易维护的异步代码，是现代 Java 开发者必备的技能。
