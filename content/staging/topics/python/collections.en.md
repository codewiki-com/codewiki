---
title: Collections Module
description: Python collections module explained, Counter, defaultdict, deque, namedtuple and other advanced containers
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - collections
  - Containers
  - Data Structures
status: imported
origin: old/src/content/docs/python/collections.en.md
divergence: 0.214
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 19
  lastUpdated: 2026-01-07
---

The `collections` module in Python provides specialized container datatypes that serve as alternatives to Python's built-in containers like `dict`, `list`, `set`, and `tuple`. These specialized containers offer additional functionality and can significantly improve code readability, performance, and maintainability.

## Overview

The collections module includes several powerful data structures:

- **Counter**: A dict subclass for counting hashable objects
- **defaultdict**: A dict subclass that calls a factory function for missing values
- **OrderedDict**: A dict subclass that remembers insertion order
- **deque**: A list-like container with fast appends and pops on either end
- **namedtuple**: Factory function for creating tuple subclasses with named fields
- **ChainMap**: A dict-like class for creating a single view of multiple mappings

Let's explore each of these in detail.

## Counter

`Counter` is a dictionary subclass designed for counting hashable objects. It's an unordered collection where elements are stored as dictionary keys and their counts are stored as dictionary values.

### Basic Usage

```python
from collections import Counter

# Count elements in a list
fruits = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
fruit_count = Counter(fruits)
print(fruit_count)
# Output: Counter({'apple': 3, 'banana': 2, 'cherry': 1})

# Count characters in a string
char_count = Counter('mississippi')
print(char_count)
# Output: Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})

# Create Counter from a dictionary
inventory = Counter({'apples': 10, 'oranges': 5, 'bananas': 8})
print(inventory)
# Output: Counter({'apples': 10, 'bananas': 8, 'oranges': 5})
```

### Common Operations

```python
from collections import Counter

c = Counter('abracadabra')

# Get the most common elements
print(c.most_common(3))
# Output: [('a', 5), ('b', 2), ('r', 2)]

# Access count of an element (returns 0 for missing elements)
print(c['a'])  # Output: 5
print(c['z'])  # Output: 0 (not KeyError!)

# Get all elements (with repetition)
print(list(c.elements()))
# Output: ['a', 'a', 'a', 'a', 'a', 'b', 'b', 'r', 'r', 'c', 'd']

# Total count of all elements
print(c.total())  # Python 3.10+
# Output: 11
```

### Arithmetic Operations

```python
from collections import Counter

c1 = Counter(a=3, b=1)
c2 = Counter(a=1, b=2)

# Addition
print(c1 + c2)  # Counter({'a': 4, 'b': 3})

# Subtraction (keeps only positive counts)
print(c1 - c2)  # Counter({'a': 2})

# Intersection (minimum of corresponding counts)
print(c1 & c2)  # Counter({'a': 1, 'b': 1})

# Union (maximum of corresponding counts)
print(c1 | c2)  # Counter({'a': 3, 'b': 2})
```

### Practical Use Cases

```python
from collections import Counter

# Word frequency analysis
text = "the quick brown fox jumps over the lazy dog the fox"
words = text.lower().split()
word_freq = Counter(words)
print("Top 3 words:", word_freq.most_common(3))
# Output: Top 3 words: [('the', 3), ('fox', 2), ('quick', 1)]

# Finding duplicates
items = [1, 2, 3, 2, 4, 3, 2, 5]
duplicates = [item for item, count in Counter(items).items() if count > 1]
print("Duplicates:", duplicates)
# Output: Duplicates: [2, 3]

# Checking if two strings are anagrams
def are_anagrams(s1, s2):
    return Counter(s1.lower().replace(' ', '')) == Counter(s2.lower().replace(' ', ''))

print(are_anagrams("listen", "silent"))  # True
print(are_anagrams("hello", "world"))    # False
```

## defaultdict

`defaultdict` is a dictionary subclass that provides a default value for missing keys. When you access a key that doesn't exist, instead of raising a `KeyError`, it calls a factory function to create a default value.

### Basic Usage

```python
from collections import defaultdict

# Using int as default factory (default value is 0)
word_count = defaultdict(int)
for word in ['apple', 'banana', 'apple', 'cherry']:
    word_count[word] += 1
print(dict(word_count))
# Output: {'apple': 2, 'banana': 1, 'cherry': 1}

# Using list as default factory (default value is [])
grouped = defaultdict(list)
pairs = [('fruit', 'apple'), ('vegetable', 'carrot'), ('fruit', 'banana')]
for category, item in pairs:
    grouped[category].append(item)
print(dict(grouped))
# Output: {'fruit': ['apple', 'banana'], 'vegetable': ['carrot']}

# Using set as default factory
unique_visitors = defaultdict(set)
visits = [('page1', 'user1'), ('page1', 'user2'), ('page1', 'user1'), ('page2', 'user1')]
for page, user in visits:
    unique_visitors[page].add(user)
print(dict(unique_visitors))
# Output: {'page1': {'user1', 'user2'}, 'page2': {'user1'}}
```

### Custom Default Factory

```python
from collections import defaultdict

# Using lambda for custom default value
settings = defaultdict(lambda: 'Not Set')
settings['theme'] = 'dark'
print(settings['theme'])     # Output: dark
print(settings['language'])  # Output: Not Set

# Nested defaultdict
def nested_dict():
    return defaultdict(nested_dict)

data = nested_dict()
data['users']['john']['age'] = 30
data['users']['john']['city'] = 'New York'
data['users']['jane']['age'] = 25

print(data['users']['john']['age'])  # Output: 30
```

### Practical Use Cases

```python
from collections import defaultdict

# Building an adjacency list for a graph
edges = [('A', 'B'), ('A', 'C'), ('B', 'C'), ('C', 'D')]
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)  # For undirected graph
print(dict(graph))
# Output: {'A': ['B', 'C'], 'B': ['A', 'C'], 'C': ['A', 'B', 'D'], 'D': ['C']}

# Grouping records by key
records = [
    {'name': 'Alice', 'department': 'Engineering'},
    {'name': 'Bob', 'department': 'Sales'},
    {'name': 'Charlie', 'department': 'Engineering'},
    {'name': 'Diana', 'department': 'Sales'},
]
by_department = defaultdict(list)
for record in records:
    by_department[record['department']].append(record['name'])
print(dict(by_department))
# Output: {'Engineering': ['Alice', 'Charlie'], 'Sales': ['Bob', 'Diana']}

# Counting with conditions
scores = [85, 92, 78, 90, 88, 76, 95, 82]
grade_counts = defaultdict(int)
for score in scores:
    if score >= 90:
        grade_counts['A'] += 1
    elif score >= 80:
        grade_counts['B'] += 1
    elif score >= 70:
        grade_counts['C'] += 1
    else:
        grade_counts['F'] += 1
print(dict(grade_counts))
# Output: {'B': 3, 'A': 3, 'C': 2}
```

## OrderedDict

`OrderedDict` is a dictionary subclass that remembers the order in which items were inserted. While regular dictionaries in Python 3.7+ maintain insertion order, `OrderedDict` provides additional functionality for reordering operations and order-aware equality comparisons.

### Basic Usage

```python
from collections import OrderedDict

# Creating an OrderedDict
od = OrderedDict()
od['first'] = 1
od['second'] = 2
od['third'] = 3

for key, value in od.items():
    print(f"{key}: {value}")
# Output:
# first: 1
# second: 2
# third: 3

# Creating from a list of tuples
od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])
print(od)
# Output: OrderedDict([('a', 1), ('b', 2), ('c', 3)])
```

### Key Differences from Regular Dict

```python
from collections import OrderedDict

# Order matters in equality comparison for OrderedDict
od1 = OrderedDict([('a', 1), ('b', 2)])
od2 = OrderedDict([('b', 2), ('a', 1)])
print(od1 == od2)  # False

# But not for regular dict
d1 = {'a': 1, 'b': 2}
d2 = {'b': 2, 'a': 1}
print(d1 == d2)  # True
```

### Reordering Operations

```python
from collections import OrderedDict

od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])

# Move an item to the end
od.move_to_end('a')
print(list(od.keys()))  # ['b', 'c', 'a']

# Move an item to the beginning
od.move_to_end('c', last=False)
print(list(od.keys()))  # ['c', 'b', 'a']

# Pop last item (LIFO)
print(od.popitem())  # ('a', 1)

# Pop first item (FIFO)
print(od.popitem(last=False))  # ('c', 3)
```

### Practical Use Cases

```python
from collections import OrderedDict

# LRU (Least Recently Used) Cache implementation
class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key):
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # Remove least recently used (first item)
            self.cache.popitem(last=False)

cache = LRUCache(3)
cache.put('a', 1)
cache.put('b', 2)
cache.put('c', 3)
cache.get('a')      # Access 'a', moves it to end
cache.put('d', 4)   # Evicts 'b' (least recently used)
print(list(cache.cache.keys()))  # ['c', 'a', 'd']

# Maintaining sorted order
data = {'banana': 3, 'apple': 1, 'cherry': 2}
sorted_od = OrderedDict(sorted(data.items(), key=lambda x: x[1]))
print(sorted_od)
# Output: OrderedDict([('apple', 1), ('cherry', 2), ('banana', 3)])
```

## deque

`deque` (double-ended queue) is a list-like container with fast O(1) appends and pops from both ends. It's optimized for operations that add or remove elements from either end, making it ideal for implementing queues and stacks.

### Basic Usage

```python
from collections import deque

# Creating a deque
d = deque([1, 2, 3])
print(d)  # deque([1, 2, 3])

# Append to right
d.append(4)
print(d)  # deque([1, 2, 3, 4])

# Append to left
d.appendleft(0)
print(d)  # deque([0, 1, 2, 3, 4])

# Pop from right
print(d.pop())  # 4
print(d)        # deque([0, 1, 2, 3])

# Pop from left
print(d.popleft())  # 0
print(d)            # deque([1, 2, 3])
```

### Extended Operations

```python
from collections import deque

d = deque([1, 2, 3])

# Extend from right
d.extend([4, 5])
print(d)  # deque([1, 2, 3, 4, 5])

# Extend from left (note the order)
d.extendleft([0, -1])
print(d)  # deque([-1, 0, 1, 2, 3, 4, 5])

# Rotate right (positive)
d = deque([1, 2, 3, 4, 5])
d.rotate(2)
print(d)  # deque([4, 5, 1, 2, 3])

# Rotate left (negative)
d.rotate(-2)
print(d)  # deque([1, 2, 3, 4, 5])

# Reverse
d.reverse()
print(d)  # deque([5, 4, 3, 2, 1])
```

### Bounded Deque (maxlen)

```python
from collections import deque

# Create a bounded deque
d = deque(maxlen=3)
d.extend([1, 2, 3])
print(d)  # deque([1, 2, 3], maxlen=3)

# Adding more elements removes from the opposite end
d.append(4)
print(d)  # deque([2, 3, 4], maxlen=3)

d.appendleft(0)
print(d)  # deque([0, 2, 3], maxlen=3)
```

### Practical Use Cases

```python
from collections import deque

# Implementing a queue (FIFO)
class Queue:
    def __init__(self):
        self.items = deque()

    def enqueue(self, item):
        self.items.append(item)

    def dequeue(self):
        return self.items.popleft()

    def is_empty(self):
        return len(self.items) == 0

queue = Queue()
queue.enqueue('first')
queue.enqueue('second')
print(queue.dequeue())  # first

# Sliding window / Moving average
def moving_average(data, window_size):
    window = deque(maxlen=window_size)
    averages = []
    for value in data:
        window.append(value)
        if len(window) == window_size:
            averages.append(sum(window) / window_size)
    return averages

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print(moving_average(data, 3))
# Output: [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0]

# Keep last N items (history)
history = deque(maxlen=5)
for i in range(10):
    history.append(f"command_{i}")
print(list(history))
# Output: ['command_5', 'command_6', 'command_7', 'command_8', 'command_9']

# Breadth-First Search (BFS)
def bfs(graph, start):
    visited = set()
    queue = deque([start])
    order = []

    while queue:
        vertex = queue.popleft()
        if vertex not in visited:
            visited.add(vertex)
            order.append(vertex)
            queue.extend(neighbor for neighbor in graph[vertex] if neighbor not in visited)

    return order

graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
print(bfs(graph, 'A'))  # ['A', 'B', 'C', 'D', 'E', 'F']
```

## namedtuple

`namedtuple` is a factory function that creates tuple subclasses with named fields. It provides a way to create simple, immutable data classes with readable attribute access.

### Basic Usage

```python
from collections import namedtuple

# Define a namedtuple
Point = namedtuple('Point', ['x', 'y'])

# Create instances
p1 = Point(10, 20)
p2 = Point(x=30, y=40)

# Access by name or index
print(p1.x, p1.y)     # 10 20
print(p1[0], p1[1])   # 10 20

# Unpack like regular tuple
x, y = p1
print(x, y)  # 10 20

# Named tuples are immutable
# p1.x = 100  # AttributeError!
```

### Different Ways to Define Fields

```python
from collections import namedtuple

# Using a list
Point = namedtuple('Point', ['x', 'y'])

# Using a string with spaces
Point = namedtuple('Point', 'x y')

# Using a comma-separated string
Point = namedtuple('Point', 'x, y')

# With default values (Python 3.7+)
Point = namedtuple('Point', ['x', 'y', 'z'], defaults=[0])
p = Point(1, 2)
print(p)  # Point(x=1, y=2, z=0)
```

### Useful Methods

```python
from collections import namedtuple

Person = namedtuple('Person', ['name', 'age', 'city'])
person = Person('Alice', 30, 'New York')

# Convert to dictionary
print(person._asdict())
# Output: {'name': 'Alice', 'age': 30, 'city': 'New York'}

# Create new instance with some fields replaced
updated = person._replace(age=31, city='Boston')
print(updated)
# Output: Person(name='Alice', age=31, city='Boston')

# Get field names
print(Person._fields)
# Output: ('name', 'age', 'city')

# Create from iterable
data = ['Bob', 25, 'Chicago']
bob = Person._make(data)
print(bob)
# Output: Person(name='Bob', age=25, city='Chicago')
```

### Practical Use Cases

```python
from collections import namedtuple

# Representing database records
Employee = namedtuple('Employee', ['id', 'name', 'department', 'salary'])

employees = [
    Employee(1, 'Alice', 'Engineering', 75000),
    Employee(2, 'Bob', 'Sales', 65000),
    Employee(3, 'Charlie', 'Engineering', 80000),
]

# Easy to work with
for emp in employees:
    print(f"{emp.name} works in {emp.department}")

# Filter and process
engineering = [e for e in employees if e.department == 'Engineering']
avg_salary = sum(e.salary for e in engineering) / len(engineering)
print(f"Average Engineering salary: ${avg_salary}")

# Representing coordinates
Coordinate = namedtuple('Coordinate', ['latitude', 'longitude'])

locations = {
    'New York': Coordinate(40.7128, -74.0060),
    'Los Angeles': Coordinate(34.0522, -118.2437),
    'Chicago': Coordinate(41.8781, -87.6298),
}

for city, coord in locations.items():
    print(f"{city}: {coord.latitude}, {coord.longitude}")

# Returning multiple values from functions
Result = namedtuple('Result', ['success', 'value', 'error'])

def divide(a, b):
    if b == 0:
        return Result(False, None, 'Division by zero')
    return Result(True, a / b, None)

result = divide(10, 2)
if result.success:
    print(f"Result: {result.value}")
else:
    print(f"Error: {result.error}")
```

### Extending namedtuple

```python
from collections import namedtuple

# Add methods by subclassing
class Point(namedtuple('Point', ['x', 'y'])):
    __slots__ = ()  # Prevent instance dictionary

    @property
    def hypot(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __str__(self):
        return f'Point({self.x}, {self.y})'

p = Point(3, 4)
print(p.hypot)  # 5.0
print(str(p))   # Point(3, 4)
```

## ChainMap

`ChainMap` groups multiple dictionaries together to create a single, updateable view. It's useful for managing multiple scopes or contexts, such as configuration layering or variable lookup in nested scopes.

### Basic Usage

```python
from collections import ChainMap

# Create a ChainMap from multiple dicts
defaults = {'color': 'red', 'size': 'medium', 'theme': 'light'}
user_settings = {'color': 'blue'}

settings = ChainMap(user_settings, defaults)

# Lookup searches through maps in order
print(settings['color'])  # blue (from user_settings)
print(settings['size'])   # medium (from defaults)
print(settings['theme'])  # light (from defaults)

# Convert to regular dict
print(dict(settings))
# Output: {'color': 'blue', 'size': 'medium', 'theme': 'light'}
```

### Modifying ChainMap

```python
from collections import ChainMap

defaults = {'a': 1, 'b': 2}
overrides = {'b': 3}

cm = ChainMap(overrides, defaults)

# Updates only affect the first mapping
cm['c'] = 4
print(overrides)  # {'b': 3, 'c': 4}
print(defaults)   # {'a': 1, 'b': 2}

# Delete only affects the first mapping
del cm['c']
print(overrides)  # {'b': 3}

# Access the underlying maps
print(cm.maps)  # [{'b': 3}, {'a': 1, 'b': 2}]
```

### Creating New Contexts

```python
from collections import ChainMap

base = {'x': 1, 'y': 2}
cm = ChainMap(base)

# Create a new child context
child = cm.new_child({'z': 3})
print(child['x'])  # 1 (from base)
print(child['z'])  # 3 (from child context)

# Child modifications don't affect parent
child['x'] = 100
print(child['x'])   # 100
print(base['x'])    # 1

# Get parent context
parent = child.parents
print(dict(parent))  # {'x': 1, 'y': 2}
```

### Practical Use Cases

```python
from collections import ChainMap
import os

# Configuration layering
default_config = {
    'debug': False,
    'log_level': 'INFO',
    'max_connections': 100,
}

env_config = {
    'debug': os.environ.get('DEBUG', '').lower() == 'true',
    'log_level': os.environ.get('LOG_LEVEL', 'INFO'),
}

user_config = {
    'max_connections': 50,
}

# Priority: user_config > env_config > default_config
config = ChainMap(user_config, env_config, default_config)
print(f"Debug: {config['debug']}")
print(f"Max connections: {config['max_connections']}")

# Simulating variable scopes (like in programming languages)
class Scope:
    def __init__(self):
        self.variables = ChainMap()

    def enter_scope(self):
        self.variables = self.variables.new_child()

    def exit_scope(self):
        self.variables = self.variables.parents

    def set(self, name, value):
        self.variables[name] = value

    def get(self, name):
        return self.variables.get(name)

scope = Scope()
scope.set('x', 10)
scope.enter_scope()
scope.set('y', 20)
scope.set('x', 100)  # Shadow outer x
print(scope.get('x'))  # 100
print(scope.get('y'))  # 20
scope.exit_scope()
print(scope.get('x'))  # 10
print(scope.get('y'))  # None

# Command-line argument handling
import argparse

def get_config(args):
    # Priority: CLI args > config file > defaults
    defaults = {'verbose': False, 'output': 'result.txt'}
    config_file = {'output': 'custom_output.txt'}
    cli_args = {k: v for k, v in vars(args).items() if v is not None}

    return ChainMap(cli_args, config_file, defaults)
```

## Performance Considerations

Understanding when to use each collection type can significantly impact performance:

```python
from collections import deque, Counter, defaultdict
import timeit

# deque vs list for left operations
def test_list_insert():
    lst = []
    for i in range(10000):
        lst.insert(0, i)

def test_deque_appendleft():
    d = deque()
    for i in range(10000):
        d.appendleft(i)

# deque is much faster for left operations
print(f"List insert(0): {timeit.timeit(test_list_insert, number=10):.4f}s")
print(f"Deque appendleft: {timeit.timeit(test_deque_appendleft, number=10):.4f}s")

# Counter vs manual counting
def manual_count(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts

def counter_count(items):
    return Counter(items)

items = list(range(1000)) * 100
print(f"Manual: {timeit.timeit(lambda: manual_count(items), number=100):.4f}s")
print(f"Counter: {timeit.timeit(lambda: counter_count(items), number=100):.4f}s")
```

## Summary

The `collections` module provides powerful, specialized containers that can make your code more efficient and readable:

| Container | Use Case |
|-----------|----------|
| **Counter** | Counting elements, frequency analysis, multisets |
| **defaultdict** | Grouping, counting, nested structures without KeyError |
| **OrderedDict** | When order matters, LRU caches, maintaining sorted order |
| **deque** | Queues, stacks, sliding windows, BFS algorithms |
| **namedtuple** | Lightweight immutable objects, database records, coordinates |
| **ChainMap** | Configuration layering, scope management, multiple contexts |

By choosing the right container for your use case, you can write cleaner, more Pythonic code that's often more efficient than using built-in types with additional logic.

## Further Reading

- [Python Documentation: collections](https://docs.python.org/3/library/collections.html)
- [PEP 372 - Adding an ordered dictionary to collections](https://peps.python.org/pep-0372/)
- [Real Python: Python's collections Module](https://realpython.com/python-collections-module/)
