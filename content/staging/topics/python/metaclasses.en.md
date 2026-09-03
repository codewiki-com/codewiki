---
title: Metaclasses
description: Complete guide to Python metaclasses, class of classes, __new__ and __init__ and class creation
track: python
section: objects
difficulty: advanced
tags:
  - Python
  - Metaclasses
  - metaclass
  - Metaprogramming
status: imported
origin: old/src/content/docs/python/metaclasses.en.md
divergence: 0.224
issues: []
legacy:
  category: Python
  subcategory: Advanced Features
  order: 26
  lastUpdated: 2026-01-07
---

Metaclasses are one of Python's most powerful and often misunderstood features. They allow you to customize class creation, enforce coding standards, and implement sophisticated design patterns. While most Python developers can write excellent code without ever touching metaclasses, understanding them provides deep insight into how Python works internally and unlocks powerful metaprogramming capabilities.

## Understanding Classes as Objects

In Python, everything is an object, including classes themselves. This is a fundamental concept that underlies the entire metaclass system.

### Classes Are Instances Too

When you define a class, Python creates a class object:

```python
class MyClass:
    pass

# MyClass is an object
print(type(MyClass))  # <class 'type'>
print(isinstance(MyClass, object))  # True

# Instances are also objects
instance = MyClass()
print(type(instance))  # <class '__main__.MyClass'>
print(isinstance(instance, object))  # True
```

The hierarchy is:
1. `instance` is an instance of `MyClass`
2. `MyClass` is an instance of `type`
3. Both are instances of `object` (the ultimate base class)

### The type-object Relationship

Python has a unique circular relationship between `type` and `object`:

```python
# object is an instance of type
print(type(object))  # <class 'type'>

# type is a subclass of object
print(issubclass(type, object))  # True
print(isinstance(type, object))  # True

# type is an instance of itself
print(type(type))  # <class 'type'>

# object is the base of all classes (including type)
print(object.__bases__)  # ()
print(type.__bases__)  # (<class 'object'>,)
```

This creates a fascinating bootstrap:
- `object` is the base of all classes (including `type`)
- `type` is the metaclass of all classes (including `object`)
- `type` is an instance of itself

```python
# Visualizing the relationship
print(f"type(object) = {type(object)}")      # <class 'type'>
print(f"type(type) = {type(type)}")          # <class 'type'>
print(f"type.__bases__ = {type.__bases__}")  # (<class 'object'>,)
print(f"object.__bases__ = {object.__bases__}")  # ()
```

## type: The Default Metaclass

A metaclass is simply "a class of a class." Just as a class defines how instances behave, a metaclass defines how classes behave. The built-in `type` is the default metaclass for all Python classes.

### The Dual Nature of type

The `type` function has two distinct forms:

```python
# Form 1: Return the type of an object
print(type(42))        # <class 'int'>
print(type("hello"))   # <class 'str'>
print(type([1, 2, 3])) # <class 'list'>

# Form 2: Create a new class
# type(name, bases, namespace)
MyClass = type('MyClass', (), {'x': 10})
print(MyClass)        # <class '__main__.MyClass'>
print(MyClass.x)      # 10
```

### Equivalence of Class Definitions

These three ways of defining a class are equivalent:

```python
# Standard class definition
class MyClass1:
    x = 10
    def greet(self):
        return "Hello"

# Using type() explicitly
def greet(self):
    return "Hello"

MyClass2 = type('MyClass2', (), {'x': 10, 'greet': greet})

# Using metaclass parameter (explicitly using default)
class MyClass3(metaclass=type):
    x = 10
    def greet(self):
        return "Hello"

# All three work the same way
for cls in [MyClass1, MyClass2, MyClass3]:
    obj = cls()
    print(f"{cls.__name__}: x={cls.x}, greet()={obj.greet()}")
```

## Creating Classes Dynamically with type

Understanding `type()` as a class factory is essential before diving into custom metaclasses.

### Basic Dynamic Class Creation

```python
# Create a simple class dynamically
Person = type(
    'Person',           # class name
    (),                 # base classes (tuple)
    {                   # namespace (attributes and methods)
        'species': 'Human',
        'greet': lambda self: f"Hello, I'm {self.name}"
    }
)

# Add __init__ method
def person_init(self, name, age):
    self.name = name
    self.age = age

Person.__init__ = person_init

# Use the dynamically created class
p = Person("Alice", 30)
print(p.greet())      # Hello, I'm Alice
print(p.species)      # Human
print(Person.species) # Human
```

### Dynamic Class with Inheritance

```python
# Base class
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError

# Create Dog class dynamically, inheriting from Animal
def dog_speak(self):
    return f"{self.name} says Woof!"

Dog = type(
    'Dog',
    (Animal,),  # Inherit from Animal
    {
        'species': 'Canis familiaris',
        'speak': dog_speak
    }
)

# Create Cat class dynamically
Cat = type(
    'Cat',
    (Animal,),
    {
        'species': 'Felis catus',
        'speak': lambda self: f"{self.name} says Meow!"
    }
)

# Use the classes
dog = Dog("Buddy")
cat = Cat("Whiskers")
print(dog.speak())  # Buddy says Woof!
print(cat.speak())  # Whiskers says Meow!
```

### Factory Function for Dynamic Classes

```python
def create_model_class(name, fields):
    """Factory function to create data model classes"""

    def init(self, **kwargs):
        for field in fields:
            setattr(self, field, kwargs.get(field))

    def repr(self):
        attrs = ', '.join(f"{f}={getattr(self, f)!r}" for f in fields)
        return f"{name}({attrs})"

    def to_dict(self):
        return {f: getattr(self, f) for f in fields}

    return type(name, (), {
        '__init__': init,
        '__repr__': repr,
        'to_dict': to_dict,
        '_fields': fields
    })

# Create model classes dynamically
User = create_model_class('User', ['id', 'name', 'email'])
Product = create_model_class('Product', ['id', 'name', 'price'])

# Use them
user = User(id=1, name='Alice', email='alice@example.com')
product = Product(id=101, name='Widget', price=29.99)

print(user)           # User(id=1, name='Alice', email='alice@example.com')
print(product)        # Product(id=101, name='Widget', price=29.99)
print(user.to_dict()) # {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}
```

## Custom Metaclasses

Custom metaclasses allow you to intercept and customize the class creation process.

### Basic Metaclass Definition

A metaclass is created by inheriting from `type`:

```python
class MyMeta(type):
    """A simple custom metaclass"""

    def __new__(mcs, name, bases, namespace):
        print(f"Creating class: {name}")
        # Add a class attribute
        namespace['created_by_meta'] = True
        # Create the class
        return super().__new__(mcs, name, bases, namespace)

# Use the metaclass
class MyClass(metaclass=MyMeta):
    x = 10

# Output: Creating class: MyClass

print(MyClass.x)               # 10
print(MyClass.created_by_meta) # True
```

### Metaclass with Validation

```python
class ValidatedMeta(type):
    """Metaclass that validates class definitions"""

    def __new__(mcs, name, bases, namespace):
        # Skip validation for base classes
        if name == 'ValidatedBase':
            return super().__new__(mcs, name, bases, namespace)

        # Require docstring
        if '__doc__' not in namespace or not namespace['__doc__']:
            raise TypeError(f"Class {name} must have a docstring")

        # Require all public methods to have docstrings
        for key, value in namespace.items():
            if callable(value) and not key.startswith('_'):
                if not value.__doc__:
                    raise TypeError(
                        f"Method {name}.{key}() must have a docstring"
                    )

        return super().__new__(mcs, name, bases, namespace)

class ValidatedBase(metaclass=ValidatedMeta):
    pass

# This works
class GoodClass(ValidatedBase):
    """A well-documented class."""

    def do_something(self):
        """Does something important."""
        pass

# This raises TypeError: Class BadClass must have a docstring
# class BadClass(ValidatedBase):
#     pass
```

### Metaclass with Automatic Registration

```python
class PluginMeta(type):
    """Metaclass that auto-registers plugin classes"""
    plugins = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # Don't register the base class
        if name != 'PluginBase':
            # Use plugin_name if defined, otherwise use class name
            plugin_name = namespace.get('plugin_name', name.lower())
            mcs.plugins[plugin_name] = cls
            print(f"Registered plugin: {plugin_name}")

        return cls

    @classmethod
    def get_plugin(mcs, name):
        return mcs.plugins.get(name)

    @classmethod
    def list_plugins(mcs):
        return list(mcs.plugins.keys())

class PluginBase(metaclass=PluginMeta):
    """Base class for plugins"""
    pass

class JSONPlugin(PluginBase):
    plugin_name = 'json'

    def process(self, data):
        return f"Processing JSON: {data}"

class XMLPlugin(PluginBase):
    plugin_name = 'xml'

    def process(self, data):
        return f"Processing XML: {data}"

class CSVPlugin(PluginBase):
    # Uses default name: csvplugin
    def process(self, data):
        return f"Processing CSV: {data}"

# Check registered plugins
print(PluginMeta.list_plugins())  # ['json', 'xml', 'csvplugin']

# Get and use a plugin
json_plugin = PluginMeta.get_plugin('json')()
print(json_plugin.process('{"key": "value"}'))
```

## The Class Creation Process

Understanding the complete class creation process is crucial for effective metaclass usage.

### Step-by-Step Class Creation

When Python encounters a class definition, it follows these steps:

```python
class TracingMeta(type):
    """Metaclass that traces the creation process"""

    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        print(f"1. __prepare__ called for {name}")
        print(f"   kwargs: {kwargs}")
        # Return the namespace dict (can be customized)
        return super().__prepare__(name, bases, **kwargs)

    def __new__(mcs, name, bases, namespace, **kwargs):
        print(f"2. __new__ called for {name}")
        print(f"   namespace keys: {list(namespace.keys())}")
        cls = super().__new__(mcs, name, bases, namespace)
        print(f"   Created class: {cls}")
        return cls

    def __init__(cls, name, bases, namespace, **kwargs):
        print(f"3. __init__ called for {name}")
        super().__init__(name, bases, namespace)
        print(f"   Class initialized")

    def __call__(cls, *args, **kwargs):
        print(f"4. __call__ called on {cls.__name__}")
        instance = super().__call__(*args, **kwargs)
        print(f"   Instance created: {instance}")
        return instance

class MyClass(metaclass=TracingMeta, custom_param="hello"):
    """A traced class"""

    class_attr = 42

    def __init__(self, value):
        print(f"5. MyClass.__init__ called with {value}")
        self.value = value

# Output during class creation:
# __prepare__ called for MyClass
#    kwargs: {'custom_param': 'hello'}
# __new__ called for MyClass
#    namespace keys: ['__module__', '__qualname__', '__doc__', 'class_attr', '__init__']
#    Created class: <class '__main__.MyClass'>
# __init__ called for MyClass
#    Class initialized

print("\n--- Creating instance ---\n")
obj = MyClass(100)
# Output:
# __call__ called on MyClass
# MyClass.__init__ called with 100
#    Instance created: <__main__.MyClass object at 0x...>
```

### The Complete Sequence

1. **`__prepare__`**: Returns the namespace dict for the class body
2. **Class body execution**: Python executes the class body, populating the namespace
3. **`__new__`**: Creates the class object
4. **`__init__`**: Initializes the class object
5. **`__call__`**: Called when creating instances (invokes instance `__new__` and `__init__`)

## \_\_new\_\_ vs \_\_init\_\_ in Metaclasses

Both `__new__` and `__init__` are called during class creation, but they serve different purposes.

### \_\_new\_\_: Class Creation

`__new__` is responsible for creating and returning the class object:

```python
class ModifyingMeta(type):
    def __new__(mcs, name, bases, namespace):
        # Modify namespace before class creation
        # Add prefix to all non-private attributes
        modified_namespace = {}
        for key, value in namespace.items():
            if not key.startswith('_'):
                modified_namespace[f'prefix_{key}'] = value
            else:
                modified_namespace[key] = value

        # Create class with modified namespace
        return super().__new__(mcs, name, bases, modified_namespace)

class MyClass(metaclass=ModifyingMeta):
    value = 42

    def method(self):
        return "hello"

# Original names don't exist
# print(MyClass.value)  # AttributeError

# Prefixed names work
print(MyClass.prefix_value)      # 42
print(MyClass().prefix_method()) # hello
```

### \_\_init\_\_: Class Initialization

`__init__` is called after the class is created, for additional setup:

```python
class InitializingMeta(type):
    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)

        # Post-creation initialization
        # Count methods in the class
        cls._method_count = sum(
            1 for v in namespace.values()
            if callable(v) and not isinstance(v, type)
        )

        # Store creation time
        import datetime
        cls._created_at = datetime.datetime.now()

        # Build method registry
        cls._methods = [
            name for name, value in namespace.items()
            if callable(value) and not name.startswith('_')
        ]

class MyClass(metaclass=InitializingMeta):
    def method1(self):
        pass

    def method2(self):
        pass

    def _private_method(self):
        pass

print(MyClass._method_count)  # 3 (includes _private_method)
print(MyClass._methods)       # ['method1', 'method2']
print(MyClass._created_at)    # 2026-01-07 ...
```

### When to Use Each

```python
class CombinedMeta(type):
    """Demonstrates when to use __new__ vs __init__"""

    def __new__(mcs, name, bases, namespace):
        # Use __new__ when you need to:
        # - Modify the class namespace before creation
        # - Change the bases
        # - Prevent class creation entirely
        # - Return a different class

        if 'must_have' not in namespace:
            raise TypeError(f"{name} must define 'must_have' attribute")

        return super().__new__(mcs, name, bases, namespace)

    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)

        # Use __init__ when you need to:
        # - Add attributes to the already-created class
        # - Perform registration
        # - Set up relationships between classes
        # - Do any initialization that doesn't affect creation

        cls._validated = True

class ValidClass(metaclass=CombinedMeta):
    must_have = True

print(ValidClass._validated)  # True
```

## The \_\_call\_\_ Method

The `__call__` method in a metaclass controls what happens when you "call" the class to create instances.

### Basic \_\_call\_\_ Override

```python
class InstanceControlMeta(type):
    def __call__(cls, *args, **kwargs):
        print(f"Creating instance of {cls.__name__}")
        print(f"  args: {args}")
        print(f"  kwargs: {kwargs}")

        # Create the instance (calls __new__ and __init__)
        instance = super().__call__(*args, **kwargs)

        print(f"  Instance created: {instance}")
        return instance

class MyClass(metaclass=InstanceControlMeta):
    def __init__(self, x, y):
        self.x = x
        self.y = y

obj = MyClass(10, y=20)
# Output:
# Creating instance of MyClass
#   args: (10,)
#   kwargs: {'y': 20}
#   Instance created: <__main__.MyClass object at 0x...>
```

### Singleton Pattern with \_\_call\_\_

```python
class SingletonMeta(type):
    """Metaclass that ensures only one instance exists per class"""
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            # Create instance only if it doesn't exist
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        print("Initializing database connection...")
        self.connected = True

class Logger(metaclass=SingletonMeta):
    def __init__(self, name="default"):
        print(f"Initializing logger: {name}")
        self.name = name

# Test singleton behavior
db1 = Database()  # Prints: Initializing database connection...
db2 = Database()  # No output - returns existing instance
print(db1 is db2)  # True

log1 = Logger("app")  # Prints: Initializing logger: app
log2 = Logger("other")  # No output - returns existing instance
print(log1 is log2)  # True
print(log2.name)  # "app" - first initialization wins
```

### Object Pool with \_\_call\_\_

```python
class PooledMeta(type):
    """Metaclass that implements object pooling"""

    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)
        cls._pool = []
        cls._pool_size = namespace.get('pool_size', 5)

    def __call__(cls, *args, **kwargs):
        # Try to get an object from the pool
        if cls._pool:
            instance = cls._pool.pop()
            # Reset the instance if it has a reset method
            if hasattr(instance, 'reset'):
                instance.reset(*args, **kwargs)
            return instance

        # Create new instance if pool is empty
        return super().__call__(*args, **kwargs)

    def release(cls, instance):
        """Return an instance to the pool"""
        if len(cls._pool) < cls._pool_size:
            cls._pool.append(instance)

class Connection(metaclass=PooledMeta):
    pool_size = 3

    def __init__(self, host="localhost"):
        print(f"Creating new connection to {host}")
        self.host = host
        self.active = True

    def reset(self, host="localhost"):
        print(f"Resetting connection for {host}")
        self.host = host
        self.active = True

    def close(self):
        self.active = False
        Connection.release(self)

# Create connections
c1 = Connection("server1")  # Creating new connection to server1
c2 = Connection("server2")  # Creating new connection to server2

# Release c1 back to pool
c1.close()

# Get connection from pool (reuses c1)
c3 = Connection("server3")  # Resetting connection for server3
print(c1 is c3)  # True
```

## \_\_prepare\_\_ and Namespace Customization

The `__prepare__` method allows you to customize the namespace dictionary used during class body execution.

### Basic \_\_prepare\_\_ Usage

```python
class OrderedMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        # Return an OrderedDict to preserve definition order
        from collections import OrderedDict
        return OrderedDict()

    def __new__(mcs, name, bases, namespace, **kwargs):
        # Store the definition order
        cls = super().__new__(mcs, name, bases, dict(namespace))
        cls._definition_order = list(namespace.keys())
        return cls

class MyClass(metaclass=OrderedMeta):
    first = 1
    second = 2
    third = 3

    def method_a(self):
        pass

    def method_b(self):
        pass

print(MyClass._definition_order)
# ['__module__', '__qualname__', 'first', 'second', 'third', 'method_a', 'method_b']
```

### Preventing Attribute Redefinition

```python
class NoDuplicateDict(dict):
    """Dictionary that prevents duplicate key assignments"""

    def __setitem__(self, key, value):
        if key in self and not key.startswith('_'):
            raise TypeError(f"Duplicate definition of '{key}'")
        super().__setitem__(key, value)

class StrictMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        return NoDuplicateDict()

    def __new__(mcs, name, bases, namespace, **kwargs):
        return super().__new__(mcs, name, bases, dict(namespace))

# This works
class GoodClass(metaclass=StrictMeta):
    x = 1
    y = 2

# This raises TypeError: Duplicate definition of 'x'
# class BadClass(metaclass=StrictMeta):
#     x = 1
#     x = 2  # Error!
```

### Collecting Decorated Methods

```python
class CollectingDict(dict):
    """Dictionary that collects specially marked items"""

    def __init__(self):
        super().__init__()
        self.collected = {}

    def __setitem__(self, key, value):
        # Check if the value is marked for collection
        if hasattr(value, '_collect_as'):
            category = value._collect_as
            if category not in self.collected:
                self.collected[category] = []
            self.collected[category].append((key, value))
        super().__setitem__(key, value)

def collect(category):
    """Decorator to mark functions for collection"""
    def decorator(func):
        func._collect_as = category
        return func
    return decorator

class CollectorMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        return CollectingDict()

    def __new__(mcs, name, bases, namespace, **kwargs):
        cls = super().__new__(mcs, name, bases, dict(namespace))
        cls._collected = namespace.collected
        return cls

class EventHandler(metaclass=CollectorMeta):
    @collect('startup')
    def on_start(self):
        print("Starting up...")

    @collect('startup')
    def load_config(self):
        print("Loading config...")

    @collect('shutdown')
    def on_stop(self):
        print("Shutting down...")

    @collect('shutdown')
    def save_state(self):
        print("Saving state...")

    def regular_method(self):
        pass

print(EventHandler._collected)
# {'startup': [('on_start', <function>), ('load_config', <function>)],
#  'shutdown': [('on_stop', <function>), ('save_state', <function>)]}

# Run all startup handlers
handler = EventHandler()
for name, method in EventHandler._collected.get('startup', []):
    method(handler)
```

## Practical Use Cases

### ORM (Object-Relational Mapping)

```python
class Field:
    """Base class for ORM fields"""
    def __init__(self, field_type, primary_key=False, nullable=True, default=None):
        self.field_type = field_type
        self.primary_key = primary_key
        self.nullable = nullable
        self.default = default
        self.name = None

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name, self.default)

    def __set__(self, instance, value):
        # Type validation
        if value is not None and not isinstance(value, self.field_type):
            try:
                value = self.field_type(value)
            except (TypeError, ValueError):
                raise TypeError(
                    f"{self.name} must be {self.field_type.__name__}, "
                    f"got {type(value).__name__}"
                )
        instance.__dict__[self.name] = value

class IntegerField(Field):
    def __init__(self, **kwargs):
        super().__init__(int, **kwargs)

class StringField(Field):
    def __init__(self, max_length=255, **kwargs):
        super().__init__(str, **kwargs)
        self.max_length = max_length

class ModelMeta(type):
    """Metaclass for ORM models"""

    def __new__(mcs, name, bases, namespace):
        # Don't process the base Model class
        if name == 'Model':
            return super().__new__(mcs, name, bases, namespace)

        # Collect field definitions
        fields = {}
        for attr_name, attr_value in namespace.items():
            if isinstance(attr_value, Field):
                fields[attr_name] = attr_value

        namespace['_fields'] = fields

        # Auto-generate table name if not provided
        if '_table_name' not in namespace:
            namespace['_table_name'] = name.lower() + 's'

        return super().__new__(mcs, name, bases, namespace)

class Model(metaclass=ModelMeta):
    """Base model class"""

    def __init__(self, **kwargs):
        for field_name, field in self._fields.items():
            value = kwargs.get(field_name, field.default)
            setattr(self, field_name, value)

    def __repr__(self):
        attrs = ', '.join(
            f"{name}={getattr(self, name)!r}"
            for name in self._fields
        )
        return f"{self.__class__.__name__}({attrs})"

    def save(self):
        """Generate INSERT SQL"""
        columns = ', '.join(self._fields.keys())
        values = ', '.join(
            repr(getattr(self, name)) for name in self._fields
        )
        return f"INSERT INTO {self._table_name} ({columns}) VALUES ({values})"

    @classmethod
    def create_table_sql(cls):
        """Generate CREATE TABLE SQL"""
        columns = []
        for name, field in cls._fields.items():
            col_type = {
                int: 'INTEGER',
                str: 'VARCHAR(255)',
                float: 'REAL'
            }.get(field.field_type, 'TEXT')

            parts = [name, col_type]
            if field.primary_key:
                parts.append('PRIMARY KEY')
            if not field.nullable:
                parts.append('NOT NULL')
            columns.append(' '.join(parts))

        return f"CREATE TABLE {cls._table_name} (\n  " + \
               ',\n  '.join(columns) + "\n)"

# Define models using the ORM
class User(Model):
    id = IntegerField(primary_key=True)
    name = StringField(nullable=False)
    email = StringField()
    age = IntegerField(default=0)

class Product(Model):
    _table_name = 'products'  # Custom table name
    id = IntegerField(primary_key=True)
    name = StringField(nullable=False)
    price = IntegerField(default=0)

# Usage
user = User(id=1, name='Alice', email='alice@example.com', age=30)
print(user)
# User(id=1, name='Alice', email='alice@example.com', age=30)

print(user.save())
# INSERT INTO users (id, name, email, age) VALUES (1, 'Alice', 'alice@example.com', 30)

print(User.create_table_sql())
# CREATE TABLE users (
#   id INTEGER PRIMARY KEY,
#   name VARCHAR(255) NOT NULL,
#   email VARCHAR(255),
#   age INTEGER
# )
```

### REST API Framework

```python
import re
from functools import wraps

class EndpointMeta(type):
    """Metaclass for API endpoint registration"""

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # Don't process base class
        if name == 'APIResource':
            cls._endpoints = {}
            return cls

        # Collect endpoints from this class
        endpoints = {}
        for attr_name, attr_value in namespace.items():
            if hasattr(attr_value, '_endpoint_info'):
                info = attr_value._endpoint_info
                key = (info['method'], info['path'])
                endpoints[key] = {
                    'handler': attr_value,
                    'name': attr_name,
                    **info
                }

        # Inherit parent endpoints
        for base in bases:
            if hasattr(base, '_endpoints'):
                for key, value in base._endpoints.items():
                    if key not in endpoints:
                        endpoints[key] = value

        cls._endpoints = endpoints
        return cls

def endpoint(method, path):
    """Decorator to register an endpoint"""
    def decorator(func):
        func._endpoint_info = {
            'method': method.upper(),
            'path': path,
            'params': _extract_params(path)
        }
        return func
    return decorator

def _extract_params(path):
    """Extract path parameters like {id} from path"""
    return re.findall(r'\{(\w+)\}', path)

# Convenience decorators
def get(path):
    return endpoint('GET', path)

def post(path):
    return endpoint('POST', path)

def put(path):
    return endpoint('PUT', path)

def delete(path):
    return endpoint('DELETE', path)

class APIResource(metaclass=EndpointMeta):
    """Base class for API resources"""

    @classmethod
    def get_routes(cls):
        """Get all registered routes"""
        routes = []
        for (method, path), info in cls._endpoints.items():
            routes.append({
                'method': method,
                'path': path,
                'handler': info['name'],
                'params': info['params']
            })
        return routes

    def dispatch(self, method, path, **kwargs):
        """Dispatch a request to the appropriate handler"""
        for (m, p), info in self._endpoints.items():
            if m == method.upper() and self._match_path(p, path):
                handler = getattr(self, info['name'])
                # Extract path params
                path_params = self._extract_path_params(p, path)
                return handler(**path_params, **kwargs)
        raise ValueError(f"No handler for {method} {path}")

    def _match_path(self, pattern, path):
        """Check if path matches pattern"""
        pattern_re = re.sub(r'\{(\w+)\}', r'([^/]+)', pattern)
        return re.match(f'^{pattern_re}$', path) is not None

    def _extract_path_params(self, pattern, path):
        """Extract parameter values from path"""
        params = _extract_params(pattern)
        pattern_re = re.sub(r'\{(\w+)\}', r'([^/]+)', pattern)
        match = re.match(pattern_re, path)
        if match:
            return dict(zip(params, match.groups()))
        return {}

# Define API resources
class UserAPI(APIResource):
    def __init__(self):
        self.users = {}

    @get('/users')
    def list_users(self):
        return list(self.users.values())

    @get('/users/{id}')
    def get_user(self, id):
        return self.users.get(id, {'error': 'Not found'})

    @post('/users')
    def create_user(self, data=None):
        user_id = str(len(self.users) + 1)
        self.users[user_id] = {'id': user_id, **(data or {})}
        return self.users[user_id]

    @put('/users/{id}')
    def update_user(self, id, data=None):
        if id in self.users:
            self.users[id].update(data or {})
            return self.users[id]
        return {'error': 'Not found'}

    @delete('/users/{id}')
    def delete_user(self, id):
        return self.users.pop(id, {'error': 'Not found'})

# Usage
api = UserAPI()

# Show registered routes
for route in UserAPI.get_routes():
    print(f"{route['method']:6} {route['path']:20} -> {route['handler']}")

# Dispatch requests
print(api.dispatch('POST', '/users', data={'name': 'Alice'}))
print(api.dispatch('POST', '/users', data={'name': 'Bob'}))
print(api.dispatch('GET', '/users'))
print(api.dispatch('GET', '/users/1'))
print(api.dispatch('PUT', '/users/1', data={'name': 'Alice Updated'}))
print(api.dispatch('DELETE', '/users/2'))
```

### Validation Framework

```python
class ValidatorMeta(type):
    """Metaclass for automatic validation"""

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # Collect validators from annotations
        validators = {}
        annotations = namespace.get('__annotations__', {})

        for attr_name, attr_type in annotations.items():
            validators[attr_name] = []

            # Check for Validator instances in class attributes
            if attr_name in namespace and isinstance(namespace[attr_name], Validator):
                validators[attr_name].append(namespace[attr_name])

            # Add type validator
            validators[attr_name].append(TypeValidator(attr_type))

        cls._validators = validators
        return cls

    def __call__(cls, *args, **kwargs):
        instance = super().__call__(*args, **kwargs)
        # Validate after creation
        instance._validate()
        return instance

class Validator:
    """Base validator class"""
    def validate(self, name, value):
        raise NotImplementedError

class TypeValidator(Validator):
    def __init__(self, expected_type):
        self.expected_type = expected_type

    def validate(self, name, value):
        if value is not None and not isinstance(value, self.expected_type):
            raise TypeError(
                f"{name} must be {self.expected_type.__name__}, "
                f"got {type(value).__name__}"
            )

class RangeValidator(Validator):
    def __init__(self, min_val=None, max_val=None):
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, name, value):
        if self.min_val is not None and value < self.min_val:
            raise ValueError(f"{name} must be >= {self.min_val}")
        if self.max_val is not None and value > self.max_val:
            raise ValueError(f"{name} must be <= {self.max_val}")

class LengthValidator(Validator):
    def __init__(self, min_len=None, max_len=None):
        self.min_len = min_len
        self.max_len = max_len

    def validate(self, name, value):
        if self.min_len is not None and len(value) < self.min_len:
            raise ValueError(f"{name} must have at least {self.min_len} characters")
        if self.max_len is not None and len(value) > self.max_len:
            raise ValueError(f"{name} must have at most {self.max_len} characters")

class PatternValidator(Validator):
    def __init__(self, pattern, message=None):
        self.pattern = re.compile(pattern)
        self.message = message or f"must match pattern {pattern}"

    def validate(self, name, value):
        if not self.pattern.match(value):
            raise ValueError(f"{name} {self.message}")

class ValidatedModel(metaclass=ValidatorMeta):
    """Base class for validated models"""

    def _validate(self):
        for attr_name, validators in self._validators.items():
            if hasattr(self, attr_name):
                value = getattr(self, attr_name)
                for validator in validators:
                    validator.validate(attr_name, value)

    def __setattr__(self, name, value):
        super().__setattr__(name, value)
        if name in self._validators:
            for validator in self._validators[name]:
                validator.validate(name, value)

# Define validated model
class User(ValidatedModel):
    name: str = LengthValidator(min_len=2, max_len=50)
    age: int = RangeValidator(min_val=0, max_val=150)
    email: str = PatternValidator(
        r'^[\w\.-]+@[\w\.-]+\.\w+$',
        "must be a valid email address"
    )

    def __init__(self, name, age, email):
        self.name = name
        self.age = age
        self.email = email

# Valid user
user = User("Alice", 30, "alice@example.com")
print(f"Created: {user.name}, {user.age}, {user.email}")

# Invalid cases
try:
    User("A", 30, "alice@example.com")  # Name too short
except ValueError as e:
    print(f"Validation error: {e}")

try:
    User("Alice", 200, "alice@example.com")  # Age out of range
except ValueError as e:
    print(f"Validation error: {e}")

try:
    User("Alice", 30, "invalid-email")  # Invalid email
except ValueError as e:
    print(f"Validation error: {e}")
```

### Interface/Contract Enforcement

```python
class InterfaceMeta(type):
    """Metaclass that enforces interface implementation"""

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)

        # Collect required methods from base interfaces
        required_methods = set()
        for base in bases:
            if hasattr(base, '_required_methods'):
                required_methods.update(base._required_methods)

        # Check for @abstractmethod decorators
        for attr_name, attr_value in namespace.items():
            if hasattr(attr_value, '_is_abstract'):
                required_methods.add(attr_name)

        # Remove implemented methods
        for attr_name in namespace:
            if attr_name in required_methods:
                if not hasattr(namespace[attr_name], '_is_abstract'):
                    required_methods.discard(attr_name)

        cls._required_methods = required_methods
        cls._is_interface = len(required_methods) > 0

        return cls

    def __call__(cls, *args, **kwargs):
        if cls._required_methods:
            raise TypeError(
                f"Cannot instantiate interface {cls.__name__}. "
                f"Missing implementations: {', '.join(cls._required_methods)}"
            )
        return super().__call__(*args, **kwargs)

def abstractmethod(func):
    """Mark a method as abstract"""
    func._is_abstract = True
    return func

class Interface(metaclass=InterfaceMeta):
    """Base class for interfaces"""
    pass

# Define interfaces
class Serializable(Interface):
    @abstractmethod
    def serialize(self):
        """Serialize the object to bytes"""
        pass

    @abstractmethod
    def deserialize(self, data):
        """Deserialize from bytes"""
        pass

class Comparable(Interface):
    @abstractmethod
    def compare_to(self, other):
        """Compare to another object"""
        pass

# Implement interfaces
class JSONData(Serializable, Comparable):
    def __init__(self, data):
        self.data = data

    def serialize(self):
        import json
        return json.dumps(self.data).encode()

    def deserialize(self, data):
        import json
        self.data = json.loads(data.decode())
        return self

    def compare_to(self, other):
        return len(str(self.data)) - len(str(other.data))

# Usage
data = JSONData({'key': 'value'})
print(data.serialize())  # b'{"key": "value"}'

# This will raise TypeError
# Serializable()  # Cannot instantiate interface
```

## \_\_init_subclass\_\_: A Simpler Alternative

Python 3.6 introduced `__init_subclass__`, which provides a simpler way to customize subclass creation without needing a full metaclass.

### Basic Usage

```python
class Plugin:
    """Base class that registers plugins"""
    plugins = {}

    def __init_subclass__(cls, plugin_name=None, **kwargs):
        super().__init_subclass__(**kwargs)

        # Register the plugin
        name = plugin_name or cls.__name__.lower()
        cls.plugins[name] = cls
        print(f"Registered plugin: {name}")

    @classmethod
    def get_plugin(cls, name):
        return cls.plugins.get(name)

class AudioPlugin(Plugin, plugin_name='audio'):
    def process(self, data):
        return f"Processing audio: {data}"

class VideoPlugin(Plugin, plugin_name='video'):
    def process(self, data):
        return f"Processing video: {data}"

class ImagePlugin(Plugin):  # Uses default name: imageplugin
    def process(self, data):
        return f"Processing image: {data}"

print(Plugin.plugins)
# {'audio': <class 'AudioPlugin'>, 'video': <class 'VideoPlugin'>, 'imageplugin': <class 'ImagePlugin'>}
```

### Enforcing Subclass Requirements

```python
class Configurable:
    """Base class that requires certain attributes in subclasses"""
    required_config = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        # Check for required configuration
        missing = []
        for attr in cls.required_config:
            if not hasattr(cls, attr):
                missing.append(attr)

        if missing:
            raise TypeError(
                f"{cls.__name__} must define: {', '.join(missing)}"
            )

class DatabaseConfig(Configurable):
    required_config = ['host', 'port', 'database']

# This works
class PostgresConfig(DatabaseConfig):
    host = 'localhost'
    port = 5432
    database = 'mydb'

# This raises TypeError
# class IncompleteConfig(DatabaseConfig):
#     host = 'localhost'
#     # Missing port and database
```

### Combining with Metaclasses

```python
class TrackedMeta(type):
    """Metaclass that tracks all classes"""
    all_classes = []

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        mcs.all_classes.append(cls)
        return cls

class Base(metaclass=TrackedMeta):
    """Base class with both metaclass and __init_subclass__"""
    subclass_count = 0

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Base.subclass_count += 1
        cls.subclass_number = Base.subclass_count

class First(Base):
    pass

class Second(Base):
    pass

print(First.subclass_number)   # 1
print(Second.subclass_number)  # 2
print(Base.subclass_count)     # 2
print(TrackedMeta.all_classes) # [Base, First, Second]
```

### When to Choose \_\_init_subclass\_\_ vs Metaclasses

**Use `__init_subclass__` when:**
- You only need to customize subclasses (not the base class)
- You want simpler, more readable code
- You're adding attributes or performing registration
- You don't need to modify the class creation process itself

**Use metaclasses when:**
- You need to control the base class creation
- You need to modify the namespace before class creation
- You need to intercept instance creation (`__call__`)
- You need `__prepare__` for custom namespace behavior
- You're building complex frameworks

```python
# __init_subclass__ is simpler for many cases
class SimpleRegistry:
    _registry = {}

    def __init_subclass__(cls, key=None, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._registry[key or cls.__name__] = cls

# Metaclass needed for more control
class ComplexMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases):
        return OrderedDict()  # Can't do this with __init_subclass__

    def __call__(cls, *args, **kwargs):
        # Control instance creation
        instance = super().__call__(*args, **kwargs)
        instance._created_at = time.time()
        return instance
```

## Best Practices and When to Use Metaclasses

### The Golden Rule

Tim Peters, author of the Zen of Python, famously said: "Metaclasses are deeper magic than 99% of users should ever worry about. If you wonder whether you need them, you don't."

### When to Use Metaclasses

Use metaclasses when you need to:

1. **Control class creation** - Modify or validate the class before it's created
2. **Enforce coding standards** - Require docstrings, naming conventions, etc.
3. **Automatic registration** - Register classes in a framework registry
4. **ORM/API frameworks** - Build sophisticated mapping systems
5. **Interface enforcement** - Ensure abstract methods are implemented
6. **Singleton pattern** - Control instance creation at the class level

### Alternatives to Consider First

Before reaching for metaclasses, consider these simpler alternatives:

```python
# Class decorators - for simple modifications
def add_logging(cls):
    original_init = cls.__init__
    def new_init(self, *args, **kwargs):
        print(f"Creating {cls.__name__}")
        original_init(self, *args, **kwargs)
    cls.__init__ = new_init
    return cls

@add_logging
class MyClass:
    def __init__(self, x):
        self.x = x

# __init_subclass__ - for subclass customization
class Base:
    def __init_subclass__(cls, **kwargs):
        cls.created = True

# Descriptors - for attribute access control
class ValidatedAttribute:
    def __set_name__(self, owner, name):
        self.name = name

    def __set__(self, instance, value):
        if not isinstance(value, int):
            raise TypeError(f"{self.name} must be int")
        instance.__dict__[self.name] = value

# __new__ in the class itself - for instance control
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

### Best Practices for Metaclass Design

```python
# Keep metaclasses simple and focused
class SimpleMeta(type):
    """Does one thing well"""
    def __new__(mcs, name, bases, namespace):
        namespace['_tracked'] = True
        return super().__new__(mcs, name, bases, namespace)

# Always call super().__new__ and super().__init__
class ProperMeta(type):
    def __new__(mcs, name, bases, namespace):
        # Your customization here
        return super().__new__(mcs, name, bases, namespace)  # Always call super

    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)  # Always call super

# Document the metaclass behavior thoroughly
class DocumentedMeta(type):
    """
    Metaclass for automatic method registration.

    This metaclass:
    - Scans class methods for the @register decorator
    - Builds a registry of decorated methods
    - Adds a class method to list all registered methods

    Example:
        class MyClass(metaclass=DocumentedMeta):
            @register
            def my_method(self):
                pass
    """
    pass

# Handle inheritance properly
class InheritanceSafeMeta(type):
    def __new__(mcs, name, bases, namespace):
        # Collect inherited values
        inherited = {}
        for base in bases:
            if hasattr(base, '_registry'):
                inherited.update(base._registry)

        # Add new values
        registry = dict(inherited)
        # ... process namespace

        cls = super().__new__(mcs, name, bases, namespace)
        cls._registry = registry
        return cls

# Make metaclasses composable
class MetaA(type):
    def __new__(mcs, name, bases, namespace):
        namespace['from_a'] = True
        return super().__new__(mcs, name, bases, namespace)

class MetaB(type):
    def __new__(mcs, name, bases, namespace):
        namespace['from_b'] = True
        return super().__new__(mcs, name, bases, namespace)

class CombinedMeta(MetaA, MetaB):
    """Combine multiple metaclasses"""
    def __new__(mcs, name, bases, namespace):
        return super().__new__(mcs, name, bases, namespace)
```

### Common Pitfalls

```python
# Metaclass conflicts
class Meta1(type):
    pass

class Meta2(type):
    pass

class A(metaclass=Meta1):
    pass

# This fails! TypeError: metaclass conflict
# class B(A, metaclass=Meta2):
#     pass

# Solution: Create a combined metaclass
class CombinedMeta(Meta1, Meta2):
    pass

class B(A, metaclass=CombinedMeta):
    pass

# Forgetting to call super()
class BrokenMeta(type):
    def __new__(mcs, name, bases, namespace):
        cls = type.__new__(mcs, name, bases, namespace)  # Works but breaks inheritance
        return cls

class BetterMeta(type):
    def __new__(mcs, name, bases, namespace):
        return super().__new__(mcs, name, bases, namespace)  # Correct

# Modifying namespace incorrectly
class WrongMeta(type):
    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)
        # Too late to modify namespace here - class is already created
        namespace['too_late'] = True  # This won't work

class RightMeta(type):
    def __new__(mcs, name, bases, namespace):
        # Modify namespace before class creation
        namespace['early_enough'] = True
        return super().__new__(mcs, name, bases, namespace)
```

## Conclusion

Metaclasses are a powerful but advanced feature of Python that allow you to customize class creation and behavior. They are the foundation of many Python frameworks and libraries, enabling sophisticated patterns like ORMs, validation systems, and plugin architectures.

**Key Takeaways:**

1. **Classes are objects** - Understanding that classes are instances of metaclasses is fundamental
2. **`type` is the default metaclass** - All classes are created by `type` unless you specify otherwise
3. **`__new__` creates, `__init__` initializes** - Know when to use each in your metaclass
4. **`__call__` controls instantiation** - Use it for singleton, pooling, or validation patterns
5. **`__prepare__` customizes the namespace** - Useful for ordering or validation during class definition
6. **Consider alternatives first** - Class decorators, `__init_subclass__`, and descriptors are often simpler
7. **Use metaclasses for frameworks** - They shine in building reusable, extensible systems

While most Python code doesn't need metaclasses, understanding them deepens your knowledge of Python's object model and gives you the tools to build sophisticated frameworks when needed. When you do use them, keep them simple, document them well, and always consider whether a simpler approach might suffice.

Remember: "Simple is better than complex, but complex is better than complicated." Use metaclasses wisely, and they can make your code more elegant and maintainable. Use them unwisely, and they can make your code incomprehensible. Choose the right tool for the job.
