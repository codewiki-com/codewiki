---
title: Fork/Join Framework
description: "Deep Understanding of Java Fork/Join Parallel Computing Framework: ForkJoinPool, RecursiveTask, RecursiveAction and Work-Stealing Algorithm"
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - Fork/Join
  - Parallel Computing
  - ForkJoinPool
  - Work-Stealing
status: imported
origin: old/src/content/docs/java/fork-join.en.md
divergence: 0.205
issues: []
legacy:
  category: Java
  subcategory: Concurrency
  order: 18
  lastUpdated: 2026-01-07
---

## Concept Explanation

The Fork/Join framework is a framework introduced in Java 7 for parallel task execution. It is an implementation of the `ExecutorService` interface, specifically designed for processing tasks that can be recursively decomposed. The core idea of the framework is **Divide and Conquer**: split a large task into several smaller tasks (Fork), execute them separately, and then merge the results (Join).

### Historical Background

The Fork/Join framework was inspired by the Cilk language (a parallel computing language developed by MIT). Java concurrency expert Doug Lea proposed this framework design in JSR 166, aiming to fully utilize the computing power of multi-core processors.

### What Problems Does It Solve?

Traditional thread pools (like `ThreadPoolExecutor`) are suitable for handling large numbers of independent, blocking tasks, but are inefficient for recursively decomposable compute-intensive tasks. The Fork/Join framework solves these problems through:

1. **Task Decomposition**: Automatically decomposes large tasks into smaller tasks for parallel execution
2. **Work-Stealing**: Idle threads can "steal" tasks from other threads' queues, improving CPU utilization
3. **Recursion-Friendly**: Naturally supports parallelization of recursive tasks

```java
// Traditional way: Manually manage thread allocation
ExecutorService executor = Executors.newFixedThreadPool(4);
// Need to manually split tasks, submit, wait, merge results...

// Fork/Join way: Framework handles automatically
ForkJoinPool pool = new ForkJoinPool();
Long result = pool.invoke(new SumTask(array, 0, array.length));
// Framework automatically handles task decomposition, parallel execution, result merging
```

## Core Principles

### Work-Stealing Algorithm

Work-stealing is the core mechanism of the Fork/Join framework. Each worker thread maintains a double-ended queue (Deque) for storing tasks to be executed:

```
Thread 1's queue: [Task A] [Task B] [Task C] [Task D]  <- Takes tasks from tail
                                           ^
                                    Other threads steal from head
```

**Work-stealing workflow**:

1. Each thread takes tasks from its own queue's **tail** (LIFO, Last In First Out)
2. When a thread's queue is empty, it steals tasks from other threads' queue **head** (FIFO, First In First Out)
3. LIFO for local tasks better utilizes cache, FIFO stealing gets larger tasks

```java
// Pseudo-code logic for work-stealing
while (running) {
    ForkJoinTask task = localQueue.pollFromTail();  // Take from local queue tail

    if (task == null) {
        task = stealFromOther();  // Steal from other thread's queue head
    }

    if (task != null) {
        task.exec();
    } else {
        await();  // Wait for new tasks
    }
}
```

### Task Decomposition and Merging

The Fork/Join framework organizes tasks in a tree structure:

```
                    Main Task [0-1000000]
                         |
            +------------+------------+
            |                         |
      Subtask [0-500000]         Subtask [500000-1000000]
            |                         |
      +-----+-----+             +-----+-----+
      |           |             |           |
  [0-250000] [250000-500000] [500000-750000] [750000-1000000]
      |           |             |           |
  (compute)    (compute)     (compute)    (compute)
      |           |             |           |
      +-----+-----+             +-----+-----+
            |                         |
          merge                     merge
            |                         |
            +------------+------------+
                         |
                    Final Result
```

### ForkJoinPool Internal Structure

```java
public class ForkJoinPool extends AbstractExecutorService {
    // Worker thread array
    volatile WorkQueue[] workQueues;

    // Parallelism (usually equals CPU core count)
    final int parallelism;

    // Worker thread factory
    final ForkJoinWorkerThreadFactory factory;

    // Exception handler
    final UncaughtExceptionHandler ueh;

    // Common pool (singleton)
    static final ForkJoinPool common;
}
```

## Key Points

### ForkJoinPool

`ForkJoinPool` is the thread pool for executing Fork/Join tasks:

```java
// Creation method 1: Use default parallelism (CPU core count)
ForkJoinPool pool = new ForkJoinPool();

// Creation method 2: Specify parallelism
ForkJoinPool pool = new ForkJoinPool(8);

// Creation method 3: Full parameters
ForkJoinPool pool = new ForkJoinPool(
    Runtime.getRuntime().availableProcessors(), // Parallelism
    ForkJoinPool.defaultForkJoinWorkerThreadFactory, // Thread factory
    null,  // Exception handler
    true   // Async mode (FIFO), default false (LIFO)
);

// Use common pool (recommended for simple scenarios)
ForkJoinPool commonPool = ForkJoinPool.commonPool();
```

### RecursiveTask

`RecursiveTask<V>` is for tasks with return values:

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

        // Task small enough, compute directly
        if (length <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            return sum;
        }

        // Task too large, decompose into two subtasks
        int middle = start + length / 2;
        SumTask leftTask = new SumTask(array, start, middle);
        SumTask rightTask = new SumTask(array, middle, end);

        // fork: Execute left task asynchronously
        leftTask.fork();

        // Compute right task directly (avoid creating too many tasks)
        Long rightResult = rightTask.compute();

        // join: Wait for left task to complete and get result
        Long leftResult = leftTask.join();

        // Merge results
        return leftResult + rightResult;
    }
}
```

### RecursiveAction

`RecursiveAction` is for tasks without return values:

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
            // Sort small array directly
            Arrays.sort(array, start, end);
            return;
        }

        // Decompose task
        int middle = start + length / 2;
        SortTask leftTask = new SortTask(array, start, middle);
        SortTask rightTask = new SortTask(array, middle, end);

        // Execute both subtasks in parallel
        invokeAll(leftTask, rightTask);

        // Merge the two sorted parts
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

### Task Submission Methods

```java
ForkJoinPool pool = new ForkJoinPool();

// Method 1: invoke - Synchronous execution, blocks waiting for result
Long result = pool.invoke(new SumTask(array, 0, array.length));

// Method 2: submit - Asynchronous submission, returns ForkJoinTask
ForkJoinTask<Long> task = pool.submit(new SumTask(array, 0, array.length));
Long result = task.get();  // Blocking wait
// Or
Long result = task.join(); // Doesn't throw checked exceptions

// Method 3: execute - Asynchronous execution, no return value
pool.execute(new SortTask(array, 0, array.length));

// Method 4: Use fork/join inside task
leftTask.fork();   // Async execution
rightResult = rightTask.compute();  // Sync execution
leftResult = leftTask.join();  // Wait for forked task to complete
```

## Code Examples

### Example 1: Parallel Array Sum

```java
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveTask;
import java.util.stream.LongStream;

public class ParallelSumExample {

    public static void main(String[] args) {
        // Create a large array
        long[] numbers = LongStream.rangeClosed(1, 10_000_000).toArray();

        // Compute using Fork/Join
        ForkJoinPool pool = new ForkJoinPool();
        long start = System.currentTimeMillis();

        Long sum = pool.invoke(new SumTask(numbers, 0, numbers.length));

        long end = System.currentTimeMillis();
        System.out.println("Fork/Join sum result: " + sum);
        System.out.println("Time: " + (end - start) + "ms");

        // Verify result
        long expected = (1L + 10_000_000L) * 10_000_000L / 2;
        System.out.println("Verification: " + (sum == expected ? "Correct" : "Error"));

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

### Example 2: Parallel Quick Sort

```java
import java.util.Arrays;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveAction;
import java.util.Random;

public class ParallelQuickSortExample {

    public static void main(String[] args) {
        int[] array = new Random().ints(1_000_000, 0, 1_000_000).toArray();
        int[] arrayCopy = Arrays.copyOf(array, array.length);

        // Fork/Join parallel sort
        ForkJoinPool pool = new ForkJoinPool();
        long start = System.currentTimeMillis();
        pool.invoke(new QuickSortTask(array, 0, array.length - 1));
        long forkJoinTime = System.currentTimeMillis() - start;

        // Standard sort comparison
        start = System.currentTimeMillis();
        Arrays.sort(arrayCopy);
        long standardTime = System.currentTimeMillis() - start;

        System.out.println("Fork/Join sort time: " + forkJoinTime + "ms");
        System.out.println("Arrays.sort time: " + standardTime + "ms");
        System.out.println("Result verification: " + Arrays.equals(array, arrayCopy));

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

### Example 3: Parallel Document Search

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

        System.out.println("Found " + results.size() + " files containing '" + keyword + "':");
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
                // Create new task for subdirectory
                FileSearchTask task = new FileSearchTask(file, keyword);
                task.fork();
                subTasks.add(task);
            } else if (file.getName().endsWith(".java")) {
                // Search Java files
                if (containsKeyword(file, keyword)) {
                    results.add(file.getAbsolutePath());
                }
            }
        }

        // Collect results from all subtasks
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

### Example 4: Parallel Matrix Multiplication

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
        System.out.println("Parallel matrix multiplication complete, time: " + (end - start) + "ms");

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

### Example 5: Using CountedCompleter

`CountedCompleter` is a more flexible task type introduced in Java 8, suitable for scenarios where certain operations need to be performed after all subtasks complete:

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

        System.out.println("Sum result: " + result.get());
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

        // Increment pending task count
        addToPendingCount(1);

        // Create and execute subtasks
        new SumCountedCompleter(this, array, start, middle, result).fork();
        new SumCountedCompleter(this, array, middle, end, result).compute();
    }

    @Override
    public void onCompletion(CountedCompleter<?> caller) {
        // Callback when all subtasks complete
        if (getParent() == null) {
            System.out.println("All tasks completed");
        }
    }
}
```

## Best Practices

### Choose Appropriate Threshold

A threshold too large results in insufficient parallelism, too small creates excessive task overhead:

```java
public class ThresholdExample {

    // Rule of thumb: threshold = total size / (parallelism * 4)
    public static int calculateThreshold(int totalSize, int parallelism) {
        return Math.max(1, totalSize / (parallelism * 4));
    }

    // Adaptive threshold
    public static int adaptiveThreshold(int totalSize) {
        int processors = Runtime.getRuntime().availableProcessors();
        int minThreshold = 1000;
        int maxThreshold = 100000;

        int calculated = totalSize / (processors * 4);
        return Math.max(minThreshold, Math.min(maxThreshold, calculated));
    }
}
```

### Proper Use of fork and compute

```java
// Recommended: One fork, one compute
@Override
protected Long compute() {
    if (size <= THRESHOLD) {
        return computeDirectly();
    }

    SubTask left = new SubTask(/* left half */);
    SubTask right = new SubTask(/* right half */);

    left.fork();           // Execute left asynchronously
    Long rightResult = right.compute();  // Execute right synchronously (current thread)
    Long leftResult = left.join();       // Wait for left to complete

    return leftResult + rightResult;
}

// Or use invokeAll (both tasks fork)
@Override
protected void compute() {
    if (size <= THRESHOLD) {
        computeDirectly();
        return;
    }

    SubTask left = new SubTask(/* left half */);
    SubTask right = new SubTask(/* right half */);

    invokeAll(left, right);  // Both fork, then wait for both to complete
}
```

### Avoid Blocking in Tasks

```java
// Wrong: Blocking I/O in Fork/Join task
class BadTask extends RecursiveTask<String> {
    @Override
    protected String compute() {
        // Don't do this! Blocks worker thread
        return httpClient.get("http://example.com");
    }
}

// Correct: Fork/Join is for compute-intensive tasks
class GoodTask extends RecursiveTask<Long> {
    @Override
    protected Long compute() {
        // CPU computation task
        return Arrays.stream(array).sum();
    }
}

// If blocking is necessary, use ManagedBlocker
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

### Use Common Pool for Simple Scenarios

```java
// Simple scenarios: Use common pool
Long result = ForkJoinPool.commonPool().invoke(new SumTask(array, 0, array.length));

// Or use ForkJoinTask static method
Long result = ForkJoinTask.invoke(new SumTask(array, 0, array.length));

// Complex scenarios: Create dedicated pool
ForkJoinPool dedicatedPool = new ForkJoinPool(
    8,  // Specify parallelism
    ForkJoinPool.defaultForkJoinWorkerThreadFactory,
    (t, e) -> System.err.println("Task exception: " + e),  // Exception handler
    false
);
```

### Monitoring and Debugging

```java
public class ForkJoinMonitor {

    public static void printPoolStats(ForkJoinPool pool) {
        System.out.println("=== ForkJoinPool Status ===");
        System.out.println("Parallelism: " + pool.getParallelism());
        System.out.println("Pool Size: " + pool.getPoolSize());
        System.out.println("Active Threads: " + pool.getActiveThreadCount());
        System.out.println("Running Threads: " + pool.getRunningThreadCount());
        System.out.println("Queued Tasks: " + pool.getQueuedTaskCount());
        System.out.println("Steal Count: " + pool.getStealCount());
    }

    public static void main(String[] args) {
        ForkJoinPool pool = new ForkJoinPool();

        // Periodically print status
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

        // Execute task
        pool.invoke(new SumTask(new long[1_000_000], 0, 1_000_000));
        pool.shutdown();
    }
}
```

## Common Pitfalls

### Pitfall 1: Incorrect fork/join Order

```java
// Wrong: join before fork, leads to sequential execution
@Override
protected Long compute() {
    SubTask left = new SubTask(/*...*/);
    SubTask right = new SubTask(/*...*/);

    Long leftResult = left.fork().join();  // Wait for left to complete
    Long rightResult = right.fork().join(); // Then start right

    return leftResult + rightResult;
}

// Correct: Fork all tasks first, then join
@Override
protected Long compute() {
    SubTask left = new SubTask(/*...*/);
    SubTask right = new SubTask(/*...*/);

    left.fork();   // Fork first
    right.fork();  // Fork first

    return left.join() + right.join();  // Then join
}

// Better: One fork, one compute
@Override
protected Long compute() {
    SubTask left = new SubTask(/*...*/);
    SubTask right = new SubTask(/*...*/);

    left.fork();
    Long rightResult = right.compute();  // Current thread computes directly
    Long leftResult = left.join();

    return leftResult + rightResult;
}
```

### Pitfall 2: Task Granularity Too Fine

```java
// Wrong: Threshold too small, excessive task overhead
class TooFineGrainedTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 1;  // Too small!

    @Override
    protected Long compute() {
        if (size <= THRESHOLD) {
            return array[start];
        }
        // Creates task for every element, huge overhead
        // ...
    }
}

// Correct: Choose appropriate threshold
class ProperlyGrainedTask extends RecursiveTask<Long> {
    // Adjust based on data size and CPU cores
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

### Pitfall 3: Shared Mutable State

```java
// Wrong: Multiple tasks share mutable state
class UnsafeTask extends RecursiveAction {
    private List<Integer> results = new ArrayList<>();  // Shared, not thread-safe

    @Override
    protected void compute() {
        // Multiple threads modify results simultaneously, causes data loss or corruption
        results.add(computeValue());
    }
}

// Correct: Each task returns its own result, merge at end
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

        // Merge results
        List<Integer> merged = new ArrayList<>(leftResult);
        merged.addAll(rightResult);
        return merged;
    }
}
```

### Pitfall 4: Ignoring Exception Handling

```java
// Wrong: Exception swallowed
@Override
protected Long compute() {
    try {
        // May throw exception
        return riskyOperation();
    } catch (Exception e) {
        return 0L;  // Silent failure, hard to debug
    }
}

// Correct: Use completeExceptionally to propagate exception
@Override
protected Long compute() {
    try {
        return riskyOperation();
    } catch (Exception e) {
        completeExceptionally(e);
        return null;
    }
}

// Or let exception propagate naturally, handle at call site
Long result;
try {
    result = pool.invoke(task);
} catch (Exception e) {
    System.err.println("Task execution failed: " + e.getCause());
}
```

### Pitfall 5: Calling fork Outside ForkJoinPool

```java
// Wrong: Calling fork in regular thread
public static void main(String[] args) {
    SubTask task = new SubTask(/*...*/);
    task.fork();  // Wrong! Main thread is not ForkJoinWorkerThread
    task.join();
}

// Correct: Execute through ForkJoinPool
public static void main(String[] args) {
    ForkJoinPool pool = new ForkJoinPool();
    Long result = pool.invoke(new SubTask(/*...*/));
}
```

## Performance Considerations

### Fork/Join vs Traditional Thread Pool

| Feature | Fork/Join | ThreadPoolExecutor |
|---------|-----------|-------------------|
| Use Case | Decomposable compute-intensive tasks | Independent I/O-intensive tasks |
| Task Scheduling | Work-stealing | Shared queue |
| Task Type | Recursively decomposable | Independent |
| Load Balancing | Automatic (via work-stealing) | Requires manual design |
| Thread Count | Usually equals CPU cores | Adjusted based on task type |

### Performance Benchmark

```java
import java.util.concurrent.*;
import java.util.stream.LongStream;

public class PerformanceBenchmark {

    private static final int ARRAY_SIZE = 100_000_000;
    private static final int ITERATIONS = 10;

    public static void main(String[] args) {
        long[] array = LongStream.rangeClosed(1, ARRAY_SIZE).toArray();

        // Warm up
        warmUp(array);

        // Test various methods
        System.out.println("=== Performance Comparison ===");

        long serialTime = benchmarkSerial(array);
        System.out.printf("Serial execution: %d ms%n", serialTime);

        long forkJoinTime = benchmarkForkJoin(array);
        System.out.printf("Fork/Join: %d ms (speedup: %.2fx)%n",
            forkJoinTime, (double) serialTime / forkJoinTime);

        long streamTime = benchmarkParallelStream(array);
        System.out.printf("Parallel stream: %d ms (speedup: %.2fx)%n",
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

### Optimization Tips

```java
public class OptimizationTips {

    // 1. Avoid unnecessary object creation
    class OptimizedTask extends RecursiveTask<Long> {
        // Reuse array, avoid creating new array for each decomposition
        private final long[] array;
        private final int start, end;

        // Don't do this: Create new array every time
        // long[] subArray = Arrays.copyOfRange(array, start, middle);
    }

    // 2. Consider cache locality
    class CacheOptimizedTask extends RecursiveTask<Long> {
        @Override
        protected Long compute() {
            // Sequential array access, utilize CPU cache
            long sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];  // Contiguous memory access
            }
            return sum;
        }
    }

    // 3. Use more efficient merge strategy
    class EfficientMergeTask extends RecursiveTask<long[]> {
        @Override
        protected long[] compute() {
            // For large arrays, use System.arraycopy instead of loop
            System.arraycopy(src, srcPos, dest, destPos, length);
            return dest;
        }
    }
}
```

### Parallelism Tuning

```java
public class ParallelismTuning {

    public static void main(String[] args) {
        int processors = Runtime.getRuntime().availableProcessors();

        // CPU-intensive: parallelism = CPU cores
        ForkJoinPool cpuPool = new ForkJoinPool(processors);

        // If other CPU-intensive processes exist, reduce parallelism
        ForkJoinPool conservativePool = new ForkJoinPool(processors - 1);

        // Check common pool parallelism
        System.out.println("Common pool parallelism: " + ForkJoinPool.commonPool().getParallelism());

        // Can adjust common pool parallelism via system property
        // -Djava.util.concurrent.ForkJoinPool.common.parallelism=8
    }
}
```

## Practical Scenarios

### Scenario 1: Image Processing

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
        // Load image
        return null;
    }

    private static void saveImage(BufferedImage image, String path) {
        // Save image
    }
}

class GrayscaleTask extends RecursiveAction {
    private static final int THRESHOLD = 10000;  // Pixel threshold

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

        // Divide image into four quadrants
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

                // Calculate grayscale value
                int gray = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                int grayRgb = (gray << 16) | (gray << 8) | gray;

                image.setRGB(x, y, grayRgb);
            }
        }
    }
}
```

### Scenario 2: Big Data Collection Processing

```java
import java.util.*;
import java.util.concurrent.*;

public class BigDataProcessingExample {

    public static void main(String[] args) {
        // Generate large data
        List<Transaction> transactions = generateTransactions(1_000_000);

        ForkJoinPool pool = new ForkJoinPool();

        // Calculate total sales
        Double totalSales = pool.invoke(new SalesCalculationTask(transactions, 0, transactions.size()));
        System.out.println("Total sales: " + totalSales);

        // Statistics by category
        Map<String, Double> salesByCategory = pool.invoke(
            new CategorySalesTask(transactions, 0, transactions.size())
        );
        System.out.println("Sales by category: " + salesByCategory);

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

        // Merge two Maps
        Map<String, Double> merged = new HashMap<>(leftResult);
        rightResult.forEach((key, value) -> merged.merge(key, value, Double::sum));

        return merged;
    }
}
```

### Scenario 3: Recursive Directory Size Calculation

```java
import java.io.File;
import java.util.concurrent.*;

public class DirectorySizeExample {

    public static void main(String[] args) {
        File root = new File("/path/to/directory");

        ForkJoinPool pool = new ForkJoinPool();
        Long totalSize = pool.invoke(new DirectorySizeTask(root));

        System.out.printf("Total directory size: %.2f MB%n", totalSize / (1024.0 * 1024.0));
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

        // Create task for each subdirectory
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

        // Collect subtask results
        for (DirectorySizeTask task : subTasks) {
            size += task.join();
        }

        return size;
    }
}
```

## Interview Key Points

### What is the core idea of Fork/Join framework?

**Answer**: The core idea of Fork/Join framework is **Divide and Conquer**:
- **Fork**: Decompose a large task into multiple small tasks for parallel execution
- **Join**: Wait for subtasks to complete, merge results

The framework achieves efficient load balancing through the **work-stealing algorithm**: each worker thread maintains a double-ended queue, takes its own tasks from the queue tail, and steals tasks from other threads' queue heads.

### What are the advantages of work-stealing algorithm?

**Answer**:
1. **Automatic load balancing**: Idle threads can steal tasks from busy threads
2. **Reduced contention**: Uses double-ended queue, local thread takes from tail, stealing from head, reduces conflicts
3. **Cache utilization**: LIFO execution of local tasks better utilizes CPU cache locality
4. **Efficient CPU utilization**: Reduces thread idle time, improves CPU utilization

### What's the difference between RecursiveTask and RecursiveAction?

**Answer**:
- **RecursiveTask<V>**: Task with return value, `compute()` method returns V type result
- **RecursiveAction**: Task without return value, `compute()` method returns void

```java
// RecursiveTask example
class SumTask extends RecursiveTask<Long> {
    protected Long compute() {
        return leftResult + rightResult;  // Returns computed result
    }
}

// RecursiveAction example
class SortTask extends RecursiveAction {
    protected void compute() {
        Arrays.sort(array, start, end);  // No return value
    }
}
```

### How to choose appropriate threshold?

**Answer**: Threshold selection requires trade-off:
- **Too large**: Insufficient parallelism, can't fully utilize multi-core
- **Too small**: Task creation overhead exceeds execution benefit

**Rule of thumb**:
```java
// threshold = total size / (parallelism * 4)
int threshold = totalSize / (Runtime.getRuntime().availableProcessors() * 4);
```

Recommended to adjust through actual testing, generally ranging from 1000-100000.

### What's the proper execution order for fork() and join()?

**Answer**: Recommended pattern is **one fork, one compute**:

```java
left.fork();                    // Execute left asynchronously
Long rightResult = right.compute();  // Execute right synchronously (current thread)
Long leftResult = left.join();       // Wait for left to complete
```

This allows:
1. Avoiding creating too many tasks
2. Fully utilizing current thread
3. Reducing thread context switching

### What's the relationship between Fork/Join framework and parallel streams?

**Answer**: Java 8's parallel streams use `ForkJoinPool.commonPool()` under the hood:

```java
// Parallel stream
long sum = LongStream.range(1, 1_000_000)
    .parallel()
    .sum();

// Equivalent to executing Fork/Join task in commonPool
```

Differences:
- Parallel streams are more concise, suitable for simple parallel operations
- Fork/Join is more flexible, suitable for complex recursive tasks
- Can control parallel stream execution with custom ForkJoinPool

```java
ForkJoinPool customPool = new ForkJoinPool(4);
long sum = customPool.submit(() ->
    LongStream.range(1, 1_000_000).parallel().sum()
).get();
```

### What scenarios are Fork/Join framework suitable for?

**Answer**: Fork/Join is best for:
1. **Recursively decomposable tasks**: Such as sorting, searching, tree traversal
2. **Compute-intensive tasks**: No I/O blocking
3. **Independent subtasks**: No shared mutable state

Not suitable scenarios:
1. I/O-intensive tasks (blocks worker threads)
2. Tasks that cannot be decomposed or have high decomposition overhead
3. Tasks requiring frequent synchronization

## Further Reading

### Official Documentation
- [ForkJoinPool JavaDoc](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)
- [Fork/Join Framework Tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html)

### Classic Papers and Books
- Doug Lea: "A Java Fork/Join Framework" (Original design paper)
- "Java Concurrency in Practice" Chapter 8
- "The Art of Java Concurrency Programming"

### Related Technologies
- [Parallel Streams](/java/stream-api)
- [CompletableFuture](/java/completable-future)
- [Thread Pool ThreadPoolExecutor](/java/concurrency)
