---
title: "Python Compression File Handling: zipfile and tarfile"
description: "Master Python compression file handling: ZipFile, TarFile, compression modes, archive creation and extraction techniques"
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - zipfile
  - tarfile
  - compression
  - archive
  - gzip
  - bz2
status: imported
origin: old/src/content/docs/python/zipfile.en.md
divergence: 0.199
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: python
  subcategory: ""
  order: 17
  lastUpdated: 2026-01-07
---

Python's standard library provides powerful compression file handling modules, including `zipfile` for handling ZIP format and `tarfile` for handling TAR format. We'll cover these two modules in depth, including their core principles and best practices.

## Concept Overview

### What are Compression Files

Compression files are a technology that reduces file size through specific algorithms, mainly used for:

- **Saving Storage Space**: Compress large files into smaller files
- **Accelerating Transfer Speed**: Smaller files transfer faster
- **File Archiving**: Package multiple files into a single archive file
- **Data Backup**: Convenient backup and recovery

### Common Compression Formats

| Format | Extension | Characteristics | Python Module |
|--------|-----------|-----------------|---------------|
| ZIP | .zip | Excellent universal compatibility, supports individual extraction | `zipfile` |
| TAR | .tar | Archive format, no compression | `tarfile` |
| GZIP | .gz | Compress individual files | `gzip` |
| TAR.GZ | .tar.gz, .tgz | TAR archive + GZIP compression | `tarfile` |
| BZ2 | .bz2 | Higher compression ratio | `bz2` |
| TAR.BZ2 | .tar.bz2 | TAR archive + BZ2 compression | `tarfile` |
| LZMA/XZ | .xz, .lzma | Highest compression ratio | `lzma` |
| TAR.XZ | .tar.xz | TAR archive + XZ compression | `tarfile` |

### zipfile vs tarfile

- **zipfile**: Handles ZIP format, supports random access to individual files, commonly used on Windows and cross-platform environments
- **tarfile**: Handles TAR format and its compressed variants, commonly used on Unix/Linux systems, supports more file metadata

## Core Principles

### ZIP Format Structure

```
┌─────────────────────────────────────────────┐
│                 ZIP File Structure           │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ Local File Header 1 + Compressed Data 1 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ Local File Header 2 + Compressed Data 2 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ Central Directory (Metadata for All Files) │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ End of Central Directory Record     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

ZIP files store the central directory at the end, allowing fast random access to any file.

### TAR Format Structure

```
┌─────────────────────────────────────────────┐
│                 TAR File Structure           │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ Header Block 1 (512 bytes)          │    │
│  ├─────────────────────────────────────┤    │
│  │ File Content 1 (Padded to 512 bytes)│    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ Header Block 2 (512 bytes)          │    │
│  ├─────────────────────────────────────┤    │
│  │ File Content 2                      │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ End Marker (Two 512-byte Empty Blocks) │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

TAR is a sequential format requiring a scan from the beginning to find specific files.

### Compression Algorithms

| Algorithm | Compression Ratio | Speed | Memory Usage | Use Cases |
|-----------|-------------------|-------|--------------|-----------|
| DEFLATE (ZIP) | Medium | Fast | Low | General purpose |
| GZIP | Medium | Fast | Low | Single file compression |
| BZ2 | High | Slow | Higher | High compression ratio needed |
| LZMA/XZ | Highest | Slowest | High | Archive storage |

## Core Concepts

### zipfile Module Core Classes

```python
import zipfile

# ZipFile - Main class for reading and writing ZIP files
# ZipInfo - Stores information about archive members
# is_zipfile() - Check if file is a valid ZIP file
# Path - ZIP file access similar to pathlib (Python 3.8+)
```

### tarfile Module Core Classes

```python
import tarfile

# TarFile - Main class for reading and writing TAR files
# TarInfo - Stores information about archive members
# is_tarfile() - Check if file is a valid TAR file
```

### File Opening Modes

**zipfile modes:**

| Mode | Description |
|------|-------------|
| `'r'` | Read mode (default) |
| `'w'` | Write mode (overwrite) |
| `'a'` | Append mode |
| `'x'` | Exclusive creation mode |

**tarfile modes:**

| Mode | Description |
|------|-------------|
| `'r'` | Read with automatic compression format detection |
| `'r:'` | Read uncompressed TAR |
| `'r:gz'` | Read GZIP compression |
| `'r:bz2'` | Read BZ2 compression |
| `'r:xz'` | Read XZ compression |
| `'w'` or `'w:'` | Write uncompressed TAR |
| `'w:gz'` | Write GZIP compression |
| `'w:bz2'` | Write BZ2 compression |
| `'w:xz'` | Write XZ compression |
| `'a'` or `'a:'` | Append to uncompressed TAR |
| `'x'` or `'x:'` | Exclusive create uncompressed TAR |
| `'x:gz'` | Exclusive create GZIP compression |

## Code Examples

### zipfile Basic Operations

#### Creating ZIP Files

```python
import zipfile
from pathlib import Path

# Method 1: Basic creation
with zipfile.ZipFile('archive.zip', 'w') as zf:
    # Add single file
    zf.write('document.txt')

    # Specify name in archive
    zf.write('data/config.json', arcname='config.json')

    # Add file with compression
    zf.write('large_file.txt', compress_type=zipfile.ZIP_DEFLATED)

# Method 2: Using compression level (Python 3.7+)
with zipfile.ZipFile('archive.zip', 'w',
                      compression=zipfile.ZIP_DEFLATED,
                      compresslevel=9) as zf:  # 0-9, 9 is highest
    zf.write('document.txt')

# Method 3: Add string content
with zipfile.ZipFile('archive.zip', 'w') as zf:
    # Write string content directly
    zf.writestr('readme.txt', 'This is the README content.\n')

    # Write bytes content
    zf.writestr('data.bin', b'\x00\x01\x02\x03')

    # Set detailed metadata using ZipInfo
    info = zipfile.ZipInfo('custom.txt')
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16  # Set Unix permissions
    zf.writestr(info, 'Custom content with metadata')

# Method 4: Recursively add directory
def add_directory_to_zip(zf, directory, base_path=''):
    """Recursively add directory to ZIP file"""
    directory = Path(directory)
    for item in directory.rglob('*'):
        if item.is_file():
            arcname = str(item.relative_to(directory))
            if base_path:
                arcname = f"{base_path}/{arcname}"
            zf.write(item, arcname)

with zipfile.ZipFile('project.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    add_directory_to_zip(zf, 'src', 'source')
    add_directory_to_zip(zf, 'docs', 'documentation')
```

#### Reading ZIP Files

```python
import zipfile
from pathlib import Path

# Check if valid ZIP file
if zipfile.is_zipfile('archive.zip'):
    print("This is a valid ZIP file")

# Read ZIP file information
with zipfile.ZipFile('archive.zip', 'r') as zf:
    # List all files
    print("Archive contents:")
    for name in zf.namelist():
        print(f"  {name}")

    # Get detailed information
    print("\nDetailed information:")
    for info in zf.infolist():
        print(f"  File: {info.filename}")
        print(f"    Size: {info.file_size} bytes")
        print(f"    Compressed: {info.compress_size} bytes")
        print(f"    Compression ratio: {info.compress_size / info.file_size * 100:.1f}%")
        print(f"    Modified time: {info.date_time}")
        print(f"    CRC: {info.CRC}")
        print()

    # Read specific file content
    content = zf.read('readme.txt')
    print(f"README content: {content.decode('utf-8')}")

    # Open file in text mode
    with zf.open('document.txt') as f:
        text = f.read().decode('utf-8')
        print(text)

# Using Path interface (Python 3.8+)
with zipfile.ZipFile('archive.zip', 'r') as zf:
    root = zipfile.Path(zf)

    # Iterate through directory
    for item in root.iterdir():
        print(item.name)
        if item.is_file():
            print(f"  Content: {item.read_text()[:50]}...")
```

#### Extracting ZIP Files

```python
import zipfile
from pathlib import Path

# Extract all files
with zipfile.ZipFile('archive.zip', 'r') as zf:
    # Extract to current directory
    zf.extractall()

    # Extract to specified directory
    zf.extractall('extracted_files')

    # Extract specific files
    zf.extractall('selected', members=['file1.txt', 'file2.txt'])

# Extract single file
with zipfile.ZipFile('archive.zip', 'r') as zf:
    # Extract single file to specified directory
    zf.extract('document.txt', 'output')

    # Using open to read and write (more flexible)
    with zf.open('large_file.bin') as src:
        with open('output/large_file.bin', 'wb') as dst:
            # Read large file in chunks
            while True:
                chunk = src.read(1024 * 1024)  # 1MB
                if not chunk:
                    break
                dst.write(chunk)

# Safe extraction (prevent path traversal attacks)
def safe_extract(zf, member, target_dir):
    """Safely extract file, preventing path traversal"""
    target_dir = Path(target_dir).resolve()
    member_path = target_dir / member

    # Ensure target path is within target directory
    if not str(member_path.resolve()).startswith(str(target_dir)):
        raise ValueError(f"Illegal path: {member}")

    zf.extract(member, target_dir)
    return member_path

with zipfile.ZipFile('archive.zip', 'r') as zf:
    for member in zf.namelist():
        safe_extract(zf, member, 'safe_output')
```

#### Advanced ZIP Operations

```python
import zipfile
import os
from datetime import datetime

# Password-protected ZIP files (extraction only, third-party library needed for creation)
with zipfile.ZipFile('protected.zip', 'r') as zf:
    # Set password
    zf.setpassword(b'secret123')

    # Or specify password when extracting
    zf.extractall('output', pwd=b'secret123')

# Append files to existing ZIP
with zipfile.ZipFile('archive.zip', 'a') as zf:
    zf.write('new_file.txt')
    zf.writestr('appended.txt', 'New content')

# Test ZIP file integrity
with zipfile.ZipFile('archive.zip', 'r') as zf:
    bad_file = zf.testzip()
    if bad_file:
        print(f"Corrupted file: {bad_file}")
    else:
        print("ZIP file is complete")

# Get and set ZIP file comment
with zipfile.ZipFile('archive.zip', 'a') as zf:
    # Set comment
    zf.comment = b'Created by Python zipfile module'

with zipfile.ZipFile('archive.zip', 'r') as zf:
    # Read comment
    print(f"Comment: {zf.comment.decode('utf-8')}")

# Handle ZIP files in memory
from io import BytesIO

# Create ZIP in memory
buffer = BytesIO()
with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('memory_file.txt', 'Created in memory')

# Get ZIP data
zip_data = buffer.getvalue()
print(f"ZIP size: {len(zip_data)} bytes")

# Read ZIP from memory
buffer = BytesIO(zip_data)
with zipfile.ZipFile(buffer, 'r') as zf:
    print(zf.namelist())
```

### tarfile Basic Operations

#### Creating TAR Files

```python
import tarfile
from pathlib import Path
import io

# Create uncompressed TAR
with tarfile.open('archive.tar', 'w') as tf:
    tf.add('document.txt')
    tf.add('data/config.json', arcname='config.json')

# Create GZIP compressed TAR
with tarfile.open('archive.tar.gz', 'w:gz') as tf:
    tf.add('document.txt')

# Create BZ2 compressed TAR
with tarfile.open('archive.tar.bz2', 'w:bz2') as tf:
    tf.add('document.txt')

# Create XZ compressed TAR (Python 3.3+)
with tarfile.open('archive.tar.xz', 'w:xz') as tf:
    tf.add('document.txt')

# Set compression level (GZIP: 0-9)
with tarfile.open('archive.tar.gz', 'w:gz', compresslevel=9) as tf:
    tf.add('large_file.txt')

# Add directory (recursive)
with tarfile.open('project.tar.gz', 'w:gz') as tf:
    # Add entire directory
    tf.add('src', arcname='source')

    # Use filter to exclude files
    def exclude_pyc(tarinfo):
        if tarinfo.name.endswith('.pyc'):
            return None
        return tarinfo

    tf.add('project', filter=exclude_pyc)

# Add string/bytes content
with tarfile.open('archive.tar.gz', 'w:gz') as tf:
    # Create TarInfo object
    data = b'Hello, World!'
    info = tarfile.TarInfo(name='hello.txt')
    info.size = len(data)

    # Use BytesIO as file object
    tf.addfile(info, io.BytesIO(data))

# Set file metadata
with tarfile.open('archive.tar.gz', 'w:gz') as tf:
    info = tarfile.TarInfo(name='custom.txt')
    info.size = 13
    info.mtime = 1704067200  # 2024-01-01 00:00:00 UTC
    info.mode = 0o644
    info.uid = 1000
    info.gid = 1000
    info.uname = 'user'
    info.gname = 'group'

    tf.addfile(info, io.BytesIO(b'Custom file.\n'))
```

#### Reading TAR Files

```python
import tarfile

# Check if valid TAR file
if tarfile.is_tarfile('archive.tar.gz'):
    print("This is a valid TAR file")

# Read TAR file (automatic compression format detection)
with tarfile.open('archive.tar.gz', 'r') as tf:
    # List all members
    print("Archive contents:")
    for name in tf.getnames():
        print(f"  {name}")

    # Get detailed information
    print("\nDetailed information:")
    for member in tf.getmembers():
        print(f"  Name: {member.name}")
        print(f"  Type: {'Directory' if member.isdir() else 'File'}")
        print(f"  Size: {member.size} bytes")
        print(f"  Mode: {oct(member.mode)}")
        print(f"  Owner: {member.uname}:{member.gname}")
        print(f"  Modified time: {member.mtime}")
        print()

    # Get specific member information
    info = tf.getmember('document.txt')
    print(f"File size: {info.size}")

    # Read file content
    f = tf.extractfile('document.txt')
    if f:
        content = f.read().decode('utf-8')
        print(content)
```

#### Extracting TAR Files

```python
import tarfile
from pathlib import Path

# Extract all files
with tarfile.open('archive.tar.gz', 'r') as tf:
    # Extract to current directory
    tf.extractall()

    # Extract to specified directory
    tf.extractall('extracted_files')

    # Extract specific files
    members = [m for m in tf.getmembers() if m.name.endswith('.txt')]
    tf.extractall('text_files', members=members)

# Extract single file
with tarfile.open('archive.tar.gz', 'r') as tf:
    # Extract single member
    tf.extract('document.txt', 'output')

# Safe extraction (Python 3.12+ has built-in, earlier versions need manual implementation)
# Python 3.12+
with tarfile.open('archive.tar.gz', 'r') as tf:
    tf.extractall('output', filter='data')  # Safe filter

# Safe extraction for Python 3.11 and earlier
def safe_extract_tar(tf, target_dir):
    """Safely extract TAR file, preventing path traversal"""
    target_dir = Path(target_dir).resolve()

    for member in tf.getmembers():
        member_path = target_dir / member.name

        # Check for path traversal
        if not str(member_path.resolve()).startswith(str(target_dir)):
            raise ValueError(f"Illegal path: {member.name}")

        # Check for symlinks
        if member.issym() or member.islnk():
            link_target = target_dir / member.linkname
            if not str(link_target.resolve()).startswith(str(target_dir)):
                raise ValueError(f"Illegal link: {member.name} -> {member.linkname}")

    tf.extractall(target_dir)

with tarfile.open('archive.tar.gz', 'r') as tf:
    safe_extract_tar(tf, 'safe_output')

# Stream-based extraction of large files
with tarfile.open('large_archive.tar.gz', 'r|gz') as tf:  # Note: use '|' not ':'
    for member in tf:
        if member.isfile():
            f = tf.extractfile(member)
            if f:
                output_path = Path('output') / member.name
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, 'wb') as out:
                    while True:
                        chunk = f.read(1024 * 1024)
                        if not chunk:
                            break
                        out.write(chunk)
```

#### Advanced TAR Operations

```python
import tarfile
import io
from pathlib import Path

# Modify members in TAR file
def modify_tar_member(tar_path, member_name, new_content):
    """Modify specific member in TAR file"""
    temp_path = tar_path + '.tmp'

    with tarfile.open(tar_path, 'r:gz') as src:
        with tarfile.open(temp_path, 'w:gz') as dst:
            for member in src.getmembers():
                if member.name == member_name:
                    # Replace content
                    data = new_content.encode('utf-8')
                    info = tarfile.TarInfo(name=member_name)
                    info.size = len(data)
                    dst.addfile(info, io.BytesIO(data))
                else:
                    # Copy original content
                    f = src.extractfile(member)
                    if f:
                        dst.addfile(member, f)
                    else:
                        dst.addfile(member)

    Path(temp_path).replace(tar_path)

# Handle TAR files in memory
buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w:gz') as tf:
    data = b'Memory content'
    info = tarfile.TarInfo(name='memory.txt')
    info.size = len(data)
    tf.addfile(info, io.BytesIO(data))

# Get TAR data
tar_data = buffer.getvalue()

# Read from memory
buffer = io.BytesIO(tar_data)
with tarfile.open(fileobj=buffer, mode='r:gz') as tf:
    print(tf.getnames())

# Compare two TAR files
def compare_tar_files(tar1_path, tar2_path):
    """Compare contents of two TAR files"""
    with tarfile.open(tar1_path, 'r') as tf1:
        with tarfile.open(tar2_path, 'r') as tf2:
            names1 = set(tf1.getnames())
            names2 = set(tf2.getnames())

            only_in_1 = names1 - names2
            only_in_2 = names2 - names1
            common = names1 & names2

            print(f"Only in {tar1_path}: {only_in_1}")
            print(f"Only in {tar2_path}: {only_in_2}")

            for name in common:
                m1 = tf1.getmember(name)
                m2 = tf2.getmember(name)
                if m1.size != m2.size:
                    print(f"Size difference: {name}")
```

### Comprehensive Compression Utility Class

```python
import zipfile
import tarfile
import gzip
import bz2
import lzma
from pathlib import Path
from typing import Union, List, Optional
import io


class CompressionUtils:
    """Compression file handling utility class"""

    @staticmethod
    def create_zip(
        output_path: str,
        files: List[str],
        base_dir: Optional[str] = None,
        compression: int = zipfile.ZIP_DEFLATED,
        compresslevel: int = 6
    ) -> None:
        """Create ZIP file

        Args:
            output_path: Output ZIP file path
            files: List of files to add
            base_dir: Base directory for calculating relative paths
            compression: Compression method
            compresslevel: Compression level (0-9)
        """
        with zipfile.ZipFile(
            output_path, 'w',
            compression=compression,
            compresslevel=compresslevel
        ) as zf:
            for file in files:
                file_path = Path(file)
                if base_dir:
                    arcname = str(file_path.relative_to(base_dir))
                else:
                    arcname = file_path.name
                zf.write(file, arcname)

    @staticmethod
    def create_tar_gz(
        output_path: str,
        files: List[str],
        base_dir: Optional[str] = None,
        compresslevel: int = 9
    ) -> None:
        """Create TAR.GZ file"""
        with tarfile.open(output_path, 'w:gz', compresslevel=compresslevel) as tf:
            for file in files:
                file_path = Path(file)
                if base_dir:
                    arcname = str(file_path.relative_to(base_dir))
                else:
                    arcname = file_path.name
                tf.add(file, arcname)

    @staticmethod
    def extract_archive(
        archive_path: str,
        output_dir: str,
        members: Optional[List[str]] = None
    ) -> List[str]:
        """Auto-detect format and extract archive file

        Returns:
            List of extracted files
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        extracted_files = []

        if zipfile.is_zipfile(archive_path):
            with zipfile.ZipFile(archive_path, 'r') as zf:
                if members:
                    for member in members:
                        zf.extract(member, output_dir)
                        extracted_files.append(member)
                else:
                    zf.extractall(output_dir)
                    extracted_files = zf.namelist()
        elif tarfile.is_tarfile(archive_path):
            with tarfile.open(archive_path, 'r') as tf:
                if members:
                    for member in members:
                        tf.extract(member, output_dir)
                        extracted_files.append(member)
                else:
                    tf.extractall(output_dir)
                    extracted_files = tf.getnames()
        else:
            raise ValueError(f"Unsupported archive format: {archive_path}")

        return extracted_files

    @staticmethod
    def list_archive_contents(archive_path: str) -> List[dict]:
        """List archive file contents

        Returns:
            List of dictionaries containing file information
        """
        contents = []

        if zipfile.is_zipfile(archive_path):
            with zipfile.ZipFile(archive_path, 'r') as zf:
                for info in zf.infolist():
                    contents.append({
                        'name': info.filename,
                        'size': info.file_size,
                        'compressed_size': info.compress_size,
                        'is_dir': info.is_dir()
                    })
        elif tarfile.is_tarfile(archive_path):
            with tarfile.open(archive_path, 'r') as tf:
                for member in tf.getmembers():
                    contents.append({
                        'name': member.name,
                        'size': member.size,
                        'is_dir': member.isdir(),
                        'mode': oct(member.mode)
                    })
        else:
            raise ValueError(f"Unsupported archive format: {archive_path}")

        return contents

    @staticmethod
    def compress_file(
        input_path: str,
        output_path: Optional[str] = None,
        method: str = 'gzip'
    ) -> str:
        """Compress single file

        Args:
            input_path: Input file path
            output_path: Output file path (optional)
            method: Compression method ('gzip', 'bz2', 'lzma')

        Returns:
            Output file path
        """
        compressors = {
            'gzip': (gzip.open, '.gz'),
            'bz2': (bz2.open, '.bz2'),
            'lzma': (lzma.open, '.xz')
        }

        if method not in compressors:
            raise ValueError(f"Unsupported compression method: {method}")

        open_func, ext = compressors[method]

        if output_path is None:
            output_path = input_path + ext

        with open(input_path, 'rb') as f_in:
            with open_func(output_path, 'wb') as f_out:
                while True:
                    chunk = f_in.read(1024 * 1024)
                    if not chunk:
                        break
                    f_out.write(chunk)

        return output_path

    @staticmethod
    def decompress_file(
        input_path: str,
        output_path: Optional[str] = None
    ) -> str:
        """Decompress single compressed file

        Args:
            input_path: Compressed file path
            output_path: Output file path (optional)

        Returns:
            Output file path
        """
        path = Path(input_path)

        decompressors = {
            '.gz': gzip.open,
            '.bz2': bz2.open,
            '.xz': lzma.open,
            '.lzma': lzma.open
        }

        suffix = path.suffix.lower()
        if suffix not in decompressors:
            raise ValueError(f"Unsupported compression format: {suffix}")

        if output_path is None:
            output_path = str(path.with_suffix(''))

        open_func = decompressors[suffix]

        with open_func(input_path, 'rb') as f_in:
            with open(output_path, 'wb') as f_out:
                while True:
                    chunk = f_in.read(1024 * 1024)
                    if not chunk:
                        break
                    f_out.write(chunk)

        return output_path


# Usage example
if __name__ == '__main__':
    utils = CompressionUtils()

    # Create ZIP file
    utils.create_zip(
        'backup.zip',
        ['file1.txt', 'file2.txt', 'data/config.json'],
        compresslevel=9
    )

    # Create TAR.GZ file
    utils.create_tar_gz(
        'backup.tar.gz',
        ['file1.txt', 'file2.txt']
    )

    # List archive contents
    contents = utils.list_archive_contents('backup.zip')
    for item in contents:
        print(item)

    # Extract archive
    extracted = utils.extract_archive('backup.zip', 'extracted')
    print(f"Extracted {len(extracted)} files")

    # Compress single file
    utils.compress_file('large_file.txt', method='gzip')

    # Decompress single file
    utils.decompress_file('large_file.txt.gz')
```

## Best Practices

### Always Use Context Managers

```python
# Recommended: Use with statement
with zipfile.ZipFile('archive.zip', 'w') as zf:
    zf.write('file.txt')
# File is automatically closed properly

# Not recommended: Manual management
zf = zipfile.ZipFile('archive.zip', 'w')
try:
    zf.write('file.txt')
finally:
    zf.close()
```

### Choose Appropriate Compression Format

```python
# ZIP: Best cross-platform compatibility
# - Use when sharing files across Windows/Mac/Linux
# - Supports random access to individual files
with zipfile.ZipFile('cross_platform.zip', 'w') as zf:
    zf.write('file.txt')

# TAR.GZ: Common on Unix/Linux, preserves more metadata
# - Use for backing up Unix system files (preserves permissions, owner, etc.)
# - Usually slightly better compression ratio than ZIP
with tarfile.open('unix_backup.tar.gz', 'w:gz') as tf:
    tf.add('/etc/nginx', arcname='nginx_config')

# TAR.XZ: Highest compression ratio
# - Use for archive storage, not frequently accessed
# - Slower compression/decompression
with tarfile.open('archive.tar.xz', 'w:xz') as tf:
    tf.add('large_directory')
```

### Handle Large Files with Chunked Reading/Writing

```python
import zipfile

def extract_large_file(zf, member, output_path, chunk_size=1024*1024):
    """Extract large file in chunks, preventing memory overflow"""
    with zf.open(member) as src:
        with open(output_path, 'wb') as dst:
            while True:
                chunk = src.read(chunk_size)
                if not chunk:
                    break
                dst.write(chunk)

with zipfile.ZipFile('large_archive.zip', 'r') as zf:
    for name in zf.namelist():
        extract_large_file(zf, name, f'output/{name}')
```

### Verify Archive Integrity

```python
import zipfile
import tarfile

# ZIP integrity check
def verify_zip(path):
    """Verify ZIP file integrity"""
    try:
        with zipfile.ZipFile(path, 'r') as zf:
            bad_file = zf.testzip()
            if bad_file:
                return False, f"Corrupted file: {bad_file}"
            return True, "ZIP file is complete"
    except zipfile.BadZipFile as e:
        return False, f"Invalid ZIP file: {e}"

# TAR integrity check
def verify_tar(path):
    """Verify TAR file integrity"""
    try:
        with tarfile.open(path, 'r') as tf:
            # Scan all members to check if readable
            for member in tf.getmembers():
                if member.isfile():
                    f = tf.extractfile(member)
                    if f:
                        # Read content to verify
                        while f.read(1024 * 1024):
                            pass
            return True, "TAR file is complete"
    except Exception as e:
        return False, f"TAR file error: {e}"
```

### Use Progress Callbacks

```python
import zipfile
from pathlib import Path

class ProgressZipFile(zipfile.ZipFile):
    """ZipFile with progress callback support"""

    def __init__(self, *args, progress_callback=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.progress_callback = progress_callback
        self._total_size = 0
        self._written_size = 0

    def write(self, filename, arcname=None, compress_type=None, compresslevel=None):
        file_size = Path(filename).stat().st_size
        super().write(filename, arcname, compress_type, compresslevel)
        self._written_size += file_size
        if self.progress_callback:
            self.progress_callback(filename, file_size, self._written_size)

def print_progress(filename, size, total):
    print(f"Added: {filename} ({size} bytes), Total: {total} bytes")

# Usage example
with ProgressZipFile('archive.zip', 'w', progress_callback=print_progress) as zf:
    zf.write('file1.txt')
    zf.write('file2.txt')
```

## Common Pitfalls

### Path Traversal Attack

```python
import zipfile
from pathlib import Path

# Dangerous: Direct extraction can write files anywhere
# Malicious ZIP may contain paths like "../../../etc/passwd"

# Safe extraction method
def safe_extract_all(zf, target_dir):
    """Safely extract all files"""
    target = Path(target_dir).resolve()

    for member in zf.namelist():
        # Normalize path
        member_path = target / member

        # Ensure target path is within target directory
        try:
            member_path.resolve().relative_to(target)
        except ValueError:
            raise ValueError(f"Illegal path: {member}")

    # Extract after verification passes
    zf.extractall(target_dir)
```

### Forgetting to Handle Directory Entries

```python
import zipfile
import tarfile

# ZIP uses / suffix to indicate directories
with zipfile.ZipFile('archive.zip', 'r') as zf:
    for name in zf.namelist():
        if name.endswith('/'):
            print(f"Directory: {name}")
        else:
            print(f"File: {name}")

# TAR uses isdir() method
with tarfile.open('archive.tar.gz', 'r') as tf:
    for member in tf.getmembers():
        if member.isdir():
            print(f"Directory: {member.name}")
        elif member.isfile():
            print(f"File: {member.name}")
        elif member.issym():
            print(f"Symlink: {member.name} -> {member.linkname}")
```

### Encoding Issues

```python
import zipfile

# ZIP file name encoding issues
with zipfile.ZipFile('archive.zip', 'r') as zf:
    for info in zf.infolist():
        # Check if UTF-8 is used
        if info.flag_bits & 0x800:
            # UTF-8 encoding
            name = info.filename
        else:
            # May be CP437 or system default encoding
            try:
                name = info.filename.encode('cp437').decode('gbk')
            except:
                name = info.filename
        print(name)

# Ensure UTF-8 when creating ZIP
with zipfile.ZipFile('archive.zip', 'w') as zf:
    # Python 3.11+ uses UTF-8 by default
    zf.write('chinese_filename.txt')
```

### Not Handling Empty Archives

```python
import zipfile
import tarfile

# Empty ZIP is still valid
with zipfile.ZipFile('empty.zip', 'w') as zf:
    pass  # No files added

# Check if empty when reading
with zipfile.ZipFile('archive.zip', 'r') as zf:
    if not zf.namelist():
        print("Warning: This is an empty archive")
```

### Symlink Handling

```python
import tarfile
from pathlib import Path

# TAR may contain symlinks, potentially causing security issues
with tarfile.open('archive.tar.gz', 'r') as tf:
    for member in tf.getmembers():
        if member.issym():
            # Check if symlink target is safe
            target = Path(member.linkname)
            if target.is_absolute():
                print(f"Warning: Absolute symlink {member.name} -> {member.linkname}")
            elif '..' in str(target):
                print(f"Warning: Traversal symlink {member.name} -> {member.linkname}")
```

## Performance Considerations

### Compression Level vs Performance Tradeoff

```python
import zipfile
import tarfile
import time
from pathlib import Path

def benchmark_compression(file_path, levels):
    """Test compression performance at different levels"""
    original_size = Path(file_path).stat().st_size

    results = []
    for level in levels:
        # ZIP compression
        start = time.time()
        with zipfile.ZipFile(
            f'test_level_{level}.zip', 'w',
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=level
        ) as zf:
            zf.write(file_path)

        elapsed = time.time() - start
        compressed_size = Path(f'test_level_{level}.zip').stat().st_size

        results.append({
            'level': level,
            'time': elapsed,
            'size': compressed_size,
            'ratio': compressed_size / original_size * 100
        })

    return results

# Compression level recommendations:
# - Levels 1-3: Fast compression, suitable for real-time scenarios
# - Level 6 (default): Balance compression ratio and speed
# - Level 9: Highest compression ratio, suitable for archive storage
```

### Stream Processing Large Archives

```python
import tarfile

# Use stream mode for large files
# Mode 'r|gz' means stream read, no seeking required
# More memory efficient than 'r:gz', but only sequential access

def stream_process_tar(archive_path, process_func):
    """Stream process TAR archive"""
    with tarfile.open(archive_path, 'r|gz') as tf:
        for member in tf:
            if member.isfile():
                f = tf.extractfile(member)
                if f:
                    process_func(member.name, f)

def my_processor(name, file_obj):
    """Process individual file"""
    # Read in chunks, avoiding large memory usage
    total_size = 0
    while True:
        chunk = file_obj.read(1024 * 1024)
        if not chunk:
            break
        total_size += len(chunk)
        # Process data...
    print(f"Processing complete: {name} ({total_size} bytes)")

stream_process_tar('large_archive.tar.gz', my_processor)
```

### Parallel Compression

```python
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import os

def parallel_create_zip(output_path, files, max_workers=4):
    """Create ZIP file in parallel (suitable for many small files)"""

    def compress_file(file_path):
        """Compress individual file to temporary ZIP"""
        temp_fd, temp_path = tempfile.mkstemp(suffix='.zip')
        os.close(temp_fd)

        with zipfile.ZipFile(temp_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(file_path, Path(file_path).name)

        return temp_path, Path(file_path).name

    # Parallel file compression
    temp_zips = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(compress_file, f) for f in files]
        for future in futures:
            temp_zips.append(future.result())

    # Merge into final ZIP
    with zipfile.ZipFile(output_path, 'w') as final_zf:
        for temp_path, name in temp_zips:
            with zipfile.ZipFile(temp_path, 'r') as temp_zf:
                data = temp_zf.read(name)
                final_zf.writestr(name, data)
            os.unlink(temp_path)

# Usage example
files = list(Path('data').glob('*.txt'))
parallel_create_zip('parallel.zip', files)
```

### Memory Mapping for Huge Files

```python
import mmap
import zipfile
from pathlib import Path

def create_zip_with_mmap(output_path, large_file_path):
    """Use memory mapping to handle huge files"""
    file_path = Path(large_file_path)

    with open(large_file_path, 'rb') as f:
        # Create memory map
        with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mm:
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                # Create ZipInfo
                info = zipfile.ZipInfo(file_path.name)
                info.compress_type = zipfile.ZIP_DEFLATED

                # Write in chunks
                with zf.open(info, 'w') as dest:
                    chunk_size = 1024 * 1024 * 10  # 10MB
                    offset = 0
                    while offset < len(mm):
                        chunk = mm[offset:offset + chunk_size]
                        dest.write(chunk)
                        offset += chunk_size
```

## Real-World Scenarios

### Scenario 1: Automatic Backup Tool

```python
import zipfile
import tarfile
from pathlib import Path
from datetime import datetime
import logging
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BackupManager:
    """Automatic backup manager"""

    def __init__(self, backup_dir: str):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(
        self,
        source_dirs: list,
        backup_name: str = None,
        format: str = 'zip',
        exclude_patterns: list = None
    ) -> Path:
        """Create backup

        Args:
            source_dirs: List of directories to backup
            backup_name: Backup file name (without extension)
            format: Backup format ('zip' or 'tar.gz')
            exclude_patterns: File patterns to exclude

        Returns:
            Backup file path
        """
        if backup_name is None:
            backup_name = datetime.now().strftime('backup_%Y%m%d_%H%M%S')

        exclude_patterns = exclude_patterns or ['*.pyc', '__pycache__', '.git']

        if format == 'zip':
            backup_path = self.backup_dir / f'{backup_name}.zip'
            self._create_zip_backup(backup_path, source_dirs, exclude_patterns)
        elif format == 'tar.gz':
            backup_path = self.backup_dir / f'{backup_name}.tar.gz'
            self._create_tar_backup(backup_path, source_dirs, exclude_patterns)
        else:
            raise ValueError(f"Unsupported format: {format}")

        # Calculate checksum
        checksum = self._calculate_checksum(backup_path)
        checksum_path = backup_path.with_suffix(backup_path.suffix + '.sha256')
        checksum_path.write_text(f"{checksum}  {backup_path.name}\n")

        logger.info(f"Backup complete: {backup_path}")
        logger.info(f"Checksum: {checksum}")

        return backup_path

    def _should_exclude(self, path: Path, patterns: list) -> bool:
        """Check if file should be excluded"""
        name = path.name
        for pattern in patterns:
            if pattern.startswith('*'):
                if name.endswith(pattern[1:]):
                    return True
            elif name == pattern:
                return True
        return False

    def _create_zip_backup(self, backup_path, source_dirs, exclude_patterns):
        """Create ZIP backup"""
        with zipfile.ZipFile(
            backup_path, 'w',
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=6
        ) as zf:
            for source_dir in source_dirs:
                source = Path(source_dir)
                if not source.exists():
                    logger.warning(f"Directory not found: {source}")
                    continue

                for file_path in source.rglob('*'):
                    if file_path.is_file():
                        if self._should_exclude(file_path, exclude_patterns):
                            continue

                        arcname = str(file_path.relative_to(source.parent))
                        zf.write(file_path, arcname)
                        logger.debug(f"Added: {arcname}")

    def _create_tar_backup(self, backup_path, source_dirs, exclude_patterns):
        """Create TAR.GZ backup"""
        def filter_func(tarinfo):
            if self._should_exclude(Path(tarinfo.name), exclude_patterns):
                return None
            return tarinfo

        with tarfile.open(backup_path, 'w:gz', compresslevel=6) as tf:
            for source_dir in source_dirs:
                source = Path(source_dir)
                if not source.exists():
                    logger.warning(f"Directory not found: {source}")
                    continue

                tf.add(source, arcname=source.name, filter=filter_func)

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate file SHA256 checksum"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                sha256.update(chunk)
        return sha256.hexdigest()

    def restore_backup(self, backup_path: str, target_dir: str) -> list:
        """Restore backup

        Args:
            backup_path: Backup file path
            target_dir: Target directory for restoration

        Returns:
            List of restored files
        """
        backup_path = Path(backup_path)
        target_dir = Path(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)

        # Verify checksum
        checksum_path = backup_path.with_suffix(backup_path.suffix + '.sha256')
        if checksum_path.exists():
            expected_checksum = checksum_path.read_text().split()[0]
            actual_checksum = self._calculate_checksum(backup_path)
            if expected_checksum != actual_checksum:
                raise ValueError("Checksum mismatch, backup file may be corrupted")
            logger.info("Checksum verification passed")

        # Extract backup
        restored_files = []
        if zipfile.is_zipfile(backup_path):
            with zipfile.ZipFile(backup_path, 'r') as zf:
                zf.extractall(target_dir)
                restored_files = zf.namelist()
        elif tarfile.is_tarfile(backup_path):
            with tarfile.open(backup_path, 'r') as tf:
                tf.extractall(target_dir)
                restored_files = tf.getnames()

        logger.info(f"Restoration complete: {len(restored_files)} files")
        return restored_files

    def list_backups(self) -> list:
        """List all backups"""
        backups = []
        for path in self.backup_dir.glob('*'):
            if path.suffix in ['.zip', '.gz']:
                backups.append({
                    'path': path,
                    'name': path.name,
                    'size': path.stat().st_size,
                    'mtime': datetime.fromtimestamp(path.stat().st_mtime)
                })
        return sorted(backups, key=lambda x: x['mtime'], reverse=True)


# Usage example
if __name__ == '__main__':
    manager = BackupManager('/tmp/backups')

    # Create backup
    backup_path = manager.create_backup(
        source_dirs=['src', 'config'],
        format='zip',
        exclude_patterns=['*.pyc', '__pycache__', '.git', '*.log']
    )

    # List backups
    for backup in manager.list_backups():
        print(f"{backup['name']} - {backup['size']} bytes - {backup['mtime']}")

    # Restore backup
    manager.restore_backup(backup_path, '/tmp/restored')
```

### Scenario 2: Log Archiving System

```python
import gzip
import tarfile
from pathlib import Path
from datetime import datetime, timedelta
import shutil
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LogArchiver:
    """Log archiving system"""

    def __init__(self, log_dir: str, archive_dir: str):
        self.log_dir = Path(log_dir)
        self.archive_dir = Path(archive_dir)
        self.archive_dir.mkdir(parents=True, exist_ok=True)

    def compress_old_logs(self, days_old: int = 7) -> list:
        """Compress log files older than specified days

        Args:
            days_old: Compress logs older than this many days

        Returns:
            List of compressed files
        """
        cutoff_date = datetime.now() - timedelta(days=days_old)
        compressed_files = []

        for log_file in self.log_dir.glob('*.log'):
            # Check file modification time
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            if mtime < cutoff_date:
                # Compress file
                gz_path = log_file.with_suffix('.log.gz')

                with open(log_file, 'rb') as f_in:
                    with gzip.open(gz_path, 'wb', compresslevel=9) as f_out:
                        shutil.copyfileobj(f_in, f_out)

                # Delete original file
                log_file.unlink()
                compressed_files.append(gz_path)
                logger.info(f"Compressed: {log_file.name} -> {gz_path.name}")

        return compressed_files

    def archive_monthly_logs(self) -> Path:
        """Archive previous month's logs to single TAR.GZ file

        Returns:
            Archive file path
        """
        # Calculate previous month date range
        today = datetime.now()
        if today.month == 1:
            last_month = 12
            year = today.year - 1
        else:
            last_month = today.month - 1
            year = today.year

        archive_name = f"logs_{year}_{last_month:02d}.tar.gz"
        archive_path = self.archive_dir / archive_name

        # Find previous month's log files
        pattern = f"*_{year}-{last_month:02d}*.log*"
        log_files = list(self.log_dir.glob(pattern))

        if not log_files:
            logger.info(f"No log files found for {year}-{last_month:02d}")
            return None

        # Create archive
        with tarfile.open(archive_path, 'w:gz', compresslevel=9) as tf:
            for log_file in log_files:
                tf.add(log_file, arcname=log_file.name)
                logger.info(f"Archived: {log_file.name}")

        # Delete archived files
        for log_file in log_files:
            log_file.unlink()

        logger.info(f"Monthly archive complete: {archive_path}")
        return archive_path

    def extract_logs_for_date(self, date: datetime, output_dir: str) -> list:
        """Extract logs for specific date from archive

        Args:
            date: Target date
            output_dir: Output directory

        Returns:
            List of extracted files
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Find corresponding archive file
        archive_name = f"logs_{date.year}_{date.month:02d}.tar.gz"
        archive_path = self.archive_dir / archive_name

        if not archive_path.exists():
            logger.warning(f"Archive file not found: {archive_path}")
            return []

        # Date pattern
        date_pattern = date.strftime('%Y-%m-%d')
        extracted_files = []

        with tarfile.open(archive_path, 'r:gz') as tf:
            for member in tf.getmembers():
                if date_pattern in member.name:
                    tf.extract(member, output_path)
                    extracted_files.append(member.name)
                    logger.info(f"Extracted: {member.name}")

        return extracted_files

    def cleanup_old_archives(self, months_to_keep: int = 12):
        """Clean up archives older than specified months

        Args:
            months_to_keep: Keep archives from this many months
        """
        cutoff_date = datetime.now() - timedelta(days=months_to_keep * 30)

        for archive in self.archive_dir.glob('logs_*.tar.gz'):
            # Parse archive date
            try:
                parts = archive.stem.replace('logs_', '').split('_')
                archive_date = datetime(int(parts[0]), int(parts[1]), 1)

                if archive_date < cutoff_date:
                    archive.unlink()
                    logger.info(f"Deleted old archive: {archive.name}")
            except (ValueError, IndexError):
                logger.warning(f"Unable to parse archive date: {archive.name}")


# Usage example
if __name__ == '__main__':
    archiver = LogArchiver('/var/log/myapp', '/var/log/myapp/archives')

    # Compress logs older than 7 days
    archiver.compress_old_logs(days_old=7)

    # Archive previous month's logs
    archiver.archive_monthly_logs()

    # Extract logs for specific date
    archiver.extract_logs_for_date(
        datetime(2024, 1, 15),
        '/tmp/extracted_logs'
    )

    # Clean up archives older than 12 months
    archiver.cleanup_old_archives(months_to_keep=12)
```

### Scenario 3: Software Release Packaging Tool

```python
import zipfile
import tarfile
import json
import hashlib
from pathlib import Path
from datetime import datetime
import platform


class ReleasePackager:
    """Software release packaging tool"""

    def __init__(self, project_dir: str, output_dir: str):
        self.project_dir = Path(project_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def create_release(
        self,
        version: str,
        include_patterns: list = None,
        exclude_patterns: list = None,
        platforms: list = None
    ) -> dict:
        """Create release packages

        Args:
            version: Version number
            include_patterns: File patterns to include
            exclude_patterns: File patterns to exclude
            platforms: Target platforms ['windows', 'linux', 'macos']

        Returns:
            Release information dictionary
        """
        include_patterns = include_patterns or ['**/*.py', '**/*.json', '**/*.txt']
        exclude_patterns = exclude_patterns or [
            '*.pyc', '__pycache__', '.git', '.venv',
            'tests', '*.egg-info', 'dist', 'build'
        ]
        platforms = platforms or ['windows', 'linux']

        release_info = {
            'version': version,
            'created_at': datetime.now().isoformat(),
            'packages': []
        }

        # Collect files to package
        files_to_include = self._collect_files(include_patterns, exclude_patterns)

        # Create packages for each platform
        for plat in platforms:
            package_info = self._create_platform_package(
                version, plat, files_to_include
            )
            release_info['packages'].append(package_info)

        # Save release information
        release_json = self.output_dir / f'release_{version}.json'
        release_json.write_text(json.dumps(release_info, indent=2))

        return release_info

    def _collect_files(self, include_patterns, exclude_patterns) -> list:
        """Collect files to package"""
        files = set()

        for pattern in include_patterns:
            for path in self.project_dir.glob(pattern):
                if path.is_file():
                    # Check if should exclude
                    should_exclude = False
                    for exc_pattern in exclude_patterns:
                        if exc_pattern in str(path):
                            should_exclude = True
                            break

                    if not should_exclude:
                        files.add(path)

        return sorted(files)

    def _create_platform_package(
        self,
        version: str,
        platform_name: str,
        files: list
    ) -> dict:
        """Create package for specific platform"""

        if platform_name == 'windows':
            # Windows uses ZIP
            package_name = f"myapp_{version}_windows.zip"
            package_path = self.output_dir / package_name

            with zipfile.ZipFile(
                package_path, 'w',
                compression=zipfile.ZIP_DEFLATED,
                compresslevel=9
            ) as zf:
                for file_path in files:
                    arcname = str(file_path.relative_to(self.project_dir))
                    zf.write(file_path, arcname)

                # Add version information
                zf.writestr('VERSION', version)

        else:
            # Linux/macOS use TAR.GZ
            package_name = f"myapp_{version}_{platform_name}.tar.gz"
            package_path = self.output_dir / package_name

            with tarfile.open(package_path, 'w:gz', compresslevel=9) as tf:
                for file_path in files:
                    arcname = str(file_path.relative_to(self.project_dir))
                    tf.add(file_path, arcname)

                # Add version information
                import io
                version_data = version.encode('utf-8')
                info = tarfile.TarInfo(name='VERSION')
                info.size = len(version_data)
                tf.addfile(info, io.BytesIO(version_data))

        # Calculate checksum
        sha256 = hashlib.sha256()
        with open(package_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)

        return {
            'platform': platform_name,
            'filename': package_name,
            'size': package_path.stat().st_size,
            'sha256': sha256.hexdigest()
        }

    def verify_release(self, release_json_path: str) -> bool:
        """Verify release package integrity"""
        release_info = json.loads(Path(release_json_path).read_text())

        all_valid = True
        for package in release_info['packages']:
            package_path = self.output_dir / package['filename']

            if not package_path.exists():
                print(f"File not found: {package['filename']}")
                all_valid = False
                continue

            # Verify checksum
            sha256 = hashlib.sha256()
            with open(package_path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    sha256.update(chunk)

            if sha256.hexdigest() == package['sha256']:
                print(f"Verification passed: {package['filename']}")
            else:
                print(f"Checksum mismatch: {package['filename']}")
                all_valid = False

        return all_valid


# Usage example
if __name__ == '__main__':
    packager = ReleasePackager('/path/to/project', '/path/to/releases')

    # Create release packages
    release_info = packager.create_release(
        version='1.0.0',
        include_patterns=['src/**/*.py', 'config/**/*.json', 'README.md'],
        exclude_patterns=['*.pyc', '__pycache__', 'tests'],
        platforms=['windows', 'linux', 'macos']
    )

    print(f"Created {len(release_info['packages'])} release packages")

    # Verify release packages
    packager.verify_release('/path/to/releases/release_1.0.0.json')
```

## Interview Questions

### What are the main differences between zipfile and tarfile?

**Answer:**
- **Format Characteristics**: ZIP is a compressed archive format, TAR is a pure archive format (requiring gzip/bz2/xz compression)
- **Random Access**: ZIP supports random access to individual files, TAR requires sequential scanning
- **Metadata**: TAR preserves more Unix file system metadata (permissions, owner, symlinks, etc.)
- **Platform Compatibility**: ZIP is more universal on Windows, TAR is more common on Unix/Linux
- **Use Cases**: ZIP is better for cross-platform sharing, TAR.GZ is better for Unix system backups

### How to safely extract untrusted archive files?

**Answer:**
```python
import zipfile
from pathlib import Path

def safe_extract(archive_path, target_dir):
    """Safely extract archive file"""
    target = Path(target_dir).resolve()
    target.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(archive_path, 'r') as zf:
        for member in zf.namelist():
            # 1. Check for path traversal attack
            member_path = target / member
            if not str(member_path.resolve()).startswith(str(target)):
                raise ValueError(f"Illegal path: {member}")

            # 2. Check file size (prevent zip bomb)
            info = zf.getinfo(member)
            if info.file_size > 100 * 1024 * 1024:  # 100MB limit
                raise ValueError(f"File too large: {member}")

            # 3. Check compression ratio (prevent high compression ratio bomb)
            if info.compress_size > 0:
                ratio = info.file_size / info.compress_size
                if ratio > 100:  # Compression ratio exceeds 100:1
                    raise ValueError(f"Suspicious compression ratio: {member}")

        zf.extractall(target)
```

Key points:
- Prevent path traversal attacks
- Limit file size
- Check compression ratio (prevent zip bomb)
- For TAR, also watch for symlink attacks

### How to handle large file compression/decompression memory issues?

**Answer:**
```python
# Chunked processing
def compress_large_file(input_path, output_path, chunk_size=1024*1024):
    import gzip

    with open(input_path, 'rb') as f_in:
        with gzip.open(output_path, 'wb') as f_out:
            while True:
                chunk = f_in.read(chunk_size)
                if not chunk:
                    break
                f_out.write(chunk)

# Stream processing TAR
with tarfile.open('large.tar.gz', 'r|gz') as tf:  # Use '|' stream mode
    for member in tf:
        if member.isfile():
            f = tf.extractfile(member)
            # Process in chunks
```

Key techniques:
- Chunked read/write
- Use stream mode (TAR's `r|gz` instead of `r:gz`)
- Avoid loading entire file into memory at once

### Compare different compression algorithms?

**Answer:**

| Algorithm | Compression Ratio | Speed | Memory | Use Cases |
|-----------|-------------------|-------|--------|-----------|
| DEFLATE (ZIP) | Medium | Fast | Low | General purpose |
| GZIP | Medium | Fast | Low | Single file compression |
| BZ2 | High | Slow | Higher | High compression ratio needed |
| LZMA/XZ | Highest | Slowest | High | Archive storage |
| ZSTD | High | Fast | Medium | Modern alternative |

Selection recommendations:
- Daily use: GZIP/ZIP (balanced)
- Network transfer: GZIP (fast)
- Long-term storage: XZ (highest compression)
- High performance: ZSTD (requires third-party library)

### How to create encrypted ZIP files?

**Answer:**
```python
# Python standard library zipfile only supports decryption, not creation of encrypted ZIP
# Need third-party library pyzipper

import pyzipper

# Create encrypted ZIP
with pyzipper.AESZipFile('encrypted.zip', 'w',
                          compression=pyzipper.ZIP_DEFLATED,
                          encryption=pyzipper.WZ_AES) as zf:
    zf.setpassword(b'secret123')
    zf.write('sensitive.txt')

# Extract encrypted ZIP (standard library can also do this)
import zipfile
with zipfile.ZipFile('encrypted.zip', 'r') as zf:
    zf.extractall(pwd=b'secret123')
```

Important notes:
- Standard library zipfile only supports traditional PKZIP encryption (insecure)
- Recommend using AES-256 encryption
- For sensitive data, consider additional encryption before compression

## Further Reading

### Official Documentation
- [zipfile - Python Official Documentation](https://docs.python.org/3/library/zipfile.html)
- [tarfile - Python Official Documentation](https://docs.python.org/3/library/tarfile.html)
- [gzip - Python Official Documentation](https://docs.python.org/3/library/gzip.html)
- [bz2 - Python Official Documentation](https://docs.python.org/3/library/bz2.html)
- [lzma - Python Official Documentation](https://docs.python.org/3/library/lzma.html)

### Compression Format Specifications
- [ZIP File Format Specification](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- [TAR File Format](https://www.gnu.org/software/tar/manual/html_node/Standard.html)
- [GZIP File Format Specification (RFC 1952)](https://tools.ietf.org/html/rfc1952)

### Third-Party Libraries
- [pyzipper](https://github.com/danifus/pyzipper) - ZIP library with AES encryption support
- [py7zr](https://github.com/miurahr/py7zr) - 7z format support
- [rarfile](https://github.com/markokr/rarfile) - RAR format support
- [zstandard](https://github.com/indygreg/python-zstandard) - Zstandard compression support

### Security Resources
- [ZIP Bomb Attack Principles and Prevention](https://en.wikipedia.org/wiki/Zip_bomb)
- [TAR Path Traversal Vulnerability (CVE-2007-4559)](https://nvd.nist.gov/vuln/detail/CVE-2007-4559)
- [Python tarfile Safe Extraction Filter (PEP 706)](https://peps.python.org/pep-0706/)
