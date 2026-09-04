---
title: CSV File Handling
description: Complete guide to Python's csv module, covering read/write operations, DictReader/DictWriter, dialect configuration, and advanced techniques
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - CSV
  - Data Processing
  - File Operations
  - Data Import/Export
status: imported
origin: old/src/content/docs/python/csv.en.md
divergence: 0.213
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 28
  lastUpdated: 2026-01-07
---

CSV (Comma-Separated Values) is a simple and widely used data exchange format. Python's built-in `csv` module provides powerful and flexible CSV file handling capabilities. This article comprehensively covers CSV read/write operations, dictionary interfaces, dialect configuration, quoting strategies, and various advanced techniques.

## Concept Overview

### What is CSV

CSV is a plain text format used to store tabular data. Its characteristics include:

- Each row represents a record
- Fields are separated by delimiters (usually commas)
- Optional header row defines field names
- Supports quoting fields containing special characters
- Cross-platform compatible, supported by almost all spreadsheet software

### CSV Format Example

```csv
Name,Age,City,Salary
John,28,Beijing,15000
Jane,32,Shanghai,20000
"Bob,Jr",25,"Shenzhen,Guangdong",18000
```

### Why Use the csv Module

Although the CSV format appears simple, manual parsing has many pitfalls:

- Fields may contain commas, newlines, and other special characters
- Quote escaping needs to be handled
- Different systems use different line terminators
- Encoding issues

The `csv` module automatically handles these complex situations, providing reliable read/write functionality.

## Core Principles

### csv Module Architecture

```
csv module
├── reader       # Basic reader, returns lists
├── writer       # Basic writer, writes lists
├── DictReader   # Dictionary reader, returns dicts
├── DictWriter   # Dictionary writer, writes dicts
├── Dialect      # Dialect base class, defines format parameters
├── excel        # Excel dialect (default)
├── excel_tab    # Tab-separated dialect
└── unix_dialect # Unix-style dialect
```

### Read/Write Flow

```
Read flow:
File → open() → csv.reader/DictReader → iterate rows → process data

Write flow:
Data → csv.writer/DictWriter → writerow/writerows → File
```

## Key Points

### Basic Read/Write Points

| Function | Method | Return/Input Type |
|----------|--------|-------------------|
| Read one row | `next(reader)` | `list` |
| Read all rows | `list(reader)` | `list[list]` |
| Write one row | `writer.writerow(row)` | `list` |
| Write multiple rows | `writer.writerows(rows)` | `list[list]` |

### Dictionary Interface Points

| Function | Method | Return/Input Type |
|----------|--------|-------------------|
| Dictionary read | `DictReader` | `dict` |
| Dictionary write | `DictWriter` | `dict` |
| Get field names | `reader.fieldnames` | `list` |
| Write header | `writer.writeheader()` | - |

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `delimiter` | Field separator | `,` |
| `quotechar` | Quote character | `"` |
| `quoting` | Quoting strategy | `QUOTE_MINIMAL` |
| `lineterminator` | Line terminator | `\r\n` |
| `escapechar` | Escape character | `None` |

## Code Examples

### Basic Read Operation

```python
import csv

# Read CSV file
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)

    # Get header
    header = next(reader)
    print(f"Columns: {header}")

    # Iterate data rows
    for row in reader:
        print(row)
```

### Basic Write Operation

```python
import csv

# Prepare data
header = ["Name", "Age", "City"]
data = [
    ["John", 28, "Beijing"],
    ["Jane", 32, "Shanghai"],
    ["Bob", 25, "Shenzhen"]
]

# Write CSV file
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)  # Write header
    writer.writerows(data)   # Write all data rows
```

**Note**: Use `newline=""` parameter when opening files on Windows to avoid extra blank lines.

### Reading with DictReader

`DictReader` returns each row as a dictionary, with header field names as keys:

```python
import csv

# Example CSV content:
# Name,Age,City,Salary
# John,28,Beijing,15000
# Jane,32,Shanghai,20000

with open("employees.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    # Get field names
    print(f"Fields: {reader.fieldnames}")

    # Iterate data
    for row in reader:
        print(f"{row['Name']} works in {row['City']}, monthly salary {row['Salary']}")
```

Output:
```
Fields: ['Name', 'Age', 'City', 'Salary']
John works in Beijing, monthly salary 15000
Jane works in Shanghai, monthly salary 20000
```

### Writing with DictWriter

```python
import csv

# Prepare dictionary data
employees = [
    {"Name": "John", "Age": 28, "City": "Beijing", "Salary": 15000},
    {"Name": "Jane", "Age": 32, "City": "Shanghai", "Salary": 20000},
    {"Name": "Bob", "Age": 25, "City": "Shenzhen", "Salary": 18000}
]

# Define field order
fieldnames = ["Name", "Age", "City", "Salary"]

with open("employees.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()  # Write header
    writer.writerows(employees)  # Write all data
```

### Custom Delimiters

Handle TSV (Tab-separated) or other delimiter formats:

```python
import csv

# Read TSV file
with open("data.tsv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter="\t")
    for row in reader:
        print(row)

# Write semicolon-separated file
with open("data_semicolon.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, delimiter=";")
    writer.writerow(["Name", "Age", "City"])
    writer.writerow(["John", 28, "Beijing"])
```

### Using Dialects

A dialect is a set of predefined format parameters:

```python
import csv

# View available dialects
print(csv.list_dialects())  # ['excel', 'excel-tab', 'unix']

# Use Excel Tab dialect
with open("data.tsv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, dialect="excel-tab")
    for row in reader:
        print(row)

# Use Unix dialect (LF line terminator, minimal quoting)
with open("data_unix.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, dialect="unix")
    writer.writerow(["Name", "Age", "City"])
```

### Custom Dialects

```python
import csv

# Register custom dialect
csv.register_dialect(
    "custom",
    delimiter="|",
    quotechar="'",
    quoting=csv.QUOTE_MINIMAL,
    lineterminator="\n"
)

# Use custom dialect
with open("data_custom.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, dialect="custom")
    writer.writerow(["Name", "Age", "City"])
    writer.writerow(["John", 28, "Beijing"])

# Read using the same dialect
with open("data_custom.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, dialect="custom")
    for row in reader:
        print(row)

# Unregister dialect when done
csv.unregister_dialect("custom")
```

### Quoting Options

```python
import csv

data = [
    ["Name", "Description", "Amount"],
    ["John", "This is a description,with comma", 1000],
    ["Jane", 'He said:"Hello"', 2000]
]

# QUOTE_MINIMAL: Quote only when necessary (default)
with open("quote_minimal.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerows(data)
# Output: Name,Description,Amount
#         John,"This is a description,with comma",1000
#         Jane,"He said:""Hello""",2000

# QUOTE_ALL: Quote all fields
with open("quote_all.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerows(data)
# Output: "Name","Description","Amount"
#         "John","This is a description,with comma","1000"

# QUOTE_NONNUMERIC: Quote non-numeric fields
with open("quote_nonnumeric.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_NONNUMERIC)
    writer.writerows(data)
# Output: "Name","Description","Amount"
#         "John","This is a description,with comma",1000

# QUOTE_NONE: Never quote (requires escapechar)
with open("quote_none.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_NONE, escapechar="\\")
    writer.writerow(["Name", "City"])
    writer.writerow(["John", "Beijing"])
```

### Handling Files with BOM

Some programs (like Excel) create UTF-8 files with BOM (Byte Order Mark):

```python
import csv

# Read file with BOM
with open("data_with_bom.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)

# Write file with BOM (Excel compatible)
with open("excel_compatible.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Age", "City"])
    writer.writerow(["John", 28, "Beijing"])
```

### Reading CSV from String

```python
import csv
from io import StringIO

csv_string = """Name,Age,City
John,28,Beijing
Jane,32,Shanghai"""

# Use StringIO to wrap string
reader = csv.reader(StringIO(csv_string))
for row in reader:
    print(row)
```

### Skipping Specific Rows

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)

    # Skip first two rows (e.g., comment lines)
    next(reader)
    next(reader)

    # Third row as header
    header = next(reader)

    for row in reader:
        print(row)
```

### Handling Missing Fields

```python
import csv

# DictReader handling missing fields
with open("incomplete.csv", "r", encoding="utf-8") as f:
    # restkey: key name for extra fields
    # restval: default value for missing fields
    reader = csv.DictReader(f, restkey="extra", restval="N/A")
    for row in reader:
        print(row)

# DictWriter handling missing fields
fieldnames = ["Name", "Age", "City", "Email"]
data = [
    {"Name": "John", "Age": 28},  # Missing City and Email
    {"Name": "Jane", "Age": 32, "City": "Shanghai"}  # Missing Email
]

with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, restval="Unknown")
    writer.writeheader()
    writer.writerows(data)
```

### Writing Only Partial Fields

```python
import csv

data = [
    {"Name": "John", "Age": 28, "City": "Beijing", "InternalID": 1001},
    {"Name": "Jane", "Age": 32, "City": "Shanghai", "InternalID": 1002}
]

# Export only selected fields
export_fields = ["Name", "City"]

with open("partial.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=export_fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(data)
```

### Data Type Conversion

```python
import csv
from datetime import datetime
from decimal import Decimal

def convert_row(row: dict) -> dict:
    """Convert row data types"""
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "salary": Decimal(row["salary"]),
        "join_date": datetime.strptime(row["join_date"], "%Y-%m-%d"),
        "is_active": row["is_active"].lower() == "true"
    }

with open("employees.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    employees = [convert_row(row) for row in reader]

    for emp in employees:
        print(f"{emp['name']}: {emp['salary']}, joined: {emp['join_date'].date()}")
```

## Best Practices

### Always Use Context Managers

```python
import csv

# Recommended
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    data = list(reader)

# Not recommended
f = open("data.csv", "r")
reader = csv.reader(f)
data = list(reader)
f.close()  # Easy to forget
```

### Always Specify Encoding

```python
import csv

# Always specify encoding to avoid platform differences
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    ...

# Handle other encodings
with open("gbk_data.csv", "r", encoding="gbk") as f:
    reader = csv.reader(f)
    ...
```

### Use newline="" on Windows

```python
import csv

# Must use newline="" when writing on Windows
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b", "c"])
```

### Use DictReader/DictWriter for Readability

```python
import csv

# Using field names makes code clearer
with open("employees.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Clear field access
        print(f"{row['Name']}: {row['Salary']}")

        # Instead of
        # print(f"{row[0]}: {row[3]}")
```

### Stream Processing for Large Files

```python
import csv

def process_large_csv(filepath: str):
    """Stream process large CSV files"""
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Process row by row, don't load everything into memory
            process_row(row)

def process_row(row: dict):
    # Process single row
    pass
```

### Encapsulate Common Operations

```python
import csv
from pathlib import Path
from typing import Iterator

def read_csv(
    filepath: str | Path,
    encoding: str = "utf-8",
    as_dict: bool = True
) -> Iterator[dict | list]:
    """Generic CSV read function"""
    with open(filepath, "r", encoding=encoding) as f:
        if as_dict:
            reader = csv.DictReader(f)
        else:
            reader = csv.reader(f)
        yield from reader

def write_csv(
    filepath: str | Path,
    data: list[dict] | list[list],
    fieldnames: list[str] | None = None,
    encoding: str = "utf-8"
) -> None:
    """Generic CSV write function"""
    with open(filepath, "w", encoding=encoding, newline="") as f:
        if data and isinstance(data[0], dict):
            fieldnames = fieldnames or list(data[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        else:
            writer = csv.writer(f)
            if fieldnames:
                writer.writerow(fieldnames)
            writer.writerows(data)

# Usage example
employees = list(read_csv("employees.csv"))
write_csv("output.csv", employees)
```

## Common Pitfalls

### Forgetting newline=""

```python
import csv

# Wrong: produces extra blank lines on Windows
with open("output.csv", "w", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b"])
    writer.writerow(["c", "d"])

# Correct
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b"])
    writer.writerow(["c", "d"])
```

### Reader Can Only Iterate Once

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)

    # First iteration
    for row in reader:
        print(row)

    # Second iteration: nothing will be output!
    for row in reader:
        print(row)  # Won't execute

# Solution: convert to list
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    data = list(reader)  # Convert to list

    # Can iterate multiple times
    for row in data:
        print(row)
```

### Confusing reader and DictReader

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)  # Returns lists

    for row in reader:
        # Wrong: reader returns lists, not dicts
        # print(row["name"])  # TypeError
        print(row[0])  # Correct

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)  # Returns dicts

    for row in reader:
        print(row["name"])  # Correct
```

### Modifying DictReader Row Data

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        # Note: modifying row doesn't affect the source file
        row["new_field"] = "value"  # Only modifies the dictionary in memory
```

### Field Order Issues

```python
import csv

# DictWriter requires fieldnames
data = [{"b": 2, "a": 1, "c": 3}]

# Dictionary key order may be uncertain without specifying fieldnames (ordered in Python 3.7+)
# Best to specify explicitly for consistency
fieldnames = ["a", "b", "c"]

with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)
```

### Handling Fields with Newlines

```python
import csv

# csv module automatically handles newlines within fields
data = [
    ["Title", "Content"],
    ["Article1", "This is line one\nThis is line two\nThis is line three"]
]

with open("multiline.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(data)

# Reading also handles this correctly
with open("multiline.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)
```

### Numeric Precision Loss

```python
import csv
from decimal import Decimal

# Problem: floating point precision
data = [["Amount"], [0.1 + 0.2]]  # Actually 0.30000000000000004

# Solution: use Decimal or strings
data = [["Amount"], [str(Decimal("0.1") + Decimal("0.2"))]]
```

## Performance Considerations

### Benchmark Comparison

```python
import csv
import time
from io import StringIO

def benchmark_csv_operations():
    """CSV operations performance benchmark"""

    # Prepare test data
    rows = 100000
    data = [["id", "name", "value"]]
    data.extend([[i, f"item_{i}", i * 1.5] for i in range(rows)])

    # Test write performance
    start = time.perf_counter()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerows(data)
    write_time = time.perf_counter() - start
    print(f"Writing {rows} rows: {write_time:.3f} seconds")

    # Test read performance
    csv_content = output.getvalue()
    start = time.perf_counter()
    reader = csv.reader(StringIO(csv_content))
    _ = list(reader)
    read_time = time.perf_counter() - start
    print(f"Reading {rows} rows: {read_time:.3f} seconds")

    # Test DictReader performance
    start = time.perf_counter()
    reader = csv.DictReader(StringIO(csv_content))
    _ = list(reader)
    dict_read_time = time.perf_counter() - start
    print(f"DictReader reading: {dict_read_time:.3f} seconds")

benchmark_csv_operations()
```

### Large File Processing Strategies

```python
import csv
from typing import Iterator, Generator

def read_csv_chunks(
    filepath: str,
    chunk_size: int = 10000
) -> Generator[list[dict], None, None]:
    """Read large CSV files in chunks"""
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        chunk = []

        for row in reader:
            chunk.append(row)
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []

        if chunk:  # Process last batch
            yield chunk

# Usage example
for chunk in read_csv_chunks("large_file.csv", chunk_size=5000):
    process_chunk(chunk)
```

### Using Generators to Save Memory

```python
import csv
from typing import Iterator

def filter_csv(
    filepath: str,
    condition: callable
) -> Iterator[dict]:
    """Filter CSV data using generators"""
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if condition(row):
                yield row

# Usage example: filter employees with salary > 10000
high_salary = filter_csv(
    "employees.csv",
    lambda row: int(row["Salary"]) > 10000
)

for emp in high_salary:
    print(emp["Name"])
```

### Parallel Processing of Large Files

```python
import csv
from concurrent.futures import ProcessPoolExecutor
from typing import Callable
import os

def process_chunk(args: tuple) -> list:
    """Process data chunk"""
    filepath, start_line, num_lines, processor = args
    results = []

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # Skip to starting line
        for _ in range(start_line):
            next(reader, None)

        # Process specified number of lines
        for i, row in enumerate(reader):
            if i >= num_lines:
                break
            results.append(processor(row))

    return results

def parallel_csv_process(
    filepath: str,
    processor: Callable,
    num_workers: int = None,
    chunk_size: int = 10000
) -> list:
    """Process CSV file in parallel"""
    # Count lines
    with open(filepath, "r", encoding="utf-8") as f:
        total_lines = sum(1 for _ in f) - 1  # Subtract header

    num_workers = num_workers or os.cpu_count()

    # Create tasks
    tasks = []
    for start in range(0, total_lines, chunk_size):
        num_lines = min(chunk_size, total_lines - start)
        tasks.append((filepath, start, num_lines, processor))

    # Execute in parallel
    results = []
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        for chunk_results in executor.map(process_chunk, tasks):
            results.extend(chunk_results)

    return results
```

### Comparing with Pandas Performance

For large data processing, Pandas is usually more efficient:

```python
import csv
import time
import pandas as pd

# Prepare test file
# ... assume a large CSV file exists

# csv module reading
start = time.perf_counter()
with open("large.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    data = list(reader)
csv_time = time.perf_counter() - start

# Pandas reading
start = time.perf_counter()
df = pd.read_csv("large.csv")
pandas_time = time.perf_counter() - start

print(f"csv module: {csv_time:.3f} seconds")
print(f"Pandas: {pandas_time:.3f} seconds")
```

## Real-World Scenarios

### Scenario 1: Data Export Report

```python
import csv
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List

@dataclass
class SalesRecord:
    order_id: str
    product: str
    quantity: int
    unit_price: float
    total: float
    sale_date: str

def export_sales_report(
    records: List[SalesRecord],
    filepath: str
) -> None:
    """Export sales report as CSV"""

    fieldnames = [
        "Order ID", "Product", "Quantity", "Unit Price", "Total", "Sale Date"
    ]

    field_mapping = {
        "order_id": "Order ID",
        "product": "Product",
        "quantity": "Quantity",
        "unit_price": "Unit Price",
        "total": "Total",
        "sale_date": "Sale Date"
    }

    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for record in records:
            row = {
                field_mapping[k]: v
                for k, v in asdict(record).items()
            }
            writer.writerow(row)

    print(f"Exported {len(records)} records to {filepath}")

# Usage example
records = [
    SalesRecord("ORD001", "Laptop", 2, 5999.00, 11998.00, "2026-01-07"),
    SalesRecord("ORD002", "Wireless Mouse", 5, 99.00, 495.00, "2026-01-07"),
]

export_sales_report(records, "sales_report.csv")
```

### Scenario 2: Configuration Data Import

```python
import csv
from typing import Dict, Any, List
from pathlib import Path

class ConfigImporter:
    """Configuration data importer"""

    def __init__(self, config_dir: str):
        self.config_dir = Path(config_dir)

    def import_products(self) -> List[Dict[str, Any]]:
        """Import product configuration"""
        filepath = self.config_dir / "products.csv"
        products = []

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                product = {
                    "id": int(row["id"]),
                    "name": row["name"],
                    "category": row["category"],
                    "price": float(row["price"]),
                    "stock": int(row["stock"]),
                    "is_active": row["is_active"].lower() == "true"
                }
                products.append(product)

        return products

    def import_users(self) -> List[Dict[str, Any]]:
        """Import user configuration"""
        filepath = self.config_dir / "users.csv"
        users = []

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                user = {
                    "id": int(row["id"]),
                    "username": row["username"],
                    "email": row["email"],
                    "roles": row["roles"].split("|") if row["roles"] else []
                }
                users.append(user)

        return users

# Usage example
importer = ConfigImporter("./config")
products = importer.import_products()
users = importer.import_users()
```

### Scenario 3: Log Analysis

```python
import csv
from collections import Counter, defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

def analyze_access_log(filepath: str) -> Dict[str, Any]:
    """Analyze access log CSV"""

    stats = {
        "total_requests": 0,
        "status_codes": Counter(),
        "top_paths": Counter(),
        "hourly_traffic": defaultdict(int),
        "error_requests": []
    }

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            stats["total_requests"] += 1

            # Count status codes
            status = int(row["status"])
            stats["status_codes"][status] += 1

            # Count paths
            stats["top_paths"][row["path"]] += 1

            # Count hourly traffic
            timestamp = datetime.fromisoformat(row["timestamp"])
            hour = timestamp.strftime("%Y-%m-%d %H:00")
            stats["hourly_traffic"][hour] += 1

            # Collect error requests
            if status >= 400:
                stats["error_requests"].append({
                    "timestamp": row["timestamp"],
                    "path": row["path"],
                    "status": status,
                    "message": row.get("message", "")
                })

    # Convert Counter to dict and sort
    stats["top_paths"] = dict(stats["top_paths"].most_common(10))
    stats["status_codes"] = dict(stats["status_codes"])
    stats["hourly_traffic"] = dict(stats["hourly_traffic"])

    return stats

def export_analysis_report(stats: Dict, output_path: str) -> None:
    """Export analysis report"""

    # Export error request details
    if stats["error_requests"]:
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            fieldnames = ["timestamp", "path", "status", "message"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(stats["error_requests"])

# Usage example
stats = analyze_access_log("access.log.csv")
print(f"Total requests: {stats['total_requests']}")
print(f"Status code distribution: {stats['status_codes']}")
print(f"Popular paths: {stats['top_paths']}")
```

### Scenario 4: Data Transformation and Cleaning

```python
import csv
import re
from typing import Dict, List, Optional

class DataCleaner:
    """CSV data cleaner"""

    @staticmethod
    def clean_phone(phone: str) -> str:
        """Clean phone number"""
        # Remove non-digit characters
        return re.sub(r"\D", "", phone)

    @staticmethod
    def clean_email(email: str) -> str:
        """Clean and validate email"""
        email = email.strip().lower()
        if re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
            return email
        return ""

    @staticmethod
    def clean_name(name: str) -> str:
        """Clean name"""
        # Remove extra spaces, standardize case
        return " ".join(name.split()).title()

def clean_customer_data(
    input_file: str,
    output_file: str
) -> Dict[str, int]:
    """Clean customer data"""

    cleaner = DataCleaner()
    stats = {
        "total": 0,
        "cleaned": 0,
        "invalid_emails": 0,
        "invalid_phones": 0
    }

    with open(input_file, "r", encoding="utf-8") as infile, \
         open(output_file, "w", encoding="utf-8", newline="") as outfile:

        reader = csv.DictReader(infile)
        fieldnames = ["id", "name", "email", "phone", "city"]
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            stats["total"] += 1

            # Clean data
            cleaned_row = {
                "id": row["id"],
                "name": cleaner.clean_name(row.get("name", "")),
                "email": cleaner.clean_email(row.get("email", "")),
                "phone": cleaner.clean_phone(row.get("phone", "")),
                "city": row.get("city", "").strip()
            }

            # Count invalid data
            if not cleaned_row["email"]:
                stats["invalid_emails"] += 1
            if len(cleaned_row["phone"]) != 11:
                stats["invalid_phones"] += 1

            writer.writerow(cleaned_row)
            stats["cleaned"] += 1

    return stats

# Usage example
stats = clean_customer_data("raw_customers.csv", "clean_customers.csv")
print(f"Processing complete: {stats}")
```

### Scenario 5: CSV and Database Interaction

```python
import csv
import sqlite3
from typing import List, Dict, Any

class CSVDatabaseSync:
    """CSV and database sync tool"""

    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

    def import_csv_to_table(
        self,
        csv_path: str,
        table_name: str,
        create_table: bool = True
    ) -> int:
        """Import CSV to database table"""

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames

            if create_table:
                # Create table
                columns = ", ".join([f'"{col}" TEXT' for col in fieldnames])
                self.conn.execute(
                    f'CREATE TABLE IF NOT EXISTS "{table_name}" ({columns})'
                )

            # Insert data
            placeholders = ", ".join(["?" for _ in fieldnames])
            columns = ", ".join([f'"{col}"' for col in fieldnames])
            sql = f'INSERT INTO "{table_name}" ({columns}) VALUES ({placeholders})'

            count = 0
            for row in reader:
                values = [row[col] for col in fieldnames]
                self.conn.execute(sql, values)
                count += 1

            self.conn.commit()
            return count

    def export_table_to_csv(
        self,
        table_name: str,
        csv_path: str,
        query: str = None
    ) -> int:
        """Export database table to CSV"""

        if query is None:
            query = f'SELECT * FROM "{table_name}"'

        cursor = self.conn.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return 0

        fieldnames = rows[0].keys()

        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for row in rows:
                writer.writerow(dict(row))

        return len(rows)

    def close(self):
        self.conn.close()

# Usage example
db = CSVDatabaseSync("data.db")

# Import CSV to database
count = db.import_csv_to_table("employees.csv", "employees")
print(f"Imported {count} records")

# Export database to CSV
count = db.export_table_to_csv(
    "employees",
    "export.csv",
    query="SELECT * FROM employees WHERE salary > 10000"
)
print(f"Exported {count} records")

db.close()
```

## Interview Key Points

### What's the difference between csv.reader and csv.DictReader?

**Answer**:
- `csv.reader` returns lists, accessed by index
- `csv.DictReader` returns dictionaries, accessed by field name
- `DictReader` is more readable but slightly slower
- `DictReader` automatically uses the first row as field names

### Why use newline="" when writing CSV on Windows?

**Answer**:
- The CSV module handles line terminators itself
- Without `newline=""`, Python adds extra `\r`
- Results in blank lines between rows
- This is a Windows-specific issue, Unix systems are not affected

### How to handle fields with special characters (commas, newlines, quotes)?

**Answer**:
- The csv module handles these automatically
- Fields containing delimiters are wrapped in quotes
- Quotes are escaped (double quotes become two quotes)
- Quoting strategy can be controlled via the `quoting` parameter

### What are the four quoting strategies in CSV?

**Answer**:
```python
import csv

# QUOTE_MINIMAL: Quote only when necessary (default)
# QUOTE_ALL: Quote all fields
# QUOTE_NONNUMERIC: Quote non-numeric fields
# QUOTE_NONE: Never quote (requires escapechar)
```

### How to handle large CSV files?

**Answer**:
- Use iterators to process row by row, don't use `list()` to load everything
- Chunk processing
- Use generators
- Consider Pandas' `chunksize` parameter
- Parallel processing

### What is the extrasaction parameter in DictWriter?

**Answer**:
```python
import csv

# extrasaction="raise": Raises exception when data has extra fields (default)
# extrasaction="ignore": Ignores extra fields

fieldnames = ["a", "b"]
data = {"a": 1, "b": 2, "c": 3}  # c is extra field

writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
# Only writes a and b, ignores c
```

### How to make exported CSV properly recognize Chinese in Excel?

**Answer**:
```python
# Use UTF-8 with BOM encoding
with open("data.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Chinese", "Content"])
```

### What's the difference between csv module and Pandas for reading CSV?

**Answer**:

| Feature | csv Module | Pandas |
|---------|------------|--------|
| Dependency | Standard library | Requires installation |
| Memory usage | Can stream process | Usually loads all |
| Performance | Slower for large files | Optimized C implementation |
| Features | Basic read/write | Rich data processing |
| Type inference | None (all strings) | Automatic |
| Use case | Simple read/write | Data analysis |

## Further Reading

### Official Documentation
- [Python csv Module Documentation](https://docs.python.org/3/library/csv.html)
- [PEP 305 - CSV File API](https://peps.python.org/pep-0305/)

### Related Libraries
- [Pandas read_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html) - More powerful CSV processing
- [csvkit](https://csvkit.readthedocs.io/) - CSV command-line tools suite
- [agate](https://agate.readthedocs.io/) - Data analysis library

### RFC Standard
- [RFC 4180 - Common Format and MIME Type for CSV Files](https://www.rfc-editor.org/rfc/rfc4180)

### Recommended Articles
- [Real Python - Reading and Writing CSV Files in Python](https://realpython.com/python-csv/)
- [Python CSV Module Performance Optimization Guide](https://docs.python.org/3/library/csv.html#csv-fmt-params)
