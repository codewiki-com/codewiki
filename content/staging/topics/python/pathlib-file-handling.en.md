---
title: Python File Handling and pathlib
description: "Master Python file operations: pathlib, file I/O, os and shutil"
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - pathlib
  - File Operations
  - os
status: imported
origin: old/src/content/docs/python/pathlib-file-handling.en.md
divergence: 0.304
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 16
  lastUpdated: 2026-01-07
---

File handling is a fundamental skill in Python programming. We'll cover modern file operations using `pathlib`, traditional file I/O, and utility modules for file system manipulation.

## Introduction to pathlib

The `pathlib` module, introduced in Python 3.4, provides an object-oriented interface for working with file system paths. It's more intuitive and cross-platform compatible than older string-based approaches.

### Creating Path Objects

```python
from pathlib import Path

# Current directory
current_dir = Path.cwd()
print(f"Current directory: {current_dir}")

# Home directory
home_dir = Path.home()
print(f"Home directory: {home_dir}")

# Creating paths
file_path = Path("data/file.txt")
absolute_path = Path("/home/user/documents/report.pdf")

# Joining paths (platform-independent)
config_path = Path.home() / ".config" / "app" / "settings.json"
print(config_path)
```

### Path Properties and Methods

```python
from pathlib import Path

path = Path("/home/user/projects/myapp/src/main.py")

# Path components
print(f"Name: {path.name}")                    # main.py
print(f"Stem: {path.stem}")                    # main
print(f"Suffix: {path.suffix}")                # .py
print(f"Parent: {path.parent}")                # /home/user/projects/myapp/src
print(f"Parents: {list(path.parents)}")        # All parent directories
print(f"Parts: {path.parts}")                  # Tuple of path components

# Checking path properties
print(f"Is absolute: {path.is_absolute()}")
print(f"Exists: {path.exists()}")
print(f"Is file: {path.is_file()}")
print(f"Is directory: {path.is_dir()}")
print(f"Is symlink: {path.is_symlink()}")
```

### Path Manipulation

```python
from pathlib import Path

# Changing file extensions
path = Path("document.txt")
new_path = path.with_suffix(".md")
print(new_path)  # document.md

# Changing filename
new_name = path.with_name("report.txt")
print(new_name)  # report.txt

# Changing stem (keeping extension)
new_stem = path.with_stem("notes")
print(new_stem)  # notes.txt

# Resolving paths (absolute, following symlinks)
relative_path = Path("../data/file.txt")
absolute_path = relative_path.resolve()
print(absolute_path)

# Relative paths
base = Path("/home/user/projects")
target = Path("/home/user/projects/myapp/src/main.py")
relative = target.relative_to(base)
print(relative)  # myapp/src/main.py
```

### Listing Directory Contents

```python
from pathlib import Path

# List all items in a directory
directory = Path(".")
for item in directory.iterdir():
    print(f"{item.name} - {'Dir' if item.is_dir() else 'File'}")

# Glob patterns - find all Python files
for py_file in directory.glob("*.py"):
    print(py_file)

# Recursive glob - find all Python files in subdirectories
for py_file in directory.rglob("*.py"):
    print(py_file)

# Find specific patterns
for config_file in directory.rglob("*.json"):
    if "config" in config_file.name.lower():
        print(f"Found config: {config_file}")
```

### Creating and Removing Directories

```python
from pathlib import Path

# Create a single directory
new_dir = Path("data")
new_dir.mkdir(exist_ok=True)  # Won't raise error if exists

# Create nested directories
nested_dir = Path("data/processed/2024/january")
nested_dir.mkdir(parents=True, exist_ok=True)

# Remove empty directory
empty_dir = Path("temp")
if empty_dir.exists() and empty_dir.is_dir():
    empty_dir.rmdir()  # Only works if directory is empty

# Remove a file
file_path = Path("temp_file.txt")
if file_path.exists():
    file_path.unlink()  # Delete file
    # Or with missing_ok (Python 3.8+)
    file_path.unlink(missing_ok=True)
```

## File Read/Write Operations

### Basic File Operations with pathlib

```python
from pathlib import Path

# Write text to a file
file_path = Path("example.txt")
file_path.write_text("Hello, World!\n")

# Read text from a file
content = file_path.read_text()
print(content)

# Write bytes to a file
binary_path = Path("data.bin")
binary_path.write_bytes(b"\x00\x01\x02\x03")

# Read bytes from a file
binary_data = binary_path.read_bytes()
print(binary_data)
```

### File Modes Explained

Python's `open()` function supports various modes for file operations:

```python
# Text modes (default encoding: UTF-8)
# 'r'  - Read (default). Error if file doesn't exist
# 'w'  - Write. Creates file or truncates existing
# 'a'  - Append. Creates file if doesn't exist
# 'x'  - Exclusive creation. Error if file exists
# 'r+' - Read and write. Error if file doesn't exist
# 'w+' - Write and read. Creates file or truncates existing
# 'a+' - Append and read. Creates file if doesn't exist

# Binary modes (add 'b' to any text mode)
# 'rb'  - Read binary
# 'wb'  - Write binary
# 'ab'  - Append binary
# 'rb+' - Read and write binary
```

### Reading Files

```python
from pathlib import Path

file_path = Path("data.txt")

# Method 1: Read entire file as string
content = file_path.read_text(encoding="utf-8")
print(content)

# Method 2: Using context manager (recommended)
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()
    print(content)

# Method 3: Read line by line (memory efficient)
with open(file_path, "r", encoding="utf-8") as f:
    for line in f:
        print(line.rstrip())  # Remove trailing newline

# Method 4: Read all lines into a list
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()
    print(lines)

# Method 5: Read specific number of characters
with open(file_path, "r", encoding="utf-8") as f:
    chunk = f.read(100)  # Read first 100 characters
    print(chunk)

# Method 6: Read line by line with readline()
with open(file_path, "r", encoding="utf-8") as f:
    line1 = f.readline()
    line2 = f.readline()
    print(f"First line: {line1}")
    print(f"Second line: {line2}")
```

### Writing Files

```python
from pathlib import Path

file_path = Path("output.txt")

# Method 1: Simple write (overwrites file)
file_path.write_text("Hello, World!\n", encoding="utf-8")

# Method 2: Using context manager (recommended for multiple operations)
with open(file_path, "w", encoding="utf-8") as f:
    f.write("Line 1\n")
    f.write("Line 2\n")
    f.writelines(["Line 3\n", "Line 4\n"])

# Method 3: Appending to existing file
with open(file_path, "a", encoding="utf-8") as f:
    f.write("Line 5\n")

# Method 4: Exclusive creation (error if exists)
new_file = Path("new_file.txt")
try:
    with open(new_file, "x", encoding="utf-8") as f:
        f.write("This is a new file\n")
except FileExistsError:
    print("File already exists!")

# Method 5: Writing lists to file
data = ["apple", "banana", "cherry"]
with open("fruits.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(data))
```

### Binary File Operations

```python
from pathlib import Path

# Writing binary data
binary_file = Path("data.bin")
data = bytes([0x48, 0x65, 0x6C, 0x6C, 0x6F])  # "Hello" in ASCII
binary_file.write_bytes(data)

# Reading binary data
binary_data = binary_file.read_bytes()
print(binary_data)

# Working with binary files using context manager
with open("image.png", "rb") as f:
    header = f.read(8)  # Read first 8 bytes
    print(f"PNG header: {header}")

# Copying binary files
source = Path("source.png")
destination = Path("destination.png")
if source.exists():
    destination.write_bytes(source.read_bytes())
```

### Working with CSV Files

```python
import csv
from pathlib import Path

# Writing CSV
data = [
    ["Name", "Age", "City"],
    ["Alice", "30", "New York"],
    ["Bob", "25", "Paris"],
    ["Charlie", "35", "London"]
]

csv_file = Path("people.csv")
with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(data)

# Reading CSV
with open(csv_file, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)

# Using DictReader and DictWriter
with open("people_dict.csv", "w", newline="", encoding="utf-8") as f:
    fieldnames = ["Name", "Age", "City"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({"Name": "Alice", "Age": "30", "City": "New York"})
    writer.writerow({"Name": "Bob", "Age": "25", "City": "Paris"})

with open("people_dict.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']} is {row['Age']} years old")
```

### Working with JSON Files

```python
import json
from pathlib import Path

# Writing JSON
data = {
    "name": "John Doe",
    "age": 30,
    "skills": ["Python", "JavaScript", "SQL"],
    "address": {
        "city": "New York",
        "country": "USA"
    }
}

json_file = Path("data.json")
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

# Reading JSON
with open(json_file, "r", encoding="utf-8") as f:
    loaded_data = json.load(f)
    print(loaded_data["name"])
    print(loaded_data["skills"])

# Using Path methods (Python 3.9+)
# Note: write_text/read_text work but don't format JSON
json_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
loaded_data = json.loads(json_file.read_text(encoding="utf-8"))
```

## Working with os and shutil

The `os` and `shutil` modules provide additional file system operations not covered by `pathlib`.

### os Module Basics

```python
import os
from pathlib import Path

# Environment variables
home = os.getenv("HOME")
path_var = os.getenv("PATH")
custom_var = os.getenv("MY_VAR", "default_value")

# Current working directory
cwd = os.getcwd()
print(f"Current directory: {cwd}")

# Change directory
os.chdir("/tmp")
print(f"New directory: {os.getcwd()}")

# Directory operations
os.mkdir("new_dir")  # Create single directory
os.makedirs("nested/dirs/here", exist_ok=True)  # Create nested directories
os.rmdir("new_dir")  # Remove empty directory
os.removedirs("nested/dirs/here")  # Remove empty nested directories

# File operations
os.rename("old_name.txt", "new_name.txt")
os.remove("file_to_delete.txt")  # Delete file

# Path operations
abs_path = os.path.abspath("relative/path")
dir_name = os.path.dirname("/path/to/file.txt")  # /path/to
base_name = os.path.basename("/path/to/file.txt")  # file.txt
joined_path = os.path.join("dir", "subdir", "file.txt")

# Checking paths
exists = os.path.exists("file.txt")
is_file = os.path.isfile("file.txt")
is_dir = os.path.isdir("directory")
is_link = os.path.islink("symlink")

# File stats
stats = os.stat("file.txt")
print(f"Size: {stats.st_size} bytes")
print(f"Modified: {stats.st_mtime}")
print(f"Created: {stats.st_ctime}")
```

### os.path vs pathlib

```python
import os
from pathlib import Path

# Equivalent operations
# os.path style
old_path = os.path.join("home", "user", "documents", "file.txt")
old_exists = os.path.exists(old_path)
old_size = os.path.getsize(old_path) if old_exists else 0

# pathlib style (more readable)
new_path = Path("home") / "user" / "documents" / "file.txt"
new_exists = new_path.exists()
new_size = new_path.stat().st_size if new_exists else 0
```

### shutil Module - High-Level File Operations

```python
import shutil
from pathlib import Path

# Copying files
source = Path("source.txt")
destination = Path("destination.txt")

# Copy file (preserve permissions)
shutil.copy(source, destination)

# Copy file with metadata (permissions, timestamps)
shutil.copy2(source, destination)

# Copy file to directory
dest_dir = Path("backup")
dest_dir.mkdir(exist_ok=True)
shutil.copy(source, dest_dir)

# Copy entire directory tree
source_dir = Path("project")
dest_dir = Path("project_backup")
if source_dir.exists():
    shutil.copytree(source_dir, dest_dir, dirs_exist_ok=True)

# Move/rename files or directories
shutil.move("source.txt", "moved.txt")
shutil.move("source_dir", "destination_dir")

# Remove entire directory tree (dangerous!)
temp_dir = Path("temp_directory")
if temp_dir.exists():
    shutil.rmtree(temp_dir)

# Disk usage
total, used, free = shutil.disk_usage("/")
print(f"Total: {total // (2**30)} GB")
print(f"Used: {used // (2**30)} GB")
print(f"Free: {free // (2**30)} GB")

# Archive operations
# Create archive
shutil.make_archive("backup", "zip", "project_directory")

# Extract archive
shutil.unpack_archive("backup.zip", "extracted_files")

# Find executable in PATH
python_path = shutil.which("python3")
print(f"Python executable: {python_path}")
```

### Advanced File Operations

```python
import os
import shutil
from pathlib import Path

def copy_with_progress(src, dst):
    """Copy file with progress indication."""
    src_size = os.path.getsize(src)
    copied = 0

    with open(src, "rb") as fsrc:
        with open(dst, "wb") as fdst:
            while True:
                chunk = fsrc.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                fdst.write(chunk)
                copied += len(chunk)
                progress = (copied / src_size) * 100
                print(f"Progress: {progress:.1f}%", end="\r")
    print("\nCopy complete!")

# Safe file deletion with confirmation
def safe_delete(path):
    """Delete file/directory safely."""
    path = Path(path)
    if not path.exists():
        print(f"{path} does not exist")
        return

    if path.is_file():
        path.unlink()
        print(f"Deleted file: {path}")
    elif path.is_dir():
        shutil.rmtree(path)
        print(f"Deleted directory: {path}")

# Recursive file search
def find_files(directory, pattern):
    """Find all files matching pattern recursively."""
    directory = Path(directory)
    return list(directory.rglob(pattern))

# Example usage
python_files = find_files(".", "*.py")
for file in python_files[:5]:  # Show first 5
    print(file)
```

## Temporary Files with tempfile

The `tempfile` module creates temporary files and directories that are automatically cleaned up.

### Creating Temporary Files

```python
import tempfile
from pathlib import Path

# Temporary file (auto-deleted when closed)
with tempfile.TemporaryFile(mode="w+") as tf:
    tf.write("Temporary data\n")
    tf.seek(0)  # Go back to start
    content = tf.read()
    print(content)
# File is automatically deleted here

# Named temporary file (has a visible name)
with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".txt") as tf:
    print(f"Temporary file: {tf.name}")
    tf.write("This is temporary\n")
    temp_path = tf.name

# File still exists, we can use it
with open(temp_path, "r") as f:
    print(f.read())

# Clean up manually
Path(temp_path).unlink()

# Temporary file with specific directory and prefix
with tempfile.NamedTemporaryFile(
    mode="w+",
    prefix="myapp_",
    suffix=".log",
    dir="/tmp",
    delete=True
) as tf:
    print(f"Log file: {tf.name}")
    tf.write("Log entry\n")
```

### Creating Temporary Directories

```python
import tempfile
from pathlib import Path

# Temporary directory (auto-deleted when done)
with tempfile.TemporaryDirectory() as tmpdir:
    print(f"Temporary directory: {tmpdir}")

    # Create files in temp directory
    temp_path = Path(tmpdir)
    file1 = temp_path / "file1.txt"
    file1.write_text("Content 1")

    file2 = temp_path / "file2.txt"
    file2.write_text("Content 2")

    # List files
    for file in temp_path.iterdir():
        print(f"Created: {file.name}")
# Directory and all contents automatically deleted

# Get temp directory location
temp_dir = tempfile.gettempdir()
print(f"System temp directory: {temp_dir}")

# Create temporary directory manually
tmpdir = tempfile.mkdtemp(prefix="myapp_", suffix="_data")
print(f"Created temp dir: {tmpdir}")
# Must clean up manually
import shutil
shutil.rmtree(tmpdir)
```

### Temporary File for Processing

```python
import tempfile
import json
from pathlib import Path

def process_large_file(input_file):
    """Process file using temporary storage."""
    with tempfile.TemporaryDirectory() as tmpdir:
        temp_path = Path(tmpdir)

        # Read and process in chunks
        processed_file = temp_path / "processed.json"
        results = []

        with open(input_file, "r") as f:
            for i, line in enumerate(f):
                # Process line
                result = {"line": i, "data": line.strip()}
                results.append(result)

        # Write to temporary file
        with open(processed_file, "w") as f:
            json.dump(results, f, indent=2)

        # Read and return results
        return json.loads(processed_file.read_text())
```

## The io Module

The `io` module provides Python's main facilities for dealing with various types of I/O.

### String and Bytes Buffers

```python
import io

# StringIO - in-memory text stream
text_buffer = io.StringIO()
text_buffer.write("Hello, ")
text_buffer.write("World!\n")
text_buffer.write("This is a test.")

# Get content
content = text_buffer.getvalue()
print(content)

# Read from buffer
text_buffer.seek(0)  # Reset to beginning
print(text_buffer.read(5))  # Read first 5 characters

# BytesIO - in-memory binary stream
bytes_buffer = io.BytesIO()
bytes_buffer.write(b"Binary data")
bytes_buffer.write(b" more data")

binary_content = bytes_buffer.getvalue()
print(binary_content)

# Close buffers
text_buffer.close()
bytes_buffer.close()
```

### Using StringIO for Testing

```python
import io
import sys

def capture_output(func):
    """Capture function's stdout output."""
    # Save original stdout
    old_stdout = sys.stdout

    # Redirect stdout to StringIO
    sys.stdout = io.StringIO()

    try:
        func()
        output = sys.stdout.getvalue()
    finally:
        # Restore original stdout
        sys.stdout = old_stdout

    return output

def my_function():
    print("Hello from function")
    print("Line 2")

# Capture output
captured = capture_output(my_function)
print(f"Captured: {repr(captured)}")
```

### File-like Objects

```python
import io

class CustomFileObject:
    """Custom file-like object."""

    def __init__(self):
        self.buffer = io.StringIO()

    def write(self, text):
        timestamp = "LOG: "
        self.buffer.write(timestamp + text)
        return len(text)

    def getvalue(self):
        return self.buffer.getvalue()

    def close(self):
        self.buffer.close()

# Usage
log_file = CustomFileObject()
log_file.write("Application started\n")
log_file.write("Processing data\n")
log_file.write("Application finished\n")

print(log_file.getvalue())
log_file.close()
```

### Working with Text Encoding

```python
import io

# Reading with specific encoding
with open("file.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Writing with specific encoding
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("Text with unicode: \u263A")

# Convert between encodings
with open("input.txt", "r", encoding="latin-1") as f:
    text = f.read()

with open("output.txt", "w", encoding="utf-8") as f:
    f.write(text)

# Using TextIOWrapper for encoding conversion
with open("binary_file.txt", "rb") as binary_file:
    text_file = io.TextIOWrapper(binary_file, encoding="utf-8")
    content = text_file.read()
    print(content)
```

## Best Practices

### Context Managers

Always use context managers (`with` statement) for file operations to ensure proper resource cleanup:

```python
from pathlib import Path

# Good - guaranteed cleanup
with open("file.txt", "r") as f:
    content = f.read()
    # File automatically closed even if exception occurs

# Avoid - manual cleanup required
f = open("file.txt", "r")
content = f.read()
f.close()  # Might not execute if exception occurs
```

### Error Handling

```python
from pathlib import Path
import json

def read_json_safe(file_path):
    """Safely read JSON file with error handling."""
    path = Path(file_path)

    # Check if file exists
    if not path.exists():
        print(f"Error: {file_path} not found")
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None
    except PermissionError:
        print(f"Error: No permission to read {file_path}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

# Usage
data = read_json_safe("config.json")
if data:
    print(data)
```

### Working with Large Files

```python
from pathlib import Path

def process_large_file(file_path, chunk_size=1024*1024):
    """Process large file in chunks."""
    path = Path(file_path)

    with open(path, "r", encoding="utf-8") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            # Process chunk
            process_chunk(chunk)

def process_chunk(chunk):
    """Process a chunk of data."""
    # Your processing logic here
    pass

# Line-by-line processing (memory efficient)
def count_lines(file_path):
    """Count lines in a file efficiently."""
    count = 0
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            count += 1
    return count
```

### Cross-Platform Path Handling

```python
from pathlib import Path
import os

# Use pathlib for cross-platform compatibility
# Good - works on Windows, Linux, macOS
config_dir = Path.home() / ".config" / "myapp"
config_file = config_dir / "settings.json"

# Avoid hardcoded separators
# Bad - only works on Unix
bad_path = "/home/user/.config/myapp/settings.json"

# Bad - only works on Windows
bad_path_win = "C:\\Users\\user\\.config\\myapp\\settings.json"

# Convert Path to string when needed
config_str = str(config_file)
print(config_str)

# Use os.path.sep for separator if needed
manual_path = "dir" + os.sep + "file.txt"  # Platform-specific separator
```

### Atomic File Writes

```python
import tempfile
import shutil
from pathlib import Path

def atomic_write(file_path, content):
    """Write file atomically to prevent corruption."""
    path = Path(file_path)

    # Write to temporary file first
    with tempfile.NamedTemporaryFile(
        mode="w",
        dir=path.parent,
        delete=False,
        encoding="utf-8"
    ) as tf:
        tf.write(content)
        temp_path = tf.name

    # Atomic move (replace original)
    shutil.move(temp_path, path)

# Usage
atomic_write("important.txt", "Critical data that must not be corrupted")
```

### File Locking (Unix)

```python
import fcntl
from pathlib import Path

def write_with_lock(file_path, content):
    """Write to file with exclusive lock."""
    with open(file_path, "w") as f:
        # Acquire exclusive lock
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        try:
            f.write(content)
        finally:
            # Release lock
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)
```

### Complete Example: File Management System

```python
from pathlib import Path
import shutil
import json
from datetime import datetime

class FileManager:
    """File management utility class."""

    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_json(self, filename, data):
        """Save data as JSON file."""
        file_path = self.base_dir / filename
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return file_path

    def load_json(self, filename):
        """Load JSON file."""
        file_path = self.base_dir / filename
        if not file_path.exists():
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def backup_file(self, filename):
        """Create timestamped backup of file."""
        source = self.base_dir / filename
        if not source.exists():
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{source.stem}_{timestamp}{source.suffix}"
        backup_path = self.base_dir / "backups" / backup_name

        backup_path.parent.mkdir(exist_ok=True)
        shutil.copy2(source, backup_path)
        return backup_path

    def list_files(self, pattern="*"):
        """List files matching pattern."""
        return list(self.base_dir.glob(pattern))

    def cleanup_old_files(self, days=30):
        """Remove files older than specified days."""
        import time
        cutoff = time.time() - (days * 86400)

        removed = []
        for file in self.base_dir.rglob("*"):
            if file.is_file() and file.stat().st_mtime < cutoff:
                file.unlink()
                removed.append(file)

        return removed

# Usage example
if __name__ == "__main__":
    fm = FileManager("data")

    # Save data
    data = {"name": "John", "age": 30}
    fm.save_json("user.json", data)

    # Load data
    loaded = fm.load_json("user.json")
    print(loaded)

    # Create backup
    backup = fm.backup_file("user.json")
    print(f"Backup created: {backup}")

    # List all JSON files
    json_files = fm.list_files("*.json")
    for file in json_files:
        print(f"Found: {file.name}")
```

## Summary

Python provides comprehensive file handling capabilities through multiple modules:

- **pathlib**: Modern, object-oriented path handling (preferred for new code)
- **open()**: Core file I/O operations with various modes
- **os**: Low-level operating system interface for files and directories
- **shutil**: High-level file operations (copy, move, archive)
- **tempfile**: Safe temporary file and directory creation
- **io**: In-memory file-like objects and encoding handling

### Quick Reference

```python
from pathlib import Path
import shutil
import tempfile

# Create paths
path = Path("data/file.txt")
path.parent.mkdir(parents=True, exist_ok=True)

# Read/write
content = path.read_text()
path.write_text("new content")

# Copy/move
shutil.copy2("source.txt", "dest.txt")
shutil.move("old.txt", "new.txt")

# Temporary files
with tempfile.TemporaryDirectory() as tmpdir:
    temp_file = Path(tmpdir) / "temp.txt"
    temp_file.write_text("temporary data")

# List files
for file in Path(".").rglob("*.py"):
    print(file)
```

File handling is essential for data persistence, configuration management, logging, and many other programming tasks. Master these tools to build robust, cross-platform applications.
