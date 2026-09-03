---
title: "C++ Asynchronous Programming: async, future, and promise"
description: "Comprehensive guide to C++ asynchronous programming: std::async, std::future, std::promise, std::packaged_task, and launch strategies for concurrent task execution"
track: cpp
section: concurrency
difficulty: advanced
tags:
  - C++
  - asynchronous programming
  - future
  - promise
  - async
  - concurrency
  - threading
status: imported
origin: old/src/content/docs/cpp/async-future.en.md
divergence: 0.119
issues: []
legacy:
  category: Cpp
  subcategory: Concurrency
  order: 8
  lastUpdated: 2026-01-07
---

C++11 introduced a complete asynchronous programming framework consisting of `std::async`, `std::future`, `std::promise`, and `std::packaged_task`. These components form a powerful and type-safe mechanism for handling concurrent tasks in the standard library, enabling developers to write concurrent programs in a more elegant and safer manner.

## Concept Introduction

### What is Asynchronous Programming?

Asynchronous programming is a programming paradigm that allows a program to execute other tasks while waiting for an operation to complete, rather than blocking. In C++, asynchronous programming is primarily implemented through these core components:

- **std::future**: A placeholder representing the result of an asynchronous operation, which can be retrieved at a later time
- **std::promise**: Used to set the value of a future; acts as the producer side of a future
- **std::async**: A high-level interface for launching asynchronous tasks, returning a future
- **std::packaged_task**: Wraps a callable object into a form that can produce a future

### Historical Background

Before C++11, the C++ standard library provided no native asynchronous programming support. Developers had to rely on operating system-specific APIs (like POSIX threads) or third-party libraries. C++11 standardized these mechanisms with cross-platform asynchronous programming interfaces. C++14 and C++17 further refined these features, while C++20 introduced coroutines for even more powerful asynchronous capabilities.

### Problems Solved

1. **Avoiding manual thread management complexity**: std::async abstracts away thread creation and management details
2. **Type-safe result transmission**: The future/promise mechanism provides a type-safe way to pass results between threads
3. **Exception propagation**: Exceptions thrown in asynchronous tasks can be caught and propagated to the caller
4. **Automatic resource management**: RAII-style ensures proper resource cleanup

## Core Principles

### The Producer-Consumer Model: std::future and std::promise

`std::future` and `std::promise` form a producer-consumer pair:

```
┌─────────────────┐          Shared State           ┌─────────────────┐
│    promise      │ ────────────────────────────► │     future      │
│   (producer)    │    Sets value/exception       │    (consumer)   │
└─────────────────┘                                └─────────────────┘
         │                                                 │
         │ set_value()                                     │ get()
         │ set_exception()                                 │ wait()
         ▼                                                 ▼
    Sets result and                              Blocks until ready or
    notifies waiters                             retrieves result immediately
```

### Shared State Mechanism

A future and promise communicate through a shared state that contains:

- The stored value or exception
- A flag indicating whether the result is ready
- A list of potential waiters to notify

### std::async Launch Strategies

std::async can execute with different launch policies:

1. **std::launch::async**: Forces asynchronous execution in a new thread
2. **std::launch::deferred**: Lazy execution; executes on the calling thread when get() or wait() is invoked
3. **Default policy**: Implementation-defined; can be either async or deferred

```cpp
// Execution model diagram
std::async(policy, func, args...)
         │
         ├── launch::async ──────► Create new thread and execute immediately
         │
         ├── launch::deferred ───► Delay until get()/wait() is called
         │
         └── default ────────────► Implementation decides
```

### std::packaged_task Mechanism

`std::packaged_task` wraps a callable object and associates it with a future:

```
┌──────────────────────────────────────────────────────┐
│              std::packaged_task                       │
├──────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐  ┌─────────────┤ │
│  │  Callable    │ ─► │  Shared      │◄─ │   future    │ │
│  │  Object      │    │  State       │   │             │ │
│  └──────────────┘    └──────────────┘   └─────────────┤ │
│        │                    ▲                          │
│        │                    │                          │
│        └───── operator() sets result on execution ────┘ │
└──────────────────────────────────────────────────────┘
```

## Key Points

- **std::future** represents a future value; operations on it include `get()`, `wait()`, and `wait_for()`
- **std::promise** is used to satisfy a future; call `set_value()`, `set_exception()`, or move it to a thread
- **std::async** is the convenient high-level interface; automatically manages threads and returns a future
- **Launch strategies matter**: Choose between async (immediate threading) and deferred (lazy evaluation)
- **Only call get() once**: Repeated calls to get() on the same future will throw an exception
- **Exception handling is built-in**: Exceptions in async tasks are captured and rethrown when calling get()
- **std::packaged_task** is useful when you need more control; suitable for thread pools and queues
- **std::future::wait_for()** allows timeout-based waiting, returning a status enum
- **Move semantics**: futures and promises are move-only types; use std::move when passing them
- **Shared futures**: Use `std::shared_future` when multiple threads need to wait for the same result
- **Synchronization**: futures provide thread-safe synchronization without explicit locks
- **Performance consideration**: avoid blocking the main thread; use async wisely in UI applications

## Code Examples

### Example 1: Basic std::async Usage

The simplest way to run a function asynchronously is using `std::async`:

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <thread>

// Simple function to execute asynchronously
int calculate(int x, int y) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return x + y;
}

int main() {
    // Launch asynchronous task
    std::future<int> result = std::async(std::launch::async, calculate, 5, 3);

    std::cout << "Task launched, doing other work...\n";

    // Retrieve result (blocks if not ready)
    int value = result.get();
    std::cout << "Result: " << value << std::endl;

    return 0;
}
// Output: Task launched, doing other work...
//         Result: 8
```

### Example 2: Promise and Future

For more control, use `std::promise` to set results from within a thread:

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <vector>

void worker(std::promise<std::string> prm) {
    try {
        // Simulate work
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
        prm.set_value("Work completed successfully!");
    } catch (...) {
        prm.set_exception(std::current_exception());
    }
}

int main() {
    std::promise<std::string> promise;
    std::future<std::string> future = promise.get_future();

    // Launch thread with promise
    std::thread t(worker, std::move(promise));

    std::cout << "Waiting for result...\n";
    std::string result = future.get();
    std::cout << result << std::endl;

    t.join();
    return 0;
}
// Output: Waiting for result...
//         Work completed successfully!
```

### Example 3: Exception Handling in Async Tasks

Exceptions thrown in async tasks are propagated to the caller:

```cpp
#include <iostream>
#include <future>
#include <stdexcept>

int divide(int a, int b) {
    if (b == 0) {
        throw std::invalid_argument("Division by zero!");
    }
    return a / b;
}

int main() {
    auto task = std::async(std::launch::async, divide, 10, 0);

    try {
        int result = task.get();
        std::cout << "Result: " << result << std::endl;
    } catch (const std::invalid_argument& e) {
        std::cout << "Caught exception: " << e.what() << std::endl;
    }

    return 0;
}
// Output: Caught exception: Division by zero!
```

### Example 4: Multiple Async Tasks with std::vector

Execute multiple async tasks and collect results:

```cpp
#include <iostream>
#include <future>
#include <vector>
#include <algorithm>

int square(int x) {
    return x * x;
}

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::vector<std::future<int>> futures;

    // Launch async task for each number
    for (int num : numbers) {
        futures.push_back(
            std::async(std::launch::async, square, num)
        );
    }

    // Collect results
    std::cout << "Results: ";
    for (auto& fut : futures) {
        std::cout << fut.get() << " ";
    }
    std::cout << std::endl;

    return 0;
}
// Output: Results: 1 4 9 16 25
```

### Example 5: Launch Strategies Comparison

Understand the difference between async and deferred execution:

```cpp
#include <iostream>
#include <future>
#include <thread>

int get_thread_id() {
    return std::this_thread::get_id();
}

int main() {
    int main_thread_id = std::this_thread::get_id();

    // Async: executes in different thread
    auto async_task = std::async(std::launch::async, get_thread_id);

    // Deferred: executes in current thread when get() is called
    auto deferred_task = std::async(std::launch::deferred, get_thread_id);

    std::cout << "Main thread ID: " << main_thread_id << "\n";
    std::cout << "Async task thread ID: " << async_task.get() << "\n";
    std::cout << "Deferred task thread ID: " << deferred_task.get() << "\n";

    return 0;
}
// Output: Async task runs in different thread
//         Deferred task runs in main thread
```

### Example 6: std::packaged_task for Thread Pool

Use `std::packaged_task` when implementing thread pools:

```cpp
#include <iostream>
#include <future>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>

class SimpleThreadPool {
private:
    std::queue<std::packaged_task<void()>> tasks;
    std::mutex mtx;
    std::condition_variable cv;
    bool shutdown = false;

public:
    template<typename Func>
    std::future<typename std::invoke_result_t<Func>> submit(Func&& func) {
        auto task = std::packaged_task<typename std::invoke_result_t<Func>()>(func);
        auto future = task.get_future();

        {
            std::unique_lock<std::mutex> lock(mtx);
            tasks.push([t = std::move(task)]() mutable { t(); });
        }

        cv.notify_one();
        return future;
    }

    void worker_thread() {
        while (true) {
            std::unique_lock<std::mutex> lock(mtx);
            cv.wait(lock, [this] { return !tasks.empty() || shutdown; });

            if (tasks.empty() && shutdown) break;
            if (tasks.empty()) continue;

            auto task = std::move(tasks.front());
            tasks.pop();
            lock.unlock();

            task();
        }
    }
};
```

### Example 7: Wait Strategies with wait_for()

Use `wait_for()` to implement timeout-based waiting:

```cpp
#include <iostream>
#include <future>
#include <chrono>
#include <thread>

int slow_computation() {
    std::this_thread::sleep_for(std::chrono::seconds(2));
    return 42;
}

int main() {
    auto future = std::async(std::launch::async, slow_computation);

    auto status = future.wait_for(std::chrono::milliseconds(500));

    if (status == std::future_status::ready) {
        std::cout << "Result ready: " << future.get() << std::endl;
    } else if (status == std::future_status::timeout) {
        std::cout << "Still computing...\n";
        int result = future.get(); // Block until ready
        std::cout << "Finally got: " << result << std::endl;
    }

    return 0;
}
// Output: Still computing...
//         Finally got: 42
```

### Example 8: Shared Future for Multiple Waiters

When multiple threads need the same result, use `std::shared_future`:

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <vector>
#include <chrono>

int compute_value() {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return 100;
}

int main() {
    std::promise<int> promise;
    std::shared_future<int> shared_fut = promise.get_future().share();

    std::vector<std::thread> threads;

    // Multiple threads waiting for same result
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back([shared_fut, i]() {
            int value = shared_fut.get();
            std::cout << "Thread " << i << " got: " << value << "\n";
        });
    }

    // Set value after brief delay
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    promise.set_value(42);

    for (auto& t : threads) {
        t.join();
    }

    return 0;
}
```

### Example 9: Chaining Async Operations

Compose multiple async operations:

```cpp
#include <iostream>
#include <future>

int get_base() {
    return 10;
}

int multiply_by_two(int x) {
    return x * 2;
}

int add_five(int x) {
    return x + 5;
}

int main() {
    // Chain operations
    auto fut1 = std::async(std::launch::async, get_base);

    // After first completes, process result
    auto fut2 = std::async(std::launch::async, [fut = std::move(fut1)]() {
        return multiply_by_two(fut.get());
    });

    auto fut3 = std::async(std::launch::async, [fut = std::move(fut2)]() {
        return add_five(fut.get());
    });

    std::cout << "Final result: " << fut3.get() << std::endl; // (10 * 2) + 5 = 25

    return 0;
}
```

### Example 10: Error Handling with set_exception

Propagate exceptions through promises:

```cpp
#include <iostream>
#include <future>
#include <stdexcept>
#include <thread>

void risky_operation(std::promise<int> prm) {
    try {
        // Simulate error condition
        throw std::runtime_error("Something went wrong!");
    } catch (...) {
        // Capture current exception and set it
        prm.set_exception(std::current_exception());
    }
}

int main() {
    std::promise<int> prm;
    std::future<int> fut = prm.get_future();

    std::thread t(risky_operation, std::move(prm));

    try {
        int result = fut.get();
    } catch (const std::runtime_error& e) {
        std::cout << "Caught error: " << e.what() << std::endl;
    }

    t.join();
    return 0;
}
```

## Best Practices

### Prefer std::async Over Manual Thread Creation

```cpp
// Good: Simple and clean
auto result = std::async(std::launch::async, compute_value);

// Avoid: Manual thread management is more error-prone
std::thread t(compute_value);
t.join();
```

### Choose Appropriate Launch Strategies

```cpp
// Use launch::async when you want guaranteed parallelism
auto parallel_task = std::async(std::launch::async, cpu_intensive_work);

// Use launch::deferred for lightweight operations or I/O
auto io_task = std::async(std::launch::deferred, read_file);

// Default policy when you don't care about the strategy
auto generic_task = std::async(some_function);
```

### Handle Exceptions Properly

```cpp
// Always wrap get() in try-catch for async tasks that may throw
auto future = std::async(std::launch::async, risky_function);
try {
    auto result = future.get();
} catch (const std::exception& e) {
    // Handle error appropriately
    std::cerr << "Async task failed: " << e.what() << "\n";
}
```

### Use Shared Futures for Multiple Consumers

```cpp
// Good: Multiple threads reading same result
std::promise<std::string> prm;
auto shared_fut = prm.get_future().share();
// Now share() can be copied and used by multiple threads

// Avoid: Regular future is move-only
// std::future<std::string> fut = prm.get_future();
// Only one get() call allowed
```

### Avoid Blocking the Main Thread

```cpp
// Bad: Blocks main thread, defeats purpose of async
std::future<int> result = std::async(std::launch::async, heavy_work);
std::cout << result.get(); // Blocks here!

// Good: Do other work while waiting
std::future<int> result = std::async(std::launch::async, heavy_work);
do_other_work();
std::cout << result.get(); // Block only when needed
```

### Use wait_for for Timeout Operations

```cpp
auto future = std::async(std::launch::async, network_operation);

auto status = future.wait_for(std::chrono::seconds(5));
if (status == std::future_status::timeout) {
    std::cerr << "Operation timed out\n";
    // Handle timeout
} else {
    auto result = future.get();
}
```

### Consider Using std::packaged_task for Complex Workflows

```cpp
// When you need more control over task creation and execution
std::packaged_task<int()> task(complex_operation);
auto future = task.get_future();

// Can now execute task whenever you want
std::thread worker(std::move(task));
```

### Move Semantics with Promises and Futures

```cpp
// Correct: Use std::move for unique ownership types
std::promise<int> prm;
std::future<int> fut = prm.get_future();
std::thread t([prm = std::move(prm)]() mutable {
    prm.set_value(42);
});
```

## Common Pitfalls

### Pitfall 1: Calling get() Multiple Times

```cpp
// WRONG: get() can only be called once
auto future = std::async(std::launch::async, get_value);
int x = future.get();  // First call succeeds
int y = future.get();  // THROWS! std::future_error

// CORRECT: Store the value
auto future = std::async(std::launch::async, get_value);
int value = future.get();
int x = value;
int y = value;  // Reuse stored value
```

### Pitfall 2: Destroying a Future Without Calling get()

```cpp
// PROBLEMATIC: If the destructor of a future returned by std::async
// is called before get(), the behavior is implementation-defined
{
    auto future = std::async(std::launch::async, long_running_task);
    // Future destroyed without get() - may or may not wait
}

// BETTER: Ensure you handle all futures properly
{
    auto future = std::async(std::launch::async, long_running_task);
    try {
        future.get();
    } catch (...) {
        // Handle errors
    }
}
```

### Pitfall 3: Assuming Deferred Execution with Default Policy

```cpp
// WRONG: Default policy is implementation-defined
auto future = std::async(compute);  // May or may not run in separate thread

// CORRECT: Be explicit
auto future = std::async(std::launch::async, compute);  // Guaranteed parallel
```

### Pitfall 4: Not Using Move Semantics

```cpp
// WRONG: Attempting to copy
std::promise<int> prm;
std::promise<int> prm2 = prm;  // COMPILE ERROR

// CORRECT: Use move
std::promise<int> prm;
std::promise<int> prm2 = std::move(prm);
```

### Pitfall 5: Setting Value/Exception Multiple Times

```cpp
// WRONG: Can only set value or exception once
std::promise<int> prm;
prm.set_value(10);
prm.set_value(20);  // THROWS!

// CORRECT: Set only once
std::promise<int> prm;
prm.set_value(10);
// Don't call set_value or set_exception again
```

### Pitfall 6: Ignoring Thread Safety of Shared State

```cpp
// WRONG: Assuming shared_future is completely thread-safe
std::shared_future<int> shared_fut;
// The shared_future itself is thread-safe, but using its result requires care
if (shared_fut.valid() && shared_fut.get() > 0) {
    // Race condition between valid() and get()
}

// CORRECT: Single atomic operation
int value = shared_fut.get();  // Atomic from our perspective
```

### Pitfall 7: Deadlock with Nested Async

```cpp
// RISKY: Potential for deadlock with nested async and deferred launch
auto outer = std::async(std::launch::deferred, []() {
    auto inner = std::async(std::launch::deferred, []() {
        return 42;
    });
    return inner.get();  // Can cause issues with limited thread pool
});
```

## Performance Considerations

### Thread Creation Overhead

Creating a new thread has non-trivial overhead. Consider the work-to-overhead ratio:

```cpp
// BAD: Overhead exceeds benefit for light work
for (int i = 0; i < 1000; ++i) {
    auto fut = std::async(std::launch::async, []() {
        return 1 + 1;  // Too small
    });
    futures.push_back(std::move(fut));
}

// GOOD: Batch work or use thread pool
auto process_batch = []() {
    int sum = 0;
    for (int i = 0; i < 1000; ++i) {
        sum += 1 + 1;
    }
    return sum;
};
auto fut = std::async(std::launch::async, process_batch);
```

### Launch Strategy Performance Trade-offs

```cpp
// async: Better for CPU-bound work, more parallelism
auto cpu_task = std::async(std::launch::async, matrix_multiply);

// deferred: Better for I/O-bound or lightweight operations
auto io_task = std::async(std::launch::deferred, read_file);

// Default: May use async or deferred; implementation-specific optimization
```

### Context Switching Overhead

Too many concurrent tasks can reduce performance due to context switching:

```cpp
// Not optimal: Creating more tasks than CPU cores
int num_tasks = 10000;
int num_cores = std::thread::hardware_concurrency();
// num_tasks >> num_cores leads to excessive context switching

// Better: Limit parallelism to available cores
int optimal_tasks = num_cores;
```

### Memory Overhead of Futures

Each future carries overhead for its shared state:

```cpp
// Less efficient: Many small futures
std::vector<std::future<int>> futures;
for (int i = 0; i < 1000000; ++i) {
    futures.push_back(std::async(std::launch::async, compute_one));
}

// More efficient: Batch results
std::future<std::vector<int>> batch = std::async(std::launch::async, [&]() {
    std::vector<int> results;
    for (int i = 0; i < 1000000; ++i) {
        results.push_back(compute_one());
    }
    return results;
});
```

### Future State Synchronization Costs

Accessing shared state involves synchronization:

```cpp
// Minimize synchronization overhead
auto fut = std::async(std::launch::async, expensive_operation);

// Do unrelated work without accessing the future
do_independent_work();

// Only access when needed
auto result = fut.get();  // Synchronization happens here once
```

## Real-world Scenarios

### Scenario 1: Parallel File Processing

Process multiple files concurrently:

```cpp
#include <iostream>
#include <future>
#include <vector>
#include <fstream>

std::string process_file(const std::string& filename) {
    std::ifstream file(filename);
    std::string content((std::istreambuf_iterator<char>(file)),
                       std::istreambuf_iterator<char>());
    // Process content...
    return "Processed: " + filename;
}

int main() {
    std::vector<std::string> files = {"file1.txt", "file2.txt", "file3.txt"};
    std::vector<std::future<std::string>> futures;

    for (const auto& file : files) {
        futures.push_back(
            std::async(std::launch::async, process_file, file)
        );
    }

    for (auto& fut : futures) {
        std::cout << fut.get() << "\n";
    }

    return 0;
}
```

### Scenario 2: Web Request with Timeout

Implement timeout for network operations:

```cpp
#include <iostream>
#include <future>
#include <chrono>

std::string fetch_url(const std::string& url) {
    // Simulate network request
    std::this_thread::sleep_for(std::chrono::seconds(2));
    return "Response from " + url;
}

int main() {
    auto request = std::async(std::launch::async, fetch_url, "https://api.example.com");

    auto status = request.wait_for(std::chrono::seconds(1));
    if (status == std::future_status::timeout) {
        std::cout << "Request timed out\n";
        return 1;
    }

    std::cout << request.get() << "\n";
    return 0;
}
```

### Scenario 3: Map-Reduce Pattern

Distribute work across tasks and reduce results:

```cpp
#include <iostream>
#include <future>
#include <vector>
#include <numeric>

// Map: Process chunk of data
int process_chunk(const std::vector<int>& data, size_t start, size_t end) {
    int sum = 0;
    for (size_t i = start; i < end; ++i) {
        sum += data[i] * 2;  // Process
    }
    return sum;
}

int main() {
    std::vector<int> data(1000);
    std::iota(data.begin(), data.end(), 0);

    size_t num_threads = 4;
    size_t chunk_size = data.size() / num_threads;
    std::vector<std::future<int>> futures;

    // Map
    for (size_t i = 0; i < num_threads; ++i) {
        size_t start = i * chunk_size;
        size_t end = (i == num_threads - 1) ? data.size() : (i + 1) * chunk_size;

        futures.push_back(
            std::async(std::launch::async, process_chunk, std::ref(data), start, end)
        );
    }

    // Reduce
    int total = 0;
    for (auto& fut : futures) {
        total += fut.get();
    }

    std::cout << "Total: " << total << "\n";
    return 0;
}
```

### Scenario 4: Producer-Consumer Queue

Implement a simple producer-consumer pattern:

```cpp
#include <iostream>
#include <future>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <memory>

template<typename T>
class SyncQueue {
private:
    mutable std::mutex mtx;
    std::condition_variable cv;
    std::queue<T> data;

public:
    void push(T value) {
        {
            std::unique_lock<std::mutex> lock(mtx);
            data.push(value);
        }
        cv.notify_one();
    }

    T pop() {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [this] { return !data.empty(); });
        T value = data.front();
        data.pop();
        return value;
    }
};

int main() {
    SyncQueue<int> queue;

    // Producer
    auto producer = std::async(std::launch::async, [&queue]() {
        for (int i = 0; i < 5; ++i) {
            queue.push(i);
            std::cout << "Produced: " << i << "\n";
        }
    });

    // Consumer
    auto consumer = std::async(std::launch::async, [&queue]() {
        for (int i = 0; i < 5; ++i) {
            int value = queue.pop();
            std::cout << "Consumed: " << value << "\n";
        }
    });

    producer.get();
    consumer.get();

    return 0;
}
```

## Interview Points

### Q1: What's the difference between std::async and std::thread?

**Answer:** `std::async` is a higher-level abstraction that:
- Returns a future for result retrieval
- Automatically manages thread lifecycle
- Handles exceptions properly
- Can use deferred execution with `launch::deferred`
- Better for function calls returning values

`std::thread` is lower-level:
- Requires manual result communication
- No built-in exception propagation
- More control but more responsibility
- Better for long-running tasks or special requirements

### Q2: What are launch strategies and when do you use each?

**Answer:**
- `launch::async`: Forces asynchronous execution in a new thread. Use for CPU-bound work that benefits from parallelism.
- `launch::deferred`: Delays execution until get() or wait() is called. Use for lightweight operations or when you want to defer computation.
- Default: Implementation chooses. Use when you don't have specific requirements.

### Q3: Why can you only call get() once on a future?

**Answer:** The future represents a one-time result retrieval. Calling get() moves the result out (if it's move-only) or the implementation may optimize assuming single access. Use `shared_future` if multiple threads need the same result.

### Q4: How do you propagate exceptions from async tasks?

**Answer:** Exceptions are automatically caught and stored in the shared state. When you call get(), the exception is rethrown. You can also explicitly use `set_exception()` on a promise.

### Q5: What's the difference between future and shared_future?

**Answer:**
- `future`: Move-only, single consumer
- `shared_future`: Copyable, multiple consumers

Use `shared_future` when multiple threads need to wait for the same result.

### Q6: How do you handle timeout in async operations?

**Answer:** Use `wait_for()` or `wait_until()`:
```cpp
auto status = future.wait_for(std::chrono::seconds(5));
if (status == std::future_status::timeout) {
    // Handle timeout
}
```

### Q7: When would you use std::packaged_task over std::async?

**Answer:** When you need:
- More control over task creation and execution timing
- Integration with thread pools or queues
- Wrapping callable objects that don't fit async's model
- Deferred execution with custom scheduling

### Q8: What happens if you destroy a future without calling get()?

**Answer:** For futures returned by `std::async`, the destructor may block until the task completes (implementation-defined). For other futures, it simply releases resources. Best practice: always ensure you handle futures properly.

### Q9: How do you combine results from multiple async operations?

**Answer:** Collect futures in a container and iterate to get results:
```cpp
std::vector<std::future<int>> futures;
// ... collect futures ...
std::vector<int> results;
for (auto& fut : futures) {
    results.push_back(fut.get());
}
```

### Q10: What's the performance impact of creating many short-lived futures?

**Answer:** Thread creation has overhead. For many small operations, consider:
- Batching work into larger chunks
- Using a thread pool with packaged_task
- Using launch::deferred for lightweight operations
- Limiting parallelism to available cores

## Further Reading

### Official Standards Documentation
- **C++11 Standard**: Introduction of futures, promises, and async
- **C++14/17 Standards**: Refinements to async and related types
- **C++20 Standard**: Coroutines as alternative async mechanism
- cppreference.com: Comprehensive C++ standard library reference

### Key Concepts to Explore
- **Coroutines (C++20)**: More advanced asynchronous programming
- **Thread Pool Implementations**: For managing multiple tasks efficiently
- **Lock-free Synchronization**: For high-performance concurrent code
- **Parallel Algorithms (C++17)**: std::execution policies for algorithm parallelism

### Related Topics
- **std::thread**: Lower-level thread management
- **std::mutex and std::lock_guard**: Synchronization primitives
- **std::condition_variable**: For thread coordination
- **std::atomic**: For lock-free programming

### Recommended Books
- "Concurrency in Action" by Anthony D. Williams: Comprehensive guide to C++ concurrency
- "C++ Concurrency in Action (2nd Edition)": Updated with newer standards
- "Effective Modern C++" by Scott Meyers: Best practices for C++11/14/17

### Practice Resources
- Implement a thread pool using std::packaged_task
- Create a producer-consumer system with promises and futures
- Build a parallel processing pipeline
- Implement timeout-based operations with wait_for
- Create a task scheduler with deferred execution

---

**Summary**: C++ async and future provide a powerful, type-safe mechanism for asynchronous programming. By understanding the concepts of futures, promises, launch strategies, and proper exception handling, you can write efficient concurrent programs while avoiding common pitfalls. The key is choosing the right tool for your use case and following best practices for thread safety and resource management.
