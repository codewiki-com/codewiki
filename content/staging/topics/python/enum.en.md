---
title: Python Enum Module
description: Master Python enum module including basic enums, IntEnum, Flag and custom enumerations
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - Enum
  - enumeration
  - types
status: imported
origin: old/src/content/docs/python/enum.en.md
divergence: 0.495
issues:
  - divergent
legacy:
  category: Python
  subcategory: Standard Library
  order: 38
  lastUpdated: 2026-01-07
---

Enumerations are sets of symbolic names bound to unique constant values. Python's `enum` module provides a standardized way to create enumeration types, making code more readable, self-documenting, and type-safe.

## Introduction to Enumerations

Before enumerations, Python developers often used plain constants or strings to represent fixed sets of values:

```python
# The old way - error-prone and lacking type safety
STATUS_PENDING = 1
STATUS_RUNNING = 2
STATUS_COMPLETED = 3

# What prevents this mistake?
status = 999  # No error, but invalid value
```

With enumerations, you get compile-time-like safety and better code organization:

```python
from enum import Enum

class Status(Enum):
    PENDING = 1
    RUNNING = 2
    COMPLETED = 3

# status = Status(999)  # Raises ValueError: 999 is not a valid Status
```

## Basic Enumerations

### Creating an Enum Class

Use the `Enum` base class to create enumerations:

```python
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

# Accessing enum members
print(Color.RED)        # Color.RED
print(Color.RED.name)   # RED
print(Color.RED.value)  # 1
```

Each enum member has two key properties:
- `name`: The string name of the member (e.g., "RED")
- `value`: The assigned value (e.g., 1)

### Enum Member Characteristics

Enum members are immutable and unique:

```python
from enum import Enum

class Status(Enum):
    PENDING = 1
    RUNNING = 2
    COMPLETED = 3
    FAILED = 4

# Enum members are singletons
status1 = Status.PENDING
status2 = Status.PENDING
print(status1 is status2)  # True

# Enum members are immutable
# Status.PENDING = 5  # Raises AttributeError
```

### Accessing Enum Members

There are multiple ways to access enum members:

```python
from enum import Enum

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

# Access by name (subscript notation)
print(Priority['HIGH'])      # Priority.HIGH

# Access by value (call notation)
print(Priority(2))           # Priority.MEDIUM

# Iterate over all members
for priority in Priority:
    print(f"{priority.name} = {priority.value}")
# LOW = 1
# MEDIUM = 2
# HIGH = 3

# Get all members as a list
print(list(Priority))  # [<Priority.LOW: 1>, <Priority.MEDIUM: 2>, <Priority.HIGH: 3>]

# Get member count
print(len(Priority))  # 3
```

### String-Valued Enumerations

Enum values can be of any type, including strings:

```python
from enum import Enum

class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"

print(HttpMethod.GET.value)  # GET

# Useful for APIs and configurations
def make_request(method: HttpMethod, url: str):
    print(f"Making {method.value} request to {url}")

make_request(HttpMethod.POST, "https://api.example.com/users")
```

## The auto() Function

Use `auto()` to automatically generate enum values:

```python
from enum import Enum, auto

class Direction(Enum):
    NORTH = auto()
    SOUTH = auto()
    EAST = auto()
    WEST = auto()

for d in Direction:
    print(f"{d.name} = {d.value}")
# NORTH = 1
# SOUTH = 2
# EAST = 3
# WEST = 4
```

By default, `auto()` generates sequential integers starting from 1.

### Customizing auto() Behavior

Override the `_generate_next_value_` method to customize automatic value generation:

```python
from enum import Enum, auto

class AutoName(Enum):
    @staticmethod
    def _generate_next_value_(name, start, count, last_values):
        return name.lower()

class HttpMethod(AutoName):
    GET = auto()
    POST = auto()
    PUT = auto()
    DELETE = auto()

print(HttpMethod.GET.value)     # get
print(HttpMethod.DELETE.value)  # delete
```

The `_generate_next_value_` method receives:
- `name`: The name of the member being defined
- `start`: The start value (default is 1)
- `count`: Number of members already created
- `last_values`: List of previously generated values

### Mixing auto() with Explicit Values

You can mix `auto()` with explicit values:

```python
from enum import Enum, auto

class Mixed(Enum):
    A = auto()      # 1
    B = 100         # 100
    C = auto()      # 101 (continues from last value)
    D = auto()      # 102

for member in Mixed:
    print(f"{member.name} = {member.value}")
```

## IntEnum: Integer Enumerations

`IntEnum` members are also integers, allowing direct comparison and arithmetic operations with integers:

```python
from enum import IntEnum

class StatusCode(IntEnum):
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    NOT_FOUND = 404
    SERVER_ERROR = 500

# Direct comparison with integers
print(StatusCode.OK == 200)  # True
print(StatusCode.NOT_FOUND > 300)  # True

# Can be used in arithmetic
print(StatusCode.OK + 1)  # 201

# Can be used as list indices
responses = {200: "success", 201: "created"}
print(responses[StatusCode.OK])  # success
```

### IntEnum vs Regular Enum

Understanding the difference is crucial for correct usage:

```python
from enum import Enum, IntEnum

class RegularEnum(Enum):
    A = 1
    B = 2

class IntegerEnum(IntEnum):
    A = 1
    B = 2

# Regular enum does not equal its integer value
print(RegularEnum.A == 1)  # False

# IntEnum equals its integer value
print(IntegerEnum.A == 1)  # True

# IntEnum can be sorted with integers
values = [IntegerEnum.B, 0, IntegerEnum.A, 3]
print(sorted(values))  # [0, <IntegerEnum.A: 1>, <IntegerEnum.B: 2>, 3]

# Regular enum members can only be compared with each other
print(RegularEnum.A == RegularEnum.A)  # True
print(RegularEnum.A is RegularEnum.A)  # True (identity comparison)
```

**When to use IntEnum:**
- When you need backward compatibility with code expecting integers
- When interfacing with external systems using integer codes
- When enum values need to participate in arithmetic operations

**When to use regular Enum:**
- When you want strict type safety
- When integer comparison should not be allowed
- For most general-purpose enumerations

## Flag and IntFlag: Bitwise Flags

### Flag Basics

`Flag` is designed for creating combinable bit flags:

```python
from enum import Flag, auto

class Permission(Flag):
    READ = auto()     # 1
    WRITE = auto()    # 2
    EXECUTE = auto()  # 4

# Combine flags using bitwise OR
rw = Permission.READ | Permission.WRITE
print(rw)  # Permission.READ|WRITE

# Check if a flag is present
print(Permission.READ in rw)     # True
print(Permission.EXECUTE in rw)  # False

# Remove a flag using bitwise operations
r_only = rw & ~Permission.WRITE
print(r_only)  # Permission.READ

# Add a flag
full = r_only | Permission.WRITE | Permission.EXECUTE
print(full)  # Permission.READ|WRITE|EXECUTE
```

### Advanced Flag Examples

```python
from enum import Flag, auto

class FileAccess(Flag):
    NONE = 0
    READ = auto()
    WRITE = auto()
    EXECUTE = auto()

    # Pre-defined combinations
    READ_WRITE = READ | WRITE
    FULL_ACCESS = READ | WRITE | EXECUTE

# Using pre-defined combinations
user_access = FileAccess.READ_WRITE
print(FileAccess.READ in user_access)     # True
print(FileAccess.EXECUTE in user_access)  # False

# Adding permissions
user_access |= FileAccess.EXECUTE
print(user_access == FileAccess.FULL_ACCESS)  # True

# Check if any permissions are set
print(bool(user_access))      # True
print(bool(FileAccess.NONE))  # False

# Iterate over set flags
for flag in FileAccess.FULL_ACCESS:
    print(flag.name)
# READ
# WRITE
# EXECUTE
```

### IntFlag

`IntFlag` combines features of both `IntEnum` and `Flag`:

```python
from enum import IntFlag, auto

class Options(IntFlag):
    NONE = 0
    VERBOSE = auto()
    DEBUG = auto()
    FORCE = auto()

# Can perform bitwise operations with integers
options = Options.VERBOSE | Options.DEBUG
print(options)  # Options.VERBOSE|DEBUG
print(int(options))  # 3

# Can be compared with integers
print(options == 3)  # True

# Create from integer
opts = Options(5)  # VERBOSE | FORCE
print(opts)  # Options.VERBOSE|FORCE

# Works with integer bitwise operations
raw_flags = 0b111  # Binary for 7
all_opts = Options(raw_flags)
print(all_opts)  # Options.VERBOSE|DEBUG|FORCE
```

## The @unique Decorator

The `@unique` decorator ensures all enum values are unique:

```python
from enum import Enum, unique

@unique
class Status(Enum):
    PENDING = 1
    RUNNING = 2
    COMPLETED = 3
    # DONE = 3  # Would raise ValueError: duplicate values found

# Without @unique, duplicate values create aliases
class StatusWithAlias(Enum):
    PENDING = 1
    RUNNING = 2
    COMPLETED = 3
    DONE = 3  # DONE becomes an alias for COMPLETED

print(StatusWithAlias.DONE is StatusWithAlias.COMPLETED)  # True
print(StatusWithAlias.DONE.name)  # COMPLETED (uses canonical name)
```

### Working with Aliases

```python
from enum import Enum

class HttpStatus(Enum):
    OK = 200
    SUCCESS = 200  # Alias

    NOT_FOUND = 404
    MISSING = 404  # Alias

# Aliases are excluded from iteration
print(list(HttpStatus))
# [<HttpStatus.OK: 200>, <HttpStatus.NOT_FOUND: 404>]

# But can be accessed by name
print(HttpStatus.SUCCESS)      # HttpStatus.OK
print(HttpStatus['MISSING'])   # HttpStatus.NOT_FOUND

# Get all members including aliases
print(HttpStatus.__members__)
# {'OK': <HttpStatus.OK: 200>, 'SUCCESS': <HttpStatus.OK: 200>,
#  'NOT_FOUND': <HttpStatus.NOT_FOUND: 404>, 'MISSING': <HttpStatus.NOT_FOUND: 404>}
```

## Custom Enum Methods

### Adding Instance Methods

```python
from enum import Enum

class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS = (4.869e+24, 6.0518e6)
    EARTH = (5.976e+24, 6.37814e6)
    MARS = (6.421e+23, 3.3972e6)
    JUPITER = (1.9e+27, 7.1492e7)

    def __init__(self, mass, radius):
        self.mass = mass      # Mass in kg
        self.radius = radius  # Radius in meters

    @property
    def surface_gravity(self):
        """Calculate surface gravity in m/s^2."""
        G = 6.67430e-11  # Gravitational constant
        return G * self.mass / (self.radius ** 2)

    def weight_on(self, earth_weight):
        """Calculate weight on this planet given Earth weight."""
        earth_g = Planet.EARTH.surface_gravity
        return earth_weight * self.surface_gravity / earth_g

# Using custom methods
print(f"Earth surface gravity: {Planet.EARTH.surface_gravity:.2f} m/s^2")
print(f"Mars surface gravity: {Planet.MARS.surface_gravity:.2f} m/s^2")

weight = 70  # kg
print(f"A {weight}kg person weighs {Planet.MARS.weight_on(weight):.2f}kg on Mars")
print(f"A {weight}kg person weighs {Planet.JUPITER.weight_on(weight):.2f}kg on Jupiter")
```

### Adding Class Methods

```python
from enum import Enum
from datetime import date

class Weekday(Enum):
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6
    SUNDAY = 7

    @classmethod
    def from_date(cls, d: date):
        """Create Weekday from a date object."""
        return cls(d.isoweekday())

    @classmethod
    def workdays(cls):
        """Return list of workdays."""
        return [cls.MONDAY, cls.TUESDAY, cls.WEDNESDAY,
                cls.THURSDAY, cls.FRIDAY]

    @classmethod
    def weekend(cls):
        """Return list of weekend days."""
        return [cls.SATURDAY, cls.SUNDAY]

    def is_workday(self):
        """Check if this day is a workday."""
        return self in self.workdays()

    def is_weekend(self):
        """Check if this day is a weekend."""
        return self in self.weekend()

# Usage
today = date.today()
weekday = Weekday.from_date(today)
print(f"Today is {weekday.name}")
print(f"Is workday: {weekday.is_workday()}")
print(f"Workdays: {[d.name for d in Weekday.workdays()]}")
```

### Customizing __str__ and __repr__

```python
from enum import Enum

class LogLevel(Enum):
    DEBUG = 10
    INFO = 20
    WARNING = 30
    ERROR = 40
    CRITICAL = 50

    def __str__(self):
        return f"[{self.name}]"

    def __repr__(self):
        return f"LogLevel.{self.name}({self.value})"

print(str(LogLevel.ERROR))    # [ERROR]
print(repr(LogLevel.ERROR))   # LogLevel.ERROR(40)

# Useful in formatted strings
level = LogLevel.WARNING
print(f"Current level: {level}")  # Current level: [WARNING]
```

## Enum Comparison

### Identity and Equality Comparison

```python
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

# Identity comparison (recommended)
print(Color.RED is Color.RED)   # True
print(Color.RED is Color.BLUE)  # False

# Equality comparison
print(Color.RED == Color.RED)   # True
print(Color.RED == Color.BLUE)  # False

# Comparison with non-enum values
print(Color.RED == 1)       # False (regular Enum)
print(Color.RED == "RED")   # False
```

### Ordering Comparison

Regular `Enum` does not support ordering, but you can add it:

```python
from enum import Enum
from functools import total_ordering

@total_ordering
class Grade(Enum):
    F = 0
    D = 1
    C = 2
    B = 3
    A = 4

    def __lt__(self, other):
        if isinstance(other, Grade):
            return self.value < other.value
        return NotImplemented

    def __eq__(self, other):
        if isinstance(other, Grade):
            return self.value == other.value
        return NotImplemented

print(Grade.A > Grade.B)   # True
print(Grade.C >= Grade.D)  # True

# Sorting works
grades = [Grade.B, Grade.A, Grade.C, Grade.F]
print(sorted(grades))  # [<Grade.F: 0>, <Grade.C: 2>, <Grade.B: 3>, <Grade.A: 4>]
```

## StrEnum: String Enumerations

Python 3.11 introduced `StrEnum`:

```python
from enum import StrEnum, auto

class HttpMethod(StrEnum):
    GET = auto()
    POST = auto()
    PUT = auto()
    DELETE = auto()

# Values are automatically lowercase member names
print(HttpMethod.GET)          # get
print(HttpMethod.GET.upper())  # GET

# Works directly in string operations
method = HttpMethod.POST
print(f"Method: {method}")     # Method: post
print(method == "post")        # True

# Can be concatenated
url = "https://api.example.com" + "/" + HttpMethod.GET
print(url)  # https://api.example.com/get
```

### StrEnum for Python 3.10 and Earlier

```python
from enum import Enum

class StrEnum(str, Enum):
    """StrEnum implementation for Python 3.10 and earlier."""
    pass

class Color(StrEnum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"

print(Color.RED == "red")  # True
print(f"Color is {Color.RED}")  # Color is red
print(isinstance(Color.RED, str))  # True
```

## Functional API

Enums can be created using a functional syntax:

```python
from enum import Enum

# Simple creation
Color = Enum('Color', ['RED', 'GREEN', 'BLUE'])

print(Color.RED)        # Color.RED
print(Color.RED.value)  # 1 (auto-assigned)

# With explicit values
Status = Enum('Status', [('PENDING', 1), ('RUNNING', 2), ('DONE', 3)])

# From a string
Direction = Enum('Direction', 'NORTH SOUTH EAST WEST')

# From a dictionary
Priority = Enum('Priority', {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3})
```

This is useful for dynamic enum creation, but the class syntax is preferred for static definitions.

## Practical Examples

### State Machine

```python
from enum import Enum, auto

class OrderState(Enum):
    CREATED = auto()
    CONFIRMED = auto()
    PROCESSING = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()

    def can_transition_to(self, new_state):
        """Check if transition to new state is valid."""
        transitions = {
            OrderState.CREATED: [OrderState.CONFIRMED, OrderState.CANCELLED],
            OrderState.CONFIRMED: [OrderState.PROCESSING, OrderState.CANCELLED],
            OrderState.PROCESSING: [OrderState.SHIPPED, OrderState.CANCELLED],
            OrderState.SHIPPED: [OrderState.DELIVERED],
            OrderState.DELIVERED: [],
            OrderState.CANCELLED: [],
        }
        return new_state in transitions.get(self, [])

class Order:
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.state = OrderState.CREATED

    def transition_to(self, new_state: OrderState) -> bool:
        if self.state.can_transition_to(new_state):
            print(f"Order {self.order_id}: {self.state.name} -> {new_state.name}")
            self.state = new_state
            return True
        else:
            print(f"Order {self.order_id}: Cannot transition from {self.state.name} to {new_state.name}")
            return False

# Usage
order = Order("ORD-001")
order.transition_to(OrderState.CONFIRMED)   # Success
order.transition_to(OrderState.PROCESSING)  # Success
order.transition_to(OrderState.CREATED)     # Fails - invalid transition
order.transition_to(OrderState.SHIPPED)     # Success
order.transition_to(OrderState.DELIVERED)   # Success
```

### Configuration Flags

```python
from enum import Flag, auto

class LogConfig(Flag):
    NONE = 0
    CONSOLE = auto()
    FILE = auto()
    DATABASE = auto()
    EMAIL = auto()

    # Pre-defined combinations
    STANDARD = CONSOLE | FILE
    FULL = CONSOLE | FILE | DATABASE
    ALERT = CONSOLE | EMAIL

class Logger:
    def __init__(self, config: LogConfig):
        self.config = config

    def log(self, message: str):
        if LogConfig.CONSOLE in self.config:
            print(f"[Console] {message}")
        if LogConfig.FILE in self.config:
            print(f"[File] {message}")
        if LogConfig.DATABASE in self.config:
            print(f"[Database] {message}")
        if LogConfig.EMAIL in self.config:
            print(f"[Email] {message}")

# Using pre-defined configuration
logger = Logger(LogConfig.STANDARD)
logger.log("Application started")

# Using custom combination
alert_logger = Logger(LogConfig.CONSOLE | LogConfig.EMAIL)
alert_logger.log("Critical error!")
```

### Combining with Dataclasses

```python
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

class TaskPriority(Enum):
    LOW = auto()
    MEDIUM = auto()
    HIGH = auto()
    URGENT = auto()

    def __lt__(self, other):
        if isinstance(other, TaskPriority):
            return self.value < other.value
        return NotImplemented

class TaskStatus(Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    REVIEW = "In Review"
    DONE = "Done"

@dataclass
class Task:
    title: str
    priority: TaskPriority
    status: TaskStatus = TaskStatus.TODO
    assignee: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)

    def __str__(self):
        return (f"[{self.priority.name}] {self.title} "
                f"- {self.status.value} "
                f"({self.assignee or 'Unassigned'})")

# Create tasks
tasks = [
    Task("Fix login bug", TaskPriority.URGENT, assignee="Alice"),
    Task("Write documentation", TaskPriority.LOW),
    Task("Code review", TaskPriority.MEDIUM, TaskStatus.IN_PROGRESS, "Bob"),
]

# Sort by priority (highest first)
for task in sorted(tasks, key=lambda t: t.priority, reverse=True):
    print(task)
```

### API Response Handling

```python
from enum import Enum
from typing import Any, Optional
from dataclasses import dataclass

class ResponseStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    PENDING = "pending"

@dataclass
class APIResponse:
    status: ResponseStatus
    data: Optional[Any] = None
    message: Optional[str] = None
    error_code: Optional[int] = None

    @classmethod
    def success(cls, data: Any) -> "APIResponse":
        return cls(ResponseStatus.SUCCESS, data=data)

    @classmethod
    def error(cls, message: str, code: int) -> "APIResponse":
        return cls(ResponseStatus.ERROR, message=message, error_code=code)

    @classmethod
    def pending(cls, message: str = "Processing") -> "APIResponse":
        return cls(ResponseStatus.PENDING, message=message)

    def is_success(self) -> bool:
        return self.status == ResponseStatus.SUCCESS

    def is_error(self) -> bool:
        return self.status == ResponseStatus.ERROR

# Usage
response = APIResponse.success({"user_id": 123, "name": "Alice"})
if response.is_success():
    print(f"Got data: {response.data}")

error_response = APIResponse.error("User not found", 404)
if error_response.is_error():
    print(f"Error {error_response.error_code}: {error_response.message}")
```

### Database Model Integration

```python
from enum import Enum

class UserRole(Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

    @classmethod
    def from_string(cls, role_str: str) -> "UserRole":
        """Convert database string to enum."""
        for role in cls:
            if role.value == role_str:
                return role
        raise ValueError(f"Unknown role: {role_str}")

    def has_permission(self, permission: str) -> bool:
        """Check if role has a specific permission."""
        permissions = {
            UserRole.ADMIN: ["read", "write", "delete", "admin"],
            UserRole.MODERATOR: ["read", "write", "delete"],
            UserRole.USER: ["read", "write"],
            UserRole.GUEST: ["read"],
        }
        return permission in permissions.get(self, [])

# Simulating database retrieval
db_role = "moderator"
role = UserRole.from_string(db_role)

print(f"Role: {role.name}")
print(f"Can read: {role.has_permission('read')}")      # True
print(f"Can admin: {role.has_permission('admin')}")    # False
```

## Best Practices

### Use Enums Instead of Magic Numbers

```python
# Bad - Magic numbers
def set_log_level(level: int):
    if level == 1:
        print("Debug mode")
    elif level == 2:
        print("Info mode")

# Good - Self-documenting
class LogLevel(Enum):
    DEBUG = 1
    INFO = 2
    WARNING = 3

def set_log_level(level: LogLevel):
    print(f"{level.name} mode")
```

### Use @unique When Values Must Be Distinct

```python
from enum import Enum, unique

@unique
class ErrorCode(Enum):
    INVALID_INPUT = 100
    NOT_FOUND = 101
    UNAUTHORIZED = 102
    # Prevents accidental duplicates
```

### Leverage auto() to Reduce Errors

```python
from enum import Enum, auto

class State(Enum):
    INIT = auto()
    RUNNING = auto()
    PAUSED = auto()
    STOPPED = auto()
    # No risk of duplicate or out-of-sequence values
```

### Add Methods for Related Business Logic

```python
from enum import Enum

class PaymentStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

    def is_terminal(self) -> bool:
        """Check if this is a final state."""
        return self in (self.COMPLETED, self.FAILED, self.REFUNDED)

    def can_refund(self) -> bool:
        """Check if payment can be refunded."""
        return self == self.COMPLETED
```

### Use Flag for Combinable Options

```python
from enum import Flag, auto

class Capability(Flag):
    NONE = 0
    READ = auto()
    WRITE = auto()
    EXECUTE = auto()
    ALL = READ | WRITE | EXECUTE

# Better than multiple boolean parameters
def create_file(name: str, permissions: Capability):
    pass

create_file("data.txt", Capability.READ | Capability.WRITE)
```

### Prefer Identity Comparison (is) Over Equality (==)

```python
from enum import Enum

class Status(Enum):
    ACTIVE = 1
    INACTIVE = 2

status = Status.ACTIVE

# Preferred - faster and semantically clearer
if status is Status.ACTIVE:
    print("Active")

# Also works, but slightly slower
if status == Status.ACTIVE:
    print("Active")
```

## Summary

Python's `enum` module provides powerful enumeration capabilities:

| Type | Purpose | Key Features |
|------|---------|--------------|
| `Enum` | Basic enumeration | Immutable, iterable, singleton pattern |
| `IntEnum` | Integer enumeration | Comparable and operable with integers |
| `StrEnum` | String enumeration | Comparable with strings (Python 3.11+) |
| `Flag` | Bit flags | Supports bitwise combination |
| `IntFlag` | Integer bit flags | Combines Flag and IntEnum features |

Key benefits of using enumerations:

1. **Type Safety**: Prevents invalid values at runtime
2. **Readability**: Self-documenting code with meaningful names
3. **Maintainability**: Centralized constant definitions
4. **IDE Support**: Better autocompletion and error detection
5. **Iteration**: Easy to enumerate all valid values
6. **Extensibility**: Can add methods and properties

Enumerations are essential tools for building robust, maintainable Python applications. Use them whenever you have a fixed set of related constants, and take advantage of custom methods to encapsulate related business logic.
