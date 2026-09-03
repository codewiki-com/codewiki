---
title: Python C 扩展：ctypes 与 CFFI
description: 深入理解 Python 调用 C 代码的两种主流方式：ctypes 和 CFFI，包括共享库加载、数据类型映射、回调函数等核心技术
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - ctypes
  - CFFI
  - C扩展
  - FFI
  - 共享库
status: imported
origin: old/src/content/docs/python/ctypes-cffi.zh.md
divergence: 0.193
issues: []
legacy:
  category: Python
  subcategory: 高级主题
  order: 50
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 FFI？

FFI（Foreign Function Interface，外部函数接口）是一种允许一种编程语言调用另一种编程语言编写的代码的机制。在 Python 中，FFI 主要用于调用 C/C++ 编写的动态链接库（.so/.dll/.dylib），从而实现：

- **性能优化**：将计算密集型任务交给 C 代码执行
- **复用现有库**：调用成熟的 C 库（如 OpenSSL、SQLite、图像处理库等）
- **系统编程**：访问操作系统底层 API
- **硬件交互**：与驱动程序或嵌入式设备通信

### ctypes vs CFFI

Python 提供了两种主流的 C 扩展方案：

| 特性 | ctypes | CFFI |
|------|--------|------|
| **来源** | Python 标准库 | 第三方库（需安装） |
| **API 风格** | 底层、手动 | 高层、声明式 |
| **C 头文件解析** | 不支持 | 支持 |
| **性能** | 良好 | 优秀（ABI 模式）/ 极佳（API 模式） |
| **错误检查** | 较弱 | 较强 |
| **学习曲线** | 较陡 | 较平缓 |
| **适用场景** | 快速原型、简单调用 | 生产环境、复杂接口 |

### 历史背景

- **ctypes**：Python 2.5（2006年）引入标准库，由 Thomas Heller 开发
- **CFFI**：2012年由 PyPy 团队开发，旨在提供更 Pythonic 的 C 调用方式

## 核心原理

### ctypes 工作原理

ctypes 通过以下步骤实现 Python 与 C 的交互：

```
Python 代码
    ↓
ctypes 类型转换（Python 对象 → C 类型）
    ↓
libffi（低级 FFI 库）
    ↓
动态链接库（.so/.dll）
    ↓
C 函数执行
    ↓
libffi（返回值处理）
    ↓
ctypes 类型转换（C 类型 → Python 对象）
    ↓
Python 代码
```

### CFFI 工作原理

CFFI 提供两种模式：

**ABI 模式（Application Binary Interface）**：
- 运行时加载动态库
- 类似 ctypes 的工作方式
- 无需编译器
- 适合快速原型开发

**API 模式（Application Programming Interface）**：
- 编译时生成扩展模块
- 需要 C 编译器
- 性能最佳
- 适合生产环境

```
CFFI ABI 模式:
Python 代码 → CFFI 解析 C 声明 → 运行时加载库 → 调用函数

CFFI API 模式:
C 声明 → CFFI 编译 → 生成 Python 扩展 → 直接调用（无运行时开销）
```

### 内存布局与对齐

C 语言的数据类型在内存中有特定的布局规则：

```c
// C 结构体示例
struct Example {
    char a;      // 1 字节
    // 3 字节填充（对齐到 4 字节边界）
    int b;       // 4 字节
    short c;     // 2 字节
    // 2 字节填充
};  // 总大小: 12 字节（而非 7 字节）
```

ctypes 和 CFFI 都会自动处理这种内存对齐，确保 Python 结构体与 C 结构体内存布局一致。

## 核心要点

### ctypes 核心概念

1. **加载动态库**
   - `CDLL`：使用 cdecl 调用约定（默认）
   - `WinDLL`：使用 stdcall 调用约定（Windows）
   - `OleDLL`：用于 COM 对象（Windows）
   - `PyDLL`：保持 GIL 的 CDLL

2. **基本数据类型映射**
   - `c_int`, `c_long`, `c_float`, `c_double` 等
   - `c_char_p`（C 字符串）, `c_void_p`（void 指针）
   - `POINTER()`（指针类型）

3. **结构体与联合体**
   - `Structure`：定义 C 结构体
   - `Union`：定义 C 联合体

4. **回调函数**
   - `CFUNCTYPE`：cdecl 调用约定
   - `WINFUNCTYPE`：stdcall 调用约定

### CFFI 核心概念

1. **FFI 对象**
   - `ffi.cdef()`：声明 C 类型和函数
   - `ffi.dlopen()`：加载动态库（ABI 模式）
   - `ffi.verify()`：编译扩展（API 模式，已废弃）
   - `ffi.set_source()`：现代 API 模式

2. **类型系统**
   - `ffi.new()`：分配 C 内存
   - `ffi.cast()`：类型转换
   - `ffi.string()`：C 字符串转 Python
   - `ffi.buffer()`：访问原始内存

3. **内存管理**
   - 自动垃圾回收（通过引用计数）
   - `ffi.gc()`：绑定释放函数

## 代码示例

### 准备工作：创建 C 共享库

首先创建一个简单的 C 库用于测试：

```c
// mathlib.c
#include <math.h>
#include <stdlib.h>
#include <string.h>

// 简单函数
int add(int a, int b) {
    return a + b;
}

double calculate_distance(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return sqrt(dx * dx + dy * dy);
}

// 处理数组
void array_double(int* arr, int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;
    }
}

// 处理字符串
char* greet(const char* name) {
    static char buffer[256];
    snprintf(buffer, sizeof(buffer), "Hello, %s!", name);
    return buffer;
}

// 结构体
typedef struct {
    double x;
    double y;
} Point;

double point_distance(Point* p1, Point* p2) {
    double dx = p2->x - p1->x;
    double dy = p2->y - p1->y;
    return sqrt(dx * dx + dy * dy);
}

// 回调函数
typedef int (*Comparator)(int, int);

void sort_array(int* arr, int size, Comparator cmp) {
    // 简单冒泡排序
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

编译为共享库：

```bash
# Linux
gcc -shared -fPIC -o libmathlib.so mathlib.c -lm

# macOS
gcc -shared -fPIC -o libmathlib.dylib mathlib.c -lm

# Windows (MinGW)
gcc -shared -o mathlib.dll mathlib.c
```

### ctypes 基础使用

#### 加载共享库

```python
import ctypes
import os
import sys

def load_library():
    """跨平台加载共享库"""
    if sys.platform == 'win32':
        lib_name = 'mathlib.dll'
    elif sys.platform == 'darwin':
        lib_name = 'libmathlib.dylib'
    else:
        lib_name = 'libmathlib.so'

    # 获取库的完整路径
    lib_path = os.path.join(os.path.dirname(__file__), lib_name)

    # 加载库
    lib = ctypes.CDLL(lib_path)
    return lib

# 加载标准 C 库
if sys.platform == 'win32':
    libc = ctypes.CDLL('msvcrt')
else:
    libc = ctypes.CDLL(None)  # 加载默认 C 库

# 调用 printf
libc.printf(b"Hello from C! Value: %d\n", 42)
```

#### 数据类型映射

```python
import ctypes

# 基本类型映射表
type_mapping = {
    'c_bool': ctypes.c_bool,       # _Bool
    'c_char': ctypes.c_char,       # char
    'c_wchar': ctypes.c_wchar,     # wchar_t
    'c_byte': ctypes.c_byte,       # char (有符号)
    'c_ubyte': ctypes.c_ubyte,     # unsigned char
    'c_short': ctypes.c_short,     # short
    'c_ushort': ctypes.c_ushort,   # unsigned short
    'c_int': ctypes.c_int,         # int
    'c_uint': ctypes.c_uint,       # unsigned int
    'c_long': ctypes.c_long,       # long
    'c_ulong': ctypes.c_ulong,     # unsigned long
    'c_longlong': ctypes.c_longlong,     # long long
    'c_ulonglong': ctypes.c_ulonglong,   # unsigned long long
    'c_size_t': ctypes.c_size_t,   # size_t
    'c_ssize_t': ctypes.c_ssize_t, # ssize_t
    'c_float': ctypes.c_float,     # float
    'c_double': ctypes.c_double,   # double
    'c_longdouble': ctypes.c_longdouble,  # long double
    'c_char_p': ctypes.c_char_p,   # char* (以 null 结尾)
    'c_wchar_p': ctypes.c_wchar_p, # wchar_t*
    'c_void_p': ctypes.c_void_p,   # void*
}

# 创建和使用基本类型
i = ctypes.c_int(42)
print(f"c_int 值: {i.value}")

f = ctypes.c_double(3.14159)
print(f"c_double 值: {f.value}")

s = ctypes.c_char_p(b"Hello")
print(f"c_char_p 值: {s.value}")
```

#### 调用函数并设置参数/返回类型

```python
import ctypes

# 假设已加载 libmathlib
lib = ctypes.CDLL('./libmathlib.so')

# 设置函数签名（推荐做法）
lib.add.argtypes = [ctypes.c_int, ctypes.c_int]
lib.add.restype = ctypes.c_int

lib.calculate_distance.argtypes = [
    ctypes.c_double, ctypes.c_double,
    ctypes.c_double, ctypes.c_double
]
lib.calculate_distance.restype = ctypes.c_double

lib.greet.argtypes = [ctypes.c_char_p]
lib.greet.restype = ctypes.c_char_p

# 调用函数
result = lib.add(10, 20)
print(f"10 + 20 = {result}")

distance = lib.calculate_distance(0.0, 0.0, 3.0, 4.0)
print(f"距离: {distance}")

greeting = lib.greet(b"Python")
print(f"问候: {greeting.decode('utf-8')}")
```

#### 处理数组

```python
import ctypes

lib = ctypes.CDLL('./libmathlib.so')

# 方式 1：使用数组类型
IntArray5 = ctypes.c_int * 5
arr = IntArray5(1, 2, 3, 4, 5)

print(f"原始数组: {list(arr)}")

# 设置函数签名
lib.array_double.argtypes = [ctypes.POINTER(ctypes.c_int), ctypes.c_int]
lib.array_double.restype = None

lib.array_double(arr, 5)
print(f"加倍后: {list(arr)}")

# 方式 2：从 Python 列表创建
data = [10, 20, 30, 40, 50]
arr2 = (ctypes.c_int * len(data))(*data)
lib.array_double(arr2, len(data))
print(f"列表转换后加倍: {list(arr2)}")

# 方式 3：使用 numpy 数组（推荐用于大数据）
import numpy as np

np_arr = np.array([1, 2, 3, 4, 5], dtype=np.int32)
arr_ptr = np_arr.ctypes.data_as(ctypes.POINTER(ctypes.c_int))
lib.array_double(arr_ptr, len(np_arr))
print(f"numpy 数组加倍: {np_arr}")
```

#### 定义和使用结构体

```python
import ctypes

class Point(ctypes.Structure):
    """对应 C 的 Point 结构体"""
    _fields_ = [
        ("x", ctypes.c_double),
        ("y", ctypes.c_double),
    ]

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

# 创建结构体实例
p1 = Point(0.0, 0.0)
p2 = Point(3.0, 4.0)

print(f"点 1: {p1}")
print(f"点 2: {p2}")

# 设置函数签名
lib = ctypes.CDLL('./libmathlib.so')
lib.point_distance.argtypes = [ctypes.POINTER(Point), ctypes.POINTER(Point)]
lib.point_distance.restype = ctypes.c_double

# 传递结构体指针
distance = lib.point_distance(ctypes.byref(p1), ctypes.byref(p2))
print(f"两点距离: {distance}")

# 嵌套结构体
class Rectangle(ctypes.Structure):
    _fields_ = [
        ("top_left", Point),
        ("bottom_right", Point),
    ]

rect = Rectangle(Point(0, 10), Point(10, 0))
print(f"矩形: {rect.top_left} 到 {rect.bottom_right}")
```

#### 联合体

```python
import ctypes

class IntOrFloat(ctypes.Union):
    """C 联合体示例"""
    _fields_ = [
        ("as_int", ctypes.c_int),
        ("as_float", ctypes.c_float),
    ]

# 联合体共享内存
u = IntOrFloat()
u.as_float = 3.14
print(f"作为 float: {u.as_float}")
print(f"作为 int: {u.as_int}")  # 查看相同内存的整数解释

# 实际应用：解析二进制数据
class IPAddress(ctypes.Union):
    _fields_ = [
        ("bytes", ctypes.c_uint8 * 4),
        ("value", ctypes.c_uint32),
    ]

ip = IPAddress()
ip.value = 0xC0A80101  # 192.168.1.1
print(f"IP 地址: {'.'.join(str(b) for b in ip.bytes[::-1])}")
```

#### 回调函数

```python
import ctypes

lib = ctypes.CDLL('./libmathlib.so')

# 定义回调函数类型
# 对应 C 的: typedef int (*Comparator)(int, int);
COMPARATOR = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int, ctypes.c_int)

# Python 回调函数
def ascending(a, b):
    """升序比较"""
    return a - b

def descending(a, b):
    """降序比较"""
    return b - a

def abs_compare(a, b):
    """按绝对值比较"""
    return abs(a) - abs(b)

# 创建回调对象
cmp_asc = COMPARATOR(ascending)
cmp_desc = COMPARATOR(descending)
cmp_abs = COMPARATOR(abs_compare)

# 设置函数签名
lib.sort_array.argtypes = [
    ctypes.POINTER(ctypes.c_int),
    ctypes.c_int,
    COMPARATOR
]
lib.sort_array.restype = None

# 测试排序
data = [3, -1, 4, -1, 5, -9, 2, 6]
arr = (ctypes.c_int * len(data))(*data)

print(f"原始数组: {list(arr)}")

# 升序排序
lib.sort_array(arr, len(arr), cmp_asc)
print(f"升序排序: {list(arr)}")

# 重新初始化
arr = (ctypes.c_int * len(data))(*data)
lib.sort_array(arr, len(arr), cmp_desc)
print(f"降序排序: {list(arr)}")

# 按绝对值排序
arr = (ctypes.c_int * len(data))(*data)
lib.sort_array(arr, len(arr), cmp_abs)
print(f"绝对值排序: {list(arr)}")
```

### CFFI 基础使用

#### 安装和基本设置

```bash
pip install cffi
```

```python
from cffi import FFI

ffi = FFI()

# 声明 C 函数和类型（与 C 头文件相同）
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

# ABI 模式：运行时加载
lib = ffi.dlopen('./libmathlib.so')
```

#### 调用函数

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);
    char* greet(const char* name);
""")

lib = ffi.dlopen('./libmathlib.so')

# 直接调用，CFFI 自动处理类型转换
result = lib.add(10, 20)
print(f"10 + 20 = {result}")

distance = lib.calculate_distance(0.0, 0.0, 3.0, 4.0)
print(f"距离: {distance}")

# 字符串处理
greeting = lib.greet(b"Python")
print(f"问候: {ffi.string(greeting).decode('utf-8')}")
```

#### 处理数组和指针

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    void array_double(int* arr, int size);
""")

lib = ffi.dlopen('./libmathlib.so')

# 方式 1：使用 ffi.new() 分配内存
arr = ffi.new("int[5]", [1, 2, 3, 4, 5])
print(f"原始数组: {list(arr)}")

lib.array_double(arr, 5)
print(f"加倍后: {list(arr)}")

# 方式 2：从 Python 列表转换
data = [10, 20, 30, 40, 50]
arr2 = ffi.new("int[]", data)
lib.array_double(arr2, len(data))
print(f"列表转换后加倍: {list(arr2)}")

# 方式 3：与 numpy 配合
import numpy as np

np_arr = np.array([1, 2, 3, 4, 5], dtype=np.int32)
arr_ptr = ffi.cast("int*", np_arr.ctypes.data)
lib.array_double(arr_ptr, len(np_arr))
print(f"numpy 数组加倍: {np_arr}")

# 访问指针元素
ptr = ffi.new("double*", 3.14)
print(f"指针值: {ptr[0]}")

# 多维数组
matrix = ffi.new("int[3][3]", [[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print(f"矩阵[1][1] = {matrix[1][1]}")
```

#### 结构体操作

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);

    // 复杂结构体
    typedef struct {
        char name[64];
        int age;
        double salary;
    } Employee;
""")

lib = ffi.dlopen('./libmathlib.so')

# 创建结构体
p1 = ffi.new("Point*")
p1.x = 0.0
p1.y = 0.0

p2 = ffi.new("Point*", {"x": 3.0, "y": 4.0})  # 使用字典初始化

print(f"点 1: ({p1.x}, {p1.y})")
print(f"点 2: ({p2.x}, {p2.y})")

distance = lib.point_distance(p1, p2)
print(f"两点距离: {distance}")

# 结构体数组
points = ffi.new("Point[3]", [
    {"x": 0, "y": 0},
    {"x": 1, "y": 1},
    {"x": 2, "y": 2}
])

for i, p in enumerate(points):
    print(f"点 {i}: ({p.x}, {p.y})")

# 嵌套结构体
emp = ffi.new("Employee*")
emp.name = b"Alice"  # 字符数组需要 bytes
emp.age = 30
emp.salary = 75000.0

print(f"员工: {ffi.string(emp.name).decode()}, {emp.age}岁, 薪资{emp.salary}")
```

#### 回调函数

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    typedef int (*Comparator)(int, int);
    void sort_array(int* arr, int size, Comparator cmp);
""")

lib = ffi.dlopen('./libmathlib.so')

# 定义回调函数
@ffi.callback("int(int, int)")
def ascending(a, b):
    return a - b

@ffi.callback("int(int, int)")
def descending(a, b):
    return b - a

# 使用回调
data = [3, 1, 4, 1, 5, 9, 2, 6]
arr = ffi.new("int[]", data)

print(f"原始数组: {list(arr)}")

lib.sort_array(arr, len(data), ascending)
print(f"升序排序: {list(arr)}")

arr = ffi.new("int[]", data)
lib.sort_array(arr, len(data), descending)
print(f"降序排序: {list(arr)}")

# 使用 lambda（需要保持引用）
callbacks = []  # 防止被垃圾回收

def make_callback(func):
    cb = ffi.callback("int(int, int)")(func)
    callbacks.append(cb)  # 保持引用
    return cb

abs_compare = make_callback(lambda a, b: abs(a) - abs(b))
arr = ffi.new("int[]", data)
lib.sort_array(arr, len(data), abs_compare)
print(f"绝对值排序: {list(arr)}")
```

#### CFFI API 模式（编译模式）

API 模式需要在构建时编译，性能更好：

```python
# build_mathlib.py
from cffi import FFI

ffi = FFI()

# C 声明
ffi.cdef("""
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);

    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);
""")

# 设置源码和库
ffi.set_source(
    "_mathlib",  # 生成的模块名
    """
    // 包含原始 C 头文件，或直接写 C 代码
    int add(int a, int b);
    double calculate_distance(double x1, double y1, double x2, double y2);

    typedef struct {
        double x;
        double y;
    } Point;

    double point_distance(Point* p1, Point* p2);
    """,
    libraries=['mathlib'],  # 链接的库
    library_dirs=['.'],     # 库搜索路径
    include_dirs=['.'],     # 头文件搜索路径
)

if __name__ == "__main__":
    ffi.compile(verbose=True)
```

```bash
# 编译
python build_mathlib.py

# 使用生成的模块
```

```python
# 使用编译后的模块
from _mathlib import ffi, lib

result = lib.add(10, 20)
print(f"10 + 20 = {result}")

p1 = ffi.new("Point*", {"x": 0, "y": 0})
p2 = ffi.new("Point*", {"x": 3, "y": 4})
distance = lib.point_distance(p1, p2)
print(f"距离: {distance}")
```

### 调用系统库示例

#### 调用 libc 函数

```python
from cffi import FFI

ffi = FFI()

ffi.cdef("""
    // 时间相关
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

    // 内存操作
    void *malloc(size_t size);
    void free(void *ptr);
    void *memcpy(void *dest, const void *src, size_t n);
    int memcmp(const void *s1, const void *s2, size_t n);

    // 字符串操作
    size_t strlen(const char *s);
    char *strcpy(char *dest, const char *src);
    int strcmp(const char *s1, const char *s2);

    // 数学函数
    double sin(double x);
    double cos(double x);
    double sqrt(double x);
    double pow(double x, double y);
""")

# 加载 C 标准库
import sys
if sys.platform == 'win32':
    libc = ffi.dlopen("msvcrt")
    libm = ffi.dlopen("msvcrt")
elif sys.platform == 'darwin':
    libc = ffi.dlopen(None)
    libm = ffi.dlopen(None)
else:
    libc = ffi.dlopen(None)
    libm = ffi.dlopen("libm.so.6")

# 获取当前时间
t = ffi.new("time_t*")
libc.time(t)
tm = libc.localtime(t)
time_str = ffi.string(libc.asctime(tm)).decode().strip()
print(f"当前时间: {time_str}")

# 数学运算
import math
print(f"sin(pi/2) = {libm.sin(math.pi / 2)}")
print(f"sqrt(2) = {libm.sqrt(2.0)}")
print(f"2^10 = {libm.pow(2.0, 10.0)}")

# 字符串操作
s1 = ffi.new("char[]", b"Hello")
s2 = ffi.new("char[]", b"World")
print(f"strlen('Hello') = {libc.strlen(s1)}")
print(f"strcmp('Hello', 'World') = {libc.strcmp(s1, s2)}")
```

#### 调用 OpenSSL 进行加密

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

    // 随机数
    int RAND_bytes(unsigned char *buf, int num);
""")

# 加载 OpenSSL
try:
    if sys.platform == 'darwin':
        ssl = ffi.dlopen("/usr/local/opt/openssl/lib/libcrypto.dylib")
    else:
        ssl = ffi.dlopen("libcrypto.so")
except OSError:
    print("OpenSSL 未安装或路径不正确")
    ssl = None

if ssl:
    # MD5 哈希
    ctx = ffi.new("MD5_CTX*")
    md5_result = ffi.new("unsigned char[16]")

    ssl.MD5_Init(ctx)
    message = b"Hello, World!"
    ssl.MD5_Update(ctx, message, len(message))
    ssl.MD5_Final(md5_result, ctx)

    md5_hex = ''.join(f'{md5_result[i]:02x}' for i in range(16))
    print(f"MD5: {md5_hex}")

    # SHA256 哈希
    sha256_result = ffi.new("unsigned char[32]")
    ssl.SHA256(message, len(message), sha256_result)

    sha256_hex = ''.join(f'{sha256_result[i]:02x}' for i in range(32))
    print(f"SHA256: {sha256_hex}")

    # 生成随机数
    random_bytes = ffi.new("unsigned char[16]")
    ssl.RAND_bytes(random_bytes, 16)
    random_hex = ''.join(f'{random_bytes[i]:02x}' for i in range(16))
    print(f"随机数: {random_hex}")
```

## 最佳实践

### 始终声明函数签名

```python
# ctypes - 始终设置 argtypes 和 restype
import ctypes

lib = ctypes.CDLL('./mylib.so')

# 推荐：明确声明
lib.my_function.argtypes = [ctypes.c_int, ctypes.c_double]
lib.my_function.restype = ctypes.c_double

# 不推荐：依赖默认行为
# result = lib.my_function(10, 3.14)  # 可能产生错误结果
```

### 使用上下文管理器处理资源

```python
from cffi import FFI
from contextlib import contextmanager

ffi = FFI()
ffi.cdef("""
    void* create_resource();
    void destroy_resource(void* resource);
    int use_resource(void* resource);
""")

lib = ffi.dlopen('./mylib.so')

@contextmanager
def managed_resource():
    """资源管理上下文"""
    resource = lib.create_resource()
    try:
        yield resource
    finally:
        lib.destroy_resource(resource)

# 使用
with managed_resource() as res:
    result = lib.use_resource(res)
    print(f"结果: {result}")
# 资源自动释放
```

### 封装为 Python 类

```python
import ctypes
from typing import List, Tuple

class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]

class Geometry:
    """几何运算库的 Python 封装"""

    def __init__(self, lib_path: str):
        self._lib = ctypes.CDLL(lib_path)
        self._setup_functions()

    def _setup_functions(self):
        """设置函数签名"""
        self._lib.point_distance.argtypes = [
            ctypes.POINTER(Point),
            ctypes.POINTER(Point)
        ]
        self._lib.point_distance.restype = ctypes.c_double

    def distance(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """计算两点间距离"""
        point1 = Point(p1[0], p1[1])
        point2 = Point(p2[0], p2[1])
        return self._lib.point_distance(
            ctypes.byref(point1),
            ctypes.byref(point2)
        )

# 使用
geo = Geometry('./libmathlib.so')
dist = geo.distance((0, 0), (3, 4))
print(f"距离: {dist}")
```

### 错误处理

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
    """带错误检查的文件打开"""
    fd = libc.open(path.encode(), flags)
    if fd == -1:
        errno_ptr = libc.__errno_location()
        error_code = errno_ptr[0]
        raise OSError(error_code, f"打开文件失败: {path}")
    return fd

# 使用
try:
    fd = safe_open("/nonexistent/file", 0)
except OSError as e:
    print(f"错误: {e}")
```

### 内存安全

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    void* malloc(size_t size);
    void free(void* ptr);
""")

libc = ffi.dlopen(None)

# 使用 ffi.gc() 自动释放内存
def safe_malloc(size: int):
    """分配内存并自动释放"""
    ptr = libc.malloc(size)
    if ptr == ffi.NULL:
        raise MemoryError(f"无法分配 {size} 字节")
    return ffi.gc(ptr, libc.free)

# 使用
buffer = safe_malloc(1024)
# 当 buffer 不再被引用时，自动调用 free()
```

### 线程安全

```python
import ctypes
import threading
from concurrent.futures import ThreadPoolExecutor

# 某些 C 库不是线程安全的，需要加锁
lib = ctypes.CDLL('./mylib.so')
lib_lock = threading.Lock()

def thread_safe_call(arg):
    """线程安全的 C 函数调用"""
    with lib_lock:
        return lib.unsafe_function(arg)

# 或者使用线程本地存储
class ThreadLocalLib:
    """每个线程独立的库实例"""
    _local = threading.local()

    @classmethod
    def get_lib(cls):
        if not hasattr(cls._local, 'lib'):
            cls._local.lib = ctypes.CDLL('./mylib.so')
        return cls._local.lib
```

## 常见陷阱

### 字符串编码问题

```python
import ctypes
from cffi import FFI

# 陷阱：忘记编码
lib = ctypes.CDLL('./mylib.so')
lib.greet.argtypes = [ctypes.c_char_p]
lib.greet.restype = ctypes.c_char_p

# 错误：传入 str
# lib.greet("Python")  # TypeError

# 正确：传入 bytes
result = lib.greet(b"Python")
print(result.decode('utf-8'))

# CFFI 中同样需要注意
ffi = FFI()
ffi.cdef("char* greet(const char* name);")
lib = ffi.dlopen('./mylib.so')

result = lib.greet(b"Python")
print(ffi.string(result).decode('utf-8'))
```

### 回调函数生命周期

```python
import ctypes

CALLBACK_TYPE = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int)

def create_callback():
    def my_callback(x):
        return x * 2
    return CALLBACK_TYPE(my_callback)

# 陷阱：回调被垃圾回收
# cb = create_callback()
# lib.register_callback(cb)  # 危险！cb 可能被回收

# 正确：保持引用
callbacks = []

def register_callback(func):
    cb = CALLBACK_TYPE(func)
    callbacks.append(cb)  # 保持引用
    lib.register_callback(cb)

# CFFI 中同样需要注意
from cffi import FFI
ffi = FFI()

@ffi.callback("int(int)")
def my_callback(x):
    return x * 2

# 需要保持 my_callback 的引用
```

### 结构体对齐问题

```python
import ctypes

# C 结构体
"""
struct Misaligned {
    char a;
    int b;
    char c;
};
"""

# 陷阱：不考虑对齐
class MisalignedWrong(ctypes.Structure):
    _pack_ = 1  # 取消对齐（如果 C 也使用 #pragma pack(1)）
    _fields_ = [
        ("a", ctypes.c_char),
        ("b", ctypes.c_int),
        ("c", ctypes.c_char),
    ]

# 正确：默认对齐（与 C 编译器一致）
class MisalignedCorrect(ctypes.Structure):
    _fields_ = [
        ("a", ctypes.c_char),
        ("b", ctypes.c_int),
        ("c", ctypes.c_char),
    ]

print(f"不对齐大小: {ctypes.sizeof(MisalignedWrong)}")   # 6
print(f"正确对齐大小: {ctypes.sizeof(MisalignedCorrect)}")  # 12
```

### 指针悬垂

```python
from cffi import FFI

ffi = FFI()
ffi.cdef("""
    char* get_static_string();
    char* get_dynamic_string();  // 返回 malloc 的内存
    void free_string(char* s);
""")

lib = ffi.dlopen('./mylib.so')

# 静态字符串 - 安全
static_str = lib.get_static_string()
print(ffi.string(static_str))

# 动态字符串 - 需要手动释放
dynamic_str = lib.get_dynamic_string()
result = ffi.string(dynamic_str).decode()
lib.free_string(dynamic_str)  # 必须释放！
print(result)

# 使用 gc 自动管理
def get_managed_string():
    s = lib.get_dynamic_string()
    return ffi.gc(s, lib.free_string)

managed = get_managed_string()
print(ffi.string(managed).decode())
# 自动释放
```

### 数组越界

```python
import ctypes

lib = ctypes.CDLL('./mylib.so')
lib.array_double.argtypes = [ctypes.POINTER(ctypes.c_int), ctypes.c_int]

arr = (ctypes.c_int * 5)(1, 2, 3, 4, 5)

# 陷阱：传递错误的大小
# lib.array_double(arr, 10)  # 越界访问！

# 正确：使用实际大小
lib.array_double(arr, len(arr))

# 更安全的封装
def safe_array_double(arr):
    """安全的数组操作"""
    if not isinstance(arr, ctypes.Array):
        raise TypeError("需要 ctypes 数组")
    lib.array_double(arr, len(arr))
```

### 类型大小差异

```python
import ctypes
import sys

# 陷阱：假设固定大小
# c_long 在不同平台上大小不同

print(f"c_int 大小: {ctypes.sizeof(ctypes.c_int)}")      # 通常 4
print(f"c_long 大小: {ctypes.sizeof(ctypes.c_long)}")    # 32位: 4, 64位Linux: 8, 64位Windows: 4
print(f"c_size_t 大小: {ctypes.sizeof(ctypes.c_size_t)}")  # 32位: 4, 64位: 8

# 正确：使用明确大小的类型
# 使用固定大小类型
c_int32 = ctypes.c_int32   # 始终 4 字节
c_int64 = ctypes.c_int64   # 始终 8 字节

# 或使用条件判断
if sys.maxsize > 2**32:
    c_pointer_int = ctypes.c_int64
else:
    c_pointer_int = ctypes.c_int32
```

## 性能考量

### 调用开销对比

```python
import time
import ctypes
from cffi import FFI

# 准备测试
lib_ctypes = ctypes.CDLL('./libmathlib.so')
lib_ctypes.add.argtypes = [ctypes.c_int, ctypes.c_int]
lib_ctypes.add.restype = ctypes.c_int

ffi = FFI()
ffi.cdef("int add(int a, int b);")
lib_cffi = ffi.dlopen('./libmathlib.so')

def benchmark(name, func, iterations=1000000):
    """基准测试"""
    start = time.perf_counter()
    for _ in range(iterations):
        func()
    elapsed = time.perf_counter() - start
    ops_per_sec = iterations / elapsed
    print(f"{name}: {elapsed:.3f}s ({ops_per_sec:,.0f} ops/s)")

# 纯 Python
def python_add():
    return 10 + 20

# ctypes 调用
def ctypes_add():
    return lib_ctypes.add(10, 20)

# CFFI 调用
def cffi_add():
    return lib_cffi.add(10, 20)

print("性能对比（100万次调用）:")
benchmark("纯 Python", python_add)
benchmark("ctypes", ctypes_add)
benchmark("CFFI ABI", cffi_add)

# CFFI API 模式（编译后）通常最快
```

### 批量操作优化

```python
import numpy as np
import ctypes
from cffi import FFI

# 低效：单个元素操作
def slow_process(lib, data):
    """逐个元素处理（慢）"""
    result = []
    for x in data:
        result.append(lib.process_single(ctypes.c_double(x)))
    return result

# 高效：批量操作
def fast_process(lib, data):
    """批量处理（快）"""
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

### 减少类型转换

```python
from cffi import FFI
import numpy as np

ffi = FFI()
ffi.cdef("""
    void matrix_multiply(double* a, double* b, double* c, int n);
""")

lib = ffi.dlopen('./libmatrix.so')

# 低效：每次调用都转换
def slow_matmul(a, b):
    n = len(a)
    a_arr = ffi.new("double[]", [x for row in a for x in row])
    b_arr = ffi.new("double[]", [x for row in b for x in row])
    c_arr = ffi.new("double[]", n * n)
    lib.matrix_multiply(a_arr, b_arr, c_arr, n)
    return [[c_arr[i*n + j] for j in range(n)] for i in range(n)]

# 高效：直接使用 numpy
def fast_matmul(a, b):
    n = a.shape[0]
    c = np.zeros((n, n), dtype=np.float64)

    a_ptr = ffi.cast("double*", a.ctypes.data)
    b_ptr = ffi.cast("double*", b.ctypes.data)
    c_ptr = ffi.cast("double*", c.ctypes.data)

    lib.matrix_multiply(a_ptr, b_ptr, c_ptr, n)
    return c
```

### 使用 API 模式

```python
# CFFI API 模式 vs ABI 模式性能对比

# ABI 模式（运行时解析）
ffi_abi = FFI()
ffi_abi.cdef("int add(int a, int b);")
lib_abi = ffi_abi.dlopen('./libmathlib.so')

# API 模式（编译时绑定）- 需要先编译
# from _mathlib import ffi as ffi_api, lib as lib_api

# API 模式通常比 ABI 模式快 2-10 倍
# 因为避免了运行时的类型解析开销
```

## 实战场景

### 场景一：调用 SQLite 数据库

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

    // 常量
    #define SQLITE_OK 0
    #define SQLITE_ROW 100
    #define SQLITE_DONE 101
""")

sqlite = ffi.dlopen("libsqlite3.so")

class SQLiteDB:
    """SQLite 数据库封装"""

    SQLITE_OK = 0
    SQLITE_ROW = 100
    SQLITE_DONE = 101

    def __init__(self, db_path: str):
        self.db = ffi.new("sqlite3**")
        result = sqlite.sqlite3_open(db_path.encode(), self.db)
        if result != self.SQLITE_OK:
            raise Exception(f"无法打开数据库: {db_path}")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def close(self):
        if self.db[0] != ffi.NULL:
            sqlite.sqlite3_close(self.db[0])
            self.db[0] = ffi.NULL

    def execute(self, sql: str) -> None:
        """执行 SQL（无返回值）"""
        errmsg = ffi.new("char**")
        result = sqlite.sqlite3_exec(
            self.db[0], sql.encode(), ffi.NULL, ffi.NULL, errmsg
        )
        if result != self.SQLITE_OK:
            error = ffi.string(errmsg[0]).decode()
            sqlite.sqlite3_free(errmsg[0])
            raise Exception(f"SQL 错误: {error}")

    def query(self, sql: str):
        """执行查询并返回结果"""
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
                # 简化：假设只有两列（id, name）
                id_val = sqlite.sqlite3_column_int(stmt[0], 0)
                name_ptr = sqlite.sqlite3_column_text(stmt[0], 1)
                name = ffi.string(name_ptr).decode() if name_ptr != ffi.NULL else None
                rows.append((id_val, name))
            return rows
        finally:
            sqlite.sqlite3_finalize(stmt[0])

# 使用示例
with SQLiteDB(":memory:") as db:
    db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
    db.execute("INSERT INTO users (name) VALUES ('Alice')")
    db.execute("INSERT INTO users (name) VALUES ('Bob')")

    results = db.query("SELECT * FROM users")
    for row in results:
        print(f"ID: {row[0]}, Name: {row[1]}")
```

### 场景二：高性能数值计算

```python
import numpy as np
import ctypes
from typing import Tuple

# 假设我们有一个 C 库用于快速矩阵运算
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
    """高性能数学运算库"""

    def __init__(self, lib_path: str = './libfastmath.so'):
        self._lib = ctypes.CDLL(lib_path)
        self._setup_functions()

    def _setup_functions(self):
        # 矩阵加法
        self._lib.matrix_add.argtypes = [
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(ctypes.c_double),
            ctypes.POINTER(ctypes.c_double),
            ctypes.c_int,
            ctypes.c_int
        ]
        self._lib.matrix_add.restype = None

        # 矩阵乘法
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
        """将 numpy 数组转换为 C 指针"""
        if not arr.flags['C_CONTIGUOUS']:
            arr = np.ascontiguousarray(arr)
        return arr.ctypes.data_as(ctypes.POINTER(ctypes.c_double))

    def add(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """矩阵加法"""
        if a.shape != b.shape:
            raise ValueError("矩阵形状必须相同")

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
        """矩阵乘法"""
        if a.shape[1] != b.shape[0]:
            raise ValueError("矩阵维度不匹配")

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

# 使用示例
"""
math = FastMath()

a = np.array([[1, 2], [3, 4]], dtype=np.float64)
b = np.array([[5, 6], [7, 8]], dtype=np.float64)

c = math.add(a, b)
print("矩阵加法:")
print(c)

d = math.multiply(a, b)
print("矩阵乘法:")
print(d)
"""
```

### 场景三：系统监控工具

```python
from cffi import FFI
import sys

ffi = FFI()

if sys.platform == 'linux':
    ffi.cdef("""
        // 系统信息
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

        // 进程信息
        int getpid();
        int getppid();
        int getuid();
        int geteuid();

        // 主机名
        int gethostname(char *name, size_t len);

        // 资源使用
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
        """Linux 系统监控"""

        @staticmethod
        def get_system_info():
            """获取系统信息"""
            info = ffi.new("struct sysinfo*")
            if libc.sysinfo(info) != 0:
                raise OSError("无法获取系统信息")

            mem_unit = info.mem_unit
            return {
                'uptime_seconds': info.uptime,
                'load_1min': info.loads[0] / 65536.0,
                'load_5min': info.loads[1] / 65536.0,
                'load_15min': info.loads[2] / 65536.0,
                'total_ram_mb': (info.totalram * mem_unit) / (1024 * 1024),
                'free_ram_mb': (info.freeram * mem_unit) / (1024 * 1024),
                'total_swap_mb': (info.totalswap * mem_unit) / (1024 * 1024),
                'free_swap_mb': (info.freeswap * mem_unit) / (1024 * 1024),
                'process_count': info.procs,
            }

        @staticmethod
        def get_process_info():
            """获取当前进程信息"""
            return {
                'pid': libc.getpid(),
                'ppid': libc.getppid(),
                'uid': libc.getuid(),
                'euid': libc.geteuid(),
            }

        @staticmethod
        def get_hostname():
            """获取主机名"""
            name = ffi.new("char[256]")
            if libc.gethostname(name, 256) != 0:
                raise OSError("无法获取主机名")
            return ffi.string(name).decode()

        @staticmethod
        def get_resource_usage():
            """获取资源使用情况"""
            usage = ffi.new("struct rusage*")
            if libc.getrusage(0, usage) != 0:  # RUSAGE_SELF
                raise OSError("无法获取资源使用情况")

            return {
                'user_time': usage.ru_utime.tv_sec + usage.ru_utime.tv_usec / 1e6,
                'system_time': usage.ru_stime.tv_sec + usage.ru_stime.tv_usec / 1e6,
                'max_rss_kb': usage.ru_maxrss,
                'page_faults': usage.ru_majflt,
            }

    # 使用示例
    monitor = SystemMonitor()

    print("系统信息:")
    for k, v in monitor.get_system_info().items():
        print(f"  {k}: {v}")

    print("\n进程信息:")
    for k, v in monitor.get_process_info().items():
        print(f"  {k}: {v}")

    print(f"\n主机名: {monitor.get_hostname()}")

    print("\n资源使用:")
    for k, v in monitor.get_resource_usage().items():
        print(f"  {k}: {v}")
```

### 场景四：图像处理

```python
import numpy as np
import ctypes
from typing import Tuple

# 假设有一个 C 图像处理库
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
    """图像处理器"""

    def __init__(self, lib_path: str = './libimageproc.so'):
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
        """将 RGB 图像转换为灰度图"""
        if image.ndim != 3 or image.shape[2] != 3:
            raise ValueError("需要 RGB 图像 (height, width, 3)")

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
        """3x3 模糊"""
        if image.ndim != 2:
            raise ValueError("需要灰度图像")

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

# 使用示例
"""
from PIL import Image
import numpy as np

# 加载图像
img = Image.open('photo.jpg')
img_array = np.array(img)

# 处理
processor = ImageProcessor()
gray = processor.to_grayscale(img_array)
blurred = processor.blur(gray)

# 保存
Image.fromarray(blurred).save('blurred.jpg')
"""
```

## 面试要点

### 基础问题

1. **Q: ctypes 和 CFFI 的主要区别是什么？**

   A:
   - ctypes 是 Python 标准库，CFFI 是第三方库
   - ctypes 需要手动定义类型，CFFI 可以解析 C 头文件
   - CFFI 有两种模式（ABI/API），API 模式性能更好
   - CFFI 的错误提示更友好
   - CFFI 更适合复杂的 C 接口

2. **Q: 如何在 ctypes 中处理 C 字符串？**

   A:
   ```python
   # 输入字符串
   lib.func(b"hello")  # 或 "hello".encode()
   lib.func.argtypes = [ctypes.c_char_p]

   # 输出字符串
   lib.func.restype = ctypes.c_char_p
   result = lib.func()
   print(result.decode('utf-8'))
   ```

3. **Q: 什么是回调函数？如何在 Python 中实现？**

   A: 回调函数是传递给 C 代码的 Python 函数，在 C 代码中被调用。
   ```python
   # ctypes
   CALLBACK = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int)

   def my_callback(x):
       return x * 2

   cb = CALLBACK(my_callback)
   lib.register(cb)

   # 重要：保持 cb 的引用，防止被垃圾回收
   ```

### 进阶问题

4. **Q: 如何处理结构体对齐问题？**

   A:
   ```python
   class MyStruct(ctypes.Structure):
       _pack_ = 1  # 取消对齐（如果 C 代码使用 #pragma pack(1)）
       _fields_ = [...]

   # 或使用默认对齐（与平台 C 编译器一致）
   ```

5. **Q: CFFI 的 ABI 模式和 API 模式有什么区别？**

   A:
   - ABI 模式：运行时加载库，无需编译器，速度较慢
   - API 模式：编译时生成扩展模块，需要编译器，速度更快
   - API 模式可以避免 ABI 兼容性问题

6. **Q: 如何避免内存泄漏？**

   A:
   ```python
   # 使用 ffi.gc() 自动释放
   ptr = ffi.gc(lib.malloc(1024), lib.free)

   # 使用上下文管理器
   @contextmanager
   def managed_resource():
       r = lib.create()
       try:
           yield r
       finally:
           lib.destroy(r)
   ```

### 实战问题

7. **Q: 如何将 numpy 数组传递给 C 函数？**

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

8. **Q: 如何处理跨平台兼容性？**

   A:
   ```python
   import sys

   if sys.platform == 'win32':
       lib_name = 'mylib.dll'
       lib = ctypes.WinDLL(lib_name)  # stdcall
   elif sys.platform == 'darwin':
       lib_name = 'libmylib.dylib'
       lib = ctypes.CDLL(lib_name)
   else:
       lib_name = 'libmylib.so'
       lib = ctypes.CDLL(lib_name)
   ```

9. **Q: 什么时候应该使用 C 扩展而不是纯 Python？**

   A:
   - 需要调用现有 C 库
   - 计算密集型任务需要优化
   - 需要访问底层系统 API
   - 处理二进制协议
   - 但对于简单任务，纯 Python 更易维护

## 延伸阅读

### 官方文档

- [ctypes 官方文档](https://docs.python.org/3/library/ctypes.html)
- [CFFI 官方文档](https://cffi.readthedocs.io/)
- [Python/C API 参考手册](https://docs.python.org/3/c-api/)

### 相关工具

- [pybind11](https://pybind11.readthedocs.io/) - 现代 C++ 绑定库
- [Cython](https://cython.org/) - Python 到 C 编译器
- [SWIG](https://www.swig.org/) - 多语言接口生成器
- [Numba](https://numba.pydata.org/) - JIT 编译加速

### 优质教程

- [Real Python: Python Bindings](https://realpython.com/python-bindings-overview/)
- [Python 3 Module of the Week: ctypes](https://pymotw.com/3/ctypes/)
- [CFFI User Guide](https://cffi.readthedocs.io/en/latest/using.html)

### 书籍推荐

- 《Python Cookbook》第 15 章 - C 扩展
- 《High Performance Python》 - 性能优化
- 《Expert Python Programming》 - 高级技术

### 开源项目参考

- [cryptography](https://github.com/pyca/cryptography) - 使用 CFFI 调用 OpenSSL
- [lxml](https://github.com/lxml/lxml) - 使用 Cython 包装 libxml2
- [Pillow](https://github.com/python-pillow/Pillow) - 图像处理库
- [PyAudio](https://people.csail.mit.edu/hubert/pyaudio/) - 音频 I/O
