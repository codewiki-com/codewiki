---
title: 上下文管理器
description: 深入理解Python上下文管理器，with语句、__enter__/__exit__方法与contextlib模块
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 上下文管理器
  - with语句
  - 资源管理
status: imported
origin: old/src/content/docs/python/context-managers.en.md
divergence: 0.231
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 高级特性
  order: 14
  lastUpdated: 2026-01-07
---

Context managers are an elegant resource management mechanism in Python that ensures proper acquisition and release of resources, even when exceptions occur. This article will dive into the working principles of context managers, implementation methods, and practical application scenarios.

## What is a Context Manager

A context manager is an object that defines the runtime context to be established when executing a `with` statement. Context managers handle the operations of entering and exiting the required runtime context, typically used for:

- File operations (automatically closing files)
- Database connections (automatically committing or rolling back transactions)
- Thread locks (automatically acquiring and releasing locks)
- Temporarily modifying environment variables or configurations

## with Statement Basics

### Basic Syntax

```python
with expression as variable:
    # code block
    pass
```

### File Operation Example

Traditional approach (not recommended):

```python
# Need to manually close the file, easy to forget
f = open('data.txt', 'r')
try:
    content = f.read()
finally:
    f.close()
```

Using a context manager (recommended):

```python
# Automatically handles file closing, even if an exception occurs
with open('data.txt', 'r') as f:
    content = f.read()
# The file is already automatically closed here
```

## Context Manager Protocol

The context manager protocol consists of two special methods:

### `__enter__` Method

- Called before entering the `with` code block
- The return value is assigned to the variable after `as`
- Typically used to acquire resources

### `__exit__` Method

- Called when leaving the `with` code block (whether or not an exception occurred)
- Receives three parameters: exception type, exception value, traceback
- Returning `True` indicates the exception has been handled and won't propagate
- Typically used to release resources

### Custom Context Manager

```python
class FileManager:
    """Custom file manager"""

    def __init__(self, filename, mode='r'):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        """Open file when entering context"""
        print(f"Opening file: {self.filename}")
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Close file when exiting context"""
        print(f"Closing file: {self.filename}")
        if self.file:
            self.file.close()

        # Return False or None, exception will continue to propagate
        # Return True, exception will be suppressed
        return False


# Using the custom context manager
with FileManager('example.txt', 'w') as f:
    f.write('Hello, Context Manager!')
```

### Context Manager with Exception Handling

```python
class DatabaseConnection:
    """Database connection manager with transaction support"""

    def __init__(self, connection_string):
        self.connection_string = connection_string
        self.connection = None

    def __enter__(self):
        print("Establishing database connection...")
        # Simulate establishing connection
        self.connection = {"connected": True, "data": []}
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Exception occurred, rollback transaction
            print(f"Exception occurred: {exc_val}")
            print("Rolling back transaction...")
            self.rollback()
        else:
            # No exception, commit transaction
            print("Committing transaction...")
            self.commit()

        print("Closing database connection...")
        self.connection = None

        # Don't suppress the exception
        return False

    def execute(self, query):
        print(f"Executing query: {query}")
        self.connection["data"].append(query)

    def commit(self):
        print("Transaction committed")

    def rollback(self):
        print("Transaction rolled back")


# Normal execution
with DatabaseConnection("mysql://localhost/db") as db:
    db.execute("INSERT INTO users VALUES (1, 'Alice')")
    db.execute("INSERT INTO users VALUES (2, 'Bob')")

print("\n--- Exception case ---\n")

# Automatic rollback when exception occurs
try:
    with DatabaseConnection("mysql://localhost/db") as db:
        db.execute("INSERT INTO users VALUES (3, 'Charlie')")
        raise ValueError("Data validation failed")
except ValueError:
    print("Exception caught externally")
```

## contextlib Module

Python's `contextlib` module provides convenient tools for creating context managers.

### @contextmanager Decorator

Using a generator function to create a context manager is more concise than implementing a class:

```python
from contextlib import contextmanager

@contextmanager
def file_manager(filename, mode='r'):
    """Create file manager using decorator"""
    print(f"Opening file: {filename}")
    f = open(filename, mode)
    try:
        yield f  # Before yield is __enter__, the yielded value is the return value
    finally:
        print(f"Closing file: {filename}")
        f.close()  # After yield is __exit__


with file_manager('test.txt', 'w') as f:
    f.write('Using contextmanager decorator')
```

### Practical Context Manager Examples

#### Timer

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(description="operation"):
    """Measure code block execution time"""
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{description} took: {elapsed:.4f} seconds")


with timer("Data processing"):
    # Simulate time-consuming operation
    time.sleep(0.5)
    result = sum(range(1000000))
```

#### Temporary Directory Change

```python
from contextlib import contextmanager
import os

@contextmanager
def change_directory(path):
    """Temporarily change working directory"""
    original_path = os.getcwd()
    try:
        os.chdir(path)
        print(f"Changed to directory: {path}")
        yield
    finally:
        os.chdir(original_path)
        print(f"Restored to directory: {original_path}")


with change_directory('/tmp'):
    print(f"Current directory: {os.getcwd()}")
```

#### Temporary Attribute Modification

```python
from contextlib import contextmanager

@contextmanager
def temporary_attribute(obj, attr, value):
    """Temporarily modify object attribute"""
    original = getattr(obj, attr, None)
    has_attr = hasattr(obj, attr)
    setattr(obj, attr, value)
    try:
        yield
    finally:
        if has_attr:
            setattr(obj, attr, original)
        else:
            delattr(obj, attr)


class Config:
    debug = False

config = Config()
print(f"Debug mode: {config.debug}")

with temporary_attribute(config, 'debug', True):
    print(f"Debug mode: {config.debug}")

print(f"Debug mode: {config.debug}")
```

### Other Useful contextlib Tools

#### closing - Automatically Call close()

```python
from contextlib import closing
from urllib.request import urlopen

# For objects that don't implement context manager protocol but have a close() method
with closing(urlopen('https://www.python.org')) as page:
    content = page.read()
```

#### suppress - Suppress Specified Exceptions

```python
from contextlib import suppress
import os

# Ignore file not found error
with suppress(FileNotFoundError):
    os.remove('nonexistent_file.txt')
    print("This line won't execute")

print("Program continues running")

# Equivalent to:
try:
    os.remove('nonexistent_file.txt')
except FileNotFoundError:
    pass
```

#### redirect_stdout / redirect_stderr - Redirect Output

```python
from contextlib import redirect_stdout, redirect_stderr
import io

# Capture standard output
f = io.StringIO()
with redirect_stdout(f):
    print("This text will be captured")
    print("Instead of being output to console")

output = f.getvalue()
print(f"Captured content: {repr(output)}")

# Redirect both stdout and stderr simultaneously
stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()

with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
    print("Standard output")
    import sys
    print("Standard error", file=sys.stderr)
```

#### nullcontext - Empty Context Manager

```python
from contextlib import nullcontext

def process_data(data, output_file=None):
    """Process data, optionally output to file"""
    # Write to file if specified, otherwise use nullcontext
    cm = open(output_file, 'w') if output_file else nullcontext()

    with cm as f:
        result = data.upper()
        if f:
            f.write(result)
        return result

# Don't output to file
result1 = process_data("hello")

# Output to file
result2 = process_data("world", "output.txt")
```

## Nested Context Managers

### Multiple Nested with Statements

```python
with open('input.txt', 'r') as infile:
    with open('output.txt', 'w') as outfile:
        content = infile.read()
        outfile.write(content.upper())
```

### Multiple Context Managers on Single Line

```python
# Supported in Python 3.1+
with open('input.txt', 'r') as infile, open('output.txt', 'w') as outfile:
    content = infile.read()
    outfile.write(content.upper())

# Python 3.10+ supports using parentheses for line breaks
with (
    open('input.txt', 'r') as infile,
    open('output.txt', 'w') as outfile,
    open('log.txt', 'a') as logfile
):
    content = infile.read()
    outfile.write(content.upper())
    logfile.write("Processing complete\n")
```

### ExitStack - Dynamically Manage Multiple Contexts

```python
from contextlib import ExitStack

# Dynamically manage multiple files
files_to_process = ['file1.txt', 'file2.txt', 'file3.txt']

with ExitStack() as stack:
    files = [
        stack.enter_context(open(fname, 'w'))
        for fname in files_to_process
    ]

    for i, f in enumerate(files):
        f.write(f"Content {i}")

# All files are automatically closed on exit
```

#### ExitStack Advanced Usage

```python
from contextlib import ExitStack

def process_with_cleanup():
    with ExitStack() as stack:
        # Register cleanup callbacks
        stack.callback(print, "Cleanup operation 1")
        stack.callback(print, "Cleanup operation 2")

        # Dynamically add context managers
        f = stack.enter_context(open('data.txt', 'w'))
        f.write("Test data")

        # Can transfer cleanup responsibility to external code
        # return stack.pop_all()

    # Cleanup executes in LIFO order on exit

process_with_cleanup()
# Output:
# Cleanup operation 2
# Cleanup operation 1
```

## Exception Handling in Detail

### __exit__ Method Parameters

```python
class ExceptionDemo:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Parameter explanation:
        - exc_type: Exception type (e.g., ValueError)
        - exc_val: Exception instance
        - exc_tb: Traceback object

        If no exception, all three parameters are None
        """
        if exc_type is not None:
            print(f"Exception type: {exc_type.__name__}")
            print(f"Exception message: {exc_val}")
            print(f"Traceback: {exc_tb}")
        return False  # Don't suppress the exception


try:
    with ExceptionDemo():
        raise ValueError("Test exception")
except ValueError:
    print("Exception was re-raised")
```

### Exception Suppression

```python
class SuppressError:
    """Suppress specific types of exceptions"""

    def __init__(self, *exceptions):
        self.exceptions = exceptions

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # If exception type is in allowed list, return True to suppress it
        if exc_type is not None and issubclass(exc_type, self.exceptions):
            print(f"Suppressing exception: {exc_val}")
            return True
        return False


with SuppressError(ZeroDivisionError, ValueError):
    result = 1 / 0  # Exception is suppressed
    print("This line won't execute")

print("Program continues running")
```

### Exception Handling in @contextmanager

```python
from contextlib import contextmanager

@contextmanager
def error_handler():
    """Handle and log exceptions"""
    try:
        yield
    except Exception as e:
        print(f"Caught exception: {type(e).__name__}: {e}")
        # Re-raise or suppress
        raise  # Re-raise
        # If raise is not written, exception will be suppressed


try:
    with error_handler():
        raise RuntimeError("Error occurred")
except RuntimeError:
    print("Exception was re-raised externally")
```

## Practical Application Cases

### Database Transaction Management

```python
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.data = {}
        self.transaction_data = None

    @contextmanager
    def transaction(self):
        """Transaction context manager"""
        # Save current state
        self.transaction_data = self.data.copy()
        try:
            yield self
            # No exception, commit transaction
            print("Transaction committed")
        except Exception:
            # Exception occurred, rollback transaction
            self.data = self.transaction_data
            print("Transaction rolled back")
            raise
        finally:
            self.transaction_data = None

    def insert(self, key, value):
        self.data[key] = value
        print(f"Inserting: {key} = {value}")


db = Database()

# Successful transaction
with db.transaction():
    db.insert("name", "Alice")
    db.insert("age", 30)

print(f"Data: {db.data}")

# Failed transaction
try:
    with db.transaction():
        db.insert("city", "Beijing")
        raise ValueError("Data validation failed")
except ValueError:
    pass

print(f"Data: {db.data}")  # city won't be inserted
```

### Thread Lock Management

```python
import threading
from contextlib import contextmanager

class ThreadSafeCounter:
    def __init__(self):
        self._value = 0
        self._lock = threading.Lock()

    @property
    def value(self):
        return self._value

    @contextmanager
    def locked(self):
        """Context manager for acquiring lock"""
        self._lock.acquire()
        try:
            yield
        finally:
            self._lock.release()

    def increment(self):
        with self.locked():
            self._value += 1

    def decrement(self):
        with self.locked():
            self._value -= 1


counter = ThreadSafeCounter()

def worker():
    for _ in range(1000):
        counter.increment()

threads = [threading.Thread(target=worker) for _ in range(10)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Final value: {counter.value}")  # Should be 10000
```

### Configuration Temporary Override

```python
from contextlib import contextmanager
from typing import Any, Dict

class AppConfig:
    """Application configuration class"""

    def __init__(self):
        self._config = {
            "debug": False,
            "log_level": "INFO",
            "max_connections": 100
        }

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._config[key] = value

    @contextmanager
    def override(self, **kwargs):
        """Temporarily override configuration"""
        original_values = {}

        # Save original values and set new values
        for key, value in kwargs.items():
            if key in self._config:
                original_values[key] = self._config[key]
            self._config[key] = value

        try:
            yield self
        finally:
            # Restore original values
            for key, value in original_values.items():
                self._config[key] = value
            # Delete newly added keys
            for key in kwargs:
                if key not in original_values:
                    del self._config[key]


config = AppConfig()

print(f"Debug: {config.get('debug')}")  # False

with config.override(debug=True, log_level="DEBUG"):
    print(f"Debug: {config.get('debug')}")  # True
    print(f"Log Level: {config.get('log_level')}")  # DEBUG

print(f"Debug: {config.get('debug')}")  # False
print(f"Log Level: {config.get('log_level')}")  # INFO
```

### HTML Tag Generator

```python
from contextlib import contextmanager

class HTMLBuilder:
    def __init__(self):
        self.indent_level = 0
        self.lines = []

    @contextmanager
    def tag(self, name, **attrs):
        """Generate HTML tag"""
        # Build attribute string
        attr_str = ""
        if attrs:
            attr_str = " " + " ".join(
                f'{k}="{v}"' for k, v in attrs.items()
            )

        # Opening tag
        indent = "  " * self.indent_level
        self.lines.append(f"{indent}<{name}{attr_str}>")

        self.indent_level += 1
        try:
            yield
        finally:
            self.indent_level -= 1
            self.lines.append(f"{indent}</{name}>")

    def text(self, content):
        """Add text content"""
        indent = "  " * self.indent_level
        self.lines.append(f"{indent}{content}")

    def render(self):
        """Render HTML"""
        return "\n".join(self.lines)


# Usage example
html = HTMLBuilder()

with html.tag("html"):
    with html.tag("head"):
        with html.tag("title"):
            html.text("My Webpage")
    with html.tag("body"):
        with html.tag("div", id="main", class_="container"):
            with html.tag("h1"):
                html.text("Welcome")
            with html.tag("p"):
                html.text("This is a webpage generated using context managers")

print(html.render())
```

## Asynchronous Context Managers

Python 3.5+ supports asynchronous context managers using the `async with` statement:

```python
import asyncio

class AsyncResource:
    """Asynchronous resource manager"""

    async def __aenter__(self):
        print("Asynchronously acquiring resource...")
        await asyncio.sleep(0.1)  # Simulate async operation
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Asynchronously releasing resource...")
        await asyncio.sleep(0.1)
        return False

    async def do_something(self):
        print("Executing async operation...")
        await asyncio.sleep(0.1)


async def main():
    async with AsyncResource() as resource:
        await resource.do_something()


# Run async code
asyncio.run(main())
```

### Using asynccontextmanager

```python
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_timer(description="operation"):
    """Asynchronous timer"""
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{description} took: {elapsed:.4f} seconds")


async def main():
    async with async_timer("Async task"):
        await asyncio.sleep(0.5)


asyncio.run(main())
```

## Best Practices

### Prefer Built-in Context Managers

```python
# Good practice
with open('file.txt') as f:
    content = f.read()

# Avoid
f = open('file.txt')
try:
    content = f.read()
finally:
    f.close()
```

### Use @contextmanager for Simple Cases

```python
from contextlib import contextmanager

# Simple context managers use decorator
@contextmanager
def simple_context():
    print("Entering")
    yield
    print("Exiting")

# Complex context managers use class
class ComplexContext:
    def __init__(self, config):
        self.config = config
        self.state = {}

    def __enter__(self):
        # Complex initialization logic
        return self

    def __exit__(self, *args):
        # Complex cleanup logic
        pass
```

### Always Clean Up Resources in finally

```python
@contextmanager
def safe_resource():
    resource = acquire_resource()
    try:
        yield resource
    finally:
        # Executes even if exception occurs
        release_resource(resource)
```

### Be Explicit About Exception Handling Strategy

```python
class MyContext:
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Explicitly return False to indicate exception is not suppressed
        return False

        # Or return True to suppress exception
        # return True
```

### Use Type Hints

```python
from contextlib import contextmanager
from typing import Generator, ContextManager

@contextmanager
def typed_context() -> Generator[str, None, None]:
    yield "value"

def use_context(cm: ContextManager[str]) -> None:
    with cm as value:
        print(value)
```

## Summary

Context managers are an elegant solution for managing resources in Python, providing:

1. **Automatic resource management**: Ensures resources are properly released after use
2. **Exception safety**: Guarantees cleanup operations execute even when exceptions occur
3. **Clean code**: Reduces boilerplate code, improves readability
4. **Flexible implementation**: Can be implemented using classes or decorators

Mastering the use and implementation of context managers is an important step in writing Pythonic code. In daily development, you should prioritize using context managers to manage any resources that need cleanup.
