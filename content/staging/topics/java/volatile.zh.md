---
title: Java volatile 关键字
description: 深入理解 Java volatile 关键字：可见性保证、happens-before 语义、内存屏障与实战应用
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 并发
  - volatile
  - 内存模型
  - 线程安全
status: imported
origin: old/src/content/docs/java/volatile.zh.md
divergence: 0.195
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: 并发编程
  order: 6
  lastUpdated: 2026-01-07
---

## 概念解释

`volatile` 是 Java 中用于多线程编程的关键字，它提供了一种轻量级的同步机制。当一个变量被声明为 `volatile` 时，JVM 会确保该变量的读写操作具有特殊的语义，主要体现在两个方面：**可见性保证**和**有序性保证**。

### 历史背景

在早期的 Java 版本中（Java 5 之前），`volatile` 的语义较弱，只保证可见性。Java 5 引入了新的 Java 内存模型（JSR-133），增强了 `volatile` 的语义，增加了 happens-before 规则，使其成为一个更强大、更可靠的同步工具。

### 解决的问题

在多线程环境中，每个线程可能会在自己的工作内存（CPU 缓存）中保存变量的副本。如果没有适当的同步，一个线程对变量的修改可能对其他线程不可见，导致数据不一致问题。`volatile` 正是为解决这类**可见性问题**而设计的。

```java
public class VisibilityProblem {
    // 没有 volatile，可能导致无限循环
    private boolean running = true;

    public void run() {
        while (running) {
            // 线程可能永远看不到 running 变为 false
        }
    }

    public void stop() {
        running = false; // 其他线程可能看不到这个修改
    }
}
```

## 核心原理

### Java 内存模型（JMM）

要理解 `volatile`，首先需要了解 Java 内存模型：

```
┌─────────────────────────────────────────────────────────────┐
│                        主内存 (Main Memory)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ 变量 A  │  │ 变量 B  │  │ 变量 C  │  │ 变量 D  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
        ↑↓              ↑↓              ↑↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   线程 1      │ │   线程 2      │ │   线程 3      │
│ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │
│ │ 工作内存  │ │ │ │ 工作内存  │ │ │ │ 工作内存  │ │
│ │ (CPU缓存) │ │ │ │ (CPU缓存) │ │ │ │ (CPU缓存) │ │
│ │ A' B' ... │ │ │ │ A'' B''...│ │ │ │ A''' ...  │ │
│ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │
└───────────────┘ └───────────────┘ └───────────────┘
```

### volatile 的内存语义

当变量被声明为 `volatile` 时：

1. **写操作**：将工作内存中的值立即刷新到主内存
2. **读操作**：从主内存中重新读取最新值，使工作内存中的缓存失效

```java
public class VolatileMemorySemantics {
    private volatile int value = 0;

    // 写入 volatile 变量
    public void write(int newValue) {
        // 1. 将 newValue 写入工作内存
        // 2. 立即刷新到主内存
        // 3. 通知其他 CPU 缓存失效
        value = newValue;
    }

    // 读取 volatile 变量
    public int read() {
        // 1. 使工作内存中的缓存失效
        // 2. 从主内存重新读取
        return value;
    }
}
```

### 内存屏障（Memory Barrier）

JVM 通过插入内存屏障指令来实现 `volatile` 的语义：

| 屏障类型 | 指令示例 | 作用 |
|---------|---------|------|
| LoadLoad | 读1; LoadLoad; 读2 | 确保读1在读2之前完成 |
| StoreStore | 写1; StoreStore; 写2 | 确保写1在写2之前完成 |
| LoadStore | 读1; LoadStore; 写2 | 确保读1在写2之前完成 |
| StoreLoad | 写1; StoreLoad; 读2 | 确保写1在读2之前完成（全能屏障） |

`volatile` 变量的操作会插入以下屏障：

```
volatile 写操作：
    StoreStore 屏障
    [volatile 写]
    StoreLoad 屏障

volatile 读操作：
    [volatile 读]
    LoadLoad 屏障
    LoadStore 屏障
```

### Happens-Before 规则

Java 内存模型定义了 happens-before 关系来描述操作之间的可见性：

```java
public class HappensBeforeExample {
    private int a = 0;
    private volatile boolean flag = false;

    // 线程 A
    public void writer() {
        a = 42;           // 操作 1
        flag = true;      // 操作 2（volatile 写）
        // 操作 1 happens-before 操作 2
    }

    // 线程 B
    public void reader() {
        if (flag) {       // 操作 3（volatile 读）
            int result = a; // 操作 4
            // 由于 volatile 的 happens-before 规则：
            // 操作 2 happens-before 操作 3
            // 因此操作 1 的结果对操作 4 可见
            // result 保证为 42
        }
    }
}
```

**volatile 的 happens-before 规则**：对一个 volatile 变量的写操作 happens-before 后续对该变量的读操作。

## 核心要点

### 可见性保证

`volatile` 确保一个线程对变量的修改对其他线程立即可见。

```java
public class VisibilityGuarantee {
    private volatile boolean shutdown = false;

    public void doWork() {
        while (!shutdown) {
            // 执行任务
            // 每次循环都会从主内存读取 shutdown 的最新值
        }
        System.out.println("工作线程安全停止");
    }

    public void shutdown() {
        shutdown = true; // 立即对所有线程可见
    }
}
```

### 禁止指令重排序

`volatile` 禁止编译器和处理器对其进行指令重排序优化。

```java
public class ReorderingPrevention {
    private int x = 0;
    private int y = 0;
    private volatile boolean ready = false;

    // 没有 volatile，编译器可能重排序为：
    // ready = true; x = 1; y = 2;
    public void initialize() {
        x = 1;          // 操作 A
        y = 2;          // 操作 B
        ready = true;   // 操作 C (volatile 写)
        // volatile 保证：A 和 B 不会被重排序到 C 之后
    }

    public void use() {
        if (ready) {    // volatile 读
            // 保证能看到 x = 1, y = 2
            System.out.println(x + y);
        }
    }
}
```

### 不保证原子性

`volatile` **不保证复合操作的原子性**，这是最容易被误解的特性。

```java
public class NoAtomicity {
    private volatile int count = 0;

    // 这不是线程安全的！
    public void increment() {
        count++; // 实际上是三个操作：读取、增加、写入
    }

    // count++ 等价于：
    public void incrementExpanded() {
        int temp = count;  // 1. 读取
        temp = temp + 1;   // 2. 增加
        count = temp;      // 3. 写入
        // 多个线程可能读到相同的值，导致更新丢失
    }
}
```

### 适用的操作类型

`volatile` 适用于以下场景：

| 操作类型 | 是否线程安全 | 示例 |
|---------|-------------|------|
| 单次读取 | 是 | `return flag;` |
| 单次写入 | 是 | `flag = true;` |
| 自增/自减 | 否 | `count++;` |
| 检查后更新 | 否 | `if (x == 0) x = 1;` |
| 复合赋值 | 否 | `x += 5;` |

## 代码示例

### 示例 1：状态标志

```java
/**
 * 使用 volatile 作为状态标志
 * 适用场景：一个线程写，多个线程读
 */
public class StatusFlag {
    // 状态标志使用 volatile
    private volatile boolean initialized = false;
    private Config config;

    // 初始化方法（单线程调用）
    public void initialize() {
        // 加载配置（普通操作）
        config = loadConfig();

        // 设置初始化完成标志（volatile 写）
        // 由于 happens-before 规则，config 的初始化对其他线程可见
        initialized = true;
    }

    // 使用配置（多线程调用）
    public void doSomething() {
        // volatile 读
        if (initialized) {
            // 由于 happens-before 规则，能安全读取 config
            config.doWork();
        } else {
            throw new IllegalStateException("尚未初始化");
        }
    }

    private Config loadConfig() {
        // 加载配置的实现
        return new Config();
    }

    static class Config {
        void doWork() {
            System.out.println("使用配置执行工作");
        }
    }
}
```

### 示例 2：双重检查锁定（DCL）单例模式

```java
/**
 * 使用 volatile 实现线程安全的双重检查锁定单例
 */
public class Singleton {
    // 必须使用 volatile 防止指令重排序
    private static volatile Singleton instance;

    private Singleton() {
        // 私有构造函数
    }

    public static Singleton getInstance() {
        // 第一次检查（无锁）
        if (instance == null) {
            synchronized (Singleton.class) {
                // 第二次检查（有锁）
                if (instance == null) {
                    // 创建实例
                    // 没有 volatile，可能发生重排序：
                    // 1. 分配内存
                    // 2. instance 指向内存（此时 instance != null）
                    // 3. 初始化对象
                    // 如果 2 和 3 重排序，其他线程可能获得未初始化的对象
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

### 示例 3：一次性安全发布

```java
/**
 * 使用 volatile 实现对象的安全发布
 */
public class SafePublication {
    // volatile 确保对象引用和对象状态的可见性
    private volatile ImmutableObject sharedObject;

    public void publish(ImmutableObject obj) {
        // volatile 写确保对象完全构造后才对其他线程可见
        sharedObject = obj;
    }

    public ImmutableObject getObject() {
        // volatile 读确保获取最新的对象引用
        return sharedObject;
    }

    // 不可变对象
    static final class ImmutableObject {
        private final int value;
        private final String name;

        public ImmutableObject(int value, String name) {
            this.value = value;
            this.name = name;
        }

        public int getValue() { return value; }
        public String getName() { return name; }
    }
}
```

### 示例 4：volatile 数组

```java
/**
 * volatile 数组的正确使用
 * 注意：volatile 只保证数组引用的可见性，不保证数组元素的可见性
 */
public class VolatileArray {
    // volatile 只保证数组引用的可见性
    private volatile int[] array = new int[10];

    // 错误：修改数组元素不是线程安全的
    public void unsafeUpdate(int index, int value) {
        array[index] = value; // 不保证可见性！
    }

    // 正确：替换整个数组引用
    public void safeUpdate(int index, int value) {
        int[] newArray = array.clone();
        newArray[index] = value;
        array = newArray; // volatile 写，保证可见性
    }

    // 或者使用 AtomicIntegerArray
    private java.util.concurrent.atomic.AtomicIntegerArray atomicArray
        = new java.util.concurrent.atomic.AtomicIntegerArray(10);

    public void atomicUpdate(int index, int value) {
        atomicArray.set(index, value); // 线程安全
    }
}
```

### 示例 5：volatile 与 64 位变量

```java
/**
 * 在 32 位 JVM 上，long 和 double 的读写不是原子的
 * volatile 可以保证这些类型的原子性读写
 */
public class Volatile64Bit {
    // 在 32 位系统上，没有 volatile 的 long/double 可能出现字撕裂
    private volatile long counter = 0L;
    private volatile double value = 0.0;

    // 单独的读写是原子的
    public void setCounter(long newValue) {
        counter = newValue; // 原子写入
    }

    public long getCounter() {
        return counter; // 原子读取
    }

    // 复合操作仍然不是原子的
    public void increment() {
        counter++; // 不是原子操作！
    }

    // 对于需要原子复合操作的场景，使用 AtomicLong
    private java.util.concurrent.atomic.AtomicLong atomicCounter
        = new java.util.concurrent.atomic.AtomicLong(0L);

    public void atomicIncrement() {
        atomicCounter.incrementAndGet(); // 原子操作
    }
}
```

## 最佳实践

### 适用场景判断

```java
/**
 * volatile 使用决策树
 */
public class VolatileDecisionGuide {

    /*
     * 问题 1：变量是否会被多个线程访问？
     *   - 否 -> 不需要 volatile
     *   - 是 -> 继续问题 2
     *
     * 问题 2：变量是否只有一个线程会修改？
     *   - 是 -> volatile 可能适用，继续问题 3
     *   - 否 -> 需要更强的同步（synchronized 或 Lock）
     *
     * 问题 3：对变量的操作是否都是原子的（单次读或单次写）？
     *   - 是 -> volatile 适用
     *   - 否 -> 需要原子类或锁
     */

    // 场景 1：状态标志 - 适合 volatile
    private volatile boolean running = true;

    // 场景 2：计数器 - 不适合 volatile，使用 AtomicInteger
    private java.util.concurrent.atomic.AtomicInteger counter
        = new java.util.concurrent.atomic.AtomicInteger(0);

    // 场景 3：复杂状态 - 不适合 volatile，使用锁
    private Object lock = new Object();
    private int state1;
    private int state2;

    public void updateStates(int s1, int s2) {
        synchronized (lock) {
            state1 = s1;
            state2 = s2;
        }
    }
}
```

### 命名规范

```java
public class NamingConvention {
    // 推荐：使用有意义的名称表明 volatile 的用途
    private volatile boolean shutdownRequested;
    private volatile boolean dataReady;
    private volatile int lastUpdateVersion;

    // 可以添加注释说明 volatile 的必要性
    /**
     * 由主线程设置，工作线程读取
     * 使用 volatile 保证可见性
     */
    private volatile boolean cancelled;
}
```

### 避免过度使用

```java
public class AvoidOveruse {
    // 反模式：不必要的 volatile
    private volatile int localVar; // 如果只在单线程中使用，不需要 volatile

    // 反模式：用 volatile 替代锁
    private volatile int count = 0;
    public void badIncrement() {
        count++; // 错误：volatile 不保证原子性
    }

    // 正确做法
    private java.util.concurrent.atomic.AtomicInteger atomicCount
        = new java.util.concurrent.atomic.AtomicInteger(0);
    public void goodIncrement() {
        atomicCount.incrementAndGet();
    }
}
```

### 与 final 的配合

```java
/**
 * volatile 和 final 的组合使用
 */
public class VolatileWithFinal {
    // 不可变对象引用使用 volatile
    private volatile ImmutableConfig config;

    public void updateConfig(String newSetting) {
        // 创建新的不可变对象并原子更新引用
        config = new ImmutableConfig(newSetting);
    }

    public String getSetting() {
        return config.getSetting();
    }

    // 不可变配置类
    static final class ImmutableConfig {
        private final String setting;

        public ImmutableConfig(String setting) {
            this.setting = setting;
        }

        public String getSetting() {
            return setting;
        }
    }
}
```

## 常见陷阱

### 陷阱 1：误认为 volatile 保证原子性

```java
public class Pitfall1 {
    private volatile int count = 0;

    // 错误示例
    public void wrong() {
        for (int i = 0; i < 1000; i++) {
            count++; // 不是原子操作！
        }
    }

    // 正确示例
    private java.util.concurrent.atomic.AtomicInteger atomicCount
        = new java.util.concurrent.atomic.AtomicInteger(0);

    public void correct() {
        for (int i = 0; i < 1000; i++) {
            atomicCount.incrementAndGet();
        }
    }

    // 演示问题
    public static void main(String[] args) throws InterruptedException {
        Pitfall1 p = new Pitfall1();

        Thread t1 = new Thread(p::wrong);
        Thread t2 = new Thread(p::wrong);

        t1.start();
        t2.start();
        t1.join();
        t2.join();

        // 期望 2000，但实际可能小于 2000
        System.out.println("volatile count: " + p.count);
    }
}
```

### 陷阱 2：volatile 数组元素不保证可见性

```java
public class Pitfall2 {
    private volatile int[] data = new int[10];

    // 错误：数组元素的修改不保证可见性
    public void wrong(int index, int value) {
        data[index] = value; // 其他线程可能看不到这个修改
    }

    // 解决方案 1：替换整个数组
    public void solution1(int index, int value) {
        int[] newData = data.clone();
        newData[index] = value;
        data = newData; // volatile 写
    }

    // 解决方案 2：使用 AtomicIntegerArray
    private java.util.concurrent.atomic.AtomicIntegerArray atomicData
        = new java.util.concurrent.atomic.AtomicIntegerArray(10);

    public void solution2(int index, int value) {
        atomicData.set(index, value);
    }
}
```

### 陷阱 3：检查-执行竞态条件

```java
public class Pitfall3 {
    private volatile boolean initialized = false;
    private Resource resource;

    // 错误：存在竞态条件
    public void wrongInit() {
        if (!initialized) { // 检查
            resource = new Resource(); // 执行
            initialized = true;
            // 多个线程可能同时通过检查，创建多个 Resource
        }
    }

    // 正确：使用同步
    public synchronized void correctInit() {
        if (!initialized) {
            resource = new Resource();
            initialized = true;
        }
    }

    // 或使用双重检查锁定
    public void correctInitDCL() {
        if (!initialized) {
            synchronized (this) {
                if (!initialized) {
                    resource = new Resource();
                    initialized = true;
                }
            }
        }
    }

    static class Resource {
        // 资源类
    }
}
```

### 陷阱 4：volatile 对象的非 volatile 字段

```java
public class Pitfall4 {
    private volatile Config config;

    static class Config {
        int value1; // 非 volatile
        int value2; // 非 volatile
    }

    // 错误理解：认为修改 config 的字段会立即可见
    public void wrong() {
        config.value1 = 10; // 不保证对其他线程可见
        config.value2 = 20; // 不保证对其他线程可见
    }

    // 正确：创建新对象并替换引用
    public void correct(int v1, int v2) {
        Config newConfig = new Config();
        newConfig.value1 = v1;
        newConfig.value2 = v2;
        config = newConfig; // volatile 写，确保可见性
    }
}
```

### 陷阱 5：与 synchronized 的混淆

```java
public class Pitfall5 {
    private volatile int value = 0;

    // 错误：混合使用 volatile 和 synchronized 可能导致困惑
    public void confusing() {
        // synchronized 已经保证可见性，这里 volatile 是多余的
        synchronized (this) {
            value++;
        }
    }

    // 清晰的做法：选择一种同步机制
    // 方案 A：只用 synchronized
    private int syncValue = 0;
    public synchronized void incrementSync() {
        syncValue++;
    }

    // 方案 B：使用原子类
    private java.util.concurrent.atomic.AtomicInteger atomicValue
        = new java.util.concurrent.atomic.AtomicInteger(0);
    public void incrementAtomic() {
        atomicValue.incrementAndGet();
    }
}
```

## 性能考量

### volatile vs synchronized 性能对比

```java
import java.util.concurrent.atomic.AtomicLong;

public class PerformanceComparison {
    private volatile long volatileValue = 0;
    private long syncValue = 0;
    private AtomicLong atomicValue = new AtomicLong(0);

    // volatile 读写
    public long readVolatile() {
        return volatileValue; // 约 1-2 个 CPU 周期的额外开销
    }

    public void writeVolatile(long value) {
        volatileValue = value; // 需要刷新缓存，约 20-100 个 CPU 周期
    }

    // synchronized 读写
    public synchronized long readSync() {
        return syncValue; // 无竞争时约 10-20 个 CPU 周期
    }

    public synchronized void writeSync(long value) {
        syncValue = value; // 需要获取锁
    }

    // 原子类操作
    public long readAtomic() {
        return atomicValue.get(); // 类似 volatile 读
    }

    public void writeAtomic(long value) {
        atomicValue.set(value); // 类似 volatile 写
    }

    /*
     * 性能总结（单位：CPU 周期，大致数值）
     *
     * 操作              | volatile | synchronized | AtomicLong
     * ------------------|----------|--------------|------------
     * 读取（无竞争）     |   ~5     |    ~20      |    ~5
     * 写入（无竞争）     |  ~50     |    ~50      |   ~50
     * 原子自增          |   N/A    |    ~50      |   ~50
     *
     * 注意：实际性能取决于硬件、JVM 版本和竞争程度
     */
}
```

### 内存屏障的开销

```java
public class MemoryBarrierOverhead {
    private volatile int volatileVar;
    private int normalVar;

    /**
     * volatile 写入会插入 StoreStore 和 StoreLoad 屏障
     * StoreLoad 是最昂贵的屏障，可能导致 CPU 流水线停顿
     */
    public void demonstrateOverhead() {
        // 普通写入 - 很快
        normalVar = 1;
        normalVar = 2;
        normalVar = 3;

        // volatile 写入 - 每次都有屏障开销
        volatileVar = 1; // StoreStore + StoreLoad
        volatileVar = 2; // StoreStore + StoreLoad
        volatileVar = 3; // StoreStore + StoreLoad
    }

    /**
     * 优化建议：减少 volatile 写入次数
     */
    public void optimized() {
        // 在本地计算完成后，一次性写入
        int temp = 0;
        temp += 1;
        temp += 2;
        temp += 3;
        volatileVar = temp; // 只有一次 volatile 写入
    }
}
```

### 何时使用 volatile vs 其他同步机制

```java
public class SynchronizationChoice {
    /*
     * 选择指南：
     *
     * 1. volatile
     *    - 最适合：状态标志、一次性安全发布
     *    - 优点：轻量级，无阻塞
     *    - 缺点：不保证原子性
     *
     * 2. AtomicXxx
     *    - 最适合：计数器、累加器、CAS 操作
     *    - 优点：无锁，高并发性能好
     *    - 缺点：只适用于单个变量
     *
     * 3. synchronized
     *    - 最适合：保护多个变量的复合操作
     *    - 优点：简单，JVM 优化好
     *    - 缺点：可能造成阻塞
     *
     * 4. Lock
     *    - 最适合：需要高级功能（tryLock、超时、公平性）
     *    - 优点：灵活
     *    - 缺点：使用复杂，需要手动释放
     */

    // 示例：根据场景选择

    // 场景 1：停止标志 -> volatile
    private volatile boolean stopped = false;

    // 场景 2：计数器 -> AtomicInteger
    private java.util.concurrent.atomic.AtomicInteger counter
        = new java.util.concurrent.atomic.AtomicInteger(0);

    // 场景 3：银行账户转账 -> synchronized
    public synchronized void transfer(Account from, Account to, int amount) {
        from.balance -= amount;
        to.balance += amount;
    }

    static class Account {
        int balance;
    }
}
```

## 实战场景

### 场景 1：优雅停止线程

```java
/**
 * 使用 volatile 实现线程的优雅停止
 */
public class GracefulShutdown {
    private volatile boolean shutdown = false;
    private final Thread workerThread;

    public GracefulShutdown() {
        workerThread = new Thread(this::work);
    }

    public void start() {
        workerThread.start();
    }

    public void shutdown() {
        shutdown = true;
        workerThread.interrupt(); // 配合中断，处理阻塞操作
    }

    private void work() {
        while (!shutdown) {
            try {
                // 执行任务
                doTask();

                // 可能的阻塞操作
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                // 收到中断信号，检查 shutdown 标志
                Thread.currentThread().interrupt();
            }
        }
        cleanup();
        System.out.println("工作线程已安全停止");
    }

    private void doTask() {
        System.out.println("执行任务...");
    }

    private void cleanup() {
        System.out.println("清理资源...");
    }

    public static void main(String[] args) throws InterruptedException {
        GracefulShutdown service = new GracefulShutdown();
        service.start();

        Thread.sleep(5000);

        System.out.println("请求停止...");
        service.shutdown();
    }
}
```

### 场景 2：版本号机制

```java
/**
 * 使用 volatile 版本号实现乐观读
 */
public class VersionedData<T> {
    private volatile long version = 0;
    private T data;

    public void update(T newData) {
        // 更新数据和版本号
        synchronized (this) {
            data = newData;
            version++; // volatile 写，确保对读线程可见
        }
    }

    public T read() {
        // 乐观读：先读版本号，再读数据，最后验证版本号
        long v1 = version; // volatile 读
        T result = data;
        long v2 = version; // volatile 读

        // 如果版本号没变，说明读取期间没有写入
        if (v1 == v2 && (v1 & 1) == 0) {
            return result;
        }

        // 版本号变化或为奇数（写入中），降级为悲观读
        synchronized (this) {
            return data;
        }
    }

    public static void main(String[] args) {
        VersionedData<String> vd = new VersionedData<>();

        // 写线程
        new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                vd.update("数据-" + i);
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    break;
                }
            }
        }).start();

        // 读线程
        new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                System.out.println("读取: " + vd.read());
                try {
                    Thread.sleep(5);
                } catch (InterruptedException e) {
                    break;
                }
            }
        }).start();
    }
}
```

### 场景 3：单例模式的各种实现

```java
/**
 * 单例模式的多种实现对比
 */
public class SingletonPatterns {

    // 方式 1：双重检查锁定（DCL）- 使用 volatile
    public static class DCLSingleton {
        private static volatile DCLSingleton instance;

        private DCLSingleton() {}

        public static DCLSingleton getInstance() {
            if (instance == null) {
                synchronized (DCLSingleton.class) {
                    if (instance == null) {
                        instance = new DCLSingleton();
                    }
                }
            }
            return instance;
        }
    }

    // 方式 2：静态内部类（推荐）- 不需要 volatile
    public static class HolderSingleton {
        private HolderSingleton() {}

        private static class Holder {
            private static final HolderSingleton INSTANCE = new HolderSingleton();
        }

        public static HolderSingleton getInstance() {
            return Holder.INSTANCE;
        }
    }

    // 方式 3：枚举（最佳实践）- 不需要 volatile
    public enum EnumSingleton {
        INSTANCE;

        public void doSomething() {
            System.out.println("枚举单例执行操作");
        }
    }

    // 方式 4：原子引用 - 无锁实现
    public static class AtomicSingleton {
        private static final java.util.concurrent.atomic.AtomicReference<AtomicSingleton>
            INSTANCE = new java.util.concurrent.atomic.AtomicReference<>();

        private AtomicSingleton() {}

        public static AtomicSingleton getInstance() {
            AtomicSingleton instance = INSTANCE.get();
            if (instance == null) {
                INSTANCE.compareAndSet(null, new AtomicSingleton());
                instance = INSTANCE.get();
            }
            return instance;
        }
    }
}
```

### 场景 4：发布-订阅模式

```java
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * 使用 volatile 实现简单的发布-订阅
 */
public class SimpleEventBus<T> {
    // 最新事件
    private volatile T latestEvent;

    // 订阅者列表（线程安全）
    private final List<Consumer<T>> subscribers = new CopyOnWriteArrayList<>();

    public void subscribe(Consumer<T> subscriber) {
        subscribers.add(subscriber);

        // 新订阅者可以立即获取最新事件
        T event = latestEvent; // volatile 读
        if (event != null) {
            subscriber.accept(event);
        }
    }

    public void publish(T event) {
        latestEvent = event; // volatile 写

        // 通知所有订阅者
        for (Consumer<T> subscriber : subscribers) {
            try {
                subscriber.accept(event);
            } catch (Exception e) {
                System.err.println("订阅者处理异常: " + e.getMessage());
            }
        }
    }

    public T getLatestEvent() {
        return latestEvent; // volatile 读
    }

    public static void main(String[] args) throws InterruptedException {
        SimpleEventBus<String> eventBus = new SimpleEventBus<>();

        // 添加订阅者
        eventBus.subscribe(event -> System.out.println("订阅者 1 收到: " + event));
        eventBus.subscribe(event -> System.out.println("订阅者 2 收到: " + event));

        // 发布事件
        eventBus.publish("事件 A");
        Thread.sleep(100);
        eventBus.publish("事件 B");

        // 新订阅者
        eventBus.subscribe(event -> System.out.println("新订阅者收到: " + event));
    }
}
```

## 面试要点

### 问题 1：volatile 和 synchronized 的区别？

**答案要点**：

| 方面 | volatile | synchronized |
|------|----------|--------------|
| 原子性 | 不保证复合操作的原子性 | 保证代码块的原子性 |
| 可见性 | 保证 | 保证 |
| 有序性 | 禁止指令重排 | 保证串行执行 |
| 阻塞性 | 非阻塞 | 可能阻塞 |
| 适用范围 | 单个变量 | 代码块或方法 |
| 性能 | 较高 | 无竞争时较高，有竞争时可能下降 |

### 问题 2：为什么双重检查锁定单例需要 volatile？

**答案要点**：

```java
// instance = new Singleton() 实际上包含三个步骤：
// 1. 分配内存空间
// 2. 初始化对象
// 3. 将 instance 指向分配的内存

// 没有 volatile，JVM 可能将步骤 2 和 3 重排序为：
// 1. 分配内存空间
// 3. 将 instance 指向分配的内存（此时 instance != null）
// 2. 初始化对象

// 如果线程 A 执行到步骤 3 还没执行步骤 2，
// 线程 B 检查 instance != null，直接返回未初始化的对象
```

### 问题 3：volatile 能否保证线程安全？

**答案要点**：

volatile 本身**不能完全保证线程安全**，它只保证可见性和有序性。线程安全需要满足三个条件：原子性、可见性、有序性。volatile 只满足后两个。

```java
// 这不是线程安全的
private volatile int count = 0;
public void increment() {
    count++; // 读-改-写，非原子操作
}

// 线程安全需要额外保证原子性
private AtomicInteger atomicCount = new AtomicInteger(0);
public void safeIncrement() {
    atomicCount.incrementAndGet();
}
```

### 问题 4：什么是 happens-before 规则？volatile 的 happens-before 规则是什么？

**答案要点**：

happens-before 是 JMM 定义的用于描述操作之间内存可见性的规则。如果操作 A happens-before 操作 B，那么 A 的结果对 B 可见。

volatile 的 happens-before 规则：
- 对 volatile 变量的**写操作** happens-before 后续对该变量的**读操作**
- 写 volatile 之前的所有操作 happens-before 读 volatile 之后的操作

### 问题 5：volatile 的实现原理是什么？

**答案要点**：

1. **内存屏障**：JVM 在 volatile 读写前后插入内存屏障指令
   - 写前插入 StoreStore，写后插入 StoreLoad
   - 读后插入 LoadLoad 和 LoadStore

2. **缓存一致性协议**：在硬件层面，通过 MESI 等缓存一致性协议保证多核 CPU 缓存的一致性

3. **lock 前缀指令**：在 x86 架构上，volatile 写会生成带 lock 前缀的指令，强制将缓存行写回主内存

### 问题 6：什么场景适合使用 volatile？

**答案要点**：

1. **状态标志**：一个线程写，多个线程读
2. **一次性安全发布**：发布不可变对象的引用
3. **双重检查锁定**：单例模式的实现
4. **volatile bean**：作为触发器，保证对象状态的可见性

**不适合的场景**：
- 复合操作（如 count++）
- 多个变量需要同时更新
- 读-检查-写的操作

## 延伸阅读

### 官方文档
- [Java Language Specification - volatile](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.3.1.4)
- [JSR-133: Java Memory Model and Thread Specification](https://www.cs.umd.edu/~pugh/java/memoryModel/jsr133.pdf)

### 经典书籍
- 《Java 并发编程实战》(Java Concurrency in Practice) - Brian Goetz
- 《Java 并发编程的艺术》 - 方腾飞
- 《深入理解 Java 虚拟机》 - 周志明

### 推荐文章
- [The JSR-133 Cookbook for Compiler Writers](https://gee.cs.oswego.edu/dl/jmm/cookbook.html) - Doug Lea
- [Java Memory Model Pragmatics](https://shipilev.net/blog/2014/jmm-pragmatics/) - Aleksey Shipilev
- [Close Encounters of The Java Memory Model Kind](https://shipilev.net/blog/2016/close-encounters-of-jmm-kind/) - Aleksey Shipilev

### 相关源码
- `java.util.concurrent.atomic` 包 - 原子类实现
- `java.util.concurrent.locks.AbstractQueuedSynchronizer` - AQS 同步器
- JDK `Unsafe` 类 - 底层内存操作
