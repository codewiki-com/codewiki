---
title: JSON Handling
description: Complete guide to Python JSON, serialization, deserialization and custom encoders
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - JSON
  - Serialization
  - Data Exchange
status: imported
origin: old/src/content/docs/python/json.en.md
divergence: 0.226
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Standard Library
  order: 27
  lastUpdated: 2026-01-07
---

JSON (JavaScript Object Notation) is a lightweight, human-readable data interchange format that has become the standard for data exchange in web applications, APIs, and configuration files. Python's built-in `json` module provides simple and efficient tools for encoding Python objects into JSON format (serialization) and decoding JSON back into Python objects (deserialization).

## Overview

The `json` module offers four main functions:

- **json.dumps()**: Serialize Python object to a JSON formatted string
- **json.dump()**: Serialize Python object to a JSON formatted stream (file)
- **json.loads()**: Deserialize JSON string to a Python object
- **json.load()**: Deserialize JSON stream (file) to a Python object

## Basic Serialization with json.dumps()

The `dumps()` function converts Python objects to JSON strings.

### Simple Examples

```python
import json

# Serialize a dictionary
data = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}
json_string = json.dumps(data)
print(json_string)
# Output: {"name": "Alice", "age": 30, "city": "New York"}

# Serialize a list
items = ["apple", "banana", "cherry"]
print(json.dumps(items))
# Output: ["apple", "banana", "cherry"]

# Serialize nested structures
user = {
    "name": "Bob",
    "scores": [85, 90, 78],
    "address": {
        "street": "123 Main St",
        "zip": "10001"
    }
}
print(json.dumps(user))
# Output: {"name": "Bob", "scores": [85, 90, 78], "address": {"street": "123 Main St", "zip": "10001"}}
```

### Type Mapping

Python types are converted to JSON types as follows:

| Python | JSON |
|--------|------|
| dict | object |
| list, tuple | array |
| str | string |
| int, float | number |
| True | true |
| False | false |
| None | null |

```python
import json

data = {
    "string": "hello",
    "integer": 42,
    "float": 3.14,
    "boolean_true": True,
    "boolean_false": False,
    "null_value": None,
    "list": [1, 2, 3],
    "tuple": (4, 5, 6),  # Becomes a list in JSON
}

print(json.dumps(data))
# Output: {"string": "hello", "integer": 42, "float": 3.14, "boolean_true": true, "boolean_false": false, "null_value": null, "list": [1, 2, 3], "tuple": [4, 5, 6]}
```

## Basic Deserialization with json.loads()

The `loads()` function parses a JSON string and returns a Python object.

```python
import json

# Parse a JSON object
json_string = '{"name": "Alice", "age": 30, "active": true}'
data = json.loads(json_string)
print(data)
# Output: {'name': 'Alice', 'age': 30, 'active': True}
print(type(data))
# Output: <class 'dict'>

# Parse a JSON array
json_array = '[1, 2, 3, "four", null]'
items = json.loads(json_array)
print(items)
# Output: [1, 2, 3, 'four', None]

# Parse nested JSON
json_nested = '''
{
    "users": [
        {"name": "Alice", "age": 30},
        {"name": "Bob", "age": 25}
    ],
    "count": 2
}
'''
result = json.loads(json_nested)
print(result["users"][0]["name"])
# Output: Alice
```

## File Operations with json.dump() and json.load()

For working with files, use `dump()` and `load()` instead of `dumps()` and `loads()`.

### Writing JSON to a File

```python
import json

data = {
    "employees": [
        {"name": "Alice", "department": "Engineering", "salary": 75000},
        {"name": "Bob", "department": "Sales", "salary": 65000},
        {"name": "Charlie", "department": "Marketing", "salary": 60000}
    ],
    "company": "Tech Corp",
    "year": 2024
}

# Write to file
with open("employees.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

# Write with formatting for readability
with open("employees_formatted.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)
```

### Reading JSON from a File

```python
import json

# Read from file
with open("employees.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["company"])
# Output: Tech Corp

for employee in data["employees"]:
    print(f"{employee['name']}: ${employee['salary']}")
# Output:
# Alice: $75000
# Bob: $65000
# Charlie: $60000
```

### Safe File Reading with Error Handling

```python
import json
from pathlib import Path

def load_json_file(filepath):
    """Safely load a JSON file with proper error handling."""
    path = Path(filepath)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {filepath}: {e}")

# Usage
try:
    config = load_json_file("config.json")
except FileNotFoundError as e:
    print(f"Error: {e}")
except ValueError as e:
    print(f"Error: {e}")
```

## Pretty Printing

The `indent` parameter formats JSON output for human readability.

```python
import json

data = {
    "name": "Project Alpha",
    "version": "1.0.0",
    "dependencies": {
        "requests": "2.28.0",
        "numpy": "1.23.0"
    },
    "scripts": {
        "test": "pytest",
        "build": "python setup.py build"
    }
}

# Default output (compact)
print(json.dumps(data))
# Output: {"name": "Project Alpha", "version": "1.0.0", "dependencies": {"requests": "2.28.0", "numpy": "1.23.0"}, "scripts": {"test": "pytest", "build": "python setup.py build"}}

# Pretty printed with 2-space indent
print(json.dumps(data, indent=2))
# Output:
# {
#   "name": "Project Alpha",
#   "version": "1.0.0",
#   "dependencies": {
#     "requests": "2.28.0",
#     "numpy": "1.23.0"
#   },
#   "scripts": {
#     "test": "pytest",
#     "build": "python setup.py build"
#   }
# }

# Pretty printed with 4-space indent
print(json.dumps(data, indent=4))

# Using tab characters
print(json.dumps(data, indent="\t"))
```

### Additional Formatting Options

```python
import json

data = {"name": "Alice", "age": 30, "scores": [85, 90, 78]}

# sort_keys: Sort dictionary keys alphabetically
print(json.dumps(data, sort_keys=True, indent=2))
# Output:
# {
#   "age": 30,
#   "name": "Alice",
#   "scores": [
#     85,
#     90,
#     78
#   ]
# }

# separators: Customize separators for compact output
print(json.dumps(data, separators=(",", ":")))
# Output: {"name":"Alice","age":30,"scores":[85,90,78]}

# separators with pretty printing
print(json.dumps(data, indent=2, separators=(", ", ": ")))
```

## Handling Non-Serializable Types

By default, JSON can only handle basic Python types. For other types, you need custom serialization.

### The Problem

```python
import json
from datetime import datetime, date
from decimal import Decimal

# These will raise TypeError
data = {
    "timestamp": datetime.now(),
    "date": date.today(),
    "amount": Decimal("99.99"),
    "data": bytes([1, 2, 3])
}

try:
    json.dumps(data)
except TypeError as e:
    print(f"Error: {e}")
# Error: Object of type datetime is not JSON serializable
```

### Using the default Parameter

The `default` parameter allows you to specify a function for handling non-serializable types.

```python
import json
from datetime import datetime, date
from decimal import Decimal

def json_serializer(obj):
    """Custom serializer for objects not serializable by default."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, bytes):
        return obj.decode("utf-8")
    elif isinstance(obj, set):
        return list(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

data = {
    "timestamp": datetime(2024, 6, 15, 10, 30, 0),
    "date": date(2024, 6, 15),
    "amount": Decimal("99.99"),
    "tags": {"python", "json", "tutorial"}
}

json_string = json.dumps(data, default=json_serializer, indent=2)
print(json_string)
# Output:
# {
#   "timestamp": "2024-06-15T10:30:00",
#   "date": "2024-06-15",
#   "amount": 99.99,
#   "tags": ["python", "json", "tutorial"]
# }
```

## Custom JSON Encoders

For more complex serialization needs, create a custom encoder class by extending `json.JSONEncoder`.

### Basic Custom Encoder

```python
import json
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

class CustomJSONEncoder(json.JSONEncoder):
    """Extended JSON encoder for common Python types."""

    def default(self, obj):
        if isinstance(obj, datetime):
            return {
                "_type": "datetime",
                "value": obj.isoformat()
            }
        elif isinstance(obj, date):
            return {
                "_type": "date",
                "value": obj.isoformat()
            }
        elif isinstance(obj, Decimal):
            return {
                "_type": "decimal",
                "value": str(obj)
            }
        elif isinstance(obj, UUID):
            return {
                "_type": "uuid",
                "value": str(obj)
            }
        elif isinstance(obj, set):
            return {
                "_type": "set",
                "value": list(obj)
            }
        elif isinstance(obj, bytes):
            return {
                "_type": "bytes",
                "value": obj.hex()
            }
        # Let the base class raise TypeError for unknown types
        return super().default(obj)

# Usage
from uuid import uuid4

data = {
    "id": uuid4(),
    "created": datetime.now(),
    "amount": Decimal("1234.56"),
    "tags": {"important", "urgent"}
}

json_string = json.dumps(data, cls=CustomJSONEncoder, indent=2)
print(json_string)
```

### Encoder for Data Classes

```python
import json
from dataclasses import dataclass, asdict, is_dataclass
from datetime import datetime
from typing import List

@dataclass
class Address:
    street: str
    city: str
    zip_code: str

@dataclass
class Person:
    name: str
    age: int
    email: str
    address: Address
    created_at: datetime

class DataclassJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles dataclasses."""

    def default(self, obj):
        if is_dataclass(obj):
            return asdict(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Usage
person = Person(
    name="Alice",
    age=30,
    email="alice@example.com",
    address=Address("123 Main St", "New York", "10001"),
    created_at=datetime.now()
)

json_string = json.dumps(person, cls=DataclassJSONEncoder, indent=2)
print(json_string)
# Output:
# {
#   "name": "Alice",
#   "age": 30,
#   "email": "alice@example.com",
#   "address": {
#     "street": "123 Main St",
#     "city": "New York",
#     "zip_code": "10001"
#   },
#   "created_at": "2024-06-15T10:30:00.123456"
# }
```

## Custom JSON Decoders

To reverse custom encoding, use the `object_hook` parameter or create a custom decoder.

### Using object_hook

```python
import json
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

def custom_decoder(dct):
    """Custom decoder to restore Python objects from JSON."""
    if "_type" not in dct:
        return dct

    type_name = dct["_type"]
    value = dct["value"]

    if type_name == "datetime":
        return datetime.fromisoformat(value)
    elif type_name == "date":
        return date.fromisoformat(value)
    elif type_name == "decimal":
        return Decimal(value)
    elif type_name == "uuid":
        return UUID(value)
    elif type_name == "set":
        return set(value)
    elif type_name == "bytes":
        return bytes.fromhex(value)

    return dct

# Round-trip example
original = {
    "id": UUID("12345678-1234-5678-1234-567812345678"),
    "created": datetime(2024, 6, 15, 10, 30),
    "amount": Decimal("99.99"),
    "tags": {"python", "json"}
}

# Encode
encoded = json.dumps(original, cls=CustomJSONEncoder)

# Decode
decoded = json.loads(encoded, object_hook=custom_decoder)

print(f"Original ID type: {type(original['id'])}")
print(f"Decoded ID type: {type(decoded['id'])}")
print(f"Values match: {original['id'] == decoded['id']}")
```

### Custom JSONDecoder Class

```python
import json
from datetime import datetime

class CustomJSONDecoder(json.JSONDecoder):
    """Custom JSON decoder with special handling."""

    def __init__(self, *args, **kwargs):
        super().__init__(object_hook=self.object_hook, *args, **kwargs)

    def object_hook(self, dct):
        # Convert ISO format strings to datetime
        for key, value in dct.items():
            if isinstance(value, str):
                # Try to parse as datetime
                try:
                    if "T" in value and len(value) >= 19:
                        dct[key] = datetime.fromisoformat(value)
                except ValueError:
                    pass
        return dct

# Usage
json_string = '{"name": "Alice", "created": "2024-06-15T10:30:00", "updated": "2024-06-16T14:45:30"}'
data = json.loads(json_string, cls=CustomJSONDecoder)
print(type(data["created"]))
# Output: <class 'datetime.datetime'>
```

## Handling Dates and Times

Date/time handling is a common challenge in JSON serialization.

### ISO 8601 Format (Recommended)

```python
import json
from datetime import datetime, date, time, timezone, timedelta

def datetime_handler(obj):
    """Convert datetime objects to ISO 8601 strings."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    elif isinstance(obj, time):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

# Various datetime formats
data = {
    "datetime": datetime(2024, 6, 15, 10, 30, 45, 123456),
    "date_only": date(2024, 6, 15),
    "time_only": time(10, 30, 45),
    "with_timezone": datetime(2024, 6, 15, 10, 30, tzinfo=timezone.utc),
    "with_offset": datetime(2024, 6, 15, 10, 30, tzinfo=timezone(timedelta(hours=-5)))
}

json_string = json.dumps(data, default=datetime_handler, indent=2)
print(json_string)
# Output:
# {
#   "datetime": "2024-06-15T10:30:45.123456",
#   "date_only": "2024-06-15",
#   "time_only": "10:30:45",
#   "with_timezone": "2024-06-15T10:30:00+00:00",
#   "with_offset": "2024-06-15T10:30:00-05:00"
# }
```

### Unix Timestamp Format

```python
import json
from datetime import datetime, timezone

def datetime_to_timestamp(obj):
    """Convert datetime to Unix timestamp."""
    if isinstance(obj, datetime):
        return obj.timestamp()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def timestamp_to_datetime(dct):
    """Convert timestamp fields back to datetime."""
    timestamp_fields = ["created_at", "updated_at", "timestamp"]
    for field in timestamp_fields:
        if field in dct and isinstance(dct[field], (int, float)):
            dct[field] = datetime.fromtimestamp(dct[field], tz=timezone.utc)
    return dct

# Encode
data = {"event": "login", "created_at": datetime.now(timezone.utc)}
encoded = json.dumps(data, default=datetime_to_timestamp)
print(encoded)
# Output: {"event": "login", "created_at": 1718445045.123456}

# Decode
decoded = json.loads(encoded, object_hook=timestamp_to_datetime)
print(decoded["created_at"])
# Output: 2024-06-15 10:30:45.123456+00:00
```

## Encoding Classes and Objects

### Using __dict__

```python
import json

class User:
    def __init__(self, name, email, age):
        self.name = name
        self.email = email
        self.age = age
        self._password = "secret"  # Private attribute

user = User("Alice", "alice@example.com", 30)

# Using __dict__ directly
print(json.dumps(user.__dict__, indent=2))
# Output includes _password

# Filtering private attributes
def serialize_user(obj):
    if isinstance(obj, User):
        return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

print(json.dumps(user, default=serialize_user, indent=2))
# Output:
# {
#   "name": "Alice",
#   "email": "alice@example.com",
#   "age": 30
# }
```

### Implementing to_json and from_json Methods

```python
import json
from datetime import datetime

class Product:
    def __init__(self, id, name, price, created_at=None):
        self.id = id
        self.name = name
        self.price = price
        self.created_at = created_at or datetime.now()

    def to_json(self):
        """Convert to JSON-serializable dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_json(cls, data):
        """Create instance from JSON dictionary."""
        if isinstance(data, str):
            data = json.loads(data)
        return cls(
            id=data["id"],
            name=data["name"],
            price=data["price"],
            created_at=datetime.fromisoformat(data["created_at"])
        )

    def __repr__(self):
        return f"Product({self.id}, {self.name}, {self.price})"

# Serialize
product = Product(1, "Widget", 29.99)
json_string = json.dumps(product.to_json(), indent=2)
print(json_string)

# Deserialize
restored = Product.from_json(json_string)
print(restored)
# Output: Product(1, Widget, 29.99)
```

### Using Protocol Classes

```python
import json
from typing import Protocol, TypeVar, Type
from datetime import datetime

class JSONSerializable(Protocol):
    """Protocol for JSON-serializable objects."""

    def to_dict(self) -> dict: ...

    @classmethod
    def from_dict(cls, data: dict) -> "JSONSerializable": ...

T = TypeVar("T", bound=JSONSerializable)

class Order:
    def __init__(self, order_id: str, items: list, total: float, created_at: datetime):
        self.order_id = order_id
        self.items = items
        self.total = total
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "order_id": self.order_id,
            "items": self.items,
            "total": self.total,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Order":
        return cls(
            order_id=data["order_id"],
            items=data["items"],
            total=data["total"],
            created_at=datetime.fromisoformat(data["created_at"])
        )

def save_to_json(obj: JSONSerializable, filepath: str) -> None:
    """Save any JSONSerializable object to a file."""
    with open(filepath, "w") as f:
        json.dump(obj.to_dict(), f, indent=2)

def load_from_json(cls: Type[T], filepath: str) -> T:
    """Load a JSONSerializable object from a file."""
    with open(filepath, "r") as f:
        data = json.load(f)
    return cls.from_dict(data)

# Usage
order = Order("ORD-001", ["Widget", "Gadget"], 59.98, datetime.now())
save_to_json(order, "order.json")
restored = load_from_json(Order, "order.json")
```

## Error Handling

### JSONDecodeError

```python
import json

# Invalid JSON examples
invalid_jsons = [
    '{"name": "Alice", age: 30}',      # Missing quotes around key
    "{'name': 'Alice'}",                # Single quotes
    '{"name": "Alice",}',               # Trailing comma
    '{"name": undefined}',              # undefined is not valid JSON
    '',                                  # Empty string
    'null',                             # Valid but might not be expected
]

for invalid in invalid_jsons:
    try:
        result = json.loads(invalid)
        print(f"Parsed: {result}")
    except json.JSONDecodeError as e:
        print(f"Error parsing '{invalid[:30]}...': {e.msg} at position {e.pos}")
```

### Comprehensive Error Handling

```python
import json
from pathlib import Path

def safe_load_json(source, default=None):
    """
    Safely load JSON from a string or file path.

    Args:
        source: JSON string or file path
        default: Value to return if loading fails

    Returns:
        Parsed JSON data or default value
    """
    try:
        # Check if source is a file path
        path = Path(source)
        if path.exists() and path.is_file():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)

        # Try parsing as JSON string
        return json.loads(source)

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e.msg} at line {e.lineno}, column {e.colno}")
        return default
    except FileNotFoundError:
        print(f"File not found: {source}")
        return default
    except PermissionError:
        print(f"Permission denied: {source}")
        return default
    except Exception as e:
        print(f"Unexpected error: {e}")
        return default

# Usage
data = safe_load_json('{"valid": true}')
print(data)  # {'valid': True}

data = safe_load_json('invalid json', default={})
print(data)  # {}

data = safe_load_json('/nonexistent/file.json', default={"error": True})
print(data)  # {'error': True}
```

## Working with JSON APIs

### Making API Requests

```python
import json
import urllib.request
from urllib.error import URLError, HTTPError

def fetch_json(url, headers=None):
    """Fetch JSON data from a URL."""
    request = urllib.request.Request(url)

    if headers:
        for key, value in headers.items():
            request.add_header(key, value)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            data = response.read().decode("utf-8")
            return json.loads(data)
    except HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        return None
    except URLError as e:
        print(f"URL Error: {e.reason}")
        return None
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        return None

# Example usage
data = fetch_json("https://api.example.com/users")
if data:
    for user in data:
        print(f"{user['name']}: {user['email']}")
```

### Sending JSON Data

```python
import json
import urllib.request

def post_json(url, data, headers=None):
    """Send JSON data via POST request."""
    json_data = json.dumps(data).encode("utf-8")

    request = urllib.request.Request(url, data=json_data, method="POST")
    request.add_header("Content-Type", "application/json")

    if headers:
        for key, value in headers.items():
            request.add_header(key, value)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response_data = response.read().decode("utf-8")
            return json.loads(response_data)
    except Exception as e:
        print(f"Error: {e}")
        return None

# Example usage
new_user = {
    "name": "Alice",
    "email": "alice@example.com",
    "role": "admin"
}

result = post_json(
    "https://api.example.com/users",
    new_user,
    headers={"Authorization": "Bearer token123"}
)
```

## Performance Tips

### Benchmarking Different Approaches

```python
import json
import timeit

# Sample data
data = {
    "users": [{"id": i, "name": f"User {i}", "active": True} for i in range(1000)],
    "metadata": {"count": 1000, "page": 1}
}

# Benchmark dumps
json_string = json.dumps(data)

def test_dumps():
    return json.dumps(data)

def test_dumps_sorted():
    return json.dumps(data, sort_keys=True)

def test_dumps_indent():
    return json.dumps(data, indent=2)

print("Serialization benchmarks (1000 iterations):")
print(f"  dumps():            {timeit.timeit(test_dumps, number=1000):.4f}s")
print(f"  dumps(sort_keys):   {timeit.timeit(test_dumps_sorted, number=1000):.4f}s")
print(f"  dumps(indent=2):    {timeit.timeit(test_dumps_indent, number=1000):.4f}s")
```

### Using orjson for Better Performance

For performance-critical applications, consider using `orjson`, a fast JSON library.

```python
# Install: pip install orjson
import orjson
import json
import timeit

data = {"users": [{"id": i, "name": f"User {i}"} for i in range(1000)]}

def test_json_dumps():
    return json.dumps(data)

def test_orjson_dumps():
    return orjson.dumps(data)

json_string = json.dumps(data)
orjson_bytes = orjson.dumps(data)

def test_json_loads():
    return json.loads(json_string)

def test_orjson_loads():
    return orjson.loads(orjson_bytes)

print("Performance comparison (10000 iterations):")
print(f"  json.dumps():   {timeit.timeit(test_json_dumps, number=10000):.4f}s")
print(f"  orjson.dumps(): {timeit.timeit(test_orjson_dumps, number=10000):.4f}s")
print(f"  json.loads():   {timeit.timeit(test_json_loads, number=10000):.4f}s")
print(f"  orjson.loads(): {timeit.timeit(test_orjson_loads, number=10000):.4f}s")
```

Note: `orjson` returns bytes instead of string, and has different default behaviors. Check its documentation for details.

### Memory-Efficient Streaming

For large JSON files, consider streaming approaches.

```python
import json

def stream_json_array(filepath):
    """
    Stream a JSON array file, yielding one item at a time.
    Useful for large files that don't fit in memory.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        # Skip opening bracket
        char = f.read(1)
        while char.isspace():
            char = f.read(1)

        if char != "[":
            raise ValueError("Expected JSON array")

        decoder = json.JSONDecoder()
        buffer = ""

        while True:
            char = f.read(1)
            if not char:
                break

            if char in " \n\r\t,":
                continue

            if char == "]":
                break

            # Read until we have a complete JSON object
            buffer = char
            brace_count = 1 if char == "{" else 0
            bracket_count = 1 if char == "[" else 0
            in_string = char == '"'

            while brace_count > 0 or bracket_count > 0 or in_string:
                char = f.read(1)
                if not char:
                    break
                buffer += char

                if char == '"' and buffer[-2] != "\\":
                    in_string = not in_string
                elif not in_string:
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                    elif char == "[":
                        bracket_count += 1
                    elif char == "]":
                        bracket_count -= 1

            if buffer:
                yield json.loads(buffer)

# Usage (for a file with array of objects)
# for item in stream_json_array("large_file.json"):
#     process(item)
```

### Using ijson for Large Files

For truly large files, use the `ijson` library for iterative parsing.

```python
# Install: pip install ijson
import ijson

def process_large_json(filepath):
    """Process a large JSON file iteratively."""
    with open(filepath, "rb") as f:
        # Parse items in a 'users' array one at a time
        for user in ijson.items(f, "users.item"):
            yield user

# Usage
# for user in process_large_json("large_users.json"):
#     print(user["name"])
```

## Common Patterns and Best Practices

### Configuration File Management

```python
import json
from pathlib import Path
from typing import Any, Dict

class ConfigManager:
    """Manage JSON configuration files."""

    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self._defaults: Dict[str, Any] = {}

    def set_defaults(self, defaults: Dict[str, Any]) -> None:
        """Set default configuration values."""
        self._defaults = defaults.copy()

    def load(self) -> Dict[str, Any]:
        """Load configuration from file."""
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                self._config = json.load(f)
        else:
            self._config = {}

        # Merge with defaults
        return {**self._defaults, **self._config}

    def save(self, config: Dict[str, Any]) -> None:
        """Save configuration to file."""
        self._config = config
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        config = self.load()
        return config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        config = self.load()
        config[key] = value
        self.save(config)

# Usage
config = ConfigManager("~/.myapp/config.json")
config.set_defaults({
    "theme": "light",
    "language": "en",
    "max_items": 100
})

settings = config.load()
print(f"Theme: {settings['theme']}")

config.set("theme", "dark")
```

### JSON Schema Validation

```python
import json
from typing import Any, Dict, List, Tuple

def validate_schema(data: Any, schema: Dict) -> Tuple[bool, List[str]]:
    """
    Simple JSON schema validator.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    def validate(value, schema, path="root"):
        schema_type = schema.get("type")

        # Type validation
        type_map = {
            "string": str,
            "number": (int, float),
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict,
            "null": type(None)
        }

        if schema_type and schema_type in type_map:
            expected = type_map[schema_type]
            if not isinstance(value, expected):
                errors.append(f"{path}: expected {schema_type}, got {type(value).__name__}")
                return

        # Object properties
        if schema_type == "object" and isinstance(value, dict):
            properties = schema.get("properties", {})
            required = schema.get("required", [])

            for prop in required:
                if prop not in value:
                    errors.append(f"{path}: missing required property '{prop}'")

            for prop, prop_schema in properties.items():
                if prop in value:
                    validate(value[prop], prop_schema, f"{path}.{prop}")

        # Array items
        if schema_type == "array" and isinstance(value, list):
            items_schema = schema.get("items", {})
            for i, item in enumerate(value):
                validate(item, items_schema, f"{path}[{i}]")

        # String constraints
        if schema_type == "string" and isinstance(value, str):
            if "minLength" in schema and len(value) < schema["minLength"]:
                errors.append(f"{path}: string too short (min {schema['minLength']})")
            if "maxLength" in schema and len(value) > schema["maxLength"]:
                errors.append(f"{path}: string too long (max {schema['maxLength']})")

        # Number constraints
        if schema_type in ("number", "integer") and isinstance(value, (int, float)):
            if "minimum" in schema and value < schema["minimum"]:
                errors.append(f"{path}: value too small (min {schema['minimum']})")
            if "maximum" in schema and value > schema["maximum"]:
                errors.append(f"{path}: value too large (max {schema['maximum']})")

    validate(data, schema)
    return len(errors) == 0, errors

# Define a schema
user_schema = {
    "type": "object",
    "required": ["name", "email"],
    "properties": {
        "name": {"type": "string", "minLength": 1, "maxLength": 100},
        "email": {"type": "string"},
        "age": {"type": "integer", "minimum": 0, "maximum": 150},
        "roles": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}

# Validate data
valid_user = {"name": "Alice", "email": "alice@example.com", "age": 30}
is_valid, errors = validate_schema(valid_user, user_schema)
print(f"Valid: {is_valid}")  # Valid: True

invalid_user = {"name": "", "age": -5}
is_valid, errors = validate_schema(invalid_user, user_schema)
print(f"Valid: {is_valid}")  # Valid: False
print(f"Errors: {errors}")
# Errors: ["root: missing required property 'email'", 'root.name: string too short (min 1)', 'root.age: value too small (min 0)']
```

### JSON Lines Format

JSON Lines (newline-delimited JSON) is useful for streaming and log files.

```python
import json
from typing import Iterator, Any

def write_jsonl(filepath: str, records: Iterator[Any]) -> int:
    """Write records to a JSON Lines file."""
    count = 0
    with open(filepath, "w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")
            count += 1
    return count

def read_jsonl(filepath: str) -> Iterator[Any]:
    """Read records from a JSON Lines file."""
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)

def append_jsonl(filepath: str, record: Any) -> None:
    """Append a single record to a JSON Lines file."""
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

# Usage
records = [
    {"event": "login", "user": "alice", "timestamp": "2024-06-15T10:30:00"},
    {"event": "purchase", "user": "alice", "amount": 99.99},
    {"event": "logout", "user": "alice", "timestamp": "2024-06-15T11:00:00"}
]

# Write all records
write_jsonl("events.jsonl", iter(records))

# Read all records
for record in read_jsonl("events.jsonl"):
    print(record)

# Append new record
append_jsonl("events.jsonl", {"event": "login", "user": "bob"})
```

## Summary

Python's `json` module provides comprehensive tools for working with JSON data:

| Function | Purpose |
|----------|---------|
| `json.dumps()` | Serialize to JSON string |
| `json.dump()` | Serialize to file |
| `json.loads()` | Deserialize from string |
| `json.load()` | Deserialize from file |

Key concepts to remember:

- **Type Mapping**: Python dicts become JSON objects, lists/tuples become arrays
- **Pretty Printing**: Use `indent` parameter for readable output
- **Custom Types**: Use `default` parameter or custom `JSONEncoder` for non-standard types
- **Dates**: Convert to ISO 8601 strings or Unix timestamps
- **Error Handling**: Always catch `JSONDecodeError` when parsing untrusted input
- **Performance**: Consider `orjson` or `ujson` for high-performance needs
- **Large Files**: Use streaming with `ijson` for memory efficiency

## Further Reading

- [Python Documentation: json](https://docs.python.org/3/library/json.html)
- [JSON Specification](https://www.json.org/)
- [RFC 8259 - The JavaScript Object Notation (JSON) Data Interchange Format](https://datatracker.ietf.org/doc/html/rfc8259)
- [orjson - Fast JSON library](https://github.com/ijl/orjson)
- [ijson - Iterative JSON parser](https://github.com/ICRAR/ijson)
