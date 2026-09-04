---
title: C++ 内存序
description: 深入理解 C++ 内存序：memory_order_relaxed/acquire/release/seq_cst、happens-before 关系、synchronizes-with 语义与多线程同步
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - 内存序
  - 并发
  - 原子操作
  - 多线程
  - 内存模型
status: imported
origin: old/src/content/docs/cpp/memory-order.zh.md
divergence: 0.183
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 并发
  order: 9
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是内存序

内存序（Memory Order）是 C++ 原子操作中用于控制内存访问顺序和可见性的机制。它定义了原子操作与其他内存操作之间的排序关系，是理解和正确使用 C++ 并发编程的核心概念。

在单线程程序中，我们假设代码按照编写顺序执行。但在多线程环境下，由于编译器优化和 CPU 乱序执行，实际的执行顺序可能与代码顺序不同。内存序提供了一种方式来控制这种重排序行为，确保多线程程序的正确性。

### 为什么需要内存序

现代计算机系统存在多级优化：

1. **编译器优化**：编译器可能重排指令以提高性能
2. **CPU 乱序执行**：处理器可能不按程序顺序执行指令
3. **缓存层次**：多核 CPU 的缓存可能导致数据可见性延迟
4. **存储缓冲区**：写操作可能暂存在缓冲区中

考虑以下代码：

```cpp
// 线程 1
data = 42;          // (1)
ready = true;       // (2)

// 线程 2
if (ready) {        // (3)
    use(data);      // (4) data 一定是 42 吗？
}
```

没有适当的内存序保证，线程 2 可能看到 `ready = true` 但 `data` 仍然是旧值。这是因为：
- 编译器可能重排 (1) 和 (2)
- CPU 可能乱序执行
- 线程 2 的缓存可能还没看到 data 的更新

### 历史背景

C++11 之前，处理多线程内存可见性需要依赖平台特定的内存屏障指令或 volatile 关键字（在 C++ 中 volatile 并不保证多线程安全）。C++11 引入了标准的内存模型，定义了六种内存序，使得编写可移植的并发代码成为可能。

## 核心原理

### C++ 内存模型

C++ 内存模型基于以下核心概念：

```
┌─────────────────────────────────────────────────────────────┐
│                      C++ 内存模型                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   程序顺序 (Program Order)                                   │
│       │                                                     │
│       ▼                                                     │
│   Sequenced-Before (同线程内操作顺序)                        │
│       │                                                     │
│       ▼                                                     │
│   Synchronizes-With (线程间同步关系)                         │
│       │                                                     │
│       ▼                                                     │
│   Happens-Before (先行发生关系)                              │
│       │                                                     │
│       ▼                                                     │
│   可见性保证 (Visibility Guarantee)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Happens-Before 关系

Happens-Before 是内存模型中最重要的概念。如果操作 A happens-before 操作 B，则：

1. A 的效果对 B 可见
2. A 在 B 之前完成

Happens-Before 关系来源于：

```cpp
// 1. 同一线程中的程序顺序 (Sequenced-Before)
int a = 1;      // A
int b = a + 1;  // B，A happens-before B

// 2. 线程间的同步关系 (Synchronizes-With)
// 线程 1 的 release store 与线程 2 的 acquire load
std::atomic<bool> flag{false};
int data;

// 线程 1
data = 42;                                    // A
flag.store(true, memory_order_release);       // B

// 线程 2
while (!flag.load(memory_order_acquire));     // C
assert(data == 42);                           // D，A happens-before D

// 3. 传递性
// 如果 A happens-before B，B happens-before C
// 则 A happens-before C
```

### Synchronizes-With 关系

Synchronizes-With 是建立线程间 Happens-Before 关系的关键。它发生在：

```
┌─────────────────────────────────────────────────────────────┐
│              Synchronizes-With 关系建立                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   线程 A                          线程 B                     │
│     │                               │                       │
│     │ store(release)                │                       │
│     │────────────────────────────▶  │ load(acquire)         │
│     │                               │                       │
│                synchronizes-with                            │
│                                                             │
│   release 操作之前的所有写操作                               │
│   对 acquire 操作之后的所有读操作可见                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 六种内存序详解

C++ 定义了六种内存序，强度从弱到强：

```cpp
enum memory_order {
    memory_order_relaxed,    // 最弱：仅保证原子性
    memory_order_consume,    // 数据依赖的获取
    memory_order_acquire,    // 获取语义
    memory_order_release,    // 释放语义
    memory_order_acq_rel,    // 获取-释放语义
    memory_order_seq_cst     // 顺序一致性（最强）
};
```

强度排序：

```
relaxed  <  consume  <  acquire/release  <  acq_rel  <  seq_cst
   ↑                        ↑                            ↑
最弱保证              生产者-消费者模式              全局顺序一致
```

## 核心要点

### memory_order_relaxed

**特点**：
- 仅保证操作的原子性
- 不提供任何同步或顺序保证
- 性能最好

**适用场景**：
- 统计计数器
- 不需要同步的标志位
- 作为其他同步机制的一部分

```cpp
std::atomic<int> counter{0};

// 多线程安全递增，但不保证与其他操作的顺序
void increment() {
    counter.fetch_add(1, std::memory_order_relaxed);
}
```

### memory_order_acquire

**特点**：
- 用于 load 操作
- 当前线程中，此操作之后的读写不能重排到此操作之前
- 与 release 配对形成同步关系

**内存屏障效果**：

```
                    ┌──────────────────┐
                    │   acquire load   │
                    └────────┬─────────┘
                             │
                    ─────────┼───────── 屏障
                             │
                             ▼
            后续的读写操作不能移动到屏障之前
```

### memory_order_release

**特点**：
- 用于 store 操作
- 当前线程中，此操作之前的读写不能重排到此操作之后
- 与 acquire 配对形成同步关系

**内存屏障效果**：

```
            前面的读写操作不能移动到屏障之后
                             │
                    ─────────┼───────── 屏障
                             │
                    ┌────────┴─────────┐
                    │   release store  │
                    └──────────────────┘
```

### memory_order_acq_rel

**特点**：
- 用于读-改-写操作（如 CAS、fetch_add）
- 同时具有 acquire 和 release 语义
- 在双向都建立屏障

```
            前面的读写操作不能移动到屏障之后
                             │
                    ─────────┼───────── 屏障
                             │
                    ┌────────┴─────────┐
                    │    RMW 操作       │
                    └────────┬─────────┘
                             │
                    ─────────┼───────── 屏障
                             │
            后续的读写操作不能移动到屏障之前
```

### memory_order_seq_cst

**特点**：
- 最强的内存序保证
- 所有线程看到相同的操作顺序（全局一致性）
- 默认内存序
- 性能开销最大

**全局顺序示意**：

```
线程 A          线程 B          线程 C
   │               │               │
   │ seq_cst       │               │
   │ store(x,1)    │               │
   ├───────────────┼───────────────┤
   │               │ seq_cst       │
   │               │ store(y,1)    │
   │               ├───────────────┤
   │               │               │ seq_cst
   │               │               │ load(x) → 1
   │               │               │ load(y) → 1
   └───────────────┴───────────────┘

   所有线程看到相同的全局顺序：x=1 在 y=1 之前
```

### memory_order_consume（不推荐使用）

**特点**：
- 仅保证数据依赖的操作顺序
- 比 acquire 弱，只保护依赖链
- 实际上大多数编译器将其实现为 acquire
- 标准委员会建议不要使用

```cpp
// 理论上的 consume 语义
std::atomic<int*> ptr;
int data;

// 生产者
data = 42;
ptr.store(&data, memory_order_release);

// 消费者
int* p = ptr.load(memory_order_consume);
if (p) {
    // 只有 *p 的访问保证看到 42
    // 其他非依赖的操作不保证
    int value = *p;  // 保证是 42
}
```

## 代码示例

### Release-Acquire 同步模式

```cpp
#include <atomic>
#include <thread>
#include <iostream>
#include <cassert>

// 共享数据
int data[5];
std::atomic<bool> ready{false};

void producer() {
    // 准备数据
    data[0] = 1;
    data[1] = 2;
    data[2] = 3;
    data[3] = 4;
    data[4] = 5;

    // release store：确保上面的写操作对消费者可见
    ready.store(true, std::memory_order_release);
}

void consumer() {
    // acquire load：等待数据准备好
    while (!ready.load(std::memory_order_acquire)) {
        // 自旋等待
    }

    // release-acquire 同步保证：此时 data 数组的值对我们可见
    assert(data[0] == 1);
    assert(data[1] == 2);
    assert(data[2] == 3);
    assert(data[3] == 4);
    assert(data[4] == 5);

    std::cout << "消费者成功读取所有数据" << std::endl;
}

int main() {
    std::thread t1(producer);
    std::thread t2(consumer);

    t1.join();
    t2.join();

    return 0;
}
```

### Relaxed 顺序的正确使用

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

// 统计计数器：不需要同步，只关心最终值
class Statistics {
private:
    std::atomic<uint64_t> requestCount{0};
    std::atomic<uint64_t> errorCount{0};
    std::atomic<uint64_t> totalBytes{0};

public:
    void recordRequest() {
        // relaxed 足够：我们只关心计数的原子性
        requestCount.fetch_add(1, std::memory_order_relaxed);
    }

    void recordError() {
        errorCount.fetch_add(1, std::memory_order_relaxed);
    }

    void recordBytes(uint64_t bytes) {
        totalBytes.fetch_add(bytes, std::memory_order_relaxed);
    }

    void printStats() {
        // 读取时也用 relaxed，因为只是近似统计
        std::cout << "请求数: " << requestCount.load(std::memory_order_relaxed) << "\n"
                  << "错误数: " << errorCount.load(std::memory_order_relaxed) << "\n"
                  << "总字节: " << totalBytes.load(std::memory_order_relaxed) << "\n";
    }
};

int main() {
    Statistics stats;
    std::vector<std::thread> threads;

    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&stats]() {
            for (int j = 0; j < 10000; ++j) {
                stats.recordRequest();
                if (j % 100 == 0) {
                    stats.recordError();
                }
                stats.recordBytes(1024);
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    stats.printStats();
    // 请求数: 100000（精确）
    // 错误数: 1000（精确）
    // 总字节: 102400000（精确）

    return 0;
}
```

### 顺序一致性示例

```cpp
#include <atomic>
#include <thread>
#include <iostream>
#include <cassert>

std::atomic<bool> x{false};
std::atomic<bool> y{false};
std::atomic<int> z{0};

void write_x() {
    x.store(true, std::memory_order_seq_cst);
}

void write_y() {
    y.store(true, std::memory_order_seq_cst);
}

void read_x_then_y() {
    while (!x.load(std::memory_order_seq_cst)) {
        // 等待 x 变为 true
    }
    if (y.load(std::memory_order_seq_cst)) {
        ++z;
    }
}

void read_y_then_x() {
    while (!y.load(std::memory_order_seq_cst)) {
        // 等待 y 变为 true
    }
    if (x.load(std::memory_order_seq_cst)) {
        ++z;
    }
}

int main() {
    for (int i = 0; i < 1000; ++i) {
        x = false;
        y = false;
        z = 0;

        std::thread a(write_x);
        std::thread b(write_y);
        std::thread c(read_x_then_y);
        std::thread d(read_y_then_x);

        a.join();
        b.join();
        c.join();
        d.join();

        // seq_cst 保证 z 至少为 1
        // 因为所有线程看到相同的全局顺序
        // 要么 x=true 先发生，要么 y=true 先发生
        // 无论哪种情况，至少有一个读线程会看到两者都为 true
        assert(z.load() != 0);
    }

    std::cout << "顺序一致性测试通过" << std::endl;
    return 0;
}
```

### 发布-消费模式（无锁队列）

```cpp
#include <atomic>
#include <memory>
#include <iostream>

template<typename T>
class LockFreeQueue {
private:
    struct Node {
        std::shared_ptr<T> data;
        std::atomic<Node*> next;

        Node() : next(nullptr) {}
    };

    std::atomic<Node*> head;
    std::atomic<Node*> tail;

public:
    LockFreeQueue() {
        Node* dummy = new Node();
        head.store(dummy, std::memory_order_relaxed);
        tail.store(dummy, std::memory_order_relaxed);
    }

    ~LockFreeQueue() {
        while (Node* node = head.load(std::memory_order_relaxed)) {
            head.store(node->next.load(std::memory_order_relaxed),
                      std::memory_order_relaxed);
            delete node;
        }
    }

    void push(T value) {
        auto newData = std::make_shared<T>(std::move(value));
        Node* newNode = new Node();
        Node* oldTail;

        while (true) {
            oldTail = tail.load(std::memory_order_acquire);
            Node* next = oldTail->next.load(std::memory_order_relaxed);

            if (oldTail == tail.load(std::memory_order_relaxed)) {
                if (next == nullptr) {
                    // 尝试链接新节点
                    newNode->data = newData;
                    if (oldTail->next.compare_exchange_weak(
                            next, newNode,
                            std::memory_order_release,
                            std::memory_order_relaxed)) {
                        break;
                    }
                } else {
                    // 帮助其他线程完成 tail 更新
                    tail.compare_exchange_weak(
                        oldTail, next,
                        std::memory_order_release,
                        std::memory_order_relaxed);
                }
            }
        }

        // 更新 tail
        tail.compare_exchange_strong(
            oldTail, newNode,
            std::memory_order_release,
            std::memory_order_relaxed);
    }

    std::shared_ptr<T> pop() {
        Node* oldHead;

        while (true) {
            oldHead = head.load(std::memory_order_acquire);
            Node* oldTail = tail.load(std::memory_order_relaxed);
            Node* next = oldHead->next.load(std::memory_order_acquire);

            if (oldHead == head.load(std::memory_order_relaxed)) {
                if (oldHead == oldTail) {
                    if (next == nullptr) {
                        return nullptr;  // 队列为空
                    }
                    // tail 落后，帮助更新
                    tail.compare_exchange_weak(
                        oldTail, next,
                        std::memory_order_release,
                        std::memory_order_relaxed);
                } else {
                    if (next) {
                        std::shared_ptr<T> result = next->data;
                        if (head.compare_exchange_weak(
                                oldHead, next,
                                std::memory_order_release,
                                std::memory_order_relaxed)) {
                            delete oldHead;
                            return result;
                        }
                    }
                }
            }
        }
    }
};

int main() {
    LockFreeQueue<int> queue;

    // 生产者线程
    std::thread producer([&queue]() {
        for (int i = 0; i < 100; ++i) {
            queue.push(i);
        }
    });

    // 消费者线程
    std::thread consumer([&queue]() {
        int count = 0;
        while (count < 100) {
            if (auto val = queue.pop()) {
                std::cout << "消费: " << *val << "\n";
                ++count;
            }
        }
    });

    producer.join();
    consumer.join();

    return 0;
}
```

### acq_rel 用于读-改-写操作

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

// 使用 acq_rel 实现简单的屏障同步
class Barrier {
private:
    std::atomic<int> count;
    std::atomic<int> generation{0};
    const int numThreads;

public:
    Barrier(int n) : count(n), numThreads(n) {}

    void wait() {
        int gen = generation.load(std::memory_order_relaxed);

        // fetch_sub 使用 acq_rel：
        // - acquire: 确保看到其他线程到达前的操作
        // - release: 确保我们到达前的操作对其他线程可见
        if (count.fetch_sub(1, std::memory_order_acq_rel) == 1) {
            // 最后一个到达的线程
            count.store(numThreads, std::memory_order_relaxed);
            generation.fetch_add(1, std::memory_order_release);
        } else {
            // 等待所有线程到达
            while (generation.load(std::memory_order_acquire) == gen) {
                std::this_thread::yield();
            }
        }
    }
};

int sharedData[4];
Barrier barrier(4);

void worker(int id) {
    // 阶段 1：每个线程写入自己的数据
    sharedData[id] = id * 100;

    // 等待所有线程完成写入
    barrier.wait();

    // 阶段 2：每个线程可以安全地读取所有数据
    int sum = 0;
    for (int i = 0; i < 4; ++i) {
        sum += sharedData[i];
    }

    std::cout << "线程 " << id << " 计算的总和: " << sum << "\n";
}

int main() {
    std::vector<std::thread> threads;

    for (int i = 0; i < 4; ++i) {
        threads.emplace_back(worker, i);
    }

    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

### 内存序与 CAS 操作

```cpp
#include <atomic>
#include <iostream>

// 演示 compare_exchange 的两个内存序参数
std::atomic<int> value{0};

void demonstrateCAS() {
    int expected = 0;
    int desired = 1;

    // compare_exchange_weak 有两个内存序参数：
    // 第一个：成功时的内存序
    // 第二个：失败时的内存序

    // 典型用法 1: 获取-释放语义
    // 成功时需要 release（发布新值）和 acquire（获取当前状态）
    // 失败时只需要 acquire（获取当前状态重试）
    while (!value.compare_exchange_weak(
            expected, desired,
            std::memory_order_acq_rel,    // 成功
            std::memory_order_acquire)) { // 失败
        expected = 0;  // 重置期望值
    }

    std::cout << "CAS 成功，新值: " << value.load() << std::endl;

    // 典型用法 2: 顺序一致性（最安全）
    expected = 1;
    desired = 2;
    value.compare_exchange_strong(
        expected, desired,
        std::memory_order_seq_cst,
        std::memory_order_seq_cst);

    // 典型用法 3: relaxed（仅用于不需要同步的场景）
    expected = 2;
    desired = 3;
    value.compare_exchange_weak(
        expected, desired,
        std::memory_order_relaxed,
        std::memory_order_relaxed);
}

int main() {
    demonstrateCAS();
    return 0;
}
```

## 最佳实践

### 内存序选择指南

```cpp
#include <atomic>

// 规则 1: 默认使用 seq_cst，除非有明确的性能需求
std::atomic<int> safeDefault{0};
void useSafeDefault() {
    safeDefault.store(1);  // 默认 seq_cst
    int v = safeDefault.load();  // 默认 seq_cst
}

// 规则 2: 统计计数器使用 relaxed
std::atomic<uint64_t> counter{0};
void useRelaxed() {
    counter.fetch_add(1, std::memory_order_relaxed);
}

// 规则 3: 发布数据使用 release-acquire
std::atomic<bool> dataReady{false};
int payload;
void publishData() {
    payload = 42;
    dataReady.store(true, std::memory_order_release);
}
void consumeData() {
    while (!dataReady.load(std::memory_order_acquire));
    assert(payload == 42);
}

// 规则 4: 双向同步的 RMW 操作使用 acq_rel
std::atomic<int> ticket{0};
void useAcqRel() {
    int myTicket = ticket.fetch_add(1, std::memory_order_acq_rel);
}
```

### 避免常见的内存序错误

```cpp
#include <atomic>
#include <cassert>

std::atomic<int> x{0}, y{0};

// 错误：混用不匹配的内存序
void badPattern() {
    // 生产者
    x.store(1, std::memory_order_relaxed);
    y.store(1, std::memory_order_relaxed);  // 错误：应该用 release

    // 消费者
    while (!y.load(std::memory_order_relaxed));  // 错误：应该用 acquire
    assert(x.load(std::memory_order_relaxed) == 1);  // 可能失败！
}

// 正确：release-acquire 配对
void goodPattern() {
    // 生产者
    x.store(1, std::memory_order_relaxed);
    y.store(1, std::memory_order_release);  // release 发布

    // 消费者
    while (!y.load(std::memory_order_acquire));  // acquire 获取
    assert(x.load(std::memory_order_relaxed) == 1);  // 保证成功
}
```

### 使用 RAII 封装同步模式

```cpp
#include <atomic>
#include <functional>

// 封装 release-acquire 发布模式
template<typename T>
class Publisher {
private:
    T data;
    std::atomic<bool> published{false};

public:
    template<typename Func>
    void publish(Func&& prepare) {
        prepare(data);
        published.store(true, std::memory_order_release);
    }

    bool tryConsume(T& out) {
        if (published.load(std::memory_order_acquire)) {
            out = data;
            return true;
        }
        return false;
    }

    void waitAndConsume(T& out) {
        while (!published.load(std::memory_order_acquire)) {
            std::this_thread::yield();
        }
        out = data;
    }
};

// 使用示例
Publisher<std::vector<int>> publisher;

// 生产者
void produce() {
    publisher.publish([](std::vector<int>& vec) {
        vec = {1, 2, 3, 4, 5};
    });
}

// 消费者
void consume() {
    std::vector<int> data;
    publisher.waitAndConsume(data);
    // data 保证是 {1, 2, 3, 4, 5}
}
```

### 渐进式内存序优化

```cpp
#include <atomic>

// 步骤 1: 从 seq_cst 开始，确保正确性
class CounterV1 {
    std::atomic<int> value{0};
public:
    void increment() { value++; }  // seq_cst
    int get() { return value; }    // seq_cst
};

// 步骤 2: 分析是否需要同步，如果不需要，降级到 relaxed
class CounterV2 {
    std::atomic<int> value{0};
public:
    void increment() {
        value.fetch_add(1, std::memory_order_relaxed);
    }
    int get() {
        return value.load(std::memory_order_relaxed);
    }
};

// 步骤 3: 如果需要同步，使用最小必要的内存序
class CounterV3 {
    std::atomic<int> value{0};
    int otherData;
public:
    void incrementWithData(int data) {
        otherData = data;
        value.fetch_add(1, std::memory_order_release);
    }
    int getWithData(int& data) {
        int v = value.load(std::memory_order_acquire);
        data = otherData;
        return v;
    }
};
```

## 常见陷阱

### 陷阱 1: Release-Acquire 配对不完整

```cpp
#include <atomic>
#include <thread>

std::atomic<int> data{0};
std::atomic<bool> flag{false};

// 错误：release 没有配对的 acquire
void buggyProducer() {
    data.store(42, std::memory_order_relaxed);
    flag.store(true, std::memory_order_release);
}

void buggyConsumer() {
    // 错误：使用 relaxed 而不是 acquire
    while (!flag.load(std::memory_order_relaxed));
    int value = data.load(std::memory_order_relaxed);
    // value 可能不是 42！
}

// 正确：release-acquire 配对
void correctProducer() {
    data.store(42, std::memory_order_relaxed);
    flag.store(true, std::memory_order_release);
}

void correctConsumer() {
    while (!flag.load(std::memory_order_acquire));
    int value = data.load(std::memory_order_relaxed);
    // value 保证是 42
}
```

### 陷阱 2: 误解 Relaxed 的语义

```cpp
#include <atomic>
#include <thread>
#include <iostream>

std::atomic<int> x{0}, y{0};

// 错误理解：认为 relaxed 仍然保持某种顺序
void threadA() {
    x.store(1, std::memory_order_relaxed);
    y.store(1, std::memory_order_relaxed);
}

void threadB() {
    // 可能看到 y=1 但 x=0！
    // relaxed 不保证任何顺序
    while (y.load(std::memory_order_relaxed) != 1);

    // 这个断言可能失败
    // assert(x.load(std::memory_order_relaxed) == 1);

    std::cout << "x = " << x.load(std::memory_order_relaxed) << "\n";
}
```

### 陷阱 3: 遗漏传递性依赖

```cpp
#include <atomic>
#include <thread>

std::atomic<int> a{0}, b{0}, c{0};

void thread1() {
    a.store(1, std::memory_order_release);
}

void thread2() {
    while (a.load(std::memory_order_acquire) != 1);
    b.store(1, std::memory_order_release);
}

void thread3() {
    while (b.load(std::memory_order_acquire) != 1);
    // 通过传递性，可以保证看到 a=1
    assert(a.load(std::memory_order_relaxed) == 1);  // 保证成功

    // 但是如果 thread2 用 relaxed 加载 a，传递性就断了
}

// 错误版本
void thread2_wrong() {
    while (a.load(std::memory_order_relaxed) != 1);  // 错误！
    b.store(1, std::memory_order_release);
}
// 此时 thread3 不能保证看到 a=1
```

### 陷阱 4: seq_cst 的性能开销

```cpp
#include <atomic>
#include <chrono>
#include <iostream>

const int ITERATIONS = 100000000;

void benchmarkSeqCst() {
    std::atomic<int> counter{0};

    // seq_cst（默认）
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < ITERATIONS; ++i) {
        counter.fetch_add(1);  // 默认 seq_cst
    }
    auto seqCstTime = std::chrono::high_resolution_clock::now() - start;

    counter = 0;

    // relaxed
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < ITERATIONS; ++i) {
        counter.fetch_add(1, std::memory_order_relaxed);
    }
    auto relaxedTime = std::chrono::high_resolution_clock::now() - start;

    std::cout << "seq_cst: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(seqCstTime).count()
              << " ms\n";
    std::cout << "relaxed: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(relaxedTime).count()
              << " ms\n";

    // 在某些架构上，seq_cst 可能比 relaxed 慢 2-10 倍
}
```

### 陷阱 5: 单个原子变量的假安全感

```cpp
#include <atomic>
#include <thread>

// 错误：认为使用原子变量就自动线程安全
class BadCounter {
    std::atomic<int> value{0};

public:
    // 错误：读-改-写不是原子的
    void incrementIfLessThan(int max) {
        if (value.load() < max) {  // (1) 读取
            value++;                // (2) 写入，但 (1) 和 (2) 之间可能被中断
        }
    }
};

// 正确：使用 CAS 循环
class GoodCounter {
    std::atomic<int> value{0};

public:
    bool incrementIfLessThan(int max) {
        int current = value.load(std::memory_order_relaxed);
        while (current < max) {
            if (value.compare_exchange_weak(
                    current, current + 1,
                    std::memory_order_relaxed,
                    std::memory_order_relaxed)) {
                return true;
            }
            // current 在失败时被自动更新
        }
        return false;
    }
};
```

## 性能考量

### 不同内存序的性能对比

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <chrono>
#include <iostream>

const int NUM_THREADS = 4;
const int OPS_PER_THREAD = 10000000;

template<std::memory_order Order>
void benchmarkMemoryOrder(const char* name) {
    std::atomic<int> counter{0};
    std::vector<std::thread> threads;

    auto start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < OPS_PER_THREAD; ++j) {
                counter.fetch_add(1, Order);
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    std::cout << name << ": " << duration.count() << " ms, "
              << "result: " << counter << "\n";
}

int main() {
    std::cout << "内存序性能对比 (" << NUM_THREADS << " 线程, "
              << OPS_PER_THREAD << " 操作/线程)\n\n";

    benchmarkMemoryOrder<std::memory_order_seq_cst>("seq_cst");
    benchmarkMemoryOrder<std::memory_order_acq_rel>("acq_rel");
    benchmarkMemoryOrder<std::memory_order_relaxed>("relaxed");

    return 0;
}

// 典型输出（因架构和编译器而异）：
// seq_cst: 1200 ms
// acq_rel:  800 ms
// relaxed:  400 ms
```

### 架构相关的性能差异

```
┌─────────────────────────────────────────────────────────────┐
│           不同架构的内存序开销对比                            │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   内存序     │    x86      │    ARM      │    备注          │
├─────────────┼─────────────┼─────────────┼──────────────────┤
│ relaxed     │     低      │     低      │ 几乎无额外开销    │
│ acquire     │     低      │     中      │ x86 天然支持      │
│ release     │     低      │     中      │ x86 天然支持      │
│ acq_rel     │     中      │     高      │ ARM 需要屏障      │
│ seq_cst     │     高      │     很高    │ 需要全局序列化    │
└─────────────┴─────────────┴─────────────┴──────────────────┘

注：x86 是强内存模型，大多数操作天然满足 acquire-release
    ARM 是弱内存模型，需要显式的内存屏障指令
```

### 优化建议

```cpp
#include <atomic>

// 1. 批量操作减少原子操作次数
class BatchedCounter {
    std::atomic<int> globalCount{0};
    static thread_local int localCount;
    static constexpr int BATCH_SIZE = 100;

public:
    void increment() {
        if (++localCount >= BATCH_SIZE) {
            globalCount.fetch_add(localCount, std::memory_order_relaxed);
            localCount = 0;
        }
    }

    void flush() {
        if (localCount > 0) {
            globalCount.fetch_add(localCount, std::memory_order_relaxed);
            localCount = 0;
        }
    }

    int get() {
        return globalCount.load(std::memory_order_relaxed);
    }
};

thread_local int BatchedCounter::localCount = 0;

// 2. 避免伪共享
struct alignas(64) PaddedAtomic {
    std::atomic<int> value{0};
};

// 3. 读多写少场景使用 RCU 模式
template<typename T>
class RCUData {
    std::atomic<T*> current;

public:
    RCUData(T* initial) : current(initial) {}

    // 读取（无锁）
    T* read() {
        return current.load(std::memory_order_acquire);
    }

    // 更新（需要外部同步）
    void update(T* newData) {
        T* old = current.exchange(newData, std::memory_order_acq_rel);
        // 使用延迟释放（如 hazard pointers）安全删除 old
    }
};
```

## 实战场景

### 场景 1: 双缓冲数据发布

```cpp
#include <atomic>
#include <thread>
#include <array>
#include <iostream>

template<typename T>
class DoubleBuffer {
private:
    std::array<T, 2> buffers;
    std::atomic<int> activeIndex{0};
    std::atomic<bool> updating{false};

public:
    // 生产者：更新数据
    template<typename Func>
    void update(Func&& updateFunc) {
        // 获取更新锁
        bool expected = false;
        while (!updating.compare_exchange_weak(
                expected, true,
                std::memory_order_acquire,
                std::memory_order_relaxed)) {
            expected = false;
            std::this_thread::yield();
        }

        // 在非活动缓冲区更新
        int inactiveIndex = 1 - activeIndex.load(std::memory_order_relaxed);
        updateFunc(buffers[inactiveIndex]);

        // 切换活动缓冲区
        activeIndex.store(inactiveIndex, std::memory_order_release);

        // 释放更新锁
        updating.store(false, std::memory_order_release);
    }

    // 消费者：读取数据
    const T& read() const {
        int index = activeIndex.load(std::memory_order_acquire);
        return buffers[index];
    }
};

int main() {
    DoubleBuffer<std::vector<int>> buffer;

    // 初始化
    buffer.update([](std::vector<int>& buf) {
        buf = {1, 2, 3};
    });

    // 生产者线程
    std::thread producer([&buffer]() {
        for (int i = 0; i < 100; ++i) {
            buffer.update([i](std::vector<int>& buf) {
                buf.clear();
                for (int j = 0; j <= i; ++j) {
                    buf.push_back(j);
                }
            });
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
    });

    // 消费者线程
    std::thread consumer([&buffer]() {
        for (int i = 0; i < 200; ++i) {
            const auto& data = buffer.read();
            std::cout << "读取到 " << data.size() << " 个元素\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(5));
        }
    });

    producer.join();
    consumer.join();

    return 0;
}
```

### 场景 2: 无锁日志记录器

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <string>
#include <iostream>

class LockFreeLogger {
private:
    struct LogEntry {
        std::atomic<bool> valid{false};
        std::string message;
        int threadId;
        uint64_t timestamp;
    };

    static constexpr size_t BUFFER_SIZE = 1024;
    std::array<LogEntry, BUFFER_SIZE> buffer;
    std::atomic<size_t> writeIndex{0};
    std::atomic<size_t> readIndex{0};

public:
    bool log(const std::string& msg, int tid) {
        size_t index = writeIndex.fetch_add(1, std::memory_order_relaxed) % BUFFER_SIZE;

        // 检查是否追上读索引（缓冲区满）
        size_t rIdx = readIndex.load(std::memory_order_acquire);
        if ((index + 1) % BUFFER_SIZE == rIdx) {
            return false;  // 缓冲区满
        }

        buffer[index].message = msg;
        buffer[index].threadId = tid;
        buffer[index].timestamp = getCurrentTimestamp();

        // 标记为有效（release 确保上面的写操作可见）
        buffer[index].valid.store(true, std::memory_order_release);

        return true;
    }

    bool consume(std::string& msg, int& tid, uint64_t& ts) {
        size_t index = readIndex.load(std::memory_order_relaxed);
        size_t wIdx = writeIndex.load(std::memory_order_acquire);

        if (index == wIdx % BUFFER_SIZE) {
            return false;  // 缓冲区空
        }

        // 等待数据有效
        while (!buffer[index].valid.load(std::memory_order_acquire)) {
            std::this_thread::yield();
        }

        msg = buffer[index].message;
        tid = buffer[index].threadId;
        ts = buffer[index].timestamp;

        buffer[index].valid.store(false, std::memory_order_release);
        readIndex.store((index + 1) % BUFFER_SIZE, std::memory_order_release);

        return true;
    }

private:
    static uint64_t getCurrentTimestamp() {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::high_resolution_clock::now().time_since_epoch()
        ).count();
    }
};
```

### 场景 3: 多生产者序列号生成器

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

class SequenceGenerator {
private:
    std::atomic<uint64_t> sequence{0};

public:
    uint64_t next() {
        // relaxed 足够：我们只需要唯一性，不需要顺序
        return sequence.fetch_add(1, std::memory_order_relaxed);
    }

    uint64_t current() const {
        return sequence.load(std::memory_order_relaxed);
    }

    // 带范围检查的版本
    bool nextIfLessThan(uint64_t max, uint64_t& result) {
        uint64_t current = sequence.load(std::memory_order_relaxed);
        while (current < max) {
            if (sequence.compare_exchange_weak(
                    current, current + 1,
                    std::memory_order_relaxed,
                    std::memory_order_relaxed)) {
                result = current;
                return true;
            }
        }
        return false;
    }
};

int main() {
    SequenceGenerator gen;
    std::vector<std::thread> threads;
    std::atomic<int> collisions{0};

    const int NUM_THREADS = 10;
    const int OPS_PER_THREAD = 100000;

    std::vector<std::vector<uint64_t>> results(NUM_THREADS);

    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back([&gen, &results, i]() {
            results[i].reserve(OPS_PER_THREAD);
            for (int j = 0; j < OPS_PER_THREAD; ++j) {
                results[i].push_back(gen.next());
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    // 验证唯一性
    std::vector<uint64_t> all;
    for (const auto& r : results) {
        all.insert(all.end(), r.begin(), r.end());
    }
    std::sort(all.begin(), all.end());

    bool unique = std::adjacent_find(all.begin(), all.end()) == all.end();
    std::cout << "所有序列号唯一: " << (unique ? "是" : "否") << "\n";
    std::cout << "总序列数: " << all.size() << "\n";
    std::cout << "最大序列号: " << gen.current() << "\n";

    return 0;
}
```

## 面试要点

### 常见面试问题

**Q1: 解释 happens-before 关系**

答：Happens-before 是 C++ 内存模型中定义操作顺序和可见性的核心关系。如果操作 A happens-before 操作 B，则 A 的效果对 B 可见，且 A 在 B 之前完成。它来源于：
1. 同一线程内的程序顺序（sequenced-before）
2. 线程间的同步关系（synchronizes-with，如 release-acquire）
3. 传递性

**Q2: release-acquire 语义如何工作？**

答：Release-acquire 建立线程间的同步关系：
- Release store 确保其之前的所有写操作在 store 之前完成
- Acquire load 确保其之后的所有读操作在 load 之后开始
- 当 acquire load 读取到 release store 写入的值时，建立 synchronizes-with 关系
- 这保证 release 之前的所有写操作对 acquire 之后的所有读操作可见

**Q3: 什么时候使用 relaxed？**

答：Relaxed 适用于：
1. 统计计数器（只关心最终准确性）
2. 不需要同步的标志位
3. 作为更强内存序操作的组成部分
4. 性能关键路径中确定不需要同步的操作

注意：relaxed 仅保证原子性，不保证任何顺序，使用时必须确保不依赖操作顺序。

**Q4: seq_cst 和 acq_rel 的区别？**

答：
- `acq_rel`：建立两个线程之间的 happens-before 关系
- `seq_cst`：除了建立 happens-before 关系外，还保证所有线程看到相同的全局操作顺序

例如，在多个原子变量的读写中，seq_cst 保证跨变量的顺序一致性，而 acq_rel 只保证单个变量的同步。seq_cst 通常更慢，但更容易推理。

**Q5: 如何选择 compare_exchange 的内存序？**

答：
```cpp
// 只需要原子性
value.compare_exchange_weak(expected, desired,
    std::memory_order_relaxed,
    std::memory_order_relaxed);

// 发布新值，获取当前状态
value.compare_exchange_weak(expected, desired,
    std::memory_order_acq_rel,
    std::memory_order_acquire);

// 最安全，不确定时使用
value.compare_exchange_weak(expected, desired,
    std::memory_order_seq_cst,
    std::memory_order_seq_cst);
```

**Q6: 什么是数据竞争？内存序如何帮助避免？**

答：数据竞争发生在两个线程同时访问同一内存位置，至少有一个是写操作，且没有同步。数据竞争是未定义行为。

内存序帮助避免数据竞争的方式：
1. 原子操作本身没有数据竞争
2. 通过 release-acquire 建立 happens-before 关系
3. 确保非原子数据的访问有正确的顺序

### 代码分析题

```cpp
// 分析以下代码的正确性
std::atomic<int> x{0}, y{0};
int r1, r2;

// 线程 1
void thread1() {
    x.store(1, std::memory_order_relaxed);  // (1)
    r1 = y.load(std::memory_order_relaxed); // (2)
}

// 线程 2
void thread2() {
    y.store(1, std::memory_order_relaxed);  // (3)
    r2 = x.load(std::memory_order_relaxed); // (4)
}

// 问：执行后 r1 == 0 && r2 == 0 是否可能？
```

答案：是可能的。由于使用 relaxed 内存序：
- 操作 (1) 和 (2) 可以重排
- 操作 (3) 和 (4) 可以重排
- 可能的执行顺序：(2) → (4) → (1) → (3)

要防止这种情况，需要使用更强的内存序或添加同步点。

## 延伸阅读

### 官方文档

- [C++ Reference - Memory Order](https://en.cppreference.com/w/cpp/atomic/memory_order)
- [C++ Standard - Atomic Operations](https://eel.is/c++draft/atomics)

### 推荐书籍

- **C++ Concurrency in Action** (Anthony Williams) - 深入讲解内存模型
- **The Art of Multiprocessor Programming** (Herlihy & Shavit) - 并发算法经典
- **Is Parallel Programming Hard?** (Paul McKenney) - 内存模型和 RCU

### 优质文章

- [Preshing on Programming - Memory Ordering Series](https://preshing.com/20120625/memory-ordering-at-compile-time/)
- [Memory Barriers Are Like Source Control Operations](https://preshing.com/20120710/memory-barriers-are-like-source-control-operations/)
- [Acquire and Release Semantics](https://preshing.com/20120913/acquire-and-release-semantics/)
- [The Synchronizes-With Relation](https://preshing.com/20130823/the-synchronizes-with-relation/)
- [An Introduction to Lock-Free Programming](https://preshing.com/20120612/an-introduction-to-lock-free-programming/)

### 工具与调试

- **ThreadSanitizer (TSan)** - 检测数据竞争
- **AddressSanitizer (ASan)** - 检测内存错误
- **CDSChecker** - 验证 C++ 内存模型正确性
- **Relacy** - 并发算法验证框架

### 相关主题

- [C++ 原子操作](/cpp/atomic) - std::atomic 详解
- [C++ 并发编程](/cpp/concurrency) - 线程、互斥锁、条件变量
- [C++ 智能指针](/cpp/smart-pointers) - RAII 和内存管理

---

内存序是 C++ 并发编程中最复杂也最重要的概念之一。正确理解和使用内存序，需要深入理解硬件内存模型、编译器优化以及 C++ 内存模型的抽象。在实践中，建议从 seq_cst 开始，在确保正确性后再考虑性能优化。记住：错误的并发代码可能在大多数情况下"正常"工作，但在特定条件下会产生难以调试的问题。
