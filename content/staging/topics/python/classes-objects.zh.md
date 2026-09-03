---
title: Python 类和对象
description: 深入了解 Python OOP：类定义、实例化、属性和方法
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - OOP
  - Classes
  - Objects
status: imported
origin: old/src/content/docs/python/classes-objects.zh.md
divergence: 0.188
issues: []
legacy:
  category: Python
  subcategory: Object-Oriented Programming
  order: 5
  lastUpdated: 2026-01-07
---

面向对象编程（OOP）是一种围绕对象和类来组织代码的编程范式。Python 提供了强大的 OOP 支持，使创建可重用、可维护的代码变得容易。本指南深入探讨 Python 的类和对象，涵盖从基本定义到高级概念的所有内容。

## 理解类和对象

**类**是创建对象的蓝图或模板。它定义了其对象将具有的结构和行为。**对象**是类的实例——类蓝图的具体实现，拥有自己独特的数据。

可以把类想象成饼干模具，对象就是饼干。模具定义了形状，但每块饼干都是独立的实体。

```python
# 类定义
class Dog:
    pass

# 对象实例化
my_dog = Dog()
your_dog = Dog()

# my_dog 和 your_dog 是同一类的不同对象
print(type(my_dog))  # <class '__main__.Dog'>
print(my_dog is your_dog)  # False
```

## 类定义

类使用 `class` 关键字定义，后跟类名（通常使用 PascalCase）和冒号。类体是缩进的。

```python
class Car:
    """一个简单的汽车类"""

    def __init__(self, make, model, year):
        """初始化汽车属性"""
        self.make = make
        self.model = model
        self.year = year

    def get_description(self):
        """返回汽车的格式化描述"""
        return f"{self.year} {self.make} {self.model}"
```

`__init__` 方法是一个特殊方法，称为**构造函数**。当创建类的新实例时，它会自动调用，允许你初始化对象的属性。

### `self` 参数

实例方法的第一个参数按惯例命名为 `self`。它代表类的实例，提供对实例属性和方法的访问。当你调用方法时，Python 会自动将实例作为第一个参数传递。

```python
car = Car("Toyota", "Camry", 2024)
# 当你调用：car.get_description()
# Python 实际调用：Car.get_description(car)
```

## 对象实例化

从类创建对象称为**实例化**。你通过像调用函数一样调用类名来实例化对象，传递 `__init__` 所需的任何参数。

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        return f"Hi, I'm {self.name} and I'm {self.age} years old."

# 实例化对象
person1 = Person("Alice", 30)
person2 = Person("Bob", 25)

print(person1.introduce())  # Hi, I'm Alice and I'm 30 years old.
print(person2.introduce())  # Hi, I'm Bob and I'm 25 years old.
```

## 实例属性

**实例属性**是属于类的特定实例的变量。每个对象都有自己的实例属性副本，修改一个对象上的属性不会影响其他对象。

```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return f"Deposited ${amount}. New balance: ${self.balance}"

    def withdraw(self, amount):
        if amount > self.balance:
            return "Insufficient funds"
        self.balance -= amount
        return f"Withdrew ${amount}. New balance: ${self.balance}"

# 每个账户都有自己的余额
account1 = BankAccount("Alice", 1000)
account2 = BankAccount("Bob", 500)

print(account1.deposit(200))  # Deposited $200. New balance: $1200
print(account2.balance)        # 500（未改变）
```

实例属性可以在 `__init__` 中创建，也可以动态添加到对象：

```python
class FlexibleClass:
    def __init__(self, x):
        self.x = x

obj = FlexibleClass(10)
obj.y = 20  # 动态添加属性
print(obj.y)  # 20
```

## 类属性

**类属性**是类的所有实例共享的变量。它们直接在类体中定义，在任何方法之外。

```python
class Employee:
    # 类属性
    company = "TechCorp"
    employee_count = 0

    def __init__(self, name, position):
        self.name = name  # 实例属性
        self.position = position  # 实例属性
        Employee.employee_count += 1

    def get_info(self):
        return f"{self.name} works at {Employee.company} as a {self.position}"

emp1 = Employee("Alice", "Developer")
emp2 = Employee("Bob", "Designer")

print(emp1.get_info())  # Alice works at TechCorp as a Developer
print(emp2.get_info())  # Bob works at TechCorp as a Designer
print(Employee.employee_count)  # 2

# 更改类属性会影响所有实例
Employee.company = "NewTech"
print(emp1.get_info())  # Alice works at NewTech as a Developer
```

### 类属性与实例属性的重要说明

通过实例修改类属性时要小心。如果通过实例给属性赋值，Python 会创建一个新的实例属性来遮蔽类属性：

```python
class Example:
    shared = "I'm shared"

obj1 = Example()
obj2 = Example()

print(obj1.shared)  # I'm shared
print(obj2.shared)  # I'm shared

obj1.shared = "I'm not shared anymore"
print(obj1.shared)  # I'm not shared anymore（实例属性）
print(obj2.shared)  # I'm shared（仍然使用类属性）
print(Example.shared)  # I'm shared（类属性未改变）
```

## 实例方法

**实例方法**是在类内部定义的、操作实例的函数。它们以 `self` 作为第一个参数，可以访问实例和类属性。

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        """计算并返回面积"""
        return self.width * self.height

    def perimeter(self):
        """计算并返回周长"""
        return 2 * (self.width + self.height)

    def scale(self, factor):
        """按因子缩放矩形"""
        self.width *= factor
        self.height *= factor

    def __str__(self):
        """矩形的字符串表示"""
        return f"Rectangle({self.width}x{self.height})"

rect = Rectangle(5, 3)
print(rect.area())       # 15
print(rect.perimeter())  # 16
rect.scale(2)
print(rect)              # Rectangle(10x6)
```

### 特殊方法（魔术方法）

Python 类可以定义以双下划线开头和结尾的特殊方法。这些方法提供特殊功能：

```python
class Book:
    def __init__(self, title, author, pages):
        self.title = title
        self.author = author
        self.pages = pages

    def __str__(self):
        """由 str() 和 print() 调用"""
        return f"'{self.title}' by {self.author}"

    def __repr__(self):
        """由 repr() 和交互模式调用"""
        return f"Book('{self.title}', '{self.author}', {self.pages})"

    def __len__(self):
        """由 len() 调用"""
        return self.pages

    def __eq__(self, other):
        """由 == 运算符调用"""
        if not isinstance(other, Book):
            return False
        return (self.title == other.title and
                self.author == other.author)

book1 = Book("1984", "George Orwell", 328)
book2 = Book("1984", "George Orwell", 328)

print(book1)           # '1984' by George Orwell
print(repr(book1))     # Book('1984', 'George Orwell', 328)
print(len(book1))      # 328
print(book1 == book2)  # True
```

## 类方法

**类方法**是绑定到类而不是实例的方法。它们使用 `@classmethod` 装饰器定义，以 `cls` 作为第一个参数而不是 `self`。

类方法适用于：
- 工厂方法（替代构造函数）
- 需要修改类状态的方法
- 处理类属性的方法

```python
class Date:
    def __init__(self, year, month, day):
        self.year = year
        self.month = month
        self.day = day

    @classmethod
    def from_string(cls, date_string):
        """工厂方法：从字符串格式 'YYYY-MM-DD' 创建 Date"""
        year, month, day = map(int, date_string.split('-'))
        return cls(year, month, day)

    @classmethod
    def today(cls):
        """工厂方法：创建今天的 Date"""
        import datetime
        today = datetime.date.today()
        return cls(today.year, today.month, today.day)

    def __str__(self):
        return f"{self.year:04d}-{self.month:02d}-{self.day:02d}"

# 不同的 Date 对象创建方式
date1 = Date(2024, 1, 15)
date2 = Date.from_string("2024-01-15")
date3 = Date.today()

print(date1)  # 2024-01-15
print(date2)  # 2024-01-15
print(date3)  # 当前日期
```

### 使用类方法管理类状态

```python
class Pizza:
    menu = []  # 类属性

    def __init__(self, name, ingredients):
        self.name = name
        self.ingredients = ingredients

    @classmethod
    def add_to_menu(cls, pizza):
        """将披萨添加到菜单"""
        cls.menu.append(pizza)

    @classmethod
    def show_menu(cls):
        """显示菜单上的所有披萨"""
        return [pizza.name for pizza in cls.menu]

    def __str__(self):
        return f"{self.name}: {', '.join(self.ingredients)}"

margherita = Pizza("Margherita", ["tomato", "mozzarella", "basil"])
pepperoni = Pizza("Pepperoni", ["tomato", "mozzarella", "pepperoni"])

Pizza.add_to_menu(margherita)
Pizza.add_to_menu(pepperoni)

print(Pizza.show_menu())  # ['Margherita', 'Pepperoni']
```

## 静态方法

**静态方法**是不接收隐式第一个参数（既不是 `self` 也不是 `cls`）的方法。它们使用 `@staticmethod` 装饰器定义，行为类似于普通函数但属于类的命名空间。

静态方法适用于：
- 与类相关的工具函数
- 不需要访问实例或类数据的函数
- 分组相关功能

```python
class MathOperations:
    @staticmethod
    def add(x, y):
        """两数相加"""
        return x + y

    @staticmethod
    def multiply(x, y):
        """两数相乘"""
        return x * y

    @staticmethod
    def is_even(n):
        """检查数字是否为偶数"""
        return n % 2 == 0

# 可以不创建实例就调用
print(MathOperations.add(5, 3))      # 8
print(MathOperations.multiply(4, 7))  # 28
print(MathOperations.is_even(10))     # True
```

### 实际示例：验证器类

```python
class Validator:
    @staticmethod
    def is_valid_email(email):
        """基本邮箱验证"""
        return '@' in email and '.' in email.split('@')[1]

    @staticmethod
    def is_valid_password(password):
        """检查密码是否满足最低要求"""
        return (len(password) >= 8 and
                any(c.isupper() for c in password) and
                any(c.isdigit() for c in password))

    @staticmethod
    def is_valid_phone(phone):
        """检查电话号码格式是否有效"""
        digits = ''.join(filter(str.isdigit, phone))
        return len(digits) == 10

print(Validator.is_valid_email("user@example.com"))  # True
print(Validator.is_valid_password("Pass123"))        # True
print(Validator.is_valid_phone("555-123-4567"))      # True
```

## Property 装饰器

`@property` 装饰器允许你定义可以像属性一样访问的方法。这提供了一种在保持干净接口的同时为属性访问添加逻辑的方式。

Properties 适用于：
- 设置属性时添加验证
- 即时计算值
- 实现只读或只写属性
- 保持向后兼容性

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    @property
    def celsius(self):
        """获取摄氏温度"""
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        """设置摄氏温度并验证"""
        if value < -273.15:
            raise ValueError("Temperature below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self):
        """获取华氏温度"""
        return self._celsius * 9/5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        """使用华氏温度设置"""
        self.celsius = (value - 32) * 5/9

    @property
    def kelvin(self):
        """获取开尔文温度（只读）"""
        return self._celsius + 273.15

temp = Temperature(25)
print(temp.celsius)     # 25
print(temp.fahrenheit)  # 77.0
print(temp.kelvin)      # 298.15

temp.fahrenheit = 86
print(temp.celsius)     # 30.0

# temp.kelvin = 300  # AttributeError: can't set attribute
```

### 使用 Properties 进行验证

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not isinstance(value, str):
            raise TypeError("Name must be a string")
        if len(value) == 0:
            raise ValueError("Name cannot be empty")
        self._name = value.strip().title()

    @property
    def age(self):
        return self._age

    @age.setter
    def age(self, value):
        if not isinstance(value, int):
            raise TypeError("Age must be an integer")
        if value < 0 or value > 150:
            raise ValueError("Age must be between 0 and 150")
        self._age = value

    @property
    def is_adult(self):
        """计算属性"""
        return self._age >= 18

person = Person("john doe", 25)
print(person.name)      # John Doe（自动大写）
print(person.is_adult)  # True

# person.age = -5  # ValueError: Age must be between 0 and 150
```

### Property 删除器

你还可以为 properties 定义删除器：

```python
class Account:
    def __init__(self, username):
        self._username = username

    @property
    def username(self):
        return self._username

    @username.setter
    def username(self, value):
        self._username = value

    @username.deleter
    def username(self):
        print(f"Deleting username: {self._username}")
        del self._username

account = Account("alice")
print(account.username)  # alice
del account.username     # Deleting username: alice
# print(account.username)  # AttributeError
```

## 访问控制和名称修饰

Python 没有像某些其他语言那样的真正私有属性，但它提供了控制类成员访问的约定和机制。

### 命名约定

1. **公共属性**：普通名称（例如 `name`、`value`）
   - 旨在成为公共 API 的一部分
   - 可以自由访问和修改

2. **受保护属性**：单下划线前缀（例如 `_internal`、`_helper`）
   - 表示"内部使用"的约定
   - 不应从类外部访问（但可以）
   - Python 不强制执行

3. **私有属性**：双下划线前缀（例如 `__private`、`__secret`）
   - 应用名称修饰
   - 从外部更难访问（但仍然可能）
   - 用于避免继承中的命名冲突

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner           # 公共
        self._account_number = None  # 受保护
        self.__pin = "1234"          # 私有（名称修饰）

    def verify_pin(self, pin):
        """验证 PIN 的公共方法"""
        return self.__pin == pin

    def _generate_statement(self):
        """受保护方法 - 内部使用"""
        return "Statement generated"

    def __validate_transaction(self, amount):
        """私有方法 - 名称修饰"""
        return amount > 0

account = BankAccount("Alice", 1000)

# 公共访问
print(account.owner)  # Alice

# 受保护访问（可能但不推荐）
print(account._account_number)  # None

# 私有访问（名称修饰）
# print(account.__pin)  # AttributeError
print(account.verify_pin("1234"))  # True

# 访问名称修饰的属性（不推荐）
print(account._BankAccount__pin)  # 1234
```

### 名称修饰解释

当你使用双下划线时，Python 执行**名称修饰**，将名称转换为 `_ClassName__attributename`。这防止了意外访问和继承中的命名冲突：

```python
class Parent:
    def __init__(self):
        self.__private = "Parent's private"

    def show_private(self):
        return self.__private

class Child(Parent):
    def __init__(self):
        super().__init__()
        self.__private = "Child's private"

    def show_child_private(self):
        return self.__private

child = Child()
print(child.show_private())        # Parent's private
print(child.show_child_private())  # Child's private

# 由于名称修饰，两个属性独立存在
print(child._Parent__private)      # Parent's private
print(child._Child__private)       # Child's private
```

### 使用 Properties 进行访问控制

Properties 提供了更 Pythonic 的访问控制方式：

```python
class SecureData:
    def __init__(self, data):
        self.__data = data

    @property
    def data(self):
        """对数据的只读访问"""
        return self.__data

    # 未定义 setter，使其成为只读

secure = SecureData("sensitive info")
print(secure.data)  # sensitive info
# secure.data = "new"  # AttributeError: can't set attribute
```

## 最佳实践

### 使用有意义的类名

```python
# 好
class CustomerAccount:
    pass

# 不好
class CA:
    pass
```

### 保持类专注（单一职责原则）

```python
# 好：分离关注点
class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email

class UserAuthentication:
    @staticmethod
    def verify_password(user, password):
        # 认证逻辑
        pass

# 不好：职责太多
class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email

    def verify_password(self, password):
        pass

    def send_email(self, message):
        pass

    def generate_report(self):
        pass
```

### 使用 `__init__` 进行初始化

```python
# 好
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price
        self.discount = 0

# 不好：在 __init__ 外设置属性
class Product:
    def __init__(self, name):
        self.name = name

product = Product("Item")
product.price = 10  # 更难追踪必需属性
```

### 对于计算或验证数据，优先使用 Properties 而不是直接属性访问

```python
# 好
class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):
        return 3.14159 * self.radius ** 2

# 不好
class Circle:
    def __init__(self, radius):
        self.radius = radius
        self.area = 3.14159 * radius ** 2  # 如果 radius 改变不会更新
```

### 使用类方法作为替代构造函数

```python
class Employee:
    def __init__(self, first_name, last_name, salary):
        self.first_name = first_name
        self.last_name = last_name
        self.salary = salary

    @classmethod
    def from_string(cls, emp_string):
        """从 'FirstName,LastName,Salary' 格式创建"""
        first, last, salary = emp_string.split(',')
        return cls(first, last, int(salary))

    @classmethod
    def from_dict(cls, emp_dict):
        """从字典创建"""
        return cls(
            emp_dict['first_name'],
            emp_dict['last_name'],
            emp_dict['salary']
        )

emp1 = Employee("John", "Doe", 50000)
emp2 = Employee.from_string("Jane,Smith,60000")
emp3 = Employee.from_dict({'first_name': 'Bob', 'last_name': 'Wilson', 'salary': 55000})
```

### 为类编写文档

```python
class ShoppingCart:
    """
    一个保存待购商品的购物车。

    Attributes:
        items (list): 购物车中的商品列表
        discount_rate (float): 折扣百分比（0-100）

    Methods:
        add_item(item, quantity): 将商品添加到购物车
        remove_item(item): 从购物车移除商品
        get_total(): 计算含折扣的总价
    """

    def __init__(self, discount_rate=0):
        """
        初始化购物车。

        Args:
            discount_rate (float): 折扣百分比（默认：0）
        """
        self.items = []
        self.discount_rate = discount_rate

    def add_item(self, item, quantity=1):
        """
        将商品添加到购物车。

        Args:
            item (dict): 包含 'name' 和 'price' 键的商品
            quantity (int): 要添加的商品数量（默认：1）

        Returns:
            int: 购物车中的商品总数
        """
        self.items.append({'item': item, 'quantity': quantity})
        return len(self.items)
```

### 使用 `__str__` 和 `__repr__` 以便更好地调试

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        """用户友好的字符串表示"""
        return f"Point at ({self.x}, {self.y})"

    def __repr__(self):
        """开发者友好的表示"""
        return f"Point({self.x}, {self.y})"

point = Point(3, 4)
print(str(point))   # Point at (3, 4)
print(repr(point))  # Point(3, 4)
print(point)        # Point at (3, 4)（使用 __str__）
```

## 总结

Python 的类系统为通过面向对象编程组织代码提供了强大的工具。理解实例属性、类属性、实例方法、类方法和静态方法之间的区别，可以让你设计更有效和可维护的代码。

关键要点：
- **类**是蓝图；**对象**是类的实例
- **实例属性**对每个对象是唯一的
- **类属性**在所有实例之间共享
- **实例方法**处理实例数据
- **类方法**处理类数据并作为替代构造函数
- **静态方法**是属于类命名空间的工具函数
- **Properties** 提供带有验证和计算值的受控属性访问
- Python 中的**访问控制**使用命名约定和名称修饰

通过掌握这些概念并遵循最佳实践，你将能够编写既强大又易于维护的干净、Pythonic 的面向对象代码。
