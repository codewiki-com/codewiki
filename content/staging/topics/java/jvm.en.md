---
title: JVM Memory Model
description: "Complete Guide to Java Virtual Machine: Memory Structure, Garbage Collection and Performance Tuning"
track: java
section: jvm-gc
difficulty: advanced
tags:
  - Java
  - JVM
  - Memory Model
  - Garbage Collection
status: imported
origin: old/src/content/docs/java/jvm.en.md
divergence: 0.216
issues: []
legacy:
  category: Java
  subcategory: JVM
  order: 6
  lastUpdated: 2026-01-07
---

The Java Virtual Machine (JVM) is the foundational platform for running Java programs. A deep understanding of JVM internals is essential for writing high-performance Java applications, troubleshooting memory issues, and performing performance tuning. We analyze JVM architecture, memory model, garbage collection mechanisms, and performance tuning techniques.

## JVM Overall Architecture

The JVM consists of the following core components:

```
+-------------------------------------------------------------+
|                      Java Application                        |
+-------------------------------------------------------------+
|                    Class Loading Subsystem                   |
|               (Loading -> Linking -> Initialization)         |
+-------------------------------------------------------------+
|                     Runtime Data Areas                       |
|  +---------+---------+----------+----------+-------------+  |
|  | Method  |  Heap   |   JVM    |  Native  |    Program   |  |
|  |  Area   |         |  Stack   |  Method  |    Counter   |  |
|  |(Metaspace)|       |          |  Stack   |     (PC)     |  |
|  +---------+---------+----------+----------+-------------+  |
+-------------------------------------------------------------+
|                      Execution Engine                        |
|          (Interpreter + JIT Compiler + Garbage Collector)    |
+-------------------------------------------------------------+
|                  Java Native Interface (JNI)                 |
+-------------------------------------------------------------+
|                     Native Method Libraries                  |
+-------------------------------------------------------------+
```

### Class Loading Subsystem

The class loader is responsible for loading `.class` files into memory, primarily divided into three phases:

1. **Loading**: Find and load the binary data of the class
2. **Linking**: Verification, preparation, resolution
3. **Initialization**: Execute static initialization blocks of the class

```java
// Class loader hierarchy example
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // Application class loader
        ClassLoader appLoader = ClassLoaderDemo.class.getClassLoader();
        System.out.println("Application class loader: " + appLoader);

        // Extension class loader (Platform class loader in Java 9+)
        ClassLoader extLoader = appLoader.getParent();
        System.out.println("Extension class loader: " + extLoader);

        // Bootstrap class loader (implemented in C++, returns null)
        ClassLoader bootLoader = extLoader.getParent();
        System.out.println("Bootstrap class loader: " + bootLoader);
    }
}
```

The **Parent Delegation Model** ensures class loading security:

```java
// Custom class loader
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

## Runtime Data Areas Explained

### Heap

The heap is the largest memory area in the JVM, used to store object instances. All threads share heap memory.

```
+------------------------------------------------------------+
|                          Heap                               |
+----------------------------+-------------------------------+
|      Young Generation      |        Old Generation         |
+------+------+--------------+                               |
| Eden |  S0  |      S1      |                               |
|      |(From)|     (To)     |                               |
+------+------+--------------+-------------------------------+
| Ratio:   8  :  1  :    1         Approximately 2/3 of heap |
+------------------------------------------------------------+
```

**Young Generation**:
- **Eden Space**: Newly created objects are first allocated here
- **Survivor Spaces (S0/S1)**: Objects surviving one Minor GC are moved here

**Old Generation**:
- Stores long-lived objects
- Large objects may be directly allocated to the old generation

```java
// Object allocation example
public class HeapAllocationDemo {

    // Large object threshold can be set via -XX:PretenureSizeThreshold
    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // Small object, allocated in Eden
        byte[] smallObj = new byte[100];

        // Large object, may be directly allocated in old generation
        byte[] largeObj = new byte[4 * _1MB];

        // Trigger GC to observe object promotion
        System.gc();
    }
}
```

### JVM Stack

Each thread has its own JVM stack, used to store stack frames.

```
+-------------------------------------+
|        Thread's JVM Stack           |
+-------------------------------------+
|  +-----------------------------+   |
|  |     Stack Frame             |   |
|  +-----------------------------+   |
|  |  Local Variables Table      |   |
|  |  Operand Stack              |   |
|  |  Dynamic Linking            |   |
|  |  Return Address             |   |
|  +-----------------------------+   |
|              |                      |
|              v                      |
|  +-----------------------------+   |
|  |       Stack Frame N-1       |   |
|  +-----------------------------+   |
|              |                      |
|             ...                     |
+-------------------------------------+
```

```java
// Stack frame demonstration
public class StackFrameDemo {

    public static void main(String[] args) {
        int result = calculate(10, 20);
        System.out.println("Result: " + result);
    }

    // Each method call creates a new stack frame
    public static int calculate(int a, int b) {
        int sum = a + b;        // Local variables stored in local variable table
        int product = multiply(a, b);  // Method call pushes new stack frame
        return sum + product;   // Pop stack frame on return
    }

    public static int multiply(int x, int y) {
        return x * y;
    }
}
```

**Stack overflow example**:

```java
// StackOverflowError demonstration
public class StackOverflowDemo {

    private static int stackDepth = 0;

    public static void recursiveCall() {
        stackDepth++;
        recursiveCall();  // Infinite recursion causes stack overflow
    }

    public static void main(String[] args) {
        try {
            recursiveCall();
        } catch (StackOverflowError e) {
            System.out.println("Stack depth: " + stackDepth);
            // Stack size can be adjusted via -Xss parameter
        }
    }
}
```

### Method Area (Metaspace)

Starting from Java 8, Permanent Generation (PermGen) was replaced by Metaspace.

```java
// Content stored in Metaspace
public class MetaspaceDemo {

    // Class metadata stored in Metaspace
    private static final String CONSTANT = "String in constant pool";

    public static void main(String[] args) {
        // Dynamically generating classes may cause Metaspace overflow
        // Be careful when using CGLIB or dynamic proxies

        // View Metaspace usage
        // jcmd <pid> VM.metaspace
    }
}
```

**Metaspace configuration parameters**:

```bash
# Set Metaspace initial size
-XX:MetaspaceSize=256m

# Set Metaspace maximum size
-XX:MaxMetaspaceSize=512m

# Compressed class space size
-XX:CompressedClassSpaceSize=256m
```

### Program Counter (PC Register)

The program counter is thread-private and records the address of the current bytecode instruction being executed.

```java
// Bytecode execution example
public class PCRegisterDemo {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int c = a + b;
        // Corresponding bytecode:
        // 0: bipush 10      <- PC points here
        // 2: istore_1
        // 3: bipush 20      <- PC moves here after execution
        // 5: istore_2
        // 6: iload_1
        // 7: iload_2
        // 8: iadd
        // 9: istore_3
    }
}
```

### Native Method Stack

Stack space used for executing native methods.

```java
// Native method example
public class NativeMethodDemo {

    // native methods are implemented in C/C++
    public native void nativeMethod();

    // Native methods in Object class
    // public native int hashCode();
    // protected native Object clone();

    static {
        System.loadLibrary("nativeLib");
    }
}
```

## Garbage Collection Mechanism

### How to Determine if an Object is Reclaimable

#### Reference Counting

```java
// Flaw of reference counting: circular references
public class ReferenceCountingDemo {

    public Object instance = null;
    private byte[] data = new byte[1024 * 1024]; // 1MB

    public static void main(String[] args) {
        ReferenceCountingDemo objA = new ReferenceCountingDemo();
        ReferenceCountingDemo objB = new ReferenceCountingDemo();

        // Circular reference
        objA.instance = objB;
        objB.instance = objA;

        // Nullify external references
        objA = null;
        objB = null;

        // Trigger GC
        // Reference counting cannot reclaim circular references
        // But JVM uses reachability analysis and can correctly reclaim them
        System.gc();
    }
}
```

#### Reachability Analysis

```
        GC Roots
       /   |   \
      v    v    v
    ObjA  ObjB  ObjC
     |      |
     v      v
   ObjD   ObjE  <-- Reachable, not collected

   ObjF --> ObjG  <-- Unreachable, will be collected
```

**GC Roots include**:
- Objects referenced by the JVM stack
- Objects referenced by static properties in the method area
- Objects referenced by constants in the method area
- Objects referenced by JNI in the native method stack
- Objects held by synchronized locks

```java
// GC Roots example
public class GCRootsDemo {

    // Static variable as GC Root
    private static Object staticObj;

    // Constant as GC Root
    private static final Object CONSTANT_OBJ = new Object();

    public void method() {
        // Local variable as GC Root
        Object localObj = new Object();

        // Object referenced by localObj won't be collected during method execution
    }
}
```

### Reference Types

```java
import java.lang.ref.*;

public class ReferenceTypesDemo {

    public static void main(String[] args) {

        // 1. Strong Reference
        // Object won't be collected as long as strong reference exists
        Object strongRef = new Object();

        // 2. Soft Reference
        // Collected only when memory is insufficient, suitable for caching
        SoftReference<byte[]> softRef = new SoftReference<>(new byte[1024 * 1024]);
        System.out.println("Soft reference object: " + softRef.get());

        // 3. Weak Reference
        // Will definitely be collected on next GC
        WeakReference<Object> weakRef = new WeakReference<>(new Object());
        System.gc();
        System.out.println("Weak reference object: " + weakRef.get()); // May be null

        // 4. Phantom Reference
        // Cannot get object through phantom reference, used to track object collection status
        ReferenceQueue<Object> queue = new ReferenceQueue<>();
        PhantomReference<Object> phantomRef = new PhantomReference<>(new Object(), queue);
        System.out.println("Phantom reference object: " + phantomRef.get()); // Always null
    }
}
```

**Soft reference cache implementation**:

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
                // Object has been collected, clean up cache entry
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

### Garbage Collection Algorithms

#### Mark-Sweep Algorithm

```
Mark phase:
+---+---+---+---+---+---+---+---+
| A | B | C | D | E | F | G | H |
| * |   | * |   | * |   |   | * |  <-- Mark live objects
+---+---+---+---+---+---+---+---+

Sweep phase:
+---+---+---+---+---+---+---+---+
| A |   | C |   | E |   |   | H |  <-- Sweep unmarked objects
+---+---+---+---+---+---+---+---+
     ^       ^       ^   ^
     +-------+-------+---+
        Memory fragmentation
```

**Pros**: Simple to implement
**Cons**: Creates memory fragmentation, may trigger additional GC when allocating large objects

#### Copying Algorithm

```
Before copying (From space):
+---+---+---+---+---+---+---+---+
| A | B | C | D | E | F | G | H |
| * |   | * |   | * |   |   | * |
+---+---+---+---+---+---+---+---+

After copying (To space):
+---+---+---+---+---+---+---+---+
| A | C | E | H |   |   |   |   |  <-- Live objects arranged contiguously
+---+---+---+---+---+---+---+---+
```

**Pros**: No memory fragmentation, high allocation efficiency
**Cons**: Wastes half of memory space

#### Mark-Compact Algorithm

```
Mark phase:
+---+---+---+---+---+---+---+---+
| A | B | C | D | E | F | G | H |
| * |   | * |   | * |   |   | * |
+---+---+---+---+---+---+---+---+

Compact phase:
+---+---+---+---+---+---+---+---+
| A | C | E | H |   |   |   |   |  <-- Live objects moved to one end
+---+---+---+---+---+---+---+---+
```

**Pros**: No memory fragmentation, high memory utilization
**Cons**: Requires moving objects, less efficient

#### Generational Collection Algorithm

```java
// Generational collection strategy demonstration
public class GenerationalGCDemo {

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // Young generation uses copying algorithm
        // Because most objects are "short-lived", low survival rate

        // Old generation uses mark-sweep or mark-compact algorithm
        // Because survival rate is high, copying cost is high

        // Simulate object allocation and promotion
        byte[][] arrays = new byte[10][];
        for (int i = 0; i < 10; i++) {
            arrays[i] = new byte[_1MB];
            if (i % 3 == 0) {
                System.gc(); // Trigger Minor GC
            }
        }
    }
}
```

### Garbage Collectors Explained

#### Serial Collector

```bash
# Enable Serial collector
-XX:+UseSerialGC
```

```
Serial GC workflow:

User threads: --------+-------------------------+--------
                      |                         |
                      |     Stop The World      |
                      v                         v
GC thread:            +-------------------------+
                      |   Single-threaded GC    |
                      +-------------------------+
```

**Use case**: Single-core CPU, small memory applications

#### Parallel Collector

```bash
# Enable Parallel collector (JDK 8 default)
-XX:+UseParallelGC

# Set parallel GC thread count
-XX:ParallelGCThreads=4

# Set throughput target
-XX:GCTimeRatio=99

# Set maximum pause time target
-XX:MaxGCPauseMillis=100
```

```
Parallel GC workflow:

User threads: --------+-------------------------+--------
                      |                         |
                      |     Stop The World      |
                      v                         v
GC thread 1:          +-------------------------+
GC thread 2:          +-------------------------+
GC thread 3:          +-------------------------+
GC thread 4:          +-------------------------+
                      |   Multi-threaded GC     |
                      +-------------------------+
```

**Use case**: Multi-core CPU, high-throughput backend applications

#### CMS Collector (Concurrent Mark Sweep)

```bash
# Enable CMS collector (deprecated in JDK 9, removed in JDK 14)
-XX:+UseConcMarkSweepGC

# Set old generation occupancy threshold to trigger CMS
-XX:CMSInitiatingOccupancyFraction=70
```

```
CMS GC workflow:

User threads: --+----------------------------------+------
                |                                  |
  Initial Mark  |        Concurrent Mark           | Remark
    (STW)       |    (Concurrent with user threads)|  (STW)
                v                                  v
GC thread:      +--+                           +--+
                   +---------------------------+
                        Concurrent Sweep
```

**Four phases**:
1. **Initial Mark**: STW, marks objects directly associated with GC Roots
2. **Concurrent Mark**: Concurrent with user threads, traverses object graph
3. **Remark**: STW, fixes changes during concurrent marking
4. **Concurrent Sweep**: Concurrent with user threads, clears garbage objects

**Pros**: Low latency
**Cons**:
- CPU resource sensitive
- Cannot handle floating garbage
- Creates memory fragmentation

#### G1 Collector (Garbage First)

```bash
# Enable G1 collector (default in JDK 9+)
-XX:+UseG1GC

# Set heap region size (1MB-32MB, must be power of 2)
-XX:G1HeapRegionSize=4m

# Set maximum pause time target
-XX:MaxGCPauseMillis=200

# Set heap occupancy threshold to trigger concurrent marking cycle
-XX:InitiatingHeapOccupancyPercent=45
```

```
G1 heap memory layout:

+----+----+----+----+----+----+----+----+
| E  | S  | O  | E  |    | O  | H  | H  |
+----+----+----+----+----+----+----+----+
| O  | E  |    | S  | O  | E  | H  |    |
+----+----+----+----+----+----+----+----+
|    | O  | E  | O  | E  |    | O  | S  |
+----+----+----+----+----+----+----+----+

E = Eden    S = Survivor    O = Old    H = Humongous (large objects)
```

```java
// G1 GC tuning example
public class G1GCDemo {

    public static void main(String[] args) {
        // Runtime parameters:
        // -XX:+UseG1GC
        // -XX:MaxGCPauseMillis=100
        // -XX:G1HeapRegionSize=4m
        // -Xlog:gc*:file=gc.log:time,uptime,level,tags

        List<byte[]> list = new ArrayList<>();

        for (int i = 0; i < 1000; i++) {
            // Allocate objects of different sizes
            int size = (int) (Math.random() * 1024 * 1024);
            list.add(new byte[size]);

            // Randomly release some objects
            if (Math.random() > 0.7 && !list.isEmpty()) {
                list.remove((int) (Math.random() * list.size()));
            }
        }
    }
}
```

#### ZGC Collector

```bash
# Enable ZGC (production-ready in JDK 15+)
-XX:+UseZGC

# JDK 21+ Generational ZGC
-XX:+UseZGC -XX:+ZGenerational

# Set heap size
-Xmx16g -Xms16g
```

**ZGC features**:
- Pause time under 1ms
- Supports TB-level heap memory
- Pause time doesn't increase with heap size

```java
// ZGC use cases
public class ZGCDemo {

    // ZGC is suitable for:
    // 1. Large memory applications (tens of GB to TB level)
    // 2. Low latency requirements (P99 < 10ms)
    // 3. High concurrency applications

    public static void main(String[] args) {
        // Runtime parameters:
        // -XX:+UseZGC
        // -Xmx32g -Xms32g
        // -Xlog:gc*:file=zgc.log

        // ZGC uses colored pointers and read barriers for concurrency
        // Almost all GC work runs concurrently with application threads
    }
}
```

#### Shenandoah Collector

```bash
# Enable Shenandoah (OpenJDK specific)
-XX:+UseShenandoahGC

# Set pause time target
-XX:ShenandoahGCHeuristics=adaptive
```

### Collector Comparison

| Collector | Algorithm | Features | Use Case |
|-----------|-----------|----------|----------|
| Serial | Copying/Mark-Compact | Single-threaded, simple and efficient | Small client applications |
| Parallel | Copying/Mark-Compact | Multi-threaded, high throughput | Backend computation tasks |
| CMS | Mark-Sweep | Low latency, concurrent collection | Web applications (deprecated) |
| G1 | Mark-Compact | Predictable pause, regionalized | Large heap applications |
| ZGC | Mark-Compact | Ultra-low latency, TB-level heap | Huge heap, low latency requirements |
| Shenandoah | Mark-Compact | Low latency, concurrent compaction | Low latency requirements |

## JVM Performance Tuning

### Common JVM Parameters

```bash
# ================== Heap Memory Settings ==================
# Initial heap size
-Xms4g
# Maximum heap size
-Xmx4g
# Young generation size
-Xmn2g
# Eden to Survivor ratio
-XX:SurvivorRatio=8
# Old to Young generation ratio
-XX:NewRatio=2

# ================== Stack Settings ==================
# Thread stack size
-Xss256k

# ================== Metaspace Settings ==================
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# ================== GC Logging ==================
# JDK 9+
-Xlog:gc*:file=gc.log:time,uptime,level,tags
# JDK 8
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-Xloggc:gc.log

# ================== Heap Dump on OOM ==================
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/java/heapdump.hprof

# ================== Performance Optimization ==================
# Disable biased locking (high concurrency scenarios)
-XX:-UseBiasedLocking
# Large pages
-XX:+UseLargePages
# String deduplication (G1)
-XX:+UseStringDeduplication
```

### JVM Tuning in Practice

#### Memory Allocation Optimization

```java
// Avoid frequent creation of temporary objects
public class MemoryOptimization {

    // Anti-pattern: Creates new StringBuilder on each call
    public String badConcat(String[] items) {
        String result = "";
        for (String item : items) {
            result += item + ",";  // Creates new object on each concatenation
        }
        return result;
    }

    // Good pattern: Reuse StringBuilder
    public String goodConcat(String[] items) {
        StringBuilder sb = new StringBuilder();
        for (String item : items) {
            sb.append(item).append(",");
        }
        return sb.toString();
    }

    // Object pool pattern
    private static final ThreadLocal<SimpleDateFormat> DATE_FORMAT =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    public String formatDate(Date date) {
        return DATE_FORMAT.get().format(date);
    }
}
```

#### GC Tuning Examples

```bash
# Scenario 1: High throughput backend tasks
java -Xms8g -Xmx8g \
     -XX:+UseParallelGC \
     -XX:ParallelGCThreads=8 \
     -XX:GCTimeRatio=99 \
     -jar app.jar

# Scenario 2: Low latency web application
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=100 \
     -XX:G1HeapRegionSize=4m \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -jar app.jar

# Scenario 3: Ultra-large heap low latency application
java -Xms32g -Xmx32g \
     -XX:+UseZGC \
     -XX:+ZGenerational \
     -jar app.jar
```

#### Common Problem Troubleshooting

```java
// Memory leak troubleshooting example
public class MemoryLeakDemo {

    // Memory leak scenario 1: Static collection holding object references
    private static List<Object> cache = new ArrayList<>();

    public void addToCache(Object obj) {
        cache.add(obj);  // Object will never be released
    }

    // Solution: Use weak references or set capacity limits
    private static Map<String, SoftReference<Object>> softCache = new HashMap<>();

    // Memory leak scenario 2: Unclosed resources
    public void readFile(String path) throws IOException {
        FileInputStream fis = new FileInputStream(path);
        // If exception occurs, stream won't be closed
    }

    // Solution: Use try-with-resources
    public void readFileSafe(String path) throws IOException {
        try (FileInputStream fis = new FileInputStream(path)) {
            // Resource automatically closed
        }
    }
}
```

## Monitoring and Diagnostic Tools

### jps - View Java Processes

```bash
# List all Java processes
jps -l

# Show arguments passed to main method
jps -m

# Show JVM parameters
jps -v
```

### jstat - Statistics Monitoring

```bash
# View GC statistics
jstat -gc <pid> 1000 10

# View GC cause
jstat -gccause <pid>

# View class loading statistics
jstat -class <pid>

# Output example:
# S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC
# 1024.0  0.0   512.0  8192.0   4096.0   20480.0    10240.0   4864.0
```

### jmap - Memory Mapping

```bash
# View heap memory usage
jmap -heap <pid>

# Generate heap dump file
jmap -dump:format=b,file=heap.hprof <pid>

# View object histogram
jmap -histo <pid> | head -20

# Statistics of live objects only (triggers Full GC)
jmap -histo:live <pid>
```

### jstack - Thread Stack

```bash
# Print thread stack
jstack <pid>

# Detect deadlocks
jstack -l <pid>

# Force dump (when process is unresponsive)
jstack -F <pid>
```

```java
// Deadlock example
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

### jcmd - Diagnostic Commands

```bash
# View available commands
jcmd <pid> help

# View VM info
jcmd <pid> VM.info

# View system properties
jcmd <pid> VM.system_properties

# View JVM flags
jcmd <pid> VM.flags

# Generate heap dump
jcmd <pid> GC.heap_dump /tmp/heap.hprof

# Execute GC
jcmd <pid> GC.run

# JFR recording
jcmd <pid> JFR.start duration=60s filename=recording.jfr
```

### Visual Tools

#### JConsole

```bash
# Start JConsole
jconsole

# Remote connection configuration
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
```

#### VisualVM

```bash
# Start VisualVM
jvisualvm

# Features:
# - Monitor CPU, memory, threads
# - Heap dump analysis
# - Thread dump analysis
# - CPU and memory sampling
```

#### JMC (Java Mission Control)

```bash
# Start JMC
jmc

# Features:
# - Real-time monitoring
# - Flight Recorder (JFR)
# - Automatic analysis and recommendations
```

### GC Log Analysis

```bash
# JDK 17+ GC log configuration
-Xlog:gc*,gc+age=trace,safepoint:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10m
```

```java
// GC log parsing example
public class GCLogAnalysis {

    // Key GC log information:
    // [0.123s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause)
    // [0.130s][info][gc] GC(0) 24M->8M(256M) 7.123ms

    // Key metrics to watch:
    // 1. GC frequency
    // 2. GC pause time
    // 3. Heap memory changes
    // 4. GC type (Minor/Major/Full)
}
```

## Practical Cases

### Case 1: OOM Problem Troubleshooting

```java
// Simulate OOM
public class OOMDemo {

    public static void main(String[] args) {
        // Runtime parameters: -Xmx128m -XX:+HeapDumpOnOutOfMemoryError
        List<byte[]> list = new ArrayList<>();

        while (true) {
            list.add(new byte[1024 * 1024]); // Allocate 1MB each time
        }
    }
}
```

**Troubleshooting steps**:

```bash
# Analyze heap dump file
jmap -dump:format=b,file=heap.hprof <pid>

# Use MAT (Memory Analyzer Tool) to analyze
# - Find objects with largest memory usage
# - Analyze object reference chains
# - Find memory leak suspects

# Use jcmd to view object histogram
jcmd <pid> GC.class_histogram | head -30
```

### Case 2: High CPU Usage Troubleshooting

```bash
# Find high CPU threads
top -Hp <pid>

# Convert thread ID to hexadecimal
printf '%x\n' <tid>

# View thread stack
jstack <pid> | grep -A 30 <hex_tid>

# Analyze thread state and call stack
```

### Case 3: GC Tuning in Practice

```java
// E-commerce application GC tuning example
public class EcommerceGCTuning {

    // Problem: Frequent Full GC, response time jitter

    // Original configuration:
    // -Xms2g -Xmx2g -XX:+UseParallelGC

    // Analysis:
    // 1. jstat shows frequent Full GC (multiple times per minute)
    // 2. Old generation grows too fast
    // 3. Large number of objects promoted after Young GC

    // Tuned configuration:
    // -Xms4g -Xmx4g
    // -XX:+UseG1GC
    // -XX:MaxGCPauseMillis=100
    // -XX:G1HeapRegionSize=8m
    // -XX:InitiatingHeapOccupancyPercent=45
    // -XX:G1NewSizePercent=30
    // -XX:G1MaxNewSizePercent=40

    // Optimization results:
    // - Full GC count reduced by 90%
    // - Average response time decreased by 30%
    // - P99 latency dropped from 500ms to 150ms
}
```

## JVM Tuning Checklist

```markdown
### Pre-tuning Preparation
- [ ] Define performance goals (throughput/latency/memory usage)
- [ ] Collect baseline performance data
- [ ] Enable GC logging
- [ ] Configure automatic dump on OOM

### Memory Tuning
- [ ] Set heap size based on application characteristics
- [ ] Adjust young to old generation ratio
- [ ] Set appropriate Metaspace size
- [ ] Consider if thread stack size adjustment is needed

### GC Tuning
- [ ] Choose appropriate garbage collector
- [ ] Set GC pause time target
- [ ] Adjust GC-related parameters
- [ ] Monitor GC frequency and duration

### Monitoring and Verification
- [ ] Continuously monitor GC behavior
- [ ] Regularly analyze GC logs
- [ ] Load test to verify tuning effects
- [ ] Establish performance baseline
```

## JIT Just-In-Time Compilation

### Compiler Types

JVM uses a tiered compilation strategy, combining the advantages of interpreted and compiled execution:

```java
// JIT compilation tiers
public class JITCompilationDemo {

    // Tier 0: Interpreted execution
    // Tier 1: C1 simple compilation, no profiling
    // Tier 2: C1 compilation with basic profiling
    // Tier 3: C1 compilation with full profiling
    // Tier 4: C2 fully optimized compilation

    public static void main(String[] args) {
        // Hot code will be JIT compiled
        for (int i = 0; i < 100000; i++) {
            hotMethod();  // Frequently called method
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

### Common JIT Optimizations

```java
// 1. Method Inlining
public class InliningDemo {

    // Before compilation
    public int calculate(int a, int b) {
        return add(a, b);
    }

    private int add(int x, int y) {
        return x + y;
    }

    // After compilation (inlined)
    // public int calculate(int a, int b) {
    //     return a + b;  // Method call eliminated
    // }
}

// 2. Escape Analysis
public class EscapeAnalysisDemo {

    public void noEscape() {
        // Object doesn't escape, can be stack-allocated or scalar replaced
        Point p = new Point(1, 2);
        int sum = p.x + p.y;
    }

    public Point escape() {
        // Object escapes, must be heap-allocated
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

// 3. Lock Elimination
public class LockEliminationDemo {

    public void method() {
        // StringBuffer is thread-safe, uses synchronized internally
        // But sb here doesn't escape, locks can be eliminated
        StringBuffer sb = new StringBuffer();
        sb.append("Hello");
        sb.append("World");
    }
}
```

### JIT Related Parameters

```bash
# View JIT compilation information
-XX:+PrintCompilation

# Disable C2 compiler
-XX:TieredStopAtLevel=1

# Set compilation threshold
-XX:CompileThreshold=10000

# Print inlining information
-XX:+PrintInlining

# Set maximum bytecode size for inlined methods
-XX:MaxInlineSize=35
```

## Class Loading Mechanism In-Depth

### Class Loading Process

```
         Loading
              |
              v
    +--------------------+
    |       Linking      |
    | +--------------+  |
    | |   Verify     |  |
    | +--------------+  |
    | |   Prepare    |  |
    | +--------------+  |
    | |   Resolve    |  |
    | +--------------+  |
    +--------------------+
              |
              v
       Initialization
```

```java
// Class initialization example
public class ClassInitializationDemo {

    static {
        System.out.println("Static block executed");
    }

    private static int value = initValue();

    private static int initValue() {
        System.out.println("Static variable initialization");
        return 42;
    }

    public static void main(String[] args) {
        System.out.println("main method executed");
        System.out.println("value = " + value);
    }

    // Output order:
    // Static block executed
    // Static variable initialization
    // main method executed
    // value = 42
}
```

### Breaking Parent Delegation

```java
// SPI mechanism breaking parent delegation example
public class SPIDemo {

    public static void main(String[] args) {
        // JDBC driver loading uses thread context class loader
        // This breaks the parent delegation model

        // Core class DriverManager is loaded by bootstrap class loader
        // But it needs to load driver implementation classes loaded by application class loader
        // This is achieved through thread context class loader

        ClassLoader contextClassLoader = Thread.currentThread().getContextClassLoader();
        System.out.println("Thread context class loader: " + contextClassLoader);

        // ServiceLoader uses context class loader to load SPI implementations
        ServiceLoader<Driver> drivers = ServiceLoader.load(Driver.class);
        for (Driver driver : drivers) {
            System.out.println("Driver: " + driver.getClass().getName());
        }
    }
}
```

## Java Memory Model (JMM)

### Visibility Issues

```java
// Visibility problem example
public class VisibilityDemo {

    private static boolean flag = true;
    // Use volatile to ensure visibility
    // private static volatile boolean flag = true;

    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> {
            while (flag) {
                // Without volatile, may loop infinitely
                // Because thread may keep using locally cached flag value
            }
            System.out.println("Thread ended");
        });

        t.start();
        Thread.sleep(100);
        flag = false;
        System.out.println("main set flag = false");
    }
}
```

### happens-before Rules

```java
// happens-before relationship example
public class HappensBeforeDemo {

    private int x = 0;
    private volatile boolean ready = false;

    // Writer thread
    public void writer() {
        x = 42;           // 1
        ready = true;     // 2 (volatile write)
    }

    // Reader thread
    public void reader() {
        if (ready) {       // 3 (volatile read)
            int r = x;     // 4
            // According to happens-before rules:
            // 1 happens-before 2 (program order rule)
            // 2 happens-before 3 (volatile rule)
            // 3 happens-before 4 (program order rule)
            // Therefore 1 happens-before 4
            // So r must equal 42
        }
    }
}
```

## Performance Monitoring Best Practices

### Production Environment Configuration Template

```bash
#!/bin/bash
# Production environment JVM configuration template

JAVA_OPTS="
# Heap memory configuration
-Xms4g
-Xmx4g

# Metaspace configuration
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# G1 garbage collector
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=8m
-XX:InitiatingHeapOccupancyPercent=45

# GC logging (JDK 11+)
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=10,filesize=100m

# Automatic dump on memory overflow
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heapdump.hprof

# JMX remote monitoring
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.ssl=false
-Dcom.sun.management.jmxremote.authenticate=false

# Other optimizations
-XX:+UseStringDeduplication
-XX:+AlwaysPreTouch
"

java $JAVA_OPTS -jar application.jar
```

### Arthas Diagnostic Tool

```bash
# Install Arthas
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# Common commands
dashboard          # View real-time system data panel
thread             # View thread information
jvm                # View JVM information
memory             # View memory information
gc                 # View GC information

# Hot update
redefine /path/to/MyClass.class

# Method call monitoring
watch com.example.MyClass myMethod returnObj

# Method call chain tracing
trace com.example.MyClass myMethod

# Decompile class
jad com.example.MyClass
```

## Summary

JVM tuning is an ongoing process that requires deep understanding of application characteristics and JVM internals. Key points:

1. **Understand the memory model**: Master the roles and relationships of heap, stack, and method area
2. **Know GC algorithms**: Understand the principles and use cases of various GC algorithms
3. **Choose the right collector**: Select the most suitable GC collector based on application requirements
4. **Use monitoring tools**: Be proficient with diagnostic tools like jstat, jmap, jstack
5. **Data-driven tuning**: Make decisions based on data, avoid blind optimization

Remember: **Premature optimization is the root of all evil**. First make the program work correctly, then optimize based on actual problems.
