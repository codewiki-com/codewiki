---
title: Python Threading and Multiprocessing
description: "Master Python concurrent programming: threading, multiprocessing, GIL and IPC"
track: python
section: concurrency
difficulty: advanced
tags:
  - Python
  - Threading
  - Multiprocessing
  - GIL
status: imported
origin: old/src/content/docs/python/threading-multiprocessing.en.md
divergence: 0.33
issues: []
legacy:
  category: Python
  subcategory: Concurrent Programming
  order: 11
  lastUpdated: 2026-01-07
---

Concurrent programming is essential for building high-performance applications. Python offers two primary approaches: threading for I/O-bound tasks and multiprocessing for CPU-bound operations. Understanding when and how to use each is crucial for optimal performance.

## Understanding Concurrency in Python

Python supports three main concurrency models:

- **Threading**: Multiple threads in a single process (shared memory)
- **Multiprocessing**: Multiple processes (separate memory spaces)
- **Asyncio**: Asynchronous I/O with event loops (covered separately)

### When to Use Each

**Use Threading for:**
- I/O-bound tasks (file operations, network requests, database queries)
- Tasks that spend time waiting for external resources
- Shared state management between concurrent operations

**Use Multiprocessing for:**
- CPU-bound tasks (calculations, data processing, image manipulation)
- Tasks requiring true parallelism
- Bypassing the GIL limitations

## The Global Interpreter Lock (GIL)

The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecode simultaneously.

### Why the GIL Exists

```python
# The GIL prevents race conditions in reference counting
import sys

x = []
# Each object has a reference count
print(sys.getrefcount(x))  # 2 (x and getrefcount's argument)

y = x
print(sys.getrefcount(x))  # 3 (x, y, and getrefcount's argument)
```

### GIL Impact Demonstration

```python
import threading
import time

def cpu_bound_task(n):
    """CPU-intensive task affected by GIL"""
    count = 0
    for i in range(n):
        count += i ** 2
    return count

def io_bound_task(n):
    """I/O task not significantly affected by GIL"""
    time.sleep(n)
    return "Done"

# CPU-bound with threading (limited by GIL)
start = time.time()
threads = []
for _ in range(4):
    t = threading.Thread(target=cpu_bound_task, args=(10_000_000,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
print(f"Threading (CPU-bound): {time.time() - start:.2f}s")

# I/O-bound with threading (benefits from concurrency)
start = time.time()
threads = []
for _ in range(4):
    t = threading.Thread(target=io_bound_task, args=(1,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
print(f"Threading (I/O-bound): {time.time() - start:.2f}s")
```

## Threading Module

The `threading` module provides high-level threading capabilities.

### Basic Thread Creation

```python
import threading
import time

def worker(name, delay):
    """Simple worker function"""
    print(f"Thread {name}: starting")
    time.sleep(delay)
    print(f"Thread {name}: finishing")

# Method 1: Using Thread class directly
thread1 = threading.Thread(target=worker, args=("A", 2))
thread2 = threading.Thread(target=worker, args=("B", 1))

thread1.start()
thread2.start()

# Wait for threads to complete
thread1.join()
thread2.join()

print("All threads finished")
```

### Subclassing Thread

```python
import threading
import time

class WorkerThread(threading.Thread):
    def __init__(self, name, delay):
        super().__init__()
        self.name = name
        self.delay = delay
        self.result = None

    def run(self):
        """Override run method"""
        print(f"Thread {self.name}: starting")
        time.sleep(self.delay)
        self.result = f"Thread {self.name} completed"
        print(f"Thread {self.name}: finishing")

# Create and start threads
threads = [
    WorkerThread("Worker-1", 2),
    WorkerThread("Worker-2", 1),
    WorkerThread("Worker-3", 1.5)
]

for t in threads:
    t.start()

for t in threads:
    t.join()
    print(f"Result: {t.result}")
```

### Thread-Safe Operations

```python
import threading

# Shared resource
counter = 0
lock = threading.Lock()

def increment_counter(iterations):
    global counter
    for _ in range(iterations):
        # Without lock: race condition
        # counter += 1

        # With lock: thread-safe
        with lock:
            counter += 1

# Create multiple threads
threads = []
for _ in range(10):
    t = threading.Thread(target=increment_counter, args=(100_000,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print(f"Final counter value: {counter}")  # Should be 1,000,000
```

### Thread Local Data

```python
import threading
import random

# Thread-local storage
thread_local = threading.local()

def process_data():
    """Each thread has its own copy of 'value'"""
    if not hasattr(thread_local, 'value'):
        thread_local.value = random.randint(1, 100)

    print(f"{threading.current_thread().name}: {thread_local.value}")
    thread_local.value += 10
    print(f"{threading.current_thread().name}: {thread_local.value}")

threads = [threading.Thread(target=process_data) for _ in range(5)]

for t in threads:
    t.start()
for t in threads:
    t.join()
```

### Daemon Threads

```python
import threading
import time

def background_task():
    """Daemon thread runs in background"""
    while True:
        print("Background task running...")
        time.sleep(2)

def main_task():
    """Main task"""
    for i in range(5):
        print(f"Main task: {i}")
        time.sleep(1)

# Create daemon thread
daemon = threading.Thread(target=background_task, daemon=True)
daemon.start()

# Main task
main_task()

print("Main program exiting (daemon thread will terminate)")
```

## Multiprocessing Module

The `multiprocessing` module creates separate Python processes, each with its own interpreter and GIL.

### Basic Process Creation

```python
import multiprocessing
import os
import time

def worker(name, delay):
    """Worker function running in separate process"""
    print(f"Process {name} (PID: {os.getpid()}): starting")
    time.sleep(delay)
    print(f"Process {name} (PID: {os.getpid()}): finishing")
    return f"Result from {name}"

if __name__ == '__main__':
    print(f"Main process PID: {os.getpid()}")

    # Create processes
    p1 = multiprocessing.Process(target=worker, args=("A", 2))
    p2 = multiprocessing.Process(target=worker, args=("B", 1))

    p1.start()
    p2.start()

    p1.join()
    p2.join()

    print("All processes finished")
```

### CPU-Bound Processing

```python
import multiprocessing
import time

def cpu_intensive(n):
    """CPU-intensive calculation"""
    result = 0
    for i in range(n):
        result += i ** 2
    return result

def benchmark_sequential(iterations, n):
    """Sequential processing"""
    start = time.time()
    results = [cpu_intensive(n) for _ in range(iterations)]
    return time.time() - start

def benchmark_multiprocessing(iterations, n):
    """Parallel processing"""
    start = time.time()
    with multiprocessing.Pool() as pool:
        results = pool.map(cpu_intensive, [n] * iterations)
    return time.time() - start

if __name__ == '__main__':
    iterations = 8
    n = 10_000_000

    seq_time = benchmark_sequential(iterations, n)
    print(f"Sequential: {seq_time:.2f}s")

    mp_time = benchmark_multiprocessing(iterations, n)
    print(f"Multiprocessing: {mp_time:.2f}s")
    print(f"Speedup: {seq_time / mp_time:.2f}x")
```

### Sharing Data with Value and Array

```python
import multiprocessing
import time

def increment_shared(shared_value, shared_array, lock):
    """Increment shared memory"""
    for i in range(100):
        with lock:
            shared_value.value += 1
            for j in range(len(shared_array)):
                shared_array[j] += 1

if __name__ == '__main__':
    # Shared memory objects
    shared_value = multiprocessing.Value('i', 0)  # 'i' = integer
    shared_array = multiprocessing.Array('i', [0, 0, 0])  # array of 3 integers
    lock = multiprocessing.Lock()

    # Create processes
    processes = [
        multiprocessing.Process(
            target=increment_shared,
            args=(shared_value, shared_array, lock)
        )
        for _ in range(4)
    ]

    for p in processes:
        p.start()
    for p in processes:
        p.join()

    print(f"Shared value: {shared_value.value}")  # Should be 400
    print(f"Shared array: {list(shared_array)}")  # Should be [400, 400, 400]
```

### Process with Return Values

```python
import multiprocessing

def calculate_square(n):
    """Return square of number"""
    return n * n

if __name__ == '__main__':
    # Using Queue for return values
    def worker_with_queue(n, queue):
        result = calculate_square(n)
        queue.put((n, result))

    queue = multiprocessing.Queue()
    processes = []

    for i in range(5):
        p = multiprocessing.Process(target=worker_with_queue, args=(i, queue))
        processes.append(p)
        p.start()

    for p in processes:
        p.join()

    # Collect results
    results = {}
    while not queue.empty():
        n, result = queue.get()
        results[n] = result

    print(f"Results: {results}")
```

## Locks and Synchronization

Synchronization primitives prevent race conditions and coordinate thread/process execution.

### Lock (Mutex)

```python
import threading
import time

class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance
        self.lock = threading.Lock()

    def deposit(self, amount):
        with self.lock:
            print(f"Depositing {amount}")
            new_balance = self.balance + amount
            time.sleep(0.001)  # Simulate processing
            self.balance = new_balance

    def withdraw(self, amount):
        with self.lock:
            print(f"Withdrawing {amount}")
            if self.balance >= amount:
                new_balance = self.balance - amount
                time.sleep(0.001)  # Simulate processing
                self.balance = new_balance
                return True
            return False

account = BankAccount(1000)

def perform_transactions():
    for _ in range(5):
        account.deposit(100)
        account.withdraw(50)

threads = [threading.Thread(target=perform_transactions) for _ in range(3)]

for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Final balance: {account.balance}")  # Should be 1750
```

### RLock (Reentrant Lock)

```python
import threading

class RecursiveCounter:
    def __init__(self):
        self.value = 0
        self.lock = threading.RLock()  # Reentrant lock

    def increment(self, n=1):
        with self.lock:
            if n > 1:
                # Can acquire lock again (reentrant)
                self.increment(n - 1)
            self.value += 1

counter = RecursiveCounter()
counter.increment(5)
print(f"Counter value: {counter.value}")  # 5
```

### Semaphore

```python
import threading
import time
import random

class ConnectionPool:
    def __init__(self, max_connections):
        self.semaphore = threading.Semaphore(max_connections)

    def execute_query(self, query_id):
        print(f"Query {query_id}: waiting for connection...")

        with self.semaphore:
            print(f"Query {query_id}: executing")
            time.sleep(random.uniform(0.5, 2))  # Simulate query
            print(f"Query {query_id}: completed")

pool = ConnectionPool(max_connections=3)

# Create 10 queries but only 3 can run concurrently
threads = [
    threading.Thread(target=pool.execute_query, args=(i,))
    for i in range(10)
]

for t in threads:
    t.start()
for t in threads:
    t.join()
```

### Event

```python
import threading
import time

def wait_for_event(event, name):
    """Wait for event to be set"""
    print(f"{name}: waiting for event")
    event.wait()
    print(f"{name}: event received, proceeding")

def trigger_event(event, delay):
    """Set event after delay"""
    print(f"Event will be triggered in {delay} seconds")
    time.sleep(delay)
    print("Triggering event!")
    event.set()

event = threading.Event()

# Create waiting threads
waiters = [
    threading.Thread(target=wait_for_event, args=(event, f"Thread-{i}"))
    for i in range(5)
]

# Create trigger thread
trigger = threading.Thread(target=trigger_event, args=(event, 2))

for t in waiters:
    t.start()
trigger.start()

for t in waiters:
    t.join()
trigger.join()
```

### Condition Variable

```python
import threading
import time
import random

class ProducerConsumer:
    def __init__(self):
        self.items = []
        self.condition = threading.Condition()

    def produce(self, item):
        with self.condition:
            self.items.append(item)
            print(f"Produced: {item} (queue size: {len(self.items)})")
            self.condition.notify()  # Wake up consumer

    def consume(self):
        with self.condition:
            while not self.items:
                print("Consumer waiting...")
                self.condition.wait()  # Wait for items

            item = self.items.pop(0)
            print(f"Consumed: {item} (queue size: {len(self.items)})")
            return item

pc = ProducerConsumer()

def producer():
    for i in range(5):
        time.sleep(random.uniform(0.1, 0.5))
        pc.produce(f"Item-{i}")

def consumer():
    for _ in range(5):
        time.sleep(random.uniform(0.2, 0.8))
        pc.consume()

producer_thread = threading.Thread(target=producer)
consumer_thread = threading.Thread(target=consumer)

consumer_thread.start()
time.sleep(0.1)  # Ensure consumer starts first
producer_thread.start()

producer_thread.join()
consumer_thread.join()
```

### Barrier

```python
import threading
import time
import random

def worker(barrier, name):
    """Worker waits at barrier for all threads"""
    print(f"{name}: preparing...")
    time.sleep(random.uniform(0.5, 2))

    print(f"{name}: waiting at barrier")
    barrier.wait()  # Wait for all threads

    print(f"{name}: proceeding after barrier")

# Create barrier for 5 threads
barrier = threading.Barrier(5)

threads = [
    threading.Thread(target=worker, args=(barrier, f"Thread-{i}"))
    for i in range(5)
]

for t in threads:
    t.start()
for t in threads:
    t.join()

print("All threads synchronized and completed")
```

## Inter-Process Communication

Processes don't share memory by default, requiring IPC mechanisms.

### Queue

```python
import multiprocessing
import time

def producer(queue, items):
    """Produce items and put in queue"""
    for item in items:
        time.sleep(0.1)
        queue.put(item)
        print(f"Produced: {item}")
    queue.put(None)  # Sentinel value

def consumer(queue):
    """Consume items from queue"""
    while True:
        item = queue.get()
        if item is None:
            break
        print(f"Consumed: {item}")
        time.sleep(0.2)

if __name__ == '__main__':
    queue = multiprocessing.Queue()
    items = [f"Item-{i}" for i in range(10)]

    p1 = multiprocessing.Process(target=producer, args=(queue, items))
    p2 = multiprocessing.Process(target=consumer, args=(queue,))

    p1.start()
    p2.start()

    p1.join()
    p2.join()
```

### Pipe

```python
import multiprocessing

def sender(conn, messages):
    """Send messages through pipe"""
    for msg in messages:
        conn.send(msg)
        print(f"Sent: {msg}")
    conn.send(None)
    conn.close()

def receiver(conn):
    """Receive messages from pipe"""
    while True:
        msg = conn.recv()
        if msg is None:
            break
        print(f"Received: {msg}")
    conn.close()

if __name__ == '__main__':
    # Create pipe (returns two connections)
    parent_conn, child_conn = multiprocessing.Pipe()

    messages = ["Hello", "World", "From", "Pipe"]

    p1 = multiprocessing.Process(target=sender, args=(parent_conn, messages))
    p2 = multiprocessing.Process(target=receiver, args=(child_conn,))

    p1.start()
    p2.start()

    p1.join()
    p2.join()
```

### Manager

```python
import multiprocessing
import time

def worker(shared_dict, shared_list, name):
    """Modify shared objects"""
    shared_dict[name] = f"Data from {name}"
    shared_list.append(name)
    time.sleep(0.1)

if __name__ == '__main__':
    with multiprocessing.Manager() as manager:
        # Managed shared objects
        shared_dict = manager.dict()
        shared_list = manager.list()

        processes = [
            multiprocessing.Process(
                target=worker,
                args=(shared_dict, shared_list, f"Process-{i}")
            )
            for i in range(5)
        ]

        for p in processes:
            p.start()
        for p in processes:
            p.join()

        print(f"Shared dict: {dict(shared_dict)}")
        print(f"Shared list: {list(shared_list)}")
```

## Thread and Process Pools

Pools manage a collection of worker threads/processes for efficient task execution.

### ThreadPoolExecutor

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests

def fetch_url(url):
    """Fetch URL and return content length"""
    try:
        response = requests.get(url, timeout=5)
        return url, len(response.content)
    except Exception as e:
        return url, str(e)

urls = [
    "https://www.python.org",
    "https://www.github.com",
    "https://www.stackoverflow.com",
    "https://www.reddit.com",
    "https://www.wikipedia.org"
]

# Using ThreadPoolExecutor for I/O-bound tasks
print("Fetching URLs concurrently...")
start = time.time()

with ThreadPoolExecutor(max_workers=5) as executor:
    # Submit tasks
    future_to_url = {executor.submit(fetch_url, url): url for url in urls}

    # Process completed tasks as they finish
    for future in as_completed(future_to_url):
        url = future_to_url[future]
        try:
            original_url, result = future.result()
            print(f"{original_url}: {result} bytes")
        except Exception as e:
            print(f"{url}: Error - {e}")

print(f"Total time: {time.time() - start:.2f}s")

# Using map method
print("\nUsing map method:")
with ThreadPoolExecutor(max_workers=5) as executor:
    results = executor.map(fetch_url, urls)
    for url, result in results:
        print(f"{url}: {result}")
```

### ProcessPoolExecutor

```python
from concurrent.futures import ProcessPoolExecutor
import time

def calculate_primes(n):
    """Calculate prime numbers up to n"""
    primes = []
    for num in range(2, n + 1):
        is_prime = True
        for i in range(2, int(num ** 0.5) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return len(primes)

if __name__ == '__main__':
    numbers = [100000, 200000, 300000, 400000, 500000]

    # Sequential processing
    start = time.time()
    results_seq = [calculate_primes(n) for n in numbers]
    seq_time = time.time() - start
    print(f"Sequential: {seq_time:.2f}s")
    print(f"Results: {results_seq}")

    # Parallel processing
    start = time.time()
    with ProcessPoolExecutor() as executor:
        results_parallel = list(executor.map(calculate_primes, numbers))
    parallel_time = time.time() - start
    print(f"Parallel: {parallel_time:.2f}s")
    print(f"Results: {results_parallel}")
    print(f"Speedup: {seq_time / parallel_time:.2f}x")
```

### Custom Thread Pool

```python
import threading
import queue
import time

class ThreadPool:
    def __init__(self, num_threads):
        self.tasks = queue.Queue()
        self.results = []
        self.workers = []

        for _ in range(num_threads):
            worker = threading.Thread(target=self._worker)
            worker.daemon = True
            worker.start()
            self.workers.append(worker)

    def _worker(self):
        """Worker thread that processes tasks"""
        while True:
            func, args, kwargs = self.tasks.get()
            if func is None:
                break
            try:
                result = func(*args, **kwargs)
                self.results.append(result)
            except Exception as e:
                print(f"Error: {e}")
            finally:
                self.tasks.task_done()

    def submit(self, func, *args, **kwargs):
        """Submit task to pool"""
        self.tasks.put((func, args, kwargs))

    def wait_completion(self):
        """Wait for all tasks to complete"""
        self.tasks.join()

    def shutdown(self):
        """Shutdown pool"""
        for _ in self.workers:
            self.tasks.put((None, None, None))
        for worker in self.workers:
            worker.join()

def task(n):
    """Sample task"""
    time.sleep(0.1)
    return n * n

# Usage
pool = ThreadPool(num_threads=4)

for i in range(10):
    pool.submit(task, i)

pool.wait_completion()
print(f"Results: {pool.results}")
pool.shutdown()
```

### Multiprocessing Pool with Context Manager

```python
import multiprocessing
import time

def process_data(data):
    """Process data item"""
    time.sleep(0.1)
    return data ** 2, data ** 3

if __name__ == '__main__':
    data = list(range(20))

    with multiprocessing.Pool(processes=4) as pool:
        # Method 1: map
        results = pool.map(process_data, data)
        print(f"Map results: {results[:5]}...")

        # Method 2: starmap (multiple arguments)
        def process_multiple(x, y):
            return x + y, x * y

        pairs = [(i, i + 1) for i in range(10)]
        results = pool.starmap(process_multiple, pairs)
        print(f"Starmap results: {results[:5]}...")

        # Method 3: apply_async (non-blocking)
        async_results = [pool.apply_async(process_data, (i,)) for i in range(5)]
        results = [r.get() for r in async_results]
        print(f"Async results: {results}")
```

## Best Practices

### Choose the Right Tool

```python
import time
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def io_bound_task():
    """I/O-bound: Use threading"""
    time.sleep(1)
    return "I/O complete"

def cpu_bound_task(n):
    """CPU-bound: Use multiprocessing"""
    result = sum(i * i for i in range(n))
    return result

if __name__ == '__main__':
    # I/O-bound: ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(io_bound_task) for _ in range(4)]
        results = [f.result() for f in futures]

    # CPU-bound: ProcessPoolExecutor
    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(cpu_bound_task, 1_000_000) for _ in range(4)]
        results = [f.result() for f in futures]
```

### Avoid Shared State When Possible

```python
import multiprocessing

# Bad: Shared mutable state
shared_list = []

def bad_worker(n):
    shared_list.append(n)  # Race condition!

# Good: Return values instead
def good_worker(n):
    return n * n

if __name__ == '__main__':
    with multiprocessing.Pool() as pool:
        results = pool.map(good_worker, range(10))
    print(results)
```

### Use Context Managers

```python
import threading
from concurrent.futures import ThreadPoolExecutor

# Good: Automatic cleanup
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(lambda x: x * 2, i) for i in range(10)]
    results = [f.result() for f in futures]
# Executor automatically shuts down

# With locks
lock = threading.Lock()
with lock:
    # Critical section
    pass
# Lock automatically released
```

### Handle Exceptions Properly

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def risky_task(n):
    if n % 3 == 0:
        raise ValueError(f"Invalid value: {n}")
    return n * n

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = {executor.submit(risky_task, i): i for i in range(10)}

    for future in as_completed(futures):
        i = futures[future]
        try:
            result = future.result()
            print(f"Task {i}: {result}")
        except Exception as e:
            print(f"Task {i} failed: {e}")
```

### Set Appropriate Timeouts

```python
import threading
import time

def slow_task():
    time.sleep(10)
    return "Done"

# With timeout
thread = threading.Thread(target=slow_task)
thread.start()
thread.join(timeout=2)

if thread.is_alive():
    print("Task is still running (timeout reached)")
else:
    print("Task completed")
```

### Use Queue for Producer-Consumer Patterns

```python
import threading
import queue
import time

def producer(q, items):
    for item in items:
        q.put(item)
        time.sleep(0.1)
    q.put(None)  # Sentinel

def consumer(q):
    while True:
        item = q.get()
        if item is None:
            q.task_done()
            break
        print(f"Processing: {item}")
        time.sleep(0.2)
        q.task_done()

q = queue.Queue()
items = list(range(10))

t1 = threading.Thread(target=producer, args=(q, items))
t2 = threading.Thread(target=consumer, args=(q,))

t1.start()
t2.start()

t1.join()
t2.join()
q.join()  # Wait for queue to be empty
```

### Profile and Monitor

```python
import threading
import time
import cProfile

def monitored_task(name):
    print(f"[{threading.current_thread().name}] Starting {name}")
    time.sleep(1)
    print(f"[{threading.current_thread().name}] Finished {name}")

# Profile threading code
def run_threads():
    threads = [
        threading.Thread(target=monitored_task, args=(f"Task-{i}",), name=f"Thread-{i}")
        for i in range(4)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

cProfile.run('run_threads()')
```

### Limit Resource Consumption

```python
import multiprocessing
import os

def get_optimal_workers():
    """Get optimal number of workers based on CPU count"""
    cpu_count = os.cpu_count() or 1

    # For CPU-bound tasks: use CPU count
    cpu_bound_workers = cpu_count

    # For I/O-bound tasks: can use more (2-5x CPU count)
    io_bound_workers = cpu_count * 2

    return cpu_bound_workers, io_bound_workers

if __name__ == '__main__':
    cpu_workers, io_workers = get_optimal_workers()
    print(f"CPU-bound workers: {cpu_workers}")
    print(f"I/O-bound workers: {io_workers}")

    # Use appropriate pool size
    with multiprocessing.Pool(processes=cpu_workers) as pool:
        # Process CPU-bound tasks
        pass
```

## Summary

Python's threading and multiprocessing modules provide powerful tools for concurrent programming:

- **Threading**: Best for I/O-bound tasks, limited by GIL for CPU-bound operations
- **Multiprocessing**: Best for CPU-bound tasks, bypasses GIL, higher overhead
- **Synchronization**: Use locks, semaphores, events, and conditions to coordinate concurrent operations
- **IPC**: Use queues, pipes, and managers for inter-process communication
- **Thread/Process Pools**: Efficient task execution with `ThreadPoolExecutor` and `ProcessPoolExecutor`

Choose the right concurrency model based on your task characteristics, use appropriate synchronization primitives, and follow best practices for robust and efficient concurrent applications.
