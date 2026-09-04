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
origin: old/src/content/docs/cpp/atomic.zh.md
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

## 概念解释

### 什么是原子操作

原子操作（Atomic Operation）是指在执行过程中不会被其他线程中断的操作。这种操作要么完全执行，要么完全不执行，不存在中间状态。在多线程编程中，原子操作是保证数据一致性的基础机制。

"原子"一词来源于希腊语 atomos，意为"不可分割的"。在计算机科学中，原子操作确保了即使在多个线程同时访问同一数据时，每个操作也是不可分割的整体。

### 为什么需要原子操作

考虑一个简单的计数器递增操作 `counter++`，在汇编层面实际上包含三个步骤：

1. 从内存读取 counter 的值到寄存器
2. 将寄存器中的值加 1
3. 将结果写回内存

在多线程环境下，如果两个线程同时执行这个操作，可能出现以下情况：

```
线程 A: 读取 counter (值为 5)
线程 B: 读取 counter (值为 5)
线程 A: 加 1 (寄存器中为 6)
线程 B: 加 1 (寄存器中为 6)
线程 A: 写回 (counter = 6)
线程 B: 写回 (counter = 6)
```

最终 counter 的值是 6 而不是期望的 7，这就是典型的数据竞争（Data Race）问题。

### 原子操作 vs 互斥锁

| 特性 | 原子操作 | 互斥锁 |
|------|----------|--------|
| 性能 | 通常更快（硬件支持） | 相对较慢（需要系统调用） |
| 粒度 | 单个变量操作 | 可保护任意代码块 |
| 阻塞 | 无阻塞（无锁） | 可能阻塞等待 |
| 复杂度 | 简单操作易用 | 复杂逻辑更直观 |
| 适用场景 | 计数器、标志位、简单状态 | 复杂数据结构、多步操作 |

### 历史背景

C++11 之前，实现原子操作需要依赖平台特定的 API（如 Windows 的 Interlocked 函数或 GCC 的 `__sync` 内建函数）。C++11 标准引入了 `<atomic>` 头文件，提供了跨平台的原子操作支持，使得编写可移植的并发代码成为可能。

## 核心原理

### 硬件层面的原子性

现代 CPU 通过以下机制支持原子操作：

1. **总线锁定（Bus Lock）**：早期实现方式，锁定整个系统总线
2. **缓存锁定（Cache Lock）**：现代实现方式，仅锁定相关缓存行
3. **原子指令**：如 x86 的 `LOCK` 前缀指令、`CMPXCHG` 指令

```
CPU 核心 1          CPU 核心 2          内存
    │                   │                │
    ▼                   ▼                │
┌─────────┐        ┌─────────┐          │
│ L1 Cache │        │ L1 Cache │          │
└────┬────┘        └────┬────┘          │
     │                  │               │
     ▼                  ▼               │
┌─────────────────────────────┐         │
│         L2/L3 Cache          │◄────────┤
└──────────────┬──────────────┘         │
               │                        │
               ▼                        ▼
         MESI 协议确保缓存一致性
```

### 缓存一致性协议（MESI）

MESI 协议定义了缓存行的四种状态：

- **Modified（已修改）**：数据被当前核心修改，与内存不一致
- **Exclusive（独占）**：数据仅在当前核心缓存中，与内存一致
- **Shared（共享）**：数据可能在多个核心缓存中，与内存一致
- **Invalid（无效）**：缓存行无效

原子操作通过 MESI 协议确保多核之间的数据一致性。

### 内存序（Memory Order）

内存序定义了原子操作在多线程环境中的可见性和顺序保证。C++ 提供六种内存序：

```cpp
enum memory_order {
    memory_order_relaxed,    // 最弱保证，仅保证原子性
    memory_order_consume,    // 依赖数据的获取操作
    memory_order_acquire,    // 获取操作，之后的读写不能重排到前面
    memory_order_release,    // 释放操作，之前的读写不能重排到后面
    memory_order_acq_rel,    // 同时具有 acquire 和 release 语义
    memory_order_seq_cst     // 顺序一致性（最强保证，默认值）
};
```

内存序强度排序：`relaxed` < `consume` < `acquire/release` < `acq_rel` < `seq_cst`

### 内存屏障

内存屏障（Memory Barrier/Fence）是确保内存操作顺序的低级机制：

```
        编译器重排屏障            CPU 重排屏障
              │                      │
    ┌─────────┴─────────┐   ┌───────┴───────┐
    │                   │   │               │
    ▼                   ▼   ▼               ▼
┌──────┐            ┌──────────┐        ┌──────┐
│ Store │  ────────▶ │   屏障   │ ────▶  │ Load  │
│ Store │            │          │        │ Load  │
│ Store │  ◀──────── │   屏障   │ ◀────  │ Load  │
└──────┘            └──────────┘        └──────┘
```

## 核心要点

### std::atomic 基本类型

C++ 为常用类型提供了原子类型别名：

```cpp
// 整数类型
std::atomic_bool      // std::atomic<bool>
std::atomic_char      // std::atomic<char>
std::atomic_int       // std::atomic<int>
std::atomic_long      // std::atomic<long>
std::atomic_llong     // std::atomic<long long>

// 无符号整数类型
std::atomic_uint      // std::atomic<unsigned int>
std::atomic_ulong     // std::atomic<unsigned long>

// 固定宽度整数类型
std::atomic_int8_t    // std::atomic<int8_t>
std::atomic_int16_t   // std::atomic<int16_t>
std::atomic_int32_t   // std::atomic<int32_t>
std::atomic_int64_t   // std::atomic<int64_t>

// 指针类型
std::atomic<T*>       // 指针的原子类型

// 用户自定义类型（需满足特定条件）
std::atomic<MyStruct> // 要求 is_trivially_copyable
```

### std::atomic 主要操作

| 操作 | 说明 |
|------|------|
| `store(val, order)` | 原子写入 |
| `load(order)` | 原子读取 |
| `exchange(val, order)` | 原子交换，返回旧值 |
| `compare_exchange_weak` | 弱 CAS 操作 |
| `compare_exchange_strong` | 强 CAS 操作 |
| `fetch_add/sub/and/or/xor` | 原子算术/位操作 |
| `operator++/--` | 原子递增/递减 |
| `is_lock_free()` | 检查是否无锁实现 |

### 各内存序详解

**memory_order_relaxed**
- 仅保证操作的原子性
- 不提供任何同步或顺序保证
- 适用于统计计数器等不需要同步的场景

**memory_order_acquire**
- 用于 load 操作
- 当前线程中，此操作之后的所有读写不能重排到此操作之前
- 与 release 配对使用形成同步关系

**memory_order_release**
- 用于 store 操作
- 当前线程中，此操作之前的所有读写不能重排到此操作之后
- 与 acquire 配对使用形成同步关系

**memory_order_acq_rel**
- 用于读-改-写操作（如 CAS）
- 同时具有 acquire 和 release 语义

**memory_order_seq_cst**
- 顺序一致性，最强保证
- 所有线程看到相同的操作顺序
- 默认内存序，性能开销最大

## 代码示例

### 基础原子操作

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <vector>

// 使用原子类型的计数器
std::atomic<int> counter{0};

void incrementCounter(int times) {
    for (int i = 0; i < times; ++i) {
        // 原子递增，等价于 counter.fetch_add(1)
        counter++;
    }
}

int main() {
    const int numThreads = 10;
    const int incrementsPerThread = 10000;

    std::vector<std::thread> threads;

    // 创建多个线程同时递增计数器
    for (int i = 0; i < numThreads; ++i) {
        threads.emplace_back(incrementCounter, incrementsPerThread);
    }

    // 等待所有线程完成
    for (auto& t : threads) {
        t.join();
    }

    // 结果始终正确：100000
    std::cout << "最终计数: " << counter << std::endl;
    std::cout << "期望值: " << numThreads * incrementsPerThread << std::endl;

    return 0;
}
```

### 原子操作的各种方法

```cpp
#include <iostream>
#include <atomic>

int main() {
    std::atomic<int> value{10};

    // store - 原子写入
    value.store(20);
    std::cout << "store 后: " << value << std::endl;

    // load - 原子读取
    int loaded = value.load();
    std::cout << "load 值: " << loaded << std::endl;

    // exchange - 原子交换，返回旧值
    int old = value.exchange(30);
    std::cout << "exchange 旧值: " << old << ", 新值: " << value << std::endl;

    // fetch_add - 原子加法，返回旧值
    old = value.fetch_add(5);
    std::cout << "fetch_add 旧值: " << old << ", 新值: " << value << std::endl;

    // fetch_sub - 原子减法，返回旧值
    old = value.fetch_sub(10);
    std::cout << "fetch_sub 旧值: " << old << ", 新值: " << value << std::endl;

    // fetch_and - 原子按位与
    value.store(0xFF);
    old = value.fetch_and(0x0F);
    std::cout << "fetch_and 旧值: " << old << ", 新值: " << value << std::endl;

    // fetch_or - 原子按位或
    old = value.fetch_or(0xF0);
    std::cout << "fetch_or 旧值: " << old << ", 新值: " << value << std::endl;

    // fetch_xor - 原子按位异或
    old = value.fetch_xor(0xFF);
    std::cout << "fetch_xor 旧值: " << old << ", 新值: " << value << std::endl;

    return 0;
}
```

### compare_exchange 详解

```cpp
#include <iostream>
#include <atomic>
#include <thread>

std::atomic<int> value{0};

// compare_exchange_weak 示例
// 可能发生虚假失败（spurious failure），需要在循环中使用
void casWeak() {
    int expected = 0;
    int desired = 1;

    // 如果 value == expected，则设置 value = desired，返回 true
    // 如果 value != expected，则设置 expected = value，返回 false
    // weak 版本可能虚假失败，即使 value == expected 也可能返回 false
    while (!value.compare_exchange_weak(expected, desired)) {
        // 失败时 expected 被更新为当前值
        std::cout << "CAS weak 失败，expected 更新为: " << expected << std::endl;
        expected = 0;  // 重置 expected
    }
    std::cout << "CAS weak 成功，value = " << value << std::endl;
}

// compare_exchange_strong 示例
// 不会虚假失败，但可能比 weak 版本慢
void casStrong() {
    int expected = 1;
    int desired = 2;

    if (value.compare_exchange_strong(expected, desired)) {
        std::cout << "CAS strong 成功，value = " << value << std::endl;
    } else {
        std::cout << "CAS strong 失败，当前值: " << expected << std::endl;
    }
}

// 使用 CAS 实现原子最大值更新
void atomicMax(std::atomic<int>& target, int newValue) {
    int current = target.load();
    while (newValue > current &&
           !target.compare_exchange_weak(current, newValue)) {
        // current 在失败时被自动更新
    }
}

int main() {
    casWeak();
    casStrong();

    // 测试原子最大值
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

    std::cout << "最大值: " << maxValue << std::endl;  // 应该是 90

    return 0;
}
```

### 内存序示例

```cpp
#include <iostream>
#include <atomic>
#include <thread>
#include <cassert>

// 示例 1: Relaxed 顺序
// 仅保证原子性，不保证顺序
namespace relaxed_example {
    std::atomic<int> x{0}, y{0};

    void writer() {
        x.store(1, std::memory_order_relaxed);
        y.store(1, std::memory_order_relaxed);
    }

    void reader() {
        // 由于是 relaxed，可能看到 y=1 但 x=0
        while (y.load(std::memory_order_relaxed) != 1);
        // 不能保证此时 x 为 1
        std::cout << "x = " << x.load(std::memory_order_relaxed) << std::endl;
    }
}

// 示例 2: Release-Acquire 顺序
// 建立同步关系
namespace release_acquire_example {
    std::atomic<int> data{0};
    std::atomic<bool> ready{false};

    void producer() {
        data.store(42, std::memory_order_relaxed);  // (1)
        ready.store(true, std::memory_order_release);  // (2) Release
    }

    void consumer() {
        while (!ready.load(std::memory_order_acquire));  // (3) Acquire
        // Release-Acquire 保证：(1) happens-before (3) 之后的代码
        int value = data.load(std::memory_order_relaxed);  // (4)
        assert(value == 42);  // 保证成功
        std::cout << "消费者读取: " << value << std::endl;
    }
}

// 示例 3: 顺序一致性
// 所有线程看到相同的操作顺序
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

        // seq_cst 保证 z 至少为 1
        assert(z.load() != 0);
        std::cout << "z = " << z << std::endl;
    }
}

int main() {
    std::cout << "=== Release-Acquire 示例 ===" << std::endl;
    std::thread t1(release_acquire_example::producer);
    std::thread t2(release_acquire_example::consumer);
    t1.join();
    t2.join();

    std::cout << "\n=== Seq_cst 示例 ===" << std::endl;
    seq_cst_example::test();

    return 0;
}
```

### std::atomic_flag 自旋锁

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
        // test_and_set 返回旧值，如果旧值为 false 表示获得锁
        while (flag.test_and_set(std::memory_order_acquire)) {
            // 自旋等待
            // 可选：添加 yield 或 pause 指令减少 CPU 消耗
            #if defined(__x86_64__) || defined(_M_X64)
            __builtin_ia32_pause();  // x86 PAUSE 指令
            #endif
        }
    }

    void unlock() {
        flag.clear(std::memory_order_release);
    }

    // RAII 锁守卫
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

// 改进的自旋锁：带退避策略
class AdaptiveSpinLock {
private:
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
    static constexpr int MAX_SPINS = 1000;

public:
    void lock() {
        int spins = 0;
        while (flag.test_and_set(std::memory_order_acquire)) {
            if (++spins > MAX_SPINS) {
                // 超过最大自旋次数，让出 CPU
                std::this_thread::yield();
                spins = 0;
            }
        }
    }

    void unlock() {
        flag.clear(std::memory_order_release);
    }
};

// 测试自旋锁
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

    std::cout << "计数器值: " << counter << std::endl;  // 应该是 100000

    return 0;
}
```

### 无锁数据结构：栈

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

        // CAS 循环：尝试将新节点设为头节点
        while (!head.compare_exchange_weak(
            newNode->next,      // expected，失败时更新
            newNode,            // desired
            std::memory_order_release,
            std::memory_order_relaxed
        )) {
            // 失败时 newNode->next 已被更新为当前 head
        }
    }

    std::optional<T> pop() {
        Node* oldHead = head.load(std::memory_order_relaxed);

        while (oldHead != nullptr) {
            // CAS 循环：尝试将头节点的下一个设为新头
            if (head.compare_exchange_weak(
                oldHead,
                oldHead->next,
                std::memory_order_acquire,
                std::memory_order_relaxed
            )) {
                T value = std::move(oldHead->data);
                delete oldHead;  // 注意：简化版本，存在 ABA 问题
                return value;
            }
            // 失败时 oldHead 已被更新为当前 head
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

    // 并发推入
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

    // 并发弹出
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

    std::cout << "弹出元素数: " << popCount << std::endl;  // 应该是 500

    return 0;
}
```

### 无锁队列（单生产者单消费者）

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
    alignas(64) std::atomic<size_t> head{0};  // 消费者位置
    alignas(64) std::atomic<size_t> tail{0};  // 生产者位置

public:
    bool push(const T& value) {
        size_t currentTail = tail.load(std::memory_order_relaxed);
        size_t nextTail = (currentTail + 1) % Capacity;

        // 检查队列是否已满
        if (nextTail == head.load(std::memory_order_acquire)) {
            return false;  // 队列已满
        }

        buffer[currentTail] = value;
        tail.store(nextTail, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        size_t currentHead = head.load(std::memory_order_relaxed);

        // 检查队列是否为空
        if (currentHead == tail.load(std::memory_order_acquire)) {
            return std::nullopt;  // 队列为空
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

    // 生产者线程
    std::thread producer([&queue, &done]() {
        for (int i = 0; i < 10000; ++i) {
            while (!queue.push(i)) {
                std::this_thread::yield();  // 队列满，等待
            }
        }
        done.store(true, std::memory_order_release);
    });

    // 消费者线程
    std::thread consumer([&queue, &done, &sum]() {
        while (!done.load(std::memory_order_acquire) || !queue.empty()) {
            if (auto val = queue.pop()) {
                sum.fetch_add(*val, std::memory_order_relaxed);
            }
        }
    });

    producer.join();
    consumer.join();

    // 验证：0 + 1 + 2 + ... + 9999 = 49995000
    std::cout << "总和: " << sum << std::endl;
    std::cout << "期望: " << (9999 * 10000 / 2) << std::endl;

    return 0;
}
```

## 最佳实践

### 选择合适的内存序

```cpp
#include <atomic>

// 规则 1: 简单计数器使用 relaxed
std::atomic<int> counter{0};
void increment() {
    counter.fetch_add(1, std::memory_order_relaxed);
}

// 规则 2: 发布数据使用 release/acquire
std::atomic<bool> ready{false};
int data;

void publish() {
    data = 42;
    ready.store(true, std::memory_order_release);
}

void consume() {
    while (!ready.load(std::memory_order_acquire));
    assert(data == 42);  // 保证成功
}

// 规则 3: 不确定时使用 seq_cst（默认值）
std::atomic<int> value{0};
void safeOperation() {
    value.store(1);  // 默认 seq_cst
    int v = value.load();  // 默认 seq_cst
}
```

### 避免 ABA 问题

```cpp
#include <atomic>
#include <cstdint>

// ABA 问题示例：
// 1. 线程 A 读取指针 P 指向节点 A
// 2. 线程 B 删除节点 A，分配新节点，恰好在同一地址
// 3. 线程 A 的 CAS 成功，但实际上数据已变化

// 解决方案 1: 使用带版本号的指针
template<typename T>
struct VersionedPointer {
    T* ptr;
    uintptr_t version;
};

// 解决方案 2: 使用双宽度 CAS（如果平台支持）
// 在 64 位系统上使用 128 位原子操作
struct TaggedPointer {
    void* ptr;
    uintptr_t tag;
};

// 检查是否支持无锁双宽度操作
static_assert(std::atomic<TaggedPointer>::is_always_lock_free,
              "需要无锁双宽度 CAS 支持");
```

### 正确使用 compare_exchange

```cpp
#include <atomic>

// 错误示例：没有处理失败情况
void badCAS(std::atomic<int>& value) {
    int expected = 0;
    value.compare_exchange_strong(expected, 1);
    // expected 可能已被修改，但没有使用
}

// 正确示例：循环 CAS 模式
void goodCAS(std::atomic<int>& value) {
    int expected = value.load();
    while (!value.compare_exchange_weak(expected, expected + 1)) {
        // expected 在失败时被自动更新
        // 继续尝试
    }
}

// 正确示例：条件 CAS
bool conditionalCAS(std::atomic<int>& value, int threshold) {
    int expected = value.load();
    while (expected < threshold) {
        if (value.compare_exchange_weak(expected, expected + 1)) {
            return true;  // 成功增加
        }
        // expected 被更新，检查是否仍满足条件
    }
    return false;  // 已达到阈值
}
```

### 避免伪共享

```cpp
#include <atomic>
#include <thread>
#include <vector>

// 伪共享问题：两个原子变量在同一缓存行
struct BadLayout {
    std::atomic<int> counter1;  // 64 字节缓存行
    std::atomic<int> counter2;  // 与 counter1 在同一缓存行
};

// 解决方案：缓存行对齐
struct GoodLayout {
    alignas(64) std::atomic<int> counter1;
    alignas(64) std::atomic<int> counter2;
};

// C++17: 使用 hardware_destructive_interference_size
#ifdef __cpp_lib_hardware_interference_size
struct OptimalLayout {
    alignas(std::hardware_destructive_interference_size)
        std::atomic<int> counter1;
    alignas(std::hardware_destructive_interference_size)
        std::atomic<int> counter2;
};
#endif
```

### 原子智能指针（C++20）

```cpp
#include <atomic>
#include <memory>

// C++20 引入了原子智能指针特化
#if __cplusplus >= 202002L
void atomicSharedPtrExample() {
    std::atomic<std::shared_ptr<int>> atomicPtr;

    // 原子存储
    atomicPtr.store(std::make_shared<int>(42));

    // 原子加载
    auto ptr = atomicPtr.load();

    // 原子交换
    auto oldPtr = atomicPtr.exchange(std::make_shared<int>(100));

    // CAS
    std::shared_ptr<int> expected = ptr;
    std::shared_ptr<int> desired = std::make_shared<int>(200);
    atomicPtr.compare_exchange_strong(expected, desired);
}
#endif
```

## 常见陷阱

### 陷阱 1: 错误的内存序选择

```cpp
#include <atomic>
#include <thread>

std::atomic<int> data{0};
std::atomic<bool> ready{false};

// 错误：使用 relaxed 发布数据
void badProducer() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_relaxed);  // 危险！
}

// 错误：消费者可能看不到 data 的新值
void badConsumer() {
    while (!ready.load(std::memory_order_relaxed));
    int value = data.load(std::memory_order_relaxed);
    // value 可能不是 42！
}

// 正确：使用 release/acquire
void goodProducer() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_release);
}

void goodConsumer() {
    while (!ready.load(std::memory_order_acquire));
    int value = data.load(std::memory_order_relaxed);
    // value 保证是 42
}
```

### 陷阱 2: compare_exchange_weak 的虚假失败

```cpp
#include <atomic>

// 错误：不在循环中使用 weak 版本
void badWeakCAS(std::atomic<int>& value) {
    int expected = 0;
    // weak 版本可能虚假失败
    if (value.compare_exchange_weak(expected, 1)) {
        // 可能不会执行，即使 value 确实是 0
    }
}

// 正确：在循环中使用 weak，或使用 strong
void goodCAS(std::atomic<int>& value) {
    int expected = 0;
    // 方式 1: 循环使用 weak（推荐用于循环场景）
    while (!value.compare_exchange_weak(expected, 1) && expected == 0) {
        // 重试
    }

    // 方式 2: 单次检查使用 strong
    expected = 0;
    value.compare_exchange_strong(expected, 1);
}
```

### 陷阱 3: 非原子操作混合使用

```cpp
#include <atomic>

class Counter {
    std::atomic<int> count{0};
    int nonAtomicCount = 0;  // 危险！

public:
    // 错误：混合原子和非原子操作
    void badIncrement() {
        count++;           // 原子
        nonAtomicCount++;  // 非原子，数据竞争！
    }

    // 错误：在原子操作之间有非原子读取
    void badCheck() {
        if (count > 0) {        // 原子读取
            // 此时 count 可能已改变
            int temp = count;   // 另一次原子读取
            // temp 可能与上面的检查不一致
        }
    }
};
```

### 陷阱 4: 原子类型的拷贝

```cpp
#include <atomic>

void atomicCopyPitfall() {
    std::atomic<int> a{10};

    // 错误：不能直接拷贝原子类型
    // std::atomic<int> b = a;  // 编译错误！

    // 正确：显式加载再存储
    std::atomic<int> b{a.load()};

    // 或者使用 store
    std::atomic<int> c{0};
    c.store(a.load());
}
```

### 陷阱 5: is_lock_free 的误解

```cpp
#include <atomic>
#include <iostream>

struct Large {
    int data[100];
};

void lockFreeCheck() {
    std::atomic<int> smallAtomic;
    std::atomic<Large> largeAtomic;

    // 小类型通常是无锁的
    std::cout << "int 是否无锁: "
              << smallAtomic.is_lock_free() << std::endl;  // 通常为 true

    // 大类型可能不是无锁的
    std::cout << "Large 是否无锁: "
              << largeAtomic.is_lock_free() << std::endl;  // 可能为 false

    // 编译时检查（C++17）
    static_assert(std::atomic<int>::is_always_lock_free,
                  "int 应该始终是无锁的");
}
```

## 性能考量

### 不同内存序的性能对比

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

### 原子操作 vs 互斥锁性能

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
    // 原子计数器
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

    // 互斥锁计数器
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

    std::cout << "原子操作: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(atomicTime).count()
              << " ms" << std::endl;
    std::cout << "互斥锁: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(mutexTime).count()
              << " ms" << std::endl;
}
```

### 性能优化建议

1. **选择最弱的内存序**：在满足正确性的前提下，使用最弱的内存序
2. **避免伪共享**：确保频繁访问的原子变量在不同缓存行
3. **批量操作**：如果可能，累积多次操作后一次性更新
4. **读多写少场景**：考虑使用 RCU（Read-Copy-Update）模式
5. **避免过度同步**：分析真正需要同步的地方

## 实战场景

### 场景 1: 线程安全的单例模式

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

    // 使用 C++11 静态局部变量（推荐方式）
    static Singleton& getInstanceSimple() {
        static Singleton instance;  // 线程安全
        return instance;
    }
};

std::atomic<Singleton*> Singleton::instance{nullptr};
std::mutex Singleton::mutex;
```

### 场景 2: 无锁引用计数

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
            // fetch_sub 返回旧值，如果旧值为 1，说明这是最后一个引用
            if (control->refCount.fetch_sub(1, std::memory_order_acq_rel) == 1) {
                delete control;
            }
            control = nullptr;
        }
    }
};
```

### 场景 3: 事件标志和状态机

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
        return false;  // 已经是 STOPPED 状态
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

### 场景 4: 读写器问题（原子版本）

```cpp
#include <atomic>
#include <thread>
#include <vector>

class ReadWriteCounter {
private:
    // 使用单个原子变量同时存储读者计数和写者标志
    // 低 30 位：读者数量
    // 第 31 位：写者等待标志
    // 第 32 位：写者活动标志
    std::atomic<uint32_t> state{0};

    static constexpr uint32_t READER_MASK = 0x3FFFFFFF;
    static constexpr uint32_t WRITER_WAITING = 0x40000000;
    static constexpr uint32_t WRITER_ACTIVE = 0x80000000;

public:
    void readLock() {
        uint32_t current = state.load(std::memory_order_relaxed);
        while (true) {
            // 如果有写者活动或等待，等待
            if (current & (WRITER_ACTIVE | WRITER_WAITING)) {
                std::this_thread::yield();
                current = state.load(std::memory_order_relaxed);
                continue;
            }
            // 尝试增加读者计数
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
        // 首先设置写者等待标志
        uint32_t current = state.fetch_or(WRITER_WAITING,
                                          std::memory_order_relaxed);

        // 等待所有读者离开并获取写锁
        while (true) {
            current = state.load(std::memory_order_relaxed);
            // 如果没有读者且没有其他写者活动
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

## 面试要点

### 常见面试问题

**Q1: 什么是原子操作？为什么需要原子操作？**

答：原子操作是不可分割的操作，在执行过程中不会被其他线程中断。需要原子操作是因为普通的读-改-写操作（如 `i++`）在多线程环境下会产生数据竞争，导致结果不确定。原子操作确保操作的完整性，避免数据竞争。

**Q2: compare_exchange_weak 和 compare_exchange_strong 的区别？**

答：
- `weak` 版本可能发生虚假失败（spurious failure），即使期望值匹配也可能返回 false，适合在循环中使用
- `strong` 版本不会虚假失败，但可能比 weak 版本慢
- 在循环 CAS 模式中推荐使用 weak，单次检查使用 strong

**Q3: 解释 C++ 的六种内存序**

答：
- `relaxed`：仅保证原子性，无同步保证
- `consume`：依赖数据的获取语义（实践中很少使用）
- `acquire`：获取操作，后续读写不能重排到此操作之前
- `release`：释放操作，之前读写不能重排到此操作之后
- `acq_rel`：同时具有 acquire 和 release 语义
- `seq_cst`：顺序一致性，最强保证，所有线程看到相同顺序

**Q4: 什么是 ABA 问题？如何解决？**

答：ABA 问题发生在使用 CAS 操作时：
1. 线程 A 读取值为 A
2. 线程 B 修改值为 B 再改回 A
3. 线程 A 的 CAS 成功，但实际数据已经发生变化

解决方案：
- 使用带版本号的指针（tagged pointer）
- 使用双宽度 CAS
- 使用危险指针（hazard pointer）或 RCU

**Q5: std::atomic_flag 和 std::atomic<bool> 的区别？**

答：
- `atomic_flag` 是保证无锁的唯一原子类型，只支持 test_and_set 和 clear 操作
- `atomic<bool>` 支持完整的原子操作（load、store、exchange、CAS 等），但不保证无锁
- `atomic_flag` 适合实现自旋锁等底层同步原语

**Q6: 何时使用原子操作，何时使用互斥锁？**

答：
- 原子操作：简单的单变量操作、计数器、标志位、无锁数据结构
- 互斥锁：复杂的多步操作、多个变量的一致性更新、长时间的临界区

**Q7: 什么是伪共享？如何避免？**

答：伪共享是指不同线程访问的数据位于同一缓存行，导致缓存行频繁失效，影响性能。避免方法：
- 使用 `alignas(64)` 或 `alignas(std::hardware_destructive_interference_size)` 对齐
- 在频繁访问的变量之间添加填充

### 代码题示例

```cpp
// 实现一个线程安全的懒初始化
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

// 实现一个简单的自旋锁
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

## 延伸阅读

### 官方文档

- [C++ Reference - Atomic Operations](https://en.cppreference.com/w/cpp/atomic)
- [C++ Standard - Atomic Operations Library](https://eel.is/c++draft/atomics)

### 推荐书籍

- **C++ Concurrency in Action** (Anthony Williams) - 深入讲解 C++ 并发和原子操作
- **The Art of Multiprocessor Programming** (Herlihy & Shavit) - 多处理器编程经典
- **Is Parallel Programming Hard, And, If So, What Can You Do About It?** (Paul McKenney) - 深入理解内存模型

### 优质文章

- [Memory Ordering at Compile Time](https://preshing.com/20120625/memory-ordering-at-compile-time/)
- [Memory Barriers Are Like Source Control Operations](https://preshing.com/20120710/memory-barriers-are-like-source-control-operations/)
- [Acquire and Release Semantics](https://preshing.com/20120913/acquire-and-release-semantics/)
- [The Synchronizes-With Relation](https://preshing.com/20130823/the-synchronizes-with-relation/)

### 相关主题

- [C++ 并发编程](/cpp/concurrency) - 线程、互斥锁、条件变量
- [C++ 智能指针](/cpp/smart-pointers) - RAII 和内存管理
- [C++ 移动语义](/cpp/move-semantics) - 完美转发和右值引用

---

原子操作是现代 C++ 并发编程的基石。掌握原子操作和内存序，能够编写出高效且正确的并发代码。在实践中，应根据具体场景选择合适的同步机制，在正确性和性能之间找到平衡。
