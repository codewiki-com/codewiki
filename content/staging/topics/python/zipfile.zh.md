---
title: Python 压缩文件处理：zipfile 与 tarfile
description: 深入掌握 Python 压缩文件处理：ZipFile、TarFile、压缩模式、归档创建与解压
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - zipfile
  - tarfile
  - 压缩
  - 归档
  - gzip
  - bz2
status: imported
origin: old/src/content/docs/python/zipfile.zh.md
divergence: 0.199
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Python
  subcategory: 标准库
  order: 17
  lastUpdated: 2026-01-07
---

Python 标准库提供了强大的压缩文件处理模块，包括处理 ZIP 格式的 `zipfile` 和处理 TAR 格式的 `tarfile`。本文将深入介绍这两个模块的使用方法、核心原理和最佳实践。

## 概念解释

### 什么是压缩文件

压缩文件是一种通过特定算法减少文件大小的技术，主要用于：

- **节省存储空间**：将大文件压缩成小文件
- **加快传输速度**：较小的文件传输更快
- **文件归档**：将多个文件打包成单个归档文件
- **数据备份**：方便备份和恢复

### 常见压缩格式

| 格式 | 扩展名 | 特点 | Python 模块 |
|------|--------|------|-------------|
| ZIP | .zip | 通用性强，支持单独解压 | `zipfile` |
| TAR | .tar | 归档格式，不压缩 | `tarfile` |
| GZIP | .gz | 压缩单个文件 | `gzip` |
| TAR.GZ | .tar.gz, .tgz | TAR 归档 + GZIP 压缩 | `tarfile` |
| BZ2 | .bz2 | 压缩比更高 | `bz2` |
| TAR.BZ2 | .tar.bz2 | TAR 归档 + BZ2 压缩 | `tarfile` |
| LZMA/XZ | .xz, .lzma | 最高压缩比 | `lzma` |
| TAR.XZ | .tar.xz | TAR 归档 + XZ 压缩 | `tarfile` |

### zipfile vs tarfile

- **zipfile**：处理 ZIP 格式，支持随机访问单个文件，Windows 和跨平台常用
- **tarfile**：处理 TAR 格式及其压缩变体，Unix/Linux 系统常用，支持更多文件元数据

## 核心原理

### ZIP 格式结构

```
┌─────────────────────────────────────────────┐
│                 ZIP 文件结构                  │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ 本地文件头 1 + 压缩数据 1           │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 本地文件头 2 + 压缩数据 2           │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 中央目录（所有文件的元数据）          │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 中央目录结束标记                     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

ZIP 文件在末尾存储中央目录，允许快速随机访问任意文件。

### TAR 格式结构

```
┌─────────────────────────────────────────────┐
│                 TAR 文件结构                  │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ 头块 1 (512 字节)                   │    │
│  ├─────────────────────────────────────┤    │
│  │ 文件内容 1 (填充到 512 字节倍数)     │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 头块 2 (512 字节)                   │    │
│  ├─────────────────────────────────────┤    │
│  │ 文件内容 2                          │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 结束标记 (两个 512 字节的空块)       │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

TAR 是顺序格式，需要从头扫描才能找到特定文件。

### 压缩算法

| 算法 | 压缩比 | 速度 | 内存使用 | 适用场景 |
|------|--------|------|----------|----------|
| DEFLATE (ZIP) | 中等 | 快 | 低 | 通用场景 |
| GZIP | 中等 | 快 | 低 | 单文件压缩 |
| BZ2 | 高 | 慢 | 较高 | 需要高压缩比 |
| LZMA/XZ | 最高 | 最慢 | 高 | 归档存储 |

## 核心要点

### zipfile 模块核心类

```python
import zipfile

# ZipFile - 主要类，用于读写 ZIP 文件
# ZipInfo - 存储归档成员信息
# is_zipfile() - 检查是否为有效 ZIP 文件
# Path - 类似 pathlib 的 ZIP 文件访问（Python 3.8+）
```

### tarfile 模块核心类

```python
import tarfile

# TarFile - 主要类，用于读写 TAR 文件
# TarInfo - 存储归档成员信息
# is_tarfile() - 检查是否为有效 TAR 文件
```

### 文件打开模式

**zipfile 模式：**

| 模式 | 说明 |
|------|------|
| `'r'` | 只读模式（默认） |
| `'w'` | 写入模式（覆盖） |
| `'a'` | 追加模式 |
| `'x'` | 独占创建模式 |

**tarfile 模式：**

| 模式 | 说明 |
|------|------|
| `'r'` | 读取，自动检测压缩格式 |
| `'r:'` | 读取无压缩 TAR |
| `'r:gz'` | 读取 GZIP 压缩 |
| `'r:bz2'` | 读取 BZ2 压缩 |
| `'r:xz'` | 读取 XZ 压缩 |
| `'w'` 或 `'w:'` | 写入无压缩 TAR |
| `'w:gz'` | 写入 GZIP 压缩 |
| `'w:bz2'` | 写入 BZ2 压缩 |
| `'w:xz'` | 写入 XZ 压缩 |
| `'a'` 或 `'a:'` | 追加到无压缩 TAR |
| `'x'` 或 `'x:'` | 独占创建无压缩 TAR |
| `'x:gz'` | 独占创建 GZIP 压缩 |

## 代码示例

### zipfile 基础操作

#### 创建 ZIP 文件

```python
import zipfile
from pathlib import Path

# 方法 1：基本创建
with zipfile.ZipFile('archive.zip', 'w') as zf:
    # 添加单个文件
    zf.write('document.txt')

    # 指定归档内的名称
    zf.write('data/config.json', arcname='config.json')

    # 添加带压缩的文件
    zf.write('large_file.txt', compress_type=zipfile.ZIP_DEFLATED)

# 方法 2：使用压缩级别（Python 3.7+）
with zipfile.ZipFile('archive.zip', 'w',
                      compression=zipfile.ZIP_DEFLATED,
                      compresslevel=9) as zf:  # 0-9，9 最高压缩
    zf.write('document.txt')

# 方法 3：添加字符串内容
with zipfile.ZipFile('archive.zip', 'w') as zf:
    # 直接写入字符串内容
    zf.writestr('readme.txt', 'This is the README content.\n')

    # 写入字节内容
    zf.writestr('data.bin', b'\x00\x01\x02\x03')

    # 使用 ZipInfo 设置详细信息
    info = zipfile.ZipInfo('custom.txt')
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16  # 设置 Unix 权限
    zf.writestr(info, 'Custom content with metadata')

# 方法 4：递归添加目录
def add_directory_to_zip(zf, directory, base_path=''):
    """递归添加目录到 ZIP 文件"""
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

#### 读取 ZIP 文件

```python
import zipfile
from pathlib import Path

# 检查是否为有效 ZIP 文件
if zipfile.is_zipfile('archive.zip'):
    print("这是一个有效的 ZIP 文件")

# 读取 ZIP 文件信息
with zipfile.ZipFile('archive.zip', 'r') as zf:
    # 列出所有文件
    print("归档内容:")
    for name in zf.namelist():
        print(f"  {name}")

    # 获取详细信息
    print("\n详细信息:")
    for info in zf.infolist():
        print(f"  文件: {info.filename}")
        print(f"    大小: {info.file_size} 字节")
        print(f"    压缩后: {info.compress_size} 字节")
        print(f"    压缩比: {info.compress_size / info.file_size * 100:.1f}%")
        print(f"    修改时间: {info.date_time}")
        print(f"    CRC: {info.CRC}")
        print()

    # 读取特定文件内容
    content = zf.read('readme.txt')
    print(f"README 内容: {content.decode('utf-8')}")

    # 以文本模式打开文件
    with zf.open('document.txt') as f:
        text = f.read().decode('utf-8')
        print(text)

# 使用 Path 接口（Python 3.8+）
with zipfile.ZipFile('archive.zip', 'r') as zf:
    root = zipfile.Path(zf)

    # 遍历目录
    for item in root.iterdir():
        print(item.name)
        if item.is_file():
            print(f"  内容: {item.read_text()[:50]}...")
```

#### 解压 ZIP 文件

```python
import zipfile
from pathlib import Path

# 解压所有文件
with zipfile.ZipFile('archive.zip', 'r') as zf:
    # 解压到当前目录
    zf.extractall()

    # 解压到指定目录
    zf.extractall('extracted_files')

    # 解压部分文件
    zf.extractall('selected', members=['file1.txt', 'file2.txt'])

# 解压单个文件
with zipfile.ZipFile('archive.zip', 'r') as zf:
    # 解压单个文件到指定目录
    zf.extract('document.txt', 'output')

    # 使用 open 读取后写入（更灵活）
    with zf.open('large_file.bin') as src:
        with open('output/large_file.bin', 'wb') as dst:
            # 分块读取大文件
            while True:
                chunk = src.read(1024 * 1024)  # 1MB
                if not chunk:
                    break
                dst.write(chunk)

# 安全解压（防止路径遍历攻击）
def safe_extract(zf, member, target_dir):
    """安全解压文件，防止路径遍历"""
    target_dir = Path(target_dir).resolve()
    member_path = target_dir / member

    # 确保目标路径在目标目录内
    if not str(member_path.resolve()).startswith(str(target_dir)):
        raise ValueError(f"非法路径: {member}")

    zf.extract(member, target_dir)
    return member_path

with zipfile.ZipFile('archive.zip', 'r') as zf:
    for member in zf.namelist():
        safe_extract(zf, member, 'safe_output')
```

#### ZIP 文件高级操作

```python
import zipfile
import os
from datetime import datetime

# 密码保护的 ZIP 文件（仅解压，需要第三方库创建）
with zipfile.ZipFile('protected.zip', 'r') as zf:
    # 设置密码
    zf.setpassword(b'secret123')

    # 或在提取时指定密码
    zf.extractall('output', pwd=b'secret123')

# 追加文件到现有 ZIP
with zipfile.ZipFile('archive.zip', 'a') as zf:
    zf.write('new_file.txt')
    zf.writestr('appended.txt', 'New content')

# 测试 ZIP 文件完整性
with zipfile.ZipFile('archive.zip', 'r') as zf:
    bad_file = zf.testzip()
    if bad_file:
        print(f"损坏的文件: {bad_file}")
    else:
        print("ZIP 文件完整")

# 获取和设置 ZIP 文件注释
with zipfile.ZipFile('archive.zip', 'a') as zf:
    # 设置注释
    zf.comment = b'Created by Python zipfile module'

with zipfile.ZipFile('archive.zip', 'r') as zf:
    # 读取注释
    print(f"注释: {zf.comment.decode('utf-8')}")

# 内存中处理 ZIP 文件
from io import BytesIO

# 在内存中创建 ZIP
buffer = BytesIO()
with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('memory_file.txt', 'Created in memory')

# 获取 ZIP 数据
zip_data = buffer.getvalue()
print(f"ZIP 大小: {len(zip_data)} 字节")

# 从内存读取 ZIP
buffer = BytesIO(zip_data)
with zipfile.ZipFile(buffer, 'r') as zf:
    print(zf.namelist())
```

### tarfile 基础操作

#### 创建 TAR 文件

```python
import tarfile
from pathlib import Path
import io

# 创建无压缩 TAR
with tarfile.open('archive.tar', 'w') as tf:
    tf.add('document.txt')
    tf.add('data/config.json', arcname='config.json')

# 创建 GZIP 压缩的 TAR
with tarfile.open('archive.tar.gz', 'w:gz') as tf:
    tf.add('document.txt')

# 创建 BZ2 压缩的 TAR
with tarfile.open('archive.tar.bz2', 'w:bz2') as tf:
    tf.add('document.txt')

# 创建 XZ 压缩的 TAR（Python 3.3+）
with tarfile.open('archive.tar.xz', 'w:xz') as tf:
    tf.add('document.txt')

# 设置压缩级别（GZIP: 0-9）
with tarfile.open('archive.tar.gz', 'w:gz', compresslevel=9) as tf:
    tf.add('large_file.txt')

# 添加目录（递归）
with tarfile.open('project.tar.gz', 'w:gz') as tf:
    # 添加整个目录
    tf.add('src', arcname='source')

    # 使用 filter 排除文件
    def exclude_pyc(tarinfo):
        if tarinfo.name.endswith('.pyc'):
            return None
        return tarinfo

    tf.add('project', filter=exclude_pyc)

# 添加字符串/字节内容
with tarfile.open('archive.tar.gz', 'w:gz') as tf:
    # 创建 TarInfo 对象
    data = b'Hello, World!'
    info = tarfile.TarInfo(name='hello.txt')
    info.size = len(data)

    # 使用 BytesIO 作为文件对象
    tf.addfile(info, io.BytesIO(data))

# 设置文件元数据
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

#### 读取 TAR 文件

```python
import tarfile

# 检查是否为有效 TAR 文件
if tarfile.is_tarfile('archive.tar.gz'):
    print("这是一个有效的 TAR 文件")

# 读取 TAR 文件（自动检测压缩格式）
with tarfile.open('archive.tar.gz', 'r') as tf:
    # 列出所有成员
    print("归档内容:")
    for name in tf.getnames():
        print(f"  {name}")

    # 获取详细信息
    print("\n详细信息:")
    for member in tf.getmembers():
        print(f"  名称: {member.name}")
        print(f"  类型: {'目录' if member.isdir() else '文件'}")
        print(f"  大小: {member.size} 字节")
        print(f"  权限: {oct(member.mode)}")
        print(f"  所有者: {member.uname}:{member.gname}")
        print(f"  修改时间: {member.mtime}")
        print()

    # 获取特定成员信息
    info = tf.getmember('document.txt')
    print(f"文件大小: {info.size}")

    # 读取文件内容
    f = tf.extractfile('document.txt')
    if f:
        content = f.read().decode('utf-8')
        print(content)
```

#### 解压 TAR 文件

```python
import tarfile
from pathlib import Path

# 解压所有文件
with tarfile.open('archive.tar.gz', 'r') as tf:
    # 解压到当前目录
    tf.extractall()

    # 解压到指定目录
    tf.extractall('extracted_files')

    # 解压部分文件
    members = [m for m in tf.getmembers() if m.name.endswith('.txt')]
    tf.extractall('text_files', members=members)

# 解压单个文件
with tarfile.open('archive.tar.gz', 'r') as tf:
    # 解压单个成员
    tf.extract('document.txt', 'output')

# 安全解压（Python 3.12+ 内置，之前版本需手动实现）
# Python 3.12+
with tarfile.open('archive.tar.gz', 'r') as tf:
    tf.extractall('output', filter='data')  # 安全过滤器

# Python 3.11 及更早版本的安全解压
def safe_extract_tar(tf, target_dir):
    """安全解压 TAR 文件，防止路径遍历"""
    target_dir = Path(target_dir).resolve()

    for member in tf.getmembers():
        member_path = target_dir / member.name

        # 检查路径遍历
        if not str(member_path.resolve()).startswith(str(target_dir)):
            raise ValueError(f"非法路径: {member.name}")

        # 检查符号链接
        if member.issym() or member.islnk():
            link_target = target_dir / member.linkname
            if not str(link_target.resolve()).startswith(str(target_dir)):
                raise ValueError(f"非法链接: {member.name} -> {member.linkname}")

    tf.extractall(target_dir)

with tarfile.open('archive.tar.gz', 'r') as tf:
    safe_extract_tar(tf, 'safe_output')

# 流式解压大文件
with tarfile.open('large_archive.tar.gz', 'r|gz') as tf:  # 注意使用 '|' 而非 ':'
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

#### TAR 文件高级操作

```python
import tarfile
import io
from pathlib import Path

# 修改 TAR 文件中的成员
def modify_tar_member(tar_path, member_name, new_content):
    """修改 TAR 文件中的特定成员"""
    temp_path = tar_path + '.tmp'

    with tarfile.open(tar_path, 'r:gz') as src:
        with tarfile.open(temp_path, 'w:gz') as dst:
            for member in src.getmembers():
                if member.name == member_name:
                    # 替换内容
                    data = new_content.encode('utf-8')
                    info = tarfile.TarInfo(name=member_name)
                    info.size = len(data)
                    dst.addfile(info, io.BytesIO(data))
                else:
                    # 复制原内容
                    f = src.extractfile(member)
                    if f:
                        dst.addfile(member, f)
                    else:
                        dst.addfile(member)

    Path(temp_path).replace(tar_path)

# 内存中处理 TAR 文件
buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w:gz') as tf:
    data = b'Memory content'
    info = tarfile.TarInfo(name='memory.txt')
    info.size = len(data)
    tf.addfile(info, io.BytesIO(data))

# 获取 TAR 数据
tar_data = buffer.getvalue()

# 从内存读取
buffer = io.BytesIO(tar_data)
with tarfile.open(fileobj=buffer, mode='r:gz') as tf:
    print(tf.getnames())

# 比较两个 TAR 文件
def compare_tar_files(tar1_path, tar2_path):
    """比较两个 TAR 文件的内容"""
    with tarfile.open(tar1_path, 'r') as tf1:
        with tarfile.open(tar2_path, 'r') as tf2:
            names1 = set(tf1.getnames())
            names2 = set(tf2.getnames())

            only_in_1 = names1 - names2
            only_in_2 = names2 - names1
            common = names1 & names2

            print(f"仅在 {tar1_path}: {only_in_1}")
            print(f"仅在 {tar2_path}: {only_in_2}")

            for name in common:
                m1 = tf1.getmember(name)
                m2 = tf2.getmember(name)
                if m1.size != m2.size:
                    print(f"大小不同: {name}")
```

### 综合压缩工具类

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
    """压缩文件处理工具类"""

    @staticmethod
    def create_zip(
        output_path: str,
        files: List[str],
        base_dir: Optional[str] = None,
        compression: int = zipfile.ZIP_DEFLATED,
        compresslevel: int = 6
    ) -> None:
        """创建 ZIP 文件

        Args:
            output_path: 输出 ZIP 文件路径
            files: 要添加的文件列表
            base_dir: 基础目录，用于计算相对路径
            compression: 压缩方法
            compresslevel: 压缩级别 (0-9)
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
        """创建 TAR.GZ 文件"""
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
        """自动检测格式并解压归档文件

        Returns:
            解压的文件列表
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
            raise ValueError(f"不支持的归档格式: {archive_path}")

        return extracted_files

    @staticmethod
    def list_archive_contents(archive_path: str) -> List[dict]:
        """列出归档文件内容

        Returns:
            包含文件信息的字典列表
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
            raise ValueError(f"不支持的归档格式: {archive_path}")

        return contents

    @staticmethod
    def compress_file(
        input_path: str,
        output_path: Optional[str] = None,
        method: str = 'gzip'
    ) -> str:
        """压缩单个文件

        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径（可选）
            method: 压缩方法 ('gzip', 'bz2', 'lzma')

        Returns:
            输出文件路径
        """
        compressors = {
            'gzip': (gzip.open, '.gz'),
            'bz2': (bz2.open, '.bz2'),
            'lzma': (lzma.open, '.xz')
        }

        if method not in compressors:
            raise ValueError(f"不支持的压缩方法: {method}")

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
        """解压单个压缩文件

        Args:
            input_path: 压缩文件路径
            output_path: 输出文件路径（可选）

        Returns:
            输出文件路径
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
            raise ValueError(f"不支持的压缩格式: {suffix}")

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


# 使用示例
if __name__ == '__main__':
    utils = CompressionUtils()

    # 创建 ZIP 文件
    utils.create_zip(
        'backup.zip',
        ['file1.txt', 'file2.txt', 'data/config.json'],
        compresslevel=9
    )

    # 创建 TAR.GZ 文件
    utils.create_tar_gz(
        'backup.tar.gz',
        ['file1.txt', 'file2.txt']
    )

    # 列出归档内容
    contents = utils.list_archive_contents('backup.zip')
    for item in contents:
        print(item)

    # 解压归档
    extracted = utils.extract_archive('backup.zip', 'extracted')
    print(f"解压了 {len(extracted)} 个文件")

    # 压缩单个文件
    utils.compress_file('large_file.txt', method='gzip')

    # 解压单个文件
    utils.decompress_file('large_file.txt.gz')
```

## 最佳实践

### 始终使用上下文管理器

```python
# 推荐：使用 with 语句
with zipfile.ZipFile('archive.zip', 'w') as zf:
    zf.write('file.txt')
# 文件自动正确关闭

# 不推荐：手动管理
zf = zipfile.ZipFile('archive.zip', 'w')
try:
    zf.write('file.txt')
finally:
    zf.close()
```

### 选择合适的压缩格式

```python
# ZIP：跨平台兼容性最好
# - 适用于需要在 Windows/Mac/Linux 间分享的文件
# - 支持随机访问单个文件
with zipfile.ZipFile('cross_platform.zip', 'w') as zf:
    zf.write('file.txt')

# TAR.GZ：Unix/Linux 常用，保留更多元数据
# - 适用于备份 Unix 系统文件（保留权限、所有者等）
# - 压缩比通常略好于 ZIP
with tarfile.open('unix_backup.tar.gz', 'w:gz') as tf:
    tf.add('/etc/nginx', arcname='nginx_config')

# TAR.XZ：最高压缩比
# - 适用于归档存储，不经常访问
# - 压缩/解压速度较慢
with tarfile.open('archive.tar.xz', 'w:xz') as tf:
    tf.add('large_directory')
```

### 处理大文件时分块读写

```python
import zipfile

def extract_large_file(zf, member, output_path, chunk_size=1024*1024):
    """分块解压大文件，避免内存溢出"""
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

### 验证归档完整性

```python
import zipfile
import tarfile

# ZIP 完整性检查
def verify_zip(path):
    """验证 ZIP 文件完整性"""
    try:
        with zipfile.ZipFile(path, 'r') as zf:
            bad_file = zf.testzip()
            if bad_file:
                return False, f"损坏的文件: {bad_file}"
            return True, "ZIP 文件完整"
    except zipfile.BadZipFile as e:
        return False, f"无效的 ZIP 文件: {e}"

# TAR 完整性检查
def verify_tar(path):
    """验证 TAR 文件完整性"""
    try:
        with tarfile.open(path, 'r') as tf:
            # 遍历所有成员检查是否可读
            for member in tf.getmembers():
                if member.isfile():
                    f = tf.extractfile(member)
                    if f:
                        # 读取内容验证
                        while f.read(1024 * 1024):
                            pass
            return True, "TAR 文件完整"
    except Exception as e:
        return False, f"TAR 文件错误: {e}"
```

### 使用进度回调

```python
import zipfile
from pathlib import Path

class ProgressZipFile(zipfile.ZipFile):
    """支持进度回调的 ZipFile"""

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
    print(f"已添加: {filename} ({size} 字节), 总计: {total} 字节")

# 使用示例
with ProgressZipFile('archive.zip', 'w', progress_callback=print_progress) as zf:
    zf.write('file1.txt')
    zf.write('file2.txt')
```

## 常见陷阱

### 路径遍历攻击

```python
import zipfile
from pathlib import Path

# 危险：直接解压可能导致文件被写入任意位置
# 恶意 ZIP 可能包含 "../../../etc/passwd" 这样的路径

# 安全的解压方式
def safe_extract_all(zf, target_dir):
    """安全解压所有文件"""
    target = Path(target_dir).resolve()

    for member in zf.namelist():
        # 规范化路径
        member_path = target / member

        # 确保目标路径在目标目录内
        try:
            member_path.resolve().relative_to(target)
        except ValueError:
            raise ValueError(f"非法路径: {member}")

    # 验证通过后解压
    zf.extractall(target_dir)
```

### 忘记处理目录条目

```python
import zipfile
import tarfile

# ZIP 中的目录以 / 结尾
with zipfile.ZipFile('archive.zip', 'r') as zf:
    for name in zf.namelist():
        if name.endswith('/'):
            print(f"目录: {name}")
        else:
            print(f"文件: {name}")

# TAR 使用 isdir() 判断
with tarfile.open('archive.tar.gz', 'r') as tf:
    for member in tf.getmembers():
        if member.isdir():
            print(f"目录: {member.name}")
        elif member.isfile():
            print(f"文件: {member.name}")
        elif member.issym():
            print(f"符号链接: {member.name} -> {member.linkname}")
```

### 编码问题

```python
import zipfile

# ZIP 文件名编码问题
with zipfile.ZipFile('archive.zip', 'r') as zf:
    for info in zf.infolist():
        # 检查是否使用 UTF-8
        if info.flag_bits & 0x800:
            # UTF-8 编码
            name = info.filename
        else:
            # 可能是 CP437 或系统默认编码
            try:
                name = info.filename.encode('cp437').decode('gbk')
            except:
                name = info.filename
        print(name)

# 创建 ZIP 时确保使用 UTF-8
with zipfile.ZipFile('archive.zip', 'w') as zf:
    # Python 3.11+ 默认使用 UTF-8
    zf.write('中文文件名.txt')
```

### 未处理空归档

```python
import zipfile
import tarfile

# 空 ZIP 文件仍是有效的
with zipfile.ZipFile('empty.zip', 'w') as zf:
    pass  # 不添加任何文件

# 读取时检查是否为空
with zipfile.ZipFile('archive.zip', 'r') as zf:
    if not zf.namelist():
        print("警告：这是一个空归档")
```

### 符号链接处理

```python
import tarfile
from pathlib import Path

# TAR 可能包含符号链接，可能导致安全问题
with tarfile.open('archive.tar.gz', 'r') as tf:
    for member in tf.getmembers():
        if member.issym():
            # 检查符号链接目标是否安全
            target = Path(member.linkname)
            if target.is_absolute():
                print(f"警告：绝对符号链接 {member.name} -> {member.linkname}")
            elif '..' in str(target):
                print(f"警告：向上遍历的符号链接 {member.name} -> {member.linkname}")
```

## 性能考量

### 压缩级别与性能权衡

```python
import zipfile
import tarfile
import time
from pathlib import Path

def benchmark_compression(file_path, levels):
    """测试不同压缩级别的性能"""
    original_size = Path(file_path).stat().st_size

    results = []
    for level in levels:
        # ZIP 压缩
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

# 压缩级别建议：
# - 级别 1-3：快速压缩，适合实时场景
# - 级别 6（默认）：平衡压缩比和速度
# - 级别 9：最高压缩比，适合归档存储
```

### 流式处理大归档

```python
import tarfile

# 使用流式模式处理大文件
# 模式 'r|gz' 表示流式读取，不需要 seek
# 比 'r:gz' 更节省内存，但只能顺序访问

def stream_process_tar(archive_path, process_func):
    """流式处理 TAR 归档"""
    with tarfile.open(archive_path, 'r|gz') as tf:
        for member in tf:
            if member.isfile():
                f = tf.extractfile(member)
                if f:
                    process_func(member.name, f)

def my_processor(name, file_obj):
    """处理单个文件"""
    # 分块读取，避免大文件占用过多内存
    total_size = 0
    while True:
        chunk = file_obj.read(1024 * 1024)
        if not chunk:
            break
        total_size += len(chunk)
        # 处理数据...
    print(f"处理完成: {name} ({total_size} 字节)")

stream_process_tar('large_archive.tar.gz', my_processor)
```

### 并行压缩

```python
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import os

def parallel_create_zip(output_path, files, max_workers=4):
    """并行创建 ZIP 文件（适用于大量小文件）"""

    def compress_file(file_path):
        """压缩单个文件到临时 ZIP"""
        temp_fd, temp_path = tempfile.mkstemp(suffix='.zip')
        os.close(temp_fd)

        with zipfile.ZipFile(temp_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(file_path, Path(file_path).name)

        return temp_path, Path(file_path).name

    # 并行压缩文件
    temp_zips = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(compress_file, f) for f in files]
        for future in futures:
            temp_zips.append(future.result())

    # 合并到最终 ZIP
    with zipfile.ZipFile(output_path, 'w') as final_zf:
        for temp_path, name in temp_zips:
            with zipfile.ZipFile(temp_path, 'r') as temp_zf:
                data = temp_zf.read(name)
                final_zf.writestr(name, data)
            os.unlink(temp_path)

# 使用示例
files = list(Path('data').glob('*.txt'))
parallel_create_zip('parallel.zip', files)
```

### 内存映射处理超大文件

```python
import mmap
import zipfile
from pathlib import Path

def create_zip_with_mmap(output_path, large_file_path):
    """使用内存映射处理超大文件"""
    file_path = Path(large_file_path)

    with open(large_file_path, 'rb') as f:
        # 创建内存映射
        with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mm:
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                # 创建 ZipInfo
                info = zipfile.ZipInfo(file_path.name)
                info.compress_type = zipfile.ZIP_DEFLATED

                # 分块写入
                with zf.open(info, 'w') as dest:
                    chunk_size = 1024 * 1024 * 10  # 10MB
                    offset = 0
                    while offset < len(mm):
                        chunk = mm[offset:offset + chunk_size]
                        dest.write(chunk)
                        offset += chunk_size
```

## 实战场景

### 场景一：自动备份工具

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
    """自动备份管理器"""

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
        """创建备份

        Args:
            source_dirs: 要备份的目录列表
            backup_name: 备份文件名（不含扩展名）
            format: 备份格式 ('zip' 或 'tar.gz')
            exclude_patterns: 排除的文件模式

        Returns:
            备份文件路径
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
            raise ValueError(f"不支持的格式: {format}")

        # 计算校验和
        checksum = self._calculate_checksum(backup_path)
        checksum_path = backup_path.with_suffix(backup_path.suffix + '.sha256')
        checksum_path.write_text(f"{checksum}  {backup_path.name}\n")

        logger.info(f"备份完成: {backup_path}")
        logger.info(f"校验和: {checksum}")

        return backup_path

    def _should_exclude(self, path: Path, patterns: list) -> bool:
        """检查文件是否应该排除"""
        name = path.name
        for pattern in patterns:
            if pattern.startswith('*'):
                if name.endswith(pattern[1:]):
                    return True
            elif name == pattern:
                return True
        return False

    def _create_zip_backup(self, backup_path, source_dirs, exclude_patterns):
        """创建 ZIP 备份"""
        with zipfile.ZipFile(
            backup_path, 'w',
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=6
        ) as zf:
            for source_dir in source_dirs:
                source = Path(source_dir)
                if not source.exists():
                    logger.warning(f"目录不存在: {source}")
                    continue

                for file_path in source.rglob('*'):
                    if file_path.is_file():
                        if self._should_exclude(file_path, exclude_patterns):
                            continue

                        arcname = str(file_path.relative_to(source.parent))
                        zf.write(file_path, arcname)
                        logger.debug(f"添加: {arcname}")

    def _create_tar_backup(self, backup_path, source_dirs, exclude_patterns):
        """创建 TAR.GZ 备份"""
        def filter_func(tarinfo):
            if self._should_exclude(Path(tarinfo.name), exclude_patterns):
                return None
            return tarinfo

        with tarfile.open(backup_path, 'w:gz', compresslevel=6) as tf:
            for source_dir in source_dirs:
                source = Path(source_dir)
                if not source.exists():
                    logger.warning(f"目录不存在: {source}")
                    continue

                tf.add(source, arcname=source.name, filter=filter_func)

    def _calculate_checksum(self, file_path: Path) -> str:
        """计算文件 SHA256 校验和"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                sha256.update(chunk)
        return sha256.hexdigest()

    def restore_backup(self, backup_path: str, target_dir: str) -> list:
        """恢复备份

        Args:
            backup_path: 备份文件路径
            target_dir: 恢复目标目录

        Returns:
            恢复的文件列表
        """
        backup_path = Path(backup_path)
        target_dir = Path(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)

        # 验证校验和
        checksum_path = backup_path.with_suffix(backup_path.suffix + '.sha256')
        if checksum_path.exists():
            expected_checksum = checksum_path.read_text().split()[0]
            actual_checksum = self._calculate_checksum(backup_path)
            if expected_checksum != actual_checksum:
                raise ValueError("校验和不匹配，备份文件可能已损坏")
            logger.info("校验和验证通过")

        # 解压备份
        restored_files = []
        if zipfile.is_zipfile(backup_path):
            with zipfile.ZipFile(backup_path, 'r') as zf:
                zf.extractall(target_dir)
                restored_files = zf.namelist()
        elif tarfile.is_tarfile(backup_path):
            with tarfile.open(backup_path, 'r') as tf:
                tf.extractall(target_dir)
                restored_files = tf.getnames()

        logger.info(f"恢复完成: {len(restored_files)} 个文件")
        return restored_files

    def list_backups(self) -> list:
        """列出所有备份"""
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


# 使用示例
if __name__ == '__main__':
    manager = BackupManager('/tmp/backups')

    # 创建备份
    backup_path = manager.create_backup(
        source_dirs=['src', 'config'],
        format='zip',
        exclude_patterns=['*.pyc', '__pycache__', '.git', '*.log']
    )

    # 列出备份
    for backup in manager.list_backups():
        print(f"{backup['name']} - {backup['size']} bytes - {backup['mtime']}")

    # 恢复备份
    manager.restore_backup(backup_path, '/tmp/restored')
```

### 场景二：日志归档系统

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
    """日志归档系统"""

    def __init__(self, log_dir: str, archive_dir: str):
        self.log_dir = Path(log_dir)
        self.archive_dir = Path(archive_dir)
        self.archive_dir.mkdir(parents=True, exist_ok=True)

    def compress_old_logs(self, days_old: int = 7) -> list:
        """压缩超过指定天数的日志文件

        Args:
            days_old: 超过多少天的日志需要压缩

        Returns:
            压缩的文件列表
        """
        cutoff_date = datetime.now() - timedelta(days=days_old)
        compressed_files = []

        for log_file in self.log_dir.glob('*.log'):
            # 检查文件修改时间
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            if mtime < cutoff_date:
                # 压缩文件
                gz_path = log_file.with_suffix('.log.gz')

                with open(log_file, 'rb') as f_in:
                    with gzip.open(gz_path, 'wb', compresslevel=9) as f_out:
                        shutil.copyfileobj(f_in, f_out)

                # 删除原文件
                log_file.unlink()
                compressed_files.append(gz_path)
                logger.info(f"已压缩: {log_file.name} -> {gz_path.name}")

        return compressed_files

    def archive_monthly_logs(self) -> Path:
        """将上月的日志归档到单个 TAR.GZ 文件

        Returns:
            归档文件路径
        """
        # 计算上月的日期范围
        today = datetime.now()
        if today.month == 1:
            last_month = 12
            year = today.year - 1
        else:
            last_month = today.month - 1
            year = today.year

        archive_name = f"logs_{year}_{last_month:02d}.tar.gz"
        archive_path = self.archive_dir / archive_name

        # 查找上月的日志文件
        pattern = f"*_{year}-{last_month:02d}*.log*"
        log_files = list(self.log_dir.glob(pattern))

        if not log_files:
            logger.info(f"没有找到 {year}-{last_month:02d} 的日志文件")
            return None

        # 创建归档
        with tarfile.open(archive_path, 'w:gz', compresslevel=9) as tf:
            for log_file in log_files:
                tf.add(log_file, arcname=log_file.name)
                logger.info(f"归档: {log_file.name}")

        # 删除已归档的文件
        for log_file in log_files:
            log_file.unlink()

        logger.info(f"月度归档完成: {archive_path}")
        return archive_path

    def extract_logs_for_date(self, date: datetime, output_dir: str) -> list:
        """从归档中提取指定日期的日志

        Args:
            date: 目标日期
            output_dir: 输出目录

        Returns:
            提取的文件列表
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 查找对应的归档文件
        archive_name = f"logs_{date.year}_{date.month:02d}.tar.gz"
        archive_path = self.archive_dir / archive_name

        if not archive_path.exists():
            logger.warning(f"归档文件不存在: {archive_path}")
            return []

        # 日期模式
        date_pattern = date.strftime('%Y-%m-%d')
        extracted_files = []

        with tarfile.open(archive_path, 'r:gz') as tf:
            for member in tf.getmembers():
                if date_pattern in member.name:
                    tf.extract(member, output_path)
                    extracted_files.append(member.name)
                    logger.info(f"提取: {member.name}")

        return extracted_files

    def cleanup_old_archives(self, months_to_keep: int = 12):
        """清理超过指定月数的归档

        Args:
            months_to_keep: 保留多少个月的归档
        """
        cutoff_date = datetime.now() - timedelta(days=months_to_keep * 30)

        for archive in self.archive_dir.glob('logs_*.tar.gz'):
            # 解析归档日期
            try:
                parts = archive.stem.replace('logs_', '').split('_')
                archive_date = datetime(int(parts[0]), int(parts[1]), 1)

                if archive_date < cutoff_date:
                    archive.unlink()
                    logger.info(f"删除旧归档: {archive.name}")
            except (ValueError, IndexError):
                logger.warning(f"无法解析归档日期: {archive.name}")


# 使用示例
if __name__ == '__main__':
    archiver = LogArchiver('/var/log/myapp', '/var/log/myapp/archives')

    # 压缩 7 天前的日志
    archiver.compress_old_logs(days_old=7)

    # 归档上月日志
    archiver.archive_monthly_logs()

    # 提取特定日期的日志
    archiver.extract_logs_for_date(
        datetime(2024, 1, 15),
        '/tmp/extracted_logs'
    )

    # 清理超过 12 个月的归档
    archiver.cleanup_old_archives(months_to_keep=12)
```

### 场景三：软件发布打包工具

```python
import zipfile
import tarfile
import json
import hashlib
from pathlib import Path
from datetime import datetime
import platform


class ReleasePackager:
    """软件发布打包工具"""

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
        """创建发布包

        Args:
            version: 版本号
            include_patterns: 要包含的文件模式
            exclude_patterns: 要排除的文件模式
            platforms: 目标平台列表 ['windows', 'linux', 'macos']

        Returns:
            发布信息字典
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

        # 收集要打包的文件
        files_to_include = self._collect_files(include_patterns, exclude_patterns)

        # 为每个平台创建包
        for plat in platforms:
            package_info = self._create_platform_package(
                version, plat, files_to_include
            )
            release_info['packages'].append(package_info)

        # 保存发布信息
        release_json = self.output_dir / f'release_{version}.json'
        release_json.write_text(json.dumps(release_info, indent=2))

        return release_info

    def _collect_files(self, include_patterns, exclude_patterns) -> list:
        """收集要打包的文件"""
        files = set()

        for pattern in include_patterns:
            for path in self.project_dir.glob(pattern):
                if path.is_file():
                    # 检查是否应该排除
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
        """为特定平台创建包"""

        if platform_name == 'windows':
            # Windows 使用 ZIP
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

                # 添加版本信息
                zf.writestr('VERSION', version)

        else:
            # Linux/macOS 使用 TAR.GZ
            package_name = f"myapp_{version}_{platform_name}.tar.gz"
            package_path = self.output_dir / package_name

            with tarfile.open(package_path, 'w:gz', compresslevel=9) as tf:
                for file_path in files:
                    arcname = str(file_path.relative_to(self.project_dir))
                    tf.add(file_path, arcname)

                # 添加版本信息
                import io
                version_data = version.encode('utf-8')
                info = tarfile.TarInfo(name='VERSION')
                info.size = len(version_data)
                tf.addfile(info, io.BytesIO(version_data))

        # 计算校验和
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
        """验证发布包完整性"""
        release_info = json.loads(Path(release_json_path).read_text())

        all_valid = True
        for package in release_info['packages']:
            package_path = self.output_dir / package['filename']

            if not package_path.exists():
                print(f"文件不存在: {package['filename']}")
                all_valid = False
                continue

            # 验证校验和
            sha256 = hashlib.sha256()
            with open(package_path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    sha256.update(chunk)

            if sha256.hexdigest() == package['sha256']:
                print(f"验证通过: {package['filename']}")
            else:
                print(f"校验和不匹配: {package['filename']}")
                all_valid = False

        return all_valid


# 使用示例
if __name__ == '__main__':
    packager = ReleasePackager('/path/to/project', '/path/to/releases')

    # 创建发布包
    release_info = packager.create_release(
        version='1.0.0',
        include_patterns=['src/**/*.py', 'config/**/*.json', 'README.md'],
        exclude_patterns=['*.pyc', '__pycache__', 'tests'],
        platforms=['windows', 'linux', 'macos']
    )

    print(f"已创建 {len(release_info['packages'])} 个发布包")

    # 验证发布包
    packager.verify_release('/path/to/releases/release_1.0.0.json')
```

## 面试要点

### zipfile 和 tarfile 的主要区别是什么？

**答案：**
- **格式特点**：ZIP 是压缩归档格式，TAR 是纯归档格式（需配合 gzip/bz2/xz 压缩）
- **随机访问**：ZIP 支持随机访问单个文件，TAR 需要顺序扫描
- **元数据**：TAR 保留更多 Unix 文件系统元数据（权限、所有者、符号链接等）
- **平台兼容**：ZIP 在 Windows 上更通用，TAR 在 Unix/Linux 更常见
- **使用场景**：ZIP 适合跨平台分享，TAR.GZ 适合 Unix 系统备份

### 如何安全地解压不受信任的归档文件？

**答案：**
```python
import zipfile
from pathlib import Path

def safe_extract(archive_path, target_dir):
    """安全解压归档文件"""
    target = Path(target_dir).resolve()
    target.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(archive_path, 'r') as zf:
        for member in zf.namelist():
            # 1. 检查路径遍历攻击
            member_path = target / member
            if not str(member_path.resolve()).startswith(str(target)):
                raise ValueError(f"非法路径: {member}")

            # 2. 检查文件大小（防止 zip bomb）
            info = zf.getinfo(member)
            if info.file_size > 100 * 1024 * 1024:  # 100MB 限制
                raise ValueError(f"文件过大: {member}")

            # 3. 检查压缩比（防止高压缩比炸弹）
            if info.compress_size > 0:
                ratio = info.file_size / info.compress_size
                if ratio > 100:  # 压缩比超过 100:1
                    raise ValueError(f"可疑的压缩比: {member}")

        zf.extractall(target)
```

关键点：
- 防止路径遍历攻击
- 限制文件大小
- 检查压缩比（防止 zip bomb）
- TAR 还需注意符号链接攻击

### 如何处理大文件压缩/解压的内存问题？

**答案：**
```python
# 分块处理
def compress_large_file(input_path, output_path, chunk_size=1024*1024):
    import gzip

    with open(input_path, 'rb') as f_in:
        with gzip.open(output_path, 'wb') as f_out:
            while True:
                chunk = f_in.read(chunk_size)
                if not chunk:
                    break
                f_out.write(chunk)

# 流式处理 TAR
with tarfile.open('large.tar.gz', 'r|gz') as tf:  # 使用 '|' 流式模式
    for member in tf:
        if member.isfile():
            f = tf.extractfile(member)
            # 分块读取处理
```

关键技术：
- 分块读写
- 使用流式模式（TAR 的 `r|gz` 而非 `r:gz`）
- 避免一次性加载整个文件到内存

### 比较不同压缩算法的优缺点？

**答案：**

| 算法 | 压缩比 | 速度 | 内存 | 适用场景 |
|------|--------|------|------|----------|
| DEFLATE (ZIP) | 中 | 快 | 低 | 通用场景 |
| GZIP | 中 | 快 | 低 | 单文件压缩 |
| BZ2 | 高 | 慢 | 较高 | 需要高压缩比 |
| LZMA/XZ | 最高 | 最慢 | 高 | 归档存储 |
| ZSTD | 高 | 快 | 中 | 现代替代方案 |

选择建议：
- 日常使用：GZIP/ZIP（平衡）
- 网络传输：GZIP（快速）
- 长期存储：XZ（最高压缩比）
- 高性能需求：ZSTD（需第三方库）

### 如何创建加密的 ZIP 文件？

**答案：**
```python
# Python 标准库 zipfile 只支持解密，不支持创建加密 ZIP
# 需要使用第三方库 pyzipper

import pyzipper

# 创建加密 ZIP
with pyzipper.AESZipFile('encrypted.zip', 'w',
                          compression=pyzipper.ZIP_DEFLATED,
                          encryption=pyzipper.WZ_AES) as zf:
    zf.setpassword(b'secret123')
    zf.write('sensitive.txt')

# 解压加密 ZIP（标准库也可以）
import zipfile
with zipfile.ZipFile('encrypted.zip', 'r') as zf:
    zf.extractall(pwd=b'secret123')
```

注意事项：
- 标准库 zipfile 只支持传统 PKZIP 加密（不安全）
- 推荐使用 AES-256 加密
- 敏感数据建议额外加密后再压缩

## 延伸阅读

### 官方文档
- [zipfile - Python 官方文档](https://docs.python.org/3/library/zipfile.html)
- [tarfile - Python 官方文档](https://docs.python.org/3/library/tarfile.html)
- [gzip - Python 官方文档](https://docs.python.org/3/library/gzip.html)
- [bz2 - Python 官方文档](https://docs.python.org/3/library/bz2.html)
- [lzma - Python 官方文档](https://docs.python.org/3/library/lzma.html)

### 压缩格式规范
- [ZIP 文件格式规范](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- [TAR 文件格式](https://www.gnu.org/software/tar/manual/html_node/Standard.html)
- [GZIP 文件格式规范 (RFC 1952)](https://tools.ietf.org/html/rfc1952)

### 第三方库
- [pyzipper](https://github.com/danifus/pyzipper) - 支持 AES 加密的 ZIP 库
- [py7zr](https://github.com/miurahr/py7zr) - 7z 格式支持
- [rarfile](https://github.com/markokr/rarfile) - RAR 格式支持
- [zstandard](https://github.com/indygreg/python-zstandard) - Zstandard 压缩支持

### 安全相关
- [ZIP Bomb 攻击原理与防护](https://en.wikipedia.org/wiki/Zip_bomb)
- [TAR 路径遍历漏洞 (CVE-2007-4559)](https://nvd.nist.gov/vuln/detail/CVE-2007-4559)
- [Python tarfile 安全提取过滤器 (PEP 706)](https://peps.python.org/pep-0706/)
