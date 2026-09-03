---
title: Python Type Hints and Type System
description: "Master Python type hints: basic types, generics, Protocol and mypy"
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Type Hints
  - typing
  - mypy
status: imported
origin: old/src/content/docs/python/type-hints.zh.md
divergence: 0.222
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Type System
  order: 12
  lastUpdated: 2026-01-07
---

Python 是一门动态类型语言，但从 Python 3.5 开始引入了类型提示，提供可选的静态类型检查。本指南涵盖了 Python 类型系统的所有内容，从基础注解到高级特性。

## 类型提示简介

类型提示是用于指定变量、函数参数和返回值预期类型的注解。它们提供了以下好处：

- **更好的 IDE 支持**：代码补全、重构和错误检测
- **文档化**：代码自文档化，更易于理解
- **静态分析**：使用 mypy 等工具在运行前捕获错误
- **可维护性**：更容易维护大型代码库

重要提示：类型提示是可选的，不会影响运行时行为。Python 仍然是动态类型的。

```python
# 不使用类型提示
def greet(name):
    return f"Hello, {name}!"

# 使用类型提示
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

## 基本类型注解

### 基本类型

最常见的内置类型可以直接用作注解：

```python
# 基本类型
age: int = 25
price: float = 19.99
name: str = "Alice"
is_active: bool = True

# 带类型提示的函数
def add_numbers(a: int, b: int) -> int:
    return a + b

def calculate_discount(price: float, discount: float) -> float:
    return price * (1 - discount)
```

### None 类型

使用 `None` 表示函数不返回任何值，或使用 `Optional` 表示值可能为 `None`：

```python
from typing import Optional

def log_message(message: str) -> None:
    print(message)
    # 没有返回语句

def find_user(user_id: int) -> Optional[str]:
    # 可能返回用户名，如果未找到则返回 None
    if user_id == 1:
        return "Alice"
    return None

# Python 3.10+ 联合类型语法
def find_user_new(user_id: int) -> str | None:
    if user_id == 1:
        return "Alice"
    return None
```

### Any 类型

`Any` 是一种特殊类型，可以绕过类型检查：

```python
from typing import Any

def process_data(data: Any) -> Any:
    # 接受并返回任何类型
    return data

# 谨慎使用 - 这会使类型提示失去意义
```

## 复合类型

### 列表、元组、集合和字典

使用 `typing` 模块中的泛型容器类型（Python 3.9+ 允许直接使用内置类型）：

```python
from typing import List, Tuple, Set, Dict

# Python 3.8 及更早版本 - 使用 typing 模块
def process_numbers(numbers: List[int]) -> int:
    return sum(numbers)

def get_coordinates() -> Tuple[float, float]:
    return (40.7128, -74.0060)

def unique_names(names: List[str]) -> Set[str]:
    return set(names)

def count_items(items: List[str]) -> Dict[str, int]:
    return {item: items.count(item) for item in items}

# Python 3.9+ - 使用内置类型
def process_numbers_new(numbers: list[int]) -> int:
    return sum(numbers)

def get_user_data() -> dict[str, str | int]:
    return {"name": "Alice", "age": 30}
```

### 固定长度元组

元组可以为每个位置指定特定类型：

```python
from typing import Tuple

# 恰好 3 个元素：字符串、整数、布尔值
def parse_record() -> Tuple[str, int, bool]:
    return ("Alice", 30, True)

# 相同类型的可变长度元组
def get_scores() -> Tuple[int, ...]:
    return (95, 87, 92, 88)
```

### 联合类型

当值可以是多种类型之一时使用 `Union`：

```python
from typing import Union

def process_id(user_id: Union[int, str]) -> str:
    return str(user_id)

# Python 3.10+ 联合类型语法（推荐）
def process_id_new(user_id: int | str) -> str:
    return str(user_id)

# 多个联合类型
def flexible_function(value: int | str | float | None) -> str:
    if value is None:
        return "No value"
    return str(value)
```

### 可调用类型

函数和可调用对象的类型提示：

```python
from typing import Callable

def execute_operation(
    operation: Callable[[int, int], int],
    a: int,
    b: int
) -> int:
    return operation(a, b)

def add(x: int, y: int) -> int:
    return x + y

result = execute_operation(add, 5, 3)  # 返回 8

# 无参数的可调用对象
def run_callback(callback: Callable[[], None]) -> None:
    callback()

# 可变参数的可调用对象
from typing import Any
ComplexCallback = Callable[..., Any]
```

## TypeVar 和 Generic 泛型

泛型允许你编写灵活、可复用的代码，可以处理多种类型同时保持类型安全。

### TypeVar 基础

`TypeVar` 创建一个可以表示任何类型的类型变量：

```python
from typing import TypeVar, List

T = TypeVar('T')

def get_first_element(items: List[T]) -> T:
    return items[0]

# 类型检查器知道返回类型与输入类型匹配
numbers: List[int] = [1, 2, 3]
first_num: int = get_first_element(numbers)  # 类型是 int

names: List[str] = ["Alice", "Bob"]
first_name: str = get_first_element(names)  # 类型是 str
```

### 受约束的 TypeVar

将 `TypeVar` 限制为特定类型：

```python
from typing import TypeVar

# 只允许 int 或 float
Number = TypeVar('Number', int, float)

def double(value: Number) -> Number:
    return value * 2

result1 = double(5)      # 返回 int
result2 = double(5.5)    # 返回 float
# result3 = double("hi") # 类型错误！
```

### 有界的 TypeVar

使用边界要求类型变量必须是特定类的子类型：

```python
from typing import TypeVar

class Animal:
    def make_sound(self) -> str:
        return "Some sound"

class Dog(Animal):
    def make_sound(self) -> str:
        return "Woof!"

class Cat(Animal):
    def make_sound(self) -> str:
        return "Meow!"

AnimalType = TypeVar('AnimalType', bound=Animal)

def make_animal_speak(animal: AnimalType) -> AnimalType:
    print(animal.make_sound())
    return animal

dog = Dog()
cat = Cat()
make_animal_speak(dog)  # OK
make_animal_speak(cat)  # OK
# make_animal_speak("not an animal")  # 类型错误！
```

### 泛型类

创建可以处理多种类型的类：

```python
from typing import Generic, TypeVar, List, Optional

T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: List[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> Optional[T]:
        if self._items:
            return self._items.pop()
        return None

    def peek(self) -> Optional[T]:
        if self._items:
            return self._items[-1]
        return None

# 使用特定类型
int_stack: Stack[int] = Stack()
int_stack.push(1)
int_stack.push(2)
value: Optional[int] = int_stack.pop()

str_stack: Stack[str] = Stack()
str_stack.push("hello")
str_stack.push("world")
```

### 多个类型参数

泛型可以有多个类型变量：

```python
from typing import Generic, TypeVar

K = TypeVar('K')
V = TypeVar('V')

class Pair(Generic[K, V]):
    def __init__(self, key: K, value: V) -> None:
        self.key = key
        self.value = value

    def get_key(self) -> K:
        return self.key

    def get_value(self) -> V:
        return self.value

# 使用不同的类型组合
pair1: Pair[str, int] = Pair("age", 30)
pair2: Pair[int, str] = Pair(1, "first")
pair3: Pair[str, list[int]] = Pair("scores", [90, 85, 95])
```

## Protocol 结构化子类型

`Protocol` 实现结构化子类型（带类型检查的鸭子类型）。它不要求继承，而是检查对象是否具有所需的方法和属性。

### 基本 Protocol

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None:
        ...

class Circle:
    def draw(self) -> None:
        print("Drawing a circle")

class Square:
    def draw(self) -> None:
        print("Drawing a square")

def render(shape: Drawable) -> None:
    shape.draw()

# 两者都可以工作，无需继承 Drawable
circle = Circle()
square = Square()
render(circle)  # OK
render(square)  # OK
```

### 带属性的 Protocol

Protocol 可以同时指定方法和属性：

```python
from typing import Protocol

class SupportsClose(Protocol):
    def close(self) -> None:
        ...

class SupportsReadWrite(Protocol):
    encoding: str

    def read(self, n: int) -> str:
        ...

    def write(self, data: str) -> int:
        ...

class CustomFile:
    encoding: str = "utf-8"

    def read(self, n: int) -> str:
        return ""

    def write(self, data: str) -> int:
        return len(data)

    def close(self) -> None:
        pass

def process_file(file: SupportsReadWrite) -> None:
    content = file.read(100)
    print(f"Encoding: {file.encoding}")

custom = CustomFile()
process_file(custom)  # OK - 具有所需的方法和属性
```

### 泛型 Protocol

Protocol 可以是泛型的：

```python
from typing import Protocol, TypeVar

T = TypeVar('T')

class Comparable(Protocol):
    def __lt__(self, other: 'Comparable') -> bool:
        ...

    def __gt__(self, other: 'Comparable') -> bool:
        ...

def find_max(items: list[Comparable]) -> Comparable:
    return max(items)

# 适用于任何实现比较运算的类型
numbers = [1, 5, 3, 9, 2]
max_num = find_max(numbers)

strings = ["apple", "zebra", "banana"]
max_str = find_max(strings)
```

### 运行时可检查的 Protocol

使用 `@runtime_checkable` 启用 `isinstance()` 检查：

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Movable(Protocol):
    def move(self, x: int, y: int) -> None:
        ...

class Car:
    def move(self, x: int, y: int) -> None:
        print(f"Moving to ({x}, {y})")

class House:
    pass

car = Car()
house = House()

print(isinstance(car, Movable))    # True
print(isinstance(house, Movable))  # False
```

## TypedDict 类型化字典

`TypedDict` 允许你指定字典键的结构和类型：

### 基本 TypedDict

```python
from typing import TypedDict

class UserDict(TypedDict):
    name: str
    age: int
    email: str

def create_user(user: UserDict) -> None:
    print(f"Creating user: {user['name']}, age {user['age']}")

# 正确用法
user1: UserDict = {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com"
}
create_user(user1)

# 类型检查器会捕获错误
# user2: UserDict = {"name": "Bob"}  # 错误：缺少 'age' 和 'email'
# user3: UserDict = {"name": 123, "age": 30, "email": "test"}  # 错误：类型错误
```

### 可选键

使用 `total=False` 或 `NotRequired` 将键标记为可选：

```python
from typing import TypedDict, NotRequired

# 方法 1：total=False 使所有键都可选
class ConfigDict(TypedDict, total=False):
    host: str
    port: int
    debug: bool

config1: ConfigDict = {}  # OK
config2: ConfigDict = {"host": "localhost"}  # OK
config3: ConfigDict = {"host": "localhost", "port": 8080, "debug": True}  # OK

# 方法 2：NotRequired 用于特定可选键（Python 3.11+）
class UserProfile(TypedDict):
    name: str
    age: int
    bio: NotRequired[str]  # 只有 bio 是可选的
    avatar: NotRequired[str]  # 只有 avatar 是可选的

profile1: UserProfile = {"name": "Alice", "age": 30}  # OK
profile2: UserProfile = {"name": "Bob", "age": 25, "bio": "Developer"}  # OK
```

### 继承

TypedDict 类可以继承其他 TypedDict 类：

```python
from typing import TypedDict

class BaseUser(TypedDict):
    id: int
    name: str

class AdminUser(BaseUser):
    permissions: list[str]
    is_superuser: bool

admin: AdminUser = {
    "id": 1,
    "name": "Admin",
    "permissions": ["read", "write", "delete"],
    "is_superuser": True
}
```

### 替代语法

使用函数式语法处理动态键：

```python
from typing import TypedDict

# 基于类的语法
class Point2D(TypedDict):
    x: float
    y: float

# 函数式语法
Point3D = TypedDict('Point3D', {'x': float, 'y': float, 'z': float})

# 当键名不是有效标识符时很有用
SpecialDict = TypedDict('SpecialDict', {'special-key': str, '123': int})
```

## 字面量类型

`Literal` 允许你指定变量可以具有的确切值：

### 基本 Literal

```python
from typing import Literal

def set_mode(mode: Literal["light", "dark"]) -> None:
    print(f"Setting mode to {mode}")

set_mode("light")  # OK
set_mode("dark")   # OK
# set_mode("blue")  # 类型错误！

# 带字面量返回类型的函数
def get_status() -> Literal["success", "error", "pending"]:
    return "success"
```

### 数字和布尔值的 Literal

```python
from typing import Literal

def set_speed(speed: Literal[1, 2, 3, 4, 5]) -> None:
    print(f"Speed set to {speed}")

set_speed(3)   # OK
# set_speed(10)  # 类型错误！

def is_enabled(flag: Literal[True]) -> None:
    # 只接受 True，不接受 False
    print("Feature is enabled")

is_enabled(True)  # OK
# is_enabled(False)  # 类型错误！
```

### 组合 Literal

```python
from typing import Literal, Union

HttpMethod = Literal["GET", "POST", "PUT", "DELETE"]
Status = Literal[200, 201, 400, 404, 500]

def make_request(method: HttpMethod, status: Status) -> None:
    print(f"{method} request returned {status}")

make_request("GET", 200)  # OK
# make_request("PATCH", 200)  # 类型错误！

# 与 Union 组合
Mode = Literal["read"] | Literal["write"] | Literal["append"]
```

### 重载中的 Literal

Literal 与函数重载配合良好：

```python
from typing import Literal, overload

@overload
def open_file(path: str, mode: Literal["r"]) -> str:
    ...

@overload
def open_file(path: str, mode: Literal["rb"]) -> bytes:
    ...

def open_file(path: str, mode: Literal["r", "rb"]) -> str | bytes:
    if mode == "r":
        return "text content"
    else:
        return b"binary content"

text = open_file("file.txt", "r")      # 类型是 str
binary = open_file("file.bin", "rb")  # 类型是 bytes
```

## 类型别名

类型别名为复杂的类型注解创建快捷方式：

### 简单别名

```python
from typing import Union, List, Dict

# 简单别名
UserId = int
Username = str

def get_user(user_id: UserId) -> Username:
    return f"user_{user_id}"

# 复杂类型别名
Vector = List[float]
Matrix = List[Vector]

def multiply_matrix(matrix: Matrix) -> Matrix:
    return matrix

# Union 别名
Number = Union[int, float]
# 或在 Python 3.10+ 中
Number = int | float

def calculate(value: Number) -> Number:
    return value * 2
```

### NewType 创建不同类型

使用 `NewType` 创建不同的类型以防止意外混用：

```python
from typing import NewType

UserId = NewType('UserId', int)
ProductId = NewType('ProductId', int)

def get_user(user_id: UserId) -> str:
    return f"User {user_id}"

def get_product(product_id: ProductId) -> str:
    return f"Product {product_id}"

user_id = UserId(123)
product_id = ProductId(456)

get_user(user_id)      # OK
# get_user(product_id)  # 类型错误！不能用 ProductId 作为 UserId
# get_user(123)         # 类型错误！需要构造 UserId

# 运行时：NewType 只是一个返回其参数的函数
actual_id = user_id    # actual_id 在运行时只是 123
```

### 泛型类型别名

```python
from typing import TypeVar, List, Tuple, Dict

T = TypeVar('T')

# 泛型别名
Pair = Tuple[T, T]
Lookup = Dict[str, T]

def get_pair() -> Pair[int]:
    return (1, 2)

def get_lookup() -> Lookup[List[str]]:
    return {"fruits": ["apple", "banana"], "colors": ["red", "blue"]}
```

## 使用 mypy 进行类型检查

`mypy` 是 Python 最流行的静态类型检查器。它在不运行代码的情况下分析你的代码。

### 安装

```bash
pip install mypy
```

### 基本用法

```python
# example.py
def add(a: int, b: int) -> int:
    return a + b

result = add(5, "10")  # 类型错误！
```

运行 mypy：

```bash
mypy example.py
# 输出：example.py:4: error: Argument 2 to "add" has incompatible type "str"; expected "int"
```

### 配置

创建 `mypy.ini` 或 `pyproject.toml` 配置文件：

```ini
# mypy.ini
[mypy]
python_version = 3.11
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_any_generics = True
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
check_untyped_defs = True
strict_equality = True
```

或在 `pyproject.toml` 中：

```toml
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### 忽略错误

必要时使用 `# type: ignore` 注释：

```python
# 忽略特定行的错误
result = some_untyped_library()  # type: ignore

# 忽略特定错误代码
value: int = "text"  # type: ignore[assignment]

# 忽略整个文件
# type: ignore（放在文件顶部）
```

### 在项目中运行 mypy

```bash
# 检查单个文件
mypy script.py

# 检查目录
mypy src/

# 指定 Python 版本检查
mypy --python-version 3.11 src/

# 显示错误代码
mypy --show-error-codes src/

# 严格模式（所有可选检查）
mypy --strict src/

# 生成 HTML 报告
mypy --html-report ./mypy-report src/
```

### 存根文件

对于无类型的第三方库，使用存根文件（`.pyi`）：

```python
# mylib.pyi（存根文件）
def process_data(data: str) -> int: ...

class DataProcessor:
    def __init__(self, config: dict[str, str]) -> None: ...
    def run(self) -> bool: ...
```

为流行库安装类型存根：

```bash
# requests 库的存根
pip install types-requests

# 其他库的存根
pip install types-PyYAML types-redis
```

### 常用 mypy 选项

```bash
# 增量模式（重复运行时更快）
mypy --incremental src/

# 缓存目录
mypy --cache-dir=.mypy_cache src/

# 详细输出
mypy --verbose src/

# 不着色输出
mypy --no-color-output src/

# 跟踪导入
mypy --follow-imports=normal src/

# 跳过检查导入的模块
mypy --follow-imports=skip src/
```

## 最佳实践

### 循序渐进

你不需要一次性为所有代码添加类型：

```python
# 从函数签名开始
def process_user(name: str, age: int) -> dict:  # 返回类型可以稍后细化
    return {"name": name, "age": age}

# 逐步添加更具体的类型
from typing import TypedDict

class UserData(TypedDict):
    name: str
    age: int

def process_user_typed(name: str, age: int) -> UserData:
    return {"name": name, "age": age}
```

### 谨慎使用 Union

太多的联合类型会降低类型的实用性：

```python
# 避免
def process(value: int | str | float | list | dict | None) -> Any:
    pass

# 更好 - 更具体
from typing import Protocol

class Processable(Protocol):
    def to_string(self) -> str: ...

def process(value: Processable) -> str:
    return value.to_string()
```

### 优先使用 Protocol 而非抽象类

Protocol 更灵活：

```python
# 灵活性较低 - 需要继承
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        pass

# 更灵活 - 鸭子类型
from typing import Protocol

class Speakable(Protocol):
    def speak(self) -> str:
        ...

# 任何具有 speak() 方法的类都可以工作
class Dog:
    def speak(self) -> str:
        return "Woof"

def make_noise(animal: Speakable) -> None:
    print(animal.speak())

make_noise(Dog())  # 无需继承即可工作
```

### 为复杂类型编写文档

使用类型别名和注释处理复杂类型：

```python
from typing import Dict, List, Tuple, Callable

# 不使用别名 - 难以阅读
def process(
    data: Dict[str, List[Tuple[int, str]]],
    callback: Callable[[List[Tuple[int, str]]], Dict[str, int]]
) -> Dict[str, int]:
    pass

# 使用别名 - 更清晰
Record = Tuple[int, str]
RecordList = List[Record]
RecordDict = Dict[str, RecordList]
ProcessCallback = Callable[[RecordList], Dict[str, int]]

def process(data: RecordDict, callback: ProcessCallback) -> Dict[str, int]:
    """
    处理记录并应用回调。

    Args:
        data: 将键映射到 (id, value) 记录列表的字典
        callback: 处理记录列表的函数

    Returns:
        包含处理结果的字典
    """
    pass
```

### 使用 TYPE_CHECKING 解决循环导入

避免循环导入：

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # 只在类型检查时导入，运行时不导入
    from myapp.models import User

class UserManager:
    def get_user(self, user_id: int) -> 'User':  # 前向引用
        pass
```

### 利用现代 Python 特性

尽可能使用 Python 3.10+ 的联合类型语法：

```python
# 旧风格
from typing import Optional, Union, List

def process(value: Optional[Union[int, str]]) -> List[int]:
    pass

# 现代风格（Python 3.10+）
def process(value: int | str | None) -> list[int]:
    pass
```

### 验证运行时数据

类型提示不会验证运行时数据 - 需要配合验证库使用：

```python
from typing import TypedDict
from pydantic import BaseModel, validator

# TypedDict - 无运行时验证
class UserDict(TypedDict):
    name: str
    age: int

# Pydantic - 运行时验证
class User(BaseModel):
    name: str
    age: int

    @validator('age')
    def validate_age(cls, v):
        if v < 0:
            raise ValueError('Age must be positive')
        return v

# 这将在运行时失败
user = User(name="Alice", age=-5)  # ValidationError
```

### 在 CI/CD 中进行类型检查

将 mypy 添加到持续集成中：

```yaml
# .github/workflows/type-check.yml
name: Type Check

on: [push, pull_request]

jobs:
  mypy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install mypy
          pip install -r requirements.txt
      - name: Run mypy
        run: mypy src/
```

## 总结

Python 的类型系统为编写更安全、更易维护的代码提供了强大的工具：

- **基本类型** 用于简单注解
- **复合类型** 用于集合和联合类型
- **泛型** 用于可复用的类型安全组件
- **Protocol** 用于结构化子类型
- **TypedDict** 用于结构化字典
- **Literal** 用于精确值规范
- **mypy** 用于静态类型检查

从为关键函数添加类型开始，然后逐步扩大覆盖范围。在开发工作流和 CI/CD 流水线中使用 mypy 来尽早发现错误。请记住，类型提示是可选的 - 在它们能增加价值的地方使用，而不是默认在所有地方使用。

Python 的动态特性与可选的静态类型相结合，为你提供了两全其美的体验：快速开发的同时在需要时拥有类型检查的安全保障。
