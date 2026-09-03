---
title: Java Lock 接口详解
description: 深入理解 Java Lock 接口体系：Lock、ReentrantLock、ReadWriteLock、StampedLock、Condition 与 tryLock 机制
track: java
section: concurrency
difficulty: advanced
tags:
  - Java
  - 并发
  - Lock
  - ReentrantLock
  - ReadWriteLock
  - StampedLock
status: imported
origin: old/src/content/docs/java/lock-interfaces.en.md
divergence: 0.189
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: 并发编程
  order: 6
  lastUpdated: 2026-01-07
---

## Concept Overview

The Lock interface is an explicit locking mechanism introduced in Java 5, located in the `java.util.concurrent.locks` package. It provides more flexible and powerful thread synchronization capabilities than the `synchronized` keyword.

### Historical Background

Before Java 5, thread synchronization could only rely on the `synchronized` keyword. While `synchronized` is simple and easy to use, it has the following limitations:

- **Non-interruptible**: Threads cannot respond to interrupts while waiting to acquire a lock
- **No timeout**: Cannot set a timeout for lock acquisition
- **No try-lock**: Cannot attempt to acquire a lock without blocking
- **Single condition**: Can only use one implicit wait/notify condition

The `java.util.concurrent.locks` package designed by Doug Lea addresses these issues, providing finer-grained lock control.

### Problems It Solves

The Lock interface and its implementations primarily solve the following problems:

1. **Flexible lock acquisition**: Supports interruptible, timed, and try-lock acquisition methods
2. **Fairness control**: Supports choice between fair and unfair locks
3. **Multiple condition waiting**: Supports multiple Condition objects for more refined thread coordination
4. **Read-write separation**: ReadWriteLock supports separate read and write locks to improve concurrent performance
5. **Optimistic reading**: StampedLock supports optimistic read mode, further improving performance in read-heavy scenarios

## Core Principles

### Underlying Mechanism of Lock Interface

Lock implementation is based on the **AbstractQueuedSynchronizer (AQS)** framework. AQS is a foundational framework for building locks and synchronizers. It uses a `volatile int state` variable to represent synchronization state and manages waiting threads through a **CLH queue** (a FIFO doubly-linked list).

```
+--------+    +--------+    +--------+    +--------+
|  Head  | -> | Node 1 | -> | Node 2 | -> |  Tail  |
| (dummy)|    | Thread1|    | Thread2|    | ThreadN|
+--------+    +--------+    +--------+    +--------+
```

### AQS Core Mechanism

```java
// Simplified AQS core code
public abstract class AbstractQueuedSynchronizer {
    // Synchronization state
    private volatile int state;

    // Acquire exclusive lock
    public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }

    // Release exclusive lock
    public final boolean release(int arg) {
        if (tryRelease(arg)) {
            Node h = head;
            if (h != null && h.waitStatus != 0)
                unparkSuccessor(h);
            return true;
        }
        return false;
    }

    // Template methods to be implemented by subclasses
    protected boolean tryAcquire(int arg) {
        throw new UnsupportedOperationException();
    }

    protected boolean tryRelease(int arg) {
        throw new UnsupportedOperationException();
    }
}
```

### Memory Semantics of Locks

The `lock()` and `unlock()` methods of Lock have the same memory semantics as volatile variable reads and writes:

- **lock()** operation: Has volatile read memory semantics, reads shared variables from main memory
- **unlock()** operation: Has volatile write memory semantics, flushes modifications to main memory

This ensures that operations between lock and unlock are visible to other threads.

## Key Points

### Lock Interface Core Methods

| Method | Description | Characteristics |
|--------|-------------|-----------------|
| `lock()` | Acquires lock, blocks until successful | Non-interruptible |
| `lockInterruptibly()` | Acquires lock interruptibly | Responds to interrupts |
| `tryLock()` | Attempts non-blocking lock acquisition | Returns immediately |
| `tryLock(time, unit)` | Timed lock acquisition | Configurable wait time |
| `unlock()` | Releases lock | Must be called in finally |
| `newCondition()` | Creates condition variable | Supports multiple condition waiting |

### Lock Interface Family

```
                    Lock (interface)
                        |
        +---------------+---------------+
        |                               |
  ReentrantLock                   ReadWriteLock (interface)
   (reentrant lock)                     |
                                 ReentrantReadWriteLock
                                   (reentrant read-write lock)

        StampedLock (standalone class, not Lock interface implementation)
        (read-write lock + optimistic read)
```

### Lock Type Comparison

| Feature | synchronized | ReentrantLock | ReadWriteLock | StampedLock |
|---------|-------------|---------------|---------------|-------------|
| Implementation | JVM built-in | Java implementation | Java implementation | Java implementation |
| Interruptible | No | Yes | Yes | Yes |
| Timed | No | Yes | Yes | Yes |
| Fair lock | No | Optional | Optional | No |
| Condition variables | Single | Multiple | Multiple | Not supported |
| Reentrant | Yes | Yes | Yes | No |
| Optimistic read | No | No | No | Yes |
| Lock upgrade | - | - | Not supported | Supported |
| Lock downgrade | - | - | Supported | Supported |

## Code Examples

### Basic Lock Interface Usage

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class LockBasicExample {
    private final Lock lock = new ReentrantLock();
    private int count = 0;

    /**
     * Standard Lock usage pattern
     * Note: unlock() must be placed in finally block to ensure release
     */
    public void increment() {
        lock.lock();  // Acquire lock
        try {
            count++;
            System.out.println(Thread.currentThread().getName() + ": " + count);
        } finally {
            lock.unlock();  // Must release lock in finally
        }
    }

    public int getCount() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        LockBasicExample example = new LockBasicExample();

        // Create multiple threads for concurrent access
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    example.increment();
                }
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread t : threads) {
            t.join();
        }

        System.out.println("Final count: " + example.getCount());
    }
}
```

### ReentrantLock Advanced Features

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockAdvanced {
    // Fair lock: acquires lock in request order
    private final ReentrantLock fairLock = new ReentrantLock(true);

    // Unfair lock (default): allows barging, better performance
    private final ReentrantLock unfairLock = new ReentrantLock(false);

    /**
     * Interruptible lock acquisition
     * Thread can respond to interrupts while waiting for lock
     */
    public void interruptibleLock() throws InterruptedException {
        fairLock.lockInterruptibly();
        try {
            System.out.println("Acquired interruptible lock");
            Thread.sleep(1000);
        } finally {
            fairLock.unlock();
        }
    }

    /**
     * tryLock() non-blocking lock acquisition
     * Returns immediately without blocking the thread
     */
    public boolean tryLockExample() {
        if (unfairLock.tryLock()) {
            try {
                System.out.println(Thread.currentThread().getName() + " acquired lock successfully");
                return true;
            } finally {
                unfairLock.unlock();
            }
        } else {
            System.out.println(Thread.currentThread().getName() + " failed to acquire lock, executing alternative logic");
            return false;
        }
    }

    /**
     * tryLock(timeout) timed lock acquisition
     * Attempts to acquire lock within specified time
     */
    public boolean tryLockWithTimeout() {
        try {
            // Wait up to 2 seconds
            if (unfairLock.tryLock(2, TimeUnit.SECONDS)) {
                try {
                    System.out.println("Acquired lock before timeout");
                    return true;
                } finally {
                    unfairLock.unlock();
                }
            } else {
                System.out.println("Timeout waiting for lock");
                return false;
            }
        } catch (InterruptedException e) {
            System.out.println("Interrupted while waiting for lock");
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Demonstrates lock reentrancy
     * Same thread can acquire the same lock multiple times
     */
    public void reentrantDemo() {
        unfairLock.lock();  // First acquisition
        try {
            System.out.println("First level lock, hold count: " + unfairLock.getHoldCount());

            unfairLock.lock();  // Second acquisition (reentrant)
            try {
                System.out.println("Second level lock, hold count: " + unfairLock.getHoldCount());

                unfairLock.lock();  // Third acquisition
                try {
                    System.out.println("Third level lock, hold count: " + unfairLock.getHoldCount());
                } finally {
                    unfairLock.unlock();
                }

            } finally {
                unfairLock.unlock();
            }

        } finally {
            unfairLock.unlock();
        }
        System.out.println("After full release, hold count: " + unfairLock.getHoldCount());
    }

    /**
     * Lock status query
     */
    public void lockStatusQuery() {
        System.out.println("Is fair lock: " + fairLock.isFair());
        System.out.println("Is locked: " + fairLock.isLocked());
        System.out.println("Is held by current thread: " + fairLock.isHeldByCurrentThread());
        System.out.println("Queue length: " + fairLock.getQueueLength());
    }

    public static void main(String[] args) {
        ReentrantLockAdvanced demo = new ReentrantLockAdvanced();

        System.out.println("=== Reentrancy Demo ===");
        demo.reentrantDemo();

        System.out.println("\n=== tryLock Demo ===");
        demo.tryLockExample();

        System.out.println("\n=== Lock Status Query ===");
        demo.lockStatusQuery();
    }
}
```

### ReadWriteLock Read-Write Lock

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Thread-safe cache implementation based on ReadWriteLock
 * Read operations are shared, write operations are exclusive
 */
public class ReadWriteLockCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();

    /**
     * Read from cache - allows multiple threads to read simultaneously
     */
    public V get(K key) {
        rwLock.readLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " reading: " + key);
            simulateDelay(100);  // Simulate time-consuming operation
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * Write to cache - exclusive access
     */
    public void put(K key, V value) {
        rwLock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " writing: " + key);
            simulateDelay(200);
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Remove from cache - exclusive access
     */
    public V remove(K key) {
        rwLock.writeLock().lock();
        try {
            return cache.remove(key);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Lock downgrade example: downgrade write lock to read lock
     * Use case: need to read data immediately after updating
     */
    public V updateAndGet(K key, V value) {
        rwLock.writeLock().lock();
        try {
            // Update data
            cache.put(key, value);

            // Acquire read lock (allowed while holding write lock)
            rwLock.readLock().lock();
        } finally {
            // Release write lock, downgrade to read lock
            rwLock.writeLock().unlock();
        }

        try {
            // Now only holding read lock, other threads can read concurrently
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * Write with cache check
     * Demonstrates that read lock cannot be upgraded to write lock
     */
    public void putIfAbsent(K key, V value) {
        // First check with read lock
        rwLock.readLock().lock();
        try {
            if (cache.containsKey(key)) {
                return;  // Already exists, return directly
            }
        } finally {
            rwLock.readLock().unlock();
        }

        // Must release read lock before acquiring write lock (upgrade not supported)
        rwLock.writeLock().lock();
        try {
            // Double-check, as another thread might have written after releasing read lock
            if (!cache.containsKey(key)) {
                cache.put(key, value);
            }
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public int size() {
        rwLock.readLock().lock();
        try {
            return cache.size();
        } finally {
            rwLock.readLock().unlock();
        }
    }

    private void simulateDelay(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        ReadWriteLockCache<String, String> cache = new ReadWriteLockCache<>();

        // Initialize data
        cache.put("key1", "value1");
        cache.put("key2", "value2");

        // Start multiple reader threads
        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                for (int j = 0; j < 3; j++) {
                    cache.get("key1");
                }
            }, "Reader-" + i).start();
        }

        // Start writer thread
        new Thread(() -> {
            cache.put("key3", "value3");
        }, "Writer").start();

        Thread.sleep(3000);
        System.out.println("Cache size: " + cache.size());
    }
}
```

### StampedLock Optimistic Read Lock

```java
import java.util.concurrent.locks.StampedLock;

/**
 * StampedLock example
 * Supports three access modes: write lock, pessimistic read lock, optimistic read
 */
public class StampedLockExample {
    private final StampedLock sl = new StampedLock();
    private double x, y;  // 2D coordinate point

    /**
     * Write operation - exclusive access
     */
    public void move(double deltaX, double deltaY) {
        // Acquire write lock, returns a stamp
        long stamp = sl.writeLock();
        try {
            x += deltaX;
            y += deltaY;
            System.out.println("Moved to: (" + x + ", " + y + ")");
        } finally {
            // Use stamp to release lock
            sl.unlockWrite(stamp);
        }
    }

    /**
     * Optimistic read - best performance read method
     * Does not block writers, but requires data consistency validation
     */
    public double distanceFromOrigin() {
        // Get optimistic read stamp (not a real lock)
        long stamp = sl.tryOptimisticRead();

        // Read data into local variables
        double currentX = x;
        double currentY = y;

        // Validate whether there was a write operation during reading
        if (!sl.validate(stamp)) {
            // Optimistic read failed, upgrade to pessimistic read lock
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }

        // Use the read data for calculation
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }

    /**
     * Pessimistic read - traditional read lock approach
     */
    public double[] getPosition() {
        long stamp = sl.readLock();
        try {
            return new double[]{x, y};
        } finally {
            sl.unlockRead(stamp);
        }
    }

    /**
     * Lock upgrade example: upgrade read lock to write lock
     * Suitable for conditional update scenarios
     */
    public void moveIfAtOrigin(double newX, double newY) {
        // First acquire read lock
        long stamp = sl.readLock();
        try {
            // Check condition
            while (x == 0.0 && y == 0.0) {
                // Try to upgrade to write lock
                long ws = sl.tryConvertToWriteLock(stamp);
                if (ws != 0L) {
                    // Upgrade successful
                    stamp = ws;
                    x = newX;
                    y = newY;
                    break;
                } else {
                    // Upgrade failed, release read lock, acquire write lock
                    sl.unlockRead(stamp);
                    stamp = sl.writeLock();
                    // Note: must recheck condition after acquiring write lock
                }
            }
        } finally {
            sl.unlock(stamp);  // Generic unlock method
        }
    }

    /**
     * Lock downgrade example
     */
    public void setAndGet(double newX, double newY) {
        long stamp = sl.writeLock();
        try {
            x = newX;
            y = newY;

            // Downgrade to read lock
            stamp = sl.tryConvertToReadLock(stamp);
            if (stamp == 0L) {
                throw new IllegalStateException("Lock downgrade failed");
            }

            // Now can continue reading, other threads can also read concurrently
            System.out.println("Set and read: (" + x + ", " + y + ")");
        } finally {
            sl.unlock(stamp);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        StampedLockExample point = new StampedLockExample();

        // Optimistic reader thread
        Thread reader = new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                double distance = point.distanceFromOrigin();
                System.out.println("Distance from origin: " + distance);
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    break;
                }
            }
        });

        // Writer thread
        Thread writer = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                point.move(1.0, 1.0);
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    break;
                }
            }
        });

        reader.start();
        writer.start();

        reader.join();
        writer.join();
    }
}
```

### Condition Variables

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Producer-Consumer pattern using Condition
 * Multiple condition variables for finer thread coordination
 */
public class ConditionBoundedBuffer<T> {
    private final Queue<T> buffer = new LinkedList<>();
    private final int capacity;

    private final Lock lock = new ReentrantLock();
    // Two condition variables: not full and not empty
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public ConditionBoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    /**
     * Producer: add element
     */
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            // Wait when buffer is full
            while (buffer.size() == capacity) {
                System.out.println(Thread.currentThread().getName() + " waiting: buffer is full");
                notFull.await();
            }

            buffer.offer(item);
            System.out.println(Thread.currentThread().getName() + " added: " + item +
                             ", buffer size: " + buffer.size());

            // Notify waiting consumers
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    /**
     * Consumer: take element
     */
    public T take() throws InterruptedException {
        lock.lock();
        try {
            // Wait when buffer is empty
            while (buffer.isEmpty()) {
                System.out.println(Thread.currentThread().getName() + " waiting: buffer is empty");
                notEmpty.await();
            }

            T item = buffer.poll();
            System.out.println(Thread.currentThread().getName() + " took: " + item +
                             ", buffer size: " + buffer.size());

            // Notify waiting producers
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Take operation with timeout
     */
    public T poll(long timeout, java.util.concurrent.TimeUnit unit)
            throws InterruptedException {
        long nanosTimeout = unit.toNanos(timeout);
        lock.lock();
        try {
            while (buffer.isEmpty()) {
                if (nanosTimeout <= 0L) {
                    return null;  // Return null on timeout
                }
                // awaitNanos returns remaining wait time
                nanosTimeout = notEmpty.awaitNanos(nanosTimeout);
            }
            T item = buffer.poll();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return buffer.size();
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        ConditionBoundedBuffer<Integer> buffer = new ConditionBoundedBuffer<>(5);

        // Producer thread
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    buffer.put(i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Producer");

        // Consumer thread
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    buffer.take();
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

### Condition for Precise Thread Wakeup

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Using multiple Conditions for precise thread wakeup
 * Example: three threads taking turns printing A, B, C
 */
public class ConditionPreciseWakeup {
    private final Lock lock = new ReentrantLock();
    private final Condition conditionA = lock.newCondition();
    private final Condition conditionB = lock.newCondition();
    private final Condition conditionC = lock.newCondition();

    private int currentThread = 1;  // 1:A, 2:B, 3:C

    public void printA() {
        lock.lock();
        try {
            while (currentThread != 1) {
                conditionA.await();
            }
            System.out.print("A");
            currentThread = 2;
            conditionB.signal();  // Precisely wake up thread B
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    public void printB() {
        lock.lock();
        try {
            while (currentThread != 2) {
                conditionB.await();
            }
            System.out.print("B");
            currentThread = 3;
            conditionC.signal();  // Precisely wake up thread C
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    public void printC() {
        lock.lock();
        try {
            while (currentThread != 3) {
                conditionC.await();
            }
            System.out.println("C");
            currentThread = 1;
            conditionA.signal();  // Precisely wake up thread A
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        ConditionPreciseWakeup printer = new ConditionPreciseWakeup();

        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                printer.printA();
            }
        }, "Thread-A").start();

        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                printer.printB();
            }
        }, "Thread-B").start();

        new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                printer.printC();
            }
        }, "Thread-C").start();
    }
}
```

### Using tryLock to Avoid Deadlock

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Example of using tryLock to avoid deadlock
 */
public class DeadlockAvoidance {
    private final Lock lock1 = new ReentrantLock();
    private final Lock lock2 = new ReentrantLock();

    /**
     * Traditional approach that may cause deadlock
     */
    public void deadlockProne1() {
        lock1.lock();
        try {
            Thread.sleep(100);
            lock2.lock();
            try {
                System.out.println("Operation 1 completed");
            } finally {
                lock2.unlock();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock1.unlock();
        }
    }

    public void deadlockProne2() {
        lock2.lock();  // Note: acquiring locks in reverse order
        try {
            Thread.sleep(100);
            lock1.lock();
            try {
                System.out.println("Operation 2 completed");
            } finally {
                lock1.unlock();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock2.unlock();
        }
    }

    /**
     * Using tryLock to avoid deadlock
     */
    public boolean safeOperation() {
        boolean gotLock1 = false;
        boolean gotLock2 = false;

        try {
            // Try to acquire both locks with timeout
            gotLock1 = lock1.tryLock(100, TimeUnit.MILLISECONDS);
            gotLock2 = lock2.tryLock(100, TimeUnit.MILLISECONDS);

            if (gotLock1 && gotLock2) {
                // Successfully acquired both locks, execute business logic
                System.out.println(Thread.currentThread().getName() + " successfully acquired both locks");
                return true;
            } else {
                // Failed to acquire all locks, release already acquired locks
                System.out.println(Thread.currentThread().getName() + " failed to acquire locks, will retry later");
                return false;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } finally {
            // Release acquired locks
            if (gotLock2) {
                lock2.unlock();
            }
            if (gotLock1) {
                lock1.unlock();
            }
        }
    }

    /**
     * Safe operation with retry
     */
    public boolean safeOperationWithRetry(int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            if (safeOperation()) {
                return true;
            }
            // Random wait to avoid livelock
            try {
                Thread.sleep((long) (Math.random() * 100));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    public static void main(String[] args) throws InterruptedException {
        DeadlockAvoidance demo = new DeadlockAvoidance();

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                demo.safeOperationWithRetry(3);
            }
        }, "Thread-1");

        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                demo.safeOperationWithRetry(3);
            }
        }, "Thread-2");

        t1.start();
        t2.start();

        t1.join();
        t2.join();

        System.out.println("All operations completed");
    }
}
```

## Best Practices

### Always Release Lock in finally Block

```java
// Correct example
Lock lock = new ReentrantLock();
lock.lock();
try {
    // Business logic
} finally {
    lock.unlock();  // Ensure lock is released
}

// Wrong example - may cause lock leak
lock.lock();
// Business logic
lock.unlock();  // Won't execute if exception is thrown
```

### Using try-with-resources Style (Custom Wrapper)

```java
/**
 * AutoCloseable wrapped lock
 */
public class AutoLock implements AutoCloseable {
    private final Lock lock;

    public AutoLock(Lock lock) {
        this.lock = lock;
        lock.lock();
    }

    @Override
    public void close() {
        lock.unlock();
    }

    public static AutoLock acquire(Lock lock) {
        return new AutoLock(lock);
    }
}

// Usage example
Lock lock = new ReentrantLock();
try (AutoLock ignored = AutoLock.acquire(lock)) {
    // Business logic
}  // Lock automatically released
```

### Choose the Right Lock for the Scenario

```java
public class LockSelectionGuide {
    // Scenario 1: Simple mutual exclusion, high performance requirement
    // Choice: synchronized (good performance after JVM optimization)
    public synchronized void simpleSync() {
        // Simple operation
    }

    // Scenario 2: Need interruptible, timed, or try-lock
    // Choice: ReentrantLock
    private final ReentrantLock reentrantLock = new ReentrantLock();
    public void flexibleLocking() throws InterruptedException {
        if (reentrantLock.tryLock(1, TimeUnit.SECONDS)) {
            try {
                // Operation
            } finally {
                reentrantLock.unlock();
            }
        }
    }

    // Scenario 3: Read-heavy, write-light
    // Choice: ReadWriteLock or StampedLock
    private final java.util.concurrent.locks.ReadWriteLock rwLock =
        new java.util.concurrent.locks.ReentrantReadWriteLock();

    public void readHeavyOperation() {
        rwLock.readLock().lock();
        try {
            // Read operation
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // Scenario 4: Extremely high read performance requirement
    // Choice: StampedLock optimistic read
    private final java.util.concurrent.locks.StampedLock stampedLock =
        new java.util.concurrent.locks.StampedLock();

    public Object optimisticRead() {
        long stamp = stampedLock.tryOptimisticRead();
        Object data = readData();
        if (!stampedLock.validate(stamp)) {
            stamp = stampedLock.readLock();
            try {
                data = readData();
            } finally {
                stampedLock.unlockRead(stamp);
            }
        }
        return data;
    }

    private Object readData() {
        return new Object();
    }
}
```

### Fair vs Unfair Lock Selection

```java
/**
 * Fair vs Unfair lock selection guide
 */
public class FairVsUnfairLock {
    // Unfair lock (default) - preferred choice in most cases
    // Pros: Higher throughput
    // Cons: May cause thread starvation
    private final ReentrantLock unfairLock = new ReentrantLock(false);

    // Fair lock - for special scenarios
    // Pros: Avoids thread starvation, predictable order
    // Cons: Lower throughput
    private final ReentrantLock fairLock = new ReentrantLock(true);

    /**
     * When to use fair lock:
     * 1. Threads hold lock for longer periods
     * 2. Longer intervals between lock requests
     * 3. Strict FIFO order required
     * 4. Thread starvation cannot be tolerated
     */
}
```

### Reduce Lock Granularity

```java
/**
 * Lock granularity optimization example
 */
public class LockGranularity {
    // Coarse-grained lock - simple but low concurrency
    private final Object coarseLock = new Object();
    private int value1;
    private int value2;

    public void coarseGrained() {
        synchronized (coarseLock) {
            value1++;
            value2++;
        }
    }

    // Fine-grained lock - complex but high concurrency
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();

    public void fineGrained() {
        synchronized (lock1) {
            value1++;
        }
        synchronized (lock2) {
            value2++;
        }
    }

    // Segmented lock - technique used by ConcurrentHashMap
    private static final int SEGMENT_COUNT = 16;
    private final Object[] segmentLocks = new Object[SEGMENT_COUNT];

    {
        for (int i = 0; i < SEGMENT_COUNT; i++) {
            segmentLocks[i] = new Object();
        }
    }

    public void segmentedLock(int key) {
        int segment = key % SEGMENT_COUNT;
        synchronized (segmentLocks[segment]) {
            // Only locks corresponding segment
        }
    }
}
```

## Common Pitfalls

### Forgetting to Release Lock

```java
// Wrong: lock won't be released on exception
public void badExample() {
    lock.lock();
    doSomething();  // If exception is thrown
    lock.unlock();  // This line will never execute
}

// Correct: use finally to ensure release
public void goodExample() {
    lock.lock();
    try {
        doSomething();
    } finally {
        lock.unlock();
    }
}
```

### Deadlock from Incorrect Lock Usage

```java
// Deadlock example: acquiring multiple locks in different order
class Account {
    private final ReentrantLock lock = new ReentrantLock();
    private int balance;

    // May cause deadlock
    public void transferBad(Account to, int amount) {
        this.lock.lock();  // Thread A locks account 1
        try {
            to.lock.lock();  // Waiting for account 2
            try {
                // Transfer logic
            } finally {
                to.lock.unlock();
            }
        } finally {
            this.lock.unlock();
        }
    }
}

// Solution: acquire locks in fixed order
public void transferGood(Account to, int amount) {
    Account first = System.identityHashCode(this) < System.identityHashCode(to) ? this : to;
    Account second = first == this ? to : this;

    first.lock.lock();
    try {
        second.lock.lock();
        try {
            // Transfer logic
        } finally {
            second.lock.unlock();
        }
    } finally {
        first.lock.unlock();
    }
}
```

### ReadWriteLock Upgrade Failure

```java
// Wrong: read lock cannot be upgraded to write lock
public void badUpgrade() {
    rwLock.readLock().lock();
    try {
        if (needsUpdate()) {
            // This will cause deadlock! Acquiring write lock without releasing read lock
            rwLock.writeLock().lock();  // Will block forever
            try {
                update();
            } finally {
                rwLock.writeLock().unlock();
            }
        }
    } finally {
        rwLock.readLock().unlock();
    }
}

// Correct: release read lock first, then acquire write lock
public void goodUpgrade() {
    rwLock.readLock().lock();
    boolean needsUpdate;
    try {
        needsUpdate = needsUpdate();
    } finally {
        rwLock.readLock().unlock();  // Release read lock first
    }

    if (needsUpdate) {
        rwLock.writeLock().lock();
        try {
            // Recheck condition (another thread may have updated)
            if (needsUpdate()) {
                update();
            }
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

### StampedLock Misuse

```java
// Wrong: StampedLock is not reentrant
private final StampedLock sl = new StampedLock();

public void badReentrant() {
    long stamp = sl.writeLock();
    try {
        nestedMethod();  // Acquiring lock again inside will deadlock
    } finally {
        sl.unlockWrite(stamp);
    }
}

private void nestedMethod() {
    long stamp = sl.writeLock();  // Deadlock!
    try {
        // ...
    } finally {
        sl.unlockWrite(stamp);
    }
}

// Wrong: Condition not supported
public void badCondition() {
    // StampedLock does not support Condition
    // Condition condition = sl.newCondition();  // Compilation error
}
```

### Improper Interrupt Handling

```java
// Wrong: swallowing interrupt
public void badInterruptHandling() {
    try {
        lock.lockInterruptibly();
        try {
            doWork();
        } finally {
            lock.unlock();
        }
    } catch (InterruptedException e) {
        // Wrong: swallowing the interrupt
        e.printStackTrace();
    }
}

// Correct: restore interrupt status or throw up
public void goodInterruptHandling() throws InterruptedException {
    lock.lockInterruptibly();
    try {
        doWork();
    } finally {
        lock.unlock();
    }
}

// Or restore interrupt status
public void goodInterruptHandling2() {
    try {
        lock.lockInterruptibly();
        try {
            doWork();
        } finally {
            lock.unlock();
        }
    } catch (InterruptedException e) {
        // Restore interrupt status
        Thread.currentThread().interrupt();
    }
}
```

## Performance Considerations

### Lock Performance Comparison Test

```java
import java.util.concurrent.locks.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Performance comparison of different lock mechanisms
 */
public class LockPerformanceComparison {
    private static final int ITERATIONS = 1_000_000;
    private static final int THREADS = 4;

    private int synchronizedCounter = 0;
    private int lockCounter = 0;
    private final AtomicInteger atomicCounter = new AtomicInteger(0);
    private final ReentrantLock lock = new ReentrantLock();

    public synchronized void synchronizedIncrement() {
        synchronizedCounter++;
    }

    public void lockIncrement() {
        lock.lock();
        try {
            lockCounter++;
        } finally {
            lock.unlock();
        }
    }

    public void atomicIncrement() {
        atomicCounter.incrementAndGet();
    }

    public static void main(String[] args) throws InterruptedException {
        LockPerformanceComparison test = new LockPerformanceComparison();

        // Test synchronized
        long start = System.currentTimeMillis();
        runTest(test::synchronizedIncrement);
        System.out.println("synchronized: " + (System.currentTimeMillis() - start) + "ms");

        // Test ReentrantLock
        start = System.currentTimeMillis();
        runTest(test::lockIncrement);
        System.out.println("ReentrantLock: " + (System.currentTimeMillis() - start) + "ms");

        // Test AtomicInteger
        start = System.currentTimeMillis();
        runTest(test::atomicIncrement);
        System.out.println("AtomicInteger: " + (System.currentTimeMillis() - start) + "ms");
    }

    private static void runTest(Runnable action) throws InterruptedException {
        Thread[] threads = new Thread[THREADS];
        for (int i = 0; i < THREADS; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < ITERATIONS / THREADS; j++) {
                    action.run();
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

### Performance Optimization Recommendations

| Scenario | Recommended Approach | Reason |
|----------|---------------------|--------|
| Simple mutual exclusion | synchronized | JVM optimized, no explicit release risk |
| Read-heavy, write-light | ReadWriteLock / StampedLock | Allows concurrent reads |
| Extremely high read frequency | StampedLock optimistic read | Lock-free reading |
| Simple counter | AtomicInteger | CAS lock-free operation |
| Complex object update | ReentrantLock | Flexible control |
| High contention counting | LongAdder | Segmented to reduce contention |

### Lock Contention Analysis

```java
/**
 * Lock contention monitoring
 */
public class LockContentionMonitor {
    private final ReentrantLock lock = new ReentrantLock();

    public void monitorContention() {
        // Check if threads are waiting
        int queueLength = lock.getQueueLength();

        // Check if threads are waiting on Condition
        // boolean hasWaiters = lock.hasWaiters(condition);

        // Check if lock is held
        boolean isLocked = lock.isLocked();

        // Check if current thread holds the lock
        boolean isHeldByCurrentThread = lock.isHeldByCurrentThread();

        // Get hold count (reentrant)
        int holdCount = lock.getHoldCount();

        System.out.printf(
            "Waiting threads: %d, Locked: %b, Held by current: %b, Hold count: %d%n",
            queueLength, isLocked, isHeldByCurrentThread, holdCount
        );
    }
}
```

## Real-World Scenarios

### Scenario 1: High-Performance Cache

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.StampedLock;

/**
 * High-performance cache using StampedLock
 */
public class HighPerformanceCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final StampedLock sl = new StampedLock();

    /**
     * Optimistic read - highest performance
     */
    public V get(K key) {
        // 1. Try optimistic read
        long stamp = sl.tryOptimisticRead();
        V value = cache.get(key);

        // 2. Validate if there was a write operation
        if (!sl.validate(stamp)) {
            // 3. Optimistic read failed, upgrade to pessimistic read
            stamp = sl.readLock();
            try {
                value = cache.get(key);
            } finally {
                sl.unlockRead(stamp);
            }
        }

        return value;
    }

    /**
     * Write - exclusive lock
     */
    public void put(K key, V value) {
        long stamp = sl.writeLock();
        try {
            cache.put(key, value);
        } finally {
            sl.unlockWrite(stamp);
        }
    }

    /**
     * Compute and cache (with lock upgrade)
     */
    public V computeIfAbsent(K key, java.util.function.Function<K, V> mappingFunction) {
        // 1. Optimistic read check
        long stamp = sl.tryOptimisticRead();
        V value = cache.get(key);

        if (sl.validate(stamp) && value != null) {
            return value;
        }

        // 2. Pessimistic read check
        stamp = sl.readLock();
        try {
            value = cache.get(key);
            if (value != null) {
                return value;
            }

            // 3. Try to upgrade to write lock
            long ws = sl.tryConvertToWriteLock(stamp);
            if (ws != 0L) {
                stamp = ws;
            } else {
                // Upgrade failed, release read lock, acquire write lock
                sl.unlockRead(stamp);
                stamp = sl.writeLock();
                // Recheck
                value = cache.get(key);
                if (value != null) {
                    return value;
                }
            }

            // 4. Compute value and store in cache
            value = mappingFunction.apply(key);
            cache.put(key, value);
            return value;
        } finally {
            sl.unlock(stamp);
        }
    }
}
```

### Scenario 2: Rate Limiter

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Rate limiter based on token bucket algorithm
 */
public class RateLimiter {
    private final Lock lock = new ReentrantLock();
    private final double permitsPerSecond;
    private final double maxPermits;
    private double storedPermits;
    private long lastUpdateTime;

    public RateLimiter(double permitsPerSecond) {
        this(permitsPerSecond, permitsPerSecond);
    }

    public RateLimiter(double permitsPerSecond, double maxPermits) {
        this.permitsPerSecond = permitsPerSecond;
        this.maxPermits = maxPermits;
        this.storedPermits = maxPermits;
        this.lastUpdateTime = System.nanoTime();
    }

    /**
     * Try to acquire permit (non-blocking)
     */
    public boolean tryAcquire() {
        return tryAcquire(1);
    }

    public boolean tryAcquire(int permits) {
        if (!lock.tryLock()) {
            return false;
        }
        try {
            resync();
            if (storedPermits >= permits) {
                storedPermits -= permits;
                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Acquire permit (blocking wait)
     */
    public void acquire() throws InterruptedException {
        acquire(1);
    }

    public void acquire(int permits) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (true) {
                resync();
                if (storedPermits >= permits) {
                    storedPermits -= permits;
                    return;
                }

                // Calculate wait time needed
                double waitPermits = permits - storedPermits;
                long waitNanos = (long) (waitPermits / permitsPerSecond * 1_000_000_000);

                // Release lock and wait
                lock.unlock();
                try {
                    TimeUnit.NANOSECONDS.sleep(waitNanos);
                } finally {
                    lock.lock();
                }
            }
        } finally {
            lock.unlock();
        }
    }

    /**
     * Synchronize token count
     */
    private void resync() {
        long now = System.nanoTime();
        long elapsed = now - lastUpdateTime;

        // Calculate new tokens
        double newPermits = elapsed * permitsPerSecond / 1_000_000_000;
        storedPermits = Math.min(maxPermits, storedPermits + newPermits);
        lastUpdateTime = now;
    }

    public static void main(String[] args) throws InterruptedException {
        RateLimiter limiter = new RateLimiter(10);  // 10 permits per second

        for (int i = 0; i < 20; i++) {
            if (limiter.tryAcquire()) {
                System.out.println("Request " + i + " passed");
            } else {
                System.out.println("Request " + i + " rate limited");
            }
            Thread.sleep(50);
        }
    }
}
```

### Scenario 3: Local Layer for Distributed Lock

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Local lock layer to reduce distributed lock contention
 * First acquire local lock, then distributed lock
 */
public class LocalLockLayer {
    private final ConcurrentHashMap<String, Lock> localLocks = new ConcurrentHashMap<>();

    /**
     * Get or create local lock
     */
    public Lock getLocalLock(String key) {
        return localLocks.computeIfAbsent(key, k -> new ReentrantLock());
    }

    /**
     * Execute operation with local lock
     */
    public <T> T executeWithLocalLock(String key, long timeout, TimeUnit unit,
                                       DistributedLockCallback<T> callback)
            throws InterruptedException {
        Lock localLock = getLocalLock(key);

        // 1. Acquire local lock first
        if (!localLock.tryLock(timeout, unit)) {
            throw new RuntimeException("Local lock acquisition timeout: " + key);
        }

        try {
            // 2. Then acquire distributed lock
            if (tryAcquireDistributedLock(key, timeout, unit)) {
                try {
                    // 3. Execute business logic
                    return callback.doInLock();
                } finally {
                    releaseDistributedLock(key);
                }
            } else {
                throw new RuntimeException("Distributed lock acquisition timeout: " + key);
            }
        } finally {
            localLock.unlock();
        }
    }

    // Simulated distributed lock operations
    private boolean tryAcquireDistributedLock(String key, long timeout, TimeUnit unit) {
        // Actual implementation might use Redis, Zookeeper, etc.
        System.out.println("Acquiring distributed lock: " + key);
        return true;
    }

    private void releaseDistributedLock(String key) {
        System.out.println("Releasing distributed lock: " + key);
    }

    /**
     * Clean up unused locks
     */
    public void cleanup() {
        localLocks.entrySet().removeIf(entry -> {
            Lock lock = entry.getValue();
            if (lock instanceof ReentrantLock) {
                return !((ReentrantLock) lock).isLocked() &&
                       !((ReentrantLock) lock).hasQueuedThreads();
            }
            return false;
        });
    }

    @FunctionalInterface
    public interface DistributedLockCallback<T> {
        T doInLock() throws InterruptedException;
    }
}
```

## Interview Key Points

### Q1: What are the differences between synchronized and Lock?

**Key Points:**

| Feature | synchronized | Lock |
|---------|-------------|------|
| Implementation level | JVM built-in (bytecode instructions) | Java API (interface) |
| Lock acquisition | Implicit acquire and release | Explicit lock() and unlock() |
| Interrupt response | Not supported | lockInterruptibly() supported |
| Timed acquisition | Not supported | tryLock(timeout) supported |
| Try acquisition | Not supported | tryLock() supported |
| Fairness | Unfair | Configurable fair/unfair |
| Condition variables | Single (wait/notify) | Multiple Conditions |
| Lock release | Automatic (on sync block exit) | Manual (in finally) |

### Q2: What is the implementation principle of ReentrantLock?

**Key Points:**

1. **Based on AQS**: ReentrantLock internally uses AbstractQueuedSynchronizer (AQS)
2. **state variable**: Uses volatile int state to represent lock state, 0 means unlocked, >0 means lock hold count
3. **CLH queue**: Waiting threads organized as FIFO doubly-linked list
4. **Reentrancy**: Same thread can acquire lock multiple times, state increments
5. **Fairness**:
   - Unfair lock: New thread tries CAS first, queues only on failure
   - Fair lock: Directly enters queue

```java
// Simplified unfair lock acquisition logic
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // Lock is free, try CAS acquisition
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    } else if (current == getExclusiveOwnerThread()) {
        // Reentrant: same thread acquiring again
        int nextc = c + acquires;
        setState(nextc);
        return true;
    }
    return false;
}
```

### Q3: What are the differences between ReadWriteLock and StampedLock?

**Key Points:**

| Feature | ReadWriteLock | StampedLock |
|---------|--------------|-------------|
| Optimistic read | Not supported | tryOptimisticRead() |
| Reentrant | Yes | No |
| Condition | Supported | Not supported |
| Lock upgrade | Not supported | tryConvertToWriteLock() |
| Lock downgrade | Supported | Supported |
| Use case | General read-write separation | Extremely high read performance needs |

### Q4: How to avoid deadlock?

**Key Points:**

1. **Acquire locks in order**: All threads acquire multiple locks in the same order
2. **Use tryLock**: Set timeout, release held locks on failure
3. **Use lockInterruptibly**: Support interrupts, can be interrupted externally
4. **Reduce lock granularity**: Minimize lock hold time
5. **Use higher-level concurrent tools**: Such as ConcurrentHashMap

### Q5: What are the differences between Condition and Object's wait/notify?

**Key Points:**

| Feature | Object wait/notify | Condition |
|---------|-------------------|-----------|
| Binding | Bound to object monitor | Bound to Lock |
| Quantity | One wait set per object | Can create multiple Conditions |
| Wait | wait() | await() |
| Notify | notify()/notifyAll() | signal()/signalAll() |
| Timeout | wait(timeout) | await(time, unit) |
| Deadline | Not supported | awaitUntil(deadline) |
| Non-interruptible | Not supported | awaitUninterruptibly() |

## Further Reading

### Official Documentation

- [Java Lock Interface Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/Lock.html)
- [ReentrantLock Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html)
- [StampedLock Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/locks/StampedLock.html)

### Classic Books

- "Java Concurrency in Practice" - Brian Goetz
- "The Art of Java Concurrency Programming" - Fang Tengfei et al.
- "Understanding the JVM: Advanced Features and Best Practices" - Zhou Zhiming

### Source Code Analysis

- Doug Lea's original JSR-166 concurrency package design
- OpenJDK AbstractQueuedSynchronizer source code
- ReentrantLock and ReentrantReadWriteLock implementations

### Related Topics

- Java Memory Model (JMM)
- AQS (AbstractQueuedSynchronizer) Framework
- CAS Operations and Atomic Classes
- Concurrent Collection Implementations
