---
title: Java 线程池
description: 深入理解 Java 线程池：Executor 框架、ThreadPoolExecutor 核心参数、ScheduledExecutorService、拒绝策略与最佳实践
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 线程池
  - 并发
  - ThreadPoolExecutor
  - Executor
status: imported
origin: old/src/content/docs/java/thread-pool.zh.md
divergence: 0.209
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: 并发编程
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是线程池

线程池（Thread Pool）是一种基于池化思想管理线程的工具。它预先创建一定数量的线程，放入池中等待任务到来，当有任务需要执行时，从池中取出一个空闲线程来执行，执行完成后线程不会销毁而是返回池中等待下一个任务。

### 为什么需要线程池

在传统的多线程编程中，每当需要执行一个任务时就创建一个新线程，任务完成后销毁线程。这种方式存在以下问题：

1. **线程创建开销大**：创建线程需要分配内存、初始化线程栈等操作，开销较大
2. **资源消耗严重**：每个线程都需要占用一定的内存空间（默认约 1MB 栈空间）
3. **系统不稳定**：无限制创建线程可能导致系统资源耗尽，影响系统稳定性
4. **响应速度慢**：每次创建新线程都需要时间，影响任务的响应速度

### 线程池的优势

- **降低资源消耗**：通过复用已创建的线程降低线程创建和销毁的开销
- **提高响应速度**：任务到达时可以直接使用已有线程，无需等待线程创建
- **提高线程可管理性**：线程是稀缺资源，线程池可以统一管理、分配和监控
- **提供更多功能**：线程池可以提供定时执行、并发控制等功能

### 历史背景

Java 5（JDK 1.5）引入了 `java.util.concurrent` 包，其中包含了 Executor 框架，这是 Java 并发编程的重大改进。Executor 框架将任务的提交与任务的执行解耦，提供了一种标准的方式来管理线程和执行异步任务。

## 核心原理

### Executor 框架架构

```
                    ┌─────────────┐
                    │   Executor  │  (接口)
                    │  execute()  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────────────┐
                    │  ExecutorService    │  (接口)
                    │  submit()/shutdown()│
                    └──────┬──────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────▼────────┐ ┌─────▼──────┐ ┌───────▼─────────────┐
│AbstractExecutor  │ │ScheduledEx│ │ForkJoinPool         │
│    Service       │ │ecutorServ │ │                     │
└─────────┬────────┘ │    ice     │ └─────────────────────┘
          │          └─────┬──────┘
          │                │
┌─────────▼────────────────▼────────────┐
│        ThreadPoolExecutor             │
│   (核心实现类)                         │
│   ┌─────────────────────────────────┐ │
│   │  Worker Thread 1               │ │
│   │  Worker Thread 2               │ │
│   │  Worker Thread N               │ │
│   └─────────────────────────────────┘ │
│   ┌─────────────────────────────────┐ │
│   │       BlockingQueue             │ │
│   │    (任务等待队列)                │ │
│   └─────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### ThreadPoolExecutor 工作原理

```
任务提交流程：

    新任务提交
        │
        ▼
┌───────────────────────┐
│ 核心线程数未满？      │──是──▶ 创建核心线程执行任务
└───────────────────────┘
        │ 否
        ▼
┌───────────────────────┐
│ 工作队列未满？        │──是──▶ 将任务加入队列
└───────────────────────┘
        │ 否
        ▼
┌───────────────────────┐
│ 最大线程数未满？      │──是──▶ 创建非核心线程执行任务
└───────────────────────┘
        │ 否
        ▼
┌───────────────────────┐
│    执行拒绝策略       │
└───────────────────────┘
```

### 线程池状态转换

```java
/**
 * 线程池状态（高3位表示状态，低29位表示工作线程数）
 *
 * RUNNING    (-1 << 29): 接受新任务，处理队列中的任务
 * SHUTDOWN   (0 << 29):  不接受新任务，但处理队列中的任务
 * STOP       (1 << 29):  不接受新任务，不处理队列任务，中断正在执行的任务
 * TIDYING    (2 << 29):  所有任务已终止，workerCount为0，将执行terminated()
 * TERMINATED (3 << 29):  terminated()方法已执行完毕
 */

状态转换：

RUNNING ──shutdown()──▶ SHUTDOWN ──队列空且工作线程为0──▶ TIDYING
    │                       │
    │                       │
    └──shutdownNow()──▶ STOP ──工作线程为0──▶ TIDYING
                                                │
                                                ▼
                                           TERMINATED
```

### 线程复用机制

```java
// Worker 线程的核心循环（简化版）
final void runWorker(Worker w) {
    Thread wt = Thread.currentThread();
    Runnable task = w.firstTask;
    w.firstTask = null;

    try {
        // 循环获取任务并执行
        while (task != null || (task = getTask()) != null) {
            w.lock();
            try {
                beforeExecute(wt, task);  // 钩子方法
                try {
                    task.run();  // 执行任务
                } finally {
                    afterExecute(task, null);  // 钩子方法
                }
            } finally {
                task = null;
                w.completedTasks++;
                w.unlock();
            }
        }
    } finally {
        processWorkerExit(w, false);
    }
}

// 关键：getTask() 方法会阻塞等待获取新任务
// 这就是线程复用的核心 - 线程不退出，而是等待新任务
private Runnable getTask() {
    for (;;) {
        // 根据配置决定使用 poll(timeout) 还是 take()
        // poll(timeout): 超时返回null，线程可能被回收
        // take(): 阻塞等待，直到有任务
        Runnable r = timed ?
            workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
            workQueue.take();
        if (r != null)
            return r;
    }
}
```

## 核心要点

### ThreadPoolExecutor 七大核心参数

| 参数 | 类型 | 说明 |
|------|------|------|
| corePoolSize | int | 核心线程数，即使空闲也不会被回收（除非设置 allowCoreThreadTimeOut） |
| maximumPoolSize | int | 最大线程数，线程池能容纳的最大工作线程数 |
| keepAliveTime | long | 非核心线程的空闲存活时间 |
| unit | TimeUnit | keepAliveTime 的时间单位 |
| workQueue | BlockingQueue | 任务等待队列，用于存放待执行的任务 |
| threadFactory | ThreadFactory | 线程工厂，用于创建新线程 |
| handler | RejectedExecutionHandler | 拒绝策略，当队列满且线程数达到最大时的处理策略 |

### 常用工作队列

| 队列类型 | 特点 | 适用场景 |
|---------|------|---------|
| ArrayBlockingQueue | 有界数组队列，FIFO | 需要限制队列大小的场景 |
| LinkedBlockingQueue | 可选有界链表队列，FIFO | 通用场景，FixedThreadPool 使用 |
| SynchronousQueue | 不存储元素的队列 | 任务必须立即执行，CachedThreadPool 使用 |
| PriorityBlockingQueue | 无界优先级队列 | 需要按优先级执行任务的场景 |
| DelayQueue | 无界延迟队列 | 定时任务场景 |

### 四种内置拒绝策略

| 策略 | 行为 |
|------|------|
| AbortPolicy（默认） | 抛出 RejectedExecutionException 异常 |
| CallerRunsPolicy | 由提交任务的线程直接执行该任务 |
| DiscardPolicy | 静默丢弃被拒绝的任务，不抛出异常 |
| DiscardOldestPolicy | 丢弃队列中最老的任务，然后重新提交当前任务 |

### Executors 工厂方法

| 方法 | 线程池特点 | 使用队列 |
|------|-----------|---------|
| newFixedThreadPool(n) | 固定n个线程 | LinkedBlockingQueue（无界） |
| newSingleThreadExecutor() | 单个工作线程 | LinkedBlockingQueue（无界） |
| newCachedThreadPool() | 0-Integer.MAX_VALUE 线程 | SynchronousQueue |
| newScheduledThreadPool(n) | n个核心线程，支持定时 | DelayedWorkQueue |
| newWorkStealingPool() | ForkJoinPool，工作窃取 | 内部工作队列 |

## 代码示例

### 基础用法：创建和使用线程池

```java
import java.util.concurrent.*;

public class BasicThreadPoolDemo {
    public static void main(String[] args) {
        // 手动创建线程池（推荐方式）
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2,                      // 核心线程数
            5,                      // 最大线程数
            60L,                    // 空闲线程存活时间
            TimeUnit.SECONDS,       // 时间单位
            new LinkedBlockingQueue<>(10),  // 工作队列
            Executors.defaultThreadFactory(), // 线程工厂
            new ThreadPoolExecutor.AbortPolicy() // 拒绝策略
        );

        // 提交任务方式一：execute()，无返回值
        executor.execute(() -> {
            System.out.println("执行任务: " + Thread.currentThread().getName());
        });

        // 提交任务方式二：submit()，有返回值
        Future<String> future = executor.submit(() -> {
            Thread.sleep(1000);
            return "任务执行结果";
        });

        try {
            String result = future.get(); // 阻塞获取结果
            System.out.println("结果: " + result);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        // 批量提交任务
        for (int i = 0; i < 10; i++) {
            int taskId = i;
            executor.execute(() -> {
                System.out.println("任务 " + taskId + " 由 " +
                    Thread.currentThread().getName() + " 执行");
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 关闭线程池
        executor.shutdown();

        try {
            // 等待所有任务完成
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow(); // 强制关闭
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
```

### 自定义线程工厂

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class CustomThreadFactoryDemo {

    /**
     * 自定义线程工厂：可以自定义线程名称、优先级、异常处理器等
     */
    static class NamedThreadFactory implements ThreadFactory {
        private final AtomicInteger threadNumber = new AtomicInteger(1);
        private final String namePrefix;
        private final boolean daemon;
        private final int priority;
        private final Thread.UncaughtExceptionHandler exceptionHandler;

        public NamedThreadFactory(String namePrefix) {
            this(namePrefix, false, Thread.NORM_PRIORITY, null);
        }

        public NamedThreadFactory(String namePrefix, boolean daemon,
                                  int priority,
                                  Thread.UncaughtExceptionHandler handler) {
            this.namePrefix = namePrefix;
            this.daemon = daemon;
            this.priority = priority;
            this.exceptionHandler = handler;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread thread = new Thread(r,
                namePrefix + "-thread-" + threadNumber.getAndIncrement());
            thread.setDaemon(daemon);
            thread.setPriority(priority);

            if (exceptionHandler != null) {
                thread.setUncaughtExceptionHandler(exceptionHandler);
            }

            return thread;
        }
    }

    public static void main(String[] args) {
        // 创建自定义异常处理器
        Thread.UncaughtExceptionHandler exceptionHandler = (t, e) -> {
            System.err.println("线程 " + t.getName() + " 发生异常: " + e.getMessage());
            e.printStackTrace();
        };

        // 使用自定义线程工厂
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 4, 60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            new NamedThreadFactory("订单处理", false, Thread.NORM_PRIORITY, exceptionHandler),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );

        // 提交任务
        for (int i = 0; i < 5; i++) {
            int taskId = i;
            executor.execute(() -> {
                System.out.println("执行任务 " + taskId + " 在 " +
                    Thread.currentThread().getName());

                // 模拟某些任务抛出异常
                if (taskId == 3) {
                    throw new RuntimeException("任务处理异常");
                }
            });
        }

        executor.shutdown();
    }
}
```

### 自定义拒绝策略

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class CustomRejectionPolicyDemo {

    /**
     * 自定义拒绝策略：记录日志并尝试重新入队
     */
    static class LogAndRetryPolicy implements RejectedExecutionHandler {
        private final int maxRetries;
        private final long retryInterval;

        public LogAndRetryPolicy(int maxRetries, long retryIntervalMillis) {
            this.maxRetries = maxRetries;
            this.retryInterval = retryIntervalMillis;
        }

        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
            if (executor.isShutdown()) {
                System.err.println("线程池已关闭，任务被拒绝: " + r.toString());
                return;
            }

            System.out.println("任务被拒绝，尝试重新提交: " + r.toString());

            for (int i = 0; i < maxRetries; i++) {
                try {
                    Thread.sleep(retryInterval);

                    // 尝试重新入队
                    if (executor.getQueue().offer(r, 100, TimeUnit.MILLISECONDS)) {
                        System.out.println("任务重新入队成功: " + r.toString());
                        return;
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            // 重试失败，抛出异常或记录日志
            System.err.println("任务重试" + maxRetries + "次后仍然失败: " + r.toString());
        }
    }

    /**
     * 自定义拒绝策略：将任务持久化到数据库或消息队列
     */
    static class PersistenceRejectionPolicy implements RejectedExecutionHandler {
        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
            // 模拟持久化到数据库
            System.out.println("任务持久化到数据库: " + r.toString());
            // 实际应用中可以保存到 DB、Redis、MQ 等
            // taskRepository.save(new RejectedTask(r, System.currentTimeMillis()));
        }
    }

    public static void main(String[] args) {
        // 创建一个容量极小的线程池，容易触发拒绝策略
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            1, 1, 0L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1),
            Executors.defaultThreadFactory(),
            new LogAndRetryPolicy(3, 500)  // 最多重试3次，每次间隔500ms
        );

        // 提交大量任务触发拒绝策略
        for (int i = 0; i < 10; i++) {
            int taskId = i;
            try {
                executor.execute(() -> {
                    System.out.println("执行任务 " + taskId);
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            } catch (RejectedExecutionException e) {
                System.err.println("任务 " + taskId + " 提交失败");
            }
        }

        executor.shutdown();
    }
}
```

### ScheduledExecutorService 定时任务

```java
import java.util.concurrent.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ScheduledExecutorDemo {

    private static final DateTimeFormatter formatter =
        DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    private static void log(String message) {
        System.out.println(LocalDateTime.now().format(formatter) + " - " + message);
    }

    public static void main(String[] args) throws InterruptedException {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        // 1. 延迟执行（只执行一次）
        log("提交延迟任务");
        scheduler.schedule(() -> {
            log("延迟3秒后执行的任务");
        }, 3, TimeUnit.SECONDS);

        // 2. 固定频率执行（scheduleAtFixedRate）
        // 每隔2秒执行一次，不管上次执行是否完成
        log("提交固定频率任务");
        ScheduledFuture<?> fixedRateFuture = scheduler.scheduleAtFixedRate(() -> {
            log("固定频率任务开始");
            try {
                Thread.sleep(1000); // 模拟任务执行1秒
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            log("固定频率任务结束");
        }, 1, 2, TimeUnit.SECONDS);

        // 3. 固定延迟执行（scheduleWithFixedDelay）
        // 上次执行完成后，等待2秒再执行下次
        log("提交固定延迟任务");
        ScheduledFuture<?> fixedDelayFuture = scheduler.scheduleWithFixedDelay(() -> {
            log("固定延迟任务开始");
            try {
                Thread.sleep(1000); // 模拟任务执行1秒
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            log("固定延迟任务结束");
        }, 1, 2, TimeUnit.SECONDS);

        // 运行10秒后取消周期性任务
        Thread.sleep(10000);

        log("取消周期性任务");
        fixedRateFuture.cancel(false);  // false: 不中断正在执行的任务
        fixedDelayFuture.cancel(false);

        // 4. 有返回值的延迟任务
        ScheduledFuture<String> resultFuture = scheduler.schedule(() -> {
            log("带返回值的定时任务");
            return "计算结果";
        }, 2, TimeUnit.SECONDS);

        try {
            String result = resultFuture.get();
            log("任务返回: " + result);
        } catch (ExecutionException e) {
            e.printStackTrace();
        }

        scheduler.shutdown();
        scheduler.awaitTermination(5, TimeUnit.SECONDS);
    }
}
```

### 线程池监控

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

public class ThreadPoolMonitorDemo {

    /**
     * 可监控的线程池
     */
    static class MonitoredThreadPoolExecutor extends ThreadPoolExecutor {
        private final AtomicLong totalTaskTime = new AtomicLong(0);
        private final AtomicLong totalTasks = new AtomicLong(0);
        private final ThreadLocal<Long> taskStartTime = new ThreadLocal<>();

        public MonitoredThreadPoolExecutor(int corePoolSize, int maximumPoolSize,
                                           long keepAliveTime, TimeUnit unit,
                                           BlockingQueue<Runnable> workQueue) {
            super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue);
        }

        @Override
        protected void beforeExecute(Thread t, Runnable r) {
            super.beforeExecute(t, r);
            taskStartTime.set(System.nanoTime());
        }

        @Override
        protected void afterExecute(Runnable r, Throwable t) {
            try {
                long endTime = System.nanoTime();
                long startTime = taskStartTime.get();
                long taskTime = endTime - startTime;

                totalTaskTime.addAndGet(taskTime);
                totalTasks.incrementAndGet();

                if (t != null) {
                    System.err.println("任务执行异常: " + t.getMessage());
                }
            } finally {
                taskStartTime.remove();
                super.afterExecute(r, t);
            }
        }

        @Override
        protected void terminated() {
            super.terminated();
            System.out.println("===== 线程池终止统计 =====");
            System.out.println("总任务数: " + totalTasks.get());
            System.out.println("总执行时间: " + totalTaskTime.get() / 1_000_000 + " ms");
            if (totalTasks.get() > 0) {
                System.out.println("平均执行时间: " +
                    (totalTaskTime.get() / totalTasks.get() / 1_000_000) + " ms");
            }
        }

        /**
         * 获取线程池状态
         */
        public void printStatus() {
            System.out.println("===== 线程池状态 =====");
            System.out.println("核心线程数: " + getCorePoolSize());
            System.out.println("最大线程数: " + getMaximumPoolSize());
            System.out.println("当前线程数: " + getPoolSize());
            System.out.println("活跃线程数: " + getActiveCount());
            System.out.println("队列任务数: " + getQueue().size());
            System.out.println("已完成任务数: " + getCompletedTaskCount());
            System.out.println("总任务数: " + getTaskCount());
        }
    }

    public static void main(String[] args) throws InterruptedException {
        MonitoredThreadPoolExecutor executor = new MonitoredThreadPoolExecutor(
            2, 4, 60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(10)
        );

        // 启动监控线程
        Thread monitorThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    Thread.sleep(2000);
                    executor.printStatus();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        monitorThread.setDaemon(true);
        monitorThread.start();

        // 提交任务
        for (int i = 0; i < 20; i++) {
            int taskId = i;
            executor.execute(() -> {
                System.out.println("执行任务 " + taskId);
                try {
                    Thread.sleep((long) (Math.random() * 2000));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 等待一段时间后关闭
        Thread.sleep(10000);
        executor.shutdown();
        executor.awaitTermination(30, TimeUnit.SECONDS);
    }
}
```

### 动态调整线程池参数

```java
import java.util.concurrent.*;

public class DynamicThreadPoolDemo {

    public static void main(String[] args) throws InterruptedException {
        // 创建可动态调整的线程池
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 4, 60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100)
        );

        System.out.println("初始配置:");
        printPoolConfig(executor);

        // 动态调整核心线程数
        executor.setCorePoolSize(4);
        System.out.println("\n调整核心线程数为 4:");
        printPoolConfig(executor);

        // 动态调整最大线程数
        executor.setMaximumPoolSize(8);
        System.out.println("\n调整最大线程数为 8:");
        printPoolConfig(executor);

        // 动态调整空闲线程存活时间
        executor.setKeepAliveTime(30, TimeUnit.SECONDS);
        System.out.println("\n调整空闲时间为 30 秒:");
        printPoolConfig(executor);

        // 允许核心线程超时
        executor.allowCoreThreadTimeOut(true);
        System.out.println("\n允许核心线程超时:");
        System.out.println("allowCoreThreadTimeOut: " +
            executor.allowsCoreThreadTimeOut());

        // 预启动所有核心线程
        int prestarted = executor.prestartAllCoreThreads();
        System.out.println("\n预启动核心线程数: " + prestarted);
        printPoolConfig(executor);

        // 提交一些任务
        for (int i = 0; i < 10; i++) {
            executor.execute(() -> {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        Thread.sleep(500);
        System.out.println("\n任务提交后:");
        printPoolConfig(executor);

        // 移除队列中的任务
        // executor.getQueue().clear();  // 清空队列

        executor.shutdown();
        executor.awaitTermination(30, TimeUnit.SECONDS);
    }

    private static void printPoolConfig(ThreadPoolExecutor executor) {
        System.out.println("核心线程数: " + executor.getCorePoolSize());
        System.out.println("最大线程数: " + executor.getMaximumPoolSize());
        System.out.println("当前线程数: " + executor.getPoolSize());
        System.out.println("活跃线程数: " + executor.getActiveCount());
        System.out.println("队列大小: " + executor.getQueue().size());
    }
}
```

### CompletableFuture 与线程池

```java
import java.util.concurrent.*;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

public class CompletableFutureThreadPoolDemo {

    // 自定义线程池
    private static final ExecutorService customExecutor = new ThreadPoolExecutor(
        4, 8, 60, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(100),
        r -> {
            Thread t = new Thread(r);
            t.setName("自定义-" + t.getId());
            return t;
        }
    );

    public static void main(String[] args) throws Exception {
        // 1. 使用自定义线程池执行异步任务
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务1执行在: " + Thread.currentThread().getName());
            return "结果1";
        }, customExecutor);

        // 2. 不指定线程池时使用 ForkJoinPool.commonPool()
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务2执行在: " + Thread.currentThread().getName());
            return "结果2";
        });

        // 3. 链式操作可以指定不同的线程池
        CompletableFuture<String> chainedFuture = future1
            .thenApplyAsync(result -> {
                System.out.println("链式操作执行在: " + Thread.currentThread().getName());
                return result + " -> 处理后";
            }, customExecutor);

        // 4. 并行执行多个任务
        List<Integer> taskIds = Arrays.asList(1, 2, 3, 4, 5);

        List<CompletableFuture<String>> futures = taskIds.stream()
            .map(id -> CompletableFuture.supplyAsync(() -> {
                System.out.println("处理任务 " + id + " 在 " +
                    Thread.currentThread().getName());
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return "任务" + id + "的结果";
            }, customExecutor))
            .collect(Collectors.toList());

        // 等待所有任务完成并收集结果
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0])
        );

        CompletableFuture<List<String>> resultsFuture = allFutures.thenApply(v ->
            futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList())
        );

        List<String> results = resultsFuture.get();
        System.out.println("\n所有结果: " + results);

        // 5. 任意一个完成就返回
        CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(
            CompletableFuture.supplyAsync(() -> {
                sleep(1000);
                return "快速任务";
            }, customExecutor),
            CompletableFuture.supplyAsync(() -> {
                sleep(2000);
                return "慢速任务";
            }, customExecutor)
        );
        System.out.println("最先完成的: " + anyFuture.get());

        // 关闭线程池
        customExecutor.shutdown();
        customExecutor.awaitTermination(30, TimeUnit.SECONDS);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## 最佳实践

### 线程池参数配置建议

```java
/**
 * 线程池配置最佳实践
 */
public class ThreadPoolConfiguration {

    /**
     * CPU 密集型任务线程池
     * 线程数 = CPU 核心数 + 1
     * 额外的一个线程用于在某个线程暂停时（如缺页中断）保持 CPU 利用率
     */
    public static ThreadPoolExecutor createCpuIntensivePool() {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cpuCores + 1,
            cpuCores + 1,
            0L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000),
            new ThreadPoolExecutor.AbortPolicy()
        );
    }

    /**
     * IO 密集型任务线程池
     * 线程数 = CPU 核心数 * 2
     * 或使用公式：线程数 = CPU 核心数 / (1 - 阻塞系数)
     * 阻塞系数一般在 0.8~0.9 之间
     */
    public static ThreadPoolExecutor createIoIntensivePool() {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cpuCores * 2,
            cpuCores * 2,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(2000),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    /**
     * 混合型任务线程池
     * 根据任务特性灵活配置
     */
    public static ThreadPoolExecutor createMixedPool(double blockingCoefficient) {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        int poolSize = (int) (cpuCores / (1 - blockingCoefficient));

        return new ThreadPoolExecutor(
            poolSize,
            poolSize,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(5000),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }
}
```

### 优雅关闭线程池

```java
/**
 * 线程池优雅关闭
 */
public class GracefulShutdown {

    /**
     * 优雅关闭线程池的标准方法
     */
    public static void shutdownGracefully(ExecutorService executor,
                                          long timeout, TimeUnit unit) {
        // 1. 停止接收新任务
        executor.shutdown();

        try {
            // 2. 等待现有任务完成
            if (!executor.awaitTermination(timeout, unit)) {
                System.out.println("线程池未能在指定时间内完成，强制关闭...");

                // 3. 取消正在执行的任务
                List<Runnable> cancelledTasks = executor.shutdownNow();
                System.out.println("取消的任务数: " + cancelledTasks.size());

                // 4. 再次等待任务响应中断
                if (!executor.awaitTermination(timeout, unit)) {
                    System.err.println("线程池未能正常关闭");
                }
            }
        } catch (InterruptedException e) {
            // 5. 如果当前线程被中断，重新尝试关闭
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        System.out.println("线程池已关闭");
    }

    /**
     * 使用 Runtime 钩子确保 JVM 退出时关闭线程池
     */
    public static void registerShutdownHook(ExecutorService executor) {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("JVM 关闭中，关闭线程池...");
            shutdownGracefully(executor, 30, TimeUnit.SECONDS);
        }));
    }
}
```

### 线程池隔离

```java
/**
 * 线程池隔离：不同业务使用不同的线程池
 */
public class ThreadPoolIsolation {

    // 订单处理线程池
    private static final ThreadPoolExecutor orderPool = new ThreadPoolExecutor(
        4, 8, 60, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(1000),
        new NamedThreadFactory("order"),
        new ThreadPoolExecutor.CallerRunsPolicy()
    );

    // 支付处理线程池
    private static final ThreadPoolExecutor paymentPool = new ThreadPoolExecutor(
        2, 4, 60, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(500),
        new NamedThreadFactory("payment"),
        new ThreadPoolExecutor.AbortPolicy()
    );

    // 日志处理线程池（低优先级）
    private static final ThreadPoolExecutor logPool = new ThreadPoolExecutor(
        1, 2, 60, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(10000),
        new NamedThreadFactory("log"),
        new ThreadPoolExecutor.DiscardOldestPolicy()
    );

    /**
     * 线程池隔离的好处：
     * 1. 防止某个业务任务阻塞影响其他业务
     * 2. 可以针对不同业务设置不同的线程数和拒绝策略
     * 3. 便于监控和问题排查
     * 4. 可以独立配置和调整
     */

    static class NamedThreadFactory implements ThreadFactory {
        private final AtomicInteger counter = new AtomicInteger(1);
        private final String prefix;

        public NamedThreadFactory(String prefix) {
            this.prefix = prefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            return new Thread(r, prefix + "-thread-" + counter.getAndIncrement());
        }
    }
}
```

### 任务提交返回值处理

```java
import java.util.concurrent.*;
import java.util.ArrayList;
import java.util.List;

public class TaskResultHandling {

    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(4);

        // 1. 使用 Future.get() 的超时版本
        Future<String> future = executor.submit(() -> {
            Thread.sleep(5000);
            return "耗时任务结果";
        });

        try {
            // 设置超时时间，防止无限等待
            String result = future.get(2, TimeUnit.SECONDS);
            System.out.println("结果: " + result);
        } catch (TimeoutException e) {
            System.out.println("任务超时，取消任务");
            future.cancel(true);  // 尝试中断任务
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        // 2. 使用 invokeAll 等待所有任务完成
        List<Callable<String>> tasks = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            int taskId = i;
            tasks.add(() -> {
                Thread.sleep(1000);
                return "任务" + taskId + "结果";
            });
        }

        try {
            // invokeAll 会阻塞直到所有任务完成
            List<Future<String>> futures = executor.invokeAll(tasks, 10, TimeUnit.SECONDS);
            for (Future<String> f : futures) {
                if (!f.isCancelled()) {
                    System.out.println(f.get());
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        // 3. 使用 invokeAny 获取第一个完成的结果
        try {
            String firstResult = executor.invokeAny(tasks, 10, TimeUnit.SECONDS);
            System.out.println("第一个完成的结果: " + firstResult);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            e.printStackTrace();
        }

        executor.shutdown();
    }
}
```

## 常见陷阱

### 使用 Executors 工厂方法的风险

```java
/**
 * Executors 工厂方法的陷阱
 */
public class ExecutorsPitfalls {

    public static void main(String[] args) {
        // 陷阱1: newFixedThreadPool 使用无界队列
        // 可能导致 OOM
        ExecutorService fixedPool = Executors.newFixedThreadPool(2);
        // 内部使用 new LinkedBlockingQueue<Runnable>() 无界队列
        // 如果任务提交速度远大于执行速度，队列会无限增长

        // 陷阱2: newCachedThreadPool 线程数无限制
        // 可能创建大量线程导致 OOM 或系统崩溃
        ExecutorService cachedPool = Executors.newCachedThreadPool();
        // 最大线程数是 Integer.MAX_VALUE
        // 大量短任务并发时会创建大量线程

        // 陷阱3: newSingleThreadExecutor 任务队列无界
        ExecutorService singlePool = Executors.newSingleThreadExecutor();
        // 与 newFixedThreadPool(1) 类似的问题

        // 正确做法：手动创建 ThreadPoolExecutor
        ThreadPoolExecutor correctPool = new ThreadPoolExecutor(
            2, 4, 60, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(100),  // 有界队列
            Executors.defaultThreadFactory(),
            new ThreadPoolExecutor.CallerRunsPolicy()  // 明确的拒绝策略
        );
    }
}
```

### 线程池使用后未关闭

```java
/**
 * 线程池未关闭导致应用无法正常退出
 */
public class ThreadPoolNotClosed {

    public static void main(String[] args) {
        // 错误示例：创建了线程池但没有关闭
        ExecutorService executor = Executors.newFixedThreadPool(2);

        executor.execute(() -> {
            System.out.println("执行任务");
        });

        // main 方法结束，但程序不会退出
        // 因为线程池中的线程是非守护线程
        System.out.println("main 方法结束");

        // 正确做法：确保关闭线程池
        // executor.shutdown();
    }
}
```

### 任务异常被吞没

```java
/**
 * 线程池任务异常处理
 */
public class TaskExceptionHandling {

    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        // 陷阱：execute() 方法的异常会被打印到控制台，但不会抛出
        executor.execute(() -> {
            throw new RuntimeException("execute 中的异常");
            // 异常会输出到控制台，但调用方感知不到
        });

        Thread.sleep(1000);

        // 陷阱：submit() 方法的异常会被封装在 Future 中
        Future<?> future = executor.submit(() -> {
            throw new RuntimeException("submit 中的异常");
        });

        // 如果不调用 future.get()，异常会被吞没
        // System.out.println("任务提交完成"); // 不会感知到异常

        // 正确做法：调用 get() 获取异常
        try {
            future.get();
        } catch (ExecutionException e) {
            System.out.println("捕获到异常: " + e.getCause().getMessage());
        }

        // 更好的做法：使用自定义的异常处理
        ThreadPoolExecutor customExecutor = new ThreadPoolExecutor(
            2, 4, 60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100)
        ) {
            @Override
            protected void afterExecute(Runnable r, Throwable t) {
                super.afterExecute(r, t);

                // 处理 execute() 方法提交的任务异常
                if (t != null) {
                    System.err.println("任务执行异常: " + t.getMessage());
                }

                // 处理 submit() 方法提交的任务异常
                if (t == null && r instanceof Future<?>) {
                    try {
                        Future<?> f = (Future<?>) r;
                        if (f.isDone()) {
                            f.get();
                        }
                    } catch (CancellationException ce) {
                        t = ce;
                    } catch (ExecutionException ee) {
                        t = ee.getCause();
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    if (t != null) {
                        System.err.println("Future 任务异常: " + t.getMessage());
                    }
                }
            }
        };

        executor.shutdown();
    }
}
```

### 死锁风险

```java
/**
 * 线程池死锁示例
 */
public class ThreadPoolDeadlock {

    public static void main(String[] args) throws Exception {
        // 只有1个线程的线程池
        ExecutorService executor = Executors.newSingleThreadExecutor();

        // 外层任务
        Future<String> outerFuture = executor.submit(() -> {
            System.out.println("外层任务开始");

            // 内层任务 - 需要等待外层任务完成才能执行
            // 但外层任务又在等待内层任务
            Future<String> innerFuture = executor.submit(() -> {
                return "内层结果";
            });

            // 死锁！外层任务等待内层任务，但线程池只有1个线程
            return "外层结果: " + innerFuture.get();
        });

        // 设置超时，避免永久阻塞
        try {
            String result = outerFuture.get(5, TimeUnit.SECONDS);
            System.out.println(result);
        } catch (TimeoutException e) {
            System.err.println("检测到死锁，任务超时");
        }

        executor.shutdownNow();
    }
}
```

### 线程上下文丢失

```java
/**
 * 线程上下文传递问题
 */
public class ThreadContextLoss {

    private static final ThreadLocal<String> userContext = new ThreadLocal<>();

    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        // 设置主线程的上下文
        userContext.set("用户A");
        System.out.println("主线程上下文: " + userContext.get());

        // 陷阱：线程池中的线程无法获取主线程的 ThreadLocal
        executor.execute(() -> {
            System.out.println("工作线程上下文: " + userContext.get()); // null
        });

        Thread.sleep(1000);

        // 正确做法1：手动传递上下文
        String context = userContext.get();
        executor.execute(() -> {
            userContext.set(context);  // 手动设置
            try {
                System.out.println("手动传递后的上下文: " + userContext.get());
            } finally {
                userContext.remove();  // 必须清理
            }
        });

        // 正确做法2：使用 InheritableThreadLocal（有局限性）
        // 只在线程创建时继承，线程池复用线程时不会重新继承

        // 正确做法3：使用装饰器模式包装任务
        Runnable contextAwareTask = wrapWithContext(() -> {
            System.out.println("包装后的上下文: " + userContext.get());
        });
        executor.execute(contextAwareTask);

        Thread.sleep(1000);
        executor.shutdown();
    }

    /**
     * 创建上下文感知的任务包装器
     */
    private static Runnable wrapWithContext(Runnable task) {
        String context = userContext.get();
        return () -> {
            userContext.set(context);
            try {
                task.run();
            } finally {
                userContext.remove();
            }
        };
    }
}
```

## 性能考量

### 线程池大小选择

```java
/**
 * 线程池大小计算
 */
public class ThreadPoolSizing {

    /**
     * Little's Law：线程数 = QPS * 平均响应时间
     *
     * 例如：目标 QPS = 1000，平均响应时间 = 100ms
     * 线程数 = 1000 * 0.1 = 100
     */

    /**
     * 更精确的计算公式
     *
     * N_threads = N_cpu * U_cpu * (1 + W/C)
     *
     * N_cpu: CPU 核心数
     * U_cpu: 目标 CPU 利用率 (0-1)
     * W: 等待时间
     * C: 计算时间
     */
    public static int calculateOptimalThreadCount(
            int cpuCores,
            double targetCpuUtilization,
            double waitTime,
            double computeTime) {

        return (int) (cpuCores * targetCpuUtilization * (1 + waitTime / computeTime));
    }

    public static void main(String[] args) {
        int cpuCores = Runtime.getRuntime().availableProcessors();

        // 场景1: 纯 CPU 计算任务
        // W/C ≈ 0, 线程数 ≈ CPU核心数
        int cpuBoundThreads = cpuCores + 1;
        System.out.println("CPU 密集型线程数: " + cpuBoundThreads);

        // 场景2: IO 密集型任务 (如网络请求，W/C ≈ 9)
        // 假设 90% 时间在等待 IO
        int ioBoundThreads = calculateOptimalThreadCount(cpuCores, 1.0, 9, 1);
        System.out.println("IO 密集型线程数: " + ioBoundThreads);

        // 场景3: 混合型任务 (W/C ≈ 1)
        int mixedThreads = calculateOptimalThreadCount(cpuCores, 0.8, 1, 1);
        System.out.println("混合型线程数: " + mixedThreads);
    }
}
```

### 队列选择对性能的影响

```java
/**
 * 不同队列的性能特点
 */
public class QueuePerformance {

    /**
     * ArrayBlockingQueue
     * - 有界数组队列，创建时必须指定容量
     * - 内存预分配，创建时分配固定大小的数组
     * - 使用单个锁，生产者和消费者共用同一把锁
     * - 适用于生产者和消费者速度接近的场景
     */

    /**
     * LinkedBlockingQueue
     * - 可选有界链表队列，默认容量为 Integer.MAX_VALUE
     * - 动态分配节点内存
     * - 使用两把锁（putLock 和 takeLock），并发度更高
     * - 适用于生产者消费者速度差异较大的场景
     */

    /**
     * SynchronousQueue
     * - 不存储元素的队列
     * - 每个 put 操作必须等待一个 take 操作
     * - 吞吐量高于 LinkedBlockingQueue
     * - 适用于任务需要立即执行的场景
     */

    /**
     * PriorityBlockingQueue
     * - 无界优先级队列
     * - 元素必须实现 Comparable 或提供 Comparator
     * - 插入操作 O(log n)
     * - 适用于需要按优先级执行任务的场景
     */

    public static void main(String[] args) {
        // 性能测试示例
        int taskCount = 100000;

        // 测试 ArrayBlockingQueue
        long start = System.currentTimeMillis();
        testQueue(new ArrayBlockingQueue<>(taskCount), taskCount);
        System.out.println("ArrayBlockingQueue: " + (System.currentTimeMillis() - start) + "ms");

        // 测试 LinkedBlockingQueue
        start = System.currentTimeMillis();
        testQueue(new LinkedBlockingQueue<>(taskCount), taskCount);
        System.out.println("LinkedBlockingQueue: " + (System.currentTimeMillis() - start) + "ms");
    }

    private static void testQueue(BlockingQueue<Runnable> queue, int taskCount) {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            4, 8, 60, TimeUnit.SECONDS, queue
        );

        for (int i = 0; i < taskCount; i++) {
            executor.execute(() -> {
                // 模拟简单任务
            });
        }

        executor.shutdown();
        try {
            executor.awaitTermination(60, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### 性能监控与调优

```java
import java.util.concurrent.*;
import java.lang.management.*;

/**
 * 线程池性能监控
 */
public class ThreadPoolPerformanceMonitor {

    private final ThreadPoolExecutor executor;
    private final ScheduledExecutorService monitor;

    public ThreadPoolPerformanceMonitor(ThreadPoolExecutor executor) {
        this.executor = executor;
        this.monitor = Executors.newSingleThreadScheduledExecutor();
    }

    /**
     * 启动监控
     */
    public void startMonitoring(long intervalSeconds) {
        monitor.scheduleAtFixedRate(() -> {
            System.out.println("\n========== 线程池监控 ==========");

            // 基本信息
            System.out.println("核心线程数: " + executor.getCorePoolSize());
            System.out.println("最大线程数: " + executor.getMaximumPoolSize());
            System.out.println("当前线程数: " + executor.getPoolSize());
            System.out.println("活跃线程数: " + executor.getActiveCount());
            System.out.println("峰值线程数: " + executor.getLargestPoolSize());

            // 任务统计
            System.out.println("队列任务数: " + executor.getQueue().size());
            System.out.println("队列剩余容量: " + executor.getQueue().remainingCapacity());
            System.out.println("已提交任务数: " + executor.getTaskCount());
            System.out.println("已完成任务数: " + executor.getCompletedTaskCount());

            // 计算指标
            long pending = executor.getTaskCount() - executor.getCompletedTaskCount();
            System.out.println("待处理任务数: " + pending);

            double utilizationRate = executor.getPoolSize() > 0 ?
                (double) executor.getActiveCount() / executor.getPoolSize() * 100 : 0;
            System.out.printf("线程利用率: %.2f%%%n", utilizationRate);

            // 获取 JVM 线程信息
            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            System.out.println("JVM 总线程数: " + threadMXBean.getThreadCount());
            System.out.println("JVM 峰值线程数: " + threadMXBean.getPeakThreadCount());

            // 内存信息
            MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
            MemoryUsage heapUsage = memoryMXBean.getHeapMemoryUsage();
            System.out.printf("堆内存使用: %d MB / %d MB%n",
                heapUsage.getUsed() / 1024 / 1024,
                heapUsage.getMax() / 1024 / 1024);

        }, 0, intervalSeconds, TimeUnit.SECONDS);
    }

    /**
     * 停止监控
     */
    public void stopMonitoring() {
        monitor.shutdown();
    }

    /**
     * 检查是否需要告警
     */
    public void checkAlerts() {
        int activeCount = executor.getActiveCount();
        int poolSize = executor.getPoolSize();
        int queueSize = executor.getQueue().size();
        int maxPoolSize = executor.getMaximumPoolSize();

        // 告警条件
        if (poolSize >= maxPoolSize * 0.9) {
            System.err.println("[告警] 线程数接近上限: " + poolSize + "/" + maxPoolSize);
        }

        if (queueSize > 1000) {
            System.err.println("[告警] 队列积压严重: " + queueSize);
        }

        if (activeCount == poolSize && poolSize > 0) {
            System.err.println("[告警] 所有线程都在工作，可能需要扩容");
        }
    }
}
```

## 实战场景

### 场景一：Web 服务器请求处理

```java
import java.util.concurrent.*;

/**
 * Web 服务器请求处理线程池配置
 */
public class WebServerThreadPool {

    /**
     * HTTP 请求处理线程池
     * 考虑因素：
     * 1. 大部分请求是 IO 密集型（数据库、远程调用）
     * 2. 需要控制最大并发数防止系统过载
     * 3. 需要合理的拒绝策略
     */
    public static ThreadPoolExecutor createHttpThreadPool() {
        int cpuCores = Runtime.getRuntime().availableProcessors();

        return new ThreadPoolExecutor(
            cpuCores * 2,           // 核心线程数
            cpuCores * 4,           // 最大线程数
            60L, TimeUnit.SECONDS,  // 空闲线程存活时间
            new LinkedBlockingQueue<>(1000),  // 有界队列
            new ThreadFactory() {
                private final AtomicInteger count = new AtomicInteger(1);
                @Override
                public Thread newThread(Runnable r) {
                    Thread thread = new Thread(r, "http-worker-" + count.getAndIncrement());
                    thread.setDaemon(false);
                    return thread;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy()  // 满载时由调用者执行
        );
    }

    /**
     * 模拟 HTTP 请求处理
     */
    public static void simulateHttpServer() {
        ThreadPoolExecutor executor = createHttpThreadPool();

        // 模拟处理 1000 个请求
        for (int i = 0; i < 1000; i++) {
            int requestId = i;
            executor.execute(() -> {
                try {
                    // 模拟请求处理（读取数据库、调用远程服务等）
                    Thread.sleep(100);
                    System.out.println("处理请求 " + requestId + " 完成 - " +
                        Thread.currentThread().getName());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        executor.shutdown();
    }
}
```

### 场景二：批量数据处理

```java
import java.util.concurrent.*;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * 批量数据处理场景
 */
public class BatchDataProcessor {

    private final ThreadPoolExecutor executor;

    public BatchDataProcessor(int parallelism) {
        this.executor = new ThreadPoolExecutor(
            parallelism,
            parallelism,
            0L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(),
            new ThreadFactory() {
                private final AtomicInteger count = new AtomicInteger(1);
                @Override
                public Thread newThread(Runnable r) {
                    return new Thread(r, "batch-processor-" + count.getAndIncrement());
                }
            }
        );
    }

    /**
     * 并行处理数据列表
     */
    public <T, R> List<R> processInParallel(List<T> items,
                                            java.util.function.Function<T, R> processor) {
        List<Future<R>> futures = new ArrayList<>();

        // 提交所有任务
        for (T item : items) {
            Future<R> future = executor.submit(() -> processor.apply(item));
            futures.add(future);
        }

        // 收集结果
        List<R> results = new ArrayList<>();
        for (Future<R> future : futures) {
            try {
                results.add(future.get(30, TimeUnit.SECONDS));
            } catch (InterruptedException | ExecutionException | TimeoutException e) {
                // 处理异常
                results.add(null);
            }
        }

        return results;
    }

    /**
     * 分批处理大量数据
     */
    public <T> void processBatches(List<T> allItems, int batchSize,
                                   java.util.function.Consumer<List<T>> batchProcessor) {
        List<List<T>> batches = partition(allItems, batchSize);

        CountDownLatch latch = new CountDownLatch(batches.size());

        for (List<T> batch : batches) {
            executor.execute(() -> {
                try {
                    batchProcessor.accept(batch);
                } finally {
                    latch.countDown();
                }
            });
        }

        try {
            latch.await(1, TimeUnit.HOURS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 分区工具方法
     */
    private <T> List<List<T>> partition(List<T> list, int size) {
        List<List<T>> partitions = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            partitions.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return partitions;
    }

    public void shutdown() {
        executor.shutdown();
    }
}
```

### 场景三：定时任务调度

```java
import java.util.concurrent.*;
import java.time.*;
import java.time.format.DateTimeFormatter;

/**
 * 定时任务调度场景
 */
public class TaskScheduler {

    private final ScheduledThreadPoolExecutor scheduler;
    private static final DateTimeFormatter formatter =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public TaskScheduler(int corePoolSize) {
        this.scheduler = new ScheduledThreadPoolExecutor(corePoolSize);

        // 配置：任务取消后从队列中移除
        scheduler.setRemoveOnCancelPolicy(true);

        // 配置：关闭时继续执行已调度的任务
        scheduler.setContinueExistingPeriodicTasksAfterShutdownPolicy(false);
        scheduler.setExecuteExistingDelayedTasksAfterShutdownPolicy(false);
    }

    /**
     * 在指定时间执行任务
     */
    public ScheduledFuture<?> scheduleAt(LocalDateTime dateTime, Runnable task) {
        long delay = Duration.between(LocalDateTime.now(), dateTime).toMillis();
        if (delay < 0) {
            throw new IllegalArgumentException("执行时间不能在过去");
        }

        System.out.println("任务将在 " + dateTime.format(formatter) + " 执行");
        return scheduler.schedule(task, delay, TimeUnit.MILLISECONDS);
    }

    /**
     * 每天固定时间执行
     */
    public ScheduledFuture<?> scheduleDailyAt(int hour, int minute, Runnable task) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextRun = now.withHour(hour).withMinute(minute).withSecond(0);

        if (now.isAfter(nextRun)) {
            nextRun = nextRun.plusDays(1);
        }

        long initialDelay = Duration.between(now, nextRun).toMillis();
        long period = Duration.ofDays(1).toMillis();

        System.out.println("每日 " + hour + ":" + minute + " 执行任务");
        return scheduler.scheduleAtFixedRate(task, initialDelay, period, TimeUnit.MILLISECONDS);
    }

    /**
     * Cron 风格的任务调度（简化版）
     */
    public ScheduledFuture<?> scheduleWithCron(String cronExpression, Runnable task) {
        // 这里只是示例，实际应使用 Quartz 或 Spring Scheduler
        // 简单解析 "0 * * * *" 格式（每小时整点执行）

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextRun = now.truncatedTo(java.time.temporal.ChronoUnit.HOURS).plusHours(1);

        long initialDelay = Duration.between(now, nextRun).toMillis();
        long period = Duration.ofHours(1).toMillis();

        return scheduler.scheduleAtFixedRate(task, initialDelay, period, TimeUnit.MILLISECONDS);
    }

    /**
     * 带错误处理的周期性任务
     */
    public ScheduledFuture<?> scheduleWithErrorHandling(long period, TimeUnit unit,
                                                        Runnable task) {
        Runnable wrappedTask = () -> {
            try {
                task.run();
            } catch (Exception e) {
                System.err.println("定时任务执行异常: " + e.getMessage());
                // 记录日志、发送告警等
                // 注意：不要让异常传播，否则任务会停止调度
            }
        };

        return scheduler.scheduleAtFixedRate(wrappedTask, 0, period, unit);
    }

    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(60, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) throws Exception {
        TaskScheduler taskScheduler = new TaskScheduler(4);

        // 示例：5秒后执行一次
        taskScheduler.scheduleAt(LocalDateTime.now().plusSeconds(5), () -> {
            System.out.println(LocalDateTime.now().format(formatter) + " - 延迟任务执行");
        });

        // 示例：每2秒执行一次
        taskScheduler.scheduleWithErrorHandling(2, TimeUnit.SECONDS, () -> {
            System.out.println(LocalDateTime.now().format(formatter) + " - 周期性任务执行");
        });

        // 运行10秒后关闭
        Thread.sleep(10000);
        taskScheduler.shutdown();
    }
}
```

### 场景四：异步编排

```java
import java.util.concurrent.*;

/**
 * 复杂业务场景的异步编排
 */
public class AsyncOrchestration {

    private final ExecutorService executor;

    public AsyncOrchestration() {
        this.executor = new ThreadPoolExecutor(
            4, 8, 60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100)
        );
    }

    /**
     * 模拟电商下单流程
     * 并行查询：用户信息、商品信息、库存信息
     * 串行执行：创建订单 -> 扣减库存 -> 发送通知
     */
    public CompletableFuture<String> processOrder(long userId, long productId) {

        // 并行查询
        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(
            () -> queryUser(userId), executor);

        CompletableFuture<String> productFuture = CompletableFuture.supplyAsync(
            () -> queryProduct(productId), executor);

        CompletableFuture<Integer> stockFuture = CompletableFuture.supplyAsync(
            () -> queryStock(productId), executor);

        // 等待所有查询完成，然后创建订单
        return CompletableFuture.allOf(userFuture, productFuture, stockFuture)
            .thenApplyAsync(v -> {
                try {
                    String user = userFuture.get();
                    String product = productFuture.get();
                    Integer stock = stockFuture.get();

                    if (stock <= 0) {
                        throw new RuntimeException("库存不足");
                    }

                    return createOrder(user, product);
                } catch (Exception e) {
                    throw new CompletionException(e);
                }
            }, executor)
            .thenApplyAsync(orderId -> {
                // 扣减库存
                deductStock(productId);
                return orderId;
            }, executor)
            .thenApplyAsync(orderId -> {
                // 发送通知
                sendNotification(userId, orderId);
                return "订单创建成功: " + orderId;
            }, executor)
            .exceptionally(ex -> {
                System.err.println("订单处理失败: " + ex.getMessage());
                return "订单创建失败";
            });
    }

    // 模拟方法
    private String queryUser(long userId) {
        sleep(100);
        return "用户-" + userId;
    }

    private String queryProduct(long productId) {
        sleep(150);
        return "商品-" + productId;
    }

    private Integer queryStock(long productId) {
        sleep(80);
        return 10;
    }

    private String createOrder(String user, String product) {
        sleep(200);
        return "ORDER-" + System.currentTimeMillis();
    }

    private void deductStock(long productId) {
        sleep(50);
    }

    private void sendNotification(long userId, String orderId) {
        sleep(30);
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public void shutdown() {
        executor.shutdown();
    }

    public static void main(String[] args) throws Exception {
        AsyncOrchestration orchestration = new AsyncOrchestration();

        long start = System.currentTimeMillis();
        String result = orchestration.processOrder(123, 456).get();
        long end = System.currentTimeMillis();

        System.out.println(result);
        System.out.println("总耗时: " + (end - start) + " ms");
        // 串行执行需要: 100+150+80+200+50+30 = 610ms
        // 并行优化后约: max(100,150,80)+200+50+30 = 430ms

        orchestration.shutdown();
    }
}
```

## 面试要点

### 高频面试题

**1. 线程池的核心参数有哪些？各有什么作用？**

ThreadPoolExecutor 有 7 个核心参数：
- `corePoolSize`：核心线程数，线程池的基本大小
- `maximumPoolSize`：最大线程数，线程池允许创建的最大线程数
- `keepAliveTime`：线程空闲时间，超过这个时间的非核心线程会被回收
- `unit`：keepAliveTime 的时间单位
- `workQueue`：任务队列，用于存放等待执行的任务
- `threadFactory`：线程工厂，用于创建新线程
- `handler`：拒绝策略，当队列满且线程数达到最大时的处理策略

**2. 线程池的工作流程是怎样的？**

1. 提交任务时，先检查核心线程数是否已满
2. 如果核心线程数未满，创建核心线程执行任务
3. 如果核心线程数已满，检查工作队列是否已满
4. 如果工作队列未满，将任务加入队列等待执行
5. 如果工作队列已满，检查最大线程数是否已满
6. 如果最大线程数未满，创建非核心线程执行任务
7. 如果最大线程数已满，执行拒绝策略

**3. 为什么不建议使用 Executors 创建线程池？**

- `newFixedThreadPool` 和 `newSingleThreadExecutor`：使用无界的 LinkedBlockingQueue，可能导致 OOM
- `newCachedThreadPool`：最大线程数为 Integer.MAX_VALUE，可能创建大量线程导致 OOM
- `newScheduledThreadPool`：同样使用无界队列

阿里巴巴 Java 开发手册明确要求使用 ThreadPoolExecutor 手动创建线程池，明确线程池的运行规则。

**4. 线程池有哪些拒绝策略？如何选择？**

- `AbortPolicy`（默认）：抛出 RejectedExecutionException，适用于需要感知任务被拒绝的场景
- `CallerRunsPolicy`：由提交任务的线程执行，适用于不能丢弃任务的场景，可以实现限流
- `DiscardPolicy`：静默丢弃任务，适用于允许丢失的任务
- `DiscardOldestPolicy`：丢弃队列中最老的任务，适用于新任务优先级更高的场景

**5. 如何合理配置线程池大小？**

- CPU 密集型任务：线程数 = CPU 核心数 + 1
- IO 密集型任务：线程数 = CPU 核心数 * 2 或 CPU 核心数 / (1 - 阻塞系数)
- 混合型任务：根据任务的 CPU 时间和 IO 时间的比例计算

实际生产中需要通过压测和监控来调整。

**6. execute() 和 submit() 有什么区别？**

- `execute()`：无返回值，异常会直接抛出
- `submit()`：返回 Future 对象，异常封装在 Future 中，需要调用 get() 才能获取

**7. 线程池中的线程是如何复用的？**

Worker 线程在执行完任务后不会退出，而是调用 `getTask()` 方法从工作队列中获取下一个任务。`getTask()` 方法会阻塞等待，直到有新任务到来或超时。

**8. 如何优雅关闭线程池？**

```java
executor.shutdown();  // 停止接收新任务
if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
    executor.shutdownNow();  // 强制关闭
}
```

**9. 线程池中线程抛出异常会怎样？**

- `execute()` 提交的任务：异常会打印到控制台，线程会终止并被新线程替代
- `submit()` 提交的任务：异常被封装在 Future 中，线程继续复用

建议在任务内部捕获异常，或者重写 `afterExecute()` 方法统一处理。

**10. ScheduledThreadPoolExecutor 和 Timer 有什么区别？**

- Timer 是单线程，一个任务执行时间过长会影响其他任务
- ScheduledThreadPoolExecutor 是多线程，任务之间互不影响
- Timer 任务抛出异常会导致整个 Timer 终止
- ScheduledThreadPoolExecutor 任务异常只影响当前任务

## 延伸阅读

### 官方文档

- [Java 并发工具包 (java.util.concurrent) 官方文档](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/package-summary.html)
- [ThreadPoolExecutor 官方文档](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html)
- [Executors 官方文档](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html)

### 经典书籍

- 《Java 并发编程实战》(Java Concurrency in Practice) - Brian Goetz
- 《Java 并发编程的艺术》 - 方腾飞
- 《Effective Java》第 3 版 - Joshua Bloch（第 80-81 条）

### 优质文章

- [美团技术团队：Java 线程池实现原理及其在美团业务中的实践](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html)
- [阿里巴巴 Java 开发手册 - 并发处理章节](https://github.com/alibaba/p3c)

### 相关主题

- **ForkJoinPool**：分治任务的线程池，适用于递归分解的计算任务
- **Virtual Threads (虚拟线程)**：Java 21 引入的轻量级线程，改变了线程池的使用方式
- **CompletableFuture**：异步编程的核心工具，与线程池配合使用
- **Reactor/RxJava**：响应式编程框架，底层也使用线程池调度

---

> 掌握线程池是 Java 并发编程的基础。在实际应用中，需要根据业务场景合理配置线程池参数，做好监控和告警，确保系统的稳定性和性能。
