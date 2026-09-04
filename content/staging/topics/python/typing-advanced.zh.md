---
title: Python 高级类型系统：Protocol、ParamSpec 与现代类型工具
description: 深入掌握 Python 高级类型注解：Protocol 结构化子类型、ParamSpec 参数规范、Concatenate、TypeVarTuple、Self 类型与 @overload 函数重载
track: python
section: typing-tooling
difficulty: advanced
tags:
  - Python
  - 类型注解
  - typing
  - Protocol
  - ParamSpec
  - 高级类型
status: imported
origin: old/src/content/docs/python/typing-advanced.zh.md
divergence: 0.201
issues: []
legacy:
  category: Python
  subcategory: 类型系统
  order: 13
  lastUpdated: 2026-01-07
---

Python 的类型系统在 3.8+ 版本后不断演进，引入了许多高级特性来支持更精确的类型表达。本文深入探讨 Protocol（结构化子类型）、ParamSpec（参数规范）、Concatenate、TypeVarTuple、Self 类型以及 @overload 函数重载等高级主题，帮助你构建类型安全且灵活的 Python 代码。

## 概念解释

### 什么是高级类型系统

Python 的高级类型系统建立在基础类型注解之上，提供了更强大的类型表达能力：

1. **Protocol（协议）**：实现结构化子类型（Structural Subtyping），允许基于对象的结构（方法和属性）而非继承关系来定义类型兼容性
2. **ParamSpec（参数规范）**：捕获和传递函数的完整参数签名，用于装饰器和高阶函数的精确类型标注
3. **Concatenate**：与 ParamSpec 配合，在参数签名前添加额外参数
4. **TypeVarTuple（类型变量元组）**：表示任意数量的类型变量，用于可变参数泛型
5. **Self 类型**：表示当前类本身的类型，解决方法链和工厂方法的返回类型问题
6. **@overload 装饰器**：为同一函数定义多个类型签名，实现基于参数类型的返回类型推断

### 为什么需要这些高级特性

- **Protocol**：解决 Python 鸭子类型与静态类型检查的矛盾
- **ParamSpec**：装饰器是 Python 的核心特性，需要精确传递被装饰函数的类型信息
- **TypeVarTuple**：处理 `*args` 和可变长度泛型容器
- **Self**：解决子类方法返回类型的继承问题
- **@overload**：表达函数根据输入类型返回不同类型的场景

## 核心原理

### 名义类型 vs 结构化类型

```python
# 名义类型（Nominal Typing）：基于类名和继承关系
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        pass

class Dog(Animal):  # 必须显式继承
    def speak(self) -> str:
        return "Woof!"

# 结构化类型（Structural Typing）：基于结构
from typing import Protocol

class Speaker(Protocol):
    def speak(self) -> str:
        ...

class Cat:  # 无需继承，只需实现相同方法
    def speak(self) -> str:
        return "Meow!"

def make_sound(speaker: Speaker) -> str:
    return speaker.speak()

# Cat 满足 Speaker 协议，类型检查通过
make_sound(Cat())
```

### ParamSpec 的工作机制

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec('P')
R = TypeVar('R')

# ParamSpec 捕获函数的完整参数签名
# P.args 表示位置参数
# P.kwargs 表示关键字参数

def decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("Before call")
        result = func(*args, **kwargs)
        print("After call")
        return result
    return wrapper

@decorator
def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

# 类型检查器知道 greet 的签名保持不变
result: str = greet("Alice", greeting="Hi")
```

## 核心要点

### Protocol 深入理解

| 特性 | 说明 |
|------|------|
| 隐式实现 | 类无需显式继承 Protocol，只需满足其结构 |
| 可继承 | Protocol 可以继承其他 Protocol |
| runtime_checkable | 使用装饰器后可用于 isinstance 检查 |
| 泛型支持 | Protocol 可以是泛型的 |

### ParamSpec 与 Concatenate 关系

| 组件 | 作用 |
|------|------|
| ParamSpec | 捕获完整参数签名 |
| P.args | 位置参数类型 |
| P.kwargs | 关键字参数类型 |
| Concatenate[X, P] | 在 P 前添加参数 X |

### 类型变量对比

| 类型变量 | 用途 | 引入版本 |
|----------|------|----------|
| TypeVar | 单个类型参数 | 3.5 |
| ParamSpec | 函数参数签名 | 3.10 |
| TypeVarTuple | 可变数量类型参数 | 3.11 |

### @overload 规则

- 必须至少有两个 @overload 装饰的签名
- 实际实现不使用 @overload 装饰
- 实现必须兼容所有重载签名
- 重载签名的函数体通常是 `...` 或 `pass`

## 代码示例

### Protocol 完整示例

```python
from typing import Protocol, runtime_checkable, TypeVar, Generic

# 基础 Protocol 定义
class Renderable(Protocol):
    """可渲染对象协议"""
    def render(self) -> str:
        """渲染为字符串"""
        ...

# 带属性的 Protocol
class Named(Protocol):
    """具名对象协议"""
    name: str

    def get_display_name(self) -> str:
        ...

# 可运行时检查的 Protocol
@runtime_checkable
class Closeable(Protocol):
    """可关闭资源协议"""
    def close(self) -> None:
        ...

# 泛型 Protocol
T_co = TypeVar('T_co', covariant=True)

class Reader(Protocol[T_co]):
    """读取器协议"""
    def read(self) -> T_co:
        ...

    def read_all(self) -> list[T_co]:
        ...

# Protocol 继承
class FileReader(Closeable, Reader[str], Protocol):
    """文件读取器协议：可关闭 + 字符串读取"""
    def get_path(self) -> str:
        ...

# ===== 实现类（无需继承 Protocol）=====

class HTMLElement:
    """HTML 元素"""
    def __init__(self, tag: str, content: str) -> None:
        self.tag = tag
        self.content = content

    def render(self) -> str:
        return f"<{self.tag}>{self.content}</{self.tag}>"

class User:
    """用户类"""
    def __init__(self, name: str, email: str) -> None:
        self.name = name
        self.email = email

    def get_display_name(self) -> str:
        return f"{self.name} <{self.email}>"

class DatabaseConnection:
    """数据库连接"""
    def __init__(self, conn_str: str) -> None:
        self.conn_str = conn_str
        self.connected = True

    def close(self) -> None:
        self.connected = False
        print("Connection closed")

class StringReader:
    """字符串读取器"""
    def __init__(self, data: list[str]) -> None:
        self._data = data
        self._index = 0

    def read(self) -> str:
        if self._index < len(self._data):
            result = self._data[self._index]
            self._index += 1
            return result
        return ""

    def read_all(self) -> list[str]:
        return self._data

# ===== 使用 Protocol 作为类型约束 =====

def render_items(items: list[Renderable]) -> str:
    """渲染所有可渲染项目"""
    return "\n".join(item.render() for item in items)

def greet_named(entity: Named) -> str:
    """问候具名实体"""
    return f"Hello, {entity.get_display_name()}!"

def safe_close(resource: Closeable) -> None:
    """安全关闭资源"""
    try:
        resource.close()
    except Exception as e:
        print(f"Error closing resource: {e}")

def read_first_n(reader: Reader[str], n: int) -> list[str]:
    """读取前 n 个项目"""
    return [reader.read() for _ in range(n)]

# ===== 运行时检查 =====

conn = DatabaseConnection("localhost")
if isinstance(conn, Closeable):
    print("DatabaseConnection 实现了 Closeable 协议")
    safe_close(conn)

# ===== 使用示例 =====

elements = [
    HTMLElement("h1", "Title"),
    HTMLElement("p", "Paragraph")
]
print(render_items(elements))
# 输出:
# <h1>Title</h1>
# <p>Paragraph</p>

user = User("Alice", "alice@example.com")
print(greet_named(user))
# 输出: Hello, Alice <alice@example.com>!

string_reader = StringReader(["line1", "line2", "line3"])
print(read_first_n(string_reader, 2))
# 输出: ['line1', 'line2']
```

### ParamSpec 装饰器示例

```python
from typing import ParamSpec, TypeVar, Callable, Any
from functools import wraps
import time
import logging

P = ParamSpec('P')
R = TypeVar('R')

# 基础装饰器：保持函数签名
def logged(func: Callable[P, R]) -> Callable[P, R]:
    """记录函数调用的装饰器"""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        logging.info(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        logging.info(f"{func.__name__} returned {result}")
        return result
    return wrapper

# 计时装饰器
def timed(func: Callable[P, R]) -> Callable[P, R]:
    """测量函数执行时间的装饰器"""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

# 重试装饰器
def retry(max_attempts: int = 3) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """带重试功能的装饰器"""
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_exception: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    print(f"Attempt {attempt + 1} failed: {e}")
            raise last_exception or RuntimeError("All attempts failed")
        return wrapper
    return decorator

# 缓存装饰器（返回类型修改示例）
T = TypeVar('T')

def cached(func: Callable[P, T]) -> Callable[P, T]:
    """简单缓存装饰器"""
    cache: dict[tuple[Any, ...], T] = {}

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        # 创建缓存键
        key = (args, tuple(sorted(kwargs.items())))
        if key not in cache:
            cache[key] = func(*args, **kwargs)
        return cache[key]
    return wrapper

# ===== 使用装饰器 =====

@logged
@timed
def calculate(x: int, y: int, operation: str = "add") -> float:
    """执行计算"""
    if operation == "add":
        return float(x + y)
    elif operation == "multiply":
        return float(x * y)
    else:
        raise ValueError(f"Unknown operation: {operation}")

@retry(max_attempts=3)
def fetch_data(url: str, timeout: int = 30) -> dict[str, Any]:
    """获取数据（模拟可能失败的操作）"""
    import random
    if random.random() < 0.5:
        raise ConnectionError("Network error")
    return {"url": url, "data": "content"}

@cached
def expensive_calculation(n: int) -> int:
    """昂贵的计算"""
    print(f"Computing for {n}")
    return sum(range(n))

# 类型检查器知道这些函数的确切签名
result1: float = calculate(10, 20, operation="multiply")
result2: dict[str, Any] = fetch_data("https://api.example.com", timeout=60)
result3: int = expensive_calculation(1000)
```

### Concatenate 高级用法

```python
from typing import ParamSpec, TypeVar, Callable, Concatenate
from functools import wraps

P = ParamSpec('P')
R = TypeVar('R')

# 在原有参数前添加参数
def with_context(
    func: Callable[Concatenate[str, P], R]
) -> Callable[P, R]:
    """自动注入上下文参数的装饰器"""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        context = "default_context"
        return func(context, *args, **kwargs)
    return wrapper

@with_context
def process_with_context(ctx: str, data: str, multiplier: int = 1) -> str:
    return f"[{ctx}] {data * multiplier}"

# 调用时不需要传递 ctx 参数
result = process_with_context("hello", multiplier=2)
# result: "[default_context] hellohello"

# ===== 方法装饰器：保留 self 参数 =====

class Service:
    def __init__(self, name: str) -> None:
        self.name = name

T = TypeVar('T', bound=Service)

def authenticated(
    func: Callable[Concatenate[T, P], R]
) -> Callable[Concatenate[T, P], R]:
    """验证用户身份的方法装饰器"""
    @wraps(func)
    def wrapper(self: T, *args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Authenticating for {self.name}")
        # 验证逻辑...
        return func(self, *args, **kwargs)
    return wrapper

class UserService(Service):
    @authenticated
    def get_user(self, user_id: int) -> dict[str, Any]:
        return {"id": user_id, "service": self.name}

    @authenticated
    def update_user(self, user_id: int, data: dict[str, str]) -> bool:
        print(f"Updating user {user_id} with {data}")
        return True

service = UserService("main")
user = service.get_user(123)  # 类型：dict[str, Any]
success = service.update_user(123, {"name": "Alice"})  # 类型：bool

# ===== 依赖注入模式 =====

from dataclasses import dataclass

@dataclass
class Database:
    connection_string: str

@dataclass
class Logger:
    name: str

def inject_dependencies(
    func: Callable[Concatenate[Database, Logger, P], R]
) -> Callable[P, R]:
    """注入数据库和日志依赖"""
    db = Database("postgresql://localhost/mydb")
    logger = Logger("app")

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(db, logger, *args, **kwargs)
    return wrapper

@inject_dependencies
def query_users(db: Database, logger: Logger, limit: int = 10) -> list[dict[str, Any]]:
    logger_msg = f"Querying users with limit {limit}"
    print(f"[{logger.name}] {logger_msg}")
    print(f"Using database: {db.connection_string}")
    return [{"id": i} for i in range(limit)]

# 调用时无需传递 db 和 logger
users = query_users(limit=5)  # 类型：list[dict[str, Any]]
```

### TypeVarTuple 可变泛型

```python
from typing import TypeVarTuple, Generic, TypeVar, Callable, Unpack

Ts = TypeVarTuple('Ts')
T = TypeVar('T')

# 泛型元组容器
class TypedTuple(Generic[Unpack[Ts]]):
    """类型安全的元组包装器"""
    def __init__(self, *values: Unpack[Ts]) -> None:
        self._values: tuple[Unpack[Ts]] = values

    def get_values(self) -> tuple[Unpack[Ts]]:
        return self._values

    def __repr__(self) -> str:
        return f"TypedTuple{self._values!r}"

# 使用：类型精确保留
t1: TypedTuple[int, str, float] = TypedTuple(1, "hello", 3.14)
values: tuple[int, str, float] = t1.get_values()

# ===== 可变参数函数组合 =====

def compose(*funcs: Callable[[T], T]) -> Callable[[T], T]:
    """组合多个相同签名的函数"""
    def composed(x: T) -> T:
        result = x
        for func in reversed(funcs):
            result = func(result)
        return result
    return composed

def double(x: int) -> int:
    return x * 2

def add_one(x: int) -> int:
    return x + 1

pipeline = compose(double, add_one, double)
result = pipeline(5)  # ((5 * 2) + 1) * 2 = 22

# ===== 张量类型（机器学习场景）=====

from typing import Generic

Shape = TypeVarTuple('Shape')

class Tensor(Generic[Unpack[Shape]]):
    """多维张量的类型安全表示"""
    def __init__(self, shape: tuple[Unpack[Shape]], data: list[float]) -> None:
        self._shape = shape
        self._data = data

    @property
    def shape(self) -> tuple[Unpack[Shape]]:
        return self._shape

    def reshape(self, *new_shape: Unpack[Shape]) -> 'Tensor[Unpack[Shape]]':
        """重塑张量形状"""
        return Tensor(new_shape, self._data)

# 类型精确的张量
tensor_2d: Tensor[int, int] = Tensor((3, 4), [0.0] * 12)
tensor_3d: Tensor[int, int, int] = Tensor((2, 3, 4), [0.0] * 24)

# ===== 数据库行类型 =====

class Row(Generic[Unpack[Ts]]):
    """数据库行的类型表示"""
    def __init__(self, *columns: Unpack[Ts]) -> None:
        self._columns = columns

    def get_column(self, index: int) -> Unpack[Ts]:  # 简化示例
        return self._columns[index]  # type: ignore

    def as_tuple(self) -> tuple[Unpack[Ts]]:
        return self._columns

# 类型安全的行
user_row: Row[int, str, str] = Row(1, "Alice", "alice@example.com")
id_val, name, email = user_row.as_tuple()
```

### Self 类型

```python
from typing import Self

# 方法链模式
class QueryBuilder:
    """SQL 查询构建器"""
    def __init__(self) -> None:
        self._table: str = ""
        self._columns: list[str] = []
        self._where_clauses: list[str] = []
        self._limit: int | None = None

    def select(self, *columns: str) -> Self:
        self._columns.extend(columns)
        return self

    def from_table(self, table: str) -> Self:
        self._table = table
        return self

    def where(self, condition: str) -> Self:
        self._where_clauses.append(condition)
        return self

    def limit(self, count: int) -> Self:
        self._limit = count
        return self

    def build(self) -> str:
        columns = ", ".join(self._columns) or "*"
        sql = f"SELECT {columns} FROM {self._table}"
        if self._where_clauses:
            sql += " WHERE " + " AND ".join(self._where_clauses)
        if self._limit:
            sql += f" LIMIT {self._limit}"
        return sql

# 子类正确继承返回类型
class PostgresQueryBuilder(QueryBuilder):
    """PostgreSQL 特定查询构建器"""
    def with_cte(self, name: str, query: str) -> Self:
        # PostgreSQL CTE 支持
        return self

# 类型检查器知道返回类型是具体子类
query: PostgresQueryBuilder = (
    PostgresQueryBuilder()
    .with_cte("users_cte", "SELECT * FROM users")
    .select("name", "email")
    .from_table("users_cte")
    .where("active = true")
    .limit(10)
)

# ===== 工厂方法模式 =====

from dataclasses import dataclass
import json

@dataclass
class Model:
    """基础模型类"""
    id: int

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        """从字典创建实例"""
        return cls(**data)

    @classmethod
    def from_json(cls, json_str: str) -> Self:
        """从 JSON 创建实例"""
        return cls.from_dict(json.loads(json_str))

@dataclass
class User(Model):
    """用户模型"""
    name: str
    email: str

@dataclass
class Product(Model):
    """产品模型"""
    name: str
    price: float

# Self 确保返回正确的子类类型
user: User = User.from_dict({"id": 1, "name": "Alice", "email": "a@example.com"})
product: Product = Product.from_json('{"id": 2, "name": "Widget", "price": 9.99}')

# ===== 单例模式 =====

class Singleton:
    """单例基类"""
    _instance: Self | None = None

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def get_instance(cls) -> Self:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

class ConfigManager(Singleton):
    """配置管理器单例"""
    def __init__(self) -> None:
        if not hasattr(self, '_initialized'):
            self.settings: dict[str, Any] = {}
            self._initialized = True

    def set(self, key: str, value: Any) -> Self:
        self.settings[key] = value
        return self

# 类型正确
config: ConfigManager = ConfigManager.get_instance()
config.set("debug", True).set("timeout", 30)

# ===== 比较：Self vs TypeVar =====

# 使用 TypeVar（Python 3.10 之前的方式）
from typing import TypeVar

T_Builder = TypeVar('T_Builder', bound='OldQueryBuilder')

class OldQueryBuilder:
    def where(self: T_Builder, condition: str) -> T_Builder:
        return self

# 使用 Self（Python 3.11+，更简洁）
class NewQueryBuilder:
    def where(self, condition: str) -> Self:
        return self
```

### @overload 函数重载

```python
from typing import overload, Literal, Union, Any

# ===== 基于参数类型的重载 =====

@overload
def process(data: str) -> str: ...

@overload
def process(data: bytes) -> bytes: ...

@overload
def process(data: int) -> int: ...

def process(data: str | bytes | int) -> str | bytes | int:
    """处理不同类型的数据"""
    if isinstance(data, str):
        return data.upper()
    elif isinstance(data, bytes):
        return data.upper()
    else:
        return data * 2

# 类型检查器推断正确的返回类型
text: str = process("hello")
binary: bytes = process(b"hello")
number: int = process(42)

# ===== 基于字面量参数的重载 =====

@overload
def fetch(url: str, format: Literal["json"]) -> dict[str, Any]: ...

@overload
def fetch(url: str, format: Literal["text"]) -> str: ...

@overload
def fetch(url: str, format: Literal["bytes"]) -> bytes: ...

def fetch(url: str, format: Literal["json", "text", "bytes"]) -> dict[str, Any] | str | bytes:
    """根据格式参数获取不同类型的响应"""
    # 实际实现
    if format == "json":
        return {"url": url}
    elif format == "text":
        return f"Content from {url}"
    else:
        return b"binary content"

# 类型推断
json_data: dict[str, Any] = fetch("https://api.example.com", "json")
text_data: str = fetch("https://example.com", "text")
binary_data: bytes = fetch("https://example.com/file", "bytes")

# ===== 可选参数重载 =====

@overload
def get_user(user_id: int) -> dict[str, Any]: ...

@overload
def get_user(user_id: int, fields: list[str]) -> dict[str, Any]: ...

@overload
def get_user(user_id: int, fields: list[str], include_meta: Literal[True]) -> tuple[dict[str, Any], dict[str, Any]]: ...

def get_user(
    user_id: int,
    fields: list[str] | None = None,
    include_meta: bool = False
) -> dict[str, Any] | tuple[dict[str, Any], dict[str, Any]]:
    """获取用户信息"""
    user_data = {"id": user_id, "name": "Alice"}
    if fields:
        user_data = {k: v for k, v in user_data.items() if k in fields}
    if include_meta:
        meta = {"retrieved_at": "2024-01-01"}
        return user_data, meta
    return user_data

# 不同调用方式得到不同类型
user1: dict[str, Any] = get_user(123)
user2: dict[str, Any] = get_user(123, ["name"])
user3: tuple[dict[str, Any], dict[str, Any]] = get_user(123, ["name"], True)

# ===== 类方法重载 =====

class DataParser:
    @overload
    def parse(self, data: str, as_type: type[int]) -> int: ...

    @overload
    def parse(self, data: str, as_type: type[float]) -> float: ...

    @overload
    def parse(self, data: str, as_type: type[bool]) -> bool: ...

    def parse(self, data: str, as_type: type) -> int | float | bool:
        """解析字符串为指定类型"""
        if as_type is int:
            return int(data)
        elif as_type is float:
            return float(data)
        elif as_type is bool:
            return data.lower() in ('true', '1', 'yes')
        raise TypeError(f"Unsupported type: {as_type}")

parser = DataParser()
int_val: int = parser.parse("42", int)
float_val: float = parser.parse("3.14", float)
bool_val: bool = parser.parse("true", bool)

# ===== 泛型重载 =====

from typing import TypeVar, Sequence

T = TypeVar('T')

@overload
def first(items: Sequence[T]) -> T | None: ...

@overload
def first(items: Sequence[T], default: T) -> T: ...

def first(items: Sequence[T], default: T | None = None) -> T | None:
    """获取序列的第一个元素"""
    if items:
        return items[0]
    return default

# 类型推断
nums = [1, 2, 3]
first_num: int | None = first(nums)
first_or_default: int = first(nums, 0)  # 有默认值时不可能是 None
```

### 综合实战：类型安全的事件系统

```python
from typing import (
    Protocol, ParamSpec, TypeVar, Callable, Generic,
    overload, Literal, Any, Self
)
from dataclasses import dataclass
from functools import wraps
import asyncio

P = ParamSpec('P')
R = TypeVar('R')
T = TypeVar('T')

# ===== 事件类型定义 =====

@dataclass
class UserCreatedEvent:
    user_id: int
    username: str
    email: str

@dataclass
class UserUpdatedEvent:
    user_id: int
    changes: dict[str, Any]

@dataclass
class OrderCreatedEvent:
    order_id: int
    user_id: int
    total: float

# 事件类型联合
Event = UserCreatedEvent | UserUpdatedEvent | OrderCreatedEvent

# ===== 事件处理器协议 =====

class EventHandler(Protocol[T]):
    """事件处理器协议"""
    def __call__(self, event: T) -> None:
        ...

class AsyncEventHandler(Protocol[T]):
    """异步事件处理器协议"""
    async def __call__(self, event: T) -> None:
        ...

# ===== 事件总线实现 =====

class EventBus:
    """类型安全的事件总线"""

    def __init__(self) -> None:
        self._handlers: dict[type, list[Callable[[Any], None]]] = {}
        self._async_handlers: dict[type, list[Callable[[Any], Any]]] = {}

    @overload
    def subscribe(
        self,
        event_type: type[UserCreatedEvent]
    ) -> Callable[[EventHandler[UserCreatedEvent]], EventHandler[UserCreatedEvent]]: ...

    @overload
    def subscribe(
        self,
        event_type: type[UserUpdatedEvent]
    ) -> Callable[[EventHandler[UserUpdatedEvent]], EventHandler[UserUpdatedEvent]]: ...

    @overload
    def subscribe(
        self,
        event_type: type[OrderCreatedEvent]
    ) -> Callable[[EventHandler[OrderCreatedEvent]], EventHandler[OrderCreatedEvent]]: ...

    def subscribe(
        self,
        event_type: type[T]
    ) -> Callable[[EventHandler[T]], EventHandler[T]]:
        """订阅事件的装饰器"""
        def decorator(handler: EventHandler[T]) -> EventHandler[T]:
            if event_type not in self._handlers:
                self._handlers[event_type] = []
            self._handlers[event_type].append(handler)
            return handler
        return decorator

    def subscribe_async(
        self,
        event_type: type[T]
    ) -> Callable[[AsyncEventHandler[T]], AsyncEventHandler[T]]:
        """订阅异步事件的装饰器"""
        def decorator(handler: AsyncEventHandler[T]) -> AsyncEventHandler[T]:
            if event_type not in self._async_handlers:
                self._async_handlers[event_type] = []
            self._async_handlers[event_type].append(handler)
            return handler
        return decorator

    def publish(self, event: Event) -> None:
        """发布事件"""
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            handler(event)

    async def publish_async(self, event: Event) -> None:
        """异步发布事件"""
        event_type = type(event)

        # 同步处理器
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            handler(event)

        # 异步处理器
        async_handlers = self._async_handlers.get(event_type, [])
        await asyncio.gather(*[handler(event) for handler in async_handlers])

# ===== 使用事件总线 =====

event_bus = EventBus()

@event_bus.subscribe(UserCreatedEvent)
def handle_user_created(event: UserCreatedEvent) -> None:
    print(f"User created: {event.username} (ID: {event.user_id})")

@event_bus.subscribe(UserCreatedEvent)
def send_welcome_email(event: UserCreatedEvent) -> None:
    print(f"Sending welcome email to {event.email}")

@event_bus.subscribe(OrderCreatedEvent)
def handle_order_created(event: OrderCreatedEvent) -> None:
    print(f"Order {event.order_id} created for user {event.user_id}, total: ${event.total}")

@event_bus.subscribe_async(UserCreatedEvent)
async def async_user_analytics(event: UserCreatedEvent) -> None:
    await asyncio.sleep(0.1)  # 模拟异步操作
    print(f"Analytics: New user {event.username}")

# 发布事件
event_bus.publish(UserCreatedEvent(
    user_id=1,
    username="alice",
    email="alice@example.com"
))

event_bus.publish(OrderCreatedEvent(
    order_id=100,
    user_id=1,
    total=99.99
))

# ===== 带中间件的事件处理 =====

class EventMiddleware(Protocol[T]):
    """事件中间件协议"""
    def process(
        self,
        event: T,
        next_handler: Callable[[T], None]
    ) -> None:
        ...

class LoggingMiddleware:
    """日志中间件"""
    def process(self, event: Event, next_handler: Callable[[Event], None]) -> None:
        print(f"[LOG] Processing event: {type(event).__name__}")
        next_handler(event)
        print(f"[LOG] Event processed: {type(event).__name__}")

class ValidationMiddleware:
    """验证中间件"""
    def process(self, event: Event, next_handler: Callable[[Event], None]) -> None:
        if isinstance(event, UserCreatedEvent):
            if not event.email or '@' not in event.email:
                raise ValueError("Invalid email")
        next_handler(event)

# ===== 类型安全的服务层 =====

class Serializable(Protocol):
    """可序列化协议"""
    def to_dict(self) -> dict[str, Any]:
        ...

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        ...

@dataclass
class UserDTO:
    id: int
    name: str
    email: str

    def to_dict(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "email": self.email}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        return cls(
            id=data["id"],
            name=data["name"],
            email=data["email"]
        )

S = TypeVar('S', bound=Serializable)

class Repository(Generic[S]):
    """通用仓库"""
    def __init__(self, entity_class: type[S]) -> None:
        self._entity_class = entity_class
        self._storage: dict[int, dict[str, Any]] = {}

    def save(self, entity: S) -> S:
        data = entity.to_dict()
        self._storage[data["id"]] = data
        return entity

    def find_by_id(self, entity_id: int) -> S | None:
        data = self._storage.get(entity_id)
        if data is None:
            return None
        return self._entity_class.from_dict(data)

    def find_all(self) -> list[S]:
        return [
            self._entity_class.from_dict(data)
            for data in self._storage.values()
        ]

# 使用
user_repo: Repository[UserDTO] = Repository(UserDTO)
user = UserDTO(id=1, name="Alice", email="alice@example.com")
saved_user: UserDTO = user_repo.save(user)
found_user: UserDTO | None = user_repo.find_by_id(1)
all_users: list[UserDTO] = user_repo.find_all()
```

## 最佳实践

### Protocol 设计原则

```python
from typing import Protocol, runtime_checkable

# 好：小而专注的协议
class Readable(Protocol):
    def read(self, size: int = -1) -> bytes:
        ...

class Writable(Protocol):
    def write(self, data: bytes) -> int:
        ...

class Seekable(Protocol):
    def seek(self, offset: int, whence: int = 0) -> int:
        ...

# 组合协议
class ReadWritable(Readable, Writable, Protocol):
    pass

# 避免：过大的协议
class BadFileProtocol(Protocol):  # 太多方法
    def read(self, size: int) -> bytes: ...
    def write(self, data: bytes) -> int: ...
    def seek(self, offset: int) -> int: ...
    def tell(self) -> int: ...
    def close(self) -> None: ...
    def flush(self) -> None: ...
    def fileno(self) -> int: ...
    # ... 更多方法
```

### ParamSpec 使用准则

```python
from typing import ParamSpec, TypeVar, Callable
from functools import wraps

P = ParamSpec('P')
R = TypeVar('R')

# 好：保持签名一致
def traced(func: Callable[P, R]) -> Callable[P, R]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

# 好：明确修改返回类型时使用新的 TypeVar
T = TypeVar('T')

def make_optional(func: Callable[P, T]) -> Callable[P, T | None]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        try:
            return func(*args, **kwargs)
        except Exception:
            return None
    return wrapper
```

### @overload 组织方式

```python
from typing import overload, Literal

# 好：重载按逻辑分组，实现紧跟其后
@overload
def create_connection(
    host: str,
    port: int,
    ssl: Literal[True]
) -> "SSLConnection": ...

@overload
def create_connection(
    host: str,
    port: int,
    ssl: Literal[False] = False
) -> "PlainConnection": ...

def create_connection(
    host: str,
    port: int,
    ssl: bool = False
) -> "SSLConnection | PlainConnection":
    if ssl:
        return SSLConnection(host, port)
    return PlainConnection(host, port)

# 好：为复杂重载添加文档
@overload
def parse_value(raw: str, target_type: type[int]) -> int:
    """将字符串解析为整数"""
    ...

@overload
def parse_value(raw: str, target_type: type[float]) -> float:
    """将字符串解析为浮点数"""
    ...
```

### Self 类型最佳实践

```python
from typing import Self
from dataclasses import dataclass

# 好：流式 API
@dataclass
class Config:
    debug: bool = False
    timeout: int = 30
    retries: int = 3

    def with_debug(self, enabled: bool = True) -> Self:
        return type(self)(
            debug=enabled,
            timeout=self.timeout,
            retries=self.retries
        )

    def with_timeout(self, seconds: int) -> Self:
        return type(self)(
            debug=self.debug,
            timeout=seconds,
            retries=self.retries
        )

# 子类自动获得正确的返回类型
class AdvancedConfig(Config):
    compression: bool = False

config: AdvancedConfig = (
    AdvancedConfig()
    .with_debug(True)
    .with_timeout(60)
)  # 类型是 AdvancedConfig，不是 Config
```

## 常见陷阱

### Protocol 的 runtime_checkable 限制

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class DataContainer(Protocol):
    data: list[int]  # 属性不会被 isinstance 检查！

    def get_data(self) -> list[int]:
        ...

class MyContainer:
    def __init__(self) -> None:
        self.data = [1, 2, 3]

    def get_data(self) -> list[int]:
        return self.data

class BadContainer:
    def get_data(self) -> list[int]:
        return []  # 没有 data 属性

container = BadContainer()
# 危险：这会返回 True，因为 isinstance 只检查方法
print(isinstance(container, DataContainer))  # True

# 正确做法：同时检查属性
def is_data_container(obj: object) -> bool:
    return (
        isinstance(obj, DataContainer) and
        hasattr(obj, 'data') and
        isinstance(obj.data, list)
    )
```

### ParamSpec 与 *args/**kwargs 的混淆

```python
from typing import ParamSpec, TypeVar, Callable, Any

P = ParamSpec('P')
R = TypeVar('R')

# 错误：混合使用 ParamSpec 和额外的 *args
def bad_decorator(func: Callable[P, R]) -> Callable[..., R]:  # 丢失类型信息
    def wrapper(*args: Any, **kwargs: Any) -> R:  # 错误
        return func(*args, **kwargs)
    return wrapper

# 正确：严格使用 P.args 和 P.kwargs
def good_decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper
```

### @overload 实现不匹配

```python
from typing import overload

# 错误：实现签名与重载不匹配
@overload
def process(x: int) -> int: ...

@overload
def process(x: str) -> str: ...

def process(x: int | str) -> int:  # 错误：返回类型不兼容
    return int(x)

# 正确：实现必须兼容所有重载
@overload
def process_correct(x: int) -> int: ...

@overload
def process_correct(x: str) -> str: ...

def process_correct(x: int | str) -> int | str:  # 正确
    if isinstance(x, int):
        return x * 2
    return x.upper()
```

### 泛型 Protocol 的类型擦除

```python
from typing import Protocol, TypeVar, Generic

T = TypeVar('T')

class Container(Protocol[T]):
    def get(self) -> T:
        ...

    def set(self, value: T) -> None:
        ...

# 错误：运行时无法获取泛型参数
def process_container(container: Container[int]) -> int:
    # 运行时 container 没有类型信息
    return container.get()

# 如需运行时类型信息，使用类型标记
from dataclasses import dataclass

@dataclass
class TypedContainer(Generic[T]):
    value: T
    value_type: type[T]  # 显式存储类型

    def get(self) -> T:
        return self.value
```

### Self 与类变量

```python
from typing import Self, ClassVar

class Counter:
    _instances: ClassVar[list["Counter"]] = []  # 注意：不能用 Self

    def __init__(self) -> None:
        Counter._instances.append(self)

    @classmethod
    def get_instances(cls) -> list[Self]:  # 这里可以用 Self
        return cls._instances  # type: ignore  # 需要忽略，因为列表元素类型不匹配

# 更好的设计
class BetterCounter:
    _instances: ClassVar[dict[type, list["BetterCounter"]]] = {}

    def __init__(self) -> None:
        cls = type(self)
        if cls not in BetterCounter._instances:
            BetterCounter._instances[cls] = []
        BetterCounter._instances[cls].append(self)

    @classmethod
    def get_instances(cls) -> list[Self]:
        return BetterCounter._instances.get(cls, [])  # type: ignore
```

## 性能考量

### Protocol 的性能影响

```python
from typing import Protocol, runtime_checkable
import timeit

@runtime_checkable
class Addable(Protocol):
    def __add__(self, other: Self) -> Self:
        ...

# isinstance 检查 Protocol 比普通类慢
class MyClass:
    def __add__(self, other: "MyClass") -> "MyClass":
        return self

obj = MyClass()

# 基准测试
def check_protocol():
    return isinstance(obj, Addable)

def check_type():
    return isinstance(obj, MyClass)

# Protocol 检查通常慢 10-50 倍
print(timeit.timeit(check_protocol, number=100000))
print(timeit.timeit(check_type, number=100000))

# 建议：避免在热路径中使用 runtime_checkable Protocol
# 更好的方式：在函数入口处做一次检查，或使用 TYPE_CHECKING
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Protocol

    class Addable(Protocol):
        def __add__(self, other: Self) -> Self: ...
```

### 类型注解的运行时开销

```python
from __future__ import annotations  # 延迟注解求值
from typing import TYPE_CHECKING

# 使用 __future__.annotations 可以：
# 避免运行时导入类型
# 减少循环导入问题
# 允许前向引用

if TYPE_CHECKING:
    # 这些导入只在类型检查时使用
    from expensive_module import ExpensiveClass
    from another_module import AnotherClass

class MyClass:
    # 类型注解是字符串，不会触发导入
    def process(self, data: "ExpensiveClass") -> "AnotherClass":
        pass
```

### 泛型的内存影响

```python
from typing import Generic, TypeVar

T = TypeVar('T')

# 每个泛型类的具体化都是同一个类
class Box(Generic[T]):
    def __init__(self, value: T) -> None:
        self.value = value

# Box[int] 和 Box[str] 在运行时是同一个类
print(Box[int] is Box[str])  # False（创建了新的 _GenericAlias）
print(Box[int].__origin__ is Box)  # True

# 但实例不会因为泛型参数而增加内存
int_box = Box[int](42)
str_box = Box[str]("hello")
print(type(int_box) is type(str_box))  # True，都是 Box
```

## 实战场景

### 场景一：API 客户端类型安全封装

```python
from typing import (
    Protocol, TypeVar, Generic, overload, Literal,
    ParamSpec, Callable, Any, Self
)
from dataclasses import dataclass
import json

# ===== 响应类型 =====

@dataclass
class User:
    id: int
    name: str
    email: str

@dataclass
class Product:
    id: int
    name: str
    price: float

@dataclass
class Order:
    id: int
    user_id: int
    products: list[Product]
    total: float

# ===== 响应包装器 =====

T = TypeVar('T')

@dataclass
class ApiResponse(Generic[T]):
    success: bool
    data: T | None
    error: str | None

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def fail(cls, error: str) -> "ApiResponse[T]":
        return cls(success=False, data=None, error=error)

# ===== 类型安全的 API 客户端 =====

class ApiClient:
    """类型安全的 API 客户端"""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    @overload
    def get(
        self,
        endpoint: Literal["/users/{id}"],
        *,
        id: int
    ) -> ApiResponse[User]: ...

    @overload
    def get(
        self,
        endpoint: Literal["/users"],
    ) -> ApiResponse[list[User]]: ...

    @overload
    def get(
        self,
        endpoint: Literal["/products/{id}"],
        *,
        id: int
    ) -> ApiResponse[Product]: ...

    @overload
    def get(
        self,
        endpoint: Literal["/orders/{id}"],
        *,
        id: int
    ) -> ApiResponse[Order]: ...

    def get(self, endpoint: str, **kwargs: Any) -> ApiResponse[Any]:
        """执行 GET 请求"""
        url = self.base_url + endpoint.format(**kwargs)
        # 实际 HTTP 请求逻辑...
        # 这里模拟返回
        if "/users/" in endpoint:
            return ApiResponse.ok(User(id=kwargs.get("id", 1), name="Alice", email="a@b.com"))
        elif endpoint == "/users":
            return ApiResponse.ok([User(id=1, name="Alice", email="a@b.com")])
        elif "/products/" in endpoint:
            return ApiResponse.ok(Product(id=kwargs.get("id", 1), name="Widget", price=9.99))
        elif "/orders/" in endpoint:
            return ApiResponse.ok(Order(
                id=kwargs.get("id", 1),
                user_id=1,
                products=[Product(id=1, name="Widget", price=9.99)],
                total=9.99
            ))
        return ApiResponse.fail("Unknown endpoint")

# 使用
client = ApiClient("https://api.example.com")

# 类型检查器知道返回类型
user_response: ApiResponse[User] = client.get("/users/{id}", id=123)
users_response: ApiResponse[list[User]] = client.get("/users")
product_response: ApiResponse[Product] = client.get("/products/{id}", id=456)
order_response: ApiResponse[Order] = client.get("/orders/{id}", id=789)

if user_response.success and user_response.data:
    user: User = user_response.data
    print(f"User: {user.name}")
```

### 场景二：类型安全的依赖注入容器

```python
from typing import Protocol, TypeVar, Generic, Callable, Any, overload, Self
from dataclasses import dataclass
from contextlib import contextmanager

T = TypeVar('T')
T_co = TypeVar('T_co', covariant=True)

# ===== 服务协议 =====

class Service(Protocol):
    """服务基础协议"""
    def initialize(self) -> None:
        ...

class Disposable(Protocol):
    """可销毁资源协议"""
    def dispose(self) -> None:
        ...

# ===== 生命周期管理 =====

from enum import Enum

class Lifetime(Enum):
    SINGLETON = "singleton"
    TRANSIENT = "transient"
    SCOPED = "scoped"

@dataclass
class ServiceDescriptor(Generic[T]):
    """服务描述符"""
    service_type: type[T]
    factory: Callable[["Container"], T]
    lifetime: Lifetime

# ===== 依赖注入容器 =====

class Container:
    """类型安全的依赖注入容器"""

    def __init__(self) -> None:
        self._descriptors: dict[type, ServiceDescriptor[Any]] = {}
        self._singletons: dict[type, Any] = {}
        self._scoped: dict[type, Any] = {}

    def register_singleton(
        self,
        service_type: type[T],
        factory: Callable[["Container"], T] | None = None
    ) -> Self:
        """注册单例服务"""
        if factory is None:
            factory = lambda c: service_type()  # type: ignore
        self._descriptors[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=Lifetime.SINGLETON
        )
        return self

    def register_transient(
        self,
        service_type: type[T],
        factory: Callable[["Container"], T] | None = None
    ) -> Self:
        """注册瞬态服务"""
        if factory is None:
            factory = lambda c: service_type()  # type: ignore
        self._descriptors[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=Lifetime.TRANSIENT
        )
        return self

    def register_scoped(
        self,
        service_type: type[T],
        factory: Callable[["Container"], T] | None = None
    ) -> Self:
        """注册作用域服务"""
        if factory is None:
            factory = lambda c: service_type()  # type: ignore
        self._descriptors[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=Lifetime.SCOPED
        )
        return self

    def resolve(self, service_type: type[T]) -> T:
        """解析服务"""
        if service_type not in self._descriptors:
            raise KeyError(f"Service {service_type} not registered")

        descriptor = self._descriptors[service_type]

        if descriptor.lifetime == Lifetime.SINGLETON:
            if service_type not in self._singletons:
                self._singletons[service_type] = descriptor.factory(self)
            return self._singletons[service_type]

        elif descriptor.lifetime == Lifetime.SCOPED:
            if service_type not in self._scoped:
                self._scoped[service_type] = descriptor.factory(self)
            return self._scoped[service_type]

        else:  # TRANSIENT
            return descriptor.factory(self)

    @contextmanager
    def create_scope(self):
        """创建新作用域"""
        old_scoped = self._scoped
        self._scoped = {}
        try:
            yield self
        finally:
            # 销毁作用域服务
            for service in self._scoped.values():
                if isinstance(service, Disposable):
                    service.dispose()
            self._scoped = old_scoped

# ===== 具体服务实现 =====

class DatabaseConnection:
    def __init__(self) -> None:
        self.connected = True
        print("Database connected")

    def initialize(self) -> None:
        pass

    def dispose(self) -> None:
        self.connected = False
        print("Database disconnected")

class UserRepository:
    def __init__(self, db: DatabaseConnection) -> None:
        self.db = db

    def initialize(self) -> None:
        pass

    def get_user(self, user_id: int) -> dict[str, Any]:
        return {"id": user_id, "name": "Alice"}

class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    def initialize(self) -> None:
        pass

    def get_user_info(self, user_id: int) -> str:
        user = self.repo.get_user(user_id)
        return f"User: {user['name']}"

# ===== 配置和使用 =====

container = (
    Container()
    .register_singleton(
        DatabaseConnection,
        lambda c: DatabaseConnection()
    )
    .register_scoped(
        UserRepository,
        lambda c: UserRepository(c.resolve(DatabaseConnection))
    )
    .register_transient(
        UserService,
        lambda c: UserService(c.resolve(UserRepository))
    )
)

# 类型安全的服务解析
db: DatabaseConnection = container.resolve(DatabaseConnection)
service: UserService = container.resolve(UserService)

with container.create_scope():
    scoped_service: UserService = container.resolve(UserService)
    print(scoped_service.get_user_info(123))
```

### 场景三：类型安全的状态机

```python
from typing import (
    Protocol, TypeVar, Generic, Callable, overload,
    Literal, Self, Any
)
from dataclasses import dataclass
from enum import Enum, auto

# ===== 订单状态定义 =====

class OrderState(Enum):
    PENDING = auto()
    CONFIRMED = auto()
    PROCESSING = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()

# ===== 状态转换约束 =====

# 使用类型系统约束有效的状态转换
StateFrom = TypeVar('StateFrom', bound=OrderState)
StateTo = TypeVar('StateTo', bound=OrderState)

@dataclass
class Transition(Generic[StateFrom, StateTo]):
    """状态转换"""
    from_state: StateFrom
    to_state: StateTo
    action: str

# ===== 订单状态机 =====

class Order:
    """订单实体"""

    def __init__(self, order_id: int) -> None:
        self.order_id = order_id
        self._state: OrderState = OrderState.PENDING
        self._history: list[tuple[OrderState, OrderState, str]] = []

    @property
    def state(self) -> OrderState:
        return self._state

    def _transition(self, new_state: OrderState, action: str) -> None:
        old_state = self._state
        self._state = new_state
        self._history.append((old_state, new_state, action))

    # 使用 overload 定义有效的状态转换
    @overload
    def transition(
        self: "Order",
        action: Literal["confirm"]
    ) -> "Order":
        """PENDING -> CONFIRMED"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["start_processing"]
    ) -> "Order":
        """CONFIRMED -> PROCESSING"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["ship"]
    ) -> "Order":
        """PROCESSING -> SHIPPED"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["deliver"]
    ) -> "Order":
        """SHIPPED -> DELIVERED"""
        ...

    @overload
    def transition(
        self: "Order",
        action: Literal["cancel"]
    ) -> "Order":
        """Any (except DELIVERED) -> CANCELLED"""
        ...

    def transition(self, action: str) -> "Order":
        """执行状态转换"""
        valid_transitions: dict[tuple[OrderState, str], OrderState] = {
            (OrderState.PENDING, "confirm"): OrderState.CONFIRMED,
            (OrderState.CONFIRMED, "start_processing"): OrderState.PROCESSING,
            (OrderState.PROCESSING, "ship"): OrderState.SHIPPED,
            (OrderState.SHIPPED, "deliver"): OrderState.DELIVERED,
            # 取消可以从多个状态触发
            (OrderState.PENDING, "cancel"): OrderState.CANCELLED,
            (OrderState.CONFIRMED, "cancel"): OrderState.CANCELLED,
            (OrderState.PROCESSING, "cancel"): OrderState.CANCELLED,
        }

        key = (self._state, action)
        if key not in valid_transitions:
            raise ValueError(
                f"Invalid transition: {self._state.name} --{action}--> ???"
            )

        new_state = valid_transitions[key]
        self._transition(new_state, action)
        return self

    def get_history(self) -> list[str]:
        """获取状态历史"""
        return [
            f"{old.name} --{action}--> {new.name}"
            for old, new, action in self._history
        ]

# ===== 使用状态机 =====

order = Order(order_id=12345)

# 类型安全的状态转换
order.transition("confirm")
order.transition("start_processing")
order.transition("ship")
order.transition("deliver")

print(f"Order {order.order_id} final state: {order.state.name}")
print("History:")
for entry in order.get_history():
    print(f"  {entry}")

# 输出:
# Order 12345 final state: DELIVERED
# History:
#   PENDING --confirm--> CONFIRMED
#   CONFIRMED --start_processing--> PROCESSING
#   PROCESSING --ship--> SHIPPED
#   SHIPPED --deliver--> DELIVERED
```

## 面试要点

### Protocol 与 ABC 的区别

**问题**：Protocol 和抽象基类（ABC）有什么区别？什么时候用哪个？

**答案**：
- **继承方式**：ABC 需要显式继承，Protocol 基于结构匹配
- **运行时行为**：ABC 的 isinstance 检查基于继承关系，Protocol 需要 @runtime_checkable
- **灵活性**：Protocol 可以对无法修改的第三方类进行类型标注
- **使用场景**：需要强制实现时用 ABC，鸭子类型检查用 Protocol

```python
# ABC：需要继承
from abc import ABC, abstractmethod

class Vehicle(ABC):
    @abstractmethod
    def drive(self) -> None:
        pass

class Car(Vehicle):  # 必须继承
    def drive(self) -> None:
        print("Driving car")

# Protocol：结构匹配
from typing import Protocol

class Drivable(Protocol):
    def drive(self) -> None:
        ...

class Bicycle:  # 无需继承
    def drive(self) -> None:
        print("Riding bicycle")

def start_vehicle(v: Drivable) -> None:
    v.drive()

start_vehicle(Bicycle())  # 类型检查通过
```

### ParamSpec 的实际应用

**问题**：解释 ParamSpec 的工作原理，以及为什么在装饰器中很重要？

**答案**：
ParamSpec 捕获函数的完整参数签名（包括位置参数、关键字参数、默认值），使装饰器能够保持被装饰函数的类型信息。

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec('P')
R = TypeVar('R')

# 没有 ParamSpec，装饰器会丢失类型信息
def bad_decorator(func: Callable[..., R]) -> Callable[..., R]:
    def wrapper(*args, **kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper

# 使用 ParamSpec，完整保留类型信息
def good_decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper
```

### @overload 的正确使用

**问题**：@overload 装饰器如何工作？写一个根据参数类型返回不同类型的函数。

**答案**：

```python
from typing import overload, Literal

@overload
def parse(data: str, as_json: Literal[True]) -> dict: ...

@overload
def parse(data: str, as_json: Literal[False]) -> str: ...

@overload
def parse(data: str) -> str: ...

def parse(data: str, as_json: bool = False) -> dict | str:
    if as_json:
        import json
        return json.loads(data)
    return data

# 类型推断
result1 = parse('{"a": 1}', True)   # dict
result2 = parse("hello", False)      # str
result3 = parse("hello")             # str
```

### Self 类型的优势

**问题**：Self 类型解决了什么问题？与使用 TypeVar 相比有什么优势？

**答案**：
Self 简化了返回当前类类型的方法标注，特别是在继承场景中。

```python
from typing import Self, TypeVar

# 旧方式：使用 TypeVar
T = TypeVar('T', bound='OldBuilder')

class OldBuilder:
    def set_name(self: T, name: str) -> T:
        return self

# 新方式：使用 Self（更简洁）
class NewBuilder:
    def set_name(self, name: str) -> Self:
        return self

# 子类自动获得正确类型
class AdvancedBuilder(NewBuilder):
    def set_priority(self, p: int) -> Self:
        return self

# builder 的类型是 AdvancedBuilder，不是 NewBuilder
builder = AdvancedBuilder().set_name("test").set_priority(1)
```

### TypeVarTuple 的使用场景

**问题**：TypeVarTuple 主要用于什么场景？举一个例子。

**答案**：
TypeVarTuple 用于表示可变数量的类型参数，常见于：
- 张量维度类型
- 可变长度元组
- *args 的精确类型

```python
from typing import TypeVarTuple, Generic, Unpack

Ts = TypeVarTuple('Ts')

class Tensor(Generic[Unpack[Ts]]):
    """类型安全的张量"""
    def __init__(self, shape: tuple[Unpack[Ts]]) -> None:
        self._shape = shape

    @property
    def shape(self) -> tuple[Unpack[Ts]]:
        return self._shape

# 精确的形状类型
t2d: Tensor[int, int] = Tensor((3, 4))
t3d: Tensor[int, int, int] = Tensor((2, 3, 4))
```

## 延伸阅读

### 官方文档

- [typing 模块文档](https://docs.python.org/3/library/typing.html)
- [PEP 544 - Protocols: Structural subtyping](https://peps.python.org/pep-0544/)
- [PEP 612 - Parameter Specification Variables](https://peps.python.org/pep-0612/)
- [PEP 646 - Variadic Generics](https://peps.python.org/pep-0646/)
- [PEP 673 - Self Type](https://peps.python.org/pep-0673/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)

### 类型检查工具

- [mypy 官方文档](https://mypy.readthedocs.io/)
- [pyright](https://github.com/microsoft/pyright)
- [Pyre](https://pyre-check.org/)

### 深入学习

- [Robust Python](https://www.oreilly.com/library/view/robust-python/9781098100667/) - Patrick Viafore
- [Python Type Checking (Real Python)](https://realpython.com/python-type-checking/)
- [Typing Best Practices](https://typing.readthedocs.io/en/latest/)

### 相关项目

- [typeguard](https://github.com/agronholm/typeguard) - 运行时类型检查
- [beartype](https://github.com/beartype/beartype) - 高性能运行时类型检查
- [pydantic](https://docs.pydantic.dev/) - 数据验证与设置管理

### 社区资源

- [Python typing 讨论](https://github.com/python/typing/discussions)
- [mypy issue tracker](https://github.com/python/mypy/issues)
- [typing-sig 邮件列表](https://mail.python.org/mailman3/lists/typing-sig.python.org/)
