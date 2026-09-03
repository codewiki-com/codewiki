---
title: Python Copy 模块：浅拷贝与深拷贝
description: 掌握 Python 的 copy 模块，理解浅拷贝与深拷贝、引用语义和正确的对象复制策略
track: python
section: basics
difficulty: intermediate
tags:
  - Python
  - copy
  - shallow copy
  - deep copy
  - object duplication
  - references
status: imported
origin: old/src/content/docs/python/copy.zh.md
divergence: 0.209
issues: []
legacy:
  category: Python
  subcategory: Data Structures
  order: 28
  lastUpdated: 2026-01-07
---

`copy` 模块对于理解 Python 如何处理对象复制至关重要。当处理像列表、字典和自定义类这样的可变对象时，理解浅拷贝和深拷贝之间的区别对于避免意外的 bug 和数据损坏至关重要。本综合指南涵盖了你需要了解的关于 Python 复制的所有内容，从基本概念到高级技术和实际场景。

## 概念解释

### 什么是 Copy 模块？

Python 中的 `copy` 模块提供了创建对象副本的函数。它区分两种类型的复制：

1. **浅拷贝**：创建新对象但不递归复制嵌套对象
2. **深拷贝**：创建完全独立的副本，包括所有嵌套对象

### 赋值与复制

在深入 copy 模块之前，理解 Python 中复制的实际含义很重要：

```python
# 赋值 - 创建引用，而不是副本
original = [1, 2, 3]
reference = original
reference.append(4)
print(original)  # [1, 2, 3, 4] - 原始对象被修改了！

# 两个变量指向内存中的同一个对象
print(original is reference)  # True
```

### 为什么需要复制？

考虑这个问题：

```python
# 问题：我们想修改列表而不改变原始对象
data = [1, 2, [3, 4]]
modified = data  # 这不会创建副本！
modified[2].append(5)
print(data)  # [1, 2, [3, 4, 5]] - 糟糕，原始对象被修改了！
```

copy 模块通过提供适当的复制机制来解决这个问题。

## 核心原则

### 原则 1：Python 中的引用语义

Python 对所有对象使用引用语义。当你将对象赋值给变量时，你是在创建对该对象在内存中的引用，而不是创建副本：

```python
import copy

original = {'name': 'Alice', 'scores': [90, 85, 88]}

# 引用：两个变量指向同一对象
ref = original
print(ref is original)  # True

# 浅拷贝：新容器，共享嵌套对象
shallow = copy.copy(original)
print(shallow is original)  # False
print(shallow == original)  # True
print(shallow['scores'] is original['scores'])  # True（嵌套对象共享）

# 深拷贝：完全独立
deep = copy.deepcopy(original)
print(deep is original)  # False
print(deep['scores'] is original['scores'])  # False（嵌套对象也被复制）
```

### 原则 2：浅拷贝行为

浅拷贝创建新对象但不创建它包含的对象的副本：

```python
import copy

# 对于可变对象，浅拷贝创建新容器
original_list = [1, 2, [3, 4]]
shallow_list = copy.copy(original_list)

# 顶层是不同的
print(original_list is shallow_list)  # False

# 但嵌套对象是相同的
print(original_list[2] is shallow_list[2])  # True

# 修改嵌套对象会影响两者
shallow_list[2].append(5)
print(original_list)  # [1, 2, [3, 4, 5]]
```

### 原则 3：深拷贝行为

深拷贝创建所有嵌套对象的独立副本：

```python
import copy

original = {'data': [1, 2, {'nested': [3, 4]}]}
deep = copy.deepcopy(original)

# 所有内容都是独立的
print(deep is original)  # False
print(deep['data'] is original['data'])  # False
print(deep['data'][2] is original['data'][2])  # False

# 修改深拷贝不影响原始对象
deep['data'][2]['nested'].append(5)
print(original)  # {'data': [1, 2, {'nested': [3, 4]}]} - 未改变
print(deep)  # {'data': [1, 2, {'nested': [3, 4, 5]}]}
```

### 原则 4：不可变对象不需要复制

不可变对象（int、str、tuple）可以安全地共享引用：

```python
import copy

# 不可变对象实际上不会被复制
original_tuple = (1, 2, 3)
shallow = copy.copy(original_tuple)
deep = copy.deepcopy(original_tuple)

# 它们是同一个对象（优化）
print(original_tuple is shallow)  # True
print(original_tuple is deep)  # True

# 不可变字符串
original_str = "hello"
copied_str = copy.copy(original_str)
print(original_str is copied_str)  # True（实际上没有复制）
```

## 要点

### 使用 `copy.copy()` 进行浅拷贝

```python
import copy

# 适用于列表
original_list = [1, 2, 3]
copied_list = copy.copy(original_list)
copied_list.append(4)
print(original_list)  # [1, 2, 3] - 未改变

# 适用于字典
original_dict = {'a': 1, 'b': 2}
copied_dict = copy.copy(original_dict)
copied_dict['c'] = 3
print(original_dict)  # {'a': 1, 'b': 2} - 未改变

# 适用于自定义对象
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

original_point = Point(1, 2)
copied_point = copy.copy(original_point)
print(original_point is copied_point)  # False
print(original_point.x is copied_point.x)  # True（相同的 x 值对象）
```

### 使用 `copy.deepcopy()` 进行深拷贝

```python
import copy

# 深拷贝处理嵌套结构
original = {
    'name': 'Alice',
    'hobbies': ['reading', 'gaming'],
    'address': {'city': 'NYC', 'zip': '10001'}
}

deep = copy.deepcopy(original)

# 所有嵌套对象都是独立的
deep['hobbies'].append('coding')
deep['address']['city'] = 'LA'

print(original)
# {'name': 'Alice',
#  'hobbies': ['reading', 'gaming'],
#  'address': {'city': 'NYC', 'zip': '10001'}}

print(deep)
# {'name': 'Alice',
#  'hobbies': ['reading', 'gaming', 'coding'],
#  'address': {'city': 'LA', 'zip': '10001'}}
```

### `copy.copy()` 的替代方法

```python
original_list = [1, 2, 3]

# 以下都创建浅拷贝：
copy1 = original_list[:]           # 切片表示法
copy2 = original_list.copy()        # List.copy() 方法
copy3 = list(original_list)         # 构造函数
copy4 = copy.copy(original_list)    # copy 模块

# 对于字典：
original_dict = {'a': 1, 'b': 2}

copy1 = original_dict.copy()        # Dict.copy() 方法
copy2 = dict(original_dict)         # 构造函数
copy3 = copy.copy(original_dict)    # copy 模块

# 对于自定义对象，通常需要 copy 模块
import copy
original_obj = MyClass()
copied_obj = copy.copy(original_obj)  # 自定义类的唯一方法
```

### 处理循环引用

```python
import copy

# 创建循环引用
list1 = [1, 2]
list2 = [3, 4, list1]
list1.append(list2)  # 现在 list1 包含 list2，而 list2 包含 list1

# 深拷贝自动处理循环引用
deep = copy.deepcopy(list1)
print(len(deep))  # 3
print(deep[2] is deep)  # False - 它们是不同的对象
```

### 使用 `__copy__` 和 `__deepcopy__` 自定义复制行为

```python
import copy

class Person:
    def __init__(self, name, age, friends=None):
        self.name = name
        self.age = age
        self.friends = friends or []

    def __copy__(self):
        # 自定义浅拷贝
        print(f"Shallow copying {self.name}")
        return Person(self.name, self.age, self.friends)

    def __deepcopy__(self, memo):
        # 自定义深拷贝
        print(f"Deep copying {self.name}")
        new_person = Person(
            self.name,
            self.age,
            copy.deepcopy(self.friends, memo)
        )
        return new_person

    def __repr__(self):
        return f"Person(name={self.name}, age={self.age}, friends={self.friends})"

# 使用自定义复制方法
alice = Person("Alice", 30, ["Bob", "Charlie"])

shallow = copy.copy(alice)  # 打印：Shallow copying Alice
deep = copy.deepcopy(alice)  # 打印：Deep copying Alice

# 浅拷贝共享 friends 列表
print(shallow.friends is alice.friends)  # True

# 深拷贝有独立的 friends 列表
print(deep.friends is alice.friends)  # False
```

## 代码示例

### 示例 1：带有嵌套结构的列表

```python
import copy

# 带有嵌套列表的原始列表
original = [1, 2, [3, 4, 5]]

# 浅拷贝
shallow = copy.copy(original)
shallow[0] = 999
shallow[2].append(6)

print("Original:", original)  # [1, 2, [3, 4, 5, 6]] - 嵌套被修改
print("Shallow: ", shallow)   # [999, 2, [3, 4, 5, 6]]

# 深拷贝
original = [1, 2, [3, 4, 5]]
deep = copy.deepcopy(original)
deep[0] = 999
deep[2].append(6)

print("Original:", original)  # [1, 2, [3, 4, 5]] - 未改变
print("Deep:    ", deep)      # [999, 2, [3, 4, 5, 6]]
```

### 示例 2：带有嵌套对象的字典

```python
import copy

class Config:
    def __init__(self, database, debug=False):
        self.database = database
        self.debug = debug

# 原始配置
original = {
    'app': 'MyApp',
    'settings': {'timeout': 30, 'retries': 3},
    'config': Config({'host': 'localhost'})
}

# 浅拷贝
shallow = copy.copy(original)
shallow['settings']['timeout'] = 60
shallow['config'].debug = True

print("Original settings:", original['settings'])  # {'timeout': 60, 'retries': 3}
print("Original debug:   ", original['config'].debug)  # True

# 深拷贝
original = {
    'app': 'MyApp',
    'settings': {'timeout': 30, 'retries': 3},
    'config': Config({'host': 'localhost'})
}

deep = copy.deepcopy(original)
deep['settings']['timeout'] = 60
deep['config'].debug = True

print("Original settings:", original['settings'])  # {'timeout': 30, 'retries': 3}
print("Original debug:   ", original['config'].debug)  # False
```

### 示例 3：处理集合中的对象

```python
import copy

class Student:
    def __init__(self, name, grades):
        self.name = name
        self.grades = grades

    def __repr__(self):
        return f"Student({self.name}, {self.grades})"

# 原始学生列表
students = [
    Student("Alice", [90, 85, 92]),
    Student("Bob", [78, 82, 88]),
    Student("Charlie", [95, 91, 89])
]

# 浅拷贝 - 新列表，但相同的学生对象
shallow_students = copy.copy(students)
shallow_students[0].grades.append(95)

print("Original Alice grades:", students[0].grades)  # [90, 85, 92, 95]

# 深拷贝 - 完全独立
students = [
    Student("Alice", [90, 85, 92]),
    Student("Bob", [78, 82, 88]),
    Student("Charlie", [95, 91, 89])
]

deep_students = copy.deepcopy(students)
deep_students[0].grades.append(95)

print("Original Alice grades:", students[0].grades)  # [90, 85, 92]
print("Deep Alice grades:   ", deep_students[0].grades)  # [90, 85, 92, 95]
```

### 示例 4：实现自定义复制逻辑

```python
import copy

class Database:
    def __init__(self, connection_string, cache=None):
        self.connection_string = connection_string
        self.cache = cache or {}
        self.query_count = 0

    def __copy__(self):
        # 对于浅拷贝，共享缓存但重置查询计数
        db_copy = Database(self.connection_string, self.cache)
        db_copy.query_count = self.query_count
        return db_copy

    def __deepcopy__(self, memo):
        # 对于深拷贝，创建独立缓存并重置查询计数
        db_copy = Database(
            self.connection_string,
            copy.deepcopy(self.cache, memo)
        )
        # 不复制 query_count - 从头开始
        return db_copy

    def __repr__(self):
        return f"Database({self.connection_string}, cache_size={len(self.cache)}, queries={self.query_count})"

# 使用自定义复制
original_db = Database("postgresql://localhost", {'user': 'alice'})
original_db.query_count = 100

shallow_db = copy.copy(original_db)
deep_db = copy.deepcopy(original_db)

# 浅拷贝共享缓存
print("Caches are same:", shallow_db.cache is original_db.cache)  # True

# 深拷贝有独立缓存
print("Caches are different:", deep_db.cache is original_db.cache)  # False

# 查询计数
print("Original:", original_db.query_count)  # 100
print("Shallow: ", shallow_db.query_count)   # 100
print("Deep:    ", deep_db.query_count)      # 0
```

### 示例 5：比较复制方法

```python
import copy
import time

class DataHolder:
    def __init__(self, data):
        self.data = data

# 创建大型嵌套结构
large_list = [[i for i in range(100)] for _ in range(100)]

# 测试不同的复制方法
holder = DataHolder(large_list)

# 浅拷贝
start = time.time()
for _ in range(1000):
    copy.copy(holder)
shallow_time = time.time() - start

# 深拷贝
start = time.time()
for _ in range(1000):
    copy.deepcopy(holder)
deep_time = time.time() - start

print(f"Shallow copy time: {shallow_time:.4f}s")
print(f"Deep copy time: {deep_time:.4f}s")
print(f"Deep copy is ~{deep_time/shallow_time:.1f}x slower")
```

## 最佳实践

### 当嵌套对象不需要独立性时使用浅拷贝

```python
# 好：修改副本不影响原始对象
import copy

original_scores = [90, 85, 88]
player_copy = copy.copy(original_scores)
player_copy[0] = 100

print(original_scores)  # [90, 85, 88] - 未受影响
```

### 对复杂嵌套结构使用深拷贝

```python
import copy

# 原始配置
config = {
    'database': {
        'primary': {'host': 'db1.example.com', 'port': 5432},
        'replica': {'host': 'db2.example.com', 'port': 5432}
    },
    'cache': {'ttl': 3600, 'max_size': 10000}
}

# 始终深拷贝复杂配置以避免意外共享
test_config = copy.deepcopy(config)
test_config['database']['primary']['host'] = 'localhost'
test_config['cache']['ttl'] = 60

# 原始对象未改变
print(config['database']['primary']['host'])  # 'db1.example.com'
print(config['cache']['ttl'])  # 3600
```

### 明确表达复制意图

```python
import copy

def process_list(data):
    # 明确意图：我们需要一个独立副本
    data_copy = copy.deepcopy(data)

    # 现在可以安全地修改
    data_copy.sort()
    data_copy.reverse()

    return data_copy

original = [3, 1, 4, 1, 5]
result = process_list(original)
print(original)  # [3, 1, 4, 1, 5] - 未改变
```

### 为特定行为实现自定义复制方法

```python
import copy

class CacheableObject:
    def __init__(self, data, cache=None):
        self.data = data
        self.cache = cache or {}
        self._cached = False

    def __deepcopy__(self, memo):
        # 深拷贝时，清除缓存以进行新计算
        new_obj = CacheableObject(copy.deepcopy(self.data, memo))
        new_obj._cached = False  # 强制重新计算
        return new_obj

obj = CacheableObject([1, 2, 3])
obj.cache = {'computed': True}
obj._cached = True

obj_copy = copy.deepcopy(obj)
print(obj._cached)       # True
print(obj_copy._cached)  # False
print(obj_copy.cache)    # {} - 缓存已清除
```

### 使用复制进行防御性编程

```python
import copy

class DataManager:
    def __init__(self, data):
        self._data = data

    def get_data(self):
        # 返回深拷贝以防止外部修改
        return copy.deepcopy(self._data)

    def set_data(self, data):
        # 存储深拷贝以防止外部修改
        self._data = copy.deepcopy(data)

manager = DataManager({'count': 0})
data = manager.get_data()
data['count'] = 999

print(manager.get_data())  # {'count': 0} - 不受外部更改影响
```

## 常见陷阱

### 陷阱 1：忘记浅拷贝共享嵌套对象

```python
import copy

# 错误 - 以为浅拷贝创建完全独立
original = [[1, 2], [3, 4]]
shallow = copy.copy(original)
shallow[0][0] = 999

print(original)  # [[999, 2], [3, 4]] - 糟糕，原始对象被修改了！

# 正确 - 对嵌套结构使用深拷贝
original = [[1, 2], [3, 4]]
deep = copy.deepcopy(original)
deep[0][0] = 999

print(original)  # [[1, 2], [3, 4]] - 未改变
```

### 陷阱 2：使用赋值而不是复制

```python
# 错误
original = [1, 2, 3]
copy_var = original  # 这不是副本！
copy_var.append(4)
print(original)  # [1, 2, 3, 4] - 两者引用同一对象

# 正确
import copy
original = [1, 2, 3]
copy_var = copy.copy(original)
copy_var.append(4)
print(original)  # [1, 2, 3] - 未改变
```

### 陷阱 3：忘记循环引用

```python
import copy

# 错误 - 在自定义复制代码中可能导致无限循环
node1 = {'value': 1}
node2 = {'value': 2, 'next': node1}
node1['next'] = node2  # 循环引用

# 这在 deepcopy 中工作正常（自动处理 memo 字典）
copied = copy.deepcopy(node1)
print(copied['next']['next'] is copied)  # True - 相同的复制对象

# 但没有 memo 跟踪的手动递归会失败：
def bad_deepcopy(obj, seen=None):
    if seen is None:
        seen = set()

    obj_id = id(obj)
    if obj_id in seen:
        return obj  # 这是错误的！

    seen.add(obj_id)
    # ... 其余复制逻辑会无限循环
```

### 陷阱 4：不处理不可 pickle 的对象

```python
import copy
import threading

# 某些对象无法深拷贝
lock = threading.Lock()

try:
    copied_lock = copy.deepcopy(lock)
except TypeError as e:
    print(f"Cannot deepcopy lock: {e}")

# 对于这种情况，实现 __deepcopy__
class SafeResource:
    def __init__(self, lock):
        self.lock = lock

    def __deepcopy__(self, memo):
        # 不复制锁，创建新的
        return SafeResource(threading.Lock())

resource = SafeResource(lock)
copied_resource = copy.deepcopy(resource)
print(resource.lock is copied_resource.lock)  # False
```

### 陷阱 5：在自定义 Deepcopy 中忘记 Memo 字典

```python
import copy

class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

    def __deepcopy__(self, memo):
        # 错误 - 不使用 memo，导致无限递归
        # return Node(self.value, copy.deepcopy(self.next))

        # 正确 - 使用 memo 处理循环引用
        node_id = id(self)
        if node_id in memo:
            return memo[node_id]

        new_node = Node(self.value)
        memo[node_id] = new_node
        new_node.next = copy.deepcopy(self.next, memo)
        return new_node

# 创建循环链表
node1 = Node(1)
node2 = Node(2)
node1.next = node2
node2.next = node1

# 这在正确处理 memo 后可以工作
copied = copy.deepcopy(node1)
print(copied.next.next is copied)  # True
```

## 性能考虑

### 浅拷贝比深拷贝快得多

```python
import copy
import time

# 创建大型结构
large_data = {
    'level1': {
        'level2': {
            'level3': {
                'items': list(range(10000))
            }
        }
    }
}

# 浅拷贝 - 快
start = time.time()
for _ in range(10000):
    copy.copy(large_data)
shallow_time = time.time() - start

# 深拷贝 - 慢
start = time.time()
for _ in range(10000):
    copy.deepcopy(large_data)
deep_time = time.time() - start

print(f"Shallow: {shallow_time:.4f}s")
print(f"Deep:    {deep_time:.4f}s")
print(f"Ratio:   {deep_time/shallow_time:.1f}x")
```

### 尽可能使用替代方法

```python
import copy
import time

large_list = list(range(100000))

# copy.copy() - 标准但较慢
start = time.time()
for _ in range(1000):
    copy.copy(large_list)
copy_time = time.time() - start

# list.copy() - 更快
start = time.time()
for _ in range(1000):
    large_list.copy()
method_time = time.time() - start

# 切片表示法 - 也很快
start = time.time()
for _ in range(1000):
    large_list[:]
slice_time = time.time() - start

print(f"copy.copy(): {copy_time:.4f}s")
print(f"list.copy(): {method_time:.4f}s")
print(f"slice [:]:   {slice_time:.4f}s")
```

### 深拷贝可能消耗大量内存

```python
import copy
import sys

# 创建大型结构
original = {
    'data': list(range(100000)),
    'nested': {
        'data': list(range(100000))
    }
}

size_original = sys.getsizeof(original)

# 深拷贝创建完全独立的副本
deep = copy.deepcopy(original)
size_deep = sys.getsizeof(deep)

print(f"Original size: {size_original} bytes")
print(f"Deep copy size: {size_deep} bytes")
print(f"Memory overhead: {(size_deep - size_original) / size_original * 100:.1f}%")
```

### 优化自定义复制方法

```python
import copy

class LargeDataSet:
    def __init__(self, data, metadata=None):
        self.data = data  # 大数组
        self.metadata = metadata or {}  # 小字典

    def __deepcopy__(self, memo):
        # 只深拷贝必要的部分
        # 如果 data 是只读的，浅拷贝它
        new_dataset = LargeDataSet(
            self.data,  # 浅拷贝（假设只读）
            copy.deepcopy(self.metadata, memo)  # 深拷贝元数据
        )
        return new_dataset

original = LargeDataSet(list(range(1000000)), {'name': 'test'})
# 比复制整个数据数组更高效
copied = copy.deepcopy(original)
```

## 实际场景

### 场景 1：API 请求/响应处理

```python
import copy
from typing import Any, Dict

class APICache:
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def store_response(self, key: str, response: Dict[str, Any]):
        # 始终存储深拷贝以防止外部修改
        self._cache[key] = copy.deepcopy(response)

    def get_response(self, key: str) -> Dict[str, Any]:
        # 返回深拷贝，使调用者无法影响缓存数据
        if key in self._cache:
            return copy.deepcopy(self._cache[key])
        return None

    def update_response(self, key: str, updates: Dict[str, Any]):
        # 使用深拷贝确保一致性
        if key in self._cache:
            cached = copy.deepcopy(self._cache[key])
            cached.update(updates)
            self._cache[key] = cached

# 用法
cache = APICache()
user_response = {'id': 1, 'name': 'Alice', 'settings': {'theme': 'dark'}}
cache.store_response('user_1', user_response)

# 外部修改不影响缓存
external_copy = cache.get_response('user_1')
external_copy['settings']['theme'] = 'light'

# 缓存不受影响
cached_copy = cache.get_response('user_1')
print(cached_copy['settings']['theme'])  # 'dark'
```

### 场景 2：配置管理

```python
import copy
from abc import ABC, abstractmethod

class ConfigManager:
    def __init__(self, config: dict):
        self._default_config = copy.deepcopy(config)
        self._current_config = copy.deepcopy(config)

    def reset_to_default(self):
        # 重置为原始配置而不影响默认值
        self._current_config = copy.deepcopy(self._default_config)

    def get_config(self) -> dict:
        # 返回深拷贝，使调用者无法影响实际配置
        return copy.deepcopy(self._current_config)

    def set_config(self, new_config: dict):
        # 存储深拷贝以防止外部修改
        self._current_config = copy.deepcopy(new_config)

    def update_config(self, updates: dict):
        # 使用深拷贝更新以确保隔离
        temp_config = copy.deepcopy(self._current_config)
        temp_config.update(updates)
        self._current_config = temp_config

# 用法
default_config = {
    'database': {
        'host': 'localhost',
        'port': 5432,
        'credentials': {'user': 'admin', 'password': 'secret'}
    }
}

manager = ConfigManager(default_config)

# 修改检索的配置（不影响实际配置）
config = manager.get_config()
config['database']['host'] = 'production.example.com'

print(manager.get_config()['database']['host'])  # 'localhost'

# 更新配置
manager.update_config({'database': {'host': 'staging.example.com'}})
print(manager.get_config()['database']['host'])  # 'staging.example.com'

# 重置为默认值
manager.reset_to_default()
print(manager.get_config()['database']['host'])  # 'localhost'
```

### 场景 3：数据库模型克隆

```python
import copy
from datetime import datetime

class User:
    def __init__(self, username: str, email: str, roles: list):
        self.username = username
        self.email = email
        self.roles = roles
        self.created_at = datetime.now()
        self.last_login = None

    def __deepcopy__(self, memo):
        # 实体的自定义深拷贝
        user = User(
            self.username,
            self.email,
            copy.deepcopy(self.roles, memo)
        )
        user.created_at = self.created_at  # 不复制时间戳
        user.last_login = self.last_login
        return user

class UserRepository:
    def __init__(self):
        self._users = {}

    def save_user(self, user: User):
        # 存储深拷贝以防止外部修改
        self._users[user.username] = copy.deepcopy(user)

    def get_user(self, username: str) -> User:
        # 返回深拷贝，使调用者无法影响存储的数据
        if username in self._users:
            return copy.deepcopy(self._users[username])
        return None

    def clone_user(self, source_username: str, new_username: str) -> User:
        # 克隆用户以进行复制
        source = self._users.get(source_username)
        if source:
            cloned = copy.deepcopy(source)
            cloned.username = new_username
            cloned.created_at = datetime.now()
            return cloned
        return None

# 用法
repo = UserRepository()
user1 = User('alice', 'alice@example.com', ['admin', 'user'])
repo.save_user(user1)

# 检索并修改（不影响存储的用户）
retrieved = repo.get_user('alice')
retrieved.roles.append('moderator')

stored = repo.get_user('alice')
print(stored.roles)  # ['admin', 'user']

# 克隆用户
user2 = repo.clone_user('alice', 'alice2')
print(user2.username)  # 'alice2'
print(user2.roles)     # ['admin', 'user']
```

### 场景 4：测试夹具

```python
import copy
import pytest

class TestDataGenerator:
    def __init__(self):
        # 存储模板夹具
        self.user_template = {
            'id': None,
            'username': 'user',
            'profile': {
                'first_name': 'John',
                'last_name': 'Doe',
                'bio': ''
            },
            'settings': {
                'notifications': True,
                'theme': 'light'
            }
        }

    def create_user_fixture(self, **overrides) -> dict:
        # 创建模板的深拷贝以避免突变
        user = copy.deepcopy(self.user_template)

        # 应用覆盖（可以处理嵌套更新）
        for key, value in overrides.items():
            if key in user and isinstance(user[key], dict) and isinstance(value, dict):
                user[key].update(value)
            else:
                user[key] = value

        return user

# 在测试中使用
class TestUserAPI:
    @pytest.fixture
    def data_gen(self):
        return TestDataGenerator()

    def test_user_creation(self, data_gen):
        user = data_gen.create_user_fixture(
            id=1,
            username='alice',
            profile={'first_name': 'Alice'}
        )
        assert user['username'] == 'alice'
        assert user['profile']['first_name'] == 'Alice'
        assert user['profile']['last_name'] == 'Doe'  # 未改变

    def test_user_settings(self, data_gen):
        user = data_gen.create_user_fixture(
            settings={'theme': 'dark'}
        )
        assert user['settings']['theme'] == 'dark'
        assert user['settings']['notifications'] is True  # 未改变
```

### 场景 5：撤销/重做功能

```python
import copy
from typing import Any, List

class EditableDocument:
    def __init__(self, content: str):
        self.content = content
        self._history: List[str] = [copy.copy(content)]
        self._history_index = 0

    def edit(self, new_content: str):
        # 将当前状态保存到历史记录
        # 删除任何重做历史
        self._history = self._history[:self._history_index + 1]

        # 添加新状态
        self._history.append(copy.copy(new_content))
        self._history_index += 1

        self.content = new_content

    def undo(self) -> bool:
        if self._history_index > 0:
            self._history_index -= 1
            self.content = copy.copy(self._history[self._history_index])
            return True
        return False

    def redo(self) -> bool:
        if self._history_index < len(self._history) - 1:
            self._history_index += 1
            self.content = copy.copy(self._history[self._history_index])
            return True
        return False

# 用法
doc = EditableDocument("Hello")
print(doc.content)  # "Hello"

doc.edit("Hello World")
print(doc.content)  # "Hello World"

doc.edit("Hello World!")
print(doc.content)  # "Hello World!"

doc.undo()
print(doc.content)  # "Hello World"

doc.undo()
print(doc.content)  # "Hello"

doc.redo()
print(doc.content)  # "Hello World"
```

## 面试要点

### Q1：解释浅拷贝和深拷贝的区别

**回答**：浅拷贝在顶层创建新对象但引用相同的嵌套对象。深拷贝创建完全新的对象树，所有嵌套对象也是新的。

```python
import copy

# 浅拷贝示例
original = [1, 2, [3, 4]]
shallow = copy.copy(original)

# 修改嵌套对象会影响两者
shallow[2].append(5)
print(original)  # [1, 2, [3, 4, 5]]

# 深拷贝示例
original = [1, 2, [3, 4]]
deep = copy.deepcopy(original)

# 修改深拷贝不影响原始对象
deep[2].append(5)
print(original)  # [1, 2, [3, 4]]
```

### Q2：创建浅拷贝有哪些不同方法？

**回答**：对于大多数情况，使用内置方法。对于自定义对象，使用 copy 模块。

```python
import copy

# 列表
list1 = [1, 2, 3]
copy1 = list1[:]              # 切片
copy2 = list1.copy()           # 方法
copy3 = list(list1)            # 构造函数
copy4 = copy.copy(list1)       # copy 模块

# 字典
dict1 = {'a': 1, 'b': 2}
copy1 = dict1.copy()           # 方法
copy2 = dict(dict1)            # 构造函数
copy3 = copy.copy(dict1)       # copy 模块

# 自定义对象
class MyClass:
    pass

obj = MyClass()
copy_obj = copy.copy(obj)  # 自定义类的唯一方法
```

### Q3：什么时候应该使用深拷贝而不是浅拷贝？

**回答**：对简单对象或嵌套对象不需要独立性时使用浅拷贝。对需要完全独立的复杂嵌套结构使用深拷贝。

```python
import copy

# 浅拷贝足够 - 没有嵌套对象
numbers = [1, 2, 3]
numbers_copy = copy.copy(numbers)

# 需要深拷贝 - 嵌套结构
config = {
    'database': {
        'host': 'localhost',
        'port': 5432
    }
}
config_copy = copy.deepcopy(config)
```

### Q4：如何实现自定义复制行为？

**回答**：实现 `__copy__` 和 `__deepcopy__` 方法。始终在 `__deepcopy__` 中使用 memo 字典来处理循环引用。

```python
import copy

class CustomClass:
    def __copy__(self):
        # 浅拷贝逻辑
        return CustomClass(self.data)

    def __deepcopy__(self, memo):
        # 带有 memo 处理的深拷贝逻辑
        node_id = id(self)
        if node_id in memo:
            return memo[node_id]

        new_obj = CustomClass(copy.deepcopy(self.data, memo))
        memo[node_id] = new_obj
        return new_obj
```

### Q5：浅拷贝和深拷贝的性能差异是什么？

**回答**：浅拷贝快得多（通常快 10-100 倍），因为它只复制顶层容器。深拷贝必须递归复制所有嵌套对象。

```python
import copy
import time

large_data = {'nested': list(range(100000))}

# 浅拷贝 - 毫秒级
start = time.time()
for _ in range(1000):
    copy.copy(large_data)
shallow_time = time.time() - start

# 深拷贝 - 秒级
start = time.time()
for _ in range(1000):
    copy.deepcopy(large_data)
deep_time = time.time() - start

print(f"Deep is {deep_time/shallow_time:.1f}x slower")
```

### Q6：copy.deepcopy 如何处理循环引用？

**回答**：它使用 memo 字典，通过 id 跟踪已复制的对象。当遇到已经复制的对象时，它返回对副本的引用而不是递归。

```python
import copy

# 循环引用
list1 = [1, 2]
list2 = [3, 4, list1]
list1.append(list2)

# deepcopy 自动处理它
copied = copy.deepcopy(list1)
print(copied[2][3] is copied)  # True - 循环引用被保留
```

### Q7：为什么要将 __copy__ 和 __deepcopy__ 实现为不同的？

**回答**：不同的用例需要不同的行为。浅拷贝可能共享昂贵的复制资源，而深拷贝可能重置状态或清除缓存。

```python
import copy

class CacheableData:
    def __init__(self, data):
        self.data = data
        self.cache = {}
        self._cached = False

    def __copy__(self):
        # 浅拷贝共享缓存
        obj = CacheableData(self.data)
        obj.cache = self.cache
        obj._cached = self._cached
        return obj

    def __deepcopy__(self, memo):
        # 深拷贝清除缓存以进行新计算
        obj = CacheableData(copy.deepcopy(self.data, memo))
        # 缓存不复制 - 强制重新计算
        return obj
```

## 进一步阅读

### 官方文档
- [Python copy 模块文档](https://docs.python.org/3/library/copy.html)
- [Python 数据模型 - 对象复制](https://docs.python.org/3/reference/datamodel.html)

### 相关概念
- Python 中的对象引用和内存管理
- 可变与不可变对象
- Pickle 模块用于序列化（也处理复制）
- 垃圾回收和对象生命周期
- `id()` 函数和对象标识

### 最佳实践资源
- Python 官方风格指南（PEP 8）关于对象设计
- Real Python 关于 Python 对象模型的文章
- Stack Overflow 关于浅拷贝与深拷贝的讨论
- GitHub 仓库中的 copy 模块使用示例

### 高级主题
- 实现 `__getstate__` 和 `__setstate__` 用于 pickling
- 复制协议和可扩展性
- 复制操作的性能分析
- 大型数据集的内存高效复制策略
- 不可变数据结构作为复制的替代方案

## 总结

copy 模块对于在处理可变对象时编写正确的 Python 代码至关重要。理解浅拷贝和深拷贝之间的区别，以及知道何时使用每种，对于以下方面至关重要：

- 防止意外的数据突变
- 设计保护内部状态的 API
- 实现缓存和配置系统
- 创建适当的测试夹具
- 构建撤销/重做功能
- 在数据密集型应用程序中优化性能

记住这些关键要点：

1. **赋值创建引用**，而不是副本
2. **浅拷贝**快但共享嵌套对象
3. **深拷贝**较慢但确保完全独立
4. **尽可能使用内置方法**（比 copy 模块更快）
5. **为特定领域行为实现自定义复制方法**
6. **始终在自定义 `__deepcopy__` 中使用 memo 字典**
7. **根据需求选择** - 不要盲目到处使用深拷贝

通过掌握 copy 模块，你将编写更健壮、更易维护的 Python 代码。
