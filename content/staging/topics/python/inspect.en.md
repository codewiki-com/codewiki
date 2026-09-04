---
title: "Python Inspect Module: Examining Live Objects"
description: "Master the Python inspect module for introspection: examine functions, classes, modules, source code, signatures, and debug stack frames"
track: python
section: stdlib
difficulty: advanced
tags:
  - inspect
  - introspection
  - reflection
  - debugging
  - metaprogramming
  - runtime analysis
status: imported
origin: old/src/content/docs/python/inspect.en.md
divergence: 0.305
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

The `inspect` module is Python's powerful tool for runtime introspection - the ability to examine live objects, their attributes, source code, and call signatures. While powerful, it's often overlooked by Python developers. This comprehensive guide explores the inspect module's capabilities, from basic object examination to advanced debugging and metaprogramming techniques.

## Concept Explanation

Introspection is the ability of a program to examine the characteristics of objects at runtime. The `inspect` module provides functions to query information about live Python objects: functions, methods, classes, modules, and more.

Unlike compiled languages where type information is determined at compile time, Python's dynamic nature means much of this information is available only at runtime. The `inspect` module bridges this gap, letting you:

- **Examine object properties**: Get details about functions, classes, methods, and modules
- **Extract source code**: Retrieve and parse the source code of Python objects
- **Analyze call signatures**: Understand what parameters a function accepts
- **Debug stack traces**: Examine the call stack and frame objects
- **Discover object members**: Find all attributes, methods, and properties of objects

This capability is essential for building:
- **Debugging tools**: Understand what's happening in your code
- **Documentation systems**: Auto-generate documentation from code
- **Framework libraries**: Build metaprogramming-based frameworks
- **Testing frameworks**: Discover and introspect test cases
- **API servers**: Automatically expose functions as endpoints

## Core Principles

### Object Introspection

Every Python object is introspectable. The inspect module works by querying the object's attributes, which Python stores in the `__dict__` attribute and via the descriptor protocol.

### Source Code Availability

Python source code is preserved at runtime (unless the `.pyc` file is used), allowing the inspect module to retrieve and display it.

### Stack Inspection

Python maintains a call stack accessible through frame objects. The inspect module provides safe access to these frames for debugging purposes.

### Type Checking

The module provides robust type checking functions that go beyond `isinstance()` and `type()`, distinguishing between functions, methods, generators, coroutines, and more.

### Signature Binding

Through `inspect.Signature`, you can understand and bind arguments to function parameters, enabling dynamic function calls.

## Key Points

1. **Introspection is powerful but can be slow** - Cache results when possible
2. **Source code might not be available** - Handle OSError gracefully
3. **Private attributes exist for a reason** - Respect encapsulation while introspecting
4. **Stack inspection affects performance** - Use sparingly in production code
5. **Introspection enables metaprogramming** - But make code readable and maintainable
6. **Different object types require different approaches** - Functions, classes, methods differ
7. **Signature binding is safer than eval()** - Always prefer it for dynamic calls
8. **Documentation strings can be introspected** - Leverage docstrings for auto-documentation
9. **Decorators affect introspection** - Use functools.wraps to preserve metadata
10. **Thread safety matters** - Frame objects are thread-local

## Code Examples

### Basic Object Introspection

```python
import inspect
from typing import Optional

# Define a sample class
class DataProcessor:
    """A class for processing data."""

    def __init__(self, name: str, version: int = 1):
        """Initialize the processor.

        Args:
            name: The processor name
            version: Protocol version
        """
        self.name = name
        self.version = version

    def process(self, data: list) -> dict:
        """Process input data."""
        return {"input": data, "status": "processed"}

    @staticmethod
    def validate(data):
        """Validate data."""
        return isinstance(data, list)

    @classmethod
    def from_config(cls, config: dict):
        """Create from configuration."""
        return cls(config['name'], config.get('version', 1))


# Basic introspection
def introspect_object(obj):
    """Basic introspection of any object."""
    print(f"Object: {obj}")
    print(f"Type: {type(obj)}")
    print(f"Module: {inspect.getmodule(obj)}")
    print(f"File: {inspect.getfile(type(obj))}")
    print(f"Is class: {inspect.isclass(obj)}")
    print(f"Is module: {inspect.ismodule(obj)}")
    print(f"Is function: {inspect.isfunction(obj)}")
    print(f"Is method: {inspect.ismethod(obj)}")
    print(f"Is builtin: {inspect.isbuiltin(obj)}")
    print()

# Introspect the class
introspect_object(DataProcessor)

# Introspect an instance
processor = DataProcessor("MyProcessor", version=2)
introspect_object(processor)

# Introspect a method
introspect_object(processor.process)
```

### Examining Function Signatures

```python
import inspect
from typing import Optional, List

def complex_function(
    name: str,
    age: int = 25,
    tags: Optional[List[str]] = None,
    *args: str,
    verbose: bool = False,
    **kwargs
) -> dict:
    """
    A complex function with various parameter types.

    Args:
        name: Person's name
        age: Person's age
        tags: List of tags
        *args: Additional string arguments
        verbose: Enable verbose output
        **kwargs: Additional keyword arguments

    Returns:
        A dictionary with the processed parameters
    """
    return {
        "name": name,
        "age": age,
        "tags": tags or [],
        "args": args,
        "verbose": verbose,
        "kwargs": kwargs
    }

# Get the signature
sig = inspect.signature(complex_function)

print(f"Signature: {sig}")
print(f"Return annotation: {sig.return_annotation}")
print()

# Iterate over parameters
print("Parameters:")
for param_name, param in sig.parameters.items():
    print(f"  {param_name}:")
    print(f"    Kind: {param.kind}")
    print(f"    Default: {param.default}")
    print(f"    Annotation: {param.annotation}")
```

### Examining Classes and Their Members

```python
import inspect

class Animal:
    """Base animal class."""
    species = "Unknown"

    def __init__(self, name: str):
        self.name = name

    def speak(self):
        """Make a sound."""
        return "Some sound"

class Dog(Animal):
    """A dog class."""
    species = "Canis familiaris"

    def __init__(self, name: str, breed: str):
        super().__init__(name)
        self.breed = breed

    def speak(self):
        """Dogs bark."""
        return "Woof!"

    def fetch(self, item):
        """Fetch an item."""
        return f"{self.name} fetched {item}"


def examine_class(cls):
    """Examine a class in detail."""
    print(f"Class: {cls.__name__}")
    print(f"Bases: {inspect.getmro(cls)}")
    print()

    # Get all members
    print("All Members:")
    for name, member in inspect.getmembers(cls):
        if not name.startswith('_'):
            print(f"  {name}: {type(member).__name__}")
    print()

    # Get methods only
    print("Methods:")
    for name, method in inspect.getmembers(cls, inspect.ismethod):
        print(f"  {name}")
    for name, method in inspect.getmembers(cls, inspect.isfunction):
        print(f"  {name}")

examine_class(Dog)
```

### Getting Source Code

```python
import inspect

def example_function(x, y):
    """Add two numbers."""
    return x + y

class Calculator:
    """Simple calculator."""

    def add(self, a, b):
        """Add two numbers."""
        return a + b

    def multiply(self, a, b):
        """Multiply two numbers."""
        return a * b


# Get source code of a function
print("Function source:")
print(inspect.getsource(example_function))
print()

# Get source code of a method
print("Method source:")
print(inspect.getsource(Calculator.add))
print()

# Get source code of entire class
print("Class source:")
print(inspect.getsource(Calculator))


# Safer source code retrieval
def safe_get_source(obj, default="Source not available"):
    """Safely get source code with a fallback."""
    try:
        return inspect.getsource(obj)
    except (OSError, TypeError):
        return default

source = safe_get_source(example_function)
print(f"Safe retrieval: {source[:50]}...")
```

### Examining Function Behavior

```python
import inspect

def is_generator_function(func):
    """Check if function is a generator."""
    return inspect.isgeneratorfunction(func)

def is_async_function(func):
    """Check if function is async."""
    return inspect.iscoroutinefunction(func)

# Examples
def regular_function():
    return 42

def generator_func():
    yield 1
    yield 2

async def async_func():
    return "async result"

class MyClass:
    def method(self):
        pass

    @staticmethod
    def static_method():
        pass

    @classmethod
    def class_method(cls):
        pass


# Test these
print(f"regular_function is generator: {is_generator_function(regular_function)}")
print(f"generator_func is generator: {is_generator_function(generator_func)}")
print(f"async_func is coroutine: {is_async_function(async_func)}")

# Get argument count
def func_with_args(a, b, c=10, *args, **kwargs):
    pass

sig = inspect.signature(func_with_args)
print(f"Function: {func_with_args.__name__}")
print(f"Signature: {sig}")
```

### Stack and Frame Inspection for Debugging

```python
import inspect

def get_caller_info():
    """Get information about the caller."""
    frame = inspect.currentframe()
    try:
        caller_frame = frame.f_back
        caller_locals = caller_frame.f_locals

        return {
            'function': caller_frame.f_code.co_name,
            'filename': caller_frame.f_code.co_filename,
            'line_number': caller_frame.f_lineno,
            'line_code': inspect.getframeinfo(caller_frame).code_context,
            'locals': caller_locals,
        }
    finally:
        del frame

def examine_stack():
    """Examine the call stack."""
    print("Stack trace:")
    for frame_detail in inspect.stack():
        print(f"  {frame_detail.filename}:{frame_detail.lineno} in {frame_detail.function}")
        if frame_detail.index < 3:
            if frame_detail.code_context:
                print(f"    Code: {frame_detail.code_context[0].strip()}")

examine_stack()
```

### Signature Binding and Parameter Validation

```python
import inspect
from typing import Any, Callable

def validate_and_call(func: Callable, *args, **kwargs):
    """
    Validate arguments and call function safely.
    """
    sig = inspect.signature(func)

    try:
        # Bind arguments to parameters
        bound_args = sig.bind(*args, **kwargs)
        # Apply any defaults
        bound_args.apply_defaults()

        print(f"Calling: {func.__name__}")
        print(f"Bound arguments: {bound_args.arguments}")

        # Call the function with validated arguments
        result = func(*args, **kwargs)
        return result
    except TypeError as e:
        print(f"Error binding arguments: {e}")
        print(f"Expected signature: {sig}")
        return None


def example_func(name: str, age: int = 25, **kwargs):
    """Example function."""
    return {
        "name": name,
        "age": age,
        "extra": kwargs
    }

# Valid calls
print("Valid call:")
result = validate_and_call(example_func, "Alice", 30, city="New York")
print(f"Result: {result}\n")

# Invalid call (missing required argument)
print("Invalid call (missing required argument):")
result = validate_and_call(example_func, age=30)
```

### Building an Auto-Documentation System

```python
import inspect
from typing import Any

def generate_documentation(obj: Any) -> str:
    """
    Generate documentation for a Python object.
    Supports functions, classes, and modules.
    """
    doc_lines = []

    if inspect.isclass(obj):
        doc_lines.append(_document_class(obj))
    elif inspect.isfunction(obj) or inspect.ismethod(obj):
        doc_lines.append(_document_function(obj))
    elif inspect.ismodule(obj):
        doc_lines.append(_document_module(obj))
    else:
        doc_lines.append(f"Unsupported object type: {type(obj)}")

    return "\n".join(doc_lines)


def _document_function(func) -> str:
    """Document a function."""
    lines = []
    lines.append(f"## Function: {func.__name__}")
    lines.append("")

    # Docstring
    if func.__doc__:
        lines.append(func.__doc__.strip())
    else:
        lines.append("No documentation available.")

    lines.append("")
    lines.append("### Signature")
    lines.append(f"```python")
    lines.append(f"{func.__name__}{inspect.signature(func)}")
    lines.append("```")

    # Parameters
    sig = inspect.signature(func)
    if sig.parameters:
        lines.append("### Parameters")
        for param_name, param in sig.parameters.items():
            annotation = param.annotation if param.annotation != inspect.Parameter.empty else "Any"
            default = f" = {param.default}" if param.default != inspect.Parameter.empty else ""
            lines.append(f"- `{param_name}: {annotation}`{default}")

    return "\n".join(lines)


def _document_class(cls) -> str:
    """Document a class."""
    lines = []
    lines.append(f"## Class: {cls.__name__}")
    lines.append("")

    # Class docstring
    if cls.__doc__:
        lines.append(cls.__doc__.strip())
    lines.append("")

    # Base classes
    bases = [base.__name__ for base in cls.__bases__ if base != object]
    if bases:
        lines.append(f"**Inherits from:** {', '.join(bases)}")
        lines.append("")

    # Methods
    methods = inspect.getmembers(cls, predicate=inspect.isfunction)
    if methods:
        lines.append("### Methods")
        for method_name, method in methods:
            if not method_name.startswith('_'):
                sig = inspect.signature(method)
                lines.append(f"- `{method_name}{sig}`")

    return "\n".join(lines)


def _document_module(mod) -> str:
    """Document a module."""
    lines = []
    lines.append(f"## Module: {mod.__name__}")
    if mod.__doc__:
        lines.append(mod.__doc__.strip())
    return "\n".join(lines)


# Example usage
class DataAnalyzer:
    """Analyze data from various sources."""

    def __init__(self, name: str, version: int = 1):
        """Initialize the analyzer."""
        self.name = name
        self.version = version

    def analyze(self, data: list) -> dict:
        """Analyze the provided data."""
        return {"count": len(data), "mean": sum(data) / len(data)}


# Generate documentation
doc = generate_documentation(DataAnalyzer)
print(doc)
```


## Best Practices

### Always Handle Missing Source Code

```python
import inspect

def safe_get_source(obj):
    """Safely retrieve source code with proper error handling."""
    try:
        return inspect.getsource(obj)
    except OSError:
        # Source might not be available for built-in objects
        return None
    except TypeError:
        # Object might not be a valid source-bearing object
        return None

# Use it
source = safe_get_source(list.append)
print(f"Source available: {source is not None}")
```

### Cache Introspection Results in Performance-Critical Code

```python
from functools import lru_cache
import inspect

@lru_cache(maxsize=128)
def get_function_params(func):
    """Cache parameter inspection."""
    sig = inspect.signature(func)
    return list(sig.parameters.keys())

# This will be cached
params1 = get_function_params(dict.get)
params2 = get_function_params(dict.get)  # Cached lookup
```

### Preserve Function Metadata with functools.wraps

```python
import inspect
from functools import wraps

def timing_decorator(func):
    """Decorator that times function execution."""
    @wraps(func)  # Preserves __name__, __doc__, and other metadata
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"Execution time: {elapsed:.4f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    """This docstring is preserved."""
    import time
    time.sleep(0.1)

# Without @wraps, func.__name__ would be 'wrapper'
sig = inspect.signature(slow_function)
print(f"Function name: {slow_function.__name__}")
print(f"Docstring: {slow_function.__doc__}")
```

### Use Type Annotations to Enhance Introspection

```python
import inspect
from typing import List, Optional, Dict, Any

def well_documented_function(
    items: List[int],
    name: str,
    config: Optional[Dict[str, Any]] = None
) -> bool:
    """Properly annotated function."""
    return True

# Type hints make introspection much more useful
sig = inspect.signature(well_documented_function)
for param_name, param in sig.parameters.items():
    print(f"{param_name}: {param.annotation}")
```

### Use Signature Binding Instead of String Parsing

```python
import inspect

def dynamic_call(func, *args, **kwargs):
    """Call a function with flexible argument handling."""
    sig = inspect.signature(func)

    try:
        # Safe way: bind and validate arguments
        bound_args = sig.bind(*args, **kwargs)
        bound_args.apply_defaults()
        return func(*bound_args.args, **bound_args.kwargs)
    except TypeError as e:
        # Proper error handling
        print(f"Invalid arguments: {e}")
        return None
```

## Common Pitfalls

### Assuming Source Code is Always Available

**Problem:**
```python
import inspect

# This will fail for built-in objects
try:
    source = inspect.getsource(len)
except OSError as e:
    print(f"Error: {e}")  # 'len' is a built-in function
```

**Solution:**
```python
import inspect

def get_source_safely(obj, default="Source not available"):
    """Safely get source with fallback."""
    try:
        return inspect.getsource(obj)
    except (OSError, TypeError):
        return default

source = get_source_safely(len)
print(source)
```

### Breaking Decorator Chains

**Problem:**
```python
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    # Missing @functools.wraps causes metadata loss
    return wrapper

@bad_decorator
def my_function():
    """Original docstring."""
    pass

# Function metadata is lost
print(my_function.__name__)  # Prints 'wrapper', not 'my_function'
```

**Solution:**
```python
from functools import wraps

def good_decorator(func):
    @wraps(func)  # Preserves metadata
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### Not Handling Parameter Binding Errors

**Problem:**
```python
import inspect

def func(a, b, c=10):
    return a + b + c

sig = inspect.signature(func)

# This will fail without error handling
try:
    bound = sig.bind(1)  # Missing required parameter 'b'
except TypeError as e:
    print(f"Binding error: {e}")
```

**Solution:**
```python
import inspect

def safe_bind(func, *args, **kwargs):
    """Safely bind arguments with error handling."""
    sig = inspect.signature(func)
    try:
        bound = sig.bind(*args, **kwargs)
        bound.apply_defaults()
        return bound
    except TypeError as e:
        print(f"Invalid arguments for {func.__name__}: {e}")
        return None
```

### Misunderstanding Method Types

**Problem:**
```python
import inspect

class MyClass:
    def method(self):
        pass

# This is confusing
print(inspect.isfunction(MyClass.method))  # True (unbound)
print(inspect.isfunction(MyClass().method))  # False (bound method)
```

**Solution:**
```python
import inspect

def is_callable_member(obj, name):
    """Check if object has a callable member."""
    member = getattr(obj, name, None)
    return callable(member)

class MyClass:
    def method(self):
        pass

obj = MyClass()
print(is_callable_member(obj, 'method'))  # True
```

## Performance Considerations

### Introspection Speed Comparison

```python
import inspect
import time

def benchmark_introspection():
    """Benchmark various introspection operations."""

    def sample_func(a, b, c=10):
        return a + b + c

    class SampleClass:
        def method(self):
            pass

    benchmarks = {}

    # Measure signature inspection
    start = time.time()
    for _ in range(10000):
        inspect.signature(sample_func)
    benchmarks['signature'] = time.time() - start

    # Measure getsource (skip for built-ins)
    start = time.time()
    for _ in range(100):
        try:
            inspect.getsource(sample_func)
        except:
            pass
    benchmarks['getsource'] = (time.time() - start) * 100

    # Measure getmembers
    start = time.time()
    for _ in range(1000):
        inspect.getmembers(SampleClass)
    benchmarks['getmembers'] = time.time() - start

    # Measure isinstance checks
    start = time.time()
    for _ in range(100000):
        inspect.isfunction(sample_func)
    benchmarks['isfunction'] = time.time() - start

    print("Introspection Performance (10k iterations unless noted):")
    for name, elapsed in benchmarks.items():
        print(f"  {name:20s}: {elapsed*1000000/10000:.2f} us per call")

benchmark_introspection()
```

### Stack Inspection Overhead

```python
import inspect
import time

def measure_stack_overhead():
    """Measure the cost of stack inspection."""

    def get_stack():
        return inspect.stack()

    # Measure stack inspection
    start = time.time()
    for _ in range(1000):
        stack = get_stack()
    stack_time = time.time() - start

    print(f"Stack inspection: {stack_time*1000:.2f} ms for 1000 calls")
    print("Note: Stack inspection is expensive - use sparingly in hot paths")

measure_stack_overhead()
```

## Real-world Scenarios

### Auto-Documentation System for APIs

```python
import inspect
from typing import Any, Dict

class APIDocumentationGenerator:
    """Generate documentation from Python objects."""

    def __init__(self):
        self.docs = []

    def document_function(self, func, tag: str = None) -> dict:
        """Generate API documentation for a function."""
        sig = inspect.signature(func)

        doc = {
            'name': func.__name__,
            'signature': str(sig),
            'description': inspect.getdoc(func),
            'parameters': {},
            'returns': sig.return_annotation if sig.return_annotation != inspect.Signature.empty else None,
            'tag': tag
        }

        for param_name, param in sig.parameters.items():
            doc['parameters'][param_name] = {
                'type': str(param.annotation) if param.annotation != inspect.Parameter.empty else 'Any',
                'default': param.default if param.default != inspect.Parameter.empty else None,
                'kind': param.kind.name
            }

        self.docs.append(doc)
        return doc

    def generate_markdown(self) -> str:
        """Generate markdown documentation."""
        lines = ["# API Documentation\n"]

        for doc in self.docs:
            lines.append(f"## {doc['name']}")
            if doc['tag']:
                lines.append(f"**Tags:** {doc['tag']}\n")

            lines.append(f"```python")
            lines.append(f"{doc['name']}{doc['signature']}")
            lines.append(f"```\n")

            if doc['description']:
                lines.append(doc['description'] + "\n")

            if doc['parameters']:
                lines.append("### Parameters\n")
                for param_name, param_info in doc['parameters'].items():
                    lines.append(f"- **{param_name}** ({param_info['type']})")
                    if param_info['default'] is not None:
                        lines.append(f"  Default: {param_info['default']}")
                    lines.append("")

        return "\n".join(lines)


# Example API functions
def get_user(user_id: int) -> Dict[str, Any]:
    """Retrieve a user by ID."""
    pass

def create_user(name: str, email: str, age: int = None) -> bool:
    """Create a new user."""
    pass

# Generate documentation
gen = APIDocumentationGenerator()
gen.document_function(get_user, tag='users')
gen.document_function(create_user, tag='users')

docs = gen.generate_markdown()
print(docs)
```

### Test Framework for Automatic Test Discovery

```python
import inspect
from typing import Callable, List

class TestFramework:
    """Simple test framework using introspection."""

    def __init__(self):
        self.tests: List[Callable] = []
        self.results = []

    def discover_tests(self, module_or_class):
        """Auto-discover test methods."""
        if inspect.isclass(module_or_class):
            return self._discover_from_class(module_or_class)
        elif inspect.ismodule(module_or_class):
            return self._discover_from_module(module_or_class)

    def _discover_from_class(self, cls):
        """Discover test methods in a class."""
        for name, method in inspect.getmembers(cls, inspect.isfunction):
            if name.startswith('test_'):
                self.tests.append((name, method, cls))

    def _discover_from_module(self, module):
        """Discover test functions in a module."""
        for name, obj in inspect.getmembers(module):
            if inspect.isfunction(obj) and name.startswith('test_'):
                self.tests.append((name, obj, None))

    def run_tests(self):
        """Run all discovered tests."""
        for test_name, test_func, test_class in self.tests:
            try:
                if test_class:
                    instance = test_class()
                    test_func(instance)
                else:
                    test_func()
                self.results.append((test_name, 'PASSED', None))
                print(f"OK {test_name}")
            except AssertionError as e:
                self.results.append((test_name, 'FAILED', str(e)))
                print(f"FAIL {test_name}: {e}")
            except Exception as e:
                self.results.append((test_name, 'ERROR', str(e)))
                print(f"ERROR {test_name}: {e}")

    def report(self):
        """Generate test report."""
        passed = len([r for r in self.results if r[1] == 'PASSED'])
        failed = len([r for r in self.results if r[1] == 'FAILED'])
        errors = len([r for r in self.results if r[1] == 'ERROR'])

        print(f"\n{'='*50}")
        print(f"Tests run: {len(self.results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Errors: {errors}")


# Example test class
class TestCalculator:
    def test_addition(self):
        assert 2 + 2 == 4

    def test_subtraction(self):
        assert 5 - 3 == 2

    def test_multiplication(self):
        assert 3 * 4 == 12


# Run tests
framework = TestFramework()
framework.discover_tests(TestCalculator)
framework.run_tests()
framework.report()
```

## Interview Points

### Common Interview Questions

**Q: What is the difference between ismethod() and isfunction()?**

A:
- isfunction() returns True for unbound functions (including methods on a class)
- ismethod() returns True only for bound methods (methods called on an instance)

```python
import inspect

class MyClass:
    def method(self):
        pass

print(inspect.isfunction(MyClass.method))  # True (unbound)
print(inspect.ismethod(MyClass.method))    # False

obj = MyClass()
print(inspect.isfunction(obj.method))      # False
print(inspect.ismethod(obj.method))        # True (bound)
```

**Q: How would you dynamically call a function with correct arguments?**

A: Use inspect.signature() and bind arguments:

```python
import inspect

def dynamic_call(func, *args, **kwargs):
    sig = inspect.signature(func)
    bound_args = sig.bind(*args, **kwargs)
    bound_args.apply_defaults()
    return func(*bound_args.args, **bound_args.kwargs)
```

**Q: What are the performance implications of using inspect?**

A:
- inspect.signature() is relatively fast (microseconds)
- inspect.getsource() is expensive (milliseconds) due to file I/O
- inspect.stack() is very expensive (multiple milliseconds)
- Cache results when called frequently

**Q: How would you extract type hints from a function?**

A: Use inspect.signature() to access parameter annotations:

```python
import inspect

def func(name: str, age: int) -> bool:
    return True

sig = inspect.signature(func)
for param_name, param in sig.parameters.items():
    print(f"{param_name}: {param.annotation}")
print(f"Returns: {sig.return_annotation}")
```

### Problem-Solving Scenarios

**Scenario 1: Implement a decorator that validates function arguments**

```python
import inspect
from functools import wraps

def validate_types(func):
    """Decorator that validates function arguments against type hints."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        sig = inspect.signature(func)
        bound_args = sig.bind(*args, **kwargs)

        for param_name, param_value in bound_args.arguments.items():
            param = sig.parameters[param_name]
            if param.annotation != inspect.Parameter.empty:
                if not isinstance(param_value, param.annotation):
                    raise TypeError(
                        f"{param_name} must be {param.annotation}, "
                        f"got {type(param_value)}"
                    )

        return func(*args, **kwargs)

    return wrapper

@validate_types
def greet(name: str, age: int) -> str:
    return f"Hello {name}, age {age}"

# Works
print(greet("Alice", 30))

# Fails
# greet("Bob", "not an age")
```

## Summary

The `inspect` module is a powerful tool for understanding Python's runtime behavior. Key takeaways:

1. **Introspection enables metaprogramming** - Build flexible frameworks that work with any Python object
2. **Signatures are queryable** - Use inspect.signature() for safe argument handling
3. **Source code is accessible** - Document and understand code at runtime
4. **Performance matters** - Cache introspection results in critical paths
5. **Safety first** - Always handle exceptions when accessing source or frames
6. **Preserve metadata** - Use functools.wraps in decorators
7. **Type hints enhance introspection** - Use annotations for clearer code

Master the inspect module and you'll unlock powerful capabilities for building better debugging tools, frameworks, and automated systems in Python.

## Further Reading

### Official Documentation
- Python inspect module: https://docs.python.org/3/library/inspect.html
- PEP 362 - Function Signature Object: https://www.python.org/dev/peps/pep-0362/

### Related Topics
- Decorators and functools - Use functools.wraps to preserve metadata
- Type hints and typing module - Enhance introspection with annotations
- AST module - For deeper source code analysis
- Metaclasses - For more advanced metaprogramming
- importlib - For dynamic module loading

### Practical Applications
- FastAPI uses introspection for API documentation
- Pydantic uses type hints for data validation
- unittest uses introspection to discover tests
- Django ORM introspects models
- Sphinx generates docs from docstrings
