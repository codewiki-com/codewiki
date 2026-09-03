---
title: 数据类(dataclasses)
description: Python dataclasses模块详解，自动生成特殊方法、字段选项与高级用法
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - dataclasses
  - 数据类
  - 类型注解
status: imported
origin: old/src/content/docs/python/dataclasses.zh.md
divergence: 0.252
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 15
  lastUpdated: 2026-01-07
---

`dataclasses` 模块是 Python 3.7 引入的标准库，它提供了一个装饰器和函数，用于自动为类添加特殊方法，如 `__init__()`、`__repr__()`、`__eq__()` 等。数据类大大简化了主要用于存储数据的类的定义。

## 基础用法

### @dataclass 装饰器

最简单的数据类只需要使用 `@dataclass` 装饰器和类型注解：

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

# 自动生成 __init__ 方法
p = Point(3.0, 4.0)
print(p)  # Point(x=3.0, y=4.0)

# 自动生成 __eq__ 方法
p1 = Point(1.0, 2.0)
p2 = Point(1.0, 2.0)
print(p1 == p2)  # True
```

### 自动生成的方法

默认情况下，`@dataclass` 装饰器会自动生成以下方法：

| 方法 | 说明 |
|------|------|
| `__init__()` | 初始化方法，按字段顺序接收参数 |
| `__repr__()` | 返回类名和所有字段的字符串表示 |
| `__eq__()` | 比较两个实例的所有字段是否相等 |

```python
from dataclasses import dataclass

@dataclass
class Book:
    title: str
    author: str
    price: float
    isbn: str

book = Book("Python编程", "张三", 59.9, "978-7-111-00000-0")
print(book)
# Book(title='Python编程', author='张三', price=59.9, isbn='978-7-111-00000-0')

# 相等性比较
book2 = Book("Python编程", "张三", 59.9, "978-7-111-00000-0")
print(book == book2)  # True
```

## 装饰器参数

`@dataclass` 装饰器接受多个参数来控制其行为：

```python
@dataclass(
    init=True,          # 是否生成 __init__ 方法
    repr=True,          # 是否生成 __repr__ 方法
    eq=True,            # 是否生成 __eq__ 方法
    order=False,        # 是否生成比较方法 (__lt__, __le__, __gt__, __ge__)
    unsafe_hash=False,  # 是否生成 __hash__ 方法
    frozen=False,       # 是否创建不可变实例
    match_args=True,    # Python 3.10+: 是否生成 __match_args__
    kw_only=False,      # Python 3.10+: 所有字段是否为仅关键字参数
    slots=False,        # Python 3.10+: 是否生成 __slots__
)
class MyClass:
    ...
```

### 启用排序功能

设置 `order=True` 可以启用实例之间的比较：

```python
from dataclasses import dataclass

@dataclass(order=True)
class Student:
    name: str
    score: float

students = [
    Student("小明", 85.5),
    Student("小红", 92.0),
    Student("小刚", 78.0),
]

# 可以进行排序（按字段顺序比较）
sorted_students = sorted(students)
for s in sorted_students:
    print(s)
# Student(name='小刚', score=78.0)
# Student(name='小明', score=85.5)
# Student(name='小红', score=92.0)
```

**注意**：比较时按字段定义的顺序逐个比较。如果想按特定字段排序，可以使用 `field()` 的 `compare` 参数。

### 使用 slots 优化内存

Python 3.10+ 支持 `slots=True`，可以减少内存占用并提高属性访问速度：

```python
from dataclasses import dataclass

@dataclass(slots=True)
class OptimizedPoint:
    x: float
    y: float
    z: float

# 无法动态添加属性
p = OptimizedPoint(1.0, 2.0, 3.0)
# p.w = 4.0  # 会抛出 AttributeError
```

## 字段默认值

### 简单默认值

可以直接为字段指定默认值：

```python
from dataclasses import dataclass

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False
    timeout: float = 30.0

# 使用默认值
config1 = Config()
print(config1)  # Config(host='localhost', port=8080, debug=False, timeout=30.0)

# 覆盖部分默认值
config2 = Config(port=3000, debug=True)
print(config2)  # Config(host='localhost', port=3000, debug=True, timeout=30.0)
```

**重要规则**：没有默认值的字段必须放在有默认值的字段之前：

```python
from dataclasses import dataclass

# 正确的字段顺序
@dataclass
class Person:
    name: str           # 无默认值，必须在前
    age: int            # 无默认值，必须在前
    city: str = "北京"  # 有默认值

# 错误的字段顺序 - 会报错
# @dataclass
# class WrongPerson:
#     city: str = "北京"  # 有默认值
#     name: str           # 无默认值 - TypeError!
```

### 可变默认值的陷阱

**警告**：不能直接使用可变对象（如列表、字典）作为默认值！

```python
from dataclasses import dataclass

# 错误做法 - 会报错
# @dataclass
# class WrongExample:
#     items: list = []  # ValueError: mutable default value

# 正确做法 - 使用 field() 和 default_factory
from dataclasses import field

@dataclass
class ShoppingCart:
    items: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

cart1 = ShoppingCart()
cart1.items.append("苹果")

cart2 = ShoppingCart()
print(cart2.items)  # []  - 每个实例有独立的列表
```

## field() 函数详解

`field()` 函数用于自定义字段的行为：

```python
from dataclasses import dataclass, field

@dataclass
class Product:
    name: str
    price: float
    # 默认工厂函数
    tags: list = field(default_factory=list)
    # 不包含在 repr 中
    internal_id: str = field(default="", repr=False)
    # 不参与比较
    description: str = field(default="", compare=False)
    # 不包含在 __init__ 参数中
    computed_value: float = field(init=False, default=0.0)
    # 仅关键字参数 (Python 3.10+)
    # category: str = field(kw_only=True, default="general")
```

### field() 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `default` | MISSING | 字段的默认值 |
| `default_factory` | MISSING | 生成默认值的可调用对象 |
| `init` | True | 是否包含在 `__init__` 参数中 |
| `repr` | True | 是否包含在 `__repr__` 输出中 |
| `compare` | True | 是否参与比较操作 |
| `hash` | None | 是否包含在 `__hash__` 计算中 |
| `metadata` | None | 字段的元数据字典 |
| `kw_only` | False | Python 3.10+: 是否为仅关键字参数 |

### 使用 metadata 存储额外信息

```python
from dataclasses import dataclass, field, fields

@dataclass
class Employee:
    name: str = field(metadata={"description": "员工姓名", "max_length": 50})
    age: int = field(metadata={"description": "员工年龄", "min": 18, "max": 65})
    salary: float = field(metadata={"description": "月薪", "currency": "CNY"})

# 访问字段元数据
for f in fields(Employee):
    print(f"{f.name}: {f.metadata}")
# name: {'description': '员工姓名', 'max_length': 50}
# age: {'description': '员工年龄', 'min': 18, 'max': 65}
# salary: {'description': '月薪', 'currency': 'CNY'}
```

### 控制排序行为

使用 `compare=False` 可以排除某些字段参与比较：

```python
from dataclasses import dataclass, field

@dataclass(order=True)
class Task:
    # 仅按优先级排序
    priority: int
    # 名称不参与排序比较
    name: str = field(compare=False)
    # 描述也不参与排序比较
    description: str = field(default="", compare=False)

tasks = [
    Task(3, "低优先级任务"),
    Task(1, "紧急任务"),
    Task(2, "普通任务"),
]

for task in sorted(tasks):
    print(f"[{task.priority}] {task.name}")
# [1] 紧急任务
# [2] 普通任务
# [3] 低优先级任务
```

## __post_init__ 方法

`__post_init__()` 方法在 `__init__()` 完成后自动调用，用于执行额外的初始化逻辑：

```python
from dataclasses import dataclass, field

@dataclass
class Rectangle:
    width: float
    height: float
    area: float = field(init=False)
    perimeter: float = field(init=False)

    def __post_init__(self):
        self.area = self.width * self.height
        self.perimeter = 2 * (self.width + self.height)

rect = Rectangle(10, 5)
print(f"面积: {rect.area}")      # 面积: 50
print(f"周长: {rect.perimeter}")  # 周长: 30
```

### 数据验证

```python
from dataclasses import dataclass

@dataclass
class User:
    username: str
    email: str
    age: int

    def __post_init__(self):
        if not self.username:
            raise ValueError("用户名不能为空")
        if "@" not in self.email:
            raise ValueError("邮箱格式不正确")
        if self.age < 0 or self.age > 150:
            raise ValueError("年龄必须在 0-150 之间")

# 正常创建
user = User("zhangsan", "zhangsan@example.com", 25)

# 验证失败会抛出异常
# User("", "invalid", -1)  # ValueError
```

### 使用 InitVar 传递初始化参数

`InitVar` 用于定义仅在初始化时使用的参数，不会成为实例属性：

```python
from dataclasses import dataclass, field, InitVar

@dataclass
class DatabaseConnection:
    host: str
    port: int
    # InitVar 字段仅用于初始化，不会成为实例属性
    password: InitVar[str]
    connection_string: str = field(init=False)

    def __post_init__(self, password: str):
        # password 仅在这里可用
        self.connection_string = f"mongodb://{self.host}:{self.port}?password={password}"

conn = DatabaseConnection("localhost", 27017, "secret123")
print(conn.connection_string)
# mongodb://localhost:27017?password=secret123

# password 不是实例属性
# print(conn.password)  # AttributeError
```

## 不可变数据类 (Frozen Dataclasses)

使用 `frozen=True` 创建不可变的数据类实例：

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class ImmutablePoint:
    x: float
    y: float

point = ImmutablePoint(3.0, 4.0)

# 尝试修改会抛出异常
# point.x = 5.0  # FrozenInstanceError

# 不可变对象可以作为字典键或集合元素
points_set = {point, ImmutablePoint(1.0, 2.0)}
points_dict = {point: "A点"}
```

### frozen 类的哈希

`frozen=True` 的数据类自动变为可哈希的：

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Color:
    r: int
    g: int
    b: int

red = Color(255, 0, 0)
green = Color(0, 255, 0)

# 可以作为字典键
color_names = {
    red: "红色",
    green: "绿色",
}

print(color_names[Color(255, 0, 0)])  # 红色
```

## 数据类的继承

数据类支持继承，子类会继承父类的所有字段：

```python
from dataclasses import dataclass

@dataclass
class Animal:
    name: str
    age: int

@dataclass
class Dog(Animal):
    breed: str
    is_trained: bool = False

dog = Dog("旺财", 3, "金毛")
print(dog)
# Dog(name='旺财', age=3, breed='金毛', is_trained=False)
```

### 继承时的字段顺序

子类的字段会追加到父类字段之后。注意默认值规则仍然适用：

```python
from dataclasses import dataclass, field

@dataclass
class Base:
    x: int
    y: int = 0  # 父类有默认值

@dataclass
class Child(Base):
    # 子类的必需字段会导致问题！
    # z: int  # TypeError: 无默认值的字段跟在有默认值的字段后面

    # 正确做法：子类字段也需要默认值
    z: int = 0

child = Child(1)
print(child)  # Child(x=1, y=0, z=0)
```

### 解决继承默认值冲突

使用 `field(kw_only=True)` (Python 3.10+) 或重新设计类结构：

```python
from dataclasses import dataclass, field

# Python 3.10+ 解决方案
@dataclass
class Base:
    x: int
    y: int = 0

@dataclass
class Child(Base):
    z: int = field(kw_only=True)  # 仅关键字参数

child = Child(1, z=5)
print(child)  # Child(x=1, y=0, z=5)
```

## 实用函数

### asdict() 和 astuple()

将数据类实例转换为字典或元组：

```python
from dataclasses import dataclass, asdict, astuple

@dataclass
class Person:
    name: str
    age: int
    city: str

person = Person("李四", 28, "上海")

# 转换为字典
person_dict = asdict(person)
print(person_dict)  # {'name': '李四', 'age': 28, 'city': '上海'}

# 转换为元组
person_tuple = astuple(person)
print(person_tuple)  # ('李四', 28, '上海')
```

嵌套数据类也会被递归转换：

```python
from dataclasses import dataclass, asdict

@dataclass
class Address:
    city: str
    street: str

@dataclass
class Company:
    name: str
    address: Address

company = Company("科技公司", Address("深圳", "科技路100号"))
print(asdict(company))
# {'name': '科技公司', 'address': {'city': '深圳', 'street': '科技路100号'}}
```

### fields() 获取字段信息

```python
from dataclasses import dataclass, field, fields

@dataclass
class Example:
    name: str
    value: int = 0
    items: list = field(default_factory=list)

# 获取所有字段信息
for f in fields(Example):
    print(f"字段名: {f.name}, 类型: {f.type}, 默认值: {f.default}")
```

### replace() 创建修改后的副本

```python
from dataclasses import dataclass, replace

@dataclass
class Config:
    host: str
    port: int
    debug: bool

config1 = Config("localhost", 8080, False)

# 创建修改后的副本
config2 = replace(config1, port=3000, debug=True)
print(config2)  # Config(host='localhost', port=3000, debug=True)

# 原实例不变
print(config1)  # Config(host='localhost', port=8080, debug=False)
```

### is_dataclass() 检查

```python
from dataclasses import dataclass, is_dataclass

@dataclass
class MyData:
    value: int

class RegularClass:
    pass

print(is_dataclass(MyData))        # True
print(is_dataclass(MyData(1)))     # True (实例也返回 True)
print(is_dataclass(RegularClass))  # False
```

## 与 namedtuple 的比较

| 特性 | dataclass | namedtuple |
|------|-----------|------------|
| 可变性 | 默认可变，可设置 frozen | 不可变 |
| 默认值 | 完全支持 | 有限支持 |
| 类型注解 | 必需 | 可选 |
| 方法定义 | 支持 | 支持但不便 |
| 继承 | 完全支持 | 有限支持 |
| 内存占用 | 较大 | 较小 |
| 元组解包 | 不支持 | 支持 |

### 代码对比

```python
from collections import namedtuple
from dataclasses import dataclass

# namedtuple 方式
PointTuple = namedtuple('PointTuple', ['x', 'y'])
pt = PointTuple(3, 4)
x, y = pt  # 可以解包
# pt.x = 5  # 不可变

# dataclass 方式
@dataclass
class PointClass:
    x: float
    y: float

pc = PointClass(3, 4)
pc.x = 5  # 可变
# x, y = pc  # 不能直接解包，需要用 astuple()
```

### 选择建议

- 使用 **namedtuple** 当：
  - 需要不可变的简单数据结构
  - 需要元组解包功能
  - 追求最小内存占用
  - 需要与需要元组的 API 兼容

- 使用 **dataclass** 当：
  - 需要可变的数据结构
  - 需要复杂的默认值逻辑
  - 需要添加自定义方法
  - 需要类继承
  - 需要数据验证

## 实际应用示例

### API 响应模型

```python
from dataclasses import dataclass, field, asdict
from typing import Optional, List
from datetime import datetime
import json

@dataclass
class ApiResponse:
    success: bool
    data: dict = field(default_factory=dict)
    message: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    errors: List[str] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False, indent=2)

# 成功响应
success_response = ApiResponse(
    success=True,
    data={"user_id": 123, "username": "张三"},
    message="获取用户信息成功"
)
print(success_response.to_json())

# 错误响应
error_response = ApiResponse(
    success=False,
    message="请求失败",
    errors=["用户不存在", "权限不足"]
)
print(error_response.to_json())
```

### 配置管理

```python
from dataclasses import dataclass, field, asdict
from typing import Optional
import json
import os

@dataclass
class DatabaseConfig:
    host: str = "localhost"
    port: int = 5432
    database: str = "myapp"
    username: str = "postgres"
    password: str = field(default="", repr=False)  # 不显示密码

    @property
    def connection_url(self) -> str:
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

@dataclass
class AppConfig:
    debug: bool = False
    secret_key: str = field(default="change-me", repr=False)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    allowed_hosts: list = field(default_factory=lambda: ["localhost"])

    @classmethod
    def from_env(cls) -> "AppConfig":
        """从环境变量加载配置"""
        return cls(
            debug=os.getenv("DEBUG", "false").lower() == "true",
            secret_key=os.getenv("SECRET_KEY", "change-me"),
            database=DatabaseConfig(
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "5432")),
                database=os.getenv("DB_NAME", "myapp"),
                username=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", ""),
            ),
        )

    def save(self, filepath: str):
        with open(filepath, "w") as f:
            json.dump(asdict(self), f, indent=2)

# 使用配置
config = AppConfig(debug=True)
print(config)
print(config.database.connection_url)
```

### 实体建模

```python
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

@dataclass
class OrderItem:
    product_id: str
    product_name: str
    quantity: int
    unit_price: float

    @property
    def total_price(self) -> float:
        return self.quantity * self.unit_price

@dataclass
class Order:
    customer_id: str
    items: List[OrderItem] = field(default_factory=list)
    order_id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    status: str = "pending"
    notes: Optional[str] = None

    def add_item(self, item: OrderItem):
        self.items.append(item)

    @property
    def total_amount(self) -> float:
        return sum(item.total_price for item in self.items)

    def __post_init__(self):
        if not self.customer_id:
            raise ValueError("客户ID不能为空")

# 创建订单
order = Order(customer_id="C001")
order.add_item(OrderItem("P001", "Python编程指南", 2, 59.9))
order.add_item(OrderItem("P002", "算法导论", 1, 128.0))

print(f"订单号: {order.order_id}")
print(f"订单总额: ¥{order.total_amount:.2f}")
for item in order.items:
    print(f"  - {item.product_name} x {item.quantity} = ¥{item.total_price:.2f}")
```

## 性能优化建议

1. **使用 slots=True** (Python 3.10+)：减少内存占用，加快属性访问

```python
@dataclass(slots=True)
class OptimizedData:
    x: int
    y: int
```

2. **避免不必要的 __post_init__**：如果不需要额外处理，不要定义空的 `__post_init__`

3. **使用 frozen=True**：当数据不需要修改时，冻结类可以提高性能并支持哈希

4. **选择性关闭功能**：如果不需要某些自动生成的方法，可以关闭它们

```python
@dataclass(repr=False, eq=False)
class MinimalData:
    value: int
```

## 总结

`dataclasses` 模块是 Python 中处理数据类的强大工具，它：

- **简化代码**：自动生成样板代码，减少重复
- **提高可读性**：清晰的字段定义和类型注解
- **灵活可控**：通过装饰器参数和 `field()` 函数精细控制行为
- **支持高级特性**：继承、不可变性、自定义初始化等

在现代 Python 开发中，数据类已成为定义数据结构的首选方式，特别适用于：

- API 请求/响应模型
- 配置对象
- 领域实体
- DTO (数据传输对象)
- 值对象

掌握 `dataclasses` 模块将帮助你编写更简洁、更 Pythonic 的代码。
