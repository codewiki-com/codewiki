---
title: Python 多线程与多进程
description: 掌握 Python 并发编程：threading、multiprocessing、GIL 与进程间通信
track: python
section: concurrency
difficulty: advanced
tags:
  - Python
  - 多线程
  - 多进程
  - GIL
status: imported
origin: old/src/content/docs/python/threading-multiprocessing.zh.md
divergence: 0.33
issues: []
legacy:
  category: Python
  subcategory: 并发编程
  order: 11
  lastUpdated: 2026-01-07
---

Python 提供了多种并发编程方式，其中 `threading` 和 `multiprocessing` 是最常用的两个模块。本文将深入探讨它们的使用方法、区别以及最佳实践。

## 并发编程基础

### 并发 vs 并行

- **并发（Concurrency）**：多个任务交替执行，看起来像同时进行
- **并行（Parallelism）**：多个任务真正同时执行，需要多核 CPU

### 线程 vs 进程

| 特性 | 线程 | 进程 |
|------|------|------|
| 资源开销 | 小 | 大 |
| 内存共享 | 共享 | 独立 |
| 创建速度 | 快 | 慢 |
| 受 GIL 限制 | 是 | 否 |
| 适用场景 | I/O 密集型 | CPU 密集型 |

## threading 模块

### 基本使用

```python
import threading
import time

def worker(name, delay):
    """工作线程函数"""
    print(f"线程 {name} 开始执行")
    time.sleep(delay)
    print(f"线程 {name} 执行完毕")

# 创建线程
thread1 = threading.Thread(target=worker, args=("A", 2))
thread2 = threading.Thread(target=worker, args=("B", 1))

# 启动线程
thread1.start()
thread2.start()

# 等待线程完成
thread1.join()
thread2.join()

print("所有线程执行完毕")
```

### 使用类创建线程

```python
import threading
import time

class WorkerThread(threading.Thread):
    def __init__(self, name, delay):
        super().__init__()
        self.name = name
        self.delay = delay

    def run(self):
        """线程执行的主体方法"""
        print(f"线程 {self.name} 开始执行")
        time.sleep(self.delay)
        print(f"线程 {self.name} 执行完毕")

# 创建并启动线程
threads = []
for i in range(3):
    thread = WorkerThread(f"Worker-{i}", i + 1)
    thread.start()
    threads.append(thread)

# 等待所有线程完成
for thread in threads:
    thread.join()
```

### 守护线程（Daemon Thread）

```python
import threading
import time

def daemon_task():
    """守护线程任务"""
    while True:
        print("守护线程运行中...")
        time.sleep(1)

def normal_task():
    """普通线程任务"""
    for i in range(3):
        print(f"普通线程运行 {i+1}/3")
        time.sleep(1)

# 创建守护线程
daemon_thread = threading.Thread(target=daemon_task, daemon=True)
daemon_thread.start()

# 创建普通线程
normal_thread = threading.Thread(target=normal_task)
normal_thread.start()

normal_thread.join()
print("主程序结束（守护线程会自动终止）")
```

### 线程本地数据

```python
import threading

# 创建线程本地数据
local_data = threading.local()

def process_data(value):
    """每个线程有自己的本地变量"""
    local_data.value = value
    print(f"线程 {threading.current_thread().name}: value = {local_data.value}")

threads = []
for i in range(5):
    thread = threading.Thread(target=process_data, args=(i,))
    thread.start()
    threads.append(thread)

for thread in threads:
    thread.join()
```

## GIL（全局解释器锁）

### 什么是 GIL？

GIL 是 CPython 解释器的一个互斥锁，确保同一时刻只有一个线程在执行 Python 字节码。

### GIL 的影响

```python
import threading
import time

# CPU 密集型任务（受 GIL 影响）
def cpu_bound_task(n):
    count = 0
    for i in range(n):
        count += i * i
    return count

# I/O 密集型任务（不受 GIL 影响）
def io_bound_task(delay):
    time.sleep(delay)
    return "完成"

# 测试多线程 CPU 密集型任务
def test_cpu_threading():
    start = time.time()
    threads = []

    for _ in range(4):
        thread = threading.Thread(target=cpu_bound_task, args=(10000000,))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()

    print(f"多线程 CPU 密集型耗时: {time.time() - start:.2f}秒")

# 测试多线程 I/O 密集型任务
def test_io_threading():
    start = time.time()
    threads = []

    for _ in range(4):
        thread = threading.Thread(target=io_bound_task, args=(1,))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()

    print(f"多线程 I/O 密集型耗时: {time.time() - start:.2f}秒")

if __name__ == "__main__":
    test_cpu_threading()  # 可能不会有明显加速
    test_io_threading()   # 会有明显加速
```

### 绕过 GIL 的方法

1. **使用 multiprocessing 模块**（推荐用于 CPU 密集型任务）
2. **使用 C 扩展**（如 NumPy、Cython）
3. **使用其他 Python 实现**（如 Jython、IronPython）

## multiprocessing 模块

### 基本使用

```python
import multiprocessing
import time
import os

def worker(name, delay):
    """工作进程函数"""
    print(f"进程 {name} (PID: {os.getpid()}) 开始执行")
    time.sleep(delay)
    print(f"进程 {name} (PID: {os.getpid()}) 执行完毕")

if __name__ == "__main__":
    # 创建进程
    process1 = multiprocessing.Process(target=worker, args=("A", 2))
    process2 = multiprocessing.Process(target=worker, args=("B", 1))

    # 启动进程
    process1.start()
    process2.start()

    # 等待进程完成
    process1.join()
    process2.join()

    print(f"主进程 (PID: {os.getpid()}) 结束")
```

### 使用类创建进程

```python
import multiprocessing
import os

class WorkerProcess(multiprocessing.Process):
    def __init__(self, name, task_data):
        super().__init__()
        self.name = name
        self.task_data = task_data

    def run(self):
        """进程执行的主体方法"""
        print(f"进程 {self.name} (PID: {os.getpid()}) 处理数据: {self.task_data}")
        result = sum(self.task_data)
        print(f"进程 {self.name} 结果: {result}")

if __name__ == "__main__":
    processes = []

    for i in range(3):
        data = list(range(i * 10, (i + 1) * 10))
        process = WorkerProcess(f"Worker-{i}", data)
        process.start()
        processes.append(process)

    for process in processes:
        process.join()
```

### 进程间共享数据

```python
import multiprocessing

def increment_value(shared_value, lock):
    """增加共享值"""
    for _ in range(1000):
        with lock:
            shared_value.value += 1

if __name__ == "__main__":
    # 创建共享值和锁
    shared_value = multiprocessing.Value('i', 0)
    lock = multiprocessing.Lock()

    # 创建多个进程
    processes = []
    for _ in range(5):
        process = multiprocessing.Process(
            target=increment_value,
            args=(shared_value, lock)
        )
        process.start()
        processes.append(process)

    # 等待所有进程完成
    for process in processes:
        process.join()

    print(f"最终值: {shared_value.value}")  # 应该是 5000
```

### 进程间共享数组

```python
import multiprocessing
import numpy as np

def modify_array(shared_array, index, value):
    """修改共享数组"""
    shared_array[index] = value
    print(f"进程修改索引 {index} 为 {value}")

if __name__ == "__main__":
    # 创建共享数组
    shared_array = multiprocessing.Array('d', 10)  # 'd' 表示 double

    processes = []
    for i in range(10):
        process = multiprocessing.Process(
            target=modify_array,
            args=(shared_array, i, i * 10)
        )
        process.start()
        processes.append(process)

    for process in processes:
        process.join()

    print(f"最终数组: {list(shared_array)}")
```

## 锁与同步原语

### Lock（互斥锁）

```python
import threading
import time

# 不使用锁的情况
counter = 0

def increment_without_lock():
    global counter
    for _ in range(100000):
        counter += 1

# 使用锁的情况
counter_with_lock = 0
lock = threading.Lock()

def increment_with_lock():
    global counter_with_lock
    for _ in range(100000):
        with lock:  # 使用 with 语句自动获取和释放锁
            counter_with_lock += 1

# 测试不使用锁
threads = []
counter = 0
for _ in range(5):
    thread = threading.Thread(target=increment_without_lock)
    thread.start()
    threads.append(thread)

for thread in threads:
    thread.join()

print(f"不使用锁的结果: {counter} (预期: 500000)")

# 测试使用锁
threads = []
counter_with_lock = 0
for _ in range(5):
    thread = threading.Thread(target=increment_with_lock)
    thread.start()
    threads.append(thread)

for thread in threads:
    thread.join()

print(f"使用锁的结果: {counter_with_lock} (预期: 500000)")
```

### RLock（可重入锁）

```python
import threading

class BankAccount:
    def __init__(self, balance):
        self.balance = balance
        self.lock = threading.RLock()  # 可重入锁

    def deposit(self, amount):
        with self.lock:
            self.balance += amount
            print(f"存入 {amount}，余额: {self.balance}")

    def withdraw(self, amount):
        with self.lock:
            if self.balance >= amount:
                self.balance -= amount
                print(f"取出 {amount}，余额: {self.balance}")
                return True
            return False

    def transfer(self, target_account, amount):
        """转账操作需要获取两次锁"""
        with self.lock:  # 第一次获取锁
            if self.withdraw(amount):  # 第二次获取锁（可重入）
                target_account.deposit(amount)
                return True
            return False

# 测试
account1 = BankAccount(1000)
account2 = BankAccount(500)

account1.transfer(account2, 200)
```

### Semaphore（信号量）

```python
import threading
import time
import random

# 限制同时访问资源的线程数量
semaphore = threading.Semaphore(3)  # 最多 3 个线程同时访问

def access_resource(thread_id):
    print(f"线程 {thread_id} 正在等待...")
    with semaphore:
        print(f"线程 {thread_id} 获得访问权限")
        time.sleep(random.uniform(1, 3))
        print(f"线程 {thread_id} 释放资源")

threads = []
for i in range(10):
    thread = threading.Thread(target=access_resource, args=(i,))
    thread.start()
    threads.append(thread)

for thread in threads:
    thread.join()
```

### Event（事件）

```python
import threading
import time

# 创建事件对象
event = threading.Event()

def waiter(name):
    """等待事件的线程"""
    print(f"{name} 正在等待事件...")
    event.wait()  # 阻塞直到事件被设置
    print(f"{name} 收到事件，开始执行")

def setter():
    """设置事件的线程"""
    print("准备设置事件...")
    time.sleep(3)
    print("设置事件！")
    event.set()  # 设置事件，唤醒所有等待的线程

# 创建等待线程
waiters = []
for i in range(5):
    thread = threading.Thread(target=waiter, args=(f"线程-{i}",))
    thread.start()
    waiters.append(thread)

# 创建设置事件的线程
setter_thread = threading.Thread(target=setter)
setter_thread.start()

# 等待所有线程完成
for thread in waiters:
    thread.join()
setter_thread.join()
```

### Condition（条件变量）

```python
import threading
import time
import random

class ProducerConsumer:
    def __init__(self):
        self.items = []
        self.condition = threading.Condition()

    def produce(self, item):
        """生产者"""
        with self.condition:
            self.items.append(item)
            print(f"生产: {item}，当前库存: {len(self.items)}")
            self.condition.notify()  # 通知消费者

    def consume(self):
        """消费者"""
        with self.condition:
            while not self.items:
                print("消费者等待...")
                self.condition.wait()  # 等待生产者通知

            item = self.items.pop(0)
            print(f"消费: {item}，剩余库存: {len(self.items)}")
            return item

def producer(pc, name):
    for i in range(5):
        time.sleep(random.uniform(0.5, 1.5))
        pc.produce(f"{name}-产品{i}")

def consumer(pc, name):
    for _ in range(5):
        time.sleep(random.uniform(1, 2))
        item = pc.consume()

if __name__ == "__main__":
    pc = ProducerConsumer()

    # 创建生产者和消费者线程
    p1 = threading.Thread(target=producer, args=(pc, "生产者1"))
    p2 = threading.Thread(target=producer, args=(pc, "生产者2"))
    c1 = threading.Thread(target=consumer, args=(pc, "消费者1"))
    c2 = threading.Thread(target=consumer, args=(pc, "消费者2"))

    p1.start()
    p2.start()
    c1.start()
    c2.start()

    p1.join()
    p2.join()
    c1.join()
    c2.join()
```

### Barrier（屏障）

```python
import threading
import time
import random

# 创建屏障，等待 4 个线程
barrier = threading.Barrier(4)

def worker(name):
    print(f"{name} 开始工作...")
    time.sleep(random.uniform(1, 3))
    print(f"{name} 完成第一阶段，等待其他线程...")

    barrier.wait()  # 等待所有线程到达

    print(f"{name} 开始第二阶段")
    time.sleep(random.uniform(1, 2))
    print(f"{name} 完成所有工作")

threads = []
for i in range(4):
    thread = threading.Thread(target=worker, args=(f"线程-{i}",))
    thread.start()
    threads.append(thread)

for thread in threads:
    thread.join()
```

## 进程间通信

### Queue（队列）

```python
import multiprocessing
import time
import random

def producer(queue, name):
    """生产者进程"""
    for i in range(5):
        item = f"{name}-产品{i}"
        queue.put(item)
        print(f"{name} 生产: {item}")
        time.sleep(random.uniform(0.1, 0.5))

    queue.put(None)  # 发送结束信号

def consumer(queue, name):
    """消费者进程"""
    while True:
        item = queue.get()
        if item is None:
            print(f"{name} 收到结束信号")
            break
        print(f"{name} 消费: {item}")
        time.sleep(random.uniform(0.2, 0.8))

if __name__ == "__main__":
    # 创建队列
    queue = multiprocessing.Queue()

    # 创建生产者进程
    p1 = multiprocessing.Process(target=producer, args=(queue, "生产者1"))
    p2 = multiprocessing.Process(target=producer, args=(queue, "生产者2"))

    # 创建消费者进程
    c1 = multiprocessing.Process(target=consumer, args=(queue, "消费者1"))

    p1.start()
    p2.start()
    c1.start()

    p1.join()
    p2.join()

    # 等待一段时间后发送结束信号
    time.sleep(1)
    queue.put(None)

    c1.join()
```

### Pipe（管道）

```python
import multiprocessing
import time

def sender(conn):
    """发送数据的进程"""
    messages = ["消息1", "消息2", "消息3"]
    for msg in messages:
        conn.send(msg)
        print(f"发送: {msg}")
        time.sleep(1)

    conn.send("END")  # 发送结束信号
    conn.close()

def receiver(conn):
    """接收数据的进程"""
    while True:
        msg = conn.recv()
        if msg == "END":
            print("接收到结束信号")
            break
        print(f"接收: {msg}")

    conn.close()

if __name__ == "__main__":
    # 创建管道
    parent_conn, child_conn = multiprocessing.Pipe()

    # 创建进程
    p1 = multiprocessing.Process(target=sender, args=(parent_conn,))
    p2 = multiprocessing.Process(target=receiver, args=(child_conn,))

    p1.start()
    p2.start()

    p1.join()
    p2.join()
```

### Manager（共享管理器）

```python
import multiprocessing
import time

def modify_dict(shared_dict, key, value):
    """修改共享字典"""
    shared_dict[key] = value
    print(f"进程设置 {key} = {value}")

def modify_list(shared_list, value):
    """修改共享列表"""
    shared_list.append(value)
    print(f"进程添加 {value}")

if __name__ == "__main__":
    # 创建管理器
    manager = multiprocessing.Manager()

    # 创建共享数据结构
    shared_dict = manager.dict()
    shared_list = manager.list()

    # 创建进程
    processes = []

    for i in range(5):
        p1 = multiprocessing.Process(
            target=modify_dict,
            args=(shared_dict, f"key{i}", f"value{i}")
        )
        p2 = multiprocessing.Process(
            target=modify_list,
            args=(shared_list, i)
        )
        p1.start()
        p2.start()
        processes.extend([p1, p2])

    # 等待所有进程完成
    for process in processes:
        process.join()

    print(f"\n最终字典: {dict(shared_dict)}")
    print(f"最终列表: {list(shared_list)}")
```

### 共享内存（SharedMemory）

```python
from multiprocessing import shared_memory
import multiprocessing
import numpy as np

def worker(shm_name, shape, dtype):
    """工作进程访问共享内存"""
    # 连接到已存在的共享内存
    existing_shm = shared_memory.SharedMemory(name=shm_name)

    # 创建 NumPy 数组视图
    arr = np.ndarray(shape, dtype=dtype, buffer=existing_shm.buf)

    # 修改数组
    arr += 10
    print(f"进程修改后: {arr}")

    # 清理
    existing_shm.close()

if __name__ == "__main__":
    # 创建共享内存
    data = np.array([1, 2, 3, 4, 5], dtype=np.int64)
    shm = shared_memory.SharedMemory(create=True, size=data.nbytes)

    # 创建 NumPy 数组视图
    shared_arr = np.ndarray(data.shape, dtype=data.dtype, buffer=shm.buf)
    shared_arr[:] = data[:]

    print(f"初始数组: {shared_arr}")

    # 创建进程
    process = multiprocessing.Process(
        target=worker,
        args=(shm.name, data.shape, data.dtype)
    )
    process.start()
    process.join()

    print(f"主进程看到的数组: {shared_arr}")

    # 清理共享内存
    shm.close()
    shm.unlink()
```

## 线程池与进程池

### ThreadPoolExecutor（线程池）

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests

def fetch_url(url):
    """获取 URL 内容"""
    try:
        response = requests.get(url, timeout=5)
        return f"{url}: {len(response.content)} 字节"
    except Exception as e:
        return f"{url}: 错误 - {str(e)}"

def io_task(task_id):
    """I/O 密集型任务"""
    time.sleep(1)
    return f"任务 {task_id} 完成"

# 示例 1: 基本使用
def basic_thread_pool():
    with ThreadPoolExecutor(max_workers=5) as executor:
        # 提交任务
        futures = [executor.submit(io_task, i) for i in range(10)]

        # 获取结果
        for future in as_completed(futures):
            result = future.result()
            print(result)

# 示例 2: 使用 map
def thread_pool_map():
    with ThreadPoolExecutor(max_workers=5) as executor:
        task_ids = range(10)
        results = executor.map(io_task, task_ids)

        for result in results:
            print(result)

# 示例 3: 批量下载
def batch_download():
    urls = [
        "https://www.python.org",
        "https://docs.python.org",
        "https://pypi.org",
        "https://github.com",
        "https://stackoverflow.com"
    ]

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_url, url): url for url in urls}

        for future in as_completed(futures):
            url = futures[future]
            try:
                result = future.result()
                print(result)
            except Exception as e:
                print(f"{url} 生成异常: {e}")

if __name__ == "__main__":
    print("=== 基本线程池使用 ===")
    basic_thread_pool()

    print("\n=== 使用 map ===")
    thread_pool_map()
```

### ProcessPoolExecutor（进程池）

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
import time
import math

def cpu_bound_task(n):
    """CPU 密集型任务"""
    result = 0
    for i in range(n):
        result += math.sqrt(i)
    return result

def factorial(n):
    """计算阶乘"""
    if n <= 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# 示例 1: 基本使用
def basic_process_pool():
    numbers = [1000000, 2000000, 3000000, 4000000, 5000000]

    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(cpu_bound_task, n) for n in numbers]

        for future in as_completed(futures):
            result = future.result()
            print(f"结果: {result:.2f}")

    print(f"总耗时: {time.time() - start:.2f}秒")

# 示例 2: 使用 map
def process_pool_map():
    numbers = list(range(10, 20))

    with ProcessPoolExecutor(max_workers=4) as executor:
        results = executor.map(factorial, numbers)

        for n, result in zip(numbers, results):
            print(f"{n}! = {result}")

# 示例 3: 对比串行和并行
def compare_performance():
    numbers = [5000000] * 8

    # 串行执行
    start = time.time()
    serial_results = [cpu_bound_task(n) for n in numbers]
    serial_time = time.time() - start
    print(f"串行执行耗时: {serial_time:.2f}秒")

    # 并行执行
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as executor:
        parallel_results = list(executor.map(cpu_bound_task, numbers))
    parallel_time = time.time() - start
    print(f"并行执行耗时: {parallel_time:.2f}秒")
    print(f"加速比: {serial_time / parallel_time:.2f}x")

if __name__ == "__main__":
    print("=== 基本进程池使用 ===")
    basic_process_pool()

    print("\n=== 使用 map 计算阶乘 ===")
    process_pool_map()

    print("\n=== 性能对比 ===")
    compare_performance()
```

### 混合使用线程池和进程池

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time
import requests

def download_and_process(url):
    """下载并处理数据"""
    # I/O 操作：下载
    response = requests.get(url, timeout=5)
    data = response.content

    # CPU 操作：处理
    processed = len(data) * 2  # 简化的处理

    return f"{url}: 原始 {len(data)} 字节，处理后 {processed}"

def hybrid_approach():
    """混合方法：外层用进程池，内层用线程池"""
    urls_groups = [
        ["https://www.python.org", "https://docs.python.org"],
        ["https://pypi.org", "https://github.com"],
        ["https://stackoverflow.com", "https://www.reddit.com"]
    ]

    def process_url_group(urls):
        """在进程中使用线程池处理一组 URL"""
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(download_and_process, urls))
        return results

    # 使用进程池处理每组 URL
    with ProcessPoolExecutor(max_workers=3) as executor:
        all_results = executor.map(process_url_group, urls_groups)

        for group_results in all_results:
            for result in group_results:
                print(result)

if __name__ == "__main__":
    hybrid_approach()
```

## 性能对比与最佳实践

### 性能对比示例

```python
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time
import math

def cpu_intensive(n):
    """CPU 密集型任务"""
    return sum(math.sqrt(i) for i in range(n))

def io_intensive(duration):
    """I/O 密集型任务（模拟）"""
    time.sleep(duration)
    return duration

def benchmark_cpu():
    """CPU 密集型任务基准测试"""
    task_size = 10000000
    num_tasks = 4

    print("=== CPU 密集型任务 ===")

    # 1. 串行执行
    start = time.time()
    results = [cpu_intensive(task_size) for _ in range(num_tasks)]
    serial_time = time.time() - start
    print(f"串行执行: {serial_time:.2f}秒")

    # 2. 多线程
    start = time.time()
    threads = []
    for _ in range(num_tasks):
        thread = threading.Thread(target=cpu_intensive, args=(task_size,))
        thread.start()
        threads.append(thread)
    for thread in threads:
        thread.join()
    threading_time = time.time() - start
    print(f"多线程: {threading_time:.2f}秒 (加速比: {serial_time/threading_time:.2f}x)")

    # 3. 多进程
    start = time.time()
    with ProcessPoolExecutor(max_workers=num_tasks) as executor:
        results = list(executor.map(cpu_intensive, [task_size] * num_tasks))
    multiprocessing_time = time.time() - start
    print(f"多进程: {multiprocessing_time:.2f}秒 (加速比: {serial_time/multiprocessing_time:.2f}x)")

def benchmark_io():
    """I/O 密集型任务基准测试"""
    duration = 1
    num_tasks = 10

    print("\n=== I/O 密集型任务 ===")

    # 1. 串行执行
    start = time.time()
    results = [io_intensive(duration) for _ in range(num_tasks)]
    serial_time = time.time() - start
    print(f"串行执行: {serial_time:.2f}秒")

    # 2. 多线程
    start = time.time()
    with ThreadPoolExecutor(max_workers=num_tasks) as executor:
        results = list(executor.map(io_intensive, [duration] * num_tasks))
    threading_time = time.time() - start
    print(f"多线程: {threading_time:.2f}秒 (加速比: {serial_time/threading_time:.2f}x)")

    # 3. 多进程
    start = time.time()
    with ProcessPoolExecutor(max_workers=num_tasks) as executor:
        results = list(executor.map(io_intensive, [duration] * num_tasks))
    multiprocessing_time = time.time() - start
    print(f"多进程: {multiprocessing_time:.2f}秒 (加速比: {serial_time/multiprocessing_time:.2f}x)")

if __name__ == "__main__":
    benchmark_cpu()
    benchmark_io()
```

### 最佳实践

#### 选择合适的并发模型

```python
import time
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

class TaskScheduler:
    """智能任务调度器"""

    @staticmethod
    def run_io_tasks(tasks, max_workers=10):
        """执行 I/O 密集型任务"""
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            return list(executor.map(lambda t: t(), tasks))

    @staticmethod
    def run_cpu_tasks(tasks, max_workers=None):
        """执行 CPU 密集型任务"""
        if max_workers is None:
            max_workers = multiprocessing.cpu_count()

        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            return list(executor.map(lambda t: t(), tasks))

    @staticmethod
    def run_mixed_tasks(io_tasks, cpu_tasks):
        """混合执行 I/O 和 CPU 任务"""
        io_results = TaskScheduler.run_io_tasks(io_tasks)
        cpu_results = TaskScheduler.run_cpu_tasks(cpu_tasks)
        return io_results, cpu_results

# 使用示例
def io_task():
    time.sleep(0.1)
    return "I/O 完成"

def cpu_task():
    return sum(i * i for i in range(1000000))

if __name__ == "__main__":
    scheduler = TaskScheduler()

    io_tasks = [io_task] * 20
    cpu_tasks = [cpu_task] * 4

    io_results, cpu_results = scheduler.run_mixed_tasks(io_tasks, cpu_tasks)
    print(f"I/O 任务完成: {len(io_results)} 个")
    print(f"CPU 任务完成: {len(cpu_results)} 个")
```

#### 避免常见陷阱

```python
import threading
import multiprocessing
import time

# 陷阱 1: 竞态条件
class RaceConditionDemo:
    def __init__(self):
        self.counter = 0
        self.lock = threading.Lock()

    def unsafe_increment(self):
        """不安全的增加"""
        temp = self.counter
        time.sleep(0.0001)  # 模拟处理时间
        self.counter = temp + 1

    def safe_increment(self):
        """安全的增加"""
        with self.lock:
            temp = self.counter
            time.sleep(0.0001)
            self.counter = temp + 1

# 陷阱 2: 死锁
class DeadlockDemo:
    def __init__(self):
        self.lock1 = threading.Lock()
        self.lock2 = threading.Lock()

    def task1(self):
        """可能导致死锁的任务 1"""
        with self.lock1:
            print("任务 1 获取锁 1")
            time.sleep(0.1)
            with self.lock2:
                print("任务 1 获取锁 2")

    def task2(self):
        """可能导致死锁的任务 2"""
        with self.lock2:
            print("任务 2 获取锁 2")
            time.sleep(0.1)
            with self.lock1:
                print("任务 2 获取锁 1")

    def safe_task1(self):
        """避免死锁：按相同顺序获取锁"""
        with self.lock1:
            print("安全任务 1 获取锁 1")
            time.sleep(0.1)
            with self.lock2:
                print("安全任务 1 获取锁 2")

    def safe_task2(self):
        """避免死锁：按相同顺序获取锁"""
        with self.lock1:  # 与 safe_task1 相同的顺序
            print("安全任务 2 获取锁 1")
            time.sleep(0.1)
            with self.lock2:
                print("安全任务 2 获取锁 2")

# 陷阱 3: 忘记 join
def demo_without_join():
    """忘记 join 的后果"""
    def worker():
        print("线程开始")
        time.sleep(2)
        print("线程结束")

    thread = threading.Thread(target=worker)
    thread.start()
    # 没有 join，主程序可能在线程完成前就结束
    print("主程序结束")

def demo_with_join():
    """正确使用 join"""
    def worker():
        print("线程开始")
        time.sleep(2)
        print("线程结束")

    thread = threading.Thread(target=worker)
    thread.start()
    thread.join()  # 等待线程完成
    print("主程序结束")

if __name__ == "__main__":
    print("=== 竞态条件演示 ===")
    demo = RaceConditionDemo()
    threads = [threading.Thread(target=demo.safe_increment) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    print(f"最终计数: {demo.counter}")
```

#### 优雅地关闭线程和进程

```python
import threading
import multiprocessing
import time
import signal
import sys

class GracefulThread(threading.Thread):
    """支持优雅关闭的线程"""

    def __init__(self):
        super().__init__()
        self.stop_event = threading.Event()

    def run(self):
        """线程主循环"""
        while not self.stop_event.is_set():
            print("线程运行中...")
            time.sleep(1)
        print("线程优雅退出")

    def stop(self):
        """停止线程"""
        self.stop_event.set()

class GracefulProcess(multiprocessing.Process):
    """支持优雅关闭的进程"""

    def __init__(self):
        super().__init__()
        self.stop_event = multiprocessing.Event()

    def run(self):
        """进程主循环"""
        while not self.stop_event.is_set():
            print("进程运行中...")
            time.sleep(1)
        print("进程优雅退出")

    def stop(self):
        """停止进程"""
        self.stop_event.set()

# 使用示例
def main():
    # 创建线程
    thread = GracefulThread()
    thread.start()

    # 创建进程
    process = GracefulProcess()
    process.start()

    # 运行一段时间后停止
    time.sleep(5)

    print("正在停止...")
    thread.stop()
    process.stop()

    thread.join()
    process.join()

    print("所有任务已停止")

if __name__ == "__main__":
    main()
```

#### 监控和日志

```python
import threading
import multiprocessing
import logging
import time
from functools import wraps

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(threadName)s - %(levelname)s - %(message)s'
)

def log_thread_execution(func):
    """装饰器：记录线程执行"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        thread_name = threading.current_thread().name
        logging.info(f"{thread_name} 开始执行 {func.__name__}")
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            elapsed_time = time.time() - start_time
            logging.info(f"{thread_name} 完成 {func.__name__}，耗时 {elapsed_time:.2f}秒")
            return result
        except Exception as e:
            logging.error(f"{thread_name} 执行 {func.__name__} 时出错: {e}")
            raise

    return wrapper

class ThreadMonitor:
    """线程监控器"""

    def __init__(self):
        self.active_threads = {}
        self.lock = threading.Lock()

    def register_thread(self, thread_id, task_name):
        """注册线程"""
        with self.lock:
            self.active_threads[thread_id] = {
                'task': task_name,
                'start_time': time.time(),
                'status': 'running'
            }
        logging.info(f"注册线程 {thread_id}: {task_name}")

    def unregister_thread(self, thread_id):
        """注销线程"""
        with self.lock:
            if thread_id in self.active_threads:
                info = self.active_threads[thread_id]
                elapsed = time.time() - info['start_time']
                logging.info(f"线程 {thread_id} 完成，耗时 {elapsed:.2f}秒")
                del self.active_threads[thread_id]

    def get_status(self):
        """获取状态"""
        with self.lock:
            return dict(self.active_threads)

# 使用示例
monitor = ThreadMonitor()

@log_thread_execution
def monitored_task(task_id):
    """被监控的任务"""
    thread_id = threading.get_ident()
    monitor.register_thread(thread_id, f"任务-{task_id}")

    try:
        time.sleep(2)
        logging.info(f"任务 {task_id} 执行中...")
        return f"任务 {task_id} 结果"
    finally:
        monitor.unregister_thread(thread_id)

if __name__ == "__main__":
    threads = []
    for i in range(5):
        thread = threading.Thread(target=monitored_task, args=(i,), name=f"Worker-{i}")
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()

    print(f"活动线程: {monitor.get_status()}")
```

## 总结

### 何时使用多线程

- **I/O 密集型任务**：网络请求、文件操作、数据库查询
- **需要共享状态**：多个任务需要访问相同的数据
- **轻量级并发**：任务数量多但每个任务轻量

### 何时使用多进程

- **CPU 密集型任务**：数学计算、图像处理、数据分析
- **需要真正的并行**：充分利用多核 CPU
- **隔离性要求高**：避免共享状态的问题

### 关键要点

1. **理解 GIL**：多线程不适合 CPU 密集型任务
2. **选择合适的同步原语**：Lock、RLock、Semaphore、Event 等
3. **使用进程池/线程池**：简化并发编程，提高性能
4. **注意进程间通信开销**：Queue、Pipe、共享内存各有优劣
5. **避免常见陷阱**：竞态条件、死锁、资源泄漏
6. **优雅地关闭**：使用事件和信号量正确终止线程/进程
7. **监控和日志**：跟踪并发任务的执行状态

### 性能优化建议

1. **减少锁的粒度**：尽量缩短持有锁的时间
2. **使用局部变量**：减少对共享状态的访问
3. **批量处理**：减少进程间通信次数
4. **选择合适的工作进程数**：通常为 CPU 核心数
5. **预热进程池**：避免冷启动开销
6. **使用专业库**：如 NumPy、Pandas 已经优化了并行处理

通过合理使用 Python 的并发编程工具，可以显著提升程序性能，特别是在处理大量 I/O 操作或需要充分利用多核 CPU 的场景中。
