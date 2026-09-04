---
title: 虚拟线程
description: Java虚拟线程完全指南，Project Loom、轻量级并发与高吞吐量应用
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 虚拟线程
  - Project Loom
  - 并发
status: imported
origin: old/src/content/docs/java/virtual-threads.zh.md
divergence: 0.291
issues: []
legacy:
  category: Java
  subcategory: 并发编程
  order: 11
  lastUpdated: 2026-01-07
---

虚拟线程（Virtual Threads）是 Java 21 引入的一项革命性特性，它源自 Project Loom 项目，彻底改变了 Java 平台的并发编程模型。虚拟线程使得编写高吞吐量、易于理解和维护的并发应用程序成为可能。

---

## 什么是虚拟线程

### 概述

虚拟线程是由 JVM 管理的轻量级线程，而不是由操作系统管理的平台线程。它们的设计目标是简化并发编程，同时大幅提高应用程序的可扩展性。

在传统的 Java 线程模型中，每个 `java.lang.Thread` 实例都对应一个操作系统线程。这种 1:1 的映射关系意味着线程是一种昂贵的资源：创建成本高、内存占用大、上下文切换开销显著。而虚拟线程打破了这种限制，使用 M:N 调度模型，让数百万个虚拟线程可以映射到少量的平台线程上。

### 核心特点

```java
// 虚拟线程的核心优势一览
public class VirtualThreadFeatures {
    public static void main(String[] args) throws InterruptedException {
        // 1. 轻量级：可以创建数百万个虚拟线程
        long startTime = System.currentTimeMillis();

        Thread[] threads = new Thread[1_000_000];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = Thread.startVirtualThread(() -> {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 等待所有线程完成
        for (Thread thread : threads) {
            thread.join();
        }

        long endTime = System.currentTimeMillis();
        System.out.println("创建并运行 100 万个虚拟线程耗时: " +
            (endTime - startTime) + "ms");
    }
}
```

**虚拟线程的主要优势：**

| 特性 | 说明 |
|------|------|
| **轻量级** | 每个虚拟线程仅占用约 1KB 内存，而平台线程需要 1-2MB |
| **创建成本低** | 创建虚拟线程几乎没有开销，可以按需创建 |
| **简单性** | 使用传统的阻塞式编程模型，无需学习响应式编程 |
| **兼容性** | 与现有的 Java 并发 API 完全兼容 |
| **高吞吐量** | 特别适合 I/O 密集型任务 |

### Project Loom 背景

Project Loom 是 OpenJDK 的一个项目，旨在为 Java 平台引入轻量级并发抽象。其核心目标是：

1. **降低并发编程的复杂性**：让开发者使用简单的同步代码风格编写高并发应用
2. **提高可扩展性**：使 Java 应用能够处理更多的并发任务
3. **保持兼容性**：不破坏现有代码，让虚拟线程成为平台线程的直接替代

虚拟线程在 Java 19 中作为预览功能引入，并在 Java 21 中正式成为稳定特性。

---

## 虚拟线程与平台线程对比

### 基本概念对比

```java
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class ThreadComparison {
    private static final int TASK_COUNT = 100_000;
    private static final AtomicInteger completedTasks = new AtomicInteger(0);

    public static void main(String[] args) throws Exception {
        System.out.println("===== 平台线程 vs 虚拟线程性能对比 =====\n");

        // 测试虚拟线程
        testVirtualThreads();

        // 重置计数器
        completedTasks.set(0);

        // 测试平台线程（使用线程池）
        testPlatformThreads();
    }

    private static void testVirtualThreads() throws Exception {
        Instant start = Instant.now();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TASK_COUNT; i++) {
                executor.submit(() -> {
                    simulateIOOperation();
                    completedTasks.incrementAndGet();
                });
            }
        }

        Instant end = Instant.now();
        System.out.println("虚拟线程完成 " + TASK_COUNT + " 个任务");
        System.out.println("耗时: " + Duration.between(start, end).toMillis() + "ms");
        System.out.println("完成任务数: " + completedTasks.get() + "\n");
    }

    private static void testPlatformThreads() throws Exception {
        Instant start = Instant.now();

        // 平台线程池通常限制在几百个线程
        try (var executor = Executors.newFixedThreadPool(200)) {
            for (int i = 0; i < TASK_COUNT; i++) {
                executor.submit(() -> {
                    simulateIOOperation();
                    completedTasks.incrementAndGet();
                });
            }
        }

        Instant end = Instant.now();
        System.out.println("平台线程（200 线程池）完成 " + TASK_COUNT + " 个任务");
        System.out.println("耗时: " + Duration.between(start, end).toMillis() + "ms");
        System.out.println("完成任务数: " + completedTasks.get());
    }

    private static void simulateIOOperation() {
        try {
            // 模拟 I/O 操作，如数据库查询或 HTTP 请求
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### 详细对比表

| 维度 | 平台线程 | 虚拟线程 |
|------|---------|---------|
| **内存占用** | 约 1-2 MB/线程 | 约 1 KB/线程 |
| **创建成本** | 高（涉及 OS 调用） | 极低（JVM 内部操作） |
| **上下文切换** | 由 OS 管理，成本高 | 由 JVM 管理，成本低 |
| **最大数量** | 受限（通常几千个） | 几乎无限（数百万） |
| **调度** | OS 调度器 | JVM 调度器 |
| **栈大小** | 固定（默认 1MB） | 动态增长 |
| **适用场景** | CPU 密集型 | I/O 密集型 |
| **阻塞代价** | 高（浪费 OS 线程） | 低（仅暂停虚拟线程） |

### 调度模型差异

```java
/**
 * 演示虚拟线程的 M:N 调度模型
 * 多个虚拟线程映射到少量的载体（Carrier）线程
 */
public class SchedulingModelDemo {
    public static void main(String[] args) throws InterruptedException {
        System.out.println("CPU 核心数: " + Runtime.getRuntime().availableProcessors());
        System.out.println("载体线程数默认等于 CPU 核心数\n");

        // 创建多个虚拟线程，观察它们运行在哪些载体线程上
        for (int i = 0; i < 20; i++) {
            int taskId = i;
            Thread.startVirtualThread(() -> {
                // 获取当前虚拟线程信息
                Thread current = Thread.currentThread();
                System.out.printf("虚拟线程 %d: %s, 是否虚拟: %b%n",
                    taskId,
                    current.getName(),
                    current.isVirtual());

                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        Thread.sleep(2000); // 等待所有虚拟线程完成
    }
}
```

---

## 创建和使用虚拟线程

### 方法一：Thread.startVirtualThread()

最简单的创建方式，直接启动一个虚拟线程：

```java
public class CreateVirtualThread1 {
    public static void main(String[] args) throws InterruptedException {
        // 创建并立即启动虚拟线程
        Thread vThread = Thread.startVirtualThread(() -> {
            System.out.println("虚拟线程正在运行");
            System.out.println("线程名称: " + Thread.currentThread().getName());
            System.out.println("是否为虚拟线程: " + Thread.currentThread().isVirtual());
        });

        // 等待虚拟线程完成
        vThread.join();
        System.out.println("虚拟线程已完成");
    }
}
```

### 方法二：Thread.ofVirtual() 构建器

使用构建器模式创建虚拟线程，可以设置更多属性：

```java
public class CreateVirtualThread2 {
    public static void main(String[] args) throws InterruptedException {
        // 使用构建器创建虚拟线程
        Thread.Builder builder = Thread.ofVirtual()
            .name("my-virtual-thread-", 0); // 名称前缀和起始编号

        // 创建多个虚拟线程
        for (int i = 0; i < 5; i++) {
            Thread vThread = builder.start(() -> {
                System.out.println("运行中: " + Thread.currentThread().getName());
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 创建未启动的虚拟线程
        Thread unstarted = Thread.ofVirtual()
            .name("unstarted-vthread")
            .unstarted(() -> {
                System.out.println("这个线程稍后启动");
            });

        // 稍后手动启动
        Thread.sleep(500);
        unstarted.start();
        unstarted.join();
    }
}
```

### 方法三：Executors.newVirtualThreadPerTaskExecutor()

推荐的方式，适合任务密集型场景：

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.ArrayList;
import java.util.List;

public class CreateVirtualThread3 {
    public static void main(String[] args) throws Exception {
        List<Future<String>> futures = new ArrayList<>();

        // 使用 try-with-resources 自动管理执行器生命周期
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // 提交多个任务
            for (int i = 0; i < 1000; i++) {
                int taskId = i;
                Future<String> future = executor.submit(() -> {
                    // 模拟 I/O 操作
                    Thread.sleep(100);
                    return "任务 " + taskId + " 完成";
                });
                futures.add(future);
            }

            // 收集所有结果
            int successCount = 0;
            for (Future<String> future : futures) {
                String result = future.get();
                successCount++;
            }

            System.out.println("成功完成 " + successCount + " 个任务");
        } // executor 自动关闭并等待所有任务完成
    }
}
```

### 方法四：使用 ThreadFactory

通过工厂模式创建虚拟线程：

```java
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CreateVirtualThread4 {
    public static void main(String[] args) throws InterruptedException {
        // 创建虚拟线程工厂
        ThreadFactory factory = Thread.ofVirtual()
            .name("worker-", 0)
            .factory();

        // 使用工厂创建线程
        Thread t1 = factory.newThread(() -> {
            System.out.println("工厂创建的线程: " + Thread.currentThread().getName());
        });
        t1.start();

        Thread t2 = factory.newThread(() -> {
            System.out.println("工厂创建的线程: " + Thread.currentThread().getName());
        });
        t2.start();

        t1.join();
        t2.join();

        // 将工厂用于自定义执行器
        ExecutorService customExecutor = Executors.newThreadPerTaskExecutor(factory);
        try (customExecutor) {
            customExecutor.submit(() -> {
                System.out.println("自定义执行器中的线程: " + Thread.currentThread().getName());
            });
        }
    }
}
```

---

## 虚拟线程的工作原理

### 载体线程与挂载/卸载

虚拟线程运行在称为"载体线程"（Carrier Thread）的平台线程上。当虚拟线程执行阻塞操作时，它会从载体线程上"卸载"（unmount），让载体线程可以执行其他虚拟线程。

```java
/**
 * 演示虚拟线程的挂载/卸载机制
 */
public class MountUnmountDemo {
    public static void main(String[] args) throws InterruptedException {
        // 创建多个虚拟线程，观察调度行为
        for (int i = 0; i < 10; i++) {
            int id = i;
            Thread.startVirtualThread(() -> {
                System.out.printf("[%d] 开始执行，载体线程可能是某个 ForkJoinPool 线程%n", id);

                try {
                    // 阻塞操作触发卸载
                    Thread.sleep(100);
                    // 唤醒后可能在不同的载体线程上
                    System.out.printf("[%d] 恢复执行%n", id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        Thread.sleep(2000);
    }
}
```

### 调度器架构

```
┌─────────────────────────────────────────────────────────────┐
│                       应用程序代码                            │
├─────────────────────────────────────────────────────────────┤
│                      虚拟线程层                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ... ┌─────────┐       │
│  │ VThread │ │ VThread │ │ VThread │     │ VThread │       │
│  │   #1    │ │   #2    │ │   #3    │     │   #N    │       │
│  └────┬────┘ └────┬────┘ └────┬────┘     └────┬────┘       │
├───────┼──────────┼──────────┼──────────────┼───────────────┤
│       │          │          │              │               │
│       ▼          ▼          ▼              ▼               │
│                    JVM 调度器                               │
│              (ForkJoinPool 调度器)                          │
├─────────────────────────────────────────────────────────────┤
│                     载体线程层                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Carrier │ │ Carrier │ │ Carrier │ │ Carrier │           │
│  │   #1    │ │   #2    │ │   #3    │ │   #4    │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
├───────┼──────────┼──────────┼──────────┼───────────────────┤
│       ▼          ▼          ▼          ▼                   │
│                   操作系统调度器                             │
│                    (OS Threads)                             │
└─────────────────────────────────────────────────────────────┘
```

### 阻塞操作处理

当虚拟线程执行阻塞操作时：

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * 虚拟线程处理阻塞操作的示例
 */
public class BlockingOperationDemo {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        // 创建 1000 个并发请求
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                int requestId = i;
                executor.submit(() -> {
                    try {
                        HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create("https://httpbin.org/delay/1"))
                            .GET()
                            .build();

                        // 此阻塞调用会触发虚拟线程卸载
                        // 载体线程可以执行其他虚拟线程
                        HttpResponse<String> response = client.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                        );

                        System.out.printf("请求 %d 完成，状态码: %d%n",
                            requestId, response.statusCode());
                    } catch (Exception e) {
                        System.err.printf("请求 %d 失败: %s%n", requestId, e.getMessage());
                    }
                });
            }
        }
    }
}
```

### 固定（Pinning）问题

在某些情况下，虚拟线程无法从载体线程上卸载，这称为"固定"（Pinning）：

```java
import java.util.concurrent.locks.ReentrantLock;

/**
 * 演示虚拟线程的固定问题及解决方案
 */
public class PinningDemo {
    private final Object monitor = new Object();
    private final ReentrantLock lock = new ReentrantLock();

    // 问题场景：在 synchronized 块中执行阻塞操作会导致固定
    public void problematicMethod() {
        synchronized (monitor) {
            try {
                // 这会导致虚拟线程固定到载体线程
                // 载体线程被阻塞，无法执行其他虚拟线程
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // 解决方案：使用 ReentrantLock 替代 synchronized
    public void betterMethod() {
        lock.lock();
        try {
            // 使用 ReentrantLock 时，虚拟线程可以正常卸载
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    // 另一种方案：将阻塞操作移出 synchronized 块
    public void alternativeMethod() {
        Object data;
        synchronized (monitor) {
            // 快速的同步操作
            data = getData();
        }
        // 阻塞操作在 synchronized 外执行
        processDataWithBlocking(data);
    }

    private Object getData() { return new Object(); }
    private void processDataWithBlocking(Object data) {
        try { Thread.sleep(1000); } catch (InterruptedException e) {}
    }

    public static void main(String[] args) {
        PinningDemo demo = new PinningDemo();

        // 测试两种方法的性能差异
        System.out.println("测试 synchronized 方法（可能有固定问题）:");
        testMethod(demo::problematicMethod);

        System.out.println("\n测试 ReentrantLock 方法（无固定问题）:");
        testMethod(demo::betterMethod);
    }

    private static void testMethod(Runnable method) {
        long start = System.currentTimeMillis();

        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100; i++) {
                executor.submit(method);
            }
        }

        long end = System.currentTimeMillis();
        System.out.println("耗时: " + (end - start) + "ms");
    }
}
```

---

## 结构化并发

结构化并发（Structured Concurrency）是与虚拟线程配合使用的重要特性，它将多个并发任务视为一个工作单元，简化错误处理和任务取消。

### 基本概念

结构化并发的核心思想是：子任务的生命周期不能超过父任务。这就像函数调用不能比调用它的函数存活更久一样。

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.Future;

/**
 * 结构化并发基础示例
 */
public class StructuredConcurrencyBasics {

    record UserData(String profile, String orders, String preferences) {}

    public static void main(String[] args) {
        try {
            UserData userData = fetchUserData(12345);
            System.out.println("用户数据: " + userData);
        } catch (Exception e) {
            System.err.println("获取用户数据失败: " + e.getMessage());
        }
    }

    /**
     * 并行获取用户的多种数据
     */
    static UserData fetchUserData(int userId) throws Exception {
        // 使用 StructuredTaskScope.ShutdownOnFailure 策略
        // 任何子任务失败都会取消其他任务
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // 并行执行三个子任务
            Future<String> profileFuture = scope.fork(() -> fetchProfile(userId));
            Future<String> ordersFuture = scope.fork(() -> fetchOrders(userId));
            Future<String> prefsFuture = scope.fork(() -> fetchPreferences(userId));

            // 等待所有任务完成或任一失败
            scope.join();

            // 如果有任务失败，抛出异常
            scope.throwIfFailed();

            // 所有任务成功，组合结果
            return new UserData(
                profileFuture.resultNow(),
                ordersFuture.resultNow(),
                prefsFuture.resultNow()
            );
        }
    }

    static String fetchProfile(int userId) throws InterruptedException {
        Thread.sleep(100);
        return "用户" + userId + "的个人资料";
    }

    static String fetchOrders(int userId) throws InterruptedException {
        Thread.sleep(150);
        return "用户" + userId + "的订单历史";
    }

    static String fetchPreferences(int userId) throws InterruptedException {
        Thread.sleep(80);
        return "用户" + userId + "的偏好设置";
    }
}
```

### ShutdownOnSuccess 策略

当只需要第一个成功的结果时使用：

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Subtask;

/**
 * 竞速模式：返回最快的成功结果
 */
public class ShutdownOnSuccessDemo {

    public static void main(String[] args) {
        try {
            String result = fetchFromFastestSource();
            System.out.println("最快响应: " + result);
        } catch (Exception e) {
            System.err.println("所有数据源都失败: " + e.getMessage());
        }
    }

    /**
     * 从多个数据源并行获取数据，返回最快响应的结果
     */
    static String fetchFromFastestSource() throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {

            // 从多个数据源并行获取
            scope.fork(() -> fetchFromPrimaryDB());
            scope.fork(() -> fetchFromReplicaDB());
            scope.fork(() -> fetchFromCache());

            // 等待第一个成功的结果
            scope.join();

            // 返回最快的成功结果
            return scope.result();
        }
    }

    static String fetchFromPrimaryDB() throws InterruptedException {
        Thread.sleep(200);
        return "来自主数据库的数据";
    }

    static String fetchFromReplicaDB() throws InterruptedException {
        Thread.sleep(150);
        return "来自副本数据库的数据";
    }

    static String fetchFromCache() throws InterruptedException {
        Thread.sleep(50);
        return "来自缓存的数据";
    }
}
```

### 使用 Joiner 自定义完成策略（Java 25+）

从 Java 25 开始，`StructuredTaskScope` 的 API 发生了重大变化，使用静态工厂方法和 `Joiner` 接口：

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Joiner;
import java.util.concurrent.StructuredTaskScope.Subtask;
import java.util.List;
import java.util.stream.Stream;

/**
 * Java 25+ 新 API 示例
 * 注意：此代码需要 Java 25 或更高版本，并启用预览功能
 */
public class JoinerDemo {

    public static void main(String[] args) throws Exception {
        // 示例 1：收集所有结果（包括失败的）
        collectAllResults();

        // 示例 2：至少 N 个成功
        anyNSuccessful();
    }

    /**
     * 使用 open() 工厂方法创建作用域
     */
    static void collectAllResults() throws Exception {
        // 使用默认的 all-or-fail 策略
        try (var scope = StructuredTaskScope.open(Joiner.allSuccessfulOrThrow())) {

            Subtask<String> task1 = scope.fork(() -> "结果1");
            Subtask<String> task2 = scope.fork(() -> "结果2");
            Subtask<String> task3 = scope.fork(() -> "结果3");

            scope.join();

            // 获取所有结果
            System.out.println(task1.get());
            System.out.println(task2.get());
            System.out.println(task3.get());
        }
    }

    /**
     * 使用自定义 Joiner 实现至少 N 个成功的策略
     */
    static void anyNSuccessful() throws Exception {
        // anySuccessfulResultOrThrow 返回第一个成功结果
        try (var scope = StructuredTaskScope.open(Joiner.anySuccessfulResultOrThrow())) {

            scope.fork(() -> {
                Thread.sleep(200);
                return "慢任务";
            });

            scope.fork(() -> {
                Thread.sleep(50);
                return "快任务";
            });

            String result = scope.join();
            System.out.println("获得结果: " + result);
        }
    }
}
```

### 超时控制

```java
import java.util.concurrent.StructuredTaskScope;
import java.time.Duration;
import java.time.Instant;

/**
 * 结构化并发中的超时控制
 */
public class TimeoutDemo {

    public static void main(String[] args) {
        try {
            String result = fetchWithTimeout();
            System.out.println("结果: " + result);
        } catch (Exception e) {
            System.err.println("操作超时或失败: " + e.getMessage());
        }
    }

    static String fetchWithTimeout() throws Exception {
        Instant deadline = Instant.now().plusSeconds(2);

        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {

            scope.fork(() -> {
                Thread.sleep(1000);
                return "快速任务完成";
            });

            scope.fork(() -> {
                Thread.sleep(5000);
                return "慢速任务完成";
            });

            // 使用 joinUntil 设置超时
            scope.joinUntil(deadline);

            return scope.result();
        }
    }
}
```

### 错误处理与取消

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.Future;

/**
 * 结构化并发中的错误处理
 */
public class ErrorHandlingDemo {

    public static void main(String[] args) {
        System.out.println("===== 场景1: 快速失败 =====");
        failFastScenario();

        System.out.println("\n===== 场景2: 收集部分成功 =====");
        collectPartialSuccess();
    }

    /**
     * 快速失败：任一子任务失败立即终止
     */
    static void failFastScenario() {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            Future<String> task1 = scope.fork(() -> {
                Thread.sleep(100);
                return "任务1成功";
            });

            Future<String> task2 = scope.fork(() -> {
                Thread.sleep(50);
                throw new RuntimeException("任务2失败！");
            });

            Future<String> task3 = scope.fork(() -> {
                Thread.sleep(200);
                return "任务3成功";
            });

            scope.join();

            // 检查是否有失败
            try {
                scope.throwIfFailed();
                System.out.println("所有任务成功");
            } catch (Exception e) {
                System.out.println("检测到失败: " + e.getCause().getMessage());
                // 此时 task3 可能已被取消
                System.out.println("任务1状态: " + task1.state());
                System.out.println("任务2状态: " + task2.state());
                System.out.println("任务3状态: " + task3.state());
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 收集部分成功的结果
     */
    static void collectPartialSuccess() {
        try (var scope = new StructuredTaskScope<String>()) {

            Future<String> task1 = scope.fork(() -> {
                Thread.sleep(100);
                return "结果1";
            });

            Future<String> task2 = scope.fork(() -> {
                Thread.sleep(50);
                throw new RuntimeException("任务2失败");
            });

            Future<String> task3 = scope.fork(() -> {
                Thread.sleep(150);
                return "结果3";
            });

            // 等待所有任务完成（成功或失败）
            scope.join();

            // 检查每个任务的状态
            if (task1.state() == Future.State.SUCCESS) {
                System.out.println("任务1: " + task1.resultNow());
            }

            if (task2.state() == Future.State.FAILED) {
                System.out.println("任务2失败: " + task2.exceptionNow().getMessage());
            }

            if (task3.state() == Future.State.SUCCESS) {
                System.out.println("任务3: " + task3.resultNow());
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

## 作用域值 ScopedValue

`ScopedValue` 是 Java 21 引入的新特性（预览），用于在线程内和子线程间安全地共享不可变数据，是 `ThreadLocal` 的现代替代方案。

### 为什么需要 ScopedValue

```java
import java.util.concurrent.Executors;

/**
 * ThreadLocal 在虚拟线程环境下的问题
 */
public class ThreadLocalProblems {
    // ThreadLocal 的问题
    private static final ThreadLocal<String> USER_ID = new ThreadLocal<>();

    public static void main(String[] args) throws Exception {
        // 问题1：内存占用
        // 如果创建 100 万个虚拟线程，每个都有 ThreadLocal
        // 会消耗大量内存

        // 问题2：生命周期管理
        // 必须手动清理，否则可能导致内存泄漏

        // 问题3：子线程继承
        // InheritableThreadLocal 在虚拟线程中可能不符合预期

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            USER_ID.set("user-123");

            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> {
                    // 子虚拟线程无法访问父线程的 ThreadLocal
                    String userId = USER_ID.get(); // 可能是 null
                    System.out.println("用户ID: " + userId);
                });
            }
        } finally {
            USER_ID.remove(); // 必须手动清理
        }
    }
}
```

### ScopedValue 基础使用

```java
import jdk.incubator.concurrent.ScopedValue;
import java.util.concurrent.StructuredTaskScope;

/**
 * ScopedValue 基础示例
 * 注意：需要 --enable-preview 和 --add-modules jdk.incubator.concurrent
 */
public class ScopedValueBasics {

    // 声明 ScopedValue（通常是 static final）
    private static final ScopedValue<String> CURRENT_USER = ScopedValue.newInstance();
    private static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();

    public static void main(String[] args) {
        // 绑定值并在作用域内执行
        ScopedValue.where(CURRENT_USER, "user-123")
            .where(TRACE_ID, "trace-abc")
            .run(() -> {
                handleRequest();
            });
    }

    static void handleRequest() {
        // 在调用链中的任何位置都可以读取
        String user = CURRENT_USER.get();
        String traceId = TRACE_ID.get();

        System.out.println("处理请求 - 用户: " + user + ", 追踪ID: " + traceId);

        // 调用其他方法
        processOrder();
        sendNotification();
    }

    static void processOrder() {
        // 无需传参，直接读取
        System.out.println("处理订单 - 用户: " + CURRENT_USER.get());
    }

    static void sendNotification() {
        System.out.println("发送通知 - 追踪ID: " + TRACE_ID.get());
    }
}
```

### ScopedValue 与结构化并发结合

```java
import jdk.incubator.concurrent.ScopedValue;
import java.util.concurrent.StructuredTaskScope;

/**
 * ScopedValue 在结构化并发中的使用
 */
public class ScopedValueWithStructuredConcurrency {

    private static final ScopedValue<RequestContext> REQUEST_CONTEXT = ScopedValue.newInstance();

    record RequestContext(String userId, String traceId, long timestamp) {}

    public static void main(String[] args) throws Exception {
        RequestContext ctx = new RequestContext("user-456", "trace-xyz", System.currentTimeMillis());

        ScopedValue.where(REQUEST_CONTEXT, ctx).call(() -> {
            return handleComplexRequest();
        });
    }

    static String handleComplexRequest() throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // 子任务自动继承 ScopedValue 绑定
            var profileTask = scope.fork(() -> {
                // 可以访问 REQUEST_CONTEXT
                RequestContext ctx = REQUEST_CONTEXT.get();
                System.out.println("获取用户资料，追踪ID: " + ctx.traceId());
                return "用户资料数据";
            });

            var ordersTask = scope.fork(() -> {
                RequestContext ctx = REQUEST_CONTEXT.get();
                System.out.println("获取订单历史，追踪ID: " + ctx.traceId());
                return "订单历史数据";
            });

            scope.join();
            scope.throwIfFailed();

            return profileTask.resultNow() + " + " + ordersTask.resultNow();
        }
    }
}
```

### 使用 Record 组合多个值

```java
import jdk.incubator.concurrent.ScopedValue;

/**
 * 推荐：使用 Record 组合多个相关值
 * 这样只需要一个 ScopedValue，更高效
 */
public class ScopedValueWithRecord {

    // 将相关值组合到一个 Record 中
    record SecurityContext(
        String userId,
        String[] roles,
        String authToken,
        long expiresAt
    ) {
        boolean hasRole(String role) {
            for (String r : roles) {
                if (r.equals(role)) return true;
            }
            return false;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    private static final ScopedValue<SecurityContext> SECURITY_CONTEXT = ScopedValue.newInstance();

    public static void main(String[] args) {
        SecurityContext ctx = new SecurityContext(
            "user-789",
            new String[]{"USER", "ADMIN"},
            "jwt-token-xxx",
            System.currentTimeMillis() + 3600_000
        );

        ScopedValue.where(SECURITY_CONTEXT, ctx).run(() -> {
            if (checkAccess()) {
                performAdminAction();
            }
        });
    }

    static boolean checkAccess() {
        SecurityContext ctx = SECURITY_CONTEXT.get();
        return !ctx.isExpired() && ctx.hasRole("ADMIN");
    }

    static void performAdminAction() {
        SecurityContext ctx = SECURITY_CONTEXT.get();
        System.out.println("用户 " + ctx.userId() + " 执行管理员操作");
    }
}
```

### ScopedValue vs ThreadLocal 对比

| 特性 | ThreadLocal | ScopedValue |
|------|-------------|-------------|
| 可变性 | 可变 | 不可变（绑定后不能修改） |
| 生命周期 | 需手动清理 | 自动随作用域结束 |
| 继承 | InheritableThreadLocal 继承 | 自动继承到 fork 的子任务 |
| 内存效率 | 每线程一份拷贝 | 共享不可变值 |
| 线程安全 | 需要额外同步 | 天然线程安全 |
| 适用场景 | 传统线程 | 虚拟线程和结构化并发 |

---

## 最佳实践与注意事项

### 何时使用虚拟线程

```java
/**
 * 虚拟线程使用场景指南
 */
public class WhenToUseVirtualThreads {

    // 适合使用虚拟线程的场景
    public void ioIntensiveScenarios() {
        // 1. HTTP 请求处理
        // 2. 数据库查询
        // 3. 文件读写
        // 4. 网络通信
        // 5. 消息队列消费
        // 6. 微服务调用

        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            // I/O 密集型任务
            executor.submit(() -> makeHttpRequest());
            executor.submit(() -> queryDatabase());
            executor.submit(() -> readFile());
        }
    }

    // 不适合使用虚拟线程的场景
    public void cpuIntensiveScenarios() {
        // 1. 复杂数学计算
        // 2. 加密/解密
        // 3. 图像/视频处理
        // 4. 数据压缩
        // 5. 机器学习推理

        // 使用平台线程池
        int cpuCores = Runtime.getRuntime().availableProcessors();
        try (var executor = java.util.concurrent.Executors.newFixedThreadPool(cpuCores)) {
            executor.submit(() -> complexCalculation());
            executor.submit(() -> encryptData());
            executor.submit(() -> processImage());
        }
    }

    private void makeHttpRequest() {}
    private void queryDatabase() {}
    private void readFile() {}
    private void complexCalculation() {}
    private void encryptData() {}
    private void processImage() {}
}
```

### 避免虚拟线程池化

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 虚拟线程池化是反模式
 */
public class AvoidPoolingVirtualThreads {

    // 错误：为虚拟线程创建固定大小的池
    public void badPractice() {
        // 这违背了虚拟线程的设计初衷
        // 虚拟线程非常轻量，不需要池化
        ExecutorService badExecutor = Executors.newFixedThreadPool(
            100,
            Thread.ofVirtual().factory()
        );
        // 不要这样做！
    }

    // 正确：每个任务一个虚拟线程
    public void goodPractice() {
        // 按需创建虚拟线程
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100000; i++) {
                executor.submit(() -> handleTask());
            }
        }
        // 创建 10 万个虚拟线程完全没问题
    }

    // 正确：直接创建虚拟线程
    public void alsoGoodPractice() {
        for (int i = 0; i < 1000; i++) {
            Thread.startVirtualThread(() -> handleTask());
        }
    }

    private void handleTask() {
        try { Thread.sleep(100); } catch (InterruptedException e) {}
    }
}
```

### 处理固定问题

```java
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.locks.Lock;

/**
 * 避免虚拟线程固定的最佳实践
 */
public class AvoidPinning {

    // 场景 1：使用 ReentrantLock 替代 synchronized
    private final Lock lock = new ReentrantLock();

    public void preferReentrantLock() {
        lock.lock();
        try {
            // 阻塞操作，虚拟线程可以正常卸载
            performBlockingOperation();
        } finally {
            lock.unlock();
        }
    }

    // 场景 2：最小化同步块范围
    private final Object monitor = new Object();

    public void minimizeSynchronizedScope() {
        Object data;
        synchronized (monitor) {
            // 只在同步块中执行必要的操作
            data = getSharedData();
        }
        // 阻塞操作在同步块外执行
        processData(data);
    }

    // 场景 3：避免在 native 方法调用期间阻塞
    public void avoidNativeBlocking() {
        // 某些 native 方法可能导致固定
        // 尽量使用纯 Java 实现或确保 native 调用快速返回
    }

    // 检测固定问题
    // 使用 JVM 参数: -Djdk.tracePinnedThreads=full
    // 或在代码中使用 JFR 监控

    private void performBlockingOperation() {
        try { Thread.sleep(100); } catch (InterruptedException e) {}
    }

    private Object getSharedData() { return new Object(); }
    private void processData(Object data) {}
}
```

### ThreadLocal 迁移

```java
import jdk.incubator.concurrent.ScopedValue;
import java.util.concurrent.Executors;

/**
 * 从 ThreadLocal 迁移到 ScopedValue
 */
public class ThreadLocalMigration {

    // 迁移前：ThreadLocal
    private static final ThreadLocal<String> USER_CONTEXT_OLD = new ThreadLocal<>();

    // 迁移后：ScopedValue
    private static final ScopedValue<String> USER_CONTEXT_NEW = ScopedValue.newInstance();

    // 旧代码
    public void oldApproach() {
        try {
            USER_CONTEXT_OLD.set("user-123");
            handleRequest();
        } finally {
            USER_CONTEXT_OLD.remove(); // 必须手动清理
        }
    }

    // 新代码
    public void newApproach() {
        ScopedValue.where(USER_CONTEXT_NEW, "user-123").run(() -> {
            handleRequest();
        });
        // 无需手动清理，自动随作用域结束
    }

    private void handleRequest() {}

    // 迁移策略
    public void migrationStrategy() {
        /*
         * 1. 识别 ThreadLocal 使用场景
         *    - 请求上下文
         *    - 用户身份
         *    - 事务上下文
         *    - 追踪信息
         *
         * 2. 评估是否需要可变性
         *    - 如果值在请求期间不变，使用 ScopedValue
         *    - 如果需要修改，考虑重新绑定或使用其他方案
         *
         * 3. 逐步迁移
         *    - 先在新代码中使用 ScopedValue
         *    - 逐步重构旧代码
         *
         * 4. 处理 InheritableThreadLocal
         *    - 在结构化并发中，ScopedValue 自动继承
         */
    }
}
```

### 资源管理

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 虚拟线程资源管理最佳实践
 */
public class ResourceManagement {

    // 正确：使用 try-with-resources
    public void properResourceManagement() {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> processTask());
            }
        } // 自动等待所有任务完成并关闭执行器
    }

    // 正确：手动关闭
    public void manualShutdown() {
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        try {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> processTask());
            }
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                    if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                        System.err.println("执行器未能正常关闭");
                    }
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    // 处理中断
    public void handleInterruption() {
        Thread.startVirtualThread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    processTask();
                } catch (Exception e) {
                    // 检查是否因中断导致
                    if (Thread.currentThread().isInterrupted()) {
                        System.out.println("线程被中断，正在清理...");
                        cleanup();
                        break;
                    }
                }
            }
        });
    }

    private void processTask() {}
    private void cleanup() {}
}
```

---

## 迁移指南

### 从传统线程池迁移

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantLock;
import java.util.concurrent.locks.Lock;

/**
 * 从传统线程池迁移到虚拟线程
 */
public class MigrationGuide {

    // ============ 迁移前 ============

    private final ExecutorService legacyExecutor = Executors.newFixedThreadPool(200);
    private final Object legacyLock = new Object();

    public void legacyCode() {
        for (int i = 0; i < 10000; i++) {
            legacyExecutor.submit(() -> {
                synchronized (legacyLock) {
                    try {
                        Thread.sleep(100); // I/O 操作
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }
    }

    // ============ 迁移后 ============

    private final Lock modernLock = new ReentrantLock();

    public void modernCode() {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10000; i++) {
                executor.submit(() -> {
                    modernLock.lock();
                    try {
                        Thread.sleep(100); // I/O 操作
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        modernLock.unlock();
                    }
                });
            }
        }
    }
}
```

### 渐进式迁移策略

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 渐进式迁移策略
 */
public class GradualMigration {

    // 阶段 1：保持现有代码，添加虚拟线程支持
    private final ExecutorService platformExecutor = Executors.newFixedThreadPool(100);
    private final ExecutorService virtualExecutor = Executors.newVirtualThreadPerTaskExecutor();

    public void phase1_hybridApproach() {
        // CPU 密集型任务继续使用平台线程
        platformExecutor.submit(() -> cpuIntensiveTask());

        // I/O 密集型任务使用虚拟线程
        virtualExecutor.submit(() -> ioIntensiveTask());
    }

    // 阶段 2：抽象执行器选择
    public void phase2_abstractExecutorChoice(boolean isIOBound) {
        ExecutorService executor = isIOBound ? virtualExecutor : platformExecutor;
        executor.submit(() -> processTask(isIOBound));
    }

    // 阶段 3：全面迁移 I/O 密集型代码
    public void phase3_fullMigration() {
        // 所有 I/O 密集型服务使用虚拟线程
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // HTTP 请求处理
            executor.submit(() -> handleHttpRequest());

            // 数据库操作
            executor.submit(() -> queryDatabase());

            // 外部服务调用
            executor.submit(() -> callExternalService());
        }
    }

    // 阶段 4：采用结构化并发
    public void phase4_structuredConcurrency() throws Exception {
        try (var scope = new java.util.concurrent.StructuredTaskScope.ShutdownOnFailure()) {
            var userTask = scope.fork(() -> fetchUser());
            var ordersTask = scope.fork(() -> fetchOrders());

            scope.join();
            scope.throwIfFailed();

            combineResults(userTask.resultNow(), ordersTask.resultNow());
        }
    }

    private void cpuIntensiveTask() {}
    private void ioIntensiveTask() {}
    private void processTask(boolean isIOBound) {}
    private void handleHttpRequest() {}
    private void queryDatabase() {}
    private void callExternalService() {}
    private String fetchUser() { return "user"; }
    private String fetchOrders() { return "orders"; }
    private void combineResults(String user, String orders) {}
}
```

### 迁移检查清单

```java
/**
 * 迁移到虚拟线程的检查清单
 */
public class MigrationChecklist {

    /*
     * [ ] 1. 识别 I/O 密集型代码
     *     - HTTP 客户端调用
     *     - 数据库访问
     *     - 文件操作
     *     - 消息队列操作
     *
     * [ ] 2. 检查同步代码
     *     - 将 synchronized 替换为 ReentrantLock
     *     - 最小化同步块范围
     *     - 避免在同步块中执行阻塞操作
     *
     * [ ] 3. 审查 ThreadLocal 使用
     *     - 评估是否可以迁移到 ScopedValue
     *     - 检查 InheritableThreadLocal 使用
     *
     * [ ] 4. 更新执行器配置
     *     - 替换 newFixedThreadPool 为 newVirtualThreadPerTaskExecutor
     *     - 移除不必要的线程池大小限制
     *
     * [ ] 5. 验证第三方库兼容性
     *     - 数据库驱动（JDBC 兼容）
     *     - HTTP 客户端
     *     - 框架（Spring Boot 3.2+ 支持虚拟线程）
     *
     * [ ] 6. 更新监控和调试工具
     *     - 配置 JFR 监控虚拟线程
     *     - 更新线程 dump 分析工具
     *
     * [ ] 7. 性能测试
     *     - 基准测试对比
     *     - 负载测试
     *     - 检查固定问题
     *
     * [ ] 8. 逐步部署
     *     - 先在非关键服务上线
     *     - 监控指标变化
     *     - 逐步扩大范围
     */
}
```

---

## 实战案例

### 案例一：高并发 Web 服务器

```java
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.concurrent.StructuredTaskScope;

/**
 * 使用虚拟线程的高并发 Web 服务器
 */
public class VirtualThreadWebServer {

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // 使用虚拟线程执行器处理请求
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        // 注册处理器
        server.createContext("/api/user", VirtualThreadWebServer::handleUserRequest);
        server.createContext("/api/dashboard", VirtualThreadWebServer::handleDashboardRequest);

        server.start();
        System.out.println("服务器启动在 http://localhost:8080");
        System.out.println("使用虚拟线程处理所有请求");
    }

    /**
     * 处理用户请求 - 简单场景
     */
    private static void handleUserRequest(HttpExchange exchange) throws IOException {
        try {
            String userId = extractUserId(exchange);

            // 模拟数据库查询
            Thread.sleep(50);
            String userData = "{\"id\": \"" + userId + "\", \"name\": \"张三\"}";

            sendResponse(exchange, 200, userData);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            sendResponse(exchange, 500, "{\"error\": \"处理中断\"}");
        }
    }

    /**
     * 处理仪表板请求 - 使用结构化并发聚合多个数据源
     */
    private static void handleDashboardRequest(HttpExchange exchange) throws IOException {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // 并行获取多个数据
            var statsTask = scope.fork(() -> fetchStatistics());
            var alertsTask = scope.fork(() -> fetchAlerts());
            var recentTask = scope.fork(() -> fetchRecentActivity());

            scope.join();
            scope.throwIfFailed();

            // 组合结果
            String response = String.format(
                "{\"stats\": %s, \"alerts\": %s, \"recent\": %s}",
                statsTask.resultNow(),
                alertsTask.resultNow(),
                recentTask.resultNow()
            );

            sendResponse(exchange, 200, response);

        } catch (Exception e) {
            sendResponse(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    private static String extractUserId(HttpExchange exchange) {
        String query = exchange.getRequestURI().getQuery();
        if (query != null && query.startsWith("id=")) {
            return query.substring(3);
        }
        return "unknown";
    }

    private static String fetchStatistics() throws InterruptedException {
        Thread.sleep(100);
        return "{\"users\": 1000, \"orders\": 500}";
    }

    private static String fetchAlerts() throws InterruptedException {
        Thread.sleep(80);
        return "[{\"type\": \"warning\", \"message\": \"CPU 使用率高\"}]";
    }

    private static String fetchRecentActivity() throws InterruptedException {
        Thread.sleep(120);
        return "[{\"action\": \"login\", \"user\": \"user1\"}]";
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response)
            throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        byte[] responseBytes = response.getBytes("UTF-8");
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBytes);
        }
    }
}
```

### 案例二：批量数据处理

```java
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.Duration;
import java.time.Instant;

/**
 * 使用虚拟线程进行批量数据处理
 */
public class BatchDataProcessor {

    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger failCount = new AtomicInteger(0);

    public static void main(String[] args) throws Exception {
        BatchDataProcessor processor = new BatchDataProcessor();

        // 生成测试数据
        List<DataItem> items = generateTestData(10000);

        // 处理数据
        processor.processBatch(items);
    }

    /**
     * 批量处理数据项
     */
    public void processBatch(List<DataItem> items) throws Exception {
        Instant start = Instant.now();
        List<Future<ProcessResult>> futures = new ArrayList<>();

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // 提交所有处理任务
            for (DataItem item : items) {
                Future<ProcessResult> future = executor.submit(() -> processItem(item));
                futures.add(future);
            }

            // 收集结果
            for (Future<ProcessResult> future : futures) {
                try {
                    ProcessResult result = future.get();
                    if (result.success()) {
                        successCount.incrementAndGet();
                    } else {
                        failCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failCount.incrementAndGet();
                }
            }
        }

        Instant end = Instant.now();

        System.out.println("===== 批量处理完成 =====");
        System.out.println("总数据量: " + items.size());
        System.out.println("成功: " + successCount.get());
        System.out.println("失败: " + failCount.get());
        System.out.println("总耗时: " + Duration.between(start, end).toMillis() + "ms");
    }

    /**
     * 处理单个数据项
     */
    private ProcessResult processItem(DataItem item) {
        try {
            // 模拟验证
            Thread.sleep(10);
            if (!validateItem(item)) {
                return new ProcessResult(item.id(), false, "验证失败");
            }

            // 模拟转换
            Thread.sleep(20);
            String transformed = transformItem(item);

            // 模拟存储
            Thread.sleep(30);
            saveItem(item.id(), transformed);

            return new ProcessResult(item.id(), true, "处理成功");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new ProcessResult(item.id(), false, "处理中断");
        } catch (Exception e) {
            return new ProcessResult(item.id(), false, e.getMessage());
        }
    }

    private boolean validateItem(DataItem item) {
        return item.value() > 0;
    }

    private String transformItem(DataItem item) {
        return "PROCESSED_" + item.value();
    }

    private void saveItem(int id, String data) {
        // 模拟数据库保存
    }

    private static List<DataItem> generateTestData(int count) {
        List<DataItem> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            items.add(new DataItem(i, (int)(Math.random() * 1000)));
        }
        return items;
    }

    record DataItem(int id, int value) {}
    record ProcessResult(int itemId, boolean success, String message) {}
}
```

### 案例三：微服务聚合网关

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.Executors;

/**
 * 微服务聚合网关 - 使用虚拟线程和结构化并发
 */
public class AggregationGateway {

    private final HttpClient httpClient;

    public AggregationGateway() {
        // 创建使用虚拟线程的 HTTP 客户端
        this.httpClient = HttpClient.newBuilder()
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    /**
     * 聚合用户完整信息
     */
    public UserProfile aggregateUserProfile(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // 并行调用多个微服务
            var basicInfoTask = scope.fork(() ->
                callService("http://user-service/users/" + userId));

            var ordersTask = scope.fork(() ->
                callService("http://order-service/users/" + userId + "/orders"));

            var preferencesTask = scope.fork(() ->
                callService("http://preference-service/users/" + userId));

            var loyaltyTask = scope.fork(() ->
                callService("http://loyalty-service/users/" + userId + "/points"));

            // 设置超时
            scope.joinUntil(java.time.Instant.now().plusSeconds(5));
            scope.throwIfFailed();

            // 组合结果
            return new UserProfile(
                basicInfoTask.resultNow(),
                ordersTask.resultNow(),
                preferencesTask.resultNow(),
                loyaltyTask.resultNow()
            );
        }
    }

    /**
     * 带降级的聚合
     */
    public UserProfileWithFallback aggregateWithFallback(String userId) throws Exception {
        try (var scope = new StructuredTaskScope<ServiceResponse>()) {

            var basicInfoTask = scope.fork(() ->
                callServiceSafe("http://user-service/users/" + userId, "{}"));

            var ordersTask = scope.fork(() ->
                callServiceSafe("http://order-service/users/" + userId + "/orders", "[]"));

            var preferencesTask = scope.fork(() ->
                callServiceSafe("http://preference-service/users/" + userId, "{}"));

            scope.join();

            // 即使部分服务失败也返回结果
            return new UserProfileWithFallback(
                getResultOrDefault(basicInfoTask, "{}"),
                getResultOrDefault(ordersTask, "[]"),
                getResultOrDefault(preferencesTask, "{}")
            );
        }
    }

    /**
     * 竞速模式 - 从多个副本获取数据
     */
    public String fetchFromReplicas(String resourcePath) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {

            // 同时请求多个副本
            scope.fork(() -> callService("http://replica1.example.com" + resourcePath));
            scope.fork(() -> callService("http://replica2.example.com" + resourcePath));
            scope.fork(() -> callService("http://replica3.example.com" + resourcePath));

            scope.join();

            // 返回最快响应的结果
            return scope.result();
        }
    }

    private String callService(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .timeout(Duration.ofSeconds(5))
            .build();

        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new RuntimeException("服务调用失败: " + response.statusCode());
        }

        return response.body();
    }

    private ServiceResponse callServiceSafe(String url, String fallback) {
        try {
            String result = callService(url);
            return new ServiceResponse(true, result);
        } catch (Exception e) {
            return new ServiceResponse(false, fallback);
        }
    }

    private String getResultOrDefault(
            java.util.concurrent.Future<ServiceResponse> task,
            String defaultValue) {
        try {
            ServiceResponse response = task.resultNow();
            return response.success() ? response.data() : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    record UserProfile(String basicInfo, String orders, String preferences, String loyalty) {}
    record UserProfileWithFallback(String basicInfo, String orders, String preferences) {}
    record ServiceResponse(boolean success, String data) {}
}
```

---

## 监控与调试

### JFR 监控虚拟线程

```java
import jdk.jfr.consumer.RecordingStream;
import java.time.Duration;

/**
 * 使用 Java Flight Recorder 监控虚拟线程
 */
public class VirtualThreadMonitoring {

    public static void main(String[] args) throws Exception {
        // 启动 JFR 监控
        startMonitoring();

        // 运行虚拟线程任务
        runVirtualThreadTasks();

        Thread.sleep(10000);
    }

    /**
     * 配置 JFR 监控虚拟线程事件
     */
    public static void startMonitoring() {
        RecordingStream rs = new RecordingStream();

        // 启用虚拟线程相关事件
        rs.enable("jdk.VirtualThreadStart");
        rs.enable("jdk.VirtualThreadEnd");
        rs.enable("jdk.VirtualThreadPinned").withThreshold(Duration.ofMillis(20));
        rs.enable("jdk.VirtualThreadSubmitFailed");

        // 监听虚拟线程开始事件
        rs.onEvent("jdk.VirtualThreadStart", event -> {
            System.out.println("虚拟线程启动: " + event.getLong("javaThreadId"));
        });

        // 监听虚拟线程固定事件（重要！）
        rs.onEvent("jdk.VirtualThreadPinned", event -> {
            System.out.println("=== 检测到虚拟线程固定 ===");
            System.out.println("线程ID: " + event.getLong("javaThreadId"));
            System.out.println("载体线程: " + event.getString("carrierThread"));
            System.out.println("固定原因: " + event.getString("pinnedReason"));
            // 这可能是性能问题的征兆
        });

        rs.startAsync();
    }

    /**
     * 运行测试任务
     */
    public static void runVirtualThreadTasks() {
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100; i++) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
        }
    }
}
```

### 检测固定问题

使用 JVM 参数启用固定诊断：

```bash
# 打印固定堆栈跟踪
java -Djdk.tracePinnedThreads=full MyApplication

# 简短输出
java -Djdk.tracePinnedThreads=short MyApplication
```

### 线程 Dump 分析

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;

/**
 * 分析虚拟线程状态
 */
public class ThreadDumpAnalysis {

    public static void main(String[] args) {
        // 创建一些虚拟线程
        for (int i = 0; i < 10; i++) {
            Thread.startVirtualThread(() -> {
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 打印线程信息
        printThreadInfo();
    }

    public static void printThreadInfo() {
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();

        System.out.println("===== 线程信息 =====\n");

        for (long threadId : threadMXBean.getAllThreadIds()) {
            ThreadInfo info = threadMXBean.getThreadInfo(threadId);
            if (info != null) {
                System.out.printf("线程: %s (ID: %d)%n",
                    info.getThreadName(),
                    info.getThreadId());
                System.out.printf("状态: %s%n", info.getThreadState());
                System.out.println();
            }
        }

        // 注意：ThreadMXBean 主要显示平台线程
        // 对于虚拟线程的完整视图，使用 JSON 线程 dump
        System.out.println("提示: 使用 jcmd <pid> Thread.dump_to_file 获取完整的线程 dump");
    }
}
```

### JSON 格式线程 Dump（推荐）

```bash
# 获取 JSON 格式的线程 dump，包含虚拟线程层次结构
jcmd <pid> Thread.dump_to_file -format=json threads.json
```

JSON 格式的线程 dump 会显示 `StructuredTaskScope` 如何组织线程层次结构，便于理解虚拟线程之间的父子关系。

### 性能调优建议

```java
/**
 * 虚拟线程性能调优指南
 */
public class PerformanceTuning {

    /*
     * 1. 调整载体线程数量
     *
     * 默认情况下，载体线程数等于 CPU 核心数。
     * 可以通过系统属性调整：
     *
     * -Djdk.virtualThreadScheduler.parallelism=N
     * -Djdk.virtualThreadScheduler.maxPoolSize=N
     */

    /*
     * 2. 避免固定
     *
     * - 使用 ReentrantLock 替代 synchronized
     * - 最小化同步块范围
     * - 监控 jdk.VirtualThreadPinned 事件
     */

    /*
     * 3. 合理使用结构化并发
     *
     * - 为相关任务使用 StructuredTaskScope
     * - 设置合理的超时
     * - 正确处理取消
     */

    /*
     * 4. 迁移 ThreadLocal
     *
     * - 在虚拟线程中优先使用 ScopedValue
     * - 避免在 ThreadLocal 中存储大对象
     */

    /*
     * 5. I/O 优化
     *
     * - 确保使用的库支持虚拟线程
     * - 某些旧版本的 JDBC 驱动可能不兼容
     * - 使用 JDK 21+ 的 HTTP 客户端
     */

    /*
     * 6. 监控关键指标
     *
     * - 虚拟线程创建数量
     * - 固定事件频率
     * - 载体线程利用率
     * - 任务完成时间
     */
}
```

---

## 总结

### 核心要点

1. **虚拟线程是轻量级线程**：由 JVM 管理，创建成本极低，可以创建数百万个

2. **适用于 I/O 密集型场景**：网络请求、数据库查询、文件操作等

3. **保持简单的编程模型**：使用熟悉的阻塞式代码，无需学习响应式编程

4. **结构化并发提升代码质量**：更好的错误处理、取消管理和可观测性

5. **ScopedValue 替代 ThreadLocal**：更安全、更高效的上下文传递

6. **注意固定问题**：使用 `ReentrantLock` 替代 `synchronized`，避免在同步块中阻塞

### 迁移建议

```
传统并发代码
    ↓
识别 I/O 密集型部分
    ↓
替换 synchronized 为 ReentrantLock
    ↓
替换线程池为 newVirtualThreadPerTaskExecutor()
    ↓
采用结构化并发组织相关任务
    ↓
迁移 ThreadLocal 到 ScopedValue
    ↓
监控和性能调优
```

### 展望

虚拟线程和结构化并发代表了 Java 并发编程的未来方向。随着这些特性在 JDK 中的稳定和完善，Java 开发者将能够以更简单、更安全的方式编写高性能并发应用程序。

结构化并发预计在 Java 26 中稳定，届时这些工具将成为构建高吞吐量应用的标准选择。建议尽早在非关键系统中实践这些技术，为全面采用做好准备。

---

## 参考资源

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 453: Structured Concurrency (Preview)](https://openjdk.org/jeps/453)
- [JEP 506: Scoped Values](https://openjdk.org/jeps/506)
- [Project Loom and Virtual Threads - Inside.java](https://inside.java/2025/02/22/devoxxbelgium-loom-next/)
- [Java Virtual Threads Best Practices](https://developers.redhat.com/articles/2023/10/03/beyond-loom-weaving-new-concurrency-patterns)
