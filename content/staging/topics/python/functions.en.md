---
title: Python Functions
description: Deep dive into Python function definition, parameters, return values and advanced features
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - Functions
  - Parameters
  - Return Values
status: imported
origin: old/src/content/docs/python/functions.en.md
divergence: 0.215
issues: []
legacy:
  category: Python
  subcategory: Language Basics
  order: 3
  lastUpdated: 2026-01-07
---

Functions are fundamental building blocks in Python that allow you to organize code into reusable, modular pieces. They encapsulate specific tasks and can be called multiple times throughout your program, promoting code reusability and maintainability.

## Function Definition

A function in Python is defined using the `def` keyword, followed by the function name, parentheses, and a colon. The function body is indented.

### Basic Syntax

```python
def function_name():
    """This is a docstring"""
    # Function body
    print("Hello from a function!")

# Calling the function
function_name()
```

### Naming Conventions

Function names should:
- Use lowercase letters
- Separate words with underscores (snake_case)
- Be descriptive and indicate what the function does

```python
def calculate_area():
    pass

def send_email_notification():
    pass

def validate_user_input():
    pass
```

## Parameters and Arguments

Parameters are variables listed in the function definition, while arguments are the actual values passed to the function when it's called.

### Positional Parameters

Positional parameters are the most basic type. Arguments must be passed in the correct order.

```python
def greet(name, greeting):
    return f"{greeting}, {name}!"

# Correct order
print(greet("Alice", "Hello"))  # Output: Hello, Alice!

# Wrong order produces different result
print(greet("Hello", "Alice"))  # Output: Alice, Hello!
```

### Keyword Arguments

Keyword arguments allow you to specify arguments by parameter name, making the function call more readable and order-independent.

```python
def create_profile(username, email, age):
    return {
        'username': username,
        'email': email,
        'age': age
    }

# Using keyword arguments (order doesn't matter)
profile = create_profile(age=25, username="john_doe", email="john@example.com")
print(profile)

# Mixing positional and keyword arguments
profile = create_profile("jane_doe", age=30, email="jane@example.com")
```

**Important Rule**: Positional arguments must come before keyword arguments.

```python
# Correct
greet("Alice", greeting="Hi")

# SyntaxError: positional argument follows keyword argument
# greet(name="Alice", "Hi")
```

### Default Parameters

Default parameters have preset values that are used when no argument is provided.

```python
def power(base, exponent=2):
    return base ** exponent

print(power(5))      # Output: 25 (uses default exponent=2)
print(power(5, 3))   # Output: 125 (uses provided exponent=3)
```

**Important Consideration**: Mutable default arguments can lead to unexpected behavior.

```python
# Problematic code
def add_item(item, item_list=[]):
    item_list.append(item)
    return item_list

print(add_item("apple"))   # Output: ['apple']
print(add_item("banana"))  # Output: ['apple', 'banana'] - Unexpected!

# Better approach
def add_item(item, item_list=None):
    if item_list is None:
        item_list = []
    item_list.append(item)
    return item_list

print(add_item("apple"))   # Output: ['apple']
print(add_item("banana"))  # Output: ['banana'] - Expected!
```

### Positional-Only Parameters

Introduced in Python 3.8, parameters before `/` can only be passed positionally.

```python
def divide(numerator, denominator, /):
    return numerator / denominator

# Correct
print(divide(10, 2))  # Output: 5.0

# TypeError: divide() got some positional-only arguments passed as keyword arguments
# print(divide(numerator=10, denominator=2))
```

### Keyword-Only Parameters

Parameters after `*` can only be passed as keyword arguments.

```python
def create_user(username, *, email, age):
    return {
        'username': username,
        'email': email,
        'age': age
    }

# Correct
user = create_user("john", email="john@example.com", age=25)

# TypeError: create_user() takes 1 positional argument but 3 were given
# user = create_user("john", "john@example.com", 25)
```

## Advanced Parameter Features

### *args: Variable Positional Arguments

`*args` allows a function to accept any number of positional arguments. The arguments are collected into a tuple.

```python
def sum_all(*numbers):
    total = 0
    for num in numbers:
        total += num
    return total

print(sum_all(1, 2, 3))           # Output: 6
print(sum_all(1, 2, 3, 4, 5))     # Output: 15
print(sum_all())                   # Output: 0
```

```python
def print_info(name, *hobbies):
    print(f"Name: {name}")
    print(f"Hobbies: {', '.join(hobbies)}")

print_info("Alice", "reading", "hiking", "photography")
# Output:
# Name: Alice
# Hobbies: reading, hiking, photography
```

### **kwargs: Variable Keyword Arguments

`**kwargs` allows a function to accept any number of keyword arguments. The arguments are collected into a dictionary.

```python
def create_product(**attributes):
    product = {}
    for key, value in attributes.items():
        product[key] = value
    return product

laptop = create_product(
    name="Laptop",
    price=999.99,
    brand="TechCorp",
    ram="16GB",
    storage="512GB SSD"
)
print(laptop)
# Output: {'name': 'Laptop', 'price': 999.99, 'brand': 'TechCorp', 'ram': '16GB', 'storage': '512GB SSD'}
```

### Combining Different Parameter Types

When combining different parameter types, they must follow this order:

1. Positional parameters
2. `*args`
3. Keyword-only parameters
4. `**kwargs`

```python
def complex_function(a, b, *args, key1=None, key2=None, **kwargs):
    print(f"Positional: a={a}, b={b}")
    print(f"*args: {args}")
    print(f"Keyword-only: key1={key1}, key2={key2}")
    print(f"**kwargs: {kwargs}")

complex_function(
    1, 2, 3, 4, 5,
    key1="value1",
    key2="value2",
    extra1="extra_value1",
    extra2="extra_value2"
)
# Output:
# Positional: a=1, b=2
# *args: (3, 4, 5)
# Keyword-only: key1=value1, key2=value2
# **kwargs: {'extra1': 'extra_value1', 'extra2': 'extra_value2'}
```

### Unpacking Arguments

You can unpack sequences and dictionaries when calling functions using `*` and `**`.

```python
def display_coordinates(x, y, z):
    print(f"x={x}, y={y}, z={z}")

# Unpacking a list
coords = [10, 20, 30]
display_coordinates(*coords)  # Output: x=10, y=20, z=30

# Unpacking a dictionary
coord_dict = {'x': 5, 'y': 15, 'z': 25}
display_coordinates(**coord_dict)  # Output: x=5, y=15, z=25
```

## Return Values

Functions can return values using the `return` statement. If no return statement is specified, the function returns `None`.

### Single Return Value

```python
def square(number):
    return number ** 2

result = square(5)
print(result)  # Output: 25
```

### Multiple Return Values

Python functions can return multiple values as a tuple.

```python
def get_statistics(numbers):
    total = sum(numbers)
    count = len(numbers)
    average = total / count if count > 0 else 0
    return total, count, average

stats = get_statistics([10, 20, 30, 40, 50])
print(stats)  # Output: (150, 5, 30.0)

# Unpacking return values
total, count, avg = get_statistics([10, 20, 30, 40, 50])
print(f"Total: {total}, Count: {count}, Average: {avg}")
# Output: Total: 150, Count: 5, Average: 30.0
```

### Early Return

You can use `return` to exit a function early.

```python
def validate_age(age):
    if age < 0:
        return "Invalid: Age cannot be negative"
    if age < 18:
        return "Minor"
    if age < 65:
        return "Adult"
    return "Senior"

print(validate_age(25))   # Output: Adult
print(validate_age(-5))   # Output: Invalid: Age cannot be negative
```

### Returning Functions

Functions can return other functions, enabling advanced patterns like decorators and closures.

```python
def create_multiplier(factor):
    def multiplier(x):
        return x * factor
    return multiplier

times_two = create_multiplier(2)
times_five = create_multiplier(5)

print(times_two(10))   # Output: 20
print(times_five(10))  # Output: 50
```

## Function Annotations

Function annotations provide a way to attach metadata to function parameters and return values. They don't affect the function's behavior but can be used by tools for type checking and documentation.

### Type Hints

```python
def greet(name: str, age: int) -> str:
    return f"Hello {name}, you are {age} years old"

result = greet("Alice", 30)
print(result)  # Output: Hello Alice, you are 30 years old
```

### Complex Type Hints

Using the `typing` module for more complex type hints:

```python
from typing import List, Dict, Tuple, Optional, Union

def process_data(
    items: List[str],
    config: Dict[str, int],
    optional_param: Optional[str] = None
) -> Tuple[int, str]:
    count = len(items)
    message = f"Processed {count} items"
    return count, message

# Function with Union type
def parse_value(value: Union[int, str]) -> int:
    if isinstance(value, str):
        return int(value)
    return value

print(parse_value(42))     # Output: 42
print(parse_value("42"))   # Output: 42
```

### Generic Type Hints

```python
from typing import TypeVar, List

T = TypeVar('T')

def get_first_element(items: List[T]) -> T:
    return items[0] if items else None

print(get_first_element([1, 2, 3]))        # Output: 1
print(get_first_element(["a", "b", "c"])) # Output: a
```

### Accessing Annotations

Annotations are stored in the `__annotations__` attribute.

```python
def add(a: int, b: int) -> int:
    return a + b

print(add.__annotations__)
# Output: {'a': <class 'int'>, 'b': <class 'int'>, 'return': <class 'int'>}
```

## Docstrings

Docstrings are string literals that appear as the first statement in a function, providing documentation about what the function does.

### Single-Line Docstrings

```python
def square(x):
    """Return the square of x."""
    return x ** 2
```

### Multi-Line Docstrings

Following the Google or NumPy style guide:

```python
def calculate_bmi(weight, height):
    """
    Calculate Body Mass Index (BMI).

    Args:
        weight (float): Weight in kilograms
        height (float): Height in meters

    Returns:
        float: BMI value

    Raises:
        ValueError: If weight or height is negative or zero

    Examples:
        >>> calculate_bmi(70, 1.75)
        22.857142857142858
    """
    if weight <= 0 or height <= 0:
        raise ValueError("Weight and height must be positive")
    return weight / (height ** 2)
```

### NumPy Style Docstring

```python
def fetch_user_data(user_id, include_history=False):
    """
    Fetch user data from the database.

    Parameters
    ----------
    user_id : int
        The unique identifier for the user
    include_history : bool, optional
        Whether to include user history (default is False)

    Returns
    -------
    dict
        A dictionary containing user information

    Notes
    -----
    This function queries the database and may take time
    for users with extensive history.
    """
    pass
```

### Accessing Docstrings

```python
def example_function():
    """This is an example function."""
    pass

print(example_function.__doc__)  # Output: This is an example function.
help(example_function)  # Displays formatted docstring
```

## Best Practices

### Keep Functions Small and Focused

Each function should do one thing well.

```python
# Good: Single responsibility
def validate_email(email):
    return "@" in email and "." in email.split("@")[1]

def send_email(to, subject, body):
    # Email sending logic
    pass

# Less ideal: Multiple responsibilities
def validate_and_send_email(email, subject, body):
    if "@" in email and "." in email.split("@")[1]:
        # Email sending logic
        pass
```

### Use Descriptive Names

```python
# Good
def calculate_total_price(items, tax_rate):
    pass

# Less clear
def calc(i, t):
    pass
```

### Avoid Side Effects When Possible

```python
# Pure function (no side effects)
def add(a, b):
    return a + b

# Function with side effects
counter = 0
def increment():
    global counter
    counter += 1  # Modifies global state
```

### Use Type Hints

```python
def process_items(items: List[str], limit: int = 10) -> List[str]:
    return items[:limit]
```

### Document Your Functions

```python
def complex_calculation(data: List[float]) -> Dict[str, float]:
    """
    Perform complex statistical calculations on the data.

    Args:
        data: List of numerical values to analyze

    Returns:
        Dictionary containing statistical measures
    """
    pass
```

### Handle Errors Appropriately

```python
def divide(a: float, b: float) -> float:
    """
    Divide two numbers.

    Args:
        a: Numerator
        b: Denominator

    Returns:
        Result of division

    Raises:
        ValueError: If denominator is zero
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

### Use Default Arguments Wisely

```python
# Good: Immutable defaults
def create_message(text, timestamp=None):
    if timestamp is None:
        timestamp = datetime.now()
    return {'text': text, 'timestamp': timestamp}

# Avoid: Mutable defaults
# def add_to_list(item, lst=[]):  # Problematic
#     lst.append(item)
#     return lst
```

## Summary

Python functions are powerful tools for organizing and reusing code. Key takeaways:

- Functions are defined with `def` and can accept various types of parameters
- Positional, keyword, default, and variable-length arguments provide flexibility
- `*args` captures variable positional arguments, `**kwargs` captures variable keyword arguments
- Functions can return single or multiple values
- Type hints and annotations improve code clarity and enable better tooling
- Docstrings provide essential documentation for users of your functions
- Following best practices leads to more maintainable and readable code

By mastering these concepts, you'll be able to write more elegant, reusable, and maintainable Python code.
