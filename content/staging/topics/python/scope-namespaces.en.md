---
title: Python Scope and Namespaces (LEGB Rule)
description: Deep dive into Python scope chain, namespace mechanism, LEGB lookup rules, and the use of global/nonlocal keywords
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - Scope
  - Namespaces
  - LEGB
  - Closures
  - Interview
status: imported
origin: old/src/content/docs/python/scope-namespaces.en.md
divergence: 0.216
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: python
  subcategory: ""
  order: 6
  lastUpdated: 2026-01-07
---

Scope and Namespace are two fundamental concepts in Python that determine the visibility and lifetime of variables. Understanding these concepts is crucial for writing clear and maintainable Python code, and forms the foundation for mastering advanced features like closures and decorators.

## Concept Explanation

### What is a Namespace?

A namespace is a mapping from names to objects. In Python, a namespace is essentially a dictionary where keys are variable names (strings) and values are the objects that the variables reference.

```python
# A namespace can be understood as such a dictionary
namespace = {
    'x': 10,
    'name': 'Python',
    'func': <function object>,
    'MyClass': <class object>
}
```

Different types of namespaces:

1. **Built-in Namespace**: Contains Python's built-in functions and exceptions, such as `print`, `len`, `Exception`, etc.
2. **Global Namespace**: Module-level variables, functions, and class definitions
3. **Local Namespace**: Variables defined inside a function
4. **Enclosing Namespace**: The namespace of an outer function in nested functions

### What is a Scope?

A scope is a textual region in a Python program where you can directly access a namespace. In other words, a scope determines where in the code you can access specific variables.

Scopes are static (lexical), determined at code write time rather than at runtime. This means the location where a function is defined determines which variables it can access.

```python
x = "global"

def outer():
    x = "enclosing"

    def inner():
        x = "local"
        print(x)  # scope determines which x is accessed here

    inner()

outer()  # Output: local
```

### The LEGB Rule

LEGB is an abbreviation for Python's variable lookup order, representing four scope levels:

- **L (Local)**: Local scope, variables defined inside a function
- **E (Enclosing)**: Enclosing scope, the scope of an outer nested function
- **G (Global)**: Global scope, module-level variables
- **B (Built-in)**: Built-in scope, Python's built-in names

When Python needs to look up a variable, it searches in the order L -> E -> G -> B until it finds it. If the variable is not found in any scope, a `NameError` is raised.

## Core Principles

### Namespace Lifecycle

Different namespaces are created and destroyed at different times:

```python
# Built-in namespace: created when the interpreter starts, destroyed when it exits
print  # built-in function, always available

# Global namespace: created when a module is imported, destroyed when the interpreter exits
module_var = "I'm global"

# Local namespace: created when a function is called, destroyed when it returns
def my_function():
    local_var = "I'm local"  # created when function is called
    return local_var
# after function returns, the namespace containing local_var is destroyed

# Enclosing namespace: special case, remains alive when referenced by an inner function
def outer():
    enclosing_var = "I'm enclosing"

    def inner():
        return enclosing_var  # references outer variable

    return inner

closure = outer()
# outer function has returned, but enclosing_var still lives
print(closure())  # Output: I'm enclosing
```

### Static Nature of Scopes

Python uses lexical scoping, which means a variable's scope is determined at code write time:

```python
x = "global"

def func():
    print(x)  # Python determines at compile time that x refers to the global variable

func()  # Output: global

# dynamic scoping languages would look up at runtime, but Python is not one
def caller():
    x = "local in caller"
    func()  # still outputs global, not "local in caller"

caller()  # Output: global
```

### Variable Resolution Timing

An important detail is that Python determines which scope a variable belongs to at function definition time:

```python
x = 10

def func():
    print(x)  # This line will raise an error!
    x = 20    # because this assignment makes x a local variable

# func()  # UnboundLocalError: local variable 'x' referenced before assignment
```

When Python compiles the `func` function and encounters `x = 20`, it marks `x` as a local variable. But when executing `print(x)`, the local variable `x` hasn't been assigned yet, so it raises `UnboundLocalError`.

### Namespace Dictionaries

Python provides ways to directly access namespaces:

```python
# View the global namespace
print(globals())  # returns a dictionary of the global namespace

# View the local namespace
def show_locals():
    a = 1
    b = 2
    print(locals())  # returns a dictionary of the local namespace

show_locals()  # Output: {'a': 1, 'b': 2}

# dynamically create global variables
globals()['dynamic_var'] = "I was created dynamically"
print(dynamic_var)  # Output: I was created dynamically
```

## Key Points

### Four Scopes in Detail

#### Local Scope

The local scope is the innermost scope, containing variables defined inside a function:

```python
def calculate_area(radius):
    # radius, pi, and area are all local variables
    pi = 3.14159
    area = pi * radius ** 2
    return area

# these variables cannot be accessed outside the function
# print(pi)  # NameError: name 'pi' is not defined
```

#### Enclosing Scope

When functions are nested, inner functions can access variables from outer functions:

```python
def outer_function():
    message = "Hello from outer"  # enclosing variable

    def inner_function():
        # inner_function can access outer_function's variables
        print(message)

    return inner_function

greet = outer_function()
greet()  # Output: Hello from outer
```

Enclosing scope can have multiple levels:

```python
def level1():
    x = "level1"

    def level2():
        y = "level2"

        def level3():
            z = "level3"
            # can access all outer variables
            print(f"x={x}, y={y}, z={z}")

        return level3

    return level2

func = level1()()
func()  # Output: x=level1, y=level2, z=level3
```

#### Global Scope

The global scope contains module-level definitions:

```python
# global variables
APP_NAME = "MyApplication"
VERSION = "1.0.0"

# global function
def global_function():
    pass

# global class
class GlobalClass:
    pass

def use_globals():
    # can read global variables inside a function
    print(f"{APP_NAME} v{VERSION}")

use_globals()  # Output: MyApplication v1.0.0
```

#### Built-in Scope

The built-in scope contains Python's built-in functions, types, and exceptions:

```python
# all of these come from the built-in scope
print(len([1, 2, 3]))  # len is a built-in function
print(type(42))        # type is a built-in function
print(str(123))        # str is a built-in type

# can view all built-in names
import builtins
print(dir(builtins))

# built-in names can be shadowed (but not recommended)
len = lambda x: "I'm not the real len!"
print(len([1, 2, 3]))  # Output: I'm not the real len!

# restore the original len
del len
print(len([1, 2, 3]))  # Output: 3
```

### The global Keyword

The `global` keyword is used to declare in a function that you want to use a global variable, rather than create a local one:

```python
counter = 0

def increment():
    global counter  # declare using global variable counter
    counter += 1

def increment_wrong():
    counter += 1  # without global, this creates a local variable and raises an error

increment()
increment()
print(counter)  # Output: 2

# increment_wrong()  # UnboundLocalError
```

Common uses of `global`:

```python
# Modify a global variable
total = 0

def add_to_total(value):
    global total
    total += value

add_to_total(10)
add_to_total(20)
print(total)  # Output: 30

# Create a global variable inside a function
def create_global():
    global new_variable
    new_variable = "I'm created inside a function but I'm global!"

create_global()
print(new_variable)  # Output: I'm created inside a function but I'm global!

# Multiple global declarations
def multiple_globals():
    global x, y, z
    x = 1
    y = 2
    z = 3

multiple_globals()
print(x, y, z)  # Output: 1 2 3
```

### The nonlocal Keyword

The `nonlocal` keyword is used to declare in a nested function that you want to use a variable from an outer (non-global) function:

```python
def outer():
    count = 0

    def inner():
        nonlocal count  # declare using outer function's count
        count += 1
        return count

    return inner

counter = outer()
print(counter())  # Output: 1
print(counter())  # Output: 2
print(counter())  # Output: 3
```

Differences between `nonlocal` and `global`:

```python
x = "global"

def outer():
    x = "enclosing"

    def inner_with_global():
        global x  # refers to global variable
        x = "modified by global"

    def inner_with_nonlocal():
        nonlocal x  # refers to outer function's variable
        x = "modified by nonlocal"

    inner_with_nonlocal()
    print(f"After nonlocal: {x}")  # Output: After nonlocal: modified by nonlocal

    inner_with_global()
    print(f"After global: {x}")    # still modified by nonlocal

outer()
print(f"Global x: {x}")  # Output: Global x: modified by global
```

`nonlocal` looks up the nearest outer scope:

```python
def level1():
    x = "level1"

    def level2():
        x = "level2"

        def level3():
            nonlocal x  # refers to level2's x
            x = "modified by level3"

        level3()
        print(f"level2 x: {x}")  # Output: level2 x: modified by level3

    level2()
    print(f"level1 x: {x}")  # Output: level1 x: level1 (not modified)

level1()
```

## Code Examples

### Example 1: LEGB Lookup Order

```python
# Built-in
# print, len, str etc are all in the built-in scope

# Global
x = "global x"

def outer():
    # Enclosing
    x = "enclosing x"

    def inner():
        # Local
        x = "local x"
        print(f"Inner sees: {x}")  # finds local x

    inner()
    print(f"Outer sees: {x}")  # finds enclosing x

outer()
print(f"Module sees: {x}")  # finds global x

# Output:
# Inner sees: local x
# Outer sees: enclosing x
# Module sees: global x
```

### Example 2: Namespace Dictionary Operations

```python
def namespace_demo():
    """Demonstrates use of namespace dictionaries"""
    a = 1
    b = 2
    c = 3

    # Get the current local namespace
    local_ns = locals()
    print("Local namespace:", local_ns)

    # Note: locals() returns a copy, modifying it doesn't affect actual variables
    local_ns['a'] = 100
    print(f"a is still: {a}")  # Output: a is still: 1

namespace_demo()

# globals() returns the actual global namespace dictionary
globals()['dynamic_var'] = "dynamically created"
print(dynamic_var)  # Output: dynamically created
```

### Example 3: Using Closures to Create a Counter

```python
def make_counter(start=0, step=1):
    """Create a counter closure"""
    count = start

    def counter():
        nonlocal count
        current = count
        count += step
        return current

    def reset():
        nonlocal count
        count = start

    def get_count():
        return count

    # return multiple closure functions
    counter.reset = reset
    counter.get = get_count

    return counter

# use the counter
counter = make_counter(start=0, step=2)
print(counter())        # Output: 0
print(counter())        # Output: 2
print(counter())        # Output: 4
print(counter.get())    # Output: 6
counter.reset()
print(counter())        # Output: 0
```

### Example 4: Scope and Classes

```python
class MyClass:
    # class attribute (class namespace)
    class_var = "I'm a class variable"

    def __init__(self, value):
        # instance attribute (accessed via self)
        self.instance_var = value

    def method(self):
        # local variable in the method
        local_var = "I'm local to this method"

        # access variables from different scopes
        print(f"Local: {local_var}")
        print(f"Instance: {self.instance_var}")
        print(f"Class: {self.class_var}")  # access via self or class name
        print(f"Class via name: {MyClass.class_var}")

obj = MyClass("instance value")
obj.method()

# Note: variables in class body don't follow the LEGB rule
x = "global"

class Confusing:
    x = "class"

    def method(self):
        print(x)  # outputs "global", not "class"!
        print(self.x)  # outputs "class"

Confusing().method()
```

### Example 5: Closure Pitfalls and Solutions

```python
# Classic loop closure pitfall
def create_multipliers_wrong():
    """Wrong implementation: all functions use the last i value"""
    multipliers = []
    for i in range(5):
        def multiplier(x):
            return x * i  # i is a free variable, resolved at call time
        multipliers.append(multiplier)
    return multipliers

# test the wrong version
mult_wrong = create_multipliers_wrong()
print([m(2) for m in mult_wrong])  # Output: [8, 8, 8, 8, 8]

# Solution 1: use default parameters to capture values
def create_multipliers_v1():
    multipliers = []
    for i in range(5):
        def multiplier(x, i=i):  # i=i captures the current value at definition
            return x * i
        multipliers.append(multiplier)
    return multipliers

mult_v1 = create_multipliers_v1()
print([m(2) for m in mult_v1])  # Output: [0, 2, 4, 6, 8]

# Solution 2: use a closure factory function
def create_multipliers_v2():
    def make_multiplier(i):
        def multiplier(x):
            return x * i
        return multiplier

    return [make_multiplier(i) for i in range(5)]

mult_v2 = create_multipliers_v2()
print([m(2) for m in mult_v2])  # Output: [0, 2, 4, 6, 8]

# Solution 3: use functools.partial
from functools import partial

def multiplier(i, x):
    return x * i

def create_multipliers_v3():
    return [partial(multiplier, i) for i in range(5)]

mult_v3 = create_multipliers_v3()
print([m(2) for m in mult_v3])  # Output: [0, 2, 4, 6, 8]

# Solution 4: use lambda
def create_multipliers_v4():
    return [(lambda x, i=i: x * i) for i in range(5)]

mult_v4 = create_multipliers_v4()
print([m(2) for m in mult_v4])  # Output: [0, 2, 4, 6, 8]
```

### Example 6: Simulating Private Variables

```python
def create_bank_account(initial_balance):
    """Use closures to simulate private variables"""
    # private variables, cannot be accessed directly from outside
    _balance = initial_balance
    _transactions = []

    def _record_transaction(type_, amount):
        """private method"""
        import datetime
        _transactions.append({
            'type': type_,
            'amount': amount,
            'balance_after': _balance,
            'timestamp': datetime.datetime.now()
        })

    def deposit(amount):
        nonlocal _balance
        if amount <= 0:
            raise ValueError("deposit amount must be greater than 0")
        _balance += amount
        _record_transaction('deposit', amount)
        return _balance

    def withdraw(amount):
        nonlocal _balance
        if amount <= 0:
            raise ValueError("withdrawal amount must be greater than 0")
        if amount > _balance:
            raise ValueError("insufficient balance")
        _balance -= amount
        _record_transaction('withdrawal', amount)
        return _balance

    def get_balance():
        return _balance

    def get_statement():
        return _transactions.copy()  # return a copy to prevent external modification

    # return public interface
    return {
        'deposit': deposit,
        'withdraw': withdraw,
        'get_balance': get_balance,
        'get_statement': get_statement
    }

# usage
account = create_bank_account(1000)
print(account['get_balance']())  # Output: 1000
account['deposit'](500)
account['withdraw'](200)
print(account['get_balance']())  # Output: 1300
print(account['get_statement']())

# cannot directly access _balance
# print(account['_balance'])  # KeyError
```

## Best Practices

### Minimize Global Variable Usage

Global variables make code difficult to understand and test. Use local variables and parameter passing instead:

```python
# not recommended
result = []

def process_data(data):
    global result
    result = [x * 2 for x in data]

process_data([1, 2, 3])
print(result)

# recommended
def process_data(data):
    return [x * 2 for x in data]

result = process_data([1, 2, 3])
print(result)
```

### Use Constant Naming Conventions

For global variables that truly need to exist, use uppercase naming to indicate they are constants:

```python
# constants use uppercase
MAX_CONNECTIONS = 100
DEFAULT_TIMEOUT = 30
API_BASE_URL = "https://api.example.com"

# don't modify constants
def get_connection():
    # global MAX_CONNECTIONS  # don't do this
    # MAX_CONNECTIONS = 200   # don't do this
    pass
```

### Avoid Shadowing Built-in Names

Shadowing built-in names can lead to hard-to-debug errors:

```python
# not recommended
list = [1, 2, 3]  # shadows the built-in list type
# list("abc")  # TypeError: 'list' object is not callable

# recommended
my_list = [1, 2, 3]
items = [1, 2, 3]

# common mistakes
id = 123  # shadows built-in id function
type = "user"  # shadows built-in type function
input = "test"  # shadows built-in input function

# recommended: use more descriptive names
user_id = 123
item_type = "user"
user_input = "test"
```

### Explicitly Declare global and nonlocal

If you really need to modify outer variables, declare it explicitly:

```python
def make_accumulator(start=0):
    """Example of explicit nonlocal use"""
    total = start

    def add(value):
        nonlocal total  # explicitly declare intent
        total += value
        return total

    return add

acc = make_accumulator(10)
print(acc(5))   # Output: 15
print(acc(10))  # Output: 25
```

### Prefer Using Classes to Encapsulate State

For complex state management, using classes is clearer than closures:

```python
# using closures (suitable for simple scenarios)
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

# using classes (suitable for complex scenarios)
class Counter:
    def __init__(self, start=0, step=1):
        self._count = start
        self._step = step

    def __call__(self):
        result = self._count
        self._count += self._step
        return result

    def reset(self):
        self._count = 0

    @property
    def count(self):
        return self._count

# classes are easier to extend and test
counter = Counter(start=0, step=2)
print(counter())  # Output: 0
print(counter())  # Output: 2
counter.reset()
print(counter.count)  # Output: 0
```

## Common Pitfalls

### Pitfall 1: UnboundLocalError

```python
x = 10

def func():
    print(x)  # UnboundLocalError!
    x = 20

# Reason: Python discovers x = 20 at compile time and marks x as a local variable
# But when print(x) is executed, the local variable x hasn't been assigned yet

# Solution 1: use global
def func_v1():
    global x
    print(x)
    x = 20

# Solution 2: use a different variable name
def func_v2():
    print(x)
    local_x = 20
```

### Pitfall 2: Variable Sharing in Closures

```python
# problematic code
functions = []
for i in range(3):
    functions.append(lambda: i)

print([f() for f in functions])  # Output: [2, 2, 2], not [0, 1, 2]

# solution: use default parameters
functions = []
for i in range(3):
    functions.append(lambda i=i: i)

print([f() for f in functions])  # Output: [0, 1, 2]
```

### Pitfall 3: Class Scope Doesn't Follow LEGB

```python
x = "global"

class A:
    x = "class A"

    # list comprehensions have their own scope (Python 3)
    y = [x for _ in range(3)]  # what is x here?

# In Python 3, list comprehension's x lookup skips the class scope
print(A.y)  # Output: ['global', 'global', 'global']

# if you want to use class variables
class B:
    x = "class B"
    y = [x for x in [x] * 3]  # trick: introduce an iterable that uses the class variable

    # or a clearer approach
    @classmethod
    def create_y(cls):
        return [cls.x for _ in range(3)]

print(B.y)  # Output: ['class B', 'class B', 'class B']
```

### Pitfall 4: locals() is Read-Only

```python
def modify_locals():
    x = 1
    locals()['x'] = 2  # attempt to modify
    print(x)  # Output: 1, modification is ineffective!

modify_locals()

# but globals() is writable
globals()['new_var'] = "created"
print(new_var)  # Output: created
```

### Pitfall 5: nonlocal Scope Limitations

```python
# nonlocal cannot be used for global variables
x = "global"

def func():
    # nonlocal x  # SyntaxError: no binding for nonlocal 'x' found
    pass

# nonlocal only works in nested functions
def outer():
    x = "enclosing"

    def inner():
        nonlocal x  # correct
        x = "modified"

    inner()
    print(x)  # Output: modified

outer()
```

### Pitfall 6: Mutable Default Arguments and Closures

```python
def make_adder_wrong(items=[]):
    """Wrong example: mutable default argument"""
    def adder(x):
        items.append(x)
        return items
    return adder

add1 = make_adder_wrong()
add2 = make_adder_wrong()

print(add1(1))  # Output: [1]
print(add2(2))  # Output: [1, 2]  # shared the same list!

# correct approach
def make_adder_correct(items=None):
    if items is None:
        items = []

    def adder(x):
        items.append(x)
        return items
    return adder

add1 = make_adder_correct()
add2 = make_adder_correct()

print(add1(1))  # Output: [1]
print(add2(2))  # Output: [2]  # independent lists
```

## Performance Considerations

### Local Variable Access is Fastest

Python optimizes local variable access using the `LOAD_FAST` instruction:

```python
import dis

# global variable access
x = 1

def use_global():
    return x

# local variable access
def use_local():
    x = 1
    return x

print("global variables:")
dis.dis(use_global)
# LOAD_GLOBAL instruction

print("\nlocal variables:")
dis.dis(use_local)
# LOAD_FAST instruction (faster)
```

### Avoid Frequent Global Variable Lookups

```python
import math

# not recommended: look up math.sqrt each time
def calculate_distances_slow(points):
    return [math.sqrt(x**2 + y**2) for x, y in points]

# recommended: save function reference as local variable
def calculate_distances_fast(points):
    sqrt = math.sqrt  # local variable lookup is faster
    return [sqrt(x**2 + y**2) for x, y in points]

# performance test
import timeit

points = [(i, i) for i in range(1000)]

slow_time = timeit.timeit(lambda: calculate_distances_slow(points), number=1000)
fast_time = timeit.timeit(lambda: calculate_distances_fast(points), number=1000)

print(f"slow version: {slow_time:.4f}s")
print(f"fast version: {fast_time:.4f}s")
print(f"speedup: {(slow_time - fast_time) / slow_time * 100:.1f}%")
```

### Closure Memory Overhead

```python
import sys

def create_closure():
    large_list = list(range(10000))

    def inner():
        return len(large_list)

    return inner

# closures keep references to outer variables
closure = create_closure()
# large_list won't be garbage collected

# if you only need certain values, consider computing early
def create_closure_optimized():
    large_list = list(range(10000))
    length = len(large_list)  # compute early

    def inner():
        return length  # only keep reference to length

    return inner
    # large_list can be garbage collected
```

### Performance Impact of Lookup Order

```python
import timeit

# assume we use a built-in function multiple times
def using_builtin():
    result = []
    for i in range(100):
        result.append(len(str(i)))
    return result

# optimized version: cache built-in functions
def using_local():
    result = []
    _len = len
    _str = str
    _append = result.append
    for i in range(100):
        _append(_len(_str(i)))
    return result

print("using built-in functions:", timeit.timeit(using_builtin, number=10000))
print("using local cache:", timeit.timeit(using_local, number=10000))
```

## Real-World Scenarios

### Scenario 1: Configuration Management

```python
"""Use module-level variables to manage configuration"""

# config.py
_config = {
    'debug': False,
    'database_url': 'sqlite:///app.db',
    'max_connections': 100
}

def get_config(key, default=None):
    """Get a configuration item"""
    return _config.get(key, default)

def set_config(key, value):
    """Set a configuration item"""
    _config[key] = value

def update_config(**kwargs):
    """Batch update configuration"""
    _config.update(kwargs)

# usage
# from config import get_config, set_config
#
# debug = get_config('debug')
# set_config('debug', True)
```

### Scenario 2: Scope in Decorators

```python
from functools import wraps
import time

def retry(max_attempts=3, delay=1):
    """Retry decorator with parameters"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            last_exception = None

            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    last_exception = e
                    if attempts < max_attempts:
                        time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def unstable_operation():
    import random
    if random.random() < 0.7:
        raise ValueError("random failure")
    return "success"

# usage
try:
    result = unstable_operation()
    print(result)
except ValueError:
    print("final failure")
```

### Scenario 3: State Machine Implementation

```python
def create_traffic_light():
    """Implement a state machine using closures"""
    current_state = 'red'

    states = {
        'red': {'next': 'green', 'duration': 30},
        'green': {'next': 'yellow', 'duration': 25},
        'yellow': {'next': 'red', 'duration': 5}
    }

    def get_state():
        return current_state

    def get_duration():
        return states[current_state]['duration']

    def next_state():
        nonlocal current_state
        current_state = states[current_state]['next']
        return current_state

    def set_state(state):
        nonlocal current_state
        if state in states:
            current_state = state
        else:
            raise ValueError(f"invalid state: {state}")

    return {
        'get_state': get_state,
        'get_duration': get_duration,
        'next': next_state,
        'set': set_state
    }

# usage
light = create_traffic_light()
print(f"current: {light['get_state']()}, duration: {light['get_duration']()}s")  # red, 30s
light['next']()
print(f"current: {light['get_state']()}, duration: {light['get_duration']()}s")  # green, 25s
```

### Scenario 4: Caching/Memoization

```python
from functools import wraps

def memoize(func):
    """Universal memoization decorator"""
    cache = {}

    @wraps(func)
    def wrapper(*args, **kwargs):
        # create cache key
        key = (args, tuple(sorted(kwargs.items())))

        if key not in cache:
            cache[key] = func(*args, **kwargs)

        return cache[key]

    # provide cache clearing method
    wrapper.cache_clear = lambda: cache.clear()
    wrapper.cache_info = lambda: {'size': len(cache), 'keys': list(cache.keys())}

    return wrapper

@memoize
def fibonacci(n):
    """Calculate Fibonacci sequence"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# usage
print(fibonacci(100))  # fast computation
print(fibonacci.cache_info())  # view cache status
```

### Scenario 5: Dependency Injection Container

```python
def create_container():
    """Simple dependency injection container"""
    _services = {}
    _singletons = {}

    def register(name, factory, singleton=False):
        """Register a service"""
        _services[name] = {
            'factory': factory,
            'singleton': singleton
        }

    def resolve(name):
        """Resolve a service"""
        if name not in _services:
            raise KeyError(f"service not registered: {name}")

        service = _services[name]

        if service['singleton']:
            if name not in _singletons:
                _singletons[name] = service['factory'](resolve)
            return _singletons[name]

        return service['factory'](resolve)

    def clear():
        """Clear all registrations"""
        _services.clear()
        _singletons.clear()

    return {
        'register': register,
        'resolve': resolve,
        'clear': clear
    }

# usage
container = create_container()

# register services
container['register']('config', lambda _: {'debug': True}, singleton=True)
# container['register']('logger', lambda c: Logger(c('config')))
# container['register']('database', lambda c: Database(c('config')), singleton=True)

# resolve services
# config = container['resolve']('config')
# logger = container['resolve']('logger')
```

## Interview Tips

### Common Interview Questions

#### Explain Python's LEGB Rule

**Key points in answer**:
- L (Local): variables inside a function
- E (Enclosing): variables in outer nested functions
- G (Global): module-level variables
- B (Built-in): Python's built-in names
- Lookup order is L -> E -> G -> B

#### Difference Between global and nonlocal

```python
# global: declare to use a global variable inside a function
x = "global"

def func():
    global x
    x = "modified"  # modifies global variable

# nonlocal: declare to use a variable from an outer function inside a nested function
def outer():
    x = "enclosing"

    def inner():
        nonlocal x
        x = "modified"  # modifies outer function's variable

    inner()
```

#### What Does This Code Output? Why?

```python
x = 1

def func():
    x += 1
    return x

print(func())
```

**Answer**: Raises `UnboundLocalError`. Because `x += 1` is equivalent to `x = x + 1`, Python marks `x` as a local variable at compile time, but when reading `x`, it hasn't been assigned yet.

#### Explain Variable Capture in Closures

```python
def make_functions():
    funcs = []
    for i in range(3):
        funcs.append(lambda: i)
    return funcs

result = [f() for f in make_functions()]
print(result)  # what is output?
```

**Answer**: Outputs `[2, 2, 2]`. Closures capture variable references, not values. When the loop ends, `i` equals 2.

#### How to Create a Global Variable Inside a Function?

```python
def create_global():
    global new_var
    new_var = "I'm global now"

create_global()
print(new_var)  # Output: I'm global now
```

#### Difference Between locals() and globals()

```python
x = "global"

def func():
    y = "local"
    print(locals())   # returns a copy of local namespace {'y': 'local'}
    print(globals())  # returns actual global namespace dictionary

    # modifying locals() won't affect actual variables
    locals()['y'] = "changed"
    print(y)  # still "local"

    # modifying globals() will affect actual variables
    globals()['x'] = "changed"
    print(x)  # now "changed"
```

### Interview Answer Template

When asked to "explain Python's scope and namespaces":

1. **Definition**:
   - A namespace is a mapping from names to objects (a dictionary)
   - A scope is a region of code where you can access a namespace

2. **LEGB Rule**: Explain the four levels and lookup order

3. **Keywords**:
   - `global`: access/modify global variables inside a function
   - `nonlocal`: access/modify outer function's variables in nested functions

4. **Important Points**:
   - Variable scope is determined at compile time
   - Closures capture variable references, not values
   - Avoid shadowing built-in names

5. **Best Practices**:
   - Minimize global variable usage
   - Use classes to encapsulate complex state
   - Be aware of closure pitfalls in loops

## Further Reading

### Official Documentation

- [Python Scopes and Namespaces](https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces)
- [Execution Model - Naming and Binding](https://docs.python.org/3/reference/executionmodel.html#naming-and-binding)
- [The global Statement](https://docs.python.org/3/reference/simple_stmts.html#the-global-statement)
- [The nonlocal Statement](https://docs.python.org/3/reference/simple_stmts.html#the-nonlocal-statement)

### Recommended Books

- Fluent Python, Chapter 7: Function Decorators and Closures
- Python Cookbook, Chapter 7: Functions
- Effective Python, Item 21: Know How Closures Interact with Variable Scope

### Related Topics

- **Closures**: Deep dive into creating and using closures
- **Decorators**: Application of scope in decorators
- **Descriptors**: Another mechanism for attribute access control
- **Metaclasses**: Namespace handling during class creation

## Summary

Python's scope and namespace are foundational to understanding variable access and management. Key takeaways:

1. **LEGB Rule**: Local -> Enclosing -> Global -> Built-in lookup order
2. **Static Scoping**: Variable scope is determined at code write time, not at runtime
3. **global and nonlocal**: Used to declare using outer variables in inner scopes
4. **Namespace Dictionaries**: `globals()` and `locals()` provide access to namespaces
5. **Closure Characteristics**: Capture variable references, not values; be aware of loop pitfalls

Mastering these concepts is essential for:
- Writing clear, maintainable code
- Understanding and using closures and decorators
- Avoiding common variable scope errors
- Passing technical interviews

In practical development, follow best practices like minimizing global variables and avoiding shadowing built-in names to write more Pythonic code.
