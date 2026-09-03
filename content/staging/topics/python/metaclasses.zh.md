---
title: 元类
description: Python元类完全指南，类的类、__new__与__init__与类创建机制
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - 元类
  - metaclass
  - 元编程
status: imported
origin: old/src/content/docs/python/metaclasses.zh.md
divergence: 0.224
issues: []
legacy:
  category: Python
  subcategory: 高级特性
  order: 26
  lastUpdated: 2026-01-07
---

元类（Metaclass）是 Python 中最强大也最容易被误解的特性之一。Tim Peters 曾说过："元类是 99% 的用户都不需要担心的深层魔法。如果你在想是否需要使用元类，那你不需要。"

然而，理解元类对于深入掌握 Python 的对象模型至关重要，它也是很多著名框架（如 Django ORM、SQLAlchemy）的核心实现机制。

## 理解 Python 中的一切皆对象

在 Python 中，一切皆对象——包括类本身。

```python
class Person:
    pass

# 类也是对象
print(type(Person))  # <class 'type'>
print(isinstance(Person, object))  # True

# 可以像普通对象一样操作类
print(Person.__name__)  # Person
Person.species = "Homo sapiens"  # 动态添加属性
```

既然类是对象，那么类一定是某个"东西"的实例。这个"东西"就是元类。

## type：内置的元类

### type 的双重身份

`type` 在 Python 中有两个用途：

1. **查看对象类型**：`type(obj)` 返回对象的类型
2. **创建新类**：`type(name, bases, attrs)` 动态创建类

```python
# 用途一：查看类型
print(type(42))        # <class 'int'>
print(type("hello"))   # <class 'str'>
print(type([1, 2, 3])) # <class 'list'>

# 用途二：动态创建类
# type(类名, 父类元组, 属性字典)
Dog = type('Dog', (), {'species': 'Canis familiaris'})

dog = Dog()
print(dog.species)  # Canis familiaris
print(type(Dog))    # <class 'type'>
```

### type 与 object 的特殊关系

理解 Python 的对象模型，必须理解 `type` 和 `object` 之间的循环依赖关系：

```python
# object 是所有类的基类
print(isinstance(object, type))  # True
print(isinstance(type, object))  # True

# type 是所有类的元类（包括它自己）
print(type(object))  # <class 'type'>
print(type(type))    # <class 'type'>

# type 继承自 object，但 object 是 type 的实例
print(type.__bases__)     # (<class 'object'>,)
print(object.__bases__)   # ()
```

关系图解：

```
        ┌────────────────────────┐
        │                        │
        v         实例           │
     object ◄─────────────── type
        ^                        │
        │                        │
        │       继承自           │
        └────────────────────────┘
```

关键点：
- `type` 是自己的实例（`type(type) == type`）
- `object` 是 `type` 的实例（`type(object) == type`）
- `type` 继承自 `object`（`type.__bases__ == (object,)`）
- `object` 没有基类（`object.__bases__ == ()`）

### 使用 type 动态创建类

```python
# 传统的类定义
class TraditionalCat:
    species = "Felis catus"

    def __init__(self, name):
        self.name = name

    def meow(self):
        return f"{self.name} says meow!"

# 等价的 type 创建方式
def cat_init(self, name):
    self.name = name

def cat_meow(self):
    return f"{self.name} says meow!"

DynamicCat = type(
    'DynamicCat',                    # 类名
    (),                               # 父类元组（空表示继承 object）
    {                                 # 属性和方法字典
        'species': 'Felis catus',
        '__init__': cat_init,
        'meow': cat_meow
    }
)

# 两种方式创建的类行为完全相同
cat1 = TraditionalCat("Whiskers")
cat2 = DynamicCat("Mittens")

print(cat1.meow())  # Whiskers says meow!
print(cat2.meow())  # Mittens says meow!
```

### 创建带继承的类

```python
# 基类
class Animal:
    def breathe(self):
        return "Breathing..."

# 动态创建带继承的子类
Bird = type('Bird', (Animal,), {
    'can_fly': True,
    'chirp': lambda self: "Chirp chirp!"
})

bird = Bird()
print(bird.breathe())  # Breathing...（继承自 Animal）
print(bird.chirp())    # Chirp chirp!
print(bird.can_fly)    # True
```

## 类的创建过程

理解类是如何被创建的，是理解元类的关键。

### 完整的类创建流程

当 Python 解释器遇到 `class` 语句时：

```python
class MyClass(Base1, Base2, metaclass=Meta):
    class_attr = "value"

    def method(self):
        pass
```

实际执行过程：

1. **确定元类**：检查 `metaclass` 参数，或从父类继承，默认为 `type`
2. **准备命名空间**：调用 `Meta.__prepare__()` 获取类的命名空间
3. **执行类体**：在命名空间中执行类定义的代码
4. **创建类对象**：调用 `Meta.__new__()` 创建类
5. **初始化类对象**：调用 `Meta.__init__()` 初始化类

```python
class TracingMeta(type):
    """追踪类创建过程的元类"""

    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        print(f"1. __prepare__ 被调用: 准备 {name} 的命名空间")
        # 返回一个字典作为类的命名空间
        return super().__prepare__(name, bases, **kwargs)

    def __new__(mcs, name, bases, namespace, **kwargs):
        print(f"2. __new__ 被调用: 创建类 {name}")
        print(f"   命名空间内容: {list(namespace.keys())}")
        return super().__new__(mcs, name, bases, namespace)

    def __init__(cls, name, bases, namespace, **kwargs):
        print(f"3. __init__ 被调用: 初始化类 {name}")
        super().__init__(name, bases, namespace)

    def __call__(cls, *args, **kwargs):
        print(f"4. __call__ 被调用: 创建 {cls.__name__} 的实例")
        instance = super().__call__(*args, **kwargs)
        return instance

# 使用追踪元类
class Example(metaclass=TracingMeta):
    x = 1

    def method(self):
        pass

# 输出：
# __prepare__ 被调用: 准备 Example 的命名空间
# __new__ 被调用: 创建类 Example
#    命名空间内容: ['__module__', '__qualname__', 'x', 'method']
# __init__ 被调用: 初始化类 Example

print("--- 创建实例 ---")
obj = Example()
# 输出：
# __call__ 被调用: 创建 Example 的实例
```

### 详细流程图

```
class MyClass(metaclass=Meta):    # Python 遇到 class 语句
    ...
        │
        v
┌───────────────────────────────────┐
│  1. 确定元类                      │
│  - 显式指定 metaclass=Meta        │
│  - 或从父类继承                   │
│  - 默认使用 type                  │
└───────────────────────────────────┘
        │
        v
┌───────────────────────────────────┐
│  2. Meta.__prepare__(name, bases) │
│  - 返回命名空间字典                │
│  - 默认返回空 dict                │
└───────────────────────────────────┘
        │
        v
┌───────────────────────────────────┐
│  3. 执行类体代码                  │
│  - 在命名空间中执行               │
│  - 收集属性和方法                 │
└───────────────────────────────────┘
        │
        v
┌───────────────────────────────────┐
│  4. Meta.__new__(mcs, name,       │
│                  bases, namespace)│
│  - 创建类对象                     │
│  - 返回新类                       │
└───────────────────────────────────┘
        │
        v
┌───────────────────────────────────┐
│  5. Meta.__init__(cls, name,      │
│                   bases, namespace)│
│  - 初始化类对象                   │
│  - 可以添加额外属性               │
└───────────────────────────────────┘
        │
        v
    类创建完成！
```

## 创建自定义元类

### 基本语法

```python
class MyMeta(type):
    """自定义元类必须继承自 type"""
    pass

# 使用元类的三种方式

# 方式一：使用 metaclass 关键字参数
class MyClass1(metaclass=MyMeta):
    pass

# 方式二：继承使用了元类的类
class MyClass2(MyClass1):  # 自动继承 MyMeta 作为元类
    pass

# 方式三：使用 type() 直接创建
MyClass3 = MyMeta('MyClass3', (), {})

print(type(MyClass1))  # <class '__main__.MyMeta'>
print(type(MyClass2))  # <class '__main__.MyMeta'>
print(type(MyClass3))  # <class '__main__.MyMeta'>
```

### `__new__` vs `__init__` 详解

在元类中，`__new__` 和 `__init__` 的区别至关重要：

```python
class MetaExample(type):
    def __new__(mcs, name, bases, namespace):
        """
        创建类对象

        参数：
        - mcs: 元类本身（类似于普通类的 cls）
        - name: 要创建的类名（字符串）
        - bases: 父类元组
        - namespace: 类的命名空间（属性和方法字典）

        返回：新创建的类对象
        """
        print(f"__new__: 创建类 {name}")

        # 可以修改类名
        # name = "Modified" + name

        # 可以添加父类
        # bases = bases + (SomeMixin,)

        # 可以修改命名空间
        namespace['created_by'] = 'MetaExample'

        # 必须调用父类的 __new__ 来实际创建类
        cls = super().__new__(mcs, name, bases, namespace)
        return cls

    def __init__(cls, name, bases, namespace):
        """
        初始化类对象（此时类已经创建完成）

        参数：
        - cls: 刚创建的类对象（注意不是 mcs）
        - 其他参数同 __new__

        用于进行一些初始化操作，如注册类
        """
        print(f"__init__: 初始化类 {name}")

        # 可以给类添加额外属性
        cls.initialized = True

        super().__init__(name, bases, namespace)

class Test(metaclass=MetaExample):
    pass

print(Test.created_by)   # MetaExample
print(Test.initialized)  # True
```

**关键区别总结：**

| 方法 | 调用时机 | 主要用途 | 返回值 | 能否阻止类创建 |
|------|----------|----------|--------|----------------|
| `__new__` | 创建类之前 | 修改类的创建过程 | 必须返回类对象 | 可以（返回其他对象） |
| `__init__` | 创建类之后 | 初始化/注册类 | None | 不可以 |

### `__call__` 方法：控制实例化

元类的 `__call__` 控制类实例化的过程：

```python
class InstanceControlMeta(type):
    """控制实例创建的元类"""

    def __call__(cls, *args, **kwargs):
        """
        当使用 ClassName() 创建实例时调用

        执行流程：
        1. 调用 cls.__new__() 创建实例
        2. 调用 instance.__init__() 初始化实例
        3. 返回实例
        """
        print(f"即将创建 {cls.__name__} 的实例")
        print(f"  位置参数: {args}")
        print(f"  关键字参数: {kwargs}")

        # 可以在这里修改参数
        # args = (modified_args,)

        # 调用父类的 __call__，执行正常的实例化流程
        instance = super().__call__(*args, **kwargs)

        # 可以在这里修改实例
        instance._created_via_metacall = True

        print(f"实例创建完成: {instance}")
        return instance

class User(metaclass=InstanceControlMeta):
    def __init__(self, name):
        self.name = name

user = User("Alice")
# 输出：
# 即将创建 User 的实例
#   位置参数: ('Alice',)
#   关键字参数: {}
# 实例创建完成: <__main__.User object at 0x...>

print(user._created_via_metacall)  # True
```

### 使用 `__call__` 实现单例模式

```python
class SingletonMeta(type):
    """单例模式元类"""
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            # 第一次创建实例
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self, connection_string):
        self.connection_string = connection_string
        print(f"创建数据库连接: {connection_string}")

# 测试单例
db1 = Database("postgresql://localhost/db1")  # 创建数据库连接: postgresql://localhost/db1
db2 = Database("postgresql://localhost/db2")  # 不会打印，返回已存在的实例

print(db1 is db2)  # True
print(db2.connection_string)  # postgresql://localhost/db1（第一次的值）
```

### `__prepare__` 方法：自定义类命名空间

`__prepare__` 允许自定义类的命名空间，必须返回一个映射对象：

```python
from collections import OrderedDict

class OrderedMeta(type):
    """保持属性定义顺序的元类"""

    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        """
        准备类的命名空间

        参数：
        - mcs: 元类本身
        - name: 类名
        - bases: 父类元组
        - **kwargs: 传递给元类的关键字参数

        返回：用于存储类属性的映射对象
        """
        print(f"准备 {name} 的命名空间")
        # 返回 OrderedDict 来保持属性顺序
        # 注意：Python 3.7+ 普通 dict 已经保持插入顺序
        return OrderedDict()

    def __new__(mcs, name, bases, namespace, **kwargs):
        # 将有序的属性名保存为类属性
        cls = super().__new__(mcs, name, bases, dict(namespace))
        cls._field_order = [
            key for key in namespace.keys()
            if not key.startswith('_')
        ]
        return cls

class Form(metaclass=OrderedMeta):
    username = "text"
    email = "email"
    password = "password"
    confirm_password = "password"

print(Form._field_order)
# ['username', 'email', 'password', 'confirm_password']
```

#### 使用 `__prepare__` 实现禁止覆盖

```python
class NoOverwriteDict(dict):
    """禁止重复定义属性的字典"""

    def __setitem__(self, key, value):
        if key in self and not key.startswith('_'):
            raise TypeError(f"属性 '{key}' 不能被重复定义")
        super().__setitem__(key, value)

class StrictMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        return NoOverwriteDict()

    def __new__(mcs, name, bases, namespace, **kwargs):
        return super().__new__(mcs, name, bases, dict(namespace))

# 正常使用
class ValidClass(metaclass=StrictMeta):
    x = 1
    y = 2

# 这会抛出错误
# class InvalidClass(metaclass=StrictMeta):
#     x = 1
#     x = 2  # TypeError: 属性 'x' 不能被重复定义
```

## 实际应用案例

### 案例一：自动注册模式

这是框架中最常见的元类用法之一：

```python
class PluginRegistry(type):
    """自动注册插件的元类"""
    plugins = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # 不注册基类
        if bases:  # 有父类说明不是基类
            plugin_name = namespace.get('name', name.lower())
            mcs.plugins[plugin_name] = cls
            print(f"注册插件: {plugin_name}")

        return cls

    @classmethod
    def get_plugin(mcs, name):
        """获取已注册的插件"""
        return mcs.plugins.get(name)

    @classmethod
    def list_plugins(mcs):
        """列出所有注册的插件"""
        return list(mcs.plugins.keys())

class Plugin(metaclass=PluginRegistry):
    """插件基类"""
    def execute(self):
        raise NotImplementedError

class JSONPlugin(Plugin):
    name = "json"

    def execute(self):
        return "处理 JSON 数据"

class XMLPlugin(Plugin):
    name = "xml"

    def execute(self):
        return "处理 XML 数据"

class CSVPlugin(Plugin):
    # 没有指定 name，使用类名小写
    def execute(self):
        return "处理 CSV 数据"

# 使用注册表
print(PluginRegistry.list_plugins())  # ['json', 'xml', 'csvplugin']

# 动态获取并使用插件
json_handler = PluginRegistry.get_plugin('json')()
print(json_handler.execute())  # 处理 JSON 数据

# 遍历所有插件
for name, plugin_cls in PluginRegistry.plugins.items():
    plugin = plugin_cls()
    print(f"{name}: {plugin.execute()}")
```

### 案例二：简化版 ORM 实现

这是 Django ORM 和 SQLAlchemy 等框架的核心实现思想：

```python
class Field:
    """字段描述符基类"""

    def __init__(self, column_type, primary_key=False, nullable=True, default=None):
        self.column_type = column_type
        self.primary_key = primary_key
        self.nullable = nullable
        self.default = default
        self.name = None  # 由元类设置

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, type=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name, self.default)

    def __set__(self, obj, value):
        obj.__dict__[self.name] = value

    def validate(self, value):
        """子类可以重写此方法进行验证"""
        return True

class IntegerField(Field):
    def __init__(self, primary_key=False, nullable=True, default=None):
        super().__init__('INTEGER', primary_key, nullable, default)

    def validate(self, value):
        if value is not None and not isinstance(value, int):
            raise TypeError(f"{self.name} 必须是整数")
        return True

class StringField(Field):
    def __init__(self, max_length=255, nullable=True, default=None):
        super().__init__(f'VARCHAR({max_length})', nullable=nullable, default=default)
        self.max_length = max_length

    def validate(self, value):
        if value is not None:
            if not isinstance(value, str):
                raise TypeError(f"{self.name} 必须是字符串")
            if len(value) > self.max_length:
                raise ValueError(f"{self.name} 长度不能超过 {self.max_length}")
        return True

class BooleanField(Field):
    def __init__(self, nullable=True, default=None):
        super().__init__('BOOLEAN', nullable=nullable, default=default)

class ModelMeta(type):
    """ORM 模型元类"""

    def __new__(mcs, name, bases, namespace):
        # 跳过基类 Model
        if name == 'Model':
            return super().__new__(mcs, name, bases, namespace)

        # 收集字段
        fields = {}
        primary_key = None

        for key, value in namespace.items():
            if isinstance(value, Field):
                fields[key] = value
                if value.primary_key:
                    if primary_key:
                        raise TypeError(f"{name} 定义了多个主键")
                    primary_key = key

        # 获取表名
        table_name = namespace.get('__tablename__', name.lower())

        cls = super().__new__(mcs, name, bases, namespace)
        cls._fields = fields
        cls._primary_key = primary_key
        cls._table_name = table_name

        return cls

    def create_table_sql(cls):
        """生成建表 SQL"""
        columns = []
        for name, field in cls._fields.items():
            col_def = f"    {name} {field.column_type}"
            if field.primary_key:
                col_def += " PRIMARY KEY"
            if not field.nullable:
                col_def += " NOT NULL"
            if field.default is not None:
                if isinstance(field.default, str):
                    col_def += f" DEFAULT '{field.default}'"
                else:
                    col_def += f" DEFAULT {field.default}"
            columns.append(col_def)

        return f"CREATE TABLE {cls._table_name} (\n" + \
               ",\n".join(columns) + "\n);"

class Model(metaclass=ModelMeta):
    """ORM 模型基类"""

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key in self._fields:
                # 验证字段值
                self._fields[key].validate(value)
                setattr(self, key, value)

    def save(self):
        """生成 INSERT SQL"""
        fields = []
        values = []
        placeholders = []

        for name, field in self._fields.items():
            value = getattr(self, name, field.default)
            if value is not None:
                fields.append(name)
                placeholders.append('?')
                if isinstance(value, str):
                    values.append(f"'{value}'")
                elif isinstance(value, bool):
                    values.append('1' if value else '0')
                else:
                    values.append(str(value))

        sql = f"INSERT INTO {self._table_name} ({', '.join(fields)}) " \
              f"VALUES ({', '.join(placeholders)});"

        return sql, values

    def update(self):
        """生成 UPDATE SQL"""
        if not self._primary_key:
            raise ValueError("需要主键才能更新")

        pk_value = getattr(self, self._primary_key)
        if pk_value is None:
            raise ValueError("主键值不能为空")

        set_clauses = []
        values = []

        for name, field in self._fields.items():
            if not field.primary_key:
                value = getattr(self, name, None)
                if value is not None:
                    set_clauses.append(f"{name} = ?")
                    values.append(value)

        sql = f"UPDATE {self._table_name} SET {', '.join(set_clauses)} " \
              f"WHERE {self._primary_key} = ?;"
        values.append(pk_value)

        return sql, values

    @classmethod
    def find(cls, **conditions):
        """生成 SELECT SQL"""
        if conditions:
            where = ' AND '.join([f"{k} = ?" for k in conditions.keys()])
            sql = f"SELECT * FROM {cls._table_name} WHERE {where};"
        else:
            sql = f"SELECT * FROM {cls._table_name};"

        return sql, list(conditions.values())

    def __repr__(self):
        attrs = ', '.join(
            f"{name}={getattr(self, name, None)!r}"
            for name in self._fields
        )
        return f"{self.__class__.__name__}({attrs})"

# 定义模型
class User(Model):
    __tablename__ = 'users'

    id = IntegerField(primary_key=True)
    username = StringField(max_length=50, nullable=False)
    email = StringField(max_length=100)
    is_active = BooleanField(default=True)

class Article(Model):
    id = IntegerField(primary_key=True)
    title = StringField(max_length=200, nullable=False)
    author_id = IntegerField()

# 使用 ORM
print("=== 建表 SQL ===")
print(User.create_table_sql())
# CREATE TABLE users (
#     id INTEGER PRIMARY KEY,
#     username VARCHAR(50) NOT NULL,
#     email VARCHAR(100),
#     is_active BOOLEAN DEFAULT 1
# );

print("\n=== 插入数据 ===")
user = User(id=1, username='alice', email='alice@example.com')
print(user.save())
# ('INSERT INTO users (id, username, email, is_active) VALUES (?, ?, ?, ?);',
#  ['1', "'alice'", "'alice@example.com'", '1'])

print("\n=== 查询数据 ===")
print(User.find(username='alice', is_active=True))
# ('SELECT * FROM users WHERE username = ? AND is_active = ?;', ['alice', True])

print("\n=== 模型表示 ===")
print(user)
# User(id=1, username='alice', email='alice@example.com', is_active=True)
```

### 案例三：API 接口验证

为 REST API 自动添加参数验证：

```python
from functools import wraps
import re

class Validator:
    """验证器基类"""
    def validate(self, value):
        raise NotImplementedError

class Required(Validator):
    def validate(self, value):
        if value is None or value == '':
            raise ValueError("此字段是必需的")
        return value

class String(Validator):
    def __init__(self, min_length=0, max_length=None, pattern=None):
        self.min_length = min_length
        self.max_length = max_length
        self.pattern = re.compile(pattern) if pattern else None

    def validate(self, value):
        if not isinstance(value, str):
            raise TypeError("必须是字符串")
        if len(value) < self.min_length:
            raise ValueError(f"长度不能小于 {self.min_length}")
        if self.max_length and len(value) > self.max_length:
            raise ValueError(f"长度不能大于 {self.max_length}")
        if self.pattern and not self.pattern.match(value):
            raise ValueError("格式不正确")
        return value

class Integer(Validator):
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, value):
        if not isinstance(value, int):
            raise TypeError("必须是整数")
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"不能小于 {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"不能大于 {self.max_value}")
        return value

class Email(String):
    def __init__(self):
        super().__init__(pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')

    def validate(self, value):
        super().validate(value)
        return value.lower()

class APIMeta(type):
    """API 控制器元类"""

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # 为所有方法添加验证包装器
        for attr_name, attr_value in namespace.items():
            if callable(attr_value) and hasattr(attr_value, '_validators'):
                wrapped = mcs._create_validated_method(attr_value)
                setattr(cls, attr_name, wrapped)

        return cls

    @staticmethod
    def _create_validated_method(method):
        validators = method._validators

        @wraps(method)
        def wrapper(self, **kwargs):
            errors = {}
            validated_data = {}

            for param_name, param_validators in validators.items():
                value = kwargs.get(param_name)
                try:
                    for validator in param_validators:
                        value = validator.validate(value)
                    validated_data[param_name] = value
                except (ValueError, TypeError) as e:
                    errors[param_name] = str(e)

            if errors:
                return {'success': False, 'errors': errors}

            return method(self, **validated_data)

        return wrapper

def validate(**validators):
    """验证装饰器"""
    def decorator(func):
        func._validators = {
            name: v if isinstance(v, (list, tuple)) else [v]
            for name, v in validators.items()
        }
        return func
    return decorator

class APIController(metaclass=APIMeta):
    """API 控制器基类"""
    pass

class UserAPI(APIController):
    """用户 API"""

    @validate(
        username=[Required(), String(min_length=3, max_length=20)],
        email=[Required(), Email()],
        age=[Integer(min_value=0, max_value=150)]
    )
    def create_user(self, username, email, age=None):
        return {
            'success': True,
            'user': {
                'username': username,
                'email': email,
                'age': age
            }
        }

    @validate(
        user_id=[Required(), Integer(min_value=1)]
    )
    def get_user(self, user_id):
        return {
            'success': True,
            'user_id': user_id
        }

# 使用 API
api = UserAPI()

# 正确的请求
result = api.create_user(username='alice', email='Alice@Example.COM', age=25)
print(result)
# {'success': True, 'user': {'username': 'alice', 'email': 'alice@example.com', 'age': 25}}

# 错误的请求
result = api.create_user(username='ab', email='invalid-email', age=200)
print(result)
# {'success': False, 'errors': {
#     'username': '长度不能小于 3',
#     'email': '格式不正确',
#     'age': '不能大于 150'
# }}
```

### 案例四：属性自动验证

自动为类属性添加类型检查：

```python
class ValidatedProperty:
    """带验证的属性描述符"""

    def __init__(self, name, validator):
        self.name = name
        self.validator = validator
        self.storage_name = f'_validated_{name}'

    def __get__(self, obj, type=None):
        if obj is None:
            return self
        return getattr(obj, self.storage_name, None)

    def __set__(self, obj, value):
        validated_value = self.validator(value)
        setattr(obj, self.storage_name, validated_value)

class ValidatedMeta(type):
    """自动验证属性的元类"""

    def __new__(mcs, name, bases, namespace):
        # 收集验证规则
        validators = {}

        for key, value in list(namespace.items()):
            if key.startswith('validate_'):
                field_name = key[9:]  # 去掉 'validate_' 前缀
                validators[field_name] = value

        cls = super().__new__(mcs, name, bases, namespace)

        # 为每个有验证器的字段创建属性描述符
        for field_name, validator in validators.items():
            setattr(cls, field_name, ValidatedProperty(field_name, validator))

        cls._validators = validators
        return cls

class Person(metaclass=ValidatedMeta):
    def __init__(self, name, age, email):
        self.name = name
        self.age = age
        self.email = email

    def validate_name(value):
        if not isinstance(value, str) or len(value) < 2:
            raise ValueError("姓名必须是至少2个字符的字符串")
        return value.strip().title()

    def validate_age(value):
        if not isinstance(value, int) or value < 0 or value > 150:
            raise ValueError("年龄必须是0-150之间的整数")
        return value

    def validate_email(value):
        if not isinstance(value, str) or '@' not in value:
            raise ValueError("无效的邮箱格式")
        return value.lower().strip()

# 使用
person = Person("  alice  ", 25, "  Alice@Example.COM  ")
print(person.name)   # Alice（自动格式化）
print(person.age)    # 25
print(person.email)  # alice@example.com（自动小写和去空格）

# 验证错误
try:
    person.age = -5
except ValueError as e:
    print(f"验证失败: {e}")  # 验证失败: 年龄必须是0-150之间的整数

try:
    person.name = "A"
except ValueError as e:
    print(f"验证失败: {e}")  # 验证失败: 姓名必须是至少2个字符的字符串
```

## 元类继承与冲突解决

### 元类的继承规则

当一个类继承多个父类时，Python 需要确定使用哪个元类：

```python
class Meta1(type):
    def __new__(mcs, name, bases, namespace):
        print(f"Meta1 创建 {name}")
        return super().__new__(mcs, name, bases, namespace)

class Meta2(type):
    def __new__(mcs, name, bases, namespace):
        print(f"Meta2 创建 {name}")
        return super().__new__(mcs, name, bases, namespace)

class Base1(metaclass=Meta1):
    pass

class Base2(metaclass=Meta2):
    pass

# 这会导致元类冲突！
# class Child(Base1, Base2):  # TypeError: metaclass conflict
#     pass
```

### 解决元类冲突

```python
# 方法一：创建统一的元类（继承所有冲突的元类）
class CombinedMeta(Meta1, Meta2):
    def __new__(mcs, name, bases, namespace):
        print(f"CombinedMeta 创建 {name}")
        return super().__new__(mcs, name, bases, namespace)

class Child(Base1, Base2, metaclass=CombinedMeta):
    pass

# 输出：CombinedMeta 创建 Child

print(type(Child))  # <class '__main__.CombinedMeta'>
```

```python
# 方法二：动态创建组合元类
def get_combined_metaclass(*bases):
    """动态获取组合元类"""
    metaclasses = tuple(set(type(base) for base in bases))

    if len(metaclasses) == 1:
        return metaclasses[0]

    # 检查是否有元类继承关系
    for mc in metaclasses:
        if all(issubclass(mc, other) or issubclass(other, mc)
               for other in metaclasses):
            return mc

    # 创建新的组合元类
    return type('CombinedMeta', metaclasses, {})

class ChildDynamic(Base1, Base2, metaclass=get_combined_metaclass(Base1, Base2)):
    pass
```

## 元类与 `__init_subclass__`

Python 3.6 引入的 `__init_subclass__` 可以替代很多元类用例：

```python
class PluginBase:
    """使用 __init_subclass__ 实现插件注册"""
    _plugins = {}

    def __init_subclass__(cls, plugin_name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        name = plugin_name or cls.__name__.lower()
        PluginBase._plugins[name] = cls
        print(f"注册插件: {name}")

    @classmethod
    def get_plugin(cls, name):
        return cls._plugins.get(name)

class JSONHandler(PluginBase, plugin_name="json"):
    def handle(self):
        return "处理 JSON"

class XMLHandler(PluginBase):  # 使用默认名称
    def handle(self):
        return "处理 XML"

# 输出：
# 注册插件: json
# 注册插件: xmlhandler

print(PluginBase._plugins)
# {'json': <class 'JSONHandler'>, 'xmlhandler': <class 'XMLHandler'>}
```

### 何时使用元类 vs `__init_subclass__`

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 简单的子类注册/初始化 | `__init_subclass__` | 更简单，易于理解 |
| 需要修改类创建过程 | 元类 | 可以修改 `__new__` |
| 需要自定义命名空间 | 元类 | 可以使用 `__prepare__` |
| 控制实例创建 | 元类 | 可以使用 `__call__` |
| 需要影响类本身的行为 | 元类 | 元类方法成为类方法 |
| 与第三方库集成 | 元类 | 更大的控制能力 |

### 组合使用元类和 `__init_subclass__`

```python
class LoggingMeta(type):
    """记录类创建的元类"""

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        print(f"[元类] 类 {name} 已创建")
        return cls

class Base(metaclass=LoggingMeta):
    """同时使用元类和 __init_subclass__ 的基类"""

    def __init_subclass__(cls, category=None, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.category = category or "default"
        print(f"[__init_subclass__] 类 {cls.__name__} 分类为 {cls.category}")

class Plugin(Base, category="plugin"):
    pass

# 输出：
# [元类] 类 Base 已创建
# [元类] 类 Plugin 已创建
# [__init_subclass__] 类 Plugin 分类为 plugin
```

## 元类的最佳实践

### 谨慎使用元类

```python
# 不好：过度使用元类
class SimpleMeta(type):
    def __new__(mcs, name, bases, namespace):
        namespace['version'] = '1.0'
        return super().__new__(mcs, name, bases, namespace)

# 更好：使用类装饰器
def add_version(version='1.0'):
    def decorator(cls):
        cls.version = version
        return cls
    return decorator

@add_version('2.0')
class MyClass:
    pass

# 或者使用 __init_subclass__
class Versioned:
    def __init_subclass__(cls, version='1.0', **kwargs):
        super().__init_subclass__(**kwargs)
        cls.version = version

class MyClass(Versioned, version='2.0'):
    pass
```

### 保持元类简单且职责单一

```python
# 好的设计：职责单一
class RegistryMeta(type):
    """只负责注册的元类"""
    registry = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # 不注册基类
            mcs.registry[name] = cls
        return cls

class ValidationMeta(type):
    """只负责验证的元类"""

    def __new__(mcs, name, bases, namespace):
        # 验证必须定义某些方法
        required_methods = namespace.get('_required_methods', [])
        for method in required_methods:
            if method not in namespace:
                raise TypeError(f"类 {name} 必须定义方法 {method}")
        return super().__new__(mcs, name, bases, namespace)

# 如果需要组合功能，创建组合元类
class CombinedMeta(RegistryMeta, ValidationMeta):
    pass
```

### 提供清晰的文档和错误信息

```python
class DocumentedMeta(type):
    """
    自动文档化元类

    为使用此元类的类自动生成属性文档。

    使用方法：
        class MyClass(metaclass=DocumentedMeta):
            '''类的描述'''

            x: int  # x 坐标
            y: int  # y 坐标

    效果：
        自动将类型注解添加到文档字符串中。
    """

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # 生成清晰的错误信息
        annotations = namespace.get('__annotations__', {})
        if not annotations and not bases:
            import warnings
            warnings.warn(
                f"类 {name} 没有定义类型注解，"
                "建议使用类型注解以获得更好的文档",
                UserWarning
            )

        # 增强文档字符串
        if annotations:
            doc = cls.__doc__ or f'{name} 类'
            doc += '\n\n属性:\n'
            for attr, type_hint in annotations.items():
                type_name = getattr(type_hint, '__name__', str(type_hint))
                doc += f'    {attr} ({type_name})\n'
            cls.__doc__ = doc

        return cls
```

### 考虑可测试性

```python
class TestableMeta(type):
    """可测试的元类设计"""

    # 将功能分解为可测试的静态方法
    @staticmethod
    def process_namespace(namespace):
        """处理命名空间 - 可以独立测试"""
        processed = dict(namespace)
        processed['_processed'] = True
        return processed

    @staticmethod
    def validate_class(name, bases, namespace):
        """验证类定义 - 可以独立测试"""
        if 'required_attr' not in namespace:
            raise TypeError(f"{name} 必须定义 required_attr")
        return True

    def __new__(mcs, name, bases, namespace):
        mcs.validate_class(name, bases, namespace)
        processed = mcs.process_namespace(namespace)
        return super().__new__(mcs, name, bases, processed)

# 测试代码
def test_process_namespace():
    result = TestableMeta.process_namespace({'x': 1})
    assert result['_processed'] == True
    assert result['x'] == 1

def test_validate_class():
    import pytest
    with pytest.raises(TypeError):
        TestableMeta.validate_class('Test', (), {})
```

## 调试元类

```python
class DebugMeta(type):
    """用于调试的元类"""

    DEBUG = True  # 可以全局开关调试

    def __new__(mcs, name, bases, namespace):
        if mcs.DEBUG:
            print(f"\n{'='*60}")
            print(f"创建类: {name}")
            print(f"{'='*60}")
            print(f"父类: {[b.__name__ for b in bases]}")
            print(f"\n属性和方法:")
            for key, value in namespace.items():
                if not key.startswith('__'):
                    value_type = type(value).__name__
                    if callable(value):
                        print(f"  - {key}(): {value_type}")
                    else:
                        print(f"  - {key} = {value!r} ({value_type})")

        cls = super().__new__(mcs, name, bases, namespace)

        if mcs.DEBUG:
            print(f"\nMRO: {[c.__name__ for c in cls.__mro__]}")
            print(f"类创建完成: {cls}")
            print(f"{'='*60}\n")

        return cls

    def __call__(cls, *args, **kwargs):
        if cls.__class__.DEBUG:
            print(f"[DEBUG] 实例化 {cls.__name__}")
            print(f"  args: {args}")
            print(f"  kwargs: {kwargs}")

        instance = super().__call__(*args, **kwargs)

        if cls.__class__.DEBUG:
            print(f"  实例: {instance}")

        return instance

# 使用调试元类
class TestClass(metaclass=DebugMeta):
    x = 10
    name = "test"

    def method(self):
        pass

    def another_method(self, arg):
        return arg

# 关闭调试
# DebugMeta.DEBUG = False

obj = TestClass()
```

## 总结

元类是 Python 对象模型的核心组成部分，它让我们能够：

### 核心能力

1. **控制类的创建过程**：通过 `__new__` 和 `__init__`
2. **控制实例化过程**：通过 `__call__`
3. **自定义类命名空间**：通过 `__prepare__`
4. **实现高级设计模式**：如单例、注册表、ORM 等

### 决策流程图

```
需要自定义类的行为？
├── 否 → 不需要元类
└── 是 → 需要修改类创建过程？
    ├── 否 → 能用 __init_subclass__ 解决？
    │   ├── 是 → 使用 __init_subclass__
    │   └── 否 → 使用类装饰器
    └── 是 → 需要以下能力之一？
        - 修改 __new__ 参数（类名、基类、命名空间）
        - 使用 __prepare__ 自定义命名空间
        - 控制实例化过程（__call__）
        - 添加类级别的方法（元类方法）
        ├── 是 → 使用元类
        └── 否 → 考虑更简单的方案
```

### 方法对比

| 方法 | 复杂度 | 继承性 | 能力范围 | 适用场景 |
|------|--------|--------|----------|----------|
| 类装饰器 | 低 | 不自动传递 | 类创建后修改 | 单个类的简单修改 |
| `__init_subclass__` | 中 | 自动传递 | 子类初始化 | 子类注册/配置 |
| 元类 | 高 | 自动传递 | 完全控制 | 框架开发/复杂需求 |

### 要点回顾

- `type` 是所有类的默认元类，也是自己的实例
- 元类通过 `metaclass=` 参数指定，会自动继承给子类
- `__prepare__` → `__new__` → `__init__` 是类创建的完整流程
- `__call__` 控制实例化，可用于实现单例等模式
- 元类在 Django、SQLAlchemy 等框架中广泛使用
- 优先考虑更简单的替代方案

正如 Tim Peters 所说，大多数时候你不需要元类。但当你需要时，它是一个无可替代的强大工具。理解元类不仅能帮助你读懂框架源码，也能在必要时让你构建出优雅的抽象。
