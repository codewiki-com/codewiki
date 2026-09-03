---
title: Python functools 缓存装饰器 (lru_cache / cache)
description: 深入掌握 Python functools 模块的缓存装饰器，包括 lru_cache、cache 的原理、参数配置、缓存管理及最佳实践
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - functools
  - lru_cache
  - cache
  - 缓存
  - 性能优化
  - 装饰器
status: imported
origin: old/src/content/docs/python/lru-cache.zh.md
divergence: 0.206
issues: []
legacy:
  category: Python
  subcategory: 函数式编程
  order: 33
  lastUpdated: 2026-01-07
---

Python 的 `functools` 模块提供了强大的缓存装饰器 `@lru_cache` 和 `@cache`，可以自动记忆函数的计算结果，避免重复计算，从而显著提升程序性能。本文将深入剖析这两个装饰器的原理、用法和最佳实践。

## 概念解释

### 什么是函数缓存

函数缓存（也称为记忆化，Memoization）是一种优化技术：将函数的输入参数与对应的返回值存储起来，当相同参数再次调用时，直接返回缓存的结果，而不重新执行函数体。

```python
# 没有缓存：每次调用都重新计算
def fibonacci_naive(n):
    if n < 2:
        return n
    return fibonacci_naive(n - 1) + fibonacci_naive(n - 2)

# fibonacci_naive(35) 需要计算约 2900 万次递归调用
```

### LRU 缓存策略

LRU（Least Recently Used，最近最少使用）是一种缓存淘汰策略。当缓存空间满时，优先移除最久未被访问的数据。这种策略基于"最近被访问的数据在未来更可能被再次访问"的假设。

```
缓存操作示意（maxsize=3）:
初始: []
调用 f(1): [1]        # 缓存 miss，添加 1
调用 f(2): [1, 2]     # 缓存 miss，添加 2
调用 f(3): [1, 2, 3]  # 缓存 miss，添加 3
调用 f(1): [2, 3, 1]  # 缓存 hit，1 移到最后（最近使用）
调用 f(4): [3, 1, 4]  # 缓存 miss，移除最久未用的 2，添加 4
```

### @lru_cache 与 @cache 的关系

| 装饰器 | 引入版本 | 说明 |
|--------|----------|------|
| `@lru_cache` | Python 3.2 | 带大小限制的 LRU 缓存 |
| `@cache` | Python 3.9 | 无大小限制的简单缓存，等同于 `@lru_cache(maxsize=None)` |

```python
from functools import lru_cache, cache

# 以下两种写法功能等价
@cache
def func1(x):
    return x * 2

@lru_cache(maxsize=None)
def func2(x):
    return x * 2
```

## 核心原理

### 内部实现机制

`lru_cache` 的核心是一个基于双向链表和哈希表的数据结构，实现 O(1) 时间复杂度的查找和更新操作。

```python
# lru_cache 的简化实现原理
class SimpleLRUCache:
    def __init__(self, maxsize):
        self.maxsize = maxsize
        self.cache = {}           # 哈希表：快速查找
        self.order = []           # 双向链表（简化为列表）：维护访问顺序

    def get(self, key):
        if key in self.cache:
            # 移动到最近使用位置
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key], True  # (值, 命中)
        return None, False  # (None, 未命中)

    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.maxsize:
            # 移除最久未使用的项
            oldest = self.order.pop(0)
            del self.cache[oldest]

        self.cache[key] = value
        self.order.append(key)
```

### 缓存键的生成

`lru_cache` 使用函数参数生成缓存键。参数必须是可哈希的（hashable）。

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def compute(x, y, z=10):
    return x + y + z

# 缓存键的生成规则：
# compute(1, 2)        -> key: (1, 2)
# compute(1, 2, 10)    -> key: (1, 2, 10)  # 与上面不同！
# compute(1, 2, z=10)  -> key: (1, 2, ('z', 10))
# compute(x=1, y=2)    -> key: (('x', 1), ('y', 2))

# 注意：以下调用虽然结果相同，但缓存键不同
print(compute(1, 2))       # 计算并缓存
print(compute(1, 2, 10))   # 重新计算并缓存（键不同）
```

### typed 参数的作用

`typed=True` 时，不同类型的参数会被分别缓存。

```python
from functools import lru_cache

@lru_cache(maxsize=128, typed=False)  # 默认
def func_untyped(x):
    print(f"计算 {x} (type: {type(x).__name__})")
    return x * 2

@lru_cache(maxsize=128, typed=True)
def func_typed(x):
    print(f"计算 {x} (type: {type(x).__name__})")
    return x * 2

# typed=False: 3 和 3.0 视为相同
func_untyped(3)    # 计算
func_untyped(3.0)  # 从缓存返回（不打印）

# typed=True: 3 和 3.0 分别缓存
func_typed(3)      # 计算 3 (type: int)
func_typed(3.0)    # 计算 3.0 (type: float)
```

## 核心要点

### 基本使用方法

```python
from functools import lru_cache

# 基本用法：使用默认参数
@lru_cache
def factorial(n):
    return 1 if n <= 1 else n * factorial(n - 1)

# 指定缓存大小
@lru_cache(maxsize=256)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 无限缓存
@lru_cache(maxsize=None)
def expensive_computation(x, y):
    # 复杂计算
    return x ** y

# Python 3.9+ 简写
from functools import cache

@cache
def simple_cache(x):
    return x * 2
```

### 参数详解

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxsize` | int 或 None | 128 | 缓存最大条目数。None 表示无限制。建议使用 2 的幂次方。 |
| `typed` | bool | False | 是否区分参数类型。True 时 `f(3)` 和 `f(3.0)` 分别缓存。 |

```python
from functools import lru_cache

# maxsize 选择建议
@lru_cache(maxsize=32)    # 小缓存：参数空间有限
@lru_cache(maxsize=128)   # 中等缓存：默认值，适合大多数场景
@lru_cache(maxsize=1024)  # 大缓存：高频访问的计算
@lru_cache(maxsize=None)  # 无限缓存：确定性查找表

# 为什么推荐 2 的幂次方？
# Python 内部使用哈希表，2 的幂次方大小可优化取模运算
```

### 缓存管理方法

被装饰的函数会自动获得以下方法：

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_user(user_id):
    print(f"查询用户 {user_id}")
    return {"id": user_id, "name": f"User{user_id}"}

# 调用函数
get_user(1)
get_user(2)
get_user(1)  # 缓存命中

# cache_info(): 查看缓存统计
info = get_user.cache_info()
print(f"命中次数: {info.hits}")        # hits: 1
print(f"未命中次数: {info.misses}")    # misses: 2
print(f"当前缓存大小: {info.currsize}") # currsize: 2
print(f"最大缓存大小: {info.maxsize}")  # maxsize: 100

# cache_clear(): 清空所有缓存
get_user.cache_clear()
print(get_user.cache_info())  # hits=0, misses=0, currsize=0

# cache_parameters(): 获取缓存配置 (Python 3.9+)
params = get_user.cache_parameters()
print(params)  # {'maxsize': 100, 'typed': False}

# __wrapped__: 访问原始未装饰的函数
original_func = get_user.__wrapped__
original_func(999)  # 直接调用，不使用缓存
```

### 可哈希参数要求

`lru_cache` 要求所有参数都是可哈希的（hashable）。

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def process(data):
    return sum(data)

# 可哈希类型：可以正常工作
process((1, 2, 3))      # tuple
process(frozenset([1, 2]))  # frozenset
process("hello")        # str
process(42)             # int

# 不可哈希类型：会报错
# process([1, 2, 3])    # TypeError: unhashable type: 'list'
# process({1, 2, 3})    # TypeError: unhashable type: 'set'
# process({'a': 1})     # TypeError: unhashable type: 'dict'

# 解决方案：转换为可哈希类型
def process_list(data: list):
    return _process_tuple(tuple(data))

@lru_cache(maxsize=128)
def _process_tuple(data: tuple):
    return sum(data)

# 或者使用自定义的可哈希包装器
class HashableDict:
    def __init__(self, d):
        self._d = d
        self._hash = hash(frozenset(d.items()))

    def __hash__(self):
        return self._hash

    def __eq__(self, other):
        return self._d == other._d
```

## 代码示例

### 示例 1：斐波那契数列优化

```python
from functools import lru_cache
import time

# 无缓存版本（指数级时间复杂度）
def fib_naive(n):
    if n < 2:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)

# 有缓存版本（线性时间复杂度）
@lru_cache(maxsize=None)
def fib_cached(n):
    if n < 2:
        return n
    return fib_cached(n - 1) + fib_cached(n - 2)

# 性能对比
n = 35

start = time.time()
result1 = fib_naive(n)
time1 = time.time() - start
print(f"无缓存: fib({n}) = {result1}, 耗时: {time1:.4f}s")

start = time.time()
result2 = fib_cached(n)
time2 = time.time() - start
print(f"有缓存: fib({n}) = {result2}, 耗时: {time2:.6f}s")

print(f"性能提升: {time1/time2:.0f}x")
print(f"缓存统计: {fib_cached.cache_info()}")

# 输出示例：
# 无缓存: fib(35) = 9227465, 耗时: 2.8431s
# 有缓存: fib(35) = 9227465, 耗时: 0.000032s
# 性能提升: 88847x
# 缓存统计: CacheInfo(hits=33, misses=36, maxsize=None, currsize=36)
```

### 示例 2：API 请求缓存

```python
from functools import lru_cache
import time
import json

# 模拟 API 请求
@lru_cache(maxsize=100)
def fetch_user_api(user_id: int) -> dict:
    """从 API 获取用户信息（带缓存）"""
    print(f"[API] 正在请求用户 {user_id} 的数据...")
    time.sleep(0.5)  # 模拟网络延迟
    return {
        "id": user_id,
        "name": f"User{user_id}",
        "email": f"user{user_id}@example.com"
    }

# 第一次请求（缓存 miss）
print("=== 第一次请求 ===")
start = time.time()
user1 = fetch_user_api(101)
print(f"耗时: {time.time() - start:.3f}s")
print(f"用户: {user1}")

# 第二次请求相同用户（缓存 hit）
print("\n=== 第二次请求相同用户 ===")
start = time.time()
user1_again = fetch_user_api(101)
print(f"耗时: {time.time() - start:.6f}s")  # 几乎瞬间

# 请求不同用户
print("\n=== 请求不同用户 ===")
start = time.time()
user2 = fetch_user_api(102)
print(f"耗时: {time.time() - start:.3f}s")

print(f"\n缓存统计: {fetch_user_api.cache_info()}")
```

### 示例 3：配置文件解析缓存

```python
from functools import lru_cache
import json
import os

@lru_cache(maxsize=50)
def load_config(config_path: str) -> dict:
    """加载并缓存配置文件"""
    print(f"[IO] 读取配置文件: {config_path}")

    # 模拟读取配置文件
    # with open(config_path, 'r') as f:
    #     return json.load(f)

    # 模拟配置数据
    return {
        "app_name": "MyApp",
        "version": "1.0.0",
        "debug": True,
        "database": {
            "host": "localhost",
            "port": 5432
        }
    }

# 使用场景
def get_app_name():
    config = load_config("/etc/myapp/config.json")  # 第一次读取
    return config["app_name"]

def get_db_host():
    config = load_config("/etc/myapp/config.json")  # 从缓存返回
    return config["database"]["host"]

def is_debug_mode():
    config = load_config("/etc/myapp/config.json")  # 从缓存返回
    return config["debug"]

print(get_app_name())  # 打印 [IO] 读取配置文件
print(get_db_host())   # 不打印（从缓存）
print(is_debug_mode()) # 不打印（从缓存）
print(f"\n缓存统计: {load_config.cache_info()}")
```

### 示例 4：数学计算缓存

```python
from functools import lru_cache
import math

@lru_cache(maxsize=1000)
def binomial_coefficient(n: int, k: int) -> int:
    """计算二项式系数 C(n, k)"""
    if k == 0 or k == n:
        return 1
    if k > n:
        return 0
    return binomial_coefficient(n - 1, k - 1) + binomial_coefficient(n - 1, k)

@lru_cache(maxsize=500)
def catalan_number(n: int) -> int:
    """计算第 n 个卡塔兰数"""
    if n <= 1:
        return 1
    return binomial_coefficient(2 * n, n) // (n + 1)

# 计算示例
print(f"C(10, 5) = {binomial_coefficient(10, 5)}")
print(f"C(20, 10) = {binomial_coefficient(20, 10)}")
print(f"Catalan(10) = {catalan_number(10)}")

print(f"\n二项式系数缓存: {binomial_coefficient.cache_info()}")
print(f"卡塔兰数缓存: {catalan_number.cache_info()}")
```

### 示例 5：类方法中使用缓存

```python
from functools import lru_cache, cached_property

class DataAnalyzer:
    def __init__(self, data: tuple):
        self.data = data

    # 方法级缓存：需要注意 self 也是参数的一部分
    @lru_cache(maxsize=32)
    def percentile(self, p: float) -> float:
        """计算百分位数"""
        print(f"计算 {p} 百分位...")
        sorted_data = sorted(self.data)
        index = int(len(sorted_data) * p / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    # 使用 cached_property 缓存属性（Python 3.8+）
    @cached_property
    def statistics(self) -> dict:
        """计算统计信息（只计算一次）"""
        print("计算统计信息...")
        return {
            "mean": sum(self.data) / len(self.data),
            "min": min(self.data),
            "max": max(self.data),
            "count": len(self.data)
        }

# 使用示例
analyzer = DataAnalyzer(tuple(range(1, 101)))

# percentile 方法缓存
print(analyzer.percentile(50))  # 计算
print(analyzer.percentile(50))  # 从缓存返回
print(analyzer.percentile(90))  # 计算新的百分位

# cached_property 缓存
print(analyzer.statistics)  # 计算
print(analyzer.statistics)  # 从缓存返回
```

### 示例 6：带超时的缓存

```python
from functools import lru_cache, wraps
import time

def timed_lru_cache(seconds: float, maxsize: int = 128):
    """带超时的 LRU 缓存装饰器"""
    def decorator(func):
        func = lru_cache(maxsize=maxsize)(func)
        func.expiration = time.time() + seconds

        @wraps(func)
        def wrapper(*args, **kwargs):
            if time.time() > func.expiration:
                func.cache_clear()
                func.expiration = time.time() + seconds
            return func(*args, **kwargs)

        wrapper.cache_info = func.cache_info
        wrapper.cache_clear = func.cache_clear

        return wrapper
    return decorator

@timed_lru_cache(seconds=5, maxsize=100)
def get_exchange_rate(currency: str) -> float:
    """获取汇率（缓存 5 秒）"""
    print(f"[API] 查询 {currency} 汇率...")
    rates = {"USD": 7.24, "EUR": 7.89, "GBP": 9.12}
    return rates.get(currency, 1.0)

# 使用示例
print(get_exchange_rate("USD"))  # 查询
print(get_exchange_rate("USD"))  # 从缓存
time.sleep(6)
print(get_exchange_rate("USD"))  # 缓存过期，重新查询
```

## 最佳实践

### 选择合适的缓存大小

```python
from functools import lru_cache

# 小参数空间：使用较小的 maxsize
@lru_cache(maxsize=32)
def get_weekday_name(day: int) -> str:
    """获取星期名称（只有 7 种可能）"""
    names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    return names[day % 7]

# 大参数空间但访问集中：使用中等 maxsize
@lru_cache(maxsize=256)
def get_user_profile(user_id: int) -> dict:
    """获取用户信息（热点用户会被缓存）"""
    return {"id": user_id, "name": f"User{user_id}"}

# 确定性查找表：使用无限缓存
@lru_cache(maxsize=None)
def is_prime(n: int) -> bool:
    """素数判断（结果不变）"""
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True
```

### 监控缓存效率

```python
from functools import lru_cache
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@lru_cache(maxsize=100)
def expensive_query(query: str) -> dict:
    """执行昂贵的查询"""
    return {"result": f"Data for {query}"}

def monitor_cache_health(func, name=""):
    """监控缓存健康状态"""
    info = func.cache_info()
    hit_rate = info.hits / (info.hits + info.misses) * 100 if (info.hits + info.misses) > 0 else 0
    usage = info.currsize / info.maxsize * 100 if info.maxsize else 0

    logger.info(f"[{name}] 缓存命中率: {hit_rate:.1f}%")
    logger.info(f"[{name}] 缓存使用率: {usage:.1f}%")
    logger.info(f"[{name}] 命中/未命中: {info.hits}/{info.misses}")

    # 告警条件
    if hit_rate < 50 and (info.hits + info.misses) > 100:
        logger.warning(f"[{name}] 缓存命中率过低，考虑增加 maxsize")
    if usage > 90:
        logger.warning(f"[{name}] 缓存接近满载，考虑增加 maxsize 或清理")

# 执行一些查询
for i in range(150):
    expensive_query(f"query_{i % 50}")  # 模拟热点查询

monitor_cache_health(expensive_query, "expensive_query")
```

### 定期清理缓存

```python
from functools import lru_cache
import atexit
import threading
import time

@lru_cache(maxsize=1000)
def cached_computation(x: int) -> int:
    return x ** 2

# 方法 1：程序退出时清理
atexit.register(cached_computation.cache_clear)

# 方法 2：定时清理
def periodic_cache_cleanup(func, interval_seconds=3600):
    """定期清理缓存的后台线程"""
    def cleanup():
        while True:
            time.sleep(interval_seconds)
            func.cache_clear()
            print(f"[Cleanup] 已清理 {func.__name__} 的缓存")

    thread = threading.Thread(target=cleanup, daemon=True)
    thread.start()

# 方法 3：基于使用率清理
def smart_cleanup(func, threshold=0.8):
    """当缓存使用率超过阈值时清理"""
    info = func.cache_info()
    if info.maxsize and info.currsize / info.maxsize > threshold:
        func.cache_clear()
        print(f"[Cleanup] {func.__name__} 缓存已满，已清理")
```

### 处理不可哈希参数

```python
from functools import lru_cache
import json

# 方法 1：使用 tuple/frozenset 转换
def process_items(items: list) -> int:
    """处理列表（包装函数）"""
    return _process_items_cached(tuple(items))

@lru_cache(maxsize=128)
def _process_items_cached(items: tuple) -> int:
    """实际的处理逻辑（缓存）"""
    return sum(items)

# 方法 2：使用 JSON 序列化作为键
def make_hashable(obj):
    """将对象转换为可哈希的表示"""
    return json.dumps(obj, sort_keys=True)

def process_dict(data: dict) -> str:
    """处理字典"""
    return _process_dict_cached(make_hashable(data))

@lru_cache(maxsize=128)
def _process_dict_cached(data_json: str) -> str:
    """实际的处理逻辑"""
    data = json.loads(data_json)
    return f"Processed: {data}"

# 使用示例
print(process_items([1, 2, 3, 4, 5]))
print(process_dict({"name": "Alice", "age": 30}))
```

### 线程安全注意事项

```python
from functools import lru_cache
import threading

# lru_cache 本身是线程安全的
@lru_cache(maxsize=100)
def thread_safe_computation(x: int) -> int:
    """可以安全地在多线程中使用"""
    return x ** 2

# 但是，cache_clear() 在并发调用时可能导致问题
# 建议在清理缓存时使用锁
cache_lock = threading.Lock()

def safe_cache_clear(func):
    """线程安全的缓存清理"""
    with cache_lock:
        func.cache_clear()

# 多线程使用示例
def worker(thread_id: int):
    for i in range(100):
        result = thread_safe_computation(i % 20)
        # 不需要额外的锁，lru_cache 内部已处理

threads = [threading.Thread(target=worker, args=(i,)) for i in range(5)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"缓存统计: {thread_safe_computation.cache_info()}")
```

## 常见陷阱

### 陷阱 1：缓存可变对象

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_default_list() -> list:
    """返回一个列表"""
    return [1, 2, 3]

# 问题：返回的是同一个对象的引用
list1 = get_default_list()
list1.append(4)  # 修改了缓存的对象！

list2 = get_default_list()
print(list2)  # [1, 2, 3, 4] - 被意外修改！

# 解决方案：返回副本
@lru_cache(maxsize=128)
def get_default_list_safe() -> list:
    return [1, 2, 3]

def get_list():
    return get_default_list_safe().copy()  # 返回副本
```

### 陷阱 2：在类方法中的实例问题

```python
from functools import lru_cache

class Calculator:
    def __init__(self, multiplier):
        self.multiplier = multiplier

    # 问题：self 也是缓存键的一部分
    @lru_cache(maxsize=128)
    def compute(self, x):
        return x * self.multiplier

calc1 = Calculator(2)
calc2 = Calculator(3)

# calc1 和 calc2 是不同的对象，不会共享缓存
print(calc1.compute(10))  # 20，缓存
print(calc2.compute(10))  # 30，新计算

# 更大的问题：calc1 无法被垃圾回收，因为 lru_cache 持有引用！
# 解决方案：使用 weakref 或避免在实例方法上使用 lru_cache
```

### 陷阱 3：参数顺序影响缓存

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def add(a, b):
    print(f"计算 {a} + {b}")
    return a + b

# 位置参数 vs 关键字参数 = 不同的缓存键
add(1, 2)       # 计算
add(1, 2)       # 缓存命中
add(a=1, b=2)   # 重新计算！（键不同）
add(b=2, a=1)   # 又重新计算！（键不同）

print(add.cache_info())  # misses=3, 虽然结果相同
```

### 陷阱 4：缓存导致的内存泄漏

```python
from functools import lru_cache
import sys

@lru_cache(maxsize=None)  # 无限缓存
def process_large_data(data_id: int) -> bytes:
    """处理大数据"""
    return b"x" * (1024 * 1024)  # 1MB

# 问题：无限缓存会导致内存持续增长
for i in range(1000):
    process_large_data(i)
    if i % 100 == 0:
        print(f"缓存大小: {process_large_data.cache_info().currsize}")
        # 每个缓存项 1MB，1000 项 = 1GB 内存！

# 解决方案：
# 设置合理的 maxsize
# 定期清理缓存
# 使用外部缓存（如 Redis）存储大对象
```

### 陷阱 5：递归函数的缓存清理

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def recursive_fib(n):
    if n < 2:
        return n
    return recursive_fib(n - 1) + recursive_fib(n - 2)

# 计算 fib(100)
result = recursive_fib(100)

# 如果清理缓存后重新计算，中间结果也会丢失
recursive_fib.cache_clear()

# 重新计算会从头开始
result2 = recursive_fib(100)  # 需要重新计算所有中间值
```

## 性能考量

### 缓存开销分析

```python
from functools import lru_cache
import time

def measure_overhead():
    """测量缓存的额外开销"""

    # 简单函数（缓存开销可能大于计算开销）
    def simple_add(a, b):
        return a + b

    @lru_cache(maxsize=128)
    def cached_add(a, b):
        return a + b

    # 复杂函数（缓存带来显著收益）
    def complex_compute(n):
        total = 0
        for i in range(n):
            total += i ** 2
        return total

    @lru_cache(maxsize=128)
    def cached_complex_compute(n):
        total = 0
        for i in range(n):
            total += i ** 2
        return total

    # 测试简单函数
    iterations = 100000

    start = time.time()
    for i in range(iterations):
        simple_add(1, 2)
    print(f"简单函数（无缓存）: {time.time() - start:.4f}s")

    start = time.time()
    for i in range(iterations):
        cached_add(1, 2)
    print(f"简单函数（有缓存）: {time.time() - start:.4f}s")

    # 测试复杂函数
    start = time.time()
    for i in range(1000):
        complex_compute(1000)
    print(f"复杂函数（无缓存）: {time.time() - start:.4f}s")

    start = time.time()
    for i in range(1000):
        cached_complex_compute(1000)
    print(f"复杂函数（有缓存）: {time.time() - start:.4f}s")

measure_overhead()
```

### 何时使用缓存

```python
"""
适合使用缓存的场景:
1. 计算开销大（>1ms）
2. 相同输入产生相同输出（纯函数）
3. 函数会被重复调用
4. 参数空间有限或有热点

不适合使用缓存的场景:
1. 计算非常简单（加减乘除）
2. 结果依赖外部状态（时间、随机数、外部数据）
3. 每次调用参数都不同
4. 返回值很大且需要频繁更新
"""

from functools import lru_cache
import time
import random

# 适合缓存：计算密集型
@lru_cache(maxsize=100)
def compute_factorial(n: int) -> int:
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# 适合缓存：I/O 密集型
@lru_cache(maxsize=50)
def fetch_config(key: str) -> dict:
    # 模拟文件读取或网络请求
    time.sleep(0.1)
    return {"key": key, "value": "some_value"}

# 不适合缓存：结果依赖时间
def get_current_timestamp():
    return time.time()  # 每次都不同

# 不适合缓存：结果依赖随机数
def generate_random_id():
    return random.randint(1, 10000)

# 不适合缓存：参数总是不同
def log_request(request_id: str, timestamp: float):
    return f"Logged: {request_id} at {timestamp}"
```

### 内存 vs 时间权衡

```python
from functools import lru_cache
import sys

@lru_cache(maxsize=None)
def fib_unlimited(n):
    if n < 2:
        return n
    return fib_unlimited(n - 1) + fib_unlimited(n - 2)

@lru_cache(maxsize=100)
def fib_limited(n):
    if n < 2:
        return n
    return fib_limited(n - 1) + fib_limited(n - 2)

# 计算大数
fib_unlimited(1000)
fib_limited(1000)

print(f"无限缓存: {fib_unlimited.cache_info()}")
print(f"有限缓存: {fib_limited.cache_info()}")

# 无限缓存：内存更大，但后续所有值都能快速访问
# 有限缓存：内存固定，但可能需要重新计算一些值

# 估算内存使用
# 每个缓存条目约占用：键的大小 + 值的大小 + 链表指针（约 50-100 字节）
```

## 实战场景

### 场景 1：Web 应用数据库查询缓存

```python
from functools import lru_cache
from typing import Optional
import time

# 模拟数据库
class Database:
    @staticmethod
    def query_user(user_id: int) -> Optional[dict]:
        print(f"[DB] 查询用户 {user_id}")
        time.sleep(0.1)  # 模拟数据库延迟
        if user_id > 0:
            return {"id": user_id, "name": f"User{user_id}", "email": f"user{user_id}@example.com"}
        return None

    @staticmethod
    def query_posts(user_id: int, limit: int = 10) -> list:
        print(f"[DB] 查询用户 {user_id} 的帖子（限制 {limit} 条）")
        time.sleep(0.1)
        return [{"id": i, "title": f"Post {i}", "author_id": user_id} for i in range(limit)]

# 带缓存的数据访问层
class UserRepository:
    @staticmethod
    @lru_cache(maxsize=1000)
    def get_user(user_id: int) -> Optional[dict]:
        """获取用户信息（缓存 1000 个用户）"""
        return Database.query_user(user_id)

    @staticmethod
    @lru_cache(maxsize=500)
    def get_user_posts(user_id: int, limit: int = 10) -> tuple:
        """获取用户帖子（缓存 500 个查询）"""
        # 返回 tuple 因为 list 不可哈希，且避免外部修改
        return tuple(Database.query_posts(user_id, limit))

    @classmethod
    def invalidate_user_cache(cls, user_id: int):
        """当用户数据更新时，需要清除相关缓存"""
        # lru_cache 不支持单独清除某个键，只能全部清除
        cls.get_user.cache_clear()
        cls.get_user_posts.cache_clear()
        print(f"[Cache] 已清除用户 {user_id} 相关缓存")

# 使用示例
repo = UserRepository()

# 第一次请求（缓存 miss）
user = repo.get_user(1)
posts = repo.get_user_posts(1, 5)

# 第二次请求（缓存 hit）
user = repo.get_user(1)      # 不会打印 [DB]
posts = repo.get_user_posts(1, 5)  # 不会打印 [DB]

# 模拟用户更新后清除缓存
repo.invalidate_user_cache(1)
user = repo.get_user(1)  # 重新查询
```

### 场景 2：递归算法优化

```python
from functools import lru_cache

# 动态规划：最长公共子序列
@lru_cache(maxsize=None)
def lcs_length(s1: str, s2: str) -> int:
    """计算两个字符串的最长公共子序列长度"""
    if not s1 or not s2:
        return 0
    if s1[-1] == s2[-1]:
        return 1 + lcs_length(s1[:-1], s2[:-1])
    return max(lcs_length(s1[:-1], s2), lcs_length(s1, s2[:-1]))

# 回溯：N 皇后问题
@lru_cache(maxsize=None)
def count_n_queens(n: int, row: int = 0, cols: int = 0, diag1: int = 0, diag2: int = 0) -> int:
    """计算 N 皇后问题的解的数量"""
    if row == n:
        return 1

    count = 0
    available = ((1 << n) - 1) & ~(cols | diag1 | diag2)

    while available:
        pos = available & (-available)  # 获取最低位的 1
        available &= available - 1      # 移除最低位的 1
        count += count_n_queens(
            n, row + 1,
            cols | pos,
            (diag1 | pos) << 1,
            (diag2 | pos) >> 1
        )

    return count

# 图论：最短路径（Floyd-Warshall 风格）
@lru_cache(maxsize=None)
def shortest_path(graph_tuple: tuple, start: int, end: int, visited: frozenset = frozenset()) -> float:
    """计算最短路径（缓存优化的 DFS）"""
    if start == end:
        return 0
    if start in visited:
        return float('inf')

    # graph_tuple: ((from, to, weight), ...)
    graph = {(f, t): w for f, t, w in graph_tuple}

    min_dist = float('inf')
    new_visited = visited | {start}

    for (f, t), w in graph.items():
        if f == start and t not in visited:
            dist = w + shortest_path(graph_tuple, t, end, new_visited)
            min_dist = min(min_dist, dist)

    return min_dist

# 使用示例
print(f"LCS('ABCDGH', 'AEDFHR') = {lcs_length('ABCDGH', 'AEDFHR')}")
print(f"8 皇后解的数量: {count_n_queens(8)}")
```

### 场景 3：科学计算缓存

```python
from functools import lru_cache
import math

class MathLibrary:
    """数学计算库，带缓存优化"""

    @staticmethod
    @lru_cache(maxsize=10000)
    def factorial(n: int) -> int:
        """阶乘"""
        if n <= 1:
            return 1
        return n * MathLibrary.factorial(n - 1)

    @staticmethod
    @lru_cache(maxsize=10000)
    def binomial(n: int, k: int) -> int:
        """二项式系数 C(n, k)"""
        if k < 0 or k > n:
            return 0
        if k == 0 or k == n:
            return 1
        # 使用帕斯卡三角形递推
        return MathLibrary.binomial(n - 1, k - 1) + MathLibrary.binomial(n - 1, k)

    @staticmethod
    @lru_cache(maxsize=1000)
    def stirling_second(n: int, k: int) -> int:
        """第二类斯特林数 S(n, k)"""
        if n == 0 and k == 0:
            return 1
        if n == 0 or k == 0:
            return 0
        return k * MathLibrary.stirling_second(n - 1, k) + MathLibrary.stirling_second(n - 1, k - 1)

    @staticmethod
    @lru_cache(maxsize=1000)
    def catalan(n: int) -> int:
        """卡塔兰数"""
        if n <= 1:
            return 1
        return MathLibrary.binomial(2 * n, n) // (n + 1)

    @staticmethod
    @lru_cache(maxsize=5000)
    def partition(n: int, k: int = None) -> int:
        """整数分拆数 P(n) 或 P(n, k)"""
        if k is None:
            k = n
        if n == 0:
            return 1
        if n < 0 or k <= 0:
            return 0
        return MathLibrary.partition(n, k - 1) + MathLibrary.partition(n - k, k)

# 使用示例
lib = MathLibrary()

print(f"100! = {lib.factorial(100)}")
print(f"C(50, 25) = {lib.binomial(50, 25)}")
print(f"S(10, 5) = {lib.stirling_second(10, 5)}")
print(f"Catalan(15) = {lib.catalan(15)}")
print(f"P(50) = {lib.partition(50)}")

# 查看各函数的缓存统计
for name in ['factorial', 'binomial', 'stirling_second', 'catalan', 'partition']:
    func = getattr(lib, name)
    print(f"{name}: {func.cache_info()}")
```

## 面试要点

### 常见面试问题

**Q1: lru_cache 的工作原理是什么？**

```
A: lru_cache 基于 LRU（最近最少使用）缓存策略，内部使用：
   1. 哈希表：存储缓存键值对，实现 O(1) 查找
   2. 双向链表：维护访问顺序，最近访问的在尾部，最久未访问的在头部
   当缓存满时，移除链表头部（最久未使用）的元素。
```

**Q2: lru_cache 和 cache 有什么区别？**

```
A:
   - @cache 是 Python 3.9 引入的，等同于 @lru_cache(maxsize=None)
   - @lru_cache 可以设置 maxsize 限制缓存大小
   - @cache 更简洁，适合不需要限制缓存大小的场景
   - 内存敏感场景应使用 lru_cache 并设置合理的 maxsize
```

**Q3: 使用 lru_cache 有什么限制？**

```
A: 主要限制：
   1. 参数必须是可哈希的（不能是 list、dict、set）
   2. 在类实例方法上使用时，self 也是缓存键的一部分，可能导致内存泄漏
   3. 缓存的是返回值的引用，如果返回可变对象可能被外部修改
   4. 不支持单独清除某个缓存键，只能 cache_clear() 清空全部
```

**Q4: 如何处理不可哈希的参数？**

```python
# 方法 1：转换为可哈希类型
def process(items: list):
    return _process_cached(tuple(items))

@lru_cache
def _process_cached(items: tuple):
    return sum(items)

# 方法 2：使用 JSON 序列化
import json

def process_dict(d: dict):
    return _process_cached(json.dumps(d, sort_keys=True))

@lru_cache
def _process_cached(d_json: str):
    return json.loads(d_json)
```

**Q5: lru_cache 是线程安全的吗？**

```
A: 是的，lru_cache 的实现是线程安全的，可以在多线程环境中使用。
   但是 cache_clear() 在并发调用时可能需要额外的同步。
   如果需要保证清理操作的原子性，建议使用锁。
```

### 代码题示例

```python
"""
面试题：实现一个带超时的 LRU 缓存
"""
from functools import lru_cache, wraps
import time

def timed_cache(seconds: float, maxsize: int = 128):
    """带超时的缓存装饰器"""
    def decorator(func):
        # 使用 lru_cache 作为底层缓存
        cached_func = lru_cache(maxsize=maxsize)(func)
        # 记录过期时间
        cached_func.expiration = time.time() + seconds

        @wraps(func)
        def wrapper(*args, **kwargs):
            # 检查是否过期
            if time.time() > cached_func.expiration:
                cached_func.cache_clear()
                cached_func.expiration = time.time() + seconds
            return cached_func(*args, **kwargs)

        # 暴露缓存管理方法
        wrapper.cache_info = cached_func.cache_info
        wrapper.cache_clear = cached_func.cache_clear

        return wrapper
    return decorator

# 测试
@timed_cache(seconds=2, maxsize=100)
def slow_function(x):
    print(f"计算 {x}")
    return x ** 2

print(slow_function(5))  # 计算
print(slow_function(5))  # 从缓存
time.sleep(3)
print(slow_function(5))  # 过期，重新计算
```

## 延伸阅读

### 官方文档

- [functools 模块文档](https://docs.python.org/3/library/functools.html)
- [lru_cache 源码](https://github.com/python/cpython/blob/main/Lib/functools.py)
- [PEP 3111 - Simple lru_cache decorator](https://peps.python.org/pep-3111/)

### 相关工具

- **cachetools**: 更多缓存策略（TTL、LFU、RR 等）
- **aiocache**: 异步缓存库
- **joblib**: 大数据缓存，支持持久化
- **diskcache**: 磁盘缓存
- **Redis/Memcached**: 分布式缓存

### 进阶主题

- 自定义缓存装饰器
- 分布式缓存策略
- 缓存失效机制
- 缓存预热
- 多级缓存架构

### 推荐阅读

- 《Fluent Python》第 7 章：函数装饰器和闭包
- 《Python Cookbook》第 9.4 节：定义一个带可选参数的装饰器
- 《High Performance Python》第 11 章：使用缓存减少计算
