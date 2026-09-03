---
title: Python functools Cache Decorators (lru_cache / cache)
description: Master Python functools module cache decorators, including lru_cache and cache principles, parameter configuration, cache management, and best practices
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - functools
  - lru_cache
  - cache
  - 缓存
  - 性能优化
  - 装饰器
status: imported
origin: old/src/content/docs/python/lru-cache.en.md
divergence: 0.206
issues: []
legacy:
  category: Python
  subcategory: 函数式编程
  order: 33
  lastUpdated: 2026-01-07
---

Python's `functools` module provides powerful cache decorators `@lru_cache` and `@cache` that automatically memoize function computation results, avoiding redundant calculations and significantly improving program performance. We'll analyze the principles, usage, and best practices for these two decorators in depth.

## Concept Explanation

### What is Function Caching

Function caching (also known as memoization) is an optimization technique: storing a function's input parameters along with their corresponding return values, so when the same parameters are passed again, the cached result is returned directly without re-executing the function body.

```python
# Without caching: recalculates every call
def fibonacci_naive(n):
    if n < 2:
        return n
    return fibonacci_naive(n - 1) + fibonacci_naive(n - 2)

# fibonacci_naive(35) requires approximately 29 million recursive calls
```

### LRU Cache Strategy

LRU (Least Recently Used) is a cache eviction strategy. When the cache is full, it prioritizes removing the data that hasn't been accessed for the longest time. This strategy is based on the assumption that "data accessed recently is more likely to be accessed again in the future."

```
Cache operation diagram (maxsize=3):
Initial: []
Call f(1): [1]        # Cache miss, add 1
Call f(2): [1, 2]     # Cache miss, add 2
Call f(3): [1, 2, 3]  # Cache miss, add 3
Call f(1): [2, 3, 1]  # Cache hit, 1 moves to end (most recently used)
Call f(4): [3, 1, 4]  # Cache miss, remove least recently used 2, add 4
```

### Relationship Between @lru_cache and @cache

| Decorator | Introduced Version | Description |
|-----------|-------------------|-------------|
| `@lru_cache` | Python 3.2 | LRU cache with size limit |
| `@cache` | Python 3.9 | Simple cache without size limit, equivalent to `@lru_cache(maxsize=None)` |

```python
from functools import lru_cache, cache

# The following two approaches are functionally equivalent
@cache
def func1(x):
    return x * 2

@lru_cache(maxsize=None)
def func2(x):
    return x * 2
```

## Core Principles

### Internal Implementation Mechanism

The core of `lru_cache` is a data structure based on a doubly linked list and hash table, achieving O(1) time complexity for lookup and update operations.

```python
# Simplified implementation principle of lru_cache
class SimpleLRUCache:
    def __init__(self, maxsize):
        self.maxsize = maxsize
        self.cache = {}           # Hash table: fast lookup
        self.order = []           # Doubly linked list (simplified as list): maintains access order

    def get(self, key):
        if key in self.cache:
            # Move to most recently used position
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key], True  # (value, hit)
        return None, False  # (None, miss)

    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.maxsize:
            # Remove least recently used item
            oldest = self.order.pop(0)
            del self.cache[oldest]

        self.cache[key] = value
        self.order.append(key)
```

### Cache Key Generation

`lru_cache` uses function parameters to generate cache keys. Parameters must be hashable.

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def compute(x, y, z=10):
    return x + y + z

# Cache key generation rules:
# compute(1, 2)        -> key: (1, 2)
# compute(1, 2, 10)    -> key: (1, 2, 10)  # Different from above!
# compute(1, 2, z=10)  -> key: (1, 2, ('z', 10))
# compute(x=1, y=2)    -> key: (('x', 1), ('y', 2))

# Note: The following calls produce the same result but have different cache keys
print(compute(1, 2))       # Computed and cached
print(compute(1, 2, 10))   # Recomputed and cached (different key)
```

### The Role of the typed Parameter

When `typed=True`, arguments of different types are cached separately.

```python
from functools import lru_cache

@lru_cache(maxsize=128, typed=False)  # Default
def func_untyped(x):
    print(f"Computing {x} (type: {type(x).__name__})")
    return x * 2

@lru_cache(maxsize=128, typed=True)
def func_typed(x):
    print(f"Computing {x} (type: {type(x).__name__})")
    return x * 2

# typed=False: 3 and 3.0 are treated as the same
func_untyped(3)    # Computed
func_untyped(3.0)  # Returned from cache (no print)

# typed=True: 3 and 3.0 are cached separately
func_typed(3)      # Computing 3 (type: int)
func_typed(3.0)    # Computing 3.0 (type: float)
```

## Key Points

### Basic Usage

```python
from functools import lru_cache

# Basic usage: using default parameters
@lru_cache
def factorial(n):
    return 1 if n <= 1 else n * factorial(n - 1)

# Specifying cache size
@lru_cache(maxsize=256)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Unlimited cache
@lru_cache(maxsize=None)
def expensive_computation(x, y):
    # Complex computation
    return x ** y

# Python 3.9+ shorthand
from functools import cache

@cache
def simple_cache(x):
    return x * 2
```

### Parameter Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxsize` | int or None | 128 | Maximum number of cache entries. None means unlimited. Powers of 2 are recommended. |
| `typed` | bool | False | Whether to distinguish parameter types. When True, `f(3)` and `f(3.0)` are cached separately. |

```python
from functools import lru_cache

# maxsize selection recommendations
@lru_cache(maxsize=32)    # Small cache: limited parameter space
@lru_cache(maxsize=128)   # Medium cache: default value, suitable for most scenarios
@lru_cache(maxsize=1024)  # Large cache: frequently accessed computations
@lru_cache(maxsize=None)  # Unlimited cache: deterministic lookup tables

# Why powers of 2 are recommended?
# Python internally uses hash tables, and powers of 2 sizes optimize modulo operations
```

### Cache Management Methods

Decorated functions automatically receive the following methods:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_user(user_id):
    print(f"Querying user {user_id}")
    return {"id": user_id, "name": f"User{user_id}"}

# Call the function
get_user(1)
get_user(2)
get_user(1)  # Cache hit

# cache_info(): View cache statistics
info = get_user.cache_info()
print(f"Hits: {info.hits}")           # hits: 1
print(f"Misses: {info.misses}")       # misses: 2
print(f"Current size: {info.currsize}") # currsize: 2
print(f"Max size: {info.maxsize}")     # maxsize: 100

# cache_clear(): Clear all cache
get_user.cache_clear()
print(get_user.cache_info())  # hits=0, misses=0, currsize=0

# cache_parameters(): Get cache configuration (Python 3.9+)
params = get_user.cache_parameters()
print(params)  # {'maxsize': 100, 'typed': False}

# __wrapped__: Access the original undecorated function
original_func = get_user.__wrapped__
original_func(999)  # Direct call, doesn't use cache
```

### Hashable Parameter Requirements

`lru_cache` requires all parameters to be hashable.

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def process(data):
    return sum(data)

# Hashable types: work correctly
process((1, 2, 3))      # tuple
process(frozenset([1, 2]))  # frozenset
process("hello")        # str
process(42)             # int

# Non-hashable types: will raise error
# process([1, 2, 3])    # TypeError: unhashable type: 'list'
# process({1, 2, 3})    # TypeError: unhashable type: 'set'
# process({'a': 1})     # TypeError: unhashable type: 'dict'

# Solution: convert to hashable types
def process_list(data: list):
    return _process_tuple(tuple(data))

@lru_cache(maxsize=128)
def _process_tuple(data: tuple):
    return sum(data)

# Or use a custom hashable wrapper
class HashableDict:
    def __init__(self, d):
        self._d = d
        self._hash = hash(frozenset(d.items()))

    def __hash__(self):
        return self._hash

    def __eq__(self, other):
        return self._d == other._d
```

## Code Examples

### Example 1: Fibonacci Sequence Optimization

```python
from functools import lru_cache
import time

# Version without caching (exponential time complexity)
def fib_naive(n):
    if n < 2:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)

# Version with caching (linear time complexity)
@lru_cache(maxsize=None)
def fib_cached(n):
    if n < 2:
        return n
    return fib_cached(n - 1) + fib_cached(n - 2)

# Performance comparison
n = 35

start = time.time()
result1 = fib_naive(n)
time1 = time.time() - start
print(f"Without cache: fib({n}) = {result1}, time: {time1:.4f}s")

start = time.time()
result2 = fib_cached(n)
time2 = time.time() - start
print(f"With cache: fib({n}) = {result2}, time: {time2:.6f}s")

print(f"Performance improvement: {time1/time2:.0f}x")
print(f"Cache statistics: {fib_cached.cache_info()}")

# Example output:
# Without cache: fib(35) = 9227465, time: 2.8431s
# With cache: fib(35) = 9227465, time: 0.000032s
# Performance improvement: 88847x
# Cache statistics: CacheInfo(hits=33, misses=36, maxsize=None, currsize=36)
```

### Example 2: API Request Caching

```python
from functools import lru_cache
import time
import json

# Simulated API request
@lru_cache(maxsize=100)
def fetch_user_api(user_id: int) -> dict:
    """Fetch user information from API (with caching)"""
    print(f"[API] Requesting data for user {user_id}...")
    time.sleep(0.5)  # Simulate network latency
    return {
        "id": user_id,
        "name": f"User{user_id}",
        "email": f"user{user_id}@example.com"
    }

# First request (cache miss)
print("=== First request ===")
start = time.time()
user1 = fetch_user_api(101)
print(f"Time: {time.time() - start:.3f}s")
print(f"User: {user1}")

# Second request for same user (cache hit)
print("\n=== Second request for same user ===")
start = time.time()
user1_again = fetch_user_api(101)
print(f"Time: {time.time() - start:.6f}s")  # Nearly instant

# Request different user
print("\n=== Request different user ===")
start = time.time()
user2 = fetch_user_api(102)
print(f"Time: {time.time() - start:.3f}s")

print(f"\nCache statistics: {fetch_user_api.cache_info()}")
```

### Example 3: Configuration File Parsing Cache

```python
from functools import lru_cache
import json
import os

@lru_cache(maxsize=50)
def load_config(config_path: str) -> dict:
    """Load and cache configuration file"""
    print(f"[IO] Reading configuration file: {config_path}")

    # Simulate reading configuration file
    # with open(config_path, 'r') as f:
    #     return json.load(f)

    # Simulated configuration data
    return {
        "app_name": "MyApp",
        "version": "1.0.0",
        "debug": True,
        "database": {
            "host": "localhost",
            "port": 5432
        }
    }

# Usage scenarios
def get_app_name():
    config = load_config("/etc/myapp/config.json")  # First read
    return config["app_name"]

def get_db_host():
    config = load_config("/etc/myapp/config.json")  # Returned from cache
    return config["database"]["host"]

def is_debug_mode():
    config = load_config("/etc/myapp/config.json")  # Returned from cache
    return config["debug"]

print(get_app_name())  # Prints [IO] Reading configuration file
print(get_db_host())   # No print (from cache)
print(is_debug_mode()) # No print (from cache)
print(f"\nCache statistics: {load_config.cache_info()}")
```

### Example 4: Mathematical Computation Cache

```python
from functools import lru_cache
import math

@lru_cache(maxsize=1000)
def binomial_coefficient(n: int, k: int) -> int:
    """Calculate binomial coefficient C(n, k)"""
    if k == 0 or k == n:
        return 1
    if k > n:
        return 0
    return binomial_coefficient(n - 1, k - 1) + binomial_coefficient(n - 1, k)

@lru_cache(maxsize=500)
def catalan_number(n: int) -> int:
    """Calculate the nth Catalan number"""
    if n <= 1:
        return 1
    return binomial_coefficient(2 * n, n) // (n + 1)

# Calculation examples
print(f"C(10, 5) = {binomial_coefficient(10, 5)}")
print(f"C(20, 10) = {binomial_coefficient(20, 10)}")
print(f"Catalan(10) = {catalan_number(10)}")

print(f"\nBinomial coefficient cache: {binomial_coefficient.cache_info()}")
print(f"Catalan number cache: {catalan_number.cache_info()}")
```

### Example 5: Using Cache in Class Methods

```python
from functools import lru_cache, cached_property

class DataAnalyzer:
    def __init__(self, data: tuple):
        self.data = data

    # Method-level cache: note that self is also part of the parameters
    @lru_cache(maxsize=32)
    def percentile(self, p: float) -> float:
        """Calculate percentile"""
        print(f"Calculating {p} percentile...")
        sorted_data = sorted(self.data)
        index = int(len(sorted_data) * p / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    # Use cached_property to cache properties (Python 3.8+)
    @cached_property
    def statistics(self) -> dict:
        """Calculate statistics (computed only once)"""
        print("Calculating statistics...")
        return {
            "mean": sum(self.data) / len(self.data),
            "min": min(self.data),
            "max": max(self.data),
            "count": len(self.data)
        }

# Usage example
analyzer = DataAnalyzer(tuple(range(1, 101)))

# percentile method caching
print(analyzer.percentile(50))  # Calculated
print(analyzer.percentile(50))  # Returned from cache
print(analyzer.percentile(90))  # Calculate new percentile

# cached_property caching
print(analyzer.statistics)  # Calculated
print(analyzer.statistics)  # Returned from cache
```

### Example 6: Cache with Timeout

```python
from functools import lru_cache, wraps
import time

def timed_lru_cache(seconds: float, maxsize: int = 128):
    """LRU cache decorator with timeout"""
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

@timed_lru_cache(seconds=5, maxsize=100)
def get_exchange_rate(currency: str) -> float:
    """Get exchange rate (cached for 5 seconds)"""
    print(f"[API] Querying {currency} exchange rate...")
    rates = {"USD": 7.24, "EUR": 7.89, "GBP": 9.12}
    return rates.get(currency, 1.0)

# Usage example
print(get_exchange_rate("USD"))  # Query
print(get_exchange_rate("USD"))  # From cache
time.sleep(6)
print(get_exchange_rate("USD"))  # Cache expired, re-query
```

## Best Practices

### Choosing Appropriate Cache Size

```python
from functools import lru_cache

# Small parameter space: use smaller maxsize
@lru_cache(maxsize=32)
def get_weekday_name(day: int) -> str:
    """Get weekday name (only 7 possibilities)"""
    names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return names[day % 7]

# Large parameter space but concentrated access: use medium maxsize
@lru_cache(maxsize=256)
def get_user_profile(user_id: int) -> dict:
    """Get user information (hot users will be cached)"""
    return {"id": user_id, "name": f"User{user_id}"}

# Deterministic lookup table: use unlimited cache
@lru_cache(maxsize=None)
def is_prime(n: int) -> bool:
    """Prime number check (result never changes)"""
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True
```

### Monitoring Cache Efficiency

```python
from functools import lru_cache
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@lru_cache(maxsize=100)
def expensive_query(query: str) -> dict:
    """Execute expensive query"""
    return {"result": f"Data for {query}"}

def monitor_cache_health(func, name=""):
    """Monitor cache health status"""
    info = func.cache_info()
    hit_rate = info.hits / (info.hits + info.misses) * 100 if (info.hits + info.misses) > 0 else 0
    usage = info.currsize / info.maxsize * 100 if info.maxsize else 0

    logger.info(f"[{name}] Cache hit rate: {hit_rate:.1f}%")
    logger.info(f"[{name}] Cache usage: {usage:.1f}%")
    logger.info(f"[{name}] Hits/Misses: {info.hits}/{info.misses}")

    # Warning conditions
    if hit_rate < 50 and (info.hits + info.misses) > 100:
        logger.warning(f"[{name}] Cache hit rate too low, consider increasing maxsize")
    if usage > 90:
        logger.warning(f"[{name}] Cache near capacity, consider increasing maxsize or clearing")

# Execute some queries
for i in range(150):
    expensive_query(f"query_{i % 50}")  # Simulate hot queries

monitor_cache_health(expensive_query, "expensive_query")
```

### Periodic Cache Cleanup

```python
from functools import lru_cache
import atexit
import threading
import time

@lru_cache(maxsize=1000)
def cached_computation(x: int) -> int:
    return x ** 2

# Method 1: Clean up on program exit
atexit.register(cached_computation.cache_clear)

# Method 2: Periodic cleanup
def periodic_cache_cleanup(func, interval_seconds=3600):
    """Background thread for periodic cache cleanup"""
    def cleanup():
        while True:
            time.sleep(interval_seconds)
            func.cache_clear()
            print(f"[Cleanup] Cleared cache for {func.__name__}")

    thread = threading.Thread(target=cleanup, daemon=True)
    thread.start()

# Method 3: Usage-based cleanup
def smart_cleanup(func, threshold=0.8):
    """Clean up when cache usage exceeds threshold"""
    info = func.cache_info()
    if info.maxsize and info.currsize / info.maxsize > threshold:
        func.cache_clear()
        print(f"[Cleanup] {func.__name__} cache full, cleared")
```

### Handling Non-Hashable Parameters

```python
from functools import lru_cache
import json

# Method 1: Convert using tuple/frozenset
def process_items(items: list) -> int:
    """Process list (wrapper function)"""
    return _process_items_cached(tuple(items))

@lru_cache(maxsize=128)
def _process_items_cached(items: tuple) -> int:
    """Actual processing logic (cached)"""
    return sum(items)

# Method 2: Use JSON serialization as key
def make_hashable(obj):
    """Convert object to hashable representation"""
    return json.dumps(obj, sort_keys=True)

def process_dict(data: dict) -> str:
    """Process dictionary"""
    return _process_dict_cached(make_hashable(data))

@lru_cache(maxsize=128)
def _process_dict_cached(data_json: str) -> str:
    """Actual processing logic"""
    data = json.loads(data_json)
    return f"Processed: {data}"

# Usage example
print(process_items([1, 2, 3, 4, 5]))
print(process_dict({"name": "Alice", "age": 30}))
```

### Thread Safety Considerations

```python
from functools import lru_cache
import threading

# lru_cache itself is thread-safe
@lru_cache(maxsize=100)
def thread_safe_computation(x: int) -> int:
    """Can be safely used in multi-threaded environments"""
    return x ** 2

# However, cache_clear() may cause issues with concurrent calls
# It's recommended to use a lock when clearing cache
cache_lock = threading.Lock()

def safe_cache_clear(func):
    """Thread-safe cache clearing"""
    with cache_lock:
        func.cache_clear()

# Multi-threaded usage example
def worker(thread_id: int):
    for i in range(100):
        result = thread_safe_computation(i % 20)
        # No additional lock needed, lru_cache handles it internally

threads = [threading.Thread(target=worker, args=(i,)) for i in range(5)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Cache statistics: {thread_safe_computation.cache_info()}")
```

## Common Pitfalls

### Pitfall 1: Caching Mutable Objects

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_default_list() -> list:
    """Return a list"""
    return [1, 2, 3]

# Problem: Returns a reference to the same object
list1 = get_default_list()
list1.append(4)  # Modified the cached object!

list2 = get_default_list()
print(list2)  # [1, 2, 3, 4] - Unexpectedly modified!

# Solution: Return a copy
@lru_cache(maxsize=128)
def get_default_list_safe() -> list:
    return [1, 2, 3]

def get_list():
    return get_default_list_safe().copy()  # Return a copy
```

### Pitfall 2: Instance Issues in Class Methods

```python
from functools import lru_cache

class Calculator:
    def __init__(self, multiplier):
        self.multiplier = multiplier

    # Problem: self is also part of the cache key
    @lru_cache(maxsize=128)
    def compute(self, x):
        return x * self.multiplier

calc1 = Calculator(2)
calc2 = Calculator(3)

# calc1 and calc2 are different objects, they don't share cache
print(calc1.compute(10))  # 20, cached
print(calc2.compute(10))  # 30, new computation

# Bigger problem: calc1 cannot be garbage collected because lru_cache holds a reference!
# Solution: Use weakref or avoid using lru_cache on instance methods
```

### Pitfall 3: Parameter Order Affects Cache

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def add(a, b):
    print(f"Computing {a} + {b}")
    return a + b

# Positional args vs keyword args = different cache keys
add(1, 2)       # Computed
add(1, 2)       # Cache hit
add(a=1, b=2)   # Recomputed! (different key)
add(b=2, a=1)   # Recomputed again! (different key)

print(add.cache_info())  # misses=3, even though results are the same
```

### Pitfall 4: Memory Leaks from Caching

```python
from functools import lru_cache
import sys

@lru_cache(maxsize=None)  # Unlimited cache
def process_large_data(data_id: int) -> bytes:
    """Process large data"""
    return b"x" * (1024 * 1024)  # 1MB

# Problem: Unlimited cache causes continuous memory growth
for i in range(1000):
    process_large_data(i)
    if i % 100 == 0:
        print(f"Cache size: {process_large_data.cache_info().currsize}")
        # Each cache entry is 1MB, 1000 entries = 1GB memory!

# Solutions:
# - Set reasonable maxsize
# - Periodically clear cache
# - Use external cache (like Redis) for large objects
```

### Pitfall 5: Cache Clearing in Recursive Functions

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def recursive_fib(n):
    if n < 2:
        return n
    return recursive_fib(n - 1) + recursive_fib(n - 2)

# Calculate fib(100)
result = recursive_fib(100)

# If you clear cache and recalculate, intermediate results are also lost
recursive_fib.cache_clear()

# Recalculation starts from scratch
result2 = recursive_fib(100)  # Needs to recalculate all intermediate values
```

## Performance Considerations

### Cache Overhead Analysis

```python
from functools import lru_cache
import time

def measure_overhead():
    """Measure caching overhead"""

    # Simple function (cache overhead may exceed computation overhead)
    def simple_add(a, b):
        return a + b

    @lru_cache(maxsize=128)
    def cached_add(a, b):
        return a + b

    # Complex function (cache provides significant benefits)
    def complex_compute(n):
        total = 0
        for i in range(n):
            total += i ** 2
        return total

    @lru_cache(maxsize=128)
    def cached_complex_compute(n):
        total = 0
        for i in range(n):
            total += i ** 2
        return total

    # Test simple function
    iterations = 100000

    start = time.time()
    for i in range(iterations):
        simple_add(1, 2)
    print(f"Simple function (no cache): {time.time() - start:.4f}s")

    start = time.time()
    for i in range(iterations):
        cached_add(1, 2)
    print(f"Simple function (with cache): {time.time() - start:.4f}s")

    # Test complex function
    start = time.time()
    for i in range(1000):
        complex_compute(1000)
    print(f"Complex function (no cache): {time.time() - start:.4f}s")

    start = time.time()
    for i in range(1000):
        cached_complex_compute(1000)
    print(f"Complex function (with cache): {time.time() - start:.4f}s")

measure_overhead()
```

### When to Use Caching

```python
"""
Scenarios suitable for caching:
1. Expensive computations (>1ms)
2. Same inputs produce same outputs (pure functions)
3. Function is called repeatedly
4. Limited parameter space or has hot spots

Scenarios not suitable for caching:
1. Very simple computations (basic arithmetic)
2. Results depend on external state (time, random numbers, external data)
3. Every call has different parameters
4. Return values are large and need frequent updates
"""

from functools import lru_cache
import time
import random

# Suitable for caching: computation intensive
@lru_cache(maxsize=100)
def compute_factorial(n: int) -> int:
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# Suitable for caching: I/O intensive
@lru_cache(maxsize=50)
def fetch_config(key: str) -> dict:
    # Simulate file read or network request
    time.sleep(0.1)
    return {"key": key, "value": "some_value"}

# Not suitable for caching: result depends on time
def get_current_timestamp():
    return time.time()  # Different every time

# Not suitable for caching: result depends on random numbers
def generate_random_id():
    return random.randint(1, 10000)

# Not suitable for caching: parameters are always different
def log_request(request_id: str, timestamp: float):
    return f"Logged: {request_id} at {timestamp}"
```

### Memory vs Time Trade-off

```python
from functools import lru_cache
import sys

@lru_cache(maxsize=None)
def fib_unlimited(n):
    if n < 2:
        return n
    return fib_unlimited(n - 1) + fib_unlimited(n - 2)

@lru_cache(maxsize=100)
def fib_limited(n):
    if n < 2:
        return n
    return fib_limited(n - 1) + fib_limited(n - 2)

# Calculate large numbers
fib_unlimited(1000)
fib_limited(1000)

print(f"Unlimited cache: {fib_unlimited.cache_info()}")
print(f"Limited cache: {fib_limited.cache_info()}")

# Unlimited cache: more memory, but all subsequent values can be quickly accessed
# Limited cache: fixed memory, but may need to recalculate some values

# Estimating memory usage
# Each cache entry occupies approximately: key size + value size + linked list pointers (about 50-100 bytes)
```

## Practical Scenarios

### Scenario 1: Web Application Database Query Caching

```python
from functools import lru_cache
from typing import Optional
import time

# Simulated database
class Database:
    @staticmethod
    def query_user(user_id: int) -> Optional[dict]:
        print(f"[DB] Querying user {user_id}")
        time.sleep(0.1)  # Simulate database latency
        if user_id > 0:
            return {"id": user_id, "name": f"User{user_id}", "email": f"user{user_id}@example.com"}
        return None

    @staticmethod
    def query_posts(user_id: int, limit: int = 10) -> list:
        print(f"[DB] Querying posts for user {user_id} (limit {limit})")
        time.sleep(0.1)
        return [{"id": i, "title": f"Post {i}", "author_id": user_id} for i in range(limit)]

# Data access layer with caching
class UserRepository:
    @staticmethod
    @lru_cache(maxsize=1000)
    def get_user(user_id: int) -> Optional[dict]:
        """Get user information (cache 1000 users)"""
        return Database.query_user(user_id)

    @staticmethod
    @lru_cache(maxsize=500)
    def get_user_posts(user_id: int, limit: int = 10) -> tuple:
        """Get user posts (cache 500 queries)"""
        # Return tuple because list is not hashable, and to prevent external modification
        return tuple(Database.query_posts(user_id, limit))

    @classmethod
    def invalidate_user_cache(cls, user_id: int):
        """Clear related cache when user data is updated"""
        # lru_cache doesn't support clearing individual keys, only clearing all
        cls.get_user.cache_clear()
        cls.get_user_posts.cache_clear()
        print(f"[Cache] Cleared cache related to user {user_id}")

# Usage example
repo = UserRepository()

# First request (cache miss)
user = repo.get_user(1)
posts = repo.get_user_posts(1, 5)

# Second request (cache hit)
user = repo.get_user(1)      # Won't print [DB]
posts = repo.get_user_posts(1, 5)  # Won't print [DB]

# Simulate clearing cache after user update
repo.invalidate_user_cache(1)
user = repo.get_user(1)  # Re-query
```

### Scenario 2: Recursive Algorithm Optimization

```python
from functools import lru_cache

# Dynamic programming: Longest Common Subsequence
@lru_cache(maxsize=None)
def lcs_length(s1: str, s2: str) -> int:
    """Calculate the length of the longest common subsequence of two strings"""
    if not s1 or not s2:
        return 0
    if s1[-1] == s2[-1]:
        return 1 + lcs_length(s1[:-1], s2[:-1])
    return max(lcs_length(s1[:-1], s2), lcs_length(s1, s2[:-1]))

# Backtracking: N-Queens Problem
@lru_cache(maxsize=None)
def count_n_queens(n: int, row: int = 0, cols: int = 0, diag1: int = 0, diag2: int = 0) -> int:
    """Count the number of solutions for N-Queens problem"""
    if row == n:
        return 1

    count = 0
    available = ((1 << n) - 1) & ~(cols | diag1 | diag2)

    while available:
        pos = available & (-available)  # Get lowest set bit
        available &= available - 1      # Remove lowest set bit
        count += count_n_queens(
            n, row + 1,
            cols | pos,
            (diag1 | pos) << 1,
            (diag2 | pos) >> 1
        )

    return count

# Graph theory: Shortest Path (Floyd-Warshall style)
@lru_cache(maxsize=None)
def shortest_path(graph_tuple: tuple, start: int, end: int, visited: frozenset = frozenset()) -> float:
    """Calculate shortest path (cache-optimized DFS)"""
    if start == end:
        return 0
    if start in visited:
        return float('inf')

    # graph_tuple: ((from, to, weight), ...)
    graph = {(f, t): w for f, t, w in graph_tuple}

    min_dist = float('inf')
    new_visited = visited | {start}

    for (f, t), w in graph.items():
        if f == start and t not in visited:
            dist = w + shortest_path(graph_tuple, t, end, new_visited)
            min_dist = min(min_dist, dist)

    return min_dist

# Usage examples
print(f"LCS('ABCDGH', 'AEDFHR') = {lcs_length('ABCDGH', 'AEDFHR')}")
print(f"8-Queens solution count: {count_n_queens(8)}")
```

### Scenario 3: Scientific Computing Cache

```python
from functools import lru_cache
import math

class MathLibrary:
    """Math library with cache optimization"""

    @staticmethod
    @lru_cache(maxsize=10000)
    def factorial(n: int) -> int:
        """Factorial"""
        if n <= 1:
            return 1
        return n * MathLibrary.factorial(n - 1)

    @staticmethod
    @lru_cache(maxsize=10000)
    def binomial(n: int, k: int) -> int:
        """Binomial coefficient C(n, k)"""
        if k < 0 or k > n:
            return 0
        if k == 0 or k == n:
            return 1
        # Use Pascal's triangle recurrence
        return MathLibrary.binomial(n - 1, k - 1) + MathLibrary.binomial(n - 1, k)

    @staticmethod
    @lru_cache(maxsize=1000)
    def stirling_second(n: int, k: int) -> int:
        """Stirling number of the second kind S(n, k)"""
        if n == 0 and k == 0:
            return 1
        if n == 0 or k == 0:
            return 0
        return k * MathLibrary.stirling_second(n - 1, k) + MathLibrary.stirling_second(n - 1, k - 1)

    @staticmethod
    @lru_cache(maxsize=1000)
    def catalan(n: int) -> int:
        """Catalan number"""
        if n <= 1:
            return 1
        return MathLibrary.binomial(2 * n, n) // (n + 1)

    @staticmethod
    @lru_cache(maxsize=5000)
    def partition(n: int, k: int = None) -> int:
        """Integer partition number P(n) or P(n, k)"""
        if k is None:
            k = n
        if n == 0:
            return 1
        if n < 0 or k <= 0:
            return 0
        return MathLibrary.partition(n, k - 1) + MathLibrary.partition(n - k, k)

# Usage examples
lib = MathLibrary()

print(f"100! = {lib.factorial(100)}")
print(f"C(50, 25) = {lib.binomial(50, 25)}")
print(f"S(10, 5) = {lib.stirling_second(10, 5)}")
print(f"Catalan(15) = {lib.catalan(15)}")
print(f"P(50) = {lib.partition(50)}")

# View cache statistics for each function
for name in ['factorial', 'binomial', 'stirling_second', 'catalan', 'partition']:
    func = getattr(lib, name)
    print(f"{name}: {func.cache_info()}")
```

## Interview Key Points

### Common Interview Questions

**Q1: How does lru_cache work?**

```
A: lru_cache is based on the LRU (Least Recently Used) cache strategy, internally using:
   1. Hash table: stores cache key-value pairs, achieving O(1) lookup
   2. Doubly linked list: maintains access order, most recently accessed at tail, least recently accessed at head
   When cache is full, it removes the element at the head (least recently used).
```

**Q2: What's the difference between lru_cache and cache?**

```
A:
   - @cache was introduced in Python 3.9, equivalent to @lru_cache(maxsize=None)
   - @lru_cache can set maxsize to limit cache size
   - @cache is more concise, suitable for scenarios where cache size limit isn't needed
   - Memory-sensitive scenarios should use lru_cache with a reasonable maxsize
```

**Q3: What are the limitations of using lru_cache?**

```
A: Main limitations:
   1. Parameters must be hashable (cannot be list, dict, set)
   2. When used on class instance methods, self is also part of the cache key, which may cause memory leaks
   3. Cache stores references to return values; if returning mutable objects, they may be modified externally
   4. Doesn't support clearing individual cache keys, only cache_clear() to clear all
```

**Q4: How to handle non-hashable parameters?**

```python
# Method 1: Convert to hashable type
def process(items: list):
    return _process_cached(tuple(items))

@lru_cache
def _process_cached(items: tuple):
    return sum(items)

# Method 2: Use JSON serialization
import json

def process_dict(d: dict):
    return _process_cached(json.dumps(d, sort_keys=True))

@lru_cache
def _process_cached(d_json: str):
    return json.loads(d_json)
```

**Q5: Is lru_cache thread-safe?**

```
A: Yes, the implementation of lru_cache is thread-safe and can be used in multi-threaded environments.
   However, cache_clear() may need additional synchronization when called concurrently.
   If you need to ensure atomicity of clearing operations, it's recommended to use a lock.
```

### Coding Interview Example

```python
"""
Interview question: Implement an LRU cache with timeout
"""
from functools import lru_cache, wraps
import time

def timed_cache(seconds: float, maxsize: int = 128):
    """Cache decorator with timeout"""
    def decorator(func):
        # Use lru_cache as underlying cache
        cached_func = lru_cache(maxsize=maxsize)(func)
        # Record expiration time
        cached_func.expiration = time.time() + seconds

        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check if expired
            if time.time() > cached_func.expiration:
                cached_func.cache_clear()
                cached_func.expiration = time.time() + seconds
            return cached_func(*args, **kwargs)

        # Expose cache management methods
        wrapper.cache_info = cached_func.cache_info
        wrapper.cache_clear = cached_func.cache_clear

        return wrapper
    return decorator

# Test
@timed_cache(seconds=2, maxsize=100)
def slow_function(x):
    print(f"Computing {x}")
    return x ** 2

print(slow_function(5))  # Computed
print(slow_function(5))  # From cache
time.sleep(3)
print(slow_function(5))  # Expired, recomputed
```

## Further Reading

### Official Documentation

- [functools module documentation](https://docs.python.org/3/library/functools.html)
- [lru_cache source code](https://github.com/python/cpython/blob/main/Lib/functools.py)
- [PEP 3111 - Simple lru_cache decorator](https://peps.python.org/pep-3111/)

### Related Tools

- **cachetools**: More cache strategies (TTL, LFU, RR, etc.)
- **aiocache**: Async cache library
- **joblib**: Large data caching with persistence support
- **diskcache**: Disk-based cache
- **Redis/Memcached**: Distributed caching

### Advanced Topics

- Custom cache decorators
- Distributed cache strategies
- Cache invalidation mechanisms
- Cache warming
- Multi-level cache architecture

### Recommended Reading

- "Fluent Python" Chapter 7: Function Decorators and Closures
- "Python Cookbook" Section 9.4: Defining a Decorator with Optional Arguments
- "High Performance Python" Chapter 11: Using Caching to Reduce Computation
