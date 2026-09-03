---
title: Java synchronized 关键字
description: 深入理解 Java synchronized 关键字：同步方法、同步代码块、监视器锁、内置锁、wait/notify 机制
track: java
section: concurrency
difficulty: intermediate
tags:
  - Java
  - 并发
  - synchronized
  - 锁
  - 线程安全
  - 监视器
status: imported
origin: old/src/content/docs/java/synchronized.zh.md
divergence: 0.291
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Java
  subcategory: 并发编程
  order: 6
  lastUpdated: 2026-01-07
---

## 概念解释

`synchronized` 是 Java 中最基本的同步机制，用于保证多线程环境下的线程安全。它通过内置锁（Intrinsic Lock）或监视器锁（Monitor Lock）来实现对共享资源的互斥访问。

### 历史背景

`synchronized` 从 Java 1.0 起就是语言的核心特性。在 Java 5 之前，它是唯一的同步原语。尽管 Java 5 引入了 `java.util.concurrent` 包提供了更灵活的锁机制，`synchronized` 仍然是最常用的同步方式，因为它简单、可靠且经过了大量优化。

### 解决的问题

在多线程环境中，当多个线程同时访问和修改共享数据时，会出现以下问题：

1. **竞态条件（Race Condition）**：多个线程同时修改数据，导致结果不可预测
2. **数据不一致**：一个线程读取数据时，另一个线程正在修改
3. **可见性问题**：一个线程对变量的修改对其他线程不可见
4. **指令重排序**：编译器和处理器可能重新排序指令，导致意外行为

`synchronized` 通过提供互斥访问和内存可见性保证来解决这些问题。

## 核心原理

### 监视器（Monitor）概念

Java 的 `synchronized` 基于监视器（Monitor）模式实现。每个 Java 对象都可以作为一个监视器，包含以下组成部分：

```
┌─────────────────────────────────────────────┐
│                  Monitor                     │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │         Entry Set (入口集)           │    │
│  │   等待获取锁的线程队列                 │    │
│  └─────────────────────────────────────┘    │
│                    ↓                         │
│  ┌─────────────────────────────────────┐    │
│  │           Owner (持有者)             │    │
│  │   当前持有锁的线程                    │    │
│  └─────────────────────────────────────┘    │
│                    ↓                         │
│  ┌─────────────────────────────────────┐    │
│  │          Wait Set (等待集)           │    │
│  │   调用 wait() 后等待的线程队列         │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 对象头与锁状态

在 HotSpot JVM 中，对象的锁状态存储在对象头（Object Header）的 Mark Word 中：

```
64 位 JVM 对象头结构（Mark Word）：
┌─────────────────────────────────────────────────────────────┐
│                        Mark Word (64 bits)                   │
├─────────────────────────────────────────────────────────────┤
│  无锁状态:     [hashcode:31 | age:4 | biased:1 | lock:2]     │
│  偏向锁:       [threadId:54 | epoch:2 | age:4 | biased:1 | 01] │
│  轻量级锁:     [ptr to lock record:62 | 00]                  │
│  重量级锁:     [ptr to heavyweight monitor:62 | 10]         │
│  GC 标记:      [........................... | 11]           │
└─────────────────────────────────────────────────────────────┘
```

### 锁升级机制

Java 6 引入了锁优化机制，锁状态会根据竞争情况升级：

```
无锁 → 偏向锁 → 轻量级锁 → 重量级锁
                ↑
             （只升级不降级）
```

1. **偏向锁（Biased Locking）**：假设只有一个线程访问同步块，减少不必要的 CAS 操作
2. **轻量级锁（Lightweight Lock）**：通过 CAS 操作和自旋来避免线程阻塞
3. **重量级锁（Heavyweight Lock）**：依赖操作系统的互斥量（Mutex），涉及用户态到内核态的切换

### 字节码实现

`synchronized` 在字节码层面通过 `monitorenter` 和 `monitorexit` 指令实现：

```java
// 源代码
public void syncMethod() {
    synchronized (this) {
        // 同步代码
    }
}

// 对应字节码
public void syncMethod();
  Code:
     0: aload_0
     1: dup
     2: astore_1
     3: monitorenter        // 获取锁
     4: aload_1
     5: monitorexit         // 释放锁（正常退出）
     6: goto          14
     9: astore_2
    10: aload_1
    11: monitorexit         // 释放锁（异常退出）
    12: aload_2
    13: athrow
    14: return
```

## 核心要点

### synchronized 的三种使用方式

| 使用方式 | 锁对象 | 作用范围 |
|---------|-------|---------|
| 同步实例方法 | 当前实例对象 `this` | 整个方法 |
| 同步静态方法 | 类的 Class 对象 | 整个方法 |
| 同步代码块 | 指定的对象 | 代码块范围 |

### synchronized 的三大保证

- **原子性**：同步代码块内的操作作为一个整体执行
- **可见性**：线程释放锁时，会将修改刷新到主内存
- **有序性**：禁止指令重排序到同步块外

### 可重入性

`synchronized` 是可重入锁，同一线程可以多次获取同一把锁：

```java
public synchronized void outer() {
    inner(); // 同一线程可以再次获取锁
}

public synchronized void inner() {
    // 如果不可重入，这里会死锁
}
```

### 锁的释放时机

- 同步代码块执行完毕
- 执行过程中发生异常
- 调用 `wait()` 方法（暂时释放）

**注意**：`Thread.sleep()` 和 `Thread.yield()` 不会释放锁。

## 代码示例

### 同步实例方法

```java
public class SynchronizedInstanceMethod {
    private int count = 0;

    // 锁定当前实例对象 this
    public synchronized void increment() {
        count++;
    }

    public synchronized int getCount() {
        return count;
    }

    public static void main(String[] args) throws InterruptedException {
        SynchronizedInstanceMethod counter = new SynchronizedInstanceMethod();

        // 创建多个线程并发递增
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    counter.increment();
                }
            });
            threads[i].start();
        }

        // 等待所有线程完成
        for (Thread t : threads) {
            t.join();
        }

        System.out.println("最终计数: " + counter.getCount()); // 输出: 10000
    }
}
```

### 同步静态方法

```java
public class SynchronizedStaticMethod {
    private static int globalCount = 0;

    // 锁定 SynchronizedStaticMethod.class 对象
    public static synchronized void increment() {
        globalCount++;
    }

    public static synchronized int getCount() {
        return globalCount;
    }

    // 等价的同步代码块写法
    public static void incrementEquivalent() {
        synchronized (SynchronizedStaticMethod.class) {
            globalCount++;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        // 不同实例也会互斥，因为锁的是类对象
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                SynchronizedStaticMethod.increment();
            }
        });

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                SynchronizedStaticMethod.increment();
            }
        });

        t1.start();
        t2.start();
        t1.join();
        t2.join();

        System.out.println("全局计数: " + getCount()); // 输出: 10000
    }
}
```

### 同步代码块

```java
public class SynchronizedBlock {
    private int balance = 0;
    private final Object lock = new Object(); // 专用锁对象

    // 使用 this 作为锁
    public void deposit(int amount) {
        synchronized (this) {
            balance += amount;
            System.out.println(Thread.currentThread().getName() +
                " 存款 " + amount + "，余额: " + balance);
        }
    }

    // 使用专用锁对象（推荐）
    public void withdraw(int amount) {
        synchronized (lock) {
            if (balance >= amount) {
                balance -= amount;
                System.out.println(Thread.currentThread().getName() +
                    " 取款 " + amount + "，余额: " + balance);
            } else {
                System.out.println("余额不足");
            }
        }
    }

    // 缩小同步范围，提高性能
    public void transfer(int amount, SynchronizedBlock target) {
        // 非临界区代码
        System.out.println("准备转账...");

        synchronized (lock) {
            // 只同步必要的代码
            if (balance >= amount) {
                balance -= amount;
            }
        }

        // 可以继续执行其他非临界区代码
        System.out.println("转账处理中...");

        synchronized (target.lock) {
            target.balance += amount;
        }

        System.out.println("转账完成");
    }

    public static void main(String[] args) throws InterruptedException {
        SynchronizedBlock account = new SynchronizedBlock();

        Thread[] threads = new Thread[5];
        for (int i = 0; i < 5; i++) {
            threads[i] = new Thread(() -> {
                account.deposit(100);
                account.withdraw(50);
            }, "Thread-" + i);
            threads[i].start();
        }

        for (Thread t : threads) {
            t.join();
        }
    }
}
```

### wait/notify 机制

```java
public class WaitNotifyExample {
    private final Object lock = new Object();
    private boolean dataReady = false;
    private String data;

    // 生产者
    public void produce() {
        synchronized (lock) {
            // 准备数据
            data = "Hello, World!";
            dataReady = true;
            System.out.println("生产者: 数据已准备好");

            // 通知等待的消费者
            lock.notify();  // 唤醒一个等待的线程
            // lock.notifyAll();  // 唤醒所有等待的线程
        }
    }

    // 消费者
    public void consume() {
        synchronized (lock) {
            // 使用 while 而不是 if，防止虚假唤醒
            while (!dataReady) {
                try {
                    System.out.println("消费者: 等待数据...");
                    lock.wait();  // 释放锁并等待
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }

            // 处理数据
            System.out.println("消费者: 收到数据 - " + data);
            dataReady = false;
        }
    }

    public static void main(String[] args) {
        WaitNotifyExample example = new WaitNotifyExample();

        // 启动消费者线程
        Thread consumer = new Thread(example::consume, "Consumer");
        consumer.start();

        // 稍等后启动生产者
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        Thread producer = new Thread(example::produce, "Producer");
        producer.start();
    }
}
```

### 生产者-消费者模式（完整实现）

```java
import java.util.LinkedList;
import java.util.Queue;

public class ProducerConsumer {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity;

    public ProducerConsumer(int capacity) {
        this.capacity = capacity;
    }

    // 生产者方法
    public void produce(int item) throws InterruptedException {
        synchronized (this) {
            // 队列满时等待
            while (queue.size() == capacity) {
                System.out.println("队列已满，生产者等待...");
                wait();
            }

            queue.offer(item);
            System.out.println("生产: " + item + "，队列大小: " + queue.size());

            // 通知消费者
            notifyAll();
        }
    }

    // 消费者方法
    public int consume() throws InterruptedException {
        synchronized (this) {
            // 队列空时等待
            while (queue.isEmpty()) {
                System.out.println("队列为空，消费者等待...");
                wait();
            }

            int item = queue.poll();
            System.out.println("消费: " + item + "，队列大小: " + queue.size());

            // 通知生产者
            notifyAll();
            return item;
        }
    }

    public static void main(String[] args) {
        ProducerConsumer pc = new ProducerConsumer(5);

        // 生产者线程
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    pc.produce(i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Producer");

        // 消费者线程
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    pc.consume();
                    Thread.sleep(300);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Consumer");

        producer.start();
        consumer.start();
    }
}
```

### 带超时的 wait

```java
public class TimedWaitExample {
    private final Object lock = new Object();
    private boolean conditionMet = false;

    public boolean waitForCondition(long timeoutMillis) {
        synchronized (lock) {
            long deadline = System.currentTimeMillis() + timeoutMillis;
            long remaining = timeoutMillis;

            while (!conditionMet && remaining > 0) {
                try {
                    lock.wait(remaining);
                    remaining = deadline - System.currentTimeMillis();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }

            return conditionMet;
        }
    }

    public void signalCondition() {
        synchronized (lock) {
            conditionMet = true;
            lock.notifyAll();
        }
    }

    public static void main(String[] args) {
        TimedWaitExample example = new TimedWaitExample();

        Thread waiter = new Thread(() -> {
            System.out.println("等待条件满足（最多 5 秒）...");
            boolean result = example.waitForCondition(5000);
            System.out.println("等待结果: " + (result ? "条件满足" : "超时"));
        });

        waiter.start();

        // 模拟 3 秒后满足条件
        try {
            Thread.sleep(3000);
            example.signalCondition();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

## 最佳实践

### 使用私有锁对象

```java
public class PrivateLockBestPractice {
    // 推荐：使用私有的 final 锁对象
    private final Object lock = new Object();
    private int value;

    public void update(int newValue) {
        synchronized (lock) {
            value = newValue;
        }
    }

    // 不推荐：使用 this 或公开的对象作为锁
    // 因为外部代码可能意外锁定同一对象
}
```

### 保持同步块尽可能小

```java
public class MinimizeSyncBlock {
    private final Object lock = new Object();
    private List<String> data = new ArrayList<>();

    // 不推荐：整个方法同步
    public synchronized void processDataBad(String input) {
        String processed = heavyComputation(input);  // 耗时操作不需要同步
        data.add(processed);
    }

    // 推荐：只同步必要的部分
    public void processDataGood(String input) {
        String processed = heavyComputation(input);  // 在同步块外执行

        synchronized (lock) {
            data.add(processed);  // 只同步共享数据的访问
        }
    }

    private String heavyComputation(String input) {
        // 模拟耗时计算
        return input.toUpperCase();
    }
}
```

### 避免在同步块中调用外部方法

```java
public class AvoidAlienMethodCalls {
    private final Object lock = new Object();
    private List<Listener> listeners = new CopyOnWriteArrayList<>();

    // 危险：持有锁时调用外部方法
    public void notifyListenersBad(String event) {
        synchronized (lock) {
            for (Listener l : listeners) {
                l.onEvent(event);  // 外部代码可能死锁
            }
        }
    }

    // 安全：先复制，再在锁外调用
    public void notifyListenersGood(String event) {
        List<Listener> snapshot;
        synchronized (lock) {
            snapshot = new ArrayList<>(listeners);
        }

        // 在锁外调用外部方法
        for (Listener l : snapshot) {
            l.onEvent(event);
        }
    }

    interface Listener {
        void onEvent(String event);
    }
}
```

### 保持一致的加锁顺序

```java
public class ConsistentLockOrdering {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();

    // 危险：不一致的加锁顺序可能导致死锁
    public void method1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // ...
            }
        }
    }

    // 死锁风险：如果另一个线程同时执行 method2
    public void method2() {
        synchronized (lock2) {  // 先获取 lock2
            synchronized (lock1) {  // 再获取 lock1
                // ...
            }
        }
    }

    // 安全：始终按相同顺序获取锁
    public void safeMethod1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // ...
            }
        }
    }

    public void safeMethod2() {
        synchronized (lock1) {  // 保持相同顺序
            synchronized (lock2) {
                // ...
            }
        }
    }
}
```

### 正确使用 wait/notify

```java
public class WaitNotifyBestPractice {
    private final Object lock = new Object();
    private boolean condition = false;

    public void await() throws InterruptedException {
        synchronized (lock) {
            // 最佳实践 1：使用 while 而不是 if
            while (!condition) {
                lock.wait();
            }
            // 处理逻辑
        }
    }

    public void signal() {
        synchronized (lock) {
            condition = true;
            // 最佳实践 2：优先使用 notifyAll()
            // 除非确定只有一个等待线程且只需唤醒一个
            lock.notifyAll();
        }
    }
}
```

## 常见陷阱

### 同步在错误的对象上

```java
public class WrongLockObject {
    private Integer count = 0;

    // 错误：Integer 是不可变的，count++ 会创建新对象
    public void incrementBad() {
        synchronized (count) {  // 每次可能锁定不同的对象！
            count++;
        }
    }

    // 正确：使用独立的锁对象
    private final Object lock = new Object();

    public void incrementGood() {
        synchronized (lock) {
            count++;
        }
    }
}
```

### 对不同实例使用实例锁期望同步

```java
public class DifferentInstanceLock {
    private static int sharedCounter = 0;

    // 错误：每个实例有自己的锁
    public synchronized void incrementBad() {
        sharedCounter++;  // 不同实例调用不会互斥
    }

    // 正确：使用静态同步或类锁
    public static synchronized void incrementGood() {
        sharedCounter++;
    }

    // 或使用静态锁对象
    private static final Object lock = new Object();

    public void incrementAlsoGood() {
        synchronized (lock) {
            sharedCounter++;
        }
    }
}
```

### 锁定 null 对象

```java
public class NullLockObject {
    private Object lock = null;

    public void method() {
        // 运行时抛出 NullPointerException
        synchronized (lock) {  // NPE!
            // ...
        }
    }
}
```

### 死锁

```java
public class DeadlockExample {
    private final Object resource1 = new Object();
    private final Object resource2 = new Object();

    public void thread1Task() {
        synchronized (resource1) {
            System.out.println("Thread 1: 持有 resource1");
            try { Thread.sleep(100); } catch (InterruptedException e) {}

            synchronized (resource2) {  // 等待 resource2
                System.out.println("Thread 1: 持有 resource1 和 resource2");
            }
        }
    }

    public void thread2Task() {
        synchronized (resource2) {
            System.out.println("Thread 2: 持有 resource2");
            try { Thread.sleep(100); } catch (InterruptedException e) {}

            synchronized (resource1) {  // 等待 resource1 - 死锁！
                System.out.println("Thread 2: 持有 resource1 和 resource2");
            }
        }
    }

    // 解决方案：按固定顺序获取锁
    public void thread1TaskFixed() {
        synchronized (resource1) {
            synchronized (resource2) {
                // 安全
            }
        }
    }

    public void thread2TaskFixed() {
        synchronized (resource1) {  // 相同顺序
            synchronized (resource2) {
                // 安全
            }
        }
    }
}
```

### 忘记使用 while 循环检查条件

```java
public class SpuriousWakeup {
    private final Object lock = new Object();
    private boolean ready = false;

    // 错误：使用 if
    public void waitBad() throws InterruptedException {
        synchronized (lock) {
            if (!ready) {  // 错误！虚假唤醒后会继续执行
                lock.wait();
            }
            // 可能在条件不满足时执行
        }
    }

    // 正确：使用 while
    public void waitGood() throws InterruptedException {
        synchronized (lock) {
            while (!ready) {  // 正确！虚假唤醒后会重新检查
                lock.wait();
            }
            // 条件一定满足
        }
    }
}
```

### 在同步块内调用 Thread.sleep()

```java
public class SleepWithLock {
    private final Object lock = new Object();

    // 不推荐：持有锁时睡眠
    public void badPractice() throws InterruptedException {
        synchronized (lock) {
            Thread.sleep(5000);  // 持有锁睡眠，阻塞其他线程
        }
    }

    // 推荐：如果需要等待，使用 wait()
    public void goodPractice() throws InterruptedException {
        synchronized (lock) {
            lock.wait(5000);  // 释放锁并等待
        }
    }
}
```

## 性能考量

### 锁消除（Lock Elimination）

JIT 编译器会消除不可能存在共享资源竞争的锁：

```java
public String concat(String s1, String s2) {
    // StringBuffer 是线程安全的，但这里不会被多线程访问
    // JIT 编译器会消除 StringBuffer 内部的同步
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb.toString();
}
```

### 锁粗化（Lock Coarsening）

JIT 编译器会合并连续的同步块：

```java
public void lockCoarseningExample() {
    // 原始代码：多个连续的同步块
    synchronized (this) { operation1(); }
    synchronized (this) { operation2(); }
    synchronized (this) { operation3(); }

    // JIT 优化后：合并为一个同步块
    // synchronized (this) {
    //     operation1();
    //     operation2();
    //     operation3();
    // }
}
```

### 性能对比

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

public class LockPerformanceComparison {
    private int syncCount = 0;
    private int lockCount = 0;
    private AtomicInteger atomicCount = new AtomicInteger(0);
    private final ReentrantLock lock = new ReentrantLock();

    // synchronized 方法
    public synchronized void incrementSync() {
        syncCount++;
    }

    // ReentrantLock
    public void incrementLock() {
        lock.lock();
        try {
            lockCount++;
        } finally {
            lock.unlock();
        }
    }

    // AtomicInteger（无锁）
    public void incrementAtomic() {
        atomicCount.incrementAndGet();
    }

    public static void main(String[] args) throws InterruptedException {
        LockPerformanceComparison test = new LockPerformanceComparison();
        int iterations = 10_000_000;

        // 测试 synchronized
        long start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            test.incrementSync();
        }
        System.out.println("synchronized: " + (System.nanoTime() - start) / 1_000_000 + " ms");

        // 测试 ReentrantLock
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            test.incrementLock();
        }
        System.out.println("ReentrantLock: " + (System.nanoTime() - start) / 1_000_000 + " ms");

        // 测试 AtomicInteger
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            test.incrementAtomic();
        }
        System.out.println("AtomicInteger: " + (System.nanoTime() - start) / 1_000_000 + " ms");
    }
}
```

### 性能优化建议

| 场景 | 推荐方案 |
|-----|---------|
| 简单的原子操作 | 使用 `AtomicInteger` 等原子类 |
| 低竞争场景 | `synchronized`（偏向锁优化） |
| 需要公平性或超时 | `ReentrantLock` |
| 读多写少 | `ReadWriteLock` 或 `StampedLock` |
| 高并发计数 | `LongAdder` |

## 实战场景

### 线程安全的单例模式

```java
public class Singleton {
    // volatile 防止指令重排序
    private static volatile Singleton instance;

    private Singleton() {
        // 防止反射攻击
        if (instance != null) {
            throw new IllegalStateException("Already initialized");
        }
    }

    // 双重检查锁定
    public static Singleton getInstance() {
        if (instance == null) {  // 第一次检查（无锁）
            synchronized (Singleton.class) {
                if (instance == null) {  // 第二次检查（有锁）
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 更推荐：静态内部类实现
public class SingletonHolder {
    private SingletonHolder() {}

    private static class Holder {
        private static final SingletonHolder INSTANCE = new SingletonHolder();
    }

    public static SingletonHolder getInstance() {
        return Holder.INSTANCE;
    }
}
```

### 线程安全的懒加载缓存

```java
public class ThreadSafeCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();

    public V get(K key, Supplier<V> valueLoader) {
        // 先用读锁检查
        V value = cache.get(key);
        if (value != null) {
            return value;
        }

        // 需要加载时才同步
        synchronized (this) {
            // 双重检查
            value = cache.get(key);
            if (value == null) {
                value = valueLoader.get();
                cache.put(key, value);
            }
            return value;
        }
    }

    public synchronized void put(K key, V value) {
        cache.put(key, value);
    }

    public synchronized void clear() {
        cache.clear();
    }
}
```

### 有界阻塞队列

```java
public class BoundedBlockingQueue<E> {
    private final Object[] items;
    private int takeIndex;
    private int putIndex;
    private int count;

    public BoundedBlockingQueue(int capacity) {
        items = new Object[capacity];
    }

    public synchronized void put(E element) throws InterruptedException {
        while (count == items.length) {
            wait();  // 队列满，等待
        }

        items[putIndex] = element;
        if (++putIndex == items.length) {
            putIndex = 0;
        }
        count++;
        notifyAll();  // 通知消费者
    }

    @SuppressWarnings("unchecked")
    public synchronized E take() throws InterruptedException {
        while (count == 0) {
            wait();  // 队列空，等待
        }

        E element = (E) items[takeIndex];
        items[takeIndex] = null;  // 帮助 GC
        if (++takeIndex == items.length) {
            takeIndex = 0;
        }
        count--;
        notifyAll();  // 通知生产者
        return element;
    }

    public synchronized int size() {
        return count;
    }
}
```

### 读写分离的计数器

```java
public class ReadWriteCounter {
    private long count = 0;
    private int readers = 0;
    private int writers = 0;
    private int writeRequests = 0;

    public synchronized void lockRead() throws InterruptedException {
        while (writers > 0 || writeRequests > 0) {
            wait();
        }
        readers++;
    }

    public synchronized void unlockRead() {
        readers--;
        notifyAll();
    }

    public synchronized void lockWrite() throws InterruptedException {
        writeRequests++;
        while (readers > 0 || writers > 0) {
            wait();
        }
        writeRequests--;
        writers++;
    }

    public synchronized void unlockWrite() {
        writers--;
        notifyAll();
    }

    public long getCount() throws InterruptedException {
        lockRead();
        try {
            return count;
        } finally {
            unlockRead();
        }
    }

    public void increment() throws InterruptedException {
        lockWrite();
        try {
            count++;
        } finally {
            unlockWrite();
        }
    }
}
```

### 对象池

```java
public class ObjectPool<T> {
    private final List<T> available = new ArrayList<>();
    private final List<T> inUse = new ArrayList<>();
    private final int maxSize;
    private final Supplier<T> factory;

    public ObjectPool(int maxSize, Supplier<T> factory) {
        this.maxSize = maxSize;
        this.factory = factory;
    }

    public synchronized T acquire() throws InterruptedException {
        while (available.isEmpty() && inUse.size() >= maxSize) {
            wait();  // 等待对象归还
        }

        T obj;
        if (available.isEmpty()) {
            obj = factory.get();
        } else {
            obj = available.remove(available.size() - 1);
        }

        inUse.add(obj);
        return obj;
    }

    public synchronized void release(T obj) {
        inUse.remove(obj);
        available.add(obj);
        notify();  // 通知等待的线程
    }

    public synchronized int availableCount() {
        return available.size();
    }

    public synchronized int inUseCount() {
        return inUse.size();
    }
}
```

## 面试要点

### synchronized 的实现原理是什么？

**答案**：`synchronized` 基于对象监视器（Monitor）实现。在字节码层面，同步代码块使用 `monitorenter` 和 `monitorexit` 指令；同步方法则通过方法的 `ACC_SYNCHRONIZED` 标志实现。JVM 使用对象头中的 Mark Word 来存储锁状态，支持偏向锁、轻量级锁和重量级锁三种状态的升级。

### synchronized 和 ReentrantLock 的区别？

| 特性 | synchronized | ReentrantLock |
|-----|--------------|---------------|
| 实现层面 | JVM 内置 | JDK 实现 |
| 锁释放 | 自动释放 | 需手动释放 |
| 可中断 | 不可中断 | 可中断 |
| 公平性 | 非公平 | 可选公平/非公平 |
| 条件变量 | 单个（wait/notify） | 多个 Condition |
| 性能 | Java 6 后优化良好 | 高竞争时略优 |

### wait() 和 sleep() 的区别？

**答案**：
- `wait()` 是 Object 方法，必须在同步块中调用，会释放锁
- `sleep()` 是 Thread 静态方法，可在任何地方调用，不释放锁
- `wait()` 用于线程间通信，`sleep()` 用于暂停执行
- `wait()` 需要被 `notify()` 唤醒，`sleep()` 时间到自动恢复

### 为什么 wait() 要在循环中调用？

**答案**：因为存在虚假唤醒（spurious wakeup），线程可能在条件不满足时被唤醒。使用 `while` 循环可以在被唤醒后重新检查条件，确保条件真正满足后才继续执行。

### synchronized 锁的升级过程？

**答案**：
1. **无锁**：初始状态
2. **偏向锁**：第一个线程访问时，在对象头记录线程 ID，后续该线程进入无需 CAS
3. **轻量级锁**：有竞争时，通过 CAS 自旋获取锁
4. **重量级锁**：自旋失败或竞争激烈时，升级为重量级锁，线程阻塞

锁只能升级，不能降级（偏向锁可以被撤销）。

### 如何检测和避免死锁？

**答案**：
- **检测**：使用 `jstack` 查看线程堆栈，或使用 `ThreadMXBean` 编程检测
- **避免**：
  - 按固定顺序获取锁
  - 使用 `tryLock` 带超时的锁获取
  - 减少锁的持有时间
  - 使用更高级的并发工具（如 `java.util.concurrent`）

### synchronized 能保证可见性吗？为什么？

**答案**：可以。根据 Java 内存模型（JMM），synchronized 遵循 happens-before 规则：
- 释放锁时，会将工作内存中的修改刷新到主内存
- 获取锁时，会从主内存重新读取变量

因此，一个线程的修改对获取同一把锁的另一个线程是可见的。

### 什么情况下应该使用 synchronized 而不是其他锁？

**答案**：
- 代码简单，同步块较小
- 不需要高级特性（如可中断、公平性、多条件变量）
- 低竞争场景，偏向锁优化效果明显
- 需要自动释放锁的场景

## 延伸阅读

### 官方文档
- [Java Language Specification: synchronized 语句](https://docs.oracle.com/javase/specs/jls/se17/html/jls-14.html#jls-14.19)
- [Java 并发教程](https://docs.oracle.com/javase/tutorial/essential/concurrency/)
- [java.lang.Object (wait/notify)](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Object.html)

### 经典书籍
- 《Java 并发编程实战》（Java Concurrency in Practice）- Brian Goetz
- 《Java 并发编程的艺术》- 方腾飞、魏鹏、程晓明
- 《深入理解 Java 虚拟机》- 周志明

### 技术文章
- [Biased Locking in HotSpot](https://blogs.oracle.com/dave/biased-locking-in-hotspot)
- [Java synchronized 原理总结](https://www.cnblogs.com/paddix/p/5367116.html)
- [不可不说的 Java "锁" 事](https://tech.meituan.com/2018/11/15/java-lock.html)

### 相关主题
- [Java volatile 关键字](/java/volatile)
- [Java Lock 接口与 ReentrantLock](/java/locks)
- [Java 原子类](/java/atomic)
- [Java 并发工具类](/java/concurrency-utilities)
