---
title: Python Classes and Objects
description: "Deep dive into Python OOP: class definition, instantiation, attributes and methods"
track: python
section: objects
difficulty: intermediate
tags:
  - Python
  - OOP
  - Classes
  - Objects
status: imported
origin: old/src/content/docs/python/classes-objects.en.md
divergence: 0.188
issues: []
legacy:
  category: Python
  subcategory: Object-Oriented Programming
  order: 5
  lastUpdated: 2026-01-07
---

Object-Oriented Programming (OOP) is a programming paradigm that organizes code around objects and classes. Python provides robust support for OOP, making it easy to create reusable, maintainable code. We'll cover Python classes and objects in depth, from basic definitions to advanced concepts.

## Understanding Classes and Objects

A **class** is a blueprint or template for creating objects. It defines the structure and behavior that its objects will have. An **object** is an instance of a class - a concrete realization of the class blueprint with its own unique data.

Think of a class as a cookie cutter and objects as the cookies. The cookie cutter defines the shape, but each cookie is a separate entity.

```python
# Class definition
class Dog:
    pass

# Object instantiation
my_dog = Dog()
your_dog = Dog()

# my_dog and your_dog are different objects of the same class
print(type(my_dog))  # <class '__main__.Dog'>
print(my_dog is your_dog)  # False
```

## Class Definition

Classes are defined using the `class` keyword followed by the class name (typically in PascalCase) and a colon. The class body is indented.

```python
class Car:
    """A simple car class"""

    def __init__(self, make, model, year):
        """Initialize car attributes"""
        self.make = make
        self.model = model
        self.year = year

    def get_description(self):
        """Return a formatted description of the car"""
        return f"{self.year} {self.make} {self.model}"
```

The `__init__` method is a special method called a **constructor**. It's automatically invoked when creating a new instance of the class, allowing you to initialize the object's attributes.

### The `self` Parameter

The first parameter of instance methods is conventionally named `self`. It represents the instance of the class and provides access to the instance's attributes and methods. Python automatically passes the instance as the first argument when you call a method.

```python
car = Car("Toyota", "Camry", 2024)
# When you call: car.get_description()
# Python actually calls: Car.get_description(car)
```

## Object Instantiation

Creating an object from a class is called **instantiation**. You instantiate an object by calling the class name as if it were a function, passing any required arguments to `__init__`.

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        return f"Hi, I'm {self.name} and I'm {self.age} years old."

# Instantiating objects
person1 = Person("Alice", 30)
person2 = Person("Bob", 25)

print(person1.introduce())  # Hi, I'm Alice and I'm 30 years old.
print(person2.introduce())  # Hi, I'm Bob and I'm 25 years old.
```

## Instance Attributes

**Instance attributes** are variables that belong to a specific instance of a class. Each object has its own copy of instance attributes, and modifying them on one object doesn't affect other objects.

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

# Each account has its own balance
account1 = BankAccount("Alice", 1000)
account2 = BankAccount("Bob", 500)

print(account1.deposit(200))  # Deposited $200. New balance: $1200
print(account2.balance)        # 500 (unchanged)
```

Instance attributes can be created in `__init__` or dynamically added to objects:

```python
class FlexibleClass:
    def __init__(self, x):
        self.x = x

obj = FlexibleClass(10)
obj.y = 20  # Dynamically adding an attribute
print(obj.y)  # 20
```

## Class Attributes

**Class attributes** are variables that are shared by all instances of a class. They're defined directly in the class body, outside of any methods.

```python
class Employee:
    # Class attribute
    company = "TechCorp"
    employee_count = 0

    def __init__(self, name, position):
        self.name = name  # Instance attribute
        self.position = position  # Instance attribute
        Employee.employee_count += 1

    def get_info(self):
        return f"{self.name} works at {Employee.company} as a {self.position}"

emp1 = Employee("Alice", "Developer")
emp2 = Employee("Bob", "Designer")

print(emp1.get_info())  # Alice works at TechCorp as a Developer
print(emp2.get_info())  # Bob works at TechCorp as a Designer
print(Employee.employee_count)  # 2

# Changing class attribute affects all instances
Employee.company = "NewTech"
print(emp1.get_info())  # Alice works at NewTech as a Developer
```

### Important Note on Class vs Instance Attributes

Be careful when modifying class attributes through an instance. If you assign to an attribute through an instance, Python creates a new instance attribute that shadows the class attribute:

```python
class Example:
    shared = "I'm shared"

obj1 = Example()
obj2 = Example()

print(obj1.shared)  # I'm shared
print(obj2.shared)  # I'm shared

obj1.shared = "I'm not shared anymore"
print(obj1.shared)  # I'm not shared anymore (instance attribute)
print(obj2.shared)  # I'm shared (still using class attribute)
print(Example.shared)  # I'm shared (class attribute unchanged)
```

## Instance Methods

**Instance methods** are functions defined inside a class that operate on instances. They take `self` as the first parameter and can access both instance and class attributes.

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        """Calculate and return the area"""
        return self.width * self.height

    def perimeter(self):
        """Calculate and return the perimeter"""
        return 2 * (self.width + self.height)

    def scale(self, factor):
        """Scale the rectangle by a factor"""
        self.width *= factor
        self.height *= factor

    def __str__(self):
        """String representation of the rectangle"""
        return f"Rectangle({self.width}x{self.height})"

rect = Rectangle(5, 3)
print(rect.area())       # 15
print(rect.perimeter())  # 16
rect.scale(2)
print(rect)              # Rectangle(10x6)
```

### Special Methods (Magic Methods)

Python classes can define special methods that start and end with double underscores. These methods provide special functionality:

```python
class Book:
    def __init__(self, title, author, pages):
        self.title = title
        self.author = author
        self.pages = pages

    def __str__(self):
        """Called by str() and print()"""
        return f"'{self.title}' by {self.author}"

    def __repr__(self):
        """Called by repr() and in interactive mode"""
        return f"Book('{self.title}', '{self.author}', {self.pages})"

    def __len__(self):
        """Called by len()"""
        return self.pages

    def __eq__(self, other):
        """Called by == operator"""
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

## Class Methods

**Class methods** are methods that are bound to the class rather than instances. They're defined using the `@classmethod` decorator and take `cls` as the first parameter instead of `self`.

Class methods are useful for:
- Factory methods (alternative constructors)
- Methods that need to modify class state
- Methods that work with class attributes

```python
class Date:
    def __init__(self, year, month, day):
        self.year = year
        self.month = month
        self.day = day

    @classmethod
    def from_string(cls, date_string):
        """Factory method: create Date from string format 'YYYY-MM-DD'"""
        year, month, day = map(int, date_string.split('-'))
        return cls(year, month, day)

    @classmethod
    def today(cls):
        """Factory method: create Date for today"""
        import datetime
        today = datetime.date.today()
        return cls(today.year, today.month, today.day)

    def __str__(self):
        return f"{self.year:04d}-{self.month:02d}-{self.day:02d}"

# Different ways to create Date objects
date1 = Date(2024, 1, 15)
date2 = Date.from_string("2024-01-15")
date3 = Date.today()

print(date1)  # 2024-01-15
print(date2)  # 2024-01-15
print(date3)  # Current date
```

### Class Methods for Managing Class State

```python
class Pizza:
    menu = []  # Class attribute

    def __init__(self, name, ingredients):
        self.name = name
        self.ingredients = ingredients

    @classmethod
    def add_to_menu(cls, pizza):
        """Add a pizza to the menu"""
        cls.menu.append(pizza)

    @classmethod
    def show_menu(cls):
        """Display all pizzas on the menu"""
        return [pizza.name for pizza in cls.menu]

    def __str__(self):
        return f"{self.name}: {', '.join(self.ingredients)}"

margherita = Pizza("Margherita", ["tomato", "mozzarella", "basil"])
pepperoni = Pizza("Pepperoni", ["tomato", "mozzarella", "pepperoni"])

Pizza.add_to_menu(margherita)
Pizza.add_to_menu(pepperoni)

print(Pizza.show_menu())  # ['Margherita', 'Pepperoni']
```

## Static Methods

**Static methods** are methods that don't receive an implicit first argument (neither `self` nor `cls`). They're defined using the `@staticmethod` decorator and behave like regular functions but belong to the class's namespace.

Static methods are useful for:
- Utility functions related to the class
- Functions that don't need access to instance or class data
- Grouping related functionality

```python
class MathOperations:
    @staticmethod
    def add(x, y):
        """Add two numbers"""
        return x + y

    @staticmethod
    def multiply(x, y):
        """Multiply two numbers"""
        return x * y

    @staticmethod
    def is_even(n):
        """Check if a number is even"""
        return n % 2 == 0

# Can be called without creating an instance
print(MathOperations.add(5, 3))      # 8
print(MathOperations.multiply(4, 7))  # 28
print(MathOperations.is_even(10))     # True
```

### Practical Example: Validator Class

```python
class Validator:
    @staticmethod
    def is_valid_email(email):
        """Basic email validation"""
        return '@' in email and '.' in email.split('@')[1]

    @staticmethod
    def is_valid_password(password):
        """Check if password meets minimum requirements"""
        return (len(password) >= 8 and
                any(c.isupper() for c in password) and
                any(c.isdigit() for c in password))

    @staticmethod
    def is_valid_phone(phone):
        """Check if phone number has valid format"""
        digits = ''.join(filter(str.isdigit, phone))
        return len(digits) == 10

print(Validator.is_valid_email("user@example.com"))  # True
print(Validator.is_valid_password("Pass123"))        # True
print(Validator.is_valid_phone("555-123-4567"))      # True
```

## The Property Decorator

The `@property` decorator allows you to define methods that can be accessed like attributes. This provides a way to add logic to attribute access while maintaining a clean interface.

Properties are useful for:
- Adding validation when setting attributes
- Computing values on-the-fly
- Implementing read-only or write-only attributes
- Maintaining backward compatibility

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    @property
    def celsius(self):
        """Get temperature in Celsius"""
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        """Set temperature in Celsius with validation"""
        if value < -273.15:
            raise ValueError("Temperature below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self):
        """Get temperature in Fahrenheit"""
        return self._celsius * 9/5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        """Set temperature using Fahrenheit"""
        self.celsius = (value - 32) * 5/9

    @property
    def kelvin(self):
        """Get temperature in Kelvin (read-only)"""
        return self._celsius + 273.15

temp = Temperature(25)
print(temp.celsius)     # 25
print(temp.fahrenheit)  # 77.0
print(temp.kelvin)      # 298.15

temp.fahrenheit = 86
print(temp.celsius)     # 30.0

# temp.kelvin = 300  # AttributeError: can't set attribute
```

### Using Properties for Validation

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
        """Computed property"""
        return self._age >= 18

person = Person("john doe", 25)
print(person.name)      # John Doe (auto-capitalized)
print(person.is_adult)  # True

# person.age = -5  # ValueError: Age must be between 0 and 150
```

### Property Deleter

You can also define a deleter for properties:

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

## Access Control and Name Mangling

Python doesn't have true private attributes like some other languages, but it provides conventions and mechanisms for controlling access to class members.

### Naming Conventions

1. **Public attributes**: Regular names (e.g., `name`, `value`)
   - Intended to be part of the public API
   - Can be accessed and modified freely

2. **Protected attributes**: Single underscore prefix (e.g., `_internal`, `_helper`)
   - Convention indicating "internal use"
   - Should not be accessed from outside the class (but can be)
   - Not enforced by Python

3. **Private attributes**: Double underscore prefix (e.g., `__private`, `__secret`)
   - Name mangling is applied
   - Harder to access from outside (but still possible)
   - Used to avoid naming conflicts in inheritance

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner           # Public
        self._account_number = None  # Protected
        self.__pin = "1234"          # Private (name mangled)

    def verify_pin(self, pin):
        """Public method to verify PIN"""
        return self.__pin == pin

    def _generate_statement(self):
        """Protected method - internal use"""
        return "Statement generated"

    def __validate_transaction(self, amount):
        """Private method - name mangled"""
        return amount > 0

account = BankAccount("Alice", 1000)

# Public access
print(account.owner)  # Alice

# Protected access (possible but discouraged)
print(account._account_number)  # None

# Private access (name mangled)
# print(account.__pin)  # AttributeError
print(account.verify_pin("1234"))  # True

# Accessing name-mangled attribute (not recommended)
print(account._BankAccount__pin)  # 1234
```

### Name Mangling Explained

When you use double underscores, Python performs **name mangling** by transforming the name to `_ClassName__attributename`. This prevents accidental access and naming conflicts in inheritance:

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

# Both attributes exist independently due to name mangling
print(child._Parent__private)      # Parent's private
print(child._Child__private)       # Child's private
```

### Using Properties for Access Control

Properties provide a more Pythonic way to control access:

```python
class SecureData:
    def __init__(self, data):
        self.__data = data

    @property
    def data(self):
        """Read-only access to data"""
        return self.__data

    # No setter defined, making it read-only

secure = SecureData("sensitive info")
print(secure.data)  # sensitive info
# secure.data = "new"  # AttributeError: can't set attribute
```

## Best Practices

### Use Meaningful Class Names

```python
# Good
class CustomerAccount:
    pass

# Bad
class CA:
    pass
```

### Keep Classes Focused (Single Responsibility Principle)

```python
# Good: Separate concerns
class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email

class UserAuthentication:
    @staticmethod
    def verify_password(user, password):
        # Authentication logic
        pass

# Bad: Too many responsibilities
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

### Use `__init__` for Initialization

```python
# Good
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price
        self.discount = 0

# Bad: Setting attributes outside __init__
class Product:
    def __init__(self, name):
        self.name = name

product = Product("Item")
product.price = 10  # Harder to track required attributes
```

### Prefer Properties Over Direct Attribute Access for Computed or Validated Data

```python
# Good
class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):
        return 3.14159 * self.radius ** 2

# Bad
class Circle:
    def __init__(self, radius):
        self.radius = radius
        self.area = 3.14159 * radius ** 2  # Not updated if radius changes
```

### Use Class Methods for Alternative Constructors

```python
class Employee:
    def __init__(self, first_name, last_name, salary):
        self.first_name = first_name
        self.last_name = last_name
        self.salary = salary

    @classmethod
    def from_string(cls, emp_string):
        """Create from 'FirstName,LastName,Salary' format"""
        first, last, salary = emp_string.split(',')
        return cls(first, last, int(salary))

    @classmethod
    def from_dict(cls, emp_dict):
        """Create from dictionary"""
        return cls(
            emp_dict['first_name'],
            emp_dict['last_name'],
            emp_dict['salary']
        )

emp1 = Employee("John", "Doe", 50000)
emp2 = Employee.from_string("Jane,Smith,60000")
emp3 = Employee.from_dict({'first_name': 'Bob', 'last_name': 'Wilson', 'salary': 55000})
```

### Document Your Classes

```python
class ShoppingCart:
    """
    A shopping cart that holds items for purchase.

    Attributes:
        items (list): List of items in the cart
        discount_rate (float): Discount percentage (0-100)

    Methods:
        add_item(item, quantity): Add an item to the cart
        remove_item(item): Remove an item from the cart
        get_total(): Calculate total price with discount
    """

    def __init__(self, discount_rate=0):
        """
        Initialize the shopping cart.

        Args:
            discount_rate (float): Discount percentage (default: 0)
        """
        self.items = []
        self.discount_rate = discount_rate

    def add_item(self, item, quantity=1):
        """
        Add an item to the cart.

        Args:
            item (dict): Item with 'name' and 'price' keys
            quantity (int): Number of items to add (default: 1)

        Returns:
            int: Total number of items in cart
        """
        self.items.append({'item': item, 'quantity': quantity})
        return len(self.items)
```

### Use `__str__` and `__repr__` for Better Debugging

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        """User-friendly string representation"""
        return f"Point at ({self.x}, {self.y})"

    def __repr__(self):
        """Developer-friendly representation"""
        return f"Point({self.x}, {self.y})"

point = Point(3, 4)
print(str(point))   # Point at (3, 4)
print(repr(point))  # Point(3, 4)
print(point)        # Point at (3, 4) (uses __str__)
```

## Conclusion

Python's class system provides powerful tools for organizing code through object-oriented programming. Understanding the differences between instance attributes, class attributes, instance methods, class methods, and static methods allows you to design more effective and maintainable code.

Key takeaways:
- **Classes** are blueprints; **objects** are instances of classes
- **Instance attributes** are unique to each object
- **Class attributes** are shared across all instances
- **Instance methods** work with instance data
- **Class methods** work with class data and serve as alternative constructors
- **Static methods** are utility functions that belong to the class namespace
- **Properties** provide controlled access to attributes with validation and computed values
- **Access control** in Python uses naming conventions and name mangling

By mastering these concepts and following best practices, you'll be able to write clean, Pythonic object-oriented code that is both powerful and easy to maintain.
