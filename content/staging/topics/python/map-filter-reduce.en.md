---
title: Python map, filter, reduce Functions Explained
description: "Deep understanding of Python functional programming's three core tools: map, filter, reduce - principles, usage, performance characteristics, and best practices"
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - map
  - filter
  - reduce
  - 函数式编程
  - 高阶函数
  - 迭代器
  - 列表推导式
status: imported
origin: old/src/content/docs/python/map-filter-reduce.en.md
divergence: 0.21
issues: []
legacy:
  category: Python
  subcategory: 函数式编程
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

`map`, `filter`, and `reduce` are the three core higher-order functions of Python functional programming. They originate from the functional programming paradigm and have a long history in languages like Lisp and Haskell.

**Higher-order functions** are functions that can accept functions as parameters or return functions. These three functions all accept a function and one or more iterables as parameters, performing transformation, filtering, or aggregation operations on data.

- **map**: Applies a function to each element of an iterable, returning the transformed results
- **filter**: Filters elements in an iterable based on the function's return value (true/false)
- **reduce**: Accumulates and reduces elements of an iterable into a single value

These functions embody the idea of "declarative programming": we describe "what to do" rather than "how to do it", making code more concise, readable, and less error-prone.

```python
# Imperative programming: describing "how to do it"
squares = []
for x in range(10):
    squares.append(x ** 2)

# Declarative programming: describing "what to do"
squares = list(map(lambda x: x ** 2, range(10)))
```

## Core Principles

### How map Function Works

`map(function, iterable, ...)` returns an iterator that applies `function` to each element of `iterable`.

```python
# Equivalent implementation of map
def my_map(func, *iterables):
    iterators = [iter(it) for it in iterables]
    while True:
        try:
            args = [next(it) for it in iterators]
            yield func(*args)
        except StopIteration:
            return
```

Key characteristics:
1. **Lazy evaluation**: `map` returns an iterator, results are not computed immediately
2. **Multiple iterator support**: Can process multiple iterables simultaneously
3. **Short-circuit behavior**: Stops when the shortest iterator is exhausted

### How filter Function Works

`filter(function, iterable)` returns an iterator containing only elements for which `function` returns `True`.

```python
# Equivalent implementation of filter
def my_filter(func, iterable):
    for item in iterable:
        if func is None:
            if item:
                yield item
        elif func(item):
            yield item
```

Key characteristics:
1. **Lazy evaluation**: Also returns an iterator
2. **None function**: When `function` is `None`, filters out all falsy values
3. **Order preservation**: Results maintain original order

### How reduce Function Works

`functools.reduce(function, iterable[, initializer])` cumulatively applies a binary function to sequence elements, from left to right, reducing the sequence to a single value.

```python
# Equivalent implementation of reduce
def my_reduce(func, iterable, initializer=None):
    it = iter(iterable)
    if initializer is None:
        try:
            value = next(it)
        except StopIteration:
            raise TypeError('reduce() of empty sequence with no initial value')
    else:
        value = initializer
    for element in it:
        value = func(value, element)
    return value
```

Key characteristics:
1. **Eager evaluation**: `reduce` returns a single value, must traverse the entire sequence
2. **Optional initial value**: An initial value can be provided as the accumulation starting point
3. **Empty sequence handling**: Raises `TypeError` for empty sequences without initial value

## Key Points

### map Key Points

| Feature | Description |
|---------|-------------|
| Return type | `map` object (iterator) |
| Parameter count | Function parameter count must match number of iterables |
| Lazy evaluation | Computation doesn't execute until iterator is consumed |
| Multiple input handling | Based on the shortest iterable |

### filter Key Points

| Feature | Description |
|---------|-------------|
| Return type | `filter` object (iterator) |
| None function | Filters falsy values (0, '', None, False, [], {}, etc.) |
| Truthiness | Any truthy return value keeps the element |
| Single input | Only accepts one iterable |

### reduce Key Points

| Feature | Description |
|---------|-------------|
| Module location | `functools` module (Python 3) |
| Return type | Single accumulated value |
| Initial value purpose | Handle empty sequences, set type |
| Associativity requirement | Best suited for associative operations |

### Lazy Evaluation Explained

```python
# Lazy evaluation demonstration
def debug_transform(x):
    print(f"Processing: {x}")
    return x * 2

# Creating map object, no output at this point
result = map(debug_transform, [1, 2, 3, 4, 5])
print("Map object created")  # This line outputs first

# Processing only occurs during iteration
print("Starting iteration")
for item in result:
    print(f"Got: {item}")
    if item > 4:
        break  # Early exit, subsequent elements won't be processed
```

## Code Examples

### map Basic Usage

```python
# Basic transformation
numbers = [1, 2, 3, 4, 5]

# Using lambda
squares = list(map(lambda x: x ** 2, numbers))
print(squares)  # [1, 4, 9, 16, 25]

# Using built-in functions
strings = ['1', '2', '3', '4', '5']
integers = list(map(int, strings))
print(integers)  # [1, 2, 3, 4, 5]

# Using custom functions
def celsius_to_fahrenheit(c):
    return c * 9/5 + 32

celsius = [0, 10, 20, 30, 40]
fahrenheit = list(map(celsius_to_fahrenheit, celsius))
print(fahrenheit)  # [32.0, 50.0, 68.0, 86.0, 104.0]
```

### map Multiple Arguments Usage

```python
# Multiple iterables
list1 = [1, 2, 3]
list2 = [10, 20, 30]
list3 = [100, 200, 300]

# Using multiple iterables
sums = list(map(lambda x, y, z: x + y + z, list1, list2, list3))
print(sums)  # [111, 222, 333]

# Using operator module
from operator import add, mul
products = list(map(mul, list1, list2))
print(products)  # [10, 40, 90]

# Unequal length sequences (based on shortest)
a = [1, 2, 3, 4, 5]
b = [10, 20, 30]
result = list(map(add, a, b))
print(result)  # [11, 22, 33]
```

### filter Basic Usage

```python
# Basic filtering
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Filter even numbers
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)  # [2, 4, 6, 8, 10]

# Filter positive numbers
mixed = [-3, -2, -1, 0, 1, 2, 3]
positives = list(filter(lambda x: x > 0, mixed))
print(positives)  # [1, 2, 3]

# Using custom function
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

primes = list(filter(is_prime, range(20)))
print(primes)  # [2, 3, 5, 7, 11, 13, 17, 19]
```

### filter with None

```python
# Using None to filter falsy values
mixed_data = [0, 1, '', 'hello', None, [], [1, 2], False, True, {}, {'a': 1}]

# Filter all falsy values
truthy_values = list(filter(None, mixed_data))
print(truthy_values)  # [1, 'hello', [1, 2], True, {'a': 1}]

# Clean empty strings
strings = ['hello', '', 'world', '', 'python', '']
non_empty = list(filter(None, strings))
print(non_empty)  # ['hello', 'world', 'python']

# Note: 0 is also a falsy value
numbers_with_zero = [0, 1, 2, 0, 3, 0, 4]
without_zeros = list(filter(None, numbers_with_zero))
print(without_zeros)  # [1, 2, 3, 4]
```

### reduce Basic Usage

```python
from functools import reduce

# Basic accumulation operations
numbers = [1, 2, 3, 4, 5]

# Sum
total = reduce(lambda x, y: x + y, numbers)
print(total)  # 15

# Product
product = reduce(lambda x, y: x * y, numbers)
print(product)  # 120

# Using operator module
from operator import add, mul
total = reduce(add, numbers)
product = reduce(mul, numbers)
```

### reduce with Initial Value

```python
from functools import reduce

# Using initial value
numbers = [1, 2, 3, 4, 5]

# Sum with initial value
total = reduce(lambda x, y: x + y, numbers, 10)
print(total)  # 25 (10 + 1 + 2 + 3 + 4 + 5)

# Handling empty list
empty = []
# result = reduce(lambda x, y: x + y, empty)  # TypeError!
result = reduce(lambda x, y: x + y, empty, 0)  # OK, returns 0

# Initial value sets result type
strings = ['a', 'b', 'c']
result = reduce(lambda x, y: x + [y.upper()], strings, [])
print(result)  # ['A', 'B', 'C']
```

### reduce Advanced Usage

```python
from functools import reduce

# Complex accumulation operations
# Flatten nested list
nested = [[1, 2], [3, 4], [5, 6]]
flat = reduce(lambda x, y: x + y, nested)
print(flat)  # [1, 2, 3, 4, 5, 6]

# Find maximum (for demonstration, use max() in practice)
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
maximum = reduce(lambda x, y: x if x > y else y, numbers)
print(maximum)  # 9

# Merge dictionaries
dicts = [{'a': 1}, {'b': 2}, {'c': 3}]
combined = reduce(lambda x, y: {**x, **y}, dicts)
print(combined)  # {'a': 1, 'b': 2, 'c': 3}

# Group counting
words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
count = reduce(
    lambda acc, word: {**acc, word: acc.get(word, 0) + 1},
    words,
    {}
)
print(count)  # {'apple': 3, 'banana': 2, 'cherry': 1}
```

### Combined Usage

```python
from functools import reduce

# Data processing pipeline
data = ['  Alice  ', 'BOB', '  Charlie', 'david  ', '']

# Clean, filter, transform
result = list(
    map(
        str.title,  # Convert to title case
        filter(
            None,  # Filter empty strings
            map(str.strip, data)  # Strip whitespace
        )
    )
)
print(result)  # ['Alice', 'Bob', 'Charlie', 'David']

# Calculate shopping cart total
cart = [
    {'name': 'Apple', 'price': 1.5, 'quantity': 4},
    {'name': 'Banana', 'price': 0.5, 'quantity': 6},
    {'name': 'Orange', 'price': 2.0, 'quantity': 3},
]

# Filter, transform, reduce
total = reduce(
    lambda acc, x: acc + x,
    map(
        lambda item: item['price'] * item['quantity'],
        filter(
            lambda item: item['quantity'] > 0,
            cart
        )
    ),
    0
)
print(f"Total: ${total:.2f}")  # Total: $15.00
```

### Comparison with List Comprehensions

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# --- map vs list comprehension ---
# map
squares_map = list(map(lambda x: x ** 2, numbers))
# list comprehension
squares_comp = [x ** 2 for x in numbers]

# --- filter vs list comprehension ---
# filter
evens_filter = list(filter(lambda x: x % 2 == 0, numbers))
# list comprehension
evens_comp = [x for x in numbers if x % 2 == 0]

# --- map + filter vs list comprehension ---
# map + filter
even_squares_mf = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, numbers)))
# list comprehension (clearer)
even_squares_comp = [x ** 2 for x in numbers if x % 2 == 0]

# --- Generator expression (lazy) ---
# Equivalent to map's lazy behavior
squares_gen = (x ** 2 for x in numbers)
```

## Best Practices

### Prefer List Comprehensions for Simple Scenarios

```python
# Recommended: list comprehensions are more intuitive
squares = [x ** 2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# Not recommended: lambda reduces readability
squares = list(map(lambda x: x ** 2, range(10)))
evens = list(filter(lambda x: x % 2 == 0, range(20)))
```

### Prefer map/filter When Using Built-in or Existing Functions

```python
# Recommended: map is more concise with existing functions
strings = ['1', '2', '3', '4', '5']
numbers = list(map(int, strings))
lower_strings = list(map(str.lower, ['HELLO', 'WORLD']))

# Not recommended: list comprehension is redundant in this case
numbers = [int(s) for s in strings]
```

### Leverage Lazy Evaluation for Large Datasets

```python
# Recommended: use lazy iteration for large files
def process_large_file(filepath):
    with open(filepath) as f:
        # Lazy processing, doesn't load all data at once
        processed = map(str.strip, f)
        filtered = filter(lambda line: not line.startswith('#'), processed)
        for line in filtered:
            yield line

# Not recommended: list comprehension loads everything at once
def process_large_file_bad(filepath):
    with open(filepath) as f:
        return [line.strip() for line in f if not line.startswith('#')]
```

### Use operator Module Instead of Simple Lambdas

```python
from operator import add, mul, itemgetter, attrgetter
from functools import reduce

# Recommended: use operator module
total = reduce(add, numbers)
product = reduce(mul, numbers)

# Use itemgetter/attrgetter for sorting
data = [{'name': 'Alice', 'age': 30}, {'name': 'Bob', 'age': 25}]
sorted_data = sorted(data, key=itemgetter('age'))

# Not recommended: lambda for simple operations
total = reduce(lambda x, y: x + y, numbers)
sorted_data = sorted(data, key=lambda x: x['age'])
```

### Use Initial Value with reduce for Type Safety

```python
from functools import reduce

# Recommended: always provide initial value
def safe_sum(numbers):
    return reduce(lambda x, y: x + y, numbers, 0)

def safe_concat(strings):
    return reduce(lambda x, y: x + y, strings, '')

# Not recommended: empty sequence will raise exception
def unsafe_sum(numbers):
    return reduce(lambda x, y: x + y, numbers)  # Error on empty list
```

### Use Named Functions for Complex Operations Instead of Lambdas

```python
# Recommended: use named functions for complex logic
def calculate_discount_price(item):
    """Calculate discounted price"""
    if item['category'] == 'electronics':
        return item['price'] * 0.9
    elif item['category'] == 'clothing':
        return item['price'] * 0.8
    return item['price']

discounted = list(map(calculate_discount_price, items))

# Not recommended: complex lambda is hard to understand and debug
discounted = list(map(
    lambda x: x['price'] * 0.9 if x['category'] == 'electronics'
              else x['price'] * 0.8 if x['category'] == 'clothing'
              else x['price'],
    items
))
```

## Common Pitfalls

### Forgetting map/filter Returns an Iterator

```python
# Wrong: iterator can only be traversed once
numbers = [1, 2, 3, 4, 5]
doubled = map(lambda x: x * 2, numbers)

print(list(doubled))  # [2, 4, 6, 8, 10]
print(list(doubled))  # []  Empty list! Iterator exhausted

# Correct: convert to list when multiple uses are needed
doubled = list(map(lambda x: x * 2, numbers))
print(doubled)  # [2, 4, 6, 8, 10]
print(doubled)  # [2, 4, 6, 8, 10]
```

### Using reduce Without Importing

```python
# Wrong: reduce is not a built-in function in Python 3
# result = reduce(lambda x, y: x + y, [1, 2, 3])  # NameError!

# Correct: import from functools
from functools import reduce
result = reduce(lambda x, y: x + y, [1, 2, 3])
```

### Modifying External State in Lambda

```python
# Wrong: lambda with side effects
results = []
list(map(lambda x: results.append(x * 2), [1, 2, 3]))  # Don't do this

# Correct: use list comprehension or regular loop
results = [x * 2 for x in [1, 2, 3]]
# or
results = list(map(lambda x: x * 2, [1, 2, 3]))
```

### filter with None Filters Out 0

```python
# Pitfall: 0 is a falsy value, will be filtered by filter(None, ...)
numbers = [0, 1, 2, 0, 3, 0, 4]
result = list(filter(None, numbers))
print(result)  # [1, 2, 3, 4]  0s are filtered out!

# Correct: explicitly specify filter condition
result = list(filter(lambda x: x is not None, numbers))
print(result)  # [0, 1, 2, 0, 3, 0, 4]
```

### map with Unequal Length Sequences

```python
# Pitfall: map uses the shortest sequence
list1 = [1, 2, 3, 4, 5]
list2 = [10, 20, 30]

result = list(map(lambda x, y: x + y, list1, list2))
print(result)  # [11, 22, 33]  Lost the last two elements!

# To process all elements, use itertools.zip_longest
from itertools import zip_longest

result = list(map(
    lambda pair: pair[0] + pair[1] if pair[1] is not None else pair[0],
    zip_longest(list1, list2)
))
print(result)  # [11, 22, 33, 4, 5]
```

### reduce Empty Sequence Exception

```python
from functools import reduce

# Pitfall: empty sequence without initial value raises error
empty = []
# result = reduce(lambda x, y: x + y, empty)  # TypeError!

# Correct: provide initial value
result = reduce(lambda x, y: x + y, empty, 0)
print(result)  # 0
```

### Delayed Exception Due to Lazy Evaluation

```python
# Pitfall: exception is raised during iteration
def risky_transform(x):
    if x == 3:
        raise ValueError("Bad value!")
    return x * 2

# No error at creation time
result = map(risky_transform, [1, 2, 3, 4, 5])
print("Map created")  # Outputs normally

# Error occurs during iteration
# list(result)  # ValueError: Bad value!
```

### Closure Variable Pitfall

```python
# Pitfall: lambda captures variable reference, not value
multipliers = []
for i in range(5):
    multipliers.append(lambda x: x * i)

# All lambdas use the final value of i
print([m(2) for m in multipliers])  # [8, 8, 8, 8, 8]

# Correct: use default parameter to capture current value
multipliers = []
for i in range(5):
    multipliers.append(lambda x, i=i: x * i)

print([m(2) for m in multipliers])  # [0, 2, 4, 6, 8]
```

## Performance Considerations

### Benchmark Comparison

```python
import timeit
from functools import reduce

# Test data
numbers = list(range(10000))

# --- map vs list comprehension ---
def using_map():
    return list(map(lambda x: x ** 2, numbers))

def using_comprehension():
    return [x ** 2 for x in numbers]

def using_map_builtin():
    return list(map(str, numbers))

def using_comprehension_builtin():
    return [str(x) for x in numbers]

# With lambda, list comprehension is usually faster
# With built-in functions, map is usually faster or equivalent
```

### Performance Test Results (Typical Scenarios)

| Operation | map/filter | List Comprehension | Notes |
|-----------|-----------|-------------------|-------|
| Simple transform (lambda) | Slower | **Faster** | Lambda has extra overhead |
| Built-in function call | **Faster** | Slower | Avoids extra wrapping |
| Large dataset (lazy) | **Memory efficient** | High memory usage | Iterator generates on demand |
| Chained operations | Memory efficient | Creates new list each step | Iterator chain doesn't create intermediate lists |

### Memory Efficiency Comparison

```python
import sys

numbers = range(1000000)

# List comprehension: creates complete list immediately
list_comp = [x * 2 for x in numbers]
print(f"List: {sys.getsizeof(list_comp):,} bytes")  # ~8MB

# map: only creates iterator object
map_obj = map(lambda x: x * 2, numbers)
print(f"Map: {sys.getsizeof(map_obj):,} bytes")  # ~48 bytes

# Generator expression: also lazy
gen_exp = (x * 2 for x in numbers)
print(f"Generator: {sys.getsizeof(gen_exp):,} bytes")  # ~120 bytes
```

### Performance Advantage of Chained Operations

```python
# Scenario: processing large dataset
data = range(1000000)

# Method 1: list comprehensions (creates intermediate list each step)
def using_lists():
    step1 = [x * 2 for x in data]           # Creates list
    step2 = [x for x in step1 if x % 4 == 0] # Creates list
    step3 = [x + 1 for x in step2]           # Creates list
    return sum(step3)

# Method 2: map/filter chain (doesn't create intermediate lists)
def using_iterators():
    step1 = map(lambda x: x * 2, data)
    step2 = filter(lambda x: x % 4 == 0, step1)
    step3 = map(lambda x: x + 1, step2)
    return sum(step3)

# Method 3: generator expression chain
def using_generators():
    step1 = (x * 2 for x in data)
    step2 = (x for x in step1 if x % 4 == 0)
    step3 = (x + 1 for x in step2)
    return sum(step3)

# Methods 2 and 3 are equivalent in memory efficiency, both better than method 1
```

### reduce Performance Notes

```python
from functools import reduce

# String concatenation: reduce is inefficient
words = ['hello'] * 10000

# Slow: creates new string object each time
def slow_concat():
    return reduce(lambda x, y: x + y, words)

# Fast: use join
def fast_concat():
    return ''.join(words)

# List flattening: same issue
nested = [[i] for i in range(10000)]

# Slow: creates new list each time
def slow_flatten():
    return reduce(lambda x, y: x + y, nested)

# Fast: use list comprehension
def fast_flatten():
    return [item for sublist in nested for item in sublist]

# Faster: use itertools.chain
from itertools import chain
def fastest_flatten():
    return list(chain.from_iterable(nested))
```

### Optimization Recommendations

1. **Simple transformations**: prefer list comprehensions
2. **Built-in functions**: prefer map
3. **Large datasets**: use iterators/generators to stay lazy
4. **String concatenation**: use `''.join()` instead of reduce
5. **List flattening**: use `itertools.chain`
6. **Cumulative calculations**: consider `itertools.accumulate`

## Practical Scenarios

### Scenario 1: Data Cleaning Pipeline

```python
from functools import reduce

# Raw data
raw_data = [
    "  ALICE,25,engineer  ",
    "bob,30,designer",
    "  CHARLIE,35,  ",  # Invalid data
    "diana,28,manager",
    "",  # Empty line
    "  EVE,32,analyst",
]

def clean_record(line):
    """Clean a single record"""
    parts = line.strip().split(',')
    if len(parts) != 3 or not all(p.strip() for p in parts):
        return None
    name, age, role = parts
    return {
        'name': name.strip().title(),
        'age': int(age.strip()),
        'role': role.strip().lower()
    }

# Data cleaning pipeline
cleaned = list(filter(None, map(clean_record, filter(None, raw_data))))
print(cleaned)
# [{'name': 'Alice', 'age': 25, 'role': 'engineer'},
#  {'name': 'Bob', 'age': 30, 'role': 'designer'},
#  {'name': 'Diana', 'age': 28, 'role': 'manager'},
#  {'name': 'Eve', 'age': 32, 'role': 'analyst'}]
```

### Scenario 2: Log Analysis

```python
from functools import reduce
from datetime import datetime
from collections import defaultdict

# Simulated log data
logs = [
    "2024-01-15 10:30:00 INFO User login: alice",
    "2024-01-15 10:31:00 ERROR Database connection failed",
    "2024-01-15 10:32:00 INFO User login: bob",
    "2024-01-15 10:33:00 WARNING High memory usage",
    "2024-01-15 10:34:00 ERROR API timeout",
    "2024-01-15 10:35:00 INFO User logout: alice",
]

def parse_log(line):
    """Parse log line"""
    parts = line.split(' ', 3)
    return {
        'timestamp': f"{parts[0]} {parts[1]}",
        'level': parts[2],
        'message': parts[3]
    }

def is_error(log):
    """Check if error log"""
    return log['level'] == 'ERROR'

# Parse all logs
parsed_logs = list(map(parse_log, logs))

# Filter error logs
errors = list(filter(is_error, parsed_logs))
print(f"Error count: {len(errors)}")

# Group count by level
def count_by_level(acc, log):
    acc[log['level']] = acc.get(log['level'], 0) + 1
    return acc

level_counts = reduce(count_by_level, parsed_logs, {})
print(f"Counts by level: {level_counts}")
# {'INFO': 3, 'ERROR': 2, 'WARNING': 1}
```

### Scenario 3: E-commerce Order Processing

```python
from functools import reduce
from decimal import Decimal

# Order data
orders = [
    {
        'order_id': 'ORD001',
        'customer': 'Alice',
        'items': [
            {'product': 'Laptop', 'price': 999.99, 'quantity': 1},
            {'product': 'Mouse', 'price': 29.99, 'quantity': 2},
        ],
        'discount': 0.1  # 10% discount
    },
    {
        'order_id': 'ORD002',
        'customer': 'Bob',
        'items': [
            {'product': 'Keyboard', 'price': 79.99, 'quantity': 1},
            {'product': 'Monitor', 'price': 299.99, 'quantity': 2},
        ],
        'discount': 0.05  # 5% discount
    },
]

def calculate_order_total(order):
    """Calculate order total (with discount)"""
    subtotal = reduce(
        lambda acc, item: acc + item['price'] * item['quantity'],
        order['items'],
        0
    )
    return {
        **order,
        'subtotal': subtotal,
        'total': subtotal * (1 - order['discount'])
    }

def is_high_value(order, threshold=500):
    """Check if high value order"""
    return order['total'] >= threshold

# Process orders
processed_orders = list(map(calculate_order_total, orders))

# Filter high value orders
high_value_orders = list(filter(is_high_value, processed_orders))

# Calculate total revenue
total_revenue = reduce(
    lambda acc, order: acc + order['total'],
    processed_orders,
    0
)

print(f"Total revenue: ${total_revenue:.2f}")
print(f"High value orders: {len(high_value_orders)}")
```

### Scenario 4: Parallel Data Processing

```python
from functools import reduce
from multiprocessing import Pool
import math

def process_chunk(numbers):
    """Process data chunk"""
    # Complex computation
    return list(map(lambda x: math.sqrt(x) * math.log(x + 1), numbers))

def parallel_map(func, data, chunk_size=1000, workers=4):
    """Parallel map implementation"""
    # Chunking
    chunks = [data[i:i+chunk_size] for i in range(0, len(data), chunk_size)]

    # Parallel processing
    with Pool(workers) as pool:
        results = pool.map(func, chunks)

    # Merge results
    return reduce(lambda x, y: x + y, results, [])

# Usage
large_data = list(range(1, 100001))
results = parallel_map(process_chunk, large_data)
print(f"Processed {len(results)} items")
```

### Scenario 5: Configuration Merging

```python
from functools import reduce

# Multi-layer configuration
default_config = {
    'debug': False,
    'database': {
        'host': 'localhost',
        'port': 5432,
        'name': 'mydb'
    },
    'cache': {
        'enabled': True,
        'ttl': 3600
    }
}

env_config = {
    'debug': True,
    'database': {
        'host': 'prod-db.example.com'
    }
}

user_config = {
    'cache': {
        'ttl': 7200
    }
}

def deep_merge(base, override):
    """Deep merge dictionaries"""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

# Merge all configurations
final_config = reduce(deep_merge, [default_config, env_config, user_config])
print(final_config)
# Deep merged configuration
```

## Interview Key Points

### Basic Questions

**Q1: What do map, filter, reduce return in Python 3?**

A: `map` and `filter` return iterator objects (lazy evaluation), `reduce` returns a single accumulated value. In Python 2, `map` and `filter` returned lists.

**Q2: Why was reduce moved to the functools module in Python 3?**

A: Guido van Rossum believed that `reduce` has poor readability. Except for a few common uses (like sum, product), using explicit loops is usually clearer. Moving it to the `functools` module was to discourage overuse.

**Q3: What is lazy evaluation? What are its advantages?**

A: Lazy evaluation means expressions are computed only when their values are actually needed. Advantages include:
- Memory efficiency: no need to store all results at once
- Supports infinite sequences: can process infinite data streams
- Performance optimization: can terminate early for unneeded computations

### Advanced Questions

**Q4: When should you choose map/filter vs list comprehensions?**

A:
- Use list comprehensions: need list result, using lambda, simple expressions
- Use map/filter: existing function available, need lazy evaluation, processing multiple sequences
- Either works: depends on team code style and readability

**Q5: How to implement a pipeline (pipe) supporting multiple functions?**

```python
from functools import reduce

def pipe(*functions):
    """Create function pipeline"""
    def pipeline(value):
        return reduce(lambda v, f: f(v), functions, value)
    return pipeline

# Usage
process = pipe(
    lambda x: x * 2,
    lambda x: x + 10,
    lambda x: x ** 2
)
result = process(5)  # ((5 * 2) + 10) ** 2 = 400
```

**Q6: What are the time and space complexity of reduce?**

A: Time complexity O(n), space complexity O(1) (not counting function internal allocations). But if the accumulation operation itself is O(n) (like string concatenation), total complexity becomes O(n^2).

### Practical Questions

**Q7: Use map/filter/reduce to find the sum of squares of all even numbers in a list**

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Method 1: combined use
result = reduce(
    lambda acc, x: acc + x,
    map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, numbers)),
    0
)

# Method 2: list comprehension
result = sum(x ** 2 for x in numbers if x % 2 == 0)

print(result)  # 220
```

**Q8: How to handle empty sequence issues in reduce?**

```python
from functools import reduce

def safe_reduce(func, iterable, default=None):
    """Safe reduce implementation"""
    try:
        return reduce(func, iterable)
    except TypeError:
        if default is not None:
            return default
        raise

# Or always provide initial value
result = reduce(lambda x, y: x + y, [], 0)
```

**Q9: What common loop patterns can map replace?**

```python
# Type conversion
strings = ['1', '2', '3']
numbers = list(map(int, strings))  # vs [int(s) for s in strings]

# Method calling
words = ['hello', 'world']
upper = list(map(str.upper, words))  # vs [w.upper() for w in words]

# Multi-sequence operations
a = [1, 2, 3]
b = [4, 5, 6]
sums = list(map(lambda x, y: x + y, a, b))  # vs [x + y for x, y in zip(a, b)]

# Dictionary value extraction
data = [{'name': 'Alice'}, {'name': 'Bob'}]
names = list(map(lambda x: x['name'], data))  # vs [d['name'] for d in data]
```

## Further Reading

### Official Documentation

- [Python Built-in Functions - map](https://docs.python.org/3/library/functions.html#map)
- [Python Built-in Functions - filter](https://docs.python.org/3/library/functions.html#filter)
- [functools.reduce](https://docs.python.org/3/library/functools.html#functools.reduce)
- [itertools module](https://docs.python.org/3/library/itertools.html)

### Advanced Reading

- [Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html) - Python official functional programming guide
- [PEP 289 - Generator Expressions](https://peps.python.org/pep-0289/) - Generator expressions proposal
- [PEP 202 - List Comprehensions](https://peps.python.org/pep-0202/) - List comprehensions proposal

### Related Tool Libraries

- [toolz](https://toolz.readthedocs.io/) - Functional programming toolkit
- [more-itertools](https://more-itertools.readthedocs.io/) - itertools extensions
- [fn.py](https://github.com/kachayev/fn.py) - Python functional programming library

### Recommended Books

- "Fluent Python" - Luciano Ramalho: In-depth coverage of Python functional programming features
- "Functional Programming in Python" - David Mertz: O'Reilly free ebook
