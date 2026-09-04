---
title: Python SQLAlchemy ORM
description: Learn Python's most popular ORM framework SQLAlchemy including models, queries, relationships and transactions
track: backend
section: databases
difficulty: intermediate
tags:
  - Python
  - SQLAlchemy
  - ORM
  - database
status: imported
origin: old/src/content/docs/python/sqlalchemy.en.md
divergence: 0.084
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Database
  order: 35
  lastUpdated: 2026-01-07
---

SQLAlchemy is Python's most powerful and widely-used Object-Relational Mapping (ORM) library. It provides a full suite of well-known enterprise-level persistence patterns, designed for efficient and high-performing database access. Whether you're building a small application or a large-scale enterprise system, SQLAlchemy offers the flexibility and power you need.

## Core Concepts

### What is SQLAlchemy?

SQLAlchemy is a SQL toolkit and ORM that gives application developers the full power and flexibility of SQL. It provides two distinct APIs:

- **SQLAlchemy Core**: A SQL expression language that provides a schema-centric view of the database
- **SQLAlchemy ORM**: A domain-centric object mapping layer built on top of Core

### Why Choose SQLAlchemy?

SQLAlchemy stands out among Python ORMs for several reasons:

1. **Flexibility**: Use raw SQL, Core expressions, or full ORM as needed
2. **Database Agnostic**: Support for PostgreSQL, MySQL, SQLite, Oracle, MS SQL Server, and more
3. **Performance**: Efficient query generation and connection pooling
4. **Unit of Work Pattern**: Automatic tracking of object changes
5. **Relationship Management**: Powerful tools for handling complex relationships
6. **Migration Support**: Seamless integration with Alembic for database migrations
7. **Active Community**: Extensive documentation and community support

### SQLAlchemy vs Other ORMs

| Feature | SQLAlchemy | Django ORM | Peewee |
|---------|------------|------------|--------|
| Flexibility | High | Medium | Low |
| Learning Curve | Steep | Moderate | Gentle |
| Raw SQL Support | Excellent | Limited | Limited |
| Async Support | Yes (2.0+) | Yes | Limited |
| Standalone Usage | Yes | No | Yes |
| Enterprise Features | Comprehensive | Basic | Basic |

## Installation and Setup

### Basic Installation

```bash
# Install SQLAlchemy
pip install sqlalchemy

# Install with specific database drivers
pip install sqlalchemy psycopg2-binary  # PostgreSQL
pip install sqlalchemy pymysql          # MySQL
pip install sqlalchemy                  # SQLite (built-in)

# Install with async support
pip install sqlalchemy[asyncio] asyncpg  # Async PostgreSQL
pip install sqlalchemy[asyncio] aiomysql # Async MySQL
```

### Version Compatibility

SQLAlchemy 2.0 introduced significant changes. We'll cover SQLAlchemy 2.0+ syntax:

```python
import sqlalchemy
print(sqlalchemy.__version__)  # Should be 2.0+
```

## Engine and Connection

### Creating an Engine

The Engine is the starting point for any SQLAlchemy application. It manages the connection pool and database dialect.

```python
from sqlalchemy import create_engine

# SQLite (file-based)
engine = create_engine("sqlite:///mydatabase.db")

# SQLite (in-memory)
engine = create_engine("sqlite:///:memory:")

# PostgreSQL
engine = create_engine(
    "postgresql://user:password@localhost:5432/dbname",
    echo=True,  # Log all SQL statements
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Extra connections when pool is full
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600  # Recycle connections after 1 hour
)

# MySQL
engine = create_engine(
    "mysql+pymysql://user:password@localhost:3306/dbname",
    pool_size=5,
    pool_recycle=3600
)

# Connection URL from environment variable
import os
engine = create_engine(os.environ.get("DATABASE_URL"))
```

### Engine Configuration Options

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    "postgresql://user:password@localhost/dbname",
    # Connection pool settings
    poolclass=QueuePool,
    pool_size=5,           # Number of connections to keep open
    max_overflow=10,       # Max additional connections
    pool_timeout=30,       # Seconds to wait for available connection
    pool_recycle=1800,     # Recycle connections after 30 minutes
    pool_pre_ping=True,    # Test connection validity

    # Execution settings
    echo=False,            # Set True to log all SQL
    echo_pool=False,       # Set True to log pool checkouts

    # Other settings
    future=True,           # Enable 2.0 style usage
    isolation_level="READ COMMITTED"
)
```

### Working with Connections

```python
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///example.db")

# Context manager (recommended)
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users"))
    for row in result:
        print(row)

# With explicit commit
with engine.connect() as conn:
    conn.execute(text("INSERT INTO users (name) VALUES (:name)"), {"name": "Alice"})
    conn.commit()

# Using begin() for automatic commit
with engine.begin() as conn:
    conn.execute(text("INSERT INTO users (name) VALUES (:name)"), {"name": "Bob"})
    # Automatically commits at end of block
```

## Declarative Models (SQLAlchemy 2.0)

### Basic Model Definition

SQLAlchemy 2.0 introduces a cleaner declarative syntax using `Mapped` and `mapped_column`:

```python
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func

# Base class for all models
class Base(DeclarativeBase):
    pass

# User model
class User(Base):
    __tablename__ = "users"

    # Primary key with auto-increment
    id: Mapped[int] = mapped_column(primary_key=True)

    # Required fields
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    # Optional fields (nullable)
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    bio: Mapped[Optional[str]] = mapped_column(Text)

    # Boolean with default
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps with server defaults
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"User(id={self.id}, username={self.username!r})"
```

### Column Types and Options

```python
from sqlalchemy import (
    String, Integer, Float, Numeric, Boolean,
    Date, DateTime, Time, Interval,
    Text, LargeBinary, JSON, Enum,
    ForeignKey, UniqueConstraint, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal
from datetime import date, datetime, time, timedelta
from typing import Optional, List
import uuid
import enum

class ProductStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DISCONTINUED = "discontinued"

class Product(Base):
    __tablename__ = "products"

    # UUID primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # String types
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Numeric types
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    weight: Mapped[Optional[float]] = mapped_column(Float)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)

    # Enum type
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus),
        default=ProductStatus.DRAFT
    )

    # JSON type
    metadata_: Mapped[Optional[dict]] = mapped_column(
        "metadata",  # Column name in database
        JSON
    )

    # Boolean
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)

    # Date and time
    release_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Table-level constraints
    __table_args__ = (
        UniqueConstraint('name', 'slug', name='uq_product_name_slug'),
        CheckConstraint('price >= 0', name='ck_product_price_positive'),
        Index('idx_product_status_featured', 'status', 'is_featured'),
    )
```

### Model with Inheritance

```python
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

# Single Table Inheritance
class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(50))

    __mapper_args__ = {
        "polymorphic_identity": "employee",
        "polymorphic_on": "type"
    }

class Manager(Employee):
    department: Mapped[Optional[str]] = mapped_column(String(100))

    __mapper_args__ = {
        "polymorphic_identity": "manager"
    }

class Engineer(Employee):
    specialty: Mapped[Optional[str]] = mapped_column(String(100))

    __mapper_args__ = {
        "polymorphic_identity": "engineer"
    }

# Joined Table Inheritance
class Person(Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(50))

    __mapper_args__ = {
        "polymorphic_identity": "person",
        "polymorphic_on": "type"
    }

class Customer(Person):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(ForeignKey("persons.id"), primary_key=True)
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)

    __mapper_args__ = {
        "polymorphic_identity": "customer"
    }
```

## Sessions and Unit of Work

### Session Basics

The Session is the primary interface for persistence operations. It implements the Unit of Work pattern.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine("sqlite:///example.db")

# Create tables
Base.metadata.create_all(engine)

# Method 1: Direct Session instantiation
with Session(engine) as session:
    user = User(username="alice", email="alice@example.com", password_hash="xxx")
    session.add(user)
    session.commit()

# Method 2: Using sessionmaker (recommended for applications)
SessionLocal = sessionmaker(bind=engine)

with SessionLocal() as session:
    user = User(username="bob", email="bob@example.com", password_hash="xxx")
    session.add(user)
    session.commit()
```

### Session Lifecycle

```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Create - add new objects
    user = User(username="charlie", email="charlie@example.com", password_hash="xxx")
    session.add(user)  # Object is now "pending"

    # The object gets an ID after flush
    session.flush()  # SQL INSERT executed, but not committed
    print(f"User ID after flush: {user.id}")

    # Read - query existing objects
    existing_user = session.get(User, 1)  # Get by primary key

    # Update - modify objects
    existing_user.email = "newemail@example.com"  # Object is now "dirty"

    # Delete - remove objects
    session.delete(existing_user)  # Object marked for deletion

    # Commit - persist all changes
    session.commit()  # All changes are saved to database

    # Rollback - discard all changes
    # session.rollback()  # Undo all pending changes
```

### Session States

Objects in a session go through different states:

```python
from sqlalchemy import inspect

with Session(engine) as session:
    user = User(username="diana", email="diana@example.com", password_hash="xxx")

    # Transient: not attached to any session
    insp = inspect(user)
    print(f"Transient: {insp.transient}")  # True

    session.add(user)
    # Pending: attached but not yet in database
    print(f"Pending: {insp.pending}")  # True

    session.flush()
    # Persistent: attached and in database
    print(f"Persistent: {insp.persistent}")  # True

    session.expunge(user)
    # Detached: was attached but no longer
    print(f"Detached: {insp.detached}")  # True
```

### Dependency Injection Pattern (for Web Frameworks)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from contextlib import contextmanager

engine = create_engine("postgresql://user:pass@localhost/db")
SessionLocal = sessionmaker(bind=engine)

# Context manager for session
@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage
with get_session() as session:
    user = session.get(User, 1)
    user.email = "updated@example.com"
    # Automatically committed if no exception

# For FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## CRUD Operations

### Create Operations

```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Single insert
    user = User(
        username="alice",
        email="alice@example.com",
        password_hash="hashed_password"
    )
    session.add(user)
    session.commit()
    print(f"Created user with ID: {user.id}")

    # Bulk insert (more efficient)
    users = [
        User(username=f"user_{i}", email=f"user_{i}@example.com", password_hash="xxx")
        for i in range(100)
    ]
    session.add_all(users)
    session.commit()

    # Bulk insert with returning IDs (SQLAlchemy 2.0)
    from sqlalchemy import insert

    stmt = insert(User).values([
        {"username": "bulk1", "email": "bulk1@example.com", "password_hash": "xxx"},
        {"username": "bulk2", "email": "bulk2@example.com", "password_hash": "xxx"},
    ])
    session.execute(stmt)
    session.commit()
```

### Read Operations

```python
from sqlalchemy import select, and_, or_, not_
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Get by primary key
    user = session.get(User, 1)

    # Select with where clause
    stmt = select(User).where(User.username == "alice")
    user = session.scalars(stmt).first()

    # Multiple conditions with and_/or_
    stmt = select(User).where(
        and_(
            User.is_active == True,
            or_(
                User.username.like("a%"),
                User.email.contains("example.com")
            )
        )
    )
    users = session.scalars(stmt).all()

    # Ordering
    stmt = select(User).order_by(User.created_at.desc())
    users = session.scalars(stmt).all()

    # Limiting and offset (pagination)
    stmt = select(User).offset(10).limit(20)
    users = session.scalars(stmt).all()

    # Selecting specific columns
    stmt = select(User.id, User.username, User.email)
    results = session.execute(stmt).all()
    for row in results:
        print(f"ID: {row.id}, Username: {row.username}")

    # Count
    from sqlalchemy import func
    stmt = select(func.count()).select_from(User)
    count = session.scalar(stmt)

    # Distinct
    stmt = select(User.email).distinct()
    emails = session.scalars(stmt).all()
```

### Update Operations

```python
from sqlalchemy import update
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Update via ORM (loads object first)
    user = session.get(User, 1)
    if user:
        user.email = "newemail@example.com"
        session.commit()

    # Bulk update (more efficient, no loading)
    stmt = (
        update(User)
        .where(User.is_active == False)
        .values(email=None)
    )
    result = session.execute(stmt)
    print(f"Updated {result.rowcount} rows")
    session.commit()

    # Update with expressions
    from sqlalchemy import func
    stmt = (
        update(User)
        .where(User.id == 1)
        .values(
            full_name=func.upper(User.username),
            updated_at=func.now()
        )
    )
    session.execute(stmt)
    session.commit()
```

### Delete Operations

```python
from sqlalchemy import delete
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Delete via ORM
    user = session.get(User, 1)
    if user:
        session.delete(user)
        session.commit()

    # Bulk delete (more efficient)
    stmt = delete(User).where(User.is_active == False)
    result = session.execute(stmt)
    print(f"Deleted {result.rowcount} rows")
    session.commit()

    # Delete with subquery
    from sqlalchemy import select
    subq = select(User.id).where(User.created_at < "2024-01-01")
    stmt = delete(User).where(User.id.in_(subq))
    session.execute(stmt)
    session.commit()
```

## Relationships

### One-to-Many Relationship

```python
from typing import List, Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # One-to-many relationship
    books: Mapped[List["Book"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan"  # Delete books when author is deleted
    )

class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"))

    # Many-to-one relationship
    author: Mapped["Author"] = relationship(back_populates="books")

# Usage
with Session(engine) as session:
    # Create with relationship
    author = Author(name="J.K. Rowling")
    author.books = [
        Book(title="Harry Potter and the Philosopher's Stone"),
        Book(title="Harry Potter and the Chamber of Secrets"),
    ]
    session.add(author)
    session.commit()

    # Access related objects
    author = session.get(Author, 1)
    for book in author.books:
        print(f"{book.title} by {book.author.name}")
```

### One-to-One Relationship

```python
from typing import Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)

    # One-to-one relationship
    profile: Mapped[Optional["UserProfile"]] = relationship(
        back_populates="user",
        uselist=False,  # Important: makes it one-to-one
        cascade="all, delete-orphan"
    )

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    bio: Mapped[Optional[str]] = mapped_column(String(500))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255))

    user: Mapped["User"] = relationship(back_populates="profile")

# Usage
with Session(engine) as session:
    user = User(
        username="alice",
        profile=UserProfile(bio="Hello, I'm Alice!", avatar_url="/avatars/alice.png")
    )
    session.add(user)
    session.commit()

    # Access
    user = session.get(User, 1)
    print(f"{user.username}'s bio: {user.profile.bio}")
```

### Many-to-Many Relationship

```python
from typing import List
from sqlalchemy import ForeignKey, String, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Association table (no model needed for simple M2M)
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)

    # Many-to-many relationship
    tags: Mapped[List["Tag"]] = relationship(
        secondary=post_tags,
        back_populates="posts"
    )

class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)

    posts: Mapped[List["Post"]] = relationship(
        secondary=post_tags,
        back_populates="tags"
    )

# Usage
with Session(engine) as session:
    # Create tags
    python_tag = Tag(name="Python")
    database_tag = Tag(name="Database")

    # Create post with tags
    post = Post(
        title="SQLAlchemy Tutorial",
        content="Learning SQLAlchemy...",
        tags=[python_tag, database_tag]
    )
    session.add(post)
    session.commit()

    # Query posts by tag
    stmt = select(Post).join(Post.tags).where(Tag.name == "Python")
    python_posts = session.scalars(stmt).all()
```

### Association Object (Extra Data on Relationship)

```python
from datetime import datetime
from typing import List
from sqlalchemy import ForeignKey, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # Relationship through association object
    enrollments: Mapped[List["Enrollment"]] = relationship(back_populates="student")

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    enrollments: Mapped[List["Enrollment"]] = relationship(back_populates="course")

class Enrollment(Base):
    """Association object with extra data"""
    __tablename__ = "enrollments"

    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), primary_key=True)

    # Extra data on the relationship
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    grade: Mapped[Optional[str]] = mapped_column(String(2))

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="enrollments")
    course: Mapped["Course"] = relationship(back_populates="enrollments")

# Usage
with Session(engine) as session:
    student = Student(name="Alice")
    course = Course(name="Database Systems")

    enrollment = Enrollment(student=student, course=course, grade="A")
    session.add(enrollment)
    session.commit()

    # Access
    for enrollment in student.enrollments:
        print(f"{enrollment.course.name}: {enrollment.grade}")
```

### Self-Referential Relationship

```python
from typing import List, Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"))

    # Self-referential relationships
    parent: Mapped[Optional["Category"]] = relationship(
        back_populates="children",
        remote_side=[id]  # Important for self-referential
    )
    children: Mapped[List["Category"]] = relationship(back_populates="parent")

# Usage
with Session(engine) as session:
    electronics = Category(name="Electronics")
    computers = Category(name="Computers", parent=electronics)
    laptops = Category(name="Laptops", parent=computers)

    session.add(electronics)
    session.commit()

    # Navigate hierarchy
    for child in electronics.children:
        print(f"  {child.name}")
        for grandchild in child.children:
            print(f"    {grandchild.name}")
```

## Advanced Queries

### Filtering and Operators

```python
from sqlalchemy import select, and_, or_, not_, func
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Comparison operators
    stmt = select(User).where(User.id > 10)
    stmt = select(User).where(User.id >= 10)
    stmt = select(User).where(User.id < 10)
    stmt = select(User).where(User.id <= 10)
    stmt = select(User).where(User.id != 10)

    # String operators
    stmt = select(User).where(User.username.like("%alice%"))
    stmt = select(User).where(User.username.ilike("%ALICE%"))  # Case-insensitive
    stmt = select(User).where(User.email.contains("@gmail.com"))
    stmt = select(User).where(User.username.startswith("a"))
    stmt = select(User).where(User.username.endswith("_admin"))

    # IN operator
    stmt = select(User).where(User.id.in_([1, 2, 3, 4, 5]))
    stmt = select(User).where(User.username.in_(["alice", "bob", "charlie"]))

    # NOT IN
    stmt = select(User).where(User.id.not_in([1, 2, 3]))

    # BETWEEN
    stmt = select(User).where(User.id.between(10, 20))

    # NULL checks
    stmt = select(User).where(User.bio.is_(None))
    stmt = select(User).where(User.bio.is_not(None))

    # Complex conditions
    stmt = select(User).where(
        and_(
            User.is_active == True,
            or_(
                User.username.like("admin%"),
                User.email.endswith("@company.com")
            ),
            not_(User.bio.is_(None))
        )
    )

    users = session.scalars(stmt).all()
```

### Joins

```python
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

with Session(engine) as session:
    # Implicit join (through relationship)
    stmt = select(Book).join(Book.author).where(Author.name == "J.K. Rowling")
    books = session.scalars(stmt).all()

    # Explicit join
    stmt = select(Book, Author).join(Author, Book.author_id == Author.id)
    results = session.execute(stmt).all()
    for book, author in results:
        print(f"{book.title} by {author.name}")

    # Left outer join
    stmt = select(Author, Book).outerjoin(Book, Author.id == Book.author_id)
    results = session.execute(stmt).all()

    # Multiple joins
    stmt = (
        select(Book)
        .join(Book.author)
        .join(Book.publisher)
        .where(Author.name == "Author Name")
        .where(Publisher.country == "USA")
    )

    # Self join
    manager = aliased(Employee)
    stmt = (
        select(Employee, manager)
        .join(manager, Employee.manager_id == manager.id)
    )
```

### Eager Loading (N+1 Problem Prevention)

```python
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload, subqueryload

with Session(engine) as session:
    # joinedload: Single query with JOIN
    # Best for one-to-one or many-to-one
    stmt = select(Book).options(joinedload(Book.author))
    books = session.scalars(stmt).all()

    # selectinload: Separate SELECT IN query
    # Best for one-to-many
    stmt = select(Author).options(selectinload(Author.books))
    authors = session.scalars(stmt).all()

    # subqueryload: Subquery for loading
    stmt = select(Author).options(subqueryload(Author.books))
    authors = session.scalars(stmt).all()

    # Nested eager loading
    stmt = select(Author).options(
        selectinload(Author.books).joinedload(Book.publisher)
    )
    authors = session.scalars(stmt).all()

    # Multiple relationships
    stmt = select(Post).options(
        selectinload(Post.comments),
        selectinload(Post.tags),
        joinedload(Post.author)
    )
    posts = session.scalars(stmt).all()
```

### Aggregations and Grouping

```python
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Count
    stmt = select(func.count(User.id))
    total_users = session.scalar(stmt)

    # Sum, Avg, Min, Max
    stmt = select(
        func.sum(Order.total),
        func.avg(Order.total),
        func.min(Order.total),
        func.max(Order.total)
    )
    sum_val, avg_val, min_val, max_val = session.execute(stmt).first()

    # Group By
    stmt = (
        select(User.status, func.count(User.id))
        .group_by(User.status)
    )
    results = session.execute(stmt).all()
    for status, count in results:
        print(f"{status}: {count}")

    # Having
    stmt = (
        select(Author.id, Author.name, func.count(Book.id).label("book_count"))
        .join(Book)
        .group_by(Author.id, Author.name)
        .having(func.count(Book.id) > 5)
        .order_by(desc("book_count"))
    )
    prolific_authors = session.execute(stmt).all()

    # Complex aggregation
    stmt = (
        select(
            func.date_trunc('month', Order.created_at).label('month'),
            func.count(Order.id).label('order_count'),
            func.sum(Order.total).label('revenue')
        )
        .group_by(func.date_trunc('month', Order.created_at))
        .order_by('month')
    )
```

### Subqueries

```python
from sqlalchemy import select, func
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Scalar subquery
    avg_price_subq = select(func.avg(Product.price)).scalar_subquery()

    stmt = select(Product).where(Product.price > avg_price_subq)
    expensive_products = session.scalars(stmt).all()

    # Correlated subquery
    book_count_subq = (
        select(func.count(Book.id))
        .where(Book.author_id == Author.id)
        .correlate(Author)
        .scalar_subquery()
    )

    stmt = select(Author, book_count_subq.label("book_count"))
    results = session.execute(stmt).all()

    # EXISTS
    has_books = (
        select(Book)
        .where(Book.author_id == Author.id)
        .exists()
    )
    stmt = select(Author).where(has_books)
    authors_with_books = session.scalars(stmt).all()

    # Subquery as table
    subq = (
        select(
            Order.user_id,
            func.sum(Order.total).label("total_spent")
        )
        .group_by(Order.user_id)
        .subquery()
    )

    stmt = (
        select(User, subq.c.total_spent)
        .join(subq, User.id == subq.c.user_id)
        .where(subq.c.total_spent > 1000)
    )
```

### Window Functions

```python
from sqlalchemy import select, func, over
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Row number
    stmt = select(
        User.id,
        User.username,
        func.row_number().over(order_by=User.created_at).label("row_num")
    )

    # Rank within partition
    stmt = select(
        Employee.id,
        Employee.name,
        Employee.department,
        Employee.salary,
        func.rank().over(
            partition_by=Employee.department,
            order_by=Employee.salary.desc()
        ).label("salary_rank")
    )

    # Running total
    stmt = select(
        Order.id,
        Order.total,
        func.sum(Order.total).over(
            order_by=Order.created_at
        ).label("running_total")
    )

    # Lead/Lag
    stmt = select(
        Product.id,
        Product.price,
        func.lag(Product.price, 1).over(order_by=Product.id).label("prev_price"),
        func.lead(Product.price, 1).over(order_by=Product.id).label("next_price")
    )
```

## Transactions

### Basic Transactions

```python
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Implicit transaction with context manager
with Session(engine) as session:
    user = User(username="alice", email="alice@example.com", password_hash="xxx")
    session.add(user)
    session.commit()  # Commits the transaction

# Transaction with rollback on error
with Session(engine) as session:
    try:
        user1 = User(username="bob", email="bob@example.com", password_hash="xxx")
        user2 = User(username="bob", email="bob2@example.com", password_hash="xxx")  # Duplicate!
        session.add_all([user1, user2])
        session.commit()
    except IntegrityError:
        session.rollback()
        print("Transaction rolled back due to integrity error")
```

### Nested Transactions (Savepoints)

```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    # Outer transaction
    user = User(username="alice", email="alice@example.com", password_hash="xxx")
    session.add(user)

    # Savepoint (nested transaction)
    with session.begin_nested():
        try:
            # This might fail
            another_user = User(username="alice", email="alice2@example.com", password_hash="xxx")
            session.add(another_user)
            session.flush()  # Try to execute
        except IntegrityError:
            # Only rolls back to savepoint, not entire transaction
            pass

    # Outer transaction continues
    session.commit()  # Alice is still saved
```

### Transaction Isolation Levels

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Set at engine level
engine = create_engine(
    "postgresql://user:pass@localhost/db",
    isolation_level="REPEATABLE READ"
)

# Set per connection
with engine.connect().execution_options(isolation_level="SERIALIZABLE") as conn:
    # This connection uses SERIALIZABLE isolation
    pass

# Set per session
with Session(engine) as session:
    session.connection(execution_options={"isolation_level": "READ COMMITTED"})
```

### Optimistic Locking

```python
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    price: Mapped[int] = mapped_column(Integer)
    version_id: Mapped[int] = mapped_column(Integer, default=1)

    __mapper_args__ = {
        "version_id_col": version_id
    }

# Usage - StaleDataError raised if version mismatch
from sqlalchemy.orm.exc import StaleDataError

with Session(engine) as session:
    product = session.get(Product, 1)
    product.price = 1999  # This increments version_id

    try:
        session.commit()
    except StaleDataError:
        session.rollback()
        print("Another transaction modified this record")
```

### Pessimistic Locking

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

with Session(engine) as session:
    # SELECT ... FOR UPDATE
    stmt = select(User).where(User.id == 1).with_for_update()
    user = session.scalars(stmt).first()

    # Modify locked row
    user.balance -= 100
    session.commit()

# With options
with Session(engine) as session:
    # NOWAIT - fail immediately if locked
    stmt = select(User).where(User.id == 1).with_for_update(nowait=True)

    # SKIP LOCKED - skip locked rows
    stmt = select(User).where(User.balance > 0).with_for_update(skip_locked=True)

    # FOR SHARE - shared lock
    stmt = select(User).where(User.id == 1).with_for_update(read=True)
```

## Database Migrations with Alembic

### Alembic Setup

```bash
# Install Alembic
pip install alembic

# Initialize Alembic in your project
alembic init alembic
```

### Configure Alembic

```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.models import Base  # Import your Base
from app.config import DATABASE_URL

config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Creating and Running Migrations

```bash
# Create a new migration (auto-generate from model changes)
alembic revision --autogenerate -m "Add user table"

# Create empty migration
alembic revision -m "Add custom index"

# Run migrations
alembic upgrade head

# Downgrade
alembic downgrade -1     # One step back
alembic downgrade base   # Back to beginning

# Show current revision
alembic current

# Show history
alembic history --verbose
```

### Migration Script Example

```python
# alembic/versions/xxxx_add_user_table.py
"""Add user table

Revision ID: abc123
Revises:
Create Date: 2024-01-15 10:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'abc123'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('email', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_email', 'users', ['email'])

def downgrade():
    op.drop_index('idx_users_email')
    op.drop_table('users')
```

### Data Migrations

```python
# Migration with data changes
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade():
    # Create connection for data operations
    conn = op.get_bind()

    # Define table structure for data operations
    users = table('users',
        column('id', sa.Integer),
        column('status', sa.String),
        column('is_active', sa.Boolean)
    )

    # Update existing data
    conn.execute(
        users.update()
        .where(users.c.status == 'active')
        .values(is_active=True)
    )

    conn.execute(
        users.update()
        .where(users.c.status != 'active')
        .values(is_active=False)
    )
```

## Async SQLAlchemy

### Async Setup

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Create async engine
async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/dbname",
    echo=True,
    pool_size=5,
    max_overflow=10
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)
```

### Async CRUD Operations

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

async def create_user(session: AsyncSession, username: str, email: str) -> User:
    user = User(username=username, email=email, password_hash="xxx")
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def get_user(session: AsyncSession, user_id: int) -> User | None:
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def get_users(session: AsyncSession, skip: int = 0, limit: int = 100) -> list[User]:
    stmt = select(User).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())

async def update_user(session: AsyncSession, user_id: int, **kwargs) -> User | None:
    user = await get_user(session, user_id)
    if user:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await session.commit()
        await session.refresh(user)
    return user

async def delete_user(session: AsyncSession, user_id: int) -> bool:
    user = await get_user(session, user_id)
    if user:
        await session.delete(user)
        await session.commit()
        return True
    return False

# Usage
async def main():
    async with AsyncSessionLocal() as session:
        user = await create_user(session, "alice", "alice@example.com")
        print(f"Created user: {user}")

        users = await get_users(session)
        print(f"All users: {users}")

asyncio.run(main())
```

### Async Relationships and Eager Loading

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

async def get_author_with_books(session: AsyncSession, author_id: int) -> Author | None:
    stmt = (
        select(Author)
        .options(selectinload(Author.books))
        .where(Author.id == author_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def get_books_by_author(session: AsyncSession, author_name: str) -> list[Book]:
    stmt = (
        select(Book)
        .join(Book.author)
        .options(selectinload(Book.author))
        .where(Author.name == author_name)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
```

### FastAPI Integration

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

# Endpoints
@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password)
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def read_user(user_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
```

## Best Practices

### Model Design

```python
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func

class Base(DeclarativeBase):
    """Base class with common fields and methods"""
    pass

class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

class SoftDeleteMixin:
    """Mixin for soft delete functionality"""
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

# Use mixins
class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
```

### Repository Pattern

```python
from typing import Generic, TypeVar, Type, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    """Generic repository for basic CRUD operations"""

    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session

    def get(self, id: int) -> Optional[ModelType]:
        return self.session.get(self.model, id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        return list(self.session.scalars(stmt).all())

    def create(self, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, id: int, obj_in: dict) -> Optional[ModelType]:
        db_obj = self.get(id)
        if db_obj:
            for key, value in obj_in.items():
                setattr(db_obj, key, value)
            self.session.commit()
            self.session.refresh(db_obj)
        return db_obj

    def delete(self, id: int) -> bool:
        db_obj = self.get(id)
        if db_obj:
            self.session.delete(db_obj)
            self.session.commit()
            return True
        return False

# Specific repository with custom methods
class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        super().__init__(User, session)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return self.session.scalars(stmt).first()

    def get_active_users(self) -> List[User]:
        stmt = select(User).where(User.is_active == True)
        return list(self.session.scalars(stmt).all())
```

### Query Optimization

```python
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload, load_only

# Select only needed columns
stmt = select(User).options(
    load_only(User.id, User.username, User.email)
)

# Use eager loading to prevent N+1
stmt = select(Author).options(
    selectinload(Author.books)
)

# Use pagination
def paginate(query, page: int, per_page: int = 20):
    return query.offset((page - 1) * per_page).limit(per_page)

# Index frequently queried columns
class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(100), index=True)  # Index this

    __table_args__ = (
        Index('idx_user_status_created', 'status', 'created_at'),  # Composite index
    )

# Use bulk operations for mass updates
from sqlalchemy import update
stmt = update(User).where(User.status == "pending").values(status="active")
session.execute(stmt)

# Use streaming for large result sets
stmt = select(User)
for user in session.scalars(stmt).yield_per(100):
    process(user)
```

### Error Handling

```python
from sqlalchemy.exc import (
    IntegrityError,
    OperationalError,
    SQLAlchemyError
)
from sqlalchemy.orm import Session

class DatabaseError(Exception):
    pass

class DuplicateError(DatabaseError):
    pass

class NotFoundError(DatabaseError):
    pass

def create_user_safe(session: Session, username: str, email: str) -> User:
    try:
        user = User(username=username, email=email, password_hash="xxx")
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    except IntegrityError as e:
        session.rollback()
        if "unique constraint" in str(e.orig).lower():
            raise DuplicateError(f"User with this username or email already exists")
        raise DatabaseError(f"Database integrity error: {e}")
    except OperationalError as e:
        session.rollback()
        raise DatabaseError(f"Database operation error: {e}")
    except SQLAlchemyError as e:
        session.rollback()
        raise DatabaseError(f"Database error: {e}")
```

## Testing with SQLAlchemy

### Test Setup

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.models import Base

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def engine():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def session(engine):
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()
```

### Test Examples

```python
import pytest
from app.models import User
from app.repositories import UserRepository

class TestUserRepository:
    def test_create_user(self, session):
        repo = UserRepository(session)
        user = repo.create({
            "username": "testuser",
            "email": "test@example.com",
            "password_hash": "xxx"
        })

        assert user.id is not None
        assert user.username == "testuser"

    def test_get_user(self, session):
        # Create a user first
        user = User(username="testuser", email="test@example.com", password_hash="xxx")
        session.add(user)
        session.commit()

        repo = UserRepository(session)
        found_user = repo.get(user.id)

        assert found_user is not None
        assert found_user.username == "testuser"

    def test_duplicate_username_raises_error(self, session):
        repo = UserRepository(session)
        repo.create({
            "username": "testuser",
            "email": "test1@example.com",
            "password_hash": "xxx"
        })

        with pytest.raises(DuplicateError):
            repo.create({
                "username": "testuser",
                "email": "test2@example.com",
                "password_hash": "xxx"
            })
```

### Async Test Setup

```python
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models import Base

@pytest_asyncio.fixture
async def async_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def async_session(async_engine):
    async_session_maker = async_sessionmaker(async_engine, class_=AsyncSession)
    async with async_session_maker() as session:
        yield session

@pytest.mark.asyncio
async def test_async_create_user(async_session):
    user = User(username="testuser", email="test@example.com", password_hash="xxx")
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)

    assert user.id is not None
```

## Common Interview Questions

### Q1: What is the difference between `session.flush()` and `session.commit()`?

**Answer:**
- `flush()`: Sends pending SQL statements to the database but does not commit the transaction. Changes are visible within the current session but can still be rolled back.
- `commit()`: Calls `flush()` internally and then commits the transaction, making changes permanent.

```python
with Session(engine) as session:
    user = User(username="alice", email="alice@example.com", password_hash="xxx")
    session.add(user)

    session.flush()  # SQL INSERT executed, user.id is assigned
    print(user.id)   # Has value, but not committed

    session.rollback()  # Can still undo
    print(user.id)      # None, because rolled back
```

### Q2: How do you prevent the N+1 query problem?

**Answer:**
Use eager loading strategies:

```python
# N+1 Problem (bad)
authors = session.scalars(select(Author)).all()
for author in authors:
    print(author.books)  # Each access triggers a new query

# Solution: Use selectinload or joinedload
stmt = select(Author).options(selectinload(Author.books))
authors = session.scalars(stmt).all()
for author in authors:
    print(author.books)  # No additional queries
```

### Q3: Explain the SQLAlchemy session states.

**Answer:**
- **Transient**: Object created but not attached to any session
- **Pending**: Object added to session via `session.add()`, but not yet flushed
- **Persistent**: Object is in the session and exists in the database
- **Detached**: Object was attached to a session but is no longer
- **Deleted**: Object is marked for deletion in the next flush

### Q4: How do you handle database migrations in production?

**Answer:**
Use Alembic for migrations:
1. Generate migration: `alembic revision --autogenerate -m "description"`
2. Review the generated migration file
3. Test locally: `alembic upgrade head`
4. Deploy migration in staging
5. Deploy to production with proper backup strategy

### Q5: What is the difference between `relationship()` lazy loading options?

**Answer:**
- `lazy="select"` (default): Load related objects when accessed
- `lazy="joined"`: Load in the same query using JOIN
- `lazy="subquery"`: Load using a subquery
- `lazy="selectin"`: Load using SELECT IN
- `lazy="raise"`: Raise an error if accessed (prevents lazy loading)
- `lazy="noload"`: Never load automatically

## Summary

SQLAlchemy is a powerful and flexible ORM that provides:

1. **Two-layer Architecture**: Core (low-level SQL) and ORM (high-level objects)
2. **Declarative Models**: Clean, type-hinted model definitions in 2.0
3. **Flexible Querying**: From simple selects to complex joins and subqueries
4. **Relationship Management**: One-to-one, one-to-many, many-to-many
5. **Transaction Control**: Full ACID compliance with savepoints
6. **Async Support**: Full async/await support in 2.0
7. **Migration Support**: Alembic integration for schema migrations

Key best practices:
- Use the 2.0 style with `Mapped` and `mapped_column`
- Always use eager loading to prevent N+1 queries
- Implement the repository pattern for cleaner code
- Use Alembic for database migrations
- Write comprehensive tests with in-memory databases

## Further Reading

### Official Resources

- [SQLAlchemy Official Documentation](https://docs.sqlalchemy.org/)
- [SQLAlchemy 2.0 Migration Guide](https://docs.sqlalchemy.org/en/20/changelog/migration_20.html)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

### Books

- **"Essential SQLAlchemy"** by Jason Myers and Rick Copeland
- **"SQLAlchemy: Database Access Using Python"** by Mark Ramm

### Related Technologies

- **Alembic**: Database migration tool for SQLAlchemy
- **FastAPI**: Modern web framework with excellent SQLAlchemy integration
- **Pydantic**: Data validation library often used with SQLAlchemy
- **asyncpg**: Fast PostgreSQL driver for async SQLAlchemy

---

SQLAlchemy's combination of flexibility, power, and Python-native design makes it the go-to choice for database access in Python applications. Whether you're building a simple CRUD application or a complex enterprise system, SQLAlchemy provides the tools you need to work efficiently with relational databases.
