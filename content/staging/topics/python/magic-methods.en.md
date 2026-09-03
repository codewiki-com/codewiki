---
title: Python Magic Methods
description: "Deep dive into Python special methods: construction, string representation, comparison, container protocol"
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - Magic Methods
  - Special Methods
  - Protocols
status: imported
origin: old/src/content/docs/python/magic-methods.en.md
divergence: 0.31
issues: []
legacy:
  category: Python
  subcategory: Object-Oriented Programming
  order: 7
  lastUpdated: 2026-01-07
---

Magic methods (also called dunder methods, from "double underscore") are special methods in Python that enable you to define how objects of your classes behave with built-in operations. These methods are always surrounded by double underscores, like `__init__` or `__str__`.

## Object Construction and Destruction

### `__new__`: Object Creation

`__new__` is called before `__init__` and is responsible for creating and returning a new instance. It's a class method that receives the class as its first argument.

```python
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            print("Creating new instance")
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value):
        self.value = value

# Usage
s1 = Singleton(10)
s2 = Singleton(20)
print(s1 is s2)  # True - same instance
print(s1.value)  # 20 - last initialized value
```

### `__init__`: Object Initialization

`__init__` initializes the newly created object. It's called after `__new__` and is the most commonly overridden magic method.

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self._id = id(self)
        print(f"Initializing {name}")

    def __repr__(self):
        return f"Person('{self.name}', {self.age})"

# Usage
person = Person("Alice", 30)
# Output: Initializing Alice
```

### `__del__`: Object Destruction

`__del__` is called when an object is about to be destroyed. Use it for cleanup operations, but be cautious as the timing is unpredictable.

```python
class FileHandler:
    def __init__(self, filename):
        self.filename = filename
        self.file = open(filename, 'w')
        print(f"Opened {filename}")

    def write(self, data):
        self.file.write(data)

    def __del__(self):
        if hasattr(self, 'file') and not self.file.closed:
            self.file.close()
            print(f"Closed {self.filename}")

# Usage
handler = FileHandler("test.txt")
handler.write("Hello, World!")
del handler  # Explicitly delete
# Output: Closed test.txt
```

**Note**: For resource management, prefer context managers (`with` statement) over `__del__`.

## String Representation

### `__str__`: User-Friendly String

`__str__` returns a user-friendly string representation, used by `str()` and `print()`.

```python
class Book:
    def __init__(self, title, author, year):
        self.title = title
        self.author = author
        self.year = year

    def __str__(self):
        return f"'{self.title}' by {self.author} ({self.year})"

# Usage
book = Book("1984", "George Orwell", 1949)
print(book)  # '1984' by George Orwell (1949)
```

### `__repr__`: Developer-Friendly Representation

`__repr__` returns an unambiguous representation, ideally valid Python code to recreate the object. Used by `repr()` and in the interactive interpreter.

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

    def __str__(self):
        return f"({self.x}, {self.y})"

# Usage
p = Point(3, 4)
print(str(p))   # (3, 4)
print(repr(p))  # Point(3, 4)
print(p)        # (3, 4) - uses __str__
print([p])      # [Point(3, 4)] - uses __repr__ in containers
```

### `__format__`: Custom Formatting

`__format__` enables custom formatting with f-strings and `format()`.

```python
class Money:
    def __init__(self, amount, currency="USD"):
        self.amount = amount
        self.currency = currency

    def __format__(self, format_spec):
        if format_spec == "":
            format_spec = ".2f"
        formatted = format(self.amount, format_spec)
        return f"{formatted} {self.currency}"

# Usage
money = Money(1234.567)
print(f"{money}")        # 1234.57 USD
print(f"{money:.0f}")    # 1235 USD
print(f"{money:,.2f}")   # 1,234.57 USD
```

## Comparison Operations

### Rich Comparison Methods

Python provides six comparison magic methods:

```python
class Version:
    def __init__(self, major, minor, patch):
        self.major = major
        self.minor = minor
        self.patch = patch

    def _as_tuple(self):
        return (self.major, self.minor, self.patch)

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._as_tuple() == other._as_tuple()

    def __ne__(self, other):
        result = self.__eq__(other)
        if result is NotImplemented:
            return result
        return not result

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._as_tuple() < other._as_tuple()

    def __le__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._as_tuple() <= other._as_tuple()

    def __gt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._as_tuple() > other._as_tuple()

    def __ge__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._as_tuple() >= other._as_tuple()

    def __repr__(self):
        return f"Version({self.major}, {self.minor}, {self.patch})"

# Usage
v1 = Version(1, 2, 3)
v2 = Version(1, 3, 0)
v3 = Version(1, 2, 3)

print(v1 == v3)  # True
print(v1 < v2)   # True
print(v2 > v1)   # True
print(sorted([v2, v1, v3]))  # [Version(1, 2, 3), Version(1, 2, 3), Version(1, 3, 0)]
```

### Using `functools.total_ordering`

For simpler implementation, use the `@total_ordering` decorator:

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
        return f"Student('{self.name}', {self.grade})"

# Usage - only __eq__ and __lt__ defined, but all comparisons work
s1 = Student("Alice", 85)
s2 = Student("Bob", 92)
print(s1 < s2)   # True
print(s1 <= s2)  # True
print(s2 > s1)   # True
print(s2 >= s1)  # True
```

## Container Protocol

### Sequence Protocol

Implement `__len__`, `__getitem__`, and optionally `__setitem__` and `__delitem__`:

```python
class CircularBuffer:
    def __init__(self, capacity):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.size = 0
        self.write_pos = 0

    def __len__(self):
        return self.size

    def __getitem__(self, index):
        if not isinstance(index, int):
            raise TypeError("Index must be an integer")
        if index < 0 or index >= self.size:
            raise IndexError("Index out of range")
        actual_index = (self.write_pos - self.size + index) % self.capacity
        return self.buffer[actual_index]

    def __setitem__(self, index, value):
        if not isinstance(index, int):
            raise TypeError("Index must be an integer")
        if index < 0 or index >= self.size:
            raise IndexError("Index out of range")
        actual_index = (self.write_pos - self.size + index) % self.capacity
        self.buffer[actual_index] = value

    def __iter__(self):
        for i in range(self.size):
            yield self[i]

    def __repr__(self):
        return f"CircularBuffer({list(self)})"

    def append(self, item):
        self.buffer[self.write_pos] = item
        self.write_pos = (self.write_pos + 1) % self.capacity
        if self.size < self.capacity:
            self.size += 1

# Usage
cb = CircularBuffer(3)
cb.append(1)
cb.append(2)
cb.append(3)
print(cb)        # CircularBuffer([1, 2, 3])
print(len(cb))   # 3
print(cb[0])     # 1

cb.append(4)     # Overwrites 1
print(cb)        # CircularBuffer([2, 3, 4])
print(cb[0])     # 2

for item in cb:
    print(item)  # 2, 3, 4
```

### `__contains__`: Membership Testing

```python
class Range:
    def __init__(self, start, end):
        self.start = start
        self.end = end

    def __contains__(self, item):
        return self.start <= item < self.end

    def __repr__(self):
        return f"Range({self.start}, {self.end})"

# Usage
r = Range(0, 10)
print(5 in r)     # True
print(10 in r)    # False
print(-1 in r)    # False
```

### Mapping Protocol

Implement dictionary-like behavior:

```python
class CaseInsensitiveDict:
    def __init__(self):
        self._data = {}

    def __getitem__(self, key):
        return self._data[key.lower()]

    def __setitem__(self, key, value):
        self._data[key.lower()] = value

    def __delitem__(self, key):
        del self._data[key.lower()]

    def __contains__(self, key):
        return key.lower() in self._data

    def __len__(self):
        return len(self._data)

    def __iter__(self):
        return iter(self._data)

    def __repr__(self):
        return f"CaseInsensitiveDict({dict(self._data)})"

    def keys(self):
        return self._data.keys()

    def values(self):
        return self._data.values()

    def items(self):
        return self._data.items()

# Usage
d = CaseInsensitiveDict()
d["Name"] = "Alice"
d["AGE"] = 30

print(d["name"])     # Alice
print(d["age"])      # 30
print("NAME" in d)   # True
print(len(d))        # 2

for key in d:
    print(f"{key}: {d[key]}")
```

## Context Management

### `__enter__` and `__exit__`: The `with` Statement

Context managers handle resource setup and cleanup:

```python
class DatabaseConnection:
    def __init__(self, db_name):
        self.db_name = db_name
        self.connection = None

    def __enter__(self):
        print(f"Opening connection to {self.db_name}")
        self.connection = f"Connection to {self.db_name}"
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        print(f"Closing connection to {self.db_name}")
        if exc_type is not None:
            print(f"Exception occurred: {exc_type.__name__}: {exc_value}")
            # Return True to suppress exception, False to propagate
            return False
        return True

    def query(self, sql):
        if self.connection is None:
            raise RuntimeError("Not connected to database")
        return f"Results from: {sql}"

# Usage
with DatabaseConnection("users.db") as db:
    result = db.query("SELECT * FROM users")
    print(result)
# Output:
# Opening connection to users.db
# Results from: SELECT * FROM users
# Closing connection to users.db
```

### Advanced Context Manager Example

```python
import time

class Timer:
    def __init__(self, name="Operation"):
        self.name = name
        self.start_time = None
        self.elapsed = None

    def __enter__(self):
        self.start_time = time.time()
        print(f"{self.name} started...")
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.elapsed = time.time() - self.start_time
        if exc_type is None:
            print(f"{self.name} completed in {self.elapsed:.4f} seconds")
        else:
            print(f"{self.name} failed after {self.elapsed:.4f} seconds")
        return False  # Don't suppress exceptions

# Usage
with Timer("Data processing") as timer:
    time.sleep(0.1)
    # Do some work
    result = sum(range(1000000))

print(f"Elapsed time: {timer.elapsed:.4f}s")
```

## Callable Objects

### `__call__`: Making Objects Callable

```python
class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        return x * self.factor

    def __repr__(self):
        return f"Multiplier({self.factor})"

# Usage
times_three = Multiplier(3)
print(times_three(5))    # 15
print(times_three(10))   # 30

# Can be used as a function
numbers = [1, 2, 3, 4, 5]
result = list(map(times_three, numbers))
print(result)  # [3, 6, 9, 12, 15]
```

### Stateful Callable Example

```python
class Counter:
    def __init__(self):
        self.count = 0

    def __call__(self):
        self.count += 1
        return self.count

    def reset(self):
        self.count = 0

# Usage
counter = Counter()
print(counter())  # 1
print(counter())  # 2
print(counter())  # 3
counter.reset()
print(counter())  # 1
```

### Decorator as Callable Class

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.call_count = 0

    def __call__(self, *args, **kwargs):
        self.call_count += 1
        print(f"Call {self.call_count} to {self.func.__name__}")
        return self.func(*args, **kwargs)

    def reset(self):
        self.call_count = 0

# Usage
@CountCalls
def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))  # Call 1 to greet
print(greet("Bob"))    # Call 2 to greet
print(f"Total calls: {greet.call_count}")  # Total calls: 2
```

## Attribute Access

### `__getattr__`: Handling Missing Attributes

```python
class DynamicObject:
    def __init__(self):
        self.data = {}

    def __getattr__(self, name):
        # Called when attribute is not found through normal lookup
        if name in self.data:
            return self.data[name]
        raise AttributeError(f"'{type(self).__name__}' has no attribute '{name}'")

    def __setattr__(self, name, value):
        # Intercept all attribute assignments
        if name == 'data':
            # Allow setting 'data' directly to avoid infinite recursion
            super().__setattr__(name, value)
        else:
            self.data[name] = value

    def __delattr__(self, name):
        if name in self.data:
            del self.data[name]
        else:
            raise AttributeError(f"'{type(self).__name__}' has no attribute '{name}'")

# Usage
obj = DynamicObject()
obj.name = "Alice"
obj.age = 30
print(obj.name)    # Alice
print(obj.age)     # 30
del obj.age
# print(obj.age)   # Would raise AttributeError
```

### `__getattribute__`: Intercepting All Attribute Access

```python
class LoggedAccess:
    def __init__(self):
        # Use super().__setattr__ to avoid infinite recursion
        super().__setattr__('_log', [])
        super().__setattr__('name', "Default")

    def __getattribute__(self, name):
        # Called for ALL attribute access
        if name == '_log':
            # Access _log directly to avoid infinite recursion
            return super().__getattribute__(name)

        log = super().__getattribute__('_log')
        log.append(f"Accessed: {name}")
        return super().__getattribute__(name)

    def show_log(self):
        return self._log

# Usage
obj = LoggedAccess()
obj.name
obj.name
print(obj.show_log())  # ['Accessed: name', 'Accessed: name', 'Accessed: show_log']
```

### Property-like Behavior with Magic Methods

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    def __getattr__(self, name):
        if name == 'fahrenheit':
            return self._celsius * 9/5 + 32
        elif name == 'kelvin':
            return self._celsius + 273.15
        raise AttributeError(f"'{type(self).__name__}' has no attribute '{name}'")

    def __setattr__(self, name, value):
        if name == '_celsius':
            super().__setattr__(name, value)
        elif name == 'fahrenheit':
            self._celsius = (value - 32) * 5/9
        elif name == 'kelvin':
            self._celsius = value - 273.15
        elif name == 'celsius':
            self._celsius = value
        else:
            super().__setattr__(name, value)

# Usage
temp = Temperature(0)
print(f"{temp._celsius}°C")      # 0°C
print(f"{temp.fahrenheit}°F")    # 32.0°F
print(f"{temp.kelvin}K")         # 273.15K

temp.fahrenheit = 98.6
print(f"{temp._celsius}°C")      # 37.0°C
```

## Descriptor Protocol

Descriptors are objects that define how attribute access is handled through `__get__`, `__set__`, and `__delete__`.

### Basic Descriptor Example

```python
class Validator:
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def __set_name__(self, owner, name):
        # Called when descriptor is assigned to class attribute
        self.name = name
        self.private_name = f"_{name}"

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be a number")
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"{self.name} must be >= {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"{self.name} must be <= {self.max_value}")
        setattr(instance, self.private_name, value)

class Person:
    age = Validator(min_value=0, max_value=150)
    height = Validator(min_value=0)

    def __init__(self, age, height):
        self.age = age
        self.height = height

# Usage
person = Person(30, 175)
print(person.age)     # 30
person.age = 35       # OK
# person.age = -5     # ValueError: age must be >= 0
# person.age = 200    # ValueError: age must be <= 150
# person.age = "30"   # TypeError: age must be a number
```

### Lazy Property Descriptor

```python
class LazyProperty:
    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # Compute value and cache it as instance attribute
        value = self.func(instance)
        setattr(instance, self.name, value)
        return value

class DataProcessor:
    def __init__(self, data):
        self.data = data

    @LazyProperty
    def expensive_computation(self):
        print("Computing expensive result...")
        return sum(x**2 for x in self.data)

# Usage
processor = DataProcessor([1, 2, 3, 4, 5])
print(processor.expensive_computation)  # Computing expensive result... 55
print(processor.expensive_computation)  # 55 (cached, no recomputation)
```

### Typed Descriptor

```python
class TypedProperty:
    def __init__(self, expected_type):
        self.expected_type = expected_type

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f"_{name}"

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(
                f"{self.name} must be of type {self.expected_type.__name__}, "
                f"got {type(value).__name__}"
            )
        setattr(instance, self.private_name, value)

class User:
    name = TypedProperty(str)
    age = TypedProperty(int)
    email = TypedProperty(str)

    def __init__(self, name, age, email):
        self.name = name
        self.age = age
        self.email = email

    def __repr__(self):
        return f"User('{self.name}', {self.age}, '{self.email}')"

# Usage
user = User("Alice", 30, "alice@example.com")
print(user)           # User('Alice', 30, 'alice@example.com')
user.name = "Bob"     # OK
# user.age = "30"     # TypeError: age must be of type int, got str
```

## Arithmetic Operations

### Arithmetic Magic Methods

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented

    def __sub__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x - other.x, self.y - other.y)
        return NotImplemented

    def __mul__(self, scalar):
        if isinstance(scalar, (int, float)):
            return Vector(self.x * scalar, self.y * scalar)
        return NotImplemented

    def __rmul__(self, scalar):
        # Reverse multiplication (scalar * vector)
        return self.__mul__(scalar)

    def __truediv__(self, scalar):
        if isinstance(scalar, (int, float)):
            if scalar == 0:
                raise ValueError("Cannot divide by zero")
            return Vector(self.x / scalar, self.y / scalar)
        return NotImplemented

    def __neg__(self):
        return Vector(-self.x, -self.y)

    def __abs__(self):
        return (self.x**2 + self.y**2)**0.5

    def __eq__(self, other):
        if isinstance(other, Vector):
            return self.x == other.x and self.y == other.y
        return NotImplemented

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

# Usage
v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(v1 + v2)      # Vector(4, 6)
print(v1 - v2)      # Vector(2, 2)
print(v1 * 2)       # Vector(6, 8)
print(3 * v1)       # Vector(9, 12)
print(v1 / 2)       # Vector(1.5, 2.0)
print(-v1)          # Vector(-3, -4)
print(abs(v1))      # 5.0
print(v1 == Vector(3, 4))  # True
```

## Best Practices

### Return `NotImplemented` for Incompatible Types

```python
class MyNumber:
    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        if isinstance(other, MyNumber):
            return self.value == other.value
        if isinstance(other, (int, float)):
            return self.value == other
        return NotImplemented  # Let Python try other.__eq__
```

### Use `@property` Instead of Simple Getters/Setters

```python
# Avoid excessive use of magic methods when properties suffice
class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def radius(self):
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

    @property
    def area(self):
        return 3.14159 * self._radius ** 2
```

### Implement `__repr__` for All Classes

```python
# Always provide a useful repr
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def __repr__(self):
        return f"{self.__class__.__name__}({self.width}, {self.height})"
```

### Document Magic Method Behavior

```python
class CustomList:
    """A list-like container with special behavior.

    Magic methods:
    - __getitem__: Supports indexing and slicing
    - __len__: Returns number of elements
    - __contains__: Supports 'in' operator
    """
    def __init__(self, items):
        self._items = list(items)

    def __getitem__(self, index):
        """Get item by index or slice."""
        return self._items[index]

    def __len__(self):
        """Return number of items."""
        return len(self._items)

    def __contains__(self, item):
        """Check if item exists in collection."""
        return item in self._items
```

## Summary

Magic methods are powerful tools that enable you to:

- **Customize object creation and initialization** with `__new__` and `__init__`
- **Control string representation** with `__str__` and `__repr__`
- **Define comparison behavior** with `__eq__`, `__lt__`, etc.
- **Implement container protocols** with `__getitem__`, `__setitem__`, `__len__`
- **Manage resources** with `__enter__` and `__exit__`
- **Create callable objects** with `__call__`
- **Control attribute access** with `__getattr__`, `__setattr__`, etc.
- **Build reusable descriptors** with `__get__`, `__set__`, `__delete__`

Understanding and properly implementing magic methods allows you to create Pythonic, intuitive APIs that integrate seamlessly with Python's built-in operations and syntax.
