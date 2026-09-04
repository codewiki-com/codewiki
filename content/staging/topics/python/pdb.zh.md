---
title: Python pdb 调试器完全指南
description: 深入掌握 Python 调试：pdb 命令、breakpoint() 函数、事后调试、条件断点与 pdb++ 增强工具
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - pdb
  - 调试
  - debugging
  - breakpoint
  - pdb++
status: imported
origin: old/src/content/docs/python/pdb.zh.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 测试与调试
  order: 14
  lastUpdated: 2026-01-07
---

调试是软件开发中不可或缺的技能。Python 内置的 pdb（Python Debugger）模块提供了强大的交互式调试功能，让开发者能够逐步执行代码、检查变量状态、设置断点，从而快速定位和修复问题。本文将全面介绍 pdb 的使用方法和最佳实践。

## 概念解释

### 什么是 pdb？

pdb（Python Debugger）是 Python 标准库中的交互式源代码调试器。它允许开发者：

- **设置断点**：在代码的特定位置暂停执行
- **单步执行**：逐行或逐函数执行代码
- **检查状态**：查看和修改变量的值
- **跟踪调用栈**：了解程序执行路径
- **事后调试**：在程序崩溃后分析问题

### 调试器的历史背景

调试器的概念源于早期计算机时代。pdb 的设计灵感来自于 GDB（GNU Debugger）等传统调试工具，但专门针对 Python 的动态特性进行了优化。Python 3.7 引入了 `breakpoint()` 内置函数，进一步简化了调试流程。

### 解决什么问题？

- **定位 Bug**：当程序行为不符合预期时，快速找到问题根源
- **理解代码流程**：通过逐步执行理解复杂的代码逻辑
- **验证假设**：在运行时检查变量值是否符合预期
- **分析崩溃**：程序异常终止后进行事后分析

## 核心原理

### pdb 的工作机制

pdb 基于 Python 的 `sys.settrace()` 函数实现，该函数允许设置一个跟踪函数，在以下事件发生时被调用：

1. **call**：函数调用时
2. **line**：执行新的一行代码时
3. **return**：函数返回时
4. **exception**：发生异常时

```python
import sys

def trace_calls(frame, event, arg):
    """简化的跟踪函数示例"""
    if event == 'call':
        print(f"调用函数: {frame.f_code.co_name}")
    elif event == 'line':
        print(f"执行行: {frame.f_lineno}")
    elif event == 'return':
        print(f"返回值: {arg}")
    return trace_calls

# 设置跟踪函数
sys.settrace(trace_calls)
```

### 帧对象（Frame Object）

pdb 通过 Python 的帧对象访问程序状态：

```python
import inspect

def example_function():
    local_var = 42
    frame = inspect.currentframe()

    # 访问帧信息
    print(f"函数名: {frame.f_code.co_name}")
    print(f"行号: {frame.f_lineno}")
    print(f"局部变量: {frame.f_locals}")
    print(f"全局变量: {list(frame.f_globals.keys())[:5]}...")

example_function()
```

### 断点机制

断点本质上是在代码执行流程中插入的检查点。当程序执行到断点位置时，调试器会暂停执行并将控制权交给用户。

```python
# 断点的简化实现原理
class SimpleBreakpoint:
    breakpoints = set()

    @classmethod
    def set_breakpoint(cls, filename, lineno):
        cls.breakpoints.add((filename, lineno))

    @classmethod
    def check_breakpoint(cls, frame):
        location = (frame.f_code.co_filename, frame.f_lineno)
        return location in cls.breakpoints
```

## 核心要点

### 启动 pdb 的方式

#### 在代码中插入断点

```python
# 方式一：使用 pdb.set_trace()（传统方式）
import pdb

def calculate(x, y):
    result = x + y
    pdb.set_trace()  # 程序会在这里暂停
    return result * 2

# 方式二：使用 breakpoint()（Python 3.7+，推荐）
def calculate_v2(x, y):
    result = x + y
    breakpoint()  # 更简洁的方式
    return result * 2
```

#### 从命令行启动

```bash
# 以调试模式运行脚本
python -m pdb script.py

# 设置 PYTHONBREAKPOINT 环境变量
export PYTHONBREAKPOINT=pdb.set_trace
python script.py
```

#### 在交互式环境中使用

```python
>>> import pdb
>>> import mymodule
>>> pdb.run('mymodule.my_function()')
```

### pdb 核心命令

| 命令 | 缩写 | 功能说明 |
|------|------|----------|
| `help` | `h` | 显示帮助信息 |
| `where` | `w` | 显示当前调用栈 |
| `list` | `l` | 显示当前位置的源代码 |
| `longlist` | `ll` | 显示当前函数的完整源代码 |
| `next` | `n` | 执行下一行（不进入函数） |
| `step` | `s` | 执行下一行（进入函数） |
| `continue` | `c` | 继续执行直到下一个断点 |
| `return` | `r` | 继续执行直到当前函数返回 |
| `break` | `b` | 设置断点 |
| `clear` | `cl` | 清除断点 |
| `print` | `p` | 打印表达式的值 |
| `pp` | - | 美化打印表达式的值 |
| `args` | `a` | 显示当前函数的参数 |
| `quit` | `q` | 退出调试器 |
| `up` | `u` | 移动到调用栈的上一层 |
| `down` | `d` | 移动到调用栈的下一层 |

### 断点类型

#### 普通断点

```python
# 在 pdb 交互环境中
(Pdb) b 10              # 在当前文件第 10 行设置断点
(Pdb) b module.py:20    # 在指定文件第 20 行设置断点
(Pdb) b my_function     # 在函数入口设置断点
```

#### 条件断点

```python
# 只有当条件满足时才触发断点
(Pdb) b 15, x > 100     # 当 x > 100 时在第 15 行停止
(Pdb) b my_func, len(items) == 0  # 当 items 为空时停止
```

#### 临时断点

```python
# 只触发一次的断点
(Pdb) tbreak 10         # 在第 10 行设置临时断点
```

### breakpoint() 函数详解

Python 3.7 引入的 `breakpoint()` 函数提供了更灵活的调试入口：

```python
# 基本用法
def process_data(data):
    for item in data:
        breakpoint()  # 默认使用 pdb
        result = transform(item)
    return result

# 通过环境变量控制
# export PYTHONBREAKPOINT=0  # 禁用所有断点
# export PYTHONBREAKPOINT=ipdb.set_trace  # 使用 ipdb
# export PYTHONBREAKPOINT=pudb.set_trace  # 使用 pudb
```

```python
# 在代码中动态控制
import sys

# 禁用断点
sys.breakpointhook = lambda: None

# 自定义断点处理
def custom_breakpoint(*args, **kwargs):
    print("进入调试点")
    print(f"参数: {args}, {kwargs}")
    import pdb; pdb.set_trace()

sys.breakpointhook = custom_breakpoint
```

## 代码示例

### 基础调试示例

```python
# debug_example.py
def calculate_average(numbers):
    """计算平均值"""
    total = 0
    count = 0

    for num in numbers:
        breakpoint()  # 在这里设置断点
        total += num
        count += 1

    average = total / count
    return average

def main():
    data = [10, 20, 30, 40, 50]
    result = calculate_average(data)
    print(f"平均值: {result}")

if __name__ == "__main__":
    main()
```

运行调试会话：

```
$ python debug_example.py
> /path/to/debug_example.py(9)calculate_average()
-> total += num
(Pdb) p num
10
(Pdb) p total
0
(Pdb) n
> /path/to/debug_example.py(10)calculate_average()
-> count += 1
(Pdb) p total
10
(Pdb) c
> /path/to/debug_example.py(9)calculate_average()
-> total += num
(Pdb) p num
20
(Pdb) c
...
```

### 调试递归函数

```python
# recursive_debug.py
def factorial(n, depth=0):
    """递归计算阶乘"""
    indent = "  " * depth
    print(f"{indent}factorial({n}) 被调用")

    if n <= 1:
        breakpoint()  # 在基准情况处调试
        return 1

    result = n * factorial(n - 1, depth + 1)
    print(f"{indent}factorial({n}) 返回 {result}")
    return result

# 调试会话
result = factorial(5)
```

在调试器中查看调用栈：

```
(Pdb) w
  /path/to/recursive_debug.py(15)<module>()
-> result = factorial(5)
  /path/to/recursive_debug.py(11)factorial()
-> result = n * factorial(n - 1, depth + 1)
  /path/to/recursive_debug.py(11)factorial()
-> result = n * factorial(n - 1, depth + 1)
  ...
> /path/to/recursive_debug.py(8)factorial()
-> return 1
```

### 调试类方法

```python
# class_debug.py
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.transactions = []

    def deposit(self, amount):
        """存款"""
        if amount <= 0:
            raise ValueError("存款金额必须为正数")

        self.balance += amount
        self.transactions.append(('deposit', amount))
        return self.balance

    def withdraw(self, amount):
        """取款"""
        if amount <= 0:
            raise ValueError("取款金额必须为正数")

        if amount > self.balance:
            breakpoint()  # 调试余额不足的情况
            raise ValueError("余额不足")

        self.balance -= amount
        self.transactions.append(('withdraw', amount))
        return self.balance

    def get_statement(self):
        """获取账单"""
        breakpoint()  # 调试账单生成
        statement = f"账户持有人: {self.owner}\n"
        statement += f"当前余额: ¥{self.balance}\n"
        statement += "交易记录:\n"
        for trans_type, amount in self.transactions:
            statement += f"  - {trans_type}: ¥{amount}\n"
        return statement

# 测试代码
account = BankAccount("张三", 1000)
account.deposit(500)
account.withdraw(200)
try:
    account.withdraw(2000)  # 触发断点
except ValueError as e:
    print(f"错误: {e}")
```

### 使用条件断点调试循环

```python
# conditional_breakpoint.py
def find_anomaly(data):
    """查找数据中的异常值"""
    results = []
    threshold = 100

    for i, value in enumerate(data):
        # 在 pdb 中设置条件断点: b 12, value > threshold
        if value > threshold:
            results.append((i, value))

    return results

# 模拟数据
import random
random.seed(42)
data = [random.randint(0, 150) for _ in range(1000)]

# 调试
# python -m pdb conditional_breakpoint.py
# (Pdb) b 12, value > threshold
# (Pdb) c
```

### 调试异步代码

```python
# async_debug.py
import asyncio

async def fetch_data(url):
    """模拟异步数据获取"""
    print(f"开始获取: {url}")
    await asyncio.sleep(1)  # 模拟网络延迟

    breakpoint()  # 在异步函数中调试

    data = {"url": url, "status": "success"}
    return data

async def process_urls(urls):
    """批量处理 URL"""
    tasks = [fetch_data(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return results

async def main():
    urls = [
        "https://api.example.com/users",
        "https://api.example.com/products",
        "https://api.example.com/orders"
    ]
    results = await process_urls(urls)
    print(f"获取到 {len(results)} 个结果")

if __name__ == "__main__":
    asyncio.run(main())
```

### 事后调试（Post-mortem Debugging）

```python
# postmortem_debug.py
import pdb
import sys
import traceback

def risky_operation(data):
    """可能出错的操作"""
    result = []
    for item in data:
        # 这里可能会出错
        value = item['value'] / item['divisor']
        result.append(value)
    return result

def main():
    data = [
        {'value': 100, 'divisor': 2},
        {'value': 200, 'divisor': 4},
        {'value': 300, 'divisor': 0},  # 除零错误
    ]

    try:
        result = risky_operation(data)
        print(f"结果: {result}")
    except Exception as e:
        print(f"发生错误: {e}")
        # 事后调试
        pdb.post_mortem()

if __name__ == "__main__":
    main()
```

使用 `sys.excepthook` 自动进入事后调试：

```python
# auto_postmortem.py
import pdb
import sys

def enable_postmortem():
    """启用自动事后调试"""
    def excepthook(exc_type, exc_value, exc_tb):
        if exc_type is KeyboardInterrupt:
            sys.__excepthook__(exc_type, exc_value, exc_tb)
            return

        print(f"\n异常: {exc_type.__name__}: {exc_value}")
        print("进入事后调试模式...")
        pdb.post_mortem(exc_tb)

    sys.excepthook = excepthook

# 在程序开始时启用
enable_postmortem()

# 之后的任何未捕获异常都会自动进入调试模式
def buggy_function():
    x = [1, 2, 3]
    return x[10]  # IndexError

buggy_function()
```

### 远程调试

```python
# remote_debug.py
import pdb
import socket
import sys

class RemotePdb(pdb.Pdb):
    """支持远程连接的 pdb"""

    def __init__(self, host='0.0.0.0', port=4444):
        # 创建 socket 服务器
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((host, port))
        self.server.listen(1)

        print(f"等待调试连接: {host}:{port}")
        self.client, address = self.server.accept()
        print(f"已连接: {address}")

        # 将 socket 包装为文件对象
        self.handle = self.client.makefile('rw')

        pdb.Pdb.__init__(self, stdin=self.handle, stdout=self.handle)

    def do_quit(self, arg):
        self.handle.close()
        self.client.close()
        self.server.close()
        return pdb.Pdb.do_quit(self, arg)

def set_remote_trace(host='0.0.0.0', port=4444):
    """设置远程断点"""
    debugger = RemotePdb(host, port)
    debugger.set_trace(sys._getframe().f_back)

# 使用示例
def remote_debug_example():
    x = 10
    set_remote_trace()  # 等待远程连接
    y = x * 2
    return y

# 连接方式: telnet localhost 4444
```

## 最佳实践

### 使用 breakpoint() 而非 pdb.set_trace()

```python
# 推荐：更简洁，更灵活
def process(data):
    breakpoint()
    return transform(data)

# 不推荐：传统方式
def process_old(data):
    import pdb; pdb.set_trace()
    return transform(data)
```

### 条件断点避免不必要的中断

```python
def process_large_dataset(items):
    for i, item in enumerate(items):
        # 只在特定条件下断点
        if i == 999:  # 或使用条件断点
            breakpoint()
        result = expensive_operation(item)
    return result
```

### 使用命令别名提高效率

创建 `~/.pdbrc` 文件：

```python
# ~/.pdbrc
# 自定义别名
alias pl pp list(locals().keys())  # 打印所有局部变量名
alias pg pp list(globals().keys())  # 打印所有全局变量名
alias ps pp inspect.stack()  # 打印调用栈
alias pf pp {k: v for k, v in locals().items() if not k.startswith('_')}

# 自动导入常用模块
import inspect
import pprint
```

### 使用 commands 自动执行

```python
# 在断点处自动执行命令
(Pdb) b 20
Breakpoint 1 at file.py:20
(Pdb) commands 1
(com) p x
(com) p y
(com) c
(com) end
```

### 保持调试代码清洁

```python
# debug_utils.py
import os
import functools

def debug_on_error(func):
    """装饰器：出错时自动进入调试"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception:
            if os.environ.get('DEBUG'):
                import pdb
                pdb.post_mortem()
            raise
    return wrapper

@debug_on_error
def risky_function():
    return 1 / 0

# 使用: DEBUG=1 python script.py
```

### 集成日志和调试

```python
import logging
import pdb

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def debug_with_logging(func):
    """结合日志和调试的装饰器"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"调用 {func.__name__}，参数: {args}, {kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} 返回: {result}")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} 异常: {e}")
            breakpoint()
            raise
    return wrapper
```

## 常见陷阱

### 忘记移除断点

```python
# 问题：生产代码中遗留的断点
def production_function():
    data = fetch_data()
    breakpoint()  # 危险！会在生产环境中停止程序
    return process(data)

# 解决方案：使用条件断点
import os

def safe_function():
    data = fetch_data()
    if os.environ.get('DEBUG'):
        breakpoint()
    return process(data)
```

### 在多线程环境中调试

```python
import threading
import pdb

# 问题：多线程中使用 pdb 可能导致混乱
def worker(name):
    for i in range(5):
        pdb.set_trace()  # 多个线程会争用 stdin/stdout
        print(f"{name}: {i}")

# 解决方案：使用线程感知的调试方式
import threading

debug_lock = threading.Lock()

def safe_worker(name):
    for i in range(5):
        with debug_lock:
            if threading.current_thread().name == 'Thread-1':
                breakpoint()
        print(f"{name}: {i}")
```

### 调试生成器时的困惑

```python
def number_generator():
    for i in range(5):
        breakpoint()  # 每次 next() 调用都会触发
        yield i

# 调试生成器的正确方式
gen = number_generator()
# 每次调用 next() 都会进入断点
result = next(gen)
```

### 变量名与 pdb 命令冲突

```python
def confusing_debug():
    # 这些变量名与 pdb 命令冲突
    n = 10      # 与 'next' 命令冲突
    c = 20      # 与 'continue' 命令冲突
    l = [1,2,3] # 与 'list' 命令冲突

    breakpoint()

    # 在 pdb 中访问这些变量需要：
    # (Pdb) p n      # 使用 print 命令
    # (Pdb) !n       # 使用 ! 前缀
    # (Pdb) print(n) # 使用完整语句
```

### 递归调试陷入无限循环

```python
def recursive_func(n):
    breakpoint()  # 每次递归都会触发
    if n <= 0:
        return 0
    return n + recursive_func(n - 1)

# 解决方案：使用条件断点
def better_recursive(n, _debug_depth=[0]):
    _debug_depth[0] += 1
    if _debug_depth[0] == 1:  # 只在第一次调用时断点
        breakpoint()
    if n <= 0:
        return 0
    result = n + better_recursive(n - 1)
    _debug_depth[0] -= 1
    return result
```

### 异步代码调试的特殊处理

```python
import asyncio

async def async_function():
    await asyncio.sleep(1)
    breakpoint()  # 在异步上下文中调试
    return "done"

# 问题：直接调用不会触发断点
# async_function()  # 返回协程对象，不执行

# 正确方式
asyncio.run(async_function())
```

## 性能考量

### 断点对性能的影响

```python
import time

def performance_test():
    """测试断点的性能影响"""
    # 无断点
    start = time.perf_counter()
    for i in range(100000):
        x = i * 2
    no_bp_time = time.perf_counter() - start

    # 有断点（但禁用）
    import sys
    sys.breakpointhook = lambda: None

    start = time.perf_counter()
    for i in range(100000):
        breakpoint()  # 调用但立即返回
        x = i * 2
    bp_disabled_time = time.perf_counter() - start

    print(f"无断点: {no_bp_time:.4f}s")
    print(f"断点禁用: {bp_disabled_time:.4f}s")
    print(f"开销: {(bp_disabled_time/no_bp_time - 1)*100:.1f}%")

performance_test()
```

### 条件断点的性能

```python
# 条件断点在每次到达时都会评估条件
# 复杂条件会增加开销

# 较慢：复杂条件
(Pdb) b 10, len([x for x in data if x > 100]) > 5

# 较快：简单条件
(Pdb) b 10, counter > 1000
```

### 生产环境中的调试

```python
# 使用环境变量控制调试功能
import os

DEBUG_MODE = os.environ.get('PYTHON_DEBUG', '').lower() in ('1', 'true', 'yes')

def conditional_debug():
    """仅在调试模式下启用断点"""
    if DEBUG_MODE:
        breakpoint()

# 或者完全禁用 breakpoint
if not DEBUG_MODE:
    import sys
    sys.breakpointhook = lambda *args, **kwargs: None
```

## 实战场景

### 场景一：调试 Web 应用

```python
# flask_debug.py
from flask import Flask, request, jsonify
import pdb

app = Flask(__name__)

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.get_json()

    # 在开发环境中调试
    if app.debug:
        breakpoint()

    try:
        result = data['a'] / data['b']
        return jsonify({'result': result})
    except ZeroDivisionError:
        if app.debug:
            pdb.post_mortem()
        return jsonify({'error': '除数不能为零'}), 400

if __name__ == '__main__':
    app.run(debug=True)
```

### 场景二：调试数据处理管道

```python
# data_pipeline_debug.py
import pandas as pd

def debug_pipeline(df, step_name):
    """管道调试辅助函数"""
    print(f"\n=== {step_name} ===")
    print(f"形状: {df.shape}")
    print(f"列: {list(df.columns)}")
    print(f"空值:\n{df.isnull().sum()}")

    if os.environ.get('DEBUG_PIPELINE'):
        breakpoint()

    return df

def process_data(filepath):
    # 读取数据
    df = pd.read_csv(filepath)
    df = debug_pipeline(df, "原始数据")

    # 清洗数据
    df = df.dropna()
    df = debug_pipeline(df, "删除空值后")

    # 转换数据
    df['date'] = pd.to_datetime(df['date'])
    df = debug_pipeline(df, "日期转换后")

    # 聚合数据
    result = df.groupby('category').agg({'value': 'sum'})
    result = debug_pipeline(result, "聚合后")

    return result
```

### 场景三：调试机器学习模型

```python
# ml_debug.py
import numpy as np

class DebugCallback:
    """用于调试模型训练的回调"""

    def __init__(self, debug_epochs=None):
        self.debug_epochs = debug_epochs or []
        self.history = {'loss': [], 'accuracy': []}

    def on_epoch_end(self, epoch, loss, accuracy):
        self.history['loss'].append(loss)
        self.history['accuracy'].append(accuracy)

        print(f"Epoch {epoch}: loss={loss:.4f}, accuracy={accuracy:.4f}")

        # 在指定的 epoch 进入调试
        if epoch in self.debug_epochs:
            print(f"在 epoch {epoch} 进入调试模式")
            breakpoint()

        # 检测异常情况
        if np.isnan(loss):
            print("检测到 NaN loss，进入调试模式")
            breakpoint()

        if len(self.history['loss']) > 5:
            recent_loss = self.history['loss'][-5:]
            if recent_loss[-1] > recent_loss[0]:
                print("警告：loss 在增加，可能出现问题")
                if os.environ.get('DEBUG_ML'):
                    breakpoint()

# 使用示例
callback = DebugCallback(debug_epochs=[0, 10, 50])
```

### 场景四：调试网络请求

```python
# network_debug.py
import requests
from urllib.parse import urlparse

class DebuggableSession(requests.Session):
    """支持调试的 requests Session"""

    def __init__(self, debug=False):
        super().__init__()
        self.debug = debug
        self.request_history = []

    def request(self, method, url, **kwargs):
        # 记录请求
        request_info = {
            'method': method,
            'url': url,
            'params': kwargs.get('params'),
            'data': kwargs.get('data'),
            'json': kwargs.get('json'),
        }

        if self.debug:
            print(f"\n发送请求: {method} {url}")
            print(f"参数: {kwargs}")
            breakpoint()  # 发送前调试

        response = super().request(method, url, **kwargs)

        # 记录响应
        request_info['status_code'] = response.status_code
        request_info['response_time'] = response.elapsed.total_seconds()
        self.request_history.append(request_info)

        if self.debug:
            print(f"响应状态: {response.status_code}")
            print(f"响应时间: {response.elapsed.total_seconds():.3f}s")

            # 对错误响应进入调试
            if response.status_code >= 400:
                print("检测到错误响应，进入调试模式")
                breakpoint()

        return response

# 使用
session = DebuggableSession(debug=True)
response = session.get('https://api.example.com/users')
```

### 场景五：使用 pdb++ 增强调试

```bash
# 安装 pdb++
pip install pdbpp
```

```python
# pdbpp_demo.py
"""
pdb++ 提供了增强功能：
1. 语法高亮
2. Tab 补全
3. sticky 模式（持续显示代码）
4. 更好的用户体验
"""

def demonstrate_pdbpp():
    data = {
        'users': [
            {'name': '张三', 'age': 25},
            {'name': '李四', 'age': 30},
            {'name': '王五', 'age': 35},
        ],
        'settings': {
            'theme': 'dark',
            'language': 'zh-CN',
        }
    }

    breakpoint()  # pdb++ 会自动被使用

    # pdb++ 特有命令：
    # sticky: 持续显示当前代码位置
    # pp: 美化打印（比 pdb 更好）
    # longlist: 显示完整函数
    # interact: 进入交互模式

    for user in data['users']:
        print(f"处理用户: {user['name']}")

    return data

if __name__ == "__main__":
    demonstrate_pdbpp()
```

### pdb++ 配置文件

```python
# ~/.pdbrc.py（注意是 .py 文件，不是 .pdbrc）
import pdb

class Config(pdb.DefaultConfig):
    # 启用语法高亮
    highlight = True

    # 使用 256 色
    use_pygments = True
    pygments_formatter_class = 'pygments.formatters.TerminalTrueColorFormatter'

    # 默认开启 sticky 模式
    sticky_by_default = True

    # 显示行号
    line_number_color = pdb.Color.turquoise

    # 当前行颜色
    current_line_color = 40  # 绿色背景

    # 自定义提示符
    prompt = '(pdb++) '
```

## 面试要点

### pdb 和 print 调试的区别是什么？

**答案要点：**
- pdb 是交互式的，可以暂停程序执行并检查状态
- pdb 允许单步执行和跟踪代码流程
- pdb 可以在运行时修改变量值
- print 调试是一次性的，需要重新运行程序
- pdb 不需要修改代码就能检查任意变量

### 解释 breakpoint() 函数的工作原理

**答案要点：**
```python
# breakpoint() 的默认行为
def breakpoint(*args, **kwargs):
    import sys
    hook = getattr(sys, 'breakpointhook', None)
    if hook is None:
        hook = sys.__breakpointhook__
    return hook(*args, **kwargs)

# 可通过以下方式自定义：
# 设置 PYTHONBREAKPOINT 环境变量
# 修改 sys.breakpointhook
```

### 如何进行事后调试（Post-mortem debugging）？

**答案要点：**
```python
# 方式一：在 except 块中
try:
    risky_operation()
except Exception:
    import pdb
    pdb.post_mortem()

# 方式二：在命令行
python -m pdb script.py
# 程序崩溃后自动进入调试

# 方式三：使用 sys.excepthook
import sys
import pdb

def excepthook(type, value, tb):
    pdb.post_mortem(tb)

sys.excepthook = excepthook
```

### pdb 中的 step 和 next 有什么区别？

**答案要点：**
- `step (s)`: 执行下一行代码，如果是函数调用则进入函数内部
- `next (n)`: 执行下一行代码，如果是函数调用则执行完整个函数
- `return (r)`: 继续执行直到当前函数返回

```python
def inner():
    print("inner")  # step 会在这里停止

def outer():
    inner()  # next 会跳过 inner 的内部，step 会进入
    print("outer")
```

### 如何在多线程程序中使用 pdb？

**答案要点：**
- 标准 pdb 在多线程环境中有限制
- 可以使用 `threading.current_thread()` 进行条件断点
- 考虑使用专门的多线程调试工具（如 IDE 的调试器）
- 使用锁来序列化调试输入/输出

```python
import threading

def thread_safe_breakpoint():
    if threading.current_thread() is threading.main_thread():
        breakpoint()
```

### 什么是条件断点？如何设置？

**答案要点：**
```python
# 在代码中
def process(items):
    for i, item in enumerate(items):
        if i == 100:  # 条件断点
            breakpoint()
        process_item(item)

# 在 pdb 交互环境中
(Pdb) b 10, x > 100  # 当 x > 100 时在第 10 行断点
(Pdb) b func, len(items) == 0  # 当 items 为空时断点
```

### 如何查看和修改调用栈？

**答案要点：**
```python
# 查看调用栈
(Pdb) w        # where 命令
(Pdb) bt       # backtrace，同 where

# 移动调用栈
(Pdb) u        # up，移动到上一层
(Pdb) d        # down，移动到下一层

# 在不同栈帧中检查变量
(Pdb) u
(Pdb) p local_var  # 查看上一层的变量
(Pdb) d
```

### pdb++ 相比标准 pdb 有哪些增强功能？

**答案要点：**
- 语法高亮显示代码
- Tab 键自动补全
- sticky 模式持续显示代码位置
- 更好的 pretty-print 输出
- 智能缩进
- 配置文件支持（~/.pdbrc.py）

## 延伸阅读

### 官方文档

- [pdb 官方文档](https://docs.python.org/3/library/pdb.html)
- [Python 调试器命令](https://docs.python.org/3/library/pdb.html#debugger-commands)
- [breakpoint() 函数](https://docs.python.org/3/library/functions.html#breakpoint)
- [sys.settrace()](https://docs.python.org/3/library/sys.html#sys.settrace)

### 增强工具

- [pdb++](https://github.com/pdbpp/pdbpp) - pdb 的增强版本
- [ipdb](https://github.com/gotcha/ipdb) - 集成 IPython 的调试器
- [pudb](https://github.com/inducer/pudb) - 全屏控制台调试器
- [web-pdb](https://github.com/romanvm/python-web-pdb) - Web 界面的调试器

### 推荐文章

- [Python Debugging With Pdb - Real Python](https://realpython.com/python-debugging-pdb/)
- [Debugging in Python - Python Wiki](https://wiki.python.org/moin/PythonDebugging)
- [The Python Debugger - Python Tutorial](https://docs.python.org/3/tutorial/errors.html#the-python-debugger)

### 书籍推荐

- 《Python Cookbook》- David Beazley & Brian K. Jones
- 《Effective Python》- Brett Slatkin
- 《Fluent Python》- Luciano Ramalho

### 视频教程

- [PyCon Talk: Debug Like a Pro](https://www.youtube.com/watch?v=HHrVBKZLolg)
- [Real Python: Python Debugging Techniques](https://realpython.com/courses/python-debugging-pdb/)

### IDE 集成调试

- [VS Code Python 调试](https://code.visualstudio.com/docs/python/debugging)
- [PyCharm 调试器](https://www.jetbrains.com/help/pycharm/debugging-code.html)
- [Jupyter 调试](https://jupyterlab.readthedocs.io/en/stable/user/debugger.html)
