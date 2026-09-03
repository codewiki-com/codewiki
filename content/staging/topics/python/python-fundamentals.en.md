---
title: Python Programming Fundamentals
description: Master Python programming basics for solid foundation
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - Programming Basics
  - Data Types
  - Functions
status: imported
origin: old/src/content/docs/backend/python-fundamentals.en.md
divergence: 0.214
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Backend
  subcategory: Python
  order: 9
  lastUpdated: 2026-01-07
---

## Concept Overview: What is Python?

Python is a high-level, interpreted programming language known for its clear syntax and readability. Created by Guido van Rossum and first released in 1991, Python has become one of the most popular programming languages in the world, powering everything from web applications to data science pipelines and artificial intelligence systems.

### Core Characteristics

Python is distinguished by several fundamental characteristics:

- **Readable Syntax**: Uses indentation to define code blocks, making code visually clean and easy to understand
- **Dynamically Typed**: Variables don't require explicit type declarations; types are determined at runtime
- **Interpreted Language**: Code is executed line by line without needing a separate compilation step
- **Multi-Paradigm**: Supports procedural, object-oriented, and functional programming styles
- **Extensive Standard Library**: Comes with a rich set of built-in modules for common tasks
- **Cross-Platform**: Runs on Windows, Linux, macOS, and many other platforms

### Ideal Use Cases

Python excels in specific scenarios:

```
1. Web development (Django, Flask, FastAPI)
2. Data science and machine learning (NumPy, Pandas, TensorFlow)
3. Automation and scripting
4. API development and backend services
5. Scientific computing and research
6. DevOps and infrastructure tools
```

## Data Types

Understanding Python's data types is fundamental to writing effective code. Python provides several built-in data types that serve as building blocks for all programs.

### Numeric Types

Python supports three distinct numeric types for handling different kinds of numerical data:

```python
# Integers - whole numbers with no decimal point
age = 25
population = 7_900_000_000  # Underscores for readability
binary_value = 0b1010       # Binary literal (equals 10)
hex_value = 0xFF            # Hexadecimal literal (equals 255)

# Floats - numbers with decimal points
price = 19.99
scientific = 3.14e-10       # Scientific notation
infinity = float('inf')     # Positive infinity

# Complex numbers - numbers with real and imaginary parts
complex_num = 3 + 4j
another_complex = complex(2, 5)  # Creates 2 + 5j

# Numeric operations
result = 10 / 3      # Division: 3.3333...
floor_div = 10 // 3  # Floor division: 3
remainder = 10 % 3   # Modulo: 1
power = 2 ** 10      # Exponentiation: 1024

# Type checking and conversion
print(type(age))              # <class 'int'>
print(isinstance(price, float))  # True
converted = int(19.99)        # Converts to 19
```

### Strings

Strings are sequences of characters used to represent text. Python provides rich functionality for string manipulation:

```python
# String creation
single_quoted = 'Hello, World!'
double_quoted = "Hello, World!"
multiline = """This is a
multiline string that spans
multiple lines."""

# Raw strings - ignore escape sequences
path = r'C:\Users\name\documents'

# String formatting methods
name = "Alice"
age = 30

# f-strings (Python 3.6+) - recommended approach
greeting = f"Hello, {name}! You are {age} years old."
formatted_number = f"Price: ${19.99:.2f}"  # Price: $19.99

# format() method
template = "Hello, {}! You are {} years old.".format(name, age)

# % formatting (older style)
old_style = "Hello, %s! You are %d years old." % (name, age)

# String methods
text = "  Python Programming  "
print(text.strip())           # "Python Programming"
print(text.lower())           # "  python programming  "
print(text.upper())           # "  PYTHON PROGRAMMING  "
print(text.replace("Python", "Java"))  # "  Java Programming  "
print(text.split())           # ['Python', 'Programming']

# String slicing
word = "Python"
print(word[0])       # 'P' - first character
print(word[-1])      # 'n' - last character
print(word[0:3])     # 'Pyt' - characters 0-2
print(word[::2])     # 'Pto' - every second character
print(word[::-1])    # 'nohtyP' - reversed

# String membership and searching
sentence = "Python is awesome"
print("Python" in sentence)    # True
print(sentence.find("is"))     # 7 (index where "is" starts)
print(sentence.count("o"))     # 2

# String joining
words = ["Python", "is", "great"]
joined = " ".join(words)       # "Python is great"
```

### Boolean Type

Booleans represent truth values and are essential for control flow:

```python
# Boolean values
is_active = True
is_deleted = False

# Boolean operations
print(True and False)   # False
print(True or False)    # True
print(not True)         # False

# Truthy and Falsy values
# Falsy values: False, None, 0, 0.0, '', [], {}, set()
# Everything else is truthy

# Practical examples
empty_list = []
if not empty_list:  # Empty list is falsy
    print("List is empty")

# Boolean comparison
x = 5
print(x > 3)        # True
print(x == 5)       # True
print(x != 5)       # False
print(1 < x < 10)   # True (chained comparison)
```

### Lists

Lists are ordered, mutable sequences that can contain elements of any type:

```python
# List creation
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True, None]
nested = [[1, 2], [3, 4], [5, 6]]
empty = []

# Using list constructor
from_range = list(range(5))  # [0, 1, 2, 3, 4]
from_string = list("hello")  # ['h', 'e', 'l', 'l', 'o']

# Accessing elements
print(fruits[0])         # "apple"
print(fruits[-1])        # "cherry"
print(fruits[1:3])       # ["banana", "cherry"]

# Modifying lists
fruits.append("orange")        # Add to end
fruits.insert(1, "grape")      # Insert at index
fruits.extend(["mango", "kiwi"])  # Add multiple items
fruits[0] = "pear"            # Replace element

# Removing elements
fruits.remove("banana")       # Remove by value
popped = fruits.pop()         # Remove and return last
popped_at = fruits.pop(1)     # Remove and return at index
del fruits[0]                 # Delete by index
fruits.clear()                # Remove all elements

# List operations
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
print(len(numbers))           # 8
print(sum(numbers))           # 31
print(min(numbers))           # 1
print(max(numbers))           # 9
print(numbers.count(1))       # 2
print(numbers.index(5))       # 4

# Sorting
numbers.sort()                # Sort in place
numbers.sort(reverse=True)    # Sort descending
sorted_nums = sorted(numbers)  # Return new sorted list

# List comprehensions
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
matrix = [[i*j for j in range(3)] for i in range(3)]

# Filtering with comprehension
words = ["apple", "banana", "cherry", "date"]
long_words = [w for w in words if len(w) > 5]
upper_words = [w.upper() for w in words]
```

### Tuples

Tuples are ordered, immutable sequences. Once created, their elements cannot be changed:

```python
# Tuple creation
coordinates = (10, 20)
single_element = (42,)        # Note the comma
empty_tuple = ()
from_list = tuple([1, 2, 3])

# Accessing elements (same as lists)
print(coordinates[0])         # 10
print(coordinates[-1])        # 20

# Tuple unpacking
x, y = coordinates
print(f"x: {x}, y: {y}")      # x: 10, y: 20

# Extended unpacking
first, *rest = (1, 2, 3, 4, 5)
print(first)                  # 1
print(rest)                   # [2, 3, 4, 5]

# Tuple methods
numbers = (1, 2, 3, 2, 4, 2)
print(numbers.count(2))       # 3
print(numbers.index(3))       # 2

# Named tuples for structured data
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(10, 20)
print(p.x, p.y)              # 10 20
print(p[0], p[1])            # 10 20

# Use cases: function returns, dictionary keys, constant data
def get_user_info():
    return ("Alice", 30, "alice@example.com")

name, age, email = get_user_info()
```

### Dictionaries

Dictionaries are mutable mappings of key-value pairs with fast lookup:

```python
# Dictionary creation
user = {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com"
}
empty_dict = {}
from_pairs = dict([("a", 1), ("b", 2)])
from_kwargs = dict(name="Bob", age=25)

# Accessing values
print(user["name"])           # "Alice"
print(user.get("phone"))      # None (no KeyError)
print(user.get("phone", "N/A"))  # "N/A" (default value)

# Modifying dictionaries
user["phone"] = "123-456-7890"  # Add new key
user["age"] = 31                # Update existing
user.update({"city": "NYC", "country": "USA"})

# Removing entries
del user["email"]              # Delete by key
phone = user.pop("phone")      # Remove and return value
last_item = user.popitem()     # Remove and return last pair

# Dictionary methods
print(user.keys())             # dict_keys(['name', 'age', ...])
print(user.values())           # dict_values(['Alice', 31, ...])
print(user.items())            # dict_items([('name', 'Alice'), ...])

# Iterating over dictionaries
for key in user:
    print(f"{key}: {user[key]}")

for key, value in user.items():
    print(f"{key}: {value}")

# Dictionary comprehensions
squares = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Filtering with comprehension
filtered = {k: v for k, v in user.items() if isinstance(v, str)}

# Merging dictionaries (Python 3.9+)
defaults = {"theme": "light", "language": "en"}
settings = {"language": "es", "notifications": True}
merged = defaults | settings  # settings overrides defaults

# Nested dictionaries
company = {
    "name": "TechCorp",
    "employees": {
        "engineering": ["Alice", "Bob"],
        "marketing": ["Charlie", "Diana"]
    }
}
print(company["employees"]["engineering"][0])  # "Alice"
```

### Sets

Sets are unordered collections of unique elements, ideal for membership testing and removing duplicates:

```python
# Set creation
fruits = {"apple", "banana", "cherry"}
empty_set = set()             # Note: {} creates an empty dict
from_list = set([1, 2, 2, 3, 3, 3])  # {1, 2, 3}

# Adding and removing elements
fruits.add("orange")
fruits.update(["mango", "kiwi"])
fruits.remove("banana")       # Raises KeyError if not found
fruits.discard("grape")       # No error if not found
popped = fruits.pop()         # Remove and return arbitrary element

# Set operations
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)    # Union: {1, 2, 3, 4, 5, 6}
print(a & b)    # Intersection: {3, 4}
print(a - b)    # Difference: {1, 2}
print(a ^ b)    # Symmetric difference: {1, 2, 5, 6}

# Set comparisons
print(a.issubset(b))          # False
print({3, 4}.issubset(a))     # True
print(a.issuperset({1, 2}))   # True
print(a.isdisjoint({7, 8}))   # True (no common elements)

# Membership testing (very fast - O(1))
numbers = set(range(1000000))
print(999999 in numbers)      # True - instant lookup

# Frozen sets (immutable sets)
frozen = frozenset([1, 2, 3])
# frozen.add(4)  # AttributeError - cannot modify

# Set comprehensions
evens = {x for x in range(20) if x % 2 == 0}
```

### None Type

None represents the absence of a value and is Python's null equivalent:

```python
# None usage
result = None

# Checking for None
if result is None:
    print("No result available")

# Default function parameters
def greet(name=None):
    if name is None:
        name = "Guest"
    return f"Hello, {name}!"

# None as default return
def process_data(data):
    if not data:
        return None  # Explicit return of None
    return data.upper()

# Optional type hints (Python 3.10+)
from typing import Optional

def find_user(user_id: int) -> Optional[dict]:
    # Returns dict or None
    users = {1: {"name": "Alice"}}
    return users.get(user_id)
```

## Control Flow

Control flow statements allow you to direct the execution path of your program based on conditions and repetition.

### Conditional Statements

Python uses if, elif, and else for conditional execution:

```python
# Basic if statement
age = 18

if age >= 18:
    print("You are an adult")

# if-else
temperature = 25

if temperature > 30:
    print("It's hot outside")
else:
    print("The temperature is pleasant")

# if-elif-else chain
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Your grade is: {grade}")  # Your grade is: B

# Conditional expressions (ternary operator)
status = "adult" if age >= 18 else "minor"

# Multiple conditions
x, y, z = 10, 20, 15

if x < y and y > z:
    print("y is the largest")

if x < 5 or x > 8:
    print("x is outside the range 5-8")

# Nested conditions
user_role = "admin"
is_authenticated = True

if is_authenticated:
    if user_role == "admin":
        print("Welcome, Administrator!")
    else:
        print("Welcome, User!")
else:
    print("Please log in")

# Match statement (Python 3.10+)
command = "start"

match command:
    case "start":
        print("Starting the application...")
    case "stop":
        print("Stopping the application...")
    case "restart":
        print("Restarting the application...")
    case _:
        print("Unknown command")

# Pattern matching with structure
point = (0, 5)

match point:
    case (0, 0):
        print("Origin")
    case (0, y):
        print(f"On Y-axis at y={y}")
    case (x, 0):
        print(f"On X-axis at x={x}")
    case (x, y):
        print(f"Point at ({x}, {y})")
```

### Loops

Python provides two main loop constructs: for loops for iterating over sequences and while loops for condition-based repetition:

```python
# For loop basics
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)

# Loop with range
for i in range(5):           # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 8):        # 2, 3, 4, 5, 6, 7
    print(i)

for i in range(0, 10, 2):    # 0, 2, 4, 6, 8
    print(i)

# Enumerate for index and value
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")

for index, fruit in enumerate(fruits, start=1):
    print(f"{index}: {fruit}")  # 1-indexed

# Iterating over dictionaries
user = {"name": "Alice", "age": 30}

for key in user:
    print(f"{key}: {user[key]}")

for key, value in user.items():
    print(f"{key}: {value}")

# While loop
count = 0

while count < 5:
    print(count)
    count += 1

# While with condition
user_input = ""

while user_input.lower() != "quit":
    user_input = input("Enter command (quit to exit): ")
    print(f"You entered: {user_input}")

# Loop control statements
# break - exit the loop immediately
for num in range(10):
    if num == 5:
        break
    print(num)  # Prints 0, 1, 2, 3, 4

# continue - skip to next iteration
for num in range(10):
    if num % 2 == 0:
        continue
    print(num)  # Prints odd numbers: 1, 3, 5, 7, 9

# else clause in loops
# Executes when loop completes normally (no break)
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(f"{n} = {x} * {n//x}")
            break
    else:
        print(f"{n} is prime")

# Nested loops
for i in range(3):
    for j in range(3):
        print(f"({i}, {j})", end=" ")
    print()  # New line

# zip for parallel iteration
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]

for name, age in zip(names, ages):
    print(f"{name} is {age} years old")

# Iterating with multiple sequences
for name, age, city in zip(names, ages, ["NYC", "LA", "Chicago"]):
    print(f"{name}, {age}, {city}")
```

### Exception Handling

Python uses try-except blocks to handle errors gracefully:

```python
# Basic exception handling
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")

# Handling multiple exception types
try:
    value = int(input("Enter a number: "))
    result = 100 / value
except ValueError:
    print("Invalid input - not a number")
except ZeroDivisionError:
    print("Cannot divide by zero")

# Catching multiple exceptions together
try:
    risky_operation()
except (ValueError, TypeError, KeyError) as e:
    print(f"An error occurred: {e}")

# Generic exception catch
try:
    some_function()
except Exception as e:
    print(f"Unexpected error: {type(e).__name__}: {e}")

# else clause - runs if no exception
try:
    value = int("42")
except ValueError:
    print("Conversion failed")
else:
    print(f"Conversion successful: {value}")

# finally clause - always runs
file = None
try:
    file = open("data.txt", "r")
    content = file.read()
except FileNotFoundError:
    print("File not found")
finally:
    if file:
        file.close()
    print("Cleanup complete")

# Raising exceptions
def validate_age(age):
    if age < 0:
        raise ValueError("Age cannot be negative")
    if age > 150:
        raise ValueError("Age seems unrealistic")
    return age

# Re-raising exceptions
try:
    validate_age(-5)
except ValueError as e:
    print(f"Validation error: {e}")
    raise  # Re-raise the same exception

# Custom exceptions
class InsufficientFundsError(Exception):
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"Cannot withdraw ${amount}. Balance is ${balance}"
        )

class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return amount

# Using custom exception
account = BankAccount(100)
try:
    account.withdraw(150)
except InsufficientFundsError as e:
    print(f"Error: {e}")
    print(f"Current balance: ${e.balance}")
```

## Functions

Functions are reusable blocks of code that perform specific tasks. Python provides powerful features for defining and using functions.

### Defining Functions

```python
# Basic function definition
def greet():
    print("Hello, World!")

greet()  # Call the function

# Function with parameters
def greet_user(name):
    print(f"Hello, {name}!")

greet_user("Alice")

# Function with return value
def add(a, b):
    return a + b

result = add(3, 5)  # result = 8

# Multiple return values
def get_stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

minimum, maximum, average = get_stats([1, 2, 3, 4, 5])

# Early return
def is_even(n):
    if n % 2 == 0:
        return True
    return False

# Returning None implicitly
def log_message(message):
    print(f"LOG: {message}")
    # Returns None implicitly
```

### Function Parameters

```python
# Default parameters
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # "Hello, Alice!"
print(greet("Bob", "Hi"))          # "Hi, Bob!"

# Keyword arguments
def create_user(name, age, city="Unknown"):
    return {"name": name, "age": age, "city": city}

user = create_user(name="Alice", age=30, city="NYC")
user = create_user(age=25, name="Bob")  # Order doesn't matter

# *args - variable positional arguments
def calculate_sum(*numbers):
    total = 0
    for num in numbers:
        total += num
    return total

print(calculate_sum(1, 2, 3))      # 6
print(calculate_sum(1, 2, 3, 4, 5))  # 15

# **kwargs - variable keyword arguments
def create_profile(**kwargs):
    profile = {}
    for key, value in kwargs.items():
        profile[key] = value
    return profile

user = create_profile(name="Alice", age=30, city="NYC")

# Combining parameter types
def complex_function(required, *args, default="value", **kwargs):
    print(f"Required: {required}")
    print(f"Args: {args}")
    print(f"Default: {default}")
    print(f"Kwargs: {kwargs}")

complex_function("req", 1, 2, 3, default="custom", extra="data")

# Keyword-only arguments (after *)
def configure(*, host, port, timeout=30):
    return f"Connecting to {host}:{port} with timeout {timeout}s"

# Must use keyword arguments
config = configure(host="localhost", port=8080)

# Positional-only arguments (Python 3.8+, before /)
def divide(a, b, /):
    return a / b

result = divide(10, 2)  # OK
# result = divide(a=10, b=2)  # Error - must be positional
```

### Lambda Functions

Lambda functions are small anonymous functions defined with the lambda keyword:

```python
# Basic lambda
square = lambda x: x ** 2
print(square(5))  # 25

# Lambda with multiple parameters
add = lambda x, y: x + y
print(add(3, 5))  # 8

# Lambda in sorting
students = [
    {"name": "Alice", "grade": 85},
    {"name": "Bob", "grade": 92},
    {"name": "Charlie", "grade": 78}
]

# Sort by grade
sorted_students = sorted(students, key=lambda s: s["grade"])

# Sort by name length
words = ["python", "java", "c", "javascript"]
sorted_words = sorted(words, key=lambda w: len(w))

# Lambda with filter
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = list(filter(lambda x: x % 2 == 0, numbers))

# Lambda with map
squares = list(map(lambda x: x ** 2, numbers))

# Lambda with reduce
from functools import reduce
product = reduce(lambda x, y: x * y, numbers)
```

### Decorators

Decorators modify the behavior of functions without changing their code:

```python
# Basic decorator
def log_call(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Finished {func.__name__}")
        return result
    return wrapper

@log_call
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")
# Output:
# Calling greet
# Hello, Alice!
# Finished greet

# Decorator with arguments
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def say_hello():
    print("Hello!")

say_hello()  # Prints "Hello!" three times

# Preserving function metadata
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """Wrapper function"""
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def example():
    """Example function docstring"""
    pass

print(example.__name__)  # "example" (not "wrapper")
print(example.__doc__)   # "Example function docstring"

# Practical decorator examples
import time

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

def cache(func):
    cached = {}
    @wraps(func)
    def wrapper(*args):
        if args not in cached:
            cached[args] = func(*args)
        return cached[args]
    return wrapper

@timer
@cache
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

### Closures and Scope

```python
# Variable scope
global_var = "I'm global"

def outer_function():
    enclosing_var = "I'm enclosing"

    def inner_function():
        local_var = "I'm local"
        print(local_var)       # Local scope
        print(enclosing_var)   # Enclosing scope
        print(global_var)      # Global scope

    inner_function()

# Modifying global variables
counter = 0

def increment():
    global counter
    counter += 1

# Modifying enclosing variables
def outer():
    count = 0

    def inner():
        nonlocal count
        count += 1
        return count

    return inner

increment_counter = outer()
print(increment_counter())  # 1
print(increment_counter())  # 2

# Closures - functions that remember their enclosing scope
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))   # 10
print(triple(5))   # 15
```

## Object-Oriented Programming

Python supports object-oriented programming with classes, inheritance, encapsulation, and polymorphism.

### Classes and Objects

```python
# Basic class definition
class Dog:
    # Class attribute (shared by all instances)
    species = "Canis familiaris"

    # Constructor (initializer)
    def __init__(self, name, age):
        # Instance attributes
        self.name = name
        self.age = age

    # Instance method
    def bark(self):
        return f"{self.name} says woof!"

    # String representation
    def __str__(self):
        return f"{self.name}, {self.age} years old"

    def __repr__(self):
        return f"Dog('{self.name}', {self.age})"

# Creating instances
buddy = Dog("Buddy", 5)
max_dog = Dog("Max", 3)

# Accessing attributes and methods
print(buddy.name)          # "Buddy"
print(buddy.species)       # "Canis familiaris"
print(buddy.bark())        # "Buddy says woof!"
print(str(buddy))          # "Buddy, 5 years old"

# Modifying attributes
buddy.age = 6
```

### Inheritance

```python
# Parent class
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError("Subclass must implement")

    def move(self):
        return f"{self.name} is moving"

# Child class
class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # Call parent constructor
        self.breed = breed

    def speak(self):
        return f"{self.name} says woof!"

    def fetch(self):
        return f"{self.name} is fetching the ball"

class Cat(Animal):
    def speak(self):
        return f"{self.name} says meow!"

    def scratch(self):
        return f"{self.name} is scratching"

# Using inheritance
dog = Dog("Buddy", "Golden Retriever")
cat = Cat("Whiskers")

print(dog.speak())         # "Buddy says woof!"
print(cat.speak())         # "Whiskers says meow!"
print(dog.move())          # "Buddy is moving" (inherited)

# Polymorphism
animals = [Dog("Rex", "German Shepherd"), Cat("Luna")]
for animal in animals:
    print(animal.speak())  # Each uses its own implementation

# Multiple inheritance
class Flying:
    def fly(self):
        return "Flying through the air"

class Swimming:
    def swim(self):
        return "Swimming in the water"

class Duck(Animal, Flying, Swimming):
    def speak(self):
        return f"{self.name} says quack!"

duck = Duck("Donald")
print(duck.fly())          # "Flying through the air"
print(duck.swim())         # "Swimming in the water"
print(duck.speak())        # "Donald says quack!"

# Method Resolution Order (MRO)
print(Duck.__mro__)
```

### Encapsulation

```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner          # Public attribute
        self._balance = balance     # Protected (convention)
        self.__pin = "1234"         # Private (name mangled)

    # Property getter
    @property
    def balance(self):
        return self._balance

    # Property setter
    @balance.setter
    def balance(self, value):
        if value < 0:
            raise ValueError("Balance cannot be negative")
        self._balance = value

    # Read-only property
    @property
    def account_info(self):
        return f"Account owner: {self.owner}"

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount
            return True
        return False

    def withdraw(self, amount):
        if 0 < amount <= self._balance:
            self._balance -= amount
            return True
        return False

    def _internal_method(self):
        """Protected method - use with caution"""
        pass

    def __private_method(self):
        """Private method - name mangled"""
        pass

# Using the class
account = BankAccount("Alice", 1000)
print(account.balance)     # 1000 (using property)
account.balance = 1500     # Using setter
# account.balance = -100   # Raises ValueError

account.deposit(500)
print(account.balance)     # 2000

# Private attribute access (name mangling)
# print(account.__pin)     # AttributeError
print(account._BankAccount__pin)  # "1234" (not recommended)
```

### Class Methods and Static Methods

```python
class Employee:
    # Class attribute
    employee_count = 0
    raise_percentage = 1.05

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary
        Employee.employee_count += 1

    # Regular instance method
    def apply_raise(self):
        self.salary *= self.raise_percentage

    # Class method - works with class, not instance
    @classmethod
    def set_raise_percentage(cls, percentage):
        cls.raise_percentage = percentage

    @classmethod
    def from_string(cls, employee_string):
        """Alternative constructor"""
        name, salary = employee_string.split("-")
        return cls(name, int(salary))

    # Static method - utility function
    @staticmethod
    def is_workday(day):
        return day.weekday() < 5

# Using class methods
Employee.set_raise_percentage(1.10)  # Affects all instances

emp1 = Employee.from_string("Alice-50000")
emp2 = Employee("Bob", 60000)

print(Employee.employee_count)  # 2

# Using static method
from datetime import date
print(Employee.is_workday(date.today()))
```

### Abstract Classes and Interfaces

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    """Abstract base class for shapes"""

    @abstractmethod
    def area(self):
        """Calculate the area of the shape"""
        pass

    @abstractmethod
    def perimeter(self):
        """Calculate the perimeter of the shape"""
        pass

    def describe(self):
        """Non-abstract method with default implementation"""
        return f"I am a shape with area {self.area()}"

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        import math
        return math.pi * self.radius ** 2

    def perimeter(self):
        import math
        return 2 * math.pi * self.radius

# Cannot instantiate abstract class
# shape = Shape()  # TypeError

rect = Rectangle(5, 3)
circle = Circle(4)

print(rect.area())         # 15
print(circle.area())       # 50.265...
print(rect.describe())     # "I am a shape with area 15"
```

### Magic Methods (Dunder Methods)

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    # String representation
    def __str__(self):
        return f"Vector({self.x}, {self.y})"

    def __repr__(self):
        return f"Vector({self.x!r}, {self.y!r})"

    # Arithmetic operations
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar):
        return self.__mul__(scalar)

    # Comparison
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __lt__(self, other):
        return self.magnitude() < other.magnitude()

    # Length and truthiness
    def __len__(self):
        return 2  # Vector has 2 components

    def __bool__(self):
        return self.x != 0 or self.y != 0

    # Indexing
    def __getitem__(self, index):
        if index == 0:
            return self.x
        elif index == 1:
            return self.y
        raise IndexError("Vector index out of range")

    # Iteration
    def __iter__(self):
        yield self.x
        yield self.y

    # Callable
    def __call__(self):
        return self.magnitude()

    def magnitude(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

# Using magic methods
v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(v1 + v2)        # Vector(4, 6)
print(v1 - v2)        # Vector(2, 2)
print(v1 * 2)         # Vector(6, 8)
print(2 * v1)         # Vector(6, 8)
print(v1 == v2)       # False
print(v1[0])          # 3
print(list(v1))       # [3, 4]
print(v1())           # 5.0 (magnitude)
```

## File I/O

Python provides straightforward methods for reading from and writing to files.

### Reading Files

```python
# Basic file reading
file = open("example.txt", "r")
content = file.read()
file.close()

# Using with statement (recommended - auto-closes file)
with open("example.txt", "r") as file:
    content = file.read()
    print(content)

# Reading line by line
with open("example.txt", "r") as file:
    for line in file:
        print(line.strip())

# Reading all lines into a list
with open("example.txt", "r") as file:
    lines = file.readlines()
    # or
    lines = list(file)

# Reading specific amount
with open("example.txt", "r") as file:
    first_100_chars = file.read(100)
    next_line = file.readline()

# Reading with encoding
with open("unicode.txt", "r", encoding="utf-8") as file:
    content = file.read()

# Reading binary files
with open("image.png", "rb") as file:
    binary_data = file.read()
```

### Writing Files

```python
# Writing to a file (overwrites existing content)
with open("output.txt", "w") as file:
    file.write("Hello, World!\n")
    file.write("This is a new line.\n")

# Writing multiple lines
lines = ["Line 1", "Line 2", "Line 3"]
with open("output.txt", "w") as file:
    file.writelines(line + "\n" for line in lines)

# Appending to a file
with open("log.txt", "a") as file:
    file.write("New log entry\n")

# Writing binary data
with open("binary.dat", "wb") as file:
    file.write(b"\x00\x01\x02\x03")

# Writing with specific encoding
with open("unicode.txt", "w", encoding="utf-8") as file:
    file.write("Hello, World!")
```

### Working with Paths

```python
from pathlib import Path

# Creating Path objects
current_dir = Path(".")
home_dir = Path.home()
config_file = Path("/etc/config.ini")

# Path operations
project_dir = Path("/home/user/project")
source_file = project_dir / "src" / "main.py"

print(source_file.name)        # "main.py"
print(source_file.stem)        # "main"
print(source_file.suffix)      # ".py"
print(source_file.parent)      # "/home/user/project/src"

# Checking paths
print(source_file.exists())
print(source_file.is_file())
print(project_dir.is_dir())

# Listing directory contents
for item in project_dir.iterdir():
    print(item)

# Glob patterns
for py_file in project_dir.glob("**/*.py"):
    print(py_file)

# Reading and writing with Path
config = Path("config.txt")
content = config.read_text()
config.write_text("new content")

# Creating directories
new_dir = Path("new_folder")
new_dir.mkdir(exist_ok=True)
nested_dir = Path("a/b/c")
nested_dir.mkdir(parents=True, exist_ok=True)
```

### Working with JSON

```python
import json

# Writing JSON
data = {
    "name": "Alice",
    "age": 30,
    "cities": ["New York", "London"],
    "active": True
}

# Write to file
with open("data.json", "w") as file:
    json.dump(data, file, indent=2)

# Convert to string
json_string = json.dumps(data, indent=2)

# Reading JSON
with open("data.json", "r") as file:
    loaded_data = json.load(file)

# Parse from string
parsed = json.loads('{"name": "Bob", "age": 25}')

# Custom JSON encoding
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

data_with_date = {"timestamp": datetime.now()}
json_str = json.dumps(data_with_date, cls=DateTimeEncoder)
```

### Working with CSV

```python
import csv

# Writing CSV
with open("users.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Age", "City"])
    writer.writerow(["Alice", 30, "New York"])
    writer.writerow(["Bob", 25, "London"])

# Reading CSV
with open("users.csv", "r") as file:
    reader = csv.reader(file)
    header = next(reader)
    for row in reader:
        name, age, city = row
        print(f"{name} is {age} years old")

# Using DictReader and DictWriter
with open("users.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row["Name"], row["Age"])

with open("output.csv", "w", newline="") as file:
    fieldnames = ["name", "age", "city"]
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({"name": "Alice", "age": 30, "city": "NYC"})
```

## Modules and Packages

Python's module system allows you to organize code into reusable components.

### Importing Modules

```python
# Import entire module
import math
print(math.sqrt(16))       # 4.0
print(math.pi)             # 3.14159...

# Import specific items
from math import sqrt, pi
print(sqrt(16))
print(pi)

# Import with alias
import numpy as np
import pandas as pd

# Import all (not recommended)
from math import *

# Importing from packages
from collections import Counter, defaultdict
from datetime import datetime, timedelta

# Relative imports (within a package)
from . import sibling_module
from .sibling_module import some_function
from .. import parent_module
```

### Creating Modules

```python
# mymodule.py
"""This is a custom module."""

# Module-level constants
PI = 3.14159
VERSION = "1.0.0"

# Module-level functions
def add(a, b):
    """Add two numbers."""
    return a + b

def multiply(a, b):
    """Multiply two numbers."""
    return a * b

# Module-level classes
class Calculator:
    def __init__(self):
        self.result = 0

    def add(self, value):
        self.result += value
        return self

# Private (by convention)
_internal_state = {}

def _helper_function():
    pass

# Code that runs when module is executed directly
if __name__ == "__main__":
    print("Module executed directly")
    print(f"2 + 3 = {add(2, 3)}")
```

### Creating Packages

```
mypackage/
    __init__.py
    module1.py
    module2.py
    subpackage/
        __init__.py
        module3.py
```

```python
# mypackage/__init__.py
"""My Package description."""

from .module1 import function1
from .module2 import function2

__version__ = "1.0.0"
__all__ = ["function1", "function2"]

# mypackage/module1.py
def function1():
    return "Hello from module1"

# mypackage/module2.py
def function2():
    return "Hello from module2"

# Usage
from mypackage import function1, function2
import mypackage
print(mypackage.__version__)
```

### Standard Library Highlights

```python
# os - Operating system interface
import os
print(os.getcwd())              # Current directory
os.makedirs("new/dir", exist_ok=True)
env_var = os.environ.get("PATH")

# sys - System-specific parameters
import sys
print(sys.version)
print(sys.argv)                 # Command line arguments
sys.exit(0)

# datetime - Date and time
from datetime import datetime, timedelta
now = datetime.now()
tomorrow = now + timedelta(days=1)
formatted = now.strftime("%Y-%m-%d %H:%M:%S")

# collections - Container datatypes
from collections import Counter, defaultdict, deque
counter = Counter("hello")      # {'l': 2, 'h': 1, ...}
dd = defaultdict(list)
dd["key"].append(1)

# itertools - Iterator functions
from itertools import chain, cycle, combinations
combined = list(chain([1, 2], [3, 4]))
combs = list(combinations([1, 2, 3], 2))

# functools - Higher-order functions
from functools import lru_cache, partial

@lru_cache(maxsize=128)
def expensive_function(n):
    return n ** 2

add_five = partial(lambda x, y: x + y, 5)

# re - Regular expressions
import re
pattern = r"\d+"
matches = re.findall(pattern, "abc 123 def 456")
result = re.sub(r"\s+", "_", "hello world")

# random - Random number generation
import random
random.randint(1, 100)
random.choice(["a", "b", "c"])
random.shuffle([1, 2, 3, 4, 5])

# typing - Type hints
from typing import List, Dict, Optional, Union, Callable

def process(items: List[int]) -> Dict[str, int]:
    return {"sum": sum(items)}

def maybe_value() -> Optional[str]:
    return None
```

## Best Practices Summary

### Code Style

1. **Follow PEP 8** - Python's official style guide
2. **Use meaningful names** - Variables and functions should be self-documenting
3. **Keep functions small** - Each function should do one thing well
4. **Write docstrings** - Document modules, classes, and functions

### Error Handling

1. **Be specific** - Catch specific exceptions, not generic ones
2. **Fail fast** - Validate input early
3. **Clean up resources** - Use context managers (with statements)
4. **Log errors** - Use logging module instead of print statements

### Performance

1. **Use built-in functions** - They're optimized in C
2. **Use generators** - For large datasets to save memory
3. **Profile first** - Measure before optimizing
4. **Use appropriate data structures** - Sets for membership, dicts for lookup

### Python Idioms

```python
# Swap variables
a, b = b, a

# Unpack iterables
first, *rest, last = [1, 2, 3, 4, 5]

# Check for empty collections
if not my_list:  # Instead of len(my_list) == 0
    pass

# Use enumerate
for i, item in enumerate(items):
    pass

# Use zip for parallel iteration
for a, b in zip(list_a, list_b):
    pass

# Dictionary get with default
value = d.get("key", "default")

# List comprehensions over map/filter
squares = [x**2 for x in range(10)]

# Context managers for resources
with open("file.txt") as f:
    pass

# Use any/all
if any(x > 0 for x in numbers):
    pass

if all(x > 0 for x in numbers):
    pass
```

## Further Reading

### Official Resources

- [Python Official Documentation](https://docs.python.org/3/)
- [Python Enhancement Proposals (PEPs)](https://peps.python.org/)
- [Python Package Index (PyPI)](https://pypi.org/)

### Recommended Books

- "Fluent Python" by Luciano Ramalho
- "Effective Python" by Brett Slatkin
- "Python Cookbook" by David Beazley and Brian K. Jones

### Practice Platforms

- [LeetCode](https://leetcode.com/)
- [HackerRank Python](https://www.hackerrank.com/domains/python)
- [Exercism Python Track](https://exercism.org/tracks/python)

### Related Topics

- **Virtual Environments**: Managing project dependencies
- **Type Hints**: Static type checking with mypy
- **Testing**: unittest, pytest frameworks
- **Debugging**: pdb debugger
- **Package Management**: pip, poetry, conda

---

> We've covered the essential foundations of Python programming. Master these concepts to build a strong base for more advanced topics like web development, data science, or automation. Practice consistently and explore Python's rich ecosystem of libraries to enhance your skills.
