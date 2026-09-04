---
title: Dataclasses
description: Python dataclasses module explained, auto-generated special methods, field options and advanced usage
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - dataclasses
  - Data Classes
  - Type Hints
status: imported
origin: old/src/content/docs/python/dataclasses.en.md
divergence: 0.252
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 15
  lastUpdated: 2026-01-07
---

Dataclasses, introduced in Python 3.7 via PEP 557, provide a decorator and functions for automatically generating special methods like `__init__()`, `__repr__()`, and `__eq__()` for user-defined classes. They reduce boilerplate code while maintaining full control over class behavior.

## Introduction to Dataclasses

Before dataclasses, creating a simple class to hold data required writing repetitive code:

```python
class Person:
    def __init__(self, name: str, age: int, email: str):
        self.name = name
        self.age = age
        self.email = email

    def __repr__(self):
        return f"Person(name={self.name!r}, age={self.age!r}, email={self.email!r})"

    def __eq__(self, other):
        if not isinstance(other, Person):
            return NotImplemented
        return (self.name, self.age, self.email) == (other.name, other.age, other.email)
```

With dataclasses, this becomes significantly simpler:

```python
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int
    email: str
```

This single decorator automatically generates `__init__()`, `__repr__()`, and `__eq__()` methods based on the class attributes.

## The @dataclass Decorator

The `@dataclass` decorator transforms a regular class into a dataclass. It accepts several parameters to customize its behavior:

```python
@dataclass(
    init=True,           # Generate __init__ method
    repr=True,           # Generate __repr__ method
    eq=True,             # Generate __eq__ method
    order=False,         # Generate comparison methods (__lt__, __le__, __gt__, __ge__)
    unsafe_hash=False,   # Generate __hash__ method
    frozen=False,        # Make instances immutable
    match_args=True,     # Generate __match_args__ for pattern matching (Python 3.10+)
    kw_only=False,       # Make all fields keyword-only (Python 3.10+)
    slots=False,         # Generate __slots__ (Python 3.10+)
    weakref_slot=False   # Add __weakref__ slot (Python 3.11+)
)
class MyClass:
    ...
```

### Basic Usage

```python
from dataclasses import dataclass

@dataclass
class Book:
    title: str
    author: str
    pages: int
    isbn: str

# Creating instances
book = Book("1984", "George Orwell", 328, "978-0451524935")
print(book)
# Output: Book(title='1984', author='George Orwell', pages=328, isbn='978-0451524935')

# Equality comparison
book2 = Book("1984", "George Orwell", 328, "978-0451524935")
print(book == book2)  # True
```

### Enabling Ordering

By default, dataclasses only generate `__eq__()`. To enable comparison operations, set `order=True`:

```python
@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int

v1 = Version(1, 2, 3)
v2 = Version(1, 3, 0)
v3 = Version(2, 0, 0)

print(v1 < v2)   # True
print(v2 < v3)   # True
print(sorted([v3, v1, v2]))  # [Version(1, 2, 3), Version(1, 3, 0), Version(2, 0, 0)]
```

Comparison is performed based on the tuple of field values in the order they are defined.

## Field Options with field()

The `field()` function provides fine-grained control over individual fields:

```python
from dataclasses import dataclass, field

@dataclass
class Product:
    name: str
    price: float
    quantity: int = 0
    tags: list = field(default_factory=list)
    internal_id: str = field(default="", repr=False)
    category: str = field(default="general", compare=False)
```

### field() Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `default` | MISSING | Default value for the field |
| `default_factory` | MISSING | A callable that returns the default value |
| `repr` | True | Include field in `__repr__()` output |
| `hash` | None | Include field in `__hash__()` calculation |
| `init` | True | Include field as an `__init__()` parameter |
| `compare` | True | Include field in comparison methods |
| `metadata` | None | Mapping for storing custom information |
| `kw_only` | MISSING | Make this field keyword-only (Python 3.10+) |

### Handling Mutable Default Values

A critical rule: never use mutable default values directly. This is a common Python pitfall that dataclasses prevent:

```python
# WRONG - This will raise an error
@dataclass
class WrongExample:
    items: list = []  # ValueError: mutable default <class 'list'> is not allowed

# CORRECT - Use default_factory
@dataclass
class CorrectExample:
    items: list = field(default_factory=list)
    settings: dict = field(default_factory=dict)
    coordinates: tuple = field(default_factory=lambda: (0, 0))
```

### Excluding Fields from Methods

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class User:
    username: str
    email: str
    password_hash: str = field(repr=False)  # Hide from repr
    created_at: float = field(compare=False)  # Exclude from equality
    _cache: Optional[dict] = field(
        default=None,
        repr=False,
        compare=False,
        hash=False
    )
```

### Using Metadata

The `metadata` parameter allows storing custom information about fields:

```python
from dataclasses import dataclass, field, fields

@dataclass
class FormField:
    name: str = field(metadata={"label": "Full Name", "required": True})
    email: str = field(metadata={"label": "Email Address", "required": True})
    phone: str = field(
        default="",
        metadata={"label": "Phone Number", "required": False}
    )

# Access metadata
for f in fields(FormField):
    print(f"{f.name}: {f.metadata}")
# name: {'label': 'Full Name', 'required': True}
# email: {'label': 'Email Address', 'required': True}
# phone: {'label': 'Phone Number', 'required': False}
```

## Default Values and Ordering

Fields with default values must come after fields without defaults:

```python
# WRONG - Causes TypeError
@dataclass
class WrongOrder:
    name: str = "Unknown"
    id: int  # Non-default after default

# CORRECT
@dataclass
class CorrectOrder:
    id: int
    name: str = "Unknown"
```

### Using field() for Non-init Fields

You can define fields that are not part of `__init__()`:

```python
from dataclasses import dataclass, field
import uuid

@dataclass
class Order:
    product: str
    quantity: int
    order_id: str = field(init=False)
    total: float = field(init=False, default=0.0)

    def __post_init__(self):
        self.order_id = str(uuid.uuid4())

order = Order("Widget", 5)
print(order.order_id)  # e.g., 'a1b2c3d4-e5f6-...'
```

## Post-Initialization with __post_init__

The `__post_init__()` method is called after the auto-generated `__init__()` completes. It is useful for:

- Validating field values
- Computing derived attributes
- Performing type conversions
- Setting up resources

```python
from dataclasses import dataclass, field

@dataclass
class Rectangle:
    width: float
    height: float
    area: float = field(init=False)
    perimeter: float = field(init=False)

    def __post_init__(self):
        if self.width <= 0 or self.height <= 0:
            raise ValueError("Dimensions must be positive")
        self.area = self.width * self.height
        self.perimeter = 2 * (self.width + self.height)

rect = Rectangle(5.0, 3.0)
print(f"Area: {rect.area}, Perimeter: {rect.perimeter}")
# Area: 15.0, Perimeter: 16.0
```

### InitVar for Init-Only Variables

Sometimes you need variables only during initialization. Use `InitVar` for this:

```python
from dataclasses import dataclass, field, InitVar

@dataclass
class DatabaseConnection:
    host: str
    port: int
    password: InitVar[str]  # Not stored as an attribute
    connection_string: str = field(init=False)

    def __post_init__(self, password: str):
        self.connection_string = f"db://{self.host}:{self.port}?auth={password}"

conn = DatabaseConnection("localhost", 5432, "secret123")
print(conn.connection_string)
# db://localhost:5432?auth=secret123
print(hasattr(conn, 'password'))  # False
```

## Frozen Dataclasses (Immutability)

Setting `frozen=True` creates immutable instances:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(3.0, 4.0)
# p.x = 5.0  # Raises FrozenInstanceError

# Frozen dataclasses are hashable by default
print(hash(p))  # Works!

# Can be used in sets and as dict keys
points = {Point(0, 0), Point(1, 1), Point(0, 0)}
print(len(points))  # 2 (duplicates removed)
```

### Creating Modified Copies with replace()

Since frozen instances cannot be modified, use `replace()` to create modified copies:

```python
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    debug: bool
    log_level: str
    max_connections: int

config = Config(debug=False, log_level="INFO", max_connections=100)
dev_config = replace(config, debug=True, log_level="DEBUG")

print(config)      # Config(debug=False, log_level='INFO', max_connections=100)
print(dev_config)  # Config(debug=True, log_level='DEBUG', max_connections=100)
```

## Inheritance with Dataclasses

Dataclasses support inheritance, but there are important considerations:

```python
from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    species: str

@dataclass
class Pet(Animal):
    owner: str
    vaccinated: bool = False

pet = Pet("Max", "Dog", "Alice", True)
print(pet)
# Pet(name='Max', species='Dog', owner='Alice', vaccinated=True)
```

### Handling Default Values in Inheritance

A child class cannot add non-default fields if the parent has default fields:

```python
from dataclasses import dataclass, field

@dataclass
class Base:
    x: int
    y: int = 0  # Default value

# WRONG - Would cause TypeError
# @dataclass
# class Child(Base):
#     z: int  # Non-default after default

# CORRECT - Use keyword-only arguments (Python 3.10+)
@dataclass(kw_only=True)
class Child(Base):
    z: int
    y: int = 0

# Or in earlier versions, give z a default
@dataclass
class ChildLegacy(Base):
    z: int = field(default=0)
```

### Overriding Parent Fields

```python
from dataclasses import dataclass, field

@dataclass
class Vehicle:
    brand: str
    model: str
    wheels: int = 4

@dataclass
class Motorcycle(Vehicle):
    wheels: int = 2  # Override default
    has_sidecar: bool = False

bike = Motorcycle("Harley-Davidson", "Street 750")
print(bike.wheels)  # 2
```

## Using Slots for Memory Efficiency

Python 3.10 introduced `slots=True` for dataclasses:

```python
from dataclasses import dataclass

@dataclass(slots=True)
class Coordinate:
    x: float
    y: float
    z: float

coord = Coordinate(1.0, 2.0, 3.0)
# coord.extra = "value"  # AttributeError: 'Coordinate' object has no attribute 'extra'
```

Benefits of slots:
- Reduced memory usage
- Slightly faster attribute access
- Prevents accidentally adding new attributes

## Comparison with namedtuple

Both dataclasses and `namedtuple` serve similar purposes, but have key differences:

### namedtuple

```python
from typing import NamedTuple

class PointNT(NamedTuple):
    x: float
    y: float

p = PointNT(3.0, 4.0)
print(p.x, p[0])  # 3.0 3.0 (supports indexing)
x, y = p  # Unpacking works

# Immutable
# p.x = 5.0  # AttributeError

# Inherits from tuple
print(isinstance(p, tuple))  # True
```

### dataclass

```python
from dataclasses import dataclass

@dataclass
class PointDC:
    x: float
    y: float

p = PointDC(3.0, 4.0)
print(p.x)  # 3.0
# print(p[0])  # TypeError (no indexing by default)

# Mutable by default
p.x = 5.0  # Works

# Does not inherit from tuple
print(isinstance(p, tuple))  # False
```

### When to Use Each

| Feature | namedtuple | dataclass |
|---------|------------|-----------|
| Tuple-like behavior | Yes | No |
| Mutable by default | No | Yes |
| Default values | Yes | Yes |
| Methods | Limited | Full support |
| Inheritance | Tricky | Natural |
| Post-init processing | No | Yes |
| Memory efficiency | High | High (with slots) |

**Use namedtuple when:**
- You need tuple compatibility
- Immutability is essential
- You need unpacking and indexing

**Use dataclass when:**
- You need mutability
- Complex initialization logic is required
- You want full class customization
- Inheritance is important

## Utility Functions

The dataclasses module provides several utility functions:

### fields()

Returns a tuple of Field objects for a dataclass:

```python
from dataclasses import dataclass, fields

@dataclass
class Employee:
    name: str
    department: str
    salary: float

for f in fields(Employee):
    print(f"Name: {f.name}, Type: {f.type}, Default: {f.default}")
```

### asdict() and astuple()

Convert dataclass instances to dictionaries or tuples:

```python
from dataclasses import dataclass, asdict, astuple

@dataclass
class Address:
    street: str
    city: str
    country: str

@dataclass
class Person:
    name: str
    age: int
    address: Address

person = Person("Alice", 30, Address("123 Main St", "Boston", "USA"))

# Convert to dictionary (nested)
person_dict = asdict(person)
print(person_dict)
# {'name': 'Alice', 'age': 30, 'address': {'street': '123 Main St', 'city': 'Boston', 'country': 'USA'}}

# Convert to tuple (nested)
person_tuple = astuple(person)
print(person_tuple)
# ('Alice', 30, ('123 Main St', 'Boston', 'USA'))
```

### is_dataclass()

Check if a class or instance is a dataclass:

```python
from dataclasses import dataclass, is_dataclass

@dataclass
class MyDataClass:
    value: int

class RegularClass:
    pass

print(is_dataclass(MyDataClass))      # True
print(is_dataclass(MyDataClass(42)))  # True
print(is_dataclass(RegularClass))     # False
```

### make_dataclass()

Dynamically create dataclasses:

```python
from dataclasses import make_dataclass, field

# Simple creation
Point = make_dataclass('Point', ['x', 'y'])

# With types and defaults
Person = make_dataclass(
    'Person',
    [
        ('name', str),
        ('age', int),
        ('email', str, field(default=""))
    ]
)

p = Person("Bob", 25)
print(p)  # Person(name='Bob', age=25, email='')
```

## Practical Examples

### Configuration Management

```python
from dataclasses import dataclass, field, asdict
from typing import Optional
import json

@dataclass
class DatabaseConfig:
    host: str = "localhost"
    port: int = 5432
    database: str = "myapp"
    username: str = "admin"
    password: str = field(default="", repr=False)
    ssl_enabled: bool = True

@dataclass
class AppConfig:
    app_name: str
    debug: bool = False
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    allowed_hosts: list = field(default_factory=lambda: ["localhost"])

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> "AppConfig":
        data = json.loads(json_str)
        data["database"] = DatabaseConfig(**data["database"])
        return cls(**data)

config = AppConfig("MyWebApp", debug=True)
print(config.to_json())
```

### Domain Modeling

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum

class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"

@dataclass
class OrderItem:
    product_id: str
    name: str
    quantity: int
    unit_price: float

    @property
    def total(self) -> float:
        return self.quantity * self.unit_price

@dataclass
class Order:
    order_id: str
    customer_id: str
    items: List[OrderItem] = field(default_factory=list)
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    notes: Optional[str] = None

    @property
    def total_amount(self) -> float:
        return sum(item.total for item in self.items)

    def add_item(self, item: OrderItem) -> None:
        self.items.append(item)

    def update_status(self, new_status: OrderStatus) -> None:
        self.status = new_status

# Usage
order = Order("ORD-001", "CUST-123")
order.add_item(OrderItem("PROD-1", "Widget", 2, 29.99))
order.add_item(OrderItem("PROD-2", "Gadget", 1, 49.99))
print(f"Total: ${order.total_amount:.2f}")  # Total: $109.97
```

### Data Transfer Objects (DTOs)

```python
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass(frozen=True)
class UserDTO:
    id: int
    username: str
    email: str
    full_name: Optional[str] = None

    @classmethod
    def from_orm(cls, user_model) -> "UserDTO":
        """Create DTO from ORM model."""
        return cls(
            id=user_model.id,
            username=user_model.username,
            email=user_model.email,
            full_name=user_model.full_name
        )

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {k: v for k, v in asdict(self).items() if v is not None}
```

## Best Practices

1. **Use type hints**: Always annotate fields with types for clarity and IDE support.

2. **Prefer frozen for immutable data**: Use `frozen=True` when instances should not change.

3. **Use default_factory for mutable defaults**: Never use mutable objects as direct defaults.

4. **Validate in __post_init__**: Perform validation after initialization.

5. **Consider slots**: Use `slots=True` (Python 3.10+) for memory-intensive applications.

6. **Hide sensitive data**: Use `repr=False` for passwords and other sensitive fields.

7. **Document with docstrings**: Dataclasses still benefit from class and field documentation.

```python
from dataclasses import dataclass, field

@dataclass(frozen=True, slots=True)
class APICredentials:
    """Immutable container for API credentials.

    Attributes:
        api_key: The public API key.
        api_secret: The secret key (hidden from repr).
        environment: Target environment (production/staging).
    """
    api_key: str
    api_secret: str = field(repr=False)
    environment: str = "production"

    def __post_init__(self):
        if not self.api_key:
            raise ValueError("API key cannot be empty")
        if self.environment not in ("production", "staging"):
            raise ValueError("Invalid environment")
```

## Summary

Dataclasses provide a powerful and concise way to create classes that primarily store data. They eliminate boilerplate while offering flexibility through the `@dataclass` decorator parameters and the `field()` function. Key features include:

- Automatic generation of `__init__`, `__repr__`, `__eq__`, and optionally other methods
- Fine-grained control over individual fields
- Support for immutability via `frozen=True`
- Clean integration with type hints
- Post-initialization processing with `__post_init__`
- Memory optimization with `slots=True`

Whether you are building configuration objects, domain models, or data transfer objects, dataclasses provide a clean and Pythonic solution that balances convenience with customizability.
