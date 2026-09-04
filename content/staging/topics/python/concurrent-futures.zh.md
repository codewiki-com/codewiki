---
title: Python concurrent.futures 模块
description: 掌握 Python 并发编程高级接口：ThreadPoolExecutor、ProcessPoolExecutor、Future 对象与异步执行
track: python
section: concurrency
difficulty: intermediate
tags:
  - Python
  - concurrent.futures
  - 线程池
  - 进程池
  - 并发
status: imported
origin: old/src/content/docs/python/concurrent-futures.zh.md
divergence: 0.195
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 并发编程
  order: 12
  lastUpdated: 2026-01-07
---

## 概念解释

`concurrent.futures` 是 Python 3.2 引入的标准库模块，提供了一个高级接口用于异步执行可调用对象。它抽象了线程和进程的底层细节，让开发者可以用统一的 API 来管理并发任务。

### 历史背景

在 `concurrent.futures` 出现之前，Python 开发者需要直接使用 `threading` 和 `multiprocessing` 模块来实现并发。这两个模块虽然功能强大，但 API 设计差异较大，且需要手动管理线程/进程的创建、销毁和结果收集。`concurrent.futures` 的出现解决了这些问题，提供了：

- 统一的执行器（Executor）抽象
- 标准化的 Future 对象表示异步计算结果
- 简洁的 `submit()` 和 `map()` 接口
- 便捷的结果收集机制

### 解决什么问题

1. **简化并发编程**: 无需手动管理线程/进程生命周期
2. **统一的接口**: 线程池和进程池使用相同的 API，便于切换
3. **结果管理**: Future 对象提供标准化的异步结果获取方式
4. **资源控制**: 通过池化机制限制并发数量，避免资源耗尽

## 核心原理

### 架构设计

```
                    ┌─────────────────────────────────────┐
                    │          concurrent.futures          │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
            ┌───────▼───────┐                   ┌────────▼────────┐
            │    Executor    │                   │     Future      │
            │   (抽象基类)   │                   │   (异步结果)    │
            └───────────────┘                   └─────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼─────────┐   ┌─────────▼───────────┐
│ThreadPoolExecutor│   │ProcessPoolExecutor │
│   (线程池)       │   │    (进程池)         │
└─────────────────┘   └─────────────────────┘
```

### 工作流程

1. **创建执行器**: 实例化 `ThreadPoolExecutor` 或 `ProcessPoolExecutor`
2. **提交任务**: 使用 `submit()` 或 `map()` 提交可调用对象
3. **获取 Future**: `submit()` 返回 Future 对象
4. **任务执行**: 执行器在工作线程/进程中执行任务
5. **结果收集**: 通过 Future 获取执行结果或异常

### 线程池 vs 进程池

| 特性 | ThreadPoolExecutor | ProcessPoolExecutor |
|------|-------------------|---------------------|
| 底层实现 | threading.Thread | multiprocessing.Process |
| GIL 限制 | 是 | 否 |
| 内存共享 | 共享 | 独立 |
| 创建开销 | 小 | 大 |
| 适用场景 | I/O 密集型 | CPU 密集型 |
| 数据传输 | 直接引用 | 序列化/反序列化 |

## 核心要点

### Executor 抽象基类

`Executor` 是所有执行器的抽象基类，定义了核心接口：

- `submit(fn, *args, **kwargs)`: 提交单个任务
- `map(fn, *iterables, timeout=None, chunksize=1)`: 批量映射执行
- `shutdown(wait=True, cancel_futures=False)`: 关闭执行器

### Future 对象

Future 代表异步操作的最终结果，提供以下方法：

- `result(timeout=None)`: 获取结果（阻塞）
- `exception(timeout=None)`: 获取异常
- `done()`: 检查是否完成
- `cancelled()`: 检查是否被取消
- `cancel()`: 尝试取消任务
- `add_done_callback(fn)`: 添加完成回调

### 辅助函数

- `as_completed(fs, timeout=None)`: 按完成顺序迭代 Future
- `wait(fs, timeout=None, return_when=ALL_COMPLETED)`: 等待 Future 完成

## 代码示例

### ThreadPoolExecutor 基础用法

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests

def fetch_url(url):
    """获取 URL 内容"""
    print(f"开始获取: {url}")
    response = requests.get(url, timeout=10)
    return {
        'url': url,
        'status': response.status_code,
        'length': len(response.content)
    }

def io_task(task_id, duration):
    """模拟 I/O 密集型任务"""
    print(f"任务 {task_id} 开始执行")
    time.sleep(duration)
    print(f"任务 {task_id} 完成")
    return f"任务 {task_id} 的结果"

# 示例 1: 基本使用
def basic_example():
    with ThreadPoolExecutor(max_workers=4) as executor:
        # 提交单个任务
        future = executor.submit(io_task, 1, 2)

        # 获取结果（会阻塞直到完成）
        result = future.result()
        print(f"结果: {result}")

# 示例 2: 提交多个任务
def multiple_tasks():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []

        # 提交多个任务
        for i in range(5):
            future = executor.submit(io_task, i, i % 3 + 1)
            futures.append(future)

        # 等待所有任务完成并获取结果
        for future in futures:
            result = future.result()
            print(f"获取到: {result}")

# 示例 3: 使用 as_completed 按完成顺序处理
def process_as_completed():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(io_task, i, (5 - i)): i
            for i in range(5)
        }

        # 按完成顺序处理结果
        for future in as_completed(futures):
            task_id = futures[future]
            try:
                result = future.result()
                print(f"任务 {task_id} 返回: {result}")
            except Exception as e:
                print(f"任务 {task_id} 出错: {e}")

# 示例 4: 批量下载
def batch_download():
    urls = [
        "https://httpbin.org/get",
        "https://httpbin.org/ip",
        "https://httpbin.org/headers",
        "https://httpbin.org/user-agent"
    ]

    start = time.time()
    with ThreadPoolExecutor(max_workers=4) as executor:
        # 提交所有下载任务
        future_to_url = {
            executor.submit(fetch_url, url): url
            for url in urls
        }

        # 处理完成的任务
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            try:
                data = future.result()
                print(f"完成 {data['url']}: {data['status']} ({data['length']} bytes)")
            except Exception as e:
                print(f"失败 {url}: {e}")

    print(f"总耗时: {time.time() - start:.2f} 秒")

if __name__ == "__main__":
    print("=== 基本示例 ===")
    basic_example()

    print("\n=== 多任务示例 ===")
    multiple_tasks()

    print("\n=== as_completed 示例 ===")
    process_as_completed()
```

### ProcessPoolExecutor 基础用法

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
import time
import math
import os

def cpu_intensive_task(n):
    """CPU 密集型任务: 计算质数数量"""
    count = 0
    for num in range(2, n):
        if all(num % i != 0 for i in range(2, int(math.sqrt(num)) + 1)):
            count += 1
    return count

def calculate_factorial(n):
    """计算阶乘"""
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def worker_info(task_id):
    """显示工作进程信息"""
    pid = os.getpid()
    print(f"任务 {task_id} 在进程 {pid} 中执行")
    time.sleep(1)
    return f"任务 {task_id} (PID: {pid})"

# 示例 1: 基本使用
def basic_process_pool():
    print(f"主进程 PID: {os.getpid()}")

    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(worker_info, i)
            for i in range(8)
        ]

        for future in as_completed(futures):
            print(f"完成: {future.result()}")

# 示例 2: CPU 密集型任务
def cpu_intensive_example():
    numbers = [100000, 150000, 200000, 250000]

    # 串行执行
    start = time.time()
    serial_results = [cpu_intensive_task(n) for n in numbers]
    serial_time = time.time() - start
    print(f"串行执行耗时: {serial_time:.2f} 秒")

    # 并行执行
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as executor:
        parallel_results = list(executor.map(cpu_intensive_task, numbers))
    parallel_time = time.time() - start
    print(f"并行执行耗时: {parallel_time:.2f} 秒")
    print(f"加速比: {serial_time / parallel_time:.2f}x")

    # 验证结果一致
    assert serial_results == parallel_results

# 示例 3: 使用 map 批量处理
def map_example():
    numbers = list(range(10, 20))

    with ProcessPoolExecutor(max_workers=4) as executor:
        # map 返回迭代器，结果按输入顺序返回
        results = executor.map(calculate_factorial, numbers)

        for n, result in zip(numbers, results):
            print(f"{n}! = {result}")

if __name__ == "__main__":
    print("=== 基本进程池示例 ===")
    basic_process_pool()

    print("\n=== CPU 密集型任务对比 ===")
    cpu_intensive_example()

    print("\n=== map 批量处理 ===")
    map_example()
```

### submit() 方法详解

```python
from concurrent.futures import ThreadPoolExecutor, Future
import time

def task_with_args(a, b, c=10):
    """带参数的任务"""
    time.sleep(1)
    return a + b + c

def task_with_exception():
    """会抛出异常的任务"""
    time.sleep(0.5)
    raise ValueError("故意抛出的错误")

# submit() 的各种用法
with ThreadPoolExecutor(max_workers=2) as executor:
    # 1. 位置参数
    future1 = executor.submit(task_with_args, 1, 2)

    # 2. 关键字参数
    future2 = executor.submit(task_with_args, 1, 2, c=20)

    # 3. 混合参数
    future3 = executor.submit(task_with_args, a=5, b=10, c=15)

    # 4. 使用 lambda
    future4 = executor.submit(lambda: task_with_args(100, 200))

    # 获取结果
    print(f"Future 1: {future1.result()}")  # 13
    print(f"Future 2: {future2.result()}")  # 23
    print(f"Future 3: {future3.result()}")  # 30
    print(f"Future 4: {future4.result()}")  # 310

# 处理异常
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(task_with_exception)

    # 等待完成
    time.sleep(1)

    # 方式 1: 使用 exception() 方法
    exc = future.exception()
    if exc:
        print(f"任务异常: {type(exc).__name__}: {exc}")

    # 方式 2: 使用 try-except 捕获
    future2 = executor.submit(task_with_exception)
    try:
        result = future2.result()
    except ValueError as e:
        print(f"捕获异常: {e}")
```

### map() 方法详解

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time

def process_item(item):
    """处理单个项目"""
    time.sleep(0.5)
    return item * 2

def process_pair(a, b):
    """处理一对数据"""
    time.sleep(0.3)
    return a + b

# 基本 map 用法
with ThreadPoolExecutor(max_workers=4) as executor:
    items = [1, 2, 3, 4, 5]

    # map 返回迭代器，结果按输入顺序
    results = executor.map(process_item, items)
    print(f"结果: {list(results)}")  # [2, 4, 6, 8, 10]

# 多参数 map
with ThreadPoolExecutor(max_workers=4) as executor:
    list_a = [1, 2, 3, 4, 5]
    list_b = [10, 20, 30, 40, 50]

    # 使用多个可迭代对象
    results = executor.map(process_pair, list_a, list_b)
    print(f"配对结果: {list(results)}")  # [11, 22, 33, 44, 55]

# 带超时的 map
with ThreadPoolExecutor(max_workers=2) as executor:
    items = list(range(10))

    try:
        # timeout 设置整个迭代的超时时间
        results = executor.map(process_item, items, timeout=2)
        for result in results:
            print(result)
    except TimeoutError:
        print("操作超时！")

# ProcessPoolExecutor 的 chunksize 参数
def simple_task(x):
    return x * x

with ProcessPoolExecutor(max_workers=4) as executor:
    items = list(range(1000))

    # chunksize 控制每次发送给工作进程的任务数
    # 较大的 chunksize 减少 IPC 开销，适合大量小任务
    start = time.time()
    results = list(executor.map(simple_task, items, chunksize=100))
    print(f"chunksize=100 耗时: {time.time() - start:.3f} 秒")

    start = time.time()
    results = list(executor.map(simple_task, items, chunksize=1))
    print(f"chunksize=1 耗时: {time.time() - start:.3f} 秒")
```

### as_completed() 函数详解

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random

def variable_duration_task(task_id):
    """持续时间不确定的任务"""
    duration = random.uniform(0.5, 3.0)
    time.sleep(duration)
    return {
        'task_id': task_id,
        'duration': duration
    }

def task_may_fail(task_id):
    """可能失败的任务"""
    time.sleep(random.uniform(0.5, 1.5))
    if random.random() < 0.3:  # 30% 失败率
        raise Exception(f"任务 {task_id} 失败")
    return f"任务 {task_id} 成功"

# 基本用法
def as_completed_basic():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(variable_duration_task, i)
            for i in range(6)
        ]

        # 按完成顺序处理
        print("按完成顺序处理结果:")
        for future in as_completed(futures):
            result = future.result()
            print(f"  任务 {result['task_id']} 完成 (耗时 {result['duration']:.2f}s)")

# 带超时的 as_completed
def as_completed_with_timeout():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(variable_duration_task, i)
            for i in range(10)
        ]

        try:
            # 设置整体超时时间
            for future in as_completed(futures, timeout=2):
                result = future.result()
                print(f"任务 {result['task_id']} 完成")
        except TimeoutError:
            print("超时！以下任务未完成:")
            for f in futures:
                if not f.done():
                    print(f"  - Future {id(f)}")

# 关联任务和结果
def as_completed_with_context():
    with ThreadPoolExecutor(max_workers=4) as executor:
        # 使用字典关联 Future 和原始数据
        future_to_task = {
            executor.submit(task_may_fail, i): i
            for i in range(10)
        }

        success_count = 0
        failure_count = 0

        for future in as_completed(future_to_task):
            task_id = future_to_task[future]
            try:
                result = future.result()
                print(f"成功: {result}")
                success_count += 1
            except Exception as e:
                print(f"失败: 任务 {task_id} 异常: {e}")
                failure_count += 1

        print(f"\n总结: {success_count} 成功, {failure_count} 失败")

if __name__ == "__main__":
    print("=== as_completed 基本用法 ===")
    as_completed_basic()

    print("\n=== 带超时的 as_completed ===")
    as_completed_with_timeout()

    print("\n=== 关联任务和结果 ===")
    as_completed_with_context()
```

### wait() 函数详解

```python
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED, FIRST_EXCEPTION, ALL_COMPLETED
import time
import random

def task(task_id, duration):
    """普通任务"""
    time.sleep(duration)
    return f"任务 {task_id} 完成 (耗时 {duration}s)"

def failing_task(task_id):
    """会失败的任务"""
    time.sleep(random.uniform(0.5, 1.5))
    raise ValueError(f"任务 {task_id} 失败")

# wait() 基本用法
def wait_basic():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(task, i, random.uniform(1, 3))
            for i in range(5)
        ]

        # 默认等待所有完成
        done, not_done = wait(futures)

        print(f"已完成: {len(done)} 个")
        print(f"未完成: {len(not_done)} 个")

        for future in done:
            print(f"  结果: {future.result()}")

# FIRST_COMPLETED: 任一完成即返回
def wait_first_completed():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(task, 0, 3),   # 慢
            executor.submit(task, 1, 1),   # 快
            executor.submit(task, 2, 2),   # 中
        ]

        # 第一个完成就返回
        done, not_done = wait(futures, return_when=FIRST_COMPLETED)

        print(f"第一个完成的任务:")
        for future in done:
            print(f"  {future.result()}")

        print(f"仍在执行: {len(not_done)} 个")

# FIRST_EXCEPTION: 出现异常或全部完成时返回
def wait_first_exception():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(task, 0, 2),
            executor.submit(failing_task, 1),  # 会失败
            executor.submit(task, 2, 3),
        ]

        done, not_done = wait(futures, return_when=FIRST_EXCEPTION)

        print("有异常或全部完成时返回:")
        for future in done:
            try:
                print(f"  成功: {future.result()}")
            except Exception as e:
                print(f"  失败: {e}")

# 带超时的 wait
def wait_with_timeout():
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(task, i, i + 1)
            for i in range(5)
        ]

        # 只等待 2 秒
        done, not_done = wait(futures, timeout=2)

        print(f"2秒内完成: {len(done)} 个")
        print(f"超时未完成: {len(not_done)} 个")

        # 处理完成的任务
        for future in done:
            print(f"  {future.result()}")

        # 可以选择取消未完成的任务
        for future in not_done:
            future.cancel()

if __name__ == "__main__":
    print("=== wait 基本用法 ===")
    wait_basic()

    print("\n=== FIRST_COMPLETED ===")
    wait_first_completed()

    print("\n=== FIRST_EXCEPTION ===")
    wait_first_exception()

    print("\n=== 带超时的 wait ===")
    wait_with_timeout()
```

### Future 对象详解

```python
from concurrent.futures import ThreadPoolExecutor, Future
import time
import threading

def long_task(duration):
    """长时间运行的任务"""
    time.sleep(duration)
    return f"完成 (耗时 {duration}s)"

def failing_task():
    """会失败的任务"""
    time.sleep(1)
    raise RuntimeError("任务执行失败")

# Future 的状态和方法
with ThreadPoolExecutor(max_workers=2) as executor:
    # 提交任务获取 Future
    future = executor.submit(long_task, 2)

    # done(): 检查是否完成
    print(f"已完成: {future.done()}")  # False

    # running(): 检查是否正在运行
    print(f"运行中: {future.running()}")  # True

    # cancelled(): 检查是否已取消
    print(f"已取消: {future.cancelled()}")  # False

    # result(): 获取结果（阻塞）
    result = future.result()
    print(f"结果: {result}")

    # 任务完成后的状态
    print(f"已完成: {future.done()}")  # True

# cancel(): 取消任务
with ThreadPoolExecutor(max_workers=1) as executor:
    # 提交两个任务，只有一个工作线程
    future1 = executor.submit(long_task, 5)
    future2 = executor.submit(long_task, 5)  # 这个会排队

    time.sleep(0.1)  # 等待第一个开始

    # 尝试取消正在运行的任务（通常会失败）
    cancelled1 = future1.cancel()
    print(f"取消运行中的任务: {cancelled1}")  # False

    # 尝试取消排队的任务（通常会成功）
    cancelled2 = future2.cancel()
    print(f"取消排队的任务: {cancelled2}")  # True

# exception(): 获取异常
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(failing_task)

    # 等待完成
    time.sleep(1.5)

    # 获取异常（不会重新抛出）
    exc = future.exception()
    if exc:
        print(f"异常类型: {type(exc).__name__}")
        print(f"异常消息: {exc}")

# add_done_callback(): 添加回调
def on_complete(future):
    """任务完成时的回调"""
    try:
        result = future.result()
        print(f"[回调] 任务成功: {result}")
    except Exception as e:
        print(f"[回调] 任务失败: {e}")

with ThreadPoolExecutor(max_workers=2) as executor:
    future1 = executor.submit(long_task, 1)
    future2 = executor.submit(failing_task)

    # 添加回调（任务完成时自动调用）
    future1.add_done_callback(on_complete)
    future2.add_done_callback(on_complete)

    # 等待所有完成
    time.sleep(2)

# result() 的超时参数
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(long_task, 10)

    try:
        # 只等待 2 秒
        result = future.result(timeout=2)
    except TimeoutError:
        print("获取结果超时")
        future.cancel()
```

## 最佳实践

### 使用上下文管理器

```python
from concurrent.futures import ThreadPoolExecutor

def task(n):
    return n * 2

# 推荐：使用 with 语句
def good_practice():
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(task, i) for i in range(10)]
        results = [f.result() for f in futures]
    # 执行器自动关闭，等待所有任务完成

# 不推荐：手动管理
def less_ideal_practice():
    executor = ThreadPoolExecutor(max_workers=4)
    try:
        futures = [executor.submit(task, i) for i in range(10)]
        results = [f.result() for f in futures]
    finally:
        executor.shutdown(wait=True)  # 必须手动关闭
```

### 合理设置工作线程/进程数

```python
import os
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# I/O 密集型：可以设置较多线程
def io_bound_configuration():
    # 常见配置: CPU 核心数 * 5 或更多
    max_workers = min(32, os.cpu_count() * 5)
    return ThreadPoolExecutor(max_workers=max_workers)

# CPU 密集型：进程数不超过 CPU 核心数
def cpu_bound_configuration():
    # 默认使用 CPU 核心数
    return ProcessPoolExecutor()  # 等同于 max_workers=os.cpu_count()

    # 或者明确指定
    return ProcessPoolExecutor(max_workers=os.cpu_count())
```

### 优雅处理异常

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def potentially_failing_task(task_id):
    """可能失败的任务"""
    import random
    if random.random() < 0.3:
        raise ValueError(f"任务 {task_id} 失败")
    return f"任务 {task_id} 成功"

def robust_task_execution():
    """健壮的任务执行模式"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(potentially_failing_task, i): i
            for i in range(10)
        }

        results = []
        errors = []

        for future in as_completed(futures):
            task_id = futures[future]
            try:
                result = future.result()
                results.append(result)
                logger.info(f"任务 {task_id} 成功")
            except Exception as e:
                errors.append({'task_id': task_id, 'error': str(e)})
                logger.error(f"任务 {task_id} 失败: {e}")

        return results, errors
```

### 限制并发数量

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

def api_call(task_id):
    """模拟 API 调用"""
    time.sleep(0.5)
    return f"任务 {task_id} 完成"

class RateLimitedExecutor:
    """带速率限制的执行器包装"""

    def __init__(self, max_workers=10, max_concurrent=5):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.semaphore = threading.Semaphore(max_concurrent)

    def submit(self, fn, *args, **kwargs):
        def wrapped():
            with self.semaphore:
                return fn(*args, **kwargs)
        return self.executor.submit(wrapped)

    def shutdown(self, wait=True):
        self.executor.shutdown(wait=wait)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.shutdown()

# 使用示例
with RateLimitedExecutor(max_workers=10, max_concurrent=3) as executor:
    futures = [executor.submit(api_call, i) for i in range(20)]
    for future in as_completed(futures):
        print(future.result())
```

### 超时控制

```python
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import functools
import time

def slow_function(data):
    """可能很慢的函数"""
    time.sleep(10)
    return data * 2

def timeout_wrapper(timeout):
    """为函数添加超时控制的装饰器"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(func, *args, **kwargs)
                try:
                    return future.result(timeout=timeout)
                except TimeoutError:
                    future.cancel()
                    raise TimeoutError(f"{func.__name__} 执行超时 ({timeout}s)")
        return wrapper
    return decorator

@timeout_wrapper(timeout=5)
def potentially_slow_function(data):
    """可能很慢的函数"""
    time.sleep(10)
    return data

# 使用
try:
    result = potentially_slow_function("test")
except TimeoutError as e:
    print(f"超时: {e}")
```

## 常见陷阱

### 在 ProcessPoolExecutor 中使用不可序列化对象

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

# 错误：lambda 不能被序列化
def bad_example():
    with ProcessPoolExecutor() as executor:
        # 这会导致序列化错误
        # future = executor.submit(lambda x: x * 2, 10)
        pass

# 正确：使用顶层函数
def multiply(x):
    return x * 2

def good_example():
    with ProcessPoolExecutor() as executor:
        future = executor.submit(multiply, 10)
        print(future.result())

# 错误：传递不可序列化的对象
class NonSerializable:
    def __init__(self):
        self.lock = multiprocessing.Lock()  # Lock 不能序列化

def process_data(value):
    return value * 2

def bad_example_2():
    with ProcessPoolExecutor() as executor:
        # 包含 Lock 的对象不能序列化
        # 需要重新设计数据结构
        pass
```

### 忘记处理 Future 的异常

```python
from concurrent.futures import ThreadPoolExecutor

def failing_task():
    raise ValueError("错误")

# 错误：忽略异常
def bad_example():
    with ThreadPoolExecutor() as executor:
        future = executor.submit(failing_task)
        # 没有调用 result() 或 exception()
        # 异常会被静默忽略

    # 程序继续运行，但任务实际上失败了

# 正确：始终处理异常
def good_example():
    with ThreadPoolExecutor() as executor:
        future = executor.submit(failing_task)
        try:
            result = future.result()
        except Exception as e:
            print(f"任务失败: {e}")
            # 适当的错误处理
```

### 在回调中执行耗时操作

```python
from concurrent.futures import ThreadPoolExecutor
import time

def task():
    return "结果"

def process_result(result):
    time.sleep(5)  # 在工作线程中执行
    print(f"处理完成: {result}")

# 错误：回调中执行耗时操作会阻塞其他回调
def slow_callback(future):
    result = future.result()
    time.sleep(5)  # 阻塞！
    print(f"处理完成: {result}")

# 正确：回调应该轻量，或提交新任务
def fast_callback(future, executor):
    result = future.result()
    # 提交新任务处理结果
    executor.submit(process_result, result)
```

### 死锁风险

```python
from concurrent.futures import ThreadPoolExecutor
import threading

lock = threading.Lock()

def task_a(executor):
    with lock:
        print("Task A 持有锁")
        # 错误：等待另一个任务，但只有一个工作线程
        # future = executor.submit(task_b)
        # future.result()  # 死锁！

def task_b():
    with lock:
        print("Task B")

# 解决方案：增加工作线程或重构代码
# executor = ThreadPoolExecutor(max_workers=2)  # 更多线程
```

### 忽略 shutdown 的 wait 参数

```python
from concurrent.futures import ThreadPoolExecutor
import time

def task(n):
    time.sleep(n)
    return n

# 错误：wait=False 可能导致任务未完成就退出
def bad_example():
    executor = ThreadPoolExecutor()
    futures = [executor.submit(task, i) for i in range(5)]
    executor.shutdown(wait=False)  # 不等待任务完成
    # 主程序可能在任务完成前退出

# 正确：确保等待任务完成
def good_example():
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(task, i) for i in range(5)]
        results = [f.result() for f in futures]
    # with 语句会自动调用 shutdown(wait=True)
```

## 性能考量

### 线程池 vs 进程池性能对比

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time
import math

def cpu_bound(n):
    """CPU 密集型"""
    return sum(math.sqrt(i) for i in range(n))

def io_bound(duration):
    """I/O 密集型"""
    time.sleep(duration)
    return duration

def benchmark():
    iterations = [10000000] * 4
    durations = [1] * 4

    print("=== CPU 密集型任务 ===")

    # 串行
    start = time.time()
    [cpu_bound(n) for n in iterations]
    serial_time = time.time() - start
    print(f"串行: {serial_time:.2f}s")

    # ThreadPoolExecutor
    start = time.time()
    with ThreadPoolExecutor(max_workers=4) as e:
        list(e.map(cpu_bound, iterations))
    thread_time = time.time() - start
    print(f"线程池: {thread_time:.2f}s (加速比: {serial_time/thread_time:.2f}x)")

    # ProcessPoolExecutor
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as e:
        list(e.map(cpu_bound, iterations))
    process_time = time.time() - start
    print(f"进程池: {process_time:.2f}s (加速比: {serial_time/process_time:.2f}x)")

    print("\n=== I/O 密集型任务 ===")

    # 串行
    start = time.time()
    [io_bound(d) for d in durations]
    serial_time = time.time() - start
    print(f"串行: {serial_time:.2f}s")

    # ThreadPoolExecutor
    start = time.time()
    with ThreadPoolExecutor(max_workers=4) as e:
        list(e.map(io_bound, durations))
    thread_time = time.time() - start
    print(f"线程池: {thread_time:.2f}s (加速比: {serial_time/thread_time:.2f}x)")

    # ProcessPoolExecutor
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as e:
        list(e.map(io_bound, durations))
    process_time = time.time() - start
    print(f"进程池: {process_time:.2f}s (加速比: {serial_time/process_time:.2f}x)")

if __name__ == "__main__":
    benchmark()
```

### chunksize 对性能的影响

```python
from concurrent.futures import ProcessPoolExecutor
import time

def simple_task(x):
    return x * x

def test_chunksize():
    items = list(range(10000))

    for chunksize in [1, 10, 100, 1000]:
        start = time.time()
        with ProcessPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(simple_task, items, chunksize=chunksize))
        elapsed = time.time() - start
        print(f"chunksize={chunksize}: {elapsed:.3f}s")

# 结果示例：
# chunksize=1: 2.847s    (大量 IPC 开销)
# chunksize=10: 0.312s
# chunksize=100: 0.089s
# chunksize=1000: 0.052s (最优)

if __name__ == "__main__":
    test_chunksize()
```

### 内存使用优化

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import gc

def processor(item):
    """处理单个项目"""
    return item * 2

def memory_efficient_processing(items, batch_size=100):
    """内存友好的批处理"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        # 分批处理，避免一次性创建太多 Future
        for i in range(0, len(items), batch_size):
            batch = items[i:i+batch_size]
            futures = [executor.submit(processor, item) for item in batch]

            # 处理当前批次的结果
            for future in as_completed(futures):
                yield future.result()

            # 可选：强制垃圾回收
            gc.collect()
```

## 实战场景

### 场景 1: 并发 API 请求

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import time

class APIClient:
    """并发 API 客户端"""

    def __init__(self, base_url, max_workers=10, timeout=30):
        self.base_url = base_url
        self.max_workers = max_workers
        self.timeout = timeout
        self.session = requests.Session()

    def fetch(self, endpoint):
        """获取单个端点"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def batch_fetch(self, endpoints):
        """批量获取多个端点"""
        results = {}

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_endpoint = {
                executor.submit(self.fetch, ep): ep
                for ep in endpoints
            }

            for future in as_completed(future_to_endpoint):
                endpoint = future_to_endpoint[future]
                try:
                    results[endpoint] = {
                        'success': True,
                        'data': future.result()
                    }
                except Exception as e:
                    results[endpoint] = {
                        'success': False,
                        'error': str(e)
                    }

        return results

# 使用示例
# client = APIClient("https://api.github.com")
# endpoints = ["/users/python", "/users/django", "/users/flask"]
# results = client.batch_fetch(endpoints)
```

### 场景 2: 并行文件处理

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
import os
import hashlib
from pathlib import Path

def calculate_file_hash(filepath):
    """计算文件的 MD5 哈希"""
    hash_md5 = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_md5.update(chunk)
    return {
        'file': str(filepath),
        'hash': hash_md5.hexdigest(),
        'size': os.path.getsize(filepath)
    }

def process_directory(directory, pattern="*"):
    """并行处理目录中的文件"""
    directory = Path(directory)
    files = list(directory.glob(pattern))

    results = []
    with ProcessPoolExecutor() as executor:
        futures = {
            executor.submit(calculate_file_hash, f): f
            for f in files if f.is_file()
        }

        for future in as_completed(futures):
            filepath = futures[future]
            try:
                result = future.result()
                results.append(result)
                print(f"处理完成: {filepath.name}")
            except Exception as e:
                print(f"处理失败: {filepath.name} - {e}")

    return results

# 使用示例
# results = process_directory("/path/to/directory", "*.txt")
```

### 场景 3: 数据库批量操作

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
import threading

class DatabasePool:
    """简单的数据库连接池模拟"""

    def __init__(self, connection_factory, pool_size=5):
        self.connection_factory = connection_factory
        self.pool_size = pool_size
        self.connections = []
        self.lock = threading.Lock()
        self._initialize_pool()

    def _initialize_pool(self):
        for _ in range(self.pool_size):
            self.connections.append(self.connection_factory())

    @contextmanager
    def get_connection(self):
        conn = None
        with self.lock:
            if self.connections:
                conn = self.connections.pop()

        if conn is None:
            conn = self.connection_factory()

        try:
            yield conn
        finally:
            with self.lock:
                if len(self.connections) < self.pool_size:
                    self.connections.append(conn)

def batch_insert(db_pool, data_chunks):
    """批量插入数据"""
    def insert_chunk(chunk):
        with db_pool.get_connection() as conn:
            # 执行插入操作
            cursor = conn.cursor()
            cursor.executemany(
                "INSERT INTO table_name (col1, col2) VALUES (?, ?)",
                chunk
            )
            conn.commit()
            return len(chunk)

    total_inserted = 0
    with ThreadPoolExecutor(max_workers=db_pool.pool_size) as executor:
        futures = [executor.submit(insert_chunk, chunk) for chunk in data_chunks]

        for future in as_completed(futures):
            try:
                count = future.result()
                total_inserted += count
            except Exception as e:
                print(f"插入失败: {e}")

    return total_inserted
```

### 场景 4: 图像处理管道

```python
from concurrent.futures import ProcessPoolExecutor
import os

# 注意：PIL 需要安装 pillow 库
# from PIL import Image

def process_image(input_path, output_path, size=(800, 600)):
    """处理单张图片"""
    try:
        # 这里使用伪代码表示图像处理逻辑
        # with Image.open(input_path) as img:
        #     img.thumbnail(size)
        #     img.save(output_path, optimize=True)
        return {'input': input_path, 'output': output_path, 'success': True}
    except Exception as e:
        return {'input': input_path, 'error': str(e), 'success': False}

def batch_process_images(input_dir, output_dir, max_workers=None):
    """批量处理图片"""
    os.makedirs(output_dir, exist_ok=True)

    # 获取所有图片文件
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}
    input_files = [
        f for f in os.listdir(input_dir)
        if os.path.splitext(f)[1].lower() in image_extensions
    ]

    # 准备任务参数
    tasks = [
        (
            os.path.join(input_dir, f),
            os.path.join(output_dir, f)
        )
        for f in input_files
    ]

    results = {'success': 0, 'failed': 0}

    # 使用进程池处理（CPU 密集型的图像处理）
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_image, input_path, output_path)
            for input_path, output_path in tasks
        ]

        for future in futures:
            result = future.result()
            if result['success']:
                results['success'] += 1
                print(f"处理完成: {os.path.basename(result['output'])}")
            else:
                results['failed'] += 1
                print(f"处理失败: {result['input']} - {result['error']}")

    print(f"\n总计: {results['success']} 成功, {results['failed']} 失败")
    return results
```

## 面试要点

### 基础概念题

**Q: concurrent.futures 模块的核心组件有哪些？**

A: 核心组件包括：
- `Executor`: 抽象基类，定义了 `submit()` 和 `map()` 接口
- `ThreadPoolExecutor`: 使用线程池执行任务
- `ProcessPoolExecutor`: 使用进程池执行任务
- `Future`: 代表异步操作的结果
- `as_completed()`: 按完成顺序迭代 Future
- `wait()`: 等待 Future 完成

**Q: ThreadPoolExecutor 和 ProcessPoolExecutor 的主要区别是什么？**

A:
- `ThreadPoolExecutor` 基于线程，受 GIL 限制，适合 I/O 密集型任务
- `ProcessPoolExecutor` 基于进程，不受 GIL 限制，适合 CPU 密集型任务
- 进程池有序列化开销，传递大对象时性能较差
- 线程池共享内存，进程池内存独立

### 进阶问题

**Q: submit() 和 map() 的区别是什么？何时使用哪个？**

A:
```python
# submit(): 返回 Future 对象，更灵活
future = executor.submit(func, arg1, arg2)
result = future.result()

# map(): 返回迭代器，结果按输入顺序
results = executor.map(func, iterable)

# 使用场景：
# - submit(): 需要细粒度控制、获取异常详情、使用回调
# - map(): 批量处理、简单场景、关心顺序
```

**Q: 如何处理 Future 中的异常？**

A:
```python
# 方式 1: 使用 result() 会重新抛出异常
try:
    result = future.result()
except Exception as e:
    handle_error(e)

# 方式 2: 使用 exception() 获取异常对象
exc = future.exception()
if exc:
    handle_error(exc)

# 方式 3: 在 as_completed 循环中处理
for future in as_completed(futures):
    try:
        result = future.result()
    except Exception as e:
        handle_error(e)
```

**Q: ProcessPoolExecutor 为什么要求可调用对象可序列化？**

A: 因为进程之间内存独立，任务需要通过序列化机制传输到工作进程。不可序列化的对象（如 lambda、局部函数、包含 Lock 的对象）会导致错误。

### 实践问题

**Q: 如何实现带重试机制的并发任务执行？**

A:
```python
import time

def retry_task(func, args, max_retries=3, delay=1):
    for attempt in range(max_retries):
        try:
            return func(*args)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(delay * (2 ** attempt))  # 指数退避

with ThreadPoolExecutor() as executor:
    futures = [
        executor.submit(retry_task, process, (data,))
        for data in items
    ]
```

**Q: 如何优雅地取消正在执行的任务？**

A: `Future.cancel()` 只能取消尚未开始的任务。对于正在执行的任务：
- 线程任务：使用 `threading.Event` 实现协作式取消
- 进程任务：使用 `multiprocessing.Event` 或发送信号

```python
import threading

stop_event = threading.Event()

def cancellable_task(stop_event):
    while not stop_event.is_set():
        # 执行工作
        pass
    return "已取消"

# 取消任务
stop_event.set()
```

## 延伸阅读

### 官方文档
- [concurrent.futures 官方文档](https://docs.python.org/3/library/concurrent.futures.html)
- [PEP 3148 - futures - execute computations asynchronously](https://peps.python.org/pep-3148/)

### 相关模块
- [threading 模块文档](https://docs.python.org/3/library/threading.html)
- [multiprocessing 模块文档](https://docs.python.org/3/library/multiprocessing.html)
- [asyncio 模块文档](https://docs.python.org/3/library/asyncio.html)

### 推荐书籍
- 《Python 并发编程实战》
- 《Effective Python》第七章：并发与并行
- 《High Performance Python》

### 优质文章
- [Real Python - Python Concurrency](https://realpython.com/python-concurrency/)
- [Python ThreadPoolExecutor Tutorial](https://superfastpython.com/threadpoolexecutor-in-python/)
- [Python ProcessPoolExecutor Tutorial](https://superfastpython.com/processpoolexecutor-in-python/)
