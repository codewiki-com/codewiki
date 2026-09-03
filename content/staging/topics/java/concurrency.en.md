---
title: Java Concurrency
description: "Deep dive into Java concurrency: threads, synchronization, locks, concurrent utilities and thread pools"
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - Concurrency
  - Threads
  - Locks
status: imported
origin: old/src/content/docs/java/concurrency.en.md
divergence: 0.343
issues: []
legacy:
  category: Java
  subcategory: Concurrency
  order: 5
  lastUpdated: 2026-01-07
---

Java concurrency is a fundamental aspect of modern Java programming that enables multiple tasks to execute simultaneously, improving application performance and responsiveness. We explore the core concepts, APIs, and best practices for concurrent programming in Java.

## Thread Basics

### Creating Threads

Java provides multiple ways to create and start threads:

#### Extending Thread Class

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread running: " + Thread.currentThread().getName());
        for (int i = 0; i < 5; i++) {
            System.out.println("Count: " + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.out.println("Thread interrupted");
            }
        }
    }
}

// Usage
MyThread thread = new MyThread();
thread.start();
```

#### Implementing Runnable Interface

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable executing in: " + Thread.currentThread().getName());
    }
}

// Usage
Thread thread = new Thread(new MyRunnable());
thread.start();

// Lambda expression (Java 8+)
Thread lambdaThread = new Thread(() -> {
    System.out.println("Lambda thread running");
});
lambdaThread.start();
```

### Thread Lifecycle

A thread goes through several states during its lifetime:

- **NEW**: Thread created but not yet started
- **RUNNABLE**: Thread executing or ready to execute
- **BLOCKED**: Thread blocked waiting for a monitor lock
- **WAITING**: Thread waiting indefinitely for another thread
- **TIMED_WAITING**: Thread waiting for a specified period
- **TERMINATED**: Thread has completed execution

```java
public class ThreadLifecycleDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        System.out.println("State after creation: " + thread.getState()); // NEW
        thread.start();
        System.out.println("State after start: " + thread.getState()); // RUNNABLE
        Thread.sleep(100);
        System.out.println("State while sleeping: " + thread.getState()); // TIMED_WAITING
        thread.join();
        System.out.println("State after completion: " + thread.getState()); // TERMINATED
    }
}
```

### Thread Methods

```java
public class ThreadMethodsDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            System.out.println("Thread priority: " + Thread.currentThread().getPriority());
            System.out.println("Is daemon: " + Thread.currentThread().isDaemon());
        });

        // Set thread properties
        thread.setName("WorkerThread");
        thread.setPriority(Thread.MAX_PRIORITY);
        thread.setDaemon(false);

        thread.start();
        thread.join(); // Wait for thread to complete
    }
}
```

## Synchronization and Visibility

### The synchronized Keyword

The `synchronized` keyword ensures that only one thread can execute a block of code at a time, preventing race conditions.

#### Synchronized Methods

```java
public class Counter {
    private int count = 0;

    // Synchronized instance method
    public synchronized void increment() {
        count++;
    }

    // Synchronized static method
    public static synchronized void staticMethod() {
        // Lock on the class object
    }

    public synchronized int getCount() {
        return count;
    }
}

// Usage
Counter counter = new Counter();
Thread t1 = new Thread(() -> {
    for (int i = 0; i < 1000; i++) {
        counter.increment();
    }
});
Thread t2 = new Thread(() -> {
    for (int i = 0; i < 1000; i++) {
        counter.increment();
    }
});

t1.start();
t2.start();
t1.join();
t2.join();
System.out.println("Final count: " + counter.getCount()); // Always 2000
```

#### Synchronized Blocks

```java
public class SynchronizedBlockExample {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();
    private int counter1 = 0;
    private int counter2 = 0;

    public void incrementCounter1() {
        synchronized (lock1) {
            counter1++;
        }
    }

    public void incrementCounter2() {
        synchronized (lock2) {
            counter2++;
        }
    }

    // Fine-grained locking allows better concurrency
    public void bothCounters() {
        synchronized (lock1) {
            counter1++;
        }
        // Other threads can access counter2 here
        synchronized (lock2) {
            counter2++;
        }
    }
}
```

### The volatile Keyword

The `volatile` keyword ensures visibility of changes across threads but does not provide atomicity.

```java
public class VolatileExample {
    private volatile boolean running = true;

    public void stop() {
        running = false; // Change visible to all threads immediately
    }

    public void run() {
        while (running) {
            // Do work
        }
        System.out.println("Thread stopped");
    }
}
```

### Wait, Notify, and NotifyAll

These methods enable thread communication and must be called within synchronized blocks.

```java
public class ProducerConsumer {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int MAX_SIZE = 5;
    private final Object lock = new Object();

    public void produce(int value) throws InterruptedException {
        synchronized (lock) {
            while (queue.size() == MAX_SIZE) {
                lock.wait(); // Release lock and wait
            }
            queue.add(value);
            System.out.println("Produced: " + value);
            lock.notifyAll(); // Wake up waiting consumers
        }
    }

    public int consume() throws InterruptedException {
        synchronized (lock) {
            while (queue.isEmpty()) {
                lock.wait(); // Release lock and wait
            }
            int value = queue.poll();
            System.out.println("Consumed: " + value);
            lock.notifyAll(); // Wake up waiting producers
            return value;
        }
    }
}
```

## Lock Interface and Implementations

The `java.util.concurrent.locks` package provides more flexible locking mechanisms than synchronized blocks.

### ReentrantLock

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final Lock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock(); // Always unlock in finally block
        }
    }

    public boolean tryIncrement() {
        if (lock.tryLock()) { // Non-blocking attempt
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }

    public void incrementWithTimeout() throws InterruptedException {
        if (lock.tryLock(1000, TimeUnit.MILLISECONDS)) {
            try {
                count++;
            } finally {
                lock.unlock();
            }
        }
    }
}
```

### ReadWriteLock

```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ReadWriteLockExample {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Map<String, String> cache = new HashMap<>();

    public String read(String key) {
        rwLock.readLock().lock();
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public void write(String key, String value) {
        rwLock.writeLock().lock();
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

### StampedLock (Java 8+)

```java
import java.util.concurrent.locks.StampedLock;

public class StampedLockExample {
    private final StampedLock lock = new StampedLock();
    private double x, y;

    // Optimistic read
    public double distanceFromOrigin() {
        long stamp = lock.tryOptimisticRead();
        double currentX = x;
        double currentY = y;

        if (!lock.validate(stamp)) {
            // Data changed, acquire read lock
            stamp = lock.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                lock.unlockRead(stamp);
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }

    public void move(double deltaX, double deltaY) {
        long stamp = lock.writeLock();
        try {
            x += deltaX;
            y += deltaY;
        } finally {
            lock.unlockWrite(stamp);
        }
    }
}
```

### Condition Variables

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class BoundedBuffer<T> {
    private final Lock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    private final T[] items;
    private int count, putIndex, takeIndex;

    @SuppressWarnings("unchecked")
    public BoundedBuffer(int capacity) {
        items = (T[]) new Object[capacity];
    }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) {
                notFull.await();
            }
            items[putIndex] = item;
            putIndex = (putIndex + 1) % items.length;
            count++;
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                notEmpty.await();
            }
            T item = items[takeIndex];
            items[takeIndex] = null;
            takeIndex = (takeIndex + 1) % items.length;
            count--;
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}
```

## Concurrent Utilities

### Atomic Variables

```java
import java.util.concurrent.atomic.*;

public class AtomicExample {
    private AtomicInteger counter = new AtomicInteger(0);
    private AtomicLong longCounter = new AtomicLong(0L);
    private AtomicBoolean flag = new AtomicBoolean(false);
    private AtomicReference<String> reference = new AtomicReference<>("initial");

    public void atomicOperations() {
        // Atomic increment and get
        int newValue = counter.incrementAndGet();

        // Atomic compare and set
        boolean updated = counter.compareAndSet(1, 2);

        // Atomic update with lambda
        counter.updateAndGet(x -> x * 2);
        counter.accumulateAndGet(5, (current, update) -> current + update);

        // Atomic reference operations
        reference.set("new value");
        String old = reference.getAndSet("another value");
        reference.compareAndSet("another value", "final value");
    }
}
```

### CountDownLatch

```java
import java.util.concurrent.CountDownLatch;

public class CountDownLatchExample {
    public static void main(String[] args) throws InterruptedException {
        int workerCount = 5;
        CountDownLatch latch = new CountDownLatch(workerCount);

        for (int i = 0; i < workerCount; i++) {
            new Thread(new Worker(latch, "Worker-" + i)).start();
        }

        latch.await(); // Wait for all workers to complete
        System.out.println("All workers completed");
    }

    static class Worker implements Runnable {
        private final CountDownLatch latch;
        private final String name;

        Worker(CountDownLatch latch, String name) {
            this.latch = latch;
            this.name = name;
        }

        @Override
        public void run() {
            System.out.println(name + " starting work");
            try {
                Thread.sleep((long) (Math.random() * 1000));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            System.out.println(name + " completed");
            latch.countDown();
        }
    }
}
```

### CyclicBarrier

```java
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.BrokenBarrierException;

public class CyclicBarrierExample {
    public static void main(String[] args) {
        int parties = 3;
        CyclicBarrier barrier = new CyclicBarrier(parties, () -> {
            System.out.println("All parties reached barrier, proceeding...");
        });

        for (int i = 0; i < parties; i++) {
            new Thread(new Task(barrier, "Task-" + i)).start();
        }
    }

    static class Task implements Runnable {
        private final CyclicBarrier barrier;
        private final String name;

        Task(CyclicBarrier barrier, String name) {
            this.barrier = barrier;
            this.name = name;
        }

        @Override
        public void run() {
            try {
                System.out.println(name + " working on phase 1");
                Thread.sleep(1000);
                barrier.await(); // Wait for other tasks

                System.out.println(name + " working on phase 2");
                Thread.sleep(1000);
                barrier.await(); // Barrier can be reused

                System.out.println(name + " completed");
            } catch (InterruptedException | BrokenBarrierException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
```

### Semaphore

```java
import java.util.concurrent.Semaphore;

public class SemaphoreExample {
    private final Semaphore semaphore;

    public SemaphoreExample(int permits) {
        this.semaphore = new Semaphore(permits);
    }

    public void accessResource() {
        try {
            semaphore.acquire();
            System.out.println(Thread.currentThread().getName() + " acquired permit");
            // Access limited resource
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            System.out.println(Thread.currentThread().getName() + " released permit");
            semaphore.release();
        }
    }

    public boolean tryAccessResource() {
        if (semaphore.tryAcquire()) {
            try {
                // Access resource
                return true;
            } finally {
                semaphore.release();
            }
        }
        return false;
    }
}
```

### Concurrent Collections

```java
import java.util.concurrent.*;

public class ConcurrentCollectionsExample {
    public void demonstrateCollections() {
        // ConcurrentHashMap
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        map.put("key", 1);
        map.putIfAbsent("key", 2); // Atomic operation
        map.compute("key", (k, v) -> v == null ? 1 : v + 1);
        map.merge("key", 1, Integer::sum);

        // CopyOnWriteArrayList - Good for read-heavy scenarios
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
        list.add("item1");
        list.add("item2");

        // BlockingQueue implementations
        BlockingQueue<String> linkedQueue = new LinkedBlockingQueue<>();
        BlockingQueue<String> arrayQueue = new ArrayBlockingQueue<>(100);
        BlockingQueue<String> priorityQueue = new PriorityBlockingQueue<>();

        // Producer
        new Thread(() -> {
            try {
                linkedQueue.put("message");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        // Consumer
        new Thread(() -> {
            try {
                String message = linkedQueue.take();
                System.out.println("Received: " + message);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        // ConcurrentSkipListMap - Sorted concurrent map
        ConcurrentSkipListMap<Integer, String> skipListMap = new ConcurrentSkipListMap<>();
        skipListMap.put(1, "one");
        skipListMap.put(2, "two");
    }
}
```

## Thread Pools and Executors

### Executor Framework

```java
import java.util.concurrent.*;

public class ExecutorExample {
    public void demonstrateExecutors() {
        // Fixed thread pool
        ExecutorService fixedPool = Executors.newFixedThreadPool(4);

        // Cached thread pool
        ExecutorService cachedPool = Executors.newCachedThreadPool();

        // Single thread executor
        ExecutorService singleExecutor = Executors.newSingleThreadExecutor();

        // Scheduled executor
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        // Submit tasks
        fixedPool.submit(() -> {
            System.out.println("Task executing in: " + Thread.currentThread().getName());
        });

        // Execute with Future
        Future<Integer> future = fixedPool.submit(() -> {
            Thread.sleep(1000);
            return 42;
        });

        try {
            Integer result = future.get(); // Blocking call
            System.out.println("Result: " + result);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        // Shutdown
        fixedPool.shutdown();
        try {
            if (!fixedPool.awaitTermination(60, TimeUnit.SECONDS)) {
                fixedPool.shutdownNow();
            }
        } catch (InterruptedException e) {
            fixedPool.shutdownNow();
        }
    }
}
```

### ThreadPoolExecutor

```java
import java.util.concurrent.*;

public class CustomThreadPoolExample {
    public ThreadPoolExecutor createCustomPool() {
        int corePoolSize = 2;
        int maximumPoolSize = 4;
        long keepAliveTime = 60L;
        TimeUnit unit = TimeUnit.SECONDS;
        BlockingQueue<Runnable> workQueue = new LinkedBlockingQueue<>(100);
        ThreadFactory threadFactory = new ThreadFactory() {
            private int counter = 0;

            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, "CustomThread-" + counter++);
                thread.setDaemon(false);
                return thread;
            }
        };
        RejectedExecutionHandler handler = new ThreadPoolExecutor.CallerRunsPolicy();

        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            corePoolSize,
            maximumPoolSize,
            keepAliveTime,
            unit,
            workQueue,
            threadFactory,
            handler
        );

        // Configure
        executor.allowCoreThreadTimeOut(true);
        executor.prestartAllCoreThreads();

        return executor;
    }

    public void monitorThreadPool(ThreadPoolExecutor executor) {
        System.out.println("Active threads: " + executor.getActiveCount());
        System.out.println("Pool size: " + executor.getPoolSize());
        System.out.println("Queue size: " + executor.getQueue().size());
        System.out.println("Completed tasks: " + executor.getCompletedTaskCount());
    }
}
```

### ScheduledExecutorService

```java
import java.util.concurrent.*;

public class ScheduledExecutorExample {
    public void demonstrateScheduling() {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        // Execute once after delay
        scheduler.schedule(() -> {
            System.out.println("Executed after 5 seconds");
        }, 5, TimeUnit.SECONDS);

        // Execute periodically with fixed rate
        ScheduledFuture<?> fixedRate = scheduler.scheduleAtFixedRate(() -> {
            System.out.println("Fixed rate task: " + System.currentTimeMillis());
        }, 0, 2, TimeUnit.SECONDS);

        // Execute periodically with fixed delay
        ScheduledFuture<?> fixedDelay = scheduler.scheduleWithFixedDelay(() -> {
            System.out.println("Fixed delay task: " + System.currentTimeMillis());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, 0, 2, TimeUnit.SECONDS);

        // Cancel after some time
        scheduler.schedule(() -> {
            fixedRate.cancel(false);
            fixedDelay.cancel(false);
        }, 10, TimeUnit.SECONDS);
    }
}
```

### Callable and Future

```java
import java.util.concurrent.*;
import java.util.ArrayList;
import java.util.List;

public class CallableFutureExample {
    public void demonstrateCallable() throws InterruptedException, ExecutionException {
        ExecutorService executor = Executors.newFixedThreadPool(3);

        // Single Callable
        Callable<String> task = () -> {
            Thread.sleep(1000);
            return "Task completed";
        };

        Future<String> future = executor.submit(task);

        // Check status
        if (!future.isDone()) {
            System.out.println("Task is still running");
        }

        // Get result with timeout
        try {
            String result = future.get(2, TimeUnit.SECONDS);
            System.out.println(result);
        } catch (TimeoutException e) {
            future.cancel(true);
        }

        // Multiple tasks with invokeAll
        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            final int taskId = i;
            tasks.add(() -> {
                Thread.sleep(1000);
                return taskId * taskId;
            });
        }

        List<Future<Integer>> results = executor.invokeAll(tasks);
        for (Future<Integer> result : results) {
            System.out.println("Result: " + result.get());
        }

        // invokeAny - returns first completed result
        Integer firstResult = executor.invokeAny(tasks);
        System.out.println("First result: " + firstResult);

        executor.shutdown();
    }
}
```

## CompletableFuture

CompletableFuture provides a powerful API for asynchronous programming and composing async operations.

### Basic Usage

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class CompletableFutureBasics {
    public void basicOperations() throws ExecutionException, InterruptedException {
        // Create completed future
        CompletableFuture<String> completedFuture =
            CompletableFuture.completedFuture("Hello");

        // Async computation
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "Result";
        });

        // Run async without return value
        CompletableFuture<Void> runFuture = CompletableFuture.runAsync(() -> {
            System.out.println("Running async task");
        });

        // Get result (blocking)
        String result = future.get();
        System.out.println(result);

        // Get with timeout
        String timeoutResult = future.get(2, TimeUnit.SECONDS);

        // Non-blocking - get immediately or default
        String immediate = future.getNow("default value");

        // Manually complete
        CompletableFuture<String> manual = new CompletableFuture<>();
        manual.complete("Manual result");

        // Complete exceptionally
        CompletableFuture<String> exceptional = new CompletableFuture<>();
        exceptional.completeExceptionally(new RuntimeException("Error"));
    }
}
```

### Chaining and Composition

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureChaining {
    public void demonstrateChaining() {
        // thenApply - transform result
        CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> 5)
            .thenApply(x -> x * 2)
            .thenApply(x -> x + 10);

        // thenAccept - consume result
        CompletableFuture.supplyAsync(() -> "Hello")
            .thenAccept(result -> System.out.println("Result: " + result));

        // thenRun - run after completion
        CompletableFuture.supplyAsync(() -> "Data")
            .thenRun(() -> System.out.println("Task completed"));

        // thenCompose - flatten nested futures
        CompletableFuture<String> composed = CompletableFuture.supplyAsync(() -> "User123")
            .thenCompose(userId -> fetchUserDetails(userId));

        // thenCombine - combine two independent futures
        CompletableFuture<Integer> future1 = CompletableFuture.supplyAsync(() -> 10);
        CompletableFuture<Integer> future2 = CompletableFuture.supplyAsync(() -> 20);

        CompletableFuture<Integer> combined = future1.thenCombine(future2, (a, b) -> a + b);

        // thenAcceptBoth - consume both results
        future1.thenAcceptBoth(future2, (a, b) -> {
            System.out.println("Sum: " + (a + b));
        });

        // allOf - wait for all futures
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(future1, future2, composed);

        // anyOf - wait for any future
        CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(future1, future2);
    }

    private CompletableFuture<String> fetchUserDetails(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate API call
            return "User details for: " + userId;
        });
    }
}
```

### Error Handling

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureErrorHandling {
    public void demonstrateErrorHandling() {
        // exceptionally - handle exceptions
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("Random failure");
            }
            return "Success";
        }).exceptionally(ex -> {
            System.err.println("Error: " + ex.getMessage());
            return "Default value";
        });

        // handle - transform both result and exception
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            throw new RuntimeException("Error");
        }).handle((result, ex) -> {
            if (ex != null) {
                return "Error occurred: " + ex.getMessage();
            }
            return result;
        });

        // whenComplete - consume result or exception
        CompletableFuture.supplyAsync(() -> "Result")
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    System.err.println("Failed: " + ex.getMessage());
                } else {
                    System.out.println("Succeeded: " + result);
                }
            });
    }
}
```

### Advanced Patterns

```java
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.stream.Collectors;

public class CompletableFutureAdvanced {
    // Sequential chaining
    public CompletableFuture<String> sequentialProcessing(String input) {
        return CompletableFuture.supplyAsync(() -> fetchData(input))
            .thenApply(data -> processData(data))
            .thenApply(processed -> saveData(processed))
            .thenApply(saved -> "Processing complete: " + saved);
    }

    // Parallel processing
    public CompletableFuture<List<String>> parallelProcessing(List<String> items) {
        List<CompletableFuture<String>> futures = items.stream()
            .map(item -> CompletableFuture.supplyAsync(() -> process(item)))
            .collect(Collectors.toList());

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList()));
    }

    // Timeout handling
    public CompletableFuture<String> withTimeout(String input) {
        return CompletableFuture.supplyAsync(() -> slowOperation(input))
            .orTimeout(5, TimeUnit.SECONDS)
            .exceptionally(ex -> "Operation timed out");
    }

    // Retry logic
    public CompletableFuture<String> withRetry(String input, int maxRetries) {
        return CompletableFuture.supplyAsync(() -> unreliableOperation(input))
            .exceptionally(ex -> {
                if (maxRetries > 0) {
                    return withRetry(input, maxRetries - 1).join();
                }
                throw new RuntimeException("Max retries exceeded", ex);
            });
    }

    // Helper methods
    private String fetchData(String input) { return "data"; }
    private String processData(String data) { return "processed"; }
    private String saveData(String data) { return "saved"; }
    private String process(String item) { return item.toUpperCase(); }
    private String slowOperation(String input) {
        try { Thread.sleep(10000); } catch (InterruptedException e) {}
        return "result";
    }
    private String unreliableOperation(String input) {
        if (Math.random() > 0.7) throw new RuntimeException("Failed");
        return "success";
    }
}
```

## Best Practices

### Thread Safety Guidelines

1. **Minimize Shared Mutable State**
```java
// Bad - shared mutable state
public class UnsafeCounter {
    private int count = 0;
    public void increment() { count++; } // Race condition
}

// Good - immutable or properly synchronized
public class SafeCounter {
    private final AtomicInteger count = new AtomicInteger(0);
    public void increment() { count.incrementAndGet(); }
}
```

2. **Use Concurrent Collections**
```java
// Bad
Map<String, String> map = Collections.synchronizedMap(new HashMap<>());

// Good
ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
```

3. **Prefer High-Level Constructs**
```java
// Bad - manual thread management
new Thread(() -> doWork()).start();

// Good - use executor service
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> doWork());
```

### Deadlock Prevention

```java
public class DeadlockPrevention {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();

    // Bad - potential deadlock
    public void badMethod1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // Work
            }
        }
    }

    public void badMethod2() {
        synchronized (lock2) {  // Different order!
            synchronized (lock1) {
                // Work
            }
        }
    }

    // Good - consistent lock ordering
    public void goodMethod1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // Work
            }
        }
    }

    public void goodMethod2() {
        synchronized (lock1) {  // Same order
            synchronized (lock2) {
                // Work
            }
        }
    }

    // Better - use tryLock with timeout
    private final Lock l1 = new ReentrantLock();
    private final Lock l2 = new ReentrantLock();

    public void betterMethod() throws InterruptedException {
        while (true) {
            if (l1.tryLock(100, TimeUnit.MILLISECONDS)) {
                try {
                    if (l2.tryLock(100, TimeUnit.MILLISECONDS)) {
                        try {
                            // Work
                            return;
                        } finally {
                            l2.unlock();
                        }
                    }
                } finally {
                    l1.unlock();
                }
            }
            // Back off and retry
            Thread.sleep(100);
        }
    }
}
```

### Resource Management

```java
public class ResourceManagement {
    // Always shutdown executors
    public void properShutdown() {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        try {
            // Use executor
            executor.submit(() -> doWork());
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                    if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                        System.err.println("Executor did not terminate");
                    }
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    // Handle interruptions properly
    public void handleInterruptions() {
        try {
            while (!Thread.currentThread().isInterrupted()) {
                // Work
                Thread.sleep(1000);
            }
        } catch (InterruptedException e) {
            // Restore interrupt status
            Thread.currentThread().interrupt();
            // Clean up
        }
    }

    private void doWork() {}
}
```

### Performance Considerations

```java
public class PerformanceGuidelines {
    // Minimize lock contention
    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    public String getValue(String key) {
        return cache.computeIfAbsent(key, k -> expensiveComputation(k));
    }

    // Use appropriate pool sizes
    public ExecutorService createOptimalPool() {
        int processors = Runtime.getRuntime().availableProcessors();
        // CPU-intensive: processors or processors + 1
        // I/O-intensive: processors * 2 or more
        return Executors.newFixedThreadPool(processors * 2);
    }

    // Batch operations
    public void batchProcessing(List<String> items) {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        int batchSize = 100;

        for (int i = 0; i < items.size(); i += batchSize) {
            List<String> batch = items.subList(i,
                Math.min(i + batchSize, items.size()));
            executor.submit(() -> processBatch(batch));
        }

        executor.shutdown();
    }

    private String expensiveComputation(String key) { return key; }
    private void processBatch(List<String> batch) {}
}
```

## Summary

Java concurrency is a complex but essential topic for building high-performance applications. Key takeaways:

- **Use high-level abstractions** like ExecutorService and CompletableFuture when possible
- **Minimize shared mutable state** to reduce synchronization needs
- **Prefer concurrent collections** over synchronized wrappers
- **Always handle InterruptedException** properly
- **Shut down executors** to prevent resource leaks
- **Be aware of deadlock risks** and use consistent lock ordering
- **Choose appropriate synchronization mechanisms** based on your use case
- **Test concurrent code thoroughly** as race conditions are hard to reproduce

The Java concurrency framework provides powerful tools for parallel programming, but requires careful design and implementation to avoid common pitfalls like race conditions, deadlocks, and performance bottlenecks.
