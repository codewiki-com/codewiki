---
title: Design Patterns
description: "Complete Python Design Patterns Guide: Singleton, Factory, Observer, Strategy, Decorator patterns and Pythonic implementations"
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - Design Patterns
  - Singleton Pattern
  - Factory Pattern
  - Observer Pattern
  - Strategy Pattern
  - Decorator Pattern
  - Software Architecture
status: imported
origin: old/src/content/docs/python/design-patterns.en.md
divergence: 0.248
issues: []
legacy:
  category: Python
  subcategory: Advanced Topics
  order: 27
  lastUpdated: 2026-01-07
---

Design patterns are proven, reusable solution templates in software development. They represent best practices that experienced developers have summarized when facing common design problems. Python, as a flexible dynamic language, often implements design patterns more concisely and elegantly than static languages.

## Conceptual Explanation

### What Are Design Patterns

Design patterns are general solutions to recurring problems in software design. They are not finished products that can be directly converted to code, but rather templates or blueprints describing how to solve problems.

The concept of design patterns originated from architect Christopher Alexander's work, later introduced to software engineering by Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides (known as the "Gang of Four" or GoF) in their 1994 book "Design Patterns: Elements of Reusable Object-Oriented Software."

### Classification of Design Patterns

Design patterns are typically divided into three categories:

1. **Creational Patterns**: Focus on object creation mechanisms
   - Singleton
   - Factory Method
   - Abstract Factory
   - Builder
   - Prototype

2. **Structural Patterns**: Focus on class and object composition
   - Adapter
   - Decorator
   - Proxy
   - Facade
   - Bridge
   - Composite
   - Flyweight

3. **Behavioral Patterns**: Focus on communication between objects
   - Observer
   - Strategy
   - Command
   - State
   - Template Method
   - Iterator
   - Chain of Responsibility

### Python and Design Patterns

Python's dynamic features make many design pattern implementations more concise than traditional object-oriented languages:

- **First-class functions**: Strategy pattern can use simple functions instead of classes
- **Duck typing**: No need for explicit interface definitions
- **Decorator syntax**: Built-in support for decorator pattern
- **Metaclasses**: Can elegantly implement patterns like singleton
- **`__call__` method**: Any object can be called like a function

## Core Principles

### SOLID Principles

Design patterns are based on SOLID principles:

```python
# S - Single Responsibility Principle
# A class should have only one reason to change

# Bad design: One class doing too many things
class UserManager:
    def create_user(self, data):
        # Create user
        pass

    def send_email(self, user, message):
        # Send email - this shouldn't be in this class
        pass

    def generate_report(self):
        # Generate report - this also shouldn't be in this class
        pass

# Good design: Separate responsibilities
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
# O - Open/Closed Principle
# Open for extension, closed for modification

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

# Adding new shapes doesn't require modifying existing code
class Triangle(Shape):
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height

def calculate_total_area(shapes: list[Shape]) -> float:
    """This function is open to new shape types without modification"""
    return sum(shape.area() for shape in shapes)
```

```python
# L - Liskov Substitution Principle
# Subclasses must be substitutable for their base classes

class Bird:
    def fly(self):
        return "Flying..."

# Violates LSP: Penguins can't fly
class Penguin(Bird):
    def fly(self):
        raise NotImplementedError("Penguins can't fly")

# Correct design: Separate flying and non-flying birds
class Bird(ABC):
    @abstractmethod
    def move(self):
        pass

class FlyingBird(Bird):
    def move(self):
        return "Flying..."

class SwimmingBird(Bird):
    def move(self):
        return "Swimming..."

class Eagle(FlyingBird):
    pass

class Penguin(SwimmingBird):
    pass
```

```python
# I - Interface Segregation Principle
# Clients should not be forced to depend on methods they don't use

from abc import ABC, abstractmethod

# Bad design: Fat interface
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

# Robot doesn't need eat and sleep
class Robot(Worker):
    def work(self):
        return "Working..."

    def eat(self):
        raise NotImplementedError  # Forced to implement unnecessary method

    def sleep(self):
        raise NotImplementedError

# Good design: Segregated interfaces
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
        return "Human working..."

    def eat(self):
        return "Human eating..."

class Robot(Workable):
    def work(self):
        return "Robot working..."
```

```python
# D - Dependency Inversion Principle
# High-level modules should not depend on low-level modules; both should depend on abstractions

from abc import ABC, abstractmethod

# Abstraction
class MessageSender(ABC):
    @abstractmethod
    def send(self, message: str) -> bool:
        pass

# Low-level modules
class EmailSender(MessageSender):
    def send(self, message: str) -> bool:
        print(f"Sending email: {message}")
        return True

class SMSSender(MessageSender):
    def send(self, message: str) -> bool:
        print(f"Sending SMS: {message}")
        return True

# High-level module depends on abstraction, not concrete implementation
class NotificationService:
    def __init__(self, sender: MessageSender):
        self.sender = sender

    def notify(self, message: str):
        return self.sender.send(message)

# Usage
email_notification = NotificationService(EmailSender())
email_notification.notify("Hello!")

sms_notification = NotificationService(SMSSender())
sms_notification.notify("Hello!")
```

## Key Points

### Core Ideas of Design Patterns

| Pattern | Core Idea | Pythonic Implementation |
|---------|-----------|------------------------|
| Singleton | Ensure a class has only one instance | Module-level variables, metaclass, `__new__` |
| Factory | Separate object creation from usage | Simple functions, class methods |
| Observer | One-to-many dependency between objects | Signal/slot mechanism, callbacks |
| Strategy | Encapsulate interchangeable algorithms | First-class functions, callable objects |
| Decorator | Dynamically add functionality | `@decorator` syntax |

### When to Use Design Patterns

Design patterns are not silver bullets; consider using them when:

1. **Code needs extension**: Anticipating future feature additions
2. **Code needs reuse**: Similar logic used in multiple places
3. **Code needs decoupling**: Reducing dependencies between modules
4. **Code needs testing**: Making code more unit-testable
5. **Team collaboration**: Providing a common design vocabulary

## Code Examples

### Singleton Pattern

The Singleton pattern ensures a class has only one instance and provides a global access point.

#### Method 1: Module-Level Singleton (Most Pythonic)

```python
# database.py
class _Database:
    """Private database class"""

    def __init__(self):
        self.connection = None
        print("Initializing database connection...")

    def connect(self, connection_string: str):
        self.connection = connection_string
        print(f"Connected to: {connection_string}")

    def query(self, sql: str):
        if not self.connection:
            raise RuntimeError("Database not connected")
        print(f"Executing query: {sql}")
        return f"Query result: {sql}"

# Module-level singleton instance
database = _Database()

# Usage
# from database import database
# database.connect("postgresql://localhost/mydb")
# database.query("SELECT * FROM users")
```

This is the most Pythonic singleton implementation because Python modules are themselves singletons.

#### Method 2: Using `__new__` Method

```python
class Singleton:
    """Singleton using __new__"""
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Only initialize on first creation
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, value=None):
        # Prevent reinitialization
        if self._initialized:
            return
        self.value = value
        self._initialized = True
        print(f"Initializing singleton with value: {value}")

# Test
s1 = Singleton("first")
s2 = Singleton("second")  # Won't reinitialize

print(f"s1.value = {s1.value}")  # first
print(f"s2.value = {s2.value}")  # first
print(f"s1 is s2: {s1 is s2}")   # True
```

#### Method 3: Using Metaclass

```python
class SingletonMeta(type):
    """Singleton metaclass"""
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class DatabaseConnection(metaclass=SingletonMeta):
    """Database connection singleton"""

    def __init__(self, host: str = "localhost", port: int = 5432):
        self.host = host
        self.port = port
        self.connected = False
        print(f"Creating database connection: {host}:{port}")

    def connect(self):
        self.connected = True
        print("Connected to database")

    def disconnect(self):
        self.connected = False
        print("Disconnected from database")

# Test
db1 = DatabaseConnection("localhost", 5432)
db2 = DatabaseConnection("remotehost", 3306)  # Arguments ignored

print(f"db1 is db2: {db1 is db2}")  # True
print(f"host: {db2.host}")  # localhost
```

#### Method 4: Using Decorator

```python
def singleton(cls):
    """Singleton decorator"""
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class Logger:
    """Logger singleton"""

    def __init__(self, name: str = "default"):
        self.name = name
        self.logs = []
        print(f"Initializing logger: {name}")

    def log(self, message: str):
        import datetime
        entry = f"[{datetime.datetime.now()}] {message}"
        self.logs.append(entry)
        print(entry)

# Test
logger1 = Logger("app")
logger2 = Logger("system")  # Still returns first instance

logger1.log("First log")
logger2.log("Second log")

print(f"logger1 is logger2: {logger1 is logger2}")  # True
print(f"Log count: {len(logger1.logs)}")  # 2
```

#### Thread-Safe Singleton

```python
import threading

class ThreadSafeSingleton:
    """Thread-safe singleton"""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        # Double-checked locking pattern
        if cls._instance is None:
            with cls._lock:
                # Check again to prevent other threads from creating
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
            print(f"Thread {threading.current_thread().name}: Initializing singleton")

# Test thread safety
def create_singleton(value):
    s = ThreadSafeSingleton(value)
    print(f"Thread {threading.current_thread().name}: Got singleton, value={s.value}")

threads = []
for i in range(5):
    t = threading.Thread(target=create_singleton, args=(i,))
    threads.append(t)

for t in threads:
    t.start()

for t in threads:
    t.join()
```

### Factory Pattern

The Factory pattern provides an interface for creating objects, separating object creation from usage.

#### Simple Factory Pattern

```python
from abc import ABC, abstractmethod
from typing import Dict, Type

class Animal(ABC):
    """Animal abstract base class"""

    @abstractmethod
    def speak(self) -> str:
        pass

    @abstractmethod
    def move(self) -> str:
        pass

class Dog(Animal):
    def speak(self) -> str:
        return "Woof!"

    def move(self) -> str:
        return "Dog is running"

class Cat(Animal):
    def speak(self) -> str:
        return "Meow!"

    def move(self) -> str:
        return "Cat is walking"

class Bird(Animal):
    def speak(self) -> str:
        return "Tweet!"

    def move(self) -> str:
        return "Bird is flying"

class AnimalFactory:
    """Simple animal factory"""

    _animals: Dict[str, Type[Animal]] = {
        "dog": Dog,
        "cat": Cat,
        "bird": Bird,
    }

    @classmethod
    def create(cls, animal_type: str) -> Animal:
        """Create animal instance"""
        animal_class = cls._animals.get(animal_type.lower())
        if animal_class is None:
            raise ValueError(f"Unknown animal type: {animal_type}")
        return animal_class()

    @classmethod
    def register(cls, animal_type: str, animal_class: Type[Animal]):
        """Register new animal type"""
        cls._animals[animal_type.lower()] = animal_class

# Using the factory
dog = AnimalFactory.create("dog")
print(dog.speak())  # Woof!

cat = AnimalFactory.create("cat")
print(cat.speak())  # Meow!

# Extending the factory
class Fish(Animal):
    def speak(self) -> str:
        return "...(Fish don't speak)"

    def move(self) -> str:
        return "Fish is swimming"

AnimalFactory.register("fish", Fish)
fish = AnimalFactory.create("fish")
print(fish.move())  # Fish is swimming
```

#### Factory Method Pattern

```python
from abc import ABC, abstractmethod

class Document(ABC):
    """Document abstract base class"""

    @abstractmethod
    def create(self) -> str:
        pass

    @abstractmethod
    def save(self, filename: str) -> str:
        pass

class PDFDocument(Document):
    def create(self) -> str:
        return "Creating PDF document"

    def save(self, filename: str) -> str:
        return f"Saving as {filename}.pdf"

class WordDocument(Document):
    def create(self) -> str:
        return "Creating Word document"

    def save(self, filename: str) -> str:
        return f"Saving as {filename}.docx"

class ExcelDocument(Document):
    def create(self) -> str:
        return "Creating Excel document"

    def save(self, filename: str) -> str:
        return f"Saving as {filename}.xlsx"

class DocumentCreator(ABC):
    """Document creator abstract class (Factory Method pattern)"""

    @abstractmethod
    def create_document(self) -> Document:
        """Factory method"""
        pass

    def new_document(self) -> str:
        """Use factory method to create and operate on document"""
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

# Using factory method
pdf_creator = PDFCreator()
print(pdf_creator.new_document())  # Creating PDF document

word_creator = WordCreator()
doc = word_creator.create_document()
print(doc.save("report"))  # Saving as report.docx
```

#### Abstract Factory Pattern

```python
from abc import ABC, abstractmethod

# Abstract products
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

# Windows style products
class WindowsButton(Button):
    def render(self) -> str:
        return "[Windows Button]"

class WindowsTextBox(TextBox):
    def render(self) -> str:
        return "[Windows TextBox]"

class WindowsCheckBox(CheckBox):
    def render(self) -> str:
        return "[Windows CheckBox]"

# macOS style products
class MacButton(Button):
    def render(self) -> str:
        return "(Mac Button)"

class MacTextBox(TextBox):
    def render(self) -> str:
        return "(Mac TextBox)"

class MacCheckBox(CheckBox):
    def render(self) -> str:
        return "(Mac CheckBox)"

# Abstract factory
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

# Concrete factories
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

# Client code
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
        Interface:
        - {self.button.render()}
        - {self.textbox.render()}
        - {self.checkbox.render()}
        """

# Select factory based on OS
import platform

def get_factory() -> GUIFactory:
    os_name = platform.system()
    if os_name == "Windows":
        return WindowsFactory()
    elif os_name == "Darwin":  # macOS
        return MacFactory()
    else:
        return WindowsFactory()  # Default

# Usage
factory = MacFactory()  # Or get_factory()
app = Application(factory)
app.create_ui()
print(app.render())
```

### Observer Pattern

The Observer pattern defines a one-to-many dependency between objects where when one object changes state, all its dependents are notified.

#### Classic Implementation

```python
from abc import ABC, abstractmethod
from typing import List

class Observer(ABC):
    """Observer abstract base class"""

    @abstractmethod
    def update(self, subject: 'Subject') -> None:
        pass

class Subject(ABC):
    """Subject abstract base class"""

    def __init__(self):
        self._observers: List[Observer] = []

    def attach(self, observer: Observer) -> None:
        """Add observer"""
        if observer not in self._observers:
            self._observers.append(observer)
            print(f"Added observer: {observer.__class__.__name__}")

    def detach(self, observer: Observer) -> None:
        """Remove observer"""
        if observer in self._observers:
            self._observers.remove(observer)
            print(f"Removed observer: {observer.__class__.__name__}")

    def notify(self) -> None:
        """Notify all observers"""
        print(f"Notifying {len(self._observers)} observers...")
        for observer in self._observers:
            observer.update(self)

# Concrete subject: Stock price
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
            print(f"\n{self._symbol} price changed: {old_price:.2f} -> {value:.2f}")
            self.notify()

# Concrete observers
class Investor(Observer):
    def __init__(self, name: str):
        self.name = name

    def update(self, subject: Subject) -> None:
        if isinstance(subject, Stock):
            print(f"  Investor {self.name} notified: "
                  f"{subject.symbol} current price {subject.price:.2f}")

class StockAlert(Observer):
    def __init__(self, threshold: float):
        self.threshold = threshold

    def update(self, subject: Subject) -> None:
        if isinstance(subject, Stock):
            if subject.price > self.threshold:
                print(f"  Alert! {subject.symbol} price {subject.price:.2f} "
                      f"exceeds threshold {self.threshold:.2f}")

class TradingBot(Observer):
    def __init__(self, buy_threshold: float, sell_threshold: float):
        self.buy_threshold = buy_threshold
        self.sell_threshold = sell_threshold

    def update(self, subject: Subject) -> None:
        if isinstance(subject, Stock):
            if subject.price < self.buy_threshold:
                print(f"  Trading bot: Buy {subject.symbol} @ {subject.price:.2f}")
            elif subject.price > self.sell_threshold:
                print(f"  Trading bot: Sell {subject.symbol} @ {subject.price:.2f}")

# Usage
stock = Stock("AAPL", 150.0)

investor1 = Investor("Alice")
investor2 = Investor("Bob")
alert = StockAlert(180.0)
bot = TradingBot(140.0, 175.0)

stock.attach(investor1)
stock.attach(investor2)
stock.attach(alert)
stock.attach(bot)

# Simulate price changes
stock.price = 155.0
stock.price = 185.0  # Triggers alert and sell
stock.price = 135.0  # Triggers buy

# Remove an observer
stock.detach(investor1)
stock.price = 160.0
```

#### Pythonic Implementation: Using Callbacks

```python
from typing import Callable, Dict, List, Any

class EventEmitter:
    """Event-based observer pattern implementation"""

    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}

    def on(self, event: str, callback: Callable) -> 'EventEmitter':
        """Register event listener"""
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)
        return self  # Support chaining

    def off(self, event: str, callback: Callable = None) -> 'EventEmitter':
        """Remove event listener"""
        if event in self._listeners:
            if callback is None:
                del self._listeners[event]
            else:
                self._listeners[event].remove(callback)
        return self

    def emit(self, event: str, *args, **kwargs) -> None:
        """Emit event"""
        if event in self._listeners:
            for callback in self._listeners[event]:
                callback(*args, **kwargs)

    def once(self, event: str, callback: Callable) -> 'EventEmitter':
        """Register one-time listener"""
        def wrapper(*args, **kwargs):
            callback(*args, **kwargs)
            self.off(event, wrapper)
        return self.on(event, wrapper)

# Usage example
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

# Create service
user_service = UserService()

# Register listeners
user_service.on("user_created",
    lambda user: print(f"New user registered: {user['name']}"))

user_service.on("user_created",
    lambda user: print(f"Sending welcome email to: {user['name']}"))

user_service.on("user_deleted",
    lambda user: print(f"User deleted: {user['name']}"))

# One-time listener
user_service.once("user_created",
    lambda user: print(f"First registration bonus sent to: {user['name']}"))

# Test
user_service.create_user("001", "Alice")
print("---")
user_service.create_user("002", "Bob")  # No more first-time bonus
print("---")
user_service.delete_user("001")
```

#### Reactive Implementation Using Python Properties

```python
from typing import Callable, List, TypeVar, Generic

T = TypeVar('T')

class Observable(Generic[T]):
    """Reactive observable value"""

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
        """Subscribe to changes, returns unsubscribe function"""
        self._observers.append(callback)

        def unsubscribe():
            self._observers.remove(callback)

        return unsubscribe

    def _notify(self, old_value: T, new_value: T) -> None:
        for callback in self._observers:
            callback(old_value, new_value)

# Usage
temperature = Observable(20.0)

# Subscribe to temperature changes
unsubscribe1 = temperature.subscribe(
    lambda old, new: print(f"Temperature changed from {old}C to {new}C")
)

unsubscribe2 = temperature.subscribe(
    lambda old, new: print(f"Temperature difference: {new - old:+.1f}C") if new > old else None
)

temperature.value = 22.5
temperature.value = 18.0

# Unsubscribe first subscription
unsubscribe1()

temperature.value = 25.0  # Only second subscriber receives notification
```

### Strategy Pattern

The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable.

#### Classic Implementation

```python
from abc import ABC, abstractmethod
from typing import List

class PaymentStrategy(ABC):
    """Payment strategy abstract base class"""

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
            return "Credit card validation failed"
        return f"Paid {amount:.2f} with credit card ****{self.card_number[-4:]}"

    def validate(self) -> bool:
        # Simplified validation
        return len(self.card_number) == 16 and len(self.cvv) == 3

class PayPalPayment(PaymentStrategy):
    def __init__(self, account: str):
        self.account = account

    def pay(self, amount: float) -> str:
        if not self.validate():
            return "PayPal account validation failed"
        return f"Paid {amount:.2f} with PayPal {self.account}"

    def validate(self) -> bool:
        return "@" in self.account or self.account.isdigit()

class ApplePayPayment(PaymentStrategy):
    def __init__(self, device_id: str):
        self.device_id = device_id

    def pay(self, amount: float) -> str:
        if not self.validate():
            return "Apple Pay validation failed"
        return f"Paid {amount:.2f} with Apple Pay (Device: {self.device_id[:8]}...)"

    def validate(self) -> bool:
        return len(self.device_id) > 0

class ShoppingCart:
    """Shopping cart (context)"""

    def __init__(self):
        self.items: List[tuple] = []  # (product name, price)
        self._payment_strategy: PaymentStrategy = None

    def add_item(self, name: str, price: float) -> None:
        self.items.append((name, price))

    def get_total(self) -> float:
        return sum(price for _, price in self.items)

    def set_payment_strategy(self, strategy: PaymentStrategy) -> None:
        self._payment_strategy = strategy

    def checkout(self) -> str:
        if not self._payment_strategy:
            return "Please select a payment method"
        if not self.items:
            return "Cart is empty"

        total = self.get_total()
        return self._payment_strategy.pay(total)

# Usage
cart = ShoppingCart()
cart.add_item("Python Programming", 89.0)
cart.add_item("Design Patterns", 59.0)

print(f"Total: {cart.get_total():.2f}")

# Pay with credit card
cart.set_payment_strategy(CreditCardPayment("1234567890123456", "123", "12/25"))
print(cart.checkout())

# Switch to PayPal
cart.set_payment_strategy(PayPalPayment("user@example.com"))
print(cart.checkout())

# Switch to Apple Pay
cart.set_payment_strategy(ApplePayPayment("device_id_abc123def456"))
print(cart.checkout())
```

#### Pythonic Implementation: Using First-Class Functions

```python
from typing import Callable, List
from dataclasses import dataclass

# Strategies are just functions
def bubble_sort(data: List[int]) -> List[int]:
    """Bubble sort"""
    arr = data.copy()
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(data: List[int]) -> List[int]:
    """Quick sort"""
    if len(data) <= 1:
        return data.copy()
    pivot = data[len(data) // 2]
    left = [x for x in data if x < pivot]
    middle = [x for x in data if x == pivot]
    right = [x for x in data if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

def merge_sort(data: List[int]) -> List[int]:
    """Merge sort"""
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

# Context class
class Sorter:
    def __init__(self, strategy: Callable[[List[int]], List[int]] = None):
        self.strategy = strategy or sorted  # Default to built-in sort

    def sort(self, data: List[int]) -> List[int]:
        return self.strategy(data)

# Usage
data = [64, 34, 25, 12, 22, 11, 90]

sorter = Sorter(bubble_sort)
print(f"Bubble sort: {sorter.sort(data)}")

sorter.strategy = quick_sort
print(f"Quick sort: {sorter.sort(data)}")

sorter.strategy = merge_sort
print(f"Merge sort: {sorter.sort(data)}")

# Can even use lambda
sorter.strategy = lambda x: sorted(x, reverse=True)
print(f"Descending sort: {sorter.sort(data)}")
```

#### Using Dictionary Mapping Strategies

```python
from typing import Dict, Callable

class PriceCalculator:
    """Price calculator using strategy pattern for different discounts"""

    # Strategy dictionary
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
        """Register new discount strategy"""
        cls._discount_strategies[name] = strategy

    @classmethod
    def calculate(cls, price: float, discount_type: str = "none") -> float:
        """Calculate final price"""
        strategy = cls._discount_strategies.get(discount_type)
        if strategy is None:
            raise ValueError(f"Unknown discount type: {discount_type}")
        return strategy(price)

# Usage
original_price = 100.0

print(f"Original price: {original_price}")
print(f"Member price: {PriceCalculator.calculate(original_price, 'member')}")
print(f"VIP price: {PriceCalculator.calculate(original_price, 'vip')}")

# Dynamically add new strategy
PriceCalculator.register_discount(
    "holiday_sale",
    lambda price: price * 0.6 if price > 50 else price * 0.8
)

print(f"Holiday sale price: {PriceCalculator.calculate(original_price, 'holiday_sale')}")
```

### Decorator Pattern

The Decorator pattern dynamically attaches responsibilities to objects, providing a more flexible alternative to subclassing for extending functionality.

#### Classic Object-Oriented Implementation

```python
from abc import ABC, abstractmethod

class Coffee(ABC):
    """Coffee abstract base class"""

    @abstractmethod
    def cost(self) -> float:
        pass

    @abstractmethod
    def description(self) -> str:
        pass

class SimpleCoffee(Coffee):
    """Simple coffee"""

    def cost(self) -> float:
        return 2.0

    def description(self) -> str:
        return "Simple coffee"

class Espresso(Coffee):
    """Espresso"""

    def cost(self) -> float:
        return 3.0

    def description(self) -> str:
        return "Espresso"

class CoffeeDecorator(Coffee):
    """Coffee decorator base class"""

    def __init__(self, coffee: Coffee):
        self._coffee = coffee

    def cost(self) -> float:
        return self._coffee.cost()

    def description(self) -> str:
        return self._coffee.description()

class MilkDecorator(CoffeeDecorator):
    """Add milk"""

    def cost(self) -> float:
        return self._coffee.cost() + 0.5

    def description(self) -> str:
        return self._coffee.description() + " + milk"

class SugarDecorator(CoffeeDecorator):
    """Add sugar"""

    def cost(self) -> float:
        return self._coffee.cost() + 0.2

    def description(self) -> str:
        return self._coffee.description() + " + sugar"

class WhippedCreamDecorator(CoffeeDecorator):
    """Add whipped cream"""

    def cost(self) -> float:
        return self._coffee.cost() + 0.7

    def description(self) -> str:
        return self._coffee.description() + " + whipped cream"

class VanillaDecorator(CoffeeDecorator):
    """Add vanilla"""

    def cost(self) -> float:
        return self._coffee.cost() + 0.6

    def description(self) -> str:
        return self._coffee.description() + " + vanilla"

# Usage
coffee = SimpleCoffee()
print(f"{coffee.description()}: ${coffee.cost()}")

# Add milk
coffee_with_milk = MilkDecorator(coffee)
print(f"{coffee_with_milk.description()}: ${coffee_with_milk.cost()}")

# Add milk and sugar
coffee_with_milk_sugar = SugarDecorator(MilkDecorator(coffee))
print(f"{coffee_with_milk_sugar.description()}: ${coffee_with_milk_sugar.cost()}")

# Luxury version
luxury_coffee = VanillaDecorator(
    WhippedCreamDecorator(
        SugarDecorator(
            MilkDecorator(Espresso())
        )
    )
)
print(f"{luxury_coffee.description()}: ${luxury_coffee.cost()}")
```

#### Python Function Decorators

```python
from functools import wraps
import time
from typing import Callable, Any

def timer(func: Callable) -> Callable:
    """Timer decorator"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} execution time: {end - start:.4f} seconds")
        return result
    return wrapper

def logger(func: Callable) -> Callable:
    """Logger decorator"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        print(f"Calling {func.__name__}")
        print(f"  Arguments: args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        print(f"  Return: {result}")
        return result
    return wrapper

def retry(max_attempts: int = 3, delay: float = 1.0):
    """Retry decorator"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    print(f"Attempt {attempt}/{max_attempts} failed: {e}")
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator

def cache(func: Callable) -> Callable:
    """Cache decorator"""
    cached = {}

    @wraps(func)
    def wrapper(*args) -> Any:
        if args not in cached:
            cached[args] = func(*args)
        else:
            print(f"Returning from cache: {args}")
        return cached[args]

    wrapper.cache_clear = lambda: cached.clear()
    return wrapper

def validate_types(**expected_types):
    """Type validation decorator"""
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
                            f"Parameter '{param_name}' should be {expected_type.__name__}, "
                            f"not {type(value).__name__}"
                        )
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Combining multiple decorators
@timer
@logger
@cache
def fibonacci(n: int) -> int:
    """Calculate Fibonacci number"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Usage
print(f"fibonacci(10) = {fibonacci(10)}")
print()
print(f"fibonacci(10) = {fibonacci(10)}")  # Returns from cache

@retry(max_attempts=3, delay=0.5)
@validate_types(x=int, y=int)
def divide(x: int, y: int) -> float:
    """Division operation"""
    return x / y

try:
    print(divide(10, 2))
    print(divide(10, 0))  # Will retry
except ZeroDivisionError:
    print("All retry attempts failed")
```

#### Class Decorators

```python
from functools import wraps

class CountCalls:
    """Decorator class that counts function calls"""

    def __init__(self, func):
        wraps(func)(self)
        self.func = func
        self.num_calls = 0

    def __call__(self, *args, **kwargs):
        self.num_calls += 1
        print(f"{self.func.__name__} has been called {self.num_calls} times")
        return self.func(*args, **kwargs)

class Singleton:
    """Singleton decorator class"""

    def __init__(self, cls):
        self._cls = cls
        self._instance = None

    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = self._cls(*args, **kwargs)
        return self._instance

class Deprecated:
    """Decorator class to mark function as deprecated"""

    def __init__(self, reason: str = ""):
        self.reason = reason

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import warnings
            message = f"{func.__name__} is deprecated"
            if self.reason:
                message += f": {self.reason}"
            warnings.warn(message, DeprecationWarning, stacklevel=2)
            return func(*args, **kwargs)
        return wrapper

# Usage
@CountCalls
def greet(name: str) -> str:
    return f"Hello, {name}!"

greet("Alice")
greet("Bob")
greet("Charlie")
print(f"Total calls: {greet.num_calls}")

@Singleton
class DatabaseConnection:
    def __init__(self, host: str):
        self.host = host
        print(f"Creating connection to {host}")

db1 = DatabaseConnection("localhost")
db2 = DatabaseConnection("remotehost")  # Returns same instance
print(f"db1 is db2: {db1 is db2}")

@Deprecated("Please use new_function instead")
def old_function():
    return "Old functionality"

import warnings
with warnings.catch_warnings(record=True):
    warnings.simplefilter("always")
    old_function()
```

## Best Practices

### Choosing the Right Pattern

```python
# Problem: Need to ensure only one global configuration instance
# Solution: Singleton pattern

# Most Pythonic way: Module-level singleton
# config.py
class _Config:
    def __init__(self):
        self.debug = False
        self.database_url = ""

config = _Config()

# Instead of complex singleton class
```

### Keep It Simple

```python
# Bad: Over-engineering
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

# Good: Python way
def do_something():
    return "do something"

def run_strategy(strategy):
    return strategy()

result = run_strategy(do_something)
```

### Composition Over Inheritance

```python
# Bad: Deep inheritance
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

# Good: Use composition
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
    print(f"{animal.name} barks")

def guard(animal):
    print(f"{animal.name} is guarding")

dog = Animal("Rex")
dog.add_behavior(bark)
dog.add_behavior(guard)
dog.perform_behaviors()
```

### Leverage Python Features

```python
# Use __call__ to make objects callable
class Multiplier:
    def __init__(self, factor: int):
        self.factor = factor

    def __call__(self, value: int) -> int:
        return value * self.factor

double = Multiplier(2)
triple = Multiplier(3)

print(double(5))  # 10
print(triple(5))  # 15

# Use property instead of getter/setter
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float):
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

    @property
    def area(self) -> float:
        import math
        return math.pi * self._radius ** 2
```

### Documentation and Type Hints

```python
from typing import Protocol, List, TypeVar

T = TypeVar('T')

class Sortable(Protocol):
    """Protocol for sortable objects"""
    def __lt__(self, other: 'Sortable') -> bool: ...

def sort_items(items: List[Sortable]) -> List[Sortable]:
    """
    Sort a list of objects implementing the Sortable protocol.

    Args:
        items: List of objects to sort

    Returns:
        New sorted list

    Example:
        >>> sort_items([3, 1, 2])
        [1, 2, 3]
    """
    return sorted(items)
```

## Common Pitfalls

### Thread Safety Issues with Singleton

```python
# Bad: Not thread-safe
class BadSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            # Multiple threads may enter here simultaneously
            cls._instance = super().__new__(cls)
        return cls._instance

# Good: Use lock
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # Double check
                    cls._instance = super().__new__(cls)
        return cls._instance
```

### Decorators Breaking Function Signatures

```python
from functools import wraps

# Bad: Loses function metadata
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def greet(name: str) -> str:
    """Say hello to someone"""
    return f"Hello, {name}!"

print(greet.__name__)  # wrapper (wrong)
print(greet.__doc__)   # None (wrong)

# Good: Use functools.wraps
def good_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@good_decorator
def greet2(name: str) -> str:
    """Say hello to someone"""
    return f"Hello, {name}!"

print(greet2.__name__)  # greet2 (correct)
print(greet2.__doc__)   # Say hello to someone (correct)
```

### Memory Leaks in Observer Pattern

```python
import weakref
from typing import List

# Bad: Strong references cause memory leaks
class BadSubject:
    def __init__(self):
        self._observers = []  # Strong reference

    def attach(self, observer):
        self._observers.append(observer)

    # Even if observer is deleted, reference is still held here

# Good: Use weak references
class GoodSubject:
    def __init__(self):
        self._observers: List[weakref.ref] = []

    def attach(self, observer):
        self._observers.append(weakref.ref(observer))

    def notify(self):
        # Clean up collected observers
        self._observers = [ref for ref in self._observers if ref() is not None]

        for observer_ref in self._observers:
            observer = observer_ref()
            if observer is not None:
                observer.update(self)
```

### Overuse of Factory Pattern

```python
# Bad: Factory for simple objects
class PointFactory:
    @staticmethod
    def create(x, y):
        return Point(x, y)

point = PointFactory.create(1, 2)

# Good: Direct creation
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

point = Point(1, 2)

# Factory pattern is appropriate for complex objects or when polymorphism is needed
```

### State Management in Strategy Pattern

```python
# Bad: Strategy contains state
class BadStrategy:
    def __init__(self):
        self.counter = 0  # Strategies shouldn't have state

    def execute(self):
        self.counter += 1
        return self.counter

# Good: Strategies are stateless
class GoodStrategy:
    def execute(self, data):
        return process(data)

# State should be managed in context
class Context:
    def __init__(self, strategy):
        self.strategy = strategy
        self.state = {}  # State here

    def execute(self):
        return self.strategy.execute(self.state)
```

## Performance Considerations

### Singleton Performance

```python
import time

# Compare performance of different singleton implementations
def benchmark(name: str, create_func, iterations: int = 100000):
    start = time.time()
    for _ in range(iterations):
        create_func()
    end = time.time()
    print(f"{name}: {end - start:.4f} seconds")

# Module-level singleton (fastest)
class ModuleSingleton:
    pass

_module_singleton = ModuleSingleton()

def get_module_singleton():
    return _module_singleton

# __new__ implementation
class NewSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Metaclass implementation
class SingletonMeta(type):
    _instances = {}

    def __call__(cls):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__()
        return cls._instances[cls]

class MetaSingleton(metaclass=SingletonMeta):
    pass

# Benchmark
benchmark("Module singleton", get_module_singleton)
benchmark("__new__ singleton", NewSingleton)
benchmark("Metaclass singleton", MetaSingleton)
```

### Decorator Overhead

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

    print(f"Without decorator: {bare_time:.4f} seconds")
    print(f"With decorator: {decorated_time:.4f} seconds")
    print(f"Overhead: {((decorated_time - bare_time) / bare_time) * 100:.2f}%")

measure_overhead()

# Performance advantage of cache decorator
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
print(f"Without cache: {time.time() - start:.4f} seconds")

start = time.time()
fibonacci_with_cache(n)
print(f"With cache: {time.time() - start:.6f} seconds")
```

### Observer Pattern Notification Efficiency

```python
from typing import List, Set, Callable
import time

class SlowSubject:
    """Using list to store observers"""

    def __init__(self):
        self._observers: List[Callable] = []

    def attach(self, observer):
        self._observers.append(observer)

    def detach(self, observer):
        self._observers.remove(observer)  # O(n) operation

    def notify(self):
        for observer in self._observers:
            observer()

class FastSubject:
    """Using set to store observers"""

    def __init__(self):
        self._observers: Set[Callable] = set()

    def attach(self, observer):
        self._observers.add(observer)

    def detach(self, observer):
        self._observers.discard(observer)  # O(1) operation

    def notify(self):
        for observer in self._observers:
            observer()

# If frequently adding/removing observers, set is more efficient
```

## Practical Scenarios

### Scenario 1: Web Framework Routing System (Decorator Pattern)

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
        # Convert path to regex
        pattern = self.path
        pattern = re.sub(r'<(\w+)>', r'(?P<\1>[^/]+)', pattern)
        self.pattern = re.compile(f'^{pattern}$')

class Router:
    """Simple web router"""

    def __init__(self):
        self.routes: Dict[str, list] = {
            'GET': [],
            'POST': [],
            'PUT': [],
            'DELETE': [],
        }

    def route(self, path: str, methods: list = None):
        """Route decorator"""
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
        """Match route"""
        for route in self.routes.get(method, []):
            match = route.pattern.match(path)
            if match:
                return route.handler, match.groupdict()
        return None, {}

    def dispatch(self, path: str, method: str = 'GET', **kwargs) -> Any:
        """Dispatch request"""
        handler, path_params = self.match(path, method)
        if handler is None:
            return f"404 Not Found: {path}"
        return handler(**path_params, **kwargs)

# Usage
app = Router()

@app.get('/')
def index():
    return "Welcome to homepage"

@app.get('/users')
def list_users():
    return "User list"

@app.get('/users/<user_id>')
def get_user(user_id: str):
    return f"User details: {user_id}"

@app.post('/users')
def create_user():
    return "User created successfully"

@app.route('/articles/<article_id>/comments/<comment_id>', methods=['GET', 'DELETE'])
def handle_comment(article_id: str, comment_id: str):
    return f"Comment {comment_id} of article {article_id}"

# Test
print(app.dispatch('/'))
print(app.dispatch('/users'))
print(app.dispatch('/users/123'))
print(app.dispatch('/users', 'POST'))
print(app.dispatch('/articles/1/comments/2'))
```

### Scenario 2: Game Character State Machine (State + Strategy Pattern)

```python
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass

class CharacterState(ABC):
    """Character state abstract base class"""

    @abstractmethod
    def enter(self, character: 'Character') -> None:
        """Enter state"""
        pass

    @abstractmethod
    def update(self, character: 'Character') -> None:
        """Update state"""
        pass

    @abstractmethod
    def exit(self, character: 'Character') -> None:
        """Exit state"""
        pass

    @abstractmethod
    def handle_input(self, character: 'Character', input_key: str) -> Optional['CharacterState']:
        """Handle input, return new state or None"""
        pass

class IdleState(CharacterState):
    def enter(self, character: 'Character') -> None:
        print(f"{character.name} enters idle state")
        character.animation = "idle"

    def update(self, character: 'Character') -> None:
        # Recover energy
        character.energy = min(100, character.energy + 1)

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} leaves idle state")

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
        print(f"{character.name} starts walking")
        character.animation = "walk"

    def update(self, character: 'Character') -> None:
        character.position += character.speed
        character.energy -= 0.1

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} stops walking")

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
        print(f"{character.name} starts running")
        character.animation = "run"

    def update(self, character: 'Character') -> None:
        character.position += character.speed * 2
        character.energy -= 0.5

        # Auto stop when energy depleted
        if character.energy <= 0:
            character.change_state(WalkingState())

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} stops running")

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
        print(f"{character.name} launches attack!")
        character.animation = "attack"
        self.current_frame = 0

    def update(self, character: 'Character') -> None:
        self.current_frame += 1
        if self.current_frame >= self.attack_duration:
            character.change_state(IdleState())

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} attack ends")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        # Don't respond to other inputs during attack
        return None

class JumpingState(CharacterState):
    def __init__(self):
        self.jump_frames = 0
        self.max_jump_frames = 5

    def enter(self, character: 'Character') -> None:
        print(f"{character.name} jumps!")
        character.animation = "jump"
        self.jump_frames = 0

    def update(self, character: 'Character') -> None:
        self.jump_frames += 1
        if self.jump_frames >= self.max_jump_frames:
            character.change_state(IdleState())

    def exit(self, character: 'Character') -> None:
        print(f"{character.name} lands")

    def handle_input(self, character: 'Character', input_key: str) -> Optional[CharacterState]:
        if input_key == 'attack':
            # Air attack
            print(f"{character.name} air attack!")
            return AttackingState()
        return None

@dataclass
class Character:
    """Game character"""
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
        return (f"{self.name}: position={self.position:.1f}, "
                f"energy={self.energy:.1f}, animation={self.animation}")

# Simulate game loop
hero = Character("Hero")

actions = ['move', 'update', 'update', 'run', 'update', 'update',
           'attack', 'update', 'update', 'update', 'update']

for action in actions:
    if action == 'update':
        hero.update()
    else:
        hero.handle_input(action)
    print(f"  -> {hero.status()}")
```

### Scenario 3: Data Processing Pipeline (Chain of Responsibility + Decorator Pattern)

```python
from abc import ABC, abstractmethod
from typing import Any, Optional, List, Callable
from dataclasses import dataclass
import json

class DataProcessor(ABC):
    """Data processor abstract base class (Chain of Responsibility)"""

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
    """Validation processor"""

    def __init__(self, validators: List[Callable[[Any], bool]]):
        super().__init__()
        self.validators = validators

    def process(self, data: Any) -> Any:
        for validator in self.validators:
            if not validator(data):
                print(f"Validation failed: {validator.__name__}")
                return None
        print("Validation passed")
        return data

class TransformProcessor(DataProcessor):
    """Transform processor"""

    def __init__(self, transform: Callable[[Any], Any]):
        super().__init__()
        self.transform = transform

    def process(self, data: Any) -> Any:
        result = self.transform(data)
        print(f"Transform complete: {type(data).__name__} -> {type(result).__name__}")
        return result

class FilterProcessor(DataProcessor):
    """Filter processor"""

    def __init__(self, condition: Callable[[Any], bool]):
        super().__init__()
        self.condition = condition

    def process(self, data: Any) -> Any:
        if isinstance(data, (list, tuple)):
            result = [item for item in data if self.condition(item)]
            print(f"Filter: {len(data)} -> {len(result)} records")
            return result
        return data if self.condition(data) else None

class EnrichProcessor(DataProcessor):
    """Data enrichment processor"""

    def __init__(self, enricher: Callable[[Any], Any]):
        super().__init__()
        self.enricher = enricher

    def process(self, data: Any) -> Any:
        result = self.enricher(data)
        print("Data enrichment complete")
        return result

class OutputProcessor(DataProcessor):
    """Output processor"""

    def __init__(self, output_format: str = "json"):
        super().__init__()
        self.output_format = output_format

    def process(self, data: Any) -> Any:
        if self.output_format == "json":
            result = json.dumps(data, ensure_ascii=False, indent=2)
        else:
            result = str(data)
        print(f"Output format: {self.output_format}")
        return result

# Pipeline builder
class PipelineBuilder:
    """Pipeline builder (Builder pattern)"""

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
            raise ValueError("Pipeline needs at least one processor")

        for i in range(len(self._processors) - 1):
            self._processors[i].set_next(self._processors[i + 1])

        return self._processors[0]

# Usage example
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

# Build pipeline
pipeline = (PipelineBuilder()
    .add_validation(is_not_empty)
    .add_transform(parse_json)
    .add_validation(is_list)
    .add_filter(has_valid_age)
    .add_enrich(add_full_name)
    .add_output("json")
    .build())

# Test data
test_data = '''[
    {"first_name": "Alice", "last_name": "Smith", "age": 25},
    {"first_name": "Bob", "last_name": "Jones", "age": 200},
    {"first_name": "Charlie", "last_name": "Brown", "age": 30}
]'''

print("=" * 50)
print("Processing started")
print("=" * 50)
result = pipeline.handle(test_data)
print("=" * 50)
print("Processing result:")
print(result)
```

## Interview Key Points

### Common Interview Questions

**1. What are design patterns? Why use them?**

Design patterns are reusable solutions to recurring problems in software design. Benefits include:
- Provide proven solutions
- Promote code reuse
- Establish common design vocabulary
- Improve code maintainability and extensibility

**2. What are the different ways to implement Singleton? What are their pros and cons?**

```python
# Module-level singleton (most Pythonic)
# Pros: Simple, thread-safe
# Cons: Not explicit

# __new__ method
# Pros: Clear OOP implementation
# Cons: Not thread-safe (needs locking)

# Metaclass
# Pros: Enforces singleton, inheritable
# Cons: High complexity

# Decorator
# Pros: Flexible, reusable
# Cons: Changes class type
```

**3. What's the difference between Factory Method and Abstract Factory patterns?**

- **Factory Method Pattern**: Defines an interface for creating a single object, letting subclasses decide which class to instantiate
- **Abstract Factory Pattern**: Provides an interface for creating families of related objects without specifying concrete classes

**4. What's the difference between Observer pattern and Publish-Subscribe pattern?**

- **Observer Pattern**: Observers directly subscribe to subject, subject maintains observer list
- **Publish-Subscribe Pattern**: Publishers and subscribers communicate through message broker, don't know each other directly

**5. What's the difference between Strategy pattern and State pattern?**

- **Strategy Pattern**: Client chooses which strategy to use, strategies are independent of each other
- **State Pattern**: States decide which state to transition to, states have dependencies

**6. How to elegantly implement design patterns in Python?**

```python
# Use first-class functions for Strategy pattern
strategies = {
    'add': lambda x, y: x + y,
    'sub': lambda x, y: x - y,
}

# Use decorators for Decorator pattern
@timer
@cache
def compute(): pass

# Use modules for Singleton pattern
# config.py
config = Config()

# Use __call__ to make objects callable
class Multiplier:
    def __call__(self, x): return x * 2
```

### Code Challenge Example

```python
# Problem: Implement a text editor with undo support (Command pattern)

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

# Test
editor = TextEditor()
manager = CommandManager()

manager.execute(InsertCommand(editor, "Hello", 0))
print(f"After insert: '{editor.text}'")

manager.execute(InsertCommand(editor, " World", 5))
print(f"After insert: '{editor.text}'")

manager.undo()
print(f"After undo: '{editor.text}'")

manager.redo()
print(f"After redo: '{editor.text}'")
```

## Further Reading

### Official Documentation
- [Python Official Documentation - Classes](https://docs.python.org/3/tutorial/classes.html)
- [Python Official Documentation - Abstract Base Classes](https://docs.python.org/3/library/abc.html)
- [Python Official Documentation - functools](https://docs.python.org/3/library/functools.html)

### Classic Books
- "Design Patterns: Elements of Reusable Object-Oriented Software" - GoF
- "Head First Design Patterns" - Eric Freeman
- "Python Design Patterns" - Chetan Giridhar
- "Fluent Python" - Luciano Ramalho (2nd Edition)

### Online Resources
- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Python Patterns](https://python-patterns.guide/)
- [Real Python - Python Design Patterns](https://realpython.com/tutorials/best-practices/)

### Related Topics
- SOLID Principles
- Functional Programming Patterns
- Concurrency Design Patterns
- Architectural Patterns (MVC, MVVM, Microservices)
