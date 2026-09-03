---
title: Python List Comprehensions and Data Structures
description: Master Python list, dict, set comprehensions and advanced operations
track: python
section: basics
difficulty: intermediate
tags:
  - Python
  - List Comprehensions
  - Data Structures
  - Collections
status: imported
origin: old/src/content/docs/python/list-comprehensions.en.md
divergence: 0.252
issues: []
legacy:
  category: Python
  subcategory: Data Structures
  order: 4
  lastUpdated: 2026-01-07
---

List comprehensions are one of Python's most elegant features, providing a concise way to create lists, dictionaries, and sets. We'll cover comprehensions in depth, from basic to advanced patterns and performance considerations.

## Introduction to Comprehensions

Comprehensions provide a concise syntax for creating collections by iterating over iterables and optionally filtering elements. They are more readable and often faster than equivalent loop-based code.

### Basic Syntax

```python
# General comprehension syntax
[expression for item in iterable if condition]
```

**Components:**
- **expression**: What to include in the new collection
- **item**: Variable representing each element
- **iterable**: Source collection to iterate over
- **condition**: Optional filter (can be omitted)

## List Comprehensions

List comprehensions create new lists by transforming and filtering existing iterables.

### Basic List Comprehensions

```python
# Traditional approach
squares = []
for x in range(10):
    squares.append(x ** 2)

# List comprehension
squares = [x ** 2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# String manipulation
names = ["alice", "bob", "charlie"]
capitalized = [name.capitalize() for name in names]
# ['Alice', 'Bob', 'Charlie']

# Method calls
words = ["  hello  ", "  world  "]
cleaned = [word.strip() for word in words]
# ['hello', 'world']
```

### List Comprehensions with Conditionals

```python
# Filter even numbers
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = [x for x in numbers if x % 2 == 0]
# [2, 4, 6, 8, 10]

# Filter and transform
words = ["hello", "world", "python", "code"]
long_upper = [word.upper() for word in words if len(word) > 4]
# ['HELLO', 'WORLD', 'PYTHON']

# Multiple conditions
values = range(20)
filtered = [x for x in values if x % 2 == 0 if x % 3 == 0]
# [0, 6, 12, 18] (divisible by both 2 and 3)
```

### Conditional Expressions (if-else)

```python
# if-else in expression (not filter)
numbers = [1, 2, 3, 4, 5]
labels = ["even" if x % 2 == 0 else "odd" for x in numbers]
# ['odd', 'even', 'odd', 'even', 'odd']

# Transform based on condition
prices = [10, 25, 5, 30, 15]
discounted = [price * 0.9 if price > 20 else price for price in prices]
# [10, 22.5, 5, 27.0, 15]

# Complex conditional logic
scores = [45, 67, 89, 92, 55, 78]
grades = [
    'A' if score >= 90
    else 'B' if score >= 80
    else 'C' if score >= 70
    else 'D' if score >= 60
    else 'F'
    for score in scores
]
# ['F', 'D', 'B', 'A', 'D', 'C']
```

### Working with Multiple Iterables

```python
# Pairing elements with zip
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
people = [f"{name} is {age}" for name, age in zip(names, ages)]
# ['Alice is 25', 'Bob is 30', 'Charlie is 35']

# Cartesian product
colors = ["red", "blue"]
sizes = ["S", "M", "L"]
products = [f"{color}-{size}" for color in colors for size in sizes]
# ['red-S', 'red-M', 'red-L', 'blue-S', 'blue-M', 'blue-L']

# Flattening a matrix
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Dictionary Comprehensions

Dictionary comprehensions create dictionaries using a similar syntax to list comprehensions.

### Basic Dictionary Comprehensions

```python
# Create dictionary from lists
keys = ["a", "b", "c"]
values = [1, 2, 3]
d = {k: v for k, v in zip(keys, values)}
# {'a': 1, 'b': 2, 'c': 3}

# Transform keys and values
numbers = [1, 2, 3, 4, 5]
squares_dict = {x: x ** 2 for x in numbers}
# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# String manipulation
words = ["hello", "world", "python"]
lengths = {word: len(word) for word in words}
# {'hello': 5, 'world': 5, 'python': 6}
```

### Filtering Dictionaries

```python
# Filter existing dictionary
prices = {"apple": 0.5, "banana": 0.3, "orange": 0.8, "grape": 1.2}
expensive = {k: v for k, v in prices.items() if v > 0.5}
# {'orange': 0.8, 'grape': 1.2}

# Transform and filter
data = {"a": 1, "b": 2, "c": 3, "d": 4, "e": 5}
filtered_squared = {k: v ** 2 for k, v in data.items() if v % 2 == 0}
# {'b': 4, 'd': 16}

# Case transformation
original = {"Name": "Alice", "Age": 25, "City": "NYC"}
lowercase = {k.lower(): v for k, v in original.items()}
# {'name': 'Alice', 'age': 25, 'city': 'NYC'}
```

### Advanced Dictionary Patterns

```python
# Swap keys and values
original = {"a": 1, "b": 2, "c": 3}
swapped = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b', 3: 'c'}

# Group items by property
words = ["apple", "banana", "avocado", "blueberry", "apricot"]
by_first_letter = {}
for word in words:
    first_letter = word[0]
    if first_letter not in by_first_letter:
        by_first_letter[first_letter] = []
    by_first_letter[first_letter].append(word)

# Using dict comprehension with setdefault
by_first = {
    letter: [w for w in words if w[0] == letter]
    for letter in set(w[0] for w in words)
}
# {'a': ['apple', 'avocado', 'apricot'], 'b': ['banana', 'blueberry']}

# Merge dictionaries with transformation
dict1 = {"a": 1, "b": 2}
dict2 = {"c": 3, "d": 4}
merged = {k: v * 10 for d in [dict1, dict2] for k, v in d.items()}
# {'a': 10, 'b': 20, 'c': 30, 'd': 40}
```

### Nested Dictionary Comprehensions

```python
# Create nested dictionary
matrix_dict = {
    i: {j: i * j for j in range(1, 4)}
    for i in range(1, 4)
}
# {1: {1: 1, 2: 2, 3: 3}, 2: {1: 2, 2: 4, 3: 6}, 3: {1: 3, 2: 6, 3: 9}}

# Transform nested structure
data = {
    "user1": {"name": "Alice", "age": 25},
    "user2": {"name": "Bob", "age": 30}
}
names_only = {k: v["name"] for k, v in data.items()}
# {'user1': 'Alice', 'user2': 'Bob'}
```

## Set Comprehensions

Set comprehensions create sets, automatically handling uniqueness.

### Basic Set Comprehensions

```python
# Remove duplicates with transformation
numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
unique_squares = {x ** 2 for x in numbers}
# {1, 4, 9, 16}

# Extract unique characters
words = ["hello", "world"]
unique_chars = {char for word in words for char in word}
# {'h', 'e', 'l', 'o', 'w', 'r', 'd'}

# Filter and deduplicate
values = [1, -2, 3, -4, 5, -6, 2, 3]
positive_unique = {x for x in values if x > 0}
# {1, 2, 3, 5}
```

### Advanced Set Operations

```python
# Extract domains from emails
emails = ["alice@gmail.com", "bob@yahoo.com", "charlie@gmail.com"]
domains = {email.split("@")[1] for email in emails}
# {'gmail.com', 'yahoo.com'}

# Find unique word lengths
text = "the quick brown fox jumps over the lazy dog"
word_lengths = {len(word) for word in text.split()}
# {3, 5, 4} (unique lengths)

# Conditional set comprehension
numbers = range(20)
special = {x for x in numbers if x % 2 == 0 and x % 3 == 0}
# {0, 6, 12, 18}
```

## Generator Expressions

Generator expressions are similar to list comprehensions but create generators instead of lists, providing memory efficiency for large datasets.

### Basic Generator Expressions

```python
# Syntax: use parentheses instead of brackets
squares_gen = (x ** 2 for x in range(10))
# <generator object>

# Iterate over generator
for square in squares_gen:
    print(square)  # Prints 0, 1, 4, 9, ...

# Convert to list
squares_list = list(x ** 2 for x in range(10))
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Use in functions
sum_of_squares = sum(x ** 2 for x in range(100))
# 328350

max_value = max(x * 2 for x in [1, 5, 3, 9, 2])
# 18
```

### Memory Efficiency Comparison

```python
import sys

# List comprehension - creates full list in memory
list_comp = [x ** 2 for x in range(1000000)]
print(sys.getsizeof(list_comp))  # ~8000000 bytes

# Generator expression - creates items on demand
gen_expr = (x ** 2 for x in range(1000000))
print(sys.getsizeof(gen_expr))  # ~112 bytes

# Generator is consumed after iteration
gen = (x for x in range(5))
print(list(gen))  # [0, 1, 2, 3, 4]
print(list(gen))  # [] (empty - already consumed)
```

### Practical Generator Examples

```python
# Process large files line by line
def read_large_file(file_path):
    with open(file_path, 'r') as file:
        return (line.strip() for line in file)

# Chain generators
numbers = range(1000000)
evens = (x for x in numbers if x % 2 == 0)
squares = (x ** 2 for x in evens)
# Memory efficient pipeline

# Infinite generators
def fibonacci_gen():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# Use with itertools
from itertools import islice
first_10_fibs = list(islice(fibonacci_gen(), 10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Nested Comprehensions

Nested comprehensions handle multi-dimensional data structures.

### Matrix Operations

```python
# Create a matrix
matrix = [[i * j for j in range(5)] for i in range(5)]
# [[0, 0, 0, 0, 0],
#  [0, 1, 2, 3, 4],
#  [0, 2, 4, 6, 8],
#  [0, 3, 6, 9, 12],
#  [0, 4, 8, 12, 16]]

# Transpose matrix
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]

# Flatten nested list
nested = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
flat = [item for sublist in nested for item in sublist]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Flatten with condition
nested_mixed = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
even_flat = [item for sublist in nested_mixed for item in sublist if item % 2 == 0]
# [2, 4, 6, 8]
```

### Complex Nested Patterns

```python
# Create coordinate pairs
coords = [
    (x, y)
    for x in range(3)
    for y in range(3)
    if x != y
]
# [(0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1)]

# Nested filtering
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
filtered_matrix = [
    [item for item in row if item % 2 == 0]
    for row in matrix
]
# [[2], [4, 6], [8]]

# Three-level nesting
cube = [
    [[i + j + k for k in range(2)]
     for j in range(2)]
    for i in range(2)
]
# [[[0, 1], [1, 2]], [[1, 2], [2, 3]]]
```

### Nested Dictionary and Set Comprehensions

```python
# Nested dict from matrix
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
matrix_dict = {
    i: {j: matrix[i][j] for j in range(len(matrix[i]))}
    for i in range(len(matrix))
}
# {0: {0: 1, 1: 2, 2: 3}, 1: {0: 4, 1: 5, 2: 6}, 2: {0: 7, 1: 8, 2: 9}}

# Set of tuples from nested iteration
pairs = {
    (x, y)
    for x in range(1, 4)
    for y in range(1, 4)
    if x < y
}
# {(1, 2), (1, 3), (2, 3)}
```

## Advanced Patterns

### Walrus Operator in Comprehensions (Python 3.8+)

```python
# Use assignment expression
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
filtered = [y for x in data if (y := x ** 2) > 20]
# [25, 36, 49, 64, 81, 100]

# Avoid recalculation
import math
numbers = [1, 4, 9, 16, 25]
results = [sqrt for x in numbers if (sqrt := math.sqrt(x)) > 2]
# [3.0, 4.0, 5.0]

# Filter with transformation
texts = ["hello", "world", "python", "code"]
upper_long = [u for text in texts if len(u := text.upper()) > 4]
# ['HELLO', 'WORLD', 'PYTHON']
```

### Complex Filtering

```python
# Multiple predicates
def is_prime(n):
    if n < 2:
        return False
    return all(n % i != 0 for i in range(2, int(n ** 0.5) + 1))

primes = [x for x in range(100) if is_prime(x)]
# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, ...]

# Filter with external data
valid_ids = {1, 3, 5, 7, 9}
data = [{"id": i, "value": i * 10} for i in range(10)]
filtered_data = [item for item in data if item["id"] in valid_ids]
# [{'id': 1, 'value': 10}, {'id': 3, 'value': 30}, ...]

# Regex filtering
import re
texts = ["hello@gmail.com", "invalid", "test@yahoo.com", "also-invalid"]
emails = [t for t in texts if re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', t)]
# ['hello@gmail.com', 'test@yahoo.com']
```

### Comprehensions with enumerate and zip

```python
# Enumerate in comprehension
words = ["apple", "banana", "cherry"]
indexed = {i: word for i, word in enumerate(words)}
# {0: 'apple', 1: 'banana', 2: 'cherry'}

# Filter by index
items = ["a", "b", "c", "d", "e"]
odd_indexed = [item for i, item in enumerate(items) if i % 2 != 0]
# ['b', 'd']

# Zip multiple iterables
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
cities = ["NYC", "LA", "Chicago"]
people = [
    {"name": n, "age": a, "city": c}
    for n, a, c in zip(names, ages, cities)
]
# [{'name': 'Alice', 'age': 25, 'city': 'NYC'}, ...]
```

## Performance Considerations

### List Comprehension vs. Loops

```python
import timeit

# List comprehension (faster)
def comp():
    return [x ** 2 for x in range(1000)]

# Traditional loop (slower)
def loop():
    result = []
    for x in range(1000):
        result.append(x ** 2)
    return result

# Benchmark
comp_time = timeit.timeit(comp, number=10000)
loop_time = timeit.timeit(loop, number=10000)
print(f"Comprehension: {comp_time:.4f}s")
print(f"Loop: {loop_time:.4f}s")
# Comprehension is typically 20-30% faster
```

### Memory Considerations

```python
# List comprehension - all in memory
big_list = [x for x in range(1000000)]  # Uses ~8MB

# Generator expression - lazy evaluation
big_gen = (x for x in range(1000000))   # Uses ~112 bytes

# Use generators for large datasets
def process_large_data():
    # Good: memory efficient
    for item in (x ** 2 for x in range(1000000)):
        if item > 1000:
            return item

    # Bad: creates full list
    all_items = [x ** 2 for x in range(1000000)]
    for item in all_items:
        if item > 1000:
            return item
```

### When to Use What

```python
# Use list comprehension when:
# - Need to iterate multiple times
# - Need random access
# - Dataset is small/medium
numbers = [x ** 2 for x in range(100)]
print(numbers[50])  # Random access
print(sum(numbers))  # Multiple iterations

# Use generator when:
# - Single iteration
# - Large dataset
# - Memory is constrained
total = sum(x ** 2 for x in range(1000000))

# Use regular loop when:
# - Complex logic
# - Multiple statements needed
# - Better readability
result = []
for x in range(10):
    if x % 2 == 0:
        temp = x ** 2
        if temp > 20:
            result.append(temp)
            print(f"Added {temp}")
```

### Optimization Tips

```python
# Pre-compute when possible
# Bad: repeated function calls
results = [expensive_function(x) for x in data for y in range(100)]

# Good: compute once
computed = expensive_function(data)
results = [computed[x] for x in range(len(computed)) for y in range(100)]

# Use set for membership testing
# Bad: O(n) lookup in list
valid = [1, 2, 3, 4, 5]
filtered = [x for x in range(1000) if x in valid]

# Good: O(1) lookup in set
valid = {1, 2, 3, 4, 5}
filtered = [x for x in range(1000) if x in valid]

# Avoid nested comprehensions for complex logic
# Bad: hard to read
result = [y for x in data if condition(x) for y in process(x) if validate(y)]

# Good: break into steps
intermediate = [x for x in data if condition(x)]
processed = [process(x) for x in intermediate]
result = [y for p in processed for y in p if validate(y)]
```

## Best Practices

### Readability Guidelines

```python
# DO: Simple and clear
squares = [x ** 2 for x in range(10)]

# DO: Single condition
evens = [x for x in range(10) if x % 2 == 0]

# CONSIDER LOOP: Complex logic
result = []
for x in data:
    if complex_condition(x):
        processed = expensive_operation(x)
        if another_condition(processed):
            result.append(transform(processed))

# DON'T: Too complex
result = [
    transform(processed)
    for x in data
    if complex_condition(x)
    for processed in [expensive_operation(x)]
    if another_condition(processed)
]
```

### Line Length and Formatting

```python
# Single line for simple comprehensions
squares = [x ** 2 for x in range(10)]

# Multi-line for readability
long_result = [
    process_item(item)
    for item in large_collection
    if meets_criteria(item)
]

# Nested comprehensions
matrix = [
    [i * j for j in range(cols)]
    for i in range(rows)
]
```

### Type Hints with Comprehensions

```python
from typing import List, Dict, Set

def get_squares(n: int) -> List[int]:
    return [x ** 2 for x in range(n)]

def word_lengths(words: List[str]) -> Dict[str, int]:
    return {word: len(word) for word in words}

def unique_chars(text: str) -> Set[str]:
    return {char for char in text if char.isalpha()}
```

### Common Pitfalls

```python
# PITFALL 1: Modifying list during iteration
numbers = [1, 2, 3, 4, 5]
# Bad: don't modify original during comprehension
# doubled = [numbers.pop() * 2 for x in numbers]  # Unpredictable

# Good: create new list
doubled = [x * 2 for x in numbers]

# PITFALL 2: Side effects in comprehensions
# Bad: comprehensions are for transforming, not side effects
# [print(x) for x in range(10)]  # Works but wrong pattern

# Good: use regular loop for side effects
for x in range(10):
    print(x)

# PITFALL 3: Overusing comprehensions
# Bad: hurts readability
result = [[i+j for j in range(5) if j % 2 == 0] for i in range(10) if i > 5]

# Good: break down or use loops
result = []
for i in range(10):
    if i > 5:
        row = [i + j for j in range(5) if j % 2 == 0]
        result.append(row)
```

## Practical Examples

### Data Processing

```python
# CSV-like data transformation
raw_data = [
    "Alice,25,NYC",
    "Bob,30,LA",
    "Charlie,35,Chicago"
]

people = [
    {
        "name": parts[0],
        "age": int(parts[1]),
        "city": parts[2]
    }
    for line in raw_data
    if (parts := line.split(","))
]

# Filter and aggregate
sales = [
    {"product": "A", "amount": 100},
    {"product": "B", "amount": 200},
    {"product": "A", "amount": 150},
    {"product": "B", "amount": 250}
]

high_sales = [
    sale for sale in sales
    if sale["amount"] > 150
]

total_by_product = {
    product: sum(s["amount"] for s in sales if s["product"] == product)
    for product in {s["product"] for s in sales}
}
```

### Text Processing

```python
# Word frequency
text = "the quick brown fox jumps over the lazy dog"
word_freq = {
    word: text.split().count(word)
    for word in set(text.split())
}

# Extract URLs
import re
html = "Visit https://example.com and http://test.org"
urls = [
    match.group()
    for match in re.finditer(r'https?://[^\s]+', html)
]

# Clean and normalize
messy_data = ["  HELLO  ", "world", "  PYTHON  "]
cleaned = [item.strip().lower() for item in messy_data]
```

### Mathematical Operations

```python
# Vector operations
v1 = [1, 2, 3]
v2 = [4, 5, 6]
dot_product = sum(a * b for a, b in zip(v1, v2))

# Matrix multiplication
A = [[1, 2], [3, 4]]
B = [[5, 6], [7, 8]]
result = [
    [sum(a * b for a, b in zip(row, col)) for col in zip(*B)]
    for row in A
]

# Statistical calculations
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
mean = sum(data) / len(data)
variance = sum((x - mean) ** 2 for x in data) / len(data)
std_dev = variance ** 0.5
```

## Conclusion

List comprehensions and their variants (dict, set, generator) are powerful tools in Python that promote concise, readable, and efficient code. Key takeaways:

- **Use comprehensions** for simple transformations and filtering
- **Use generators** for large datasets to save memory
- **Use regular loops** for complex logic or side effects
- **Keep comprehensions readable** - if it's too complex, use a loop
- **Consider performance** - comprehensions are generally faster but not always necessary

Master these patterns to write more Pythonic code and leverage Python's expressiveness effectively.
