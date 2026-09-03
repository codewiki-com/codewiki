---
title: Python functools 函数工具
description: 掌握 Python functools 模块，包括 lru_cache、partial、reduce、wraps 等高阶函数工具
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - functools
  - 函数式编程
  - 缓存
status: imported
origin: old/src/content/docs/python/functools.zh.md
divergence: 0.211
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 32
  lastUpdated: 2026-01-07
---

`functools` 是 Python 标准库中的一个强大模块，提供了一系列用于操作函数和可调用对象的高阶函数工具。这些工具在函数式编程、性能优化和代码复用方面发挥着重要作用。

## 模块概述

```python
import functools
```

`functools` 模块主要提供以下功能：

| 功能 | 说明 |
|------|------|
| `lru_cache` | 最近最少使用缓存装饰器 |
| `cache` | 简单缓存装饰器（Python 3.9+） |
| `cached_property` | 缓存属性装饰器（Python 3.8+） |
| `partial` | 函数偏应用 |
| `partialmethod` | 方法偏应用 |
| `reduce` | 累积函数 |
| `wraps` | 保留被装饰函数的元信息 |
| `total_ordering` | 自动生成比较方法 |
| `singledispatch` | 单分派泛型函数 |

---

## lru_cache - LRU 缓存装饰器

`lru_cache` 是最常用的 functools 工具之一，它为函数提供了基于 LRU（Least Recently Used，最近最少使用）策略的缓存机制。

### 基本用法

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    """计算斐波那契数列第 n 项"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 使用缓存后，重复计算会直接返回缓存结果
print(fibonacci(100))  # 快速计算出结果
print(fibonacci.cache_info())  # 查看缓存信息
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)
```

### 参数说明

```python
@lru_cache(maxsize=128, typed=False)
def expensive_function(x, y):
    # 复杂计算
    return x ** y

# maxsize: 缓存的最大条目数
#   - 设为 None 表示无限制（等同于 cache 装饰器）
#   - 设为 2 的幂次方性能最佳
#   - 默认值为 128

# typed: 是否区分参数类型
#   - False: f(3) 和 f(3.0) 视为相同调用
#   - True: f(3) 和 f(3.0) 分别缓存
```

### 缓存管理方法

```python
from functools import lru_cache

@lru_cache(maxsize=32)
def get_user_data(user_id):
    """模拟从数据库获取用户数据"""
    print(f"正在查询用户 {user_id}...")
    return {"id": user_id, "name": f"用户{user_id}"}

# 正常调用
get_user_data(1)  # 查询数据库
get_user_data(1)  # 从缓存返回（不打印）

# 查看缓存统计信息
info = get_user_data.cache_info()
print(f"命中次数: {info.hits}")
print(f"未命中次数: {info.misses}")
print(f"当前缓存大小: {info.currsize}")
print(f"最大缓存大小: {info.maxsize}")

# 清除所有缓存
get_user_data.cache_clear()

# 获取缓存参数（Python 3.9+）
print(get_user_data.cache_parameters())
# {'maxsize': 32, 'typed': False}
```

### 实际应用场景

```python
from functools import lru_cache
import time

# 场景1：递归优化
@lru_cache(maxsize=None)
def factorial(n):
    """阶乘计算 - 缓存可显著提升递归性能"""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# 场景2：API 请求缓存
@lru_cache(maxsize=100)
def fetch_exchange_rate(currency_pair: str) -> float:
    """缓存汇率查询结果，减少 API 调用"""
    # 模拟 API 请求
    time.sleep(0.1)
    rates = {"USD_CNY": 7.24, "EUR_CNY": 7.89, "GBP_CNY": 9.12}
    return rates.get(currency_pair, 1.0)

# 场景3：文件解析缓存
@lru_cache(maxsize=50)
def parse_config(file_path: str) -> dict:
    """缓存配置文件解析结果"""
    import json
    with open(file_path, 'r') as f:
        return json.load(f)
```

### 注意事项

```python
from functools import lru_cache

# 错误示例：参数必须是可哈希的
@lru_cache(maxsize=32)
def process_data(data):  # 如果传入 list 会报错
    return sum(data)

# process_data([1, 2, 3])  # TypeError: unhashable type: 'list'

# 正确做法：将可变参数转为不可变类型
@lru_cache(maxsize=32)
def process_data(data: tuple):  # 使用 tuple 代替 list
    return sum(data)

process_data((1, 2, 3))  # 正常工作

# 或者使用自定义的可哈希包装器
def process_list(data: list):
    return _process_data(tuple(data))

@lru_cache(maxsize=32)
def _process_data(data: tuple):
    return sum(data)
```

---

## cache - 简单无限缓存

`cache` 是 Python 3.9 新增的装饰器，等同于 `lru_cache(maxsize=None)`，提供无大小限制的缓存。

```python
from functools import cache

@cache
def calculate_hash(text: str) -> str:
    """缓存哈希计算结果"""
    import hashlib
    print(f"正在计算 '{text}' 的哈希值...")
    return hashlib.sha256(text.encode()).hexdigest()

# 第一次调用会计算
hash1 = calculate_hash("hello")  # 打印计算信息

# 第二次调用直接返回缓存
hash2 = calculate_hash("hello")  # 不打印

print(hash1 == hash2)  # True

# cache 同样支持 cache_info() 和 cache_clear()
print(calculate_hash.cache_info())
calculate_hash.cache_clear()
```

### cache vs lru_cache

```python
from functools import cache, lru_cache

# 以下两种写法等价
@cache
def func1(x):
    return x * 2

@lru_cache(maxsize=None)
def func2(x):
    return x * 2

# 区别：
# - cache 更简洁，适合不需要限制缓存大小的场景
# - lru_cache 提供更多控制选项（maxsize, typed）
# - 内存敏感场景应使用 lru_cache 并设置合理的 maxsize
```

---

## cached_property - 缓存属性

`cached_property`（Python 3.8+）将类方法转换为只计算一次的属性，结果会被缓存。

### 基本用法

```python
from functools import cached_property

class DataProcessor:
    def __init__(self, data):
        self.data = data

    @cached_property
    def statistics(self):
        """复杂统计计算，只执行一次"""
        print("正在计算统计数据...")
        return {
            'sum': sum(self.data),
            'avg': sum(self.data) / len(self.data),
            'max': max(self.data),
            'min': min(self.data)
        }

processor = DataProcessor([1, 2, 3, 4, 5])

# 第一次访问会计算
print(processor.statistics)  # 打印 "正在计算统计数据..."

# 后续访问直接返回缓存值
print(processor.statistics)  # 不打印，直接返回结果
print(processor.statistics['avg'])  # 3.0
```

### 与 @property 的区别

```python
from functools import cached_property
import time

class Report:
    def __init__(self, data):
        self._data = data

    @property
    def standard_property(self):
        """每次访问都会重新计算"""
        time.sleep(0.1)  # 模拟耗时操作
        return sum(self._data)

    @cached_property
    def cached_prop(self):
        """只计算一次，结果被缓存"""
        time.sleep(0.1)  # 模拟耗时操作
        return sum(self._data)

report = Report([1, 2, 3, 4, 5])

# standard_property 每次访问都耗时
start = time.time()
for _ in range(10):
    _ = report.standard_property
print(f"@property 耗时: {time.time() - start:.2f}s")  # 约 1.0s

# cached_property 只有第一次耗时
start = time.time()
for _ in range(10):
    _ = report.cached_prop
print(f"@cached_property 耗时: {time.time() - start:.2f}s")  # 约 0.1s
```

### 清除缓存

```python
from functools import cached_property

class Config:
    def __init__(self, path):
        self.path = path

    @cached_property
    def settings(self):
        """加载配置文件"""
        print(f"正在加载配置文件: {self.path}")
        # 模拟读取配置
        return {"debug": True, "port": 8080}

config = Config("/etc/app/config.json")
print(config.settings)  # 加载配置

# 清除缓存（通过删除实例属性）
del config.settings

# 再次访问会重新加载
print(config.settings)  # 重新加载配置
```

---

## partial - 函数偏应用

`partial` 用于固定函数的部分参数，创建一个新的可调用对象。

### 基本用法

```python
from functools import partial

def power(base, exponent):
    """计算 base 的 exponent 次幂"""
    return base ** exponent

# 创建平方函数（固定 exponent=2）
square = partial(power, exponent=2)
print(square(5))   # 25
print(square(10))  # 100

# 创建立方函数（固定 exponent=3）
cube = partial(power, exponent=3)
print(cube(2))  # 8
print(cube(3))  # 27

# 也可以固定位置参数
double = partial(power, 2)  # 固定 base=2
print(double(8))   # 2^8 = 256
print(double(10))  # 2^10 = 1024
```

### 实际应用场景

```python
from functools import partial
import json

# 场景1：自定义 JSON 编码器
pretty_json = partial(json.dumps, indent=2, ensure_ascii=False)
data = {"名称": "Python", "版本": 3.12}
print(pretty_json(data))

# 场景2：日志函数
def log(level, message, timestamp=None):
    from datetime import datetime
    ts = timestamp or datetime.now().isoformat()
    print(f"[{ts}] [{level}] {message}")

log_info = partial(log, "INFO")
log_error = partial(log, "ERROR")
log_debug = partial(log, "DEBUG")

log_info("应用程序启动")
log_error("连接失败")

# 场景3：回调函数
def on_button_click(button_id, event_type, callback_data=None):
    print(f"按钮 {button_id} 触发了 {event_type} 事件")

# 为不同按钮创建专用回调
submit_handler = partial(on_button_click, "submit", "click")
cancel_handler = partial(on_button_click, "cancel", "click")
```

### 查看 partial 对象信息

```python
from functools import partial

def greet(greeting, name, punctuation="!"):
    return f"{greeting}, {name}{punctuation}"

hello = partial(greet, "Hello")
hello_world = partial(hello, "World")

# 查看原始函数
print(hello.func)  # <function greet at ...>

# 查看固定的位置参数
print(hello.args)        # ('Hello',)
print(hello_world.args)  # ('Hello', 'World')

# 查看固定的关键字参数
formal_hello = partial(greet, "Hello", punctuation=".")
print(formal_hello.keywords)  # {'punctuation': '.'}
```

### 与 lambda 的比较

```python
from functools import partial

def multiply(x, y):
    return x * y

# 使用 partial
double_partial = partial(multiply, 2)

# 使用 lambda
double_lambda = lambda y: multiply(2, y)

# 两者功能相同
print(double_partial(5))  # 10
print(double_lambda(5))   # 10

# 区别：
# partial 对象支持序列化，lambda 不支持
# partial 保留了原函数信息（func, args, keywords）
# partial 在某些情况下性能更好
# lambda 更灵活，可以进行复杂的参数转换
```

---

## partialmethod - 方法偏应用

`partialmethod` 是 `partial` 的方法版本，用于在类中创建预填充参数的方法。

```python
from functools import partialmethod

class Connection:
    def __init__(self):
        self._connected = False

    def set_state(self, state, message=""):
        """设置连接状态"""
        self._connected = state
        if message:
            print(message)
        return self._connected

    # 使用 partialmethod 创建便捷方法
    connect = partialmethod(set_state, True, "已建立连接")
    disconnect = partialmethod(set_state, False, "已断开连接")

conn = Connection()
print(conn._connected)  # False

conn.connect()          # 打印: 已建立连接
print(conn._connected)  # True

conn.disconnect()       # 打印: 已断开连接
print(conn._connected)  # False
```

### 更复杂的示例

```python
from functools import partialmethod

class HttpClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def request(self, method, endpoint, data=None, headers=None):
        """发送 HTTP 请求"""
        url = f"{self.base_url}{endpoint}"
        print(f"{method} {url}")
        if data:
            print(f"  Data: {data}")
        if headers:
            print(f"  Headers: {headers}")
        return {"status": 200, "url": url}

    # 创建便捷的 HTTP 方法
    get = partialmethod(request, "GET")
    post = partialmethod(request, "POST")
    put = partialmethod(request, "PUT")
    delete = partialmethod(request, "DELETE")
    patch = partialmethod(request, "PATCH")

# 使用
client = HttpClient("https://api.example.com")
client.get("/users")
client.post("/users", data={"name": "张三"})
client.delete("/users/1")
```

---

## reduce - 累积函数

`reduce` 将一个二元函数累积地应用到序列的元素上，从左到右，将序列归约为单个值。

### 基本用法

```python
from functools import reduce

# 计算列表元素的乘积
numbers = [1, 2, 3, 4, 5]
product = reduce(lambda x, y: x * y, numbers)
print(product)  # 120 (1*2*3*4*5)

# 等价于以下过程：
# ((((1 * 2) * 3) * 4) * 5)
```

### 工作原理图解

```python
from functools import reduce

def my_reduce(func, iterable, initializer=None):
    """reduce 的简化实现，展示其工作原理"""
    it = iter(iterable)
    if initializer is None:
        try:
            value = next(it)
        except StopIteration:
            raise TypeError("reduce() of empty sequence with no initial value")
    else:
        value = initializer

    for element in it:
        value = func(value, element)
    return value

# 使用初始值
numbers = [1, 2, 3, 4]
result = reduce(lambda x, y: x + y, numbers, 10)
print(result)  # 20 (10+1+2+3+4)
```

### 常见用法示例

```python
from functools import reduce
from operator import add, mul, and_, or_

# 求和（虽然有内置 sum，但展示原理）
numbers = [1, 2, 3, 4, 5]
total = reduce(add, numbers)
print(f"求和: {total}")  # 15

# 求最大值
values = [3, 1, 4, 1, 5, 9, 2, 6]
maximum = reduce(lambda x, y: x if x > y else y, values)
print(f"最大值: {maximum}")  # 9

# 列表扁平化
nested = [[1, 2], [3, 4], [5, 6]]
flat = reduce(lambda x, y: x + y, nested)
print(f"扁平化: {flat}")  # [1, 2, 3, 4, 5, 6]

# 字典合并
dicts = [{'a': 1}, {'b': 2}, {'c': 3}]
merged = reduce(lambda x, y: {**x, **y}, dicts)
print(f"合并字典: {merged}")  # {'a': 1, 'b': 2, 'c': 3}

# 逻辑运算
bools = [True, True, False, True]
all_true = reduce(and_, bools)
any_true = reduce(or_, bools)
print(f"全为真: {all_true}")  # False
print(f"存在真: {any_true}")  # True

# 组合函数
def compose(*functions):
    """函数组合：从右到左依次应用函数"""
    return reduce(lambda f, g: lambda x: f(g(x)), functions)

# f(g(h(x)))
pipeline = compose(str.upper, str.strip, lambda s: s.replace('-', ' '))
print(pipeline("  hello-world  "))  # "HELLO WORLD"
```

### 实际应用场景

```python
from functools import reduce

# 场景1：计算阶乘
def factorial(n):
    return reduce(lambda x, y: x * y, range(1, n + 1), 1)

print(factorial(5))  # 120

# 场景2：深度访问嵌套字典
def deep_get(dictionary, keys):
    """安全地获取嵌套字典的值"""
    return reduce(
        lambda d, key: d.get(key, {}) if isinstance(d, dict) else {},
        keys,
        dictionary
    )

config = {
    'database': {
        'connection': {
            'host': 'localhost',
            'port': 5432
        }
    }
}

print(deep_get(config, ['database', 'connection', 'host']))  # 'localhost'
print(deep_get(config, ['database', 'missing', 'key']))      # {}

# 场景3：管道处理
def pipeline(*steps):
    """创建数据处理管道"""
    def execute(data):
        return reduce(lambda d, step: step(d), steps, data)
    return execute

# 数据处理流程
process = pipeline(
    lambda x: x.strip(),
    lambda x: x.lower(),
    lambda x: x.replace(' ', '_'),
    lambda x: f"processed_{x}"
)

print(process("  Hello World  "))  # "processed_hello_world"
```

---

## wraps - 装饰器元信息保留

`wraps` 用于在编写装饰器时保留被装饰函数的元信息（如 `__name__`、`__doc__`、`__annotations__` 等）。

### 问题演示

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        """这是包装函数的文档"""
        print("调用前")
        result = func(*args, **kwargs)
        print("调用后")
        return result
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """问候某人"""
    return f"Hello, {name}!"

# 元信息丢失了！
print(greet.__name__)  # 'wrapper'（应该是 'greet'）
print(greet.__doc__)   # '这是包装函数的文档'（应该是 '问候某人'）
```

### 使用 wraps 解决

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)  # 保留原函数的元信息
    def wrapper(*args, **kwargs):
        """这是包装函数的文档"""
        print("调用前")
        result = func(*args, **kwargs)
        print("调用后")
        return result
    return wrapper

@my_decorator
def greet(name: str) -> str:
    """问候某人"""
    return f"Hello, {name}!"

# 元信息保留了！
print(greet.__name__)         # 'greet'
print(greet.__doc__)          # '问候某人'
print(greet.__annotations__)  # {'name': <class 'str'>, 'return': <class 'str'>}
print(greet.__wrapped__)      # 原始的 greet 函数
```

### 完整的装饰器模板

```python
from functools import wraps
import time

def timing_decorator(func):
    """测量函数执行时间的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} 执行时间: {end - start:.4f} 秒")
        return result
    return wrapper

def retry_decorator(max_attempts=3, delay=1):
    """支持重试的装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    print(f"第 {attempt} 次尝试失败: {e}")
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator

@timing_decorator
@retry_decorator(max_attempts=3, delay=0.5)
def fetch_data(url: str) -> dict:
    """从指定 URL 获取数据"""
    import random
    if random.random() < 0.7:
        raise ConnectionError("网络连接失败")
    return {"status": "success", "url": url}

# 元信息仍然正确
print(fetch_data.__name__)  # 'fetch_data'
print(fetch_data.__doc__)   # '从指定 URL 获取数据'
```

### 访问原始函数

```python
from functools import wraps

def logged(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@logged
def add(a, b):
    """两数相加"""
    return a + b

# 调用装饰后的函数
print(add(1, 2))  # 打印日志并返回 3

# 访问原始函数（绕过装饰器）
print(add.__wrapped__(1, 2))  # 直接返回 3，不打印日志
```

---

## total_ordering - 自动生成比较方法

`total_ordering` 装饰器可以根据类中定义的 `__eq__` 和一个比较方法（`__lt__`、`__le__`、`__gt__`、`__ge__` 之一）自动生成其他所有比较方法。

### 基本用法

```python
from functools import total_ordering

@total_ordering
class Student:
    def __init__(self, name, score):
        self.name = name
        self.score = score

    def __eq__(self, other):
        if not isinstance(other, Student):
            return NotImplemented
        return self.score == other.score

    def __lt__(self, other):
        if not isinstance(other, Student):
            return NotImplemented
        return self.score < other.score

    def __repr__(self):
        return f"Student({self.name!r}, {self.score})"

# 创建学生对象
alice = Student("Alice", 85)
bob = Student("Bob", 90)
charlie = Student("Charlie", 85)

# 所有比较操作都可用
print(alice < bob)    # True
print(alice <= bob)   # True（自动生成）
print(alice > bob)    # False（自动生成）
print(alice >= bob)   # False（自动生成）
print(alice == charlie)  # True
print(alice != bob)   # True

# 可以排序
students = [bob, alice, charlie]
print(sorted(students))  # 按分数排序
```

### 实际应用示例

```python
from functools import total_ordering
from datetime import datetime

@total_ordering
class Version:
    """语义版本号类"""
    def __init__(self, version_string):
        parts = version_string.split('.')
        self.major = int(parts[0])
        self.minor = int(parts[1]) if len(parts) > 1 else 0
        self.patch = int(parts[2]) if len(parts) > 2 else 0

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor, self.patch) == \
               (other.major, other.minor, other.patch)

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor, self.patch) < \
               (other.major, other.minor, other.patch)

    def __repr__(self):
        return f"{self.major}.{self.minor}.{self.patch}"

# 版本比较
v1 = Version("1.0.0")
v2 = Version("1.2.0")
v3 = Version("2.0.0")

print(v1 < v2 < v3)  # True
print(v2 >= v1)      # True

# 找出最新版本
versions = [Version("1.9.0"), Version("2.1.0"), Version("1.10.0")]
print(f"最新版本: {max(versions)}")  # 2.1.0


@total_ordering
class Task:
    """按优先级和创建时间排序的任务"""
    PRIORITY = {'high': 3, 'medium': 2, 'low': 1}

    def __init__(self, name, priority='medium'):
        self.name = name
        self.priority = priority
        self.created_at = datetime.now()

    def __eq__(self, other):
        if not isinstance(other, Task):
            return NotImplemented
        return (self.PRIORITY[self.priority], self.created_at) == \
               (self.PRIORITY[other.priority], other.created_at)

    def __gt__(self, other):  # 优先级高的排前面
        if not isinstance(other, Task):
            return NotImplemented
        # 优先级相同时，创建时间早的排前面
        return (self.PRIORITY[self.priority], -self.created_at.timestamp()) > \
               (self.PRIORITY[other.priority], -other.created_at.timestamp())

    def __repr__(self):
        return f"Task({self.name!r}, priority={self.priority!r})"
```

---

## singledispatch - 单分派泛型函数

`singledispatch` 装饰器用于创建单分派泛型函数，根据第一个参数的类型分派到不同的实现。

### 基本用法

```python
from functools import singledispatch

@singledispatch
def process(data):
    """默认处理函数"""
    raise NotImplementedError(f"不支持的类型: {type(data)}")

@process.register(int)
def _(data):
    """处理整数"""
    return f"整数: {data * 2}"

@process.register(str)
def _(data):
    """处理字符串"""
    return f"字符串: {data.upper()}"

@process.register(list)
def _(data):
    """处理列表"""
    return f"列表长度: {len(data)}"

# 根据参数类型自动分派
print(process(42))           # 整数: 84
print(process("hello"))      # 字符串: HELLO
print(process([1, 2, 3]))    # 列表长度: 3
# print(process({1, 2, 3}))  # NotImplementedError
```

### 使用类型注解注册

```python
from functools import singledispatch
from typing import Union
from decimal import Decimal

@singledispatch
def format_number(value) -> str:
    """格式化数字"""
    return str(value)

@format_number.register
def _(value: int) -> str:
    """格式化整数，添加千分位分隔符"""
    return f"{value:,}"

@format_number.register
def _(value: float) -> str:
    """格式化浮点数，保留两位小数"""
    return f"{value:,.2f}"

@format_number.register
def _(value: Decimal) -> str:
    """格式化 Decimal，显示精确值"""
    return f"Decimal({value})"

print(format_number(1234567))        # 1,234,567
print(format_number(1234567.891))    # 1,234,567.89
print(format_number(Decimal("0.1"))) # Decimal(0.1)
```

### 多类型注册

```python
from functools import singledispatch
from collections.abc import Mapping, Sequence

@singledispatch
def serialize(obj):
    """序列化对象为字符串"""
    return repr(obj)

# 为多个类型注册同一个处理函数
@serialize.register(int)
@serialize.register(float)
def _(obj):
    return f"Number: {obj}"

@serialize.register(str)
def _(obj):
    return f"String: '{obj}'"

# 使用抽象基类
@serialize.register(Mapping)
def _(obj):
    items = ", ".join(f"{k}: {serialize(v)}" for k, v in obj.items())
    return "{" + items + "}"

@serialize.register(Sequence)
def _(obj):
    if isinstance(obj, str):  # str 也是 Sequence，需要特殊处理
        return serialize.dispatch(str)(obj)
    items = ", ".join(serialize(item) for item in obj)
    return "[" + items + "]"

print(serialize(42))                    # Number: 42
print(serialize("hello"))               # String: 'hello'
print(serialize([1, 2, 3]))            # [Number: 1, Number: 2, Number: 3]
print(serialize({"a": 1, "b": "x"}))   # {a: Number: 1, b: String: 'x'}
```

### 查看和管理分派

```python
from functools import singledispatch

@singledispatch
def describe(obj):
    return f"未知对象: {type(obj).__name__}"

@describe.register(int)
def _(obj):
    return f"这是一个整数: {obj}"

@describe.register(str)
def _(obj):
    return f"这是一个字符串: '{obj}'"

# 查看特定类型的实现
print(describe.dispatch(int))   # 返回处理 int 的函数
print(describe.dispatch(str))   # 返回处理 str 的函数
print(describe.dispatch(list))  # 返回默认函数（list 未注册）

# 查看所有注册的类型
print(describe.registry.keys())
# dict_keys([<class 'object'>, <class 'int'>, <class 'str'>])

# 直接调用特定类型的处理函数
int_handler = describe.dispatch(int)
print(int_handler(100))  # 这是一个整数: 100
```

### singledispatchmethod - 方法版本

```python
from functools import singledispatchmethod

class Formatter:
    """格式化器类"""

    @singledispatchmethod
    def format(self, value):
        """默认格式化方法"""
        return str(value)

    @format.register(int)
    def _(self, value):
        return f"整数 → {value:,}"

    @format.register(float)
    def _(self, value):
        return f"浮点数 → {value:.4f}"

    @format.register(list)
    def _(self, value):
        return f"列表 → [{', '.join(str(x) for x in value)}]"

formatter = Formatter()
print(formatter.format(1234567))     # 整数 → 1,234,567
print(formatter.format(3.14159))     # 浮点数 → 3.1416
print(formatter.format([1, 2, 3]))   # 列表 → [1, 2, 3]
print(formatter.format({"key": 1}))  # {'key': 1}
```

---

## 综合示例

以下是一个综合运用多个 functools 工具的实际示例：

```python
from functools import (
    lru_cache, cached_property, partial,
    wraps, singledispatch, reduce
)
from typing import List, Dict, Any
import time
import json

# 使用 singledispatch 创建数据验证器
@singledispatch
def validate(data) -> bool:
    """验证数据"""
    return True

@validate.register(str)
def _(data: str) -> bool:
    return len(data) > 0

@validate.register(int)
def _(data: int) -> bool:
    return data >= 0

@validate.register(list)
def _(data: list) -> bool:
    return all(validate(item) for item in data)


# 使用 wraps 创建日志装饰器
def log_call(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"[LOG] 调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper


# 使用 lru_cache 优化 API 调用
class DataService:
    def __init__(self, api_base: str):
        self.api_base = api_base
        self._request_count = 0

    @cached_property
    def config(self) -> Dict:
        """懒加载配置（只加载一次）"""
        print("加载服务配置...")
        return {"timeout": 30, "retry": 3}

    @lru_cache(maxsize=100)
    def fetch_user(self, user_id: int) -> Dict:
        """缓存用户数据"""
        self._request_count += 1
        print(f"请求用户数据: {user_id}")
        return {"id": user_id, "name": f"User{user_id}"}

    @log_call
    def process_users(self, user_ids: List[int]) -> List[Dict]:
        """处理多个用户"""
        return [self.fetch_user(uid) for uid in user_ids]


# 使用 partial 创建特化函数
def format_output(data: Any, indent: int = 2, prefix: str = "") -> str:
    """格式化输出"""
    json_str = json.dumps(data, indent=indent, ensure_ascii=False)
    if prefix:
        lines = json_str.split('\n')
        json_str = '\n'.join(prefix + line for line in lines)
    return json_str

# 创建特化的格式化函数
compact_format = partial(format_output, indent=None)
debug_format = partial(format_output, indent=4, prefix="DEBUG: ")


# 使用 reduce 进行数据聚合
def aggregate_stats(users: List[Dict]) -> Dict:
    """聚合用户统计信息"""
    return reduce(
        lambda acc, user: {
            'count': acc['count'] + 1,
            'ids': acc['ids'] + [user['id']]
        },
        users,
        {'count': 0, 'ids': []}
    )


# 演示
if __name__ == "__main__":
    # 验证数据
    print("=== 数据验证 ===")
    print(validate("hello"))      # True
    print(validate(-1))           # False
    print(validate([1, 2, "ok"])) # True

    # 服务调用
    print("\n=== 服务调用 ===")
    service = DataService("https://api.example.com")

    # 第一次访问 config（触发加载）
    print(service.config)
    # 第二次访问（从缓存返回）
    print(service.config)

    # 处理用户（带缓存）
    result = service.process_users([1, 2, 1, 3, 2])
    print(f"请求次数: {service._request_count}")  # 3（去重）

    # 格式化输出
    print("\n=== 格式化输出 ===")
    data = {"用户": "张三", "分数": 95}
    print("紧凑格式:", compact_format(data))
    print(debug_format(data))

    # 统计聚合
    print("\n=== 统计聚合 ===")
    users = [{"id": 1}, {"id": 2}, {"id": 3}]
    stats = aggregate_stats(users)
    print(stats)  # {'count': 3, 'ids': [1, 2, 3]}
```

---

## 性能优化建议

### 合理使用缓存

```python
from functools import lru_cache

# 好的做法：缓存计算密集型函数
@lru_cache(maxsize=1000)
def compute_expensive(x, y):
    # 复杂计算
    return x ** y

# 避免：缓存简单操作
# @lru_cache  # 不推荐
def add(a, b):
    return a + b  # 缓存开销大于计算开销
```

### 选择合适的缓存大小

```python
from functools import lru_cache

# 根据实际使用模式选择 maxsize
# - 小：适合参数空间有限的函数
# - 大/None：适合需要长期缓存的计算

@lru_cache(maxsize=32)  # 小缓存，快速淘汰
def frequent_small_range(x):
    return x * 2

@lru_cache(maxsize=None)  # 无限缓存，适合确定性查找
def lookup_table(key):
    # 查找表通常不需要淘汰
    return expensive_lookup(key)
```

### 定期清理缓存

```python
from functools import lru_cache
import atexit

@lru_cache(maxsize=1000)
def cached_function(x):
    return x ** 2

# 程序退出时清理（可选）
atexit.register(cached_function.cache_clear)

# 或定期清理
def periodic_cleanup():
    info = cached_function.cache_info()
    if info.currsize > 800:  # 达到 80% 容量时清理
        cached_function.cache_clear()
```

---

## 总结

`functools` 模块提供了强大的函数工具集：

| 工具 | 用途 | 适用场景 |
|------|------|----------|
| `lru_cache` | LRU 缓存 | 递归优化、API 缓存、计算密集型函数 |
| `cache` | 无限缓存 | 不需要限制大小的缓存场景 |
| `cached_property` | 属性缓存 | 延迟计算的类属性 |
| `partial` | 函数偏应用 | 固定参数、创建回调、简化 API |
| `partialmethod` | 方法偏应用 | 类中的便捷方法 |
| `reduce` | 累积归约 | 列表求积、字典合并、管道处理 |
| `wraps` | 保留元信息 | 编写装饰器时必用 |
| `total_ordering` | 自动比较方法 | 需要完整比较支持的类 |
| `singledispatch` | 单分派 | 根据类型分发处理逻辑 |

掌握这些工具能够：
- 提升代码的可读性和复用性
- 优化程序性能（特别是缓存相关工具）
- 实现优雅的函数式编程风格
- 减少样板代码的编写

在实际开发中，根据具体需求选择合适的工具，可以让你的 Python 代码更加简洁、高效和 Pythonic。
