---
title: Python singledispatch 单分派泛型函数
description: 深入掌握 Python singledispatch：基于类型的函数分派、@register 注册器、singledispatchmethod 类方法分派与实战模式
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - singledispatch
  - 泛型函数
  - 类型分派
  - functools
  - 多态
status: imported
origin: old/src/content/docs/python/singledispatch.en.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 函数式编程
  order: 33
  lastUpdated: 2026-01-07
---

`singledispatch` is a decorator in Python's standard library `functools` module, used to implement function overloading based on the type of the first argument (single-dispatch generic functions). It is an elegant way to implement polymorphic behavior in Python, allowing you to define multiple implementation versions of the same function for different types.

## Concept Explanation

### What is Single Dispatch?

In programming languages, **dispatch** refers to the mechanism of selecting which function implementation to execute based on certain conditions:

- **Single Dispatch**: Selects implementation based on the type of **one** argument
- **Multiple Dispatch**: Selects implementation based on the types of **multiple** arguments

Python's `singledispatch` implements single dispatch, meaning it decides which implementation to call based on the type of the function's **first argument**.

### Why Do We Need singledispatch?

Before `singledispatch`, we typically used `if-elif-else` or `isinstance()` to implement type-based dispatch:

```python
# Traditional approach: using if-elif-else for type checking
def process(data):
    if isinstance(data, int):
        return data * 2
    elif isinstance(data, str):
        return data.upper()
    elif isinstance(data, list):
        return [process(item) for item in data]
    else:
        raise TypeError(f"Unsupported type: {type(data)}")

# Problems:
# Verbose code, difficult to extend
# Adding new types requires modifying the original function
# Violates the Open-Closed Principle
```

Using `singledispatch` solves these problems:

```python
from functools import singledispatch

@singledispatch
def process(data):
    """Default implementation"""
    raise TypeError(f"Unsupported type: {type(data)}")

@process.register(int)
def _(data):
    return data * 2

@process.register(str)
def _(data):
    return data.upper()

@process.register(list)
def _(data):
    return [process(item) for item in data]

# Advantages:
# Cleaner code, each type's handling logic is independent
# Easy to extend, adding new types doesn't require modifying the original function
# Follows the Open-Closed Principle
```

### Historical Background

`singledispatch` was introduced in **Python 3.4** through [PEP 443](https://peps.python.org/pep-0443/). The design was inspired by generic function concepts from other languages (such as CLOS in Common Lisp and Julia's multiple dispatch system).

**Python 3.8** further enhanced this feature by introducing `singledispatchmethod`, which supports single dispatch in class methods.

---

## Core Principles

### How It Works

The core workflow of `singledispatch` is as follows:

```
1. Decorate the base function with @singledispatch (defining default behavior)
2. Register type-specific handler functions with @func.register(type)
3. When called, look up the registry based on the first argument's type
4. If a matching implementation is found, call it; otherwise, call the base function
```

### Type Resolution Order (MRO)

When the argument type doesn't have an exact match, `singledispatch` searches for the closest matching type according to the Method Resolution Order (MRO):

```python
from functools import singledispatch

@singledispatch
def describe(obj):
    return f"Object: {obj}"

@describe.register(int)
def _(obj):
    return f"Integer: {obj}"

# bool is a subclass of int
print(describe(True))   # Output: Integer: True
print(describe(42))     # Output: Integer: 42
print(describe("hi"))   # Output: Object: hi
```

### Registry Structure

`singledispatch` internally maintains a type-to-function mapping registry:

```python
from functools import singledispatch

@singledispatch
def func(arg):
    pass

@func.register(int)
def _(arg):
    pass

@func.register(str)
def _(arg):
    pass

# View the registry
print(func.registry)
# Output similar to: mappingproxy({
#     <class 'object'>: <function func at ...>,
#     <class 'int'>: <function _ at ...>,
#     <class 'str'>: <function _ at ...>
# })
```

### Simplified Source Code Implementation

To understand how `singledispatch` works, here's a simplified implementation:

```python
def simple_singledispatch(func):
    """Simplified implementation of singledispatch"""
    registry = {object: func}  # Registry, object maps to default implementation

    def dispatch(cls):
        """Find the handler function for the specified type"""
        # Search in MRO order
        for base in cls.__mro__:
            if base in registry:
                return registry[base]
        return registry[object]

    def register(cls):
        """Register a new type handler function"""
        def decorator(impl):
            registry[cls] = impl
            return impl
        return decorator

    def wrapper(arg, *args, **kwargs):
        """Dispatch logic"""
        impl = dispatch(type(arg))
        return impl(arg, *args, **kwargs)

    wrapper.register = register
    wrapper.dispatch = dispatch
    wrapper.registry = registry

    return wrapper
```

---

## Key Points

### The @singledispatch Decorator

```python
from functools import singledispatch

@singledispatch
def process(data):
    """
    Base function: defines default behavior
    Called when no matching registered type is found
    """
    raise NotImplementedError(f"Unsupported type: {type(data).__name__}")
```

### The @register Decorator

There are three ways to register:

```python
from functools import singledispatch
from decimal import Decimal

@singledispatch
def format_value(value):
    return str(value)

# Method 1: Using type as argument
@format_value.register(int)
def _(value):
    return f"{value:,}"

# Method 2: Using type annotations (Python 3.7+, recommended)
@format_value.register
def _(value: float) -> str:
    return f"{value:.2f}"

# Method 3: Register the same implementation for multiple types
@format_value.register(Decimal)
@format_value.register(complex)
def _(value):
    return f"Special: {value}"

# Test
print(format_value(1234567))      # 1,234,567
print(format_value(3.14159))      # 3.14
print(format_value(Decimal("0.1")))  # Special: 0.1
```

### The dispatch() Method

Get the handler function for a specific type:

```python
from functools import singledispatch

@singledispatch
def process(data):
    return "default"

@process.register(int)
def _(data):
    return "integer"

# Get the handler function for int type
int_handler = process.dispatch(int)
print(int_handler(42))  # integer

# Get the handler for an unregistered type (returns default)
list_handler = process.dispatch(list)
print(list_handler([1, 2, 3]))  # default
```

### The registry Attribute

View all registered types:

```python
from functools import singledispatch

@singledispatch
def process(data):
    pass

@process.register(int)
def _(data):
    pass

@process.register(str)
def _(data):
    pass

# View all registered types
print(process.registry.keys())
# dict_keys([<class 'object'>, <class 'int'>, <class 'str'>])
```

### singledispatchmethod (Python 3.8+)

For single dispatch in class methods:

```python
from functools import singledispatchmethod

class Processor:
    @singledispatchmethod
    def process(self, data):
        """Default processing method"""
        raise NotImplementedError(f"Unsupported type: {type(data)}")

    @process.register(int)
    def _(self, data):
        return f"Processing integer: {data * 2}"

    @process.register(str)
    def _(self, data):
        return f"Processing string: {data.upper()}"

    @process.register(list)
    def _(self, data):
        return f"Processing list: {len(data)} elements"

# Usage
proc = Processor()
print(proc.process(42))          # Processing integer: 84
print(proc.process("hello"))     # Processing string: HELLO
print(proc.process([1, 2, 3]))   # Processing list: 3 elements
```

### Combining with classmethod and staticmethod

```python
from functools import singledispatchmethod

class Converter:
    @singledispatchmethod
    @classmethod
    def convert(cls, value):
        """Single dispatch for class methods"""
        return str(value)

    @convert.register(int)
    @classmethod
    def _(cls, value):
        return f"Int: {value}"

    @convert.register(float)
    @classmethod
    def _(cls, value):
        return f"Float: {value:.2f}"

# Usage
print(Converter.convert(42))     # Int: 42
print(Converter.convert(3.14))   # Float: 3.14
```

---

## Code Examples

### Basic Example: Data Serialization

```python
from functools import singledispatch
from datetime import datetime, date
from decimal import Decimal
import json

@singledispatch
def to_json_serializable(obj):
    """Convert object to JSON-serializable format"""
    # Default: try to use the object's __dict__
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    raise TypeError(f"Cannot serialize type: {type(obj).__name__}")

@to_json_serializable.register(datetime)
def _(obj):
    """datetime to ISO format string"""
    return obj.isoformat()

@to_json_serializable.register(date)
def _(obj):
    """date to ISO format string"""
    return obj.isoformat()

@to_json_serializable.register(Decimal)
def _(obj):
    """Decimal to string to preserve precision"""
    return str(obj)

@to_json_serializable.register(set)
def _(obj):
    """set to list"""
    return list(obj)

@to_json_serializable.register(bytes)
def _(obj):
    """bytes to base64 string"""
    import base64
    return base64.b64encode(obj).decode('ascii')

# Custom JSON encoder
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            return to_json_serializable(obj)
        except TypeError:
            return super().default(obj)

# Test
data = {
    'timestamp': datetime.now(),
    'date': date.today(),
    'price': Decimal('19.99'),
    'tags': {'python', 'programming'},
    'binary': b'hello'
}

print(json.dumps(data, cls=CustomEncoder, indent=2, ensure_ascii=False))
```

### Advanced Example: Visitor Pattern

```python
from functools import singledispatch
from dataclasses import dataclass
from typing import List

# Define AST nodes
@dataclass
class NumberNode:
    value: float

@dataclass
class BinaryOpNode:
    operator: str
    left: 'Node'
    right: 'Node'

@dataclass
class UnaryOpNode:
    operator: str
    operand: 'Node'

Node = NumberNode | BinaryOpNode | UnaryOpNode

# Implement visitor pattern using singledispatch
@singledispatch
def evaluate(node: Node) -> float:
    """Evaluate the expression tree"""
    raise TypeError(f"Unknown node type: {type(node)}")

@evaluate.register(NumberNode)
def _(node: NumberNode) -> float:
    return node.value

@evaluate.register(BinaryOpNode)
def _(node: BinaryOpNode) -> float:
    left = evaluate(node.left)
    right = evaluate(node.right)

    match node.operator:
        case '+':
            return left + right
        case '-':
            return left - right
        case '*':
            return left * right
        case '/':
            return left / right
        case _:
            raise ValueError(f"Unknown operator: {node.operator}")

@evaluate.register(UnaryOpNode)
def _(node: UnaryOpNode) -> float:
    operand = evaluate(node.operand)

    match node.operator:
        case '-':
            return -operand
        case '+':
            return operand
        case _:
            raise ValueError(f"Unknown unary operator: {node.operator}")

# Another visitor: format expression
@singledispatch
def format_expr(node: Node) -> str:
    """Convert expression tree to string"""
    raise TypeError(f"Unknown node type: {type(node)}")

@format_expr.register(NumberNode)
def _(node: NumberNode) -> str:
    return str(node.value)

@format_expr.register(BinaryOpNode)
def _(node: BinaryOpNode) -> str:
    left = format_expr(node.left)
    right = format_expr(node.right)
    return f"({left} {node.operator} {right})"

@format_expr.register(UnaryOpNode)
def _(node: UnaryOpNode) -> str:
    operand = format_expr(node.operand)
    return f"({node.operator}{operand})"

# Build expression tree: (3 + 4) * (-2)
expr = BinaryOpNode(
    '*',
    BinaryOpNode('+', NumberNode(3), NumberNode(4)),
    UnaryOpNode('-', NumberNode(2))
)

print(f"Expression: {format_expr(expr)}")  # Expression: ((3 + 4) * (-2))
print(f"Result: {evaluate(expr)}")         # Result: -14.0
```

### Practical Example: Type-Safe Configuration Loading

```python
from functools import singledispatch
from pathlib import Path
from typing import Any, Dict
import json

@singledispatch
def load_config(source) -> Dict[str, Any]:
    """
    Load configuration from various sources
    Supports: string, Path, file object, dictionary
    """
    raise TypeError(f"Unsupported config source type: {type(source).__name__}")

@load_config.register(str)
def _(source: str) -> Dict[str, Any]:
    """Load from JSON string"""
    return json.loads(source)

@load_config.register(Path)
def _(source: Path) -> Dict[str, Any]:
    """Load from file path"""
    if not source.exists():
        raise FileNotFoundError(f"Config file not found: {source}")

    suffix = source.suffix.lower()
    content = source.read_text(encoding='utf-8')

    if suffix == '.json':
        return json.loads(content)
    elif suffix in ('.yaml', '.yml'):
        try:
            import yaml
            return yaml.safe_load(content)
        except ImportError:
            raise ImportError("Loading YAML requires pyyaml to be installed")
    elif suffix == '.toml':
        try:
            import tomllib  # Python 3.11+
        except ImportError:
            import tomli as tomllib
        return tomllib.loads(content)
    else:
        raise ValueError(f"Unsupported config file format: {suffix}")

@load_config.register(dict)
def _(source: dict) -> Dict[str, Any]:
    """Use dictionary directly"""
    return source.copy()

# Support file objects
from io import IOBase

@load_config.register(IOBase)
def _(source: IOBase) -> Dict[str, Any]:
    """Load from file object"""
    content = source.read()
    if isinstance(content, bytes):
        content = content.decode('utf-8')
    return json.loads(content)

# Usage examples
# Load from string
config1 = load_config('{"debug": true, "port": 8080}')
print(f"From string: {config1}")

# Load from dictionary
config2 = load_config({'debug': False, 'port': 3000})
print(f"From dict: {config2}")

# Load from file (assuming file exists)
# config3 = load_config(Path('config.json'))
```

### Advanced Example: Extensible Formatter

```python
from functools import singledispatchmethod
from datetime import datetime, date, timedelta
from typing import Optional
from decimal import Decimal

class Formatter:
    """
    Extensible value formatter
    Supports defining formatting logic for different types via singledispatchmethod
    """

    def __init__(self, locale: str = 'en_US'):
        self.locale = locale
        self._number_sep = ',' if locale.startswith('en') else ','

    @singledispatchmethod
    def format(self, value, **options) -> str:
        """
        Format any value

        Args:
            value: The value to format
            **options: Formatting options

        Returns:
            Formatted string
        """
        return str(value)

    @format.register(int)
    def _(self, value: int, **options) -> str:
        """Format integer with thousands separator"""
        return f"{value:,}".replace(',', self._number_sep)

    @format.register(float)
    def _(self, value: float, precision: int = 2, **options) -> str:
        """Format floating point number"""
        formatted = f"{value:,.{precision}f}"
        return formatted.replace(',', self._number_sep)

    @format.register(Decimal)
    def _(self, value: Decimal, precision: Optional[int] = None, **options) -> str:
        """Format Decimal, preserving precision"""
        if precision is not None:
            value = round(value, precision)
        return str(value)

    @format.register(datetime)
    def _(self, value: datetime, fmt: str = '%Y-%m-%d %H:%M:%S', **options) -> str:
        """Format datetime"""
        return value.strftime(fmt)

    @format.register(date)
    def _(self, value: date, fmt: str = '%Y-%m-%d', **options) -> str:
        """Format date"""
        return value.strftime(fmt)

    @format.register(timedelta)
    def _(self, value: timedelta, **options) -> str:
        """Format time interval"""
        total_seconds = int(value.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        parts = []
        if hours:
            parts.append(f"{hours} hours")
        if minutes:
            parts.append(f"{minutes} minutes")
        if seconds or not parts:
            parts.append(f"{seconds} seconds")

        return ' '.join(parts)

    @format.register(bool)
    def _(self, value: bool, **options) -> str:
        """Format boolean"""
        return 'Yes' if value else 'No'

    @format.register(list)
    def _(self, value: list, sep: str = ', ', **options) -> str:
        """Format list"""
        return sep.join(self.format(item, **options) for item in value)

    @format.register(dict)
    def _(self, value: dict, **options) -> str:
        """Format dictionary"""
        items = [f"{k}: {self.format(v, **options)}" for k, v in value.items()]
        return '{' + ', '.join(items) + '}'

# Usage example
fmt = Formatter(locale='en_US')

print(fmt.format(1234567))                    # 1,234,567
print(fmt.format(3.14159, precision=3))       # 3.142
print(fmt.format(datetime.now()))             # 2026-01-07 10:30:00
print(fmt.format(timedelta(hours=2, minutes=30, seconds=45)))  # 2 hours 30 minutes 45 seconds
print(fmt.format(True))                       # Yes
print(fmt.format([1, 2, 3]))                  # 1, 2, 3
print(fmt.format({'name': 'John', 'age': 30}))  # {name: John, age: 30}
```

---

## Best Practices

### Provide Clear Default Behavior for Base Functions

```python
from functools import singledispatch

# Good practice: explicit default behavior
@singledispatch
def serialize(obj):
    """Serialize object to string"""
    # Provide meaningful default implementation or error message
    if hasattr(obj, '__dict__'):
        return str(obj.__dict__)
    raise TypeError(
        f"Cannot serialize type {type(obj).__name__}, "
        f"please use @serialize.register({type(obj).__name__}) to register a handler"
    )

# Bad practice: empty default implementation
@singledispatch
def bad_serialize(obj):
    pass  # Caller doesn't know what happened
```

### Use Type Annotations for Registration (Python 3.7+)

```python
from functools import singledispatch

@singledispatch
def process(data):
    return str(data)

# Recommended: use type annotations
@process.register
def _(data: int) -> str:
    return f"Integer: {data}"

# Not recommended: explicitly passing type (though it works)
@process.register(str)
def _(data):
    return f"String: {data}"
```

### Leverage Abstract Base Classes for Registration

```python
from functools import singledispatch
from collections.abc import Mapping, Sequence, Set

@singledispatch
def describe_collection(obj):
    return f"Unknown collection: {type(obj)}"

@describe_collection.register(Mapping)
def _(obj):
    return f"Mapping type with {len(obj)} key-value pairs"

@describe_collection.register(Sequence)
def _(obj):
    if isinstance(obj, str):  # str is also a Sequence
        return f"String with length {len(obj)}"
    return f"Sequence type with {len(obj)} elements"

@describe_collection.register(Set)
def _(obj):
    return f"Set type with {len(obj)} elements"

# Test
print(describe_collection({'a': 1}))    # Mapping type with 1 key-value pairs
print(describe_collection([1, 2, 3]))   # Sequence type with 3 elements
print(describe_collection({1, 2, 3}))   # Set type with 3 elements
print(describe_collection("hello"))     # String with length 5
```

### Maintain Consistent Function Naming

```python
from functools import singledispatch

@singledispatch
def convert(value):
    """Convert value to standard format"""
    return value

# Use _ as registered function name (convention)
@convert.register(str)
def _(value):
    return value.strip().lower()

# Or use descriptive names (helpful for debugging)
@convert.register(list)
def convert_list(value):
    return [convert(item) for item in value]

# Can get specific function via dispatch
print(convert.dispatch(list).__name__)  # convert_list
```

### Register Handlers for Third-Party Types

```python
from functools import singledispatch
import numpy as np  # Assuming numpy is installed

@singledispatch
def to_python(obj):
    """Convert various types to Python native types"""
    return obj

# Register third-party types
@to_python.register(np.ndarray)
def _(obj):
    return obj.tolist()

@to_python.register(np.integer)
def _(obj):
    return int(obj)

@to_python.register(np.floating)
def _(obj):
    return float(obj)

# This approach allows extending functionality without modifying third-party libraries
```

### Combine singledispatch with Factory Pattern

```python
from functools import singledispatch
from typing import Protocol, runtime_checkable
from abc import ABC, abstractmethod

# Define handler interface
@runtime_checkable
class Handler(Protocol):
    def handle(self, data) -> str: ...

# Handler factory
@singledispatch
def get_handler(data) -> Handler:
    """Get handler corresponding to data type"""
    return DefaultHandler()

class DefaultHandler:
    def handle(self, data) -> str:
        return f"Default handling: {data}"

class IntHandler:
    def handle(self, data: int) -> str:
        return f"Integer handling: {data * 2}"

class StrHandler:
    def handle(self, data: str) -> str:
        return f"String handling: {data.upper()}"

@get_handler.register(int)
def _(data):
    return IntHandler()

@get_handler.register(str)
def _(data):
    return StrHandler()

# Usage
def process(data):
    handler = get_handler(data)
    return handler.handle(data)

print(process(42))       # Integer handling: 84
print(process("hello"))  # String handling: HELLO
print(process([1, 2]))   # Default handling: [1, 2]
```

---

## Common Pitfalls

### Forgetting That Strings Are Also Sequences

```python
from functools import singledispatch
from collections.abc import Sequence

@singledispatch
def process(data):
    return str(data)

@process.register(Sequence)
def _(data):
    # Danger! Strings will also enter here
    return [process(item) for item in data]

# Problem: processing strings will cause infinite recursion
# process("hello")  # RecursionError!

# Solution: explicitly handle strings
@process.register(str)
def _(data):
    return data.upper()

# Or check within the Sequence handler
@process.register(Sequence)
def _(data):
    if isinstance(data, str):
        return data.upper()
    return [process(item) for item in data]
```

### Type Registration Order Issues

```python
from functools import singledispatch

@singledispatch
def handle(obj):
    return "default"

# Note: bool is a subclass of int
@handle.register(int)
def _(obj):
    return "integer"

@handle.register(bool)
def _(obj):
    return "boolean"

# Result depends on registration order and MRO
print(handle(True))   # boolean (because bool matches exactly)
print(handle(1))      # integer
```

### Cannot Dispatch Based on Multiple Arguments

```python
from functools import singledispatch

@singledispatch
def add(a, b):
    """singledispatch only checks the first argument"""
    return a + b

@add.register(str)
def _(a, b):
    return f"{a} + {b}"

# b's type doesn't affect dispatch
print(add("hello", 123))  # "hello + 123" (calls str version)
print(add(1, "world"))    # TypeError (calls default version, int + str fails)

# For multi-argument dispatch, consider third-party libraries like multipledispatch
```

### Decorator Order for singledispatchmethod

```python
from functools import singledispatchmethod

class MyClass:
    # Wrong order
    # @classmethod
    # @singledispatchmethod  # This won't work
    # def wrong_method(cls, value):
    #     pass

    # Correct order: singledispatchmethod on the outside
    @singledispatchmethod
    @classmethod
    def correct_method(cls, value):
        return "default"

    @correct_method.register(int)
    @classmethod
    def _(cls, value):
        return f"int: {value}"
```

### Side Effects of Registry Modification

```python
from functools import singledispatch

@singledispatch
def process(data):
    return "default"

# Register at module level
@process.register(int)
def _(data):
    return "int"

# Warning: subsequent registrations affect global behavior
def setup_special_processing():
    @process.register(str)
    def _(data):
        return "special string handling"

# After calling setup_special_processing(), process(str) behavior changes everywhere
# This can lead to hard-to-track bugs
```

### Type Checker Limitations

```python
from functools import singledispatch

@singledispatch
def transform(data):
    return data

@transform.register(int)
def _(data):
    return data * 2

# mypy and other type checkers may not correctly infer return type
result = transform(42)  # Type checker might think this returns Any
```

---

## Performance Considerations

### Dispatch Overhead

```python
from functools import singledispatch
import timeit

@singledispatch
def dispatch_func(x):
    return x

@dispatch_func.register(int)
def _(x):
    return x * 2

def direct_func(x):
    return x * 2

# Performance comparison
n = 1000000

dispatch_time = timeit.timeit(
    'dispatch_func(42)',
    globals={'dispatch_func': dispatch_func},
    number=n
)

direct_time = timeit.timeit(
    'direct_func(42)',
    globals={'direct_func': direct_func},
    number=n
)

print(f"singledispatch: {dispatch_time:.3f}s")
print(f"Direct call: {direct_time:.3f}s")
print(f"Overhead ratio: {dispatch_time / direct_time:.2f}x")

# Typical result: singledispatch is about 2-3x slower
# But for most application scenarios, this overhead is negligible
```

### Caching Mechanism

`singledispatch` internally caches type-to-function mappings to avoid repeated MRO lookups:

```python
from functools import singledispatch

@singledispatch
def process(data):
    return "default"

@process.register(int)
def _(data):
    return "int"

# First call to a type performs MRO lookup
process(42)  # Look up and cache

# Subsequent calls use cache
process(100)  # Get directly from cache
```

### Optimization Tips

```python
from functools import singledispatch

# Avoid using complex dispatch in hot paths
# If performance is critical, consider manual dispatch

# For frequently called types, ensure exact matches
@singledispatch
def process(data):
    pass

# Exact type matching is faster than ABC matching
@process.register(list)  # Faster than register(Sequence)
def _(data):
    pass

# Pre-fetch handler functions
handler = process.dispatch(int)
# Calling handler directly in a loop is faster than calling process each time
for item in large_int_list:
    handler(item)  # Avoid dispatch every time
```

---

## Real-World Scenarios

### Scenario 1: RESTful API Response Formatting

```python
from functools import singledispatch
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List
from enum import Enum

class ResponseStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"

@dataclass
class User:
    id: int
    name: str
    email: str
    created_at: datetime

@dataclass
class Product:
    id: int
    name: str
    price: float
    stock: int

@dataclass
class Order:
    id: int
    user_id: int
    products: List[Product]
    total: float
    created_at: datetime

@singledispatch
def format_response(data) -> Dict[str, Any]:
    """Format API response data"""
    return {"data": data}

@format_response.register(User)
def _(data: User) -> Dict[str, Any]:
    return {
        "data": {
            "id": data.id,
            "name": data.name,
            "email": data.email,
            "member_since": data.created_at.strftime("%Y-%m-%d")
        },
        "type": "user"
    }

@format_response.register(Product)
def _(data: Product) -> Dict[str, Any]:
    return {
        "data": {
            "id": data.id,
            "name": data.name,
            "price": f"${data.price:.2f}",
            "in_stock": data.stock > 0,
            "stock_level": "Abundant" if data.stock > 10 else "Low" if data.stock > 0 else "Out of Stock"
        },
        "type": "product"
    }

@format_response.register(Order)
def _(data: Order) -> Dict[str, Any]:
    return {
        "data": {
            "id": data.id,
            "user_id": data.user_id,
            "items": [format_response(p)["data"] for p in data.products],
            "total": f"${data.total:.2f}",
            "ordered_at": data.created_at.isoformat()
        },
        "type": "order"
    }

@format_response.register(list)
def _(data: list) -> Dict[str, Any]:
    return {
        "data": [format_response(item)["data"] for item in data],
        "count": len(data)
    }

@format_response.register(Exception)
def _(data: Exception) -> Dict[str, Any]:
    return {
        "error": {
            "type": type(data).__name__,
            "message": str(data)
        },
        "status": ResponseStatus.ERROR.value
    }

# Usage example
user = User(1, "John Doe", "john@example.com", datetime.now())
product = Product(101, "Python Programming Guide", 59.99, 15)

print(format_response(user))
print(format_response(product))
print(format_response([product, product]))
print(format_response(ValueError("Invalid parameter")))
```

### Scenario 2: Log Formatter

```python
from functools import singledispatch
from datetime import datetime
from typing import Any
import traceback
import json

@singledispatch
def format_log_value(value) -> str:
    """Format values in logs"""
    return repr(value)

@format_log_value.register(str)
def _(value: str) -> str:
    # Truncate overly long strings
    if len(value) > 200:
        return f'"{value[:200]}..." (truncated, total {len(value)} chars)'
    return f'"{value}"'

@format_log_value.register(bytes)
def _(value: bytes) -> str:
    if len(value) > 100:
        return f"<bytes, {len(value)} bytes>"
    return repr(value)

@format_log_value.register(dict)
def _(value: dict) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        return repr(value)

@format_log_value.register(list)
def _(value: list) -> str:
    if len(value) > 10:
        preview = [format_log_value(v) for v in value[:3]]
        return f"[{', '.join(preview)}, ... ({len(value)} items)]"
    return f"[{', '.join(format_log_value(v) for v in value)}]"

@format_log_value.register(Exception)
def _(value: Exception) -> str:
    return f"{type(value).__name__}: {value}"

@format_log_value.register(datetime)
def _(value: datetime) -> str:
    return value.isoformat()

class StructuredLogger:
    """Structured logger"""

    def __init__(self, name: str):
        self.name = name

    def _format_message(self, level: str, message: str, **context) -> str:
        timestamp = datetime.now().isoformat()
        formatted_context = {k: format_log_value(v) for k, v in context.items()}

        parts = [
            f"[{timestamp}]",
            f"[{level}]",
            f"[{self.name}]",
            message
        ]

        if formatted_context:
            context_str = " ".join(f"{k}={v}" for k, v in formatted_context.items())
            parts.append(f"| {context_str}")

        return " ".join(parts)

    def info(self, message: str, **context):
        print(self._format_message("INFO", message, **context))

    def error(self, message: str, exc: Exception = None, **context):
        if exc:
            context['exception'] = exc
        print(self._format_message("ERROR", message, **context))

# Usage example
logger = StructuredLogger("api")
logger.info("User login", user_id=123, ip="192.168.1.1")
logger.info("Processing request", data={"action": "query", "params": {"page": 1}})
logger.info("Batch processing", items=list(range(20)))
logger.error("Processing failed", exc=ValueError("Invalid input"), input_data="test")
```

### Scenario 3: Data Validation Framework

```python
from functools import singledispatch
from dataclasses import dataclass, fields
from typing import Any, List, Dict, Optional, get_type_hints
from datetime import datetime
import re

@dataclass
class ValidationError:
    field: str
    message: str
    value: Any

@singledispatch
def validate(value, field_name: str = "value") -> List[ValidationError]:
    """Validate the value"""
    return []  # Default: pass

@validate.register(str)
def _(value: str, field_name: str = "value",
      min_length: int = 0, max_length: int = float('inf'),
      pattern: str = None) -> List[ValidationError]:
    errors = []

    if len(value) < min_length:
        errors.append(ValidationError(
            field_name,
            f"Length cannot be less than {min_length}",
            value
        ))

    if len(value) > max_length:
        errors.append(ValidationError(
            field_name,
            f"Length cannot be greater than {max_length}",
            value
        ))

    if pattern and not re.match(pattern, value):
        errors.append(ValidationError(
            field_name,
            f"Format does not match: {pattern}",
            value
        ))

    return errors

@validate.register(int)
@validate.register(float)
def _(value, field_name: str = "value",
      min_value: float = float('-inf'),
      max_value: float = float('inf')) -> List[ValidationError]:
    errors = []

    if value < min_value:
        errors.append(ValidationError(
            field_name,
            f"Value cannot be less than {min_value}",
            value
        ))

    if value > max_value:
        errors.append(ValidationError(
            field_name,
            f"Value cannot be greater than {max_value}",
            value
        ))

    return errors

@validate.register(list)
def _(value: list, field_name: str = "value",
      min_items: int = 0, max_items: int = float('inf'),
      item_validator=None) -> List[ValidationError]:
    errors = []

    if len(value) < min_items:
        errors.append(ValidationError(
            field_name,
            f"At least {min_items} elements required",
            value
        ))

    if len(value) > max_items:
        errors.append(ValidationError(
            field_name,
            f"At most {max_items} elements allowed",
            value
        ))

    if item_validator:
        for i, item in enumerate(value):
            item_errors = item_validator(item, f"{field_name}[{i}]")
            errors.extend(item_errors)

    return errors

# Validate dataclass
def validate_dataclass(obj) -> List[ValidationError]:
    """Validate dataclass object"""
    errors = []

    for field in fields(obj):
        value = getattr(obj, field.name)
        field_errors = validate(value, field.name)
        errors.extend(field_errors)

    return errors

# Usage example
@dataclass
class UserRegistration:
    username: str
    email: str
    age: int
    tags: List[str]

# Create validation rules
def validate_user(user: UserRegistration) -> List[ValidationError]:
    errors = []

    # Validate username
    errors.extend(validate(
        user.username,
        "username",
        min_length=3,
        max_length=20,
        pattern=r'^[a-zA-Z0-9_]+$'
    ))

    # Validate email
    errors.extend(validate(
        user.email,
        "email",
        pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$'
    ))

    # Validate age
    errors.extend(validate(
        user.age,
        "age",
        min_value=0,
        max_value=150
    ))

    # Validate tags
    errors.extend(validate(
        user.tags,
        "tags",
        min_items=1,
        max_items=5
    ))

    return errors

# Test
user1 = UserRegistration("ab", "invalid-email", -5, [])
errors = validate_user(user1)
for error in errors:
    print(f"Field '{error.field}': {error.message}")
```

---

## Interview Key Points

### What is singledispatch? What problem does it solve?

**Reference Answer:**

`singledispatch` is Python's single-dispatch generic function decorator. It automatically selects the corresponding implementation based on the type of the function's first argument.

Problems it solves:
- Avoids large amounts of `if-elif-else` type checking
- Provides cleaner code organization (each type's handling logic is independent)
- Supports the Open-Closed Principle (can extend new type handling without modifying the original function)
- Provides capabilities similar to function overloading in other languages

### What's the difference between singledispatch and traditional isinstance checking?

**Reference Answer:**

| Aspect | isinstance checking | singledispatch |
|--------|---------------------|----------------|
| Code organization | Centralized in one function | Distributed across multiple registered functions |
| Extensibility | Requires modifying original function | Only need to add new registration |
| Readability | Long functions are hard to maintain | Each implementation is independent and clear |
| MRO support | Requires manual handling | Automatically searches by MRO |
| Third-party types | Requires modifying original code | Can register externally |

### How does singledispatch handle inheritance relationships?

**Reference Answer:**

`singledispatch` searches for the best matching type according to MRO (Method Resolution Order):

```python
@singledispatch
def process(data):
    return "object"

@process.register(int)
def _(data):
    return "int"

# bool is a subclass of int
print(process(True))  # If bool is not registered, calls the int implementation
```

Priority: Exact type match > Closer type in MRO > Base function

### What's the difference between singledispatch and singledispatchmethod?

**Reference Answer:**

- `singledispatch`: For regular functions, dispatches based on the first argument
- `singledispatchmethod`: For class methods, dispatches based on the first non-self/cls argument

```python
from functools import singledispatch, singledispatchmethod

# Function version
@singledispatch
def process(data):
    pass

# Method version
class Processor:
    @singledispatchmethod
    def process(self, data):  # self doesn't participate in dispatch
        pass
```

### How do you view and debug the singledispatch registry?

**Reference Answer:**

```python
@singledispatch
def func(data):
    pass

@func.register(int)
def _(data):
    pass

# View all registered types
print(func.registry.keys())

# Get the handler function for a specific type
handler = func.dispatch(int)

# Call a specific implementation directly (bypassing dispatch)
handler(42)
```

### What performance impact does singledispatch have? How can it be optimized?

**Reference Answer:**

Performance impact:
- Dispatch itself has some overhead (type lookup, cache checking)
- About 2-3x slower than direct function calls

Optimization methods:
- For hot paths, pre-fetch handler functions: `handler = func.dispatch(int)`
- Use exact type registration rather than abstract base classes
- If performance is critical, consider manual dispatch or other approaches

### Can singledispatch handle Union types?

**Reference Answer:**

Cannot handle Union types directly; you need to register them separately:

```python
from typing import Union

@singledispatch
def process(data):
    pass

# Wrong: Union not supported
# @process.register(Union[int, str])

# Correct: register separately
@process.register(int)
@process.register(str)
def _(data):
    pass
```

---

## Further Reading

### Official Documentation

- [functools.singledispatch Official Documentation](https://docs.python.org/3/library/functools.html#functools.singledispatch)
- [PEP 443 - Single-dispatch generic functions](https://peps.python.org/pep-0443/)

### Related PEPs

- [PEP 443](https://peps.python.org/pep-0443/) - Design document for singledispatch
- [PEP 3124](https://peps.python.org/pep-3124/) - Rejected multiple dispatch proposal (understand design trade-offs)

### Third-Party Libraries

- [multipledispatch](https://github.com/mrocklin/multipledispatch) - Supports multi-argument dispatch
- [plum](https://github.com/beartype/plum) - More powerful multiple dispatch library with type annotation support

### Recommended Books

- "Fluent Python" 2nd Edition - Chapter 9 covers function decorators and closures in detail
- "Python Cookbook" 3rd Edition - Multiple decorator and metaprogramming techniques

### Related Concepts

- **Visitor Pattern** - singledispatch is its Pythonic implementation
- **Double Dispatch** - A more complex dispatch mechanism than single dispatch
- **Polymorphism** - singledispatch provides function-level polymorphism
