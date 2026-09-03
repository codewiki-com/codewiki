---
title: 设计模式
description: Python设计模式完全指南：单例、工厂、观察者、策略、装饰器模式及Pythonic实现方式
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - 设计模式
  - 单例模式
  - 工厂模式
  - 观察者模式
  - 策略模式
  - 装饰器模式
  - 软件架构
status: imported
origin: old/src/content/docs/python/design-patterns.zh.md
divergence: 0.248
issues: []
legacy:
  category: Python
  subcategory: 高级主题
  order: 27
  lastUpdated: 2026-01-07
---

设计模式是软件开发中经过验证的、可复用的解决方案模板。它们代表了经验丰富的开发者在面对常见设计问题时总结出的最佳实践。Python 作为一门灵活的动态语言，在实现设计模式时往往比静态语言更加简洁和优雅。

## 概念解释

### 什么是设计模式

设计模式是针对软件设计中反复出现的问题的通用解决方案。它不是可以直接转换为代码的成品，而是描述如何解决问题的模板或蓝图。

设计模式的概念源于建筑师 Christopher Alexander 的著作，后由 Erich Gamma、Richard Helm、Ralph Johnson 和 John Vlissides（被称为"四人组"或 GoF）在 1994 年出版的《设计模式：可复用面向对象软件的基础》中引入软件工程领域。

### 设计模式的分类

设计模式通常分为三大类：

1. **创建型模式（Creational Patterns）**：关注对象的创建机制
   - 单例模式（Singleton）
   - 工厂方法模式（Factory Method）
   - 抽象工厂模式（Abstract Factory）
   - 建造者模式（Builder）
   - 原型模式（Prototype）

2. **结构型模式（Structural Patterns）**：关注类和对象的组合
   - 适配器模式（Adapter）
   - 装饰器模式（Decorator）
   - 代理模式（Proxy）
   - 外观模式（Facade）
   - 桥接模式（Bridge）
   - 组合模式（Composite）
   - 享元模式（Flyweight）

3. **行为型模式（Behavioral Patterns）**：关注对象之间的通信
   - 观察者模式（Observer）
   - 策略模式（Strategy）
   - 命令模式（Command）
   - 状态模式（State）
   - 模板方法模式（Template Method）
   - 迭代器模式（Iterator）
   - 责任链模式（Chain of Responsibility）

### Python 与设计模式

Python 的动态特性使得许多设计模式的实现比传统面向对象语言更加简洁：

- **一等函数**：策略模式可以用简单的函数替代类
- **鸭子类型**：不需要显式接口定义
- **装饰器语法**：内置支持装饰器模式
- **元类**：可以优雅地实现单例等模式
- **`__call__` 方法**：任何对象都可以像函数一样调用

## 核心原理

### SOLID 原则

设计模式的基础是 SOLID 原则：

```python
# S - 单一职责原则（Single Responsibility Principle）
# 一个类应该只有一个引起它变化的原因

# 不好的设计：一个类做太多事情
class UserManager:
    def create_user(self, data):
        # 创建用户
        pass

    def send_email(self, user, message):
        # 发送邮件 - 这不应该在这个类中
        pass

    def generate_report(self):
        # 生成报告 - 这也不应该在这个类中
        pass

# 好的设计：分离职责
class UserService:
    def create_user(self, data):
        pass

class EmailService:
    def send_email(self, recipient, message):
        pass

class ReportService:
    def generate_user_report(self, users):
        pass
```

```python
# O - 开放封闭原则（Open/Closed Principle）
# 对扩展开放，对修改封闭

from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        import math
        return math.pi * self.radius ** 2

# 添加新形状不需要修改现有代码
class Triangle(Shape):
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height

def calculate_total_area(shapes: list[Shape]) -> float:
    """这个函数对新的形状类型开放，无需修改"""
    return sum(shape.area() for shape in shapes)
```

```python
# L - 里氏替换原则（Liskov Substitution Principle）
# 子类必须能够替换其父类

class Bird:
    def fly(self):
        return "飞行中..."

# 违反 LSP：企鹅不能飞
class Penguin(Bird):
    def fly(self):
        raise NotImplementedError("企鹅不会飞")

# 正确设计：分离会飞和不会飞的鸟
class Bird(ABC):
    @abstractmethod
    def move(self):
        pass

class FlyingBird(Bird):
    def move(self):
        return "飞行中..."

class SwimmingBird(Bird):
    def move(self):
        return "游泳中..."

class Eagle(FlyingBird):
    pass

class Penguin(SwimmingBird):
    pass
```

```python
# I - 接口隔离原则（Interface Segregation Principle）
# 客户端不应该被迫依赖它不使用的方法

from abc import ABC, abstractmethod

# 不好的设计：胖接口
class Worker(ABC):
    @abstractmethod
    def work(self):
        pass

    @abstractmethod
    def eat(self):
        pass

    @abstractmethod
    def sleep(self):
        pass

# 机器人不需要 eat 和 sleep
class Robot(Worker):
    def work(self):
        return "工作中..."

    def eat(self):
        raise NotImplementedError  # 被迫实现不需要的方法

    def sleep(self):
        raise NotImplementedError

# 好的设计：细分接口
class Workable(ABC):
    @abstractmethod
    def work(self):
        pass

class Eatable(ABC):
    @abstractmethod
    def eat(self):
        pass

class Human(Workable, Eatable):
    def work(self):
        return "人类工作中..."

    def eat(self):
        return "人类吃饭中..."

class Robot(Workable):
    def work(self):
        return "机器人工作中..."
```

```python
# D - 依赖倒置原则（Dependency Inversion Principle）
# 高层模块不应该依赖低层模块，两者都应该依赖抽象

from abc import ABC, abstractmethod

# 抽象
class MessageSender(ABC):
    @abstractmethod
    def send(self, message: str) -> bool:
        pass

# 低层模块
class EmailSender(MessageSender):
    def send(self, message: str) -> bool:
        print(f"发送邮件: {message}")
        return True

class SMSSender(MessageSender):
    def send(self, message: str) -> bool:
        print(f"发送短信: {message}")
        return True

# 高层模块依赖抽象而非具体实现
class NotificationService:
    def __init__(self, sender: MessageSender):
        self.sender = sender

    def notify(self, message: str):
        return self.sender.send(message)

# 使用
email_notification = NotificationService(EmailSender())
email_notification.notify("你好！")

sms_notification = NotificationService(SMSSender())
sms_notification.notify("你好！")
```

## 核心要点

### 设计模式的核心思想

| 模式 | 核心思想 | Python 特色实现 |
|------|----------|-----------------|
| 单例模式 | 确保一个类只有一个实例 | 模块级变量、元类、`__new__` |
| 工厂模式 | 将对象创建与使用分离 | 简单函数、类方法 |
| 观察者模式 | 对象间一对多依赖关系 | 信号/槽机制、回调函数 |
| 策略模式 | 封装可互换的算法 | 一等函数、可调用对象 |
| 装饰器模式 | 动态添加功能 | `@decorator` 语法 |

### 何时使用设计模式

设计模式不是银弹，应该在以下情况考虑使用：

1. **代码需要扩展**：预见到未来需要添加新功能
2. **代码需要复用**：多处使用相似的逻辑
3. **代码需要解耦**：减少模块间的依赖
4. **代码需要测试**：使代码更易于单元测试
5. **团队协作**：提供共同的设计语言

## 代码示例

### 单例模式（Singleton Pattern）

单例模式确保一个类只有一个实例，并提供全局访问点。

#### 方法一：模块级单例（最 Pythonic 的方式）

```python
# database.py
class _Database:
    """私有数据库类"""

    def __init__(self):
        self.connection = None
        print("初始化数据库连接...")

    def connect(self, connection_string: str):
        self.connection = connection_string
        print(f"已连接到: {connection_string}")

    def query(self, sql: str):
        if not self.connection:
            raise RuntimeError("数据库未连接")
        print(f"执行查询: {sql}")
        return f"查询结果: {sql}"

# 模块级单例实例
database = _Database()

# 使用方式
# from database import database
# database.connect("postgresql://localhost/mydb")
# database.query("SELECT * FROM users")
```

这是最 Pythonic 的单例实现方式，因为 Python 模块本身就是单例的。

#### 方法二：使用 `__new__` 方法

```python
class Singleton:
    """使用 __new__ 实现的单例"""
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # 只在第一次创建时初始化
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, value=None):
        # 防止重复初始化
        if self._initialized:
            return
        self.value = value
        self._initialized = True
        print(f"初始化单例，值为: {value}")

# 测试
s1 = Singleton("第一次")
s2 = Singleton("第二次")  # 不会重新初始化

print(f"s1.value = {s1.value}")  # 第一次
print(f"s2.value = {s2.value}")  # 第一次
print(f"s1 is s2: {s1 is s2}")   # True
```

#### 方法三：使用元类

```python
class SingletonMeta(type):
    """单例元类"""
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class DatabaseConnection(metaclass=SingletonMeta):
    """数据库连接单例"""

    def __init__(self, host: str = "localhost", port: int = 5432):
        self.host = host
        self.port = port
        self.connected = False
        print(f"创建数据库连接: {host}:{port}")

    def connect(self):
        self.connected = True
        print("已连接到数据库")

    def disconnect(self):
        self.connected = False
        print("已断开数据库连接")

# 测试
db1 = DatabaseConnection("localhost", 5432)
db2 = DatabaseConnection("remotehost", 3306)  # 参数被忽略

print(f"db1 is db2: {db1 is db2}")  # True
print(f"host: {db2.host}")  # localhost
```

#### 方法四：使用装饰器

```python
def singleton(cls):
    """单例装饰器"""
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class Logger:
    """日志单例"""

    def __init__(self, name: str = "default"):
        self.name = name
        self.logs = []
        print(f"初始化日志器: {name}")

    def log(self, message: str):
        import datetime
        entry = f"[{datetime.datetime.now()}] {message}"
        self.logs.append(entry)
        print(entry)

# 测试
logger1 = Logger("app")
logger2 = Logger("system")  # 仍然返回第一个实例

logger1.log("第一条日志")
logger2.log("第二条日志")

print(f"logger1 is logger2: {logger1 is logger2}")  # True
print(f"日志数量: {len(logger1.logs)}")  # 2
```

#### 线程安全的单例

```python
import threading

class ThreadSafeSingleton:
    """线程安全的单例"""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        # 双重检查锁定模式
        if cls._instance is None:
            with cls._lock:
                # 再次检查，防止其他线程已经创建
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, value=None):
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            self.value = value
            self._initialized = True
            print(f"线程 {threading.current_thread().name}: 初始化单例")

# 测试线程安全
def create_singleton(value):
    s = ThreadSafeSingleton(value)
    print(f"线程 {threading.current_thread().name}: 获取到单例, value={s.value}")

threads = []
for i in range(5):
    t = threading.Thread(target=create_singleton, args=(i,))
    threads.append(t)

for t in threads:
    t.start()

for t in threads:
    t.join()
```

### 工厂模式（Factory Pattern）

工厂模式提供创建对象的接口，将对象的创建与使用分离。

#### 简单工厂模式

```python
from abc import ABC, abstractmethod
from typing import Dict, Type

class Animal(ABC):
    """动物抽象基类"""

    @abstractmethod
    def speak(self) -> str:
        pass

    @abstractmethod
    def move(self) -> str:
        pass

class Dog(Animal):
    def speak(self) -> str:
        return "汪汪！"

    def move(self) -> str:
        return "狗在跑"

class Cat(Animal):
    def speak(self) -> str:
        return "喵喵！"

    def move(self) -> str:
        return "猫在走"

class Bird(Animal):
    def speak(self) -> str:
        return "啾啾！"

    def move(self) -> str:
        return "鸟在飞"

class AnimalFactory:
    """简单动物工厂"""

    _animals: Dict[str, Type[Animal]] = {
        "dog": Dog,
        "cat": Cat,
        "bird": Bird,
    }

    @classmethod
    def create(cls, animal_type: str) -> Animal:
        """创建动物实例"""
        animal_class = cls._animals.get(animal_type.lower())
        if animal_class is None:
            raise ValueError(f"未知的动物类型: {animal_type}")
        return animal_class()

    @classmethod
    def register(cls, animal_type: str, animal_class: Type[Animal]):
        """注册新的动物类型"""
        cls._animals[animal_type.lower()] = animal_class

# 使用工厂
dog = AnimalFactory.create("dog")
print(dog.speak())  # 汪汪！

cat = AnimalFactory.create("cat")
print(cat.speak())  # 喵喵！

# 扩展工厂
class Fish(Animal):
    def speak(self) -> str:
        return "...（鱼不说话）"

    def move(self) -> str:
        return "鱼在游"

AnimalFactory.register("fish", Fish)
fish = AnimalFactory.create("fish")
print(fish.move())  # 鱼在游
```

#### 工厂方法模式

```python
from abc import ABC, abstractmethod

class Document(ABC):
    """文档抽象基类"""

    @abstractmethod
    def create(self) -> str:
        pass

    @abstractmethod
    def save(self, filename: str) -> str:
        pass

class PDFDocument(Document):
    def create(self) -> str:
        return "创建 PDF 文档"

    def save(self, filename: str) -> str:
        return f"保存为 {filename}.pdf"

class WordDocument(Document):
    def create(self) -> str:
        return "创建 Word 文档"

    def save(self, filename: str) -> str:
        return f"保存为 {filename}.docx"

class ExcelDocument(Document):
    def create(self) -> str:
        return "创建 Excel 文档"

    def save(self, filename: str) -> str:
        return f"保存为 {filename}.xlsx"

class DocumentCreator(ABC):
    """文档创建器抽象类（工厂方法模式）"""

    @abstractmethod
    def create_document(self) -> Document:
        """工厂方法"""
        pass

    def new_document(self) -> str:
        """使用工厂方法创建文档并进行操作"""
        doc = self.create_document()
        result = doc.create()
        return result

class PDFCreator(DocumentCreator):
    def create_document(self) -> Document:
        return PDFDocument()

class WordCreator(DocumentCreator):
    def create_document(self) -> Document:
        return WordDocument()

class ExcelCreator(DocumentCreator):
    def create_document(self) -> Document:
        return ExcelDocument()

# 使用工厂方法
pdf_creator = PDFCreator()
print(pdf_creator.new_document())  # 创建 PDF 文档

word_creator = WordCreator()
doc = word_creator.create_document()
print(doc.save("报告"))  # 保存为 报告.docx
```

#### 抽象工厂模式

```python
from abc import ABC, abstractmethod

# 抽象产品
class Button(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

class TextBox(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

class CheckBox(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

# Windows 风格产品
class WindowsButton(Button):
    def render(self) -> str:
        return "[Windows 按钮]"

class WindowsTextBox(TextBox):
    def render(self) -> str:
        return "[Windows 文本框]"

class WindowsCheckBox(CheckBox):
    def render(self) -> str:
        return "[Windows 复选框]"

# macOS 风格产品
class MacButton(Button):
    def render(self) -> str:
        return "(Mac 按钮)"

class MacTextBox(TextBox):
    def render(self) -> str:
        return "(Mac 文本框)"

class MacCheckBox(CheckBox):
    def render(self) -> str:
        return "(Mac 复选框)"

# 抽象工厂
class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button:
        pass

    @abstractmethod
    def create_textbox(self) -> TextBox:
        pass

    @abstractmethod
    def create_checkbox(self) -> CheckBox:
        pass

# 具体工厂
class WindowsFactory(GUIFactory):
    def create_button(self) -> Button:
        return WindowsButton()

    def create_textbox(self) -> TextBox:
        return WindowsTextBox()

    def create_checkbox(self) -> CheckBox:
        return WindowsCheckBox()

class MacFactory(GUIFactory):
    def create_button(self) -> Button:
        return MacButton()

    def create_textbox(self) -> TextBox:
        return MacTextBox()

    def create_checkbox(self) -> CheckBox:
        return MacCheckBox()

# 客户端代码
class Application:
    def __init__(self, factory: GUIFactory):
        self.factory = factory
        self.button = None
        self.textbox = None
        self.checkbox = None

    def create_ui(self):
        self.button = self.factory.create_button()
        self.textbox = self.factory.create_textbox()
        self.checkbox = self.factory.create_checkbox()

    def render(self) -> str:
        return f"""
        界面:
        - {self.button.render()}
        - {self.textbox.render()}
        - {self.checkbox.render()}
        """

# 根据操作系统选择工厂
import platform

def get_factory() -> GUIFactory:
    os_name = platform.system()
    if os_name == "Windows":
        return WindowsFactory()
    elif os_name == "Darwin":  # macOS
        return MacFactory()
    else:
        return WindowsFactory()  # 默认

# 使用
factory = MacFactory()  # 或 get_factory()
app = Application(factory)
app.create_ui()
print(app.render())
```

### 观察者模式（Observer Pattern）

观察者模式定义对象间一对多的依赖关系，当一个对象状态改变时，所有依赖者都会收到通知。

#### 经典实现

```python
from abc import ABC, abstractmethod
from typing import List

class Observer(ABC):
    """观察者抽象基类"""

    @abstractmethod
    def update(self, subject: 'Subject') -> None:
        pass

class Subject(ABC):
    """主题抽象基类"""

    def __init__(self):
        self._observers: List[Observer] = []

    def attach(self, observer: Observer) -> None:
        """添加观察者"""
        if observer not in self._observers:
            self._observers.append(observer)
            print(f"已添加观察者: {observer.__class__.__name__}")

    def detach(self, observer: Observer) -> None:
        """移除观察者"""
        if observer in self._observers:
            self._observers.remove(observer)
            print(f"已移除观察者: {observer.__class__.__name__}")

    def notify(self) -> None:
        """通知所有观察者"""
        print(f"通知 {len(self._observers)} 个观察者...")
        for observer in self._observers:
            observer.update(self)

# 具体主题：股票价格
class Stock(Subject):
    def __init__(self, symbol: str, price: float):
        super().__init__()
        self._symbol = symbol
        self._price = price

    @property
    def symbol(self) -> str:
        return self._symbol

    @property
    def price(self) -> float:
        return self._price

    @price.setter
    def price(self, value: float) -> None:
        if value != self._price:
            old_price = self._price
            self._price = value
            print(f"\n{self._symbol} 价格变化: {old_price:.2f} -> {value:.2f}")
            self.notify()

# 具体观察者
class Investor(Observer):
    def __init__(self, name: str):
        self.name = name

    def update(self, subject: Subject) -> None:
        if isinstance(subject, Stock):
            print(f"  投资者 {self.name} 收到通知: "
                  f"{subject.symbol} 当前价格 {subject.price:.2f}")

class StockAlert(Observer):
    def __init__(self, threshold: float):
        self.threshold = threshold

    def update(self, subject: Subject) -> None:
        if isinstance(subject, Stock):
            if subject.price > self.threshold:
                print(f"  警报! {subject.symbol} 价格 {subject.price:.2f} "
                      f"超过阈值 {self.threshold:.2f}")

class TradingBot(Observer):
    def __init__(self, buy_threshold: float, sell_threshold: float):
        self.buy_threshold = buy_threshold
        self.sell_threshold = sell_threshold

    def update(self, subject: Subject) -> None:
        if isinstance(subject, Stock):
            if subject.price < self.buy_threshold:
                print(f"  交易机器人: 买入 {subject.symbol} @ {subject.price:.2f}")
            elif subject.price > self.sell_threshold:
                print(f"  交易机器人: 卖出 {subject.symbol} @ {subject.price:.2f}")

# 使用
stock = Stock("AAPL", 150.0)

investor1 = Investor("张三")
investor2 = Investor("李四")
alert = StockAlert(180.0)
bot = TradingBot(140.0, 175.0)

stock.attach(investor1)
stock.attach(investor2)
stock.attach(alert)
stock.attach(bot)

# 模拟价格变化
stock.price = 155.0
stock.price = 185.0  # 触发警报和卖出
stock.price = 135.0  # 触发买入

# 移除一个观察者
stock.detach(investor1)
stock.price = 160.0
```

#### Pythonic 实现：使用回调函数

```python
from typing import Callable, Dict, List, Any

class EventEmitter:
    """基于事件的观察者模式实现"""

    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}

    def on(self, event: str, callback: Callable) -> 'EventEmitter':
        """注册事件监听器"""
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)
        return self  # 支持链式调用

    def off(self, event: str, callback: Callable = None) -> 'EventEmitter':
        """移除事件监听器"""
        if event in self._listeners:
            if callback is None:
                del self._listeners[event]
            else:
                self._listeners[event].remove(callback)
        return self

    def emit(self, event: str, *args, **kwargs) -> None:
        """触发事件"""
        if event in self._listeners:
            for callback in self._listeners[event]:
                callback(*args, **kwargs)

    def once(self, event: str, callback: Callable) -> 'EventEmitter':
        """注册一次性监听器"""
        def wrapper(*args, **kwargs):
            callback(*args, **kwargs)
            self.off(event, wrapper)
        return self.on(event, wrapper)

# 使用示例
class UserService(EventEmitter):
    def __init__(self):
        super().__init__()
        self.users = {}

    def create_user(self, user_id: str, name: str):
        user = {"id": user_id, "name": name}
        self.users[user_id] = user
        self.emit("user_created", user)
        return user

    def delete_user(self, user_id: str):
        if user_id in self.users:
            user = self.users.pop(user_id)
            self.emit("user_deleted", user)
            return user
        return None

# 创建服务
user_service = UserService()

# 注册监听器
user_service.on("user_created",
    lambda user: print(f"新用户注册: {user['name']}"))

user_service.on("user_created",
    lambda user: print(f"发送欢迎邮件给: {user['name']}"))

user_service.on("user_deleted",
    lambda user: print(f"用户已删除: {user['name']}"))

# 一次性监听器
user_service.once("user_created",
    lambda user: print(f"首次注册奖励发放给: {user['name']}"))

# 测试
user_service.create_user("001", "张三")
print("---")
user_service.create_user("002", "李四")  # 不再有首次奖励
print("---")
user_service.delete_user("001")
```

#### 使用 Python 属性实现响应式

```python
from typing import Callable, List, TypeVar, Generic

T = TypeVar('T')

class Observable(Generic[T]):
    """响应式可观察值"""

    def __init__(self, initial_value: T):
        self._value = initial_value
        self._observers: List[Callable[[T, T], None]] = []

    @property
    def value(self) -> T:
        return self._value

    @value.setter
    def value(self, new_value: T) -> None:
        if new_value != self._value:
            old_value = self._value
            self._value = new_value
            self._notify(old_value, new_value)

    def subscribe(self, callback: Callable[[T, T], None]) -> Callable[[], None]:
        """订阅变化，返回取消订阅函数"""
        self._observers.append(callback)

        def unsubscribe():
            self._observers.remove(callback)

        return unsubscribe

    def _notify(self, old_value: T, new_value: T) -> None:
        for callback in self._observers:
            callback(old_value, new_value)

# 使用
temperature = Observable(20.0)

# 订阅温度变化
unsubscribe1 = temperature.subscribe(
    lambda old, new: print(f"温度从 {old}°C 变为 {new}°C")
)

unsubscribe2 = temperature.subscribe(
    lambda old, new: print(f"温差: {new - old:+.1f}°C") if new > old else None
)

temperature.value = 22.5
temperature.value = 18.0

# 取消第一个订阅
unsubscribe1()

temperature.value = 25.0  # 只有第二个订阅者收到通知
```

### 策略模式（Strategy Pattern）

策略模式定义一系列算法，将每个算法封装起来，使它们可以互换。

#### 经典实现

```python
from abc import ABC, abstractmethod
from typing import List

class PaymentStrategy(ABC):
    """支付策略抽象基类"""

    @abstractmethod
    def pay(self, amount: float) -> str:
        pass

    @abstractmethod
    def validate(self) -> bool:
        pass

class CreditCardPayment(PaymentStrategy):
    def __init__(self, card_number: str, cvv: str, expiry: str):
        self.card_number = card_number
        self.cvv = cvv
        self.expiry = expiry

    def pay(self, amount: float) -> str:
        if not self.validate():
            return "信用卡验证失败"
        return f"使用信用卡 ****{self.card_number[-4:]} 支付 {amount:.2f} 元"

    def validate(self) -> bool:
        # 简化验证
        return len(self.card_number) == 16 and len(self.cvv) == 3

class AlipayPayment(PaymentStrategy):
    def __init__(self, account: str):
        self.account = account

    def pay(self, amount: float) -> str:
        if not self.validate():
            return "支付宝账号验证失败"
        return f"使用支付宝 {self.account} 支付 {amount:.2f} 元"

    def validate(self) -> bool:
        return "@" in self.account or self.account.isdigit()

class WeChatPayment(PaymentStrategy):
    def __init__(self, openid: str):
        self.openid = openid

    def pay(self, amount: float) -> str:
        if not self.validate():
            return "微信支付验证失败"
        return f"使用微信支付 (OpenID: {self.openid[:8]}...) 支付 {amount:.2f} 元"

    def validate(self) -> bool:
        return len(self.openid) > 0

class ShoppingCart:
    """购物车（上下文）"""

    def __init__(self):
        self.items: List[tuple] = []  # (商品名, 价格)
        self._payment_strategy: PaymentStrategy = None

    def add_item(self, name: str, price: float) -> None:
        self.items.append((name, price))

    def get_total(self) -> float:
        return sum(price for _, price in self.items)

    def set_payment_strategy(self, strategy: PaymentStrategy) -> None:
        self._payment_strategy = strategy

    def checkout(self) -> str:
        if not self._payment_strategy:
            return "请选择支付方式"
        if not self.items:
            return "购物车为空"

        total = self.get_total()
        return self._payment_strategy.pay(total)

# 使用
cart = ShoppingCart()
cart.add_item("Python 编程", 89.0)
cart.add_item("设计模式", 59.0)

print(f"总计: {cart.get_total():.2f} 元")

# 使用信用卡支付
cart.set_payment_strategy(CreditCardPayment("1234567890123456", "123", "12/25"))
print(cart.checkout())

# 切换到支付宝
cart.set_payment_strategy(AlipayPayment("user@example.com"))
print(cart.checkout())

# 切换到微信支付
cart.set_payment_strategy(WeChatPayment("wx_openid_abc123def456"))
print(cart.checkout())
```

#### Pythonic 实现：使用一等函数

```python
from typing import Callable, List
from dataclasses import dataclass

# 策略就是函数
def bubble_sort(data: List[int]) -> List[int]:
    """冒泡排序"""
    arr = data.copy()
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(data: List[int]) -> List[int]:
    """快速排序"""
    if len(data) <= 1:
        return data.copy()
    pivot = data[len(data) // 2]
    left = [x for x in data if x < pivot]
    middle = [x for x in data if x == pivot]
    right = [x for x in data if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

def merge_sort(data: List[int]) -> List[int]:
    """归并排序"""
    if len(data) <= 1:
        return data.copy()
    mid = len(data) // 2
    left = merge_sort(data[:mid])
    right = merge_sort(data[mid:])

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

# 上下文类
class Sorter:
    def __init__(self, strategy: Callable[[List[int]], List[int]] = None):
        self.strategy = strategy or sorted  # 默认使用内置排序

    def sort(self, data: List[int]) -> List[int]:
        return self.strategy(data)

# 使用
data = [64, 34, 25, 12, 22, 11, 90]

sorter = Sorter(bubble_sort)
print(f"冒泡排序: {sorter.sort(data)}")

sorter.strategy = quick_sort
print(f"快速排序: {sorter.sort(data)}")

sorter.strategy = merge_sort
print(f"归并排序: {sorter.sort(data)}")

# 甚至可以使用 lambda
sorter.strategy = lambda x: sorted(x, reverse=True)
print(f"降序排序: {sorter.sort(data)}")
```

#### 使用字典映射策略

```python
from typing import Dict, Callable

class PriceCalculator:
    """价格计算器，使用策略模式处理不同的折扣"""

    # 策略字典
    _discount_strategies: Dict[str, Callable[[float], float]] = {
        "none": lambda price: price,
        "member": lambda price: price * 0.9,
        "vip": lambda price: price * 0.8,
        "super_vip": lambda price: price * 0.7,
        "employee": lambda price: price * 0.5,
    }

    @classmethod
    def register_discount(cls, name: str,
                          strategy: Callable[[float], float]) -> None:
        """注册新的折扣策略"""
        cls._discount_strategies[name] = strategy

    @classmethod
    def calculate(cls, price: float, discount_type: str = "none") -> float:
        """计算最终价格"""
        strategy = cls._discount_strategies.get(discount_type)
        if strategy is None:
            raise ValueError(f"未知的折扣类型: {discount_type}")
        return strategy(price)

# 使用
original_price = 100.0

print(f"原价: {original_price}")
print(f"普通会员价: {PriceCalculator.calculate(original_price, 'member')}")
print(f"VIP 价: {PriceCalculator.calculate(original_price, 'vip')}")

# 动态添加新策略
PriceCalculator.register_discount(
    "new_year_sale",
    lambda price: price * 0.6 if price > 50 else price * 0.8
)

print(f"新年特惠价: {PriceCalculator.calculate(original_price, 'new_year_sale')}")
```

### 装饰器模式（Decorator Pattern）

装饰器模式动态地将责任附加到对象上，提供了比继承更灵活的功能扩展方式。

#### 经典面向对象实现

```python
from abc import ABC, abstractmethod

class Coffee(ABC):
    """咖啡抽象基类"""

    @abstractmethod
    def cost(self) -> float:
        pass

    @abstractmethod
    def description(self) -> str:
        pass

class SimpleCoffee(Coffee):
    """简单咖啡"""

    def cost(self) -> float:
        return 10.0

    def description(self) -> str:
        return "简单咖啡"

class Espresso(Coffee):
    """意式浓缩"""

    def cost(self) -> float:
        return 15.0

    def description(self) -> str:
        return "意式浓缩"

class CoffeeDecorator(Coffee):
    """咖啡装饰器基类"""

    def __init__(self, coffee: Coffee):
        self._coffee = coffee

    def cost(self) -> float:
        return self._coffee.cost()

    def description(self) -> str:
        return self._coffee.description()

class MilkDecorator(CoffeeDecorator):
    """加牛奶"""

    def cost(self) -> float:
        return self._coffee.cost() + 2.0

    def description(self) -> str:
        return self._coffee.description() + " + 牛奶"

class SugarDecorator(CoffeeDecorator):
    """加糖"""

    def cost(self) -> float:
        return self._coffee.cost() + 1.0

    def description(self) -> str:
        return self._coffee.description() + " + 糖"

class WhippedCreamDecorator(CoffeeDecorator):
    """加奶油"""

    def cost(self) -> float:
        return self._coffee.cost() + 3.0

    def description(self) -> str:
        return self._coffee.description() + " + 奶油"

class VanillaDecorator(CoffeeDecorator):
    """加香草"""

    def cost(self) -> float:
        return self._coffee.cost() + 2.5

    def description(self) -> str:
        return self._coffee.description() + " + 香草"

# 使用
coffee = SimpleCoffee()
print(f"{coffee.description()}: {coffee.cost()} 元")

# 加牛奶
coffee_with_milk = MilkDecorator(coffee)
print(f"{coffee_with_milk.description()}: {coffee_with_milk.cost()} 元")

# 加牛奶和糖
coffee_with_milk_sugar = SugarDecorator(MilkDecorator(coffee))
print(f"{coffee_with_milk_sugar.description()}: {coffee_with_milk_sugar.cost()} 元")

# 豪华版
luxury_coffee = VanillaDecorator(
    WhippedCreamDecorator(
        SugarDecorator(
            MilkDecorator(Espresso())
        )
    )
)
print(f"{luxury_coffee.description()}: {luxury_coffee.cost()} 元")
```

#### Python 函数装饰器

```python
from functools import wraps
import time
from typing import Callable, Any

def timer(func: Callable) -> Callable:
    """计时装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 执行时间: {end - start:.4f} 秒")
        return result
    return wrapper

def logger(func: Callable) -> Callable:
    """日志装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        print(f"调用 {func.__name__}")
        print(f"  参数: args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        print(f"  返回: {result}")
        return result
    return wrapper

def retry(max_attempts: int = 3, delay: float = 1.0):
    """重试装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    print(f"尝试 {attempt}/{max_attempts} 失败: {e}")
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator

def cache(func: Callable) -> Callable:
    """缓存装饰器"""
    cached = {}

    @wraps(func)
    def wrapper(*args) -> Any:
        if args not in cached:
            cached[args] = func(*args)
        else:
            print(f"从缓存返回: {args}")
        return cached[args]

    wrapper.cache_clear = lambda: cached.clear()
    return wrapper

def validate_types(**expected_types):
    """类型验证装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            import inspect
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()

            for param_name, expected_type in expected_types.items():
                if param_name in bound.arguments:
                    value = bound.arguments[param_name]
                    if not isinstance(value, expected_type):
                        raise TypeError(
                            f"参数 '{param_name}' 应该是 {expected_type.__name__}，"
                            f"而不是 {type(value).__name__}"
                        )
            return func(*args, **kwargs)
        return wrapper
    return decorator

# 组合使用多个装饰器
@timer
@logger
@cache
def fibonacci(n: int) -> int:
    """计算斐波那契数"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 使用
print(f"fibonacci(10) = {fibonacci(10)}")
print()
print(f"fibonacci(10) = {fibonacci(10)}")  # 从缓存返回

@retry(max_attempts=3, delay=0.5)
@validate_types(x=int, y=int)
def divide(x: int, y: int) -> float:
    """除法运算"""
    return x / y

try:
    print(divide(10, 2))
    print(divide(10, 0))  # 会重试
except ZeroDivisionError:
    print("所有重试都失败了")
```

#### 类装饰器

```python
from functools import wraps

class CountCalls:
    """统计函数调用次数的装饰器类"""

    def __init__(self, func):
        wraps(func)(self)
        self.func = func
        self.num_calls = 0

    def __call__(self, *args, **kwargs):
        self.num_calls += 1
        print(f"{self.func.__name__} 已被调用 {self.num_calls} 次")
        return self.func(*args, **kwargs)

class Singleton:
    """单例装饰器类"""

    def __init__(self, cls):
        self._cls = cls
        self._instance = None

    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = self._cls(*args, **kwargs)
        return self._instance

class Deprecated:
    """标记函数为已弃用的装饰器类"""

    def __init__(self, reason: str = ""):
        self.reason = reason

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import warnings
            message = f"{func.__name__} 已弃用"
            if self.reason:
                message += f": {self.reason}"
            warnings.warn(message, DeprecationWarning, stacklevel=2)
            return func(*args, **kwargs)
        return wrapper

# 使用
@CountCalls
def greet(name: str) -> str:
    return f"你好，{name}！"

greet("张三")
greet("李四")
greet("王五")
print(f"总调用次数: {greet.num_calls}")

@Singleton
class DatabaseConnection:
    def __init__(self, host: str):
        self.host = host
        print(f"创建连接到 {host}")

db1 = DatabaseConnection("localhost")
db2 = DatabaseConnection("remotehost")  # 返回同一实例
print(f"db1 is db2: {db1 is db2}")

@Deprecated("请使用 new_function 代替")
def old_function():
    return "旧功能"

import warnings
with warnings.catch_warnings(record=True):
    warnings.simplefilter("always")
    old_function()
```

## 最佳实践

### 选择正确的模式

```python
# 问题：需要确保全局只有一个配置实例
# 解决方案：单例模式

# 最 Pythonic 的方式：模块级单例
# config.py
class _Config:
    def __init__(self):
        self.debug = False
        self.database_url = ""

config = _Config()

# 而不是复杂的单例类
```

### 保持简单

```python
# 不好：过度设计
class StrategyInterface(ABC):
    @abstractmethod
    def execute(self): pass

class ConcreteStrategy(StrategyInterface):
    def execute(self):
        return "do something"

class Context:
    def __init__(self, strategy: StrategyInterface):
        self.strategy = strategy

    def do_work(self):
        return self.strategy.execute()

# 好：Python 方式
def do_something():
    return "do something"

def run_strategy(strategy):
    return strategy()

result = run_strategy(do_something)
```

### 组合优于继承

```python
# 不好：深层继承
class Animal:
    pass

class Mammal(Animal):
    pass

class Dog(Mammal):
    pass

class WorkingDog(Dog):
    pass

class GermanShepherd(WorkingDog):
    pass

# 好：使用组合
from dataclasses import dataclass
from typing import List, Callable

@dataclass
class Animal:
    name: str
    behaviors: List[Callable] = None

    def __post_init__(self):
        self.behaviors = self.behaviors or []

    def add_behavior(self, behavior: Callable):
        self.behaviors.append(behavior)

    def perform_behaviors(self):
        for behavior in self.behaviors:
            behavior(self)

def bark(animal):
    print(f"{animal.name} 汪汪叫")

def guard(animal):
    print(f"{animal.name} 正在看门")

dog = Animal("旺财")
dog.add_behavior(bark)
dog.add_behavior(guard)
dog.perform_behaviors()
```

### 利用 Python 特性

```python
# 使用 __call__ 使对象可调用
class Multiplier:
    def __init__(self, factor: int):
        self.factor = factor

    def __call__(self, value: int) -> int:
        return value * self.factor

double = Multiplier(2)
triple = Multiplier(3)

print(double(5))  # 10
print(triple(5))  # 15

# 使用 property 替代 getter/setter
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float):
        if value < 0:
            raise ValueError("半径不能为负数")
        self._radius = value

    @property
    def area(self) -> float:
        import math
        return math.pi * self._radius ** 2
```

### 文档和类型提示

```python
from typing import Protocol, List, TypeVar

T = TypeVar('T')

class Sortable(Protocol):
    """可排序对象的协议"""
    def __lt__(self, other: 'Sortable') -> bool: ...

def sort_items(items: List[Sortable]) -> List[Sortable]:
    """
    对实现了 Sortable 协议的对象列表进行排序。

    Args:
        items: 要排序的对象列表

    Returns:
        排序后的新列表

    Example:
        >>> sort_items([3, 1, 2])
        [1, 2, 3]
    """
    return sorted(items)
```

## 常见陷阱

### 单例模式的线程安全问题

```python
# 不好：非线程安全
class BadSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            # 多个线程可能同时进入这里
            cls._instance = super().__new__(cls)
        return cls._instance

# 好：使用锁
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # 双重检查
                    cls._instance = super().__new__(cls)
        return cls._instance
```

### 装饰器破坏函数签名

```python
from functools import wraps

# 不好：丢失函数元信息
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def greet(name: str) -> str:
    """向某人问好"""
    return f"你好，{name}！"

print(greet.__name__)  # wrapper（错误）
print(greet.__doc__)   # None（错误）

# 好：使用 functools.wraps
def good_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@good_decorator
def greet2(name: str) -> str:
    """向某人问好"""
    return f"你好，{name}！"

print(greet2.__name__)  # greet2（正确）
print(greet2.__doc__)   # 向某人问好（正确）
```

### 观察者模式的内存泄漏

```python
import weakref
from typing import List

# 不好：强引用导致内存泄漏
class BadSubject:
    def __init__(self):
        self._observers = []  # 强引用

    def attach(self, observer):
        self._observers.append(observer)

    # 即使 observer 被删除，这里仍然持有引用

# 好：使用弱引用
class GoodSubject:
    def __init__(self):
        self._observers: List[weakref.ref] = []

    def attach(self, observer):
        self._observers.append(weakref.ref(observer))

    def notify(self):
        # 清理已被回收的观察者
        self._observers = [ref for ref in self._observers if ref() is not None]

        for observer_ref in self._observers:
            observer = observer_ref()
            if observer is not None:
                observer.update(self)
```

### 工厂模式的过度使用

```python
# 不好：简单对象也用工厂
class PointFactory:
    @staticmethod
    def create(x, y):
        return Point(x, y)

point = PointFactory.create(1, 2)

# 好：直接创建
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

point = Point(1, 2)

# 工厂模式适合复杂对象或需要多态的情况
```

### 策略模式的状态管理

```python
# 不好：策略包含状态
class BadStrategy:
    def __init__(self):
        self.counter = 0  # 策略不应该有状态

    def execute(self):
        self.counter += 1
        return self.counter

# 好：策略是无状态的
class GoodStrategy:
    def execute(self, data):
        return process(data)

# 状态应该在上下文中管理
class Context:
    def __init__(self, strategy):
        self.strategy = strategy
        self.state = {}  # 状态在这里

    def execute(self):
        return self.strategy.execute(self.state)
```

## 性能考量

### 单例模式的性能

```python
import time

# 比较不同单例实现的性能
def benchmark(name: str, create_func, iterations: int = 100000):
    start = time.time()
    for _ in range(iterations):
        create_func()
    end = time.time()
    print(f"{name}: {end - start:.4f} 秒")

# 模块级单例（最快）
class ModuleSingleton:
    pass

_module_singleton = ModuleSingleton()

def get_module_singleton():
    return _module_singleton

# __new__ 实现
class NewSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# 元类实现
class SingletonMeta(type):
    _instances = {}

    def __call__(cls):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__()
        return cls._instances[cls]

class MetaSingleton(metaclass=SingletonMeta):
    pass

# 基准测试
benchmark("模块级单例", get_module_singleton)
benchmark("__new__ 单例", NewSingleton)
benchmark("元类单例", MetaSingleton)
```

### 装饰器的开销

```python
from functools import wraps, lru_cache
import time

def simple_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def measure_overhead():
    def bare_function(x):
        return x * 2

    @simple_decorator
    def decorated_function(x):
        return x * 2

    iterations = 1000000

    start = time.time()
    for i in range(iterations):
        bare_function(i)
    bare_time = time.time() - start

    start = time.time()
    for i in range(iterations):
        decorated_function(i)
    decorated_time = time.time() - start

    print(f"无装饰器: {bare_time:.4f} 秒")
    print(f"有装饰器: {decorated_time:.4f} 秒")
    print(f"开销: {((decorated_time - bare_time) / bare_time) * 100:.2f}%")

measure_overhead()

# 缓存装饰器的性能优势
def fibonacci_no_cache(n):
    if n < 2:
        return n
    return fibonacci_no_cache(n - 1) + fibonacci_no_cache(n - 2)

@lru_cache(maxsize=None)
def fibonacci_with_cache(n):
    if n < 2:
        return n
    return fibonacci_with_cache(n - 1) + fibonacci_with_cache(n - 2)

n = 30

start = time.time()
fibonacci_no_cache(n)
print(f"无缓存: {time.time() - start:.4f} 秒")

start = time.time()
fibonacci_with_cache(n)
print(f"有缓存: {time.time() - start:.6f} 秒")
```

### 观察者模式的通知效率

```python
from typing import List, Set, Callable
import time

class SlowSubject:
    """使用列表存储观察者"""

    def __init__(self):
        self._observers: List[Callable] = []

    def attach(self, observer):
        self._observers.append(observer)

    def detach(self, observer):
        self._observers.remove(observer)  # O(n) 操作

    def notify(self):
        for observer in self._observers:
            observer()

class FastSubject:
    """使用集合存储观察者"""

    def __init__(self):
        self._observers: Set[Callable] = set()

    def attach(self, observer):
        self._observers.add(observer)

    def detach(self, observer):
        self._observers.discard(observer)  # O(1) 操作

    def notify(self):
        for observer in self._observers:
            observer()

# 如果需要频繁添加/删除观察者，使用集合更高效
```

## 实战场景

### 场景一：Web 框架中的路由系统（装饰器模式）

```python
from typing import Callable, Dict, Tuple, Any
from dataclasses import dataclass
import re

@dataclass
class Route:
    path: str
    method: str
    handler: Callable
    pattern: re.Pattern = None

    def __post_init__(self):
        # 将路径转换为正则表达式
        pattern = self.path
        pattern = re.sub(r'<(\w+)>', r'(?P<\1>[^/]+)', pattern)
        self.pattern = re.compile(f'^{pattern}$')

class Router:
    """简单的 Web 路由器"""

    def __init__(self):
        self.routes: Dict[str, list] = {
            'GET': [],
            'POST': [],
            'PUT': [],
            'DELETE': [],
        }

    def route(self, path: str, methods: list = None):
        """路由装饰器"""
        methods = methods or ['GET']

        def decorator(func: Callable) -> Callable:
            for method in methods:
                route = Route(path=path, method=method, handler=func)
                self.routes[method].append(route)
            return func

        return decorator

    def get(self, path: str):
        return self.route(path, ['GET'])

    def post(self, path: str):
        return self.route(path, ['POST'])

    def match(self, path: str, method: str) -> Tuple[Callable, Dict[str, Any]]:
        """匹配路由"""
        for route in self.routes.get(method, []):
            match = route.pattern.match(path)
            if match:
                return route.handler, match.groupdict()
        return None, {}

    def dispatch(self, path: str, method: str = 'GET', **kwargs) -> Any:
        """分发请求"""
        handler, path_params = self.match(path, method)
        if handler is None:
            return f"404 Not Found: {path}"
        return handler(**path_params, **kwargs)

# 使用
app = Router()

@app.get('/')
def index():
    return "欢迎来到首页"

@app.get('/users')
def list_users():
    return "用户列表"

@app.get('/users/<user_id>')
def get_user(user_id: str):
    return f"用户详情: {user_id}"

@app.post('/users')
def create_user():
    return "创建用户成功"

@app.route('/articles/<article_id>/comments/<comment_id>', methods=['GET', 'DELETE'])
def handle_comment(article_id: str, comment_id: str):
    return f"文章 {article_id} 的评论 {comment_id}"

# 测试
print(app.dispatch('/'))
print(app.dispatch('/users'))
print(app.dispatch('/users/123'))
print(app.dispatch('/users', 'POST'))
print(app.dispatch('/articles/1/comments/2'))
```

### 场景二：游戏角色状态机（状态模式 + 策略模式）

```python
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass

class CharacterState(ABC):
    """角色状态抽象基类"""

    @abstractmethod
    def enter(self, character: 'Character') -> None:
        """进入状态"""
        pass

    @abstractmethod
    def update(self, character: 'Character') -> None:
        """更新状态"""
        pass

    @abstractmethod
    def exit(self, character: 'Character') -> None:
        """退出状态"""
        pass

    @abstractmethod
    def handle_input(self, character: 'Character', input_key: str) -> Optional['CharacterState']:
        """处理输入，返回新状态或 None"""
        pass

class IdleState(CharacterState):
    def enter(self, character: 'Character') -> None:
        print(f"{character.name} 进入待机状态")
        character.animation = "idle"

    def update(self, character: 'Character') -> None:
        # 恢复能量
        character.energy = min(100, character.energy + 1)

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} 离开待机状态")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        if input_key == 'move':
            return WalkingState()
        elif input_key == 'attack':
            return AttackingState()
        elif input_key == 'jump':
            return JumpingState()
        return None

class WalkingState(CharacterState):
    def enter(self, character: 'Character') -> None:
        print(f"{character.name} 开始行走")
        character.animation = "walk"

    def update(self, character: 'Character') -> None:
        character.position += character.speed
        character.energy -= 0.1

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} 停止行走")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        if input_key == 'stop':
            return IdleState()
        elif input_key == 'run':
            return RunningState()
        elif input_key == 'attack':
            return AttackingState()
        return None

class RunningState(CharacterState):
    def enter(self, character: 'Character') -> None:
        print(f"{character.name} 开始奔跑")
        character.animation = "run"

    def update(self, character: 'Character') -> None:
        character.position += character.speed * 2
        character.energy -= 0.5

        # 能量耗尽自动停止
        if character.energy <= 0:
            character.change_state(WalkingState())

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} 停止奔跑")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        if input_key == 'stop':
            return IdleState()
        elif input_key == 'walk':
            return WalkingState()
        return None

class AttackingState(CharacterState):
    def __init__(self):
        self.attack_duration = 3
        self.current_frame = 0

    def enter(self, character: 'Character') -> None:
        print(f"{character.name} 发动攻击！")
        character.animation = "attack"
        self.current_frame = 0

    def update(self, character: 'Character') -> None:
        self.current_frame += 1
        if self.current_frame >= self.attack_duration:
            character.change_state(IdleState())

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} 攻击结束")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        # 攻击状态下不响应其他输入
        return None

class JumpingState(CharacterState):
    def __init__(self):
        self.jump_frames = 0
        self.max_jump_frames = 5

    def enter(self, character: 'Character') -> None:
        print(f"{character.name} 跳跃！")
        character.animation = "jump"
        self.jump_frames = 0

    def update(self, character: 'Character') -> None:
        self.jump_frames += 1
        if self.jump_frames >= self.max_jump_frames:
            character.change_state(IdleState())

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} 落地")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        if input_key == 'attack':
            # 空中攻击
            print(f"{character.name} 空中攻击！")
            return AttackingState()
        return None

@dataclass
class Character:
    """游戏角色"""
    name: str
    position: float = 0
    speed: float = 1.0
    energy: float = 100
    animation: str = "idle"
    state: CharacterState = None

    def __post_init__(self):
        self.state = IdleState()
        self.state.enter(self)

    def change_state(self, new_state: CharacterState) -> None:
        if self.state:
            self.state.exit(self)
        self.state = new_state
        self.state.enter(self)

    def handle_input(self, input_key: str) -> None:
        new_state = self.state.handle_input(self, input_key)
        if new_state:
            self.change_state(new_state)

    def update(self) -> None:
        self.state.update(self)

    def status(self) -> str:
        return (f"{self.name}: 位置={self.position:.1f}, "
                f"能量={self.energy:.1f}, 动画={self.animation}")

# 模拟游戏循环
hero = Character("英雄")

actions = ['move', 'update', 'update', 'run', 'update', 'update',
           'attack', 'update', 'update', 'update', 'update']

for action in actions:
    if action == 'update':
        hero.update()
    else:
        hero.handle_input(action)
    print(f"  -> {hero.status()}")
```

### 场景三：数据处理管道（责任链模式 + 装饰器模式）

```python
from abc import ABC, abstractmethod
from typing import Any, Optional, List, Callable
from dataclasses import dataclass
import json

class DataProcessor(ABC):
    """数据处理器抽象基类（责任链）"""

    def __init__(self):
        self._next: Optional['DataProcessor'] = None

    def set_next(self, processor: 'DataProcessor') -> 'DataProcessor':
        self._next = processor
        return processor

    @abstractmethod
    def process(self, data: Any) -> Any:
        pass

    def handle(self, data: Any) -> Any:
        result = self.process(data)
        if self._next and result is not None:
            return self._next.handle(result)
        return result

class ValidationProcessor(DataProcessor):
    """验证处理器"""

    def __init__(self, validators: List[Callable[[Any], bool]]):
        super().__init__()
        self.validators = validators

    def process(self, data: Any) -> Any:
        for validator in self.validators:
            if not validator(data):
                print(f"验证失败: {validator.__name__}")
                return None
        print("验证通过")
        return data

class TransformProcessor(DataProcessor):
    """转换处理器"""

    def __init__(self, transform: Callable[[Any], Any]):
        super().__init__()
        self.transform = transform

    def process(self, data: Any) -> Any:
        result = self.transform(data)
        print(f"转换完成: {type(data).__name__} -> {type(result).__name__}")
        return result

class FilterProcessor(DataProcessor):
    """过滤处理器"""

    def __init__(self, condition: Callable[[Any], bool]):
        super().__init__()
        self.condition = condition

    def process(self, data: Any) -> Any:
        if isinstance(data, (list, tuple)):
            result = [item for item in data if self.condition(item)]
            print(f"过滤: {len(data)} -> {len(result)} 条记录")
            return result
        return data if self.condition(data) else None

class EnrichProcessor(DataProcessor):
    """数据增强处理器"""

    def __init__(self, enricher: Callable[[Any], Any]):
        super().__init__()
        self.enricher = enricher

    def process(self, data: Any) -> Any:
        result = self.enricher(data)
        print("数据增强完成")
        return result

class OutputProcessor(DataProcessor):
    """输出处理器"""

    def __init__(self, output_format: str = "json"):
        super().__init__()
        self.output_format = output_format

    def process(self, data: Any) -> Any:
        if self.output_format == "json":
            result = json.dumps(data, ensure_ascii=False, indent=2)
        else:
            result = str(data)
        print(f"输出格式: {self.output_format}")
        return result

# 管道构建器
class PipelineBuilder:
    """管道构建器（建造者模式）"""

    def __init__(self):
        self._processors: List[DataProcessor] = []

    def add_validation(self, *validators) -> 'PipelineBuilder':
        self._processors.append(ValidationProcessor(list(validators)))
        return self

    def add_transform(self, transform: Callable) -> 'PipelineBuilder':
        self._processors.append(TransformProcessor(transform))
        return self

    def add_filter(self, condition: Callable) -> 'PipelineBuilder':
        self._processors.append(FilterProcessor(condition))
        return self

    def add_enrich(self, enricher: Callable) -> 'PipelineBuilder':
        self._processors.append(EnrichProcessor(enricher))
        return self

    def add_output(self, format: str = "json") -> 'PipelineBuilder':
        self._processors.append(OutputProcessor(format))
        return self

    def build(self) -> DataProcessor:
        if not self._processors:
            raise ValueError("管道至少需要一个处理器")

        for i in range(len(self._processors) - 1):
            self._processors[i].set_next(self._processors[i + 1])

        return self._processors[0]

# 使用示例
def is_not_empty(data):
    return bool(data)

def is_list(data):
    return isinstance(data, list)

def parse_json(data: str) -> Any:
    return json.loads(data)

def has_valid_age(item):
    return isinstance(item.get('age'), int) and 0 <= item['age'] <= 150

def add_full_name(data: List[dict]) -> List[dict]:
    for item in data:
        item['full_name'] = f"{item.get('first_name', '')} {item.get('last_name', '')}"
    return data

# 构建管道
pipeline = (PipelineBuilder()
    .add_validation(is_not_empty)
    .add_transform(parse_json)
    .add_validation(is_list)
    .add_filter(has_valid_age)
    .add_enrich(add_full_name)
    .add_output("json")
    .build())

# 测试数据
test_data = '''[
    {"first_name": "张", "last_name": "三", "age": 25},
    {"first_name": "李", "last_name": "四", "age": 200},
    {"first_name": "王", "last_name": "五", "age": 30}
]'''

print("=" * 50)
print("处理开始")
print("=" * 50)
result = pipeline.handle(test_data)
print("=" * 50)
print("处理结果:")
print(result)
```

## 面试要点

### 常见面试问题

**1. 什么是设计模式？为什么要使用设计模式？**

设计模式是针对软件设计中反复出现的问题的可复用解决方案。使用设计模式的好处包括：
- 提供经过验证的解决方案
- 促进代码复用
- 建立共同的设计词汇
- 提高代码的可维护性和可扩展性

**2. 单例模式有哪些实现方式？各有什么优缺点？**

```python
# 模块级单例（最 Pythonic）
# 优点：简单、线程安全
# 缺点：不够显式

# __new__ 方法
# 优点：清晰的 OOP 实现
# 缺点：非线程安全（需要加锁）

# 元类
# 优点：强制单例、可继承
# 缺点：复杂度高

# 装饰器
# 优点：灵活、可复用
# 缺点：改变了类的类型
```

**3. 工厂模式和抽象工厂模式的区别是什么？**

- **工厂方法模式**：定义创建单个对象的接口，由子类决定实例化哪个类
- **抽象工厂模式**：提供创建一系列相关对象的接口，无需指定具体类

**4. 观察者模式和发布-订阅模式的区别是什么？**

- **观察者模式**：观察者直接订阅主题，主题维护观察者列表
- **发布-订阅模式**：发布者和订阅者通过消息代理（Broker）通信，彼此不直接了解

**5. 策略模式和状态模式的区别是什么？**

- **策略模式**：客户端选择使用哪个策略，策略之间相互独立
- **状态模式**：状态自己决定转换到哪个状态，状态之间有依赖关系

**6. Python 中如何优雅地实现设计模式？**

```python
# 利用一等函数实现策略模式
strategies = {
    'add': lambda x, y: x + y,
    'sub': lambda x, y: x - y,
}

# 利用装饰器实现装饰器模式
@timer
@cache
def compute(): pass

# 利用模块实现单例模式
# config.py
config = Config()

# 利用 __call__ 使对象可调用
class Multiplier:
    def __call__(self, x): return x * 2
```

### 代码考察示例

```python
# 题目：实现一个支持撤销操作的文本编辑器（命令模式）

from abc import ABC, abstractmethod
from typing import List

class Command(ABC):
    @abstractmethod
    def execute(self) -> None:
        pass

    @abstractmethod
    def undo(self) -> None:
        pass

class TextEditor:
    def __init__(self):
        self.text = ""

    def insert(self, text: str, position: int) -> None:
        self.text = self.text[:position] + text + self.text[position:]

    def delete(self, start: int, end: int) -> str:
        deleted = self.text[start:end]
        self.text = self.text[:start] + self.text[end:]
        return deleted

class InsertCommand(Command):
    def __init__(self, editor: TextEditor, text: str, position: int):
        self.editor = editor
        self.text = text
        self.position = position

    def execute(self) -> None:
        self.editor.insert(self.text, self.position)

    def undo(self) -> None:
        self.editor.delete(self.position, self.position + len(self.text))

class DeleteCommand(Command):
    def __init__(self, editor: TextEditor, start: int, end: int):
        self.editor = editor
        self.start = start
        self.end = end
        self.deleted_text = ""

    def execute(self) -> None:
        self.deleted_text = self.editor.delete(self.start, self.end)

    def undo(self) -> None:
        self.editor.insert(self.deleted_text, self.start)

class CommandManager:
    def __init__(self):
        self.history: List[Command] = []
        self.redo_stack: List[Command] = []

    def execute(self, command: Command) -> None:
        command.execute()
        self.history.append(command)
        self.redo_stack.clear()

    def undo(self) -> bool:
        if not self.history:
            return False
        command = self.history.pop()
        command.undo()
        self.redo_stack.append(command)
        return True

    def redo(self) -> bool:
        if not self.redo_stack:
            return False
        command = self.redo_stack.pop()
        command.execute()
        self.history.append(command)
        return True

# 测试
editor = TextEditor()
manager = CommandManager()

manager.execute(InsertCommand(editor, "Hello", 0))
print(f"插入后: '{editor.text}'")

manager.execute(InsertCommand(editor, " World", 5))
print(f"插入后: '{editor.text}'")

manager.undo()
print(f"撤销后: '{editor.text}'")

manager.redo()
print(f"重做后: '{editor.text}'")
```

## 延伸阅读

### 官方文档
- [Python 官方文档 - 类](https://docs.python.org/zh-cn/3/tutorial/classes.html)
- [Python 官方文档 - 抽象基类](https://docs.python.org/zh-cn/3/library/abc.html)
- [Python 官方文档 - functools](https://docs.python.org/zh-cn/3/library/functools.html)

### 经典书籍
- 《设计模式：可复用面向对象软件的基础》- GoF
- 《Head First 设计模式》- Eric Freeman
- 《Python 设计模式》- Chetan Giridhar
- 《流畅的 Python》- Luciano Ramalho（第二版）

### 在线资源
- [Refactoring Guru - 设计模式](https://refactoringguru.cn/design-patterns)
- [Python Patterns](https://python-patterns.guide/)
- [Real Python - Python Design Patterns](https://realpython.com/tutorials/best-practices/)

### 相关主题
- SOLID 原则
- 函数式编程模式
- 并发设计模式
- 架构模式（MVC、MVVM、微服务）
