---
title: 上下文管理器
description: 深入理解Python上下文管理器，with语句、__enter__/__exit__方法与contextlib模块
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 上下文管理器
  - with语句
  - 资源管理
status: imported
origin: old/src/content/docs/python/context-managers.zh.md
divergence: 0.231
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 高级特性
  order: 14
  lastUpdated: 2026-01-07
---

上下文管理器是 Python 中一种优雅的资源管理机制，它能够确保资源的正确获取和释放，即使在发生异常的情况下也能保证资源被妥善处理。本文将深入探讨上下文管理器的工作原理、实现方式以及实际应用场景。

## 什么是上下文管理器

上下文管理器是一个对象，它定义了在执行 `with` 语句时要建立的运行时上下文。上下文管理器处理进入和退出所需运行时上下文的操作，通常用于：

- 文件操作（自动关闭文件）
- 数据库连接（自动提交或回滚事务）
- 线程锁（自动获取和释放锁）
- 临时修改环境变量或配置

## with 语句基础

### 基本语法

```python
with expression as variable:
    # 代码块
    pass
```

### 文件操作示例

传统方式（不推荐）：

```python
# 需要手动关闭文件，容易遗忘
f = open('data.txt', 'r')
try:
    content = f.read()
finally:
    f.close()
```

使用上下文管理器（推荐）：

```python
# 自动处理文件关闭，即使发生异常
with open('data.txt', 'r') as f:
    content = f.read()
# 文件在这里已经自动关闭
```

## 上下文管理器协议

上下文管理器协议由两个特殊方法组成：

### `__enter__` 方法

- 在进入 `with` 代码块之前调用
- 返回值会被赋给 `as` 后面的变量
- 通常用于获取资源

### `__exit__` 方法

- 在离开 `with` 代码块时调用（无论是否发生异常）
- 接收三个参数：异常类型、异常值、追溯信息
- 返回 `True` 表示异常已被处理，不再向外传播
- 通常用于释放资源

### 自定义上下文管理器

```python
class FileManager:
    """自定义文件管理器"""

    def __init__(self, filename, mode='r'):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        """进入上下文时打开文件"""
        print(f"打开文件: {self.filename}")
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        """退出上下文时关闭文件"""
        print(f"关闭文件: {self.filename}")
        if self.file:
            self.file.close()

        # 返回 False 或 None，异常会继续传播
        # 返回 True，异常会被抑制
        return False


# 使用自定义上下文管理器
with FileManager('example.txt', 'w') as f:
    f.write('Hello, Context Manager!')
```

### 处理异常的上下文管理器

```python
class DatabaseConnection:
    """数据库连接管理器，支持事务"""

    def __init__(self, connection_string):
        self.connection_string = connection_string
        self.connection = None

    def __enter__(self):
        print("建立数据库连接...")
        # 模拟建立连接
        self.connection = {"connected": True, "data": []}
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # 发生异常，回滚事务
            print(f"发生异常: {exc_val}")
            print("回滚事务...")
            self.rollback()
        else:
            # 没有异常，提交事务
            print("提交事务...")
            self.commit()

        print("关闭数据库连接...")
        self.connection = None

        # 不抑制异常
        return False

    def execute(self, query):
        print(f"执行查询: {query}")
        self.connection["data"].append(query)

    def commit(self):
        print("事务已提交")

    def rollback(self):
        print("事务已回滚")


# 正常执行
with DatabaseConnection("mysql://localhost/db") as db:
    db.execute("INSERT INTO users VALUES (1, 'Alice')")
    db.execute("INSERT INTO users VALUES (2, 'Bob')")

print("\n--- 异常情况 ---\n")

# 发生异常时自动回滚
try:
    with DatabaseConnection("mysql://localhost/db") as db:
        db.execute("INSERT INTO users VALUES (3, 'Charlie')")
        raise ValueError("数据验证失败")
except ValueError:
    print("异常已在外部捕获")
```

## contextlib 模块

Python 的 `contextlib` 模块提供了创建上下文管理器的便捷工具。

### @contextmanager 装饰器

使用生成器函数创建上下文管理器，比实现类更简洁：

```python
from contextlib import contextmanager

@contextmanager
def file_manager(filename, mode='r'):
    """使用装饰器创建文件管理器"""
    print(f"打开文件: {filename}")
    f = open(filename, mode)
    try:
        yield f  # yield 之前是 __enter__，yield 的值是返回值
    finally:
        print(f"关闭文件: {filename}")
        f.close()  # yield 之后是 __exit__


with file_manager('test.txt', 'w') as f:
    f.write('使用 contextmanager 装饰器')
```

### 实用的上下文管理器示例

#### 计时器

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(description="操作"):
    """测量代码块执行时间"""
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{description} 耗时: {elapsed:.4f} 秒")


with timer("数据处理"):
    # 模拟耗时操作
    time.sleep(0.5)
    result = sum(range(1000000))
```

#### 临时目录切换

```python
from contextlib import contextmanager
import os

@contextmanager
def change_directory(path):
    """临时切换工作目录"""
    original_path = os.getcwd()
    try:
        os.chdir(path)
        print(f"切换到目录: {path}")
        yield
    finally:
        os.chdir(original_path)
        print(f"恢复到目录: {original_path}")


with change_directory('/tmp'):
    print(f"当前目录: {os.getcwd()}")
```

#### 临时修改属性

```python
from contextlib import contextmanager

@contextmanager
def temporary_attribute(obj, attr, value):
    """临时修改对象属性"""
    original = getattr(obj, attr, None)
    has_attr = hasattr(obj, attr)
    setattr(obj, attr, value)
    try:
        yield
    finally:
        if has_attr:
            setattr(obj, attr, original)
        else:
            delattr(obj, attr)


class Config:
    debug = False

config = Config()
print(f"Debug 模式: {config.debug}")

with temporary_attribute(config, 'debug', True):
    print(f"Debug 模式: {config.debug}")

print(f"Debug 模式: {config.debug}")
```

### contextlib 其他实用工具

#### closing - 自动调用 close()

```python
from contextlib import closing
from urllib.request import urlopen

# 对于没有实现上下文管理器协议但有 close() 方法的对象
with closing(urlopen('https://www.python.org')) as page:
    content = page.read()
```

#### suppress - 抑制指定异常

```python
from contextlib import suppress
import os

# 忽略文件不存在的错误
with suppress(FileNotFoundError):
    os.remove('不存在的文件.txt')
    print("这行不会执行")

print("程序继续运行")

# 等价于：
try:
    os.remove('不存在的文件.txt')
except FileNotFoundError:
    pass
```

#### redirect_stdout / redirect_stderr - 重定向输出

```python
from contextlib import redirect_stdout, redirect_stderr
import io

# 捕获标准输出
f = io.StringIO()
with redirect_stdout(f):
    print("这段文字会被捕获")
    print("而不是输出到控制台")

output = f.getvalue()
print(f"捕获的内容: {repr(output)}")

# 同时重定向 stdout 和 stderr
stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()

with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
    print("标准输出")
    import sys
    print("标准错误", file=sys.stderr)
```

#### nullcontext - 空上下文管理器

```python
from contextlib import nullcontext

def process_data(data, output_file=None):
    """处理数据，可选输出到文件"""
    # 如果指定了文件则写入文件，否则使用 nullcontext
    cm = open(output_file, 'w') if output_file else nullcontext()

    with cm as f:
        result = data.upper()
        if f:
            f.write(result)
        return result

# 不输出到文件
result1 = process_data("hello")

# 输出到文件
result2 = process_data("world", "output.txt")
```

## 嵌套上下文管理器

### 多个 with 语句嵌套

```python
with open('input.txt', 'r') as infile:
    with open('output.txt', 'w') as outfile:
        content = infile.read()
        outfile.write(content.upper())
```

### 单行多个上下文管理器

```python
# Python 3.1+ 支持
with open('input.txt', 'r') as infile, open('output.txt', 'w') as outfile:
    content = infile.read()
    outfile.write(content.upper())

# Python 3.10+ 支持使用括号换行
with (
    open('input.txt', 'r') as infile,
    open('output.txt', 'w') as outfile,
    open('log.txt', 'a') as logfile
):
    content = infile.read()
    outfile.write(content.upper())
    logfile.write("处理完成\n")
```

### ExitStack - 动态管理多个上下文

```python
from contextlib import ExitStack

# 动态管理多个文件
files_to_process = ['file1.txt', 'file2.txt', 'file3.txt']

with ExitStack() as stack:
    files = [
        stack.enter_context(open(fname, 'w'))
        for fname in files_to_process
    ]

    for i, f in enumerate(files):
        f.write(f"内容 {i}")

# 所有文件在退出时自动关闭
```

#### ExitStack 高级用法

```python
from contextlib import ExitStack

def process_with_cleanup():
    with ExitStack() as stack:
        # 注册清理回调
        stack.callback(print, "清理操作 1")
        stack.callback(print, "清理操作 2")

        # 动态添加上下文管理器
        f = stack.enter_context(open('data.txt', 'w'))
        f.write("测试数据")

        # 可以将清理责任转移到外部
        # return stack.pop_all()

    # 退出时按 LIFO 顺序执行清理

process_with_cleanup()
# 输出:
# 清理操作 2
# 清理操作 1
```

## 异常处理详解

### __exit__ 方法的参数

```python
class ExceptionDemo:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        参数说明:
        - exc_type: 异常类型 (如 ValueError)
        - exc_val: 异常实例
        - exc_tb: 追溯对象 (traceback)

        如果没有异常，三个参数都是 None
        """
        if exc_type is not None:
            print(f"异常类型: {exc_type.__name__}")
            print(f"异常信息: {exc_val}")
            print(f"追溯信息: {exc_tb}")
        return False  # 不抑制异常


try:
    with ExceptionDemo():
        raise ValueError("测试异常")
except ValueError:
    print("异常被重新抛出")
```

### 异常抑制

```python
class SuppressError:
    """抑制特定类型的异常"""

    def __init__(self, *exceptions):
        self.exceptions = exceptions

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # 如果异常类型在允许列表中，返回 True 抑制异常
        if exc_type is not None and issubclass(exc_type, self.exceptions):
            print(f"抑制异常: {exc_val}")
            return True
        return False


with SuppressError(ZeroDivisionError, ValueError):
    result = 1 / 0  # 异常被抑制
    print("这行不会执行")

print("程序继续运行")
```

### @contextmanager 中的异常处理

```python
from contextlib import contextmanager

@contextmanager
def error_handler():
    """处理并记录异常"""
    try:
        yield
    except Exception as e:
        print(f"捕获到异常: {type(e).__name__}: {e}")
        # 重新抛出或抑制
        raise  # 重新抛出
        # 如果不写 raise，异常会被抑制


try:
    with error_handler():
        raise RuntimeError("发生错误")
except RuntimeError:
    print("异常被重新抛出到外部")
```

## 实际应用案例

### 数据库事务管理

```python
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.data = {}
        self.transaction_data = None

    @contextmanager
    def transaction(self):
        """事务上下文管理器"""
        # 保存当前状态
        self.transaction_data = self.data.copy()
        try:
            yield self
            # 没有异常，提交事务
            print("事务提交")
        except Exception:
            # 发生异常，回滚事务
            self.data = self.transaction_data
            print("事务回滚")
            raise
        finally:
            self.transaction_data = None

    def insert(self, key, value):
        self.data[key] = value
        print(f"插入: {key} = {value}")


db = Database()

# 成功的事务
with db.transaction():
    db.insert("name", "Alice")
    db.insert("age", 30)

print(f"数据: {db.data}")

# 失败的事务
try:
    with db.transaction():
        db.insert("city", "Beijing")
        raise ValueError("数据验证失败")
except ValueError:
    pass

print(f"数据: {db.data}")  # city 不会被插入
```

### 线程锁管理

```python
import threading
from contextlib import contextmanager

class ThreadSafeCounter:
    def __init__(self):
        self._value = 0
        self._lock = threading.Lock()

    @property
    def value(self):
        return self._value

    @contextmanager
    def locked(self):
        """获取锁的上下文管理器"""
        self._lock.acquire()
        try:
            yield
        finally:
            self._lock.release()

    def increment(self):
        with self.locked():
            self._value += 1

    def decrement(self):
        with self.locked():
            self._value -= 1


counter = ThreadSafeCounter()

def worker():
    for _ in range(1000):
        counter.increment()

threads = [threading.Thread(target=worker) for _ in range(10)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"最终值: {counter.value}")  # 应该是 10000
```

### 配置临时覆盖

```python
from contextlib import contextmanager
from typing import Any, Dict

class AppConfig:
    """应用配置类"""

    def __init__(self):
        self._config = {
            "debug": False,
            "log_level": "INFO",
            "max_connections": 100
        }

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._config[key] = value

    @contextmanager
    def override(self, **kwargs):
        """临时覆盖配置"""
        original_values = {}

        # 保存原始值并设置新值
        for key, value in kwargs.items():
            if key in self._config:
                original_values[key] = self._config[key]
            self._config[key] = value

        try:
            yield self
        finally:
            # 恢复原始值
            for key, value in original_values.items():
                self._config[key] = value
            # 删除新增的键
            for key in kwargs:
                if key not in original_values:
                    del self._config[key]


config = AppConfig()

print(f"Debug: {config.get('debug')}")  # False

with config.override(debug=True, log_level="DEBUG"):
    print(f"Debug: {config.get('debug')}")  # True
    print(f"Log Level: {config.get('log_level')}")  # DEBUG

print(f"Debug: {config.get('debug')}")  # False
print(f"Log Level: {config.get('log_level')}")  # INFO
```

### HTML 标签生成器

```python
from contextlib import contextmanager

class HTMLBuilder:
    def __init__(self):
        self.indent_level = 0
        self.lines = []

    @contextmanager
    def tag(self, name, **attrs):
        """生成 HTML 标签"""
        # 构建属性字符串
        attr_str = ""
        if attrs:
            attr_str = " " + " ".join(
                f'{k}="{v}"' for k, v in attrs.items()
            )

        # 开始标签
        indent = "  " * self.indent_level
        self.lines.append(f"{indent}<{name}{attr_str}>")

        self.indent_level += 1
        try:
            yield
        finally:
            self.indent_level -= 1
            self.lines.append(f"{indent}</{name}>")

    def text(self, content):
        """添加文本内容"""
        indent = "  " * self.indent_level
        self.lines.append(f"{indent}{content}")

    def render(self):
        """渲染 HTML"""
        return "\n".join(self.lines)


# 使用示例
html = HTMLBuilder()

with html.tag("html"):
    with html.tag("head"):
        with html.tag("title"):
            html.text("我的网页")
    with html.tag("body"):
        with html.tag("div", id="main", class_="container"):
            with html.tag("h1"):
                html.text("欢迎")
            with html.tag("p"):
                html.text("这是一个使用上下文管理器生成的网页")

print(html.render())
```

## 异步上下文管理器

Python 3.5+ 支持异步上下文管理器，使用 `async with` 语句：

```python
import asyncio

class AsyncResource:
    """异步资源管理器"""

    async def __aenter__(self):
        print("异步获取资源...")
        await asyncio.sleep(0.1)  # 模拟异步操作
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("异步释放资源...")
        await asyncio.sleep(0.1)
        return False

    async def do_something(self):
        print("执行异步操作...")
        await asyncio.sleep(0.1)


async def main():
    async with AsyncResource() as resource:
        await resource.do_something()


# 运行异步代码
asyncio.run(main())
```

### 使用 asynccontextmanager

```python
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_timer(description="操作"):
    """异步计时器"""
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{description} 耗时: {elapsed:.4f} 秒")


async def main():
    async with async_timer("异步任务"):
        await asyncio.sleep(0.5)


asyncio.run(main())
```

## 最佳实践

### 优先使用内置上下文管理器

```python
# 好的做法
with open('file.txt') as f:
    content = f.read()

# 避免
f = open('file.txt')
try:
    content = f.read()
finally:
    f.close()
```

### 简单情况使用 @contextmanager

```python
from contextlib import contextmanager

# 简单的上下文管理器用装饰器
@contextmanager
def simple_context():
    print("进入")
    yield
    print("退出")

# 复杂的上下文管理器用类
class ComplexContext:
    def __init__(self, config):
        self.config = config
        self.state = {}

    def __enter__(self):
        # 复杂的初始化逻辑
        return self

    def __exit__(self, *args):
        # 复杂的清理逻辑
        pass
```

### 始终在 finally 中清理资源

```python
@contextmanager
def safe_resource():
    resource = acquire_resource()
    try:
        yield resource
    finally:
        # 即使发生异常也会执行
        release_resource(resource)
```

### 明确异常处理策略

```python
class MyContext:
    def __exit__(self, exc_type, exc_val, exc_tb):
        # 明确返回 False 表示不抑制异常
        return False

        # 或返回 True 表示抑制异常
        # return True
```

### 使用类型提示

```python
from contextlib import contextmanager
from typing import Generator, ContextManager

@contextmanager
def typed_context() -> Generator[str, None, None]:
    yield "value"

def use_context(cm: ContextManager[str]) -> None:
    with cm as value:
        print(value)
```

## 总结

上下文管理器是 Python 中管理资源的优雅解决方案，它提供了：

1. **自动资源管理**：确保资源在使用后被正确释放
2. **异常安全**：即使发生异常也能保证清理操作执行
3. **代码简洁**：减少样板代码，提高可读性
4. **灵活的实现方式**：可以使用类或装饰器实现

掌握上下文管理器的使用和实现，是写出 Pythonic 代码的重要一步。在日常开发中，应该优先考虑使用上下文管理器来管理任何需要清理的资源。
