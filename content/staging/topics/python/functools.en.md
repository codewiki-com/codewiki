---
title: Python functools Module
description: Master Python functools module including lru_cache, partial, reduce, wraps and other higher-order function tools
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - functools
  - functional programming
  - caching
status: imported
origin: old/src/content/docs/python/functools.en.md
divergence: 0.211
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 32
  lastUpdated: 2026-01-07
---

The `functools` module is a cornerstone of Python's standard library for functional programming. It provides higher-order functions and operations on callable objects, letting you write cleaner, more efficient, and more expressive code. From memoization with `lru_cache` to partial function application with `partial`, this module offers essential tools for every Python developer.

## Why Use functools?

The `functools` module addresses several common programming challenges:

1. **Performance Optimization**: Cache expensive function calls with `lru_cache` and `cache`
2. **Code Reusability**: Create specialized versions of functions with `partial`
3. **Decorator Support**: Preserve function metadata with `wraps`
4. **Functional Programming**: Implement reduction operations with `reduce`
5. **Comparison Operations**: Generate comparison methods automatically with `total_ordering`

```python
import functools
```

## Caching Functions

Caching is one of the most powerful features of `functools`. It allows you to store the results of expensive function calls and return the cached result when the same inputs occur again.

### lru_cache(maxsize=128, typed=False)

The `lru_cache` decorator implements a Least Recently Used (LRU) cache that stores up to `maxsize` most recent calls. When the cache is full, the least recently used entries are discarded.

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    """Calculate the nth Fibonacci number with caching."""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Without caching: exponential time complexity O(2^n)
# With caching: linear time complexity O(n)
print(fibonacci(100))  # 354224848179261915075 (computed instantly)

# Check cache statistics
print(fibonacci.cache_info())
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)

# Clear the cache
fibonacci.cache_clear()
```

#### Cache Parameters

```python
# maxsize=None creates an unbounded cache (use with caution!)
@lru_cache(maxsize=None)
def expensive_computation(x, y):
    """Cache all results without size limit."""
    return x ** y

# typed=True treats arguments of different types as distinct
@lru_cache(maxsize=128, typed=True)
def typed_function(x):
    """Treat 3 and 3.0 as different arguments."""
    return x * 2

typed_function(3)    # Cached separately
typed_function(3.0)  # Different cache entry
```

#### Practical Example: API Response Caching

```python
import time
from functools import lru_cache

@lru_cache(maxsize=100)
def get_user_data(user_id):
    """Simulate expensive API call with caching."""
    print(f"Fetching data for user {user_id}...")
    time.sleep(1)  # Simulate network delay
    return {"id": user_id, "name": f"User {user_id}"}

# First call: takes 1 second
start = time.time()
data1 = get_user_data(42)
print(f"First call: {time.time() - start:.2f}s")

# Second call: instant (cached)
start = time.time()
data2 = get_user_data(42)
print(f"Second call: {time.time() - start:.4f}s")
```

### cache (Python 3.9+)

The `cache` decorator is a simpler version of `lru_cache` with unlimited size and no LRU eviction.

```python
from functools import cache

@cache
def factorial(n):
    """Calculate factorial with simple caching."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(10))  # 3628800
print(factorial.cache_info())
```

### Caching with Mutable Arguments

Since `lru_cache` requires hashable arguments, you need special handling for mutable types:

```python
from functools import lru_cache
import json

def hashable_lru_cache(maxsize=128):
    """Decorator that handles unhashable arguments by converting to JSON."""
    def decorator(func):
        @lru_cache(maxsize=maxsize)
        def cached_func(args_json):
            args, kwargs = json.loads(args_json)
            return func(*args, **kwargs)

        def wrapper(*args, **kwargs):
            args_json = json.dumps([args, kwargs], sort_keys=True)
            return cached_func(args_json)

        wrapper.cache_info = cached_func.cache_info
        wrapper.cache_clear = cached_func.cache_clear
        return wrapper
    return decorator

@hashable_lru_cache(maxsize=100)
def process_data(data):
    """Process data that might include lists or dicts."""
    return sum(data) if isinstance(data, list) else data

print(process_data([1, 2, 3]))  # Works with lists
```

### Time-Based Cache Expiration

The standard `lru_cache` doesn't support time-based expiration, but you can implement it:

```python
import time
from functools import wraps

def timed_lru_cache(seconds=60, maxsize=128):
    """LRU cache with time-based expiration."""
    def decorator(func):
        func = lru_cache(maxsize=maxsize)(func)
        func.expiration = time.time() + seconds

        @wraps(func)
        def wrapper(*args, **kwargs):
            if time.time() > func.expiration:
                func.cache_clear()
                func.expiration = time.time() + seconds
            return func(*args, **kwargs)

        wrapper.cache_info = func.cache_info
        wrapper.cache_clear = func.cache_clear
        return wrapper
    return decorator

@timed_lru_cache(seconds=30, maxsize=100)
def get_config():
    """Get configuration that expires after 30 seconds."""
    print("Loading configuration...")
    return {"setting": "value"}
```

## Partial Function Application

The `partial` function creates a new callable with some arguments pre-filled. This is extremely useful for creating specialized versions of general functions.

### partial(func, *args, **kwargs)

```python
from functools import partial

# Basic partial application
def power(base, exponent):
    """Raise base to exponent."""
    return base ** exponent

# Create specialized functions
square = partial(power, exponent=2)
cube = partial(power, exponent=3)

print(square(5))  # 25
print(cube(5))    # 125

# Partial with positional arguments
def greet(greeting, name, punctuation="."):
    return f"{greeting}, {name}{punctuation}"

say_hello = partial(greet, "Hello")
say_hi_excited = partial(greet, "Hi", punctuation="!")

print(say_hello("Alice"))        # Hello, Alice.
print(say_hi_excited("Bob"))     # Hi, Bob!
```

### Practical Examples with partial

#### Example 1: Callback Functions

```python
from functools import partial

def button_click(button_id, action, event=None):
    """Handle button click events."""
    print(f"Button {button_id} triggered {action}")

# Create specific button handlers
save_handler = partial(button_click, "save", "save_document")
load_handler = partial(button_click, "load", "load_document")

# Simulate button clicks
save_handler()  # Button save triggered save_document
load_handler()  # Button load triggered load_document
```

#### Example 2: Sorting with Custom Keys

```python
from functools import partial

def get_nested_value(data, key_path):
    """Get a value from nested dictionary using dot notation."""
    keys = key_path.split('.')
    value = data
    for key in keys:
        value = value[key]
    return value

users = [
    {"name": "Alice", "profile": {"age": 30}},
    {"name": "Bob", "profile": {"age": 25}},
    {"name": "Charlie", "profile": {"age": 35}},
]

# Sort by nested value
get_age = partial(get_nested_value, key_path="profile.age")
sorted_users = sorted(users, key=get_age)
for user in sorted_users:
    print(f"{user['name']}: {user['profile']['age']}")
```

#### Example 3: Configuring Functions

```python
from functools import partial
import logging

def log_message(level, logger_name, message):
    """Log a message with specified level and logger."""
    logger = logging.getLogger(logger_name)
    log_func = getattr(logger, level)
    log_func(message)

# Create configured loggers
app_info = partial(log_message, "info", "app")
app_error = partial(log_message, "error", "app")
db_debug = partial(log_message, "debug", "database")

# Use the configured loggers
# app_info("Application started")
# app_error("Something went wrong")
# db_debug("Query executed")
```

### partialmethod(func, *args, **kwargs)

For use with class methods, `partialmethod` creates partial objects that work correctly with instance methods:

```python
from functools import partialmethod

class Cell:
    def __init__(self):
        self._alive = False

    def set_state(self, state):
        """Set the cell state."""
        self._alive = state

    # Create convenience methods using partialmethod
    set_alive = partialmethod(set_state, True)
    set_dead = partialmethod(set_state, False)

    @property
    def alive(self):
        return self._alive

cell = Cell()
print(cell.alive)  # False

cell.set_alive()
print(cell.alive)  # True

cell.set_dead()
print(cell.alive)  # False
```

## The reduce Function

The `reduce` function applies a binary function cumulatively to the items of an iterable, reducing it to a single value.

### reduce(function, iterable[, initializer])

```python
from functools import reduce

# Basic reduction: sum of a list
numbers = [1, 2, 3, 4, 5]
total = reduce(lambda x, y: x + y, numbers)
print(total)  # 15

# With initializer
total_with_initial = reduce(lambda x, y: x + y, numbers, 100)
print(total_with_initial)  # 115

# Product of a list
product = reduce(lambda x, y: x * y, numbers)
print(product)  # 120

# Finding maximum
maximum = reduce(lambda x, y: x if x > y else y, numbers)
print(maximum)  # 5
```

### How reduce Works

```python
from functools import reduce

# reduce(f, [a, b, c, d]) computes f(f(f(a, b), c), d)

def trace_reduce(func):
    """Wrapper to show reduce steps."""
    def wrapper(x, y):
        result = func(x, y)
        print(f"f({x}, {y}) = {result}")
        return result
    return wrapper

numbers = [1, 2, 3, 4]
result = reduce(trace_reduce(lambda x, y: x + y), numbers)
# Output:
# f(1, 2) = 3
# f(3, 3) = 6
# f(6, 4) = 10
print(f"Final result: {result}")  # 10
```

### Practical reduce Examples

#### Example 1: Flattening Nested Lists

```python
from functools import reduce

nested = [[1, 2], [3, 4], [5, 6]]
flattened = reduce(lambda x, y: x + y, nested)
print(flattened)  # [1, 2, 3, 4, 5, 6]
```

#### Example 2: Building a Dictionary

```python
from functools import reduce

pairs = [("a", 1), ("b", 2), ("c", 3)]
dictionary = reduce(lambda d, pair: {**d, pair[0]: pair[1]}, pairs, {})
print(dictionary)  # {'a': 1, 'b': 2, 'c': 3}
```

#### Example 3: Composing Functions

```python
from functools import reduce

def compose(*functions):
    """Compose multiple functions into one."""
    return reduce(
        lambda f, g: lambda x: f(g(x)),
        functions,
        lambda x: x
    )

# Create composed function
add_one = lambda x: x + 1
double = lambda x: x * 2
square = lambda x: x ** 2

# f(x) = square(double(add_one(x)))
composed = compose(square, double, add_one)
print(composed(5))  # ((5 + 1) * 2) ** 2 = 144
```

#### Example 4: Deep Dictionary Access

```python
from functools import reduce

def deep_get(dictionary, keys, default=None):
    """Safely get nested dictionary value."""
    return reduce(
        lambda d, key: d.get(key, default) if isinstance(d, dict) else default,
        keys.split('.'),
        dictionary
    )

data = {
    "user": {
        "profile": {
            "name": "Alice",
            "settings": {"theme": "dark"}
        }
    }
}

print(deep_get(data, "user.profile.name"))            # Alice
print(deep_get(data, "user.profile.settings.theme"))  # dark
print(deep_get(data, "user.nonexistent", "default"))  # default
```

## Decorator Utilities

### wraps(wrapped)

The `wraps` decorator is essential for writing proper decorators. It copies metadata from the wrapped function to the wrapper function.

```python
from functools import wraps

# Without @wraps
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        """Wrapper docstring."""
        return func(*args, **kwargs)
    return wrapper

# With @wraps
def good_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """Wrapper docstring."""
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def example1():
    """Original docstring."""
    pass

@good_decorator
def example2():
    """Original docstring."""
    pass

print(f"bad_decorator: name={example1.__name__}, doc={example1.__doc__}")
# bad_decorator: name=wrapper, doc=Wrapper docstring.

print(f"good_decorator: name={example2.__name__}, doc={example2.__doc__}")
# good_decorator: name=example2, doc=Original docstring.
```

### What wraps Preserves

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def documented_function(x, y):
    """This function adds two numbers.

    Args:
        x: First number
        y: Second number

    Returns:
        Sum of x and y
    """
    return x + y

# All metadata is preserved
print(documented_function.__name__)        # documented_function
print(documented_function.__doc__)         # Full docstring
print(documented_function.__module__)      # Module name
print(documented_function.__qualname__)    # Qualified name
print(documented_function.__annotations__) # Type annotations
print(documented_function.__dict__)        # Function attributes

# Access the original function
print(documented_function.__wrapped__)     # <function documented_function at ...>
```

### update_wrapper(wrapper, wrapped)

The underlying function that `wraps` uses. Useful when you need more control:

```python
from functools import update_wrapper

def my_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    # Manually update wrapper
    update_wrapper(wrapper, func)

    # Add custom attributes
    wrapper.custom_attr = "custom value"

    return wrapper
```

### WRAPPER_ASSIGNMENTS and WRAPPER_UPDATES

Customize which attributes are copied:

```python
from functools import wraps, WRAPPER_ASSIGNMENTS, WRAPPER_UPDATES

print(WRAPPER_ASSIGNMENTS)
# ('__module__', '__name__', '__qualname__', '__annotations__', '__doc__')

print(WRAPPER_UPDATES)
# ('__dict__',)

# Custom wrapper that only copies name and doc
def limited_wraps(func):
    return wraps(func, assigned=('__name__', '__doc__'), updated=())
```

## Comparison Operations

### total_ordering

The `total_ordering` class decorator fills in missing comparison methods. You only need to define `__eq__` and one of `__lt__`, `__le__`, `__gt__`, or `__ge__`.

```python
from functools import total_ordering

@total_ordering
class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade

    def __eq__(self, other):
        if not isinstance(other, Student):
            return NotImplemented
        return self.grade == other.grade

    def __lt__(self, other):
        if not isinstance(other, Student):
            return NotImplemented
        return self.grade < other.grade

    def __repr__(self):
        return f"Student({self.name!r}, {self.grade})"

alice = Student("Alice", 85)
bob = Student("Bob", 90)
charlie = Student("Charlie", 85)

# All comparison operators work
print(alice < bob)    # True
print(alice <= bob)   # True
print(alice > bob)    # False
print(alice >= bob)   # False
print(alice == charlie)  # True
print(alice != bob)   # True

# Sorting works automatically
students = [bob, alice, charlie]
print(sorted(students))  # [Student('Alice', 85), Student('Charlie', 85), Student('Bob', 90)]
```

### cmp_to_key(func)

Converts an old-style comparison function to a key function for use with `sorted()`, `min()`, `max()`, etc.

```python
from functools import cmp_to_key

# Old-style comparison function (returns -1, 0, or 1)
def compare_length(a, b):
    """Compare strings by length, then alphabetically."""
    if len(a) != len(b):
        return len(a) - len(b)
    return (a > b) - (a < b)  # -1, 0, or 1

words = ["python", "java", "go", "rust", "c"]
sorted_words = sorted(words, key=cmp_to_key(compare_length))
print(sorted_words)  # ['c', 'go', 'java', 'rust', 'python']

# Practical example: Custom sorting logic
def compare_versions(v1, v2):
    """Compare version strings like '1.2.3' vs '1.10.0'."""
    parts1 = [int(x) for x in v1.split('.')]
    parts2 = [int(x) for x in v2.split('.')]

    for p1, p2 in zip(parts1, parts2):
        if p1 < p2:
            return -1
        elif p1 > p2:
            return 1

    return len(parts1) - len(parts2)

versions = ['1.2.3', '1.10.0', '1.2.10', '2.0.0', '1.2']
sorted_versions = sorted(versions, key=cmp_to_key(compare_versions))
print(sorted_versions)  # ['1.2', '1.2.3', '1.2.10', '1.10.0', '2.0.0']
```

## Single Dispatch

### singledispatch(func)

The `singledispatch` decorator transforms a function into a single-dispatch generic function, which can have different implementations based on the type of the first argument.

```python
from functools import singledispatch

@singledispatch
def process(arg):
    """Default implementation."""
    print(f"Default: {arg} (type: {type(arg).__name__})")

@process.register(int)
def _(arg):
    """Process integers."""
    print(f"Integer: {arg * 2}")

@process.register(str)
def _(arg):
    """Process strings."""
    print(f"String: {arg.upper()}")

@process.register(list)
def _(arg):
    """Process lists."""
    print(f"List with {len(arg)} items")

# Different implementations called based on argument type
process(42)        # Integer: 84
process("hello")   # String: HELLO
process([1, 2, 3]) # List with 3 items
process(3.14)      # Default: 3.14 (type: float)
```

### Advanced singledispatch Usage

```python
from functools import singledispatch
from collections.abc import Mapping, Sequence
from decimal import Decimal

@singledispatch
def to_json(obj):
    """Convert object to JSON-compatible type."""
    raise TypeError(f"Cannot serialize {type(obj).__name__}")

@to_json.register(str)
@to_json.register(int)
@to_json.register(float)
@to_json.register(bool)
@to_json.register(type(None))
def _(obj):
    """Primitive types pass through."""
    return obj

@to_json.register(Decimal)
def _(obj):
    """Convert Decimal to float."""
    return float(obj)

@to_json.register(Mapping)
def _(obj):
    """Convert mapping types to dict."""
    return {k: to_json(v) for k, v in obj.items()}

@to_json.register(Sequence)
def _(obj):
    """Convert sequence types to list."""
    if isinstance(obj, (str, bytes)):
        return obj
    return [to_json(item) for item in obj]

# Using type annotations (Python 3.7+)
@to_json.register
def _(obj: complex):
    """Convert complex to dict."""
    return {"real": obj.real, "imag": obj.imag}

# Test
data = {
    "name": "Alice",
    "balance": Decimal("100.50"),
    "scores": [95, 87, 92],
    "position": 3 + 4j
}

print(to_json(data))
# {'name': 'Alice', 'balance': 100.5, 'scores': [95, 87, 92],
#  'position': {'real': 3.0, 'imag': 4.0}}
```

### singledispatchmethod (Python 3.8+)

For methods inside classes, use `singledispatchmethod`:

```python
from functools import singledispatchmethod

class Formatter:
    @singledispatchmethod
    def format(self, arg):
        """Default formatting."""
        return str(arg)

    @format.register(int)
    def _(self, arg):
        """Format integers with commas."""
        return f"{arg:,}"

    @format.register(float)
    def _(self, arg):
        """Format floats with 2 decimal places."""
        return f"{arg:.2f}"

    @format.register(list)
    def _(self, arg):
        """Format lists as comma-separated."""
        return ", ".join(self.format(item) for item in arg)

formatter = Formatter()
print(formatter.format(1234567))         # 1,234,567
print(formatter.format(3.14159))         # 3.14
print(formatter.format([1, 2.5, "hi"]))  # 1, 2.50, hi
```

## Cached Property

### cached_property (Python 3.8+)

The `cached_property` decorator transforms a method into a property whose value is computed once and then cached as a normal instance attribute.

```python
from functools import cached_property
import time

class DataAnalyzer:
    def __init__(self, data):
        self.data = data

    @cached_property
    def analysis(self):
        """Expensive computation that's cached after first access."""
        print("Computing analysis...")
        time.sleep(2)  # Simulate expensive computation
        return {
            "mean": sum(self.data) / len(self.data),
            "max": max(self.data),
            "min": min(self.data)
        }

    @cached_property
    def sorted_data(self):
        """Cached sorted copy of data."""
        print("Sorting data...")
        return sorted(self.data)

analyzer = DataAnalyzer([3, 1, 4, 1, 5, 9, 2, 6])

# First access: computes and caches
print(analyzer.analysis)  # Computing analysis... {'mean': 3.875, 'max': 9, 'min': 1}

# Subsequent accesses: returns cached value instantly
print(analyzer.analysis)  # {'mean': 3.875, 'max': 9, 'min': 1} (no "Computing...")

# Clear cache by deleting the attribute
del analyzer.analysis
print(analyzer.analysis)  # Computing analysis... (recomputed)
```

### Comparison with property

```python
from functools import cached_property

class Circle:
    def __init__(self, radius):
        self.radius = radius

    # Regular property: computed every time
    @property
    def diameter(self):
        print("Computing diameter")
        return self.radius * 2

    # Cached property: computed once
    @cached_property
    def circumference(self):
        print("Computing circumference")
        return 2 * 3.14159 * self.radius

circle = Circle(5)

# Regular property: computed each time
print(circle.diameter)  # Computing diameter -> 10
print(circle.diameter)  # Computing diameter -> 10

# Cached property: computed once
print(circle.circumference)  # Computing circumference -> 31.4159
print(circle.circumference)  # 31.4159 (no computation message)
```

## Real-World Examples

### Example 1: API Client with Caching

```python
from functools import lru_cache, wraps
import time
import json

class APIClient:
    def __init__(self, base_url):
        self.base_url = base_url

    @lru_cache(maxsize=100)
    def get_user(self, user_id):
        """Fetch user data with caching."""
        print(f"Fetching user {user_id} from API...")
        time.sleep(0.5)  # Simulate API call
        return {"id": user_id, "name": f"User {user_id}"}

    @lru_cache(maxsize=50)
    def get_posts(self, user_id, limit=10):
        """Fetch user posts with caching."""
        print(f"Fetching posts for user {user_id}...")
        time.sleep(0.3)
        return [{"id": i, "title": f"Post {i}"} for i in range(limit)]

    def clear_caches(self):
        """Clear all caches."""
        self.get_user.cache_clear()
        self.get_posts.cache_clear()

    def get_cache_stats(self):
        """Get cache statistics."""
        return {
            "user_cache": self.get_user.cache_info(),
            "posts_cache": self.get_posts.cache_info()
        }

# Usage
client = APIClient("https://api.example.com")

# First calls hit the "API"
client.get_user(1)
client.get_user(2)
client.get_posts(1)

# Subsequent calls use cache
client.get_user(1)  # Cached
client.get_posts(1)  # Cached

print(client.get_cache_stats())
```

### Example 2: Command Pattern with partial

```python
from functools import partial
from typing import Callable, Dict, Any

class CommandHandler:
    def __init__(self):
        self.commands: Dict[str, Callable] = {}
        self.history = []

    def register(self, name: str, func: Callable, **default_kwargs):
        """Register a command with optional default arguments."""
        if default_kwargs:
            self.commands[name] = partial(func, **default_kwargs)
        else:
            self.commands[name] = func

    def execute(self, name: str, *args, **kwargs):
        """Execute a registered command."""
        if name not in self.commands:
            raise ValueError(f"Unknown command: {name}")

        result = self.commands[name](*args, **kwargs)
        self.history.append((name, args, kwargs, result))
        return result

    def replay(self, n: int = None):
        """Replay last n commands."""
        commands_to_replay = self.history[-n:] if n else self.history
        return [self.commands[name](*args, **kwargs)
                for name, args, kwargs, _ in commands_to_replay]

# Example functions
def send_email(to, subject, body, sender="noreply@example.com"):
    return f"Email sent to {to} from {sender}: {subject}"

def log_event(event_type, message, level="INFO"):
    return f"[{level}] {event_type}: {message}"

# Setup handler
handler = CommandHandler()
handler.register("email", send_email, sender="admin@example.com")
handler.register("log", log_event, level="DEBUG")

# Execute commands
print(handler.execute("email", "user@test.com", "Welcome", "Hello!"))
print(handler.execute("log", "USER_LOGIN", "User logged in"))
```

### Example 3: Recursive Algorithms with Memoization

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def edit_distance(s1: str, s2: str) -> int:
    """Calculate Levenshtein edit distance between two strings."""
    if not s1:
        return len(s2)
    if not s2:
        return len(s1)

    if s1[0] == s2[0]:
        return edit_distance(s1[1:], s2[1:])

    return 1 + min(
        edit_distance(s1[1:], s2),      # Delete from s1
        edit_distance(s1, s2[1:]),      # Insert into s1
        edit_distance(s1[1:], s2[1:])   # Replace in s1
    )

# Without memoization, this would be extremely slow
print(edit_distance("kitten", "sitting"))  # 3
print(edit_distance.cache_info())

@lru_cache(maxsize=None)
def longest_common_subsequence(s1: str, s2: str) -> str:
    """Find the longest common subsequence of two strings."""
    if not s1 or not s2:
        return ""

    if s1[-1] == s2[-1]:
        return longest_common_subsequence(s1[:-1], s2[:-1]) + s1[-1]

    lcs1 = longest_common_subsequence(s1[:-1], s2)
    lcs2 = longest_common_subsequence(s1, s2[:-1])

    return lcs1 if len(lcs1) > len(lcs2) else lcs2

print(longest_common_subsequence("ABCDGH", "AEDFHR"))  # ADH
```

### Example 4: Event-Driven System with singledispatch

```python
from functools import singledispatch
from dataclasses import dataclass
from datetime import datetime

# Define event types
@dataclass
class Event:
    timestamp: datetime

@dataclass
class UserCreated(Event):
    user_id: int
    username: str

@dataclass
class OrderPlaced(Event):
    order_id: int
    user_id: int
    total: float

@dataclass
class PaymentReceived(Event):
    payment_id: int
    order_id: int
    amount: float

# Event handler using singledispatch
@singledispatch
def handle_event(event: Event):
    """Default event handler."""
    print(f"Unhandled event: {type(event).__name__}")

@handle_event.register
def _(event: UserCreated):
    """Handle user creation."""
    print(f"New user created: {event.username} (ID: {event.user_id})")
    # Send welcome email, initialize user profile, etc.

@handle_event.register
def _(event: OrderPlaced):
    """Handle order placement."""
    print(f"Order #{event.order_id} placed by user {event.user_id}: ${event.total:.2f}")
    # Update inventory, notify warehouse, etc.

@handle_event.register
def _(event: PaymentReceived):
    """Handle payment receipt."""
    print(f"Payment #{event.payment_id} received for order #{event.order_id}: ${event.amount:.2f}")
    # Update order status, send confirmation, etc.

# Process events
events = [
    UserCreated(datetime.now(), 1, "alice"),
    OrderPlaced(datetime.now(), 100, 1, 99.99),
    PaymentReceived(datetime.now(), 500, 100, 99.99)
]

for event in events:
    handle_event(event)
```

### Example 5: Configuration with cached_property

```python
from functools import cached_property
import json
import os

class Configuration:
    def __init__(self, config_path: str):
        self.config_path = config_path

    @cached_property
    def settings(self) -> dict:
        """Load and cache configuration settings."""
        print(f"Loading configuration from {self.config_path}")
        # Simulated config loading
        return {
            "database": {
                "host": "localhost",
                "port": 5432,
                "name": "myapp"
            },
            "cache": {
                "enabled": True,
                "ttl": 3600
            }
        }

    @cached_property
    def database_url(self) -> str:
        """Build and cache database URL."""
        db = self.settings["database"]
        return f"postgresql://{db['host']}:{db['port']}/{db['name']}"

    @cached_property
    def cache_config(self) -> dict:
        """Get and cache cache configuration."""
        return self.settings.get("cache", {})

    def reload(self):
        """Reload configuration by clearing caches."""
        for attr in ['settings', 'database_url', 'cache_config']:
            try:
                delattr(self, attr)
            except AttributeError:
                pass
        print("Configuration cache cleared")

# Usage
config = Configuration("/etc/myapp/config.json")

# First access loads configuration
print(config.database_url)  # Loading configuration... postgresql://...

# Subsequent accesses use cache
print(config.database_url)  # postgresql://... (no loading message)
print(config.cache_config)  # Uses cached settings

# Reload configuration
config.reload()
print(config.database_url)  # Loading configuration... (reloaded)
```

## Best Practices

### Choose the Right Caching Strategy

```python
from functools import lru_cache, cache

# Use lru_cache with maxsize for bounded caching
@lru_cache(maxsize=128)
def limited_cache_function(x):
    """Use for frequently called functions with many unique arguments."""
    return expensive_computation(x)

# Use cache for unbounded caching when all results should be kept
@cache
def unlimited_cache_function(x):
    """Use for functions with limited unique argument combinations."""
    return expensive_computation(x)

# For user-facing functions, consider memory limits
@lru_cache(maxsize=1000)
def process_user_request(user_id, request_type):
    """Bounded cache to prevent memory issues."""
    pass
```

### Always Use wraps in Decorators

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)  # Always include this!
    def wrapper(*args, **kwargs):
        # Decorator logic
        return func(*args, **kwargs)
    return wrapper
```

### Use partial for Cleaner APIs

```python
from functools import partial

# Instead of lambda
sorted_by_name = partial(sorted, key=lambda x: x['name'])

# Instead of default arguments in wrappers
def create_configured_function(config):
    return partial(process_data, config=config)
```

### Consider Thread Safety

```python
from functools import lru_cache
import threading

# lru_cache is thread-safe for reads
@lru_cache(maxsize=100)
def thread_safe_cached_function(x):
    return x * 2

# For cache invalidation in multithreaded code, use locks
cache_lock = threading.Lock()

def invalidate_cache():
    with cache_lock:
        thread_safe_cached_function.cache_clear()
```

### Monitor Cache Performance

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def monitored_function(x):
    return x ** 2

# Periodically check cache effectiveness
def check_cache_health():
    info = monitored_function.cache_info()
    hit_rate = info.hits / (info.hits + info.misses) if info.hits + info.misses > 0 else 0

    print(f"Cache hit rate: {hit_rate:.2%}")
    print(f"Current size: {info.currsize}/{info.maxsize}")

    if hit_rate < 0.5:
        print("Warning: Low cache hit rate, consider adjusting maxsize")
```

### Use singledispatch for Type-Based Logic

```python
from functools import singledispatch

# Instead of isinstance chains
# Bad:
def process_bad(data):
    if isinstance(data, list):
        return process_list(data)
    elif isinstance(data, dict):
        return process_dict(data)
    else:
        return process_default(data)

# Good:
@singledispatch
def process_good(data):
    return process_default(data)

@process_good.register(list)
def _(data):
    return process_list(data)

@process_good.register(dict)
def _(data):
    return process_dict(data)
```

## Summary

The `functools` module provides essential tools for functional programming in Python:

| Function | Purpose | Key Use Case |
|----------|---------|--------------|
| `lru_cache` | Memoization with LRU eviction | Caching expensive function calls |
| `cache` | Simple unbounded memoization | Caching with unlimited storage |
| `partial` | Pre-fill function arguments | Creating specialized functions |
| `partialmethod` | partial for class methods | Method specialization |
| `reduce` | Cumulative binary operation | Aggregating sequences |
| `wraps` | Preserve function metadata | Writing decorators |
| `total_ordering` | Generate comparison methods | Sortable classes |
| `cmp_to_key` | Convert comparison to key | Custom sorting |
| `singledispatch` | Type-based dispatch | Generic functions |
| `singledispatchmethod` | Method type-based dispatch | Generic methods |
| `cached_property` | One-time computed property | Expensive property caching |

By mastering these tools, you can write more efficient, cleaner, and more Pythonic code. The key is understanding when each tool is appropriate:

- Use caching for expensive, pure functions with repeated calls
- Use partial to create reusable, configured functions
- Use wraps in every decorator to preserve metadata
- Use singledispatch for clean type-based polymorphism
- Use cached_property for expensive property computations

The `functools` module exemplifies Python's philosophy of providing powerful, composable building blocks that let you write expressive code without sacrificing performance.
