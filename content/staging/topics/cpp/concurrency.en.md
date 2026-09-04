---
title: C++ Concurrent Programming
description: "Deep dive into C++ concurrency: threads, mutexes, condition variables and atomics"
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - Concurrency
  - Threads
  - Atomics
status: imported
origin: old/src/content/docs/cpp/concurrency.en.md
divergence: 0.089
issues: []
legacy:
  category: Cpp
  subcategory: Concurrency
  order: 7
  lastUpdated: 2026-01-07
---

Concurrency is one of the most powerful yet challenging aspects of modern C++ programming. Since C++11, the standard library has provided robust built-in support for multithreading, synchronization primitives, and lock-free programming. We'll explore the essential components of C++ concurrency, from basic thread management to advanced atomic operations and coroutines.

## Introduction to Concurrency

Concurrency allows multiple tasks to make progress simultaneously, either through true parallelism on multi-core processors or through interleaved execution on a single core. C++ provides two main approaches:

- **Task-based concurrency**: Using high-level abstractions like `std::async` and `std::future`
- **Thread-based concurrency**: Direct thread management with `std::thread`

The key challenges in concurrent programming include:
- **Race conditions**: Multiple threads accessing shared data simultaneously
- **Deadlocks**: Threads waiting indefinitely for each other
- **Data races**: Undefined behavior from unsynchronized concurrent access
- **Performance overhead**: Synchronization costs and contention

## std::thread - Thread Management

### Creating and Joining Threads

The `std::thread` class represents a single thread of execution. Threads begin execution immediately upon construction.

```cpp
#include <iostream>
#include <thread>
#include <chrono>

void worker_function(int id) {
    std::cout << "Thread " << id << " starting\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    std::cout << "Thread " << id << " finished\n";
}

int main() {
    // Create threads
    std::thread t1(worker_function, 1);
    std::thread t2(worker_function, 2);

    // Lambda function in thread
    std::thread t3([]() {
        std::cout << "Lambda thread executing\n";
    });

    // Must join or detach before destruction
    t1.join();  // Wait for thread to complete
    t2.join();
    t3.join();

    return 0;
}
```

### Thread Management Operations

```cpp
#include <thread>
#include <iostream>

class ThreadManager {
public:
    void demonstrate() {
        std::thread t([]() {
            std::cout << "Worker thread ID: "
                      << std::this_thread::get_id() << '\n';
        });

        // Check if thread is joinable
        if (t.joinable()) {
            std::cout << "Thread is joinable\n";
        }

        // Get hardware concurrency
        unsigned int cores = std::thread::hardware_concurrency();
        std::cout << "Available cores: " << cores << '\n';

        // Detach thread (runs independently)
        // t.detach();  // Thread will run in background

        // Or join (wait for completion)
        t.join();
    }
};

int main() {
    ThreadManager tm;
    tm.demonstrate();
    return 0;
}
```

### Passing Arguments to Threads

```cpp
#include <thread>
#include <iostream>
#include <string>

void print_string(const std::string& str, int count) {
    for (int i = 0; i < count; ++i) {
        std::cout << str << " ";
    }
    std::cout << '\n';
}

void modify_value(int& value) {
    value *= 2;
}

int main() {
    // Pass by value
    std::thread t1(print_string, "Hello", 3);

    // Pass by reference (use std::ref)
    int num = 5;
    std::thread t2(modify_value, std::ref(num));

    t1.join();
    t2.join();

    std::cout << "Modified value: " << num << '\n';  // Output: 10

    return 0;
}
```

## Mutex Family - Mutual Exclusion

Mutexes (mutual exclusion objects) protect shared data from concurrent access.

### std::mutex - Basic Mutex

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>

class Counter {
private:
    int value = 0;
    std::mutex mtx;

public:
    void increment() {
        mtx.lock();
        ++value;
        mtx.unlock();
    }

    // Better: use RAII with lock_guard
    void safe_increment() {
        std::lock_guard<std::mutex> lock(mtx);
        ++value;
        // Automatically unlocks when lock goes out of scope
    }

    int get_value() {
        std::lock_guard<std::mutex> lock(mtx);
        return value;
    }
};

int main() {
    Counter counter;
    std::vector<std::thread> threads;

    // Create 10 threads, each incrementing 1000 times
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < 1000; ++j) {
                counter.safe_increment();
            }
        });
    }

    // Wait for all threads
    for (auto& t : threads) {
        t.join();
    }

    std::cout << "Final count: " << counter.get_value() << '\n';
    // Output: Final count: 10000

    return 0;
}
```

### std::recursive_mutex - Reentrant Mutex

```cpp
#include <mutex>
#include <iostream>

class RecursiveCounter {
private:
    int value = 0;
    std::recursive_mutex mtx;

public:
    void increment() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        ++value;
    }

    void increment_by(int n) {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        for (int i = 0; i < n; ++i) {
            increment();  // Can lock again (recursive)
        }
    }

    int get_value() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        return value;
    }
};
```

### std::shared_mutex - Reader-Writer Lock (C++17)

```cpp
#include <shared_mutex>
#include <map>
#include <string>
#include <thread>
#include <iostream>

class ThreadSafeMap {
private:
    std::map<std::string, int> data;
    mutable std::shared_mutex mutex;

public:
    // Multiple readers can acquire shared lock
    int read(const std::string& key) const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        auto it = data.find(key);
        return (it != data.end()) ? it->second : 0;
    }

    // Writers need exclusive lock
    void write(const std::string& key, int value) {
        std::unique_lock<std::shared_mutex> lock(mutex);
        data[key] = value;
    }

    size_t size() const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        return data.size();
    }
};

int main() {
    ThreadSafeMap map;

    // Writer thread
    std::thread writer([&map]() {
        for (int i = 0; i < 100; ++i) {
            map.write("key" + std::to_string(i), i);
        }
    });

    // Multiple reader threads
    std::vector<std::thread> readers;
    for (int i = 0; i < 5; ++i) {
        readers.emplace_back([&map, i]() {
            for (int j = 0; j < 50; ++j) {
                int value = map.read("key" + std::to_string(j));
                // Readers can run concurrently
            }
        });
    }

    writer.join();
    for (auto& r : readers) {
        r.join();
    }

    std::cout << "Map size: " << map.size() << '\n';

    return 0;
}
```

### std::unique_lock - Flexible Locking

```cpp
#include <mutex>
#include <iostream>
#include <thread>

class BankAccount {
private:
    double balance;
    std::mutex mtx;

public:
    BankAccount(double initial) : balance(initial) {}

    bool transfer(BankAccount& other, double amount) {
        // Acquire both locks without deadlock
        std::unique_lock<std::mutex> lock1(mtx, std::defer_lock);
        std::unique_lock<std::mutex> lock2(other.mtx, std::defer_lock);

        // Lock both simultaneously
        std::lock(lock1, lock2);

        if (balance >= amount) {
            balance -= amount;
            other.balance += amount;
            return true;
        }
        return false;
    }

    // Demonstrates advanced unique_lock features
    void complex_operation() {
        std::unique_lock<std::mutex> lock(mtx);

        // Can unlock temporarily
        lock.unlock();

        // Do some work without holding lock
        std::this_thread::sleep_for(std::chrono::milliseconds(10));

        // Relock
        lock.lock();

        // Lock is automatically released when destroyed
    }

    double get_balance() {
        std::lock_guard<std::mutex> lock(mtx);
        return balance;
    }
};
```

### std::scoped_lock - Multiple Mutex Locking (C++17)

```cpp
#include <mutex>
#include <iostream>

class SafeTransfer {
private:
    struct Account {
        double balance;
        std::mutex mtx;
        Account(double b) : balance(b) {}
    };

public:
    static void transfer(Account& from, Account& to, double amount) {
        // Acquire multiple locks safely (deadlock-free)
        std::scoped_lock lock(from.mtx, to.mtx);

        if (from.balance >= amount) {
            from.balance -= amount;
            to.balance += amount;
        }
    }
};
```

## Condition Variables - Thread Coordination

Condition variables allow threads to wait for specific conditions and be notified when those conditions change.

### Basic Producer-Consumer Pattern

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
    std::queue<T> queue;
    mutable std::mutex mutex;
    std::condition_variable cv;

public:
    void push(T value) {
        {
            std::lock_guard<std::mutex> lock(mutex);
            queue.push(std::move(value));
        }
        cv.notify_one();  // Notify one waiting thread
    }

    bool pop(T& value) {
        std::unique_lock<std::mutex> lock(mutex);

        // Wait until queue is not empty
        cv.wait(lock, [this]() { return !queue.empty(); });

        value = std::move(queue.front());
        queue.pop();
        return true;
    }

    bool try_pop(T& value, std::chrono::milliseconds timeout) {
        std::unique_lock<std::mutex> lock(mutex);

        // Wait with timeout
        if (cv.wait_for(lock, timeout, [this]() { return !queue.empty(); })) {
            value = std::move(queue.front());
            queue.pop();
            return true;
        }
        return false;
    }

    bool empty() const {
        std::lock_guard<std::mutex> lock(mutex);
        return queue.empty();
    }
};

int main() {
    ThreadSafeQueue<int> queue;

    // Producer thread
    std::thread producer([&queue]() {
        for (int i = 0; i < 10; ++i) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            std::cout << "Producing: " << i << '\n';
            queue.push(i);
        }
    });

    // Consumer thread
    std::thread consumer([&queue]() {
        for (int i = 0; i < 10; ++i) {
            int value;
            queue.pop(value);
            std::cout << "Consuming: " << value << '\n';
        }
    });

    producer.join();
    consumer.join();

    return 0;
}
```

### Advanced Condition Variable Usage

```cpp
#include <condition_variable>
#include <mutex>
#include <iostream>
#include <thread>
#include <vector>

class Barrier {
private:
    std::mutex mutex;
    std::condition_variable cv;
    size_t threshold;
    size_t count = 0;
    size_t generation = 0;

public:
    explicit Barrier(size_t threshold) : threshold(threshold) {}

    void wait() {
        std::unique_lock<std::mutex> lock(mutex);
        size_t gen = generation;

        if (++count >= threshold) {
            // All threads arrived
            generation++;
            count = 0;
            cv.notify_all();
        } else {
            // Wait for all threads
            cv.wait(lock, [this, gen]() { return gen != generation; });
        }
    }
};

// Example usage: synchronize multiple threads
void worker(int id, Barrier& barrier) {
    std::cout << "Thread " << id << " phase 1\n";

    barrier.wait();  // Synchronization point

    std::cout << "Thread " << id << " phase 2\n";
}

int main() {
    const int num_threads = 5;
    Barrier barrier(num_threads);

    std::vector<std::thread> threads;
    for (int i = 0; i < num_threads; ++i) {
        threads.emplace_back(worker, i, std::ref(barrier));
    }

    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

## Atomic Operations - Lock-Free Programming

Atomic operations provide thread-safe access to shared variables without locks, enabling high-performance lock-free algorithms.

### Basic Atomic Types

```cpp
#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

class AtomicCounter {
private:
    std::atomic<int> counter{0};

public:
    void increment() {
        counter.fetch_add(1, std::memory_order_relaxed);
    }

    void decrement() {
        counter.fetch_sub(1, std::memory_order_relaxed);
    }

    int get() const {
        return counter.load(std::memory_order_relaxed);
    }

    // Atomic compare-and-swap
    bool compare_and_set(int expected, int desired) {
        return counter.compare_exchange_strong(
            expected, desired,
            std::memory_order_release,
            std::memory_order_acquire
        );
    }
};

int main() {
    AtomicCounter counter;
    std::vector<std::thread> threads;

    // Create 10 threads incrementing
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < 1000; ++j) {
                counter.increment();
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "Final count: " << counter.get() << '\n';
    // Output: Final count: 10000

    return 0;
}
```

### Memory Ordering

```cpp
#include <atomic>
#include <thread>
#include <iostream>
#include <cassert>

class SpinLock {
private:
    std::atomic<bool> flag{false};

public:
    void lock() {
        // Acquire semantics: prevents reordering
        while (flag.exchange(true, std::memory_order_acquire)) {
            // Spin until we acquire the lock
            while (flag.load(std::memory_order_relaxed)) {
                // Reduce contention
                std::this_thread::yield();
            }
        }
    }

    void unlock() {
        // Release semantics: makes writes visible
        flag.store(false, std::memory_order_release);
    }
};

// Sequential consistency example
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

int main() {
    std::thread t1(write_x);
    std::thread t2(write_y);
    std::thread t3(read_x_then_y);
    std::thread t4(read_y_then_x);

    t1.join(); t2.join(); t3.join(); t4.join();

    // With sequential consistency, z must be non-zero
    assert(z.load() != 0);
    std::cout << "z = " << z.load() << '\n';

    return 0;
}
```

### Lock-Free Stack

```cpp
#include <atomic>
#include <memory>
#include <iostream>

template<typename T>
class LockFreeStack {
private:
    struct Node {
        T data;
        Node* next;
        Node(const T& data) : data(data), next(nullptr) {}
    };

    std::atomic<Node*> head{nullptr};

public:
    ~LockFreeStack() {
        while (Node* node = head.load()) {
            head.store(node->next);
            delete node;
        }
    }

    void push(const T& data) {
        Node* new_node = new Node(data);
        new_node->next = head.load(std::memory_order_relaxed);

        // CAS loop: retry until successful
        while (!head.compare_exchange_weak(
            new_node->next,
            new_node,
            std::memory_order_release,
            std::memory_order_relaxed
        )) {
            // new_node->next is updated by compare_exchange_weak on failure
        }
    }

    bool pop(T& result) {
        Node* old_head = head.load(std::memory_order_relaxed);

        while (old_head && !head.compare_exchange_weak(
            old_head,
            old_head->next,
            std::memory_order_acquire,
            std::memory_order_relaxed
        )) {
            // Retry with updated old_head
        }

        if (old_head) {
            result = old_head->data;
            delete old_head;
            return true;
        }
        return false;
    }
};

int main() {
    LockFreeStack<int> stack;

    // Push elements
    for (int i = 0; i < 5; ++i) {
        stack.push(i);
    }

    // Pop elements
    int value;
    while (stack.pop(value)) {
        std::cout << "Popped: " << value << '\n';
    }

    return 0;
}
```

## Future and Promise - Asynchronous Programming

Futures and promises provide a mechanism for asynchronous task execution and result retrieval.

### std::async - Quick Async Execution

```cpp
#include <future>
#include <iostream>
#include <vector>
#include <numeric>
#include <chrono>

// Compute-intensive function
long long compute_sum(int start, int end) {
    long long sum = 0;
    for (int i = start; i < end; ++i) {
        sum += i;
    }
    return sum;
}

int main() {
    // Launch async with policy
    auto future1 = std::async(std::launch::async, compute_sum, 0, 1000000);
    auto future2 = std::async(std::launch::async, compute_sum, 1000000, 2000000);

    // Do other work while computations run
    std::cout << "Computing in parallel...\n";

    // Get results (blocks until ready)
    long long result1 = future1.get();
    long long result2 = future2.get();

    std::cout << "Total sum: " << (result1 + result2) << '\n';

    // Launch policies:
    // std::launch::async - guaranteed new thread
    // std::launch::deferred - lazy evaluation
    // std::launch::async | std::launch::deferred - implementation choice

    auto deferred = std::async(std::launch::deferred, []() {
        std::cout << "Deferred execution\n";
        return 42;
    });

    std::cout << "Before get\n";
    int value = deferred.get();  // Executes here
    std::cout << "After get: " << value << '\n';

    return 0;
}
```

### std::promise and std::future

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <stdexcept>

void async_computation(std::promise<int> result_promise) {
    try {
        // Simulate work
        std::this_thread::sleep_for(std::chrono::seconds(1));

        // Set the result
        result_promise.set_value(42);
    } catch (...) {
        // Propagate exception
        result_promise.set_exception(std::current_exception());
    }
}

int main() {
    // Create promise and future
    std::promise<int> promise;
    std::future<int> future = promise.get_future();

    // Launch async task
    std::thread worker(async_computation, std::move(promise));

    std::cout << "Waiting for result...\n";

    // Wait for result
    int result = future.get();
    std::cout << "Result: " << result << '\n';

    worker.join();

    return 0;
}
```

### std::shared_future - Multiple Waiters

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <vector>

int main() {
    std::promise<int> promise;

    // shared_future allows multiple threads to wait
    std::shared_future<int> shared_future = promise.get_future().share();

    // Multiple readers
    std::vector<std::thread> threads;
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([shared_future, i]() {
            int value = shared_future.get();  // All can call get()
            std::cout << "Thread " << i << " got: " << value << '\n';
        });
    }

    // Set value after a delay
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    promise.set_value(100);

    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

### std::packaged_task - Wrapping Functions

```cpp
#include <future>
#include <thread>
#include <iostream>
#include <functional>

int expensive_computation(int x, int y) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return x * y + x - y;
}

int main() {
    // Package a function
    std::packaged_task<int(int, int)> task(expensive_computation);

    // Get future before moving task
    std::future<int> result = task.get_future();

    // Execute in another thread
    std::thread worker(std::move(task), 10, 5);

    // Wait for result
    std::cout << "Result: " << result.get() << '\n';

    worker.join();

    // Can also use with thread pools
    std::packaged_task<int()> task2(std::bind(expensive_computation, 20, 10));
    auto future2 = task2.get_future();
    task2();  // Execute directly
    std::cout << "Result 2: " << future2.get() << '\n';

    return 0;
}
```

## Coroutines - Cooperative Multitasking

C++20 introduced coroutines, which allow functions to suspend and resume execution.

### Basic Generator

```cpp
#include <coroutine>
#include <iostream>
#include <exception>

// Generator template
template<typename T>
struct Generator {
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

    // Disable copy, enable move
    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;
    Generator(Generator&& other) : handle(other.handle) {
        other.handle = nullptr;
    }

    bool next() {
        handle.resume();
        return !handle.done();
    }

    T value() const {
        return handle.promise().current_value;
    }
};

// Coroutine generator function
Generator<int> fibonacci(int n) {
    int a = 0, b = 1;
    for (int i = 0; i < n; ++i) {
        co_yield a;
        int temp = a;
        a = b;
        b = temp + b;
    }
}

int main() {
    auto gen = fibonacci(10);

    while (gen.next()) {
        std::cout << gen.value() << " ";
    }
    std::cout << '\n';
    // Output: 0 1 1 2 3 5 8 13 21 34

    return 0;
}
```

### Async Coroutine Task

```cpp
#include <coroutine>
#include <future>
#include <iostream>

template<typename T>
struct Task {
    struct promise_type {
        T result;
        std::exception_ptr exception;

        Task get_return_object() {
            return Task{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        void return_value(T value) {
            result = value;
        }

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    std::coroutine_handle<promise_type> handle;

    Task(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Task() { if (handle) handle.destroy(); }

    T get() {
        if (!handle.done()) {
            handle.resume();
        }
        if (handle.promise().exception) {
            std::rethrow_exception(handle.promise().exception);
        }
        return handle.promise().result;
    }
};

// Awaitable type for async operations
struct AsyncOperation {
    bool await_ready() const noexcept { return false; }

    void await_suspend(std::coroutine_handle<> handle) const {
        // Launch async operation
        std::thread([handle]() mutable {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            handle.resume();
        }).detach();
    }

    void await_resume() const noexcept {}
};

Task<int> async_task() {
    std::cout << "Starting async task\n";

    co_await AsyncOperation{};
    std::cout << "After first await\n";

    co_await AsyncOperation{};
    std::cout << "After second await\n";

    co_return 42;
}

int main() {
    auto task = async_task();

    std::cout << "Task created\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(300));

    int result = task.get();
    std::cout << "Result: " << result << '\n';

    return 0;
}
```

### Coroutine-Based Producer-Consumer

```cpp
#include <coroutine>
#include <iostream>
#include <queue>
#include <optional>

template<typename T>
class Channel {
private:
    std::queue<T> buffer;
    std::coroutine_handle<> consumer_handle;

public:
    struct Awaitable {
        Channel& channel;
        std::optional<T> value;

        bool await_ready() const noexcept {
            return !channel.buffer.empty();
        }

        void await_suspend(std::coroutine_handle<> handle) {
            channel.consumer_handle = handle;
        }

        T await_resume() {
            T result = std::move(channel.buffer.front());
            channel.buffer.pop();
            return result;
        }
    };

    void send(T value) {
        buffer.push(std::move(value));
        if (consumer_handle) {
            auto handle = consumer_handle;
            consumer_handle = nullptr;
            handle.resume();
        }
    }

    Awaitable receive() {
        return Awaitable{*this};
    }
};
```

## Best Practices and Common Pitfalls

### Avoid Data Races

```cpp
// BAD: Data race
class BadCounter {
    int count = 0;
public:
    void increment() { ++count; }  // NOT thread-safe
};

// GOOD: Protected access
class GoodCounter {
    int count = 0;
    std::mutex mtx;
public:
    void increment() {
        std::lock_guard<std::mutex> lock(mtx);
        ++count;
    }
};

// BETTER: Atomic for simple operations
class BestCounter {
    std::atomic<int> count{0};
public:
    void increment() { count.fetch_add(1); }
};
```

### Prevent Deadlocks

```cpp
#include <mutex>

class Account {
    std::mutex mtx;
    double balance;

public:
    // BAD: Potential deadlock
    void bad_transfer(Account& other, double amount) {
        std::lock_guard<std::mutex> lock1(mtx);
        std::lock_guard<std::mutex> lock2(other.mtx);  // Deadlock risk!
        // ...
    }

    // GOOD: Use std::lock or std::scoped_lock
    void good_transfer(Account& other, double amount) {
        std::scoped_lock lock(mtx, other.mtx);  // Deadlock-free
        // ...
    }
};
```

### RAII for Lock Management

```cpp
void bad_function() {
    std::mutex mtx;
    mtx.lock();
    // If exception thrown, mutex never unlocked!
    do_something();
    mtx.unlock();
}

void good_function() {
    std::mutex mtx;
    std::lock_guard<std::mutex> lock(mtx);
    // Automatically unlocked even if exception thrown
    do_something();
}
```

### Choose Right Synchronization Primitive

```cpp
// Use atomic for simple counters
std::atomic<int> counter{0};

// Use mutex for protecting complex data structures
std::mutex mtx;
std::vector<int> data;

// Use shared_mutex for read-heavy workloads
std::shared_mutex rw_mutex;

// Use condition variables for event synchronization
std::condition_variable cv;
```

### Avoid Thread Over-subscription

```cpp
#include <thread>
#include <vector>

void process_data(const std::vector<int>& data) {
    // BAD: Create too many threads
    std::vector<std::thread> threads;
    for (size_t i = 0; i < data.size(); ++i) {
        threads.emplace_back([&data, i]() {
            process_element(data[i]);
        });
    }

    // GOOD: Limit threads to hardware concurrency
    size_t num_threads = std::thread::hardware_concurrency();
    size_t chunk_size = data.size() / num_threads;

    std::vector<std::thread> limited_threads;
    for (size_t i = 0; i < num_threads; ++i) {
        size_t start = i * chunk_size;
        size_t end = (i == num_threads - 1) ? data.size() : start + chunk_size;

        limited_threads.emplace_back([&data, start, end]() {
            for (size_t j = start; j < end; ++j) {
                process_element(data[j]);
            }
        });
    }
}
```

### Exception Safety in Threads

```cpp
#include <thread>
#include <exception>
#include <iostream>

void thread_function() {
    try {
        // Thread work that might throw
        throw std::runtime_error("Error in thread");
    } catch (const std::exception& e) {
        // Must catch exceptions - they don't propagate to main thread
        std::cerr << "Thread exception: " << e.what() << '\n';
    }
}

int main() {
    std::thread t(thread_function);
    t.join();

    // Use std::async with futures to propagate exceptions
    auto future = std::async(std::launch::async, []() {
        throw std::runtime_error("Async error");
        return 42;
    });

    try {
        int result = future.get();  // Exception thrown here
    } catch (const std::exception& e) {
        std::cout << "Caught: " << e.what() << '\n';
    }

    return 0;
}
```

### Memory Ordering Considerations

```cpp
#include <atomic>

// Relaxed: No synchronization, only atomicity
std::atomic<int> counter{0};
counter.fetch_add(1, std::memory_order_relaxed);

// Acquire-Release: Synchronizes with other operations
std::atomic<bool> flag{false};
std::atomic<int> data{0};

void writer() {
    data.store(42, std::memory_order_relaxed);
    flag.store(true, std::memory_order_release);  // Release
}

void reader() {
    while (!flag.load(std::memory_order_acquire));  // Acquire
    int value = data.load(std::memory_order_relaxed);  // Guaranteed to see 42
}

// Sequential consistency: Strongest guarantee (default)
std::atomic<int> x{0}, y{0};
x.store(1, std::memory_order_seq_cst);
y.store(1, std::memory_order_seq_cst);
```

## Conclusion

C++ provides a comprehensive suite of concurrency tools:

- **std::thread**: Direct thread management for fine-grained control
- **Mutexes**: Various locking mechanisms for data protection
- **Condition Variables**: Efficient thread coordination and signaling
- **Atomics**: Lock-free programming for high-performance scenarios
- **Futures/Promises**: High-level async programming abstractions
- **Coroutines**: Modern cooperative multitasking with elegant syntax

Key takeaways:
1. Always protect shared data with appropriate synchronization
2. Prefer higher-level abstractions (async, atomic) when possible
3. Use RAII for lock management to prevent resource leaks
4. Be aware of deadlock scenarios and use deadlock-prevention techniques
5. Choose the right synchronization primitive for your use case
6. Consider memory ordering for atomic operations
7. Limit thread creation to avoid over-subscription

Mastering concurrency is essential for writing modern, high-performance C++ applications. Start with high-level abstractions and move to lower-level primitives only when necessary for performance or specific requirements.
