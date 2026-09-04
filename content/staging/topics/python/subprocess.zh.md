---
title: subprocess 模块
description: Python subprocess 模块完全指南，进程创建、管道通信和命令执行
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - subprocess
  - 进程
  - 系统命令
status: imported
origin: old/src/content/docs/python/subprocess.zh.md
divergence: 0.229
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 21
  lastUpdated: 2026-01-07
---

`subprocess` 模块是 Python 用于生成新进程、连接其输入/输出/错误管道以及获取返回码的主要接口。它取代了多个旧模块和函数，提供了一种现代、安全的进程管理方法。

## 为什么使用 subprocess？

subprocess 模块相比旧的替代方案有显著优势：

- **安全性**：更好地控制 shell 注入漏洞
- **灵活性**：对输入、输出和错误流的细粒度控制
- **跨平台**：在 Windows、Linux 和 macOS 上一致工作
- **强大功能**：链接命令、处理超时和管理复杂的进程交互
- **现代 API**：使用 `subprocess.run()` 的简洁 Python 风格接口（Python 3.5+）

## subprocess.run() 函数

`run()` 函数是大多数用例的推荐方法。它在 Python 3.5 中引入，提供了简单的高级接口。

### 基本用法

```python
import subprocess

# 运行简单命令
result = subprocess.run(['ls', '-la'])

# 检查返回码
print(f"返回码: {result.returncode}")
```

### 捕获输出

使用 `capture_output=True` 捕获 stdout 和 stderr：

```python
import subprocess

result = subprocess.run(
    ['ls', '-la'],
    capture_output=True,
    text=True  # 返回字符串而不是字节
)

print("STDOUT:")
print(result.stdout)

print("STDERR:")
print(result.stderr)

print(f"返回码: {result.returncode}")
```

或者，使用 `stdout` 和 `stderr` 参数：

```python
import subprocess

result = subprocess.run(
    ['ls', '-la'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print(result.stdout)
```

### 处理返回码

默认情况下，`run()` 不会对非零返回码抛出异常：

```python
import subprocess

# 即使命令失败也不会抛出异常
result = subprocess.run(['ls', '/nonexistent'])
print(f"返回码: {result.returncode}")  # 非零

# 使用 check=True 在失败时抛出 CalledProcessError
try:
    result = subprocess.run(
        ['ls', '/nonexistent'],
        check=True,
        capture_output=True,
        text=True
    )
except subprocess.CalledProcessError as e:
    print(f"命令失败，返回码 {e.returncode}")
    print(f"错误输出: {e.stderr}")
```

### 提供输入

向命令的 stdin 发送数据：

```python
import subprocess

# 使用 input 参数
result = subprocess.run(
    ['grep', 'hello'],
    input='hello world\ngoodbye world\nhello again\n',
    capture_output=True,
    text=True
)
print(result.stdout)
# 输出:
# hello world
# hello again
```

### 超时

防止命令无限期运行：

```python
import subprocess

try:
    result = subprocess.run(
        ['sleep', '30'],
        timeout=5,
        capture_output=True
    )
except subprocess.TimeoutExpired as e:
    print(f"命令在 {e.timeout} 秒后超时")
    print(f"部分输出: {e.stdout}")
```

### 完整的 run() 参数

```python
import subprocess

result = subprocess.run(
    args=['command', 'arg1', 'arg2'],  # 命令和参数
    stdin=None,                         # 输入流
    input=None,                         # 输入数据（字节或字符串）
    stdout=subprocess.PIPE,             # 捕获 stdout
    stderr=subprocess.PIPE,             # 捕获 stderr
    capture_output=True,                # stdout=PIPE, stderr=PIPE 的快捷方式
    shell=False,                        # 通过 shell 运行
    cwd='/path/to/dir',                 # 工作目录
    timeout=30,                         # 超时（秒）
    check=False,                        # 非零退出时抛出异常
    encoding='utf-8',                   # 文本编码
    errors='strict',                    # 编码错误处理
    text=True,                          # 文本模式（等同于 universal_newlines）
    env={'KEY': 'value'},               # 环境变量
)
```

## CompletedProcess 对象

`subprocess.run()` 返回一个 `CompletedProcess` 实例：

```python
import subprocess

result = subprocess.run(
    ['echo', 'Hello, World!'],
    capture_output=True,
    text=True
)

# 可用属性
print(f"args: {result.args}")           # ['echo', 'Hello, World!']
print(f"returncode: {result.returncode}") # 0
print(f"stdout: {result.stdout}")        # Hello, World!\n
print(f"stderr: {result.stderr}")        # (空字符串)
```

## Shell 命令

### 使用 shell=True

当你需要 shell 功能如管道、通配符或环境变量展开时：

```python
import subprocess

# 带管道的 shell 命令
result = subprocess.run(
    'ls -la | grep ".py"',
    shell=True,
    capture_output=True,
    text=True
)
print(result.stdout)

# 环境变量展开
result = subprocess.run(
    'echo $HOME',
    shell=True,
    capture_output=True,
    text=True
)
print(result.stdout)  # /home/username
```

### 安全警告

**永远不要对不受信任的输入使用 `shell=True`！** 这会造成 shell 注入漏洞：

```python
import subprocess

# 危险 - 永远不要这样做！
user_input = "; rm -rf /"
# subprocess.run(f'echo {user_input}', shell=True)  # 安全风险！

# 安全 - 使用参数列表
subprocess.run(['echo', user_input])  # 安全
```

### 何时使用 shell=True

- 带可信、硬编码命令的快速脚本
- 当你需要 shell 功能（管道、重定向、通配符）
- 复杂的 shell 单行命令

### 何时避免 shell=True

- 任何包含用户输入的命令
- 处理外部数据的生产代码
- 安全敏感的应用程序

## Popen 类

对于更复杂的进程交互，直接使用 `Popen`。它提供：

- 非阻塞进程执行
- 实时 I/O 流式传输
- 进程链接（进程间管道）
- 细粒度进程控制

### 基本 Popen 用法

```python
import subprocess

# 启动进程
process = subprocess.Popen(
    ['ls', '-la'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# 等待完成并获取输出
stdout, stderr = process.communicate()
print(stdout)

# 检查返回码
print(f"返回码: {process.returncode}")
```

### 非阻塞执行

```python
import subprocess
import time

# 启动长时间运行的进程
process = subprocess.Popen(
    ['sleep', '10'],
    stdout=subprocess.PIPE
)

# 在进程运行时做其他工作
while process.poll() is None:
    print("进程仍在运行...")
    time.sleep(1)
    # 在这里做其他工作

print(f"进程完成，返回码: {process.returncode}")
```

### 实时输出流

```python
import subprocess
import sys

process = subprocess.Popen(
    ['ping', '-c', '5', 'google.com'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1  # 行缓冲
)

# 逐行读取输出
for line in process.stdout:
    print(f"[PING] {line}", end='')
    sys.stdout.flush()

process.wait()
```

### 交互式进程

```python
import subprocess

process = subprocess.Popen(
    ['python3'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# 发送命令并接收输出
stdout, stderr = process.communicate(input='print("Hello from subprocess!")\n')
print(stdout)
```

### 进程链接（管道）

复制 shell 管道如 `ls | grep ".py"`：

```python
import subprocess

# 方法1：使用 shell=True（更简单但安全性较低）
result = subprocess.run(
    'ls -la | grep ".py"',
    shell=True,
    capture_output=True,
    text=True
)

# 方法2：链接 Popen 对象（更安全）
p1 = subprocess.Popen(
    ['ls', '-la'],
    stdout=subprocess.PIPE
)
p2 = subprocess.Popen(
    ['grep', '.py'],
    stdin=p1.stdout,
    stdout=subprocess.PIPE,
    text=True
)

# 允许 p1 在 p2 退出时接收 SIGPIPE
p1.stdout.close()

output = p2.communicate()[0]
print(output)
```

### 复杂管道示例

```python
import subprocess

def pipeline(*commands):
    """执行命令管道。"""
    processes = []
    prev_stdout = None

    for i, cmd in enumerate(commands):
        stdin = prev_stdout
        stdout = subprocess.PIPE

        process = subprocess.Popen(
            cmd,
            stdin=stdin,
            stdout=stdout,
            stderr=subprocess.PIPE,
            text=True
        )

        if prev_stdout:
            prev_stdout.close()

        processes.append(process)
        prev_stdout = process.stdout

    # 从最后一个进程获取输出
    output, error = processes[-1].communicate()

    # 等待所有进程
    for process in processes[:-1]:
        process.wait()

    return output

# 用法
result = pipeline(
    ['cat', '/etc/passwd'],
    ['grep', 'root'],
    ['cut', '-d:', '-f1']
)
print(result)
```

## 使用 stdin、stdout 和 stderr

### 重定向到文件

```python
import subprocess

# 将 stdout 重定向到文件
with open('output.txt', 'w') as f:
    subprocess.run(['ls', '-la'], stdout=f)

# 将 stdout 和 stderr 重定向到同一文件
with open('all_output.txt', 'w') as f:
    subprocess.run(
        ['ls', '-la', '/nonexistent'],
        stdout=f,
        stderr=subprocess.STDOUT
    )

# stdout 和 stderr 分开到不同文件
with open('stdout.txt', 'w') as out, open('stderr.txt', 'w') as err:
    subprocess.run(
        ['ls', '-la', '/nonexistent'],
        stdout=out,
        stderr=err
    )
```

### 抑制输出

```python
import subprocess

# 抑制所有输出
result = subprocess.run(
    ['ls', '-la'],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

# 仅抑制 stderr
result = subprocess.run(
    ['ls', '-la', '/nonexistent'],
    capture_output=False,
    stderr=subprocess.DEVNULL
)
```

### 合并 stdout 和 stderr

```python
import subprocess

result = subprocess.run(
    ['ls', '-la', '/nonexistent'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,  # 将 stderr 合并到 stdout
    text=True
)
print(result.stdout)  # 包含 stdout 和 stderr
```

## 环境变量

### 传递环境变量

```python
import subprocess
import os

# 方法1：替换整个环境
result = subprocess.run(
    ['printenv'],
    env={'MY_VAR': 'my_value', 'PATH': '/usr/bin'},
    capture_output=True,
    text=True
)

# 方法2：修改当前环境
my_env = os.environ.copy()
my_env['MY_VAR'] = 'my_value'
my_env['ANOTHER_VAR'] = 'another_value'

result = subprocess.run(
    ['bash', '-c', 'echo $MY_VAR $ANOTHER_VAR'],
    env=my_env,
    capture_output=True,
    text=True
)
print(result.stdout)  # my_value another_value
```

### 从子进程读取环境

```python
import subprocess

# 从子进程获取环境变量
result = subprocess.run(
    ['bash', '-c', 'echo $HOME'],
    capture_output=True,
    text=True
)
print(result.stdout.strip())
```

## 工作目录

为子进程更改工作目录：

```python
import subprocess

# 在特定目录中运行命令
result = subprocess.run(
    ['ls', '-la'],
    cwd='/tmp',
    capture_output=True,
    text=True
)
print(result.stdout)

# 对 git 命令有用
result = subprocess.run(
    ['git', 'status'],
    cwd='/path/to/repo',
    capture_output=True,
    text=True
)
```

## 错误处理

### 全面的错误处理

```python
import subprocess

def run_command(cmd, timeout=30):
    """带全面错误处理运行命令。"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=True
        )
        return result.stdout

    except subprocess.CalledProcessError as e:
        print(f"命令失败，退出码 {e.returncode}")
        print(f"命令: {e.cmd}")
        print(f"Stderr: {e.stderr}")
        raise

    except subprocess.TimeoutExpired as e:
        print(f"命令在 {e.timeout} 秒后超时")
        print(f"命令: {e.cmd}")
        if e.stdout:
            print(f"部分 stdout: {e.stdout}")
        if e.stderr:
            print(f"部分 stderr: {e.stderr}")
        raise

    except FileNotFoundError as e:
        print(f"命令未找到: {cmd[0]}")
        raise

    except PermissionError as e:
        print(f"执行权限被拒绝: {cmd[0]}")
        raise

# 用法
try:
    output = run_command(['ls', '-la'])
    print(output)
except Exception as e:
    print(f"错误: {e}")
```

### 异常类型

| 异常 | 原因 |
|-----------|-------|
| `CalledProcessError` | 命令返回非零退出码（使用 `check=True`） |
| `TimeoutExpired` | 命令超过超时 |
| `FileNotFoundError` | 命令可执行文件未找到 |
| `PermissionError` | 没有权限执行命令 |
| `OSError` | 其他 OS 级别错误 |

## 实用示例

### 运行系统命令

```python
import subprocess
import platform

def get_system_info():
    """使用 subprocess 获取系统信息。"""
    info = {}

    # 获取主机名
    result = subprocess.run(
        ['hostname'],
        capture_output=True,
        text=True
    )
    info['hostname'] = result.stdout.strip()

    # 获取当前用户
    result = subprocess.run(
        ['whoami'],
        capture_output=True,
        text=True
    )
    info['user'] = result.stdout.strip()

    # 获取磁盘使用情况
    result = subprocess.run(
        ['df', '-h', '/'],
        capture_output=True,
        text=True
    )
    info['disk'] = result.stdout

    return info

system_info = get_system_info()
for key, value in system_info.items():
    print(f"{key}: {value}")
```

### Git 操作

```python
import subprocess
from pathlib import Path

class GitRepo:
    def __init__(self, path):
        self.path = Path(path)

    def _run(self, *args):
        """运行 git 命令并返回输出。"""
        result = subprocess.run(
            ['git'] + list(args),
            cwd=self.path,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()

    def status(self):
        """获取仓库状态。"""
        return self._run('status', '--short')

    def current_branch(self):
        """获取当前分支名。"""
        return self._run('branch', '--show-current')

    def commit(self, message):
        """创建提交。"""
        return self._run('commit', '-m', message)

    def log(self, n=5):
        """获取最近的提交。"""
        return self._run('log', f'-{n}', '--oneline')

    def diff(self, staged=False):
        """获取更改的 diff。"""
        if staged:
            return self._run('diff', '--staged')
        return self._run('diff')

# 用法
repo = GitRepo('/path/to/repo')
print(repo.current_branch())
print(repo.status())
```

### 进程监控

```python
import subprocess
import time

def monitor_process(cmd, interval=1):
    """监控长时间运行的进程。"""
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    print(f"启动进程，PID: {process.pid}")

    while True:
        # 检查进程是否仍在运行
        return_code = process.poll()

        if return_code is not None:
            # 进程完成
            stdout, stderr = process.communicate()
            print(f"进程完成，返回码: {return_code}")
            return return_code, stdout, stderr

        print(f"进程 {process.pid} 仍在运行...")
        time.sleep(interval)

# 用法
code, out, err = monitor_process(['sleep', '5'])
```

### 并行运行命令

```python
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

def run_command(cmd):
    """运行命令并返回结果。"""
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )
    return {
        'command': ' '.join(cmd),
        'returncode': result.returncode,
        'stdout': result.stdout,
        'stderr': result.stderr
    }

def run_parallel(commands, max_workers=4):
    """并行运行多个命令。"""
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(run_command, cmd): cmd
            for cmd in commands
        }

        for future in as_completed(futures):
            cmd = futures[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                results.append({
                    'command': ' '.join(cmd),
                    'error': str(e)
                })

    return results

# 用法
commands = [
    ['ls', '-la'],
    ['pwd'],
    ['whoami'],
    ['date'],
]

results = run_parallel(commands)
for result in results:
    print(f"命令: {result['command']}")
    print(f"输出: {result.get('stdout', result.get('error'))}")
    print()
```

### 命令包装类

```python
import subprocess
import shlex
from dataclasses import dataclass
from typing import Optional, List, Dict

@dataclass
class CommandResult:
    command: List[str]
    returncode: int
    stdout: str
    stderr: str
    success: bool

class Command:
    """subprocess 操作的包装器。"""

    def __init__(
        self,
        cmd: str | List[str],
        cwd: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None
    ):
        if isinstance(cmd, str):
            self.cmd = shlex.split(cmd)
        else:
            self.cmd = cmd
        self.cwd = cwd
        self.env = env
        self.timeout = timeout

    def run(self, check: bool = False) -> CommandResult:
        """执行命令。"""
        try:
            result = subprocess.run(
                self.cmd,
                cwd=self.cwd,
                env=self.env,
                timeout=self.timeout,
                capture_output=True,
                text=True,
                check=check
            )
            return CommandResult(
                command=self.cmd,
                returncode=result.returncode,
                stdout=result.stdout,
                stderr=result.stderr,
                success=result.returncode == 0
            )
        except subprocess.CalledProcessError as e:
            return CommandResult(
                command=self.cmd,
                returncode=e.returncode,
                stdout=e.stdout or '',
                stderr=e.stderr or '',
                success=False
            )
        except subprocess.TimeoutExpired as e:
            return CommandResult(
                command=self.cmd,
                returncode=-1,
                stdout=e.stdout or '' if hasattr(e, 'stdout') else '',
                stderr=f'Timeout after {e.timeout}s',
                success=False
            )

    def __or__(self, other: 'Command') -> 'PipelineCommand':
        """启用管道语法: cmd1 | cmd2"""
        return PipelineCommand([self, other])

class PipelineCommand:
    """处理管道命令。"""

    def __init__(self, commands: List[Command]):
        self.commands = commands

    def __or__(self, other: Command) -> 'PipelineCommand':
        return PipelineCommand(self.commands + [other])

    def run(self) -> CommandResult:
        """执行管道。"""
        prev_stdout = None
        processes = []

        for cmd in self.commands:
            process = subprocess.Popen(
                cmd.cmd,
                stdin=prev_stdout,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=cmd.cwd,
                env=cmd.env,
                text=True
            )
            if prev_stdout:
                prev_stdout.close()
            processes.append(process)
            prev_stdout = process.stdout

        stdout, stderr = processes[-1].communicate()

        for process in processes[:-1]:
            process.wait()

        return CommandResult(
            command=[c.cmd for c in self.commands],
            returncode=processes[-1].returncode,
            stdout=stdout,
            stderr=stderr,
            success=processes[-1].returncode == 0
        )

# 用法
cmd = Command('ls -la')
result = cmd.run()
print(result.stdout)

# 管道
pipeline = Command('cat /etc/passwd') | Command('grep root') | Command('cut -d: -f1')
result = pipeline.run()
print(result.stdout)
```

## 跨平台注意事项

### Windows vs Unix

```python
import subprocess
import platform
import shutil

def get_directory_listing():
    """跨平台目录列表。"""
    if platform.system() == 'Windows':
        cmd = ['dir']
        shell = True
    else:
        cmd = ['ls', '-la']
        shell = False

    return subprocess.run(
        cmd,
        shell=shell,
        capture_output=True,
        text=True
    )

def find_executable(name):
    """跨平台查找可执行文件。"""
    # shutil.which 跨平台工作
    path = shutil.which(name)
    if path:
        return path

    # Windows 回退
    if platform.system() == 'Windows':
        result = subprocess.run(
            ['where', name],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n')[0]

    return None

# 用法
python_path = find_executable('python3') or find_executable('python')
print(f"Python 在: {python_path}")
```

### Shell 选择

```python
import subprocess
import platform

def run_shell_command(command):
    """跨平台运行 shell 命令。"""
    if platform.system() == 'Windows':
        # 在 Windows 上使用 cmd.exe
        shell_cmd = ['cmd', '/c', command]
    else:
        # 在类 Unix 系统上使用 bash
        shell_cmd = ['bash', '-c', command]

    return subprocess.run(
        shell_cmd,
        capture_output=True,
        text=True
    )

result = run_shell_command('echo Hello World')
print(result.stdout)
```

## 性能技巧

### 尽可能避免 shell=True

```python
import subprocess

# 较慢 - 产生 shell 进程
subprocess.run('ls -la', shell=True)

# 较快 - 直接执行
subprocess.run(['ls', '-la'])
```

### 对多个命令重用 Popen

```python
import subprocess

# 对于许多短命令，使用持久 shell
process = subprocess.Popen(
    ['bash'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

commands = ['pwd', 'ls', 'whoami']
for cmd in commands:
    process.stdin.write(cmd + '\n')
    process.stdin.flush()

process.stdin.close()
output = process.stdout.read()
print(output)
```

### 对大输出使用 bufsize

```python
import subprocess

# 对于大输出，增加缓冲区大小
process = subprocess.Popen(
    ['command_with_large_output'],
    stdout=subprocess.PIPE,
    bufsize=1024 * 1024  # 1MB 缓冲区
)
```

### 流式处理大输出

```python
import subprocess

def process_large_output(cmd):
    """处理大输出而不加载到内存。"""
    with subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        text=True,
        bufsize=1
    ) as process:
        for line in process.stdout:
            # 逐行处理
            yield line.strip()

for line in process_large_output(['find', '/', '-name', '*.py']):
    print(line)
```

## 常见陷阱

### communicate() 死锁

```python
import subprocess

# 错误 - 如果输出很大可能死锁
process = subprocess.Popen(
    ['cat', 'large_file.txt'],
    stdout=subprocess.PIPE
)
# 一次读取所有 - 阻塞
output = process.stdout.read()  # 可能死锁！

# 正确 - 使用 communicate()
process = subprocess.Popen(
    ['cat', 'large_file.txt'],
    stdout=subprocess.PIPE
)
output, _ = process.communicate()  # 安全

# 或者流式处理输出
process = subprocess.Popen(
    ['cat', 'large_file.txt'],
    stdout=subprocess.PIPE,
    text=True
)
for line in process.stdout:
    print(line, end='')
process.wait()
```

### 不处理编码

```python
import subprocess

# 可能因非 ASCII 字符失败
result = subprocess.run(
    ['cat', 'unicode_file.txt'],
    capture_output=True,
    text=True  # 使用系统默认编码
)

# 显式指定编码
result = subprocess.run(
    ['cat', 'unicode_file.txt'],
    capture_output=True,
    text=True,
    encoding='utf-8',
    errors='replace'  # 优雅处理编码错误
)
```

### 忽略返回码

```python
import subprocess

# 不好 - 忽略失败
result = subprocess.run(['rm', 'important_file.txt'])
# 文件可能没有被删除！

# 好 - 检查返回码
result = subprocess.run(['rm', 'important_file.txt'])
if result.returncode != 0:
    print("删除文件失败")

# 更好 - 使用 check=True
try:
    subprocess.run(['rm', 'important_file.txt'], check=True)
except subprocess.CalledProcessError:
    print("删除文件失败")
```

### 资源泄漏

```python
import subprocess

# 不好 - 进程未正确关闭
process = subprocess.Popen(['long_running_command'])
# ... 如果发生异常，进程可能成为孤儿

# 好 - 使用上下文管理器
with subprocess.Popen(['long_running_command']) as process:
    # 异常时进程自动终止
    pass

# 好 - 显式清理
process = subprocess.Popen(['long_running_command'])
try:
    process.wait(timeout=30)
except subprocess.TimeoutExpired:
    process.kill()
    process.wait()
```

## 总结

subprocess 模块对于 Python 中的系统交互至关重要。关键要点：

| 用例 | 推荐方法 |
|----------|---------------------|
| 简单命令执行 | `subprocess.run()` 配合 `capture_output=True` |
| 检查错误 | `subprocess.run()` 配合 `check=True` |
| 实时输出流 | `Popen` 配合逐行读取 |
| 命令管道 | 链接 `Popen` 对象 |
| 交互式进程 | `Popen` 配合 `communicate()` |
| 跨平台 | 避免 `shell=True`，使用 `shutil.which()` |
| 安全性 | 永远不要对用户输入使用 `shell=True` |

最佳实践：

- 始终为字符串 I/O 指定 `text=True`
- 使用 `check=True` 捕获命令失败
- 为长时间运行的命令设置适当的超时
- 处理 `CalledProcessError` 和 `TimeoutExpired` 异常
- 对不受信任的输入避免 `shell=True`
- 使用 `communicate()` 防止死锁
- 使用上下文管理器正确关闭进程资源

subprocess 模块提供了在 Python 应用程序中安全高效地执行外部命令所需的一切。
