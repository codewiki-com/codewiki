---
title: Python 异步编程与 asyncio
description: 掌握 Python asyncio：async/await、事件循环、协程与并发执行
track: python
section: concurrency
difficulty: advanced
tags:
  - Python
  - asyncio
  - 异步编程
  - 协程
status: imported
origin: old/src/content/docs/python/asyncio.zh.md
divergence: 0.135
issues: []
legacy:
  category: Python
  subcategory: 并发编程
  order: 10
  lastUpdated: 2026-01-07
---

## 简介

asyncio 是 Python 标准库中用于编写异步并发代码的框架。它使用 async/await 语法，提供了高性能的 I/O 操作处理能力，特别适合处理网络请求、文件 I/O 等 I/O 密集型任务。

### 为什么需要异步编程？

传统的同步编程在处理 I/O 操作时会阻塞程序执行：

```python
import time

def download_file(url):
    print(f"开始下载 {url}")
    time.sleep(2)  # 模拟网络延迟
    print(f"完成下载 {url}")
    return f"内容来自 {url}"

# 同步执行 - 总耗时约 6 秒
start = time.time()
result1 = download_file("url1")
result2 = download_file("url2")
result3 = download_file("url3")
print(f"总耗时: {time.time() - start:.2f} 秒")
```

而异步编程可以在等待 I/O 时执行其他任务，大幅提升效率。

## asyncio 基础

### 核心概念

1. **协程 (Coroutine)**: 使用 `async def` 定义的函数
2. **事件循环 (Event Loop)**: 管理和调度异步任务的核心
3. **任务 (Task)**: 对协程的封装，允许并发执行
4. **Future**: 代表异步操作的最终结果

### 第一个 asyncio 程序

```python
import asyncio

async def say_hello():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

# Python 3.7+ 推荐方式
asyncio.run(say_hello())
```

## async/await 语法

### 定义协程函数

```python
import asyncio

async def fetch_data(delay, data_id):
    """异步获取数据"""
    print(f"开始获取数据 {data_id}")
    await asyncio.sleep(delay)  # 模拟异步 I/O 操作
    print(f"完成获取数据 {data_id}")
    return f"数据 {data_id}"

async def main():
    # 顺序执行（总耗时 3 秒）
    result1 = await fetch_data(1, "A")
    result2 = await fetch_data(2, "B")
    print(result1, result2)

asyncio.run(main())
```

### await 的使用规则

```python
async def demo():
    # ✓ 正确：await 可等待对象
    await asyncio.sleep(1)
    await some_async_function()
    await asyncio.create_task(another_async_function())

    # ✗ 错误：不能 await 同步函数
    # await time.sleep(1)  # 这会报错

    # ✓ 正确：在协程中调用同步函数
    time.sleep(1)  # 但这会阻塞事件循环，不推荐
```

## 事件循环 (Event Loop)

事件循环是 asyncio 的核心，负责执行异步任务和回调。

### 获取和使用事件循环

```python
import asyncio

async def task1():
    print("任务 1 开始")
    await asyncio.sleep(2)
    print("任务 1 完成")

async def task2():
    print("任务 2 开始")
    await asyncio.sleep(1)
    print("任务 2 完成")

# 方式 1: 推荐使用 asyncio.run() (Python 3.7+)
async def main():
    await asyncio.gather(task1(), task2())

asyncio.run(main())

# 方式 2: 手动管理事件循环（旧版本或特殊需求）
loop = asyncio.get_event_loop()
try:
    loop.run_until_complete(main())
finally:
    loop.close()
```

### 在运行的循环中获取事件循环

```python
import asyncio

async def get_current_loop():
    loop = asyncio.get_running_loop()
    print(f"当前事件循环: {loop}")

    # 在事件循环中调度回调
    loop.call_later(2, lambda: print("2 秒后执行"))
    await asyncio.sleep(3)

asyncio.run(get_current_loop())
```

## 协程与任务

### 创建和管理任务

```python
import asyncio
import time

async def worker(name, delay):
    print(f"工作者 {name} 开始")
    await asyncio.sleep(delay)
    print(f"工作者 {name} 完成")
    return f"结果_{name}"

async def main():
    # 创建任务（立即开始执行）
    task1 = asyncio.create_task(worker("A", 2))
    task2 = asyncio.create_task(worker("B", 1))
    task3 = asyncio.create_task(worker("C", 3))

    # 等待任务完成
    result1 = await task1
    result2 = await task2
    result3 = await task3

    print(f"结果: {result1}, {result2}, {result3}")

start = time.time()
asyncio.run(main())
print(f"总耗时: {time.time() - start:.2f} 秒")  # 约 3 秒（并发执行）
```

### 任务取消

```python
import asyncio

async def long_running_task():
    try:
        print("开始长时间任务")
        await asyncio.sleep(10)
        print("任务完成")
    except asyncio.CancelledError:
        print("任务被取消")
        raise  # 重要：重新抛出异常

async def main():
    task = asyncio.create_task(long_running_task())

    await asyncio.sleep(2)
    task.cancel()  # 取消任务

    try:
        await task
    except asyncio.CancelledError:
        print("捕获到取消异常")

asyncio.run(main())
```

### 任务超时控制

```python
import asyncio

async def slow_operation():
    await asyncio.sleep(5)
    return "完成"

async def main():
    try:
        # 方式 1: 使用 wait_for 设置超时
        result = await asyncio.wait_for(slow_operation(), timeout=2.0)
        print(result)
    except asyncio.TimeoutError:
        print("操作超时")

    # 方式 2: 使用 timeout (Python 3.11+)
    try:
        async with asyncio.timeout(2.0):
            result = await slow_operation()
            print(result)
    except TimeoutError:
        print("操作超时")

asyncio.run(main())
```

## 并发执行模式

### asyncio.gather() - 并发执行多个协程

```python
import asyncio
import random

async def fetch_user(user_id):
    delay = random.uniform(0.5, 2.0)
    await asyncio.sleep(delay)
    return {"id": user_id, "name": f"用户{user_id}"}

async def main():
    # 并发执行多个协程，等待所有完成
    users = await asyncio.gather(
        fetch_user(1),
        fetch_user(2),
        fetch_user(3),
        fetch_user(4),
        fetch_user(5)
    )

    print("所有用户数据:")
    for user in users:
        print(user)

    # 使用 return_exceptions=True 处理异常
    results = await asyncio.gather(
        fetch_user(10),
        async_error_function(),
        fetch_user(20),
        return_exceptions=True
    )

    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"任务 {i} 失败: {result}")
        else:
            print(f"任务 {i} 成功: {result}")

async def async_error_function():
    await asyncio.sleep(0.1)
    raise ValueError("故意抛出的错误")

asyncio.run(main())
```

### asyncio.wait() - 更细粒度的控制

```python
import asyncio

async def task(name, duration):
    print(f"{name} 开始")
    await asyncio.sleep(duration)
    print(f"{name} 完成")
    return f"{name} 的结果"

async def main():
    tasks = [
        asyncio.create_task(task("任务A", 2)),
        asyncio.create_task(task("任务B", 1)),
        asyncio.create_task(task("任务C", 3))
    ]

    # 等待所有任务完成
    done, pending = await asyncio.wait(tasks)

    print("\n已完成的任务:")
    for t in done:
        print(f"  {t.result()}")

    # 等待第一个完成
    tasks2 = [
        asyncio.create_task(task("快速任务", 1)),
        asyncio.create_task(task("慢速任务", 5))
    ]

    done, pending = await asyncio.wait(
        tasks2,
        return_when=asyncio.FIRST_COMPLETED
    )

    print("\n第一个完成的任务:")
    for t in done:
        print(f"  {t.result()}")

    # 取消未完成的任务
    for t in pending:
        t.cancel()

asyncio.run(main())
```

### asyncio.as_completed() - 按完成顺序处理

```python
import asyncio
import random

async def download(file_id):
    delay = random.uniform(1, 4)
    print(f"开始下载文件 {file_id}")
    await asyncio.sleep(delay)
    print(f"完成下载文件 {file_id} (耗时 {delay:.2f}s)")
    return f"文件{file_id}"

async def main():
    tasks = [download(i) for i in range(1, 6)]

    # 按完成顺序处理结果
    print("按完成顺序处理文件:\n")
    for coro in asyncio.as_completed(tasks):
        result = await coro
        print(f"处理 {result}")

asyncio.run(main())
```

## 异步上下文管理器

### 使用 async with

```python
import asyncio

class AsyncDatabaseConnection:
    """异步数据库连接示例"""

    async def __aenter__(self):
        print("建立数据库连接...")
        await asyncio.sleep(1)  # 模拟连接建立
        print("连接已建立")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("关闭数据库连接...")
        await asyncio.sleep(0.5)  # 模拟连接关闭
        print("连接已关闭")
        return False

    async def query(self, sql):
        print(f"执行查询: {sql}")
        await asyncio.sleep(0.5)
        return [{"id": 1, "name": "数据"}]

async def main():
    async with AsyncDatabaseConnection() as db:
        results = await db.query("SELECT * FROM users")
        print(f"查询结果: {results}")

asyncio.run(main())
```

### 使用 asyncio.Lock 实现同步

```python
import asyncio

class Counter:
    def __init__(self):
        self.value = 0
        self.lock = asyncio.Lock()

    async def increment(self, worker_id):
        async with self.lock:
            current = self.value
            print(f"工作者 {worker_id}: 读取值 {current}")
            await asyncio.sleep(0.1)  # 模拟处理
            self.value = current + 1
            print(f"工作者 {worker_id}: 写入值 {self.value}")

async def main():
    counter = Counter()

    # 并发执行多个增量操作
    await asyncio.gather(
        counter.increment("A"),
        counter.increment("B"),
        counter.increment("C")
    )

    print(f"\n最终计数: {counter.value}")

asyncio.run(main())
```

## 异步迭代器和生成器

### 异步迭代器

```python
import asyncio

class AsyncRange:
    """异步范围迭代器"""

    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.current >= self.end:
            raise StopAsyncIteration

        await asyncio.sleep(0.5)  # 模拟异步操作
        value = self.current
        self.current += 1
        return value

async def main():
    async for num in AsyncRange(1, 6):
        print(f"数字: {num}")

asyncio.run(main())
```

### 异步生成器

```python
import asyncio

async def async_generator(n):
    """异步生成器函数"""
    for i in range(n):
        await asyncio.sleep(0.5)
        yield i ** 2

async def fetch_data_stream():
    """模拟数据流"""
    data_sources = ["数据A", "数据B", "数据C", "数据D"]
    for data in data_sources:
        await asyncio.sleep(1)
        yield data

async def main():
    # 使用异步生成器
    print("平方数序列:")
    async for value in async_generator(5):
        print(value)

    print("\n数据流:")
    async for data in fetch_data_stream():
        print(f"接收到: {data}")

asyncio.run(main())
```

## 实战示例

### 异步 HTTP 请求（使用 aiohttp）

```python
import asyncio
import aiohttp

async def fetch_url(session, url):
    """异步获取 URL 内容"""
    try:
        async with session.get(url) as response:
            data = await response.text()
            return {
                "url": url,
                "status": response.status,
                "length": len(data)
            }
    except Exception as e:
        return {"url": url, "error": str(e)}

async def main():
    urls = [
        "https://api.github.com/users/python",
        "https://api.github.com/users/django",
        "https://api.github.com/users/flask",
        "https://api.github.com/users/fastapi"
    ]

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)

        for result in results:
            if "error" in result:
                print(f"❌ {result['url']}: {result['error']}")
            else:
                print(f"✓ {result['url']}: {result['status']} ({result['length']} bytes)")

# asyncio.run(main())  # 需要安装 aiohttp: pip install aiohttp
```

### 异步文件读写（使用 aiofiles）

```python
import asyncio
import aiofiles

async def write_file(filename, content):
    """异步写入文件"""
    async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
        await f.write(content)
    print(f"已写入 {filename}")

async def read_file(filename):
    """异步读取文件"""
    async with aiofiles.open(filename, 'r', encoding='utf-8') as f:
        content = await f.read()
    print(f"已读取 {filename}: {len(content)} 字符")
    return content

async def main():
    # 并发写入多个文件
    await asyncio.gather(
        write_file("file1.txt", "内容 1" * 100),
        write_file("file2.txt", "内容 2" * 100),
        write_file("file3.txt", "内容 3" * 100)
    )

    # 并发读取
    contents = await asyncio.gather(
        read_file("file1.txt"),
        read_file("file2.txt"),
        read_file("file3.txt")
    )

# asyncio.run(main())  # 需要安装 aiofiles: pip install aiofiles
```

### 生产者-消费者模式

```python
import asyncio
import random

async def producer(queue, producer_id, items):
    """生产者：生成数据并放入队列"""
    for i in range(items):
        await asyncio.sleep(random.uniform(0.1, 0.5))
        item = f"生产者{producer_id}-项目{i}"
        await queue.put(item)
        print(f"✓ 生产: {item}")
    print(f"生产者 {producer_id} 完成")

async def consumer(queue, consumer_id):
    """消费者：从队列获取并处理数据"""
    while True:
        item = await queue.get()

        if item is None:  # 退出信号
            queue.task_done()
            break

        print(f"  ← 消费者 {consumer_id} 处理: {item}")
        await asyncio.sleep(random.uniform(0.2, 0.8))  # 模拟处理
        queue.task_done()

    print(f"消费者 {consumer_id} 完成")

async def main():
    queue = asyncio.Queue(maxsize=10)

    # 创建 3 个生产者和 2 个消费者
    producers = [
        asyncio.create_task(producer(queue, i, 5))
        for i in range(3)
    ]

    consumers = [
        asyncio.create_task(consumer(queue, i))
        for i in range(2)
    ]

    # 等待所有生产者完成
    await asyncio.gather(*producers)

    # 等待队列处理完成
    await queue.join()

    # 发送退出信号给消费者
    for _ in consumers:
        await queue.put(None)

    # 等待消费者完成
    await asyncio.gather(*consumers)

asyncio.run(main())
```

### 异步重试机制

```python
import asyncio
import random

async def unreliable_operation():
    """模拟不稳定的操作"""
    if random.random() < 0.7:  # 70% 失败率
        raise Exception("操作失败")
    return "成功"

async def retry_async(coro_func, max_retries=3, delay=1.0):
    """异步重试装饰器"""
    for attempt in range(max_retries):
        try:
            result = await coro_func()
            print(f"✓ 第 {attempt + 1} 次尝试成功")
            return result
        except Exception as e:
            print(f"✗ 第 {attempt + 1} 次尝试失败: {e}")
            if attempt < max_retries - 1:
                print(f"  等待 {delay} 秒后重试...")
                await asyncio.sleep(delay)
            else:
                print(f"  达到最大重试次数")
                raise

async def main():
    try:
        result = await retry_async(unreliable_operation, max_retries=5, delay=0.5)
        print(f"最终结果: {result}")
    except Exception as e:
        print(f"所有尝试都失败了: {e}")

asyncio.run(main())
```

## 性能优化和最佳实践

### 避免阻塞事件循环

```python
import asyncio
import time

# ❌ 错误：在协程中使用阻塞操作
async def bad_example():
    time.sleep(2)  # 这会阻塞整个事件循环！

# ✓ 正确：使用异步操作
async def good_example():
    await asyncio.sleep(2)  # 不阻塞事件循环

# ✓ 如果必须使用阻塞操作，使用 run_in_executor
async def handle_blocking_operation():
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,  # 使用默认执行器
        time.sleep,  # 阻塞函数
        2  # 参数
    )
```

### 合理使用并发数量

```python
import asyncio

async def limited_concurrency():
    """限制并发数量"""
    semaphore = asyncio.Semaphore(5)  # 最多同时执行 5 个任务

    async def worker(item):
        async with semaphore:
            print(f"处理 {item}")
            await asyncio.sleep(1)
            return f"完成 {item}"

    tasks = [worker(i) for i in range(20)]
    results = await asyncio.gather(*tasks)
    return results

asyncio.run(limited_concurrency())
```

### 正确处理异常

```python
import asyncio

async def task_with_error_handling():
    tasks = []

    async def safe_task(task_id):
        try:
            if task_id == 3:
                raise ValueError(f"任务 {task_id} 出错")
            await asyncio.sleep(1)
            return f"任务 {task_id} 完成"
        except Exception as e:
            print(f"捕获异常: {e}")
            return None

    for i in range(5):
        tasks.append(asyncio.create_task(safe_task(i)))

    results = await asyncio.gather(*tasks)
    print(f"结果: {results}")

asyncio.run(task_with_error_handling())
```

### 优雅关闭

```python
import asyncio
import signal

async def graceful_shutdown_example():
    """优雅关闭示例"""

    async def worker(name):
        try:
            while True:
                print(f"{name} 工作中...")
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            print(f"{name} 正在清理...")
            await asyncio.sleep(0.5)  # 清理工作
            print(f"{name} 已关闭")
            raise

    # 创建工作任务
    tasks = [
        asyncio.create_task(worker("工作者A")),
        asyncio.create_task(worker("工作者B"))
    ]

    # 模拟运行 3 秒后关闭
    await asyncio.sleep(3)

    # 取消所有任务
    for task in tasks:
        task.cancel()

    # 等待所有任务完成清理
    await asyncio.gather(*tasks, return_exceptions=True)
    print("所有任务已优雅关闭")

asyncio.run(graceful_shutdown_example())
```

## 调试技巧

### 启用调试模式

```python
import asyncio
import warnings

async def main():
    print("运行在调试模式")
    await asyncio.sleep(1)

# 启用调试模式
asyncio.run(main(), debug=True)

# 或者
import os
os.environ['PYTHONASYNCIODEBUG'] = '1'
```

### 检测未等待的协程

```python
import asyncio
import warnings

# 启用警告
warnings.simplefilter('always', ResourceWarning)

async def forgotten_await():
    await asyncio.sleep(1)
    return "结果"

async def main():
    # ❌ 忘记 await - 会产生警告
    forgotten_await()  # 协程未被等待

    # ✓ 正确
    result = await forgotten_await()

asyncio.run(main())
```

## 总结

### asyncio 的优势

- **高效的 I/O 处理**: 非阻塞 I/O 操作
- **资源占用少**: 比多线程更轻量
- **代码清晰**: async/await 语法直观
- **生态丰富**: 大量异步库支持

### 适用场景

- **网络应用**: Web 服务、API 客户端
- **I/O 密集型**: 文件操作、数据库查询
- **实时应用**: WebSocket、聊天系统
- **爬虫**: 并发网页抓取

### 不适用场景

- **CPU 密集型**: 计算密集任务应使用多进程
- **简单脚本**: 过度使用增加复杂性
- **同步库**: 无法与纯同步代码高效协作

### 学习路径建议

1. 掌握 async/await 基础语法
2. 理解事件循环工作原理
3. 学习常用并发模式（gather、wait、as_completed）
4. 实践异步 I/O 操作
5. 深入异步上下文管理和迭代器
6. 学习性能优化和调试技巧

asyncio 是现代 Python 异步编程的基石，掌握它将大幅提升处理并发任务的能力。
