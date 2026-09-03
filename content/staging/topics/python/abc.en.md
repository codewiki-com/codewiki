---
title: Python ABC Abstract Base Classes
description: Learn Python abc module to define abstract base classes and abstract methods for interface contracts
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - ABC
  - abstract classes
  - interfaces
status: imported
origin: old/src/content/docs/python/abc.en.md
divergence: 0.413
issues:
  - order-mismatch
  - divergent
legacy:
  category: Python
  subcategory: OOP
  order: 37
  lastUpdated: 2026-01-07
---

Abstract Base Classes (ABCs) are a fundamental feature in Python that allow you to define interfaces and enforce contracts between classes. The `abc` module provides the infrastructure for defining abstract base classes, which cannot be instantiated directly and require subclasses to implement specific methods. We'll cover ABCs in depth, from basic concepts to advanced patterns and real-world applications.

## What are Abstract Base Classes?

An Abstract Base Class (ABC) is a class that cannot be instantiated directly and serves as a blueprint for other classes. ABCs define a common interface that all subclasses must implement, ensuring consistency and enabling polymorphism.

### Why Use ABCs?

ABCs provide several benefits:

1. **Interface Definition**: Define clear contracts that subclasses must follow
2. **Type Checking**: Enable `isinstance()` and `issubclass()` checks against interfaces
3. **Documentation**: Make expected interfaces explicit in code
4. **Error Prevention**: Catch missing method implementations at instantiation time

```python
# Without ABC - errors occur at runtime when method is called
class BadExample:
    def process(self, data):
        raise NotImplementedError("Subclass must implement process()")

class Implementation(BadExample):
    pass  # Forgot to implement process()

obj = Implementation()  # No error here
# obj.process("data")   # Error occurs here - too late!

# With ABC - errors occur at instantiation time
from abc import ABC, abstractmethod

class GoodExample(ABC):
    @abstractmethod
    def process(self, data):
        """Process the given data"""
        pass

# class Implementation(GoodExample):
#     pass  # Missing process()

# obj = Implementation()  # TypeError: Can't instantiate abstract class
```

### ABCs vs Regular Classes

```python
from abc import ABC, abstractmethod

# Regular class - can be instantiated with incomplete implementation
class RegularBase:
    def do_something(self):
        raise NotImplementedError

class RegularChild(RegularBase):
    pass

# This works but shouldn't
regular = RegularChild()

# Abstract class - cannot be instantiated without full implementation
class AbstractBase(ABC):
    @abstractmethod
    def do_something(self):
        pass

class AbstractChild(AbstractBase):
    def do_something(self):
        return "Implemented!"

# Works because all abstract methods are implemented
abstract = AbstractChild()
print(abstract.do_something())  # Implemented!
```

## The abc Module

The `abc` module provides the tools for creating abstract base classes. The key components are:

### Key Components

```python
from abc import ABC, ABCMeta, abstractmethod

# ABC - A helper class that has ABCMeta as its metaclass
class MyABC(ABC):
    pass

# Equivalent using metaclass directly
class MyABC2(metaclass=ABCMeta):
    pass

# abstractmethod - Decorator for marking abstract methods
class Interface(ABC):
    @abstractmethod
    def required_method(self):
        pass
```

### ABC vs ABCMeta

Both approaches create abstract classes, but `ABC` is more convenient:

```python
from abc import ABC, ABCMeta, abstractmethod

# Modern approach - cleaner syntax
class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

# Legacy approach - explicit metaclass
class Shape2(metaclass=ABCMeta):
    @abstractmethod
    def area(self):
        pass

# Both are functionally equivalent
print(type(Shape))   # <class 'abc.ABCMeta'>
print(type(Shape2))  # <class 'abc.ABCMeta'>
```

### Checking Abstract Classes

```python
from abc import ABC, abstractmethod
import inspect

class MyABC(ABC):
    @abstractmethod
    def method1(self):
        pass

    @abstractmethod
    def method2(self):
        pass

# Check which methods are abstract
print(MyABC.__abstractmethods__)  # frozenset({'method1', 'method2'})

# Check if a class is abstract
print(inspect.isabstract(MyABC))  # True

class Concrete(MyABC):
    def method1(self):
        return "method1"

    def method2(self):
        return "method2"

print(inspect.isabstract(Concrete))  # False
```

## Creating Abstract Classes

Abstract classes are created by inheriting from `ABC` and using the `@abstractmethod` decorator.

### Basic Abstract Class

```python
from abc import ABC, abstractmethod

class Animal(ABC):
    """Abstract base class for all animals"""

    def __init__(self, name):
        self.name = name

    @abstractmethod
    def speak(self):
        """Make the animal's characteristic sound"""
        pass

    @abstractmethod
    def move(self):
        """Describe how the animal moves"""
        pass

    # Concrete method - shared by all subclasses
    def introduce(self):
        return f"I am {self.name}"

class Dog(Animal):
    def speak(self):
        return "Woof!"

    def move(self):
        return "Running on four legs"

class Bird(Animal):
    def speak(self):
        return "Chirp!"

    def move(self):
        return "Flying through the air"

# Usage
dog = Dog("Buddy")
bird = Bird("Tweety")

print(dog.introduce())  # I am Buddy
print(dog.speak())      # Woof!
print(bird.move())      # Flying through the air
```

### Partial Implementation

A subclass that doesn't implement all abstract methods is also abstract:

```python
from abc import ABC, abstractmethod

class Vehicle(ABC):
    @abstractmethod
    def start(self):
        pass

    @abstractmethod
    def stop(self):
        pass

    @abstractmethod
    def fuel_type(self):
        pass

# Partial implementation - still abstract
class MotorVehicle(Vehicle):
    def start(self):
        return "Engine starting..."

    def stop(self):
        return "Engine stopping..."

    # fuel_type is still abstract

# Cannot instantiate MotorVehicle
# motor = MotorVehicle()  # TypeError

# Complete implementation
class Car(MotorVehicle):
    def fuel_type(self):
        return "Gasoline"

class ElectricCar(MotorVehicle):
    def fuel_type(self):
        return "Electricity"

# Now we can instantiate
car = Car()
print(car.start())      # Engine starting...
print(car.fuel_type())  # Gasoline

electric = ElectricCar()
print(electric.fuel_type())  # Electricity
```

### Abstract Class with Constructor

```python
from abc import ABC, abstractmethod

class DatabaseConnection(ABC):
    """Abstract base class for database connections"""

    def __init__(self, host, port, database):
        self.host = host
        self.port = port
        self.database = database
        self._connected = False

    @abstractmethod
    def connect(self):
        """Establish connection to the database"""
        pass

    @abstractmethod
    def disconnect(self):
        """Close the database connection"""
        pass

    @abstractmethod
    def execute(self, query):
        """Execute a database query"""
        pass

    def is_connected(self):
        """Check if connected to database"""
        return self._connected

class PostgreSQLConnection(DatabaseConnection):
    def __init__(self, host, port, database, schema="public"):
        super().__init__(host, port, database)
        self.schema = schema

    def connect(self):
        print(f"Connecting to PostgreSQL at {self.host}:{self.port}/{self.database}")
        self._connected = True
        return True

    def disconnect(self):
        print("Disconnecting from PostgreSQL")
        self._connected = False
        return True

    def execute(self, query):
        if not self._connected:
            raise RuntimeError("Not connected to database")
        return f"Executing on PostgreSQL: {query}"

class MySQLConnection(DatabaseConnection):
    def connect(self):
        print(f"Connecting to MySQL at {self.host}:{self.port}/{self.database}")
        self._connected = True
        return True

    def disconnect(self):
        print("Disconnecting from MySQL")
        self._connected = False
        return True

    def execute(self, query):
        if not self._connected:
            raise RuntimeError("Not connected to database")
        return f"Executing on MySQL: {query}"

# Usage
pg = PostgreSQLConnection("localhost", 5432, "mydb", schema="app")
pg.connect()
print(pg.execute("SELECT * FROM users"))
print(pg.is_connected())  # True
pg.disconnect()
```

## Abstract Methods

The `@abstractmethod` decorator marks methods that must be implemented by concrete subclasses.

### Basic Abstract Methods

```python
from abc import ABC, abstractmethod

class FileProcessor(ABC):
    @abstractmethod
    def read(self, filepath):
        """Read and return file contents"""
        pass

    @abstractmethod
    def write(self, filepath, content):
        """Write content to file"""
        pass

    @abstractmethod
    def validate(self, content):
        """Validate the content format"""
        pass

class JSONProcessor(FileProcessor):
    def read(self, filepath):
        import json
        with open(filepath, 'r') as f:
            return json.load(f)

    def write(self, filepath, content):
        import json
        with open(filepath, 'w') as f:
            json.dump(content, f, indent=2)

    def validate(self, content):
        return isinstance(content, (dict, list))

class CSVProcessor(FileProcessor):
    def read(self, filepath):
        import csv
        with open(filepath, 'r') as f:
            return list(csv.DictReader(f))

    def write(self, filepath, content):
        import csv
        if not content:
            return
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=content[0].keys())
            writer.writeheader()
            writer.writerows(content)

    def validate(self, content):
        return isinstance(content, list) and all(isinstance(row, dict) for row in content)
```

### Abstract Methods with Default Implementation

Abstract methods can have implementations that subclasses can call via `super()`:

```python
from abc import ABC, abstractmethod

class Serializer(ABC):
    @abstractmethod
    def serialize(self, data):
        """Convert data to string format"""
        # Default validation that subclasses can use
        if data is None:
            raise ValueError("Cannot serialize None")
        return str(data)

    @abstractmethod
    def deserialize(self, text):
        """Convert string back to data"""
        if not isinstance(text, str):
            raise TypeError("Input must be a string")
        return text

class JSONSerializer(Serializer):
    def serialize(self, data):
        # Call parent for validation
        super().serialize(data)
        import json
        return json.dumps(data)

    def deserialize(self, text):
        # Call parent for type checking
        super().deserialize(text)
        import json
        return json.loads(text)

class XMLSerializer(Serializer):
    def serialize(self, data):
        super().serialize(data)
        # Simple XML serialization for dict
        if isinstance(data, dict):
            items = ''.join(f'<{k}>{v}</{k}>' for k, v in data.items())
            return f'<root>{items}</root>'
        return f'<value>{data}</value>'

    def deserialize(self, text):
        super().deserialize(text)
        # Simple XML parsing (for demonstration)
        import re
        matches = re.findall(r'<(\w+)>([^<]+)</\1>', text)
        return dict(matches)

# Usage
json_serializer = JSONSerializer()
print(json_serializer.serialize({"name": "Alice", "age": 30}))
# {"name": "Alice", "age": 30}

xml_serializer = XMLSerializer()
print(xml_serializer.serialize({"name": "Alice", "age": 30}))
# <root><name>Alice</name><age>30</age></root>
```

### Detecting Unimplemented Abstract Methods

```python
from abc import ABC, abstractmethod

class PaymentGateway(ABC):
    @abstractmethod
    def process_payment(self, amount):
        pass

    @abstractmethod
    def refund(self, transaction_id):
        pass

    @abstractmethod
    def get_balance(self):
        pass

class IncompleteGateway(PaymentGateway):
    def process_payment(self, amount):
        return f"Processing ${amount}"

    # Missing refund() and get_balance()

# Check what's missing before trying to instantiate
print(IncompleteGateway.__abstractmethods__)
# frozenset({'refund', 'get_balance'})

# This shows exactly what needs to be implemented
try:
    gateway = IncompleteGateway()
except TypeError as e:
    print(f"Error: {e}")
    # Error: Can't instantiate abstract class IncompleteGateway
    # with abstract methods get_balance, refund
```

## Abstract Properties

Properties can also be abstract, requiring subclasses to implement them.

### Basic Abstract Properties

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

    @property
    @abstractmethod
    def name(self):
        """Return the shape name"""
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self._width = width
        self._height = height

    @property
    def area(self):
        return self._width * self._height

    @property
    def perimeter(self):
        return 2 * (self._width + self._height)

    @property
    def name(self):
        return "Rectangle"

class Circle(Shape):
    def __init__(self, radius):
        self._radius = radius

    @property
    def area(self):
        import math
        return math.pi * self._radius ** 2

    @property
    def perimeter(self):
        import math
        return 2 * math.pi * self._radius

    @property
    def name(self):
        return "Circle"

# Usage
rect = Rectangle(5, 3)
print(f"{rect.name}: area={rect.area}, perimeter={rect.perimeter}")
# Rectangle: area=15, perimeter=16

circle = Circle(4)
print(f"{circle.name}: area={circle.area:.2f}, perimeter={circle.perimeter:.2f}")
# Circle: area=50.27, perimeter=25.13
```

### Abstract Properties with Setters

```python
from abc import ABC, abstractmethod

class ConfigurableDevice(ABC):
    @property
    @abstractmethod
    def name(self):
        """Device name (read-only)"""
        pass

    @property
    @abstractmethod
    def power_state(self):
        """Current power state"""
        pass

    @power_state.setter
    @abstractmethod
    def power_state(self, value):
        """Set power state"""
        pass

    @property
    @abstractmethod
    def brightness(self):
        """Current brightness level"""
        pass

    @brightness.setter
    @abstractmethod
    def brightness(self, value):
        """Set brightness level"""
        pass

class SmartLight(ConfigurableDevice):
    def __init__(self, name):
        self._name = name
        self._power = False
        self._brightness = 100

    @property
    def name(self):
        return self._name

    @property
    def power_state(self):
        return self._power

    @power_state.setter
    def power_state(self, value):
        if not isinstance(value, bool):
            raise TypeError("power_state must be boolean")
        self._power = value
        print(f"{self._name} {'turned on' if value else 'turned off'}")

    @property
    def brightness(self):
        return self._brightness

    @brightness.setter
    def brightness(self, value):
        if not 0 <= value <= 100:
            raise ValueError("brightness must be between 0 and 100")
        self._brightness = value
        print(f"{self._name} brightness set to {value}%")

# Usage
light = SmartLight("Living Room Light")
light.power_state = True     # Living Room Light turned on
light.brightness = 75        # Living Room Light brightness set to 75%
print(f"Status: {light.name} is {'on' if light.power_state else 'off'} at {light.brightness}%")
# Status: Living Room Light is on at 75%
```

### Read-Only vs Read-Write Abstract Properties

```python
from abc import ABC, abstractmethod

class DataRecord(ABC):
    """Abstract base for data records with read-only ID and read-write data"""

    @property
    @abstractmethod
    def id(self):
        """Unique identifier (read-only)"""
        pass

    @property
    @abstractmethod
    def data(self):
        """Record data"""
        pass

    @data.setter
    @abstractmethod
    def data(self, value):
        pass

    @property
    @abstractmethod
    def created_at(self):
        """Creation timestamp (read-only)"""
        pass

class UserRecord(DataRecord):
    def __init__(self, user_id, data):
        self._id = user_id
        self._data = data
        import datetime
        self._created_at = datetime.datetime.now()

    @property
    def id(self):
        return self._id

    @property
    def data(self):
        return self._data.copy()  # Return copy for immutability

    @data.setter
    def data(self, value):
        if not isinstance(value, dict):
            raise TypeError("data must be a dictionary")
        self._data = value.copy()

    @property
    def created_at(self):
        return self._created_at

# Usage
user = UserRecord("user_001", {"name": "Alice", "email": "alice@example.com"})
print(f"ID: {user.id}")
print(f"Data: {user.data}")
print(f"Created: {user.created_at}")

# Can modify data
user.data = {"name": "Alice Smith", "email": "alice.smith@example.com"}
print(f"Updated: {user.data}")

# Cannot modify id or created_at (no setter defined)
# user.id = "new_id"  # AttributeError
```

## Abstract Class Methods and Static Methods

Abstract methods can be combined with `@classmethod` and `@staticmethod`.

### Abstract Class Methods

```python
from abc import ABC, abstractmethod

class Serializable(ABC):
    @classmethod
    @abstractmethod
    def from_json(cls, json_string):
        """Create instance from JSON string"""
        pass

    @classmethod
    @abstractmethod
    def from_dict(cls, data):
        """Create instance from dictionary"""
        pass

    @abstractmethod
    def to_json(self):
        """Convert to JSON string"""
        pass

    @abstractmethod
    def to_dict(self):
        """Convert to dictionary"""
        pass

class User(Serializable):
    def __init__(self, name, email, age):
        self.name = name
        self.email = email
        self.age = age

    @classmethod
    def from_json(cls, json_string):
        import json
        data = json.loads(json_string)
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data):
        return cls(
            name=data['name'],
            email=data['email'],
            age=data['age']
        )

    def to_json(self):
        import json
        return json.dumps(self.to_dict())

    def to_dict(self):
        return {
            'name': self.name,
            'email': self.email,
            'age': self.age
        }

# Usage
user1 = User("Alice", "alice@example.com", 30)
json_str = user1.to_json()
print(json_str)  # {"name": "Alice", "email": "alice@example.com", "age": 30}

user2 = User.from_json(json_str)
print(f"{user2.name}, {user2.email}")  # Alice, alice@example.com

user3 = User.from_dict({'name': 'Bob', 'email': 'bob@example.com', 'age': 25})
print(user3.to_dict())  # {'name': 'Bob', 'email': 'bob@example.com', 'age': 25}
```

### Abstract Static Methods

```python
from abc import ABC, abstractmethod

class Validator(ABC):
    @staticmethod
    @abstractmethod
    def validate(value):
        """Validate a value and return True if valid"""
        pass

    @staticmethod
    @abstractmethod
    def error_message():
        """Return error message for invalid values"""
        pass

class EmailValidator(Validator):
    @staticmethod
    def validate(value):
        import re
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return bool(re.match(pattern, value))

    @staticmethod
    def error_message():
        return "Invalid email format"

class PasswordValidator(Validator):
    @staticmethod
    def validate(value):
        if len(value) < 8:
            return False
        if not any(c.isupper() for c in value):
            return False
        if not any(c.isdigit() for c in value):
            return False
        return True

    @staticmethod
    def error_message():
        return "Password must be 8+ chars with uppercase and digit"

class PhoneValidator(Validator):
    @staticmethod
    def validate(value):
        import re
        # Accepts formats like: 123-456-7890, (123) 456-7890, 1234567890
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        return len(cleaned) == 10 and cleaned.isdigit()

    @staticmethod
    def error_message():
        return "Invalid phone number format"

# Usage
def validate_field(validator_class, value):
    if validator_class.validate(value):
        return True, "Valid"
    return False, validator_class.error_message()

print(validate_field(EmailValidator, "user@example.com"))  # (True, 'Valid')
print(validate_field(EmailValidator, "invalid"))           # (False, 'Invalid email format')

print(validate_field(PasswordValidator, "SecurePass123"))  # (True, 'Valid')
print(validate_field(PasswordValidator, "weak"))           # (False, 'Password must be...')
```

### Combining Multiple Decorators

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    """Abstract base class demonstrating all abstract method types"""

    # Abstract instance method
    @abstractmethod
    def process(self, data):
        """Process data (instance method)"""
        pass

    # Abstract class method
    @classmethod
    @abstractmethod
    def create_processor(cls, config):
        """Factory method to create processor (class method)"""
        pass

    # Abstract static method
    @staticmethod
    @abstractmethod
    def validate_input(data):
        """Validate input data (static method)"""
        pass

    # Abstract property (getter)
    @property
    @abstractmethod
    def processor_type(self):
        """Return processor type (property)"""
        pass

class TextProcessor(DataProcessor):
    def __init__(self, mode="uppercase"):
        self._mode = mode

    def process(self, data):
        if self._mode == "uppercase":
            return data.upper()
        elif self._mode == "lowercase":
            return data.lower()
        return data

    @classmethod
    def create_processor(cls, config):
        return cls(mode=config.get("mode", "uppercase"))

    @staticmethod
    def validate_input(data):
        return isinstance(data, str) and len(data) > 0

    @property
    def processor_type(self):
        return f"TextProcessor({self._mode})"

# Usage
processor = TextProcessor.create_processor({"mode": "uppercase"})
print(processor.processor_type)  # TextProcessor(uppercase)

if TextProcessor.validate_input("Hello World"):
    result = processor.process("Hello World")
    print(result)  # HELLO WORLD
```

## Concrete Methods in Abstract Classes

Abstract classes can have both abstract and concrete (regular) methods. Concrete methods provide shared functionality.

### Mixing Abstract and Concrete Methods

```python
from abc import ABC, abstractmethod

class Report(ABC):
    """Abstract base class for reports with shared functionality"""

    def __init__(self, title, author):
        self.title = title
        self.author = author
        self._sections = []

    # Abstract methods - must be implemented
    @abstractmethod
    def generate_content(self):
        """Generate the main report content"""
        pass

    @abstractmethod
    def export(self, format_type):
        """Export report to specified format"""
        pass

    # Concrete methods - shared by all subclasses
    def add_section(self, title, content):
        """Add a section to the report"""
        self._sections.append({"title": title, "content": content})

    def get_header(self):
        """Generate standard report header"""
        return f"Report: {self.title}\nAuthor: {self.author}\n{'='*50}\n"

    def get_footer(self):
        """Generate standard report footer"""
        import datetime
        return f"\n{'='*50}\nGenerated: {datetime.datetime.now()}"

    def get_sections(self):
        """Get formatted sections"""
        result = ""
        for section in self._sections:
            result += f"\n## {section['title']}\n{section['content']}\n"
        return result

class SalesReport(Report):
    def __init__(self, title, author, sales_data):
        super().__init__(title, author)
        self.sales_data = sales_data

    def generate_content(self):
        total = sum(self.sales_data.values())
        content = self.get_header()
        content += "\nSales Summary:\n"
        for product, amount in self.sales_data.items():
            content += f"  {product}: ${amount:,.2f}\n"
        content += f"\nTotal: ${total:,.2f}"
        content += self.get_sections()
        content += self.get_footer()
        return content

    def export(self, format_type):
        if format_type == "text":
            return self.generate_content()
        elif format_type == "csv":
            lines = ["Product,Amount"]
            for product, amount in self.sales_data.items():
                lines.append(f"{product},{amount}")
            return "\n".join(lines)
        raise ValueError(f"Unsupported format: {format_type}")

class AnalyticsReport(Report):
    def __init__(self, title, author, metrics):
        super().__init__(title, author)
        self.metrics = metrics

    def generate_content(self):
        content = self.get_header()
        content += "\nKey Metrics:\n"
        for metric, value in self.metrics.items():
            content += f"  {metric}: {value}\n"
        content += self.get_sections()
        content += self.get_footer()
        return content

    def export(self, format_type):
        if format_type == "text":
            return self.generate_content()
        elif format_type == "json":
            import json
            return json.dumps({
                "title": self.title,
                "author": self.author,
                "metrics": self.metrics
            }, indent=2)
        raise ValueError(f"Unsupported format: {format_type}")

# Usage
sales = SalesReport(
    "Q4 Sales Report",
    "John Smith",
    {"Product A": 15000, "Product B": 23000, "Product C": 8500}
)
sales.add_section("Notes", "Strong performance in Product B category.")
print(sales.generate_content())
print("\n--- CSV Export ---\n")
print(sales.export("csv"))
```

### Template Method Pattern

ABCs are perfect for implementing the Template Method design pattern:

```python
from abc import ABC, abstractmethod

class DataPipeline(ABC):
    """Template method pattern for data processing pipelines"""

    def run(self, data):
        """Template method - defines the algorithm structure"""
        print("Starting pipeline...")

        # Step 1: Validate
        validated = self.validate(data)
        if not validated:
            raise ValueError("Data validation failed")
        print("Validation passed")

        # Step 2: Transform
        transformed = self.transform(data)
        print("Transformation complete")

        # Step 3: Process
        processed = self.process(transformed)
        print("Processing complete")

        # Step 4: Save
        result = self.save(processed)
        print("Save complete")

        return result

    # Abstract methods - subclasses must implement
    @abstractmethod
    def validate(self, data):
        """Validate input data"""
        pass

    @abstractmethod
    def transform(self, data):
        """Transform data to required format"""
        pass

    @abstractmethod
    def process(self, data):
        """Process the transformed data"""
        pass

    @abstractmethod
    def save(self, data):
        """Save processed data"""
        pass

class CSVToJSONPipeline(DataPipeline):
    def __init__(self, output_file):
        self.output_file = output_file

    def validate(self, data):
        # Check if data is list of dicts (CSV-like structure)
        return isinstance(data, list) and all(isinstance(row, dict) for row in data)

    def transform(self, data):
        # Add processing metadata
        for row in data:
            row['_processed'] = True
        return data

    def process(self, data):
        # Filter out incomplete records
        return [row for row in data if all(v is not None for v in row.values())]

    def save(self, data):
        import json
        with open(self.output_file, 'w') as f:
            json.dump(data, f, indent=2)
        return f"Saved {len(data)} records to {self.output_file}"

class DataCleaningPipeline(DataPipeline):
    def validate(self, data):
        return isinstance(data, list)

    def transform(self, data):
        # Normalize strings
        return [
            {k: v.strip().lower() if isinstance(v, str) else v
             for k, v in row.items()}
            for row in data
        ]

    def process(self, data):
        # Remove duplicates
        seen = set()
        unique = []
        for row in data:
            key = tuple(sorted(row.items()))
            if key not in seen:
                seen.add(key)
                unique.append(row)
        return unique

    def save(self, data):
        # Just return the cleaned data
        return data

# Usage
pipeline = CSVToJSONPipeline("output.json")
sample_data = [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25},
    {"name": None, "age": 35}  # Will be filtered
]
# result = pipeline.run(sample_data)  # Would create output.json
```

## Multiple Inheritance with ABCs

ABCs support multiple inheritance, allowing you to compose interfaces.

### Composing Multiple Interfaces

```python
from abc import ABC, abstractmethod

class Printable(ABC):
    @abstractmethod
    def print_details(self):
        """Print object details"""
        pass

class Saveable(ABC):
    @abstractmethod
    def save(self, filepath):
        """Save to file"""
        pass

    @abstractmethod
    def load(self, filepath):
        """Load from file"""
        pass

class Sendable(ABC):
    @abstractmethod
    def send(self, recipient):
        """Send to recipient"""
        pass

class Validatable(ABC):
    @abstractmethod
    def validate(self):
        """Validate object state"""
        pass

# Combine multiple interfaces
class Document(Printable, Saveable, Sendable, Validatable):
    def __init__(self, title, content):
        self.title = title
        self.content = content

    def print_details(self):
        print(f"Document: {self.title}")
        print(f"Content length: {len(self.content)} chars")

    def save(self, filepath):
        with open(filepath, 'w') as f:
            f.write(f"Title: {self.title}\n\n{self.content}")
        return f"Saved to {filepath}"

    def load(self, filepath):
        with open(filepath, 'r') as f:
            lines = f.readlines()
            self.title = lines[0].replace("Title: ", "").strip()
            self.content = "".join(lines[2:])
        return self

    def send(self, recipient):
        return f"Sending '{self.title}' to {recipient}"

    def validate(self):
        if not self.title:
            return False, "Title is required"
        if not self.content:
            return False, "Content is required"
        return True, "Valid"

# Usage
doc = Document("Report", "This is the report content.")
doc.print_details()
print(doc.validate())      # (True, 'Valid')
print(doc.send("boss@company.com"))  # Sending 'Report' to boss@company.com

# Type checking with isinstance
print(isinstance(doc, Printable))   # True
print(isinstance(doc, Saveable))    # True
print(isinstance(doc, Sendable))    # True
print(isinstance(doc, Validatable)) # True
```

### Interface Hierarchies

```python
from abc import ABC, abstractmethod

class Readable(ABC):
    @abstractmethod
    def read(self):
        pass

class Writable(ABC):
    @abstractmethod
    def write(self, data):
        pass

class Seekable(ABC):
    @abstractmethod
    def seek(self, position):
        pass

    @abstractmethod
    def tell(self):
        pass

# Compound interfaces
class ReadWritable(Readable, Writable):
    """Can read and write"""
    pass

class RandomAccess(ReadWritable, Seekable):
    """Full random access support"""
    pass

class MemoryBuffer(RandomAccess):
    """In-memory buffer implementation"""

    def __init__(self):
        self._buffer = bytearray()
        self._position = 0

    def read(self, size=-1):
        if size < 0:
            data = self._buffer[self._position:]
            self._position = len(self._buffer)
        else:
            data = self._buffer[self._position:self._position + size]
            self._position += len(data)
        return bytes(data)

    def write(self, data):
        if isinstance(data, str):
            data = data.encode()
        self._buffer[self._position:self._position + len(data)] = data
        self._position += len(data)
        return len(data)

    def seek(self, position):
        if position < 0:
            raise ValueError("Position cannot be negative")
        self._position = position

    def tell(self):
        return self._position

# Usage
buf = MemoryBuffer()
buf.write("Hello, World!")
buf.seek(0)
print(buf.read())  # b'Hello, World!'
print(buf.tell())  # 13

# All interface checks pass
print(isinstance(buf, Readable))      # True
print(isinstance(buf, Writable))      # True
print(isinstance(buf, Seekable))      # True
print(isinstance(buf, RandomAccess))  # True
```

## Virtual Subclasses and Registration

ABCs support "virtual subclasses" through the `register()` method, allowing classes to be considered subclasses without actual inheritance.

### Basic Registration

```python
from abc import ABC, abstractmethod

class Drawable(ABC):
    @abstractmethod
    def draw(self):
        pass

# Regular subclass - inherits from Drawable
class Circle(Drawable):
    def __init__(self, radius):
        self.radius = radius

    def draw(self):
        return f"Drawing circle with radius {self.radius}"

# External class - doesn't inherit from Drawable
class ExternalRectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def draw(self):
        return f"Drawing rectangle {self.width}x{self.height}"

# Register as virtual subclass
Drawable.register(ExternalRectangle)

# Now isinstance/issubclass checks work
rect = ExternalRectangle(10, 5)
print(isinstance(rect, Drawable))       # True
print(issubclass(ExternalRectangle, Drawable))  # True

# But note: registration doesn't enforce abstract methods!
class BrokenShape:
    pass  # No draw() method

Drawable.register(BrokenShape)
print(isinstance(BrokenShape(), Drawable))  # True - but draw() will fail!
```

### Registration Decorator

```python
from abc import ABC, abstractmethod

class Serializable(ABC):
    @abstractmethod
    def to_bytes(self):
        pass

    @abstractmethod
    def from_bytes(cls, data):
        pass

# Use as decorator
@Serializable.register
class ThirdPartyClass:
    """Class from external library that happens to have the right methods"""

    def to_bytes(self):
        return b"serialized"

    @classmethod
    def from_bytes(cls, data):
        return cls()

# Works with isinstance
obj = ThirdPartyClass()
print(isinstance(obj, Serializable))  # True
```

### __subclasshook__ for Structural Subtyping

The `__subclasshook__` method allows you to define custom logic for `isinstance()` and `issubclass()` checks:

```python
from abc import ABC, abstractmethod

class Iterable(ABC):
    @abstractmethod
    def __iter__(self):
        pass

    @classmethod
    def __subclasshook__(cls, C):
        if cls is Iterable:
            # Check if class has __iter__ method
            if hasattr(C, '__iter__'):
                return True
        return NotImplemented

# Any class with __iter__ is considered Iterable
class MyCollection:
    def __init__(self):
        self.items = [1, 2, 3]

    def __iter__(self):
        return iter(self.items)

# No registration or inheritance needed
print(isinstance(MyCollection(), Iterable))  # True
print(issubclass(MyCollection, Iterable))    # True

# Even built-in types work
print(isinstance([1, 2, 3], Iterable))  # True
print(isinstance("hello", Iterable))    # True
print(isinstance(42, Iterable))         # False
```

### Advanced __subclasshook__

```python
from abc import ABC, abstractmethod

class Comparable(ABC):
    """Protocol for comparable objects"""

    @abstractmethod
    def __lt__(self, other):
        pass

    @abstractmethod
    def __le__(self, other):
        pass

    @abstractmethod
    def __gt__(self, other):
        pass

    @abstractmethod
    def __ge__(self, other):
        pass

    @classmethod
    def __subclasshook__(cls, C):
        if cls is Comparable:
            # Check for all comparison methods
            required = ('__lt__', '__le__', '__gt__', '__ge__')
            if all(hasattr(C, method) for method in required):
                return True
        return NotImplemented

# Test with various types
print(isinstance(1, Comparable))    # True (int has comparison methods)
print(isinstance("a", Comparable))  # True (str has comparison methods)
print(isinstance([1], Comparable))  # True (list has comparison methods)

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __lt__(self, other):
        return (self.x, self.y) < (other.x, other.y)

    def __le__(self, other):
        return (self.x, self.y) <= (other.x, other.y)

    def __gt__(self, other):
        return (self.x, self.y) > (other.x, other.y)

    def __ge__(self, other):
        return (self.x, self.y) >= (other.x, other.y)

print(isinstance(Point(0, 0), Comparable))  # True
```

## Built-in ABCs in collections.abc

Python's `collections.abc` module provides many useful abstract base classes for common patterns.

### Common Collection ABCs

```python
from collections.abc import (
    Iterable, Iterator, Reversible,
    Container, Sized, Callable,
    Hashable, Sequence, MutableSequence,
    Set, MutableSet, Mapping, MutableMapping
)

# Check built-in types against ABCs
print(isinstance([1, 2, 3], MutableSequence))  # True
print(isinstance((1, 2, 3), Sequence))         # True
print(isinstance((1, 2, 3), MutableSequence))  # False (tuples are immutable)

print(isinstance({1, 2, 3}, Set))              # True
print(isinstance(frozenset({1, 2}), Set))      # True
print(isinstance(frozenset({1, 2}), MutableSet))  # False

print(isinstance({'a': 1}, Mapping))           # True
print(isinstance({'a': 1}, MutableMapping))    # True

# Functions are Callable
def my_func():
    pass

print(isinstance(my_func, Callable))  # True
print(isinstance(lambda x: x, Callable))  # True
```

### Implementing Collection ABCs

```python
from collections.abc import MutableSequence

class TypedList(MutableSequence):
    """A list that only accepts items of a specific type"""

    def __init__(self, item_type, initial=None):
        self._type = item_type
        self._items = []
        if initial:
            for item in initial:
                self.append(item)

    def _check_type(self, item):
        if not isinstance(item, self._type):
            raise TypeError(
                f"Expected {self._type.__name__}, got {type(item).__name__}"
            )

    # Required abstract methods
    def __getitem__(self, index):
        return self._items[index]

    def __setitem__(self, index, value):
        self._check_type(value)
        self._items[index] = value

    def __delitem__(self, index):
        del self._items[index]

    def __len__(self):
        return len(self._items)

    def insert(self, index, value):
        self._check_type(value)
        self._items.insert(index, value)

    # Additional methods inherited from MutableSequence
    # append, clear, reverse, extend, pop, remove, __iadd__

    def __repr__(self):
        return f"TypedList({self._type.__name__}, {self._items})"

# Usage
int_list = TypedList(int, [1, 2, 3])
int_list.append(4)
int_list.extend([5, 6, 7])
print(int_list)  # TypedList(int, [1, 2, 3, 4, 5, 6, 7])

# Type checking works
try:
    int_list.append("not an int")
except TypeError as e:
    print(f"Error: {e}")  # Error: Expected int, got str

# MutableSequence methods work automatically
int_list.reverse()
print(int_list)  # TypedList(int, [7, 6, 5, 4, 3, 2, 1])
```

### Custom Mapping Implementation

```python
from collections.abc import MutableMapping

class CaseInsensitiveDict(MutableMapping):
    """Dictionary with case-insensitive string keys"""

    def __init__(self, initial=None):
        self._store = {}
        if initial:
            self.update(initial)

    def _normalize_key(self, key):
        if isinstance(key, str):
            return key.lower()
        return key

    def __getitem__(self, key):
        return self._store[self._normalize_key(key)]

    def __setitem__(self, key, value):
        self._store[self._normalize_key(key)] = value

    def __delitem__(self, key):
        del self._store[self._normalize_key(key)]

    def __iter__(self):
        return iter(self._store)

    def __len__(self):
        return len(self._store)

    def __repr__(self):
        return f"CaseInsensitiveDict({dict(self._store)})"

# Usage
headers = CaseInsensitiveDict({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
})

# Case doesn't matter for access
print(headers['content-type'])   # application/json
print(headers['CONTENT-TYPE'])   # application/json
print(headers['Content-Type'])   # application/json

# Standard dict methods work (inherited from MutableMapping)
headers['accept'] = 'text/html'
print('Accept' in headers)       # True
print(list(headers.keys()))      # ['content-type', 'authorization', 'accept']
print(dict(headers.items()))     # Original case preserved in iteration
```

### Custom Iterator

```python
from collections.abc import Iterator

class CountDown(Iterator):
    """Iterator that counts down from a number"""

    def __init__(self, start):
        self.current = start

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

# Usage
for num in CountDown(5):
    print(num, end=' ')  # 5 4 3 2 1

print()

# Can be used with list(), sum(), etc.
print(list(CountDown(3)))  # [3, 2, 1]
print(sum(CountDown(5)))   # 15
```

## ABCs vs Protocols

Python 3.8+ introduced `Protocol` from the `typing` module as an alternative for structural subtyping.

### Comparing ABCs and Protocols

```python
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable

# ABC approach - requires explicit inheritance
class DrawableABC(ABC):
    @abstractmethod
    def draw(self) -> str:
        pass

class CircleABC(DrawableABC):
    def draw(self) -> str:
        return "Drawing circle"

# Protocol approach - structural typing (duck typing with type hints)
@runtime_checkable
class DrawableProtocol(Protocol):
    def draw(self) -> str:
        ...

class SquareProtocol:
    """No inheritance needed - just implement the method"""
    def draw(self) -> str:
        return "Drawing square"

# ABC requires inheritance for isinstance
circle = CircleABC()
print(isinstance(circle, DrawableABC))  # True

# Protocol works with structural matching (when @runtime_checkable is used)
square = SquareProtocol()
print(isinstance(square, DrawableProtocol))  # True

# Any class with draw() method matches the protocol
class Triangle:
    def draw(self) -> str:
        return "Drawing triangle"

print(isinstance(Triangle(), DrawableProtocol))  # True
```

### When to Use ABCs vs Protocols

```python
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable

# Use ABC when:
# - You need shared implementation (concrete methods)
# - You want to enforce inheritance relationships
# - You need to register virtual subclasses
# - Compatibility with older Python versions is needed

class DataProcessorABC(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def process(self, data):
        pass

    # Shared implementation
    def log(self, message):
        print(f"[{self.name}] {message}")

    def run(self, data):
        self.log("Starting processing")
        result = self.process(data)
        self.log("Processing complete")
        return result

# Use Protocol when:
# - You want duck typing with type checking
# - You don't control the classes that implement the interface
# - You want structural subtyping (method signatures only)

@runtime_checkable
class DataProcessorProtocol(Protocol):
    name: str

    def process(self, data: str) -> str:
        ...

# Works with ABC subclass
class TextProcessor(DataProcessorABC):
    def process(self, data):
        return data.upper()

# Works with any class matching the structure
class JSONProcessor:
    def __init__(self):
        self.name = "JSON"

    def process(self, data):
        import json
        return json.loads(data)

# Both are valid DataProcessorProtocol
text_proc = TextProcessor("Text")
json_proc = JSONProcessor()

print(isinstance(text_proc, DataProcessorProtocol))  # True
print(isinstance(json_proc, DataProcessorProtocol))  # True
```

### Combining ABCs with Type Hints

```python
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    """Generic repository pattern with ABC"""

    @abstractmethod
    def add(self, item: T) -> None:
        pass

    @abstractmethod
    def get(self, id: str) -> T | None:
        pass

    @abstractmethod
    def get_all(self) -> List[T]:
        pass

    @abstractmethod
    def delete(self, id: str) -> bool:
        pass

class User:
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name

class UserRepository(Repository[User]):
    def __init__(self):
        self._users: dict[str, User] = {}

    def add(self, user: User) -> None:
        self._users[user.id] = user

    def get(self, id: str) -> User | None:
        return self._users.get(id)

    def get_all(self) -> List[User]:
        return list(self._users.values())

    def delete(self, id: str) -> bool:
        if id in self._users:
            del self._users[id]
            return True
        return False

# Usage with type safety
repo = UserRepository()
repo.add(User("1", "Alice"))
repo.add(User("2", "Bob"))

user = repo.get("1")
if user:
    print(user.name)  # Alice

print([u.name for u in repo.get_all()])  # ['Alice', 'Bob']
```

## Practical Use Cases

### Plugin System

```python
from abc import ABC, abstractmethod
from typing import Dict, Type

class Plugin(ABC):
    """Abstract base class for plugins"""

    # Registry of all plugins
    _plugins: Dict[str, Type['Plugin']] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if hasattr(cls, 'name') and cls.name:
            Plugin._plugins[cls.name] = cls

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin identifier"""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Plugin version"""
        pass

    @abstractmethod
    def initialize(self) -> bool:
        """Initialize the plugin"""
        pass

    @abstractmethod
    def execute(self, data: dict) -> dict:
        """Execute plugin logic"""
        pass

    @abstractmethod
    def cleanup(self) -> None:
        """Cleanup plugin resources"""
        pass

    @classmethod
    def get_plugin(cls, name: str) -> Type['Plugin'] | None:
        return cls._plugins.get(name)

    @classmethod
    def list_plugins(cls) -> list[str]:
        return list(cls._plugins.keys())

class ImageResizePlugin(Plugin):
    name = "image_resize"
    version = "1.0.0"

    def initialize(self) -> bool:
        print("ImageResizePlugin initialized")
        return True

    def execute(self, data: dict) -> dict:
        width = data.get('width', 100)
        height = data.get('height', 100)
        return {'status': 'resized', 'dimensions': f'{width}x{height}'}

    def cleanup(self) -> None:
        print("ImageResizePlugin cleanup")

class ImageFilterPlugin(Plugin):
    name = "image_filter"
    version = "1.0.0"

    def initialize(self) -> bool:
        print("ImageFilterPlugin initialized")
        return True

    def execute(self, data: dict) -> dict:
        filter_name = data.get('filter', 'none')
        return {'status': 'filtered', 'filter': filter_name}

    def cleanup(self) -> None:
        print("ImageFilterPlugin cleanup")

# Plugin manager
class PluginManager:
    def __init__(self):
        self._active_plugins: Dict[str, Plugin] = {}

    def load_plugin(self, name: str) -> bool:
        plugin_cls = Plugin.get_plugin(name)
        if plugin_cls:
            plugin = plugin_cls()
            if plugin.initialize():
                self._active_plugins[name] = plugin
                return True
        return False

    def execute_plugin(self, name: str, data: dict) -> dict | None:
        if name in self._active_plugins:
            return self._active_plugins[name].execute(data)
        return None

    def unload_all(self):
        for plugin in self._active_plugins.values():
            plugin.cleanup()
        self._active_plugins.clear()

# Usage
print(f"Available plugins: {Plugin.list_plugins()}")

manager = PluginManager()
manager.load_plugin("image_resize")
manager.load_plugin("image_filter")

result = manager.execute_plugin("image_resize", {'width': 800, 'height': 600})
print(f"Resize result: {result}")

result = manager.execute_plugin("image_filter", {'filter': 'blur'})
print(f"Filter result: {result}")

manager.unload_all()
```

### Strategy Pattern

```python
from abc import ABC, abstractmethod
from typing import List

class SortStrategy(ABC):
    """Abstract sorting strategy"""

    @abstractmethod
    def sort(self, data: List) -> List:
        """Sort the data and return sorted list"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Strategy name"""
        pass

class QuickSortStrategy(SortStrategy):
    @property
    def name(self) -> str:
        return "QuickSort"

    def sort(self, data: List) -> List:
        if len(data) <= 1:
            return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        middle = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]
        return self.sort(left) + middle + self.sort(right)

class MergeSortStrategy(SortStrategy):
    @property
    def name(self) -> str:
        return "MergeSort"

    def sort(self, data: List) -> List:
        if len(data) <= 1:
            return data

        mid = len(data) // 2
        left = self.sort(data[:mid])
        right = self.sort(data[mid:])

        return self._merge(left, right)

    def _merge(self, left: List, right: List) -> List:
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

class BubbleSortStrategy(SortStrategy):
    @property
    def name(self) -> str:
        return "BubbleSort"

    def sort(self, data: List) -> List:
        arr = list(data)
        n = len(arr)
        for i in range(n):
            for j in range(0, n - i - 1):
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
        return arr

class Sorter:
    """Context class that uses a sorting strategy"""

    def __init__(self, strategy: SortStrategy = None):
        self._strategy = strategy or QuickSortStrategy()

    @property
    def strategy(self) -> SortStrategy:
        return self._strategy

    @strategy.setter
    def strategy(self, strategy: SortStrategy):
        self._strategy = strategy

    def sort(self, data: List) -> List:
        print(f"Sorting with {self._strategy.name}")
        return self._strategy.sort(data)

# Usage
data = [64, 34, 25, 12, 22, 11, 90]

sorter = Sorter()
print(f"QuickSort: {sorter.sort(data)}")

sorter.strategy = MergeSortStrategy()
print(f"MergeSort: {sorter.sort(data)}")

sorter.strategy = BubbleSortStrategy()
print(f"BubbleSort: {sorter.sort(data)}")
```

### Data Validation Framework

```python
from abc import ABC, abstractmethod
from typing import Any, List, Tuple
from dataclasses import dataclass

@dataclass
class ValidationError:
    field: str
    message: str

class Validator(ABC):
    """Abstract base for validators"""

    @abstractmethod
    def validate(self, value: Any) -> Tuple[bool, str | None]:
        """Validate value, return (is_valid, error_message)"""
        pass

class RequiredValidator(Validator):
    def validate(self, value: Any) -> Tuple[bool, str | None]:
        if value is None or value == "":
            return False, "This field is required"
        return True, None

class TypeValidator(Validator):
    def __init__(self, expected_type: type):
        self.expected_type = expected_type

    def validate(self, value: Any) -> Tuple[bool, str | None]:
        if value is not None and not isinstance(value, self.expected_type):
            return False, f"Expected {self.expected_type.__name__}"
        return True, None

class RangeValidator(Validator):
    def __init__(self, min_val: float = None, max_val: float = None):
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, value: Any) -> Tuple[bool, str | None]:
        if value is None:
            return True, None
        if self.min_val is not None and value < self.min_val:
            return False, f"Must be at least {self.min_val}"
        if self.max_val is not None and value > self.max_val:
            return False, f"Must be at most {self.max_val}"
        return True, None

class LengthValidator(Validator):
    def __init__(self, min_len: int = None, max_len: int = None):
        self.min_len = min_len
        self.max_len = max_len

    def validate(self, value: Any) -> Tuple[bool, str | None]:
        if value is None:
            return True, None
        length = len(value)
        if self.min_len is not None and length < self.min_len:
            return False, f"Must be at least {self.min_len} characters"
        if self.max_len is not None and length > self.max_len:
            return False, f"Must be at most {self.max_len} characters"
        return True, None

class PatternValidator(Validator):
    def __init__(self, pattern: str, message: str = None):
        import re
        self.pattern = re.compile(pattern)
        self.message = message or f"Must match pattern {pattern}"

    def validate(self, value: Any) -> Tuple[bool, str | None]:
        if value is None:
            return True, None
        if not self.pattern.match(str(value)):
            return False, self.message
        return True, None

class Field:
    """Field definition with validators"""

    def __init__(self, *validators: Validator):
        self.validators = list(validators)

    def validate(self, value: Any) -> List[str]:
        errors = []
        for validator in self.validators:
            is_valid, error = validator.validate(value)
            if not is_valid:
                errors.append(error)
        return errors

class Schema(ABC):
    """Abstract base for validation schemas"""

    @classmethod
    def validate(cls, data: dict) -> Tuple[bool, List[ValidationError]]:
        errors = []
        for field_name, field in cls._get_fields().items():
            value = data.get(field_name)
            field_errors = field.validate(value)
            for error in field_errors:
                errors.append(ValidationError(field_name, error))
        return len(errors) == 0, errors

    @classmethod
    def _get_fields(cls) -> dict:
        return {
            name: value for name, value in vars(cls).items()
            if isinstance(value, Field)
        }

# Usage
class UserSchema(Schema):
    name = Field(
        RequiredValidator(),
        TypeValidator(str),
        LengthValidator(min_len=2, max_len=50)
    )
    email = Field(
        RequiredValidator(),
        PatternValidator(
            r'^[\w\.-]+@[\w\.-]+\.\w+$',
            "Invalid email format"
        )
    )
    age = Field(
        TypeValidator(int),
        RangeValidator(min_val=0, max_val=150)
    )

# Validate data
valid_data = {"name": "Alice", "email": "alice@example.com", "age": 30}
is_valid, errors = UserSchema.validate(valid_data)
print(f"Valid: {is_valid}, Errors: {errors}")  # Valid: True, Errors: []

invalid_data = {"name": "A", "email": "invalid", "age": 200}
is_valid, errors = UserSchema.validate(invalid_data)
print(f"Valid: {is_valid}")  # Valid: False
for error in errors:
    print(f"  {error.field}: {error.message}")
```

## Best Practices

### Keep Abstract Classes Focused

```python
from abc import ABC, abstractmethod

# Good - focused, single responsibility
class Readable(ABC):
    @abstractmethod
    def read(self) -> str:
        pass

class Writable(ABC):
    @abstractmethod
    def write(self, data: str) -> None:
        pass

# Bad - too many responsibilities
class DoEverything(ABC):
    @abstractmethod
    def read(self):
        pass

    @abstractmethod
    def write(self, data):
        pass

    @abstractmethod
    def validate(self):
        pass

    @abstractmethod
    def transform(self):
        pass

    @abstractmethod
    def send(self):
        pass
```

### Document Abstract Methods Clearly

```python
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def process_payment(self, amount: float, currency: str) -> dict:
        """
        Process a payment transaction.

        Args:
            amount: The payment amount (must be positive)
            currency: ISO 4217 currency code (e.g., 'USD', 'EUR')

        Returns:
            dict with keys:
                - 'success': bool indicating if payment succeeded
                - 'transaction_id': unique identifier for the transaction
                - 'message': human-readable status message

        Raises:
            ValueError: If amount is negative or currency is invalid
            PaymentError: If payment processing fails
        """
        pass
```

### Use Abstract Properties for Required Attributes

```python
from abc import ABC, abstractmethod

class Configurable(ABC):
    @property
    @abstractmethod
    def config_schema(self) -> dict:
        """Return JSON schema for configuration"""
        pass

    @property
    @abstractmethod
    def default_config(self) -> dict:
        """Return default configuration values"""
        pass

    def validate_config(self, config: dict) -> bool:
        """Validate config against schema (concrete method)"""
        # Use config_schema property
        schema = self.config_schema
        # Validation logic here
        return True
```

### Provide Default Implementations When Appropriate

```python
from abc import ABC, abstractmethod

class EventHandler(ABC):
    @abstractmethod
    def handle(self, event: dict) -> None:
        """Handle the event - must be implemented"""
        pass

    def pre_handle(self, event: dict) -> dict:
        """Hook called before handling - can be overridden"""
        return event

    def post_handle(self, event: dict, result: any) -> None:
        """Hook called after handling - can be overridden"""
        pass

    def on_error(self, event: dict, error: Exception) -> None:
        """Error handling hook - default logs the error"""
        print(f"Error handling event: {error}")

    def process(self, event: dict) -> None:
        """Template method - orchestrates the handling"""
        try:
            event = self.pre_handle(event)
            result = self.handle(event)
            self.post_handle(event, result)
        except Exception as e:
            self.on_error(event, e)
```

### Use ABCs for Type Hints

```python
from abc import ABC, abstractmethod
from typing import List

class Repository(ABC):
    @abstractmethod
    def save(self, entity) -> None:
        pass

    @abstractmethod
    def find_by_id(self, id: str):
        pass

# Use ABC in type hints for dependency injection
class UserService:
    def __init__(self, repository: Repository):  # Accept any Repository
        self._repo = repository

    def create_user(self, name: str) -> dict:
        user = {"id": "123", "name": name}
        self._repo.save(user)
        return user
```

### Avoid Deep Inheritance Hierarchies

```python
from abc import ABC, abstractmethod

# Prefer composition over deep inheritance
class Encoder(ABC):
    @abstractmethod
    def encode(self, data: str) -> bytes:
        pass

class Compressor(ABC):
    @abstractmethod
    def compress(self, data: bytes) -> bytes:
        pass

class DataProcessor:
    """Compose behaviors instead of inheriting"""

    def __init__(self, encoder: Encoder, compressor: Compressor):
        self.encoder = encoder
        self.compressor = compressor

    def process(self, data: str) -> bytes:
        encoded = self.encoder.encode(data)
        return self.compressor.compress(encoded)
```

### Test Abstract Classes Properly

```python
from abc import ABC, abstractmethod
import unittest

class Calculator(ABC):
    @abstractmethod
    def calculate(self, a: float, b: float) -> float:
        pass

    def safe_calculate(self, a: float, b: float) -> float | None:
        try:
            return self.calculate(a, b)
        except Exception:
            return None

# Test concrete implementation
class Adder(Calculator):
    def calculate(self, a: float, b: float) -> float:
        return a + b

class TestCalculator(unittest.TestCase):
    def test_cannot_instantiate_abc(self):
        with self.assertRaises(TypeError):
            Calculator()

    def test_concrete_implementation(self):
        adder = Adder()
        self.assertEqual(adder.calculate(2, 3), 5)

    def test_safe_calculate(self):
        adder = Adder()
        self.assertEqual(adder.safe_calculate(2, 3), 5)
```

## Summary

Abstract Base Classes are a powerful tool in Python for defining interfaces and enforcing contracts:

**Key Concepts:**
- **ABC and abstractmethod**: Core tools for creating abstract classes
- **Abstract Properties**: Define required attributes with getters/setters
- **Concrete Methods**: Provide shared implementation in abstract classes
- **Virtual Subclasses**: Register classes as subclasses without inheritance
- **__subclasshook__**: Customize isinstance/issubclass behavior

**When to Use ABCs:**
- Defining interfaces that multiple classes should implement
- Enforcing method implementation at class definition time
- Creating plugin systems and extensible frameworks
- Implementing design patterns (Strategy, Template Method, etc.)
- Type checking with isinstance() and issubclass()

**ABCs vs Alternatives:**
- Use **ABCs** when you need inheritance and shared implementation
- Use **Protocols** for structural subtyping without inheritance
- Use **Duck Typing** when you don't need type checking

**Best Practices:**
- Keep abstract classes focused and cohesive
- Document abstract methods thoroughly
- Provide default implementations where sensible
- Use abstract properties for required attributes
- Prefer composition over deep inheritance
- Test both the ABC contract and concrete implementations

By mastering ABCs, you can write more robust, maintainable Python code with clear interfaces and explicit contracts between components.
