---
title: "Python *args and **kwargs: Flexible Function Arguments"
description: Master flexible function arguments in Python using *args and **kwargs for cleaner, more adaptable code
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - function arguments
  - "*args"
  - "**kwargs"
  - variable arguments
  - unpacking
  - function design
status: imported
origin: old/src/content/docs/python/args-kwargs.en.md
divergence: 0.131
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

Functions that accept a variable number of arguments are one of Python's most powerful and elegant features. The `*args` and `**kwargs` parameters allow you to write flexible functions that can handle different numbers and types of arguments, enabling cleaner APIs and more reusable code. This comprehensive guide covers everything you need to know about these versatile features.

## Concept Explanation

### What are *args and **kwargs?

`*args` and `**kwargs` are special syntax elements that allow Python functions to accept an arbitrary number of arguments:

- **`*args`** (non-keyword arguments): Allows a function to accept any number of positional arguments, packed into a tuple
- **`**kwargs`** (keyword arguments): Allows a function to accept any number of named arguments, packed into a dictionary

These are not magic variables with special names—you could technically use `*numbers` or `**options` instead. However, the convention `*args` and `**kwargs` is universally followed in Python, making code more readable and predictable.

### Why Use Flexible Arguments?

Flexible arguments solve several common problems:

1. **Unknown number of inputs**: Functions that aggregate or process variable numbers of items
2. **API flexibility**: Design functions that users can call in multiple ways
3. **Wrapper functions**: Create decorators and middleware that forward arguments transparently
4. **Configuration flexibility**: Accept optional settings without explicitly listing them all
5. **Code reusability**: Write functions that adapt to different use cases

### The Unpacking Mechanism

When you call a function with `*args` or `**kwargs`:

```python
def greet(*args, **kwargs):
    print(f"args: {args}")      # tuple of positional arguments
    print(f"kwargs: {kwargs}")   # dict of keyword arguments

greet(1, 2, 3, name="Alice", age=30)
# Output:
# args: (1, 2, 3)
# kwargs: {'name': 'Alice', 'age': 30}
```

## Core Principles

### Principle 1: *args Creates a Tuple

The asterisk in `*args` tells Python to collect all positional arguments into a single tuple:

```python
def multiply(*args):
    """Calculate the product of all arguments"""
    result = 1
    for num in args:
        result *= num
    return result

print(multiply(2, 3, 4))      # Output: 24
print(multiply(5))             # Output: 5
print(multiply())              # Output: 1
```

**Key insight**: When the function is defined with `*args`, Python automatically groups positional arguments into a tuple named `args`.

### Principle 2: **kwargs Creates a Dictionary

The double asterisk in `**kwargs` tells Python to collect all keyword arguments into a single dictionary:

```python
def print_config(**kwargs):
    """Print configuration parameters"""
    for key, value in kwargs.items():
        print(f"{key} = {value}")

print_config(host="localhost", port=8080, debug=True)
# Output:
# host = localhost
# port = 8080
# debug = True
```

**Key insight**: The keys in the dictionary correspond exactly to the parameter names passed.

### Principle 3: Parameter Order Matters

When combining regular parameters with `*args` and `**kwargs`, the order is fixed:

```python
def function(required, *args, **kwargs):
    pass

# Valid order:
# Required positional parameters
# *args (variable positional arguments)
# **kwargs (variable keyword arguments)

# This is INVALID:
# def function(*args, required):  # SyntaxError!
#     pass
```

### Principle 4: Unpacking Works Both Ways

You can use `*` and `**` when calling functions to unpack sequences and dictionaries:

```python
def add(a, b, c):
    return a + b + c

numbers = [1, 2, 3]
print(add(*numbers))  # Unpacks list to positional arguments
# Output: 6

config = {'a': 10, 'b': 20, 'c': 30}
print(add(**config))  # Unpacks dict to keyword arguments
# Output: 60
```

## Key Points

### Key Point 1: *args Must Come Before **kwargs

When both are used, `*args` must precede `**kwargs`:

```python
# Correct
def func(a, *args, **kwargs):
    pass

# Incorrect - SyntaxError
# def func(a, **kwargs, *args):
#     pass
```

### Key Point 2: You Can Use Regular Parameters with *args

Mix required parameters with variable arguments:

```python
def format_message(title, *items, **options):
    """Format a message with title and items"""
    separator = options.get('separator', ', ')
    prefix = options.get('prefix', '')

    message = f"{prefix}{title}:\n"
    for item in items:
        message += f"  - {item}\n"
    return message

print(format_message(
    "Tasks",
    "Read", "Write", "Review",
    separator="; ",
    prefix="[TODO] "
))
```

### Key Point 3: Keyword-Only Arguments

You can force arguments after `*args` to be keyword-only:

```python
def search(query, *filters, sort_by='relevance', limit=10):
    """Search with required query and optional filters"""
    # 'sort_by' and 'limit' can ONLY be passed as keywords
    pass

# Valid
search("python", "tutorial", sort_by='date')

# Invalid - TypeError
# search("python", "tutorial", 'date')
```

### Key Point 4: Variable Arguments Are Immutable in Function Scope

While `args` is a tuple (immutable) and `kwargs` is a dictionary (mutable), modifying the values inside them won't affect the original objects passed:

```python
def modify_args(*args):
    args = args + (100,)  # Creates new tuple
    args[0] = 999         # Can't modify tuple (would raise error anyway)

def modify_kwargs(**kwargs):
    kwargs['new_key'] = 'new_value'  # Creates new key in local dict

original_list = [1, 2, 3]
modify_args(*original_list)
print(original_list)  # Still [1, 2, 3]
```

### Key Point 5: Argument Unpacking in Different Contexts

You can unpack collections in multiple contexts:

```python
# Function calls
def func(a, b, c):
    return a + b + c

func(*(1, 2, 3))           # Unpack tuple
func(*[1, 2, 3])           # Unpack list
func(**{'a': 1, 'b': 2, 'c': 3})  # Unpack dict

# List/dict literals (Python 3.5+)
list1 = [1, 2]
list2 = [*list1, 3, 4]     # [1, 2, 3, 4]

dict1 = {'a': 1}
dict2 = {**dict1, 'b': 2}  # {'a': 1, 'b': 2}
```

## Code Examples

### Example 1: Simple Aggregation Function

```python
def sum_numbers(*args):
    """Sum any number of numeric arguments"""
    return sum(args)

print(sum_numbers(1, 2, 3, 4, 5))  # 15
print(sum_numbers(10, 20))          # 30
print(sum_numbers())                # 0
```

### Example 2: Flexible Configuration

```python
class Logger:
    """Logger with flexible configuration"""

    def __init__(self, name, **kwargs):
        self.name = name
        self.level = kwargs.get('level', 'INFO')
        self.format = kwargs.get('format', '%(message)s')
        self.handlers = kwargs.get('handlers', [])

    def __repr__(self):
        return f"Logger({self.name}, level={self.level})"

# Multiple ways to configure
logger1 = Logger('app')
logger2 = Logger('app', level='DEBUG')
logger3 = Logger('app', level='DEBUG', handlers=['file', 'console'])

print(logger1)  # Logger(app, level=INFO)
print(logger3)  # Logger(app, level=DEBUG)
```

### Example 3: Decorator with Variable Arguments

```python
import functools
import time

def timing_decorator(*dec_args, **dec_kwargs):
    """Decorator that measures function execution time"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            print(f"{func.__name__} took {elapsed:.4f} seconds")
            return result
        return wrapper
    return decorator

@timing_decorator()
def slow_function(n):
    """Simulate a slow operation"""
    time.sleep(0.1)
    return sum(range(n))

slow_function(1000)
# Output: slow_function took 0.1003 seconds
```

### Example 4: Wrapper Function Pattern

```python
def retry(max_attempts=3, delay=1):
    """Retry decorator that forwards all arguments"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    print(f"Attempt {attempt} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=1)
def unstable_api_call(endpoint, **params):
    """Simulates an API call that might fail"""
    if not hasattr(unstable_api_call, 'attempts'):
        unstable_api_call.attempts = 0
    unstable_api_call.attempts += 1

    if unstable_api_call.attempts < 2:
        raise ConnectionError("API temporarily unavailable")

    return f"Success: {endpoint} with {params}"

result = unstable_api_call('/users', id=123, format='json')
print(result)
```

### Example 5: Method Signature Flexibility

```python
class DataProcessor:
    """Process data with flexible input options"""

    def process(self, data, *transformations, **options):
        """
        Apply transformations to data

        Args:
            data: Input data to process
            *transformations: Variable number of transformation names
            **options: Configuration options
        """
        verbose = options.get('verbose', False)
        output_format = options.get('output_format', 'dict')

        result = data
        for transform in transformations:
            result = self._apply_transform(result, transform, verbose)

        if output_format == 'json':
            import json
            return json.dumps(result)
        return result

    def _apply_transform(self, data, name, verbose=False):
        transforms = {
            'uppercase': lambda x: x.upper(),
            'reverse': lambda x: x[::-1],
            'double': lambda x: x + x,
        }
        if verbose:
            print(f"Applying {name}")
        return transforms.get(name, lambda x: x)(data)

processor = DataProcessor()
result = processor.process(
    "hello",
    'uppercase', 'reverse',
    verbose=True,
    output_format='dict'
)
print(result)
# Output:
# Applying uppercase
# Applying reverse
# {'result': 'OLLEH'}
```

### Example 6: Handling Type Validation

```python
def typed_function(*args, **kwargs):
    """Function that validates argument types"""

    # Type requirements
    arg_types = [int, str, list]

    if len(args) != len(arg_types):
        raise TypeError(f"Expected {len(arg_types)} arguments, got {len(args)}")

    for i, (arg, expected_type) in enumerate(zip(args, arg_types)):
        if not isinstance(arg, expected_type):
            raise TypeError(f"Arg {i} should be {expected_type.__name__}, got {type(arg).__name__}")

    print(f"Valid types: {args}")
    print(f"Options: {kwargs}")

# Valid call
typed_function(42, "hello", [1, 2, 3], timeout=5, retries=3)

# Invalid call - uncomment to see error
# typed_function(42, 100, [1, 2, 3])  # TypeError: Arg 1 should be str
```

### Example 7: Complex Argument Forwarding

```python
class PluginSystem:
    """System that dynamically calls registered plugins"""

    def __init__(self):
        self.plugins = {}

    def register(self, name, func):
        """Register a plugin function"""
        self.plugins[name] = func

    def execute(self, plugin_name, *args, **kwargs):
        """Execute a registered plugin with any arguments"""
        if plugin_name not in self.plugins:
            raise ValueError(f"Plugin '{plugin_name}' not registered")

        func = self.plugins[plugin_name]
        return func(*args, **kwargs)

# Create system and register plugins
system = PluginSystem()

system.register('greet', lambda name, age: f"{name} is {age} years old")
system.register('calculate', lambda x, y, operation='add': {
    'add': x + y,
    'mul': x * y,
    'sub': x - y,
}[operation])

# Execute plugins with different arguments
print(system.execute('greet', 'Alice', 30))  # Alice is 30 years old
print(system.execute('calculate', 10, 5))    # 15
print(system.execute('calculate', 10, 5, operation='mul'))  # 50
```

## Best Practices

### Practice 1: Document Your Function Signatures

Always document what *args and **kwargs represent:

```python
def batch_process(*items, **options):
    """
    Process multiple items in batch.

    Args:
        *items: Variable number of items to process
        **options: Optional settings:
            - parallel (bool): Enable parallel processing. Default: False
            - timeout (int): Maximum execution time in seconds. Default: 30
            - callback (callable): Function to call after processing. Default: None

    Returns:
        List of processed items

    Example:
        >>> results = batch_process('a', 'b', 'c', parallel=True, timeout=60)
    """
    parallel = options.get('parallel', False)
    timeout = options.get('timeout', 30)
    callback = options.get('callback')

    # Implementation
    pass
```

### Practice 2: Validate Input Arguments

Don't blindly trust what's passed in:

```python
def safe_multiply(*args, **kwargs):
    """Safely multiply arguments with validation"""
    if not args:
        raise ValueError("At least one argument required")

    for arg in args:
        if not isinstance(arg, (int, float)):
            raise TypeError(f"Expected numeric type, got {type(arg).__name__}")

    strict = kwargs.get('strict', False)
    if strict and kwargs.get('unknown_option'):
        valid_options = {'strict'}
        invalid = set(kwargs.keys()) - valid_options
        raise TypeError(f"Unknown options: {invalid}")

    result = 1
    for num in args:
        result *= num
    return result

print(safe_multiply(2, 3, 4))  # 24
safe_multiply(2, "3")          # TypeError: Expected numeric type
```

### Practice 3: Use Meaningful Parameter Names

When possible, be explicit about what arguments your function expects:

```python
# Less clear
def api_call(*args, **kwargs):
    pass

# More clear - shows expected parameters
def api_call(endpoint, method='GET', **headers):
    """
    Make an API call with flexible headers.

    Args:
        endpoint: API endpoint URL
        method: HTTP method (default: 'GET')
        **headers: Additional HTTP headers
    """
    pass
```

### Practice 4: Limit *args and **kwargs Usage

Use them purposefully, not as a catch-all:

```python
# Overuse - too flexible, unclear what's expected
def do_something(*args, **kwargs):
    pass

# Better - clear required and optional parameters
def build_sql_query(table, *columns, where=None, order_by=None, limit=None):
    """Build a SQL query with specified columns and conditions"""
    pass

# Even better - more explicit about options
class QueryBuilder:
    def __init__(self, table):
        self.table = table

    def select(self, *columns):
        self.columns = columns
        return self

    def where(self, condition):
        self.condition = condition
        return self
```

### Practice 5: Preserve Function Metadata

When wrapping functions, use `functools.wraps`:

```python
import functools

def my_decorator(func):
    @functools.wraps(func)  # Preserves __name__, __doc__, etc.
    def wrapper(*args, **kwargs):
        """Do something before and after"""
        result = func(*args, **kwargs)
        return result
    return wrapper

@my_decorator
def example_function(x, y):
    """Add two numbers"""
    return x + y

print(example_function.__name__)  # 'example_function', not 'wrapper'
print(example_function.__doc__)   # 'Add two numbers'
```

### Practice 6: Consider Default Values

Use .get() for safe dictionary access with defaults:

```python
def configure_service(name, *features, **settings):
    """Configure a service with various options"""
    # Safe access with defaults
    debug = settings.get('debug', False)
    timeout = settings.get('timeout', 30)
    max_retries = settings.get('max_retries', 3)

    # Better than:
    # debug = kwargs.get('debug', False)  # if you named it kwargs

    return {
        'name': name,
        'features': features,
        'settings': {
            'debug': debug,
            'timeout': timeout,
            'max_retries': max_retries
        }
    }
```

## Common Pitfalls

### Pitfall 1: Modifying Mutable Arguments

While `args` is a tuple, the objects inside it might be mutable:

```python
def append_to_list(*args):
    """Modifying list arguments affects the originals"""
    for arg in args:
        if isinstance(arg, list):
            arg.append('MODIFIED')  # This affects the original!

original_list = [1, 2, 3]
append_to_list(original_list)
print(original_list)  # [1, 2, 3, 'MODIFIED'] - mutated!

# Solution: Make a copy
def append_safely(*args):
    for arg in args:
        if isinstance(arg, list):
            arg = arg.copy()  # Work with a copy
            arg.append('MODIFIED')
```

### Pitfall 2: Unclear Function Signatures

Functions with too much flexibility can confuse users:

```python
# Confusing - what does this function actually do?
def process(*args, **kwargs):
    pass

# Clear - explicit about parameters
def process(data, output_format='json', **options):
    """Process data and output in specified format"""
    pass
```

### Pitfall 3: Not Handling Empty Arguments

Functions should handle cases with no arguments:

```python
def get_max(*numbers):
    """Get maximum of numbers"""
    if not numbers:
        raise ValueError("At least one number required")
    return max(numbers)

# Bad usage
try:
    get_max()  # ValueError: At least one number required
except ValueError as e:
    print(f"Error: {e}")
```

### Pitfall 4: Name Collisions with Kwargs

Be careful when unpacking dictionaries:

```python
def function(name, **kwargs):
    pass

config = {'name': 'Alice', 'age': 30}
function(**config)  # Error! 'name' got multiple values

# Solution: Separate or handle explicitly
name_val = config.pop('name')
function(name_val, **config)
```

### Pitfall 5: Misunderstanding Unpacking Order

The unpacking order matters for positional arguments:

```python
def func(a, b, c):
    return a + b + c

# These work the same
print(func(1, 2, 3))       # 6
print(func(*[1, 2, 3]))    # 6
print(func(*(1, 2, 3)))    # 6

# But this doesn't - wrong order
data = [3, 1, 2]
print(func(*data))         # 6 (not 5+3)
```

### Pitfall 6: Keyword Arguments After Positional

Once you use `*args`, subsequent keyword arguments must use names:

```python
def func(*args, **kwargs):
    pass

# Valid
func(1, 2, 3, key='value')

# Invalid - positional after *args
# func(1, 2, 3, 'value')  # TypeError
```

## Performance Considerations

### Memory Impact of *args and **kwargs

Creating tuples and dictionaries has memory overhead:

```python
import sys

def measure_memory(*args):
    return sys.getsizeof(args)

print(measure_memory(1, 2, 3))  # ~64 bytes for tuple
print(measure_memory())          # ~56 bytes for empty tuple
```

### Performance Comparison

```python
import timeit

# Using *args
def with_args(*args):
    return sum(args)

# Using explicit parameters
def with_params(a, b, c):
    return a + b + c

# Timing
time_args = timeit.timeit(lambda: with_args(1, 2, 3), number=1000000)
time_params = timeit.timeit(lambda: with_params(1, 2, 3), number=1000000)

print(f"*args: {time_args:.4f}s")
print(f"params: {time_params:.4f}s")
# Output will show *args is slightly slower due to packing/unpacking
```

### Optimization Techniques

1. **Avoid unnecessary packing/unpacking**:
```python
# Less efficient
def process(*args):
    return [x * 2 for x in args]

result = process(*large_list)

# More efficient if possible
def process(items):
    return [x * 2 for x in items]

result = process(large_list)
```

2. **Cache computed values**:
```python
def expensive_operation(*items, **options):
    # Compute once
    cache_key = (items, tuple(sorted(options.items())))
    if cache_key in cache:
        return cache[cache_key]

    # Do expensive work
    result = compute(items, options)
    cache[cache_key] = result
    return result
```

## Real-world Scenarios

### Scenario 1: Logging Library

```python
import logging
from datetime import datetime

class FlexibleLogger:
    """Logger that accepts flexible arguments"""

    def log(self, level, message, *args, **kwargs):
        """
        Log a message with variable substitution and options.

        Example:
            logger.log('INFO', 'User {} logged in', 'alice', timestamp=True)
        """
        # Substitute positional arguments
        formatted_message = message
        if args:
            formatted_message = message.format(*args)

        # Add metadata from kwargs
        metadata = {}
        if kwargs.get('timestamp'):
            metadata['time'] = datetime.now().isoformat()
        if kwargs.get('user_id'):
            metadata['user_id'] = kwargs['user_id']

        output = f"[{level}] {formatted_message}"
        if metadata:
            output += f" | {metadata}"

        print(output)

logger = FlexibleLogger()
logger.log('INFO', 'User {} logged in', 'alice', timestamp=True, user_id=123)
```

### Scenario 2: API Client Builder

```python
class APIClient:
    """HTTP client with flexible configuration"""

    def request(self, method, endpoint, *path_parts, **options):
        """
        Make an HTTP request with flexible URL construction.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: Base endpoint
            *path_parts: Additional path segments
            **options: Request options (headers, timeout, etc.)
        """
        # Build URL
        url = f"{endpoint}/{'/'.join(str(p) for p in path_parts)}"

        # Extract options
        headers = options.get('headers', {})
        timeout = options.get('timeout', 30)
        data = options.get('data')

        print(f"{method} {url}")
        print(f"  Headers: {headers}")
        print(f"  Timeout: {timeout}s")
        if data:
            print(f"  Data: {data}")

        return f"Mock response from {url}"

client = APIClient()
response = client.request(
    'POST',
    'https://api.example.com',
    'users', 123, 'profile',
    headers={'Authorization': 'Bearer token'},
    timeout=60,
    data={'name': 'Alice'}
)
```

### Scenario 3: Test Fixture Generator

```python
class FixtureGenerator:
    """Generate test data with flexible specifications"""

    def create_user(self, *roles, **attributes):
        """
        Create a test user with specified roles and attributes.

        Example:
            user = gen.create_user('admin', 'moderator',
                                 name='Alice', email='alice@test.com')
        """
        user = {
            'id': 1,
            'roles': list(roles) if roles else ['user'],
            'name': attributes.get('name', 'Test User'),
            'email': attributes.get('email', 'test@example.com'),
            'verified': attributes.get('verified', False),
        }
        return user

gen = FixtureGenerator()
admin_user = gen.create_user('admin', 'moderator', name='Alice', verified=True)
print(admin_user)
# {'id': 1, 'roles': ['admin', 'moderator'], 'name': 'Alice',
#  'email': 'test@example.com', 'verified': True}
```

### Scenario 4: Data Validation Framework

```python
class Validator:
    """Flexible validation with multiple criteria"""

    def validate(self, value, *validators, strict=False, **options):
        """
        Validate a value with multiple validators.

        Args:
            value: Value to validate
            *validators: Validator functions to apply
            strict: Whether to fail on first error
            **options: Additional validation options
        """
        errors = []

        for validator in validators:
            try:
                validator(value)
            except ValueError as e:
                errors.append(str(e))
                if strict:
                    raise

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'value': value
        }

validator = Validator()

# Define validators
def is_string(val):
    if not isinstance(val, str):
        raise ValueError(f"Expected string, got {type(val).__name__}")

def is_long(val):
    if len(val) < 3:
        raise ValueError("String too short (minimum 3 characters)")

def is_alphanumeric(val):
    if not val.isalnum():
        raise ValueError("Only alphanumeric characters allowed")

# Validate
result = validator.validate("hello123", is_string, is_long, is_alphanumeric)
print(result)  # {'valid': True, 'errors': [], 'value': 'hello123'}
```

## Interview Points

### Q1: What's the difference between *args and **kwargs?

**Answer**:
- `*args` collects positional arguments into a tuple
- `**kwargs` collects keyword arguments into a dictionary
- `*args` must come before `**kwargs` in function definition
- Both allow functions to accept variable numbers of arguments

### Q2: Can you use *args without **kwargs?

**Answer**: Yes, absolutely. They're independent features. You can use:
- Just `*args`
- Just `**kwargs`
- Both together
- Neither (regular function)

```python
def func1(*args): pass              # OK
def func2(**kwargs): pass           # OK
def func3(*args, **kwargs): pass    # OK
def func4(a, b): pass              # OK
```

### Q3: What happens if you define a function with *args but don't pass any arguments?

**Answer**: The `args` will be an empty tuple `()`. This is perfectly valid:

```python
def func(*args):
    print(len(args))  # Will print 0

func()  # Valid - args is ()
```

### Q4: Can you use unpacking with variables other than args and kwargs?

**Answer**: Yes! The asterisk and double-asterisk are unpacking operators. They work with any variable name:

```python
def func(*numbers, **options):  # Using the convention
    pass

def func(*values, **config):    # Using different names
    pass

# Both work, but the convention is better for readability
```

### Q5: How do you forward all arguments from one function to another?

**Answer**: Use `*args` and `**kwargs` in the wrapper:

```python
def original_function(a, b, c):
    return a + b + c

def wrapper(*args, **kwargs):
    # Do something before
    result = original_function(*args, **kwargs)
    # Do something after
    return result
```

### Q6: What's the difference between `*args` in function definition vs. function call?

**Answer**:
- In **definition**: collects arguments into a tuple
- In **call**: unpacks a sequence into individual arguments

```python
# Definition: packs arguments
def func(*args):
    pass

# Call: unpacks sequence
data = [1, 2, 3]
func(*data)  # Becomes func(1, 2, 3)
```

### Q7: Can **kwargs contain keys that aren't valid variable names?

**Answer**: No - keyword arguments must be valid Python identifiers. However, you can access them via dictionary notation:

```python
def func(**kwargs):
    # This works fine internally
    print(kwargs.get('valid-name-with-dash'))  # None - not a valid identifier
    print(kwargs.get('valid_name_with_underscore'))  # Works

func(valid_name_with_underscore=123)
# func(valid-name-with-dash=123)  # SyntaxError
```

### Q8: What's the purpose of using *args in decorators?

**Answer**: To make decorators work with functions that have any signature:

```python
def logging_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):  # Accept any arguments
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)  # Forward all arguments
    return wrapper

@logging_decorator
def add(a, b):
    return a + b

@logging_decorator
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}"

add(1, 2)
greet("Alice", greeting="Hi")
```

## Further Reading

### Core Concepts
- Python Documentation: [More on Defining Functions](https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions)
- PEP 3102: Keyword-Only Arguments
- PEP 448: Additional Unpacking Generalizations

### Related Topics
- Function decorators and how they use `*args` and `**kwargs`
- Unpacking generalizations in Python 3.5+
- **Variable keyword arguments in class initialization**
- Type hints with `*args` and `**kwargs` (typing module)

### Advanced Patterns
- Creating flexible APIs with argument forwarding
- Building plugin systems with dynamic function calls
- Wrapper patterns in middleware and decorators
- Parameter validation frameworks

### Practical Resources
- Real-world decorator examples in popular libraries
- How Flask and Django use `*args`/`**kwargs`
- Building extensible class hierarchies with `super()`
- Testing strategies for functions with variable arguments

### Type Hints for *args and **kwargs

```python
from typing import Any

def func(*args: int, **kwargs: str) -> None:
    """
    Type hints for variable arguments.

    Args:
        *args: Variable number of integers
        **kwargs: Variable number of string keyword arguments
    """
    pass

# For more flexibility
def flexible(*args: Any, **kwargs: Any) -> Any:
    pass
```

---

## Summary

The `*args` and `**kwargs` features are powerful tools for writing flexible, adaptable Python code. Key takeaways:

1. **Use *args when** you need to accept multiple positional arguments of similar type
2. **Use **kwargs when** you need to accept optional named parameters
3. **Order matters**: regular parameters → *args → **kwargs
4. **Document clearly** what your function expects
5. **Validate input** to prevent unexpected behavior
6. **Follow conventions** - use the standard names for readability
7. **Consider unpacking** in function calls to make code more flexible
8. **Be careful** with mutable default arguments in wrapped functions

Master these patterns, and you'll write more Pythonic, flexible, and maintainable code.
