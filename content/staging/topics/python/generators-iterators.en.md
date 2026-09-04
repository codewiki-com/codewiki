---
title: Python Generators and Iterators
description: Deep dive into Python iterator protocol, generator functions, yield, and itertools
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - Generators
  - Iterators
  - yield
status: imported
origin: old/src/content/docs/python/generators-iterators.en.md
divergence: 0.239
issues: []
legacy:
  category: Python
  subcategory: Functional Programming
  order: 9
  lastUpdated: 2026-01-07
---

Generators and iterators are powerful features in Python for efficiently processing sequence data. They support lazy evaluation, save memory, and are particularly suitable for handling large datasets or infinite sequences.

## Iterator Protocol

The iterator protocol defines two methods: `__iter__()` and `__next__()`.

### Basic Concepts

```python
# Difference between Iterable and Iterator
numbers = [1, 2, 3, 4, 5]  # Iterable

# Get an iterator
iterator = iter(numbers)  # Calls __iter__() method

# Use the iterator
print(next(iterator))  # 1
print(next(iterator))  # 2
print(next(iterator))  # 3

# Iterator raises StopIteration when exhausted
try:
    while True:
        print(next(iterator))
except StopIteration:
    print("Iterator exhausted")
```

### Iterator Characteristics

```python
# Iterators are single-use
my_list = [1, 2, 3]
it = iter(my_list)

# First iteration
for num in it:
    print(num)  # 1, 2, 3

# Second iteration - no output
for num in it:
    print(num)  # No output

# Iterators are themselves iterable
it = iter([1, 2, 3])
print(iter(it) is it)  # True - iterator's __iter__() returns itself

# Manual iteration
it = iter([10, 20, 30])
while True:
    try:
        value = next(it)
        print(value)
    except StopIteration:
        break
```

## Creating Custom Iterators

Create custom iterator classes by implementing the iterator protocol.

### Simple Iterator

```python
class Counter:
    """Counter iterator"""
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.end:
            raise StopIteration
        self.current += 1
        return self.current - 1

# Using the custom iterator
counter = Counter(1, 5)
for num in counter:
    print(num)  # 1, 2, 3, 4

# Manual iteration
counter = Counter(10, 13)
print(next(counter))  # 10
print(next(counter))  # 11
print(next(counter))  # 12
```

### Fibonacci Sequence Iterator

```python
class Fibonacci:
    """Iterator for generating Fibonacci sequence"""
    def __init__(self, max_count=None):
        self.max_count = max_count
        self.count = 0
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self):
        if self.max_count is not None and self.count >= self.max_count:
            raise StopIteration

        self.count += 1
        self.a, self.b = self.b, self.a + self.b
        return self.a

# Generate first 10 Fibonacci numbers
fib = Fibonacci(10)
print(list(fib))  # [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

# Infinite Fibonacci sequence
fib_infinite = Fibonacci()
for i, num in enumerate(fib_infinite):
    if i >= 5:
        break
    print(num)  # 1, 1, 2, 3, 5
```

### File Line Iterator

```python
class FileLineIterator:
    """Iterator for reading file line by line"""
    def __init__(self, filename):
        self.filename = filename
        self.file = None

    def __iter__(self):
        self.file = open(self.filename, 'r', encoding='utf-8')
        return self

    def __next__(self):
        if self.file is None:
            raise StopIteration

        line = self.file.readline()
        if not line:
            self.file.close()
            raise StopIteration

        return line.strip()

    def __del__(self):
        if self.file and not self.file.closed:
            self.file.close()

# Usage example
# for line in FileLineIterator('data.txt'):
#     print(line)
```

## Generator Functions

Generator functions use the `yield` keyword and automatically implement the iterator protocol with more concise syntax.

### Basic Generator

```python
def simple_generator():
    """Simple generator example"""
    print("Starting generation")
    yield 1
    print("Continuing generation")
    yield 2
    print("Final generation")
    yield 3
    print("Generation complete")

# Using the generator
gen = simple_generator()
print(type(gen))  # <class 'generator'>

print(next(gen))  # Starting generation -> 1
print(next(gen))  # Continuing generation -> 2
print(next(gen))  # Final generation -> 3
# print(next(gen))  # Generation complete -> StopIteration
```

### Counter Generator

```python
def counter(start, end):
    """Counter generator"""
    current = start
    while current < end:
        yield current
        current += 1

# Using the generator
for num in counter(1, 5):
    print(num)  # 1, 2, 3, 4

# Generator can be converted to list
numbers = list(counter(10, 15))
print(numbers)  # [10, 11, 12, 13, 14]
```

### Fibonacci Generator

```python
def fibonacci(max_count=None):
    """Fibonacci sequence generator"""
    a, b = 0, 1
    count = 0

    while max_count is None or count < max_count:
        a, b = b, a + b
        yield a
        count += 1

# Generate first 10 numbers
print(list(fibonacci(10)))

# Using generator for lazy evaluation
fib_gen = fibonacci()
for i, num in enumerate(fib_gen):
    if i >= 5:
        break
    print(num)
```

### Prime Number Generator

```python
def is_prime(n):
    """Check if number is prime"""
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

def prime_generator(max_num=None):
    """Generator for prime numbers"""
    num = 2
    while max_num is None or num <= max_num:
        if is_prime(num):
            yield num
        num += 1

# Generate all primes less than 30
primes = list(prime_generator(30))
print(primes)  # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

# Generate first 10 primes
prime_gen = prime_generator()
first_ten = [next(prime_gen) for _ in range(10)]
print(first_ten)  # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```

## The yield Keyword

The `yield` keyword turns a function into a generator, supporting pause and resume execution.

### How yield Works

```python
def demo_yield():
    """Demonstrate yield execution flow"""
    print("First execution")
    value1 = yield 1
    print(f"Received: {value1}")

    print("Second execution")
    value2 = yield 2
    print(f"Received: {value2}")

    print("Third execution")
    yield 3

# Basic usage
gen = demo_yield()
print(next(gen))  # First execution -> 1
print(next(gen))  # Received: None, Second execution -> 2
print(next(gen))  # Received: None, Third execution -> 3

# Using send() to send values
gen = demo_yield()
print(gen.send(None))  # First call must send None -> 1
print(gen.send("Hello"))  # Received: Hello, Second execution -> 2
print(gen.send("World"))  # Received: World, Third execution -> 3
```

### Generator Methods

```python
def generator_methods():
    """Demonstrate various generator methods"""
    try:
        for i in range(10):
            received = yield i
            if received:
                print(f"Received: {received}")
    except GeneratorExit:
        print("Generator closed")
    finally:
        print("Cleanup resources")

# send() - Send value to generator
gen = generator_methods()
print(next(gen))  # 0
print(gen.send("Test"))  # Received: Test -> 1

# throw() - Throw exception in generator
gen = generator_methods()
next(gen)
try:
    gen.throw(ValueError, "Error message")
except ValueError as e:
    print(f"Caught exception: {e}")

# close() - Close generator
gen = generator_methods()
next(gen)
gen.close()  # Generator closed, Cleanup resources
```

### Two-Way Communication Generator

```python
def running_average():
    """Generator for calculating running average"""
    total = 0
    count = 0
    average = None

    while True:
        value = yield average
        total += value
        count += 1
        average = total / count

# Using generator to calculate average
avg_gen = running_average()
next(avg_gen)  # Start the generator

print(avg_gen.send(10))  # 10.0
print(avg_gen.send(20))  # 15.0
print(avg_gen.send(30))  # 20.0
print(avg_gen.send(40))  # 25.0
```

### Coroutine-Style Generator

```python
def grep_generator(pattern):
    """Search for lines containing a specific pattern"""
    print(f"Starting search for lines containing '{pattern}'")
    while True:
        line = yield
        if pattern in line:
            print(f"Found match: {line}")

# Using the coroutine
grep = grep_generator("Python")
next(grep)  # Start the coroutine

grep.send("I love Python")  # Found match: I love Python
grep.send("Java is also good")  # No output
grep.send("Python is powerful")  # Found match: Python is powerful
```

## The yield from Expression

`yield from` is used to delegate to another generator or iterable.

### Basic Usage

```python
def sub_generator():
    """Sub-generator"""
    yield 1
    yield 2
    yield 3

def main_generator_without_yield_from():
    """Without using yield from"""
    for value in sub_generator():
        yield value

def main_generator_with_yield_from():
    """Using yield from"""
    yield from sub_generator()

# Both produce the same result
print(list(main_generator_without_yield_from()))  # [1, 2, 3]
print(list(main_generator_with_yield_from()))  # [1, 2, 3]
```

### Chaining Multiple Generators

```python
def gen1():
    yield from range(1, 4)

def gen2():
    yield from range(4, 7)

def gen3():
    yield from range(7, 10)

def chain_generators():
    """Chain multiple generators"""
    yield from gen1()
    yield from gen2()
    yield from gen3()

print(list(chain_generators()))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### Flattening Nested Structures

```python
def flatten(nested_list):
    """Recursively flatten nested lists"""
    for item in nested_list:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item

# Flatten nested list
nested = [1, [2, 3, [4, 5]], 6, [7, [8, 9]]]
flat = list(flatten(nested))
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# More complex example
complex_nested = [1, [2, [3, [4, [5]]]]]
print(list(flatten(complex_nested)))  # [1, 2, 3, 4, 5]
```

### Tree Traversal

```python
class TreeNode:
    """Tree node class"""
    def __init__(self, value, children=None):
        self.value = value
        self.children = children or []

def traverse_tree(node):
    """Depth-first tree traversal"""
    yield node.value
    for child in node.children:
        yield from traverse_tree(child)

# Build tree structure
tree = TreeNode(1, [
    TreeNode(2, [
        TreeNode(4),
        TreeNode(5)
    ]),
    TreeNode(3, [
        TreeNode(6),
        TreeNode(7, [
            TreeNode(8)
        ])
    ])
])

# Traverse tree
print(list(traverse_tree(tree)))  # [1, 2, 4, 5, 3, 6, 7, 8]
```

### Return Value of yield from

```python
def sub_gen():
    """Sub-generator with return value"""
    yield 1
    yield 2
    return "Sub-generator complete"

def main_gen():
    """Main generator receiving return value"""
    result = yield from sub_gen()
    print(f"Received return value: {result}")
    yield 3

# Using the generator
gen = main_gen()
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # Received return value: Sub-generator complete -> 3
```

## Generator Expressions

Generator expressions are a concise syntax for creating generators, similar to list comprehensions but using parentheses.

### Basic Syntax

```python
# List comprehension - creates entire list immediately
squares_list = [x**2 for x in range(10)]
print(type(squares_list))  # <class 'list'>
print(squares_list)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Generator expression - lazy evaluation
squares_gen = (x**2 for x in range(10))
print(type(squares_gen))  # <class 'generator'>
print(list(squares_gen))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

### Memory Efficiency Comparison

```python
import sys

# List comprehension - uses large amount of memory
large_list = [x for x in range(1000000)]
print(f"List size: {sys.getsizeof(large_list)} bytes")

# Generator expression - uses minimal memory
large_gen = (x for x in range(1000000))
print(f"Generator size: {sys.getsizeof(large_gen)} bytes")

# Output:
# List size: 8000056 bytes
# Generator size: 128 bytes
```

### Conditional Filtering

```python
# Even number generator
evens = (x for x in range(20) if x % 2 == 0)
print(list(evens))  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# Multiple condition filtering
numbers = (x for x in range(50) if x % 2 == 0 if x % 3 == 0)
print(list(numbers))  # [0, 6, 12, 18, 24, 30, 36, 42, 48]

# String processing
text = "Hello World Python"
uppercase = (char.upper() for char in text if char.isalpha())
print(''.join(uppercase))  # HELLOWORLDPYTHON
```

### Nested Generator Expressions

```python
# Cartesian product
pairs = ((x, y) for x in range(3) for y in range(3))
print(list(pairs))
# [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]

# Matrix flattening
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = (num for row in matrix for num in row)
print(list(flattened))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Conditional Cartesian product
valid_pairs = ((x, y) for x in range(5) for y in range(5) if x + y == 5)
print(list(valid_pairs))  # [(0, 5), (1, 4), (2, 3), (3, 2), (4, 1)]
```

### Practical Examples

```python
# File processing
def read_large_file(filename):
    """Use generator to read large file"""
    with open(filename, 'r', encoding='utf-8') as f:
        return (line.strip() for line in f)

# Data transformation pipeline
numbers = range(1, 11)
squared = (x**2 for x in numbers)
filtered = (x for x in squared if x > 20)
print(list(filtered))  # [25, 36, 49, 64, 81, 100]

# Line-by-line log processing
def process_log_lines(filename):
    """Process log file"""
    with open(filename, 'r', encoding='utf-8') as f:
        # Filter empty lines and comments
        lines = (line.strip() for line in f if line.strip() and not line.startswith('#'))
        # Extract error information
        errors = (line for line in lines if 'ERROR' in line)
        return errors

# Infinite sequence
def infinite_sequence():
    """Infinite sequence generator"""
    num = 0
    while True:
        yield num
        num += 1

# Get first 10
seq = infinite_sequence()
first_ten = [next(seq) for _ in range(10)]
print(first_ten)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## The itertools Module

`itertools` provides powerful iterator tools for efficient iteration operations.

### Infinite Iterators

```python
import itertools

# count() - Infinite counting
counter = itertools.count(start=10, step=2)
print([next(counter) for _ in range(5)])  # [10, 12, 14, 16, 18]

# cycle() - Cycle iteration
colors = itertools.cycle(['red', 'green', 'blue'])
print([next(colors) for _ in range(7)])  # ['red', 'green', 'blue', 'red', 'green', 'blue', 'red']

# repeat() - Repeat element
repeater = itertools.repeat('Python', 3)
print(list(repeater))  # ['Python', 'Python', 'Python']

# repeat with map
squares = list(map(pow, range(5), itertools.repeat(2)))
print(squares)  # [0, 1, 4, 9, 16]
```

### Combinatoric Iterators

```python
import itertools

# chain() - Connect multiple iterators
chain1 = itertools.chain([1, 2], [3, 4], [5, 6])
print(list(chain1))  # [1, 2, 3, 4, 5, 6]

# chain.from_iterable() - Create chain from nested sequence
chain2 = itertools.chain.from_iterable([[1, 2], [3, 4], [5, 6]])
print(list(chain2))  # [1, 2, 3, 4, 5, 6]

# compress() - Filter by selector
data = ['A', 'B', 'C', 'D', 'E']
selectors = [1, 0, 1, 0, 1]
filtered = itertools.compress(data, selectors)
print(list(filtered))  # ['A', 'C', 'E']

# dropwhile() - Drop prefix satisfying condition
numbers = [1, 3, 5, 7, 2, 4, 6]
result = itertools.dropwhile(lambda x: x < 5, numbers)
print(list(result))  # [5, 7, 2, 4, 6]

# takewhile() - Keep prefix satisfying condition
numbers = [1, 3, 5, 7, 2, 4, 6]
result = itertools.takewhile(lambda x: x < 5, numbers)
print(list(result))  # [1, 3]

# filterfalse() - Filter elements not satisfying condition
numbers = range(10)
odds = itertools.filterfalse(lambda x: x % 2 == 0, numbers)
print(list(odds))  # [1, 3, 5, 7, 9]

# islice() - Slice iterator
numbers = itertools.count()
first_ten = itertools.islice(numbers, 10)
print(list(first_ten))  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Skip first 5, take next 5
numbers = range(20)
sliced = itertools.islice(numbers, 5, 10)
print(list(sliced))  # [5, 6, 7, 8, 9]
```

### Permutations and Combinations

```python
import itertools

# product() - Cartesian product
colors = ['red', 'blue']
sizes = ['S', 'M', 'L']
products = itertools.product(colors, sizes)
print(list(products))
# [('red', 'S'), ('red', 'M'), ('red', 'L'), ('blue', 'S'), ('blue', 'M'), ('blue', 'L')]

# Self Cartesian product
pairs = itertools.product(range(3), repeat=2)
print(list(pairs))
# [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]

# permutations() - Permutations
items = ['A', 'B', 'C']
perms = itertools.permutations(items, 2)
print(list(perms))
# [('A', 'B'), ('A', 'C'), ('B', 'A'), ('B', 'C'), ('C', 'A'), ('C', 'B')]

# Full permutations
full_perms = itertools.permutations(items)
print(list(full_perms))
# [('A', 'B', 'C'), ('A', 'C', 'B'), ('B', 'A', 'C'),
#  ('B', 'C', 'A'), ('C', 'A', 'B'), ('C', 'B', 'A')]

# combinations() - Combinations (without replacement)
items = ['A', 'B', 'C', 'D']
combs = itertools.combinations(items, 2)
print(list(combs))
# [('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]

# combinations_with_replacement() - Combinations (with replacement)
combs_rep = itertools.combinations_with_replacement(['A', 'B', 'C'], 2)
print(list(combs_rep))
# [('A', 'A'), ('A', 'B'), ('A', 'C'), ('B', 'B'), ('B', 'C'), ('C', 'C')]
```

### Grouping and Accumulation

```python
import itertools

# groupby() - Grouping
data = [
    {'name': 'Zhang', 'age': 25},
    {'name': 'Li', 'age': 25},
    {'name': 'Wang', 'age': 30},
    {'name': 'Zhao', 'age': 30},
]

# Group by age (requires sorting first)
sorted_data = sorted(data, key=lambda x: x['age'])
for age, group in itertools.groupby(sorted_data, key=lambda x: x['age']):
    print(f"Age {age}: {list(group)}")
# Age 25: [{'name': 'Zhang', 'age': 25}, {'name': 'Li', 'age': 25}]
# Age 30: [{'name': 'Wang', 'age': 30}, {'name': 'Zhao', 'age': 30}]

# String grouping
text = "aaabbcccdddd"
for char, group in itertools.groupby(text):
    print(f"{char}: {len(list(group))}")
# a: 3, b: 2, c: 3, d: 4

# accumulate() - Cumulative calculation
numbers = [1, 2, 3, 4, 5]
accumulated = itertools.accumulate(numbers)
print(list(accumulated))  # [1, 3, 6, 10, 15]

# Using custom function
import operator
accumulated_product = itertools.accumulate(numbers, operator.mul)
print(list(accumulated_product))  # [1, 2, 6, 24, 120]

# Calculate running maximum
numbers = [5, 2, 8, 3, 9, 1]
max_sequence = itertools.accumulate(numbers, max)
print(list(max_sequence))  # [5, 5, 8, 8, 9, 9]
```

### Other Useful Iterators

```python
import itertools

# tee() - Duplicate iterator
original = iter([1, 2, 3, 4, 5])
it1, it2, it3 = itertools.tee(original, 3)

print(list(it1))  # [1, 2, 3, 4, 5]
print(list(it2))  # [1, 2, 3, 4, 5]
print(list(it3))  # [1, 2, 3, 4, 5]

# zip_longest() - Pad to longest sequence
from itertools import zip_longest

list1 = [1, 2, 3]
list2 = ['a', 'b', 'c', 'd', 'e']
zipped = zip_longest(list1, list2, fillvalue=0)
print(list(zipped))
# [(1, 'a'), (2, 'b'), (3, 'c'), (0, 'd'), (0, 'e')]

# starmap() - Unpack arguments
pairs = [(2, 5), (3, 2), (10, 3)]
powers = itertools.starmap(pow, pairs)
print(list(powers))  # [32, 9, 1000]

# Equivalent to:
powers_manual = [pow(x, y) for x, y in pairs]
print(powers_manual)  # [32, 9, 1000]

# pairwise() - Pairwise iteration (Python 3.10+)
# data = [1, 2, 3, 4, 5]
# pairs = itertools.pairwise(data)
# print(list(pairs))  # [(1, 2), (2, 3), (3, 4), (4, 5)]
```

### Practical Application Examples

```python
import itertools

# Sliding window
def sliding_window(iterable, n):
    """Create sliding window of size n"""
    iterators = itertools.tee(iterable, n)
    for i, it in enumerate(iterators):
        for _ in range(i):
            next(it, None)
    return zip(*iterators)

data = [1, 2, 3, 4, 5, 6]
windows = sliding_window(data, 3)
print(list(windows))  # [(1, 2, 3), (2, 3, 4), (3, 4, 5), (4, 5, 6)]

# Batch data processing
def batch_data(iterable, batch_size):
    """Process data in batches"""
    iterator = iter(iterable)
    while True:
        batch = list(itertools.islice(iterator, batch_size))
        if not batch:
            break
        yield batch

data = range(10)
for batch in batch_data(data, 3):
    print(batch)
# [0, 1, 2]
# [3, 4, 5]
# [6, 7, 8]
# [9]

# Unique elements generator
def unique_everseen(iterable, key=None):
    """Deduplicate while preserving order"""
    seen = set()
    seen_add = seen.add
    if key is None:
        for element in itertools.filterfalse(seen.__contains__, iterable):
            seen_add(element)
            yield element
    else:
        for element in iterable:
            k = key(element)
            if k not in seen:
                seen_add(k)
                yield element

data = [1, 2, 3, 2, 4, 1, 5, 3]
print(list(unique_everseen(data)))  # [1, 2, 3, 4, 5]

# Round-robin scheduling
def roundrobin(*iterables):
    """Alternate values from multiple iterators"""
    num_active = len(iterables)
    nexts = itertools.cycle(iter(it).__next__ for it in iterables)
    while num_active:
        try:
            for next_func in nexts:
                yield next_func()
        except StopIteration:
            num_active -= 1
            nexts = itertools.cycle(itertools.islice(nexts, num_active))

result = roundrobin('ABC', '12', 'xyz')
print(list(result))  # ['A', '1', 'x', 'B', '2', 'y', 'C', 'z']

# Chunked reading
def chunked(iterable, n):
    """Split iterator into fixed-size chunks"""
    it = iter(iterable)
    while True:
        chunk = tuple(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk

data = range(10)
for chunk in chunked(data, 3):
    print(chunk)
# (0, 1, 2)
# (3, 4, 5)
# (6, 7, 8)
# (9,)
```

## Best Practices

### Choose the Right Tool

```python
# Not recommended: Using list for large data
def process_large_file_bad(filename):
    with open(filename) as f:
        lines = f.readlines()  # Reads entire file into memory
        return [line.strip().upper() for line in lines]

# Recommended: Using generator
def process_large_file_good(filename):
    with open(filename) as f:
        for line in f:  # Line by line reading
            yield line.strip().upper()

# Recommended: Using generator expression
def process_large_file_better(filename):
    with open(filename) as f:
        return (line.strip().upper() for line in f)
```

### Avoid Iterating Generator Multiple Times

```python
# Wrong example
gen = (x**2 for x in range(10))
print(list(gen))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
print(list(gen))  # [] - Generator exhausted!

# Correct approach: Use itertools.tee
import itertools
gen = (x**2 for x in range(10))
gen1, gen2 = itertools.tee(gen, 2)
print(list(gen1))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
print(list(gen2))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Or: Convert to list
gen = (x**2 for x in range(10))
data = list(gen)
print(data)  # Can be used multiple times
print(data)  # Can be used multiple times
```

### Exception Handling in Generators

```python
def safe_generator(data):
    """Generator with exception handling"""
    try:
        for item in data:
            if item < 0:
                raise ValueError(f"Negative numbers not allowed: {item}")
            yield item * 2
    except ValueError as e:
        print(f"Error: {e}")
        return
    finally:
        print("Generator cleanup")

# Usage
data = [1, 2, 3, -1, 5]
gen = safe_generator(data)
print(list(gen))
# Error: Negative numbers not allowed: -1
# Generator cleanup
# [2, 4, 6]
```

### Generator Chain Calls

```python
def pipeline_example():
    """Generator pipeline for data processing"""
    # Data source
    def read_data():
        for i in range(100):
            yield i

    # Filter 1: Only even numbers
    def filter_even(numbers):
        for n in numbers:
            if n % 2 == 0:
                yield n

    # Filter 2: Only divisible by 3
    def filter_divisible_by_3(numbers):
        for n in numbers:
            if n % 3 == 0:
                yield n

    # Transformer: Square
    def square(numbers):
        for n in numbers:
            yield n ** 2

    # Build pipeline
    data = read_data()
    data = filter_even(data)
    data = filter_divisible_by_3(data)
    data = square(data)

    return list(data)

result = pipeline_example()
print(result)  # [0, 36, 144, 324, 576, 900, 1296, 1764, 2304, 2916, ...]
```

### Memory Efficiency Comparison

```python
import sys
import time

# List approach
def sum_squares_list(n):
    return sum([x**2 for x in range(n)])

# Generator approach
def sum_squares_gen(n):
    return sum(x**2 for x in range(n))

# Performance test
n = 1000000

# Test list
start = time.time()
result1 = sum_squares_list(n)
time1 = time.time() - start

# Test generator
start = time.time()
result2 = sum_squares_gen(n)
time2 = time.time() - start

print(f"List approach: {time1:.4f} seconds")
print(f"Generator approach: {time2:.4f} seconds")
print(f"Results match: {result1 == result2}")

# Memory usage
list_obj = [x for x in range(10000)]
gen_obj = (x for x in range(10000))

print(f"\nList memory: {sys.getsizeof(list_obj)} bytes")
print(f"Generator memory: {sys.getsizeof(gen_obj)} bytes")
```

### Useful Generator Patterns

```python
# Generator with return value stats
def process_with_stats(data):
    """Generator with statistics"""
    count = 0
    total = 0

    for item in data:
        if item > 0:
            yield item
            count += 1
            total += item

    # Return statistics
    return {'count': count, 'total': total, 'average': total / count if count else 0}

# Getting return value requires handling StopIteration
gen = process_with_stats([1, 2, -1, 3, 4, -2, 5])
results = list(gen)
print(f"Processed results: {results}")  # [1, 2, 3, 4, 5]

# Context manager generator
from contextlib import contextmanager

@contextmanager
def timer_context(name):
    """Timer context manager"""
    start = time.time()
    print(f"{name} starting")
    yield
    elapsed = time.time() - start
    print(f"{name} complete, took {elapsed:.4f} seconds")

# Usage
with timer_context("Data processing"):
    time.sleep(1)
    print("Processing...")

# Decorator generator
def coroutine(func):
    """Decorator to auto-start coroutine"""
    def wrapper(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)  # Auto-start
        return gen
    return wrapper

@coroutine
def accumulator():
    """Accumulator coroutine"""
    total = 0
    while True:
        value = yield total
        total += value

acc = accumulator()
print(acc.send(10))  # 10
print(acc.send(20))  # 30
print(acc.send(30))  # 60
```

### Common Pitfalls

```python
# Pitfall 1: Closure issues in generator expressions
# Wrong
funcs = [(lambda: i) for i in range(5)]
print([f() for f in funcs])  # [4, 4, 4, 4, 4] - Wrong!

# Correct
funcs = [(lambda i=i: i) for i in range(5)]
print([f() for f in funcs])  # [0, 1, 2, 3, 4] - Correct!

# Pitfall 2: Premature generator consumption
def create_gen():
    return (x for x in range(5))

gen = create_gen()
print(3 in gen)  # True - But consumed first 4 elements!
print(list(gen))  # [4] - Only last one remaining!

# Pitfall 3: Modifying source during iteration
data = [1, 2, 3, 4, 5]
gen = (x for x in data)
data.append(6)  # Modified original data
print(list(gen))  # [1, 2, 3, 4, 5, 6] - Generator sees the modification!
```

## Summary

Generators and iterators are powerful tools for processing sequence data in Python:

1. **Iterator Protocol**: Implement custom iterators via `__iter__()` and `__next__()`
2. **Generator Functions**: Use `yield` to create concise iterators
3. **The yield Keyword**: Supports pause and resume, enabling coroutines
4. **yield from**: Delegate to sub-generators, simplifying code
5. **Generator Expressions**: Memory-efficient lazy evaluation
6. **itertools**: Provides rich iterator utility functions

Choosing the right tool enables you to write efficient and elegant Python code.

## References

- [Python Official Documentation - Iterators](https://docs.python.org/3/tutorial/classes.html#iterators)
- [Python Official Documentation - Generators](https://docs.python.org/3/tutorial/classes.html#generators)
- [PEP 255 - Simple Generators](https://www.python.org/dev/peps/pep-0255/)
- [PEP 342 - Coroutines via Enhanced Generators](https://www.python.org/dev/peps/pep-0342/)
- [Python itertools Documentation](https://docs.python.org/3/library/itertools.html)
