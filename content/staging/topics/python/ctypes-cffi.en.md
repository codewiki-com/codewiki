---
title: "Python C Extensions: ctypes and CFFI"
description: "Deep understanding of two mainstream ways to call C code from Python: ctypes and CFFI, including shared library loading, data type mapping, callback functions, and other core techniques"
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - ctypes
  - CFFI
  - C Extensions
  - FFI
  - Shared Libraries
status: imported
origin: old/src/content/docs/python/ctypes-cffi.en.md
divergence: 0.193
issues: []
legacy:
  category: Python
  subcategory: Advanced Topics
  order: 50
  lastUpdated: 2026-01-07
---

## Conceptual Explanation

### What is FFI?

FFI (Foreign Function Interface) is a mechanism that allows one programming language to call code written in another programming language. In Python, FFI is primarily used to call dynamic libraries (.so/.dll/.dylib) written in C/C++, enabling:

- **Performance optimization**: Delegating computationally intensive tasks to C code
- **Reusing existing libraries**: Calling mature C libraries (such as OpenSSL, SQLite, image processing libraries, etc.)
- **System programming**: Accessing low-level operating system APIs
- **Hardware interaction**: Communicating with drivers or embedded devices

### ctypes vs CFFI

Python provides two mainstream C extension solutions:

| Feature | ctypes | CFFI |
|---------|--------|------|
| **Source** | Python standard library | Third-party library (requires installation) |
| **API style** | Low-level, manual | High-level, declarative |
| **C header parsing** | Not supported | Supported |
| **Performance** | Good | Excellent (ABI mode) / Outstanding (API mode) |
| **Error checking** | Weaker | Stronger |
| **Learning curve** | Steeper | Gentler |
| **Use cases** | Quick prototyping, simple calls | Production environment, complex interfaces |

### Historical Background

- **ctypes**: Introduced to Python standard library in Python 2.5 (2006), developed by Thomas Heller
- **CFFI**: Developed in 2012 by the PyPy team, aiming to provide a more Pythonic way of calling C

## Core Principles

### How ctypes Works

ctypes implements Python-C interaction through the following steps:

```
Python code
    ↓
ctypes type conversion (Python object → C type)
    ↓
libffi (low-level FFI library)
    ↓
Dynamic library (.so/.dll)
    ↓
C function execution
    ↓
libffi (return value handling)
    ↓
ctypes type conversion (C type → Python object)
    ↓
Python code
```

### How CFFI Works

CFFI provides two modes:

**ABI mode (Application Binary Interface)**:
- Loads dynamic libraries at runtime
- Works similarly to ctypes
- No compiler required
- Suitable for rapid prototyping

**API mode (Application Programming Interface)**:
- Compiles extension modules at build time
- Requires a C compiler
- Best performance
- Suitable for production environments

```
CFFI ABI mode:
Python code → CFFI parses C declarations → Runtime library loading → Function call

CFFI API mode:
C declarations → CFFI compilation → Generate Python extension → Direct call (no runtime overhead)
```

### Memory Layout and Alignment

C language data types have specific layout rules in memory:

```c
// C struct example
struct Example {
    char a;      // 1 byte
    // 3 bytes padding (align to 4-byte boundary)
    int b;       // 4 bytes
    short c;     // 2 bytes
    // 2 bytes padding
};  // Total size: 12 bytes (not 7 bytes)
```

Both ctypes and CFFI automatically handle this memory alignment, ensuring Python structures match C structure memory layouts.

## Key Points

### ctypes Core Concepts

1. **Loading Dynamic Libraries**
   - `CDLL`: Uses cdecl calling convention (default)
   - `WinDLL`: Uses stdcall calling convention (Windows)
   - `OleDLL`: For COM objects (Windows)
   - `PyDLL`: CDLL that maintains GIL

2. **Basic Data Type Mapping**
   - `c_int`, `c_long`, `c_float`, `c_double`, etc.
   - `c_char_p` (C string), `c_void_p` (void pointer)
   - `POINTER()` (pointer type)

3. **Structures and Unions**
   - `Structure`: Define C structures
   - `Union`: Define C unions

4. **Callback Functions**
   - `CFUNCTYPE`: cdecl calling convention
   - `WINFUNCTYPE`: stdcall calling convention

### CFFI Core Concepts

1. **FFI Object**
   - `ffi.cdef()`: Declare C types and functions
   - `ffi.dlopen()`: Load dynamic library (ABI mode)
   - `ffi.verify()`: Compile extension (API mode, deprecated)
   - `ffi.set_source()`: Modern API mode

2. **Type System**
   - `ffi.new()`: Allocate C memory
   - `ffi.cast()`: Type conversion
   - `ffi.string()`: C string to Python
   - `ffi.buffer()`: Access raw memory

3. **Memory Management**
   - Automatic garbage collection (via reference counting)
   - `ffi.gc()`: Bind cleanup functions

## Code Examples

### Preparation: Creating a C Shared Library

First, create a simple C library for testing:

```c
// mathlib.c
#include <math.h>
#include <stdlib.h>
#include <string.h>

// Simple function
int add(int a, int b) {
    return a + b;
}

double calculate_distance(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return sqrt(dx * dx + dy * dy);
}

// Handle arrays
void array_double(int* arr, int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;
    }
}

// Handle strings
char* greet(const char* name) {
    static char buffer[256];
    snprintf(buffer, sizeof(buffer), "Hello, %s!", name);
    return buffer;
}

// Struct
typedef struct {
    double x;
    double y;
} Point;

double point_distance(Point* p1, Point* p2) {
    double dx = p2->x - p1->x;
    double dy = p2->y - p1->y;
    return sqrt(dx * dx + dy * dy);
}

// Callback function
typedef int (*Comparator)(int, int);

void sort_array(int* arr, int size, Comparator cmp) {
    // Simple bubble sort
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - i - 1; j++) {
            if (cmp(arr[j], arr[j + 1]) > 0) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
```

Compile as shared library:

```bash
# Linux
gcc -shared -fPIC -o libmathlib.so mathlib.c -lm

# macOS
gcc -shared -fPIC -o libmathlib.dylib mathlib.c -lm

# Windows (MinGW)
gcc -shared -o mathlib.dll mathlib.c
```

### ctypes Basic Usage

#### Loading Shared Libraries

```python
import ctypes
import os
import sys

def load_library():
    """Cross-platform shared library loading"""
    if sys.platform == "win32":
        lib_name = "mathlib.dll"
    elif sys.platform == "darwin":
        lib_name = "libmathlib.dylib"
    else:
        lib_name = "libmathlib.so"

    # Get full path to library
    lib_path = os.path.join(os.path.dirname(__file__), lib_name)

    # Load library
    lib = ctypes.CDLL(lib_path)
    return lib

# Load standard C library
if sys.platform == "win32":
    libc = ctypes.CDLL("msvcrt")
else:
    libc = ctypes.CDLL(None)  # Load default C library

# Call printf
libc.printf(b"Hello from C! Value: %d\n", 42)
```

#### Data Type Mapping

```python
import ctypes

# Basic type mapping table
type_mapping = {
    "c_bool": ctypes.c_bool,       # _Bool
    "c_char": ctypes.c_char,       # char
    "c_wchar": ctypes.c_wchar,     # wchar_t
    "c_byte": ctypes.c_byte,       # char (signed)
    "c_ubyte": ctypes.c_ubyte,     # unsigned char
    "c_short": ctypes.c_short,     # short
    "c_ushort": ctypes.c_ushort,   # unsigned short
    "c_int": ctypes.c_int,         # int
    "c_uint": ctypes.c_uint,       # unsigned int
    "c_long": ctypes.c_long,       # long
    "c_ulong": ctypes.c_ulong,     # unsigned long
    "c_longlong": ctypes.c_longlong,     # long long
    "c_ulonglong": ctypes.c_ulonglong,   # unsigned long long
    "c_size_t": ctypes.c_size_t,   # size_t
    "c_ssize_t": ctypes.c_ssize_t, # ssize_t
    "c_float": ctypes.c_float,     # float
    "c_double": ctypes.c_double,   # double
    "c_longdouble": ctypes.c_longdouble,  # long double
    "c_char_p": ctypes.c_char_p,   # char* (null-terminated)
    "c_wchar_p": ctypes.c_wchar_p, # wchar_t*
    "c_void_p": ctypes.c_void_p,   # void*
}

# Create and use basic types
i = ctypes.c_int(42)
print(f"c_int value: {i.value}")

f = ctypes.c_double(3.14159)
print(f"c_double value: {f.value}")

s = ctypes.c_char_p(b"Hello")
print(f"c_char_p value: {s.value}")
```

#### Calling Functions and Setting Parameter/Return Types

```python
import ctypes

# Assuming libmathlib is already loaded
lib = ctypes.CDLL("./libmathlib.so")

# Set function signatures (recommended practice)
lib.add.argtypes = [ctypes.c_int, ctypes.c_int]
lib.add.restype = ctypes.c_int

lib.calculate_distance.argtypes = [
    ctypes.c_double, ctypes.c_double,
    ctypes.c_double, ctypes.c_double
]
lib.calculate_distance.restype = ctypes.c_double

lib.greet.argtypes = [ctypes.c_char_p]
lib.greet.restype = ctypes.c_char_p

# Call functions
result = lib.add(10, 20)
print(f"10 + 20 = {result}")

distance = lib.calculate_distance(0.0, 0.0, 3.0, 4.0)
print(f"Distance: {distance}")

greeting = lib.greet(b"Python")
print(f"Greeting: {greeting.decode("utf-8")}")
```

#### Handling Arrays

```python
import ctypes

lib = ctypes.CDLL("./libmathlib.so")

# Method 1: Using array types
IntArray5 = ctypes.c_int * 5
arr = IntArray5(1, 2, 3, 4, 5)

print(f"Original array: {list(arr)}")

# Set function signature
lib.array_double.argtypes = [ctypes.POINTER(ctypes.c_int), ctypes.c_int]
lib.array_double.restype = None

lib.array_double(arr, 5)
print(f"After doubling: {list(arr)}")

# Method 2: Creating from Python list
data = [10, 20, 30, 40, 50]
arr2 = (ctypes.c_int * len(data))(*data)
lib.array_double(arr2, len(data))
print(f"List converted and doubled: {list(arr2)}")

# Method 3: Using numpy arrays (recommended for large data)
import numpy as np

np_arr = np.array([1, 2, 3, 4, 5], dtype=np.int32)
arr_ptr = np_arr.ctypes.data_as(ctypes.POINTER(ctypes.c_int))
lib.array_double(arr_ptr, len(np_arr))
print(f"numpy array doubled: {np_arr}")
```

#### Defining and Using Structures

```python
import ctypes

class Point(ctypes.Structure):
    """Corresponds to C Point struct"""
    _fields_ = [
        ("x", ctypes.c_double),
        ("y", ctypes.c_double),
    ]

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

# Create struct instances
p1 = Point(0.0, 0.0)
p2 = Point(3.0, 4.0)

print(f"Point 1: {p1}")
print(f"Point 2: {p2}")

# Set function signature
lib = ctypes.CDLL("./libmathlib.so")
lib.point_distance.argtypes = [ctypes.POINTER(Point), ctypes.POINTER(Point)]
lib.point_distance.restype = ctypes.c_double

# Pass struct pointers
distance = lib.point_distance(ctypes.byref(p1), ctypes.byref(p2))
print(f"Distance between points: {distance}")

# Nested structs
class Rectangle(ctypes.Structure):
    _fields_ = [
        ("top_left", Point),
        ("bottom_right", Point),
    ]

rect = Rectangle(Point(0, 10), Point(10, 0))
print(f"Rectangle: {rect.top_left} to {rect.bottom_right}")
```

#### Unions

```python
import ctypes

class IntOrFloat(ctypes.Union):
    """C union example"""
    _fields_ = [
        ("as_int", ctypes.c_int),
        ("as_float", ctypes.c_float),
    ]

# Unions share memory
u = IntOrFloat()
u.as_float = 3.14
print(f"As float: {u.as_float}")
print(f"As int: {u.as_int}")  # View integer interpretation of same memory

# Practical application: Parsing binary data
class IPAddress(ctypes.Union):
    _fields_ = [
        ("bytes", ctypes.c_uint8 * 4),
        ("value", ctypes.c_uint32),
    ]

ip = IPAddress()
ip.value = 0xC0A80101  # 192.168.1.1
print(f"IP address: {".".join(str(b) for b in ip.bytes[::-1])}")
```

#### Callback Functions

```python
import ctypes

lib = ctypes.CDLL("./libmathlib.so")

# Define callback function type
# Corresponds to C: typedef int (*Comparator)(int, int);
COMPARATOR = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int, ctypes.c_int)

# Python callback functions
def ascending(a, b):
    """Ascending comparison"""
    return a - b

def descending(a, b):
    """Descending comparison"""
    return b - a

def abs_compare(a, b):
    """Compare by absolute value"""
    return abs(a) - abs(b)

# Create callback objects
cmp_asc = COMPARATOR(ascending)
cmp_desc = COMPARATOR(descending)
cmp_abs = COMPARATOR(abs_compare)

# Set function signature
lib.sort_array.argtypes = [
    ctypes.POINTER(ctypes.c_int),
    ctypes.c_int,
    COMPARATOR
]
lib.sort_array.restype = None

# Test sorting
data = [3, -1, 4, -1, 5, -9, 2, 6]
arr = (ctypes.c_int * len(data))(*data)

print(f"Original array: {list(arr)}")

# Ascending sort
lib.sort_array(arr, len(arr), cmp_asc)
print(f"Ascending sort: {list(arr)}")

# Reinitialize
arr = (ctypes.c_int * len(data))(*data)
lib.sort_array(arr, len(arr), cmp_desc)
print(f"Descending sort: {list(arr)}")

# Sort by absolute value
arr = (ctypes.c_int * len(data))(*data)
lib.sort_array(arr, len(arr), cmp_abs)
print(f"Absolute value sort: {list(arr)}")
```

### CFFI Basic Usage

#### Installation and Basic Setup

```bash
pip install cffi
```

```python
from cffi import FFI

ffi = FFI()

# Declare C functions and types (same as C header file)
ffi.cdef("""
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);
    char* greet(const char* name);

    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);

    typedef int (*Comparator)(int, int);
    void sort_array(int* arr, int size, Comparator cmp);
""")

# ABI mode: runtime loading
lib = ffi.dlopen("./libmathlib.so")
```

#### Calling Functions

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);
    char* greet(const char* name);
""")

lib = ffi.dlopen("./libmathlib.so")

# Direct call, CFFI automatically handles type conversion
result = lib.add(10, 20)
print(f"10 + 20 = {result}")

distance = lib.calculate_distance(0.0, 0.0, 3.0, 4.0)
print(f"Distance: {distance}")

# String handling
greeting = lib.greet(b"Python")
print(f"Greeting: {ffi.string(greeting).decode("utf-8")}")
```

#### Handling Arrays and Pointers

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    void array_double(int* arr, int size);
""")

lib = ffi.dlopen("./libmathlib.so")

# Method 1: Allocate memory using ffi.new()
arr = ffi.new("int[5]", [1, 2, 3, 4, 5])
print(f"Original array: {list(arr)}")

lib.array_double(arr, 5)
print(f"After doubling: {list(arr)}")

# Method 2: Convert from Python list
data = [10, 20, 30, 40, 50]
arr2 = ffi.new("int[]", data)
lib.array_double(arr2, len(data))
print(f"List converted and doubled: {list(arr2)}")

# Method 3: Working with numpy
import numpy as np

np_arr = np.array([1, 2, 3, 4, 5], dtype=np.int32)
arr_ptr = ffi.cast("int*", np_arr.ctypes.data)
lib.array_double(arr_ptr, len(np_arr))
print(f"numpy array doubled: {np_arr}")

# Accessing pointer elements
ptr = ffi.new("double*", 3.14)
print(f"Pointer value: {ptr[0]}")

# Multidimensional arrays
matrix = ffi.new("int[3][3]", [[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print(f"Matrix[1][1] = {matrix[1][1]}")
```

#### Struct Operations

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);

    // Complex struct
    typedef struct {
        char name[64];
        int age;
        double salary;
    } Employee;
""")

lib = ffi.dlopen("./libmathlib.so")

# Create struct
p1 = ffi.new("Point*")
p1.x = 0.0
p1.y = 0.0

p2 = ffi.new("Point*", {"x": 3.0, "y": 4.0})  # Initialize with dict

print(f"Point 1: ({p1.x}, {p1.y})")
print(f"Point 2: ({p2.x}, {p2.y})")

distance = lib.point_distance(p1, p2)
print(f"Distance between points: {distance}")

# Struct array
points = ffi.new("Point[3]", [
    {"x": 0, "y": 0},
    {"x": 1, "y": 1},
    {"x": 2, "y": 2}
])

for i, p in enumerate(points):
    print(f"Point {i}: ({p.x}, {p.y})")

# Nested struct
emp = ffi.new("Employee*")
emp.name = b"Alice"  # Char arrays need bytes
emp.age = 30
emp.salary = 75000.0

print(f"Employee: {ffi.string(emp.name).decode()}, age {emp.age}, salary {emp.salary}")
```

#### Callback Functions

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    typedef int (*Comparator)(int, int);
    void sort_array(int* arr, int size, Comparator cmp);
""")

lib = ffi.dlopen("./libmathlib.so")

# Define callback functions
@ffi.callback("int(int, int)")
def ascending(a, b):
    return a - b

@ffi.callback("int(int, int)")
def descending(a, b):
    return b - a

# Use callbacks
data = [3, 1, 4, 1, 5, 9, 2, 6]
arr = ffi.new("int[]", data)

print(f"Original array: {list(arr)}")

lib.sort_array(arr, len(data), ascending)
print(f"Ascending sort: {list(arr)}")

arr = ffi.new("int[]", data)
lib.sort_array(arr, len(data), descending)
print(f"Descending sort: {list(arr)}")

# Using lambda (need to keep reference)
callbacks = []  # Prevent garbage collection

def make_callback(func):
    cb = ffi.callback("int(int, int)")(func)
    callbacks.append(cb)  # Keep reference
    return cb

abs_compare = make_callback(lambda a, b: abs(a) - abs(b))
arr = ffi.new("int[]", data)
lib.sort_array(arr, len(data), abs_compare)
print(f"Absolute value sort: {list(arr)}")
```

#### CFFI API Mode (Compiled Mode)

API mode requires compilation at build time, with better performance:

```python
# build_mathlib.py
from cffi import FFI

ffi = FFI()

# C declarations
ffi.cdef("""
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);

    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);
""")

# Set source and library
ffi.set_source(
    "_mathlib",  # Generated module name
    """
    // Include original C header file, or write C code directly
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);

    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);
    """,
    libraries=["mathlib"],  # Library to link
    library_dirs=["."],     # Library search path
    include_dirs=["."],     # Header file search path
)

if __name__ == "__main__":
    ffi.compile(verbose=True)
```

```bash
# Compile
python build_mathlib.py

# Use the generated module
```

```python
# Use the compiled module
from _mathlib import ffi, lib

result = lib.add(10, 20)
print(f"10 + 20 = {result}")

p1 = ffi.new("Point*", {"x": 0, "y": 0})
p2 = ffi.new("Point*", {"x": 3, "y": 4})
distance = lib.point_distance(p1, p2)
print(f"Distance: {distance}")
```

### Calling System Library Examples

#### Calling libc Functions

```python
from cffi import FFI

ffi = FFI()

ffi.cdef("""
    // Time related
    typedef long time_t;
    time_t time(time_t *t);

    struct tm {
        int tm_sec;
        int tm_min;
        int tm_hour;
        int tm_mday;
        int tm_mon;
        int tm_year;
        int tm_wday;
        int tm_yday;
        int tm_isdst;
    };

    struct tm *localtime(const time_t *timep);
    char *asctime(const struct tm *tm);

    // Memory operations
    void *malloc(size_t size);
    void free(void *ptr);
    void *memcpy(void *dest, const void *src, size_t n);
    int memcmp(const void *s1, const void *s2, size_t n);

    // String operations
    size_t strlen(const char *s);
    char *strcpy(char *dest, const char *src);
    int strcmp(const char *s1, const char *s2);

    // Math functions
    double sin(double x);
    double cos(double x);
    double sqrt(double x);
    double pow(double x, double y);
""")

# Load C standard library
import sys
if sys.platform == "win32":
    libc = ffi.dlopen("msvcrt")
    libm = ffi.dlopen("msvcrt")
elif sys.platform == "darwin":
    libc = ffi.dlopen(None)
    libm = ffi.dlopen(None)
else:
    libc = ffi.dlopen(None)
    libm = ffi.dlopen("libm.so.6")

# Get current time
t = ffi.new("time_t*")
libc.time(t)
tm = libc.localtime(t)
time_str = ffi.string(libc.asctime(tm)).decode().strip()
print(f"Current time: {time_str}")

# Math operations
import math
print(f"sin(pi/2) = {libm.sin(math.pi / 2)}")
print(f"sqrt(2) = {libm.sqrt(2.0)}")
print(f"2^10 = {libm.pow(2.0, 10.0)}")

# String operations
s1 = ffi.new("char[]", b"Hello")
s2 = ffi.new("char[]", b"World")
print(f"strlen("Hello") = {libc.strlen(s1)}")
print(f"strcmp("Hello", "World") = {libc.strcmp(s1, s2)}")
```

#### Calling OpenSSL for Encryption

```python
from cffi import FFI
import sys

ffi = FFI()

ffi.cdef("""
    // MD5
    typedef struct MD5state_st {
        unsigned int A, B, C, D;
        unsigned int Nl, Nh;
        unsigned int data[16];
        unsigned int num;
    } MD5_CTX;

    int MD5_Init(MD5_CTX *c);
    int MD5_Update(MD5_CTX *c, const void *data, size_t len);
    int MD5_Final(unsigned char *md, MD5_CTX *c);

    // SHA256
    unsigned char *SHA256(const unsigned char *d, size_t n, unsigned char *md);

    // Random numbers
    int RAND_bytes(unsigned char *buf, int num);
""")

# Load OpenSSL
try:
    if sys.platform == "darwin":
        ssl = ffi.dlopen("/usr/local/opt/openssl/lib/libcrypto.dylib")
    else:
        ssl = ffi.dlopen("libcrypto.so")
except OSError:
    print("OpenSSL not installed or path incorrect")
    ssl = None

if ssl:
    # MD5 hash
    ctx = ffi.new("MD5_CTX*")
    md5_result = ffi.new("unsigned char[16]")

    ssl.MD5_Init(ctx)
    message = b"Hello, World!"
    ssl.MD5_Update(ctx, message, len(message))
    ssl.MD5_Final(md5_result, ctx)

    md5_hex = "".join(f"{md5_result[i]:02x}" for i in range(16))
    print(f"MD5: {md5_hex}")

    # SHA256 hash
    sha256_result = ffi.new("unsigned char[32]")
    ssl.SHA256(message, len(message), sha256_result)

    sha256_hex = "".join(f"{sha256_result[i]:02x}" for i in range(32))
    print(f"SHA256: {sha256_hex}")

    # Generate random numbers
    random_bytes = ffi.new("unsigned char[16]")
    ssl.RAND_bytes(random_bytes, 16)
    random_hex = "".join(f"{random_bytes[i]:02x}" for i in range(16))
    print(f"Random: {random_hex}")
```

## Best Practices

### Always Declare Function Signatures

```python
# ctypes - Always set argtypes and restype
import ctypes

lib = ctypes.CDLL("./mylib.so")

# Recommended: Explicit declaration
lib.my_function.argtypes = [ctypes.c_int, ctypes.c_double]
lib.my_function.restype = ctypes.c_double

# Not recommended: Rely on default behavior
# result = lib.my_function(10, 3.14)  # May produce incorrect results
```

### Use Context Managers for Resource Handling

```python
from cffi import FFI
from contextlib import contextmanager

ffi = FFI()
ffi.cdef("""
    void* create_resource();
    void destroy_resource(void* resource);
    int use_resource(void* resource);
""")

lib = ffi.dlopen("./mylib.so")

@contextmanager
def managed_resource():
    """Resource management context"""
    resource = lib.create_resource()
    try:
        yield resource
    finally:
        lib.destroy_resource(resource)

# Usage
with managed_resource() as res:
    result = lib.use_resource(res)
    print(f"Result: {result}")
# Resource automatically released
```

### Wrap as Python Classes

```python
import ctypes
from typing import List, Tuple

class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]

class Geometry:
    """Python wrapper for geometry library"""

    def __init__(self, lib_path: str):
        self._lib = ctypes.CDLL(lib_path)
        self._setup_functions()

    def _setup_functions(self):
        """Set up function signatures"""
        self._lib.point_distance.argtypes = [
            ctypes.POINTER(Point),
            ctypes.POINTER(Point)
        ]
        self._lib.point_distance.restype = ctypes.c_double

    def distance(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """Calculate distance between two points"""
        point1 = Point(p1[0], p1[1])
        point2 = Point(p2[0], p2[1])
        return self._lib.point_distance(
            ctypes.byref(point1),
            ctypes.byref(point2)
        )

# Usage
geo = Geometry("./libmathlib.so")
dist = geo.distance((0, 0), (3, 4))
print(f"Distance: {dist}")
```

### Error Handling

```python
from cffi import FFI
import errno

ffi = FFI()
ffi.cdef("""
    int open(const char *pathname, int flags);
    int close(int fd);
    int *__errno_location();  // Linux
    // int *__error();        // macOS
""")

libc = ffi.dlopen(None)

def safe_open(path: str, flags: int) -> int:
    """File open with error checking"""
    fd = libc.open(path.encode(), flags)
    if fd == -1:
        errno_ptr = libc.__errno_location()
        error_code = errno_ptr[0]
        raise OSError(error_code, f"Failed to open file: {path}")
    return fd

# Usage
try:
    fd = safe_open("/nonexistent/file", 0)
except OSError as e:
    print(f"Error: {e}")
```

### Memory Safety

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    void* malloc(size_t size);
    void free(void* ptr);
""")

libc = ffi.dlopen(None)

# Use ffi.gc() to automatically free memory
def safe_malloc(size: int):
    """Allocate memory with automatic cleanup"""
    ptr = libc.malloc(size)
    if ptr == ffi.NULL:
        raise MemoryError(f"Cannot allocate {size} bytes")
    return ffi.gc(ptr, libc.free)

# Usage
buffer = safe_malloc(1024)
# When buffer is no longer referenced, free() is automatically called
```

### Thread Safety

```python
import ctypes
import threading
from concurrent.futures import ThreadPoolExecutor

# Some C libraries are not thread-safe, require locking
lib = ctypes.CDLL("./mylib.so")
lib_lock = threading.Lock()

def thread_safe_call(arg):
    """Thread-safe C function call"""
    with lib_lock:
        return lib.unsafe_function(arg)

# Or use thread-local storage
class ThreadLocalLib:
    """Separate library instance per thread"""
    _local = threading.local()

    @classmethod
    def get_lib(cls):
        if not hasattr(cls._local, "lib"):
            cls._local.lib = ctypes.CDLL("./mylib.so")
        return cls._local.lib
```

## Common Pitfalls

### String Encoding Issues

```python
import ctypes
from cffi import FFI

# Pitfall: Forgetting to encode
lib = ctypes.CDLL("./mylib.so")
lib.greet.argtypes = [ctypes.c_char_p]
lib.greet.restype = ctypes.c_char_p

# Wrong: Passing str
# lib.greet("Python")  # TypeError

# Correct: Passing bytes
result = lib.greet(b"Python")
print(result.decode("utf-8"))

# Same attention needed in CFFI
ffi = FFI()
ffi.cdef("char* greet(const char* name);")
lib = ffi.dlopen("./mylib.so")

result = lib.greet(b"Python")
print(ffi.string(result).decode("utf-8"))
```

### Callback Function Lifetime

```python
import ctypes

CALLBACK_TYPE = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int)

def create_callback():
    def my_callback(x):
        return x * 2
    return CALLBACK_TYPE(my_callback)

# Pitfall: Callback gets garbage collected
# cb = create_callback()
# lib.register_callback(cb)  # Dangerous! cb may be collected

# Correct: Keep reference
callbacks = []

def register_callback(func):
    cb = CALLBACK_TYPE(func)
    callbacks.append(cb)  # Keep reference
    lib.register_callback(cb)

# Same attention needed in CFFI
from cffi import FFI
ffi = FFI()

@ffi.callback("int(int)")
def my_callback(x):
    return x * 2

# Need to keep reference to my_callback
```

### Struct Alignment Issues

```python
import ctypes

# C struct
"""
struct Misaligned {
    char a;
    int b;
    char c;
};
"""

# Pitfall: Not considering alignment
class MisalignedWrong(ctypes.Structure):
    _pack_ = 1  # Disable alignment (if C also uses #pragma pack(1))
    _fields_ = [
        ("a", ctypes.c_char),
        ("b", ctypes.c_int),
        ("c", ctypes.c_char),
    ]

# Correct: Default alignment (consistent with platform C compiler)
class MisalignedCorrect(ctypes.Structure):
    _fields_ = [
        ("a", ctypes.c_char),
        ("b", ctypes.c_int),
        ("c", ctypes.c_char),
    ]

print(f"Unaligned size: {ctypes.sizeof(MisalignedWrong)}")   # 6
print(f"Correctly aligned size: {ctypes.sizeof(MisalignedCorrect)}")  # 12
```

### Dangling Pointers

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    char* get_static_string();
    char* get_dynamic_string();  // Returns malloc'd memory
    void free_string(char* s);
""")

lib = ffi.dlopen("./mylib.so")

# Static string - safe
static_str = lib.get_static_string()
print(ffi.string(static_str))

# Dynamic string - needs manual cleanup
dynamic_str = lib.get_dynamic_string()
result = ffi.string(dynamic_str).decode()
lib.free_string(dynamic_str)  # Must free!
print(result)

# Use gc for automatic management
def get_managed_string():
    s = lib.get_dynamic_string()
    return ffi.gc(s, lib.free_string)

managed = get_managed_string()
print(ffi.string(managed).decode())
# Automatically freed
```

### Array Out of Bounds

```python
import ctypes

lib = ctypes.CDLL("./mylib.so")
lib.array_double.argtypes = [ctypes.POINTER(ctypes.c_int), ctypes.c_int]

arr = (ctypes.c_int * 5)(1, 2, 3, 4, 5)

# Pitfall: Passing wrong size
# lib.array_double(arr, 10)  # Out of bounds access!

# Correct: Use actual size
lib.array_double(arr, len(arr))

# Safer wrapper
def safe_array_double(arr):
    """Safe array operation"""
    if not isinstance(arr, ctypes.Array):
        raise TypeError("Requires ctypes array")
    lib.array_double(arr, len(arr))
```

### Type Size Differences

```python
import ctypes
import sys

# Pitfall: Assuming fixed sizes
# c_long has different sizes on different platforms

print(f"c_int size: {ctypes.sizeof(ctypes.c_int)}")      # Usually 4
print(f"c_long size: {ctypes.sizeof(ctypes.c_long)}")    # 32-bit: 4, 64-bit Linux: 8, 64-bit Windows: 4
print(f"c_size_t size: {ctypes.sizeof(ctypes.c_size_t)}")  # 32-bit: 4, 64-bit: 8

# Correct: Use explicitly sized types
# Use fixed-size types
c_int32 = ctypes.c_int32   # Always 4 bytes
c_int64 = ctypes.c_int64   # Always 8 bytes

# Or use conditional logic
if sys.maxsize > 2**32:
    c_pointer_int = ctypes.c_int64
else:
    c_pointer_int = ctypes.c_int32
```

## Performance Considerations

### Call Overhead Comparison

```python
import time
import ctypes
from cffi import FFI

# Prepare tests
lib_ctypes = ctypes.CDLL("./libmathlib.so")
lib_ctypes.add.argtypes = [ctypes.c_int, ctypes.c_int]
lib_ctypes.add.restype = ctypes.c_int

ffi = FFI()
ffi.cdef("int add(int a, int b);")
lib_cffi = ffi.dlopen("./libmathlib.so")

def benchmark(name, func, iterations=1000000):
    """Benchmark test"""
    start = time.perf_counter()
    for _ in range(iterations):
        func()
    elapsed = time.perf_counter() - start
    ops_per_sec = iterations / elapsed
    print(f"{name}: {elapsed:.3f}s ({ops_per_sec:,.0f} ops/s)")

# Pure Python
def python_add():
    return 10 + 20

# ctypes call
def ctypes_add():
    return lib_ctypes.add(10, 20)

# CFFI call
def cffi_add():
    return lib_cffi.add(10, 20)

print("Performance comparison (1 million calls):")
benchmark("Pure Python", python_add)
benchmark("ctypes", ctypes_add)
benchmark("CFFI ABI", cffi_add)

# CFFI API mode (compiled) is usually fastest
```

### Batch Operation Optimization

```python
import numpy as np
import ctypes
from cffi import FFI

# Inefficient: Single element operations
def slow_process(lib, data):
    """Process elements one by one (slow)"""
    result = []
    for x in data:
        result.append(lib.process_single(ctypes.c_double(x)))
    return result

# Efficient: Batch operations
def fast_process(lib, data):
    """Batch processing (fast)"""
    np_data = np.array(data, dtype=np.float64)
    n = len(np_data)

    lib.process_array.argtypes = [
        ctypes.POINTER(ctypes.c_double),
        ctypes.c_int
    ]

    ptr = np_data.ctypes.data_as(ctypes.POINTER(ctypes.c_double))
    lib.process_array(ptr, n)

    return np_data.tolist()
```

### Reducing Type Conversions

```python
from cffi import FFI
import numpy as np

ffi = FFI()
ffi.cdef("""
    void matrix_multiply(double* a, double* b, double* c, int n);
""")

lib = ffi.dlopen("./libmatrix.so")

# Inefficient: Convert on every call
def slow_matmul(a, b):
    n = len(a)
    a_arr = ffi.new("double[]", [x for row in a for x in row])
    b_arr = ffi.new("double[]", [x for row in b for x in row])
    c_arr = ffi.new("double[]", n * n)
    lib.matrix_multiply(a_arr, b_arr, c_arr, n)
    return [[c_arr[i*n + j] for j in range(n)] for i in range(n)]

# Efficient: Use numpy directly
def fast_matmul(a, b):
    n = a.shape[0]
    c = np.zeros((n, n), dtype=np.float64)

    a_ptr = ffi.cast("double*", a.ctypes.data)
    b_ptr = ffi.cast("double*", b.ctypes.data)
    c_ptr = ffi.cast("double*", c.ctypes.data)

    lib.matrix_multiply(a_ptr, b_ptr, c_ptr, n)
    return c
```

### Using API Mode

```python
# CFFI API mode vs ABI mode performance comparison

# ABI mode (runtime parsing)
ffi_abi = FFI()
ffi_abi.cdef("int add(int a, int b);")
lib_abi = ffi_abi.dlopen("./libmathlib.so")

# API mode (compile-time binding) - needs to be compiled first
# from _mathlib import ffi as ffi_api, lib as lib_api

# API mode is typically 2-10x faster than ABI mode
# Because it avoids runtime type parsing overhead
```

## Practical Scenarios

### Scenario 1: Calling SQLite Database

```python
from cffi import FFI

ffi = FFI()

ffi.cdef("""
    typedef struct sqlite3 sqlite3;
    typedef struct sqlite3_stmt sqlite3_stmt;

    int sqlite3_open(const char *filename, sqlite3 **ppDb);
    int sqlite3_close(sqlite3 *db);
    int sqlite3_exec(
        sqlite3 *db,
        const char *sql,
        int (*callback)(void*, int, char**, char**),
        void *arg,
        char **errmsg
    );
    void sqlite3_free(void *ptr);

    int sqlite3_prepare_v2(
        sqlite3 *db,
        const char *zSql,
        int nByte,
        sqlite3_stmt **ppStmt,
        const char **pzTail
    );
    int sqlite3_step(sqlite3_stmt *stmt);
    int sqlite3_finalize(sqlite3_stmt *stmt);
    int sqlite3_column_int(sqlite3_stmt *stmt, int iCol);
    const unsigned char *sqlite3_column_text(sqlite3_stmt *stmt, int iCol);
    const char *sqlite3_errmsg(sqlite3 *db);

    // Constants
    #define SQLITE_OK 0
    #define SQLITE_ROW 100
    #define SQLITE_DONE 101
""")

sqlite = ffi.dlopen("libsqlite3.so")

class SQLiteDB:
    """SQLite database wrapper"""

    SQLITE_OK = 0
    SQLITE_ROW = 100
    SQLITE_DONE = 101

    def __init__(self, db_path: str):
        self.db = ffi.new("sqlite3**")
        result = sqlite.sqlite3_open(db_path.encode(), self.db)
        if result != self.SQLITE_OK:
            raise Exception(f"Cannot open database: {db_path}")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def close(self):
        if self.db[0] != ffi.NULL:
            sqlite.sqlite3_close(self.db[0])
            self.db[0] = ffi.NULL

    def execute(self, sql: str) -> None:
        """Execute SQL (no return value)"""
        errmsg = ffi.new("char**")
        result = sqlite.sqlite3_exec(
            self.db[0], sql.encode(), ffi.NULL, ffi.NULL, errmsg
        )
        if result != self.SQLITE_OK:
            error = ffi.string(errmsg[0]).decode()
            sqlite.sqlite3_free(errmsg[0])
            raise Exception(f"SQL error: {error}")

    def query(self, sql: str):
        """Execute query and return results"""
        stmt = ffi.new("sqlite3_stmt**")
        tail = ffi.new("const char**")

        result = sqlite.sqlite3_prepare_v2(
            self.db[0], sql.encode(), -1, stmt, tail
        )

        if result != self.SQLITE_OK:
            raise Exception(ffi.string(sqlite.sqlite3_errmsg(self.db[0])).decode())

        try:
            rows = []
            while sqlite.sqlite3_step(stmt[0]) == self.SQLITE_ROW:
                # Simplified: Assuming only two columns (id, name)
                id_val = sqlite.sqlite3_column_int(stmt[0], 0)
                name_ptr = sqlite.sqlite3_column_text(stmt[0], 1)
                name = ffi.string(name_ptr).decode() if name_ptr != ffi.NULL else None
                rows.append((id_val, name))
            return rows
        finally:
            sqlite.sqlite3_finalize(stmt[0])

# Usage example
with SQLiteDB(":memory:") as db:
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
    db.execute("INSERT INTO users (name) VALUES ('Alice')")
    db.execute("INSERT INTO users (name) VALUES ('Bob')")

    results = db.query("SELECT * FROM users")
    for row in results:
        print(f"ID: {row[0]}, Name: {row[1]}")
```

### Scenario 2: High-Performance Numerical Computing

```python
import numpy as np
import ctypes
from typing import Tuple

# Assuming we have a C library for fast matrix operations
"""
// fast_math.c
void matrix_add(double* a, double* b, double* c, int rows, int cols) {
    for (int i = 0; i < rows * cols; i++) {
        c[i] = a[i] + b[i];
    }
}

void matrix_multiply(double* a, double* b, double* c, int m, int n, int k) {
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < k; j++) {
            c[i * k + j] = 0;
            for (int l = 0; l < n; l++) {
                c[i * k + j] += a[i * n + l] * b[l * k + j];
            }
        }
    }
}
"""

class FastMath:
    """High-performance math operations library"""

    def __init__(self, lib_path: str = "./libfastmath.so"):
        self._lib = ctypes.CDLL(lib_path)
        self._setup_functions()

    def _setup_functions(self):
        # Matrix addition
        self._lib.matrix_add.argtypes = [
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(ctypes.c_double),
            ctypes.c_int,
            ctypes.c_int
        ]
        self._lib.matrix_add.restype = None

        # Matrix multiplication
        self._lib.matrix_multiply.argtypes = [
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(ctypes.c_double),
            ctypes.c_int,
            ctypes.c_int,
            ctypes.c_int
        ]
        self._lib.matrix_multiply.restype = None

    def _to_ptr(self, arr: np.ndarray) -> ctypes.POINTER(ctypes.c_double):
        """Convert numpy array to C pointer"""
        if not arr.flags["C_CONTIGUOUS"]:
            arr = np.ascontiguousarray(arr)
        return arr.ctypes.data_as(ctypes.POINTER(ctypes.c_double))

    def add(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Matrix addition"""
        if a.shape != b.shape:
            raise ValueError("Matrix shapes must be identical")

        a = np.asarray(a, dtype=np.float64)
        b = np.asarray(b, dtype=np.float64)
        c = np.zeros_like(a)

        rows, cols = a.shape
        self._lib.matrix_add(
            self._to_ptr(a),
            self._to_ptr(b),
            self._to_ptr(c),
            rows,
            cols
        )
        return c

    def multiply(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Matrix multiplication"""
        if a.shape[1] != b.shape[0]:
            raise ValueError("Matrix dimensions incompatible")

        a = np.asarray(a, dtype=np.float64)
        b = np.asarray(b, dtype=np.float64)
        m, n = a.shape
        k = b.shape[1]
        c = np.zeros((m, k), dtype=np.float64)

        self._lib.matrix_multiply(
            self._to_ptr(a),
            self._to_ptr(b),
            self._to_ptr(c),
            m, n, k
        )
        return c

# Usage example
"""
math = FastMath()

a = np.array([[1, 2], [3, 4]], dtype=np.float64)
b = np.array([[5, 6], [7, 8]], dtype=np.float64)

c = math.add(a, b)
print("Matrix addition:")
print(c)

d = math.multiply(a, b)
print("Matrix multiplication:")
print(d)
"""
```

### Scenario 3: System Monitoring Tool

```python
from cffi import FFI
import sys

ffi = FFI()

if sys.platform == "linux":
    ffi.cdef("""
        // System information
        struct sysinfo {
            long uptime;
            unsigned long loads[3];
            unsigned long totalram;
            unsigned long freeram;
            unsigned long sharedram;
            unsigned long bufferram;
            unsigned long totalswap;
            unsigned long freeswap;
            unsigned short procs;
            unsigned long totalhigh;
            unsigned long freehigh;
            unsigned int mem_unit;
            char _f[20-2*sizeof(long)-sizeof(int)];
        };

        int sysinfo(struct sysinfo *info);

        // Process information
        int getpid();
        int getppid();
        int getuid();
        int geteuid();

        // Hostname
        int gethostname(char *name, size_t len);

        // Resource usage
        struct rusage {
            struct timeval ru_utime;
            struct timeval ru_stime;
            long ru_maxrss;
            long ru_ixrss;
            long ru_idrss;
            long ru_isrss;
            long ru_minflt;
            long ru_majflt;
            long ru_nswap;
            long ru_inblock;
            long ru_oublock;
            long ru_msgsnd;
            long ru_msgrcv;
            long ru_nsignals;
            long ru_nvcsw;
            long ru_nivcsw;
        };

        struct timeval {
            long tv_sec;
            long tv_usec;
        };

        int getrusage(int who, struct rusage *usage);

        #define RUSAGE_SELF 0
    """)

    libc = ffi.dlopen(None)

    class SystemMonitor:
        """Linux system monitoring"""

        @staticmethod
        def get_system_info():
            """Get system information"""
            info = ffi.new("struct sysinfo*")
            if libc.sysinfo(info) != 0:
                raise OSError("Cannot get system information")

            mem_unit = info.mem_unit
            return {
                "uptime_seconds": info.uptime,
                "load_1min": info.loads[0] / 65536.0,
                "load_5min": info.loads[1] / 65536.0,
                "load_15min": info.loads[2] / 65536.0,
                "total_ram_mb": (info.totalram * mem_unit) / (1024 * 1024),
                "free_ram_mb": (info.freeram * mem_unit) / (1024 * 1024),
                "total_swap_mb": (info.totalswap * mem_unit) / (1024 * 1024),
                "free_swap_mb": (info.freeswap * mem_unit) / (1024 * 1024),
                "process_count": info.procs,
            }

        @staticmethod
        def get_process_info():
            """Get current process information"""
            return {
                "pid": libc.getpid(),
                "ppid": libc.getppid(),
                "uid": libc.getuid(),
                "euid": libc.geteuid(),
            }

        @staticmethod
        def get_hostname():
            """Get hostname"""
            name = ffi.new("char[256]")
            if libc.gethostname(name, 256) != 0:
                raise OSError("Cannot get hostname")
            return ffi.string(name).decode()

        @staticmethod
        def get_resource_usage():
            """Get resource usage"""
            usage = ffi.new("struct rusage*")
            if libc.getrusage(0, usage) != 0:  # RUSAGE_SELF
                raise OSError("Cannot get resource usage")

            return {
                "user_time": usage.ru_utime.tv_sec + usage.ru_utime.tv_usec / 1e6,
                "system_time": usage.ru_stime.tv_sec + usage.ru_stime.tv_usec / 1e6,
                "max_rss_kb": usage.ru_maxrss,
                "page_faults": usage.ru_majflt,
            }

    # Usage example
    monitor = SystemMonitor()

    print("System information:")
    for k, v in monitor.get_system_info().items():
        print(f"  {k}: {v}")

    print("\nProcess information:")
    for k, v in monitor.get_process_info().items():
        print(f"  {k}: {v}")

    print(f"\nHostname: {monitor.get_hostname()}")

    print("\nResource usage:")
    for k, v in monitor.get_resource_usage().items():
        print(f"  {k}: {v}")
```

### Scenario 4: Image Processing

```python
import numpy as np
import ctypes
from typing import Tuple

# Assuming we have a C image processing library
"""
// image_processing.c
void grayscale(unsigned char* src, unsigned char* dst, int width, int height) {
    for (int i = 0; i < width * height; i++) {
        int r = src[i * 3];
        int g = src[i * 3 + 1];
        int b = src[i * 3 + 2];
        dst[i] = (unsigned char)(0.299 * r + 0.587 * g + 0.114 * b);
    }
}

void blur_3x3(unsigned char* src, unsigned char* dst, int width, int height) {
    for (int y = 1; y < height - 1; y++) {
        for (int x = 1; x < width - 1; x++) {
            int sum = 0;
            for (int dy = -1; dy <= 1; dy++) {
                for (int dx = -1; dx <= 1; dx++) {
                    sum += src[(y + dy) * width + (x + dx)];
                }
            }
            dst[y * width + x] = sum / 9;
        }
    }
}
"""

class ImageProcessor:
    """Image processor"""

    def __init__(self, lib_path: str = "./libimageproc.so"):
        self._lib = ctypes.CDLL(lib_path)
        self._setup()

    def _setup(self):
        c_uchar_p = ctypes.POINTER(ctypes.c_ubyte)

        self._lib.grayscale.argtypes = [c_uchar_p, c_uchar_p, ctypes.c_int, ctypes.c_int]
        self._lib.grayscale.restype = None

        self._lib.blur_3x3.argtypes = [c_uchar_p, c_uchar_p, ctypes.c_int, ctypes.c_int]
        self._lib.blur_3x3.restype = None

    def _to_ptr(self, arr):
        return arr.ctypes.data_as(ctypes.POINTER(ctypes.c_ubyte))

    def to_grayscale(self, image: np.ndarray) -> np.ndarray:
        """Convert RGB image to grayscale"""
        if image.ndim != 3 or image.shape[2] != 3:
            raise ValueError("Requires RGB image (height, width, 3)")

        height, width = image.shape[:2]
        image = np.ascontiguousarray(image, dtype=np.uint8)
        result = np.zeros((height, width), dtype=np.uint8)

        self._lib.grayscale(
            self._to_ptr(image),
            self._to_ptr(result),
            width,
            height
        )
        return result

    def blur(self, image: np.ndarray) -> np.ndarray:
        """3x3 blur"""
        if image.ndim != 2:
            raise ValueError("Requires grayscale image")

        height, width = image.shape
        image = np.ascontiguousarray(image, dtype=np.uint8)
        result = np.zeros_like(image)

        self._lib.blur_3x3(
            self._to_ptr(image),
            self._to_ptr(result),
            width,
            height
        )
        return result

# Usage example
"""
from PIL import Image
import numpy as np

# Load image
img = Image.open("photo.jpg")
img_array = np.array(img)

# Process
processor = ImageProcessor()
gray = processor.to_grayscale(img_array)
blurred = processor.blur(gray)

# Save
Image.fromarray(blurred).save("blurred.jpg")
"""
```

## Interview Key Points

### Basic Questions

1. **Q: What are the main differences between ctypes and CFFI?**

   A:
   - ctypes is in Python standard library, CFFI is a third-party library
   - ctypes requires manual type definitions, CFFI can parse C header files
   - CFFI has two modes (ABI/API), API mode has better performance
   - CFFI provides friendlier error messages
   - CFFI is more suitable for complex C interfaces

2. **Q: How do you handle C strings in ctypes?**

   A:
   ```python
   # Input string
   lib.func(b"hello")  # Or "hello".encode()
   lib.func.argtypes = [ctypes.c_char_p]

   # Output string
   lib.func.restype = ctypes.c_char_p
   result = lib.func()
   print(result.decode("utf-8"))
   ```

3. **Q: What are callback functions? How do you implement them in Python?**

   A: Callback functions are Python functions passed to C code to be called from within C code.
   ```python
   # ctypes
   CALLBACK = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int)

   def my_callback(x):
       return x * 2

   cb = CALLBACK(my_callback)
   lib.register(cb)

   # Important: Keep reference to cb to prevent garbage collection
   ```

### Advanced Questions

4. **Q: How do you handle struct alignment issues?**

   A:
   ```python
   class MyStruct(ctypes.Structure):
       _pack_ = 1  # Disable alignment (if C code uses #pragma pack(1))
       _fields_ = [...]

   # Or use default alignment (consistent with platform C compiler)
   ```

5. **Q: What's the difference between CFFI ABI mode and API mode?**

   A:
   - ABI mode: Loads library at runtime, no compiler needed, slower
   - API mode: Generates extension module at compile time, requires compiler, faster
   - API mode can avoid ABI compatibility issues

6. **Q: How do you avoid memory leaks?**

   A:
   ```python
   # Use ffi.gc() for automatic cleanup
   ptr = ffi.gc(lib.malloc(1024), lib.free)

   # Use context managers
   @contextmanager
   def managed_resource():
       r = lib.create()
       try:
           yield r
       finally:
           lib.destroy(r)
   ```

### Practical Questions

7. **Q: How do you pass numpy arrays to C functions?**

   A:
   ```python
   import numpy as np

   arr = np.array([1, 2, 3, 4], dtype=np.float64)

   # ctypes
   ptr = arr.ctypes.data_as(ctypes.POINTER(ctypes.c_double))
   lib.process(ptr, len(arr))

   # CFFI
   ptr = ffi.cast("double*", arr.ctypes.data)
   lib.process(ptr, len(arr))
   ```

8. **Q: How do you handle cross-platform compatibility?**

   A:
   ```python
   import sys

   if sys.platform == "win32":
       lib_name = "mylib.dll"
       lib = ctypes.WinDLL(lib_name)  # stdcall
   elif sys.platform == "darwin":
       lib_name = "libmylib.dylib"
       lib = ctypes.CDLL(lib_name)
   else:
       lib_name = "libmylib.so"
       lib = ctypes.CDLL(lib_name)
   ```

9. **Q: When should you use C extensions instead of pure Python?**

   A:
   - Need to call existing C libraries
   - Computationally intensive tasks need optimization
   - Need to access low-level system APIs
   - Processing binary protocols
   - But for simple tasks, pure Python is easier to maintain

## Further Reading

### Official Documentation

- [ctypes Official Documentation](https://docs.python.org/3/library/ctypes.html)
- [CFFI Official Documentation](https://cffi.readthedocs.io/)
- [Python/C API Reference Manual](https://docs.python.org/3/c-api/)

### Related Tools

- [pybind11](https://pybind11.readthedocs.io/) - Modern C++ binding library
- [Cython](https://cython.org/) - Python to C compiler
- [SWIG](https://www.swig.org/) - Multi-language interface generator
- [Numba](https://numba.pydata.org/) - JIT compilation acceleration

### Quality Tutorials

- [Real Python: Python Bindings](https://realpython.com/python-bindings-overview/)
- [Python 3 Module of the Week: ctypes](https://pymotw.com/3/ctypes/)
- [CFFI User Guide](https://cffi.readthedocs.io/en/latest/using.html)

### Recommended Books

- "Python Cookbook" Chapter 15 - C Extensions
- "High Performance Python" - Performance Optimization
- "Expert Python Programming" - Advanced Techniques

### Open Source Project References

- [cryptography](https://github.com/pyca/cryptography) - Uses CFFI to call OpenSSL
- [lxml](https://github.com/lxml/lxml) - Uses Cython to wrap libxml2
- [Pillow](https://github.com/python-pillow/Pillow) - Image processing library
- [PyAudio](https://people.csail.mit.edu/hubert/pyaudio/) - Audio I/O
