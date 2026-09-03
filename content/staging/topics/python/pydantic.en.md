---
title: Python Pydantic Data Validation
description: Master Pydantic for data validation, serialization and settings management in Python applications
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Pydantic
  - validation
  - typing
status: imported
origin: old/src/content/docs/python/pydantic.en.md
divergence: 0.429
issues:
  - divergent
legacy:
  category: Python
  subcategory: Data Validation
  order: 36
  lastUpdated: 2026-01-07
---

Pydantic is the most widely used data validation library for Python. It leverages Python's type hints to provide runtime data validation, serialization, and settings management with excellent performance and IDE support. Pydantic v2, a complete rewrite with a Rust core, offers significant performance improvements and new features.

## Introduction to Pydantic

Pydantic validates data by defining models as Python classes with type-annotated attributes. When data is passed to a model, Pydantic validates and coerces the data according to the type annotations.

### Basic Model Definition

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None
    created_at: datetime = datetime.now()

# Valid data - types match
user = User(id=1, name="Alice", email="alice@example.com", age=30)
print(user)
# id=1 name='Alice' email='alice@example.com' age=30 created_at=datetime.datetime(...)

# Type coercion - string "42" is converted to int
user2 = User(id="42", name="Bob", email="bob@example.com")
print(user2.id, type(user2.id))  # 42 <class 'int'>

# Invalid data - raises ValidationError
try:
    invalid_user = User(id="not-a-number", name="Charlie", email="charlie@example.com")
except Exception as e:
    print(e)
    # validation error for User
    # id
    #   Input should be a valid integer, unable to parse string as an integer
```

### Why Choose Pydantic?

Pydantic offers several advantages over manual validation:

- **Type Safety**: Leverages Python type hints for automatic validation
- **Performance**: Rust-powered core in v2 provides exceptional speed
- **IDE Support**: Full autocomplete and type checking
- **Serialization**: Built-in JSON and dictionary conversion
- **Extensibility**: Custom validators and types
- **Integration**: Works seamlessly with FastAPI, SQLModel, and other frameworks

## Installation

Install Pydantic using pip:

```bash
# Install Pydantic v2
pip install pydantic

# Install with email validation support
pip install "pydantic[email]"

# Install pydantic-settings for configuration management
pip install pydantic-settings
```

## Defining Models

### Field Types and Annotations

Pydantic supports all standard Python types and provides additional validation types:

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Set, Tuple, Optional, Union, Literal
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from uuid import UUID
from pathlib import Path

class CompleteExample(BaseModel):
    # Basic types
    name: str
    age: int
    height: float
    is_active: bool

    # Optional fields
    nickname: Optional[str] = None

    # Collections
    tags: List[str]
    metadata: Dict[str, int]
    unique_ids: Set[int]
    coordinates: Tuple[float, float]

    # Union types
    identifier: Union[int, str]

    # Literal for fixed values
    status: Literal["active", "inactive", "pending"]

    # Date and time
    created_at: datetime
    birth_date: date
    appointment_time: time
    duration: timedelta

    # Special types
    price: Decimal
    user_id: UUID
    config_path: Path
```

### Using Field for Validation Constraints

The `Field` function provides detailed control over field validation:

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    # String constraints
    name: str = Field(
        min_length=1,
        max_length=100,
        description="Product name"
    )

    # Numeric constraints
    price: float = Field(
        gt=0,          # greater than
        le=10000,      # less than or equal to
        description="Price in USD"
    )

    quantity: int = Field(
        ge=0,          # greater than or equal to
        lt=1000,       # less than
        default=0
    )

    # Pattern matching
    sku: str = Field(
        pattern=r"^[A-Z]{3}-\d{4}$",
        description="SKU format: XXX-0000"
    )

    # Default values
    category: str = Field(default="general")

    # Default factory for mutable defaults
    tags: list = Field(default_factory=list)

product = Product(
    name="Widget",
    price=29.99,
    sku="WDG-1234"
)
print(product)
```

### Nested Models

Models can contain other models as fields:

```python
from pydantic import BaseModel
from typing import List, Optional

class Address(BaseModel):
    street: str
    city: str
    country: str
    postal_code: str

class ContactInfo(BaseModel):
    email: str
    phone: Optional[str] = None

class Person(BaseModel):
    name: str
    age: int
    address: Address
    contact: ContactInfo
    emergency_contacts: List[ContactInfo] = []

# Creating nested structures
person = Person(
    name="John Doe",
    age=30,
    address={
        "street": "123 Main St",
        "city": "Boston",
        "country": "USA",
        "postal_code": "02101"
    },
    contact={
        "email": "john@example.com",
        "phone": "+1-555-0123"
    }
)

print(person.address.city)  # Boston
print(person.contact.email)  # john@example.com
```

## Validation

### Built-in Validators

Pydantic includes many built-in validation types for common use cases:

```python
from pydantic import (
    BaseModel,
    EmailStr,
    HttpUrl,
    IPvAnyAddress,
    PositiveInt,
    NegativeFloat,
    constr,
    conint,
    confloat,
    conlist
)

class NetworkConfig(BaseModel):
    # Email validation (requires pydantic[email])
    admin_email: EmailStr

    # URL validation
    api_endpoint: HttpUrl

    # IP address validation
    server_ip: IPvAnyAddress

    # Constrained integers
    port: conint(ge=1, le=65535)

    # Positive/Negative numbers
    retry_count: PositiveInt
    threshold: NegativeFloat

    # Constrained strings
    hostname: constr(min_length=1, max_length=255, pattern=r"^[a-zA-Z0-9.-]+$")

    # Constrained lists
    allowed_origins: conlist(str, min_length=1, max_length=10)

config = NetworkConfig(
    admin_email="admin@example.com",
    api_endpoint="https://api.example.com",
    server_ip="192.168.1.1",
    port=8080,
    retry_count=3,
    threshold=-0.5,
    hostname="api-server-01",
    allowed_origins=["http://localhost:3000"]
)
```

### Custom Validators with field_validator

Use `@field_validator` to create custom validation logic:

```python
from pydantic import BaseModel, field_validator, ValidationError

class User(BaseModel):
    username: str
    email: str
    password: str
    age: int

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v.lower()

    @field_validator("email")
    @classmethod
    def email_valid_domain(cls, v: str) -> str:
        allowed_domains = ["company.com", "partner.org"]
        domain = v.split("@")[-1]
        if domain not in allowed_domains:
            raise ValueError(f"Email must be from: {allowed_domains}")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a digit")
        return v

    @field_validator("age")
    @classmethod
    def age_valid_range(cls, v: int) -> int:
        if v < 18 or v > 120:
            raise ValueError("Age must be between 18 and 120")
        return v

# Valid user
user = User(
    username="JohnDoe123",
    email="john@company.com",
    password="SecurePass1",
    age=25
)
print(user.username)  # johndoe123 (lowercased by validator)

# Invalid user
try:
    invalid = User(
        username="john-doe",  # Contains hyphen
        email="john@gmail.com",  # Wrong domain
        password="weak",  # Too short
        age=10  # Too young
    )
except ValidationError as e:
    print(e)
```

### Validating Multiple Fields with model_validator

Use `@model_validator` to validate relationships between fields:

```python
from pydantic import BaseModel, model_validator
from typing import Self

class DateRange(BaseModel):
    start_date: str
    end_date: str

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be before end_date")
        return self

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @model_validator(mode="after")
    def check_passwords(self) -> Self:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if self.new_password == self.current_password:
            raise ValueError("New password must be different")
        return self

# Before validation (raw input data)
class UserInput(BaseModel):
    name: str
    email: str

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # Normalize email to lowercase
            if "email" in data:
                data["email"] = data["email"].lower().strip()
            # Strip whitespace from name
            if "name" in data:
                data["name"] = data["name"].strip()
        return data

user = UserInput(name="  John Doe  ", email="  JOHN@EXAMPLE.COM  ")
print(user.name)   # "John Doe"
print(user.email)  # "john@example.com"
```

### Validation Modes

Pydantic supports different validation modes for various data sources:

```python
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    price: float
    quantity: int

# Validate from dictionary
item1 = Item.model_validate({"name": "Widget", "price": 29.99, "quantity": 10})

# Validate from JSON string
json_data = '{"name": "Gadget", "price": 49.99, "quantity": 5}'
item2 = Item.model_validate_json(json_data)

# Validate from another instance
item3 = Item.model_validate(item1)

# Strict validation (no type coercion)
from pydantic import ConfigDict

class StrictItem(BaseModel):
    model_config = ConfigDict(strict=True)

    name: str
    price: float
    quantity: int

# This works with loose validation
item = Item(name="Widget", price="29.99", quantity="10")  # Strings coerced

# This raises an error with strict validation
try:
    strict_item = StrictItem(name="Widget", price="29.99", quantity="10")
except Exception as e:
    print("Strict validation failed:", e)
```

## Serialization

### Converting to Dictionary and JSON

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Article(BaseModel):
    title: str
    content: str
    author: str
    published_at: datetime
    views: int = 0
    tags: list[str] = []
    metadata: Optional[dict] = None

article = Article(
    title="Pydantic Guide",
    content="A comprehensive guide...",
    author="Alice",
    published_at=datetime(2024, 1, 15, 10, 30),
    tags=["python", "validation"],
    metadata={"category": "tutorial"}
)

# Convert to dictionary
article_dict = article.model_dump()
print(article_dict)
# {'title': 'Pydantic Guide', 'content': 'A comprehensive guide...', ...}

# Convert to JSON string
article_json = article.model_dump_json()
print(article_json)
# '{"title":"Pydantic Guide","content":"A comprehensive guide...",...}'

# Exclude fields
minimal = article.model_dump(exclude={"content", "metadata"})
print(minimal)
# {'title': 'Pydantic Guide', 'author': 'Alice', ...}

# Include only specific fields
summary = article.model_dump(include={"title", "author", "published_at"})
print(summary)
# {'title': 'Pydantic Guide', 'author': 'Alice', 'published_at': ...}

# Exclude None values
article_no_meta = Article(
    title="Test",
    content="Content",
    author="Bob",
    published_at=datetime.now()
)
clean = article_no_meta.model_dump(exclude_none=True)
# metadata field excluded because it's None

# Exclude unset fields (fields that weren't explicitly provided)
compact = article_no_meta.model_dump(exclude_unset=True)
```

### Custom Serialization

```python
from pydantic import BaseModel, field_serializer, model_serializer
from datetime import datetime
from decimal import Decimal

class Order(BaseModel):
    order_id: str
    amount: Decimal
    created_at: datetime
    items: list[str]

    @field_serializer("amount")
    def serialize_amount(self, amount: Decimal) -> str:
        return f"${amount:.2f}"

    @field_serializer("created_at")
    def serialize_datetime(self, dt: datetime) -> str:
        return dt.strftime("%Y-%m-%d %H:%M:%S")

order = Order(
    order_id="ORD-001",
    amount=Decimal("99.99"),
    created_at=datetime(2024, 1, 15, 14, 30, 0),
    items=["widget", "gadget"]
)

print(order.model_dump())
# {'order_id': 'ORD-001', 'amount': '$99.99', 'created_at': '2024-01-15 14:30:00', 'items': ['widget', 'gadget']}

# Custom model serializer for complete control
class CustomOrder(BaseModel):
    order_id: str
    amount: Decimal
    items: list[str]

    @model_serializer
    def serialize_model(self) -> dict:
        return {
            "id": self.order_id,
            "total": float(self.amount),
            "item_count": len(self.items),
            "items": self.items
        }
```

### Serialization Aliases

```python
from pydantic import BaseModel, Field

class APIResponse(BaseModel):
    user_id: int = Field(serialization_alias="userId")
    first_name: str = Field(serialization_alias="firstName")
    last_name: str = Field(serialization_alias="lastName")
    email_address: str = Field(serialization_alias="emailAddress")

response = APIResponse(
    user_id=1,
    first_name="John",
    last_name="Doe",
    email_address="john@example.com"
)

# Default output uses field names
print(response.model_dump())
# {'user_id': 1, 'first_name': 'John', 'last_name': 'Doe', 'email_address': 'john@example.com'}

# With aliases (camelCase for API)
print(response.model_dump(by_alias=True))
# {'userId': 1, 'firstName': 'John', 'lastName': 'Doe', 'emailAddress': 'john@example.com'}
```

## Model Configuration

### ConfigDict Options

Customize model behavior using `ConfigDict`:

```python
from pydantic import BaseModel, ConfigDict

class StrictModel(BaseModel):
    model_config = ConfigDict(
        strict=True,           # No type coercion
        frozen=True,           # Immutable instances
        validate_default=True, # Validate default values
        extra="forbid",        # Reject extra fields
        str_strip_whitespace=True,  # Strip whitespace from strings
        str_min_length=1,      # Minimum string length
    )

    name: str
    value: int

# Extra fields are forbidden
try:
    obj = StrictModel(name="test", value=42, extra_field="not allowed")
except Exception as e:
    print("Extra field error:", e)

# Instances are frozen (immutable)
obj = StrictModel(name="test", value=42)
try:
    obj.name = "modified"
except Exception as e:
    print("Frozen error:", e)
```

### Common Configuration Options

```python
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class FlexibleModel(BaseModel):
    model_config = ConfigDict(
        # Validation behavior
        strict=False,              # Allow type coercion (default)
        validate_default=False,    # Don't validate defaults
        validate_assignment=True,  # Validate on attribute assignment
        revalidate_instances="always",  # Revalidate model instances

        # Extra fields
        extra="ignore",            # "forbid", "allow", or "ignore"

        # Immutability
        frozen=False,              # Mutable instances (default)

        # String handling
        str_strip_whitespace=True,
        str_to_lower=False,
        str_to_upper=False,
        str_min_length=None,
        str_max_length=None,

        # JSON Schema
        title="Flexible Model",
        json_schema_extra={"examples": [{"name": "example", "value": 42}]},

        # Serialization
        ser_json_bytes="base64",   # How to serialize bytes
        ser_json_inf_nan="constants",  # How to serialize inf/nan
        use_enum_values=True,      # Use enum values instead of enum instances

        # Population
        populate_by_name=True,     # Allow population by field name or alias
        from_attributes=True,      # Allow creation from objects with attributes
    )

    name: str
    value: int

# validate_assignment in action
model = FlexibleModel(name="test", value=42)
model.value = 100  # Validated
try:
    model.value = "not a number"  # Raises ValidationError
except Exception as e:
    print("Assignment validation error:", e)
```

### Alias Configuration

```python
from pydantic import BaseModel, Field, ConfigDict

class APIModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,  # Accept both field name and alias
    )

    user_id: int = Field(alias="userId")
    first_name: str = Field(alias="firstName")
    email_address: str = Field(alias="email")

# Can use either the field name or alias
model1 = APIModel(userId=1, firstName="John", email="john@example.com")
model2 = APIModel(user_id=1, first_name="John", email_address="john@example.com")

print(model1 == model2)  # True
```

## Settings Management with pydantic-settings

Pydantic-settings provides a powerful way to manage application configuration from environment variables, files, and other sources.

### Basic Settings

```python
# pip install pydantic-settings
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "My Application"
    debug: bool = False
    database_url: str
    api_key: str = Field(min_length=32)
    max_connections: int = 10

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

# .env file:
# DATABASE_URL=postgresql://user:pass@localhost/db
# API_KEY=your-32-character-api-key-here12345
# DEBUG=true

settings = Settings()
print(settings.app_name)      # "My Application"
print(settings.debug)         # True (from env)
print(settings.database_url)  # postgresql://user:pass@localhost/db
```

### Environment Variable Prefixes

```python
from pydantic_settings import BaseSettings

class AppSettings(BaseSettings):
    name: str
    version: str
    debug: bool = False

    model_config = {
        "env_prefix": "MYAPP_",  # Variables must start with MYAPP_
    }

# Environment variables:
# MYAPP_NAME=MyApp
# MYAPP_VERSION=1.0.0
# MYAPP_DEBUG=true

settings = AppSettings()
print(settings.name)  # "MyApp"
```

### Nested Settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel

class DatabaseSettings(BaseModel):
    host: str = "localhost"
    port: int = 5432
    name: str = "app"
    user: str = "postgres"
    password: str = ""

class RedisSettings(BaseModel):
    host: str = "localhost"
    port: int = 6379
    db: int = 0

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__",  # Use __ for nested access
    )

    app_name: str = "MyApp"
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()

# Environment variables for nested settings:
# DATABASE__HOST=db.example.com
# DATABASE__PORT=5433
# DATABASE__PASSWORD=secret
# REDIS__HOST=redis.example.com

settings = Settings()
print(settings.database.host)  # db.example.com
print(settings.redis.host)     # redis.example.com
```

### Multiple Configuration Sources

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Tuple, Type

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),  # Multiple env files
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    secret_key: str
    debug: bool = False

# Priority (highest to lowest):
# Environment variables
# .env.local file
# .env file
# Default values
```

### Secret File Support

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        secrets_dir="/run/secrets",  # Docker secrets directory
    )

    database_password: SecretStr
    api_key: SecretStr

# /run/secrets/database_password contains the actual password
# /run/secrets/api_key contains the actual API key

settings = Settings()
print(settings.database_password)  # SecretStr('**********')
print(settings.database_password.get_secret_value())  # Actual password
```

## Generic Models

Create reusable model templates with generics:

```python
from pydantic import BaseModel
from typing import TypeVar, Generic, List, Optional

DataT = TypeVar("DataT")

class Response(BaseModel, Generic[DataT]):
    data: DataT
    message: str = "Success"
    status_code: int = 200

class PaginatedResponse(BaseModel, Generic[DataT]):
    items: List[DataT]
    total: int
    page: int
    page_size: int
    has_next: bool

    @property
    def has_previous(self) -> bool:
        return self.page > 1

# Usage with specific types
class User(BaseModel):
    id: int
    name: str

class Product(BaseModel):
    id: int
    name: str
    price: float

# Single user response
user_response = Response[User](
    data=User(id=1, name="Alice")
)
print(user_response.data.name)  # Alice

# Paginated products
products_response = PaginatedResponse[Product](
    items=[
        Product(id=1, name="Widget", price=29.99),
        Product(id=2, name="Gadget", price=49.99),
    ],
    total=100,
    page=1,
    page_size=10,
    has_next=True
)
print(products_response.items[0].name)  # Widget
```

## Computed Fields

Define fields that are computed from other fields:

```python
from pydantic import BaseModel, computed_field
from datetime import datetime, date

class Person(BaseModel):
    first_name: str
    last_name: str
    birth_date: date

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        age = today.year - self.birth_date.year
        if (today.month, today.day) < (self.birth_date.month, self.birth_date.day):
            age -= 1
        return age

person = Person(
    first_name="John",
    last_name="Doe",
    birth_date=date(1990, 5, 15)
)

print(person.full_name)  # John Doe
print(person.age)        # Calculated age

# Computed fields are included in serialization
print(person.model_dump())
# {'first_name': 'John', 'last_name': 'Doe', 'birth_date': date(1990, 5, 15),
#  'full_name': 'John Doe', 'age': 35}
```

## Discriminated Unions

Handle polymorphic data with discriminated unions:

```python
from pydantic import BaseModel, Field
from typing import Union, Literal
from typing_extensions import Annotated

class Cat(BaseModel):
    pet_type: Literal["cat"]
    name: str
    meow_volume: int

class Dog(BaseModel):
    pet_type: Literal["dog"]
    name: str
    bark_volume: int

class Fish(BaseModel):
    pet_type: Literal["fish"]
    name: str
    tank_size: float

Pet = Annotated[Union[Cat, Dog, Fish], Field(discriminator="pet_type")]

class Owner(BaseModel):
    name: str
    pets: list[Pet]

# Pydantic automatically selects the correct type based on pet_type
owner = Owner(
    name="Alice",
    pets=[
        {"pet_type": "cat", "name": "Whiskers", "meow_volume": 5},
        {"pet_type": "dog", "name": "Buddy", "bark_volume": 8},
        {"pet_type": "fish", "name": "Nemo", "tank_size": 20.0},
    ]
)

for pet in owner.pets:
    print(f"{pet.name} is a {pet.pet_type}")
    if isinstance(pet, Cat):
        print(f"  Meow volume: {pet.meow_volume}")
    elif isinstance(pet, Dog):
        print(f"  Bark volume: {pet.bark_volume}")
    elif isinstance(pet, Fish):
        print(f"  Tank size: {pet.tank_size}L")
```

## JSON Schema Generation

Pydantic can generate JSON Schema for models:

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import json

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(BaseModel):
    """A task in the task management system."""

    id: int = Field(description="Unique task identifier")
    title: str = Field(
        min_length=1,
        max_length=200,
        description="Task title"
    )
    description: Optional[str] = Field(
        default=None,
        description="Detailed task description"
    )
    priority: Priority = Field(
        default=Priority.MEDIUM,
        description="Task priority level"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Tags for categorization"
    )
    completed: bool = Field(
        default=False,
        description="Whether the task is completed"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "title": "Complete documentation",
                    "description": "Write comprehensive API docs",
                    "priority": "high",
                    "tags": ["docs", "api"],
                    "completed": False
                }
            ]
        }
    }

# Generate JSON Schema
schema = Task.model_json_schema()
print(json.dumps(schema, indent=2))
```

## Integration with FastAPI

Pydantic is the backbone of FastAPI's request validation and response serialization:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

app = FastAPI()

# Request models
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

# Response models
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int

# Endpoints
@app.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # Pydantic automatically validates the request body
    # user is already a validated UserCreate instance
    db_user = create_user_in_db(user)
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/", response_model=UserListResponse)
async def list_users(skip: int = 0, limit: int = 10):
    users = get_users_from_db(skip=skip, limit=limit)
    total = get_user_count()
    return UserListResponse(users=users, total=total)
```

## Error Handling

### Understanding Validation Errors

```python
from pydantic import BaseModel, ValidationError, Field
from typing import List

class Item(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)
    quantity: int = Field(ge=0)
    tags: List[str] = Field(min_length=1)

# Multiple validation errors
try:
    item = Item(
        name="",           # Too short
        price=-10,         # Not greater than 0
        quantity=-5,       # Not greater than or equal to 0
        tags=[]            # Empty list
    )
except ValidationError as e:
    print(f"Error count: {e.error_count()}")

    for error in e.errors():
        print(f"Location: {error['loc']}")
        print(f"Message: {error['msg']}")
        print(f"Type: {error['type']}")
        print("---")

    # JSON format for API responses
    print(e.json(indent=2))
```

### Custom Error Messages

```python
from pydantic import BaseModel, field_validator, ValidationError

class User(BaseModel):
    username: str
    age: int

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if not v.isalnum():
            raise ValueError("Username must contain only letters and numbers")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Age cannot be negative")
        if v > 150:
            raise ValueError("Age cannot exceed 150 years")
        return v

try:
    user = User(username="ab", age=-5)
except ValidationError as e:
    for error in e.errors():
        print(f"{error['loc'][0]}: {error['msg']}")
```

## Performance Tips

### Use Strict Mode for Performance

```python
from pydantic import BaseModel, ConfigDict

class FastModel(BaseModel):
    model_config = ConfigDict(
        strict=True,  # Skip type coercion
    )

    id: int
    name: str
    values: list[float]

# Strict mode is faster because it skips coercion
# but requires exact types
```

### Reuse Validators with TypeAdapter

```python
from pydantic import TypeAdapter
from typing import List

# Create a reusable type adapter
int_list_adapter = TypeAdapter(List[int])

# Validate multiple times without recreating the model
data1 = int_list_adapter.validate_python(["1", "2", "3"])
data2 = int_list_adapter.validate_python([1, 2, 3])
data3 = int_list_adapter.validate_json(b"[1, 2, 3]")

print(data1)  # [1, 2, 3]
print(data2)  # [1, 2, 3]
print(data3)  # [1, 2, 3]

# Also works with complex types
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str

user_list_adapter = TypeAdapter(List[User])
users = user_list_adapter.validate_python([
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
])
```

### Avoid Unnecessary Validation

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str

# Use model_construct to skip validation when you trust the data
trusted_data = {"id": 1, "name": "Alice"}
user = User.model_construct(**trusted_data)

# WARNING: No validation is performed
# Only use when you are certain the data is valid
```

## Best Practices

1. **Use Type Hints Consistently**: Always provide type annotations for all fields.

2. **Prefer Field() for Constraints**: Use Field() instead of validators for simple constraints.

3. **Validate Early**: Validate data at the entry points of your application.

4. **Use Strict Mode When Appropriate**: Enable strict mode for better performance when type coercion is not needed.

5. **Separate Request and Response Models**: Create distinct models for input validation and output serialization.

6. **Leverage Settings for Configuration**: Use pydantic-settings for environment-based configuration.

7. **Document with Descriptions**: Add descriptions to fields for auto-generated documentation.

8. **Handle Errors Gracefully**: Catch ValidationError and provide meaningful error messages.

```python
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional

class BestPracticeModel(BaseModel):
    """A model demonstrating Pydantic best practices."""

    model_config = ConfigDict(
        strict=True,
        frozen=True,
        str_strip_whitespace=True,
    )

    id: int = Field(description="Unique identifier")
    name: str = Field(
        min_length=1,
        max_length=100,
        description="Display name"
    )
    email: Optional[str] = Field(
        default=None,
        description="Contact email"
    )

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and "@" not in v:
            raise ValueError("Invalid email format")
        return v
```

## Summary

Pydantic provides a powerful and intuitive way to handle data validation in Python applications. Key features include:

- **Type-Based Validation**: Leverages Python type hints for automatic validation
- **Rich Field Configuration**: Extensive options through Field() and ConfigDict
- **Custom Validators**: field_validator and model_validator for complex logic
- **Serialization**: Built-in conversion to dict, JSON, and custom formats
- **Settings Management**: pydantic-settings for configuration from environment
- **Performance**: Rust-powered core in v2 for exceptional speed
- **Framework Integration**: Seamless work with FastAPI and other frameworks

Whether you are building APIs, processing configuration, or handling user input, Pydantic offers a robust solution that combines type safety with runtime validation.

## References

- [Pydantic Official Documentation](https://docs.pydantic.dev/latest/)
- [Pydantic GitHub Repository](https://github.com/pydantic/pydantic)
- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/api/pydantic_settings/)
- [FastAPI with Pydantic](https://fastapi.tiangolo.com/)
- [Pydantic Migration Guide (V1 to V2)](https://docs.pydantic.dev/latest/migration/)
