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
origin: old/src/content/docs/python/io-module.zh.md
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

`io` 模块是 Python 处理流式 I/O 的核心模块，提供了处理各种 I/O 类型的主要功能。它定义了三种主要的 I/O 类型：文本 I/O、二进制 I/O 和原始 I/O。其中最常用的是 `StringIO` 和 `BytesIO`，它们允许你像操作文件一样操作内存中的数据。

## 概念解释

### 什么是内存流

内存流（In-Memory Stream）是一种将内存缓冲区当作文件来操作的技术。与磁盘文件不同，内存流的数据完全存储在 RAM 中，因此读写速度极快，非常适合临时数据处理、测试模拟、以及需要文件接口但不想进行实际磁盘 I/O 的场景。

```python
from io import StringIO, BytesIO

# StringIO - 处理文本数据的内存流
text_stream = StringIO("Hello, World!")
print(text_stream.read())  # Hello, World!

# BytesIO - 处理二进制数据的内存流
binary_stream = BytesIO(b"\x89PNG\r\n\x1a\n")
print(binary_stream.read())  # b'\x89PNG\r\n\x1a\n'
```

### 文件对象协议

Python 中的"文件对象"（file-like object）是一个遵循特定协议的对象，它实现了 `read()`、`write()`、`seek()` 等方法。`io` 模块中的所有流类都遵循这个协议，因此可以在任何需要文件对象的地方使用它们。

```python
from io import StringIO

def process_file(file_obj):
    """这个函数接受任何文件对象"""
    return file_obj.read().upper()

# 可以传入真实文件
with open("data.txt") as f:
    result = process_file(f)

# 也可以传入内存流
stream = StringIO("hello world")
result = process_file(stream)
print(result)  # HELLO WORLD
```

### io 模块的 I/O 层次结构

`io` 模块采用分层架构设计：

| 层级 | 类型 | 主要类 | 说明 |
|------|------|--------|------|
| 高层 | 文本 I/O | `TextIOWrapper`, `StringIO` | 处理 str 对象 |
| 中层 | 缓冲二进制 I/O | `BufferedReader`, `BufferedWriter`, `BytesIO` | 处理 bytes，带缓冲 |
| 底层 | 原始二进制 I/O | `FileIO`, `RawIOBase` | 直接操作原始字节 |

## 核心原理

### StringIO 工作原理

`StringIO` 在内部维护一个字符串缓冲区和一个位置指针。所有操作都在这个缓冲区上进行，不涉及任何文件系统调用。

```python
from io import StringIO

# 创建 StringIO 对象
stream = StringIO()

# 写入数据 - 数据存储在内存缓冲区中
stream.write("Line 1\n")
stream.write("Line 2\n")

# 此时位置指针在末尾
print(f"当前位置: {stream.tell()}")  # 14

# 读取前需要将位置指针移回开头
stream.seek(0)
print(stream.read())  # Line 1\nLine 2\n

# 获取缓冲区的完整内容（不受位置指针影响）
print(stream.getvalue())  # Line 1\nLine 2\n
```

### BytesIO 工作原理

`BytesIO` 与 `StringIO` 类似，但处理的是二进制数据（`bytes` 类型）：

```python
from io import BytesIO

# 创建 BytesIO 对象
stream = BytesIO()

# 写入二进制数据
stream.write(b"\x00\x01\x02\x03")
stream.write(b"\x04\x05\x06\x07")

# 获取当前位置
print(f"当前位置: {stream.tell()}")  # 8

# 移动到开头读取
stream.seek(0)
data = stream.read(4)
print(data)  # b'\x00\x01\x02\x03'

# 获取完整内容
print(stream.getvalue())  # b'\x00\x01\x02\x03\x04\x05\x06\x07'
```

### 缓冲 I/O 原理

缓冲 I/O 类（如 `BufferedReader`、`BufferedWriter`）在原始 I/O 和应用程序之间添加了一个缓冲层，减少系统调用次数，提高性能：

```python
from io import BufferedReader, FileIO

# 使用缓冲读取器包装原始文件 I/O
raw_file = FileIO("large_file.bin", "rb")
buffered = BufferedReader(raw_file, buffer_size=8192)

# 读取操作会先从缓冲区获取数据
# 缓冲区为空时才会从底层文件读取
data = buffered.read(100)
buffered.close()
```

### TextIOWrapper 原理

`TextIOWrapper` 是一个在二进制流之上提供文本接口的包装器，负责字符编码和解码：

```python
from io import TextIOWrapper, BytesIO

# 创建二进制流
binary_stream = BytesIO(b"\xe4\xb8\xad\xe6\x96\x87")  # UTF-8 编码的 "中文"

# 用 TextIOWrapper 包装，指定编码
text_stream = TextIOWrapper(binary_stream, encoding="utf-8")

# 现在可以读取文本
print(text_stream.read())  # 中文
```

## 核心要点

### StringIO 核心 API

```python
from io import StringIO

# 创建方式
stream = StringIO()           # 空的 StringIO
stream = StringIO("initial")  # 带初始内容

# 写入操作
stream.write("text")          # 写入字符串，返回写入字符数
stream.writelines(["a", "b"]) # 写入字符串列表

# 读取操作
stream.read()                 # 读取全部内容
stream.read(10)               # 读取指定字符数
stream.readline()             # 读取一行
stream.readlines()            # 读取所有行，返回列表

# 位置操作
stream.tell()                 # 获取当前位置
stream.seek(0)                # 移动到开头
stream.seek(0, 2)             # 移动到末尾

# 特殊方法
stream.getvalue()             # 获取完整内容（不受位置影响）
stream.truncate()             # 截断到当前位置
stream.truncate(10)           # 截断到指定位置
stream.close()                # 关闭流

# 状态检查
stream.readable()             # 是否可读
stream.writable()             # 是否可写
stream.seekable()             # 是否可定位
stream.closed                 # 是否已关闭
```

### BytesIO 核心 API

```python
from io import BytesIO

# 创建方式
stream = BytesIO()              # 空的 BytesIO
stream = BytesIO(b"initial")    # 带初始内容

# 写入操作
stream.write(b"bytes")          # 写入字节，返回写入字节数
stream.writelines([b"a", b"b"]) # 写入字节列表

# 读取操作
stream.read()                   # 读取全部内容
stream.read(10)                 # 读取指定字节数
stream.read1(10)                # 最多读取指定字节（可能更少）
stream.readline()               # 读取一行
stream.readlines()              # 读取所有行

# 缓冲区操作
stream.getbuffer()              # 获取可写的缓冲区视图
stream.getvalue()               # 获取完整内容

# 位置操作（与 StringIO 相同）
stream.tell()
stream.seek(0)
stream.seek(0, 2)
```

### seek() 方法详解

`seek(offset, whence)` 方法用于移动位置指针：

| whence 参数 | 常量 | 说明 |
|-------------|------|------|
| 0 | `SEEK_SET` | 从开头算起（默认） |
| 1 | `SEEK_CUR` | 从当前位置算起 |
| 2 | `SEEK_END` | 从末尾算起 |

```python
from io import StringIO, SEEK_SET, SEEK_CUR, SEEK_END

stream = StringIO("0123456789")

# 从开头移动
stream.seek(5, SEEK_SET)  # 移动到位置 5
print(stream.read(1))     # '5'

# 从当前位置移动
stream.seek(2, SEEK_CUR)  # 向前移动 2 位
print(stream.read(1))     # '8'

# 从末尾移动
stream.seek(-3, SEEK_END) # 从末尾向前 3 位
print(stream.read())      # '789'
```

**注意**：`StringIO` 不支持 `whence=1` 或 `whence=2` 时的非零偏移（因为字符宽度不固定）。`BytesIO` 则完全支持。

### 缓冲 I/O 类

```python
from io import BufferedReader, BufferedWriter, BufferedRandom, BufferedRWPair

# BufferedReader - 缓冲读取
# 用于包装可读的原始流
reader = BufferedReader(raw_stream, buffer_size=8192)

# BufferedWriter - 缓冲写入
# 用于包装可写的原始流
writer = BufferedWriter(raw_stream, buffer_size=8192)

# BufferedRandom - 缓冲随机访问
# 用于包装可读写的原始流
random_access = BufferedRandom(raw_stream)

# BufferedRWPair - 缓冲读写对
# 用于包装一对独立的读写流（如套接字）
rw_pair = BufferedRWPair(reader_stream, writer_stream)
```

### TextIOWrapper 详解

```python
from io import TextIOWrapper, BytesIO

binary_stream = BytesIO()

# 完整参数
text_stream = TextIOWrapper(
    binary_stream,
    encoding="utf-8",           # 字符编码
    errors="strict",            # 错误处理：strict/ignore/replace/...
    newline=None,               # 换行符处理
    line_buffering=False,       # 行缓冲
    write_through=False         # 直写模式
)

# newline 参数说明：
# None     - 通用换行符模式（读取时转换，写入时使用系统默认）
# ""       - 不转换换行符
# "\n"     - 使用 \n 作为换行符
# "\r\n"   - 使用 \r\n 作为换行符
# "\r"     - 使用 \r 作为换行符
```

## 代码示例

### 基础示例：使用 StringIO

```python
from io import StringIO
import csv

# 示例1：将字符串当作文件读取
data = """name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago"""

stream = StringIO(data)

# 使用 csv 模块读取
reader = csv.DictReader(stream)
for row in reader:
    print(f"{row['name']} is {row['age']} years old")

# 示例2：将输出收集到字符串
output = StringIO()

# 模拟文件写入
output.write("Report Title\n")
output.write("=" * 20 + "\n")
for i in range(3):
    output.write(f"Item {i + 1}: Value {i * 100}\n")

# 获取完整内容
result = output.getvalue()
print(result)

# 示例3：重定向标准输出
import sys

old_stdout = sys.stdout
sys.stdout = StringIO()

# 这些 print 输出会被捕获
print("This is captured")
print("So is this")

captured = sys.stdout.getvalue()
sys.stdout = old_stdout

print(f"Captured output:\n{captured}")
```

### 基础示例：使用 BytesIO

```python
from io import BytesIO
import struct

# 示例1：处理二进制数据
buffer = BytesIO()

# 写入结构化二进制数据
buffer.write(struct.pack(">I", 12345))      # 4字节无符号整数（大端序）
buffer.write(struct.pack(">f", 3.14159))    # 4字节浮点数（大端序）
buffer.write(b"Hello\x00")                  # C风格字符串

# 读取
buffer.seek(0)
num = struct.unpack(">I", buffer.read(4))[0]
flt = struct.unpack(">f", buffer.read(4))[0]
string = buffer.read(6).rstrip(b"\x00").decode()

print(f"Number: {num}, Float: {flt:.5f}, String: {string}")

# 示例2：处理图像数据
from PIL import Image  # 需要 pip install Pillow

# 创建简单图像
img = Image.new("RGB", (100, 100), color="red")

# 保存到内存而非文件
img_buffer = BytesIO()
img.save(img_buffer, format="PNG")

# 获取二进制数据
img_bytes = img_buffer.getvalue()
print(f"Image size: {len(img_bytes)} bytes")

# 从内存加载图像
img_buffer.seek(0)
loaded_img = Image.open(img_buffer)
print(f"Loaded image size: {loaded_img.size}")

# 示例3：处理 ZIP 文件
import zipfile

zip_buffer = BytesIO()

# 创建内存中的 ZIP 文件
with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("file1.txt", "Content of file 1")
    zf.writestr("file2.txt", "Content of file 2")
    zf.writestr("folder/file3.txt", "Content in folder")

# 获取 ZIP 数据
zip_data = zip_buffer.getvalue()
print(f"ZIP size: {len(zip_data)} bytes")

# 从内存读取 ZIP
zip_buffer.seek(0)
with zipfile.ZipFile(zip_buffer, "r") as zf:
    print(f"Files in ZIP: {zf.namelist()}")
```

### 高级示例：TextIOWrapper 使用

```python
from io import BytesIO, TextIOWrapper

# 示例1：处理不同编码
def convert_encoding(data, from_encoding, to_encoding):
    """转换文本编码"""
    # 创建源流
    source = BytesIO(data)
    source_text = TextIOWrapper(source, encoding=from_encoding)

    # 读取并重新编码
    text = source_text.read()

    # 创建目标流
    target = BytesIO()
    target_text = TextIOWrapper(target, encoding=to_encoding)

    # 写入新编码
    target_text.write(text)
    target_text.flush()  # 确保数据写入底层流

    return target.getvalue()

# GBK 转 UTF-8
gbk_data = "中文测试".encode("gbk")
utf8_data = convert_encoding(gbk_data, "gbk", "utf-8")
print(utf8_data.decode("utf-8"))  # 中文测试

# 示例2：处理换行符转换
def normalize_newlines(text):
    """统一换行符为 \n"""
    source = BytesIO(text.encode("utf-8"))
    # newline="" 不做任何转换
    reader = TextIOWrapper(source, encoding="utf-8", newline="")

    target = BytesIO()
    # newline="\n" 写入时使用 \n
    writer = TextIOWrapper(target, encoding="utf-8", newline="\n")

    writer.write(reader.read())
    writer.flush()

    return target.getvalue().decode("utf-8")

mixed = "Line 1\r\nLine 2\rLine 3\n"
normalized = normalize_newlines(mixed)
print(repr(normalized))  # 'Line 1\nLine 2\nLine 3\n'

# 示例3：错误处理模式
binary_data = b"Hello \xff World"  # \xff 不是有效的 UTF-8

# strict 模式（默认）- 抛出异常
try:
    TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="strict").read()
except UnicodeDecodeError as e:
    print(f"Strict error: {e}")

# ignore 模式 - 忽略无效字符
result = TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="ignore").read()
print(f"Ignore: {result!r}")  # 'Hello  World'

# replace 模式 - 用替换字符替代
result = TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="replace").read()
print(f"Replace: {result!r}")  # 'Hello \ufffd World'

# backslashreplace 模式 - 用转义序列替代
result = TextIOWrapper(BytesIO(binary_data), encoding="utf-8", errors="backslashreplace").read()
print(f"Backslashreplace: {result!r}")  # 'Hello \\xff World'
```

### 高级示例：缓冲 I/O 操作

```python
from io import BytesIO, BufferedReader, BufferedWriter, BufferedRandom

# 示例1：使用 BufferedReader
class SlowReader:
    """模拟慢速读取器（如网络流）"""
    def __init__(self, data):
        self._data = data
        self._pos = 0

    def readinto(self, b):
        if self._pos >= len(self._data):
            return 0
        # 每次最多读取 10 字节
        n = min(10, len(self._data) - self._pos, len(b))
        b[:n] = self._data[self._pos:self._pos + n]
        self._pos += n
        return n

    def readable(self):
        return True

slow = SlowReader(b"A" * 100)
buffered = BufferedReader(slow, buffer_size=50)

# BufferedReader 会预读取数据到缓冲区
data = buffered.read(30)  # 实际会读取 50 字节到缓冲区
print(f"Read {len(data)} bytes")

# 示例2：使用 getbuffer() 零拷贝访问
buffer = BytesIO(b"Hello, World!")

# getbuffer() 返回缓冲区的内存视图
view = buffer.getbuffer()
print(f"Buffer size: {len(view)} bytes")

# 可以直接修改（零拷贝）
view[0:5] = b"HELLO"
print(buffer.getvalue())  # b'HELLO, World!'

# 释放视图
view.release()

# 示例3：使用 BufferedRandom 进行随机访问
buffer = BytesIO(b"\x00" * 100)
random_io = BufferedRandom(buffer)

# 随机位置写入
random_io.seek(50)
random_io.write(b"MIDDLE")

random_io.seek(0)
random_io.write(b"START")

random_io.seek(90)
random_io.write(b"END")

# 读取验证
random_io.seek(0)
print(random_io.read())
```

### 上下文管理器使用

```python
from io import StringIO, BytesIO
from contextlib import closing

# StringIO 和 BytesIO 本身支持上下文管理器协议
with StringIO("Hello") as stream:
    content = stream.read()
    print(content)

# 退出 with 块后，流自动关闭
# stream.read()  # ValueError: I/O operation on closed file

# 对于旧版本或自定义流，可以使用 closing
with closing(StringIO("World")) as stream:
    content = stream.read()
    print(content)

# 创建临时工作流的模式
def process_with_temp_stream():
    with BytesIO() as buffer:
        # 写入临时数据
        buffer.write(b"Temporary data")

        # 处理数据
        buffer.seek(0)
        data = buffer.read()

        # 返回处理结果
        return data.upper()

result = process_with_temp_stream()
print(result)  # b'TEMPORARY DATA'
```

## 最佳实践

### 选择正确的流类型

```python
from io import StringIO, BytesIO

# 处理文本数据时使用 StringIO
def process_text_data():
    text = "Hello, World!"
    stream = StringIO(text)  # 正确
    # stream = BytesIO(text)  # 错误！text 是 str，不是 bytes
    return stream.read().upper()

# 处理二进制数据时使用 BytesIO
def process_binary_data():
    binary = b"\x89PNG\r\n\x1a\n"
    stream = BytesIO(binary)  # 正确
    # stream = StringIO(binary)  # 错误！binary 是 bytes，不是 str
    return stream.read()
```

### 记得重置位置指针

```python
from io import StringIO

stream = StringIO()
stream.write("Content")

# 错误：写入后位置在末尾，read() 返回空字符串
content = stream.read()
print(f"Wrong: '{content}'")  # ''

# 正确：先 seek(0) 再读取
stream.seek(0)
content = stream.read()
print(f"Correct: '{content}'")  # 'Content'

# 或者使用 getvalue()（不受位置影响）
content = stream.getvalue()
print(f"Also correct: '{content}'")  # 'Content'
```

### 使用上下文管理器管理资源

```python
from io import StringIO, BytesIO

# 推荐：使用 with 语句
def recommended():
    with StringIO() as stream:
        stream.write("Hello")
        return stream.getvalue()

# 不推荐：手动管理
def not_recommended():
    stream = StringIO()
    try:
        stream.write("Hello")
        return stream.getvalue()
    finally:
        stream.close()

# 对于需要在函数外使用的流，确保调用者负责关闭
def create_stream():
    stream = BytesIO()
    stream.write(b"Data")
    stream.seek(0)
    return stream  # 调用者需要负责关闭

# 使用时
stream = create_stream()
try:
    data = stream.read()
finally:
    stream.close()
```

### 正确处理编码

```python
from io import BytesIO, TextIOWrapper

# 处理文本时始终指定编码
def safe_text_processing(binary_data, encoding="utf-8"):
    stream = BytesIO(binary_data)
    text_stream = TextIOWrapper(stream, encoding=encoding)
    return text_stream.read()

# 处理未知编码的数据
def detect_and_read(binary_data):
    # 尝试常见编码
    encodings = ["utf-8", "gbk", "latin-1"]

    for encoding in encodings:
        try:
            stream = BytesIO(binary_data)
            text_stream = TextIOWrapper(stream, encoding=encoding, errors="strict")
            return text_stream.read(), encoding
        except UnicodeDecodeError:
            continue

    # 最后使用 latin-1（总是成功，因为它接受任何字节）
    stream = BytesIO(binary_data)
    text_stream = TextIOWrapper(stream, encoding="latin-1")
    return text_stream.read(), "latin-1"
```

### 刷新缓冲区

```python
from io import BytesIO, TextIOWrapper

# TextIOWrapper 有自己的缓冲区，写入后需要刷新
def write_text_to_binary():
    binary_stream = BytesIO()
    text_stream = TextIOWrapper(binary_stream, encoding="utf-8")

    text_stream.write("Hello")

    # 错误：此时 binary_stream 可能是空的
    # print(binary_stream.getvalue())  # 可能是 b''

    # 正确：先刷新
    text_stream.flush()
    print(binary_stream.getvalue())  # b'Hello'

    # 或者使用 detach() 分离（会自动刷新）
    text_stream.write(" World")
    raw = text_stream.detach()
    print(raw.getvalue())  # b'Hello World'
```

### 使用 getbuffer() 进行零拷贝操作

```python
from io import BytesIO

def zero_copy_modification():
    # 对于大数据，使用 getbuffer() 避免复制
    buffer = BytesIO(b"A" * 1000000)  # 1MB 数据

    # 低效：复制整个缓冲区
    data = buffer.getvalue()
    # 修改 data...

    # 高效：获取内存视图，直接修改
    view = buffer.getbuffer()
    view[0:5] = b"HELLO"  # 零拷贝修改
    view.release()

    return buffer.getvalue()[:10]  # b'HELLOAAAAa'
```

## 常见陷阱

### 忘记重置位置指针

```python
from io import StringIO

stream = StringIO()
stream.write("Hello")

# 陷阱：直接读取返回空字符串
print(stream.read())  # '' - 空的！

# 解决：使用 seek(0) 或 getvalue()
stream.seek(0)
print(stream.read())  # 'Hello'
```

### 混淆 StringIO 和 BytesIO

```python
from io import StringIO, BytesIO

# 陷阱：类型不匹配
text_stream = StringIO()
# text_stream.write(b"bytes")  # TypeError!

binary_stream = BytesIO()
# binary_stream.write("string")  # TypeError!

# 解决：确保数据类型匹配
text_stream.write("string")
binary_stream.write(b"bytes")
```

### 关闭后继续使用

```python
from io import StringIO

stream = StringIO("Hello")
stream.close()

# 陷阱：关闭后无法读写
# stream.read()  # ValueError: I/O operation on closed file

# 解决：在关闭前获取所需数据
stream = StringIO("Hello")
data = stream.getvalue()  # 先获取数据
stream.close()
print(data)  # 'Hello'
```

### TextIOWrapper 缓冲问题

```python
from io import BytesIO, TextIOWrapper

binary = BytesIO()
text = TextIOWrapper(binary, encoding="utf-8")

text.write("Hello")

# 陷阱：数据还在 TextIOWrapper 的缓冲区中
print(binary.getvalue())  # b'' - 空的！

# 解决：刷新缓冲区
text.flush()
print(binary.getvalue())  # b'Hello'
```

### detach() 后继续使用

```python
from io import BytesIO, TextIOWrapper

binary = BytesIO(b"Hello")
text = TextIOWrapper(binary, encoding="utf-8")

# detach() 分离底层流
raw = text.detach()

# 陷阱：分离后 text 不可用
# text.read()  # ValueError: underlying buffer has been detached

# 解决：使用返回的原始流
raw.seek(0)
print(raw.read())  # b'Hello'
```

### seek() 的 whence 参数在 StringIO 中的限制

```python
from io import StringIO, BytesIO

text = StringIO("Hello")
binary = BytesIO(b"Hello")

# BytesIO 支持从当前位置偏移
binary.seek(2)
binary.seek(1, 1)  # 从当前位置向前 1
print(binary.tell())  # 3

# 陷阱：StringIO 不支持从当前位置的非零偏移
text.seek(2)
# text.seek(1, 1)  # 引发错误！

# 解决：StringIO 只能用 seek(pos, 0) 或 seek(0, 2)
text.seek(3, 0)  # 从开头偏移 3
text.seek(0, 2)  # 移动到末尾
```

### 大数据的内存问题

```python
from io import BytesIO

# 陷阱：BytesIO 将所有数据保存在内存中
def bad_large_file_handling():
    buffer = BytesIO()
    # 写入 1GB 数据会消耗 1GB 内存
    for _ in range(1024):
        buffer.write(b"X" * 1024 * 1024)  # 内存持续增长
    return buffer.getvalue()  # 又复制一份，内存翻倍

# 解决：对于大数据，考虑使用临时文件
import tempfile

def good_large_file_handling():
    # 使用临时文件，数据存储在磁盘上
    with tempfile.SpooledTemporaryFile(max_size=10*1024*1024) as f:
        for _ in range(1024):
            f.write(b"X" * 1024 * 1024)
        f.seek(0)
        # 分块读取处理
        while chunk := f.read(8192):
            pass  # 处理 chunk
```

## 性能考量

### 内存 vs 磁盘 I/O

```python
import time
from io import StringIO, BytesIO

# 内存流 vs 文件 I/O 性能比较
def benchmark_io():
    data = "x" * 10000
    iterations = 10000

    # 内存流
    start = time.perf_counter()
    for _ in range(iterations):
        stream = StringIO()
        stream.write(data)
        stream.seek(0)
        _ = stream.read()
    memory_time = time.perf_counter() - start

    # 文件 I/O
    import tempfile
    start = time.perf_counter()
    for _ in range(iterations):
        with tempfile.NamedTemporaryFile(mode="w+", delete=True) as f:
            f.write(data)
            f.seek(0)
            _ = f.read()
    file_time = time.perf_counter() - start

    print(f"内存流: {memory_time:.3f}s")
    print(f"文件I/O: {file_time:.3f}s")
    print(f"内存流快 {file_time/memory_time:.1f} 倍")

# benchmark_io()
# 内存流: 0.234s
# 文件I/O: 5.678s
# 内存流快 24.3 倍
```

### getvalue() vs read()

```python
from io import StringIO
import time

def compare_read_methods():
    data = "x" * 1000000
    iterations = 1000

    stream = StringIO(data)

    # read() 需要先 seek(0)
    start = time.perf_counter()
    for _ in range(iterations):
        stream.seek(0)
        _ = stream.read()
    read_time = time.perf_counter() - start

    # getvalue() 不需要 seek
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

### 缓冲区大小影响

```python
from io import BytesIO, BufferedReader
import time

def benchmark_buffer_size():
    data = b"x" * 10000000  # 10MB

    for buffer_size in [512, 4096, 8192, 65536]:
        stream = BytesIO(data)
        buffered = BufferedReader(stream, buffer_size=buffer_size)

        start = time.perf_counter()
        while buffered.read(1024):  # 每次读 1KB
            pass
        elapsed = time.perf_counter() - start

        print(f"Buffer {buffer_size:>6}: {elapsed:.4f}s")

# benchmark_buffer_size()
# Buffer    512: 0.0234s
# Buffer   4096: 0.0156s
# Buffer   8192: 0.0142s
# Buffer  65536: 0.0138s
```

### 避免频繁创建流对象

```python
from io import StringIO, BytesIO

# 低效：频繁创建新对象
def inefficient():
    results = []
    for i in range(10000):
        stream = StringIO()  # 每次循环创建新对象
        stream.write(str(i))
        results.append(stream.getvalue())
    return results

# 高效：重用对象
def efficient():
    results = []
    stream = StringIO()
    for i in range(10000):
        stream.seek(0)
        stream.truncate(0)  # 清空内容
        stream.write(str(i))
        results.append(stream.getvalue())
    stream.close()
    return results

# 或者使用更简单的方式（如果只是字符串拼接）
def simpler():
    return [str(i) for i in range(10000)]
```

## 实战场景

### 场景1：CSV 数据处理

```python
from io import StringIO
import csv

def parse_csv_string(csv_string):
    """解析 CSV 字符串"""
    stream = StringIO(csv_string)
    reader = csv.DictReader(stream)
    return list(reader)

def generate_csv_string(data, fieldnames):
    """生成 CSV 字符串"""
    stream = StringIO()
    writer = csv.DictWriter(stream, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)
    return stream.getvalue()

# 使用示例
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

### 场景2：HTTP 响应处理

```python
from io import BytesIO
import json

def create_json_response(data):
    """创建 JSON HTTP 响应体"""
    buffer = BytesIO()
    json_str = json.dumps(data, ensure_ascii=False)
    buffer.write(json_str.encode("utf-8"))
    buffer.seek(0)
    return buffer

def parse_multipart_data(boundary, data):
    """解析 multipart 表单数据（简化版）"""
    parts = {}
    boundary_bytes = f"--{boundary}".encode()

    stream = BytesIO(data)
    content = stream.read()

    for part in content.split(boundary_bytes):
        if not part or part == b"--\r\n":
            continue

        # 解析每个部分（简化处理）
        if b"\r\n\r\n" in part:
            headers, body = part.split(b"\r\n\r\n", 1)
            # 提取字段名
            if b'name="' in headers:
                name_start = headers.find(b'name="') + 6
                name_end = headers.find(b'"', name_start)
                name = headers[name_start:name_end].decode()
                parts[name] = body.rstrip(b"\r\n")

    return parts

# 使用示例
response = create_json_response({"status": "ok", "message": "成功"})
print(response.read())
```

### 场景3：图像处理

```python
from io import BytesIO

def image_to_bytes(image, format="PNG"):
    """将 PIL 图像转换为字节数据"""
    from PIL import Image

    buffer = BytesIO()
    image.save(buffer, format=format)
    return buffer.getvalue()

def bytes_to_image(image_bytes):
    """将字节数据转换为 PIL 图像"""
    from PIL import Image

    buffer = BytesIO(image_bytes)
    return Image.open(buffer)

def resize_image_bytes(image_bytes, size):
    """调整图像大小（不保存到磁盘）"""
    from PIL import Image

    # 从字节加载
    buffer = BytesIO(image_bytes)
    img = Image.open(buffer)

    # 调整大小
    img = img.resize(size, Image.Resampling.LANCZOS)

    # 保存到新的字节缓冲区
    output = BytesIO()
    img.save(output, format=img.format or "PNG")
    return output.getvalue()

# 使用示例（需要 PIL/Pillow）
# original = open("photo.jpg", "rb").read()
# resized = resize_image_bytes(original, (200, 200))
```

### 场景4：测试中模拟文件

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
        """使用 StringIO 模拟文件输入"""
        processor = FileProcessor()

        # 使用 StringIO 作为测试输入
        fake_file = StringIO("hello world")
        result = processor.process_file(fake_file)

        self.assertEqual(result, "HELLO WORLD")

    def test_read_config_with_mock(self):
        """使用 mock 模拟文件读取"""
        processor = FileProcessor()

        fake_config = "debug=true\nport=8080"

        with patch("builtins.open", mock_open(read_data=fake_config)):
            result = processor.read_config("config.txt")
            self.assertIn("debug=true", result)

    def test_binary_processing_with_bytesio(self):
        """使用 BytesIO 测试二进制处理"""
        fake_data = BytesIO(b"\x00\x01\x02\x03")

        # 模拟处理二进制数据的函数
        def process_binary(stream):
            return sum(stream.read())

        result = process_binary(fake_data)
        self.assertEqual(result, 6)  # 0+1+2+3

# 运行测试
# if __name__ == "__main__":
#     unittest.main()
```

### 场景5：日志捕获

```python
from io import StringIO
import logging
import sys

class LogCapture:
    """上下文管理器：捕获日志输出"""

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

        # 添加我们的 handler
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


# 使用示例
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

### 场景6：数据序列化和传输

```python
from io import BytesIO
import json
import gzip

def serialize_to_compressed_json(data):
    """序列化为压缩的 JSON 数据"""
    # 序列化为 JSON
    json_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")

    # 压缩
    compressed_buffer = BytesIO()
    with gzip.GzipFile(fileobj=compressed_buffer, mode="wb") as gz:
        gz.write(json_bytes)

    return compressed_buffer.getvalue()

def decompress_and_deserialize_json(compressed_bytes):
    """解压缩并反序列化 JSON 数据"""
    # 解压缩
    compressed_buffer = BytesIO(compressed_bytes)
    with gzip.GzipFile(fileobj=compressed_buffer, mode="rb") as gz:
        json_bytes = gz.read()

    # 反序列化
    return json.loads(json_bytes.decode("utf-8"))

# 使用示例
original_data = {
    "users": [{"name": f"User{i}", "score": i * 100} for i in range(1000)],
    "metadata": {"version": "1.0", "timestamp": "2024-01-01"}
}

compressed = serialize_to_compressed_json(original_data)
print(f"压缩后大小: {len(compressed)} bytes")

restored = decompress_and_deserialize_json(compressed)
print(f"还原数据: {len(restored['users'])} users")
```

## 面试要点

### Q1: StringIO 和 BytesIO 的区别是什么？

**答案**：
- `StringIO` 处理文本数据（`str` 类型），`BytesIO` 处理二进制数据（`bytes` 类型）
- `StringIO` 的 `seek()` 方法对 `whence=1` 和 `whence=2` 的支持有限
- `BytesIO` 提供 `getbuffer()` 方法返回内存视图，支持零拷贝操作
- 两者都支持 `getvalue()` 方法获取完整内容

```python
from io import StringIO, BytesIO

text_stream = StringIO("Hello")  # 处理 str
binary_stream = BytesIO(b"Hello")  # 处理 bytes
```

### Q2: 什么是文件对象协议（file-like object）？

**答案**：
文件对象协议是 Python 中的一种鸭子类型协议，任何实现了以下方法的对象都可以被当作文件使用：

- `read(size=-1)` - 读取数据
- `write(data)` - 写入数据
- `seek(offset, whence=0)` - 移动位置
- `tell()` - 获取当前位置
- `close()` - 关闭流
- `readable()` / `writable()` / `seekable()` - 能力查询

这使得 `StringIO`、`BytesIO` 可以在任何接受文件对象的地方使用。

### Q3: 如何在测试中模拟文件操作？

**答案**：

```python
from io import StringIO
import unittest

def process_file(file_obj):
    return file_obj.read().upper()

class TestFileProcessing(unittest.TestCase):
    def test_process_file(self):
        # 使用 StringIO 模拟文件
        fake_file = StringIO("test content")
        result = process_file(fake_file)
        self.assertEqual(result, "TEST CONTENT")
```

### Q4: TextIOWrapper 的作用是什么？

**答案**：
`TextIOWrapper` 是在二进制流之上提供文本接口的包装器，负责：
- 字符编码和解码
- 换行符转换
- 缓冲管理

```python
from io import BytesIO, TextIOWrapper

binary = BytesIO(b"\xe4\xb8\xad\xe6\x96\x87")
text = TextIOWrapper(binary, encoding="utf-8")
print(text.read())  # "中文"
```

### Q5: 使用内存流有什么性能优势？

**答案**：
- 无磁盘 I/O 开销，读写速度快 10-100 倍
- 无需系统调用，减少上下文切换
- 适合临时数据处理、测试模拟
- 但需注意内存占用，大数据应使用临时文件

### Q6: getvalue() 和 read() 有什么区别？

**答案**：

| 特性 | `getvalue()` | `read()` |
|------|--------------|----------|
| 位置指针 | 不受影响 | 从当前位置读取 |
| 返回完整内容 | 总是返回完整内容 | 只返回从当前位置到末尾的内容 |
| 需要 seek | 不需要 | 通常需要先 `seek(0)` |

```python
from io import StringIO

s = StringIO("Hello")
s.read(2)  # 读取 "He"，位置指针移动到 2

print(s.read())      # "llo" - 从位置 2 读到末尾
print(s.getvalue())  # "Hello" - 获取完整内容
```

### Q7: 如何处理编码错误？

**答案**：
使用 `TextIOWrapper` 的 `errors` 参数：

```python
from io import BytesIO, TextIOWrapper

data = b"Hello \xff World"  # 包含无效 UTF-8 字节

# strict - 抛出异常（默认）
# ignore - 忽略无效字符
# replace - 用 U+FFFD 替换
# backslashreplace - 用转义序列替换

stream = TextIOWrapper(
    BytesIO(data),
    encoding="utf-8",
    errors="replace"
)
print(stream.read())  # "Hello \ufffd World"
```

## 延伸阅读

### 官方文档

- [io - Python 官方文档](https://docs.python.org/3/library/io.html)
- [Python I/O 概述](https://docs.python.org/3/library/io.html#overview)
- [内置 open() 函数](https://docs.python.org/3/library/functions.html#open)

### 相关标准库

- [tempfile - 临时文件和目录](https://docs.python.org/3/library/tempfile.html)
- [mmap - 内存映射文件](https://docs.python.org/3/library/mmap.html)
- [struct - 二进制数据结构](https://docs.python.org/3/library/struct.html)

### PEP 文档

- [PEP 3116 - New I/O](https://peps.python.org/pep-3116/) - Python 3 新 I/O 系统设计
- [PEP 578 - Python Runtime Audit Hooks](https://peps.python.org/pep-0578/) - 运行时审计钩子

### 推荐文章

- [Python io Module: A Complete Guide](https://realpython.com/python-io-module/)
- [Understanding Python BytesIO](https://www.geeksforgeeks.org/stringio-and-bytesio-in-python/)
- [Working with Binary Data in Python](https://pymotw.com/3/io/)

### 相关模块

- `pathlib` - 面向对象的路径处理
- `os` - 操作系统接口
- `codecs` - 编码解码器注册和基类
- `gzip`, `bz2`, `lzma` - 压缩文件操作
