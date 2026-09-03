---
title: Python inspect 模块完全指南
description: 深入讲解 Python inspect 模块：动态检查运行时对象、函数签名、调用栈、源代码、类型检查，包括实际应用与最佳实践
track: python
section: stdlib
difficulty: advanced
tags:
  - Python
  - inspect
  - 反射
  - 元编程
  - 调试
  - 动态检查
  - 高级特性
status: imported
origin: old/src/content/docs/python/inspect.zh.md
divergence: 0.305
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: 标准库与工具
  order: 45
  lastUpdated: 2026-01-07
---

`inspect` 模块是 Python 标准库中用于检查运行时对象的强大工具。它提供了多种函数来获取关于对象、函数、类、方法的详细信息，包括参数签名、源代码、调用栈等。这使得开发者能够编写更强大的元编程工具、调试器、文档生成器和框架。

## 概念解释

### 什么是 inspect 模块

`inspect` 模块的核心目的是在程序运行时动态检查 Python 对象的属性和行为，而不需要静态分析源代码。它提供了一系列函数来：

1. **获取对象信息**：确定对象的类型、属性、方法
2. **分析函数签名**：提取参数、默认值、返回类型注解
3. **访问源代码**：读取函数和类的源代码
4. **检查调用栈**：获取当前执行位置、帧信息
5. **类型检查**：判断对象是函数、类、方法还是其他类型

```python
import inspect

def example_func(a, b=10, *args, **kwargs):
    """这是一个示例函数"""
    pass

# 获取函数签名
sig = inspect.signature(example_func)
print(sig)  # (a, b=10, *args, **kwargs)

# 获取参数信息
for param_name, param in sig.parameters.items():
    print(f"{param_name}: {param.default}")

# 获取源代码
print(inspect.getsource(example_func))

# 获取文档
print(inspect.getdoc(example_func))
```

### 为什么需要 inspect 模块

在不同的场景中，对象的检查是必不可少的：

**框架开发**：Flask、Django 等框架使用 `inspect` 来自动推导视图函数的参数，并注入依赖。

**API 文档生成**：Sphinx、FastAPI 等工具使用 `inspect` 来自动生成函数和类的文档。

**测试框架**：pytest 使用 `inspect` 来发现和执行测试函数，提取测试参数。

**调试工具**：pdb 和其他调试器使用 `inspect` 来显示调用栈、局部变量信息。

**参数验证**：dataclass、Pydantic 等库使用 `inspect` 来获取初始化参数并进行验证。

## 核心原理

### inspect 模块的底层机制

#### 对象的内部结构

Python 对象的所有属性都存储在 `__dict__` 或通过描述符访问。`inspect` 通过访问这些内部结构来获取信息：

```python
import inspect

class MyClass:
    class_var = 10

    def __init__(self, x):
        self.x = x

    def method(self):
        pass

obj = MyClass(5)

# 访问对象的内部结构
print(obj.__dict__)           # {'x': 5}
print(MyClass.__dict__.keys()) # dict_keys(['__module__', '__init__', ...])

# inspect 通过这些结构来获取信息
print(inspect.getmembers(MyClass))  # 列出所有成员
```

#### 函数对象的结构

函数在 Python 中是第一类对象，包含了丰富的元数据：

```python
def example(a, b=1):
    """示例函数"""
    pass

# 函数对象的关键属性
print(example.__code__)        # 字节码对象
print(example.__defaults__)    # (1,) - 默认参数值
print(example.__annotations__) # {} - 类型注解
print(example.__name__)        # 'example' - 函数名
print(example.__doc__)         # 文档字符串
print(example.__module__)      # 模块名
print(example.__globals__)     # 全局命名空间
```

#### 帧和栈的结构

当代码执行时，Python 维护一个调用栈。每个调用的函数对应一个帧对象：

```python
import inspect
import sys

def level_1():
    level_2()

def level_2():
    level_3()

def level_3():
    # 获取当前帧
    frame = inspect.currentframe()

    # 遍历整个调用栈
    for frame_info in inspect.stack():
        print(f"函数: {frame_info.function}, 行号: {frame_info.lineno}")

level_1()
# 输出：
# 函数: level_3, 行号: 12
# 函数: level_2, 行号: 3
# 函数: level_1, 行号: 2
# ...
```

#### 签名对象的工作原理

`inspect.Signature` 类是对函数参数的完整表示，包含了参数的所有信息：

```python
import inspect
from typing import Optional

def complex_func(a: int, b: str = "default", *args: str,
                 c: Optional[int] = None, **kwargs) -> bool:
    pass

sig = inspect.signature(complex_func)

# Signature 包含参数对象的有序字典
for name, param in sig.parameters.items():
    print(f"{name}:")
    print(f"  kind: {param.kind}")           # 参数类型
    print(f"  annotation: {param.annotation}") # 类型注解
    print(f"  default: {param.default}")     # 默认值

print(f"返回值注解: {sig.return_annotation}")
```

## 核心要点

### 对象检查函数族

| 函数 | 用途 | 返回值 |
|-----|------|--------|
| `ismodule(obj)` | 检查是否为模块 | bool |
| `isclass(obj)` | 检查是否为类 | bool |
| `ismethod(obj)` | 检查是否为方法 | bool |
| `isfunction(obj)` | 检查是否为函数 | bool |
| `isbuiltin(obj)` | 检查是否为内置函数 | bool |
| `isgenerator(obj)` | 检查是否为生成器 | bool |
| `iscoroutine(obj)` | 检查是否为协程 | bool |
| `isasyncgen(obj)` | 检查是否为异步生成器 | bool |

### 签名和参数对象

```python
import inspect

sig = inspect.signature(func)

# Signature 的重要属性
sig.parameters       # OrderedDict[str, Parameter]
sig.return_annotation  # 返回类型注解

# Parameter 的重要属性
param.name          # 参数名
param.kind          # 参数类型（POSITIONAL_ONLY, POSITIONAL_OR_KEYWORD, etc.）
param.default       # 默认值
param.annotation    # 类型注解
```

### 参数种类（Parameter.kind）

```python
from inspect import Parameter

# 5 种参数类型
Parameter.POSITIONAL_ONLY      # 仅位置参数 (/)
Parameter.POSITIONAL_OR_KEYWORD # 位置或关键字参数
Parameter.VAR_POSITIONAL       # *args
Parameter.KEYWORD_ONLY         # 仅关键字参数
Parameter.VAR_KEYWORD          # **kwargs
```

### 获取源代码的方法

```python
import inspect

# 获取源代码
inspect.getsource(func)         # 返回源代码字符串
inspect.getsourcefile(func)     # 返回源文件路径
inspect.getsourcelines(func)    # 返回 (源代码行列表, 起始行号)

# 获取源代码范围
inspect.findsource(module)      # 返回 (完整源码, 起始行号)
inspect.getfile(obj)            # 返回定义对象的文件
```

### 栈检查函数

```python
import inspect

# 获取当前栈信息
inspect.stack()              # 返回 FrameInfo 对象列表
inspect.currentframe()       # 返回当前帧对象
inspect.getframeinfo(frame)  # 获取帧的详细信息

# 获取调用者信息
inspect.getouterframes(frame)  # 获取帧之外的所有帧
inspect.getinnerframes(traceback)  # 获取 traceback 的帧
```

## 代码示例

### 示例 1：函数签名分析

```python
import inspect
from typing import Optional, List

def process_data(
    data: List[int],
    factor: float = 1.0,
    *extra_data: int,
    method: str = "average",
    **options: bool
) -> Optional[float]:
    """处理数据的函数"""
    pass

# 分析函数签名
sig = inspect.signature(process_data)

print("=== 函数签名分析 ===")
print(f"完整签名: {sig}")
print(f"返回类型: {sig.return_annotation}")
print()

print("=== 参数详情 ===")
for param_name, param in sig.parameters.items():
    print(f"参数名: {param_name}")
    print(f"  类型: {param.kind.name}")
    print(f"  默认值: {param.default}")
    print(f"  类型注解: {param.annotation}")
    print()

# 获取特定类型的参数
positional = [
    name for name, param in sig.parameters.items()
    if param.kind == inspect.Parameter.POSITIONAL_OR_KEYWORD
]
print(f"位置或关键字参数: {positional}")

var_positional = [
    name for name, param in sig.parameters.items()
    if param.kind == inspect.Parameter.VAR_POSITIONAL
]
print(f"可变位置参数: {var_positional}")

var_keyword = [
    name for name, param in sig.parameters.items()
    if param.kind == inspect.Parameter.VAR_KEYWORD
]
print(f"可变关键字参数: {var_keyword}")
```

**输出：**
```
=== 函数签名分析 ===
完整签名: (data: List[int], factor: float = 1.0, *extra_data: int, method: str = 'average', **options: bool) -> Optional[float]
返回类型: typing.Union[float, NoneType]

=== 参数详情 ===
参数名: data
  类型: POSITIONAL_OR_KEYWORD
  默认值: <class 'inspect._empty'>
  类型注解: typing.List[int]
...
```

### 示例 2：获取源代码和文档

```python
import inspect

def calculate_sum(numbers: list) -> int:
    """
    计算数字列表的和。

    Args:
        numbers: 整数列表

    Returns:
        列表中所有数字的和
    """
    return sum(numbers)

class DataProcessor:
    def __init__(self, name):
        """初始化处理器"""
        self.name = name

    def process(self, data):
        """处理数据"""
        return data

# 获取源代码
print("=== calculate_sum 的源代码 ===")
print(inspect.getsource(calculate_sum))

# 获取文档
print("\n=== 文档字符串 ===")
print(inspect.getdoc(calculate_sum))

# 获取文件和行号信息
print(f"\n文件: {inspect.getfile(calculate_sum)}")
source_lines, start_line = inspect.getsourcelines(calculate_sum)
print(f"起始行号: {start_line}")
print(f"代码行数: {len(source_lines)}")

# 获取类的信息
print(f"\n=== DataProcessor 类 ===")
for name, member in inspect.getmembers(DataProcessor):
    if not name.startswith('_'):
        print(f"{name}: {type(member).__name__}")
```

### 示例 3：调用栈检查

```python
import inspect
import traceback

def log_stack(message):
    """记录调用栈信息"""
    print(f"\n=== {message} ===")

    # 获取调用栈
    stack = inspect.stack()

    # stack[0] 是 log_stack 本身，从 stack[1] 开始才是调用者
    for i, frame_info in enumerate(stack[1:], 1):
        print(f"级别 {i}: {frame_info.function}")
        print(f"  文件: {frame_info.filename}:{frame_info.lineno}")
        print(f"  代码: {frame_info.code_context[0].strip() if frame_info.code_context else 'N/A'}")

def function_a():
    log_stack("从 function_a 调用")

def function_b():
    function_a()

def function_c():
    function_b()

# 调用栈跟踪
function_c()

# 获取调用者信息
def show_caller():
    """显示调用此函数的调用者"""
    frame = inspect.currentframe()
    caller_frame = frame.f_back
    caller_info = inspect.getframeinfo(caller_frame)

    print(f"调用者函数: {caller_info.function}")
    print(f"调用位置: {caller_info.filename}:{caller_info.lineno}")

show_caller()
```

### 示例 4：依赖注入框架的简化实现

```python
import inspect
from typing import get_type_hints

class Container:
    """简单的依赖注入容器"""
    def __init__(self):
        self.services = {}

    def register(self, name, factory):
        """注册服务"""
        self.services[name] = factory

    def resolve(self, cls):
        """解析类的依赖并创建实例"""
        if not inspect.isclass(cls):
            raise TypeError(f"{cls} 不是一个类")

        # 获取构造函数的签名
        sig = inspect.signature(cls.__init__)
        params = sig.parameters

        # 解析依赖
        kwargs = {}
        for param_name, param in params.items():
            if param_name == 'self':
                continue

            # 从类型注解获取依赖类型
            if param.annotation != inspect.Parameter.empty:
                dep_type = param.annotation
                if dep_type in self.services:
                    kwargs[param_name] = self.services[dep_type]()

        return cls(**kwargs)

# 使用示例
class Database:
    def __init__(self):
        self.connected = False

    def connect(self):
        self.connected = True

class UserService:
    def __init__(self, db: Database):
        self.db = db

    def get_user(self, user_id):
        if self.db.connected:
            return f"User {user_id}"
        return None

class UserController:
    def __init__(self, service: UserService):
        self.service = service

    def handle_request(self, user_id):
        return self.service.get_user(user_id)

# 设置容器
container = Container()
container.register(Database, Database)
container.register(UserService, lambda: UserService(container.resolve(Database)))
container.register(UserController, lambda: UserController(container.services[UserService]()))

# 创建实例
controller = container.resolve(UserController)
print(controller.handle_request(1))  # User 1
```

### 示例 5：自动化 API 文档生成

```python
import inspect
from typing import get_type_hints

def generate_api_docs(obj):
    """为模块、类或函数生成文档"""

    if inspect.ismodule(obj):
        return _document_module(obj)
    elif inspect.isclass(obj):
        return _document_class(obj)
    elif inspect.isfunction(obj) or inspect.ismethod(obj):
        return _document_function(obj)

def _document_function(func):
    """生成函数文档"""
    doc = f"## {func.__name__}\n\n"

    if func.__doc__:
        doc += f"{inspect.getdoc(func)}\n\n"

    sig = inspect.signature(func)
    doc += f"**签名**: `{func.__name__}{sig}`\n\n"

    # 参数表
    if sig.parameters:
        doc += "### 参数\n\n"
        for param_name, param in sig.parameters.items():
            if param_name == 'self':
                continue

            doc += f"- `{param_name}`"

            if param.annotation != inspect.Parameter.empty:
                doc += f": `{param.annotation}`"

            if param.default != inspect.Parameter.empty:
                doc += f" = `{param.default}`"

            doc += "\n"

    # 返回值
    if sig.return_annotation != inspect.Signature.empty:
        doc += f"\n### 返回值\n\n`{sig.return_annotation}`\n"

    return doc

def _document_class(cls):
    """生成类文档"""
    doc = f"## {cls.__name__}\n\n"

    if cls.__doc__:
        doc += f"{inspect.getdoc(cls)}\n\n"

    # 列出方法
    methods = [m for m in inspect.getmembers(cls, predicate=inspect.isfunction)
               if not m[0].startswith('_')]

    if methods:
        doc += "### 方法\n\n"
        for method_name, method in methods:
            doc += f"- {method_name}{inspect.signature(method)}\n"

    return doc

def _document_module(mod):
    """生成模块文档"""
    doc = f"# Module {mod.__name__}\n\n"

    if mod.__doc__:
        doc += f"{mod.__doc__}\n\n"

    classes = [c for c in inspect.getmembers(mod, predicate=inspect.isclass)]
    functions = [f for f in inspect.getmembers(mod, predicate=inspect.isfunction)]

    if classes:
        doc += "## Classes\n\n"
        for cls_name, cls in classes:
            if cls.__module__ == mod.__name__:
                doc += f"- {cls_name}\n"

    if functions:
        doc += "\n## Functions\n\n"
        for func_name, func in functions:
            if func.__module__ == mod.__name__:
                doc += f"- {func_name}{inspect.signature(func)}\n"

    return doc

# 使用示例
def calculate(a: int, b: int = 10) -> int:
    """
    计算两个数字的和。

    这是一个简单的示例函数。
    """
    return a + b

class Calculator:
    """简单的计算器类"""

    def add(self, a: int, b: int) -> int:
        """加法"""
        return a + b

    def multiply(self, a: int, b: int) -> int:
        """乘法"""
        return a * b

# 生成文档
print(generate_api_docs(calculate))
print(generate_api_docs(Calculator))
```

### 示例 6：参数验证装饰器

```python
import inspect
from functools import wraps
from typing import get_type_hints

def validate_types(func):
    """验证函数参数和返回值的类型"""

    # 获取类型注解
    type_hints = get_type_hints(func)
    sig = inspect.signature(func)

    @wraps(func)
    def wrapper(*args, **kwargs):
        # 将位置参数和关键字参数绑定到参数名
        bound = sig.bind(*args, **kwargs)
        bound.apply_defaults()

        # 检查参数类型
        for param_name, param_value in bound.arguments.items():
            if param_name in type_hints:
                expected_type = type_hints[param_name]

                # 简化的类型检查（不处理 Union、Optional 等）
                if not isinstance(param_value, expected_type):
                    raise TypeError(
                        f"参数 '{param_name}' 应该是 {expected_type.__name__}, "
                        f"但得到 {type(param_value).__name__}"
                    )

        # 调用函数
        result = func(*args, **kwargs)

        # 检查返回值类型
        if 'return' in type_hints:
            expected_return = type_hints['return']
            if not isinstance(result, expected_return):
                raise TypeError(
                    f"返回值应该是 {expected_return.__name__}, "
                    f"但得到 {type(result).__name__}"
                )

        return result

    return wrapper

# 使用示例
@validate_types
def greet(name: str, age: int) -> str:
    return f"{name} is {age} years old"

# 正确的调用
print(greet("Alice", 30))  # Alice is 30 years old

# 类型错误的调用
try:
    print(greet("Bob", "thirty"))  # TypeError
except TypeError as e:
    print(f"错误: {e}")
```

## 最佳实践

### 安全地获取源代码

```python
import inspect
import sys

def safe_get_source(obj):
    """安全地获取源代码"""
    try:
        # 检查是否有源代码可用
        if inspect.getsourcefile(obj) is None:
            return None  # 内置函数或 C 扩展

        source = inspect.getsource(obj)
        return source
    except (OSError, TypeError):
        # OSError: 源文件不存在
        # TypeError: 无法获取某些对象的源代码
        return None

# 使用示例
print(safe_get_source(list.append))  # None - 内置函数
print(safe_get_source(safe_get_source) is not None)  # True
```

### 处理装饰器和包装函数

```python
import inspect
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def decorated_func(a, b):
    """Original docstring"""
    return a + b

# 错误方式：会获取 wrapper 的签名
print(inspect.signature(decorated_func.__wrapped__))  # (a, b)

# 正确方式：使用 __wrapped__ 属性（由 functools.wraps 设置）
print(inspect.signature(decorated_func))  # (*args, **kwargs)
```

### 处理异步函数和生成器

```python
import inspect
import asyncio

async def async_func(x):
    """异步函数"""
    return x * 2

def sync_func(x):
    """同步函数"""
    return x * 2

def generator_func(n):
    """生成器函数"""
    for i in range(n):
        yield i

# 检查函数类型
print(inspect.iscoroutinefunction(async_func))  # True
print(inspect.isgeneratorfunction(generator_func))  # True

# 获取返回值类型（对于异步函数和生成器很有用）
sig_async = inspect.signature(async_func)
sig_gen = inspect.signature(generator_func)

print(f"异步函数返回: {sig_async.return_annotation}")
print(f"生成器函数返回: {sig_gen.return_annotation}")
```

### 避免内存泄漏

```python
import inspect
import sys

def check_frame_references():
    """检查帧引用"""

    # 获取当前帧
    frame = inspect.currentframe()

    try:
        # 处理帧信息
        caller_frame = frame.f_back
        print(f"调用者: {caller_frame.f_code.co_name}")
    finally:
        # 重要：删除帧引用以避免循环引用
        del frame
        del caller_frame

# 处理栈时也要小心
def safe_get_stack():
    """安全地获取栈信息"""
    stack = inspect.stack()

    # stack 包含对帧的引用，可能造成内存泄漏
    # 提取需要的信息后立即释放
    info = [
        (frame_info.function, frame_info.lineno)
        for frame_info in stack
    ]

    # 删除帧引用
    del stack

    return info

result = safe_get_stack()
print(result)
```

### 缓存 inspect 结果

```python
import inspect
from functools import lru_cache

# 直接缓存可能不行，因为结果包含不可哈希的对象
@lru_cache(maxsize=128)
def get_function_name(func):
    """缓存函数名（可哈希）"""
    return func.__name__

# 缓存签名信息
class SignatureCache:
    """缓存函数签名"""
    def __init__(self):
        self._cache = {}

    def get_signature(self, func):
        """获取并缓存签名"""
        func_id = id(func)

        if func_id not in self._cache:
            self._cache[func_id] = inspect.signature(func)

        return self._cache[func_id]

cache = SignatureCache()
sig1 = cache.get_signature(len)
sig2 = cache.get_signature(len)  # 从缓存获取
print(sig1 is sig2)  # True
```

## 常见陷阱

### 陷阱 1：忽略 __wrapped__ 属性

```python
import inspect
from functools import wraps

def decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print("Called")
        return func(*args, **kwargs)
    return wrapper

@decorator
def add(a: int, b: int) -> int:
    return a + b

# 错误：获取的是 wrapper 的签名
sig = inspect.signature(add)
print(sig)  # (*args, **kwargs) - 丢失了类型信息

# 正确：访问原始函数
original_sig = inspect.signature(add.__wrapped__)
print(original_sig)  # (a: int, b: int) -> int
```

### 陷阱 2：处理内置函数

```python
import inspect

# 内置函数没有 Python 源代码
try:
    source = inspect.getsource(len)  # TypeError
except TypeError as e:
    print(f"无法获取 len 的源代码: {e}")

# 检查是否为内置函数
if inspect.isbuiltin(len):
    print("len 是内置函数")

# 获取签名可能失败或不完整
try:
    sig = inspect.signature(len)
    print(f"len 的签名: {sig}")
except ValueError as e:
    print(f"无法获取签名: {e}")
```

### 陷阱 3：帧对象的生命周期

```python
import inspect
import gc

def get_stack_delayed():
    """延迟返回栈信息"""

    # 不要直接返回帧对象 - 会造成内存泄漏
    # bad: return inspect.stack()

    # 正确：提取需要的信息
    stack = inspect.stack()
    info = [(f.function, f.lineno) for f in stack]

    # 让帧对象被垃圾回收
    del stack
    gc.collect()

    return info

result = get_stack_delayed()
```

### 陷阱 4：参数默认值的陷阱

```python
import inspect

# 可变默认值问题
def append_to_list(item, target=[]):
    target.append(item)
    return target

# inspect 会看到实际的列表对象
sig = inspect.signature(append_to_list)
target_param = sig.parameters['target']

print(target_param.default)  # []
print(target_param.default is target_param.default)  # False，每次都是同一个列表对象

# 这是 Python 的常见陷阱
result1 = append_to_list(1)
result2 = append_to_list(2)
print(result1)  # [1, 2] - 意外地共享了列表！
```

### 陷阱 5：处理特殊对象

```python
import inspect

class Meta(type):
    pass

class MyClass(metaclass=Meta):
    pass

# 类和元类的处理
print(inspect.isclass(MyClass))  # True
print(inspect.isclass(Meta))     # True

# 方法绑定的复杂性
class Example:
    @classmethod
    def class_method(cls):
        pass

    @staticmethod
    def static_method():
        pass

    def instance_method(self):
        pass

# 不同的调用方式会产生不同的对象
print(type(Example.instance_method))      # <class 'function'>
print(type(Example().instance_method))    # <class 'method'>
print(type(Example.class_method))         # <class 'method'>
print(type(Example.static_method))        # <class 'function'>
```

## 性能考量

### 签名解析的性能

```python
import inspect
import time
from typing import List, Dict, Optional

def complex_func(a: List[int], b: Dict[str, str] = None,
                 *args: str, c: Optional[int] = None,
                 **kwargs: bool) -> Dict:
    pass

# 签名解析有一定的性能开销
start = time.time()
for _ in range(10000):
    sig = inspect.signature(complex_func)
end = time.time()

print(f"10000 次签名解析耗时: {end - start:.4f} 秒")

# 缓存签名以避免重复解析
signatures = {}

def get_cached_signature(func):
    if func not in signatures:
        signatures[func] = inspect.signature(func)
    return signatures[func]

start = time.time()
for _ in range(10000):
    sig = get_cached_signature(complex_func)
end = time.time()

print(f"10000 次缓存签名查询耗时: {end - start:.6f} 秒")
```

### 栈检查的性能

```python
import inspect
import time

def expensive_operation():
    """耗时操作"""
    pass

def with_stack_check():
    """使用栈检查的函数"""
    stack = inspect.stack()  # 这是一个昂贵的操作
    expensive_operation()

def without_stack_check():
    """不使用栈检查的函数"""
    expensive_operation()

# 比较性能
start = time.time()
for _ in range(1000):
    with_stack_check()
end = time.time()
time_with = end - start

start = time.time()
for _ in range(1000):
    without_stack_check()
end = time.time()
time_without = end - start

print(f"有栈检查: {time_with:.4f}s")
print(f"无栈检查: {time_without:.4f}s")
print(f"开销: {(time_with - time_without) / time_without * 100:.1f}%")
```

### 优化建议

```python
import inspect

# 不好：频繁调用 inspect.stack()
def bad_logging(*args, **kwargs):
    for frame_info in inspect.stack():
        print(frame_info.function)

# 更好：只获取需要的信息
def better_logging(*args, **kwargs):
    frame = inspect.currentframe()
    try:
        caller = frame.f_back.f_code.co_name
        print(f"Called from {caller}")
    finally:
        del frame

# 最好：在需要时才进行检查
def best_logging(*args, debug=False, **kwargs):
    if debug:  # 只在需要时才进行昂贵的检查
        frame = inspect.currentframe()
        try:
            caller = frame.f_back.f_code.co_name
            print(f"Called from {caller}")
        finally:
            del frame
```

## 实战场景

### 场景 1：FastAPI 依赖注入的简化实现

```python
import inspect
from typing import Callable, Dict, Any, get_type_hints

class DIContainer:
    """简单的依赖注入容器"""

    def __init__(self):
        self.dependencies: Dict[type, Any] = {}

    def provide(self, dependency_type: type, instance: Any):
        """注册依赖"""
        self.dependencies[dependency_type] = instance

    def call(self, func: Callable) -> Any:
        """调用函数，自动注入依赖"""

        # 获取类型注解
        type_hints = get_type_hints(func)
        sig = inspect.signature(func)

        # 解析参数
        kwargs = {}
        for param_name, param in sig.parameters.items():
            if param.annotation != inspect.Parameter.empty:
                annotation = param.annotation

                # 如果有对应的依赖，自动注入
                if annotation in self.dependencies:
                    kwargs[param_name] = self.dependencies[annotation]

        return func(**kwargs)

# 使用示例
class Database:
    def query(self, sql: str):
        return f"Result of: {sql}"

class UserService:
    def __init__(self, db: Database):
        self.db = db

    def get_user(self, user_id: int):
        return self.db.query(f"SELECT * FROM users WHERE id = {user_id}")

def handler(service: UserService) -> str:
    return service.get_user(1)

# 设置容器
container = DIContainer()
container.provide(Database, Database())
container.provide(UserService, UserService(container.dependencies[Database]))

# 自动注入
result = container.call(handler)
print(result)  # Result of: SELECT * FROM users WHERE id = 1
```

### 场景 2：pytest 的自动装置发现

```python
import inspect
from typing import Callable, Dict, List

class FixtureRegistry:
    """Pytest 风格的装置注册表"""

    def __init__(self):
        self.fixtures: Dict[str, Callable] = {}

    def fixture(self, func: Callable) -> Callable:
        """装饰器：注册装置"""
        self.fixtures[func.__name__] = func
        return func

    def run_test(self, test_func: Callable) -> None:
        """运行测试，自动注入装置"""

        sig = inspect.signature(test_func)

        # 获取所有参数
        kwargs = {}
        for param_name in sig.parameters:
            # 如果参数名存在于装置注册表，自动注入
            if param_name in self.fixtures:
                fixture_func = self.fixtures[param_name]
                kwargs[param_name] = fixture_func()

        # 运行测试
        test_func(**kwargs)
        print(f"✓ {test_func.__name__} passed")

# 使用示例
registry = FixtureRegistry()

@registry.fixture
def database():
    """数据库装置"""
    class MockDB:
        def query(self, sql):
            return [{"id": 1, "name": "Alice"}]
    return MockDB()

@registry.fixture
def user_service(database):
    """用户服务装置"""
    class UserService:
        def __init__(self, db):
            self.db = db

        def get_users(self):
            return self.db.query("SELECT * FROM users")

    return UserService(database)

def test_get_users(user_service):
    """测试函数"""
    users = user_service.get_users()
    assert len(users) > 0

# 运行测试
registry.run_test(test_get_users)
```

### 场景 3：ORM 模型验证

```python
import inspect
from typing import get_type_hints, Any

class ValidationError(Exception):
    """验证错误"""
    pass

class Field:
    def __init__(self, field_type: type, required: bool = True):
        self.field_type = field_type
        self.required = required

class Model:
    """简单的 ORM 模型基类"""

    def __init__(self, **kwargs):
        # 获取类的类型注解
        type_hints = get_type_hints(self.__class__)

        for field_name, field_type in type_hints.items():
            if field_name.startswith('_'):
                continue

            if field_name in kwargs:
                value = kwargs[field_name]

                # 验证类型
                if not isinstance(value, field_type):
                    raise ValidationError(
                        f"字段 '{field_name}' 应该是 {field_type.__name__}, "
                        f"但得到 {type(value).__name__}"
                    )

                setattr(self, field_name, value)
            else:
                # 检查是否为必填字段
                if field_name not in ['_id']:
                    raise ValidationError(f"缺少必填字段: {field_name}")

class User(Model):
    """用户模型"""
    name: str
    email: str
    age: int

# 使用示例
try:
    # 正确的创建
    user = User(name="Alice", email="alice@example.com", age=30)
    print(f"创建用户成功: {user.name}")
except ValidationError as e:
    print(f"验证失败: {e}")

try:
    # 类型错误
    bad_user = User(name="Bob", email="bob@example.com", age="thirty")
except ValidationError as e:
    print(f"验证失败: {e}")
```

## 面试要点

### inspect 的核心功能有哪些？

**回答要点：**
- 对象类型检查（isclass、isfunction 等）
- 函数签名分析（signature、getfullargspec）
- 源代码获取（getsource、getsourcefile）
- 栈帧检查（stack、currentframe）
- 文档提取（getdoc）

```python
import inspect

# 演示核心功能
def demo(a, b=1, *args, **kwargs) -> int:
    """演示函数"""
    return a + b

print("函数名:", demo.__name__)
print("签名:", inspect.signature(demo))
print("参数:", list(inspect.signature(demo).parameters.keys()))
print("源代码:", inspect.getsource(demo))
```

### Signature 和 Parameter 对象的重要属性？

**回答要点：**

Signature：
- `parameters`: OrderedDict，包含所有参数
- `return_annotation`: 返回值类型注解

Parameter：
- `name`: 参数名
- `kind`: 参数类型（POSITIONAL_ONLY、KEYWORD_ONLY 等）
- `default`: 默认值
- `annotation`: 类型注解

### 如何安全地获取函数的源代码？

**回答要点：**
- 使用 try-except 处理异常
- 检查 getsourcefile 是否返回 None（内置函数）
- 对于装饰器，使用 `__wrapped__` 属性
- 及时删除帧引用以避免内存泄漏

### 装饰器如何影响 inspect？

**回答要点：**
- 未使用 `functools.wraps` 的装饰器会改变函数签名
- 使用 `functools.wraps` 可以保留原始函数的元数据
- 可以通过 `__wrapped__` 属性访问原始函数
- 这对依赖注入框架很重要

### 如何使用 inspect 实现依赖注入？

**回答要点：**
- 获取函数的签名
- 检查参数的类型注解
- 根据类型注解查找依赖
- 自动注入依赖并调用函数

## 延伸阅读

### 官方文档
- [Python inspect 官方文档](https://docs.python.org/3/library/inspect.html)
- [inspect.Signature 文档](https://docs.python.org/3/library/inspect.html#inspect.Signature)

### 相关模块
- [importlib](https://docs.python.org/3/library/importlib.html) - 动态导入模块
- [sys 模块](https://docs.python.org/3/library/sys.html) - 系统相关信息
- [typing 模块](https://docs.python.org/3/library/typing.html) - 类型注解
- [functools 模块](https://docs.python.org/3/library/functools.html) - 装饰器和函数工具

### 实践应用
- **FastAPI** - 使用 inspect 实现依赖注入
- **pytest** - 使用 inspect 发现和运行测试
- **Pydantic** - 使用 inspect 进行数据验证
- **Click** - 使用 inspect 生成 CLI 界面

### 深入阅读
- Guido van Rossum 的 Python 设计理念 - 了解为什么 Python 对象如此可检查
- CPython 源码中的 inspect 实现 - 了解底层机制
- 反射和元编程的设计模式 - 学习如何有效使用 inspect

### 相关主题
- [Python 装饰器](/docs/python/decorators)
- [Python 类和对象](/docs/python/classes-objects)
- [Python 类型系统](/docs/python/type-hints)
- [Python 元类](/docs/python/metaclasses)
- [异步编程](/docs/python/asyncio)
