---
title: Fork/Join 框架
description: 深入理解 Java Fork/Join 并行计算框架：ForkJoinPool、RecursiveTask、RecursiveAction 与工作窃取算法
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - Fork/Join
  - 并行计算
  - ForkJoinPool
  - 工作窃取
status: imported
origin: old/src/content/docs/java/fork-join.zh.md
divergence: 0.205
issues: []
legacy:
  category: Java
  subcategory: 并发编程
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释

Fork/Join 框架是 Java 7 引入的用于并行执行任务的框架，它是 `ExecutorService` 接口的一种实现，专门设计用于处理可以递归分解的任务。框架的核心思想是**分而治之**（Divide and Conquer）：将一个大任务拆分（Fork）成若干个小任务，分别执行后再将结果合并（Join）。

### 历史背景

Fork/Join 框架的设计灵感来源于 Cilk 语言（MIT 开发的并行计算语言）。Java 并发大师 Doug Lea 在 JSR 166 中提出了这个框架的设计，旨在充分利用多核处理器的计算能力。

### 解决什么问题

传统的线程池（如 `ThreadPoolExecutor`）适合处理大量独立的、阻塞式的任务，但对于可递归分解的计算密集型任务效率不高。Fork/Join 框架通过以下方式解决这些问题：

1. **任务分解**：自动将大任务分解为小任务并行执行
2. **工作窃取**：空闲线程可以"窃取"其他线程队列中的任务，提高 CPU 利用率
3. **递归友好**：天然支持递归任务的并行化

```java
// 传统方式：手动管理线程分配
ExecutorService executor = Executors.newFixedThreadPool(4);
// 需要手动分割任务、提交、等待、合并结果...

// Fork/Join 方式：框架自动处理
ForkJoinPool pool = new ForkJoinPool();
Long result = pool.invoke(new SumTask(array, 0, array.length));
// 框架自动进行任务分解、并行执行、结果合并
```

## 核心原理

### 工作窃取算法（Work-Stealing）

工作窃取是 Fork/Join 框架的核心机制。每个工作线程都维护一个双端队列（Deque），用于存储待执行的任务：

```
线程1的队列：[任务A] [任务B] [任务C] [任务D]  ← 从尾部取任务执行
                                           ↑
                                    其他线程从头部窃取
```

**工作窃取的工作流程**：

1. 每个线程从自己队列的**尾部**取任务执行（LIFO，后进先出）
2. 当线程的队列为空时，从其他线程队列的**头部**窃取任务（FIFO，先进先出）
3. LIFO 执行本地任务可以更好地利用缓存，FIFO 窃取可以获取较大的任务

```java
// 工作窃取的伪代码逻辑
while (running) {
    ForkJoinTask task = localQueue.pollFromTail();  // 从本地队列尾部取

    if (task == null) {
        task = stealFromOther();  // 从其他线程队列头部窃取
    }

    if (task != null) {
        task.exec();
    } else {
        await();  // 等待新任务
    }
}
```

### 任务分解与合并

Fork/Join 框架将任务组织成树状结构：

```
                    主任务 [0-1000000]
                         |
            +------------+------------+
            |                         |
      子任务 [0-500000]         子任务 [500000-1000000]
            |                         |
      +-----+-----+             +-----+-----+
      |           |             |           |
  [0-250000] [250000-500000] [500000-750000] [750000-1000000]
      |           |             |           |
    (计算)       (计算)        (计算)       (计算)
      |           |             |           |
      +-----+-----+             +-----+-----+
            |                         |
          合并                       合并
            |                         |
            +------------+------------+
                         |
                      最终结果
```

### ForkJoinPool 的内部结构

```java
public class ForkJoinPool extends AbstractExecutorService {
    // 工作线程数组
    volatile WorkQueue[] workQueues;

    // 并行度（通常等于 CPU 核心数）
    final int parallelism;

    // 工作线程工厂
    final ForkJoinWorkerThreadFactory factory;

    // 异常处理器
    final UncaughtExceptionHandler ueh;

    // 公共池（单例）
    static final ForkJoinPool common;
}
```

## 核心要点

### ForkJoinPool

`ForkJoinPool` 是执行 Fork/Join 任务的线程池：

```java
// 创建方式一：使用默认并行度（CPU 核心数）
ForkJoinPool pool = new ForkJoinPool();

// 创建方式二：指定并行度
ForkJoinPool pool = new ForkJoinPool(8);

// 创建方式三：完整参数
ForkJoinPool pool = new ForkJoinPool(
    Runtime.getRuntime().availableProcessors(), // 并行度
    ForkJoinPool.defaultForkJoinWorkerThreadFactory, // 线程工厂
    null,  // 异常处理器
    true   // 异步模式（FIFO），默认 false（LIFO）
);

// 使用公共池（推荐用于简单场景）
ForkJoinPool commonPool = ForkJoinPool.commonPool();
```

### RecursiveTask

`RecursiveTask<V>` 用于有返回值的任务：

```java
public class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 10000;
    private final long[] array;
    private final int start;
    private final int end;

    public SumTask(long[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        int length = end - start;

        // 任务足够小，直接计算
        if (length <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            return sum;
        }

        // 任务过大，分解为两个子任务
        int middle = start + length / 2;
        SumTask leftTask = new SumTask(array, start, middle);
        SumTask rightTask = new SumTask(array, middle, end);

        // fork：异步执行左边任务
        leftTask.fork();

        // 直接计算右边任务（避免创建过多任务）
        Long rightResult = rightTask.compute();

        // join：等待左边任务完成并获取结果
        Long leftResult = leftTask.join();

        // 合并结果
        return leftResult + rightResult;
    }
}
```

### RecursiveAction

`RecursiveAction` 用于无返回值的任务：

```java
public class SortTask extends RecursiveAction {
    private static final int THRESHOLD = 10000;
    private final int[] array;
    private final int start;
    private final int end;

    public SortTask(int[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end = end;
    }

    @Override
    protected void compute() {
        int length = end - start;

        if (length <= THRESHOLD) {
            // 直接排序小数组
            Arrays.sort(array, start, end);
            return;
        }

        // 分解任务
        int middle = start + length / 2;
        SortTask leftTask = new SortTask(array, start, middle);
        SortTask rightTask = new SortTask(array, middle, end);

        // 并行执行两个子任务
        invokeAll(leftTask, rightTask);

        // 合并已排序的两部分
        merge(array, start, middle, end);
    }

    private void merge(int[] array, int start, int middle, int end) {
        int[] temp = new int[end - start];
        int i = start, j = middle, k = 0;

        while (i < middle && j < end) {
            temp[k++] = array[i] < array[j] ? array[i++] : array[j++];
        }
        while (i < middle) temp[k++] = array[i++];
        while (j < end) temp[k++] = array[j++];

        System.arraycopy(temp, 0, array, start, temp.length);
    }
}
```

### 任务提交方式

```java
ForkJoinPool pool = new ForkJoinPool();

// 方式一：invoke - 同步执行，阻塞等待结果
Long result = pool.invoke(new SumTask(array, 0, array.length));

// 方式二：submit - 异步提交，返回 ForkJoinTask
ForkJoinTask<Long> task = pool.submit(new SumTask(array, 0, array.length));
Long result = task.get();  // 阻塞等待
// 或者
Long result = task.join(); // 不抛受检异常

// 方式三：execute - 异步执行，无返回值
pool.execute(new SortTask(array, 0, array.length));

// 方式四：在任务内部使用 fork/join
leftTask.fork();   // 异步执行
rightResult = rightTask.compute();  // 同步执行
leftResult = leftTask.join();  // 等待 fork 的任务完成
```

## 代码示例

### 示例一：并行数组求和

```java
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveTask;
import java.util.stream.LongStream;

public class ParallelSumExample {

    public static void main(String[] args) {
        // 创建一个大数组
        long[] numbers = LongStream.rangeClosed(1, 10_000_000).toArray();

        // 使用 Fork/Join 计算
        ForkJoinPool pool = new ForkJoinPool();
        long start = System.currentTimeMillis();

        Long sum = pool.invoke(new SumTask(numbers, 0, numbers.length));

        long end = System.currentTimeMillis();
        System.out.println("Fork/Join 求和结果: " + sum);
        System.out.println("耗时: " + (end - start) + "ms");

        // 验证结果
        long expected = (1L + 10_000_000L) * 10_000_000L / 2;
        System.out.println("验证: " + (sum == expected ? "正确" : "错误"));

        pool.shutdown();
    }
}

class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 100_000;
    private final long[] array;
    private final int start;
    private final int end;

    public SumTask(long[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        int length = end - start;

        if (length <= THRESHOLD) {
            return computeDirectly();
        }

        int middle = start + length / 2;
        SumTask leftTask = new SumTask(array, start, middle);
        SumTask rightTask = new SumTask(array, middle, end);

        leftTask.fork();
        Long rightResult = rightTask.compute();
        Long leftResult = leftTask.join();

        return leftResult + rightResult;
    }

    private Long computeDirectly() {
        long sum = 0;
        for (int i = start; i < end; i++) {
            sum += array[i];
        }
        return sum;
    }
}
```

### 示例二：并行快速排序

```java
import java.util.Arrays;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveAction;
import java.util.Random;

public class ParallelQuickSortExample {

    public static void main(String[] args) {
        int[] array = new Random().ints(1_000_000, 0, 1_000_000).toArray();
        int[] arrayCopy = Arrays.copyOf(array, array.length);

        // Fork/Join 并行排序
        ForkJoinPool pool = new ForkJoinPool();
        long start = System.currentTimeMillis();
        pool.invoke(new QuickSortTask(array, 0, array.length - 1));
        long forkJoinTime = System.currentTimeMillis() - start;

        // 标准排序对比
        start = System.currentTimeMillis();
        Arrays.sort(arrayCopy);
        long standardTime = System.currentTimeMillis() - start;

        System.out.println("Fork/Join 排序耗时: " + forkJoinTime + "ms");
        System.out.println("Arrays.sort 耗时: " + standardTime + "ms");
        System.out.println("结果验证: " + Arrays.equals(array, arrayCopy));

        pool.shutdown();
    }
}

class QuickSortTask extends RecursiveAction {
    private static final int THRESHOLD = 10000;
    private final int[] array;
    private final int left;
    private final int right;

    public QuickSortTask(int[] array, int left, int right) {
        this.array = array;
        this.left = left;
        this.right = right;
    }

    @Override
    protected void compute() {
        if (right - left < THRESHOLD) {
            Arrays.sort(array, left, right + 1);
            return;
        }

        int pivotIndex = partition(array, left, right);

        QuickSortTask leftTask = new QuickSortTask(array, left, pivotIndex - 1);
        QuickSortTask rightTask = new QuickSortTask(array, pivotIndex + 1, right);

        invokeAll(leftTask, rightTask);
    }

    private int partition(int[] arr, int left, int right) {
        int pivot = arr[right];
        int i = left - 1;

        for (int j = left; j < right; j++) {
            if (arr[j] <= pivot) {
                i++;
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, right);
        return i + 1;
    }

    private void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}
```

### 示例三：并行文档搜索

```java
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveTask;

public class ParallelFileSearchExample {

    public static void main(String[] args) {
        File rootDir = new File("/path/to/search");
        String keyword = "TODO";

        ForkJoinPool pool = new ForkJoinPool();
        List<String> results = pool.invoke(new FileSearchTask(rootDir, keyword));

        System.out.println("找到 " + results.size() + " 个包含 '" + keyword + "' 的文件:");
        results.forEach(System.out::println);

        pool.shutdown();
    }
}

class FileSearchTask extends RecursiveTask<List<String>> {
    private final File directory;
    private final String keyword;

    public FileSearchTask(File directory, String keyword) {
        this.directory = directory;
        this.keyword = keyword;
    }

    @Override
    protected List<String> compute() {
        List<String> results = new ArrayList<>();
        List<FileSearchTask> subTasks = new ArrayList<>();

        File[] files = directory.listFiles();
        if (files == null) return results;

        for (File file : files) {
            if (file.isDirectory()) {
                // 为子目录创建新任务
                FileSearchTask task = new FileSearchTask(file, keyword);
                task.fork();
                subTasks.add(task);
            } else if (file.getName().endsWith(".java")) {
                // 搜索 Java 文件
                if (containsKeyword(file, keyword)) {
                    results.add(file.getAbsolutePath());
                }
            }
        }

        // 收集所有子任务的结果
        for (FileSearchTask task : subTasks) {
            results.addAll(task.join());
        }

        return results;
    }

    private boolean containsKeyword(File file, String keyword) {
        try {
            String content = new String(java.nio.file.Files.readAllBytes(file.toPath()));
            return content.contains(keyword);
        } catch (Exception e) {
            return false;
        }
    }
}
```

### 示例四：并行矩阵乘法

```java
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveAction;

public class ParallelMatrixMultiplication {

    public static void main(String[] args) {
        int size = 1024;
        double[][] A = randomMatrix(size, size);
        double[][] B = randomMatrix(size, size);
        double[][] C = new double[size][size];

        ForkJoinPool pool = new ForkJoinPool();
        long start = System.currentTimeMillis();

        pool.invoke(new MatrixMultiplyTask(A, B, C, 0, 0, 0, 0, 0, 0, size));

        long end = System.currentTimeMillis();
        System.out.println("并行矩阵乘法完成，耗时: " + (end - start) + "ms");

        pool.shutdown();
    }

    private static double[][] randomMatrix(int rows, int cols) {
        double[][] matrix = new double[rows][cols];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                matrix[i][j] = Math.random();
            }
        }
        return matrix;
    }
}

class MatrixMultiplyTask extends RecursiveAction {
    private static final int THRESHOLD = 64;
    private final double[][] A, B, C;
    private final int aRow, aCol, bRow, bCol, cRow, cCol, size;

    public MatrixMultiplyTask(double[][] A, double[][] B, double[][] C,
                              int aRow, int aCol, int bRow, int bCol,
                              int cRow, int cCol, int size) {
        this.A = A;
        this.B = B;
        this.C = C;
        this.aRow = aRow;
        this.aCol = aCol;
        this.bRow = bRow;
        this.bCol = bCol;
        this.cRow = cRow;
        this.cCol = cCol;
        this.size = size;
    }

    @Override
    protected void compute() {
        if (size <= THRESHOLD) {
            computeDirectly();
            return;
        }

        int half = size / 2;

        invokeAll(
            // C11 = A11*B11 + A12*B21
            new MatrixMultiplyTask(A, B, C, aRow, aCol, bRow, bCol, cRow, cCol, half),
            new MatrixMultiplyTask(A, B, C, aRow, aCol + half, bRow + half, bCol, cRow, cCol, half),
            // C12 = A11*B12 + A12*B22
            new MatrixMultiplyTask(A, B, C, aRow, aCol, bRow, bCol + half, cRow, cCol + half, half),
            new MatrixMultiplyTask(A, B, C, aRow, aCol + half, bRow + half, bCol + half, cRow, cCol + half, half),
            // C21 = A21*B11 + A22*B21
            new MatrixMultiplyTask(A, B, C, aRow + half, aCol, bRow, bCol, cRow + half, cCol, half),
            new MatrixMultiplyTask(A, B, C, aRow + half, aCol + half, bRow + half, bCol, cRow + half, cCol, half),
            // C22 = A21*B12 + A22*B22
            new MatrixMultiplyTask(A, B, C, aRow + half, aCol, bRow, bCol + half, cRow + half, cCol + half, half),
            new MatrixMultiplyTask(A, B, C, aRow + half, aCol + half, bRow + half, bCol + half, cRow + half, cCol + half, half)
        );
    }

    private void computeDirectly() {
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                double sum = 0;
                for (int k = 0; k < size; k++) {
                    sum += A[aRow + i][aCol + k] * B[bRow + k][bCol + j];
                }
                synchronized (C) {
                    C[cRow + i][cCol + j] += sum;
                }
            }
        }
    }
}
```

### 示例五：使用 CountedCompleter

`CountedCompleter` 是 Java 8 引入的更灵活的任务类型，适用于需要在所有子任务完成后执行某些操作的场景：

```java
import java.util.concurrent.CountedCompleter;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.atomic.AtomicLong;

public class CountedCompleterExample {

    public static void main(String[] args) {
        long[] array = java.util.stream.LongStream.rangeClosed(1, 1_000_000).toArray();
        AtomicLong result = new AtomicLong(0);

        ForkJoinPool pool = new ForkJoinPool();
        pool.invoke(new SumCountedCompleter(null, array, 0, array.length, result));

        System.out.println("求和结果: " + result.get());
        pool.shutdown();
    }
}

class SumCountedCompleter extends CountedCompleter<Void> {
    private static final int THRESHOLD = 100_000;
    private final long[] array;
    private final int start, end;
    private final AtomicLong result;

    public SumCountedCompleter(CountedCompleter<?> parent, long[] array,
                               int start, int end, AtomicLong result) {
        super(parent);
        this.array = array;
        this.start = start;
        this.end = end;
        this.result = result;
    }

    @Override
    public void compute() {
        int length = end - start;

        if (length <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            result.addAndGet(sum);
            tryComplete();
            return;
        }

        int middle = start + length / 2;

        // 增加待完成任务计数
        addToPendingCount(1);

        // 创建并执行子任务
        new SumCountedCompleter(this, array, start, middle, result).fork();
        new SumCountedCompleter(this, array, middle, end, result).compute();
    }

    @Override
    public void onCompletion(CountedCompleter<?> caller) {
        // 所有子任务完成后的回调
        if (getParent() == null) {
            System.out.println("所有任务完成");
        }
    }
}
```

## 最佳实践

### 选择合适的阈值

阈值过大会导致并行度不够，阈值过小会产生过多任务开销：

```java
public class ThresholdExample {

    // 经验法则：阈值 = 总任务数 / (并行度 * 4)
    public static int calculateThreshold(int totalSize, int parallelism) {
        return Math.max(1, totalSize / (parallelism * 4));
    }

    // 动态调整阈值
    public static int adaptiveThreshold(int totalSize) {
        int processors = Runtime.getRuntime().availableProcessors();
        int minThreshold = 1000;
        int maxThreshold = 100000;

        int calculated = totalSize / (processors * 4);
        return Math.max(minThreshold, Math.min(maxThreshold, calculated));
    }
}
```

### 正确使用 fork 和 compute

```java
// 推荐：一个 fork，一个 compute
@Override
protected Long compute() {
    if (size <= THRESHOLD) {
        return computeDirectly();
    }

    SubTask left = new SubTask(/* 左半部分 */);
    SubTask right = new SubTask(/* 右半部分 */);

    left.fork();           // 异步执行左边
    Long rightResult = right.compute();  // 同步执行右边（当前线程）
    Long leftResult = left.join();       // 等待左边完成

    return leftResult + rightResult;
}

// 或者使用 invokeAll（两个任务都 fork）
@Override
protected void compute() {
    if (size <= THRESHOLD) {
        computeDirectly();
        return;
    }

    SubTask left = new SubTask(/* 左半部分 */);
    SubTask right = new SubTask(/* 右半部分 */);

    invokeAll(left, right);  // 两个都 fork，然后等待两个都完成
}
```

### 避免在任务中阻塞

```java
// 错误：在 Fork/Join 任务中进行阻塞 I/O
class BadTask extends RecursiveTask<String> {
    @Override
    protected String compute() {
        // 不要这样做！会阻塞工作线程
        return httpClient.get("http://example.com");
    }
}

// 正确：Fork/Join 适用于计算密集型任务
class GoodTask extends RecursiveTask<Long> {
    @Override
    protected Long compute() {
        // CPU 计算任务
        return Arrays.stream(array).sum();
    }
}

// 如果必须执行阻塞操作，使用 ManagedBlocker
class BlockingTask extends RecursiveTask<String> {
    @Override
    protected String compute() {
        final String[] result = new String[1];

        try {
            ForkJoinPool.managedBlock(new ForkJoinPool.ManagedBlocker() {
                private boolean done = false;

                @Override
                public boolean block() throws InterruptedException {
                    result[0] = doBlockingOperation();
                    done = true;
                    return true;
                }

                @Override
                public boolean isReleasable() {
                    return done;
                }
            });
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return result[0];
    }
}
```

### 使用公共池处理简单场景

```java
// 简单场景：使用公共池
Long result = ForkJoinPool.commonPool().invoke(new SumTask(array, 0, array.length));

// 或者使用 ForkJoinTask 的静态方法
Long result = ForkJoinTask.invoke(new SumTask(array, 0, array.length));

// 复杂场景：创建专用池
ForkJoinPool dedicatedPool = new ForkJoinPool(
    8,  // 指定并行度
    ForkJoinPool.defaultForkJoinWorkerThreadFactory,
    (t, e) -> System.err.println("任务异常: " + e),  // 异常处理
    false
);
```

### 监控和调试

```java
public class ForkJoinMonitor {

    public static void printPoolStats(ForkJoinPool pool) {
        System.out.println("=== ForkJoinPool 状态 ===");
        System.out.println("并行度: " + pool.getParallelism());
        System.out.println("池大小: " + pool.getPoolSize());
        System.out.println("活跃线程: " + pool.getActiveThreadCount());
        System.out.println("运行线程: " + pool.getRunningThreadCount());
        System.out.println("队列任务: " + pool.getQueuedTaskCount());
        System.out.println("窃取次数: " + pool.getStealCount());
    }

    public static void main(String[] args) {
        ForkJoinPool pool = new ForkJoinPool();

        // 定期打印状态
        Thread monitor = new Thread(() -> {
            while (!pool.isTerminated()) {
                printPoolStats(pool);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    break;
                }
            }
        });
        monitor.setDaemon(true);
        monitor.start();

        // 执行任务
        pool.invoke(new SumTask(new long[1_000_000], 0, 1_000_000));
        pool.shutdown();
    }
}
```

## 常见陷阱

### 陷阱一：错误的 fork/join 顺序

```java
// 错误：先 join 再 fork，导致顺序执行
@Override
protected Long compute() {
    SubTask left = new SubTask(/*...*/);
    SubTask right = new SubTask(/*...*/);

    Long leftResult = left.fork().join();  // 等待左边完成
    Long rightResult = right.fork().join(); // 然后才开始右边

    return leftResult + rightResult;
}

// 正确：先 fork 所有任务，再 join
@Override
protected Long compute() {
    SubTask left = new SubTask(/*...*/);
    SubTask right = new SubTask(/*...*/);

    left.fork();   // 先 fork
    right.fork();  // 先 fork

    return left.join() + right.join();  // 然后 join
}

// 更好：一个 fork，一个 compute
@Override
protected Long compute() {
    SubTask left = new SubTask(/*...*/);
    SubTask right = new SubTask(/*...*/);

    left.fork();
    Long rightResult = right.compute();  // 当前线程直接计算
    Long leftResult = left.join();

    return leftResult + rightResult;
}
```

### 陷阱二：任务粒度过细

```java
// 错误：阈值太小，产生大量任务开销
class TooFineGrainedTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 1;  // 太小！

    @Override
    protected Long compute() {
        if (size <= THRESHOLD) {
            return array[start];
        }
        // 每个元素都创建任务，开销巨大
        // ...
    }
}

// 正确：选择合适的阈值
class ProperlyGrainedTask extends RecursiveTask<Long> {
    // 根据数据规模和 CPU 核心数调整
    private static final int THRESHOLD = 10000;

    @Override
    protected Long compute() {
        if (size <= THRESHOLD) {
            return computeDirectly();
        }
        // ...
    }
}
```

### 陷阱三：共享可变状态

```java
// 错误：多个任务共享可变状态
class UnsafeTask extends RecursiveAction {
    private List<Integer> results = new ArrayList<>();  // 共享，非线程安全

    @Override
    protected void compute() {
        // 多个线程同时修改 results，导致数据丢失或损坏
        results.add(computeValue());
    }
}

// 正确：每个任务返回自己的结果，最后合并
class SafeTask extends RecursiveTask<List<Integer>> {
    @Override
    protected List<Integer> compute() {
        if (size <= THRESHOLD) {
            List<Integer> localResult = new ArrayList<>();
            localResult.add(computeValue());
            return localResult;
        }

        SubTask left = new SubTask(/*...*/);
        SubTask right = new SubTask(/*...*/);

        left.fork();
        List<Integer> rightResult = right.compute();
        List<Integer> leftResult = left.join();

        // 合并结果
        List<Integer> merged = new ArrayList<>(leftResult);
        merged.addAll(rightResult);
        return merged;
    }
}
```

### 陷阱四：忽略异常处理

```java
// 错误：异常被吞掉
@Override
protected Long compute() {
    try {
        // 可能抛出异常
        return riskyOperation();
    } catch (Exception e) {
        return 0L;  // 静默失败，难以调试
    }
}

// 正确：使用 completeExceptionally 传播异常
@Override
protected Long compute() {
    try {
        return riskyOperation();
    } catch (Exception e) {
        completeExceptionally(e);
        return null;
    }
}

// 或者让异常自然传播，在调用处处理
Long result;
try {
    result = pool.invoke(task);
} catch (Exception e) {
    System.err.println("任务执行失败: " + e.getCause());
}
```

### 陷阱五：在非 ForkJoinPool 中调用 fork

```java
// 错误：在普通线程中调用 fork
public static void main(String[] args) {
    SubTask task = new SubTask(/*...*/);
    task.fork();  // 错误！主线程不是 ForkJoinWorkerThread
    task.join();
}

// 正确：通过 ForkJoinPool 执行
public static void main(String[] args) {
    ForkJoinPool pool = new ForkJoinPool();
    Long result = pool.invoke(new SubTask(/*...*/));
}
```

## 性能考量

### Fork/Join vs 传统线程池

| 特性 | Fork/Join | ThreadPoolExecutor |
|------|-----------|-------------------|
| 适用场景 | 可分解的计算密集型任务 | 独立的 I/O 密集型任务 |
| 任务调度 | 工作窃取 | 共享队列 |
| 任务类型 | 递归可分解 | 相互独立 |
| 负载均衡 | 自动（通过工作窃取） | 需要手动设计 |
| 线程数 | 通常等于 CPU 核心数 | 根据任务类型调整 |

### 性能基准测试

```java
import java.util.concurrent.*;
import java.util.stream.LongStream;

public class PerformanceBenchmark {

    private static final int ARRAY_SIZE = 100_000_000;
    private static final int ITERATIONS = 10;

    public static void main(String[] args) {
        long[] array = LongStream.rangeClosed(1, ARRAY_SIZE).toArray();

        // 预热
        warmUp(array);

        // 测试各种方式
        System.out.println("=== 性能对比 ===");

        long serialTime = benchmarkSerial(array);
        System.out.printf("串行执行: %d ms%n", serialTime);

        long forkJoinTime = benchmarkForkJoin(array);
        System.out.printf("Fork/Join: %d ms (加速比: %.2fx)%n",
            forkJoinTime, (double) serialTime / forkJoinTime);

        long streamTime = benchmarkParallelStream(array);
        System.out.printf("并行流: %d ms (加速比: %.2fx)%n",
            streamTime, (double) serialTime / streamTime);
    }

    private static void warmUp(long[] array) {
        for (int i = 0; i < 5; i++) {
            ForkJoinPool.commonPool().invoke(new SumTask(array, 0, array.length));
        }
    }

    private static long benchmarkSerial(long[] array) {
        long total = 0;
        for (int i = 0; i < ITERATIONS; i++) {
            long start = System.currentTimeMillis();
            long sum = 0;
            for (long value : array) {
                sum += value;
            }
            total += System.currentTimeMillis() - start;
        }
        return total / ITERATIONS;
    }

    private static long benchmarkForkJoin(long[] array) {
        ForkJoinPool pool = new ForkJoinPool();
        long total = 0;
        for (int i = 0; i < ITERATIONS; i++) {
            long start = System.currentTimeMillis();
            pool.invoke(new SumTask(array, 0, array.length));
            total += System.currentTimeMillis() - start;
        }
        pool.shutdown();
        return total / ITERATIONS;
    }

    private static long benchmarkParallelStream(long[] array) {
        long total = 0;
        for (int i = 0; i < ITERATIONS; i++) {
            long start = System.currentTimeMillis();
            LongStream.of(array).parallel().sum();
            total += System.currentTimeMillis() - start;
        }
        return total / ITERATIONS;
    }
}
```

### 优化建议

```java
public class OptimizationTips {

    // 1. 避免不必要的对象创建
    class OptimizedTask extends RecursiveTask<Long> {
        // 重用数组，避免每次分解都创建新数组
        private final long[] array;
        private final int start, end;

        // 不要这样：每次都创建新数组
        // long[] subArray = Arrays.copyOfRange(array, start, middle);
    }

    // 2. 考虑缓存局部性
    class CacheOptimizedTask extends RecursiveTask<Long> {
        @Override
        protected Long compute() {
            // 顺序访问数组元素，利用 CPU 缓存
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];  // 连续内存访问
            }
            return sum;
        }
    }

    // 3. 使用更高效的合并策略
    class EfficientMergeTask extends RecursiveTask<long[]> {
        @Override
        protected long[] compute() {
            // 对于大数组，使用 System.arraycopy 而不是循环
            System.arraycopy(src, srcPos, dest, destPos, length);
            return dest;
        }
    }
}
```

### 并行度调优

```java
public class ParallelismTuning {

    public static void main(String[] args) {
        int processors = Runtime.getRuntime().availableProcessors();

        // CPU 密集型：并行度 = CPU 核心数
        ForkJoinPool cpuPool = new ForkJoinPool(processors);

        // 如果有其他 CPU 密集型进程，可以减少并行度
        ForkJoinPool conservativePool = new ForkJoinPool(processors - 1);

        // 查看公共池的并行度
        System.out.println("公共池并行度: " + ForkJoinPool.commonPool().getParallelism());

        // 可以通过系统属性调整公共池的并行度
        // -Djava.util.concurrent.ForkJoinPool.common.parallelism=8
    }
}
```

## 实战场景

### 场景一：图像处理

```java
import java.awt.image.BufferedImage;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveAction;

public class ImageProcessingExample {

    public static void main(String[] args) {
        BufferedImage image = loadImage("input.jpg");

        ForkJoinPool pool = new ForkJoinPool();
        pool.invoke(new GrayscaleTask(image, 0, 0, image.getWidth(), image.getHeight()));

        saveImage(image, "output.jpg");
        pool.shutdown();
    }

    private static BufferedImage loadImage(String path) {
        // 加载图片
        return null;
    }

    private static void saveImage(BufferedImage image, String path) {
        // 保存图片
    }
}

class GrayscaleTask extends RecursiveAction {
    private static final int THRESHOLD = 10000;  // 像素阈值

    private final BufferedImage image;
    private final int startX, startY, width, height;

    public GrayscaleTask(BufferedImage image, int startX, int startY,
                         int width, int height) {
        this.image = image;
        this.startX = startX;
        this.startY = startY;
        this.width = width;
        this.height = height;
    }

    @Override
    protected void compute() {
        int pixels = width * height;

        if (pixels <= THRESHOLD) {
            processDirectly();
            return;
        }

        // 将图像分成四个象限
        int halfWidth = width / 2;
        int halfHeight = height / 2;

        invokeAll(
            new GrayscaleTask(image, startX, startY, halfWidth, halfHeight),
            new GrayscaleTask(image, startX + halfWidth, startY, width - halfWidth, halfHeight),
            new GrayscaleTask(image, startX, startY + halfHeight, halfWidth, height - halfHeight),
            new GrayscaleTask(image, startX + halfWidth, startY + halfHeight,
                              width - halfWidth, height - halfHeight)
        );
    }

    private void processDirectly() {
        for (int y = startY; y < startY + height && y < image.getHeight(); y++) {
            for (int x = startX; x < startX + width && x < image.getWidth(); x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                // 计算灰度值
                int gray = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                int grayRgb = (gray << 16) | (gray << 8) | gray;

                image.setRGB(x, y, grayRgb);
            }
        }
    }
}
```

### 场景二：大数据集合处理

```java
import java.util.*;
import java.util.concurrent.*;

public class BigDataProcessingExample {

    public static void main(String[] args) {
        // 生成大量数据
        List<Transaction> transactions = generateTransactions(1_000_000);

        ForkJoinPool pool = new ForkJoinPool();

        // 计算总销售额
        Double totalSales = pool.invoke(new SalesCalculationTask(transactions, 0, transactions.size()));
        System.out.println("总销售额: " + totalSales);

        // 按类别统计
        Map<String, Double> salesByCategory = pool.invoke(
            new CategorySalesTask(transactions, 0, transactions.size())
        );
        System.out.println("分类销售额: " + salesByCategory);

        pool.shutdown();
    }

    private static List<Transaction> generateTransactions(int count) {
        List<Transaction> transactions = new ArrayList<>(count);
        String[] categories = {"Electronics", "Clothing", "Food", "Books"};
        Random random = new Random();

        for (int i = 0; i < count; i++) {
            transactions.add(new Transaction(
                categories[random.nextInt(categories.length)],
                random.nextDouble() * 1000
            ));
        }
        return transactions;
    }

    static class Transaction {
        final String category;
        final double amount;

        Transaction(String category, double amount) {
            this.category = category;
            this.amount = amount;
        }
    }
}

class SalesCalculationTask extends RecursiveTask<Double> {
    private static final int THRESHOLD = 10000;
    private final List<BigDataProcessingExample.Transaction> transactions;
    private final int start, end;

    public SalesCalculationTask(List<BigDataProcessingExample.Transaction> transactions,
                                int start, int end) {
        this.transactions = transactions;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Double compute() {
        if (end - start <= THRESHOLD) {
            double sum = 0;
            for (int i = start; i < end; i++) {
                sum += transactions.get(i).amount;
            }
            return sum;
        }

        int middle = start + (end - start) / 2;
        SalesCalculationTask left = new SalesCalculationTask(transactions, start, middle);
        SalesCalculationTask right = new SalesCalculationTask(transactions, middle, end);

        left.fork();
        Double rightResult = right.compute();
        Double leftResult = left.join();

        return leftResult + rightResult;
    }
}

class CategorySalesTask extends RecursiveTask<Map<String, Double>> {
    private static final int THRESHOLD = 10000;
    private final List<BigDataProcessingExample.Transaction> transactions;
    private final int start, end;

    public CategorySalesTask(List<BigDataProcessingExample.Transaction> transactions,
                             int start, int end) {
        this.transactions = transactions;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Map<String, Double> compute() {
        if (end - start <= THRESHOLD) {
            Map<String, Double> result = new HashMap<>();
            for (int i = start; i < end; i++) {
                BigDataProcessingExample.Transaction t = transactions.get(i);
                result.merge(t.category, t.amount, Double::sum);
            }
            return result;
        }

        int middle = start + (end - start) / 2;
        CategorySalesTask left = new CategorySalesTask(transactions, start, middle);
        CategorySalesTask right = new CategorySalesTask(transactions, middle, end);

        left.fork();
        Map<String, Double> rightResult = right.compute();
        Map<String, Double> leftResult = left.join();

        // 合并两个 Map
        Map<String, Double> merged = new HashMap<>(leftResult);
        rightResult.forEach((key, value) -> merged.merge(key, value, Double::sum));

        return merged;
    }
}
```

### 场景三：递归目录大小计算

```java
import java.io.File;
import java.util.concurrent.*;

public class DirectorySizeExample {

    public static void main(String[] args) {
        File root = new File("/path/to/directory");

        ForkJoinPool pool = new ForkJoinPool();
        Long totalSize = pool.invoke(new DirectorySizeTask(root));

        System.out.printf("目录总大小: %.2f MB%n", totalSize / (1024.0 * 1024.0));
        pool.shutdown();
    }
}

class DirectorySizeTask extends RecursiveTask<Long> {
    private final File file;

    public DirectorySizeTask(File file) {
        this.file = file;
    }

    @Override
    protected Long compute() {
        if (file.isFile()) {
            return file.length();
        }

        File[] files = file.listFiles();
        if (files == null || files.length == 0) {
            return 0L;
        }

        // 为每个子目录创建任务
        long size = 0;
        java.util.List<DirectorySizeTask> subTasks = new java.util.ArrayList<>();

        for (File child : files) {
            if (child.isDirectory()) {
                DirectorySizeTask task = new DirectorySizeTask(child);
                task.fork();
                subTasks.add(task);
            } else {
                size += child.length();
            }
        }

        // 收集子任务结果
        for (DirectorySizeTask task : subTasks) {
            size += task.join();
        }

        return size;
    }
}
```

## 面试要点

### Fork/Join 框架的核心思想是什么？

**答**：Fork/Join 框架的核心思想是**分而治之**（Divide and Conquer）：
- **Fork**：将大任务分解成多个小任务，并行执行
- **Join**：等待子任务完成，合并结果

框架通过**工作窃取算法**实现高效的负载均衡：每个工作线程维护一个双端队列，从队列尾部获取自己的任务，从其他线程队列头部窃取任务。

### 工作窃取算法的优势是什么？

**答**：
1. **自动负载均衡**：空闲线程可以窃取繁忙线程的任务
2. **减少竞争**：使用双端队列，本地线程从尾部取，窃取从头部取，减少冲突
3. **利用缓存**：LIFO 执行本地任务可以更好地利用 CPU 缓存局部性
4. **高效利用 CPU**：减少线程空闲时间，提高 CPU 利用率

### RecursiveTask 和 RecursiveAction 的区别？

**答**：
- **RecursiveTask<V>**：有返回值的任务，`compute()` 方法返回 V 类型结果
- **RecursiveAction**：无返回值的任务，`compute()` 方法返回 void

```java
// RecursiveTask 示例
class SumTask extends RecursiveTask<Long> {
    protected Long compute() {
        return leftResult + rightResult;  // 返回计算结果
    }
}

// RecursiveAction 示例
class SortTask extends RecursiveAction {
    protected void compute() {
        Arrays.sort(array, start, end);  // 无返回值
    }
}
```

### 如何选择合适的阈值？

**答**：阈值选择需要权衡：
- **太大**：并行度不够，无法充分利用多核
- **太小**：任务创建开销大于执行收益

**经验法则**：
```java
// 阈值 = 总任务数 / (并行度 * 4)
int threshold = totalSize / (Runtime.getRuntime().availableProcessors() * 4);
```

建议通过实际测试调整，一般范围在 1000-100000 之间。

### fork() 和 join() 的执行顺序有什么讲究？

**答**：推荐的模式是**一个 fork，一个 compute**：

```java
left.fork();                    // 异步执行左边
Long rightResult = right.compute();  // 同步执行右边（当前线程）
Long leftResult = left.join();       // 等待左边完成
```

这样可以：
1. 避免创建过多任务
2. 充分利用当前线程
3. 减少线程上下文切换

### Fork/Join 框架和并行流的关系？

**答**：Java 8 的并行流底层使用 `ForkJoinPool.commonPool()`：

```java
// 并行流
long sum = LongStream.range(1, 1_000_000)
    .parallel()
    .sum();

// 等价于在 commonPool 中执行 Fork/Join 任务
```

两者的区别：
- 并行流更简洁，适合简单的并行操作
- Fork/Join 更灵活，适合复杂的递归任务
- 可以通过自定义 ForkJoinPool 控制并行流的执行

```java
ForkJoinPool customPool = new ForkJoinPool(4);
long sum = customPool.submit(() ->
    LongStream.range(1, 1_000_000).parallel().sum()
).get();
```

### Fork/Join 框架适用于什么场景？

**答**：Fork/Join 最适合：
1. **可递归分解的任务**：如排序、搜索、树遍历
2. **计算密集型任务**：不涉及 I/O 阻塞
3. **子任务之间相互独立**：无共享可变状态

不适合的场景：
1. I/O 密集型任务（会阻塞工作线程）
2. 任务无法分解或分解开销大
3. 需要频繁同步的任务

## 延伸阅读

### 官方文档
- [ForkJoinPool JavaDoc](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)
- [Fork/Join Framework Tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html)

### 经典论文和书籍
- Doug Lea: "A Java Fork/Join Framework" (原始设计论文)
- 《Java 并发编程实战》第 8 章
- 《Java 并发编程的艺术》

### 相关技术
- [并行流 (Parallel Streams)](/java/stream-api)
- [CompletableFuture](/java/completable-future)
- [线程池 ThreadPoolExecutor](/java/concurrency)
