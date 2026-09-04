---
title: Python Control Flow
description: Master Python conditional statements, loops and flow control
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - Control Flow
  - Conditionals
  - Loops
status: imported
origin: old/src/content/docs/python/control-flow.en.md
divergence: 0.342
issues: []
legacy:
  category: Python
  subcategory: Language Basics
  order: 2
  lastUpdated: 2026-01-07
---

Control flow statements allow you to control the execution order of your Python programs. They enable decision-making, repetition, and advanced flow control mechanisms that are fundamental to programming logic.

## Conditional Statements

Conditional statements allow your program to make decisions based on conditions.

### If Statement

The `if` statement executes a block of code only if a specified condition is true.

```python
age = 18

if age >= 18:
    print("You are an adult")
```

### If-Else Statement

The `else` clause provides an alternative block of code when the condition is false.

```python
temperature = 15

if temperature > 20:
    print("It's warm outside")
else:
    print("It's cold outside")
```

### If-Elif-Else Statement

The `elif` (else if) clause allows you to check multiple conditions in sequence.

```python
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

print(f"Your grade is: {grade}")
```

### Nested Conditionals

You can nest conditional statements within each other for complex decision-making.

```python
age = 25
has_license = True

if age >= 18:
    if has_license:
        print("You can drive")
    else:
        print("You need a license to drive")
else:
    print("You are too young to drive")
```

### Conditional Expressions (Ternary Operator)

Python supports a concise way to write simple if-else statements in a single line.

```python
age = 20
status = "adult" if age >= 18 else "minor"
print(status)  # Output: adult

# More complex example
x = 10
y = 20
max_value = x if x > y else y
print(f"Maximum value: {max_value}")
```

## For Loops

For loops iterate over sequences (lists, tuples, strings, etc.) or other iterable objects.

### Basic For Loop

```python
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)

# Output:
# apple
# banana
# cherry
```

### Iterating Over Strings

```python
word = "Python"

for letter in word:
    print(letter, end=" ")

# Output: P y t h o n
```

### Using range()

The `range()` function generates a sequence of numbers.

```python
# Range with single argument (stop)
for i in range(5):
    print(i, end=" ")
# Output: 0 1 2 3 4

print()

# Range with start and stop
for i in range(2, 6):
    print(i, end=" ")
# Output: 2 3 4 5

print()

# Range with start, stop, and step
for i in range(0, 10, 2):
    print(i, end=" ")
# Output: 0 2 4 6 8
```

### Iterating with enumerate()

`enumerate()` provides both the index and value while iterating.

```python
colors = ["red", "green", "blue"]

for index, color in colors:
    print(f"Index {index}: {color}")

# Output:
# Index 0: red
# Index 1: green
# Index 2: blue

# Starting enumeration from 1
for index, color in enumerate(colors, start=1):
    print(f"Color {index}: {color}")
```

### Iterating Over Dictionaries

```python
student_scores = {"Alice": 95, "Bob": 87, "Charlie": 92}

# Iterate over keys
for name in student_scores:
    print(name)

# Iterate over values
for score in student_scores.values():
    print(score)

# Iterate over key-value pairs
for name, score in student_scores.items():
    print(f"{name}: {score}")
```

### Nested For Loops

```python
# Multiplication table
for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i} x {j} = {i * j}")
    print()  # Blank line after each table
```

### List Comprehensions

A concise way to create lists using for loops.

```python
# Basic list comprehension
squares = [x**2 for x in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]
print(even_squares)  # [0, 4, 16, 36, 64]

# Nested list comprehension
matrix = [[i * j for j in range(3)] for i in range(3)]
print(matrix)  # [[0, 0, 0], [0, 1, 2], [0, 2, 4]]
```

## While Loops

While loops continue executing as long as a condition remains true.

### Basic While Loop

```python
count = 0

while count < 5:
    print(f"Count: {count}")
    count += 1

# Output:
# Count: 0
# Count: 1
# Count: 2
# Count: 3
# Count: 4
```

### While Loop with User Input

```python
password = ""

while password != "secret":
    password = input("Enter password: ")

print("Access granted!")
```

### Infinite Loop (with Break)

```python
while True:
    command = input("Enter command (or 'quit' to exit): ")

    if command == "quit":
        break

    print(f"You entered: {command}")

print("Program ended")
```

### While Loop with Counter

```python
number = 100

while number > 0:
    print(number)
    number //= 2  # Integer division

# Output: 100 50 25 12 6 3 1
```

## Break and Continue

These statements modify the normal flow of loops.

### Break Statement

The `break` statement terminates the loop entirely.

```python
# Finding first even number
numbers = [1, 3, 5, 8, 9, 10, 11]

for num in numbers:
    if num % 2 == 0:
        print(f"First even number: {num}")
        break

# Output: First even number: 8
```

### Continue Statement

The `continue` statement skips the rest of the current iteration and moves to the next one.

```python
# Print only odd numbers
for i in range(10):
    if i % 2 == 0:
        continue
    print(i, end=" ")

# Output: 1 3 5 7 9
```

### Break and Continue in Nested Loops

```python
# Break only breaks the innermost loop
for i in range(3):
    print(f"\nOuter loop: {i}")
    for j in range(3):
        if j == 2:
            break
        print(f"  Inner loop: {j}")

# Continue in nested loops
for i in range(3):
    for j in range(3):
        if j == 1:
            continue
        print(f"i={i}, j={j}")
```

### Practical Example: Input Validation

```python
while True:
    try:
        age = int(input("Enter your age: "))

        if age < 0:
            print("Age cannot be negative. Try again.")
            continue

        if age > 150:
            print("Age seems unrealistic. Try again.")
            continue

        break  # Valid input, exit loop
    except ValueError:
        print("Please enter a valid number.")

print(f"Your age is: {age}")
```

## Else Clause with Loops

Python uniquely allows an `else` clause with loops. The else block executes only if the loop completes normally (without encountering a `break`).

### Else with For Loop

```python
# Searching for an item
numbers = [1, 2, 3, 4, 5]
search = 6

for num in numbers:
    if num == search:
        print(f"Found {search}!")
        break
else:
    print(f"{search} not found in the list")

# Output: 6 not found in the list
```

### Else with While Loop

```python
# Prime number checker
num = 29
is_prime = True

if num < 2:
    is_prime = False
else:
    i = 2
    while i * i <= num:
        if num % i == 0:
            is_prime = False
            break
        i += 1
    else:
        is_prime = True

if is_prime:
    print(f"{num} is prime")
else:
    print(f"{num} is not prime")
```

### Practical Example: Password Attempts

```python
max_attempts = 3
attempt = 0
correct_password = "python123"

while attempt < max_attempts:
    password = input("Enter password: ")

    if password == correct_password:
        print("Login successful!")
        break

    attempt += 1
    remaining = max_attempts - attempt
    if remaining > 0:
        print(f"Incorrect. {remaining} attempts remaining.")
else:
    print("Account locked due to too many failed attempts.")
```

## Match Statement

Introduced in Python 3.10, the `match` statement provides structural pattern matching, similar to switch statements in other languages but more powerful.

### Basic Match Statement

```python
def http_status(status):
    match status:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500:
            return "Internal Server Error"
        case _:
            return "Unknown Status"

print(http_status(200))  # Output: OK
print(http_status(403))  # Output: Unknown Status
```

### Match with Multiple Values

```python
def day_type(day):
    match day:
        case "Saturday" | "Sunday":
            return "Weekend"
        case "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday":
            return "Weekday"
        case _:
            return "Invalid day"

print(day_type("Saturday"))  # Output: Weekend
print(day_type("Monday"))    # Output: Weekday
```

### Match with Patterns

```python
def describe_point(point):
    match point:
        case (0, 0):
            return "Origin"
        case (0, y):
            return f"On Y-axis at y={y}"
        case (x, 0):
            return f"On X-axis at x={x}"
        case (x, y):
            return f"Point at ({x}, {y})"
        case _:
            return "Not a point"

print(describe_point((0, 0)))    # Output: Origin
print(describe_point((0, 5)))    # Output: On Y-axis at y=5
print(describe_point((3, 4)))    # Output: Point at (3, 4)
```

### Match with Conditions (Guards)

```python
def categorize_number(num):
    match num:
        case n if n < 0:
            return "Negative"
        case 0:
            return "Zero"
        case n if n > 0 and n < 10:
            return "Small positive"
        case n if n >= 10:
            return "Large positive"

print(categorize_number(-5))   # Output: Negative
print(categorize_number(0))    # Output: Zero
print(categorize_number(5))    # Output: Small positive
print(categorize_number(15))   # Output: Large positive
```

### Match with Class Patterns

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def describe_location(point):
    match point:
        case Point(x=0, y=0):
            return "At origin"
        case Point(x=0, y=y):
            return f"On Y-axis at {y}"
        case Point(x=x, y=0):
            return f"On X-axis at {x}"
        case Point(x=x, y=y) if x == y:
            return f"On diagonal at ({x}, {y})"
        case Point(x=x, y=y):
            return f"At ({x}, {y})"

p1 = Point(0, 0)
p2 = Point(5, 5)
print(describe_location(p1))  # Output: At origin
print(describe_location(p2))  # Output: On diagonal at (5, 5)
```

### Match with Lists

```python
def process_command(command):
    match command:
        case ["quit"]:
            return "Quitting..."
        case ["load", filename]:
            return f"Loading {filename}"
        case ["save", filename]:
            return f"Saving to {filename}"
        case ["delete", *files]:
            return f"Deleting {len(files)} files"
        case _:
            return "Unknown command"

print(process_command(["quit"]))              # Output: Quitting...
print(process_command(["load", "data.txt"]))  # Output: Loading data.txt
print(process_command(["delete", "a.txt", "b.txt", "c.txt"]))
# Output: Deleting 3 files
```

### Match with Dictionaries

```python
def process_user(user):
    match user:
        case {"name": name, "role": "admin"}:
            return f"Admin: {name}"
        case {"name": name, "role": "user", "premium": True}:
            return f"Premium user: {name}"
        case {"name": name, "role": "user"}:
            return f"Regular user: {name}"
        case {"name": name}:
            return f"User: {name}"
        case _:
            return "Invalid user data"

print(process_user({"name": "Alice", "role": "admin"}))
# Output: Admin: Alice

print(process_user({"name": "Bob", "role": "user", "premium": True}))
# Output: Premium user: Bob
```

## Best Practices

### Avoid Deep Nesting

Instead of deeply nested conditions, use early returns or guard clauses.

```python
# Bad
def process_data(data):
    if data is not None:
        if len(data) > 0:
            if data[0] != "":
                return data[0].upper()
    return None

# Good
def process_data(data):
    if data is None:
        return None
    if len(data) == 0:
        return None
    if data[0] == "":
        return None
    return data[0].upper()
```

### Use Meaningful Conditions

```python
# Bad
if x > 0 and x < 100 and y > 0 and y < 100:
    pass

# Good
def is_valid_coordinate(x, y):
    return 0 < x < 100 and 0 < y < 100

if is_valid_coordinate(x, y):
    pass
```

### Prefer `for` Over `while` When Possible

```python
# Less Pythonic
i = 0
while i < len(items):
    print(items[i])
    i += 1

# More Pythonic
for item in items:
    print(item)
```

### Use `enumerate()` Instead of Manual Indexing

```python
# Bad
for i in range(len(items)):
    print(f"{i}: {items[i]}")

# Good
for i, item in enumerate(items):
    print(f"{i}: {item}")
```

### Avoid Infinite Loops Without Exit Conditions

```python
# Always ensure there's a way out
while True:
    user_input = input("Enter command: ")

    if user_input == "exit":
        break

    # Process command
```

### Use Match for Multiple Conditions (Python 3.10+)

```python
# Instead of multiple if-elif
match status_code:
    case 200:
        handle_success()
    case 404:
        handle_not_found()
    case 500:
        handle_server_error()
    case _:
        handle_unknown()
```

### Keep Loop Bodies Short

If a loop body is too long, extract it into a function.

```python
# Bad
for item in items:
    # 50 lines of code
    pass

# Good
def process_item(item):
    # 50 lines of code
    pass

for item in items:
    process_item(item)
```

## Conclusion

Python's control flow structures provide powerful tools for directing program execution:

- **Conditional statements** (`if`, `elif`, `else`) enable decision-making
- **For loops** iterate over sequences efficiently
- **While loops** continue based on conditions
- **Break and continue** modify loop behavior
- **Else clauses with loops** provide elegant handling of loop completion
- **Match statements** offer powerful pattern matching (Python 3.10+)

Mastering these control flow mechanisms is essential for writing clear, efficient, and maintainable Python code. Practice combining these structures to solve complex programming challenges while keeping your code readable and Pythonic.
