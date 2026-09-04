---
title: Python uuid 模块 - UUID 生成完全指南
description: 深入讲解 Python uuid 模块的各类 UUID 生成方法，包括 UUID1-UUID5 的原理、应用场景和最佳实践。
track: python
section: stdlib
difficulty: beginner
tags:
  - uuid
  - 唯一标识
  - identifier
  - UUID1
  - UUID4
  - UUID5
status: imported
origin: old/src/content/docs/python/uuid.zh.md
divergence: 0.255
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## 概念解释

UUID（Universally Unique Identifier）是一个128位的数值，用于在不同的计算机和系统间唯一识别信息。Python的 `uuid` 模块提供了标准的UUID生成和操作功能。

### UUID 的作用

- **唯一性保证**：在分布式系统中生成全局唯一的标识符
- **无中心依赖**：不需要中央数据库或协调机制
- **跨系统兼容**：标准化的格式易于在不同系统间传输
- **安全性**：某些UUID生成方式提供加密级别的随机性

### UUID 的格式

标准的UUID表示为32个十六进制数字，分为5组，格式为：`8-4-4-4-12`

```
550e8400-e29b-41d4-a716-446655440000
```

## 核心原理

### UUID 的五种版本

**UUID1（基于时间和MAC地址）**
- 由时间戳（60位）、序列号（14位）和节点ID（48位）组成
- 节点ID通常是MAC地址，无法保证隐私
- 生成速度快，但会泄露机器标识和时间信息

**UUID3（基于MD5哈希）**
- 使用命名空间和名称的MD5哈希
- 同一个名称和命名空间总是生成相同的UUID
- 确定性的，可重现

**UUID4（基于随机数）**
- 使用加密级别的随机数生成
- 完全随机，无需任何输入
- 隐私性最好，但冲突概率极低

**UUID5（基于SHA1哈希）**
- 使用命名空间和名称的SHA1哈希
- 比UUID3更安全
- 也是确定性的

**UUID6（基于时间戳，RFC 4122修订）**
- 修改了时间戳的编码方式，使UUID按时间排序
- 在某些版本的Python中支持

## 核心要点

1. **UUID1 vs UUID4**
   - UUID1：有状态，速度快，但泄露隐私
   - UUID4：无状态，完全随机，隐私好

2. **确定性 UUID（UUID3/UUID5）**
   - 相同的命名空间+名称=相同的UUID
   - 适合需要幂等性的场景

3. **命名空间（Namespace）**
   - UUID.NAMESPACE_DNS：DNS命名空间
   - UUID.NAMESPACE_URL：URL命名空间
   - UUID.NAMESPACE_OID：OID命名空间
   - UUID.NAMESPACE_X500：X.500 DN命名空间

4. **UUID 的不可重复性**
   - UUID4碰撞概率极小（大约10^-36）
   - 可以安全地用于全局唯一标识

## 代码示例

### 示例1：生成基础 UUID

```python
import uuid

# UUID4 - 推荐使用（完全随机）
unique_id = uuid.uuid4()
print(f"UUID4: {unique_id}")
print(f"UUID4 字符串: {str(unique_id)}")
print(f"UUID4 十六进制: {unique_id.hex}")

# UUID1 - 基于时间和MAC地址
time_uuid = uuid.uuid1()
print(f"UUID1: {time_uuid}")

# 生成零UUID
zero_uuid = uuid.UUID(int=0)
print(f"零UUID: {zero_uuid}")
```

**输出示例：**
```
UUID4: a7f0e4c5-6f8d-4a3b-9e2c-1d8f7b5a4c3e
UUID4 字符串: a7f0e4c5-6f8d-4a3b-9e2c-1d8f7b5a4c3e
UUID4 十六进制: a7f0e4c56f8d4a3b9e2c1d8f7b5a4c3e
UUID1: 550e8400-e29b-11eb-a716-446655440000
零UUID: 00000000-0000-0000-0000-000000000000
```

### 示例2：命名空间 UUID（UUID3 和 UUID5）

```python
import uuid

# 定义命名空间和名称
namespace = uuid.NAMESPACE_DNS
name = "example.com"

# UUID3 - 使用MD5哈希
uuid3_result = uuid.uuid3(namespace, name)
print(f"UUID3: {uuid3_result}")

# UUID5 - 使用SHA1哈希（推荐）
uuid5_result = uuid.uuid5(namespace, name)
print(f"UUID5: {uuid5_result}")

# 验证确定性 - 相同的输入产生相同的输出
print(f"UUID5 再次生成: {uuid.uuid5(namespace, name)}")
print(f"是否相等: {uuid5_result == uuid.uuid5(namespace, name)}")

# 使用不同的名称
uuid5_different = uuid.uuid5(namespace, "different.com")
print(f"UUID5（不同名称）: {uuid5_different}")
```

**输出示例：**
```
UUID3: d6a2b08d-2db7-3a20-829a-6827e19e4ac0
UUID5: 886313e1-3b8a-5372-9b90-0c9aee199e5d
UUID5 再次生成: 886313e1-3b8a-5372-9b90-0c9aee199e5d
是否相等: True
UUID5（不同名称）: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

### 示例3：UUID 的属性和方法

```python
import uuid

# 生成UUID
my_uuid = uuid.uuid4()

# 访问UUID的各种属性
print(f"UUID: {my_uuid}")
print(f"UUID字符串: {str(my_uuid)}")
print(f"UUID十六进制: {my_uuid.hex}")
print(f"UUID字节: {my_uuid.bytes}")
print(f"UUID整数: {my_uuid.int}")
print(f"UUID字段: {my_uuid.fields}")
print(f"UUID版本: {my_uuid.version}")
print(f"UUID方差: {my_uuid.variant}")
print(f"时间戳（UUID1专用）: {uuid.uuid1().time}")
print(f"节点ID（UUID1专用）: {uuid.uuid1().node}")

# UUID 比较
uuid1 = uuid.uuid4()
uuid2 = uuid.uuid4()
print(f"UUID相等: {uuid1 == uuid2}")
print(f"UUID排序: {sorted([uuid2, uuid1])}")
```

**输出示例：**
```
UUID: 4d0e5e6f-6a9b-4c2d-8e3f-9d7c5b1a2e8f
UUID字符串: 4d0e5e6f-6a9b-4c2d-8e3f-9d7c5b1a2e8f
UUID十六进制: 4d0e5e6f6a9b4c2d8e3f9d7c5b1a2e8f
UUID字节: b'\x4d\x0e^o\x6a\x9b\x4c-\x8e?\x9d|\x5b\x1a.\x8f'
UUID整数: 102929706930325618827318968261906303759
UUID版本: 4
UUID方差: RFC 4122
节点ID: 282301487706369
```

### 示例4：UUID 的解析和验证

```python
import uuid

# 从字符串解析UUID
uuid_string = "550e8400-e29b-41d4-a716-446655440000"
parsed_uuid = uuid.UUID(uuid_string)
print(f"解析的UUID: {parsed_uuid}")

# 从十六进制字符串解析
hex_string = "550e8400e29b41d4a716446655440000"
uuid_from_hex = uuid.UUID(hex=hex_string)
print(f"从十六进制: {uuid_from_hex}")

# 从字节解析
uuid_bytes = b'\x55\x0e\x84\x00\xe2\x9b\x41\xd4\xa7\x16\x44\x66\x55\x44\x00\x00'
uuid_from_bytes = uuid.UUID(bytes=uuid_bytes)
print(f"从字节: {uuid_from_bytes}")

# UUID 验证
def is_valid_uuid(uuid_string):
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False

print(f"有效UUID: {is_valid_uuid('550e8400-e29b-41d4-a716-446655440000')}")
print(f"无效UUID: {is_valid_uuid('invalid-uuid')}")

# 使用 UUID 创建自定义对象
class User:
    def __init__(self, name):
        self.id = uuid.uuid4()
        self.name = name

    def __repr__(self):
        return f"User(id={self.id}, name='{self.name}')"

user = User("Alice")
print(f"用户对象: {user}")
```

**输出示例：**
```
解析的UUID: 550e8400-e29b-41d4-a716-446655440000
从十六进制: 550e8400-e29b-41d4-a716-446655440000
从字节: 550e8400-e29b-41d4-a716-446655440000
有效UUID: True
无效UUID: False
用户对象: User(id=a7f0e4c5-6f8d-4a3b-9e2c-1d8f7b5a4c3e, name='Alice')
```

### 示例5：实战场景 - 数据库ID和日志系统

```python
import uuid
from datetime import datetime
import json

# 场景1：数据库ID生成
class DatabaseRecord:
    def __init__(self, data):
        self.id = str(uuid.uuid4())  # 转为字符串以便存储
        self.data = data
        self.created_at = datetime.now().isoformat()

    def to_dict(self):
        return {
            'id': self.id,
            'data': self.data,
            'created_at': self.created_at
        }

# 创建记录
record1 = DatabaseRecord({'name': 'Alice', 'age': 30})
record2 = DatabaseRecord({'name': 'Bob', 'age': 25})

print("数据库记录:")
print(json.dumps(record1.to_dict(), indent=2))
print(json.dumps(record2.to_dict(), indent=2))

# 场景2：日志系统的请求追踪
class RequestLogger:
    def __init__(self, endpoint):
        self.request_id = uuid.uuid4()
        self.endpoint = endpoint
        self.timestamp = datetime.now()
        self.logs = []

    def log(self, message, level='INFO'):
        log_entry = {
            'request_id': str(self.request_id),
            'timestamp': self.timestamp.isoformat(),
            'level': level,
            'message': message,
            'endpoint': self.endpoint
        }
        self.logs.append(log_entry)
        return log_entry

logger = RequestLogger('/api/users')
logger.log('请求开始')
logger.log('数据库查询完成')
logger.log('返回结果')

print("\n请求日志（带追踪ID）:")
for log in logger.logs:
    print(f"[{log['request_id'][:8]}...] {log['level']}: {log['message']}")

# 场景3：分布式系统中的消息追踪
class DistributedMessage:
    def __init__(self, content, source_service):
        self.message_id = uuid.uuid4()
        self.trace_id = uuid.uuid4()  # 分布式追踪ID
        self.content = content
        self.source_service = source_service

    def serialize(self):
        return {
            'message_id': str(self.message_id),
            'trace_id': str(self.trace_id),
            'content': self.content,
            'source_service': self.source_service
        }

message = DistributedMessage('process order', 'order-service')
print("\n分布式消息:")
print(json.dumps(message.serialize(), indent=2))
```

**输出示例：**
```
数据库记录:
{
  "id": "a7f0e4c5-6f8d-4a3b-9e2c-1d8f7b5a4c3e",
  "data": {
    "name": "Alice",
    "age": 30
  },
  "created_at": "2025-01-07T10:30:45.123456"
}

请求日志（带追踪ID）:
[a7f0e4c5] INFO: 请求开始
[a7f0e4c5] INFO: 数据库查询完成
[a7f0e4c5] INFO: 返回结果

分布式消息:
{
  "message_id": "4d0e5e6f-6a9b-4c2d-8e3f-9d7c5b1a2e8f",
  "trace_id": "c8f5d1a2-9b3e-4f7c-8a6d-2e9f1b4c7d3a",
  "content": "process order",
  "source_service": "order-service"
}
```

## 最佳实践

### 选择合适的 UUID 版本

```python
import uuid

# 推荐使用 UUID4 - 简单、隐私好、高性能
def generate_request_id():
    return str(uuid.uuid4())

# 需要确定性时使用 UUID5
def generate_user_uuid(email):
    # 为相同的邮箱生成相同的UUID，适合幂等操作
    return uuid.uuid5(uuid.NAMESPACE_DNS, email)

# 避免 UUID1 - 泄露机器信息
# 避免 UUID3 - MD5已过时，优先使用UUID5
```

### 正确存储和传输 UUID

```python
import uuid
import json

# 存储为字符串
uuid_obj = uuid.uuid4()
uuid_str = str(uuid_obj)  # '550e8400-e29b-41d4-a716-446655440000'

# 在JSON中传输
data = {
    'id': str(uuid.uuid4()),
    'name': 'Alice'
}
json_data = json.dumps(data)

# 从JSON解析回UUID对象
parsed = json.loads(json_data)
uuid_obj = uuid.UUID(parsed['id'])
```

### UUID 的性能优化

```python
import uuid
import time

# 批量生成UUID时的优化
def generate_uuids_batch(count):
    # 直接使用列表推导式
    return [str(uuid.uuid4()) for _ in range(count)]

# 性能测试
start = time.time()
uuids = generate_uuids_batch(10000)
end = time.time()
print(f"生成10000个UUID耗时: {(end - start) * 1000:.2f}ms")

# 缓存UUID对象
class UUIDCache:
    def __init__(self, size=1000):
        self.cache = [uuid.uuid4() for _ in range(size)]
        self.index = 0

    def get(self):
        result = self.cache[self.index]
        self.index = (self.index + 1) % len(self.cache)
        return result

cache = UUIDCache()
print(f"从缓存获取UUID: {cache.get()}")
```

### 在数据库中使用 UUID

```python
import uuid
from typing import Optional

class UserModel:
    def __init__(self, username: str, email: str, user_id: Optional[str] = None):
        self.id = user_id or str(uuid.uuid4())
        self.username = username
        self.email = email

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

# SQLAlchemy 示例（伪代码）
# from sqlalchemy import Column, String
# class User(Base):
#     __tablename__ = 'users'
#     id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#     username = Column(String(100), unique=True)
#     email = Column(String(100), unique=True)
```

### UUID 验证和错误处理

```python
import uuid
from typing import Union

def safe_uuid(value: Union[str, uuid.UUID]) -> Optional[uuid.UUID]:
    """安全地转换值为UUID对象"""
    if isinstance(value, uuid.UUID):
        return value

    if not isinstance(value, str):
        return None

    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        return None

# 使用示例
valid_uuid = safe_uuid('550e8400-e29b-41d4-a716-446655440000')
invalid_uuid = safe_uuid('not-a-uuid')
print(f"有效UUID: {valid_uuid}")
print(f"无效UUID: {invalid_uuid}")
```

## 常见陷阱

### 混淆 UUID 版本的用途

```python
import uuid

# 错误：为需要唯一性的地方使用UUID1
# UUID1会泄露时间和MAC地址信息
sensitive_id = uuid.uuid1()  # 不安全！

# 正确：使用UUID4
secure_id = uuid.uuid4()  # 随机且安全
```

### UUID 字符串与对象混用

```python
import uuid

# 错误：直接比较字符串和对象
uuid_obj = uuid.uuid4()
uuid_str = str(uuid_obj)
print(uuid_obj == uuid_str)  # False！

# 正确：转换为相同类型后再比较
print(str(uuid_obj) == uuid_str)  # True
print(uuid_obj == uuid.UUID(uuid_str))  # True
```

### 未正确处理 UUID 解析错误

```python
import uuid

# 错误：未处理异常
def process_uuid(uuid_string):
    return uuid.UUID(uuid_string)  # 可能抛出ValueError

# 正确：添加异常处理
def process_uuid_safe(uuid_string):
    try:
        return uuid.UUID(uuid_string)
    except ValueError as e:
        print(f"无效的UUID: {uuid_string}, 错误: {e}")
        return None
```

### 在分布式系统中假设 UUID 完全唯一

```python
import uuid

# 虽然 UUID4 碰撞概率极低，但在极端情况下仍可能发生
# 不能将UUID作为绝对的唯一性保证

# 正确做法：
# 在数据库中使用 UNIQUE 约束
# 定期检查和处理可能的碰撞
# 对于核心业务，考虑使用 UUID + 数据库递增ID的组合
```

### 性能问题：频繁创建 UUID 对象

```python
import uuid

# 不高效：频繁创建对象
def inefficient_approach():
    for _ in range(1000):
        uid = uuid.UUID(str(uuid.uuid4()))  # 重复转换

# 高效：直接使用对象或字符串
def efficient_approach():
    for _ in range(1000):
        uid = str(uuid.uuid4())  # 直接生成字符串
```

## 性能考量

### UUID 生成性能

```python
import uuid
import time

def benchmark_uuid_versions():
    """比较不同UUID版本的性能"""

    iterations = 100000

    # UUID1 性能测试
    start = time.time()
    for _ in range(iterations):
        uuid.uuid1()
    uuid1_time = time.time() - start

    # UUID4 性能测试
    start = time.time()
    for _ in range(iterations):
        uuid.uuid4()
    uuid4_time = time.time() - start

    # UUID5 性能测试
    start = time.time()
    for _ in range(iterations):
        uuid.uuid5(uuid.NAMESPACE_DNS, f"test-{_}")
    uuid5_time = time.time() - start

    print(f"UUID1生成{iterations}次: {uuid1_time:.4f}秒")
    print(f"UUID4生成{iterations}次: {uuid4_time:.4f}秒")
    print(f"UUID5生成{iterations}次: {uuid5_time:.4f}秒")

benchmark_uuid_versions()

# 字符串转换的性能
def benchmark_conversion():
    """UUID对象与字符串的转换性能"""

    iterations = 100000
    uuid_obj = uuid.uuid4()

    # 对象到字符串
    start = time.time()
    for _ in range(iterations):
        str(uuid_obj)
    str_time = time.time() - start

    # 字符串到对象
    uuid_str = str(uuid_obj)
    start = time.time()
    for _ in range(iterations):
        uuid.UUID(uuid_str)
    obj_time = time.time() - start

    print(f"对象转字符串{iterations}次: {str_time:.4f}秒")
    print(f"字符串转对象{iterations}次: {obj_time:.4f}秒")

benchmark_conversion()
```

### 存储考量

```python
import uuid
import sys

# UUID 的存储大小
uuid_obj = uuid.uuid4()

print(f"UUID对象大小: {sys.getsizeof(uuid_obj)} 字节")
print(f"UUID字符串大小: {sys.getsizeof(str(uuid_obj))} 字节")
print(f"UUID字节大小: {sys.getsizeof(uuid_obj.bytes)} 字节")
print(f"UUID十六进制大小: {sys.getsizeof(uuid_obj.hex)} 字节")

# 在数据库中的存储建议
# - 字符串(VARCHAR(36)): 36字节
# - CHAR(36): 36字节
# - BINARY(16): 16字节（最节省空间）
# - UUID类型（某些数据库原生支持）
```

## 实战场景

### 场景1：微服务中的请求追踪

```python
import uuid
import json
from typing import Dict, Any
from datetime import datetime

class RequestTracer:
    """分布式请求追踪"""

    def __init__(self, service_name: str):
        self.service_name = service_name
        self.trace_id = str(uuid.uuid4())
        self.span_id = str(uuid.uuid4())
        self.parent_span_id = None
        self.spans = []

    def start_span(self, operation_name: str) -> Dict[str, Any]:
        """开始一个新的span"""
        span = {
            'span_id': str(uuid.uuid4()),
            'trace_id': self.trace_id,
            'parent_span_id': self.span_id,
            'operation_name': operation_name,
            'service_name': self.service_name,
            'start_time': datetime.now().isoformat(),
            'tags': {}
        }
        self.spans.append(span)
        return span

    def get_context(self) -> Dict[str, str]:
        """获取可用于传递给下一个服务的上下文"""
        return {
            'trace_id': self.trace_id,
            'span_id': self.span_id
        }

# 使用示例
tracer = RequestTracer('user-service')
span1 = tracer.start_span('db_query')
span2 = tracer.start_span('cache_check')

print(json.dumps({
    'trace_context': tracer.get_context(),
    'spans': tracer.spans
}, indent=2, default=str))
```

### 场景2：用户生成的内容系统

```python
import uuid
from typing import Optional
from datetime import datetime

class ContentItem:
    """用户内容项"""

    def __init__(self, user_id: str, content: str, content_type: str = 'text'):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.content = content
        self.content_type = content_type
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.version = str(uuid.uuid4())  # 内容版本ID
        self.metadata = {}

    def update_content(self, new_content: str):
        """更新内容并记录版本"""
        self.content = new_content
        self.updated_at = datetime.now()
        self.version = str(uuid.uuid4())  # 生成新版本ID

class ContentCollection:
    """内容集合"""

    def __init__(self, owner_id: str):
        self.id = str(uuid.uuid4())
        self.owner_id = owner_id
        self.items = {}

    def add_item(self, content: str) -> str:
        """添加内容项，返回ID"""
        item = ContentItem(self.owner_id, content)
        self.items[item.id] = item
        return item.id

    def get_items(self):
        """获取所有项"""
        return list(self.items.values())

# 使用示例
user_id = str(uuid.uuid4())
collection = ContentCollection(user_id)

item_id_1 = collection.add_item("First post")
item_id_2 = collection.add_item("Second post")

print(f"集合ID: {collection.id}")
print(f"集合中的项数: {len(collection.items)}")
for item in collection.get_items():
    print(f"  - {item.id[:8]}...: {item.content}")
```

### 场景3：异步任务队列中的任务追踪

```python
import uuid
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class AsyncTask:
    """异步任务"""

    def __init__(self, task_type: str, payload: Dict[str, Any]):
        self.task_id = str(uuid.uuid4())
        self.task_type = task_type
        self.payload = payload
        self.status = TaskStatus.PENDING
        self.created_at = datetime.now()
        self.started_at = None
        self.completed_at = None
        self.execution_id = None
        self.error = None

    def start(self):
        """开始执行任务"""
        self.status = TaskStatus.RUNNING
        self.started_at = datetime.now()
        self.execution_id = str(uuid.uuid4())  # 每次执行都有唯一ID

    def complete(self):
        """任务完成"""
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now()

    def fail(self, error: str):
        """任务失败"""
        self.status = TaskStatus.FAILED
        self.completed_at = datetime.now()
        self.error = error

    def to_dict(self):
        return {
            'task_id': self.task_id,
            'execution_id': self.execution_id,
            'task_type': self.task_type,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'error': self.error
        }

# 使用示例
task = AsyncTask('send_email', {'to': 'user@example.com', 'subject': 'Welcome'})
print(f"任务创建: {task.task_id}")

task.start()
print(f"执行ID: {task.execution_id}")

task.complete()
print(json.dumps(task.to_dict(), indent=2))
```

## 面试要点

### UUID 和递增ID的对比

**UUID 的优点：**
- 无需中央协调（适合分布式系统）
- 可以离线生成
- 可以跨数据库迁移

**UUID 的缺点：**
- 占用更多存储空间
- 不利于数据库索引（无序）
- 可读性差

**递增ID 的优点：**
- 占用空间小
- 数据库友好（B+树索引）
- 可读性好

**递增ID 的缺点：**
- 需要中央序列号生成器
- 容易泄露业务数据量
- 分布式环境下难以协调

### UUID 碰撞的概率

UUID4 的碰撞概率：
- 生成 10^9 个UUID时，至少有两个相同的概率约为 10^-18
- 在实际应用中，可以忽略不计
- 但在需要绝对安全性的系统中，应配合数据库UNIQUE约束

### 不同数据库中的 UUID 支持

```python
# PostgreSQL - 原生UUID支持
# CREATE TABLE users (
#     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#     name VARCHAR(100)
# );

# MySQL - 使用CHAR(36)或BINARY(16)
# CREATE TABLE users (
#     id CHAR(36) PRIMARY KEY,
#     name VARCHAR(100)
# );

# SQLite - 使用TEXT或BLOB
# CREATE TABLE users (
#     id TEXT PRIMARY KEY,
#     name VARCHAR(100)
# );

# MongoDB - ObjectId 或 UUID
# db.users.insertOne({
#     _id: ObjectId(),
#     name: "Alice"
# });
```

### 面试常见问题

**Q: 为什么选择UUID4而不是UUID1？**
A: UUID4完全随机，不会泄露机器信息和时间戳，隐私性和安全性更好。虽然UUID1生成速度快，但在大多数现代应用中，隐私和安全是首要考虑。

**Q: UUID 能否保证全局唯一性？**
A: UUID4的碰撞概率极低（大约10^-36），在实践中可以认为是唯一的。但为了绝对确保唯一性，应在数据库层面添加UNIQUE约束。

**Q: 什么时候使用UUID5而不是UUID4？**
A: 当需要确定性时使用UUID5。例如，相同的用户邮箱应总是生成相同的UUID，这对于幂等操作（如数据同步）很重要。

**Q: UUID在高并发场景下的性能如何？**
A: UUID4生成的性能很好，单线程可达100k+/s。在分布式系统中，由于无需协调，性能优于递增ID方案。

## 延伸阅读

### 官方文档
- [Python uuid 模块官方文档](https://docs.python.org/3/library/uuid.html)
- [RFC 4122 - UUID 标准](https://tools.ietf.org/html/rfc4122)
- [RFC 6941 - UUID 草稿标准](https://tools.ietf.org/html/draft-faltstrom-uuid-rfc4122bis)

### 相关概念
- [Distributed Tracing - 分布式追踪](https://opentelemetry.io/)
- [OpenTelemetry - 可观测性标准](https://opentelemetry.io/)
- [ULID - 另一种ID生成方案](https://github.com/ulid/spec)
- [Snowflake ID - 分布式ID算法](https://github.com/twitter-archive/snowflake/tree/snowflake-2010)

### 最佳实践资源
- [在分布式系统中选择ID方案](https://instagram-engineering.com/sharding-ids-at-instagram-1577049d6976)
- [数据库中的ID设计](https://www.percona.com/blog/2014/12/11/choosing-good-primary-keys/)
- [微服务中的请求追踪](https://jaegertracing.io/docs/getting-started/)

### 相关库和工具
- [shortuuid - 更短的UUID](https://github.com/skorokithakis/shortuuid)
- [ulid-py - Python ULID实现](https://github.com/ahawker/ulid)
- [uuid6 - UUID6/UUID7实现](https://github.com/oittaa/uuid6-python)
- [nanoid - JavaScript风格的ID生成器](https://github.com/cece/python-nanoid)

### 相关实践主题
- Python 标准库 - 文件I/O、JSON、数据序列化
- 数据库设计 - 主键选择、索引优化
- 分布式系统 - 服务间通信、日志追踪
- Web 开发框架 - FastAPI、Django 中的 UUID 使用
