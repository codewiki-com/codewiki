---
title: Python 魔术方法
description: 深入理解 Python 特殊方法：构造、字符串表示、比较、容器协议等
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - 魔术方法
  - 特殊方法
  - 协议
status: imported
origin: old/src/content/docs/python/magic-methods.zh.md
divergence: 0.31
issues: []
legacy:
  category: Python
  subcategory: 面向对象编程
  order: 7
  lastUpdated: 2026-01-07
---

魔术方法(Magic Methods),也称为特殊方法(Special Methods)或双下划线方法(Dunder Methods),是 Python 中以双下划线开头和结尾的特殊方法。这些方法为类提供了强大的功能,使对象能够像内置类型一样工作。

## 对象构造与销毁

### `__new__` 和 `__init__`

`__new__` 是真正的构造函数,负责创建实例;`__init__` 是初始化方法,负责初始化已创建的实例。

```python
class Person:
    def __new__(cls, name, age):
        print(f"__new__ 被调用,创建实例")
        instance = super().__new__(cls)
        return instance

    def __init__(self, name, age):
        print(f"__init__ 被调用,初始化实例")
        self.name = name
        self.age = age

# 创建实例
p = Person("张三", 25)
# 输出:
# __new__ 被调用,创建实例
# __init__ 被调用,初始化实例
```

**单例模式实现:**

```python
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value):
        self.value = value

# 测试单例
s1 = Singleton("第一次")
s2 = Singleton("第二次")
print(s1 is s2)  # True
print(s1.value)   # 第二次
```

### `__del__`

`__del__` 是析构方法,在对象被垃圾回收时调用。

```python
class Resource:
    def __init__(self, name):
        self.name = name
        print(f"资源 {self.name} 被创建")

    def __del__(self):
        print(f"资源 {self.name} 被销毁")

# 创建和销毁
r = Resource("数据库连接")
del r  # 资源 数据库连接 被销毁
```

## 字符串表示

### `__str__` 和 `__repr__`

- `__str__`: 用于 `str()` 和 `print()`,面向用户的可读字符串
- `__repr__`: 用于 `repr()` 和交互式解释器,面向开发者的明确字符串

```python
class Book:
    def __init__(self, title, author, year):
        self.title = title
        self.author = author
        self.year = year

    def __str__(self):
        return f"《{self.title}》- {self.author}"

    def __repr__(self):
        return f"Book(title='{self.title}', author='{self.author}', year={self.year})"

book = Book("Python编程", "Guido van Rossum", 1991)
print(str(book))   # 《Python编程》- Guido van Rossum
print(repr(book))  # Book(title='Python编程', author='Guido van Rossum', year=1991)
```

### `__format__`

自定义格式化输出。

```python
class Money:
    def __init__(self, amount, currency="CNY"):
        self.amount = amount
        self.currency = currency

    def __format__(self, format_spec):
        if format_spec == "short":
            return f"{self.currency} {self.amount:.2f}"
        elif format_spec == "long":
            return f"{self.amount:.2f} {self.currency}"
        else:
            return f"{self.amount}"

money = Money(1234.567)
print(f"{money:short}")  # CNY 1234.57
print(f"{money:long}")   # 1234.57 CNY
print(f"{money}")        # 1234.567
```

## 比较操作

### 比较运算符

实现六个比较方法来支持比较操作。

```python
class Version:
    def __init__(self, version_string):
        self.parts = [int(x) for x in version_string.split('.')]

    def __eq__(self, other):
        """等于: =="""
        return self.parts == other.parts

    def __ne__(self, other):
        """不等于: !="""
        return self.parts != other.parts

    def __lt__(self, other):
        """小于: <"""
        return self.parts < other.parts

    def __le__(self, other):
        """小于等于: <="""
        return self.parts <= other.parts

    def __gt__(self, other):
        """大于: >"""
        return self.parts > other.parts

    def __ge__(self, other):
        """大于等于: >="""
        return self.parts >= other.parts

    def __str__(self):
        return '.'.join(map(str, self.parts))

v1 = Version("1.2.3")
v2 = Version("1.2.4")
print(v1 < v2)   # True
print(v1 == v2)  # False
print(v1 >= v2)  # False
```

**使用 `functools.total_ordering` 简化:**

```python
from functools import total_ordering

@total_ordering
class Student:
    def __init__(self, name, score):
        self.name = name
        self.score = score

    def __eq__(self, other):
        return self.score == other.score

    def __lt__(self, other):
        return self.score < other.score

s1 = Student("张三", 85)
s2 = Student("李四", 90)
print(s1 < s2)   # True
print(s1 <= s2)  # True (自动生成)
print(s1 > s2)   # False (自动生成)
```

## 数学运算

### 算术运算符

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        """加法: +"""
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """减法: -"""
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        """乘法: *"""
        return Vector(self.x * scalar, self.y * scalar)

    def __truediv__(self, scalar):
        """除法: /"""
        return Vector(self.x / scalar, self.y / scalar)

    def __abs__(self):
        """绝对值: abs()"""
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __neg__(self):
        """取反: -"""
        return Vector(-self.x, -self.y)

    def __str__(self):
        return f"Vector({self.x}, {self.y})"

v1 = Vector(3, 4)
v2 = Vector(1, 2)
print(v1 + v2)    # Vector(4, 6)
print(v1 - v2)    # Vector(2, 2)
print(v1 * 2)     # Vector(6, 8)
print(abs(v1))    # 5.0
print(-v1)        # Vector(-3, -4)
```

### 反向运算和增量赋值

```python
class Number:
    def __init__(self, value):
        self.value = value

    def __add__(self, other):
        """正向加法: self + other"""
        return Number(self.value + other)

    def __radd__(self, other):
        """反向加法: other + self"""
        return Number(other + self.value)

    def __iadd__(self, other):
        """增量赋值: +="""
        self.value += other
        return self

    def __str__(self):
        return str(self.value)

n = Number(10)
print(n + 5)    # 15 (调用 __add__)
print(5 + n)    # 15 (调用 __radd__)

n += 3          # 调用 __iadd__
print(n)        # 13
```

## 容器协议

### 序列协议

实现序列类型需要 `__len__` 和 `__getitem__`。

```python
class CustomList:
    def __init__(self, *items):
        self._items = list(items)

    def __len__(self):
        """长度: len()"""
        return len(self._items)

    def __getitem__(self, index):
        """获取元素: obj[index]"""
        return self._items[index]

    def __setitem__(self, index, value):
        """设置元素: obj[index] = value"""
        self._items[index] = value

    def __delitem__(self, index):
        """删除元素: del obj[index]"""
        del self._items[index]

    def __contains__(self, item):
        """成员测试: item in obj"""
        return item in self._items

    def __iter__(self):
        """迭代: for item in obj"""
        return iter(self._items)

    def __reversed__(self):
        """反向迭代: reversed(obj)"""
        return reversed(self._items)

cl = CustomList(1, 2, 3, 4, 5)
print(len(cl))        # 5
print(cl[2])          # 3
print(3 in cl)        # True
print(list(reversed(cl)))  # [5, 4, 3, 2, 1]
```

### 映射协议

实现字典类型的行为。

```python
class CaseInsensitiveDict:
    def __init__(self):
        self._data = {}

    def __getitem__(self, key):
        return self._data[key.lower()]

    def __setitem__(self, key, value):
        self._data[key.lower()] = value

    def __delitem__(self, key):
        del self._data[key.lower()]

    def __contains__(self, key):
        return key.lower() in self._data

    def __len__(self):
        return len(self._data)

    def __iter__(self):
        return iter(self._data)

    def keys(self):
        return self._data.keys()

    def values(self):
        return self._data.values()

    def items(self):
        return self._data.items()

d = CaseInsensitiveDict()
d['Name'] = '张三'
d['AGE'] = 25
print(d['name'])    # 张三
print(d['age'])     # 25
print('NAME' in d)  # True
```

### 切片支持

```python
class SliceableList:
    def __init__(self, data):
        self._data = list(data)

    def __getitem__(self, key):
        if isinstance(key, slice):
            # 处理切片
            return SliceableList(self._data[key])
        else:
            # 处理单个索引
            return self._data[key]

    def __repr__(self):
        return f"SliceableList({self._data})"

sl = SliceableList([0, 1, 2, 3, 4, 5])
print(sl[2])        # 2
print(sl[1:4])      # SliceableList([1, 2, 3])
print(sl[::2])      # SliceableList([0, 2, 4])
```

## 上下文管理器

### `__enter__` 和 `__exit__`

实现 `with` 语句支持。

```python
class FileManager:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        """进入上下文时调用"""
        print(f"打开文件: {self.filename}")
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        """退出上下文时调用"""
        print(f"关闭文件: {self.filename}")
        if self.file:
            self.file.close()

        # 处理异常
        if exc_type is not None:
            print(f"发生异常: {exc_type.__name__}: {exc_val}")
            return False  # 重新抛出异常
        return True

# 使用上下文管理器
with FileManager('test.txt', 'w') as f:
    f.write('Hello, World!')
```

**数据库连接示例:**

```python
class DatabaseConnection:
    def __init__(self, host, database):
        self.host = host
        self.database = database
        self.connection = None

    def __enter__(self):
        print(f"连接到数据库: {self.database}")
        # 模拟数据库连接
        self.connection = f"Connection to {self.database}"
        return self.connection

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"断开数据库连接")
        self.connection = None
        if exc_type:
            print(f"事务回滚: {exc_val}")
        else:
            print(f"事务提交")
        return False

with DatabaseConnection('localhost', 'mydb') as conn:
    print(f"执行查询: {conn}")
    # 执行数据库操作
```

**使用 contextlib 简化:**

```python
from contextlib import contextmanager

@contextmanager
def timer(name):
    import time
    start = time.time()
    print(f"{name} 开始...")
    try:
        yield
    finally:
        end = time.time()
        print(f"{name} 完成,耗时: {end - start:.2f}秒")

with timer("数据处理"):
    # 模拟耗时操作
    sum([i**2 for i in range(1000000)])
```

## 可调用对象

### `__call__`

使对象像函数一样可调用。

```python
class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, x):
        """使实例可调用"""
        return x * self.factor

# 创建乘法器
double = Multiplier(2)
triple = Multiplier(3)

print(double(5))    # 10
print(triple(5))    # 15
print(callable(double))  # True
```

**计数器示例:**

```python
class Counter:
    def __init__(self):
        self.count = 0

    def __call__(self):
        self.count += 1
        return self.count

counter = Counter()
print(counter())  # 1
print(counter())  # 2
print(counter())  # 3
```

**装饰器类:**

```python
class Logger:
    def __init__(self, func):
        self.func = func
        self.call_count = 0

    def __call__(self, *args, **kwargs):
        self.call_count += 1
        print(f"调用 {self.func.__name__} 第 {self.call_count} 次")
        return self.func(*args, **kwargs)

@Logger
def add(a, b):
    return a + b

print(add(2, 3))  # 调用 add 第 1 次, 输出: 5
print(add(4, 5))  # 调用 add 第 2 次, 输出: 9
```

## 属性访问

### `__getattr__`, `__setattr__`, `__delattr__`

控制属性访问行为。

```python
class DynamicAttributes:
    def __init__(self):
        # 使用 object.__setattr__ 避免无限递归
        object.__setattr__(self, '_data', {})

    def __getattr__(self, name):
        """获取不存在的属性时调用"""
        print(f"获取属性: {name}")
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"没有属性 '{name}'")

    def __setattr__(self, name, value):
        """设置任何属性时调用"""
        print(f"设置属性: {name} = {value}")
        self._data[name] = value

    def __delattr__(self, name):
        """删除属性时调用"""
        print(f"删除属性: {name}")
        if name in self._data:
            del self._data[name]
        else:
            raise AttributeError(f"没有属性 '{name}'")

obj = DynamicAttributes()
obj.name = "张三"      # 设置属性: name = 张三
print(obj.name)        # 获取属性: name, 输出: 张三
del obj.name           # 删除属性: name
```

### `__getattribute__`

拦截所有属性访问(包括存在的属性)。

```python
class LoggedAccess:
    def __init__(self, value):
        self.value = value

    def __getattribute__(self, name):
        """拦截所有属性访问"""
        print(f"访问属性: {name}")
        # 必须调用父类方法避免无限递归
        return object.__getattribute__(self, name)

    def __setattr__(self, name, value):
        print(f"设置属性: {name} = {value}")
        object.__setattr__(self, name, value)

obj = LoggedAccess(42)
print(obj.value)  # 访问属性: value, 输出: 42
```

**延迟加载示例:**

```python
class LazyProperty:
    def __init__(self):
        self._expensive_data = None

    def __getattr__(self, name):
        if name == 'data':
            if self._expensive_data is None:
                print("首次访问,加载数据...")
                self._expensive_data = "昂贵的计算结果"
            return self._expensive_data
        raise AttributeError(f"没有属性 '{name}'")

obj = LazyProperty()
print(obj.data)  # 首次访问,加载数据..., 输出: 昂贵的计算结果
print(obj.data)  # 直接返回缓存,输出: 昂贵的计算结果
```

## 描述符协议

### `__get__`, `__set__`, `__delete__`

描述符是实现属性访问协议的类,用于创建托管属性。

```python
class TypedProperty:
    def __init__(self, name, expected_type):
        self.name = name
        self.expected_type = expected_type

    def __get__(self, instance, owner):
        """获取属性值"""
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        """设置属性值"""
        if not isinstance(value, self.expected_type):
            raise TypeError(
                f"{self.name} 必须是 {self.expected_type.__name__} 类型"
            )
        instance.__dict__[self.name] = value

    def __delete__(self, instance):
        """删除属性"""
        del instance.__dict__[self.name]

class Person:
    name = TypedProperty('name', str)
    age = TypedProperty('age', int)

    def __init__(self, name, age):
        self.name = name
        self.age = age

# 使用类型检查
p = Person("张三", 25)
print(p.name, p.age)  # 张三 25

try:
    p.age = "三十"  # 抛出 TypeError
except TypeError as e:
    print(e)  # age 必须是 int 类型
```

**验证描述符:**

```python
class Validator:
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def __set_name__(self, owner, name):
        """自动获取属性名(Python 3.6+)"""
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"{self.name} 不能小于 {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"{self.name} 不能大于 {self.max_value}")
        setattr(instance, self.private_name, value)

class Student:
    score = Validator(min_value=0, max_value=100)
    age = Validator(min_value=0, max_value=150)

    def __init__(self, score, age):
        self.score = score
        self.age = age

s = Student(85, 20)
print(s.score, s.age)  # 85 20

try:
    s.score = 150  # 抛出 ValueError
except ValueError as e:
    print(e)  # score 不能大于 100
```

**只读属性:**

```python
class ReadOnlyDescriptor:
    def __init__(self, value):
        self.value = value

    def __get__(self, instance, owner):
        return self.value

    def __set__(self, instance, value):
        raise AttributeError("这是只读属性")

class Config:
    API_KEY = ReadOnlyDescriptor("secret-key-123")
    VERSION = ReadOnlyDescriptor("1.0.0")

config = Config()
print(config.API_KEY)  # secret-key-123

try:
    config.API_KEY = "new-key"  # 抛出 AttributeError
except AttributeError as e:
    print(e)  # 这是只读属性
```

**缓存描述符:**

```python
import time

class CachedProperty:
    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # 检查缓存
        cached_value = instance.__dict__.get(self.name)
        if cached_value is not None:
            return cached_value

        # 计算并缓存结果
        print(f"计算 {self.name}...")
        value = self.func(instance)
        instance.__dict__[self.name] = value
        return value

class DataProcessor:
    def __init__(self, data):
        self.data = data

    @CachedProperty
    def processed_data(self):
        time.sleep(1)  # 模拟耗时操作
        return [x * 2 for x in self.data]

processor = DataProcessor([1, 2, 3, 4, 5])
print(processor.processed_data)  # 计算 processed_data..., 输出: [2, 4, 6, 8, 10]
print(processor.processed_data)  # 直接返回缓存, 输出: [2, 4, 6, 8, 10]
```

## 其他实用魔术方法

### `__hash__`

使对象可哈希,能用作字典键或集合元素。

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        return hash((self.x, self.y))

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

# 使用作为字典键
points = {
    Point(0, 0): "原点",
    Point(1, 1): "对角线点"
}
print(points[Point(0, 0)])  # 原点

# 使用在集合中
point_set = {Point(1, 1), Point(1, 1), Point(2, 2)}
print(point_set)  # {Point(1, 1), Point(2, 2)}
```

### `__bool__`

定义对象的布尔值。

```python
class ShoppingCart:
    def __init__(self):
        self.items = []

    def add_item(self, item):
        self.items.append(item)

    def __bool__(self):
        """购物车非空时为 True"""
        return len(self.items) > 0

    def __len__(self):
        return len(self.items)

cart = ShoppingCart()
if not cart:
    print("购物车是空的")  # 输出

cart.add_item("商品A")
if cart:
    print(f"购物车有 {len(cart)} 件商品")  # 购物车有 1 件商品
```

### `__bytes__`

定义字节表示。

```python
class SerializableObject:
    def __init__(self, data):
        self.data = data

    def __bytes__(self):
        """转换为字节"""
        return self.data.encode('utf-8')

    def __str__(self):
        return self.data

obj = SerializableObject("你好,世界")
print(bytes(obj))  # b'\xe4\xbd\xa0\xe5\xa5\xbd\xef\xbc\x8c\xe4\xb8\x96\xe7\x95\x8c'
```

## 最佳实践

### 遵循 Python 约定

```python
class GoodExample:
    """正确使用魔术方法的示例"""

    def __init__(self, value):
        self.value = value

    def __repr__(self):
        # __repr__ 应该返回明确的表示
        return f"{self.__class__.__name__}({self.value!r})"

    def __str__(self):
        # __str__ 应该返回友好的表示
        return str(self.value)

    def __eq__(self, other):
        # 实现 __eq__ 应该同时考虑 __hash__
        if not isinstance(other, GoodExample):
            return NotImplemented
        return self.value == other.value

    def __hash__(self):
        # 可哈希对象必须不可变
        return hash(self.value)
```

### 避免常见陷阱

```python
class BadExample:
    """需要避免的错误示例"""

    def __init__(self, value):
        # 错误: 在 __init__ 中调用 __setattr__ 可能导致递归
        # self.__setattr__('value', value)  # 不要这样做

        # 正确: 直接赋值或使用 object.__setattr__
        self.value = value

    def __getattr__(self, name):
        # 错误: 在 __getattr__ 中访问 self 的属性会导致递归
        # return self.name  # 不要这样做

        # 正确: 使用 __dict__ 或 object.__getattribute__
        return self.__dict__.get(name, None)
```

### 文档化自定义行为

```python
class WellDocumented:
    """
    一个文档完善的类。

    这个类实现了多个魔术方法来提供类似列表的行为。

    Attributes:
        items: 内部存储的元素列表

    Examples:
        >>> wd = WellDocumented([1, 2, 3])
        >>> len(wd)
        3
        >>> wd[0]
        1
    """

    def __init__(self, items):
        """
        初始化实例。

        Args:
            items: 初始元素列表
        """
        self.items = list(items)

    def __len__(self):
        """返回元素数量。"""
        return len(self.items)

    def __getitem__(self, index):
        """
        获取指定索引的元素。

        Args:
            index: 元素索引

        Returns:
            指定索引的元素

        Raises:
            IndexError: 如果索引超出范围
        """
        return self.items[index]
```

## 总结

Python 的魔术方法提供了强大的能力,让自定义类能够:

1. **对象生命周期**: 使用 `__new__`, `__init__`, `__del__` 控制对象创建和销毁
2. **字符串表示**: 通过 `__str__`, `__repr__`, `__format__` 定制输出格式
3. **运算符重载**: 实现 `__add__`, `__mul__` 等方法支持算术运算
4. **比较操作**: 使用 `__eq__`, `__lt__` 等方法定义比较逻辑
5. **容器行为**: 通过 `__len__`, `__getitem__` 等实现序列和映射协议
6. **上下文管理**: 使用 `__enter__` 和 `__exit__` 支持 `with` 语句
7. **可调用对象**: 通过 `__call__` 使对象像函数一样使用
8. **属性控制**: 使用 `__getattr__`, `__setattr__` 等控制属性访问
9. **描述符**: 通过描述符协议创建可重用的属性管理逻辑

合理使用这些魔术方法,可以让你的类更加 Pythonic,与内置类型无缝集成,提供更直观的 API。

## 参考资源

- [Python 数据模型官方文档](https://docs.python.org/zh-cn/3/reference/datamodel.html)
- [Python Descriptors Guide](https://docs.python.org/3/howto/descriptor.html)
- [A Guide to Python's Magic Methods](https://rszalski.github.io/magicmethods/)
