---
title: C++ 异步编程：async、future 与 promise
description: 深入理解 C++ 异步编程机制：std::async、std::future、std::promise、std::packaged_task 及启动策略
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - 异步编程
  - future
  - promise
  - async
status: imported
origin: old/src/content/docs/cpp/async-future.zh.md
divergence: 0.119
issues: []
legacy:
  category: Cpp
  subcategory: 并发
  order: 8
  lastUpdated: 2026-01-07
---

C++11 引入了一套完整的异步编程框架，包括 `std::async`、`std::future`、`std::promise` 和 `std::packaged_task`。这些组件共同构成了 C++ 标准库中强大的异步任务处理机制，让开发者能够以更安全、更优雅的方式编写并发程序。

## 概念解释

### 什么是异步编程

异步编程是一种编程范式，允许程序在等待某个操作完成时继续执行其他任务，而不是阻塞等待。在 C++ 中，异步编程主要通过以下核心组件实现：

- **std::future**：表示一个异步操作的结果的占位符，可以在将来某个时刻获取该结果
- **std::promise**：用于设置 future 的值，是 future 的生产者端
- **std::async**：用于启动异步任务的高级接口，返回一个 future
- **std::packaged_task**：将可调用对象包装成可获取 future 的形式

### 历史背景

在 C++11 之前，C++ 标准库没有提供原生的异步编程支持，开发者需要依赖操作系统特定的 API（如 POSIX 线程）或第三方库。C++11 标准化了这些机制，提供了跨平台的异步编程接口。C++14 和 C++17 进一步完善了这些功能，C++20 则引入了协程，提供了更强大的异步编程能力。

### 解决的问题

1. **避免手动线程管理的复杂性**：std::async 抽象了线程创建和管理的细节
2. **安全的结果传递**：future/promise 机制提供了类型安全的方式在线程间传递结果
3. **异常传播**：异步任务中的异常可以被捕获并传播到调用者
4. **资源自动管理**：RAII 风格确保资源的正确释放

## 核心原理

### std::future 和 std::promise 的协作机制

`std::future` 和 `std::promise` 组成了一对生产者-消费者模型：

```
┌─────────────────┐          共享状态           ┌─────────────────┐
│    promise      │ ─────────────────────────► │     future      │
│   (生产者)       │    设置值/异常              │    (消费者)      │
└─────────────────┘                            └─────────────────┘
         │                                              │
         │ set_value()                                  │ get()
         │ set_exception()                              │ wait()
         ▼                                              ▼
    设置结果并                                     阻塞等待或
    通知等待者                                     立即获取结果
```

### 共享状态（Shared State）

future 和 promise 通过一个共享状态（shared state）进行通信。这个共享状态包含：

- 存储的值或异常
- 一个标志，表示值是否已就绪
- 可能的等待者列表

### std::async 的执行模型

std::async 可以使用不同的启动策略：

1. **std::launch::async**：强制在新线程中异步执行
2. **std::launch::deferred**：延迟执行，在调用 get() 或 wait() 时在当前线程执行
3. **默认策略**：由实现决定，可能是 async 或 deferred

```cpp
// 执行模型示意图
std::async(policy, func, args...)
         │
         ├── launch::async ──────► 创建新线程立即执行
         │
         ├── launch::deferred ───► 延迟到 get()/wait() 时执行
         │
         └── 默认 ───────────────► 实现决定
```

### std::packaged_task 的工作原理

`std::packaged_task` 是一个可调用对象的包装器，它将任务与 future 关联起来：

```
┌─────────────────────────────────────────────────────────┐
│                   packaged_task                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  可调用对象   │ ─► │   共享状态    │ ◄─ │   future    │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│        │                   ▲                            │
│        │                   │                            │
│        └───── operator() 执行时设置结果 ─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 核心要点

### std::future 的关键特性

| 特性 | 说明 |
|------|------|
| **一次性获取** | get() 只能调用一次，之后 future 变为无效 |
| **阻塞等待** | get() 会阻塞直到结果就绪 |
| **异常传播** | 异步任务中的异常会在 get() 时重新抛出 |
| **状态查询** | 可通过 valid()、wait_for()、wait_until() 查询状态 |

### std::promise 的关键操作

| 操作 | 说明 |
|------|------|
| **set_value()** | 设置结果值，唤醒等待的 future |
| **set_exception()** | 设置异常，get() 时将抛出该异常 |
| **set_value_at_thread_exit()** | 线程退出时设置值 |
| **get_future()** | 获取关联的 future（只能调用一次） |

### 启动策略对比

| 策略 | 执行时机 | 线程 | 适用场景 |
|------|----------|------|----------|
| **launch::async** | 立即 | 新线程 | 真正的并行执行 |
| **launch::deferred** | get()/wait() 时 | 调用线程 | 惰性求值 |
| **默认** | 实现决定 | 可能任一 | 让系统优化 |

### future 状态

```cpp
// future 的可能状态
enum class future_status {
    ready,      // 结果已就绪
    timeout,    // 等待超时
    deferred    // 任务被延迟（launch::deferred）
};
```

## 代码示例

### 基础示例：std::async 的使用

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <thread>

// 模拟耗时计算
int computeValue(int x) {
    std::cout << "计算开始，线程ID: "
              << std::this_thread::get_id() << "\n";
    std::this_thread::sleep_for(std::chrono::seconds(2));
    return x * x;
}

int main() {
    std::cout << "主线程ID: " << std::this_thread::get_id() << "\n";

    // 使用 std::async 启动异步任务
    std::future<int> result = std::async(std::launch::async, computeValue, 10);

    // 主线程可以继续做其他工作
    std::cout << "异步任务已启动，主线程继续工作...\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    std::cout << "主线程工作中...\n";

    // 获取结果（如果还没完成会阻塞）
    std::cout << "等待结果...\n";
    int value = result.get();  // 阻塞直到结果就绪

    std::cout << "计算结果: " << value << "\n";

    return 0;
}
```

### 启动策略详解

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <thread>

void showThreadId(const char* name) {
    std::cout << name << " - 线程ID: "
              << std::this_thread::get_id() << "\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
}

int main() {
    std::cout << "主线程ID: " << std::this_thread::get_id() << "\n\n";

    // 1. launch::async - 强制新线程执行
    std::cout << "=== launch::async ===\n";
    auto f1 = std::async(std::launch::async, showThreadId, "async任务");
    f1.get();

    // 2. launch::deferred - 延迟执行（在调用 get() 时执行）
    std::cout << "\n=== launch::deferred ===\n";
    auto f2 = std::async(std::launch::deferred, showThreadId, "deferred任务");
    std::cout << "deferred任务已创建，但尚未执行\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    std::cout << "现在调用 get()...\n";
    f2.get();  // 此时才执行，在当前线程

    // 3. 默认策略 - 由实现决定
    std::cout << "\n=== 默认策略 ===\n";
    auto f3 = std::async(showThreadId, "默认策略任务");
    f3.get();

    // 4. 组合策略
    std::cout << "\n=== 组合策略 (async | deferred) ===\n";
    auto f4 = std::async(
        std::launch::async | std::launch::deferred,
        showThreadId,
        "组合策略任务"
    );
    f4.get();

    return 0;
}
```

### std::promise 和 std::future 配对使用

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <string>

// 使用 promise 在线程间传递结果
void producer(std::promise<std::string>&& promise) {
    try {
        std::cout << "生产者：开始处理...\n";
        std::this_thread::sleep_for(std::chrono::seconds(2));

        // 模拟可能的错误
        bool success = true;  // 改为 false 测试异常传播

        if (success) {
            promise.set_value("处理完成的数据");
        } else {
            throw std::runtime_error("处理失败");
        }
    } catch (...) {
        // 捕获异常并传递给 future
        promise.set_exception(std::current_exception());
    }
}

void consumer(std::future<std::string>&& future) {
    std::cout << "消费者：等待数据...\n";

    try {
        // 获取结果，可能阻塞
        std::string result = future.get();
        std::cout << "消费者：收到数据 - " << result << "\n";
    } catch (const std::exception& e) {
        std::cout << "消费者：捕获异常 - " << e.what() << "\n";
    }
}

int main() {
    // 创建 promise 和 future
    std::promise<std::string> promise;
    std::future<std::string> future = promise.get_future();

    // 在不同线程中运行生产者和消费者
    std::thread producerThread(producer, std::move(promise));
    std::thread consumerThread(consumer, std::move(future));

    producerThread.join();
    consumerThread.join();

    return 0;
}
```

### std::packaged_task 的使用

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <functional>
#include <queue>
#include <mutex>

// 计算任务
int compute(int a, int b) {
    std::cout << "执行计算: " << a << " + " << b << "\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    return a + b;
}

// 基础用法
void basicPackagedTask() {
    std::cout << "=== 基础 packaged_task 用法 ===\n";

    // 创建 packaged_task
    std::packaged_task<int(int, int)> task(compute);

    // 获取 future
    std::future<int> result = task.get_future();

    // 在新线程中执行任务
    std::thread t(std::move(task), 10, 20);

    // 获取结果
    std::cout << "结果: " << result.get() << "\n";

    t.join();
}

// 任务队列示例
class TaskQueue {
private:
    std::queue<std::packaged_task<void()>> tasks;
    std::mutex mtx;
    std::condition_variable cv;
    bool running = true;

public:
    // 添加任务
    template<typename Func, typename... Args>
    auto submit(Func&& func, Args&&... args)
        -> std::future<typename std::invoke_result_t<Func, Args...>> {

        using ReturnType = typename std::invoke_result_t<Func, Args...>;

        // 创建 packaged_task
        auto task = std::make_shared<std::packaged_task<ReturnType()>>(
            std::bind(std::forward<Func>(func), std::forward<Args>(args)...)
        );

        std::future<ReturnType> future = task->get_future();

        {
            std::lock_guard<std::mutex> lock(mtx);
            tasks.emplace([task]() { (*task)(); });
        }

        cv.notify_one();
        return future;
    }

    // 工作循环
    void processOne() {
        std::packaged_task<void()> task;

        {
            std::unique_lock<std::mutex> lock(mtx);
            cv.wait(lock, [this] { return !tasks.empty() || !running; });

            if (!running && tasks.empty()) return;

            task = std::move(tasks.front());
            tasks.pop();
        }

        task();
    }

    void stop() {
        {
            std::lock_guard<std::mutex> lock(mtx);
            running = false;
        }
        cv.notify_all();
    }
};

void taskQueueExample() {
    std::cout << "\n=== 任务队列示例 ===\n";

    TaskQueue queue;

    // 提交任务
    auto f1 = queue.submit(compute, 5, 3);
    auto f2 = queue.submit(compute, 10, 7);
    auto f3 = queue.submit([]() -> std::string {
        return "Hello from task!";
    });

    // 处理任务
    queue.processOne();
    queue.processOne();
    queue.processOne();

    // 获取结果
    std::cout << "f1 结果: " << f1.get() << "\n";
    std::cout << "f2 结果: " << f2.get() << "\n";
    std::cout << "f3 结果: " << f3.get() << "\n";

    queue.stop();
}

int main() {
    basicPackagedTask();
    taskQueueExample();
    return 0;
}
```

### std::shared_future 多消费者模式

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <vector>

int main() {
    std::cout << "=== shared_future 示例 ===\n";

    // 创建 promise 和 shared_future
    std::promise<int> promise;
    std::shared_future<int> sharedFuture = promise.get_future().share();

    // 多个消费者线程
    std::vector<std::thread> consumers;

    for (int i = 0; i < 5; ++i) {
        consumers.emplace_back([sharedFuture, i]() {
            std::cout << "消费者 " << i << " 等待结果...\n";

            // 每个消费者都可以调用 get()
            int result = sharedFuture.get();

            std::cout << "消费者 " << i << " 获取到结果: " << result << "\n";
        });
    }

    // 模拟生产者工作
    std::cout << "生产者开始工作...\n";
    std::this_thread::sleep_for(std::chrono::seconds(1));

    // 设置结果，所有等待的消费者都会被唤醒
    promise.set_value(42);
    std::cout << "生产者设置了结果\n";

    // 等待所有消费者完成
    for (auto& t : consumers) {
        t.join();
    }

    return 0;
}
```

### 使用 wait_for 检查状态

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <thread>

int longComputation() {
    std::this_thread::sleep_for(std::chrono::seconds(3));
    return 42;
}

int main() {
    std::cout << "=== wait_for 状态检查示例 ===\n";

    auto future = std::async(std::launch::async, longComputation);

    // 轮询检查任务状态
    while (true) {
        auto status = future.wait_for(std::chrono::milliseconds(500));

        switch (status) {
            case std::future_status::ready:
                std::cout << "任务完成！结果: " << future.get() << "\n";
                return 0;

            case std::future_status::timeout:
                std::cout << "任务仍在执行中...\n";
                break;

            case std::future_status::deferred:
                std::cout << "任务被延迟执行\n";
                break;
        }
    }

    return 0;
}
```

### 异常处理

```cpp
#include <iostream>
#include <future>
#include <exception>
#include <stdexcept>

// 可能抛出异常的任务
int riskyOperation(int value) {
    if (value < 0) {
        throw std::invalid_argument("值不能为负数");
    }
    if (value == 0) {
        throw std::runtime_error("值不能为零");
    }
    return 100 / value;
}

void testAsyncException(int value) {
    std::cout << "\n测试值: " << value << "\n";

    try {
        auto future = std::async(std::launch::async, riskyOperation, value);
        int result = future.get();  // 异常会在这里重新抛出
        std::cout << "结果: " << result << "\n";
    } catch (const std::invalid_argument& e) {
        std::cout << "捕获 invalid_argument: " << e.what() << "\n";
    } catch (const std::runtime_error& e) {
        std::cout << "捕获 runtime_error: " << e.what() << "\n";
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << "\n";
    }
}

void testPromiseException() {
    std::cout << "\n=== Promise 异常传递 ===\n";

    std::promise<int> promise;
    std::future<int> future = promise.get_future();

    std::thread t([&promise]() {
        try {
            // 模拟失败
            throw std::runtime_error("任务执行失败");
        } catch (...) {
            // 将当前异常传递给 future
            promise.set_exception(std::current_exception());
        }
    });

    try {
        int result = future.get();
        std::cout << "结果: " << result << "\n";
    } catch (const std::exception& e) {
        std::cout << "从 future 捕获异常: " << e.what() << "\n";
    }

    t.join();
}

int main() {
    std::cout << "=== 异步异常处理示例 ===\n";

    testAsyncException(10);   // 正常
    testAsyncException(-5);   // invalid_argument
    testAsyncException(0);    // runtime_error

    testPromiseException();

    return 0;
}
```

## 最佳实践

### 优先使用 std::async 而非手动线程管理

```cpp
// 推荐：使用 std::async
auto future = std::async(std::launch::async, someTask);
auto result = future.get();

// 不推荐：手动线程管理
std::thread t(someTask);
t.join();
// 结果传递需要额外处理...
```

### 显式指定启动策略

```cpp
// 推荐：明确指定策略
auto f1 = std::async(std::launch::async, task);    // 确保并行
auto f2 = std::async(std::launch::deferred, task); // 确保延迟

// 不推荐：依赖默认行为
auto f3 = std::async(task);  // 行为可能因实现而异
```

### 正确处理 future 生命周期

```cpp
// 错误：可能提前销毁 future
{
    std::async(std::launch::async, longRunningTask);
}  // future 析构，可能等待任务完成

// 正确：保持 future 存活
{
    auto future = std::async(std::launch::async, longRunningTask);
    // ... 其他工作 ...
    future.get();  // 或 future.wait()
}
```

### 使用 shared_future 进行广播

```cpp
// 多个消费者需要同一结果时使用 shared_future
std::promise<Config> configPromise;
std::shared_future<Config> configFuture = configPromise.get_future().share();

// 多个组件可以等待配置
componentA.initialize(configFuture);
componentB.initialize(configFuture);
componentC.initialize(configFuture);

// 配置准备好后通知所有组件
configPromise.set_value(loadConfig());
```

### 链式异步操作（C++20 之前的模式）

```cpp
#include <future>
#include <functional>

template<typename T, typename F>
auto then(std::future<T>& future, F&& func)
    -> std::future<decltype(func(future.get()))> {

    return std::async(std::launch::async, [&future, func = std::forward<F>(func)]() {
        return func(future.get());
    });
}

// 使用示例
auto step1 = std::async(std::launch::async, []() { return 10; });
auto step2 = then(step1, [](int x) { return x * 2; });
auto step3 = then(step2, [](int x) { return x + 5; });

std::cout << "最终结果: " << step3.get() << "\n";  // 25
```

### 异步任务超时处理

```cpp
template<typename T>
std::optional<T> getWithTimeout(std::future<T>& future,
                                 std::chrono::milliseconds timeout) {
    if (future.wait_for(timeout) == std::future_status::ready) {
        return future.get();
    }
    return std::nullopt;
}

// 使用示例
auto future = std::async(std::launch::async, longTask);

if (auto result = getWithTimeout(future, std::chrono::seconds(5))) {
    std::cout << "结果: " << *result << "\n";
} else {
    std::cout << "任务超时\n";
    // 注意：任务仍在后台运行
}
```

## 常见陷阱

### 忽略 std::async 返回的 future

```cpp
// 陷阱：future 立即销毁，会阻塞直到任务完成
std::async(std::launch::async, longRunningTask);  // 这里会阻塞！

// 正确做法
auto future = std::async(std::launch::async, longRunningTask);
// ... 做其他事情 ...
future.get();
```

这是因为 `std::future` 的析构函数在使用 `std::launch::async` 策略时会等待任务完成。

### 多次调用 future.get()

```cpp
std::future<int> future = std::async(std::launch::async, compute);

int result1 = future.get();  // OK
int result2 = future.get();  // 错误！future 已无效

// 解决方案：使用 shared_future
std::shared_future<int> sf = std::async(std::launch::async, compute).share();
int r1 = sf.get();  // OK
int r2 = sf.get();  // OK
```

### 忘记处理异常

```cpp
// 陷阱：异常被忽略或程序崩溃
auto future = std::async(std::launch::async, riskyTask);
int result = future.get();  // 可能抛出异常

// 正确做法
try {
    int result = future.get();
} catch (const std::exception& e) {
    // 处理异常
}
```

### 在 deferred 任务中使用 wait_for

```cpp
auto future = std::async(std::launch::deferred, task);

// 陷阱：永远返回 deferred 状态，任务永不执行
while (future.wait_for(std::chrono::seconds(1)) != std::future_status::ready) {
    // 无限循环！
}

// 正确做法：先检查是否 deferred
if (future.wait_for(std::chrono::seconds(0)) == std::future_status::deferred) {
    future.get();  // 手动触发执行
}
```

### promise 对象提前销毁

```cpp
std::future<int> future;

{
    std::promise<int> promise;
    future = promise.get_future();
}  // promise 销毁，但未设置值

// 陷阱：get() 会抛出 std::future_error
future.get();  // 抛出 broken_promise 异常
```

### 数据竞争风险

```cpp
int sharedData = 0;

// 陷阱：多个异步任务访问共享数据
auto f1 = std::async(std::launch::async, [&]() { sharedData++; });
auto f2 = std::async(std::launch::async, [&]() { sharedData++; });

f1.get();
f2.get();
// sharedData 的值不确定！

// 正确做法：使用原子操作或返回值
std::atomic<int> atomicData{0};
auto f3 = std::async(std::launch::async, [&]() { atomicData++; });
auto f4 = std::async(std::launch::async, [&]() { atomicData++; });
```

## 性能考量

### 线程创建开销

```cpp
// 不推荐：频繁创建线程
for (int i = 0; i < 10000; ++i) {
    std::async(std::launch::async, smallTask);  // 开销大
}

// 推荐：使用线程池或批量处理
ThreadPool pool(std::thread::hardware_concurrency());
for (int i = 0; i < 10000; ++i) {
    pool.submit(smallTask);
}
```

### 启动策略的性能影响

| 策略 | 创建开销 | 适用场景 |
|------|----------|----------|
| `launch::async` | 高（创建新线程） | CPU 密集型、需要真正并行 |
| `launch::deferred` | 低（无线程创建） | 惰性求值、条件执行 |

### shared_future vs future

```cpp
// shared_future 有额外的引用计数开销
// 只在确实需要多个消费者时使用

// 单消费者：使用 future
std::future<int> f = std::async(compute);

// 多消费者：使用 shared_future
std::shared_future<int> sf = std::async(compute).share();
```

### 内存分配

```cpp
// packaged_task 和 promise 会进行堆内存分配
// 对于高频操作，考虑使用对象池

class PromisePool {
    std::vector<std::promise<int>> pool;
    // ... 复用逻辑 ...
};
```

### 任务粒度优化

```cpp
// 太细粒度：开销超过收益
for (int i = 0; i < 1000000; ++i) {
    futures.push_back(std::async(std::launch::async, [i]{ return i * 2; }));
}

// 推荐：批量处理
const int batchSize = 10000;
for (int batch = 0; batch < 100; ++batch) {
    futures.push_back(std::async(std::launch::async, [batch, batchSize]{
        std::vector<int> results;
        for (int i = batch * batchSize; i < (batch + 1) * batchSize; ++i) {
            results.push_back(i * 2);
        }
        return results;
    }));
}
```

### 性能测量示例

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <vector>

void benchmark() {
    const int iterations = 1000;

    // 测量 async 开销
    auto start = std::chrono::high_resolution_clock::now();

    std::vector<std::future<int>> futures;
    for (int i = 0; i < iterations; ++i) {
        futures.push_back(std::async(std::launch::async, [i]{ return i; }));
    }

    for (auto& f : futures) {
        f.get();
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

    std::cout << "平均每个 async 任务耗时: "
              << duration.count() / iterations << " 微秒\n";
}
```

## 实战场景

### 场景一：并行数据处理

```cpp
#include <iostream>
#include <future>
#include <vector>
#include <numeric>

// 并行计算大数组的和
long long parallelSum(const std::vector<int>& data) {
    const size_t numThreads = std::thread::hardware_concurrency();
    const size_t blockSize = data.size() / numThreads;

    std::vector<std::future<long long>> futures;

    for (size_t i = 0; i < numThreads; ++i) {
        size_t start = i * blockSize;
        size_t end = (i == numThreads - 1) ? data.size() : (i + 1) * blockSize;

        futures.push_back(std::async(std::launch::async,
            [&data, start, end]() {
                return std::accumulate(
                    data.begin() + start,
                    data.begin() + end,
                    0LL
                );
            }
        ));
    }

    long long total = 0;
    for (auto& f : futures) {
        total += f.get();
    }

    return total;
}

int main() {
    std::vector<int> data(10000000, 1);

    auto start = std::chrono::high_resolution_clock::now();
    long long sum = parallelSum(data);
    auto end = std::chrono::high_resolution_clock::now();

    std::cout << "和: " << sum << "\n";
    std::cout << "耗时: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count()
              << " ms\n";

    return 0;
}
```

### 场景二：异步网络请求模拟

```cpp
#include <iostream>
#include <future>
#include <vector>
#include <map>
#include <random>

// 模拟 HTTP 响应
struct HttpResponse {
    int statusCode;
    std::string body;
};

// 模拟异步 HTTP 请求
std::future<HttpResponse> asyncHttpGet(const std::string& url) {
    return std::async(std::launch::async, [url]() {
        // 模拟网络延迟
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(100, 500);
        std::this_thread::sleep_for(std::chrono::milliseconds(dis(gen)));

        return HttpResponse{200, "Response from " + url};
    });
}

int main() {
    std::cout << "=== 并行 HTTP 请求示例 ===\n";

    std::vector<std::string> urls = {
        "https://api.example.com/users",
        "https://api.example.com/products",
        "https://api.example.com/orders",
        "https://api.example.com/reviews"
    };

    auto start = std::chrono::high_resolution_clock::now();

    // 并行发起所有请求
    std::vector<std::future<HttpResponse>> futures;
    for (const auto& url : urls) {
        futures.push_back(asyncHttpGet(url));
    }

    // 收集所有响应
    std::vector<HttpResponse> responses;
    for (auto& f : futures) {
        responses.push_back(f.get());
    }

    auto end = std::chrono::high_resolution_clock::now();

    // 显示结果
    for (size_t i = 0; i < urls.size(); ++i) {
        std::cout << urls[i] << " -> "
                  << responses[i].statusCode << ": "
                  << responses[i].body << "\n";
    }

    std::cout << "总耗时: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count()
              << " ms\n";

    return 0;
}
```

### 场景三：生产者-消费者模式

```cpp
#include <iostream>
#include <future>
#include <queue>
#include <mutex>
#include <condition_variable>

template<typename T>
class AsyncQueue {
private:
    std::queue<std::promise<T>> pendingRequests;
    std::queue<T> readyItems;
    std::mutex mtx;

public:
    // 异步获取项目
    std::future<T> asyncGet() {
        std::lock_guard<std::mutex> lock(mtx);

        if (!readyItems.empty()) {
            std::promise<T> p;
            p.set_value(std::move(readyItems.front()));
            readyItems.pop();
            return p.get_future();
        }

        pendingRequests.emplace();
        return pendingRequests.back().get_future();
    }

    // 放入项目
    void put(T item) {
        std::lock_guard<std::mutex> lock(mtx);

        if (!pendingRequests.empty()) {
            pendingRequests.front().set_value(std::move(item));
            pendingRequests.pop();
        } else {
            readyItems.push(std::move(item));
        }
    }
};

int main() {
    AsyncQueue<int> queue;

    // 消费者：请求数据（数据可能尚未就绪）
    auto f1 = queue.asyncGet();
    auto f2 = queue.asyncGet();

    std::cout << "消费者发起请求，等待数据...\n";

    // 生产者：稍后提供数据
    std::thread producer([&queue]() {
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::cout << "生产者提供数据\n";
        queue.put(100);
        queue.put(200);
    });

    // 获取结果
    std::cout << "收到: " << f1.get() << "\n";
    std::cout << "收到: " << f2.get() << "\n";

    producer.join();
    return 0;
}
```

### 场景四：任务依赖图

```cpp
#include <iostream>
#include <future>
#include <map>
#include <vector>
#include <string>

class TaskGraph {
private:
    std::map<std::string, std::function<int()>> tasks;
    std::map<std::string, std::vector<std::string>> dependencies;
    std::map<std::string, std::shared_future<int>> results;
    std::mutex mtx;

public:
    void addTask(const std::string& name,
                 std::function<int()> task,
                 std::vector<std::string> deps = {}) {
        tasks[name] = task;
        dependencies[name] = deps;
    }

    std::shared_future<int> execute(const std::string& name) {
        std::lock_guard<std::mutex> lock(mtx);

        // 如果已有结果，直接返回
        if (results.count(name)) {
            return results[name];
        }

        // 首先执行依赖
        std::vector<std::shared_future<int>> depFutures;
        for (const auto& dep : dependencies[name]) {
            depFutures.push_back(execute(dep));
        }

        // 创建当前任务
        auto future = std::async(std::launch::async,
            [this, name, depFutures = std::move(depFutures)]() {
                // 等待所有依赖完成
                for (auto& f : depFutures) {
                    f.get();
                }

                std::cout << "执行任务: " << name << "\n";
                return tasks[name]();
            }).share();

        results[name] = future;
        return future;
    }
};

int main() {
    TaskGraph graph;

    // 定义任务依赖关系
    //     A
    //    / \
    //   B   C
    //    \ /
    //     D

    graph.addTask("A", []{
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        return 1;
    });

    graph.addTask("B", []{
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
        return 2;
    }, {"A"});

    graph.addTask("C", []{
        std::this_thread::sleep_for(std::chrono::milliseconds(150));
        return 3;
    }, {"A"});

    graph.addTask("D", []{
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
        return 4;
    }, {"B", "C"});

    // 执行最终任务（会自动执行所有依赖）
    auto result = graph.execute("D");

    std::cout << "任务 D 结果: " << result.get() << "\n";

    return 0;
}
```

## 面试要点

### std::async 的默认策略是什么？有什么风险？

**答案**：默认策略是 `std::launch::async | std::launch::deferred`，即由实现决定。风险包括：
- 行为不可预测，可能在新线程执行，也可能延迟执行
- 使用 `wait_for` 可能永远返回 `deferred` 状态
- 可能导致死锁（如果 deferred 任务需要调用线程持有的锁）

**最佳实践**：显式指定 `std::launch::async` 或 `std::launch::deferred`。

### std::future 和 std::shared_future 的区别？

**答案**：

| 特性 | std::future | std::shared_future |
|------|-------------|-------------------|
| get() 调用次数 | 只能调用一次 | 可以多次调用 |
| 可拷贝性 | 仅可移动 | 可拷贝 |
| 适用场景 | 单个消费者 | 多个消费者 |
| 内存开销 | 较低 | 略高（引用计数） |

### std::promise 的 set_value 和 set_exception 有什么限制？

**答案**：
- 每个 promise 只能调用一次 `set_value` 或 `set_exception`
- 重复调用会抛出 `std::future_error`
- 如果 promise 销毁时未设置值，会设置 `broken_promise` 异常

### 为什么临时 future 会导致阻塞？

```cpp
std::async(std::launch::async, task);  // 这里会阻塞
```

**答案**：因为 `std::async` 返回的 `future` 具有特殊行为——当最后一个指向共享状态的 future 被销毁时，如果任务是用 `std::launch::async` 启动的，析构函数会阻塞直到任务完成。这是为了确保异步任务不会成为"分离的线程"。

### 如何实现异步任务的取消？

**答案**：C++ 标准库没有直接支持取消，但可以：
1. 使用 `std::atomic<bool>` 作为取消标志
2. 使用 `std::stop_token`（C++20）
3. 使用超时机制
4. 在任务中定期检查取消条件

```cpp
std::atomic<bool> cancelled{false};

auto future = std::async([&cancelled]() {
    while (!cancelled) {
        // 做工作
    }
    return -1;  // 表示被取消
});

// 取消任务
cancelled = true;
```

### std::packaged_task 和 std::async 的区别？

**答案**：

| 特性 | std::async | std::packaged_task |
|------|------------|-------------------|
| 执行控制 | 自动启动 | 手动调用 operator() |
| 线程创建 | 可能创建新线程 | 不创建线程 |
| 灵活性 | 较低 | 较高，可放入队列 |
| 适用场景 | 简单异步调用 | 任务队列、线程池 |

### 如何在 future 链中传播异常？

**答案**：
- `std::async` 自动捕获异常并在 `get()` 时重新抛出
- 使用 `promise.set_exception(std::current_exception())` 手动传递
- 链式调用时，每个 `get()` 都可能抛出前一步的异常

### future 的等待超时机制

**答案**：使用 `wait_for` 或 `wait_until`：

```cpp
auto status = future.wait_for(std::chrono::seconds(5));

if (status == std::future_status::ready) {
    auto result = future.get();
} else if (status == std::future_status::timeout) {
    // 处理超时
} else if (status == std::future_status::deferred) {
    // 任务是延迟的
}
```

## 延伸阅读

### 官方文档

- [cppreference - std::async](https://en.cppreference.com/w/cpp/thread/async)
- [cppreference - std::future](https://en.cppreference.com/w/cpp/thread/future)
- [cppreference - std::promise](https://en.cppreference.com/w/cpp/thread/promise)
- [cppreference - std::packaged_task](https://en.cppreference.com/w/cpp/thread/packaged_task)

### 经典书籍

- **C++ Concurrency in Action** (Anthony Williams) - 并发编程权威指南
- **Effective Modern C++** (Scott Meyers) - Item 35-39 涵盖并发
- **The C++ Standard Library** (Nicolai Josuttis) - 标准库详解

### 优质文章

- [Futures and Promises in C++](https://modernescpp.com/index.php/std-future-and-std-promise)
- [Understanding std::async](https://stackoverflow.com/questions/12620186/std-async-vs-std-threads)
- [C++ Threading: async vs future](https://www.learncpp.com/cpp-tutorial/async-tasks-and-futures/)

### 进阶主题

- C++20 协程（Coroutines）
- C++23 std::execution（执行器和发送器）
- 无锁数据结构
- Actor 模型

### 相关库

- **Intel TBB** - 高性能并行算法库
- **HPX** - 高性能计算运行时
- **cppcoro** - C++20 协程库
- **Boost.Asio** - 异步 I/O 库
