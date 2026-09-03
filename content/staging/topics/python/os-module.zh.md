---
title: Python os 模块系统操作
description: 掌握 Python os 模块进行文件系统操作、环境变量、进程管理等系统级编程
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - os
  - 文件系统
  - 系统编程
status: imported
origin: old/src/content/docs/python/os-module.zh.md
divergence: 0.263
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 34
  lastUpdated: 2026-01-07
---

`os` 模块是 Python 标准库中最重要的模块之一，提供了与操作系统交互的便携式方法。无论是文件操作、目录管理、环境变量访问还是进程控制，`os` 模块都是系统级编程的核心工具。

## 为什么使用 os 模块

`os` 模块的设计目标是提供跨平台的操作系统接口：

```python
import os

# 获取当前工作目录
print(os.getcwd())  # /home/user/project

# 列出目录内容
print(os.listdir('.'))  # ['file1.txt', 'folder', 'script.py']

# 获取环境变量
print(os.environ.get('HOME'))  # /home/user

# 执行系统命令
os.system('echo "Hello from shell"')
```

`os` 模块的主要优势：

- **跨平台兼容**：同一代码可在 Windows、Linux、macOS 上运行
- **底层访问**：提供对操作系统功能的直接访问
- **功能全面**：涵盖文件、目录、进程、环境变量等各方面
- **标准库内置**：无需安装额外依赖

## os 模块概览

`os` 模块包含多个子模块和大量函数，主要分为以下几类：

| 类别 | 主要功能 | 常用函数 |
|------|----------|----------|
| 文件操作 | 文件的创建、删除、重命名 | `remove()`, `rename()`, `link()` |
| 目录操作 | 目录的创建、删除、遍历 | `mkdir()`, `rmdir()`, `listdir()` |
| 路径处理 | 路径的解析和操作 | `os.path.join()`, `os.path.exists()` |
| 环境变量 | 环境变量的读写 | `environ`, `getenv()`, `putenv()` |
| 进程管理 | 进程的创建和控制 | `fork()`, `exec()`, `kill()` |
| 文件描述符 | 底层文件操作 | `open()`, `read()`, `write()`, `close()` |

## 文件操作

### 基本文件操作

```python
import os

# 检查文件是否存在
if os.path.exists('example.txt'):
    print("文件存在")

# 获取文件信息
stat_info = os.stat('example.txt')
print(f"文件大小: {stat_info.st_size} 字节")
print(f"修改时间: {stat_info.st_mtime}")
print(f"权限模式: {oct(stat_info.st_mode)}")

# 删除文件
os.remove('temp.txt')

# 重命名文件
os.rename('old_name.txt', 'new_name.txt')

# 创建硬链接
os.link('original.txt', 'hardlink.txt')

# 创建符号链接
os.symlink('original.txt', 'symlink.txt')
```

### 文件属性与权限

```python
import os
import stat

# 获取文件状态
file_stat = os.stat('example.txt')

# 访问文件属性
print(f"Inode 号: {file_stat.st_ino}")
print(f"设备标识: {file_stat.st_dev}")
print(f"硬链接数: {file_stat.st_nlink}")
print(f"所有者 UID: {file_stat.st_uid}")
print(f"所有者 GID: {file_stat.st_gid}")
print(f"文件大小: {file_stat.st_size}")
print(f"最后访问时间: {file_stat.st_atime}")
print(f"最后修改时间: {file_stat.st_mtime}")
print(f"元数据更改时间: {file_stat.st_ctime}")

# 检查文件类型
mode = file_stat.st_mode
print(f"是否为普通文件: {stat.S_ISREG(mode)}")
print(f"是否为目录: {stat.S_ISDIR(mode)}")
print(f"是否为符号链接: {stat.S_ISLNK(mode)}")
print(f"是否为套接字: {stat.S_ISSOCK(mode)}")
print(f"是否为 FIFO: {stat.S_ISFIFO(mode)}")
print(f"是否为块设备: {stat.S_ISBLK(mode)}")
print(f"是否为字符设备: {stat.S_ISCHR(mode)}")
```

### 修改文件权限

```python
import os
import stat

# 更改文件权限
# 设置为 -rw-r--r-- (644)
os.chmod('example.txt', stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

# 或使用八进制表示
os.chmod('example.txt', 0o644)

# 更改文件所有者（需要 root 权限）
try:
    os.chown('example.txt', uid=1000, gid=1000)
except PermissionError:
    print("需要管理员权限")

# 修改文件时间戳
import time
current_time = time.time()
# 设置访问时间和修改时间
os.utime('example.txt', (current_time, current_time))

# 使用 None 设置为当前时间
os.utime('example.txt', None)
```

### 符号链接操作

```python
import os

# 创建符号链接
os.symlink('/path/to/target', '/path/to/link')

# 读取符号链接目标
target = os.readlink('/path/to/link')
print(f"链接指向: {target}")

# 获取符号链接本身的信息（不跟随链接）
link_stat = os.lstat('/path/to/link')

# 检查是否为符号链接
print(os.path.islink('/path/to/link'))  # True

# 获取符号链接指向的真实路径
real_path = os.path.realpath('/path/to/link')
print(f"真实路径: {real_path}")
```

## 目录操作

### 创建和删除目录

```python
import os

# 创建单个目录
os.mkdir('new_directory')

# 创建目录并指定权限
os.mkdir('secure_dir', mode=0o700)

# 创建多级目录
os.makedirs('parent/child/grandchild')

# 创建多级目录（如果已存在不报错）
os.makedirs('parent/child/grandchild', exist_ok=True)

# 删除空目录
os.rmdir('empty_directory')

# 删除多级空目录
os.removedirs('parent/child/grandchild')

# 注意：removedirs 会从最深层开始删除，直到遇到非空目录
```

### 目录遍历

```python
import os

# 列出目录内容
entries = os.listdir('.')
for entry in entries:
    print(entry)

# 使用 scandir 获取更多信息（推荐，效率更高）
with os.scandir('.') as entries:
    for entry in entries:
        print(f"名称: {entry.name}")
        print(f"路径: {entry.path}")
        print(f"是文件: {entry.is_file()}")
        print(f"是目录: {entry.is_dir()}")
        print(f"是符号链接: {entry.is_symlink()}")
        # 获取文件状态（无需额外系统调用）
        stat_info = entry.stat()
        print(f"大小: {stat_info.st_size}")
        print("---")
```

### os.walk() 深度遍历

`os.walk()` 是遍历目录树的强大工具，它生成目录树中的文件名：

```python
import os

# 基本用法
for root, dirs, files in os.walk('/path/to/directory'):
    print(f"当前目录: {root}")
    print(f"子目录: {dirs}")
    print(f"文件: {files}")
    print("---")

# 打印完整路径
for root, dirs, files in os.walk('.'):
    for file in files:
        full_path = os.path.join(root, file)
        print(full_path)
```

#### os.walk() 高级用法

```python
import os

# 自顶向下遍历（默认）
for root, dirs, files in os.walk('.', topdown=True):
    # 可以原地修改 dirs 来控制遍历
    # 排除隐藏目录
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    # 排除 __pycache__ 目录
    if '__pycache__' in dirs:
        dirs.remove('__pycache__')

    for file in files:
        print(os.path.join(root, file))

# 自底向上遍历
for root, dirs, files in os.walk('.', topdown=False):
    # 在自底向上模式下，可以安全删除目录
    for dir_name in dirs:
        dir_path = os.path.join(root, dir_name)
        try:
            os.rmdir(dir_path)
        except OSError:
            pass  # 目录非空

# 跟随符号链接
for root, dirs, files in os.walk('.', followlinks=True):
    # 注意：可能导致无限循环
    print(root)

# 处理错误
def handle_error(error):
    print(f"遍历错误: {error}")

for root, dirs, files in os.walk('.', onerror=handle_error):
    pass
```

#### os.walk() 实用示例

```python
import os

def find_files_by_extension(directory, extension):
    """查找指定扩展名的所有文件"""
    matching_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(extension):
                matching_files.append(os.path.join(root, file))
    return matching_files

# 查找所有 Python 文件
python_files = find_files_by_extension('.', '.py')
for f in python_files:
    print(f)

def calculate_directory_size(directory):
    """计算目录总大小"""
    total_size = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                total_size += os.path.getsize(file_path)
            except OSError:
                pass
    return total_size

size = calculate_directory_size('.')
print(f"目录大小: {size / 1024 / 1024:.2f} MB")

def find_large_files(directory, min_size_mb=100):
    """查找大于指定大小的文件"""
    min_size = min_size_mb * 1024 * 1024
    large_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                size = os.path.getsize(file_path)
                if size > min_size:
                    large_files.append((file_path, size))
            except OSError:
                pass
    return sorted(large_files, key=lambda x: x[1], reverse=True)

# 查找大于 100MB 的文件
for path, size in find_large_files('/home/user', 100):
    print(f"{path}: {size / 1024 / 1024:.2f} MB")
```

### 当前工作目录

```python
import os

# 获取当前工作目录
cwd = os.getcwd()
print(f"当前目录: {cwd}")

# 更改当前工作目录
os.chdir('/tmp')
print(f"新目录: {os.getcwd()}")

# 使用上下文管理器临时更改目录
from contextlib import contextmanager

@contextmanager
def change_directory(path):
    """临时更改工作目录的上下文管理器"""
    original = os.getcwd()
    try:
        os.chdir(path)
        yield
    finally:
        os.chdir(original)

# 使用示例
print(f"当前: {os.getcwd()}")
with change_directory('/tmp'):
    print(f"临时: {os.getcwd()}")
print(f"恢复: {os.getcwd()}")
```

## 路径处理 (os.path)

`os.path` 子模块提供了丰富的路径操作功能：

### 路径拼接与分解

```python
import os.path

# 路径拼接（自动处理分隔符）
path = os.path.join('/home', 'user', 'documents', 'file.txt')
print(path)  # /home/user/documents/file.txt

# 获取目录名
dirname = os.path.dirname('/home/user/file.txt')
print(dirname)  # /home/user

# 获取文件名
basename = os.path.basename('/home/user/file.txt')
print(basename)  # file.txt

# 分离目录和文件名
directory, filename = os.path.split('/home/user/file.txt')
print(directory)  # /home/user
print(filename)   # file.txt

# 分离文件名和扩展名
name, ext = os.path.splitext('document.tar.gz')
print(name)  # document.tar
print(ext)   # .gz

# 分离驱动器（Windows）
drive, path = os.path.splitdrive('C:\\Users\\Admin\\file.txt')
print(drive)  # C:
print(path)   # \Users\Admin\file.txt
```

### 路径判断

```python
import os.path

path = '/home/user/documents'

# 检查路径是否存在
print(os.path.exists(path))  # True/False

# 检查是否为文件
print(os.path.isfile(path))  # False

# 检查是否为目录
print(os.path.isdir(path))  # True

# 检查是否为符号链接
print(os.path.islink(path))  # False

# 检查是否为绝对路径
print(os.path.isabs(path))  # True
print(os.path.isabs('relative/path'))  # False

# 检查是否为挂载点
print(os.path.ismount('/'))  # True
```

### 路径转换

```python
import os.path

# 获取绝对路径
abs_path = os.path.abspath('relative/path')
print(abs_path)  # /home/user/project/relative/path

# 获取规范化路径（解析 . 和 ..）
normalized = os.path.normpath('/home/user/../user/./documents')
print(normalized)  # /home/user/documents

# 获取真实路径（解析符号链接）
real = os.path.realpath('/path/to/symlink')
print(real)  # /actual/target/path

# 展开用户目录 ~
expanded = os.path.expanduser('~/documents')
print(expanded)  # /home/user/documents

# 展开环境变量
expanded = os.path.expandvars('$HOME/documents')
print(expanded)  # /home/user/documents

# 计算相对路径
relative = os.path.relpath('/home/user/documents', '/home/user')
print(relative)  # documents

# 获取公共前缀路径
common = os.path.commonpath(['/home/user/a', '/home/user/b'])
print(common)  # /home/user

# 获取公共前缀（字符级别，可能不是有效路径）
prefix = os.path.commonprefix(['/home/user1', '/home/user2'])
print(prefix)  # /home/user
```

### 路径信息

```python
import os.path

# 获取文件大小
size = os.path.getsize('/path/to/file')
print(f"文件大小: {size} 字节")

# 获取修改时间
mtime = os.path.getmtime('/path/to/file')
print(f"修改时间戳: {mtime}")

# 获取访问时间
atime = os.path.getatime('/path/to/file')
print(f"访问时间戳: {atime}")

# 获取元数据更改时间
ctime = os.path.getctime('/path/to/file')
print(f"创建/更改时间戳: {ctime}")

# 检查两个路径是否指向同一文件
print(os.path.samefile('/path/to/file', '/path/to/link'))

# 检查两个文件描述符是否指向同一文件
# os.path.sameopenfile(fd1, fd2)

# 检查两个 stat 结果是否指向同一文件
# os.path.samestat(stat1, stat2)
```

## 环境变量

### 访问环境变量

```python
import os

# 获取所有环境变量（字典形式）
all_vars = os.environ
for key, value in all_vars.items():
    print(f"{key}={value}")

# 获取特定环境变量
home = os.environ['HOME']
print(f"HOME: {home}")

# 安全获取环境变量（不存在时返回默认值）
db_host = os.environ.get('DB_HOST', 'localhost')
print(f"数据库主机: {db_host}")

# 使用 getenv（与 environ.get 功能相同）
path = os.getenv('PATH')
print(f"PATH: {path}")

# 获取字节形式的环境变量
path_bytes = os.environb.get(b'PATH')
```

### 修改环境变量

```python
import os

# 设置环境变量
os.environ['MY_VAR'] = 'my_value'

# 验证设置
print(os.environ['MY_VAR'])  # my_value

# 使用 putenv（不推荐，不会更新 os.environ）
# os.putenv('MY_VAR', 'value')

# 删除环境变量
del os.environ['MY_VAR']

# 安全删除（如果存在）
os.environ.pop('MY_VAR', None)

# 批量设置
os.environ.update({
    'APP_ENV': 'production',
    'DEBUG': 'false',
    'LOG_LEVEL': 'info'
})
```

### 环境变量最佳实践

```python
import os
from typing import Optional

class Config:
    """基于环境变量的配置类"""

    @staticmethod
    def get_string(key: str, default: str = '') -> str:
        return os.environ.get(key, default)

    @staticmethod
    def get_int(key: str, default: int = 0) -> int:
        value = os.environ.get(key)
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            return default

    @staticmethod
    def get_bool(key: str, default: bool = False) -> bool:
        value = os.environ.get(key)
        if value is None:
            return default
        return value.lower() in ('true', '1', 'yes', 'on')

    @staticmethod
    def get_list(key: str, separator: str = ',', default: Optional[list] = None) -> list:
        value = os.environ.get(key)
        if value is None:
            return default or []
        return [item.strip() for item in value.split(separator)]

# 使用示例
config = Config()
debug = config.get_bool('DEBUG', False)
port = config.get_int('PORT', 8080)
hosts = config.get_list('ALLOWED_HOSTS', ',', ['localhost'])

print(f"调试模式: {debug}")
print(f"端口: {port}")
print(f"允许的主机: {hosts}")
```

## 进程管理

### 进程信息

```python
import os

# 获取当前进程 ID
pid = os.getpid()
print(f"进程 ID: {pid}")

# 获取父进程 ID
ppid = os.getppid()
print(f"父进程 ID: {ppid}")

# 获取进程组 ID
pgid = os.getpgrp()
print(f"进程组 ID: {pgid}")

# 获取用户 ID（Unix）
try:
    uid = os.getuid()
    euid = os.geteuid()
    print(f"用户 ID: {uid}")
    print(f"有效用户 ID: {euid}")

    # 获取组 ID
    gid = os.getgid()
    egid = os.getegid()
    print(f"组 ID: {gid}")
    print(f"有效组 ID: {egid}")

    # 获取所有组
    groups = os.getgroups()
    print(f"所属组: {groups}")
except AttributeError:
    print("Windows 系统不支持这些操作")

# 获取登录用户名
try:
    login = os.getlogin()
    print(f"登录用户: {login}")
except OSError:
    print("无法获取登录用户")
```

### 创建子进程 (Unix)

```python
import os
import sys

# fork() 创建子进程
try:
    pid = os.fork()

    if pid == 0:
        # 子进程
        print(f"子进程 PID: {os.getpid()}")
        print(f"父进程 PID: {os.getppid()}")
        os._exit(0)  # 子进程退出
    else:
        # 父进程
        print(f"父进程 PID: {os.getpid()}")
        print(f"创建的子进程 PID: {pid}")
        # 等待子进程结束
        child_pid, status = os.wait()
        print(f"子进程 {child_pid} 退出，状态: {status}")
except AttributeError:
    print("Windows 不支持 fork()")
```

### exec 系列函数

```python
import os

# exec 函数用新程序替换当前进程
# 注意：exec 后的代码不会执行

# execv - 使用列表参数
# os.execv('/bin/ls', ['ls', '-la'])

# execve - 使用列表参数和自定义环境变量
# os.execve('/bin/ls', ['ls', '-la'], {'PATH': '/bin'})

# execvp - 使用 PATH 搜索程序
# os.execvp('ls', ['ls', '-la'])

# execl - 使用多个参数
# os.execl('/bin/ls', 'ls', '-la')

# execlp - 使用 PATH 搜索并使用多个参数
# os.execlp('ls', 'ls', '-la')

# 安全示例：先 fork 再 exec
try:
    pid = os.fork()
    if pid == 0:
        # 子进程执行新程序
        os.execlp('echo', 'echo', 'Hello from child process')
    else:
        # 父进程等待
        os.wait()
        print("子进程完成")
except AttributeError:
    print("Windows 不支持此操作")
```

### 信号处理

```python
import os
import signal

# 发送信号到进程
def send_signal_example():
    pid = 12345  # 目标进程 ID

    # 发送 SIGTERM 信号
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        print("进程不存在")
    except PermissionError:
        print("没有权限发送信号")

# 发送信号到进程组
def send_signal_to_group():
    pgid = 12345  # 进程组 ID
    try:
        os.killpg(pgid, signal.SIGTERM)
    except (ProcessLookupError, PermissionError) as e:
        print(f"错误: {e}")

# 检查进程是否存在
def process_exists(pid):
    try:
        os.kill(pid, 0)  # 信号 0 不发送任何信号，但会检查进程
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True  # 进程存在但没有权限

# 使用示例
print(f"进程 1 存在: {process_exists(1)}")
```

### 使用 system() 执行命令

```python
import os

# 执行 shell 命令
exit_code = os.system('echo "Hello, World!"')
print(f"退出码: {exit_code}")

# 注意：os.system() 有安全风险，推荐使用 subprocess 模块
# 推荐使用 subprocess
import subprocess

result = subprocess.run(['echo', 'Hello, World!'], capture_output=True, text=True)
print(result.stdout)
```

## 系统信息

### 操作系统信息

```python
import os

# 操作系统名称
print(f"系统名称: {os.name}")  # 'posix', 'nt', 'java'

# 详细系统信息（Unix）
try:
    uname = os.uname()
    print(f"系统: {uname.sysname}")
    print(f"节点名: {uname.nodename}")
    print(f"发行版: {uname.release}")
    print(f"版本: {uname.version}")
    print(f"架构: {uname.machine}")
except AttributeError:
    print("Windows 使用 platform 模块获取系统信息")
    import platform
    print(f"系统: {platform.system()}")
    print(f"版本: {platform.version()}")

# CPU 数量
cpu_count = os.cpu_count()
print(f"CPU 核心数: {cpu_count}")

# 系统负载（Unix）
try:
    load_avg = os.getloadavg()
    print(f"系统负载 (1, 5, 15 分钟): {load_avg}")
except AttributeError:
    print("Windows 不支持 getloadavg()")
```

### 终端信息

```python
import os

# 获取终端大小
try:
    size = os.get_terminal_size()
    print(f"终端大小: {size.columns} 列 x {size.lines} 行")
except OSError:
    print("不在终端环境中")

# 检查文件描述符是否连接到终端
print(f"stdin 是终端: {os.isatty(0)}")
print(f"stdout 是终端: {os.isatty(1)}")
print(f"stderr 是终端: {os.isatty(2)}")

# 获取控制终端名称（Unix）
try:
    tty = os.ctermid()
    print(f"控制终端: {tty}")
except AttributeError:
    pass
```

### 随机数据

```python
import os

# 获取随机字节（用于加密）
random_bytes = os.urandom(16)
print(f"随机字节: {random_bytes.hex()}")

# 生成随机 token
def generate_token(length=32):
    return os.urandom(length).hex()

token = generate_token()
print(f"Token: {token}")

# 生成安全的随机整数
import struct

def secure_random_int(min_val=0, max_val=100):
    range_size = max_val - min_val + 1
    random_bytes = os.urandom(4)
    random_int = struct.unpack('I', random_bytes)[0]
    return min_val + (random_int % range_size)

print(f"随机整数: {secure_random_int(1, 100)}")
```

## 文件描述符操作

`os` 模块提供了底层的文件描述符操作：

```python
import os

# 打开文件获取文件描述符
fd = os.open('example.txt', os.O_RDWR | os.O_CREAT, 0o644)

# 写入数据
data = b"Hello, World!\n"
bytes_written = os.write(fd, data)
print(f"写入 {bytes_written} 字节")

# 移动文件指针到开头
os.lseek(fd, 0, os.SEEK_SET)

# 读取数据
content = os.read(fd, 100)
print(f"读取内容: {content}")

# 同步数据到磁盘
os.fsync(fd)

# 关闭文件描述符
os.close(fd)

# 复制文件描述符
# new_fd = os.dup(fd)
# os.dup2(fd, new_fd)
```

### 文件描述符标志

```python
import os

# 常用的打开标志
flags = (
    os.O_RDONLY,    # 只读
    os.O_WRONLY,    # 只写
    os.O_RDWR,      # 读写
    os.O_APPEND,    # 追加
    os.O_CREAT,     # 创建
    os.O_EXCL,      # 与 O_CREAT 一起使用，文件存在则失败
    os.O_TRUNC,     # 截断
    os.O_NONBLOCK,  # 非阻塞（Unix）
    os.O_SYNC,      # 同步写入（Unix）
)

# 创建临时文件
fd = os.open('temp.txt', os.O_RDWR | os.O_CREAT | os.O_EXCL, 0o600)
os.write(fd, b"Temporary data")
os.close(fd)
os.remove('temp.txt')
```

## 实用示例

### 示例1：递归删除目录

```python
import os

def remove_directory(path):
    """递归删除目录及其所有内容"""
    if not os.path.exists(path):
        return

    for root, dirs, files in os.walk(path, topdown=False):
        # 先删除文件
        for file in files:
            file_path = os.path.join(root, file)
            try:
                os.remove(file_path)
                print(f"删除文件: {file_path}")
            except OSError as e:
                print(f"无法删除文件 {file_path}: {e}")

        # 再删除目录
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            try:
                os.rmdir(dir_path)
                print(f"删除目录: {dir_path}")
            except OSError as e:
                print(f"无法删除目录 {dir_path}: {e}")

    # 最后删除根目录
    try:
        os.rmdir(path)
        print(f"删除目录: {path}")
    except OSError as e:
        print(f"无法删除目录 {path}: {e}")

# 使用示例
remove_directory('temp_folder')

# 注意：生产环境推荐使用 shutil.rmtree()
import shutil
# shutil.rmtree('temp_folder')
```

### 示例2：文件监控

```python
import os
import time
from datetime import datetime

def monitor_directory(path, interval=1):
    """监控目录变化"""
    print(f"开始监控目录: {path}")

    # 记录初始状态
    previous_state = {}
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                previous_state[file_path] = os.path.getmtime(file_path)
            except OSError:
                pass

    while True:
        time.sleep(interval)
        current_state = {}

        for root, dirs, files in os.walk(path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    mtime = os.path.getmtime(file_path)
                    current_state[file_path] = mtime

                    if file_path not in previous_state:
                        print(f"[{datetime.now()}] 新建: {file_path}")
                    elif previous_state[file_path] != mtime:
                        print(f"[{datetime.now()}] 修改: {file_path}")
                except OSError:
                    pass

        # 检测删除的文件
        for file_path in previous_state:
            if file_path not in current_state:
                print(f"[{datetime.now()}] 删除: {file_path}")

        previous_state = current_state

# 使用示例（Ctrl+C 停止）
# monitor_directory('.', interval=2)
```

### 示例3：磁盘空间分析

```python
import os

def analyze_disk_space(path):
    """分析目录的磁盘空间使用情况"""
    results = {}

    for root, dirs, files in os.walk(path):
        dir_size = 0
        for file in files:
            file_path = os.path.join(root, file)
            try:
                dir_size += os.path.getsize(file_path)
            except OSError:
                pass
        results[root] = dir_size

    # 按大小排序
    sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)

    print("目录大小分析")
    print("=" * 60)
    for dir_path, size in sorted_results[:20]:  # 只显示前 20 个
        size_mb = size / 1024 / 1024
        print(f"{size_mb:10.2f} MB  {dir_path}")

    # 总大小
    total_size = sum(results.values())
    print("=" * 60)
    print(f"{total_size / 1024 / 1024:10.2f} MB  总计")

    return results

# 使用示例
analyze_disk_space('.')
```

### 示例4：批量修改文件权限

```python
import os
import stat

def fix_permissions(path, file_mode=0o644, dir_mode=0o755):
    """递归修复文件和目录权限"""
    for root, dirs, files in os.walk(path):
        # 修复目录权限
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            try:
                current_mode = os.stat(dir_path).st_mode
                if stat.S_IMODE(current_mode) != dir_mode:
                    os.chmod(dir_path, dir_mode)
                    print(f"修复目录权限: {dir_path}")
            except OSError as e:
                print(f"无法修改 {dir_path}: {e}")

        # 修复文件权限
        for file in files:
            file_path = os.path.join(root, file)
            try:
                current_mode = os.stat(file_path).st_mode
                if stat.S_IMODE(current_mode) != file_mode:
                    os.chmod(file_path, file_mode)
                    print(f"修复文件权限: {file_path}")
            except OSError as e:
                print(f"无法修改 {file_path}: {e}")

# 使用示例
fix_permissions('project', file_mode=0o644, dir_mode=0o755)
```

### 示例5：环境变量配置加载

```python
import os

def load_env_file(filepath='.env'):
    """从 .env 文件加载环境变量"""
    if not os.path.exists(filepath):
        print(f"配置文件不存在: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        for line_number, line in enumerate(f, 1):
            line = line.strip()

            # 跳过空行和注释
            if not line or line.startswith('#'):
                continue

            # 解析 KEY=VALUE 格式
            if '=' not in line:
                print(f"警告: 第 {line_number} 行格式错误: {line}")
                continue

            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()

            # 移除引号
            if (value.startswith('"') and value.endswith('"')) or \
               (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]

            # 设置环境变量
            os.environ[key] = value
            print(f"加载: {key}={'*' * min(len(value), 8)}")

    return True

def save_env_file(filepath='.env', variables=None):
    """将环境变量保存到文件"""
    if variables is None:
        variables = {}

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("# 环境变量配置文件\n")
        f.write("# 由程序自动生成\n\n")

        for key, value in variables.items():
            # 如果值包含空格或特殊字符，添加引号
            if ' ' in value or '#' in value:
                value = f'"{value}"'
            f.write(f"{key}={value}\n")

    print(f"配置已保存到: {filepath}")

# 使用示例
load_env_file('.env')

save_env_file('.env.example', {
    'DATABASE_URL': 'postgresql://localhost/mydb',
    'SECRET_KEY': 'your-secret-key',
    'DEBUG': 'false'
})
```

## os 与 pathlib 的选择

Python 3.4 引入了 `pathlib` 模块，提供了面向对象的路径操作方式。以下是两者的对比：

| 场景 | 推荐使用 |
|------|----------|
| 路径操作（拼接、分解、判断） | `pathlib` |
| 文件读写 | `pathlib` 或内置 `open()` |
| 目录遍历 | `pathlib.Path.glob()` 或 `os.walk()` |
| 环境变量 | `os.environ` |
| 进程管理 | `os` 或 `subprocess` |
| 底层文件描述符 | `os` |
| 系统信息 | `os` |

```python
# 现代 Python 代码通常混合使用
from pathlib import Path
import os

# 使用 pathlib 处理路径
config_path = Path.home() / '.config' / 'myapp' / 'config.yaml'

# 使用 os 处理环境变量
debug = os.environ.get('DEBUG', 'false').lower() == 'true'

# 使用 os.walk 进行复杂遍历
for root, dirs, files in os.walk('.'):
    # 使用 pathlib 处理具体路径
    root_path = Path(root)
    for file in files:
        file_path = root_path / file
        if file_path.suffix == '.py':
            print(file_path)
```

## 最佳实践

### 使用 with 语句管理资源

```python
import os

# 推荐：使用 scandir 的上下文管理器
with os.scandir('.') as entries:
    for entry in entries:
        print(entry.name)

# 不推荐：手动管理迭代器
# entries = os.scandir('.')
# for entry in entries:
#     print(entry.name)
# entries.close()
```

### 处理跨平台兼容性

```python
import os

# 使用 os.path.join 而不是硬编码分隔符
path = os.path.join('dir', 'subdir', 'file.txt')

# 使用 os.sep 获取路径分隔符
print(f"路径分隔符: {os.sep}")

# 使用 os.linesep 获取行分隔符
print(f"行分隔符: {repr(os.linesep)}")

# 使用 os.pathsep 获取路径列表分隔符
print(f"路径列表分隔符: {os.pathsep}")

# 检查操作系统类型
if os.name == 'nt':
    print("Windows 系统")
elif os.name == 'posix':
    print("Unix/Linux/macOS 系统")
```

### 安全地处理文件操作

```python
import os

def safe_remove(path):
    """安全删除文件"""
    try:
        os.remove(path)
        return True
    except FileNotFoundError:
        return False
    except PermissionError:
        print(f"没有权限删除: {path}")
        return False
    except IsADirectoryError:
        print(f"这是目录，请使用 rmdir: {path}")
        return False

def safe_mkdir(path, mode=0o755):
    """安全创建目录"""
    try:
        os.makedirs(path, mode=mode, exist_ok=True)
        return True
    except PermissionError:
        print(f"没有权限创建目录: {path}")
        return False
    except OSError as e:
        print(f"创建目录失败: {e}")
        return False
```

### 避免安全漏洞

```python
import os
import shlex

# 危险：直接拼接用户输入到命令
# user_input = input("文件名: ")
# os.system(f"cat {user_input}")  # 可能被注入恶意命令

# 安全：使用 subprocess 和列表参数
import subprocess

user_input = "safe_file.txt"
result = subprocess.run(['cat', user_input], capture_output=True, text=True)

# 或者使用 shlex.quote 转义
# os.system(f"cat {shlex.quote(user_input)}")
```

### 使用临时文件和目录

```python
import os
import tempfile

# 创建临时文件
fd, path = tempfile.mkstemp(suffix='.txt', prefix='myapp_')
try:
    os.write(fd, b"临时数据")
finally:
    os.close(fd)
    os.remove(path)

# 创建临时目录
temp_dir = tempfile.mkdtemp(prefix='myapp_')
try:
    # 在临时目录中工作
    temp_file = os.path.join(temp_dir, 'data.txt')
    with open(temp_file, 'w') as f:
        f.write("临时文件内容")
finally:
    # 清理
    import shutil
    shutil.rmtree(temp_dir)
```

## 总结

`os` 模块是 Python 系统编程的基石，提供了全面的操作系统接口。要点回顾：

- **文件操作**：使用 `os.remove()`, `os.rename()`, `os.stat()` 进行基本文件操作
- **目录操作**：使用 `os.mkdir()`, `os.makedirs()`, `os.listdir()`, `os.walk()` 管理目录
- **路径处理**：使用 `os.path` 子模块进行路径拼接、分解和判断
- **环境变量**：使用 `os.environ` 字典读写环境变量
- **进程管理**：使用 `os.fork()`, `os.exec*()`, `os.kill()` 等（Unix 系统）
- **权限管理**：使用 `os.chmod()`, `os.chown()` 修改文件权限

对于路径操作，建议优先使用 `pathlib` 模块，它提供了更现代的面向对象 API。对于进程管理，推荐使用 `subprocess` 模块，它更安全且功能更强大。`os` 模块在处理环境变量、底层文件描述符和系统信息时仍然是首选。
