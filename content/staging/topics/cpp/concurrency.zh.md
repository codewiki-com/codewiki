---
title: C++ 并发编程
description: 深入理解 C++ 并发：线程、互斥锁、条件变量与原子操作
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - 并发
  - 线程
  - 原子操作
status: imported
origin: old/src/content/docs/cpp/concurrency.zh.md
divergence: 0.089
issues: []
legacy:
  category: Cpp
  subcategory: 并发
  order: 7
  lastUpdated: 2026-01-07
---

C++ 并发编程是现代 C++ 开发中的核心技能。从 C++11 开始，标准库提供了完整的并发支持，使得多线程编程更加安全和易用。本文将深入探讨 C++ 并发的各个方面。

## 线程基础

### 创建和管理线程

`std::thread` 是 C++ 标准库中用于创建和管理线程的基本类。

```cpp
#include <iostream>
#include <thread>
#include <chrono>

// 普通函数作为线程入口
void threadFunction(int id) {
    std::cout << "线程 " << id << " 开始执行\n";
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "线程 " << id << " 执行完毕\n";
}

int main() {
    // 创建线程
    std::thread t1(threadFunction, 1);
    std::thread t2(threadFunction, 2);

    // 使用 lambda 表达式
    std::thread t3([](int id) {
        std::cout << "Lambda 线程 " << id << " 运行中\n";
    }, 3);

    // 等待线程完成
    t1.join();
    t2.join();
    t3.join();

    std::cout << "所有线程已完成\n";
    return 0;
}
```

### 线程的生命周期管理

```cpp
#include <iostream>
#include <thread>
#include <vector>

class ThreadManager {
private:
    std::vector<std::thread> threads;

public:
    void addThread(std::thread&& t) {
        threads.push_back(std::move(t));
    }

    void joinAll() {
        for (auto& t : threads) {
            if (t.joinable()) {
                t.join();
            }
        }
    }

    ~ThreadManager() {
        joinAll();
    }
};

int main() {
    ThreadManager manager;

    for (int i = 0; i < 5; ++i) {
        manager.addThread(std::thread([i]() {
            std::cout << "工作线程 " << i << " 执行中\n";
        }));
    }

    // manager 析构时自动 join 所有线程
    return 0;
}
```

### 线程分离 (detach)

```cpp
#include <iostream>
#include <thread>
#include <chrono>

void backgroundTask() {
    for (int i = 0; i < 5; ++i) {
        std::cout << "后台任务运行中... " << i << "\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
}

int main() {
    std::thread t(backgroundTask);

    // 分离线程，使其在后台独立运行
    t.detach();

    std::cout << "主线程继续执行\n";
    std::this_thread::sleep_for(std::chrono::seconds(3));

    // 注意：分离的线程可能在主线程结束后仍在运行
    return 0;
}
```

## 互斥锁系列

### std::mutex - 基本互斥锁

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>

std::mutex mtx;
int counter = 0;

void incrementCounter(int times) {
    for (int i = 0; i < times; ++i) {
        mtx.lock();
        ++counter;
        mtx.unlock();
    }
}

int main() {
    std::vector<std::thread> threads;

    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(incrementCounter, 1000);
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "最终计数: " << counter << "\n";
    return 0;
}
```

### std::lock_guard - RAII 风格锁管理

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>

class BankAccount {
private:
    double balance;
    mutable std::mutex mtx;  // mutable 允许在 const 方法中使用

public:
    BankAccount(double initial) : balance(initial) {}

    void deposit(double amount) {
        std::lock_guard<std::mutex> lock(mtx);
        balance += amount;
        std::cout << "存入 " << amount << "，余额: " << balance << "\n";
    }

    bool withdraw(double amount) {
        std::lock_guard<std::mutex> lock(mtx);
        if (balance >= amount) {
            balance -= amount;
            std::cout << "取出 " << amount << "，余额: " << balance << "\n";
            return true;
        }
        return false;
    }

    double getBalance() const {
        std::lock_guard<std::mutex> lock(mtx);
        return balance;
    }
};

int main() {
    BankAccount account(1000.0);

    std::thread t1([&]() {
        for (int i = 0; i < 5; ++i) {
            account.deposit(100);
        }
    });

    std::thread t2([&]() {
        for (int i = 0; i < 5; ++i) {
            account.withdraw(50);
        }
    });

    t1.join();
    t2.join();

    std::cout << "最终余额: " << account.getBalance() << "\n";
    return 0;
}
```

### std::unique_lock - 灵活的锁管理

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <chrono>

std::mutex mtx;

void flexibleLocking(int id) {
    std::unique_lock<std::mutex> lock(mtx, std::defer_lock);

    // 执行一些不需要锁的工作
    std::cout << "线程 " << id << " 准备中...\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // 现在获取锁
    lock.lock();
    std::cout << "线程 " << id << " 已获取锁\n";

    // 临时释放锁
    lock.unlock();
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    // 重新获取锁
    lock.lock();
    std::cout << "线程 " << id << " 重新获取锁\n";

    // lock 析构时自动释放
}

int main() {
    std::thread t1(flexibleLocking, 1);
    std::thread t2(flexibleLocking, 2);

    t1.join();
    t2.join();

    return 0;
}
```

### std::shared_mutex - 读写锁 (C++17)

```cpp
#include <iostream>
#include <thread>
#include <shared_mutex>
#include <vector>
#include <chrono>

class ThreadSafeCounter {
private:
    mutable std::shared_mutex mtx;
    int value = 0;

public:
    // 写操作使用独占锁
    void increment() {
        std::unique_lock<std::shared_mutex> lock(mtx);
        ++value;
        std::cout << "写入: " << value << "\n";
    }

    // 读操作使用共享锁
    int get() const {
        std::shared_lock<std::shared_mutex> lock(mtx);
        return value;
    }

    // 多个读操作可以同时进行
    void read(int id) const {
        std::shared_lock<std::shared_mutex> lock(mtx);
        std::cout << "读取者 " << id << " 读到: " << value << "\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
};

int main() {
    ThreadSafeCounter counter;

    // 创建写线程
    std::thread writer([&]() {
        for (int i = 0; i < 5; ++i) {
            counter.increment();
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
        }
    });

    // 创建多个读线程
    std::vector<std::thread> readers;
    for (int i = 0; i < 3; ++i) {
        readers.emplace_back([&, i]() {
            for (int j = 0; j < 5; ++j) {
                counter.read(i);
            }
        });
    }

    writer.join();
    for (auto& t : readers) {
        t.join();
    }

    return 0;
}
```

### std::recursive_mutex - 递归互斥锁

```cpp
#include <iostream>
#include <thread>
#include <mutex>

class RecursiveExample {
private:
    std::recursive_mutex mtx;
    int data = 0;

public:
    void increment() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        ++data;
    }

    void incrementBy(int n) {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        for (int i = 0; i < n; ++i) {
            increment();  // 递归获取同一个锁
        }
    }

    int getValue() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        return data;
    }
};

int main() {
    RecursiveExample example;

    std::thread t1([&]() { example.incrementBy(5); });
    std::thread t2([&]() { example.incrementBy(3); });

    t1.join();
    t2.join();

    std::cout << "最终值: " << example.getValue() << "\n";
    return 0;
}
```

## 条件变量

### 基本使用

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>

std::mutex mtx;
std::condition_variable cv;
std::queue<int> dataQueue;
bool finished = false;

void producer(int count) {
    for (int i = 0; i < count; ++i) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));

        {
            std::lock_guard<std::mutex> lock(mtx);
            dataQueue.push(i);
            std::cout << "生产: " << i << "\n";
        }

        cv.notify_one();  // 通知一个等待的消费者
    }

    {
        std::lock_guard<std::mutex> lock(mtx);
        finished = true;
    }
    cv.notify_all();  // 通知所有等待的消费者
}

void consumer(int id) {
    while (true) {
        std::unique_lock<std::mutex> lock(mtx);

        // 等待数据可用或生产完成
        cv.wait(lock, []() {
            return !dataQueue.empty() || finished;
        });

        if (!dataQueue.empty()) {
            int value = dataQueue.front();
            dataQueue.pop();
            lock.unlock();

            std::cout << "消费者 " << id << " 消费: " << value << "\n";
        } else if (finished) {
            break;
        }
    }
}

int main() {
    std::thread prod(producer, 10);
    std::thread cons1(consumer, 1);
    std::thread cons2(consumer, 2);

    prod.join();
    cons1.join();
    cons2.join();

    return 0;
}
```

### 线程安全队列实现

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
    mutable std::mutex mtx;
    std::condition_variable cv;
    std::queue<T> queue;
    bool closed = false;

public:
    void push(T value) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            if (closed) {
                throw std::runtime_error("队列已关闭");
            }
            queue.push(std::move(value));
        }
        cv.notify_one();
    }

    bool pop(T& value) {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [this]() {
            return !queue.empty() || closed;
        });

        if (queue.empty()) {
            return false;  // 队列已关闭且为空
        }

        value = std::move(queue.front());
        queue.pop();
        return true;
    }

    bool tryPop(T& value, std::chrono::milliseconds timeout) {
        std::unique_lock<std::mutex> lock(mtx);

        if (!cv.wait_for(lock, timeout, [this]() {
            return !queue.empty() || closed;
        })) {
            return false;  // 超时
        }

        if (queue.empty()) {
            return false;  // 队列已关闭
        }

        value = std::move(queue.front());
        queue.pop();
        return true;
    }

    void close() {
        {
            std::lock_guard<std::mutex> lock(mtx);
            closed = true;
        }
        cv.notify_all();
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mtx);
        return queue.size();
    }
};

int main() {
    ThreadSafeQueue<int> queue;

    std::thread producer([&]() {
        for (int i = 0; i < 20; ++i) {
            queue.push(i);
            std::cout << "推入: " << i << "\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
        queue.close();
    });

    std::thread consumer([&]() {
        int value;
        while (queue.pop(value)) {
            std::cout << "弹出: " << value << "\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    });

    producer.join();
    consumer.join();

    return 0;
}
```

## 原子操作

### std::atomic 基础

```cpp
#include <iostream>
#include <thread>
#include <atomic>
#include <vector>

std::atomic<int> atomicCounter(0);
int normalCounter = 0;

void incrementAtomic(int times) {
    for (int i = 0; i < times; ++i) {
        atomicCounter.fetch_add(1, std::memory_order_relaxed);
    }
}

void incrementNormal(int times) {
    for (int i = 0; i < times; ++i) {
        ++normalCounter;  // 非线程安全
    }
}

int main() {
    const int numThreads = 10;
    const int increments = 10000;

    // 测试原子操作
    {
        std::vector<std::thread> threads;
        for (int i = 0; i < numThreads; ++i) {
            threads.emplace_back(incrementAtomic, increments);
        }
        for (auto& t : threads) {
            t.join();
        }
        std::cout << "原子计数器 (正确): " << atomicCounter << "\n";
    }

    // 测试非原子操作
    {
        std::vector<std::thread> threads;
        for (int i = 0; i < numThreads; ++i) {
            threads.emplace_back(incrementNormal, increments);
        }
        for (auto& t : threads) {
            t.join();
        }
        std::cout << "普通计数器 (可能错误): " << normalCounter << "\n";
    }

    return 0;
}
```

### 内存序 (Memory Order)

```cpp
#include <iostream>
#include <thread>
#include <atomic>

std::atomic<bool> ready(false);
std::atomic<int> data(0);

// Relaxed 顺序 - 最弱的保证
void relaxedExample() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_relaxed);
}

// Release-Acquire 顺序
void releaseAcquireExample() {
    // 生产者线程
    std::thread producer([]() {
        data.store(42, std::memory_order_relaxed);
        ready.store(true, std::memory_order_release);  // 释放操作
    });

    // 消费者线程
    std::thread consumer([]() {
        while (!ready.load(std::memory_order_acquire)) {  // 获取操作
            // 等待
        }
        std::cout << "数据: " << data.load(std::memory_order_relaxed) << "\n";
    });

    producer.join();
    consumer.join();
}

// Sequential consistency - 最强的保证（默认）
std::atomic<int> x(0), y(0);
std::atomic<int> z(0);

void seqCstExample() {
    std::thread t1([]() {
        x.store(1);  // 默认 memory_order_seq_cst
    });

    std::thread t2([]() {
        y.store(1);
    });

    std::thread t3([]() {
        while (!x.load());
        if (y.load()) {
            ++z;
        }
    });

    std::thread t4([]() {
        while (!y.load());
        if (x.load()) {
            ++z;
        }
    });

    t1.join(); t2.join(); t3.join(); t4.join();
    std::cout << "Z = " << z << "\n";  // 保证至少为 1
}

int main() {
    releaseAcquireExample();
    seqCstExample();
    return 0;
}
```

### 原子操作的高级用法

```cpp
#include <iostream>
#include <thread>
#include <atomic>
#include <vector>

class SpinLock {
private:
    std::atomic_flag flag = ATOMIC_FLAG_INIT;

public:
    void lock() {
        while (flag.test_and_set(std::memory_order_acquire)) {
            // 自旋等待
        }
    }

    void unlock() {
        flag.clear(std::memory_order_release);
    }
};

// 无锁栈实现（简化版）
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

        while (!head.compare_exchange_weak(
            newNode->next,
            newNode,
            std::memory_order_release,
            std::memory_order_relaxed
        )) {
            // CAS 失败，重试
        }
    }

    bool pop(T& result) {
        Node* oldHead = head.load(std::memory_order_relaxed);

        while (oldHead && !head.compare_exchange_weak(
            oldHead,
            oldHead->next,
            std::memory_order_acquire,
            std::memory_order_relaxed
        )) {
            // CAS 失败，重试
        }

        if (oldHead) {
            result = oldHead->data;
            delete oldHead;
            return true;
        }

        return false;
    }

    ~LockFreeStack() {
        T dummy;
        while (pop(dummy)) {}
    }
};

int main() {
    // 测试自旋锁
    SpinLock spinLock;
    int counter = 0;

    std::vector<std::thread> threads;
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&]() {
            for (int j = 0; j < 1000; ++j) {
                spinLock.lock();
                ++counter;
                spinLock.unlock();
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "自旋锁计数器: " << counter << "\n";

    // 测试无锁栈
    LockFreeStack<int> stack;

    std::thread pusher([&]() {
        for (int i = 0; i < 100; ++i) {
            stack.push(i);
        }
    });

    std::thread popper([&]() {
        int value;
        int count = 0;
        while (count < 100) {
            if (stack.pop(value)) {
                ++count;
            }
        }
        std::cout << "弹出了 " << count << " 个元素\n";
    });

    pusher.join();
    popper.join();

    return 0;
}
```

## 异步编程

### std::async - 异步任务

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <thread>

// 计算密集型任务
int compute(int n) {
    std::cout << "开始计算... (线程ID: "
              << std::this_thread::get_id() << ")\n";
    std::this_thread::sleep_for(std::chrono::seconds(2));
    return n * n;
}

int main() {
    std::cout << "主线程ID: " << std::this_thread::get_id() << "\n";

    // std::launch::async - 强制在新线程中执行
    auto future1 = std::async(std::launch::async, compute, 10);

    // std::launch::deferred - 延迟执行（调用 get/wait 时）
    auto future2 = std::async(std::launch::deferred, compute, 20);

    // 默认策略 - 由实现决定
    auto future3 = std::async(compute, 30);

    std::cout << "异步任务已启动，主线程继续工作...\n";

    // 获取结果（会阻塞直到完成）
    std::cout << "结果1: " << future1.get() << "\n";
    std::cout << "结果2: " << future2.get() << "\n";
    std::cout << "结果3: " << future3.get() << "\n";

    return 0;
}
```

### std::promise 和 std::future

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <chrono>

void asyncTask(std::promise<int>&& promise, int value) {
    try {
        std::cout << "异步任务开始处理...\n";
        std::this_thread::sleep_for(std::chrono::seconds(2));

        if (value < 0) {
            throw std::runtime_error("负数输入");
        }

        int result = value * 2;
        promise.set_value(result);  // 设置结果

    } catch (...) {
        promise.set_exception(std::current_exception());  // 传递异常
    }
}

int main() {
    // 创建 promise
    std::promise<int> promise;

    // 获取与 promise 关联的 future
    std::future<int> future = promise.get_future();

    // 在新线程中运行任务
    std::thread t(asyncTask, std::move(promise), 42);

    std::cout << "等待结果...\n";

    try {
        // 获取结果
        int result = future.get();
        std::cout << "结果: " << result << "\n";
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << "\n";
    }

    t.join();
    return 0;
}
```

### std::packaged_task - 打包任务

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <queue>
#include <functional>

class TaskQueue {
private:
    std::queue<std::function<void()>> tasks;
    std::mutex mtx;
    std::condition_variable cv;
    bool stop = false;

public:
    template<typename Func>
    auto submit(Func&& func) -> std::future<decltype(func())> {
        using ReturnType = decltype(func());

        auto task = std::make_shared<std::packaged_task<ReturnType()>>(
            std::forward<Func>(func)
        );

        std::future<ReturnType> result = task->get_future();

        {
            std::lock_guard<std::mutex> lock(mtx);
            tasks.emplace([task]() { (*task)(); });
        }

        cv.notify_one();
        return result;
    }

    void worker() {
        while (true) {
            std::function<void()> task;

            {
                std::unique_lock<std::mutex> lock(mtx);
                cv.wait(lock, [this]() {
                    return stop || !tasks.empty();
                });

                if (stop && tasks.empty()) {
                    return;
                }

                task = std::move(tasks.front());
                tasks.pop();
            }

            task();
        }
    }

    void shutdown() {
        {
            std::lock_guard<std::mutex> lock(mtx);
            stop = true;
        }
        cv.notify_all();
    }
};

int main() {
    TaskQueue queue;

    // 启动工作线程
    std::thread worker(&TaskQueue::worker, &queue);

    // 提交任务
    auto future1 = queue.submit([]() {
        std::cout << "任务1执行中...\n";
        std::this_thread::sleep_for(std::chrono::seconds(1));
        return 42;
    });

    auto future2 = queue.submit([]() {
        std::cout << "任务2执行中...\n";
        return std::string("Hello, Future!");
    });

    // 获取结果
    std::cout << "任务1结果: " << future1.get() << "\n";
    std::cout << "任务2结果: " << future2.get() << "\n";

    queue.shutdown();
    worker.join();

    return 0;
}
```

### std::shared_future - 共享的 future

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <vector>

int main() {
    std::promise<int> promise;
    std::shared_future<int> sharedFuture = promise.get_future().share();

    // 多个线程可以等待同一个 shared_future
    std::vector<std::thread> threads;

    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([sharedFuture, i]() {
            int result = sharedFuture.get();
            std::cout << "线程 " << i << " 获取到结果: " << result << "\n";
        });
    }

    std::cout << "设置值...\n";
    std::this_thread::sleep_for(std::chrono::seconds(1));
    promise.set_value(100);

    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

## 协程

C++20 引入了协程支持，提供了更优雅的异步编程方式。

### 基本协程概念

```cpp
#include <iostream>
#include <coroutine>
#include <exception>

// 简单的生成器协程
template<typename T>
class Generator {
public:
    struct promise_type {
        T current_value;

        Generator get_return_object() {
            return Generator{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        std::suspend_always yield_value(T value) {
            current_value = value;
            return {};
        }

        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle;

    Generator(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Generator() { if (handle) handle.destroy(); }

    // 禁止拷贝
    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;

    // 允许移动
    Generator(Generator&& other) : handle(other.handle) {
        other.handle = nullptr;
    }

    bool next() {
        handle.resume();
        return !handle.done();
    }

    T value() {
        return handle.promise().current_value;
    }
};

// 协程函数：生成斐波那契数列
Generator<int> fibonacci(int max) {
    int a = 0, b = 1;

    for (int i = 0; i < max; ++i) {
        co_yield a;  // 挂起并返回值

        int next = a + b;
        a = b;
        b = next;
    }
}

int main() {
    auto gen = fibonacci(10);

    std::cout << "斐波那契数列: ";
    while (gen.next()) {
        std::cout << gen.value() << " ";
    }
    std::cout << "\n";

    return 0;
}
```

### 异步协程任务

```cpp
#include <iostream>
#include <coroutine>
#include <chrono>
#include <thread>
#include <future>

// 简单的异步任务类型
template<typename T>
class Task {
public:
    struct promise_type {
        T value;
        std::exception_ptr exception;

        Task get_return_object() {
            return Task{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        void return_value(T v) {
            value = v;
        }

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    std::coroutine_handle<promise_type> handle;

    Task(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Task() { if (handle) handle.destroy(); }

    Task(Task&& other) : handle(other.handle) {
        other.handle = nullptr;
    }

    T get() {
        if (!handle.done()) {
            handle.resume();
        }

        if (handle.promise().exception) {
            std::rethrow_exception(handle.promise().exception);
        }

        return handle.promise().value;
    }
};

// Awaiter 类型用于 co_await
struct SleepAwaiter {
    std::chrono::milliseconds duration;

    bool await_ready() { return false; }

    void await_suspend(std::coroutine_handle<> handle) {
        std::thread([handle, this]() {
            std::this_thread::sleep_for(duration);
            handle.resume();
        }).detach();
    }

    void await_resume() {}
};

// 异步睡眠函数
SleepAwaiter async_sleep(std::chrono::milliseconds duration) {
    return SleepAwaiter{duration};
}

// 使用协程的异步函数
Task<int> asyncCompute(int x) {
    std::cout << "开始计算 " << x << "\n";

    co_await async_sleep(std::chrono::milliseconds(1000));

    std::cout << "计算完成 " << x << "\n";
    co_return x * x;
}

int main() {
    std::cout << "启动异步计算...\n";

    auto task1 = asyncCompute(5);
    auto task2 = asyncCompute(10);

    std::cout << "主线程继续工作...\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(500));

    std::cout << "等待结果...\n";

    int result1 = task1.get();
    int result2 = task2.get();

    std::cout << "结果: " << result1 << ", " << result2 << "\n";

    return 0;
}
```

### 协程生成器示例

```cpp
#include <iostream>
#include <coroutine>
#include <vector>
#include <string>

template<typename T>
class Generator {
public:
    struct promise_type {
        T current_value;
        std::exception_ptr exception;

        Generator get_return_object() {
            return Generator{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        std::suspend_always yield_value(T value) {
            current_value = std::move(value);
            return {};
        }

        void return_void() {}

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    struct iterator {
        std::coroutine_handle<promise_type> handle;
        bool done;

        iterator(std::coroutine_handle<promise_type> h, bool d)
            : handle(h), done(d) {}

        iterator& operator++() {
            handle.resume();
            done = handle.done();
            return *this;
        }

        T& operator*() const {
            return handle.promise().current_value;
        }

        bool operator==(const iterator& other) const {
            return done == other.done;
        }

        bool operator!=(const iterator& other) const {
            return !(*this == other);
        }
    };

    std::coroutine_handle<promise_type> handle;

    Generator(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Generator() { if (handle) handle.destroy(); }

    Generator(Generator&& other) : handle(other.handle) {
        other.handle = nullptr;
    }

    iterator begin() {
        handle.resume();
        return iterator{handle, handle.done()};
    }

    iterator end() {
        return iterator{handle, true};
    }
};

// 生成范围内的数字
Generator<int> range(int start, int end, int step = 1) {
    for (int i = start; i < end; i += step) {
        co_yield i;
    }
}

// 过滤器协程
template<typename T, typename Pred>
Generator<T> filter(Generator<T>&& gen, Pred pred) {
    for (auto&& value : gen) {
        if (pred(value)) {
            co_yield value;
        }
    }
}

// 映射协程
template<typename T, typename Func>
auto map(Generator<T>&& gen, Func func)
    -> Generator<decltype(func(std::declval<T>()))> {
    for (auto&& value : gen) {
        co_yield func(value);
    }
}

int main() {
    std::cout << "简单范围: ";
    for (auto i : range(0, 10, 2)) {
        std::cout << i << " ";
    }
    std::cout << "\n";

    std::cout << "过滤的数字 (偶数): ";
    auto filtered = filter(range(0, 20), [](int x) { return x % 2 == 0; });
    for (auto i : filtered) {
        std::cout << i << " ";
    }
    std::cout << "\n";

    std::cout << "映射的数字 (平方): ";
    auto mapped = map(range(1, 6), [](int x) { return x * x; });
    for (auto i : mapped) {
        std::cout << i << " ";
    }
    std::cout << "\n";

    return 0;
}
```

## 最佳实践

### 线程池实现

```cpp
#include <iostream>
#include <thread>
#include <vector>
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <future>
#include <memory>

class ThreadPool {
private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;

    std::mutex queueMutex;
    std::condition_variable condition;
    bool stop;

public:
    ThreadPool(size_t threads) : stop(false) {
        for (size_t i = 0; i < threads; ++i) {
            workers.emplace_back([this] {
                while (true) {
                    std::function<void()> task;

                    {
                        std::unique_lock<std::mutex> lock(this->queueMutex);
                        this->condition.wait(lock, [this] {
                            return this->stop || !this->tasks.empty();
                        });

                        if (this->stop && this->tasks.empty()) {
                            return;
                        }

                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }

                    task();
                }
            });
        }
    }

    template<typename F, typename... Args>
    auto enqueue(F&& f, Args&&... args)
        -> std::future<typename std::invoke_result_t<F, Args...>> {

        using return_type = typename std::invoke_result_t<F, Args...>;

        auto task = std::make_shared<std::packaged_task<return_type()>>(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );

        std::future<return_type> res = task->get_future();

        {
            std::unique_lock<std::mutex> lock(queueMutex);

            if (stop) {
                throw std::runtime_error("线程池已停止");
            }

            tasks.emplace([task]() { (*task)(); });
        }

        condition.notify_one();
        return res;
    }

    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            stop = true;
        }

        condition.notify_all();

        for (std::thread& worker : workers) {
            worker.join();
        }
    }
};

int main() {
    ThreadPool pool(4);
    std::vector<std::future<int>> results;

    for (int i = 0; i < 8; ++i) {
        results.emplace_back(
            pool.enqueue([i] {
                std::cout << "任务 " << i << " 在线程 "
                          << std::this_thread::get_id() << " 执行\n";
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
                return i * i;
            })
        );
    }

    for (auto&& result : results) {
        std::cout << "结果: " << result.get() << "\n";
    }

    return 0;
}
```

### 避免死锁

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <chrono>

std::mutex mtx1, mtx2;

// 错误示例：可能导致死锁
void badLocking1() {
    std::lock_guard<std::mutex> lock1(mtx1);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::lock_guard<std::mutex> lock2(mtx2);
    std::cout << "badLocking1 执行\n";
}

void badLocking2() {
    std::lock_guard<std::mutex> lock2(mtx2);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::lock_guard<std::mutex> lock1(mtx1);
    std::cout << "badLocking2 执行\n";
}

// 正确示例1：使用 std::lock 同时锁定多个互斥锁
void goodLocking1() {
    std::unique_lock<std::mutex> lock1(mtx1, std::defer_lock);
    std::unique_lock<std::mutex> lock2(mtx2, std::defer_lock);

    std::lock(lock1, lock2);  // 原子地锁定两个互斥锁

    std::cout << "goodLocking1 执行\n";
}

void goodLocking2() {
    std::unique_lock<std::mutex> lock1(mtx1, std::defer_lock);
    std::unique_lock<std::mutex> lock2(mtx2, std::defer_lock);

    std::lock(lock1, lock2);

    std::cout << "goodLocking2 执行\n";
}

// 正确示例2：使用 std::scoped_lock (C++17)
void bestLocking() {
    std::scoped_lock lock(mtx1, mtx2);  // 自动避免死锁
    std::cout << "bestLocking 执行\n";
}

int main() {
    std::cout << "使用安全的锁定方式:\n";

    std::thread t1(goodLocking1);
    std::thread t2(goodLocking2);

    t1.join();
    t2.join();

    std::thread t3(bestLocking);
    t3.join();

    return 0;
}
```

### 资源管理和RAII

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <memory>

// RAII 风格的线程管理
class ThreadGuard {
private:
    std::thread& t;

public:
    explicit ThreadGuard(std::thread& thread) : t(thread) {}

    ~ThreadGuard() {
        if (t.joinable()) {
            t.join();
        }
    }

    ThreadGuard(const ThreadGuard&) = delete;
    ThreadGuard& operator=(const ThreadGuard&) = delete;
};

// 作用域线程（自动 join）
class ScopedThread {
private:
    std::thread t;

public:
    explicit ScopedThread(std::thread thread) : t(std::move(thread)) {
        if (!t.joinable()) {
            throw std::logic_error("没有线程");
        }
    }

    ~ScopedThread() {
        t.join();
    }

    ScopedThread(const ScopedThread&) = delete;
    ScopedThread& operator=(const ScopedThread&) = delete;
};

void doWork(int id) {
    std::cout << "工作线程 " << id << " 执行中\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
}

int main() {
    // 使用 ScopedThread 自动管理线程生命周期
    {
        ScopedThread t1(std::thread(doWork, 1));
        ScopedThread t2(std::thread(doWork, 2));

        std::cout << "作用域内工作...\n";

        // 离开作用域时自动 join
    }

    std::cout << "所有线程已完成\n";

    return 0;
}
```

### 并发性能优化技巧

```cpp
#include <iostream>
#include <thread>
#include <vector>
#include <atomic>
#include <chrono>

// 使用缓存行填充避免伪共享
struct alignas(64) AlignedCounter {
    std::atomic<int> value{0};
};

// 错误示例：伪共享
struct BadCounters {
    std::atomic<int> counter1{0};
    std::atomic<int> counter2{0};
};

// 正确示例：避免伪共享
struct GoodCounters {
    alignas(64) std::atomic<int> counter1{0};
    alignas(64) std::atomic<int> counter2{0};
};

void benchmarkFalseSharing() {
    const int iterations = 10000000;

    // 测试伪共享
    {
        BadCounters bad;
        auto start = std::chrono::high_resolution_clock::now();

        std::thread t1([&]() {
            for (int i = 0; i < iterations; ++i) {
                bad.counter1.fetch_add(1, std::memory_order_relaxed);
            }
        });

        std::thread t2([&]() {
            for (int i = 0; i < iterations; ++i) {
                bad.counter2.fetch_add(1, std::memory_order_relaxed);
            }
        });

        t1.join();
        t2.join();

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

        std::cout << "伪共享耗时: " << duration.count() << " ms\n";
    }

    // 测试避免伪共享
    {
        GoodCounters good;
        auto start = std::chrono::high_resolution_clock::now();

        std::thread t1([&]() {
            for (int i = 0; i < iterations; ++i) {
                good.counter1.fetch_add(1, std::memory_order_relaxed);
            }
        });

        std::thread t2([&]() {
            for (int i = 0; i < iterations; ++i) {
                good.counter2.fetch_add(1, std::memory_order_relaxed);
            }
        });

        t1.join();
        t2.join();

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

        std::cout << "优化后耗时: " << duration.count() << " ms\n";
    }
}

int main() {
    benchmarkFalseSharing();
    return 0;
}
```

## 总结

C++ 并发编程提供了丰富的工具和机制：

1. **std::thread** - 基本线程管理
2. **互斥锁系列** - 保护共享资源（mutex, lock_guard, unique_lock, shared_mutex）
3. **条件变量** - 线程间同步和通信
4. **原子操作** - 无锁编程和细粒度控制
5. **future/promise** - 异步任务和结果传递
6. **协程** - 现代异步编程范式

### 关键要点

- 优先使用高级抽象（如 std::async）而非手动管理线程
- 使用 RAII 管理锁（lock_guard, unique_lock）
- 避免死锁：统一锁顺序或使用 std::lock/scoped_lock
- 选择合适的同步机制：互斥锁用于独占访问，原子操作用于简单计数器
- 注意内存序和缓存一致性（伪共享）
- C++20 协程提供了更优雅的异步编程方式

并发编程需要仔细设计和测试，始终注意数据竞争和死锁问题。
