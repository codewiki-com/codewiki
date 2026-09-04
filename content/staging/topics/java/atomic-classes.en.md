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
origin: old/src/content/docs/java/atomic-classes.en.md
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

## Concept Explanation

Atomic Classes are a set of classes provided in the `java.util.concurrent.atomic` package in Java for implementing lock-free thread-safe operations in multi-threaded environments. The word "atomic" comes from Greek, meaning "indivisible." In concurrent programming, an atomic operation is one that will not be interrupted by the thread scheduling mechanism - once the operation starts, it runs to completion without any context switch in between.

### Why Are Atomic Classes Needed

In a multi-threaded environment, even a simple `i++` operation is not thread-safe:

```java
public class NonAtomicExample {
    private int count = 0;

    // Non-atomic operation: read -> increment -> write
    public void increment() {
        count++; // Actually contains three steps, may be interrupted by other threads
    }
}
```

The traditional solution is to use the `synchronized` keyword:

```java
public synchronized void increment() {
    count++;
}
```

However, `synchronized` incurs significant performance overhead because it requires acquiring and releasing locks. Atomic classes provide a more efficient lock-free solution through CAS (Compare-And-Swap) operations.

### Evolution History of Atomic Classes

- **Java 5 (2004)**: Introduced the `java.util.concurrent.atomic` package, containing basic atomic classes like `AtomicInteger`, `AtomicLong`, `AtomicReference`
- **Java 8 (2014)**: Added `LongAdder`, `LongAccumulator`, `DoubleAdder`, `DoubleAccumulator`, optimized for high-concurrency scenarios
- **Java 9 (2017)**: Introduced `VarHandle`, providing lower-level, more flexible atomic operation support

## Core Principles

### CAS (Compare-And-Swap) Operation

CAS is the core mechanism of atomic classes. It is a CPU atomic instruction that contains three operands:

1. **Memory location V**: The memory address of the variable
2. **Expected value A**: The expected current value of the variable
3. **New value B**: The new value to be set

The semantics of a CAS operation is: **If the current value of variable V equals the expected value A, update V's value to B; otherwise, do nothing**. The entire operation is atomic and will not be interrupted.

```
if (V == A) {
    V = B
    return true
} else {
    return false
}
```

### Unsafe Class and Low-Level Implementation

Java's atomic classes call low-level CAS operations through the `sun.misc.Unsafe` class (or `jdk.internal.misc.Unsafe` in Java 9+):

```java
// Core implementation principle of AtomicInteger (simplified)
public class AtomicInteger {
    private static final Unsafe U = Unsafe.getUnsafe();
    private static final long VALUE; // Memory offset of the value field

    static {
        VALUE = U.objectFieldOffset(AtomicInteger.class, "value");
    }

    private volatile int value; // volatile ensures visibility

    public final int incrementAndGet() {
        return U.getAndAddInt(this, VALUE, 1) + 1;
    }

    public final boolean compareAndSet(int expectedValue, int newValue) {
        return U.compareAndSetInt(this, VALUE, expectedValue, newValue);
    }
}
```

### Memory Barriers and Visibility

The `value` field of atomic classes is modified with `volatile`, ensuring:

1. **Visibility**: Modifications by one thread are immediately visible to other threads
2. **Prohibition of instruction reordering**: Compilers and processors will not reorder read/write operations on volatile variables

```java
// The role of volatile
private volatile int value;

// StoreStore + StoreLoad barriers are inserted after write operations
// LoadLoad + LoadStore barriers are inserted before read operations
```

### CAS Spin Retry

When a CAS operation fails (indicating another thread modified the value), atomic classes will spin and retry:

```java
// Implementation of getAndAddInt
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        v = getIntVolatile(o, offset);        // Read current value
    } while (!weakCompareAndSetInt(o, offset, v, v + delta)); // CAS until success
    return v;
}
```

## Key Points

### Classification of Atomic Classes

Java atomic classes can be categorized as follows:

| Category | Class Name | Description |
|----------|------------|-------------|
| Basic Types | AtomicInteger | Atomic integer |
| Basic Types | AtomicLong | Atomic long integer |
| Basic Types | AtomicBoolean | Atomic boolean |
| Reference Types | AtomicReference | Atomic reference |
| Reference Types | AtomicStampedReference | Atomic reference with version stamp (solves ABA problem) |
| Reference Types | AtomicMarkableReference | Atomic reference with mark |
| Array Types | AtomicIntegerArray | Atomic integer array |
| Array Types | AtomicLongArray | Atomic long array |
| Array Types | AtomicReferenceArray | Atomic reference array |
| Field Updaters | AtomicIntegerFieldUpdater | Atomic updater for integer fields |
| Field Updaters | AtomicLongFieldUpdater | Atomic updater for long fields |
| Field Updaters | AtomicReferenceFieldUpdater | Atomic updater for reference fields |
| Accumulators | LongAdder | High-performance long accumulator |
| Accumulators | LongAccumulator | General-purpose long accumulator |
| Accumulators | DoubleAdder | High-performance double accumulator |
| Accumulators | DoubleAccumulator | General-purpose double accumulator |

### Core Methods

Atomic classes provide a standard set of atomic operation methods:

```java
// Using AtomicInteger as an example

// Get and Set
int get()                           // Get current value
void set(int newValue)              // Set new value
void lazySet(int newValue)          // Lazy set (eventual consistency)
int getAndSet(int newValue)         // Get old value and set new value

// CAS Operations
boolean compareAndSet(int expect, int update)    // CAS operation
boolean weakCompareAndSet(int expect, int update) // Weak CAS (may spuriously fail)

// Atomic Increment/Decrement
int getAndIncrement()               // Get current value, then add 1
int incrementAndGet()               // Add 1, then get new value
int getAndDecrement()               // Get current value, then subtract 1
int decrementAndGet()               // Subtract 1, then get new value

// Atomic Add/Subtract
int getAndAdd(int delta)            // Get current value, then add delta
int addAndGet(int delta)            // Add delta, then get new value

// Functional Updates (Java 8+)
int getAndUpdate(IntUnaryOperator updateFunction)
int updateAndGet(IntUnaryOperator updateFunction)
int getAndAccumulate(int x, IntBinaryOperator accumulatorFunction)
int accumulateAndGet(int x, IntBinaryOperator accumulatorFunction)
```

## Code Examples

### Basic Usage of AtomicInteger

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicIntegerExample {
    private AtomicInteger count = new AtomicInteger(0);

    // Thread-safe increment
    public void increment() {
        count.incrementAndGet();
    }

    // Thread-safe decrement
    public void decrement() {
        count.decrementAndGet();
    }

    // Atomically add specified value
    public void add(int delta) {
        count.addAndGet(delta);
    }

    // CAS operation
    public boolean compareAndSet(int expected, int newValue) {
        return count.compareAndSet(expected, newValue);
    }

    public int getCount() {
        return count.get();
    }

    public static void main(String[] args) throws InterruptedException {
        AtomicIntegerExample example = new AtomicIntegerExample();

        // Create multiple threads for concurrent increment
        Thread[] threads = new Thread[10];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    example.increment();
                }
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Output: 10000 (thread-safe)
        System.out.println("Final count: " + example.getCount());
    }
}
```

### AtomicLong and Counters

```java
import java.util.concurrent.atomic.AtomicLong;

public class AtomicLongCounter {
    private final AtomicLong requestCount = new AtomicLong(0);
    private final AtomicLong successCount = new AtomicLong(0);
    private final AtomicLong errorCount = new AtomicLong(0);

    // Record request
    public void recordRequest() {
        requestCount.incrementAndGet();
    }

    // Record success
    public void recordSuccess() {
        successCount.incrementAndGet();
    }

    // Record error
    public void recordError() {
        errorCount.incrementAndGet();
    }

    // Get statistics
    public String getStats() {
        return String.format(
            "Total requests: %d, Success: %d, Failures: %d, Success rate: %.2f%%",
            requestCount.get(),
            successCount.get(),
            errorCount.get(),
            (successCount.get() * 100.0) / Math.max(1, requestCount.get())
        );
    }

    // Reset counter
    public void reset() {
        requestCount.set(0);
        successCount.set(0);
        errorCount.set(0);
    }

    public static void main(String[] args) {
        AtomicLongCounter counter = new AtomicLongCounter();

        // Simulate request processing
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

### AtomicReference for Object References

```java
import java.util.concurrent.atomic.AtomicReference;

public class AtomicReferenceExample {

    // Immutable user object
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

    // Atomically set user (only when current is null)
    public boolean initUser(User user) {
        return currentUser.compareAndSet(null, user);
    }

    // Atomically update user
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

    // Update using updateAndGet (Java 8+)
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

        // Initialize user
        User user = new User("John", 25);
        boolean initialized = example.initUser(user);
        System.out.println("Initialization successful: " + initialized);
        System.out.println("Current user: " + example.getUser());

        // Update user
        example.updateUser("Jane", 30);
        System.out.println("After update: " + example.getUser());

        // Increment age
        example.incrementAge();
        System.out.println("After age+1: " + example.getUser());
    }
}
```

### Lock-Free Stack with CAS

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

    // Push
    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = top.get();
            newHead.next = oldHead;
        } while (!top.compareAndSet(oldHead, newHead));
    }

    // Pop
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

    // Peek at top element
    public T peek() {
        Node<T> head = top.get();
        return head == null ? null : head.value;
    }

    // Check if empty
    public boolean isEmpty() {
        return top.get() == null;
    }

    public static void main(String[] args) throws InterruptedException {
        LockFreeStack<Integer> stack = new LockFreeStack<>();

        // Multi-threaded concurrent push
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

        // Count popped elements
        int count = 0;
        while (stack.pop() != null) {
            count++;
        }

        System.out.println("Total elements popped: " + count); // Should be 500
    }
}
```

### LongAdder for High-Concurrency Accumulation

```java
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.CountDownLatch;

public class LongAdderExample {

    public static void main(String[] args) throws InterruptedException {
        int threadCount = 100;
        int incrementsPerThread = 100000;

        // Using AtomicLong
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

        // Using LongAdder
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

        System.out.println("AtomicLong result: " + atomicLong.get() +
                          ", time: " + atomicTime / 1_000_000 + " ms");
        System.out.println("LongAdder result: " + longAdder.sum() +
                          ", time: " + adderTime / 1_000_000 + " ms");
        System.out.println("LongAdder is approximately " +
                          String.format("%.2f", (double) atomicTime / adderTime) + " times faster");
    }
}
```

### AtomicStampedReference to Solve ABA Problem

```java
import java.util.concurrent.atomic.AtomicStampedReference;

public class AtomicStampedReferenceExample {

    public static void main(String[] args) throws InterruptedException {
        // Initial value is "A", version is 0
        AtomicStampedReference<String> ref = new AtomicStampedReference<>("A", 0);

        // Thread 1: Attempt to change A to C
        Thread thread1 = new Thread(() -> {
            int stamp = ref.getStamp();
            String value = ref.getReference();
            System.out.println("Thread1 reads: value=" + value + ", version=" + stamp);

            try {
                Thread.sleep(1000); // Simulate business processing
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            // Attempt CAS (will fail because version has changed)
            boolean success = ref.compareAndSet(value, "C", stamp, stamp + 1);
            System.out.println("Thread1 CAS result: " + success);
        });

        // Thread 2: A -> B -> A (creating ABA problem)
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
            System.out.println("Thread2 A->B: " + success1 +
                              ", current version: " + ref.getStamp());

            // B -> A
            stamp = ref.getStamp();
            boolean success2 = ref.compareAndSet("B", "A", stamp, stamp + 1);
            System.out.println("Thread2 B->A: " + success2 +
                              ", current version: " + ref.getStamp());
        });

        thread1.start();
        thread2.start();

        thread1.join();
        thread2.join();

        System.out.println("Final value: " + ref.getReference() +
                          ", version: " + ref.getStamp());
    }
}
```

### Field Updater (FieldUpdater)

```java
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;
import java.util.concurrent.atomic.AtomicReferenceFieldUpdater;

public class FieldUpdaterExample {

    // Fields must be volatile
    static class User {
        volatile int age;
        volatile String name;

        public User(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }

    // Create field updaters
    private static final AtomicIntegerFieldUpdater<User> AGE_UPDATER =
        AtomicIntegerFieldUpdater.newUpdater(User.class, "age");

    private static final AtomicReferenceFieldUpdater<User, String> NAME_UPDATER =
        AtomicReferenceFieldUpdater.newUpdater(User.class, String.class, "name");

    public static void main(String[] args) {
        User user = new User("John", 25);

        // Atomically increment age
        int oldAge = AGE_UPDATER.getAndIncrement(user);
        System.out.println("Old age: " + oldAge + ", new age: " + user.age);

        // CAS update age
        boolean ageUpdated = AGE_UPDATER.compareAndSet(user, 26, 30);
        System.out.println("Age CAS update: " + ageUpdated + ", current age: " + user.age);

        // CAS update name
        boolean nameUpdated = NAME_UPDATER.compareAndSet(user, "John", "Jane");
        System.out.println("Name CAS update: " + nameUpdated + ", current name: " + user.name);

        // Atomic accumulation
        AGE_UPDATER.addAndGet(user, 5);
        System.out.println("Age after accumulation: " + user.age);
    }
}
```

### LongAccumulator for Custom Accumulation Logic

```java
import java.util.concurrent.atomic.LongAccumulator;
import java.util.concurrent.CountDownLatch;
import java.util.Random;

public class LongAccumulatorExample {

    public static void main(String[] args) throws InterruptedException {
        // Accumulator for finding maximum value
        LongAccumulator maxAccumulator = new LongAccumulator(Long::max, Long.MIN_VALUE);

        // Accumulator for finding minimum value
        LongAccumulator minAccumulator = new LongAccumulator(Long::min, Long.MAX_VALUE);

        // Accumulator for sum
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

        System.out.println("Maximum: " + maxAccumulator.get());
        System.out.println("Minimum: " + minAccumulator.get());
        System.out.println("Sum: " + sumAccumulator.get());

        // Reset accumulator
        maxAccumulator.reset();
        System.out.println("After reset: " + maxAccumulator.get()); // Long.MIN_VALUE
    }
}
```

## Best Practices

### Choose the Right Atomic Class

```java
// Single counter: Use AtomicInteger or AtomicLong
private final AtomicInteger counter = new AtomicInteger(0);

// High-concurrency accumulation: Prefer LongAdder
private final LongAdder highConcurrencyCounter = new LongAdder();

// Atomic operations on object references: Use AtomicReference
private final AtomicReference<Config> config = new AtomicReference<>();

// Need to detect ABA problem: Use AtomicStampedReference
private final AtomicStampedReference<Node> head = new AtomicStampedReference<>(null, 0);

// Fields of existing classes need atomic operations: Use FieldUpdater
private static final AtomicIntegerFieldUpdater<MyClass> COUNTER_UPDATER =
    AtomicIntegerFieldUpdater.newUpdater(MyClass.class, "counter");
```

### Use CAS Loops Correctly

```java
public class CASBestPractice {
    private final AtomicInteger value = new AtomicInteger(0);

    // Recommended: Use built-in methods
    public int safeIncrement() {
        return value.incrementAndGet();
    }

    // Custom logic: Use updateAndGet (Java 8+)
    public int incrementIfPositive() {
        return value.updateAndGet(current -> {
            if (current > 0) {
                return current + 1;
            }
            return current;
        });
    }

    // Need to return old value: Use getAndUpdate
    public int multiplyByTwo() {
        return value.getAndUpdate(current -> current * 2);
    }

    // Involving external state: Manual CAS loop
    public int addWithLimit(int delta, int limit) {
        int current;
        int next;
        do {
            current = value.get();
            next = Math.min(current + delta, limit);
            if (next == current) {
                return current; // No update needed
            }
        } while (!value.compareAndSet(current, next));
        return next;
    }
}
```

### Avoid Unnecessary Atomic Operations

```java
public class AtomicEfficiency {
    private final AtomicInteger counter = new AtomicInteger(0);

    // Not recommended: Multiple atomic operations
    public void badIncrement() {
        if (counter.get() < 100) {    // Atomic read
            counter.incrementAndGet(); // Atomic write
        }
        // Problem: Value may be modified by other threads between operations
    }

    // Recommended: Single atomic operation
    public void goodIncrement() {
        counter.updateAndGet(current -> {
            if (current < 100) {
                return current + 1;
            }
            return current;
        });
    }

    // Batch operations: Calculate first, update once at the end
    public void batchAdd(int[] values) {
        int sum = 0;
        for (int value : values) {
            sum += value;
        }
        counter.addAndGet(sum); // Only one atomic operation
    }
}
```

### Use lazySet Appropriately

```java
public class LazySetExample {
    private final AtomicReference<Object> ref = new AtomicReference<>();

    // Normal set: Immediately visible, with memory barrier
    public void normalSet(Object value) {
        ref.set(value);
    }

    // lazySet: Eventually visible, no StoreLoad barrier, better performance
    // Use case: When immediate visibility is not needed, like cleanup before object recycling
    public void lazySetExample(Object value) {
        ref.lazySet(value);
    }

    // Typical use case: Reset state at the end of a loop
    public void processAndReset(Object[] items) {
        for (Object item : items) {
            ref.set(item);
            // Process item...
        }
        ref.lazySet(null); // Will eventually be seen, no need for immediate visibility
    }
}
```

## Common Pitfalls

### ABA Problem

```java
public class ABAProblem {
    private AtomicReference<String> ref = new AtomicReference<>("A");

    public void abaProblemDemo() throws InterruptedException {
        // Thread 1: Read A, prepare to change to C
        Thread t1 = new Thread(() -> {
            String current = ref.get();
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {}

            // Although the value is still A, it has actually been modified
            boolean success = ref.compareAndSet(current, "C");
            System.out.println("T1 CAS: " + success); // true, but may not be the expected result
        });

        // Thread 2: A -> B -> A
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

    // Solution: Use AtomicStampedReference
    private AtomicStampedReference<String> stampedRef =
        new AtomicStampedReference<>("A", 0);

    public void abaSolution() {
        int[] stampHolder = new int[1];
        String current = stampedRef.get(stampHolder);
        int stamp = stampHolder[0];

        // Even if the value is the same, it will fail if the version is different
        boolean success = stampedRef.compareAndSet(current, "C", stamp, stamp + 1);
    }
}
```

### Forgetting to Handle CAS Failure

```java
public class CASFailure {
    private AtomicInteger value = new AtomicInteger(0);

    // Wrong: Not handling CAS failure
    public void badCAS() {
        int current = value.get();
        value.compareAndSet(current, current + 1); // May fail, but not handled
    }

    // Correct: Loop retry until success
    public void goodCAS() {
        int current;
        do {
            current = value.get();
        } while (!value.compareAndSet(current, current + 1));
    }

    // Better: Use built-in method directly
    public void bestCAS() {
        value.incrementAndGet(); // Retry is handled internally
    }
}
```

### Compound Operations Are Not Atomic

```java
public class CompoundOperation {
    private AtomicInteger count = new AtomicInteger(0);
    private AtomicInteger max = new AtomicInteger(0);

    // Wrong: Combination of two atomic operations is not atomic
    public void badUpdate(int value) {
        count.incrementAndGet();
        if (value > max.get()) {
            max.set(value); // May overwrite updates from other threads
        }
    }

    // Correct: Use single atomic operation to update max
    public void goodUpdateMax(int value) {
        max.updateAndGet(current -> Math.max(current, value));
    }

    // If multiple values need to be updated simultaneously, consider using locks or immutable objects
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

### Excessive CPU Consumption from Spinning

```java
public class SpinningCPU {
    private AtomicBoolean lock = new AtomicBoolean(false);

    // Problem: High contention consumes a lot of CPU
    public void badSpinLock() {
        while (!lock.compareAndSet(false, true)) {
            // Idle spinning, consuming CPU
        }
        try {
            // Critical section
        } finally {
            lock.set(false);
        }
    }

    // Improvement: Add backoff strategy
    public void betterSpinLock() {
        int spins = 0;
        while (!lock.compareAndSet(false, true)) {
            if (spins < 10) {
                Thread.onSpinWait(); // Java 9+ hint that CPU is spinning
            } else if (spins < 20) {
                Thread.yield(); // Yield CPU
            } else {
                try {
                    Thread.sleep(1); // Brief sleep
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
            spins++;
        }
        try {
            // Critical section
        } finally {
            lock.set(false);
        }
    }
}
```

### LongAdder's sum() Is Not Precise

```java
public class LongAdderPrecision {
    private LongAdder adder = new LongAdder();

    public void demo() throws InterruptedException {
        // Start multiple threads for accumulation
        Thread[] threads = new Thread[10];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    adder.increment();
                }
            });
            threads[i].start();
        }

        // Note: During concurrent execution, sum() returns an approximate value
        System.out.println("sum during concurrency: " + adder.sum()); // May be inaccurate

        // After all threads complete, sum() is accurate
        for (Thread t : threads) {
            t.join();
        }
        System.out.println("sum after completion: " + adder.sum()); // Accurate
    }
}
```

## Performance Considerations

### CAS vs synchronized Performance Comparison

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class PerformanceComparison {
    private static final int THREAD_COUNT = 10;
    private static final int OPERATIONS_PER_THREAD = 1_000_000;

    // synchronized version
    static class SynchronizedCounter {
        private int count = 0;
        public synchronized void increment() { count++; }
        public synchronized int get() { return count; }
    }

    // AtomicInteger version
    static class AtomicCounter {
        private AtomicInteger count = new AtomicInteger(0);
        public void increment() { count.incrementAndGet(); }
        public int get() { return count.get(); }
    }

    // LongAdder version
    static class LongAdderCounter {
        private LongAdder count = new LongAdder();
        public void increment() { count.increment(); }
        public long get() { return count.sum(); }
    }

    // ReentrantLock version
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
        // Test synchronized
        benchmark("synchronized", () -> {
            SynchronizedCounter counter = new SynchronizedCounter();
            runTest(counter::increment);
        });

        // Test AtomicInteger
        benchmark("AtomicInteger", () -> {
            AtomicCounter counter = new AtomicCounter();
            runTest(counter::increment);
        });

        // Test LongAdder
        benchmark("LongAdder", () -> {
            LongAdderCounter counter = new LongAdderCounter();
            runTest(counter::increment);
        });

        // Test ReentrantLock
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
        // Warmup
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

### Selection Recommendations

| Scenario | Recommended Approach | Reason |
|----------|---------------------|--------|
| Low contention, simple counting | AtomicInteger/AtomicLong | Simple and efficient |
| High contention, accumulation only | LongAdder | Distributes hotspots, higher throughput |
| Need precise value | AtomicLong | LongAdder.sum() is imprecise during concurrency |
| Object reference update | AtomicReference | Lock-free reference updates |
| Potential ABA problem | AtomicStampedReference | Version stamp detection |
| Fields of existing classes | FieldUpdater | No need to modify class definition |
| Complex atomic operations | synchronized or Lock | CAS not suitable for complex logic |

### LongAdder Internal Principle

```
LongAdder internal structure:

+--------+
|  base  |  Base value, used only when contention is low
+--------+
    |
    v
+--------+--------+--------+--------+
| Cell 0 | Cell 1 | Cell 2 | Cell 3 |  Cell array (expands under contention)
+--------+--------+--------+--------+

Accumulation strategy:
1. First attempt CAS update on base
2. On failure, locate a Cell based on thread hash
3. Perform CAS operation on the Cell
4. On Cell CAS failure, try expansion or rehash

sum() = base + sum(cells[i])
```

## Practical Scenarios

### High-Performance Counter

```java
import java.util.concurrent.atomic.*;

public class HighPerformanceCounter {
    private final LongAdder requestCount = new LongAdder();
    private final LongAdder successCount = new LongAdder();
    private final LongAdder errorCount = new LongAdder();
    private final LongAdder totalLatency = new LongAdder();

    // Record request
    public void recordRequest(long latencyMs, boolean success) {
        requestCount.increment();
        totalLatency.add(latencyMs);

        if (success) {
            successCount.increment();
        } else {
            errorCount.increment();
        }
    }

    // Get snapshot (for monitoring)
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
                "Requests: %d, Success: %d, Failures: %d, Success rate: %.2f%%, Avg latency: %.2fms",
                requests, successes, errors, getSuccessRate(), getAverageLatency()
            );
        }
    }
}
```

### Lock-Free Cache Implementation

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

    // Get cache value
    public V get(K key) {
        AtomicReference<CacheEntry<V>> ref = cache.get(key);
        if (ref == null) {
            return null;
        }

        CacheEntry<V> entry = ref.get();
        if (entry == null || entry.isExpired()) {
            // Clean up expired entry
            cache.remove(key, ref);
            return null;
        }

        return entry.value;
    }

    // Set cache value
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

    // Set if absent
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

        // CAS set new value
        if (ref.compareAndSet(existing, newEntry)) {
            return null; // Successfully set
        }

        // CAS failed, return current value
        CacheEntry<V> current = ref.get();
        return current == null ? null : current.value;
    }

    // Remove
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

### Sequence Number Generator

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

    // Generate unique sequence number: prefix + timestamp + sequence
    public String nextId() {
        String timePrefix = LocalDateTime.now().format(FORMATTER);

        // Check if sequence needs to be reset (when second changes)
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

    // Get current sequence number (without incrementing)
    public long currentSequence() {
        return sequence.get();
    }

    public static void main(String[] args) throws InterruptedException {
        SequenceGenerator generator = new SequenceGenerator("ORD");

        // Concurrent sequence number generation
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

### Rate Limiter Implementation

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

    // Try to acquire permit
    public boolean tryAcquire() {
        long now = System.currentTimeMillis();
        long windowStartTime = windowStart.get();

        // Check if window needs to be reset
        if (now - windowStartTime >= 1000) {
            // Try to reset window
            if (windowStart.compareAndSet(windowStartTime, now)) {
                currentCount.set(1);
                return true;
            }
            // CAS failed, another thread already reset, retry
            return tryAcquire();
        }

        // Try to acquire within current window
        int current = currentCount.get();
        if (current >= maxRequestsPerSecond) {
            return false;
        }

        // CAS increment count
        return currentCount.compareAndSet(current, current + 1) || tryAcquire();
    }

    // Blocking acquire permit
    public void acquire() throws InterruptedException {
        while (!tryAcquire()) {
            Thread.sleep(10); // Brief wait before retry
        }
    }

    // Get current window request count
    public int getCurrentCount() {
        return currentCount.get();
    }

    public static void main(String[] args) throws InterruptedException {
        RateLimiter limiter = new RateLimiter(10); // Max 10 requests per second

        // Simulate requests
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

## Interview Key Points

### What Is the Principle of CAS? What Are Its Problems?

**Answer Points:**
- CAS (Compare-And-Swap) is a lock-free algorithm with three operands: memory location V, expected value A, new value B
- Only when V's value equals A, V is updated to B; the entire operation is atomic
- Implemented at the low level through CPU's `cmpxchg` instruction

**Problems with CAS:**
1. **ABA Problem**: Value changes from A to B then back to A, CAS cannot detect the change
   - Solution: Use `AtomicStampedReference` to add version stamps
2. **Spin Overhead**: Repeated retries consume CPU under high contention
3. **Only Guarantees Atomicity of Single Variable**: Multi-variable operations require locks

### What's the Difference Between AtomicInteger and synchronized?

| Aspect | AtomicInteger | synchronized |
|--------|---------------|--------------|
| Implementation | CAS + volatile | Object monitor lock |
| Blocking | Non-blocking (spin) | Blocking |
| Use Cases | Simple atomic operations | Complex critical sections |
| Performance | Faster under low contention | More stable under high contention |
| Functionality | Only atomic updates | Can protect any code block |

### Why Is LongAdder Faster Than AtomicLong?

**Answer Points:**
- AtomicLong: All threads compete for the same variable, high CAS failure rate under high concurrency
- LongAdder: Uses segmentation, internally maintains `base` and `Cell[]` array
- Different threads can update different Cells, reducing contention
- Final result = base + sum(cells)

**Applicable Scenarios:**
- LongAdder: High-concurrency writes, no need for real-time precise value (e.g., statistical counting)
- AtomicLong: Need precise value, or low-concurrency scenarios

### How to Solve the ABA Problem?

```java
// Use AtomicStampedReference
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(100, 0);

int[] stampHolder = new int[1];
Integer value = ref.get(stampHolder);
int stamp = stampHolder[0];

// Check version stamp during update
boolean success = ref.compareAndSet(value, 200, stamp, stamp + 1);
```

### What's the Difference Between volatile and Atomic Classes?

| Feature | volatile | Atomic Classes |
|---------|----------|----------------|
| Visibility | Guaranteed | Guaranteed |
| Atomicity | Not guaranteed (e.g., i++) | Guaranteed |
| Ordering | Prohibits reordering | Guaranteed |
| Applicable Operations | Single variable read/write | Read-modify-write operations |

```java
// volatile cannot guarantee atomicity of i++
private volatile int count;
count++; // Non-atomic operation

// AtomicInteger guarantees atomicity
private AtomicInteger count = new AtomicInteger();
count.incrementAndGet(); // Atomic operation
```

### What Are the Uses and Limitations of FieldUpdater?

**Uses:**
- Perform atomic updates on volatile fields of existing classes
- Avoid creating AtomicXxx objects for each field, saving memory

**Limitations:**
- Field must be volatile
- Field cannot be static (unless using special methods)
- Field cannot be final
- Access permission requirement: Caller must have access to the field

### What's the Difference Between compareAndSet and weakCompareAndSet?

- `compareAndSet`: Strict CAS, guarantees atomicity and memory visibility
- `weakCompareAndSet`: May spuriously fail (may fail even if expected value matches)
  - Better performance on some platforms
  - Suitable for loop retry scenarios
  - After Java 9, both behave essentially the same

## Further Reading

### Official Documentation
- [java.util.concurrent.atomic Package](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/atomic/package-summary.html)
- [Java Language Specification - volatile](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.3.1.4)

### Classic Books
- "Java Concurrency in Practice" - Brian Goetz
- "The Art of Java Concurrency Programming" - Fang Tengfei
- "Understanding the JVM" - Zhou Zhiming

### Quality Articles
- [JEP 193: Variable Handles](https://openjdk.org/jeps/193)
- [Doug Lea's JSR-166 Concurrency Utilities](http://gee.cs.oswego.edu/dl/concurrency-interest/)
- [The JSR-133 Cookbook for Compiler Writers](http://gee.cs.oswego.edu/dl/jmm/cookbook.html)

### Source Code Study
- `java.util.concurrent.atomic` package in OpenJDK source code
- Implementation of `Unsafe` class (understanding low-level principles)
- Source code analysis of `Striped64` (parent class of LongAdder)
