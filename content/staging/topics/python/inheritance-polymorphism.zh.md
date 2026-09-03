---
title: Python 继承与多态
description: 掌握 Python 继承机制、MRO、super() 使用与多态实现
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - 继承
  - 多态
  - MRO
status: imported
origin: old/src/content/docs/python/inheritance-polymorphism.zh.md
divergence: 0.179
issues: []
legacy:
  category: Python
  subcategory: 面向对象编程
  order: 6
  lastUpdated: 2026-01-07
---

继承和多态是面向对象编程的核心概念。Python 提供了灵活且强大的继承机制,支持单继承、多继承,并通过方法解析顺序(MRO)和多态特性实现代码复用和扩展。

## 单继承基础

### 基本语法

单继承是指一个子类只继承一个父类。

```python
class Animal:
    """动物基类"""

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def speak(self):
        raise NotImplementedError("子类必须实现 speak 方法")

    def info(self):
        return f"{self.name} 是 {self.age} 岁"


class Dog(Animal):
    """狗类继承自动物类"""

    def __init__(self, name, age, breed):
        # 调用父类构造函数
        super().__init__(name, age)
        self.breed = breed

    def speak(self):
        return f"{self.name} 说: 汪汪!"

    def fetch(self):
        return f"{self.name} 正在捡球"


# 使用示例
dog = Dog("旺财", 3, "金毛")
print(dog.speak())        # 旺财 说: 汪汪!
print(dog.info())         # 旺财 是 3 岁
print(dog.fetch())        # 旺财 正在捡球
```

### 方法重写

子类可以重写父类的方法以提供特定实现。

```python
class Cat(Animal):
    """猫类"""

    def __init__(self, name, age, color):
        super().__init__(name, age)
        self.color = color

    def speak(self):
        """重写父类方法"""
        return f"{self.name} 说: 喵喵~"

    def info(self):
        """重写并扩展父类方法"""
        base_info = super().info()
        return f"{base_info}, 颜色是 {self.color}"


cat = Cat("咪咪", 2, "白色")
print(cat.speak())        # 咪咪 说: 喵喵~
print(cat.info())         # 咪咪 是 2 岁, 颜色是 白色
```

### isinstance 和 issubclass

```python
print(isinstance(dog, Dog))      # True
print(isinstance(dog, Animal))   # True
print(isinstance(dog, Cat))      # False

print(issubclass(Dog, Animal))   # True
print(issubclass(Cat, Animal))   # True
print(issubclass(Dog, Cat))      # False
```

## 多继承

### 基本多继承

Python 支持多继承,一个类可以继承多个父类。

```python
class Flyable:
    """飞行能力"""

    def fly(self):
        return f"{self.name} 正在飞行"


class Swimmable:
    """游泳能力"""

    def swim(self):
        return f"{self.name} 正在游泳"


class Duck(Animal, Flyable, Swimmable):
    """鸭子类:可以说话、飞行和游泳"""

    def __init__(self, name, age):
        super().__init__(name, age)

    def speak(self):
        return f"{self.name} 说: 嘎嘎!"


duck = Duck("唐老鸭", 5)
print(duck.speak())       # 唐老鸭 说: 嘎嘎!
print(duck.fly())         # 唐老鸭 正在飞行
print(duck.swim())        # 唐老鸭 正在游泳
print(duck.info())        # 唐老鸭 是 5 岁
```

### 多继承的复杂情况

```python
class A:
    def method(self):
        print("A.method")


class B(A):
    def method(self):
        print("B.method")


class C(A):
    def method(self):
        print("C.method")


class D(B, C):
    """D 继承 B 和 C,它们都继承自 A"""
    pass


d = D()
d.method()  # B.method - 遵循 MRO 顺序
```

## MRO (Method Resolution Order) 方法解析顺序

### 什么是 MRO

MRO 定义了 Python 在多继承中查找方法的顺序。Python 使用 C3 线性化算法来确定 MRO。

```python
# 查看 MRO
print(Duck.__mro__)
# 或者
print(Duck.mro())
```

### MRO 的 C3 算法规则

```python
class Base1:
    def method(self):
        print("Base1")


class Base2:
    def method(self):
        print("Base2")


class Derived1(Base1, Base2):
    pass


class Derived2(Base2, Base1):
    pass


class Final(Derived1, Derived2):
    """这会导致 MRO 冲突"""
    pass


# 这将抛出 TypeError: Cannot create a consistent method resolution
# 因为 Derived1 要求 Base1 在 Base2 之前,
# 而 Derived2 要求 Base2 在 Base1 之前,产生冲突
```

### 正确的 MRO 示例

```python
class Vehicle:
    """交通工具基类"""

    def __init__(self, brand):
        self.brand = brand
        print(f"Vehicle.__init__: {brand}")


class Electric:
    """电动能力"""

    def __init__(self, battery_capacity):
        self.battery_capacity = battery_capacity
        print(f"Electric.__init__: {battery_capacity}kWh")


class Car(Vehicle):
    """汽车类"""

    def __init__(self, brand, model):
        super().__init__(brand)
        self.model = model
        print(f"Car.__init__: {model}")


class ElectricCar(Car, Electric):
    """电动汽车"""

    def __init__(self, brand, model, battery_capacity):
        # 使用 super() 按照 MRO 顺序初始化
        Car.__init__(self, brand, model)
        Electric.__init__(self, battery_capacity)
        print("ElectricCar.__init__ 完成")


# 查看 MRO
print("MRO:", [cls.__name__ for cls in ElectricCar.__mro__])
# MRO: ['ElectricCar', 'Car', 'Vehicle', 'Electric', 'object']

tesla = ElectricCar("Tesla", "Model S", 100)
```

### 使用 super() 配合 MRO

```python
class A:
    def __init__(self):
        print("A.__init__")
        super().__init__()


class B:
    def __init__(self):
        print("B.__init__")
        super().__init__()


class C(A, B):
    def __init__(self):
        print("C.__init__")
        super().__init__()


# MRO: C -> A -> B -> object
print("MRO:", [cls.__name__ for cls in C.__mro__])

c = C()
# 输出:
# MRO: ['C', 'A', 'B', 'object']
# C.__init__
# A.__init__
# B.__init__
```

## super() 函数详解

### super() 的作用

`super()` 用于调用父类的方法,它根据 MRO 顺序查找下一个类。

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)


class Square(Rectangle):
    def __init__(self, side):
        # 使用 super() 调用父类构造函数
        super().__init__(side, side)

    def __str__(self):
        return f"正方形(边长={self.width})"


square = Square(5)
print(square)                 # 正方形(边长=5)
print(f"面积: {square.area()}")      # 面积: 25
print(f"周长: {square.perimeter()}")  # 周长: 20
```

### super() 的两种用法

```python
class Parent:
    def method(self):
        return "父类方法"


class Child(Parent):
    def method(self):
        # 方式 1: 无参数形式 (Python 3 推荐)
        result1 = super().method()

        # 方式 2: 显式参数形式
        result2 = super(Child, self).method()

        return f"子类方法调用了: {result1}"


child = Child()
print(child.method())
```

### super() 在多继承中的应用

```python
class LoggerMixin:
    """日志混入类"""

    def log(self, message):
        print(f"[LOG] {message}")


class ValidationMixin:
    """验证混入类"""

    def validate(self):
        print("[VALIDATE] 数据验证通过")
        return True


class User:
    """用户基类"""

    def __init__(self, username, email):
        self.username = username
        self.email = email


class AdminUser(User, LoggerMixin, ValidationMixin):
    """管理员用户"""

    def __init__(self, username, email, permissions):
        super().__init__(username, email)
        self.permissions = permissions

    def perform_action(self, action):
        self.log(f"管理员 {self.username} 执行: {action}")
        if self.validate():
            return f"执行成功: {action}"


admin = AdminUser("admin", "admin@example.com", ["read", "write", "delete"])
print(admin.perform_action("删除用户"))
# [LOG] 管理员 admin 执行: 删除用户
# [VALIDATE] 数据验证通过
# 执行成功: 删除用户
```

## 多态

### 什么是多态

多态是指不同的对象对同一消息做出不同响应的能力。

```python
class Shape:
    """形状基类"""

    def area(self):
        raise NotImplementedError("子类必须实现 area 方法")

    def describe(self):
        return f"{self.__class__.__name__} 的面积是 {self.area()}"


class Circle(Shape):
    """圆形"""

    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2


class Rectangle(Shape):
    """矩形"""

    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


class Triangle(Shape):
    """三角形"""

    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height


# 多态应用
def print_shape_info(shape):
    """接受任何 Shape 子类对象"""
    print(f"{shape.describe()}")


shapes = [
    Circle(5),
    Rectangle(4, 6),
    Triangle(3, 4)
]

for shape in shapes:
    print_shape_info(shape)
# Circle 的面积是 78.53975
# Rectangle 的面积是 24
# Triangle 的面积是 6.0
```

### 运算符重载与多态

```python
class Vector:
    """二维向量"""

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        """重载 + 运算符"""
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """重载 - 运算符"""
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        """重载 * 运算符(标量乘法)"""
        return Vector(self.x * scalar, self.y * scalar)

    def __str__(self):
        return f"Vector({self.x}, {self.y})"

    def __eq__(self, other):
        """重载 == 运算符"""
        return self.x == other.x and self.y == other.y


v1 = Vector(1, 2)
v2 = Vector(3, 4)

print(v1 + v2)    # Vector(4, 6)
print(v2 - v1)    # Vector(2, 2)
print(v1 * 3)     # Vector(3, 6)
print(v1 == v2)   # False
```

## 抽象基类 (ABC)

### 使用 ABC 模块

抽象基类定义了接口规范,强制子类实现特定方法。

```python
from abc import ABC, abstractmethod


class DatabaseConnection(ABC):
    """数据库连接抽象基类"""

    @abstractmethod
    def connect(self):
        """连接数据库"""
        pass

    @abstractmethod
    def disconnect(self):
        """断开连接"""
        pass

    @abstractmethod
    def execute_query(self, query):
        """执行查询"""
        pass

    def get_status(self):
        """非抽象方法,提供默认实现"""
        return "数据库连接状态未知"


class MySQLConnection(DatabaseConnection):
    """MySQL 连接实现"""

    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.connected = False

    def connect(self):
        self.connected = True
        return f"已连接到 MySQL {self.host}:{self.port}"

    def disconnect(self):
        self.connected = False
        return "已断开 MySQL 连接"

    def execute_query(self, query):
        if not self.connected:
            return "错误: 未连接到数据库"
        return f"执行 MySQL 查询: {query}"

    def get_status(self):
        return "已连接" if self.connected else "未连接"


# 无法实例化抽象基类
# db = DatabaseConnection()  # TypeError

# 必须实现所有抽象方法
mysql = MySQLConnection("localhost", 3306)
print(mysql.connect())
print(mysql.execute_query("SELECT * FROM users"))
print(mysql.get_status())
print(mysql.disconnect())
```

### 抽象属性

```python
from abc import ABC, abstractmethod


class Product(ABC):
    """产品抽象基类"""

    @property
    @abstractmethod
    def price(self):
        """抽象属性"""
        pass

    @property
    @abstractmethod
    def name(self):
        """抽象属性"""
        pass

    def display(self):
        return f"{self.name}: ¥{self.price}"


class Book(Product):
    """书籍"""

    def __init__(self, title, author, book_price):
        self._name = title
        self._author = author
        self._price = book_price

    @property
    def price(self):
        return self._price

    @property
    def name(self):
        return self._name

    @property
    def author(self):
        return self._author


book = Book("Python 编程", "张三", 89.9)
print(book.display())  # Python 编程: ¥89.9
```

### 类方法和静态方法的抽象化

```python
from abc import ABC, abstractmethod


class DataProcessor(ABC):
    """数据处理器抽象基类"""

    @classmethod
    @abstractmethod
    def load_data(cls, source):
        """加载数据"""
        pass

    @staticmethod
    @abstractmethod
    def validate_format(data):
        """验证数据格式"""
        pass

    @abstractmethod
    def process(self, data):
        """处理数据"""
        pass


class CSVProcessor(DataProcessor):
    """CSV 处理器"""

    @classmethod
    def load_data(cls, source):
        return f"从 {source} 加载 CSV 数据"

    @staticmethod
    def validate_format(data):
        return isinstance(data, str) and "," in data

    def process(self, data):
        if self.validate_format(data):
            return f"处理 CSV: {data}"
        return "无效的 CSV 格式"


processor = CSVProcessor()
data = CSVProcessor.load_data("data.csv")
print(data)
print(processor.process("name,age,city"))
```

## 鸭子类型 (Duck Typing)

### 鸭子类型原则

"如果它走起来像鸭子,叫起来像鸭子,那么它就是鸭子。" Python 不依赖继承,而是看对象是否有所需的方法。

```python
class Duck:
    """鸭子类"""

    def swim(self):
        print("鸭子在游泳")

    def fly(self):
        print("鸭子在飞")


class Airplane:
    """飞机类"""

    def fly(self):
        print("飞机在飞")


class Whale:
    """鲸鱼类"""

    def swim(self):
        print("鲸鱼在游泳")


def make_it_fly(thing):
    """让它飞 - 不关心类型,只关心是否有 fly 方法"""
    thing.fly()


def make_it_swim(thing):
    """让它游 - 不关心类型,只关心是否有 swim 方法"""
    thing.swim()


duck = Duck()
plane = Airplane()
whale = Whale()

make_it_fly(duck)     # 鸭子在飞
make_it_fly(plane)    # 飞机在飞
# make_it_fly(whale)  # AttributeError: 'Whale' object has no attribute 'fly'

make_it_swim(duck)    # 鸭子在游泳
make_it_swim(whale)   # 鲸鱼在游泳
```

### 鸭子类型与协议

```python
class FileWriter:
    """文件写入器"""

    def write(self, data):
        with open("output.txt", "w") as f:
            f.write(data)


class NetworkWriter:
    """网络写入器"""

    def write(self, data):
        print(f"通过网络发送: {data}")


class ConsoleWriter:
    """控制台写入器"""

    def write(self, data):
        print(f"控制台输出: {data}")


def save_data(writer, data):
    """保存数据 - 接受任何有 write 方法的对象"""
    writer.write(data)


# 所有对象都支持相同的接口
writers = [
    FileWriter(),
    NetworkWriter(),
    ConsoleWriter()
]

for writer in writers:
    save_data(writer, "Hello, Duck Typing!")
```

### 使用 hasattr 检查属性

```python
class Bird:
    def fly(self):
        return "鸟在飞"


class Fish:
    def swim(self):
        return "鱼在游"


def describe_ability(animal):
    """描述动物的能力"""
    abilities = []

    if hasattr(animal, 'fly') and callable(animal.fly):
        abilities.append(animal.fly())

    if hasattr(animal, 'swim') and callable(animal.swim):
        abilities.append(animal.swim())

    if not abilities:
        return f"{animal.__class__.__name__} 没有特殊能力"

    return f"{animal.__class__.__name__}: {', '.join(abilities)}"


bird = Bird()
fish = Fish()

print(describe_ability(bird))  # Bird: 鸟在飞
print(describe_ability(fish))  # Fish: 鱼在游
```

## 实战案例:插件系统

### 设计可扩展的插件架构

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any


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
    def initialize(self) -> bool:
        """初始化插件"""
        pass

    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        """执行插件功能"""
        pass

    @abstractmethod
    def cleanup(self) -> None:
        """清理资源"""
        pass


class LoggingPlugin(Plugin):
    """日志插件"""

    @property
    def name(self) -> str:
        return "日志插件"

    @property
    def version(self) -> str:
        return "1.0.0"

    def initialize(self) -> bool:
        print(f"[{self.name}] 初始化完成")
        return True

    def execute(self, message: str) -> None:
        print(f"[LOG] {message}")

    def cleanup(self) -> None:
        print(f"[{self.name}] 清理完成")


class CachePlugin(Plugin):
    """缓存插件"""

    def __init__(self):
        self.cache: Dict[str, Any] = {}

    @property
    def name(self) -> str:
        return "缓存插件"

    @property
    def version(self) -> str:
        return "2.0.1"

    def initialize(self) -> bool:
        self.cache.clear()
        print(f"[{self.name}] 初始化完成")
        return True

    def execute(self, action: str, key: str, value: Any = None) -> Any:
        if action == "set":
            self.cache[key] = value
            return f"缓存已设置: {key}"
        elif action == "get":
            return self.cache.get(key, "未找到")

    def cleanup(self) -> None:
        self.cache.clear()
        print(f"[{self.name}] 清理完成")


class PluginManager:
    """插件管理器"""

    def __init__(self):
        self.plugins: List[Plugin] = []

    def register(self, plugin: Plugin) -> None:
        """注册插件"""
        if plugin.initialize():
            self.plugins.append(plugin)
            print(f"插件已注册: {plugin.name} v{plugin.version}")

    def get_plugin(self, name: str) -> Plugin:
        """获取插件"""
        for plugin in self.plugins:
            if plugin.name == name:
                return plugin
        raise ValueError(f"未找到插件: {name}")

    def list_plugins(self) -> None:
        """列出所有插件"""
        print("\n已注册的插件:")
        for plugin in self.plugins:
            print(f"  - {plugin.name} (v{plugin.version})")

    def shutdown(self) -> None:
        """关闭所有插件"""
        print("\n关闭插件系统...")
        for plugin in self.plugins:
            plugin.cleanup()


# 使用插件系统
manager = PluginManager()

# 注册插件
manager.register(LoggingPlugin())
manager.register(CachePlugin())

# 列出插件
manager.list_plugins()

# 使用插件
logger = manager.get_plugin("日志插件")
logger.execute("系统启动成功")

cache = manager.get_plugin("缓存插件")
cache.execute("set", "user:1", {"name": "张三", "age": 25})
user = cache.execute("get", "user:1")
print(f"缓存数据: {user}")

# 关闭系统
manager.shutdown()
```

## 最佳实践

### 优先组合而非继承

```python
# 不推荐: 深层继承
class Animal:
    pass

class Mammal(Animal):
    pass

class Dog(Mammal):
    pass

class GermanShepherd(Dog):
    pass


# 推荐: 使用组合
class Engine:
    def start(self):
        return "引擎启动"


class Wheels:
    def rotate(self):
        return "轮子转动"


class Car:
    """使用组合而非继承"""

    def __init__(self):
        self.engine = Engine()
        self.wheels = Wheels()

    def drive(self):
        return f"{self.engine.start()}, {self.wheels.rotate()}"


car = Car()
print(car.drive())
```

### 使用 Mixin 模式

```python
class JSONMixin:
    """JSON 序列化混入"""

    def to_json(self):
        import json
        return json.dumps(self.__dict__)


class ReprMixin:
    """更好的字符串表示混入"""

    def __repr__(self):
        attrs = ', '.join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{self.__class__.__name__}({attrs})"


class Person(JSONMixin, ReprMixin):
    """使用多个 Mixin"""

    def __init__(self, name, age):
        self.name = name
        self.age = age


person = Person("李四", 30)
print(person)              # Person(name='李四', age=30)
print(person.to_json())    # {"name": "李四", "age": 30}
```

### 遵循里氏替换原则

```python
class Rectangle:
    """矩形"""

    def __init__(self, width, height):
        self._width = width
        self._height = height

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        self._width = value

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        self._height = value

    def area(self):
        return self._width * self._height


# 不符合里氏替换原则的例子
class Square(Rectangle):
    """正方形 - 违反了里氏替换原则"""

    @Rectangle.width.setter
    def width(self, value):
        self._width = value
        self._height = value  # 同时修改高度

    @Rectangle.height.setter
    def height(self, value):
        self._width = value   # 同时修改宽度
        self._height = value


# 更好的设计: 不使用继承
class Square:
    """正方形 - 独立实现"""

    def __init__(self, side):
        self._side = side

    @property
    def side(self):
        return self._side

    @side.setter
    def side(self, value):
        self._side = value

    def area(self):
        return self._side ** 2
```

### 明确使用 super()

```python
class Base:
    def __init__(self, x):
        self.x = x
        print(f"Base.__init__(x={x})")


class MiddleA(Base):
    def __init__(self, x, y):
        super().__init__(x)
        self.y = y
        print(f"MiddleA.__init__(y={y})")


class MiddleB(Base):
    def __init__(self, x, z):
        super().__init__(x)
        self.z = z
        print(f"MiddleB.__init__(z={z})")


class Derived(MiddleA, MiddleB):
    def __init__(self, x, y, z, w):
        # 注意: 需要传递所有参数
        MiddleA.__init__(self, x, y)
        MiddleB.__init__(self, x, z)
        self.w = w
        print(f"Derived.__init__(w={w})")


print("MRO:", [cls.__name__ for cls in Derived.__mro__])
derived = Derived(1, 2, 3, 4)
```

## 总结

### 关键要点

1. **单继承**: 简单清晰,适合大多数场景
2. **多继承**: 强大但复杂,需要理解 MRO
3. **MRO**: C3 线性化算法确定方法查找顺序
4. **super()**: 根据 MRO 调用父类方法,支持协作继承
5. **抽象基类**: 定义接口规范,强制子类实现
6. **鸭子类型**: Python 的动态特性,关注行为而非类型
7. **多态**: 同一接口的不同实现
8. **组合优于继承**: 更灵活,降低耦合

### 选择指南

| 场景 | 推荐方案 |
|------|---------|
| 简单的 "is-a" 关系 | 单继承 |
| 需要多种能力组合 | Mixin + 多继承 |
| 定义接口规范 | 抽象基类 (ABC) |
| 灵活的组件组合 | 组合模式 |
| 不确定具体类型 | 鸭子类型 |

掌握继承和多态,能让你设计出更加灵活、可扩展和易维护的代码架构。
