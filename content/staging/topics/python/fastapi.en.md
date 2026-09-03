---
title: FastAPI Complete Guide
description: Master FastAPI for high-performance Python APIs
track: python
section: basics
difficulty: intermediate
tags:
  - FastAPI
  - Python
  - API
  - Async
status: imported
origin: old/src/content/docs/backend/fastapi.en.md
divergence: 0.195
issues: []
legacy:
  category: Backend
  subcategory: Python
  order: 10
  lastUpdated: 2026-01-07
---

## Introduction

FastAPI is a modern, high-performance Python web framework designed specifically for building APIs. Leveraging Python 3.7+ type hints, it combines the power of Starlette (for web handling) and Pydantic (for data validation) to become one of the most popular API frameworks in the Python ecosystem.

### Why Choose FastAPI?

FastAPI's design philosophy centers on "fast development, fast execution, fewer bugs." By cleverly utilizing Python type hints, it achieves automatic data validation, serialization, and documentation generation, significantly boosting development productivity.

Core advantages of FastAPI include:

- **Exceptional Performance**: Comparable to Node.js and Go, making it one of the fastest Python frameworks
- **Developer Productivity**: Type hints enable auto-completion and error checking, reducing human errors by approximately 40%
- **Automatic Documentation**: Auto-generates interactive API documentation (Swagger UI and ReDoc)
- **Standards-Based**: Fully compatible with OpenAPI and JSON Schema standards
- **Modern Design**: Native support for async programming, fully utilizing Python's async/await features
- **Dependency Injection**: Built-in powerful dependency injection system for more testable and maintainable code

## FastAPI Features and Advantages

### Performance Comparison

FastAPI is built on top of Starlette and uses the ASGI (Asynchronous Server Gateway Interface) standard, delivering performance far superior to traditional WSGI frameworks:

| Framework | Requests/sec | Latency (ms) |
|-----------|-------------|--------------|
| FastAPI | ~30,000 | 3.2 |
| Flask | ~4,000 | 25.0 |
| Django | ~3,500 | 28.5 |
| Express.js | ~25,000 | 4.0 |

### Getting Started

First, install FastAPI and an ASGI server:

```bash
# Install FastAPI with all optional dependencies
pip install "fastapi[all]"

# Or install separately
pip install fastapi
pip install "uvicorn[standard]"
```

Create your first FastAPI application:

```python
# main.py
from fastapi import FastAPI

app = FastAPI(
    title="My API Service",
    description="A sample API built with FastAPI",
    version="1.0.0"
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to FastAPI!"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str = None):
    """Get a specific item

    - **item_id**: The unique identifier of the item
    - **q**: Optional query parameter
    """
    return {"item_id": item_id, "query": q}
```

Start the server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000/docs` to see the auto-generated interactive API documentation.

### Recommended Project Structure

For large projects, the following directory structure is recommended:

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── dependencies.py      # Common dependencies
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py    # API route aggregation
│   │   │   ├── users.py     # User-related endpoints
│   │   │   └── items.py     # Item-related endpoints
│   │   └── v2/
│   ├── models/              # Database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/             # Pydantic models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── crud/                # Database operations
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── user.py
│   ├── core/                # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py
│   │   └── config.py
│   └── utils/               # Utility functions
├── tests/
├── alembic/                 # Database migrations
├── requirements.txt
└── .env
```

## Path Operations and Request Handling

### Route Definition

FastAPI uses decorators to define routes, supporting all HTTP methods:

```python
from fastapi import FastAPI, HTTPException, status
from typing import Optional, List

app = FastAPI()

# GET request - Retrieve resources
@app.get("/users")
async def get_users(skip: int = 0, limit: int = 10):
    """Get user list with pagination support"""
    return {"skip": skip, "limit": limit, "users": []}

# POST request - Create resources
@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: dict):
    """Create a new user"""
    return {"id": 1, **user}

# PUT request - Full resource update
@app.put("/users/{user_id}")
async def update_user(user_id: int, user: dict):
    """Update user information"""
    return {"id": user_id, **user}

# PATCH request - Partial resource update
@app.patch("/users/{user_id}")
async def partial_update_user(user_id: int, user: dict):
    """Partially update user information"""
    return {"id": user_id, "updated_fields": list(user.keys())}

# DELETE request - Delete resources
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Delete a user"""
    return None
```

### Path Parameters and Type Validation

FastAPI automatically validates path parameter types:

```python
from fastapi import Path
from enum import Enum

class ModelName(str, Enum):
    """Model name enumeration"""
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"

@app.get("/models/{model_name}")
async def get_model(model_name: ModelName):
    """Get machine learning model information"""
    if model_name is ModelName.alexnet:
        return {"model_name": model_name, "message": "Deep Learning pioneer"}
    return {"model_name": model_name, "message": "Classic model"}

@app.get("/items/{item_id}")
async def read_item(
    item_id: int = Path(
        ...,  # ... indicates required
        title="Item ID",
        description="The unique identifier of the item to retrieve",
        ge=1,  # Greater than or equal to 1
        le=1000  # Less than or equal to 1000
    )
):
    """Get item details, ID must be between 1-1000"""
    return {"item_id": item_id}
```

### Query Parameters

```python
from fastapi import Query
from typing import Optional, List

@app.get("/search")
async def search_items(
    q: str = Query(
        ...,  # Required parameter
        min_length=3,
        max_length=50,
        regex="^[a-zA-Z0-9_-]+$",
        title="Search keyword",
        description="Keyword for searching, only alphanumeric, underscore and hyphen allowed"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    tags: List[str] = Query([], description="Tag filter list")
):
    """Search items

    Supports keyword search, pagination, and tag filtering
    """
    return {
        "query": q,
        "skip": skip,
        "limit": limit,
        "tags": tags
    }
```

### Route Grouping with APIRouter

Use APIRouter to organize large applications:

```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
    responses={404: {"description": "User not found"}}
)

@router.get("/", response_model=List[dict])
async def list_users():
    """Get all users"""
    return []

@router.get("/{user_id}")
async def get_user(user_id: int):
    """Get a single user"""
    return {"user_id": user_id}

@router.post("/")
async def create_user(user: dict):
    """Create a user"""
    return user
```

```python
# app/main.py
from fastapi import FastAPI
from app.api.v1 import users, items

app = FastAPI()

# Register routers
app.include_router(users.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
```

## Pydantic Data Validation

### Basic Model Definition

Pydantic is the core of FastAPI's data validation:

```python
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    guest = "guest"

class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Username, 3-50 characters"
    )
    role: UserRole = UserRole.user

class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, description="Password, at least 8 characters")

    @validator('password')
    def password_strength(cls, v):
        """Password strength validation"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    """User update model - all fields optional"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    """User response model"""
    id: int
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True  # Support conversion from ORM models
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe",
                "role": "user",
                "is_active": True,
                "created_at": "2024-01-15T10:30:00"
            }
        }
```

### Nested Models and Complex Validation

```python
from pydantic import BaseModel, Field, root_validator
from typing import List, Optional
from decimal import Decimal

class Address(BaseModel):
    """Address model"""
    street: str
    city: str
    country: str
    postal_code: str = Field(..., regex=r"^\d{5,6}$")

class OrderItem(BaseModel):
    """Order item model"""
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")
    unit_price: Decimal = Field(..., gt=0, decimal_places=2)

    @property
    def total_price(self) -> Decimal:
        return self.quantity * self.unit_price

class Order(BaseModel):
    """Order model"""
    customer_id: int
    items: List[OrderItem] = Field(..., min_items=1)
    shipping_address: Address
    billing_address: Optional[Address] = None
    discount_code: Optional[str] = None

    @root_validator
    def check_addresses(cls, values):
        """If no billing address provided, use shipping address"""
        if values.get('billing_address') is None:
            values['billing_address'] = values.get('shipping_address')
        return values

    @property
    def total_amount(self) -> Decimal:
        return sum(item.total_price for item in self.items)

# Usage in routes
@app.post("/orders", response_model=dict)
async def create_order(order: Order):
    """Create an order"""
    return {
        "order_id": 12345,
        "total_amount": float(order.total_amount),
        "items_count": len(order.items)
    }
```

### Response Models and Field Filtering

```python
from pydantic import BaseModel
from typing import List

class UserInDB(BaseModel):
    """User model in database (contains sensitive info)"""
    id: int
    email: str
    username: str
    hashed_password: str
    is_active: bool

class UserPublic(BaseModel):
    """Public user information"""
    id: int
    username: str

# Use response_model to filter response
@app.get("/users/{user_id}", response_model=UserPublic)
async def get_user(user_id: int):
    """Get public user info, automatically filters sensitive fields"""
    # Even if returning an object with password, response only includes UserPublic fields
    user_in_db = UserInDB(
        id=user_id,
        email="user@example.com",
        username="johndoe",
        hashed_password="secret_hash",
        is_active=True
    )
    return user_in_db

# Dynamic response model
@app.get(
    "/users/{user_id}/full",
    response_model=UserInDB,
    response_model_exclude={"hashed_password"}  # Exclude password field
)
async def get_user_full(user_id: int):
    """Get full user info but exclude password"""
    pass
```

## Dependency Injection System

### Basic Dependencies

FastAPI's dependency injection system is one of its most powerful features:

```python
from fastapi import Depends, Header, HTTPException, status
from typing import Optional

# Simple dependency - function
async def common_parameters(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None
):
    """Common pagination parameters"""
    return {"skip": skip, "limit": limit, "q": q}

@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    """Get item list using common parameters"""
    return commons

@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    """Get user list using the same common parameters"""
    return commons

# Validation dependency
async def verify_token(x_token: str = Header(...)):
    """Verify token in request header"""
    if x_token != "valid-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-Token"
        )
    return x_token

async def verify_key(x_key: str = Header(...)):
    """Verify API Key"""
    if x_key != "valid-key":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid X-Key"
        )
    return x_key

# Multiple dependencies
@app.get("/protected", dependencies=[Depends(verify_token), Depends(verify_key)])
async def protected_route():
    """Endpoint requiring both token and key verification"""
    return {"message": "Access granted"}
```

### Class Dependencies and Database Sessions

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from typing import Generator

# Database session dependency
def get_db() -> Generator:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Class dependency - more complex logic
class Pagination:
    """Pagination dependency class"""
    def __init__(
        self,
        page: int = 1,
        per_page: int = 10,
        max_per_page: int = 100
    ):
        self.page = max(1, page)
        self.per_page = min(per_page, max_per_page)
        self.skip = (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        return self.per_page

class UserService:
    """User service dependency"""
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_user(self, user_id: int):
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate):
        user = User(**user_data.dict())
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

@app.get("/users/")
async def list_users(
    pagination: Pagination = Depends(),
    user_service: UserService = Depends()
):
    """User list endpoint using class dependencies"""
    users = user_service.db.query(User).offset(pagination.skip).limit(pagination.limit).all()
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "users": users
    }
```

### Dependency Overrides (For Testing)

```python
from fastapi.testclient import TestClient

# Original dependency
async def get_current_user():
    return {"id": 1, "username": "real_user"}

# Override dependency for testing
async def override_get_current_user():
    return {"id": 999, "username": "test_user"}

# Override dependency in tests
def test_protected_endpoint():
    app.dependency_overrides[get_current_user] = override_get_current_user

    client = TestClient(app)
    response = client.get("/protected")

    assert response.status_code == 200

    # Clean up overrides
    app.dependency_overrides.clear()
```

## Async Support (async/await)

### Async Endpoints

FastAPI natively supports async programming:

```python
import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()

# Async endpoint
@app.get("/async-data")
async def get_async_data():
    """Fetch data asynchronously"""
    await asyncio.sleep(1)  # Simulate async operation
    return {"message": "Async operation completed"}

# Sync endpoint (FastAPI runs it in a thread pool)
@app.get("/sync-data")
def get_sync_data():
    """Fetch data synchronously"""
    import time
    time.sleep(1)  # Blocking operation
    return {"message": "Sync operation completed"}

# Concurrent external API requests
@app.get("/fetch-multiple")
async def fetch_multiple_apis():
    """Concurrently request multiple external APIs"""
    async with httpx.AsyncClient() as client:
        tasks = [
            client.get("https://api.example.com/users"),
            client.get("https://api.example.com/products"),
            client.get("https://api.example.com/orders")
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    results = []
    for resp in responses:
        if isinstance(resp, Exception):
            results.append({"error": str(resp)})
        else:
            results.append(resp.json())

    return {"results": results}
```

### Async Context Managers

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

# Application lifecycle events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Execute on startup
    print("Application starting...")
    await init_database()
    await init_cache()

    yield  # Application running

    # Execute on shutdown
    print("Application shutting down...")
    await close_database()
    await close_cache()

app = FastAPI(lifespan=lifespan)

async def init_database():
    """Initialize database connection pool"""
    pass

async def init_cache():
    """Initialize cache connection"""
    pass

async def close_database():
    """Close database connection"""
    pass

async def close_cache():
    """Close cache connection"""
    pass
```

### Background Tasks

```python
from fastapi import BackgroundTasks
from typing import List

def send_email(email: str, message: str):
    """Send email (time-consuming operation)"""
    import time
    time.sleep(5)  # Simulate sending email
    print(f"Email sent to {email}: {message}")

def process_data(data: List[dict]):
    """Process large amounts of data"""
    # Time-consuming data processing
    for item in data:
        pass

@app.post("/send-notification/{email}")
async def send_notification(
    email: str,
    background_tasks: BackgroundTasks
):
    """Send notification email (async)"""
    background_tasks.add_task(send_email, email, "Welcome!")
    return {"message": "Notification queued for sending"}

@app.post("/process")
async def process_items(
    items: List[dict],
    background_tasks: BackgroundTasks
):
    """Process items and execute additional tasks in background"""
    background_tasks.add_task(process_data, items)
    background_tasks.add_task(send_email, "admin@example.com", "Data processing started")
    return {"message": f"Processing {len(items)} items in background"}
```

## Database Integration

### SQLAlchemy Integration

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# app/crud/user.py
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter()

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
```

### Tortoise ORM (Async ORM)

```python
# app/database.py
from tortoise import Tortoise

async def init_db():
    await Tortoise.init(
        db_url='postgres://user:password@localhost:5432/dbname',
        modules={'models': ['app.models']}
    )
    await Tortoise.generate_schemas()

async def close_db():
    await Tortoise.close_connections()

# app/models/user.py
from tortoise import fields
from tortoise.models import Model

class User(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    username = fields.CharField(max_length=50, unique=True)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"

# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import init_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)

# Async CRUD operations
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users/")
async def create_user(user_data: UserCreate):
    user = await User.create(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password)
    )
    return user
```

## Authentication and Authorization

### JWT Authentication

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

# Configuration
SECRET_KEY = "your-secret-key-keep-it-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from token"""
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

    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    """Ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """User login to get token"""
    user = authenticate_user(form_data.username, form_data.password)
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

@app.get("/users/me")
async def read_users_me(current_user = Depends(get_current_active_user)):
    """Get current user info"""
    return current_user
```

### Role-Based Access Control (RBAC)

```python
from enum import Enum
from functools import wraps

class Role(str, Enum):
    admin = "admin"
    moderator = "moderator"
    user = "user"

def require_roles(allowed_roles: list[Role]):
    """Role verification dependency"""
    async def role_checker(current_user = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Using role verification
@app.get("/admin/users")
async def admin_list_users(
    current_user = Depends(require_roles([Role.admin]))
):
    """Only admins can access"""
    return {"users": []}

@app.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user = Depends(require_roles([Role.admin, Role.moderator]))
):
    """Admins and moderators can delete posts"""
    return {"message": f"Post {post_id} deleted"}
```

### OAuth2 Third-Party Login

```python
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()
oauth.register(
    name='github',
    client_id='your-client-id',
    client_secret='your-client-secret',
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

@app.get("/login/github")
async def github_login(request: Request):
    """Redirect to GitHub login"""
    redirect_uri = request.url_for('github_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)

@app.get("/auth/github/callback")
async def github_callback(request: Request):
    """GitHub OAuth callback"""
    token = await oauth.github.authorize_access_token(request)
    user_info = await oauth.github.get('user', token=token)
    user_data = user_info.json()

    # Create or update user
    user = await get_or_create_user(
        email=user_data['email'],
        username=user_data['login'],
        provider='github'
    )

    # Generate JWT token
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
```

## Automatic API Documentation

### OpenAPI Configuration

FastAPI automatically generates OpenAPI documentation:

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="E-commerce API Service",
    description="""
    ## Features

    * **User Management** - Registration, login, profile management
    * **Product Management** - Product CRUD operations
    * **Order System** - Order creation, payment, shipment tracking

    ## Authentication

    Use JWT Bearer Token for authentication, add to request header:
    ```
    Authorization: Bearer <token>
    ```
    """,
    version="2.0.0",
    terms_of_service="https://example.com/terms/",
    contact={
        "name": "API Support Team",
        "url": "https://example.com/support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "Users",
            "description": "User-related operations including authentication and profile management",
        },
        {
            "name": "Products",
            "description": "Product CRUD operations",
            "externalDocs": {
                "description": "Product API detailed documentation",
                "url": "https://example.com/docs/products",
            },
        },
    ]
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### Enhanced Endpoint Documentation

```python
from fastapi import FastAPI, Query, Path, Body
from pydantic import BaseModel, Field
from typing import List

class Item(BaseModel):
    name: str = Field(..., example="Smartphone")
    description: str = Field(None, example="Latest 5G smartphone")
    price: float = Field(..., gt=0, example=999.00)
    tax: float = Field(None, example=99.90)

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "Smartphone",
                    "description": "Latest 5G smartphone",
                    "price": 999.00,
                    "tax": 99.90
                },
                {
                    "name": "Laptop",
                    "description": "High-performance business laptop",
                    "price": 1499.00,
                    "tax": 149.90
                }
            ]
        }

@app.post(
    "/items/",
    response_model=Item,
    status_code=201,
    tags=["Products"],
    summary="Create new product",
    description="Create a new product entry, requires product name and price",
    response_description="Successfully created product information",
    responses={
        201: {
            "description": "Product created successfully",
            "content": {
                "application/json": {
                    "example": {"name": "Sample Product", "price": 99.99}
                }
            }
        },
        400: {"description": "Invalid request data"},
        401: {"description": "Unauthorized access"},
    }
)
async def create_item(
    item: Item = Body(
        ...,
        openapi_examples={
            "normal": {
                "summary": "Regular product",
                "description": "A regular product example",
                "value": {
                    "name": "Regular Product",
                    "description": "This is a regular product",
                    "price": 99.99,
                    "tax": 9.99
                }
            },
            "premium": {
                "summary": "Premium product",
                "description": "A premium product example",
                "value": {
                    "name": "Premium Product",
                    "description": "This is a premium product",
                    "price": 999.99,
                    "tax": 99.99
                }
            }
        }
    )
):
    """
    Detailed description of create product endpoint:

    - **name**: Product name (required)
    - **description**: Product description (optional)
    - **price**: Product price, must be greater than 0 (required)
    - **tax**: Tax amount (optional)
    """
    return item
```

## Deployment and Performance Optimization

### Production Deployment Configuration

```python
# gunicorn.conf.py
import multiprocessing

# Bind address
bind = "0.0.0.0:8000"

# Number of workers = CPU cores * 2 + 1
workers = multiprocessing.cpu_count() * 2 + 1

# Worker class (using uvicorn worker)
worker_class = "uvicorn.workers.UvicornWorker"

# Timeout settings
timeout = 120
keepalive = 5

# Max requests before worker restart
max_requests = 1000
max_requests_jitter = 50

# Logging configuration
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# Process name
proc_name = "fastapi_app"
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app.main:app"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/app
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Performance Optimization Tips

```python
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis.asyncio as redis

app = FastAPI()

# Enable GZIP compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Initialize cache
@app.on_event("startup")
async def startup():
    redis_client = redis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")

# Use cache decorator
@app.get("/items/{item_id}")
@cache(expire=60)  # Cache for 60 seconds
async def get_item(item_id: int):
    """Get product (with caching)"""
    # Simulate time-consuming database query
    return {"item_id": item_id, "name": f"Item {item_id}"}

# Database connection pool optimization
from sqlalchemy.pool import QueuePool
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Async batch processing
async def process_items_batch(items: list):
    """Batch processing to reduce database round trips"""
    async with get_async_session() as session:
        session.add_all(items)
        await session.commit()
```

### Monitoring and Logging

```python
import logging
import time
from fastapi import FastAPI, Request
from prometheus_client import Counter, Histogram, generate_latest
from starlette.responses import Response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

app = FastAPI()

# Request logging and metrics middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    # Log request
    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.3f}s "
        f"status={response.status_code}"
    )

    # Update metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(process_time)

    response.headers["X-Process-Time"] = str(process_time)
    return response

# Prometheus metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## Interview Key Points

### Basic Concepts

**Q1: What are FastAPI's advantages over Flask/Django?**

A: FastAPI's main advantages include:
- **Performance**: Built on ASGI, performance comparable to Go/Node.js
- **Type Hints**: Leverages Python type hints for automatic data validation and documentation generation
- **Native Async**: Native support for async/await
- **Auto Documentation**: Automatically generates OpenAPI/Swagger documentation
- **Dependency Injection**: Built-in powerful DI system

**Q2: Explain FastAPI's dependency injection system**

A: FastAPI's dependency injection allows you to declare dependencies that endpoint functions need, and the framework automatically resolves and injects them:
- Supports functions, classes, and generators as dependencies
- Dependencies can be nested
- Supports dependency caching
- Easy to override dependencies for testing

**Q3: What is Pydantic's role in FastAPI?**

A: Pydantic is responsible for:
- Request data validation and parsing
- Response data serialization
- Automatic JSON Schema generation
- Type conversion and coercion

### Advanced Practice

**Q4: How to implement rate limiting in FastAPI?**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/resource")
@limiter.limit("10/minute")  # Max 10 requests per minute
async def get_resource(request: Request):
    return {"message": "success"}
```

**Q5: How to handle large file uploads?**

```python
from fastapi import UploadFile, File
import aiofiles

@app.post("/upload")
async def upload_large_file(file: UploadFile = File(...)):
    async with aiofiles.open(f"uploads/{file.filename}", "wb") as f:
        while chunk := await file.read(1024 * 1024):  # Read 1MB at a time
            await f.write(chunk)
    return {"filename": file.filename}
```

**Q6: How to implement WebSocket support?**

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client {client_id}: {data}")
    except WebSocketDisconnect:
        manager.active_connections.remove(websocket)
```

### Architecture Design

**Q7: Design a high-concurrency FastAPI service architecture**

Recommended architecture:
1. **Load Balancing Layer**: Nginx or cloud load balancer
2. **Application Layer**: Multiple FastAPI instances (Gunicorn + Uvicorn workers)
3. **Cache Layer**: Redis for caching hot data
4. **Database Layer**: PostgreSQL primary-replica replication + read-write separation
5. **Message Queue**: Celery + Redis/RabbitMQ for async tasks
6. **Monitoring**: Prometheus + Grafana

**Q8: How to ensure API backward compatibility?**

Strategies:
- Use API versioning (/api/v1/, /api/v2/)
- Make new fields optional, don't remove old fields
- Use deprecated parameter to mark deprecated endpoints
- Write comprehensive API tests to ensure compatibility

## Summary

With its outstanding performance, modern design philosophy, and powerful features, FastAPI has become one of the top choices for Python web development. By now, you should have mastered:

1. FastAPI core concepts and project structure
2. Route definition and request handling
3. Using Pydantic for data validation
4. Dependency injection system usage
5. Async programming best practices
6. Database integration solutions
7. Authentication and authorization implementation
8. Automatic API documentation generation
9. Production deployment and optimization

Practice in real projects and combine with the official documentation to deepen your understanding of each feature, gradually becoming a FastAPI development expert.

## Further Reading

- [FastAPI Official Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Starlette Documentation](https://www.starlette.io/)
- [SQLAlchemy Documentation](https://www.sqlalchemy.org/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [ASGI Specification](https://asgi.readthedocs.io/)
- [Python Type Hints (PEP 484)](https://peps.python.org/pep-0484/)
- [Real Python - FastAPI Tutorials](https://realpython.com/fastapi-python-web-apis/)
