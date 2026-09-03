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
origin: old/src/content/docs/cpp/condition-variable.en.md
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

Condition variables are a core mechanism for implementing thread synchronization in C++ concurrent programming. They allow one or more threads to wait for a condition to be met, while another thread can notify the waiting threads when the condition is satisfied. Condition variables work in conjunction with mutexes and are fundamental components for implementing concurrent patterns such as producer-consumer and thread pools.

## Concept Explanation

### What is a Condition Variable

A Condition Variable is a synchronization primitive used to block one or more threads until another thread modifies a shared variable (the condition) and notifies the condition variable. It solves the "wait-notify" coordination problem between threads.

**Core Idea**: Thread A needs to wait for a certain condition to be met before continuing execution, and the condition is changed by Thread B. Condition variables provide an efficient waiting mechanism that avoids CPU resource waste caused by busy-waiting.

### Historical Background

The concept of condition variables originated from synchronization primitives in operating systems. It was first provided in the POSIX thread library (pthread) as `pthread_cond_t`. The C++11 standard incorporated it into the standard library, providing two classes: `std::condition_variable` and `std::condition_variable_any`.

### Problems Solved

1. **Avoiding Busy-Waiting**: Without condition variables, threads might need to continuously poll to check conditions, wasting CPU resources
2. **Thread Coordination**: Implementing classic concurrent patterns like producer-consumer and readers-writers
3. **Resource Management**: Waking up waiting threads when resources become available, enabling efficient resource allocation

## Core Principles

### Working Mechanism

The working mechanism of condition variables includes three core operations:

```
┌─────────────────────────────────────────────────────────────┐
│                 Condition Variable Workflow                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Waiting Thread                      Notifying Thread        │
│  ─────────────                      ────────────────         │
│     │                                │                       │
│     ▼                                │                       │
│  ┌──────────┐                        │                       │
│  │ Acquire  │                        │                       │
│  │   Lock   │                        │                       │
│  └────┬─────┘                        │                       │
│       │                              │                       │
│       ▼                              │                       │
│  ┌──────────┐                        │                       │
│  │  Check   │◄─────────────────┐     │                       │
│  │Condition │                  │     │                       │
│  └────┬─────┘                  │     ▼                       │
│       │                        │     ┌──────────┐            │
│  Condition False          Condition  │ Acquire  │            │
│       │                    True │    │   Lock   │            │
│       ▼                        │     └────┬─────┘            │
│  ┌──────────┐                  │          │                  │
│  │ Release  │                  │          ▼                  │
│  │Lock,Wait │                  │     ┌──────────┐            │
│  └────┬─────┘                  │     │  Modify  │            │
│       │                        │     │Condition │            │
│   Wait for                     │     └────┬─────┘            │
│   Notification                 │          │                  │
│       │                        │          ▼                  │
│       │◄──────────────────────────── ┌──────────┐            │
│       │         notify               │ Release  │            │
│       ▼                              │Lock,Notify│            │
│  ┌──────────┐                  │     └──────────┘            │
│  │Reacquire │──────────────────┘                             │
│  │   Lock   │                                                │
│  └────┬─────┘                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                                │
│  │ Continue │                                                │
│  │Execution │                                                │
│  └──────────┘                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Atomicity of the wait Operation

The `wait` operation is atomic and performs the following steps:

1. Release the associated mutex
2. Put the thread into a waiting state
3. When awakened, reacquire the mutex
4. Return

These three steps are atomic, ensuring that notifications are not lost between releasing the lock and entering the wait state.

### Spurious Wakeup

Spurious wakeup is an important characteristic of condition variables: a thread may return from `wait` without receiving a `notify`. This is determined by the operating system implementation for performance optimization reasons.

**Causes**:
- Operating system internal implementation optimizations
- Signal handling in multiprocessor systems
- System interrupts

**Solution**: Always check the condition in a loop, or use the predicate version of `wait`.

## Key Points

### Condition Variable Classes Provided by the C++ Standard Library

| Class | Header File | Characteristics |
|-------|-------------|-----------------|
| `std::condition_variable` | `<condition_variable>` | Can only be used with `std::unique_lock<std::mutex>`, more efficient |
| `std::condition_variable_any` | `<condition_variable>` | Can be used with any lock that satisfies BasicLockable requirements |

### Main Member Functions

```cpp
// Main interface of std::condition_variable
class condition_variable {
public:
    // Wait functions
    void wait(std::unique_lock<std::mutex>& lock);

    template<typename Predicate>
    void wait(std::unique_lock<std::mutex>& lock, Predicate pred);

    // Wait with timeout
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

    // Notification functions
    void notify_one() noexcept;  // Wake up one waiting thread
    void notify_all() noexcept;  // Wake up all waiting threads
};
```

### Two Forms of the wait Function

```cpp
// Form 1: Version without predicate - must be used in a loop
while (!condition) {
    cv.wait(lock);
}

// Form 2: Version with predicate - automatically handles spurious wakeups
cv.wait(lock, []{ return condition; });

// Both are equivalent, but the predicate version is more concise and safe
```

## Code Examples

### Basic Usage

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

    // Wait for condition to be met
    // wait with predicate automatically handles spurious wakeups
    cv.wait(lock, []{ return ready; });

    std::cout << "Worker thread: Condition met, starting work\n";
}

void trigger() {
    std::this_thread::sleep_for(std::chrono::seconds(1));

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
        std::cout << "Trigger thread: Setting condition to true\n";
    }

    cv.notify_one();  // Notify one waiting thread
}

int main() {
    std::thread t1(worker);
    std::thread t2(trigger);

    t1.join();
    t2.join();

    return 0;
}
```

### Handling Spurious Wakeups

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>

std::mutex mtx;
std::condition_variable cv;
int data = 0;
bool dataReady = false;

// Wrong example: Not handling spurious wakeups
void wrongWait() {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock);  // Dangerous! May spuriously wake up

    // May execute when dataReady is false
    std::cout << "Data: " << data << "\n";
}

// Correct example 1: Check condition in a loop
void correctWait1() {
    std::unique_lock<std::mutex> lock(mtx);

    while (!dataReady) {  // Loop to check condition
        cv.wait(lock);
    }

    std::cout << "Data: " << data << "\n";
}

// Correct example 2: Use wait with predicate (recommended)
void correctWait2() {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock, []{ return dataReady; });  // Automatically loops to check

    std::cout << "Data: " << data << "\n";
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

### Producer-Consumer Pattern

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

    // Producer: Add element
    bool push(const T& value) {
        std::unique_lock<std::mutex> lock(mtx_);

        // Wait until queue is not full
        cvNotFull_.wait(lock, [this] {
            return queue_.size() < maxSize_ || closed_;
        });

        if (closed_) {
            return false;
        }

        queue_.push(value);
        cvNotEmpty_.notify_one();  // Notify consumer
        return true;
    }

    // Consumer: Remove element
    bool pop(T& value) {
        std::unique_lock<std::mutex> lock(mtx_);

        // Wait until queue is not empty
        cvNotEmpty_.wait(lock, [this] {
            return !queue_.empty() || closed_;
        });

        if (queue_.empty()) {
            return false;  // Queue is closed and empty
        }

        value = std::move(queue_.front());
        queue_.pop();
        cvNotFull_.notify_one();  // Notify producer
        return true;
    }

    // Pop with timeout
    bool tryPopFor(T& value, std::chrono::milliseconds timeout) {
        std::unique_lock<std::mutex> lock(mtx_);

        if (!cvNotEmpty_.wait_for(lock, timeout, [this] {
            return !queue_.empty() || closed_;
        })) {
            return false;  // Timeout
        }

        if (queue_.empty()) {
            return false;
        }

        value = std::move(queue_.front());
        queue_.pop();
        cvNotFull_.notify_one();
        return true;
    }

    // Close the queue
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

    // Producer thread
    std::thread producer([&queue] {
        for (int i = 1; i <= 20; ++i) {
            if (queue.push(i)) {
                std::cout << "Produced: " << i << "\n";
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
        queue.close();
    });

    // Multiple consumer threads
    auto consumer = [&queue](int id) {
        int value;
        while (queue.pop(value)) {
            std::cout << "Consumer" << id << " consumed: " << value << "\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
        std::cout << "Consumer" << id << " exiting\n";
    };

    std::thread c1(consumer, 1);
    std::thread c2(consumer, 2);

    producer.join();
    c1.join();
    c2.join();

    return 0;
}
```

### wait_for and wait_until Timed Waiting

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

    // Use wait_for to wait for up to 2 seconds
    if (cv.wait_for(lock, std::chrono::seconds(2), [] {
        return taskCompleted;
    })) {
        std::cout << "Task completed before timeout\n";
    } else {
        std::cout << "Wait timed out, task not completed\n";
    }
}

void waitUntilDeadline() {
    std::unique_lock<std::mutex> lock(mtx);

    // Use wait_until to wait until a specific time point
    auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(5);

    auto status = cv.wait_until(lock, deadline, [] {
        return taskCompleted;
    });

    if (status) {
        std::cout << "Completed before deadline\n";
    } else {
        std::cout << "Deadline reached\n";
    }
}

int main() {
    // Example 1: Timeout
    std::cout << "=== Testing Timeout ===\n";
    std::thread t1(longRunningTask);
    std::thread t2(waitWithTimeout);

    t2.join();
    t1.join();

    // Reset state
    taskCompleted = false;

    // Example 2: Complete before deadline
    std::cout << "\n=== Testing Deadline ===\n";
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
    std::cout << "Worker " << id << " acquired resource, remaining: " << sharedResource << "\n";
}

void workerNotifyAll(int id) {
    std::unique_lock<std::mutex> lock(mtx);

    cv.wait(lock, [] { return sharedResource > 0; });

    // All threads wake up simultaneously, but only one can succeed
    if (sharedResource > 0) {
        --sharedResource;
        std::cout << "Worker " << id << " acquired resource, remaining: " << sharedResource << "\n";
    } else {
        std::cout << "Worker " << id << " insufficient resources, continuing to wait\n";
    }
}

void demoNotifyOne() {
    std::cout << "=== notify_one Example ===\n";
    sharedResource = 0;

    std::vector<std::thread> workers;
    for (int i = 0; i < 3; ++i) {
        workers.emplace_back(workerNotifyOne, i);
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // Add one resource at a time and notify one thread
    for (int i = 0; i < 3; ++i) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            ++sharedResource;
            std::cout << "Added resource, total: " << sharedResource << "\n";
        }
        cv.notify_one();  // Only wake up one waiting thread
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    for (auto& t : workers) {
        t.join();
    }
}

void demoNotifyAll() {
    std::cout << "\n=== notify_all Example ===\n";
    sharedResource = 0;

    std::vector<std::thread> workers;
    for (int i = 0; i < 3; ++i) {
        workers.emplace_back(workerNotifyAll, i);
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    {
        std::lock_guard<std::mutex> lock(mtx);
        sharedResource = 3;  // Add 3 resources
        std::cout << "Added 3 resources\n";
    }
    cv.notify_all();  // Wake up all waiting threads

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

### Using std::condition_variable_any

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

    // condition_variable_any can work with any lock type
    cvAny.wait(lock, [] { return dataReady; });

    std::cout << "Reader " << id << " read data: " << data << "\n";
}

void writer() {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    {
        std::unique_lock<std::shared_mutex> lock(sharedMtx);
        data = 42;
        dataReady = true;
        std::cout << "Writer set data: " << data << "\n";
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

## Best Practices

### Always Use wait with a Predicate

```cpp
// Recommended: Use wait with predicate
cv.wait(lock, []{ return condition; });

// Not recommended: Manual loop (error-prone)
while (!condition) {
    cv.wait(lock);
}
```

### Release the Lock Before Notifying

```cpp
// Recommended: Release lock before notifying
{
    std::lock_guard<std::mutex> lock(mtx);
    data = newValue;
    ready = true;
}  // Lock is released here
cv.notify_one();  // Then send notification

// Also acceptable: Notify while holding lock (waiting thread will immediately compete for lock)
{
    std::lock_guard<std::mutex> lock(mtx);
    data = newValue;
    ready = true;
    cv.notify_one();  // Lock still held, awakened thread will block
}
```

### Use RAII for Exception Safety

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
            // RAII ensures lock is released on exception
            std::lock_guard<std::mutex> lock(mtx_);
            if (stop_) {
                throw std::runtime_error("Queue stopped");
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
            throw std::runtime_error("Queue closed");
        }

        auto task = std::move(tasks_.front());
        tasks_.pop();
        return task;
    }
};
```

### Choose Between notify_one and notify_all Wisely

```cpp
// Use notify_one when:
// - Only one thread can handle the event
// - The resource is singular (e.g., a single task)
void singleTaskReady() {
    cv.notify_one();
}

// Use notify_all when:
// - Multiple threads need to respond to the same event
// - Condition change affects all waiters
// - Shutdown/stop operations
void shutdown() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        stopped = true;
    }
    cv.notify_all();  // Wake up all waiting threads
}
```

### Avoid Lost Signals

```cpp
class Event {
private:
    std::mutex mtx_;
    std::condition_variable cv_;
    bool signaled_ = false;  // State flag prevents signal loss

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

## Common Pitfalls

### Forgetting to Handle Spurious Wakeups

```cpp
// Wrong: Not checking condition
void wrongUsage() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock);  // Dangerous! Spurious wakeup can cause logic errors
    processData();
}

// Correct: Always check condition
void correctUsage() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock, []{ return dataReady; });
    processData();
}
```

### Lost Wakeup

```cpp
// Wrong: Signal may be lost
bool ready = false;

void waiter() {
    std::unique_lock<std::mutex> lock(mtx);
    // If notify happens before wait, signal is lost
    cv.wait(lock);
}

void notifier() {
    cv.notify_one();  // If no thread is waiting, signal is lost

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
    }
}

// Correct: Use condition flag
void correctWaiter() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock, []{ return ready; });  // Even if signal is sent before waiting, condition check handles it correctly
}

void correctNotifier() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
    }
    cv.notify_one();
}
```

### Deadlock

```cpp
// Wrong: Nested locks cause deadlock
void deadlockExample() {
    std::lock_guard<std::mutex> outerLock(mtx1);

    std::unique_lock<std::mutex> lock(mtx2);
    cv.wait(lock, [&] {
        // Waiting condition needs mtx1, but we already hold it
        std::lock_guard<std::mutex> innerLock(mtx1);  // Deadlock!
        return checkCondition();
    });
}

// Correct: Avoid waiting while holding locks
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

### Using the Wrong Lock Type

```cpp
// Wrong: condition_variable can only be used with unique_lock<mutex>
void wrongLockType() {
    std::lock_guard<std::mutex> lock(mtx);  // Wrong!
    // cv.wait(lock);  // Compilation error
}

// Correct: Use unique_lock
void correctLockType() {
    std::unique_lock<std::mutex> lock(mtx);  // Correct
    cv.wait(lock, []{ return condition; });
}

// If you need to use other lock types, use condition_variable_any
void useConditionVariableAny() {
    std::shared_lock<std::shared_mutex> lock(sharedMtx);
    cvAny.wait(lock, []{ return condition; });
}
```

### Forgetting to Modify Condition Before Notifying

```cpp
// Wrong: Condition not modified before notify
void wrongNotify() {
    cv.notify_one();  // Waiting thread wakes up, but condition is still false

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;  // Too late
    }
}

// Correct: Modify condition before notify
void correctNotify() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true;
    }
    cv.notify_one();
}
```

## Performance Considerations

### Performance Impact of notify_one vs notify_all

```cpp
// notify_one: O(1) wakeup operation, only wakes one thread
// Use for: single resource available, task queues

// notify_all: O(n) wakes all n waiting threads
// Use for: broadcast events, state changes, shutdown operations

// Performance comparison example
class TaskQueue {
    // ...

    void addTask(Task task) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            tasks_.push(std::move(task));
        }
        cv_.notify_one();  // Only need to wake one worker thread
    }

    void shutdown() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            stopped_ = true;
        }
        cv_.notify_all();  // Need to wake all worker threads to exit
    }
};
```

### Reducing Lock Contention

```cpp
// Optimized: Release lock before notifying
void optimizedNotify() {
    {
        std::lock_guard<std::mutex> lock(mtx);
        data = newValue;
        ready = true;
    }  // Lock is released here

    cv.notify_one();  // Awakened thread can immediately acquire lock
}

// Not optimized: Notify while holding lock
void unoptimizedNotify() {
    std::lock_guard<std::mutex> lock(mtx);
    data = newValue;
    ready = true;
    cv.notify_one();  // Awakened thread must wait for lock release
}
```

### Avoiding Thundering Herd Effect

```cpp
// Problem: notify_all causes all threads to wake up, but only one can acquire resource
class ResourcePool {
    std::queue<Resource> resources_;
    std::mutex mtx_;
    std::condition_variable cv_;

public:
    // Bad: Wake all threads every time a resource is added
    void returnResourceBad(Resource r) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            resources_.push(std::move(r));
        }
        cv_.notify_all();  // All waiting threads wake up
    }

    // Good: Only wake one thread
    void returnResourceGood(Resource r) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            resources_.push(std::move(r));
        }
        cv_.notify_one();  // Only wake one waiting thread
    }
};
```

### Batch Operation Optimization

```cpp
class BatchQueue {
    std::queue<Item> items_;
    std::mutex mtx_;
    std::condition_variable cv_;

public:
    // Notify only once after batch addition
    void addBatch(std::vector<Item> batch) {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            for (auto& item : batch) {
                items_.push(std::move(item));
            }
        }
        // Decide notification method based on number of waiting threads
        cv_.notify_all();  // Or decide based on batch.size()
    }
};
```

## Real-World Scenarios

### Thread Pool Implementation

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
                throw std::runtime_error("Thread pool stopped");
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
            std::cout << "Task " << i << " executing on thread "
                      << std::this_thread::get_id() << "\n";
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            return i * i;
        }));
    }

    for (size_t i = 0; i < results.size(); ++i) {
        std::cout << "Result " << i << ": " << results[i].get() << "\n";
    }

    return 0;
}
```

### Readers-Writers Problem

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
        // Wait: no writers, and no waiting writers (writers priority)
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
        // Wait: no readers, no other writers
        cvWriters_.wait(lock, [this] {
            return readers_ == 0 && writers_ == 0;
        });
        --waitingWriters_;
        ++writers_;
    }

    void unlockWrite() {
        std::unique_lock<std::mutex> lock(mtx_);
        --writers_;
        // Prioritize waking writers
        if (waitingWriters_ > 0) {
            cvWriters_.notify_one();
        } else {
            cvReaders_.notify_all();
        }
    }
};

// RAII wrappers
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

// Usage example
int sharedData = 0;
ReadWriteLock rwLock;

void reader(int id) {
    for (int i = 0; i < 3; ++i) {
        ReadLockGuard guard(rwLock);
        std::cout << "Reader " << id << " read: " << sharedData << "\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
}

void writer(int id) {
    for (int i = 0; i < 2; ++i) {
        WriteLockGuard guard(rwLock);
        ++sharedData;
        std::cout << "Writer " << id << " wrote: " << sharedData << "\n";
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

### Synchronization Barrier

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
            // Last thread to arrive
            ++generation_;
            count_ = threshold_;
            cv_.notify_all();
        } else {
            // Wait for other threads
            cv_.wait(lock, [this, currentGen] {
                return currentGen != generation_;
            });
        }
    }
};

void worker(int id, Barrier& barrier) {
    for (int phase = 0; phase < 3; ++phase) {
        std::cout << "Worker " << id << " completed phase " << phase << "\n";
        std::this_thread::sleep_for(
            std::chrono::milliseconds(100 * (id + 1))
        );

        barrier.wait();  // Synchronization point

        std::cout << "Worker " << id << " starting phase " << (phase + 1) << "\n";
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

### Semaphore Implementation

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

// Using semaphore to limit concurrency
void limitedConcurrency() {
    Semaphore sem(3);  // Allow up to 3 concurrent operations

    auto task = [&sem](int id) {
        sem.acquire();

        std::cout << "Task " << id << " started (thread: "
                  << std::this_thread::get_id() << ")\n";
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::cout << "Task " << id << " completed\n";

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

## Interview Key Points

### What is a condition variable? What problem does it solve?

**Answer**: A condition variable is a synchronization primitive used to block threads until a condition is met. It solves the "wait-notify" coordination problem between threads, avoiding CPU waste caused by busy-waiting.

### What is spurious wakeup? How do you handle it?

**Answer**: Spurious wakeup is when a thread returns from wait without receiving a notify. This is determined by the operating system implementation. The solution is to always check the condition in a loop or use the predicate version of wait:

```cpp
// Correctly handling spurious wakeup
cv.wait(lock, []{ return condition; });
```

### What is the difference between notify_one and notify_all? When to use each?

**Answer**:
- `notify_one`: Only wakes one waiting thread, suitable for scenarios where only one thread can handle the event (e.g., task queues)
- `notify_all`: Wakes all waiting threads, suitable for broadcast events or state changes (e.g., shutdown operations)

### Why must condition variables be used with mutexes?

**Answer**:
1. To protect read/write access to the shared condition variable
2. The wait operation needs to atomically release the lock and enter the wait state
3. To prevent signal loss (if there's no lock protection between condition checking and waiting, notifications may be lost)

### What is the difference between condition_variable and condition_variable_any?

**Answer**:
- `condition_variable`: Can only be used with `std::unique_lock<std::mutex>`, higher performance
- `condition_variable_any`: Can be used with any lock type satisfying BasicLockable requirements, more flexible but with slight performance overhead

### How do you avoid deadlocks when using condition variables?

**Answer**:
1. Avoid calling wait while holding multiple locks
2. Release the lock before notifying (though not required, it reduces lock contention)
3. Ensure predicate functions don't attempt to acquire other locks
4. Use timed versions of wait to prevent permanent blocking

### Please implement a simple thread-safe queue

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

## Further Reading

### Official Documentation
- [cppreference - std::condition_variable](https://en.cppreference.com/w/cpp/thread/condition_variable)
- [cppreference - std::condition_variable_any](https://en.cppreference.com/w/cpp/thread/condition_variable_any)

### Classic Books
- **C++ Concurrency in Action, 2nd Edition** - Anthony Williams
  - Chapter 4 provides detailed coverage of condition variable usage
- **The C++ Standard Library, 2nd Edition** - Nicolai Josuttis
  - The concurrency chapter has complete reference for condition variables

### Technical Articles
- [Condition Variables in C++11](https://www.modernescpp.com/index.php/condition-variables)
- [Understanding Condition Variables](https://www.cprogramming.com/c++11/c++11-condition-variable.html)

### Related Topics
- [C++ Concurrent Programming](/docs/cpp/concurrency) - Concurrency Overview
- [C++ Mutex](/docs/cpp/mutex) - Mutex Explained
- [C++ Atomic Operations](/docs/cpp/atomic) - Lock-free Programming
- [C++ Coroutines](/docs/cpp/coroutines) - Modern Asynchronous Programming

### Design Pattern References
- Producer-Consumer Pattern
- Readers-Writers Problem
- Barrier Synchronization
- Semaphore Pattern
