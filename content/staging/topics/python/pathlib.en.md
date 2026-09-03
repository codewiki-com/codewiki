---
title: pathlib Path Handling
description: Complete guide to Python pathlib module, object-oriented filesystem path operations
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - pathlib
  - File Paths
  - Filesystem
status: imported
origin: old/src/content/docs/python/pathlib.en.md
divergence: 0.288
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 16
  lastUpdated: 2026-01-07
---

The `pathlib` module, introduced in Python 3.4, provides an object-oriented approach to handling filesystem paths. It offers a more intuitive and readable alternative to the traditional `os.path` module, making path manipulation cleaner and more Pythonic.

## Introduction to Path Objects

The `pathlib` module provides the `Path` class as its primary interface. `Path` automatically returns the appropriate path type for your operating system: `PosixPath` on Unix-like systems and `WindowsPath` on Windows.

```python
from pathlib import Path

# Create a Path object
p = Path('/home/user/documents')
print(p)           # /home/user/documents
print(type(p))     # <class 'pathlib.PosixPath'> (on Unix)

# Current directory
current = Path('.')
print(current.resolve())  # Absolute path of current directory

# Home directory
home = Path.home()
print(home)        # /home/user (on Unix)

# Current working directory
cwd = Path.cwd()
print(cwd)         # /home/user/project
```

### Pure Paths vs Concrete Paths

`pathlib` distinguishes between two types of paths:

- **Pure paths** (`PurePath`, `PurePosixPath`, `PureWindowsPath`): Provide only path manipulation operations without actual filesystem access
- **Concrete paths** (`Path`, `PosixPath`, `WindowsPath`): Inherit from pure paths and add filesystem I/O operations

```python
from pathlib import PurePath, PurePosixPath, PureWindowsPath

# Pure paths work without filesystem access
# Useful for manipulating paths for different OSes
windows_path = PureWindowsPath('C:/Users/Documents/file.txt')
posix_path = PurePosixPath('/home/user/documents/file.txt')

print(windows_path.parts)  # ('C:\\', 'Users', 'Documents', 'file.txt')
print(posix_path.parts)    # ('/', 'home', 'user', 'documents', 'file.txt')
```

## Path Construction and Components

### Building Paths with the `/` Operator

One of `pathlib`'s most elegant features is using the `/` operator to join paths:

```python
from pathlib import Path

# Join paths using /
base = Path('/home/user')
full_path = base / 'documents' / 'project' / 'file.txt'
print(full_path)  # /home/user/documents/project/file.txt

# Can also use joinpath()
same_path = base.joinpath('documents', 'project', 'file.txt')
print(same_path)  # /home/user/documents/project/file.txt

# Mix Path objects and strings
subdir = Path('documents')
combined = base / subdir / 'file.txt'
print(combined)   # /home/user/documents/file.txt
```

### Accessing Path Components

`Path` objects provide convenient attributes to access different parts of a path:

```python
from pathlib import Path

p = Path('/home/user/documents/report.txt')

# Basic components
print(p.parts)      # ('/', 'home', 'user', 'documents', 'report.txt')
print(p.parent)     # /home/user/documents
print(p.parents[0]) # /home/user/documents
print(p.parents[1]) # /home/user
print(p.parents[2]) # /home
print(p.name)       # report.txt
print(p.stem)       # report
print(p.suffix)     # .txt
print(p.anchor)     # /

# For files with multiple suffixes
archive = Path('/backup/data.tar.gz')
print(archive.suffix)    # .gz
print(archive.suffixes)  # ['.tar', '.gz']
print(archive.stem)      # data.tar

# Drive (mainly for Windows)
win_path = Path('C:/Users/Documents')
print(win_path.drive)    # '' on Unix, 'C:' on Windows
```

### Modifying Path Components

Create new paths by modifying components of existing ones:

```python
from pathlib import Path

p = Path('/home/user/documents/report.txt')

# Change the filename
new_name = p.with_name('summary.txt')
print(new_name)  # /home/user/documents/summary.txt

# Change just the stem (keep extension)
new_stem = p.with_stem('analysis')
print(new_stem)  # /home/user/documents/analysis.txt

# Change the suffix
new_suffix = p.with_suffix('.md')
print(new_suffix)  # /home/user/documents/report.md

# Remove suffix
no_suffix = p.with_suffix('')
print(no_suffix)  # /home/user/documents/report

# Add additional suffix
double_suffix = p.with_suffix('.txt.bak')
print(double_suffix)  # /home/user/documents/report.txt.bak
```

## Path Resolution and Comparison

### Absolute and Relative Paths

```python
from pathlib import Path

# Check if path is absolute
abs_path = Path('/home/user/file.txt')
rel_path = Path('documents/file.txt')

print(abs_path.is_absolute())  # True
print(rel_path.is_absolute())  # False

# Convert to absolute path
print(rel_path.resolve())  # /current/working/dir/documents/file.txt

# Make path absolute without resolving symlinks
print(rel_path.absolute())  # /current/working/dir/documents/file.txt

# Get relative path
base = Path('/home/user')
target = Path('/home/user/documents/project/file.txt')
relative = target.relative_to(base)
print(relative)  # documents/project/file.txt

# is_relative_to() - check without raising exception
print(target.is_relative_to(base))           # True
print(target.is_relative_to('/other/path'))  # False
```

### Path Comparison

```python
from pathlib import Path

p1 = Path('/home/user/file.txt')
p2 = Path('/home/user/file.txt')
p3 = Path('/home/user/other.txt')

# Equality comparison
print(p1 == p2)  # True
print(p1 == p3)  # False

# Paths are hashable (can be used in sets and as dict keys)
paths = {p1, p2, p3}
print(len(paths))  # 2 (p1 and p2 are equal)

# Ordering comparison
print(Path('a') < Path('b'))  # True
print(Path('file1.txt') < Path('file2.txt'))  # True

# Case sensitivity depends on OS
# On Windows, paths are compared case-insensitively
# On Unix, paths are case-sensitive
```

## File System Queries

### Checking Path Existence and Type

```python
from pathlib import Path

p = Path('/home/user/documents')

# Existence checks
print(p.exists())      # True if path exists
print(p.is_file())     # True if path is a regular file
print(p.is_dir())      # True if path is a directory
print(p.is_symlink())  # True if path is a symbolic link
print(p.is_mount())    # True if path is a mount point
print(p.is_socket())   # True if path is a Unix socket
print(p.is_fifo())     # True if path is a FIFO
print(p.is_block_device())  # True if path is a block device
print(p.is_char_device())   # True if path is a character device

# Safe existence check (doesn't raise for broken symlinks)
# exists() with follow_symlinks=False
if p.exists():
    print("Path exists")
```

### Getting File Information

```python
from pathlib import Path
import datetime

p = Path('/home/user/documents/report.txt')

# Get file statistics
stat_info = p.stat()
print(stat_info.st_size)   # File size in bytes
print(stat_info.st_mtime)  # Modification time (timestamp)
print(stat_info.st_ctime)  # Creation time (timestamp)
print(stat_info.st_mode)   # File mode (permissions)

# Convert timestamp to datetime
mod_time = datetime.datetime.fromtimestamp(stat_info.st_mtime)
print(mod_time)  # 2024-01-15 10:30:45.123456

# For symlinks, use lstat() to get info about the link itself
if p.is_symlink():
    link_stat = p.lstat()

# Get the target of a symlink
if p.is_symlink():
    target = p.readlink()
    print(target)

# Get owner and group (Unix only)
print(p.owner())  # 'user'
print(p.group())  # 'users'
```

## File Operations

### Reading and Writing Files

`pathlib` provides convenient methods for reading and writing files:

```python
from pathlib import Path

p = Path('/home/user/documents/example.txt')

# Write text to a file
p.write_text('Hello, World!\nThis is pathlib.')

# Read text from a file
content = p.read_text()
print(content)

# Write with encoding
p.write_text('Hello!', encoding='utf-8')

# Read with encoding
content = p.read_text(encoding='utf-8')

# Write binary data
binary_path = Path('/home/user/data.bin')
binary_path.write_bytes(b'\x00\x01\x02\x03')

# Read binary data
data = binary_path.read_bytes()
print(data)  # b'\x00\x01\x02\x03'

# For more control, use open()
with p.open('r', encoding='utf-8') as f:
    for line in f:
        print(line.strip())

# Write mode with open()
with p.open('w', encoding='utf-8') as f:
    f.write('Line 1\n')
    f.write('Line 2\n')

# Append mode
with p.open('a', encoding='utf-8') as f:
    f.write('Appended line\n')
```

### Creating Files and Directories

```python
from pathlib import Path

# Create a directory
dir_path = Path('/home/user/new_directory')
dir_path.mkdir()

# Create nested directories (like mkdir -p)
nested = Path('/home/user/parent/child/grandchild')
nested.mkdir(parents=True, exist_ok=True)

# exist_ok=True prevents error if directory exists
dir_path.mkdir(exist_ok=True)

# Create with specific permissions
dir_path.mkdir(mode=0o755, exist_ok=True)

# Create an empty file (like touch)
file_path = Path('/home/user/new_file.txt')
file_path.touch()

# touch with exist_ok=False raises error if file exists
# file_path.touch(exist_ok=False)  # FileExistsError if exists
```

### Copying, Moving, and Deleting

```python
from pathlib import Path
import shutil

source = Path('/home/user/source.txt')
dest = Path('/home/user/dest.txt')

# Rename/move a file
source.rename(dest)

# Replace destination if it exists
source.replace(dest)

# Delete a file
file_to_delete = Path('/home/user/temp.txt')
file_to_delete.unlink()

# unlink with missing_ok (Python 3.8+)
file_to_delete.unlink(missing_ok=True)

# Delete an empty directory
empty_dir = Path('/home/user/empty')
empty_dir.rmdir()

# For copying files, use shutil with Path objects
source = Path('/home/user/original.txt')
dest = Path('/home/user/copy.txt')
shutil.copy(source, dest)       # Copy file
shutil.copy2(source, dest)      # Copy file with metadata

# Copy directory tree
src_dir = Path('/home/user/source_dir')
dst_dir = Path('/home/user/dest_dir')
shutil.copytree(src_dir, dst_dir)

# Remove directory tree
shutil.rmtree(dst_dir)
```

### Symbolic Links

```python
from pathlib import Path

# Create a symbolic link
target = Path('/home/user/original.txt')
link = Path('/home/user/link.txt')
link.symlink_to(target)

# Create a symbolic link to a directory
dir_target = Path('/home/user/documents')
dir_link = Path('/home/user/docs_link')
dir_link.symlink_to(dir_target, target_is_directory=True)

# Read the target of a symbolic link
if link.is_symlink():
    print(link.readlink())  # /home/user/original.txt

# Resolve follows symlinks to get the real path
print(link.resolve())  # /home/user/original.txt

# Create a hard link
hard_link = Path('/home/user/hardlink.txt')
hard_link.hardlink_to(target)
```

## Directory Operations

### Listing Directory Contents

```python
from pathlib import Path

directory = Path('/home/user/documents')

# Iterate over directory contents
for item in directory.iterdir():
    print(item.name, 'dir' if item.is_dir() else 'file')

# Get list of all items
items = list(directory.iterdir())
print(items)

# Filter files only
files = [f for f in directory.iterdir() if f.is_file()]

# Filter directories only
dirs = [d for d in directory.iterdir() if d.is_dir()]

# Sort by name
sorted_items = sorted(directory.iterdir(), key=lambda p: p.name)

# Sort by modification time
sorted_by_time = sorted(
    directory.iterdir(),
    key=lambda p: p.stat().st_mtime,
    reverse=True  # Newest first
)
```

### Pattern Matching with glob

The `glob()` method allows you to find files matching a pattern:

```python
from pathlib import Path

directory = Path('/home/user/project')

# Find all Python files
for py_file in directory.glob('*.py'):
    print(py_file)

# Find all text files in subdirectories (recursive)
for txt_file in directory.glob('**/*.txt'):
    print(txt_file)

# Alternative: use rglob for recursive matching
for txt_file in directory.rglob('*.txt'):
    print(txt_file)

# Multiple patterns
for file in directory.glob('*.{py,txt}'):  # Doesn't work!
    print(file)

# Use multiple globs instead
from itertools import chain
patterns = ['*.py', '*.txt']
files = chain.from_iterable(directory.glob(p) for p in patterns)
for file in files:
    print(file)

# Match single character with ?
for file in directory.glob('file?.txt'):  # file1.txt, file2.txt, etc.
    print(file)

# Match character ranges
for file in directory.glob('file[0-9].txt'):
    print(file)

# Find all directories
for d in directory.glob('**/'):
    if d.is_dir():
        print(d)
```

### Practical glob Examples

```python
from pathlib import Path

project = Path('/home/user/project')

# Find all Python files excluding __pycache__
python_files = [
    f for f in project.rglob('*.py')
    if '__pycache__' not in str(f)
]

# Find all image files
image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif']
images = []
for ext in image_extensions:
    images.extend(project.rglob(ext))

# Find files modified in the last hour
import time
one_hour_ago = time.time() - 3600
recent_files = [
    f for f in project.rglob('*')
    if f.is_file() and f.stat().st_mtime > one_hour_ago
]

# Find empty files
empty_files = [
    f for f in project.rglob('*')
    if f.is_file() and f.stat().st_size == 0
]

# Find large files (> 1MB)
large_files = [
    f for f in project.rglob('*')
    if f.is_file() and f.stat().st_size > 1_000_000
]
```

### The `match()` Method

Use `match()` to check if a path matches a given pattern:

```python
from pathlib import Path

p = Path('/home/user/documents/report.txt')

# Match against patterns
print(p.match('*.txt'))           # True
print(p.match('report.txt'))      # True
print(p.match('documents/*.txt')) # True
print(p.match('**/*.txt'))        # True
print(p.match('*.py'))            # False

# Pattern matching is from the right
print(p.match('user/documents/report.txt'))  # True
print(p.match('/home/user/documents/*.txt')) # True

# Case sensitivity (Python 3.12+)
print(p.match('*.TXT', case_sensitive=False))  # True
```

## os.path vs pathlib Comparison

Here's a comparison of common operations between `os.path` and `pathlib`:

### Path Manipulation

```python
import os
from pathlib import Path

# Join paths
# os.path
os.path.join('/home', 'user', 'file.txt')

# pathlib
Path('/home') / 'user' / 'file.txt'

# Get filename
# os.path
os.path.basename('/home/user/file.txt')  # 'file.txt'

# pathlib
Path('/home/user/file.txt').name  # 'file.txt'

# Get directory
# os.path
os.path.dirname('/home/user/file.txt')  # '/home/user'

# pathlib
Path('/home/user/file.txt').parent  # Path('/home/user')

# Split extension
# os.path
os.path.splitext('/home/user/file.txt')  # ('/home/user/file', '.txt')

# pathlib
p = Path('/home/user/file.txt')
(p.stem, p.suffix)  # ('file', '.txt')

# Get absolute path
# os.path
os.path.abspath('relative/path')

# pathlib
Path('relative/path').resolve()

# Check if absolute
# os.path
os.path.isabs('/home/user')  # True

# pathlib
Path('/home/user').is_absolute()  # True
```

### File System Queries

```python
import os
from pathlib import Path

path = '/home/user/file.txt'
p = Path(path)

# Check existence
os.path.exists(path)    # os.path
p.exists()              # pathlib

# Check if file
os.path.isfile(path)    # os.path
p.is_file()             # pathlib

# Check if directory
os.path.isdir(path)     # os.path
p.is_dir()              # pathlib

# Get file size
os.path.getsize(path)   # os.path
p.stat().st_size        # pathlib

# Get modification time
os.path.getmtime(path)  # os.path
p.stat().st_mtime       # pathlib

# Expand user (~)
os.path.expanduser('~/documents')  # os.path
Path('~/documents').expanduser()    # pathlib

# Get home directory
os.path.expanduser('~')  # os.path
Path.home()              # pathlib
```

### Why Choose pathlib?

```python
# os.path approach - string manipulation
import os

def get_config_files_os(base_dir):
    config_dir = os.path.join(base_dir, 'config')
    if os.path.isdir(config_dir):
        files = []
        for name in os.listdir(config_dir):
            path = os.path.join(config_dir, name)
            if os.path.isfile(path) and name.endswith('.json'):
                files.append(path)
        return files
    return []

# pathlib approach - object-oriented
from pathlib import Path

def get_config_files_pathlib(base_dir):
    config_dir = Path(base_dir) / 'config'
    if config_dir.is_dir():
        return list(config_dir.glob('*.json'))
    return []
```

**Advantages of pathlib:**

1. **Readability**: The `/` operator makes path joining intuitive
2. **Object-oriented**: Methods on objects instead of function calls
3. **Type safety**: Path objects vs. strings reduce errors
4. **Cross-platform**: Handles OS differences automatically
5. **Comprehensive**: Combines `os.path`, `os`, and `glob` functionality
6. **Chainable**: Methods return new Path objects for chaining

## Practical Examples

### Example 1: Organize Files by Extension

```python
from pathlib import Path
from collections import defaultdict

def organize_by_extension(source_dir, target_dir):
    """Move files into subdirectories based on extension."""
    source = Path(source_dir)
    target = Path(target_dir)

    moved = defaultdict(list)

    for file in source.iterdir():
        if file.is_file():
            # Get extension without dot, default to 'no_extension'
            ext = file.suffix[1:].lower() if file.suffix else 'no_extension'

            # Create target directory
            ext_dir = target / ext
            ext_dir.mkdir(parents=True, exist_ok=True)

            # Move file
            new_path = ext_dir / file.name
            file.rename(new_path)
            moved[ext].append(file.name)

    return dict(moved)

# Usage
result = organize_by_extension('/home/user/downloads', '/home/user/organized')
for ext, files in result.items():
    print(f"{ext}: {len(files)} files")
```

### Example 2: Find Duplicate Files

```python
from pathlib import Path
import hashlib
from collections import defaultdict

def find_duplicates(directory):
    """Find duplicate files based on content hash."""
    hashes = defaultdict(list)

    for file_path in Path(directory).rglob('*'):
        if file_path.is_file():
            # Calculate file hash
            file_hash = hashlib.md5(file_path.read_bytes()).hexdigest()
            hashes[file_hash].append(file_path)

    # Return only duplicates
    return {h: paths for h, paths in hashes.items() if len(paths) > 1}

# Usage
duplicates = find_duplicates('/home/user/documents')
for file_hash, paths in duplicates.items():
    print(f"Duplicate set (hash: {file_hash[:8]}...):")
    for path in paths:
        print(f"  {path}")
```

### Example 3: Batch Rename Files

```python
from pathlib import Path
import re

def batch_rename(directory, pattern, replacement):
    """Rename files matching a regex pattern."""
    dir_path = Path(directory)
    renamed = []

    for file_path in dir_path.iterdir():
        if file_path.is_file():
            new_name = re.sub(pattern, replacement, file_path.name)
            if new_name != file_path.name:
                new_path = file_path.with_name(new_name)
                file_path.rename(new_path)
                renamed.append((file_path.name, new_name))

    return renamed

# Usage: Replace spaces with underscores
renamed = batch_rename('/home/user/photos', r'\s+', '_')
for old, new in renamed:
    print(f"{old} -> {new}")

# Usage: Add prefix to all files
def add_prefix(directory, prefix):
    dir_path = Path(directory)
    for file_path in dir_path.iterdir():
        if file_path.is_file():
            new_name = prefix + file_path.name
            file_path.rename(file_path.with_name(new_name))
```

### Example 4: Directory Tree Display

```python
from pathlib import Path

def print_tree(directory, prefix="", max_depth=None, current_depth=0):
    """Print a directory tree structure."""
    if max_depth is not None and current_depth >= max_depth:
        return

    path = Path(directory)

    if current_depth == 0:
        print(path.name + "/")

    items = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))

    for i, item in enumerate(items):
        is_last = i == len(items) - 1
        current_prefix = prefix + ("    " if is_last else "|   ")
        connector = "`-- " if is_last else "|-- "

        if item.is_dir():
            print(f"{prefix}{connector}{item.name}/")
            print_tree(item, current_prefix, max_depth, current_depth + 1)
        else:
            size = item.stat().st_size
            print(f"{prefix}{connector}{item.name} ({size} bytes)")

# Usage
print_tree('/home/user/project', max_depth=3)
```

### Example 5: Safe File Operations with Context Manager

```python
from pathlib import Path
import shutil
from contextlib import contextmanager

@contextmanager
def atomic_write(path, mode='w', **kwargs):
    """Write to a file atomically using a temporary file."""
    path = Path(path)
    temp_path = path.with_suffix(path.suffix + '.tmp')

    try:
        with temp_path.open(mode, **kwargs) as f:
            yield f
        # If we get here, writing succeeded
        temp_path.replace(path)
    except Exception:
        # Clean up temp file on error
        temp_path.unlink(missing_ok=True)
        raise

# Usage
with atomic_write('/home/user/config.json') as f:
    f.write('{"key": "value"}')

def safe_copy(source, dest, backup=True):
    """Copy a file with optional backup."""
    source = Path(source)
    dest = Path(dest)

    if dest.exists() and backup:
        backup_path = dest.with_suffix(dest.suffix + '.bak')
        shutil.copy2(dest, backup_path)

    shutil.copy2(source, dest)
    return dest

# Usage
safe_copy('/home/user/new_config.json', '/home/user/config.json')
```

## Best Practices

### Use Path Objects Early

Convert strings to Path objects at the entry point of your code:

```python
from pathlib import Path

def process_files(directory):
    # Convert to Path immediately
    dir_path = Path(directory)

    for file in dir_path.glob('*.txt'):
        process_file(file)

def process_file(file_path):
    # file_path is already a Path object
    content = file_path.read_text()
    # ... process content
```

### Prefer resolve() for Absolute Paths

```python
from pathlib import Path

# Always resolve to get canonical absolute paths
config_path = Path('config/settings.json').resolve()

# This handles '..' and symlinks correctly
parent_file = Path('../data/file.txt').resolve()
```

### Use with Statements for File Operations

```python
from pathlib import Path

p = Path('/home/user/large_file.txt')

# Good: Use with statement for large files
with p.open('r') as f:
    for line in f:
        process(line)

# OK for small files: Use convenience methods
content = p.read_text()  # Reads entire file into memory
```

### Handle Missing Files Gracefully

```python
from pathlib import Path

p = Path('/home/user/maybe_exists.txt')

# Check before accessing
if p.exists():
    content = p.read_text()
else:
    content = "default"

# Or use try/except
try:
    content = p.read_text()
except FileNotFoundError:
    content = "default"

# For deletion, use missing_ok
p.unlink(missing_ok=True)
```

### Type Hints with Path

```python
from pathlib import Path
from typing import Union, List

# Accept both strings and Path objects
def read_config(path: Union[str, Path]) -> dict:
    path = Path(path)
    import json
    return json.loads(path.read_text())

# Return Path objects
def find_files(directory: Path, pattern: str) -> List[Path]:
    return list(directory.glob(pattern))
```

## Summary

The `pathlib` module provides a modern, object-oriented approach to filesystem path handling in Python. Key takeaways:

- **Path objects** are the central abstraction, providing both path manipulation and filesystem operations
- The **`/` operator** makes path joining intuitive and readable
- **Properties** like `name`, `stem`, `suffix`, and `parent` give easy access to path components
- **glob()** and **rglob()** enable powerful pattern matching for finding files
- **read_text()**, **write_text()**, and similar methods simplify file I/O
- **pathlib** unifies functionality from `os.path`, `os`, and `glob` modules
- Path objects work seamlessly with most Python libraries that accept file paths

For new Python projects, `pathlib` is the recommended approach for path handling. Its cleaner syntax and object-oriented design lead to more maintainable code compared to the traditional `os.path` approach.
