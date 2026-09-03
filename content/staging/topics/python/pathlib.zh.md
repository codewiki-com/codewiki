---
title: pathlib路径处理
description: Python pathlib模块完全指南，面向对象的文件系统路径操作
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - pathlib
  - 文件路径
  - 文件系统
status: imported
origin: old/src/content/docs/python/pathlib.zh.md
divergence: 0.288
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 16
  lastUpdated: 2026-01-07
---

`pathlib` 是 Python 3.4 引入的标准库模块，提供了面向对象的文件系统路径操作方式。与传统的 `os.path` 模块相比，`pathlib` 将路径表示为对象而非字符串，使代码更加清晰、易读且跨平台兼容。

## 为什么使用 pathlib

在 `pathlib` 出现之前，Python 开发者需要使用 `os.path` 模块处理文件路径：

```python
import os

# 传统方式：使用 os.path
path = os.path.join('documents', 'work', 'report.txt')
dirname = os.path.dirname(path)
filename = os.path.basename(path)
exists = os.path.exists(path)
```

使用 `pathlib` 后，同样的操作变得更加直观：

```python
from pathlib import Path

# 现代方式：使用 pathlib
path = Path('documents') / 'work' / 'report.txt'
dirname = path.parent
filename = path.name
exists = path.exists()
```

`pathlib` 的主要优势包括：

- **面向对象**：路径是对象，拥有属性和方法
- **运算符重载**：使用 `/` 运算符拼接路径，语法直观
- **跨平台兼容**：自动处理不同操作系统的路径分隔符
- **功能集成**：将文件操作（读写、创建、删除）集成到路径对象中

## Path 对象基础

### 创建 Path 对象

```python
from pathlib import Path

# 创建当前目录的 Path 对象
current = Path('.')

# 创建指定路径的 Path 对象
file_path = Path('/home/user/documents/file.txt')

# 使用多个路径片段
path = Path('home', 'user', 'documents')

# 获取当前工作目录
cwd = Path.cwd()
print(cwd)  # /home/user/project

# 获取用户主目录
home = Path.home()
print(home)  # /home/user
```

### Path 类的层次结构

`pathlib` 模块提供了多个路径类：

| 类名 | 说明 |
|------|------|
| `PurePath` | 纯路径基类，不进行实际文件系统操作 |
| `PurePosixPath` | Unix 风格的纯路径 |
| `PureWindowsPath` | Windows 风格的纯路径 |
| `Path` | 具体路径类，支持实际文件系统操作 |
| `PosixPath` | Unix 系统的具体路径 |
| `WindowsPath` | Windows 系统的具体路径 |

通常情况下，直接使用 `Path` 类即可，它会根据当前操作系统自动选择合适的实现。

```python
from pathlib import Path

# 在 Linux/macOS 上返回 PosixPath
# 在 Windows 上返回 WindowsPath
p = Path('example.txt')
print(type(p))  # <class 'pathlib.PosixPath'>
```

## 路径操作

### 路径拼接

使用 `/` 运算符可以直观地拼接路径：

```python
from pathlib import Path

base = Path('/home/user')

# 使用 / 运算符拼接
documents = base / 'documents'
print(documents)  # /home/user/documents

# 链式拼接
file_path = base / 'documents' / 'work' / 'report.txt'
print(file_path)  # /home/user/documents/work/report.txt

# 也可以使用 joinpath 方法
joined = base.joinpath('documents', 'report.txt')
print(joined)  # /home/user/documents/report.txt
```

### 路径属性

Path 对象提供了丰富的属性来访问路径的各个部分：

```python
from pathlib import Path

path = Path('/home/user/documents/report.txt')

# 获取文件名（包含扩展名）
print(path.name)  # report.txt

# 获取文件名（不包含扩展名）
print(path.stem)  # report

# 获取文件扩展名
print(path.suffix)  # .txt

# 获取所有扩展名（对于 .tar.gz 这类文件有用）
archive = Path('data.tar.gz')
print(archive.suffixes)  # ['.tar', '.gz']

# 获取父目录
print(path.parent)  # /home/user/documents

# 获取所有父目录
print(list(path.parents))
# [PosixPath('/home/user/documents'),
#  PosixPath('/home/user'),
#  PosixPath('/home'),
#  PosixPath('/')]

# 获取路径各部分
print(path.parts)  # ('/', 'home', 'user', 'documents', 'report.txt')

# 获取根目录
print(path.root)  # /

# 获取锚点（驱动器 + 根目录）
print(path.anchor)  # /

# Windows 路径示例
win_path = Path('C:/Users/Admin/file.txt')
print(win_path.drive)  # C: (仅 Windows 有意义)
```

### 修改路径

```python
from pathlib import Path

path = Path('/home/user/report.txt')

# 更改文件名
new_path = path.with_name('summary.txt')
print(new_path)  # /home/user/summary.txt

# 更改扩展名
pdf_path = path.with_suffix('.pdf')
print(pdf_path)  # /home/user/report.pdf

# 更改主文件名（保留扩展名）
renamed = path.with_stem('analysis')
print(renamed)  # /home/user/analysis.txt

# 移除扩展名
no_ext = path.with_suffix('')
print(no_ext)  # /home/user/report
```

### 路径解析

```python
from pathlib import Path

# 解析为绝对路径
relative = Path('documents/file.txt')
absolute = relative.resolve()
print(absolute)  # /home/user/project/documents/file.txt

# 展开用户目录 ~
user_path = Path('~/documents')
expanded = user_path.expanduser()
print(expanded)  # /home/user/documents

# 计算相对路径
path1 = Path('/home/user/documents/work')
path2 = Path('/home/user')
relative = path1.relative_to(path2)
print(relative)  # documents/work

# 检查是否为相对路径
print(path1.is_relative_to(path2))  # True
print(path1.is_relative_to('/var'))  # False
```

## 路径判断与比较

### 路径状态检查

```python
from pathlib import Path

path = Path('/home/user/documents')

# 检查路径是否存在
print(path.exists())  # True/False

# 检查是否为文件
print(path.is_file())  # False

# 检查是否为目录
print(path.is_dir())  # True

# 检查是否为符号链接
print(path.is_symlink())  # False

# 检查是否为绝对路径
print(path.is_absolute())  # True

# 检查是否为挂载点
print(path.is_mount())  # False

# 检查是否为套接字
print(path.is_socket())  # False

# 检查是否为块设备
print(path.is_block_device())  # False

# 检查是否为字符设备
print(path.is_char_device())  # False

# 检查是否为 FIFO
print(path.is_fifo())  # False
```

### 路径比较

Path 对象是可哈希的，可以用于集合和字典键。路径比较遵循操作系统的大小写规则：

```python
from pathlib import Path, PurePosixPath, PureWindowsPath

# POSIX 系统区分大小写
print(PurePosixPath('readme.txt') == PurePosixPath('README.txt'))  # False

# Windows 系统不区分大小写
print(PureWindowsPath('readme.txt') == PureWindowsPath('README.txt'))  # True

# 路径可以排序
paths = [Path('b.txt'), Path('a.txt'), Path('c.txt')]
print(sorted(paths))  # [PosixPath('a.txt'), PosixPath('b.txt'), PosixPath('c.txt')]

# 路径可以作为字典键
file_info = {
    Path('config.yaml'): 'configuration',
    Path('data.json'): 'data file'
}
```

### 模式匹配

```python
from pathlib import Path

# match() 方法从右侧匹配
path = Path('/home/user/documents/report.txt')

print(path.match('*.txt'))  # True
print(path.match('documents/*.txt'))  # True
print(path.match('/home/*/*.txt'))  # False (中间还有一层目录)

# full_match() 完整路径匹配 (Python 3.13+)
print(path.full_match('/home/**/*.txt'))  # True
print(path.full_match('**/*.txt'))  # True
```

## 文件操作

`pathlib` 将常用的文件操作集成到 Path 对象中，无需额外导入模块。

### 读写文件

```python
from pathlib import Path

file_path = Path('example.txt')

# 写入文本
file_path.write_text('Hello, pathlib!', encoding='utf-8')

# 读取文本
content = file_path.read_text(encoding='utf-8')
print(content)  # Hello, pathlib!

# 写入二进制数据
binary_path = Path('data.bin')
binary_path.write_bytes(b'\x00\x01\x02\x03')

# 读取二进制数据
data = binary_path.read_bytes()
print(data)  # b'\x00\x01\x02\x03'

# 使用 open() 方法获取文件对象
with file_path.open('r', encoding='utf-8') as f:
    for line in f:
        print(line.strip())

# 追加内容
with file_path.open('a', encoding='utf-8') as f:
    f.write('\nAppended line')
```

### 创建和删除

```python
from pathlib import Path

# 创建文件（类似 touch 命令）
new_file = Path('new_file.txt')
new_file.touch()  # 创建空文件
new_file.touch(exist_ok=True)  # 如果存在不报错

# 创建目录
new_dir = Path('new_directory')
new_dir.mkdir()  # 创建目录

# 创建多级目录
deep_dir = Path('parent/child/grandchild')
deep_dir.mkdir(parents=True, exist_ok=True)

# 删除文件
file_to_delete = Path('temp.txt')
file_to_delete.touch()
file_to_delete.unlink()  # 删除文件

# 删除文件（如果不存在不报错，Python 3.8+）
file_to_delete.unlink(missing_ok=True)

# 删除空目录
empty_dir = Path('empty')
empty_dir.mkdir(exist_ok=True)
empty_dir.rmdir()
```

### 重命名和移动

```python
from pathlib import Path

# 重命名文件
old_path = Path('old_name.txt')
old_path.touch()
new_path = old_path.rename('new_name.txt')
print(new_path)  # new_name.txt

# 移动文件到其他目录
source = Path('file.txt')
source.touch()
dest = Path('backup/file.txt')
dest.parent.mkdir(exist_ok=True)
moved = source.rename(dest)

# 替换目标文件（如果目标存在则覆盖）
source2 = Path('source.txt')
source2.write_text('new content')
target = Path('target.txt')
target.write_text('old content')
source2.replace(target)
```

### 复制文件

`pathlib` 本身不提供复制方法，需要配合 `shutil` 模块：

```python
from pathlib import Path
import shutil

source = Path('original.txt')
source.write_text('Hello')

destination = Path('copy.txt')

# 复制文件
shutil.copy(source, destination)

# 复制文件及元数据
shutil.copy2(source, destination)

# 复制目录
source_dir = Path('source_folder')
dest_dir = Path('dest_folder')
shutil.copytree(source_dir, dest_dir)
```

### 文件信息

```python
from pathlib import Path
import datetime

file_path = Path('example.txt')
file_path.write_text('test content')

# 获取文件状态信息
stat_info = file_path.stat()
print(f"大小: {stat_info.st_size} 字节")
print(f"创建时间: {datetime.datetime.fromtimestamp(stat_info.st_ctime)}")
print(f"修改时间: {datetime.datetime.fromtimestamp(stat_info.st_mtime)}")
print(f"访问时间: {datetime.datetime.fromtimestamp(stat_info.st_atime)}")

# 获取文件所有者（Unix 系统）
try:
    print(f"所有者: {file_path.owner()}")
    print(f"所属组: {file_path.group()}")
except NotImplementedError:
    print("Windows 系统不支持此功能")

# 获取符号链接目标
symlink = Path('link')
if symlink.is_symlink():
    target = symlink.readlink()
    print(f"链接目标: {target}")
```

## 目录操作

### 遍历目录

```python
from pathlib import Path

directory = Path('.')

# 列出目录内容（非递归）
for item in directory.iterdir():
    if item.is_file():
        print(f"文件: {item.name}")
    elif item.is_dir():
        print(f"目录: {item.name}")

# 只获取文件
files = [f for f in directory.iterdir() if f.is_file()]

# 只获取目录
dirs = [d for d in directory.iterdir() if d.is_dir()]
```

### 使用 glob 模式匹配

`glob()` 方法支持使用通配符模式查找文件：

```python
from pathlib import Path

directory = Path('.')

# 查找所有 Python 文件
for py_file in directory.glob('*.py'):
    print(py_file)

# 查找所有文本文件
txt_files = list(directory.glob('*.txt'))

# 递归查找所有 Python 文件
for py_file in directory.glob('**/*.py'):
    print(py_file)

# 也可以使用 rglob() 进行递归搜索
for py_file in directory.rglob('*.py'):
    print(py_file)

# 复杂模式匹配
# 查找所有以 test_ 开头的 Python 文件
for test_file in directory.rglob('test_*.py'):
    print(test_file)

# 查找特定目录下的文件
for config in directory.glob('config/*.yaml'):
    print(config)

# 使用字符集
for file in directory.glob('*.[ch]'):  # 匹配 .c 和 .h 文件
    print(file)
```

### glob 模式语法

| 模式 | 说明 | 示例 |
|------|------|------|
| `*` | 匹配任意字符（不包括目录分隔符） | `*.txt` 匹配所有 txt 文件 |
| `**` | 递归匹配所有目录 | `**/*.py` 匹配所有子目录中的 py 文件 |
| `?` | 匹配单个字符 | `file?.txt` 匹配 file1.txt, fileA.txt |
| `[seq]` | 匹配序列中的任意字符 | `file[0-9].txt` 匹配 file0.txt 到 file9.txt |
| `[!seq]` | 匹配不在序列中的字符 | `file[!0-9].txt` 匹配 fileA.txt 但不匹配 file1.txt |

```python
from pathlib import Path

docs = Path('documents')

# 实际示例：查找所有图片文件
images = list(docs.rglob('*.[jp][pn][ge]*'))  # 匹配 jpg, jpeg, png

# 更清晰的写法
image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif']
all_images = []
for ext in image_extensions:
    all_images.extend(docs.rglob(ext))
```

### 递归遍历目录树

```python
from pathlib import Path

def walk_directory(directory):
    """递归遍历目录，类似 os.walk()"""
    path = Path(directory)

    for item in path.iterdir():
        if item.is_file():
            print(f"文件: {item}")
        elif item.is_dir():
            print(f"目录: {item}")
            walk_directory(item)  # 递归进入子目录

# 使用 walk() 方法 (Python 3.12+)
for root, dirs, files in Path('.').walk():
    print(f"当前目录: {root}")
    for file in files:
        print(f"  文件: {file}")
```

## os.path 与 pathlib 对比

下表展示了 `os.path` 和 `pathlib` 的对应关系：

| os.path | pathlib | 说明 |
|---------|---------|------|
| `os.path.join(a, b)` | `Path(a) / b` | 路径拼接 |
| `os.path.dirname(p)` | `Path(p).parent` | 获取父目录 |
| `os.path.basename(p)` | `Path(p).name` | 获取文件名 |
| `os.path.splitext(p)` | `Path(p).stem, Path(p).suffix` | 分离文件名和扩展名 |
| `os.path.exists(p)` | `Path(p).exists()` | 检查是否存在 |
| `os.path.isfile(p)` | `Path(p).is_file()` | 检查是否为文件 |
| `os.path.isdir(p)` | `Path(p).is_dir()` | 检查是否为目录 |
| `os.path.abspath(p)` | `Path(p).resolve()` | 获取绝对路径 |
| `os.path.expanduser(p)` | `Path(p).expanduser()` | 展开用户目录 |
| `os.path.relpath(p, start)` | `Path(p).relative_to(start)` | 计算相对路径 |
| `os.getcwd()` | `Path.cwd()` | 获取当前工作目录 |
| `os.path.expandvars(p)` | 无直接对应 | 展开环境变量 |

### 迁移示例

将传统代码迁移到 `pathlib`：

```python
# 旧代码
import os

def process_files_old(directory):
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath) and filename.endswith('.txt'):
            with open(filepath, 'r') as f:
                content = f.read()
            # 处理内容...

# 新代码
from pathlib import Path

def process_files_new(directory):
    for filepath in Path(directory).glob('*.txt'):
        content = filepath.read_text()
        # 处理内容...
```

## 实用示例

### 示例1：批量重命名文件

```python
from pathlib import Path

def batch_rename(directory, pattern, prefix):
    """给匹配模式的文件添加前缀"""
    path = Path(directory)

    for file in path.glob(pattern):
        new_name = f"{prefix}_{file.name}"
        new_path = file.with_name(new_name)
        file.rename(new_path)
        print(f"重命名: {file.name} -> {new_name}")

# 使用示例
batch_rename('photos', '*.jpg', '2024')
```

### 示例2：整理文件到分类目录

```python
from pathlib import Path

def organize_files(source_dir):
    """根据文件扩展名整理文件"""
    source = Path(source_dir)

    # 定义分类规则
    categories = {
        'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
        'documents': ['.pdf', '.doc', '.docx', '.txt', '.md'],
        'videos': ['.mp4', '.avi', '.mkv', '.mov'],
        'audio': ['.mp3', '.wav', '.flac', '.aac'],
    }

    for file in source.iterdir():
        if not file.is_file():
            continue

        suffix = file.suffix.lower()

        # 确定分类
        target_category = 'others'
        for category, extensions in categories.items():
            if suffix in extensions:
                target_category = category
                break

        # 创建目标目录并移动文件
        target_dir = source / target_category
        target_dir.mkdir(exist_ok=True)

        target_path = target_dir / file.name
        file.rename(target_path)
        print(f"移动 {file.name} -> {target_category}/")

# 使用示例
organize_files('downloads')
```

### 示例3：查找重复文件

```python
from pathlib import Path
import hashlib
from collections import defaultdict

def find_duplicates(directory):
    """查找目录中的重复文件"""
    path = Path(directory)
    hash_map = defaultdict(list)

    for file in path.rglob('*'):
        if not file.is_file():
            continue

        # 计算文件哈希值
        file_hash = hashlib.md5(file.read_bytes()).hexdigest()
        hash_map[file_hash].append(file)

    # 找出重复文件
    duplicates = {h: files for h, files in hash_map.items() if len(files) > 1}

    for hash_value, files in duplicates.items():
        print(f"\n重复文件 (MD5: {hash_value[:8]}...):")
        for f in files:
            print(f"  - {f}")

    return duplicates

# 使用示例
find_duplicates('documents')
```

### 示例4：生成目录树

```python
from pathlib import Path

def print_tree(directory, prefix="", max_depth=3, current_depth=0):
    """打印目录树结构"""
    if current_depth >= max_depth:
        return

    path = Path(directory)

    # 获取目录内容并排序
    items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name))

    for i, item in enumerate(items):
        is_last = i == len(items) - 1
        connector = "└── " if is_last else "├── "

        print(f"{prefix}{connector}{item.name}")

        if item.is_dir():
            extension = "    " if is_last else "│   "
            print_tree(item, prefix + extension, max_depth, current_depth + 1)

# 使用示例
print_tree('.', max_depth=2)
```

### 示例5：安全的文件名处理

```python
from pathlib import Path
import re

def safe_filename(filename):
    """将字符串转换为安全的文件名"""
    # 移除或替换不安全字符
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # 移除开头和结尾的空格和点
    safe_name = safe_name.strip('. ')
    # 限制长度
    safe_name = safe_name[:200]
    return safe_name

def unique_path(path):
    """生成唯一的文件路径，避免覆盖现有文件"""
    p = Path(path)

    if not p.exists():
        return p

    counter = 1
    while True:
        new_path = p.with_stem(f"{p.stem}_{counter}")
        if not new_path.exists():
            return new_path
        counter += 1

# 使用示例
original_name = 'Report: Q4 <2024>.txt'
safe_name = safe_filename(original_name)
print(safe_name)  # Report_ Q4 _2024_.txt

target = unique_path('document.txt')
print(target)  # document.txt 或 document_1.txt
```

## 最佳实践

### 始终使用 Path 对象

```python
# 推荐
from pathlib import Path

config_file = Path('config') / 'settings.yaml'

# 不推荐
config_file = 'config/settings.yaml'  # 或 'config\\settings.yaml'
```

### 使用 resolve() 处理相对路径

```python
from pathlib import Path

# 获取脚本所在目录的绝对路径
script_dir = Path(__file__).resolve().parent

# 基于脚本位置定位配置文件
config_path = script_dir / 'config.yaml'
```

### 使用 with 语句或便捷方法

```python
from pathlib import Path

path = Path('data.txt')

# 简单读写使用便捷方法
content = path.read_text(encoding='utf-8')
path.write_text('new content', encoding='utf-8')

# 复杂操作使用 with 语句
with path.open('r', encoding='utf-8') as f:
    for line in f:
        process(line)
```

### 处理跨平台兼容性

```python
from pathlib import Path, PurePosixPath

# 强制使用 POSIX 风格路径（用于 URL 或远程路径）
posix_path = PurePosixPath('uploads', 'images', 'photo.jpg')
url_path = f"https://example.com/{posix_path.as_posix()}"

# 使用 as_posix() 生成跨平台路径字符串
path = Path('documents/file.txt')
print(path.as_posix())  # documents/file.txt (无论在哪个平台)
```

### 正确处理异常

```python
from pathlib import Path

path = Path('important_file.txt')

try:
    content = path.read_text()
except FileNotFoundError:
    print(f"文件不存在: {path}")
except PermissionError:
    print(f"没有权限读取: {path}")
except OSError as e:
    print(f"读取文件时出错: {e}")
```

## 总结

`pathlib` 模块是 Python 处理文件路径的现代化选择。它的面向对象设计使代码更加清晰易读，内置的文件操作方法减少了对其他模块的依赖，而跨平台兼容性则让代码更加健壮。

要点回顾：

- 使用 `Path` 类创建路径对象
- 使用 `/` 运算符拼接路径
- 通过属性访问路径组成部分（`name`, `stem`, `suffix`, `parent` 等）
- 使用 `glob()` 和 `rglob()` 进行模式匹配
- 内置 `read_text()`, `write_text()` 等便捷方法
- 配合 `shutil` 模块完成复制等高级操作

建议在新项目中优先使用 `pathlib`，并逐步将旧项目中的 `os.path` 代码迁移到 `pathlib`。
