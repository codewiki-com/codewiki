---
title: Java Lock 接口详解
description: 深入理解 Java Lock 接口体系：Lock、ReentrantLock、ReadWriteLock、StampedLock、Condition 与 tryLock 机制
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 并发
  - Lock
  - ReentrantLock
  - ReadWriteLock
  - StampedLock
status: imported
origin: old/src/content/docs/java/lock-interfaces.zh.md
divergence: 0.189
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: 并发编程
  order: 6
  lastUpdated: 2026-01-07
---

## 概念解释

Lock 接口是 Java 5 引入的显式锁机制，位于 `java.util.concurrent.locks` 包中。它提供了比 `synchronized` 关键字更灵活、更强大的线程同步能力。

### 历史背景

在 Java 5 之前，线程同步只能依赖 `synchronized` 关键字。虽然 `synchronized` 简单易用，但存在以下局限：

- **不可中断**：线程在等待获取锁时无法响应中断
- **不可超时**：无法设置获取锁的超时时间
- **不可尝试**：无法尝试获取锁而不阻塞
- **单一条件**：只能使用一个隐式的等待/通知条件

Doug Lea 设计的 `java.util.concurrent.locks` 包解决了这些问题，提供了更细粒度的锁控制。

### 解决什么问题

Lock 接口及其实现类主要解决以下问题：

1. **灵活的锁获取**：支持可中断、可超时、可尝试的锁获取方式
2. **公平性控制**：支持公平锁和非公平锁的选择
3. **多条件等待**：支持多个 Condition 对象，实现更精细的线程协调
4. **读写分离**：通过 ReadWriteLock 支持读写锁分离，提高并发性能
5. **乐观读**：StampedLock 支持乐观读模式，进一步提升读多场景的性能

## 核心原理

### Lock 接口的底层机制

Lock 的实现基于 **AbstractQueuedSynchronizer (AQS)** 框架。AQS 是一个用于构建锁和同步器的基础框架，它使用一个 `volatile int state` 变量表示同步状态，并通过 **CLH 队列**（一种 FIFO 双向链表）管理等待线程。

```
+--------+    +--------+    +--------+    +--------+
|  Head  | -> | Node 1 | -> | Node 2 | -> |  Tail  |
| (虚节点)|    | Thread1|    | Thread2|    | ThreadN|
+--------+    +--------+    +--------+    +--------+
```

### AQS 核心机制

```java
// AQS 核心代码简化示意
public abstract class AbstractQueuedSynchronizer {
    // 同步状态
    private volatile int state;

    // 获取独占锁
    public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }

    // 释放独占锁
    public final boolean release(int arg) {
        if (tryRelease(arg)) {
            Node h = head;
            if (h != null && h.waitStatus != 0)
                unparkSuccessor(h);
            return true;
        }
        return false;
    }

    // 由子类实现的模板方法
    protected boolean tryAcquire(int arg) {
        throw new UnsupportedOperationException();
    }

    protected boolean tryRelease(int arg) {
        throw new UnsupportedOperationException();
    }
}
```

### 锁的内存语义

Lock 的 `lock()` 和 `unlock()` 方法具有与 `volatile` 变量读写相同的内存语义：

- **lock()** 操作：具有 volatile 读的内存语义，会从主内存读取共享变量
- **unlock()** 操作：具有 volatile 写的内存语义，会将修改刷新到主内存

这确保了在 lock 和 unlock 之间的操作对其他线程可见。

## 核心要点

### Lock 接口核心方法

| 方法 | 说明 | 特点 |
|------|------|------|
| `lock()` | 获取锁，阻塞直到成功 | 不可中断 |
| `lockInterruptibly()` | 可中断地获取锁 | 响应中断 |
| `tryLock()` | 尝试非阻塞获取锁 | 立即返回 |
| `tryLock(time, unit)` | 超时获取锁 | 可设置等待时间 |
| `unlock()` | 释放锁 | 必须在 finally 中调用 |
| `newCondition()` | 创建条件变量 | 支持多条件等待 |

### Lock 接口家族

```
                    Lock (接口)
                        |
        +---------------+---------------+
        |                               |
  ReentrantLock                   ReadWriteLock (接口)
   (可重入锁)                            |
                                 ReentrantReadWriteLock
                                   (可重入读写锁)

        StampedLock (独立类，非 Lock 接口实现)
        (读写锁 + 乐观读)
```

### 各锁类型对比

| 特性 | synchronized | ReentrantLock | ReadWriteLock | StampedLock |
|------|-------------|---------------|---------------|-------------|
| 实现方式 | JVM 内置 | Java 实现 | Java 实现 | Java 实现 |
| 可中断 | 否 | 是 | 是 | 是 |
| 可超时 | 否 | 是 | 是 | 是 |
| 公平锁 | 否 | 可选 | 可选 | 否 |
| 条件变量 | 单一 | 多个 | 多个 | 不支持 |
| 可重入 | 是 | 是 | 是 | 否 |
| 乐观读 | 否 | 否 | 否 | 是 |
| 锁升级 | - | - | 不支持 | 支持 |
| 锁降级 | - | - | 支持 | 支持 |

## 代码示例

### Lock 接口基本用法

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class LockBasicExample {
    private final Lock lock = new ReentrantLock();
    private int count = 0;

    /**
     * 标准的 Lock 使用模式
     * 注意：unlock() 必须放在 finally 块中确保释放
     */
    public void increment() {
        lock.lock();  // 获取锁
        try {
            count++;
            System.out.println(Thread.currentThread().getName() + ": " + count);
        } finally {
            lock.unlock();  // 必须在 finally 中释放锁
        }
    }

    public int getCount() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        LockBasicExample example = new LockBasicExample();

        // 创建多个线程并发访问
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    example.increment();
                }
            });
            threads[i].start();
        }

        // 等待所有线程完成
        for (Thread t : threads) {
            t.join();
        }

        System.out.println("最终计数: " + example.getCount());
    }
}
```

### ReentrantLock 高级特性

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockAdvanced {
    // 公平锁：按请求顺序获取锁
    private final ReentrantLock fairLock = new ReentrantLock(true);

    // 非公平锁（默认）：允许插队，性能更好
    private final ReentrantLock unfairLock = new ReentrantLock(false);

    /**
     * 可中断的锁获取
     * 线程在等待锁时可以响应中断
     */
    public void interruptibleLock() throws InterruptedException {
        fairLock.lockInterruptibly();
        try {
            System.out.println("获取到可中断锁");
            Thread.sleep(1000);
        } finally {
            fairLock.unlock();
        }
    }

    /**
     * tryLock() 非阻塞尝试获取锁
     * 立即返回，不会阻塞线程
     */
    public boolean tryLockExample() {
        if (unfairLock.tryLock()) {
            try {
                System.out.println(Thread.currentThread().getName() + " 获取锁成功");
                return true;
            } finally {
                unfairLock.unlock();
            }
        } else {
            System.out.println(Thread.currentThread().getName() + " 获取锁失败，执行其他逻辑");
            return false;
        }
    }

    /**
     * tryLock(timeout) 超时获取锁
     * 在指定时间内尝试获取锁
     */
    public boolean tryLockWithTimeout() {
        try {
            // 最多等待 2 秒
            if (unfairLock.tryLock(2, TimeUnit.SECONDS)) {
                try {
                    System.out.println("在超时前获取到锁");
                    return true;
                } finally {
                    unfairLock.unlock();
                }
            } else {
                System.out.println("超时未能获取锁");
                return false;
            }
        } catch (InterruptedException e) {
            System.out.println("等待锁时被中断");
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * 锁的可重入性演示
     * 同一线程可以多次获取同一把锁
     */
    public void reentrantDemo() {
        unfairLock.lock();  // 第一次获取
        try {
            System.out.println("第一层锁，持有计数: " + unfairLock.getHoldCount());

            unfairLock.lock();  // 第二次获取（可重入）
            try {
                System.out.println("第二层锁，持有计数: " + unfairLock.getHoldCount());

                unfairLock.lock();  // 第三次获取
                try {
                    System.out.println("第三层锁，持有计数: " + unfairLock.getHoldCount());
                } finally {
                    unfairLock.unlock();
                }

            } finally {
                unfairLock.unlock();
            }

        } finally {
            unfairLock.unlock();
        }
        System.out.println("完全释放后，持有计数: " + unfairLock.getHoldCount());
    }

    /**
     * 锁状态查询
     */
    public void lockStatusQuery() {
        System.out.println("是否公平锁: " + fairLock.isFair());
        System.out.println("是否被锁定: " + fairLock.isLocked());
        System.out.println("是否被当前线程持有: " + fairLock.isHeldByCurrentThread());
        System.out.println("等待队列长度: " + fairLock.getQueueLength());
    }

    public static void main(String[] args) {
        ReentrantLockAdvanced demo = new ReentrantLockAdvanced();

        System.out.println("=== 可重入性演示 ===");
        demo.reentrantDemo();

        System.out.println("\n=== tryLock 演示 ===");
        demo.tryLockExample();

        System.out.println("\n=== 锁状态查询 ===");
        demo.lockStatusQuery();
    }
}
```

### ReadWriteLock 读写锁

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * 基于 ReadWriteLock 的线程安全缓存实现
 * 读操作共享，写操作独占
 */
public class ReadWriteLockCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();

    /**
     * 读取缓存 - 允许多个线程同时读取
     */
    public V get(K key) {
        rwLock.readLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 读取: " + key);
            simulateDelay(100);  // 模拟耗时操作
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * 写入缓存 - 独占访问
     */
    public void put(K key, V value) {
        rwLock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 写入: " + key);
            simulateDelay(200);
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * 删除缓存 - 独占访问
     */
    public V remove(K key) {
        rwLock.writeLock().lock();
        try {
            return cache.remove(key);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * 锁降级示例：写锁降级为读锁
     * 使用场景：更新数据后需要立即读取
     */
    public V updateAndGet(K key, V value) {
        rwLock.writeLock().lock();
        try {
            // 更新数据
            cache.put(key, value);

            // 获取读锁（在持有写锁时允许）
            rwLock.readLock().lock();
        } finally {
            // 释放写锁，降级为读锁
            rwLock.writeLock().unlock();
        }

        try {
            // 此时只持有读锁，其他线程可以并发读取
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * 带缓存检查的写入
     * 演示读锁不能升级为写锁
     */
    public void putIfAbsent(K key, V value) {
        // 先用读锁检查
        rwLock.readLock().lock();
        try {
            if (cache.containsKey(key)) {
                return;  // 已存在，直接返回
            }
        } finally {
            rwLock.readLock().unlock();
        }

        // 必须先释放读锁，再获取写锁（不支持升级）
        rwLock.writeLock().lock();
        try {
            // 双重检查，因为释放读锁后可能有其他线程写入
            if (!cache.containsKey(key)) {
                cache.put(key, value);
            }
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public int size() {
        rwLock.readLock().lock();
        try {
            return cache.size();
        } finally {
            rwLock.readLock().unlock();
        }
    }

    private void simulateDelay(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        ReadWriteLockCache<String, String> cache = new ReadWriteLockCache<>();

        // 初始化数据
        cache.put("key1", "value1");
        cache.put("key2", "value2");

        // 启动多个读线程
        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                for (int j = 0; j < 3; j++) {
                    cache.get("key1");
                }
            }, "读线程-" + i).start();
        }

        // 启动写线程
        new Thread(() -> {
            cache.put("key3", "value3");
        }, "写线程").start();

        Thread.sleep(3000);
        System.out.println("缓存大小: " + cache.size());
    }
}
```

### StampedLock 乐观读锁

```java
import java.util.concurrent.locks.StampedLock;

/**
 * StampedLock 示例
 * 支持三种访问模式：写锁、悲观读锁、乐观读
 */
public class StampedLockExample {
    private final StampedLock sl = new StampedLock();
    private double x, y;  // 二维坐标点

    /**
     * 写操作 - 独占访问
     */
    public void move(double deltaX, double deltaY) {
        // 获取写锁，返回一个 stamp
        long stamp = sl.writeLock();
        try {
            x += deltaX;
            y += deltaY;
            System.out.println("移动到: (" + x + ", " + y + ")");
        } finally {
            // 使用 stamp 释放锁
            sl.unlockWrite(stamp);
        }
    }

    /**
     * 乐观读 - 最佳性能的读取方式
     * 不阻塞写线程，但需要验证数据一致性
     */
    public double distanceFromOrigin() {
        // 获取乐观读标记（不是真正的锁）
        long stamp = sl.tryOptimisticRead();

        // 读取数据到局部变量
        double currentX = x;
        double currentY = y;

        // 验证在读取期间是否有写操作
        if (!sl.validate(stamp)) {
            // 乐观读失败，升级为悲观读锁
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }

        // 使用读取的数据进行计算
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }

    /**
     * 悲观读 - 传统的读锁方式
     */
    public double[] getPosition() {
        long stamp = sl.readLock();
        try {
            return new double[]{x, y};
        } finally {
            sl.unlockRead(stamp);
        }
    }

    /**
     * 锁升级示例：读锁升级为写锁
     * 适用于条件更新场景
     */
    public void moveIfAtOrigin(double newX, double newY) {
        // 首先获取读锁
        long stamp = sl.readLock();
        try {
            // 检查条件
            while (x == 0.0 && y == 0.0) {
                // 尝试升级为写锁
                long ws = sl.tryConvertToWriteLock(stamp);
                if (ws != 0L) {
                    // 升级成功
                    stamp = ws;
                    x = newX;
                    y = newY;
                    break;
                } else {
                    // 升级失败，释放读锁，获取写锁
                    sl.unlockRead(stamp);
                    stamp = sl.writeLock();
                    // 注意：获取写锁后需要重新检查条件
                }
            }
        } finally {
            sl.unlock(stamp);  // 通用解锁方法
        }
    }

    /**
     * 锁降级示例
     */
    public void setAndGet(double newX, double newY) {
        long stamp = sl.writeLock();
        try {
            x = newX;
            y = newY;

            // 降级为读锁
            stamp = sl.tryConvertToReadLock(stamp);
            if (stamp == 0L) {
                throw new IllegalStateException("锁降级失败");
            }

            // 现在可以继续读取，其他线程也可以并发读取
            System.out.println("设置并读取: (" + x + ", " + y + ")");
        } finally {
            sl.unlock(stamp);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        StampedLockExample point = new StampedLockExample();

        // 乐观读线程
        Thread reader = new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                double distance = point.distanceFromOrigin();
                System.out.println("距离原点: " + distance);
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    break;
                }
            }
        });

        // 写线程
        Thread writer = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                point.move(1.0, 1.0);
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    break;
                }
            }
        });

        reader.start();
        writer.start();

        reader.join();
        writer.join();
    }
}
```

### Condition 条件变量

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 使用 Condition 实现生产者-消费者模式
 * 多条件变量实现更精细的线程协调
 */
public class ConditionBoundedBuffer<T> {
    private final Queue<T> buffer = new LinkedList<>();
    private final int capacity;

    private final Lock lock = new ReentrantLock();
    // 两个条件变量：非满和非空
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public ConditionBoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    /**
     * 生产者：添加元素
     */
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            // 缓冲区满时等待
            while (buffer.size() == capacity) {
                System.out.println(Thread.currentThread().getName() + " 等待：缓冲区已满");
                notFull.await();
            }

            buffer.offer(item);
            System.out.println(Thread.currentThread().getName() + " 添加: " + item +
                             ", 缓冲区大小: " + buffer.size());

            // 通知等待的消费者
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 消费者：取出元素
     */
    public T take() throws InterruptedException {
        lock.lock();
        try {
            // 缓冲区空时等待
            while (buffer.isEmpty()) {
                System.out.println(Thread.currentThread().getName() + " 等待：缓冲区为空");
                notEmpty.await();
            }

            T item = buffer.poll();
            System.out.println(Thread.currentThread().getName() + " 取出: " + item +
                             ", 缓冲区大小: " + buffer.size());

            // 通知等待的生产者
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 带超时的取出操作
     */
    public T poll(long timeout, java.util.concurrent.TimeUnit unit)
            throws InterruptedException {
        long nanosTimeout = unit.toNanos(timeout);
        lock.lock();
        try {
            while (buffer.isEmpty()) {
                if (nanosTimeout <= 0L) {
                    return null;  // 超时返回 null
                }
                // awaitNanos 返回剩余等待时间
                nanosTimeout = notEmpty.awaitNanos(nanosTimeout);
            }
            T item = buffer.poll();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return buffer.size();
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        ConditionBoundedBuffer<Integer> buffer = new ConditionBoundedBuffer<>(5);

        // 生产者线程
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    buffer.put(i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "生产者");

        // 消费者线程
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    buffer.take();
                    Thread.sleep(300);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "消费者");

        producer.start();
        consumer.start();
    }
}
```

### Condition 实现精确唤醒

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 使用多个 Condition 实现线程的精确唤醒
 * 示例：三个线程轮流打印 A、B、C
 */
public class ConditionPreciseWakeup {
    private final Lock lock = new ReentrantLock();
    private final Condition conditionA = lock.newCondition();
    private final Condition conditionB = lock.newCondition();
    private final Condition conditionC = lock.newCondition();

    private int currentThread = 1;  // 1:A, 2:B, 3:C

    public void printA() {
        lock.lock();
        try {
            while (currentThread != 1) {
                conditionA.await();
            }
            System.out.print("A");
            currentThread = 2;
            conditionB.signal();  // 精确唤醒线程 B
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    public void printB() {
        lock.lock();
        try {
            while (currentThread != 2) {
                conditionB.await();
            }
            System.out.print("B");
            currentThread = 3;
            conditionC.signal();  // 精确唤醒线程 C
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    public void printC() {
        lock.lock();
        try {
            while (currentThread != 3) {
                conditionC.await();
            }
            System.out.println("C");
            currentThread = 1;
            conditionA.signal();  // 精确唤醒线程 A
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        ConditionPreciseWakeup printer = new ConditionPreciseWakeup();

        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                printer.printA();
            }
        }, "线程-A").start();

        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                printer.printB();
            }
        }, "线程-B").start();

        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                printer.printC();
            }
        }, "线程-C").start();
    }
}
```

### tryLock 避免死锁

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 使用 tryLock 避免死锁的示例
 */
public class DeadlockAvoidance {
    private final Lock lock1 = new ReentrantLock();
    private final Lock lock2 = new ReentrantLock();

    /**
     * 可能导致死锁的传统方式
     */
    public void deadlockProne1() {
        lock1.lock();
        try {
            Thread.sleep(100);
            lock2.lock();
            try {
                System.out.println("操作 1 完成");
            } finally {
                lock2.unlock();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock1.unlock();
        }
    }

    public void deadlockProne2() {
        lock2.lock();  // 注意：获取锁的顺序相反
        try {
            Thread.sleep(100);
            lock1.lock();
            try {
                System.out.println("操作 2 完成");
            } finally {
                lock1.unlock();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock2.unlock();
        }
    }

    /**
     * 使用 tryLock 避免死锁
     */
    public boolean safeOperation() {
        boolean gotLock1 = false;
        boolean gotLock2 = false;

        try {
            // 尝试获取两个锁，设置超时时间
            gotLock1 = lock1.tryLock(100, TimeUnit.MILLISECONDS);
            gotLock2 = lock2.tryLock(100, TimeUnit.MILLISECONDS);

            if (gotLock1 && gotLock2) {
                // 成功获取两个锁，执行业务逻辑
                System.out.println(Thread.currentThread().getName() + " 成功获取两个锁");
                return true;
            } else {
                // 未能获取所有锁，释放已获取的锁
                System.out.println(Thread.currentThread().getName() + " 获取锁失败，稍后重试");
                return false;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } finally {
            // 释放已获取的锁
            if (gotLock2) {
                lock2.unlock();
            }
            if (gotLock1) {
                lock1.unlock();
            }
        }
    }

    /**
     * 带重试的安全操作
     */
    public boolean safeOperationWithRetry(int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            if (safeOperation()) {
                return true;
            }
            // 随机等待，避免活锁
            try {
                Thread.sleep((long) (Math.random() * 100));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    public static void main(String[] args) throws InterruptedException {
        DeadlockAvoidance demo = new DeadlockAvoidance();

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                demo.safeOperationWithRetry(3);
            }
        }, "线程-1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                demo.safeOperationWithRetry(3);
            }
        }, "线程-2");

        t1.start();
        t2.start();

        t1.join();
        t2.join();

        System.out.println("所有操作完成");
    }
}
```

## 最佳实践

### 始终在 finally 块中释放锁

```java
// 正确示例
Lock lock = new ReentrantLock();
lock.lock();
try {
    // 业务逻辑
} finally {
    lock.unlock();  // 确保锁被释放
}

// 错误示例 - 可能导致锁泄漏
lock.lock();
// 业务逻辑
lock.unlock();  // 如果抛出异常，锁不会被释放
```

### 使用 try-with-resources 风格（自定义封装）

```java
/**
 * AutoCloseable 封装的锁
 */
public class AutoLock implements AutoCloseable {
    private final Lock lock;

    public AutoLock(Lock lock) {
        this.lock = lock;
        lock.lock();
    }

    @Override
    public void close() {
        lock.unlock();
    }

    public static AutoLock acquire(Lock lock) {
        return new AutoLock(lock);
    }
}

// 使用示例
Lock lock = new ReentrantLock();
try (AutoLock ignored = AutoLock.acquire(lock)) {
    // 业务逻辑
}  // 自动释放锁
```

### 根据场景选择合适的锁

```java
public class LockSelectionGuide {
    // 场景 1: 简单互斥，性能要求高
    // 选择: synchronized（JVM 优化后性能很好）
    public synchronized void simpleSync() {
        // 简单操作
    }

    // 场景 2: 需要可中断、超时或尝试获取
    // 选择: ReentrantLock
    private final ReentrantLock reentrantLock = new ReentrantLock();
    public void flexibleLocking() throws InterruptedException {
        if (reentrantLock.tryLock(1, TimeUnit.SECONDS)) {
            try {
                // 操作
            } finally {
                reentrantLock.unlock();
            }
        }
    }

    // 场景 3: 读多写少
    // 选择: ReadWriteLock 或 StampedLock
    private final java.util.concurrent.locks.ReadWriteLock rwLock =
        new java.util.concurrent.locks.ReentrantReadWriteLock();

    public void readHeavyOperation() {
        rwLock.readLock().lock();
        try {
            // 读操作
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // 场景 4: 极高读取性能要求
    // 选择: StampedLock 乐观读
    private final java.util.concurrent.locks.StampedLock stampedLock =
        new java.util.concurrent.locks.StampedLock();

    public Object optimisticRead() {
        long stamp = stampedLock.tryOptimisticRead();
        Object data = readData();
        if (!stampedLock.validate(stamp)) {
            stamp = stampedLock.readLock();
            try {
                data = readData();
            } finally {
                stampedLock.unlockRead(stamp);
            }
        }
        return data;
    }

    private Object readData() {
        return new Object();
    }
}
```

### 公平锁 vs 非公平锁的选择

```java
/**
 * 公平锁 vs 非公平锁选择指南
 */
public class FairVsUnfairLock {
    // 非公平锁（默认）- 大多数情况下的首选
    // 优点：更高的吞吐量
    // 缺点：可能导致线程饥饿
    private final ReentrantLock unfairLock = new ReentrantLock(false);

    // 公平锁 - 特殊场景使用
    // 优点：避免线程饥饿，顺序可预测
    // 缺点：吞吐量较低
    private final ReentrantLock fairLock = new ReentrantLock(true);

    /**
     * 何时使用公平锁：
     * 1. 线程持有锁的时间较长
     * 2. 线程请求锁的间隔较长
     * 3. 需要严格的 FIFO 顺序
     * 4. 不能容忍线程饥饿
     */
}
```

### 减小锁粒度

```java
/**
 * 锁粒度优化示例
 */
public class LockGranularity {
    // 粗粒度锁 - 简单但并发性低
    private final Object coarseLock = new Object();
    private int value1;
    private int value2;

    public void coarseGrained() {
        synchronized (coarseLock) {
            value1++;
            value2++;
        }
    }

    // 细粒度锁 - 复杂但并发性高
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();

    public void fineGrained() {
        synchronized (lock1) {
            value1++;
        }
        synchronized (lock2) {
            value2++;
        }
    }

    // 分段锁 - ConcurrentHashMap 使用的技术
    private static final int SEGMENT_COUNT = 16;
    private final Object[] segmentLocks = new Object[SEGMENT_COUNT];

    {
        for (int i = 0; i < SEGMENT_COUNT; i++) {
            segmentLocks[i] = new Object();
        }
    }

    public void segmentedLock(int key) {
        int segment = key % SEGMENT_COUNT;
        synchronized (segmentLocks[segment]) {
            // 只锁定对应分段
        }
    }
}
```

## 常见陷阱

### 忘记释放锁

```java
// 错误：异常时锁不会释放
public void badExample() {
    lock.lock();
    doSomething();  // 如果抛出异常
    lock.unlock();  // 这行永远不会执行
}

// 正确：使用 finally 确保释放
public void goodExample() {
    lock.lock();
    try {
        doSomething();
    } finally {
        lock.unlock();
    }
}
```

### 锁的错误使用导致死锁

```java
// 死锁示例：不同顺序获取多个锁
class Account {
    private final ReentrantLock lock = new ReentrantLock();
    private int balance;

    // 可能导致死锁
    public void transferBad(Account to, int amount) {
        this.lock.lock();  // 线程 A 锁住账户 1
        try {
            to.lock.lock();  // 等待账户 2
            try {
                // 转账逻辑
            } finally {
                to.lock.unlock();
            }
        } finally {
            this.lock.unlock();
        }
    }
}

// 解决方案：按固定顺序获取锁
public void transferGood(Account to, int amount) {
    Account first = System.identityHashCode(this) < System.identityHashCode(to) ? this : to;
    Account second = first == this ? to : this;

    first.lock.lock();
    try {
        second.lock.lock();
        try {
            // 转账逻辑
        } finally {
            second.lock.unlock();
        }
    } finally {
        first.lock.unlock();
    }
}
```

### ReadWriteLock 锁升级失败

```java
// 错误：读锁不能升级为写锁
public void badUpgrade() {
    rwLock.readLock().lock();
    try {
        if (needsUpdate()) {
            // 这会导致死锁！读锁未释放就获取写锁
            rwLock.writeLock().lock();  // 永远阻塞
            try {
                update();
            } finally {
                rwLock.writeLock().unlock();
            }
        }
    } finally {
        rwLock.readLock().unlock();
    }
}

// 正确：先释放读锁，再获取写锁
public void goodUpgrade() {
    rwLock.readLock().lock();
    boolean needsUpdate;
    try {
        needsUpdate = needsUpdate();
    } finally {
        rwLock.readLock().unlock();  // 先释放读锁
    }

    if (needsUpdate) {
        rwLock.writeLock().lock();
        try {
            // 重新检查条件（可能其他线程已更新）
            if (needsUpdate()) {
                update();
            }
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

### StampedLock 误用

```java
// 错误：StampedLock 不可重入
private final StampedLock sl = new StampedLock();

public void badReentrant() {
    long stamp = sl.writeLock();
    try {
        nestedMethod();  // 内部再次获取锁会死锁
    } finally {
        sl.unlockWrite(stamp);
    }
}

private void nestedMethod() {
    long stamp = sl.writeLock();  // 死锁！
    try {
        // ...
    } finally {
        sl.unlockWrite(stamp);
    }
}

// 错误：Condition 不支持
public void badCondition() {
    // StampedLock 不支持 Condition
    // Condition condition = sl.newCondition();  // 编译错误
}
```

### 中断处理不当

```java
// 错误：忽略中断
public void badInterruptHandling() {
    try {
        lock.lockInterruptibly();
        try {
            doWork();
        } finally {
            lock.unlock();
        }
    } catch (InterruptedException e) {
        // 错误：吞掉中断
        e.printStackTrace();
    }
}

// 正确：恢复中断状态或向上抛出
public void goodInterruptHandling() throws InterruptedException {
    lock.lockInterruptibly();
    try {
        doWork();
    } finally {
        lock.unlock();
    }
}

// 或者恢复中断状态
public void goodInterruptHandling2() {
    try {
        lock.lockInterruptibly();
        try {
            doWork();
        } finally {
            lock.unlock();
        }
    } catch (InterruptedException e) {
        // 恢复中断状态
        Thread.currentThread().interrupt();
    }
}
```

## 性能考量

### 锁的性能对比测试

```java
import java.util.concurrent.locks.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 不同锁机制的性能对比
 */
public class LockPerformanceComparison {
    private static final int ITERATIONS = 1_000_000;
    private static final int THREADS = 4;

    private int synchronizedCounter = 0;
    private int lockCounter = 0;
    private final AtomicInteger atomicCounter = new AtomicInteger(0);
    private final ReentrantLock lock = new ReentrantLock();

    public synchronized void synchronizedIncrement() {
        synchronizedCounter++;
    }

    public void lockIncrement() {
        lock.lock();
        try {
            lockCounter++;
        } finally {
            lock.unlock();
        }
    }

    public void atomicIncrement() {
        atomicCounter.incrementAndGet();
    }

    public static void main(String[] args) throws InterruptedException {
        LockPerformanceComparison test = new LockPerformanceComparison();

        // 测试 synchronized
        long start = System.currentTimeMillis();
        runTest(test::synchronizedIncrement);
        System.out.println("synchronized: " + (System.currentTimeMillis() - start) + "ms");

        // 测试 ReentrantLock
        start = System.currentTimeMillis();
        runTest(test::lockIncrement);
        System.out.println("ReentrantLock: " + (System.currentTimeMillis() - start) + "ms");

        // 测试 AtomicInteger
        start = System.currentTimeMillis();
        runTest(test::atomicIncrement);
        System.out.println("AtomicInteger: " + (System.currentTimeMillis() - start) + "ms");
    }

    private static void runTest(Runnable action) throws InterruptedException {
        Thread[] threads = new Thread[THREADS];
        for (int i = 0; i < THREADS; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < ITERATIONS / THREADS; j++) {
                    action.run();
                }
            });
            threads[i].start();
        }
        for (Thread t : threads) {
            t.join();
        }
    }
}
```

### 性能优化建议

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 简单互斥 | synchronized | JVM 优化，无显式释放风险 |
| 读多写少 | ReadWriteLock / StampedLock | 允许并发读取 |
| 极高读取频率 | StampedLock 乐观读 | 无锁读取 |
| 简单计数器 | AtomicInteger | CAS 无锁操作 |
| 复杂对象更新 | ReentrantLock | 灵活控制 |
| 高竞争计数 | LongAdder | 分段减少竞争 |

### 锁竞争分析

```java
/**
 * 锁竞争监控
 */
public class LockContentionMonitor {
    private final ReentrantLock lock = new ReentrantLock();

    public void monitorContention() {
        // 检查是否有线程在等待
        int queueLength = lock.getQueueLength();

        // 检查是否有线程在等待 Condition
        // boolean hasWaiters = lock.hasWaiters(condition);

        // 检查锁是否被持有
        boolean isLocked = lock.isLocked();

        // 检查当前线程是否持有锁
        boolean isHeldByCurrentThread = lock.isHeldByCurrentThread();

        // 获取持有锁的次数（可重入）
        int holdCount = lock.getHoldCount();

        System.out.printf(
            "等待线程: %d, 已锁定: %b, 当前线程持有: %b, 持有次数: %d%n",
            queueLength, isLocked, isHeldByCurrentThread, holdCount
        );
    }
}
```

## 实战场景

### 场景一：高性能缓存

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.StampedLock;

/**
 * 使用 StampedLock 实现高性能缓存
 */
public class HighPerformanceCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final StampedLock sl = new StampedLock();

    /**
     * 乐观读 - 最高性能
     */
    public V get(K key) {
        // 1. 尝试乐观读
        long stamp = sl.tryOptimisticRead();
        V value = cache.get(key);

        // 2. 验证是否有写操作
        if (!sl.validate(stamp)) {
            // 3. 乐观读失败，升级为悲观读
            stamp = sl.readLock();
            try {
                value = cache.get(key);
            } finally {
                sl.unlockRead(stamp);
            }
        }

        return value;
    }

    /**
     * 写入 - 独占锁
     */
    public void put(K key, V value) {
        long stamp = sl.writeLock();
        try {
            cache.put(key, value);
        } finally {
            sl.unlockWrite(stamp);
        }
    }

    /**
     * 计算并缓存（带锁升级）
     */
    public V computeIfAbsent(K key, java.util.function.Function<K, V> mappingFunction) {
        // 1. 乐观读检查
        long stamp = sl.tryOptimisticRead();
        V value = cache.get(key);

        if (sl.validate(stamp) && value != null) {
            return value;
        }

        // 2. 悲观读检查
        stamp = sl.readLock();
        try {
            value = cache.get(key);
            if (value != null) {
                return value;
            }

            // 3. 尝试升级为写锁
            long ws = sl.tryConvertToWriteLock(stamp);
            if (ws != 0L) {
                stamp = ws;
            } else {
                // 升级失败，释放读锁，获取写锁
                sl.unlockRead(stamp);
                stamp = sl.writeLock();
                // 重新检查
                value = cache.get(key);
                if (value != null) {
                    return value;
                }
            }

            // 4. 计算值并存入缓存
            value = mappingFunction.apply(key);
            cache.put(key, value);
            return value;
        } finally {
            sl.unlock(stamp);
        }
    }
}
```

### 场景二：限流器

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 基于令牌桶算法的限流器
 */
public class RateLimiter {
    private final Lock lock = new ReentrantLock();
    private final double permitsPerSecond;
    private final double maxPermits;
    private double storedPermits;
    private long lastUpdateTime;

    public RateLimiter(double permitsPerSecond) {
        this(permitsPerSecond, permitsPerSecond);
    }

    public RateLimiter(double permitsPerSecond, double maxPermits) {
        this.permitsPerSecond = permitsPerSecond;
        this.maxPermits = maxPermits;
        this.storedPermits = maxPermits;
        this.lastUpdateTime = System.nanoTime();
    }

    /**
     * 尝试获取许可（非阻塞）
     */
    public boolean tryAcquire() {
        return tryAcquire(1);
    }

    public boolean tryAcquire(int permits) {
        if (!lock.tryLock()) {
            return false;
        }
        try {
            resync();
            if (storedPermits >= permits) {
                storedPermits -= permits;
                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取许可（阻塞等待）
     */
    public void acquire() throws InterruptedException {
        acquire(1);
    }

    public void acquire(int permits) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (true) {
                resync();
                if (storedPermits >= permits) {
                    storedPermits -= permits;
                    return;
                }

                // 计算需要等待的时间
                double waitPermits = permits - storedPermits;
                long waitNanos = (long) (waitPermits / permitsPerSecond * 1_000_000_000);

                // 释放锁并等待
                lock.unlock();
                try {
                    TimeUnit.NANOSECONDS.sleep(waitNanos);
                } finally {
                    lock.lock();
                }
            }
        } finally {
            lock.unlock();
        }
    }

    /**
     * 同步令牌数量
     */
    private void resync() {
        long now = System.nanoTime();
        long elapsed = now - lastUpdateTime;

        // 计算新增的令牌数
        double newPermits = elapsed * permitsPerSecond / 1_000_000_000;
        storedPermits = Math.min(maxPermits, storedPermits + newPermits);
        lastUpdateTime = now;
    }

    public static void main(String[] args) throws InterruptedException {
        RateLimiter limiter = new RateLimiter(10);  // 每秒 10 个许可

        for (int i = 0; i < 20; i++) {
            if (limiter.tryAcquire()) {
                System.out.println("请求 " + i + " 通过");
            } else {
                System.out.println("请求 " + i + " 被限流");
            }
            Thread.sleep(50);
        }
    }
}
```

### 场景三：分布式锁的本地层

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 本地锁层，减少分布式锁的竞争
 * 先获取本地锁，再获取分布式锁
 */
public class LocalLockLayer {
    private final ConcurrentHashMap<String, Lock> localLocks = new ConcurrentHashMap<>();

    /**
     * 获取或创建本地锁
     */
    public Lock getLocalLock(String key) {
        return localLocks.computeIfAbsent(key, k -> new ReentrantLock());
    }

    /**
     * 执行带本地锁的操作
     */
    public <T> T executeWithLocalLock(String key, long timeout, TimeUnit unit,
                                       DistributedLockCallback<T> callback)
            throws InterruptedException {
        Lock localLock = getLocalLock(key);

        // 1. 先获取本地锁
        if (!localLock.tryLock(timeout, unit)) {
            throw new RuntimeException("获取本地锁超时: " + key);
        }

        try {
            // 2. 再获取分布式锁
            if (tryAcquireDistributedLock(key, timeout, unit)) {
                try {
                    // 3. 执行业务逻辑
                    return callback.doInLock();
                } finally {
                    releaseDistributedLock(key);
                }
            } else {
                throw new RuntimeException("获取分布式锁超时: " + key);
            }
        } finally {
            localLock.unlock();
        }
    }

    // 模拟分布式锁操作
    private boolean tryAcquireDistributedLock(String key, long timeout, TimeUnit unit) {
        // 实际实现可能使用 Redis、Zookeeper 等
        System.out.println("获取分布式锁: " + key);
        return true;
    }

    private void releaseDistributedLock(String key) {
        System.out.println("释放分布式锁: " + key);
    }

    /**
     * 清理不再使用的锁
     */
    public void cleanup() {
        localLocks.entrySet().removeIf(entry -> {
            Lock lock = entry.getValue();
            if (lock instanceof ReentrantLock) {
                return !((ReentrantLock) lock).isLocked() &&
                       !((ReentrantLock) lock).hasQueuedThreads();
            }
            return false;
        });
    }

    @FunctionalInterface
    public interface DistributedLockCallback<T> {
        T doInLock() throws InterruptedException;
    }
}
```

## 面试要点

### Q1: synchronized 和 Lock 有什么区别？

**答案要点：**

| 特性 | synchronized | Lock |
|------|-------------|------|
| 实现层面 | JVM 内置（字节码指令） | Java API（接口） |
| 锁获取 | 隐式获取和释放 | 显式 lock() 和 unlock() |
| 中断响应 | 不支持 | lockInterruptibly() 支持 |
| 超时获取 | 不支持 | tryLock(timeout) 支持 |
| 尝试获取 | 不支持 | tryLock() 支持 |
| 公平性 | 非公平 | 可配置公平/非公平 |
| 条件变量 | 单一（wait/notify） | 多个 Condition |
| 锁释放 | 自动（退出同步块） | 手动（finally 中） |

### Q2: ReentrantLock 的实现原理是什么？

**答案要点：**

1. **基于 AQS**：ReentrantLock 内部使用 AbstractQueuedSynchronizer (AQS) 实现
2. **state 变量**：使用 volatile int state 表示锁状态，0 表示未锁定，>0 表示被锁定次数
3. **CLH 队列**：等待线程组织成 FIFO 双向链表
4. **可重入**：同一线程可以多次获取锁，state 递增
5. **公平性**：
   - 非公平锁：新线程先尝试 CAS 获取锁，失败后才排队
   - 公平锁：直接进入队列排队

```java
// 简化的非公平锁获取逻辑
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // 锁空闲，尝试 CAS 获取
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    } else if (current == getExclusiveOwnerThread()) {
        // 可重入：同一线程再次获取
        int nextc = c + acquires;
        setState(nextc);
        return true;
    }
    return false;
}
```

### Q3: ReadWriteLock 和 StampedLock 有什么区别？

**答案要点：**

| 特性 | ReadWriteLock | StampedLock |
|------|--------------|-------------|
| 乐观读 | 不支持 | tryOptimisticRead() |
| 可重入 | 是 | 否 |
| Condition | 支持 | 不支持 |
| 锁升级 | 不支持 | tryConvertToWriteLock() |
| 锁降级 | 支持 | 支持 |
| 适用场景 | 一般读写分离 | 极高读取性能需求 |

### Q4: 如何避免死锁？

**答案要点：**

1. **按顺序获取锁**：所有线程按相同顺序获取多个锁
2. **使用 tryLock**：设置超时，获取失败则释放已有锁
3. **使用 lockInterruptibly**：支持中断，可以被外部中断
4. **减少锁粒度**：降低锁的持有时间
5. **使用更高级的并发工具**：如 ConcurrentHashMap

### Q5: Condition 和 Object 的 wait/notify 有什么区别？

**答案要点：**

| 特性 | Object wait/notify | Condition |
|------|-------------------|-----------|
| 绑定 | 绑定到对象监视器 | 绑定到 Lock |
| 数量 | 每个对象一个等待集 | 可创建多个 Condition |
| 等待 | wait() | await() |
| 通知 | notify()/notifyAll() | signal()/signalAll() |
| 超时 | wait(timeout) | await(time, unit) |
| 截止时间 | 不支持 | awaitUntil(deadline) |
| 不响应中断 | 不支持 | awaitUninterruptibly() |

## 延伸阅读

### 官方文档

- [Java Lock 接口文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/Lock.html)
- [ReentrantLock 文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [StampedLock 文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/StampedLock.html)

### 经典书籍

- 《Java 并发编程实战》(Java Concurrency in Practice) - Brian Goetz
- 《Java 并发编程的艺术》- 方腾飞等
- 《深入理解 Java 虚拟机》- 周志明

### 源码分析

- Doug Lea 的 JSR-166 并发包原始设计
- OpenJDK AbstractQueuedSynchronizer 源码
- ReentrantLock 和 ReentrantReadWriteLock 实现

### 相关主题

- Java 内存模型 (JMM)
- AQS (AbstractQueuedSynchronizer) 框架
- CAS 操作与原子类
- 并发集合类实现
