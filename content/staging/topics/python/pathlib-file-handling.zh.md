---
title: Python 文件处理与 pathlib
description: 掌握 Python 文件操作：pathlib、文件读写、os 与 shutil
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - pathlib
  - 文件操作
  - os
status: imported
origin: old/src/content/docs/python/pathlib-file-handling.zh.md
divergence: 0.304
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 16
  lastUpdated: 2026-01-07
---

Python 提供了多种方式来处理文件和目录。本文将深入介绍现代化的 `pathlib` 模块以及传统的文件操作方法。

## pathlib 路径处理

`pathlib` 是 Python 3.4+ 引入的面向对象的文件系统路径库，提供了更加直观和现代化的 API。

### 基础路径操作

```python
from pathlib import Path

# 创建路径对象
current_dir = Path.cwd()  # 当前工作目录
home_dir = Path.home()    # 用户主目录
file_path = Path('data/file.txt')
absolute_path = Path('/home/user/documents/report.pdf')

print(f"当前目录: {current_dir}")
print(f"主目录: {home_dir}")
print(f"文件路径: {file_path}")
print(f"绝对路径: {absolute_path}")
```

### 路径组合与拆分

```python
from pathlib import Path

# 路径组合 - 使用 / 运算符
base_dir = Path('/home/user')
project_dir = base_dir / 'projects' / 'myapp'
config_file = project_dir / 'config' / 'settings.json'

print(f"项目目录: {project_dir}")
print(f"配置文件: {config_file}")

# 路径拆分
print(f"父目录: {config_file.parent}")
print(f"文件名: {config_file.name}")
print(f"文件扩展名: {config_file.suffix}")
print(f"不含扩展名的文件名: {config_file.stem}")
print(f"所有父目录: {list(config_file.parents)}")

# 获取路径的各个部分
print(f"路径部分: {config_file.parts}")
# 输出: ('/', 'home', 'user', 'projects', 'myapp', 'config', 'settings.json')
```

### 路径属性和方法

```python
from pathlib import Path

path = Path('/home/user/documents/report.docx')

# 路径转换
print(f"绝对路径: {path.absolute()}")
print(f"解析路径: {path.resolve()}")  # 解析符号链接

# 路径判断
print(f"是否存在: {path.exists()}")
print(f"是否为文件: {path.is_file()}")
print(f"是否为目录: {path.is_dir()}")
print(f"是否为符号链接: {path.is_symlink()}")
print(f"是否为绝对路径: {path.is_absolute()}")

# 修改路径
new_name = path.with_name('new_report.docx')
new_suffix = path.with_suffix('.pdf')
new_stem = path.with_stem('final_report')

print(f"修改文件名: {new_name}")
print(f"修改扩展名: {new_suffix}")
print(f"修改主文件名: {new_stem}")
```

### 目录遍历

```python
from pathlib import Path

# 遍历目录中的文件
project_dir = Path('/home/user/project')

# 列出当前目录的所有项
for item in project_dir.iterdir():
    print(item)

# 使用 glob 模式匹配
python_files = list(project_dir.glob('*.py'))
print(f"Python 文件: {python_files}")

# 递归搜索
all_python_files = list(project_dir.rglob('*.py'))
print(f"所有 Python 文件（递归）: {all_python_files}")

# 按条件筛选
text_files = [f for f in project_dir.glob('**/*.txt') if f.is_file()]
directories = [d for d in project_dir.iterdir() if d.is_dir()]

print(f"文本文件: {text_files}")
print(f"子目录: {directories}")
```

### 高级路径操作示例

```python
from pathlib import Path
import os

# 创建目录
new_dir = Path('data/processed/results')
new_dir.mkdir(parents=True, exist_ok=True)  # 创建多级目录

# 删除文件
file_to_delete = Path('temp/old_file.txt')
if file_to_delete.exists():
    file_to_delete.unlink()  # 删除文件

# 删除空目录
empty_dir = Path('temp/empty')
if empty_dir.exists() and empty_dir.is_dir():
    empty_dir.rmdir()  # 只能删除空目录

# 重命名/移动文件
old_path = Path('data/old_name.txt')
new_path = Path('data/new_name.txt')
if old_path.exists():
    old_path.rename(new_path)

# 获取文件信息
file_path = Path('data/file.txt')
if file_path.exists():
    stats = file_path.stat()
    print(f"文件大小: {stats.st_size} 字节")
    print(f"修改时间: {stats.st_mtime}")
    print(f"创建时间: {stats.st_ctime}")
```

## 文件读写模式

Python 提供了多种文件打开模式，用于不同的读写需求。

### 文件打开模式详解

```python
# 模式说明：
# 'r'  - 只读模式（默认）
# 'w'  - 写入模式（覆盖）
# 'a'  - 追加模式
# 'x'  - 独占创建模式
# 'b'  - 二进制模式
# 't'  - 文本模式（默认）
# '+'  - 读写模式

# 常见模式组合：
modes = {
    'r': '只读文本',
    'rb': '只读二进制',
    'r+': '读写文本',
    'w': '写入文本（覆盖）',
    'wb': '写入二进制（覆盖）',
    'w+': '读写文本（覆盖）',
    'a': '追加文本',
    'ab': '追加二进制',
    'a+': '读写文本（追加）',
    'x': '独占创建文本',
    'xb': '独占创建二进制'
}
```

### 文本文件读取

```python
from pathlib import Path

# 方法 1: 使用 pathlib 读取
file_path = Path('data/sample.txt')

# 读取全部内容
content = file_path.read_text(encoding='utf-8')
print(content)

# 方法 2: 使用 open() 函数
with open('data/sample.txt', 'r', encoding='utf-8') as file:
    content = file.read()
    print(content)

# 按行读取
with open('data/sample.txt', 'r', encoding='utf-8') as file:
    lines = file.readlines()  # 返回列表，包含换行符
    for line in lines:
        print(line.strip())

# 逐行迭代（推荐，内存效率高）
with open('data/sample.txt', 'r', encoding='utf-8') as file:
    for line in file:
        print(line.strip())

# 读取指定字节数
with open('data/sample.txt', 'r', encoding='utf-8') as file:
    chunk = file.read(100)  # 读取前 100 个字符
    print(chunk)
```

### 文本文件写入

```python
from pathlib import Path

# 方法 1: 使用 pathlib 写入
file_path = Path('data/output.txt')
file_path.write_text('Hello, World!\n', encoding='utf-8')

# 方法 2: 使用 open() 写入（覆盖）
with open('data/output.txt', 'w', encoding='utf-8') as file:
    file.write('第一行\n')
    file.write('第二行\n')
    file.writelines(['第三行\n', '第四行\n'])

# 追加模式
with open('data/output.txt', 'a', encoding='utf-8') as file:
    file.write('追加的内容\n')

# 格式化写入
data = {'name': 'Alice', 'age': 30, 'city': '北京'}
with open('data/output.txt', 'w', encoding='utf-8') as file:
    for key, value in data.items():
        file.write(f'{key}: {value}\n')

# 使用 print 函数写入文件
with open('data/output.txt', 'w', encoding='utf-8') as file:
    print('使用 print 写入', file=file)
    print('第二行内容', file=file)
```

### 二进制文件操作

```python
from pathlib import Path

# 读取二进制文件
image_path = Path('images/photo.jpg')
binary_data = image_path.read_bytes()
print(f"文件大小: {len(binary_data)} 字节")

# 写入二进制文件
output_path = Path('images/copy.jpg')
output_path.write_bytes(binary_data)

# 使用 open() 处理二进制文件
with open('images/photo.jpg', 'rb') as file:
    # 读取文件头
    header = file.read(10)
    print(f"文件头: {header}")

    # 移动文件指针
    file.seek(0)  # 回到文件开头

    # 读取全部内容
    content = file.read()

# 复制二进制文件
with open('source.bin', 'rb') as src:
    with open('destination.bin', 'wb') as dst:
        dst.write(src.read())

# 分块读取大文件
def copy_large_file(src_path, dst_path, chunk_size=1024*1024):
    """分块复制大文件（1MB 块）"""
    with open(src_path, 'rb') as src:
        with open(dst_path, 'wb') as dst:
            while True:
                chunk = src.read(chunk_size)
                if not chunk:
                    break
                dst.write(chunk)

# copy_large_file('large_video.mp4', 'backup_video.mp4')
```

### CSV 和 JSON 文件处理

```python
import csv
import json
from pathlib import Path

# CSV 文件读取
with open('data/users.csv', 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    header = next(reader)  # 读取表头
    for row in reader:
        print(row)

# CSV 文件写入
data = [
    ['姓名', '年龄', '城市'],
    ['张三', '25', '北京'],
    ['李四', '30', '上海'],
    ['王五', '28', '广州']
]

with open('data/output.csv', 'w', encoding='utf-8', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(data)

# 使用 DictReader 和 DictWriter
with open('data/users.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(f"姓名: {row['姓名']}, 年龄: {row['年龄']}")

users = [
    {'姓名': '张三', '年龄': 25, '城市': '北京'},
    {'姓名': '李四', '年龄': 30, '城市': '上海'}
]

with open('data/users_dict.csv', 'w', encoding='utf-8', newline='') as file:
    fieldnames = ['姓名', '年龄', '城市']
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(users)

# JSON 文件操作
data = {
    'users': [
        {'name': 'Alice', 'age': 30},
        {'name': 'Bob', 'age': 25}
    ],
    'total': 2
}

# 写入 JSON
with open('data/users.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False, indent=2)

# 读取 JSON
with open('data/users.json', 'r', encoding='utf-8') as file:
    loaded_data = json.load(file)
    print(loaded_data)

# 使用 pathlib 处理 JSON
json_path = Path('data/config.json')
json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
loaded = json.loads(json_path.read_text(encoding='utf-8'))
```

## os 与 shutil 模块

虽然 `pathlib` 提供了现代化的接口，但 `os` 和 `shutil` 模块在某些场景下仍然很有用。

### os 模块常用操作

```python
import os
from pathlib import Path

# 目录操作
print(f"当前工作目录: {os.getcwd()}")
os.chdir('/home/user/project')  # 切换工作目录

# 环境变量
print(f"PATH: {os.environ.get('PATH')}")
print(f"HOME: {os.environ.get('HOME')}")
os.environ['MY_VAR'] = 'my_value'  # 设置环境变量

# 路径操作（使用 os.path）
path = '/home/user/documents/file.txt'
print(f"目录名: {os.path.dirname(path)}")
print(f"基本名: {os.path.basename(path)}")
print(f"分割路径: {os.path.split(path)}")
print(f"分割扩展名: {os.path.splitext(path)}")
print(f"连接路径: {os.path.join('/home', 'user', 'file.txt')}")

# 文件和目录检查
print(f"文件存在: {os.path.exists(path)}")
print(f"是文件: {os.path.isfile(path)}")
print(f"是目录: {os.path.isdir(path)}")
print(f"绝对路径: {os.path.abspath('relative/path.txt')}")

# 目录列表
files = os.listdir('/home/user')
print(f"目录内容: {files}")

# 创建和删除目录
os.mkdir('new_directory')  # 创建单级目录
os.makedirs('path/to/nested/directory', exist_ok=True)  # 创建多级目录
os.rmdir('empty_directory')  # 删除空目录
os.removedirs('path/to/empty/nested')  # 递归删除空目录

# 删除文件
os.remove('file_to_delete.txt')
os.unlink('another_file.txt')  # 同 remove

# 重命名
os.rename('old_name.txt', 'new_name.txt')

# 获取文件信息
stat_info = os.stat('file.txt')
print(f"文件大小: {stat_info.st_size} 字节")
print(f"修改时间: {stat_info.st_mtime}")

# 遍历目录树
for root, dirs, files in os.walk('/home/user/project'):
    print(f"目录: {root}")
    print(f"子目录: {dirs}")
    print(f"文件: {files}")
    for file in files:
        full_path = os.path.join(root, file)
        print(f"  {full_path}")
```

### shutil 模块高级文件操作

```python
import shutil
from pathlib import Path

# 复制文件
shutil.copy('source.txt', 'destination.txt')  # 复制文件（不保留元数据）
shutil.copy2('source.txt', 'destination.txt')  # 复制文件（保留元数据）
shutil.copyfile('source.txt', 'destination.txt')  # 仅复制内容

# 复制目录
shutil.copytree('source_dir', 'destination_dir')  # 递归复制整个目录树

# 复制目录（忽略某些文件）
shutil.copytree(
    'source_dir',
    'destination_dir',
    ignore=shutil.ignore_patterns('*.pyc', '*.tmp', '__pycache__')
)

# 移动文件或目录
shutil.move('source.txt', 'destination.txt')
shutil.move('source_dir', 'destination_dir')

# 删除目录树
shutil.rmtree('directory_to_delete')  # 递归删除目录及其内容

# 创建归档文件
shutil.make_archive(
    'backup',           # 归档文件名（不含扩展名）
    'zip',              # 格式：'zip', 'tar', 'gztar', 'bztar', 'xztar'
    'directory_to_archive'
)

# 解压归档文件
shutil.unpack_archive('backup.zip', 'extracted_folder')

# 获取磁盘使用情况
total, used, free = shutil.disk_usage('/')
print(f"总空间: {total // (2**30)} GB")
print(f"已使用: {used // (2**30)} GB")
print(f"可用空间: {free // (2**30)} GB")

# 查找可执行文件
python_path = shutil.which('python3')
print(f"Python 路径: {python_path}")

# 高级复制示例
def backup_with_metadata(src, dst):
    """复制文件并保留所有元数据"""
    shutil.copy2(src, dst)
    shutil.copystat(src, dst)  # 复制权限和时间戳

def sync_directories(src, dst):
    """同步两个目录"""
    if Path(dst).exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
```

### 文件权限和所有者

```python
import os
import stat
from pathlib import Path

file_path = 'example.txt'

# 使用 os 模块
# 更改文件权限（Unix/Linux）
os.chmod(file_path, 0o644)  # rw-r--r--
os.chmod(file_path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

# 使用 pathlib
path = Path(file_path)
path.chmod(0o755)  # rwxr-xr-x

# 检查权限
mode = os.stat(file_path).st_mode
is_readable = bool(mode & stat.S_IRUSR)
is_writable = bool(mode & stat.S_IWUSR)
is_executable = bool(mode & stat.S_IXUSR)

print(f"可读: {is_readable}")
print(f"可写: {is_writable}")
print(f"可执行: {is_executable}")

# 更改所有者（需要管理员权限）
# os.chown(file_path, uid, gid)
```

## 临时文件处理

`tempfile` 模块提供了创建临时文件和目录的功能，适用于需要临时存储数据的场景。

### 基本临时文件操作

```python
import tempfile
import os

# 创建临时文件（自动删除）
with tempfile.TemporaryFile(mode='w+', encoding='utf-8') as tmp:
    tmp.write('临时数据\n')
    tmp.write('第二行\n')

    # 回到文件开头读取
    tmp.seek(0)
    content = tmp.read()
    print(content)
# 文件在退出 with 块后自动删除

# 创建命名临时文件
with tempfile.NamedTemporaryFile(mode='w+', encoding='utf-8', delete=False) as tmp:
    print(f"临时文件路径: {tmp.name}")
    tmp.write('需要保留的临时数据\n')
    temp_path = tmp.name

# 手动删除临时文件
os.unlink(temp_path)

# 创建临时目录
with tempfile.TemporaryDirectory() as tmp_dir:
    print(f"临时目录: {tmp_dir}")

    # 在临时目录中创建文件
    temp_file = os.path.join(tmp_dir, 'temp_file.txt')
    with open(temp_file, 'w') as f:
        f.write('临时文件内容\n')

    # 执行其他操作...
# 临时目录及其内容在退出时自动删除
```

### 高级临时文件用法

```python
import tempfile
from pathlib import Path

# 获取临时目录路径
temp_dir = tempfile.gettempdir()
print(f"系统临时目录: {temp_dir}")

# 生成临时文件名（不创建文件）
temp_name = tempfile.mktemp()  # 不推荐使用，存在安全隐患
print(f"临时文件名: {temp_name}")

# 安全创建临时文件（返回文件描述符和路径）
fd, temp_path = tempfile.mkstemp(suffix='.txt', prefix='myapp_', dir='/tmp')
try:
    # 使用文件描述符写入
    os.write(fd, b'Binary data\n')
    os.close(fd)

    # 使用路径读取
    with open(temp_path, 'r') as f:
        print(f.read())
finally:
    os.unlink(temp_path)  # 清理临时文件

# 创建临时目录（返回路径）
temp_dir = tempfile.mkdtemp(suffix='_data', prefix='myapp_')
try:
    print(f"临时目录: {temp_dir}")
    # 在目录中进行操作...
finally:
    import shutil
    shutil.rmtree(temp_dir)  # 清理临时目录

# 使用 SpooledTemporaryFile（内存/磁盘混合）
with tempfile.SpooledTemporaryFile(max_size=1024, mode='w+', encoding='utf-8') as tmp:
    # 小于 max_size 时存储在内存中
    tmp.write('小数据' * 100)

    # 超过 max_size 时自动切换到磁盘
    tmp.write('大数据' * 1000)

    tmp.seek(0)
    print(tmp.read()[:50])

# 实用示例：处理上传文件
def process_uploaded_file(file_data):
    """处理上传的文件数据"""
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.bin', delete=False) as tmp:
        tmp.write(file_data)
        temp_path = tmp.name

    try:
        # 处理文件
        with open(temp_path, 'rb') as f:
            # 进行处理操作...
            processed_data = f.read()
        return processed_data
    finally:
        os.unlink(temp_path)
```

## io 模块

`io` 模块提供了核心的 I/O 功能，包括文件流、字节流和字符串流。

### StringIO 和 BytesIO

```python
from io import StringIO, BytesIO

# StringIO - 内存中的文本流
string_buffer = StringIO()
string_buffer.write('第一行\n')
string_buffer.write('第二行\n')
string_buffer.write('第三行\n')

# 获取内容
content = string_buffer.getvalue()
print(content)

# 从字符串创建
input_string = StringIO('初始内容\n更多内容\n')
for line in input_string:
    print(line.strip())

# StringIO 作为文件对象
import csv
output = StringIO()
writer = csv.writer(output)
writer.writerow(['姓名', '年龄'])
writer.writerow(['张三', 25])
writer.writerow(['李四', 30])

csv_content = output.getvalue()
print(csv_content)

# BytesIO - 内存中的二进制流
byte_buffer = BytesIO()
byte_buffer.write(b'Binary data\n')
byte_buffer.write(b'More binary data\n')

# 获取内容
binary_content = byte_buffer.getvalue()
print(f"二进制数据: {binary_content}")

# 从字节创建
input_bytes = BytesIO(b'\x00\x01\x02\x03')
data = input_bytes.read()
print(f"读取的字节: {data.hex()}")

# 使用 BytesIO 处理图像
from PIL import Image
import io

def resize_image_in_memory(image_data, size=(800, 600)):
    """在内存中调整图像大小"""
    input_buffer = BytesIO(image_data)
    img = Image.open(input_buffer)

    img_resized = img.resize(size)

    output_buffer = BytesIO()
    img_resized.save(output_buffer, format='JPEG')
    return output_buffer.getvalue()
```

### 文本流包装器

```python
from io import TextIOWrapper, BytesIO
import sys

# 包装二进制流为文本流
binary_stream = BytesIO(b'Hello\nWorld\n')
text_stream = TextIOWrapper(binary_stream, encoding='utf-8')

for line in text_stream:
    print(line.strip())

# 更改标准输出编码
# sys.stdout = TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 缓冲包装
from io import BufferedReader, FileIO

# 打开二进制文件并添加缓冲
raw = FileIO('data.bin', 'rb')
buffered = BufferedReader(raw, buffer_size=8192)
data = buffered.read(100)
buffered.close()
```

### 高级 I/O 操作

```python
import io

# 文件指针操作
with open('data.txt', 'r+', encoding='utf-8') as f:
    # 获取当前位置
    pos = f.tell()
    print(f"当前位置: {pos}")

    # 移动到指定位置
    f.seek(0)  # 移动到开头
    f.seek(0, io.SEEK_END)  # 移动到末尾
    f.seek(-10, io.SEEK_END)  # 从末尾向前 10 个字节

    # 读取当前位置的数据
    data = f.read(10)

# 检查流是否可读/可写/可定位
def check_stream_capabilities(stream):
    print(f"可读: {stream.readable()}")
    print(f"可写: {stream.writable()}")
    print(f"可定位: {stream.seekable()}")
    print(f"是否已关闭: {stream.closed}")

with open('test.txt', 'r+') as f:
    check_stream_capabilities(f)

# 刷新缓冲区
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write('重要数据\n')
    f.flush()  # 立即写入磁盘，不等待缓冲区满

# 截断文件
with open('file.txt', 'r+', encoding='utf-8') as f:
    f.truncate(100)  # 截断到 100 字节

# 使用上下文管理器的优势
class FileManager:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file:
            self.file.close()

with FileManager('test.txt', 'w') as f:
    f.write('使用自定义上下文管理器\n')
```

## 最佳实践

### 使用上下文管理器

```python
from pathlib import Path

# 推荐：使用 with 语句
with open('file.txt', 'r', encoding='utf-8') as f:
    content = f.read()
# 文件自动关闭，即使发生异常

# 不推荐：手动关闭
f = open('file.txt', 'r', encoding='utf-8')
try:
    content = f.read()
finally:
    f.close()
```

### 明确指定编码

```python
# 推荐：明确指定 UTF-8 编码
with open('file.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# 不推荐：使用默认编码（可能因平台而异）
with open('file.txt', 'r') as f:
    content = f.read()
```

### 处理大文件

```python
from pathlib import Path

# 推荐：逐行处理大文件
def process_large_file(file_path):
    """内存高效的大文件处理"""
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            # 处理每一行
            process_line(line.strip())

# 推荐：分块读取大文件
def copy_large_binary_file(src, dst, chunk_size=1024*1024):
    """分块复制大文件（1MB 块）"""
    with open(src, 'rb') as src_file:
        with open(dst, 'wb') as dst_file:
            while True:
                chunk = src_file.read(chunk_size)
                if not chunk:
                    break
                dst_file.write(chunk)

# 不推荐：一次性读取大文件
def bad_process_large_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()  # 可能导致内存不足
```

### 异常处理

```python
from pathlib import Path
import errno

def safe_read_file(file_path):
    """安全读取文件，带完整错误处理"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"文件不存在: {file_path}")
    except PermissionError:
        print(f"没有权限读取文件: {file_path}")
    except UnicodeDecodeError:
        print(f"文件编码错误: {file_path}")
    except IOError as e:
        if e.errno == errno.ENOSPC:
            print("磁盘空间不足")
        else:
            print(f"I/O 错误: {e}")
    except Exception as e:
        print(f"未知错误: {e}")
    return None

# 检查文件是否存在后再操作
file_path = Path('data.txt')
if file_path.exists() and file_path.is_file():
    content = file_path.read_text(encoding='utf-8')
else:
    print("文件不存在")
```

### 使用 pathlib 而非字符串拼接

```python
from pathlib import Path
import os

# 推荐：使用 pathlib
base_dir = Path('/home/user')
project_dir = base_dir / 'projects' / 'myapp'
config_file = project_dir / 'config.json'

# 不推荐：字符串拼接（不跨平台）
config_file = '/home/user/projects/myapp/config.json'

# 不推荐：os.path.join（较为繁琐）
config_file = os.path.join('/home/user', 'projects', 'myapp', 'config.json')
```

### 原子性写入

```python
import tempfile
import shutil
from pathlib import Path

def atomic_write(file_path, content):
    """原子性写入文件（避免写入中断导致文件损坏）"""
    file_path = Path(file_path)

    # 写入临时文件
    temp_fd, temp_path = tempfile.mkstemp(
        dir=file_path.parent,
        prefix=f'.{file_path.name}.'
    )

    try:
        with open(temp_fd, 'w', encoding='utf-8') as f:
            f.write(content)

        # 原子性重命名
        shutil.move(temp_path, file_path)
    except:
        # 清理临时文件
        Path(temp_path).unlink(missing_ok=True)
        raise

# 使用示例
atomic_write('important_data.json', '{"key": "value"}')
```

### 完整的文件处理示例

```python
from pathlib import Path
import json
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileHandler:
    """文件处理工具类"""

    @staticmethod
    def ensure_directory(path):
        """确保目录存在"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def safe_read_json(file_path, default=None):
        """安全读取 JSON 文件"""
        try:
            path = Path(file_path)
            if not path.exists():
                logger.warning(f"文件不存在: {file_path}")
                return default

            content = path.read_text(encoding='utf-8')
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON 解析错误: {e}")
            return default
        except Exception as e:
            logger.error(f"读取文件失败: {e}")
            return default

    @staticmethod
    def safe_write_json(file_path, data, indent=2):
        """安全写入 JSON 文件"""
        try:
            path = Path(file_path)
            FileHandler.ensure_directory(path.parent)

            content = json.dumps(data, ensure_ascii=False, indent=indent)
            path.write_text(content, encoding='utf-8')
            logger.info(f"成功写入文件: {file_path}")
            return True
        except Exception as e:
            logger.error(f"写入文件失败: {e}")
            return False

    @staticmethod
    def backup_file(file_path, backup_suffix='.bak'):
        """备份文件"""
        try:
            path = Path(file_path)
            if not path.exists():
                return False

            backup_path = path.with_suffix(path.suffix + backup_suffix)
            shutil.copy2(path, backup_path)
            logger.info(f"已创建备份: {backup_path}")
            return True
        except Exception as e:
            logger.error(f"备份失败: {e}")
            return False

# 使用示例
handler = FileHandler()

# 读取配置
config = handler.safe_read_json('config.json', default={'version': '1.0'})

# 写入数据
data = {'users': [{'name': 'Alice', 'age': 30}]}
handler.safe_write_json('data/users.json', data)

# 备份重要文件
handler.backup_file('important.json')
```

## 总结

本文介绍了 Python 中的文件处理技术：

1. **pathlib**：现代化的面向对象路径操作库，推荐优先使用
2. **文件读写**：理解不同的打开模式和编码处理
3. **os 和 shutil**：传统但功能强大的文件系统操作
4. **tempfile**：安全处理临时文件和目录
5. **io 模块**：底层 I/O 操作和内存流处理

关键要点：
- 始终使用 `with` 语句确保文件正确关闭
- 明确指定文件编码，避免平台差异
- 使用 `pathlib` 提高代码可读性和跨平台兼容性
- 处理大文件时注意内存效率
- 做好异常处理，确保程序健壮性

掌握这些技术将帮助你高效、安全地处理各种文件操作任务。
