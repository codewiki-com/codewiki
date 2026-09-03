---
title: "Python contextlib: Context Manager Utilities Guide"
description: "Master Python's contextlib module: context managers, @contextmanager decorator, ExitStack, and advanced patterns for resource management"
track: python
section: stdlib
difficulty: advanced
tags:
  - contextlib
  - context-managers
  - resource-management
  - with-statement
  - decorators
status: imported
origin: old/src/content/docs/python/contextlib.en.md
divergence: 0.288
issues:
  - missing-subcategory-en
legacy:
  category: Python
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

Context managers are one of Python's most elegant features, enabling reliable resource management through the `with` statement. The `contextlib` module provides decorators and utilities that make creating context managers straightforward and powerful. This comprehensive guide explores contextlib's capabilities, from basic decorators to advanced patterns for managing complex resource scenarios.

## Concept Explanation

### What is a Context Manager?

A context manager is an object that defines what happens when you enter and exit a `with` statement block. The protocol consists of two magic methods:

- `__enter__()`: Called when entering the with block, returns the resource to manage
- `__exit__()`: Called when leaving the with block, handles cleanup

```python
# Without context manager (error-prone)
file = open('data.txt')
try:
    content = file.read()
    # Process content
finally:
    file.close()  # Must remember to close!

# With context manager (safe and clean)
with open('data.txt') as file:
    content = file.read()
    # Process content
# File automatically closed here
```

### Why contextlib?

The `contextlib` module simplifies context manager creation by:

1. **Reducing boilerplate**: The `@contextmanager` decorator converts a generator into a context manager
2. **Enabling composition**: `ExitStack` allows combining multiple context managers dynamically
3. **Providing utilities**: Helper functions for common patterns like `closing()` and `suppress()`
4. **Improving readability**: Cleanup logic stays next to resource acquisition

```python
# Without contextlib (verbose)
class DatabaseConnection:
    def __init__(self, connection_string):
        self.conn_string = connection_string
        self.conn = None

    def __enter__(self):
        self.conn = connect(self.conn_string)
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            self.conn.close()
        return False

# With contextlib (concise)
from contextlib import contextmanager

@contextmanager
def database_connection(connection_string):
    conn = connect(connection_string)
    try:
        yield conn
    finally:
        conn.close()
```

## Core Principles

### The Context Manager Protocol

Every context manager implements:

```python
class ContextManager:
    """Demonstrates the context manager protocol."""

    def __enter__(self):
        """
        Called when entering the with block.
        Returns the resource to be managed.
        """
        print("Acquiring resource")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Called when exiting the with block.

        Args:
            exc_type: Exception type (None if no exception)
            exc_val: Exception value (None if no exception)
            exc_tb: Exception traceback (None if no exception)

        Returns:
            True to suppress exception, False to propagate it
        """
        print("Releasing resource")

        if exc_type is not None:
            print(f"Exception occurred: {exc_type.__name__}: {exc_val}")

        return False  # Don't suppress exceptions

# Usage
with ContextManager() as resource:
    print("Using resource")
```

### The @contextmanager Decorator

The decorator transforms a generator function into a context manager:

```python
from contextlib import contextmanager

@contextmanager
def managed_resource(name):
    """
    A simple context manager created with @contextmanager.
    """
    print(f"Acquiring {name}")
    resource = {"name": name, "active": True}

    try:
        yield resource  # Everything after yield is __exit__ code
    except Exception as e:
        print(f"Exception in {name}: {e}")
        raise  # Re-raise exceptions
    finally:
        print(f"Releasing {name}")
        resource["active"] = False

# Usage
with managed_resource("Database") as db:
    print(f"Using {db['name']}")
    db["data"] = "some data"
```

### Exception Handling in Context Managers

Context managers can suppress, modify, or propagate exceptions:

```python
from contextlib import contextmanager

@contextmanager
def exception_handler(exception_type, action="log"):
    """Context manager that handles specific exceptions."""
    try:
        yield
    except exception_type as e:
        if action == "log":
            print(f"Caught {exception_type.__name__}: {e}")
        elif action == "suppress":
            print(f"Suppressed {exception_type.__name__}")
            return True  # Suppress the exception
        elif action == "reraise":
            print(f"Re-raising {exception_type.__name__}")
            raise

# Log and continue
with exception_handler(ValueError, action="log"):
    int("invalid")  # Prints error but continues

# Suppress silently
with exception_handler(ZeroDivisionError, action="suppress"):
    result = 1 / 0  # Exception is suppressed
    print("This line executes")

# Re-raise for caller to handle
try:
    with exception_handler(RuntimeError, action="reraise"):
        raise RuntimeError("Critical error")
except RuntimeError:
    print("Caller caught the error")
```

## Key Points

### contextlib.contextmanager

The decorator converts a generator function into a context manager factory:

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    """Context manager that measures elapsed time."""
    print(f"[{label}] Starting timer")
    start_time = time.time()

    try:
        yield start_time
    finally:
        elapsed = time.time() - start_time
        print(f"[{label}] Elapsed: {elapsed:.4f} seconds")

# Usage
with timer("computation") as start:
    time.sleep(1.5)
```

### contextlib.closing

Closes an object when exiting the with block:

```python
from contextlib import closing
import socket

@closing
class SimpleResource:
    """A resource that needs closing."""
    def __init__(self):
        self.is_open = True

    def close(self):
        self.is_open = False
        print("Resource closed")

# Usage
with closing(SimpleResource()) as resource:
    print(f"Resource is open: {resource.is_open}")

# closing() is equivalent to:
# with resource:
#     resource.close()
```

### contextlib.suppress

Suppresses specified exceptions:

```python
from contextlib import suppress

# Without suppress (verbose)
try:
    risky_operation()
except FileNotFoundError:
    pass
except PermissionError:
    pass

# With suppress (concise)
with suppress(FileNotFoundError, PermissionError):
    risky_operation()

# Practical example: Ignore missing cleanup
import os

def cleanup_resources():
    with suppress(FileNotFoundError):
        os.remove("temp_file.txt")
    with suppress(OSError):
        os.rmdir("temp_dir")
```

### contextlib.redirect_stdout and redirect_stderr

Redirects output streams:

```python
from contextlib import redirect_stdout, redirect_stderr
import io
import sys

def print_messages():
    print("Message 1")
    print("Message 2")
    print("Message 3")

# Capture stdout
output = io.StringIO()
with redirect_stdout(output):
    print_messages()

print("Captured output:")
print(output.getvalue())

# Redirect stderr to a file
with open("errors.log", "w") as error_log:
    with redirect_stderr(error_log):
        print("This goes to errors.log", file=sys.stderr)
        sys.stderr.write("Direct write to stderr\n")

# Redirect both
with redirect_stdout(io.StringIO()) as stdout_capture:
    with redirect_stderr(io.StringIO()) as stderr_capture:
        print("stdout message")
        print("stderr message", file=sys.stderr)
```

### contextlib.ExitStack

The most powerful contextlib utility: dynamically manages multiple context managers:

```python
from contextlib import ExitStack
import os

def copy_files_safely(source_files, dest_files):
    """
    Open multiple files safely with dynamic context management.
    """
    with ExitStack() as stack:
        # Open all source files for reading
        sources = [stack.enter_context(open(f, 'r'))
                   for f in source_files]

        # Open all destination files for writing
        dests = [stack.enter_context(open(f, 'w'))
                 for f in dest_files]

        # All files will be properly closed on exit
        for source, dest in zip(sources, dests):
            dest.write(source.read())

        # If any operation fails, all files are still closed
        print(f"Copied {len(source_files)} files")

# Usage
source_files = ["input1.txt", "input2.txt"]
dest_files = ["output1.txt", "output2.txt"]

# copy_files_safely(source_files, dest_files)
```

### contextlib.AbstractContextManager

Base class for creating context managers:

```python
from contextlib import AbstractContextManager

class FileReader(AbstractContextManager):
    """Context manager using abstract base class."""

    def __init__(self, filename):
        self.filename = filename
        self.file = None

    def __enter__(self):
        print(f"Opening {self.filename}")
        self.file = open(self.filename, 'r')
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file:
            print(f"Closing {self.filename}")
            self.file.close()
        if exc_type is not None:
            print(f"Error occurred: {exc_type.__name__}")
        return False

# Usage
try:
    with FileReader("data.txt") as file:
        content = file.read()
except FileNotFoundError:
    print("File not found")
```

## Code Examples

### Database Connection Manager

```python
from contextlib import contextmanager
import sqlite3

@contextmanager
def database_connection(db_path, timeout=30):
    """
    Safely manage database connections with automatic rollback on errors.
    """
    conn = None
    try:
        conn = sqlite3.connect(db_path, timeout=timeout)
        conn.row_factory = sqlite3.Row
        print(f"Connected to {db_path}")
        yield conn
        conn.commit()
        print("Transaction committed")
    except Exception as e:
        if conn:
            conn.rollback()
            print(f"Transaction rolled back due to: {e}")
        raise
    finally:
        if conn:
            conn.close()
            print("Connection closed")

# Usage
def fetch_user_data(db_path, user_id):
    with database_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return cursor.fetchone()

def insert_user(db_path, name, email):
    with database_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            (name, email)
        )
        # Automatically committed on exit
```

### Temporary Directory Manager

```python
from contextlib import contextmanager
import tempfile
import os
import shutil

@contextmanager
def temporary_directory(prefix="tmp_", cleanup=True):
    """
    Create a temporary directory that is automatically cleaned up.
    """
    temp_dir = tempfile.mkdtemp(prefix=prefix)
    print(f"Created temporary directory: {temp_dir}")

    try:
        yield temp_dir
    finally:
        if cleanup:
            shutil.rmtree(temp_dir)
            print(f"Cleaned up {temp_dir}")
        else:
            print(f"Keeping temporary directory: {temp_dir}")

# Usage
def process_files(files):
    with temporary_directory(prefix="processing_") as temp_dir:
        # Copy files to temp directory
        temp_files = []
        for file in files:
            temp_file = os.path.join(temp_dir, os.path.basename(file))
            shutil.copy2(file, temp_file)
            temp_files.append(temp_file)

        # Process files
        for temp_file in temp_files:
            print(f"Processing {temp_file}")

        # Temp directory automatically removed on exit
```

### Lock Manager

```python
from contextlib import contextmanager
import threading
import time

class SharedResource:
    """A resource protected by a lock."""

    def __init__(self):
        self.lock = threading.Lock()
        self.value = 0

    @contextmanager
    def acquire_lock(self, timeout=None):
        """
        Safely acquire and release a lock.
        """
        acquired = self.lock.acquire(timeout=timeout)
        if not acquired:
            raise TimeoutError("Could not acquire lock")

        print(f"Lock acquired by {threading.current_thread().name}")
        try:
            yield self
        finally:
            self.lock.release()
            print(f"Lock released by {threading.current_thread().name}")

    def increment_safe(self):
        """Safely increment the shared value."""
        with self.acquire_lock():
            self.value += 1
            time.sleep(0.1)  # Simulate work

# Usage
resource = SharedResource()

def worker(resource):
    for _ in range(3):
        resource.increment_safe()

threads = [threading.Thread(target=worker, args=(resource,))
           for _ in range(3)]

for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Final value: {resource.value}")  # Output: 9 (thread-safe)
```

### Configuration Context Manager

```python
from contextlib import contextmanager
import os

class Config:
    """Global configuration."""
    debug = False
    log_level = "INFO"
    timeout = 30

@contextmanager
def config_override(**kwargs):
    """
    Temporarily override configuration settings.
    """
    # Store original values
    original = {}
    for key, value in kwargs.items():
        if hasattr(Config, key):
            original[key] = getattr(Config, key)
            setattr(Config, key, value)
            print(f"Config.{key}: {original[key]} -> {value}")
        else:
            raise AttributeError(f"Config has no attribute {key}")

    try:
        yield Config
    finally:
        # Restore original values
        for key, value in original.items():
            setattr(Config, key, value)
            print(f"Config.{key}: restored to {value}")

# Usage
print(f"Initial: debug={Config.debug}, log_level={Config.log_level}")

with config_override(debug=True, log_level="DEBUG", timeout=60):
    print(f"Inside: debug={Config.debug}, log_level={Config.log_level}")
    # Use debug configuration

print(f"After: debug={Config.debug}, log_level={Config.log_level}")
```

### ExitStack with Multiple Contexts

```python
from contextlib import ExitStack, contextmanager
import time

@contextmanager
def resource(name):
    print(f"Acquiring {name}")
    try:
        yield name
    finally:
        print(f"Releasing {name}")

def complex_operation_with_exit_stack():
    """
    Manage multiple resources dynamically.
    """
    with ExitStack() as stack:
        # Dynamically enter multiple contexts
        resources = [stack.enter_context(resource(f"R{i}"))
                     for i in range(3)]

        print(f"Using resources: {resources}")

        # Register a callback to run on exit
        stack.callback(print, "Exit stack callback executed")

        # All contexts will be exited in LIFO order
        # Callbacks are called after all contexts exit

complex_operation_with_exit_stack()
# Output:
# Acquiring R0
# Acquiring R1
# Acquiring R2
# Using resources: ['R0', 'R1', 'R2']
# Releasing R2
# Releasing R1
# Releasing R0
# Exit stack callback executed
```

### Async Context Manager

```python
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_resource(name, delay=1):
    """
    Asynchronous context manager for async resources.
    """
    print(f"Acquiring async resource: {name}")
    await asyncio.sleep(delay)

    try:
        yield {"name": name, "data": []}
    finally:
        print(f"Releasing async resource: {name}")
        await asyncio.sleep(0.5)

async def async_operation():
    """Use async context manager."""
    async with async_resource("database") as db:
        print(f"Using {db['name']}")
        db["data"].append("item1")
        await asyncio.sleep(1)
        db["data"].append("item2")

    print("Async context exited")

# Run async operation
# asyncio.run(async_operation())
```

## Best Practices

### Always Ensure Cleanup

```python
from contextlib import contextmanager

# GOOD: Cleanup happens regardless of exceptions
@contextmanager
def safe_resource():
    resource = acquire()
    try:
        yield resource
    finally:
        # This always runs, even if yield raises
        release(resource)

# BAD: Cleanup only runs on success
@contextmanager
def unsafe_resource():
    resource = acquire()
    yield resource
    release(resource)  # Won't run if exception occurs

# Verify cleanup happens
@contextmanager
def cleanup_verification():
    print("Setup")
    try:
        yield None
    finally:
        print("Cleanup always runs")

# Test with exception
try:
    with cleanup_verification():
        raise ValueError("Oops")
except ValueError:
    pass
# Output shows "Cleanup always runs"
```

### Use ExitStack for Variable Context Count

```python
from contextlib import ExitStack

# BAD: Hard to add dynamic contexts
with open("file1") as f1:
    with open("file2") as f2:
        with open("file3") as f3:
            process(f1, f2, f3)

# GOOD: ExitStack handles dynamic contexts
def process_files(filenames):
    with ExitStack() as stack:
        files = [stack.enter_context(open(fn))
                 for fn in filenames]
        process(*files)
```

### Document Context Behavior

```python
from contextlib import contextmanager

@contextmanager
def well_documented_context(param):
    """
    A context manager with comprehensive documentation.

    This context manager acquires a resource and ensures cleanup
    even if an exception occurs.

    Args:
        param: The parameter to configure the resource

    Yields:
        The configured resource object

    Raises:
        ValueError: If param is invalid
        RuntimeError: If resource acquisition fails

    Examples:
        >>> with well_documented_context("valid") as resource:
        ...     resource.do_something()
        # Cleanup is automatic

    Note:
        The context manager suppresses no exceptions by default.
        All exceptions from the with block propagate to the caller.
    """
    if not param:
        raise ValueError("param cannot be empty")

    try:
        resource = create_resource(param)
        yield resource
    finally:
        cleanup_resource(resource)
```

### Avoid Swallowing Important Exceptions

```python
from contextlib import contextmanager

# BAD: Silent exception suppression
@contextmanager
def silent_context():
    try:
        yield
    except:
        pass  # Silently ignores ALL exceptions

# GOOD: Selective exception handling
@contextmanager
def selective_context(suppress_types=()):
    try:
        yield
    except suppress_types:
        pass  # Only suppress specified exceptions
    except Exception:
        # Log or handle unexpected exceptions
        import logging
        logging.exception("Unexpected error in context")
        raise
```

### Use Type Hints for Clarity

```python
from contextlib import contextmanager
from typing import Generator, Any

@contextmanager
def typed_context() -> Generator[str, None, None]:
    """
    Context manager with proper type hints.

    Yields:
        A string resource
    """
    resource = "string_resource"
    try:
        yield resource
    finally:
        print(f"Cleaning up {resource}")

# Usage benefits from IDE type checking
with typed_context() as resource:
    # IDE knows resource is str
    print(resource.upper())
```

## Common Pitfalls

### Forgetting Try-Finally

```python
from contextlib import contextmanager

# WRONG: No cleanup if exception occurs
@contextmanager
def bad_context():
    resource = acquire()
    yield resource
    release(resource)  # Won't execute if exception in yield

# RIGHT: Guarantees cleanup
@contextmanager
def good_context():
    resource = acquire()
    try:
        yield resource
    finally:
        release(resource)  # Always executes
```

### Not Handling Generator Close

```python
from contextlib import contextmanager

# WRONG: Doesn't handle GeneratorExit
@contextmanager
def incomplete_context():
    resource = acquire()
    try:
        yield resource
    finally:
        release(resource)
    # What if someone calls .close() on the generator?

# RIGHT: Complete exception handling
@contextmanager
def complete_context():
    resource = acquire()
    try:
        yield resource
    except GeneratorExit:
        # Handle generator being closed
        release(resource)
        raise
    finally:
        # This still runs for GeneratorExit
        pass
```

### Modifying Mutable Default Arguments

```python
from contextlib import contextmanager

# WRONG: Mutable default shared between calls
@contextmanager
def bad_context(items=[]):  # Shared list!
    items.append("new_item")
    try:
        yield items
    finally:
        items.clear()

# First call modifies shared list
with bad_context() as items:
    print(items)  # ['new_item']

# Second call starts with modified list
with bad_context() as items:
    print(items)  # ['new_item'] from previous call!

# RIGHT: Create new instance each time
@contextmanager
def good_context(items=None):
    if items is None:
        items = []  # New list each time
    items.append("new_item")
    try:
        yield items
    finally:
        items.clear()
```

### Swallowing Exceptions Without Reason

```python
from contextlib import contextmanager

# WRONG: Suppresses exceptions silently
@contextmanager
def suppress_all():
    try:
        yield
    except Exception:
        pass  # Dangerous!

# RIGHT: Document exception handling
@contextmanager
def selective_suppress(expected_errors=()):
    try:
        yield
    except expected_errors as e:
        # Log expected error
        print(f"Expected error handled: {e}")
    except Exception:
        # Unexpected errors propagate
        raise
```

### Assuming Entry Success in Exit

```python
from contextlib import contextmanager

# WRONG: Assumes resource acquired successfully
@contextmanager
def risky_context():
    resource = None
    resource = acquire()  # What if this raises?
    try:
        yield resource
    finally:
        resource.close()  # AttributeError if acquire() failed

# RIGHT: Handle partial initialization
@contextmanager
def safe_context():
    resource = None
    try:
        resource = acquire()
        yield resource
    finally:
        if resource is not None:
            resource.close()
```

## Performance Considerations

### Context Manager Overhead

```python
import time
from contextlib import contextmanager

# Measure context manager overhead
@contextmanager
def minimal_context():
    try:
        yield
    finally:
        pass

def benchmark_context_overhead(iterations=100000):
    # Direct execution
    start = time.perf_counter()
    for _ in range(iterations):
        x = 1
    direct_time = time.perf_counter() - start

    # With context manager
    start = time.perf_counter()
    for _ in range(iterations):
        with minimal_context():
            x = 1
    context_time = time.perf_counter() - start

    print(f"Direct: {direct_time*1000:.3f}ms")
    print(f"Context: {context_time*1000:.3f}ms")
    print(f"Overhead: {(context_time-direct_time)*1000:.3f}ms")
    print(f"Ratio: {context_time/direct_time:.2f}x")

# benchmark_context_overhead()
```

### ExitStack vs Multiple With Statements

```python
from contextlib import ExitStack
import io
import time

def test_exit_stack_performance(num_contexts=100):
    """Compare ExitStack vs nested with statements."""

    # Using ExitStack
    start = time.perf_counter()
    with ExitStack() as stack:
        for _ in range(num_contexts):
            stack.enter_context(io.StringIO())
    exit_stack_time = time.perf_counter() - start

    print(f"ExitStack ({num_contexts} contexts): {exit_stack_time*1000:.3f}ms")

# test_exit_stack_performance()
```

### Generator vs Class-Based Context Managers

```python
from contextlib import contextmanager
import time

# Class-based context manager
class ClassBasedContext:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

# Decorator-based context manager
@contextmanager
def decorator_based_context():
    try:
        yield None
    finally:
        pass

def benchmark_context_types(iterations=100000):
    """Class-based vs decorator-based context managers."""

    # Class-based
    start = time.perf_counter()
    for _ in range(iterations):
        with ClassBasedContext():
            pass
    class_time = time.perf_counter() - start

    # Decorator-based
    start = time.perf_counter()
    for _ in range(iterations):
        with decorator_based_context():
            pass
    decorator_time = time.perf_counter() - start

    print(f"Class-based: {class_time*1000:.3f}ms")
    print(f"Decorator-based: {decorator_time*1000:.3f}ms")
    print(f"Difference: {abs(decorator_time-class_time)*1000:.3f}ms")

# benchmark_context_types()
```

## Real-world Scenarios

### API Request Session Manager

```python
from contextlib import contextmanager
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

@contextmanager
def api_session(base_url, retries=3, backoff_factor=0.3):
    """
    Create a requests session with automatic retries.
    """
    session = requests.Session()

    # Configure retry strategy
    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    # Set base URL
    session.base_url = base_url

    print(f"Session created for {base_url}")

    try:
        yield session
    finally:
        session.close()
        print("Session closed")

# Usage
def fetch_user_data(user_id):
    with api_session("https://api.example.com") as session:
        response = session.get(f"/users/{user_id}")
        return response.json()
```

### Logging Context Manager

```python
from contextlib import contextmanager
import logging
import time
from functools import wraps

@contextmanager
def log_context(logger, level=logging.INFO):
    """
    Log entry and exit of a context, with timing.
    """
    import inspect

    # Get caller info
    frame = inspect.currentframe().f_back
    filename = frame.f_code.co_filename
    lineno = frame.f_lineno

    start_time = time.time()
    logger.log(level, f"Entering context at {filename}:{lineno}")

    try:
        yield
    except Exception as e:
        elapsed = time.time() - start_time
        logger.exception(
            f"Exception in context (elapsed: {elapsed:.3f}s): {e}"
        )
        raise
    finally:
        elapsed = time.time() - start_time
        logger.log(level, f"Exiting context (elapsed: {elapsed:.3f}s)")

# Usage
logger = logging.getLogger(__name__)

def complex_operation():
    with log_context(logger):
        # Complex operation
        time.sleep(1)

# complex_operation()
```

### Mock Database Transaction

```python
from contextlib import contextmanager
from datetime import datetime

class MockDatabase:
    """Mock database for testing."""

    def __init__(self):
        self.data = {}
        self.transaction_active = False

    @contextmanager
    def transaction(self):
        """
        Context manager for database transactions.
        """
        self.transaction_active = True
        changes = []

        print(f"[{datetime.now().isoformat()}] Transaction started")

        try:
            yield self
        except Exception as e:
            changes.clear()  # Rollback
            print(f"[{datetime.now().isoformat()}] Transaction rolled back: {e}")
            raise
        finally:
            self.transaction_active = False
            print(
                f"[{datetime.now().isoformat()}] "
                f"Transaction completed ({len(changes)} changes)"
            )

    def insert(self, key, value):
        """Insert data within transaction."""
        if not self.transaction_active:
            raise RuntimeError("Not in a transaction")
        self.data[key] = value

    def query(self, key):
        """Query data."""
        return self.data.get(key)

# Usage
db = MockDatabase()

# Successful transaction
with db.transaction():
    db.insert("user_1", {"name": "Alice", "age": 30})
    db.insert("user_2", {"name": "Bob", "age": 25})

# Failed transaction (automatic rollback)
try:
    with db.transaction():
        db.insert("user_3", {"name": "Charlie"})
        raise ValueError("Invalid data")
except ValueError:
    pass
```

### Resource Pool Manager

```python
from contextlib import contextmanager
import queue
import threading

class ResourcePool:
    """Thread-safe resource pool."""

    def __init__(self, resources, max_wait=5):
        self.pool = queue.Queue(maxsize=len(resources))
        self.max_wait = max_wait
        self.lock = threading.Lock()

        for resource in resources:
            self.pool.put(resource)

    @contextmanager
    def acquire(self):
        """
        Acquire a resource from the pool.
        """
        try:
            # Wait for resource to become available
            resource = self.pool.get(timeout=self.max_wait)
            print(f"Acquired resource: {resource}")

            try:
                yield resource
            finally:
                # Return resource to pool
                self.pool.put(resource)
                print(f"Returned resource: {resource}")
        except queue.Empty:
            raise TimeoutError(f"Could not acquire resource within {self.max_wait}s")

# Usage
def worker(pool, worker_id):
    """Worker thread using pool resources."""
    with pool.acquire() as resource:
        print(f"Worker {worker_id} using {resource}")
        time.sleep(1)

# Create pool with limited resources
resources = [f"Resource_{i}" for i in range(3)]
pool = ResourcePool(resources)

# Multiple workers share resources
threads = []
for i in range(5):
    t = threading.Thread(target=worker, args=(pool, i))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
```

## Interview Points

### What is a Context Manager?

A context manager is a Python object that implements the context manager protocol (`__enter__` and `__exit__` methods). It enables the `with` statement, which provides a clean way to manage resources like files, locks, or database connections.

**Key points:**
- `__enter__()` is called when entering the with block
- `__exit__()` is called when exiting (even on exception)
- Used with `with` statement for automatic resource cleanup
- Cleaner and safer than try-finally blocks

### When Would You Use contextlib.ExitStack?

ExitStack is used when:

1. **Dynamic number of contexts**: Don't know how many resources to manage at compile time
2. **Conditional contexts**: Enter contexts based on runtime conditions
3. **Callback registration**: Register cleanup functions dynamically
4. **Multiple exceptions**: Handle multiple exceptions from different contexts

```python
from contextlib import ExitStack

# Example: Open variable number of files
def process_files(filenames):
    with ExitStack() as stack:
        files = [stack.enter_context(open(fn)) for fn in filenames]
        # All files guaranteed to close properly
```

### Difference Between @contextmanager and Class-Based

**@contextmanager (decorator):**
- More concise for simple cases
- Generator-based implementation
- Uses try-finally for cleanup

**Class-based:**
- More explicit and readable for complex logic
- Full control over initialization
- Better for reusable components

```python
# @contextmanager (concise)
@contextmanager
def my_context():
    resource = acquire()
    try:
        yield resource
    finally:
        release(resource)

# Class-based (explicit)
class MyContext:
    def __enter__(self):
        self.resource = acquire()
        return self.resource

    def __exit__(self, *args):
        release(self.resource)
```

### How Do Context Managers Handle Exceptions?

```python
from contextlib import contextmanager

@contextmanager
def exception_handling():
    try:
        yield
    except ValueError:
        print("Caught ValueError")
        # Return True to suppress, False to propagate
        return False
    finally:
        print("Cleanup")

# __exit__ return value:
# True = suppress exception
# False = propagate exception
```

### Common contextlib Utilities

| Function | Purpose |
|----------|---------|
| `@contextmanager` | Decorator to create context managers from generators |
| `closing()` | Calls .close() on an object when exiting |
| `suppress()` | Suppresses specified exceptions |
| `redirect_stdout()` | Redirects stdout to another stream |
| `redirect_stderr()` | Redirects stderr to another stream |
| `ExitStack` | Dynamically manages multiple contexts |
| `AbstractContextManager` | Base class for context managers |

### What's the Difference Between finally and __exit__?

```python
from contextlib import contextmanager

@contextmanager
def context_with_finally():
    try:
        yield
    finally:
        print("Finally block")

# finally runs regardless of exceptions
# __exit__ also receives exception information

class ContextClass:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("__exit__ block")
        # Can return True to suppress exception
        print(f"Exception type: {exc_type}")
```

## Further Reading

### Official Documentation

- [Python contextlib documentation](https://docs.python.org/3/library/contextlib.html)
- [Python with statement documentation](https://docs.python.org/3/reference/compound_stmts.html#with)
- [PEP 343 - The "with" Statement](https://www.python.org/dev/peps/pep-0343/)

### Related Topics

1. **Resource Management**
   - File handling
   - Database connections
   - Network sockets
   - Lock management

2. **Advanced Patterns**
   - Async context managers
   - Reentrant context managers
   - Chained context managers

3. **Testing**
   - Mocking with context managers
   - pytest fixtures
   - Test cleanup

### Best Practices Summary

1. Always use try-finally in @contextmanager decorators
2. Document what your context manager does and what it yields
3. Use ExitStack for dynamic context management
4. Handle exceptions explicitly rather than silently
5. Use class-based context managers for complex logic
6. Consider using async context managers for I/O-bound operations
7. Test context manager cleanup with both success and exception cases
8. Use type hints to clarify what the context manager yields
9. Keep context managers focused and single-purpose
10. Document the order of cleanup operations

### Key Takeaways

- Context managers implement the context manager protocol (`__enter__` and `__exit__`)
- The `@contextmanager` decorator simplifies context manager creation
- `ExitStack` enables dynamic management of multiple contexts
- Context managers guarantee cleanup via `__exit__`, even on exceptions
- Proper use of context managers makes code cleaner, safer, and more maintainable
- Choose between @contextmanager and class-based based on complexity
- Always ensure cleanup logic in the finally block
- Test exception handling paths to verify cleanup occurs

## Summary

The `contextlib` module is essential for writing clean, maintainable Python code. From the simple `@contextmanager` decorator to the powerful `ExitStack`, these utilities make resource management elegant and reliable. By mastering context managers, you ensure that resources are properly cleaned up, exceptions are handled gracefully, and your code is both pythonic and robust.

Whether managing files, connections, locks, or temporary resources, context managers provide the abstraction layer that separates the concern of "acquiring a resource" from "using it" from "releasing it". This separation of concerns leads to better code organization and fewer bugs.
