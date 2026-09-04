---
title: FastAPI
description: FastAPI完全指南，现代高性能Python Web API框架
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - FastAPI
  - API
  - 异步
status: imported
origin: old/src/content/docs/python/fastapi.en.md
divergence: 0.208
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Web开发
  order: 25
  lastUpdated: 2026-01-07
---

FastAPI is a modern, fast (high-performance) Python web framework specifically designed for building APIs. Based on standard Python type hints, combined with Starlette (for the web parts) and Pydantic (for the data parts), it provides powerful features such as automatic API documentation generation, data validation, and async support.

## FastAPI Core Advantages

### Why Choose FastAPI

FastAPI stands out among Python web frameworks with the following core advantages:

| Feature | Description |
|---------|-------------|
| **Extremely High Performance** | Performance comparable to NodeJS and Go, one of the fastest Python frameworks |
| **Fast Coding** | Development speed increased by 200% to 300% (official estimate) |
| **Fewer Bugs** | Reduces human errors by approximately 40% |
| **Smart Hints** | Excellent editor support with code completion everywhere |
| **Easy to Learn** | Simple design, comprehensive documentation, gentle learning curve |
| **Concise Code** | Minimizes code duplication, each parameter declaration serves multiple purposes |
| **Production Ready** | Automatically generates interactive documentation, compliant with OpenAPI standards |
| **Standardized** | Fully compatible with OpenAPI and JSON Schema |

### Technical Architecture

```
FastAPI
├── Starlette (Web Framework Core)
│   ├── ASGI Support
│   ├── WebSocket
│   ├── Background Tasks
│   └── Test Client
├── Pydantic (Data Validation)
│   ├── Type Validation
│   ├── Data Serialization
│   └── Settings Management
└── Python Type Hints
    ├── Auto Documentation
    ├── Editor Support
    └── Request Validation
```

## Installation and Quick Start

### Environment Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Install FastAPI and ASGI server
pip install fastapi
pip install "uvicorn[standard]"

# Optional dependencies
pip install python-multipart    # Form data and file uploads
pip install python-jose[cryptography]  # JWT tokens
pip install passlib[bcrypt]     # Password hashing
pip install pydantic[email]     # Email validation
pip install httpx               # Async HTTP client
```

### Your First FastAPI Application

```python
# main.py
from fastapi import FastAPI

# Create application instance
app = FastAPI(
    title="My First FastAPI Application",
    description="A sample project for learning FastAPI",
    version="1.0.0"
)

# Root route
@app.get("/")
async def root():
    """Return welcome message"""
    return {"message": "Welcome to FastAPI!"}

# Route with path parameter
@app.get("/hello/{name}")
async def say_hello(name: str):
    """Greet a specific user"""
    return {"message": f"Hello, {name}!"}

# Route with query parameters
@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    """Get item list with pagination support"""
    return {"skip": skip, "limit": limit}
```

### Starting the Server

```bash
# Development mode (auto-reload)
uvicorn main:app --reload

# Specify host and port
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Production mode (multiple workers)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

After starting, visit:
- API root path: http://127.0.0.1:8000
- Swagger UI documentation: http://127.0.0.1:8000/docs
- ReDoc documentation: http://127.0.0.1:8000/redoc
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

## Path Operations Explained

### HTTP Method Decorators

FastAPI supports all standard HTTP methods:

```python
from fastapi import FastAPI

app = FastAPI()

# GET - Retrieve resources
@app.get("/users")
async def get_users():
    return {"users": ["Alice", "Bob", "Charlie"]}

# POST - Create resources
@app.post("/users")
async def create_user():
    return {"message": "User created", "status": "success"}

# PUT - Full resource update
@app.put("/users/{user_id}")
async def update_user(user_id: int):
    return {"message": f"User {user_id} fully updated"}

# PATCH - Partial resource update
@app.patch("/users/{user_id}")
async def partial_update_user(user_id: int):
    return {"message": f"User {user_id} partially updated"}

# DELETE - Delete resources
@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    return {"message": f"User {user_id} deleted"}

# HEAD - Get response headers
@app.head("/users")
async def head_users():
    pass

# OPTIONS - Get supported methods
@app.options("/users")
async def options_users():
    return {"methods": ["GET", "POST", "PUT", "DELETE"]}
```

### Path Parameters

```python
from enum import Enum
from fastapi import FastAPI, Path

app = FastAPI()

# Basic path parameter (automatic type conversion)
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id, "type": type(item_id).__name__}

# Multiple path parameters
@app.get("/users/{user_id}/posts/{post_id}")
async def read_user_post(user_id: int, post_id: int):
    return {"user_id": user_id, "post_id": post_id}

# Using Path for parameter validation
@app.get("/products/{product_id}")
async def read_product(
    product_id: int = Path(
        ...,  # ... means required
        title="Product ID",
        description="Unique identifier of the product to query",
        ge=1,       # Greater than or equal to 1
        le=10000    # Less than or equal to 10000
    )
):
    return {"product_id": product_id}

# Enum type to restrict path parameters
class ModelType(str, Enum):
    cnn = "cnn"
    rnn = "rnn"
    transformer = "transformer"

@app.get("/models/{model_type}")
async def get_model(model_type: ModelType):
    model_info = {
        ModelType.cnn: "Convolutional Neural Network, suitable for image processing",
        ModelType.rnn: "Recurrent Neural Network, suitable for sequential data",
        ModelType.transformer: "Transformer architecture, suitable for NLP"
    }
    return {
        "model_type": model_type,
        "value": model_type.value,
        "description": model_info[model_type]
    }

# Path containing file path
@app.get("/files/{file_path:path}")
async def read_file(file_path: str):
    return {"file_path": file_path}
# Example: GET /files/home/user/documents/report.pdf
```

### Query Parameters

```python
from typing import Optional, List
from fastapi import FastAPI, Query

app = FastAPI()

# Basic query parameters (with default values)
@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}
# Example: GET /items/?skip=5&limit=20

# Optional query parameters
@app.get("/search/")
async def search(
    q: Optional[str] = None,
    category: Optional[str] = None
):
    results = {"items": []}
    if q:
        results["query"] = q
    if category:
        results["category"] = category
    return results

# Required query parameter (no default value)
@app.get("/users/")
async def get_user(user_id: int):  # Must be provided
    return {"user_id": user_id}

# Using Query for advanced validation
@app.get("/products/")
async def search_products(
    q: str = Query(
        ...,  # Required parameter
        min_length=2,
        max_length=50,
        pattern="^[a-zA-Z0-9\u4e00-\u9fa5]+$",  # Regex validation
        title="Search Keyword",
        description="Keyword for searching products, supports English, Chinese, and numbers",
        examples=["laptop", "iPhone15"]
    ),
    min_price: float = Query(default=0, ge=0, description="Minimum price"),
    max_price: float = Query(default=99999, le=999999, description="Maximum price")
):
    return {"query": q, "price_range": [min_price, max_price]}

# Query parameter list
@app.get("/filter/")
async def filter_items(
    tags: List[str] = Query(default=[], description="Filter tags list")
):
    return {"tags": tags}
# Example: GET /filter/?tags=electronics&tags=digital&tags=phone

# Deprecated parameter marking
@app.get("/legacy/")
async def legacy_search(
    q: Optional[str] = Query(
        default=None,
        deprecated=True,
        description="This parameter is deprecated, please use the /search/ endpoint"
    )
):
    return {"query": q}
```

### Route Order and Priority

```python
from fastapi import FastAPI

app = FastAPI()

# Route order matters! Fixed paths should be placed before dynamic paths

# Fixed path - matched first
@app.get("/users/me")
async def read_current_user():
    return {"user": "Current user"}

@app.get("/users/admin")
async def read_admin():
    return {"user": "Administrator"}

# Dynamic path - matched later
@app.get("/users/{user_id}")
async def read_user(user_id: str):
    return {"user_id": user_id}
```

## Request and Response Models

### Pydantic Model Basics

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

app = FastAPI()

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    guest = "guest"

# Request model
class UserCreate(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Username, 3-50 characters"
    )
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password, at least 8 characters")
    full_name: Optional[str] = Field(None, max_length=100)
    role: UserRole = Field(default=UserRole.user)
    tags: List[str] = Field(default_factory=list, max_length=10)

    # Custom validator
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    # Model configuration and examples
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "johndoe",
                    "email": "johndoe@example.com",
                    "password": "SecurePass123",
                    "full_name": "John Doe",
                    "role": "user",
                    "tags": ["developer", "Python"]
                }
            ]
        }
    }

# Response model (excludes password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    tags: List[str]
    created_at: datetime
    is_active: bool = True

# Using the model
@app.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # User creation logic
    user_in_db = {
        "id": 1,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "tags": user.tags,
        "created_at": datetime.now(),
        "is_active": True
    }
    return user_in_db
```

### Nested Models

```python
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Set
from datetime import datetime

class Image(BaseModel):
    url: HttpUrl
    name: str
    alt_text: Optional[str] = None

class Category(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

class Product(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float = Field(..., gt=0, description="Price must be greater than 0")
    discount_price: Optional[float] = Field(None, gt=0)
    category: Category
    images: List[Image] = []
    tags: Set[str] = set()
    in_stock: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

class Order(BaseModel):
    id: int
    products: List[Product]
    total_amount: float
    customer_email: EmailStr
    shipping_address: str
    notes: Optional[str] = None

@app.post("/orders/")
async def create_order(order: Order):
    return order

# Request body example
"""
{
    "id": 1001,
    "products": [
        {
            "id": 1,
            "name": "MacBook Pro",
            "description": "16-inch M3 chip",
            "price": 19999.00,
            "category": {
                "id": 1,
                "name": "Computers",
                "parent_id": null
            },
            "images": [
                {
                    "url": "https://example.com/macbook.jpg",
                    "name": "MacBook Main Image",
                    "alt_text": "MacBook Pro Product Image"
                }
            ],
            "tags": ["electronics", "Apple", "laptop"],
            "in_stock": true
        }
    ],
    "total_amount": 19999.00,
    "customer_email": "customer@example.com",
    "shipping_address": "123 Main Street, Beijing, Chaoyang District",
    "notes": "Please deliver on weekdays"
}
"""
```

### Response Model Configuration

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None
    tags: List[str] = []

items_db = {
    1: Item(name="Item A", price=100.0, tags=["bestseller"]),
    2: Item(name="Item B", description="Quality product", price=200.0, tax=20.0)
}

# Exclude unset fields
@app.get("/items/{item_id}", response_model=Item, response_model_exclude_unset=True)
async def read_item_exclude_unset(item_id: int):
    """Only return fields that were explicitly set"""
    return items_db.get(item_id)

# Exclude default values
@app.get("/items/{item_id}/no-defaults", response_model=Item, response_model_exclude_defaults=True)
async def read_item_exclude_defaults(item_id: int):
    """Exclude fields with values equal to defaults"""
    return items_db.get(item_id)

# Exclude specific fields
@app.get("/items/{item_id}/public", response_model=Item, response_model_exclude={"tax"})
async def read_item_public(item_id: int):
    """Exclude sensitive fields (like tax information)"""
    return items_db.get(item_id)

# Include only specific fields
@app.get("/items/{item_id}/summary", response_model=Item, response_model_include={"name", "price"})
async def read_item_summary(item_id: int):
    """Return only summary information"""
    return items_db.get(item_id)
```

### Multiple Response Types

```python
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Union

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

class Message(BaseModel):
    message: str

@app.get(
    "/items/{item_id}",
    response_model=Union[Item, Message],
    responses={
        200: {
            "description": "Successfully returned item",
            "model": Item,
            "content": {
                "application/json": {
                    "example": {"name": "Sample Product", "price": 99.99}
                }
            }
        },
        404: {
            "description": "Item not found",
            "model": Message,
            "content": {
                "application/json": {
                    "example": {"message": "Item does not exist"}
                }
            }
        },
        500: {
            "description": "Internal server error"
        }
    }
)
async def read_item(item_id: int):
    if item_id == 0:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Item does not exist"}
        )
    return Item(name=f"Product {item_id}", price=float(item_id * 100))
```

### Special Data Types

```python
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, IPvAnyAddress
from typing import Optional

class SpecialTypesModel(BaseModel):
    # Date and time types
    event_id: UUID
    event_date: date
    event_time: time
    created_at: datetime
    duration: timedelta

    # Numeric types
    amount: Decimal
    percentage: float

    # Network types
    ip_address: IPvAnyAddress

    # bytes type
    file_hash: Optional[bytes] = None

@app.post("/events/")
async def create_event(event: SpecialTypesModel):
    return {
        "event_id": str(event.event_id),
        "event_date": event.event_date.isoformat(),
        "event_time": event.event_time.isoformat(),
        "created_at": event.created_at.isoformat(),
        "duration_seconds": event.duration.total_seconds(),
        "amount": str(event.amount),
        "ip_address": str(event.ip_address)
    }

# Request example
"""
{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_date": "2026-01-15",
    "event_time": "14:30:00",
    "created_at": "2026-01-07T10:30:00Z",
    "duration": 7200,
    "amount": "1999.99",
    "percentage": 0.15,
    "ip_address": "192.168.1.1"
}
"""
```

## Dependency Injection System

Dependency injection is one of FastAPI's most powerful features. It helps you:
- Share logic code
- Share database connections
- Implement authentication and authorization
- And much more...

### Function Dependencies

```python
from fastapi import FastAPI, Depends, Query
from typing import Optional

app = FastAPI()

# Simple dependency function
async def common_parameters(
    q: Optional[str] = Query(None, description="Search keyword"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return")
):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    return {"params": commons, "items": ["item1", "item2"]}

@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    return {"params": commons, "users": ["user1", "user2"]}
```

### Class Dependencies

```python
from fastapi import Depends, Query
from typing import Optional

class Pagination:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page")
    ):
        self.page = page
        self.page_size = page_size
        self.skip = (page - 1) * page_size

@app.get("/products/")
async def get_products(pagination: Pagination = Depends()):
    return {
        "page": pagination.page,
        "page_size": pagination.page_size,
        "skip": pagination.skip
    }

# Shorthand with type annotation
from typing import Annotated

PaginationDep = Annotated[Pagination, Depends()]

@app.get("/orders/")
async def get_orders(pagination: PaginationDep):
    return {"pagination": pagination.__dict__}
```

### Multi-level Dependencies

```python
from fastapi import Depends, Header, HTTPException, status

# First level dependency: get token
async def get_token_header(x_token: str = Header(...)):
    if not x_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    return x_token

# Second level dependency: verify token
async def verify_token(token: str = Depends(get_token_header)):
    if token != "secret-token":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid authentication token"
        )
    return token

# Third level dependency: get current user
async def get_current_user(token: str = Depends(verify_token)):
    # Query user based on token
    return {"username": "johndoe", "token": token}

@app.get("/users/me")
async def read_current_user(user: dict = Depends(get_current_user)):
    return user
```

### Dependencies with yield (Resource Management)

```python
from typing import Generator
from contextlib import contextmanager

# Database session example
class DatabaseSession:
    def __init__(self):
        self.connection = "Database connection established"
        print(f"[DB] {self.connection}")

    def query(self, sql: str):
        return f"Query result: {sql}"

    def close(self):
        print("[DB] Database connection closed")

async def get_db() -> Generator[DatabaseSession, None, None]:
    """Database dependency, using yield to ensure connection is properly closed"""
    db = DatabaseSession()
    try:
        yield db
    finally:
        db.close()

@app.get("/data/")
async def get_data(db: DatabaseSession = Depends(get_db)):
    result = db.query("SELECT * FROM items")
    return {"result": result}

# Multiple resource management
async def get_resources():
    db = DatabaseSession()
    cache = {"type": "redis", "connected": True}
    try:
        yield {"db": db, "cache": cache}
    finally:
        db.close()
        print("[Cache] Cache connection closed")
```

### Global Dependencies

```python
from fastapi import FastAPI, Depends, Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != "valid-api-key":
        raise HTTPException(status_code=403, detail="Invalid API Key")

async def log_request(x_request_id: str = Header(None)):
    if x_request_id:
        print(f"[LOG] Request ID: {x_request_id}")

# Apply global dependencies
app = FastAPI(dependencies=[Depends(verify_api_key), Depends(log_request)])

@app.get("/")
async def root():
    return {"message": "Passed global dependency verification"}

# Router-level dependencies
from fastapi import APIRouter

router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(verify_admin_user)]
)

@router.get("/dashboard")
async def admin_dashboard():
    return {"admin": "dashboard"}
```

### Dependency Caching

```python
from fastapi import Depends

# By default, dependencies in the same request are only executed once (cached)
call_count = 0

async def dependency_with_cache():
    global call_count
    call_count += 1
    return {"call_count": call_count}

async def dep_a(dep: dict = Depends(dependency_with_cache)):
    return dep

async def dep_b(dep: dict = Depends(dependency_with_cache)):
    return dep

@app.get("/cached/")
async def cached_deps(a: dict = Depends(dep_a), b: dict = Depends(dep_b)):
    # dependency_with_cache is only executed once
    return {"a": a, "b": b}

# Disable caching (execute every time)
@app.get("/not-cached/")
async def not_cached_deps(
    a: dict = Depends(dependency_with_cache, use_cache=False),
    b: dict = Depends(dependency_with_cache, use_cache=False)
):
    # dependency_with_cache is executed twice
    return {"a": a, "b": b}
```

## Authentication and Authorization

### OAuth2 Password Authentication

```python
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()

# Configuration
SECRET_KEY = "your-secret-key-keep-it-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Simulated user database
fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "email": "johndoe@example.com",
        "full_name": "John Doe",
        "disabled": False,
        "hashed_password": pwd_context.hash("secret123")
    }
}

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db: dict, username: str) -> Optional[UserInDB]:
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(db: dict, username: str, password: str) -> Optional[UserInDB]:
    user = get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Get current user
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="User is disabled")
    return current_user

# Login endpoint
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Protected endpoints
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(get_current_active_user)):
    return [{"item_id": 1, "owner": current_user.username}]
```

### API Key Authentication

```python
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader, APIKeyQuery

# API Key can be retrieved from Header or Query parameter
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)

API_KEYS = {
    "key-1234567890": {"name": "App A", "permissions": ["read", "write"]},
    "key-0987654321": {"name": "App B", "permissions": ["read"]},
}

async def get_api_key(
    api_key_header: str = Security(api_key_header),
    api_key_query: str = Security(api_key_query)
) -> str:
    api_key = api_key_header or api_key_query
    if api_key and api_key in API_KEYS:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API Key"
    )

async def require_permission(permission: str):
    async def check_permission(api_key: str = Depends(get_api_key)):
        key_info = API_KEYS.get(api_key, {})
        if permission not in key_info.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission}"
            )
        return key_info
    return check_permission

@app.get("/public-data/")
async def read_public_data(api_key: str = Depends(get_api_key)):
    return {"data": "Public data"}

@app.post("/protected-data/")
async def write_data(
    key_info: dict = Depends(require_permission("write"))
):
    return {"message": "Data written", "app": key_info["name"]}
```

### Role-Based Access Control

```python
from enum import Enum
from typing import List

class Role(str, Enum):
    admin = "admin"
    moderator = "moderator"
    user = "user"
    guest = "guest"

class UserWithRole(BaseModel):
    username: str
    roles: List[Role]

def require_roles(allowed_roles: List[Role]):
    async def role_checker(
        current_user: UserWithRole = Depends(get_current_user_with_roles)
    ):
        for role in current_user.roles:
            if role in allowed_roles:
                return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return role_checker

# Admin only access
@app.get("/admin/users/")
async def list_all_users(
    user: UserWithRole = Depends(require_roles([Role.admin]))
):
    return {"users": ["user1", "user2", "user3"]}

# Admin and moderator access
@app.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    user: UserWithRole = Depends(require_roles([Role.admin, Role.moderator]))
):
    return {"message": f"Post {post_id} deleted", "by": user.username}
```

## Async Programming Support

### Async and Sync Functions

```python
import asyncio
from fastapi import FastAPI

app = FastAPI()

# Async path operation function
@app.get("/async-items/{item_id}")
async def read_item_async(item_id: int):
    # Simulate async I/O operation
    await asyncio.sleep(0.1)
    return {"item_id": item_id, "type": "async"}

# Sync path operation function (runs in thread pool)
@app.get("/sync-items/{item_id}")
def read_item_sync(item_id: int):
    # Synchronous blocking operation
    import time
    time.sleep(0.1)
    return {"item_id": item_id, "type": "sync"}
```

### Async Database Operations

```python
import asyncio
from typing import List, Optional
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str

# Simulated async database
class AsyncDatabase:
    def __init__(self):
        self._users = {
            1: User(id=1, name="John", email="john@example.com"),
            2: User(id=2, name="Jane", email="jane@example.com"),
        }

    async def get_user(self, user_id: int) -> Optional[User]:
        await asyncio.sleep(0.1)  # Simulate I/O
        return self._users.get(user_id)

    async def get_users(self, skip: int = 0, limit: int = 10) -> List[User]:
        await asyncio.sleep(0.1)
        users = list(self._users.values())
        return users[skip:skip + limit]

    async def create_user(self, user: User) -> User:
        await asyncio.sleep(0.1)
        self._users[user.id] = user
        return user

db = AsyncDatabase()

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/", response_model=List[User])
async def get_users(skip: int = 0, limit: int = 10):
    users = await db.get_users(skip, limit)
    return users
```

### Concurrent Async Requests

```python
import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()

async def fetch_data(client: httpx.AsyncClient, url: str) -> dict:
    """Async fetch data from a single URL"""
    response = await client.get(url)
    return {"url": url, "status": response.status_code}

@app.get("/aggregate/")
async def aggregate_data():
    """Concurrently request multiple APIs and aggregate results"""
    urls = [
        "https://api.github.com",
        "https://httpbin.org/get",
        "https://jsonplaceholder.typicode.com/posts/1"
    ]

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Execute all requests concurrently
        tasks = [fetch_data(client, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    return {
        "results": [
            r if not isinstance(r, Exception) else {"error": str(r)}
            for r in results
        ]
    }

@app.get("/timeout-example/")
async def with_timeout():
    """Async operation with timeout control"""
    try:
        async with asyncio.timeout(5.0):  # Python 3.11+
            await asyncio.sleep(3)
            return {"status": "completed"}
    except asyncio.TimeoutError:
        return {"status": "timeout"}
```

### Background Tasks

```python
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel, EmailStr
import asyncio

app = FastAPI()

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str

def write_log(message: str):
    """Synchronous log writing"""
    with open("app.log", "a", encoding="utf-8") as f:
        f.write(f"{message}\n")

async def send_email_async(email: EmailRequest):
    """Async email sending"""
    await asyncio.sleep(2)  # Simulate email sending
    print(f"Email sent to {email.to}")

def process_data(data: dict):
    """Synchronous data processing"""
    import time
    time.sleep(5)  # Simulate time-consuming processing
    print(f"Data processing completed: {data}")

@app.post("/send-email/")
async def send_email(
    email: EmailRequest,
    background_tasks: BackgroundTasks
):
    """Send email (async execution in background)"""
    # Add background tasks
    background_tasks.add_task(send_email_async, email)
    background_tasks.add_task(write_log, f"Email request: {email.to}")

    return {"message": "Email request received, processing in background"}

@app.post("/process/")
async def process(
    data: dict,
    background_tasks: BackgroundTasks
):
    """Process data (sync execution in background)"""
    background_tasks.add_task(process_data, data)
    background_tasks.add_task(write_log, f"Process request: {data}")

    return {"message": "Data processing submitted to background"}
```

### WebSocket Support

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    await manager.broadcast(f"User {client_id} joined the chat room")

    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"User {client_id} left the chat room")
```

## Automatic Documentation Generation

### OpenAPI and Swagger UI

FastAPI automatically generates OpenAPI specification documentation and provides interactive interfaces.

```python
from fastapi import FastAPI

app = FastAPI(
    title="E-commerce API",
    description="""
## E-commerce Platform API Documentation

This is a fully-featured e-commerce platform API providing the following features:

### User Management
* User registration and login
* User information management

### Product Management
* Product CRUD operations
* Product category management

### Order Management
* Create and query orders
* Order status tracking
    """,
    version="2.0.0",
    terms_of_service="https://example.com/terms/",
    contact={
        "name": "API Technical Support",
        "url": "https://example.com/support",
        "email": "api-support@example.com",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    openapi_url="/api/v2/openapi.json",  # Custom OpenAPI URL
    docs_url="/api/docs",     # Custom Swagger UI URL
    redoc_url="/api/redoc",   # Custom ReDoc URL
)
```

### Path Operation Documentation

```python
from fastapi import FastAPI, status, Path, Query
from pydantic import BaseModel, Field
from typing import Optional, List

app = FastAPI()

class Product(BaseModel):
    id: int = Field(..., description="Product unique ID")
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    price: float = Field(..., gt=0, description="Product price (must be greater than 0)")
    in_stock: bool = Field(True, description="Whether in stock")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "name": "iPhone 15 Pro",
                    "description": "Apple's latest flagship phone",
                    "price": 8999.00,
                    "in_stock": True
                }
            ]
        }
    }

@app.post(
    "/products/",
    response_model=Product,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Product",
    description="Create a new product record, requires complete product information",
    response_description="Successfully created product object",
    tags=["Product Management"],
    responses={
        201: {"description": "Product created successfully"},
        400: {"description": "Invalid request data"},
        409: {"description": "Product already exists"},
    }
)
async def create_product(product: Product):
    """
    Create a new product with the following information:

    - **id**: Product unique identifier
    - **name**: Product name (required)
    - **description**: Product detailed description (optional)
    - **price**: Product price, must be greater than 0
    - **in_stock**: Stock status, defaults to True
    """
    return product

@app.get(
    "/products/{product_id}",
    response_model=Product,
    summary="Get Product Details",
    tags=["Product Management"]
)
async def get_product(
    product_id: int = Path(
        ...,
        title="Product ID",
        description="Product ID to query",
        ge=1,
        examples=[1, 42, 100]
    )
):
    """Get product details by product ID"""
    return Product(id=product_id, name="Sample Product", price=99.99)

@app.get(
    "/products/",
    response_model=List[Product],
    summary="Get Product List",
    tags=["Product Management"]
)
async def list_products(
    category: Optional[str] = Query(
        None,
        description="Filter by category",
        examples=["Electronics", "Clothing", "Food"]
    ),
    min_price: float = Query(0, ge=0, description="Minimum price"),
    max_price: float = Query(999999, le=999999, description="Maximum price"),
    in_stock_only: bool = Query(False, description="Show only in-stock products")
):
    """
    Get product list with multiple filter options
    """
    return []
```

### Tag Grouping

```python
from fastapi import FastAPI

tags_metadata = [
    {
        "name": "User Management",
        "description": "User-related operations: registration, login, information management, etc.",
    },
    {
        "name": "Product Management",
        "description": "Product CRUD operations",
        "externalDocs": {
            "description": "Product API detailed documentation",
            "url": "https://example.com/docs/products",
        },
    },
    {
        "name": "Order Management",
        "description": "Order creation, query, and status management",
    },
    {
        "name": "Internal APIs",
        "description": "Management APIs for internal use only",
    },
]

app = FastAPI(openapi_tags=tags_metadata)

@app.post("/users/", tags=["User Management"])
async def create_user():
    pass

@app.get("/users/me", tags=["User Management"])
async def get_current_user():
    pass

@app.get("/products/", tags=["Product Management"])
async def list_products():
    pass

@app.post("/orders/", tags=["Order Management"])
async def create_order():
    pass

# An endpoint can have multiple tags
@app.get("/admin/stats", tags=["Internal APIs", "Statistics"])
async def get_stats():
    pass
```

### Hiding Endpoints

```python
# Hide endpoint from documentation
@app.get("/internal/health", include_in_schema=False)
async def health_check():
    return {"status": "healthy"}

# Mark as deprecated
@app.get("/v1/items/", deprecated=True, tags=["Legacy APIs"])
async def old_list_items():
    """This API is deprecated, please use /v2/items/"""
    return []
```

## Middleware and CORS

### HTTP Middleware

```python
import time
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# Add middleware using decorator
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"[Response Status] {response.status_code}")
    return response

# Define middleware using class
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import uuid
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

@app.get("/")
async def root(request: Request):
    return {"request_id": request.state.request_id}
```

### CORS Configuration

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Development environment: allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Production environment: strict configuration
origins = [
    "https://www.example.com",
    "https://app.example.com",
    "http://localhost:3000",  # Local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Process-Time", "X-Request-ID"],
    max_age=600,  # Preflight request cache time (seconds)
)
```

### Other Common Middleware

```python
from fastapi import FastAPI
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"]
)

# HTTPS redirect (production environment)
# app.add_middleware(HTTPSRedirectMiddleware)
```

## Error Handling Mechanisms

### HTTPException

```python
from fastapi import FastAPI, HTTPException, status

app = FastAPI()

items = {"apple": "Apple", "banana": "Banana"}

@app.get("/items/{item_id}")
async def read_item(item_id: str):
    if item_id not in items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item '{item_id}' does not exist",
            headers={"X-Error": "Item not found"},
        )
    return {"item_id": item_id, "name": items[item_id]}

@app.delete("/items/{item_id}")
async def delete_item(item_id: str):
    if item_id not in items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NOT_FOUND",
                "message": f"Item '{item_id}' does not exist",
                "item_id": item_id
            }
        )
    del items[item_id]
    return {"message": "Deleted successfully"}
```

### Custom Exception Handlers

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

app = FastAPI()

# Custom exception classes
class BusinessException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class AuthorizationException(Exception):
    def __init__(self, message: str = "Unauthorized access"):
        self.message = message

# Register exception handlers
@app.exception_handler(BusinessException)
async def business_exception_handler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": {
                "code": "FORBIDDEN",
                "message": exc.message
            }
        }
    )

# Override validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request data validation failed",
                "details": errors
            }
        }
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Internal server error"
            }
        }
    )

# Using custom exceptions
@app.get("/business/{item_id}")
async def get_item(item_id: int):
    if item_id < 0:
        raise BusinessException(
            code="INVALID_ID",
            message="Product ID cannot be negative"
        )
    if item_id == 0:
        raise AuthorizationException("You do not have access to this product")
    return {"item_id": item_id}
```

## Project Best Practices

### Recommended Project Structure

```
my_fastapi_project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── dependencies.py      # Global dependencies
│   │
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── users.py
│   │   │   │   ├── items.py
│   │   │   │   └── auth.py
│   │   │   └── router.py
│   │   └── v2/
│   │       └── ...
│   │
│   ├── core/                # Core modules
│   │   ├── __init__.py
│   │   ├── security.py      # Security related
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── events.py        # Startup/shutdown events
│   │
│   ├── models/              # Data models
│   │   ├── __init__.py
│   │   ├── user.py          # ORM models
│   │   └── item.py
│   │
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   │
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── item_service.py
│   │
│   ├── repositories/        # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── user_repository.py
│   │
│   └── db/                  # Database
│       ├── __init__.py
│       ├── session.py
│       └── base.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_users.py
│   └── test_items.py
│
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
│
├── scripts/                 # Scripts
│   └── seed_data.py
│
├── .env                     # Environment variables
├── .env.example
├── requirements.txt
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Configuration Management

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List

class Settings(BaseSettings):
    # Application configuration
    app_name: str = "FastAPI Application"
    debug: bool = False
    version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Security configuration
    secret_key: str
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"

    # Database configuration
    database_url: str
    database_echo: bool = False

    # Redis configuration
    redis_url: Optional[str] = None

    # CORS configuration
    cors_origins: List[str] = ["http://localhost:3000"]

    # Logging configuration
    log_level: str = "INFO"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Using configuration
settings = get_settings()
```

### Modular Routing

```python
# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, status
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService
from app.dependencies import get_user_service, get_current_user

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    service: UserService = Depends(get_user_service)
):
    return await service.create_user(user_in)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
):
    return await service.get_user(user_id)

# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import users, items, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Products"])

# app/main.py
from fastapi import FastAPI
from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug
)

app.include_router(api_router, prefix=settings.api_prefix)
```

### Startup and Shutdown Events

```python
# app/core/events.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute on startup
    print("Application starting...")
    await init_database()
    await init_redis()
    print("Application started")

    yield  # Application running

    # Execute on shutdown
    print("Application shutting down...")
    await close_database()
    await close_redis()
    print("Application shut down")

# app/main.py
from fastapi import FastAPI
from app.core.events import lifespan

app = FastAPI(lifespan=lifespan)
```

### Testing Best Practices

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.dependencies import get_db
from app.db.session import TestSessionLocal

# Synchronous test client
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# Asynchronous test client
@pytest.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

# Override dependencies
@pytest.fixture
def override_db():
    def get_test_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = get_test_db
    yield
    app.dependency_overrides.clear()

# tests/test_users.py
import pytest

def test_create_user(client):
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "password" not in data

@pytest.mark.asyncio
async def test_get_user_async(async_client):
    response = await async_client.get("/api/v1/users/1")
    assert response.status_code == 200

def test_authentication(client):
    # Get token
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "testuser", "password": "SecurePass123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    # Use token to access protected endpoint
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
```

## Summary

FastAPI is a powerful and modern Python web framework with the following main advantages:

1. **Type-Driven Development**: Fully leverages Python type hints for automatic validation and documentation generation
2. **Excellent Performance**: Based on Starlette and Pydantic, performance comparable to Node.js and Go
3. **Development Efficiency**: Intuitive API design, excellent editor support, significantly improved development speed
4. **Automatic Documentation**: Automatically generates Swagger UI and ReDoc interactive documentation
5. **Native Async**: Complete async/await support for easy high-concurrency handling
6. **Dependency Injection**: Powerful and flexible dependency injection system for improved code reuse and testability
7. **Secure and Reliable**: Built-in multiple authentication schemes, comprehensive error handling mechanisms

By now, you should have mastered the core concepts and best practices of FastAPI, and can start building high-quality Web API applications.

## Related Resources

- [FastAPI Official Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Starlette Documentation](https://www.starlette.io/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [python-jose (JWT)](https://github.com/mpdavis/python-jose)
