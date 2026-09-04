---
title: 抽象基类 (ABC)
description: Python 抽象基类完全指南：abc 模块、ABC 类、@abstractmethod、虚拟子类与 collections.abc
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - ABC
  - 抽象基类
  - 面向对象
  - 接口
  - 多态
status: imported
origin: old/src/content/docs/python/abc.zh.md
divergence: 0.413
issues:
  - order-mismatch
  - divergent
legacy:
  category: Python
  subcategory: 面向对象编程
  order: 37
  lastUpdated: 2026-01-07
---

抽象基类（Abstract Base Class，简称 ABC）是 Python 中实现接口规范和多态的重要机制。它允许你定义一个不能被实例化的基类，强制子类必须实现特定的方法或属性，从而确保代码的一致性和可靠性。

## 概念解释

### 什么是抽象基类

抽象基类是一种特殊的类，它具有以下特征：

1. **不能被直接实例化**：尝试创建抽象基类的实例会抛出 `TypeError`
2. **定义接口规范**：声明子类必须实现的抽象方法和属性
3. **支持多态**：允许不同的子类以各自的方式实现相同的接口
4. **提供默认实现**：可以包含具体方法，供子类继承使用

```python
from abc import ABC, abstractmethod

# 定义抽象基类
class Shape(ABC):
    @abstractmethod
    def area(self):
        """计算面积 - 子类必须实现"""
        pass

    @abstractmethod
    def perimeter(self):
        """计算周长 - 子类必须实现"""
        pass

    def describe(self):
        """具体方法 - 子类可以直接使用或重写"""
        return f"这是一个 {self.__class__.__name__}"

# 尝试实例化抽象基类会失败
# shape = Shape()  # TypeError: Can't instantiate abstract class Shape

# 实现抽象基类
class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

# 现在可以实例化
rect = Rectangle(5, 3)
print(rect.area())       # 15
print(rect.perimeter())  # 16
print(rect.describe())   # 这是一个 Rectangle
```

### 为什么需要抽象基类

在没有抽象基类的情况下，Python 的鸭子类型（Duck Typing）虽然灵活，但存在一些问题：

```python
# 没有 ABC 的情况
class Duck:
    def quack(self):
        print("嘎嘎嘎")

    def walk(self):
        print("摇摇摆摆地走")

class Person:
    def quack(self):
        print("人在模仿鸭叫")

    def walk(self):
        print("人在走路")

def make_it_quack(duck):
    duck.quack()  # 只要有 quack 方法就行

# 两者都可以工作
make_it_quack(Duck())    # 嘎嘎嘎
make_it_quack(Person())  # 人在模仿鸭叫
```

**鸭子类型的问题：**

1. **没有明确的接口定义**：不知道对象应该具有哪些方法
2. **错误延迟发现**：只有在运行时调用不存在的方法才会报错
3. **文档不清晰**：难以理解一个类应该实现什么接口
4. **IDE 支持有限**：类型检查和自动补全受限

抽象基类解决了这些问题：

```python
from abc import ABC, abstractmethod

class Quackable(ABC):
    @abstractmethod
    def quack(self):
        """发出叫声"""
        pass

class Duck(Quackable):
    def quack(self):
        print("嘎嘎嘎")

# 忘记实现抽象方法会立即报错
# class BrokenDuck(Quackable):
#     pass
# duck = BrokenDuck()  # TypeError: Can't instantiate abstract class
```

### 历史背景

抽象基类的概念在 Python 2.6 中通过 PEP 3119 引入。在此之前，Python 主要依赖鸭子类型，但随着项目规模增长，开发者需要更明确的接口定义机制。ABC 的引入使 Python 能够在保持动态特性的同时，提供类似静态语言的接口约束能力。

## 核心原理

### ABC 的工作机制

Python 的抽象基类通过元类 `ABCMeta` 实现。当你继承 `ABC` 类时，实际上是使用了 `ABCMeta` 作为元类：

```python
from abc import ABC, ABCMeta, abstractmethod

# 方式一：继承 ABC（推荐）
class MyABC1(ABC):
    @abstractmethod
    def my_method(self):
        pass

# 方式二：显式使用 ABCMeta
class MyABC2(metaclass=ABCMeta):
    @abstractmethod
    def my_method(self):
        pass

# 两者等价
print(type(MyABC1))  # <class 'abc.ABCMeta'>
print(type(MyABC2))  # <class 'abc.ABCMeta'>
```

### ABCMeta 的内部机制

`ABCMeta` 元类做了以下工作：

1. **收集抽象方法**：扫描类定义中所有带 `__isabstractmethod__` 属性的方法
2. **设置 `__abstractmethods__`**：将所有抽象方法名存储在类的 `__abstractmethods__` 属性中
3. **阻止实例化**：在 `__call__` 中检查是否还有未实现的抽象方法

```python
from abc import ABC, abstractmethod

class Example(ABC):
    @abstractmethod
    def method1(self):
        pass

    @abstractmethod
    def method2(self):
        pass

    def concrete_method(self):
        pass

# 查看抽象方法集合
print(Example.__abstractmethods__)  # frozenset({'method1', 'method2'})

# 部分实现
class PartialImpl(Example):
    def method1(self):
        return "method1 实现"

# 仍然有未实现的抽象方法
print(PartialImpl.__abstractmethods__)  # frozenset({'method2'})

# 完全实现
class FullImpl(PartialImpl):
    def method2(self):
        return "method2 实现"

# 没有抽象方法了
print(FullImpl.__abstractmethods__)  # frozenset()
```

### @abstractmethod 装饰器原理

`@abstractmethod` 装饰器的核心作用是给方法添加 `__isabstractmethod__ = True` 属性：

```python
from abc import abstractmethod

# abstractmethod 的简化实现
def my_abstractmethod(func):
    func.__isabstractmethod__ = True
    return func

class MyABC:
    @my_abstractmethod
    def my_method(self):
        pass

# 验证
print(MyABC.my_method.__isabstractmethod__)  # True
```

### 类创建流程

当定义一个继承自 ABC 的类时，发生以下流程：

```
class MyClass(ABC):
    @abstractmethod
    def method(self): pass
        |
        v
+------------------------+
| ABCMeta.__new__ 被调用  |
+------------------------+
        |
        v
+----------------------------------+
| 扫描所有方法，收集带有            |
| __isabstractmethod__=True 的方法 |
+----------------------------------+
        |
        v
+----------------------------------+
| 设置 __abstractmethods__ 属性    |
| 为 frozenset({'method'})         |
+----------------------------------+
        |
        v
    类创建完成

尝试实例化：MyClass()
        |
        v
+----------------------------------+
| ABCMeta.__call__ 检查            |
| __abstractmethods__ 是否为空      |
+----------------------------------+
        |
        v (不为空)
+----------------------------------+
| 抛出 TypeError:                  |
| Can't instantiate abstract class |
+----------------------------------+
```

## 核心要点

### abc 模块的核心组件

| 组件 | 说明 | 使用场景 |
|------|------|----------|
| `ABC` | 抽象基类的便捷基类 | 定义抽象类时继承 |
| `ABCMeta` | 抽象基类的元类 | 需要多继承时使用 |
| `@abstractmethod` | 抽象方法装饰器 | 定义必须实现的方法 |
| `@abstractproperty` | 抽象属性（已废弃） | 使用 `@property` + `@abstractmethod` |
| `@abstractclassmethod` | 抽象类方法（已废弃） | 使用 `@classmethod` + `@abstractmethod` |
| `@abstractstaticmethod` | 抽象静态方法（已废弃） | 使用 `@staticmethod` + `@abstractmethod` |

### 抽象方法的多种形式

```python
from abc import ABC, abstractmethod

class AbstractExample(ABC):
    # 1. 普通抽象方法
    @abstractmethod
    def abstract_method(self):
        """子类必须实现的实例方法"""
        pass

    # 2. 抽象属性（推荐写法）
    @property
    @abstractmethod
    def abstract_property(self):
        """子类必须实现的属性"""
        pass

    # 3. 抽象类方法
    @classmethod
    @abstractmethod
    def abstract_classmethod(cls):
        """子类必须实现的类方法"""
        pass

    # 4. 抽象静态方法
    @staticmethod
    @abstractmethod
    def abstract_staticmethod():
        """子类必须实现的静态方法"""
        pass

    # 5. 带默认实现的抽象方法
    @abstractmethod
    def method_with_default(self):
        """虽然是抽象方法，但提供了默认实现"""
        return "默认实现"

class ConcreteExample(AbstractExample):
    @property
    def abstract_property(self):
        return "具体属性值"

    def abstract_method(self):
        return "具体方法实现"

    @classmethod
    def abstract_classmethod(cls):
        return f"类方法实现 - {cls.__name__}"

    @staticmethod
    def abstract_staticmethod():
        return "静态方法实现"

    def method_with_default(self):
        # 可以调用父类的默认实现
        base_result = super().method_with_default()
        return f"{base_result} + 扩展"

# 测试
obj = ConcreteExample()
print(obj.abstract_property)         # 具体属性值
print(obj.abstract_method())         # 具体方法实现
print(obj.abstract_classmethod())    # 类方法实现 - ConcreteExample
print(obj.abstract_staticmethod())   # 静态方法实现
print(obj.method_with_default())     # 默认实现 + 扩展
```

**注意装饰器顺序：** `@abstractmethod` 必须是最内层的装饰器（最接近函数定义）。

```python
from abc import ABC, abstractmethod

class Correct(ABC):
    @property
    @abstractmethod
    def value(self):  # 正确：@abstractmethod 在内层
        pass

# 错误的顺序会导致问题
# class Wrong(ABC):
#     @abstractmethod
#     @property
#     def value(self):  # 错误：会导致 property 不生效
#         pass
```

## 代码示例

### 示例一：定义接口规范

```python
from abc import ABC, abstractmethod
from typing import List, Any

class Repository(ABC):
    """数据仓库抽象基类 - 定义 CRUD 接口"""

    @abstractmethod
    def create(self, item: Any) -> int:
        """创建记录，返回 ID"""
        pass

    @abstractmethod
    def read(self, id: int) -> Any:
        """读取单条记录"""
        pass

    @abstractmethod
    def update(self, id: int, item: Any) -> bool:
        """更新记录"""
        pass

    @abstractmethod
    def delete(self, id: int) -> bool:
        """删除记录"""
        pass

    @abstractmethod
    def list_all(self) -> List[Any]:
        """列出所有记录"""
        pass

class InMemoryRepository(Repository):
    """内存实现"""

    def __init__(self):
        self._data = {}
        self._next_id = 1

    def create(self, item):
        id = self._next_id
        self._data[id] = item
        self._next_id += 1
        return id

    def read(self, id):
        return self._data.get(id)

    def update(self, id, item):
        if id in self._data:
            self._data[id] = item
            return True
        return False

    def delete(self, id):
        if id in self._data:
            del self._data[id]
            return True
        return False

    def list_all(self):
        return list(self._data.values())

class FileRepository(Repository):
    """文件实现"""

    def __init__(self, filepath):
        self.filepath = filepath
        self._data = {}
        self._next_id = 1

    def create(self, item):
        id = self._next_id
        self._data[id] = item
        self._next_id += 1
        self._save()
        return id

    def read(self, id):
        return self._data.get(id)

    def update(self, id, item):
        if id in self._data:
            self._data[id] = item
            self._save()
            return True
        return False

    def delete(self, id):
        if id in self._data:
            del self._data[id]
            self._save()
            return True
        return False

    def list_all(self):
        return list(self._data.values())

    def _save(self):
        # 实际实现会写入文件
        pass

# 使用
def save_user(repo: Repository, user: dict):
    """函数只依赖抽象接口，不关心具体实现"""
    return repo.create(user)

# 可以轻松切换实现
memory_repo = InMemoryRepository()
user_id = save_user(memory_repo, {"name": "Alice", "email": "alice@example.com"})
print(f"创建用户 ID: {user_id}")
print(f"所有用户: {memory_repo.list_all()}")
```

### 示例二：模板方法模式

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    """数据处理器 - 模板方法模式"""

    def process(self, data):
        """模板方法 - 定义处理流程"""
        # 1. 验证数据
        validated = self.validate(data)

        # 2. 转换数据
        transformed = self.transform(validated)

        # 3. 保存数据
        result = self.save(transformed)

        # 4. 后处理（钩子方法，可选重写）
        self.post_process(result)

        return result

    @abstractmethod
    def validate(self, data):
        """验证数据 - 必须实现"""
        pass

    @abstractmethod
    def transform(self, data):
        """转换数据 - 必须实现"""
        pass

    @abstractmethod
    def save(self, data):
        """保存数据 - 必须实现"""
        pass

    def post_process(self, result):
        """后处理 - 钩子方法，默认不做任何事"""
        pass

class JSONProcessor(DataProcessor):
    """JSON 数据处理器"""

    def validate(self, data):
        if not isinstance(data, dict):
            raise ValueError("数据必须是字典")
        if 'id' not in data:
            raise ValueError("数据必须包含 id 字段")
        print(f"JSON 验证通过: {data}")
        return data

    def transform(self, data):
        # 添加时间戳
        import time
        data['timestamp'] = time.time()
        print(f"JSON 转换完成: {data}")
        return data

    def save(self, data):
        # 模拟保存到文件
        import json
        result = json.dumps(data, indent=2)
        print(f"JSON 保存完成")
        return result

    def post_process(self, result):
        print(f"JSON 后处理: 数据长度 {len(result)} 字节")

class XMLProcessor(DataProcessor):
    """XML 数据处理器"""

    def validate(self, data):
        if not isinstance(data, dict):
            raise ValueError("数据必须是字典")
        print(f"XML 验证通过: {data}")
        return data

    def transform(self, data):
        # 转换为 XML 格式
        xml_parts = ['<?xml version="1.0"?>', '<root>']
        for key, value in data.items():
            xml_parts.append(f"  <{key}>{value}</{key}>")
        xml_parts.append('</root>')
        result = '\n'.join(xml_parts)
        print(f"XML 转换完成")
        return result

    def save(self, data):
        # 模拟保存
        print(f"XML 保存完成")
        return data

# 使用
data = {"id": 1, "name": "测试", "value": 100}

print("=== JSON 处理 ===")
json_processor = JSONProcessor()
json_result = json_processor.process(data.copy())

print("\n=== XML 处理 ===")
xml_processor = XMLProcessor()
xml_result = xml_processor.process(data.copy())
print(xml_result)
```

### 示例三：策略模式

```python
from abc import ABC, abstractmethod
from typing import List

class SortStrategy(ABC):
    """排序策略抽象基类"""

    @property
    @abstractmethod
    def name(self) -> str:
        """策略名称"""
        pass

    @abstractmethod
    def sort(self, data: List) -> List:
        """执行排序"""
        pass

class BubbleSort(SortStrategy):
    @property
    def name(self):
        return "冒泡排序"

    def sort(self, data):
        result = data.copy()
        n = len(result)
        for i in range(n):
            for j in range(0, n-i-1):
                if result[j] > result[j+1]:
                    result[j], result[j+1] = result[j+1], result[j]
        return result

class QuickSort(SortStrategy):
    @property
    def name(self):
        return "快速排序"

    def sort(self, data):
        if len(data) <= 1:
            return data.copy()

        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        middle = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]

        return self.sort(left) + middle + self.sort(right)

class MergeSort(SortStrategy):
    @property
    def name(self):
        return "归并排序"

    def sort(self, data):
        if len(data) <= 1:
            return data.copy()

        mid = len(data) // 2
        left = self.sort(data[:mid])
        right = self.sort(data[mid:])

        return self._merge(left, right)

    def _merge(self, left, right):
        result = []
        i = j = 0

        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1

        result.extend(left[i:])
        result.extend(right[j:])
        return result

class Sorter:
    """排序器 - 使用策略模式"""

    def __init__(self, strategy: SortStrategy = None):
        self._strategy = strategy or QuickSort()

    @property
    def strategy(self) -> SortStrategy:
        return self._strategy

    @strategy.setter
    def strategy(self, strategy: SortStrategy):
        self._strategy = strategy

    def sort(self, data: List) -> List:
        print(f"使用 {self._strategy.name} 进行排序")
        return self._strategy.sort(data)

# 使用
data = [64, 34, 25, 12, 22, 11, 90]

sorter = Sorter()

# 默认使用快速排序
print(sorter.sort(data))

# 切换到冒泡排序
sorter.strategy = BubbleSort()
print(sorter.sort(data))

# 切换到归并排序
sorter.strategy = MergeSort()
print(sorter.sort(data))
```

### 示例四：虚拟子类 (register)

Python 的抽象基类支持"虚拟子类"机制，允许将一个不是通过继承实现的类注册为抽象基类的子类：

```python
from abc import ABC, abstractmethod

class Drawable(ABC):
    """可绘制对象的抽象基类"""

    @abstractmethod
    def draw(self):
        pass

# 方式一：传统继承
class Circle(Drawable):
    def draw(self):
        return "绘制圆形 ○"

# 方式二：虚拟子类（不继承，但注册为子类）
class Rectangle:
    """矩形类 - 没有继承 Drawable"""
    def draw(self):
        return "绘制矩形 □"

# 注册为虚拟子类
Drawable.register(Rectangle)

# 验证
circle = Circle()
rect = Rectangle()

print(isinstance(circle, Drawable))  # True（真正的子类）
print(isinstance(rect, Drawable))    # True（虚拟子类）
print(issubclass(Rectangle, Drawable))  # True

# 注意：虚拟子类不会继承任何方法
# rect = Drawable.register(Rectangle)  # register 返回原类

# 可以使用装饰器语法注册
@Drawable.register
class Triangle:
    def draw(self):
        return "绘制三角形 △"

print(isinstance(Triangle(), Drawable))  # True
```

**虚拟子类的特点：**

1. **不继承任何方法**：只是类型检查时被认为是子类
2. **不检查抽象方法**：即使没有实现抽象方法也能注册
3. **MRO 不变**：不会出现在方法解析顺序中
4. **用于适配器模式**：将第三方类适配到你的类型系统

```python
from abc import ABC, abstractmethod

class Serializable(ABC):
    @abstractmethod
    def to_dict(self):
        pass

# 第三方类（你无法修改）
class ThirdPartyUser:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    def as_dict(self):  # 注意：方法名不同
        return {"name": self.name, "email": self.email}

# 创建适配器
class UserAdapter:
    def __init__(self, user: ThirdPartyUser):
        self._user = user

    def to_dict(self):
        return self._user.as_dict()

# 或者直接注册（如果方法兼容）
# 这里我们演示即使方法名不匹配也能注册
Serializable.register(ThirdPartyUser)

# 注意：这只是类型检查通过，实际调用会失败
user = ThirdPartyUser("Alice", "alice@example.com")
print(isinstance(user, Serializable))  # True
# user.to_dict()  # AttributeError: 'ThirdPartyUser' object has no attribute 'to_dict'

# 正确做法是使用适配器
adapter = UserAdapter(user)
print(adapter.to_dict())  # {'name': 'Alice', 'email': 'alice@example.com'}
```

### 示例五：`__subclasshook__` 自定义子类判断

`__subclasshook__` 允许你自定义 `issubclass()` 和 `isinstance()` 的行为：

```python
from abc import ABC, abstractmethod

class Closeable(ABC):
    """可关闭对象的抽象基类"""

    @abstractmethod
    def close(self):
        pass

    @classmethod
    def __subclasshook__(cls, C):
        """自定义子类判断逻辑"""
        if cls is Closeable:
            # 检查类是否有 close 方法
            if hasattr(C, 'close') and callable(getattr(C, 'close', None)):
                return True
        return NotImplemented

# 这个类没有继承 Closeable，但有 close 方法
class FileHandler:
    def __init__(self, filename):
        self.filename = filename
        self.file = None

    def open(self):
        self.file = open(self.filename, 'w')

    def close(self):
        if self.file:
            self.file.close()

# 由于 __subclasshook__，这个类被认为是 Closeable 的子类
handler = FileHandler("test.txt")
print(isinstance(handler, Closeable))  # True
print(issubclass(FileHandler, Closeable))  # True

# 没有 close 方法的类不是子类
class NoClose:
    pass

print(isinstance(NoClose(), Closeable))  # False
```

**`__subclasshook__` 返回值说明：**

| 返回值 | 含义 |
|--------|------|
| `True` | 被检查的类是子类 |
| `False` | 被检查的类不是子类 |
| `NotImplemented` | 使用默认的检查机制（继承或注册） |

```python
from abc import ABC

class Container(ABC):
    """容器抽象基类 - 必须有 __contains__ 和 __iter__"""

    @classmethod
    def __subclasshook__(cls, C):
        if cls is Container:
            # 检查必要的方法
            if (hasattr(C, '__contains__') and
                hasattr(C, '__iter__')):
                return True
        return NotImplemented

# 列表自动被识别为 Container
print(issubclass(list, Container))  # True
print(issubclass(dict, Container))  # True
print(issubclass(str, Container))   # True
print(issubclass(int, Container))   # False

# 自定义容器也会被识别
class MyContainer:
    def __init__(self, data):
        self._data = list(data)

    def __contains__(self, item):
        return item in self._data

    def __iter__(self):
        return iter(self._data)

print(issubclass(MyContainer, Container))  # True
```

## collections.abc 模块

Python 的 `collections.abc` 模块提供了一系列预定义的抽象基类，用于定义容器类型的接口。

### 常用的抽象基类

```python
from collections.abc import (
    Iterable,      # 可迭代对象：__iter__
    Iterator,      # 迭代器：__iter__, __next__
    Reversible,    # 可反向迭代：__reversed__
    Container,     # 容器：__contains__
    Hashable,      # 可哈希：__hash__
    Sized,         # 有大小：__len__
    Callable,      # 可调用：__call__
    Collection,    # 集合：Sized + Iterable + Container
    Sequence,      # 序列：Collection + __getitem__
    MutableSequence,  # 可变序列
    Set,           # 集合
    MutableSet,    # 可变集合
    Mapping,       # 映射
    MutableMapping,  # 可变映射
)

# 类型检查示例
print(isinstance([1, 2, 3], Sequence))      # True
print(isinstance((1, 2, 3), Sequence))      # True
print(isinstance({1, 2, 3}, Set))           # True
print(isinstance({'a': 1}, Mapping))        # True
print(isinstance(range(10), Sequence))      # True
print(isinstance(lambda x: x, Callable))    # True
```

### collections.abc 继承层次

```
                           +----------+
                           | Hashable |
                           +----------+
                                ^
                                |
+----------+  +----------+  +-----------+  +----------+
| Iterable |  | Sized    |  | Container |  | Callable |
+----------+  +----------+  +-----------+  +----------+
     ^             ^              ^
     |             |              |
     +-------------+--------------+
                   |
             +------------+
             | Collection |
             +------------+
                   ^
                   |
      +------------+-------------+
      |            |             |
+----------+  +--------+  +----------+
| Sequence |  |  Set   |  | Mapping  |
+----------+  +--------+  +----------+
      ^            ^            ^
      |            |            |
+----------------+ +------------+ +----------------+
| MutableSequence| | MutableSet | | MutableMapping |
+----------------+ +------------+ +----------------+
```

### 使用 collections.abc 实现自定义容器

```python
from collections.abc import MutableSequence

class ValidatedList(MutableSequence):
    """带验证的列表 - 只允许特定类型的元素"""

    def __init__(self, item_type, initial_data=None):
        self._item_type = item_type
        self._data = []
        if initial_data:
            for item in initial_data:
                self.append(item)

    def _validate(self, value):
        if not isinstance(value, self._item_type):
            raise TypeError(
                f"期望 {self._item_type.__name__}，"
                f"得到 {type(value).__name__}"
            )

    # 必须实现的抽象方法
    def __getitem__(self, index):
        return self._data[index]

    def __setitem__(self, index, value):
        self._validate(value)
        self._data[index] = value

    def __delitem__(self, index):
        del self._data[index]

    def __len__(self):
        return len(self._data)

    def insert(self, index, value):
        self._validate(value)
        self._data.insert(index, value)

    # 可选：自定义字符串表示
    def __repr__(self):
        return f"ValidatedList({self._item_type.__name__}, {self._data})"

# 使用
int_list = ValidatedList(int, [1, 2, 3])
print(int_list)  # ValidatedList(int, [1, 2, 3])

int_list.append(4)
print(int_list)  # ValidatedList(int, [1, 2, 3, 4])

# 尝试添加错误类型
try:
    int_list.append("string")
except TypeError as e:
    print(f"类型错误: {e}")  # 类型错误: 期望 int，得到 str

# 继承自 MutableSequence 后自动获得的方法
print(3 in int_list)     # True（__contains__）
print(list(reversed(int_list)))  # [4, 3, 2, 1]（__reversed__）
int_list.extend([5, 6])  # extend 方法
print(int_list)          # ValidatedList(int, [1, 2, 3, 4, 5, 6])
```

### 实现自定义映射

```python
from collections.abc import MutableMapping

class CaseInsensitiveDict(MutableMapping):
    """大小写不敏感的字典"""

    def __init__(self, data=None):
        self._data = {}
        if data:
            self.update(data)

    def _normalize_key(self, key):
        if isinstance(key, str):
            return key.lower()
        return key

    def __getitem__(self, key):
        return self._data[self._normalize_key(key)]

    def __setitem__(self, key, value):
        self._data[self._normalize_key(key)] = value

    def __delitem__(self, key):
        del self._data[self._normalize_key(key)]

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)

    def __repr__(self):
        return f"CaseInsensitiveDict({self._data})"

# 使用
headers = CaseInsensitiveDict({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
})

# 大小写不敏感的访问
print(headers['content-type'])  # application/json
print(headers['CONTENT-TYPE'])  # application/json
print(headers['Content-Type'])  # application/json

# 继承自 MutableMapping 后自动获得的方法
print(list(headers.keys()))    # ['content-type', 'authorization']
print(list(headers.values()))  # ['application/json', 'Bearer token123']
print(list(headers.items()))   # [('content-type', 'application/json'), ...]
headers.update({'Accept': 'text/html'})
print('accept' in headers)     # True
```

## 最佳实践

### 优先使用组合而非继承

```python
from abc import ABC, abstractmethod

# 不推荐：创建深层继承层次
class Animal(ABC):
    @abstractmethod
    def move(self): pass

class Mammal(Animal):
    @abstractmethod
    def feed_young(self): pass

class Dog(Mammal):
    def move(self):
        return "跑"
    def feed_young(self):
        return "哺乳"

# 推荐：使用组合和小接口
class Movable(ABC):
    @abstractmethod
    def move(self): pass

class Feedable(ABC):
    @abstractmethod
    def feed(self): pass

class Dog(Movable, Feedable):
    def move(self):
        return "跑"
    def feed(self):
        return "哺乳"
```

### 保持抽象基类简洁

```python
from abc import ABC, abstractmethod

# 不推荐：抽象基类包含太多方法
class BadRepository(ABC):
    @abstractmethod
    def create(self): pass
    @abstractmethod
    def read(self): pass
    @abstractmethod
    def update(self): pass
    @abstractmethod
    def delete(self): pass
    @abstractmethod
    def find_by_name(self): pass
    @abstractmethod
    def find_by_email(self): pass
    @abstractmethod
    def count(self): pass
    @abstractmethod
    def exists(self): pass
    # ... 更多方法

# 推荐：分离关注点
class Readable(ABC):
    @abstractmethod
    def read(self, id): pass

class Writable(ABC):
    @abstractmethod
    def create(self, item): pass
    @abstractmethod
    def update(self, id, item): pass
    @abstractmethod
    def delete(self, id): pass

class Searchable(ABC):
    @abstractmethod
    def find(self, **criteria): pass

class Repository(Readable, Writable, Searchable):
    """完整的仓库接口"""
    pass
```

### 为抽象方法提供文档和默认行为

```python
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    """支付处理器抽象基类

    子类必须实现:
    - process_payment(): 处理支付
    - refund(): 处理退款
    """

    @abstractmethod
    def process_payment(self, amount: float, currency: str = "USD") -> dict:
        """处理支付

        Args:
            amount: 支付金额
            currency: 货币代码，默认 USD

        Returns:
            包含 transaction_id 和 status 的字典

        Raises:
            PaymentError: 支付失败时
        """
        pass

    @abstractmethod
    def refund(self, transaction_id: str) -> bool:
        """处理退款

        Args:
            transaction_id: 原交易 ID

        Returns:
            退款是否成功
        """
        # 提供默认实现作为参考
        raise NotImplementedError("子类必须实现 refund 方法")

    def validate_amount(self, amount: float) -> bool:
        """验证金额（具体方法，子类可以直接使用）"""
        return amount > 0
```

### 使用类型注解增强可读性

```python
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    """泛型仓库抽象基类"""

    @abstractmethod
    def get(self, id: int) -> Optional[T]:
        """获取单个实体"""
        pass

    @abstractmethod
    def get_all(self) -> List[T]:
        """获取所有实体"""
        pass

    @abstractmethod
    def add(self, entity: T) -> T:
        """添加实体"""
        pass

    @abstractmethod
    def remove(self, entity: T) -> bool:
        """移除实体"""
        pass

class User:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

class UserRepository(Repository[User]):
    def __init__(self):
        self._users: List[User] = []

    def get(self, id: int) -> Optional[User]:
        for user in self._users:
            if user.id == id:
                return user
        return None

    def get_all(self) -> List[User]:
        return self._users.copy()

    def add(self, entity: User) -> User:
        self._users.append(entity)
        return entity

    def remove(self, entity: User) -> bool:
        if entity in self._users:
            self._users.remove(entity)
            return True
        return False
```

### 考虑使用 Protocol 作为替代方案

Python 3.8 引入的 `Protocol` 提供了结构化子类型（Structural Subtyping）：

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    """使用 Protocol 定义接口 - 不需要显式继承"""
    def draw(self) -> str: ...

class Circle:
    """Circle 没有继承 Drawable，但实现了 draw 方法"""
    def draw(self) -> str:
        return "绘制圆形"

class Square:
    def draw(self) -> str:
        return "绘制正方形"

def render(shape: Drawable) -> None:
    print(shape.draw())

# Circle 和 Square 都满足 Drawable 协议
render(Circle())  # 绘制圆形
render(Square())  # 绘制正方形

# 运行时检查（需要 @runtime_checkable）
print(isinstance(Circle(), Drawable))  # True
```

**ABC vs Protocol 对比：**

| 特性 | ABC | Protocol |
|------|-----|----------|
| 需要显式继承 | 是 | 否 |
| 运行时检查 | 默认支持 | 需要 @runtime_checkable |
| 可以有实现 | 是 | 是（但不推荐） |
| 类型检查器支持 | 是 | 是 |
| Python 版本 | 2.6+ | 3.8+ |

## 常见陷阱

### 陷阱一：忘记实现所有抽象方法

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self): pass

    @abstractmethod
    def perimeter(self): pass

# 错误：忘记实现 perimeter
class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        import math
        return math.pi * self.radius ** 2

    # 忘记实现 perimeter！

# 尝试实例化时才会报错
# circle = Circle(5)  # TypeError: Can't instantiate abstract class Circle
# with abstract method perimeter
```

**解决方案：** IDE 会提示未实现的抽象方法，养成使用 IDE 检查的习惯。

### 陷阱二：装饰器顺序错误

```python
from abc import ABC, abstractmethod

class Wrong(ABC):
    # 错误：装饰器顺序错误
    @abstractmethod
    @property
    def value(self):
        pass

class Correct(ABC):
    # 正确：@abstractmethod 应该在最内层
    @property
    @abstractmethod
    def value(self):
        pass
```

### 陷阱三：在抽象方法中调用其他抽象方法

```python
from abc import ABC, abstractmethod

class Processor(ABC):
    @abstractmethod
    def step1(self):
        pass

    @abstractmethod
    def step2(self):
        pass

    def process(self):
        # 这是安全的，因为 process 不是抽象方法
        # 子类必须先实现 step1 和 step2 才能实例化
        self.step1()
        self.step2()

# 但要小心这种情况
class BadBase(ABC):
    @abstractmethod
    def method(self):
        # 危险：在抽象方法中调用另一个抽象方法
        # 如果子类调用 super().method()，可能导致问题
        self.other_method()  # 如果 other_method 也是抽象的

    @abstractmethod
    def other_method(self):
        pass
```

### 陷阱四：虚拟子类不检查方法实现

```python
from abc import ABC, abstractmethod

class Printable(ABC):
    @abstractmethod
    def print_info(self):
        pass

class NoPrint:
    """没有 print_info 方法"""
    pass

# 可以注册，不会报错
Printable.register(NoPrint)

# isinstance 返回 True
obj = NoPrint()
print(isinstance(obj, Printable))  # True

# 但调用会失败
# obj.print_info()  # AttributeError: 'NoPrint' object has no attribute 'print_info'
```

**解决方案：** 使用虚拟子类时确保类确实实现了所需的接口，或使用 `__subclasshook__` 进行检查。

### 陷阱五：继承时不调用 super().__init__()

```python
from abc import ABC, abstractmethod

class Base(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def process(self):
        pass

class Derived(Base):
    def __init__(self, name, value):
        # 错误：忘记调用 super().__init__()
        self.value = value

    def process(self):
        print(f"处理 {self.name}")  # AttributeError: 'Derived' object has no attribute 'name'

# 正确做法
class CorrectDerived(Base):
    def __init__(self, name, value):
        super().__init__(name)  # 调用父类构造函数
        self.value = value

    def process(self):
        print(f"处理 {self.name} = {self.value}")
```

### 陷阱六：混淆抽象基类和接口

```python
from abc import ABC, abstractmethod

# 抽象基类可以有状态和具体实现
class AbstractRepository(ABC):
    def __init__(self):
        self._cache = {}  # 有状态

    def get_cached(self, key):  # 有具体实现
        return self._cache.get(key)

    @abstractmethod
    def fetch(self, key):  # 抽象方法
        pass

# 如果只需要定义接口，考虑使用 Protocol
from typing import Protocol

class RepositoryProtocol(Protocol):
    def fetch(self, key) -> Any: ...
    def save(self, key, value) -> None: ...
```

## 性能考量

### 抽象基类的开销

抽象基类本身几乎没有运行时性能开销：

```python
import timeit
from abc import ABC, abstractmethod

class WithABC(ABC):
    @abstractmethod
    def method(self):
        pass

class WithoutABC:
    pass

class ImplWithABC(WithABC):
    def method(self):
        return 42

class ImplWithoutABC(WithoutABC):
    def method(self):
        return 42

# 性能测试
def test_with_abc():
    obj = ImplWithABC()
    for _ in range(1000):
        obj.method()

def test_without_abc():
    obj = ImplWithoutABC()
    for _ in range(1000):
        obj.method()

# 两者性能几乎相同
print(f"有 ABC: {timeit.timeit(test_with_abc, number=1000):.4f} 秒")
print(f"无 ABC: {timeit.timeit(test_without_abc, number=1000):.4f} 秒")
```

### isinstance 检查的性能

```python
import timeit
from abc import ABC, abstractmethod

class MyABC(ABC):
    @abstractmethod
    def method(self): pass

class MyClass(MyABC):
    def method(self):
        return 42

# 注册虚拟子类
class VirtualSubclass:
    def method(self):
        return 42

MyABC.register(VirtualSubclass)

obj1 = MyClass()
obj2 = VirtualSubclass()

# isinstance 检查
def check_real():
    for _ in range(10000):
        isinstance(obj1, MyABC)

def check_virtual():
    for _ in range(10000):
        isinstance(obj2, MyABC)

def check_type():
    for _ in range(10000):
        type(obj1) == MyClass

# 虚拟子类检查比真正的继承稍慢
print(f"真正子类: {timeit.timeit(check_real, number=100):.4f} 秒")
print(f"虚拟子类: {timeit.timeit(check_virtual, number=100):.4f} 秒")
print(f"type 检查: {timeit.timeit(check_type, number=100):.4f} 秒")
```

**性能优化建议：**

- 在性能关键的循环中，避免频繁的 `isinstance` 检查
- 如果需要频繁检查，考虑缓存结果
- 对于虚拟子类，使用 `__subclasshook__` 可以更高效
- 考虑在热点路径中使用 `type()` 直接比较而非 `isinstance()`

## 实战场景

### 场景一：插件系统

```python
from abc import ABC, abstractmethod
from typing import Dict, Type
import importlib
import pkgutil

class Plugin(ABC):
    """插件基类"""

    @property
    @abstractmethod
    def name(self) -> str:
        """插件名称"""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """插件版本"""
        pass

    @abstractmethod
    def initialize(self) -> None:
        """初始化插件"""
        pass

    @abstractmethod
    def execute(self, *args, **kwargs):
        """执行插件功能"""
        pass

    def shutdown(self) -> None:
        """关闭插件（可选）"""
        pass

class PluginManager:
    """插件管理器"""

    def __init__(self):
        self._plugins: Dict[str, Plugin] = {}

    def register(self, plugin_class: Type[Plugin]) -> None:
        """注册插件"""
        plugin = plugin_class()
        plugin.initialize()
        self._plugins[plugin.name] = plugin
        print(f"注册插件: {plugin.name} v{plugin.version}")

    def get(self, name: str) -> Plugin:
        """获取插件"""
        return self._plugins.get(name)

    def execute(self, name: str, *args, **kwargs):
        """执行插件"""
        plugin = self.get(name)
        if plugin:
            return plugin.execute(*args, **kwargs)
        raise ValueError(f"插件 {name} 不存在")

    def shutdown_all(self) -> None:
        """关闭所有插件"""
        for plugin in self._plugins.values():
            plugin.shutdown()

# 具体插件实现
class LoggingPlugin(Plugin):
    @property
    def name(self):
        return "logging"

    @property
    def version(self):
        return "1.0.0"

    def initialize(self):
        self.logs = []
        print("日志插件初始化")

    def execute(self, message: str):
        self.logs.append(message)
        print(f"[LOG] {message}")
        return len(self.logs)

class CachePlugin(Plugin):
    @property
    def name(self):
        return "cache"

    @property
    def version(self):
        return "2.0.0"

    def initialize(self):
        self._cache = {}
        print("缓存插件初始化")

    def execute(self, key: str, value=None):
        if value is not None:
            self._cache[key] = value
            return True
        return self._cache.get(key)

    def shutdown(self):
        self._cache.clear()
        print("缓存插件关闭")

# 使用
manager = PluginManager()
manager.register(LoggingPlugin)
manager.register(CachePlugin)

manager.execute("logging", "应用启动")
manager.execute("cache", "user:1", {"name": "Alice"})
print(manager.execute("cache", "user:1"))

manager.shutdown_all()
```

### 场景二：测试桩和模拟

```python
from abc import ABC, abstractmethod
from typing import List, Optional
import json

class EmailService(ABC):
    """邮件服务抽象基类"""

    @abstractmethod
    def send(self, to: str, subject: str, body: str) -> bool:
        """发送邮件"""
        pass

    @abstractmethod
    def get_sent_emails(self) -> List[dict]:
        """获取已发送邮件"""
        pass

class RealEmailService(EmailService):
    """真实的邮件服务"""

    def __init__(self, smtp_server: str):
        self.smtp_server = smtp_server
        self._sent = []

    def send(self, to: str, subject: str, body: str) -> bool:
        # 实际发送邮件的逻辑
        print(f"通过 {self.smtp_server} 发送邮件到 {to}")
        self._sent.append({"to": to, "subject": subject, "body": body})
        return True

    def get_sent_emails(self) -> List[dict]:
        return self._sent.copy()

class MockEmailService(EmailService):
    """测试用的模拟邮件服务"""

    def __init__(self):
        self._sent = []
        self._should_fail = False

    def send(self, to: str, subject: str, body: str) -> bool:
        if self._should_fail:
            return False

        self._sent.append({
            "to": to,
            "subject": subject,
            "body": body
        })
        return True

    def get_sent_emails(self) -> List[dict]:
        return self._sent.copy()

    def set_should_fail(self, should_fail: bool):
        """设置是否模拟失败"""
        self._should_fail = should_fail

    def clear(self):
        """清除已发送邮件"""
        self._sent.clear()

class UserService:
    """用户服务 - 依赖邮件服务"""

    def __init__(self, email_service: EmailService):
        self._email_service = email_service

    def register_user(self, email: str, name: str) -> bool:
        # 注册逻辑...

        # 发送欢迎邮件
        success = self._email_service.send(
            to=email,
            subject="欢迎注册",
            body=f"你好 {name}，欢迎加入我们！"
        )

        return success

# 测试代码
def test_user_registration():
    # 使用模拟服务
    mock_email = MockEmailService()
    user_service = UserService(mock_email)

    # 测试成功注册
    result = user_service.register_user("test@example.com", "张三")
    assert result == True
    assert len(mock_email.get_sent_emails()) == 1
    assert mock_email.get_sent_emails()[0]["to"] == "test@example.com"

    # 测试邮件发送失败
    mock_email.clear()
    mock_email.set_should_fail(True)
    result = user_service.register_user("test@example.com", "李四")
    assert result == False

    print("所有测试通过！")

test_user_registration()
```

### 场景三：数据验证框架

```python
from abc import ABC, abstractmethod
from typing import Any, List, Optional
import re

class Validator(ABC):
    """验证器抽象基类"""

    @abstractmethod
    def validate(self, value: Any) -> bool:
        """验证值"""
        pass

    @property
    @abstractmethod
    def error_message(self) -> str:
        """错误信息"""
        pass

class Required(Validator):
    """必填验证器"""

    def validate(self, value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str) and value.strip() == "":
            return False
        return True

    @property
    def error_message(self) -> str:
        return "此字段是必填的"

class MinLength(Validator):
    """最小长度验证器"""

    def __init__(self, min_length: int):
        self.min_length = min_length

    def validate(self, value: Any) -> bool:
        if value is None:
            return True  # None 由 Required 验证器处理
        return len(str(value)) >= self.min_length

    @property
    def error_message(self) -> str:
        return f"长度不能少于 {self.min_length} 个字符"

class MaxLength(Validator):
    """最大长度验证器"""

    def __init__(self, max_length: int):
        self.max_length = max_length

    def validate(self, value: Any) -> bool:
        if value is None:
            return True
        return len(str(value)) <= self.max_length

    @property
    def error_message(self) -> str:
        return f"长度不能超过 {self.max_length} 个字符"

class Pattern(Validator):
    """正则表达式验证器"""

    def __init__(self, pattern: str, message: str = None):
        self.pattern = re.compile(pattern)
        self._message = message or f"格式不匹配: {pattern}"

    def validate(self, value: Any) -> bool:
        if value is None:
            return True
        return bool(self.pattern.match(str(value)))

    @property
    def error_message(self) -> str:
        return self._message

class Email(Pattern):
    """邮箱验证器"""

    def __init__(self):
        super().__init__(
            r'^[\w\.-]+@[\w\.-]+\.\w+$',
            "请输入有效的邮箱地址"
        )

class Range(Validator):
    """范围验证器"""

    def __init__(self, min_value: float = None, max_value: float = None):
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, value: Any) -> bool:
        if value is None:
            return True
        try:
            num = float(value)
            if self.min_value is not None and num < self.min_value:
                return False
            if self.max_value is not None and num > self.max_value:
                return False
            return True
        except (TypeError, ValueError):
            return False

    @property
    def error_message(self) -> str:
        if self.min_value is not None and self.max_value is not None:
            return f"值必须在 {self.min_value} 和 {self.max_value} 之间"
        elif self.min_value is not None:
            return f"值不能小于 {self.min_value}"
        elif self.max_value is not None:
            return f"值不能大于 {self.max_value}"
        return "值超出范围"

class Field:
    """字段定义"""

    def __init__(self, *validators: Validator):
        self.validators = list(validators)
        self._errors: List[str] = []

    def validate(self, value: Any) -> bool:
        self._errors = []
        for validator in self.validators:
            if not validator.validate(value):
                self._errors.append(validator.error_message)
        return len(self._errors) == 0

    @property
    def errors(self) -> List[str]:
        return self._errors.copy()

class Schema:
    """验证模式"""

    def __init__(self, **fields: Field):
        self.fields = fields

    def validate(self, data: dict) -> tuple:
        errors = {}
        validated_data = {}

        for name, field in self.fields.items():
            value = data.get(name)
            if field.validate(value):
                validated_data[name] = value
            else:
                errors[name] = field.errors

        return (len(errors) == 0, validated_data, errors)

# 使用
user_schema = Schema(
    username=Field(Required(), MinLength(3), MaxLength(20)),
    email=Field(Required(), Email()),
    age=Field(Range(min_value=0, max_value=150)),
    bio=Field(MaxLength(500))
)

# 验证数据
test_data = {
    "username": "ab",  # 太短
    "email": "invalid-email",  # 格式错误
    "age": 200,  # 超出范围
    "bio": "这是个人简介"
}

is_valid, validated, errors = user_schema.validate(test_data)

print(f"验证结果: {'通过' if is_valid else '失败'}")
if not is_valid:
    print("错误信息:")
    for field, field_errors in errors.items():
        for error in field_errors:
            print(f"  - {field}: {error}")
```

## 面试要点

### 常见面试问题

**Q1: 什么是抽象基类？为什么要使用它？**

A: 抽象基类（ABC）是一种不能被实例化的类，用于定义接口规范。使用它的原因：
- 强制子类实现特定方法
- 提供类型检查支持
- 使代码更加规范和可维护
- 支持依赖注入和测试

**Q2: ABC 和普通基类的区别是什么？**

A:
- ABC 不能直接实例化，普通基类可以
- ABC 可以强制子类实现特定方法
- ABC 支持虚拟子类注册
- ABC 使用 ABCMeta 元类

**Q3: @abstractmethod 可以有实现吗？**

A: 可以。抽象方法可以有默认实现，子类可以通过 `super()` 调用：

```python
from abc import ABC, abstractmethod

class Base(ABC):
    @abstractmethod
    def method(self):
        return "默认实现"

class Derived(Base):
    def method(self):
        base_result = super().method()
        return f"{base_result} + 扩展"
```

**Q4: 什么是虚拟子类？什么时候使用？**

A: 虚拟子类是通过 `register()` 方法注册的类，它不需要真正继承抽象基类，但会被 `isinstance()` 和 `issubclass()` 识别为子类。使用场景：
- 适配第三方库的类
- 后向兼容
- 结构化子类型

**Q5: `__subclasshook__` 的作用是什么？**

A: `__subclasshook__` 允许自定义 `issubclass()` 的判断逻辑。它可以基于鸭子类型来判断一个类是否是抽象基类的子类，而不需要显式继承或注册。

**Q6: 如何正确组合 @abstractmethod 和其他装饰器？**

A: `@abstractmethod` 必须是最内层的装饰器：

```python
class Example(ABC):
    @property
    @abstractmethod  # 最内层
    def value(self): pass

    @classmethod
    @abstractmethod  # 最内层
    def class_method(cls): pass
```

**Q7: ABC 和 Protocol 的区别是什么？**

A:
- ABC 需要显式继承，Protocol 不需要（结构化子类型）
- ABC 默认支持运行时检查，Protocol 需要 @runtime_checkable
- ABC 可以包含状态和具体实现，Protocol 主要用于定义接口
- Protocol 更适合与静态类型检查器配合使用

**Q8: collections.abc 模块有什么用？**

A: `collections.abc` 提供了预定义的抽象基类，用于定义容器类型的接口，如 `Iterable`、`Sequence`、`Mapping` 等。继承这些类可以获得很多默认实现的方法。

## 延伸阅读

### 官方文档
- [abc 模块官方文档](https://docs.python.org/3/library/abc.html)
- [collections.abc 模块文档](https://docs.python.org/3/library/collections.abc.html)
- [PEP 3119 - 引入抽象基类](https://peps.python.org/pep-3119/)
- [PEP 3141 - 数字类型的抽象基类](https://peps.python.org/pep-3141/)
- [PEP 544 - Protocols: 结构化子类型](https://peps.python.org/pep-0544/)

### 推荐书籍
- 《流畅的 Python》- 第 11 章：接口、协议和 ABC
- 《Python Cookbook》- 第 8 章：类与对象
- 《Effective Python》- 条目 28-32：类与继承

### 相关主题
- [Python 元类](/python/metaclasses) - 理解 ABCMeta 的工作原理
- [Python 描述符](/python/descriptors) - 实现自定义属性访问
- [设计模式](/architecture/design-patterns) - 抽象基类在设计模式中的应用
- [类型提示](/python/type-hints) - 使用 Protocol 实现结构化子类型

## 总结

抽象基类是 Python 面向对象编程中的重要工具，它在保持 Python 灵活性的同时，提供了接口定义和类型检查的能力。

### 核心要点回顾

1. **ABC 基础**：继承 `ABC` 类，使用 `@abstractmethod` 定义抽象方法
2. **强制实现**：子类必须实现所有抽象方法才能被实例化
3. **虚拟子类**：使用 `register()` 注册或 `__subclasshook__` 自定义判断
4. **collections.abc**：提供预定义的容器类型抽象基类
5. **装饰器顺序**：`@abstractmethod` 必须是最内层装饰器

### 使用建议

- 当需要定义接口规范时使用抽象基类
- 保持抽象基类简洁，遵循单一职责原则
- 优先使用组合而非深层继承
- 为抽象方法提供清晰的文档
- 考虑使用 `typing.Protocol` 作为更轻量的替代方案
- 在性能敏感的代码中谨慎使用 `isinstance` 检查
