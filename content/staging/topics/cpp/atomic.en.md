---
title: C++ 原子操作
description: 深入理解 C++ 原子操作：std::atomic、内存序、compare_exchange、atomic_flag 与无锁编程
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - 原子操作
  - 并发
  - 无锁编程
  - 内存序
status: imported
origin: old/src/content/docs/cpp/atomic.en.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 并发
  order: 8
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What are Atomic Operations

An atomic operation is an operation that cannot be interrupted by other threads during execution. Such operations either execute completely or not at all - there is no intermediate state. In multithreaded programming, atomic operations are the fundamental mechanism for ensuring data consistency.

The word "atomic" comes from the Greek word atomos, meaning "indivisible". In computer science, atomic operations ensure that even when multiple threads access the same data simultaneously, each operation remains an indivisible whole.

### Why We Need Atomic Operations

Consider a simple counter increment operation `counter++`. At the assembly level, this actually involves three steps:

1. Read the value of counter from memory into a register
2. Add 1 to the value in the register
3. Write the result back to memory

In a multithreaded environment, if two threads execute this operation simultaneously, the following situation may occur:

```
Thread A: Read counter (value is 5)
Thread B: Read counter (value is 5)
Thread A: Add 1 (register contains 6)
Thread B: Add 1 (register contains 6)
Thread A: Write back (counter = 6)
Thread B: Write back (counter = 6)
```

The final value of counter is 6 instead of the expected 7. This is a typical Data Race problem.

### Atomic Operations vs Mutex Locks

| Feature | Atomic Operations | Mutex Locks |
|---------|-------------------|-------------|
| Performance | Usually faster (hardware-supported) | Relatively slower (requires system calls) |
| Granularity | Single variable operations | Can protect any code block |
| Blocking | Non-blocking (lock-free) | May block waiting |
| Complexity | Simple operations are easy to use | More intuitive for complex logic |
| Use Cases | Counters, flags, simple state | Complex data structures, multi-step operations |

### Historical Background

Before C++11, implementing atomic operations required platform-specific APIs (such as Windows Interlocked functions or GCC's `__sync` built-in functions). The C++11 standard introduced the `<atomic>` header file, providing cross-platform atomic operation support, making it possible to write portable concurrent code.

## Core Principles

### Atomicity at the Hardware Level

Modern CPUs support atomic operations through the following mechanisms:

1. **Bus Lock**: Early implementation method, locks the entire system bus
2. **Cache Lock**: Modern implementation method, locks only the relevant cache line
3. **Atomic Instructions**: Such as x86's `LOCK` prefix instructions, `CMPXCHG` instruction

```
CPU Core 1          CPU Core 2          Memory
    |                   |                |
    v                   v                |
+---------+        +---------+          |
| L1 Cache |        | L1 Cache |          |
+----+----+        +----+----+          |
     |                  |               |
     v                  v               |
+-----------------------------+         |
|         L2/L3 Cache          |<--------+
+--------------+--------------+         |
               |                        |
               v                        v
         MESI Protocol ensures cache coherency
```

### Cache Coherency Protocol (MESI)

The MESI protocol defines four states for cache lines:

- **Modified**: Data has been modified by the current core, inconsistent with memory
- **Exclusive**: Data is only in the current core's cache, consistent with memory
- **Shared**: Data may be in multiple cores' caches, consistent with memory
- **Invalid**: Cache line is invalid

Atomic operations ensure data consistency between multiple cores through the MESI protocol.

### Memory Order

Memory order defines the visibility and ordering guarantees of atomic operations in a multithreaded environment. C++ provides six memory orders:

```cpp
enum memory_order {
    memory_order_relaxed,    // Weakest guarantee, only ensures atomicity
    memory_order_consume,    // Acquire operation for dependent data
    memory_order_acquire,    // Acquire operation, subsequent reads/writes cannot be reordered before it
    memory_order_release,    // Release operation, preceding reads/writes cannot be reordered after it
    memory_order_acq_rel,    // Has both acquire and release semantics
    memory_order_seq_cst     // Sequential consistency (strongest guarantee, default)
};
```

Memory order strength ranking: `relaxed` < `consume` < `acquire/release` < `acq_rel` < `seq_cst`

### Memory Barriers

Memory barriers (Memory Barrier/Fence) are low-level mechanisms that ensure the ordering of memory operations:

```
        Compiler Reorder Barrier            CPU Reorder Barrier
              |                                    |
    +---------+---------+            +-------------+-------------+
    |                   |            |                           |
    v                   v            v                           v
+------+            +----------+        +------+
| Store |  -------->|  Barrier  | ------>| Load  |
| Store |           |          |        | Load  |
| Store |  <--------|  Barrier  | <------| Load  |
+------+            +----------+        +------+
```

## Key Points

### std::atomic Basic Types

C++ provides atomic type aliases for common types:

```cpp
// Integer types
std::atomic_bool      // std::atomic<bool>
std::atomic_char      // std::atomic<char>
std::atomic_int       // std::atomic<int>
std::atomic_long      // std::atomic<long>
std::atomic_llong     // std::atomic<long long>

// Unsigned integer types
std::atomic_uint      // std::atomic<unsigned int>
std::atomic_ulong     // std::atomic<unsigned long>

// Fixed-width integer types
std::atomic_int8_t    // std::atomic<int8_t>
std::atomic_int16_t   // std::atomic<int16_t>
std::atomic_int32_t   // std::atomic<int32_t>
std::atomic_int64_t   // std::atomic<int64_t>

// Pointer types
std::atomic<T*>       // Atomic type for pointers

// User-defined types (must satisfy specific conditions)
std::atomic<MyStruct> // Requires is_trivially_copyable
```

### std::atomic Main Operations

| Operation | Description |
|-----------|-------------|
| `store(val, order)` | Atomic write |
| `load(order)` | Atomic read |
| `exchange(val, order)` | Atomic exchange, returns old value |
| `compare_exchange_weak` | Weak CAS operation |
| `compare_exchange_strong` | Strong CAS operation |
| `fetch_add/sub/and/or/xor` | Atomic arithmetic/bitwise operations |
| `operator++/--` | Atomic increment/decrement |
| `is_lock_free()` | Check if lock-free implementation |

### Detailed Explanation of Each Memory Order

**memory_order_relaxed**
- Only guarantees atomicity of the operation
- Does not provide any synchronization or ordering guarantees
- Suitable for scenarios like statistics counters that don't require synchronization

**memory_order_acquire**
- Used for load operations
- In the current thread, all reads/writes after this operation cannot be reordered before it
- Pairs with release to form a synchronization relationship

**memory_order_release**
- Used for store operations
- In the current thread, all reads/writes before this operation cannot be reordered after it
- Pairs with acquire to form a synchronization relationship

**memory_order_acq_rel**
- Used for read-modify-write operations (such as CAS)
- Has both acquire and release semantics

**memory_order_seq_cst**
- Sequential consistency, strongest guarantee
- All threads see the same order of operations
- Default memory order, highest performance overhead

## Code Examples

### Basic Atomic Operations

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <vector>

// Counter using atomic type
std::atomic<int> counter{0};

void incrementCounter(int times) {
    for (int i = 0; i < times; ++i) {
        // Atomic increment, equivalent to counter.fetch_add(1)
        counter++;
    }
}

int main() {
    const int numThreads = 10;
    const int incrementsPerThread = 10000;

    std::vector<std::thread> threads;

    // Create multiple threads to increment counter simultaneously
    for (int i = 0; i < numThreads; ++i) {
        threads.emplace_back(incrementCounter, incrementsPerThread);
    }

    // Wait for all threads to complete
    for (auto& t : threads) {
        t.join();
    }

    // Result is always correct: 100000
    std::cout << "Final count: " << counter << std::endl;
    std::cout << "Expected value: " << numThreads * incrementsPerThread << std::endl;

    return 0;
}
```

### Various Atomic Operation Methods

```cpp
#include <iostream>
#include <atomic>

int main() {
    std::atomic<int> value{10};

    // store - atomic write
    value.store(20);
    std::cout << "After store: " << value << std::endl;

    // load - atomic read
    int loaded = value.load();
    std::cout << "Loaded value: " << loaded << std::endl;

    // exchange - atomic exchange, returns old value
    int old = value.exchange(30);
    std::cout << "exchange old value: " << old << ", new value: " << value << std::endl;

    // fetch_add - atomic addition, returns old value
    old = value.fetch_add(5);
    std::cout << "fetch_add old value: " << old << ", new value: " << value << std::endl;

    // fetch_sub - atomic subtraction, returns old value
    old = value.fetch_sub(10);
    std::cout << "fetch_sub old value: " << old << ", new value: " << value << std::endl;

    // fetch_and - atomic bitwise AND
    value.store(0xFF);
    old = value.fetch_and(0x0F);
    std::cout << "fetch_and old value: " << old << ", new value: " << value << std::endl;

    // fetch_or - atomic bitwise OR
    old = value.fetch_or(0xF0);
    std::cout << "fetch_or old value: " << old << ", new value: " << value << std::endl;

    // fetch_xor - atomic bitwise XOR
    old = value.fetch_xor(0xFF);
    std::cout << "fetch_xor old value: " << old << ", new value: " << value << std::endl;

    return 0;
}
```

### compare_exchange Detailed Explanation

```cpp
#include <iostream>
#include <atomic>
#include <thread>

std::atomic<int> value{0};

// compare_exchange_weak example
// May have spurious failure, needs to be used in a loop
void casWeak() {
    int expected = 0;
    int desired = 1;

    // If value == expected, set value = desired, return true
    // If value != expected, set expected = value, return false
    // The weak version may fail spuriously, returning false even when value == expected
    while (!value.compare_exchange_weak(expected, desired)) {
        // On failure, expected is updated to current value
        std::cout << "CAS weak failed, expected updated to: " << expected << std::endl;
        expected = 0;  // Reset expected
    }
    std::cout << "CAS weak succeeded, value = " << value << std::endl;
}

// compare_exchange_strong example
// Does not have spurious failures, but may be slower than weak version
void casStrong() {
    int expected = 1;
    int desired = 2;

    if (value.compare_exchange_strong(expected, desired)) {
        std::cout << "CAS strong succeeded, value = " << value << std::endl;
    } else {
        std::cout << "CAS strong failed, current value: " << expected << std::endl;
    }
}

// Using CAS to implement atomic maximum update
void atomicMax(std::atomic<int>& target, int newValue) {
    int current = target.load();
    while (newValue > current &&
           !target.compare_exchange_weak(current, newValue)) {
        // current is automatically updated on failure
    }
}

int main() {
    casWeak();
    casStrong();

    // Test atomic maximum
    std::atomic<int> maxValue{0};
    std::vector<std::thread> threads;

    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&maxValue, i]() {
            atomicMax(maxValue, i * 10);
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "Maximum value: " << maxValue << std::endl;  // Should be 90

    return 0;
}
```

### Memory Order Examples

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <cassert>

// Example 1: Relaxed ordering
// Only guarantees atomicity, not ordering
namespace relaxed_example {
    std::atomic<int> x{0}, y{0};

    void writer() {
        x.store(1, std::memory_order_relaxed);
        y.store(1, std::memory_order_relaxed);
    }

    void reader() {
        // Due to relaxed ordering, may see y=1 but x=0
        while (y.load(std::memory_order_relaxed) != 1);
        // Cannot guarantee x is 1 at this point
        std::cout << "x = " << x.load(std::memory_order_relaxed) << std::endl;
    }
}

// Example 2: Release-Acquire ordering
// Establishes synchronization relationship
namespace release_acquire_example {
    std::atomic<int> data{0};
    std::atomic<bool> ready{false};

    void producer() {
        data.store(42, std::memory_order_relaxed);  // (1)
        ready.store(true, std::memory_order_release);  // (2) Release
    }

    void consumer() {
        while (!ready.load(std::memory_order_acquire));  // (3) Acquire
        // Release-Acquire guarantees: (1) happens-before code after (3)
        int value = data.load(std::memory_order_relaxed);  // (4)
        assert(value == 42);  // Guaranteed to succeed
        std::cout << "Consumer read: " << value << std::endl;
    }
}

// Example 3: Sequential consistency
// All threads see the same order of operations
namespace seq_cst_example {
    std::atomic<bool> x{false}, y{false};
    std::atomic<int> z{0};

    void write_x() {
        x.store(true, std::memory_order_seq_cst);
    }

    void write_y() {
        y.store(true, std::memory_order_seq_cst);
    }

    void read_x_then_y() {
        while (!x.load(std::memory_order_seq_cst));
        if (y.load(std::memory_order_seq_cst)) {
            ++z;
        }
    }

    void read_y_then_x() {
        while (!y.load(std::memory_order_seq_cst));
        if (x.load(std::memory_order_seq_cst)) {
            ++z;
        }
    }

    void test() {
        std::thread a(write_x);
        std::thread b(write_y);
        std::thread c(read_x_then_y);
        std::thread d(read_y_then_x);

        a.join(); b.join(); c.join(); d.join();

        // seq_cst guarantees z is at least 1
        assert(z.load() != 0);
        std::cout << "z = " << z << std::endl;
    }
}

int main() {
    std::cout << "=== Release-Acquire Example ===" << std::endl;
    std::thread t1(release_acquire_example::producer);
    std::thread t2(release_acquire_example::consumer);
    t1.join();
    t2.join();

    std::cout << "\n=== Seq_cst Example ===" << std::endl;
    seq_cst_example::test();

    return 0;
}
```

### std::atomic_flag Spinlock

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <vector>

class SpinLock {
private:
    std::atomic_flag flag = ATOMIC_FLAG_INIT;

public:
    void lock() {
        // test_and_set returns old value, if old value is false it means lock is acquired
        while (flag.test_and_set(std::memory_order_acquire)) {
            // Spin waiting
            // Optional: add yield or pause instruction to reduce CPU consumption
            #if defined(__x86_64__) || defined(_M_X64)
            __builtin_ia32_pause();  // x86 PAUSE instruction
            #endif
        }
    }

    void unlock() {
        flag.clear(std::memory_order_release);
    }

    // RAII lock guard
    class Guard {
    private:
        SpinLock& lock_;
    public:
        explicit Guard(SpinLock& lock) : lock_(lock) {
            lock_.lock();
        }
        ~Guard() {
            lock_.unlock();
        }
        Guard(const Guard&) = delete;
        Guard& operator=(const Guard&) = delete;
    };
};

// Improved spinlock: with backoff strategy
class AdaptiveSpinLock {
private:
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
    static constexpr int MAX_SPINS = 1000;

public:
    void lock() {
        int spins = 0;
        while (flag.test_and_set(std::memory_order_acquire)) {
            if (++spins > MAX_SPINS) {
                // Exceeded maximum spin count, yield CPU
                std::this_thread::yield();
                spins = 0;
            }
        }
    }

    void unlock() {
        flag.clear(std::memory_order_release);
    }
};

// Test spinlock
int main() {
    SpinLock spinLock;
    int counter = 0;

    auto increment = [&]() {
        for (int i = 0; i < 10000; ++i) {
            SpinLock::Guard guard(spinLock);
            ++counter;
        }
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(increment);
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "Counter value: " << counter << std::endl;  // Should be 100000

    return 0;
}
```

### Lock-Free Data Structure: Stack

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <vector>
#include <optional>

template<typename T>
class LockFreeStack {
private:
    struct Node {
        T data;
        Node* next;
        Node(const T& value) : data(value), next(nullptr) {}
    };

    std::atomic<Node*> head{nullptr};

public:
    void push(const T& value) {
        Node* newNode = new Node(value);
        newNode->next = head.load(std::memory_order_relaxed);

        // CAS loop: try to set new node as head
        while (!head.compare_exchange_weak(
            newNode->next,      // expected, updated on failure
            newNode,            // desired
            std::memory_order_release,
            std::memory_order_relaxed
        )) {
            // On failure, newNode->next has been updated to current head
        }
    }

    std::optional<T> pop() {
        Node* oldHead = head.load(std::memory_order_relaxed);

        while (oldHead != nullptr) {
            // CAS loop: try to set head's next as new head
            if (head.compare_exchange_weak(
                oldHead,
                oldHead->next,
                std::memory_order_acquire,
                std::memory_order_relaxed
            )) {
                T value = std::move(oldHead->data);
                delete oldHead;  // Note: simplified version, has ABA problem
                return value;
            }
            // On failure, oldHead has been updated to current head
        }

        return std::nullopt;
    }

    bool empty() const {
        return head.load(std::memory_order_relaxed) == nullptr;
    }

    ~LockFreeStack() {
        while (pop().has_value()) {}
    }
};

int main() {
    LockFreeStack<int> stack;

    // Concurrent push
    std::vector<std::thread> pushers;
    for (int i = 0; i < 5; ++i) {
        pushers.emplace_back([&stack, i]() {
            for (int j = 0; j < 100; ++j) {
                stack.push(i * 100 + j);
            }
        });
    }

    for (auto& t : pushers) {
        t.join();
    }

    // Concurrent pop
    std::atomic<int> popCount{0};
    std::vector<std::thread> poppers;
    for (int i = 0; i < 5; ++i) {
        poppers.emplace_back([&stack, &popCount]() {
            while (auto val = stack.pop()) {
                popCount.fetch_add(1, std::memory_order_relaxed);
            }
        });
    }

    for (auto& t : poppers) {
        t.join();
    }

    std::cout << "Number of elements popped: " << popCount << std::endl;  // Should be 500

    return 0;
}
```

### Lock-Free Queue (Single Producer Single Consumer)

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <vector>
#include <optional>

template<typename T, size_t Capacity>
class SPSCQueue {
private:
    std::array<T, Capacity> buffer;
    alignas(64) std::atomic<size_t> head{0};  // Consumer position
    alignas(64) std::atomic<size_t> tail{0};  // Producer position

public:
    bool push(const T& value) {
        size_t currentTail = tail.load(std::memory_order_relaxed);
        size_t nextTail = (currentTail + 1) % Capacity;

        // Check if queue is full
        if (nextTail == head.load(std::memory_order_acquire)) {
            return false;  // Queue is full
        }

        buffer[currentTail] = value;
        tail.store(nextTail, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        size_t currentHead = head.load(std::memory_order_relaxed);

        // Check if queue is empty
        if (currentHead == tail.load(std::memory_order_acquire)) {
            return std::nullopt;  // Queue is empty
        }

        T value = std::move(buffer[currentHead]);
        head.store((currentHead + 1) % Capacity, std::memory_order_release);
        return value;
    }

    bool empty() const {
        return head.load(std::memory_order_relaxed) ==
               tail.load(std::memory_order_relaxed);
    }

    size_t size() const {
        size_t h = head.load(std::memory_order_relaxed);
        size_t t = tail.load(std::memory_order_relaxed);
        return (t - h + Capacity) % Capacity;
    }
};

int main() {
    SPSCQueue<int, 1024> queue;
    std::atomic<bool> done{false};
    std::atomic<int> sum{0};

    // Producer thread
    std::thread producer([&queue, &done]() {
        for (int i = 0; i < 10000; ++i) {
            while (!queue.push(i)) {
                std::this_thread::yield();  // Queue full, wait
            }
        }
        done.store(true, std::memory_order_release);
    });

    // Consumer thread
    std::thread consumer([&queue, &done, &sum]() {
        while (!done.load(std::memory_order_acquire) || !queue.empty()) {
            if (auto val = queue.pop()) {
                sum.fetch_add(*val, std::memory_order_relaxed);
            }
        }
    });

    producer.join();
    consumer.join();

    // Verify: 0 + 1 + 2 + ... + 9999 = 49995000
    std::cout << "Total sum: " << sum << std::endl;
    std::cout << "Expected: " << (9999 * 10000 / 2) << std::endl;

    return 0;
}
```

## Best Practices

### Choose the Appropriate Memory Order

```cpp
#include <atomic>

// Rule 1: Use relaxed for simple counters
std::atomic<int> counter{0};
void increment() {
    counter.fetch_add(1, std::memory_order_relaxed);
}

// Rule 2: Use release/acquire for publishing data
std::atomic<bool> ready{false};
int data;

void publish() {
    data = 42;
    ready.store(true, std::memory_order_release);
}

void consume() {
    while (!ready.load(std::memory_order_acquire));
    assert(data == 42);  // Guaranteed to succeed
}

// Rule 3: Use seq_cst (default) when uncertain
std::atomic<int> value{0};
void safeOperation() {
    value.store(1);  // Default seq_cst
    int v = value.load();  // Default seq_cst
}
```

### Avoiding the ABA Problem

```cpp
#include <atomic>
#include <cstdint>

// ABA problem example:
// 1. Thread A reads pointer P pointing to node A
// 2. Thread B deletes node A, allocates new node, happens to be at same address
// 3. Thread A's CAS succeeds, but data has actually changed

// Solution 1: Use versioned pointer
template<typename T>
struct VersionedPointer {
    T* ptr;
    uintptr_t version;
};

// Solution 2: Use double-width CAS (if platform supports)
// Use 128-bit atomic operations on 64-bit systems
struct TaggedPointer {
    void* ptr;
    uintptr_t tag;
};

// Check if lock-free double-width operations are supported
static_assert(std::atomic<TaggedPointer>::is_always_lock_free,
              "Requires lock-free double-width CAS support");
```

### Using compare_exchange Correctly

```cpp
#include <atomic>

// Wrong example: not handling failure case
void badCAS(std::atomic<int>& value) {
    int expected = 0;
    value.compare_exchange_strong(expected, 1);
    // expected may have been modified, but not used
}

// Correct example: CAS loop pattern
void goodCAS(std::atomic<int>& value) {
    int expected = value.load();
    while (!value.compare_exchange_weak(expected, expected + 1)) {
        // expected is automatically updated on failure
        // Continue trying
    }
}

// Correct example: conditional CAS
bool conditionalCAS(std::atomic<int>& value, int threshold) {
    int expected = value.load();
    while (expected < threshold) {
        if (value.compare_exchange_weak(expected, expected + 1)) {
            return true;  // Successfully incremented
        }
        // expected is updated, check if condition still holds
    }
    return false;  // Threshold reached
}
```

### Avoiding False Sharing

```cpp
#include <atomic>
#include <thread>
#include <vector>

// False sharing problem: two atomic variables in the same cache line
struct BadLayout {
    std::atomic<int> counter1;  // 64-byte cache line
    std::atomic<int> counter2;  // In same cache line as counter1
};

// Solution: cache line alignment
struct GoodLayout {
    alignas(64) std::atomic<int> counter1;
    alignas(64) std::atomic<int> counter2;
};

// C++17: Use hardware_destructive_interference_size
#ifdef __cpp_lib_hardware_interference_size
struct OptimalLayout {
    alignas(std::hardware_destructive_interference_size)
        std::atomic<int> counter1;
    alignas(std::hardware_destructive_interference_size)
        std::atomic<int> counter2;
};
#endif
```

### Atomic Smart Pointers (C++20)

```cpp
#include <atomic>
#include <memory>

// C++20 introduced atomic smart pointer specializations
#if __cplusplus >= 202002L
void atomicSharedPtrExample() {
    std::atomic<std::shared_ptr<int>> atomicPtr;

    // Atomic store
    atomicPtr.store(std::make_shared<int>(42));

    // Atomic load
    auto ptr = atomicPtr.load();

    // Atomic exchange
    auto oldPtr = atomicPtr.exchange(std::make_shared<int>(100));

    // CAS
    std::shared_ptr<int> expected = ptr;
    std::shared_ptr<int> desired = std::make_shared<int>(200);
    atomicPtr.compare_exchange_strong(expected, desired);
}
#endif
```

## Common Pitfalls

### Pitfall 1: Wrong Memory Order Selection

```cpp
#include <atomic>
#include <thread>

std::atomic<int> data{0};
std::atomic<bool> ready{false};

// Wrong: using relaxed for publishing data
void badProducer() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_relaxed);  // Dangerous!
}

// Wrong: consumer may not see new value of data
void badConsumer() {
    while (!ready.load(std::memory_order_relaxed));
    int value = data.load(std::memory_order_relaxed);
    // value may not be 42!
}

// Correct: use release/acquire
void goodProducer() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_release);
}

void goodConsumer() {
    while (!ready.load(std::memory_order_acquire));
    int value = data.load(std::memory_order_relaxed);
    // value is guaranteed to be 42
}
```

### Pitfall 2: Spurious Failure of compare_exchange_weak

```cpp
#include <atomic>

// Wrong: not using weak version in a loop
void badWeakCAS(std::atomic<int>& value) {
    int expected = 0;
    // weak version may fail spuriously
    if (value.compare_exchange_weak(expected, 1)) {
        // May not execute even if value is indeed 0
    }
}

// Correct: use weak in a loop, or use strong
void goodCAS(std::atomic<int>& value) {
    int expected = 0;
    // Method 1: use weak in loop (recommended for loop scenarios)
    while (!value.compare_exchange_weak(expected, 1) && expected == 0) {
        // Retry
    }

    // Method 2: use strong for single check
    expected = 0;
    value.compare_exchange_strong(expected, 1);
}
```

### Pitfall 3: Mixing Non-Atomic Operations

```cpp
#include <atomic>

class Counter {
    std::atomic<int> count{0};
    int nonAtomicCount = 0;  // Dangerous!

public:
    // Wrong: mixing atomic and non-atomic operations
    void badIncrement() {
        count++;           // Atomic
        nonAtomicCount++;  // Non-atomic, data race!
    }

    // Wrong: non-atomic read between atomic operations
    void badCheck() {
        if (count > 0) {        // Atomic read
            // count may have changed by now
            int temp = count;   // Another atomic read
            // temp may be inconsistent with the check above
        }
    }
};
```

### Pitfall 4: Copying Atomic Types

```cpp
#include <atomic>

void atomicCopyPitfall() {
    std::atomic<int> a{10};

    // Wrong: cannot directly copy atomic types
    // std::atomic<int> b = a;  // Compile error!

    // Correct: explicitly load then store
    std::atomic<int> b{a.load()};

    // Or use store
    std::atomic<int> c{0};
    c.store(a.load());
}
```

### Pitfall 5: Misunderstanding is_lock_free

```cpp
#include <atomic>
#include <iostream>

struct Large {
    int data[100];
};

void lockFreeCheck() {
    std::atomic<int> smallAtomic;
    std::atomic<Large> largeAtomic;

    // Small types are usually lock-free
    std::cout << "Is int lock-free: "
              << smallAtomic.is_lock_free() << std::endl;  // Usually true

    // Large types may not be lock-free
    std::cout << "Is Large lock-free: "
              << largeAtomic.is_lock_free() << std::endl;  // May be false

    // Compile-time check (C++17)
    static_assert(std::atomic<int>::is_always_lock_free,
                  "int should always be lock-free");
}
```

## Performance Considerations

### Performance Comparison of Different Memory Orders

```cpp
#include <atomic>
#include <chrono>
#include <iostream>
#include <thread>

const int ITERATIONS = 100000000;

void benchmarkMemoryOrder() {
    std::atomic<int> counter{0};

    // Relaxed
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < ITERATIONS; ++i) {
        counter.fetch_add(1, std::memory_order_relaxed);
    }
    auto relaxedTime = std::chrono::high_resolution_clock::now() - start;

    counter = 0;

    // Seq_cst
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < ITERATIONS; ++i) {
        counter.fetch_add(1, std::memory_order_seq_cst);
    }
    auto seqCstTime = std::chrono::high_resolution_clock::now() - start;

    std::cout << "Relaxed: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(relaxedTime).count()
              << " ms" << std::endl;
    std::cout << "Seq_cst: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(seqCstTime).count()
              << " ms" << std::endl;
}
```

### Atomic Operations vs Mutex Lock Performance

```cpp
#include <atomic>
#include <mutex>
#include <chrono>
#include <iostream>
#include <thread>
#include <vector>

const int THREADS = 4;
const int OPS_PER_THREAD = 1000000;

void benchmarkAtomicVsMutex() {
    // Atomic counter
    std::atomic<int> atomicCounter{0};
    auto start = std::chrono::high_resolution_clock::now();

    std::vector<std::thread> threads;
    for (int i = 0; i < THREADS; ++i) {
        threads.emplace_back([&atomicCounter]() {
            for (int j = 0; j < OPS_PER_THREAD; ++j) {
                atomicCounter.fetch_add(1, std::memory_order_relaxed);
            }
        });
    }
    for (auto& t : threads) t.join();

    auto atomicTime = std::chrono::high_resolution_clock::now() - start;

    // Mutex counter
    int mutexCounter = 0;
    std::mutex mtx;
    threads.clear();

    start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < THREADS; ++i) {
        threads.emplace_back([&mutexCounter, &mtx]() {
            for (int j = 0; j < OPS_PER_THREAD; ++j) {
                std::lock_guard<std::mutex> lock(mtx);
                ++mutexCounter;
            }
        });
    }
    for (auto& t : threads) t.join();

    auto mutexTime = std::chrono::high_resolution_clock::now() - start;

    std::cout << "Atomic operations: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(atomicTime).count()
              << " ms" << std::endl;
    std::cout << "Mutex lock: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(mutexTime).count()
              << " ms" << std::endl;
}
```

### Performance Optimization Tips

1. **Choose the weakest memory order**: Use the weakest memory order that still ensures correctness
2. **Avoid false sharing**: Ensure frequently accessed atomic variables are in different cache lines
3. **Batch operations**: If possible, accumulate multiple operations and update once
4. **Read-heavy scenarios**: Consider using RCU (Read-Copy-Update) pattern
5. **Avoid over-synchronization**: Analyze where synchronization is truly needed

## Practical Scenarios

### Scenario 1: Thread-Safe Singleton Pattern

```cpp
#include <atomic>
#include <mutex>

class Singleton {
private:
    static std::atomic<Singleton*> instance;
    static std::mutex mutex;

    Singleton() = default;

public:
    static Singleton* getInstance() {
        Singleton* tmp = instance.load(std::memory_order_acquire);
        if (tmp == nullptr) {
            std::lock_guard<std::mutex> lock(mutex);
            tmp = instance.load(std::memory_order_relaxed);
            if (tmp == nullptr) {
                tmp = new Singleton();
                instance.store(tmp, std::memory_order_release);
            }
        }
        return tmp;
    }

    // Using C++11 static local variable (recommended approach)
    static Singleton& getInstanceSimple() {
        static Singleton instance;  // Thread-safe
        return instance;
    }
};

std::atomic<Singleton*> Singleton::instance{nullptr};
std::mutex Singleton::mutex;
```

### Scenario 2: Lock-Free Reference Counting

```cpp
#include <atomic>
#include <iostream>

template<typename T>
class RefCountedPtr {
private:
    struct ControlBlock {
        T* ptr;
        std::atomic<int> refCount;

        ControlBlock(T* p) : ptr(p), refCount(1) {}
        ~ControlBlock() { delete ptr; }
    };

    ControlBlock* control;

public:
    RefCountedPtr(T* ptr = nullptr)
        : control(ptr ? new ControlBlock(ptr) : nullptr) {}

    RefCountedPtr(const RefCountedPtr& other) : control(other.control) {
        if (control) {
            control->refCount.fetch_add(1, std::memory_order_relaxed);
        }
    }

    RefCountedPtr& operator=(const RefCountedPtr& other) {
        if (this != &other) {
            release();
            control = other.control;
            if (control) {
                control->refCount.fetch_add(1, std::memory_order_relaxed);
            }
        }
        return *this;
    }

    ~RefCountedPtr() {
        release();
    }

    T* get() const { return control ? control->ptr : nullptr; }
    T& operator*() const { return *get(); }
    T* operator->() const { return get(); }

    int useCount() const {
        return control ? control->refCount.load(std::memory_order_relaxed) : 0;
    }

private:
    void release() {
        if (control) {
            // fetch_sub returns old value, if old value is 1, this is the last reference
            if (control->refCount.fetch_sub(1, std::memory_order_acq_rel) == 1) {
                delete control;
            }
            control = nullptr;
        }
    }
};
```

### Scenario 3: Event Flags and State Machine

```cpp
#include <atomic>
#include <thread>
#include <iostream>

enum class State { IDLE, RUNNING, PAUSED, STOPPED };

class StateMachine {
private:
    std::atomic<State> state{State::IDLE};

public:
    bool start() {
        State expected = State::IDLE;
        return state.compare_exchange_strong(expected, State::RUNNING);
    }

    bool pause() {
        State expected = State::RUNNING;
        return state.compare_exchange_strong(expected, State::PAUSED);
    }

    bool resume() {
        State expected = State::PAUSED;
        return state.compare_exchange_strong(expected, State::RUNNING);
    }

    bool stop() {
        State current = state.load();
        while (current != State::STOPPED) {
            if (state.compare_exchange_weak(current, State::STOPPED)) {
                return true;
            }
        }
        return false;  // Already in STOPPED state
    }

    State getState() const {
        return state.load();
    }

    void waitForState(State target) {
        while (state.load(std::memory_order_acquire) != target) {
            std::this_thread::yield();
        }
    }
};
```

### Scenario 4: Readers-Writers Problem (Atomic Version)

```cpp
#include <atomic>
#include <thread>
#include <vector>

class ReadWriteCounter {
private:
    // Use single atomic variable to store both reader count and writer flag
    // Low 30 bits: reader count
    // Bit 31: writer waiting flag
    // Bit 32: writer active flag
    std::atomic<uint32_t> state{0};

    static constexpr uint32_t READER_MASK = 0x3FFFFFFF;
    static constexpr uint32_t WRITER_WAITING = 0x40000000;
    static constexpr uint32_t WRITER_ACTIVE = 0x80000000;

public:
    void readLock() {
        uint32_t current = state.load(std::memory_order_relaxed);
        while (true) {
            // If writer is active or waiting, wait
            if (current & (WRITER_ACTIVE | WRITER_WAITING)) {
                std::this_thread::yield();
                current = state.load(std::memory_order_relaxed);
                continue;
            }
            // Try to increment reader count
            if (state.compare_exchange_weak(current, current + 1,
                std::memory_order_acquire, std::memory_order_relaxed)) {
                break;
            }
        }
    }

    void readUnlock() {
        state.fetch_sub(1, std::memory_order_release);
    }

    void writeLock() {
        // First set writer waiting flag
        uint32_t current = state.fetch_or(WRITER_WAITING,
                                          std::memory_order_relaxed);

        // Wait for all readers to leave and acquire write lock
        while (true) {
            current = state.load(std::memory_order_relaxed);
            // If no readers and no other writer active
            if ((current & READER_MASK) == 0 &&
                !(current & WRITER_ACTIVE)) {
                uint32_t desired = (current & ~WRITER_WAITING) | WRITER_ACTIVE;
                if (state.compare_exchange_weak(current, desired,
                    std::memory_order_acquire, std::memory_order_relaxed)) {
                    break;
                }
            }
            std::this_thread::yield();
        }
    }

    void writeUnlock() {
        state.fetch_and(~WRITER_ACTIVE, std::memory_order_release);
    }
};
```

## Interview Key Points

### Common Interview Questions

**Q1: What are atomic operations? Why do we need them?**

Answer: Atomic operations are indivisible operations that cannot be interrupted by other threads during execution. We need atomic operations because ordinary read-modify-write operations (like `i++`) cause data races in multithreaded environments, leading to undefined results. Atomic operations ensure operation integrity and avoid data races.

**Q2: What's the difference between compare_exchange_weak and compare_exchange_strong?**

Answer:
- The `weak` version may have spurious failures, returning false even when expected value matches, suitable for use in loops
- The `strong` version doesn't have spurious failures, but may be slower than weak
- Recommend using weak in CAS loop patterns, strong for single checks

**Q3: Explain C++'s six memory orders**

Answer:
- `relaxed`: Only guarantees atomicity, no synchronization guarantees
- `consume`: Acquire semantics for dependent data (rarely used in practice)
- `acquire`: Acquire operation, subsequent reads/writes cannot reorder before it
- `release`: Release operation, preceding reads/writes cannot reorder after it
- `acq_rel`: Has both acquire and release semantics
- `seq_cst`: Sequential consistency, strongest guarantee, all threads see same order

**Q4: What is the ABA problem? How to solve it?**

Answer: The ABA problem occurs when using CAS operations:
1. Thread A reads value as A
2. Thread B changes value to B then back to A
3. Thread A's CAS succeeds, but data has actually changed

Solutions:
- Use versioned pointers (tagged pointer)
- Use double-width CAS
- Use hazard pointers or RCU

**Q5: What's the difference between std::atomic_flag and std::atomic<bool>?**

Answer:
- `atomic_flag` is the only atomic type guaranteed to be lock-free, only supports test_and_set and clear operations
- `atomic<bool>` supports full atomic operations (load, store, exchange, CAS, etc.), but doesn't guarantee lock-free
- `atomic_flag` is suitable for implementing low-level synchronization primitives like spinlocks

**Q6: When to use atomic operations vs mutex locks?**

Answer:
- Atomic operations: Simple single-variable operations, counters, flags, lock-free data structures
- Mutex locks: Complex multi-step operations, consistent updates of multiple variables, long critical sections

**Q7: What is false sharing? How to avoid it?**

Answer: False sharing occurs when data accessed by different threads is in the same cache line, causing frequent cache line invalidation and affecting performance. Prevention methods:
- Use `alignas(64)` or `alignas(std::hardware_destructive_interference_size)` for alignment
- Add padding between frequently accessed variables

### Code Exercise Examples

```cpp
// Implement thread-safe lazy initialization
template<typename T>
class LazyInit {
    std::atomic<T*> ptr{nullptr};
    std::mutex mtx;

public:
    T& get() {
        T* p = ptr.load(std::memory_order_acquire);
        if (!p) {
            std::lock_guard<std::mutex> lock(mtx);
            p = ptr.load(std::memory_order_relaxed);
            if (!p) {
                p = new T();
                ptr.store(p, std::memory_order_release);
            }
        }
        return *p;
    }
};

// Implement a simple spinlock
class SpinLock {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
public:
    void lock() {
        while (flag.test_and_set(std::memory_order_acquire));
    }
    void unlock() {
        flag.clear(std::memory_order_release);
    }
};
```

## Further Reading

### Official Documentation

- [C++ Reference - Atomic Operations](https://en.cppreference.com/w/cpp/atomic)
- [C++ Standard - Atomic Operations Library](https://eel.is/c++draft/atomics)

### Recommended Books

- **C++ Concurrency in Action** (Anthony Williams) - In-depth coverage of C++ concurrency and atomic operations
- **The Art of Multiprocessor Programming** (Herlihy & Shavit) - Classic on multiprocessor programming
- **Is Parallel Programming Hard, And, If So, What Can You Do About It?** (Paul McKenney) - Deep understanding of memory models

### Quality Articles

- [Memory Ordering at Compile Time](https://preshing.com/20120625/memory-ordering-at-compile-time/)
- [Memory Barriers Are Like Source Control Operations](https://preshing.com/20120710/memory-barriers-are-like-source-control-operations/)
- [Acquire and Release Semantics](https://preshing.com/20120913/acquire-and-release-semantics/)
- [The Synchronizes-With Relation](https://preshing.com/20130823/the-synchronizes-with-relation/)

### Related Topics

- [C++ Concurrent Programming](/cpp/concurrency) - Threads, mutexes, condition variables
- [C++ Smart Pointers](/cpp/smart-pointers) - RAII and memory management
- [C++ Move Semantics](/cpp/move-semantics) - Perfect forwarding and rvalue references

---

Atomic operations are the cornerstone of modern C++ concurrent programming. Mastering atomic operations and memory ordering enables you to write efficient and correct concurrent code. In practice, choose the appropriate synchronization mechanism based on specific scenarios, finding the balance between correctness and performance.
