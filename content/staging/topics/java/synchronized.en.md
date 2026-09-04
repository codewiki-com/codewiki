---
title: Java Synchronized Keyword Complete Guide
description: Master thread synchronization and mutual exclusion in Java with comprehensive examples and best practices
track: java
section: concurrency
difficulty: intermediate
tags:
  - Multithreading
  - Concurrency
  - Synchronization
  - Thread Safety
  - Locks
status: imported
origin: old/src/content/docs/java/synchronized.en.md
divergence: 0.291
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: java
  subcategory: ""
  order: 6
  lastUpdated: 2026-01-07
---

## Concept Introduction

The `synchronized` keyword is fundamental to Java's concurrency model, ensuring that multiple threads can safely access shared resources without data corruption or race conditions. In multi-threaded applications, when multiple threads access the same data simultaneously, unpredictable behavior can occur. The `synchronized` keyword prevents this by enforcing mutual exclusion—only one thread can execute a synchronized block or method at a time.

Synchronization is essential when building robust multi-threaded applications. Without proper synchronization, shared state modifications can lead to data inconsistency, lost updates, and application crashes. Java provides the `synchronized` keyword as the primary mechanism for thread-safe operations, alongside more advanced tools like locks, atomic variables, and concurrent collections.

## Core Principles

### Mutual Exclusion

The fundamental principle behind synchronization is **mutual exclusion** (mutex). When a thread enters a synchronized block or method, it acquires a lock on the specified object. Other threads attempting to enter synchronized code that uses the same lock must wait. This ensures only one thread executes the critical section at a time.

### Monitor (Intrinsic Lock)

In Java, every object has an associated monitor and intrinsic lock. When you use the `synchronized` keyword with an object, you're acquiring that object's intrinsic lock. This lock is implicit and managed by the Java Virtual Machine (JVM).

```
Thread 1                          Thread 2
   |                                |
   v                                v
Calls synchronized method    Calls same synchronized method
   |                                |
   v                                v
Acquires lock               Waits for lock (blocked)
   |
   v
Executes critical section
   |
   v
Releases lock <-- Thread 2 acquires lock and proceeds
```

### Visibility

Beyond mutual exclusion, `synchronized` ensures visibility of changes made by one thread to another. When a thread exits a synchronized block, all changes it made become visible to other threads entering a synchronized block on the same object.

## Key Points

- **Synchronized methods**: Lock is held on the method's object (instance method) or class (static method)
- **Synchronized blocks**: Lock is held on the specified object for the duration of the block
- **Intrinsic locks**: Every object in Java has an implicit lock managed by the JVM
- **Reentrant**: The same thread can acquire the same lock multiple times (important for nested synchronized blocks)
- **Volatile vs Synchronized**: `volatile` ensures visibility but not atomicity; `synchronized` provides both
- **Static vs Instance**: Static synchronized methods lock the class object; instance methods lock the specific object
- **Performance overhead**: Synchronization has performance cost; use only where necessary
- **Deadlock risk**: Multiple locks can cause deadlocks if not managed carefully
- **Modern alternatives**: `java.util.concurrent` provides better alternatives for many scenarios

## Code Examples

### Example 1: Synchronized Method (Instance)

A basic example of synchronizing access to a shared counter:

```java
class Counter {
    private int count = 0;

    // Without synchronization - NOT THREAD-SAFE
    public void incrementUnsafe() {
        count++;  // Read-Modify-Write is not atomic
    }

    // With synchronization - THREAD-SAFE
    public synchronized void increment() {
        count++;  // Now atomic
    }

    public synchronized int getCount() {
        return count;
    }

    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        int numThreads = 10;
        int incrementsPerThread = 1000;

        // Create and start threads
        Thread[] threads = new Thread[numThreads];
        for (int i = 0; i < numThreads; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < incrementsPerThread; j++) {
                    counter.increment();
                }
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Result should always be 10000 (10 threads * 1000 increments)
        System.out.println("Final count: " + counter.getCount());
    }
}
```

### Example 2: Synchronized Block

More granular control over synchronization using blocks:

```java
class BankAccount {
    private double balance;
    private String accountNumber;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    // Synchronized block - only locks the critical section
    public void transfer(BankAccount recipient, double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        // Non-critical operations can execute in parallel
        System.out.println(Thread.currentThread().getName() +
            " initiating transfer of $" + amount);

        // Only the critical section (modifying balances) is synchronized
        synchronized (this) {
            if (balance < amount) {
                throw new IllegalArgumentException("Insufficient funds");
            }
            balance -= amount;
        }

        // Simulate network delay (not critical section)
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Synchronize on recipient account
        synchronized (recipient) {
            recipient.balance += amount;
        }

        System.out.println("Transfer completed by " +
            Thread.currentThread().getName());
    }

    public synchronized double getBalance() {
        return balance;
    }

    @Override
    public String toString() {
        return String.format("Account %s: $%.2f", accountNumber, balance);
    }
}
```

### Example 3: Static Synchronized Methods

Synchronizing class-level state:

```java
class DatabaseConnection {
    private static int connectionCount = 0;
    private static final int MAX_CONNECTIONS = 5;

    // Static synchronized method - locks the class object
    public static synchronized boolean createConnection() {
        if (connectionCount >= MAX_CONNECTIONS) {
            System.out.println("Max connections reached!");
            return false;
        }
        connectionCount++;
        System.out.println("Connection created. Active: " + connectionCount);
        return true;
    }

    public static synchronized void closeConnection() {
        if (connectionCount > 0) {
            connectionCount--;
            System.out.println("Connection closed. Active: " + connectionCount);
        }
    }

    public static synchronized int getActiveConnections() {
        return connectionCount;
    }

    public static void main(String[] args) {
        // Multiple threads trying to create connections
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                if (createConnection()) {
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    closeConnection();
                }
            }, "Worker-" + i);
            threads[i].start();
        }

        // Wait for completion
        for (Thread thread : threads) {
            try {
                thread.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
```

### Example 4: Reentrancy Example

Demonstrating that the same thread can acquire the same lock multiple times:

```java
class ReentrantSynchronizationExample {
    private int count = 0;

    // Outer synchronized method
    public synchronized void outerMethod() {
        System.out.println(Thread.currentThread().getName() +
            " entered outerMethod");
        count++;

        // Same thread can call inner synchronized method
        // It already holds the lock, so no deadlock occurs
        innerMethod();

        System.out.println("Count from outerMethod: " + count);
    }

    // Inner synchronized method
    private synchronized void innerMethod() {
        System.out.println(Thread.currentThread().getName() +
            " entered innerMethod");
        count++;
        System.out.println("Count from innerMethod: " + count);
    }

    public static void main(String[] args) {
        ReentrantSynchronizationExample example = new ReentrantSynchronizationExample();

        Thread thread = new Thread(() -> {
            example.outerMethod();
            // Output will show that the same thread can acquire the same lock
        }, "Worker");

        thread.start();
        try {
            thread.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### Example 5: Synchronized Collections Wrapper

Creating thread-safe collections:

```java
import java.util.*;

class ThreadSafeCollectionExample {
    public static void main(String[] args) throws InterruptedException {
        // Original list (not thread-safe)
        List<Integer> unsafeList = new ArrayList<>();

        // Wrap with synchronized list
        List<Integer> syncList = Collections.synchronizedList(new ArrayList<>());

        int numThreads = 5;
        int itemsPerThread = 1000;

        // Multiple threads adding to synchronized list
        Thread[] threads = new Thread[numThreads];
        for (int i = 0; i < numThreads; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < itemsPerThread; j++) {
                    syncList.add(j);
                }
            }, "Producer-" + i);
            threads[i].start();
        }

        // Wait for completion
        for (Thread thread : threads) {
            thread.join();
        }

        System.out.println("Synchronized list size: " + syncList.size());
        // Size will be exactly numThreads * itemsPerThread = 5000

        // Note: While individual operations are synchronized,
        // compound operations are NOT atomic:
        if (syncList.size() > 0) {  // Synchronized
            // Another thread could modify list here!
            Integer first = syncList.get(0);  // Another synchronized operation
        }
    }
}
```

### Example 6: Producer-Consumer Pattern

Classic concurrency pattern using synchronized methods and wait/notify:

```java
class BoundedBuffer<T> {
    private final Object[] items;
    private int head = 0;
    private int tail = 0;
    private int count = 0;

    public BoundedBuffer(int capacity) {
        items = new Object[capacity];
    }

    // Producer adds items
    public synchronized void put(T item) throws InterruptedException {
        // Wait until buffer has space
        while (count == items.length) {
            wait();
        }

        items[tail] = item;
        tail = (tail + 1) % items.length;
        count++;

        // Notify waiting consumers
        notifyAll();
    }

    // Consumer removes items
    @SuppressWarnings("unchecked")
    public synchronized T take() throws InterruptedException {
        // Wait until buffer has items
        while (count == 0) {
            wait();
        }

        T item = (T) items[head];
        head = (head + 1) % items.length;
        count--;

        // Notify waiting producers
        notifyAll();
        return item;
    }

    public synchronized int size() {
        return count;
    }

    public static void main(String[] args) {
        BoundedBuffer<Integer> buffer = new BoundedBuffer<>(5);

        // Producer thread
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    buffer.put(i);
                    System.out.println("Produced: " + i +
                        ", Buffer size: " + buffer.size());
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
                    Integer item = buffer.take();
                    System.out.println("Consumed: " + item +
                        ", Buffer size: " + buffer.size());
                    Thread.sleep(200);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "Consumer");

        producer.start();
        consumer.start();

        try {
            producer.join();
            consumer.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Best Practices

### Synchronize Only Critical Sections

Minimize the scope of synchronized code to improve performance:

```java
class BestPracticeExample {
    private List<String> data = new ArrayList<>();
    private int counter = 0;

    // Bad: Entire method synchronized
    public synchronized void processBad(String item) {
        // Do non-critical work while holding lock
        String processed = expensiveProcessing(item);  // SLOW
        data.add(processed);
        counter++;
    }

    // Good: Only critical section synchronized
    public void processGood(String item) {
        // Non-critical work without lock
        String processed = expensiveProcessing(item);  // Fast, no lock held

        // Minimal critical section
        synchronized (this) {
            data.add(processed);
            counter++;
        }
    }

    private String expensiveProcessing(String item) {
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        return item.toUpperCase();
    }
}
```

### Prefer Synchronized Blocks Over Methods

Blocks provide finer control and better documentation:

```java
class LockSpecificationExample {
    private List<String> items = new ArrayList<>();
    private int counter = 0;

    // Less clear - locks 'this'
    public synchronized void add(String item) {
        items.add(item);
        counter++;
    }

    // Better - explicitly shows what is being locked
    public void addBetter(String item) {
        synchronized (this) {
            items.add(item);
            counter++;
        }
    }

    // Even better - specific lock object
    private final Object itemLock = new Object();

    public void addBest(String item) {
        synchronized (itemLock) {
            items.add(item);
            counter++;
        }
    }
}
```

### Use Volatile for Simple Cases

For simple flag variables that don't require compound operations:

```java
class VolatileVsSynchronized {
    // Good use of volatile
    private volatile boolean running = true;

    public void stop() {
        running = false;
    }

    public boolean isRunning() {
        return running;
    }

    // For compound operations, volatile is NOT enough
    private volatile int count = 0;

    // WRONG - increment is not atomic
    public void incrementWrong() {
        count++;  // Three operations: read, modify, write
    }

    // CORRECT - use synchronized
    public synchronized void incrementCorrect() {
        count++;
    }
}
```

### Avoid Nested Locks to Prevent Deadlock

Always acquire locks in a consistent order:

```java
class DeadlockPrevention {
    private Object lock1 = new Object();
    private Object lock2 = new Object();

    // Thread A might do: lock1 -> lock2
    public void method1() {
        synchronized (lock1) {
            System.out.println("Thread acquired lock1");
            synchronized (lock2) {
                System.out.println("Thread acquired lock2");
            }
        }
    }

    // Thread B should also do: lock1 -> lock2 (NOT lock2 -> lock1)
    public void method2() {
        synchronized (lock1) {  // SAME ORDER
            System.out.println("Thread acquired lock1");
            synchronized (lock2) {
                System.out.println("Thread acquired lock2");
            }
        }
    }

    // WRONG - opposite order can cause deadlock
    public void methodDeadlock() {
        synchronized (lock2) {  // WRONG ORDER!
            synchronized (lock1) {
                // Risk of deadlock
            }
        }
    }
}
```

### Use Immutability When Possible

Immutable objects don't need synchronization:

```java
// Thread-safe by design - no synchronization needed
class ImmutablePoint {
    private final int x;
    private final int y;

    public ImmutablePoint(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int getX() { return x; }
    public int getY() { return y; }

    public ImmutablePoint move(int dx, int dy) {
        return new ImmutablePoint(x + dx, y + dy);
    }
}

// Multiple threads can safely use immutable objects concurrently
class ImmutableUsage {
    private ImmutablePoint position = new ImmutablePoint(0, 0);

    public ImmutablePoint getPosition() {
        return position;
    }

    public synchronized void moveBy(int dx, int dy) {
        position = position.move(dx, dy);
    }
}
```

### Prefer java.util.concurrent Classes

For complex scenarios, use modern concurrent utilities:

```java
import java.util.concurrent.*;
import java.util.concurrent.locks.*;
import java.util.concurrent.atomic.*;

class ModernConcurrency {
    // Instead of synchronized blocks, use explicit locks
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;

    public void incrementWithLock() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }

    // Or use CountDownLatch for synchronization
    private final CountDownLatch latch = new CountDownLatch(5);

    public void waitForCompletion() throws InterruptedException {
        latch.await();
    }

    public void markComplete() {
        latch.countDown();
    }

    // AtomicInteger for simple atomic operations
    private final AtomicInteger atomicCount = new AtomicInteger(0);

    public void incrementAtomic() {
        atomicCount.incrementAndGet();
    }

    public int getAtomicCount() {
        return atomicCount.get();
    }
}
```

## Common Pitfalls

### Pitfall 1: Synchronizing on Mutable Lock Objects

```java
class MutableLockPitfall {
    private String lockObject = "lock";  // WRONG - reference can change

    public void badExample() {
        synchronized (lockObject) {
            // If lockObject reference changes, different threads use different locks
        }
    }

    // CORRECT - use final Object
    private final Object lock = new Object();

    public void goodExample() {
        synchronized (lock) {
            // Always synchronizes on the same object
        }
    }
}
```

### Pitfall 2: Compound Operations Not Being Atomic

```java
class CompoundOperationPitfall {
    private List<String> list = Collections.synchronizedList(new ArrayList<>());

    public void removeAndProcess() {
        // WRONG - not atomic
        if (!list.isEmpty()) {  // Check
            String item = list.remove(0);  // Remove
            process(item);  // Use
        }

        // CORRECT - atomic operation
        synchronized (list) {
            if (!list.isEmpty()) {
                String item = list.remove(0);
                process(item);
            }
        }
    }

    private void process(String item) {
        System.out.println("Processing: " + item);
    }
}
```

### Pitfall 3: Not Synchronizing Wait/Notify

```java
class WaitNotifyPitfall {
    private volatile boolean ready = false;

    // WRONG - wait() must be called in synchronized block
    public void waitWrong() throws InterruptedException {
        while (!ready) {
            wait();  // IllegalMonitorStateException!
        }
    }

    // CORRECT - synchronized block required
    public synchronized void waitCorrect() throws InterruptedException {
        while (!ready) {
            wait();
        }
    }

    public synchronized void notifyCorrect() {
        ready = true;
        notifyAll();
    }
}
```

### Pitfall 4: Synchronizing on 'this' in Public Methods

```java
class PublicSynchronizationPitfall {
    // DANGEROUS - external code can synchronize on 'this'
    public synchronized void publicMethod() {
        // Potential deadlock risks
    }

    // BETTER - use private lock object
    private final Object lock = new Object();

    public void publicMethodSafe() {
        synchronized (lock) {
            // Only your code controls this lock
        }
    }
}
```

### Pitfall 5: Forgetting to Synchronize Getter Methods

```java
class ForgottenGetterPitfall {
    private int value = 0;

    public synchronized void setValue(int v) {
        value = v;
    }

    // WRONG - getter not synchronized
    public int getValue() {
        return value;  // May see stale value
    }

    // CORRECT - synchronize both getter and setter
    public synchronized int getValueCorrect() {
        return value;
    }
}
```

## Performance Considerations

### Lock Contention

High lock contention severely impacts performance:

```java
class LockContentionExample {
    private int count = 0;

    // High contention - all threads compete for same lock
    public synchronized void highContentionIncrement() {
        count++;
    }

    // Lower contention - stripe data across multiple locks
    private final int NUM_STRIPES = 16;
    private final Object[] locks = new Object[NUM_STRIPES];
    private final int[] counters = new int[NUM_STRIPES];

    public LockContentionExample() {
        for (int i = 0; i < NUM_STRIPES; i++) {
            locks[i] = new Object();
        }
    }

    public void lowContentionIncrement(int id) {
        int stripe = id % NUM_STRIPES;
        synchronized (locks[stripe]) {
            counters[stripe]++;
        }
    }

    public int getTotalCount() {
        int total = 0;
        for (int i = 0; i < NUM_STRIPES; i++) {
            synchronized (locks[i]) {
                total += counters[i];
            }
        }
        return total;
    }
}
```

### Synchronization Overhead

```java
class SynchronizationBenchmark {
    private static final int ITERATIONS = 1_000_000;

    static class SyncVersion {
        private int count = 0;

        public synchronized void increment() {
            count++;
        }

        public int getCount() { return count; }
    }

    static class AtomicVersion {
        private final AtomicInteger count = new AtomicInteger(0);

        public void increment() {
            count.incrementAndGet();
        }

        public int getCount() { return count.get(); }
    }

    public static void main(String[] args) {
        // Warm up
        for (int i = 0; i < 100; i++) {
            benchmarkSync();
            benchmarkAtomic();
        }

        // Measure
        long syncTime = benchmarkSync();
        long atomicTime = benchmarkAtomic();

        System.out.println("Synchronized: " + syncTime + "ms");
        System.out.println("Atomic: " + atomicTime + "ms");
    }

    private static long benchmarkSync() {
        SyncVersion obj = new SyncVersion();
        long start = System.currentTimeMillis();
        for (int i = 0; i < ITERATIONS; i++) {
            obj.increment();
        }
        return System.currentTimeMillis() - start;
    }

    private static long benchmarkAtomic() {
        AtomicVersion obj = new AtomicVersion();
        long start = System.currentTimeMillis();
        for (int i = 0; i < ITERATIONS; i++) {
            obj.increment();
        }
        return System.currentTimeMillis() - start;
    }
}
```

## Real-world Scenarios

### Scenario 1: Thread-Safe Singleton Pattern

```java
class ThreadSafeSingleton {
    private static ThreadSafeSingleton instance;
    private String data;

    private ThreadSafeSingleton() {
        this.data = "Initialized";
    }

    // Eager initialization - simple and thread-safe
    private static class SingletonHolder {
        static final ThreadSafeSingleton INSTANCE = new ThreadSafeSingleton();
    }

    public static ThreadSafeSingleton getInstance() {
        return SingletonHolder.INSTANCE;
    }

    public String getData() {
        return data;
    }
}
```

### Scenario 2: Thread-Safe Cache Implementation

```java
class SimpleLRUCache<K, V> {
    private final LinkedHashMap<K, V> cache;
    private final int capacity;
    private final Object lock = new Object();

    public SimpleLRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new LinkedHashMap<K, V>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(java.util.Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public V get(K key) {
        synchronized (lock) {
            return cache.get(key);
        }
    }

    public void put(K key, V value) {
        synchronized (lock) {
            cache.put(key, value);
        }
    }

    public int size() {
        synchronized (lock) {
            return cache.size();
        }
    }
}
```

### Scenario 3: Rate Limiter

```java
class RateLimiter {
    private final int maxRequests;
    private final long windowMillis;
    private final Object lock = new Object();
    private long lastRefillTime;
    private int availableRequests;

    public RateLimiter(int maxRequests, long windowMillis) {
        this.maxRequests = maxRequests;
        this.windowMillis = windowMillis;
        this.availableRequests = maxRequests;
        this.lastRefillTime = System.currentTimeMillis();
    }

    public boolean allowRequest() {
        synchronized (lock) {
            long now = System.currentTimeMillis();
            long timePassed = now - lastRefillTime;

            if (timePassed >= windowMillis) {
                availableRequests = maxRequests;
                lastRefillTime = now;
            }

            if (availableRequests > 0) {
                availableRequests--;
                return true;
            }
            return false;
        }
    }
}
```

## Interview Points

### Q1: What is the difference between synchronized and volatile?

**Answer**:
- **synchronized**: Provides both atomicity and visibility. Only one thread can execute synchronized code at a time
- **volatile**: Only ensures visibility of changes, not atomicity. Multiple threads can access volatile variables simultaneously
- Use `volatile` for simple flags; use `synchronized` for compound operations

### Q2: What is a deadlock and how can synchronized code cause it?

**Answer**: A deadlock occurs when threads wait for each other indefinitely. Synchronized code causes deadlock when:
- Thread A holds lock1 and waits for lock2
- Thread B holds lock2 and waits for lock1
Prevention: Always acquire locks in the same order

### Q3: Explain monitor and intrinsic locks

**Answer**: Every Java object has an associated monitor. The `synchronized` keyword uses the object's intrinsic (implicit) lock to enforce mutual exclusion. When a thread enters synchronized code, it acquires the lock; exiting releases it.

### Q4: Why can't you synchronize on a primitive?

**Answer**: Primitives don't have intrinsic locks. Only objects have monitors. You must synchronize on object references.

### Q5: What are reentrant locks?

**Answer**: A reentrant lock allows the same thread to acquire the same lock multiple times. Java's intrinsic locks are reentrant, preventing deadlock when a synchronized method calls another synchronized method on the same object.

### Q6: Is synchronization sufficient for thread safety?

**Answer**: No. Synchronization prevents race conditions but doesn't prevent logical errors. Good synchronization requires:
- Proper locking strategy
- Consistent lock ordering
- Correct use of wait/notify
- Avoiding busy-waiting

### Q7: How does wait/notify work with synchronized?

**Answer**: `wait()` releases the lock and pauses the thread until another thread calls `notify()` on the same lock. Must be called inside synchronized block. `notifyAll()` is preferred to avoid missed notifications.

### Q8: What's the difference between notify() and notifyAll()?

**Answer**: `notify()` wakes up one arbitrary waiting thread, while `notifyAll()` wakes up all waiting threads. `notifyAll()` is generally safer but potentially less efficient.

### Q9: Why avoid holding multiple locks?

**Answer**: Holding multiple locks increases the risk of deadlock if threads acquire locks in different orders. If absolutely necessary, always acquire locks in the same order globally.

### Q10: When should you consider alternatives to synchronized?

**Answer**: In high-contention scenarios, consider:
- `AtomicInteger` for simple counters
- `LongAdder` for high-contention counters
- `ReentrantReadWriteLock` for read-heavy workloads
- `ConcurrentHashMap` for concurrent collections

## Further Reading

### Official Documentation
- [Java Concurrency Tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/)
- [The Java Memory Model](https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html)
- [java.util.concurrent Package](https://docs.oracle.com/javase/17/docs/api/java.base/java/util/concurrent/package-summary.html)

### Books and Articles
- "Java Concurrency in Practice" by Brian Goetz et al.
- "Effective Java" by Joshua Bloch (Items on synchronization)
- [Oracle Synchronization Article](https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html)

### Tools and Libraries
- JUnit for testing multi-threaded code
- Java Flight Recorder for profiling lock contention
- `java.util.concurrent` - Modern concurrency utilities
- IntelliJ IDEA thread view for debugging

### Advanced Topics
- ReadWriteLock for read-heavy workloads
- StampedLock for optimistic locking
- Happens-before relationships in Java Memory Model
- Compare-and-Swap (CAS) operations for lock-free programming
- Lock-free data structures and algorithms
