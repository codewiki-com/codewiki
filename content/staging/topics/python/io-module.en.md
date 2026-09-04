---
title: io模块：内存流与文件对象
description: 深入解析Python io模块，掌握StringIO、BytesIO、BufferedReader/Writer、TextIOWrapper等内存流操作
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - io
  - StringIO
  - BytesIO
  - 文件对象
  - 内存流
  - 缓冲IO
status: imported
origin: old/src/content/docs/python/io-module.en.md
divergence: 0.192
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 标准库
  order: 17
  lastUpdated: 2026-01-07
---

The `io` module is Python's core module for handling stream-based I/O, providing the main functionality for processing various types of I/O. It defines three main I/O types: text I/O, binary I/O, and raw I/O. The most commonly used are `StringIO` and `BytesIO`, which allow you to manipulate data in memory as if it were a file.

## Concept Explanation

### What is an In-Memory Stream

An In-Memory Stream is a technique for treating a memory buffer as a file. Unlike disk files, in-memory stream data is stored entirely in RAM, making read/write operations extremely fast. This makes them ideal for temporary data processing, test mocking, and scenarios where you need a file interface without actually performing disk I/O.

```python
from io import StringIO, BytesIO

# StringIO - in-memory stream for text data
text_stream = StringIO("Hello, World!")
print(text_stream.read())  # Hello, World!

# BytesIO - in-memory stream for binary data
binary_stream = BytesIO(b"\x89PNG\r\n\x1a\n")
print(binary_stream.read())  # b'\x89PNG\r\n\x1a\n'
```

### File Object Protocol

A "file object" (file-like object) in Python is an object that follows a specific protocol, implementing methods like `read()`, `write()`, `seek()`, etc. All stream classes in the `io` module follow this protocol, so they can be used anywhere a file object is expected.

```python
from io import StringIO

def process_file(file_obj):
    """This function accepts any file object"""
    return file_obj.read().upper()

# Can pass a real file
with open("data.txt") as f:
    result = process_file(f)

# Can also pass an in-memory stream
stream = StringIO("hello world")
result = process_file(stream)
print(result)  # HELLO WORLD
```

### io Module I/O Hierarchy

The `io` module uses a layered architecture design:

| Layer | Type | Main Classes | Description |
|-------|------|--------------|-------------|
| High | Text I/O | `TextIOWrapper`, `StringIO` | Handles str objects |
| Middle | Buffered Binary I/O | `BufferedReader`, `BufferedWriter`, `BytesIO` | Handles bytes with buffering |
| Low | Raw Binary I/O | `FileIO`, `RawIOBase` | Direct raw byte operations |

## Core Principles

### How StringIO Works

`StringIO` internally maintains a string buffer and a position pointer. All operations are performed on this buffer without any file system calls.

```python
from io import StringIO

# Create StringIO object
stream = StringIO()

# Write data - stored in memory buffer
stream.write("Line 1\n")
stream.write("Line 2\n")

# Position pointer is now at the end
print(f"Current position: {stream.tell()}")  # 14

# Need to move position pointer back to the beginning before reading
stream.seek(0)
print(stream.read())  # Line 1\nLine 2\n

# Get complete buffer content (not affected by position pointer)
print(stream.getvalue())  # Line 1\nLine 2\n
```

### How BytesIO Works

`BytesIO` is similar to `StringIO`, but handles binary data (`bytes` type):

```python
from io import BytesIO

# Create BytesIO object
stream = BytesIO()

# Write binary data
stream.write(b"\x00\x01\x02\x03")
stream.write(b"\x04\x05\x06\x07")

# Get current position
print(f"Current position: {stream.tell()}")  # 8

# Move to beginning to read
stream.seek(0)
data = stream.read(4)
print(data)  # b'\x00\x01\x02\x03'

# Get complete content
print(stream.getvalue())  # b'\x00\x01\x02\x03\x04\x05\x06\x07'
```

### Buffered I/O Principles

Buffered I/O classes (such as `BufferedReader`, `BufferedWriter`) add a buffer layer between raw I/O and the application, reducing system calls and improving performance:

```python
from io import BufferedReader, FileIO

# Wrap raw file I/O with buffered reader
raw_file = FileIO("large_file.bin", "rb")
buffered = BufferedReader(raw_file, buffer_size=8192)

# Read operations first get data from the buffer
# Only reads from the underlying file when buffer is empty
data = buffered.read(100)
buffered.close()
```

### TextIOWrapper Principles

`TextIOWrapper` is a wrapper that provides a text interface on top of a binary stream, handling character encoding and decoding:

```python
from io import TextIOWrapper, BytesIO

# Create binary stream
binary_stream = BytesIO(b"\xe4\xb8\xad\xe6\x96\x87")  # UTF-8 encoded "中文"

# Wrap with TextIOWrapper, specifying encoding
text_stream = TextIOWrapper(binary_stream, encoding="utf-8")

# Now you can read text
print(text_stream.read())  # 中文
```

## Key Points

### StringIO Core API

```python
from io import StringIO

# Creation methods
stream = StringIO()           # Empty StringIO
stream = StringIO("initial")  # With initial content

# Write operations
stream.write("text")          # Write string, returns character count
stream.writelines(["a", "b"]) # Write list of strings

# Read operations
stream.read()                 # Read all content
stream.read(10)               # Read specified number of characters
stream.readline()             # Read one line
stream.readlines()            # Read all lines, returns list

# Position operations
stream.tell()                 # Get current position
stream.seek(0)                # Move to beginning
stream.seek(0, 2)             # Move to end

# Special methods
stream.getvalue()             # Get complete content (not affected by position)
stream.truncate()             # Truncate to current position
stream.truncate(10)           # Truncate to specified position
stream.close()                # Close the stream

# State checks
stream.readable()             # Is readable
stream.writable()             # Is writable
stream.seekable()             # Is seekable
stream.closed                 # Is closed
```

### BytesIO Core API

```python
from io import BytesIO

# Creation methods
stream = BytesIO()              # Empty BytesIO
stream = BytesIO(b"initial")    # With initial content

# Write operations
stream.write(b"bytes")          # Write bytes, returns byte count
stream.writelines([b"a", b"b"]) # Write list of bytes

# Read operations
stream.read()                   # Read all content
stream.read(10)                 # Read specified number of bytes
stream.read1(10)                # Read at most specified bytes (may be less)
stream.readline()               # Read one line
stream.readlines()              # Read all lines

# Buffer operations
stream.getbuffer()              # Get writable buffer view
stream.getvalue()               # Get complete content

# Position operations (same as StringIO)
stream.tell()
stream.seek(0)
stream.seek(0, 2)
```

### seek() Method Details

The `seek(offset, whence)` method is used to move the position pointer:

| whence Parameter | Constant | Description |
|------------------|----------|-------------|
| 0 | `SEEK_SET` | From the beginning (default) |
| 1 | `SEEK_CUR` | From current position |
| 2 | `SEEK_END` | From the end |

```python
from io import StringIO, SEEK_SET, SEEK_CUR, SEEK_END

stream = StringIO("0123456789")

# Move from beginning
stream.seek(5, SEEK_SET)  # Move to position 5
print(stream.read(1))     # '5'

# Move from current position
stream.seek(2, SEEK_CUR)  # Move forward 2 positions
print(stream.read(1))     # '8'

# Move from end
stream.seek(-3, SEEK_END) # 3 positions back from end
print(stream.read())      # '789'
```

**Note**: `StringIO` does not support non-zero offsets when `whence=1` or `whence=2` (because character width is not fixed). `BytesIO` fully supports this.

### Buffered I/O Classes

```python
from io import BufferedReader, BufferedWriter, BufferedRandom, BufferedRWPair

# BufferedReader - buffered reading
# Used to wrap readable raw streams
reader = BufferedReader(raw_stream, buffer_size=8192)

# BufferedWriter - buffered writing
# Used to wrap writable raw streams
writer = BufferedWriter(raw_stream, buffer_size=8192)

# BufferedRandom - buffered random access
# Used to wrap readable and writable raw streams
random_access = BufferedRandom(raw_stream)

# BufferedRWPair - buffered read-write pair
# Used to wrap a pair of independent read/write streams (like sockets)
rw_pair = BufferedRWPair(reader_stream, writer_stream)
```

### TextIOWrapper Details

```python
from io import TextIOWrapper, BytesIO

binary_stream = BytesIO()

# Full parameters
text_stream = TextIOWrapper(
    binary_stream,
    encoding="utf-8",           # Character encoding
    errors="strict",            # Error handling: strict/ignore/replace/...
    newline=None,               # Newline handling
    line_buffering=False,       # Line buffering
    write_through=False         # Write-through mode
)

# newline parameter explanation:
# None     - Universal newline mode (converts on read, uses system default on write)
# ""       - Don't convert newlines
# "\n"     - Use \n as newline
# "\r\n"   - Use \r\n as newline
# "\r"     - Use \r as newline
```

## Code Examples

### Basic Example: Using StringIO

```python
from io import StringIO
import csv

# Example 1: Read a string as a file
data = """name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago"""

stream = StringIO(data)

# Use csv module to read
reader = csv.DictReader(stream)
for row in reader:
    print(f"{row['name']} is {row['age']} years old")

# Example 2: Collect output to a string
output = StringIO()

# Simulate file writing
output.write("Report Title\n")
output.write("=" * 20 + "\n")
for i in range(3):
    output.write(f"Item {i + 1}: Value {i * 100}\n")

# Get complete content
result = output.getvalue()
print(result)

# Example 3: Redirect standard output
import sys

old_stdout = sys.stdout
sys.stdout = StringIO()

# These print outputs will be captured
print("This is captured")
print("So is this")

captured = sys.stdout.getvalue()
sys.stdout = old_stdout

print(f"Captured output:\n{captured}")
```

### Basic Example: Using BytesIO

```python
from io import BytesIO
import struct

# Example 1: Handle binary data
buffer = BytesIO()

# Write structured binary data
buffer.write(struct.pack(">I", 12345))      # 4-byte unsigned integer (big-endian)
buffer.write(struct.pack(">f", 3.14159))    # 4-byte float (big-endian)
buffer.write(b"Hello\x00")                  # C-style string

# Read
buffer.seek(0)
num = struct.unpack(">I", buffer.read(4))[0]
flt = struct.unpack(">f", buffer.read(4))[0]
string = buffer.read(6).rstrip(b"\x00").decode()

print(f"Number: {num}, Float: {flt:.5f}, String: {string}")

# Example 2: Handle image data
from PIL import Image  # Requires pip install Pillow

# Create simple image
img = Image.new("RGB", (100, 100), color="red")

# Save to memory instead of file
img_buffer = BytesIO()
img.save(img_buffer, format="PNG")

# Get binary data
img_bytes = img_buffer.getvalue()
print(f"Image size: {len(img_bytes)} bytes")

# Load image from memory
img_buffer.seek(0)
loaded_img = Image.open(img_buffer)
print(f"Loaded image size: {loaded_img.size}")

# Example 3: Handle ZIP files
import zipfile

zip_buffer = BytesIO()

# Create ZIP file in memory
with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("file1.txt", "Content of file 1")
    zf.writestr("file2.txt", "Content of file 2")
    zf.writestr("folder/file3.txt", "Content in folder")

# Get ZIP data
zip_data = zip_buffer.getvalue()
print(f"ZIP size: {len(zip_data)} bytes")

# Read ZIP from memory
zip_buffer.seek(0)
with zipfile.ZipFile(zip_buffer, "r") as zf:
    print(f"Files in ZIP: {zf.namelist()}")
```

### Advanced Example: TextIOWrapper Usage

```python
from io import BytesIO, TextIOWrapper

# Example 1: Handle different encodings
def convert_encoding(data, from_encoding, to_encoding):
    """Convert text encoding"""
    # Create source stream
    source = BytesIO(data)
    source_text = TextIOWrapper(source, encoding=from_encoding)

    # Read and re-encode
    text = source_text.read()

    # Create target stream
    target = BytesIO()
    target_text = TextIOWrapper(target, encoding=to_encoding)

    # Write with new encoding
    target_text.write(text)
    target_text.flush()  # Ensure data is written to underlying stream

    return target.getvalue()

# GBK to UTF-8
gbk_data = "中文测试".encode("gbk")
utf8_data = convert_encoding(gbk_data, "gbk", "utf-8")
print(utf8_data.decode("utf-8"))  # 中文测试

# Example 2: Handle newline conversion
def normalize_newlines(text):
    """Normalize all newlines to \n"""
    source = BytesIO(text.encode("utf-8"))
    # newline="" does no conversion
    reader = TextIOWrapper(source, encoding="utf-8", newline="")

    target = BytesIO()
    # newline="\n" uses \n when writing
    writer = TextIOWrapper(target, encoding="utf-8", newline="\n")

    writer.write(reader.read())
    writer.flush()

    return target.getvalue().decode("utf-8")

mixed = "Line 1\r\nLine 2\rLine 3\n"
normalized = normalize_newlines(mixed)
print(repr(normalized))  # 'Line 1\nLine 2\nLine 3\n'

# Example 3: Error handling modes
binary_data = b"Hello \xff World"  # \xff is not valid UTF-8

# strict mode (default) - raises exception
try:
    TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="strict").read()
except UnicodeDecodeError as e:
    print(f"Strict error: {e}")

# ignore mode - skip invalid characters
result = TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="ignore").read()
print(f"Ignore: {result!r}")  # 'Hello  World'

# replace mode - replace with replacement character
result = TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="replace").read()
print(f"Replace: {result!r}")  # 'Hello \ufffd World'

# backslashreplace mode - replace with escape sequences
result = TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="backslashreplace").read()
print(f"Backslashreplace: {result!r}")  # 'Hello \\xff World'
```

### Advanced Example: Buffered I/O Operations

```python
from io import BytesIO, BufferedReader, BufferedWriter, BufferedRandom

# Example 1: Using BufferedReader
class SlowReader:
    """Simulates a slow reader (like network stream)"""
    def __init__(self, data):
        self._data = data
        self._pos = 0

    def readinto(self, b):
        if self._pos >= len(self._data):
            return 0
        # Read at most 10 bytes at a time
        n = min(10, len(self._data) - self._pos, len(b))
        b[:n] = self._data[self._pos:self._pos + n]
        self._pos += n
        return n

    def readable(self):
        return True

slow = SlowReader(b"A" * 100)
buffered = BufferedReader(slow, buffer_size=50)

# BufferedReader will pre-read data into buffer
data = buffered.read(30)  # Actually reads 50 bytes into buffer
print(f"Read {len(data)} bytes")

# Example 2: Zero-copy access using getbuffer()
buffer = BytesIO(b"Hello, World!")

# getbuffer() returns a memory view of the buffer
view = buffer.getbuffer()
print(f"Buffer size: {len(view)} bytes")

# Can modify directly (zero-copy)
view[0:5] = b"HELLO"
print(buffer.getvalue())  # b'HELLO, World!'

# Release the view
view.release()

# Example 3: Using BufferedRandom for random access
buffer = BytesIO(b"\x00" * 100)
random_io = BufferedRandom(buffer)

# Write at random positions
random_io.seek(50)
random_io.write(b"MIDDLE")

random_io.seek(0)
random_io.write(b"START")

random_io.seek(90)
random_io.write(b"END")

# Read to verify
random_io.seek(0)
print(random_io.read())
```

### Context Manager Usage

```python
from io import StringIO, BytesIO
from contextlib import closing

# StringIO and BytesIO support context manager protocol
with StringIO("Hello") as stream:
    content = stream.read()
    print(content)

# After exiting with block, stream is automatically closed
# stream.read()  # ValueError: I/O operation on closed file

# For older versions or custom streams, you can use closing
with closing(StringIO("World")) as stream:
    content = stream.read()
    print(content)

# Pattern for creating temporary working streams
def process_with_temp_stream():
    with BytesIO() as buffer:
        # Write temporary data
        buffer.write(b"Temporary data")

        # Process data
        buffer.seek(0)
        data = buffer.read()

        # Return processed result
        return data.upper()

result = process_with_temp_stream()
print(result)  # b'TEMPORARY DATA'
```

## Best Practices

### Choose the Correct Stream Type

```python
from io import StringIO, BytesIO

# Use StringIO for text data
def process_text_data():
    text = "Hello, World!"
    stream = StringIO(text)  # Correct
    # stream = BytesIO(text)  # Wrong! text is str, not bytes
    return stream.read().upper()

# Use BytesIO for binary data
def process_binary_data():
    binary = b"\x89PNG\r\n\x1a\n"
    stream = BytesIO(binary)  # Correct
    # stream = StringIO(binary)  # Wrong! binary is bytes, not str
    return stream.read()
```

### Remember to Reset Position Pointer

```python
from io import StringIO

stream = StringIO()
stream.write("Content")

# Wrong: After writing, position is at end, read() returns empty string
content = stream.read()
print(f"Wrong: '{content}'")  # ''

# Correct: seek(0) first, then read
stream.seek(0)
content = stream.read()
print(f"Correct: '{content}'")  # 'Content'

# Or use getvalue() (not affected by position)
content = stream.getvalue()
print(f"Also correct: '{content}'")  # 'Content'
```

### Use Context Managers for Resource Management

```python
from io import StringIO, BytesIO

# Recommended: Use with statement
def recommended():
    with StringIO() as stream:
        stream.write("Hello")
        return stream.getvalue()

# Not recommended: Manual management
def not_recommended():
    stream = StringIO()
    try:
        stream.write("Hello")
        return stream.getvalue()
    finally:
        stream.close()

# For streams needed outside the function, ensure caller is responsible for closing
def create_stream():
    stream = BytesIO()
    stream.write(b"Data")
    stream.seek(0)
    return stream  # Caller needs to close

# Usage
stream = create_stream()
try:
    data = stream.read()
finally:
    stream.close()
```

### Handle Encoding Correctly

```python
from io import BytesIO, TextIOWrapper

# Always specify encoding when handling text
def safe_text_processing(binary_data, encoding="utf-8"):
    stream = BytesIO(binary_data)
    text_stream = TextIOWrapper(stream, encoding=encoding)
    return text_stream.read()

# Handle data with unknown encoding
def detect_and_read(binary_data):
    # Try common encodings
    encodings = ["utf-8", "gbk", "latin-1"]

    for encoding in encodings:
        try:
            stream = BytesIO(binary_data)
            text_stream = TextIOWrapper(stream, encoding=encoding, errors="strict")
            return text_stream.read(), encoding
        except UnicodeDecodeError:
            continue

    # Finally use latin-1 (always succeeds because it accepts any byte)
    stream = BytesIO(binary_data)
    text_stream = TextIOWrapper(stream, encoding="latin-1")
    return text_stream.read(), "latin-1"
```

### Flush the Buffer

```python
from io import BytesIO, TextIOWrapper

# TextIOWrapper has its own buffer, need to flush after writing
def write_text_to_binary():
    binary_stream = BytesIO()
    text_stream = TextIOWrapper(binary_stream, encoding="utf-8")

    text_stream.write("Hello")

    # Wrong: binary_stream might be empty at this point
    # print(binary_stream.getvalue())  # Might be b''

    # Correct: flush first
    text_stream.flush()
    print(binary_stream.getvalue())  # b'Hello'

    # Or use detach() to separate (auto-flushes)
    text_stream.write(" World")
    raw = text_stream.detach()
    print(raw.getvalue())  # b'Hello World'
```

### Use getbuffer() for Zero-Copy Operations

```python
from io import BytesIO

def zero_copy_modification():
    # For large data, use getbuffer() to avoid copying
    buffer = BytesIO(b"A" * 1000000)  # 1MB data

    # Inefficient: copies entire buffer
    data = buffer.getvalue()
    # Modify data...

    # Efficient: get memory view, modify directly
    view = buffer.getbuffer()
    view[0:5] = b"HELLO"  # Zero-copy modification
    view.release()

    return buffer.getvalue()[:10]  # b'HELLOAAAAa'
```

## Common Pitfalls

### Forgetting to Reset Position Pointer

```python
from io import StringIO

stream = StringIO()
stream.write("Hello")

# Pitfall: Reading directly returns empty string
print(stream.read())  # '' - empty!

# Solution: Use seek(0) or getvalue()
stream.seek(0)
print(stream.read())  # 'Hello'
```

### Confusing StringIO and BytesIO

```python
from io import StringIO, BytesIO

# Pitfall: Type mismatch
text_stream = StringIO()
# text_stream.write(b"bytes")  # TypeError!

binary_stream = BytesIO()
# binary_stream.write("string")  # TypeError!

# Solution: Ensure data types match
text_stream.write("string")
binary_stream.write(b"bytes")
```

### Continuing to Use After Closing

```python
from io import StringIO

stream = StringIO("Hello")
stream.close()

# Pitfall: Cannot read/write after closing
# stream.read()  # ValueError: I/O operation on closed file

# Solution: Get needed data before closing
stream = StringIO("Hello")
data = stream.getvalue()  # Get data first
stream.close()
print(data)  # 'Hello'
```

### TextIOWrapper Buffering Issues

```python
from io import BytesIO, TextIOWrapper

binary = BytesIO()
text = TextIOWrapper(binary, encoding="utf-8")

text.write("Hello")

# Pitfall: Data is still in TextIOWrapper's buffer
print(binary.getvalue())  # b'' - empty!

# Solution: Flush the buffer
text.flush()
print(binary.getvalue())  # b'Hello'
```

### Continuing to Use After detach()

```python
from io import BytesIO, TextIOWrapper

binary = BytesIO(b"Hello")
text = TextIOWrapper(binary, encoding="utf-8")

# detach() separates the underlying stream
raw = text.detach()

# Pitfall: text is unusable after detach
# text.read()  # ValueError: underlying buffer has been detached

# Solution: Use the returned raw stream
raw.seek(0)
print(raw.read())  # b'Hello'
```

### seek() whence Parameter Limitations in StringIO

```python
from io import StringIO, BytesIO

text = StringIO("Hello")
binary = BytesIO(b"Hello")

# BytesIO supports offset from current position
binary.seek(2)
binary.seek(1, 1)  # Move forward 1 from current position
print(binary.tell())  # 3

# Pitfall: StringIO doesn't support non-zero offset from current position
text.seek(2)
# text.seek(1, 1)  # Raises error!

# Solution: StringIO can only use seek(pos, 0) or seek(0, 2)
text.seek(3, 0)  # Offset 3 from beginning
text.seek(0, 2)  # Move to end
```

### Memory Issues with Large Data

```python
from io import BytesIO

# Pitfall: BytesIO keeps all data in memory
def bad_large_file_handling():
    buffer = BytesIO()
    # Writing 1GB of data consumes 1GB of memory
    for _ in range(1024):
        buffer.write(b"X" * 1024 * 1024)  # Memory keeps growing
    return buffer.getvalue()  # Copies again, doubles memory

# Solution: For large data, consider using temporary files
import tempfile

def good_large_file_handling():
    # Use temporary file, data is stored on disk
    with tempfile.SpooledTemporaryFile(max_size=10*1024*1024) as f:
        for _ in range(1024):
            f.write(b"X" * 1024 * 1024)
        f.seek(0)
        # Read and process in chunks
        while chunk := f.read(8192):
            pass  # Process chunk
```

## Performance Considerations

### Memory vs Disk I/O

```python
import time
from io import StringIO, BytesIO

# Memory stream vs File I/O performance comparison
def benchmark_io():
    data = "x" * 10000
    iterations = 10000

    # Memory stream
    start = time.perf_counter()
    for _ in range(iterations):
        stream = StringIO()
        stream.write(data)
        stream.seek(0)
        _ = stream.read()
    memory_time = time.perf_counter() - start

    # File I/O
    import tempfile
    start = time.perf_counter()
    for _ in range(iterations):
        with tempfile.NamedTemporaryFile(mode="w+", delete=True) as f:
            f.write(data)
            f.seek(0)
            _ = f.read()
    file_time = time.perf_counter() - start

    print(f"Memory stream: {memory_time:.3f}s")
    print(f"File I/O: {file_time:.3f}s")
    print(f"Memory stream is {file_time/memory_time:.1f}x faster")

# benchmark_io()
# Memory stream: 0.234s
# File I/O: 5.678s
# Memory stream is 24.3x faster
```

### getvalue() vs read()

```python
from io import StringIO
import time

def compare_read_methods():
    data = "x" * 1000000
    iterations = 1000

    stream = StringIO(data)

    # read() requires seek(0) first
    start = time.perf_counter()
    for _ in range(iterations):
        stream.seek(0)
        _ = stream.read()
    read_time = time.perf_counter() - start

    # getvalue() doesn't need seek
    start = time.perf_counter()
    for _ in range(iterations):
        _ = stream.getvalue()
    getvalue_time = time.perf_counter() - start

    print(f"read(): {read_time:.3f}s")
    print(f"getvalue(): {getvalue_time:.3f}s")

# compare_read_methods()
# read(): 0.156s
# getvalue(): 0.089s
```

### Buffer Size Impact

```python
from io import BytesIO, BufferedReader
import time

def benchmark_buffer_size():
    data = b"x" * 10000000  # 10MB

    for buffer_size in [512, 4096, 8192, 65536]:
        stream = BytesIO(data)
        buffered = BufferedReader(stream, buffer_size=buffer_size)

        start = time.perf_counter()
        while buffered.read(1024):  # Read 1KB at a time
            pass
        elapsed = time.perf_counter() - start

        print(f"Buffer {buffer_size:>6}: {elapsed:.4f}s")

# benchmark_buffer_size()
# Buffer    512: 0.0234s
# Buffer   4096: 0.0156s
# Buffer   8192: 0.0142s
# Buffer  65536: 0.0138s
```

### Avoid Frequently Creating Stream Objects

```python
from io import StringIO, BytesIO

# Inefficient: Frequently creating new objects
def inefficient():
    results = []
    for i in range(10000):
        stream = StringIO()  # Create new object each iteration
        stream.write(str(i))
        results.append(stream.getvalue())
    return results

# Efficient: Reuse objects
def efficient():
    results = []
    stream = StringIO()
    for i in range(10000):
        stream.seek(0)
        stream.truncate(0)  # Clear content
        stream.write(str(i))
        results.append(stream.getvalue())
    stream.close()
    return results

# Or use a simpler approach (if just concatenating strings)
def simpler():
    return [str(i) for i in range(10000)]
```

## Real-World Scenarios

### Scenario 1: CSV Data Processing

```python
from io import StringIO
import csv

def parse_csv_string(csv_string):
    """Parse CSV string"""
    stream = StringIO(csv_string)
    reader = csv.DictReader(stream)
    return list(reader)

def generate_csv_string(data, fieldnames):
    """Generate CSV string"""
    stream = StringIO()
    writer = csv.DictWriter(stream, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)
    return stream.getvalue()

# Usage example
csv_data = """name,age,city
Alice,30,Beijing
Bob,25,Shanghai"""

records = parse_csv_string(csv_data)
print(records)
# [{'name': 'Alice', 'age': '30', 'city': 'Beijing'},
#  {'name': 'Bob', 'age': '25', 'city': 'Shanghai'}]

new_csv = generate_csv_string(records, ["name", "age", "city"])
print(new_csv)
```

### Scenario 2: HTTP Response Handling

```python
from io import BytesIO
import json

def create_json_response(data):
    """Create JSON HTTP response body"""
    buffer = BytesIO()
    json_str = json.dumps(data, ensure_ascii=False)
    buffer.write(json_str.encode("utf-8"))
    buffer.seek(0)
    return buffer

def parse_multipart_data(boundary, data):
    """Parse multipart form data (simplified version)"""
    parts = {}
    boundary_bytes = f"--{boundary}".encode()

    stream = BytesIO(data)
    content = stream.read()

    for part in content.split(boundary_bytes):
        if not part or part == b"--\r\n":
            continue

        # Parse each part (simplified handling)
        if b"\r\n\r\n" in part:
            headers, body = part.split(b"\r\n\r\n", 1)
            # Extract field name
            if b'name="' in headers:
                name_start = headers.find(b'name="') + 6
                name_end = headers.find(b'"', name_start)
                name = headers[name_start:name_end].decode()
                parts[name] = body.rstrip(b"\r\n")

    return parts

# Usage example
response = create_json_response({"status": "ok", "message": "Success"})
print(response.read())
```

### Scenario 3: Image Processing

```python
from io import BytesIO

def image_to_bytes(image, format="PNG"):
    """Convert PIL image to byte data"""
    from PIL import Image

    buffer = BytesIO()
    image.save(buffer, format=format)
    return buffer.getvalue()

def bytes_to_image(image_bytes):
    """Convert byte data to PIL image"""
    from PIL import Image

    buffer = BytesIO(image_bytes)
    return Image.open(buffer)

def resize_image_bytes(image_bytes, size):
    """Resize image (without saving to disk)"""
    from PIL import Image

    # Load from bytes
    buffer = BytesIO(image_bytes)
    img = Image.open(buffer)

    # Resize
    img = img.resize(size, Image.Resampling.LANCZOS)

    # Save to new byte buffer
    output = BytesIO()
    img.save(output, format=img.format or "PNG")
    return output.getvalue()

# Usage example (requires PIL/Pillow)
# original = open("photo.jpg", "rb").read()
# resized = resize_image_bytes(original, (200, 200))
```

### Scenario 4: Mocking Files in Tests

```python
from io import StringIO, BytesIO
import unittest
from unittest.mock import patch, mock_open

class FileProcessor:
    def read_config(self, filepath):
        with open(filepath) as f:
            return f.read()

    def process_file(self, file_obj):
        content = file_obj.read()
        return content.upper()

class TestFileProcessor(unittest.TestCase):
    def test_process_file_with_stringio(self):
        """Use StringIO to mock file input"""
        processor = FileProcessor()

        # Use StringIO as test input
        fake_file = StringIO("hello world")
        result = processor.process_file(fake_file)

        self.assertEqual(result, "HELLO WORLD")

    def test_read_config_with_mock(self):
        """Use mock to mock file reading"""
        processor = FileProcessor()

        fake_config = "debug=true\nport=8080"

        with patch("builtins.open", mock_open(read_data=fake_config)):
            result = processor.read_config("config.txt")
            self.assertIn("debug=true", result)

    def test_binary_processing_with_bytesio(self):
        """Use BytesIO to test binary processing"""
        fake_data = BytesIO(b"\x00\x01\x02\x03")

        # Mock function that processes binary data
        def process_binary(stream):
            return sum(stream.read())

        result = process_binary(fake_data)
        self.assertEqual(result, 6)  # 0+1+2+3

# Run tests
# if __name__ == "__main__":
#     unittest.main()
```

### Scenario 5: Log Capture

```python
from io import StringIO
import logging
import sys

class LogCapture:
    """Context manager: Capture log output"""

    def __init__(self, logger_name=None, level=logging.DEBUG):
        self.logger_name = logger_name
        self.level = level
        self.stream = StringIO()
        self.handler = None
        self.old_handlers = []

    def __enter__(self):
        logger = logging.getLogger(self.logger_name)
        self.old_handlers = logger.handlers[:]
        self.old_level = logger.level

        # Add our handler
        self.handler = logging.StreamHandler(self.stream)
        self.handler.setLevel(self.level)
        formatter = logging.Formatter("%(levelname)s - %(message)s")
        self.handler.setFormatter(formatter)

        logger.handlers = [self.handler]
        logger.setLevel(self.level)

        return self

    def __exit__(self, *args):
        logger = logging.getLogger(self.logger_name)
        logger.handlers = self.old_handlers
        logger.setLevel(self.old_level)

    def get_logs(self):
        return self.stream.getvalue()


# Usage example
def some_function():
    logger = logging.getLogger("myapp")
    logger.info("Starting process")
    logger.warning("Something might be wrong")
    logger.info("Process completed")

with LogCapture("myapp") as capture:
    some_function()

logs = capture.get_logs()
print(logs)
# INFO - Starting process
# WARNING - Something might be wrong
# INFO - Process completed
```

### Scenario 6: Data Serialization and Transmission

```python
from io import BytesIO
import json
import gzip

def serialize_to_compressed_json(data):
    """Serialize to compressed JSON data"""
    # Serialize to JSON
    json_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")

    # Compress
    compressed_buffer = BytesIO()
    with gzip.GzipFile(fileobj=compressed_buffer, mode="wb") as gz:
        gz.write(json_bytes)

    return compressed_buffer.getvalue()

def decompress_and_deserialize_json(compressed_bytes):
    """Decompress and deserialize JSON data"""
    # Decompress
    compressed_buffer = BytesIO(compressed_bytes)
    with gzip.GzipFile(fileobj=compressed_buffer, mode="rb") as gz:
        json_bytes = gz.read()

    # Deserialize
    return json.loads(json_bytes.decode("utf-8"))

# Usage example
original_data = {
    "users": [{"name": f"User{i}", "score": i * 100} for i in range(1000)],
    "metadata": {"version": "1.0", "timestamp": "2024-01-01"}
}

compressed = serialize_to_compressed_json(original_data)
print(f"Compressed size: {len(compressed)} bytes")

restored = decompress_and_deserialize_json(compressed)
print(f"Restored data: {len(restored['users'])} users")
```

## Interview Key Points

### Q1: What's the difference between StringIO and BytesIO?

**Answer**:
- `StringIO` handles text data (`str` type), `BytesIO` handles binary data (`bytes` type)
- `StringIO`'s `seek()` method has limited support for `whence=1` and `whence=2`
- `BytesIO` provides `getbuffer()` method that returns a memory view, supporting zero-copy operations
- Both support `getvalue()` method to get complete content

```python
from io import StringIO, BytesIO

text_stream = StringIO("Hello")  # Handles str
binary_stream = BytesIO(b"Hello")  # Handles bytes
```

### Q2: What is the file object protocol (file-like object)?

**Answer**:
The file object protocol is a duck-typing protocol in Python. Any object that implements the following methods can be used as a file:

- `read(size=-1)` - Read data
- `write(data)` - Write data
- `seek(offset, whence=0)` - Move position
- `tell()` - Get current position
- `close()` - Close stream
- `readable()` / `writable()` / `seekable()` - Capability queries

This allows `StringIO`, `BytesIO` to be used anywhere a file object is expected.

### Q3: How do you mock file operations in tests?

**Answer**:

```python
from io import StringIO
import unittest

def process_file(file_obj):
    return file_obj.read().upper()

class TestFileProcessing(unittest.TestCase):
    def test_process_file(self):
        # Use StringIO to mock a file
        fake_file = StringIO("test content")
        result = process_file(fake_file)
        self.assertEqual(result, "TEST CONTENT")
```

### Q4: What is the purpose of TextIOWrapper?

**Answer**:
`TextIOWrapper` is a wrapper that provides a text interface on top of a binary stream, responsible for:
- Character encoding and decoding
- Newline conversion
- Buffer management

```python
from io import BytesIO, TextIOWrapper

binary = BytesIO(b"\xe4\xb8\xad\xe6\x96\x87")
text = TextIOWrapper(binary, encoding="utf-8")
print(text.read())  # "中文"
```

### Q5: What are the performance advantages of using in-memory streams?

**Answer**:
- No disk I/O overhead, read/write is 10-100x faster
- No system calls, reduces context switching
- Ideal for temporary data processing and test mocking
- But be mindful of memory usage; for large data, use temporary files

### Q6: What's the difference between getvalue() and read()?

**Answer**:

| Feature | `getvalue()` | `read()` |
|---------|--------------|----------|
| Position pointer | Not affected | Reads from current position |
| Returns complete content | Always returns complete content | Only returns content from current position to end |
| Requires seek | Not required | Usually needs `seek(0)` first |

```python
from io import StringIO

s = StringIO("Hello")
s.read(2)  # Reads "He", position pointer moves to 2

print(s.read())      # "llo" - reads from position 2 to end
print(s.getvalue())  # "Hello" - gets complete content
```

### Q7: How do you handle encoding errors?

**Answer**:
Use the `errors` parameter of `TextIOWrapper`:

```python
from io import BytesIO, TextIOWrapper

data = b"Hello \xff World"  # Contains invalid UTF-8 byte

# strict - raises exception (default)
# ignore - skip invalid characters
# replace - replace with U+FFFD
# backslashreplace - replace with escape sequences

stream = TextIOWrapper(
    BytesIO(data),
    encoding="utf-8",
    errors="replace"
)
print(stream.read())  # "Hello \ufffd World"
```

## Further Reading

### Official Documentation

- [io - Python Official Documentation](https://docs.python.org/3/library/io.html)
- [Python I/O Overview](https://docs.python.org/3/library/io.html#overview)
- [Built-in open() Function](https://docs.python.org/3/library/functions.html#open)

### Related Standard Libraries

- [tempfile - Temporary Files and Directories](https://docs.python.org/3/library/tempfile.html)
- [mmap - Memory-mapped Files](https://docs.python.org/3/library/mmap.html)
- [struct - Binary Data Structures](https://docs.python.org/3/library/struct.html)

### PEP Documents

- [PEP 3116 - New I/O](https://peps.python.org/pep-3116/) - Python 3 New I/O System Design
- [PEP 578 - Python Runtime Audit Hooks](https://peps.python.org/pep-0578/) - Runtime Audit Hooks

### Recommended Articles

- [Python io Module: A Complete Guide](https://realpython.com/python-io-module/)
- [Understanding Python BytesIO](https://www.geeksforgeeks.org/stringio-and-bytesio-in-python/)
- [Working with Binary Data in Python](https://pymotw.com/3/io/)

### Related Modules

- `pathlib` - Object-oriented path handling
- `os` - Operating system interface
- `codecs` - Codec registry and base classes
- `gzip`, `bz2`, `lzma` - Compressed file operations
