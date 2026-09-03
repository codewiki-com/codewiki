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
origin: old/src/content/docs/python/struct.zh.md
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

`struct` 模块是 Python 标准库中用于处理二进制数据的核心工具。它提供了将 Python 值与 C 语言结构体之间进行转换的能力，在网络编程、文件格式解析、硬件通信等底层数据处理场景中不可或缺。

## 概念解释

### 什么是 struct 模块

`struct` 模块实现了 Python 值和 C 结构体（表示为 Python `bytes` 对象）之间的转换。它主要用于以下场景：

- 解析二进制文件格式（如图像、音频、可执行文件）
- 网络协议数据包的构造与解析
- 与 C/C++ 程序进行数据交换
- 嵌入式系统和硬件设备通信
- 内存映射和共享内存操作

### 为什么需要 struct

Python 是高级语言，其内置类型（如 `int`、`float`）的内存表示与 C 语言不同。当需要与底层系统、网络协议或二进制文件交互时，必须按照特定的字节格式进行数据打包和解包。`struct` 模块正是为此而生。

```python
import struct

# 将整数打包为 4 字节的二进制数据
packed = struct.pack('i', 42)
print(packed)  # b'*\x00\x00\x00' (小端序)
print(len(packed))  # 4

# 从二进制数据中解包整数
value = struct.unpack('i', packed)
print(value)  # (42,)
```

## 核心原理

### 内存布局与字节表示

计算机以字节为单位存储数据。不同的数据类型占用不同的字节数：

| 数据类型 | C 类型 | 典型大小 |
|---------|--------|---------|
| 字符 | char | 1 字节 |
| 短整型 | short | 2 字节 |
| 整型 | int | 4 字节 |
| 长整型 | long | 4 或 8 字节 |
| 单精度浮点 | float | 4 字节 |
| 双精度浮点 | double | 8 字节 |

### 字节序（Byte Order）

字节序决定了多字节数据在内存中的存储顺序：

- **大端序（Big-endian）**：高位字节存储在低地址，符合人类阅读习惯
- **小端序（Little-endian）**：低位字节存储在低地址，x86/x64 架构使用
- **网络字节序**：即大端序，网络协议标准

```python
import struct

value = 0x12345678

# 大端序（网络字节序）
big_endian = struct.pack('>I', value)
print(big_endian.hex())  # 12345678

# 小端序
little_endian = struct.pack('<I', value)
print(little_endian.hex())  # 78563412

# 原生字节序（取决于系统）
native = struct.pack('=I', value)
print(native.hex())  # 取决于运行系统
```

### 数据对齐

C 编译器通常会对结构体成员进行内存对齐以提高访问效率。`struct` 模块可以模拟这种行为：

```python
import struct

# 无对齐（紧凑）
packed_size = struct.calcsize('=bI')  # char + int
print(f"无对齐: {packed_size} 字节")  # 5 字节

# 原生对齐
native_size = struct.calcsize('@bI')  # char + int（带对齐）
print(f"原生对齐: {native_size} 字节")  # 8 字节（取决于平台）
```

## 核心要点

### 格式字符串

格式字符串由两部分组成：字节序字符（可选）和格式字符。

#### 字节序字符

| 字符 | 含义 | 大小 | 对齐 |
|-----|------|-----|-----|
| `@` | 原生 | 原生 | 原生 |
| `=` | 原生 | 标准 | 无 |
| `<` | 小端 | 标准 | 无 |
| `>` | 大端 | 标准 | 无 |
| `!` | 网络（大端）| 标准 | 无 |

#### 格式字符

| 格式 | C 类型 | Python 类型 | 标准大小 |
|-----|--------|------------|---------|
| `x` | 填充字节 | 无 | 1 |
| `c` | char | bytes (长度1) | 1 |
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
| `n` | ssize_t | int | 原生 |
| `N` | size_t | int | 原生 |
| `e` | 半精度浮点 | float | 2 |
| `f` | float | float | 4 |
| `d` | double | float | 8 |
| `s` | char[] | bytes | - |
| `p` | char[]（Pascal 字符串）| bytes | - |
| `P` | void * | int | 原生 |

### 核心函数

```python
import struct

# struct.pack(format, v1, v2, ...) - 打包数据
data = struct.pack('!HI', 80, 12345)

# struct.unpack(format, buffer) - 解包数据
port, num = struct.unpack('!HI', data)

# struct.calcsize(format) - 计算格式字符串对应的字节数
size = struct.calcsize('!HI')  # 6

# struct.pack_into(format, buffer, offset, v1, v2, ...) - 打包到缓冲区
buffer = bytearray(10)
struct.pack_into('!HI', buffer, 2, 80, 12345)

# struct.unpack_from(format, buffer, offset=0) - 从缓冲区解包
values = struct.unpack_from('!HI', buffer, 2)

# struct.iter_unpack(format, buffer) - 迭代解包（Python 3.4+）
for item in struct.iter_unpack('!HI', data * 3):
    print(item)
```

## 代码示例

### 基本打包与解包

```python
import struct

# 打包不同类型的数据
format_string = '>B H I f'  # 大端序：无符号字节、无符号短整型、无符号整型、浮点数
values = (255, 65535, 4294967295, 3.14)

packed_data = struct.pack(format_string, *values)
print(f"打包后: {packed_data.hex()}")
print(f"字节数: {len(packed_data)}")

# 解包
unpacked = struct.unpack(format_string, packed_data)
print(f"解包后: {unpacked}")
# 解包后: (255, 65535, 4294967295, 3.140000104904175)

# 注意：浮点数可能有精度损失
```

### 处理字符串

```python
import struct

# 定长字符串
name = b'Python'
packed = struct.pack('10s', name)
print(packed)  # b'Python\x00\x00\x00\x00'

# 解包字符串
unpacked = struct.unpack('10s', packed)
print(unpacked[0])  # b'Python\x00\x00\x00\x00'
print(unpacked[0].rstrip(b'\x00'))  # b'Python'

# 字符串与其他类型混合
data = struct.pack('>I 8s f', 42, b'message!', 3.14)
num, text, val = struct.unpack('>I 8s f', data)
print(f"数字: {num}, 文本: {text.decode()}, 值: {val}")
```

### 使用 Struct 类

对于重复使用的格式，使用 `Struct` 类可以提高性能：

```python
import struct

# 创建 Struct 对象
header_format = struct.Struct('>I H H')

# 使用 Struct 对象的方法
data = header_format.pack(1024, 80, 443)
print(f"大小: {header_format.size} 字节")

# 解包
size, port1, port2 = header_format.unpack(data)
print(f"大小: {size}, 端口1: {port1}, 端口2: {port2}")

# 性能对比
import timeit

format_str = '>I H H'
values = (1024, 80, 443)

# 使用函数
def pack_function():
    return struct.pack(format_str, *values)

# 使用 Struct 对象
s = struct.Struct(format_str)
def pack_object():
    return s.pack(*values)

# Struct 对象通常更快
print(f"函数方式: {timeit.timeit(pack_function, number=100000):.4f}s")
print(f"对象方式: {timeit.timeit(pack_object, number=100000):.4f}s")
```

### 解析网络数据包

```python
import struct

def parse_ip_header(packet: bytes) -> dict:
    """解析 IPv4 数据包头部"""
    # IPv4 头部格式（简化版）
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
        raise ValueError("数据包太短")

    # 解包前 20 字节
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

# 示例数据包
sample_packet = bytes([
    0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00,
    0x40, 0x06, 0xb1, 0xe6, 0xac, 0x10, 0x0a, 0x63,
    0xac, 0x10, 0x0a, 0x0c
])

header = parse_ip_header(sample_packet)
print(f"版本: IPv{header['version']}")
print(f"源IP: {header['src_ip']}")
print(f"目标IP: {header['dst_ip']}")
print(f"协议: {header['protocol']}")
print(f"TTL: {header['ttl']}")
```

### 读取二进制文件

```python
import struct
from pathlib import Path

def read_bmp_header(filepath: str) -> dict:
    """读取 BMP 文件头"""
    with open(filepath, 'rb') as f:
        # BMP 文件头 (14 字节)
        # 2 bytes: 魔数 ('BM')
        # 4 bytes: 文件大小
        # 2 bytes: 保留
        # 2 bytes: 保留
        # 4 bytes: 像素数据偏移

        magic = f.read(2)
        if magic != b'BM':
            raise ValueError("不是有效的 BMP 文件")

        file_size, _, _, pixel_offset = struct.unpack('<I H H I', f.read(12))

        # DIB 头 (至少 40 字节，BITMAPINFOHEADER)
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

# 使用示例
# header = read_bmp_header('image.bmp')
# print(f"图像尺寸: {header['width']} x {header['height']}")
# print(f"色深: {header['bits_per_pixel']} 位")
```

### 创建二进制文件格式

```python
import struct
from dataclasses import dataclass
from typing import List

@dataclass
class Record:
    """数据记录"""
    id: int
    name: str
    score: float
    active: bool

class BinaryDatabase:
    """简单的二进制数据库"""

    MAGIC = b'MYDB'
    VERSION = 1
    RECORD_FORMAT = '>I 32s f ?'  # id, name(32字节), score, active
    RECORD_SIZE = struct.calcsize(RECORD_FORMAT)

    def __init__(self, filepath: str):
        self.filepath = filepath
        self._struct = struct.Struct(self.RECORD_FORMAT)

    def write(self, records: List[Record]):
        """写入记录到文件"""
        with open(self.filepath, 'wb') as f:
            # 写入文件头
            header = struct.pack('>4s I I', self.MAGIC, self.VERSION, len(records))
            f.write(header)

            # 写入记录
            for record in records:
                name_bytes = record.name.encode('utf-8')[:32].ljust(32, b'\x00')
                data = self._struct.pack(record.id, name_bytes, record.score, record.active)
                f.write(data)

    def read(self) -> List[Record]:
        """从文件读取记录"""
        records = []

        with open(self.filepath, 'rb') as f:
            # 读取文件头
            header = f.read(12)
            magic, version, count = struct.unpack('>4s I I', header)

            if magic != self.MAGIC:
                raise ValueError("无效的文件格式")
            if version != self.VERSION:
                raise ValueError(f"不支持的版本: {version}")

            # 读取记录
            for _ in range(count):
                data = f.read(self.RECORD_SIZE)
                id_, name_bytes, score, active = self._struct.unpack(data)
                name = name_bytes.rstrip(b'\x00').decode('utf-8')
                records.append(Record(id_, name, score, active))

        return records

# 使用示例
db = BinaryDatabase('data.bin')

# 写入数据
records = [
    Record(1, '张三', 95.5, True),
    Record(2, '李四', 88.0, True),
    Record(3, '王五', 72.5, False),
]
db.write(records)

# 读取数据
loaded = db.read()
for r in loaded:
    status = '活跃' if r.active else '非活跃'
    print(f"ID: {r.id}, 姓名: {r.name}, 分数: {r.score}, 状态: {status}")
```

## 最佳实践

### 始终明确指定字节序

```python
import struct

# 不好：依赖系统默认字节序，可能导致跨平台问题
data = struct.pack('I', 12345)

# 好：明确指定字节序
data = struct.pack('>I', 12345)  # 大端序
data = struct.pack('<I', 12345)  # 小端序

# 网络编程推荐使用 ! 或 >（网络字节序 = 大端序）
data = struct.pack('!I', 12345)
```

### 使用 Struct 类处理重复格式

```python
import struct

# 创建一次，重复使用
PACKET_FORMAT = struct.Struct('!H H I')

def create_packet(src_port: int, dst_port: int, seq: int) -> bytes:
    return PACKET_FORMAT.pack(src_port, dst_port, seq)

def parse_packet(data: bytes) -> tuple:
    return PACKET_FORMAT.unpack(data)
```

### 使用 calcsize 验证数据长度

```python
import struct

def safe_unpack(format_str: str, data: bytes):
    """安全解包，带长度验证"""
    expected_size = struct.calcsize(format_str)
    if len(data) < expected_size:
        raise ValueError(
            f"数据长度不足: 期望 {expected_size} 字节, 实际 {len(data)} 字节"
        )
    return struct.unpack(format_str, data[:expected_size])

# 使用
try:
    result = safe_unpack('>I H', b'\x00\x01')  # 数据太短
except ValueError as e:
    print(e)  # 数据长度不足: 期望 6 字节, 实际 2 字节
```

### 使用命名元组增强可读性

```python
import struct
from collections import namedtuple

# 定义数据结构
Header = namedtuple('Header', ['magic', 'version', 'length', 'checksum'])
HEADER_FORMAT = struct.Struct('>4s H I H')

def parse_header(data: bytes) -> Header:
    """解析头部并返回命名元组"""
    values = HEADER_FORMAT.unpack(data[:HEADER_FORMAT.size])
    return Header(*values)

# 使用
header_data = struct.pack('>4s H I H', b'HEAD', 1, 1024, 0xABCD)
header = parse_header(header_data)

print(f"魔数: {header.magic}")
print(f"版本: {header.version}")
print(f"长度: {header.length}")
print(f"校验和: 0x{header.checksum:04X}")
```

### 使用上下文管理器处理缓冲区

```python
import struct
from contextlib import contextmanager

@contextmanager
def binary_buffer(size: int):
    """创建可写缓冲区的上下文管理器"""
    buffer = bytearray(size)
    yield buffer
    # 可以在这里添加验证或清理逻辑

# 使用
with binary_buffer(16) as buf:
    struct.pack_into('>I I I I', buf, 0, 1, 2, 3, 4)
    print(buf.hex())
```

## 常见陷阱

### 字节序不一致

```python
import struct

# 陷阱：打包和解包使用不同的字节序
packed = struct.pack('>I', 0x12345678)  # 大端序打包
wrong = struct.unpack('<I', packed)[0]  # 小端序解包
print(f"错误结果: 0x{wrong:08X}")  # 0x78563412

correct = struct.unpack('>I', packed)[0]  # 正确：使用相同字节序
print(f"正确结果: 0x{correct:08X}")  # 0x12345678
```

### 字符串长度处理

```python
import struct

# 陷阱：字符串超过指定长度
long_name = b'This is a very long name'
try:
    packed = struct.pack('10s', long_name)  # 会被截断
    print(packed)  # b'This is a '
except:
    pass

# 陷阱：Unicode 字符串
try:
    struct.pack('10s', '中文')  # 错误！必须是 bytes
except struct.error as e:
    print(f"错误: {e}")

# 正确做法
name = '中文测试'
name_bytes = name.encode('utf-8')[:10].ljust(10, b'\x00')
packed = struct.pack('10s', name_bytes)
```

### 有符号与无符号混淆

```python
import struct

# 陷阱：使用错误的格式字符
value = -1

# 有符号整型
signed = struct.pack('>i', value)
print(signed.hex())  # ffffffff

# 无符号整型会报错（-1 超出范围）
try:
    unsigned = struct.pack('>I', value)
except struct.error as e:
    print(f"错误: {e}")  # 'I' format requires 0 <= number <= 4294967295

# 正确处理负数转无符号
unsigned_value = value & 0xFFFFFFFF  # 转换为无符号
unsigned = struct.pack('>I', unsigned_value)
```

### 对齐问题

```python
import struct

# 陷阱：忽略内存对齐差异
# C 结构体：
# struct data {
#     char c;
#     int i;
# };

# 紧凑格式（无对齐）
packed_size = struct.calcsize('=bi')
print(f"紧凑大小: {packed_size}")  # 5

# 原生格式（有对齐）
native_size = struct.calcsize('@bi')
print(f"原生大小: {native_size}")  # 可能是 8

# 如果要与 C 程序交互，需要匹配 C 编译器的对齐设置
# 或者在 C 代码中使用 #pragma pack(1)
```

### 浮点数精度

```python
import struct

# 陷阱：单精度浮点数精度损失
original = 3.141592653589793
packed = struct.pack('f', original)
unpacked = struct.unpack('f', packed)[0]

print(f"原始值: {original}")
print(f"解包值: {unpacked}")
print(f"精度损失: {abs(original - unpacked)}")

# 如需更高精度，使用双精度
packed_double = struct.pack('d', original)
unpacked_double = struct.unpack('d', packed_double)[0]
print(f"双精度解包: {unpacked_double}")
```

## 性能考量

### 性能对比测试

```python
import struct
import timeit
import array

# 测试数据
data = list(range(1000))

# 方法1：使用 struct.pack 循环
def method_pack_loop():
    result = b''
    for i in data:
        result += struct.pack('>I', i)
    return result

# 方法2：使用 struct.pack 一次性
def method_pack_once():
    return struct.pack(f'>{len(data)}I', *data)

# 方法3：使用 Struct 对象
s = struct.Struct('>I')
def method_struct_object():
    result = b''
    for i in data:
        result += s.pack(i)
    return result

# 方法4：使用 bytearray 和 pack_into
def method_pack_into():
    buf = bytearray(len(data) * 4)
    for i, val in enumerate(data):
        struct.pack_into('>I', buf, i * 4, val)
    return bytes(buf)

# 方法5：使用 array 模块（最快，但字节序是原生的）
def method_array():
    a = array.array('I', data)
    return a.tobytes()

# 性能测试
methods = [
    ('pack 循环', method_pack_loop),
    ('pack 一次性', method_pack_once),
    ('Struct 对象', method_struct_object),
    ('pack_into', method_pack_into),
    ('array 模块', method_array),
]

for name, func in methods:
    time = timeit.timeit(func, number=1000)
    print(f"{name}: {time:.4f}s")
```

### 优化建议

1. **重复使用 Struct 对象**：避免重复解析格式字符串
2. **批量操作**：尽可能一次打包多个值
3. **使用 pack_into/unpack_from**：避免频繁创建新的 bytes 对象
4. **考虑 array 模块**：对于同类型数据，array 模块可能更快
5. **使用 memoryview**：处理大型缓冲区时避免复制

```python
import struct

# 高效处理大型缓冲区
def process_large_buffer(data: bytes):
    """使用 memoryview 高效处理数据"""
    mv = memoryview(data)
    record_size = struct.calcsize('>I f')
    record_count = len(data) // record_size

    for i in range(record_count):
        offset = i * record_size
        # 直接在 memoryview 上操作，无需复制
        id_, value = struct.unpack_from('>I f', mv, offset)
        yield id_, value
```

## 实战场景

### 场景1：实现简单的 RPC 协议

```python
import struct
import socket
import json
from typing import Any

class SimpleRPC:
    """简单的 RPC 协议实现"""

    HEADER_FORMAT = struct.Struct('!I I')  # 消息类型, 数据长度

    MSG_REQUEST = 1
    MSG_RESPONSE = 2

    def __init__(self, sock: socket.socket):
        self.sock = sock

    def send_request(self, method: str, params: dict):
        """发送请求"""
        payload = json.dumps({'method': method, 'params': params}).encode()
        header = self.HEADER_FORMAT.pack(self.MSG_REQUEST, len(payload))
        self.sock.sendall(header + payload)

    def receive_message(self) -> tuple[int, Any]:
        """接收消息"""
        header_data = self._recv_exact(self.HEADER_FORMAT.size)
        msg_type, length = self.HEADER_FORMAT.unpack(header_data)

        payload_data = self._recv_exact(length)
        payload = json.loads(payload_data.decode())

        return msg_type, payload

    def _recv_exact(self, size: int) -> bytes:
        """精确接收指定字节数"""
        data = b''
        while len(data) < size:
            chunk = self.sock.recv(size - len(data))
            if not chunk:
                raise ConnectionError("连接已关闭")
            data += chunk
        return data
```

### 场景2：解析 WAV 音频文件

```python
import struct
from dataclasses import dataclass

@dataclass
class WavHeader:
    """WAV 文件头信息"""
    channels: int
    sample_rate: int
    byte_rate: int
    block_align: int
    bits_per_sample: int
    data_size: int

def parse_wav(filepath: str) -> tuple[WavHeader, bytes]:
    """解析 WAV 文件"""
    with open(filepath, 'rb') as f:
        # RIFF 头
        riff = f.read(4)
        if riff != b'RIFF':
            raise ValueError("不是有效的 WAV 文件")

        file_size = struct.unpack('<I', f.read(4))[0]
        wave = f.read(4)
        if wave != b'WAVE':
            raise ValueError("不是有效的 WAV 文件")

        # 读取块
        fmt_chunk = None
        data_chunk = None

        while True:
            chunk_id = f.read(4)
            if len(chunk_id) < 4:
                break

            chunk_size = struct.unpack('<I', f.read(4))[0]

            if chunk_id == b'fmt ':
                # 格式块
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
                # 数据块
                data_chunk = f.read(chunk_size)
                break
            else:
                # 跳过其他块
                f.seek(chunk_size, 1)

        if fmt_chunk is None or data_chunk is None:
            raise ValueError("WAV 文件格式不完整")

        header = WavHeader(
            channels=fmt_chunk['channels'],
            sample_rate=fmt_chunk['sample_rate'],
            byte_rate=fmt_chunk['byte_rate'],
            block_align=fmt_chunk['block_align'],
            bits_per_sample=fmt_chunk['bits_per_sample'],
            data_size=len(data_chunk),
        )

        return header, data_chunk

# 使用示例
# header, audio_data = parse_wav('audio.wav')
# print(f"采样率: {header.sample_rate} Hz")
# print(f"声道数: {header.channels}")
# print(f"位深度: {header.bits_per_sample} bit")
# print(f"时长: {header.data_size / header.byte_rate:.2f} 秒")
```

### 场景3：创建自定义协议消息

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
    """自定义协议消息"""

    # 消息头格式：魔数(2) + 版本(1) + 类型(1) + 序列号(4) + 数据长度(4) + 校验和(4)
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
        """序列化为字节"""
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
        """从字节反序列化"""
        if len(data) < cls.HEADER_FORMAT.size:
            return None

        magic, version, msg_type, seq, length, checksum = \
            cls.HEADER_FORMAT.unpack(data[:cls.HEADER_FORMAT.size])

        if magic != cls.MAGIC:
            raise ValueError("无效的魔数")
        if version != cls.VERSION:
            raise ValueError(f"不支持的版本: {version}")

        payload = data[cls.HEADER_FORMAT.size:cls.HEADER_FORMAT.size + length]

        if cls._calculate_checksum(payload) != checksum:
            raise ValueError("校验和错误")

        return cls(MessageType(msg_type), seq, payload)

    @staticmethod
    def _calculate_checksum(data: bytes) -> int:
        """计算校验和（CRC32）"""
        import zlib
        return zlib.crc32(data) & 0xFFFFFFFF

# 使用示例
msg = Message(MessageType.DATA, sequence=1, payload=b'Hello, World!')
serialized = msg.to_bytes()
print(f"序列化: {serialized.hex()}")

parsed = Message.from_bytes(serialized)
print(f"类型: {parsed.msg_type.name}")
print(f"序列号: {parsed.sequence}")
print(f"载荷: {parsed.payload.decode()}")
```

## 面试要点

### struct 模块的作用是什么？

`struct` 模块用于在 Python 值和 C 结构体（表示为 bytes 对象）之间进行转换。主要用于处理二进制数据，如网络协议、文件格式解析、与 C 程序交互等场景。

### pack 和 unpack 的区别？

- `pack(format, v1, v2, ...)`: 将 Python 值按格式打包成 bytes
- `unpack(format, buffer)`: 将 bytes 按格式解包成 Python 值元组

```python
import struct

# pack: Python 值 -> bytes
data = struct.pack('>I H', 1000, 80)

# unpack: bytes -> Python 值元组
values = struct.unpack('>I H', data)  # (1000, 80)
```

### 什么是字节序？如何指定？

字节序决定多字节数据的存储顺序：
- 大端序 (`>` 或 `!`): 高位字节在前
- 小端序 (`<`): 低位字节在前
- 原生序 (`@` 或 `=`): 取决于系统

网络编程通常使用大端序（网络字节序）。

### Struct 类相比函数有什么优势？

`Struct` 类预编译格式字符串，重复使用时性能更好：

```python
import struct

# 函数方式：每次都解析格式字符串
for _ in range(1000):
    struct.pack('>I H', 100, 200)

# 类方式：格式字符串只解析一次
s = struct.Struct('>I H')
for _ in range(1000):
    s.pack(100, 200)  # 更快
```

### 如何处理可变长度数据？

使用 `calcsize` 计算固定部分，动态构造格式字符串：

```python
import struct

def pack_with_string(id: int, name: str) -> bytes:
    name_bytes = name.encode('utf-8')
    # 先打包长度，再打包内容
    return struct.pack(f'>I I {len(name_bytes)}s',
                       id, len(name_bytes), name_bytes)
```

### struct.error 异常的常见原因？

- 格式字符串语法错误
- 值超出格式字符允许范围
- 缓冲区长度不足
- 字符串传入非 bytes 类型

```python
import struct

# 值超出范围
try:
    struct.pack('B', 256)  # B 是 0-255
except struct.error:
    print("值超出范围")

# 缓冲区不足
try:
    struct.unpack('>I I', b'\x00\x01\x02')  # 需要 8 字节
except struct.error:
    print("缓冲区不足")
```

## 延伸阅读

- [Python 官方文档 - struct](https://docs.python.org/3/library/struct.html)
- [Python 官方文档 - 二进制数据服务](https://docs.python.org/3/library/binary.html)
- [array 模块](https://docs.python.org/3/library/array.html) - 高效存储同类型数据
- [ctypes 模块](https://docs.python.org/3/library/ctypes.html) - 更复杂的 C 数据类型处理
- [mmap 模块](https://docs.python.org/3/library/mmap.html) - 内存映射文件
- [IEEE 754 浮点数标准](https://en.wikipedia.org/wiki/IEEE_754) - 理解浮点数表示
- [网络字节序](https://en.wikipedia.org/wiki/Endianness) - 深入理解字节序
