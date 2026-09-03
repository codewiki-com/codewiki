---
title: Python 描述符
description: 深入理解 Python 描述符协议：__get__、__set__、__delete__ 方法，数据描述符与非数据描述符，property 实现原理与实战应用
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - 描述符
  - 属性管理
  - 元编程
  - OOP
status: imported
origin: old/src/content/docs/python/descriptors.en.md
divergence: 0.214
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 面向对象编程
  order: 9
  lastUpdated: 2026-01-07
---

Descriptors are a powerful but often overlooked feature in Python. They are the underlying mechanism for controlling attribute access and serve as the foundation for implementing built-in decorators like `property`, `classmethod`, and `staticmethod`. Understanding the descriptor protocol is key to mastering Python's object-oriented programming.

## Concept Explanation

### What is a Descriptor

A descriptor is an object that implements the descriptor protocol. The descriptor protocol includes the following methods:

- `__get__(self, instance, owner)`: Called when getting an attribute value
- `__set__(self, instance, value)`: Called when setting an attribute value
- `__delete__(self, instance)`: Called when deleting an attribute
- `__set_name__(self, owner, name)`: Called when the descriptor is bound to a class (Python 3.6+)

When a class attribute is a descriptor object, accessing that attribute triggers the corresponding method in the descriptor protocol rather than directly returning the descriptor object itself.

```python
class Descriptor:
    """A simple descriptor example"""

    def __get__(self, instance, owner):
        print(f"__get__ called: instance={instance}, owner={owner}")
        return "Value returned by descriptor"

    def __set__(self, instance, value):
        print(f"__set__ called: instance={instance}, value={value}")

    def __delete__(self, instance):
        print(f"__delete__ called: instance={instance}")

class MyClass:
    attr = Descriptor()  # attr is a descriptor

obj = MyClass()
print(obj.attr)      # Triggers __get__
obj.attr = "new value"    # Triggers __set__
del obj.attr         # Triggers __delete__
```

**Output:**
```
__get__ called: instance=<__main__.MyClass object at 0x...>, owner=<class '__main__.MyClass'>
Value returned by descriptor
__set__ called: instance=<__main__.MyClass object at 0x...>, value=new value
__delete__ called: instance=<__main__.MyClass object at 0x...>
```

### Historical Background

The descriptor protocol was introduced in Python 2.2 as part of "new-style classes". Its design goals were:

1. Provide a general mechanism for attribute access control
2. Unify the implementation of `property`, method binding, and other features
3. Provide more powerful tools for metaprogramming

### What Problems Does It Solve

Descriptors mainly solve the following problems:

1. **Attribute validation**: Type checking or value validation when setting attributes
2. **Lazy computation**: Computing attribute values only when needed
3. **Attribute access control**: Implementing read-only properties, protected attributes, etc.
4. **Reusable attribute logic**: Encapsulating attribute management logic into reusable components

## Core Principles

### Descriptor Triggering Mechanism

When accessing an object's attribute, Python looks up the attribute value in a specific order. Descriptors intervene in this lookup process:

```python
# Lookup order for attribute access obj.attr:
# The class's __getattribute__ method
# Data descriptors (implementing __get__ and __set__)
# Instance's __dict__
# Non-data descriptors (implementing only __get__)
# Class's __dict__
# Parent class's __dict__ (following MRO)
# __getattr__ method (if defined)
```

### Underlying Implementation of Attribute Access

The `object.__getattribute__` method implements the invocation logic for the descriptor protocol:

```python
def __getattribute__(self, name):
    """Simplified attribute access implementation"""
    # Get the class
    cls = type(self)

    # Look for descriptor in class and parent classes
    for klass in cls.__mro__:
        if name in klass.__dict__:
            attr = klass.__dict__[name]

            # Check if it's a data descriptor
            if hasattr(attr, '__get__') and hasattr(attr, '__set__'):
                return attr.__get__(self, cls)
            break

    # Look in instance __dict__
    if name in self.__dict__:
        return self.__dict__[name]

    # Check if it's a non-data descriptor
    for klass in cls.__mro__:
        if name in klass.__dict__:
            attr = klass.__dict__[name]
            if hasattr(attr, '__get__'):
                return attr.__get__(self, cls)
            return attr

    raise AttributeError(f"'{cls.__name__}' object has no attribute '{name}'")
```

### Data Descriptors vs Non-Data Descriptors

Descriptors are divided into two categories with different priorities:

**Data Descriptor**:
- Implements both `__get__` and `__set__` methods
- Has higher priority than instance `__dict__`

**Non-Data Descriptor**:
- Implements only `__get__` method
- Has lower priority than instance `__dict__`

```python
class DataDescriptor:
    """Data descriptor: implements __get__ and __set__"""

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get('_value', 'default value')

    def __set__(self, instance, value):
        instance.__dict__['_value'] = value

class NonDataDescriptor:
    """Non-data descriptor: implements only __get__"""

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return "Value from non-data descriptor"

class MyClass:
    data_attr = DataDescriptor()
    non_data_attr = NonDataDescriptor()

obj = MyClass()

# Data descriptor behavior
print(obj.data_attr)              # default value (from descriptor)
obj.__dict__['data_attr'] = 'instance value'
print(obj.data_attr)              # default value (descriptor has higher priority)

# Non-data descriptor behavior
print(obj.non_data_attr)          # Value from non-data descriptor
obj.__dict__['non_data_attr'] = 'instance value'
print(obj.non_data_attr)          # instance value (instance __dict__ has higher priority)
```

**Output:**
```
default value
default value
Value from non-data descriptor
instance value
```

### Methods Are Also Descriptors

Functions in Python implement the `__get__` method, which is how method binding works:

```python
class MyClass:
    def method(self):
        pass

# Functions are non-data descriptors
print(hasattr(MyClass.method, '__get__'))  # True
print(hasattr(MyClass.method, '__set__'))  # False

obj = MyClass()

# Accessing through class: returns the function itself
print(MyClass.__dict__['method'])  # <function MyClass.method at 0x...>

# Accessing through instance: triggers __get__, returns bound method
print(obj.method)  # <bound method MyClass.method of <__main__.MyClass object at 0x...>>
```

## Key Points

### The Three Methods of the Descriptor Protocol

```python
class CompleteDescriptor:
    """Complete descriptor implementation"""

    def __set_name__(self, owner, name):
        """
        Automatically called in Python 3.6+
        owner: The class that owns this descriptor
        name: The attribute name assigned to the descriptor
        """
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        """
        Called when getting the attribute value
        instance: The instance accessing the attribute, None if accessed through class
        owner: The class that owns this descriptor
        """
        if instance is None:
            return self  # Return descriptor itself when accessed through class
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        """
        Called when setting the attribute value
        instance: The instance setting the attribute
        value: The value to set
        """
        setattr(instance, self.private_name, value)

    def __delete__(self, instance):
        """
        Called when deleting the attribute
        instance: The instance deleting the attribute
        """
        delattr(instance, self.private_name)
```

### The Importance of `__set_name__`

Before Python 3.6, descriptors needed the attribute name to be passed in manually:

```python
# Pre-Python 3.5 approach
class OldDescriptor:
    def __init__(self, name):
        self.name = name  # Name must be passed in manually
        self.private_name = f'_{name}'

class MyClass:
    attr = OldDescriptor('attr')  # Redundant!

# Python 3.6+ approach
class ModernDescriptor:
    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

class MyClass:
    attr = ModernDescriptor()  # Name obtained automatically
```

### The Importance of Instance Checking

In the `__get__` method, you should check whether `instance` is `None`:

```python
class SafeDescriptor:
    def __get__(self, instance, owner):
        if instance is None:
            # Accessed through class: MyClass.attr
            return self
        # Accessed through instance: obj.attr
        return instance.__dict__.get(self.name)
```

### Choosing Storage Location

Descriptors can store data in different locations:

```python
# Method 1: Store in instance's __dict__ (recommended)
class InstanceStorageDescriptor:
    def __set_name__(self, owner, name):
        self.name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value

# Method 2: Store in descriptor itself (need to handle multi-instance issues)
class DescriptorStorageDescriptor:
    def __init__(self):
        self.storage = {}  # Using WeakKeyDictionary is better

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self.storage.get(instance)

    def __set__(self, instance, value):
        self.storage[instance] = value

# Use WeakKeyDictionary to avoid memory leaks
from weakref import WeakKeyDictionary

class BetterDescriptorStorage:
    def __init__(self):
        self.storage = WeakKeyDictionary()

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self.storage.get(instance)

    def __set__(self, instance, value):
        self.storage[instance] = value
```

## Code Examples

### Example 1: Type Validation Descriptor

```python
class TypedProperty:
    """Type validation descriptor"""

    def __init__(self, expected_type, default=None):
        self.expected_type = expected_type
        self.default = default

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, self.default)

    def __set__(self, instance, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(
                f"Attribute '{self.name}' must be of type {self.expected_type.__name__}, "
                f"not {type(value).__name__}"
            )
        setattr(instance, self.private_name, value)

    def __delete__(self, instance):
        delattr(instance, self.private_name)

class Person:
    name = TypedProperty(str)
    age = TypedProperty(int)
    email = TypedProperty(str, default="Not set")

    def __init__(self, name, age, email=None):
        self.name = name
        self.age = age
        if email:
            self.email = email

# Usage example
p = Person("John", 25)
print(f"Name: {p.name}, Age: {p.age}, Email: {p.email}")

p.age = 26  # Normal
print(f"Updated age: {p.age}")

try:
    p.age = "twenty-six"  # Type error
except TypeError as e:
    print(f"Type error: {e}")
```

**Output:**
```
Name: John, Age: 25, Email: Not set
Updated age: 26
Type error: Attribute 'age' must be of type int, not str
```

### Example 2: Range Validation Descriptor

```python
class RangeValidated:
    """Range validation descriptor"""

    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"'{self.name}' cannot be less than {self.min_value}, current value: {value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"'{self.name}' cannot be greater than {self.max_value}, current value: {value}")
        setattr(instance, self.private_name, value)

class Student:
    score = RangeValidated(min_value=0, max_value=100)
    age = RangeValidated(min_value=0, max_value=150)

    def __init__(self, name, score, age):
        self.name = name
        self.score = score
        self.age = age

# Usage example
s = Student("Alice", 85, 20)
print(f"Student: {s.name}, Score: {s.score}, Age: {s.age}")

try:
    s.score = 150  # Out of range
except ValueError as e:
    print(f"Validation error: {e}")
```

### Example 3: Lazy Property Descriptor (Lazy Evaluation)

```python
class LazyProperty:
    """Lazy computation descriptor"""

    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # Compute value and cache it in instance __dict__
        value = self.func(instance)
        # Set directly to __dict__, next access will bypass descriptor
        instance.__dict__[self.name] = value
        return value

class DataAnalyzer:
    def __init__(self, data):
        self.data = data

    @LazyProperty
    def statistics(self):
        """Computed only on first access"""
        print("Computing statistics...")
        import time
        time.sleep(1)  # Simulate expensive computation
        return {
            'sum': sum(self.data),
            'avg': sum(self.data) / len(self.data),
            'max': max(self.data),
            'min': min(self.data)
        }

# Usage example
analyzer = DataAnalyzer([1, 2, 3, 4, 5])
print("Analyzer created")

print("\nFirst access to statistics:")
print(analyzer.statistics)

print("\nSecond access (from cache):")
print(analyzer.statistics)
```

**Output:**
```
Analyzer created

First access to statistics:
Computing statistics...
{'sum': 15, 'avg': 3.0, 'max': 5, 'min': 1}

Second access (from cache):
{'sum': 15, 'avg': 3.0, 'max': 5, 'min': 1}
```

### Example 4: Implementing the property Decorator

```python
class MyProperty:
    """Simplified implementation of property"""

    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        self.__doc__ = doc if doc else (fget.__doc__ if fget else None)

    def __get__(self, instance, owner):
        if instance is None:
            return self
        if self.fget is None:
            raise AttributeError("Cannot read attribute")
        return self.fget(instance)

    def __set__(self, instance, value):
        if self.fset is None:
            raise AttributeError("Cannot set attribute")
        self.fset(instance, value)

    def __delete__(self, instance):
        if self.fdel is None:
            raise AttributeError("Cannot delete attribute")
        self.fdel(instance)

    def getter(self, fget):
        return type(self)(fget, self.fset, self.fdel, self.__doc__)

    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel, self.__doc__)

    def deleter(self, fdel):
        return type(self)(self.fget, self.fset, fdel, self.__doc__)

class Circle:
    def __init__(self, radius):
        self._radius = radius

    @MyProperty
    def radius(self):
        """The circle's radius"""
        return self._radius

    @radius.setter
    def radius(self, value):
        if value <= 0:
            raise ValueError("Radius must be positive")
        self._radius = value

    @MyProperty
    def area(self):
        """The circle's area (read-only)"""
        import math
        return math.pi * self._radius ** 2

# Usage example
c = Circle(5)
print(f"Radius: {c.radius}")
print(f"Area: {c.area:.2f}")

c.radius = 10
print(f"New radius: {c.radius}")
print(f"New area: {c.area:.2f}")

try:
    c.area = 100  # Attempt to set read-only property
except AttributeError as e:
    print(f"Error: {e}")
```

### Example 5: Implementing classmethod and staticmethod

```python
class MyClassMethod:
    """Simplified implementation of classmethod"""

    def __init__(self, func):
        self.func = func

    def __get__(self, instance, owner):
        # Return a method bound to the class regardless of access through class or instance
        def bound_method(*args, **kwargs):
            return self.func(owner, *args, **kwargs)
        return bound_method

class MyStaticMethod:
    """Simplified implementation of staticmethod"""

    def __init__(self, func):
        self.func = func

    def __get__(self, instance, owner):
        # Return the original function directly, without binding
        return self.func

class Demo:
    value = 100

    @MyClassMethod
    def class_method(cls, x):
        return f"Class method: cls.value = {cls.value}, x = {x}"

    @MyStaticMethod
    def static_method(x, y):
        return f"Static method: x + y = {x + y}"

# Usage example
obj = Demo()

# Call through class
print(Demo.class_method(10))
print(Demo.static_method(3, 4))

# Call through instance
print(obj.class_method(20))
print(obj.static_method(5, 6))
```

### Example 6: Read-Only Descriptor

```python
class ReadOnly:
    """Read-only descriptor"""

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        # Only allow setting once
        if hasattr(instance, self.private_name):
            raise AttributeError(f"'{self.name}' is a read-only attribute and cannot be modified")
        setattr(instance, self.private_name, value)

class ImmutablePoint:
    x = ReadOnly()
    y = ReadOnly()

    def __init__(self, x, y):
        self.x = x  # First assignment
        self.y = y  # First assignment

    def __repr__(self):
        return f"ImmutablePoint({self.x}, {self.y})"

# Usage example
point = ImmutablePoint(10, 20)
print(point)

try:
    point.x = 100  # Attempt to modify
except AttributeError as e:
    print(f"Error: {e}")
```

### Example 7: Descriptor with Cache Expiration

```python
import time
from functools import wraps

class CachedProperty:
    """Cached descriptor with expiration time"""

    def __init__(self, ttl=60):
        """
        ttl: Cache time-to-live (seconds)
        """
        self.ttl = ttl
        self.func = None

    def __call__(self, func):
        self.func = func
        self.name = func.__name__
        return self

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # Check cache
        cache_name = f'_cache_{self.name}'
        time_name = f'_time_{self.name}'

        cached_time = getattr(instance, time_name, 0)
        if time.time() - cached_time < self.ttl:
            return getattr(instance, cache_name)

        # Compute new value
        value = self.func(instance)
        setattr(instance, cache_name, value)
        setattr(instance, time_name, time.time())
        return value

    def invalidate(self, instance):
        """Manually invalidate the cache"""
        cache_name = f'_cache_{self.name}'
        time_name = f'_time_{self.name}'
        if hasattr(instance, cache_name):
            delattr(instance, cache_name)
        if hasattr(instance, time_name):
            delattr(instance, time_name)

class WeatherService:
    def __init__(self, city):
        self.city = city

    @CachedProperty(ttl=5)  # 5 second cache
    def temperature(self):
        """Get temperature (simulating API call)"""
        print(f"Fetching temperature for {self.city}...")
        import random
        return random.randint(15, 35)

# Usage example
weather = WeatherService("Beijing")

print("First fetch:")
print(f"Temperature: {weather.temperature} degrees")

print("\nImmediate second fetch (from cache):")
print(f"Temperature: {weather.temperature} degrees")

print("\nWaiting for cache to expire...")
time.sleep(6)

print("\nFetch after cache expiration:")
print(f"Temperature: {weather.temperature} degrees")
```

## Best Practices

### Always Handle Class Access

```python
class GoodDescriptor:
    def __get__(self, instance, owner):
        if instance is None:
            return self  # Return descriptor when accessed through class
        return self._get_value(instance)

    def _get_value(self, instance):
        # Actual retrieval logic
        pass
```

### Use `__set_name__` to Automatically Get Attribute Name

```python
class ModernDescriptor:
    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = f'_{name}'

    # No longer need to pass name in __init__
```

### Prefer Storing Data in Instance `__dict__`

```python
class PreferredStorage:
    def __set_name__(self, owner, name):
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.private_name)

    def __set__(self, instance, value):
        instance.__dict__[self.private_name] = value
```

### Provide Clear Error Messages

```python
class ValidatedDescriptor:
    def __set__(self, instance, value):
        if not self._validate(value):
            raise ValueError(
                f"Value {value!r} for attribute '{self.name}' is invalid: {self._error_message(value)}"
            )
        instance.__dict__[self.private_name] = value

    def _validate(self, value):
        raise NotImplementedError

    def _error_message(self, value):
        raise NotImplementedError
```

### Use WeakKeyDictionary to Avoid Memory Leaks

```python
from weakref import WeakKeyDictionary

class SafeStorageDescriptor:
    def __init__(self):
        self._storage = WeakKeyDictionary()

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self._storage.get(instance)

    def __set__(self, instance, value):
        self._storage[instance] = value
```

### Document Descriptor Behavior

```python
class DocumentedDescriptor:
    """
    A descriptor with complete documentation.

    This descriptor provides type checking functionality to ensure
    attribute values conform to the specified type.

    Attributes:
        expected_type: The expected type of the value
        allow_none: Whether None values are allowed

    Example:
        class User:
            name = DocumentedDescriptor(str)
            age = DocumentedDescriptor(int, allow_none=True)
    """

    def __init__(self, expected_type, allow_none=False):
        """
        Initialize the descriptor.

        Args:
            expected_type: The expected type of the attribute value
            allow_none: Whether None values are allowed, defaults to False
        """
        self.expected_type = expected_type
        self.allow_none = allow_none
```

## Common Pitfalls

### Pitfall 1: Forgetting to Handle Class Access

```python
# Wrong example
class BadDescriptor:
    def __get__(self, instance, owner):
        return instance.__dict__['value']  # instance might be None!

# Correct example
class GoodDescriptor:
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get('value')
```

### Pitfall 2: Storing Data in Descriptor Instance

```python
# Wrong example: All instances share the same value
class BadStorageDescriptor:
    def __init__(self):
        self.value = None  # Shared by all instances!

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self.value

    def __set__(self, instance, value):
        self.value = value

class MyClass:
    attr = BadStorageDescriptor()

obj1 = MyClass()
obj2 = MyClass()
obj1.attr = "value from obj1"
print(obj2.attr)  # Output: value from obj1 (wrong!)

# Correct example: Data stored in instance
class GoodStorageDescriptor:
    def __set_name__(self, owner, name):
        self.name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value
```

### Pitfall 3: Confusing Data and Non-Data Descriptors

```python
class NonDataDescriptor:
    """Only has __get__, is a non-data descriptor"""
    def __get__(self, instance, owner):
        return "Value from descriptor"

class MyClass:
    attr = NonDataDescriptor()

obj = MyClass()
print(obj.attr)  # Value from descriptor

# Setting instance attribute overrides non-data descriptor
obj.__dict__['attr'] = "Instance value"
print(obj.attr)  # Instance value (non-data descriptor is overridden)

# If you don't want it to be overridden, implement __set__
class DataDescriptor:
    """Implements __get__ and __set__, is a data descriptor"""
    def __get__(self, instance, owner):
        return "Value from descriptor"

    def __set__(self, instance, value):
        raise AttributeError("Setting not allowed")
```

### Pitfall 4: Calling Descriptor in `__init__`

```python
class Descriptor:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name, "default value")

    def __set__(self, instance, value):
        print(f"Setting {self.name} = {value}")
        instance.__dict__[self.name] = value

class MyClass:
    attr = Descriptor()

    def __init__(self):
        # This triggers the descriptor's __set__ method
        self.attr = "initial value"  # Correct

        # If you want to bypass descriptor and set directly, use __dict__
        # self.__dict__['attr'] = "initial value"  # Bypass descriptor
```

### Pitfall 5: Ignoring Inheritance

```python
class BaseDescriptor:
    def __set_name__(self, owner, name):
        self.name = name
        print(f"Descriptor added to class {owner.__name__}")

class Parent:
    attr = BaseDescriptor()  # Output: Descriptor added to class Parent

class Child(Parent):
    pass  # __set_name__ is not called again!

# Child inherits the descriptor, but doesn't trigger __set_name__
# If reconfiguration is needed in subclass, it must be explicitly defined
```

## Performance Considerations

### Descriptor Performance Overhead

```python
import timeit

class WithDescriptor:
    class ValueDescriptor:
        def __set_name__(self, owner, name):
            self.name = f'_{name}'

        def __get__(self, instance, owner):
            if instance is None:
                return self
            return instance.__dict__.get(self.name)

        def __set__(self, instance, value):
            instance.__dict__[self.name] = value

    value = ValueDescriptor()

class WithoutDescriptor:
    def __init__(self):
        self._value = None

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, val):
        self._value = val

class DirectAccess:
    def __init__(self):
        self.value = None

# Performance tests
def test_descriptor():
    obj = WithDescriptor()
    for _ in range(1000):
        obj.value = 42
        _ = obj.value

def test_property():
    obj = WithoutDescriptor()
    for _ in range(1000):
        obj.value = 42
        _ = obj.value

def test_direct():
    obj = DirectAccess()
    for _ in range(1000):
        obj.value = 42
        _ = obj.value

# Run tests
print("Descriptor:", timeit.timeit(test_descriptor, number=1000))
print("property:", timeit.timeit(test_property, number=1000))
print("Direct access:", timeit.timeit(test_direct, number=1000))
```

**Typical results:**
```
Descriptor: 0.45s
property: 0.50s
Direct access: 0.15s
```

### Optimization Suggestions

1. **For frequently accessed attributes**: Consider using direct attributes or `__slots__`
2. **For computationally intensive attributes**: Use lazy computation and caching
3. **Avoid complex operations in descriptors**: Keep `__get__` and `__set__` concise
4. **Use `__slots__` with descriptors**: Reduce memory usage

```python
class OptimizedClass:
    __slots__ = ('_name', '_age')

    class ValidatedString:
        def __set_name__(self, owner, name):
            self.name = f'_{name}'

        def __get__(self, instance, owner):
            if instance is None:
                return self
            return getattr(instance, self.name, None)

        def __set__(self, instance, value):
            if not isinstance(value, str):
                raise TypeError("Must be a string")
            setattr(instance, self.name, value)

    name = ValidatedString()

    def __init__(self, name, age):
        self.name = name
        self._age = age
```

## Real-World Scenarios

### Scenario 1: ORM Field Definition

```python
class Field:
    """ORM field base class"""

    def __set_name__(self, owner, name):
        self.name = name
        self.column_name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        value = self.validate(value)
        instance.__dict__[self.name] = value

    def validate(self, value):
        return value

class StringField(Field):
    def __init__(self, max_length=255):
        self.max_length = max_length

    def validate(self, value):
        if value is not None:
            if not isinstance(value, str):
                raise TypeError(f"{self.name} must be a string")
            if len(value) > self.max_length:
                raise ValueError(f"{self.name} length cannot exceed {self.max_length}")
        return value

class IntegerField(Field):
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, value):
        if value is not None:
            if not isinstance(value, int):
                raise TypeError(f"{self.name} must be an integer")
            if self.min_value is not None and value < self.min_value:
                raise ValueError(f"{self.name} cannot be less than {self.min_value}")
            if self.max_value is not None and value > self.max_value:
                raise ValueError(f"{self.name} cannot be greater than {self.max_value}")
        return value

class Model:
    """Simplified model base class"""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __repr__(self):
        fields = ', '.join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{self.__class__.__name__}({fields})"

class User(Model):
    username = StringField(max_length=50)
    email = StringField(max_length=100)
    age = IntegerField(min_value=0, max_value=150)

# Usage example
user = User(username="johndoe", email="johndoe@example.com", age=25)
print(user)

try:
    user.age = -1
except ValueError as e:
    print(f"Validation error: {e}")
```

### Scenario 2: Configuration Management System

```python
import os
import json

class ConfigValue:
    """Configuration value descriptor"""

    def __init__(self, default=None, env_var=None, validator=None):
        self.default = default
        self.env_var = env_var
        self.validator = validator

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # First priority: get from instance
        value = getattr(instance, self.private_name, None)
        if value is not None:
            return value

        # Second priority: get from environment variable
        if self.env_var:
            env_value = os.environ.get(self.env_var)
            if env_value is not None:
                return self._convert(env_value)

        # Last resort: use default value
        return self.default

    def __set__(self, instance, value):
        if self.validator and not self.validator(value):
            raise ValueError(f"Invalid value for configuration '{self.name}': {value}")
        setattr(instance, self.private_name, value)

    def _convert(self, value):
        # Simple type conversion
        if isinstance(self.default, bool):
            return value.lower() in ('true', '1', 'yes')
        if isinstance(self.default, int):
            return int(value)
        if isinstance(self.default, float):
            return float(value)
        return value

class AppConfig:
    debug = ConfigValue(default=False, env_var='APP_DEBUG')
    port = ConfigValue(default=8080, env_var='APP_PORT')
    database_url = ConfigValue(
        default='sqlite:///app.db',
        env_var='DATABASE_URL'
    )
    max_connections = ConfigValue(
        default=10,
        env_var='MAX_CONNECTIONS',
        validator=lambda x: 1 <= x <= 100
    )

# Usage example
config = AppConfig()
print(f"Debug: {config.debug}")
print(f"Port: {config.port}")
print(f"Database: {config.database_url}")

# Can override configuration
config.port = 9000
print(f"New Port: {config.port}")
```

### Scenario 3: Data Binding and Observer Pattern

```python
class Observable:
    """Observable descriptor"""

    def __init__(self):
        self.observers = []

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        old_value = getattr(instance, self.private_name, None)
        setattr(instance, self.private_name, value)

        # Notify all observers
        if old_value != value:
            for callback in self.observers:
                callback(instance, self.name, old_value, value)

    def add_observer(self, callback):
        self.observers.append(callback)

    def remove_observer(self, callback):
        self.observers.remove(callback)

class Stock:
    price = Observable()
    name = Observable()

    def __init__(self, name, price):
        self.name = name
        self.price = price

def price_change_handler(instance, attr, old, new):
    if attr == 'price':
        change = new - old if old else 0
        direction = "increased" if change > 0 else "decreased"
        print(f"{instance.name} price {direction}: {old} -> {new} (change: {change:+.2f})")

# Register observer
Stock.price.add_observer(price_change_handler)

# Usage example
stock = Stock("AAPL", 150.0)
stock.price = 155.0  # Triggers notification
stock.price = 148.0  # Triggers notification
```

## Interview Key Points

### What is a descriptor? What methods does the descriptor protocol contain?

**Answer key points:**
- A descriptor is an object that implements at least one of `__get__`, `__set__`, or `__delete__` methods
- The descriptor protocol contains four methods (Python 3.6+):
  - `__get__(self, instance, owner)`: Get attribute value
  - `__set__(self, instance, value)`: Set attribute value
  - `__delete__(self, instance)`: Delete attribute
  - `__set_name__(self, owner, name)`: Automatically get attribute name

### What is the difference between data descriptors and non-data descriptors?

**Answer key points:**
- **Data descriptor**: Implements `__get__` and `__set__`, has higher priority than instance `__dict__`
- **Non-data descriptor**: Implements only `__get__`, has lower priority than instance `__dict__`
- This difference determines the lookup order for attribute access

### How is property implemented?

**Answer key points:**
- `property` is a data descriptor
- It stores three functions: `fget`, `fset`, and `fdel`
- `__get__` calls `fget`, `__set__` calls `fset`, `__delete__` calls `fdel`

### Where should data be stored in a descriptor?

**Answer key points:**
- Recommended to store in **instance's `__dict__`** using a private attribute name
- If storing in the descriptor itself, use `WeakKeyDictionary` to avoid memory leaks
- Should not store directly in descriptor instance's regular attributes (causes all instances to share data)

### What is the difference between `__getattribute__` and `__getattr__`? What is their relationship with descriptors?

**Answer key points:**
- `__getattribute__`: Called on every attribute access, is the caller of the descriptor protocol
- `__getattr__`: Called only when the attribute doesn't exist, is the last fallback
- Descriptor's `__get__` method is called by `__getattribute__`

### How to implement a read-only descriptor?

**Answer key points:**
```python
class ReadOnly:
    def __set_name__(self, owner, name):
        self.name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.name, None)

    def __set__(self, instance, value):
        if hasattr(instance, self.name):
            raise AttributeError("Read-only attribute")
        setattr(instance, self.name, value)
```

### Why can functions be used as methods?

**Answer key points:**
- Python functions implement the `__get__` method, making them non-data descriptors
- When accessing a function through an instance, `__get__` returns a bound method
- Bound methods automatically pass the instance as the first argument

## Further Reading

### Official Documentation
- [Python Data Model - Descriptors](https://docs.python.org/3/reference/datamodel.html#descriptors)
- [Descriptor HowTo Guide](https://docs.python.org/3/howto/descriptor.html)

### Classic Books
- "Fluent Python" Chapter 20 - Attribute Descriptors
- "Python Cookbook" Chapter 8 - Classes and Objects
- "Expert Python Programming" - Descriptor-related chapters

### Quality Articles
- [Descriptor HowTo Guide](https://docs.python.org/3/howto/descriptor.html) - Raymond Hettinger
- [Python Descriptors Demystified](https://realpython.com/python-descriptors/) - Real Python
- [Understanding Python's descriptor protocol](https://www.ibm.com/developerworks/library/os-pythondescriptors/)

### Related Source Code
- CPython's implementation of `property`: Objects/descrobject.c
- Implementation of `functools.cached_property`
- Field descriptors in Django ORM
- Column descriptors in SQLAlchemy
