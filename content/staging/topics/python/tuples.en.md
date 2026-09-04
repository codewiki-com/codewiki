---
title: Python Tuples and Named Tuples
description: Master Python tuples' immutability, unpacking techniques, and practical applications of namedtuple and typing.NamedTuple for data handling
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - tuples
  - namedtuple
  - data structures
  - immutability
  - collections
status: imported
origin: old/src/content/docs/python/tuples.en.md
divergence: 0.223
issues: []
legacy:
  category: Python
  subcategory: Data Structures
  order: 5
  lastUpdated: 2026-01-07
---

Tuples are one of Python's most fundamental immutable sequence types. Similar to lists but with immutability, tuples offer unique advantages in specific scenarios. Named tuples extend basic tuples by adding named field access, combining the efficiency of tuples with the readability of classes.

## Concept Explanation

### What Are Tuples?

A tuple is Python's built-in immutable sequence type, represented with parentheses `()` and elements separated by commas. Once created, a tuple's contents cannot be modified.

```python
# Multiple ways to create tuples
t1 = (1, 2, 3)           # Using parentheses
t2 = 1, 2, 3             # Without parentheses (tuple packing)
t3 = tuple([1, 2, 3])    # Converting from list
t4 = tuple("abc")        # Converting from string
t5 = ()                   # Empty tuple
t6 = (1,)                 # Single-element tuple (note the comma)

print(type(t1))  # <class 'tuple'>
print(t2)        # (1, 2, 3)
print(t4)        # ('a', 'b', 'c')
```

### Tuples vs Lists

| Feature | Tuple | List |
|---------|-------|------|
| Mutability | Immutable | Mutable |
| Syntax | `(1, 2, 3)` | `[1, 2, 3]` |
| Hashable | Yes (if elements are hashable) | No |
| Memory | Smaller | Larger |
| Creation Speed | Faster | Slower |
| Use Cases | Fixed data, dict keys, return values | Dynamic collections |

```python
import sys

# Memory comparison
list_example = [1, 2, 3, 4, 5]
tuple_example = (1, 2, 3, 4, 5)

print(f"List size: {sys.getsizeof(list_example)} bytes")   # ~104 bytes
print(f"Tuple size: {sys.getsizeof(tuple_example)} bytes")  # ~80 bytes
```

---

## Core Principles

### Understanding Immutability

Tuple immutability means that once created, the element references in a tuple cannot be modified. However, if an element is a mutable object, the content of that object can change.

```python
# Tuple element references cannot be changed
t = (1, 2, 3)
# t[0] = 10  # TypeError: 'tuple' object does not support item assignment

# But mutable object contents can change
t = ([1, 2], [3, 4])
t[0].append(5)  # Legal operation
print(t)        # ([1, 2, 5], [3, 4])

# Understanding: tuple stores references, references are immutable,
# but the objects they reference can be mutable
```

### Memory Layout in CPython

Tuples in CPython are compact object arrays, requiring less extra space than lists due to not needing dynamic reallocation.

```python
import sys

# Empty tuples are singleton objects
empty1 = ()
empty2 = ()
print(empty1 is empty2)  # True

# Small integer tuples may be cached
t1 = (1, 2, 3)
t2 = (1, 2, 3)
print(t1 is t2)  # May be True (implementation-dependent)

# Tuple memory structure is more compact
for n in range(0, 6):
    t = tuple(range(n))
    print(f"Elements {n}: {sys.getsizeof(t)} bytes")
```

### Hashability

Tuples can serve as dictionary keys or set elements, provided all their elements are hashable.

```python
# Using tuples as dictionary keys
coordinates = {}
coordinates[(0, 0)] = "origin"
coordinates[(3, 4)] = "some point"
print(coordinates[(0, 0)])  # origin

# Using tuples in sets
points = {(0, 0), (1, 1), (2, 2)}
print((1, 1) in points)  # True

# Tuples containing mutable objects are not hashable
t = ([1, 2], 3)
# hash(t)  # TypeError: unhashable type: 'list'
```

---

## Key Points

### Tuple Creation and Access

```python
# Create tuples
empty = ()                # Empty tuple
single = (42,)            # Single-element tuple (must have comma)
multi = (1, 2, 3, 4, 5)   # Multi-element tuple
nested = ((1, 2), (3, 4)) # Nested tuples
mixed = (1, "hello", 3.14, True)  # Mixed types

# Index access
print(multi[0])    # 1
print(multi[-1])   # 5
print(nested[0])   # (1, 2)
print(nested[0][1])  # 2

# Slicing
print(multi[1:4])   # (2, 3, 4)
print(multi[::2])   # (1, 3, 5)
print(multi[::-1])  # (5, 4, 3, 2, 1)
```

### Tuple Methods

Tuples have only two methods: `count()` and `index()`.

```python
t = (1, 2, 3, 2, 4, 2, 5)

# count() - Count occurrences of an element
print(t.count(2))  # 3
print(t.count(6))  # 0

# index() - Find the first index of an element
print(t.index(3))  # 2
print(t.index(2))  # 1

# index() with range
print(t.index(2, 2))     # 3 (search from index 2)
print(t.index(2, 2, 5))  # 3 (search in range 2-5)

# Raises ValueError if element not found
# t.index(10)  # ValueError: tuple.index(x): x not in tuple
```

### Tuple Unpacking

Tuple unpacking is a powerful Python feature allowing direct assignment of tuple elements to variables.

```python
# Basic unpacking
point = (3, 4)
x, y = point
print(f"x={x}, y={y}")  # x=3, y=4

# Multi-variable unpacking
person = ("Alice", 30, "Engineer")
name, age, job = person
print(f"{name} is {age} years old")  # Alice is 30 years old

# Using * to collect remaining elements
first, *rest = (1, 2, 3, 4, 5)
print(first)  # 1
print(rest)   # [2, 3, 4, 5]

*beginning, last = (1, 2, 3, 4, 5)
print(beginning)  # [1, 2, 3, 4]
print(last)       # 5

first, *middle, last = (1, 2, 3, 4, 5)
print(first)   # 1
print(middle)  # [2, 3, 4]
print(last)    # 5

# Ignoring values
x, _, z = (1, 2, 3)  # Ignore middle value
print(x, z)  # 1 3

# Nested unpacking
data = (1, (2, 3), 4)
a, (b, c), d = data
print(a, b, c, d)  # 1 2 3 4
```

### Variable Swapping

Python's tuple unpacking enables elegant variable swapping:

```python
a = 10
b = 20

# Traditional approach (requires temporary variable)
# temp = a
# a = b
# b = temp

# Python approach (using tuple packing and unpacking)
a, b = b, a
print(f"a={a}, b={b}")  # a=20, b=10

# Multiple variable swapping
x, y, z = 1, 2, 3
x, y, z = z, x, y
print(x, y, z)  # 3 1 2
```

### Tuple Concatenation and Repetition

```python
# Concatenation
t1 = (1, 2, 3)
t2 = (4, 5, 6)
t3 = t1 + t2
print(t3)  # (1, 2, 3, 4, 5, 6)

# Repetition
t = (1, 2) * 3
print(t)  # (1, 2, 1, 2, 1, 2)

# Membership testing
print(2 in t1)   # True
print(10 in t1)  # False

# Length
print(len(t3))  # 6

# Max, min, sum
nums = (5, 2, 8, 1, 9)
print(max(nums))  # 9
print(min(nums))  # 1
print(sum(nums))  # 25
```

---

## Code Examples

### Function Return Multiple Values

Tuples are the idiomatic way for functions to return multiple values:

```python
def get_stats(numbers):
    """Calculate statistics, returning multiple values"""
    if not numbers:
        return None, None, None, None

    total = sum(numbers)
    count = len(numbers)
    average = total / count
    return min(numbers), max(numbers), average, total

# Using returned tuple
data = [10, 20, 30, 40, 50]
min_val, max_val, avg, total = get_stats(data)
print(f"Min: {min_val}, Max: {max_val}, Avg: {avg}, Total: {total}")

# Can also use tuple directly
result = get_stats(data)
print(f"Statistics: {result}")
```

### Using Tuples as Dictionary Keys

```python
# Using tuples as coordinate keys
grid = {}
for x in range(3):
    for y in range(3):
        grid[(x, y)] = x * 3 + y

print(grid)
# {(0, 0): 0, (0, 1): 1, (0, 2): 2, (1, 0): 3, ...}

# Looking up specific coordinates
print(grid[(1, 1)])  # 4

# Practical application: sparse matrix
sparse_matrix = {
    (0, 0): 1,
    (0, 5): 2,
    (3, 2): 3,
    (100, 100): 4
}

def get_value(matrix, row, col, default=0):
    return matrix.get((row, col), default)

print(get_value(sparse_matrix, 0, 5))   # 2
print(get_value(sparse_matrix, 1, 1))   # 0 (default value)
```

### Sorting with Tuples

```python
# Sorting by multiple criteria
students = [
    ("Alice", 85, 22),
    ("Bob", 90, 21),
    ("Charlie", 85, 23),
    ("David", 90, 20),
]

# Sort by grade descending, age ascending
sorted_students = sorted(students, key=lambda s: (-s[1], s[2]))
print(sorted_students)
# [('David', 90, 20), ('Bob', 90, 21), ('Alice', 85, 22), ('Charlie', 85, 23)]

# Tuple comparison
print((1, 2, 3) < (1, 2, 4))  # True (element-wise comparison)
print((1, 2, 3) < (1, 3, 0))  # True (decided at second element)
print((1, 2) < (1, 2, 0))     # True (shorter tuple is smaller)
```

### Enumeration and Parallel Iteration

```python
# Using enumerate with tuples
colors = ["red", "green", "blue"]
for index, color in enumerate(colors):
    print(f"{index}: {color}")

# Using zip for parallel iteration
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
cities = ["NYC", "LA", "Chicago"]

for name, age, city in zip(names, ages, cities):
    print(f"{name} ({age}) lives in {city}")

# zip returns iterator of tuples
pairs = list(zip(names, ages))
print(pairs)  # [('Alice', 25), ('Bob', 30), ('Charlie', 35)]
```

---

## Named Tuples

`collections.namedtuple` creates tuple subclasses with named fields, making code more readable while maintaining tuple efficiency.

### Basic Usage

```python
from collections import namedtuple

# Create named tuple class
Point = namedtuple('Point', ['x', 'y'])

# Can also use comma-separated or space-separated strings
Point2 = namedtuple('Point2', 'x, y')
Point3 = namedtuple('Point3', 'x y')

# Create instances
p = Point(3, 4)
print(p)        # Point(x=3, y=4)
print(p.x)      # 3 (attribute access)
print(p.y)      # 4
print(p[0])     # 3 (index access)
print(p[1])     # 4

# Unpacking
x, y = p
print(f"x={x}, y={y}")  # x=3, y=4
```

### Default Values (Python 3.7+)

```python
from collections import namedtuple

# Setting default values
Person = namedtuple('Person', ['name', 'age', 'city'],
                     defaults=['Unknown', 0, 'N/A'])

# Defaults apply from right to left
p1 = Person('Alice')           # Person(name='Alice', age=0, city='N/A')
p2 = Person('Bob', 25)         # Person(name='Bob', age=25, city='N/A')
p3 = Person('Charlie', 30, 'NYC')  # Person(name='Charlie', age=30, city='NYC')

print(p1)
print(p2)
print(p3)

# View default values
print(Person._field_defaults)  # {'age': 0, 'city': 'N/A'}
```

### Built-in Methods

```python
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)

# _make() - Create instance from iterable
data = [5, 6]
p2 = Point._make(data)
print(p2)  # Point(x=5, y=6)

# _asdict() - Convert to dictionary
d = p._asdict()
print(d)  # {'x': 3, 'y': 4}

# _replace() - Create new instance with changed fields
p3 = p._replace(x=10)
print(p3)  # Point(x=10, y=4)
print(p)   # Point(x=3, y=4) - original unchanged

# _fields - View field names
print(Point._fields)  # ('x', 'y')
```

### Extending namedtuple

```python
from collections import namedtuple
import math

# Base named tuple
_Point = namedtuple('Point', ['x', 'y'])

# Inherit and add methods
class Point(_Point):
    """2D point class supporting mathematical operations"""

    __slots__ = ()  # Prevent instance dictionary, maintain efficiency

    @property
    def distance_from_origin(self):
        """Calculate distance from origin"""
        return math.sqrt(self.x ** 2 + self.y ** 2)

    def __add__(self, other):
        """Vector addition"""
        return Point(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """Vector subtraction"""
        return Point(self.x - other.x, self.y - other.y)

    def __str__(self):
        return f"Point({self.x}, {self.y})"

    def distance_to(self, other):
        """Calculate distance to another point"""
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)

# Using enhanced Point class
p1 = Point(3, 4)
p2 = Point(6, 8)

print(p1.distance_from_origin)  # 5.0
print(p1 + p2)  # Point(9, 12)
print(p1.distance_to(p2))  # 5.0
```

---

## typing.NamedTuple - Typed Named Tuples

`typing.NamedTuple` is the modern way (Python 3.5+) to define named tuples with type annotations.

### Basic Syntax

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

# Create instances
p = Point(3.0, 4.0)
print(p)        # Point(x=3.0, y=4.0)
print(p.x)      # 3.0
print(p[0])     # 3.0

# Type checkers (like mypy) can verify types
# p = Point("3", "4")  # mypy would report an error
```

### Default Values

```python
from typing import NamedTuple, Optional

class Person(NamedTuple):
    name: str
    age: int = 0
    city: str = "Unknown"
    email: Optional[str] = None

# Using default values
p1 = Person("Alice")
p2 = Person("Bob", 30)
p3 = Person("Charlie", 25, "NYC", "charlie@example.com")

print(p1)  # Person(name='Alice', age=0, city='Unknown', email=None)
print(p2)  # Person(name='Bob', age=30, city='Unknown', email=None)
print(p3)  # Person(name='Charlie', age=25, city='NYC', email='charlie@example.com')
```

### Adding Methods and Documentation

```python
from typing import NamedTuple
import math

class Vector(NamedTuple):
    """2D vector class"""
    x: float
    y: float

    @property
    def magnitude(self) -> float:
        """Calculate vector magnitude"""
        return math.sqrt(self.x ** 2 + self.y ** 2)

    def normalized(self) -> 'Vector':
        """Return unit vector"""
        mag = self.magnitude
        if mag == 0:
            return Vector(0, 0)
        return Vector(self.x / mag, self.y / mag)

    def dot(self, other: 'Vector') -> float:
        """Dot product"""
        return self.x * other.x + self.y * other.y

    def __add__(self, other: 'Vector') -> 'Vector':
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar: float) -> 'Vector':
        return Vector(self.x * scalar, self.y * scalar)

# Usage
v1 = Vector(3, 4)
v2 = Vector(1, 0)

print(v1.magnitude)     # 5.0
print(v1.normalized())  # Vector(x=0.6, y=0.8)
print(v1.dot(v2))       # 3.0
print(v1 + v2)          # Vector(x=4, y=4)
print(v1 * 2)           # Vector(x=6, y=8)
```

### collections.namedtuple vs typing.NamedTuple

| Feature | collections.namedtuple | typing.NamedTuple |
|---------|----------------------|-------------------|
| Syntax | Function call | Class definition |
| Type Annotations | Not supported | Native support |
| Default Values | Python 3.7+ | Native support |
| Adding Methods | Requires inheritance | Define directly in class |
| IDE Support | Weaker | Better code completion |
| Python Version | 2.6+ | 3.5+ |

```python
from collections import namedtuple
from typing import NamedTuple

# collections.namedtuple approach
Point1 = namedtuple('Point1', ['x', 'y'])

# typing.NamedTuple approach
class Point2(NamedTuple):
    x: float
    y: float

# Both have similar functionality
p1 = Point1(3, 4)
p2 = Point2(3.0, 4.0)

print(p1._fields)  # ('x', 'y')
print(p2._fields)  # ('x', 'y')

print(p1._asdict())  # {'x': 3, 'y': 4}
print(p2._asdict())  # {'x': 3.0, 'y': 4.0}
```

---

## Best Practices

### When to Use Tuples

```python
# Function returns multiple values
def parse_coordinate(coord_str):
    """Parse coordinate string"""
    parts = coord_str.split(',')
    return float(parts[0]), float(parts[1])

x, y = parse_coordinate("3.5,4.2")

# Use as dictionary key
cache = {}
def expensive_computation(a, b, c):
    key = (a, b, c)
    if key not in cache:
        cache[key] = a * b * c  # Simulate expensive calculation
    return cache[key]

# Store data that shouldn't be modified
WEEKDAYS = ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
RGB_RED = (255, 0, 0)

# Immutable configuration
DATABASE_CONFIG = ('localhost', 5432, 'mydb')
```

### When to Use Namedtuple

```python
from collections import namedtuple

# Lightweight data structure needing field names
User = namedtuple('User', ['id', 'name', 'email'])
user = User(1, 'Alice', 'alice@example.com')
print(user.name)  # More readable than user[1]

# Replace simple classes
# Not recommended
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Recommended
Point = namedtuple('Point', ['x', 'y'])

# Database row records
Row = namedtuple('Row', ['id', 'name', 'created_at'])
rows = [
    Row(1, 'Item 1', '2024-01-01'),
    Row(2, 'Item 2', '2024-01-02'),
]
for row in rows:
    print(f"{row.id}: {row.name}")
```

### When to Use typing.NamedTuple

```python
from typing import NamedTuple, Optional, List

# Need type annotations
class APIResponse(NamedTuple):
    status_code: int
    data: dict
    error: Optional[str] = None

# Need to add methods
class Rectangle(NamedTuple):
    width: float
    height: float

    @property
    def area(self) -> float:
        return self.width * self.height

    @property
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

# Complex data structures
class Order(NamedTuple):
    order_id: str
    customer_id: int
    items: List[str]
    total: float
    status: str = 'pending'
```

### Choosing Between Tuples and Lists

```python
# Use tuples when:
# - Data should not be modified
# - Need to use as dict key or set element
# - Representing fixed structures (coordinates, colors)
# - Function returns multiple values

coords = (10, 20)  # Coordinates shouldn't change
color = (255, 128, 0)  # RGB values

# Use lists when:
# - Data needs dynamic addition/removal
# - Homogeneous data collection
# - Need sorting, reversing, or in-place operations

tasks = ['task1', 'task2']
tasks.append('task3')
```

---

## Common Pitfalls

### Single-Element Tuple

```python
# Wrong: This is an integer, not a tuple
not_a_tuple = (42)
print(type(not_a_tuple))  # <class 'int'>

# Correct: Need the comma
a_tuple = (42,)
print(type(a_tuple))  # <class 'tuple'>

# Clearer way
a_tuple = 42,
print(type(a_tuple))  # <class 'tuple'>
```

### Mutable Elements Pitfall

```python
# Be careful with mutable objects in tuples
t = ([1, 2], [3, 4])

# Looks like modifying tuple, actually modifies inner list
t[0].append(5)
print(t)  # ([1, 2, 5], [3, 4])

# But cannot reassign elements
# t[0] = [10, 20]  # TypeError

# This means such tuples are not hashable
# hash(t)  # TypeError: unhashable type: 'list'
```

### Unpacking Count Mismatch

```python
t = (1, 2, 3)

# Wrong: variable count doesn't match
# a, b = t  # ValueError: too many values to unpack

# Correct: Use * to collect extra values
a, *rest = t
print(a, rest)  # 1 [2, 3]

# Or ensure counts match
a, b, c = t
print(a, b, c)  # 1 2 3
```

### Namedtuple Field Name Constraints

```python
from collections import namedtuple

# Field names cannot be Python keywords
# Data = namedtuple('Data', ['class', 'for'])  # ValueError

# Use rename=True to auto-rename invalid fields
Data = namedtuple('Data', ['class', 'for', 'valid'], rename=True)
print(Data._fields)  # ('_0', '_1', 'valid')

# Field names cannot start with digits or contain special characters
# Bad = namedtuple('Bad', ['1field', 'my-field'])  # ValueError
```

### Performance Considerations

```python
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])

# Namedtuple attribute access is slightly slower than indexing
p = Point(3, 4)

# But in most cases the difference is negligible
print(p.x)   # Recommended: more readable
print(p[0])  # Avoid: less clear
```

---

## Performance Considerations

### Memory Efficiency

```python
import sys
from collections import namedtuple

# Regular class
class PointClass:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Class with __slots__
class PointSlots:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Named tuple
PointNT = namedtuple('PointNT', ['x', 'y'])

# Compare memory usage
p_class = PointClass(3, 4)
p_slots = PointSlots(3, 4)
p_tuple = (3, 4)
p_nt = PointNT(3, 4)

print(f"Regular class: {sys.getsizeof(p_class)} + {sys.getsizeof(p_class.__dict__)} bytes")
print(f"__slots__ class: {sys.getsizeof(p_slots)} bytes")
print(f"Tuple: {sys.getsizeof(p_tuple)} bytes")
print(f"Named tuple: {sys.getsizeof(p_nt)} bytes")

# Typical output:
# Regular class: 48 + 104 bytes
# __slots__ class: 48 bytes
# Tuple: 56 bytes
# Named tuple: 56 bytes
```

### Creation Speed

```python
import time
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])

n = 1000000

# Tuple creation
start = time.time()
for _ in range(n):
    t = (3, 4)
tuple_time = time.time() - start

# Named tuple creation
start = time.time()
for _ in range(n):
    p = Point(3, 4)
nt_time = time.time() - start

# List creation
start = time.time()
for _ in range(n):
    l = [3, 4]
list_time = time.time() - start

print(f"Tuple: {tuple_time:.4f} seconds")
print(f"Named tuple: {nt_time:.4f} seconds")
print(f"List: {list_time:.4f} seconds")
```

### Access Speed

```python
import time
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
t = (3, 4)

n = 10000000

# Tuple index access
start = time.time()
for _ in range(n):
    _ = t[0]
tuple_index_time = time.time() - start

# Named tuple index access
start = time.time()
for _ in range(n):
    _ = p[0]
nt_index_time = time.time() - start

# Named tuple attribute access
start = time.time()
for _ in range(n):
    _ = p.x
nt_attr_time = time.time() - start

print(f"Tuple indexing: {tuple_index_time:.4f} seconds")
print(f"Named tuple indexing: {nt_index_time:.4f} seconds")
print(f"Named tuple attribute: {nt_attr_time:.4f} seconds")
```

---

## Real-world Scenarios

### Scenario 1: Configuration Management

```python
from typing import NamedTuple

class DatabaseConfig(NamedTuple):
    host: str
    port: int
    database: str
    username: str
    password: str
    ssl: bool = False
    pool_size: int = 5

    @property
    def connection_string(self) -> str:
        protocol = "postgresql+ssl" if self.ssl else "postgresql"
        return f"{protocol}://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

class AppConfig(NamedTuple):
    db: DatabaseConfig
    debug: bool = False
    log_level: str = 'INFO'
    secret_key: str = ''

# Usage
db_config = DatabaseConfig(
    host='localhost',
    port=5432,
    database='myapp',
    username='admin',
    password='secret123'
)

app_config = AppConfig(db=db_config, debug=True)

print(app_config.db.connection_string)
# postgresql://admin:secret123@localhost:5432/myapp
```

### Scenario 2: API Response Handling

```python
from typing import NamedTuple, Optional, List, Any
from datetime import datetime

class APIError(NamedTuple):
    code: str
    message: str
    field: Optional[str] = None

class APIResponse(NamedTuple):
    success: bool
    data: Any
    errors: List[APIError] = []
    timestamp: str = ''

    @classmethod
    def ok(cls, data: Any) -> 'APIResponse':
        return cls(
            success=True,
            data=data,
            timestamp=datetime.now().isoformat()
        )

    @classmethod
    def error(cls, errors: List[APIError]) -> 'APIResponse':
        return cls(
            success=False,
            data=None,
            errors=errors,
            timestamp=datetime.now().isoformat()
        )

# Usage
response = APIResponse.ok({'user_id': 123, 'name': 'Alice'})
print(response.success)  # True
print(response.data)     # {'user_id': 123, 'name': 'Alice'}

error_response = APIResponse.error([
    APIError('VALIDATION_ERROR', 'Email is required', 'email'),
    APIError('VALIDATION_ERROR', 'Password too short', 'password')
])
print(error_response.errors)
```

### Scenario 3: Game Development Coordinate System

```python
from typing import NamedTuple
import math

class Position(NamedTuple):
    x: float
    y: float
    z: float = 0.0

    def distance_to(self, other: 'Position') -> float:
        return math.sqrt(
            (self.x - other.x) ** 2 +
            (self.y - other.y) ** 2 +
            (self.z - other.z) ** 2
        )

    def move(self, dx: float = 0, dy: float = 0, dz: float = 0) -> 'Position':
        return Position(self.x + dx, self.y + dy, self.z + dz)

    def __add__(self, other: 'Position') -> 'Position':
        return Position(self.x + other.x, self.y + other.y, self.z + other.z)

class Entity(NamedTuple):
    id: int
    name: str
    position: Position
    health: int = 100

    def move_to(self, new_position: Position) -> 'Entity':
        return self._replace(position=new_position)

    def take_damage(self, amount: int) -> 'Entity':
        return self._replace(health=max(0, self.health - amount))

# Game logic
player = Entity(1, "Hero", Position(0, 0))
enemy = Entity(2, "Monster", Position(10, 10))

distance = player.position.distance_to(enemy.position)
print(f"Distance to enemy: {distance:.2f}")

# Move player
player = player.move_to(player.position.move(dx=5, dy=3))
print(f"Player new position: {player.position}")

# Battle
enemy = enemy.take_damage(30)
print(f"Enemy remaining health: {enemy.health}")
```

### Scenario 4: Data Processing Pipeline

```python
from typing import NamedTuple, List, Iterator
from collections import namedtuple
import csv
from io import StringIO

# Define data model
class SalesRecord(NamedTuple):
    date: str
    product: str
    quantity: int
    price: float
    region: str

    @property
    def revenue(self) -> float:
        return self.quantity * self.price

# CSV data
csv_data = """date,product,quantity,price,region
2024-01-01,Widget A,100,9.99,North
2024-01-01,Widget B,50,19.99,South
2024-01-02,Widget A,75,9.99,North
2024-01-02,Widget C,200,4.99,East
2024-01-03,Widget B,30,19.99,West"""

def parse_records(csv_text: str) -> Iterator[SalesRecord]:
    """Parse CSV data to SalesRecord objects"""
    reader = csv.DictReader(StringIO(csv_text))
    for row in reader:
        yield SalesRecord(
            date=row['date'],
            product=row['product'],
            quantity=int(row['quantity']),
            price=float(row['price']),
            region=row['region']
        )

def filter_by_region(records: Iterator[SalesRecord], region: str) -> Iterator[SalesRecord]:
    """Filter by region"""
    for record in records:
        if record.region == region:
            yield record

def calculate_total_revenue(records: Iterator[SalesRecord]) -> float:
    """Calculate total revenue"""
    return sum(record.revenue for record in records)

# Data processing pipeline
records = parse_records(csv_data)
north_records = filter_by_region(records, 'North')
total = calculate_total_revenue(north_records)
print(f"North region total revenue: ${total:.2f}")

# Group by product
from collections import defaultdict

records = list(parse_records(csv_data))
product_revenue = defaultdict(float)
for record in records:
    product_revenue[record.product] += record.revenue

for product, revenue in sorted(product_revenue.items(), key=lambda x: -x[1]):
    print(f"{product}: ${revenue:.2f}")
```

---

## Interview Points

### Differences Between Tuples and Lists

**Question:** What are the differences between tuples and lists? When should you use tuples?

**Answer:**
- Mutability: Tuples are immutable, lists are mutable
- Syntax: Tuples use parentheses, lists use brackets
- Performance: Tuples are faster to create and use less memory
- Hashability: Tuples can be hashable (if elements are hashable) and serve as dict keys; lists cannot
- Use cases:
  - Tuples: Fixed data, multiple return values, dictionary keys, constant configurations
  - Lists: Dynamic collections, data that needs modification

### Tuple Immutability

**Question:** Are tuples truly completely immutable?

**Answer:**
Tuple "immutability" refers to the fact that element references cannot change, but if an element is a mutable object (like a list), that object's content can change:

```python
t = ([1, 2], 3)
t[0].append(4)  # Legal, t becomes ([1, 2, 4], 3)
# t[0] = []     # Illegal, TypeError
```

### Named Tuple Advantages

**Question:** When should you use named tuples instead of regular classes?

**Answer:**
- Need lightweight data containers
- Data shouldn't be modified (immutable)
- Need field name access
- Need tuple features (unpacking, hashing)
- Replace simple classes with only data and no methods

### Namedtuple vs Dataclass

**Question:** How do you choose between named tuples and dataclasses?

**Answer:**
- Named tuples:
  - Immutable
  - More memory efficient
  - Support index access and unpacking
  - Can be used as dictionary keys

- Dataclasses:
  - Mutable by default (can be made immutable)
  - Support default factory functions
  - More flexible field configuration
  - Better inheritance support

```python
from dataclasses import dataclass
from typing import NamedTuple

# Choose named tuple: simple immutable data
class Point(NamedTuple):
    x: float
    y: float

# Choose dataclass: need mutable or complex initialization
@dataclass
class User:
    name: str
    age: int
    friends: list = None

    def __post_init__(self):
        if self.friends is None:
            self.friends = []
```

### Tuple Unpacking Techniques

**Question:** Demonstrate advanced tuple unpacking usage.

**Answer:**

```python
# Basic unpacking
a, b, c = (1, 2, 3)

# Asterisk collection
first, *rest = (1, 2, 3, 4)  # first=1, rest=[2,3,4]
*init, last = (1, 2, 3, 4)   # init=[1,2,3], last=4

# Nested unpacking
(a, b), (c, d) = [(1, 2), (3, 4)]

# Swap variables
a, b = b, a

# Ignore values
_, x, _ = (1, 2, 3)

# Function parameter unpacking
def func(a, b, c):
    return a + b + c

args = (1, 2, 3)
result = func(*args)
```

---

## Further Reading

### Official Documentation
- [Python Official Documentation - Tuples](https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences)
- [collections.namedtuple](https://docs.python.org/3/library/collections.html#collections.namedtuple)
- [typing.NamedTuple](https://docs.python.org/3/library/typing.html#typing.NamedTuple)

### Related PEPs
- [PEP 3132 - Extended Iterable Unpacking](https://peps.python.org/pep-3132/) - Asterisk unpacking syntax
- [PEP 526 - Syntax for Variable Annotations](https://peps.python.org/pep-0526/) - Type annotation syntax

### Related Topics
- [Dataclasses](/python/dataclasses) - More flexible data containers
- [Collections Module](/python/collections) - Other advanced data structures
- [Type Hints](/python/type-hints) - Python type system
- [List Comprehensions](/python/list-comprehensions) - Creating lists efficiently
