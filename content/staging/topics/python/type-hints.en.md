---
title: Python Type Hints and Type System
description: "Master Python type hints: basic types, generics, Protocol and mypy"
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Type Hints
  - typing
  - mypy
status: imported
origin: old/src/content/docs/python/type-hints.en.md
divergence: 0.222
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Type System
  order: 12
  lastUpdated: 2026-01-07
---

Python is a dynamically typed language, but starting from Python 3.5, type hints were introduced to provide optional static type checking. We'll cover everything you need to know about Python's type system, from basic annotations to advanced features.

## Introduction to Type Hints

Type hints are annotations that specify the expected types of variables, function parameters, and return values. They provide several benefits:

- **Better IDE support**: Code completion, refactoring, and error detection
- **Documentation**: Self-documenting code that's easier to understand
- **Static analysis**: Catch bugs before runtime using tools like mypy
- **Maintainability**: Easier to maintain large codebases

Important note: Type hints are optional and do not affect runtime behavior. Python remains dynamically typed.

```python
# Without type hints
def greet(name):
    return f"Hello, {name}!"

# With type hints
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

## Basic Type Annotations

### Primitive Types

The most common built-in types can be used directly as annotations:

```python
# Basic types
age: int = 25
price: float = 19.99
name: str = "Alice"
is_active: bool = True

# Function with type hints
def add_numbers(a: int, b: int) -> int:
    return a + b

def calculate_discount(price: float, discount: float) -> float:
    return price * (1 - discount)
```

### None Type

Use `None` to indicate a function returns nothing, or `Optional` for values that might be `None`:

```python
from typing import Optional

def log_message(message: str) -> None:
    print(message)
    # No return statement

def find_user(user_id: int) -> Optional[str]:
    # Might return a username or None if not found
    if user_id == 1:
        return "Alice"
    return None

# Python 3.10+ union syntax
def find_user_new(user_id: int) -> str | None:
    if user_id == 1:
        return "Alice"
    return None
```

### Any Type

`Any` is a special type that bypasses type checking:

```python
from typing import Any

def process_data(data: Any) -> Any:
    # Accepts and returns any type
    return data

# Use sparingly - defeats the purpose of type hints
```

## Compound Types

### Lists, Tuples, Sets, and Dictionaries

Use generic container types from the `typing` module (Python 3.9+ allows using built-in types directly):

```python
from typing import List, Tuple, Set, Dict

# Python 3.8 and earlier - use typing module
def process_numbers(numbers: List[int]) -> int:
    return sum(numbers)

def get_coordinates() -> Tuple[float, float]:
    return (40.7128, -74.0060)

def unique_names(names: List[str]) -> Set[str]:
    return set(names)

def count_items(items: List[str]) -> Dict[str, int]:
    return {item: items.count(item) for item in items}

# Python 3.9+ - use built-in types
def process_numbers_new(numbers: list[int]) -> int:
    return sum(numbers)

def get_user_data() -> dict[str, str | int]:
    return {"name": "Alice", "age": 30}
```

### Fixed-Length Tuples

Tuples can have specific types for each position:

```python
from typing import Tuple

# Exactly 3 elements: string, int, bool
def parse_record() -> Tuple[str, int, bool]:
    return ("Alice", 30, True)

# Variable length tuple of same type
def get_scores() -> Tuple[int, ...]:
    return (95, 87, 92, 88)
```

### Union Types

Use `Union` when a value can be one of several types:

```python
from typing import Union

def process_id(user_id: Union[int, str]) -> str:
    return str(user_id)

# Python 3.10+ union syntax (preferred)
def process_id_new(user_id: int | str) -> str:
    return str(user_id)

# Multiple unions
def flexible_function(value: int | str | float | None) -> str:
    if value is None:
        return "No value"
    return str(value)
```

### Callable Types

Type hint for functions and callables:

```python
from typing import Callable

def execute_operation(
    operation: Callable[[int, int], int],
    a: int,
    b: int
) -> int:
    return operation(a, b)

def add(x: int, y: int) -> int:
    return x + y

result = execute_operation(add, 5, 3)  # Returns 8

# Callable with no parameters
def run_callback(callback: Callable[[], None]) -> None:
    callback()

# Callable with variable arguments
from typing import Any
ComplexCallback = Callable[..., Any]
```

## Generics with TypeVar and Generic

Generics allow you to write flexible, reusable code that works with multiple types while maintaining type safety.

### TypeVar Basics

`TypeVar` creates a type variable that can represent any type:

```python
from typing import TypeVar, List

T = TypeVar('T')

def get_first_element(items: List[T]) -> T:
    return items[0]

# Type checker knows the return type matches input type
numbers: List[int] = [1, 2, 3]
first_num: int = get_first_element(numbers)  # Type is int

names: List[str] = ["Alice", "Bob"]
first_name: str = get_first_element(names)  # Type is str
```

### Constrained TypeVar

Restrict a `TypeVar` to specific types:

```python
from typing import TypeVar

# Only allow int or float
Number = TypeVar('Number', int, float)

def double(value: Number) -> Number:
    return value * 2

result1 = double(5)      # Returns int
result2 = double(5.5)    # Returns float
# result3 = double("hi") # Type error!
```

### Bounded TypeVar

Use bounds to require type variables to be subtypes of a specific class:

```python
from typing import TypeVar

class Animal:
    def make_sound(self) -> str:
        return "Some sound"

class Dog(Animal):
    def make_sound(self) -> str:
        return "Woof!"

class Cat(Animal):
    def make_sound(self) -> str:
        return "Meow!"

AnimalType = TypeVar('AnimalType', bound=Animal)

def make_animal_speak(animal: AnimalType) -> AnimalType:
    print(animal.make_sound())
    return animal

dog = Dog()
cat = Cat()
make_animal_speak(dog)  # OK
make_animal_speak(cat)  # OK
# make_animal_speak("not an animal")  # Type error!
```

### Generic Classes

Create classes that work with multiple types:

```python
from typing import Generic, TypeVar, List, Optional

T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: List[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> Optional[T]:
        if self._items:
            return self._items.pop()
        return None

    def peek(self) -> Optional[T]:
        if self._items:
            return self._items[-1]
        return None

# Use with specific types
int_stack: Stack[int] = Stack()
int_stack.push(1)
int_stack.push(2)
value: Optional[int] = int_stack.pop()

str_stack: Stack[str] = Stack()
str_stack.push("hello")
str_stack.push("world")
```

### Multiple Type Parameters

Generics can have multiple type variables:

```python
from typing import Generic, TypeVar

K = TypeVar('K')
V = TypeVar('V')

class Pair(Generic[K, V]):
    def __init__(self, key: K, value: V) -> None:
        self.key = key
        self.value = value

    def get_key(self) -> K:
        return self.key

    def get_value(self) -> V:
        return self.value

# Use with different type combinations
pair1: Pair[str, int] = Pair("age", 30)
pair2: Pair[int, str] = Pair(1, "first")
pair3: Pair[str, list[int]] = Pair("scores", [90, 85, 95])
```

## Protocol for Structural Subtyping

`Protocol` enables structural subtyping (duck typing with type checking). Instead of requiring inheritance, it checks if an object has the required methods and attributes.

### Basic Protocol

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None:
        ...

class Circle:
    def draw(self) -> None:
        print("Drawing a circle")

class Square:
    def draw(self) -> None:
        print("Drawing a square")

def render(shape: Drawable) -> None:
    shape.draw()

# Both work without inheriting from Drawable
circle = Circle()
square = Square()
render(circle)  # OK
render(square)  # OK
```

### Protocol with Attributes

Protocols can specify both methods and attributes:

```python
from typing import Protocol

class SupportsClose(Protocol):
    def close(self) -> None:
        ...

class SupportsReadWrite(Protocol):
    encoding: str

    def read(self, n: int) -> str:
        ...

    def write(self, data: str) -> int:
        ...

class CustomFile:
    encoding: str = "utf-8"

    def read(self, n: int) -> str:
        return ""

    def write(self, data: str) -> int:
        return len(data)

    def close(self) -> None:
        pass

def process_file(file: SupportsReadWrite) -> None:
    content = file.read(100)
    print(f"Encoding: {file.encoding}")

custom = CustomFile()
process_file(custom)  # OK - has required methods and attributes
```

### Generic Protocol

Protocols can be generic:

```python
from typing import Protocol, TypeVar

T = TypeVar('T')

class Comparable(Protocol):
    def __lt__(self, other: 'Comparable') -> bool:
        ...

    def __gt__(self, other: 'Comparable') -> bool:
        ...

def find_max(items: list[Comparable]) -> Comparable:
    return max(items)

# Works with any type that implements comparison
numbers = [1, 5, 3, 9, 2]
max_num = find_max(numbers)

strings = ["apple", "zebra", "banana"]
max_str = find_max(strings)
```

### Runtime Checkable Protocol

Use `@runtime_checkable` to enable `isinstance()` checks:

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Movable(Protocol):
    def move(self, x: int, y: int) -> None:
        ...

class Car:
    def move(self, x: int, y: int) -> None:
        print(f"Moving to ({x}, {y})")

class House:
    pass

car = Car()
house = House()

print(isinstance(car, Movable))    # True
print(isinstance(house, Movable))  # False
```

## TypedDict for Typed Dictionaries

`TypedDict` allows you to specify the structure and types of dictionary keys:

### Basic TypedDict

```python
from typing import TypedDict

class UserDict(TypedDict):
    name: str
    age: int
    email: str

def create_user(user: UserDict) -> None:
    print(f"Creating user: {user['name']}, age {user['age']}")

# Correct usage
user1: UserDict = {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com"
}
create_user(user1)

# Type checker will catch errors
# user2: UserDict = {"name": "Bob"}  # Error: missing 'age' and 'email'
# user3: UserDict = {"name": 123, "age": 30, "email": "test"}  # Error: wrong type
```

### Optional Keys

Mark keys as optional using `total=False` or `NotRequired`:

```python
from typing import TypedDict, NotRequired

# Method 1: total=False makes all keys optional
class ConfigDict(TypedDict, total=False):
    host: str
    port: int
    debug: bool

config1: ConfigDict = {}  # OK
config2: ConfigDict = {"host": "localhost"}  # OK
config3: ConfigDict = {"host": "localhost", "port": 8080, "debug": True}  # OK

# Method 2: NotRequired for specific optional keys (Python 3.11+)
class UserProfile(TypedDict):
    name: str
    age: int
    bio: NotRequired[str]  # Only bio is optional
    avatar: NotRequired[str]  # Only avatar is optional

profile1: UserProfile = {"name": "Alice", "age": 30}  # OK
profile2: UserProfile = {"name": "Bob", "age": 25, "bio": "Developer"}  # OK
```

### Inheritance

TypedDict classes can inherit from other TypedDict classes:

```python
from typing import TypedDict

class BaseUser(TypedDict):
    id: int
    name: str

class AdminUser(BaseUser):
    permissions: list[str]
    is_superuser: bool

admin: AdminUser = {
    "id": 1,
    "name": "Admin",
    "permissions": ["read", "write", "delete"],
    "is_superuser": True
}
```

### Alternative Syntax

Use the functional syntax for dynamic keys:

```python
from typing import TypedDict

# Class-based syntax
class Point2D(TypedDict):
    x: float
    y: float

# Functional syntax
Point3D = TypedDict('Point3D', {'x': float, 'y': float, 'z': float})

# Useful when key names aren't valid identifiers
SpecialDict = TypedDict('SpecialDict', {'special-key': str, '123': int})
```

## Literal Types

`Literal` allows you to specify exact values a variable can have:

### Basic Literal

```python
from typing import Literal

def set_mode(mode: Literal["light", "dark"]) -> None:
    print(f"Setting mode to {mode}")

set_mode("light")  # OK
set_mode("dark")   # OK
# set_mode("blue")  # Type error!

# Function with literal return type
def get_status() -> Literal["success", "error", "pending"]:
    return "success"
```

### Literal with Numbers and Booleans

```python
from typing import Literal

def set_speed(speed: Literal[1, 2, 3, 4, 5]) -> None:
    print(f"Speed set to {speed}")

set_speed(3)   # OK
# set_speed(10)  # Type error!

def is_enabled(flag: Literal[True]) -> None:
    # Only accepts True, not False
    print("Feature is enabled")

is_enabled(True)  # OK
# is_enabled(False)  # Type error!
```

### Combining Literals

```python
from typing import Literal, Union

HttpMethod = Literal["GET", "POST", "PUT", "DELETE"]
Status = Literal[200, 201, 400, 404, 500]

def make_request(method: HttpMethod, status: Status) -> None:
    print(f"{method} request returned {status}")

make_request("GET", 200)  # OK
# make_request("PATCH", 200)  # Type error!

# Combine with Union
Mode = Literal["read"] | Literal["write"] | Literal["append"]
```

### Literal in Overloads

Literals work well with function overloading:

```python
from typing import Literal, overload

@overload
def open_file(path: str, mode: Literal["r"]) -> str:
    ...

@overload
def open_file(path: str, mode: Literal["rb"]) -> bytes:
    ...

def open_file(path: str, mode: Literal["r", "rb"]) -> str | bytes:
    if mode == "r":
        return "text content"
    else:
        return b"binary content"

text = open_file("file.txt", "r")      # Type is str
binary = open_file("file.bin", "rb")  # Type is bytes
```

## Type Aliases

Type aliases create shortcuts for complex type annotations:

### Simple Aliases

```python
from typing import Union, List, Dict

# Simple alias
UserId = int
Username = str

def get_user(user_id: UserId) -> Username:
    return f"user_{user_id}"

# Complex type alias
Vector = List[float]
Matrix = List[Vector]

def multiply_matrix(matrix: Matrix) -> Matrix:
    return matrix

# Union alias
Number = Union[int, float]
# or in Python 3.10+
Number = int | float

def calculate(value: Number) -> Number:
    return value * 2
```

### NewType for Distinct Types

Use `NewType` to create distinct types that prevent accidental mixing:

```python
from typing import NewType

UserId = NewType('UserId', int)
ProductId = NewType('ProductId', int)

def get_user(user_id: UserId) -> str:
    return f"User {user_id}"

def get_product(product_id: ProductId) -> str:
    return f"Product {product_id}"

user_id = UserId(123)
product_id = ProductId(456)

get_user(user_id)      # OK
# get_user(product_id)  # Type error! Can't use ProductId as UserId
# get_user(123)         # Type error! Need to construct UserId

# Runtime: NewType is just a function that returns its argument
actual_id = user_id    # actual_id is just 123 at runtime
```

### Generic Type Aliases

```python
from typing import TypeVar, List, Tuple, Dict

T = TypeVar('T')

# Generic alias
Pair = Tuple[T, T]
Lookup = Dict[str, T]

def get_pair() -> Pair[int]:
    return (1, 2)

def get_lookup() -> Lookup[List[str]]:
    return {"fruits": ["apple", "banana"], "colors": ["red", "blue"]}
```

## Using mypy for Type Checking

`mypy` is the most popular static type checker for Python. It analyzes your code without running it.

### Installation

```bash
pip install mypy
```

### Basic Usage

```python
# example.py
def add(a: int, b: int) -> int:
    return a + b

result = add(5, "10")  # Type error!
```

Run mypy:

```bash
mypy example.py
# Output: example.py:4: error: Argument 2 to "add" has incompatible type "str"; expected "int"
```

### Configuration

Create a `mypy.ini` or `pyproject.toml` configuration file:

```ini
# mypy.ini
[mypy]
python_version = 3.11
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_any_generics = True
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
check_untyped_defs = True
strict_equality = True
```

Or in `pyproject.toml`:

```toml
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### Ignoring Errors

Use `# type: ignore` comments when necessary:

```python
# Ignore error on specific line
result = some_untyped_library()  # type: ignore

# Ignore specific error code
value: int = "text"  # type: ignore[assignment]

# Ignore entire file
# type: ignore (at top of file)
```

### Running mypy on Projects

```bash
# Check single file
mypy script.py

# Check directory
mypy src/

# Check with specific Python version
mypy --python-version 3.11 src/

# Show error codes
mypy --show-error-codes src/

# Strict mode (all optional checks)
mypy --strict src/

# Generate HTML report
mypy --html-report ./mypy-report src/
```

### Stub Files

For untyped third-party libraries, use stub files (`.pyi`):

```python
# mylib.pyi (stub file)
def process_data(data: str) -> int: ...

class DataProcessor:
    def __init__(self, config: dict[str, str]) -> None: ...
    def run(self) -> bool: ...
```

Install type stubs for popular libraries:

```bash
# Stubs for requests library
pip install types-requests

# Stubs for other libraries
pip install types-PyYAML types-redis
```

### Common mypy Options

```bash
# Incremental mode (faster on repeated runs)
mypy --incremental src/

# Cache directory
mypy --cache-dir=.mypy_cache src/

# Verbose output
mypy --verbose src/

# Don't color output
mypy --no-color-output src/

# Follow imports
mypy --follow-imports=normal src/

# Skip checking imported modules
mypy --follow-imports=skip src/
```

## Best Practices

### Start Gradually

You don't need to type everything at once:

```python
# Start with function signatures
def process_user(name: str, age: int) -> dict:  # Return type can be refined later
    return {"name": name, "age": age}

# Gradually add more specific types
from typing import TypedDict

class UserData(TypedDict):
    name: str
    age: int

def process_user_typed(name: str, age: int) -> UserData:
    return {"name": name, "age": age}
```

### Use Union Sparingly

Too many unions make types less useful:

```python
# Avoid
def process(value: int | str | float | list | dict | None) -> Any:
    pass

# Better - be more specific
from typing import Protocol

class Processable(Protocol):
    def to_string(self) -> str: ...

def process(value: Processable) -> str:
    return value.to_string()
```

### Prefer Protocol Over Abstract Classes

Protocols are more flexible:

```python
# Less flexible - requires inheritance
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        pass

# More flexible - duck typing
from typing import Protocol

class Speakable(Protocol):
    def speak(self) -> str:
        ...

# Any class with speak() method works
class Dog:
    def speak(self) -> str:
        return "Woof"

def make_noise(animal: Speakable) -> None:
    print(animal.speak())

make_noise(Dog())  # Works without inheritance
```

### Document Complex Types

Use type aliases and comments for complex types:

```python
from typing import Dict, List, Tuple, Callable

# Without alias - hard to read
def process(
    data: Dict[str, List[Tuple[int, str]]],
    callback: Callable[[List[Tuple[int, str]]], Dict[str, int]]
) -> Dict[str, int]:
    pass

# With alias - much clearer
Record = Tuple[int, str]
RecordList = List[Record]
RecordDict = Dict[str, RecordList]
ProcessCallback = Callable[[RecordList], Dict[str, int]]

def process(data: RecordDict, callback: ProcessCallback) -> Dict[str, int]:
    """
    Process records and apply callback.

    Args:
        data: Dictionary mapping keys to lists of (id, value) records
        callback: Function that processes record lists

    Returns:
        Dictionary with processed results
    """
    pass
```

### Use TYPE_CHECKING for Import Cycles

Avoid circular imports:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Only imported for type checking, not at runtime
    from myapp.models import User

class UserManager:
    def get_user(self, user_id: int) -> 'User':  # Forward reference
        pass
```

### Leverage Modern Python Features

Use Python 3.10+ union syntax when possible:

```python
# Old style
from typing import Optional, Union, List

def process(value: Optional[Union[int, str]]) -> List[int]:
    pass

# Modern style (Python 3.10+)
def process(value: int | str | None) -> list[int]:
    pass
```

### Validate Runtime Data

Type hints don't validate runtime data - use them with validation libraries:

```python
from typing import TypedDict
from pydantic import BaseModel, validator

# TypedDict - no runtime validation
class UserDict(TypedDict):
    name: str
    age: int

# Pydantic - runtime validation
class User(BaseModel):
    name: str
    age: int

    @validator('age')
    def validate_age(cls, v):
        if v < 0:
            raise ValueError('Age must be positive')
        return v

# This will fail at runtime
user = User(name="Alice", age=-5)  # ValidationError
```

### Type Check in CI/CD

Add mypy to your continuous integration:

```yaml
# .github/workflows/type-check.yml
name: Type Check

on: [push, pull_request]

jobs:
  mypy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install mypy
          pip install -r requirements.txt
      - name: Run mypy
        run: mypy src/
```

## Conclusion

Python's type system provides powerful tools for writing safer, more maintainable code:

- **Basic types** for simple annotations
- **Compound types** for collections and unions
- **Generics** for reusable, type-safe components
- **Protocol** for structural subtyping
- **TypedDict** for structured dictionaries
- **Literal** for exact value specifications
- **mypy** for static type checking

Start small by adding types to critical functions, then gradually expand coverage. Use mypy in your development workflow and CI/CD pipeline to catch errors early. Remember that type hints are optional - use them where they add value, not everywhere by default.

The combination of Python's dynamic nature with optional static typing gives you the best of both worlds: rapid development with the safety net of type checking when you need it.
