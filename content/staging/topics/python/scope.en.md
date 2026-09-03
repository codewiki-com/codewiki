---
title: Scope and Namespaces
description: Understand Python's scope rules, namespaces, and the LEGB rule
track: python
section: functions-deeper
difficulty: beginner
tags:
  - python
  - scope
  - namespaces
  - legb
  - variables
status: imported
origin: old/src/content/docs/python/scope.en.md
divergence: 0.215
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: Python
  subcategory: Core Concepts
  order: 6
  lastUpdated: 2026-01-07
---


## Introduction

Scope and namespaces are fundamental concepts in Python that determine where variables are accessible and how Python looks up variable names. Understanding these concepts is crucial for writing clean, maintainable code and avoiding common bugs related to variable visibility and naming conflicts.

In this article, we'll explore Python's scoping rules, the different types of scopes, and how to work with the `global` and `nonlocal` keywords.

## What is a Namespace?

A namespace is a mapping from names to objects. Think of it as a dictionary that stores variable names and their corresponding values. Python uses multiple namespaces to organize variables and prevent naming conflicts.

### Types of Namespaces

1. **Built-in Namespace**: Contains built-in functions and exceptions (e.g., `print`, `len`, `ValueError`)
2. **Global Namespace**: Contains variables defined at the module level
3. **Local Namespace**: Contains variables defined inside a function
4. **Enclosing Namespace**: Contains variables from enclosing (outer) functions in nested function scenarios

You can inspect namespaces using these functions:

```python
# View the current local namespace
print(locals())

# View the global namespace
print(globals())

# View the built-in namespace
import builtins
print(dir(builtins))
```

## Understanding Scope

Scope refers to the region of your program where a name is defined and can be accessed. A variable is only accessible within its scope.

### The LEGB Rule

Python resolves variable names using the **LEGB rule**, which defines the order in which Python searches for a variable:

1. **Local (L)**: Inside the current function
2. **Enclosing (E)**: Inside enclosing functions (for nested functions)
3. **Global (G)**: At the top level of the module
4. **Built-in (B)**: In the built-in namespace

Python searches for variables in this exact order. Once a variable is found, the search stops.

### Example of LEGB in Action

```python
# Built-in scope
print()  # Built-in function

# Global scope
x = "global"

def outer_function():
    # Enclosing scope
    y = "enclosing"

    def inner_function():
        # Local scope
        z = "local"

        # Python searches: Local -> Enclosing -> Global -> Built-in
        print(z)  # "local" (found in Local scope)
        print(y)  # "enclosing" (found in Enclosing scope)
        print(x)  # "global" (found in Global scope)
        print(len)  # <built-in function len> (found in Built-in scope)

    inner_function()

outer_function()
```

## Local Scope

Variables defined inside a function belong to the local scope. They are created when the function is called and destroyed when the function returns.

```python
def greet(name):
    message = f"Hello, {name}!"  # Local variable
    print(message)
    return message

greet("Alice")
# print(message)  # NameError: name 'message' is not defined
```

Local variables take precedence over global variables with the same name:

```python
x = "global"

def func():
    x = "local"  # Local variable shadows global variable
    print(x)  # "local"

func()
print(x)  # "global"
```

## Global Scope

Variables defined at the module level (outside any function) belong to the global scope. They can be accessed from anywhere in the module.

```python
name = "Alice"  # Global variable

def greet():
    print(name)  # Can access global variable

greet()  # "Alice"
```

However, you cannot assign to a global variable from within a function without using the `global` keyword:

```python
count = 0

def increment():
    count = count + 1  # UnboundLocalError: local variable 'count' referenced before assignment

increment()
```

This error occurs because Python sees `count = ...` and treats `count` as a local variable throughout the entire function.

### The global Keyword

Use the `global` keyword to declare that a variable is global and allow reassignment:

```python
count = 0

def increment():
    global count
    count = count + 1

increment()
print(count)  # 1

increment()
print(count)  # 2
```

Important notes about `global`:

- The `global` keyword must be used before the variable is referenced
- You can declare multiple global variables at once: `global x, y, z`
- Using `global` for reading is unnecessary; use it for assignment

```python
x = 10

def read_global():
    print(x)  # Can read without 'global'

def modify_global():
    global x
    x = 20  # Must use 'global' to assign

read_global()  # 10
modify_global()
read_global()  # 20
```

## Enclosing Scope and Nested Functions

Enclosing scope applies to nested functions. Variables in an outer function can be accessed by inner functions.

```python
def outer():
    message = "Hello"  # Enclosing scope

    def inner():
        print(message)  # Can access enclosing variable

    inner()

outer()  # "Hello"
```

However, like with global scope, you cannot assign to an enclosing variable without the `nonlocal` keyword:

```python
def outer():
    x = 10

    def inner():
        x = x + 1  # UnboundLocalError
        print(x)

    inner()

outer()
```

### The nonlocal Keyword

Use the `nonlocal` keyword to declare that a variable belongs to an enclosing scope:

```python
def outer():
    x = 10

    def inner():
        nonlocal x
        x = x + 1
        print(x)

    inner()
    print(x)

outer()
# 11
# 11
```

Key differences between `global` and `nonlocal`:

- `global`: Refers to module-level variables
- `nonlocal`: Refers to variables in enclosing functions (but not module level)

```python
x = "global"

def outer():
    x = "enclosing"

    def inner():
        nonlocal x  # Refers to outer's x, not global x
        x = "modified"
        print(x)

    inner()
    print(x)

inner_function()
print(x)

# Output:
# modified
# modified
# global
```

## Built-in Scope

The built-in scope contains pre-defined functions, exceptions, and constants provided by Python.

```python
print(type)  # <class 'type'>
print(len)   # <built-in function len>
print(ValueError)  # <class 'ValueError'>
```

You can access the built-in namespace:

```python
import builtins

print(dir(builtins))  # Lists all built-in names
```

While possible, shadowing built-in names is generally discouraged:

```python
# Avoid this:
len = 5  # Shadows the built-in len() function
print(len([1, 2, 3]))  # TypeError: 'int' object is not callable

# If you need to recover the built-in:
import builtins
print(builtins.len([1, 2, 3]))  # 3
```

## Practical Examples

### Example 1: Function Closure

Closures allow inner functions to access variables from enclosing scopes:

```python
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

times_three = make_multiplier(3)
print(times_three(5))  # 15
print(times_three(10))  # 30
```

### Example 2: Counter with nonlocal

```python
def make_counter():
    count = 0

    def increment():
        nonlocal count
        count += 1
        return count

    def reset():
        nonlocal count
        count = 0

    return increment, reset

inc, reset = make_counter()
print(inc())  # 1
print(inc())  # 2
print(inc())  # 3
reset()
print(inc())  # 1
```

### Example 3: Class and Scope Interaction

```python
x = "global"

class MyClass:
    x = "class"

    def method(self):
        x = "local"
        print(x)  # "local"
        print(self.x)  # "class"
        print(globals()['x'])  # "global"

obj = MyClass()
obj.method()
```

### Example 4: Default Arguments and Late Binding

A common gotcha involves using mutable default arguments:

```python
# Problem: Mutable default arguments are shared
def append_to_list(item, lst=[]):
    lst.append(item)
    return lst

print(append_to_list(1))  # [1]
print(append_to_list(2))  # [1, 2] - Unexpected!

# Solution: Use None and create new list in function
def append_to_list(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

print(append_to_list(1))  # [1]
print(append_to_list(2))  # [2]
```

## Common Mistakes and Best Practices

### Mistake 1: Forgetting global/nonlocal

```python
# Wrong
counter = 0

def increment():
    counter += 1  # UnboundLocalError

# Correct
counter = 0

def increment():
    global counter
    counter += 1
```

### Mistake 2: Shadowing Built-ins

```python
# Avoid
list = []  # Shadows built-in list type
dict = {}  # Shadows built-in dict type

# Use descriptive names instead
items = []
config = {}
```

### Mistake 3: Misunderstanding Late Binding

```python
# Problem: Functions use current value of x
functions = []
for i in range(3):
    def func():
        return i
    functions.append(func)

print([f() for f in functions])  # [2, 2, 2] - Not [0, 1, 2]!

# Solution 1: Use default argument
functions = []
for i in range(3):
    def func(i=i):  # Captures current value of i
        return i
    functions.append(func)

print([f() for f in functions])  # [0, 1, 2]

# Solution 2: Use a closure factory
functions = []
for i in range(3):
    def make_func(n):
        def func():
            return n
        return func
    functions.append(make_func(i))

print([f() for f in functions])  # [0, 1, 2]
```

### Best Practice: Keep Scopes Simple

1. **Minimize global variables**: Use parameters and return values instead
2. **Use descriptive names**: Make variable scope obvious from context
3. **Avoid deep nesting**: Deeply nested functions become hard to understand
4. **Document scope**: Comment when scope behavior is non-obvious

```python
# Good: Clear scope and data flow
def calculate_total(items):
    subtotal = sum(item.price for item in items)
    tax = subtotal * 0.1
    return subtotal + tax

# Avoid: Relying on globals
total_items = []
total = 0

def add_item(item):
    global total
    total_items.append(item)
    total += item.price
```

## Summary

- **Namespace**: A dictionary mapping names to objects
- **Scope**: The region where a name is accessible
- **LEGB Rule**: Local → Enclosing → Global → Built-in (the search order)
- **Local scope**: Inside functions
- **Enclosing scope**: In nested functions
- **Global scope**: Module level
- **Built-in scope**: Pre-defined by Python
- **global keyword**: Declare module-level variables for assignment
- **nonlocal keyword**: Declare enclosing-scope variables for assignment

Understanding scope and namespaces helps you write cleaner code, avoid bugs, and understand how Python manages variable names throughout your program.
