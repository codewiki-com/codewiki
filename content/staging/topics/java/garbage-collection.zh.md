---
title: Java 垃圾回收机制深入解析
description: 全面剖析Java垃圾回收算法、分代收集、G1/ZGC/Shenandoah收集器原理与GC调优实战
track: java
section: jvm-gc
difficulty: advanced
tags:
  - Java
  - JVM
  - 垃圾回收
  - GC
  - 性能调优
status: imported
origin: old/src/content/docs/java/garbage-collection.zh.md
divergence: 0.158
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: JVM
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

垃圾回收（Garbage Collection，简称 GC）是 Java 虚拟机（JVM）自动内存管理的核心机制。它负责自动识别和回收不再使用的对象所占用的内存空间，使程序员从繁琐的手动内存管理中解放出来。

### 为什么需要垃圾回收

在 C/C++ 等语言中，程序员需要手动分配和释放内存，这容易导致两类严重问题：

1. **内存泄漏（Memory Leak）**：忘记释放不再使用的内存，导致可用内存逐渐减少
2. **悬空指针（Dangling Pointer）**：释放内存后继续使用该指针，导致程序崩溃或数据损坏

Java 通过自动垃圾回收机制解决了这些问题，但这也带来了新的挑战：

- **Stop-The-World（STW）**：GC 执行时需要暂停应用程序线程
- **内存碎片**：某些 GC 算法会产生内存碎片
- **GC 调优复杂性**：需要根据应用特点选择和配置合适的 GC 策略

### 垃圾回收的基本任务

```
垃圾回收器的三大职责:

+------------------+     +------------------+     +------------------+
|   哪些对象是垃圾?   | --> |  何时回收垃圾?     | --> |  如何回收垃圾?     |
|  (可达性分析)      |     | (GC 触发条件)     |     | (GC 算法选择)     |
+------------------+     +------------------+     +------------------+
```

### 发展历程

| 时期 | GC 收集器 | 特点 |
|------|-----------|------|
| JDK 1.3 | Serial | 单线程，简单高效 |
| JDK 1.4 | Parallel | 多线程并行，高吞吐量 |
| JDK 5 | CMS | 并发标记清除，低延迟 |
| JDK 7 | G1 | 区域化分代，可预测停顿 |
| JDK 11 | ZGC | 超低延迟，TB 级堆 |
| JDK 12 | Shenandoah | 并发压缩，低延迟 |
| JDK 21 | Generational ZGC | 分代 ZGC，性能更优 |

---

## 核心原理

### 对象存活判断

#### 引用计数法（Reference Counting）

引用计数法为每个对象维护一个引用计数器，当有引用指向对象时计数加一，引用失效时计数减一。计数为零的对象可被回收。

```java
// 引用计数法的致命缺陷：循环引用
public class CircularReferenceDemo {

    public Object reference = null;
    private byte[] data = new byte[1024 * 1024]; // 1MB

    public static void main(String[] args) {
        CircularReferenceDemo objA = new CircularReferenceDemo();
        CircularReferenceDemo objB = new CircularReferenceDemo();

        // 创建循环引用
        objA.reference = objB;  // objB 引用计数 = 2
        objB.reference = objA;  // objA 引用计数 = 2

        // 断开外部引用
        objA = null;  // objA 指向的对象引用计数 = 1
        objB = null;  // objB 指向的对象引用计数 = 1

        // 引用计数法：两个对象互相引用，计数永远不为0，无法回收
        // JVM 使用可达性分析，可以正确回收这两个对象
        System.gc();
    }
}
```

**引用计数法的优缺点**：

| 优点 | 缺点 |
|------|------|
| 实现简单 | 无法处理循环引用 |
| 回收及时 | 计数器维护开销 |
| 最大暂停时间可控 | 内存占用额外空间 |

#### 可达性分析算法（Reachability Analysis）

JVM 采用可达性分析算法判断对象是否存活。从 GC Roots 出发，沿着引用链遍历，能够到达的对象为存活对象，不可达的对象为垃圾对象。

```
                    GC Roots
                   /   |   \
                  /    |    \
                 v     v     v
              对象1  对象2  对象3
               |      |      |
               v      v      v
             对象4  对象5  对象6   <-- 可达对象，保留
               |
               v
             对象7

            对象8 --> 对象9  <-- 不可达对象，回收
                       |
                       v
                     对象10
```

**可作为 GC Roots 的对象**：

```java
public class GCRootsDemo {

    // 1. 虚拟机栈（栈帧中的本地变量表）中引用的对象
    public void stackReference() {
        Object localObj = new Object();  // localObj 是 GC Root
        // 方法执行期间，localObj 引用的对象不会被回收
    }

    // 2. 方法区中类静态属性引用的对象
    private static Object staticObj = new Object();  // staticObj 是 GC Root

    // 3. 方法区中常量引用的对象
    private static final Object CONSTANT = new Object();  // CONSTANT 是 GC Root

    // 4. 本地方法栈中 JNI 引用的对象
    public native void nativeMethod();  // JNI 引用的对象是 GC Root

    // 5. 被同步锁 synchronized 持有的对象
    public void synchronizedMethod() {
        Object lockObj = new Object();
        synchronized (lockObj) {  // lockObj 在同步块执行期间是 GC Root
            // 临界区代码
        }
    }

    // 6. JVM 内部引用（基本类型对应的 Class 对象、系统类加载器等）
    // 7. 反映 JVM 内部状态的 JMXBean、JVMTI 注册的回调等
}
```

#### Java 引用类型

Java 从 JDK 1.2 开始提供了四种引用类型，用于精细控制对象的生命周期：

```java
import java.lang.ref.*;
import java.util.HashMap;
import java.util.Map;

public class ReferenceTypesDemo {

    public static void main(String[] args) {
        // 1. 强引用（Strong Reference）
        // 最常见的引用类型，只要强引用存在，对象不会被回收
        Object strongRef = new Object();
        strongRef = null;  // 断开强引用后，对象可被回收

        // 2. 软引用（Soft Reference）
        // 内存不足时才会回收，适合实现内存敏感的缓存
        SoftReference<byte[]> softRef = new SoftReference<>(new byte[10 * 1024 * 1024]);
        System.out.println("软引用对象: " + (softRef.get() != null ? "存在" : "已回收"));

        // 3. 弱引用（Weak Reference）
        // 下次 GC 时无论内存是否充足都会被回收
        WeakReference<Object> weakRef = new WeakReference<>(new Object());
        System.gc();
        System.out.println("弱引用对象: " + (weakRef.get() != null ? "存在" : "已回收"));

        // 4. 虚引用（Phantom Reference）
        // 无法通过虚引用获取对象，主要用于跟踪对象被回收的时机
        ReferenceQueue<Object> queue = new ReferenceQueue<>();
        PhantomReference<Object> phantomRef = new PhantomReference<>(new Object(), queue);
        System.out.println("虚引用 get(): " + phantomRef.get());  // 始终为 null
    }
}
```

**引用类型对比**：

| 引用类型 | 回收时机 | 用途 | get() 返回值 |
|----------|----------|------|--------------|
| 强引用 | 永不回收（除非不可达） | 普通对象引用 | 对象本身 |
| 软引用 | 内存不足时 | 内存敏感缓存 | 对象或 null |
| 弱引用 | 下次 GC 时 | WeakHashMap | 对象或 null |
| 虚引用 | 任何时候 | 跟踪回收时机 | 始终 null |

**软引用缓存实现**：

```java
import java.lang.ref.SoftReference;
import java.util.concurrent.ConcurrentHashMap;

public class SoftReferenceCache<K, V> {

    private final ConcurrentHashMap<K, SoftReference<V>> cache = new ConcurrentHashMap<>();

    public void put(K key, V value) {
        cache.put(key, new SoftReference<>(value));
    }

    public V get(K key) {
        SoftReference<V> ref = cache.get(key);
        if (ref != null) {
            V value = ref.get();
            if (value == null) {
                // 对象已被 GC 回收，清理缓存条目
                cache.remove(key);
            }
            return value;
        }
        return null;
    }

    public V computeIfAbsent(K key, java.util.function.Function<K, V> loader) {
        V value = get(key);
        if (value == null) {
            value = loader.apply(key);
            if (value != null) {
                put(key, value);
            }
        }
        return value;
    }

    public void clear() {
        cache.clear();
    }

    public int size() {
        // 清理已回收的条目并返回实际大小
        cache.entrySet().removeIf(entry -> entry.getValue().get() == null);
        return cache.size();
    }
}
```

### 对象生存与死亡

对象被判定为不可达后，并不会立即被回收，而是要经历两次标记过程：

```java
public class FinalizationDemo {

    private static FinalizationDemo instance = null;

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        System.out.println("finalize() 方法被调用");
        // 在 finalize 中重新建立引用，实现自救
        instance = this;
    }

    public static void main(String[] args) throws InterruptedException {
        instance = new FinalizationDemo();

        // 第一次 GC
        instance = null;
        System.gc();
        Thread.sleep(500);  // finalize 方法优先级很低，等待执行

        if (instance != null) {
            System.out.println("第一次 GC: 对象自救成功");
        } else {
            System.out.println("第一次 GC: 对象已死亡");
        }

        // 第二次 GC（finalize 只会被调用一次）
        instance = null;
        System.gc();
        Thread.sleep(500);

        if (instance != null) {
            System.out.println("第二次 GC: 对象自救成功");
        } else {
            System.out.println("第二次 GC: 对象已死亡");
        }
    }
}
```

**注意**：`finalize()` 方法已在 Java 9 中被标记为废弃，不推荐使用。推荐使用 `try-with-resources` 或 `Cleaner` API。

---

## 核心要点

### 垃圾回收算法

#### 标记-清除算法（Mark-Sweep）

最基础的 GC 算法，分为标记和清除两个阶段：

```
标记阶段（从 GC Roots 遍历，标记存活对象）:
+-----+-----+-----+-----+-----+-----+-----+-----+
|  A  |  B  |  C  |  D  |  E  |  F  |  G  |  H  |
|  *  |     |  *  |     |  *  |     |     |  *  |   * = 存活对象
+-----+-----+-----+-----+-----+-----+-----+-----+

清除阶段（回收未标记的对象）:
+-----+-----+-----+-----+-----+-----+-----+-----+
|  A  |     |  C  |     |  E  |     |     |  H  |
+-----+-----+-----+-----+-----+-----+-----+-----+
        ^         ^           ^     ^
        |         |           |     |
        +---------+-----------+-----+
                内存碎片
```

**优点**：
- 实现简单
- 不需要移动对象

**缺点**：
- 标记和清除效率都不高
- 产生大量内存碎片，可能导致后续大对象分配失败

#### 复制算法（Copying）

将内存分为两块，每次只使用其中一块，GC 时将存活对象复制到另一块，然后清空当前块：

```
复制前（From 空间使用中）:
From 空间:                    To 空间:
+-----+-----+-----+-----+    +-----+-----+-----+-----+
|  A  |  B  |  C  |  D  |    |     |     |     |     |
|  *  |     |  *  |     |    |     |     |     |     |
+-----+-----+-----+-----+    +-----+-----+-----+-----+

复制后（存活对象复制到 To 空间）:
From 空间:                    To 空间:
+-----+-----+-----+-----+    +-----+-----+-----+-----+
|     |     |     |     |    |  A  |  C  |     |     |
|     |     |     |     |    |     |     |     |     |  <-- 对象紧凑排列
+-----+-----+-----+-----+    +-----+-----+-----+-----+
```

**优点**：
- 没有内存碎片
- 分配效率高（指针碰撞）
- 适合存活率低的场景

**缺点**：
- 内存利用率只有 50%
- 存活对象多时复制开销大

#### 标记-整理算法（Mark-Compact）

结合标记-清除和复制算法的优点，标记后不直接清除，而是将存活对象向一端移动：

```
标记阶段:
+-----+-----+-----+-----+-----+-----+-----+-----+
|  A  |  B  |  C  |  D  |  E  |  F  |  G  |  H  |
|  *  |     |  *  |     |  *  |     |     |  *  |
+-----+-----+-----+-----+-----+-----+-----+-----+

整理阶段（存活对象向前移动）:
+-----+-----+-----+-----+-----+-----+-----+-----+
|  A  |  C  |  E  |  H  |     |     |     |     |
+-----+-----+-----+-----+-----+-----+-----+-----+
                         ^
                         |
                    空闲区域起始位置
```

**优点**：
- 没有内存碎片
- 内存利用率高

**缺点**：
- 需要移动对象，效率较低
- 移动过程中需要更新引用

#### 分代收集算法（Generational Collection）

基于"弱分代假说"：大多数对象是朝生夕死的。将堆内存划分为不同区域，针对不同区域使用不同的回收策略：

```
+------------------------------------------------------------------+
|                             堆 (Heap)                              |
+----------------------------------+-------------------------------+
|         年轻代 (Young Gen)         |        老年代 (Old Gen)         |
|             约 1/3 堆               |            约 2/3 堆           |
+--------+--------+----------------+                               |
|  Eden  |   S0   |       S1       |                               |
|  80%   |  10%   |      10%       |                               |
+--------+--------+----------------+-------------------------------+
         |
         |  对象分配在 Eden 区
         v
    Minor GC 后存活对象进入 Survivor 区
         |
         |  经过多次 Minor GC 后晋升
         v
    存活对象进入老年代
```

**各区域特点**：

| 区域 | 对象特点 | GC 类型 | 使用算法 |
|------|----------|---------|----------|
| Eden | 新创建的对象 | Minor GC | 复制算法 |
| Survivor | 经过一次 GC 的对象 | Minor GC | 复制算法 |
| Old | 长期存活的对象 | Major GC / Full GC | 标记-整理 |

### 分代收集详解

#### 对象分配流程

```java
public class ObjectAllocationDemo {

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 1. 优先在 Eden 区分配
        byte[] allocation1 = new byte[2 * _1MB];
        byte[] allocation2 = new byte[2 * _1MB];
        byte[] allocation3 = new byte[2 * _1MB];

        // 2. Eden 区空间不足，触发 Minor GC
        // 存活对象移入 Survivor 区或直接晋升老年代
        byte[] allocation4 = new byte[4 * _1MB];

        // 运行参数示例:
        // -Xms20M -Xmx20M -Xmn10M -XX:SurvivorRatio=8
        // -XX:+PrintGCDetails -XX:+UseSerialGC
    }
}
```

#### 对象晋升机制

```java
public class ObjectPromotionDemo {

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {

        // 1. 年龄阈值晋升
        // 对象在 Survivor 区每熬过一次 Minor GC，年龄加 1
        // 当年龄达到阈值（默认 15）时，晋升到老年代
        // 参数: -XX:MaxTenuringThreshold=15

        // 2. 动态年龄判断
        // 如果 Survivor 区中相同年龄的对象大小总和超过 Survivor 空间的一半
        // 年龄 >= 该年龄的对象直接晋升老年代

        // 3. 大对象直接进入老年代
        // 参数: -XX:PretenureSizeThreshold=3145728 (3MB)
        byte[] bigObject = new byte[4 * _1MB];  // 可能直接分配在老年代

        // 4. 空间分配担保
        // Minor GC 前检查老年代最大可用连续空间是否大于年轻代所有对象总空间
        // 如果不成立，检查是否允许担保失败
        // 参数: -XX:+HandlePromotionFailure (JDK 6 Update 24 后该参数不再使用)
    }
}
```

#### GC 类型详解

```java
public class GCTypesDemo {

    /*
     * Minor GC (Young GC):
     * - 发生在年轻代
     * - 触发条件: Eden 区空间不足
     * - 特点: 频繁发生，速度快
     * - STW: 时间短
     *
     * Major GC (Old GC):
     * - 发生在老年代
     * - 触发条件: 老年代空间不足
     * - 特点: 速度比 Minor GC 慢 10 倍以上
     * - STW: 时间长
     *
     * Full GC:
     * - 收集整个堆和方法区
     * - 触发条件:
     *   1. 调用 System.gc()（建议，不保证执行）
     *   2. 老年代空间不足
     *   3. 方法区空间不足
     *   4. 空间分配担保失败
     * - 特点: STW 时间最长，应尽量避免
     *
     * Mixed GC (G1 特有):
     * - 收集年轻代和部分老年代
     * - G1 收集器特有的收集方式
     */

    public static void main(String[] args) {
        // 建议 JVM 执行 GC（不保证立即执行）
        System.gc();

        // 建议 JVM 执行 GC 并等待 Finalizer 线程完成
        System.runFinalization();
    }
}
```

---

## 代码示例

### GC 日志分析

```java
/**
 * GC 日志分析示例
 *
 * 运行参数 (JDK 8):
 * -Xms20M -Xmx20M -Xmn10M
 * -XX:+UseSerialGC
 * -XX:+PrintGCDetails
 * -XX:+PrintGCDateStamps
 * -XX:+PrintGCTimeStamps
 *
 * 运行参数 (JDK 11+):
 * -Xms20M -Xmx20M -Xmn10M
 * -XX:+UseSerialGC
 * -Xlog:gc*:file=gc.log:time,uptime,level,tags
 */
public class GCLogDemo {

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        byte[] allocation1 = new byte[2 * _1MB];
        byte[] allocation2 = new byte[2 * _1MB];
        byte[] allocation3 = new byte[2 * _1MB];
        byte[] allocation4 = new byte[4 * _1MB];  // 触发 Minor GC
    }
}

/*
GC 日志示例解读 (Serial GC):

[GC (Allocation Failure) [DefNew: 7128K->512K(9216K), 0.0045632 secs]
    7128K->6656K(19456K), 0.0046281 secs] [Times: user=0.00 sys=0.00, real=0.01 secs]

解读:
- GC: 表示 Minor GC
- Allocation Failure: GC 原因，Eden 区分配失败
- DefNew: 年轻代使用的收集器 (Default New Generation)
- 7128K->512K(9216K): 年轻代 GC 前使用量 -> GC 后使用量 (年轻代总容量)
- 7128K->6656K(19456K): 堆 GC 前使用量 -> GC 后使用量 (堆总容量)
- 0.0046281 secs: GC 耗时
- Times: user=用户态耗时 sys=内核态耗时 real=实际耗时
*/
```

### 不同 GC 收集器的配置

```java
/**
 * GC 收集器配置示例
 */
public class GCCollectorConfigDemo {

    public static void main(String[] args) {
        // 配置会通过 JVM 参数传入
        System.out.println("当前使用的 GC 收集器:");

        java.lang.management.ManagementFactory.getGarbageCollectorMXBeans()
            .forEach(gc -> System.out.println("  - " + gc.getName()));
    }
}

/*
各收集器配置参数:

1. Serial 收集器 (单线程)
-XX:+UseSerialGC
适用: 客户端模式，小型应用

2. Parallel 收集器 (吞吐量优先，JDK 8 默认)
-XX:+UseParallelGC
-XX:ParallelGCThreads=4          # 并行 GC 线程数
-XX:MaxGCPauseMillis=100         # 最大暂停时间目标
-XX:GCTimeRatio=99               # 吞吐量目标 (1/(1+99)=1%)
适用: 后台批处理任务，科学计算

3. CMS 收集器 (低延迟，已废弃)
-XX:+UseConcMarkSweepGC
-XX:CMSInitiatingOccupancyFraction=70  # 触发 CMS 的老年代占用阈值
-XX:+UseCMSCompactAtFullCollection     # Full GC 时进行碎片整理
适用: Web 应用 (不再推荐使用)

4. G1 收集器 (平衡吞吐量和延迟，JDK 9+ 默认)
-XX:+UseG1GC
-XX:G1HeapRegionSize=4m          # Region 大小 (1-32MB)
-XX:MaxGCPauseMillis=200         # 目标暂停时间
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发标记的堆占用阈值
-XX:G1NewSizePercent=5           # 年轻代最小占比
-XX:G1MaxNewSizePercent=60       # 年轻代最大占比
适用: 大堆内存 (6GB+) 应用

5. ZGC 收集器 (超低延迟)
-XX:+UseZGC
-XX:+ZGenerational               # JDK 21+ 分代 ZGC
-XX:ZCollectionInterval=5        # GC 触发间隔 (秒)
适用: 超大堆 (TB 级)，延迟敏感应用

6. Shenandoah 收集器 (低延迟)
-XX:+UseShenandoahGC
-XX:ShenandoahGCHeuristics=adaptive  # GC 触发策略
适用: 低延迟要求应用 (OpenJDK)
*/
```

### 内存分配与回收监控

```java
import java.lang.management.*;
import java.util.List;

/**
 * 监控内存分配与 GC 活动
 */
public class MemoryMonitorDemo {

    public static void main(String[] args) {
        // 获取内存 MXBean
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();

        // 堆内存使用情况
        MemoryUsage heapUsage = memoryMXBean.getHeapMemoryUsage();
        System.out.println("=== 堆内存 ===");
        System.out.printf("初始: %d MB%n", heapUsage.getInit() / 1024 / 1024);
        System.out.printf("已用: %d MB%n", heapUsage.getUsed() / 1024 / 1024);
        System.out.printf("提交: %d MB%n", heapUsage.getCommitted() / 1024 / 1024);
        System.out.printf("最大: %d MB%n", heapUsage.getMax() / 1024 / 1024);

        // 非堆内存使用情况
        MemoryUsage nonHeapUsage = memoryMXBean.getNonHeapMemoryUsage();
        System.out.println("\n=== 非堆内存 (Metaspace) ===");
        System.out.printf("已用: %d MB%n", nonHeapUsage.getUsed() / 1024 / 1024);

        // 各内存池详情
        System.out.println("\n=== 内存池详情 ===");
        List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
        for (MemoryPoolMXBean pool : pools) {
            MemoryUsage usage = pool.getUsage();
            System.out.printf("%s: %d MB / %d MB%n",
                pool.getName(),
                usage.getUsed() / 1024 / 1024,
                usage.getMax() == -1 ? 0 : usage.getMax() / 1024 / 1024);
        }

        // GC 统计
        System.out.println("\n=== GC 统计 ===");
        List<GarbageCollectorMXBean> gcs = ManagementFactory.getGarbageCollectorMXBeans();
        for (GarbageCollectorMXBean gc : gcs) {
            System.out.printf("%s: 次数=%d, 累计耗时=%d ms%n",
                gc.getName(),
                gc.getCollectionCount(),
                gc.getCollectionTime());
        }
    }
}
```

---

## 最佳实践

### G1 收集器详解与调优

G1（Garbage-First）收集器是 JDK 9 之后的默认 GC 收集器，采用区域化分代设计。

#### G1 内存布局

```
G1 堆内存布局（Region 化）:
+----+----+----+----+----+----+----+----+
| E  | S  | O  | E  |    | O  | H  | H  |
+----+----+----+----+----+----+----+----+
| O  | E  |    | S  | O  | E  | H  |    |
+----+----+----+----+----+----+----+----+
|    | O  | E  | O  | E  |    | O  | S  |
+----+----+----+----+----+----+----+----+

E = Eden Region      S = Survivor Region
O = Old Region       H = Humongous Region (大对象)
空白 = 空闲 Region

特点:
- 堆被划分为大小相等的 Region（1MB-32MB）
- 每个 Region 可以动态充当 Eden/Survivor/Old
- 大对象（超过 Region 50%）存放在 Humongous Region
- 基于 Region 进行收集，可预测停顿时间
```

#### G1 收集过程

```java
/**
 * G1 GC 收集过程详解
 */
public class G1GCProcessDemo {

    /*
     * G1 收集过程:
     *
     * 1. 年轻代收集 (Young GC / Minor GC)
     *    - STW，并行收集所有 Eden 和 Survivor Region
     *    - 存活对象复制到 Survivor 或晋升到 Old Region
     *    - 特点: 全部 STW，但只收集年轻代
     *
     * 2. 并发标记周期 (Concurrent Marking Cycle)
     *    a) 初始标记 (Initial Mark) - STW
     *       - 标记 GC Roots 直接可达的对象
     *       - 通常与 Young GC 一起执行
     *
     *    b) 根区域扫描 (Root Region Scanning)
     *       - 扫描 Survivor 区到老年代的引用
     *       - 与应用线程并发执行
     *
     *    c) 并发标记 (Concurrent Marking)
     *       - 遍历整个堆，标记存活对象
     *       - 与应用线程并发执行
     *       - 使用 SATB（原始快照）算法处理并发修改
     *
     *    d) 重新标记 (Remark) - STW
     *       - 处理并发标记期间的引用变化
     *       - 使用 SATB 写屏障记录的信息
     *
     *    e) 清理 (Cleanup) - 部分 STW
     *       - 计算每个 Region 的存活对象
     *       - 按回收价值排序，为 Mixed GC 做准备
     *       - 回收完全空闲的 Region
     *
     * 3. 混合收集 (Mixed GC)
     *    - STW，收集年轻代 + 部分老年代 Region
     *    - 优先收集垃圾比例高的 Region（Garbage First 名称由来）
     *    - 可能执行多次直到老年代占用率降低到阈值
     *
     * 4. Full GC (失败保护)
     *    - 当并发收集跟不上分配速度时触发
     *    - 单线程串行收集，非常耗时
     *    - 应通过调优尽量避免
     */

    public static void main(String[] args) {
        // 运行参数:
        // -XX:+UseG1GC
        // -XX:MaxGCPauseMillis=200
        // -XX:G1HeapRegionSize=4m
        // -Xlog:gc*:file=g1gc.log:time,uptime,level,tags

        System.out.println("G1 GC 演示");
    }
}
```

#### G1 调优实践

```bash
#!/bin/bash
# G1 GC 调优配置示例

# 基础配置
JAVA_OPTS="
-Xms8g                              # 初始堆大小
-Xmx8g                              # 最大堆大小 (建议与 Xms 相同)
-XX:+UseG1GC                        # 使用 G1 收集器

# G1 核心参数
-XX:MaxGCPauseMillis=200            # 目标暂停时间 (毫秒)
-XX:G1HeapRegionSize=4m             # Region 大小 (根据堆大小选择)
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发标记的堆占用阈值

# 年轻代配置
-XX:G1NewSizePercent=20             # 年轻代最小占比
-XX:G1MaxNewSizePercent=40          # 年轻代最大占比

# 混合收集配置
-XX:G1MixedGCLiveThresholdPercent=85   # 老年代 Region 存活率阈值
-XX:G1MixedGCCountTarget=8             # 混合收集次数目标
-XX:G1OldCSetRegionThresholdPercent=10 # 每次混合 GC 最多收集老年代比例

# GC 日志 (JDK 11+)
-Xlog:gc*,gc+age=trace,safepoint:file=gc.log:time,uptime,level,tags:filecount=10,filesize=100m

# OOM 时 dump 堆
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heapdump.hprof
"

java $JAVA_OPTS -jar app.jar
```

### ZGC 收集器详解

ZGC（Z Garbage Collector）是 JDK 11 引入的低延迟垃圾收集器，JDK 15 正式可用于生产环境。

#### ZGC 核心特性

```java
/**
 * ZGC 特性演示
 */
public class ZGCFeatureDemo {

    /*
     * ZGC 核心特性:
     *
     * 1. 超低延迟
     *    - GC 暂停时间 < 1ms (典型 < 0.5ms)
     *    - 暂停时间不随堆大小或存活对象数量增加
     *
     * 2. 支持超大堆
     *    - 最大支持 16TB 堆内存
     *    - 最小支持 8MB 堆内存
     *
     * 3. 并发执行
     *    - 几乎所有 GC 工作与应用线程并发执行
     *    - 只有 3 个极短暂的 STW 阶段
     *
     * 4. 着色指针 (Colored Pointers)
     *    - 在指针中存储元数据信息
     *    - 64 位系统上，高位用于存储标记信息
     *
     *    指针结构 (64位):
     *    +--------+------------+------------------------------------------+
     *    | Unused | Metadata   |              Object Address              |
     *    | 16-bit | 4-bit      |              44-bit                      |
     *    +--------+------------+------------------------------------------+
     *             |
     *             +-- Finalizable, Remapped, Marked1, Marked0
     *
     * 5. 读屏障 (Load Barrier)
     *    - 在读取对象引用时插入读屏障
     *    - 检查指针颜色，必要时进行重定位
     *    - 相比写屏障，读屏障更适合并发压缩
     *
     * 6. 区域化内存管理
     *    - 小页面: 2MB (用于小于 256KB 的对象)
     *    - 中页面: 32MB (用于 256KB-4MB 的对象)
     *    - 大页面: N*2MB (用于大于 4MB 的对象)
     */

    public static void main(String[] args) {
        // 运行参数:
        // -XX:+UseZGC
        // -XX:+ZGenerational (JDK 21+，分代 ZGC)
        // -Xms16g -Xmx16g
        // -Xlog:gc*:file=zgc.log:time

        System.out.println("ZGC 演示");
    }
}
```

#### ZGC 收集过程

```
ZGC 并发收集过程:

应用线程: ──────────────────────────────────────────────────────────────
                                     并发运行

GC 线程:  ─┬─┬────────────────────────┬─┬───────────────────┬─┬────────
           │ │                        │ │                   │ │
           │ │  并发标记              │ │  并发准备重定位    │ │ 并发重定位
           │ │  (Concurrent Mark)     │ │  (Concurrent      │ │ (Concurrent
           │ │                        │ │   Prepare         │ │  Relocate)
          STW STW                    STW STW               STW STW
          初始 结束                  初始 完成              开始 完成
          标记 标记                  重定位                 重定位

三个 STW 阶段 (每个 < 1ms):
1. 初始标记 (Mark Start): 标记 GC Roots
2. 再标记 (Mark End): 处理引用和弱引用
3. 初始重定位 (Relocate Start): 扫描重定位集
```

#### ZGC 配置

```bash
#!/bin/bash
# ZGC 配置示例

JAVA_OPTS="
# 基础配置
-Xms32g                             # 初始堆大小
-Xmx32g                             # 最大堆大小
-XX:+UseZGC                         # 使用 ZGC

# JDK 21+ 分代 ZGC (推荐)
-XX:+ZGenerational                  # 启用分代 ZGC

# 调优参数
-XX:SoftMaxHeapSize=28g             # 软性堆大小上限
-XX:ZCollectionInterval=5           # GC 触发间隔 (秒，0=禁用)
-XX:ZAllocationSpikeTolerance=2     # 分配峰值容忍度

# 并发 GC 线程数 (默认为 CPU 核数的 1/8)
-XX:ConcGCThreads=4

# GC 日志
-Xlog:gc*:file=zgc.log:time,uptime,level,tags

# 大页面支持 (可选，需要系统配置)
# -XX:+UseLargePages
# -XX:+UseTransparentHugePages
"

java $JAVA_OPTS -jar app.jar
```

### Shenandoah 收集器

Shenandoah 是 Red Hat 主导开发的低延迟收集器，与 ZGC 类似但实现方式不同。

```java
/**
 * Shenandoah 特性对比
 */
public class ShenandoahFeatureDemo {

    /*
     * Shenandoah vs ZGC 对比:
     *
     * 相同点:
     * - 都追求超低延迟 (< 10ms)
     * - 都支持并发压缩
     * - 暂停时间都不随堆大小增长
     *
     * 不同点:
     * | 特性 | Shenandoah | ZGC |
     * |------|------------|-----|
     * | 实现方式 | 转发指针 (Forwarding Pointer) | 着色指针 (Colored Pointer) |
     * | 屏障类型 | 读写屏障 | 读屏障 |
     * | 最大堆 | 无限制 | 16TB |
     * | JDK 支持 | OpenJDK (Oracle JDK 不支持) | OpenJDK + Oracle JDK |
     * | 分代支持 | 无 (计划中) | JDK 21+ 支持 |
     * | 性能开销 | 写屏障开销较大 | 读屏障开销 |
     *
     * 选择建议:
     * - Oracle JDK: 选择 ZGC
     * - OpenJDK + 写密集型: 考虑 ZGC
     * - OpenJDK + 读密集型: 两者皆可
     */

    public static void main(String[] args) {
        // 运行参数:
        // -XX:+UseShenandoahGC
        // -XX:ShenandoahGCHeuristics=adaptive
        // -Xms16g -Xmx16g
        // -Xlog:gc*:file=shenandoah.log:time

        System.out.println("Shenandoah 演示");
    }
}
```

```bash
#!/bin/bash
# Shenandoah 配置示例 (OpenJDK)

JAVA_OPTS="
-Xms16g
-Xmx16g
-XX:+UseShenandoahGC

# GC 启发式策略
-XX:ShenandoahGCHeuristics=adaptive  # adaptive/static/compact/aggressive

# 调优参数
-XX:ShenandoahInitFreeThreshold=70   # 触发 GC 的空闲阈值
-XX:ShenandoahMinFreeThreshold=10    # 最小空闲阈值
-XX:ShenandoahAllocationThreshold=0  # 分配触发阈值

# GC 日志
-Xlog:gc*:file=shenandoah.log:time
"

java $JAVA_OPTS -jar app.jar
```

---

## 常见陷阱

### Full GC 频繁

```java
/**
 * 诊断 Full GC 频繁问题
 */
public class FullGCDiagnosis {

    /*
     * Full GC 频繁的常见原因:
     *
     * 1. 老年代空间不足
     *    - 存活对象过多
     *    - 内存泄漏
     *    - 大对象直接进入老年代
     *
     * 2. 元空间不足
     *    - 动态生成类过多
     *    - 类加载器泄漏
     *
     * 3. 显式调用 System.gc()
     *    - 框架或第三方库调用
     *    - 可使用 -XX:+DisableExplicitGC 禁用
     *
     * 4. 空间分配担保失败
     *    - 老年代碎片化严重
     *    - 需要整理或扩大老年代
     */

    // 排查步骤示例
    public static void diagnose() {
        // 1. 查看 GC 日志，确认 Full GC 原因
        // [Full GC (Ergonomics) ...  表示自动触发
        // [Full GC (System.gc()) ... 表示显式调用
        // [Full GC (Metadata GC Threshold) ... 表示元空间不足

        // 2. 使用 jstat 监控
        // jstat -gc <pid> 1000  # 每秒输出 GC 统计
        // 关注 FGC (Full GC 次数) 和 FGCT (Full GC 耗时) 列

        // 3. 分析堆转储
        // jmap -dump:format=b,file=heap.hprof <pid>
        // 使用 MAT 分析内存占用和泄漏

        // 4. 检查内存配置
        // -Xmx 是否设置过小
        // -XX:MetaspaceSize 是否设置过小
    }
}
```

### 内存泄漏

```java
import java.util.*;

/**
 * 常见内存泄漏模式
 */
public class MemoryLeakPatterns {

    // 1. 静态集合累积
    private static List<Object> staticCache = new ArrayList<>();

    public void addToStaticCache(Object obj) {
        staticCache.add(obj);  // 对象永远不会被回收
    }

    // 解决方案：使用弱引用或限制缓存大小
    private static Map<String, java.lang.ref.WeakReference<Object>> weakCache =
        new WeakHashMap<>();


    // 2. 监听器未取消注册
    public interface EventListener {
        void onEvent(String event);
    }

    private List<EventListener> listeners = new ArrayList<>();

    public void registerListener(EventListener listener) {
        listeners.add(listener);
    }

    // 问题：如果不调用 unregister，listener 持有的对象无法回收
    public void unregisterListener(EventListener listener) {
        listeners.remove(listener);
    }


    // 3. 资源未关闭
    public void readFileWrong(String path) throws Exception {
        java.io.FileInputStream fis = new java.io.FileInputStream(path);
        // 如果发生异常，流不会被关闭，导致资源泄漏
        byte[] data = fis.readAllBytes();
        fis.close();
    }

    // 正确做法：使用 try-with-resources
    public void readFileCorrect(String path) throws Exception {
        try (java.io.FileInputStream fis = new java.io.FileInputStream(path)) {
            byte[] data = fis.readAllBytes();
        }  // 自动关闭
    }


    // 4. 内部类持有外部类引用
    public class Outer {
        private byte[] data = new byte[10 * 1024 * 1024];  // 10MB

        public Runnable createTask() {
            // 非静态内部类持有外部类引用
            return new Runnable() {
                @Override
                public void run() {
                    System.out.println("Task running");
                    // 这个 Runnable 隐式持有 Outer.this 引用
                }
            };
        }

        // 解决方案：使用静态内部类或 Lambda
        public Runnable createTaskSafe() {
            return () -> System.out.println("Task running");
        }
    }


    // 5. ThreadLocal 泄漏
    private static ThreadLocal<byte[]> threadLocalData = new ThreadLocal<>();

    public void processWithThreadLocal() {
        threadLocalData.set(new byte[1024 * 1024]);  // 1MB
        try {
            // 处理逻辑
        } finally {
            // 必须清理，否则在线程池场景下会泄漏
            threadLocalData.remove();
        }
    }
}
```

### GC 调优误区

```java
/**
 * GC 调优常见误区
 */
public class GCTuningMistakes {

    /*
     * 误区 1: 盲目增大堆内存
     * - 问题：堆越大，Full GC 耗时越长
     * - 建议：根据实际需求设置，配合合适的 GC 收集器
     *
     * 误区 2: 禁用 System.gc()
     * - 问题：某些场景需要显式 GC（如 NIO Direct Buffer 回收）
     * - 建议：谨慎使用 -XX:+DisableExplicitGC
     *
     * 误区 3: 过度关注 GC 参数调优
     * - 问题：根本问题可能是代码问题
     * - 建议：先排查代码问题，再考虑 GC 调优
     *
     * 误区 4: 只看 GC 日志的暂停时间
     * - 问题：忽略了 GC 频率和整体吞吐量
     * - 建议：综合考虑暂停时间、频率、吞吐量
     *
     * 误区 5: 复制生产环境配置
     * - 问题：不同环境、不同应用需要不同配置
     * - 建议：根据实际压测结果调整
     */

    public static void main(String[] args) {
        System.out.println("避免 GC 调优误区");
    }
}
```

---

## 性能考量

### GC 性能指标

```java
/**
 * GC 性能关键指标
 */
public class GCPerformanceMetrics {

    /*
     * 1. 吞吐量 (Throughput)
     *    定义：应用程序运行时间 / (应用程序运行时间 + GC 时间)
     *    目标：通常 > 95%
     *    计算：假设总运行时间 100s，GC 耗时 5s，吞吐量 = 95%
     *
     * 2. 暂停时间 (Pause Time / Latency)
     *    定义：单次 GC 导致的应用暂停时间
     *    关注指标：
     *    - 平均暂停时间
     *    - 最大暂停时间
     *    - P99 暂停时间
     *
     * 3. GC 频率
     *    定义：单位时间内 GC 发生的次数
     *    关注：Minor GC 和 Full GC 的频率
     *
     * 4. 内存占用 (Footprint)
     *    定义：堆内存使用量
     *    关注：堆大小配置是否合理
     *
     * 5. 对象分配速率
     *    定义：单位时间内分配的对象数量/大小
     *    计算：通过 GC 日志中年轻代回收量估算
     *
     * 6. 对象晋升速率
     *    定义：单位时间内从年轻代晋升到老年代的对象大小
     *    计算：通过 GC 日志中老年代增长量估算
     */

    // 吞吐量 vs 延迟权衡
    public static void throughputVsLatency() {
        /*
         * +------------------+------------------+------------------+
         * |    应用类型       |     优先指标      |    推荐收集器     |
         * +------------------+------------------+------------------+
         * | 批处理/计算密集型  |     吞吐量       |    Parallel      |
         * | Web 应用         |   平衡/低延迟     |    G1            |
         * | 交易系统         |     低延迟       |    ZGC           |
         * | 实时系统         |    超低延迟      | ZGC/Shenandoah   |
         * +------------------+------------------+------------------+
         */
    }
}
```

### GC 调优方法论

```java
/**
 * GC 调优系统方法
 */
public class GCTuningMethodology {

    /*
     * 第一步：明确性能目标
     * ---------------------------------------------------------
     * | 指标           | Web 应用    | 批处理     | 实时系统   |
     * |---------------|------------|-----------|-----------|
     * | 吞吐量         | > 95%      | > 98%     | > 90%     |
     * | 平均暂停时间    | < 100ms    | < 1s      | < 10ms    |
     * | 最大暂停时间    | < 500ms    | < 5s      | < 50ms    |
     * | Full GC 频率   | < 1次/小时  | 可接受     | 禁止      |
     * ---------------------------------------------------------
     *
     * 第二步：收集基准数据
     * - 开启 GC 日志
     * - 收集一段时间的运行数据
     * - 分析当前 GC 行为
     *
     * 第三步：分析问题
     * - Minor GC 耗时过长？
     * - Full GC 频繁？
     * - 内存使用率过高？
     * - 对象晋升过快？
     *
     * 第四步：调整配置
     * - 先调整堆大小
     * - 再选择合适的收集器
     * - 最后微调收集器参数
     *
     * 第五步：验证效果
     * - 压测环境验证
     * - 对比调优前后的指标
     * - 持续监控生产环境
     */

    public static void main(String[] args) {
        System.out.println("GC 调优需要系统化方法");
    }
}
```

### 各场景最佳配置

```bash
#!/bin/bash

# ===============================================
# 场景 1: Web 应用 (追求低延迟)
# ===============================================
WEB_APP_OPTS="
-Xms4g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=100
-XX:G1HeapRegionSize=4m
-XX:InitiatingHeapOccupancyPercent=45
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:+UseStringDeduplication
"

# ===============================================
# 场景 2: 批处理任务 (追求高吞吐量)
# ===============================================
BATCH_JOB_OPTS="
-Xms8g -Xmx8g
-XX:+UseParallelGC
-XX:ParallelGCThreads=8
-XX:GCTimeRatio=99
-XX:MaxGCPauseMillis=500
"

# ===============================================
# 场景 3: 大内存低延迟应用 (如交易系统)
# ===============================================
LOW_LATENCY_OPTS="
-Xms32g -Xmx32g
-XX:+UseZGC
-XX:+ZGenerational
-XX:SoftMaxHeapSize=28g
-XX:ConcGCThreads=4
"

# ===============================================
# 场景 4: 微服务容器环境
# ===============================================
CONTAINER_OPTS="
-XX:+UseContainerSupport
-XX:MaxRAMPercentage=75.0
-XX:InitialRAMPercentage=50.0
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
"

# ===============================================
# 场景 5: 内存受限环境 (小堆)
# ===============================================
SMALL_HEAP_OPTS="
-Xms512m -Xmx512m
-XX:+UseSerialGC
-XX:NewRatio=2
"
```

---

## 实战场景

### 案例 1: 电商大促系统 GC 调优

```java
/**
 * 电商大促场景 GC 调优案例
 */
public class EcommerceGCTuning {

    /*
     * 背景：
     * - 电商系统，日常 QPS 5000，大促期间 QPS 50000
     * - 4 核 8G 服务器，JDK 11
     * - 问题：大促期间响应时间抖动大，偶发超时
     *
     * 调优前配置：
     * -Xms4g -Xmx4g
     * -XX:+UseParallelGC
     *
     * 问题分析：
     * 1. GC 日志显示 Young GC 频繁（每秒多次）
     * 2. Full GC 偶发，每次暂停 2-3 秒
     * 3. 对象晋升速率高
     *
     * 原因：
     * - Parallel GC 关注吞吐量，不适合低延迟场景
     * - 大促期间对象分配速率激增
     * - 年轻代设置过小，对象过早晋升
     *
     * 调优后配置：
     */

    public static final String TUNED_CONFIG = """
        -Xms6g -Xmx6g
        -XX:+UseG1GC
        -XX:MaxGCPauseMillis=100
        -XX:G1HeapRegionSize=4m
        -XX:InitiatingHeapOccupancyPercent=40
        -XX:G1NewSizePercent=40
        -XX:G1MaxNewSizePercent=50
        -XX:ParallelGCThreads=4
        -XX:ConcGCThreads=2
        -XX:+UseStringDeduplication
        """;

    /*
     * 调优效果：
     * - Young GC 暂停时间: 50ms -> 30ms
     * - Full GC: 基本消除
     * - P99 响应时间: 500ms -> 150ms
     * - 吞吐量: 92% -> 97%
     */
}
```

### 案例 2: 内存泄漏排查

```bash
#!/bin/bash
# 内存泄漏排查步骤

# 确认内存持续增长
jstat -gc <pid> 5000 10
# 关注 OU (老年代使用量) 是否持续增长

# 生成堆转储
jmap -dump:format=b,file=heap_$(date +%Y%m%d_%H%M%S).hprof <pid>

# 多次 dump 对比（间隔几分钟）
# 使用 MAT 的 Histogram 对比功能

# 分析占用内存最大的对象
# MAT: Dominator Tree -> 查找大对象及其引用链

# 定位泄漏代码
# MAT: Leak Suspects -> 自动分析可疑对象
# MAT: Path to GC Roots -> 查看对象为何不能被回收
```

```java
/**
 * 使用 Arthas 在线诊断
 */
public class ArthasDiagnosis {

    /*
     * Arthas 命令示例:
     *
     * # 进入 Arthas
     * java -jar arthas-boot.jar
     *
     * # 查看堆内存使用
     * memory
     *
     * # 查看 GC 情况
     * dashboard  # 实时监控面板
     *
     * # 查看对象实例数量
     * sc -d *ClassName*  # 搜索类
     * vmtool --action getInstances --className java.util.HashMap --limit 10
     *
     * # 查看对象引用链
     * vmtool --action getInstances --className com.example.MyClass -x 3
     *
     * # 强制 GC
     * vmtool --action forceGc
     *
     * # 查看 ClassLoader
     * classloader -l
     *
     * # 火焰图 (CPU 和内存)
     * profiler start
     * profiler stop --file /tmp/profiler.html
     */

    public static void main(String[] args) {
        System.out.println("使用 Arthas 进行在线诊断");
    }
}
```

### 案例 3: 容器环境 GC 配置

```java
/**
 * Kubernetes 容器环境 GC 配置
 */
public class ContainerGCConfig {

    /*
     * 容器环境特点：
     * 1. 内存限制通过 cgroup 控制
     * 2. JVM 可能无法正确感知容器内存限制
     * 3. OOM 会导致容器被杀死
     *
     * JDK 8u191+ / JDK 10+ 配置：
     */

    public static final String CONTAINER_CONFIG = """
        # 启用容器支持（JDK 10+ 默认启用）
        -XX:+UseContainerSupport

        # 基于容器内存设置堆大小
        -XX:MaxRAMPercentage=75.0    # 堆最大占容器内存 75%
        -XX:InitialRAMPercentage=50.0  # 初始堆占容器内存 50%

        # 或使用固定值（更可预测）
        # -Xms2g -Xmx2g

        # G1 收集器
        -XX:+UseG1GC
        -XX:MaxGCPauseMillis=200

        # 调整并行线程数（容器 CPU 限制）
        -XX:ParallelGCThreads=2
        -XX:ConcGCThreads=1

        # OOM 时生成堆转储
        -XX:+HeapDumpOnOutOfMemoryError
        -XX:HeapDumpPath=/tmp/heapdump.hprof

        # 容器环境下 OOM 时退出（便于 K8s 重启）
        -XX:+ExitOnOutOfMemoryError
        """;

    /*
     * Kubernetes 配置示例：
     *
     * resources:
     *   requests:
     *     memory: "4Gi"
     *     cpu: "2"
     *   limits:
     *     memory: "4Gi"
     *     cpu: "2"
     *
     * 内存规划：
     * - 容器内存: 4Gi
     * - 堆内存 (75%): 3Gi
     * - 非堆内存: ~500Mi
     * - 系统预留: ~500Mi
     */
}
```

---

## 面试要点

### 高频面试题

```java
/**
 * GC 面试题精选
 */
public class GCInterviewQuestions {

    /*
     * Q1: JVM 如何判断对象可以被回收？
     *
     * A: JVM 使用可达性分析算法。从 GC Roots 出发，沿着引用链遍历，
     *    能够到达的对象为存活对象，不可达的对象为垃圾对象。
     *    GC Roots 包括：
     *    - 虚拟机栈中引用的对象
     *    - 方法区中静态属性引用的对象
     *    - 方法区中常量引用的对象
     *    - 本地方法栈中 JNI 引用的对象
     *    - 被同步锁持有的对象
     *    - JVM 内部引用
     *
     *
     * Q2: 介绍一下 G1 收集器的工作原理？
     *
     * A: G1 采用区域化分代设计，将堆划分为大小相等的 Region。
     *    主要特点：
     *    1. 每个 Region 可动态充当 Eden/Survivor/Old
     *    2. 大对象存放在 Humongous Region
     *    3. 基于标记-整理算法，不会产生碎片
     *    4. 可设置暂停时间目标，G1 会智能选择回收价值高的 Region
     *
     *    收集过程：
     *    - Young GC: 收集所有年轻代 Region
     *    - 并发标记: 与应用并发执行，标记存活对象
     *    - Mixed GC: 收集年轻代 + 部分老年代 Region
     *
     *
     * Q3: ZGC 如何实现超低延迟？
     *
     * A: ZGC 通过以下技术实现亚毫秒级暂停：
     *    1. 着色指针: 在 64 位指针中存储 GC 元数据
     *    2. 读屏障: 在读取引用时检查并处理指针状态
     *    3. 并发处理: 几乎所有 GC 操作与应用并发执行
     *    4. 区域化内存: 使用不同大小的页面管理对象
     *
     *    ZGC 只有 3 个极短的 STW 阶段（< 1ms）：
     *    - 初始标记
     *    - 再标记
     *    - 初始重定位
     *
     *
     * Q4: 什么情况下会触发 Full GC？如何避免？
     *
     * A: Full GC 触发条件：
     *    1. 老年代空间不足
     *    2. 方法区（Metaspace）空间不足
     *    3. 调用 System.gc()
     *    4. 空间分配担保失败
     *    5. CMS GC 时 concurrent mode failure
     *
     *    避免方法：
     *    1. 合理设置堆大小和各区域比例
     *    2. 避免创建大量大对象
     *    3. 排查内存泄漏
     *    4. 选择合适的 GC 收集器
     *    5. 禁用或减少 System.gc() 调用
     *
     *
     * Q5: 如何选择合适的 GC 收集器？
     *
     * A: 根据应用场景选择：
     *    | 场景 | 推荐收集器 | 原因 |
     *    |------|-----------|------|
     *    | 小堆（< 4G）客户端 | Serial | 简单高效 |
     *    | 批处理/计算密集 | Parallel | 高吞吐量 |
     *    | Web 应用 | G1 | 平衡延迟和吞吐量 |
     *    | 大堆（> 16G）低延迟 | ZGC | 超低延迟 |
     *    | 低延迟（OpenJDK） | Shenandoah | 低延迟 |
     *
     *    JDK 版本推荐：
     *    - JDK 8: Parallel (默认) 或 G1
     *    - JDK 11+: G1 (默认) 或 ZGC
     *    - JDK 21+: G1 或分代 ZGC
     *
     *
     * Q6: 什么是 STW？为什么需要 STW？
     *
     * A: STW (Stop-The-World) 是指 GC 执行时暂停所有应用线程。
     *    需要 STW 的原因：
     *    1. 保证数据一致性：GC 过程中对象引用可能变化
     *    2. 某些操作无法并发：如标记 GC Roots
     *
     *    现代 GC 的优化：
     *    1. 并发标记：大部分标记工作与应用并发
     *    2. 增量收集：分批次小量收集
     *    3. 读/写屏障：跟踪并发修改
     *    4. SATB/INC：处理并发标记期间的变化
     *
     *
     * Q7: 如何排查 GC 导致的性能问题？
     *
     * A: 排查步骤：
     *    1. 开启 GC 日志
     *       -Xlog:gc*:file=gc.log:time,uptime,level,tags
     *
     *    2. 使用工具监控
     *       - jstat -gc <pid> 1000  # 每秒监控
     *       - jcmd <pid> GC.heap_info
     *
     *    3. 分析 GC 日志
     *       - GC 频率是否正常
     *       - 暂停时间是否过长
     *       - 老年代增长是否过快
     *
     *    4. 堆转储分析
     *       - jmap -dump:format=b,file=heap.hprof <pid>
     *       - 使用 MAT 分析内存占用
     *
     *    5. 代码审查
     *       - 检查是否有内存泄漏
     *       - 检查大对象创建
     *       - 检查对象生命周期
     */

    public static void main(String[] args) {
        System.out.println("GC 面试要点汇总");
    }
}
```

### 进阶面试题

```java
/**
 * GC 进阶面试题
 */
public class AdvancedGCQuestions {

    /*
     * Q1: 解释 G1 中的 Remembered Set 和 Card Table？
     *
     * A: 两者都是解决跨代引用问题的数据结构。
     *
     *    Card Table（卡表）：
     *    - 将堆内存划分为固定大小的卡页（通常 512 字节）
     *    - 每个卡页用一个字节记录是否有跨代引用
     *    - 写屏障在引用赋值时更新卡表
     *    - Minor GC 时扫描脏卡页找出年轻代的 GC Roots
     *
     *    Remembered Set（记忆集）：
     *    - G1 中每个 Region 都有一个 RSet
     *    - 记录其他 Region 指向本 Region 的引用
     *    - 避免全堆扫描，只需扫描 RSet 中的 Region
     *    - 空间换时间，但 RSet 本身也占用内存
     *
     *
     * Q2: 什么是三色标记法？如何解决并发标记中的漏标问题？
     *
     * A: 三色标记法将对象分为三种颜色：
     *    - 白色：未被访问的对象（可能是垃圾）
     *    - 灰色：已被访问，但其引用的对象还未全部访问
     *    - 黑色：已被访问，且其引用的对象已全部访问
     *
     *    漏标问题：并发标记时，应用线程修改引用导致存活对象未被标记。
     *
     *    漏标产生条件（同时满足）：
     *    1. 黑色对象插入对白色对象的引用
     *    2. 灰色对象删除对该白色对象的引用
     *
     *    解决方案：
     *    - 增量更新（CMS）：记录黑色对象新增的引用，重新标记时再扫描
     *    - 原始快照 SATB（G1）：记录灰色对象删除的引用，保留引用关系
     *
     *
     * Q3: G1 和 ZGC 的主要区别是什么？
     *
     * A: | 特性 | G1 | ZGC |
     *    |------|-----|-----|
     *    | 暂停时间 | 几十~几百 ms | < 1 ms |
     *    | 堆大小 | 几十 GB 内最佳 | 支持 TB 级 |
     *    | 并发阶段 | 标记并发，清理部分并发 | 几乎全并发 |
     *    | 内存布局 | Region (1-32MB) | 页面 (2M/32M/N*2M) |
     *    | 指针技术 | 普通指针 | 着色指针 |
     *    | 屏障类型 | 写屏障 | 读屏障 |
     *    | 分代 | 是 | JDK 21+ 支持 |
     *    | 压缩 | Mixed GC 时压缩 | 并发压缩 |
     *
     *
     * Q4: 什么是 TLAB？它解决什么问题？
     *
     * A: TLAB (Thread Local Allocation Buffer) 是线程私有的内存分配缓冲区。
     *
     *    解决的问题：
     *    - 多线程同时分配对象时需要同步，影响性能
     *    - 使用 CAS 分配也有竞争开销
     *
     *    工作原理：
     *    - 每个线程在 Eden 区有一小块私有区域（TLAB）
     *    - 对象优先在 TLAB 中分配，无需同步
     *    - TLAB 用完后申请新的 TLAB
     *    - 大对象直接在堆上分配（可能需要同步）
     *
     *    相关参数：
     *    -XX:+UseTLAB        # 启用 TLAB（默认启用）
     *    -XX:TLABSize=256k   # 设置 TLAB 大小
     *
     *
     * Q5: 解释一下 JVM 的安全点和安全区域？
     *
     * A: 安全点 (Safepoint)：
     *    - 程序执行时特定位置，GC 只能在安全点启动
     *    - 安全点位置：方法调用、循环跳转、异常跳转等
     *    - 到达安全点时，线程的执行状态是确定的
     *    - JVM 通过主动式中断让线程跑到最近的安全点
     *
     *    安全区域 (Safe Region)：
     *    - 一段代码区域，在其中引用关系不会变化
     *    - 解决线程 Sleep/Blocked 时无法响应安全点的问题
     *    - 进入安全区域时标记，离开时检查是否可以离开
     */

    public static void main(String[] args) {
        System.out.println("GC 进阶面试题汇总");
    }
}
```

---

## 延伸阅读

### 官方文档

- [Java 垃圾回收调优指南](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [G1 垃圾收集器](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html)
- [ZGC 官方文档](https://docs.oracle.com/en/java/javase/21/gctuning/z-garbage-collector.html)
- [JDK 21 发行说明](https://www.oracle.com/java/technologies/javase/21-relnote-issues.html)

### 推荐书籍

- 《深入理解 Java 虚拟机》- 周志明
- 《Java 性能权威指南》- Scott Oaks
- 《垃圾回收算法与实现》- 中村成洋
- 《JVM G1 源码分析与调优》- 张建锋

### 工具资源

| 工具 | 用途 | 链接 |
|------|------|------|
| GCViewer | GC 日志可视化分析 | https://github.com/chewiebug/GCViewer |
| GCEasy | 在线 GC 日志分析 | https://gceasy.io |
| MAT | 堆转储分析 | https://eclipse.dev/mat |
| Arthas | 在线诊断工具 | https://arthas.aliyun.com |
| async-profiler | 低开销采样分析器 | https://github.com/async-profiler/async-profiler |
| JFR/JMC | 飞行记录器 | JDK 内置 |

### 深入学习方向

1. **GC 源码研究**
   - OpenJDK GC 源码：`src/hotspot/share/gc/`
   - G1 源码：`g1/` 目录
   - ZGC 源码：`z/` 目录

2. **性能分析进阶**
   - Java Flight Recorder (JFR) 深入使用
   - 火焰图分析
   - 压测与调优方法论

3. **新技术追踪**
   - Generational ZGC (JDK 21+)
   - Value Types (Project Valhalla)
   - 未来 GC 发展趋势

---

理解垃圾回收机制是 Java 性能调优的基础。通过本文的学习，你应该能够：

1. 理解 GC 的核心原理和常用算法
2. 掌握 G1、ZGC、Shenandoah 等现代收集器的特点
3. 能够根据应用场景选择和配置合适的 GC 收集器
4. 具备排查 GC 相关性能问题的能力

记住，GC 调优应该遵循"测量-分析-优化-验证"的循环，避免盲目调参。最好的调优往往是先优化代码，减少不必要的对象创建，再考虑 GC 层面的调整。
