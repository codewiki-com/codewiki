---
title: Python weakref Module - Weak References Explained
description: Master Python's weakref module including ref(), proxy(), WeakValueDictionary, WeakKeyDictionary, and finalize for advanced memory management
track: python
section: stdlib
difficulty: advanced
tags:
  - Python
  - weakref
  - memory management
  - garbage collection
  - caching
status: imported
origin: old/src/content/docs/python/weakref.en.md
divergence: 0.206
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: python
  subcategory: ""
  order: 33
  lastUpdated: 2026-01-07
---

The `weakref` module is Python's standard library solution for creating weak references. Weak references allow you to reference objects without preventing them from being garbage collected. This is invaluable for caching, observer patterns, handling circular references, and other advanced memory management scenarios.

## Concept Explanation

### What are Weak References?

In Python, when you create a variable pointing to an object, you create a **strong reference**. As long as strong references exist, the object won't be garbage collected. **Weak references**, by contrast, don't increase the object's reference count and therefore don't prevent garbage collection.

```python
import weakref

class MyClass:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"MyClass({self.name!r})"

# Create object and strong reference
obj = MyClass("example")
strong_ref = obj  # Strong reference, reference count +1

# Create weak reference
weak_ref = weakref.ref(obj)  # Weak reference, reference count unchanged

print(f"Object exists: {weak_ref()}")  # MyClass('example')

# Delete all strong references
del obj
del strong_ref

# Object is collected, weak reference returns None
print(f"Object collected: {weak_ref()}")  # None
```

### Historical Background of Weak References

The concept of weak references originates from garbage collection and memory management. The `weakref` module was introduced in Python 2.1 to solve several problems:

1. **Circular References**: Two objects referencing each other causing inability to collect
2. **Cache Optimization**: Cache objects without preventing their collection
3. **Observer Pattern**: Observers shouldn't prevent observed objects from being collected
4. **Large Object Management**: Avoid unnecessarily extending the lifetime of large objects

### Which Objects Support Weak References?

Not all Python objects support weak references:

```python
import weakref

# Types supporting weak references
class CustomClass: pass
custom_obj = CustomClass()
weakref.ref(custom_obj)  # OK

# Built-in types typically don't support weak references
# weakref.ref([1, 2, 3])    # TypeError: cannot create weak reference to 'list' object
# weakref.ref({1, 2, 3})    # TypeError: cannot create weak reference to 'set' object
# weakref.ref((1, 2, 3))    # TypeError: cannot create weak reference to 'tuple' object
# weakref.ref("hello")      # TypeError: cannot create weak reference to 'str' object

# Make built-in types weakly referenceable by subclassing
class WeakableList(list):
    __slots__ = ('__weakref__',)

wl = WeakableList([1, 2, 3])
weakref.ref(wl)  # OK
```

---

## Core Principles

### Reference Counting and Garbage Collection

Python uses **reference counting** as its primary memory management mechanism:

```python
import sys

obj = [1, 2, 3]
print(sys.getrefcount(obj))  # 2 (obj itself + getrefcount parameter)

another = obj
print(sys.getrefcount(obj))  # 3

del another
print(sys.getrefcount(obj))  # 2
```

The key to weak references is that they don't increase the reference count:

```python
import sys
import weakref

class MyClass:
    pass

obj = MyClass()
print(sys.getrefcount(obj))  # 2

# Creating a weak reference doesn't increase reference count
weak = weakref.ref(obj)
print(sys.getrefcount(obj))  # Still 2
```

### Internal Mechanism of Weak References

Python objects have a `__weakref__` slot for storing weak references:

```python
import weakref

class MyClass:
    pass

obj = MyClass()

# Inspect the weakref slot
print(hasattr(obj, '__weakref__'))  # True
print(obj.__weakref__)  # None (no weak references yet)

# After creating weak reference
weak = weakref.ref(obj)
print(obj.__weakref__)  # <weakref at 0x...; to 'MyClass' at 0x...>

# Multiple weak references share the same slot (forming a linked list)
weak2 = weakref.ref(obj)
print(weak is weak2)  # True (same weakref object returned)
```

### Callback Mechanism

When an object is collected, you can trigger callback functions:

```python
import weakref

class Resource:
    def __init__(self, name):
        self.name = name

def cleanup_callback(weak_ref):
    print(f"Object collected, weakref: {weak_ref}")

obj = Resource("important resource")
weak = weakref.ref(obj, cleanup_callback)

print(f"Object exists: {weak()}")
del obj  # Triggers callback: Object collected, weakref: <weakref at 0x...; dead>
print(f"Object collected: {weak()}")  # None
```

---

## Key Components

### Main Components of weakref Module

| Component | Description |
|-----------|-------------|
| `ref(object, callback=None)` | Create a weak reference to an object |
| `proxy(object, callback=None)` | Create a weak reference proxy |
| `getweakrefcount(object)` | Get the number of weak references to an object |
| `getweakrefs(object)` | Get all weak references to an object |
| `WeakValueDictionary` | Dictionary with weak reference values |
| `WeakKeyDictionary` | Dictionary with weak reference keys |
| `WeakSet` | Set with weak reference elements |
| `WeakMethod` | Weak reference to bound methods |
| `finalize` | Register a finalizer (executed on object collection) |

### Difference Between ref() and proxy()

```python
import weakref

class MyClass:
    def __init__(self, value):
        self.value = value

    def show(self):
        return f"Value: {self.value}"

obj = MyClass(42)

# ref() returns a weak reference object, needs to be called to get the original object
weak_ref = weakref.ref(obj)
print(type(weak_ref))      # <class 'weakref'>
print(weak_ref())          # <__main__.MyClass object at ...>
print(weak_ref().value)    # 42

# proxy() returns a proxy object, can directly access the original object's attributes and methods
weak_proxy = weakref.proxy(obj)
print(type(weak_proxy))    # <class 'weakproxy'>
print(weak_proxy.value)    # 42 (direct access)
print(weak_proxy.show())   # Value: 42

# After deleting original object
del obj

# ref() returns None
print(weak_ref())  # None

# proxy() raises an exception
try:
    print(weak_proxy.value)
except ReferenceError as e:
    print(f"ReferenceError: {e}")  # weakly-referenced object no longer exists
```

---

## Code Examples

### ref() - Creating Weak References

```python
import weakref

class DataObject:
    def __init__(self, data):
        self.data = data

    def process(self):
        return sum(self.data)

# Basic usage
obj = DataObject([1, 2, 3, 4, 5])
weak = weakref.ref(obj)

# Access object through weak reference
if weak() is not None:
    result = weak().process()
    print(f"Processing result: {result}")  # 15

# Safe access pattern
def safe_access(weak_ref):
    """Safely access weak reference object"""
    target = weak_ref()
    if target is not None:
        return target
    raise ValueError("Object has been collected")

# Weak reference with callback
def on_delete(ref):
    print(f"Object deleted, weakref status: {'dead' if ref() is None else 'alive'}")

obj2 = DataObject([10, 20])
weak2 = weakref.ref(obj2, on_delete)

del obj2  # Output: Object deleted, weakref status: dead
```

### proxy() - Creating Weak Reference Proxies

```python
import weakref

class DatabaseConnection:
    def __init__(self, host):
        self.host = host
        self.connected = True

    def query(self, sql):
        return f"Execute on {self.host}: {sql}"

    def close(self):
        self.connected = False
        print(f"Close connection: {self.host}")

# Create proxy
conn = DatabaseConnection("localhost:5432")
conn_proxy = weakref.proxy(conn)

# Proxy transparently forwards all operations
print(conn_proxy.host)           # localhost:5432
print(conn_proxy.query("SELECT 1"))  # Execute on localhost:5432: SELECT 1
print(conn_proxy.connected)      # True

# Proxy for callable objects
class Calculator:
    def __call__(self, x, y):
        return x + y

calc = Calculator()
calc_proxy = weakref.proxy(calc)
print(calc_proxy(3, 5))  # 8

# Proxy limitation: accessing after object deletion raises ReferenceError
del conn
try:
    print(conn_proxy.host)
except ReferenceError:
    print("Connection object has been collected")
```

### WeakValueDictionary - Dictionary with Weak Reference Values

```python
import weakref

class User:
    def __init__(self, user_id, name):
        self.user_id = user_id
        self.name = name

    def __repr__(self):
        return f"User({self.user_id}, {self.name!r})"

# Create weak reference value dictionary as cache
user_cache = weakref.WeakValueDictionary()

def get_user(user_id):
    """Get user using weak reference cache"""
    if user_id in user_cache:
        print(f"Getting user {user_id} from cache")
        return user_cache[user_id]

    print(f"Creating new user {user_id}")
    user = User(user_id, f"User{user_id}")
    user_cache[user_id] = user
    return user

# Use cache
user1 = get_user(1)  # Creating new user 1
user2 = get_user(1)  # Getting user 1 from cache
print(f"Same object: {user1 is user2}")  # True

# When keeping reference, cache is valid
print(f"Cache size: {len(user_cache)}")  # 1

# After deleting strong reference, cache auto-cleans
del user1
del user2

# Force garbage collection (usually not necessary)
import gc
gc.collect()

print(f"Cache size: {len(user_cache)}")  # 0

# Iterate weak reference dictionary
user_cache[1] = User(1, "Alice")
user_cache[2] = User(2, "Bob")
ref_user1 = user_cache[1]  # Keep reference

for user_id, user in user_cache.items():
    print(f"  {user_id}: {user}")
```

### WeakKeyDictionary - Dictionary with Weak Reference Keys

```python
import weakref

class Session:
    def __init__(self, session_id):
        self.session_id = session_id

    def __repr__(self):
        return f"Session({self.session_id!r})"

# Use weak reference key dictionary to store session data
session_data = weakref.WeakKeyDictionary()

def store_session_data(session, data):
    """Store session data, auto-cleanup when session is collected"""
    session_data[session] = data

def get_session_data(session):
    """Get session data"""
    return session_data.get(session)

# Create sessions and store data
session1 = Session("abc123")
session2 = Session("def456")

store_session_data(session1, {"user": "Alice", "cart": [1, 2, 3]})
store_session_data(session2, {"user": "Bob", "cart": []})

print(f"Session data count: {len(session_data)}")  # 2

# Get data
print(get_session_data(session1))  # {'user': 'Alice', 'cart': [1, 2, 3]}

# After deleting session, data auto-cleans
del session1
import gc; gc.collect()

print(f"Session data count: {len(session_data)}")  # 1

# Practical example: object metadata storage
class Widget:
    def __init__(self, name):
        self.name = name

widget_metadata = weakref.WeakKeyDictionary()

def set_metadata(widget, **kwargs):
    widget_metadata[widget] = kwargs

def get_metadata(widget):
    return widget_metadata.get(widget, {})

w1 = Widget("button")
set_metadata(w1, color="blue", size="large")
print(get_metadata(w1))  # {'color': 'blue', 'size': 'large'}
```

### WeakSet - Set with Weak References

```python
import weakref

class Observer:
    def __init__(self, name):
        self.name = name

    def notify(self, message):
        print(f"{self.name} received notification: {message}")

    def __repr__(self):
        return f"Observer({self.name!r})"

class Subject:
    """Observed object, uses WeakSet to store observers"""
    def __init__(self):
        self._observers = weakref.WeakSet()

    def attach(self, observer):
        self._observers.add(observer)
        print(f"Add observer: {observer}")

    def detach(self, observer):
        self._observers.discard(observer)
        print(f"Remove observer: {observer}")

    def notify_all(self, message):
        # Create copy during iteration to avoid modification during iteration
        for observer in list(self._observers):
            observer.notify(message)

    @property
    def observer_count(self):
        return len(self._observers)

# Use observer pattern
subject = Subject()

obs1 = Observer("Observer A")
obs2 = Observer("Observer B")
obs3 = Observer("Observer C")

subject.attach(obs1)
subject.attach(obs2)
subject.attach(obs3)

print(f"Observer count: {subject.observer_count}")  # 3

subject.notify_all("First message")

# After deleting observer, automatically removed from set
del obs2
import gc; gc.collect()

print(f"Observer count: {subject.observer_count}")  # 2

subject.notify_all("Second message")  # Only obs1 and obs3 receive
```

### finalize - Finalizers

```python
import weakref
import tempfile
import os

class TempFileManager:
    """Use finalize to ensure temporary files are cleaned up"""
    def __init__(self, content):
        # Create temporary file
        fd, self.filepath = tempfile.mkstemp(suffix='.txt')
        os.write(fd, content.encode())
        os.close(fd)
        print(f"Create temp file: {self.filepath}")

        # Register finalizer, auto-cleanup when object is collected
        self._finalizer = weakref.finalize(
            self,
            self._cleanup,
            self.filepath
        )

    @staticmethod
    def _cleanup(filepath):
        """Static method as cleanup function to avoid circular references"""
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Clean up temp file: {filepath}")

    def read(self):
        with open(self.filepath, 'r') as f:
            return f.read()

    def close(self):
        """Manual cleanup"""
        self._finalizer()

    @property
    def is_alive(self):
        return self._finalizer.alive

# Use finalizer
manager = TempFileManager("Hello, World!")
print(f"File content: {manager.read()}")
print(f"Finalizer alive: {manager.is_alive}")  # True

# Delete object, auto-cleanup
del manager
import gc; gc.collect()
# Output: Clean up temp file: /tmp/xxxxx.txt

# Manual finalizer call
manager2 = TempFileManager("Test content")
manager2.close()  # Manual cleanup
print(f"Finalizer alive: {manager2.is_alive}")  # False

# Multiple finalizer calls are safe (executes only once)
manager2.close()  # Won't execute cleanup again
```

### finalize - Advanced Usage

```python
import weakref

class ResourcePool:
    """Resource pool, uses finalize to track resource leaks"""
    _active_resources = set()

    def __init__(self, name):
        self.name = name
        self._id = id(self)
        ResourcePool._active_resources.add(self._id)

        # Register finalizer for leak detection
        self._finalizer = weakref.finalize(
            self,
            ResourcePool._check_leak,
            self.name,
            self._id
        )

    @staticmethod
    def _check_leak(name, resource_id):
        if resource_id in ResourcePool._active_resources:
            print(f"Warning: Resource '{name}' collected without proper release!")
            ResourcePool._active_resources.discard(resource_id)

    def release(self):
        """Properly release resource"""
        ResourcePool._active_resources.discard(self._id)
        self._finalizer.detach()  # Detach finalizer, no longer execute cleanup
        print(f"Resource '{self.name}' released")

    @classmethod
    def active_count(cls):
        return len(cls._active_resources)

# Proper usage
res1 = ResourcePool("database connection")
res1.release()  # Properly released
del res1

# Leak detection
res2 = ResourcePool("file handle")
del res2  # Not calling release(), triggers leak warning
import gc; gc.collect()
```

### WeakMethod - Weak References to Bound Methods

```python
import weakref

class Button:
    def __init__(self, label):
        self.label = label

    def on_click(self):
        print(f"Button '{self.label}' clicked")

class EventManager:
    """Event manager, uses WeakMethod to avoid circular references"""
    def __init__(self):
        self._handlers = []

    def subscribe(self, handler):
        """Subscribe to event handler"""
        if hasattr(handler, '__self__'):
            # Bound method, use WeakMethod
            weak_handler = weakref.WeakMethod(handler, self._remove_handler)
            self._handlers.append(weak_handler)
        else:
            # Regular function, use ref
            weak_handler = weakref.ref(handler, self._remove_handler)
            self._handlers.append(weak_handler)

    def _remove_handler(self, weak_ref):
        """Callback: remove handler when weakref becomes invalid"""
        self._handlers = [h for h in self._handlers if h() is not None]

    def emit(self):
        """Trigger all handlers"""
        for weak_handler in self._handlers[:]:  # Use copy for iteration
            handler = weak_handler()
            if handler is not None:
                handler()

    @property
    def handler_count(self):
        return len([h for h in self._handlers if h() is not None])

# Use
manager = EventManager()

btn1 = Button("OK")
btn2 = Button("Cancel")

manager.subscribe(btn1.on_click)
manager.subscribe(btn2.on_click)

print(f"Handler count: {manager.handler_count}")  # 2

manager.emit()
# Output:
# Button 'OK' clicked
# Button 'Cancel' clicked

# After deleting button, handler automatically removed
del btn1
import gc; gc.collect()

print(f"Handler count: {manager.handler_count}")  # 1

manager.emit()
# Output:
# Button 'Cancel' clicked
```

---

## Best Practices

### Implement Caching with Weak References

```python
import weakref
from typing import TypeVar, Generic, Optional, Callable

T = TypeVar('T')

class WeakCache(Generic[T]):
    """Generic weak reference cache"""
    def __init__(self, factory: Callable[[str], T]):
        self._cache = weakref.WeakValueDictionary()
        self._factory = factory
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> T:
        """Get or create object"""
        if key in self._cache:
            self._hits += 1
            return self._cache[key]

        self._misses += 1
        value = self._factory(key)
        self._cache[key] = value
        return value

    def stats(self) -> dict:
        return {
            'hits': self._hits,
            'misses': self._misses,
            'size': len(self._cache),
            'hit_rate': self._hits / max(1, self._hits + self._misses)
        }

# Example usage
class ExpensiveObject:
    def __init__(self, name):
        self.name = name
        print(f"Create expensive object: {name}")

cache = WeakCache(ExpensiveObject)

# Get object (will create)
obj1 = cache.get("config")
obj2 = cache.get("config")  # From cache

print(f"Same object: {obj1 is obj2}")  # True
print(cache.stats())
```

### Avoid Circular References

```python
import weakref

class Parent:
    def __init__(self, name):
        self.name = name
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child._parent = weakref.ref(self)  # Use weak reference to avoid cycle

class Child:
    def __init__(self, name):
        self.name = name
        self._parent = None  # Weak reference

    @property
    def parent(self):
        if self._parent is not None:
            return self._parent()
        return None

    def get_parent_name(self):
        p = self.parent
        return p.name if p else "No parent"

# Use
parent = Parent("parent node")
child = Child("child node")
parent.add_child(child)

print(child.get_parent_name())  # parent node

# After deleting parent
del parent
import gc; gc.collect()

print(child.get_parent_name())  # No parent
```

### Use finalize for Resource Management

```python
import weakref
from contextlib import contextmanager

class ManagedResource:
    """Resource management pattern using finalize"""
    _instances = weakref.WeakSet()

    def __init__(self, resource_id):
        self.resource_id = resource_id
        self._closed = False
        self._instances.add(self)

        # Use finalize as safety net
        self._ensure_cleanup = weakref.finalize(
            self,
            self._warn_unclosed,
            resource_id
        )
        print(f"Open resource: {resource_id}")

    @staticmethod
    def _warn_unclosed(resource_id):
        print(f"Warning: Resource {resource_id} not properly closed!")

    def close(self):
        if not self._closed:
            self._closed = True
            self._ensure_cleanup.detach()  # Cancel warning
            print(f"Close resource: {self.resource_id}")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    @classmethod
    def close_all(cls):
        """Close all active resources"""
        for instance in list(cls._instances):
            instance.close()

# Recommended: use context manager
with ManagedResource("db_connection") as res:
    print("Use resource...")
# Auto-closes

# Not recommended: forget to close (triggers warning)
res = ManagedResource("file_handle")
del res
import gc; gc.collect()
# Warning: Resource file_handle not properly closed!
```

### Correct Observer Pattern Implementation

```python
import weakref
from typing import Callable, Set

class Observable:
    """Observable object, uses WeakSet to manage observers"""
    def __init__(self):
        self._observers: weakref.WeakSet = weakref.WeakSet()
        self._callbacks: Set[weakref.ref] = set()

    def add_observer(self, observer):
        """Add observer object"""
        self._observers.add(observer)

    def add_callback(self, callback: Callable):
        """Add callback function"""
        if hasattr(callback, '__self__'):
            # Bound method
            ref = weakref.WeakMethod(callback, self._remove_callback)
        else:
            # Regular function needs strong reference or other strategy
            ref = weakref.ref(callback, self._remove_callback)
        self._callbacks.add(ref)

    def _remove_callback(self, ref):
        self._callbacks.discard(ref)

    def notify(self, *args, **kwargs):
        """Notify all observers"""
        # Notify observer objects
        for observer in list(self._observers):
            if hasattr(observer, 'update'):
                observer.update(*args, **kwargs)

        # Call callbacks
        for ref in list(self._callbacks):
            callback = ref()
            if callback is not None:
                callback(*args, **kwargs)
```

---

## Common Pitfalls

### Using weakref on Non-Weakly-Referenceable Objects

```python
import weakref

# Error: built-in types don't support weak references
try:
    weakref.ref([1, 2, 3])
except TypeError as e:
    print(f"Error: {e}")
    # cannot create weak reference to 'list' object

# Solution 1: use a subclass that supports weak references
class WeakableList(list):
    __slots__ = ('__weakref__',)

wl = WeakableList([1, 2, 3])
ref = weakref.ref(wl)  # OK

# Solution 2: use a wrapper class
class ListWrapper:
    def __init__(self, data):
        self.data = data

wrapper = ListWrapper([1, 2, 3])
ref = weakref.ref(wrapper)  # OK
```

### Weak Reference Becomes Invalid Immediately

```python
import weakref

class MyClass:
    pass

# Error: object has no other strong reference, immediately collected
weak = weakref.ref(MyClass())
print(weak())  # None (object already collected)

# Correct: keep strong reference
obj = MyClass()
weak = weakref.ref(obj)
print(weak())  # <__main__.MyClass object at ...>
```

### Creating New Strong References in Callbacks

```python
import weakref

class Resource:
    pass

leaked_resources = []

def bad_callback(weak_ref):
    """Error: attempting to resurrect object in callback"""
    obj = weak_ref()
    if obj is not None:
        leaked_resources.append(obj)  # May cause memory leak

# Callback is called when object is already unreachable
# weak_ref() returns None in callback
```

### WeakValueDictionary Iteration Issues

```python
import weakref

cache = weakref.WeakValueDictionary()

class Item:
    def __init__(self, name):
        self.name = name

# Add items
items = [Item(f"item_{i}") for i in range(5)]
for i, item in enumerate(items):
    cache[i] = item

# Error: collection may occur during iteration
# for key, value in cache.items():  # May raise RuntimeError
#     del items[key]  # Dangerous

# Correct: iterate over copy
for key, value in list(cache.items()):
    print(f"{key}: {value.name}")
```

### Ignoring ReferenceError from proxy

```python
import weakref

class Data:
    value = 42

obj = Data()
proxy = weakref.proxy(obj)

# Error: not checking if object is alive
def unsafe_access(proxy):
    return proxy.value  # May raise ReferenceError

# Correct: use exception handling
def safe_access(proxy):
    try:
        return proxy.value
    except ReferenceError:
        return None

del obj

print(safe_access(proxy))  # None
```

### Circular References in finalize Callbacks

```python
import weakref

class BadExample:
    def __init__(self):
        # Error: callback references self, creating circular reference
        self._finalizer = weakref.finalize(self, self.cleanup)

    def cleanup(self):
        print("Clean up")  # Never called

class GoodExample:
    def __init__(self):
        # Correct: use static method or external function
        self._finalizer = weakref.finalize(
            self,
            GoodExample._cleanup,
            "resource_id"
        )

    @staticmethod
    def _cleanup(resource_id):
        print(f"Clean up resource: {resource_id}")
```

---

## Performance Considerations

### Overhead of Weak References

```python
import weakref
import time
import sys

class TestObject:
    def __init__(self, value):
        self.value = value

# Test creation overhead
n = 100000

# Normal objects
start = time.perf_counter()
objects = [TestObject(i) for i in range(n)]
normal_time = time.perf_counter() - start

# Objects with weak references
start = time.perf_counter()
weak_objects = [(TestObject(i), None) for i in range(n)]
for i, (obj, _) in enumerate(weak_objects):
    weak_objects[i] = (obj, weakref.ref(obj))
weak_time = time.perf_counter() - start

print(f"Normal objects creation: {normal_time:.4f}s")
print(f"Weak references creation: {weak_time:.4f}s")
print(f"Weak reference overhead: {(weak_time - normal_time) / normal_time * 100:.1f}%")
```

### Access Performance Comparison

```python
import weakref
import time

class Data:
    def __init__(self):
        self.value = 42

obj = Data()
ref = weakref.ref(obj)
proxy = weakref.proxy(obj)

iterations = 1000000

# Direct access
start = time.perf_counter()
for _ in range(iterations):
    _ = obj.value
direct_time = time.perf_counter() - start

# Access through ref
start = time.perf_counter()
for _ in range(iterations):
    _ = ref().value
ref_time = time.perf_counter() - start

# Access through proxy
start = time.perf_counter()
for _ in range(iterations):
    _ = proxy.value
proxy_time = time.perf_counter() - start

print(f"Direct access: {direct_time:.4f}s")
print(f"ref() access: {ref_time:.4f}s ({ref_time/direct_time:.1f}x)")
print(f"proxy access: {proxy_time:.4f}s ({proxy_time/direct_time:.1f}x)")
```

### WeakValueDictionary vs dict

```python
import weakref
import time

class Value:
    def __init__(self, x):
        self.x = x

n = 10000

# Normal dictionary
normal_dict = {}
start = time.perf_counter()
for i in range(n):
    normal_dict[i] = Value(i)
for i in range(n):
    _ = normal_dict[i]
dict_time = time.perf_counter() - start

# Keep references to avoid collection
values = list(normal_dict.values())

# Weak reference dictionary
weak_dict = weakref.WeakValueDictionary()
start = time.perf_counter()
for i in range(n):
    weak_dict[i] = values[i]
for i in range(n):
    _ = weak_dict[i]
weak_time = time.perf_counter() - start

print(f"Normal dictionary: {dict_time:.4f}s")
print(f"Weak reference dictionary: {weak_time:.4f}s ({weak_time/dict_time:.1f}x)")
```

### Memory Optimization Recommendations

```python
import weakref
import sys

class HeavyObject:
    def __init__(self):
        self.data = [0] * 10000  # Large object

# Using weak reference cache saves memory
class MemoryAwareCache:
    def __init__(self, max_strong_refs=100):
        self._weak_cache = weakref.WeakValueDictionary()
        self._strong_cache = {}  # LRU strong references
        self._max_strong = max_strong_refs
        self._access_order = []

    def get(self, key, factory):
        # Check weak reference cache first
        if key in self._weak_cache:
            value = self._weak_cache[key]
            self._promote(key, value)
            return value

        # Create new object
        value = factory()
        self._weak_cache[key] = value
        self._promote(key, value)
        return value

    def _promote(self, key, value):
        """Promote to strong reference cache"""
        if key in self._strong_cache:
            self._access_order.remove(key)
        elif len(self._strong_cache) >= self._max_strong:
            # Remove oldest
            oldest = self._access_order.pop(0)
            del self._strong_cache[oldest]

        self._strong_cache[key] = value
        self._access_order.append(key)
```

---

## Real-World Scenarios

### Scenario 1: Image Caching System

```python
import weakref
from pathlib import Path
from typing import Optional

class Image:
    """Simulate image object"""
    def __init__(self, path: str, width: int, height: int):
        self.path = path
        self.width = width
        self.height = height
        self.pixels = bytearray(width * height * 4)  # RGBA
        print(f"Load image: {path} ({width}x{height})")

    def __repr__(self):
        return f"Image({self.path!r}, {self.width}x{self.height})"

class ImageCache:
    """Image cache manager"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._cache = weakref.WeakValueDictionary()
            cls._instance._stats = {'hits': 0, 'misses': 0}
        return cls._instance

    def load(self, path: str) -> Image:
        """Load image (with caching)"""
        if path in self._cache:
            self._stats['hits'] += 1
            print(f"Cache hit: {path}")
            return self._cache[path]

        self._stats['misses'] += 1
        # Simulate loading image
        image = Image(path, 800, 600)
        self._cache[path] = image
        return image

    def get_stats(self) -> dict:
        return {
            **self._stats,
            'cached': len(self._cache),
            'hit_rate': self._stats['hits'] / max(1, sum(self._stats.values()))
        }

# Use
cache = ImageCache()

# Load images
img1 = cache.load("/images/photo1.jpg")
img2 = cache.load("/images/photo2.jpg")
img3 = cache.load("/images/photo1.jpg")  # Cache hit

print(f"Same object: {img1 is img3}")  # True
print(cache.get_stats())

# After releasing images, auto-removed from cache
del img1, img3
import gc; gc.collect()

print(f"Stats after cache: {cache.get_stats()}")
```

### Scenario 2: Object Registry

```python
import weakref
from typing import Dict, Optional, Type, TypeVar

T = TypeVar('T')

class ObjectRegistry:
    """Global object registry that doesn't prevent collection"""
    _registries: Dict[str, 'ObjectRegistry'] = {}

    def __init__(self, name: str):
        self.name = name
        self._objects = weakref.WeakValueDictionary()
        ObjectRegistry._registries[name] = self

    def register(self, key: str, obj: T) -> T:
        """Register object"""
        self._objects[key] = obj
        return obj

    def get(self, key: str) -> Optional[T]:
        """Get object"""
        return self._objects.get(key)

    def list_keys(self) -> list:
        """List all registered keys"""
        return list(self._objects.keys())

    @classmethod
    def get_registry(cls, name: str) -> 'ObjectRegistry':
        """Get or create registry"""
        if name not in cls._registries:
            return cls(name)
        return cls._registries[name]

# Example usage
class Service:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Service({self.name!r})"

# Service registry
services = ObjectRegistry.get_registry("services")

# Register services
db_service = services.register("database", Service("PostgreSQL"))
cache_service = services.register("cache", Service("Redis"))

print(f"Registered services: {services.list_keys()}")  # ['database', 'cache']

# Get service
db = services.get("database")
print(f"Database service: {db}")  # Service('PostgreSQL')

# Service no longer used, automatically unregistered
del db_service, db
import gc; gc.collect()

print(f"Remaining services: {services.list_keys()}")  # ['cache']
```

### Scenario 3: Event System

```python
import weakref
from typing import Callable, Dict, List, Any
from dataclasses import dataclass

@dataclass
class Event:
    name: str
    data: Any

class EventBus:
    """Event bus, uses weak references to manage subscribers"""
    def __init__(self):
        self._subscribers: Dict[str, List[weakref.ref]] = {}

    def subscribe(self, event_name: str, handler: Callable[[Event], None]):
        """Subscribe to event"""
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []

        # Create weak reference based on handler type
        if hasattr(handler, '__self__'):
            ref = weakref.WeakMethod(handler, lambda r: self._cleanup(event_name, r))
        else:
            # For regular functions, special handling needed
            ref = weakref.ref(handler, lambda r: self._cleanup(event_name, r))

        self._subscribers[event_name].append(ref)

    def _cleanup(self, event_name: str, dead_ref):
        """Clean up invalid references"""
        if event_name in self._subscribers:
            self._subscribers[event_name] = [
                r for r in self._subscribers[event_name]
                if r() is not None
            ]

    def publish(self, event: Event):
        """Publish event"""
        handlers = self._subscribers.get(event.name, [])
        for ref in handlers[:]:  # Use copy for iteration
            handler = ref()
            if handler is not None:
                try:
                    handler(event)
                except Exception as e:
                    print(f"Handler error: {e}")

    def subscriber_count(self, event_name: str) -> int:
        """Get subscriber count"""
        handlers = self._subscribers.get(event_name, [])
        return len([r for r in handlers if r() is not None])

class UserController:
    """User controller, subscribe to events"""
    def __init__(self, name: str, bus: EventBus):
        self.name = name
        bus.subscribe("user.created", self.on_user_created)
        bus.subscribe("user.deleted", self.on_user_deleted)

    def on_user_created(self, event: Event):
        print(f"[{self.name}] User created: {event.data}")

    def on_user_deleted(self, event: Event):
        print(f"[{self.name}] User deleted: {event.data}")

# Use
bus = EventBus()

ctrl1 = UserController("Controller1", bus)
ctrl2 = UserController("Controller2", bus)

print(f"Subscriber count: {bus.subscriber_count('user.created')}")  # 2

bus.publish(Event("user.created", {"id": 1, "name": "Alice"}))

# After deleting controller, automatically unsubscribed
del ctrl1
import gc; gc.collect()

print(f"Subscriber count: {bus.subscriber_count('user.created')}")  # 1

bus.publish(Event("user.created", {"id": 2, "name": "Bob"}))
# Only Controller2 receives event
```

### Scenario 4: Connection Pool Management

```python
import weakref
from typing import Optional
from dataclasses import dataclass, field
from queue import Queue
import threading

@dataclass
class Connection:
    """Database connection"""
    conn_id: int
    host: str
    _pool: Optional['ConnectionPool'] = field(default=None, repr=False)
    _finalizer: Optional[weakref.finalize] = field(default=None, repr=False)

    def __post_init__(self):
        if self._pool is not None:
            # Register finalizer to ensure connection is returned
            self._finalizer = weakref.finalize(
                self,
                ConnectionPool._return_leaked,
                self._pool,
                self.conn_id
            )

    def execute(self, query: str) -> str:
        return f"[Conn-{self.conn_id}] Execute: {query}"

    def close(self):
        """Return connection to pool"""
        if self._pool is not None and self._finalizer is not None:
            self._finalizer.detach()
            self._pool._return(self)

class ConnectionPool:
    """Connection pool"""
    def __init__(self, host: str, size: int = 5):
        self.host = host
        self.size = size
        self._pool = Queue()
        self._active = weakref.WeakSet()
        self._next_id = 0
        self._lock = threading.Lock()

        # Pre-create connections
        for _ in range(size):
            self._pool.put(self._create_connection())

    def _create_connection(self) -> Connection:
        with self._lock:
            self._next_id += 1
            conn = Connection(self._next_id, self.host, self)
            return conn

    def acquire(self) -> Connection:
        """Acquire connection"""
        conn = self._pool.get()
        self._active.add(conn)
        print(f"Acquire connection: {conn.conn_id}")
        return conn

    def _return(self, conn: Connection):
        """Return connection"""
        self._active.discard(conn)
        self._pool.put(conn)
        print(f"Return connection: {conn.conn_id}")

    @staticmethod
    def _return_leaked(pool: 'ConnectionPool', conn_id: int):
        """Handle leaked connections"""
        print(f"Warning: Connection {conn_id} not properly returned, leaked!")
        # In real applications, create new connection to replenish pool

    @property
    def available(self) -> int:
        return self._pool.qsize()

    @property
    def active(self) -> int:
        return len(self._active)

# Use
pool = ConnectionPool("localhost:5432", size=3)
print(f"Available connections: {pool.available}")  # 3

# Proper usage
conn1 = pool.acquire()
print(conn1.execute("SELECT 1"))
conn1.close()  # Properly return

# Forget to return (finalizer will warn)
conn2 = pool.acquire()
del conn2
import gc; gc.collect()
# Warning: Connection 2 not properly returned, leaked!

print(f"Available connections: {pool.available}")
```

---

## Interview Questions

### Q1: What are weak references and how do they differ from strong references?

**Answer:**

Weak references are references that don't increase an object's reference count. Differences from strong references:

```python
import weakref
import sys

class MyClass:
    pass

obj = MyClass()
print(sys.getrefcount(obj))  # 2 (obj + getrefcount parameter)

# Strong reference increases reference count
strong = obj
print(sys.getrefcount(obj))  # 3

# Weak reference doesn't increase reference count
weak = weakref.ref(obj)
print(sys.getrefcount(obj))  # Still 3

# After deleting all strong references, object is collected
del obj, strong
print(weak())  # None
```

Key differences:
- Strong references prevent objects from being collected
- Weak references allow objects to be collected when no strong references exist
- Weak references require calling to get the object (may return None)

### Q2: What's the difference between WeakValueDictionary and a normal dictionary? When should you use each?

**Answer:**

```python
import weakref

class Data:
    def __init__(self, value):
        self.value = value

# Normal dictionary: keeps strong reference
normal_dict = {}
normal_dict['key'] = Data(1)

# WeakValueDictionary: values are weak references
weak_dict = weakref.WeakValueDictionary()
data = Data(2)
weak_dict['key'] = data

# Difference: after deleting external reference
del data
import gc; gc.collect()

print('key' in weak_dict)  # False, entry auto-removed
```

Use cases:
1. **Caching**: Cache objects without preventing collection
2. **Object Registry**: Track objects without extending lifetime
3. **Preventing Memory Leaks**: Temporary references to large objects

### Q3: How do you solve circular reference problems with weak references?

**Answer:**

```python
import weakref

# Problematic circular reference
class Node:
    def __init__(self, value):
        self.value = value
        self.parent = None
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child.parent = self  # Circular reference!

# Solution with weak references
class SafeNode:
    def __init__(self, value):
        self.value = value
        self._parent = None  # Weak reference
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child._parent = weakref.ref(self)  # Weak reference

    @property
    def parent(self):
        return self._parent() if self._parent else None
```

### Q4: What's the difference between finalize and `__del__`? Why is finalize recommended?

**Answer:**

```python
import weakref

# __del__ problems
class ProblematicClass:
    def __init__(self):
        self.resource = "important resource"

    def __del__(self):
        # Problem 1: may not be called during interpreter shutdown
        # Problem 2: may not be called with circular references
        # Problem 3: exceptions are ignored
        print(f"Clean up: {self.resource}")

# finalize is more reliable
class SafeClass:
    def __init__(self):
        self.resource = "important resource"
        self._cleanup = weakref.finalize(
            self,
            SafeClass._cleanup_resource,
            self.resource
        )

    @staticmethod
    def _cleanup_resource(resource):
        print(f"Clean up: {resource}")

# finalize advantages:
# Guaranteed execution on object collection
# Can be called manually or cancelled
# Avoids circular reference problems (uses static method)
# Check if executed (.alive property)
```

### Q5: How do you implement a thread-safe weak reference cache?

**Answer:**

```python
import weakref
import threading
from typing import TypeVar, Callable, Optional

T = TypeVar('T')

class ThreadSafeWeakCache:
    def __init__(self):
        self._cache = weakref.WeakValueDictionary()
        self._lock = threading.RLock()

    def get_or_create(self, key: str, factory: Callable[[], T]) -> T:
        # Try lock-free read first
        if key in self._cache:
            return self._cache[key]

        # Lock when creating
        with self._lock:
            # Double-check
            if key in self._cache:
                return self._cache[key]

            value = factory()
            self._cache[key] = value
            return value

    def get(self, key: str) -> Optional[T]:
        return self._cache.get(key)

    def invalidate(self, key: str):
        with self._lock:
            self._cache.pop(key, None)
```

### Q6: What's the difference between WeakMethod and regular ref for bound methods?

**Answer:**

```python
import weakref

class Handler:
    def process(self):
        print("Processing...")

handler = Handler()

# Wrong: ref doesn't work for bound methods
# New method object created each access time
weak_method = weakref.ref(handler.process)
print(weak_method())  # None (method object immediately collected)

# Correct: use WeakMethod
weak_method = weakref.WeakMethod(handler.process)
print(weak_method())  # <bound method Handler.process of ...>

del handler
print(weak_method())  # None
```

WeakMethod internally weak-references both the object and function, returning the bound method only when both are alive.

---

## Further Reading

### Official Documentation

- [weakref - Weak reference support](https://docs.python.org/3/library/weakref.html)
- [Python Data Model - __weakref__](https://docs.python.org/3/reference/datamodel.html)
- [gc - Garbage collector interface](https://docs.python.org/3/library/gc.html)

### Deep Dive

- [PEP 205 - Weak References](https://peps.python.org/pep-0205/)
- [Python memory management detailed explanation](https://docs.python.org/3/faq/design.html#how-does-python-manage-memory)
- [Weak References in Python - Real Python](https://realpython.com/python-memory-management/)

### Related Modules

- `gc` - Garbage collector control
- `sys.getrefcount()` - Get reference count
- `tracemalloc` - Memory allocation tracing
- `objgraph` - Object reference graph visualization (third-party)

### Design Pattern References

- Observer pattern with weak references
- Flyweight pattern caching implementation
- Object pool pattern

---

## Summary

The `weakref` module provides powerful weak reference tools:

| Tool | Purpose | Typical Use Cases |
|------|---------|-------------------|
| `ref()` | Create weak references | Caching, observer references |
| `proxy()` | Create transparent proxy | Direct attribute access needed |
| `WeakValueDictionary` | Dictionary with weak values | Cache systems |
| `WeakKeyDictionary` | Dictionary with weak keys | Object metadata storage |
| `WeakSet` | Set with weak references | Observer collections |
| `WeakMethod` | Weak reference to bound methods | Event handlers |
| `finalize` | Finalizer | Resource cleanup, leak detection |

Mastering weak references enables you to:
- Implement efficient caching without memory leaks
- Properly handle circular reference problems
- Implement loosely-coupled observer patterns
- Perform reliable resource management and cleanup

In practical development, weak references are essential memory management tools, especially in large applications and long-running services.
