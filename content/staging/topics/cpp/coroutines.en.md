---
title: C++20 Coroutines
description: Master C++20 coroutines including co_await, co_yield, co_return and coroutine implementation
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - coroutines
  - C++20
  - async
status: imported
origin: old/src/content/docs/cpp/coroutines.en.md
divergence: 0.231
issues: []
legacy:
  category: Cpp
  subcategory: C++20
  order: 18
  lastUpdated: 2026-01-07
---

Coroutines are one of the most significant features introduced in C++20, enabling a new paradigm for writing asynchronous and lazy-evaluated code. Unlike traditional functions that run to completion, coroutines can suspend execution at specific points and resume later, making them ideal for generators, async I/O, cooperative multitasking, and event-driven programming.

---

## Introduction to Coroutines

A coroutine is a generalization of a subroutine. While a regular function has a single entry point and runs until it returns, a coroutine can:

- **Suspend**: Pause execution and return control to the caller
- **Resume**: Continue execution from where it was suspended
- **Yield**: Produce a value and suspend
- **Complete**: Finish execution with or without a value

### Why Coroutines?

Coroutines solve several common programming challenges:

```cpp
// Traditional callback-based async code (callback hell)
void fetch_data_callback(std::function<void(Data)> callback) {
    async_read([=](auto data1) {
        process(data1, [=](auto data2) {
            transform(data2, [=](auto result) {
                callback(result);
            });
        });
    });
}

// With coroutines: clean, sequential-looking code
Task<Data> fetch_data_coroutine() {
    auto data1 = co_await async_read();
    auto data2 = co_await process(data1);
    auto result = co_await transform(data2);
    co_return result;
}
```

Coroutines provide:

- **Readable async code**: Write sequential-looking code for async operations
- **Lazy evaluation**: Generate values on demand without storing everything in memory
- **State machine simplification**: Complex state machines become simple loops
- **Cooperative multitasking**: Efficiently manage many concurrent tasks

---

## Coroutine Keywords

C++20 introduces three keywords that transform a function into a coroutine:

### co_await - Suspend Until Ready

The `co_await` operator suspends the coroutine until the awaited object is ready:

```cpp
#include <coroutine>
#include <iostream>

// Forward declaration of our Task type
template<typename T = void>
struct Task;

Task<int> async_computation() {
    std::cout << "Before co_await\n";
    co_await std::suspend_always{};  // Suspend here
    std::cout << "After co_await\n";
    co_return 42;
}
```

### co_yield - Produce a Value and Suspend

The `co_yield` expression suspends the coroutine and produces a value:

```cpp
#include <coroutine>

// Forward declaration of Generator type
template<typename T>
struct Generator;

Generator<int> sequence(int start, int end) {
    for (int i = start; i <= end; ++i) {
        co_yield i;  // Produce value and suspend
    }
}

// Usage:
// for (int n : sequence(1, 5)) {
//     std::cout << n << " ";  // Output: 1 2 3 4 5
// }
```

### co_return - Complete the Coroutine

The `co_return` statement completes the coroutine, optionally with a value:

```cpp
Task<std::string> greet(std::string name) {
    co_return "Hello, " + name + "!";  // Complete with value
}

Task<void> log_message(std::string msg) {
    std::cout << msg << '\n';
    co_return;  // Complete without value (for void coroutines)
}
```

### Identifying Coroutines

A function becomes a coroutine if its body contains any of:
- `co_await` expression
- `co_yield` expression
- `co_return` statement

```cpp
// This is a coroutine (contains co_return)
Task<int> is_coroutine() {
    co_return 42;
}

// This is NOT a coroutine (no coroutine keywords)
int not_coroutine() {
    return 42;
}
```

---

## Coroutine Components

Understanding coroutines requires familiarity with several key components that work together.

### The Coroutine Frame

When a coroutine is called, the compiler allocates a **coroutine frame** on the heap (typically) containing:

- Parameters (copied or moved)
- Local variables
- Promise object
- Current suspension point
- Resume/destroy function pointers

```cpp
// Conceptually, the compiler transforms:
Generator<int> count_to_three() {
    co_yield 1;
    co_yield 2;
    co_yield 3;
}

// Into something like:
struct count_to_three_frame {
    // Promise object
    Generator<int>::promise_type promise;

    // Suspension point
    int suspend_index = 0;

    // Resume function
    void resume();
    void destroy();
};
```

### The Promise Type

Every coroutine has an associated **promise type** that controls its behavior. The promise type must define several methods:

```cpp
template<typename T>
struct Task {
    struct promise_type {
        T result;
        std::exception_ptr exception;

        // Returns the coroutine return object
        Task get_return_object() {
            return Task{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        // Called before coroutine body starts
        std::suspend_never initial_suspend() noexcept { return {}; }

        // Called after coroutine completes
        std::suspend_always final_suspend() noexcept { return {}; }

        // Called for co_return value;
        void return_value(T value) {
            result = std::move(value);
        }

        // Called for unhandled exceptions
        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    std::coroutine_handle<promise_type> handle;
};
```

### Coroutine Handle

The `std::coroutine_handle<P>` is a lightweight pointer-like object to the coroutine frame:

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

        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_value(T v) { value = v; }
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle;

    explicit SimpleTask(handle_type h) : handle(h) {}

    ~SimpleTask() {
        if (handle) {
            handle.destroy();  // Clean up coroutine frame
        }
    }

    // Move only
    SimpleTask(SimpleTask&& other) noexcept : handle(other.handle) {
        other.handle = nullptr;
    }

    SimpleTask& operator=(SimpleTask&& other) noexcept {
        if (this != &other) {
            if (handle) handle.destroy();
            handle = other.handle;
            other.handle = nullptr;
        }
        return *this;
    }

    // Delete copy operations
    SimpleTask(const SimpleTask&) = delete;
    SimpleTask& operator=(const SimpleTask&) = delete;

    // Coroutine operations
    void resume() {
        if (handle && !handle.done()) {
            handle.resume();
        }
    }

    bool done() const {
        return !handle || handle.done();
    }

    T get_result() {
        while (!done()) {
            resume();
        }
        return handle.promise().value;
    }
};

SimpleTask<int> compute() {
    co_return 42;
}

int main() {
    auto task = compute();
    // Coroutine is suspended at initial_suspend

    std::cout << "Coroutine created\n";

    // Resume and get result
    int result = task.get_result();
    std::cout << "Result: " << result << '\n';  // Output: 42

    return 0;
}
```

### Standard Awaitable Types

C++ provides two built-in awaitables:

```cpp
#include <coroutine>

// std::suspend_always - Always suspends
struct suspend_always {
    constexpr bool await_ready() const noexcept { return false; }
    constexpr void await_suspend(std::coroutine_handle<>) const noexcept {}
    constexpr void await_resume() const noexcept {}
};

// std::suspend_never - Never suspends
struct suspend_never {
    constexpr bool await_ready() const noexcept { return true; }
    constexpr void await_suspend(std::coroutine_handle<>) const noexcept {}
    constexpr void await_resume() const noexcept {}
};
```

---

## Building a Generator

A generator is a coroutine that produces a sequence of values lazily. Let's build a complete, production-ready generator:

### Basic Generator Implementation

```cpp
#include <coroutine>
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
            return Generator{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        std::suspend_always yield_value(T value) {
            current_value = std::move(value);
            return {};
        }

        void return_void() noexcept {}

        void unhandled_exception() {
            exception = std::current_exception();
        }

        // Disallow co_await in generators
        template<typename U>
        std::suspend_never await_transform(U&&) = delete;
    };

    using handle_type = std::coroutine_handle<promise_type>;

private:
    handle_type handle_;

public:
    explicit Generator(handle_type h) : handle_(h) {}

    ~Generator() {
        if (handle_) {
            handle_.destroy();
        }
    }

    // Move-only
    Generator(Generator&& other) noexcept : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    Generator& operator=(Generator&& other) noexcept {
        if (this != &other) {
            if (handle_) handle_.destroy();
            handle_ = other.handle_;
            other.handle_ = nullptr;
        }
        return *this;
    }

    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;

    // Iterator for range-based for loops
    class iterator {
    public:
        using iterator_category = std::input_iterator_tag;
        using value_type = T;
        using difference_type = std::ptrdiff_t;
        using pointer = const T*;
        using reference = const T&;

    private:
        handle_type handle_;

        void advance() {
            handle_.resume();
            if (handle_.done()) {
                if (handle_.promise().exception) {
                    std::rethrow_exception(handle_.promise().exception);
                }
            }
        }

    public:
        iterator() noexcept : handle_(nullptr) {}

        explicit iterator(handle_type handle) : handle_(handle) {
            if (handle_) {
                advance();
            }
        }

        reference operator*() const {
            return handle_.promise().current_value;
        }

        pointer operator->() const {
            return std::addressof(handle_.promise().current_value);
        }

        iterator& operator++() {
            advance();
            return *this;
        }

        iterator operator++(int) {
            iterator tmp = *this;
            ++*this;
            return tmp;
        }

        bool operator==(const iterator& other) const noexcept {
            return handle_ == other.handle_ ||
                   (handle_ && handle_.done() && (!other.handle_ || other.handle_.done()));
        }

        bool operator!=(const iterator& other) const noexcept {
            return !(*this == other);
        }

        bool operator==(std::default_sentinel_t) const noexcept {
            return !handle_ || handle_.done();
        }

        bool operator!=(std::default_sentinel_t) const noexcept {
            return handle_ && !handle_.done();
        }
    };

    iterator begin() {
        return iterator{handle_};
    }

    std::default_sentinel_t end() noexcept {
        return {};
    }
};
```

### Using the Generator

```cpp
#include <iostream>
#include <vector>
#include <string>

// Simple sequence generator
Generator<int> range(int start, int end, int step = 1) {
    for (int i = start; i < end; i += step) {
        co_yield i;
    }
}

// Fibonacci sequence
Generator<long long> fibonacci(int count) {
    long long a = 0, b = 1;
    for (int i = 0; i < count; ++i) {
        co_yield a;
        auto next = a + b;
        a = b;
        b = next;
    }
}

// Transform generator (like map)
template<typename T, typename U, typename Func>
Generator<U> transform(Generator<T> gen, Func func) {
    for (auto&& value : gen) {
        co_yield func(std::forward<decltype(value)>(value));
    }
}

// Filter generator
template<typename T, typename Pred>
Generator<T> filter(Generator<T> gen, Pred pred) {
    for (auto&& value : gen) {
        if (pred(value)) {
            co_yield std::forward<decltype(value)>(value);
        }
    }
}

// Take first n elements
template<typename T>
Generator<T> take(Generator<T> gen, size_t n) {
    size_t count = 0;
    for (auto&& value : gen) {
        if (count++ >= n) break;
        co_yield std::forward<decltype(value)>(value);
    }
}

int main() {
    // Basic range
    std::cout << "Range 1-5: ";
    for (int n : range(1, 6)) {
        std::cout << n << " ";  // 1 2 3 4 5
    }
    std::cout << '\n';

    // Fibonacci
    std::cout << "Fibonacci: ";
    for (auto fib : fibonacci(10)) {
        std::cout << fib << " ";  // 0 1 1 2 3 5 8 13 21 34
    }
    std::cout << '\n';

    // Composed generators
    std::cout << "Even squares: ";
    auto pipeline = transform(
        filter(
            range(1, 10),
            [](int n) { return n % 2 == 0; }
        ),
        [](int n) { return n * n; }
    );

    for (int n : pipeline) {
        std::cout << n << " ";  // 4 16 36 64
    }
    std::cout << '\n';

    return 0;
}
```

### Recursive Generator

For tree traversals and nested structures:

```cpp
#include <memory>
#include <vector>

struct TreeNode {
    int value;
    std::vector<std::unique_ptr<TreeNode>> children;

    TreeNode(int v) : value(v) {}

    void add_child(int v) {
        children.push_back(std::make_unique<TreeNode>(v));
    }
};

// Pre-order traversal using generator
Generator<int> traverse(const TreeNode& node) {
    co_yield node.value;
    for (const auto& child : node.children) {
        // Nested generator - yield all values from subtree
        for (int value : traverse(*child)) {
            co_yield value;
        }
    }
}

int main() {
    TreeNode root(1);
    root.add_child(2);
    root.add_child(3);
    root.children[0]->add_child(4);
    root.children[0]->add_child(5);
    root.children[1]->add_child(6);

    //       1
    //      / \
    //     2   3
    //    / \   \
    //   4   5   6

    std::cout << "Tree traversal: ";
    for (int value : traverse(root)) {
        std::cout << value << " ";  // 1 2 4 5 3 6
    }
    std::cout << '\n';

    return 0;
}
```

---

## Awaitable Types

An awaitable is any type that can be used with `co_await`. To be awaitable, a type must provide three methods.

### Awaitable Interface

```cpp
struct Awaitable {
    // Is the result immediately available?
    bool await_ready() const noexcept;

    // What to do when suspending
    // Can return: void, bool, or coroutine_handle<>
    auto await_suspend(std::coroutine_handle<> handle);

    // Get the result when resuming
    auto await_resume();
};
```

### Simple Awaitable Example

```cpp
#include <coroutine>
#include <chrono>
#include <thread>
#include <iostream>

// Awaitable that simulates async delay
struct AsyncDelay {
    std::chrono::milliseconds duration;

    bool await_ready() const noexcept {
        // Return true if duration is zero (no wait needed)
        return duration.count() <= 0;
    }

    void await_suspend(std::coroutine_handle<> handle) const {
        // Launch a thread to resume after delay
        std::thread([handle, d = duration]() {
            std::this_thread::sleep_for(d);
            handle.resume();
        }).detach();
    }

    void await_resume() const noexcept {
        // Nothing to return
    }
};

// Helper function
AsyncDelay delay(std::chrono::milliseconds ms) {
    return AsyncDelay{ms};
}

// Usage requires a Task type that supports co_await
template<typename T = void>
struct Task {
    struct promise_type {
        std::exception_ptr exception;

        Task get_return_object() {
            return Task{handle_type::from_promise(*this)};
        }

        std::suspend_never initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        void return_void() noexcept {}

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle;

    explicit Task(handle_type h) : handle(h) {}
    ~Task() { if (handle) handle.destroy(); }
};

Task<> async_example() {
    std::cout << "Starting...\n";
    co_await delay(std::chrono::milliseconds(100));
    std::cout << "After 100ms\n";
    co_await delay(std::chrono::milliseconds(200));
    std::cout << "After another 200ms\n";
}

int main() {
    auto task = async_example();
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    return 0;
}
```

### Awaitable with Return Value

```cpp
#include <coroutine>
#include <optional>
#include <thread>
#include <future>

template<typename T>
struct AsyncValue {
    std::future<T> future;

    bool await_ready() const noexcept {
        // Check if result is already available
        return future.wait_for(std::chrono::seconds(0)) ==
               std::future_status::ready;
    }

    void await_suspend(std::coroutine_handle<> handle) {
        // Wait for future in background thread, then resume
        std::thread([this, handle]() {
            future.wait();
            handle.resume();
        }).detach();
    }

    T await_resume() {
        return future.get();
    }
};

template<typename T>
AsyncValue<T> make_async(std::future<T> f) {
    return AsyncValue<T>{std::move(f)};
}

// Example computation
int expensive_computation(int x) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return x * x;
}
```

### Conditional Suspension

The `await_suspend` method can return different types:

```cpp
struct ConditionalAwaitable {
    bool should_suspend;
    int value;

    bool await_ready() const noexcept {
        return !should_suspend;
    }

    // Return bool: false means resume immediately
    bool await_suspend(std::coroutine_handle<>) const noexcept {
        return should_suspend;  // true = actually suspend
    }

    int await_resume() const noexcept {
        return value;
    }
};

// Another pattern: return a different handle to resume
struct TransferringAwaitable {
    std::coroutine_handle<> next;

    bool await_ready() const noexcept { return false; }

    // Return handle: that coroutine is resumed instead
    std::coroutine_handle<> await_suspend(std::coroutine_handle<>) const noexcept {
        return next;  // Transfer control to 'next'
    }

    void await_resume() const noexcept {}
};
```

---

## Implementing Async Tasks

A Task represents an asynchronous computation that produces a result. Let's build a full-featured Task type:

### Complete Task Implementation

```cpp
#include <coroutine>
#include <exception>
#include <optional>
#include <variant>
#include <utility>

template<typename T = void>
class Task;

// Specialization for non-void types
template<typename T>
class Task {
public:
    struct promise_type {
        std::variant<std::monostate, T, std::exception_ptr> result;
        std::coroutine_handle<> continuation;

        Task get_return_object() {
            return Task{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept { return {}; }

        auto final_suspend() noexcept {
            struct FinalAwaiter {
                bool await_ready() const noexcept { return false; }

                std::coroutine_handle<> await_suspend(
                    std::coroutine_handle<promise_type> h) noexcept {
                    if (h.promise().continuation) {
                        return h.promise().continuation;
                    }
                    return std::noop_coroutine();
                }

                void await_resume() noexcept {}
            };
            return FinalAwaiter{};
        }

        void return_value(T value) {
            result.template emplace<1>(std::move(value));
        }

        void unhandled_exception() {
            result.template emplace<2>(std::current_exception());
        }
    };

    using handle_type = std::coroutine_handle<promise_type>;

private:
    handle_type handle_;

public:
    explicit Task(handle_type h) : handle_(h) {}

    ~Task() {
        if (handle_) {
            handle_.destroy();
        }
    }

    Task(Task&& other) noexcept : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    Task& operator=(Task&& other) noexcept {
        if (this != &other) {
            if (handle_) handle_.destroy();
            handle_ = other.handle_;
            other.handle_ = nullptr;
        }
        return *this;
    }

    Task(const Task&) = delete;
    Task& operator=(const Task&) = delete;

    // Make Task awaitable
    bool await_ready() const noexcept {
        return handle_.done();
    }

    std::coroutine_handle<> await_suspend(std::coroutine_handle<> caller) {
        handle_.promise().continuation = caller;
        return handle_;
    }

    T await_resume() {
        auto& result = handle_.promise().result;
        if (std::holds_alternative<std::exception_ptr>(result)) {
            std::rethrow_exception(std::get<std::exception_ptr>(result));
        }
        return std::get<T>(std::move(result));
    }

    // Synchronous wait
    T get() {
        while (!handle_.done()) {
            handle_.resume();
        }
        return await_resume();
    }

    bool done() const noexcept {
        return handle_.done();
    }

    void resume() {
        if (!handle_.done()) {
            handle_.resume();
        }
    }
};

// Specialization for void
template<>
class Task<void> {
public:
    struct promise_type {
        std::exception_ptr exception;
        std::coroutine_handle<> continuation;

        Task get_return_object() {
            return Task{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept { return {}; }

        auto final_suspend() noexcept {
            struct FinalAwaiter {
                bool await_ready() const noexcept { return false; }

                std::coroutine_handle<> await_suspend(
                    std::coroutine_handle<promise_type> h) noexcept {
                    if (h.promise().continuation) {
                        return h.promise().continuation;
                    }
                    return std::noop_coroutine();
                }

                void await_resume() noexcept {}
            };
            return FinalAwaiter{};
        }

        void return_void() noexcept {}

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    using handle_type = std::coroutine_handle<promise_type>;

private:
    handle_type handle_;

public:
    explicit Task(handle_type h) : handle_(h) {}

    ~Task() {
        if (handle_) {
            handle_.destroy();
        }
    }

    Task(Task&& other) noexcept : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    Task& operator=(Task&& other) noexcept {
        if (this != &other) {
            if (handle_) handle_.destroy();
            handle_ = other.handle_;
            other.handle_ = nullptr;
        }
        return *this;
    }

    Task(const Task&) = delete;
    Task& operator=(const Task&) = delete;

    bool await_ready() const noexcept {
        return handle_.done();
    }

    std::coroutine_handle<> await_suspend(std::coroutine_handle<> caller) {
        handle_.promise().continuation = caller;
        return handle_;
    }

    void await_resume() {
        if (handle_.promise().exception) {
            std::rethrow_exception(handle_.promise().exception);
        }
    }

    void get() {
        while (!handle_.done()) {
            handle_.resume();
        }
        await_resume();
    }

    bool done() const noexcept {
        return handle_.done();
    }

    void resume() {
        if (!handle_.done()) {
            handle_.resume();
        }
    }
};
```

### Using Async Tasks

```cpp
#include <iostream>
#include <string>

Task<int> async_add(int a, int b) {
    co_return a + b;
}

Task<int> async_multiply(int a, int b) {
    co_return a * b;
}

Task<int> complex_calculation() {
    int sum = co_await async_add(10, 20);
    int product = co_await async_multiply(sum, 2);
    co_return product;
}

Task<std::string> async_greeting(std::string name) {
    co_return "Hello, " + name + "!";
}

Task<> print_greeting() {
    std::string greeting = co_await async_greeting("World");
    std::cout << greeting << '\n';
}

int main() {
    // Synchronous execution
    auto task = complex_calculation();
    int result = task.get();
    std::cout << "Result: " << result << '\n';  // Output: 60

    // Void task
    auto greeting_task = print_greeting();
    greeting_task.get();  // Output: Hello, World!

    return 0;
}
```

### Exception Handling in Tasks

```cpp
#include <stdexcept>

Task<int> may_throw(bool should_throw) {
    if (should_throw) {
        throw std::runtime_error("Something went wrong!");
    }
    co_return 42;
}

Task<int> handle_exceptions() {
    try {
        int result = co_await may_throw(true);
        co_return result;
    } catch (const std::exception& e) {
        std::cout << "Caught: " << e.what() << '\n';
        co_return -1;
    }
}

int main() {
    auto task = handle_exceptions();
    int result = task.get();
    std::cout << "Result: " << result << '\n';  // Output: -1

    return 0;
}
```

---

## Symmetric Transfer

Symmetric transfer is an optimization that avoids stack overflow when chaining many coroutines. Instead of resuming a coroutine which then returns back through a chain of callers, control is transferred directly.

### The Problem

```cpp
// Without symmetric transfer, each co_await adds a stack frame
Task<int> deep_recursion(int n) {
    if (n == 0) co_return 0;
    co_return n + co_await deep_recursion(n - 1);  // Stack grows!
}
// This may cause stack overflow for large n
```

### The Solution

Symmetric transfer allows `await_suspend` to return a `coroutine_handle<>`, which the runtime resumes directly without growing the stack:

```cpp
#include <coroutine>

template<typename T>
class SymmetricTask {
public:
    struct promise_type {
        T result;
        std::coroutine_handle<> continuation;

        SymmetricTask get_return_object() {
            return SymmetricTask{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept { return {}; }

        // Key: final_suspend returns the continuation handle
        auto final_suspend() noexcept {
            struct FinalAwaiter {
                bool await_ready() const noexcept { return false; }

                // Symmetric transfer: directly resume continuation
                std::coroutine_handle<> await_suspend(
                    std::coroutine_handle<promise_type> h) noexcept {
                    auto continuation = h.promise().continuation;
                    if (continuation) {
                        return continuation;  // Transfer to continuation
                    }
                    return std::noop_coroutine();  // Nothing to resume
                }

                void await_resume() noexcept {}
            };
            return FinalAwaiter{};
        }

        void return_value(T value) { result = std::move(value); }
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

private:
    handle_type handle_;

public:
    explicit SymmetricTask(handle_type h) : handle_(h) {}
    ~SymmetricTask() { if (handle_) handle_.destroy(); }

    // Move-only
    SymmetricTask(SymmetricTask&& o) noexcept : handle_(o.handle_) {
        o.handle_ = nullptr;
    }
    SymmetricTask& operator=(SymmetricTask&& o) noexcept {
        if (this != &o) {
            if (handle_) handle_.destroy();
            handle_ = o.handle_;
            o.handle_ = nullptr;
        }
        return *this;
    }

    // Awaitable interface
    bool await_ready() const noexcept { return false; }

    // Symmetric transfer when awaiting
    std::coroutine_handle<> await_suspend(std::coroutine_handle<> caller) {
        handle_.promise().continuation = caller;
        return handle_;  // Transfer to this task
    }

    T await_resume() {
        return std::move(handle_.promise().result);
    }

    T get() {
        while (!handle_.done()) {
            handle_.resume();
        }
        return await_resume();
    }
};

// Now this is safe for any depth
SymmetricTask<int> safe_recursion(int n) {
    if (n == 0) co_return 0;
    co_return n + co_await safe_recursion(n - 1);
}

int main() {
    auto task = safe_recursion(10000);  // Safe!
    std::cout << "Sum: " << task.get() << '\n';
    return 0;
}
```

### std::noop_coroutine

When there's no continuation to resume, return `std::noop_coroutine()`:

```cpp
#include <coroutine>

// noop_coroutine is a coroutine that does nothing when resumed
std::coroutine_handle<> await_suspend(std::coroutine_handle<> h) noexcept {
    if (has_continuation()) {
        return continuation_;
    }
    // No continuation - return noop_coroutine to prevent resuming null handle
    return std::noop_coroutine();
}
```

---

## Coroutine Customization Points

The promise type provides several customization points to control coroutine behavior.

### await_transform

Intercept and transform all `co_await` expressions:

```cpp
struct LoggingPromise {
    // ... other promise members ...

    // Transform all awaits to add logging
    template<typename T>
    auto await_transform(T&& awaitable) {
        std::cout << "About to await\n";
        return std::forward<T>(awaitable);
    }

    // Can also return a different awaitable
    template<typename T>
    auto await_transform(std::optional<T> opt) {
        struct OptionalAwaiter {
            std::optional<T> value;

            bool await_ready() const noexcept {
                return value.has_value();
            }

            void await_suspend(std::coroutine_handle<>) const {
                throw std::runtime_error("Empty optional!");
            }

            T await_resume() {
                return *value;
            }
        };
        return OptionalAwaiter{std::move(opt)};
    }
};
```

### yield_value

Control `co_yield` behavior:

```cpp
template<typename T>
struct StreamingPromise {
    std::vector<T> buffer;
    static constexpr size_t BATCH_SIZE = 100;

    // Buffer yields and flush when full
    std::suspend_never yield_value(T value) {
        buffer.push_back(std::move(value));
        if (buffer.size() >= BATCH_SIZE) {
            flush_buffer();
        }
        return {};  // Don't suspend for individual yields
    }

    // Special marker to force flush
    struct FlushMarker {};
    std::suspend_always yield_value(FlushMarker) {
        flush_buffer();
        return {};
    }

    void flush_buffer() {
        // Process buffer
        buffer.clear();
    }
};
```

### get_return_object_on_allocation_failure

Handle allocation failures gracefully:

```cpp
template<typename T>
struct FallibleTask {
    struct promise_type {
        // Called if operator new fails
        static FallibleTask get_return_object_on_allocation_failure() {
            return FallibleTask{nullptr};  // Return empty task
        }

        FallibleTask get_return_object() {
            return FallibleTask{handle_type::from_promise(*this)};
        }

        // ... rest of promise ...
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle_;

    explicit operator bool() const { return handle_ != nullptr; }
};
```

### Custom Allocators

Control coroutine frame allocation:

```cpp
#include <memory_resource>

template<typename T>
struct PoolAllocatedTask {
    struct promise_type {
        // Custom allocation
        void* operator new(std::size_t size) {
            return memory_pool.allocate(size);
        }

        void operator delete(void* ptr) {
            memory_pool.deallocate(ptr, 0);
        }

        // With allocator argument
        template<typename... Args>
        void* operator new(std::size_t size, std::allocator_arg_t,
                          std::pmr::memory_resource* resource, Args&&...) {
            return resource->allocate(size);
        }

        // ... rest of promise ...

    private:
        static inline std::pmr::synchronized_pool_resource memory_pool;
    };
};
```

---

## Practical Patterns and Examples

### Async File Reader

```cpp
#include <coroutine>
#include <fstream>
#include <string>
#include <thread>
#include <functional>

// Simulated async file read
struct AsyncFileRead {
    std::string filename;
    std::string* result;

    bool await_ready() const noexcept { return false; }

    void await_suspend(std::coroutine_handle<> handle) {
        std::thread([this, handle]() {
            std::ifstream file(filename);
            if (file) {
                std::string content((std::istreambuf_iterator<char>(file)),
                                     std::istreambuf_iterator<char>());
                *result = std::move(content);
            }
            handle.resume();
        }).detach();
    }

    std::string await_resume() {
        return std::move(*result);
    }
};

Task<std::string> read_file_async(const std::string& filename) {
    std::string result;
    co_await AsyncFileRead{filename, &result};
    co_return result;
}

Task<std::string> process_files() {
    auto content1 = co_await read_file_async("file1.txt");
    auto content2 = co_await read_file_async("file2.txt");
    co_return content1 + "\n" + content2;
}
```

### Event Loop Integration

```cpp
#include <coroutine>
#include <queue>
#include <functional>

class EventLoop {
    std::queue<std::coroutine_handle<>> ready_queue;

public:
    void schedule(std::coroutine_handle<> handle) {
        ready_queue.push(handle);
    }

    void run() {
        while (!ready_queue.empty()) {
            auto handle = ready_queue.front();
            ready_queue.pop();

            if (!handle.done()) {
                handle.resume();
            }
        }
    }

    // Awaitable to yield to event loop
    struct YieldAwaitable {
        EventLoop& loop;

        bool await_ready() const noexcept { return false; }

        void await_suspend(std::coroutine_handle<> handle) {
            loop.schedule(handle);  // Re-schedule for later
        }

        void await_resume() noexcept {}
    };

    YieldAwaitable yield() {
        return YieldAwaitable{*this};
    }
};

// Global event loop (in practice, use better lifetime management)
EventLoop& get_event_loop() {
    static EventLoop loop;
    return loop;
}

Task<> cooperative_task(int id) {
    for (int i = 0; i < 3; ++i) {
        std::cout << "Task " << id << " step " << i << '\n';
        co_await get_event_loop().yield();
    }
}

int main() {
    auto& loop = get_event_loop();

    // Start multiple tasks
    auto task1 = cooperative_task(1);
    auto task2 = cooperative_task(2);

    // Schedule initial resumption
    // (In practice, tasks would auto-schedule on creation)
    loop.schedule(/* task1's handle */);
    loop.schedule(/* task2's handle */);

    loop.run();
    return 0;
}
```

### Lazy Async Pipeline

```cpp
#include <coroutine>
#include <vector>
#include <functional>

template<typename T>
class AsyncGenerator {
public:
    struct promise_type {
        T current_value;
        std::exception_ptr exception;
        std::coroutine_handle<> consumer;

        AsyncGenerator get_return_object() {
            return AsyncGenerator{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        auto yield_value(T value) {
            current_value = std::move(value);
            return std::suspend_always{};
        }

        void return_void() noexcept {}
        void unhandled_exception() { exception = std::current_exception(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

private:
    handle_type handle_;

public:
    explicit AsyncGenerator(handle_type h) : handle_(h) {}
    ~AsyncGenerator() { if (handle_) handle_.destroy(); }

    AsyncGenerator(AsyncGenerator&& o) noexcept : handle_(o.handle_) {
        o.handle_ = nullptr;
    }

    // Awaitable to get next value
    struct NextAwaitable {
        handle_type handle;

        bool await_ready() const noexcept { return false; }

        std::coroutine_handle<> await_suspend(std::coroutine_handle<> consumer) {
            handle.promise().consumer = consumer;
            return handle;
        }

        std::optional<T> await_resume() {
            if (handle.done()) {
                return std::nullopt;
            }
            return std::move(handle.promise().current_value);
        }
    };

    NextAwaitable next() {
        return NextAwaitable{handle_};
    }
};

// Async data source
AsyncGenerator<int> async_data_source() {
    for (int i = 1; i <= 5; ++i) {
        // Simulate async fetch
        co_yield i;
    }
}

// Transform async stream
template<typename T, typename U>
AsyncGenerator<U> async_map(AsyncGenerator<T> source, std::function<U(T)> func) {
    while (auto value = co_await source.next()) {
        co_yield func(*value);
    }
}
```

### Retry with Backoff

```cpp
#include <chrono>
#include <random>

template<typename T>
Task<T> with_retry(Task<T> (*operation)(), int max_attempts = 3) {
    std::random_device rd;
    std::mt19937 gen(rd());

    for (int attempt = 1; attempt <= max_attempts; ++attempt) {
        try {
            co_return co_await operation();
        } catch (const std::exception& e) {
            if (attempt == max_attempts) {
                throw;  // Re-throw on last attempt
            }

            // Exponential backoff with jitter
            int base_delay = 100 * (1 << attempt);  // 200, 400, 800ms...
            std::uniform_int_distribution<> jitter(0, base_delay / 2);
            int delay = base_delay + jitter(gen);

            std::cout << "Attempt " << attempt << " failed: " << e.what()
                      << ". Retrying in " << delay << "ms\n";

            co_await delay_ms(delay);
        }
    }

    // Should never reach here
    throw std::runtime_error("Unexpected execution path");
}
```

### Timeout Wrapper

```cpp
#include <chrono>
#include <optional>

template<typename T>
Task<std::optional<T>> with_timeout(Task<T> task,
                                     std::chrono::milliseconds timeout) {
    // Race between task completion and timeout
    // Implementation depends on your async runtime

    // Simplified version - in practice you'd use a proper timer
    auto start = std::chrono::steady_clock::now();

    while (!task.done()) {
        auto elapsed = std::chrono::steady_clock::now() - start;
        if (elapsed >= timeout) {
            co_return std::nullopt;  // Timeout
        }
        task.resume();
        co_await std::suspend_always{};  // Yield to event loop
    }

    co_return task.get();
}
```

---

## Best Practices and Performance

### Memory Management

Coroutine frames are typically heap-allocated. To optimize:

```cpp
// 1. Use custom allocators for frequently created coroutines
template<typename T>
struct PooledTask {
    struct promise_type {
        static void* operator new(std::size_t size) {
            return coroutine_pool.allocate(size);
        }

        static void operator delete(void* ptr, std::size_t size) {
            coroutine_pool.deallocate(ptr, size);
        }

        // ... rest of promise ...
    };
};

// 2. Prefer returning by value for small types
Task<int> good() { co_return 42; }  // Good: small return value

// 3. Use move semantics for large objects
Task<std::vector<int>> move_result() {
    std::vector<int> v(10000);
    // ... fill v ...
    co_return std::move(v);  // Explicit move
}
```

### Avoiding Common Pitfalls

```cpp
// WRONG: Dangling reference
Task<int> dangling_reference() {
    int local = 42;
    co_await some_async_operation();  // Suspends here
    co_return local;  // 'local' is still valid (in coroutine frame)
}

// WRONG: Capturing local by reference in lambda passed to thread
Task<> dangerous_capture() {
    int value = 42;
    // This lambda will outlive 'value' if thread runs after coroutine returns
    std::thread([&value]() {  // DANGER!
        std::cout << value;
    }).detach();
    co_return;
}

// CORRECT: Capture by value
Task<> safe_capture() {
    int value = 42;
    std::thread([value]() {  // Safe: copied
        std::cout << value;
    }).detach();
    co_return;
}
```

### Guidelines for Efficient Coroutines

1. **Use `std::suspend_never` for `initial_suspend` when possible**: Avoids unnecessary suspension overhead.

```cpp
// Eager start - coroutine runs immediately until first suspension
std::suspend_never initial_suspend() noexcept { return {}; }

// Lazy start - coroutine suspends immediately, caller must resume
std::suspend_always initial_suspend() noexcept { return {}; }
```

2. **Prefer `std::suspend_always` for `final_suspend`**: Allows safe destruction and result retrieval.

```cpp
// Safe: coroutine stays alive for result retrieval
std::suspend_always final_suspend() noexcept { return {}; }

// Risky: coroutine frame destroyed before you can get result
std::suspend_never final_suspend() noexcept { return {}; }
```

3. **Use symmetric transfer**: Prevents stack overflow in deeply nested coroutine chains.

4. **Profile before optimizing**: Use profilers to identify actual bottlenecks.

### Debugging Coroutines

```cpp
#include <iostream>
#include <source_location>

// Debug helper
template<typename T>
struct DebugTask {
    struct promise_type {
        std::source_location location;

        DebugTask get_return_object() {
            std::cout << "Coroutine created at "
                      << location.file_name() << ":"
                      << location.line() << '\n';
            return DebugTask{handle_type::from_promise(*this)};
        }

        std::suspend_always initial_suspend() noexcept {
            std::cout << "Initial suspend\n";
            return {};
        }

        std::suspend_always final_suspend() noexcept {
            std::cout << "Final suspend\n";
            return {};
        }

        void return_value(T value) {
            std::cout << "Returning value\n";
        }

        void unhandled_exception() {
            std::cout << "Exception caught in coroutine\n";
        }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle_;

    // ... rest of implementation ...
};
```

---

## Summary

C++20 coroutines provide a powerful foundation for:

| Use Case | Key Components |
|----------|----------------|
| **Generators** | `co_yield`, lazy evaluation, range-based iteration |
| **Async Tasks** | `co_await`, `co_return`, continuation passing |
| **Event-Driven Code** | Custom awaitables, event loop integration |
| **State Machines** | Suspension points as states, clean control flow |
| **Pipelines** | Composable async/lazy transformations |

### Key Takeaways

1. **Three keywords**: `co_await` (suspend until ready), `co_yield` (produce value and suspend), `co_return` (complete coroutine)

2. **Promise type controls behavior**: Customize `initial_suspend`, `final_suspend`, `return_value`, `yield_value`, and `await_transform`

3. **Awaitables have three methods**: `await_ready`, `await_suspend`, `await_resume`

4. **Symmetric transfer prevents stack overflow**: Return `coroutine_handle<>` from `await_suspend`

5. **RAII applies to coroutine handles**: Always destroy handles to prevent memory leaks

6. **Exception handling works naturally**: Use try-catch in coroutines, check `unhandled_exception` in promise

### Compiler Support

All major compilers fully support C++20 coroutines:

- **GCC**: Full support since GCC 10+
- **Clang**: Full support since Clang 14+
- **MSVC**: Full support since Visual Studio 2019 16.8+

Enable with:
- GCC/Clang: `-std=c++20 -fcoroutines`
- MSVC: `/std:c++20`

### Further Resources

While C++20 provides the low-level coroutine machinery, several libraries build upon it:

- **cppcoro**: Comprehensive coroutine library with task types, generators, and synchronization primitives
- **libunifex**: Unified executors and coroutines for structured concurrency
- **Boost.Asio**: Async I/O with coroutine integration

Coroutines unlock new patterns for writing clean, efficient, and maintainable asynchronous code in C++. Start with simple generators, progress to async tasks, and explore the rich ecosystem of coroutine-based libraries.
