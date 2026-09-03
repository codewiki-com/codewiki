---
title: Java 并发编程
description: 深入理解 Java 并发：线程、同步、锁、并发工具与线程池
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 并发
  - 线程
  - 锁
status: imported
origin: old/src/content/docs/java/concurrency.zh.md
divergence: 0.343
issues: []
legacy:
  category: Java
  subcategory: 并发编程
  order: 5
  lastUpdated: 2026-01-07
---

## 概述

Java 并发编程是构建高性能、可扩展应用程序的关键技术。本文将深入探讨 Java 并发的核心概念、机制和最佳实践。

## 线程基础

### 创建线程

Java 提供了多种创建线程的方式：

#### 继承 Thread 类

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程 " + Thread.currentThread().getName() + " 正在运行");
    }

    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start(); // 启动线程
    }
}
```

#### 实现 Runnable 接口

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程 " + Thread.currentThread().getName() + " 正在执行任务");
    }

    public static void main(String[] args) {
        Thread thread = new Thread(new MyRunnable());
        thread.start();
    }
}
```

#### 使用 Lambda 表达式

```java
public class LambdaThread {
    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            System.out.println("使用 Lambda 创建的线程");
        });
        thread.start();
    }
}
```

### 线程生命周期

线程有以下几种状态：

- **NEW（新建）**：线程对象已创建，但尚未启动
- **RUNNABLE（可运行）**：线程正在 JVM 中执行，或等待操作系统调度
- **BLOCKED（阻塞）**：线程等待获取监视器锁
- **WAITING（等待）**：线程无限期等待另一个线程执行特定操作
- **TIMED_WAITING（定时等待）**：线程等待指定时间
- **TERMINATED（终止）**：线程执行完毕

```java
public class ThreadLifecycle {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            try {
                System.out.println("状态: " + Thread.currentThread().getState()); // RUNNABLE
                Thread.sleep(2000); // TIMED_WAITING
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

        System.out.println("启动前: " + thread.getState()); // NEW
        thread.start();
        Thread.sleep(100);
        System.out.println("运行中: " + thread.getState()); // TIMED_WAITING
        thread.join();
        System.out.println("结束后: " + thread.getState()); // TERMINATED
    }
}
```

### 线程常用方法

```java
public class ThreadMethods {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                System.out.println("计数: " + i);
                try {
                    Thread.sleep(1000); // 休眠 1 秒
                } catch (InterruptedException e) {
                    System.out.println("线程被中断");
                    return;
                }
            }
        });

        thread.start();
        thread.join(); // 等待线程结束

        // 中断示例
        Thread interruptThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                System.out.println("工作中...");
            }
            System.out.println("线程被中断，退出");
        });

        interruptThread.start();
        Thread.sleep(100);
        interruptThread.interrupt(); // 中断线程
    }
}
```

## synchronized 与 volatile

### synchronized 关键字

`synchronized` 用于实现线程同步，保证同一时刻只有一个线程执行特定代码块。

#### 同步方法

```java
public class SynchronizedMethod {
    private int count = 0;

    // 同步实例方法（锁定当前对象）
    public synchronized void increment() {
        count++;
    }

    // 同步静态方法（锁定类对象）
    public static synchronized void staticMethod() {
        System.out.println("静态同步方法");
    }

    public synchronized int getCount() {
        return count;
    }
}
```

#### 同步代码块

```java
public class SynchronizedBlock {
    private int count = 0;
    private final Object lock = new Object();

    public void increment() {
        synchronized (lock) { // 使用自定义锁对象
            count++;
        }
    }

    public void decrement() {
        synchronized (this) { // 使用当前对象作为锁
            count--;
        }
    }
}
```

#### 实际应用示例

```java
public class BankAccount {
    private double balance;

    public BankAccount(double initialBalance) {
        this.balance = initialBalance;
    }

    // 同步存款方法
    public synchronized void deposit(double amount) {
        balance += amount;
        System.out.println("存款: " + amount + ", 余额: " + balance);
    }

    // 同步取款方法
    public synchronized boolean withdraw(double amount) {
        if (balance >= amount) {
            balance -= amount;
            System.out.println("取款: " + amount + ", 余额: " + balance);
            return true;
        }
        System.out.println("余额不足，取款失败");
        return false;
    }

    public static void main(String[] args) {
        BankAccount account = new BankAccount(1000);

        // 多个线程同时操作账户
        Thread t1 = new Thread(() -> account.deposit(500));
        Thread t2 = new Thread(() -> account.withdraw(300));
        Thread t3 = new Thread(() -> account.withdraw(800));

        t1.start();
        t2.start();
        t3.start();
    }
}
```

### volatile 关键字

`volatile` 保证变量的可见性和有序性，但不保证原子性。

```java
public class VolatileExample {
    // volatile 确保多线程间的可见性
    private volatile boolean running = true;

    public void run() {
        System.out.println("线程启动");
        while (running) {
            // 执行任务
        }
        System.out.println("线程停止");
    }

    public void stop() {
        running = false; // 立即对其他线程可见
    }

    public static void main(String[] args) throws InterruptedException {
        VolatileExample example = new VolatileExample();

        Thread thread = new Thread(example::run);
        thread.start();

        Thread.sleep(1000);
        example.stop(); // 停止线程
    }
}
```

#### volatile 的局限性

```java
public class VolatileLimitation {
    private volatile int count = 0;

    // 这个方法不是线程安全的！
    public void increment() {
        count++; // 非原子操作：读取 -> 增加 -> 写入
    }

    // 正确的做法：使用 synchronized 或 AtomicInteger
    public synchronized void safeIncrement() {
        count++;
    }
}
```

### synchronized vs volatile

| 特性 | synchronized | volatile |
|------|-------------|----------|
| 原子性 | 保证 | 不保证 |
| 可见性 | 保证 | 保证 |
| 有序性 | 保证 | 保证（禁止指令重排） |
| 性能 | 较重 | 较轻 |
| 适用场景 | 复合操作 | 单个变量的读写 |

## Lock 接口

Java 5 引入了 `java.util.concurrent.locks` 包，提供了比 `synchronized` 更灵活的锁机制。

### ReentrantLock

可重入锁，功能类似 `synchronized`，但提供了更多控制。

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final Lock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock(); // 获取锁
        try {
            count++;
        } finally {
            lock.unlock(); // 释放锁（必须在 finally 中）
        }
    }

    // 尝试获取锁（非阻塞）
    public boolean tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }

    public int getCount() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }
}
```

#### 公平锁与非公平锁

```java
import java.util.concurrent.locks.ReentrantLock;

public class FairLockExample {
    // 公平锁：按照线程请求顺序获取锁
    private final ReentrantLock fairLock = new ReentrantLock(true);

    // 非公平锁（默认）：允许插队，性能更好
    private final ReentrantLock unfairLock = new ReentrantLock(false);

    public void fairMethod() {
        fairLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 获取公平锁");
        } finally {
            fairLock.unlock();
        }
    }
}
```

### ReadWriteLock

读写锁，允许多个读线程同时访问，但写线程独占访问。

```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ReadWriteLockExample {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private int data = 0;

    // 读操作（多个线程可同时读）
    public int read() {
        rwLock.readLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 正在读取");
            Thread.sleep(100);
            return data;
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // 写操作（独占访问）
    public void write(int value) {
        rwLock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 正在写入");
            Thread.sleep(100);
            data = value;
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public static void main(String[] args) {
        ReadWriteLockExample example = new ReadWriteLockExample();

        // 启动多个读线程
        for (int i = 0; i < 3; i++) {
            new Thread(() -> System.out.println("读取到: " + example.read()), "读线程-" + i).start();
        }

        // 启动写线程
        new Thread(() -> example.write(42), "写线程").start();
    }
}
```

### Condition

`Condition` 提供了类似 `wait/notify` 的功能，但更灵活。

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.LinkedList;
import java.util.Queue;

public class BoundedQueue<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;
    private final Lock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedQueue(int capacity) {
        this.capacity = capacity;
    }

    // 添加元素
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) {
                notFull.await(); // 队列满，等待
            }
            queue.offer(item);
            System.out.println("添加: " + item + ", 队列大小: " + queue.size());
            notEmpty.signal(); // 通知等待的消费者
        } finally {
            lock.unlock();
        }
    }

    // 取出元素
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                notEmpty.await(); // 队列空，等待
            }
            T item = queue.poll();
            System.out.println("取出: " + item + ", 队列大小: " + queue.size());
            notFull.signal(); // 通知等待的生产者
            return item;
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        BoundedQueue<Integer> queue = new BoundedQueue<>(5);

        // 生产者
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    queue.put(i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

        // 消费者
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    queue.take();
                    Thread.sleep(300);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

        producer.start();
        consumer.start();
    }
}
```

## 并发工具类

### CountDownLatch

允许一个或多个线程等待其他线程完成操作。

```java
import java.util.concurrent.CountDownLatch;

public class CountDownLatchExample {
    public static void main(String[] args) throws InterruptedException {
        int threadCount = 5;
        CountDownLatch latch = new CountDownLatch(threadCount);

        System.out.println("开始执行任务");

        for (int i = 0; i < threadCount; i++) {
            int taskId = i;
            new Thread(() -> {
                try {
                    Thread.sleep(1000);
                    System.out.println("任务 " + taskId + " 完成");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown(); // 计数器减 1
                }
            }).start();
        }

        latch.await(); // 等待所有任务完成
        System.out.println("所有任务执行完毕");
    }
}
```

### CyclicBarrier

循环栅栏，让一组线程到达屏障点时被阻塞，直到最后一个线程到达。

```java
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;

public class CyclicBarrierExample {
    public static void main(String[] args) {
        int threadCount = 3;

        CyclicBarrier barrier = new CyclicBarrier(threadCount, () -> {
            System.out.println("所有线程都到达屏障，继续执行");
        });

        for (int i = 0; i < threadCount; i++) {
            int threadId = i;
            new Thread(() -> {
                try {
                    System.out.println("线程 " + threadId + " 准备中...");
                    Thread.sleep((threadId + 1) * 1000);
                    System.out.println("线程 " + threadId + " 到达屏障");

                    barrier.await(); // 等待其他线程

                    System.out.println("线程 " + threadId + " 继续执行");
                } catch (InterruptedException | BrokenBarrierException e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

### Semaphore

信号量，控制同时访问特定资源的线程数量。

```java
import java.util.concurrent.Semaphore;

public class SemaphoreExample {
    public static void main(String[] args) {
        // 只允许 3 个线程同时访问
        Semaphore semaphore = new Semaphore(3);

        for (int i = 0; i < 10; i++) {
            int taskId = i;
            new Thread(() -> {
                try {
                    semaphore.acquire(); // 获取许可
                    System.out.println("线程 " + taskId + " 获取许可，开始执行");
                    Thread.sleep(2000);
                    System.out.println("线程 " + taskId + " 执行完毕");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    semaphore.release(); // 释放许可
                }
            }).start();
        }
    }
}
```

### Exchanger

用于两个线程之间交换数据。

```java
import java.util.concurrent.Exchanger;

public class ExchangerExample {
    public static void main(String[] args) {
        Exchanger<String> exchanger = new Exchanger<>();

        // 线程 1
        new Thread(() -> {
            try {
                String data = "来自线程 1 的数据";
                System.out.println("线程 1 准备交换: " + data);
                String received = exchanger.exchange(data);
                System.out.println("线程 1 收到: " + received);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 线程 2
        new Thread(() -> {
            try {
                Thread.sleep(1000);
                String data = "来自线程 2 的数据";
                System.out.println("线程 2 准备交换: " + data);
                String received = exchanger.exchange(data);
                System.out.println("线程 2 收到: " + received);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

### 原子类

`java.util.concurrent.atomic` 包提供了无锁的线程安全操作。

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.LongAdder;

public class AtomicExample {
    private AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet(); // 原子操作，线程安全
    }

    public int getCount() {
        return count.get();
    }

    // CAS 示例
    public void compareAndSet() {
        int expected = 0;
        int newValue = 10;
        boolean success = count.compareAndSet(expected, newValue);
        System.out.println("CAS 操作: " + (success ? "成功" : "失败"));
    }

    // AtomicReference 示例
    static class User {
        String name;
        int age;

        User(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }

    public void atomicReferenceExample() {
        AtomicReference<User> userRef = new AtomicReference<>(new User("张三", 20));

        User oldUser = userRef.get();
        User newUser = new User("李四", 25);

        boolean updated = userRef.compareAndSet(oldUser, newUser);
        System.out.println("更新用户: " + updated);
    }

    // LongAdder：高并发下性能更好
    public void longAdderExample() {
        LongAdder adder = new LongAdder();
        adder.increment();
        adder.add(10);
        System.out.println("LongAdder 值: " + adder.sum());
    }
}
```

## 线程池

线程池管理和复用线程，避免频繁创建销毁线程的开销。

### ThreadPoolExecutor

```java
import java.util.concurrent.*;

public class ThreadPoolExample {
    public static void main(String[] args) {
        // 手动创建线程池
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2,                      // 核心线程数
            5,                      // 最大线程数
            60L,                    // 空闲线程存活时间
            TimeUnit.SECONDS,       // 时间单位
            new LinkedBlockingQueue<>(10),  // 工作队列
            Executors.defaultThreadFactory(), // 线程工厂
            new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
        );

        // 提交任务
        for (int i = 0; i < 10; i++) {
            int taskId = i;
            executor.execute(() -> {
                System.out.println("任务 " + taskId + " 由 " +
                    Thread.currentThread().getName() + " 执行");
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }

        // 关闭线程池
        executor.shutdown();

        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
```

### Executors 工厂类

```java
import java.util.concurrent.*;

public class ExecutorsExample {
    public static void main(String[] args) {
        // 固定大小线程池
        ExecutorService fixedPool = Executors.newFixedThreadPool(3);

        // 单线程线程池
        ExecutorService singlePool = Executors.newSingleThreadExecutor();

        // 缓存线程池（线程数无限制）
        ExecutorService cachedPool = Executors.newCachedThreadPool();

        // 定时任务线程池
        ScheduledExecutorService scheduledPool = Executors.newScheduledThreadPool(2);

        // 使用示例
        fixedPool.execute(() -> System.out.println("固定线程池任务"));

        // 提交有返回值的任务
        Future<String> future = fixedPool.submit(() -> {
            Thread.sleep(1000);
            return "任务结果";
        });

        try {
            String result = future.get(); // 阻塞等待结果
            System.out.println("结果: " + result);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        // 定时任务
        scheduledPool.schedule(() -> {
            System.out.println("延迟 3 秒执行");
        }, 3, TimeUnit.SECONDS);

        // 周期性任务
        scheduledPool.scheduleAtFixedRate(() -> {
            System.out.println("每 2 秒执行一次");
        }, 0, 2, TimeUnit.SECONDS);

        // 关闭线程池
        fixedPool.shutdown();
        singlePool.shutdown();
        cachedPool.shutdown();

        try {
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        scheduledPool.shutdown();
    }
}
```

### 线程池参数详解

```java
public class ThreadPoolParameters {
    public static void main(String[] args) {
        /**
         * 核心参数说明：
         *
         * 1. corePoolSize：核心线程数
         *    - 即使空闲也会保留的线程数
         *
         * 2. maximumPoolSize：最大线程数
         *    - 线程池允许创建的最大线程数
         *
         * 3. keepAliveTime：空闲线程存活时间
         *    - 超过核心线程数的线程空闲多久后被回收
         *
         * 4. workQueue：工作队列
         *    - ArrayBlockingQueue：有界阻塞队列
         *    - LinkedBlockingQueue：无界阻塞队列
         *    - SynchronousQueue：不存储元素的队列
         *    - PriorityBlockingQueue：优先级队列
         *
         * 5. threadFactory：线程工厂
         *    - 用于创建新线程
         *
         * 6. handler：拒绝策略
         *    - AbortPolicy（默认）：抛出异常
         *    - CallerRunsPolicy：调用者线程执行
         *    - DiscardPolicy：丢弃任务
         *    - DiscardOldestPolicy：丢弃最旧任务
         */

        // 自定义线程工厂
        ThreadFactory factory = new ThreadFactory() {
            private int count = 0;

            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setName("自定义线程-" + count++);
                thread.setDaemon(false);
                return thread;
            }
        };

        // 自定义拒绝策略
        RejectedExecutionHandler handler = (r, executor) -> {
            System.out.println("任务被拒绝: " + r.toString());
        };

        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 4, 60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(2),
            factory,
            handler
        );

        // 测试线程池
        for (int i = 0; i < 10; i++) {
            int taskId = i;
            try {
                executor.execute(() -> {
                    System.out.println("执行任务 " + taskId);
                    try {
                        Thread.sleep(3000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            } catch (RejectedExecutionException e) {
                System.out.println("任务 " + taskId + " 提交失败");
            }
        }

        executor.shutdown();
    }
}
```

### 线程池最佳实践

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ThreadPoolBestPractices {

    /**
     * 推荐：手动创建线程池，明确参数
     */
    public static ThreadPoolExecutor createOptimalThreadPool() {
        int processors = Runtime.getRuntime().availableProcessors();

        // CPU 密集型任务：线程数 = CPU 核心数 + 1
        int cpuIntensiveThreads = processors + 1;

        // IO 密集型任务：线程数 = CPU 核心数 * 2
        int ioIntensiveThreads = processors * 2;

        return new ThreadPoolExecutor(
            processors,
            processors * 2,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            new CustomThreadFactory("业务线程池"),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    /**
     * 自定义线程工厂
     */
    static class CustomThreadFactory implements ThreadFactory {
        private final AtomicInteger threadNumber = new AtomicInteger(1);
        private final String namePrefix;

        public CustomThreadFactory(String namePrefix) {
            this.namePrefix = namePrefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread thread = new Thread(r, namePrefix + "-" + threadNumber.getAndIncrement());
            thread.setDaemon(false);
            thread.setPriority(Thread.NORM_PRIORITY);
            return thread;
        }
    }

    /**
     * 优雅关闭线程池
     */
    public static void shutdownGracefully(ExecutorService executor) {
        executor.shutdown(); // 不再接受新任务

        try {
            // 等待已有任务完成
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow(); // 强制关闭

                // 等待任务响应中断
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    System.err.println("线程池未能正常关闭");
                }
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) {
        ThreadPoolExecutor executor = createOptimalThreadPool();

        // 监控线程池状态
        new Thread(() -> {
            while (!executor.isTerminated()) {
                System.out.printf("活跃线程: %d, 队列任务: %d, 完成任务: %d%n",
                    executor.getActiveCount(),
                    executor.getQueue().size(),
                    executor.getCompletedTaskCount()
                );

                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    break;
                }
            }
        }).start();

        // 提交任务
        for (int i = 0; i < 20; i++) {
            int taskId = i;
            executor.execute(() -> {
                System.out.println("执行任务 " + taskId);
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        shutdownGracefully(executor);
    }
}
```

## CompletableFuture

`CompletableFuture` 是 Java 8 引入的异步编程工具，支持链式调用和组合操作。

### 基本用法

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class CompletableFutureBasics {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 创建异步任务
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            System.out.println("异步任务执行中...");
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return "任务结果";
        });

        // 阻塞获取结果
        String result = future.get();
        System.out.println("结果: " + result);

        // 不阻塞，使用回调
        CompletableFuture.supplyAsync(() -> "Hello")
            .thenApply(s -> s + " World")
            .thenAccept(System.out::println); // 打印: Hello World

        // 无返回值的异步任务
        CompletableFuture.runAsync(() -> {
            System.out.println("执行无返回值任务");
        });

        Thread.sleep(3000); // 等待异步任务完成
    }
}
```

### 链式操作

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureChaining {
    public static void main(String[] args) {
        CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤 1: 获取用户 ID");
            return 123;
        })
        .thenApply(userId -> {
            System.out.println("步骤 2: 根据 ID 查询用户信息");
            return "用户-" + userId;
        })
        .thenApply(userName -> {
            System.out.println("步骤 3: 处理用户名");
            return userName.toUpperCase();
        })
        .thenAccept(result -> {
            System.out.println("最终结果: " + result);
        })
        .exceptionally(ex -> {
            System.out.println("发生异常: " + ex.getMessage());
            return null;
        });

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

### 组合多个 Future

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class CompletableFutureCombining {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 模拟三个独立的异步任务
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "任务 1 结果";
        });

        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            sleep(2000);
            return "任务 2 结果";
        });

        CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "任务 3 结果";
        });

        // thenCombine：组合两个 Future
        CompletableFuture<String> combined = future1.thenCombine(future2, (r1, r2) -> {
            return r1 + " + " + r2;
        });
        System.out.println("组合结果: " + combined.get());

        // allOf：等待所有 Future 完成
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(future1, future2, future3);
        allFutures.get(); // 等待所有任务完成
        System.out.println("所有任务完成");

        // anyOf：等待任意一个 Future 完成
        CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(future1, future2, future3);
        System.out.println("最快完成的任务: " + anyFuture.get());
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

### 异常处理

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureException {
    public static void main(String[] args) {
        // exceptionally：处理异常
        CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("随机异常");
            }
            return "成功";
        })
        .exceptionally(ex -> {
            System.out.println("捕获异常: " + ex.getMessage());
            return "默认值";
        })
        .thenAccept(result -> System.out.println("结果: " + result));

        // handle：同时处理成功和异常情况
        CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("错误");
            }
            return "OK";
        })
        .handle((result, ex) -> {
            if (ex != null) {
                return "发生异常: " + ex.getMessage();
            }
            return "正常: " + result;
        })
        .thenAccept(System.out::println);

        // whenComplete：无论成功失败都会执行
        CompletableFuture.supplyAsync(() -> {
            return "数据";
        })
        .whenComplete((result, ex) -> {
            if (ex != null) {
                System.out.println("失败: " + ex);
            } else {
                System.out.println("成功: " + result);
            }
        });

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

### 实际应用示例

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureRealWorld {
    private static ExecutorService executor = Executors.newFixedThreadPool(4);

    // 模拟查询用户信息
    public static CompletableFuture<String> getUserInfo(int userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "用户-" + userId;
        }, executor);
    }

    // 模拟查询订单信息
    public static CompletableFuture<String> getOrderInfo(int userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "订单-" + userId;
        }, executor);
    }

    // 模拟查询积分信息
    public static CompletableFuture<Integer> getPoints(int userId) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return userId * 100;
        }, executor);
    }

    public static void main(String[] args) {
        int userId = 123;

        // 并行查询多个数据源
        CompletableFuture<String> userFuture = getUserInfo(userId);
        CompletableFuture<String> orderFuture = getOrderInfo(userId);
        CompletableFuture<Integer> pointsFuture = getPoints(userId);

        // 组合所有结果
        CompletableFuture<String> resultFuture = userFuture
            .thenCombine(orderFuture, (user, order) -> user + ", " + order)
            .thenCombine(pointsFuture, (info, points) -> info + ", 积分: " + points);

        resultFuture.thenAccept(result -> {
            System.out.println("查询结果: " + result);
        }).exceptionally(ex -> {
            System.out.println("查询失败: " + ex.getMessage());
            return null;
        });

        // 等待完成
        try {
            resultFuture.get();
        } catch (Exception e) {
            e.printStackTrace();
        }

        executor.shutdown();
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

## 并发最佳实践

### 避免常见陷阱

```java
public class ConcurrencyPitfalls {
    // 错误：双重检查锁定的错误实现
    class Singleton {
        private static Singleton instance;

        // 问题：可能返回未完全初始化的对象
        public static Singleton getInstance() {
            if (instance == null) {
                synchronized (Singleton.class) {
                    if (instance == null) {
                        instance = new Singleton(); // 非原子操作
                    }
                }
            }
            return instance;
        }
    }

    // 正确：使用 volatile
    class CorrectSingleton {
        private static volatile CorrectSingleton instance;

        public static CorrectSingleton getInstance() {
            if (instance == null) {
                synchronized (CorrectSingleton.class) {
                    if (instance == null) {
                        instance = new CorrectSingleton();
                    }
                }
            }
            return instance;
        }
    }

    // 更好：使用静态内部类（推荐）
    class BestSingleton {
        private BestSingleton() {}

        private static class Holder {
            private static final BestSingleton INSTANCE = new BestSingleton();
        }

        public static BestSingleton getInstance() {
            return Holder.INSTANCE;
        }
    }
}
```

### 性能优化

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class PerformanceOptimization {
    // 使用并发集合
    private ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();
    private CopyOnWriteArrayList<String> listeners = new CopyOnWriteArrayList<>();

    // 减小锁粒度
    class FineGrainedLocking {
        private final Object lock1 = new Object();
        private final Object lock2 = new Object();
        private int value1;
        private int value2;

        public void updateValue1(int value) {
            synchronized (lock1) { // 只锁定 value1
                value1 = value;
            }
        }

        public void updateValue2(int value) {
            synchronized (lock2) { // 只锁定 value2
                value2 = value;
            }
        }
    }

    // 使用读写锁优化读多写少场景
    class OptimizedCache {
        private final java.util.concurrent.locks.ReadWriteLock rwLock =
            new java.util.concurrent.locks.ReentrantReadWriteLock();
        private final java.util.Map<String, String> map = new java.util.HashMap<>();

        public String get(String key) {
            rwLock.readLock().lock();
            try {
                return map.get(key);
            } finally {
                rwLock.readLock().unlock();
            }
        }

        public void put(String key, String value) {
            rwLock.writeLock().lock();
            try {
                map.put(key, value);
            } finally {
                rwLock.writeLock().unlock();
            }
        }
    }
}
```

### 线程安全的设计原则

```java
// 1. 不可变对象（线程安全）
final class ImmutablePerson {
    private final String name;
    private final int age;

    public ImmutablePerson(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}

// 2. 线程封闭（ThreadLocal）
class ThreadLocalExample {
    private static ThreadLocal<Integer> threadLocal = ThreadLocal.withInitial(() -> 0);

    public void increment() {
        threadLocal.set(threadLocal.get() + 1);
    }

    public int get() {
        return threadLocal.get();
    }
}

// 3. 安全发布
class SafePublication {
    private volatile Object object; // 使用 volatile 确保可见性

    public void publish(Object obj) {
        object = obj;
    }
}
```

## 总结

Java 并发编程是一个复杂但强大的主题。主要要点：

1. **线程基础**：理解线程的创建、生命周期和基本操作
2. **同步机制**：正确使用 `synchronized` 和 `volatile`
3. **显式锁**：灵活使用 `Lock` 接口和 `ReadWriteLock`
4. **并发工具**：善用 `CountDownLatch`、`Semaphore` 等工具类
5. **线程池**：合理配置线程池参数，避免资源浪费
6. **异步编程**：使用 `CompletableFuture` 简化异步操作
7. **最佳实践**：遵循线程安全设计原则，避免常见陷阱

掌握这些知识将帮助你编写高效、可靠的并发程序。

## 参考资源

- 《Java 并发编程实战》
- 《Java 并发编程的艺术》
- Oracle Java 官方文档
- JDK `java.util.concurrent` 包文档
