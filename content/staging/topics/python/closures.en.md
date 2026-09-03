---
title: Python Closures and Lexical Scoping Complete Guide
description: Comprehensive guide to understanding Python closures, lexical scoping, nonlocal/global keywords, and practical applications
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - Closures
  - Scope
  - Functions
  - Nested Functions
status: imported
origin: old/src/content/docs/python/closures.en.md
divergence: 0.208
issues:
  - missing-subcategory-en
legacy:
  category: Python
  subcategory: ""
  order: 7
  lastUpdated: 2026-01-07
---

Closures are a fundamental concept in Python that enable powerful functional programming patterns and sophisticated data encapsulation. Unlike many languages, Python treats functions as first-class objects, making closures a natural and elegant way to manage state and create modular code. This comprehensive guide explores closures from foundational concepts to advanced real-world applications.

## Concept Explanation

### Understanding Closures

A closure in Python is a function that has access to variables from its enclosing scope, even after the outer function has finished executing. More formally, a closure is created when:

1. A function is defined inside another function
2. The inner function references variables from the outer function
3. The outer function returns the inner function or makes it accessible somehow

From Python's perspective, closures represent the combination of a function and the variables from its enclosing scope that it needs to execute properly.

```python
def outer():
    message = "Hello from closure!"

    def inner():
        print(message)  # Accesses outer function's variable

    return inner

closure_func = outer()
closure_func()  # Output: Hello from closure!
```

In this example, `inner()` forms a closure because it remembers the `message` variable from its enclosing scope, even though `outer()` has already finished executing.

### Lexical Scoping Definition

Lexical scoping (also called static scoping) is the fundamental principle that determines where Python looks for variable definitions. The scope of a variable is determined by its position in the source code at write-time, not at runtime.

When Python encounters a variable, it searches for it in the following order:

1. **Local scope (L)**: Variables defined in the current function
2. **Enclosing scope (E)**: Variables in enclosing functions (for nested functions)
3. **Global scope (G)**: Variables defined at the module level
4. **Built-in scope (B)**: Python's built-in names (like `print`, `len`, etc.)

This order forms the **LEGB rule**, which is the foundation of Python's scope resolution.

```python
x = "global"  # Global scope

def outer():
    x = "enclosing"  # Enclosing scope

    def inner():
        x = "local"  # Local scope
        print(x)

    inner()
    print(x)

print(x)
outer()

# Output:
# global
# local
# enclosing
```

### The Closure Mechanism

Python stores information about a function's enclosing scope within the function object itself. When you create a nested function, Python creates two special attributes:

- **`__code__`**: Contains the compiled code object
- **`__closure__`**: A tuple containing cell objects that hold references to the captured variables

```python
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

times3 = make_multiplier(3)

# Inspect the closure
print(times3.__closure__)  # (<cell at ...: int object at ...>,)
print(times3.__closure__[0].cell_contents)  # 3
```

## Core Principles

### Variable Capture Mechanism

When a nested function is created, Python captures references to variables from the enclosing scope. This is crucial: closures capture **references**, not copies of values.

```python
def counter_factory(start):
    count = start

    def increment():
        nonlocal count  # Declare intention to modify enclosing variable
        count += 1
        return count

    return increment

counter = counter_factory(0)
print(counter())  # 1
print(counter())  # 2
print(counter())  # 3
```

The key insight is that `count` is not copied; the closure maintains a reference to the original variable.

### The nonlocal Keyword

The `nonlocal` keyword allows you to modify variables in an enclosing (but not global) scope. Without it, attempting to assign to a variable would create a new local variable.

```python
def outer():
    x = 10

    def inner():
        nonlocal x
        x = 20  # Modifies the outer function's x
        print(f"Inner: {x}")

    inner()
    print(f"Outer: {x}")

outer()
# Output:
# Inner: 20
# Outer: 20
```

Without `nonlocal`, Python would raise an `UnboundLocalError`:

```python
def outer():
    x = 10

    def inner():
        print(x)  # This line causes UnboundLocalError
        x = 20    # Python sees assignment, treats x as local

    inner()

# UnboundLocalError: local variable 'x' referenced before assignment
```

### The global Keyword

The `global` keyword allows functions to access and modify module-level variables:

```python
count = 0

def increment_global():
    global count
    count += 1
    return count

print(increment_global())  # 1
print(increment_global())  # 2
print(count)               # 2
```

### Closure vs. Global Access

Important distinction:

```python
# Global access
global_var = 100

def access_global():
    print(global_var)  # Can read without 'global' keyword

access_global()  # Output: 100

# But to modify, we need the global keyword
def modify_global():
    global global_var
    global_var = 200

# Closure access
def make_closure():
    enclosing_var = 100

    def inner():
        print(enclosing_var)  # Can read without 'nonlocal'

    return inner

closure = make_closure()
closure()  # Output: 100

# But to modify, we need the nonlocal keyword
def make_closure_modify():
    enclosing_var = 100

    def inner():
        nonlocal enclosing_var
        enclosing_var = 200

    return inner
```

## Key Points

### Closure Creation Requirements

Three essential requirements for closure creation:

1. **Function nesting**: A function must be defined inside another function
2. **Variable reference**: The inner function must reference variables from the outer function's scope
3. **Outer function accessibility**: The inner function must be returned or otherwise accessible outside the outer function

```python
# All three conditions must be met:

def requirement_1():
    message = "Hello"

    def inner():  # Nested function ✓
        return message  # References outer variable ✓

    return inner  # Returned from outer function ✓

closure = requirement_1()
print(closure())  # Works!
```

### Multiple Closures

Each closure is independent. Multiple calls to the outer function create separate closures:

```python
def make_greeting(greeting):
    def greet(name):
        return f"{greeting}, {name}!"
    return greet

say_hello = make_greeting("Hello")
say_hi = make_greeting("Hi")
say_goodbye = make_greeting("Goodbye")

print(say_hello("Alice"))      # "Hello, Alice!"
print(say_hi("Bob"))           # "Hi, Bob!"
print(say_goodbye("Charlie"))  # "Goodbye, Charlie!"
```

Each returned function has its own closure with a different `greeting` value.

### Closure Lifespan

Closures maintain references to variables for as long as the function exists:

```python
def create_tracker():
    data = []

    def add_item(item):
        data.append(item)
        return len(data)

    def get_items():
        return data.copy()

    return add_item, get_items

add, get = create_tracker()

print(add("first"))   # 1
print(add("second"))  # 2
print(get())          # ['first', 'second']

# data still exists and is shared between both functions
```

### Late Binding in Closures

Python uses late binding for closure variables. The variable is looked up at execution time, not at definition time:

```python
def create_functions():
    functions = []

    for i in range(3):
        def func():
            return i
        functions.append(func)

    return functions

funcs = create_functions()
print([f() for f in funcs])  # [2, 2, 2] - All return the final value of i

# Solution: Capture the current value
def create_functions_fixed():
    functions = []

    for i in range(3):
        def func(x=i):  # Capture current value as default argument
            return x
        functions.append(func)

    return functions

funcs = create_functions_fixed()
print([f() for f in funcs])  # [0, 1, 2] - Each returns its intended value
```

## Code Examples

### Simple Counter Example

```python
def make_counter(start=0):
    """Create a counter function with private state."""
    count = start

    def increment(step=1):
        nonlocal count
        count += step
        return count

    def decrement(step=1):
        nonlocal count
        count -= step
        return count

    def reset():
        nonlocal count
        count = start
        return count

    def get_count():
        return count

    return {
        'increment': increment,
        'decrement': decrement,
        'reset': reset,
        'get': get_count
    }

counter = make_counter(10)
print(counter['increment']())      # 11
print(counter['increment'](5))      # 16
print(counter['decrement'](3))      # 13
print(counter['get']())             # 13
print(counter['reset']())           # 10
```

### Function Decorator Example

Decorators are a natural application of closures:

```python
def timing_decorator(func):
    """Decorator that measures function execution time."""
    import time

    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result

    return wrapper

@timing_decorator
def slow_function():
    import time
    time.sleep(0.1)
    return "Done"

slow_function()  # slow_function took 0.1000+ seconds
```

### Memoization with Closures

```python
def memoize(func):
    """Cache function results to avoid redundant computations."""
    cache = {}

    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    return wrapper

@memoize
def fibonacci(n):
    """Calculate Fibonacci number with memoization."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))  # Fast: uses cached values
print(fibonacci(20))  # Still fast with memoization
```

### Factory Function Pattern

```python
def create_validator(min_length, max_length):
    """Factory that creates validation functions."""

    def validate(value):
        if not isinstance(value, str):
            return False
        return min_length <= len(value) <= max_length

    return validate

# Create specialized validators
validate_username = create_validator(3, 20)
validate_password = create_validator(8, 128)
validate_email = create_validator(5, 100)

print(validate_username("ab"))       # False (too short)
print(validate_username("alice"))    # True
print(validate_password("short"))    # False
print(validate_password("SecurePass123"))  # True
```

### Currying Implementation

Currying transforms a function taking multiple arguments into a chain of functions:

```python
def curry(func):
    """Convert a function to its curried form."""
    import functools

    @functools.wraps(func)
    def curried(*args):
        if len(args) >= func.__code__.co_argcount:
            return func(*args)
        return functools.partial(curried, *args)

    return curried

@curry
def add(a, b, c):
    return a + b + c

# All of these work:
print(add(1)(2)(3))      # 6
print(add(1, 2)(3))      # 6
print(add(1, 2, 3))      # 6

# Create partial functions
add_1 = add(1)
add_1_and_2 = add_1(2)
print(add_1_and_2(3))    # 6
```

### Partial Function Application

```python
from functools import partial

def multiply(x, y, z):
    return x * y * z

# Create specialized functions
double = partial(multiply, 2)
multiply_by_2_and_3 = partial(multiply, 2, 3)

print(double(5, 4))           # 40 (2 * 5 * 4)
print(multiply_by_2_and_3(5))  # 30 (2 * 3 * 5)
```

### Debouncing with Closures

```python
import time

def debounce(wait_seconds):
    """Decorator to debounce function calls."""
    def decorator(func):
        last_called = [0.0]  # Use list to allow modification in nested function
        result = [None]

        def debounced(*args, **kwargs):
            now = time.time()
            if now - last_called[0] >= wait_seconds:
                result[0] = func(*args, **kwargs)
                last_called[0] = now
            return result[0]

        return debounced

    return decorator

@debounce(1.0)
def search(query):
    print(f"Searching for: {query}")
    return f"Results for {query}"

# Rapid calls within 1 second
search("python")
search("python closures")
search("python closures guide")
time.sleep(1.1)
search("python decorators")  # This one executes

# Output:
# Searching for: python
# Searching for: python decorators
```

### Rate Limiting with Closures

```python
def rate_limit(max_calls, time_window):
    """Limit function calls to max_calls per time_window seconds."""
    def decorator(func):
        call_times = []

        def limited(*args, **kwargs):
            now = time.time()
            # Remove old calls outside the time window
            call_times[:] = [t for t in call_times if now - t < time_window]

            if len(call_times) < max_calls:
                call_times.append(now)
                return func(*args, **kwargs)
            else:
                print(f"Rate limit exceeded. Max {max_calls} calls per {time_window}s")
                return None

        return limited

    return decorator

@rate_limit(3, 10)  # 3 calls per 10 seconds
def api_call(endpoint):
    print(f"Calling {endpoint}")
    return f"Response from {endpoint}"

for i in range(5):
    api_call(f"/api/endpoint{i}")

# Output:
# Calling /api/endpoint0
# Calling /api/endpoint1
# Calling /api/endpoint2
# Rate limit exceeded. Max 3 calls per 10s
# Rate limit exceeded. Max 3 calls per 10s
```

## Best Practices

### Use Closures for Data Encapsulation

```python
class BankAccount:
    """Closure-based bank account implementation."""

    @staticmethod
    def create(initial_balance):
        balance = [initial_balance]  # Use list for mutability
        transactions = []

        def deposit(amount):
            if amount <= 0:
                raise ValueError("Amount must be positive")
            balance[0] += amount
            transactions.append(('deposit', amount))
            return balance[0]

        def withdraw(amount):
            if amount <= 0:
                raise ValueError("Amount must be positive")
            if amount > balance[0]:
                raise ValueError("Insufficient funds")
            balance[0] -= amount
            transactions.append(('withdraw', amount))
            return balance[0]

        def get_balance():
            return balance[0]

        def get_history():
            return transactions.copy()

        return {
            'deposit': deposit,
            'withdraw': withdraw,
            'balance': get_balance,
            'history': get_history
        }

account = BankAccount.create(1000)
print(account['deposit'](500))        # 1500
print(account['withdraw'](200))       # 1300
print(account['balance']())           # 1300
print(account['history']())           # [('deposit', 500), ('withdraw', 200)]
# account['balance'] = 999999  # Cannot modify - balance is private
```

### Prefer Explicit Parameter Names

Make the closure behavior clear by avoiding implicit variable capture when possible:

```python
# Less clear - relies on understanding closure mechanism
def make_adder(n):
    def adder(x):
        return x + n
    return adder

# More explicit - makes dependencies clear
def make_adder_explicit(n):
    def adder(x, base=n):  # Explicit parameter
        return x + base
    return adder
```

### Document Closure Behavior

```python
def create_authenticated_handler(token):
    """
    Create an authenticated request handler.

    Args:
        token (str): Authentication token to be captured

    Returns:
        callable: A request handler that includes the token in headers

    Note:
        The returned function forms a closure over the token parameter.
        Token is captured by reference.
    """
    def handle_request(endpoint, data=None):
        headers = {"Authorization": f"Bearer {token}"}
        # Make request...
        return f"Request to {endpoint} with {headers}"

    return handle_request

handler = create_authenticated_handler("secret-token-123")
print(handler("/api/users"))
```

### Be Aware of Memory Implications

```python
def create_large_closure():
    """Be mindful of closure memory usage."""
    large_data = list(range(1000000))

    def process():
        # Even though we only use one element,
        # the entire large_data is kept in memory
        return large_data[0]

    return process

# Better approach - extract what you need
def create_efficient_closure():
    large_data = list(range(1000000))
    first_element = large_data[0]

    def process():
        return first_element

    return process
```

### Use Classes for Complex Encapsulation

For complex scenarios with many methods, prefer classes over closure-based approaches:

```python
# Closure approach - harder to maintain
def create_user_manager():
    users = {}

    def add(name, email):
        # ... implementation
        pass

    def remove(name):
        # ... implementation
        pass

    # Many more functions...

    return {
        'add': add,
        'remove': remove,
        # Many more functions...
    }

# Class approach - clearer and more maintainable
class UserManager:
    def __init__(self):
        self.users = {}

    def add(self, name, email):
        # ... implementation
        pass

    def remove(self, name):
        # ... implementation
        pass

    # Many more methods...
```

## Common Pitfalls

### Late Binding in Loops

The most common closure pitfall in Python:

```python
# Problem: Late binding
functions = []
for i in range(3):
    def func():
        return i  # Captures reference to i, not its value
    functions.append(func)

print([f() for f in functions])  # [2, 2, 2] - all return 2
```

**Solutions:**

```python
# Solution 1: Use default argument to capture current value
functions = []
for i in range(3):
    def func(x=i):  # Capture current value
        return x
    functions.append(func)

print([f() for f in functions])  # [0, 1, 2]

# Solution 2: Use a factory function
def make_func(value):
    def func():
        return value
    return func

functions = [make_func(i) for i in range(3)]
print([f() for f in functions])  # [0, 1, 2]

# Solution 3: Use list comprehension (most Pythonic)
functions = [lambda x=i: x for i in range(3)]
print([f() for f in functions])  # [0, 1, 2]
```

### Mutable Default Arguments Issue

```python
# Problem: Mutable defaults are shared
def problematic_closure(lst=[]):
    def append_and_return(item):
        lst.append(item)
        return lst
    return append_and_return

f1 = problematic_closure()
print(f1(1))  # [1]
print(f1(2))  # [1, 2] - shared list!

f2 = problematic_closure()
print(f2(3))  # [1, 2, 3] - f2 and f1 share the same list!

# Solution: Create fresh defaults
def correct_closure(lst=None):
    if lst is None:
        lst = []

    def append_and_return(item):
        lst.append(item)
        return lst

    return append_and_return

f1 = correct_closure()
print(f1(1))  # [1]

f2 = correct_closure()
print(f2(3))  # [3] - independent list
```

### The nonlocal Caveat

```python
# Problem: Without nonlocal, assignment creates local variable
def outer():
    x = 10

    def inner():
        x = 20  # Creates new local x, doesn't modify outer
        print(f"Inner: {x}")

    inner()
    print(f"Outer: {x}")

outer()
# Output:
# Inner: 20
# Outer: 10

# Correct: Use nonlocal
def outer_fixed():
    x = 10

    def inner():
        nonlocal x
        x = 20  # Modifies outer x
        print(f"Inner: {x}")

    inner()
    print(f"Outer: {x}")

outer_fixed()
# Output:
# Inner: 20
# Outer: 20
```

### Closure Over Mutable Objects

```python
# Problem: Modifying mutable object doesn't require nonlocal
def problematic():
    data = {'count': 0}

    def increment():
        data['count'] += 1  # Works without nonlocal
        return data['count']

    return increment

counter = problematic()
print(counter())  # 1
print(counter())  # 2

# But this is confusing because:
def confusing():
    data = {'count': 0}

    def increment():
        # This creates a local reference, confusing!
        data = {'count': 100}  # Rebinding, not modifying
        return data['count']

    return increment

counter = confusing()
print(counter())  # 100

# Best practice: Be explicit
def clear():
    data = {'count': 0}

    def increment():
        nonlocal data  # Make intention clear
        data['count'] += 1
        return data['count']

    return increment
```

### Memory Leaks with Closures

```python
# Problem: Closures can prevent garbage collection
class Component:
    def __init__(self):
        self.large_data = list(range(1000000))

        # This closure references self, preventing garbage collection
        self.callback = lambda: self.large_data[0]

# Even if component is deleted, callback keeps data alive
component = Component()
callback = component.callback
del component
# component.large_data still exists in memory!

# Solution 1: Use weak references
import weakref

class ComponentFixed:
    def __init__(self):
        self.large_data = list(range(1000000))

        def callback():
            obj = ref()
            if obj is not None:
                return obj.large_data[0]
            return None

        ref = weakref.ref(self)
        self.callback = callback

# Solution 2: Explicit cleanup
class ComponentCleanable:
    def __init__(self):
        self.large_data = list(range(1000000))
        self.callback = lambda: self.large_data[0]

    def cleanup(self):
        self.callback = None
        self.large_data = None
```

## Performance Considerations

### Closure Overhead

Closures have minimal performance overhead compared to regular functions:

```python
import timeit

def regular_function(x):
    return x * 2

def make_closure(multiplier):
    def closure_func(x):
        return x * multiplier
    return closure_func

closure_func = make_closure(2)

# Performance comparison
regular_time = timeit.timeit(lambda: regular_function(5), number=1000000)
closure_time = timeit.timeit(lambda: closure_func(5), number=1000000)

print(f"Regular function: {regular_time:.4f}s")
print(f"Closure function: {closure_time:.4f}s")
# Difference is minimal (~5-10%)
```

### Closure Variable Lookup

Variable lookup in closures is slightly slower than local variables:

```python
import timeit

def closure_overhead():
    x = 100

    def inner():
        return x  # Closure variable lookup

    def local_version():
        x = 100
        return x  # Local variable lookup

    # Closure lookup
    closure_time = timeit.timeit(inner, number=1000000)

    # Local lookup
    local_time = timeit.timeit(local_version, number=1000000)

    print(f"Closure lookup: {closure_time:.4f}s")
    print(f"Local lookup: {local_time:.4f}s")
```

### Optimization Strategies

```python
# Strategy 1: Cache closure variables in local scope
def optimize_closure():
    outer_var = expensive_calculation()

    def process_item(item):
        cached_var = outer_var  # Cache in local scope
        # ... use cached_var multiple times
        return cached_var * item

    return process_item

# Strategy 2: Use functools for optimization
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(n):
    # ... computation
    return result

# Strategy 3: Avoid creating closures in hot loops
def suboptimal():
    for i in range(1000000):
        def handler():  # Creates new closure each iteration
            return i
        handler()

def optimized():
    def handler(x):  # Create once
        return x

    for i in range(1000000):
        handler(i)
```

## Real-world Scenarios

### Decorator with Arguments

```python
def retry(max_attempts, delay=1):
    """Decorator to retry function on failure."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt < max_attempts - 1:
                        print(f"Attempt {attempt + 1} failed. Retrying in {delay}s...")
                        time.sleep(delay)
                    else:
                        raise
        return wrapper
    return decorator

@retry(max_attempts=3, delay=1)
def unstable_operation():
    import random
    if random.random() > 0.7:
        return "Success!"
    raise Exception("Failed")

print(unstable_operation())
```

### Context Manager-like Behavior

```python
def resource_manager(resource_name):
    """Create a resource manager using closures."""
    state = {'initialized': False, 'resource': None}

    def initialize():
        print(f"Initializing {resource_name}")
        state['initialized'] = True
        state['resource'] = f"Resource {resource_name}"

    def cleanup():
        print(f"Cleaning up {resource_name}")
        state['initialized'] = False
        state['resource'] = None

    def use():
        if not state['initialized']:
            raise RuntimeError("Resource not initialized")
        return state['resource']

    return {
        'init': initialize,
        'cleanup': cleanup,
        'use': use
    }

db = resource_manager("database")
db['init']()
print(db['use']())
db['cleanup']()
```

### Observer Pattern with Closures

```python
def create_observer_pattern():
    """Simple observer pattern using closures."""
    listeners = []

    def subscribe(listener):
        listeners.append(listener)

        # Return unsubscribe function
        def unsubscribe():
            listeners.remove(listener)

        return unsubscribe

    def notify(event):
        for listener in listeners:
            listener(event)

    return {
        'subscribe': subscribe,
        'notify': notify
    }

event_system = create_observer_pattern()

def log_event(event):
    print(f"Logged: {event}")

def track_event(event):
    print(f"Tracked: {event}")

unsubscribe_log = event_system['subscribe'](log_event)
unsubscribe_track = event_system['subscribe'](track_event)

event_system['notify']("User logged in")
# Output:
# Logged: User logged in
# Tracked: User logged in

unsubscribe_log()
event_system['notify']("User action")
# Output:
# Tracked: User action
```

### Configuration Manager

```python
def create_config_manager(defaults):
    """Manage configuration with closures."""
    config = defaults.copy()

    def get(key, default=None):
        return config.get(key, default)

    def set(key, value):
        config[key] = value

    def update(new_config):
        config.update(new_config)

    def get_all():
        return config.copy()

    return {
        'get': get,
        'set': set,
        'update': update,
        'get_all': get_all
    }

config = create_config_manager({
    'debug': False,
    'timeout': 30,
    'retries': 3
})

print(config['get']('debug'))  # False
config['set']('debug', True)
print(config['get_all']())
# {'debug': True, 'timeout': 30, 'retries': 3}
```

### Function Composition

```python
def compose(*functions):
    """Compose functions right to left."""
    def composed(x):
        result = x
        for func in reversed(functions):
            result = func(result)
        return result
    return composed

def pipe(*functions):
    """Compose functions left to right."""
    def piped(x):
        result = x
        for func in functions:
            result = func(result)
        return result
    return piped

# Examples
add_10 = lambda x: x + 10
multiply_2 = lambda x: x * 2
subtract_5 = lambda x: x - 5

# Compose: subtract_5(multiply_2(add_10(5)))
composed = compose(subtract_5, multiply_2, add_10)
print(composed(5))  # ((5 + 10) * 2) - 5 = 25

# Pipe: ((5 + 10) * 2) - 5
piped = pipe(add_10, multiply_2, subtract_5)
print(piped(5))  # 25
```

## Interview Points

### Common Interview Questions

**Question 1: Explain closures and provide an example**

*Answer:* A closure is a function that retains access to variables from its enclosing scope, even after the outer function has finished executing. This happens because Python stores references to outer variables in the function object.

```python
def outer():
    message = "Hello"

    def inner():
        print(message)  # Accesses outer's message

    return inner

closure = outer()
closure()  # "Hello" - message is still accessible
```

**Question 2: What's the difference between nonlocal and global?**

*Answer:* `global` refers to module-level scope, while `nonlocal` refers to enclosing function scope. Global is for accessing top-level variables, nonlocal is for accessing variables in the immediate enclosing function.

```python
x = "global"

def outer():
    x = "enclosing"

    def inner():
        x = "local"

        # To modify enclosing x, use nonlocal
        # To modify global x, use global
```

**Question 3: What will this print? (Late binding problem)**

```python
functions = []
for i in range(3):
    functions.append(lambda: i)

print([f() for f in functions])  # [2, 2, 2]
```

*Explanation:* Late binding captures the variable reference, not the value. By the time the lambdas execute, `i` is 2. Solution: use `lambda x=i: x` to capture the value.

**Question 4: Implement a simple decorator**

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def hello(name):
    return f"Hello, {name}!"

print(hello("Alice"))
# Calling hello
# Hello, Alice!
```

**Question 5: Create a function that returns a function**

```python
def multiply_by(n):
    def multiplier(x):
        return x * n
    return multiplier

times_3 = multiply_by(3)
print(times_3(5))  # 15
```

### Key Concepts to Explain

- **Variable capture**: Closures capture references, not copies
- **LEGB rule**: How Python resolves variable names
- **Execution timing**: nonlocal/global declarations affect behavior
- **Memory implications**: Closures keep variables in memory
- **Late binding**: Variables are looked up at execution time, not definition time

### How to Approach Closure Problems

1. **Identify closure formation**: Check if there's a nested function accessing outer variables
2. **Trace variable references**: Follow which variables are captured
3. **Check for late binding issues**: In loops, captured variables are references
4. **Consider nonlocal/global needs**: If modification is needed, declare appropriately
5. **Analyze memory implications**: Will the closure prevent garbage collection?

## Further Reading

### Related Python Concepts

- **Decorators**: Built on closures for elegant function wrapping
- **Lambda expressions**: Anonymous functions that often form closures
- **Context managers**: `with` statement used alongside closures
- **Generators**: Functions that maintain state across calls
- **Functional programming**: Map, filter, reduce often use closures
- **Class methods and static methods**: Alternative encapsulation approaches

### Advanced Topics

```python
# Decorator with arguments
def log_calls(prefix="LOG"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"{prefix}: {func.__name__} called")
            return func(*args, **kwargs)
        return wrapper
    return decorator

@log_calls(prefix="DEBUG")
def process():
    pass

# functools wraps for preserving metadata
from functools import wraps

def timing(func):
    @wraps(func)  # Preserves func metadata
    def wrapper(*args, **kwargs):
        # ... timing logic
        return func(*args, **kwargs)
    return wrapper

# Property decorators for encapsulation
class Person:
    def __init__(self, name):
        self._name = name

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not value:
            raise ValueError("Name cannot be empty")
        self._name = value
```

### Recommended Resources

**Books:**
- "Fluent Python" by Luciano Ramalho - Excellent coverage of closures and decorators
- "Effective Python" by Brett Slatkin - Best practices including closure patterns

**Online Resources:**
- Python Official Documentation on Closures
- Real Python articles on decorators and functional programming
- PEP 227: Statically Nested Scopes (closure specification)
- Python Data Model documentation

**Practice:**
- Implement decorators for logging, timing, and memoization
- Create closure-based state managers
- Practice with functional programming patterns

## Summary

Closures and lexical scoping are fundamental concepts that enable powerful Python programming patterns. Understanding them deeply is essential for writing elegant, Pythonic code.

**Key Takeaways:**

1. **Closure formation**: Requires nested function, variable reference from outer scope, and accessibility outside the outer function
2. **Lexical scoping**: Python determines scope at write-time using the LEGB rule
3. **Variable capture**: Closures capture references, not values - important for loops and asynchronous code
4. **nonlocal keyword**: Use to modify variables in enclosing scope
5. **Common patterns**: Decorators, memoization, function factories, and state managers
6. **Memory awareness**: Closures keep variables alive, potential for memory leaks if not careful
7. **Performance**: Minimal overhead compared to regular functions

**Best Practices:**

- Use closures for data encapsulation and private state
- Be aware of late binding in loops; use default arguments or factory functions
- Document closure behavior in docstrings
- Prefer classes for complex encapsulation scenarios
- Use decorators leveraging closures for cross-cutting concerns
- Clean up listeners and callbacks to prevent memory leaks
- Consider weak references for long-lived closures over large objects

**Common Pitfalls to Avoid:**

- Late binding in loops without capturing values
- Forgetting nonlocal when modifying outer variables
- Creating unnecessary closures that keep large objects in memory
- Confusing mutable object modification with variable reassignment
- Not cleaning up event listeners attached via closures

Mastering closures and lexical scoping will significantly improve your Python programming skills and enable you to write more elegant, functional code. These concepts form the foundation of decorators, context managers, and modern Python patterns like the descriptor protocol.

