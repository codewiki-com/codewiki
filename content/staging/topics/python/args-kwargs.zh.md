---
title: Python *args 与 **kwargs 完全指南
description: 深入理解 Python 函数参数：仅位置参数、仅关键字参数、*args、**kwargs、参数解包与函数签名设计
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 函数参数
  - args
  - kwargs
  - 解包
  - 函数签名
status: imported
origin: old/src/content/docs/python/args-kwargs.zh.md
divergence: 0.131
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: 函数进阶
  order: 15
  lastUpdated: 2026-01-07
---

在 Python 中，`*args` 和 `**kwargs` 是两个强大的语法特性，它们让函数能够接受任意数量的参数。掌握这些特性对于编写灵活、可扩展的 Python 代码至关重要。

## 概念解释

### 什么是 *args 和 **kwargs

- **`*args`**：允许函数接受任意数量的**位置参数**（positional arguments），这些参数会被收集到一个**元组**中
- **`**kwargs`**：允许函数接受任意数量的**关键字参数**（keyword arguments），这些参数会被收集到一个**字典**中

这两个名称中的 `args` 和 `kwargs` 只是约定俗成的命名，真正起作用的是 `*` 和 `**` 操作符。你完全可以使用其他名称，如 `*values` 或 `**options`。

### 历史背景

Python 的可变参数特性自早期版本就已存在。`*args` 语法在 Python 1.x 时代就已经引入，而 Python 3.0 后又添加了仅位置参数（Python 3.8）和仅关键字参数等更精细的控制方式，使函数签名设计更加灵活和明确。

### 解决什么问题

1. **参数数量不确定**：当函数需要处理可变数量的输入时
2. **函数包装器**：装饰器和代理函数需要转发任意参数
3. **API 向后兼容**：在不破坏现有调用的情况下扩展函数功能
4. **配置对象构建**：接收任意配置选项

## 核心原理

### 参数打包与解包机制

Python 使用 `*` 和 `**` 操作符实现参数的打包（packing）和解包（unpacking）：

```python
# 打包：收集多个参数到一个容器
def pack_example(*args, **kwargs):
    print(f"args 类型: {type(args)}, 值: {args}")
    print(f"kwargs 类型: {type(kwargs)}, 值: {kwargs}")

pack_example(1, 2, 3, name="Alice", age=25)
# 输出:
# args 类型: <class 'tuple'>, 值: (1, 2, 3)
# kwargs 类型: <class 'dict'>, 值: {'name': 'Alice', 'age': 25}
```

```python
# 解包：将容器展开为多个参数
def unpack_example(a, b, c):
    return a + b + c

numbers = [1, 2, 3]
result = unpack_example(*numbers)  # 解包列表
print(result)  # 输出: 6

config = {'a': 10, 'b': 20, 'c': 30}
result = unpack_example(**config)  # 解包字典
print(result)  # 输出: 60
```

### 函数参数的解析顺序

Python 按照以下顺序解析函数参数：

1. **位置参数（Positional Arguments）**
2. **\*args（可变位置参数）**
3. **仅关键字参数（Keyword-Only Arguments）**
4. **\*\*kwargs（可变关键字参数）**

```python
def full_signature(pos1, pos2, *args, kw_only1, kw_only2="default", **kwargs):
    """展示完整的参数签名"""
    print(f"位置参数: pos1={pos1}, pos2={pos2}")
    print(f"*args: {args}")
    print(f"仅关键字参数: kw_only1={kw_only1}, kw_only2={kw_only2}")
    print(f"**kwargs: {kwargs}")

full_signature(1, 2, 3, 4, 5, kw_only1="必须", extra="额外参数")
# 输出:
# 位置参数: pos1=1, pos2=2
# *args: (3, 4, 5)
# 仅关键字参数: kw_only1=必须, kw_only2=default
# **kwargs: {'extra': '额外参数'}
```

### 仅位置参数（Python 3.8+）

使用 `/` 标记仅位置参数，这些参数必须按位置传递，不能使用关键字：

```python
def positional_only(a, b, /, c, d):
    """
    a, b: 仅位置参数（/ 之前）
    c, d: 普通参数（可以是位置或关键字）
    """
    return a + b + c + d

# 正确调用
print(positional_only(1, 2, 3, 4))      # 全部位置参数
print(positional_only(1, 2, c=3, d=4))  # c, d 使用关键字

# 错误调用
# positional_only(a=1, b=2, c=3, d=4)  # TypeError: a, b 不能使用关键字
```

### 仅关键字参数

`*` 或 `*args` 之后的参数必须使用关键字传递：

```python
def keyword_only(a, b, *, c, d):
    """
    a, b: 普通参数
    c, d: 仅关键字参数（* 之后）
    """
    return a + b + c + d

# 正确调用
print(keyword_only(1, 2, c=3, d=4))

# 错误调用
# keyword_only(1, 2, 3, 4)  # TypeError: c, d 必须使用关键字
```

### 完整的参数顺序示例

```python
def complete_example(
    pos_only1, pos_only2, /,      # 仅位置参数
    normal1, normal2,              # 普通参数
    *args,                         # 可变位置参数
    kw_only1, kw_only2="默认值",   # 仅关键字参数
    **kwargs                       # 可变关键字参数
):
    """
    展示 Python 函数参数的完整顺序
    """
    print(f"仅位置参数: {pos_only1}, {pos_only2}")
    print(f"普通参数: {normal1}, {normal2}")
    print(f"*args: {args}")
    print(f"仅关键字参数: kw_only1={kw_only1}, kw_only2={kw_only2}")
    print(f"**kwargs: {kwargs}")

complete_example(
    1, 2,                          # pos_only1, pos_only2
    3, 4,                          # normal1, normal2
    5, 6, 7,                       # *args
    kw_only1="必须参数",            # kw_only1
    extra1="附加1", extra2="附加2"  # **kwargs
)
```

## 核心要点

### *args 的关键特性

| 特性 | 说明 |
|------|------|
| 类型 | 元组（tuple） |
| 可迭代 | 支持 for 循环遍历 |
| 不可变 | 收集后的参数不能修改 |
| 位置 | 必须在普通位置参数之后 |
| 命名 | `*args` 是约定，可用任意名称如 `*values` |

### **kwargs 的关键特性

| 特性 | 说明 |
|------|------|
| 类型 | 字典（dict） |
| 可迭代 | 支持 `.keys()`, `.values()`, `.items()` |
| 可变 | 收集后的参数可以修改 |
| 位置 | 必须在所有其他参数之后 |
| 命名 | `**kwargs` 是约定，可用任意名称如 `**options` |

### 参数类型对照表

| 参数类型 | 语法示例 | 调用方式 |
|----------|----------|----------|
| 仅位置参数 | `def f(a, b, /)` | `f(1, 2)` |
| 普通参数 | `def f(a, b)` | `f(1, 2)` 或 `f(a=1, b=2)` |
| 默认参数 | `def f(a, b=10)` | `f(1)` 或 `f(1, 20)` |
| 可变位置参数 | `def f(*args)` | `f(1, 2, 3, ...)` |
| 仅关键字参数 | `def f(*, a, b)` | `f(a=1, b=2)` |
| 可变关键字参数 | `def f(**kwargs)` | `f(x=1, y=2, ...)` |

## 代码示例

### 基础用法：*args

```python
def calculate_sum(*numbers):
    """计算任意数量数字的和"""
    total = 0
    for num in numbers:
        total += num
    return total

# 不同数量的参数调用
print(calculate_sum())           # 输出: 0
print(calculate_sum(1))          # 输出: 1
print(calculate_sum(1, 2, 3))    # 输出: 6
print(calculate_sum(1, 2, 3, 4, 5))  # 输出: 15

# 使用内置 sum 简化
def calculate_sum_v2(*numbers):
    return sum(numbers)
```

### 基础用法：**kwargs

```python
def create_profile(**user_info):
    """创建用户配置文件"""
    profile = {
        'created_at': '2024-01-01',
        'status': 'active'
    }
    profile.update(user_info)
    return profile

# 传入任意关键字参数
user = create_profile(
    name="张三",
    age=28,
    city="北京",
    occupation="工程师"
)
print(user)
# 输出: {'created_at': '2024-01-01', 'status': 'active',
#        'name': '张三', 'age': 28, 'city': '北京', 'occupation': '工程师'}
```

### 组合使用 *args 和 **kwargs

```python
def log_function_call(func_name, *args, **kwargs):
    """记录函数调用日志"""
    args_str = ', '.join(repr(arg) for arg in args)
    kwargs_str = ', '.join(f"{k}={v!r}" for k, v in kwargs.items())
    all_args = ', '.join(filter(None, [args_str, kwargs_str]))

    print(f"调用: {func_name}({all_args})")

log_function_call("process_data", 100, 200, format="json", compress=True)
# 输出: 调用: process_data(100, 200, format='json', compress=True)
```

### 参数解包实战

```python
def connect(host, port, username, password, timeout=30):
    """模拟数据库连接"""
    return f"连接到 {username}@{host}:{port}，超时: {timeout}秒"

# 从元组解包位置参数
connection_tuple = ("localhost", 5432, "admin", "secret")
print(connect(*connection_tuple))

# 从字典解包关键字参数
connection_dict = {
    "host": "192.168.1.100",
    "port": 3306,
    "username": "root",
    "password": "mysql123",
    "timeout": 60
}
print(connect(**connection_dict))

# 混合解包
base_config = ("db.example.com", 5432)
auth_config = {"username": "app_user", "password": "app_pass"}
print(connect(*base_config, **auth_config, timeout=120))
```

### 函数包装器模式

```python
def trace_calls(func):
    """追踪函数调用的装饰器"""
    def wrapper(*args, **kwargs):
        print(f">>> 进入 {func.__name__}")
        print(f"    args: {args}")
        print(f"    kwargs: {kwargs}")

        result = func(*args, **kwargs)

        print(f"<<< 离开 {func.__name__}，返回: {result}")
        return result
    return wrapper

@trace_calls
def multiply(a, b, *, factor=1):
    return a * b * factor

multiply(3, 4, factor=2)
# 输出:
# >>> 进入 multiply
#     args: (3, 4)
#     kwargs: {'factor': 2}
# <<< 离开 multiply，返回: 24
```

### 类的构造函数

```python
class FlexibleConfig:
    """灵活的配置类"""

    def __init__(self, name, **settings):
        self.name = name
        self.settings = settings

        # 将设置作为属性
        for key, value in settings.items():
            setattr(self, key, value)

    def __repr__(self):
        settings_str = ', '.join(f"{k}={v!r}" for k, v in self.settings.items())
        return f"FlexibleConfig(name={self.name!r}, {settings_str})"

config = FlexibleConfig(
    "生产环境",
    debug=False,
    max_connections=100,
    timeout=30,
    retry_attempts=3
)
print(config)
print(f"Debug 模式: {config.debug}")
print(f"最大连接数: {config.max_connections}")
```

### 链式函数调用

```python
def outer_function(*args, **kwargs):
    """外层函数接收参数"""
    print(f"外层接收: args={args}, kwargs={kwargs}")

    # 修改参数后传递给内层
    modified_kwargs = {**kwargs, 'source': 'outer'}

    return inner_function(*args, **modified_kwargs)

def inner_function(*args, **kwargs):
    """内层函数处理参数"""
    print(f"内层接收: args={args}, kwargs={kwargs}")
    return sum(args)

result = outer_function(1, 2, 3, multiplier=2)
print(f"结果: {result}")
```

### 部分应用与柯里化

```python
from functools import partial

def power(base, exponent, *, modulo=None):
    """计算幂，可选取模"""
    result = base ** exponent
    if modulo:
        result = result % modulo
    return result

# 创建偏函数
square = partial(power, exponent=2)
cube = partial(power, exponent=3)
mod_power = partial(power, modulo=1000)

print(square(5))         # 25
print(cube(3))           # 27
print(mod_power(2, 10))  # 24 (1024 % 1000)
```

## 最佳实践

### 明确的函数签名优先

尽可能使用明确的参数名，只在真正需要灵活性时使用 `*args` 和 `**kwargs`：

```python
# 不推荐：过度使用 **kwargs
def create_user(**kwargs):
    name = kwargs.get('name')  # 不清楚需要什么参数
    email = kwargs.get('email')
    # ...

# 推荐：明确的参数签名
def create_user(name: str, email: str, age: int = None, **extra_info):
    """
    创建用户

    Args:
        name: 用户名（必需）
        email: 邮箱（必需）
        age: 年龄（可选）
        **extra_info: 其他可选信息
    """
    user = {'name': name, 'email': email}
    if age:
        user['age'] = age
    user.update(extra_info)
    return user
```

### 使用仅关键字参数增强可读性

```python
# 不推荐：位置参数意义不明
def resize_image(path, 800, 600, True, False):
    pass

# 推荐：使用仅关键字参数
def resize_image(
    path: str,
    *,
    width: int,
    height: int,
    maintain_aspect: bool = True,
    compress: bool = False
):
    """参数含义清晰明确"""
    pass

resize_image("photo.jpg", width=800, height=600, compress=True)
```

### 使用仅位置参数避免命名冲突

```python
# 当参数名可能与 **kwargs 中的键冲突时
def set_attribute(obj, name, value, /, **kwargs):
    """
    设置对象属性

    使用 / 确保 name 不会与 kwargs 中的键冲突
    """
    setattr(obj, name, value)
    for key, val in kwargs.items():
        setattr(obj, key, val)

class MyObj:
    pass

obj = MyObj()
# name 作为位置参数，同时 kwargs 中也可以有 'name' 键
set_attribute(obj, 'name', 'primary_name', name='display_name')
```

### 文档化可变参数

```python
def send_notification(
    recipient: str,
    message: str,
    *attachments,
    priority: str = "normal",
    **metadata
):
    """
    发送通知

    Args:
        recipient: 接收者邮箱
        message: 通知内容
        *attachments: 附件路径列表
            例如: "file1.pdf", "file2.docx"
        priority: 优先级，可选 "low", "normal", "high"
        **metadata: 额外元数据
            常用键:
            - sender: 发送者名称
            - category: 通知类别
            - tags: 标签列表

    Returns:
        bool: 发送是否成功
    """
    pass
```

### 验证可变参数

```python
def process_items(*items, operation: str, **options):
    """处理项目，带参数验证"""

    # 验证 *args
    if not items:
        raise ValueError("至少需要一个项目")

    if not all(isinstance(item, (int, float)) for item in items):
        raise TypeError("所有项目必须是数字")

    # 验证 **kwargs
    valid_options = {'precision', 'normalize', 'cache'}
    invalid_options = set(options.keys()) - valid_options
    if invalid_options:
        raise ValueError(f"无效的选项: {invalid_options}")

    # 处理逻辑
    result = items
    if options.get('normalize'):
        max_val = max(items)
        result = tuple(x / max_val for x in items)

    return result
```

### 类型注解

```python
from typing import Any, Tuple, Dict

def typed_function(
    *args: int,
    **kwargs: str
) -> Tuple[Tuple[int, ...], Dict[str, str]]:
    """
    带类型注解的可变参数函数

    *args: 接受任意数量的整数
    **kwargs: 接受任意数量的字符串键值对
    """
    return args, kwargs

# Python 3.11+ 更精确的类型注解
from typing import Unpack, TypedDict

class UserKwargs(TypedDict, total=False):
    name: str
    age: int
    email: str

def create_user_typed(**kwargs: Unpack[UserKwargs]) -> dict:
    """使用 TypedDict 约束 kwargs 的类型"""
    return dict(kwargs)
```

## 常见陷阱

### 陷阱 1：可变默认参数

```python
# 错误：使用可变对象作为默认值
def append_item_wrong(item, items=[]):
    items.append(item)
    return items

print(append_item_wrong(1))  # [1]
print(append_item_wrong(2))  # [1, 2] - 意外！

# 正确：使用 None 作为默认值
def append_item_correct(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

print(append_item_correct(1))  # [1]
print(append_item_correct(2))  # [2] - 正确
```

### 陷阱 2：参数顺序错误

```python
# 错误：*args 在默认参数之前
# def wrong_order(a, *args, b=10):  # 这是合法的，但容易混淆
#     pass

# 错误：**kwargs 不在最后
# def invalid_signature(**kwargs, extra):  # SyntaxError
#     pass

# 正确的顺序
def correct_order(a, b=10, *args, c, d=20, **kwargs):
    pass
```

### 陷阱 3：意外解包

```python
def greet(*names):
    for name in names:
        print(f"你好，{name}！")

# 预期行为
greet("张三", "李四")
# 输出:
# 你好，张三！
# 你好，李四！

# 意外：传入字符串会被解包成字符
name = "王五"
# greet(*name)  # 会输出：你好，王！你好，五！

# 正确做法
greet(name)  # 作为单个参数传递
```

### 陷阱 4：kwargs 键名冲突

```python
def configure(name, **kwargs):
    print(f"Name: {name}")
    print(f"Kwargs: {kwargs}")

# 错误：name 同时作为位置参数和关键字参数
# configure("test", name="conflict")  # TypeError

# 解决方案 1：使用仅位置参数
def configure_v2(name, /, **kwargs):
    print(f"Name: {name}")
    print(f"Kwargs: {kwargs}")

configure_v2("test", name="可以有相同的键名")
```

### 陷阱 5：修改 kwargs

```python
def process(**kwargs):
    # 错误：直接修改 kwargs 可能影响调用者的字典
    kwargs['processed'] = True
    return kwargs

original = {'a': 1, 'b': 2}
result = process(**original)  # 这里 original 不会被修改，因为 ** 创建了副本

# 但是直接传递字典时要小心
def risky_process(data):
    data['modified'] = True
    return data

original2 = {'x': 1}
risky_process(original2)
print(original2)  # {'x': 1, 'modified': True} - 被修改了！

# 安全做法
def safe_process(**kwargs):
    result = kwargs.copy()
    result['processed'] = True
    return result
```

### 陷阱 6：解包不可哈希的键

```python
# 错误：字典的键必须是字符串才能用 ** 解包到函数调用
invalid_dict = {1: 'a', 2: 'b'}  # 数字键
# some_function(**invalid_dict)  # TypeError

# 正确：字符串键
valid_dict = {'param1': 'a', 'param2': 'b'}
# some_function(**valid_dict)  # 正常工作
```

## 性能考量

### 内存开销

```python
import sys

def measure_args(*args, **kwargs):
    """测量 args 和 kwargs 的内存占用"""
    args_size = sys.getsizeof(args)
    kwargs_size = sys.getsizeof(kwargs)
    return args_size, kwargs_size

# 空参数
print(measure_args())  # (40, 64) 字节（基础开销）

# 大量参数
print(measure_args(*range(1000)))  # 元组开销
print(measure_args(**{f'key{i}': i for i in range(1000)}))  # 字典开销
```

### 调用速度比较

```python
import timeit

def with_args(*args):
    return sum(args)

def with_explicit(a, b, c, d, e):
    return a + b + c + d + e

def with_list(items):
    return sum(items)

# 性能测试
print("*args 方式:", timeit.timeit(
    "with_args(1, 2, 3, 4, 5)",
    globals=globals(),
    number=1000000
))

print("显式参数方式:", timeit.timeit(
    "with_explicit(1, 2, 3, 4, 5)",
    globals=globals(),
    number=1000000
))

print("列表方式:", timeit.timeit(
    "with_list([1, 2, 3, 4, 5])",
    globals=globals(),
    number=1000000
))

# 通常结果：显式参数 > 列表 > *args
# 但差异在微秒级别，大多数情况下可以忽略
```

### 优化建议

```python
# 对于固定数量的高频调用，使用显式参数
def fast_add(a, b, c):  # 比 *args 更快
    return a + b + c

# 避免在循环中重复解包
# 不推荐
def slow_approach(data):
    for item in data:
        process(**item)  # 每次迭代都解包

# 推荐
def fast_approach(data):
    for item in data:
        process(item['key1'], item['key2'])  # 直接访问

# 缓存解包结果
def cached_call(config_dict):
    # 一次性解包到局部变量
    host = config_dict['host']
    port = config_dict['port']
    # 后续使用局部变量
    for _ in range(1000):
        connect(host, port)
```

## 实战场景

### 场景 1：日志记录器

```python
import datetime
from typing import Any

class Logger:
    """灵活的日志记录器"""

    LEVELS = {'DEBUG': 10, 'INFO': 20, 'WARNING': 30, 'ERROR': 40}

    def __init__(self, name: str, level: str = 'INFO'):
        self.name = name
        self.level = self.LEVELS.get(level, 20)

    def _log(self, level: str, message: str, *args, **kwargs):
        """
        内部日志方法

        *args: 用于格式化消息的位置参数
        **kwargs: 额外的上下文信息
        """
        if self.LEVELS.get(level, 0) >= self.level:
            timestamp = datetime.datetime.now().isoformat()

            # 格式化消息
            if args:
                message = message % args

            # 构建上下文字符串
            context = ''
            if kwargs:
                context = ' | ' + ', '.join(f"{k}={v}" for k, v in kwargs.items())

            print(f"[{timestamp}] [{level}] [{self.name}] {message}{context}")

    def debug(self, message: str, *args, **kwargs):
        self._log('DEBUG', message, *args, **kwargs)

    def info(self, message: str, *args, **kwargs):
        self._log('INFO', message, *args, **kwargs)

    def warning(self, message: str, *args, **kwargs):
        self._log('WARNING', message, *args, **kwargs)

    def error(self, message: str, *args, **kwargs):
        self._log('ERROR', message, *args, **kwargs)

# 使用示例
logger = Logger('MyApp', level='DEBUG')
logger.info("用户 %s 登录成功", "张三", ip="192.168.1.1", browser="Chrome")
logger.error("数据库连接失败", retries=3, timeout=30)
```

### 场景 2：API 客户端

```python
import json
from typing import Optional, Dict, Any

class APIClient:
    """RESTful API 客户端"""

    def __init__(self, base_url: str, **default_headers):
        self.base_url = base_url.rstrip('/')
        self.default_headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            **default_headers
        }

    def request(
        self,
        method: str,
        endpoint: str,
        *,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        发送 HTTP 请求

        Args:
            method: HTTP 方法
            endpoint: API 端点
            params: URL 查询参数
            data: 请求体数据
            **kwargs: 额外的请求选项（headers, timeout 等）
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {**self.default_headers, **kwargs.pop('headers', {})}

        # 模拟请求
        print(f"Request: {method} {url}")
        print(f"Headers: {headers}")
        print(f"Params: {params}")
        print(f"Data: {data}")
        print(f"Extra options: {kwargs}")

        return {'status': 'success'}

    def get(self, endpoint: str, **kwargs):
        return self.request('GET', endpoint, **kwargs)

    def post(self, endpoint: str, data: Dict = None, **kwargs):
        return self.request('POST', endpoint, data=data, **kwargs)

    def put(self, endpoint: str, data: Dict = None, **kwargs):
        return self.request('PUT', endpoint, data=data, **kwargs)

    def delete(self, endpoint: str, **kwargs):
        return self.request('DELETE', endpoint, **kwargs)

# 使用示例
client = APIClient(
    "https://api.example.com",
    Authorization="Bearer token123"
)

client.get("/users", params={'page': 1, 'limit': 10})
client.post("/users", data={'name': '新用户', 'email': 'new@example.com'})
```

### 场景 3：事件系统

```python
from typing import Callable, Dict, List, Any

class EventEmitter:
    """事件发射器"""

    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def on(self, event: str, handler: Callable):
        """注册事件处理器"""
        if event not in self._handlers:
            self._handlers[event] = []
        self._handlers[event].append(handler)
        return self

    def off(self, event: str, handler: Callable = None):
        """移除事件处理器"""
        if event in self._handlers:
            if handler:
                self._handlers[event].remove(handler)
            else:
                del self._handlers[event]
        return self

    def emit(self, event: str, *args, **kwargs):
        """
        触发事件

        *args, **kwargs 会传递给所有处理器
        """
        if event in self._handlers:
            for handler in self._handlers[event]:
                handler(*args, **kwargs)
        return self

    def once(self, event: str, handler: Callable):
        """注册一次性事件处理器"""
        def wrapper(*args, **kwargs):
            self.off(event, wrapper)
            handler(*args, **kwargs)
        return self.on(event, wrapper)

# 使用示例
emitter = EventEmitter()

def on_user_login(user_id, **extra):
    print(f"用户 {user_id} 登录，额外信息: {extra}")

def on_user_logout(user_id, reason="unknown"):
    print(f"用户 {user_id} 登出，原因: {reason}")

emitter.on('login', on_user_login)
emitter.on('logout', on_user_logout)

emitter.emit('login', 12345, ip="192.168.1.1", device="mobile")
emitter.emit('logout', 12345, reason="session_timeout")
```

### 场景 4：命令行工具构建器

```python
from typing import Callable, Dict, Any
import sys

class CLI:
    """命令行工具构建器"""

    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.commands: Dict[str, Dict[str, Any]] = {}

    def command(self, name: str = None, **options):
        """
        命令装饰器

        **options: 命令选项（description, aliases 等）
        """
        def decorator(func: Callable):
            cmd_name = name or func.__name__
            self.commands[cmd_name] = {
                'handler': func,
                'description': options.get('description', func.__doc__ or ''),
                'aliases': options.get('aliases', [])
            }
            return func
        return decorator

    def run(self, args: list = None):
        """运行 CLI"""
        args = args or sys.argv[1:]

        if not args or args[0] in ('-h', '--help'):
            self._print_help()
            return

        cmd_name = args[0]
        cmd_args = args[1:]

        # 查找命令
        cmd = self.commands.get(cmd_name)
        if not cmd:
            # 检查别名
            for name, info in self.commands.items():
                if cmd_name in info.get('aliases', []):
                    cmd = info
                    break

        if cmd:
            # 解析参数
            positional = []
            keyword = {}

            i = 0
            while i < len(cmd_args):
                arg = cmd_args[i]
                if arg.startswith('--'):
                    key = arg[2:]
                    if i + 1 < len(cmd_args) and not cmd_args[i + 1].startswith('-'):
                        keyword[key] = cmd_args[i + 1]
                        i += 2
                    else:
                        keyword[key] = True
                        i += 1
                else:
                    positional.append(arg)
                    i += 1

            cmd['handler'](*positional, **keyword)
        else:
            print(f"未知命令: {cmd_name}")

    def _print_help(self):
        print(f"{self.name}")
        if self.description:
            print(f"  {self.description}\n")
        print("可用命令:")
        for name, info in self.commands.items():
            aliases = f" (别名: {', '.join(info['aliases'])})" if info['aliases'] else ""
            print(f"  {name}{aliases}: {info['description']}")

# 使用示例
cli = CLI("myapp", "示例命令行工具")

@cli.command(description="显示问候", aliases=['hi', 'hello'])
def greet(name, *extra_names, greeting="你好"):
    """向用户问好"""
    names = [name] + list(extra_names)
    for n in names:
        print(f"{greeting}，{n}！")

@cli.command('calc', description="执行计算")
def calculate(*numbers, operation="sum"):
    """执行数学计算"""
    nums = [float(n) for n in numbers]
    if operation == "sum":
        print(f"结果: {sum(nums)}")
    elif operation == "avg":
        print(f"结果: {sum(nums) / len(nums)}")

# 模拟命令行调用
cli.run(['greet', '张三', '李四', '--greeting', '欢迎'])
cli.run(['calc', '1', '2', '3', '4', '--operation', 'avg'])
```

## 面试要点

### 常见面试问题

**Q1: *args 和 **kwargs 的区别是什么？**

```python
# *args：收集位置参数为元组
def with_args(*args):
    print(type(args))  # <class 'tuple'>
    return sum(args)

# **kwargs：收集关键字参数为字典
def with_kwargs(**kwargs):
    print(type(kwargs))  # <class 'dict'>
    return kwargs

# 关键区别：
# *args 收集位置参数，**kwargs 收集关键字参数
# *args 是元组（不可变），**kwargs 是字典（可变）
# 解包时 * 用于可迭代对象，** 用于字典
```

**Q2: 解释 Python 函数参数的顺序规则**

```python
# 正确的参数顺序：
def example(
    pos_only, /,           # 1. 仅位置参数
    normal,                # 2. 普通参数
    default=10,            # 3. 默认参数
    *args,                 # 4. *args
    kw_only,               # 5. 仅关键字参数
    kw_default=20,         # 6. 带默认值的仅关键字参数
    **kwargs               # 7. **kwargs（必须最后）
):
    pass
```

**Q3: 如何实现一个可以同时带参数和不带参数使用的装饰器？**

```python
from functools import wraps

def flexible_decorator(func=None, *, option=None):
    """
    可以这样使用：
    @flexible_decorator
    @flexible_decorator()
    @flexible_decorator(option="value")
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            print(f"Option: {option}")
            return f(*args, **kwargs)
        return wrapper

    if func is not None:
        # 不带参数调用：@flexible_decorator
        return decorator(func)
    # 带参数调用：@flexible_decorator() 或 @flexible_decorator(option="value")
    return decorator
```

**Q4: * 和 ** 在不同上下文中的作用是什么？**

```python
# 函数定义中：收集参数
def collect(*args, **kwargs):
    pass

# 函数调用中：解包参数
data = [1, 2, 3]
config = {'a': 1, 'b': 2}
func(*data, **config)

# 赋值语句中：扩展解包（Python 3.5+）
first, *rest = [1, 2, 3, 4]  # first=1, rest=[2, 3, 4]
*start, last = [1, 2, 3, 4]  # start=[1, 2, 3], last=4

# 字典/列表字面量中：合并（Python 3.5+）
merged_list = [*list1, *list2]
merged_dict = {**dict1, **dict2}
```

**Q5: 什么情况下应该使用仅位置参数和仅关键字参数？**

```python
# 使用仅位置参数 (/) 的场景：
# 参数名无意义或可能变化
# 避免参数名与 **kwargs 冲突

def len_custom(obj, /):  # 参数名不重要
    return len(obj)

def setattr_safe(obj, name, value, /, **kwargs):  # 避免 name 冲突
    pass

# 使用仅关键字参数 (*) 的场景：
# 增强代码可读性
# 防止参数位置错误
# 有多个可选参数

def connect(
    host,
    port,
    *,  # 后面的参数必须使用关键字
    timeout=30,
    ssl=True,
    verify_cert=True
):
    pass

connect("localhost", 8080, ssl=False)  # 清晰明确
```

**Q6: 如何安全地传递 kwargs 给多个函数？**

```python
def parent_func(**kwargs):
    # 提取特定参数，其余传递给子函数
    my_param = kwargs.pop('my_param', 'default')

    # 方法1：使用 pop 分离
    child1_kwargs = {}
    for key in list(kwargs.keys()):
        if key.startswith('child1_'):
            child1_kwargs[key[7:]] = kwargs.pop(key)

    # 方法2：使用前缀约定
    child1_func(**child1_kwargs)
    child2_func(**kwargs)

# 或者使用更清晰的分组
def better_parent_func(*, child1_options=None, child2_options=None, **common):
    child1_func(**(child1_options or {}), **common)
    child2_func(**(child2_options or {}), **common)
```

## 延伸阅读

### 官方文档

- [Python 函数定义](https://docs.python.org/3/tutorial/controlflow.html#defining-functions) - 官方教程中的函数定义部分
- [函数调用语法](https://docs.python.org/3/reference/expressions.html#calls) - 表达式参考文档
- [PEP 3102](https://peps.python.org/pep-3102/) - 仅关键字参数提案
- [PEP 570](https://peps.python.org/pep-0570/) - 仅位置参数提案（Python 3.8）
- [PEP 448](https://peps.python.org/pep-0448/) - 扩展解包泛化（Python 3.5）

### 进阶主题

- [functools 模块](https://docs.python.org/3/library/functools.html) - 高阶函数工具
- [inspect 模块](https://docs.python.org/3/library/inspect.html) - 函数签名检查
- [typing 模块](https://docs.python.org/3/library/typing.html) - 类型注解支持

### 推荐书籍

- 《流畅的 Python》（Fluent Python）- 第 7 章：函数装饰器与闭包
- 《Python Cookbook》- 第 7 章：函数
- 《Effective Python》- 条目 22-25：函数相关最佳实践

### 相关文章

- [Real Python: Python args and kwargs](https://realpython.com/python-kwargs-and-args/) - 详细教程
- [Python 函数参数的最佳实践](https://treyhunner.com/2018/04/keyword-arguments-in-python/) - Trey Hunner 的博客
