---
title: struct模块
description: Python struct模块完全指南，二进制数据打包与解包、格式字符串、字节序处理
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - struct
  - 二进制
  - 字节序
  - 数据序列化
status: imported
origin: old/src/content/docs/python/struct.en.md
divergence: 0.188
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 标准库
  order: 28
  lastUpdated: 2026-01-07
---

The `struct` module is a core tool in Python's standard library for handling binary data. It provides the ability to convert between Python values and C language structures, making it indispensable in low-level data processing scenarios such as network programming, file format parsing, and hardware communication.

## Concept Explanation

### What is the struct Module

The `struct` module implements conversion between Python values and C structures (represented as Python `bytes` objects). It is mainly used in the following scenarios:

- Parsing binary file formats (such as images, audio, executables)
- Construction and parsing of network protocol packets
- Data exchange with C/C++ programs
- Embedded systems and hardware device communication
- Memory mapping and shared memory operations

### Why Do We Need struct

Python is a high-level language, and its built-in types (such as `int`, `float`) have different memory representations compared to C. When interacting with low-level systems, network protocols, or binary files, data must be packed and unpacked according to specific byte formats. The `struct` module was created precisely for this purpose.

```python
import struct

# Pack an integer into 4 bytes of binary data
packed = struct.pack('i', 42)
print(packed)  # b'*\x00\x00\x00' (little-endian)
print(len(packed))  # 4

# Unpack an integer from binary data
value = struct.unpack('i', packed)
print(value)  # (42,)
```

## Core Principles

### Memory Layout and Byte Representation

Computers store data in units of bytes. Different data types occupy different numbers of bytes:

| Data Type | C Type | Typical Size |
|-----------|--------|--------------|
| Character | char | 1 byte |
| Short Integer | short | 2 bytes |
| Integer | int | 4 bytes |
| Long Integer | long | 4 or 8 bytes |
| Single Precision Float | float | 4 bytes |
| Double Precision Float | double | 8 bytes |

### Byte Order

Byte order determines the storage order of multi-byte data in memory:

- **Big-endian**: High-order bytes are stored at lower addresses, consistent with human reading habits
- **Little-endian**: Low-order bytes are stored at lower addresses, used by x86/x64 architectures
- **Network byte order**: Big-endian, the network protocol standard

```python
import struct

value = 0x12345678

# Big-endian (network byte order)
big_endian = struct.pack('>I', value)
print(big_endian.hex())  # 12345678

# Little-endian
little_endian = struct.pack('<I', value)
print(little_endian.hex())  # 78563412

# Native byte order (depends on system)
native = struct.pack('=I', value)
print(native.hex())  # Depends on the running system
```

### Data Alignment

C compilers typically align structure members in memory to improve access efficiency. The `struct` module can simulate this behavior:

```python
import struct

# No alignment (compact)
packed_size = struct.calcsize('=bI')  # char + int
print(f"No alignment: {packed_size} bytes")  # 5 bytes

# Native alignment
native_size = struct.calcsize('@bI')  # char + int (with alignment)
print(f"Native alignment: {native_size} bytes")  # 8 bytes (platform dependent)
```

## Key Points

### Format Strings

Format strings consist of two parts: byte order characters (optional) and format characters.

#### Byte Order Characters

| Character | Meaning | Size | Alignment |
|-----------|---------|------|-----------|
| `@` | Native | Native | Native |
| `=` | Native | Standard | None |
| `<` | Little-endian | Standard | None |
| `>` | Big-endian | Standard | None |
| `!` | Network (big-endian) | Standard | None |

#### Format Characters

| Format | C Type | Python Type | Standard Size |
|--------|--------|-------------|---------------|
| `x` | Padding byte | None | 1 |
| `c` | char | bytes (length 1) | 1 |
| `b` | signed char | int | 1 |
| `B` | unsigned char | int | 1 |
| `?` | _Bool | bool | 1 |
| `h` | short | int | 2 |
| `H` | unsigned short | int | 2 |
| `i` | int | int | 4 |
| `I` | unsigned int | int | 4 |
| `l` | long | int | 4 |
| `L` | unsigned long | int | 4 |
| `q` | long long | int | 8 |
| `Q` | unsigned long long | int | 8 |
| `n` | ssize_t | int | Native |
| `N` | size_t | int | Native |
| `e` | Half precision float | float | 2 |
| `f` | float | float | 4 |
| `d` | double | float | 8 |
| `s` | char[] | bytes | - |
| `p` | char[] (Pascal string) | bytes | - |
| `P` | void * | int | Native |

### Core Functions

```python
import struct

# struct.pack(format, v1, v2, ...) - Pack data
data = struct.pack('!HI', 80, 12345)

# struct.unpack(format, buffer) - Unpack data
port, num = struct.unpack('!HI', data)

# struct.calcsize(format) - Calculate the number of bytes for a format string
size = struct.calcsize('!HI')  # 6

# struct.pack_into(format, buffer, offset, v1, v2, ...) - Pack into a buffer
buffer = bytearray(10)
struct.pack_into('!HI', buffer, 2, 80, 12345)

# struct.unpack_from(format, buffer, offset=0) - Unpack from a buffer
values = struct.unpack_from('!HI', buffer, 2)

# struct.iter_unpack(format, buffer) - Iterative unpacking (Python 3.4+)
for item in struct.iter_unpack('!HI', data * 3):
    print(item)
```

## Code Examples

### Basic Packing and Unpacking

```python
import struct

# Pack different types of data
format_string = '>B H I f'  # Big-endian: unsigned byte, unsigned short, unsigned int, float
values = (255, 65535, 4294967295, 3.14)

packed_data = struct.pack(format_string, *values)
print(f"Packed: {packed_data.hex()}")
print(f"Bytes: {len(packed_data)}")

# Unpack
unpacked = struct.unpack(format_string, packed_data)
print(f"Unpacked: {unpacked}")
# Unpacked: (255, 65535, 4294967295, 3.140000104904175)

# Note: Floating-point numbers may have precision loss
```

### Handling Strings

```python
import struct

# Fixed-length string
name = b'Python'
packed = struct.pack('10s', name)
print(packed)  # b'Python\x00\x00\x00\x00'

# Unpack string
unpacked = struct.unpack('10s', packed)
print(unpacked[0])  # b'Python\x00\x00\x00\x00'
print(unpacked[0].rstrip(b'\x00'))  # b'Python'

# String mixed with other types
data = struct.pack('>I 8s f', 42, b'message!', 3.14)
num, text, val = struct.unpack('>I 8s f', data)
print(f"Number: {num}, Text: {text.decode()}, Value: {val}")
```

### Using the Struct Class

For repeatedly used formats, using the `Struct` class can improve performance:

```python
import struct

# Create a Struct object
header_format = struct.Struct('>I H H')

# Use methods of the Struct object
data = header_format.pack(1024, 80, 443)
print(f"Size: {header_format.size} bytes")

# Unpack
size, port1, port2 = header_format.unpack(data)
print(f"Size: {size}, Port1: {port1}, Port2: {port2}")

# Performance comparison
import timeit

format_str = '>I H H'
values = (1024, 80, 443)

# Using function
def pack_function():
    return struct.pack(format_str, *values)

# Using Struct object
s = struct.Struct(format_str)
def pack_object():
    return s.pack(*values)

# Struct object is usually faster
print(f"Function method: {timeit.timeit(pack_function, number=100000):.4f}s")
print(f"Object method: {timeit.timeit(pack_object, number=100000):.4f}s")
```

### Parsing Network Packets

```python
import struct

def parse_ip_header(packet: bytes) -> dict:
    """Parse IPv4 packet header"""
    # IPv4 header format (simplified)
    # 0                   1                   2                   3
    # 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    # +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    # |Version|  IHL  |Type of Service|          Total Length         |
    # +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    # |         Identification        |Flags|      Fragment Offset    |
    # +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    # |  Time to Live |    Protocol   |         Header Checksum       |
    # +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    # |                       Source Address                          |
    # +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    # |                    Destination Address                        |
    # +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

    if len(packet) < 20:
        raise ValueError("Packet too short")

    # Unpack first 20 bytes
    fields = struct.unpack('!BBHHHBBH4s4s', packet[:20])

    version_ihl = fields[0]
    version = version_ihl >> 4
    ihl = version_ihl & 0x0F

    return {
        'version': version,
        'ihl': ihl,
        'tos': fields[1],
        'total_length': fields[2],
        'identification': fields[3],
        'flags_fragment': fields[4],
        'ttl': fields[5],
        'protocol': fields[6],
        'checksum': fields[7],
        'src_ip': '.'.join(str(b) for b in fields[8]),
        'dst_ip': '.'.join(str(b) for b in fields[9]),
    }

# Sample packet
sample_packet = bytes([
    0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00,
    0x40, 0x06, 0xb1, 0xe6, 0xac, 0x10, 0x0a, 0x63,
    0xac, 0x10, 0x0a, 0x0c
])

header = parse_ip_header(sample_packet)
print(f"Version: IPv{header['version']}")
print(f"Source IP: {header['src_ip']}")
print(f"Destination IP: {header['dst_ip']}")
print(f"Protocol: {header['protocol']}")
print(f"TTL: {header['ttl']}")
```

### Reading Binary Files

```python
import struct
from pathlib import Path

def read_bmp_header(filepath: str) -> dict:
    """Read BMP file header"""
    with open(filepath, 'rb') as f:
        # BMP file header (14 bytes)
        # 2 bytes: Magic number ('BM')
        # 4 bytes: File size
        # 2 bytes: Reserved
        # 2 bytes: Reserved
        # 4 bytes: Pixel data offset

        magic = f.read(2)
        if magic != b'BM':
            raise ValueError("Not a valid BMP file")

        file_size, _, _, pixel_offset = struct.unpack('<I H H I', f.read(12))

        # DIB header (at least 40 bytes, BITMAPINFOHEADER)
        dib_size = struct.unpack('<I', f.read(4))[0]

        if dib_size >= 40:
            width, height, planes, bpp = struct.unpack('<i i H H', f.read(12))

            return {
                'file_size': file_size,
                'pixel_offset': pixel_offset,
                'dib_size': dib_size,
                'width': width,
                'height': abs(height),
                'planes': planes,
                'bits_per_pixel': bpp,
            }

    return {'file_size': file_size, 'pixel_offset': pixel_offset}

# Usage example
# header = read_bmp_header('image.bmp')
# print(f"Image size: {header['width']} x {header['height']}")
# print(f"Color depth: {header['bits_per_pixel']} bits")
```

### Creating Binary File Formats

```python
import struct
from dataclasses import dataclass
from typing import List

@dataclass
class Record:
    """Data record"""
    id: int
    name: str
    score: float
    active: bool

class BinaryDatabase:
    """Simple binary database"""

    MAGIC = b'MYDB'
    VERSION = 1
    RECORD_FORMAT = '>I 32s f ?'  # id, name(32 bytes), score, active
    RECORD_SIZE = struct.calcsize(RECORD_FORMAT)

    def __init__(self, filepath: str):
        self.filepath = filepath
        self._struct = struct.Struct(self.RECORD_FORMAT)

    def write(self, records: List[Record]):
        """Write records to file"""
        with open(self.filepath, 'wb') as f:
            # Write file header
            header = struct.pack('>4s I I', self.MAGIC, self.VERSION, len(records))
            f.write(header)

            # Write records
            for record in records:
                name_bytes = record.name.encode('utf-8')[:32].ljust(32, b'\x00')
                data = self._struct.pack(record.id, name_bytes, record.score, record.active)
                f.write(data)

    def read(self) -> List[Record]:
        """Read records from file"""
        records = []

        with open(self.filepath, 'rb') as f:
            # Read file header
            header = f.read(12)
            magic, version, count = struct.unpack('>4s I I', header)

            if magic != self.MAGIC:
                raise ValueError("Invalid file format")
            if version != self.VERSION:
                raise ValueError(f"Unsupported version: {version}")

            # Read records
            for _ in range(count):
                data = f.read(self.RECORD_SIZE)
                id_, name_bytes, score, active = self._struct.unpack(data)
                name = name_bytes.rstrip(b'\x00').decode('utf-8')
                records.append(Record(id_, name, score, active))

        return records

# Usage example
db = BinaryDatabase('data.bin')

# Write data
records = [
    Record(1, 'Zhang San', 95.5, True),
    Record(2, 'Li Si', 88.0, True),
    Record(3, 'Wang Wu', 72.5, False),
]
db.write(records)

# Read data
loaded = db.read()
for r in loaded:
    status = 'Active' if r.active else 'Inactive'
    print(f"ID: {r.id}, Name: {r.name}, Score: {r.score}, Status: {status}")
```

## Best Practices

### Always Explicitly Specify Byte Order

```python
import struct

# Bad: Relying on system default byte order, may cause cross-platform issues
data = struct.pack('I', 12345)

# Good: Explicitly specify byte order
data = struct.pack('>I', 12345)  # Big-endian
data = struct.pack('<I', 12345)  # Little-endian

# For network programming, use ! or > (network byte order = big-endian)
data = struct.pack('!I', 12345)
```

### Use the Struct Class for Repeated Formats

```python
import struct

# Create once, reuse
PACKET_FORMAT = struct.Struct('!H H I')

def create_packet(src_port: int, dst_port: int, seq: int) -> bytes:
    return PACKET_FORMAT.pack(src_port, dst_port, seq)

def parse_packet(data: bytes) -> tuple:
    return PACKET_FORMAT.unpack(data)
```

### Use calcsize to Validate Data Length

```python
import struct

def safe_unpack(format_str: str, data: bytes):
    """Safe unpacking with length validation"""
    expected_size = struct.calcsize(format_str)
    if len(data) < expected_size:
        raise ValueError(
            f"Insufficient data length: expected {expected_size} bytes, got {len(data)} bytes"
        )
    return struct.unpack(format_str, data[:expected_size])

# Usage
try:
    result = safe_unpack('>I H', b'\x00\x01')  # Data too short
except ValueError as e:
    print(e)  # Insufficient data length: expected 6 bytes, got 2 bytes
```

### Use Named Tuples to Enhance Readability

```python
import struct
from collections import namedtuple

# Define data structure
Header = namedtuple('Header', ['magic', 'version', 'length', 'checksum'])
HEADER_FORMAT = struct.Struct('>4s H I H')

def parse_header(data: bytes) -> Header:
    """Parse header and return named tuple"""
    values = HEADER_FORMAT.unpack(data[:HEADER_FORMAT.size])
    return Header(*values)

# Usage
header_data = struct.pack('>4s H I H', b'HEAD', 1, 1024, 0xABCD)
header = parse_header(header_data)

print(f"Magic: {header.magic}")
print(f"Version: {header.version}")
print(f"Length: {header.length}")
print(f"Checksum: 0x{header.checksum:04X}")
```

### Use Context Managers for Buffer Handling

```python
import struct
from contextlib import contextmanager

@contextmanager
def binary_buffer(size: int):
    """Context manager for creating writable buffer"""
    buffer = bytearray(size)
    yield buffer
    # Validation or cleanup logic can be added here

# Usage
with binary_buffer(16) as buf:
    struct.pack_into('>I I I I', buf, 0, 1, 2, 3, 4)
    print(buf.hex())
```

## Common Pitfalls

### Inconsistent Byte Order

```python
import struct

# Pitfall: Using different byte order for packing and unpacking
packed = struct.pack('>I', 0x12345678)  # Big-endian packing
wrong = struct.unpack('<I', packed)[0]  # Little-endian unpacking
print(f"Wrong result: 0x{wrong:08X}")  # 0x78563412

correct = struct.unpack('>I', packed)[0]  # Correct: use the same byte order
print(f"Correct result: 0x{correct:08X}")  # 0x12345678
```

### String Length Handling

```python
import struct

# Pitfall: String exceeds specified length
long_name = b'This is a very long name'
try:
    packed = struct.pack('10s', long_name)  # Will be truncated
    print(packed)  # b'This is a '
except:
    pass

# Pitfall: Unicode string
try:
    struct.pack('10s', 'Chinese')  # Error! Must be bytes
except struct.error as e:
    print(f"Error: {e}")

# Correct approach
name = 'Test String'
name_bytes = name.encode('utf-8')[:10].ljust(10, b'\x00')
packed = struct.pack('10s', name_bytes)
```

### Signed and Unsigned Confusion

```python
import struct

# Pitfall: Using the wrong format character
value = -1

# Signed integer
signed = struct.pack('>i', value)
print(signed.hex())  # ffffffff

# Unsigned integer will raise an error (-1 is out of range)
try:
    unsigned = struct.pack('>I', value)
except struct.error as e:
    print(f"Error: {e}")  # 'I' format requires 0 <= number <= 4294967295

# Correct handling of negative to unsigned conversion
unsigned_value = value & 0xFFFFFFFF  # Convert to unsigned
unsigned = struct.pack('>I', unsigned_value)
```

### Alignment Issues

```python
import struct

# Pitfall: Ignoring memory alignment differences
# C structure:
# struct data {
#     char c;
#     int i;
# };

# Compact format (no alignment)
packed_size = struct.calcsize('=bi')
print(f"Compact size: {packed_size}")  # 5

# Native format (with alignment)
native_size = struct.calcsize('@bi')
print(f"Native size: {native_size}")  # Could be 8

# When interacting with C programs, you need to match the C compiler's alignment settings
# Or use #pragma pack(1) in C code
```

### Floating-Point Precision

```python
import struct

# Pitfall: Single precision floating-point precision loss
original = 3.141592653589793
packed = struct.pack('f', original)
unpacked = struct.unpack('f', packed)[0]

print(f"Original value: {original}")
print(f"Unpacked value: {unpacked}")
print(f"Precision loss: {abs(original - unpacked)}")

# For higher precision, use double precision
packed_double = struct.pack('d', original)
unpacked_double = struct.unpack('d', packed_double)[0]
print(f"Double precision unpacked: {unpacked_double}")
```

## Performance Considerations

### Performance Comparison Test

```python
import struct
import timeit
import array

# Test data
data = list(range(1000))

# Method 1: Using struct.pack in a loop
def method_pack_loop():
    result = b''
    for i in data:
        result += struct.pack('>I', i)
    return result

# Method 2: Using struct.pack all at once
def method_pack_once():
    return struct.pack(f'>{len(data)}I', *data)

# Method 3: Using Struct object
s = struct.Struct('>I')
def method_struct_object():
    result = b''
    for i in data:
        result += s.pack(i)
    return result

# Method 4: Using bytearray and pack_into
def method_pack_into():
    buf = bytearray(len(data) * 4)
    for i, val in enumerate(data):
        struct.pack_into('>I', buf, i * 4, val)
    return bytes(buf)

# Method 5: Using array module (fastest, but native byte order)
def method_array():
    a = array.array('I', data)
    return a.tobytes()

# Performance test
methods = [
    ('pack loop', method_pack_loop),
    ('pack once', method_pack_once),
    ('Struct object', method_struct_object),
    ('pack_into', method_pack_into),
    ('array module', method_array),
]

for name, func in methods:
    time = timeit.timeit(func, number=1000)
    print(f"{name}: {time:.4f}s")
```

### Optimization Suggestions

1. **Reuse Struct objects**: Avoid repeated parsing of format strings
2. **Batch operations**: Pack multiple values at once whenever possible
3. **Use pack_into/unpack_from**: Avoid frequently creating new bytes objects
4. **Consider the array module**: For homogeneous data, the array module may be faster
5. **Use memoryview**: Avoid copying when handling large buffers

```python
import struct

# Efficient handling of large buffers
def process_large_buffer(data: bytes):
    """Efficiently process data using memoryview"""
    mv = memoryview(data)
    record_size = struct.calcsize('>I f')
    record_count = len(data) // record_size

    for i in range(record_count):
        offset = i * record_size
        # Operate directly on memoryview, no copying needed
        id_, value = struct.unpack_from('>I f', mv, offset)
        yield id_, value
```

## Practical Scenarios

### Scenario 1: Implementing a Simple RPC Protocol

```python
import struct
import socket
import json
from typing import Any

class SimpleRPC:
    """Simple RPC protocol implementation"""

    HEADER_FORMAT = struct.Struct('!I I')  # Message type, data length

    MSG_REQUEST = 1
    MSG_RESPONSE = 2

    def __init__(self, sock: socket.socket):
        self.sock = sock

    def send_request(self, method: str, params: dict):
        """Send request"""
        payload = json.dumps({'method': method, 'params': params}).encode()
        header = self.HEADER_FORMAT.pack(self.MSG_REQUEST, len(payload))
        self.sock.sendall(header + payload)

    def receive_message(self) -> tuple[int, Any]:
        """Receive message"""
        header_data = self._recv_exact(self.HEADER_FORMAT.size)
        msg_type, length = self.HEADER_FORMAT.unpack(header_data)

        payload_data = self._recv_exact(length)
        payload = json.loads(payload_data.decode())

        return msg_type, payload

    def _recv_exact(self, size: int) -> bytes:
        """Receive exact number of bytes"""
        data = b''
        while len(data) < size:
            chunk = self.sock.recv(size - len(data))
            if not chunk:
                raise ConnectionError("Connection closed")
            data += chunk
        return data
```

### Scenario 2: Parsing WAV Audio Files

```python
import struct
from dataclasses import dataclass

@dataclass
class WavHeader:
    """WAV file header information"""
    channels: int
    sample_rate: int
    byte_rate: int
    block_align: int
    bits_per_sample: int
    data_size: int

def parse_wav(filepath: str) -> tuple[WavHeader, bytes]:
    """Parse WAV file"""
    with open(filepath, 'rb') as f:
        # RIFF header
        riff = f.read(4)
        if riff != b'RIFF':
            raise ValueError("Not a valid WAV file")

        file_size = struct.unpack('<I', f.read(4))[0]
        wave = f.read(4)
        if wave != b'WAVE':
            raise ValueError("Not a valid WAV file")

        # Read chunks
        fmt_chunk = None
        data_chunk = None

        while True:
            chunk_id = f.read(4)
            if len(chunk_id) < 4:
                break

            chunk_size = struct.unpack('<I', f.read(4))[0]

            if chunk_id == b'fmt ':
                # Format chunk
                fmt_data = f.read(chunk_size)
                audio_format, channels, sample_rate, byte_rate, block_align, bits = \
                    struct.unpack('<H H I I H H', fmt_data[:16])

                fmt_chunk = {
                    'audio_format': audio_format,
                    'channels': channels,
                    'sample_rate': sample_rate,
                    'byte_rate': byte_rate,
                    'block_align': block_align,
                    'bits_per_sample': bits,
                }

            elif chunk_id == b'data':
                # Data chunk
                data_chunk = f.read(chunk_size)
                break
            else:
                # Skip other chunks
                f.seek(chunk_size, 1)

        if fmt_chunk is None or data_chunk is None:
            raise ValueError("Incomplete WAV file format")

        header = WavHeader(
            channels=fmt_chunk['channels'],
            sample_rate=fmt_chunk['sample_rate'],
            byte_rate=fmt_chunk['byte_rate'],
            block_align=fmt_chunk['block_align'],
            bits_per_sample=fmt_chunk['bits_per_sample'],
            data_size=len(data_chunk),
        )

        return header, data_chunk

# Usage example
# header, audio_data = parse_wav('audio.wav')
# print(f"Sample rate: {header.sample_rate} Hz")
# print(f"Channels: {header.channels}")
# print(f"Bit depth: {header.bits_per_sample} bit")
# print(f"Duration: {header.data_size / header.byte_rate:.2f} seconds")
```

### Scenario 3: Creating Custom Protocol Messages

```python
import struct
import hashlib
from enum import IntEnum
from typing import Optional

class MessageType(IntEnum):
    PING = 1
    PONG = 2
    DATA = 3
    ACK = 4
    ERROR = 5

class Message:
    """Custom protocol message"""

    # Message header format: magic(2) + version(1) + type(1) + sequence(4) + data length(4) + checksum(4)
    HEADER_FORMAT = struct.Struct('>2s B B I I I')
    MAGIC = b'\xAB\xCD'
    VERSION = 1

    def __init__(
        self,
        msg_type: MessageType,
        sequence: int,
        payload: bytes = b''
    ):
        self.msg_type = msg_type
        self.sequence = sequence
        self.payload = payload

    def to_bytes(self) -> bytes:
        """Serialize to bytes"""
        checksum = self._calculate_checksum(self.payload)
        header = self.HEADER_FORMAT.pack(
            self.MAGIC,
            self.VERSION,
            self.msg_type,
            self.sequence,
            len(self.payload),
            checksum
        )
        return header + self.payload

    @classmethod
    def from_bytes(cls, data: bytes) -> Optional['Message']:
        """Deserialize from bytes"""
        if len(data) < cls.HEADER_FORMAT.size:
            return None

        magic, version, msg_type, seq, length, checksum = \
            cls.HEADER_FORMAT.unpack(data[:cls.HEADER_FORMAT.size])

        if magic != cls.MAGIC:
            raise ValueError("Invalid magic number")
        if version != cls.VERSION:
            raise ValueError(f"Unsupported version: {version}")

        payload = data[cls.HEADER_FORMAT.size:cls.HEADER_FORMAT.size + length]

        if cls._calculate_checksum(payload) != checksum:
            raise ValueError("Checksum error")

        return cls(MessageType(msg_type), seq, payload)

    @staticmethod
    def _calculate_checksum(data: bytes) -> int:
        """Calculate checksum (CRC32)"""
        import zlib
        return zlib.crc32(data) & 0xFFFFFFFF

# Usage example
msg = Message(MessageType.DATA, sequence=1, payload=b'Hello, World!')
serialized = msg.to_bytes()
print(f"Serialized: {serialized.hex()}")

parsed = Message.from_bytes(serialized)
print(f"Type: {parsed.msg_type.name}")
print(f"Sequence: {parsed.sequence}")
print(f"Payload: {parsed.payload.decode()}")
```

## Interview Key Points

### What is the purpose of the struct module?

The `struct` module is used to convert between Python values and C structures (represented as bytes objects). It is mainly used for handling binary data, such as network protocols, file format parsing, and interacting with C programs.

### What is the difference between pack and unpack?

- `pack(format, v1, v2, ...)`: Pack Python values into bytes according to the format
- `unpack(format, buffer)`: Unpack bytes into a tuple of Python values according to the format

```python
import struct

# pack: Python values -> bytes
data = struct.pack('>I H', 1000, 80)

# unpack: bytes -> Python value tuple
values = struct.unpack('>I H', data)  # (1000, 80)
```

### What is byte order? How do you specify it?

Byte order determines the storage order of multi-byte data:
- Big-endian (`>` or `!`): High-order byte first
- Little-endian (`<`): Low-order byte first
- Native order (`@` or `=`): Depends on the system

Network programming typically uses big-endian (network byte order).

### What are the advantages of the Struct class over functions?

The `Struct` class pre-compiles the format string, resulting in better performance when used repeatedly:

```python
import struct

# Function approach: Parse format string every time
for _ in range(1000):
    struct.pack('>I H', 100, 200)

# Class approach: Format string parsed only once
s = struct.Struct('>I H')
for _ in range(1000):
    s.pack(100, 200)  # Faster
```

### How do you handle variable-length data?

Use `calcsize` to calculate the fixed portion, and dynamically construct format strings:

```python
import struct

def pack_with_string(id: int, name: str) -> bytes:
    name_bytes = name.encode('utf-8')
    # Pack length first, then content
    return struct.pack(f'>I I {len(name_bytes)}s',
                       id, len(name_bytes), name_bytes)
```

### What are common causes of struct.error exceptions?

- Format string syntax errors
- Values exceeding the allowed range for format characters
- Insufficient buffer length
- Passing non-bytes type to string format

```python
import struct

# Value out of range
try:
    struct.pack('B', 256)  # B is 0-255
except struct.error:
    print("Value out of range")

# Insufficient buffer
try:
    struct.unpack('>I I', b'\x00\x01\x02')  # Needs 8 bytes
except struct.error:
    print("Insufficient buffer")
```

## Further Reading

- [Python Official Documentation - struct](https://docs.python.org/3/library/struct.html)
- [Python Official Documentation - Binary Data Services](https://docs.python.org/3/library/binary.html)
- [array module](https://docs.python.org/3/library/array.html) - Efficient storage of homogeneous data
- [ctypes module](https://docs.python.org/3/library/ctypes.html) - More complex C data type handling
- [mmap module](https://docs.python.org/3/library/mmap.html) - Memory-mapped files
- [IEEE 754 Floating Point Standard](https://en.wikipedia.org/wiki/IEEE_754) - Understanding floating-point representation
- [Network Byte Order](https://en.wikipedia.org/wiki/Endianness) - Deep dive into byte order
