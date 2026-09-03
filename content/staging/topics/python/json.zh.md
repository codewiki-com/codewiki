---
title: JSON Handling
description: Complete guide to Python JSON, serialization, deserialization and custom encoders
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - JSON
  - Serialization
  - Data Exchange
status: imported
origin: old/src/content/docs/python/json.zh.md
divergence: 0.226
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Standard Library
  order: 27
  lastUpdated: 2026-01-07
---

JSON（JavaScript Object Notation，JavaScript 对象表示法）是一种轻量级、人类可读的数据交换格式，已成为 Web 应用程序、API 和配置文件中数据交换的标准。Python 内置的 `json` 模块提供了简单高效的工具，用于将 Python 对象编码为 JSON 格式（序列化）以及将 JSON 解码回 Python 对象（反序列化）。

## 概述

`json` 模块提供四个主要函数：

- **json.dumps()**：将 Python 对象序列化为 JSON 格式的字符串
- **json.dump()**：将 Python 对象序列化为 JSON 格式的流（文件）
- **json.loads()**：将 JSON 字符串反序列化为 Python 对象
- **json.load()**：将 JSON 流（文件）反序列化为 Python 对象

## 使用 json.dumps() 进行基本序列化

`dumps()` 函数将 Python 对象转换为 JSON 字符串。

### 简单示例

```python
import json

# 序列化字典
data = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}
json_string = json.dumps(data)
print(json_string)
# 输出: {"name": "Alice", "age": 30, "city": "New York"}

# 序列化列表
items = ["apple", "banana", "cherry"]
print(json.dumps(items))
# 输出: ["apple", "banana", "cherry"]

# 序列化嵌套结构
user = {
    "name": "Bob",
    "scores": [85, 90, 78],
    "address": {
        "street": "123 Main St",
        "zip": "10001"
    }
}
print(json.dumps(user))
# 输出: {"name": "Bob", "scores": [85, 90, 78], "address": {"street": "123 Main St", "zip": "10001"}}
```

### 类型映射

Python 类型按如下方式转换为 JSON 类型：

| Python | JSON |
|--------|------|
| dict | object |
| list, tuple | array |
| str | string |
| int, float | number |
| True | true |
| False | false |
| None | null |

```python
import json

data = {
    "string": "hello",
    "integer": 42,
    "float": 3.14,
    "boolean_true": True,
    "boolean_false": False,
    "null_value": None,
    "list": [1, 2, 3],
    "tuple": (4, 5, 6),  # 在 JSON 中变为列表
}

print(json.dumps(data))
# 输出: {"string": "hello", "integer": 42, "float": 3.14, "boolean_true": true, "boolean_false": false, "null_value": null, "list": [1, 2, 3], "tuple": [4, 5, 6]}
```

## 使用 json.loads() 进行基本反序列化

`loads()` 函数解析 JSON 字符串并返回 Python 对象。

```python
import json

# 解析 JSON 对象
json_string = '{"name": "Alice", "age": 30, "active": true}'
data = json.loads(json_string)
print(data)
# 输出: {'name': 'Alice', 'age': 30, 'active': True}
print(type(data))
# 输出: <class 'dict'>

# 解析 JSON 数组
json_array = '[1, 2, 3, "four", null]'
items = json.loads(json_array)
print(items)
# 输出: [1, 2, 3, 'four', None]

# 解析嵌套 JSON
json_nested = '''
{
    "users": [
        {"name": "Alice", "age": 30},
        {"name": "Bob", "age": 25}
    ],
    "count": 2
}
'''
result = json.loads(json_nested)
print(result["users"][0]["name"])
# 输出: Alice
```

## 使用 json.dump() 和 json.load() 进行文件操作

处理文件时，使用 `dump()` 和 `load()` 而不是 `dumps()` 和 `loads()`。

### 将 JSON 写入文件

```python
import json

data = {
    "employees": [
        {"name": "Alice", "department": "Engineering", "salary": 75000},
        {"name": "Bob", "department": "Sales", "salary": 65000},
        {"name": "Charlie", "department": "Marketing", "salary": 60000}
    ],
    "company": "Tech Corp",
    "year": 2024
}

# 写入文件
with open("employees.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

# 带格式化写入以提高可读性
with open("employees_formatted.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)
```

### 从文件读取 JSON

```python
import json

# 从文件读取
with open("employees.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["company"])
# 输出: Tech Corp

for employee in data["employees"]:
    print(f"{employee['name']}: ${employee['salary']}")
# 输出:
# Alice: $75000
# Bob: $65000
# Charlie: $60000
```

### 带错误处理的安全文件读取

```python
import json
from pathlib import Path

def load_json_file(filepath):
    """安全地加载 JSON 文件，带有适当的错误处理。"""
    path = Path(filepath)

    if not path.exists():
        raise FileNotFoundError(f"文件未找到: {filepath}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"{filepath} 中的 JSON 无效: {e}")

# 用法
try:
    config = load_json_file("config.json")
except FileNotFoundError as e:
    print(f"错误: {e}")
except ValueError as e:
    print(f"错误: {e}")
```

## 格式化输出

`indent` 参数用于格式化 JSON 输出以提高人类可读性。

```python
import json

data = {
    "name": "Project Alpha",
    "version": "1.0.0",
    "dependencies": {
        "requests": "2.28.0",
        "numpy": "1.23.0"
    },
    "scripts": {
        "test": "pytest",
        "build": "python setup.py build"
    }
}

# 默认输出（紧凑）
print(json.dumps(data))
# 输出: {"name": "Project Alpha", "version": "1.0.0", "dependencies": {"requests": "2.28.0", "numpy": "1.23.0"}, "scripts": {"test": "pytest", "build": "python setup.py build"}}

# 使用 2 空格缩进的格式化输出
print(json.dumps(data, indent=2))
# 输出:
# {
#   "name": "Project Alpha",
#   "version": "1.0.0",
#   "dependencies": {
#     "requests": "2.28.0",
#     "numpy": "1.23.0"
#   },
#   "scripts": {
#     "test": "pytest",
#     "build": "python setup.py build"
#   }
# }

# 使用 4 空格缩进的格式化输出
print(json.dumps(data, indent=4))

# 使用制表符
print(json.dumps(data, indent="\t"))
```

### 其他格式化选项

```python
import json

data = {"name": "Alice", "age": 30, "scores": [85, 90, 78]}

# sort_keys: 按字母顺序排序字典键
print(json.dumps(data, sort_keys=True, indent=2))
# 输出:
# {
#   "age": 30,
#   "name": "Alice",
#   "scores": [
#     85,
#     90,
#     78
#   ]
# }

# separators: 自定义分隔符以获得紧凑输出
print(json.dumps(data, separators=(",", ":")))
# 输出: {"name":"Alice","age":30,"scores":[85,90,78]}

# 带格式化的分隔符
print(json.dumps(data, indent=2, separators=(", ", ": ")))
```

## 处理不可序列化的类型

默认情况下，JSON 只能处理基本的 Python 类型。对于其他类型，需要自定义序列化。

### 问题所在

```python
import json
from datetime import datetime, date
from decimal import Decimal

# 这些会引发 TypeError
data = {
    "timestamp": datetime.now(),
    "date": date.today(),
    "amount": Decimal("99.99"),
    "data": bytes([1, 2, 3])
}

try:
    json.dumps(data)
except TypeError as e:
    print(f"错误: {e}")
# 错误: Object of type datetime is not JSON serializable
```

### 使用 default 参数

`default` 参数允许您指定一个函数来处理不可序列化的类型。

```python
import json
from datetime import datetime, date
from decimal import Decimal

def json_serializer(obj):
    """默认不可序列化对象的自定义序列化器。"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, bytes):
        return obj.decode("utf-8")
    elif isinstance(obj, set):
        return list(obj)
    raise TypeError(f"类型为 {type(obj).__name__} 的对象不可 JSON 序列化")

data = {
    "timestamp": datetime(2024, 6, 15, 10, 30, 0),
    "date": date(2024, 6, 15),
    "amount": Decimal("99.99"),
    "tags": {"python", "json", "tutorial"}
}

json_string = json.dumps(data, default=json_serializer, indent=2)
print(json_string)
# 输出:
# {
#   "timestamp": "2024-06-15T10:30:00",
#   "date": "2024-06-15",
#   "amount": 99.99,
#   "tags": ["python", "json", "tutorial"]
# }
```

## 自定义 JSON 编码器

对于更复杂的序列化需求，可以通过扩展 `json.JSONEncoder` 创建自定义编码器类。

### 基本自定义编码器

```python
import json
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

class CustomJSONEncoder(json.JSONEncoder):
    """常见 Python 类型的扩展 JSON 编码器。"""

    def default(self, obj):
        if isinstance(obj, datetime):
            return {
                "_type": "datetime",
                "value": obj.isoformat()
            }
        elif isinstance(obj, date):
            return {
                "_type": "date",
                "value": obj.isoformat()
            }
        elif isinstance(obj, Decimal):
            return {
                "_type": "decimal",
                "value": str(obj)
            }
        elif isinstance(obj, UUID):
            return {
                "_type": "uuid",
                "value": str(obj)
            }
        elif isinstance(obj, set):
            return {
                "_type": "set",
                "value": list(obj)
            }
        elif isinstance(obj, bytes):
            return {
                "_type": "bytes",
                "value": obj.hex()
            }
        # 让基类为未知类型引发 TypeError
        return super().default(obj)

# 用法
from uuid import uuid4

data = {
    "id": uuid4(),
    "created": datetime.now(),
    "amount": Decimal("1234.56"),
    "tags": {"important", "urgent"}
}

json_string = json.dumps(data, cls=CustomJSONEncoder, indent=2)
print(json_string)
```

### 数据类编码器

```python
import json
from dataclasses import dataclass, asdict, is_dataclass
from datetime import datetime
from typing import List

@dataclass
class Address:
    street: str
    city: str
    zip_code: str

@dataclass
class Person:
    name: str
    age: int
    email: str
    address: Address
    created_at: datetime

class DataclassJSONEncoder(json.JSONEncoder):
    """处理数据类的 JSON 编码器。"""

    def default(self, obj):
        if is_dataclass(obj):
            return asdict(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# 用法
person = Person(
    name="Alice",
    age=30,
    email="alice@example.com",
    address=Address("123 Main St", "New York", "10001"),
    created_at=datetime.now()
)

json_string = json.dumps(person, cls=DataclassJSONEncoder, indent=2)
print(json_string)
# 输出:
# {
#   "name": "Alice",
#   "age": 30,
#   "email": "alice@example.com",
#   "address": {
#     "street": "123 Main St",
#     "city": "New York",
#     "zip_code": "10001"
#   },
#   "created_at": "2024-06-15T10:30:00.123456"
# }
```

## 自定义 JSON 解码器

要反转自定义编码，可以使用 `object_hook` 参数或创建自定义解码器。

### 使用 object_hook

```python
import json
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

def custom_decoder(dct):
    """从 JSON 恢复 Python 对象的自定义解码器。"""
    if "_type" not in dct:
        return dct

    type_name = dct["_type"]
    value = dct["value"]

    if type_name == "datetime":
        return datetime.fromisoformat(value)
    elif type_name == "date":
        return date.fromisoformat(value)
    elif type_name == "decimal":
        return Decimal(value)
    elif type_name == "uuid":
        return UUID(value)
    elif type_name == "set":
        return set(value)
    elif type_name == "bytes":
        return bytes.fromhex(value)

    return dct

# 往返示例
original = {
    "id": UUID("12345678-1234-5678-1234-567812345678"),
    "created": datetime(2024, 6, 15, 10, 30),
    "amount": Decimal("99.99"),
    "tags": {"python", "json"}
}

# 编码
encoded = json.dumps(original, cls=CustomJSONEncoder)

# 解码
decoded = json.loads(encoded, object_hook=custom_decoder)

print(f"原始 ID 类型: {type(original['id'])}")
print(f"解码后 ID 类型: {type(decoded['id'])}")
print(f"值匹配: {original['id'] == decoded['id']}")
```

### 自定义 JSONDecoder 类

```python
import json
from datetime import datetime

class CustomJSONDecoder(json.JSONDecoder):
    """带特殊处理的自定义 JSON 解码器。"""

    def __init__(self, *args, **kwargs):
        super().__init__(object_hook=self.object_hook, *args, **kwargs)

    def object_hook(self, dct):
        # 将 ISO 格式字符串转换为 datetime
        for key, value in dct.items():
            if isinstance(value, str):
                # 尝试解析为 datetime
                try:
                    if "T" in value and len(value) >= 19:
                        dct[key] = datetime.fromisoformat(value)
                except ValueError:
                    pass
        return dct

# 用法
json_string = '{"name": "Alice", "created": "2024-06-15T10:30:00", "updated": "2024-06-16T14:45:30"}'
data = json.loads(json_string, cls=CustomJSONDecoder)
print(type(data["created"]))
# 输出: <class 'datetime.datetime'>
```

## 处理日期和时间

日期/时间处理是 JSON 序列化中的常见挑战。

### ISO 8601 格式（推荐）

```python
import json
from datetime import datetime, date, time, timezone, timedelta

def datetime_handler(obj):
    """将 datetime 对象转换为 ISO 8601 字符串。"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    elif isinstance(obj, time):
        return obj.isoformat()
    raise TypeError(f"类型为 {type(obj).__name__} 的对象不可 JSON 序列化")

# 各种日期时间格式
data = {
    "datetime": datetime(2024, 6, 15, 10, 30, 45, 123456),
    "date_only": date(2024, 6, 15),
    "time_only": time(10, 30, 45),
    "with_timezone": datetime(2024, 6, 15, 10, 30, tzinfo=timezone.utc),
    "with_offset": datetime(2024, 6, 15, 10, 30, tzinfo=timezone(timedelta(hours=-5)))
}

json_string = json.dumps(data, default=datetime_handler, indent=2)
print(json_string)
# 输出:
# {
#   "datetime": "2024-06-15T10:30:45.123456",
#   "date_only": "2024-06-15",
#   "time_only": "10:30:45",
#   "with_timezone": "2024-06-15T10:30:00+00:00",
#   "with_offset": "2024-06-15T10:30:00-05:00"
# }
```

### Unix 时间戳格式

```python
import json
from datetime import datetime, timezone

def datetime_to_timestamp(obj):
    """将 datetime 转换为 Unix 时间戳。"""
    if isinstance(obj, datetime):
        return obj.timestamp()
    raise TypeError(f"类型为 {type(obj).__name__} 的对象不可 JSON 序列化")

def timestamp_to_datetime(dct):
    """将时间戳字段转换回 datetime。"""
    timestamp_fields = ["created_at", "updated_at", "timestamp"]
    for field in timestamp_fields:
        if field in dct and isinstance(dct[field], (int, float)):
            dct[field] = datetime.fromtimestamp(dct[field], tz=timezone.utc)
    return dct

# 编码
data = {"event": "login", "created_at": datetime.now(timezone.utc)}
encoded = json.dumps(data, default=datetime_to_timestamp)
print(encoded)
# 输出: {"event": "login", "created_at": 1718445045.123456}

# 解码
decoded = json.loads(encoded, object_hook=timestamp_to_datetime)
print(decoded["created_at"])
# 输出: 2024-06-15 10:30:45.123456+00:00
```

## 编码类和对象

### 使用 __dict__

```python
import json

class User:
    def __init__(self, name, email, age):
        self.name = name
        self.email = email
        self.age = age
        self._password = "secret"  # 私有属性

user = User("Alice", "alice@example.com", 30)

# 直接使用 __dict__
print(json.dumps(user.__dict__, indent=2))
# 输出包含 _password

# 过滤私有属性
def serialize_user(obj):
    if isinstance(obj, User):
        return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
    raise TypeError(f"类型为 {type(obj).__name__} 的对象不可 JSON 序列化")

print(json.dumps(user, default=serialize_user, indent=2))
# 输出:
# {
#   "name": "Alice",
#   "email": "alice@example.com",
#   "age": 30
# }
```

### 实现 to_json 和 from_json 方法

```python
import json
from datetime import datetime

class Product:
    def __init__(self, id, name, price, created_at=None):
        self.id = id
        self.name = name
        self.price = price
        self.created_at = created_at or datetime.now()

    def to_json(self):
        """转换为可 JSON 序列化的字典。"""
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_json(cls, data):
        """从 JSON 字典创建实例。"""
        if isinstance(data, str):
            data = json.loads(data)
        return cls(
            id=data["id"],
            name=data["name"],
            price=data["price"],
            created_at=datetime.fromisoformat(data["created_at"])
        )

    def __repr__(self):
        return f"Product({self.id}, {self.name}, {self.price})"

# 序列化
product = Product(1, "Widget", 29.99)
json_string = json.dumps(product.to_json(), indent=2)
print(json_string)

# 反序列化
restored = Product.from_json(json_string)
print(restored)
# 输出: Product(1, Widget, 29.99)
```

### 使用协议类

```python
import json
from typing import Protocol, TypeVar, Type
from datetime import datetime

class JSONSerializable(Protocol):
    """可 JSON 序列化对象的协议。"""

    def to_dict(self) -> dict: ...

    @classmethod
    def from_dict(cls, data: dict) -> "JSONSerializable": ...

T = TypeVar("T", bound=JSONSerializable)

class Order:
    def __init__(self, order_id: str, items: list, total: float, created_at: datetime):
        self.order_id = order_id
        self.items = items
        self.total = total
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "order_id": self.order_id,
            "items": self.items,
            "total": self.total,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Order":
        return cls(
            order_id=data["order_id"],
            items=data["items"],
            total=data["total"],
            created_at=datetime.fromisoformat(data["created_at"])
        )

def save_to_json(obj: JSONSerializable, filepath: str) -> None:
    """将任何 JSONSerializable 对象保存到文件。"""
    with open(filepath, "w") as f:
        json.dump(obj.to_dict(), f, indent=2)

def load_from_json(cls: Type[T], filepath: str) -> T:
    """从文件加载 JSONSerializable 对象。"""
    with open(filepath, "r") as f:
        data = json.load(f)
    return cls.from_dict(data)

# 用法
order = Order("ORD-001", ["Widget", "Gadget"], 59.98, datetime.now())
save_to_json(order, "order.json")
restored = load_from_json(Order, "order.json")
```

## 错误处理

### JSONDecodeError

```python
import json

# 无效 JSON 示例
invalid_jsons = [
    '{"name": "Alice", age: 30}',      # 键缺少引号
    "{'name': 'Alice'}",                # 单引号
    '{"name": "Alice",}',               # 尾随逗号
    '{"name": undefined}',              # undefined 不是有效的 JSON
    '',                                  # 空字符串
    'null',                             # 有效但可能不是预期的
]

for invalid in invalid_jsons:
    try:
        result = json.loads(invalid)
        print(f"已解析: {result}")
    except json.JSONDecodeError as e:
        print(f"解析 '{invalid[:30]}...' 时出错: {e.msg}，位置 {e.pos}")
```

### 全面的错误处理

```python
import json
from pathlib import Path

def safe_load_json(source, default=None):
    """
    安全地从字符串或文件路径加载 JSON。

    参数:
        source: JSON 字符串或文件路径
        default: 加载失败时返回的值

    返回:
        解析后的 JSON 数据或默认值
    """
    try:
        # 检查 source 是否为文件路径
        path = Path(source)
        if path.exists() and path.is_file():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)

        # 尝试作为 JSON 字符串解析
        return json.loads(source)

    except json.JSONDecodeError as e:
        print(f"JSON 解码错误: {e.msg}，第 {e.lineno} 行，第 {e.colno} 列")
        return default
    except FileNotFoundError:
        print(f"文件未找到: {source}")
        return default
    except PermissionError:
        print(f"权限被拒绝: {source}")
        return default
    except Exception as e:
        print(f"意外错误: {e}")
        return default

# 用法
data = safe_load_json('{"valid": true}')
print(data)  # {'valid': True}

data = safe_load_json('invalid json', default={})
print(data)  # {}

data = safe_load_json('/nonexistent/file.json', default={"error": True})
print(data)  # {'error': True}
```

## 使用 JSON API

### 发起 API 请求

```python
import json
import urllib.request
from urllib.error import URLError, HTTPError

def fetch_json(url, headers=None):
    """从 URL 获取 JSON 数据。"""
    request = urllib.request.Request(url)

    if headers:
        for key, value in headers.items():
            request.add_header(key, value)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            data = response.read().decode("utf-8")
            return json.loads(data)
    except HTTPError as e:
        print(f"HTTP 错误 {e.code}: {e.reason}")
        return None
    except URLError as e:
        print(f"URL 错误: {e.reason}")
        return None
    except json.JSONDecodeError as e:
        print(f"JSON 解码错误: {e}")
        return None

# 示例用法
data = fetch_json("https://api.example.com/users")
if data:
    for user in data:
        print(f"{user['name']}: {user['email']}")
```

### 发送 JSON 数据

```python
import json
import urllib.request

def post_json(url, data, headers=None):
    """通过 POST 请求发送 JSON 数据。"""
    json_data = json.dumps(data).encode("utf-8")

    request = urllib.request.Request(url, data=json_data, method="POST")
    request.add_header("Content-Type", "application/json")

    if headers:
        for key, value in headers.items():
            request.add_header(key, value)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response_data = response.read().decode("utf-8")
            return json.loads(response_data)
    except Exception as e:
        print(f"错误: {e}")
        return None

# 示例用法
new_user = {
    "name": "Alice",
    "email": "alice@example.com",
    "role": "admin"
}

result = post_json(
    "https://api.example.com/users",
    new_user,
    headers={"Authorization": "Bearer token123"}
)
```

## 性能技巧

### 不同方法的基准测试

```python
import json
import timeit

# 示例数据
data = {
    "users": [{"id": i, "name": f"User {i}", "active": True} for i in range(1000)],
    "metadata": {"count": 1000, "page": 1}
}

# 基准测试 dumps
json_string = json.dumps(data)

def test_dumps():
    return json.dumps(data)

def test_dumps_sorted():
    return json.dumps(data, sort_keys=True)

def test_dumps_indent():
    return json.dumps(data, indent=2)

print("序列化基准测试（1000 次迭代）:")
print(f"  dumps():            {timeit.timeit(test_dumps, number=1000):.4f}s")
print(f"  dumps(sort_keys):   {timeit.timeit(test_dumps_sorted, number=1000):.4f}s")
print(f"  dumps(indent=2):    {timeit.timeit(test_dumps_indent, number=1000):.4f}s")
```

### 使用 orjson 获得更好的性能

对于性能关键的应用程序，请考虑使用 `orjson`，一个快速的 JSON 库。

```python
# 安装: pip install orjson
import orjson
import json
import timeit

data = {"users": [{"id": i, "name": f"User {i}"} for i in range(1000)]}

def test_json_dumps():
    return json.dumps(data)

def test_orjson_dumps():
    return orjson.dumps(data)

json_string = json.dumps(data)
orjson_bytes = orjson.dumps(data)

def test_json_loads():
    return json.loads(json_string)

def test_orjson_loads():
    return orjson.loads(orjson_bytes)

print("性能对比（10000 次迭代）:")
print(f"  json.dumps():   {timeit.timeit(test_json_dumps, number=10000):.4f}s")
print(f"  orjson.dumps(): {timeit.timeit(test_orjson_dumps, number=10000):.4f}s")
print(f"  json.loads():   {timeit.timeit(test_json_loads, number=10000):.4f}s")
print(f"  orjson.loads(): {timeit.timeit(test_orjson_loads, number=10000):.4f}s")
```

注意：`orjson` 返回字节而不是字符串，并且有不同的默认行为。请查阅其文档了解详情。

### 内存高效的流式处理

对于大型 JSON 文件，请考虑流式处理方法。

```python
import json

def stream_json_array(filepath):
    """
    流式处理 JSON 数组文件，一次生成一个项目。
    适用于不适合放入内存的大文件。
    """
    with open(filepath, "r", encoding="utf-8") as f:
        # 跳过开始的方括号
        char = f.read(1)
        while char.isspace():
            char = f.read(1)

        if char != "[":
            raise ValueError("期望 JSON 数组")

        decoder = json.JSONDecoder()
        buffer = ""

        while True:
            char = f.read(1)
            if not char:
                break

            if char in " \n\r\t,":
                continue

            if char == "]":
                break

            # 读取直到获得完整的 JSON 对象
            buffer = char
            brace_count = 1 if char == "{" else 0
            bracket_count = 1 if char == "[" else 0
            in_string = char == '"'

            while brace_count > 0 or bracket_count > 0 or in_string:
                char = f.read(1)
                if not char:
                    break
                buffer += char

                if char == '"' and buffer[-2] != "\\":
                    in_string = not in_string
                elif not in_string:
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                    elif char == "[":
                        bracket_count += 1
                    elif char == "]":
                        bracket_count -= 1

            if buffer:
                yield json.loads(buffer)

# 用法（用于包含对象数组的文件）
# for item in stream_json_array("large_file.json"):
#     process(item)
```

### 使用 ijson 处理大文件

对于真正的大文件，使用 `ijson` 库进行迭代解析。

```python
# 安装: pip install ijson
import ijson

def process_large_json(filepath):
    """迭代处理大型 JSON 文件。"""
    with open(filepath, "rb") as f:
        # 一次解析 'users' 数组中的一个项目
        for user in ijson.items(f, "users.item"):
            yield user

# 用法
# for user in process_large_json("large_users.json"):
#     print(user["name"])
```

## 常见模式和最佳实践

### 配置文件管理

```python
import json
from pathlib import Path
from typing import Any, Dict

class ConfigManager:
    """管理 JSON 配置文件。"""

    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self._defaults: Dict[str, Any] = {}

    def set_defaults(self, defaults: Dict[str, Any]) -> None:
        """设置默认配置值。"""
        self._defaults = defaults.copy()

    def load(self) -> Dict[str, Any]:
        """从文件加载配置。"""
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                self._config = json.load(f)
        else:
            self._config = {}

        # 与默认值合并
        return {**self._defaults, **self._config}

    def save(self, config: Dict[str, Any]) -> None:
        """将配置保存到文件。"""
        self._config = config
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    def get(self, key: str, default: Any = None) -> Any:
        """获取配置值。"""
        config = self.load()
        return config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """设置配置值。"""
        config = self.load()
        config[key] = value
        self.save(config)

# 用法
config = ConfigManager("~/.myapp/config.json")
config.set_defaults({
    "theme": "light",
    "language": "en",
    "max_items": 100
})

settings = config.load()
print(f"主题: {settings['theme']}")

config.set("theme", "dark")
```

### JSON Schema 验证

```python
import json
from typing import Any, Dict, List, Tuple

def validate_schema(data: Any, schema: Dict) -> Tuple[bool, List[str]]:
    """
    简单的 JSON schema 验证器。

    返回:
        (是否有效, 错误列表) 的元组
    """
    errors = []

    def validate(value, schema, path="root"):
        schema_type = schema.get("type")

        # 类型验证
        type_map = {
            "string": str,
            "number": (int, float),
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict,
            "null": type(None)
        }

        if schema_type and schema_type in type_map:
            expected = type_map[schema_type]
            if not isinstance(value, expected):
                errors.append(f"{path}: 期望 {schema_type}，得到 {type(value).__name__}")
                return

        # 对象属性
        if schema_type == "object" and isinstance(value, dict):
            properties = schema.get("properties", {})
            required = schema.get("required", [])

            for prop in required:
                if prop not in value:
                    errors.append(f"{path}: 缺少必需属性 '{prop}'")

            for prop, prop_schema in properties.items():
                if prop in value:
                    validate(value[prop], prop_schema, f"{path}.{prop}")

        # 数组项
        if schema_type == "array" and isinstance(value, list):
            items_schema = schema.get("items", {})
            for i, item in enumerate(value):
                validate(item, items_schema, f"{path}[{i}]")

        # 字符串约束
        if schema_type == "string" and isinstance(value, str):
            if "minLength" in schema and len(value) < schema["minLength"]:
                errors.append(f"{path}: 字符串太短（最小 {schema['minLength']}）")
            if "maxLength" in schema and len(value) > schema["maxLength"]:
                errors.append(f"{path}: 字符串太长（最大 {schema['maxLength']}）")

        # 数字约束
        if schema_type in ("number", "integer") and isinstance(value, (int, float)):
            if "minimum" in schema and value < schema["minimum"]:
                errors.append(f"{path}: 值太小（最小 {schema['minimum']}）")
            if "maximum" in schema and value > schema["maximum"]:
                errors.append(f"{path}: 值太大（最大 {schema['maximum']}）")

    validate(data, schema)
    return len(errors) == 0, errors

# 定义 schema
user_schema = {
    "type": "object",
    "required": ["name", "email"],
    "properties": {
        "name": {"type": "string", "minLength": 1, "maxLength": 100},
        "email": {"type": "string"},
        "age": {"type": "integer", "minimum": 0, "maximum": 150},
        "roles": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}

# 验证数据
valid_user = {"name": "Alice", "email": "alice@example.com", "age": 30}
is_valid, errors = validate_schema(valid_user, user_schema)
print(f"有效: {is_valid}")  # 有效: True

invalid_user = {"name": "", "age": -5}
is_valid, errors = validate_schema(invalid_user, user_schema)
print(f"有效: {is_valid}")  # 有效: False
print(f"错误: {errors}")
# 错误: ["root: 缺少必需属性 'email'", 'root.name: 字符串太短（最小 1）', 'root.age: 值太小（最小 0）']
```

### JSON Lines 格式

JSON Lines（换行符分隔的 JSON）对于流式处理和日志文件很有用。

```python
import json
from typing import Iterator, Any

def write_jsonl(filepath: str, records: Iterator[Any]) -> int:
    """将记录写入 JSON Lines 文件。"""
    count = 0
    with open(filepath, "w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")
            count += 1
    return count

def read_jsonl(filepath: str) -> Iterator[Any]:
    """从 JSON Lines 文件读取记录。"""
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)

def append_jsonl(filepath: str, record: Any) -> None:
    """向 JSON Lines 文件追加单条记录。"""
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

# 用法
records = [
    {"event": "login", "user": "alice", "timestamp": "2024-06-15T10:30:00"},
    {"event": "purchase", "user": "alice", "amount": 99.99},
    {"event": "logout", "user": "alice", "timestamp": "2024-06-15T11:00:00"}
]

# 写入所有记录
write_jsonl("events.jsonl", iter(records))

# 读取所有记录
for record in read_jsonl("events.jsonl"):
    print(record)

# 追加新记录
append_jsonl("events.jsonl", {"event": "login", "user": "bob"})
```

## 总结

Python 的 `json` 模块提供了处理 JSON 数据的全面工具：

| 函数 | 用途 |
|----------|---------|
| `json.dumps()` | 序列化为 JSON 字符串 |
| `json.dump()` | 序列化到文件 |
| `json.loads()` | 从字符串反序列化 |
| `json.load()` | 从文件反序列化 |

需要记住的关键概念：

- **类型映射**：Python 字典变成 JSON 对象，列表/元组变成数组
- **格式化输出**：使用 `indent` 参数获得可读输出
- **自定义类型**：对于非标准类型使用 `default` 参数或自定义 `JSONEncoder`
- **日期处理**：转换为 ISO 8601 字符串或 Unix 时间戳
- **错误处理**：解析不可信输入时始终捕获 `JSONDecodeError`
- **性能**：对于高性能需求考虑使用 `orjson` 或 `ujson`
- **大文件**：使用 `ijson` 进行流式处理以提高内存效率

## 延伸阅读

- [Python 文档：json](https://docs.python.org/3/library/json.html)
- [JSON 规范](https://www.json.org/)
- [RFC 8259 - JavaScript 对象表示法（JSON）数据交换格式](https://datatracker.ietf.org/doc/html/rfc8259)
- [orjson - 快速 JSON 库](https://github.com/ijl/orjson)
- [ijson - 迭代 JSON 解析器](https://github.com/ICRAR/ijson)
