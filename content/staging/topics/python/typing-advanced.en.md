---
title: "Python Advanced Type System: Protocol, ParamSpec, and Modern Type Tools"
description: "Master advanced Python type annotations: Protocol structural subtyping, ParamSpec parameter specifications, Concatenate, TypeVarTuple, Self type, and @overload function overloading"
track: python
section: typing-tooling
difficulty: advanced
tags:
  - Python
  - Type Annotations
  - typing
  - Protocol
  - ParamSpec
  - Advanced Types
status: imported
origin: old/src/content/docs/python/typing-advanced.en.md
divergence: 0.201
issues: []
legacy:
  category: Python
  subcategory: Type System
  order: 13
  lastUpdated: 2026-01-07
---

Python's type system has continuously evolved since 3.8, introducing many advanced features to support more precise type expressions. This article dives into Protocol (structural subtyping), ParamSpec (parameter specifications), Concatenate, TypeVarTuple, Self type, and @overload function overloading, to help you build type-safe and flexible Python code.

## Concept Explanation

### What is the Advanced Type System

Python's advanced type system builds upon basic type annotations, providing more powerful type expression capabilities:

1. **Protocol**: Implements structural subtyping, allowing type compatibility to be defined based on an object's structure (methods and properties) rather than inheritance relationships
2. **ParamSpec (Parameter Specification)**: Captures and passes complete function parameter signatures for precise type annotations in decorators and higher-order functions
3. **Concatenate**: Works with ParamSpec to add extra parameters before a parameter signature
4. **TypeVarTuple (Type Variable Tuple)**: Represents any number of type variables for variadic generic types
5. **Self Type**: Represents the type of the current class itself, solving return type issues in method chaining and factory methods
6. **@overload Decorator**: Defines multiple type signatures for the same function, enabling return type inference based on parameter types

### Why Are These Advanced Features Needed

- **Protocol**: Resolves the contradiction between Python's duck typing and static type checking
- **ParamSpec**: Decorators are a core Python feature, requiring precise passing of decorated function type information
- **TypeVarTuple**: Handles `*args` and variable-length generic containers
- **Self**: Solves subclass method return type inheritance issues
- **@overload**: Expresses scenarios where functions return different types based on input types

## Core Principles

### Nominal Typing vs Structural Typing

```python
# Nominal Typing: Based on class names and inheritance relationships
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        pass

class Dog(Animal):  # Must explicitly inherit
    def speak(self) -> str:
        return "Woof!"

# Structural Typing: Based on structure
from typing import Protocol

class Speaker(Protocol):
    def speak(self) -> str:
        ...

class Cat:  # No inheritance needed, just implement the same methods
    def speak(self) -> str:
        return "Meow!"

def make_sound(speaker: Speaker) -> str:
    return speaker.speak()

# Cat satisfies the Speaker protocol, type check passes
make_sound(Cat())
```

### How ParamSpec Works

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec('P')
R = TypeVar('R')

# ParamSpec captures the complete parameter signature of a function
# P.args represents positional arguments
# P.kwargs represents keyword arguments

def decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("Before call")
        result = func(*args, **kwargs)
        print("After call")
        return result
    return wrapper

@decorator
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

# Type checker knows greet's signature remains unchanged
result: str = greet("Alice", greeting="Hi")
```

## Core Essentials

### Protocol Deep Dive

| Feature | Description |
|---------|-------------|
| Implicit Implementation | Classes don't need to explicitly inherit Protocol, just satisfy its structure |
| Inheritable | Protocols can inherit from other Protocols |
| runtime_checkable | Can be used for isinstance checks when using the decorator |
| Generic Support | Protocols can be generic |

### ParamSpec and Concatenate Relationship

| Component | Purpose |
|-----------|---------|
| ParamSpec | Captures complete parameter signature |
| P.args | Positional argument types |
| P.kwargs | Keyword argument types |
| Concatenate[X, P] | Adds parameter X before P |

### Type Variable Comparison

| Type Variable | Purpose | Version Introduced |
|---------------|---------|-------------------|
| TypeVar | Single type parameter | 3.5 |
| ParamSpec | Function parameter signature | 3.10 |
| TypeVarTuple | Variable number of type parameters | 3.11 |

### @overload Rules

- Must have at least two @overload decorated signatures
- The actual implementation doesn't use the @overload decorator
- Implementation must be compatible with all overload signatures
- Overload signature function bodies are typically `...` or `pass`

## Code Examples

### Complete Protocol Example

```python
from typing import Protocol, runtime_checkable, TypeVar, Generic

# Basic Protocol definition
class Renderable(Protocol):
    """Renderable object protocol"""
    def render(self) -> str:
        """Render to string"""
        ...

# Protocol with properties
class Named(Protocol):
    """Named object protocol"""
    name: str

    def get_display_name(self) -> str:
        ...

# Runtime checkable Protocol
@runtime_checkable
class Closeable(Protocol):
    """Closeable resource protocol"""
    def close(self) -> None:
        ...

# Generic Protocol
T_co = TypeVar('T_co', covariant=True)

class Reader(Protocol[T_co]):
    """Reader protocol"""
    def read(self) -> T_co:
        ...

    def read_all(self) -> list[T_co]:
        ...

# Protocol inheritance
class FileReader(Closeable, Reader[str], Protocol):
    """File reader protocol: Closeable + string reading"""
    def get_path(self) -> str:
        ...

# ===== Implementation classes (no need to inherit Protocol) =====

class HTMLElement:
    """HTML element"""
    def __init__(self, tag: str, content: str) -> None:
        self.tag = tag
        self.content = content

    def render(self) -> str:
        return f"<{self.tag}>{self.content}</{self.tag}>"

class User:
    """User class"""
    def __init__(self, name: str, email: str) -> None:
        self.name = name
        self.email = email

    def get_display_name(self) -> str:
        return f"{self.name} <{self.email}>"

class DatabaseConnection:
    """Database connection"""
    def __init__(self, conn_str: str) -> None:
        self.conn_str = conn_str
        self.connected = True

    def close(self) -> None:
        self.connected = False
        print("Connection closed")

class StringReader:
    """String reader"""
    def __init__(self, data: list[str]) -> None:
        self._data = data
        self._index = 0

    def read(self) -> str:
        if self._index < len(self._data):
            result = self._data[self._index]
            self._index += 1
            return result
        return ""

    def read_all(self) -> list[str]:
        return self._data

# ===== Using Protocol as type constraints =====

def render_items(items: list[Renderable]) -> str:
    """Render all renderable items"""
    return "\n".join(item.render() for item in items)

def greet_named(entity: Named) -> str:
    """Greet a named entity"""
    return f"Hello, {entity.get_display_name()}!"

def safe_close(resource: Closeable) -> None:
    """Safely close a resource"""
    try:
        resource.close()
    except Exception as e:
        print(f"Error closing resource: {e}")

def read_first_n(reader: Reader[str], n: int) -> list[str]:
    """Read the first n items"""
    return [reader.read() for _ in range(n)]

# ===== Runtime checking =====

conn = DatabaseConnection("localhost")
if isinstance(conn, Closeable):
    print("DatabaseConnection implements the Closeable protocol")
    safe_close(conn)

# ===== Usage examples =====

elements = [
    HTMLElement("h1", "Title"),
    HTMLElement("p", "Paragraph")
]
print(render_items(elements))
# Output:
# <h1>Title</h1>
# <p>Paragraph</p>

user = User("Alice", "alice@example.com")
print(greet_named(user))
# Output: Hello, Alice <alice@example.com>!

string_reader = StringReader(["line1", "line2", "line3"])
print(read_first_n(string_reader, 2))
# Output: ['line1', 'line2']
```

### ParamSpec Decorator Examples

```python
from typing import ParamSpec, TypeVar, Callable, Any
from functools import wraps
import time
import logging

P = ParamSpec('P')
R = TypeVar('R')

# Basic decorator: preserving function signature
def logged(func: Callable[P, R]) -> Callable[P, R]:
    """Decorator that logs function calls"""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        logging.info(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        logging.info(f"{func.__name__} returned {result}")
        return result
    return wrapper

# Timing decorator
def timed(func: Callable[P, R]) -> Callable[P, R]:
    """Decorator that measures function execution time"""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

# Retry decorator
def retry(max_attempts: int = 3) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Decorator with retry functionality"""
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_exception: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    print(f"Attempt {attempt + 1} failed: {e}")
            raise last_exception or RuntimeError("All attempts failed")
        return wrapper
    return decorator

# Caching decorator (return type modification example)
T = TypeVar('T')

def cached(func: Callable[P, T]) -> Callable[P, T]:
    """Simple caching decorator"""
    cache: dict[tuple[Any, ...], T] = {}

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        # Create cache key
        key = (args, tuple(sorted(kwargs.items())))
        if key not in cache:
            cache[key] = func(*args, **kwargs)
        return cache[key]
    return wrapper

# ===== Using decorators =====

@logged
@timed
def calculate(x: int, y: int, operation: str = "add") -> float:
    """Perform calculation"""
    if operation == "add":
        return float(x + y)
    elif operation == "multiply":
        return float(x * y)
    else:
        raise ValueError(f"Unknown operation: {operation}")

@retry(max_attempts=3)
def fetch_data(url: str, timeout: int = 30) -> dict[str, Any]:
    """Fetch data (simulating potentially failing operation)"""
    import random
    if random.random() < 0.5:
        raise ConnectionError("Network error")
    return {"url": url, "data": "content"}

@cached
def expensive_calculation(n: int) -> int:
    """Expensive calculation"""
    print(f"Computing for {n}")
    return sum(range(n))

# Type checker knows the exact signatures of these functions
result1: float = calculate(10, 20, operation="multiply")
result2: dict[str, Any] = fetch_data("https://api.example.com", timeout=60)
result3: int = expensive_calculation(1000)
```

### Concatenate Advanced Usage

```python
from typing import ParamSpec, TypeVar, Callable, Concatenate
from functools import wraps

P = ParamSpec('P')
R = TypeVar('R')

# Adding parameters before existing parameters
def with_context(
    func: Callable[Concatenate[str, P], R]
) -> Callable[P, R]:
    """Decorator that automatically injects context parameter"""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        context = "default_context"
        return func(context, *args, **kwargs)
    return wrapper

@with_context
def process_with_context(ctx: str, data: str, multiplier: int = 1) -> str:
    return f"[{ctx}] {data * multiplier}"

# Call without passing ctx parameter
result = process_with_context("hello", multiplier=2)
# result: "[default_context] hellohello"

# ===== Method decorator: preserving self parameter =====

class Service:
    def __init__(self, name: str) -> None:
        self.name = name

T = TypeVar('T', bound=Service)

def authenticated(
    func: Callable[Concatenate[T, P], R]
) -> Callable[Concatenate[T, P], R]:
    """Method decorator for user authentication"""
    @wraps(func)
    def wrapper(self: T, *args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Authenticating for {self.name}")
        # Authentication logic...
        return func(self, *args, **kwargs)
    return wrapper

class UserService(Service):
    @authenticated
    def get_user(self, user_id: int) -> dict[str, Any]:
        return {"id": user_id, "service": self.name}

    @authenticated
    def update_user(self, user_id: int, data: dict[str, str]) -> bool:
        print(f"Updating user {user_id} with {data}")
        return True

service = UserService("main")
user = service.get_user(123)  # Type: dict[str, Any]
success = service.update_user(123, {"name": "Alice"})  # Type: bool

# ===== Dependency injection pattern =====

from dataclasses import dataclass

@dataclass
class Database:
    connection_string: str

@dataclass
class Logger:
    name: str

def inject_dependencies(
    func: Callable[Concatenate[Database, Logger, P], R]
) -> Callable[P, R]:
    """Inject database and logger dependencies"""
    db = Database("postgresql://localhost/mydb")
    logger = Logger("app")

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(db, logger, *args, **kwargs)
    return wrapper

@inject_dependencies
def query_users(db: Database, logger: Logger, limit: int = 10) -> list[dict[str, Any]]:
    logger_msg = f"Querying users with limit {limit}"
    print(f"[{logger.name}] {logger_msg}")
    print(f"Using database: {db.connection_string}")
    return [{"id": i} for i in range(limit)]

# Call without passing db and logger
users = query_users(limit=5)  # Type: list[dict[str, Any]]
```

### TypeVarTuple Variadic Generics

```python
from typing import TypeVarTuple, Generic, TypeVar, Callable, Unpack

Ts = TypeVarTuple('Ts')
T = TypeVar('T')

# Generic tuple container
class TypedTuple(Generic[Unpack[Ts]]):
    """Type-safe tuple wrapper"""
    def __init__(self, *values: Unpack[Ts]) -> None:
        self._values: tuple[Unpack[Ts]] = values

    def get_values(self) -> tuple[Unpack[Ts]]:
        return self._values

    def __repr__(self) -> str:
        return f"TypedTuple{self._values!r}"

# Usage: type is precisely preserved
t1: TypedTuple[int, str, float] = TypedTuple(1, "hello", 3.14)
values: tuple[int, str, float] = t1.get_values()

# ===== Variadic function composition =====

def compose(*funcs: Callable[[T], T]) -> Callable[[T], T]:
    """Compose multiple functions with the same signature"""
    def composed(x: T) -> T:
        result = x
        for func in reversed(funcs):
            result = func(result)
        return result
    return composed

def double(x: int) -> int:
    return x * 2

def add_one(x: int) -> int:
    return x + 1

pipeline = compose(double, add_one, double)
result = pipeline(5)  # ((5 * 2) + 1) * 2 = 22

# ===== Tensor types (machine learning scenarios) =====

from typing import Generic

Shape = TypeVarTuple('Shape')

class Tensor(Generic[Unpack[Shape]]):
    """Type-safe multidimensional tensor representation"""
    def __init__(self, shape: tuple[Unpack[Shape]], data: list[float]) -> None:
        self._shape = shape
        self._data = data

    @property
    def shape(self) -> tuple[Unpack[Shape]]:
        return self._shape

    def reshape(self, *new_shape: Unpack[Shape]) -> 'Tensor[Unpack[Shape]]':
        """Reshape tensor"""
        return Tensor(new_shape, self._data)

# Precisely typed tensors
tensor_2d: Tensor[int, int] = Tensor((3, 4), [0.0] * 12)
tensor_3d: Tensor[int, int, int] = Tensor((2, 3, 4), [0.0] * 24)

# ===== Database row types =====

class Row(Generic[Unpack[Ts]]):
    """Type representation of a database row"""
    def __init__(self, *columns: Unpack[Ts]) -> None:
        self._columns = columns

    def get_column(self, index: int) -> Unpack[Ts]:  # Simplified example
        return self._columns[index]  # type: ignore

    def as_tuple(self) -> tuple[Unpack[Ts]]:
        return self._columns

# Type-safe rows
user_row: Row[int, str, str] = Row(1, "Alice", "alice@example.com")
id_val, name, email = user_row.as_tuple()
```

### Self Type

```python
from typing import Self

# Method chaining pattern
class QueryBuilder:
    """SQL query builder"""
    def __init__(self) -> None:
        self._table: str = ""
        self._columns: list[str] = []
        self._where_clauses: list[str] = []
        self._limit: int | None = None

    def select(self, *columns: str) -> Self:
        self._columns.extend(columns)
        return self

    def from_table(self, table: str) -> Self:
        self._table = table
        return self

    def where(self, condition: str) -> Self:
        self._where_clauses.append(condition)
        return self

    def limit(self, count: int) -> Self:
        self._limit = count
        return self

    def build(self) -> str:
        columns = ", ".join(self._columns) or "*"
        sql = f"SELECT {columns} FROM {self._table}"
        if self._where_clauses:
            sql += " WHERE " + " AND ".join(self._where_clauses)
        if self._limit:
            sql += f" LIMIT {self._limit}"
        return sql

# Subclass correctly inherits return type
class PostgresQueryBuilder(QueryBuilder):
    """PostgreSQL specific query builder"""
    def with_cte(self, name: str, query: str) -> Self:
        # PostgreSQL CTE support
        return self

# Type checker knows return type is the concrete subclass
query: PostgresQueryBuilder = (
    PostgresQueryBuilder()
    .with_cte("users_cte", "SELECT * FROM users")
    .select("name", "email")
    .from_table("users_cte")
    .where("active = true")
    .limit(10)
)

# ===== Factory method pattern =====

from dataclasses import dataclass
import json

@dataclass
class Model:
    """Base model class"""
    id: int

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        """Create instance from dictionary"""
        return cls(**data)

    @classmethod
    def from_json(cls, json_str: str) -> Self:
        """Create instance from JSON"""
        return cls.from_dict(json.loads(json_str))

@dataclass
class User(Model):
    """User model"""
    name: str
    email: str

@dataclass
class Product(Model):
    """Product model"""
    name: str
    price: float

# Self ensures correct subclass type is returned
user: User = User.from_dict({"id": 1, "name": "Alice", "email": "a@example.com"})
product: Product = Product.from_json('{"id": 2, "name": "Widget", "price": 9.99}')

# ===== Singleton pattern =====

class Singleton:
    """Singleton base class"""
    _instance: Self | None = None

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def get_instance(cls) -> Self:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

class ConfigManager(Singleton):
    """Configuration manager singleton"""
    def __init__(self) -> None:
        if not hasattr(self, '_initialized'):
            self.settings: dict[str, Any] = {}
            self._initialized = True

    def set(self, key: str, value: Any) -> Self:
        self.settings[key] = value
        return self

# Type is correct
config: ConfigManager = ConfigManager.get_instance()
config.set("debug", True).set("timeout", 30)

# ===== Comparison: Self vs TypeVar =====

# Using TypeVar (pre-Python 3.11 approach)
from typing import TypeVar

T_Builder = TypeVar('T_Builder', bound='OldQueryBuilder')

class OldQueryBuilder:
    def where(self: T_Builder, condition: str) -> T_Builder:
        return self

# Using Self (Python 3.11+, more concise)
class NewQueryBuilder:
    def where(self, condition: str) -> Self:
        return self
```

### @overload Function Overloading

```python
from typing import overload, Literal, Union, Any

# ===== Overloading based on parameter type =====

@overload
def process(data: str) -> str: ...

@overload
def process(data: bytes) -> bytes: ...

@overload
def process(data: int) -> int: ...

def process(data: str | bytes | int) -> str | bytes | int:
    """Process different types of data"""
    if isinstance(data, str):
        return data.upper()
    elif isinstance(data, bytes):
        return data.upper()
    else:
        return data * 2

# Type checker infers correct return type
text: str = process("hello")
binary: bytes = process(b"hello")
number: int = process(42)

# ===== Overloading based on literal parameters =====

@overload
def fetch(url: str, format: Literal["json"]) -> dict[str, Any]: ...

@overload
def fetch(url: str, format: Literal["text"]) -> str: ...

@overload
def fetch(url: str, format: Literal["bytes"]) -> bytes: ...

def fetch(url: str, format: Literal["json", "text", "bytes"]) -> dict[str, Any] | str | bytes:
    """Get different response types based on format parameter"""
    # Actual implementation
    if format == "json":
        return {"url": url}
    elif format == "text":
        return f"Content from {url}"
    else:
        return b"binary content"

# Type inference
json_data: dict[str, Any] = fetch("https://api.example.com", "json")
text_data: str = fetch("https://example.com", "text")
binary_data: bytes = fetch("https://example.com/file", "bytes")

# ===== Optional parameter overloading =====

@overload
def get_user(user_id: int) -> dict[str, Any]: ...

@overload
def get_user(user_id: int, fields: list[str]) -> dict[str, Any]: ...

@overload
def get_user(user_id: int, fields: list[str], include_meta: Literal[True]) -> tuple[dict[str, Any], dict[str, Any]]: ...

def get_user(
    user_id: int,
    fields: list[str] | None = None,
    include_meta: bool = False
) -> dict[str, Any] | tuple[dict[str, Any], dict[str, Any]]:
    """Get user information"""
    user_data = {"id": user_id, "name": "Alice"}
    if fields:
        user_data = {k: v for k, v in user_data.items() if k in fields}
    if include_meta:
        meta = {"retrieved_at": "2024-01-01"}
        return user_data, meta
    return user_data

# Different calls yield different types
user1: dict[str, Any] = get_user(123)
user2: dict[str, Any] = get_user(123, ["name"])
user3: tuple[dict[str, Any], dict[str, Any]] = get_user(123, ["name"], True)

# ===== Class method overloading =====

class DataParser:
    @overload
    def parse(self, data: str, as_type: type[int]) -> int: ...

    @overload
    def parse(self, data: str, as_type: type[float]) -> float: ...

    @overload
    def parse(self, data: str, as_type: type[bool]) -> bool: ...

    def parse(self, data: str, as_type: type) -> int | float | bool:
        """Parse string to specified type"""
        if as_type is int:
            return int(data)
        elif as_type is float:
            return float(data)
        elif as_type is bool:
            return data.lower() in ('true', '1', 'yes')
        raise TypeError(f"Unsupported type: {as_type}")

parser = DataParser()
int_val: int = parser.parse("42", int)
float_val: float = parser.parse("3.14", float)
bool_val: bool = parser.parse("true", bool)

# ===== Generic overloading =====

from typing import TypeVar, Sequence

T = TypeVar('T')

@overload
def first(items: Sequence[T]) -> T | None: ...

@overload
def first(items: Sequence[T], default: T) -> T: ...

def first(items: Sequence[T], default: T | None = None) -> T | None:
    """Get the first element of a sequence"""
    if items:
        return items[0]
    return default

# Type inference
nums = [1, 2, 3]
first_num: int | None = first(nums)
first_or_default: int = first(nums, 0)  # Cannot be None with default value
```

### Comprehensive Practice: Type-Safe Event System

```python
from typing import (
    Protocol, ParamSpec, TypeVar, Callable, Generic,
    overload, Literal, Any, Self
)
from dataclasses import dataclass
from functools import wraps
import asyncio

P = ParamSpec('P')
R = TypeVar('R')
T = TypeVar('T')

# ===== Event type definitions =====

@dataclass
class UserCreatedEvent:
    user_id: int
    username: str
    email: str

@dataclass
class UserUpdatedEvent:
    user_id: int
    changes: dict[str, Any]

@dataclass
class OrderCreatedEvent:
    order_id: int
    user_id: int
    total: float

# Event type union
Event = UserCreatedEvent | UserUpdatedEvent | OrderCreatedEvent

# ===== Event handler protocols =====

class EventHandler(Protocol[T]):
    """Event handler protocol"""
    def __call__(self, event: T) -> None:
        ...

class AsyncEventHandler(Protocol[T]):
    """Async event handler protocol"""
    async def __call__(self, event: T) -> None:
        ...

# ===== Event bus implementation =====

class EventBus:
    """Type-safe event bus"""

    def __init__(self) -> None:
        self._handlers: dict[type, list[Callable[[Any], None]]] = {}
        self._async_handlers: dict[type, list[Callable[[Any], Any]]] = {}

    @overload
    def subscribe(
        self,
        event_type: type[UserCreatedEvent]
    ) -> Callable[[EventHandler[UserCreatedEvent]], EventHandler[UserCreatedEvent]]: ...

    @overload
    def subscribe(
        self,
        event_type: type[UserUpdatedEvent]
    ) -> Callable[[EventHandler[UserUpdatedEvent]], EventHandler[UserUpdatedEvent]]: ...

    @overload
    def subscribe(
        self,
        event_type: type[OrderCreatedEvent]
    ) -> Callable[[EventHandler[OrderCreatedEvent]], EventHandler[OrderCreatedEvent]]: ...

    def subscribe(
        self,
        event_type: type[T]
    ) -> Callable[[EventHandler[T]], EventHandler[T]]:
        """Decorator for subscribing to events"""
        def decorator(handler: EventHandler[T]) -> EventHandler[T]:
            if event_type not in self._handlers:
                self._handlers[event_type] = []
            self._handlers[event_type].append(handler)
            return handler
        return decorator

    def subscribe_async(
        self,
        event_type: type[T]
    ) -> Callable[[AsyncEventHandler[T]], AsyncEventHandler[T]]:
        """Decorator for subscribing to async events"""
        def decorator(handler: AsyncEventHandler[T]) -> AsyncEventHandler[T]:
            if event_type not in self._async_handlers:
                self._async_handlers[event_type] = []
            self._async_handlers[event_type].append(handler)
            return handler
        return decorator

    def publish(self, event: Event) -> None:
        """Publish event"""
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            handler(event)

    async def publish_async(self, event: Event) -> None:
        """Publish event asynchronously"""
        event_type = type(event)

        # Sync handlers
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            handler(event)

        # Async handlers
        async_handlers = self._async_handlers.get(event_type, [])
        await asyncio.gather(*[handler(event) for handler in async_handlers])

# ===== Using the event bus =====

event_bus = EventBus()

@event_bus.subscribe(UserCreatedEvent)
def handle_user_created(event: UserCreatedEvent) -> None:
    print(f"User created: {event.username} (ID: {event.user_id})")

@event_bus.subscribe(UserCreatedEvent)
def send_welcome_email(event: UserCreatedEvent) -> None:
    print(f"Sending welcome email to {event.email}")

@event_bus.subscribe(OrderCreatedEvent)
def handle_order_created(event: OrderCreatedEvent) -> None:
    print(f"Order {event.order_id} created for user {event.user_id}, total: ${event.total}")

@event_bus.subscribe_async(UserCreatedEvent)
async def async_user_analytics(event: UserCreatedEvent) -> None:
    await asyncio.sleep(0.1)  # Simulate async operation
    print(f"Analytics: New user {event.username}")

# Publish events
event_bus.publish(UserCreatedEvent(
    user_id=1,
    username="alice",
    email="alice@example.com"
))

event_bus.publish(OrderCreatedEvent(
    order_id=100,
    user_id=1,
    total=99.99
))

# ===== Event handling with middleware =====

class EventMiddleware(Protocol[T]):
    """Event middleware protocol"""
    def process(
        self,
        event: T,
        next_handler: Callable[[T], None]
    ) -> None:
        ...

class LoggingMiddleware:
    """Logging middleware"""
    def process(self, event: Event, next_handler: Callable[[Event], None]) -> None:
        print(f"[LOG] Processing event: {type(event).__name__}")
        next_handler(event)
        print(f"[LOG] Event processed: {type(event).__name__}")

class ValidationMiddleware:
    """Validation middleware"""
    def process(self, event: Event, next_handler: Callable[[Event], None]) -> None:
        if isinstance(event, UserCreatedEvent):
            if not event.email or '@' not in event.email:
                raise ValueError("Invalid email")
        next_handler(event)

# ===== Type-safe service layer =====

class Serializable(Protocol):
    """Serializable protocol"""
    def to_dict(self) -> dict[str, Any]:
        ...

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        ...

@dataclass
class UserDTO:
    id: int
    name: str
    email: str

    def to_dict(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "email": self.email}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        return cls(
            id=data["id"],
            name=data["name"],
            email=data["email"]
        )

S = TypeVar('S', bound=Serializable)

class Repository(Generic[S]):
    """Generic repository"""
    def __init__(self, entity_class: type[S]) -> None:
        self._entity_class = entity_class
        self._storage: dict[int, dict[str, Any]] = {}

    def save(self, entity: S) -> S:
        data = entity.to_dict()
        self._storage[data["id"]] = data
        return entity

    def find_by_id(self, entity_id: int) -> S | None:
        data = self._storage.get(entity_id)
        if data is None:
            return None
        return self._entity_class.from_dict(data)

    def find_all(self) -> list[S]:
        return [
            self._entity_class.from_dict(data)
            for data in self._storage.values()
        ]

# Usage
user_repo: Repository[UserDTO] = Repository(UserDTO)
user = UserDTO(id=1, name="Alice", email="alice@example.com")
saved_user: UserDTO = user_repo.save(user)
found_user: UserDTO | None = user_repo.find_by_id(1)
all_users: list[UserDTO] = user_repo.find_all()
```

## Best Practices

### Protocol Design Principles

```python
from typing import Protocol, runtime_checkable

# Good: Small and focused protocols
class Readable(Protocol):
    def read(self, size: int = -1) -> bytes:
        ...

class Writable(Protocol):
    def write(self, data: bytes) -> int:
        ...

class Seekable(Protocol):
    def seek(self, offset: int, whence: int = 0) -> int:
        ...

# Composite protocol
class ReadWritable(Readable, Writable, Protocol):
    pass

# Avoid: Overly large protocols
class BadFileProtocol(Protocol):  # Too many methods
    def read(self, size: int) -> bytes: ...
    def write(self, data: bytes) -> int: ...
    def seek(self, offset: int) -> int: ...
    def tell(self) -> int: ...
    def close(self) -> None: ...
    def flush(self) -> None: ...
    def fileno(self) -> int: ...
    # ... more methods
```

### ParamSpec Usage Guidelines

```python
from typing import ParamSpec, TypeVar, Callable
from functools import wraps

P = ParamSpec('P')
R = TypeVar('R')

# Good: Maintain consistent signature
def traced(func: Callable[P, R]) -> Callable[P, R]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

# Good: Use new TypeVar when explicitly modifying return type
T = TypeVar('T')

def make_optional(func: Callable[P, T]) -> Callable[P, T | None]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        try:
            return func(*args, **kwargs)
        except Exception:
            return None
    return wrapper
```

### @overload Organization

```python
from typing import overload, Literal

# Good: Group overloads logically, implementation follows immediately
@overload
def create_connection(
    host: str,
    port: int,
    ssl: Literal[True]
) -> "SSLConnection": ...

@overload
def create_connection(
    host: str,
    port: int,
    ssl: Literal[False] = False
) -> "PlainConnection": ...

def create_connection(
    host: str,
    port: int,
    ssl: bool = False
) -> "SSLConnection | PlainConnection":
    if ssl:
        return SSLConnection(host, port)
    return PlainConnection(host, port)

# Good: Add documentation for complex overloads
@overload
def parse_value(raw: str, target_type: type[int]) -> int:
    """Parse string to integer"""
    ...

@overload
def parse_value(raw: str, target_type: type[float]) -> float:
    """Parse string to float"""
    ...
```

### Self Type Best Practices

```python
from typing import Self
from dataclasses import dataclass

# Good: Fluent API
@dataclass
class Config:
    debug: bool = False
    timeout: int = 30
    retries: int = 3

    def with_debug(self, enabled: bool = True) -> Self:
        return type(self)(
            debug=enabled,
            timeout=self.timeout,
            retries=self.retries
        )

    def with_timeout(self, seconds: int) -> Self:
        return type(self)(
            debug=self.debug,
            timeout=seconds,
            retries=self.retries
        )

# Subclasses automatically get correct return types
class AdvancedConfig(Config):
    compression: bool = False

config: AdvancedConfig = (
    AdvancedConfig()
    .with_debug(True)
    .with_timeout(60)
)  # Type is AdvancedConfig, not Config
```

## Common Pitfalls

### Protocol's runtime_checkable Limitations

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class DataContainer(Protocol):
    data: list[int]  # Attributes are NOT checked by isinstance!

    def get_data(self) -> list[int]:
        ...

class MyContainer:
    def __init__(self) -> None:
        self.data = [1, 2, 3]

    def get_data(self) -> list[int]:
        return self.data

class BadContainer:
    def get_data(self) -> list[int]:
        return []  # Missing data attribute

container = BadContainer()
# Danger: This returns True because isinstance only checks methods
print(isinstance(container, DataContainer))  # True

# Correct approach: Also check attributes
def is_data_container(obj: object) -> bool:
    return (
        isinstance(obj, DataContainer) and
        hasattr(obj, 'data') and
        isinstance(obj.data, list)
    )
```

### ParamSpec and *args/**kwargs Confusion

```python
from typing import ParamSpec, TypeVar, Callable, Any

P = ParamSpec('P')
R = TypeVar('R')

# Wrong: Mixing ParamSpec with extra *args
def bad_decorator(func: Callable[P, R]) -> Callable[..., R]:  # Loses type info
    def wrapper(*args: Any, **kwargs: Any) -> R:  # Wrong
        return func(*args, **kwargs)
    return wrapper

# Correct: Strictly use P.args and P.kwargs
def good_decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper
```

### @overload Implementation Mismatch

```python
from typing import overload

# Wrong: Implementation signature incompatible with overloads
@overload
def process(x: int) -> int: ...

@overload
def process(x: str) -> str: ...

def process(x: int | str) -> int:  # Wrong: Return type incompatible
    return int(x)

# Correct: Implementation must be compatible with all overloads
@overload
def process_correct(x: int) -> int: ...

@overload
def process_correct(x: str) -> str: ...

def process_correct(x: int | str) -> int | str:  # Correct
    if isinstance(x, int):
        return x * 2
    return x.upper()
```

### Generic Protocol Type Erasure

```python
from typing import Protocol, TypeVar, Generic

T = TypeVar('T')

class Container(Protocol[T]):
    def get(self) -> T:
        ...

    def set(self, value: T) -> None:
        ...

# Wrong: Cannot get generic parameters at runtime
def process_container(container: Container[int]) -> int:
    # Container has no type info at runtime
    return container.get()

# If runtime type info is needed, use type markers
from dataclasses import dataclass

@dataclass
class TypedContainer(Generic[T]):
    value: T
    value_type: type[T]  # Explicitly store type

    def get(self) -> T:
        return self.value
```

### Self and Class Variables

```python
from typing import Self, ClassVar

class Counter:
    _instances: ClassVar[list["Counter"]] = []  # Note: Cannot use Self

    def __init__(self) -> None:
        Counter._instances.append(self)

    @classmethod
    def get_instances(cls) -> list[Self]:  # Can use Self here
        return cls._instances  # type: ignore  # Need to ignore, list element types don't match

# Better design
class BetterCounter:
    _instances: ClassVar[dict[type, list["BetterCounter"]]] = {}

    def __init__(self) -> None:
        cls = type(self)
        if cls not in BetterCounter._instances:
            BetterCounter._instances[cls] = []
        BetterCounter._instances[cls].append(self)

    @classmethod
    def get_instances(cls) -> list[Self]:
        return BetterCounter._instances.get(cls, [])  # type: ignore
```

## Performance Considerations

### Protocol Performance Impact

```python
from typing import Protocol, runtime_checkable
import timeit

@runtime_checkable
class Addable(Protocol):
    def __add__(self, other: Self) -> Self:
        ...

# isinstance checking Protocol is slower than regular classes
class MyClass:
    def __add__(self, other: "MyClass") -> "MyClass":
        return self

obj = MyClass()

# Benchmark
def check_protocol():
    return isinstance(obj, Addable)

def check_type():
    return isinstance(obj, MyClass)

# Protocol checks are typically 10-50x slower
print(timeit.timeit(check_protocol, number=100000))
print(timeit.timeit(check_type, number=100000))

# Recommendation: Avoid runtime_checkable Protocol in hot paths
# Better approach: Check once at function entry, or use TYPE_CHECKING
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Protocol

    class Addable(Protocol):
        def __add__(self, other: Self) -> Self: ...
```

### Runtime Overhead of Type Annotations

```python
from __future__ import annotations  # Deferred annotation evaluation
from typing import TYPE_CHECKING

# Using __future__.annotations can:
# - Avoid importing types at runtime
# - Reduce circular import issues
# - Allow forward references

if TYPE_CHECKING:
    # These imports are only used during type checking
    from expensive_module import ExpensiveClass
    from another_module import AnotherClass

class MyClass:
    # Type annotations are strings, won't trigger imports
    def process(self, data: "ExpensiveClass") -> "AnotherClass":
        pass
```

### Memory Impact of Generics

```python
from typing import Generic, TypeVar

T = TypeVar('T')

# Each concretization of a generic class is the same class
class Box(Generic[T]):
    def __init__(self, value: T) -> None:
        self.value = value

# Box[int] and Box[str] are the same class at runtime
print(Box[int] is Box[str])  # False (creates new _GenericAlias)
print(Box[int].__origin__ is Box)  # True

# But instances don't use more memory due to generic parameters
int_box = Box[int](42)
str_box = Box[str]("hello")
print(type(int_box) is type(str_box))  # True, both are Box
```

## Practical Scenarios

### Scenario 1: Type-Safe API Client Wrapper

```python
from typing import (
    Protocol, TypeVar, Generic, overload, Literal,
    ParamSpec, Callable, Any, Self
)
from dataclasses import dataclass
import json

# ===== Response types =====

@dataclass
class User:
    id: int
    name: str
    email: str

@dataclass
class Product:
    id: int
    name: str
    price: float

@dataclass
class Order:
    id: int
    user_id: int
    products: list[Product]
    total: float

# ===== Response wrapper =====

T = TypeVar('T')

@dataclass
class ApiResponse(Generic[T]):
    success: bool
    data: T | None
    error: str | None

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def fail(cls, error: str) -> "ApiResponse[T]":
        return cls(success=False, data=None, error=error)

# ===== Type-safe API client =====

class ApiClient:
    """Type-safe API client"""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    @overload
    def get(
        self,
        endpoint: Literal["/users/{id}"],
        *,
        id: int
    ) -> ApiResponse[User]: ...

    @overload
    def get(
        self,
        endpoint: Literal["/users"],
    ) -> ApiResponse[list[User]]: ...

    @overload
    def get(
        self,
        endpoint: Literal["/products/{id}"],
        *,
        id: int
    ) -> ApiResponse[Product]: ...

    @overload
    def get(
        self,
        endpoint: Literal["/orders/{id}"],
        *,
        id: int
    ) -> ApiResponse[Order]: ...

    def get(self, endpoint: str, **kwargs: Any) -> ApiResponse[Any]:
        """Execute GET request"""
        url = self.base_url + endpoint.format(**kwargs)
        # Actual HTTP request logic...
        # Simulating return here
        if "/users/" in endpoint:
            return ApiResponse.ok(User(id=kwargs.get("id", 1), name="Alice", email="a@b.com"))
        elif endpoint == "/users":
            return ApiResponse.ok([User(id=1, name="Alice", email="a@b.com")])
        elif "/products/" in endpoint:
            return ApiResponse.ok(Product(id=kwargs.get("id", 1), name="Widget", price=9.99))
        elif "/orders/" in endpoint:
            return ApiResponse.ok(Order(
                id=kwargs.get("id", 1),
                user_id=1,
                products=[Product(id=1, name="Widget", price=9.99)],
                total=9.99
            ))
        return ApiResponse.fail("Unknown endpoint")

# Usage
client = ApiClient("https://api.example.com")

# Type checker knows return types
user_response: ApiResponse[User] = client.get("/users/{id}", id=123)
users_response: ApiResponse[list[User]] = client.get("/users")
product_response: ApiResponse[Product] = client.get("/products/{id}", id=456)
order_response: ApiResponse[Order] = client.get("/orders/{id}", id=789)

if user_response.success and user_response.data:
    user: User = user_response.data
    print(f"User: {user.name}")
```

### Scenario 2: Type-Safe Dependency Injection Container

```python
from typing import Protocol, TypeVar, Generic, Callable, Any, overload, Self
from dataclasses import dataclass
from contextlib import contextmanager

T = TypeVar('T')
T_co = TypeVar('T_co', covariant=True)

# ===== Service protocols =====

class Service(Protocol):
    """Base service protocol"""
    def initialize(self) -> None:
        ...

class Disposable(Protocol):
    """Disposable resource protocol"""
    def dispose(self) -> None:
        ...

# ===== Lifecycle management =====

from enum import Enum

class Lifetime(Enum):
    SINGLETON = "singleton"
    TRANSIENT = "transient"
    SCOPED = "scoped"

@dataclass
class ServiceDescriptor(Generic[T]):
    """Service descriptor"""
    service_type: type[T]
    factory: Callable[["Container"], T]
    lifetime: Lifetime

# ===== Dependency injection container =====

class Container:
    """Type-safe dependency injection container"""

    def __init__(self) -> None:
        self._descriptors: dict[type, ServiceDescriptor[Any]] = {}
        self._singletons: dict[type, Any] = {}
        self._scoped: dict[type, Any] = {}

    def register_singleton(
        self,
        service_type: type[T],
        factory: Callable[["Container"], T] | None = None
    ) -> Self:
        """Register singleton service"""
        if factory is None:
            factory = lambda c: service_type()  # type: ignore
        self._descriptors[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=Lifetime.SINGLETON
        )
        return self

    def register_transient(
        self,
        service_type: type[T],
        factory: Callable[["Container"], T] | None = None
    ) -> Self:
        """Register transient service"""
        if factory is None:
            factory = lambda c: service_type()  # type: ignore
        self._descriptors[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=Lifetime.TRANSIENT
        )
        return self

    def register_scoped(
        self,
        service_type: type[T],
        factory: Callable[["Container"], T] | None = None
    ) -> Self:
        """Register scoped service"""
        if factory is None:
            factory = lambda c: service_type()  # type: ignore
        self._descriptors[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=Lifetime.SCOPED
        )
        return self

    def resolve(self, service_type: type[T]) -> T:
        """Resolve service"""
        if service_type not in self._descriptors:
            raise KeyError(f"Service {service_type} not registered")

        descriptor = self._descriptors[service_type]

        if descriptor.lifetime == Lifetime.SINGLETON:
            if service_type not in self._singletons:
                self._singletons[service_type] = descriptor.factory(self)
            return self._singletons[service_type]

        elif descriptor.lifetime == Lifetime.SCOPED:
            if service_type not in self._scoped:
                self._scoped[service_type] = descriptor.factory(self)
            return self._scoped[service_type]

        else:  # TRANSIENT
            return descriptor.factory(self)

    @contextmanager
    def create_scope(self):
        """Create new scope"""
        old_scoped = self._scoped
        self._scoped = {}
        try:
            yield self
        finally:
            # Dispose scoped services
            for service in self._scoped.values():
                if isinstance(service, Disposable):
                    service.dispose()
            self._scoped = old_scoped

# ===== Concrete service implementations =====

class DatabaseConnection:
    def __init__(self) -> None:
        self.connected = True
        print("Database connected")

    def initialize(self) -> None:
        pass

    def dispose(self) -> None:
        self.connected = False
        print("Database disconnected")

class UserRepository:
    def __init__(self, db: DatabaseConnection) -> None:
        self.db = db

    def initialize(self) -> None:
        pass

    def get_user(self, user_id: int) -> dict[str, Any]:
        return {"id": user_id, "name": "Alice"}

class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    def initialize(self) -> None:
        pass

    def get_user_info(self, user_id: int) -> str:
        user = self.repo.get_user(user_id)
        return f"User: {user['name']}"

# ===== Configuration and usage =====

container = (
    Container()
    .register_singleton(
        DatabaseConnection,
        lambda c: DatabaseConnection()
    )
    .register_scoped(
        UserRepository,
        lambda c: UserRepository(c.resolve(DatabaseConnection))
    )
    .register_transient(
        UserService,
        lambda c: UserService(c.resolve(UserRepository))
    )
)

# Type-safe service resolution
db: DatabaseConnection = container.resolve(DatabaseConnection)
service: UserService = container.resolve(UserService)

with container.create_scope():
    scoped_service: UserService = container.resolve(UserService)
    print(scoped_service.get_user_info(123))
```

### Scenario 3: Type-Safe State Machine

```python
from typing import (
    Protocol, TypeVar, Generic, Callable, overload,
    Literal, Self, Any
)
from dataclasses import dataclass
from enum import Enum, auto

# ===== Order state definitions =====

class OrderState(Enum):
    PENDING = auto()
    CONFIRMED = auto()
    PROCESSING = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()

# ===== State transition constraints =====

# Using the type system to constrain valid state transitions
StateFrom = TypeVar('StateFrom', bound=OrderState)
StateTo = TypeVar('StateTo', bound=OrderState)

@dataclass
class Transition(Generic[StateFrom, StateTo]):
    """State transition"""
    from_state: StateFrom
    to_state: StateTo
    action: str

# ===== Order state machine =====

class Order:
    """Order entity"""

    def __init__(self, order_id: int) -> None:
        self.order_id = order_id
        self._state: OrderState = OrderState.PENDING
        self._history: list[tuple[OrderState, OrderState, str]] = []

    @property
    def state(self) -> OrderState:
        return self._state

    def _transition(self, new_state: OrderState, action: str) -> None:
        old_state = self._state
        self._state = new_state
        self._history.append((old_state, new_state, action))

    # Using overload to define valid state transitions
    @overload
    def transition(
        self: "Order",
        action: Literal["confirm"]
    ) -> "Order":
        """PENDING -> CONFIRMED"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["start_processing"]
    ) -> "Order":
        """CONFIRMED -> PROCESSING"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["ship"]
    ) -> "Order":
        """PROCESSING -> SHIPPED"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["deliver"]
    ) -> "Order":
        """SHIPPED -> DELIVERED"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["cancel"]
    ) -> "Order":
        """Any (except DELIVERED) -> CANCELLED"""
        ...

    def transition(self, action: str) -> "Order":
        """Execute state transition"""
        valid_transitions: dict[tuple[OrderState, str], OrderState] = {
            (OrderState.PENDING, "confirm"): OrderState.CONFIRMED,
            (OrderState.CONFIRMED, "start_processing"): OrderState.PROCESSING,
            (OrderState.PROCESSING, "ship"): OrderState.SHIPPED,
            (OrderState.SHIPPED, "deliver"): OrderState.DELIVERED,
            # Cancel can be triggered from multiple states
            (OrderState.PENDING, "cancel"): OrderState.CANCELLED,
            (OrderState.CONFIRMED, "cancel"): OrderState.CANCELLED,
            (OrderState.PROCESSING, "cancel"): OrderState.CANCELLED,
        }

        key = (self._state, action)
        if key not in valid_transitions:
            raise ValueError(
                f"Invalid transition: {self._state.name} --{action}--> ???"
            )

        new_state = valid_transitions[key]
        self._transition(new_state, action)
        return self

    def get_history(self) -> list[str]:
        """Get state history"""
        return [
            f"{old.name} --{action}--> {new.name}"
            for old, new, action in self._history
        ]

# ===== Using the state machine =====

order = Order(order_id=12345)

# Type-safe state transitions
order.transition("confirm")
order.transition("start_processing")
order.transition("ship")
order.transition("deliver")

print(f"Order {order.order_id} final state: {order.state.name}")
print("History:")
for entry in order.get_history():
    print(f"  {entry}")

# Output:
# Order 12345 final state: DELIVERED
# History:
#   PENDING --confirm--> CONFIRMED
#   CONFIRMED --start_processing--> PROCESSING
#   PROCESSING --ship--> SHIPPED
#   SHIPPED --deliver--> DELIVERED
```

## Interview Key Points

### Difference Between Protocol and ABC

**Question**: What's the difference between Protocol and Abstract Base Class (ABC)? When should you use each?

**Answer**:
- **Inheritance**: ABC requires explicit inheritance, Protocol is based on structural matching
- **Runtime behavior**: ABC's isinstance checks are based on inheritance relationships, Protocol requires @runtime_checkable
- **Flexibility**: Protocol can type-annotate third-party classes that can't be modified
- **Use cases**: Use ABC when enforcement is needed, use Protocol for duck typing checks

```python
# ABC: Requires inheritance
from abc import ABC, abstractmethod

class Vehicle(ABC):
    @abstractmethod
    def drive(self) -> None:
        pass

class Car(Vehicle):  # Must inherit
    def drive(self) -> None:
        print("Driving car")

# Protocol: Structural matching
from typing import Protocol

class Drivable(Protocol):
    def drive(self) -> None:
        ...

class Bicycle:  # No inheritance needed
    def drive(self) -> None:
        print("Riding bicycle")

def start_vehicle(v: Drivable) -> None:
    v.drive()

start_vehicle(Bicycle())  # Type check passes
```

### Practical Application of ParamSpec

**Question**: Explain how ParamSpec works and why it's important for decorators?

**Answer**:
ParamSpec captures the complete parameter signature of a function (including positional arguments, keyword arguments, and defaults), enabling decorators to preserve the decorated function's type information.

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec('P')
R = TypeVar('R')

# Without ParamSpec, decorators lose type information
def bad_decorator(func: Callable[..., R]) -> Callable[..., R]:
    def wrapper(*args, **kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper

# With ParamSpec, type information is fully preserved
def good_decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper
```

### Correct Usage of @overload

**Question**: How does the @overload decorator work? Write a function that returns different types based on parameter types.

**Answer**:

```python
from typing import overload, Literal

@overload
def parse(data: str, as_json: Literal[True]) -> dict: ...

@overload
def parse(data: str, as_json: Literal[False]) -> str: ...

@overload
def parse(data: str) -> str: ...

def parse(data: str, as_json: bool = False) -> dict | str:
    if as_json:
        import json
        return json.loads(data)
    return data

# Type inference
result1 = parse('{"a": 1}', True)   # dict
result2 = parse("hello", False)      # str
result3 = parse("hello")             # str
```

### Advantages of Self Type

**Question**: What problem does Self type solve? What advantages does it have over using TypeVar?

**Answer**:
Self simplifies method return type annotations that return the current class, especially in inheritance scenarios.

```python
from typing import Self, TypeVar

# Old way: Using TypeVar
T = TypeVar('T', bound='OldBuilder')

class OldBuilder:
    def set_name(self: T, name: str) -> T:
        return self

# New way: Using Self (more concise)
class NewBuilder:
    def set_name(self, name: str) -> Self:
        return self

# Subclasses automatically get correct types
class AdvancedBuilder(NewBuilder):
    def set_priority(self, p: int) -> Self:
        return self

# builder's type is AdvancedBuilder, not NewBuilder
builder = AdvancedBuilder().set_name("test").set_priority(1)
```

### Use Cases for TypeVarTuple

**Question**: What scenarios is TypeVarTuple mainly used for? Give an example.

**Answer**:
TypeVarTuple is used to represent a variable number of type parameters, common in:
- Tensor dimension types
- Variable-length tuples
- Precise typing for *args

```python
from typing import TypeVarTuple, Generic, Unpack

Ts = TypeVarTuple('Ts')

class Tensor(Generic[Unpack[Ts]]):
    """Type-safe tensor"""
    def __init__(self, shape: tuple[Unpack[Ts]]) -> None:
        self._shape = shape

    @property
    def shape(self) -> tuple[Unpack[Ts]]:
        return self._shape

# Precisely typed shapes
t2d: Tensor[int, int] = Tensor((3, 4))
t3d: Tensor[int, int, int] = Tensor((2, 3, 4))
```

## Further Reading

### Official Documentation

- [typing Module Documentation](https://docs.python.org/3/library/typing.html)
- [PEP 544 - Protocols: Structural subtyping](https://peps.python.org/pep-0544/)
- [PEP 612 - Parameter Specification Variables](https://peps.python.org/pep-0612/)
- [PEP 646 - Variadic Generics](https://peps.python.org/pep-0646/)
- [PEP 673 - Self Type](https://peps.python.org/pep-0673/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)

### Type Checking Tools

- [mypy Official Documentation](https://mypy.readthedocs.io/)
- [pyright](https://github.com/microsoft/pyright)
- [Pyre](https://pyre-check.org/)

### Deep Dive Resources

- [Robust Python](https://www.oreilly.com/library/view/robust-python/9781098100667/) - Patrick Viafore
- [Python Type Checking (Real Python)](https://realpython.com/python-type-checking/)
- [Typing Best Practices](https://typing.readthedocs.io/en/latest/)

### Related Projects

- [typeguard](https://github.com/agronholm/typeguard) - Runtime type checking
- [beartype](https://github.com/beartype/beartype) - High-performance runtime type checking
- [pydantic](https://docs.pydantic.dev/) - Data validation and settings management

### Community Resources

- [Python typing Discussions](https://github.com/python/typing/discussions)
- [mypy Issue Tracker](https://github.com/python/mypy/issues)
- [typing-sig Mailing List](https://mail.python.org/mailman3/lists/typing-sig.python.org/)
