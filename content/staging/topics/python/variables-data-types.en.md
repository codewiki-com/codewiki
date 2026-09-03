---
title: Python Variables and Data Types
description: Deep dive into Python variable declaration, basic data types, type conversion and dynamic typing
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - Variables
  - Data Types
  - Dynamic Typing
status: imported
origin: old/src/content/docs/python/variables-data-types.en.md
divergence: 0.163
issues: []
legacy:
  category: Python
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

Python is a dynamically-typed language that offers flexibility and simplicity in variable declaration and data manipulation. Understanding variables and data types is fundamental to writing effective Python code.

## Variable Declaration

In Python, variables are created when you assign a value to them. There's no need for explicit type declaration or initialization keywords like in some other languages.

### Basic Variable Assignment

```python
# Simple variable assignment
name = "Alice"
age = 30
height = 5.6
is_student = False

# Multiple assignment
x, y, z = 1, 2, 3

# Assigning the same value to multiple variables
a = b = c = 0
```

### Variable Naming Rules

Python variable names must follow these rules:

- Must start with a letter (a-z, A-Z) or underscore (_)
- Can contain letters, numbers, and underscores
- Cannot start with a number
- Are case-sensitive (`myVar` and `myvar` are different)
- Cannot use Python keywords (like `if`, `for`, `class`, etc.)

```python
# Valid variable names
user_name = "Bob"
_private_var = 42
userName2 = "Charlie"
CONSTANT_VALUE = 100

# Invalid variable names (will cause errors)
# 2users = "Invalid"  # Cannot start with number
# user-name = "Invalid"  # Hyphens not allowed
# for = "Invalid"  # Cannot use keywords
```

### Naming Conventions

```python
# snake_case for variables and functions (PEP 8 standard)
user_count = 10
total_price = 99.99

# UPPER_CASE for constants
MAX_CONNECTIONS = 100
PI = 3.14159

# PascalCase for class names
class UserProfile:
    pass

# Single underscore prefix for internal use
_internal_variable = "hidden"

# Double underscore prefix for name mangling
__private_attribute = "very private"
```

## Basic Data Types

Python has several built-in data types. Let's explore the fundamental ones.

### Integer (`int`)

Integers are whole numbers without decimal points. Python 3 supports arbitrary precision integers, meaning they can be as large as your memory allows.

```python
# Integer examples
positive_num = 42
negative_num = -17
zero = 0
large_num = 10**100  # 10 to the power of 100

# Different number representations
binary = 0b1010  # Binary (equals 10)
octal = 0o12     # Octal (equals 10)
hexadecimal = 0xA  # Hexadecimal (equals 10)

print(binary, octal, hexadecimal)  # Output: 10 10 10

# Underscores for readability (Python 3.6+)
million = 1_000_000
billion = 1_000_000_000
```

### Float (`float`)

Floating-point numbers represent decimal values. They are implemented using double precision (64-bit).

```python
# Float examples
price = 19.99
temperature = -5.5
scientific = 1.5e-4  # Scientific notation (0.00015)

# Float precision
result = 0.1 + 0.2
print(result)  # Output: 0.30000000000000004 (floating-point precision issue)

# Using decimal for precise calculations
from decimal import Decimal
precise_result = Decimal('0.1') + Decimal('0.2')
print(precise_result)  # Output: 0.3
```

### String (`str`)

Strings are sequences of characters enclosed in single, double, or triple quotes.

```python
# String creation
single_quote = 'Hello'
double_quote = "World"
triple_single = '''Multi-line
string'''
triple_double = """Another
multi-line string"""

# String concatenation
greeting = "Hello" + " " + "World"  # "Hello World"

# String repetition
repeated = "Ha" * 3  # "HaHaHa"

# String formatting
name = "Alice"
age = 30

# f-strings (Python 3.6+, recommended)
message = f"My name is {name} and I'm {age} years old"

# format() method
message = "My name is {} and I'm {} years old".format(name, age)

# % formatting (older style)
message = "My name is %s and I'm %d years old" % (name, age)

# String methods
text = "  Python Programming  "
print(text.strip())       # "Python Programming"
print(text.lower())       # "  python programming  "
print(text.upper())       # "  PYTHON PROGRAMMING  "
print(text.replace("Python", "Java"))  # "  Java Programming  "

# String indexing and slicing
word = "Python"
print(word[0])      # 'P' (first character)
print(word[-1])     # 'n' (last character)
print(word[0:3])    # 'Pyt' (characters 0 to 2)
print(word[::2])    # 'Pto' (every second character)
print(word[::-1])   # 'nohtyP' (reversed)
```

### Boolean (`bool`)

Booleans represent truth values: `True` or `False`. Note the capitalization.

```python
# Boolean values
is_active = True
is_logged_in = False

# Boolean operations
a = True
b = False

print(a and b)  # False (logical AND)
print(a or b)   # True (logical OR)
print(not a)    # False (logical NOT)

# Comparison operations return booleans
print(5 > 3)    # True
print(10 == 10) # True
print(7 != 7)   # False

# Truthy and falsy values
# Falsy values: False, None, 0, 0.0, '', [], {}, ()
# Everything else is truthy

print(bool(0))      # False
print(bool(1))      # True
print(bool(""))     # False
print(bool("text")) # True
print(bool([]))     # False
print(bool([1]))    # True
```

### None Type (`NoneType`)

`None` represents the absence of a value or a null value.

```python
# None usage
result = None
uninitialized = None

# Checking for None
if result is None:
    print("No result available")

# None is different from False or 0
print(None == False)  # False
print(None == 0)      # False
print(None is None)   # True (use 'is' to check for None)

# Functions without explicit return return None
def no_return():
    pass

output = no_return()
print(output)  # None
```

## Type Conversion

Type conversion (or type casting) is the process of converting one data type to another.

### Implicit Type Conversion

Python automatically converts data types when needed without user intervention.

```python
# Integer and float addition
num_int = 10
num_float = 5.5
result = num_int + num_float  # 15.5 (automatically converted to float)
print(type(result))  # <class 'float'>
```

### Explicit Type Conversion

You can manually convert between types using constructor functions.

```python
# Converting to integer
float_to_int = int(3.9)      # 3 (truncates decimal)
str_to_int = int("42")       # 42
bool_to_int = int(True)      # 1

# Converting to float
int_to_float = float(10)     # 10.0
str_to_float = float("3.14") # 3.14

# Converting to string
int_to_str = str(42)         # "42"
float_to_str = str(3.14)     # "3.14"
bool_to_str = str(True)      # "True"

# Converting to boolean
print(bool(1))               # True
print(bool(0))               # False
print(bool("text"))          # True
print(bool(""))              # False

# Handling conversion errors
try:
    invalid = int("hello")
except ValueError as e:
    print(f"Conversion error: {e}")
```

### Advanced Conversions

```python
# String to list
text = "Python"
char_list = list(text)  # ['P', 'y', 't', 'h', 'o', 'n']

# List to string
words = ['Hello', 'World']
sentence = ' '.join(words)  # "Hello World"

# String to numbers with different bases
binary_str = "1010"
decimal = int(binary_str, 2)  # 10 (binary to decimal)

hex_str = "FF"
decimal = int(hex_str, 16)    # 255 (hexadecimal to decimal)
```

## Dynamic Typing

Python is a dynamically-typed language, meaning variable types are determined at runtime and can change during program execution.

### Type Flexibility

```python
# Variable can hold different types
variable = 42           # int
print(type(variable))   # <class 'int'>

variable = "Hello"      # str
print(type(variable))   # <class 'str'>

variable = [1, 2, 3]    # list
print(type(variable))   # <class 'list'>
```

### Advantages of Dynamic Typing

```python
# Flexible function parameters
def process_data(data):
    """Works with different data types"""
    if isinstance(data, str):
        return data.upper()
    elif isinstance(data, int):
        return data * 2
    elif isinstance(data, list):
        return len(data)
    return None

print(process_data("hello"))    # "HELLO"
print(process_data(10))         # 20
print(process_data([1, 2, 3]))  # 3
```

### Type Hints (Python 3.5+)

While Python is dynamically typed, you can add optional type hints for better code documentation and IDE support.

```python
# Type hints for variables
age: int = 30
name: str = "Alice"
height: float = 5.6
is_student: bool = False

# Type hints for functions
def greet(name: str) -> str:
    return f"Hello, {name}!"

def add_numbers(a: int, b: int) -> int:
    return a + b

# Type hints for collections (requires typing module)
from typing import List, Dict, Tuple, Optional

numbers: List[int] = [1, 2, 3, 4]
user_data: Dict[str, str] = {"name": "Alice", "city": "NYC"}
coordinates: Tuple[float, float] = (10.5, 20.3)
optional_value: Optional[str] = None  # Can be str or None

# Note: Type hints are not enforced at runtime
# They're mainly for documentation and static type checkers
result: int = "not an integer"  # No error at runtime
```

## Type Checking

Understanding how to check and verify data types is crucial for writing robust Python code.

### Using `type()`

```python
# type() returns the exact type of an object
print(type(42))          # <class 'int'>
print(type(3.14))        # <class 'float'>
print(type("text"))      # <class 'str'>
print(type(True))        # <class 'bool'>
print(type(None))        # <class 'NoneType'>

# Comparing types
x = 10
if type(x) == int:
    print("x is an integer")

# Not recommended for inheritance checking
```

### Using `isinstance()`

```python
# isinstance() is preferred (works with inheritance)
x = 10
print(isinstance(x, int))        # True
print(isinstance(x, (int, float)))  # True (checks multiple types)

# Better for type checking
data = "Hello"
if isinstance(data, str):
    print(data.upper())

# Works with custom classes
class Animal:
    pass

class Dog(Animal):
    pass

dog = Dog()
print(isinstance(dog, Dog))     # True
print(isinstance(dog, Animal))  # True (inheritance)
print(type(dog) == Animal)      # False (exact type check)
```

### Type Checking Best Practices

```python
# Duck typing: "If it walks like a duck and quacks like a duck..."
def process_iterable(items):
    """Works with any iterable, not just lists"""
    try:
        for item in items:
            print(item)
    except TypeError:
        print("Object is not iterable")

process_iterable([1, 2, 3])      # Works with list
process_iterable((1, 2, 3))      # Works with tuple
process_iterable("abc")          # Works with string

# EAFP: Easier to Ask for Forgiveness than Permission
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Cannot divide by zero"
    except TypeError:
        return "Invalid types for division"
```

## Best Practices

### Use Meaningful Variable Names

```python
# Bad
x = 25
d = {"n": "Alice", "a": 30}

# Good
age = 25
user_info = {"name": "Alice", "age": 30}
```

### Follow PEP 8 Naming Conventions

```python
# Constants in UPPER_CASE
MAX_RETRIES = 3
API_KEY = "your-api-key"

# Variables and functions in snake_case
user_count = 100
def calculate_total_price():
    pass

# Classes in PascalCase
class UserProfile:
    pass
```

### Initialize Variables Properly

```python
# Explicit initialization
total = 0
items = []
user_data = None

# Avoid undefined variables
# print(undefined_var)  # NameError
```

### Use Type Hints for Complex Functions

```python
from typing import List, Dict

def calculate_average(numbers: List[float]) -> float:
    """Calculate the average of a list of numbers."""
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)

def get_user_data(user_id: int) -> Dict[str, str]:
    """Retrieve user data by ID."""
    return {"id": str(user_id), "name": "User"}
```

### Be Careful with Mutable Default Arguments

```python
# Bad: Mutable default argument
def add_item(item, items=[]):  # Don't do this!
    items.append(item)
    return items

list1 = add_item(1)  # [1]
list2 = add_item(2)  # [1, 2] - Unexpected!

# Good: Use None as default
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

list1 = add_item(1)  # [1]
list2 = add_item(2)  # [2] - As expected
```

### Use Constants for Magic Numbers

```python
# Bad
if age > 18:
    allow_access = True

# Good
LEGAL_AGE = 18
if age > LEGAL_AGE:
    allow_access = True
```

## Common Pitfalls

### Integer Division Confusion

```python
# Python 3: / always returns float
result = 10 / 3      # 3.3333333333333335

# Use // for integer division
result = 10 // 3     # 3

# Python 2 behavior (for reference, don't use in Python 3)
# 10 / 3 would give 3 (integer division)
```

### String Concatenation with Numbers

```python
# Error: Cannot concatenate string and integer
# message = "Age: " + 30  # TypeError

# Correct approaches
message = "Age: " + str(30)          # "Age: 30"
message = f"Age: {30}"               # "Age: 30" (f-string)
message = "Age: {}".format(30)       # "Age: 30" (format)
```

### Comparing Floats

```python
# Floating-point precision issues
a = 0.1 + 0.2
b = 0.3
print(a == b)  # False (due to floating-point representation)

# Use math.isclose() for float comparison
import math
print(math.isclose(a, b))  # True

# Or round for display purposes
print(round(a, 10) == round(b, 10))  # True
```

### Type Confusion with Boolean

```python
# In Python, True == 1 and False == 0
print(True == 1)   # True
print(False == 0)  # True

# Be explicit when checking for boolean values
is_active = 1
if is_active:  # This works but might be confusing
    pass

# Better
if is_active == 1:
    pass

# Or use explicit boolean
is_active = bool(1)  # True
if is_active:
    pass
```

### Mutable vs Immutable Types

```python
# Immutable types (int, float, str, tuple, bool)
x = 10
y = x
y = 20
print(x)  # 10 (x unchanged)

# Mutable types (list, dict, set)
list1 = [1, 2, 3]
list2 = list1  # Both refer to same object
list2.append(4)
print(list1)  # [1, 2, 3, 4] (list1 changed too!)

# Use copy to avoid this
list1 = [1, 2, 3]
list2 = list1.copy()  # or list(list1) or list1[:]
list2.append(4)
print(list1)  # [1, 2, 3] (unchanged)
```

### None Comparison

```python
# Always use 'is' or 'is not' with None
value = None

# Correct
if value is None:
    print("Value is None")

# Incorrect (works but not recommended)
if value == None:
    print("Value is None")

# None is a singleton
a = None
b = None
print(a is b)  # True (same object in memory)
```

### Variable Scope Issues

```python
# Global vs local scope
count = 0

def increment():
    # This creates a new local variable
    count = count + 1  # UnboundLocalError

# Solution 1: Use global keyword
count = 0

def increment():
    global count
    count = count + 1

# Solution 2: Return new value
count = 0

def increment(value):
    return value + 1

count = increment(count)
```

## Summary

Understanding Python variables and data types is fundamental to writing effective Python code:

- **Variables** don't require explicit type declaration and are dynamically typed
- **Basic data types** include `int`, `float`, `str`, `bool`, and `None`
- **Type conversion** can be implicit or explicit using constructor functions
- **Dynamic typing** provides flexibility but requires careful type checking
- **Type hints** improve code documentation without enforcing types at runtime
- **Best practices** include meaningful naming, proper initialization, and following PEP 8
- **Common pitfalls** include float precision, mutable default arguments, and scope issues

Master these concepts to build a strong foundation for Python programming. Remember that Python's philosophy emphasizes readability and simplicity, so write code that is clear and explicit about its intentions.
