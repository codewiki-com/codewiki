---
title: C++20 协程
description: 掌握 C++20 协程，包括 co_await、co_yield、co_return 和协程实现
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - 协程
  - C++20
  - 异步
status: imported
origin: old/src/content/docs/cpp/coroutines.zh.md
divergence: 0.231
issues: []
legacy:
  category: Cpp
  subcategory: C++20
  order: 18
  lastUpdated: 2026-01-07
---

协程是 C++20 引入的四大核心特性之一，它提供了一种优雅的方式来编写异步代码、生成器和状态机。与传统的回调或线程相比，协程使异步代码的编写和理解更加直观。

---

## 协程基础概念

### 什么是协程？

协程（Coroutine）是一种可以暂停执行并在稍后恢复的函数。与普通函数不同，协程可以在执行过程中保存其状态，让出控制权，然后在适当的时候从暂停点继续执行。

```
普通函数：    调用 ──────────────> 返回
             （一次执行到底）

协程：        调用 ──> 暂停 ──> 恢复 ──> 暂停 ──> 恢复 ──> 完成
             （可以多次暂停和恢复）
```

### C++20 协程的特点

C++20 的协程是**无栈协程**（Stackless Coroutine），这意味着：

1. **状态存储在堆上**：协程的局部变量存储在堆分配的协程帧中
2. **编译器转换**：编译器将协程转换为状态机
3. **零开销抽象**：只为使用的功能付出代价
4. **高度可定制**：通过 promise_type 自定义协程行为

### 协程 vs 线程

```cpp
// 线程方式
void thread_example() {
    std::thread t([]() {
        // 占用独立的栈空间（通常几MB）
        // 上下文切换开销大
        heavy_computation();
    });
    t.join();
}

// 协程方式
Task<int> coroutine_example() {
    // 协程帧通常只有几十到几百字节
    // 暂停和恢复开销极小
    co_await some_async_operation();
    co_return 42;
}
```

| 特性 | 线程 | 协程 |
|------|------|------|
| 内存开销 | 大（几MB栈空间） | 小（几十到几百字节） |
| 切换开销 | 高（内核态切换） | 低（用户态切换） |
| 调度 | OS调度 | 用户控制 |
| 并发模型 | 抢占式 | 协作式 |

---

## 三个关键字

C++20 引入了三个新的关键字来标识和控制协程：

### co_await：等待异步操作

`co_await` 用于暂停协程，等待某个操作完成。

```cpp
#include <coroutine>
#include <iostream>
#include <thread>
#include <chrono>

// 前向声明
struct Task;

// 简单的 awaitable 类型
struct SleepAwaiter {
    std::chrono::milliseconds duration;

    // 是否需要暂停？返回 false 表示需要暂停
    bool await_ready() const noexcept {
        return duration.count() <= 0;
    }

    // 暂停时执行的操作
    void await_suspend(std::coroutine_handle<> handle) const {
        std::thread([handle, d = duration]() {
            std::this_thread::sleep_for(d);
            handle.resume();  // 睡眠结束后恢复协程
        }).detach();
    }

    // 恢复后返回的值
    void await_resume() const noexcept {}
};

// 异步睡眠函数
SleepAwaiter async_sleep(std::chrono::milliseconds ms) {
    return SleepAwaiter{ms};
}

// 使用 co_await 的协程
Task fetch_data() {
    std::cout << "开始获取数据...\n";

    co_await async_sleep(std::chrono::milliseconds(1000));

    std::cout << "数据获取完成!\n";
}
```

### co_yield：产生值并暂停

`co_yield` 用于生成器模式，产生一个值后暂停协程。

```cpp
#include <coroutine>
#include <iostream>

// 生成器类型（简化版）
template<typename T>
struct Generator {
    struct promise_type;
    using handle_type = std::coroutine_handle<promise_type>;

    struct promise_type {
        T current_value;

        Generator get_return_object() {
            return Generator{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        // co_yield 调用此函数
        std::suspend_always yield_value(T value) {
            current_value = std::move(value);
            return {};
        }

        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    handle_type handle;

    Generator(handle_type h) : handle(h) {}
    ~Generator() { if (handle) handle.destroy(); }

    // 移动语义
    Generator(Generator&& other) noexcept : handle(other.handle) {
        other.handle = nullptr;
    }

    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;
};

// 使用 co_yield 的生成器
Generator<int> count_up_to(int n) {
    for (int i = 1; i <= n; ++i) {
        co_yield i;  // 产生值并暂停
    }
}

int main() {
    auto gen = count_up_to(5);

    while (gen.handle && !gen.handle.done()) {
        gen.handle.resume();
        if (!gen.handle.done()) {
            std::cout << gen.handle.promise().current_value << " ";
        }
    }
    // 输出: 1 2 3 4 5

    return 0;
}
```

### co_return：结束协程并返回值

`co_return` 用于结束协程，可以选择性地返回一个值。

```cpp
#include <coroutine>
#include <iostream>
#include <optional>

template<typename T>
struct Task {
    struct promise_type {
        std::optional<T> result;
        std::exception_ptr exception;

        Task get_return_object() {
            return Task{std::coroutine_handle<promise_type>::from_promise(*this)};
        }

        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        // co_return value 调用此函数
        void return_value(T value) {
            result = std::move(value);
        }

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    std::coroutine_handle<promise_type> handle;

    Task(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Task() { if (handle) handle.destroy(); }

    T get() {
        if (handle.promise().exception) {
            std::rethrow_exception(handle.promise().exception);
        }
        return *handle.promise().result;
    }
};

// 使用 co_return 的协程
Task<int> calculate_sum(int a, int b) {
    int result = a + b;
    co_return result;  // 返回结果并结束协程
}

Task<std::string> greet(const std::string& name) {
    co_return "Hello, " + name + "!";
}

int main() {
    auto sum_task = calculate_sum(10, 20);
    std::cout << "Sum: " << sum_task.get() << std::endl;  // 输出: Sum: 30

    auto greet_task = greet("World");
    std::cout << greet_task.get() << std::endl;  // 输出: Hello, World!

    return 0;
}
```

### 三个关键字的对比

| 关键字 | 作用 | 对应 promise_type 方法 |
|--------|------|------------------------|
| `co_await expr` | 等待异步操作 | - |
| `co_yield value` | 产生值并暂停 | `yield_value()` |
| `co_return` | 结束协程（无返回值） | `return_void()` |
| `co_return value` | 结束协程并返回值 | `return_value()` |

---

## Promise 类型详解

`promise_type` 是协程的核心，它定义了协程的行为。编译器通过 `promise_type` 中的方法来控制协程的生命周期。

### promise_type 的完整结构

```cpp
#include <coroutine>
#include <exception>
#include <iostream>

template<typename T>
struct MyCoroutine {
    struct promise_type {
        T value;
        std::exception_ptr exception;

        // 1. 创建返回对象
        MyCoroutine get_return_object() {
            std::cout << "get_return_object 被调用\n";
            return MyCoroutine{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        // 2. 协程开始时的行为
        // suspend_always: 创建后暂停，需要手动 resume
        // suspend_never: 创建后立即开始执行
        std::suspend_always initial_suspend() {
            std::cout << "initial_suspend 被调用\n";
            return {};
        }

        // 3. 协程结束时的行为
        // suspend_always: 结束后暂停，需要手动 destroy
        // suspend_never: 结束后自动销毁
        std::suspend_always final_suspend() noexcept {
            std::cout << "final_suspend 被调用\n";
            return {};
        }

        // 4. co_return value 的处理
        void return_value(T v) {
            std::cout << "return_value 被调用\n";
            value = std::move(v);
        }

        // 或者 co_return（无值）的处理
        // void return_void() {
        //     std::cout << "return_void 被调用\n";
        // }

        // 5. co_yield value 的处理
        std::suspend_always yield_value(T v) {
            std::cout << "yield_value 被调用\n";
            value = std::move(v);
            return {};
        }

        // 6. 未捕获异常的处理
        void unhandled_exception() {
            std::cout << "unhandled_exception 被调用\n";
            exception = std::current_exception();
        }

        // 7. 可选：自定义 co_await 行为
        // auto await_transform(SomeType value) {
        //     return CustomAwaiter{value};
        // }

        // 8. 可选：自定义内存分配
        // void* operator new(std::size_t size) {
        //     return custom_allocate(size);
        // }
        // void operator delete(void* ptr) {
        //     custom_deallocate(ptr);
        // }
    };

    std::coroutine_handle<promise_type> handle;

    MyCoroutine(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~MyCoroutine() { if (handle) handle.destroy(); }
};
```

### initial_suspend 和 final_suspend 的选择

```cpp
// 惰性协程：创建后不立即执行
struct LazyPromise {
    auto initial_suspend() { return std::suspend_always{}; }
    auto final_suspend() noexcept { return std::suspend_always{}; }
    // ...
};

// 立即执行协程：创建后立即开始
struct EagerPromise {
    auto initial_suspend() { return std::suspend_never{}; }
    auto final_suspend() noexcept { return std::suspend_always{}; }
    // ...
};

// 自动清理协程：结束后自动销毁
struct AutoCleanupPromise {
    auto initial_suspend() { return std::suspend_never{}; }
    auto final_suspend() noexcept { return std::suspend_never{}; }
    // 注意：这种情况下不能手动 destroy
    // ...
};
```

### await_transform：自定义等待行为

```cpp
#include <coroutine>
#include <iostream>
#include <chrono>

struct ScheduledTask {
    struct promise_type {
        ScheduledTask get_return_object() {
            return ScheduledTask{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }

        // 自定义所有 co_await 表达式的行为
        template<typename T>
        auto await_transform(T&& awaitable) {
            std::cout << "即将等待操作...\n";
            return std::forward<T>(awaitable);
        }

        // 特殊处理某些类型
        auto await_transform(std::chrono::milliseconds duration) {
            struct TimerAwaiter {
                std::chrono::milliseconds duration;
                bool await_ready() { return false; }
                void await_suspend(std::coroutine_handle<> h) {
                    std::cout << "设置 " << duration.count() << "ms 定时器\n";
                    // 模拟定时器
                    std::this_thread::sleep_for(duration);
                    h.resume();
                }
                void await_resume() {}
            };
            return TimerAwaiter{duration};
        }
    };

    std::coroutine_handle<promise_type> handle;

    ScheduledTask(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~ScheduledTask() { if (handle) handle.destroy(); }
};

ScheduledTask scheduled_operation() {
    std::cout << "操作开始\n";
    co_await std::chrono::milliseconds(100);  // 使用 await_transform 转换
    std::cout << "操作完成\n";
}
```

---

## Coroutine Handle

`std::coroutine_handle` 是协程的句柄，用于控制协程的执行。

### 基本操作

```cpp
#include <coroutine>
#include <iostream>

template<typename T>
struct SimpleTask {
    struct promise_type {
        T value;

        SimpleTask get_return_object() {
            return SimpleTask{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_value(T v) { value = v; }
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle;

    SimpleTask(handle_type h) : handle(h) {}
    ~SimpleTask() { if (handle) handle.destroy(); }

    // 演示 coroutine_handle 的各种操作
    void demonstrate_handle_operations() {
        // 检查句柄是否有效
        if (handle) {
            std::cout << "句柄有效\n";
        }

        // 检查协程是否已完成
        if (handle.done()) {
            std::cout << "协程已完成\n";
        } else {
            std::cout << "协程未完成\n";
        }

        // 恢复协程执行
        if (!handle.done()) {
            handle.resume();
            // 等价于：
            // handle();
        }

        // 访问 promise 对象
        auto& promise = handle.promise();
        std::cout << "Promise 中的值: " << promise.value << "\n";

        // 获取协程帧的地址
        void* address = handle.address();
        std::cout << "协程帧地址: " << address << "\n";

        // 从地址重建句柄
        auto reconstructed = handle_type::from_address(address);
        std::cout << "重建的句柄是否相同: "
                  << (reconstructed == handle) << "\n";

        // 销毁协程（释放协程帧）
        // handle.destroy();  // 析构函数会处理
    }
};

SimpleTask<int> example_coroutine() {
    co_return 42;
}

int main() {
    auto task = example_coroutine();
    task.demonstrate_handle_operations();
    return 0;
}
```

### 类型擦除的句柄

```cpp
#include <coroutine>
#include <iostream>
#include <vector>

// 使用 std::coroutine_handle<void> 进行类型擦除
class CoroutineScheduler {
private:
    std::vector<std::coroutine_handle<>> pending;

public:
    void schedule(std::coroutine_handle<> handle) {
        pending.push_back(handle);
    }

    void run() {
        while (!pending.empty()) {
            auto handle = pending.back();
            pending.pop_back();

            if (!handle.done()) {
                handle.resume();

                // 如果协程还没完成，重新加入队列
                if (!handle.done()) {
                    pending.insert(pending.begin(), handle);
                }
            }
        }
    }
};

// 调度器感知的 awaiter
struct ScheduleAwaiter {
    CoroutineScheduler& scheduler;

    bool await_ready() { return false; }

    void await_suspend(std::coroutine_handle<> handle) {
        scheduler.schedule(handle);
    }

    void await_resume() {}
};
```

---

## Awaitable 和 Awaiter

当执行 `co_await expr` 时，编译器需要获取一个 awaiter 对象。awaiter 必须实现三个方法。

### Awaiter 的三个方法

```cpp
#include <coroutine>
#include <iostream>
#include <thread>
#include <future>

// 完整的 awaiter 示例
struct DetailedAwaiter {
    int result = 0;

    // 1. await_ready(): 检查是否需要暂停
    // 返回 true: 不需要暂停，直接调用 await_resume
    // 返回 false: 需要暂停，调用 await_suspend
    bool await_ready() const noexcept {
        std::cout << "await_ready() 被调用\n";
        return false;  // 需要暂停
    }

    // 2. await_suspend(): 暂停时的操作
    // 参数是当前协程的句柄
    // 返回值决定接下来的行为：
    //   - void: 暂停当前协程
    //   - bool: true 暂停，false 立即恢复
    //   - coroutine_handle<>: 恢复指定的协程（对称转移）
    void await_suspend(std::coroutine_handle<> handle) noexcept {
        std::cout << "await_suspend() 被调用\n";

        // 在新线程中执行异步操作
        std::thread([this, handle]() {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            result = 42;
            handle.resume();  // 操作完成后恢复协程
        }).detach();
    }

    // 3. await_resume(): 恢复后执行，返回值是 co_await 表达式的值
    int await_resume() const noexcept {
        std::cout << "await_resume() 被调用，返回: " << result << "\n";
        return result;
    }
};
```

### await_suspend 的不同返回类型

```cpp
#include <coroutine>
#include <iostream>

// 返回 void：总是暂停
struct AlwaysSuspend {
    bool await_ready() { return false; }
    void await_suspend(std::coroutine_handle<>) {
        std::cout << "void 版本：总是暂停\n";
    }
    void await_resume() {}
};

// 返回 bool：条件暂停
struct ConditionalSuspend {
    bool should_suspend;

    bool await_ready() { return false; }
    bool await_suspend(std::coroutine_handle<>) {
        std::cout << "bool 版本：" << (should_suspend ? "暂停" : "不暂停") << "\n";
        return should_suspend;  // true 暂停，false 立即恢复
    }
    void await_resume() {}
};

// 返回 coroutine_handle<>：对称转移
struct SymmetricTransfer {
    std::coroutine_handle<> next;

    bool await_ready() { return false; }
    std::coroutine_handle<> await_suspend(std::coroutine_handle<>) {
        std::cout << "handle 版本：对称转移到另一个协程\n";
        return next;  // 暂停当前协程，恢复 next 协程
    }
    void await_resume() {}
};
```

### 标准 awaiter 类型

```cpp
#include <coroutine>

// std::suspend_always - 总是暂停
// 定义大致如下：
struct suspend_always {
    constexpr bool await_ready() const noexcept { return false; }
    constexpr void await_suspend(std::coroutine_handle<>) const noexcept {}
    constexpr void await_resume() const noexcept {}
};

// std::suspend_never - 从不暂停
// 定义大致如下：
struct suspend_never {
    constexpr bool await_ready() const noexcept { return true; }
    constexpr void await_suspend(std::coroutine_handle<>) const noexcept {}
    constexpr void await_resume() const noexcept {}
};
```

### 自定义 Awaitable 类型

```cpp
#include <coroutine>
#include <future>
#include <iostream>

// 使 std::future 可等待
template<typename T>
struct FutureAwaiter {
    std::future<T>& future;

    bool await_ready() {
        // 检查 future 是否已经就绪
        return future.wait_for(std::chrono::seconds(0)) ==
               std::future_status::ready;
    }

    void await_suspend(std::coroutine_handle<> handle) {
        // 在新线程中等待 future
        std::thread([this, handle]() {
            future.wait();
            handle.resume();
        }).detach();
    }

    T await_resume() {
        return future.get();
    }
};

// 辅助函数
template<typename T>
FutureAwaiter<T> operator co_await(std::future<T>& future) {
    return FutureAwaiter<T>{future};
}

// 或者使用成员函数 operator co_await()
template<typename T>
struct AwaitableFuture {
    std::future<T> future;

    auto operator co_await() {
        return FutureAwaiter<T>{future};
    }
};
```

---

## 生成器实现

生成器是协程的经典应用，用于惰性生成序列。

### 完整的生成器实现

```cpp
#include <coroutine>
#include <iostream>
#include <exception>
#include <iterator>
#include <utility>

template<typename T>
class Generator {
public:
    struct promise_type {
        T current_value;
        std::exception_ptr exception;

        Generator get_return_object() {
            return Generator{Handle::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept {
            return {};
        }

        std::suspend_always final_suspend() noexcept {
            return {};
        }

        std::suspend_always yield_value(T value) noexcept {
            current_value = std::move(value);
            return {};
        }

        void return_void() noexcept {}

        void unhandled_exception() {
            exception = std::current_exception();
        }

        // 禁止在生成器中使用 co_await
        template<typename U>
        std::suspend_never await_transform(U&&) = delete;
    };

    using Handle = std::coroutine_handle<promise_type>;

    // 迭代器类型
    class iterator {
    public:
        using iterator_category = std::input_iterator_tag;
        using difference_type = std::ptrdiff_t;
        using value_type = T;
        using reference = T&;
        using pointer = T*;

        iterator() noexcept = default;

        explicit iterator(Handle handle) noexcept : handle_(handle) {}

        iterator& operator++() {
            handle_.resume();
            if (handle_.done()) {
                auto& promise = handle_.promise();
                handle_ = nullptr;
                if (promise.exception) {
                    std::rethrow_exception(promise.exception);
                }
            }
            return *this;
        }

        void operator++(int) {
            ++*this;
        }

        reference operator*() const noexcept {
            return handle_.promise().current_value;
        }

        pointer operator->() const noexcept {
            return std::addressof(operator*());
        }

        bool operator==(const iterator& other) const noexcept {
            return handle_ == other.handle_;
        }

        bool operator!=(const iterator& other) const noexcept {
            return !(*this == other);
        }

    private:
        Handle handle_ = nullptr;
    };

    Generator() noexcept = default;

    Generator(Generator&& other) noexcept
        : handle_(std::exchange(other.handle_, nullptr)) {}

    Generator& operator=(Generator&& other) noexcept {
        if (this != &other) {
            if (handle_) {
                handle_.destroy();
            }
            handle_ = std::exchange(other.handle_, nullptr);
        }
        return *this;
    }

    ~Generator() {
        if (handle_) {
            handle_.destroy();
        }
    }

    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;

    iterator begin() {
        if (handle_) {
            handle_.resume();
            if (handle_.done()) {
                auto& promise = handle_.promise();
                if (promise.exception) {
                    std::rethrow_exception(promise.exception);
                }
                return end();
            }
        }
        return iterator{handle_};
    }

    iterator end() noexcept {
        return iterator{};
    }

private:
    explicit Generator(Handle handle) noexcept : handle_(handle) {}
    Handle handle_ = nullptr;
};
```

### 生成器使用示例

```cpp
#include <iostream>
#include <string>
#include <vector>

// 数字范围生成器
Generator<int> range(int start, int end, int step = 1) {
    for (int i = start; i < end; i += step) {
        co_yield i;
    }
}

// 斐波那契数列生成器
Generator<long long> fibonacci(int count) {
    long long a = 0, b = 1;
    for (int i = 0; i < count; ++i) {
        co_yield a;
        auto next = a + b;
        a = b;
        b = next;
    }
}

// 无限序列生成器
Generator<int> naturals() {
    int i = 0;
    while (true) {
        co_yield i++;
    }
}

// 字符串分割生成器
Generator<std::string_view> split(std::string_view str, char delimiter) {
    size_t start = 0;
    size_t end = str.find(delimiter);

    while (end != std::string_view::npos) {
        co_yield str.substr(start, end - start);
        start = end + 1;
        end = str.find(delimiter, start);
    }

    co_yield str.substr(start);
}

// 树的遍历生成器
struct TreeNode {
    int value;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
};

Generator<int> inorder_traverse(TreeNode* node) {
    if (node == nullptr) {
        co_return;
    }

    // 使用递归生成器（需要特殊处理）
    // 这里简化为迭代版本
    std::vector<TreeNode*> stack;
    TreeNode* current = node;

    while (current || !stack.empty()) {
        while (current) {
            stack.push_back(current);
            current = current->left;
        }

        current = stack.back();
        stack.pop_back();
        co_yield current->value;
        current = current->right;
    }
}

int main() {
    std::cout << "范围 [1, 10): ";
    for (int n : range(1, 10)) {
        std::cout << n << " ";
    }
    std::cout << "\n";

    std::cout << "斐波那契前10项: ";
    for (long long n : fibonacci(10)) {
        std::cout << n << " ";
    }
    std::cout << "\n";

    std::cout << "自然数前5个: ";
    int count = 0;
    for (int n : naturals()) {
        std::cout << n << " ";
        if (++count >= 5) break;
    }
    std::cout << "\n";

    std::cout << "字符串分割: ";
    for (auto part : split("hello,world,cpp,coroutines", ',')) {
        std::cout << "[" << part << "] ";
    }
    std::cout << "\n";

    return 0;
}
```

### 管道式生成器组合

```cpp
#include <iostream>
#include <functional>

// 过滤器
template<typename T, typename Pred>
Generator<T> filter(Generator<T> source, Pred pred) {
    for (auto&& value : source) {
        if (pred(value)) {
            co_yield std::forward<decltype(value)>(value);
        }
    }
}

// 映射转换
template<typename T, typename Func>
auto map(Generator<T> source, Func func)
    -> Generator<decltype(func(std::declval<T>()))>
{
    for (auto&& value : source) {
        co_yield func(std::forward<decltype(value)>(value));
    }
}

// 取前 N 个
template<typename T>
Generator<T> take(Generator<T> source, size_t n) {
    size_t count = 0;
    for (auto&& value : source) {
        if (count++ >= n) break;
        co_yield std::forward<decltype(value)>(value);
    }
}

// 跳过前 N 个
template<typename T>
Generator<T> drop(Generator<T> source, size_t n) {
    size_t count = 0;
    for (auto&& value : source) {
        if (count++ >= n) {
            co_yield std::forward<decltype(value)>(value);
        }
    }
}

int main() {
    // 组合使用：取自然数，跳过前5个，过滤偶数，平方，取前3个
    auto result = take(
        map(
            filter(
                drop(naturals(), 5),
                [](int x) { return x % 2 == 0; }
            ),
            [](int x) { return x * x; }
        ),
        3
    );

    std::cout << "组合结果: ";
    for (int n : result) {
        std::cout << n << " ";  // 输出: 36 64 100
    }
    std::cout << "\n";

    return 0;
}
```

---

## 异步任务实现

异步任务是协程的另一个重要应用场景。

### 完整的 Task 实现

```cpp
#include <coroutine>
#include <exception>
#include <iostream>
#include <optional>
#include <variant>
#include <utility>

template<typename T = void>
class Task {
public:
    struct promise_type {
        std::variant<std::monostate, T, std::exception_ptr> result;
        std::coroutine_handle<> continuation;

        Task get_return_object() {
            return Task{Handle::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept {
            return {};
        }

        struct FinalAwaiter {
            bool await_ready() noexcept { return false; }

            std::coroutine_handle<> await_suspend(Handle handle) noexcept {
                auto& promise = handle.promise();
                if (promise.continuation) {
                    return promise.continuation;
                }
                return std::noop_coroutine();
            }

            void await_resume() noexcept {}
        };

        FinalAwaiter final_suspend() noexcept {
            return {};
        }

        void return_value(T value) {
            result.template emplace<1>(std::move(value));
        }

        void unhandled_exception() {
            result.template emplace<2>(std::current_exception());
        }
    };

    using Handle = std::coroutine_handle<promise_type>;

    Task() noexcept = default;

    Task(Task&& other) noexcept
        : handle_(std::exchange(other.handle_, nullptr)) {}

    Task& operator=(Task&& other) noexcept {
        if (this != &other) {
            if (handle_) {
                handle_.destroy();
            }
            handle_ = std::exchange(other.handle_, nullptr);
        }
        return *this;
    }

    ~Task() {
        if (handle_) {
            handle_.destroy();
        }
    }

    Task(const Task&) = delete;
    Task& operator=(const Task&) = delete;

    // 使 Task 可等待
    struct Awaiter {
        Handle handle;

        bool await_ready() noexcept {
            return false;
        }

        std::coroutine_handle<> await_suspend(
            std::coroutine_handle<> continuation) noexcept
        {
            handle.promise().continuation = continuation;
            return handle;
        }

        T await_resume() {
            auto& result = handle.promise().result;
            if (std::holds_alternative<std::exception_ptr>(result)) {
                std::rethrow_exception(std::get<std::exception_ptr>(result));
            }
            return std::get<T>(std::move(result));
        }
    };

    Awaiter operator co_await() && noexcept {
        return Awaiter{handle_};
    }

    // 同步获取结果
    T get() {
        // 简单实现：循环恢复直到完成
        while (!handle_.done()) {
            handle_.resume();
        }

        auto& result = handle_.promise().result;
        if (std::holds_alternative<std::exception_ptr>(result)) {
            std::rethrow_exception(std::get<std::exception_ptr>(result));
        }
        return std::get<T>(std::move(result));
    }

    bool done() const noexcept {
        return handle_.done();
    }

    void resume() {
        if (!handle_.done()) {
            handle_.resume();
        }
    }

private:
    explicit Task(Handle handle) noexcept : handle_(handle) {}
    Handle handle_ = nullptr;
};

// void 特化
template<>
class Task<void> {
public:
    struct promise_type {
        std::exception_ptr exception;
        std::coroutine_handle<> continuation;

        Task get_return_object() {
            return Task{Handle::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept {
            return {};
        }

        struct FinalAwaiter {
            bool await_ready() noexcept { return false; }

            std::coroutine_handle<> await_suspend(Handle handle) noexcept {
                auto& promise = handle.promise();
                if (promise.continuation) {
                    return promise.continuation;
                }
                return std::noop_coroutine();
            }

            void await_resume() noexcept {}
        };

        FinalAwaiter final_suspend() noexcept {
            return {};
        }

        void return_void() noexcept {}

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    using Handle = std::coroutine_handle<promise_type>;

    Task() noexcept = default;

    Task(Task&& other) noexcept
        : handle_(std::exchange(other.handle_, nullptr)) {}

    Task& operator=(Task&& other) noexcept {
        if (this != &other) {
            if (handle_) {
                handle_.destroy();
            }
            handle_ = std::exchange(other.handle_, nullptr);
        }
        return *this;
    }

    ~Task() {
        if (handle_) {
            handle_.destroy();
        }
    }

    Task(const Task&) = delete;
    Task& operator=(const Task&) = delete;

    struct Awaiter {
        Handle handle;

        bool await_ready() noexcept {
            return false;
        }

        std::coroutine_handle<> await_suspend(
            std::coroutine_handle<> continuation) noexcept
        {
            handle.promise().continuation = continuation;
            return handle;
        }

        void await_resume() {
            if (handle.promise().exception) {
                std::rethrow_exception(handle.promise().exception);
            }
        }
    };

    Awaiter operator co_await() && noexcept {
        return Awaiter{handle_};
    }

    void get() {
        while (!handle_.done()) {
            handle_.resume();
        }
        if (handle_.promise().exception) {
            std::rethrow_exception(handle_.promise().exception);
        }
    }

private:
    explicit Task(Handle handle) noexcept : handle_(handle) {}
    Handle handle_ = nullptr;
};
```

### 异步任务使用示例

```cpp
#include <iostream>
#include <chrono>
#include <thread>

// 模拟异步睡眠
struct AsyncSleep {
    std::chrono::milliseconds duration;

    bool await_ready() const noexcept {
        return duration.count() <= 0;
    }

    void await_suspend(std::coroutine_handle<> handle) const {
        std::thread([handle, d = duration]() {
            std::this_thread::sleep_for(d);
            handle.resume();
        }).detach();
    }

    void await_resume() const noexcept {}
};

AsyncSleep async_sleep(std::chrono::milliseconds ms) {
    return AsyncSleep{ms};
}

// 异步加法
Task<int> async_add(int a, int b) {
    co_await async_sleep(std::chrono::milliseconds(100));
    co_return a + b;
}

// 异步乘法
Task<int> async_multiply(int a, int b) {
    co_await async_sleep(std::chrono::milliseconds(100));
    co_return a * b;
}

// 组合异步操作
Task<int> calculate() {
    std::cout << "开始计算\n";

    int sum = co_await async_add(10, 20);
    std::cout << "加法结果: " << sum << "\n";

    int product = co_await async_multiply(sum, 2);
    std::cout << "乘法结果: " << product << "\n";

    co_return product;
}

// 带异常处理的异步任务
Task<int> may_fail(bool should_fail) {
    co_await async_sleep(std::chrono::milliseconds(50));

    if (should_fail) {
        throw std::runtime_error("操作失败");
    }

    co_return 42;
}

Task<void> error_handling_example() {
    try {
        int result = co_await may_fail(true);
        std::cout << "成功: " << result << "\n";
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << "\n";
    }
}

int main() {
    // 运行计算任务
    auto calc_task = calculate();
    int result = calc_task.get();
    std::cout << "最终结果: " << result << "\n\n";

    // 运行错误处理示例
    auto error_task = error_handling_example();
    error_task.get();

    return 0;
}
```

---

## 实际应用案例

### 案例1：异步文件读取

```cpp
#include <coroutine>
#include <fstream>
#include <iostream>
#include <string>
#include <thread>
#include <future>

// 异步读取文件内容
Task<std::string> async_read_file(const std::string& filename) {
    // 模拟异步文件操作
    struct FileAwaiter {
        std::string filename;
        std::string content;

        bool await_ready() { return false; }

        void await_suspend(std::coroutine_handle<> handle) {
            std::thread([this, handle]() {
                std::ifstream file(filename);
                if (file) {
                    content = std::string(
                        std::istreambuf_iterator<char>(file),
                        std::istreambuf_iterator<char>()
                    );
                }
                handle.resume();
            }).detach();
        }

        std::string await_resume() {
            return std::move(content);
        }
    };

    co_return co_await FileAwaiter{filename};
}

// 处理多个文件
Task<void> process_files() {
    auto content1 = co_await async_read_file("file1.txt");
    std::cout << "File1 size: " << content1.size() << " bytes\n";

    auto content2 = co_await async_read_file("file2.txt");
    std::cout << "File2 size: " << content2.size() << " bytes\n";
}
```

### 案例2：简单的 HTTP 客户端模拟

```cpp
#include <coroutine>
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <map>

// HTTP 响应结构
struct HttpResponse {
    int status_code;
    std::map<std::string, std::string> headers;
    std::string body;
};

// 模拟异步 HTTP 请求
Task<HttpResponse> async_http_get(const std::string& url) {
    struct HttpAwaiter {
        std::string url;
        HttpResponse response;

        bool await_ready() { return false; }

        void await_suspend(std::coroutine_handle<> handle) {
            std::thread([this, handle]() {
                // 模拟网络延迟
                std::this_thread::sleep_for(std::chrono::milliseconds(200));

                // 模拟响应
                response.status_code = 200;
                response.headers["Content-Type"] = "application/json";
                response.body = R"({"message": "Hello from )" + url + R"("})";

                handle.resume();
            }).detach();
        }

        HttpResponse await_resume() {
            return std::move(response);
        }
    };

    co_return co_await HttpAwaiter{url};
}

// 使用异步 HTTP 客户端
Task<void> fetch_data_from_api() {
    std::cout << "开始请求 API...\n";

    auto response1 = co_await async_http_get("https://api.example.com/users");
    std::cout << "用户 API 响应: " << response1.body << "\n";

    auto response2 = co_await async_http_get("https://api.example.com/posts");
    std::cout << "帖子 API 响应: " << response2.body << "\n";

    std::cout << "所有请求完成\n";
}
```

### 案例3：生产者-消费者模式

```cpp
#include <coroutine>
#include <iostream>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <optional>

// 线程安全的异步队列
template<typename T>
class AsyncQueue {
private:
    std::queue<T> queue_;
    std::mutex mutex_;
    std::condition_variable cv_;
    bool closed_ = false;
    std::vector<std::coroutine_handle<>> waiting_;

public:
    void push(T value) {
        std::coroutine_handle<> to_resume;
        {
            std::lock_guard lock(mutex_);
            queue_.push(std::move(value));
            if (!waiting_.empty()) {
                to_resume = waiting_.back();
                waiting_.pop_back();
            }
        }
        if (to_resume) {
            to_resume.resume();
        }
    }

    void close() {
        std::vector<std::coroutine_handle<>> to_resume;
        {
            std::lock_guard lock(mutex_);
            closed_ = true;
            to_resume = std::move(waiting_);
        }
        for (auto handle : to_resume) {
            handle.resume();
        }
    }

    // Awaitable pop
    struct PopAwaiter {
        AsyncQueue& queue;
        std::optional<T> result;

        bool await_ready() {
            std::lock_guard lock(queue.mutex_);
            if (!queue.queue_.empty()) {
                result = std::move(queue.queue_.front());
                queue.queue_.pop();
                return true;
            }
            return queue.closed_;
        }

        bool await_suspend(std::coroutine_handle<> handle) {
            std::lock_guard lock(queue.mutex_);
            if (!queue.queue_.empty()) {
                result = std::move(queue.queue_.front());
                queue.queue_.pop();
                return false;  // 不暂停
            }
            if (queue.closed_) {
                return false;
            }
            queue.waiting_.push_back(handle);
            return true;
        }

        std::optional<T> await_resume() {
            if (result) {
                return std::move(result);
            }
            std::lock_guard lock(queue.mutex_);
            if (!queue.queue_.empty()) {
                auto value = std::move(queue.queue_.front());
                queue.queue_.pop();
                return value;
            }
            return std::nullopt;
        }
    };

    PopAwaiter pop() {
        return PopAwaiter{*this};
    }
};

// 生产者协程
Task<void> producer(AsyncQueue<int>& queue, int count) {
    for (int i = 0; i < count; ++i) {
        co_await async_sleep(std::chrono::milliseconds(50));
        std::cout << "生产: " << i << "\n";
        queue.push(i);
    }
    queue.close();
}

// 消费者协程
Task<void> consumer(AsyncQueue<int>& queue, int id) {
    while (true) {
        auto value = co_await queue.pop();
        if (!value) {
            std::cout << "消费者 " << id << " 结束\n";
            break;
        }
        std::cout << "消费者 " << id << " 消费: " << *value << "\n";
    }
}
```

### 案例4：并发任务执行器

```cpp
#include <coroutine>
#include <iostream>
#include <vector>
#include <thread>

// 并发执行多个任务
template<typename T>
Task<std::vector<T>> when_all(std::vector<Task<T>> tasks) {
    std::vector<T> results;
    results.reserve(tasks.size());

    for (auto& task : tasks) {
        results.push_back(co_await std::move(task));
    }

    co_return results;
}

// 竞争执行，返回第一个完成的
template<typename T>
struct WhenAny {
    struct SharedState {
        std::mutex mutex;
        std::optional<T> result;
        std::coroutine_handle<> continuation;
        bool done = false;
    };

    std::shared_ptr<SharedState> state;
    std::vector<Task<T>> tasks;

    bool await_ready() { return false; }

    void await_suspend(std::coroutine_handle<> handle) {
        state = std::make_shared<SharedState>();
        state->continuation = handle;

        for (auto& task : tasks) {
            std::thread([this, task = std::move(task)]() mutable {
                T result = task.get();

                std::lock_guard lock(state->mutex);
                if (!state->done) {
                    state->done = true;
                    state->result = std::move(result);
                    state->continuation.resume();
                }
            }).detach();
        }
    }

    T await_resume() {
        return std::move(*state->result);
    }
};

// 带超时的等待
struct Timeout {
    std::chrono::milliseconds duration;
    bool timed_out = false;

    bool await_ready() { return false; }

    void await_suspend(std::coroutine_handle<> handle) {
        std::thread([this, handle]() {
            std::this_thread::sleep_for(duration);
            timed_out = true;
            handle.resume();
        }).detach();
    }

    bool await_resume() {
        return timed_out;
    }
};
```

---

## 性能考量与最佳实践

### 内存分配优化

```cpp
#include <coroutine>
#include <iostream>
#include <memory_resource>

// 自定义内存分配的 promise
template<typename T>
struct PoolAllocatedTask {
    struct promise_type {
        T value;

        // 使用自定义分配器
        static void* operator new(std::size_t size) {
            std::cout << "协程帧分配: " << size << " 字节\n";
            return ::operator new(size);
        }

        static void operator delete(void* ptr) {
            std::cout << "协程帧释放\n";
            ::operator delete(ptr);
        }

        // 带分配器参数的重载
        template<typename Allocator>
        static void* operator new(std::size_t size, Allocator& alloc) {
            return alloc.allocate(size);
        }

        PoolAllocatedTask get_return_object() {
            return PoolAllocatedTask{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_value(T v) { value = v; }
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle;

    PoolAllocatedTask(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~PoolAllocatedTask() { if (handle) handle.destroy(); }
};

// 协程帧可能被优化掉的情况
// 编译器可以在以下情况下省略堆分配：
// 1. 协程的生命周期完全嵌套在调用者内
// 2. 协程帧的大小在编译时已知
// 3. 编译器能证明协程不会在暂停点之间逃逸
```

### 避免常见陷阱

```cpp
#include <coroutine>
#include <iostream>
#include <string>

// 陷阱1：悬空引用
// 错误示例
Task<int> bad_reference(const std::string& s) {
    co_await async_sleep(std::chrono::milliseconds(100));
    // 危险！s 可能已经被销毁
    co_return s.length();
}

// 正确：按值捕获
Task<int> good_value(std::string s) {
    co_await async_sleep(std::chrono::milliseconds(100));
    co_return s.length();
}

// 陷阱2：协程立即销毁
// 错误示例
void bad_fire_and_forget() {
    auto task = []() -> Task<void> {
        co_await async_sleep(std::chrono::milliseconds(100));
        std::cout << "这可能不会执行\n";
    }();
    // task 立即被销毁，协程被取消
}

// 正确：确保协程完成
void good_fire_and_forget() {
    static std::vector<Task<void>> tasks;
    tasks.push_back([]() -> Task<void> {
        co_await async_sleep(std::chrono::milliseconds(100));
        std::cout << "这会执行\n";
    }());
}

// 陷阱3：在协程中使用 this
class BadClass {
public:
    Task<int> bad_method() {
        co_await async_sleep(std::chrono::milliseconds(100));
        // 危险！this 可能已无效
        co_return value_;
    }

private:
    int value_ = 42;
};

// 正确：捕获需要的成员
class GoodClass {
public:
    Task<int> good_method() {
        int captured_value = value_;  // 复制到协程帧
        co_await async_sleep(std::chrono::milliseconds(100));
        co_return captured_value;
    }

    // 或者使用智能指针
    Task<int> better_method(std::shared_ptr<GoodClass> self) {
        co_await async_sleep(std::chrono::milliseconds(100));
        co_return self->value_;
    }

private:
    int value_ = 42;
};
```

### 调试协程

```cpp
#include <coroutine>
#include <iostream>
#include <source_location>

// 带调试信息的协程
template<typename T>
struct DebugTask {
    struct promise_type {
        std::source_location location;
        T value;

        DebugTask get_return_object() {
            return DebugTask{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_always initial_suspend() {
            std::cout << "协程开始于: "
                      << location.file_name() << ":"
                      << location.line() << "\n";
            return {};
        }

        std::suspend_always final_suspend() noexcept {
            std::cout << "协程结束于: "
                      << location.file_name() << ":"
                      << location.line() << "\n";
            return {};
        }

        void return_value(T v) {
            value = v;
            std::cout << "协程返回值: " << v << "\n";
        }

        void unhandled_exception() {
            std::cout << "协程异常!\n";
            std::terminate();
        }

        // 记录协程创建位置
        DebugTask get_return_object_on_allocation_failure() {
            throw std::bad_alloc{};
        }
    };

    std::coroutine_handle<promise_type> handle;

    DebugTask(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~DebugTask() { if (handle) handle.destroy(); }
};

// 调试用的 awaiter 包装器
template<typename Awaiter>
struct DebugAwaiter {
    Awaiter awaiter;
    const char* name;

    bool await_ready() {
        bool ready = awaiter.await_ready();
        std::cout << name << "::await_ready() = " << ready << "\n";
        return ready;
    }

    auto await_suspend(std::coroutine_handle<> handle) {
        std::cout << name << "::await_suspend()\n";
        return awaiter.await_suspend(handle);
    }

    auto await_resume() {
        std::cout << name << "::await_resume()\n";
        return awaiter.await_resume();
    }
};

template<typename Awaiter>
DebugAwaiter<Awaiter> debug_await(Awaiter awaiter, const char* name) {
    return DebugAwaiter<Awaiter>{std::move(awaiter), name};
}
```

### 最佳实践总结

1. **内存管理**
   - 尽量让编译器优化掉堆分配
   - 对性能关键的协程使用自定义分配器
   - 避免在协程帧中存储大对象

2. **生命周期管理**
   - 按值传递参数给协程
   - 避免在协程中持有引用或指针
   - 使用 `shared_ptr` 确保对象生命周期

3. **错误处理**
   - 始终在 `promise_type` 中实现 `unhandled_exception`
   - 使用 `try-catch` 处理协程中的异常
   - 考虑使用 `std::expected` 或类似类型

4. **性能优化**
   - 使用对称转移避免栈溢出
   - 批量处理以减少暂停次数
   - 避免不必要的协程创建

5. **可维护性**
   - 为协程类型添加清晰的文档
   - 使用描述性的类型名称
   - 考虑提供调试工具

---

## 总结

C++20 协程提供了强大而灵活的异步编程能力：

| 特性 | 说明 |
|------|------|
| **无栈协程** | 轻量级，适合大规模并发 |
| **编译器支持** | 自动转换为状态机 |
| **高度可定制** | 通过 promise_type 定制行为 |
| **零开销** | 只为使用的功能付费 |

### 关键组件

- **co_await**：暂停协程，等待操作完成
- **co_yield**：产生值并暂停
- **co_return**：结束协程
- **promise_type**：定义协程行为
- **coroutine_handle**：控制协程执行
- **awaiter**：定义等待行为

### 适用场景

1. **异步 I/O**：网络、文件操作
2. **生成器**：惰性序列生成
3. **状态机**：复杂状态转换
4. **并发任务**：轻量级并发
5. **协作式多任务**：游戏、UI

### 编译器支持

- **GCC 10+**：完整支持
- **Clang 12+**：完整支持
- **MSVC 19.28+**：完整支持

启用 C++20 协程需要使用 `-std=c++20` 编译选项，并包含 `<coroutine>` 头文件。

### 参考资源

- [C++ Reference - Coroutines](https://en.cppreference.com/w/cpp/language/coroutines)
- [Lewis Baker's Asymmetric Transfer Blog](https://lewissbaker.github.io/)
- [C++20 标准草案 - 协程部分](https://eel.is/c++draft/dcl.fct.def.coroutine)
