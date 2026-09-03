---
title: Python 描述符
description: 深入理解 Python 描述符协议：__get__、__set__、__delete__ 方法，数据描述符与非数据描述符，property 实现原理与实战应用
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - 描述符
  - 属性管理
  - 元编程
  - OOP
status: imported
origin: old/src/content/docs/python/descriptors.zh.md
divergence: 0.214
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 面向对象编程
  order: 9
  lastUpdated: 2026-01-07
---

描述符(Descriptor)是 Python 中一个强大但经常被忽视的特性。它是实现属性访问控制的底层机制，也是 `property`、`classmethod`、`staticmethod` 等内置装饰器的实现基础。理解描述符协议是深入掌握 Python 面向对象编程的关键。

## 概念解释

### 什么是描述符

描述符是一个实现了描述符协议的对象。描述符协议包含以下方法：

- `__get__(self, instance, owner)`: 获取属性值时调用
- `__set__(self, instance, value)`: 设置属性值时调用
- `__delete__(self, instance)`: 删除属性时调用
- `__set_name__(self, owner, name)`: 描述符绑定到类时调用(Python 3.6+)

当一个类的属性是描述符对象时，访问该属性会触发描述符协议中的相应方法，而不是直接返回描述符对象本身。

```python
class Descriptor:
    """一个简单的描述符示例"""

    def __get__(self, instance, owner):
        print(f"__get__ 被调用: instance={instance}, owner={owner}")
        return "描述符返回的值"

    def __set__(self, instance, value):
        print(f"__set__ 被调用: instance={instance}, value={value}")

    def __delete__(self, instance):
        print(f"__delete__ 被调用: instance={instance}")

class MyClass:
    attr = Descriptor()  # attr 是一个描述符

obj = MyClass()
print(obj.attr)      # 触发 __get__
obj.attr = "新值"    # 触发 __set__
del obj.attr         # 触发 __delete__
```

**输出：**
```
__get__ 被调用: instance=<__main__.MyClass object at 0x...>, owner=<class '__main__.MyClass'>
描述符返回的值
__set__ 被调用: instance=<__main__.MyClass object at 0x...>, value=新值
__delete__ 被调用: instance=<__main__.MyClass object at 0x...>
```

### 历史背景

描述符协议是 Python 2.2 引入的特性，作为"新式类"(new-style classes)的一部分。它的设计目标是：

1. 提供一种通用的属性访问控制机制
2. 统一 `property`、方法绑定等特性的实现
3. 为元编程提供更强大的工具

### 解决什么问题

描述符主要解决以下问题：

1. **属性验证**：在设置属性时进行类型检查或值验证
2. **延迟计算**：只在需要时才计算属性值
3. **属性访问控制**：实现只读属性、受保护属性等
4. **可复用的属性逻辑**：将属性管理逻辑封装为可复用的组件

## 核心原理

### 描述符的触发机制

当访问对象的属性时，Python 会按照特定的顺序查找属性值。描述符的介入改变了这个查找过程：

```python
# 属性访问 obj.attr 的查找顺序：
# 类的 __getattribute__ 方法
# 数据描述符（实现了 __get__ 和 __set__）
# 实例的 __dict__
# 非数据描述符（只实现了 __get__）
# 类的 __dict__
# 父类的 __dict__（遵循 MRO）
# __getattr__ 方法（如果定义了）
```

### 属性访问的底层实现

`object.__getattribute__` 方法实现了描述符协议的调用逻辑：

```python
def __getattribute__(self, name):
    """简化的属性访问实现"""
    # 获取类
    cls = type(self)

    # 在类及其父类中查找描述符
    for klass in cls.__mro__:
        if name in klass.__dict__:
            attr = klass.__dict__[name]

            # 检查是否是数据描述符
            if hasattr(attr, '__get__') and hasattr(attr, '__set__'):
                return attr.__get__(self, cls)
            break

    # 在实例 __dict__ 中查找
    if name in self.__dict__:
        return self.__dict__[name]

    # 检查是否是非数据描述符
    for klass in cls.__mro__:
        if name in klass.__dict__:
            attr = klass.__dict__[name]
            if hasattr(attr, '__get__'):
                return attr.__get__(self, cls)
            return attr

    raise AttributeError(f"'{cls.__name__}' object has no attribute '{name}'")
```

### 数据描述符 vs 非数据描述符

描述符分为两类，它们的优先级不同：

**数据描述符(Data Descriptor)**：
- 同时实现了 `__get__` 和 `__set__` 方法
- 优先级高于实例 `__dict__`

**非数据描述符(Non-data Descriptor)**：
- 只实现了 `__get__` 方法
- 优先级低于实例 `__dict__`

```python
class DataDescriptor:
    """数据描述符：实现 __get__ 和 __set__"""

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get('_value', '默认值')

    def __set__(self, instance, value):
        instance.__dict__['_value'] = value

class NonDataDescriptor:
    """非数据描述符：只实现 __get__"""

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return "非数据描述符的值"

class MyClass:
    data_attr = DataDescriptor()
    non_data_attr = NonDataDescriptor()

obj = MyClass()

# 数据描述符的行为
print(obj.data_attr)              # 默认值（从描述符获取）
obj.__dict__['data_attr'] = '实例值'
print(obj.data_attr)              # 默认值（描述符优先级更高）

# 非数据描述符的行为
print(obj.non_data_attr)          # 非数据描述符的值
obj.__dict__['non_data_attr'] = '实例值'
print(obj.non_data_attr)          # 实例值（实例 __dict__ 优先级更高）
```

**输出：**
```
默认值
默认值
非数据描述符的值
实例值
```

### 方法也是描述符

Python 中的函数实现了 `__get__` 方法，这就是方法绑定的工作原理：

```python
class MyClass:
    def method(self):
        pass

# 函数是非数据描述符
print(hasattr(MyClass.method, '__get__'))  # True
print(hasattr(MyClass.method, '__set__'))  # False

obj = MyClass()

# 通过类访问：返回函数本身
print(MyClass.__dict__['method'])  # <function MyClass.method at 0x...>

# 通过实例访问：触发 __get__，返回绑定方法
print(obj.method)  # <bound method MyClass.method of <__main__.MyClass object at 0x...>>
```

## 核心要点

### 描述符协议的三个方法

```python
class CompleteDescriptor:
    """完整的描述符实现"""

    def __set_name__(self, owner, name):
        """
        Python 3.6+ 自动调用
        owner: 拥有此描述符的类
        name: 描述符被赋予的属性名
        """
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        """
        获取属性值时调用
        instance: 访问属性的实例，如果通过类访问则为 None
        owner: 拥有此描述符的类
        """
        if instance is None:
            return self  # 通过类访问时返回描述符本身
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        """
        设置属性值时调用
        instance: 设置属性的实例
        value: 要设置的值
        """
        setattr(instance, self.private_name, value)

    def __delete__(self, instance):
        """
        删除属性时调用
        instance: 删除属性的实例
        """
        delattr(instance, self.private_name)
```

### `__set_name__` 的重要性

在 Python 3.6 之前，描述符需要手动传入属性名：

```python
# Python 3.5 及之前的方式
class OldDescriptor:
    def __init__(self, name):
        self.name = name  # 需要手动传入名称
        self.private_name = f'_{name}'

class MyClass:
    attr = OldDescriptor('attr')  # 冗余！

# Python 3.6+ 的方式
class ModernDescriptor:
    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

class MyClass:
    attr = ModernDescriptor()  # 自动获取名称
```

### 实例检查的重要性

在 `__get__` 方法中，应该检查 `instance` 是否为 `None`：

```python
class SafeDescriptor:
    def __get__(self, instance, owner):
        if instance is None:
            # 通过类访问：MyClass.attr
            return self
        # 通过实例访问：obj.attr
        return instance.__dict__.get(self.name)
```

### 存储位置的选择

描述符可以将数据存储在不同位置：

```python
# 方式1：存储在实例的 __dict__ 中（推荐）
class InstanceStorageDescriptor:
    def __set_name__(self, owner, name):
        self.name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value

# 方式2：存储在描述符自身（需要处理多实例问题）
class DescriptorStorageDescriptor:
    def __init__(self):
        self.storage = {}  # 使用 WeakKeyDictionary 更好

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self.storage.get(instance)

    def __set__(self, instance, value):
        self.storage[instance] = value

# 使用 WeakKeyDictionary 避免内存泄漏
from weakref import WeakKeyDictionary

class BetterDescriptorStorage:
    def __init__(self):
        self.storage = WeakKeyDictionary()

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self.storage.get(instance)

    def __set__(self, instance, value):
        self.storage[instance] = value
```

## 代码示例

### 示例1：类型验证描述符

```python
class TypedProperty:
    """类型验证描述符"""

    def __init__(self, expected_type, default=None):
        self.expected_type = expected_type
        self.default = default

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, self.default)

    def __set__(self, instance, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(
                f"属性 '{self.name}' 必须是 {self.expected_type.__name__} 类型，"
                f"而不是 {type(value).__name__}"
            )
        setattr(instance, self.private_name, value)

    def __delete__(self, instance):
        delattr(instance, self.private_name)

class Person:
    name = TypedProperty(str)
    age = TypedProperty(int)
    email = TypedProperty(str, default="未设置")

    def __init__(self, name, age, email=None):
        self.name = name
        self.age = age
        if email:
            self.email = email

# 使用示例
p = Person("张三", 25)
print(f"姓名: {p.name}, 年龄: {p.age}, 邮箱: {p.email}")

p.age = 26  # 正常
print(f"更新后年龄: {p.age}")

try:
    p.age = "二十六"  # 类型错误
except TypeError as e:
    print(f"类型错误: {e}")
```

**输出：**
```
姓名: 张三, 年龄: 25, 邮箱: 未设置
更新后年龄: 26
类型错误: 属性 'age' 必须是 int 类型，而不是 str
```

### 示例2：范围验证描述符

```python
class RangeValidated:
    """范围验证描述符"""

    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"'{self.name}' 不能小于 {self.min_value}，当前值: {value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"'{self.name}' 不能大于 {self.max_value}，当前值: {value}")
        setattr(instance, self.private_name, value)

class Student:
    score = RangeValidated(min_value=0, max_value=100)
    age = RangeValidated(min_value=0, max_value=150)

    def __init__(self, name, score, age):
        self.name = name
        self.score = score
        self.age = age

# 使用示例
s = Student("李四", 85, 20)
print(f"学生: {s.name}, 成绩: {s.score}, 年龄: {s.age}")

try:
    s.score = 150  # 超出范围
except ValueError as e:
    print(f"验证错误: {e}")
```

### 示例3：延迟计算描述符（惰性求值）

```python
class LazyProperty:
    """延迟计算描述符"""

    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # 计算值并缓存到实例 __dict__ 中
        value = self.func(instance)
        # 直接设置到 __dict__，下次访问将绕过描述符
        instance.__dict__[self.name] = value
        return value

class DataAnalyzer:
    def __init__(self, data):
        self.data = data

    @LazyProperty
    def statistics(self):
        """只在首次访问时计算"""
        print("计算统计信息...")
        import time
        time.sleep(1)  # 模拟耗时计算
        return {
            'sum': sum(self.data),
            'avg': sum(self.data) / len(self.data),
            'max': max(self.data),
            'min': min(self.data)
        }

# 使用示例
analyzer = DataAnalyzer([1, 2, 3, 4, 5])
print("创建分析器完成")

print("\n首次访问统计信息:")
print(analyzer.statistics)

print("\n再次访问（从缓存获取）:")
print(analyzer.statistics)
```

**输出：**
```
创建分析器完成

首次访问统计信息:
计算统计信息...
{'sum': 15, 'avg': 3.0, 'max': 5, 'min': 1}

再次访问（从缓存获取）:
{'sum': 15, 'avg': 3.0, 'max': 5, 'min': 1}
```

### 示例4：实现 property 装饰器

```python
class MyProperty:
    """property 的简化实现"""

    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        self.__doc__ = doc if doc else (fget.__doc__ if fget else None)

    def __get__(self, instance, owner):
        if instance is None:
            return self
        if self.fget is None:
            raise AttributeError("无法读取属性")
        return self.fget(instance)

    def __set__(self, instance, value):
        if self.fset is None:
            raise AttributeError("无法设置属性")
        self.fset(instance, value)

    def __delete__(self, instance):
        if self.fdel is None:
            raise AttributeError("无法删除属性")
        self.fdel(instance)

    def getter(self, fget):
        return type(self)(fget, self.fset, self.fdel, self.__doc__)

    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel, self.__doc__)

    def deleter(self, fdel):
        return type(self)(self.fget, self.fset, fdel, self.__doc__)

class Circle:
    def __init__(self, radius):
        self._radius = radius

    @MyProperty
    def radius(self):
        """圆的半径"""
        return self._radius

    @radius.setter
    def radius(self, value):
        if value <= 0:
            raise ValueError("半径必须为正数")
        self._radius = value

    @MyProperty
    def area(self):
        """圆的面积（只读）"""
        import math
        return math.pi * self._radius ** 2

# 使用示例
c = Circle(5)
print(f"半径: {c.radius}")
print(f"面积: {c.area:.2f}")

c.radius = 10
print(f"新半径: {c.radius}")
print(f"新面积: {c.area:.2f}")

try:
    c.area = 100  # 尝试设置只读属性
except AttributeError as e:
    print(f"错误: {e}")
```

### 示例5：classmethod 和 staticmethod 的实现

```python
class MyClassMethod:
    """classmethod 的简化实现"""

    def __init__(self, func):
        self.func = func

    def __get__(self, instance, owner):
        # 无论通过类还是实例访问，都返回绑定到类的方法
        def bound_method(*args, **kwargs):
            return self.func(owner, *args, **kwargs)
        return bound_method

class MyStaticMethod:
    """staticmethod 的简化实现"""

    def __init__(self, func):
        self.func = func

    def __get__(self, instance, owner):
        # 直接返回原始函数，不绑定
        return self.func

class Demo:
    value = 100

    @MyClassMethod
    def class_method(cls, x):
        return f"类方法: cls.value = {cls.value}, x = {x}"

    @MyStaticMethod
    def static_method(x, y):
        return f"静态方法: x + y = {x + y}"

# 使用示例
obj = Demo()

# 通过类调用
print(Demo.class_method(10))
print(Demo.static_method(3, 4))

# 通过实例调用
print(obj.class_method(20))
print(obj.static_method(5, 6))
```

### 示例6：只读描述符

```python
class ReadOnly:
    """只读描述符"""

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        # 只允许设置一次
        if hasattr(instance, self.private_name):
            raise AttributeError(f"'{self.name}' 是只读属性，不能修改")
        setattr(instance, self.private_name, value)

class ImmutablePoint:
    x = ReadOnly()
    y = ReadOnly()

    def __init__(self, x, y):
        self.x = x  # 首次设置
        self.y = y  # 首次设置

    def __repr__(self):
        return f"ImmutablePoint({self.x}, {self.y})"

# 使用示例
point = ImmutablePoint(10, 20)
print(point)

try:
    point.x = 100  # 尝试修改
except AttributeError as e:
    print(f"错误: {e}")
```

### 示例7：带缓存过期的描述符

```python
import time
from functools import wraps

class CachedProperty:
    """带过期时间的缓存描述符"""

    def __init__(self, ttl=60):
        """
        ttl: 缓存生存时间（秒）
        """
        self.ttl = ttl
        self.func = None

    def __call__(self, func):
        self.func = func
        self.name = func.__name__
        return self

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # 检查缓存
        cache_name = f'_cache_{self.name}'
        time_name = f'_time_{self.name}'

        cached_time = getattr(instance, time_name, 0)
        if time.time() - cached_time < self.ttl:
            return getattr(instance, cache_name)

        # 计算新值
        value = self.func(instance)
        setattr(instance, cache_name, value)
        setattr(instance, time_name, time.time())
        return value

    def invalidate(self, instance):
        """手动使缓存失效"""
        cache_name = f'_cache_{self.name}'
        time_name = f'_time_{self.name}'
        if hasattr(instance, cache_name):
            delattr(instance, cache_name)
        if hasattr(instance, time_name):
            delattr(instance, time_name)

class WeatherService:
    def __init__(self, city):
        self.city = city

    @CachedProperty(ttl=5)  # 5秒缓存
    def temperature(self):
        """获取温度（模拟API调用）"""
        print(f"正在获取 {self.city} 的温度...")
        import random
        return random.randint(15, 35)

# 使用示例
weather = WeatherService("北京")

print("第一次获取:")
print(f"温度: {weather.temperature}度")

print("\n立即再次获取（从缓存）:")
print(f"温度: {weather.temperature}度")

print("\n等待缓存过期...")
time.sleep(6)

print("\n缓存过期后获取:")
print(f"温度: {weather.temperature}度")
```

## 最佳实践

### 始终处理类访问的情况

```python
class GoodDescriptor:
    def __get__(self, instance, owner):
        if instance is None:
            return self  # 通过类访问时返回描述符
        return self._get_value(instance)

    def _get_value(self, instance):
        # 实际的获取逻辑
        pass
```

### 使用 `__set_name__` 自动获取属性名

```python
class ModernDescriptor:
    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = f'_{name}'

    # 不再需要在 __init__ 中传入名称
```

### 优先存储数据到实例 `__dict__`

```python
class PreferredStorage:
    def __set_name__(self, owner, name):
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.private_name)

    def __set__(self, instance, value):
        instance.__dict__[self.private_name] = value
```

### 提供清晰的错误信息

```python
class ValidatedDescriptor:
    def __set__(self, instance, value):
        if not self._validate(value):
            raise ValueError(
                f"属性 '{self.name}' 的值 {value!r} 无效: {self._error_message(value)}"
            )
        instance.__dict__[self.private_name] = value

    def _validate(self, value):
        raise NotImplementedError

    def _error_message(self, value):
        raise NotImplementedError
```

### 使用 WeakKeyDictionary 避免内存泄漏

```python
from weakref import WeakKeyDictionary

class SafeStorageDescriptor:
    def __init__(self):
        self._storage = WeakKeyDictionary()

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self._storage.get(instance)

    def __set__(self, instance, value):
        self._storage[instance] = value
```

### 文档化描述符的行为

```python
class DocumentedDescriptor:
    """
    一个带有完整文档的描述符。

    这个描述符提供了类型检查功能，确保属性值符合指定的类型。

    Attributes:
        expected_type: 期望的值类型
        allow_none: 是否允许 None 值

    Example:
        class User:
            name = DocumentedDescriptor(str)
            age = DocumentedDescriptor(int, allow_none=True)
    """

    def __init__(self, expected_type, allow_none=False):
        """
        初始化描述符。

        Args:
            expected_type: 属性值的期望类型
            allow_none: 是否允许 None 值，默认为 False
        """
        self.expected_type = expected_type
        self.allow_none = allow_none
```

## 常见陷阱

### 陷阱1：忘记处理类访问

```python
# 错误示例
class BadDescriptor:
    def __get__(self, instance, owner):
        return instance.__dict__['value']  # instance 可能为 None！

# 正确示例
class GoodDescriptor:
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get('value')
```

### 陷阱2：数据存储在描述符实例中

```python
# 错误示例：所有实例共享同一个值
class BadStorageDescriptor:
    def __init__(self):
        self.value = None  # 所有实例共享！

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return self.value

    def __set__(self, instance, value):
        self.value = value

class MyClass:
    attr = BadStorageDescriptor()

obj1 = MyClass()
obj2 = MyClass()
obj1.attr = "对象1的值"
print(obj2.attr)  # 输出: 对象1的值（错误！）

# 正确示例：数据存储在实例中
class GoodStorageDescriptor:
    def __set_name__(self, owner, name):
        self.name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value
```

### 陷阱3：混淆数据描述符和非数据描述符

```python
class NonDataDescriptor:
    """只有 __get__，是非数据描述符"""
    def __get__(self, instance, owner):
        return "描述符的值"

class MyClass:
    attr = NonDataDescriptor()

obj = MyClass()
print(obj.attr)  # 描述符的值

# 设置实例属性会覆盖非数据描述符
obj.__dict__['attr'] = "实例的值"
print(obj.attr)  # 实例的值（非数据描述符被覆盖）

# 如果不希望被覆盖，需要实现 __set__
class DataDescriptor:
    """实现 __get__ 和 __set__，是数据描述符"""
    def __get__(self, instance, owner):
        return "描述符的值"

    def __set__(self, instance, value):
        raise AttributeError("不允许设置")
```

### 陷阱4：在 `__init__` 中调用描述符

```python
class Descriptor:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name, "默认值")

    def __set__(self, instance, value):
        print(f"设置 {self.name} = {value}")
        instance.__dict__[self.name] = value

class MyClass:
    attr = Descriptor()

    def __init__(self):
        # 这会触发描述符的 __set__ 方法
        self.attr = "初始值"  # 正确

        # 如果想绕过描述符直接设置，使用 __dict__
        # self.__dict__['attr'] = "初始值"  # 绕过描述符
```

### 陷阱5：忽略继承关系

```python
class BaseDescriptor:
    def __set_name__(self, owner, name):
        self.name = name
        print(f"描述符被添加到类 {owner.__name__}")

class Parent:
    attr = BaseDescriptor()  # 输出: 描述符被添加到类 Parent

class Child(Parent):
    pass  # __set_name__ 不会被再次调用！

# 子类继承了描述符，但不会触发 __set_name__
# 如果需要在子类中重新配置，必须显式定义
```

## 性能考量

### 描述符的性能开销

```python
import timeit

class WithDescriptor:
    class ValueDescriptor:
        def __set_name__(self, owner, name):
            self.name = f'_{name}'

        def __get__(self, instance, owner):
            if instance is None:
                return self
            return instance.__dict__.get(self.name)

        def __set__(self, instance, value):
            instance.__dict__[self.name] = value

    value = ValueDescriptor()

class WithoutDescriptor:
    def __init__(self):
        self._value = None

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, val):
        self._value = val

class DirectAccess:
    def __init__(self):
        self.value = None

# 性能测试
def test_descriptor():
    obj = WithDescriptor()
    for _ in range(1000):
        obj.value = 42
        _ = obj.value

def test_property():
    obj = WithoutDescriptor()
    for _ in range(1000):
        obj.value = 42
        _ = obj.value

def test_direct():
    obj = DirectAccess()
    for _ in range(1000):
        obj.value = 42
        _ = obj.value

# 运行测试
print("描述符:", timeit.timeit(test_descriptor, number=1000))
print("property:", timeit.timeit(test_property, number=1000))
print("直接访问:", timeit.timeit(test_direct, number=1000))
```

**典型结果：**
```
描述符: 0.45秒
property: 0.50秒
直接访问: 0.15秒
```

### 优化建议

1. **对于高频访问的属性**：考虑使用直接属性或 `__slots__`
2. **对于计算密集型属性**：使用延迟计算和缓存
3. **避免在描述符中进行复杂操作**：保持 `__get__` 和 `__set__` 简洁
4. **使用 `__slots__` 结合描述符**：减少内存占用

```python
class OptimizedClass:
    __slots__ = ('_name', '_age')

    class ValidatedString:
        def __set_name__(self, owner, name):
            self.name = f'_{name}'

        def __get__(self, instance, owner):
            if instance is None:
                return self
            return getattr(instance, self.name, None)

        def __set__(self, instance, value):
            if not isinstance(value, str):
                raise TypeError("必须是字符串")
            setattr(instance, self.name, value)

    name = ValidatedString()

    def __init__(self, name, age):
        self.name = name
        self._age = age
```

## 实战场景

### 场景1：ORM 字段定义

```python
class Field:
    """ORM 字段基类"""

    def __set_name__(self, owner, name):
        self.name = name
        self.column_name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name)

    def __set__(self, instance, value):
        value = self.validate(value)
        instance.__dict__[self.name] = value

    def validate(self, value):
        return value

class StringField(Field):
    def __init__(self, max_length=255):
        self.max_length = max_length

    def validate(self, value):
        if value is not None:
            if not isinstance(value, str):
                raise TypeError(f"{self.name} 必须是字符串")
            if len(value) > self.max_length:
                raise ValueError(f"{self.name} 长度不能超过 {self.max_length}")
        return value

class IntegerField(Field):
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, value):
        if value is not None:
            if not isinstance(value, int):
                raise TypeError(f"{self.name} 必须是整数")
            if self.min_value is not None and value < self.min_value:
                raise ValueError(f"{self.name} 不能小于 {self.min_value}")
            if self.max_value is not None and value > self.max_value:
                raise ValueError(f"{self.name} 不能大于 {self.max_value}")
        return value

class Model:
    """简化的模型基类"""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __repr__(self):
        fields = ', '.join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{self.__class__.__name__}({fields})"

class User(Model):
    username = StringField(max_length=50)
    email = StringField(max_length=100)
    age = IntegerField(min_value=0, max_value=150)

# 使用示例
user = User(username="zhangsan", email="zhangsan@example.com", age=25)
print(user)

try:
    user.age = -1
except ValueError as e:
    print(f"验证错误: {e}")
```

### 场景2：配置管理系统

```python
import os
import json

class ConfigValue:
    """配置值描述符"""

    def __init__(self, default=None, env_var=None, validator=None):
        self.default = default
        self.env_var = env_var
        self.validator = validator

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self

        # 优先从实例获取
        value = getattr(instance, self.private_name, None)
        if value is not None:
            return value

        # 其次从环境变量获取
        if self.env_var:
            env_value = os.environ.get(self.env_var)
            if env_value is not None:
                return self._convert(env_value)

        # 最后使用默认值
        return self.default

    def __set__(self, instance, value):
        if self.validator and not self.validator(value):
            raise ValueError(f"配置项 '{self.name}' 的值无效: {value}")
        setattr(instance, self.private_name, value)

    def _convert(self, value):
        # 简单类型转换
        if isinstance(self.default, bool):
            return value.lower() in ('true', '1', 'yes')
        if isinstance(self.default, int):
            return int(value)
        if isinstance(self.default, float):
            return float(value)
        return value

class AppConfig:
    debug = ConfigValue(default=False, env_var='APP_DEBUG')
    port = ConfigValue(default=8080, env_var='APP_PORT')
    database_url = ConfigValue(
        default='sqlite:///app.db',
        env_var='DATABASE_URL'
    )
    max_connections = ConfigValue(
        default=10,
        env_var='MAX_CONNECTIONS',
        validator=lambda x: 1 <= x <= 100
    )

# 使用示例
config = AppConfig()
print(f"Debug: {config.debug}")
print(f"Port: {config.port}")
print(f"Database: {config.database_url}")

# 可以覆盖配置
config.port = 9000
print(f"New Port: {config.port}")
```

### 场景3：数据绑定和观察者模式

```python
class Observable:
    """可观察的描述符"""

    def __init__(self):
        self.observers = []

    def __set_name__(self, owner, name):
        self.name = name
        self.private_name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.private_name, None)

    def __set__(self, instance, value):
        old_value = getattr(instance, self.private_name, None)
        setattr(instance, self.private_name, value)

        # 通知所有观察者
        if old_value != value:
            for callback in self.observers:
                callback(instance, self.name, old_value, value)

    def add_observer(self, callback):
        self.observers.append(callback)

    def remove_observer(self, callback):
        self.observers.remove(callback)

class Stock:
    price = Observable()
    name = Observable()

    def __init__(self, name, price):
        self.name = name
        self.price = price

def price_change_handler(instance, attr, old, new):
    if attr == 'price':
        change = new - old if old else 0
        direction = "上涨" if change > 0 else "下跌"
        print(f"{instance.name} 价格{direction}: {old} -> {new} (变化: {change:+.2f})")

# 注册观察者
Stock.price.add_observer(price_change_handler)

# 使用示例
stock = Stock("AAPL", 150.0)
stock.price = 155.0  # 触发通知
stock.price = 148.0  # 触发通知
```

## 面试要点

### 什么是描述符？描述符协议包含哪些方法？

**答案要点：**
- 描述符是实现了 `__get__`、`__set__`、`__delete__` 中至少一个方法的对象
- 描述符协议包含四个方法（Python 3.6+）：
  - `__get__(self, instance, owner)`: 获取属性值
  - `__set__(self, instance, value)`: 设置属性值
  - `__delete__(self, instance)`: 删除属性
  - `__set_name__(self, owner, name)`: 自动获取属性名

### 数据描述符和非数据描述符有什么区别？

**答案要点：**
- **数据描述符**：实现了 `__get__` 和 `__set__`，优先级高于实例 `__dict__`
- **非数据描述符**：只实现了 `__get__`，优先级低于实例 `__dict__`
- 这个区别决定了属性访问的查找顺序

### property 是如何实现的？

**答案要点：**
- `property` 是一个数据描述符
- 它存储了 `fget`、`fset`、`fdel` 三个函数
- 通过 `__get__` 调用 `fget`，`__set__` 调用 `fset`，`__delete__` 调用 `fdel`

### 描述符中的数据应该存储在哪里？

**答案要点：**
- 推荐存储在**实例的 `__dict__`** 中，使用私有属性名
- 如果存储在描述符自身，需要使用 `WeakKeyDictionary` 避免内存泄漏
- 不应该直接存储在描述符实例的普通属性中（会导致所有实例共享数据）

### `__getattribute__` 和 `__getattr__` 有什么区别？它们与描述符的关系是什么？

**答案要点：**
- `__getattribute__`：每次属性访问都会调用，是描述符协议的调用者
- `__getattr__`：只有在属性不存在时才调用，是最后的兜底
- 描述符的 `__get__` 方法是由 `__getattribute__` 调用的

### 如何实现一个只读描述符？

**答案要点：**
```python
class ReadOnly:
    def __set_name__(self, owner, name):
        self.name = f'_{name}'

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.name, None)

    def __set__(self, instance, value):
        if hasattr(instance, self.name):
            raise AttributeError("只读属性")
        setattr(instance, self.name, value)
```

### 为什么函数可以作为方法使用？

**答案要点：**
- Python 函数实现了 `__get__` 方法，是非数据描述符
- 当通过实例访问函数时，`__get__` 返回一个绑定方法
- 绑定方法会自动将实例作为第一个参数传入

## 延伸阅读

### 官方文档
- [Python 数据模型 - 描述符](https://docs.python.org/zh-cn/3/reference/datamodel.html#descriptors)
- [描述符使用指南](https://docs.python.org/zh-cn/3/howto/descriptor.html)

### 经典书籍
- 《流畅的Python》第 20 章 - 属性描述符
- 《Python Cookbook》第 8 章 - 类与对象
- 《Python 高级编程》- 描述符相关章节

### 优质文章
- [Descriptor HowTo Guide](https://docs.python.org/3/howto/descriptor.html) - Raymond Hettinger
- [Python Descriptors Demystified](https://realpython.com/python-descriptors/) - Real Python
- [Understanding Python's descriptor protocol](https://www.ibm.com/developerworks/library/os-pythondescriptors/)

### 相关源码
- CPython 中 `property` 的实现: Objects/descrobject.c
- `functools.cached_property` 的实现
- Django ORM 中的字段描述符
- SQLAlchemy 中的 Column 描述符
