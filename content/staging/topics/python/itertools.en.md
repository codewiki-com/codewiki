---
title: The itertools Module
description: Complete guide to Python itertools - efficient iterator tools and combinatorial generators
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - itertools
  - Iterators
  - Functional
status: imported
origin: old/src/content/docs/python/itertools.en.md
divergence: 0.215
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 29
  lastUpdated: 2026-01-07
---

`itertools` is one of the most powerful modules in Python's standard library, providing a collection of tools for efficient iteration. These functions return iterators that can process large amounts of data in a memory-efficient manner, making them essential for functional programming and data processing.

   - [count - Infinite Counter](#count---infinite-counter)
   - [cycle - Infinite Loop](#cycle---infinite-loop)
   - [repeat - Repeat Elements](#repeat---repeat-elements)
2. [Terminating Iterators](#terminating-iterators)
   - [chain - Concatenate Iterators](#chain---concatenate-iterators)
   - [compress - Filter Selection](#compress---filter-selection)
   - [islice - Slice Iterator](#islice---slice-iterator)
   - [takewhile and dropwhile](#takewhile-and-dropwhile)
   - [groupby - Grouping](#groupby---grouping)
   - [starmap - Unpack Arguments Mapping](#starmap---unpack-arguments-mapping)
3. [Combinatoric Iterators](#combinatoric-iterators)
   - [product - Cartesian Product](#product---cartesian-product)
   - [permutations - Permutations](#permutations---permutations)
   - [combinations - Combinations](#combinations---combinations)
   - [combinations_with_replacement - Combinations with Replacement](#combinations_with_replacement---combinations-with-replacement)
4. [Practical Applications](#practical-applications)
5. [Performance Optimization Tips](#performance-optimization-tips)
6. [Summary](#summary)

---

## Infinite Iterators

Infinite iterators continuously generate values and never stop. When using them, you must include a termination condition, otherwise the program will enter an infinite loop.

### count - Infinite Counter

`count(start=0, step=1)` starts from a specified value and increments infinitely by a specified step.

```python
from itertools import count

# Basic usage: count from 0
counter = count()
for i in counter:
    if i >= 5:
        break
    print(i, end=' ')  # 0 1 2 3 4

print()

# Specify start value and step
counter = count(start=10, step=2)
for i in counter:
    if i >= 20:
        break
    print(i, end=' ')  # 10 12 14 16 18

print()

# Supports floating-point numbers
counter = count(start=0.5, step=0.5)
values = []
for i in counter:
    if i > 3:
        break
    values.append(i)
print(values)  # [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
```

#### Practical Application: Adding Index to Data

```python
from itertools import count

def add_index(items, start=1):
    """Add index to each element of an iterable"""
    return zip(count(start), items)

fruits = ['apple', 'banana', 'cherry']
for index, fruit in add_index(fruits):
    print(f"{index}. {fruit}")
# Output:
# apple
# banana
# cherry

# You can also use enumerate, but count is more flexible
# For example, start numbering from 100 with step 10
for index, fruit in zip(count(100, 10), fruits):
    print(f"Number {index}: {fruit}")
# Output:
# Number 100: apple
# Number 110: banana
# Number 120: cherry
```

#### Practical Application: Generating Unique IDs

```python
from itertools import count

class IDGenerator:
    """Simple ID generator"""
    def __init__(self, prefix='ID', start=1):
        self.prefix = prefix
        self._counter = count(start)

    def generate(self):
        return f"{self.prefix}_{next(self._counter):06d}"

# Usage example
id_gen = IDGenerator(prefix='USER')
for _ in range(5):
    print(id_gen.generate())
# Output:
# USER_000001
# USER_000002
# USER_000003
# USER_000004
# USER_000005
```

### cycle - Infinite Loop

`cycle(iterable)` infinitely loops through a given iterable.

```python
from itertools import cycle

# Basic usage
colors = cycle(['red', 'green', 'blue'])
for i in range(7):
    print(next(colors), end=' ')
# Output: red green blue red green blue red

print()

# Cycle through a string
chars = cycle('ABC')
result = [next(chars) for _ in range(10)]
print(result)  # ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A']
```

#### Practical Application: Round-Robin Scheduler

```python
from itertools import cycle

class RoundRobinScheduler:
    """Round-robin scheduler"""
    def __init__(self, servers):
        self.servers = servers
        self._cycle = cycle(servers)

    def get_next_server(self):
        return next(self._cycle)

# Usage example
scheduler = RoundRobinScheduler(['server1', 'server2', 'server3'])
for i in range(7):
    server = scheduler.get_next_server()
    print(f"Request {i+1} assigned to: {server}")
# Output:
# Request 1 assigned to: server1
# Request 2 assigned to: server2
# Request 3 assigned to: server3
# Request 4 assigned to: server1
# Request 5 assigned to: server2
# Request 6 assigned to: server3
# Request 7 assigned to: server1
```

#### Practical Application: Alternating Display Styles

```python
from itertools import cycle

def format_table_rows(rows, styles=None):
    """Format table rows with alternating styles"""
    if styles is None:
        styles = ['odd', 'even']

    style_cycle = cycle(styles)
    for row in rows:
        style = next(style_cycle)
        yield f'<tr class="{style}">{row}</tr>'

# Usage example
data = ['Row Data 1', 'Row Data 2', 'Row Data 3', 'Row Data 4']
for formatted_row in format_table_rows(data):
    print(formatted_row)
# Output:
# <tr class="odd">Row Data 1</tr>
# <tr class="even">Row Data 2</tr>
# <tr class="odd">Row Data 3</tr>
# <tr class="even">Row Data 4</tr>
```

### repeat - Repeat Elements

`repeat(object, times=None)` repeatedly returns a specified object. If `times` is specified, it repeats a finite number of times.

```python
from itertools import repeat

# Infinite repeat
repeater = repeat('Hello')
for _ in range(3):
    print(next(repeater))
# Output:
# Hello
# Hello
# Hello

# Finite repeat
values = list(repeat(10, 5))
print(values)  # [10, 10, 10, 10, 10]

# Note when repeating mutable objects: all elements point to the same object
lists = list(repeat([1, 2, 3], 3))
lists[0].append(4)
print(lists)  # [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]
```

#### Practical Application: Using with map and zip

```python
from itertools import repeat

# Use with map for fixed arguments
numbers = [1, 2, 3, 4, 5]
powered = list(map(pow, numbers, repeat(2)))
print(powered)  # [1, 4, 9, 16, 25]

# Use with zip to create key-value pairs
keys = ['a', 'b', 'c']
default_dict = dict(zip(keys, repeat(0)))
print(default_dict)  # {'a': 0, 'b': 0, 'c': 0}

# Initialize 2D array (correct approach)
rows, cols = 3, 4
# Wrong approach: matrix = [[0] * cols] * rows  # All rows point to the same list
# Correct approach:
matrix = [list(repeat(0, cols)) for _ in range(rows)]
matrix[0][0] = 1
print(matrix)  # [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
```

---

## Terminating Iterators

Terminating iterators process finite input sequences and stop when appropriate.

### chain - Concatenate Iterators

`chain(*iterables)` concatenates multiple iterables into a single continuous iterator.

```python
from itertools import chain

# Concatenate multiple lists
list1 = [1, 2, 3]
list2 = [4, 5, 6]
list3 = [7, 8, 9]

combined = list(chain(list1, list2, list3))
print(combined)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Concatenate different types of iterables
result = list(chain('ABC', [1, 2, 3], (10, 20)))
print(result)  # ['A', 'B', 'C', 1, 2, 3, 10, 20]

# Flatten nested lists (one level)
nested = [[1, 2], [3, 4], [5, 6]]
flattened = list(chain(*nested))
print(flattened)  # [1, 2, 3, 4, 5, 6]
```

#### chain.from_iterable - Unpack from Iterable

```python
from itertools import chain

# When iterables are inside a container
nested = [[1, 2], [3, 4], [5, 6]]

# Using chain.from_iterable is more concise
flattened = list(chain.from_iterable(nested))
print(flattened)  # [1, 2, 3, 4, 5, 6]

# Flatten a list of strings
words = ['hello', 'world']
chars = list(chain.from_iterable(words))
print(chars)  # ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']
```

#### Practical Application: Merging Multiple Data Sources

```python
from itertools import chain

def get_all_users():
    """Get users from multiple sources"""
    admin_users = ['admin1', 'admin2']
    regular_users = ['user1', 'user2', 'user3']
    guest_users = ['guest1']

    return chain(admin_users, regular_users, guest_users)

# Usage example
all_users = list(get_all_users())
print(f"All users: {all_users}")
# Output: All users: ['admin1', 'admin2', 'user1', 'user2', 'user3', 'guest1']
```

#### Practical Application: Processing Multiple Files

```python
from itertools import chain

def read_lines_from_files(file_paths):
    """Read all lines from multiple files"""
    def file_lines(path):
        with open(path, 'r') as f:
            for line in f:
                yield line.strip()

    return chain.from_iterable(file_lines(path) for path in file_paths)

# Usage example (assuming files exist)
# files = ['file1.txt', 'file2.txt', 'file3.txt']
# for line in read_lines_from_files(files):
#     process(line)
```

### compress - Filter Selection

`compress(data, selectors)` filters data based on truthy values in selectors.

```python
from itertools import compress

# Basic usage
data = ['A', 'B', 'C', 'D', 'E']
selectors = [1, 0, 1, 0, 1]  # Or use True/False

result = list(compress(data, selectors))
print(result)  # ['A', 'C', 'E']

# Using boolean values
data = range(10)
selectors = [n % 2 == 0 for n in data]  # Select even numbers
evens = list(compress(data, selectors))
print(evens)  # [0, 2, 4, 6, 8]
```

#### Practical Application: Filter by Condition

```python
from itertools import compress

def filter_by_condition(items, condition_func):
    """Filter items by a condition function"""
    selectors = [condition_func(item) for item in items]
    return compress(items, selectors)

# Example: filter positive numbers
numbers = [-2, -1, 0, 1, 2, 3]
positives = list(filter_by_condition(numbers, lambda x: x > 0))
print(positives)  # [1, 2, 3]

# Example: filter valid data
data = [
    {'name': 'Alice', 'valid': True},
    {'name': 'Bob', 'valid': False},
    {'name': 'Charlie', 'valid': True}
]
valid_data = list(filter_by_condition(data, lambda x: x['valid']))
print([d['name'] for d in valid_data])  # ['Alice', 'Charlie']
```

#### Practical Application: Select Data by Mask

```python
from itertools import compress

# Simulating a data analysis scenario
scores = [85, 92, 78, 95, 88, 76, 91]
# Assuming we have a mask indicating which students passed (80 or above)
pass_mask = [score >= 80 for score in scores]

passing_scores = list(compress(scores, pass_mask))
print(f"Passing scores: {passing_scores}")  # Passing scores: [85, 92, 95, 88, 91]
print(f"Number passed: {len(passing_scores)}/{len(scores)}")  # Number passed: 5/7
```

### islice - Slice Iterator

`islice(iterable, stop)` or `islice(iterable, start, stop, step)` performs slicing operations on iterators.

```python
from itertools import islice

# Get first N elements
data = range(100)
first_10 = list(islice(data, 10))
print(first_10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Specify start and end positions
middle = list(islice(range(100), 20, 30))
print(middle)  # [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]

# With step
every_third = list(islice(range(20), 0, 20, 3))
print(every_third)  # [0, 3, 6, 9, 12, 15, 18]

# Skip first N elements
data = ['a', 'b', 'c', 'd', 'e', 'f']
skip_first_2 = list(islice(data, 2, None))
print(skip_first_2)  # ['c', 'd', 'e', 'f']
```

#### Practical Application: Pagination

```python
from itertools import islice

def paginate(iterable, page_size):
    """Paginate an iterable"""
    iterator = iter(iterable)
    while True:
        page = list(islice(iterator, page_size))
        if not page:
            break
        yield page

# Usage example
items = range(1, 23)
for i, page in enumerate(paginate(items, 5), 1):
    print(f"Page {i}: {page}")
# Output:
# Page 1: [1, 2, 3, 4, 5]
# Page 2: [6, 7, 8, 9, 10]
# Page 3: [11, 12, 13, 14, 15]
# Page 4: [16, 17, 18, 19, 20]
# Page 5: [21, 22]
```

#### Practical Application: Limit Generator Output

```python
from itertools import islice, count

def fibonacci():
    """Infinite Fibonacci sequence generator"""
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# Get first 10 Fibonacci numbers
fib_10 = list(islice(fibonacci(), 10))
print(fib_10)  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# Get 20th to 30th Fibonacci numbers
fib_20_30 = list(islice(fibonacci(), 20, 30))
print(fib_20_30)  # [6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229]
```

### takewhile and dropwhile

`takewhile(predicate, iterable)` takes elements while the condition is true, stopping immediately when false.
`dropwhile(predicate, iterable)` skips elements while the condition is true, then starts taking all subsequent elements.

```python
from itertools import takewhile, dropwhile

# takewhile: get elements that satisfy the condition prefix
data = [1, 3, 5, 7, 2, 4, 6, 8]

# Get consecutive odd numbers
odd_prefix = list(takewhile(lambda x: x % 2 == 1, data))
print(odd_prefix)  # [1, 3, 5, 7]

# dropwhile: skip elements that satisfy the condition prefix
remaining = list(dropwhile(lambda x: x % 2 == 1, data))
print(remaining)  # [2, 4, 6, 8]

# Note: once the condition is not satisfied, subsequent elements are not checked
data2 = [1, 3, 5, 2, 4, 7, 9]
result = list(takewhile(lambda x: x % 2 == 1, data2))
print(result)  # [1, 3, 5]  # Does not include 7, 9 at the end
```

#### Practical Application: Parsing Log Files

```python
from itertools import takewhile, dropwhile

def parse_log_section(lines, section_header):
    """Parse a specific section in a log"""
    # Skip until finding the target section header
    after_header = dropwhile(
        lambda line: section_header not in line,
        lines
    )

    # Skip the section header itself
    next(after_header, None)

    # Get until the next section header or empty line
    section_lines = takewhile(
        lambda line: line.strip() and not line.startswith('['),
        after_header
    )

    return list(section_lines)

# Simulated log
log_lines = [
    "[Header1]",
    "line1",
    "line2",
    "[Header2]",
    "data1",
    "data2",
    "data3",
    "[Header3]",
    "more data"
]

section = parse_log_section(iter(log_lines), "[Header2]")
print(section)  # ['data1', 'data2', 'data3']
```

#### Practical Application: Processing Sorted Data

```python
from itertools import takewhile, dropwhile

def get_top_scores(scores, threshold=80):
    """Get leading scores above threshold (assuming sorted in descending order)"""
    return list(takewhile(lambda x: x >= threshold, scores))

def get_failing_scores(scores, threshold=60):
    """Get scores below threshold (assuming sorted in descending order)"""
    return list(dropwhile(lambda x: x >= threshold, scores))

# Sorted scores
sorted_scores = [98, 95, 92, 88, 85, 78, 72, 65, 58, 45]

top_scores = get_top_scores(sorted_scores, 80)
print(f"Excellent scores: {top_scores}")  # Excellent scores: [98, 95, 92, 88, 85]

failing = get_failing_scores(sorted_scores, 60)
print(f"Failing scores: {failing}")  # Failing scores: [58, 45]
```

### groupby - Grouping

`groupby(iterable, key=None)` groups consecutive identical elements (or elements with identical keys).

> **Important Note**: `groupby` only groups **consecutive** identical elements. If you need to group non-consecutive elements, sort first.

```python
from itertools import groupby

# Basic usage: group consecutive identical elements
data = 'AAAABBBCCDAABB'
for key, group in groupby(data):
    print(f"'{key}': {list(group)}")
# Output:
# 'A': ['A', 'A', 'A', 'A']
# 'B': ['B', 'B', 'B']
# 'C': ['C', 'C']
# 'D': ['D']
# 'A': ['A', 'A']  # Note: later A's form a separate group
# 'B': ['B', 'B']

# Using key function
numbers = [1, 1, 2, 3, 3, 3, 4, 5, 5]
for key, group in groupby(numbers, key=lambda x: x % 2):
    parity = "odd" if key else "even"
    print(f"{parity}: {list(group)}")
# Output:
# odd: [1, 1]
# even: [2]
# odd: [3, 3, 3]
# even: [4]
# odd: [5, 5]
```

#### Group by Key (Requires Sorting First)

```python
from itertools import groupby
from operator import itemgetter

# Group by category
products = [
    {'name': 'Apple', 'category': 'Fruit'},
    {'name': 'Carrot', 'category': 'Vegetable'},
    {'name': 'Banana', 'category': 'Fruit'},
    {'name': 'Broccoli', 'category': 'Vegetable'},
    {'name': 'Orange', 'category': 'Fruit'},
]

# Must sort first!
products_sorted = sorted(products, key=itemgetter('category'))

# Then group
for category, items in groupby(products_sorted, key=itemgetter('category')):
    item_names = [item['name'] for item in items]
    print(f"{category}: {item_names}")
# Output:
# Fruit: ['Apple', 'Banana', 'Orange']
# Vegetable: ['Carrot', 'Broccoli']
```

#### Practical Application: Compress Consecutive Data

```python
from itertools import groupby

def run_length_encode(data):
    """Run-length encoding: compress consecutive repeated characters"""
    return [(char, len(list(group))) for char, group in groupby(data)]

def run_length_decode(encoded):
    """Decode run-length encoding"""
    return ''.join(char * count for char, count in encoded)

# Usage example
original = 'AAABBBCCCCDDDDDEEFFF'
encoded = run_length_encode(original)
print(f"Encoded: {encoded}")
# Output: Encoded: [('A', 3), ('B', 3), ('C', 4), ('D', 5), ('E', 2), ('F', 3)]

decoded = run_length_decode(encoded)
print(f"Decoded: {decoded}")
# Output: Decoded: AAABBBCCCCDDDDDEEFFF

print(f"Original length: {len(original)}, Encoded length: {len(encoded)}")
# Output: Original length: 20, Encoded length: 6
```

#### Practical Application: Merge Consecutive Ranges

```python
from itertools import groupby

def merge_consecutive_ranges(numbers):
    """Merge consecutive numbers into ranges"""
    if not numbers:
        return []

    ranges = []
    # Group by number - index, consecutive numbers have the same value
    for _, group in groupby(enumerate(sorted(numbers)),
                            key=lambda x: x[1] - x[0]):
        group_list = list(group)
        start = group_list[0][1]
        end = group_list[-1][1]
        if start == end:
            ranges.append(str(start))
        else:
            ranges.append(f"{start}-{end}")

    return ranges

# Usage example
numbers = [1, 2, 3, 5, 6, 7, 10, 15, 16, 17, 18, 20]
result = merge_consecutive_ranges(numbers)
print(f"Ranges: {result}")
# Output: Ranges: ['1-3', '5-7', '10', '15-18', '20']
```

### starmap - Unpack Arguments Mapping

`starmap(function, iterable)` is similar to `map()`, but unpacks each element in the iterable as function arguments.

```python
from itertools import starmap

# Basic usage
pairs = [(2, 5), (3, 2), (10, 3)]
results = list(starmap(pow, pairs))
print(results)  # [32, 9, 1000]

# Equivalent to:
# [pow(2, 5), pow(3, 2), pow(10, 3)]

# Compare map and starmap
def add(a, b):
    return a + b

pairs = [(1, 2), (3, 4), (5, 6)]

# Using map (requires lambda to unpack)
result_map = list(map(lambda p: add(*p), pairs))
print(result_map)  # [3, 7, 11]

# Using starmap (more concise)
result_starmap = list(starmap(add, pairs))
print(result_starmap)  # [3, 7, 11]
```

#### Practical Application: Batch String Formatting

```python
from itertools import starmap

def format_user(name, age, city):
    return f"{name} ({age} years old, from {city})"

users = [
    ('Alice', 25, 'Beijing'),
    ('Bob', 30, 'Shanghai'),
    ('Charlie', 28, 'Guangzhou')
]

formatted_users = list(starmap(format_user, users))
for user in formatted_users:
    print(user)
# Output:
# Alice (25 years old, from Beijing)
# Bob (30 years old, from Shanghai)
# Charlie (28 years old, from Guangzhou)
```

#### Practical Application: Vector Operations

```python
from itertools import starmap
from operator import mul, add

def dot_product(vec1, vec2):
    """Calculate the dot product of two vectors"""
    return sum(starmap(mul, zip(vec1, vec2)))

def vector_add(vec1, vec2):
    """Vector addition"""
    return list(starmap(add, zip(vec1, vec2)))

# Usage example
v1 = [1, 2, 3]
v2 = [4, 5, 6]

print(f"Dot product: {dot_product(v1, v2)}")  # Dot product: 32 (1*4 + 2*5 + 3*6)
print(f"Vector sum: {vector_add(v1, v2)}")  # Vector sum: [5, 7, 9]
```

#### Practical Application: Multi-Column Data Processing

```python
from itertools import starmap

def calculate_bmi(weight, height):
    """Calculate BMI index"""
    return weight / (height ** 2)

# Weight (kg) and height (m) data
data = [
    (70, 1.75),
    (60, 1.65),
    (80, 1.80),
    (55, 1.60)
]

bmi_values = list(starmap(calculate_bmi, data))
for (weight, height), bmi in zip(data, bmi_values):
    print(f"Weight={weight}kg, Height={height}m, BMI={bmi:.2f}")
# Output:
# Weight=70kg, Height=1.75m, BMI=22.86
# Weight=60kg, Height=1.65m, BMI=22.04
# Weight=80kg, Height=1.80m, BMI=24.69
# Weight=55kg, Height=1.60m, BMI=21.48
```

---

## Combinatoric Iterators

Combinatoric iterators are used to generate sequences in combinatorics such as permutations, combinations, and Cartesian products.

### product - Cartesian Product

`product(*iterables, repeat=1)` computes the Cartesian product of input iterables.

```python
from itertools import product

# Cartesian product of two sequences
colors = ['red', 'green']
sizes = ['S', 'M', 'L']

combinations = list(product(colors, sizes))
print(combinations)
# [('red', 'S'), ('red', 'M'), ('red', 'L'),
#  ('green', 'S'), ('green', 'M'), ('green', 'L')]

# Cartesian product of three sequences
a = [1, 2]
b = ['a', 'b']
c = [True, False]

result = list(product(a, b, c))
print(f"Number of combinations: {len(result)}")  # Number of combinations: 8
for item in result:
    print(item)

# Using repeat parameter (equivalent to repeating itself)
digits = [0, 1]
binary_3bit = list(product(digits, repeat=3))
print(binary_3bit)
# [(0, 0, 0), (0, 0, 1), (0, 1, 0), (0, 1, 1),
#  (1, 0, 0), (1, 0, 1), (1, 1, 0), (1, 1, 1)]
```

#### Practical Application: Generate Password Combinations

```python
from itertools import product
import string

def generate_passwords(length, chars=None):
    """Generate all possible password combinations"""
    if chars is None:
        chars = string.ascii_lowercase + string.digits

    for combo in product(chars, repeat=length):
        yield ''.join(combo)

# Example: generate all 2-digit numeric passwords
two_digit_passwords = list(generate_passwords(2, '0123456789'))
print(f"Number of 2-digit passwords: {len(two_digit_passwords)}")  # 100
print(f"First 10: {two_digit_passwords[:10]}")
# ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09']

# Note: for longer passwords, the number of combinations grows rapidly
# 4-character lowercase passwords: 26^4 = 456,976 combinations
```

#### Practical Application: Parameter Grid Search

```python
from itertools import product

def grid_search(param_grid):
    """Generate parameter combinations for grid search"""
    keys = param_grid.keys()
    values = param_grid.values()

    for combo in product(*values):
        yield dict(zip(keys, combo))

# Machine learning hyperparameter search
param_grid = {
    'learning_rate': [0.001, 0.01, 0.1],
    'batch_size': [32, 64, 128],
    'epochs': [10, 20]
}

print("Parameter combinations:")
for i, params in enumerate(grid_search(param_grid), 1):
    print(f"{i}. {params}")
# Output:
# {'learning_rate': 0.001, 'batch_size': 32, 'epochs': 10}
# {'learning_rate': 0.001, 'batch_size': 32, 'epochs': 20}
# ...
# {'learning_rate': 0.1, 'batch_size': 128, 'epochs': 20}
```

#### Practical Application: Multi-Dimensional Coordinate Traversal

```python
from itertools import product

def traverse_grid(dimensions):
    """Traverse all coordinates in a multi-dimensional grid"""
    ranges = [range(dim) for dim in dimensions]
    return product(*ranges)

# Traverse a 3x4x2 three-dimensional space
for coord in traverse_grid((3, 4, 2)):
    print(coord)
# (0, 0, 0), (0, 0, 1), (0, 1, 0), ...

# Chessboard coordinates
rows = 'abcdefgh'
cols = '12345678'
chess_squares = [''.join(sq) for sq in product(rows, cols)]
print(f"Chess squares: {chess_squares[:8]}...")  # ['a1', 'a2', ..., 'a8']...
print(f"Total {len(chess_squares)} squares")  # 64
```

### permutations - Permutations

`permutations(iterable, r=None)` generates all permutations of length r. Permutations consider order, and elements are not reused.

```python
from itertools import permutations

# Full permutations
items = ['A', 'B', 'C']
perms = list(permutations(items))
print(f"Number of full permutations: {len(perms)}")  # 6 (3!)
for p in perms:
    print(p)
# ('A', 'B', 'C'), ('A', 'C', 'B'), ('B', 'A', 'C'),
# ('B', 'C', 'A'), ('C', 'A', 'B'), ('C', 'B', 'A')

# Specify permutation length
perms_2 = list(permutations(items, 2))
print(f"\n2-element permutations: {len(perms_2)}")  # 6 (P(3,2) = 3*2)
for p in perms_2:
    print(p)
# ('A', 'B'), ('A', 'C'), ('B', 'A'),
# ('B', 'C'), ('C', 'A'), ('C', 'B')

# String permutations
word = 'ABC'
word_perms = [''.join(p) for p in permutations(word)]
print(f"\nWord permutations: {word_perms}")
# ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA']
```

#### Practical Application: Traveling Salesman Problem

```python
from itertools import permutations

def calculate_route_distance(route, distances):
    """Calculate total distance of a route"""
    total = 0
    for i in range(len(route) - 1):
        total += distances[route[i]][route[i + 1]]
    # Return to start
    total += distances[route[-1]][route[0]]
    return total

def solve_tsp_brute_force(cities, distances):
    """Brute force solve Traveling Salesman Problem (small scale)"""
    # Fix first city, permute the rest
    other_cities = cities[1:]
    best_route = None
    best_distance = float('inf')

    for perm in permutations(other_cities):
        route = [cities[0]] + list(perm)
        distance = calculate_route_distance(route, distances)
        if distance < best_distance:
            best_distance = distance
            best_route = route

    return best_route, best_distance

# Usage example
cities = ['A', 'B', 'C', 'D']
distances = {
    'A': {'A': 0, 'B': 10, 'C': 15, 'D': 20},
    'B': {'A': 10, 'B': 0, 'C': 35, 'D': 25},
    'C': {'A': 15, 'B': 35, 'C': 0, 'D': 30},
    'D': {'A': 20, 'B': 25, 'C': 30, 'D': 0}
}

route, distance = solve_tsp_brute_force(cities, distances)
print(f"Shortest route: {' -> '.join(route)} -> {route[0]}")
print(f"Total distance: {distance}")
```

#### Practical Application: Anagram Solver

```python
from itertools import permutations

def find_anagrams(word, dictionary):
    """Find all valid anagrams of a word"""
    word_lower = word.lower()
    valid_anagrams = set()

    for perm in permutations(word_lower):
        candidate = ''.join(perm)
        if candidate in dictionary and candidate != word_lower:
            valid_anagrams.add(candidate)

    return valid_anagrams

# Simulated dictionary
dictionary = {'eat', 'tea', 'ate', 'eta', 'tae', 'aet', 'cat', 'act'}

word = 'eat'
anagrams = find_anagrams(word, dictionary)
print(f"Anagrams of '{word}': {anagrams}")
# Anagrams of 'eat': {'ate', 'eta', 'tea', 'tae'}
```

### combinations - Combinations

`combinations(iterable, r)` generates all combinations of length r. Combinations do not consider order, and elements are not reused.

```python
from itertools import combinations

# Basic usage
items = ['A', 'B', 'C', 'D']

# Combinations of 2 elements
combs_2 = list(combinations(items, 2))
print(f"Number of 2-element combinations: {len(combs_2)}")  # 6 (C(4,2) = 6)
print(combs_2)
# [('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]

# Combinations of 3 elements
combs_3 = list(combinations(items, 3))
print(f"\nNumber of 3-element combinations: {len(combs_3)}")  # 4 (C(4,3) = 4)
print(combs_3)
# [('A', 'B', 'C'), ('A', 'B', 'D'), ('A', 'C', 'D'), ('B', 'C', 'D')]

# Number combinations
numbers = [1, 2, 3, 4, 5]
pairs = list(combinations(numbers, 2))
print(f"\nNumber pairs: {pairs}")
# [(1, 2), (1, 3), (1, 4), (1, 5), (2, 3), (2, 4), (2, 5), (3, 4), (3, 5), (4, 5)]
```

#### Practical Application: Subset Sum Problem

```python
from itertools import combinations

def find_subsets_with_sum(numbers, target_sum):
    """Find all subsets that sum to target value"""
    results = []
    for r in range(1, len(numbers) + 1):
        for combo in combinations(numbers, r):
            if sum(combo) == target_sum:
                results.append(combo)
    return results

# Usage example
numbers = [1, 2, 3, 4, 5, 6]
target = 10

subsets = find_subsets_with_sum(numbers, target)
print(f"Subsets that sum to {target}:")
for subset in subsets:
    print(f"  {subset} = {sum(subset)}")
# Output:
#   (4, 6) = 10
#   (1, 3, 6) = 10
#   (1, 4, 5) = 10
#   (2, 3, 5) = 10
#   (1, 2, 3, 4) = 10
```

#### Practical Application: Team Combinations

```python
from itertools import combinations

def generate_teams(members, team_size):
    """Generate all possible team combinations"""
    return list(combinations(members, team_size))

def generate_matches(teams):
    """Generate all possible match pairings"""
    return list(combinations(teams, 2))

# Usage example
players = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']

# Generate 3-person teams
teams = generate_teams(players, 3)
print(f"Number of possible 3-person teams: {len(teams)}")  # C(6,3) = 20

# Show first 5 teams
print("First 5 teams:")
for team in teams[:5]:
    print(f"  {team}")

# With only 4 players, generate all possible 2v2 matchups
four_players = ['Alice', 'Bob', 'Charlie', 'David']
# First generate all 2-person combinations
pairs = list(combinations(four_players, 2))
# Then select non-overlapping pairs
matches = []
for pair1, pair2 in combinations(pairs, 2):
    if not set(pair1) & set(pair2):  # No overlapping members
        matches.append((pair1, pair2))

print(f"\n2v2 match pairings:")
for match in matches:
    print(f"  {match[0]} vs {match[1]}")
```

#### Practical Application: Feature Selection

```python
from itertools import combinations

def evaluate_feature_combinations(features, X, y, model_class, scorer):
    """Evaluate model performance with different feature combinations (illustrative)"""
    results = []

    # Try different numbers of feature combinations
    for r in range(1, len(features) + 1):
        for feature_combo in combinations(range(len(features)), r):
            feature_names = [features[i] for i in feature_combo]
            # Simplified actual model training and evaluation process
            # score = train_and_evaluate(X[:, feature_combo], y, model_class, scorer)
            score = sum(feature_combo)  # Placeholder score
            results.append({
                'features': feature_names,
                'n_features': r,
                'score': score
            })

    return sorted(results, key=lambda x: x['score'], reverse=True)

# Example
features = ['Age', 'Income', 'Education', 'Experience']
# In actual use, X, y data and model need to be provided
print(f"Number of feature combinations: {sum(len(list(combinations(features, r))) for r in range(1, 5))}")
# Number of feature combinations: 15 (C(4,1) + C(4,2) + C(4,3) + C(4,4) = 4 + 6 + 4 + 1)
```

### combinations_with_replacement - Combinations with Replacement

`combinations_with_replacement(iterable, r)` generates combinations of length r, allowing elements to be selected multiple times.

```python
from itertools import combinations_with_replacement

# Basic usage
items = ['A', 'B', 'C']

# Select 2 elements with replacement
combs = list(combinations_with_replacement(items, 2))
print(f"Number of 2-element combinations with replacement: {len(combs)}")  # 6
print(combs)
# [('A', 'A'), ('A', 'B'), ('A', 'C'), ('B', 'B'), ('B', 'C'), ('C', 'C')]

# Compare with regular combinations
from itertools import combinations
normal_combs = list(combinations(items, 2))
print(f"\nRegular combinations: {normal_combs}")
# [('A', 'B'), ('A', 'C'), ('B', 'C')]  # No repeated elements

# Number example
digits = [1, 2, 3]
with_rep = list(combinations_with_replacement(digits, 2))
print(f"\nNumber combinations with replacement: {with_rep}")
# [(1, 1), (1, 2), (1, 3), (2, 2), (2, 3), (3, 3)]
```

#### Practical Application: Coin Combination Problem

```python
from itertools import combinations_with_replacement

def coin_combinations(coins, n):
    """Find all possible combinations using n coins"""
    return list(combinations_with_replacement(coins, n))

def find_exact_change(coins, amount, max_coins=10):
    """Find all ways to make exact change for an amount"""
    results = []
    for n in range(1, max_coins + 1):
        for combo in combinations_with_replacement(coins, n):
            if sum(combo) == amount:
                results.append(combo)
    return results

# Usage example
coins = [1, 5, 10, 25]  # Cents: penny, nickel, dime, quarter

# All combinations using 3 coins
three_coins = coin_combinations(coins, 3)
print(f"Number of 3-coin combinations: {len(three_coins)}")
print("Sample combinations:")
for combo in three_coins[:10]:
    print(f"  {combo} = {sum(combo)} cents")

# Ways to make 30 cents
ways = find_exact_change(coins, 30, max_coins=6)
print(f"\nWays to make 30 cents ({len(ways)} ways):")
for way in ways:
    print(f"  {way}")
```

#### Practical Application: Dice Roll Combinations

```python
from itertools import combinations_with_replacement
from collections import Counter

def dice_combinations(n_dice, n_sides=6):
    """Generate all possible combinations of n dice"""
    sides = range(1, n_sides + 1)
    return list(combinations_with_replacement(sides, n_dice))

def dice_sum_probability(n_dice, target_sum, n_sides=6):
    """Calculate probability of n dice summing to target_sum"""
    combos = dice_combinations(n_dice, n_sides)

    # Count the number of permutations for each combination
    total_outcomes = n_sides ** n_dice
    favorable_outcomes = 0

    for combo in combos:
        if sum(combo) == target_sum:
            # Calculate permutations for this combination
            counter = Counter(combo)
            # Multinomial coefficient
            from math import factorial
            permutations = factorial(n_dice)
            for count in counter.values():
                permutations //= factorial(count)
            favorable_outcomes += permutations

    return favorable_outcomes / total_outcomes

# Usage example
# All combinations of 2 dice
two_dice = dice_combinations(2)
print(f"Number of 2-dice combinations (ignoring order): {len(two_dice)}")  # 21

# Calculate probability of 2 dice summing to 7
prob_7 = dice_sum_probability(2, 7)
print(f"Probability of 2 dice summing to 7: {prob_7:.4f}")  # Approximately 0.1667 (1/6)

# Probability distribution for all sums
print("\nProbability distribution for 2 dice sums:")
for target in range(2, 13):
    prob = dice_sum_probability(2, target)
    bar = '*' * int(prob * 100)
    print(f"  {target:2d}: {prob:.4f} {bar}")
```

---

## Practical Applications

### Comprehensive Example: Data Processing Pipeline

```python
from itertools import chain, islice, groupby, takewhile, dropwhile
from operator import itemgetter

# Simulated log data
log_entries = [
    {'timestamp': '2024-01-01 10:00', 'level': 'INFO', 'message': 'System startup'},
    {'timestamp': '2024-01-01 10:01', 'level': 'DEBUG', 'message': 'Loading config'},
    {'timestamp': '2024-01-01 10:02', 'level': 'INFO', 'message': 'Service ready'},
    {'timestamp': '2024-01-01 10:05', 'level': 'ERROR', 'message': 'Connection timeout'},
    {'timestamp': '2024-01-01 10:06', 'level': 'ERROR', 'message': 'Retry failed'},
    {'timestamp': '2024-01-01 10:07', 'level': 'INFO', 'message': 'Connection restored'},
    {'timestamp': '2024-01-01 10:10', 'level': 'WARNING', 'message': 'High memory usage'},
    {'timestamp': '2024-01-01 10:15', 'level': 'INFO', 'message': 'Running cleanup'},
]

# Filter non-DEBUG level logs
non_debug = (e for e in log_entries if e['level'] != 'DEBUG')

# Group and count by level
sorted_entries = sorted(log_entries, key=itemgetter('level'))
print("Statistics by level:")
for level, entries in groupby(sorted_entries, key=itemgetter('level')):
    count = len(list(entries))
    print(f"  {level}: {count} entries")

# Get all logs after first error
def is_error(entry):
    return entry['level'] == 'ERROR'

after_first_error = list(dropwhile(lambda e: not is_error(e), log_entries))
print(f"\nLogs after first error: {len(after_first_error)}")

# Get consecutive error logs
errors_only = [e for e in log_entries if is_error(e)]
print(f"Error logs: {[e['message'] for e in errors_only]}")
```

### Comprehensive Example: Cryptography Tools

```python
from itertools import permutations, product, cycle
import string

def caesar_cipher(text, shift):
    """Caesar cipher"""
    alphabet = string.ascii_lowercase
    shifted = alphabet[shift:] + alphabet[:shift]
    table = str.maketrans(alphabet + alphabet.upper(),
                          shifted + shifted.upper())
    return text.translate(table)

def caesar_brute_force(ciphertext):
    """Brute force Caesar cipher"""
    for shift in range(26):
        plaintext = caesar_cipher(ciphertext, -shift)
        yield shift, plaintext

def vigenere_cipher(text, key, decrypt=False):
    """Vigenere cipher"""
    alphabet = string.ascii_lowercase
    key_cycle = cycle(key.lower())
    result = []

    for char in text.lower():
        if char in alphabet:
            shift = alphabet.index(next(key_cycle))
            if decrypt:
                shift = -shift
            idx = (alphabet.index(char) + shift) % 26
            result.append(alphabet[idx])
        else:
            result.append(char)

    return ''.join(result)

# Usage example
# Caesar cipher
original = "Hello World"
encrypted = caesar_cipher(original, 3)
print(f"Original: {original}")
print(f"Caesar encrypted (shift=3): {encrypted}")

# Brute force
print("\nBrute force attempts:")
for shift, plaintext in caesar_brute_force(encrypted):
    if plaintext.lower().startswith('hello'):
        print(f"  Shift {shift}: {plaintext} <-- Possible plaintext")
        break

# Vigenere cipher
key = "key"
vig_encrypted = vigenere_cipher(original, key)
vig_decrypted = vigenere_cipher(vig_encrypted, key, decrypt=True)
print(f"\nVigenere encrypted (key='{key}'): {vig_encrypted}")
print(f"Vigenere decrypted: {vig_decrypted}")
```

### Comprehensive Example: Mathematical Tools

```python
from itertools import combinations, permutations, count, takewhile
from functools import reduce
from operator import mul

def factorial(n):
    """Calculate factorial"""
    return reduce(mul, range(1, n + 1), 1)

def nPr(n, r):
    """Permutation number P(n,r)"""
    return len(list(permutations(range(n), r)))

def nCr(n, r):
    """Combination number C(n,r)"""
    return len(list(combinations(range(n), r)))

def generate_primes(limit):
    """Generate primes (iterator version of Sieve of Eratosthenes)"""
    def is_prime(n):
        if n < 2:
            return False
        for i in range(2, int(n**0.5) + 1):
            if n % i == 0:
                return False
        return True

    return (n for n in count(2) if is_prime(n))

def prime_factorization(n):
    """Prime factorization"""
    factors = []
    primes = generate_primes(n)

    for p in primes:
        if p * p > n:
            break
        while n % p == 0:
            factors.append(p)
            n //= p

    if n > 1:
        factors.append(n)

    return factors

# Usage example
print(f"5! = {factorial(5)}")  # 120
print(f"P(5,3) = {nPr(5, 3)}")  # 60
print(f"C(5,3) = {nCr(5, 3)}")  # 10

# Generate first 20 primes
first_20_primes = list(takewhile(lambda x: x < 80, generate_primes(100)))
print(f"Primes under 80: {first_20_primes}")

# Prime factorization
n = 360
factors = prime_factorization(n)
print(f"Prime factorization of {n}: {factors}")  # [2, 2, 2, 3, 3, 5]
```

---

## Performance Optimization Tips

### Advantages of Lazy Evaluation

```python
from itertools import islice, chain, count
import sys

# Memory efficiency of iterators
def compare_memory():
    # List: creates all elements at once
    list_version = list(range(1000000))

    # Iterator: generates on demand
    iter_version = range(1000000)

    print(f"List memory usage: {sys.getsizeof(list_version)} bytes")
    print(f"Range memory usage: {sys.getsizeof(iter_version)} bytes")

compare_memory()
# List memory usage: approximately 8.5MB
# Range memory usage: 48 bytes

# Using itertools for large data processing
def process_large_file(filename, batch_size=1000):
    """Process large file in batches"""
    with open(filename, 'r') as f:
        while True:
            batch = list(islice(f, batch_size))
            if not batch:
                break
            # Process batch
            yield batch
```

### Avoiding Multiple Iterations

```python
from itertools import tee

# Wrong: iterating generator multiple times
def wrong_approach():
    gen = (x * 2 for x in range(5))
    print(f"Max: {max(gen)}")  # 8
    print(f"Min: {min(gen)}")  # Error or empty! Generator exhausted

# Correct: use tee to create independent iterators
def correct_approach():
    gen = (x * 2 for x in range(5))
    gen1, gen2 = tee(gen, 2)
    print(f"Max: {max(gen1)}")  # 8
    print(f"Min: {min(gen2)}")  # 0

# Or convert to list (if memory allows)
def list_approach():
    data = list(x * 2 for x in range(5))
    print(f"Max: {max(data)}")  # 8
    print(f"Min: {min(data)}")  # 0

correct_approach()
list_approach()
```

### Combining Complex Operations

```python
from itertools import chain, compress, islice, takewhile
from operator import itemgetter

def efficient_data_pipeline(data):
    """Efficient data processing pipeline"""

    # 1. Filter valid data
    valid = (item for item in data if item.get('valid', False))

    # 2. Extract needed fields
    extracted = (
        {'name': item['name'], 'score': item['score']}
        for item in valid
    )

    # 3. Filter by score
    high_scorers = (
        item for item in extracted
        if item['score'] >= 80
    )

    # 4. Limit number of results
    top_10 = islice(high_scorers, 10)

    return list(top_10)

# Test data
test_data = [
    {'name': 'Alice', 'score': 95, 'valid': True},
    {'name': 'Bob', 'score': 75, 'valid': True},
    {'name': 'Charlie', 'score': 88, 'valid': False},
    {'name': 'David', 'score': 92, 'valid': True},
    {'name': 'Eve', 'score': 85, 'valid': True},
]

result = efficient_data_pipeline(test_data)
print(f"Result: {result}")
```

---

## Summary

The `itertools` module provides three categories of powerful iterator tools:

### Infinite Iterators

| Function | Description | Example |
|----------|-------------|---------|
| `count(start, step)` | Infinite counting | `count(10, 2)` -> 10, 12, 14, ... |
| `cycle(iterable)` | Infinite cycling | `cycle('ABC')` -> A, B, C, A, B, C, ... |
| `repeat(elem, n)` | Repeat elements | `repeat(10, 3)` -> 10, 10, 10 |

### Terminating Iterators

| Function | Description | Example |
|----------|-------------|---------|
| `chain(*iterables)` | Concatenate iterators | `chain([1,2], [3,4])` -> 1, 2, 3, 4 |
| `compress(data, selectors)` | Filter by selectors | `compress('ABCD', [1,0,1,0])` -> A, C |
| `islice(iterable, stop)` | Slice iterator | `islice(range(10), 5)` -> 0, 1, 2, 3, 4 |
| `takewhile(pred, iterable)` | Take while true | `takewhile(lambda x: x<5, [1,3,5,2])` -> 1, 3 |
| `dropwhile(pred, iterable)` | Drop while true | `dropwhile(lambda x: x<5, [1,3,5,2])` -> 5, 2 |
| `groupby(iterable, key)` | Group consecutive elements | Group consecutive elements by key |
| `starmap(func, iterable)` | Unpack argument mapping | `starmap(pow, [(2,3), (3,2)])` -> 8, 9 |

### Combinatoric Iterators

| Function | Description | Example |
|----------|-------------|---------|
| `product(*iterables)` | Cartesian product | `product('AB', '12')` -> A1, A2, B1, B2 |
| `permutations(iterable, r)` | Permutations (order matters) | `permutations('ABC', 2)` -> AB, AC, BA, BC, CA, CB |
| `combinations(iterable, r)` | Combinations (order doesn't matter) | `combinations('ABC', 2)` -> AB, AC, BC |
| `combinations_with_replacement` | Combinations with replacement | `combinations_with_replacement('AB', 2)` -> AA, AB, BB |

### Recommendations

1. **Memory Efficiency**: Iterators use lazy evaluation, ideal for processing large datasets
2. **Pipeline Composition**: Multiple itertools functions can be combined into data processing pipelines
3. **Infinite Iterators**: Must be used with termination conditions (such as `islice`, `takewhile`, or `break`)
4. **groupby Considerations**: Data must be sorted first, otherwise elements with the same key may be in separate groups
5. **Combinatorial Growth**: The number of results from permutations and combinations grows rapidly with input size, be mindful of performance

`itertools` is a core module for functional programming and efficient data processing in Python. Mastering it can significantly improve code conciseness and performance.

---

## Further Reading

- [Python Official Documentation - itertools](https://docs.python.org/3/library/itertools.html)
- [itertools Recipes](https://docs.python.org/3/library/itertools.html#itertools-recipes)
- [more-itertools Extension Library](https://more-itertools.readthedocs.io/)
- [functools Module](https://docs.python.org/3/library/functools.html)
