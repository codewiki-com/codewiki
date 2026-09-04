---
title: C++ 条件变量 (condition_variable)
description: 深入理解 C++ 条件变量：wait/notify 机制、虚假唤醒处理、生产者-消费者模式与线程同步最佳实践
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - 并发
  - 条件变量
  - 线程同步
  - 生产者消费者
status: imported
origin: old/src/content/docs/cpp/condition-variable.zh.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 并发
  order: 8
  lastUpdated: 2026-01-07
---

条件变量是 C++ 并发编程中实现线程间同步的核心机制。它允许一个或多个线程等待某个条件成立，而另一个线程可以在条件满足时通知等待的线程。条件变量与互斥锁配合使用，是实现生产者-消费者模式、线程池等并发模式的基础组件。

## 概念解释

### 什么是条件变量

条件变量 (Condition Variable) 是一种同步原语，用于阻塞一个或多个线程，直到另一个线程修改共享变量（条件）并通知条件变量。它解决了线程间"等待-通知"的协作问题。

**核心思想**：线程 A 需要等待某个条件成立才能继续执行，而条件的改变由线程 B 完成。条件变量提供了一种高效的等待机制，避免了忙等待（busy-waiting）造成的 CPU 资源浪费。

### 历史背景

条件变量的概念源自于操作系统中的同步原语，最早在 POSIX 线程库（pthread）中提供了 `pthread_cond_t`。C++11 标准将其纳入标准库，提供了 `std::condition_variable` 和 `std::condition_variable_any` 两个类。

### 解决的问题

1. **避免忙等待**：不使用条件变量时，线程可能需要不断轮询检查条件，浪费 CPU 资源
2. **线程协作**：实现生产者-消费者、读写者等经典并发模式
3. **资源管理**：在资源可用时唤醒等待的线程，实现高效的资源分配

## 核心原理

### 工作机制

条件变量的工作机制包含三个核心操作：

```
┌─────────────────────────────────────────────────────────────┐
│                    条件变量工作流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  等待线程                          通知线程                   │
│  ─────────                        ─────────                  │
│     │                                │                       │
│     ▼                                │                       │
│  ┌──────────┐                        │                       │
│  │ 获取锁   │                        │                       │
│  └────┬─────┘                        │                       │
│       │                              │                       │
│       ▼                              │                       │
│  ┌──────────┐                        │                       │
│  │ 检查条件 │◄─────────────────┐     │                       │
│  └────┬─────┘                  │     │                       │
│       │                        │     ▼                       │
│    条件不满足               条件满足  ┌──────────┐            │
│       │                        │     │ 获取锁   │            │
│       ▼                        │     └────┬─────┘            │
│  ┌──────────┐                  │          │                  │
│  │ 释放锁   │                  │          ▼                  │
│  │ 进入等待 │                  │     ┌──────────┐            │
│  └────┬─────┘                  │     │ 修改条件 │            │
│       │                        │     └────┬─────┘            │
│   等待通知                     │          │                  │
│       │                        │          ▼                  │
│       │◄──────────────────────────── ┌──────────┐            │
│       │         notify               │ 释放锁   │            │
│       ▼                              │ 发送通知 │            │
│  ┌──────────┐                  │     └──────────┘            │
│  │ 重获锁   │──────────────────┘                             │
│  └────┬─────┘                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                                │
│  │ 继续执行 │                                                │
│  └──────────┘                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### wait 操作的原子性

`wait` 操作是原子性的，它执行以下步骤：

1. 释放关联的互斥锁
2. 将线程置于等待状态
3. 当被唤醒时，重新获取互斥锁
4. 返回

这三个步骤是原子的，确保不会在释放锁和进入等待之间丢失通知。

### 虚假唤醒 (Spurious Wakeup)

虚假唤醒是条件变量的一个重要特性：线程可能在没有收到 `notify` 的情况下从 `wait` 返回。这是由操作系统实现决定的，出于性能优化的考虑。

**产生原因**：
- 操作系统内部实现优化
- 多处理器系统中的信号处理
- 系统中断

**解决方案**：始终在循环中检查条件，或使用带谓词的 `wait` 版本。

## 核心要点

### C++ 标准库提供的条件变量类

| 类 | 头文件 | 特点 |
|---|--------|------|
| `std::condition_variable` | `<condition_variable>` | 只能与 `std::unique_lock<std::mutex>` 配合使用，效率更高 |
| `std::condition_variable_any` | `<condition_variable>` | 可与任何满足 BasicLockable 要求的锁配合使用 |

### 主要成员函数

```cpp
// std::condition_variable 的主要接口
class condition_variable {
public:
    // 等待函数
    void wait(std::unique_lock<std::mutex>& lock);

    template<typename Predicate>
    void wait(std::unique_lock<std::mutex>& lock, Predicate pred);

    // 带超时的等待
    template<typename Rep, typename Period>
    std::cv_status wait_for(
        std::unique_lock<std::mutex>& lock,
        const std::chrono::duration<Rep, Period>& rel_time
    );

    template<typename Rep, typename Period, typename Predicate>
    bool wait_for(
        std::unique_lock<std::mutex>& lock,
        const std::chrono::duration<Rep, Period>& rel_time,
        Predicate pred
    );

    template<typename Clock, typename Duration>
    std::cv_status wait_until(
        std::unique_lock<std::mutex>& lock,
        const std::chrono::time_point<Clock, Duration>& abs_time
    );

    template<typename Clock, typename Duration, typename Predicate>
    bool wait_until(
        std::unique_lock<std::mutex>& lock,
        const std::chrono::time_point<Clock, Duration>& abs_time,
        Predicate pred
    );

    // 通知函数
    void notify_one() noexcept;  // 唤醒一个等待线程
    void notify_all() noexcept;  // 唤醒所有等待线程
};
```

### wait 函数的两种形式

```cpp
// 形式1：无谓词版本 - 需要在循环中使用
while (!condition) {
    cv.wait(lock);
}

// 形式2：带谓词版本 - 内部自动处理虚假唤醒
cv.wait(lock, []{ return condition; });

// 两者等价，但带谓词版本更简洁安全
```

## 代码示例

### 基础用法

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>

std::mutex mtx;
std::condition_variable cv;
bool ready = false;

void worker() {
    std::unique_lock<std::mutex> lock(mtx);

    // 等待条件成立
    // 带谓词的 wait 自动处理虚假唤醒
    cv.wait(lock, []{ return ready; });

    std::cout << "工作线程: 条件已满足，开始工作\n";
}

void trigger() {
    std::this_thread::sleep_for(std::chrono::seconds(1));

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
        std::cout << "触发线程: 设置条件为 true\n";
    }

    cv.notify_one();  // 通知一个等待的线程
}

int main() {
    std::thread t1(worker);
    std::thread t2(trigger);

    t1.join();
    t2.join();

    return 0;
}
```

### 处理虚假唤醒

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>

std::mutex mtx;
std::condition_variable cv;
int data = 0;
bool dataReady = false;

// 错误示例：不处理虚假唤醒
void wrongWait() {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock);  // 危险！可能虚假唤醒

    // 可能在 dataReady 为 false 时执行
    std::cout << "数据: " << data << "\n";
}

// 正确示例1：在循环中检查条件
void correctWait1() {
    std::unique_lock<std::mutex> lock(mtx);

    while (!dataReady) {  // 循环检查条件
        cv.wait(lock);
    }

    std::cout << "数据: " << data << "\n";
}

// 正确示例2：使用带谓词的 wait（推荐）
void correctWait2() {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock, []{ return dataReady; });  // 内部自动循环检查

    std::cout << "数据: " << data << "\n";
}

void producer() {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    {
        std::lock_guard<std::mutex> lock(mtx);
        data = 42;
        dataReady = true;
    }

    cv.notify_all();
}

int main() {
    std::thread consumer(correctWait2);
    std::thread prod(producer);

    consumer.join();
    prod.join();

    return 0;
}
```

### 生产者-消费者模式

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <chrono>

template<typename T>
class ThreadSafeQueue {
private:
    std::queue<T> queue_;
    mutable std::mutex mtx_;
    std::condition_variable cvNotEmpty_;
    std::condition_variable cvNotFull_;
    size_t maxSize_;
    bool closed_ = false;

public:
    explicit ThreadSafeQueue(size_t maxSize = 100) : maxSize_(maxSize) {}

    // 生产者：添加元素
    bool push(const T& value) {
        std::unique_lock<std::mutex> lock(mtx_);

        // 等待队列不满
        cvNotFull_.wait(lock, [this] {
            return queue_.size() < maxSize_ || closed_;
        });

        if (closed_) {
            return false;
        }

        queue_.push(value);
        cvNotEmpty_.notify_one();  // 通知消费者
        return true;
    }

    // 消费者：取出元素
    bool pop(T& value) {
        std::unique_lock<std::mutex> lock(mtx_);

        // 等待队列不空
        cvNotEmpty_.wait(lock, [this] {
            return !queue_.empty() || closed_;
        });

        if (queue_.empty()) {
            return false;  // 队列已关闭且为空
        }

        value = std::move(queue_.front());
        queue_.pop();
        cvNotFull_.notify_one();  // 通知生产者
        return true;
    }

    // 带超时的取出
    bool tryPopFor(T& value, std::chrono::milliseconds timeout) {
        std::unique_lock<std::mutex> lock(mtx_);

        if (!cvNotEmpty_.wait_for(lock, timeout, [this] {
            return !queue_.empty() || closed_;
        })) {
            return false;  // 超时
        }

        if (queue_.empty()) {
            return false;
        }

        value = std::move(queue_.front());
        queue_.pop();
        cvNotFull_.notify_one();
        return true;
    }

    // 关闭队列
    void close() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            closed_ = true;
        }
        cvNotEmpty_.notify_all();
        cvNotFull_.notify_all();
    }

    bool empty() const {
        std::lock_guard<std::mutex> lock(mtx_);
        return queue_.empty();
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mtx_);
        return queue_.size();
    }
};

int main() {
    ThreadSafeQueue<int> queue(10);

    // 生产者线程
    std::thread producer([&queue] {
        for (int i = 1; i <= 20; ++i) {
            if (queue.push(i)) {
                std::cout << "生产: " << i << "\n";
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
        queue.close();
    });

    // 多个消费者线程
    auto consumer = [&queue](int id) {
        int value;
        while (queue.pop(value)) {
            std::cout << "消费者" << id << " 消费: " << value << "\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
        std::cout << "消费者" << id << " 退出\n";
    };

    std::thread c1(consumer, 1);
    std::thread c2(consumer, 2);

    producer.join();
    c1.join();
    c2.join();

    return 0;
}
```

### wait_for 和 wait_until 超时等待

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <chrono>

std::mutex mtx;
std::condition_variable cv;
bool taskCompleted = false;

void longRunningTask() {
    std::this_thread::sleep_for(std::chrono::seconds(3));

    {
        std::lock_guard<std::mutex> lock(mtx);
        taskCompleted = true;
    }
    cv.notify_one();
}

void waitWithTimeout() {
    std::unique_lock<std::mutex> lock(mtx);

    // 使用 wait_for 等待最多 2 秒
    if (cv.wait_for(lock, std::chrono::seconds(2), [] {
        return taskCompleted;
    })) {
        std::cout << "任务在超时前完成\n";
    } else {
        std::cout << "等待超时，任务未完成\n";
    }
}

void waitUntilDeadline() {
    std::unique_lock<std::mutex> lock(mtx);

    // 使用 wait_until 等待到指定时间点
    auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(5);

    auto status = cv.wait_until(lock, deadline, [] {
        return taskCompleted;
    });

    if (status) {
        std::cout << "在截止时间前完成\n";
    } else {
        std::cout << "截止时间已到\n";
    }
}

int main() {
    // 示例1：超时
    std::cout << "=== 测试超时 ===\n";
    std::thread t1(longRunningTask);
    std::thread t2(waitWithTimeout);

    t2.join();
    t1.join();

    // 重置状态
    taskCompleted = false;

    // 示例2：在截止时间前完成
    std::cout << "\n=== 测试截止时间 ===\n";
    std::thread t3(longRunningTask);
    std::thread t4(waitUntilDeadline);

    t3.join();
    t4.join();

    return 0;
}
```

### notify_one vs notify_all

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <vector>

std::mutex mtx;
std::condition_variable cv;
int sharedResource = 0;

void workerNotifyOne(int id) {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock, [] { return sharedResource > 0; });

    --sharedResource;
    std::cout << "工作者 " << id << " 获取资源，剩余: " << sharedResource << "\n";
}

void workerNotifyAll(int id) {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock, [] { return sharedResource > 0; });

    // 所有线程同时被唤醒，但只有一个能成功
    if (sharedResource > 0) {
        --sharedResource;
        std::cout << "工作者 " << id << " 获取资源，剩余: " << sharedResource << "\n";
    } else {
        std::cout << "工作者 " << id << " 资源不足，继续等待\n";
    }
}

void demoNotifyOne() {
    std::cout << "=== notify_one 示例 ===\n";
    sharedResource = 0;

    std::vector<std::thread> workers;
    for (int i = 0; i < 3; ++i) {
        workers.emplace_back(workerNotifyOne, i);
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // 每次添加一个资源并通知一个线程
    for (int i = 0; i < 3; ++i) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            ++sharedResource;
            std::cout << "添加资源，总数: " << sharedResource << "\n";
        }
        cv.notify_one();  // 只唤醒一个等待线程
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    for (auto& t : workers) {
        t.join();
    }
}

void demoNotifyAll() {
    std::cout << "\n=== notify_all 示例 ===\n";
    sharedResource = 0;

    std::vector<std::thread> workers;
    for (int i = 0; i < 3; ++i) {
        workers.emplace_back(workerNotifyAll, i);
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    {
        std::lock_guard<std::mutex> lock(mtx);
        sharedResource = 3;  // 添加3个资源
        std::cout << "添加3个资源\n";
    }
    cv.notify_all();  // 唤醒所有等待线程

    for (auto& t : workers) {
        t.join();
    }
}

int main() {
    demoNotifyOne();
    demoNotifyAll();
    return 0;
}
```

### std::condition_variable_any 的使用

```cpp
#include <iostream>
#include <thread>
#include <shared_mutex>
#include <condition_variable>

std::shared_mutex sharedMtx;
std::condition_variable_any cvAny;
int data = 0;
bool dataReady = false;

void reader(int id) {
    std::shared_lock<std::shared_mutex> lock(sharedMtx);

    // condition_variable_any 可以与任何锁类型配合
    cvAny.wait(lock, [] { return dataReady; });

    std::cout << "读者 " << id << " 读取数据: " << data << "\n";
}

void writer() {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    {
        std::unique_lock<std::shared_mutex> lock(sharedMtx);
        data = 42;
        dataReady = true;
        std::cout << "写者设置数据: " << data << "\n";
    }

    cvAny.notify_all();
}

int main() {
    std::vector<std::thread> readers;
    for (int i = 0; i < 3; ++i) {
        readers.emplace_back(reader, i);
    }

    std::thread w(writer);

    for (auto& r : readers) {
        r.join();
    }
    w.join();

    return 0;
}
```

## 最佳实践

### 始终使用带谓词的 wait

```cpp
// 推荐：使用带谓词的 wait
cv.wait(lock, []{ return condition; });

// 不推荐：手动循环（容易出错）
while (!condition) {
    cv.wait(lock);
}
```

### 在发送通知前释放锁

```cpp
// 推荐：先释放锁再通知
{
    std::lock_guard<std::mutex> lock(mtx);
    data = newValue;
    ready = true;
}  // 锁在这里释放
cv.notify_one();  // 然后发送通知

// 也可以：锁内通知（等待线程会立即竞争锁）
{
    std::lock_guard<std::mutex> lock(mtx);
    data = newValue;
    ready = true;
    cv.notify_one();  // 锁还持有，被唤醒的线程会阻塞
}
```

### 使用 RAII 确保异常安全

```cpp
class WorkQueue {
private:
    std::queue<std::function<void()>> tasks_;
    std::mutex mtx_;
    std::condition_variable cv_;
    bool stop_ = false;

public:
    void submit(std::function<void()> task) {
        {
            // RAII 确保异常时锁被释放
            std::lock_guard<std::mutex> lock(mtx_);
            if (stop_) {
                throw std::runtime_error("队列已停止");
            }
            tasks_.push(std::move(task));
        }
        cv_.notify_one();
    }

    std::function<void()> take() {
        std::unique_lock<std::mutex> lock(mtx_);
        cv_.wait(lock, [this] {
            return !tasks_.empty() || stop_;
        });

        if (tasks_.empty()) {
            throw std::runtime_error("队列已关闭");
        }

        auto task = std::move(tasks_.front());
        tasks_.pop();
        return task;
    }
};
```

### 合理选择 notify_one 和 notify_all

```cpp
// 使用 notify_one 的场景：
// - 只有一个线程能处理事件
// - 资源是单一的（如单个任务）
void singleTaskReady() {
    cv.notify_one();
}

// 使用 notify_all 的场景：
// - 多个线程都需要响应同一事件
// - 条件变化影响所有等待者
// - 关闭/停止操作
void shutdown() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        stopped = true;
    }
    cv.notify_all();  // 唤醒所有等待线程
}
```

### 避免信号丢失

```cpp
class Event {
private:
    std::mutex mtx_;
    std::condition_variable cv_;
    bool signaled_ = false;  // 状态标志防止信号丢失

public:
    void signal() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            signaled_ = true;
        }
        cv_.notify_all();
    }

    void wait() {
        std::unique_lock<std::mutex> lock(mtx_);
        cv_.wait(lock, [this] { return signaled_; });
    }

    void reset() {
        std::lock_guard<std::mutex> lock(mtx_);
        signaled_ = false;
    }
};
```

## 常见陷阱

### 忘记处理虚假唤醒

```cpp
// 错误：没有检查条件
void wrongUsage() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock);  // 危险！虚假唤醒会导致逻辑错误
    processData();
}

// 正确：始终检查条件
void correctUsage() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock, []{ return dataReady; });
    processData();
}
```

### 信号丢失 (Lost Wakeup)

```cpp
// 错误：信号可能丢失
bool ready = false;

void waiter() {
    std::unique_lock<std::mutex> lock(mtx);
    // 如果 notify 在 wait 之前发生，信号会丢失
    cv.wait(lock);
}

void notifier() {
    cv.notify_one();  // 如果此时没有线程在等待，信号丢失

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
    }
}

// 正确：使用条件标志
void correctWaiter() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock, []{ return ready; });  // 即使信号在等待前发送，条件检查也能正确处理
}

void correctNotifier() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
    }
    cv.notify_one();
}
```

### 死锁

```cpp
// 错误：嵌套锁导致死锁
void deadlockExample() {
    std::lock_guard<std::mutex> outerLock(mtx1);

    std::unique_lock<std::mutex> lock(mtx2);
    cv.wait(lock, [&] {
        // 等待条件需要 mtx1，但我们已经持有它
        std::lock_guard<std::mutex> innerLock(mtx1);  // 死锁！
        return checkCondition();
    });
}

// 正确：避免在持有锁时等待
void correctExample() {
    bool conditionMet;
    {
        std::lock_guard<std::mutex> lock(mtx1);
        conditionMet = checkCondition();
    }

    if (!conditionMet) {
        std::unique_lock<std::mutex> lock(mtx2);
        cv.wait(lock, []{ return ready; });
    }
}
```

### 使用错误的锁类型

```cpp
// 错误：condition_variable 只能与 unique_lock<mutex> 配合
void wrongLockType() {
    std::lock_guard<std::mutex> lock(mtx);  // 错误！
    // cv.wait(lock);  // 编译错误
}

// 正确：使用 unique_lock
void correctLockType() {
    std::unique_lock<std::mutex> lock(mtx);  // 正确
    cv.wait(lock, []{ return condition; });
}

// 如需使用其他锁类型，使用 condition_variable_any
void useConditionVariableAny() {
    std::shared_lock<std::shared_mutex> lock(sharedMtx);
    cvAny.wait(lock, []{ return condition; });
}
```

### 在通知前忘记修改条件

```cpp
// 错误：通知前没有修改条件
void wrongNotify() {
    cv.notify_one();  // 等待线程被唤醒，但条件仍为 false

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;  // 太晚了
    }
}

// 正确：先修改条件再通知
void correctNotify() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
    }
    cv.notify_one();
}
```

## 性能考量

### notify_one vs notify_all 的性能影响

```cpp
// notify_one: O(1) 唤醒操作，只唤醒一个线程
// 适用于：单个资源可用、任务队列

// notify_all: O(n) 唤醒所有 n 个等待线程
// 适用于：广播事件、状态变更、关闭操作

// 性能对比示例
class TaskQueue {
    // ...

    void addTask(Task task) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            tasks_.push(std::move(task));
        }
        cv_.notify_one();  // 只需唤醒一个工作线程
    }

    void shutdown() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            stopped_ = true;
        }
        cv_.notify_all();  // 需要唤醒所有工作线程退出
    }
};
```

### 减少锁竞争

```cpp
// 优化：在通知前释放锁
void optimizedNotify() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        data = newValue;
        ready = true;
    }  // 锁在这里释放

    cv.notify_one();  // 被唤醒的线程可以立即获取锁
}

// 未优化：在锁内通知
void unoptimizedNotify() {
    std::lock_guard<std::mutex> lock(mtx);
    data = newValue;
    ready = true;
    cv.notify_one();  // 被唤醒的线程必须等待锁释放
}
```

### 避免惊群效应 (Thundering Herd)

```cpp
// 问题：notify_all 导致所有线程被唤醒，但只有一个能获取资源
class ResourcePool {
    std::queue<Resource> resources_;
    std::mutex mtx_;
    std::condition_variable cv_;

public:
    // 不好：每次添加资源都唤醒所有线程
    void returnResourceBad(Resource r) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            resources_.push(std::move(r));
        }
        cv_.notify_all();  // 所有等待线程被唤醒
    }

    // 好：只唤醒一个线程
    void returnResourceGood(Resource r) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            resources_.push(std::move(r));
        }
        cv_.notify_one();  // 只唤醒一个等待线程
    }
};
```

### 批量操作优化

```cpp
class BatchQueue {
    std::queue<Item> items_;
    std::mutex mtx_;
    std::condition_variable cv_;

public:
    // 批量添加后只通知一次
    void addBatch(std::vector<Item> batch) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            for (auto& item : batch) {
                items_.push(std::move(item));
            }
        }
        // 根据等待线程数量决定通知方式
        cv_.notify_all();  // 或根据 batch.size() 决定
    }
};
```

## 实战场景

### 线程池实现

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <vector>
#include <functional>
#include <future>
#include <memory>

class ThreadPool {
private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex mtx_;
    std::condition_variable cv_;
    bool stopped_ = false;

public:
    explicit ThreadPool(size_t numThreads) {
        for (size_t i = 0; i < numThreads; ++i) {
            workers_.emplace_back([this] {
                while (true) {
                    std::function<void()> task;

                    {
                        std::unique_lock<std::mutex> lock(mtx_);
                        cv_.wait(lock, [this] {
                            return stopped_ || !tasks_.empty();
                        });

                        if (stopped_ && tasks_.empty()) {
                            return;
                        }

                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }

                    task();
                }
            });
        }
    }

    template<typename F, typename... Args>
    auto submit(F&& f, Args&&... args)
        -> std::future<typename std::invoke_result_t<F, Args...>> {

        using ReturnType = typename std::invoke_result_t<F, Args...>;

        auto task = std::make_shared<std::packaged_task<ReturnType()>>(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );

        std::future<ReturnType> future = task->get_future();

        {
            std::lock_guard<std::mutex> lock(mtx_);
            if (stopped_) {
                throw std::runtime_error("线程池已停止");
            }
            tasks_.emplace([task]() { (*task)(); });
        }

        cv_.notify_one();
        return future;
    }

    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            stopped_ = true;
        }

        cv_.notify_all();

        for (auto& worker : workers_) {
            worker.join();
        }
    }
};

int main() {
    ThreadPool pool(4);

    std::vector<std::future<int>> results;

    for (int i = 0; i < 10; ++i) {
        results.emplace_back(pool.submit([i] {
            std::cout << "任务 " << i << " 在线程 "
                      << std::this_thread::get_id() << " 执行\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            return i * i;
        }));
    }

    for (size_t i = 0; i < results.size(); ++i) {
        std::cout << "结果 " << i << ": " << results[i].get() << "\n";
    }

    return 0;
}
```

### 读写者问题

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <vector>
#include <chrono>

class ReadWriteLock {
private:
    std::mutex mtx_;
    std::condition_variable cvReaders_;
    std::condition_variable cvWriters_;
    int readers_ = 0;
    int writers_ = 0;
    int waitingWriters_ = 0;

public:
    void lockRead() {
        std::unique_lock<std::mutex> lock(mtx_);
        // 等待：没有写者，且没有等待的写者（写者优先）
        cvReaders_.wait(lock, [this] {
            return writers_ == 0 && waitingWriters_ == 0;
        });
        ++readers_;
    }

    void unlockRead() {
        std::unique_lock<std::mutex> lock(mtx_);
        --readers_;
        if (readers_ == 0) {
            cvWriters_.notify_one();
        }
    }

    void lockWrite() {
        std::unique_lock<std::mutex> lock(mtx_);
        ++waitingWriters_;
        // 等待：没有读者，没有其他写者
        cvWriters_.wait(lock, [this] {
            return readers_ == 0 && writers_ == 0;
        });
        --waitingWriters_;
        ++writers_;
    }

    void unlockWrite() {
        std::unique_lock<std::mutex> lock(mtx_);
        --writers_;
        // 优先唤醒写者
        if (waitingWriters_ > 0) {
            cvWriters_.notify_one();
        } else {
            cvReaders_.notify_all();
        }
    }
};

// RAII 封装
class ReadLockGuard {
    ReadWriteLock& lock_;
public:
    explicit ReadLockGuard(ReadWriteLock& lock) : lock_(lock) {
        lock_.lockRead();
    }
    ~ReadLockGuard() {
        lock_.unlockRead();
    }
};

class WriteLockGuard {
    ReadWriteLock& lock_;
public:
    explicit WriteLockGuard(ReadWriteLock& lock) : lock_(lock) {
        lock_.lockWrite();
    }
    ~WriteLockGuard() {
        lock_.unlockWrite();
    }
};

// 使用示例
int sharedData = 0;
ReadWriteLock rwLock;

void reader(int id) {
    for (int i = 0; i < 3; ++i) {
        ReadLockGuard guard(rwLock);
        std::cout << "读者 " << id << " 读取: " << sharedData << "\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
}

void writer(int id) {
    for (int i = 0; i < 2; ++i) {
        WriteLockGuard guard(rwLock);
        ++sharedData;
        std::cout << "写者 " << id << " 写入: " << sharedData << "\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}

int main() {
    std::vector<std::thread> threads;

    for (int i = 0; i < 3; ++i) {
        threads.emplace_back(reader, i);
    }

    for (int i = 0; i < 2; ++i) {
        threads.emplace_back(writer, i);
    }

    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

### 同步屏障 (Barrier)

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <vector>

class Barrier {
private:
    std::mutex mtx_;
    std::condition_variable cv_;
    const size_t threshold_;
    size_t count_;
    size_t generation_ = 0;

public:
    explicit Barrier(size_t count)
        : threshold_(count), count_(count) {}

    void wait() {
        std::unique_lock<std::mutex> lock(mtx_);

        size_t currentGen = generation_;

        if (--count_ == 0) {
            // 最后一个到达的线程
            ++generation_;
            count_ = threshold_;
            cv_.notify_all();
        } else {
            // 等待其他线程
            cv_.wait(lock, [this, currentGen] {
                return currentGen != generation_;
            });
        }
    }
};

void worker(int id, Barrier& barrier) {
    for (int phase = 0; phase < 3; ++phase) {
        std::cout << "工作者 " << id << " 完成阶段 " << phase << "\n";
        std::this_thread::sleep_for(
            std::chrono::milliseconds(100 * (id + 1))
        );

        barrier.wait();  // 同步点

        std::cout << "工作者 " << id << " 开始阶段 " << (phase + 1) << "\n";
    }
}

int main() {
    const int numWorkers = 3;
    Barrier barrier(numWorkers);

    std::vector<std::thread> workers;
    for (int i = 0; i < numWorkers; ++i) {
        workers.emplace_back(worker, i, std::ref(barrier));
    }

    for (auto& w : workers) {
        w.join();
    }

    return 0;
}
```

### 信号量实现

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <vector>
#include <chrono>

class Semaphore {
private:
    std::mutex mtx_;
    std::condition_variable cv_;
    size_t count_;

public:
    explicit Semaphore(size_t count = 0) : count_(count) {}

    void acquire() {
        std::unique_lock<std::mutex> lock(mtx_);
        cv_.wait(lock, [this] { return count_ > 0; });
        --count_;
    }

    bool tryAcquire() {
        std::lock_guard<std::mutex> lock(mtx_);
        if (count_ > 0) {
            --count_;
            return true;
        }
        return false;
    }

    template<typename Rep, typename Period>
    bool tryAcquireFor(const std::chrono::duration<Rep, Period>& timeout) {
        std::unique_lock<std::mutex> lock(mtx_);
        if (!cv_.wait_for(lock, timeout, [this] { return count_ > 0; })) {
            return false;
        }
        --count_;
        return true;
    }

    void release() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            ++count_;
        }
        cv_.notify_one();
    }

    void release(size_t n) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            count_ += n;
        }
        cv_.notify_all();
    }
};

// 使用信号量限制并发数
void limitedConcurrency() {
    Semaphore sem(3);  // 最多允许 3 个并发

    auto task = [&sem](int id) {
        sem.acquire();

        std::cout << "任务 " << id << " 开始执行 (线程: "
                  << std::this_thread::get_id() << ")\n";
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::cout << "任务 " << id << " 完成\n";

        sem.release();
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(task, i);
    }

    for (auto& t : threads) {
        t.join();
    }
}

int main() {
    limitedConcurrency();
    return 0;
}
```

## 面试要点

### 什么是条件变量？它解决什么问题？

**答**：条件变量是一种同步原语，用于阻塞线程直到某个条件成立。它解决了线程间"等待-通知"的协作问题，避免了忙等待造成的 CPU 浪费。

### 什么是虚假唤醒？如何处理？

**答**：虚假唤醒是指线程在没有收到 notify 的情况下从 wait 返回。这是由操作系统实现决定的。处理方法是始终在循环中检查条件，或使用带谓词的 wait 版本：

```cpp
// 正确处理虚假唤醒
cv.wait(lock, []{ return condition; });
```

### notify_one 和 notify_all 的区别和使用场景？

**答**：
- `notify_one`：只唤醒一个等待线程，适用于只有一个线程能处理事件的场景（如任务队列）
- `notify_all`：唤醒所有等待线程，适用于广播事件或状态变更（如关闭操作）

### 为什么条件变量必须与互斥锁配合使用？

**答**：
1. 保护共享条件变量的读写
2. wait 操作需要原子地释放锁和进入等待状态
3. 防止信号丢失（如果条件检查和等待之间没有锁保护，可能丢失通知）

### condition_variable 和 condition_variable_any 的区别？

**答**：
- `condition_variable`：只能与 `std::unique_lock<std::mutex>` 配合使用，性能更高
- `condition_variable_any`：可以与任何满足 BasicLockable 要求的锁类型配合使用，更灵活但略有性能开销

### 如何避免条件变量使用中的死锁？

**答**：
1. 避免在持有多个锁时调用 wait
2. 在通知前释放锁（虽然不是必须，但能减少锁竞争）
3. 确保谓词函数中不会尝试获取其他锁
4. 使用超时版本的 wait 防止永久阻塞

### 请实现一个简单的线程安全队列

```cpp
template<typename T>
class SafeQueue {
    std::queue<T> q_;
    std::mutex m_;
    std::condition_variable cv_;

public:
    void push(T val) {
        {
            std::lock_guard<std::mutex> lock(m_);
            q_.push(std::move(val));
        }
        cv_.notify_one();
    }

    T pop() {
        std::unique_lock<std::mutex> lock(m_);
        cv_.wait(lock, [this]{ return !q_.empty(); });
        T val = std::move(q_.front());
        q_.pop();
        return val;
    }
};
```

## 延伸阅读

### 官方文档
- [cppreference - std::condition_variable](https://en.cppreference.com/w/cpp/thread/condition_variable)
- [cppreference - std::condition_variable_any](https://en.cppreference.com/w/cpp/thread/condition_variable_any)

### 经典书籍
- **C++ Concurrency in Action, 2nd Edition** - Anthony Williams
  - 第 4 章详细介绍了条件变量的使用
- **The C++ Standard Library, 2nd Edition** - Nicolai Josuttis
  - 并发章节有条件变量的完整参考

### 技术文章
- [Condition Variables in C++11](https://www.modernescpp.com/index.php/condition-variables)
- [Understanding Condition Variables](https://www.cprogramming.com/c++11/c++11-condition-variable.html)

### 相关主题
- [C++ 并发编程](/docs/cpp/concurrency) - 并发编程总览
- [C++ 互斥锁](/docs/cpp/mutex) - 互斥锁详解
- [C++ 原子操作](/docs/cpp/atomic) - 无锁编程
- [C++ 协程](/docs/cpp/coroutines) - 现代异步编程

### 设计模式参考
- 生产者-消费者模式
- 读写者问题
- 屏障同步
- 信号量模式
