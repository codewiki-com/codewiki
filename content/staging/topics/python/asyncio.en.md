---
title: Python Async Programming with asyncio
description: "Master Python asyncio: async/await, event loop, coroutines and concurrent execution"
track: python
section: concurrency
difficulty: advanced
tags:
  - Python
  - asyncio
  - Async Programming
  - Coroutines
status: imported
origin: old/src/content/docs/python/asyncio.en.md
divergence: 0.135
issues: []
legacy:
  category: Python
  subcategory: Concurrent Programming
  order: 10
  lastUpdated: 2026-01-07
---

Python's `asyncio` library provides a powerful framework for writing concurrent code using the async/await syntax. It enables you to write single-threaded concurrent programs that can handle thousands of connections efficiently, making it ideal for I/O-bound operations like network requests, file operations, and database queries.

## Introduction to Asynchronous Programming

Asynchronous programming allows a program to handle multiple operations concurrently without using multiple threads or processes. Instead of waiting for an operation to complete before moving to the next one, async code can switch between tasks during waiting periods (like network I/O), maximizing CPU utilization.

### Key Concepts

- **Coroutine**: A function that can pause and resume execution
- **Event Loop**: The core of asyncio that manages and executes coroutines
- **Task**: A wrapper around a coroutine that schedules it for execution
- **Future**: A low-level object representing an eventual result

### When to Use Asyncio

Asyncio is ideal for:
- Network servers and clients (HTTP, WebSocket, TCP/UDP)
- Database operations with async drivers
- File I/O operations
- Concurrent API calls
- Real-time data processing

Asyncio is NOT ideal for:
- CPU-bound operations (use multiprocessing instead)
- Simple scripts with few I/O operations
- Legacy codebases without async support

## Asyncio Basics

### Installing and Importing

Asyncio is part of Python's standard library (Python 3.4+). The modern async/await syntax was introduced in Python 3.5.

```python
import asyncio
```

### Your First Async Program

```python
import asyncio

async def hello():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

# Python 3.7+
asyncio.run(hello())
```

Output:
```
Hello
World
```

The `asyncio.sleep()` function simulates an I/O operation by pausing execution without blocking the entire program.

## Async/Await Syntax

### Defining Coroutines

Use the `async def` keyword to define a coroutine function:

```python
async def fetch_data():
    # This is a coroutine
    await asyncio.sleep(1)
    return {"data": "example"}
```

### Calling Coroutines

You must use `await` to call a coroutine from within another coroutine:

```python
async def main():
    result = await fetch_data()  # Wait for completion
    print(result)

asyncio.run(main())
```

### Common Mistakes

```python
# WRONG: Forgetting await
async def wrong():
    result = fetch_data()  # Returns coroutine object, doesn't execute
    print(result)  # Prints: <coroutine object fetch_data at 0x...>

# CORRECT: Using await
async def correct():
    result = await fetch_data()  # Actually executes and waits
    print(result)  # Prints: {'data': 'example'}
```

### Async Comprehensions

Python 3.6+ supports async comprehensions:

```python
async def fetch_user(user_id):
    await asyncio.sleep(0.1)
    return {"id": user_id, "name": f"User{user_id}"}

async def main():
    # Async list comprehension
    users = [await fetch_user(i) for i in range(5)]

    # Async generator expression
    async def user_generator():
        for i in range(5):
            yield await fetch_user(i)

    users_list = [user async for user in user_generator()]
    print(users_list)

asyncio.run(main())
```

## The Event Loop

The event loop is the core of asyncio. It runs coroutines, handles callbacks, and manages I/O operations.

### Running the Event Loop

```python
# Modern approach (Python 3.7+)
asyncio.run(main())

# Legacy approach (Python 3.4-3.6)
loop = asyncio.get_event_loop()
try:
    loop.run_until_complete(main())
finally:
    loop.close()
```

### Getting the Current Loop

```python
async def get_loop_info():
    loop = asyncio.get_running_loop()
    print(f"Loop: {loop}")
    print(f"Running: {loop.is_running()}")

asyncio.run(get_loop_info())
```

### Scheduling Callbacks

```python
import time

def callback(name, loop):
    print(f"{name} called at {time.time()}")
    loop.stop()

async def main():
    loop = asyncio.get_running_loop()

    # Schedule callback after 2 seconds
    loop.call_later(2, callback, "Delayed", loop)

    # Schedule callback at specific time
    loop.call_at(loop.time() + 1, callback, "At time", loop)

    await asyncio.sleep(3)

asyncio.run(main())
```

### Running Blocking Code

Use `run_in_executor()` to run blocking operations without blocking the event loop:

```python
import time

def blocking_operation(n):
    print(f"Starting blocking operation {n}")
    time.sleep(2)  # Blocking!
    return f"Result {n}"

async def main():
    loop = asyncio.get_running_loop()

    # Run blocking function in thread pool
    result = await loop.run_in_executor(None, blocking_operation, 1)
    print(result)

asyncio.run(main())
```

## Coroutines and Tasks

### Creating Tasks

Tasks allow coroutines to run concurrently:

```python
async def task_example(name, delay):
    print(f"Task {name} starting")
    await asyncio.sleep(delay)
    print(f"Task {name} completed")
    return f"Result from {name}"

async def main():
    # Create tasks
    task1 = asyncio.create_task(task_example("A", 2))
    task2 = asyncio.create_task(task_example("B", 1))

    # Wait for completion
    result1 = await task1
    result2 = await task2

    print(f"Results: {result1}, {result2}")

asyncio.run(main())
```

Output:
```
Task A starting
Task B starting
Task B completed
Task A completed
Results: Result from A, Result from B
```

### Task Management

```python
async def main():
    task = asyncio.create_task(task_example("C", 5))

    # Check task status
    print(f"Done: {task.done()}")

    # Cancel task
    await asyncio.sleep(1)
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print("Task was cancelled")

    # Get all running tasks
    all_tasks = asyncio.all_tasks()
    print(f"Running tasks: {len(all_tasks)}")

asyncio.run(main())
```

### Task Names and Context

```python
async def named_task(value):
    task = asyncio.current_task()
    print(f"Task name: {task.get_name()}")
    await asyncio.sleep(1)
    return value * 2

async def main():
    task = asyncio.create_task(named_task(5), name="multiplier")
    result = await task
    print(f"Result: {result}")

asyncio.run(main())
```

## Async Context Managers

Async context managers use `async with` for proper resource management:

```python
class AsyncResource:
    async def __aenter__(self):
        print("Acquiring resource")
        await asyncio.sleep(0.5)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Releasing resource")
        await asyncio.sleep(0.5)

    async def do_work(self):
        print("Working with resource")
        await asyncio.sleep(1)

async def main():
    async with AsyncResource() as resource:
        await resource.do_work()
    print("Resource cleaned up")

asyncio.run(main())
```

### Using asynccontextmanager

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def database_connection():
    print("Connecting to database")
    await asyncio.sleep(0.5)
    connection = {"status": "connected"}

    try:
        yield connection
    finally:
        print("Closing database connection")
        await asyncio.sleep(0.5)

async def main():
    async with database_connection() as conn:
        print(f"Using connection: {conn}")
        await asyncio.sleep(1)

asyncio.run(main())
```

### Async Locks and Semaphores

```python
async def critical_section(lock, name):
    print(f"{name} waiting for lock")
    async with lock:
        print(f"{name} acquired lock")
        await asyncio.sleep(1)
        print(f"{name} releasing lock")

async def main():
    lock = asyncio.Lock()

    # Only one task can acquire lock at a time
    await asyncio.gather(
        critical_section(lock, "Task 1"),
        critical_section(lock, "Task 2"),
        critical_section(lock, "Task 3")
    )

asyncio.run(main())
```

### Semaphores

```python
async def limited_resource(semaphore, name):
    async with semaphore:
        print(f"{name} accessing resource")
        await asyncio.sleep(2)
        print(f"{name} done")

async def main():
    # Allow max 2 concurrent accesses
    semaphore = asyncio.Semaphore(2)

    await asyncio.gather(
        limited_resource(semaphore, "Task 1"),
        limited_resource(semaphore, "Task 2"),
        limited_resource(semaphore, "Task 3"),
        limited_resource(semaphore, "Task 4")
    )

asyncio.run(main())
```

## Concurrent Execution Patterns

### asyncio.gather()

Execute multiple coroutines concurrently and collect results:

```python
async def fetch_data(source, delay):
    print(f"Fetching from {source}")
    await asyncio.sleep(delay)
    return f"Data from {source}"

async def main():
    # Run all concurrently, wait for all to complete
    results = await asyncio.gather(
        fetch_data("API-1", 2),
        fetch_data("API-2", 1),
        fetch_data("API-3", 3)
    )

    print(f"All results: {results}")

asyncio.run(main())
```

Output:
```
Fetching from API-1
Fetching from API-2
Fetching from API-3
All results: ['Data from API-1', 'Data from API-2', 'Data from API-3']
```

### gather() with Error Handling

```python
async def may_fail(value):
    await asyncio.sleep(1)
    if value == 2:
        raise ValueError(f"Failed with value {value}")
    return value

async def main():
    # return_exceptions=False (default): First exception is raised
    try:
        results = await asyncio.gather(
            may_fail(1),
            may_fail(2),
            may_fail(3)
        )
    except ValueError as e:
        print(f"Error: {e}")

    # return_exceptions=True: Exceptions are returned as results
    results = await asyncio.gather(
        may_fail(1),
        may_fail(2),
        may_fail(3),
        return_exceptions=True
    )

    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"Task {i} failed: {result}")
        else:
            print(f"Task {i} result: {result}")

asyncio.run(main())
```

### asyncio.wait()

More flexible than gather(), returns two sets: done and pending:

```python
async def task_with_timeout(name, delay):
    await asyncio.sleep(delay)
    return f"{name} completed"

async def main():
    tasks = [
        asyncio.create_task(task_with_timeout("Fast", 1)),
        asyncio.create_task(task_with_timeout("Medium", 2)),
        asyncio.create_task(task_with_timeout("Slow", 3))
    ]

    # Wait for first completion
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_COMPLETED
    )

    print(f"Completed: {len(done)}, Pending: {len(pending)}")

    for task in done:
        print(f"Result: {task.result()}")

    # Cancel pending tasks
    for task in pending:
        task.cancel()

asyncio.run(main())
```

### asyncio.wait() Options

```python
async def main():
    tasks = [
        asyncio.create_task(task_with_timeout(f"Task-{i}", i))
        for i in range(1, 4)
    ]

    # FIRST_COMPLETED: Return when first task completes
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_COMPLETED
    )

    # FIRST_EXCEPTION: Return when first task raises exception
    # ALL_COMPLETED: Return when all tasks complete (default)

    # With timeout
    try:
        done, pending = await asyncio.wait(
            tasks,
            timeout=2.0
        )
        print(f"After 2s: {len(done)} done, {len(pending)} pending")
    except asyncio.TimeoutError:
        print("Wait timed out")

asyncio.run(main())
```

### asyncio.as_completed()

Process results as they complete:

```python
async def fetch_with_delay(name, delay):
    await asyncio.sleep(delay)
    return f"{name} (delay: {delay}s)"

async def main():
    coroutines = [
        fetch_with_delay("First", 3),
        fetch_with_delay("Second", 1),
        fetch_with_delay("Third", 2)
    ]

    # Process results in completion order
    for coro in asyncio.as_completed(coroutines):
        result = await coro
        print(f"Got result: {result}")

asyncio.run(main())
```

Output:
```
Got result: Second (delay: 1s)
Got result: Third (delay: 2s)
Got result: First (delay: 3s)
```

### asyncio.wait_for()

Add timeout to a coroutine:

```python
async def slow_operation():
    await asyncio.sleep(5)
    return "Done"

async def main():
    try:
        result = await asyncio.wait_for(slow_operation(), timeout=2.0)
        print(result)
    except asyncio.TimeoutError:
        print("Operation timed out!")

asyncio.run(main())
```

### asyncio.shield()

Protect a task from cancellation:

```python
async def critical_operation():
    print("Starting critical operation")
    await asyncio.sleep(3)
    print("Critical operation completed")
    return "Important result"

async def main():
    task = asyncio.create_task(critical_operation())
    shielded = asyncio.shield(task)

    try:
        result = await asyncio.wait_for(shielded, timeout=1.0)
    except asyncio.TimeoutError:
        print("Timed out, but task continues running")
        result = await task  # Wait for task to finish
        print(f"Result: {result}")

asyncio.run(main())
```

## Error Handling

### Handling Exceptions in Tasks

```python
async def risky_operation(value):
    await asyncio.sleep(1)
    if value < 0:
        raise ValueError("Negative value not allowed")
    return value * 2

async def main():
    task = asyncio.create_task(risky_operation(-5))

    try:
        result = await task
    except ValueError as e:
        print(f"Caught error: {e}")

    # Check if task has exception
    task2 = asyncio.create_task(risky_operation(-3))
    await asyncio.sleep(2)

    if task2.done() and not task2.cancelled():
        try:
            result = task2.result()
        except ValueError as e:
            print(f"Task failed: {e}")

asyncio.run(main())
```

### Exception Groups (Python 3.11+)

```python
async def worker(n):
    await asyncio.sleep(1)
    if n % 2 == 0:
        raise ValueError(f"Even number: {n}")
    return n

async def main():
    try:
        results = await asyncio.gather(
            worker(1),
            worker(2),
            worker(3),
            worker(4),
            return_exceptions=True
        )

        exceptions = [r for r in results if isinstance(r, Exception)]
        successes = [r for r in results if not isinstance(r, Exception)]

        print(f"Successes: {successes}")
        print(f"Exceptions: {len(exceptions)}")

    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
```

### Cleanup with try/finally

```python
async def main():
    resource = None
    try:
        print("Allocating resource")
        resource = {"status": "allocated"}

        # Do work
        await asyncio.sleep(1)

        # Simulate error
        raise RuntimeError("Something went wrong")

    except RuntimeError as e:
        print(f"Error occurred: {e}")
    finally:
        if resource:
            print("Cleaning up resource")
            resource = None

asyncio.run(main())
```

## Best Practices

### Avoid Blocking Calls

```python
# BAD: Blocking call in async function
async def bad_example():
    import time
    time.sleep(5)  # Blocks entire event loop!
    return "done"

# GOOD: Use async alternatives or run_in_executor
import aiohttp
import aiofiles

async def good_example():
    # Use async library
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.example.com') as resp:
            data = await resp.json()

    # Or use run_in_executor for blocking code
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, blocking_function)

    return data

def blocking_function():
    import time
    time.sleep(5)
    return "done"
```

### Proper Error Handling

```python
async def robust_task(url):
    try:
        async with aiohttp.ClientSession() as session:
            async with asyncio.timeout(10):  # Python 3.11+
                async with session.get(url) as resp:
                    return await resp.text()
    except asyncio.TimeoutError:
        print(f"Timeout fetching {url}")
        return None
    except aiohttp.ClientError as e:
        print(f"Client error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None
```

### Use Connection Pooling

```python
# GOOD: Reuse session
async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks)

async def fetch_one(session, url):
    async with session.get(url) as resp:
        return await resp.text()

# BAD: Create new session for each request
async def fetch_all_bad(urls):
    tasks = [fetch_with_new_session(url) for url in urls]
    return await asyncio.gather(*tasks)

async def fetch_with_new_session(url):
    async with aiohttp.ClientSession() as session:  # Inefficient!
        async with session.get(url) as resp:
            return await resp.text()
```

### Limit Concurrency

```python
async def process_with_limit(items, max_concurrent=10):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_item(item):
        async with semaphore:
            return await process(item)

    return await asyncio.gather(*[process_item(item) for item in items])

async def process(item):
    await asyncio.sleep(1)
    return f"Processed {item}"
```

### Graceful Shutdown

```python
async def worker(queue, stop_event):
    while not stop_event.is_set():
        try:
            item = await asyncio.wait_for(queue.get(), timeout=1.0)
            await process(item)
        except asyncio.TimeoutError:
            continue

async def main():
    queue = asyncio.Queue()
    stop_event = asyncio.Event()

    # Start workers
    workers = [
        asyncio.create_task(worker(queue, stop_event))
        for _ in range(5)
    ]

    # Add work
    for i in range(20):
        await queue.put(i)

    # Wait for queue to be empty
    await queue.join()

    # Signal shutdown
    stop_event.set()

    # Wait for workers to finish
    await asyncio.gather(*workers)

asyncio.run(main())
```

### Testing Async Code

```python
import pytest

# Using pytest-asyncio
@pytest.mark.asyncio
async def test_async_function():
    result = await my_async_function()
    assert result == expected_value

# Using unittest
import unittest

class TestAsync(unittest.TestCase):
    def test_async_function(self):
        result = asyncio.run(my_async_function())
        self.assertEqual(result, expected_value)
```

## Real-World Example: Concurrent API Fetcher

```python
import asyncio
import aiohttp
import time
from typing import List, Dict

async def fetch_user(session: aiohttp.ClientSession, user_id: int) -> Dict:
    """Fetch user data from API."""
    url = f"https://jsonplaceholder.typicode.com/users/{user_id}"

    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            response.raise_for_status()
            return await response.json()
    except asyncio.TimeoutError:
        print(f"Timeout fetching user {user_id}")
        return {"id": user_id, "error": "timeout"}
    except aiohttp.ClientError as e:
        print(f"Error fetching user {user_id}: {e}")
        return {"id": user_id, "error": str(e)}

async def fetch_posts(session: aiohttp.ClientSession, user_id: int) -> List[Dict]:
    """Fetch posts for a user."""
    url = f"https://jsonplaceholder.typicode.com/posts?userId={user_id}"

    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            response.raise_for_status()
            return await response.json()
    except Exception as e:
        print(f"Error fetching posts for user {user_id}: {e}")
        return []

async def fetch_user_with_posts(session: aiohttp.ClientSession, user_id: int) -> Dict:
    """Fetch user and their posts concurrently."""
    user, posts = await asyncio.gather(
        fetch_user(session, user_id),
        fetch_posts(session, user_id)
    )

    return {
        "user": user,
        "posts": posts,
        "post_count": len(posts)
    }

async def main():
    """Main function demonstrating concurrent API fetching."""
    start_time = time.time()

    # Create session with connection pooling
    connector = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Fetch data for multiple users concurrently
        user_ids = range(1, 11)

        # Using gather
        results = await asyncio.gather(
            *[fetch_user_with_posts(session, uid) for uid in user_ids]
        )

        # Process results
        for result in results:
            user = result["user"]
            print(f"User {user.get('name', 'Unknown')}: {result['post_count']} posts")

    elapsed = time.time() - start_time
    print(f"\nFetched data for {len(user_ids)} users in {elapsed:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(main())
```

## Conclusion

Python's asyncio provides a powerful framework for writing efficient concurrent code. Key takeaways:

1. Use `async def` to define coroutines and `await` to call them
2. The event loop manages coroutine execution
3. Tasks allow coroutines to run concurrently
4. Use `gather()`, `wait()`, and `as_completed()` for concurrent execution patterns
5. Async context managers ensure proper resource cleanup
6. Always use async libraries (aiohttp, aiofiles, etc.) instead of blocking calls
7. Implement proper error handling and graceful shutdown
8. Limit concurrency with semaphores to avoid overwhelming resources

Asyncio shines in I/O-bound scenarios where you need to handle many concurrent operations efficiently. Master these concepts, and you'll be able to build high-performance Python applications that can handle thousands of concurrent connections with ease.

## Further Reading

- [Official asyncio documentation](https://docs.python.org/3/library/asyncio.html)
- [aiohttp documentation](https://docs.aiohttp.org/)
- [Real Python asyncio tutorial](https://realpython.com/async-io-python/)
- [PEP 492 - Coroutines with async and await syntax](https://peps.python.org/pep-0492/)
