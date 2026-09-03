---
title: Python concurrent.futures 模块
description: 掌握 Python 并发编程高级接口：ThreadPoolExecutor、ProcessPoolExecutor、Future 对象与异步执行
track: python
section: concurrency
difficulty: intermediate
tags:
  - Python
  - concurrent.futures
  - 线程池
  - 进程池
  - 并发
status: imported
origin: old/src/content/docs/python/concurrent-futures.en.md
divergence: 0.195
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 并发编程
  order: 12
  lastUpdated: 2026-01-07
---

## Concept Explanation

`concurrent.futures` is a standard library module introduced in Python 3.2 that provides a high-level interface for asynchronously executing callable objects. It abstracts the low-level details of threads and processes, allowing developers to manage concurrent tasks with a unified API.

### Historical Background

Before `concurrent.futures` appeared, Python developers needed to use the `threading` and `multiprocessing` modules directly to implement concurrency. Although these two modules are powerful, their API designs differ significantly, and they require manual management of thread/process creation, destruction, and result collection. The introduction of `concurrent.futures` solved these problems by providing:

- A unified Executor abstraction
- Standardized Future objects to represent asynchronous computation results
- Simple `submit()` and `map()` interfaces
- Convenient result collection mechanisms

### What Problems Does It Solve

1. **Simplifies concurrent programming**: No need to manually manage thread/process lifecycle
2. **Unified interface**: Thread pools and process pools use the same API, making it easy to switch between them
3. **Result management**: Future objects provide a standardized way to obtain asynchronous results
4. **Resource control**: Pooling mechanism limits the number of concurrent tasks, avoiding resource exhaustion

## Core Principles

### Architecture Design

```
                    ┌─────────────────────────────────────┐
                    │          concurrent.futures          │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
            ┌───────▼───────┐                   ┌────────▼────────┐
            │    Executor    │                   │     Future      │
            │ (Abstract Base)│                   │ (Async Result)  │
            └───────────────┘                   └─────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼─────────┐   ┌─────────▼───────────┐
│ThreadPoolExecutor│   │ProcessPoolExecutor │
│  (Thread Pool)   │   │   (Process Pool)    │
└─────────────────┘   └─────────────────────┘
```

### Workflow

1. **Create an executor**: Instantiate `ThreadPoolExecutor` or `ProcessPoolExecutor`
2. **Submit tasks**: Use `submit()` or `map()` to submit callable objects
3. **Get Future**: `submit()` returns a Future object
4. **Task execution**: The executor executes tasks in worker threads/processes
5. **Collect results**: Get execution results or exceptions through the Future

### Thread Pool vs Process Pool

| Feature | ThreadPoolExecutor | ProcessPoolExecutor |
|---------|-------------------|---------------------|
| Underlying Implementation | threading.Thread | multiprocessing.Process |
| GIL Limitation | Yes | No |
| Memory Sharing | Shared | Independent |
| Creation Overhead | Small | Large |
| Use Case | I/O-intensive | CPU-intensive |
| Data Transfer | Direct reference | Serialization/Deserialization |

## Core Concepts

### Executor Abstract Base Class

`Executor` is the abstract base class for all executors, defining the core interface:

- `submit(fn, *args, **kwargs)`: Submit a single task
- `map(fn, *iterables, timeout=None, chunksize=1)`: Batch mapping execution
- `shutdown(wait=True, cancel_futures=False)`: Shutdown the executor

### Future Object

Future represents the eventual result of an asynchronous operation and provides the following methods:

- `result(timeout=None)`: Get the result (blocking)
- `exception(timeout=None)`: Get the exception
- `done()`: Check if completed
- `cancelled()`: Check if cancelled
- `cancel()`: Attempt to cancel the task
- `add_done_callback(fn)`: Add a completion callback

### Helper Functions

- `as_completed(fs, timeout=None)`: Iterate over Futures in completion order
- `wait(fs, timeout=None, return_when=ALL_COMPLETED)`: Wait for Futures to complete

## Code Examples

### ThreadPoolExecutor Basic Usage

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests

def fetch_url(url):
    """Fetch URL content"""
    print(f"Starting to fetch: {url}")
    response = requests.get(url, timeout=10)
    return {
        'url': url,
        'status': response.status_code,
        'length': len(response.content)
    }

def io_task(task_id, duration):
    """Simulate an I/O-intensive task"""
    print(f"Task {task_id} started")
    time.sleep(duration)
    print(f"Task {task_id} completed")
    return f"Result of task {task_id}"

# Example 1: Basic usage
def basic_example():
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Submit a single task
        future = executor.submit(io_task, 1, 2)

        # Get the result (will block until complete)
        result = future.result()
        print(f"Result: {result}")

# Example 2: Submitting multiple tasks
def multiple_tasks():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []

        # Submit multiple tasks
        for i in range(5):
            future = executor.submit(io_task, i, i % 3 + 1)
            futures.append(future)

        # Wait for all tasks to complete and get results
        for future in futures:
            result = future.result()
            print(f"Got: {result}")

# Example 3: Using as_completed to process in completion order
def process_as_completed():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(io_task, i, (5 - i)): i
            for i in range(5)
        }

        # Process results in completion order
        for future in as_completed(futures):
            task_id = futures[future]
            try:
                result = future.result()
                print(f"Task {task_id} returned: {result}")
            except Exception as e:
                print(f"Task {task_id} error: {e}")

# Example 4: Batch download
def batch_download():
    urls = [
        "https://httpbin.org/get",
        "https://httpbin.org/ip",
        "https://httpbin.org/headers",
        "https://httpbin.org/user-agent"
    ]

    start = time.time()
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Submit all download tasks
        future_to_url = {
            executor.submit(fetch_url, url): url
            for url in urls
        }

        # Process completed tasks
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            try:
                data = future.result()
                print(f"Completed {data['url']}: {data['status']} ({data['length']} bytes)")
            except Exception as e:
                print(f"Failed {url}: {e}")

    print(f"Total time: {time.time() - start:.2f} seconds")

if __name__ == "__main__":
    print("=== Basic Example ===")
    basic_example()

    print("\n=== Multiple Tasks Example ===")
    multiple_tasks()

    print("\n=== as_completed Example ===")
    process_as_completed()
```

### ProcessPoolExecutor Basic Usage

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
import time
import math
import os

def cpu_intensive_task(n):
    """CPU-intensive task: count prime numbers"""
    count = 0
    for num in range(2, n):
        if all(num % i != 0 for i in range(2, int(math.sqrt(num)) + 1)):
            count += 1
    return count

def calculate_factorial(n):
    """Calculate factorial"""
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def worker_info(task_id):
    """Display worker process information"""
    pid = os.getpid()
    print(f"Task {task_id} running in process {pid}")
    time.sleep(1)
    return f"Task {task_id} (PID: {pid})"

# Example 1: Basic usage
def basic_process_pool():
    print(f"Main process PID: {os.getpid()}")

    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(worker_info, i)
            for i in range(8)
        ]

        for future in as_completed(futures):
            print(f"Completed: {future.result()}")

# Example 2: CPU-intensive tasks
def cpu_intensive_example():
    numbers = [100000, 150000, 200000, 250000]

    # Serial execution
    start = time.time()
    serial_results = [cpu_intensive_task(n) for n in numbers]
    serial_time = time.time() - start
    print(f"Serial execution time: {serial_time:.2f} seconds")

    # Parallel execution
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as executor:
        parallel_results = list(executor.map(cpu_intensive_task, numbers))
    parallel_time = time.time() - start
    print(f"Parallel execution time: {parallel_time:.2f} seconds")
    print(f"Speedup: {serial_time / parallel_time:.2f}x")

    # Verify results are consistent
    assert serial_results == parallel_results

# Example 3: Using map for batch processing
def map_example():
    numbers = list(range(10, 20))

    with ProcessPoolExecutor(max_workers=4) as executor:
        # map returns an iterator, results are returned in input order
        results = executor.map(calculate_factorial, numbers)

        for n, result in zip(numbers, results):
            print(f"{n}! = {result}")

if __name__ == "__main__":
    print("=== Basic Process Pool Example ===")
    basic_process_pool()

    print("\n=== CPU-intensive Task Comparison ===")
    cpu_intensive_example()

    print("\n=== map Batch Processing ===")
    map_example()
```

### submit() Method Explained

```python
from concurrent.futures import ThreadPoolExecutor, Future
import time

def task_with_args(a, b, c=10):
    """Task with arguments"""
    time.sleep(1)
    return a + b + c

def task_with_exception():
    """Task that raises an exception"""
    time.sleep(0.5)
    raise ValueError("Intentionally raised error")

# Various usages of submit()
with ThreadPoolExecutor(max_workers=2) as executor:
    # 1. Positional arguments
    future1 = executor.submit(task_with_args, 1, 2)

    # 2. Keyword arguments
    future2 = executor.submit(task_with_args, 1, 2, c=20)

    # 3. Mixed arguments
    future3 = executor.submit(task_with_args, a=5, b=10, c=15)

    # 4. Using lambda
    future4 = executor.submit(lambda: task_with_args(100, 200))

    # Get results
    print(f"Future 1: {future1.result()}")  # 13
    print(f"Future 2: {future2.result()}")  # 23
    print(f"Future 3: {future3.result()}")  # 30
    print(f"Future 4: {future4.result()}")  # 310

# Handling exceptions
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(task_with_exception)

    # Wait for completion
    time.sleep(1)

    # Method 1: Using exception() method
    exc = future.exception()
    if exc:
        print(f"Task exception: {type(exc).__name__}: {exc}")

    # Method 2: Using try-except to catch
    future2 = executor.submit(task_with_exception)
    try:
        result = future2.result()
    except ValueError as e:
        print(f"Caught exception: {e}")
```

### map() Method Explained

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

def process_item(item):
    """Process a single item"""
    time.sleep(0.5)
    return item * 2

def process_pair(a, b):
    """Process a pair of data"""
    time.sleep(0.3)
    return a + b

# Basic map usage
with ThreadPoolExecutor(max_workers=4) as executor:
    items = [1, 2, 3, 4, 5]

    # map returns an iterator, results are in input order
    results = executor.map(process_item, items)
    print(f"Results: {list(results)}")  # [2, 4, 6, 8, 10]

# Multi-argument map
with ThreadPoolExecutor(max_workers=4) as executor:
    list_a = [1, 2, 3, 4, 5]
    list_b = [10, 20, 30, 40, 50]

    # Using multiple iterables
    results = executor.map(process_pair, list_a, list_b)
    print(f"Paired results: {list(results)}")  # [11, 22, 33, 44, 55]

# map with timeout
with ThreadPoolExecutor(max_workers=2) as executor:
    items = list(range(10))

    try:
        # timeout sets the timeout for the entire iteration
        results = executor.map(process_item, items, timeout=2)
        for result in results:
            print(result)
    except TimeoutError:
        print("Operation timed out!")

# ProcessPoolExecutor's chunksize parameter
def simple_task(x):
    return x * x

with ProcessPoolExecutor(max_workers=4) as executor:
    items = list(range(1000))

    # chunksize controls the number of tasks sent to worker processes at a time
    # Larger chunksize reduces IPC overhead, suitable for many small tasks
    start = time.time()
    results = list(executor.map(simple_task, items, chunksize=100))
    print(f"chunksize=100 time: {time.time() - start:.3f} seconds")

    start = time.time()
    results = list(executor.map(simple_task, items, chunksize=1))
    print(f"chunksize=1 time: {time.time() - start:.3f} seconds")
```

### as_completed() Function Explained

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random

def variable_duration_task(task_id):
    """Task with variable duration"""
    duration = random.uniform(0.5, 3.0)
    time.sleep(duration)
    return {
        'task_id': task_id,
        'duration': duration
    }

def task_may_fail(task_id):
    """Task that may fail"""
    time.sleep(random.uniform(0.5, 1.5))
    if random.random() < 0.3:  # 30% failure rate
        raise Exception(f"Task {task_id} failed")
    return f"Task {task_id} succeeded"

# Basic usage
def as_completed_basic():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(variable_duration_task, i)
            for i in range(6)
        ]

        # Process in completion order
        print("Processing results in completion order:")
        for future in as_completed(futures):
            result = future.result()
            print(f"  Task {result['task_id']} completed (took {result['duration']:.2f}s)")

# as_completed with timeout
def as_completed_with_timeout():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(variable_duration_task, i)
            for i in range(10)
        ]

        try:
            # Set overall timeout
            for future in as_completed(futures, timeout=2):
                result = future.result()
                print(f"Task {result['task_id']} completed")
        except TimeoutError:
            print("Timeout! The following tasks are not completed:")
            for f in futures:
                if not f.done():
                    print(f"  - Future {id(f)}")

# Associating tasks and results
def as_completed_with_context():
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Use a dictionary to associate Future with original data
        future_to_task = {
            executor.submit(task_may_fail, i): i
            for i in range(10)
        }

        success_count = 0
        failure_count = 0

        for future in as_completed(future_to_task):
            task_id = future_to_task[future]
            try:
                result = future.result()
                print(f"Success: {result}")
                success_count += 1
            except Exception as e:
                print(f"Failed: Task {task_id} exception: {e}")
                failure_count += 1

        print(f"\nSummary: {success_count} succeeded, {failure_count} failed")

if __name__ == "__main__":
    print("=== as_completed Basic Usage ===")
    as_completed_basic()

    print("\n=== as_completed with Timeout ===")
    as_completed_with_timeout()

    print("\n=== Associating Tasks and Results ===")
    as_completed_with_context()
```

### wait() Function Explained

```python
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED, FIRST_EXCEPTION, ALL_COMPLETED
import time
import random

def task(task_id, duration):
    """Normal task"""
    time.sleep(duration)
    return f"Task {task_id} completed (took {duration}s)"

def failing_task(task_id):
    """Task that will fail"""
    time.sleep(random.uniform(0.5, 1.5))
    raise ValueError(f"Task {task_id} failed")

# Basic wait() usage
def wait_basic():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(task, i, random.uniform(1, 3))
            for i in range(5)
        ]

        # Wait for all to complete by default
        done, not_done = wait(futures)

        print(f"Completed: {len(done)}")
        print(f"Not completed: {len(not_done)}")

        for future in done:
            print(f"  Result: {future.result()}")

# FIRST_COMPLETED: Return when any one completes
def wait_first_completed():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(task, 0, 3),   # slow
            executor.submit(task, 1, 1),   # fast
            executor.submit(task, 2, 2),   # medium
        ]

        # Return when the first one completes
        done, not_done = wait(futures, return_when=FIRST_COMPLETED)

        print(f"First completed task:")
        for future in done:
            print(f"  {future.result()}")

        print(f"Still running: {len(not_done)}")

# FIRST_EXCEPTION: Return when an exception occurs or all complete
def wait_first_exception():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(task, 0, 2),
            executor.submit(failing_task, 1),  # will fail
            executor.submit(task, 2, 3),
        ]

        done, not_done = wait(futures, return_when=FIRST_EXCEPTION)

        print("Return on exception or all completed:")
        for future in done:
            try:
                print(f"  Success: {future.result()}")
            except Exception as e:
                print(f"  Failed: {e}")

# wait with timeout
def wait_with_timeout():
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(task, i, i + 1)
            for i in range(5)
        ]

        # Only wait for 2 seconds
        done, not_done = wait(futures, timeout=2)

        print(f"Completed within 2 seconds: {len(done)}")
        print(f"Timed out: {len(not_done)}")

        # Process completed tasks
        for future in done:
            print(f"  {future.result()}")

        # Optionally cancel uncompleted tasks
        for future in not_done:
            future.cancel()

if __name__ == "__main__":
    print("=== wait Basic Usage ===")
    wait_basic()

    print("\n=== FIRST_COMPLETED ===")
    wait_first_completed()

    print("\n=== FIRST_EXCEPTION ===")
    wait_first_exception()

    print("\n=== wait with Timeout ===")
    wait_with_timeout()
```

### Future Object Explained

```python
from concurrent.futures import ThreadPoolExecutor, Future
import time
import threading

def long_task(duration):
    """Long-running task"""
    time.sleep(duration)
    return f"Completed (took {duration}s)"

def failing_task():
    """Task that will fail"""
    time.sleep(1)
    raise RuntimeError("Task execution failed")

# Future states and methods
with ThreadPoolExecutor(max_workers=2) as executor:
    # Submit task to get Future
    future = executor.submit(long_task, 2)

    # done(): Check if completed
    print(f"Done: {future.done()}")  # False

    # running(): Check if running
    print(f"Running: {future.running()}")  # True

    # cancelled(): Check if cancelled
    print(f"Cancelled: {future.cancelled()}")  # False

    # result(): Get result (blocking)
    result = future.result()
    print(f"Result: {result}")

    # State after task completion
    print(f"Done: {future.done()}")  # True

# cancel(): Cancel a task
with ThreadPoolExecutor(max_workers=1) as executor:
    # Submit two tasks, only one worker thread
    future1 = executor.submit(long_task, 5)
    future2 = executor.submit(long_task, 5)  # This will be queued

    time.sleep(0.1)  # Wait for the first to start

    # Try to cancel the running task (usually fails)
    cancelled1 = future1.cancel()
    print(f"Cancel running task: {cancelled1}")  # False

    # Try to cancel the queued task (usually succeeds)
    cancelled2 = future2.cancel()
    print(f"Cancel queued task: {cancelled2}")  # True

# exception(): Get the exception
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(failing_task)

    # Wait for completion
    time.sleep(1.5)

    # Get exception (won't re-raise)
    exc = future.exception()
    if exc:
        print(f"Exception type: {type(exc).__name__}")
        print(f"Exception message: {exc}")

# add_done_callback(): Add callback
def on_complete(future):
    """Callback when task completes"""
    try:
        result = future.result()
        print(f"[Callback] Task succeeded: {result}")
    except Exception as e:
        print(f"[Callback] Task failed: {e}")

with ThreadPoolExecutor(max_workers=2) as executor:
    future1 = executor.submit(long_task, 1)
    future2 = executor.submit(failing_task)

    # Add callbacks (automatically called when task completes)
    future1.add_done_callback(on_complete)
    future2.add_done_callback(on_complete)

    # Wait for all to complete
    time.sleep(2)

# result() timeout parameter
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(long_task, 10)

    try:
        # Only wait for 2 seconds
        result = future.result(timeout=2)
    except TimeoutError:
        print("Timeout getting result")
        future.cancel()
```

## Best Practices

### Use Context Managers

```python
from concurrent.futures import ThreadPoolExecutor

def task(n):
    return n * 2

# Recommended: Use with statement
def good_practice():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(task, i) for i in range(10)]
        results = [f.result() for f in futures]
    # Executor automatically shuts down, waiting for all tasks to complete

# Not recommended: Manual management
def less_ideal_practice():
    executor = ThreadPoolExecutor(max_workers=4)
    try:
        futures = [executor.submit(task, i) for i in range(10)]
        results = [f.result() for f in futures]
    finally:
        executor.shutdown(wait=True)  # Must manually shut down
```

### Set Worker Count Appropriately

```python
import os
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# I/O-intensive: Can set more threads
def io_bound_configuration():
    # Common configuration: CPU cores * 5 or more
    max_workers = min(32, os.cpu_count() * 5)
    return ThreadPoolExecutor(max_workers=max_workers)

# CPU-intensive: Process count should not exceed CPU cores
def cpu_bound_configuration():
    # Default uses CPU core count
    return ProcessPoolExecutor()  # Equivalent to max_workers=os.cpu_count()

    # Or explicitly specify
    return ProcessPoolExecutor(max_workers=os.cpu_count())
```

### Handle Exceptions Gracefully

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def potentially_failing_task(task_id):
    """Task that may fail"""
    import random
    if random.random() < 0.3:
        raise ValueError(f"Task {task_id} failed")
    return f"Task {task_id} succeeded"

def robust_task_execution():
    """Robust task execution pattern"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(potentially_failing_task, i): i
            for i in range(10)
        }

        results = []
        errors = []

        for future in as_completed(futures):
            task_id = futures[future]
            try:
                result = future.result()
                results.append(result)
                logger.info(f"Task {task_id} succeeded")
            except Exception as e:
                errors.append({'task_id': task_id, 'error': str(e)})
                logger.error(f"Task {task_id} failed: {e}")

        return results, errors
```

### Limit Concurrency

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

def api_call(task_id):
    """Simulate API call"""
    time.sleep(0.5)
    return f"Task {task_id} completed"

class RateLimitedExecutor:
    """Executor wrapper with rate limiting"""

    def __init__(self, max_workers=10, max_concurrent=5):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.semaphore = threading.Semaphore(max_concurrent)

    def submit(self, fn, *args, **kwargs):
        def wrapped():
            with self.semaphore:
                return fn(*args, **kwargs)
        return self.executor.submit(wrapped)

    def shutdown(self, wait=True):
        self.executor.shutdown(wait=wait)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.shutdown()

# Usage example
with RateLimitedExecutor(max_workers=10, max_concurrent=3) as executor:
    futures = [executor.submit(api_call, i) for i in range(20)]
    for future in as_completed(futures):
        print(future.result())
```

### Timeout Control

```python
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import functools
import time

def slow_function(data):
    """Potentially slow function"""
    time.sleep(10)
    return data * 2

def timeout_wrapper(timeout):
    """Decorator to add timeout control to functions"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(func, *args, **kwargs)
                try:
                    return future.result(timeout=timeout)
                except TimeoutError:
                    future.cancel()
                    raise TimeoutError(f"{func.__name__} execution timed out ({timeout}s)")
        return wrapper
    return decorator

@timeout_wrapper(timeout=5)
def potentially_slow_function(data):
    """Potentially slow function"""
    time.sleep(10)
    return data

# Usage
try:
    result = potentially_slow_function("test")
except TimeoutError as e:
    print(f"Timeout: {e}")
```

## Common Pitfalls

### Using Non-Serializable Objects in ProcessPoolExecutor

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

# Wrong: lambda cannot be serialized
def bad_example():
    with ProcessPoolExecutor() as executor:
        # This will cause a serialization error
        # future = executor.submit(lambda x: x * 2, 10)
        pass

# Correct: Use top-level functions
def multiply(x):
    return x * 2

def good_example():
    with ProcessPoolExecutor() as executor:
        future = executor.submit(multiply, 10)
        print(future.result())

# Wrong: Passing non-serializable objects
class NonSerializable:
    def __init__(self):
        self.lock = multiprocessing.Lock()  # Lock cannot be serialized

def process_data(value):
    return value * 2

def bad_example_2():
    with ProcessPoolExecutor() as executor:
        # Objects containing Lock cannot be serialized
        # Need to redesign the data structure
        pass
```

### Forgetting to Handle Future Exceptions

```python
from concurrent.futures import ThreadPoolExecutor

def failing_task():
    raise ValueError("Error")

# Wrong: Ignoring exceptions
def bad_example():
    with ThreadPoolExecutor() as executor:
        future = executor.submit(failing_task)
        # Not calling result() or exception()
        # Exception will be silently ignored

    # Program continues, but task actually failed

# Correct: Always handle exceptions
def good_example():
    with ThreadPoolExecutor() as executor:
        future = executor.submit(failing_task)
        try:
            result = future.result()
        except Exception as e:
            print(f"Task failed: {e}")
            # Proper error handling
```

### Performing Time-Consuming Operations in Callbacks

```python
from concurrent.futures import ThreadPoolExecutor
import time

def task():
    return "result"

def process_result(result):
    time.sleep(5)  # Executed in worker thread
    print(f"Processing completed: {result}")

# Wrong: Time-consuming operations in callback block other callbacks
def slow_callback(future):
    result = future.result()
    time.sleep(5)  # Blocking!
    print(f"Processing completed: {result}")

# Correct: Callbacks should be lightweight, or submit new tasks
def fast_callback(future, executor):
    result = future.result()
    # Submit a new task to process the result
    executor.submit(process_result, result)
```

### Deadlock Risk

```python
from concurrent.futures import ThreadPoolExecutor
import threading

lock = threading.Lock()

def task_a(executor):
    with lock:
        print("Task A holds the lock")
        # Wrong: Waiting for another task, but only one worker thread
        # future = executor.submit(task_b)
        # future.result()  # Deadlock!

def task_b():
    with lock:
        print("Task B")

# Solution: Increase worker threads or refactor code
# executor = ThreadPoolExecutor(max_workers=2)  # More threads
```

### Ignoring shutdown's wait Parameter

```python
from concurrent.futures import ThreadPoolExecutor
import time

def task(n):
    time.sleep(n)
    return n

# Wrong: wait=False may cause tasks to not complete before exit
def bad_example():
    executor = ThreadPoolExecutor()
    futures = [executor.submit(task, i) for i in range(5)]
    executor.shutdown(wait=False)  # Don't wait for tasks to complete
    # Main program may exit before tasks complete

# Correct: Ensure waiting for tasks to complete
def good_example():
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(task, i) for i in range(5)]
        results = [f.result() for f in futures]
    # with statement automatically calls shutdown(wait=True)
```

## Performance Considerations

### Thread Pool vs Process Pool Performance Comparison

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time
import math

def cpu_bound(n):
    """CPU-intensive"""
    return sum(math.sqrt(i) for i in range(n))

def io_bound(duration):
    """I/O-intensive"""
    time.sleep(duration)
    return duration

def benchmark():
    iterations = [10000000] * 4
    durations = [1] * 4

    print("=== CPU-intensive Tasks ===")

    # Serial
    start = time.time()
    [cpu_bound(n) for n in iterations]
    serial_time = time.time() - start
    print(f"Serial: {serial_time:.2f}s")

    # ThreadPoolExecutor
    start = time.time()
    with ThreadPoolExecutor(max_workers=4) as e:
        list(e.map(cpu_bound, iterations))
    thread_time = time.time() - start
    print(f"Thread pool: {thread_time:.2f}s (speedup: {serial_time/thread_time:.2f}x)")

    # ProcessPoolExecutor
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as e:
        list(e.map(cpu_bound, iterations))
    process_time = time.time() - start
    print(f"Process pool: {process_time:.2f}s (speedup: {serial_time/process_time:.2f}x)")

    print("\n=== I/O-intensive Tasks ===")

    # Serial
    start = time.time()
    [io_bound(d) for d in durations]
    serial_time = time.time() - start
    print(f"Serial: {serial_time:.2f}s")

    # ThreadPoolExecutor
    start = time.time()
    with ThreadPoolExecutor(max_workers=4) as e:
        list(e.map(io_bound, durations))
    thread_time = time.time() - start
    print(f"Thread pool: {thread_time:.2f}s (speedup: {serial_time/thread_time:.2f}x)")

    # ProcessPoolExecutor
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as e:
        list(e.map(io_bound, durations))
    process_time = time.time() - start
    print(f"Process pool: {process_time:.2f}s (speedup: {serial_time/process_time:.2f}x)")

if __name__ == "__main__":
    benchmark()
```

### Impact of chunksize on Performance

```python
from concurrent.futures import ProcessPoolExecutor
import time

def simple_task(x):
    return x * x

def test_chunksize():
    items = list(range(10000))

    for chunksize in [1, 10, 100, 1000]:
        start = time.time()
        with ProcessPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(simple_task, items, chunksize=chunksize))
        elapsed = time.time() - start
        print(f"chunksize={chunksize}: {elapsed:.3f}s")

# Example results:
# chunksize=1: 2.847s    (high IPC overhead)
# chunksize=10: 0.312s
# chunksize=100: 0.089s
# chunksize=1000: 0.052s (optimal)

if __name__ == "__main__":
    test_chunksize()
```

### Memory Usage Optimization

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import gc

def processor(item):
    """Process a single item"""
    return item * 2

def memory_efficient_processing(items, batch_size=100):
    """Memory-friendly batch processing"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Process in batches to avoid creating too many Futures at once
        for i in range(0, len(items), batch_size):
            batch = items[i:i+batch_size]
            futures = [executor.submit(processor, item) for item in batch]

            # Process current batch results
            for future in as_completed(futures):
                yield future.result()

            # Optional: Force garbage collection
            gc.collect()
```

## Practical Scenarios

### Scenario 1: Concurrent API Requests

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import time

class APIClient:
    """Concurrent API client"""

    def __init__(self, base_url, max_workers=10, timeout=30):
        self.base_url = base_url
        self.max_workers = max_workers
        self.timeout = timeout
        self.session = requests.Session()

    def fetch(self, endpoint):
        """Fetch a single endpoint"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def batch_fetch(self, endpoints):
        """Batch fetch multiple endpoints"""
        results = {}

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_endpoint = {
                executor.submit(self.fetch, ep): ep
                for ep in endpoints
            }

            for future in as_completed(future_to_endpoint):
                endpoint = future_to_endpoint[future]
                try:
                    results[endpoint] = {
                        'success': True,
                        'data': future.result()
                    }
                except Exception as e:
                    results[endpoint] = {
                        'success': False,
                        'error': str(e)
                    }

        return results

# Usage example
# client = APIClient("https://api.github.com")
# endpoints = ["/users/python", "/users/django", "/users/flask"]
# results = client.batch_fetch(endpoints)
```

### Scenario 2: Parallel File Processing

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
import os
import hashlib
from pathlib import Path

def calculate_file_hash(filepath):
    """Calculate file's MD5 hash"""
    hash_md5 = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_md5.update(chunk)
    return {
        'file': str(filepath),
        'hash': hash_md5.hexdigest(),
        'size': os.path.getsize(filepath)
    }

def process_directory(directory, pattern="*"):
    """Process files in directory in parallel"""
    directory = Path(directory)
    files = list(directory.glob(pattern))

    results = []
    with ProcessPoolExecutor() as executor:
        futures = {
            executor.submit(calculate_file_hash, f): f
            for f in files if f.is_file()
        }

        for future in as_completed(futures):
            filepath = futures[future]
            try:
                result = future.result()
                results.append(result)
                print(f"Processed: {filepath.name}")
            except Exception as e:
                print(f"Failed: {filepath.name} - {e}")

    return results

# Usage example
# results = process_directory("/path/to/directory", "*.txt")
```

### Scenario 3: Database Batch Operations

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
import threading

class DatabasePool:
    """Simple database connection pool simulation"""

    def __init__(self, connection_factory, pool_size=5):
        self.connection_factory = connection_factory
        self.pool_size = pool_size
        self.connections = []
        self.lock = threading.Lock()
        self._initialize_pool()

    def _initialize_pool(self):
        for _ in range(self.pool_size):
            self.connections.append(self.connection_factory())

    @contextmanager
    def get_connection(self):
        conn = None
        with self.lock:
            if self.connections:
                conn = self.connections.pop()

        if conn is None:
            conn = self.connection_factory()

        try:
            yield conn
        finally:
            with self.lock:
                if len(self.connections) < self.pool_size:
                    self.connections.append(conn)

def batch_insert(db_pool, data_chunks):
    """Batch insert data"""
    def insert_chunk(chunk):
        with db_pool.get_connection() as conn:
            # Execute insert operation
            cursor = conn.cursor()
            cursor.executemany(
                "INSERT INTO table_name (col1, col2) VALUES (?, ?)",
                chunk
            )
            conn.commit()
            return len(chunk)

    total_inserted = 0
    with ThreadPoolExecutor(max_workers=db_pool.pool_size) as executor:
        futures = [executor.submit(insert_chunk, chunk) for chunk in data_chunks]

        for future in as_completed(futures):
            try:
                count = future.result()
                total_inserted += count
            except Exception as e:
                print(f"Insert failed: {e}")

    return total_inserted
```

### Scenario 4: Image Processing Pipeline

```python
from concurrent.futures import ProcessPoolExecutor
import os

# Note: PIL requires the pillow library to be installed
# from PIL import Image

def process_image(input_path, output_path, size=(800, 600)):
    """Process a single image"""
    try:
        # Pseudo-code representing image processing logic
        # with Image.open(input_path) as img:
        #     img.thumbnail(size)
        #     img.save(output_path, optimize=True)
        return {'input': input_path, 'output': output_path, 'success': True}
    except Exception as e:
        return {'input': input_path, 'error': str(e), 'success': False}

def batch_process_images(input_dir, output_dir, max_workers=None):
    """Batch process images"""
    os.makedirs(output_dir, exist_ok=True)

    # Get all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}
    input_files = [
        f for f in os.listdir(input_dir)
        if os.path.splitext(f)[1].lower() in image_extensions
    ]

    # Prepare task parameters
    tasks = [
        (
            os.path.join(input_dir, f),
            os.path.join(output_dir, f)
        )
        for f in input_files
    ]

    results = {'success': 0, 'failed': 0}

    # Use process pool for processing (CPU-intensive image processing)
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_image, input_path, output_path)
            for input_path, output_path in tasks
        ]

        for future in futures:
            result = future.result()
            if result['success']:
                results['success'] += 1
                print(f"Processed: {os.path.basename(result['output'])}")
            else:
                results['failed'] += 1
                print(f"Failed: {result['input']} - {result['error']}")

    print(f"\nTotal: {results['success']} succeeded, {results['failed']} failed")
    return results
```

## Interview Key Points

### Basic Concept Questions

**Q: What are the core components of the concurrent.futures module?**

A: The core components include:
- `Executor`: Abstract base class, defines `submit()` and `map()` interfaces
- `ThreadPoolExecutor`: Uses thread pool to execute tasks
- `ProcessPoolExecutor`: Uses process pool to execute tasks
- `Future`: Represents the result of an asynchronous operation
- `as_completed()`: Iterates over Futures in completion order
- `wait()`: Waits for Futures to complete

**Q: What are the main differences between ThreadPoolExecutor and ProcessPoolExecutor?**

A:
- `ThreadPoolExecutor` is thread-based, limited by GIL, suitable for I/O-intensive tasks
- `ProcessPoolExecutor` is process-based, not limited by GIL, suitable for CPU-intensive tasks
- Process pool has serialization overhead, poor performance when passing large objects
- Thread pool shares memory, process pool has independent memory

### Advanced Questions

**Q: What are the differences between submit() and map()? When to use which?**

A:
```python
# submit(): Returns Future object, more flexible
future = executor.submit(func, arg1, arg2)
result = future.result()

# map(): Returns iterator, results in input order
results = executor.map(func, iterable)

# Use cases:
# - submit(): Need fine-grained control, get exception details, use callbacks
# - map(): Batch processing, simple scenarios, care about order
```

**Q: How to handle exceptions in Future?**

A:
```python
# Method 1: Using result() will re-raise the exception
try:
    result = future.result()
except Exception as e:
    handle_error(e)

# Method 2: Using exception() to get the exception object
exc = future.exception()
if exc:
    handle_error(exc)

# Method 3: Handle in as_completed loop
for future in as_completed(futures):
    try:
        result = future.result()
    except Exception as e:
        handle_error(e)
```

**Q: Why does ProcessPoolExecutor require callable objects to be serializable?**

A: Because memory is independent between processes, tasks need to be transferred to worker processes through serialization. Non-serializable objects (like lambda, local functions, objects containing Lock) will cause errors.

### Practical Questions

**Q: How to implement concurrent task execution with retry mechanism?**

A:
```python
import time

def retry_task(func, args, max_retries=3, delay=1):
    for attempt in range(max_retries):
        try:
            return func(*args)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(delay * (2 ** attempt))  # Exponential backoff

with ThreadPoolExecutor() as executor:
    futures = [
        executor.submit(retry_task, process, (data,))
        for data in items
    ]
```

**Q: How to gracefully cancel running tasks?**

A: `Future.cancel()` can only cancel tasks that haven't started yet. For running tasks:
- Thread tasks: Use `threading.Event` for cooperative cancellation
- Process tasks: Use `multiprocessing.Event` or send signals

```python
import threading

stop_event = threading.Event()

def cancellable_task(stop_event):
    while not stop_event.is_set():
        # Perform work
        pass
    return "Cancelled"

# Cancel task
stop_event.set()
```

## Further Reading

### Official Documentation
- [concurrent.futures Official Documentation](https://docs.python.org/3/library/concurrent.futures.html)
- [PEP 3148 - futures - execute computations asynchronously](https://peps.python.org/pep-3148/)

### Related Modules
- [threading Module Documentation](https://docs.python.org/3/library/threading.html)
- [multiprocessing Module Documentation](https://docs.python.org/3/library/multiprocessing.html)
- [asyncio Module Documentation](https://docs.python.org/3/library/asyncio.html)

### Recommended Books
- "Python Concurrency with asyncio"
- "Effective Python" Chapter 7: Concurrency and Parallelism
- "High Performance Python"

### Quality Articles
- [Real Python - Python Concurrency](https://realpython.com/python-concurrency/)
- [Python ThreadPoolExecutor Tutorial](https://superfastpython.com/threadpoolexecutor-in-python/)
- [Python ProcessPoolExecutor Tutorial](https://superfastpython.com/processpoolexecutor-in-python/)
