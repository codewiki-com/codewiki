---
title: Python singledispatch 单分派泛型函数
description: 深入掌握 Python singledispatch：基于类型的函数分派、@register 注册器、singledispatchmethod 类方法分派与实战模式
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - singledispatch
  - 泛型函数
  - 类型分派
  - functools
  - 多态
status: imported
origin: old/src/content/docs/python/singledispatch.zh.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 函数式编程
  order: 33
  lastUpdated: 2026-01-07
---

`singledispatch` 是 Python 标准库 `functools` 模块中的一个装饰器，用于实现基于第一个参数类型的函数重载（单分派泛型函数）。它是 Python 实现多态行为的一种优雅方式，让你能够为同一个函数定义多个针对不同类型的实现版本。

## 概念解释

### 什么是单分派（Single Dispatch）

在编程语言中，**分派（Dispatch）** 是指根据某些条件选择执行哪个函数实现的机制：

- **单分派（Single Dispatch）**：根据**一个**参数的类型选择实现
- **多分派（Multiple Dispatch）**：根据**多个**参数的类型选择实现

Python 的 `singledispatch` 实现的是单分派，即根据函数的**第一个参数**的类型来决定调用哪个实现。

### 为什么需要 singledispatch

在没有 `singledispatch` 之前，我们通常使用 `if-elif-else` 或 `isinstance()` 来实现基于类型的分派：

```python
# 传统方式：使用 if-elif-else 进行类型判断
def process(data):
    if isinstance(data, int):
        return data * 2
    elif isinstance(data, str):
        return data.upper()
    elif isinstance(data, list):
        return [process(item) for item in data]
    else:
        raise TypeError(f"不支持的类型: {type(data)}")

# 问题：
# 代码冗长，难以扩展
# 添加新类型需要修改原函数
# 违反开放-封闭原则
```

使用 `singledispatch` 可以解决这些问题：

```python
from functools import singledispatch

@singledispatch
def process(data):
    """默认实现"""
    raise TypeError(f"不支持的类型: {type(data)}")

@process.register(int)
def _(data):
    return data * 2

@process.register(str)
def _(data):
    return data.upper()

@process.register(list)
def _(data):
    return [process(item) for item in data]

# 优势：
# 代码更清晰，每个类型的处理逻辑独立
# 易于扩展，添加新类型无需修改原函数
# 符合开放-封闭原则
```

### 历史背景

`singledispatch` 在 **Python 3.4** 中通过 [PEP 443](https://peps.python.org/pep-0443/) 引入。设计灵感来自于其他语言的泛型函数概念（如 Common Lisp 的 CLOS、Julia 的多分派系统）。

**Python 3.8** 进一步增强了该功能，引入了 `singledispatchmethod`，支持在类方法中使用单分派。

---

## 核心原理

### 工作机制

`singledispatch` 的核心工作流程如下：

```
1. 使用 @singledispatch 装饰基函数（定义默认行为）
2. 使用 @func.register(type) 注册特定类型的处理函数
3. 调用时，根据第一个参数的类型查找注册表
4. 找到匹配的实现则调用，否则调用基函数
```

### 类型解析顺序（MRO）

当参数类型没有精确匹配时，`singledispatch` 会按照方法解析顺序（MRO）查找最近的匹配类型：

```python
from functools import singledispatch

@singledispatch
def describe(obj):
    return f"Object: {obj}"

@describe.register(int)
def _(obj):
    return f"Integer: {obj}"

# bool 是 int 的子类
print(describe(True))   # 输出: Integer: True
print(describe(42))     # 输出: Integer: 42
print(describe("hi"))   # 输出: Object: hi
```

### 注册表结构

`singledispatch` 内部维护一个类型到函数的映射注册表：

```python
from functools import singledispatch

@singledispatch
def func(arg):
    pass

@func.register(int)
def _(arg):
    pass

@func.register(str)
def _(arg):
    pass

# 查看注册表
print(func.registry)
# 输出类似：mappingproxy({
#     <class 'object'>: <function func at ...>,
#     <class 'int'>: <function _ at ...>,
#     <class 'str'>: <function _ at ...>
# })
```

### 源码简化版实现

理解 `singledispatch` 的原理，可以看这个简化版实现：

```python
def simple_singledispatch(func):
    """singledispatch 的简化实现"""
    registry = {object: func}  # 注册表，object 对应默认实现

    def dispatch(cls):
        """查找指定类型的处理函数"""
        # 按 MRO 顺序查找
        for base in cls.__mro__:
            if base in registry:
                return registry[base]
        return registry[object]

    def register(cls):
        """注册新的类型处理函数"""
        def decorator(impl):
            registry[cls] = impl
            return impl
        return decorator

    def wrapper(arg, *args, **kwargs):
        """分派逻辑"""
        impl = dispatch(type(arg))
        return impl(arg, *args, **kwargs)

    wrapper.register = register
    wrapper.dispatch = dispatch
    wrapper.registry = registry

    return wrapper
```

---

## 核心要点

### @singledispatch 装饰器

```python
from functools import singledispatch

@singledispatch
def process(data):
    """
    基函数：定义默认行为
    当没有找到匹配的注册类型时，调用此函数
    """
    raise NotImplementedError(f"不支持处理类型: {type(data).__name__}")
```

### @register 注册器

有三种注册方式：

```python
from functools import singledispatch
from decimal import Decimal

@singledispatch
def format_value(value):
    return str(value)

# 方式 1：使用类型作为参数
@format_value.register(int)
def _(value):
    return f"{value:,}"

# 方式 2：使用类型注解（Python 3.7+，推荐）
@format_value.register
def _(value: float) -> str:
    return f"{value:.2f}"

# 方式 3：为多个类型注册同一实现
@format_value.register(Decimal)
@format_value.register(complex)
def _(value):
    return f"Special: {value}"

# 测试
print(format_value(1234567))      # 1,234,567
print(format_value(3.14159))      # 3.14
print(format_value(Decimal("0.1")))  # Special: 0.1
```

### dispatch() 方法

获取特定类型的处理函数：

```python
from functools import singledispatch

@singledispatch
def process(data):
    return "default"

@process.register(int)
def _(data):
    return "integer"

# 获取 int 类型的处理函数
int_handler = process.dispatch(int)
print(int_handler(42))  # integer

# 获取未注册类型的处理函数（返回默认）
list_handler = process.dispatch(list)
print(list_handler([1, 2, 3]))  # default
```

### registry 属性

查看所有注册的类型：

```python
from functools import singledispatch

@singledispatch
def process(data):
    pass

@process.register(int)
def _(data):
    pass

@process.register(str)
def _(data):
    pass

# 查看所有注册的类型
print(process.registry.keys())
# dict_keys([<class 'object'>, <class 'int'>, <class 'str'>])
```

### singledispatchmethod（Python 3.8+）

用于类方法的单分派：

```python
from functools import singledispatchmethod

class Processor:
    @singledispatchmethod
    def process(self, data):
        """默认处理方法"""
        raise NotImplementedError(f"不支持类型: {type(data)}")

    @process.register(int)
    def _(self, data):
        return f"处理整数: {data * 2}"

    @process.register(str)
    def _(self, data):
        return f"处理字符串: {data.upper()}"

    @process.register(list)
    def _(self, data):
        return f"处理列表: 共 {len(data)} 个元素"

# 使用
proc = Processor()
print(proc.process(42))          # 处理整数: 84
print(proc.process("hello"))     # 处理字符串: HELLO
print(proc.process([1, 2, 3]))   # 处理列表: 共 3 个元素
```

### 结合 classmethod 和 staticmethod

```python
from functools import singledispatchmethod

class Converter:
    @singledispatchmethod
    @classmethod
    def convert(cls, value):
        """类方法的单分派"""
        return str(value)

    @convert.register(int)
    @classmethod
    def _(cls, value):
        return f"Int: {value}"

    @convert.register(float)
    @classmethod
    def _(cls, value):
        return f"Float: {value:.2f}"

# 使用
print(Converter.convert(42))     # Int: 42
print(Converter.convert(3.14))   # Float: 3.14
```

---

## 代码示例

### 基础示例：数据序列化

```python
from functools import singledispatch
from datetime import datetime, date
from decimal import Decimal
import json

@singledispatch
def to_json_serializable(obj):
    """将对象转换为 JSON 可序列化的格式"""
    # 默认尝试使用对象的 __dict__
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    raise TypeError(f"无法序列化类型: {type(obj).__name__}")

@to_json_serializable.register(datetime)
def _(obj):
    """datetime 转为 ISO 格式字符串"""
    return obj.isoformat()

@to_json_serializable.register(date)
def _(obj):
    """date 转为 ISO 格式字符串"""
    return obj.isoformat()

@to_json_serializable.register(Decimal)
def _(obj):
    """Decimal 转为字符串以保持精度"""
    return str(obj)

@to_json_serializable.register(set)
def _(obj):
    """set 转为 list"""
    return list(obj)

@to_json_serializable.register(bytes)
def _(obj):
    """bytes 转为 base64 字符串"""
    import base64
    return base64.b64encode(obj).decode('ascii')

# 自定义 JSON 编码器
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            return to_json_serializable(obj)
        except TypeError:
            return super().default(obj)

# 测试
data = {
    'timestamp': datetime.now(),
    'date': date.today(),
    'price': Decimal('19.99'),
    'tags': {'python', 'programming'},
    'binary': b'hello'
}

print(json.dumps(data, cls=CustomEncoder, indent=2, ensure_ascii=False))
```

### 进阶示例：访问者模式

```python
from functools import singledispatch
from dataclasses import dataclass
from typing import List

# 定义 AST 节点
@dataclass
class NumberNode:
    value: float

@dataclass
class BinaryOpNode:
    operator: str
    left: 'Node'
    right: 'Node'

@dataclass
class UnaryOpNode:
    operator: str
    operand: 'Node'

Node = NumberNode | BinaryOpNode | UnaryOpNode

# 使用 singledispatch 实现访问者模式
@singledispatch
def evaluate(node: Node) -> float:
    """计算表达式树的值"""
    raise TypeError(f"未知节点类型: {type(node)}")

@evaluate.register(NumberNode)
def _(node: NumberNode) -> float:
    return node.value

@evaluate.register(BinaryOpNode)
def _(node: BinaryOpNode) -> float:
    left = evaluate(node.left)
    right = evaluate(node.right)

    match node.operator:
        case '+':
            return left + right
        case '-':
            return left - right
        case '*':
            return left * right
        case '/':
            return left / right
        case _:
            raise ValueError(f"未知运算符: {node.operator}")

@evaluate.register(UnaryOpNode)
def _(node: UnaryOpNode) -> float:
    operand = evaluate(node.operand)

    match node.operator:
        case '-':
            return -operand
        case '+':
            return operand
        case _:
            raise ValueError(f"未知一元运算符: {node.operator}")

# 另一个访问者：格式化表达式
@singledispatch
def format_expr(node: Node) -> str:
    """将表达式树转为字符串"""
    raise TypeError(f"未知节点类型: {type(node)}")

@format_expr.register(NumberNode)
def _(node: NumberNode) -> str:
    return str(node.value)

@format_expr.register(BinaryOpNode)
def _(node: BinaryOpNode) -> str:
    left = format_expr(node.left)
    right = format_expr(node.right)
    return f"({left} {node.operator} {right})"

@format_expr.register(UnaryOpNode)
def _(node: UnaryOpNode) -> str:
    operand = format_expr(node.operand)
    return f"({node.operator}{operand})"

# 构建表达式树: (3 + 4) * (-2)
expr = BinaryOpNode(
    '*',
    BinaryOpNode('+', NumberNode(3), NumberNode(4)),
    UnaryOpNode('-', NumberNode(2))
)

print(f"表达式: {format_expr(expr)}")  # 表达式: ((3 + 4) * (-2))
print(f"结果: {evaluate(expr)}")       # 结果: -14.0
```

### 实用示例：类型安全的配置加载

```python
from functools import singledispatch
from pathlib import Path
from typing import Any, Dict
import json

@singledispatch
def load_config(source) -> Dict[str, Any]:
    """
    从各种来源加载配置
    支持：字符串、Path、文件对象、字典
    """
    raise TypeError(f"不支持的配置来源类型: {type(source).__name__}")

@load_config.register(str)
def _(source: str) -> Dict[str, Any]:
    """从 JSON 字符串加载"""
    return json.loads(source)

@load_config.register(Path)
def _(source: Path) -> Dict[str, Any]:
    """从文件路径加载"""
    if not source.exists():
        raise FileNotFoundError(f"配置文件不存在: {source}")

    suffix = source.suffix.lower()
    content = source.read_text(encoding='utf-8')

    if suffix == '.json':
        return json.loads(content)
    elif suffix in ('.yaml', '.yml'):
        try:
            import yaml
            return yaml.safe_load(content)
        except ImportError:
            raise ImportError("加载 YAML 需要安装 pyyaml")
    elif suffix == '.toml':
        try:
            import tomllib  # Python 3.11+
        except ImportError:
            import tomli as tomllib
        return tomllib.loads(content)
    else:
        raise ValueError(f"不支持的配置文件格式: {suffix}")

@load_config.register(dict)
def _(source: dict) -> Dict[str, Any]:
    """直接使用字典"""
    return source.copy()

# 支持文件对象
from io import IOBase

@load_config.register(IOBase)
def _(source: IOBase) -> Dict[str, Any]:
    """从文件对象加载"""
    content = source.read()
    if isinstance(content, bytes):
        content = content.decode('utf-8')
    return json.loads(content)

# 使用示例
# 从字符串加载
config1 = load_config('{"debug": true, "port": 8080}')
print(f"从字符串: {config1}")

# 从字典加载
config2 = load_config({'debug': False, 'port': 3000})
print(f"从字典: {config2}")

# 从文件加载（假设文件存在）
# config3 = load_config(Path('config.json'))
```

### 高级示例：可扩展的格式化器

```python
from functools import singledispatchmethod
from datetime import datetime, date, timedelta
from typing import Optional
from decimal import Decimal

class Formatter:
    """
    可扩展的值格式化器
    支持通过 singledispatchmethod 为不同类型定义格式化逻辑
    """

    def __init__(self, locale: str = 'zh_CN'):
        self.locale = locale
        self._number_sep = ',' if locale.startswith('en') else ','

    @singledispatchmethod
    def format(self, value, **options) -> str:
        """
        格式化任意值

        Args:
            value: 要格式化的值
            **options: 格式化选项

        Returns:
            格式化后的字符串
        """
        return str(value)

    @format.register(int)
    def _(self, value: int, **options) -> str:
        """格式化整数，添加千分位分隔符"""
        return f"{value:,}".replace(',', self._number_sep)

    @format.register(float)
    def _(self, value: float, precision: int = 2, **options) -> str:
        """格式化浮点数"""
        formatted = f"{value:,.{precision}f}"
        return formatted.replace(',', self._number_sep)

    @format.register(Decimal)
    def _(self, value: Decimal, precision: Optional[int] = None, **options) -> str:
        """格式化 Decimal，保持精度"""
        if precision is not None:
            value = round(value, precision)
        return str(value)

    @format.register(datetime)
    def _(self, value: datetime, fmt: str = '%Y-%m-%d %H:%M:%S', **options) -> str:
        """格式化日期时间"""
        return value.strftime(fmt)

    @format.register(date)
    def _(self, value: date, fmt: str = '%Y-%m-%d', **options) -> str:
        """格式化日期"""
        return value.strftime(fmt)

    @format.register(timedelta)
    def _(self, value: timedelta, **options) -> str:
        """格式化时间间隔"""
        total_seconds = int(value.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        parts = []
        if hours:
            parts.append(f"{hours}小时")
        if minutes:
            parts.append(f"{minutes}分钟")
        if seconds or not parts:
            parts.append(f"{seconds}秒")

        return ''.join(parts)

    @format.register(bool)
    def _(self, value: bool, **options) -> str:
        """格式化布尔值"""
        return '是' if value else '否'

    @format.register(list)
    def _(self, value: list, sep: str = ', ', **options) -> str:
        """格式化列表"""
        return sep.join(self.format(item, **options) for item in value)

    @format.register(dict)
    def _(self, value: dict, **options) -> str:
        """格式化字典"""
        items = [f"{k}: {self.format(v, **options)}" for k, v in value.items()]
        return '{' + ', '.join(items) + '}'

# 使用示例
fmt = Formatter(locale='zh_CN')

print(fmt.format(1234567))                    # 1,234,567
print(fmt.format(3.14159, precision=3))       # 3.142
print(fmt.format(datetime.now()))             # 2026-01-07 10:30:00
print(fmt.format(timedelta(hours=2, minutes=30, seconds=45)))  # 2小时30分钟45秒
print(fmt.format(True))                       # 是
print(fmt.format([1, 2, 3]))                  # 1, 2, 3
print(fmt.format({'name': '张三', 'age': 30}))  # {name: 张三, age: 30}
```

---

## 最佳实践

### 为基函数提供清晰的默认行为

```python
from functools import singledispatch

# 好的做法：明确的默认行为
@singledispatch
def serialize(obj):
    """序列化对象为字符串"""
    # 提供有意义的默认实现或错误信息
    if hasattr(obj, '__dict__'):
        return str(obj.__dict__)
    raise TypeError(
        f"无法序列化类型 {type(obj).__name__}，"
        f"请使用 @serialize.register({type(obj).__name__}) 注册处理器"
    )

# 不好的做法：空的默认实现
@singledispatch
def bad_serialize(obj):
    pass  # 调用者不知道发生了什么
```

### 使用类型注解注册（Python 3.7+）

```python
from functools import singledispatch

@singledispatch
def process(data):
    return str(data)

# 推荐：使用类型注解
@process.register
def _(data: int) -> str:
    return f"整数: {data}"

# 不推荐：显式传递类型（虽然也有效）
@process.register(str)
def _(data):
    return f"字符串: {data}"
```

### 利用抽象基类注册

```python
from functools import singledispatch
from collections.abc import Mapping, Sequence, Set

@singledispatch
def describe_collection(obj):
    return f"未知集合: {type(obj)}"

@describe_collection.register(Mapping)
def _(obj):
    return f"映射类型，包含 {len(obj)} 个键值对"

@describe_collection.register(Sequence)
def _(obj):
    if isinstance(obj, str):  # str 也是 Sequence
        return f"字符串，长度 {len(obj)}"
    return f"序列类型，包含 {len(obj)} 个元素"

@describe_collection.register(Set)
def _(obj):
    return f"集合类型，包含 {len(obj)} 个元素"

# 测试
print(describe_collection({'a': 1}))    # 映射类型，包含 1 个键值对
print(describe_collection([1, 2, 3]))   # 序列类型，包含 3 个元素
print(describe_collection({1, 2, 3}))   # 集合类型，包含 3 个元素
print(describe_collection("hello"))     # 字符串，长度 5
```

### 保持函数命名一致性

```python
from functools import singledispatch

@singledispatch
def convert(value):
    """将值转换为标准格式"""
    return value

# 使用 _ 作为注册函数名（约定俗成）
@convert.register(str)
def _(value):
    return value.strip().lower()

# 或者使用描述性名称（便于调试）
@convert.register(list)
def convert_list(value):
    return [convert(item) for item in value]

# 可以通过 dispatch 获取特定函数
print(convert.dispatch(list).__name__)  # convert_list
```

### 为第三方类型注册处理器

```python
from functools import singledispatch
import numpy as np  # 假设安装了 numpy

@singledispatch
def to_python(obj):
    """将各种类型转换为 Python 原生类型"""
    return obj

# 注册第三方类型
@to_python.register(np.ndarray)
def _(obj):
    return obj.tolist()

@to_python.register(np.integer)
def _(obj):
    return int(obj)

@to_python.register(np.floating)
def _(obj):
    return float(obj)

# 这种方式允许在不修改第三方库的情况下扩展功能
```

### 组合使用 singledispatch 和工厂模式

```python
from functools import singledispatch
from typing import Protocol, runtime_checkable
from abc import ABC, abstractmethod

# 定义处理器接口
@runtime_checkable
class Handler(Protocol):
    def handle(self, data) -> str: ...

# 处理器工厂
@singledispatch
def get_handler(data) -> Handler:
    """获取数据类型对应的处理器"""
    return DefaultHandler()

class DefaultHandler:
    def handle(self, data) -> str:
        return f"默认处理: {data}"

class IntHandler:
    def handle(self, data: int) -> str:
        return f"整数处理: {data * 2}"

class StrHandler:
    def handle(self, data: str) -> str:
        return f"字符串处理: {data.upper()}"

@get_handler.register(int)
def _(data):
    return IntHandler()

@get_handler.register(str)
def _(data):
    return StrHandler()

# 使用
def process(data):
    handler = get_handler(data)
    return handler.handle(data)

print(process(42))       # 整数处理: 84
print(process("hello"))  # 字符串处理: HELLO
print(process([1, 2]))   # 默认处理: [1, 2]
```

---

## 常见陷阱

### 忘记字符串也是序列

```python
from functools import singledispatch
from collections.abc import Sequence

@singledispatch
def process(data):
    return str(data)

@process.register(Sequence)
def _(data):
    # 危险！字符串也会进入这里
    return [process(item) for item in data]

# 问题：处理字符串时会无限递归
# process("hello")  # RecursionError!

# 解决方案：显式处理字符串
@process.register(str)
def _(data):
    return data.upper()

# 或者在 Sequence 处理器中检查
@process.register(Sequence)
def _(data):
    if isinstance(data, str):
        return data.upper()
    return [process(item) for item in data]
```

### 类型注册顺序问题

```python
from functools import singledispatch

@singledispatch
def handle(obj):
    return "default"

# 注意：bool 是 int 的子类
@handle.register(int)
def _(obj):
    return "integer"

@handle.register(bool)
def _(obj):
    return "boolean"

# 结果取决于注册顺序和 MRO
print(handle(True))   # boolean（因为 bool 精确匹配）
print(handle(1))      # integer
```

### 无法根据多个参数分派

```python
from functools import singledispatch

@singledispatch
def add(a, b):
    """singledispatch 只检查第一个参数"""
    return a + b

@add.register(str)
def _(a, b):
    return f"{a} + {b}"

# b 的类型不会影响分派
print(add("hello", 123))  # "hello + 123"（调用 str 版本）
print(add(1, "world"))    # TypeError（调用默认版本，int + str 失败）

# 如需多参数分派，考虑使用第三方库如 multipledispatch
```

### singledispatchmethod 的装饰器顺序

```python
from functools import singledispatchmethod

class MyClass:
    # 错误顺序
    # @classmethod
    # @singledispatchmethod  # 这样不行
    # def wrong_method(cls, value):
    #     pass

    # 正确顺序：singledispatchmethod 在外层
    @singledispatchmethod
    @classmethod
    def correct_method(cls, value):
        return "default"

    @correct_method.register(int)
    @classmethod
    def _(cls, value):
        return f"int: {value}"
```

### 注册表修改的副作用

```python
from functools import singledispatch

@singledispatch
def process(data):
    return "default"

# 在模块级别注册
@process.register(int)
def _(data):
    return "int"

# 警告：后续注册会影响全局行为
def setup_special_processing():
    @process.register(str)
    def _(data):
        return "special string handling"

# 调用 setup_special_processing() 后，所有地方的 process(str) 行为都会改变
# 这可能导致难以追踪的 bug
```

### 类型检查工具的限制

```python
from functools import singledispatch

@singledispatch
def transform(data):
    return data

@transform.register(int)
def _(data):
    return data * 2

# mypy 和其他类型检查器可能无法正确推断返回类型
result = transform(42)  # 类型检查器可能认为返回 Any
```

---

## 性能考量

### 分派开销

```python
from functools import singledispatch
import timeit

@singledispatch
def dispatch_func(x):
    return x

@dispatch_func.register(int)
def _(x):
    return x * 2

def direct_func(x):
    return x * 2

# 性能对比
n = 1000000

dispatch_time = timeit.timeit(
    'dispatch_func(42)',
    globals={'dispatch_func': dispatch_func},
    number=n
)

direct_time = timeit.timeit(
    'direct_func(42)',
    globals={'direct_func': direct_func},
    number=n
)

print(f"singledispatch: {dispatch_time:.3f}s")
print(f"直接调用: {direct_time:.3f}s")
print(f"开销比: {dispatch_time / direct_time:.2f}x")

# 典型结果：singledispatch 约慢 2-3 倍
# 但对于大多数应用场景，这个开销可以忽略不计
```

### 缓存机制

`singledispatch` 内部会缓存类型到函数的映射，避免重复查找 MRO：

```python
from functools import singledispatch

@singledispatch
def process(data):
    return "default"

@process.register(int)
def _(data):
    return "int"

# 首次调用某类型会进行 MRO 查找
process(42)  # 查找并缓存

# 后续调用使用缓存
process(100)  # 直接从缓存获取
```

### 优化建议

```python
from functools import singledispatch

# 避免在热路径中使用复杂的分派
# 如果性能关键，考虑手动分派

# 对于频繁调用的类型，确保精确匹配
@singledispatch
def process(data):
    pass

# 精确类型匹配比 ABC 匹配快
@process.register(list)  # 比 register(Sequence) 快
def _(data):
    pass

# 预获取处理函数
handler = process.dispatch(int)
# 在循环中直接调用 handler 比每次调用 process 快
for item in large_int_list:
    handler(item)  # 避免每次分派
```

---

## 实战场景

### 场景 1：RESTful API 响应格式化

```python
from functools import singledispatch
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List
from enum import Enum

class ResponseStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"

@dataclass
class User:
    id: int
    name: str
    email: str
    created_at: datetime

@dataclass
class Product:
    id: int
    name: str
    price: float
    stock: int

@dataclass
class Order:
    id: int
    user_id: int
    products: List[Product]
    total: float
    created_at: datetime

@singledispatch
def format_response(data) -> Dict[str, Any]:
    """格式化 API 响应数据"""
    return {"data": data}

@format_response.register(User)
def _(data: User) -> Dict[str, Any]:
    return {
        "data": {
            "id": data.id,
            "name": data.name,
            "email": data.email,
            "member_since": data.created_at.strftime("%Y-%m-%d")
        },
        "type": "user"
    }

@format_response.register(Product)
def _(data: Product) -> Dict[str, Any]:
    return {
        "data": {
            "id": data.id,
            "name": data.name,
            "price": f"${data.price:.2f}",
            "in_stock": data.stock > 0,
            "stock_level": "充足" if data.stock > 10 else "紧张" if data.stock > 0 else "缺货"
        },
        "type": "product"
    }

@format_response.register(Order)
def _(data: Order) -> Dict[str, Any]:
    return {
        "data": {
            "id": data.id,
            "user_id": data.user_id,
            "items": [format_response(p)["data"] for p in data.products],
            "total": f"${data.total:.2f}",
            "ordered_at": data.created_at.isoformat()
        },
        "type": "order"
    }

@format_response.register(list)
def _(data: list) -> Dict[str, Any]:
    return {
        "data": [format_response(item)["data"] for item in data],
        "count": len(data)
    }

@format_response.register(Exception)
def _(data: Exception) -> Dict[str, Any]:
    return {
        "error": {
            "type": type(data).__name__,
            "message": str(data)
        },
        "status": ResponseStatus.ERROR.value
    }

# 使用示例
user = User(1, "张三", "zhang@example.com", datetime.now())
product = Product(101, "Python 编程指南", 59.99, 15)

print(format_response(user))
print(format_response(product))
print(format_response([product, product]))
print(format_response(ValueError("无效的参数")))
```

### 场景 2：日志格式化器

```python
from functools import singledispatch
from datetime import datetime
from typing import Any
import traceback
import json

@singledispatch
def format_log_value(value) -> str:
    """格式化日志中的值"""
    return repr(value)

@format_log_value.register(str)
def _(value: str) -> str:
    # 截断过长的字符串
    if len(value) > 200:
        return f'"{value[:200]}..." (truncated, total {len(value)} chars)'
    return f'"{value}"'

@format_log_value.register(bytes)
def _(value: bytes) -> str:
    if len(value) > 100:
        return f"<bytes, {len(value)} bytes>"
    return repr(value)

@format_log_value.register(dict)
def _(value: dict) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        return repr(value)

@format_log_value.register(list)
def _(value: list) -> str:
    if len(value) > 10:
        preview = [format_log_value(v) for v in value[:3]]
        return f"[{', '.join(preview)}, ... ({len(value)} items)]"
    return f"[{', '.join(format_log_value(v) for v in value)}]"

@format_log_value.register(Exception)
def _(value: Exception) -> str:
    return f"{type(value).__name__}: {value}"

@format_log_value.register(datetime)
def _(value: datetime) -> str:
    return value.isoformat()

class StructuredLogger:
    """结构化日志器"""

    def __init__(self, name: str):
        self.name = name

    def _format_message(self, level: str, message: str, **context) -> str:
        timestamp = datetime.now().isoformat()
        formatted_context = {k: format_log_value(v) for k, v in context.items()}

        parts = [
            f"[{timestamp}]",
            f"[{level}]",
            f"[{self.name}]",
            message
        ]

        if formatted_context:
            context_str = " ".join(f"{k}={v}" for k, v in formatted_context.items())
            parts.append(f"| {context_str}")

        return " ".join(parts)

    def info(self, message: str, **context):
        print(self._format_message("INFO", message, **context))

    def error(self, message: str, exc: Exception = None, **context):
        if exc:
            context['exception'] = exc
        print(self._format_message("ERROR", message, **context))

# 使用示例
logger = StructuredLogger("api")
logger.info("用户登录", user_id=123, ip="192.168.1.1")
logger.info("处理请求", data={"action": "query", "params": {"page": 1}})
logger.info("批量处理", items=list(range(20)))
logger.error("处理失败", exc=ValueError("无效的输入"), input_data="test")
```

### 场景 3：数据验证框架

```python
from functools import singledispatch
from dataclasses import dataclass, fields
from typing import Any, List, Dict, Optional, get_type_hints
from datetime import datetime
import re

@dataclass
class ValidationError:
    field: str
    message: str
    value: Any

@singledispatch
def validate(value, field_name: str = "value") -> List[ValidationError]:
    """验证值的有效性"""
    return []  # 默认通过

@validate.register(str)
def _(value: str, field_name: str = "value",
      min_length: int = 0, max_length: int = float('inf'),
      pattern: str = None) -> List[ValidationError]:
    errors = []

    if len(value) < min_length:
        errors.append(ValidationError(
            field_name,
            f"长度不能小于 {min_length}",
            value
        ))

    if len(value) > max_length:
        errors.append(ValidationError(
            field_name,
            f"长度不能大于 {max_length}",
            value
        ))

    if pattern and not re.match(pattern, value):
        errors.append(ValidationError(
            field_name,
            f"格式不匹配: {pattern}",
            value
        ))

    return errors

@validate.register(int)
@validate.register(float)
def _(value, field_name: str = "value",
      min_value: float = float('-inf'),
      max_value: float = float('inf')) -> List[ValidationError]:
    errors = []

    if value < min_value:
        errors.append(ValidationError(
            field_name,
            f"值不能小于 {min_value}",
            value
        ))

    if value > max_value:
        errors.append(ValidationError(
            field_name,
            f"值不能大于 {max_value}",
            value
        ))

    return errors

@validate.register(list)
def _(value: list, field_name: str = "value",
      min_items: int = 0, max_items: int = float('inf'),
      item_validator=None) -> List[ValidationError]:
    errors = []

    if len(value) < min_items:
        errors.append(ValidationError(
            field_name,
            f"至少需要 {min_items} 个元素",
            value
        ))

    if len(value) > max_items:
        errors.append(ValidationError(
            field_name,
            f"最多允许 {max_items} 个元素",
            value
        ))

    if item_validator:
        for i, item in enumerate(value):
            item_errors = item_validator(item, f"{field_name}[{i}]")
            errors.extend(item_errors)

    return errors

# 验证 dataclass
def validate_dataclass(obj) -> List[ValidationError]:
    """验证 dataclass 对象"""
    errors = []

    for field in fields(obj):
        value = getattr(obj, field.name)
        field_errors = validate(value, field.name)
        errors.extend(field_errors)

    return errors

# 使用示例
@dataclass
class UserRegistration:
    username: str
    email: str
    age: int
    tags: List[str]

# 创建验证规则
def validate_user(user: UserRegistration) -> List[ValidationError]:
    errors = []

    # 验证用户名
    errors.extend(validate(
        user.username,
        "username",
        min_length=3,
        max_length=20,
        pattern=r'^[a-zA-Z0-9_]+$'
    ))

    # 验证邮箱
    errors.extend(validate(
        user.email,
        "email",
        pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$'
    ))

    # 验证年龄
    errors.extend(validate(
        user.age,
        "age",
        min_value=0,
        max_value=150
    ))

    # 验证标签
    errors.extend(validate(
        user.tags,
        "tags",
        min_items=1,
        max_items=5
    ))

    return errors

# 测试
user1 = UserRegistration("ab", "invalid-email", -5, [])
errors = validate_user(user1)
for error in errors:
    print(f"字段 '{error.field}': {error.message}")
```

---

## 面试要点

### 什么是 singledispatch？它解决什么问题？

**参考答案：**

`singledispatch` 是 Python 的单分派泛型函数装饰器。它根据函数第一个参数的类型，自动选择对应的实现来执行。

解决的问题：
- 避免大量的 `if-elif-else` 类型判断
- 实现更清晰的代码组织（每个类型的处理逻辑独立）
- 支持开放-封闭原则（可以扩展新类型处理而不修改原函数）
- 提供类似其他语言函数重载的能力

### singledispatch 和传统的 isinstance 判断有什么区别？

**参考答案：**

| 方面 | isinstance 判断 | singledispatch |
|------|----------------|----------------|
| 代码组织 | 集中在一个函数内 | 分散到多个注册函数 |
| 扩展性 | 需要修改原函数 | 只需添加新的注册 |
| 可读性 | 长函数难以维护 | 每个实现独立清晰 |
| MRO 支持 | 需要手动处理 | 自动按 MRO 查找 |
| 第三方类型 | 需要修改原代码 | 可以在外部注册 |

### singledispatch 是如何处理继承关系的？

**参考答案：**

`singledispatch` 会按照 MRO（方法解析顺序）查找最匹配的类型：

```python
@singledispatch
def process(data):
    return "object"

@process.register(int)
def _(data):
    return "int"

# bool 是 int 的子类
print(process(True))  # 如果没有注册 bool，会调用 int 的实现
```

优先级：精确类型匹配 > MRO 中更近的类型 > 基函数

### singledispatch 和 singledispatchmethod 有什么区别？

**参考答案：**

- `singledispatch`：用于普通函数，根据第一个参数分派
- `singledispatchmethod`：用于类方法，根据第一个非 self/cls 参数分派

```python
from functools import singledispatch, singledispatchmethod

# 函数版本
@singledispatch
def process(data):
    pass

# 方法版本
class Processor:
    @singledispatchmethod
    def process(self, data):  # self 不参与分派
        pass
```

### 如何查看和调试 singledispatch 的注册表？

**参考答案：**

```python
@singledispatch
def func(data):
    pass

@func.register(int)
def _(data):
    pass

# 查看所有注册的类型
print(func.registry.keys())

# 获取特定类型的处理函数
handler = func.dispatch(int)

# 直接调用特定实现（绕过分派）
handler(42)
```

### singledispatch 有什么性能影响？如何优化？

**参考答案：**

性能影响：
- 分派本身有一定开销（类型查找、缓存检查）
- 大约比直接函数调用慢 2-3 倍

优化方法：
- 对于热路径，可以预先获取处理函数：`handler = func.dispatch(int)`
- 使用精确类型注册而非抽象基类
- 如果性能关键，考虑手动分派或其他方案

### singledispatch 能处理 Union 类型吗？

**参考答案：**

不能直接处理 Union 类型，需要分别注册：

```python
from typing import Union

@singledispatch
def process(data):
    pass

# 错误：不支持 Union
# @process.register(Union[int, str])

# 正确：分别注册
@process.register(int)
@process.register(str)
def _(data):
    pass
```

---

## 延伸阅读

### 官方文档

- [functools.singledispatch 官方文档](https://docs.python.org/3/library/functools.html#functools.singledispatch)
- [PEP 443 - Single-dispatch generic functions](https://peps.python.org/pep-0443/)

### 相关 PEP

- [PEP 443](https://peps.python.org/pep-0443/) - singledispatch 的设计文档
- [PEP 3124](https://peps.python.org/pep-3124/) - 被拒绝的多分派提案（了解设计取舍）

### 第三方库

- [multipledispatch](https://github.com/mrocklin/multipledispatch) - 支持多参数分派
- [plum](https://github.com/beartype/plum) - 更强大的多分派库，支持类型注解

### 推荐书籍

- 《流畅的 Python》第二版 - 第 9 章详细介绍了函数装饰器和闭包
- 《Python Cookbook》第三版 - 多个装饰器和元编程相关技巧

### 相关概念

- **访问者模式（Visitor Pattern）** - singledispatch 是其 Python 化的实现
- **双分派（Double Dispatch）** - 比单分派更复杂的分派机制
- **多态（Polymorphism）** - singledispatch 提供的是一种函数级别的多态
