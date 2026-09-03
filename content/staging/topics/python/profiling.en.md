---
title: Python 性能分析
description: 掌握 Python 性能分析工具：cProfile、timeit、pstats、line_profiler、memory_profiler、py-spy 与 snakeviz 可视化
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - 性能分析
  - cProfile
  - timeit
  - 优化
  - 调试
status: imported
origin: old/src/content/docs/python/profiling.en.md
divergence: 0.209
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 测试与调试
  order: 25
  lastUpdated: 2026-01-07
---

Performance profiling is a key step in optimizing Python programs. Through profiling, we can identify performance bottlenecks in code, find the most time-consuming functions and lines of code, and then optimize them in a targeted manner. Python provides a variety of built-in and third-party profiling tools. This article will provide an in-depth introduction to the usage and best practices of these tools.

## Concept Explanation

### What is Performance Profiling

Performance profiling is a dynamic program analysis technique used to measure a program's time complexity, space complexity, and the frequency and duration of specific instructions or function calls. Through profiling, developers can:

- **Identify performance bottlenecks**: Find the most time-consuming parts of a program
- **Optimize resource usage**: Discover memory leaks and unnecessary resource consumption
- **Validate optimization results**: Quantitatively evaluate performance differences before and after optimization
- **Understand program behavior**: Gain deep insight into program execution flow

### Types of Performance Profiling

```
+─────────────────────────────────────────────────────────+
│                 Types of Profiling                       │
+─────────────────────+───────────────────────────────────+
│  Deterministic      │  Statistical                       │
│  Profiling          │  Profiling                         │
+─────────────────────+───────────────────────────────────+
│  - Monitors all     │  - Periodically samples program    │
│    function calls   │    state                           │
│  - Precise but high │  - Low overhead but less precise   │
│    overhead         │                                    │
│  - cProfile,        │  - py-spy, pyinstrument            │
│    profile          │                                    │
+─────────────────────+───────────────────────────────────+
```

### Python Profiling Tool Ecosystem

| Tool | Type | Purpose | Overhead |
|------|------|---------|----------|
| `timeit` | Benchmarking | Measure execution time of small code snippets | Very low |
| `cProfile` | Deterministic | Function-level CPU profiling | Medium |
| `profile` | Deterministic | Pure Python implementation of profiler | Higher |
| `pstats` | Result processing | Analyze and display profiler results | None |
| `line_profiler` | Line-level | Line-by-line code profiling | Higher |
| `memory_profiler` | Memory profiling | Monitor memory usage | Higher |
| `py-spy` | Sampling | Low-overhead profiling for production | Very low |
| `snakeviz` | Visualization | Visualize cProfile results | None |

## Core Principles

### How cProfile Works

cProfile is the deterministic profiler in Python's standard library, implemented in C to reduce overhead.

```
+─────────────────────────────────────────────────────────+
│               cProfile Workflow                          │
+─────────────────────────────────────────────────────────+
│                                                         │
│  +──────────+    +──────────+    +──────────+          │
│  │ Function │───>│   Timer   │───>│  Record   │          │
│  │   Call   │    │           │    │   Data    │          │
│  +──────────+    +──────────+    +──────────+          │
│        │                              │                 │
│        v                              v                 │
│  +──────────+                  +──────────+            │
│  │ Function │<────────────────│ Cumulative│            │
│  │  Return  │                  │   Stats   │            │
│  +──────────+                  +──────────+            │
│                                                         │
+─────────────────────────────────────────────────────────+
```

cProfile monitors the following for each function:
- **ncalls**: Number of calls
- **tottime**: Time spent in the function itself (excluding subfunctions)
- **cumtime**: Cumulative time (including subfunctions)
- **percall**: Average time per call

### How timeit Works

The timeit module obtains accurate execution time measurements by running code multiple times:

```python
# Simplified core logic of timeit
import gc
import time

def timeit_logic(stmt, setup, number):
    """
    1. Execute setup code (only once)
    2. Execute stmt code 'number' times
    3. Measure total time and return
    """
    # Disable garbage collection to reduce interference
    gc.disable()
    try:
        # Execute setup code
        exec(setup)
        # Record start time
        start = time.perf_counter()
        # Execute 'number' times
        for _ in range(number):
            exec(stmt)
        # Return total time
        return time.perf_counter() - start
    finally:
        gc.enable()
```

### How Sampling Profilers Work

Sampling profilers like py-spy use a different approach:

```
+─────────────────────────────────────────────────────────+
│           How Sampling Profilers Work                    │
+─────────────────────────────────────────────────────────+
│                                                         │
│  Program execution:  ════════════════════════════════   │
│                                                         │
│  Sample points:       |     |     |     |     |     |   │
│                   Sample1 Sample2 Sample3 Sample4 ...   │
│                                                         │
│  Statistics: Function A appears in 60% of samples       │
│              -> Takes 60% of the time                   │
│                                                         │
+─────────────────────────────────────────────────────────+
```

## Key Points

### timeit Module

timeit is the standard method for measuring execution time of small code snippets.

```python
import timeit

# Method 1: Using strings
time_result = timeit.timeit(
    stmt='"-".join(str(n) for n in range(100))',
    number=10000
)
print(f"Execution time: {time_result:.4f} seconds")

# Method 2: Using functions
def test_function():
    return "-".join(str(n) for n in range(100))

time_result = timeit.timeit(test_function, number=10000)
print(f"Execution time: {time_result:.4f} seconds")

# Method 3: With setup code
time_result = timeit.timeit(
    stmt='sorted(data)',
    setup='import random; data = [random.random() for _ in range(1000)]',
    number=1000
)
print(f"Sort time: {time_result:.4f} seconds")
```

**Command line usage:**

```bash
# Basic usage
python -m timeit '"-".join(str(n) for n in range(100))'

# With setup code
python -m timeit -s 'import random; data = [random.random() for _ in range(1000)]' 'sorted(data)'

# Specify number of repetitions
python -m timeit -n 10000 -r 5 'sum(range(100))'
```

### cProfile Module

cProfile is the most commonly used profiler in Python's standard library.

```python
import cProfile
import pstats
from io import StringIO

def fibonacci(n):
    """Calculate Fibonacci sequence"""
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def factorial(n):
    """Calculate factorial"""
    if n <= 1:
        return 1
    return n * factorial(n-1)

def main():
    """Main function"""
    result1 = fibonacci(25)
    result2 = factorial(100)
    return result1, result2

# Method 1: Direct execution
cProfile.run('main()')

# Method 2: Save results to file
cProfile.run('main()', 'profile_output.prof')

# Method 3: Use Profile object for more control
profiler = cProfile.Profile()
profiler.enable()

main()

profiler.disable()

# Print results
profiler.print_stats(sort='cumulative')

# Save results
profiler.dump_stats('profile_output.prof')
```

**Command line usage:**

```bash
# Profile entire script
python -m cProfile my_script.py

# Save results to file
python -m cProfile -o output.prof my_script.py

# Sort by cumulative time
python -m cProfile -s cumulative my_script.py
```

### pstats Module

pstats is used to analyze and process cProfile output results.

```python
import pstats
from pstats import SortKey

# Load profiling results from file
stats = pstats.Stats('profile_output.prof')

# Strip file paths to make output more concise
stats.strip_dirs()

# Sort and print by different methods
# Sort by cumulative time
stats.sort_stats(SortKey.CUMULATIVE)
stats.print_stats(10)  # Print top 10

# Sort by number of calls
stats.sort_stats(SortKey.CALLS)
stats.print_stats(10)

# Sort by function's own execution time
stats.sort_stats(SortKey.TIME)
stats.print_stats(10)

# Show statistics for specific function only
stats.print_stats('fibonacci')

# Show caller information
stats.print_callers('fibonacci')

# Show callee information
stats.print_callees('main')

# Merge multiple profiling results
stats1 = pstats.Stats('profile1.prof')
stats2 = pstats.Stats('profile2.prof')
stats1.add(stats2)
stats1.print_stats()
```

### profile Module

profile is a pure Python implementation of a profiler, with higher overhead than cProfile but easier to extend.

```python
import profile

def slow_function():
    total = 0
    for i in range(100000):
        total += i ** 2
    return total

# Usage is the same as cProfile
profile.run('slow_function()')
```

### line_profiler (Third-party Library)

line_profiler provides line-by-line profiling.

```bash
# Installation
pip install line_profiler
```

```python
# Use decorator to mark functions to profile
from line_profiler import profile

@profile
def process_data(data):
    result = []
    for item in data:
        # This line will be analyzed in detail
        processed = item ** 2
        result.append(processed)

    # This line will also be analyzed
    total = sum(result)
    return total

# Run function
data = list(range(10000))
process_data(data)
```

**Command line usage:**

```bash
# Profile script
kernprof -l -v my_script.py

# View previous profiling results
python -m line_profiler my_script.py.lprof
```

**Manual use of LineProfiler:**

```python
from line_profiler import LineProfiler

def compute_sum(n):
    total = 0
    for i in range(n):
        total += i
    return total

def compute_product(n):
    product = 1
    for i in range(1, n + 1):
        product *= i
    return product

# Create profiler
lp = LineProfiler()

# Add functions to profile
lp.add_function(compute_sum)
lp.add_function(compute_product)

# Wrap main function
lp_wrapper = lp(lambda: (compute_sum(1000), compute_product(100)))
lp_wrapper()

# Print results
lp.print_stats()
```

### memory_profiler (Third-party Library)

memory_profiler is used to analyze memory usage.

```bash
# Installation
pip install memory_profiler
```

```python
from memory_profiler import profile

@profile
def create_large_list():
    """Create large list and observe memory changes"""
    # Create list with 1 million integers
    large_list = [i for i in range(1000000)]

    # Create another list
    another_list = [x * 2 for x in large_list]

    # Delete first list
    del large_list

    return another_list

result = create_large_list()
```

**Command line usage:**

```bash
# Run memory profiling
python -m memory_profiler my_script.py

# Generate memory usage chart
mprof run my_script.py
mprof plot
```

**Monitor memory usage:**

```python
from memory_profiler import memory_usage
import time

def memory_intensive_task():
    """Memory-intensive task"""
    data = []
    for _ in range(10):
        data.append([0] * 1000000)
        time.sleep(0.1)
    return len(data)

# Monitor memory usage
mem_usage = memory_usage(
    (memory_intensive_task,),
    interval=0.1,
    timeout=10
)

print(f"Peak memory usage: {max(mem_usage):.2f} MiB")
print(f"Memory change: {mem_usage[-1] - mem_usage[0]:.2f} MiB")
```

### py-spy (Third-party Library)

py-spy is a sampling profiler with very low overhead, suitable for production environments.

```bash
# Installation
pip install py-spy
```

**Command line usage:**

```bash
# Profile a running process
py-spy top --pid 12345

# Record profiling data
py-spy record -o profile.svg --pid 12345

# Profile a script
py-spy record -o profile.svg -- python my_script.py

# Generate flame graph
py-spy record --format speedscope -o profile.json -- python my_script.py
```

### snakeviz (Visualization Tool)

snakeviz provides interactive visualization of cProfile results.

```bash
# Installation
pip install snakeviz
```

```bash
# First generate profile data
python -m cProfile -o output.prof my_script.py

# Visualize with snakeviz
snakeviz output.prof
```

This opens an interactive interface in the browser showing:
- **Sunburst chart**: Shows hierarchical structure of function calls
- **Icicle chart**: Another visualization method
- **Detailed statistics table**: Sortable function call statistics

## Code Examples

### Complete Performance Profiling Example

```python
"""
performance_analysis.py
Demonstrates various profiling techniques
"""

import cProfile
import pstats
import timeit
from io import StringIO
from functools import lru_cache

# ============================================================
# Example functions: Algorithms of different complexity
# ============================================================

def bubble_sort(arr):
    """Bubble sort O(n^2)"""
    arr = arr.copy()
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(arr):
    """Quick sort O(n log n)"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

def fibonacci_recursive(n):
    """Recursive Fibonacci (no cache)"""
    if n < 2:
        return n
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

@lru_cache(maxsize=None)
def fibonacci_cached(n):
    """Fibonacci with cache"""
    if n < 2:
        return n
    return fibonacci_cached(n - 1) + fibonacci_cached(n - 2)

def fibonacci_iterative(n):
    """Iterative Fibonacci"""
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

# ============================================================
# Compare performance using timeit
# ============================================================

def compare_with_timeit():
    """Compare performance of different implementations using timeit"""
    print("=" * 60)
    print("Comparing Algorithm Performance with timeit")
    print("=" * 60)

    # Compare sorting algorithms
    print("\nSorting Algorithm Comparison (1000 elements):")
    setup = "import random; data = [random.random() for _ in range(1000)]"

    bubble_time = timeit.timeit(
        "bubble_sort(data)",
        setup=setup + "; from __main__ import bubble_sort",
        number=10
    )

    quick_time = timeit.timeit(
        "quick_sort(data)",
        setup=setup + "; from __main__ import quick_sort",
        number=10
    )

    builtin_time = timeit.timeit(
        "sorted(data)",
        setup=setup,
        number=10
    )

    print(f"  Bubble sort: {bubble_time:.4f} seconds (10 runs)")
    print(f"  Quick sort: {quick_time:.4f} seconds (10 runs)")
    print(f"  Built-in sort: {builtin_time:.4f} seconds (10 runs)")

    # Compare Fibonacci implementations
    print("\nFibonacci Implementation Comparison (n=30):")

    recursive_time = timeit.timeit(
        "fibonacci_recursive(30)",
        setup="from __main__ import fibonacci_recursive",
        number=1
    )

    # Clear cache before testing
    fibonacci_cached.cache_clear()
    cached_time = timeit.timeit(
        "fibonacci_cached(30)",
        setup="from __main__ import fibonacci_cached",
        number=1
    )

    iterative_time = timeit.timeit(
        "fibonacci_iterative(30)",
        setup="from __main__ import fibonacci_iterative",
        number=1000
    )

    print(f"  Recursive version: {recursive_time:.4f} seconds (1 run)")
    print(f"  Cached version: {cached_time:.6f} seconds (1 run)")
    print(f"  Iterative version: {iterative_time:.6f} seconds (1000 runs)")

# ============================================================
# Detailed profiling with cProfile
# ============================================================

def profile_sorting():
    """Profile sorting functions"""
    import random
    data = [random.random() for _ in range(1000)]

    # Perform sorting
    bubble_sort(data)
    quick_sort(data)
    sorted(data)

def analyze_with_cprofile():
    """Detailed profiling with cProfile"""
    print("\n" + "=" * 60)
    print("Detailed Analysis with cProfile")
    print("=" * 60)

    # Create profiler
    profiler = cProfile.Profile()

    # Run profiling
    profiler.enable()
    profile_sorting()
    profiler.disable()

    # Create statistics object
    stream = StringIO()
    stats = pstats.Stats(profiler, stream=stream)
    stats.strip_dirs()
    stats.sort_stats(pstats.SortKey.CUMULATIVE)
    stats.print_stats(20)

    print(stream.getvalue())

# ============================================================
# Custom profiling decorator
# ============================================================

def profile_decorator(func):
    """Profiling decorator"""
    from functools import wraps

    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()

        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()

        # Print statistics
        stream = StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.strip_dirs()
        stats.sort_stats(pstats.SortKey.CUMULATIVE)
        stats.print_stats(10)
        print(f"\nProfiling analysis for function {func.__name__}:")
        print(stream.getvalue())

        return result

    return wrapper

def timer_decorator(func):
    """Simple timing decorator"""
    from functools import wraps
    import time

    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} execution time: {end - start:.6f} seconds")
        return result

    return wrapper

# Using decorators
@timer_decorator
def compute_intensive_task():
    """Compute-intensive task"""
    result = 0
    for i in range(100000):
        result += i ** 2 % 1000
    return result

# ============================================================
# Context manager form of profiling
# ============================================================

class Profiler:
    """Profiling context manager"""

    def __init__(self, name="Profile"):
        self.name = name
        self.profiler = cProfile.Profile()

    def __enter__(self):
        self.profiler.enable()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.profiler.disable()

        stream = StringIO()
        stats = pstats.Stats(self.profiler, stream=stream)
        stats.strip_dirs()
        stats.sort_stats(pstats.SortKey.CUMULATIVE)
        stats.print_stats(10)

        print(f"\n{self.name} profiling results:")
        print(stream.getvalue())

        return False

class Timer:
    """Timing context manager"""

    def __init__(self, name="Timer"):
        self.name = name
        self.start = None
        self.end = None

    def __enter__(self):
        import time
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.end = time.perf_counter()
        print(f"{self.name}: {self.end - self.start:.6f} seconds")
        return False

    @property
    def elapsed(self):
        if self.end is None:
            import time
            return time.perf_counter() - self.start
        return self.end - self.start

# Using context managers
def demonstrate_context_managers():
    """Demonstrate use of context managers"""
    print("\n" + "=" * 60)
    print("Profiling with Context Managers")
    print("=" * 60)

    # Using Timer
    with Timer("List comprehension"):
        result = [i ** 2 for i in range(100000)]

    # Using Profiler
    with Profiler("Fibonacci calculation"):
        fibonacci_cached.cache_clear()
        fibonacci_cached(100)

# ============================================================
# Memory usage analysis
# ============================================================

def analyze_memory_usage():
    """Analyze memory usage (requires memory_profiler)"""
    import sys

    print("\n" + "=" * 60)
    print("Memory Usage Analysis")
    print("=" * 60)

    # Use sys.getsizeof to get object sizes
    objects = {
        "Empty list": [],
        "List with 1000 integers": list(range(1000)),
        "Empty dict": {},
        "Dict with 1000 items": {i: i for i in range(1000)},
        "Empty set": set(),
        "Set with 1000 elements": set(range(1000)),
        "Empty string": "",
        "String with 1000 characters": "a" * 1000,
    }

    for name, obj in objects.items():
        size = sys.getsizeof(obj)
        print(f"  {name}: {size:,} bytes")

# ============================================================
# Compare performance of different methods
# ============================================================

def compare_list_operations():
    """Compare performance of different list operations"""
    print("\n" + "=" * 60)
    print("List Operations Performance Comparison")
    print("=" * 60)

    n = 100000

    # List comprehension vs loop
    with Timer("List comprehension"):
        result1 = [i ** 2 for i in range(n)]

    with Timer("Traditional loop"):
        result2 = []
        for i in range(n):
            result2.append(i ** 2)

    with Timer("map function"):
        result3 = list(map(lambda x: x ** 2, range(n)))

    # String concatenation comparison
    print("\nString Concatenation Comparison (10000 iterations):")

    with Timer("join method"):
        result = "".join(str(i) for i in range(10000))

    with Timer("+ operator"):
        result = ""
        for i in range(10000):
            result += str(i)

# ============================================================
# Main program
# ============================================================

if __name__ == "__main__":
    # Run all demonstrations
    compare_with_timeit()
    analyze_with_cprofile()

    # Test decorators
    print("\n" + "=" * 60)
    print("Decorator Demonstration")
    print("=" * 60)
    compute_intensive_task()

    demonstrate_context_managers()
    analyze_memory_usage()
    compare_list_operations()
```

### Advanced timeit Usage

```python
import timeit
from functools import partial

# ============================================================
# Using the Timer class
# ============================================================

# Create Timer object for finer control
timer = timeit.Timer(
    stmt='sum(range(1000))',
    globals=globals()
)

# Automatically determine appropriate number of executions
number, time_taken = timer.autorange()
print(f"Auto-selected {number} executions, total time {time_taken:.4f} seconds")

# Multiple repeated tests
times = timer.repeat(repeat=5, number=10000)
print(f"5 test results: {times}")
print(f"Minimum: {min(times):.6f} seconds")
print(f"Average: {sum(times)/len(times):.6f} seconds")

# ============================================================
# Compare multiple implementations
# ============================================================

def benchmark_implementations():
    """Compare various implementation methods"""

    implementations = {
        "List comprehension": "[x**2 for x in range(1000)]",
        "map + lambda": "list(map(lambda x: x**2, range(1000)))",
        "map + pow": "list(map(pow, range(1000), [2]*1000))",
        "Generator expression": "list(x**2 for x in range(1000))",
    }

    results = {}
    for name, stmt in implementations.items():
        time_result = timeit.timeit(stmt, number=10000)
        results[name] = time_result

    # Output sorted by time
    print("\nPerformance Ranking (fastest to slowest):")
    for i, (name, time_result) in enumerate(sorted(results.items(), key=lambda x: x[1]), 1):
        print(f"  {i}. {name}: {time_result:.4f} seconds")

benchmark_implementations()

# ============================================================
# Using globals parameter to pass variables
# ============================================================

def test_with_globals():
    """Demonstrate how to pass variables to timeit"""

    # Data to test
    my_list = list(range(10000))
    my_dict = {i: i for i in range(10000)}

    # Pass variables using globals()
    list_time = timeit.timeit(
        'my_list[5000]',
        globals={'my_list': my_list},
        number=100000
    )

    dict_time = timeit.timeit(
        'my_dict[5000]',
        globals={'my_dict': my_dict},
        number=100000
    )

    print(f"\nList index access: {list_time:.6f} seconds")
    print(f"Dict key access: {dict_time:.6f} seconds")

test_with_globals()
```

### Advanced cProfile Usage

```python
import cProfile
import pstats
from pstats import SortKey
from io import StringIO
import os

# ============================================================
# Custom profiling output
# ============================================================

def custom_profile_output(func, *args, **kwargs):
    """Custom profiling output format"""
    profiler = cProfile.Profile()

    # Run function
    profiler.runcall(func, *args, **kwargs)

    # Get statistics data
    stream = StringIO()
    stats = pstats.Stats(profiler, stream=stream)
    stats.strip_dirs()

    # Print results with different sorting
    print("\nSorted by Cumulative Time (top 5):")
    stats.sort_stats(SortKey.CUMULATIVE)
    stats.print_stats(5)

    print("\nSorted by Number of Calls (top 5):")
    stats.sort_stats(SortKey.CALLS)
    stats.print_stats(5)

    print("\nSorted by Internal Time (top 5):")
    stats.sort_stats(SortKey.TIME)
    stats.print_stats(5)

    return stats

# ============================================================
# Filter and search profiling results
# ============================================================

def filter_profile_results():
    """Demonstrate how to filter profiling results"""

    def sample_function():
        import json
        import re

        # Perform some operations
        data = {"key": "value" * 1000}
        json_str = json.dumps(data)
        json.loads(json_str)

        text = "Hello World " * 100
        re.findall(r'\w+', text)

    # Profile function
    profiler = cProfile.Profile()
    profiler.runcall(sample_function)

    stats = pstats.Stats(profiler)
    stats.strip_dirs()

    # Show only functions containing 'json'
    print("\nFunctions containing 'json':")
    stats.print_stats('json')

    # Show only functions containing 're'
    print("\nFunctions containing 're':")
    stats.print_stats('re')

    # Combined filter conditions
    print("\nShow only functions with > 10 calls:")
    stats.sort_stats(SortKey.CALLS)
    # Note: print_stats parameter can be a regex
    stats.print_stats(r'.*', 10)

filter_profile_results()

# ============================================================
# Analyze call relationships
# ============================================================

def analyze_call_relationships():
    """Analyze function call relationships"""

    def outer():
        for _ in range(10):
            middle()

    def middle():
        for _ in range(5):
            inner()

    def inner():
        sum(range(100))

    profiler = cProfile.Profile()
    profiler.runcall(outer)

    stats = pstats.Stats(profiler)
    stats.strip_dirs()

    # Show who called inner
    print("\nWho called inner function:")
    stats.print_callers('inner')

    # Show who outer called
    print("\nWho outer function called:")
    stats.print_callees('outer')

analyze_call_relationships()

# ============================================================
# Merge multiple profiling results
# ============================================================

def merge_profile_results():
    """Merge results from multiple profiling sessions"""

    def task1():
        return sum(i ** 2 for i in range(10000))

    def task2():
        return [x ** 0.5 for x in range(10000)]

    # Profile two tasks separately
    prof1 = cProfile.Profile()
    prof1.runcall(task1)
    prof1.dump_stats('/tmp/profile1.prof')

    prof2 = cProfile.Profile()
    prof2.runcall(task2)
    prof2.dump_stats('/tmp/profile2.prof')

    # Merge results
    combined_stats = pstats.Stats('/tmp/profile1.prof')
    combined_stats.add('/tmp/profile2.prof')

    print("\nMerged profiling results:")
    combined_stats.strip_dirs()
    combined_stats.sort_stats(SortKey.CUMULATIVE)
    combined_stats.print_stats(10)

    # Clean up temporary files
    os.remove('/tmp/profile1.prof')
    os.remove('/tmp/profile2.prof')

merge_profile_results()
```

## Best Practices

### Choose the Right Tool

```python
"""
Profiling Tool Selection Guide
"""

# Scenario 1: Quick comparison of two implementations
# Recommended: timeit
import timeit

# Compare list vs generator
list_time = timeit.timeit(
    'sum([i for i in range(1000)])',
    number=10000
)
gen_time = timeit.timeit(
    'sum(i for i in range(1000))',
    number=10000
)
print(f"List: {list_time:.4f}s, Generator: {gen_time:.4f}s")

# Scenario 2: Find program bottlenecks
# Recommended: cProfile
import cProfile
# cProfile.run('main()', sort='cumulative')

# Scenario 3: Precisely locate issues in a specific function
# Recommended: line_profiler
# Add @profile decorator to code
# Then run kernprof -l -v script.py

# Scenario 4: Analyze memory issues
# Recommended: memory_profiler
# Add @profile decorator to code
# Then run python -m memory_profiler script.py

# Scenario 5: Production environment profiling
# Recommended: py-spy
# py-spy record -o profile.svg --pid <PID>
```

### Build a Benchmark Framework

```python
"""
Reusable Benchmark Framework
"""

import timeit
import statistics
from typing import Callable, Dict, List
from dataclasses import dataclass

@dataclass
class BenchmarkResult:
    """Benchmark result"""
    name: str
    min_time: float
    max_time: float
    mean_time: float
    median_time: float
    std_dev: float
    iterations: int

class Benchmark:
    """Benchmark class"""

    def __init__(self, warmup: int = 3, iterations: int = 10, number: int = 1000):
        self.warmup = warmup
        self.iterations = iterations
        self.number = number
        self.results: Dict[str, BenchmarkResult] = {}

    def run(self, name: str, func: Callable, *args, **kwargs) -> BenchmarkResult:
        """Run benchmark"""
        # Warmup
        for _ in range(self.warmup):
            func(*args, **kwargs)

        # Collect data
        times = []
        for _ in range(self.iterations):
            start = timeit.default_timer()
            for _ in range(self.number):
                func(*args, **kwargs)
            end = timeit.default_timer()
            times.append(end - start)

        result = BenchmarkResult(
            name=name,
            min_time=min(times),
            max_time=max(times),
            mean_time=statistics.mean(times),
            median_time=statistics.median(times),
            std_dev=statistics.stdev(times) if len(times) > 1 else 0,
            iterations=self.iterations * self.number
        )

        self.results[name] = result
        return result

    def compare(self, funcs: Dict[str, Callable], *args, **kwargs):
        """Compare multiple functions"""
        for name, func in funcs.items():
            self.run(name, func, *args, **kwargs)

        self.print_results()

    def print_results(self):
        """Print results"""
        print("\n" + "=" * 70)
        print(f"{'Name':<20} {'Min':<12} {'Mean':<12} {'Std Dev':<12}")
        print("=" * 70)

        # Sort by mean time
        sorted_results = sorted(
            self.results.values(),
            key=lambda x: x.mean_time
        )

        baseline = sorted_results[0].mean_time

        for result in sorted_results:
            ratio = result.mean_time / baseline
            print(
                f"{result.name:<20} "
                f"{result.min_time*1000:>8.3f} ms  "
                f"{result.mean_time*1000:>8.3f} ms  "
                f"{result.std_dev*1000:>8.3f} ms  "
                f"({ratio:.2f}x)"
            )

# Usage example
def bubble_sort(arr):
    arr = arr.copy()
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def insertion_sort(arr):
    arr = arr.copy()
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr

def builtin_sort(arr):
    return sorted(arr)

# Run benchmark
import random
test_data = [random.random() for _ in range(100)]

benchmark = Benchmark(warmup=3, iterations=10, number=100)
benchmark.compare(
    {
        "Bubble sort": bubble_sort,
        "Insertion sort": insertion_sort,
        "Built-in sort": builtin_sort,
    },
    test_data
)
```

### Generate Profiling Reports

```python
"""
Generate Detailed Profiling Reports
"""

import cProfile
import pstats
from pstats import SortKey
from io import StringIO
from datetime import datetime

class ProfileReport:
    """Profiling report generator"""

    def __init__(self, name: str = "Profile Report"):
        self.name = name
        self.profiler = cProfile.Profile()
        self.stats = None

    def start(self):
        """Start profiling"""
        self.profiler.enable()

    def stop(self):
        """Stop profiling"""
        self.profiler.disable()
        self.stats = pstats.Stats(self.profiler)
        self.stats.strip_dirs()

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()
        return False

    def get_top_functions(self, n: int = 20, sort_by: str = 'cumulative'):
        """Get most time-consuming functions"""
        sort_key = {
            'cumulative': SortKey.CUMULATIVE,
            'time': SortKey.TIME,
            'calls': SortKey.CALLS,
        }.get(sort_by, SortKey.CUMULATIVE)

        stream = StringIO()
        self.stats.stream = stream
        self.stats.sort_stats(sort_key)
        self.stats.print_stats(n)

        return stream.getvalue()

    def get_call_graph(self, func_name: str):
        """Get function call graph"""
        stream = StringIO()
        self.stats.stream = stream

        stream.write(f"\nFunctions that called {func_name}:\n")
        self.stats.print_callers(func_name)

        stream.write(f"\nFunctions called by {func_name}:\n")
        self.stats.print_callees(func_name)

        return stream.getvalue()

    def generate_report(self, output_file: str = None):
        """Generate complete report"""
        report = []
        report.append(f"# {self.name}")
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append("")

        report.append("## Sorted by Cumulative Time (top 20 functions)")
        report.append("```")
        report.append(self.get_top_functions(20, 'cumulative'))
        report.append("```")

        report.append("## Sorted by Number of Calls (top 20 functions)")
        report.append("```")
        report.append(self.get_top_functions(20, 'calls'))
        report.append("```")

        report.append("## Sorted by Internal Time (top 20 functions)")
        report.append("```")
        report.append(self.get_top_functions(20, 'time'))
        report.append("```")

        report_text = "\n".join(report)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report_text)

        return report_text

    def save_stats(self, filename: str):
        """Save raw statistics data"""
        self.profiler.dump_stats(filename)

# Usage example
def complex_computation():
    """Complex computation example"""
    import math

    result = 0
    for i in range(10000):
        result += math.sin(i) * math.cos(i)
        result += math.sqrt(abs(result)) if result > 0 else 0

    data = [i ** 2 for i in range(5000)]
    sorted_data = sorted(data, reverse=True)

    return result, sorted_data

# Generate report
with ProfileReport("Complex Computation Analysis") as report:
    for _ in range(10):
        complex_computation()

print(report.generate_report())
```

### Continuous Performance Monitoring

```python
"""
Continuous Performance Monitoring Module
"""

import time
import functools
import threading
from collections import defaultdict
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from contextlib import contextmanager

@dataclass
class PerformanceMetrics:
    """Performance metrics"""
    call_count: int = 0
    total_time: float = 0.0
    min_time: float = float('inf')
    max_time: float = 0.0
    times: List[float] = field(default_factory=list)

    def record(self, duration: float):
        self.call_count += 1
        self.total_time += duration
        self.min_time = min(self.min_time, duration)
        self.max_time = max(self.max_time, duration)
        self.times.append(duration)

    @property
    def avg_time(self) -> float:
        return self.total_time / self.call_count if self.call_count > 0 else 0

    @property
    def p95_time(self) -> float:
        if not self.times:
            return 0
        sorted_times = sorted(self.times)
        idx = int(len(sorted_times) * 0.95)
        return sorted_times[idx]

class PerformanceMonitor:
    """Performance monitor"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance.metrics: Dict[str, PerformanceMetrics] = defaultdict(PerformanceMetrics)
        return cls._instance

    def record(self, name: str, duration: float):
        """Record performance data"""
        self.metrics[name].record(duration)

    def get_metrics(self, name: str) -> Optional[PerformanceMetrics]:
        """Get metrics for a specific function"""
        return self.metrics.get(name)

    def get_all_metrics(self) -> Dict[str, PerformanceMetrics]:
        """Get all metrics"""
        return dict(self.metrics)

    def print_summary(self):
        """Print summary"""
        print("\n" + "=" * 80)
        print("Performance Monitoring Summary")
        print("=" * 80)
        print(f"{'Function Name':<30} {'Call Count':<10} {'Avg Time':<15} {'P95':<15}")
        print("-" * 80)

        for name, metrics in sorted(self.metrics.items(), key=lambda x: x[1].total_time, reverse=True):
            print(
                f"{name:<30} "
                f"{metrics.call_count:<10} "
                f"{metrics.avg_time*1000:>10.3f} ms   "
                f"{metrics.p95_time*1000:>10.3f} ms"
            )

    def reset(self):
        """Reset all metrics"""
        self.metrics.clear()

# Monitoring decorator
def monitor(name: str = None):
    """Performance monitoring decorator"""
    def decorator(func):
        func_name = name or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                duration = time.perf_counter() - start
                PerformanceMonitor().record(func_name, duration)

        return wrapper
    return decorator

# Monitoring context manager
@contextmanager
def monitor_block(name: str):
    """Code block performance monitoring"""
    start = time.perf_counter()
    try:
        yield
    finally:
        duration = time.perf_counter() - start
        PerformanceMonitor().record(name, duration)

# Usage example
@monitor()
def database_query():
    """Simulate database query"""
    time.sleep(0.01)  # Simulate I/O
    return {"data": "result"}

@monitor()
def process_data(data):
    """Process data"""
    return sum(range(10000))

@monitor("api_handler")
def handle_request():
    """Handle API request"""
    data = database_query()
    result = process_data(data)
    return result

# Run example
for _ in range(100):
    handle_request()

    with monitor_block("custom_block"):
        time.sleep(0.001)

# Print monitoring results
PerformanceMonitor().print_summary()
```

## Common Pitfalls

### Inaccurate Measurements

```python
"""
Avoid Inaccurate Performance Measurements
"""

import timeit
import time

# Pitfall 1: Running only once
# Wrong approach
def bad_timing():
    start = time.time()
    result = sum(range(10000))
    end = time.time()
    print(f"Time: {end - start}")  # Single measurement is inaccurate

# Correct approach
def good_timing():
    # Use timeit to run multiple times and average
    time_result = timeit.timeit(
        'sum(range(10000))',
        number=1000
    )
    print(f"Average time: {time_result/1000:.6f} seconds")

# Pitfall 2: Not using perf_counter
# time.time() has lower precision and is affected by system time
# time.perf_counter() is more suitable for performance measurement

def accurate_timing():
    start = time.perf_counter()
    result = sum(range(10000))
    end = time.perf_counter()
    print(f"Time: {end - start:.6f} seconds")

# Pitfall 3: Ignoring warmup
def test_with_warmup():
    """Test with warmup"""
    func = lambda: sum(range(10000))

    # Warmup (let JIT compiler optimize)
    for _ in range(10):
        func()

    # Actual measurement
    times = []
    for _ in range(100):
        start = time.perf_counter()
        func()
        times.append(time.perf_counter() - start)

    print(f"Average time: {sum(times)/len(times):.6f} seconds")
    print(f"Minimum time: {min(times):.6f} seconds")
```

### Profiler Overhead Affecting Results

```python
"""
Be Aware of Profiler Overhead
"""

import cProfile
import timeit

def fast_function():
    """Fast function"""
    return sum(range(100))

# Problem: For very fast functions, cProfile overhead may exceed function time
# This can distort profiling results

# Without profiler
time_without_profiler = timeit.timeit(fast_function, number=100000)
print(f"Without profiler: {time_without_profiler:.4f} seconds")

# With profiler
profiler = cProfile.Profile()
profiler.enable()
for _ in range(100000):
    fast_function()
profiler.disable()

# Solutions:
# For fast functions, use timeit instead of cProfile
# Increase function workload to reduce relative overhead
# Use sampling profilers (like py-spy) to reduce overhead
```

### Ignoring I/O Wait Time

```python
"""
Distinguish Between CPU Time and I/O Wait Time
"""

import cProfile
import time

def io_bound_function():
    """I/O-intensive function"""
    time.sleep(0.1)  # Simulate I/O wait
    return "done"

def cpu_bound_function():
    """CPU-intensive function"""
    return sum(i ** 2 for i in range(100000))

def mixed_function():
    """Mixed function"""
    cpu_bound_function()
    io_bound_function()

# cProfile shows wall time (including wait time)
# But tottime excludes subfunction call time
# Need to combine cumtime and tottime for analysis

# For I/O-intensive applications, consider using:
# - py-spy --native can see system calls
# - strace to trace system calls
# - asyncio debugging tools

cProfile.run('mixed_function()')
```

### Sampling Bias

```python
"""
Avoid Sampling Bias
"""

import random
import timeit

# Pitfall: Using the same input data
def test_sort_biased():
    """Biased test"""
    data = list(range(1000))  # Already sorted data
    return timeit.timeit(
        'sorted(data)',
        globals={'data': data},
        number=1000
    )

# Correct approach: Use random data
def test_sort_unbiased():
    """Unbiased test"""
    times = []
    for _ in range(100):
        data = [random.random() for _ in range(1000)]
        time_result = timeit.timeit(
            'sorted(data)',
            globals={'data': data},
            number=10
        )
        times.append(time_result)

    return sum(times) / len(times)

print(f"Already sorted data: {test_sort_biased():.4f} seconds")
print(f"Random data: {test_sort_unbiased():.4f} seconds")
```

### Ignoring Cache Effects

```python
"""
Be Aware of Cache Impact on Performance
"""

import timeit
from functools import lru_cache

# Pitfall: Not clearing cache leads to unfair tests
@lru_cache(maxsize=None)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Wrong: Cache affects subsequent tests
time1 = timeit.timeit('fibonacci(30)', globals=globals(), number=1)
time2 = timeit.timeit('fibonacci(30)', globals=globals(), number=1)  # Will be faster

print(f"First time: {time1:.6f} seconds")
print(f"Second time: {time2:.6f} seconds")  # Almost 0 because of cache

# Correct approach: Clear cache before each test
def test_fibonacci_correctly():
    times = []
    for _ in range(5):
        fibonacci.cache_clear()  # Clear cache
        time_result = timeit.timeit('fibonacci(30)', globals=globals(), number=1)
        times.append(time_result)

    return sum(times) / len(times)

print(f"Correct test: {test_fibonacci_correctly():.6f} seconds")
```

## Performance Considerations

### Profiler Overhead Comparison

```python
"""
Compare Overhead of Different Profilers
"""

import time
import cProfile
import profile

def test_function():
    """Test function"""
    total = 0
    for i in range(100000):
        total += i ** 2
    return total

# Baseline: No profiler
start = time.perf_counter()
for _ in range(10):
    test_function()
base_time = time.perf_counter() - start
print(f"No profiler: {base_time:.4f} seconds")

# cProfile (C implementation)
profiler = cProfile.Profile()
start = time.perf_counter()
for _ in range(10):
    profiler.runcall(test_function)
cprofile_time = time.perf_counter() - start
print(f"cProfile: {cprofile_time:.4f} seconds (overhead: {(cprofile_time/base_time - 1)*100:.1f}%)")

# profile (pure Python implementation)
profiler = profile.Profile()
start = time.perf_counter()
for _ in range(10):
    profiler.runcall(test_function)
profile_time = time.perf_counter() - start
print(f"profile:  {profile_time:.4f} seconds (overhead: {(profile_time/base_time - 1)*100:.1f}%)")
```

### Choosing Appropriate Granularity

```python
"""
Choose Profiling Granularity Based on Needs
"""

# Coarse-grained profiling: Quick problem identification
# Use cProfile, focus on functions with highest cumtime

# Fine-grained profiling: Deep analysis of specific functions
# Use line_profiler for line-by-line analysis

# Production environment profiling: Minimize overhead
# Use py-spy for sampling profiling

# Example: Layered profiling strategy
def analyze_hierarchically(target_function):
    """Layered performance profiling"""
    import cProfile

    # Layer 1: Use cProfile to find hot functions
    print("=" * 50)
    print("Layer 1: Coarse-grained Profiling")
    print("=" * 50)
    cProfile.runctx(
        'target_function()',
        globals(),
        {'target_function': target_function}
    )

    # Layer 2: Use line_profiler on hot functions
    # (Requires manually adding @profile decorator)
    print("\nTip: Add @profile decorator to hot functions, then run kernprof -l -v script.py")
```

## Practical Scenarios

### Scenario 1: Web Application Profiling

```python
"""
Web Application Profiling Example
"""

import cProfile
import pstats
from io import StringIO
from functools import wraps
import time

# Simulate Flask application profiling

def profile_request(func):
    """Request-level profiling decorator"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Only enable in development mode
        if not getattr(wrapper, 'profiling_enabled', False):
            return func(*args, **kwargs)

        profiler = cProfile.Profile()
        profiler.enable()

        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()

            # Log slow requests
            stream = StringIO()
            stats = pstats.Stats(profiler, stream=stream)
            stats.strip_dirs()
            stats.sort_stats('cumulative')
            stats.print_stats(10)

            # Can send results to logging system
            print(f"\nRequest {func.__name__} profiling:")
            print(stream.getvalue())

        return result

    wrapper.profiling_enabled = True
    return wrapper

# Simulate database query
def query_database(query):
    time.sleep(0.05)  # Simulate database latency
    return [{"id": i, "data": f"record_{i}"} for i in range(10)]

# Simulate data processing
def process_results(results):
    processed = []
    for r in results:
        # Simulate CPU-intensive processing
        processed.append({
            **r,
            "processed": sum(range(10000))
        })
    return processed

# Simulate view function
@profile_request
def api_endpoint():
    """API endpoint"""
    # Database query
    results = query_database("SELECT * FROM table")

    # Data processing
    processed = process_results(results)

    # Return response
    return {"status": "success", "data": processed}

# Test
api_endpoint()
```

### Scenario 2: Data Processing Pipeline Optimization

```python
"""
Data Processing Pipeline Performance Optimization
"""

import time
import timeit

# Original implementation
def process_data_v1(data):
    """Original version: Step-by-step processing"""
    # Step 1: Filter
    filtered = []
    for item in data:
        if item > 0:
            filtered.append(item)

    # Step 2: Transform
    transformed = []
    for item in filtered:
        transformed.append(item ** 2)

    # Step 3: Aggregate
    total = 0
    for item in transformed:
        total += item

    return total

# Optimized version 1: Using list comprehensions
def process_data_v2(data):
    """Optimized version 1: List comprehensions"""
    filtered = [x for x in data if x > 0]
    transformed = [x ** 2 for x in filtered]
    return sum(transformed)

# Optimized version 2: Using generators
def process_data_v3(data):
    """Optimized version 2: Generator expressions"""
    return sum(x ** 2 for x in data if x > 0)

# Optimized version 3: Using map/filter
def process_data_v4(data):
    """Optimized version 3: map/filter"""
    filtered = filter(lambda x: x > 0, data)
    transformed = map(lambda x: x ** 2, filtered)
    return sum(transformed)

# Performance comparison
test_data = list(range(-5000, 5000))

print("Data Processing Pipeline Performance Comparison:")
print("=" * 50)

for name, func in [
    ("Original version", process_data_v1),
    ("List comprehension", process_data_v2),
    ("Generator expression", process_data_v3),
    ("map/filter", process_data_v4),
]:
    time_result = timeit.timeit(
        lambda: func(test_data),
        number=1000
    )
    print(f"{name}: {time_result:.4f} seconds")
```

### Scenario 3: Algorithm Optimization

```python
"""
Algorithm Optimization Case: Finding Duplicate Elements
"""

import timeit
import random
from collections import Counter

# Method 1: Brute force O(n^2)
def find_duplicates_v1(arr):
    """Brute force method"""
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates

# Method 2: Using set O(n)
def find_duplicates_v2(arr):
    """Using set"""
    seen = set()
    duplicates = set()
    for item in arr:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)

# Method 3: Using Counter O(n)
def find_duplicates_v3(arr):
    """Using Counter"""
    counter = Counter(arr)
    return [item for item, count in counter.items() if count > 1]

# Method 4: Sort then check O(n log n)
def find_duplicates_v4(arr):
    """Sort then check"""
    if not arr:
        return []
    sorted_arr = sorted(arr)
    duplicates = []
    prev = sorted_arr[0]
    for i in range(1, len(sorted_arr)):
        if sorted_arr[i] == prev and prev not in duplicates:
            duplicates.append(prev)
        prev = sorted_arr[i]
    return duplicates

# Performance comparison
print("\nFinding Duplicates Algorithm Comparison:")
print("=" * 60)

for size in [100, 500, 1000]:
    test_data = [random.randint(0, size // 2) for _ in range(size)]
    print(f"\nData size: {size}")

    for name, func in [
        ("Brute force", find_duplicates_v1),
        ("Set method", find_duplicates_v2),
        ("Counter", find_duplicates_v3),
        ("Sort method", find_duplicates_v4),
    ]:
        # Skip brute force for large datasets
        if size > 500 and name == "Brute force":
            print(f"  {name}: Skipped (too slow)")
            continue

        time_result = timeit.timeit(
            lambda f=func, d=test_data: f(d),
            number=100
        )
        print(f"  {name}: {time_result:.4f} seconds")
```

## Interview Key Points

### What is the difference between cProfile and timeit?

```python
"""
cProfile vs timeit Comparison
"""

# timeit:
# - Used for measuring execution time of small code snippets
# - Automatically runs multiple times and averages
# - Suitable for comparing performance of different implementations
# - Very low overhead

import timeit
time_result = timeit.timeit('"-".join(str(i) for i in range(100))', number=10000)
print(f"timeit: {time_result:.4f} seconds")

# cProfile:
# - Used for profiling entire programs or functions
# - Provides detailed info like function call counts and time distribution
# - Suitable for finding program bottlenecks
# - Has some overhead

import cProfile
cProfile.run('"-".join(str(i) for i in range(100))')

# Summary:
# - Need simple timing: use timeit
# - Need to find bottlenecks: use cProfile
```

### How to profile performance issues in production environments?

```python
"""
Production Environment Profiling Strategies
"""

# Use low-overhead sampling profiler
# py-spy can attach to running process
# py-spy record -o profile.svg --pid <PID>

# Add performance monitoring points
import time
import logging

logger = logging.getLogger(__name__)

def monitor_performance(threshold_ms=100):
    """Performance monitoring decorator"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = func(*args, **kwargs)
            duration_ms = (time.perf_counter() - start) * 1000

            if duration_ms > threshold_ms:
                logger.warning(
                    f"Slow call: {func.__name__} took {duration_ms:.2f}ms"
                )

            return result
        return wrapper
    return decorator

# Use APM tools (like New Relic, Datadog)
# Analyze slow queries in logs
# Use distributed tracing (like Jaeger, Zipkin)
```

### What is the difference between tottime and cumtime?

```python
"""
tottime vs cumtime Explained
"""

# tottime (total time):
# - Time spent executing the function itself
# - Excludes time in subfunction calls

# cumtime (cumulative time):
# - Cumulative execution time of the function
# - Includes time in all subfunction calls

# Example
def inner():
    return sum(range(10000))

def outer():
    result = 0
    for _ in range(10):
        result += inner()
    return result

import cProfile
cProfile.run('outer()')

# Analysis results:
# - outer's tottime is small (only loop overhead)
# - outer's cumtime is large (includes inner's time)
# - inner's tottime and cumtime are close (no subfunctions)
```

### How to optimize Python program performance?

```python
"""
Python Performance Optimization Strategies
"""

import math
import numpy as np

# Algorithm optimization (most important)
# - Choose correct data structures
# - Reduce time complexity

# Use built-in functions and libraries
# Built-in functions are usually implemented in C, faster than Python loops
# Bad:
total = 0
for x in range(1000):
    total += x
# Good:
total = sum(range(1000))

# Avoid global variable lookups
# Bad:
def slow():
    return [math.sin(x) for x in range(1000)]
# Good:
def fast():
    sin = math.sin  # Local variable lookup is faster
    return [sin(x) for x in range(1000)]

# Use generators to reduce memory
# Bad:
def get_squares_list(n):
    return [x**2 for x in range(n)]
# Good:
def get_squares_gen(n):
    return (x**2 for x in range(n))

# Use __slots__ to reduce memory
class Point:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Use NumPy for numerical computation
# Bad:
result = sum([x**2 for x in range(1000000)])
# Good:
arr = np.arange(1000000)
result = np.sum(arr**2)

# Use caching
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(n):
    return sum(i**2 for i in range(n))

# Use multiprocessing for CPU-intensive tasks
from concurrent.futures import ProcessPoolExecutor

def cpu_bound_task(n):
    return sum(i**2 for i in range(n))

with ProcessPoolExecutor() as executor:
    results = list(executor.map(cpu_bound_task, [1000000] * 4))
```

### What is a sampling profiler? How does it differ from deterministic profiler?

```python
"""
Sampling Profiler vs Deterministic Profiler
"""

# Deterministic Profiler
# - Examples: cProfile, profile
# - Monitors every function call
# - Precise but high overhead
# - May affect program behavior (especially for fast functions)

# Sampling Profiler (Statistical Profiler)
# - Examples: py-spy, pyinstrument
# - Periodically samples program state
# - Low overhead, suitable for production environments
# - Accuracy depends on sampling frequency
# - May not be accurate enough for short-running functions

# Selection recommendations:
# - Development debugging: use cProfile
# - Production environment: use py-spy
# - Line-by-line analysis: use line_profiler
# - Memory analysis: use memory_profiler
```

## Further Reading

### Official Documentation

- [Python timeit Documentation](https://docs.python.org/3/library/timeit.html)
- [Python cProfile Documentation](https://docs.python.org/3/library/profile.html)
- [Python pstats Documentation](https://docs.python.org/3/library/profile.html#the-stats-class)

### Third-party Tool Documentation

- [line_profiler GitHub](https://github.com/pyutils/line_profiler)
- [memory_profiler GitHub](https://github.com/pythonprofilers/memory_profiler)
- [py-spy GitHub](https://github.com/benfred/py-spy)
- [snakeviz GitHub](https://github.com/jiffyclub/snakeviz)
- [pyinstrument GitHub](https://github.com/joerick/pyinstrument)
- [Scalene GitHub](https://github.com/plasma-umass/scalene)

### Recommended Books

- "High Performance Python" - Micha Gorelick, Ian Ozsvald
- "Python Performance Analysis and Optimization"

### Related Tools

- **Scalene**: High-performance profiler that analyzes CPU, GPU, and memory simultaneously
- **pyinstrument**: Call stack-based sampling profiler with more readable output
- **yappi**: Profiler with multi-threading support
- **Fil**: Tool focused on memory analysis
- **Austin**: Low-overhead Python frame stack sampler

### Advanced Topics

- Impact of Python GIL on multi-threaded performance
- NumPy/Pandas performance optimization
- Using Cython and Numba
- Asynchronous I/O performance profiling
- Distributed system performance tracing
