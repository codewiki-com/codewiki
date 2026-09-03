---
title: Java Garbage Collection Algorithms and Tuning
description: Comprehensive guide to Java GC algorithms, memory management, and performance tuning strategies
track: java
section: jvm-gc
difficulty: advanced
tags:
  - garbage collection
  - memory management
  - JVM
  - performance tuning
  - G1GC
  - ZGC
status: imported
origin: old/src/content/docs/java/garbage-collection.en.md
divergence: 0.158
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

Garbage collection is the cornerstone of Java's memory management, automatically freeing unused memory and preventing memory leaks. However, understanding GC behavior is critical for building high-performance applications. Poor GC configuration can lead to unpredictable latency spikes, reduced throughput, and application pauses that devastate real-time systems. This comprehensive guide explores GC algorithms, memory regions, tuning strategies, and best practices for optimizing Java applications.

---

## Concept Explanation

### What is Garbage Collection?

Garbage collection is an automatic memory management technique that identifies and recycles memory allocated to objects that are no longer reachable from the application's root set. Unlike languages such as C and C++ where developers manually allocate and deallocate memory, Java abstracts this complexity behind a GC subsystem that tracks object references and periodically reclaims unused heap memory.

### Memory Regions in the JVM Heap

The JVM heap is divided into multiple regions to optimize collection frequency and pause times:

**Young Generation (Heap < 5GB typically ~25%)**
- Stores newly created objects
- Collected frequently via Minor GC
- Typically uses copy collection algorithm
- Further subdivided into Eden space and Survivor spaces (S0, S1)

**Old Generation (Heap ~75%)**
- Contains long-lived objects promoted from Young Generation
- Collected less frequently via Major GC
- Uses mark-sweep or mark-compact algorithms
- Larger region with slower collection

**Metaspace (Unbounded, off-heap)**
- Stores class metadata, method bytecode, constant pools
- Automatic expansion; can trigger Full GC if exhausted

### GC Event Types

**Minor GC (Young Generation Collection)**
- Collects only Young Generation
- Typical pause: milliseconds
- Frequent occurrence (every few seconds)

**Major GC (Old Generation Collection)**
- Collects Old Generation primarily
- Typical pause: hundreds of milliseconds
- Less frequent

**Full GC (Complete Heap Collection)**
- Collects entire heap including Metaspace
- Typical pause: seconds
- Should be rare in well-tuned systems

---

## Core Principles

### Generational Hypothesis

The foundational principle behind modern GC is the **generational hypothesis**: most objects die young. Studies show approximately 80-90% of allocated objects become unreachable within microseconds of creation. This insight led to generational GC designs that:

- Collect Young Generation frequently (low cost, high yield)
- Collect Old Generation infrequently (high cost, lower yield)
- Reduce overall GC pause times and improve throughput

### Object Reachability

Objects are considered reachable if they can be accessed through a chain of references starting from GC roots:

```
GC Roots:
├─ Stack variables
├─ Static fields
├─ JNI references
└─ Objects in native memory

↓ (reachable references)

Live Objects ← → Garbage (unreachable objects)
```

Unreachable objects become candidates for collection.

### Stop-the-World (STW) Pauses

Most GC algorithms require halting application threads during collection phases to ensure consistency:

- **Advantages**: Simpler implementation, avoids concurrent modification issues
- **Disadvantages**: Predictable latency spikes, impact on user experience

Modern GC algorithms (G1GC, ZGC) minimize STW pauses through concurrent collection phases.

### Marking Phase

GC first identifies live objects through reachability analysis:

```
Initial Marking: Mark GC roots
      ↓
Concurrent Marking: Trace object graph (may run concurrently)
      ↓
Remark: Re-scan to catch changes
      ↓
Live Object Set: Objects to keep
```

### Collection Phase

After identifying garbage, the GC reclaims memory:

- **Copy Collection**: Copies live objects to new region (Young Generation)
- **Mark-Sweep**: Marks garbage, leaves holes (fragmentation)
- **Mark-Compact**: Marks garbage, compacts live objects (eliminates fragmentation)

### Memory Barriers

Concurrent GC algorithms use memory barriers (write barriers) to track cross-generational references between concurrent marking phases:

```
Write Barrier Pseudo-code:
if (oldObject.field = youngObject) {
    // Record this reference for GC consideration
    recordRememberedSet(oldObject, youngObject);
}
```

---

## Key Points

### GC Algorithm Comparison

| Algorithm | Type | Pause Time | Throughput | Fragmentation | GC Target |
|-----------|------|-----------|-----------|---------------|-----------|
| Serial GC | Generational Copy/Mark-Compact | High | High | Low | Single-threaded |
| Parallel GC | Generational Copy/Mark-Compact | Medium | Very High | Low | Multi-core servers |
| CMS GC | Generational Mark-Sweep | Low | Medium | High | Low-latency apps |
| G1GC | Generational Mark-Compact | Low | High | Very Low | Balanced workloads |
| ZGC | Concurrent Mark-Compact | Ultra-Low (<10ms) | High | Very Low | Ultra-low latency |
| Shenandoah | Concurrent Mark-Compact | Ultra-Low (<10ms) | High | Very Low | Ultra-low latency |

### Promotion and Aging

Objects move between generations through an aging process:

```
Young Gen (Eden)
    ↓ (survives GC)
Young Gen (Survivor 0)
    ↓ (survives GC)
Young Gen (Survivor 1)
    ↓ (survives GC multiple times)
Old Generation
    ↓ (survives Major GC)
Permanent Resident (rarely collected)
```

The object's age increments with each GC survival; promotion threshold is configurable.

### Heap Tuning Parameters

Critical JVM flags for GC tuning:

```
-Xms<size>              # Initial heap size
-Xmx<size>              # Maximum heap size
-XX:NewRatio=<n>        # Ratio of Old:Young (default ~2:1)
-XX:SurvivorRatio=<n>   # Ratio of Eden:Survivor (default ~8:1)
-XX:MaxTenuringThreshold=<n>  # Age before promotion to Old
-XX:+UseG1GC            # Enable G1GC
-XX:MaxGCPauseMillis=<n>      # G1GC target pause time
-XX:G1HeapRegionSize=<n>      # G1GC region size
```

### Memory Pressure and Fragmentation

- **Memory Pressure**: When heap utilization exceeds safe thresholds, GC frequency increases
- **Fragmentation**: Holes left after copying/sweeping reduce allocatable space
- **Compaction**: Rearranges objects to eliminate fragmentation but incurs cost

---

## Code Examples

### Example 1: GC Monitoring with JMX

Monitor GC behavior programmatically to track pause times and collection frequency:

```java
import com.sun.management.GarbageCollectionNotificationInfo;
import javax.management.Notification;
import javax.management.NotificationListener;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.util.List;

public class GCMonitor implements NotificationListener {

    private static class GCStats {
        long totalMinorGCs = 0;
        long totalMajorGCs = 0;
        long totalMinorPauseMs = 0;
        long totalMajorPauseMs = 0;

        public void reportStats() {
            System.out.println("=== GC Statistics ===");
            System.out.println("Minor GCs: " + totalMinorGCs);
            System.out.println("Major GCs: " + totalMajorGCs);
            System.out.println("Total Minor Pause: " + totalMinorPauseMs + "ms");
            System.out.println("Total Major Pause: " + totalMajorPauseMs + "ms");
            if (totalMinorGCs > 0) {
                System.out.println("Avg Minor Pause: " +
                    (totalMinorPauseMs / (double) totalMinorGCs) + "ms");
            }
            if (totalMajorGCs > 0) {
                System.out.println("Avg Major Pause: " +
                    (totalMajorPauseMs / (double) totalMajorGCs) + "ms");
            }
        }
    }

    private final GCStats stats = new GCStats();

    public static void main(String[] args) throws Exception {
        GCMonitor monitor = new GCMonitor();
        monitor.registerGCNotifications();

        // Trigger some GC activity
        generateGarbageLoad();

        Thread.sleep(2000);
        stats.reportStats();
    }

    private void registerGCNotifications() {
        List<GarbageCollectorMXBean> gcBeans =
            ManagementFactory.getGarbageCollectorMXBeans();

        for (GarbageCollectorMXBean gcBean : gcBeans) {
            if (gcBean instanceof com.sun.management.GarbageCollectorMXBean) {
                com.sun.management.GarbageCollectorMXBean sunGcBean =
                    (com.sun.management.GarbageCollectorMXBean) gcBean;
                sunGcBean.getNotificationEmitter()
                    .addNotificationListener(this, null, null);
            }
        }
    }

    @Override
    public void handleNotification(Notification notification, Object handback) {
        if (!notification.getType()
            .equals(GarbageCollectionNotificationInfo.GARBAGE_COLLECTION_NOTIFICATION)) {
            return;
        }

        GarbageCollectionNotificationInfo info =
            GarbageCollectionNotificationInfo.from((CompositeData)
                notification.getUserData());

        String gcName = info.getGcName();
        long pauseTime = info.getGcInfo().getDuration();

        System.out.println("GC Event: " + gcName + " | Pause: " + pauseTime + "ms");

        if (gcName.contains("Young")) {
            stats.totalMinorGCs++;
            stats.totalMinorPauseMs += pauseTime;
        } else if (gcName.contains("Old") || gcName.contains("Full")) {
            stats.totalMajorGCs++;
            stats.totalMajorPauseMs += pauseTime;
        }
    }

    private static void generateGarbageLoad() {
        for (int i = 0; i < 100000; i++) {
            byte[] temp = new byte[1024];
        }
    }
}
```

### Example 2: Memory Allocation Patterns and GC Impact

Demonstrates how allocation patterns affect GC behavior:

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class AllocationPatterns {

    // Bad: Creates long-lived objects in loop (promotes to Old Gen)
    public static void badPattern() {
        List<byte[]> list = new ArrayList<>();
        Random rand = new Random();

        for (int i = 0; i < 100000; i++) {
            byte[] data = new byte[1024];
            // Fills with some data
            for (int j = 0; j < data.length; j++) {
                data[j] = (byte) rand.nextInt();
            }
            list.add(data);  // ← Holds reference: moves to Old Gen
        }

        // Major GC triggered when Old Gen gets full
        // Massive pause time!
    }

    // Better: Use object pooling to reuse allocations
    public static void objectPoolPattern() {
        ObjectPool<byte[]> pool = new ObjectPool<>(() -> new byte[1024], 1000);
        Random rand = new Random();

        for (int i = 0; i < 100000; i++) {
            byte[] data = pool.acquire();
            try {
                for (int j = 0; j < data.length; j++) {
                    data[j] = (byte) rand.nextInt();
                }
                processData(data);
            } finally {
                pool.release(data);
            }
        }

        // Minimal GC pressure: objects stay in Young Gen
    }

    // Best: Short-lived objects (ideal for GC)
    public static void bestPattern() {
        Random rand = new Random();

        for (int i = 0; i < 100000; i++) {
            byte[] data = new byte[1024];
            for (int j = 0; j < data.length; j++) {
                data[j] = (byte) rand.nextInt();
            }
            processData(data);
            // data becomes unreachable, collected by next Minor GC
            // Never reaches Old Gen!
        }
    }

    private static void processData(byte[] data) {
        // Simulate processing
        int sum = 0;
        for (byte b : data) {
            sum += b;
        }
    }

    // Simple object pool implementation
    static class ObjectPool<T> {
        private final List<T> available;
        private final ObjectFactory<T> factory;

        interface ObjectFactory<T> {
            T create();
        }

        ObjectPool(ObjectFactory<T> factory, int initialSize) {
            this.factory = factory;
            this.available = new ArrayList<>();
            for (int i = 0; i < initialSize; i++) {
                available.add(factory.create());
            }
        }

        T acquire() {
            if (available.isEmpty()) {
                return factory.create();
            }
            return available.remove(available.size() - 1);
        }

        void release(T object) {
            available.add(object);
        }
    }
}
```

### Example 3: G1GC Configuration and Monitoring

Proper G1GC tuning for balanced latency and throughput:

```java
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryPoolMXBean;

public class G1GCTuning {

    /**
     * Recommended JVM flags for G1GC:
     *
     * -XX:+UseG1GC                          # Enable G1GC
     * -Xms16g -Xmx16g                       # Heap size
     * -XX:MaxGCPauseMillis=200              # Target max pause time (ms)
     * -XX:G1HeapRegionSize=16M              # Region size (16M typical)
     * -XX:InitiatingHeapOccupancyPercent=35 # Concurrent GC trigger
     * -XX:+ParallelRefProcEnabled           # Parallel reference processing
     * -XX:+UnlockDiagnosticVMOptions
     * -XX:G1SummarizeRSetStatsPeriod=1      # Debug stats
     * -Xlog:gc*:file=gc.log:time:level:tags # Detailed GC logging
     */

    public static void monitorHeapUsage() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

        System.out.println("=== Heap Memory ===");
        System.out.println("Heap Used: " +
            formatBytes(memoryBean.getHeapMemoryUsage().getUsed()));
        System.out.println("Heap Max: " +
            formatBytes(memoryBean.getHeapMemoryUsage().getMax()));
        System.out.println("Heap Committed: " +
            formatBytes(memoryBean.getHeapMemoryUsage().getCommitted()));

        System.out.println("\n=== Memory Pools ===");
        for (MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
            if (pool.getType().toString().equals("HEAP")) {
                System.out.println(pool.getName());
                System.out.println("  Used: " +
                    formatBytes(pool.getUsage().getUsed()));
                System.out.println("  Max: " +
                    formatBytes(pool.getUsage().getMax()));

                // Warning if usage exceeds 80%
                long max = pool.getUsage().getMax();
                long used = pool.getUsage().getUsed();
                if (used > max * 0.8) {
                    System.out.println("  WARNING: High memory usage (" +
                        (used * 100 / max) + "%)");
                }
            }
        }
    }

    /**
     * G1GC tuning strategy based on workload characteristics.
     */
    public static class G1TuningStrategy {

        // For low-latency applications (e.g., financial systems)
        public static String lowLatencyFlags() {
            return "-XX:+UseG1GC " +
                   "-XX:MaxGCPauseMillis=100 " +
                   "-XX:InitiatingHeapOccupancyPercent=30 " +
                   "-XX:+ParallelRefProcEnabled " +
                   "-XX:+AlwaysPreTouch";  // Pre-touch heap for predictability
        }

        // For high-throughput applications (e.g., batch processing)
        public static String highThroughputFlags() {
            return "-XX:+UseG1GC " +
                   "-XX:MaxGCPauseMillis=500 " +
                   "-XX:InitiatingHeapOccupancyPercent=40 " +
                   "-XX:G1NewCollectionPercentThreshold=25";
        }

        // For balanced workloads
        public static String balancedFlags() {
            return "-XX:+UseG1GC " +
                   "-XX:MaxGCPauseMillis=200 " +
                   "-XX:InitiatingHeapOccupancyPercent=35 " +
                   "-XX:+ParallelRefProcEnabled";
        }
    }

    private static String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        return String.format("%.2f %s", bytes / Math.pow(1024, digitGroups),
            units[digitGroups]);
    }
}
```

### Example 4: Metaspace and Class Loader Memory Monitoring

Monitor and prevent Metaspace exhaustion:

```java
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryPoolMXBean;

public class MetaspaceMonitoring {

    /**
     * Monitor Metaspace usage to prevent Full GC triggers.
     * Symptoms of Metaspace issues:
     * - Frequent Full GCs even with stable heap usage
     * - Class unloading errors
     * - "Metaspace out of memory" errors
     */
    public static void monitorMetaspace() {
        for (MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
            if ("Metaspace".equals(pool.getName()) ||
                "Compressed Class Space".equals(pool.getName())) {

                long used = pool.getUsage().getUsed();
                long max = pool.getUsage().getMax();

                System.out.println("=== " + pool.getName() + " ===");
                System.out.println("Used: " + formatBytes(used));
                System.out.println("Max: " +
                    (max == -1 ? "Unbounded" : formatBytes(max)));
                System.out.println("Peak: " +
                    formatBytes(pool.getPeakUsage().getUsed()));

                if (max != -1 && used > max * 0.9) {
                    System.out.println("WARNING: Metaspace near capacity!");
                }
            }
        }
    }

    /**
     * Metaspace tuning flags:
     *
     * -XX:MetaspaceSize=<size>           # Initial Metaspace size
     * -XX:MaxMetaspaceSize=<size>        # Maximum Metaspace size (no limit if absent)
     * -XX:CompressedClassSpaceSize=<size> # Compressed class pointer space
     *
     * Best practice: Set MaxMetaspaceSize to prevent runaway growth
     * and ensure predictable GC behavior.
     */

    public static void analyzeClassLoaders() {
        System.out.println("=== ClassLoader Hierarchy ===");

        Class<?> bootstrapClass = String.class;
        printClassLoaderChain(bootstrapClass);

        Class<?> appClass = MetaspaceMonitoring.class;
        printClassLoaderChain(appClass);
    }

    private static void printClassLoaderChain(Class<?> clazz) {
        System.out.println("\nClass: " + clazz.getName());
        ClassLoader cl = clazz.getClassLoader();
        int level = 0;

        while (cl != null) {
            System.out.println("  ".repeat(level) + "- " + cl.getClass().getName());
            cl = cl.getParent();
            level++;
        }
    }

    private static String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        return String.format("%.2f %s", bytes / Math.pow(1024, digitGroups),
            units[digitGroups]);
    }
}
```

---

## Best Practices

### Right-Size Your Heap

**Principle**: Choose heap size based on measured requirements, not arbitrary rules.

```
DO:
- Profile application memory usage under typical load
- Set -Xms = -Xmx (prevents dynamic resizing, improves predictability)
- Leave 25-30% heap free to avoid excessive GC pressure
- Monitor Old Gen utilization: target 50-70% steady-state

DON'T:
- Set heap to maximum available RAM
- Assume larger heap always means better performance
- Ignore memory profiling results
```

### Choose the Right GC Algorithm

**Selection Matrix**:

- **Latency-Critical** (< 100ms pause target): ZGC, Shenandoah, or low-pause G1GC
- **Throughput-Critical** (maximize operations/second): Parallel GC, high-pause G1GC
- **Balanced Workloads**: G1GC (default in modern Java)
- **Legacy Systems**: Serial GC (single-core), Parallel GC (multi-core)

### Minimize Object Allocation in Hot Paths

```java
// Bad: Allocates in tight loop
for (int i = 0; i < 1_000_000; i++) {
    String formatted = String.format("Value: %d", i);
    process(formatted);
}

// Good: Pre-allocate or reuse
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1_000_000; i++) {
    sb.setLength(0);
    sb.append("Value: ").append(i);
    process(sb.toString());
}

// Best: Avoid string conversion if possible
for (int i = 0; i < 1_000_000; i++) {
    processInt(i);
}
```

### Monitor and Alert on GC Metrics

Critical metrics to track:

```
- Young Generation collection frequency (target: < 1 per second)
- Young Generation pause time (target: < 50ms)
- Old Generation collection frequency (target: < 1 per minute)
- Old Generation pause time (target: < 500ms)
- Full GC frequency (target: 0, rare occurrences only)
- Heap utilization trend (should be stable, not monotonically increasing)
```

### Use Appropriate Logging Configuration

```bash
# Comprehensive GC logging (Java 9+)
java -Xlog:gc*:file=gc.log:time:level:tags \
     -Xlog:gc+heap=debug \
     -Xlog:gc+age=debug \
     -Xlog:safepoint \
     MyApplication
```

### Avoid Excessive GC Tuning

```
Diminishing returns principle:
- Profile first with default settings
- Only tune if metrics exceed acceptable thresholds
- Change one parameter at a time
- Measure impact on all metrics (latency, throughput, CPU)
```

### Consider Escape Analysis and Scalar Replacement

Modern JVMs optimize away heap allocations when possible:

```java
// May be stack-allocated or eliminated by JIT
public long calculateArea(Rectangle rect) {
    Point center = new Point(rect.width/2, rect.height/2);  // May not heap-allocate
    return center.x * center.y;
}

// Compilation flags:
// -XX:+DoEscapeAnalysis      (default: enabled)
// -XX:+EliminateAllocations  (default: enabled)
```

---

## Common Pitfalls

### Full GC Occurring Too Frequently

**Symptoms**: Sudden latency spikes, application responsiveness degradation

**Causes**:
- Heap too small relative to working set
- Memory leaks (object references never released)
- Old Generation promotion faster than collection
- Metaspace exhaustion triggers Full GC

**Solutions**:
```bash
# Increase heap size
-Xmx32g

# Increase Young Gen size to prevent premature promotion
-XX:NewRatio=2

# Adjust initial Metaspace size
-XX:MetaspaceSize=512m -XX:MaxMetaspaceSize=2g

# Profile for memory leaks
jmap -histo <pid>  # Heap histogram
jmap -dump:live,format=b,file=heap.bin <pid>  # Heap dump
```

### Heap Fragmentation in CMS GC

CMS uses mark-sweep without compaction, causing fragmentation:

```
Before CMS:  [Live][Garbage][Live][Garbage][Live][Garbage]
After CMS:   [Live].....[Live].....[Live]..... (fragmented)

Problem: Cannot allocate large contiguous blocks
Solution: Use G1GC or ZGC for automatic compaction
```

### Promotion Failure in Parallel GC

Survivor space too small, objects skip directly to Old Generation:

```bash
# Increase survivor space ratio
-XX:SurvivorRatio=4  # Smaller ratio = larger survivors (default 8)

# Better: Use G1GC which handles this automatically
-XX:+UseG1GC
```

### Tuning Traps

**Trap 1: Setting MaxGCPauseMillis too aggressively**
```bash
# BAD: Targets sub-millisecond pauses
-XX:MaxGCPauseMillis=1

# Result: G1GC collects more frequently, higher overhead
# GOOD: Target achievable pause time (50-200ms typical)
-XX:MaxGCPauseMillis=100
```

**Trap 2: Ignoring parallel GC threads**
```bash
# Default: ParallelGCThreads = (N * 8/5) where N = num cores
# For systems with many cores, may exhaust CPU bandwidth
# Explicit tuning:
-XX:ParallelGCThreads=16  # Limit for high-core systems
```

**Trap 3: Memory leak attribution to GC**
```java
// This is NOT a GC problem; it's a logic bug:
static List<String> cache = new ArrayList<>();  // Never cleared!

public void processData(String data) {
    cache.add(data);  // Grows unbounded
    // Heap pressure increases, frequent GCs result
    // But heap will never shrink; this is a memory leak
}

// Fix: Bounded cache with eviction policy
```

### Ignoring Non-Heap Memory

Metaspace, direct buffers, and native memory can exhaust system memory:

```java
// Direct ByteBuffers consume off-heap memory
ByteBuffer buffer = ByteBuffer.allocateDirect(1_000_000_000);  // 1GB off-heap

// Monitor with:
jps -l
jstat -gc -h10 <pid>  # Watch non-heap memory
jmap -clstats <pid>   # ClassLoader statistics
```

---

## Performance Considerations

### GC Pause Time vs. Throughput Trade-off

```
Low Pause Time Configuration:
- Small heap or low occupancy threshold
- Frequent collections
- Lower throughput (more collection overhead)
- Better user experience (responsive application)

┌──────────────────────────────────────┐
│ GC Pause Time (ms)                   │
│ 500 ├─────────────────────────────┐  │
│ 400 │ Trade-off Frontier          │  │
│ 300 │ ╱─────────────────┐         │  │
│ 200 ├───────────────────│─────┐   │  │
│ 100 │                   └─────│───┘  │
│   0 ├─────────────────────────┴───── │
│     0    50   100   150   200 (%)    │
│           Throughput (%)             │
└──────────────────────────────────────┘

High Throughput Configuration:
- Large heap
- Infrequent collections
- Higher pause times
- Better overall operations/second
```

### CPU Overhead of Garbage Collection

GC consumes CPU cycles that could execute application code:

```
CPU Usage Breakdown:
┌─────────────────────────────────────┐
│ 100% CPU Time                       │
├─────────────────────────────────────┤
│ Application Code:      70%          │
│ Concurrent Marking:    15%          │
│ Stop-the-World GC:     10%          │
│ JIT Compilation:        5%          │
└─────────────────────────────────────┘

Optimization: Use -XX:+ParallelRefProcEnabled to parallelize
reference processing, reducing STW pause time.
```

### Memory Pressure Impact

As heap utilization increases, GC behavior degrades:

```
Heap Utilization % |  GC Frequency | Pause Time | Risk
─────────────────────────────────────────────────────
    40%            |  Low          | Short      | Safe
    60%            |  Medium       | Medium     | Acceptable
    80%            |  High         | Long       | Warning
    95%            |  Very High    | Very Long  | Critical
```

### Humongous Object Allocation in G1GC

Objects > 50% of region size are allocated specially:

```java
// With default 16MB regions, objects > 8MB are humongous
byte[] huge = new byte[10_000_000];  // Allocated in humongous region

// Inefficient for GC (full compaction may be required)
// Solution: Use appropriate region size
// -XX:G1HeapRegionSize=32m  (for systems with frequent large allocations)
```

---

## Real-world Scenarios

### Scenario 1: E-commerce Search Service with GC Pauses Causing Timeouts

**Problem**: P99 latency spikes to 2 seconds; payment system timeouts during GC.

**Investigation**:
```bash
# Enable GC logging
java -Xlog:gc*:file=gc.log:time:level:tags MySearchService

# Analyze logs
# Found: Full GC every 30 seconds, lasting 1.5 seconds

# Heap analysis
jmap -histo <pid> | head -20
# Identified: Search result cache holding 2GB of old data
```

**Root Cause**: Memory leak in search result cache; unused results never evicted.

**Solution**:
```java
// Implement cache eviction policy
class SearchResultCache {
    private final Map<String, SearchResult> cache
        = new LinkedHashMap<String, SearchResult>(16, 0.75f, true) {
        protected boolean removeEldestEntry(Map.Entry eldest) {
            return size() > MAX_ENTRIES;  // Bounded LRU cache
        }
    };
}

// JVM tuning
java -XX:+UseG1GC \
     -Xms8g -Xmx8g \
     -XX:MaxGCPauseMillis=50 \
     MySearchService

# Result: P99 latency reduced from 2s to 60ms
```

### Scenario 2: Batch Processing Job with Throughput Degradation

**Problem**: Nightly batch job that processes 100 million records takes 3x longer with recent GC changes.

**Investigation**:
```bash
# Check default GC
java -XX:+PrintCommandLineFlags -version
# Shows: Using Parallel GC (default)

# Measure throughput
time java -XX:+UseParallelGC MyBatchJob

# Profile GC
java -XX:+UseParallelGC \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     MyBatchJob > gc.log
```

**Root Cause**: Automatic heap expansion during job increased GC frequency; system was not parallel-friendly.

**Solution**:
```bash
# Pre-size heap to avoid dynamic expansion
java -XX:+UseParallelGC \
     -Xms32g -Xmx32g \
     -XX:NewRatio=1 \
     -XX:+AlwaysPreTouch \
     MyBatchJob

# Result: Processing time reduced by 40%
```

### Scenario 3: Microservice with Unpredictable Latency

**Problem**: Response times erratic; occasional 5-second delays affecting user experience.

**Investigation**:
```bash
# Correlate latency with GC
java -XX:+UseG1GC \
     -XX:+PrintGCDateStamps \
     -XX:+PrintGCDetails \
     -Xlog:gc*:file=gc.log \
     MyMicroservice

# Comparison: timestamp of slow requests vs. GC logs
# Correlation: Every slow request aligned with Major GC
```

**Root Cause**: G1GC MaxGCPauseMillis too aggressive (50ms), causing frequent collections.

**Solution**:
```bash
java -XX:+UseG1GC \
     -Xms4g -Xmx4g \
     -XX:MaxGCPauseMillis=100 \
     -XX:InitiatingHeapOccupancyPercent=35 \
     -XX:+ParallelRefProcEnabled \
     MyMicroservice

# Result: P99 latency stabilized at 80ms, no major spikes
```

---

## Interview Points

### Explain the Generational Hypothesis and Its Impact on GC Design

**Expected Answer**: Most objects become unreachable shortly after creation. This insight motivates generational collection: Young Generation collected frequently (low cost, high yield), Old Generation rarely. Reduces overall pause time and improves throughput.

**Follow-up**: How does this affect application design?
- Minimize object promotion to Old Generation
- Use object pooling for frequently-allocated short-lived objects
- Avoid keeping references longer than necessary

### What Are Stop-the-World Pauses? How Do Modern GCs Minimize Them?

**Expected Answer**: STW pauses halt all application threads to ensure consistency during collection. Modern GCs minimize through:
- Concurrent marking (ZGC, Shenandoah, G1GC)
- Incremental collection (small regions in G1GC)
- Parallel collection (multiple threads)

**Example**: ZGC achieves < 10ms pause regardless of heap size through concurrent mark-compact and write barriers.

### Compare CMS, G1GC, and ZGC

| Aspect | CMS | G1GC | ZGC |
|--------|-----|------|-----|
| Pause Time | Low (50-200ms) | Low (20-200ms) | Ultra-low (<10ms) |
| Throughput | Medium | High | High |
| Fragmentation | Yes (mark-sweep) | No (mark-compact) | No (mark-compact) |
| Scalability | Up to 16GB | Up to 100GB+ | Up to TB+ |
| Maturity | Deprecated | Production-ready | Production-ready (Java 11+) |

### What Causes a Full GC? How Do You Prevent It?

**Causes**:
- Heap exhaustion (promotion too fast)
- Concurrent Mode Failure (CMS: concurrent thread can't keep pace)
- Metaspace exhaustion
- Explicit System.gc() calls
- Explicit heap compaction requests

**Prevention**:
```bash
# Right-size heap
-Xmx<appropriate-size>

# Prevent Metaspace issues
-XX:MaxMetaspaceSize=2g

# Use modern GC (G1/ZGC) that handles promotion better
-XX:+UseG1GC

# Disable explicit GC
-XX:+DisableExplicitGC

# Monitor and alert
if (fullGCCount > threshold) { alert(); }
```

### How Would You Diagnose and Fix an Out-of-Memory Error?

**Diagnosis**:
```bash
# Determine type
# a) Heap space: application allocated too much
# b) Metaspace: too many classes loaded
# c) Direct buffer: off-heap allocation exhausted

# Generate heap dump
jmap -dump:live,format=b,file=heap.bin <pid>

# Analyze with Eclipse MAT or similar
# Look for: largest objects, retained sets, leak sources

# Check GC logs for patterns
grep "Full GC" gc.log | wc -l
```

**Fixes**:
- Increase heap if underprovisioned
- Find and fix memory leak
- Use object pooling to reduce allocation rate
- Switch to ZGC for better memory efficiency
- Bound caches and data structures

### Explain Write Barriers in Concurrent GC

**Expected Answer**: Write barriers intercept heap writes to track cross-generational references during concurrent marking:

```java
// Pseudo-code: Write barrier
if (oldObject.field = youngObject) {
    // Barrier: record for GC consideration
    writeBarrier(oldObject);
}
```

**Cost**: 2-5% CPU overhead (unavoidable for concurrent marking correctness).

**Optimization**: -XX:+ParallelRefProcEnabled parallelizes reference processing, reducing barrier impact.

### When Would You Choose Serial GC Over Parallel GC?

**Scenarios**:
- Single-core systems (Serial is simpler, lower overhead)
- Very small heaps (< 128MB, parallelization overhead not worth it)
- Latency-critical but very constrained CPU (avoid parallelism overhead)

**Modern Answer**: Rarely. Parallel GC is default and almost always better. Exception: Containerized microservices with 1 vCPU might benefit from Serial GC.

---

## Further Reading

### Official Documentation
- [HotSpot Virtual Machine Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/17/gctuning/)
- [ZGC: A Scalable Low-Latency Garbage Collector](https://cr.openjdk.java.net/~pliden/zgc/)
- [Shenandoah Garbage Collector](https://wiki.openjdk.java.net/display/shenandoah)

### Research Papers
- "Generational Garbage Collection" - D. Ungar (foundational GC concept)
- "The Garbage Collection Handbook" - R. Jones, A. Hosking (comprehensive reference)
- "G1: The Garbage-First Garbage Collector" - D. Detlefs et al.

### Tools and Resources
- **GC Log Analysis**: GCPlot, Gceasy.io, JAnalyze
- **Profiling**: JProfiler, YourKit, async-profiler
- **Monitoring**: Prometheus + JMX exporter, New Relic, Datadog
- **Benchmarking**: JMH (Java Microbenchmark Harness)

### Recommended Books
1. "Java Performance: The Definitive Guide" - Scott Oaks
2. "Optimizing Java" - Benjamin J. Evans, James Gough
3. "The Garbage Collection Handbook" - Richard Jones

### Community Resources
- OpenJDK Hotspot mailing lists
- Reddit: r/java (GC discussions)
- GitHub: openjdk-jmc (Mission Control for GC monitoring)

---

## Summary

Garbage collection is a complex but essential aspect of Java performance. Modern GCs like G1, ZGC, and Shenandoah provide excellent balance between latency, throughput, and memory efficiency. Key takeaways:

1. **Profile first**: Measure actual GC behavior before tuning
2. **Right-size the heap**: Balance between memory usage and GC frequency
3. **Choose the right algorithm**: Match GC to workload characteristics
4. **Monitor continuously**: Track pause times, frequencies, and memory trends
5. **Minimize allocation**: Reduce object creation in hot paths
6. **Avoid pitfalls**: Be aware of common tuning mistakes and gotchas
7. **Leverage modern features**: Use concurrent GC algorithms for predictable latency

By understanding GC internals and applying these principles, you can build Java applications that deliver consistent, predictable performance across diverse workloads.
