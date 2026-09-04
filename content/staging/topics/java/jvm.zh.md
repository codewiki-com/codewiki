---
title: JVM内存模型
description: Java虚拟机完全指南，内存结构、垃圾回收与性能调优
track: java
section: jvm-gc
difficulty: advanced
tags:
  - Java
  - JVM
  - 内存模型
  - 垃圾回收
status: imported
origin: old/src/content/docs/java/jvm.zh.md
divergence: 0.216
issues: []
legacy:
  category: Java
  subcategory: JVM
  order: 6
  lastUpdated: 2026-01-07
---

Java 虚拟机（JVM）是 Java 程序运行的基础平台。深入理解 JVM 的内部机制对于编写高性能 Java 应用程序、排查内存问题和进行性能调优至关重要。本文将全面剖析 JVM 的架构、内存模型、垃圾回收机制以及性能调优技巧。

## JVM 整体架构

JVM 主要由以下几个核心组件构成：

```
+-------------------------------------------------------------+
|                        Java 应用程序                          |
+-------------------------------------------------------------+
|                      类加载子系统                              |
|              (加载 -> 链接 -> 初始化)                          |
+-------------------------------------------------------------+
|                       运行时数据区                             |
|  +---------+---------+----------+----------+-------------+  |
|  |  方法区   |   堆     |  虚拟机栈  | 本地方法栈 |  程序计数器   |  |
|  |(Metaspace)| (Heap)  | (Stack)  |(Native)  |    (PC)     |  |
|  +---------+---------+----------+----------+-------------+  |
+-------------------------------------------------------------+
|                        执行引擎                               |
|         (解释器 + JIT编译器 + 垃圾回收器)                       |
+-------------------------------------------------------------+
|                     本地方法接口 (JNI)                         |
+-------------------------------------------------------------+
|                      本地方法库                               |
+-------------------------------------------------------------+
```

### 类加载子系统

类加载器负责将 `.class` 文件加载到内存中，主要分为三个阶段：

1. **加载（Loading）**：查找并加载类的二进制数据
2. **链接（Linking）**：验证、准备、解析
3. **初始化（Initialization）**：执行类的静态初始化块

```java
// 类加载器层次结构示例
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // 应用类加载器
        ClassLoader appLoader = ClassLoaderDemo.class.getClassLoader();
        System.out.println("应用类加载器: " + appLoader);

        // 扩展类加载器（Java 9+ 为平台类加载器）
        ClassLoader extLoader = appLoader.getParent();
        System.out.println("扩展类加载器: " + extLoader);

        // 启动类加载器（由 C++ 实现，返回 null）
        ClassLoader bootLoader = extLoader.getParent();
        System.out.println("启动类加载器: " + bootLoader);
    }
}
```

**双亲委派模型**确保类加载的安全性：

```java
// 自定义类加载器
public class CustomClassLoader extends ClassLoader {

    private String classPath;

    public CustomClassLoader(String classPath) {
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] classData = loadClassData(name);
            if (classData == null) {
                throw new ClassNotFoundException();
            }
            return defineClass(name, classData, 0, classData.length);
        } catch (IOException e) {
            throw new ClassNotFoundException(name, e);
        }
    }

    private byte[] loadClassData(String className) throws IOException {
        String path = classPath + File.separator
                    + className.replace('.', File.separatorChar) + ".class";
        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = is.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
            return baos.toByteArray();
        }
    }
}
```

## 运行时数据区详解

### 堆（Heap）

堆是 JVM 中最大的内存区域，用于存储对象实例。所有线程共享堆内存。

```
+------------------------------------------------------------+
|                          堆 (Heap)                          |
+----------------------------+-------------------------------+
|        年轻代 (Young Gen)    |        老年代 (Old Gen)        |
+------+------+--------------+                               |
| Eden |  S0  |      S1      |                               |
|      |(From)|     (To)     |                               |
+------+------+--------------+-------------------------------+
| 比例:     8  :  1  :    1              约占堆的 2/3          |
+------------------------------------------------------------+
```

**年轻代（Young Generation）**：
- **Eden 区**：新创建的对象首先分配在这里
- **Survivor 区（S0/S1）**：经过一次 Minor GC 后存活的对象移到这里

**老年代（Old Generation）**：
- 存放长期存活的对象
- 大对象可能直接分配到老年代

```java
// 对象分配示例
public class HeapAllocationDemo {

    // 大对象阈值可通过 -XX:PretenureSizeThreshold 设置
    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 小对象，分配在 Eden 区
        byte[] smallObj = new byte[100];

        // 大对象，可能直接分配在老年代
        byte[] largeObj = new byte[4 * _1MB];

        // 触发 GC 观察对象晋升
        System.gc();
    }
}
```

### 虚拟机栈（JVM Stack）

每个线程都有自己的虚拟机栈，用于存储栈帧（Stack Frame）。

```
+-------------------------------------+
|           线程的虚拟机栈              |
+-------------------------------------+
|  +-----------------------------+   |
|  |     栈帧 (Stack Frame)       |   |
|  +-----------------------------+   |
|  |  局部变量表 (Local Variables) |   |
|  |  操作数栈 (Operand Stack)    |   |
|  |  动态链接 (Dynamic Linking)  |   |
|  |  返回地址 (Return Address)   |   |
|  +-----------------------------+   |
|              |                      |
|              v                      |
|  +-----------------------------+   |
|  |         栈帧 N-1             |   |
|  +-----------------------------+   |
|              |                      |
|             ...                     |
+-------------------------------------+
```

```java
// 栈帧演示
public class StackFrameDemo {

    public static void main(String[] args) {
        int result = calculate(10, 20);
        System.out.println("结果: " + result);
    }

    // 每次方法调用都会创建新的栈帧
    public static int calculate(int a, int b) {
        int sum = a + b;        // 局部变量存储在局部变量表
        int product = multiply(a, b);  // 方法调用压入新栈帧
        return sum + product;   // 返回时弹出栈帧
    }

    public static int multiply(int x, int y) {
        return x * y;
    }
}
```

**栈溢出示例**：

```java
// StackOverflowError 演示
public class StackOverflowDemo {

    private static int stackDepth = 0;

    public static void recursiveCall() {
        stackDepth++;
        recursiveCall();  // 无限递归导致栈溢出
    }

    public static void main(String[] args) {
        try {
            recursiveCall();
        } catch (StackOverflowError e) {
            System.out.println("栈深度: " + stackDepth);
            // 可通过 -Xss 参数调整栈大小
        }
    }
}
```

### 方法区（Metaspace）

从 Java 8 开始，永久代（PermGen）被元空间（Metaspace）取代。

```java
// 元空间存储的内容
public class MetaspaceDemo {

    // 类的元数据信息存储在 Metaspace
    private static final String CONSTANT = "常量池中的字符串";

    public static void main(String[] args) {
        // 动态生成类可能导致 Metaspace 溢出
        // 使用 CGLIB 或动态代理时需要注意

        // 查看 Metaspace 使用情况
        // jcmd <pid> VM.metaspace
    }
}
```

**Metaspace 配置参数**：

```bash
# 设置 Metaspace 初始大小
-XX:MetaspaceSize=256m

# 设置 Metaspace 最大大小
-XX:MaxMetaspaceSize=512m

# 类指针压缩空间大小
-XX:CompressedClassSpaceSize=256m
```

### 程序计数器（PC Register）

程序计数器是线程私有的，用于记录当前执行的字节码指令地址。

```java
// 字节码执行示例
public class PCRegisterDemo {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int c = a + b;
        // 对应的字节码:
        // 0: bipush 10      <- PC 指向这里
        // 2: istore_1
        // 3: bipush 20      <- 执行后 PC 移动到这里
        // 5: istore_2
        // 6: iload_1
        // 7: iload_2
        // 8: iadd
        // 9: istore_3
    }
}
```

### 本地方法栈（Native Method Stack）

用于执行本地（Native）方法的栈空间。

```java
// Native 方法示例
public class NativeMethodDemo {

    // native 方法由 C/C++ 实现
    public native void nativeMethod();

    // Object 类中的 native 方法
    // public native int hashCode();
    // protected native Object clone();

    static {
        System.loadLibrary("nativeLib");
    }
}
```

## 垃圾回收机制

### 如何判断对象可回收

#### 引用计数法（Reference Counting）

```java
// 引用计数法的缺陷：循环引用
public class ReferenceCountingDemo {

    public Object instance = null;
    private byte[] data = new byte[1024 * 1024]; // 1MB

    public static void main(String[] args) {
        ReferenceCountingDemo objA = new ReferenceCountingDemo();
        ReferenceCountingDemo objB = new ReferenceCountingDemo();

        // 循环引用
        objA.instance = objB;
        objB.instance = objA;

        // 置空外部引用
        objA = null;
        objB = null;

        // 触发 GC
        // 引用计数法无法回收循环引用的对象
        // 但 JVM 使用可达性分析，可以正确回收
        System.gc();
    }
}
```

#### 可达性分析（Reachability Analysis）

```
        GC Roots
       /   |   \
      v    v    v
    对象A  对象B  对象C
     |      |
     v      v
   对象D   对象E  <-- 可达，不回收

   对象F --> 对象G  <-- 不可达，将被回收
```

**GC Roots 包括**：
- 虚拟机栈中引用的对象
- 方法区中类静态属性引用的对象
- 方法区中常量引用的对象
- 本地方法栈中 JNI 引用的对象
- 被同步锁持有的对象

```java
// GC Roots 示例
public class GCRootsDemo {

    // 静态变量作为 GC Root
    private static Object staticObj;

    // 常量作为 GC Root
    private static final Object CONSTANT_OBJ = new Object();

    public void method() {
        // 局部变量作为 GC Root
        Object localObj = new Object();

        // localObj 引用的对象在方法执行期间不会被回收
    }
}
```

### 引用类型

```java
import java.lang.ref.*;

public class ReferenceTypesDemo {

    public static void main(String[] args) {

        // 1. 强引用 (Strong Reference)
        // 只要强引用存在，对象不会被回收
        Object strongRef = new Object();

        // 2. 软引用 (Soft Reference)
        // 内存不足时才会回收，适合缓存
        SoftReference<byte[]> softRef = new SoftReference<>(new byte[1024 * 1024]);
        System.out.println("软引用对象: " + softRef.get());

        // 3. 弱引用 (Weak Reference)
        // 下次 GC 时一定会被回收
        WeakReference<Object> weakRef = new WeakReference<>(new Object());
        System.gc();
        System.out.println("弱引用对象: " + weakRef.get()); // 可能为 null

        // 4. 虚引用 (Phantom Reference)
        // 无法通过虚引用获取对象，用于跟踪对象被回收的状态
        ReferenceQueue<Object> queue = new ReferenceQueue<>();
        PhantomReference<Object> phantomRef = new PhantomReference<>(new Object(), queue);
        System.out.println("虚引用对象: " + phantomRef.get()); // 始终为 null
    }
}
```

**软引用缓存实现**：

```java
import java.lang.ref.SoftReference;
import java.util.HashMap;
import java.util.Map;

public class SoftReferenceCache<K, V> {

    private final Map<K, SoftReference<V>> cache = new HashMap<>();

    public void put(K key, V value) {
        cache.put(key, new SoftReference<>(value));
    }

    public V get(K key) {
        SoftReference<V> ref = cache.get(key);
        if (ref != null) {
            V value = ref.get();
            if (value == null) {
                // 对象已被回收，清理缓存条目
                cache.remove(key);
            }
            return value;
        }
        return null;
    }

    public void clear() {
        cache.clear();
    }
}
```

### 垃圾回收算法

#### 标记-清除算法（Mark-Sweep）

```
标记阶段:
+---+---+---+---+---+---+---+---+
| A | B | C | D | E | F | G | H |
| * |   | * |   | * |   |   | * |  <-- 标记存活对象
+---+---+---+---+---+---+---+---+

清除阶段:
+---+---+---+---+---+---+---+---+
| A |   | C |   | E |   |   | H |  <-- 清除未标记对象
+---+---+---+---+---+---+---+---+
     ^       ^       ^   ^
     +-------+-------+---+
           内存碎片
```

**优点**：实现简单
**缺点**：产生内存碎片，分配大对象时可能触发额外 GC

#### 复制算法（Copying）

```
复制前 (From 空间):
+---+---+---+---+---+---+---+---+
| A | B | C | D | E | F | G | H |
| * |   | * |   | * |   |   | * |
+---+---+---+---+---+---+---+---+

复制后 (To 空间):
+---+---+---+---+---+---+---+---+
| A | C | E | H |   |   |   |   |  <-- 存活对象连续排列
+---+---+---+---+---+---+---+---+
```

**优点**：没有内存碎片，分配效率高
**缺点**：浪费一半内存空间

#### 标记-整理算法（Mark-Compact）

```
标记阶段:
+---+---+---+---+---+---+---+---+
| A | B | C | D | E | F | G | H |
| * |   | * |   | * |   |   | * |
+---+---+---+---+---+---+---+---+

整理阶段:
+---+---+---+---+---+---+---+---+
| A | C | E | H |   |   |   |   |  <-- 存活对象向一端移动
+---+---+---+---+---+---+---+---+
```

**优点**：没有内存碎片，内存利用率高
**缺点**：需要移动对象，效率较低

#### 分代收集算法（Generational Collection）

```java
// 分代收集策略演示
public class GenerationalGCDemo {

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 年轻代使用复制算法
        // 因为大部分对象都是"朝生夕死"，存活率低

        // 老年代使用标记-清除或标记-整理算法
        // 因为存活率高，复制成本大

        // 模拟对象分配和晋升
        byte[][] arrays = new byte[10][];
        for (int i = 0; i < 10; i++) {
            arrays[i] = new byte[_1MB];
            if (i % 3 == 0) {
                System.gc(); // 触发 Minor GC
            }
        }
    }
}
```

### 垃圾收集器详解

#### Serial 收集器

```bash
# 启用 Serial 收集器
-XX:+UseSerialGC
```

```
Serial GC 工作流程:

用户线程: --------+-------------------------+--------
                  |                         |
                  |     Stop The World      |
                  v                         v
GC 线程:          +-------------------------+
                  |   单线程 GC (串行回收)    |
                  +-------------------------+
```

**适用场景**：单核 CPU、小内存应用

#### Parallel 收集器

```bash
# 启用 Parallel 收集器（JDK 8 默认）
-XX:+UseParallelGC

# 设置并行 GC 线程数
-XX:ParallelGCThreads=4

# 设置吞吐量目标
-XX:GCTimeRatio=99

# 设置最大暂停时间目标
-XX:MaxGCPauseMillis=100
```

```
Parallel GC 工作流程:

用户线程: --------+-------------------------+--------
                  |                         |
                  |     Stop The World      |
                  v                         v
GC 线程1:         +-------------------------+
GC 线程2:         +-------------------------+
GC 线程3:         +-------------------------+
GC 线程4:         +-------------------------+
                  |     多线程并行回收        |
                  +-------------------------+
```

**适用场景**：多核 CPU、追求高吞吐量的后台应用

#### CMS 收集器（Concurrent Mark Sweep）

```bash
# 启用 CMS 收集器（JDK 9 已废弃，JDK 14 移除）
-XX:+UseConcMarkSweepGC

# 设置老年代使用率触发 CMS 的阈值
-XX:CMSInitiatingOccupancyFraction=70
```

```
CMS GC 工作流程:

用户线程: --+----------------------------------+------
            |                                  |
  初始标记   |            并发标记               | 重新标记
   (STW)    |          (与用户线程并发)          |  (STW)
            v                                  v
GC 线程:    +--+                           +--+
               +---------------------------+
                      并发清除
```

**四个阶段**：
1. **初始标记**：STW，标记 GC Roots 直接关联的对象
2. **并发标记**：与用户线程并发，遍历对象图
3. **重新标记**：STW，修正并发标记期间的变化
4. **并发清除**：与用户线程并发，清除垃圾对象

**优点**：低延迟
**缺点**：
- 对 CPU 资源敏感
- 无法处理浮动垃圾
- 产生内存碎片

#### G1 收集器（Garbage First）

```bash
# 启用 G1 收集器（JDK 9+ 默认）
-XX:+UseG1GC

# 设置堆区域大小（1MB-32MB，必须是2的幂）
-XX:G1HeapRegionSize=4m

# 设置最大暂停时间目标
-XX:MaxGCPauseMillis=200

# 设置触发并发标记周期的堆占用阈值
-XX:InitiatingHeapOccupancyPercent=45
```

```
G1 堆内存布局:

+----+----+----+----+----+----+----+----+
| E  | S  | O  | E  |    | O  | H  | H  |
+----+----+----+----+----+----+----+----+
| O  | E  |    | S  | O  | E  | H  |    |
+----+----+----+----+----+----+----+----+
|    | O  | E  | O  | E  |    | O  | S  |
+----+----+----+----+----+----+----+----+

E = Eden    S = Survivor    O = Old    H = Humongous (大对象)
```

```java
// G1 GC 调优示例
public class G1GCDemo {

    public static void main(String[] args) {
        // 运行参数:
        // -XX:+UseG1GC
        // -XX:MaxGCPauseMillis=100
        // -XX:G1HeapRegionSize=4m
        // -Xlog:gc*:file=gc.log:time,uptime,level,tags

        List<byte[]> list = new ArrayList<>();

        for (int i = 0; i < 1000; i++) {
            // 分配不同大小的对象
            int size = (int) (Math.random() * 1024 * 1024);
            list.add(new byte[size]);

            // 随机释放一些对象
            if (Math.random() > 0.7 && !list.isEmpty()) {
                list.remove((int) (Math.random() * list.size()));
            }
        }
    }
}
```

#### ZGC 收集器

```bash
# 启用 ZGC（JDK 15+ 生产可用）
-XX:+UseZGC

# JDK 21+ 分代 ZGC
-XX:+UseZGC -XX:+ZGenerational

# 设置堆大小
-Xmx16g -Xms16g
```

**ZGC 特点**：
- 暂停时间不超过 1ms
- 支持 TB 级别堆内存
- 暂停时间不随堆大小增加而增加

```java
// ZGC 适用场景
public class ZGCDemo {

    // ZGC 适合:
    // 1. 大内存应用（几十GB到TB级别）
    // 2. 低延迟要求（P99 < 10ms）
    // 3. 高并发应用

    public static void main(String[] args) {
        // 运行参数:
        // -XX:+UseZGC
        // -Xmx32g -Xms32g
        // -Xlog:gc*:file=zgc.log

        // ZGC 使用着色指针和读屏障实现并发
        // 几乎所有 GC 工作都与应用线程并发进行
    }
}
```

#### Shenandoah 收集器

```bash
# 启用 Shenandoah（OpenJDK 特有）
-XX:+UseShenandoahGC

# 设置暂停时间目标
-XX:ShenandoahGCHeuristics=adaptive
```

### 收集器对比

| 收集器 | 算法 | 特点 | 适用场景 |
|--------|------|------|----------|
| Serial | 复制/标记-整理 | 单线程，简单高效 | 客户端小应用 |
| Parallel | 复制/标记-整理 | 多线程，高吞吐量 | 后台计算任务 |
| CMS | 标记-清除 | 低延迟，并发收集 | Web 应用（已废弃） |
| G1 | 标记-整理 | 可预测停顿，区域化 | 大堆内存应用 |
| ZGC | 标记-整理 | 超低延迟，TB级堆 | 超大堆、低延迟要求 |
| Shenandoah | 标记-整理 | 低延迟，并发压缩 | 低延迟要求 |

## JVM 性能调优

### 常用 JVM 参数

```bash
# ================== 堆内存设置 ==================
# 初始堆大小
-Xms4g
# 最大堆大小
-Xmx4g
# 年轻代大小
-Xmn2g
# Eden 与 Survivor 比例
-XX:SurvivorRatio=8
# 老年代与年轻代比例
-XX:NewRatio=2

# ================== 栈设置 ==================
# 线程栈大小
-Xss256k

# ================== 元空间设置 ==================
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# ================== GC 日志 ==================
# JDK 9+
-Xlog:gc*:file=gc.log:time,uptime,level,tags
# JDK 8
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-Xloggc:gc.log

# ================== OOM 时 dump 堆 ==================
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/java/heapdump.hprof

# ================== 性能优化 ==================
# 禁用偏向锁（高并发场景）
-XX:-UseBiasedLocking
# 大页内存
-XX:+UseLargePages
# 字符串去重（G1）
-XX:+UseStringDeduplication
```

### JVM 调优实战

#### 内存分配优化

```java
// 避免频繁创建临时对象
public class MemoryOptimization {

    // 反例：每次调用都创建新的 StringBuilder
    public String badConcat(String[] items) {
        String result = "";
        for (String item : items) {
            result += item + ",";  // 每次拼接都创建新对象
        }
        return result;
    }

    // 正例：重用 StringBuilder
    public String goodConcat(String[] items) {
        StringBuilder sb = new StringBuilder();
        for (String item : items) {
            sb.append(item).append(",");
        }
        return sb.toString();
    }

    // 对象池模式
    private static final ThreadLocal<SimpleDateFormat> DATE_FORMAT =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    public String formatDate(Date date) {
        return DATE_FORMAT.get().format(date);
    }
}
```

#### GC 调优示例

```bash
# 场景1：高吞吐量后台任务
java -Xms8g -Xmx8g \
     -XX:+UseParallelGC \
     -XX:ParallelGCThreads=8 \
     -XX:GCTimeRatio=99 \
     -jar app.jar

# 场景2：低延迟 Web 应用
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=100 \
     -XX:G1HeapRegionSize=4m \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -jar app.jar

# 场景3：超大堆低延迟应用
java -Xms32g -Xmx32g \
     -XX:+UseZGC \
     -XX:+ZGenerational \
     -jar app.jar
```

#### 常见问题排查

```java
// 内存泄漏排查示例
public class MemoryLeakDemo {

    // 内存泄漏场景1：静态集合持有对象引用
    private static List<Object> cache = new ArrayList<>();

    public void addToCache(Object obj) {
        cache.add(obj);  // 对象永远不会被释放
    }

    // 解决方案：使用弱引用或设置容量限制
    private static Map<String, SoftReference<Object>> softCache = new HashMap<>();

    // 内存泄漏场景2：未关闭的资源
    public void readFile(String path) throws IOException {
        FileInputStream fis = new FileInputStream(path);
        // 如果发生异常，流不会被关闭
    }

    // 解决方案：使用 try-with-resources
    public void readFileSafe(String path) throws IOException {
        try (FileInputStream fis = new FileInputStream(path)) {
            // 自动关闭资源
        }
    }
}
```

## 监控与诊断工具

### jps - 查看 Java 进程

```bash
# 列出所有 Java 进程
jps -l

# 显示传递给 main 方法的参数
jps -m

# 显示 JVM 参数
jps -v
```

### jstat - 统计信息监控

```bash
# 查看 GC 统计
jstat -gc <pid> 1000 10

# 查看 GC 原因
jstat -gccause <pid>

# 查看类加载统计
jstat -class <pid>

# 输出示例:
# S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC
# 1024.0  0.0   512.0  8192.0   4096.0   20480.0    10240.0   4864.0
```

### jmap - 内存映射

```bash
# 查看堆内存使用情况
jmap -heap <pid>

# 生成堆转储文件
jmap -dump:format=b,file=heap.hprof <pid>

# 查看对象直方图
jmap -histo <pid> | head -20

# 仅统计存活对象（会触发 Full GC）
jmap -histo:live <pid>
```

### jstack - 线程堆栈

```bash
# 打印线程堆栈
jstack <pid>

# 检测死锁
jstack -l <pid>

# 强制 dump（进程无响应时）
jstack -F <pid>
```

```java
// 死锁示例
public class DeadlockDemo {

    private static final Object LOCK_A = new Object();
    private static final Object LOCK_B = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (LOCK_A) {
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (LOCK_B) {
                    System.out.println("Thread 1");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (LOCK_B) {
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (LOCK_A) {
                    System.out.println("Thread 2");
                }
            }
        });

        t1.start();
        t2.start();
    }
}
```

### jcmd - 诊断命令

```bash
# 查看可用命令
jcmd <pid> help

# 查看 VM 信息
jcmd <pid> VM.info

# 查看系统属性
jcmd <pid> VM.system_properties

# 查看 JVM 参数
jcmd <pid> VM.flags

# 生成堆转储
jcmd <pid> GC.heap_dump /tmp/heap.hprof

# 执行 GC
jcmd <pid> GC.run

# JFR 录制
jcmd <pid> JFR.start duration=60s filename=recording.jfr
```

### 可视化工具

#### JConsole

```bash
# 启动 JConsole
jconsole

# 远程连接配置
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
```

#### VisualVM

```bash
# 启动 VisualVM
jvisualvm

# 功能:
# - 监控 CPU、内存、线程
# - 堆 dump 分析
# - 线程 dump 分析
# - CPU 和内存采样
```

#### JMC (Java Mission Control)

```bash
# 启动 JMC
jmc

# 功能:
# - 实时监控
# - 飞行记录器 (JFR)
# - 自动分析和建议
```

### GC 日志分析

```bash
# JDK 17+ GC 日志配置
-Xlog:gc*,gc+age=trace,safepoint:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10m
```

```java
// 解析 GC 日志示例
public class GCLogAnalysis {

    // GC 日志关键信息:
    // [0.123s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause)
    // [0.130s][info][gc] GC(0) 24M->8M(256M) 7.123ms

    // 关注指标:
    // 1. GC 频率
    // 2. GC 暂停时间
    // 3. 堆内存变化
    // 4. GC 类型（Minor/Major/Full）
}
```

## 实战案例

### 案例1：OOM 问题排查

```java
// 模拟 OOM
public class OOMDemo {

    public static void main(String[] args) {
        // 运行参数: -Xmx128m -XX:+HeapDumpOnOutOfMemoryError
        List<byte[]> list = new ArrayList<>();

        while (true) {
            list.add(new byte[1024 * 1024]); // 每次分配 1MB
        }
    }
}
```

**排查步骤**：

```bash
# 分析堆转储文件
jmap -dump:format=b,file=heap.hprof <pid>

# 使用 MAT (Memory Analyzer Tool) 分析
# - 查找内存占用最大的对象
# - 分析对象引用链
# - 查找内存泄漏嫌疑

# 使用 jcmd 查看对象直方图
jcmd <pid> GC.class_histogram | head -30
```

### 案例2：高 CPU 占用排查

```bash
# 找到 CPU 高的线程
top -Hp <pid>

# 转换线程 ID 为 16 进制
printf '%x\n' <tid>

# 查看线程堆栈
jstack <pid> | grep -A 30 <hex_tid>

# 分析线程状态和调用栈
```

### 案例3：GC 调优实战

```java
// 电商应用 GC 调优示例
public class EcommerceGCTuning {

    // 问题: 频繁 Full GC，响应时间抖动大

    // 原始配置:
    // -Xms2g -Xmx2g -XX:+UseParallelGC

    // 分析:
    // 1. jstat 显示 Full GC 频繁（每分钟多次）
    // 2. 老年代增长过快
    // 3. Young GC 后大量对象晋升

    // 调优后配置:
    // -Xms4g -Xmx4g
    // -XX:+UseG1GC
    // -XX:MaxGCPauseMillis=100
    // -XX:G1HeapRegionSize=8m
    // -XX:InitiatingHeapOccupancyPercent=45
    // -XX:G1NewSizePercent=30
    // -XX:G1MaxNewSizePercent=40

    // 优化效果:
    // - Full GC 次数减少 90%
    // - 平均响应时间下降 30%
    // - P99 延迟从 500ms 降到 150ms
}
```

## JVM 调优清单

```markdown
### 调优前准备
- [ ] 确定性能目标（吞吐量/延迟/内存占用）
- [ ] 收集基准性能数据
- [ ] 开启 GC 日志
- [ ] 配置 OOM 时自动 dump

### 内存调优
- [ ] 根据应用特点设置堆大小
- [ ] 调整年轻代与老年代比例
- [ ] 设置合适的 Metaspace 大小
- [ ] 考虑是否需要调整线程栈大小

### GC 调优
- [ ] 选择合适的垃圾收集器
- [ ] 设置 GC 暂停时间目标
- [ ] 调整 GC 相关参数
- [ ] 监控 GC 频率和耗时

### 监控与验证
- [ ] 持续监控 GC 行为
- [ ] 定期分析 GC 日志
- [ ] 压测验证调优效果
- [ ] 建立性能基线
```

## JIT 即时编译

### 编译器类型

JVM 使用分层编译策略，结合解释执行和编译执行的优势：

```java
// JIT 编译层级
public class JITCompilationDemo {

    // 层级 0: 解释执行
    // 层级 1: C1 简单编译，无性能监控
    // 层级 2: C1 编译，带基本性能监控
    // 层级 3: C1 编译，带完整性能监控
    // 层级 4: C2 完全优化编译

    public static void main(String[] args) {
        // 热点代码会被 JIT 编译
        for (int i = 0; i < 100000; i++) {
            hotMethod();  // 被频繁调用的方法
        }
    }

    private static int hotMethod() {
        int sum = 0;
        for (int i = 0; i < 100; i++) {
            sum += i;
        }
        return sum;
    }
}
```

### 常见 JIT 优化

```java
// 1. 方法内联 (Method Inlining)
public class InliningDemo {

    // 编译前
    public int calculate(int a, int b) {
        return add(a, b);
    }

    private int add(int x, int y) {
        return x + y;
    }

    // 编译后（内联）
    // public int calculate(int a, int b) {
    //     return a + b;  // 方法调用被消除
    // }
}

// 2. 逃逸分析 (Escape Analysis)
public class EscapeAnalysisDemo {

    public void noEscape() {
        // 对象不逃逸，可以在栈上分配或标量替换
        Point p = new Point(1, 2);
        int sum = p.x + p.y;
    }

    public Point escape() {
        // 对象逃逸，必须在堆上分配
        return new Point(1, 2);
    }

    static class Point {
        int x, y;
        Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }
}

// 3. 锁消除 (Lock Elimination)
public class LockEliminationDemo {

    public void method() {
        // StringBuffer 是线程安全的，内部使用 synchronized
        // 但这里的 sb 不会逃逸，锁可以被消除
        StringBuffer sb = new StringBuffer();
        sb.append("Hello");
        sb.append("World");
    }
}
```

### JIT 相关参数

```bash
# 查看 JIT 编译信息
-XX:+PrintCompilation

# 禁用 C2 编译器
-XX:TieredStopAtLevel=1

# 设置编译阈值
-XX:CompileThreshold=10000

# 打印内联信息
-XX:+PrintInlining

# 设置内联方法的最大字节码大小
-XX:MaxInlineSize=35
```

## 类加载机制深入

### 类加载过程

```
         加载 (Loading)
              |
              v
    +--------------------+
    |       链接         |
    | +--------------+  |
    | |   验证       |  |
    | |   (Verify)   |  |
    | +--------------+  |
    | |   准备       |  |
    | |  (Prepare)   |  |
    | +--------------+  |
    | |   解析       |  |
    | |  (Resolve)   |  |
    | +--------------+  |
    +--------------------+
              |
              v
       初始化 (Initialize)
```

```java
// 类初始化示例
public class ClassInitializationDemo {

    static {
        System.out.println("静态代码块执行");
    }

    private static int value = initValue();

    private static int initValue() {
        System.out.println("静态变量初始化");
        return 42;
    }

    public static void main(String[] args) {
        System.out.println("main 方法执行");
        System.out.println("value = " + value);
    }

    // 输出顺序:
    // 静态代码块执行
    // 静态变量初始化
    // main 方法执行
    // value = 42
}
```

### 打破双亲委派

```java
// SPI 机制打破双亲委派示例
public class SPIDemo {

    public static void main(String[] args) {
        // JDBC 驱动加载使用线程上下文类加载器
        // 打破了双亲委派模型

        // 核心类 DriverManager 由启动类加载器加载
        // 但它需要加载由应用类加载器加载的驱动实现类
        // 通过线程上下文类加载器实现

        ClassLoader contextClassLoader = Thread.currentThread().getContextClassLoader();
        System.out.println("线程上下文类加载器: " + contextClassLoader);

        // ServiceLoader 使用上下文类加载器加载 SPI 实现
        ServiceLoader<Driver> drivers = ServiceLoader.load(Driver.class);
        for (Driver driver : drivers) {
            System.out.println("驱动: " + driver.getClass().getName());
        }
    }
}
```

## 内存模型（JMM）

### 可见性问题

```java
// 可见性问题示例
public class VisibilityDemo {

    private static boolean flag = true;
    // 使用 volatile 保证可见性
    // private static volatile boolean flag = true;

    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> {
            while (flag) {
                // 没有 volatile，可能无限循环
                // 因为线程可能一直使用本地缓存的 flag 值
            }
            System.out.println("线程结束");
        });

        t.start();
        Thread.sleep(100);
        flag = false;
        System.out.println("main 设置 flag = false");
    }
}
```

### happens-before 规则

```java
// happens-before 关系示例
public class HappensBeforeDemo {

    private int x = 0;
    private volatile boolean ready = false;

    // 写线程
    public void writer() {
        x = 42;           // 1
        ready = true;     // 2 (volatile 写)
    }

    // 读线程
    public void reader() {
        if (ready) {       // 3 (volatile 读)
            int r = x;     // 4
            // 根据 happens-before 规则:
            // 1 happens-before 2 (程序顺序规则)
            // 2 happens-before 3 (volatile 规则)
            // 3 happens-before 4 (程序顺序规则)
            // 因此 1 happens-before 4
            // 所以 r 一定等于 42
        }
    }
}
```

## 性能监控最佳实践

### 生产环境配置模板

```bash
#!/bin/bash
# 生产环境 JVM 配置模板

JAVA_OPTS="
# 堆内存配置
-Xms4g
-Xmx4g

# 元空间配置
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# G1 垃圾收集器
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=8m
-XX:InitiatingHeapOccupancyPercent=45

# GC 日志（JDK 11+）
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=10,filesize=100m

# 内存溢出时自动 dump
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heapdump.hprof

# JMX 远程监控
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.ssl=false
-Dcom.sun.management.jmxremote.authenticate=false

# 其他优化
-XX:+UseStringDeduplication
-XX:+AlwaysPreTouch
"

java $JAVA_OPTS -jar application.jar
```

### Arthas 诊断工具

```bash
# 安装 Arthas
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# 常用命令
dashboard          # 查看系统实时数据面板
thread             # 查看线程信息
jvm                # 查看 JVM 信息
memory             # 查看内存信息
gc                 # 查看 GC 信息

# 热更新
redefine /path/to/MyClass.class

# 方法调用监控
watch com.example.MyClass myMethod returnObj

# 方法调用链路追踪
trace com.example.MyClass myMethod

# 反编译类
jad com.example.MyClass
```

## 总结

JVM 调优是一个持续的过程，需要深入理解应用特点和 JVM 内部机制。关键要点：

1. **理解内存模型**：掌握堆、栈、方法区的作用和关系
2. **熟悉 GC 算法**：了解各种 GC 算法的原理和适用场景
3. **选择合适的收集器**：根据应用需求选择最适合的 GC 收集器
4. **善用监控工具**：熟练使用 jstat、jmap、jstack 等诊断工具
5. **基于数据调优**：用数据驱动决策，避免盲目调优

记住：**过早优化是万恶之源**，先让程序正确运行，再根据实际问题进行针对性优化。
