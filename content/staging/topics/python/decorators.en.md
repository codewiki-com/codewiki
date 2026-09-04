---
title: Python Decorators
description: "Master Python decorators: function decorators, class decorators, parameterized decorators and patterns"
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - Decorators
  - Higher-Order Functions
  - Metaprogramming
status: imported
origin: old/src/content/docs/python/decorators.en.md
divergence: 0.193
issues: []
legacy:
  category: Python
  subcategory: Functional Programming
  order: 8
  lastUpdated: 2026-01-07
---

Decorators are a powerful and elegant feature in Python that allow you to modify or enhance the behavior of functions and classes without permanently modifying their source code. They are a form of metaprogramming that leverages Python's support for first-class functions and higher-order functions.

## What Are Decorators?

A decorator is a callable that takes another callable as an argument and returns a new callable. Decorators allow you to wrap another function or class to extend its behavior without permanently modifying it.

The basic concept:

```python
def decorator(func):
    def wrapper(*args, **kwargs):
        # Do something before
        result = func(*args, **kwargs)
        # Do something after
        return result
    return wrapper
```

Decorators are commonly used for:
- Logging and debugging
- Access control and authentication
- Caching and memoization
- Timing and performance measurement
- Input validation
- Rate limiting

## Function Decorators

### Basic Function Decorator

A simple decorator that logs function calls:

```python
def log_call(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper

@log_call
def add(a, b):
    return a + b

# Usage
result = add(3, 5)
# Output:
# Calling add with args=(3, 5), kwargs={}
# add returned 8
```

### Timing Decorator

Measure execution time of functions:

```python
import time
from functools import wraps

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)
    return "Done"

# Usage
slow_function()
# Output: slow_function took 1.0012 seconds
```

### Validation Decorator

Validate function arguments:

```python
def validate_positive(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        for arg in args:
            if isinstance(arg, (int, float)) and arg < 0:
                raise ValueError(f"Argument must be positive, got {arg}")
        return func(*args, **kwargs)
    return wrapper

@validate_positive
def calculate_square_root(n):
    return n ** 0.5

# Usage
print(calculate_square_root(16))  # 4.0
# calculate_square_root(-4)  # Raises ValueError
```

## Understanding the @ Syntax

The `@` symbol is syntactic sugar that makes decorators easier to use. These two approaches are equivalent:

```python
# Using @ syntax
@decorator
def function():
    pass

# Without @ syntax (explicit decoration)
def function():
    pass
function = decorator(function)
```

Multiple decorators can be stacked:

```python
@decorator1
@decorator2
@decorator3
def function():
    pass

# Equivalent to:
function = decorator1(decorator2(decorator3(function)))
```

## Preserving Metadata with functools.wraps

When you create a wrapper function inside a decorator, the wrapper loses the original function's metadata (name, docstring, etc.). The `functools.wraps` decorator preserves this metadata:

```python
from functools import wraps

# Without functools.wraps
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        """Wrapper docstring"""
        return func(*args, **kwargs)
    return wrapper

# With functools.wraps
def good_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """Wrapper docstring"""
        return func(*args, **kwargs)
    return wrapper

def my_function():
    """Original docstring"""
    pass

# Comparison
decorated_bad = bad_decorator(my_function)
decorated_good = good_decorator(my_function)

print(decorated_bad.__name__)  # 'wrapper'
print(decorated_good.__name__)  # 'my_function'

print(decorated_bad.__doc__)   # 'Wrapper docstring'
print(decorated_good.__doc__)  # 'Original docstring'
```

Always use `@wraps(func)` in your decorator's wrapper function to maintain proper metadata.

## Parameterized Decorators

Decorators that accept arguments require an additional level of nesting:

### Simple Parameterized Decorator

```python
def repeat(times):
    """Decorator that repeats function execution"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            results = []
            for _ in range(times):
                result = func(*args, **kwargs)
                results.append(result)
            return results
        return wrapper
    return decorator

@repeat(times=3)
def greet(name):
    return f"Hello, {name}!"

# Usage
print(greet("Alice"))
# Output: ['Hello, Alice!', 'Hello, Alice!', 'Hello, Alice!']
```

### Retry Decorator with Parameters

```python
import time
from functools import wraps

def retry(max_attempts=3, delay=1):
    """Retry decorator with configurable attempts and delay"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts >= max_attempts:
                        raise
                    print(f"Attempt {attempts} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def unstable_network_call():
    import random
    if random.random() < 0.7:
        raise ConnectionError("Network error")
    return "Success"
```

### Cache Decorator with TTL

```python
import time
from functools import wraps

def cache_with_ttl(ttl_seconds=60):
    """Cache decorator with time-to-live"""
    def decorator(func):
        cache = {}

        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (args, tuple(kwargs.items()))
            current_time = time.time()

            if key in cache:
                result, timestamp = cache[key]
                if current_time - timestamp < ttl_seconds:
                    print(f"Cache hit for {func.__name__}")
                    return result

            result = func(*args, **kwargs)
            cache[key] = (result, current_time)
            return result

        return wrapper
    return decorator

@cache_with_ttl(ttl_seconds=5)
def expensive_computation(n):
    print(f"Computing for {n}...")
    time.sleep(2)
    return n * n

# Usage
print(expensive_computation(4))  # Computes
print(expensive_computation(4))  # Cache hit
time.sleep(6)
print(expensive_computation(4))  # Computes again (cache expired)
```

## Decorator Stacking

Multiple decorators can be applied to a single function. They are applied from bottom to top:

```python
def bold(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return f"<b>{func(*args, **kwargs)}</b>"
    return wrapper

def italic(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return f"<i>{func(*args, **kwargs)}</i>"
    return wrapper

def underline(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return f"<u>{func(*args, **kwargs)}</u>"
    return wrapper

@bold
@italic
@underline
def greet(name):
    return f"Hello, {name}"

print(greet("World"))
# Output: <b><i><u>Hello, World</u></i></b>

# Execution order:
# underline wraps greet
# italic wraps the result
# bold wraps the final result
```

### Practical Example: Stacking Authentication and Logging

```python
def require_auth(func):
    @wraps(func)
    def wrapper(user, *args, **kwargs):
        if not user.get('authenticated'):
            raise PermissionError("Authentication required")
        return func(user, *args, **kwargs)
    return wrapper

def log_access(func):
    @wraps(func)
    def wrapper(user, *args, **kwargs):
        print(f"User {user.get('name')} accessed {func.__name__}")
        return func(user, *args, **kwargs)
    return wrapper

@log_access
@require_auth
def view_account(user):
    return f"Account details for {user['name']}"

# Usage
user1 = {'name': 'Alice', 'authenticated': True}
user2 = {'name': 'Bob', 'authenticated': False}

print(view_account(user1))  # Logs and shows account
# view_account(user2)  # Raises PermissionError
```

## Class Decorators

Decorators can also be applied to classes to modify class behavior:

### Simple Class Decorator

```python
def singleton(cls):
    """Ensure a class has only one instance"""
    instances = {}

    @wraps(cls, updated=())
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class Database:
    def __init__(self):
        print("Initializing database connection")
        self.connection = "Connected"

# Usage
db1 = Database()  # Prints: Initializing database connection
db2 = Database()  # No output, returns same instance
print(db1 is db2)  # True
```

### Adding Methods to Classes

```python
def add_repr(cls):
    """Add a __repr__ method to a class"""
    def __repr__(self):
        attrs = ', '.join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{cls.__name__}({attrs})"

    cls.__repr__ = __repr__
    return cls

@add_repr
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

# Usage
p = Person("Alice", 30)
print(p)  # Person(name='Alice', age=30)
```

### Class Decorator with Parameters

```python
def register_in(registry):
    """Register a class in a registry"""
    def decorator(cls):
        registry[cls.__name__] = cls
        return cls
    return decorator

# Plugin registry
PLUGINS = {}

@register_in(PLUGINS)
class PluginA:
    pass

@register_in(PLUGINS)
class PluginB:
    pass

print(PLUGINS)  # {'PluginA': <class '__main__.PluginA'>, 'PluginB': <class '__main__.PluginB'>}
```

### Decorators as Classes

Decorators themselves can be implemented as classes:

```python
class CountCalls:
    """Decorator implemented as a class"""
    def __init__(self, func):
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"Call {self.count} of {self.func.__name__}")
        return self.func(*args, **kwargs)

@CountCalls
def say_hello():
    return "Hello!"

# Usage
say_hello()  # Call 1 of say_hello
say_hello()  # Call 2 of say_hello
print(say_hello.count)  # 2
```

### Class-Based Parameterized Decorator

```python
class RateLimiter:
    """Rate limiting decorator"""
    def __init__(self, max_calls, time_window):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_time = time.time()
            # Remove old calls outside the time window
            self.calls = [t for t in self.calls if current_time - t < self.time_window]

            if len(self.calls) >= self.max_calls:
                raise Exception(f"Rate limit exceeded: {self.max_calls} calls per {self.time_window}s")

            self.calls.append(current_time)
            return func(*args, **kwargs)

        return wrapper

@RateLimiter(max_calls=3, time_window=10)
def api_call():
    return "API response"

# Usage
for i in range(5):
    try:
        print(api_call())
    except Exception as e:
        print(f"Error: {e}")
```

## Common Decorator Patterns

### Memoization / Caching

```python
from functools import wraps

def memoize(func):
    """Cache function results"""
    cache = {}

    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    return wrapper

@memoize
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(100))  # Fast due to memoization
```

Python's standard library provides `functools.lru_cache`:

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

### Property Caching

```python
class cached_property:
    """Decorator that converts a method into a cached property"""
    def __init__(self, func):
        self.func = func
        self.__doc__ = func.__doc__

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        value = self.func(obj)
        setattr(obj, self.func.__name__, value)
        return value

class DataProcessor:
    def __init__(self, data):
        self.data = data

    @cached_property
    def processed_data(self):
        print("Processing data...")
        # Expensive computation
        return [x * 2 for x in self.data]

# Usage
processor = DataProcessor([1, 2, 3])
print(processor.processed_data)  # Prints "Processing data..." then [2, 4, 6]
print(processor.processed_data)  # [2, 4, 6] (cached, no processing)
```

### Access Control

```python
def require_permission(permission):
    """Check if user has required permission"""
    def decorator(func):
        @wraps(func)
        def wrapper(user, *args, **kwargs):
            if permission not in user.get('permissions', []):
                raise PermissionError(f"Missing permission: {permission}")
            return func(user, *args, **kwargs)
        return wrapper
    return decorator

@require_permission('admin')
def delete_user(user, user_id):
    return f"User {user_id} deleted"

# Usage
admin = {'name': 'Alice', 'permissions': ['admin', 'read', 'write']}
regular_user = {'name': 'Bob', 'permissions': ['read']}

print(delete_user(admin, 123))  # Works
# delete_user(regular_user, 123)  # Raises PermissionError
```

### Input Validation

```python
def validate_types(**type_hints):
    """Validate function argument types"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get function signature
            import inspect
            sig = inspect.signature(func)
            bound_args = sig.bind(*args, **kwargs)

            for param_name, param_value in bound_args.arguments.items():
                if param_name in type_hints:
                    expected_type = type_hints[param_name]
                    if not isinstance(param_value, expected_type):
                        raise TypeError(
                            f"{param_name} must be {expected_type.__name__}, "
                            f"got {type(param_value).__name__}"
                        )

            return func(*args, **kwargs)
        return wrapper
    return decorator

@validate_types(name=str, age=int, salary=float)
def create_employee(name, age, salary):
    return {'name': name, 'age': age, 'salary': salary}

# Usage
print(create_employee("Alice", 30, 50000.0))  # Works
# create_employee("Bob", "thirty", 50000.0)  # Raises TypeError
```

### Deprecation Warning

```python
import warnings
from functools import wraps

def deprecated(reason):
    """Mark a function as deprecated"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            warnings.warn(
                f"{func.__name__} is deprecated: {reason}",
                category=DeprecationWarning,
                stacklevel=2
            )
            return func(*args, **kwargs)
        return wrapper
    return decorator

@deprecated("Use new_function() instead")
def old_function():
    return "This is old"

# Usage
old_function()  # Shows deprecation warning
```

### Automatic Retry with Exponential Backoff

```python
import time
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=1, max_delay=60):
    """Retry with exponential backoff"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        raise

                    delay = min(base_delay * (2 ** (retries - 1)), max_delay)
                    print(f"Retry {retries}/{max_retries} after {delay}s: {e}")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry_with_backoff(max_retries=4, base_delay=1)
def flaky_api_call():
    import random
    if random.random() < 0.8:
        raise ConnectionError("Temporary network issue")
    return "Success"
```

## Advanced Decorator Techniques

### Decorator Factory with Optional Arguments

Create decorators that can be used with or without arguments:

```python
from functools import wraps, partial

def optional_decorator(func=None, *, prefix="Default"):
    """Decorator that works with or without arguments"""
    if func is None:
        # Called with arguments: @optional_decorator(prefix="Custom")
        return partial(optional_decorator, prefix=prefix)

    # Called without arguments: @optional_decorator
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return f"{prefix}: {result}"
    return wrapper

# Usage both ways
@optional_decorator
def greet1(name):
    return f"Hello, {name}"

@optional_decorator(prefix="Custom")
def greet2(name):
    return f"Hello, {name}"

print(greet1("Alice"))  # Default: Hello, Alice
print(greet2("Bob"))    # Custom: Hello, Bob
```

### Context Manager Decorator

Create a decorator that uses a context manager:

```python
from contextlib import contextmanager
from functools import wraps

@contextmanager
def database_transaction():
    """Simulate database transaction"""
    print("BEGIN TRANSACTION")
    try:
        yield
        print("COMMIT")
    except Exception:
        print("ROLLBACK")
        raise

def with_transaction(func):
    """Decorator to wrap function in a database transaction"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        with database_transaction():
            return func(*args, **kwargs)
    return wrapper

@with_transaction
def transfer_money(from_account, to_account, amount):
    print(f"Transfer ${amount} from {from_account} to {to_account}")
    # Simulate work
    if amount < 0:
        raise ValueError("Invalid amount")

# Usage
transfer_money("A", "B", 100)
# Output:
# BEGIN TRANSACTION
# Transfer $100 from A to B
# COMMIT
```

### Chaining Decorators with State

```python
class Pipeline:
    """Decorator that chains operations"""
    def __init__(self):
        self.operations = []

    def add_operation(self, operation):
        """Decorator to add an operation to the pipeline"""
        def decorator(func):
            self.operations.append((operation.__name__, operation))
            return func
        return decorator

    def process(self, func):
        """Decorator to create a processing function"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = func(*args, **kwargs)
            for name, operation in self.operations:
                print(f"Applying {name}")
                data = operation(data)
            return data
        return wrapper

# Usage
pipeline = Pipeline()

@pipeline.add_operation
def double(x):
    return x * 2

@pipeline.add_operation
def add_ten(x):
    return x + 10

@pipeline.add_operation
def square(x):
    return x ** 2

@pipeline.process
def get_initial_value():
    return 5

result = get_initial_value()
# Output:
# Applying double
# Applying add_ten
# Applying square
print(result)  # ((5 * 2) + 10) ** 2 = 400
```

### Async Decorators

Decorators for asynchronous functions:

```python
import asyncio
from functools import wraps

def async_timing(func):
    """Time async function execution"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = asyncio.get_event_loop().time()
        result = await func(*args, **kwargs)
        end = asyncio.get_event_loop().time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

def async_retry(max_attempts=3):
    """Retry async function on failure"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"Attempt {attempt + 1} failed: {e}")
                    await asyncio.sleep(1)
        return wrapper
    return decorator

@async_timing
@async_retry(max_attempts=3)
async def fetch_data(url):
    """Simulate async API call"""
    await asyncio.sleep(1)
    return f"Data from {url}"

# Usage
# asyncio.run(fetch_data("https://api.example.com"))
```

## Best Practices

### Always Use functools.wraps

```python
from functools import wraps

# Good
def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

# Bad
def my_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### Make Decorators Generic

Use `*args` and `**kwargs` to accept any function signature:

```python
def generic_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Works with any function signature
        return func(*args, **kwargs)
    return wrapper
```

### Document Your Decorators

```python
def my_decorator(func):
    """
    A decorator that does X.

    Args:
        func: The function to decorate

    Returns:
        A wrapped version of func that does Y

    Example:
        @my_decorator
        def my_function():
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### Handle Edge Cases

```python
def safe_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"Error in {func.__name__}: {e}")
            raise
    return wrapper
```

### Keep Decorators Focused

Each decorator should have a single, clear responsibility:

```python
# Good: Focused decorators
@timing
@logging
@cache
def my_function():
    pass

# Bad: One decorator doing too much
@do_everything
def my_function():
    pass
```

### Consider Performance

Be mindful of decorator overhead, especially in hot paths:

```python
# Avoid unnecessary work in the wrapper
def efficient_decorator(func):
    # Do expensive setup once, outside the wrapper
    expensive_setup = setup_once()

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Only lightweight operations here
        return func(*args, **kwargs)
    return wrapper
```

### Make Decorators Reusable

Design decorators to work in multiple contexts:

```python
def configurable_decorator(option1=None, option2=None):
    """Decorator with sensible defaults"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Use option1, option2
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

## Conclusion

Python decorators are a powerful tool for writing clean, maintainable, and DRY (Don't Repeat Yourself) code. They enable you to:

- Separate cross-cutting concerns from business logic
- Add functionality to existing code without modification
- Create reusable components for common patterns
- Implement aspect-oriented programming in Python

Key takeaways:

1. **Decorators are functions** that take a function and return a modified version
2. **Use `@wraps`** to preserve function metadata
3. **Parameterized decorators** require an extra layer of nesting
4. **Decorators can be stacked** and are applied bottom-to-top
5. **Class decorators** modify class behavior
6. **Common patterns** include caching, logging, validation, and access control
7. **Best practices** ensure decorators are maintainable and efficient

With decorators, you can write more elegant and maintainable Python code that clearly separates concerns and promotes code reuse.
