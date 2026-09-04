---
title: Python sqlite3 Database
description: Learn Python built-in sqlite3 module for database operations including CRUD, transactions and parameterized queries
track: backend
section: databases
difficulty: beginner
tags:
  - Python
  - sqlite3
  - database
  - SQL
status: imported
origin: old/src/content/docs/python/sqlite3.en.md
divergence: 0.106
issues: []
legacy:
  category: Python
  subcategory: Database
  order: 39
  lastUpdated: 2026-01-07
---

SQLite is a lightweight, serverless, self-contained relational database engine that stores data in a single file. Python's built-in `sqlite3` module provides a DB-API 2.0 compliant interface for working with SQLite databases, making it an excellent choice for small to medium applications, prototyping, testing, and local data storage without the need for a separate database server.

## Overview

The `sqlite3` module offers:

- **Zero Configuration**: No server setup required
- **Single File Storage**: Entire database in one file
- **Cross-Platform**: Works on all major operating systems
- **ACID Compliance**: Full transaction support
- **Thread Safety**: Multiple threads can share a connection

## Connecting to a Database

### Basic Connection

```python
import sqlite3

# Connect to a database file (creates if not exists)
conn = sqlite3.connect("mydata.db")

# Create a cursor object for executing SQL
cursor = conn.cursor()

# Execute SQL commands
cursor.execute("SELECT sqlite_version()")
print(f"SQLite version: {cursor.fetchone()[0]}")

# Always close the connection when done
conn.close()
```

### Using Context Managers

The recommended approach uses context managers to ensure proper resource cleanup.

```python
import sqlite3

# Connection context manager
with sqlite3.connect("mydata.db") as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT sqlite_version()")
    version = cursor.fetchone()[0]
    print(f"SQLite version: {version}")
# Connection is automatically closed
```

### In-Memory Databases

For temporary data or testing, use an in-memory database.

```python
import sqlite3

# Create an in-memory database
conn = sqlite3.connect(":memory:")
cursor = conn.cursor()

# Create table and insert data
cursor.execute("""
    CREATE TABLE temp_data (
        id INTEGER PRIMARY KEY,
        value TEXT
    )
""")
cursor.execute("INSERT INTO temp_data (value) VALUES ('test')")

# Query data
cursor.execute("SELECT * FROM temp_data")
print(cursor.fetchall())
# Output: [(1, 'test')]

conn.close()
# Data is lost when connection closes
```

### Connection Parameters

```python
import sqlite3

# Connection with timeout (seconds to wait for locks)
conn = sqlite3.connect("mydata.db", timeout=10.0)

# Check if connection is for same thread only
conn = sqlite3.connect("mydata.db", check_same_thread=False)

# Enable URI mode for special connection strings
conn = sqlite3.connect("file:mydata.db?mode=ro", uri=True)  # Read-only

# Isolation level options
conn = sqlite3.connect("mydata.db", isolation_level=None)  # Autocommit
conn = sqlite3.connect("mydata.db", isolation_level="DEFERRED")  # Default
conn = sqlite3.connect("mydata.db", isolation_level="IMMEDIATE")
conn = sqlite3.connect("mydata.db", isolation_level="EXCLUSIVE")
```

## Creating Tables

### Basic Table Creation

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Create a simple table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    print("Table created successfully")
```

### SQLite Data Types

SQLite uses dynamic typing with five storage classes:

| Storage Class | Description | Python Type |
|---------------|-------------|-------------|
| NULL | Null value | None |
| INTEGER | Signed integer | int |
| REAL | Floating point | float |
| TEXT | Text string | str |
| BLOB | Binary data | bytes |

```python
import sqlite3

with sqlite3.connect("types_demo.db") as conn:
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_types (
            id INTEGER PRIMARY KEY,
            int_col INTEGER,
            real_col REAL,
            text_col TEXT,
            blob_col BLOB,
            null_col TEXT
        )
    """)

    # Insert various Python types
    cursor.execute("""
        INSERT INTO data_types (int_col, real_col, text_col, blob_col, null_col)
        VALUES (?, ?, ?, ?, ?)
    """, (42, 3.14159, "Hello, World!", b"\x00\x01\x02", None))

    conn.commit()

    # Query and check types
    cursor.execute("SELECT * FROM data_types")
    row = cursor.fetchone()
    print(f"INTEGER: {row[1]} (type: {type(row[1]).__name__})")
    print(f"REAL: {row[2]} (type: {type(row[2]).__name__})")
    print(f"TEXT: {row[3]} (type: {type(row[3]).__name__})")
    print(f"BLOB: {row[4]} (type: {type(row[4]).__name__})")
    print(f"NULL: {row[5]} (type: {type(row[5]).__name__})")
```

### Tables with Foreign Keys

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Enable foreign key support (disabled by default)
    cursor.execute("PRAGMA foreign_keys = ON")

    # Create categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)

    # Create products table with foreign key
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories (id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        )
    """)

    # Create orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id)
                ON DELETE CASCADE
        )
    """)

    conn.commit()
```

## CRUD Operations

### Create (INSERT)

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Insert single row
    cursor.execute("""
        INSERT INTO products (name, price, quantity)
        VALUES ('Widget', 19.99, 100)
    """)

    # Get the ID of the inserted row
    print(f"Inserted row ID: {cursor.lastrowid}")

    # Insert with parameterized query (RECOMMENDED)
    cursor.execute("""
        INSERT INTO products (name, price, quantity)
        VALUES (?, ?, ?)
    """, ("Gadget", 29.99, 50))

    # Insert multiple rows with executemany
    products = [
        ("Sprocket", 5.99, 200),
        ("Gizmo", 14.99, 75),
        ("Doohickey", 9.99, 150)
    ]
    cursor.executemany("""
        INSERT INTO products (name, price, quantity)
        VALUES (?, ?, ?)
    """, products)

    print(f"Rows inserted: {cursor.rowcount}")

    conn.commit()
```

### Read (SELECT)

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Fetch all rows
    cursor.execute("SELECT * FROM products")
    all_products = cursor.fetchall()
    print("All products:")
    for product in all_products:
        print(f"  {product}")

    # Fetch one row
    cursor.execute("SELECT * FROM products WHERE id = ?", (1,))
    single_product = cursor.fetchone()
    print(f"\nSingle product: {single_product}")

    # Fetch specific number of rows
    cursor.execute("SELECT * FROM products ORDER BY price DESC")
    top_three = cursor.fetchmany(3)
    print(f"\nTop 3 by price: {top_three}")

    # Using iterator (memory efficient for large results)
    cursor.execute("SELECT name, price FROM products")
    print("\nIterating through results:")
    for row in cursor:
        print(f"  {row[0]}: ${row[1]:.2f}")
```

### Update

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Update single row
    cursor.execute("""
        UPDATE products
        SET price = ?, quantity = ?
        WHERE id = ?
    """, (24.99, 80, 1))

    print(f"Rows updated: {cursor.rowcount}")

    # Update multiple rows
    cursor.execute("""
        UPDATE products
        SET quantity = quantity + 10
        WHERE price < 20
    """)

    print(f"Rows affected by bulk update: {cursor.rowcount}")

    conn.commit()
```

### Delete

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Delete specific row
    cursor.execute("DELETE FROM products WHERE id = ?", (5,))
    print(f"Rows deleted: {cursor.rowcount}")

    # Delete with condition
    cursor.execute("DELETE FROM products WHERE quantity = 0")

    # Delete all rows (use with caution!)
    # cursor.execute("DELETE FROM products")

    conn.commit()
```

## Parameterized Queries

Parameterized queries prevent SQL injection and improve performance. Always use them when incorporating user input.

### Question Mark Style (Positional)

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Single parameter
    name = "Widget"
    cursor.execute("SELECT * FROM products WHERE name = ?", (name,))

    # Multiple parameters
    min_price = 10.0
    max_price = 50.0
    cursor.execute("""
        SELECT * FROM products
        WHERE price BETWEEN ? AND ?
        ORDER BY price
    """, (min_price, max_price))

    results = cursor.fetchall()
    print(f"Products between ${min_price} and ${max_price}:")
    for row in results:
        print(f"  {row}")
```

### Named Parameters

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Using named parameters with dictionary
    params = {
        "name": "New Product",
        "price": 39.99,
        "quantity": 25
    }
    cursor.execute("""
        INSERT INTO products (name, price, quantity)
        VALUES (:name, :price, :quantity)
    """, params)

    # Query with named parameters
    search_params = {
        "min_price": 10.0,
        "category": "Electronics"
    }
    cursor.execute("""
        SELECT * FROM products
        WHERE price >= :min_price
    """, search_params)

    conn.commit()
```

### SQL Injection Prevention

```python
import sqlite3

# DANGEROUS - Never do this!
def unsafe_search(user_input):
    conn = sqlite3.connect("shop.db")
    cursor = conn.cursor()
    # This is vulnerable to SQL injection
    query = f"SELECT * FROM products WHERE name = '{user_input}'"
    cursor.execute(query)
    return cursor.fetchall()

# If user_input = "'; DROP TABLE products; --"
# The query becomes: SELECT * FROM products WHERE name = ''; DROP TABLE products; --'

# SAFE - Always use parameterized queries
def safe_search(user_input):
    conn = sqlite3.connect("shop.db")
    cursor = conn.cursor()
    # Parameters are properly escaped
    cursor.execute("SELECT * FROM products WHERE name = ?", (user_input,))
    return cursor.fetchall()

# Example
user_search = "Widget"
results = safe_search(user_search)
```

## Transactions

SQLite supports ACID transactions for data integrity.

### Basic Transaction Control

```python
import sqlite3

conn = sqlite3.connect("bank.db")
cursor = conn.cursor()

# Create accounts table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        balance REAL NOT NULL CHECK(balance >= 0)
    )
""")

# Insert initial data
cursor.executemany("""
    INSERT OR IGNORE INTO accounts (id, name, balance)
    VALUES (?, ?, ?)
""", [(1, "Alice", 1000.0), (2, "Bob", 500.0)])

conn.commit()

# Transfer money with transaction
def transfer_money(from_id, to_id, amount):
    try:
        cursor.execute("BEGIN TRANSACTION")

        # Deduct from sender
        cursor.execute("""
            UPDATE accounts SET balance = balance - ?
            WHERE id = ? AND balance >= ?
        """, (amount, from_id, amount))

        if cursor.rowcount == 0:
            raise ValueError("Insufficient funds or invalid account")

        # Add to receiver
        cursor.execute("""
            UPDATE accounts SET balance = balance + ?
            WHERE id = ?
        """, (amount, to_id))

        if cursor.rowcount == 0:
            raise ValueError("Invalid receiver account")

        conn.commit()
        print(f"Transferred ${amount} from account {from_id} to {to_id}")

    except Exception as e:
        conn.rollback()
        print(f"Transaction failed: {e}")

# Test transfer
transfer_money(1, 2, 200.0)

# Check balances
cursor.execute("SELECT * FROM accounts")
for row in cursor.fetchall():
    print(f"Account {row[0]} ({row[1]}): ${row[2]:.2f}")

conn.close()
```

### Isolation Levels

```python
import sqlite3

# DEFERRED (default): Lock acquired on first read/write
conn = sqlite3.connect("shop.db", isolation_level="DEFERRED")

# IMMEDIATE: Write lock acquired immediately
conn = sqlite3.connect("shop.db", isolation_level="IMMEDIATE")

# EXCLUSIVE: All locks acquired immediately
conn = sqlite3.connect("shop.db", isolation_level="EXCLUSIVE")

# Autocommit mode (no transactions)
conn = sqlite3.connect("shop.db", isolation_level=None)
```

### Context Manager for Transactions

```python
import sqlite3
from contextlib import contextmanager

@contextmanager
def transaction(conn):
    """Context manager for database transactions."""
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise

# Usage
with sqlite3.connect("shop.db") as conn:
    with transaction(conn) as cursor:
        cursor.execute("INSERT INTO products (name, price) VALUES (?, ?)",
                      ("New Item", 29.99))
        cursor.execute("UPDATE products SET quantity = quantity + 1 WHERE id = 1")
        # Automatically commits if no exception
        # Automatically rolls back on exception
```

## Row Factories

Row factories customize how query results are returned.

### sqlite3.Row for Named Access

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    # Use Row factory for dictionary-like access
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM products WHERE id = 1")
    row = cursor.fetchone()

    if row:
        # Access by column name
        print(f"Name: {row['name']}")
        print(f"Price: ${row['price']:.2f}")
        print(f"Quantity: {row['quantity']}")

        # Access by index still works
        print(f"ID: {row[0]}")

        # Get column names
        print(f"Columns: {row.keys()}")

        # Convert to dictionary
        product_dict = dict(row)
        print(f"As dict: {product_dict}")
```

### Custom Row Factory

```python
import sqlite3
from collections import namedtuple

def namedtuple_factory(cursor, row):
    """Factory that returns namedtuples."""
    fields = [column[0] for column in cursor.description]
    Row = namedtuple("Row", fields)
    return Row(*row)

def dict_factory(cursor, row):
    """Factory that returns dictionaries."""
    fields = [column[0] for column in cursor.description]
    return dict(zip(fields, row))

# Using namedtuple factory
with sqlite3.connect("shop.db") as conn:
    conn.row_factory = namedtuple_factory
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, price FROM products")
    for product in cursor:
        print(f"{product.name}: ${product.price:.2f}")

# Using dict factory
with sqlite3.connect("shop.db") as conn:
    conn.row_factory = dict_factory
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM products WHERE id = 1")
    product = cursor.fetchone()
    print(product)
    # Output: {'id': 1, 'name': 'Widget', 'price': 19.99, 'quantity': 100, ...}
```

### Dataclass Row Factory

```python
import sqlite3
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class Product:
    id: int
    name: str
    price: float
    quantity: int
    created_at: Optional[datetime] = None

def product_factory(cursor, row):
    """Factory that returns Product dataclass instances."""
    return Product(
        id=row[0],
        name=row[1],
        price=row[2],
        quantity=row[3],
        created_at=datetime.fromisoformat(row[4]) if row[4] else None
    )

with sqlite3.connect("shop.db") as conn:
    conn.row_factory = product_factory
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, price, quantity, created_at FROM products")
    products = cursor.fetchall()

    for product in products:
        print(f"{product.name} (ID: {product.id})")
        print(f"  Price: ${product.price:.2f}")
        print(f"  In stock: {product.quantity}")
```

## Custom Functions and Aggregates

### Creating Custom SQL Functions

```python
import sqlite3
import hashlib
import math

def md5_hash(text):
    """Calculate MD5 hash of text."""
    if text is None:
        return None
    return hashlib.md5(text.encode()).hexdigest()

def distance(x1, y1, x2, y2):
    """Calculate Euclidean distance between two points."""
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def regexp(pattern, text):
    """Regular expression matching."""
    import re
    if text is None:
        return None
    return re.search(pattern, text) is not None

with sqlite3.connect("shop.db") as conn:
    # Register custom functions
    conn.create_function("md5", 1, md5_hash)
    conn.create_function("distance", 4, distance)
    conn.create_function("regexp", 2, regexp)

    cursor = conn.cursor()

    # Use MD5 function
    cursor.execute("SELECT name, md5(name) FROM products")
    for row in cursor.fetchall():
        print(f"{row[0]}: {row[1]}")

    # Use distance function
    cursor.execute("""
        SELECT distance(0, 0, 3, 4) AS dist
    """)
    print(f"Distance: {cursor.fetchone()[0]}")

    # Use regexp function
    cursor.execute("""
        SELECT name FROM products WHERE regexp('^W', name)
    """)
    print("Products starting with W:")
    for row in cursor.fetchall():
        print(f"  {row[0]}")
```

### Custom Aggregate Functions

```python
import sqlite3

class StdDev:
    """Calculate standard deviation."""

    def __init__(self):
        self.values = []

    def step(self, value):
        if value is not None:
            self.values.append(value)

    def finalize(self):
        if not self.values:
            return None
        n = len(self.values)
        mean = sum(self.values) / n
        variance = sum((x - mean) ** 2 for x in self.values) / n
        return variance ** 0.5

class Median:
    """Calculate median value."""

    def __init__(self):
        self.values = []

    def step(self, value):
        if value is not None:
            self.values.append(value)

    def finalize(self):
        if not self.values:
            return None
        sorted_values = sorted(self.values)
        n = len(sorted_values)
        mid = n // 2
        if n % 2 == 0:
            return (sorted_values[mid - 1] + sorted_values[mid]) / 2
        return sorted_values[mid]

with sqlite3.connect("shop.db") as conn:
    # Register aggregate functions
    conn.create_aggregate("stddev", 1, StdDev)
    conn.create_aggregate("median", 1, Median)

    cursor = conn.cursor()

    # Use custom aggregates
    cursor.execute("""
        SELECT
            AVG(price) AS avg_price,
            stddev(price) AS stddev_price,
            median(price) AS median_price
        FROM products
    """)

    row = cursor.fetchone()
    print(f"Average price: ${row[0]:.2f}")
    print(f"Std deviation: ${row[1]:.2f}")
    print(f"Median price: ${row[2]:.2f}")
```

### Deterministic Functions (Python 3.8+)

```python
import sqlite3

def uppercase(text):
    """Convert text to uppercase."""
    return text.upper() if text else None

with sqlite3.connect("shop.db") as conn:
    # Mark function as deterministic for optimization
    conn.create_function("upper_custom", 1, uppercase, deterministic=True)

    cursor = conn.cursor()
    cursor.execute("SELECT upper_custom(name) FROM products")
    for row in cursor.fetchall():
        print(row[0])
```

## Working with Dates and Times

SQLite stores dates as TEXT, REAL, or INTEGER. The `sqlite3` module can auto-convert with `detect_types`.

### Date/Time Handling

```python
import sqlite3
from datetime import datetime, date, time

# Enable automatic date/time conversion
conn = sqlite3.connect(
    "events.db",
    detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
)

cursor = conn.cursor()

# Create table with timestamp columns
cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        event_date DATE,
        event_time TIME,
        created_at TIMESTAMP
    )
""")

# Insert with Python datetime objects
now = datetime.now()
today = date.today()
current_time = datetime.now().time()

cursor.execute("""
    INSERT INTO events (name, event_date, event_time, created_at)
    VALUES (?, ?, ?, ?)
""", ("Conference", today, current_time, now))

conn.commit()

# Query and receive datetime objects
cursor.execute("SELECT * FROM events")
event = cursor.fetchone()

print(f"Event: {event[1]}")
print(f"Date: {event[2]} (type: {type(event[2]).__name__})")
print(f"Time: {event[3]} (type: {type(event[3]).__name__})")
print(f"Created: {event[4]} (type: {type(event[4]).__name__})")

conn.close()
```

### Custom Type Adapters

```python
import sqlite3
from datetime import datetime, timedelta
from decimal import Decimal

# Register adapters for custom types
def adapt_decimal(d):
    return str(d)

def convert_decimal(s):
    return Decimal(s.decode())

def adapt_timedelta(td):
    return td.total_seconds()

def convert_timedelta(s):
    return timedelta(seconds=float(s))

# Register the adapters and converters
sqlite3.register_adapter(Decimal, adapt_decimal)
sqlite3.register_converter("DECIMAL", convert_decimal)
sqlite3.register_adapter(timedelta, adapt_timedelta)
sqlite3.register_converter("TIMEDELTA", convert_timedelta)

# Use with detect_types
conn = sqlite3.connect(":memory:", detect_types=sqlite3.PARSE_DECLTYPES)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE prices (
        id INTEGER PRIMARY KEY,
        amount DECIMAL,
        duration TIMEDELTA
    )
""")

# Insert custom types
cursor.execute(
    "INSERT INTO prices (amount, duration) VALUES (?, ?)",
    (Decimal("99.99"), timedelta(hours=2, minutes=30))
)

conn.commit()

# Query and receive custom types
cursor.execute("SELECT * FROM prices")
row = cursor.fetchone()
print(f"Amount: {row[1]} (type: {type(row[1]).__name__})")
print(f"Duration: {row[2]} (type: {type(row[2]).__name__})")

conn.close()
```

## BLOB Handling

Binary Large Objects (BLOBs) store binary data like images, files, or serialized objects.

### Storing and Retrieving Binary Data

```python
import sqlite3
from pathlib import Path

with sqlite3.connect("files.db") as conn:
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY,
            filename TEXT NOT NULL,
            content BLOB NOT NULL,
            size INTEGER,
            mime_type TEXT
        )
    """)

    # Store a file as BLOB
    def store_file(filepath):
        path = Path(filepath)
        with open(path, "rb") as f:
            content = f.read()

        cursor.execute("""
            INSERT INTO files (filename, content, size, mime_type)
            VALUES (?, ?, ?, ?)
        """, (path.name, content, len(content), "application/octet-stream"))
        conn.commit()
        return cursor.lastrowid

    # Retrieve a file from BLOB
    def retrieve_file(file_id, output_path):
        cursor.execute("SELECT filename, content FROM files WHERE id = ?", (file_id,))
        row = cursor.fetchone()
        if row:
            with open(output_path, "wb") as f:
                f.write(row[1])
            return True
        return False

    # Example: Store and retrieve
    # file_id = store_file("document.pdf")
    # retrieve_file(file_id, "output.pdf")
```

### Storing JSON Data

```python
import sqlite3
import json

class CacheDB:
    """Simple cache using SQLite and JSON serialization."""

    def __init__(self, db_path="cache.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def set(self, key, value):
        """Store a Python object as JSON."""
        json_value = json.dumps(value)
        self.cursor.execute("""
            INSERT OR REPLACE INTO cache (key, value)
            VALUES (?, ?)
        """, (key, json_value))
        self.conn.commit()

    def get(self, key, default=None):
        """Retrieve a Python object from JSON."""
        self.cursor.execute("SELECT value FROM cache WHERE key = ?", (key,))
        row = self.cursor.fetchone()
        if row:
            return json.loads(row[0])
        return default

    def delete(self, key):
        """Delete a cached object."""
        self.cursor.execute("DELETE FROM cache WHERE key = ?", (key,))
        self.conn.commit()

    def close(self):
        self.conn.close()

# Usage
cache = CacheDB()

# Store complex objects
cache.set("user_data", {"name": "Alice", "scores": [95, 87, 92]})
cache.set("config", {"debug": True, "max_retries": 3})

# Retrieve objects
user = cache.get("user_data")
print(f"User: {user}")

config = cache.get("config")
print(f"Config: {config}")

cache.close()
```

## Backup and Export

### Database Backup

```python
import sqlite3

def backup_database(source_path, backup_path):
    """Create a backup of a SQLite database."""
    source = sqlite3.connect(source_path)
    backup = sqlite3.connect(backup_path)

    with backup:
        source.backup(backup, pages=1, progress=backup_progress)

    backup.close()
    source.close()

def backup_progress(status, remaining, total):
    """Progress callback for backup."""
    print(f"Backup progress: {total - remaining}/{total} pages")

# Usage
# backup_database("shop.db", "shop_backup.db")
```

### Export to SQL

```python
import sqlite3

def export_to_sql(db_path, output_path):
    """Export database to SQL file."""
    conn = sqlite3.connect(db_path)

    with open(output_path, "w", encoding="utf-8") as f:
        for line in conn.iterdump():
            f.write(f"{line}\n")

    conn.close()

# Usage
# export_to_sql("shop.db", "shop_dump.sql")
```

### Export to CSV

```python
import sqlite3
import csv

def export_table_to_csv(db_path, table_name, output_path):
    """Export a table to CSV file."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(f"SELECT * FROM {table_name}")
    columns = [description[0] for description in cursor.description]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(cursor.fetchall())

    conn.close()

# Usage
# export_table_to_csv("shop.db", "products", "products.csv")
```

### Import from CSV

```python
import sqlite3
import csv

def import_csv_to_table(db_path, csv_path, table_name):
    """Import CSV file to a table."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        columns = next(reader)

        # Create table
        columns_def = ", ".join(f"{col} TEXT" for col in columns)
        cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_name} ({columns_def})")

        # Insert data
        placeholders = ", ".join("?" for _ in columns)
        cursor.executemany(
            f"INSERT INTO {table_name} VALUES ({placeholders})",
            reader
        )

    conn.commit()
    conn.close()

# Usage
# import_csv_to_table("shop.db", "new_products.csv", "imported_products")
```

## Database Schema Information

### Querying Schema

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # List all tables
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
    """)
    tables = cursor.fetchall()
    print("Tables:")
    for table in tables:
        print(f"  {table[0]}")

    # Get table schema
    cursor.execute("PRAGMA table_info(products)")
    columns = cursor.fetchall()
    print("\nProducts table schema:")
    for col in columns:
        print(f"  {col[1]}: {col[2]} (nullable: {not col[3]}, pk: {col[5]})")

    # Get indexes
    cursor.execute("PRAGMA index_list(products)")
    indexes = cursor.fetchall()
    print("\nIndexes on products:")
    for idx in indexes:
        print(f"  {idx[1]} (unique: {idx[2]})")

    # Get foreign keys
    cursor.execute("PRAGMA foreign_key_list(orders)")
    fks = cursor.fetchall()
    print("\nForeign keys on orders:")
    for fk in fks:
        print(f"  {fk[3]} -> {fk[2]}.{fk[4]}")
```

### Database Statistics

```python
import sqlite3
from pathlib import Path

def get_database_stats(db_path):
    """Get statistics about a SQLite database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    stats = {}

    # File size
    stats["file_size"] = Path(db_path).stat().st_size

    # Page info
    cursor.execute("PRAGMA page_count")
    stats["page_count"] = cursor.fetchone()[0]

    cursor.execute("PRAGMA page_size")
    stats["page_size"] = cursor.fetchone()[0]

    # Table counts
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    stats["tables"] = {}

    for (table_name,) in tables:
        if not table_name.startswith("sqlite_"):
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            stats["tables"][table_name] = cursor.fetchone()[0]

    conn.close()
    return stats

# Usage
stats = get_database_stats("shop.db")
print(f"Database size: {stats['file_size'] / 1024:.2f} KB")
print(f"Total pages: {stats['page_count']}")
print("Table row counts:")
for table, count in stats["tables"].items():
    print(f"  {table}: {count} rows")
```

## Indexes and Performance

### Creating Indexes

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Simple index
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_products_name
        ON products (name)
    """)

    # Unique index
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku
        ON products (sku)
    """)

    # Composite index
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_orders_date_status
        ON orders (order_date DESC, status)
    """)

    # Partial index
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_products_active
        ON products (name) WHERE quantity > 0
    """)

    conn.commit()
```

### Query Optimization

```python
import sqlite3

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # Enable query plan output
    cursor.execute("EXPLAIN QUERY PLAN SELECT * FROM products WHERE name = 'Widget'")
    plan = cursor.fetchall()
    print("Query plan:")
    for step in plan:
        print(f"  {step}")

    # Analyze tables for better query planning
    cursor.execute("ANALYZE")

    # Check index usage
    cursor.execute("PRAGMA index_list(products)")
    indexes = cursor.fetchall()
    print("\nIndexes:")
    for idx in indexes:
        print(f"  {idx[1]}")

    # Get query statistics
    cursor.execute("PRAGMA stats")
    stats = cursor.fetchall()
    print("\nDatabase stats:")
    for stat in stats:
        print(f"  {stat}")
```

### Performance Best Practices

```python
import sqlite3
import time

with sqlite3.connect("shop.db") as conn:
    cursor = conn.cursor()

    # 1. Use transactions for bulk inserts
    start = time.time()
    cursor.execute("BEGIN TRANSACTION")
    for i in range(1000):
        cursor.execute(
            "INSERT INTO products (name, price) VALUES (?, ?)",
            (f"Product {i}", i * 0.99)
        )
    cursor.execute("COMMIT")
    print(f"Bulk insert with transaction: {time.time() - start:.3f}s")

    # 2. Use executemany for multiple inserts
    products = [(f"Batch Product {i}", i * 1.99) for i in range(1000)]
    start = time.time()
    cursor.executemany(
        "INSERT INTO products (name, price) VALUES (?, ?)",
        products
    )
    conn.commit()
    print(f"executemany insert: {time.time() - start:.3f}s")

    # 3. Use PRAGMA for performance tuning
    cursor.execute("PRAGMA journal_mode = WAL")  # Write-Ahead Logging
    cursor.execute("PRAGMA synchronous = NORMAL")  # Balance safety/speed
    cursor.execute("PRAGMA cache_size = -64000")  # 64MB cache
    cursor.execute("PRAGMA temp_store = MEMORY")  # Store temp tables in memory

    # 4. Avoid SELECT * when not needed
    # Bad: cursor.execute("SELECT * FROM products")
    # Good: cursor.execute("SELECT id, name FROM products")

    # 5. Use LIMIT for large result sets
    cursor.execute("SELECT * FROM products ORDER BY price DESC LIMIT 10")
```

## Thread Safety and Connection Pooling

### Thread-Safe Operations

```python
import sqlite3
import threading
from queue import Queue

class ThreadSafeDB:
    """Thread-safe SQLite database wrapper."""

    def __init__(self, db_path, max_connections=5):
        self.db_path = db_path
        self.pool = Queue(maxsize=max_connections)
        self.local = threading.local()

        # Pre-create connections
        for _ in range(max_connections):
            conn = sqlite3.connect(db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            self.pool.put(conn)

    def get_connection(self):
        """Get a connection from the pool."""
        return self.pool.get()

    def return_connection(self, conn):
        """Return a connection to the pool."""
        self.pool.put(conn)

    def execute(self, query, params=None):
        """Execute a query with automatic connection management."""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor.fetchall()
        finally:
            self.return_connection(conn)

    def close_all(self):
        """Close all connections in the pool."""
        while not self.pool.empty():
            conn = self.pool.get()
            conn.close()

# Usage with multiple threads
db = ThreadSafeDB("shop.db")

def worker(thread_id):
    results = db.execute(
        "SELECT * FROM products WHERE id = ?",
        (thread_id,)
    )
    print(f"Thread {thread_id}: {len(results)} results")

threads = []
for i in range(10):
    t = threading.Thread(target=worker, args=(i + 1,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

db.close_all()
```

### Using Thread-Local Connections

```python
import sqlite3
import threading

class LocalConnectionDB:
    """Database with thread-local connections."""

    def __init__(self, db_path):
        self.db_path = db_path
        self.local = threading.local()

    def get_connection(self):
        """Get or create a thread-local connection."""
        if not hasattr(self.local, "connection"):
            self.local.connection = sqlite3.connect(self.db_path)
            self.local.connection.row_factory = sqlite3.Row
        return self.local.connection

    def execute(self, query, params=None):
        """Execute a query on the thread-local connection."""
        conn = self.get_connection()
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        return cursor.fetchall()

# Usage
db = LocalConnectionDB("shop.db")

def process_data(item_id):
    result = db.execute(
        "SELECT * FROM products WHERE id = ?",
        (item_id,)
    )
    return result

# Each thread gets its own connection
```

## Error Handling

### Common Exceptions

```python
import sqlite3

def demonstrate_exceptions():
    """Demonstrate common SQLite exceptions."""

    try:
        # IntegrityError - constraint violation
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT UNIQUE)")
        cursor.execute("INSERT INTO test VALUES (1, 'hello')")
        cursor.execute("INSERT INTO test VALUES (2, 'hello')")  # Duplicate!
    except sqlite3.IntegrityError as e:
        print(f"IntegrityError: {e}")

    try:
        # OperationalError - database error
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM nonexistent_table")
    except sqlite3.OperationalError as e:
        print(f"OperationalError: {e}")

    try:
        # ProgrammingError - interface error
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM test WHERE id = ?")  # Missing parameter
    except sqlite3.ProgrammingError as e:
        print(f"ProgrammingError: {e}")

    try:
        # DatabaseError - corrupted database
        # This would happen with a corrupted file
        pass
    except sqlite3.DatabaseError as e:
        print(f"DatabaseError: {e}")

demonstrate_exceptions()
```

### Robust Database Operations

```python
import sqlite3
from contextlib import contextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    """Custom database exception."""
    pass

class Database:
    """Robust database wrapper with error handling."""

    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        """Establish database connection."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            # Enable foreign keys
            self.conn.execute("PRAGMA foreign_keys = ON")
            logger.info(f"Connected to {self.db_path}")
        except sqlite3.Error as e:
            logger.error(f"Connection failed: {e}")
            raise DatabaseError(f"Failed to connect to database: {e}")

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Connection closed")

    @contextmanager
    def transaction(self):
        """Transaction context manager with automatic rollback."""
        cursor = self.conn.cursor()
        try:
            yield cursor
            self.conn.commit()
            logger.debug("Transaction committed")
        except sqlite3.IntegrityError as e:
            self.conn.rollback()
            logger.warning(f"Integrity error, rolled back: {e}")
            raise DatabaseError(f"Data integrity error: {e}")
        except sqlite3.OperationalError as e:
            self.conn.rollback()
            logger.error(f"Operational error, rolled back: {e}")
            raise DatabaseError(f"Database operation failed: {e}")
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Unexpected error, rolled back: {e}")
            raise

    def execute_safe(self, query, params=None):
        """Execute a query with error handling."""
        try:
            cursor = self.conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor
        except sqlite3.Error as e:
            logger.error(f"Query failed: {query[:50]}... Error: {e}")
            raise DatabaseError(f"Query execution failed: {e}")

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False

# Usage
with Database("shop.db") as db:
    with db.transaction() as cursor:
        cursor.execute(
            "INSERT INTO products (name, price) VALUES (?, ?)",
            ("New Product", 29.99)
        )
```

## Complete Application Example

### Product Inventory System

```python
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from contextlib import contextmanager

@dataclass
class Product:
    id: Optional[int]
    name: str
    sku: str
    price: float
    quantity: int
    category: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class InventoryDB:
    """Product inventory database manager."""

    def __init__(self, db_path: str = "inventory.db"):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        """Initialize database connection and schema."""
        self.conn = sqlite3.connect(
            self.db_path,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
        )
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        """Create database schema."""
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                sku TEXT NOT NULL UNIQUE,
                price REAL NOT NULL CHECK(price >= 0),
                quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
                category_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            );

            CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

            CREATE TRIGGER IF NOT EXISTS update_products_timestamp
            AFTER UPDATE ON products
            BEGIN
                UPDATE products SET updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
            END;
        """)
        self.conn.commit()

    @contextmanager
    def transaction(self):
        """Transaction context manager."""
        try:
            yield self.conn.cursor()
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise

    def add_category(self, name: str) -> int:
        """Add a new category."""
        with self.transaction() as cursor:
            cursor.execute(
                "INSERT OR IGNORE INTO categories (name) VALUES (?)",
                (name,)
            )
            cursor.execute("SELECT id FROM categories WHERE name = ?", (name,))
            return cursor.fetchone()[0]

    def add_product(self, product: Product) -> int:
        """Add a new product."""
        category_id = self.add_category(product.category)

        with self.transaction() as cursor:
            cursor.execute("""
                INSERT INTO products (name, sku, price, quantity, category_id)
                VALUES (?, ?, ?, ?, ?)
            """, (product.name, product.sku, product.price,
                  product.quantity, category_id))
            return cursor.lastrowid

    def get_product(self, product_id: int) -> Optional[Product]:
        """Get a product by ID."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT p.*, c.name as category
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        """, (product_id,))
        row = cursor.fetchone()

        if row:
            return Product(
                id=row["id"],
                name=row["name"],
                sku=row["sku"],
                price=row["price"],
                quantity=row["quantity"],
                category=row["category"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
        return None

    def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """Get a product by SKU."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT p.*, c.name as category
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.sku = ?
        """, (sku,))
        row = cursor.fetchone()

        if row:
            return Product(
                id=row["id"],
                name=row["name"],
                sku=row["sku"],
                price=row["price"],
                quantity=row["quantity"],
                category=row["category"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
        return None

    def update_quantity(self, product_id: int, quantity_change: int) -> bool:
        """Update product quantity (positive or negative)."""
        with self.transaction() as cursor:
            cursor.execute("""
                UPDATE products
                SET quantity = quantity + ?
                WHERE id = ? AND quantity + ? >= 0
            """, (quantity_change, product_id, quantity_change))
            return cursor.rowcount > 0

    def search_products(
        self,
        query: str = "",
        category: str = "",
        min_price: float = 0,
        max_price: float = float("inf"),
        in_stock_only: bool = False
    ) -> List[Product]:
        """Search products with filters."""
        sql = """
            SELECT p.*, c.name as category
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        """
        params = []

        if query:
            sql += " AND (p.name LIKE ? OR p.sku LIKE ?)"
            params.extend([f"%{query}%", f"%{query}%"])

        if category:
            sql += " AND c.name = ?"
            params.append(category)

        sql += " AND p.price BETWEEN ? AND ?"
        params.extend([min_price, max_price if max_price != float("inf") else 999999999])

        if in_stock_only:
            sql += " AND p.quantity > 0"

        sql += " ORDER BY p.name"

        cursor = self.conn.cursor()
        cursor.execute(sql, params)

        return [
            Product(
                id=row["id"],
                name=row["name"],
                sku=row["sku"],
                price=row["price"],
                quantity=row["quantity"],
                category=row["category"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in cursor.fetchall()
        ]

    def get_low_stock_products(self, threshold: int = 10) -> List[Product]:
        """Get products with low stock."""
        return self.search_products(in_stock_only=False)

    def get_inventory_report(self) -> dict:
        """Generate inventory report."""
        cursor = self.conn.cursor()

        # Total products and value
        cursor.execute("""
            SELECT
                COUNT(*) as total_products,
                SUM(quantity) as total_units,
                SUM(price * quantity) as total_value
            FROM products
        """)
        totals = cursor.fetchone()

        # By category
        cursor.execute("""
            SELECT
                c.name,
                COUNT(p.id) as product_count,
                SUM(p.quantity) as total_units,
                SUM(p.price * p.quantity) as total_value
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
        """)
        by_category = cursor.fetchall()

        return {
            "total_products": totals["total_products"],
            "total_units": totals["total_units"] or 0,
            "total_value": totals["total_value"] or 0,
            "by_category": [dict(row) for row in by_category]
        }

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# Example usage
if __name__ == "__main__":
    with InventoryDB("inventory.db") as db:
        # Add products
        products = [
            Product(None, "Wireless Mouse", "WM-001", 29.99, 100, "Electronics"),
            Product(None, "USB Keyboard", "KB-001", 49.99, 75, "Electronics"),
            Product(None, "Desk Lamp", "DL-001", 34.99, 50, "Furniture"),
            Product(None, "Notebook", "NB-001", 4.99, 200, "Office Supplies"),
        ]

        for product in products:
            try:
                product_id = db.add_product(product)
                print(f"Added product: {product.name} (ID: {product_id})")
            except sqlite3.IntegrityError:
                print(f"Product {product.sku} already exists")

        # Search products
        print("\nElectronics products:")
        electronics = db.search_products(category="Electronics")
        for p in electronics:
            print(f"  {p.name}: ${p.price:.2f} ({p.quantity} in stock)")

        # Update quantity
        product = db.get_product_by_sku("WM-001")
        if product:
            db.update_quantity(product.id, -5)  # Sell 5 units
            updated = db.get_product(product.id)
            print(f"\nUpdated {updated.name} quantity: {updated.quantity}")

        # Generate report
        print("\nInventory Report:")
        report = db.get_inventory_report()
        print(f"  Total Products: {report['total_products']}")
        print(f"  Total Units: {report['total_units']}")
        print(f"  Total Value: ${report['total_value']:.2f}")
        print("  By Category:")
        for cat in report["by_category"]:
            print(f"    {cat['name']}: {cat['product_count']} products, ${cat['total_value'] or 0:.2f}")
```

## Summary

Python's `sqlite3` module provides a complete interface for working with SQLite databases:

| Feature | Description |
|---------|-------------|
| `connect()` | Create database connection |
| `cursor()` | Create cursor for SQL execution |
| `execute()` | Run single SQL statement |
| `executemany()` | Run SQL with multiple parameter sets |
| `fetchone/all/many()` | Retrieve query results |
| `commit()` | Save changes to database |
| `rollback()` | Undo uncommitted changes |
| `row_factory` | Customize result row format |
| `create_function()` | Register custom SQL functions |
| `create_aggregate()` | Register custom aggregate functions |

Key best practices:

- **Always use parameterized queries** to prevent SQL injection
- **Use context managers** for automatic resource cleanup
- **Enable foreign keys** with `PRAGMA foreign_keys = ON`
- **Use transactions** for data integrity in multi-statement operations
- **Create indexes** on frequently queried columns
- **Use `executemany()`** for bulk inserts
- **Set appropriate PRAGMAs** for performance tuning

## Further Reading

- [Python sqlite3 Documentation](https://docs.python.org/3/library/sqlite3.html)
- [SQLite Official Documentation](https://www.sqlite.org/docs.html)
- [DB-API 2.0 Specification (PEP 249)](https://peps.python.org/pep-0249/)
- [SQLite Query Language](https://www.sqlite.org/lang.html)
- [SQLite Performance Tips](https://www.sqlite.org/np1queryprob.html)
