---
title: Python 元组与命名元组
description: 深入理解 Python 元组的不可变性、解包技巧、namedtuple 与 typing.NamedTuple 的使用场景
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - 元组
  - namedtuple
  - 数据结构
  - 不可变
status: imported
origin: old/src/content/docs/python/tuples.zh.md
divergence: 0.223
issues: []
legacy:
  category: Python
  subcategory: 数据结构
  order: 5
  lastUpdated: 2026-01-07
---

元组（Tuple）是 Python 中最基础的不可变序列类型，与列表类似但具有不可变性，这使其在特定场景下具有独特优势。命名元组（Named Tuple）则在元组基础上增加了字段名访问能力，兼具元组的高效和类的可读性。

## 概念解释

### 什么是元组

元组是 Python 内置的不可变序列类型，用圆括号 `()` 表示，元素之间用逗号分隔。元组一旦创建，其内容就不能被修改。

```python
# 创建元组的多种方式
t1 = (1, 2, 3)           # 使用圆括号
t2 = 1, 2, 3             # 不使用圆括号（元组打包）
t3 = tuple([1, 2, 3])    # 从列表转换
t4 = tuple("abc")        # 从字符串转换
t5 = ()                   # 空元组
t6 = (1,)                 # 单元素元组（注意逗号）

print(type(t1))  # <class 'tuple'>
print(t2)        # (1, 2, 3)
print(t4)        # ('a', 'b', 'c')
```

### 元组 vs 列表

| 特性 | 元组 (tuple) | 列表 (list) |
|------|-------------|-------------|
| 可变性 | 不可变 | 可变 |
| 语法 | `(1, 2, 3)` | `[1, 2, 3]` |
| 哈希性 | 可哈希（如果元素都可哈希） | 不可哈希 |
| 内存占用 | 较小 | 较大 |
| 创建速度 | 更快 | 较慢 |
| 用途 | 固定数据集合、字典键、函数返回值 | 动态数据集合 |

```python
import sys

# 内存对比
list_example = [1, 2, 3, 4, 5]
tuple_example = (1, 2, 3, 4, 5)

print(f"列表大小: {sys.getsizeof(list_example)} 字节")   # 约 104 字节
print(f"元组大小: {sys.getsizeof(tuple_example)} 字节")  # 约 80 字节
```

---

## 核心原理

### 不可变性的本质

元组的不可变性体现在：一旦创建，元组对象的元素引用不能被修改。但如果元素本身是可变对象，该对象的内容可以改变。

```python
# 元组元素引用不可变
t = (1, 2, 3)
# t[0] = 10  # TypeError: 'tuple' object does not support item assignment

# 但可变对象的内容可以改变
t = ([1, 2], [3, 4])
t[0].append(5)  # 合法操作
print(t)        # ([1, 2, 5], [3, 4])

# 理解：元组存储的是引用，引用不变，但引用指向的对象可变
```

### 元组的内存布局

元组在 CPython 中是一个紧凑的对象数组，相比列表省去了动态扩容的额外空间预留。

```python
import sys

# 空元组是单例对象
empty1 = ()
empty2 = ()
print(empty1 is empty2)  # True

# 小整数元组可能被缓存
t1 = (1, 2, 3)
t2 = (1, 2, 3)
print(t1 is t2)  # 可能为 True（取决于实现）

# 元组的内存结构更紧凑
for n in range(0, 6):
    t = tuple(range(n))
    print(f"元素数量 {n}: {sys.getsizeof(t)} 字节")
```

### 哈希性

元组可以作为字典的键或集合的元素，前提是其所有元素都是可哈希的。

```python
# 元组作为字典键
coordinates = {}
coordinates[(0, 0)] = "原点"
coordinates[(3, 4)] = "某点"
print(coordinates[(0, 0)])  # 原点

# 元组作为集合元素
points = {(0, 0), (1, 1), (2, 2)}
print((1, 1) in points)  # True

# 包含可变对象的元组不可哈希
t = ([1, 2], 3)
# hash(t)  # TypeError: unhashable type: 'list'
```

---

## 核心要点

### 元组创建与访问

```python
# 创建元组
empty = ()                # 空元组
single = (42,)            # 单元素元组（必须有逗号）
multi = (1, 2, 3, 4, 5)   # 多元素元组
nested = ((1, 2), (3, 4)) # 嵌套元组
mixed = (1, "hello", 3.14, True)  # 混合类型

# 索引访问
print(multi[0])    # 1
print(multi[-1])   # 5
print(nested[0])   # (1, 2)
print(nested[0][1])  # 2

# 切片操作
print(multi[1:4])   # (2, 3, 4)
print(multi[::2])   # (1, 3, 5)
print(multi[::-1])  # (5, 4, 3, 2, 1)
```

### 元组方法

元组只有两个方法：`count()` 和 `index()`。

```python
t = (1, 2, 3, 2, 4, 2, 5)

# count() - 统计元素出现次数
print(t.count(2))  # 3
print(t.count(6))  # 0

# index() - 查找元素首次出现的索引
print(t.index(3))  # 2
print(t.index(2))  # 1

# 带范围的 index
print(t.index(2, 2))     # 3 (从索引2开始搜索)
print(t.index(2, 2, 5))  # 3 (在索引2-5范围搜索)

# 元素不存在会抛出 ValueError
# t.index(10)  # ValueError: tuple.index(x): x not in tuple
```

### 元组解包

元组解包是 Python 的强大特性，允许将元组的元素直接赋值给多个变量。

```python
# 基本解包
point = (3, 4)
x, y = point
print(f"x={x}, y={y}")  # x=3, y=4

# 多变量解包
person = ("Alice", 30, "Engineer")
name, age, job = person
print(f"{name} is {age} years old")  # Alice is 30 years old

# 使用 * 收集剩余元素
first, *rest = (1, 2, 3, 4, 5)
print(first)  # 1
print(rest)   # [2, 3, 4, 5]

*beginning, last = (1, 2, 3, 4, 5)
print(beginning)  # [1, 2, 3, 4]
print(last)       # 5

first, *middle, last = (1, 2, 3, 4, 5)
print(first)   # 1
print(middle)  # [2, 3, 4]
print(last)    # 5

# 忽略某些值
x, _, z = (1, 2, 3)  # 忽略中间值
print(x, z)  # 1 3

# 嵌套解包
data = (1, (2, 3), 4)
a, (b, c), d = data
print(a, b, c, d)  # 1 2 3 4
```

### 变量交换

Python 中元组解包可以优雅地实现变量交换：

```python
a = 10
b = 20

# 传统方式（需要临时变量）
# temp = a
# a = b
# b = temp

# Python 方式（利用元组打包和解包）
a, b = b, a
print(f"a={a}, b={b}")  # a=20, b=10

# 多变量交换
x, y, z = 1, 2, 3
x, y, z = z, x, y
print(x, y, z)  # 3 1 2
```

### 元组拼接与重复

```python
# 拼接
t1 = (1, 2, 3)
t2 = (4, 5, 6)
t3 = t1 + t2
print(t3)  # (1, 2, 3, 4, 5, 6)

# 重复
t = (1, 2) * 3
print(t)  # (1, 2, 1, 2, 1, 2)

# 成员检测
print(2 in t1)   # True
print(10 in t1)  # False

# 长度
print(len(t3))  # 6

# 最大值、最小值、求和
nums = (5, 2, 8, 1, 9)
print(max(nums))  # 9
print(min(nums))  # 1
print(sum(nums))  # 25
```

---

## 代码示例

### 函数多返回值

元组是函数返回多个值的惯用方式：

```python
def get_stats(numbers):
    """计算统计信息，返回多个值"""
    if not numbers:
        return None, None, None, None

    total = sum(numbers)
    count = len(numbers)
    average = total / count
    return min(numbers), max(numbers), average, total

# 使用返回的元组
data = [10, 20, 30, 40, 50]
min_val, max_val, avg, total = get_stats(data)
print(f"最小值: {min_val}, 最大值: {max_val}, 平均值: {avg}, 总和: {total}")

# 也可以直接作为元组使用
result = get_stats(data)
print(f"统计结果: {result}")
```

### 作为字典键

```python
# 使用元组作为坐标键
grid = {}
for x in range(3):
    for y in range(3):
        grid[(x, y)] = x * 3 + y

print(grid)
# {(0, 0): 0, (0, 1): 1, (0, 2): 2, (1, 0): 3, ...}

# 查找特定坐标
print(grid[(1, 1)])  # 4

# 实际应用：稀疏矩阵
sparse_matrix = {
    (0, 0): 1,
    (0, 5): 2,
    (3, 2): 3,
    (100, 100): 4
}

def get_value(matrix, row, col, default=0):
    return matrix.get((row, col), default)

print(get_value(sparse_matrix, 0, 5))   # 2
print(get_value(sparse_matrix, 1, 1))   # 0 (默认值)
```

### 排序中使用元组

```python
# 按多个条件排序
students = [
    ("Alice", 85, 22),
    ("Bob", 90, 21),
    ("Charlie", 85, 23),
    ("David", 90, 20),
]

# 按成绩降序，成绩相同按年龄升序
sorted_students = sorted(students, key=lambda s: (-s[1], s[2]))
print(sorted_students)
# [('David', 90, 20), ('Bob', 90, 21), ('Alice', 85, 22), ('Charlie', 85, 23)]

# 使用元组进行比较
print((1, 2, 3) < (1, 2, 4))  # True (逐元素比较)
print((1, 2, 3) < (1, 3, 0))  # True (在第二个元素处就决定了)
print((1, 2) < (1, 2, 0))     # True (较短的元组较小)
```

### 枚举和并行迭代

```python
# 使用 enumerate 返回元组
colors = ["red", "green", "blue"]
for index, color in enumerate(colors):
    print(f"{index}: {color}")

# 使用 zip 并行迭代
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
cities = ["NYC", "LA", "Chicago"]

for name, age, city in zip(names, ages, cities):
    print(f"{name} ({age}) lives in {city}")

# zip 返回元组的迭代器
pairs = list(zip(names, ages))
print(pairs)  # [('Alice', 25), ('Bob', 30), ('Charlie', 35)]
```

---

## namedtuple - 命名元组

`collections.namedtuple` 创建具有命名字段的元组子类，使代码更具可读性，同时保持元组的性能优势。

### 基本用法

```python
from collections import namedtuple

# 创建命名元组类
Point = namedtuple('Point', ['x', 'y'])

# 也可以用逗号或空格分隔的字符串
Point2 = namedtuple('Point2', 'x, y')
Point3 = namedtuple('Point3', 'x y')

# 创建实例
p = Point(3, 4)
print(p)        # Point(x=3, y=4)
print(p.x)      # 3 (属性访问)
print(p.y)      # 4
print(p[0])     # 3 (索引访问)
print(p[1])     # 4

# 解包
x, y = p
print(f"x={x}, y={y}")  # x=3, y=4
```

### 默认值（Python 3.7+）

```python
from collections import namedtuple

# 设置默认值
Person = namedtuple('Person', ['name', 'age', 'city'], defaults=['Unknown', 0, 'N/A'])

# 从右向左应用默认值
p1 = Person('Alice')           # Person(name='Alice', age=0, city='N/A')
p2 = Person('Bob', 25)         # Person(name='Bob', age=25, city='N/A')
p3 = Person('Charlie', 30, 'NYC')  # Person(name='Charlie', age=30, city='NYC')

print(p1)
print(p2)
print(p3)

# 查看默认值
print(Person._field_defaults)  # {'age': 0, 'city': 'N/A'}
```

### 内置方法

```python
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)

# _make() - 从可迭代对象创建实例
data = [5, 6]
p2 = Point._make(data)
print(p2)  # Point(x=5, y=6)

# _asdict() - 转换为字典
d = p._asdict()
print(d)  # {'x': 3, 'y': 4}

# _replace() - 创建替换指定字段的新实例（不修改原实例）
p3 = p._replace(x=10)
print(p3)  # Point(x=10, y=4)
print(p)   # Point(x=3, y=4) - 原实例不变

# _fields - 查看字段名
print(Point._fields)  # ('x', 'y')
```

### 继承 namedtuple

```python
from collections import namedtuple
import math

# 基本的命名元组
_Point = namedtuple('Point', ['x', 'y'])

# 继承并添加方法
class Point(_Point):
    """二维点类，支持数学运算"""

    __slots__ = ()  # 防止创建实例字典，保持内存效率

    @property
    def distance_from_origin(self):
        """计算到原点的距离"""
        return math.sqrt(self.x ** 2 + self.y ** 2)

    def __add__(self, other):
        """向量加法"""
        return Point(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """向量减法"""
        return Point(self.x - other.x, self.y - other.y)

    def __str__(self):
        return f"Point({self.x}, {self.y})"

    def distance_to(self, other):
        """计算到另一个点的距离"""
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)

# 使用增强的 Point 类
p1 = Point(3, 4)
p2 = Point(6, 8)

print(p1.distance_from_origin)  # 5.0
print(p1 + p2)  # Point(9, 12)
print(p1.distance_to(p2))  # 5.0
```

---

## typing.NamedTuple - 类型化命名元组

`typing.NamedTuple` 是 Python 3.5+ 引入的更现代的命名元组定义方式，支持类型注解。

### 基本语法

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

# 创建实例
p = Point(3.0, 4.0)
print(p)        # Point(x=3.0, y=4.0)
print(p.x)      # 3.0
print(p[0])     # 3.0

# 类型检查工具（如 mypy）可以进行类型检查
# p = Point("3", "4")  # mypy 会报错
```

### 默认值

```python
from typing import NamedTuple, Optional

class Person(NamedTuple):
    name: str
    age: int = 0
    city: str = "Unknown"
    email: Optional[str] = None

# 使用默认值
p1 = Person("Alice")
p2 = Person("Bob", 30)
p3 = Person("Charlie", 25, "NYC", "charlie@example.com")

print(p1)  # Person(name='Alice', age=0, city='Unknown', email=None)
print(p2)  # Person(name='Bob', age=30, city='Unknown', email=None)
print(p3)  # Person(name='Charlie', age=25, city='NYC', email='charlie@example.com')
```

### 添加方法和文档

```python
from typing import NamedTuple
import math

class Vector(NamedTuple):
    """二维向量类"""
    x: float
    y: float

    @property
    def magnitude(self) -> float:
        """计算向量的模"""
        return math.sqrt(self.x ** 2 + self.y ** 2)

    def normalized(self) -> 'Vector':
        """返回单位向量"""
        mag = self.magnitude
        if mag == 0:
            return Vector(0, 0)
        return Vector(self.x / mag, self.y / mag)

    def dot(self, other: 'Vector') -> float:
        """点积"""
        return self.x * other.x + self.y * other.y

    def __add__(self, other: 'Vector') -> 'Vector':
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar: float) -> 'Vector':
        return Vector(self.x * scalar, self.y * scalar)

# 使用
v1 = Vector(3, 4)
v2 = Vector(1, 0)

print(v1.magnitude)     # 5.0
print(v1.normalized())  # Vector(x=0.6, y=0.8)
print(v1.dot(v2))       # 3.0
print(v1 + v2)          # Vector(x=4, y=4)
print(v1 * 2)           # Vector(x=6, y=8)
```

### collections.namedtuple vs typing.NamedTuple

| 特性 | collections.namedtuple | typing.NamedTuple |
|------|----------------------|-------------------|
| 语法 | 函数调用 | 类定义 |
| 类型注解 | 不支持 | 原生支持 |
| 默认值 | Python 3.7+ 支持 | 原生支持 |
| 添加方法 | 需要继承 | 直接在类中定义 |
| IDE 支持 | 较弱 | 更好的代码补全 |
| Python 版本 | 2.6+ | 3.5+ |

```python
from collections import namedtuple
from typing import NamedTuple

# collections.namedtuple 方式
Point1 = namedtuple('Point1', ['x', 'y'])

# typing.NamedTuple 方式
class Point2(NamedTuple):
    x: float
    y: float

# 两者功能基本相同
p1 = Point1(3, 4)
p2 = Point2(3.0, 4.0)

print(p1._fields)  # ('x', 'y')
print(p2._fields)  # ('x', 'y')

print(p1._asdict())  # {'x': 3, 'y': 4}
print(p2._asdict())  # {'x': 3.0, 'y': 4.0}
```

---

## 最佳实践

### 何时使用元组

```python
# 函数返回多个值
def parse_coordinate(coord_str):
    """解析坐标字符串"""
    parts = coord_str.split(',')
    return float(parts[0]), float(parts[1])

x, y = parse_coordinate("3.5,4.2")

# 作为字典键
cache = {}
def expensive_computation(a, b, c):
    key = (a, b, c)
    if key not in cache:
        cache[key] = a * b * c  # 模拟耗时计算
    return cache[key]

# 存储不应修改的数据
WEEKDAYS = ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
RGB_RED = (255, 0, 0)

# 作为常量配置
DATABASE_CONFIG = ('localhost', 5432, 'mydb')
```

### 何时使用 namedtuple

```python
from collections import namedtuple

# 需要字段名访问的轻量级数据结构
User = namedtuple('User', ['id', 'name', 'email'])
user = User(1, 'Alice', 'alice@example.com')
print(user.name)  # 比 user[1] 更清晰

# 替代简单的类
# 不推荐
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# 推荐
Point = namedtuple('Point', ['x', 'y'])

# 数据库行记录
Row = namedtuple('Row', ['id', 'name', 'created_at'])
rows = [
    Row(1, 'Item 1', '2024-01-01'),
    Row(2, 'Item 2', '2024-01-02'),
]
for row in rows:
    print(f"{row.id}: {row.name}")
```

### 何时使用 typing.NamedTuple

```python
from typing import NamedTuple, Optional, List

# 需要类型注解的场景
class APIResponse(NamedTuple):
    status_code: int
    data: dict
    error: Optional[str] = None

# 需要添加方法的场景
class Rectangle(NamedTuple):
    width: float
    height: float

    @property
    def area(self) -> float:
        return self.width * self.height

    @property
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

# 复杂的数据结构
class Order(NamedTuple):
    order_id: str
    customer_id: int
    items: List[str]
    total: float
    status: str = 'pending'
```

### 元组 vs 列表的选择

```python
# 使用元组的场景
# - 数据不应被修改
# - 需要作为字典键或集合元素
# - 表示固定结构的记录（如坐标、RGB颜色）
# - 函数返回多个值

coords = (10, 20)  # 坐标不应该改变
color = (255, 128, 0)  # RGB 值

# 使用列表的场景
# - 数据需要动态增删
# - 同质数据的集合
# - 需要排序、反转等原地操作

tasks = ['task1', 'task2']
tasks.append('task3')
```

---

## 常见陷阱

### 单元素元组

```python
# 错误：这是一个整数，不是元组
not_a_tuple = (42)
print(type(not_a_tuple))  # <class 'int'>

# 正确：需要加逗号
a_tuple = (42,)
print(type(a_tuple))  # <class 'tuple'>

# 更清晰的写法
a_tuple = 42,
print(type(a_tuple))  # <class 'tuple'>
```

### 可变元素的陷阱

```python
# 元组包含可变对象时要小心
t = ([1, 2], [3, 4])

# 看起来像是在修改元组，实际上是修改内部列表
t[0].append(5)
print(t)  # ([1, 2, 5], [3, 4])

# 但不能重新赋值
# t[0] = [10, 20]  # TypeError

# 这也意味着这样的元组不能哈希
# hash(t)  # TypeError: unhashable type: 'list'
```

### 解包数量不匹配

```python
t = (1, 2, 3)

# 错误：变量数量不匹配
# a, b = t  # ValueError: too many values to unpack

# 正确：使用 * 收集多余的值
a, *rest = t
print(a, rest)  # 1 [2, 3]

# 或者确保数量匹配
a, b, c = t
print(a, b, c)  # 1 2 3
```

### namedtuple 字段名限制

```python
from collections import namedtuple

# 字段名不能是 Python 关键字
# Data = namedtuple('Data', ['class', 'for'])  # ValueError

# 使用 rename=True 自动重命名无效字段
Data = namedtuple('Data', ['class', 'for', 'valid'], rename=True)
print(Data._fields)  # ('_0', '_1', 'valid')

# 字段名不能以数字开头或包含特殊字符
# Bad = namedtuple('Bad', ['1field', 'my-field'])  # ValueError
```

### 性能考虑

```python
from collections import namedtuple
import time

Point = namedtuple('Point', ['x', 'y'])

# namedtuple 的属性访问比索引访问略慢
p = Point(3, 4)

# 但在大多数情况下差异可以忽略
# 可读性更重要
print(p.x)   # 推荐：更可读
print(p[0])  # 避免：不清晰
```

---

## 性能考量

### 内存效率

```python
import sys
from collections import namedtuple

# 普通类
class PointClass:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# 使用 __slots__ 的类
class PointSlots:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

# 命名元组
PointNT = namedtuple('PointNT', ['x', 'y'])

# 比较内存占用
p_class = PointClass(3, 4)
p_slots = PointSlots(3, 4)
p_tuple = (3, 4)
p_nt = PointNT(3, 4)

print(f"普通类: {sys.getsizeof(p_class)} + {sys.getsizeof(p_class.__dict__)} 字节")
print(f"__slots__ 类: {sys.getsizeof(p_slots)} 字节")
print(f"元组: {sys.getsizeof(p_tuple)} 字节")
print(f"命名元组: {sys.getsizeof(p_nt)} 字节")

# 典型输出:
# 普通类: 48 + 104 字节
# __slots__ 类: 48 字节
# 元组: 56 字节
# 命名元组: 56 字节
```

### 创建速度

```python
import time
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])

n = 1000000

# 元组创建
start = time.time()
for _ in range(n):
    t = (3, 4)
tuple_time = time.time() - start

# 命名元组创建
start = time.time()
for _ in range(n):
    p = Point(3, 4)
nt_time = time.time() - start

# 列表创建
start = time.time()
for _ in range(n):
    l = [3, 4]
list_time = time.time() - start

print(f"元组: {tuple_time:.4f} 秒")
print(f"命名元组: {nt_time:.4f} 秒")
print(f"列表: {list_time:.4f} 秒")
```

### 访问速度

```python
import time
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
t = (3, 4)

n = 10000000

# 元组索引访问
start = time.time()
for _ in range(n):
    _ = t[0]
tuple_index_time = time.time() - start

# 命名元组索引访问
start = time.time()
for _ in range(n):
    _ = p[0]
nt_index_time = time.time() - start

# 命名元组属性访问
start = time.time()
for _ in range(n):
    _ = p.x
nt_attr_time = time.time() - start

print(f"元组索引: {tuple_index_time:.4f} 秒")
print(f"命名元组索引: {nt_index_time:.4f} 秒")
print(f"命名元组属性: {nt_attr_time:.4f} 秒")
```

---

## 实战场景

### 场景1：配置管理

```python
from typing import NamedTuple, Optional

class DatabaseConfig(NamedTuple):
    host: str
    port: int
    database: str
    username: str
    password: str
    ssl: bool = False
    pool_size: int = 5

    @property
    def connection_string(self) -> str:
        protocol = "postgresql+ssl" if self.ssl else "postgresql"
        return f"{protocol}://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

class AppConfig(NamedTuple):
    db: DatabaseConfig
    debug: bool = False
    log_level: str = 'INFO'
    secret_key: str = ''

# 使用
db_config = DatabaseConfig(
    host='localhost',
    port=5432,
    database='myapp',
    username='admin',
    password='secret123'
)

app_config = AppConfig(db=db_config, debug=True)

print(app_config.db.connection_string)
# postgresql://admin:secret123@localhost:5432/myapp
```

### 场景2：API 响应处理

```python
from typing import NamedTuple, Optional, List, Any
from datetime import datetime

class APIError(NamedTuple):
    code: str
    message: str
    field: Optional[str] = None

class APIResponse(NamedTuple):
    success: bool
    data: Any
    errors: List[APIError] = []
    timestamp: str = ''

    @classmethod
    def ok(cls, data: Any) -> 'APIResponse':
        return cls(
            success=True,
            data=data,
            timestamp=datetime.now().isoformat()
        )

    @classmethod
    def error(cls, errors: List[APIError]) -> 'APIResponse':
        return cls(
            success=False,
            data=None,
            errors=errors,
            timestamp=datetime.now().isoformat()
        )

# 使用
response = APIResponse.ok({'user_id': 123, 'name': 'Alice'})
print(response.success)  # True
print(response.data)     # {'user_id': 123, 'name': 'Alice'}

error_response = APIResponse.error([
    APIError('VALIDATION_ERROR', 'Email is required', 'email'),
    APIError('VALIDATION_ERROR', 'Password too short', 'password')
])
print(error_response.errors)
```

### 场景3：游戏开发中的坐标系统

```python
from typing import NamedTuple
import math

class Position(NamedTuple):
    x: float
    y: float
    z: float = 0.0

    def distance_to(self, other: 'Position') -> float:
        return math.sqrt(
            (self.x - other.x) ** 2 +
            (self.y - other.y) ** 2 +
            (self.z - other.z) ** 2
        )

    def move(self, dx: float = 0, dy: float = 0, dz: float = 0) -> 'Position':
        return Position(self.x + dx, self.y + dy, self.z + dz)

    def __add__(self, other: 'Position') -> 'Position':
        return Position(self.x + other.x, self.y + other.y, self.z + other.z)

class Entity(NamedTuple):
    id: int
    name: str
    position: Position
    health: int = 100

    def move_to(self, new_position: Position) -> 'Entity':
        return self._replace(position=new_position)

    def take_damage(self, amount: int) -> 'Entity':
        return self._replace(health=max(0, self.health - amount))

# 游戏逻辑
player = Entity(1, "Hero", Position(0, 0))
enemy = Entity(2, "Monster", Position(10, 10))

distance = player.position.distance_to(enemy.position)
print(f"与敌人的距离: {distance:.2f}")

# 移动玩家
player = player.move_to(player.position.move(dx=5, dy=3))
print(f"玩家新位置: {player.position}")

# 战斗
enemy = enemy.take_damage(30)
print(f"敌人剩余血量: {enemy.health}")
```

### 场景4：数据处理管道

```python
from typing import NamedTuple, List, Iterator
from collections import namedtuple
import csv
from io import StringIO

# 定义数据模型
class SalesRecord(NamedTuple):
    date: str
    product: str
    quantity: int
    price: float
    region: str

    @property
    def revenue(self) -> float:
        return self.quantity * self.price

# CSV 数据
csv_data = """date,product,quantity,price,region
2024-01-01,Widget A,100,9.99,North
2024-01-01,Widget B,50,19.99,South
2024-01-02,Widget A,75,9.99,North
2024-01-02,Widget C,200,4.99,East
2024-01-03,Widget B,30,19.99,West"""

def parse_records(csv_text: str) -> Iterator[SalesRecord]:
    """解析 CSV 数据为 SalesRecord 对象"""
    reader = csv.DictReader(StringIO(csv_text))
    for row in reader:
        yield SalesRecord(
            date=row['date'],
            product=row['product'],
            quantity=int(row['quantity']),
            price=float(row['price']),
            region=row['region']
        )

def filter_by_region(records: Iterator[SalesRecord], region: str) -> Iterator[SalesRecord]:
    """按地区过滤"""
    for record in records:
        if record.region == region:
            yield record

def calculate_total_revenue(records: Iterator[SalesRecord]) -> float:
    """计算总收入"""
    return sum(record.revenue for record in records)

# 数据处理管道
records = parse_records(csv_data)
north_records = filter_by_region(records, 'North')
total = calculate_total_revenue(north_records)
print(f"北区总收入: ${total:.2f}")

# 按产品分组统计
from collections import defaultdict

records = list(parse_records(csv_data))
product_revenue = defaultdict(float)
for record in records:
    product_revenue[record.product] += record.revenue

for product, revenue in sorted(product_revenue.items(), key=lambda x: -x[1]):
    print(f"{product}: ${revenue:.2f}")
```

---

## 面试要点

### 元组和列表的区别

**问题**：元组和列表有什么区别？什么时候使用元组？

**答案**：
- 可变性：元组不可变，列表可变
- 语法：元组用圆括号，列表用方括号
- 性能：元组创建更快，内存占用更小
- 哈希性：元组可哈希（如果元素都可哈希），可作为字典键；列表不可哈希
- 使用场景：
  - 元组：固定数据、函数返回多值、字典键、常量配置
  - 列表：动态数据集合、需要增删改的场景

### 元组的不可变性

**问题**：元组是否真的完全不可变？

**答案**：
元组的"不可变"指的是元组对象本身的元素引用不能改变，但如果元素是可变对象（如列表），该对象的内容可以改变：

```python
t = ([1, 2], 3)
t[0].append(4)  # 合法，t 变成 ([1, 2, 4], 3)
# t[0] = []     # 非法，TypeError
```

### 命名元组的优势

**问题**：什么时候使用命名元组而不是普通类？

**答案**：
- 需要轻量级的数据容器
- 数据不需要修改（不可变）
- 需要通过名称访问字段
- 需要元组的所有特性（解包、哈希等）
- 代替只有数据没有方法的简单类

### namedtuple vs dataclass

**问题**：命名元组和 dataclass 如何选择？

**答案**：
- 命名元组：
  - 不可变
  - 内存效率更高
  - 支持索引访问和解包
  - 可作为字典键

- dataclass：
  - 默认可变（可设为不可变）
  - 支持默认工厂函数
  - 更灵活的字段配置
  - 更好的继承支持

```python
from dataclasses import dataclass
from typing import NamedTuple

# 选择命名元组：简单不可变数据
class Point(NamedTuple):
    x: float
    y: float

# 选择 dataclass：需要可变或复杂初始化
@dataclass
class User:
    name: str
    age: int
    friends: list = None

    def __post_init__(self):
        if self.friends is None:
            self.friends = []
```

### 元组解包技巧

**问题**：请展示元组解包的高级用法。

**答案**：

```python
# 基本解包
a, b, c = (1, 2, 3)

# 星号收集
first, *rest = (1, 2, 3, 4)  # first=1, rest=[2,3,4]
*init, last = (1, 2, 3, 4)   # init=[1,2,3], last=4

# 嵌套解包
(a, b), (c, d) = [(1, 2), (3, 4)]

# 交换变量
a, b = b, a

# 忽略某些值
_, x, _ = (1, 2, 3)

# 函数参数解包
def func(a, b, c):
    return a + b + c

args = (1, 2, 3)
result = func(*args)
```

---

## 延伸阅读

### 官方文档
- [Python 官方文档 - 元组](https://docs.python.org/zh-cn/3/tutorial/datastructures.html#tuples-and-sequences)
- [collections.namedtuple](https://docs.python.org/zh-cn/3/library/collections.html#collections.namedtuple)
- [typing.NamedTuple](https://docs.python.org/zh-cn/3/library/typing.html#typing.NamedTuple)

### 相关 PEP
- [PEP 3132 - Extended Iterable Unpacking](https://peps.python.org/pep-3132/) - 星号解包语法
- [PEP 526 - Syntax for Variable Annotations](https://peps.python.org/pep-0526/) - 类型注解语法

### 相关主题
- [dataclasses 数据类](/python/dataclasses) - 更灵活的数据容器
- [collections 模块](/python/collections) - 其他高级数据结构
- [类型注解](/python/type-hints) - Python 类型系统
