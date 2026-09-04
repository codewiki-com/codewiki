---
title: Python time 模块详解
description: 全面掌握 Python time 模块，包括时间获取、休眠、格式化、高精度计时器和时区处理
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - time
  - 时间
  - 性能计时
  - 时区
status: imported
origin: old/src/content/docs/python/time-module.zh.md
divergence: 0.208
issues:
  - category-casing
legacy:
  category: Python
  subcategory: 标准库
  order: 34
  lastUpdated: 2026-01-07
---

`time` 模块是 Python 标准库中处理时间的底层模块，提供了与系统时间相关的各种功能。与 `datetime` 模块侧重于日期时间对象操作不同，`time` 模块更接近操作系统层面，提供了时间戳获取、程序休眠、高精度计时和时间格式化等核心功能。

## 概念解释

### time 模块的定位

`time` 模块是 Python 与操作系统时间交互的桥梁。它主要处理：

- **Unix 时间戳**：自 1970-01-01 00:00:00 UTC 以来的秒数
- **结构化时间**：将时间分解为年、月、日、时、分、秒等组件
- **程序休眠**：暂停程序执行指定时间
- **高精度计时**：用于性能测量和基准测试
- **时区信息**：获取本地时区偏移

```python
import time

# 模块主要功能概览
print(time.time())        # 当前时间戳
print(time.localtime())   # 本地结构化时间
print(time.gmtime())      # UTC 结构化时间
print(time.strftime('%Y-%m-%d %H:%M:%S'))  # 格式化时间
```

### 与 datetime 模块的区别

| 特性 | time 模块 | datetime 模块 |
|------|-----------|---------------|
| 抽象层次 | 底层，接近操作系统 | 高层，面向对象 |
| 时间表示 | 时间戳（浮点数）、struct_time | date、time、datetime 对象 |
| 主要用途 | 性能计时、休眠、底层时间操作 | 日期时间计算、格式化、业务逻辑 |
| 时区支持 | 基础支持 | 更完善的时区处理 |
| 日期运算 | 不支持 | 支持 timedelta 运算 |

---

## 核心原理

### Unix 时间戳

Unix 时间戳（Unix Epoch）是计算时间的国际标准，定义为自 **1970年1月1日 00:00:00 UTC** 以来经过的秒数。

```python
import time

# 当前时间戳
timestamp = time.time()
print(f"当前时间戳: {timestamp}")  # 例如: 1736234445.123456

# 时间戳是浮点数，小数部分是微秒
print(f"整数部分（秒）: {int(timestamp)}")
print(f"小数部分（微秒）: {timestamp - int(timestamp)}")

# 时间戳的范围
# 32位系统: 1970-01-01 到 2038-01-19 (Year 2038 Problem)
# 64位系统: 实际上无限制
```

### struct_time 结构

`struct_time` 是一个命名元组，将时间分解为9个组件：

```python
import time

# 获取当前本地时间的 struct_time
st = time.localtime()
print(st)
# time.struct_time(tm_year=2026, tm_mon=1, tm_mday=7,
#                  tm_hour=14, tm_min=30, tm_sec=45,
#                  tm_wday=2, tm_yday=7, tm_isdst=0)

# struct_time 的各个字段
print(f"年 (tm_year): {st.tm_year}")      # 2026
print(f"月 (tm_mon): {st.tm_mon}")        # 1-12
print(f"日 (tm_mday): {st.tm_mday}")      # 1-31
print(f"时 (tm_hour): {st.tm_hour}")      # 0-23
print(f"分 (tm_min): {st.tm_min}")        # 0-59
print(f"秒 (tm_sec): {st.tm_sec}")        # 0-61 (允许闰秒)
print(f"星期 (tm_wday): {st.tm_wday}")    # 0-6 (周一=0)
print(f"年中第几天 (tm_yday): {st.tm_yday}")  # 1-366
print(f"夏令时 (tm_isdst): {st.tm_isdst}")    # 0/1/-1

# 可以像元组一样通过索引访问
print(st[0])  # 年
print(st[1])  # 月
```

### 时钟类型

Python 提供多种时钟，适用于不同场景：

```python
import time

# time.time() - 系统时钟
# 返回自 epoch 以来的秒数，可能受系统时间调整影响
print(f"time(): {time.time()}")

# time.monotonic() - 单调时钟
# 只会前进，不受系统时间调整影响，适合测量时间间隔
print(f"monotonic(): {time.monotonic()}")

# time.perf_counter() - 性能计数器
# 最高精度的时钟，适合性能基准测试
print(f"perf_counter(): {time.perf_counter()}")

# time.process_time() - 进程时间
# 不包括休眠时间，只计算 CPU 时间
print(f"process_time(): {time.process_time()}")

# time.thread_time() - 线程时间 (Python 3.7+)
# 当前线程的 CPU 时间
print(f"thread_time(): {time.thread_time()}")

# 获取时钟的详细信息
print(time.get_clock_info('time'))
print(time.get_clock_info('monotonic'))
print(time.get_clock_info('perf_counter'))
```

---

## 核心要点

### 时间获取函数

```python
import time

# time() - 获取当前时间戳
timestamp = time.time()
print(f"时间戳: {timestamp}")

# time_ns() - 获取纳秒级时间戳 (Python 3.7+)
timestamp_ns = time.time_ns()
print(f"纳秒时间戳: {timestamp_ns}")

# localtime() - 转换为本地时间 struct_time
local = time.localtime()
local_from_ts = time.localtime(timestamp)

# gmtime() - 转换为 UTC 时间 struct_time
utc = time.gmtime()
utc_from_ts = time.gmtime(timestamp)

# mktime() - struct_time 转换为时间戳
st = time.localtime()
ts = time.mktime(st)
print(f"struct_time -> timestamp: {ts}")
```

### 休眠函数

```python
import time

# sleep() - 休眠指定秒数
print("开始休眠...")
time.sleep(1)          # 休眠 1 秒
time.sleep(0.5)        # 休眠 0.5 秒
time.sleep(0.001)      # 休眠 1 毫秒
print("休眠结束")

# sleep 的精度取决于操作系统
# Windows: 通常 10-15ms 精度
# Linux/macOS: 通常 1ms 或更高精度

# 注意：sleep 可能被信号中断
import signal

def handler(signum, frame):
    print("收到信号")

signal.signal(signal.SIGALRM, handler)

try:
    time.sleep(10)  # 可能提前返回
except InterruptedError:
    print("休眠被中断")
```

### 格式化函数

```python
import time

# strftime() - 格式化 struct_time 为字符串
st = time.localtime()
formatted = time.strftime('%Y-%m-%d %H:%M:%S', st)
print(formatted)  # 2026-01-07 14:30:45

# 不传入 struct_time 则使用当前本地时间
print(time.strftime('%Y-%m-%d'))

# strptime() - 解析字符串为 struct_time
st = time.strptime('2026-01-07 14:30:45', '%Y-%m-%d %H:%M:%S')
print(st)

# asctime() - struct_time 转为可读字符串
print(time.asctime(st))  # Tue Jan  7 14:30:45 2026

# ctime() - 时间戳转为可读字符串
print(time.ctime(time.time()))  # Tue Jan  7 14:30:45 2026
```

### 高精度计时器

```python
import time

# perf_counter() - 性能计数器（最高精度）
start = time.perf_counter()
# 执行代码
result = sum(range(1000000))
end = time.perf_counter()
print(f"耗时: {end - start:.6f} 秒")

# perf_counter_ns() - 纳秒级性能计数器
start_ns = time.perf_counter_ns()
result = sum(range(1000000))
end_ns = time.perf_counter_ns()
print(f"耗时: {end_ns - start_ns} 纳秒")

# monotonic() - 单调时钟（不受系统时间调整影响）
start = time.monotonic()
time.sleep(0.1)
end = time.monotonic()
print(f"实际休眠: {end - start:.6f} 秒")

# monotonic_ns() - 纳秒级单调时钟
start_ns = time.monotonic_ns()
time.sleep(0.1)
end_ns = time.monotonic_ns()
print(f"实际休眠: {end_ns - start_ns} 纳秒")
```

### 时区相关

```python
import time

# timezone - UTC 偏移（秒）
# 注意：西边时区为正，东边时区为负（与通常理解相反）
print(f"时区偏移: {time.timezone} 秒")
print(f"时区偏移: {time.timezone // 3600} 小时")

# altzone - 夏令时的 UTC 偏移
print(f"夏令时偏移: {time.altzone} 秒")

# daylight - 是否有夏令时
print(f"是否有夏令时: {time.daylight}")

# tzname - 时区名称元组 (标准时间名, 夏令时名)
print(f"时区名称: {time.tzname}")

# 设置时区环境变量
import os
os.environ['TZ'] = 'Asia/Shanghai'
time.tzset()  # 重新读取时区设置 (Unix only)
```

---

## 代码示例

### time() - 获取当前时间戳

```python
import time

# 基本用法
timestamp = time.time()
print(f"当前时间戳: {timestamp}")
# 输出: 当前时间戳: 1736234445.123456

# 时间戳的精度
print(f"秒: {int(timestamp)}")
print(f"毫秒: {int(timestamp * 1000)}")
print(f"微秒: {int(timestamp * 1000000)}")

# 使用 time_ns() 获取纳秒级精度
timestamp_ns = time.time_ns()
print(f"纳秒时间戳: {timestamp_ns}")

# 计算代码执行时间（基础方式）
start = time.time()
# 执行一些操作
total = sum(range(1000000))
end = time.time()
print(f"执行时间: {end - start:.4f} 秒")

# 时间戳与 datetime 转换
from datetime import datetime

# 时间戳 -> datetime
dt = datetime.fromtimestamp(timestamp)
print(f"datetime: {dt}")

# datetime -> 时间戳
new_ts = dt.timestamp()
print(f"时间戳: {new_ts}")
```

### sleep() - 程序休眠

```python
import time

# 基本休眠
print(f"开始: {time.strftime('%H:%M:%S')}")
time.sleep(2)  # 休眠 2 秒
print(f"结束: {time.strftime('%H:%M:%S')}")

# 毫秒级休眠
time.sleep(0.1)   # 100 毫秒
time.sleep(0.01)  # 10 毫秒
time.sleep(0.001) # 1 毫秒

# 实现简单的倒计时
def countdown(seconds):
    """简单倒计时"""
    for i in range(seconds, 0, -1):
        print(f"\r倒计时: {i} 秒", end='', flush=True)
        time.sleep(1)
    print("\r倒计时结束!    ")

countdown(5)

# 实现轮询机制
def poll_until(condition_func, timeout=30, interval=1):
    """轮询直到条件满足或超时"""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if condition_func():
            return True
        time.sleep(interval)
    return False

# 使用示例
counter = [0]
def check_condition():
    counter[0] += 1
    return counter[0] >= 3

result = poll_until(check_condition, timeout=10, interval=0.5)
print(f"条件满足: {result}")

# 实现带抖动的重试
import random

def retry_with_backoff(func, max_retries=5, base_delay=1):
    """带指数退避和抖动的重试"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            print(f"重试 {attempt + 1}/{max_retries}，等待 {delay:.2f} 秒")
            time.sleep(delay)
```

### strftime() 和 strptime() - 时间格式化

```python
import time

# strftime - 格式化输出
st = time.localtime()

# 常用格式
print(time.strftime('%Y-%m-%d', st))           # 2026-01-07
print(time.strftime('%Y/%m/%d', st))           # 2026/01/07
print(time.strftime('%Y-%m-%d %H:%M:%S', st))  # 2026-01-07 14:30:45
print(time.strftime('%H:%M:%S', st))           # 14:30:45
print(time.strftime('%I:%M %p', st))           # 02:30 PM

# 中文格式
print(time.strftime('%Y年%m月%d日', st))       # 2026年01月07日
print(time.strftime('%Y年%m月%d日 %H时%M分%S秒', st))

# 英文格式
print(time.strftime('%A, %B %d, %Y', st))      # Wednesday, January 07, 2026
print(time.strftime('%a, %b %d', st))          # Wed, Jan 07

# ISO 格式
print(time.strftime('%Y-%m-%dT%H:%M:%S', st))  # 2026-01-07T14:30:45

# 特殊格式
print(time.strftime('%j', st))    # 年中第几天 007
print(time.strftime('%U', st))    # 年中第几周（周日开始）
print(time.strftime('%W', st))    # 年中第几周（周一开始）
print(time.strftime('%Z', st))    # 时区名称

# strptime - 解析字符串
st1 = time.strptime('2026-01-07', '%Y-%m-%d')
print(st1)

st2 = time.strptime('2026-01-07 14:30:45', '%Y-%m-%d %H:%M:%S')
print(st2)

st3 = time.strptime('2026年01月07日', '%Y年%m月%d日')
print(st3)

st4 = time.strptime('January 07, 2026', '%B %d, %Y')
print(st4)

# 解析后转换为时间戳
timestamp = time.mktime(st2)
print(f"时间戳: {timestamp}")
```

### 格式化代码参考表

| 代码 | 含义 | 示例 |
|------|------|------|
| `%Y` | 四位年份 | 2026 |
| `%y` | 两位年份 | 26 |
| `%m` | 月份（补零） | 01-12 |
| `%d` | 日期（补零） | 01-31 |
| `%H` | 小时（24小时制） | 00-23 |
| `%I` | 小时（12小时制） | 01-12 |
| `%M` | 分钟 | 00-59 |
| `%S` | 秒 | 00-59 |
| `%f` | 微秒 | 000000-999999 |
| `%p` | AM/PM | AM, PM |
| `%A` | 星期全名 | Wednesday |
| `%a` | 星期缩写 | Wed |
| `%B` | 月份全名 | January |
| `%b` | 月份缩写 | Jan |
| `%j` | 年中第几天 | 001-366 |
| `%U` | 年中第几周（周日开始） | 00-53 |
| `%W` | 年中第几周（周一开始） | 00-53 |
| `%w` | 星期几（0=周日） | 0-6 |
| `%z` | UTC 偏移 | +0800 |
| `%Z` | 时区名称 | CST |
| `%%` | 字面 % | % |

### perf_counter() - 高精度性能计时

```python
import time

# 基本用法 - 测量代码执行时间
start = time.perf_counter()

# 要测量的代码
result = 0
for i in range(1000000):
    result += i

end = time.perf_counter()
elapsed = end - start
print(f"执行时间: {elapsed:.6f} 秒")
print(f"执行时间: {elapsed * 1000:.3f} 毫秒")

# 使用纳秒版本获得更高精度
start_ns = time.perf_counter_ns()

result = 0
for i in range(1000000):
    result += i

end_ns = time.perf_counter_ns()
elapsed_ns = end_ns - start_ns
print(f"执行时间: {elapsed_ns} 纳秒")
print(f"执行时间: {elapsed_ns / 1000000:.3f} 毫秒")

# 创建计时器上下文管理器
from contextlib import contextmanager

@contextmanager
def timer(name="代码块"):
    """计时器上下文管理器"""
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{name} 耗时: {elapsed:.6f} 秒")

# 使用计时器
with timer("列表推导式"):
    result = [i ** 2 for i in range(100000)]

with timer("循环"):
    result = []
    for i in range(100000):
        result.append(i ** 2)

# 创建可重用的计时器类
class Timer:
    """可重用的高精度计时器"""

    def __init__(self):
        self._start = None
        self._elapsed = 0
        self._running = False

    def start(self):
        """开始计时"""
        if not self._running:
            self._start = time.perf_counter()
            self._running = True
        return self

    def stop(self):
        """停止计时"""
        if self._running:
            self._elapsed += time.perf_counter() - self._start
            self._running = False
        return self

    def reset(self):
        """重置计时器"""
        self._start = None
        self._elapsed = 0
        self._running = False
        return self

    @property
    def elapsed(self):
        """获取已用时间"""
        if self._running:
            return self._elapsed + (time.perf_counter() - self._start)
        return self._elapsed

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *args):
        self.stop()

# 使用计时器类
timer = Timer()

# 方式1: 手动控制
timer.start()
time.sleep(0.1)
timer.stop()
print(f"耗时: {timer.elapsed:.4f} 秒")

# 方式2: 上下文管理器
with Timer() as t:
    time.sleep(0.1)
print(f"耗时: {t.elapsed:.4f} 秒")

# 方式3: 累计计时
timer = Timer()
for _ in range(3):
    timer.start()
    time.sleep(0.05)
    timer.stop()
print(f"累计耗时: {timer.elapsed:.4f} 秒")
```

### monotonic() - 单调时钟

```python
import time

# monotonic 的特点：
# 只会前进，不会后退
# 不受系统时间调整影响
# 适合测量时间间隔

# 基本用法
start = time.monotonic()
time.sleep(1)
end = time.monotonic()
print(f"经过时间: {end - start:.4f} 秒")

# monotonic 与 time 的区别演示
# 如果系统时间被调整，time() 会受影响，monotonic() 不会

# 实现超时检测
def wait_with_timeout(condition_func, timeout):
    """等待条件满足或超时"""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if condition_func():
            return True
        time.sleep(0.01)
    return False

# 实现速率限制器
class RateLimiter:
    """简单的速率限制器"""

    def __init__(self, rate, per=1.0):
        """
        rate: 允许的操作次数
        per: 时间窗口（秒）
        """
        self.rate = rate
        self.per = per
        self.allowance = rate
        self.last_check = time.monotonic()

    def allow(self):
        """检查是否允许操作"""
        current = time.monotonic()
        elapsed = current - self.last_check
        self.last_check = current

        # 补充配额
        self.allowance += elapsed * (self.rate / self.per)
        if self.allowance > self.rate:
            self.allowance = self.rate

        if self.allowance < 1.0:
            return False

        self.allowance -= 1.0
        return True

# 使用速率限制器
limiter = RateLimiter(rate=5, per=1.0)  # 每秒最多 5 次

for i in range(10):
    if limiter.allow():
        print(f"请求 {i} 被允许")
    else:
        print(f"请求 {i} 被限制")
    time.sleep(0.1)
```

### timezone - 时区处理

```python
import time
import os

# 获取当前时区信息
print(f"时区偏移: {time.timezone} 秒 ({time.timezone // 3600} 小时)")
print(f"夏令时偏移: {time.altzone} 秒")
print(f"是否有夏令时: {time.daylight}")
print(f"时区名称: {time.tzname}")

# 判断当前是否为夏令时
st = time.localtime()
if st.tm_isdst > 0:
    print("当前是夏令时")
elif st.tm_isdst == 0:
    print("当前不是夏令时")
else:
    print("夏令时信息未知")

# 转换本地时间和 UTC 时间
timestamp = time.time()

# 本地时间
local_time = time.localtime(timestamp)
print(f"本地时间: {time.strftime('%Y-%m-%d %H:%M:%S', local_time)}")

# UTC 时间
utc_time = time.gmtime(timestamp)
print(f"UTC 时间: {time.strftime('%Y-%m-%d %H:%M:%S', utc_time)}")

# 计算时区偏移
local_ts = time.mktime(local_time)
utc_ts = time.mktime(utc_time)
offset_hours = (local_ts - utc_ts) / 3600
print(f"时区偏移: {offset_hours:+.0f} 小时")

# 设置时区（仅 Unix 系统）
# os.environ['TZ'] = 'America/New_York'
# time.tzset()

# 创建时区转换函数
def convert_timezone(timestamp, from_offset, to_offset):
    """
    转换时间戳到不同时区
    offset: UTC 偏移小时数（东边为正）
    """
    # 调整到 UTC
    utc_ts = timestamp - from_offset * 3600
    # 调整到目标时区
    target_ts = utc_ts + to_offset * 3600
    return target_ts

# 北京时间转纽约时间
beijing_ts = time.time()  # 假设这是北京时间的时间戳
ny_ts = convert_timezone(beijing_ts, 8, -5)  # +8 -> -5

print(f"北京: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(beijing_ts))}")
print(f"纽约: {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ny_ts))}")
```

---

## 最佳实践

### 选择正确的时钟

```python
import time

# 场景1: 需要获取当前时间点（如日志记录）
# 使用 time.time()
log_time = time.time()
print(f"[{log_time}] 事件发生")

# 场景2: 测量代码执行时间（性能基准测试）
# 使用 time.perf_counter()
start = time.perf_counter()
# 执行代码
elapsed = time.perf_counter() - start

# 场景3: 实现超时机制
# 使用 time.monotonic()（不受系统时间调整影响）
deadline = time.monotonic() + 30  # 30秒超时

# 场景4: 分析 CPU 密集型代码性能
# 使用 time.process_time()（只计算 CPU 时间）
cpu_start = time.process_time()
# CPU 密集型操作
cpu_time = time.process_time() - cpu_start
```

### 避免 sleep 精度问题

```python
import time

# 问题：sleep 的实际休眠时间可能比请求的长
def measure_sleep_accuracy(duration, iterations=10):
    """测量 sleep 的精度"""
    errors = []
    for _ in range(iterations):
        start = time.perf_counter()
        time.sleep(duration)
        actual = time.perf_counter() - start
        errors.append(actual - duration)

    avg_error = sum(errors) / len(errors)
    max_error = max(errors)
    return avg_error, max_error

avg, max_err = measure_sleep_accuracy(0.01)  # 10ms
print(f"平均误差: {avg * 1000:.3f} ms, 最大误差: {max_err * 1000:.3f} ms")

# 解决方案：使用忙等待实现高精度休眠（消耗 CPU）
def precise_sleep(duration):
    """高精度休眠（使用忙等待）"""
    end = time.perf_counter() + duration
    while time.perf_counter() < end:
        pass

# 混合方案：大部分时间用 sleep，最后用忙等待
def hybrid_sleep(duration, precision=0.001):
    """混合休眠：节省 CPU 同时保持精度"""
    end = time.perf_counter() + duration

    # 大部分时间使用 sleep
    if duration > precision * 2:
        time.sleep(duration - precision)

    # 最后用忙等待达到精度
    while time.perf_counter() < end:
        pass
```

### 正确处理时间戳

```python
import time
from datetime import datetime, timezone

# 最佳实践：始终存储 UTC 时间戳
def get_utc_timestamp():
    """获取 UTC 时间戳"""
    return time.time()

# 显示时转换为本地时间
def timestamp_to_local_string(ts):
    """时间戳转本地时间字符串"""
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))

def timestamp_to_utc_string(ts):
    """时间戳转 UTC 时间字符串"""
    return time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ts))

# 使用示例
ts = get_utc_timestamp()
print(f"时间戳: {ts}")
print(f"本地时间: {timestamp_to_local_string(ts)}")
print(f"UTC 时间: {timestamp_to_utc_string(ts)}")

# 避免直接比较不同时区的时间
# 始终转换为时间戳进行比较
def is_before(time1_str, time2_str, fmt='%Y-%m-%d %H:%M:%S'):
    """比较两个时间字符串"""
    st1 = time.strptime(time1_str, fmt)
    st2 = time.strptime(time2_str, fmt)
    return time.mktime(st1) < time.mktime(st2)
```

### 优雅处理格式化错误

```python
import time

def safe_strptime(date_string, format_string):
    """安全的时间解析"""
    try:
        return time.strptime(date_string, format_string)
    except ValueError as e:
        print(f"解析错误: {e}")
        return None

def parse_flexible(date_string):
    """尝试多种格式解析"""
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d',
        '%Y/%m/%d',
        '%d/%m/%Y',
        '%Y年%m月%d日',
        '%B %d, %Y',
    ]

    for fmt in formats:
        try:
            return time.strptime(date_string, fmt)
        except ValueError:
            continue

    raise ValueError(f"无法解析日期: {date_string}")

# 使用示例
print(parse_flexible('2026-01-07'))
print(parse_flexible('2026年01月07日'))
print(parse_flexible('January 07, 2026'))
```

---

## 常见陷阱

### time() 受系统时间影响

```python
import time

# 问题：系统时间可能被 NTP 调整，导致 time() 跳变
start = time.time()
# 如果此时系统时间被调整...
time.sleep(1)
end = time.time()
# end - start 可能不是 1 秒！

# 解决方案：使用 monotonic() 测量时间间隔
start = time.monotonic()
time.sleep(1)
end = time.monotonic()
# end - start 始终约等于 1 秒
```

### sleep 不是精确的

```python
import time

# 问题：sleep 可能休眠更长时间
for i in range(10):
    start = time.perf_counter()
    time.sleep(0.01)  # 请求 10ms
    actual = time.perf_counter() - start
    print(f"请求 10ms, 实际 {actual * 1000:.2f}ms")

# 解决方案：如果需要精确的定时循环
def precise_loop(interval, iterations):
    """精确的定时循环"""
    next_time = time.perf_counter()
    for i in range(iterations):
        # 执行任务
        print(f"迭代 {i}")

        # 计算下次执行时间
        next_time += interval
        sleep_time = next_time - time.perf_counter()
        if sleep_time > 0:
            time.sleep(sleep_time)

precise_loop(0.1, 10)  # 每 100ms 执行一次
```

### mktime 的时区陷阱

```python
import time

# 问题：mktime 假设输入是本地时间
utc_time = time.gmtime()  # 这是 UTC 时间
timestamp = time.mktime(utc_time)  # 但 mktime 当作本地时间处理！

# 正确做法：使用 calendar.timegm 处理 UTC 时间
import calendar
timestamp = calendar.timegm(utc_time)

# 或者手动补偿时区偏移
def utc_struct_to_timestamp(utc_struct):
    """将 UTC struct_time 转换为时间戳"""
    return calendar.timegm(utc_struct)

def local_struct_to_timestamp(local_struct):
    """将本地 struct_time 转换为时间戳"""
    return time.mktime(local_struct)
```

### strptime 的年份问题

```python
import time

# 问题：两位年份的解析
st = time.strptime('01-07-26', '%m-%d-%y')
print(st.tm_year)  # 2026? 还是 1926?

# Python 的规则：
# 00-68 -> 2000-2068
# 69-99 -> 1969-1999

# 建议：始终使用四位年份
st = time.strptime('01-07-2026', '%m-%d-%Y')
print(st.tm_year)  # 2026
```

### 浮点数精度问题

```python
import time

# 问题：时间戳是浮点数，可能有精度损失
ts1 = 1736234445.123456789
ts2 = time.time()

# 浮点数只能精确表示约 15-16 位有效数字
# 对于大时间戳，微秒级精度可能丢失

# 解决方案：使用纳秒版本
ts_ns = time.time_ns()  # 整数，无精度损失
print(f"纳秒时间戳: {ts_ns}")

# 或使用 Decimal 进行精确计算
from decimal import Decimal
precise_ts = Decimal(str(time.time()))
```

---

## 性能考量

### 各函数的性能比较

```python
import time

def benchmark(func, iterations=1000000):
    """基准测试函数"""
    start = time.perf_counter()
    for _ in range(iterations):
        func()
    elapsed = time.perf_counter() - start
    return elapsed / iterations * 1e9  # 纳秒/调用

# 测试各个时间函数的性能
results = {
    'time()': benchmark(time.time),
    'time_ns()': benchmark(time.time_ns),
    'monotonic()': benchmark(time.monotonic),
    'monotonic_ns()': benchmark(time.monotonic_ns),
    'perf_counter()': benchmark(time.perf_counter),
    'perf_counter_ns()': benchmark(time.perf_counter_ns),
    'process_time()': benchmark(time.process_time),
    'localtime()': benchmark(time.localtime),
    'gmtime()': benchmark(time.gmtime),
}

print("各函数性能（纳秒/调用）:")
for name, ns in sorted(results.items(), key=lambda x: x[1]):
    print(f"  {name}: {ns:.1f} ns")
```

### strftime/strptime 性能优化

```python
import time
from functools import lru_cache

# 问题：strftime/strptime 相对较慢

# 优化1：预编译格式（使用 datetime 模块）
from datetime import datetime

# 优化2：缓存结果
@lru_cache(maxsize=1024)
def cached_strptime(date_string, format_string):
    return time.strptime(date_string, format_string)

# 优化3：对于固定格式，使用字符串操作
def fast_parse_iso_date(date_str):
    """快速解析 ISO 日期（YYYY-MM-DD）"""
    # 比 strptime 快 5-10 倍
    return int(date_str[:4]), int(date_str[5:7]), int(date_str[8:10])

def fast_format_iso_date(year, month, day):
    """快速格式化 ISO 日期"""
    # 比 strftime 快 3-5 倍
    return f"{year:04d}-{month:02d}-{day:02d}"

# 性能对比
iterations = 100000

# strptime
start = time.perf_counter()
for _ in range(iterations):
    time.strptime('2026-01-07', '%Y-%m-%d')
strptime_time = time.perf_counter() - start

# fast_parse
start = time.perf_counter()
for _ in range(iterations):
    fast_parse_iso_date('2026-01-07')
fast_time = time.perf_counter() - start

print(f"strptime: {strptime_time:.3f}s")
print(f"fast_parse: {fast_time:.3f}s")
print(f"加速比: {strptime_time / fast_time:.1f}x")
```

### 减少 time 调用

```python
import time

# 问题：频繁调用 time 函数会有开销

# 优化：在循环外获取时间
def process_items_slow(items):
    """慢：每次循环都获取时间"""
    for item in items:
        item['processed_at'] = time.time()

def process_items_fast(items):
    """快：批量设置相同时间"""
    now = time.time()
    for item in items:
        item['processed_at'] = now

# 对于长时间运行的循环，定期更新时间
def process_with_periodic_time(items, time_interval=1.0):
    """定期更新时间"""
    last_time_check = time.monotonic()
    current_time = time.time()

    for item in items:
        # 检查是否需要更新时间
        now = time.monotonic()
        if now - last_time_check >= time_interval:
            current_time = time.time()
            last_time_check = now

        item['processed_at'] = current_time
```

---

## 实战场景

### 场景1: 代码性能分析器

```python
import time
from functools import wraps
from collections import defaultdict

class Profiler:
    """简单的代码性能分析器"""

    def __init__(self):
        self.stats = defaultdict(lambda: {'calls': 0, 'total_time': 0, 'min': float('inf'), 'max': 0})

    def profile(self, name=None):
        """装饰器：分析函数性能"""
        def decorator(func):
            func_name = name or func.__name__

            @wraps(func)
            def wrapper(*args, **kwargs):
                start = time.perf_counter()
                try:
                    return func(*args, **kwargs)
                finally:
                    elapsed = time.perf_counter() - start
                    stats = self.stats[func_name]
                    stats['calls'] += 1
                    stats['total_time'] += elapsed
                    stats['min'] = min(stats['min'], elapsed)
                    stats['max'] = max(stats['max'], elapsed)

            return wrapper
        return decorator

    def report(self):
        """生成性能报告"""
        print("\n性能分析报告")
        print("=" * 70)
        print(f"{'函数名':<20} {'调用次数':>10} {'总时间':>12} {'平均时间':>12} {'最大时间':>12}")
        print("-" * 70)

        for name, stats in sorted(self.stats.items(), key=lambda x: x[1]['total_time'], reverse=True):
            avg = stats['total_time'] / stats['calls'] if stats['calls'] > 0 else 0
            print(f"{name:<20} {stats['calls']:>10} {stats['total_time']*1000:>10.3f}ms "
                  f"{avg*1000:>10.3f}ms {stats['max']*1000:>10.3f}ms")

# 使用示例
profiler = Profiler()

@profiler.profile()
def slow_function():
    time.sleep(0.1)
    return sum(range(10000))

@profiler.profile()
def fast_function():
    return sum(range(1000))

# 执行函数
for _ in range(5):
    slow_function()
    fast_function()

# 生成报告
profiler.report()
```

### 场景2: 定时任务调度器

```python
import time
import threading
from dataclasses import dataclass
from typing import Callable, Optional
import heapq

@dataclass
class ScheduledTask:
    """调度任务"""
    run_at: float
    interval: Optional[float]
    func: Callable
    args: tuple
    kwargs: dict

    def __lt__(self, other):
        return self.run_at < other.run_at

class Scheduler:
    """简单的定时任务调度器"""

    def __init__(self):
        self.tasks = []
        self.running = False
        self._lock = threading.Lock()

    def schedule_at(self, run_at: float, func: Callable, *args, **kwargs):
        """在指定时间运行任务"""
        task = ScheduledTask(run_at, None, func, args, kwargs)
        with self._lock:
            heapq.heappush(self.tasks, task)

    def schedule_after(self, delay: float, func: Callable, *args, **kwargs):
        """延迟指定时间后运行任务"""
        run_at = time.time() + delay
        self.schedule_at(run_at, func, *args, **kwargs)

    def schedule_interval(self, interval: float, func: Callable, *args, **kwargs):
        """定期运行任务"""
        run_at = time.time() + interval
        task = ScheduledTask(run_at, interval, func, args, kwargs)
        with self._lock:
            heapq.heappush(self.tasks, task)

    def run(self):
        """运行调度器"""
        self.running = True
        while self.running:
            with self._lock:
                if not self.tasks:
                    continue

                now = time.time()
                task = self.tasks[0]

                if task.run_at <= now:
                    heapq.heappop(self.tasks)

                    # 执行任务
                    try:
                        task.func(*task.args, **task.kwargs)
                    except Exception as e:
                        print(f"任务执行错误: {e}")

                    # 如果是周期任务，重新调度
                    if task.interval:
                        task.run_at = now + task.interval
                        heapq.heappush(self.tasks, task)
                else:
                    # 等待到下一个任务
                    wait_time = min(task.run_at - now, 0.1)
                    time.sleep(wait_time)

            time.sleep(0.01)  # 防止 CPU 空转

    def stop(self):
        """停止调度器"""
        self.running = False

# 使用示例
def say_hello(name):
    print(f"[{time.strftime('%H:%M:%S')}] Hello, {name}!")

scheduler = Scheduler()
scheduler.schedule_after(1, say_hello, "World")
scheduler.schedule_after(2, say_hello, "Python")
scheduler.schedule_interval(1.5, lambda: print(f"[{time.strftime('%H:%M:%S')}] Tick"))

# 在新线程中运行调度器
thread = threading.Thread(target=scheduler.run, daemon=True)
thread.start()

time.sleep(5)
scheduler.stop()
```

### 场景3: 限流器

```python
import time
from collections import deque
from threading import Lock

class TokenBucket:
    """令牌桶限流器"""

    def __init__(self, rate: float, capacity: float):
        """
        rate: 每秒填充的令牌数
        capacity: 桶的容量
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_time = time.monotonic()
        self._lock = Lock()

    def acquire(self, tokens: int = 1) -> bool:
        """尝试获取令牌"""
        with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_time

            # 填充令牌
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_time = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

    def wait(self, tokens: int = 1):
        """等待直到获取令牌"""
        while not self.acquire(tokens):
            time.sleep(0.01)

class SlidingWindowLimiter:
    """滑动窗口限流器"""

    def __init__(self, limit: int, window: float):
        """
        limit: 窗口内允许的最大请求数
        window: 窗口大小（秒）
        """
        self.limit = limit
        self.window = window
        self.requests = deque()
        self._lock = Lock()

    def allow(self) -> bool:
        """检查是否允许请求"""
        with self._lock:
            now = time.monotonic()

            # 移除窗口外的请求
            while self.requests and self.requests[0] < now - self.window:
                self.requests.popleft()

            if len(self.requests) < self.limit:
                self.requests.append(now)
                return True
            return False

# 使用示例
bucket = TokenBucket(rate=10, capacity=10)  # 每秒10个请求

for i in range(20):
    if bucket.acquire():
        print(f"请求 {i} 成功")
    else:
        print(f"请求 {i} 被限流")
    time.sleep(0.05)
```

### 场景4: 超时装饰器

```python
import time
import signal
import threading
from functools import wraps

def timeout(seconds):
    """超时装饰器（Unix 系统，基于信号）"""
    def decorator(func):
        def handler(signum, frame):
            raise TimeoutError(f"函数 {func.__name__} 超时")

        @wraps(func)
        def wrapper(*args, **kwargs):
            old_handler = signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)

        return wrapper
    return decorator

def timeout_thread(seconds):
    """超时装饰器（跨平台，基于线程）"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = [None]
            exception = [None]

            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    exception[0] = e

            thread = threading.Thread(target=target)
            thread.start()
            thread.join(timeout=seconds)

            if thread.is_alive():
                raise TimeoutError(f"函数 {func.__name__} 超时")

            if exception[0]:
                raise exception[0]

            return result[0]

        return wrapper
    return decorator

# 使用示例
@timeout_thread(2)
def slow_operation():
    time.sleep(5)
    return "完成"

try:
    result = slow_operation()
except TimeoutError as e:
    print(f"超时: {e}")
```

---

## 面试要点

### 常见面试问题

**1. time.time() 和 time.monotonic() 的区别是什么？**

```python
import time

# time.time():
# - 返回自 epoch 以来的秒数
# - 可能受系统时间调整影响（NTP 同步、手动修改）
# - 可能向后跳变
# - 适合获取当前时间点

# time.monotonic():
# - 返回单调递增的计数器
# - 不受系统时间调整影响
# - 只会前进，不会后退
# - 适合测量时间间隔
```

**2. 如何实现高精度的性能测量？**

```python
import time

# 使用 perf_counter 获得最高精度
start = time.perf_counter()
# 执行代码
elapsed = time.perf_counter() - start

# 对于纳秒级精度
start_ns = time.perf_counter_ns()
# 执行代码
elapsed_ns = time.perf_counter_ns() - start_ns
```

**3. time.sleep() 的精度如何？有什么替代方案？**

```python
import time

# sleep 精度受操作系统调度影响
# Windows: 约 10-15ms
# Linux/macOS: 约 1ms

# 高精度替代方案：忙等待
def precise_sleep(duration):
    end = time.perf_counter() + duration
    while time.perf_counter() < end:
        pass

# 混合方案
def hybrid_sleep(duration, precision=0.001):
    end = time.perf_counter() + duration
    if duration > precision * 2:
        time.sleep(duration - precision)
    while time.perf_counter() < end:
        pass
```

**4. struct_time 和时间戳如何相互转换？**

```python
import time
import calendar

# 时间戳 -> struct_time
ts = time.time()
local_st = time.localtime(ts)  # 本地时间
utc_st = time.gmtime(ts)       # UTC 时间

# struct_time -> 时间戳
ts_from_local = time.mktime(local_st)      # 本地 struct_time
ts_from_utc = calendar.timegm(utc_st)      # UTC struct_time
```

**5. 如何处理时区？**

```python
import time
import os

# 获取时区信息
print(time.timezone)   # UTC 偏移（秒）
print(time.tzname)     # 时区名称

# 设置时区（Unix）
os.environ['TZ'] = 'Asia/Shanghai'
time.tzset()

# 建议：使用 datetime 模块或 pytz 进行时区处理
```

### 编程题

**实现一个简单的基准测试框架**

```python
import time
from functools import wraps
import statistics

def benchmark(iterations=1000, warmup=100):
    """基准测试装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 预热
            for _ in range(warmup):
                func(*args, **kwargs)

            # 正式测试
            times = []
            for _ in range(iterations):
                start = time.perf_counter_ns()
                func(*args, **kwargs)
                end = time.perf_counter_ns()
                times.append(end - start)

            # 统计结果
            avg = statistics.mean(times)
            median = statistics.median(times)
            stdev = statistics.stdev(times) if len(times) > 1 else 0

            print(f"\n{func.__name__} 基准测试结果:")
            print(f"  迭代次数: {iterations}")
            print(f"  平均时间: {avg:.2f} ns")
            print(f"  中位数: {median:.2f} ns")
            print(f"  标准差: {stdev:.2f} ns")
            print(f"  最小值: {min(times)} ns")
            print(f"  最大值: {max(times)} ns")

            return func(*args, **kwargs)
        return wrapper
    return decorator

# 使用示例
@benchmark(iterations=10000)
def test_list_append():
    lst = []
    for i in range(100):
        lst.append(i)

@benchmark(iterations=10000)
def test_list_comprehension():
    lst = [i for i in range(100)]

test_list_append()
test_list_comprehension()
```

---

## 延伸阅读

### 官方文档

- [time 模块官方文档](https://docs.python.org/3/library/time.html)
- [datetime 模块官方文档](https://docs.python.org/3/library/datetime.html)
- [PEP 564 -- 添加新的时间函数（纳秒精度）](https://www.python.org/dev/peps/pep-0564/)

### 相关模块

- **datetime**: 更高层次的日期时间处理
- **calendar**: 日历相关功能
- **timeit**: 代码计时工具
- **sched**: 事件调度器
- **pytz**: 第三方时区库
- **dateutil**: 强大的日期解析库

### 进阶主题

- **时钟同步**: NTP 协议和时钟漂移
- **高精度计时**: 硬件计数器和 HPET
- **实时系统**: 确定性延迟和抖动
- **分布式时间**: Lamport 时钟和向量时钟

---

## 总结

### 函数选择指南

| 场景 | 推荐函数 |
|------|----------|
| 获取当前时间点 | `time.time()` |
| 测量代码执行时间 | `time.perf_counter()` |
| 实现超时机制 | `time.monotonic()` |
| 分析 CPU 时间 | `time.process_time()` |
| 程序休眠 | `time.sleep()` |
| 时间格式化 | `time.strftime()` |
| 时间解析 | `time.strptime()` |

### 最佳实践总结

1. **性能测量用 perf_counter()**: 它提供最高精度
2. **超时机制用 monotonic()**: 不受系统时间调整影响
3. **存储时间用时间戳**: 跨时区、跨系统通用
4. **显示时间用 strftime()**: 支持各种格式
5. **注意 sleep 精度**: 实际休眠时间可能更长
6. **时区处理要谨慎**: 建议使用 datetime + pytz

`time` 模块是 Python 时间处理的基石，理解其原理和正确使用方式对于编写高质量的 Python 代码至关重要。对于日常业务开发，可以结合 `datetime` 模块使用；对于性能敏感的场景，则需要深入理解各种时钟的特性。
