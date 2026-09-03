---
title: Java 原子类
description: 深入理解 Java 原子类：AtomicInteger、AtomicLong、AtomicReference、LongAdder 与 CAS 操作原理
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 原子类
  - CAS
  - 并发
  - 无锁编程
status: imported
origin: old/src/content/docs/java/atomic-classes.zh.md
divergence: 0.192
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: 并发编程
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释

原子类（Atomic Classes）是 Java 并发包 `java.util.concurrent.atomic` 中提供的一组类，用于在多线程环境下实现无锁的线程安全操作。"原子"一词源于希腊语，意为"不可分割"，在并发编程中，原子操作是指不会被线程调度机制中断的操作——该操作一旦开始，就会一直运行到结束，中间不会有任何上下文切换。

### 为什么需要原子类

在多线程环境中，即使是简单的 `i++` 操作也不是线程安全的：

```java
public class NonAtomicExample {
    private int count = 0;

    // 非原子操作：读取 -> 增加 -> 写入
    public void increment() {
        count++; // 实际包含三个步骤，可能被其他线程打断
    }
}
```

传统的解决方案是使用 `synchronized` 关键字：

```java
public synchronized void increment() {
    count++;
}
```

但是 `synchronized` 会带来较大的性能开销，因为它需要获取和释放锁。原子类通过 CAS（Compare-And-Swap）操作提供了一种更高效的无锁解决方案。

### 原子类的历史演进

- **Java 5（2004）**：引入 `java.util.concurrent.atomic` 包，包含 `AtomicInteger`、`AtomicLong`、`AtomicReference` 等基础原子类
- **Java 8（2014）**：新增 `LongAdder`、`LongAccumulator`、`DoubleAdder`、`DoubleAccumulator`，专为高并发场景优化
- **Java 9（2017）**：引入 `VarHandle`，提供更底层、更灵活的原子操作支持

## 核心原理

### CAS（Compare-And-Swap）操作

CAS 是原子类的核心机制，它是一条 CPU 原子指令，包含三个操作数：

1. **内存位置 V**：变量的内存地址
2. **期望值 A**：期望变量当前的值
3. **新值 B**：要设置的新值

CAS 操作的语义是：**如果变量 V 的当前值等于期望值 A，则将 V 的值更新为 B，否则不做任何操作**。整个操作是原子的，不会被中断。

```
if (V == A) {
    V = B
    return true
} else {
    return false
}
```

### Unsafe 类与底层实现

Java 的原子类通过 `sun.misc.Unsafe` 类（Java 9+ 为 `jdk.internal.misc.Unsafe`）调用底层 CAS 操作：

```java
// AtomicInteger 的核心实现原理（简化版）
public class AtomicInteger {
    private static final Unsafe U = Unsafe.getUnsafe();
    private static final long VALUE; // value 字段的内存偏移量

    static {
        VALUE = U.objectFieldOffset(AtomicInteger.class, "value");
    }

    private volatile int value; // volatile 保证可见性

    public final int incrementAndGet() {
        return U.getAndAddInt(this, VALUE, 1) + 1;
    }

    public final boolean compareAndSet(int expectedValue, int newValue) {
        return U.compareAndSetInt(this, VALUE, expectedValue, newValue);
    }
}
```

### 内存屏障与可见性

原子类的 `value` 字段使用 `volatile` 修饰，确保：

1. **可见性**：一个线程的修改对其他线程立即可见
2. **禁止指令重排序**：编译器和处理器不会对 volatile 变量的读写操作进行重排序

```java
// volatile 的作用
private volatile int value;

// 写操作后插入 StoreStore + StoreLoad 屏障
// 读操作前插入 LoadLoad + LoadStore 屏障
```

### CAS 的自旋重试

当 CAS 操作失败时（说明有其他线程修改了值），原子类会自旋重试：

```java
// getAndAddInt 的实现
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        v = getIntVolatile(o, offset);        // 读取当前值
    } while (!weakCompareAndSetInt(o, offset, v, v + delta)); // CAS 直到成功
    return v;
}
```

## 核心要点

### 原子类分类

Java 原子类可以分为以下几类：

| 类别 | 类名 | 说明 |
|------|------|------|
| 基本类型 | AtomicInteger | 原子整型 |
| 基本类型 | AtomicLong | 原子长整型 |
| 基本类型 | AtomicBoolean | 原子布尔型 |
| 引用类型 | AtomicReference | 原子引用 |
| 引用类型 | AtomicStampedReference | 带版本号的原子引用（解决 ABA 问题）|
| 引用类型 | AtomicMarkableReference | 带标记的原子引用 |
| 数组类型 | AtomicIntegerArray | 原子整型数组 |
| 数组类型 | AtomicLongArray | 原子长整型数组 |
| 数组类型 | AtomicReferenceArray | 原子引用数组 |
| 字段更新器 | AtomicIntegerFieldUpdater | 整型字段原子更新器 |
| 字段更新器 | AtomicLongFieldUpdater | 长整型字段原子更新器 |
| 字段更新器 | AtomicReferenceFieldUpdater | 引用字段原子更新器 |
| 累加器 | LongAdder | 高性能长整型累加器 |
| 累加器 | LongAccumulator | 通用长整型累加器 |
| 累加器 | DoubleAdder | 高性能双精度累加器 |
| 累加器 | DoubleAccumulator | 通用双精度累加器 |

### 核心方法

原子类提供了一组标准的原子操作方法：

```java
// 以 AtomicInteger 为例

// 获取和设置
int get()                           // 获取当前值
void set(int newValue)              // 设置新值
void lazySet(int newValue)          // 延迟设置（最终一致性）
int getAndSet(int newValue)         // 获取旧值并设置新值

// CAS 操作
boolean compareAndSet(int expect, int update)    // CAS 操作
boolean weakCompareAndSet(int expect, int update) // 弱 CAS（可能虚假失败）

// 原子递增/递减
int getAndIncrement()               // 获取当前值，然后加 1
int incrementAndGet()               // 加 1，然后获取新值
int getAndDecrement()               // 获取当前值，然后减 1
int decrementAndGet()               // 减 1，然后获取新值

// 原子加减
int getAndAdd(int delta)            // 获取当前值，然后加 delta
int addAndGet(int delta)            // 加 delta，然后获取新值

// 函数式更新（Java 8+）
int getAndUpdate(IntUnaryOperator updateFunction)
int updateAndGet(IntUnaryOperator updateFunction)
int getAndAccumulate(int x, IntBinaryOperator accumulatorFunction)
int accumulateAndGet(int x, IntBinaryOperator accumulatorFunction)
```

## 代码示例

### AtomicInteger 基本使用

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicIntegerExample {
    private AtomicInteger count = new AtomicInteger(0);

    // 线程安全的递增
    public void increment() {
        count.incrementAndGet();
    }

    // 线程安全的递减
    public void decrement() {
        count.decrementAndGet();
    }

    // 原子性地加上指定值
    public void add(int delta) {
        count.addAndGet(delta);
    }

    // CAS 操作
    public boolean compareAndSet(int expected, int newValue) {
        return count.compareAndSet(expected, newValue);
    }

    public int getCount() {
        return count.get();
    }

    public static void main(String[] args) throws InterruptedException {
        AtomicIntegerExample example = new AtomicIntegerExample();

        // 创建多个线程并发递增
        Thread[] threads = new Thread[10];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    example.increment();
                }
            });
            threads[i].start();
        }

        // 等待所有线程完成
        for (Thread thread : threads) {
            thread.join();
        }

        // 输出结果：10000（线程安全）
        System.out.println("最终计数: " + example.getCount());
    }
}
```

### AtomicLong 与计数器

```java
import java.util.concurrent.atomic.AtomicLong;

public class AtomicLongCounter {
    private final AtomicLong requestCount = new AtomicLong(0);
    private final AtomicLong successCount = new AtomicLong(0);
    private final AtomicLong errorCount = new AtomicLong(0);

    // 记录请求
    public void recordRequest() {
        requestCount.incrementAndGet();
    }

    // 记录成功
    public void recordSuccess() {
        successCount.incrementAndGet();
    }

    // 记录错误
    public void recordError() {
        errorCount.incrementAndGet();
    }

    // 获取统计信息
    public String getStats() {
        return String.format(
            "请求总数: %d, 成功: %d, 失败: %d, 成功率: %.2f%%",
            requestCount.get(),
            successCount.get(),
            errorCount.get(),
            (successCount.get() * 100.0) / Math.max(1, requestCount.get())
        );
    }

    // 重置计数器
    public void reset() {
        requestCount.set(0);
        successCount.set(0);
        errorCount.set(0);
    }

    public static void main(String[] args) {
        AtomicLongCounter counter = new AtomicLongCounter();

        // 模拟请求处理
        for (int i = 0; i < 100; i++) {
            counter.recordRequest();
            if (Math.random() > 0.1) {
                counter.recordSuccess();
            } else {
                counter.recordError();
            }
        }

        System.out.println(counter.getStats());
    }
}
```

### AtomicReference 操作对象引用

```java
import java.util.concurrent.atomic.AtomicReference;

public class AtomicReferenceExample {

    // 不可变的用户对象
    static class User {
        private final String name;
        private final int age;

        public User(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public String getName() { return name; }
        public int getAge() { return age; }

        @Override
        public String toString() {
            return "User{name='" + name + "', age=" + age + "}";
        }
    }

    private final AtomicReference<User> currentUser = new AtomicReference<>();

    // 原子性地设置用户（仅当当前为 null）
    public boolean initUser(User user) {
        return currentUser.compareAndSet(null, user);
    }

    // 原子性地更新用户
    public User updateUser(String newName, int newAge) {
        User oldUser;
        User newUser;
        do {
            oldUser = currentUser.get();
            if (oldUser == null) {
                return null;
            }
            newUser = new User(newName, newAge);
        } while (!currentUser.compareAndSet(oldUser, newUser));
        return newUser;
    }

    // 使用 updateAndGet 更新（Java 8+）
    public User incrementAge() {
        return currentUser.updateAndGet(user -> {
            if (user == null) return null;
            return new User(user.getName(), user.getAge() + 1);
        });
    }

    public User getUser() {
        return currentUser.get();
    }

    public static void main(String[] args) {
        AtomicReferenceExample example = new AtomicReferenceExample();

        // 初始化用户
        User user = new User("张三", 25);
        boolean initialized = example.initUser(user);
        System.out.println("初始化成功: " + initialized);
        System.out.println("当前用户: " + example.getUser());

        // 更新用户
        example.updateUser("李四", 30);
        System.out.println("更新后: " + example.getUser());

        // 增加年龄
        example.incrementAge();
        System.out.println("年龄+1后: " + example.getUser());
    }
}
```

### CAS 实现无锁栈

```java
import java.util.concurrent.atomic.AtomicReference;

public class LockFreeStack<T> {

    private static class Node<T> {
        final T value;
        Node<T> next;

        Node(T value) {
            this.value = value;
        }
    }

    private final AtomicReference<Node<T>> top = new AtomicReference<>();

    // 入栈
    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = top.get();
            newHead.next = oldHead;
        } while (!top.compareAndSet(oldHead, newHead));
    }

    // 出栈
    public T pop() {
        Node<T> oldHead;
        Node<T> newHead;
        do {
            oldHead = top.get();
            if (oldHead == null) {
                return null;
            }
            newHead = oldHead.next;
        } while (!top.compareAndSet(oldHead, newHead));
        return oldHead.value;
    }

    // 查看栈顶元素
    public T peek() {
        Node<T> head = top.get();
        return head == null ? null : head.value;
    }

    // 判断是否为空
    public boolean isEmpty() {
        return top.get() == null;
    }

    public static void main(String[] args) throws InterruptedException {
        LockFreeStack<Integer> stack = new LockFreeStack<>();

        // 多线程并发入栈
        Thread[] pushThreads = new Thread[5];
        for (int i = 0; i < pushThreads.length; i++) {
            final int threadId = i;
            pushThreads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    stack.push(threadId * 100 + j);
                }
            });
            pushThreads[i].start();
        }

        for (Thread t : pushThreads) {
            t.join();
        }

        // 统计出栈数量
        int count = 0;
        while (stack.pop() != null) {
            count++;
        }

        System.out.println("总共出栈元素: " + count); // 应该是 500
    }
}
```

### LongAdder 高并发累加

```java
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.CountDownLatch;

public class LongAdderExample {

    public static void main(String[] args) throws InterruptedException {
        int threadCount = 100;
        int incrementsPerThread = 100000;

        // 使用 AtomicLong
        AtomicLong atomicLong = new AtomicLong(0);
        long atomicStart = System.nanoTime();
        CountDownLatch atomicLatch = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                for (int j = 0; j < incrementsPerThread; j++) {
                    atomicLong.incrementAndGet();
                }
                atomicLatch.countDown();
            }).start();
        }
        atomicLatch.await();
        long atomicTime = System.nanoTime() - atomicStart;

        // 使用 LongAdder
        LongAdder longAdder = new LongAdder();
        long adderStart = System.nanoTime();
        CountDownLatch adderLatch = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                for (int j = 0; j < incrementsPerThread; j++) {
                    longAdder.increment();
                }
                adderLatch.countDown();
            }).start();
        }
        adderLatch.await();
        long adderTime = System.nanoTime() - adderStart;

        System.out.println("AtomicLong 结果: " + atomicLong.get() +
                          ", 耗时: " + atomicTime / 1_000_000 + " ms");
        System.out.println("LongAdder 结果: " + longAdder.sum() +
                          ", 耗时: " + adderTime / 1_000_000 + " ms");
        System.out.println("LongAdder 快了约: " +
                          String.format("%.2f", (double) atomicTime / adderTime) + " 倍");
    }
}
```

### AtomicStampedReference 解决 ABA 问题

```java
import java.util.concurrent.atomic.AtomicStampedReference;

public class AtomicStampedReferenceExample {

    public static void main(String[] args) throws InterruptedException {
        // 初始值为 "A"，版本号为 0
        AtomicStampedReference<String> ref = new AtomicStampedReference<>("A", 0);

        // 线程 1：尝试将 A 改为 C
        Thread thread1 = new Thread(() -> {
            int stamp = ref.getStamp();
            String value = ref.getReference();
            System.out.println("线程1 读取: 值=" + value + ", 版本=" + stamp);

            try {
                Thread.sleep(1000); // 模拟业务处理
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            // 尝试 CAS（会失败，因为版本号已变化）
            boolean success = ref.compareAndSet(value, "C", stamp, stamp + 1);
            System.out.println("线程1 CAS 结果: " + success);
        });

        // 线程 2：A -> B -> A（制造 ABA 问题）
        Thread thread2 = new Thread(() -> {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            int stamp = ref.getStamp();
            String value = ref.getReference();

            // A -> B
            boolean success1 = ref.compareAndSet(value, "B", stamp, stamp + 1);
            System.out.println("线程2 A->B: " + success1 +
                              ", 当前版本: " + ref.getStamp());

            // B -> A
            stamp = ref.getStamp();
            boolean success2 = ref.compareAndSet("B", "A", stamp, stamp + 1);
            System.out.println("线程2 B->A: " + success2 +
                              ", 当前版本: " + ref.getStamp());
        });

        thread1.start();
        thread2.start();

        thread1.join();
        thread2.join();

        System.out.println("最终值: " + ref.getReference() +
                          ", 版本: " + ref.getStamp());
    }
}
```

### 字段更新器 FieldUpdater

```java
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;
import java.util.concurrent.atomic.AtomicReferenceFieldUpdater;

public class FieldUpdaterExample {

    // 必须是 volatile 修饰的字段
    static class User {
        volatile int age;
        volatile String name;

        public User(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }

    // 创建字段更新器
    private static final AtomicIntegerFieldUpdater<User> AGE_UPDATER =
        AtomicIntegerFieldUpdater.newUpdater(User.class, "age");

    private static final AtomicReferenceFieldUpdater<User, String> NAME_UPDATER =
        AtomicReferenceFieldUpdater.newUpdater(User.class, String.class, "name");

    public static void main(String[] args) {
        User user = new User("张三", 25);

        // 原子递增年龄
        int oldAge = AGE_UPDATER.getAndIncrement(user);
        System.out.println("旧年龄: " + oldAge + ", 新年龄: " + user.age);

        // CAS 更新年龄
        boolean ageUpdated = AGE_UPDATER.compareAndSet(user, 26, 30);
        System.out.println("年龄 CAS 更新: " + ageUpdated + ", 当前年龄: " + user.age);

        // CAS 更新名字
        boolean nameUpdated = NAME_UPDATER.compareAndSet(user, "张三", "李四");
        System.out.println("名字 CAS 更新: " + nameUpdated + ", 当前名字: " + user.name);

        // 原子累加
        AGE_UPDATER.addAndGet(user, 5);
        System.out.println("累加后年龄: " + user.age);
    }
}
```

### LongAccumulator 自定义累加逻辑

```java
import java.util.concurrent.atomic.LongAccumulator;
import java.util.concurrent.CountDownLatch;
import java.util.Random;

public class LongAccumulatorExample {

    public static void main(String[] args) throws InterruptedException {
        // 求最大值的累加器
        LongAccumulator maxAccumulator = new LongAccumulator(Long::max, Long.MIN_VALUE);

        // 求最小值的累加器
        LongAccumulator minAccumulator = new LongAccumulator(Long::min, Long.MAX_VALUE);

        // 求和的累加器
        LongAccumulator sumAccumulator = new LongAccumulator(Long::sum, 0);

        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        Random random = new Random();

        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    long value = random.nextInt(1000);
                    maxAccumulator.accumulate(value);
                    minAccumulator.accumulate(value);
                    sumAccumulator.accumulate(value);
                }
                latch.countDown();
            }).start();
        }

        latch.await();

        System.out.println("最大值: " + maxAccumulator.get());
        System.out.println("最小值: " + minAccumulator.get());
        System.out.println("总和: " + sumAccumulator.get());

        // 重置累加器
        maxAccumulator.reset();
        System.out.println("重置后: " + maxAccumulator.get()); // Long.MIN_VALUE
    }
}
```

## 最佳实践

### 选择合适的原子类

```java
// 单个计数器：使用 AtomicInteger 或 AtomicLong
private final AtomicInteger counter = new AtomicInteger(0);

// 高并发累加场景：优先使用 LongAdder
private final LongAdder highConcurrencyCounter = new LongAdder();

// 对象引用的原子操作：使用 AtomicReference
private final AtomicReference<Config> config = new AtomicReference<>();

// 需要检测 ABA 问题：使用 AtomicStampedReference
private final AtomicStampedReference<Node> head = new AtomicStampedReference<>(null, 0);

// 已有类的字段需要原子操作：使用 FieldUpdater
private static final AtomicIntegerFieldUpdater<MyClass> COUNTER_UPDATER =
    AtomicIntegerFieldUpdater.newUpdater(MyClass.class, "counter");
```

### 正确使用 CAS 循环

```java
public class CASBestPractice {
    private final AtomicInteger value = new AtomicInteger(0);

    // 推荐：使用内置方法
    public int safeIncrement() {
        return value.incrementAndGet();
    }

    // 自定义逻辑：使用 updateAndGet（Java 8+）
    public int incrementIfPositive() {
        return value.updateAndGet(current -> {
            if (current > 0) {
                return current + 1;
            }
            return current;
        });
    }

    // 需要返回旧值：使用 getAndUpdate
    public int multiplyByTwo() {
        return value.getAndUpdate(current -> current * 2);
    }

    // 涉及外部状态：手动 CAS 循环
    public int addWithLimit(int delta, int limit) {
        int current;
        int next;
        do {
            current = value.get();
            next = Math.min(current + delta, limit);
            if (next == current) {
                return current; // 无需更新
            }
        } while (!value.compareAndSet(current, next));
        return next;
    }
}
```

### 避免不必要的原子操作

```java
public class AtomicEfficiency {
    private final AtomicInteger counter = new AtomicInteger(0);

    // 不推荐：多次原子操作
    public void badIncrement() {
        if (counter.get() < 100) {    // 原子读
            counter.incrementAndGet(); // 原子写
        }
        // 问题：两个操作之间可能被其他线程修改
    }

    // 推荐：单次原子操作
    public void goodIncrement() {
        counter.updateAndGet(current -> {
            if (current < 100) {
                return current + 1;
            }
            return current;
        });
    }

    // 批量操作：先计算，最后一次更新
    public void batchAdd(int[] values) {
        int sum = 0;
        for (int value : values) {
            sum += value;
        }
        counter.addAndGet(sum); // 只有一次原子操作
    }
}
```

### 合理使用 lazySet

```java
public class LazySetExample {
    private final AtomicReference<Object> ref = new AtomicReference<>();

    // 普通 set：立即可见，带有内存屏障
    public void normalSet(Object value) {
        ref.set(value);
    }

    // lazySet：最终可见，无 StoreLoad 屏障，性能更好
    // 适用场景：不需要立即可见，如对象回收前的清理
    public void lazySetExample(Object value) {
        ref.lazySet(value);
    }

    // 典型用例：在循环结束时重置状态
    public void processAndReset(Object[] items) {
        for (Object item : items) {
            ref.set(item);
            // 处理 item...
        }
        ref.lazySet(null); // 最终会被看到，无需立即可见
    }
}
```

## 常见陷阱

### ABA 问题

```java
public class ABAProblem {
    private AtomicReference<String> ref = new AtomicReference<>("A");

    public void abaProblemDemo() throws InterruptedException {
        // 线程 1：读取 A，准备改成 C
        Thread t1 = new Thread(() -> {
            String current = ref.get();
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {}

            // 虽然值还是 A，但实际上已经被修改过了
            boolean success = ref.compareAndSet(current, "C");
            System.out.println("T1 CAS: " + success); // true，但可能不是期望的结果
        });

        // 线程 2：A -> B -> A
        Thread t2 = new Thread(() -> {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {}

            ref.compareAndSet("A", "B");
            System.out.println("T2: A -> B");

            ref.compareAndSet("B", "A");
            System.out.println("T2: B -> A");
        });

        t1.start();
        t2.start();
        t1.join();
        t2.join();
    }

    // 解决方案：使用 AtomicStampedReference
    private AtomicStampedReference<String> stampedRef =
        new AtomicStampedReference<>("A", 0);

    public void abaSolution() {
        int[] stampHolder = new int[1];
        String current = stampedRef.get(stampHolder);
        int stamp = stampHolder[0];

        // 即使值相同，版本号不同也会失败
        boolean success = stampedRef.compareAndSet(current, "C", stamp, stamp + 1);
    }
}
```

### 忘记处理 CAS 失败

```java
public class CASFailure {
    private AtomicInteger value = new AtomicInteger(0);

    // 错误：没有处理 CAS 失败
    public void badCAS() {
        int current = value.get();
        value.compareAndSet(current, current + 1); // 可能失败，但没有处理
    }

    // 正确：循环重试直到成功
    public void goodCAS() {
        int current;
        do {
            current = value.get();
        } while (!value.compareAndSet(current, current + 1));
    }

    // 更好：直接使用内置方法
    public void bestCAS() {
        value.incrementAndGet(); // 内部已处理重试
    }
}
```

### 复合操作非原子

```java
public class CompoundOperation {
    private AtomicInteger count = new AtomicInteger(0);
    private AtomicInteger max = new AtomicInteger(0);

    // 错误：两个原子操作的组合不是原子的
    public void badUpdate(int value) {
        count.incrementAndGet();
        if (value > max.get()) {
            max.set(value); // 可能覆盖其他线程的更新
        }
    }

    // 正确：使用单个原子操作更新 max
    public void goodUpdateMax(int value) {
        max.updateAndGet(current -> Math.max(current, value));
    }

    // 如果需要同时更新多个值，考虑使用锁或不可变对象
    static class Stats {
        final int count;
        final int max;
        Stats(int count, int max) {
            this.count = count;
            this.max = max;
        }
    }

    private AtomicReference<Stats> stats = new AtomicReference<>(new Stats(0, 0));

    public void atomicUpdate(int value) {
        stats.updateAndGet(current -> new Stats(
            current.count + 1,
            Math.max(current.max, value)
        ));
    }
}
```

### 自旋过度消耗 CPU

```java
public class SpinningCPU {
    private AtomicBoolean lock = new AtomicBoolean(false);

    // 问题：高竞争时会消耗大量 CPU
    public void badSpinLock() {
        while (!lock.compareAndSet(false, true)) {
            // 空转，消耗 CPU
        }
        try {
            // 临界区
        } finally {
            lock.set(false);
        }
    }

    // 改进：添加退避策略
    public void betterSpinLock() {
        int spins = 0;
        while (!lock.compareAndSet(false, true)) {
            if (spins < 10) {
                Thread.onSpinWait(); // Java 9+ 提示 CPU 正在自旋
            } else if (spins < 20) {
                Thread.yield(); // 让出 CPU
            } else {
                try {
                    Thread.sleep(1); // 短暂休眠
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
            spins++;
        }
        try {
            // 临界区
        } finally {
            lock.set(false);
        }
    }
}
```

### LongAdder 的 sum() 不精确

```java
public class LongAdderPrecision {
    private LongAdder adder = new LongAdder();

    public void demo() throws InterruptedException {
        // 启动多个线程累加
        Thread[] threads = new Thread[10];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    adder.increment();
                }
            });
            threads[i].start();
        }

        // 注意：在并发进行时，sum() 返回的是近似值
        System.out.println("并发中的 sum: " + adder.sum()); // 可能不准确

        // 等待所有线程完成后，sum() 才准确
        for (Thread t : threads) {
            t.join();
        }
        System.out.println("完成后的 sum: " + adder.sum()); // 准确
    }
}
```

## 性能考量

### CAS vs synchronized 性能对比

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class PerformanceComparison {
    private static final int THREAD_COUNT = 10;
    private static final int OPERATIONS_PER_THREAD = 1_000_000;

    // synchronized 版本
    static class SynchronizedCounter {
        private int count = 0;
        public synchronized void increment() { count++; }
        public synchronized int get() { return count; }
    }

    // AtomicInteger 版本
    static class AtomicCounter {
        private AtomicInteger count = new AtomicInteger(0);
        public void increment() { count.incrementAndGet(); }
        public int get() { return count.get(); }
    }

    // LongAdder 版本
    static class LongAdderCounter {
        private LongAdder count = new LongAdder();
        public void increment() { count.increment(); }
        public long get() { return count.sum(); }
    }

    // ReentrantLock 版本
    static class LockCounter {
        private int count = 0;
        private Lock lock = new ReentrantLock();
        public void increment() {
            lock.lock();
            try { count++; } finally { lock.unlock(); }
        }
        public int get() { return count; }
    }

    public static void main(String[] args) throws Exception {
        // 测试 synchronized
        benchmark("synchronized", () -> {
            SynchronizedCounter counter = new SynchronizedCounter();
            runTest(counter::increment);
        });

        // 测试 AtomicInteger
        benchmark("AtomicInteger", () -> {
            AtomicCounter counter = new AtomicCounter();
            runTest(counter::increment);
        });

        // 测试 LongAdder
        benchmark("LongAdder", () -> {
            LongAdderCounter counter = new LongAdderCounter();
            runTest(counter::increment);
        });

        // 测试 ReentrantLock
        benchmark("ReentrantLock", () -> {
            LockCounter counter = new LockCounter();
            runTest(counter::increment);
        });
    }

    private static void runTest(Runnable task) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_COUNT);
        CountDownLatch latch = new CountDownLatch(THREAD_COUNT);

        for (int i = 0; i < THREAD_COUNT; i++) {
            executor.submit(() -> {
                for (int j = 0; j < OPERATIONS_PER_THREAD; j++) {
                    task.run();
                }
                latch.countDown();
            });
        }

        latch.await();
        executor.shutdown();
    }

    private static void benchmark(String name, ThrowingRunnable task) throws Exception {
        // 预热
        task.run();

        long start = System.nanoTime();
        task.run();
        long duration = System.nanoTime() - start;

        System.out.printf("%s: %d ms%n", name, duration / 1_000_000);
    }

    @FunctionalInterface
    interface ThrowingRunnable {
        void run() throws Exception;
    }
}
```

### 选择建议

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 低竞争，简单计数 | AtomicInteger/AtomicLong | 简单高效 |
| 高竞争，只需累加 | LongAdder | 分散热点，吞吐量更高 |
| 需要精确值 | AtomicLong | LongAdder.sum() 在并发时不精确 |
| 对象引用更新 | AtomicReference | 无锁更新对象引用 |
| 可能存在 ABA | AtomicStampedReference | 版本号检测 |
| 已有类的字段 | FieldUpdater | 无需修改类定义 |
| 复杂原子操作 | synchronized 或 Lock | CAS 不适合复杂逻辑 |

### LongAdder 内部原理

```
LongAdder 内部结构：

+--------+
|  base  |  基础值，低竞争时只使用这个
+--------+
    |
    v
+--------+--------+--------+--------+
| Cell 0 | Cell 1 | Cell 2 | Cell 3 |  Cell 数组（竞争时扩展）
+--------+--------+--------+--------+

累加策略：
1. 首先尝试 CAS 更新 base
2. 失败则根据线程 hash 定位到某个 Cell
3. 在 Cell 上进行 CAS 操作
4. Cell CAS 失败则尝试扩容或重新 hash

sum() = base + sum(cells[i])
```

## 实战场景

### 高性能计数器

```java
import java.util.concurrent.atomic.*;

public class HighPerformanceCounter {
    private final LongAdder requestCount = new LongAdder();
    private final LongAdder successCount = new LongAdder();
    private final LongAdder errorCount = new LongAdder();
    private final LongAdder totalLatency = new LongAdder();

    // 记录请求
    public void recordRequest(long latencyMs, boolean success) {
        requestCount.increment();
        totalLatency.add(latencyMs);

        if (success) {
            successCount.increment();
        } else {
            errorCount.increment();
        }
    }

    // 获取快照（用于监控）
    public Snapshot getSnapshot() {
        return new Snapshot(
            requestCount.sum(),
            successCount.sum(),
            errorCount.sum(),
            totalLatency.sum()
        );
    }

    public static class Snapshot {
        public final long requests;
        public final long successes;
        public final long errors;
        public final long totalLatency;

        Snapshot(long requests, long successes, long errors, long totalLatency) {
            this.requests = requests;
            this.successes = successes;
            this.errors = errors;
            this.totalLatency = totalLatency;
        }

        public double getSuccessRate() {
            return requests == 0 ? 0 : (double) successes / requests * 100;
        }

        public double getAverageLatency() {
            return requests == 0 ? 0 : (double) totalLatency / requests;
        }

        @Override
        public String toString() {
            return String.format(
                "请求: %d, 成功: %d, 失败: %d, 成功率: %.2f%%, 平均延迟: %.2fms",
                requests, successes, errors, getSuccessRate(), getAverageLatency()
            );
        }
    }
}
```

### 无锁缓存实现

```java
import java.util.concurrent.atomic.AtomicReference;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AtomicCache<K, V> {

    private static class CacheEntry<V> {
        final V value;
        final long expireTime;

        CacheEntry(V value, long ttlMs) {
            this.value = value;
            this.expireTime = System.currentTimeMillis() + ttlMs;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }

    private final ConcurrentHashMap<K, AtomicReference<CacheEntry<V>>> cache =
        new ConcurrentHashMap<>();
    private final long defaultTtlMs;

    public AtomicCache(long defaultTtlMs) {
        this.defaultTtlMs = defaultTtlMs;
    }

    // 获取缓存值
    public V get(K key) {
        AtomicReference<CacheEntry<V>> ref = cache.get(key);
        if (ref == null) {
            return null;
        }

        CacheEntry<V> entry = ref.get();
        if (entry == null || entry.isExpired()) {
            // 清理过期条目
            cache.remove(key, ref);
            return null;
        }

        return entry.value;
    }

    // 设置缓存值
    public void put(K key, V value) {
        put(key, value, defaultTtlMs);
    }

    public void put(K key, V value, long ttlMs) {
        CacheEntry<V> newEntry = new CacheEntry<>(value, ttlMs);
        cache.compute(key, (k, ref) -> {
            if (ref == null) {
                return new AtomicReference<>(newEntry);
            }
            ref.set(newEntry);
            return ref;
        });
    }

    // 如果不存在则设置
    public V putIfAbsent(K key, V value) {
        return putIfAbsent(key, value, defaultTtlMs);
    }

    public V putIfAbsent(K key, V value, long ttlMs) {
        CacheEntry<V> newEntry = new CacheEntry<>(value, ttlMs);
        AtomicReference<CacheEntry<V>> ref = cache.computeIfAbsent(key,
            k -> new AtomicReference<>());

        CacheEntry<V> existing = ref.get();
        if (existing != null && !existing.isExpired()) {
            return existing.value;
        }

        // CAS 设置新值
        if (ref.compareAndSet(existing, newEntry)) {
            return null; // 成功设置
        }

        // CAS 失败，返回当前值
        CacheEntry<V> current = ref.get();
        return current == null ? null : current.value;
    }

    // 删除
    public V remove(K key) {
        AtomicReference<CacheEntry<V>> ref = cache.remove(key);
        if (ref == null) {
            return null;
        }
        CacheEntry<V> entry = ref.get();
        return entry == null ? null : entry.value;
    }
}
```

### 序列号生成器

```java
import java.util.concurrent.atomic.AtomicLong;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class SequenceGenerator {

    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AtomicLong sequence = new AtomicLong(0);
    private final String prefix;
    private volatile String currentTimePrefix;
    private final Object lock = new Object();

    public SequenceGenerator(String prefix) {
        this.prefix = prefix;
        this.currentTimePrefix = LocalDateTime.now().format(FORMATTER);
    }

    // 生成唯一序列号：前缀 + 时间戳 + 序列号
    public String nextId() {
        String timePrefix = LocalDateTime.now().format(FORMATTER);

        // 检查是否需要重置序列（秒变化时）
        if (!timePrefix.equals(currentTimePrefix)) {
            synchronized (lock) {
                if (!timePrefix.equals(currentTimePrefix)) {
                    currentTimePrefix = timePrefix;
                    sequence.set(0);
                }
            }
        }

        long seq = sequence.incrementAndGet();
        return String.format("%s%s%06d", prefix, currentTimePrefix, seq);
    }

    // 获取当前序列号（不递增）
    public long currentSequence() {
        return sequence.get();
    }

    public static void main(String[] args) throws InterruptedException {
        SequenceGenerator generator = new SequenceGenerator("ORD");

        // 并发生成序列号
        Thread[] threads = new Thread[10];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 10; j++) {
                    System.out.println(generator.nextId());
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

### 限流器实现

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class RateLimiter {

    private final int maxRequestsPerSecond;
    private final AtomicInteger currentCount = new AtomicInteger(0);
    private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());

    public RateLimiter(int maxRequestsPerSecond) {
        this.maxRequestsPerSecond = maxRequestsPerSecond;
    }

    // 尝试获取许可
    public boolean tryAcquire() {
        long now = System.currentTimeMillis();
        long windowStartTime = windowStart.get();

        // 检查是否需要重置窗口
        if (now - windowStartTime >= 1000) {
            // 尝试重置窗口
            if (windowStart.compareAndSet(windowStartTime, now)) {
                currentCount.set(1);
                return true;
            }
            // CAS 失败，其他线程已重置，重新尝试
            return tryAcquire();
        }

        // 在当前窗口内尝试获取
        int current = currentCount.get();
        if (current >= maxRequestsPerSecond) {
            return false;
        }

        // CAS 增加计数
        return currentCount.compareAndSet(current, current + 1) || tryAcquire();
    }

    // 阻塞等待获取许可
    public void acquire() throws InterruptedException {
        while (!tryAcquire()) {
            Thread.sleep(10); // 短暂等待后重试
        }
    }

    // 获取当前窗口的请求数
    public int getCurrentCount() {
        return currentCount.get();
    }

    public static void main(String[] args) throws InterruptedException {
        RateLimiter limiter = new RateLimiter(10); // 每秒最多 10 个请求

        // 模拟请求
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

## 面试要点

### CAS 的原理是什么？有什么问题？

**答案要点：**
- CAS（Compare-And-Swap）是一种无锁算法，包含三个操作数：内存位置 V、期望值 A、新值 B
- 只有当 V 的值等于 A 时，才将 V 更新为 B，整个操作是原子的
- 底层通过 CPU 的 `cmpxchg` 指令实现

**CAS 的问题：**
1. **ABA 问题**：值从 A 变成 B 再变回 A，CAS 检测不到变化
   - 解决方案：使用 `AtomicStampedReference` 添加版本号
2. **自旋开销**：高竞争时反复重试消耗 CPU
3. **只能保证单个变量的原子性**：多变量操作需要锁

### AtomicInteger 和 synchronized 的区别？

| 方面 | AtomicInteger | synchronized |
|------|---------------|--------------|
| 实现原理 | CAS + volatile | 对象监视器锁 |
| 阻塞性 | 非阻塞（自旋） | 阻塞 |
| 适用场景 | 简单的原子操作 | 复杂的临界区 |
| 性能 | 低竞争时更快 | 高竞争时更稳定 |
| 功能 | 仅原子更新 | 可保护任意代码块 |

### LongAdder 为什么比 AtomicLong 快？

**答案要点：**
- AtomicLong 所有线程竞争同一个变量，高并发时 CAS 失败率高
- LongAdder 采用分段思想，内部维护 `base` 和 `Cell[]` 数组
- 不同线程可以更新不同的 Cell，减少了竞争
- 最终结果 = base + sum(cells)

**适用场景：**
- LongAdder：高并发写入，不需要实时精确值（如统计计数）
- AtomicLong：需要精确值，或低并发场景

### 如何解决 ABA 问题？

```java
// 使用 AtomicStampedReference
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(100, 0);

int[] stampHolder = new int[1];
Integer value = ref.get(stampHolder);
int stamp = stampHolder[0];

// 更新时检查版本号
boolean success = ref.compareAndSet(value, 200, stamp, stamp + 1);
```

### volatile 和原子类的区别？

| 特性 | volatile | 原子类 |
|------|----------|--------|
| 可见性 | 保证 | 保证 |
| 原子性 | 不保证（如 i++） | 保证 |
| 有序性 | 禁止重排序 | 保证 |
| 适用操作 | 单个变量的读/写 | 读-改-写操作 |

```java
// volatile 不能保证 i++ 的原子性
private volatile int count;
count++; // 非原子操作

// AtomicInteger 保证原子性
private AtomicInteger count = new AtomicInteger();
count.incrementAndGet(); // 原子操作
```

### FieldUpdater 的作用和限制？

**作用：**
- 对已有类的 volatile 字段进行原子更新
- 避免为每个字段创建 AtomicXxx 对象，节省内存

**限制：**
- 字段必须是 volatile 修饰
- 字段不能是 static（除非使用特殊方法）
- 字段不能是 final
- 访问权限要求：调用者必须有字段的访问权限

### compareAndSet 和 weakCompareAndSet 的区别？

- `compareAndSet`：严格的 CAS，保证原子性和内存可见性
- `weakCompareAndSet`：可能虚假失败（即使期望值匹配也可能失败）
  - 在某些平台上性能更好
  - 适用于循环重试的场景
  - Java 9 后两者行为基本相同

## 延伸阅读

### 官方文档
- [java.util.concurrent.atomic Package](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/atomic/package-summary.html)
- [Java Language Specification - volatile](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.3.1.4)

### 经典书籍
- 《Java 并发编程实战》（Java Concurrency in Practice）- Brian Goetz
- 《Java 并发编程的艺术》- 方腾飞
- 《深入理解 Java 虚拟机》- 周志明

### 优质文章
- [JEP 193: Variable Handles](https://openjdk.org/jeps/193)
- [Doug Lea's JSR-166 Concurrency Utilities](http://gee.cs.oswego.edu/dl/concurrency-interest/)
- [The JSR-133 Cookbook for Compiler Writers](http://gee.cs.oswego.edu/dl/jmm/cookbook.html)

### 源码学习
- OpenJDK 源码中的 `java.util.concurrent.atomic` 包
- `Unsafe` 类的实现（理解底层原理）
- `Striped64`（LongAdder 的父类）源码分析
