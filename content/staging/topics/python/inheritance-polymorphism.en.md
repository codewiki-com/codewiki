---
title: Python Inheritance and Polymorphism
description: Master Python inheritance mechanism, MRO, super() usage and polymorphism
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - Inheritance
  - Polymorphism
  - MRO
status: imported
origin: old/src/content/docs/python/inheritance-polymorphism.en.md
divergence: 0.179
issues: []
legacy:
  category: Python
  subcategory: Object-Oriented Programming
  order: 6
  lastUpdated: 2026-01-07
---

Inheritance and polymorphism are fundamental pillars of object-oriented programming in Python. We'll cover these concepts in depth, from basic inheritance patterns to advanced topics like Method Resolution Order (MRO) and abstract base classes.

## What is Inheritance?

Inheritance allows a class (child/derived class) to inherit attributes and methods from another class (parent/base class). This promotes code reuse and establishes a hierarchical relationship between classes.

### Basic Syntax

```python
class Parent:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Hello, I'm {self.name}"

class Child(Parent):
    def __init__(self, name, age):
        super().__init__(name)
        self.age = age

    def introduce(self):
        return f"{self.greet()} and I'm {self.age} years old"

# Usage
child = Child("Alice", 10)
print(child.introduce())  # Hello, I'm Alice and I'm 10 years old
```

## Single Inheritance

Single inheritance is when a class inherits from exactly one parent class. This is the most common and straightforward form of inheritance.

### Example: Animal Hierarchy

```python
class Animal:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        self.is_alive = True

    def make_sound(self):
        return "Some generic sound"

    def eat(self, food):
        return f"{self.name} is eating {food}"

    def __str__(self):
        return f"{self.name} ({self.species})"

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name, "Canine")
        self.breed = breed

    def make_sound(self):
        return "Woof! Woof!"

    def fetch(self, item):
        return f"{self.name} fetches the {item}"

class Cat(Animal):
    def __init__(self, name, indoor=True):
        super().__init__(name, "Feline")
        self.indoor = indoor

    def make_sound(self):
        return "Meow!"

    def scratch(self, furniture):
        return f"{self.name} scratches the {furniture}"

# Usage
dog = Dog("Buddy", "Golden Retriever")
cat = Cat("Whiskers")

print(dog.make_sound())      # Woof! Woof!
print(cat.make_sound())      # Meow!
print(dog.eat("kibble"))     # Buddy is eating kibble
print(dog.fetch("ball"))     # Buddy fetches the ball
print(cat.scratch("sofa"))   # Whiskers scratches the sofa
```

### Method Overriding

Child classes can override parent methods to provide specialized behavior:

```python
class Vehicle:
    def __init__(self, brand, model):
        self.brand = brand
        self.model = model
        self.speed = 0

    def start(self):
        return f"{self.brand} {self.model} is starting"

    def accelerate(self, increment):
        self.speed += increment
        return f"Speed: {self.speed} km/h"

class ElectricCar(Vehicle):
    def __init__(self, brand, model, battery_capacity):
        super().__init__(brand, model)
        self.battery_capacity = battery_capacity
        self.battery_level = 100

    def start(self):
        # Override parent method with electric-specific behavior
        if self.battery_level > 0:
            return f"{self.brand} {self.model} silently powers on"
        return "Battery is dead. Please charge."

    def charge(self, amount):
        self.battery_level = min(100, self.battery_level + amount)
        return f"Battery charged to {self.battery_level}%"

# Usage
tesla = ElectricCar("Tesla", "Model 3", 75)
print(tesla.start())           # Tesla Model 3 silently powers on
print(tesla.accelerate(50))    # Speed: 50 km/h
print(tesla.charge(20))        # Battery charged to 100%
```

## Multiple Inheritance

Python supports multiple inheritance, where a class can inherit from multiple parent classes. This is powerful but requires careful design to avoid complexity.

### Basic Multiple Inheritance

```python
class Flyable:
    def fly(self):
        return f"{self.name} is flying"

    def land(self):
        return f"{self.name} is landing"

class Swimmable:
    def swim(self):
        return f"{self.name} is swimming"

    def dive(self, depth):
        return f"{self.name} dives to {depth} meters"

class Duck(Animal, Flyable, Swimmable):
    def __init__(self, name):
        Animal.__init__(self, name, "Waterfowl")

    def make_sound(self):
        return "Quack! Quack!"

# Usage
donald = Duck("Donald")
print(donald.make_sound())     # Quack! Quack!
print(donald.fly())            # Donald is flying
print(donald.swim())           # Donald is swimming
print(donald.dive(2))          # Donald dives to 2 meters
print(donald.eat("bread"))     # Donald is eating bread
```

### Diamond Problem Example

```python
class A:
    def method(self):
        return "Method from A"

class B(A):
    def method(self):
        return "Method from B"

class C(A):
    def method(self):
        return "Method from C"

class D(B, C):
    pass

# Which method() is called?
obj = D()
print(obj.method())  # Method from B (due to MRO)
```

## Method Resolution Order (MRO)

MRO determines the order in which Python searches for methods in a class hierarchy. Python uses the C3 linearization algorithm.

### Understanding MRO

```python
class A:
    def process(self):
        return "A"

class B(A):
    def process(self):
        return "B"

class C(A):
    def process(self):
        return "C"

class D(B, C):
    def process(self):
        return "D"

# View the MRO
print(D.__mro__)
# (<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>,
#  <class '__main__.A'>, <class 'object'>)

print(D.mro())  # Alternative way to view MRO
```

### MRO Rules

1. A class always appears before its parents
2. If a class inherits from multiple classes, they are kept in the order specified in the tuple of base classes

```python
class Base:
    def __init__(self):
        print("Base.__init__")

class Left(Base):
    def __init__(self):
        print("Left.__init__")
        super().__init__()

class Right(Base):
    def __init__(self):
        print("Right.__init__")
        super().__init__()

class Child(Left, Right):
    def __init__(self):
        print("Child.__init__")
        super().__init__()

# Create instance and see initialization order
obj = Child()
# Output:
# Child.__init__
# Left.__init__
# Right.__init__
# Base.__init__

print(Child.mro())
# [<class '__main__.Child'>, <class '__main__.Left'>,
#  <class '__main__.Right'>, <class '__main__.Base'>, <class 'object'>]
```

### Practical MRO Example

```python
class Logger:
    def log(self, message):
        print(f"[LOG] {message}")

class FileHandler:
    def __init__(self, filename):
        self.filename = filename

    def save(self, data):
        return f"Saving to {self.filename}: {data}"

class DatabaseHandler:
    def __init__(self, db_name):
        self.db_name = db_name

    def save(self, data):
        return f"Saving to database {self.db_name}: {data}"

class DataProcessor(Logger, FileHandler, DatabaseHandler):
    def __init__(self, filename, db_name):
        FileHandler.__init__(self, filename)
        DatabaseHandler.__init__(self, db_name)

    def process(self, data):
        self.log(f"Processing data: {data}")
        # save() will use FileHandler's version (first in MRO)
        return self.save(data)

processor = DataProcessor("data.txt", "mydb")
print(processor.process("sample data"))
# [LOG] Processing data: sample data
# Saving to data.txt: sample data

print(DataProcessor.mro())
```

## The super() Function

`super()` provides a way to call methods from parent classes, respecting the MRO. It's especially important in multiple inheritance scenarios.

### Basic super() Usage

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        return f"I'm {self.name}, {self.age} years old"

class Student(Person):
    def __init__(self, name, age, student_id):
        super().__init__(name, age)
        self.student_id = student_id

    def introduce(self):
        # Call parent method and extend it
        base_intro = super().introduce()
        return f"{base_intro}. Student ID: {self.student_id}"

student = Student("Bob", 20, "S12345")
print(student.introduce())
# I'm Bob, 20 years old. Student ID: S12345
```

### super() in Multiple Inheritance

```python
class Device:
    def __init__(self, brand):
        print(f"Device.__init__: {brand}")
        self.brand = brand

class NetworkCapable:
    def __init__(self, ip_address):
        print(f"NetworkCapable.__init__: {ip_address}")
        self.ip_address = ip_address

class Smartphone(Device, NetworkCapable):
    def __init__(self, brand, ip_address, os):
        print(f"Smartphone.__init__")
        # This only calls Device.__init__ - WRONG!
        # super().__init__(brand)

        # Better approach - call both explicitly
        Device.__init__(self, brand)
        NetworkCapable.__init__(self, ip_address)
        self.os = os

# Even better - cooperative multiple inheritance
class Device:
    def __init__(self, brand, **kwargs):
        print(f"Device.__init__: {brand}")
        self.brand = brand
        super().__init__(**kwargs)

class NetworkCapable:
    def __init__(self, ip_address, **kwargs):
        print(f"NetworkCapable.__init__: {ip_address}")
        self.ip_address = ip_address
        super().__init__(**kwargs)

class Smartphone(Device, NetworkCapable):
    def __init__(self, brand, ip_address, os):
        print(f"Smartphone.__init__")
        super().__init__(brand=brand, ip_address=ip_address)
        self.os = os

phone = Smartphone("Apple", "192.168.1.10", "iOS")
# Smartphone.__init__
# Device.__init__: Apple
# NetworkCapable.__init__: 192.168.1.10
```

### super() with Method Extension

```python
class Shape:
    def __init__(self, color):
        self.color = color

    def describe(self):
        return f"A {self.color} shape"

class Circle(Shape):
    def __init__(self, color, radius):
        super().__init__(color)
        self.radius = radius

    def describe(self):
        base_description = super().describe()
        return f"{base_description} - Circle with radius {self.radius}"

    def area(self):
        import math
        return math.pi * self.radius ** 2

class ColoredCircle(Circle):
    def __init__(self, color, radius, border_color):
        super().__init__(color, radius)
        self.border_color = border_color

    def describe(self):
        base_description = super().describe()
        return f"{base_description}, border: {self.border_color}"

circle = ColoredCircle("blue", 5, "red")
print(circle.describe())
# A blue shape - Circle with radius 5, border: red
print(f"Area: {circle.area():.2f}")
# Area: 78.54
```

## Polymorphism

Polymorphism allows objects of different classes to be treated as objects of a common base class. The same interface can be used for different underlying forms (data types).

### Interface Polymorphism

```python
class PaymentProcessor:
    def process_payment(self, amount):
        raise NotImplementedError("Subclass must implement process_payment")

    def refund(self, transaction_id):
        raise NotImplementedError("Subclass must implement refund")

class CreditCardProcessor(PaymentProcessor):
    def process_payment(self, amount):
        return f"Processing ${amount} via Credit Card"

    def refund(self, transaction_id):
        return f"Refunding transaction {transaction_id} to Credit Card"

class PayPalProcessor(PaymentProcessor):
    def process_payment(self, amount):
        return f"Processing ${amount} via PayPal"

    def refund(self, transaction_id):
        return f"Refunding transaction {transaction_id} to PayPal account"

class BitcoinProcessor(PaymentProcessor):
    def process_payment(self, amount):
        return f"Processing ${amount} via Bitcoin"

    def refund(self, transaction_id):
        return f"Refunding transaction {transaction_id} to Bitcoin wallet"

# Polymorphic function
def handle_payment(processor: PaymentProcessor, amount: float):
    print(processor.process_payment(amount))

# Different processors, same interface
processors = [
    CreditCardProcessor(),
    PayPalProcessor(),
    BitcoinProcessor()
]

for processor in processors:
    handle_payment(processor, 100.00)

# Output:
# Processing $100.0 via Credit Card
# Processing $100.0 via PayPal
# Processing $100.0 via Bitcoin
```

### Operator Overloading (Special Methods)

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        """Overload + operator"""
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """Overload - operator"""
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        """Overload * operator for scalar multiplication"""
        return Vector(self.x * scalar, self.y * scalar)

    def __eq__(self, other):
        """Overload == operator"""
        return self.x == other.x and self.y == other.y

    def __str__(self):
        """String representation"""
        return f"Vector({self.x}, {self.y})"

    def __repr__(self):
        """Developer-friendly representation"""
        return f"Vector(x={self.x}, y={self.y})"

    def magnitude(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

# Usage
v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(v1 + v2)          # Vector(4, 6)
print(v1 - v2)          # Vector(2, 2)
print(v1 * 2)           # Vector(6, 8)
print(v1 == v2)         # False
print(v1.magnitude())   # 5.0
```

### Polymorphism with Different Types

```python
class Document:
    def __init__(self, content):
        self.content = content

    def render(self):
        raise NotImplementedError

class PDFDocument(Document):
    def render(self):
        return f"Rendering PDF: {self.content[:50]}..."

class HTMLDocument(Document):
    def render(self):
        return f"<html><body>{self.content}</body></html>"

class MarkdownDocument(Document):
    def render(self):
        return f"# Markdown\n\n{self.content}"

class DocumentRenderer:
    @staticmethod
    def render_all(documents):
        """Polymorphic rendering of different document types"""
        for doc in documents:
            print(doc.render())
            print("-" * 50)

# Usage
docs = [
    PDFDocument("This is a PDF document with lots of content"),
    HTMLDocument("This is HTML content"),
    MarkdownDocument("This is Markdown content")
]

DocumentRenderer.render_all(docs)
```

## Abstract Base Classes (ABC)

ABCs define a common interface for a group of subclasses and enforce implementation of specific methods.

### Creating Abstract Classes

```python
from abc import ABC, abstractmethod

class DatabaseConnection(ABC):
    @abstractmethod
    def connect(self):
        """Establish database connection"""
        pass

    @abstractmethod
    def disconnect(self):
        """Close database connection"""
        pass

    @abstractmethod
    def execute_query(self, query):
        """Execute a database query"""
        pass

    # Concrete method (shared implementation)
    def log(self, message):
        print(f"[DB LOG] {message}")

class MySQLConnection(DatabaseConnection):
    def __init__(self, host, database):
        self.host = host
        self.database = database
        self.connected = False

    def connect(self):
        self.connected = True
        self.log(f"Connected to MySQL: {self.host}/{self.database}")
        return True

    def disconnect(self):
        self.connected = False
        self.log(f"Disconnected from MySQL")
        return True

    def execute_query(self, query):
        if not self.connected:
            raise RuntimeError("Not connected to database")
        self.log(f"Executing MySQL query: {query}")
        return f"MySQL result for: {query}"

class PostgreSQLConnection(DatabaseConnection):
    def __init__(self, host, database):
        self.host = host
        self.database = database
        self.connected = False

    def connect(self):
        self.connected = True
        self.log(f"Connected to PostgreSQL: {self.host}/{self.database}")
        return True

    def disconnect(self):
        self.connected = False
        self.log(f"Disconnected from PostgreSQL")
        return True

    def execute_query(self, query):
        if not self.connected:
            raise RuntimeError("Not connected to database")
        self.log(f"Executing PostgreSQL query: {query}")
        return f"PostgreSQL result for: {query}"

# Cannot instantiate abstract class
# db = DatabaseConnection()  # TypeError!

# Must implement all abstract methods
mysql = MySQLConnection("localhost", "myapp")
mysql.connect()
result = mysql.execute_query("SELECT * FROM users")
print(result)
mysql.disconnect()
```

### Abstract Properties

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @property
    @abstractmethod
    def area(self):
        """Calculate and return the area"""
        pass

    @property
    @abstractmethod
    def perimeter(self):
        """Calculate and return the perimeter"""
        pass

    @abstractmethod
    def draw(self):
        """Draw the shape"""
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def area(self):
        return self.width * self.height

    @property
    def perimeter(self):
        return 2 * (self.width + self.height)

    def draw(self):
        return f"Drawing rectangle: {self.width}x{self.height}"

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):
        import math
        return math.pi * self.radius ** 2

    @property
    def perimeter(self):
        import math
        return 2 * math.pi * self.radius

    def draw(self):
        return f"Drawing circle with radius {self.radius}"

# Usage
shapes = [Rectangle(5, 3), Circle(4)]

for shape in shapes:
    print(shape.draw())
    print(f"Area: {shape.area:.2f}")
    print(f"Perimeter: {shape.perimeter:.2f}")
    print("-" * 40)
```

### Template Method Pattern

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    """Template for processing data with fixed workflow"""

    def process(self, data):
        """Template method - defines the algorithm structure"""
        print("Starting data processing...")

        # Step 1: Validate
        if not self.validate(data):
            raise ValueError("Data validation failed")

        # Step 2: Transform
        transformed = self.transform(data)

        # Step 3: Save
        result = self.save(transformed)

        print("Data processing complete!")
        return result

    @abstractmethod
    def validate(self, data):
        """Validate the input data"""
        pass

    @abstractmethod
    def transform(self, data):
        """Transform the data"""
        pass

    @abstractmethod
    def save(self, data):
        """Save the processed data"""
        pass

class CSVDataProcessor(DataProcessor):
    def validate(self, data):
        print("Validating CSV data...")
        return isinstance(data, str) and len(data) > 0

    def transform(self, data):
        print("Transforming CSV data...")
        return data.upper()

    def save(self, data):
        print("Saving to CSV file...")
        return f"CSV: {data}"

class JSONDataProcessor(DataProcessor):
    def validate(self, data):
        print("Validating JSON data...")
        import json
        try:
            json.loads(data)
            return True
        except:
            return False

    def transform(self, data):
        print("Transforming JSON data...")
        import json
        obj = json.loads(data)
        return json.dumps(obj, indent=2)

    def save(self, data):
        print("Saving to JSON file...")
        return f"JSON: {data}"

# Usage
csv_processor = CSVDataProcessor()
result = csv_processor.process("name,age\nAlice,30")

json_processor = JSONDataProcessor()
result = json_processor.process('{"name": "Bob", "age": 25}')
```

## Duck Typing

Python uses duck typing: "If it walks like a duck and quacks like a duck, it must be a duck." An object's suitability is determined by the presence of methods and properties rather than the object's type itself.

### Duck Typing Example

```python
class Duck:
    def quack(self):
        return "Quack!"

    def fly(self):
        return "Flapping wings"

class Person:
    def quack(self):
        return "I'm imitating a duck!"

    def fly(self):
        return "I'm using a jetpack!"

class Airplane:
    def fly(self):
        return "Flying at 30,000 feet"

    # No quack method!

def make_it_quack_and_fly(thing):
    """Duck typing - we don't check the type, just the capabilities"""
    try:
        print(thing.quack())
        print(thing.fly())
    except AttributeError as e:
        print(f"Error: {e}")

# All these work despite being different types
duck = Duck()
person = Person()
plane = Airplane()

make_it_quack_and_fly(duck)      # Works fine
make_it_quack_and_fly(person)    # Works fine
make_it_quack_and_fly(plane)     # Error - no quack method
```

### EAFP vs LBYL

Python favors EAFP (Easier to Ask for Forgiveness than Permission) over LBYL (Look Before You Leap):

```python
# LBYL - Look Before You Leap (not Pythonic)
def process_file_lbyl(obj):
    if hasattr(obj, 'read') and hasattr(obj, 'close'):
        data = obj.read()
        obj.close()
        return data
    else:
        raise TypeError("Object doesn't support file operations")

# EAFP - Easier to Ask for Forgiveness than Permission (Pythonic)
def process_file_eafp(obj):
    try:
        data = obj.read()
        obj.close()
        return data
    except AttributeError:
        raise TypeError("Object doesn't support file operations")

# Both file-like objects and StringIO work
from io import StringIO

file_like = StringIO("Hello, World!")
print(process_file_eafp(file_like))  # Hello, World!
```

### Protocol-Based Programming

```python
class FileWriter:
    """Any object with write() and close() is file-like"""
    def write(self, data):
        print(f"Writing: {data}")

    def close(self):
        print("File closed")

class DatabaseWriter:
    """Different type, same protocol"""
    def write(self, data):
        print(f"Inserting to DB: {data}")

    def close(self):
        print("Connection closed")

class NetworkWriter:
    """Another different type, same protocol"""
    def write(self, data):
        print(f"Sending over network: {data}")

    def close(self):
        print("Socket closed")

def save_data(writer, data):
    """Works with any object that has write() and close()"""
    writer.write(data)
    writer.close()

# All work with the same function
save_data(FileWriter(), "Hello")
save_data(DatabaseWriter(), "World")
save_data(NetworkWriter(), "!")
```

### Type Hints with Protocols (Python 3.8+)

```python
from typing import Protocol

class Drawable(Protocol):
    """Protocol defining what it means to be drawable"""
    def draw(self) -> str:
        ...

class Circle:
    def draw(self) -> str:
        return "Drawing a circle"

class Square:
    def draw(self) -> str:
        return "Drawing a square"

class NotDrawable:
    def render(self) -> str:  # Different method name
        return "Rendering"

def render_shape(shape: Drawable) -> None:
    """Type checker will verify shape has draw() method"""
    print(shape.draw())

# Type checker approves these
render_shape(Circle())
render_shape(Square())

# Type checker would flag this (at static analysis time)
# render_shape(NotDrawable())  # Type error!
```

## Best Practices

### Favor Composition Over Inheritance

```python
# Instead of deep inheritance hierarchies
class Engine:
    def start(self):
        return "Engine started"

    def stop(self):
        return "Engine stopped"

class GPS:
    def get_location(self):
        return "Current location: 40.7128°N, 74.0060°W"

# Use composition
class Car:
    def __init__(self):
        self.engine = Engine()
        self.gps = GPS()

    def start(self):
        return self.engine.start()

    def navigate(self):
        return self.gps.get_location()

car = Car()
print(car.start())      # Engine started
print(car.navigate())   # Current location: 40.7128°N, 74.0060°W
```

### Use ABC for Interface Definition

```python
from abc import ABC, abstractmethod

class DataSource(ABC):
    @abstractmethod
    def fetch_data(self):
        pass

    @abstractmethod
    def validate_data(self, data):
        pass

# Forces implementation of required methods
class APIDataSource(DataSource):
    def fetch_data(self):
        return "Data from API"

    def validate_data(self, data):
        return len(data) > 0
```

### Keep Inheritance Hierarchies Shallow

```python
# Good - shallow hierarchy
class Animal:
    pass

class Mammal(Animal):
    pass

class Dog(Mammal):
    pass

# Avoid - too deep
class Animal:
    pass

class Vertebrate(Animal):
    pass

class Mammal(Vertebrate):
    pass

class Carnivore(Mammal):
    pass

class Canine(Carnivore):
    pass

class Dog(Canine):  # Too many levels!
    pass
```

### Use super() Properly in Multiple Inheritance

```python
class A:
    def __init__(self, **kwargs):
        print("A init")
        super().__init__(**kwargs)

class B:
    def __init__(self, **kwargs):
        print("B init")
        super().__init__(**kwargs)

class C(A, B):
    def __init__(self, **kwargs):
        print("C init")
        super().__init__(**kwargs)

# Proper MRO execution
obj = C()
# C init
# A init
# B init
```

### Document Your Class Hierarchies

```python
class Vehicle:
    """
    Base class for all vehicles.

    Attributes:
        brand (str): Vehicle manufacturer
        model (str): Vehicle model name
        year (int): Manufacturing year

    Subclasses should override:
        - start(): Vehicle-specific start procedure
        - stop(): Vehicle-specific stop procedure
    """
    def __init__(self, brand, model, year):
        self.brand = brand
        self.model = model
        self.year = year

    def start(self):
        raise NotImplementedError("Subclass must implement start()")

    def stop(self):
        raise NotImplementedError("Subclass must implement stop()")
```

## Summary

- **Single Inheritance**: One parent class, simple and straightforward
- **Multiple Inheritance**: Multiple parent classes, powerful but complex
- **MRO**: C3 linearization algorithm determines method lookup order
- **super()**: Calls parent methods respecting MRO, essential for cooperative inheritance
- **Polymorphism**: Same interface, different implementations
- **ABC**: Define and enforce interfaces using abstract base classes
- **Duck Typing**: "If it walks like a duck..." - focus on capabilities, not types

Understanding these concepts allows you to design flexible, maintainable, and reusable object-oriented code in Python. Remember to favor simplicity and clarity over clever inheritance hierarchies.
