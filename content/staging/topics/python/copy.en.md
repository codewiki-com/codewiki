---
title: "Python Copy Module: Shallow vs Deep Copy"
description: Master Python's copy module to understand shallow copy vs deep copy, reference semantics, and proper object duplication strategies
track: python
section: basics
difficulty: intermediate
tags:
  - Python
  - copy
  - shallow copy
  - deep copy
  - object duplication
  - references
status: imported
origin: old/src/content/docs/python/copy.en.md
divergence: 0.209
issues: []
legacy:
  category: Python
  subcategory: Data Structures
  order: 28
  lastUpdated: 2026-01-07
---

The `copy` module is essential for understanding how Python handles object duplication. When working with mutable objects like lists, dictionaries, and custom classes, understanding the difference between shallow copy and deep copy is crucial to avoid unexpected bugs and data corruption. This comprehensive guide covers everything you need to know about copying in Python, from basic concepts to advanced techniques and real-world scenarios.

## Concept Explanation

### What is the Copy Module?

The `copy` module in Python provides functions for creating copies of objects. It distinguishes between two types of copying:

1. **Shallow Copy**: Creates a new object but doesn't recursively copy nested objects
2. **Deep Copy**: Creates a completely independent copy, including all nested objects

### Assignment vs Copying

Before diving into the copy module, it's important to understand what copying actually means in Python:

```python
# Assignment - creates a reference, NOT a copy
original = [1, 2, 3]
reference = original
reference.append(4)
print(original)  # [1, 2, 3, 4] - original is modified!

# Both variables point to the same object in memory
print(original is reference)  # True
```

### Why Do We Need Copying?

Consider this problem:

```python
# Problem: we want to modify a list without changing the original
data = [1, 2, [3, 4]]
modified = data  # This doesn't create a copy!
modified[2].append(5)
print(data)  # [1, 2, [3, 4, 5]] - oops, original was modified!
```

The copy module solves this by providing proper duplication mechanisms.

## Core Principles

### Principle 1: Reference Semantics in Python

Python uses reference semantics for all objects. When you assign an object to a variable, you're creating a reference to that object in memory, not creating a copy:

```python
import copy

original = {'name': 'Alice', 'scores': [90, 85, 88]}

# Reference: both variables point to same object
ref = original
print(ref is original)  # True

# Shallow copy: new container, shared nested objects
shallow = copy.copy(original)
print(shallow is original)  # False
print(shallow == original)  # True
print(shallow['scores'] is original['scores'])  # True (nested objects shared)

# Deep copy: completely independent
deep = copy.deepcopy(original)
print(deep is original)  # False
print(deep['scores'] is original['scores'])  # False (nested objects also copied)
```

### Principle 2: Shallow Copy Behavior

A shallow copy creates a new object but doesn't create copies of the objects it contains:

```python
import copy

# For mutable objects, shallow copy creates new container
original_list = [1, 2, [3, 4]]
shallow_list = copy.copy(original_list)

# Top-level is different
print(original_list is shallow_list)  # False

# But nested objects are the same
print(original_list[2] is shallow_list[2])  # True

# Modifying nested object affects both
shallow_list[2].append(5)
print(original_list)  # [1, 2, [3, 4, 5]]
```

### Principle 3: Deep Copy Behavior

A deep copy creates independent copies of all nested objects:

```python
import copy

original = {'data': [1, 2, {'nested': [3, 4]}]}
deep = copy.deepcopy(original)

# Everything is independent
print(deep is original)  # False
print(deep['data'] is original['data'])  # False
print(deep['data'][2] is original['data'][2])  # False

# Modifying deep copy doesn't affect original
deep['data'][2]['nested'].append(5)
print(original)  # {'data': [1, 2, {'nested': [3, 4]}]} - unchanged
print(deep)  # {'data': [1, 2, {'nested': [3, 4, 5]}]}
```

### Principle 4: Immutable Objects Don't Need Copying

Immutable objects (int, str, tuple) can share references safely:

```python
import copy

# Immutable objects aren't actually copied
original_tuple = (1, 2, 3)
shallow = copy.copy(original_tuple)
deep = copy.deepcopy(original_tuple)

# They're the same object (optimization)
print(original_tuple is shallow)  # True
print(original_tuple is deep)  # True

# Immutable strings
original_str = "hello"
copied_str = copy.copy(original_str)
print(original_str is copied_str)  # True (not actually copied)
```

## Key Points

### Shallow Copy with `copy.copy()`

```python
import copy

# Works with lists
original_list = [1, 2, 3]
copied_list = copy.copy(original_list)
copied_list.append(4)
print(original_list)  # [1, 2, 3] - unchanged

# Works with dictionaries
original_dict = {'a': 1, 'b': 2}
copied_dict = copy.copy(original_dict)
copied_dict['c'] = 3
print(original_dict)  # {'a': 1, 'b': 2} - unchanged

# Works with custom objects
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

original_point = Point(1, 2)
copied_point = copy.copy(original_point)
print(original_point is copied_point)  # False
print(original_point.x is copied_point.x)  # True (same x value object)
```

### Deep Copy with `copy.deepcopy()`

```python
import copy

# Deep copy handles nested structures
original = {
    'name': 'Alice',
    'hobbies': ['reading', 'gaming'],
    'address': {'city': 'NYC', 'zip': '10001'}
}

deep = copy.deepcopy(original)

# All nested objects are independent
deep['hobbies'].append('coding')
deep['address']['city'] = 'LA'

print(original)
# {'name': 'Alice',
#  'hobbies': ['reading', 'gaming'],
#  'address': {'city': 'NYC', 'zip': '10001'}}

print(deep)
# {'name': 'Alice',
#  'hobbies': ['reading', 'gaming', 'coding'],
#  'address': {'city': 'LA', 'zip': '10001'}}
```

### Alternatives to `copy.copy()`

```python
original_list = [1, 2, 3]

# All these create shallow copies:
copy1 = original_list[:]           # Slice notation
copy2 = original_list.copy()        # List.copy() method
copy3 = list(original_list)         # Constructor
copy4 = copy.copy(original_list)    # copy module

# For dictionaries:
original_dict = {'a': 1, 'b': 2}

copy1 = original_dict.copy()        # Dict.copy() method
copy2 = dict(original_dict)         # Constructor
copy3 = copy.copy(original_dict)    # copy module

# For custom objects, copy module is often necessary
import copy
original_obj = MyClass()
copied_obj = copy.copy(original_obj)  # Only way for custom classes
```

### Handling Circular References

```python
import copy

# Create circular reference
list1 = [1, 2]
list2 = [3, 4, list1]
list1.append(list2)  # Now list1 contains list2 which contains list1

# Deep copy handles circular references automatically
deep = copy.deepcopy(list1)
print(len(deep))  # 3
print(deep[2] is deep)  # False - they're different objects
```

### Custom Copy Behavior with `__copy__` and `__deepcopy__`

```python
import copy

class Person:
    def __init__(self, name, age, friends=None):
        self.name = name
        self.age = age
        self.friends = friends or []

    def __copy__(self):
        # Custom shallow copy
        print(f"Shallow copying {self.name}")
        return Person(self.name, self.age, self.friends)

    def __deepcopy__(self, memo):
        # Custom deep copy
        print(f"Deep copying {self.name}")
        new_person = Person(
            self.name,
            self.age,
            copy.deepcopy(self.friends, memo)
        )
        return new_person

    def __repr__(self):
        return f"Person(name={self.name}, age={self.age}, friends={self.friends})"

# Using custom copy methods
alice = Person("Alice", 30, ["Bob", "Charlie"])

shallow = copy.copy(alice)  # Prints: Shallow copying Alice
deep = copy.deepcopy(alice)  # Prints: Deep copying Alice

# Shallow copy shares the friends list
print(shallow.friends is alice.friends)  # True

# Deep copy has independent friends list
print(deep.friends is alice.friends)  # False
```

## Code Examples

### Example 1: Lists with Nested Structures

```python
import copy

# Original list with nested list
original = [1, 2, [3, 4, 5]]

# Shallow copy
shallow = copy.copy(original)
shallow[0] = 999
shallow[2].append(6)

print("Original:", original)  # [1, 2, [3, 4, 5, 6]] - nested modified
print("Shallow: ", shallow)   # [999, 2, [3, 4, 5, 6]]

# Deep copy
original = [1, 2, [3, 4, 5]]
deep = copy.deepcopy(original)
deep[0] = 999
deep[2].append(6)

print("Original:", original)  # [1, 2, [3, 4, 5]] - unchanged
print("Deep:    ", deep)      # [999, 2, [3, 4, 5, 6]]
```

### Example 2: Dictionaries with Nested Objects

```python
import copy

class Config:
    def __init__(self, database, debug=False):
        self.database = database
        self.debug = debug

# Original config
original = {
    'app': 'MyApp',
    'settings': {'timeout': 30, 'retries': 3},
    'config': Config({'host': 'localhost'})
}

# Shallow copy
shallow = copy.copy(original)
shallow['settings']['timeout'] = 60
shallow['config'].debug = True

print("Original settings:", original['settings'])  # {'timeout': 60, 'retries': 3}
print("Original debug:   ", original['config'].debug)  # True

# Deep copy
original = {
    'app': 'MyApp',
    'settings': {'timeout': 30, 'retries': 3},
    'config': Config({'host': 'localhost'})
}

deep = copy.deepcopy(original)
deep['settings']['timeout'] = 60
deep['config'].debug = True

print("Original settings:", original['settings'])  # {'timeout': 30, 'retries': 3}
print("Original debug:   ", original['config'].debug)  # False
```

### Example 3: Working with Objects in Collections

```python
import copy

class Student:
    def __init__(self, name, grades):
        self.name = name
        self.grades = grades

    def __repr__(self):
        return f"Student({self.name}, {self.grades})"

# Original list of students
students = [
    Student("Alice", [90, 85, 92]),
    Student("Bob", [78, 82, 88]),
    Student("Charlie", [95, 91, 89])
]

# Shallow copy - new list, but same student objects
shallow_students = copy.copy(students)
shallow_students[0].grades.append(95)

print("Original Alice grades:", students[0].grades)  # [90, 85, 92, 95]

# Deep copy - completely independent
students = [
    Student("Alice", [90, 85, 92]),
    Student("Bob", [78, 82, 88]),
    Student("Charlie", [95, 91, 89])
]

deep_students = copy.deepcopy(students)
deep_students[0].grades.append(95)

print("Original Alice grades:", students[0].grades)  # [90, 85, 92]
print("Deep Alice grades:   ", deep_students[0].grades)  # [90, 85, 92, 95]
```

### Example 4: Implementing Custom Copy Logic

```python
import copy

class Database:
    def __init__(self, connection_string, cache=None):
        self.connection_string = connection_string
        self.cache = cache or {}
        self.query_count = 0

    def __copy__(self):
        # For shallow copy, share the cache but reset query count
        db_copy = Database(self.connection_string, self.cache)
        db_copy.query_count = self.query_count
        return db_copy

    def __deepcopy__(self, memo):
        # For deep copy, create independent cache and reset query count
        db_copy = Database(
            self.connection_string,
            copy.deepcopy(self.cache, memo)
        )
        # Don't copy query_count - start fresh
        return db_copy

    def __repr__(self):
        return f"Database({self.connection_string}, cache_size={len(self.cache)}, queries={self.query_count})"

# Using custom copy
original_db = Database("postgresql://localhost", {'user': 'alice'})
original_db.query_count = 100

shallow_db = copy.copy(original_db)
deep_db = copy.deepcopy(original_db)

# Shallow copy shares cache
print("Caches are same:", shallow_db.cache is original_db.cache)  # True

# Deep copy has independent cache
print("Caches are different:", deep_db.cache is original_db.cache)  # False

# Query counts
print("Original:", original_db.query_count)  # 100
print("Shallow: ", shallow_db.query_count)   # 100
print("Deep:    ", deep_db.query_count)      # 0
```

### Example 5: Comparing Copy Methods

```python
import copy
import time

class DataHolder:
    def __init__(self, data):
        self.data = data

# Create large nested structure
large_list = [[i for i in range(100)] for _ in range(100)]

# Test different copy methods
holder = DataHolder(large_list)

# Shallow copy
start = time.time()
for _ in range(1000):
    copy.copy(holder)
shallow_time = time.time() - start

# Deep copy
start = time.time()
for _ in range(1000):
    copy.deepcopy(holder)
deep_time = time.time() - start

print(f"Shallow copy time: {shallow_time:.4f}s")
print(f"Deep copy time: {deep_time:.4f}s")
print(f"Deep copy is ~{deep_time/shallow_time:.1f}x slower")
```

## Best Practices

### Use Shallow Copy When Nested Objects Don't Need Independence

```python
# Good: modifying the copy doesn't affect original
import copy

original_scores = [90, 85, 88]
player_copy = copy.copy(original_scores)
player_copy[0] = 100

print(original_scores)  # [90, 85, 88] - unaffected
```

### Use Deep Copy for Complex Nested Structures

```python
import copy

# Original configuration
config = {
    'database': {
        'primary': {'host': 'db1.example.com', 'port': 5432},
        'replica': {'host': 'db2.example.com', 'port': 5432}
    },
    'cache': {'ttl': 3600, 'max_size': 10000}
}

# Always deep copy complex configs to avoid unintended sharing
test_config = copy.deepcopy(config)
test_config['database']['primary']['host'] = 'localhost'
test_config['cache']['ttl'] = 60

# Original unchanged
print(config['database']['primary']['host'])  # 'db1.example.com'
print(config['cache']['ttl'])  # 3600
```

### Be Explicit About Copy Intentions

```python
import copy

def process_list(data):
    # Make intent clear: we need an independent copy
    data_copy = copy.deepcopy(data)

    # Now safely modify
    data_copy.sort()
    data_copy.reverse()

    return data_copy

original = [3, 1, 4, 1, 5]
result = process_list(original)
print(original)  # [3, 1, 4, 1, 5] - unchanged
```

### Implement Custom Copy Methods for Specific Behavior

```python
import copy

class CacheableObject:
    def __init__(self, data, cache=None):
        self.data = data
        self.cache = cache or {}
        self._cached = False

    def __deepcopy__(self, memo):
        # When deep copying, clear cache for fresh computation
        new_obj = CacheableObject(copy.deepcopy(self.data, memo))
        new_obj._cached = False  # Force recomputation
        return new_obj

obj = CacheableObject([1, 2, 3])
obj.cache = {'computed': True}
obj._cached = True

obj_copy = copy.deepcopy(obj)
print(obj._cached)       # True
print(obj_copy._cached)  # False
print(obj_copy.cache)    # {} - cache cleared
```

### Use Copy for Defensive Programming

```python
import copy

class DataManager:
    def __init__(self, data):
        self._data = data

    def get_data(self):
        # Return a deep copy to prevent external modification
        return copy.deepcopy(self._data)

    def set_data(self, data):
        # Store a deep copy to prevent external modification
        self._data = copy.deepcopy(data)

manager = DataManager({'count': 0})
data = manager.get_data()
data['count'] = 999

print(manager.get_data())  # {'count': 0} - unaffected by external changes
```

## Common Pitfalls

### Pitfall 1: Forgetting Shallow Copy Shares Nested Objects

```python
import copy

# WRONG - thinking shallow copy creates full independence
original = [[1, 2], [3, 4]]
shallow = copy.copy(original)
shallow[0][0] = 999

print(original)  # [[999, 2], [3, 4]] - OOPS, original was modified!

# RIGHT - use deep copy for nested structures
original = [[1, 2], [3, 4]]
deep = copy.deepcopy(original)
deep[0][0] = 999

print(original)  # [[1, 2], [3, 4]] - unchanged
```

### Pitfall 2: Using Assignment Instead of Copy

```python
# WRONG
original = [1, 2, 3]
copy_var = original  # This is not a copy!
copy_var.append(4)
print(original)  # [1, 2, 3, 4] - both reference same object

# RIGHT
import copy
original = [1, 2, 3]
copy_var = copy.copy(original)
copy_var.append(4)
print(original)  # [1, 2, 3] - unchanged
```

### Pitfall 3: Forgetting About Circular References

```python
import copy

# WRONG - might cause infinite loops in custom copy code
node1 = {'value': 1}
node2 = {'value': 2, 'next': node1}
node1['next'] = node2  # Circular reference

# This works fine with deepcopy (handles memo dict automatically)
copied = copy.deepcopy(node1)
print(copied['next']['next'] is copied)  # True - same copied object

# But manual recursion without memo tracking fails:
def bad_deepcopy(obj, seen=None):
    if seen is None:
        seen = set()

    obj_id = id(obj)
    if obj_id in seen:
        return obj  # This is wrong!

    seen.add(obj_id)
    # ... rest of copying logic would infinite loop
```

### Pitfall 4: Not Handling Unpicklable Objects

```python
import copy
import threading

# Some objects cannot be deep copied
lock = threading.Lock()

try:
    copied_lock = copy.deepcopy(lock)
except TypeError as e:
    print(f"Cannot deepcopy lock: {e}")

# For such cases, implement __deepcopy__
class SafeResource:
    def __init__(self, lock):
        self.lock = lock

    def __deepcopy__(self, memo):
        # Don't copy the lock, create a new one
        return SafeResource(threading.Lock())

resource = SafeResource(lock)
copied_resource = copy.deepcopy(resource)
print(resource.lock is copied_resource.lock)  # False
```

### Pitfall 5: Forgetting Memo Dictionary in Custom Deepcopy

```python
import copy

class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

    def __deepcopy__(self, memo):
        # WRONG - doesn't use memo, causes infinite recursion
        # return Node(self.value, copy.deepcopy(self.next))

        # RIGHT - use memo to handle circular references
        node_id = id(self)
        if node_id in memo:
            return memo[node_id]

        new_node = Node(self.value)
        memo[node_id] = new_node
        new_node.next = copy.deepcopy(self.next, memo)
        return new_node

# Create circular linked list
node1 = Node(1)
node2 = Node(2)
node1.next = node2
node2.next = node1

# This works with proper memo handling
copied = copy.deepcopy(node1)
print(copied.next.next is copied)  # True
```

## Performance Considerations

### Shallow Copy is Much Faster Than Deep Copy

```python
import copy
import time

# Create large structure
large_data = {
    'level1': {
        'level2': {
            'level3': {
                'items': list(range(10000))
            }
        }
    }
}

# Shallow copy - fast
start = time.time()
for _ in range(10000):
    copy.copy(large_data)
shallow_time = time.time() - start

# Deep copy - slow
start = time.time()
for _ in range(10000):
    copy.deepcopy(large_data)
deep_time = time.time() - start

print(f"Shallow: {shallow_time:.4f}s")
print(f"Deep:    {deep_time:.4f}s")
print(f"Ratio:   {deep_time/shallow_time:.1f}x")
```

### Use Alternatives When Possible

```python
import copy
import time

large_list = list(range(100000))

# copy.copy() - standard but slower
start = time.time()
for _ in range(1000):
    copy.copy(large_list)
copy_time = time.time() - start

# list.copy() - faster
start = time.time()
for _ in range(1000):
    large_list.copy()
method_time = time.time() - start

# Slice notation - also fast
start = time.time()
for _ in range(1000):
    large_list[:]
slice_time = time.time() - start

print(f"copy.copy(): {copy_time:.4f}s")
print(f"list.copy(): {method_time:.4f}s")
print(f"slice [:]:   {slice_time:.4f}s")
```

### Deep Copy Can Be Memory Intensive

```python
import copy
import sys

# Create large structure
original = {
    'data': list(range(100000)),
    'nested': {
        'data': list(range(100000))
    }
}

size_original = sys.getsizeof(original)

# Deep copy creates entire independent copy
deep = copy.deepcopy(original)
size_deep = sys.getsizeof(deep)

print(f"Original size: {size_original} bytes")
print(f"Deep copy size: {size_deep} bytes")
print(f"Memory overhead: {(size_deep - size_original) / size_original * 100:.1f}%")
```

### Optimize Custom Copy Methods

```python
import copy

class LargeDataSet:
    def __init__(self, data, metadata=None):
        self.data = data  # Large array
        self.metadata = metadata or {}  # Small dict

    def __deepcopy__(self, memo):
        # Only deep copy necessary parts
        # If data is read-only, shallow copy it
        new_dataset = LargeDataSet(
            self.data,  # Shallow copy (assume read-only)
            copy.deepcopy(self.metadata, memo)  # Deep copy metadata
        )
        return new_dataset

original = LargeDataSet(list(range(1000000)), {'name': 'test'})
# More efficient than copying the entire data array
copied = copy.deepcopy(original)
```

## Real-world Scenarios

### Scenario 1: API Request/Response Handling

```python
import copy
from typing import Any, Dict

class APICache:
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def store_response(self, key: str, response: Dict[str, Any]):
        # Always store a deep copy to prevent external modification
        self._cache[key] = copy.deepcopy(response)

    def get_response(self, key: str) -> Dict[str, Any]:
        # Return a deep copy so caller can't affect cached data
        if key in self._cache:
            return copy.deepcopy(self._cache[key])
        return None

    def update_response(self, key: str, updates: Dict[str, Any]):
        # Work with deep copy to ensure consistency
        if key in self._cache:
            cached = copy.deepcopy(self._cache[key])
            cached.update(updates)
            self._cache[key] = cached

# Usage
cache = APICache()
user_response = {'id': 1, 'name': 'Alice', 'settings': {'theme': 'dark'}}
cache.store_response('user_1', user_response)

# External modification doesn't affect cache
external_copy = cache.get_response('user_1')
external_copy['settings']['theme'] = 'light'

# Cache is unaffected
cached_copy = cache.get_response('user_1')
print(cached_copy['settings']['theme'])  # 'dark'
```

### Scenario 2: Configuration Management

```python
import copy
from abc import ABC, abstractmethod

class ConfigManager:
    def __init__(self, config: dict):
        self._default_config = copy.deepcopy(config)
        self._current_config = copy.deepcopy(config)

    def reset_to_default(self):
        # Reset to original without affecting default
        self._current_config = copy.deepcopy(self._default_config)

    def get_config(self) -> dict:
        # Return deep copy so caller can't affect actual config
        return copy.deepcopy(self._current_config)

    def set_config(self, new_config: dict):
        # Store deep copy to prevent external modification
        self._current_config = copy.deepcopy(new_config)

    def update_config(self, updates: dict):
        # Update with deep copy to ensure isolation
        temp_config = copy.deepcopy(self._current_config)
        temp_config.update(updates)
        self._current_config = temp_config

# Usage
default_config = {
    'database': {
        'host': 'localhost',
        'port': 5432,
        'credentials': {'user': 'admin', 'password': 'secret'}
    }
}

manager = ConfigManager(default_config)

# Modify retrieved config (doesn't affect actual config)
config = manager.get_config()
config['database']['host'] = 'production.example.com'

print(manager.get_config()['database']['host'])  # 'localhost'

# Update config
manager.update_config({'database': {'host': 'staging.example.com'}})
print(manager.get_config()['database']['host'])  # 'staging.example.com'

# Reset to defaults
manager.reset_to_default()
print(manager.get_config()['database']['host'])  # 'localhost'
```

### Scenario 3: Database Model Cloning

```python
import copy
from datetime import datetime

class User:
    def __init__(self, username: str, email: str, roles: list):
        self.username = username
        self.email = email
        self.roles = roles
        self.created_at = datetime.now()
        self.last_login = None

    def __deepcopy__(self, memo):
        # Custom deep copy for entities
        user = User(
            self.username,
            self.email,
            copy.deepcopy(self.roles, memo)
        )
        user.created_at = self.created_at  # Don't copy timestamps
        user.last_login = self.last_login
        return user

class UserRepository:
    def __init__(self):
        self._users = {}

    def save_user(self, user: User):
        # Store deep copy to prevent external modification
        self._users[user.username] = copy.deepcopy(user)

    def get_user(self, username: str) -> User:
        # Return deep copy so caller can't affect stored data
        if username in self._users:
            return copy.deepcopy(self._users[username])
        return None

    def clone_user(self, source_username: str, new_username: str) -> User:
        # Clone user for duplication
        source = self._users.get(source_username)
        if source:
            cloned = copy.deepcopy(source)
            cloned.username = new_username
            cloned.created_at = datetime.now()
            return cloned
        return None

# Usage
repo = UserRepository()
user1 = User('alice', 'alice@example.com', ['admin', 'user'])
repo.save_user(user1)

# Retrieve and modify (doesn't affect stored user)
retrieved = repo.get_user('alice')
retrieved.roles.append('moderator')

stored = repo.get_user('alice')
print(stored.roles)  # ['admin', 'user']

# Clone user
user2 = repo.clone_user('alice', 'alice2')
print(user2.username)  # 'alice2'
print(user2.roles)     # ['admin', 'user']
```

### Scenario 4: Testing with Fixtures

```python
import copy
import pytest

class TestDataGenerator:
    def __init__(self):
        # Store template fixtures
        self.user_template = {
            'id': None,
            'username': 'user',
            'profile': {
                'first_name': 'John',
                'last_name': 'Doe',
                'bio': ''
            },
            'settings': {
                'notifications': True,
                'theme': 'light'
            }
        }

    def create_user_fixture(self, **overrides) -> dict:
        # Create deep copy of template to avoid mutation
        user = copy.deepcopy(self.user_template)

        # Apply overrides (can handle nested updates)
        for key, value in overrides.items():
            if key in user and isinstance(user[key], dict) and isinstance(value, dict):
                user[key].update(value)
            else:
                user[key] = value

        return user

# Usage in tests
class TestUserAPI:
    @pytest.fixture
    def data_gen(self):
        return TestDataGenerator()

    def test_user_creation(self, data_gen):
        user = data_gen.create_user_fixture(
            id=1,
            username='alice',
            profile={'first_name': 'Alice'}
        )
        assert user['username'] == 'alice'
        assert user['profile']['first_name'] == 'Alice'
        assert user['profile']['last_name'] == 'Doe'  # Unchanged

    def test_user_settings(self, data_gen):
        user = data_gen.create_user_fixture(
            settings={'theme': 'dark'}
        )
        assert user['settings']['theme'] == 'dark'
        assert user['settings']['notifications'] is True  # Unchanged
```

### Scenario 5: Undo/Redo Functionality

```python
import copy
from typing import Any, List

class EditableDocument:
    def __init__(self, content: str):
        self.content = content
        self._history: List[str] = [copy.copy(content)]
        self._history_index = 0

    def edit(self, new_content: str):
        # Save current state to history
        # Remove any redo history
        self._history = self._history[:self._history_index + 1]

        # Add new state
        self._history.append(copy.copy(new_content))
        self._history_index += 1

        self.content = new_content

    def undo(self) -> bool:
        if self._history_index > 0:
            self._history_index -= 1
            self.content = copy.copy(self._history[self._history_index])
            return True
        return False

    def redo(self) -> bool:
        if self._history_index < len(self._history) - 1:
            self._history_index += 1
            self.content = copy.copy(self._history[self._history_index])
            return True
        return False

# Usage
doc = EditableDocument("Hello")
print(doc.content)  # "Hello"

doc.edit("Hello World")
print(doc.content)  # "Hello World"

doc.edit("Hello World!")
print(doc.content)  # "Hello World!"

doc.undo()
print(doc.content)  # "Hello World"

doc.undo()
print(doc.content)  # "Hello"

doc.redo()
print(doc.content)  # "Hello World"
```

## Interview Points

### Q1: Explain the difference between shallow copy and deep copy

**Answer**: Shallow copy creates a new object at the top level but references the same nested objects. Deep copy creates a completely new object tree with all nested objects also being new.

```python
import copy

# Shallow copy example
original = [1, 2, [3, 4]]
shallow = copy.copy(original)

# Modifying nested object affects both
shallow[2].append(5)
print(original)  # [1, 2, [3, 4, 5]]

# Deep copy example
original = [1, 2, [3, 4]]
deep = copy.deepcopy(original)

# Modifying deep copy doesn't affect original
deep[2].append(5)
print(original)  # [1, 2, [3, 4]]
```

### Q2: What are the different ways to create a shallow copy?

**Answer**: For most cases, use built-in methods. For custom objects, use the copy module.

```python
import copy

# Lists
list1 = [1, 2, 3]
copy1 = list1[:]              # Slice
copy2 = list1.copy()           # Method
copy3 = list(list1)            # Constructor
copy4 = copy.copy(list1)       # copy module

# Dictionaries
dict1 = {'a': 1, 'b': 2}
copy1 = dict1.copy()           # Method
copy2 = dict(dict1)            # Constructor
copy3 = copy.copy(dict1)       # copy module

# Custom objects
class MyClass:
    pass

obj = MyClass()
copy_obj = copy.copy(obj)  # Only way for custom classes
```

### Q3: When should you use deep copy vs shallow copy?

**Answer**: Use shallow copy for simple objects or when nested objects don't need independence. Use deep copy for complex nested structures where you need complete independence.

```python
import copy

# Shallow copy sufficient - no nested objects
numbers = [1, 2, 3]
numbers_copy = copy.copy(numbers)

# Deep copy necessary - nested structures
config = {
    'database': {
        'host': 'localhost',
        'port': 5432
    }
}
config_copy = copy.deepcopy(config)
```

### Q4: How do you implement custom copy behavior?

**Answer**: Implement `__copy__` and `__deepcopy__` methods. Always use the memo dictionary in `__deepcopy__` to handle circular references.

```python
import copy

class CustomClass:
    def __copy__(self):
        # Shallow copy logic
        return CustomClass(self.data)

    def __deepcopy__(self, memo):
        # Deep copy logic with memo handling
        node_id = id(self)
        if node_id in memo:
            return memo[node_id]

        new_obj = CustomClass(copy.deepcopy(self.data, memo))
        memo[node_id] = new_obj
        return new_obj
```

### Q5: What's the performance difference between shallow and deep copy?

**Answer**: Shallow copy is much faster (usually 10-100x) because it only copies the top-level container. Deep copy must recursively copy all nested objects.

```python
import copy
import time

large_data = {'nested': list(range(100000))}

# Shallow copy - milliseconds
start = time.time()
for _ in range(1000):
    copy.copy(large_data)
shallow_time = time.time() - start

# Deep copy - seconds
start = time.time()
for _ in range(1000):
    copy.deepcopy(large_data)
deep_time = time.time() - start

print(f"Deep is {deep_time/shallow_time:.1f}x slower")
```

### Q6: How does copy.deepcopy handle circular references?

**Answer**: It uses a memo dictionary that tracks already-copied objects by their id. When it encounters an object it has already copied, it returns the reference to the copy instead of recursing.

```python
import copy

# Circular reference
list1 = [1, 2]
list2 = [3, 4, list1]
list1.append(list2)

# deepcopy handles it automatically
copied = copy.deepcopy(list1)
print(copied[2][3] is copied)  # True - circular reference preserved
```

### Q7: Why would you implement __copy__ differently than __deepcopy__?

**Answer**: Different use cases require different behaviors. Shallow copy might share expensive-to-copy resources, while deep copy might reset state or clear caches.

```python
import copy

class CacheableData:
    def __init__(self, data):
        self.data = data
        self.cache = {}
        self._cached = False

    def __copy__(self):
        # Shallow copy shares cache
        obj = CacheableData(self.data)
        obj.cache = self.cache
        obj._cached = self._cached
        return obj

    def __deepcopy__(self, memo):
        # Deep copy clears cache for fresh computation
        obj = CacheableData(copy.deepcopy(self.data, memo))
        # Cache not copied - forces recomputation
        return obj
```

## Further Reading

### Official Documentation
- [Python copy module documentation](https://docs.python.org/3/library/copy.html)
- [Python data model - object copying](https://docs.python.org/3/reference/datamodel.html)

### Related Concepts
- Object references and memory management in Python
- Mutable vs immutable objects
- Pickle module for serialization (handles copying too)
- Garbage collection and object lifecycle
- The `id()` function and object identity

### Best Practice Resources
- Python's official style guide (PEP 8) on object design
- Real Python articles on Python object model
- Stack Overflow discussions on shallow vs deep copy
- GitHub repositories with copy module usage examples

### Advanced Topics
- Implementing `__getstate__` and `__setstate__` for pickling
- Copy protocols and extensibility
- Performance profiling of copy operations
- Memory-efficient copying strategies for large datasets
- Immutable data structures as an alternative to copying

## Summary

The copy module is essential for writing correct Python code when dealing with mutable objects. Understanding the difference between shallow and deep copy, and knowing when to use each, is crucial for:

- Preventing unintended data mutations
- Designing APIs that protect internal state
- Implementing caching and configuration systems
- Creating proper test fixtures
- Building undo/redo functionality
- Optimizing performance in data-heavy applications

Remember these key takeaways:

1. **Assignment creates references**, not copies
2. **Shallow copy** is fast but shares nested objects
3. **Deep copy** is slower but ensures complete independence
4. **Use built-in methods** when available (faster than copy module)
5. **Implement custom copy methods** for domain-specific behavior
6. **Always use memo dictionary** in custom `__deepcopy__`
7. **Choose based on your needs** - don't blindly use deep copy everywhere

By mastering the copy module, you'll write more robust and maintainable Python code.
