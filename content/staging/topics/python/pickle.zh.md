---
title: "Python Pickle Module: Object Serialization and Deserialization"
description: Comprehensive guide to Python pickle module for serializing and deserializing Python objects, covering techniques, best practices, security considerations, and real-world applications.
track: python
section: stdlib
difficulty: intermediate
tags:
  - serialization
  - pickle
  - data persistence
  - object serialization
  - bytecode
  - security
status: imported
origin: old/src/content/docs/python/pickle.zh.md
divergence: 0.233
issues:
  - title-lang-zh
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## 概念解释

`pickle` 模块是 Python 内置的序列化库，用于将 Python 对象转换为字节流（序列化/pickling），并将其重建为对象（反序列化/unpickling）。这个过程允许你：

- **将对象持久化到磁盘**以便稍后检索
- **通过网络发送对象**，例如通过套接字或 API
- **将对象存储在数据库中**作为二进制数据
- **高效地缓存计算结果**
- **在多进程场景中共享 Python 对象**

与 JSON（基于文本、语言无关）不同，pickle 是 Python 特有的，但可以序列化几乎任何 Python 对象，包括自定义类、函数和复杂数据结构。

### 解决的问题

当你需要保存 Python 对象的完整状态（不仅仅是数据）时，pickle 是标准解决方案。例如：
- 保存训练好的机器学习模型
- 在 Web 应用中存储会话数据
- 保存正在运行的程序的精确状态
- 实现分布式计算系统

## 核心原理

### 序列化过程

**序列化（Pickling）** 是将 Python 对象层次结构转换为字节流的过程：

1. **对象图遍历**：pickler 遍历对象并识别所有引用的对象
2. **协议编码**：使用多个协议版本之一对对象进行编码
3. **字节流生成**：输出以一系列操作码（opcodes）的形式写入

### 反序列化过程

**反序列化（Unpickling）** 执行相反的过程：

1. **字节流解析**：pickler 从字节流中读取操作码
2. **对象重建**：在内存中重新创建 Python 对象
3. **状态恢复**：恢复对象属性和关系

### 协议版本

Pickle 有多个协议版本以保持向后兼容性：

- **协议 0**：基于 ASCII，人类可读，速度最慢
- **协议 1**：基于二进制，向后兼容
- **协议 2**：更高效（Python 2.3+）
- **协议 3**：支持 Python 3 的 bytes/strings 区分
- **协议 4**：针对大型对象的优化（Python 3.4+）
- **协议 5**：带外数据支持（Python 3.8+）

Python 3 中的默认协议因版本而异，但更高的协议通常更高效。

## 关键要点

1. **Python 特有格式**：与 JSON 或 XML 不同，pickle 是 Python 特有的，可能在不同 Python 版本之间不兼容

2. **支持复杂对象**：Pickle 可以序列化：
   - 内置类型（int, str, list, dict, set, tuple）
   - 自定义类和实例
   - 函数和方法
   - 模块和 lambda 函数
   - 循环引用
   - 异常

3. **安全漏洞**：反序列化不受信任的数据可能执行任意代码。永远不要反序列化来自不受信任来源的数据

4. **二进制格式**：Pickle 生成二进制输出，比 JSON 更紧凑但不可人类阅读

5. **版本兼容性问题**：使用一个 Python 版本序列化的对象可能无法在另一个版本中正确反序列化

6. **模块依赖**：反序列化需要原始模块/类可导入

7. **性能**：对于 Python 对象，Pickle 通常比 JSON 更快，特别是对于具有复杂结构的大型数据集

## 代码示例

### 基本序列化和反序列化

```python
import pickle
import tempfile

# 示例 1：序列化基本对象
data = {
    'name': 'John',
    'age': 30,
    'hobbies': ['reading', 'coding', 'gaming'],
    'scores': {
        'math': 95,
        'english': 87
    }
}

# 序列化为字节
pickled_data = pickle.dumps(data)
print(f"序列化大小: {len(pickled_data)} 字节")

# 从字节反序列化
restored_data = pickle.loads(pickled_data)
print(f"恢复的数据: {restored_data}")
print(f"数据匹配: {data == restored_data}")

# 示例 2：序列化到文件
with tempfile.NamedTemporaryFile(delete=False) as f:
    pickle.dump(data, f)
    filename = f.name

# 从文件反序列化
with open(filename, 'rb') as f:
    loaded_data = pickle.load(f)
    print(f"从文件加载: {loaded_data}")
```

### 序列化自定义类

```python
import pickle

class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.created_at = None

    def __repr__(self):
        return f"Person(name='{self.name}', age={self.age})"

    def greet(self):
        return f"你好，我是 {self.name}"

# 创建并序列化自定义对象
person = Person('Alice', 28)
person.created_at = '2025-01-07'

# 序列化
pickled = pickle.dumps(person)
print(f"序列化后的 person: {len(pickled)} 字节")

# 反序列化
restored_person = pickle.loads(pickled)
print(f"恢复: {restored_person}")
print(f"可以调用方法: {restored_person.greet()}")
```

### 使用不同协议

```python
import pickle

data = {
    'integers': [1, 2, 3, 4, 5],
    'strings': ['hello', 'world'],
    'nested': {'a': 1, 'b': 2}
}

# 比较不同协议的大小
for protocol in range(pickle.HIGHEST_PROTOCOL + 1):
    pickled = pickle.dumps(data, protocol=protocol)
    print(f"协议 {protocol}: {len(pickled)} 字节")

# 协议 0 (ASCII) - 最大但人类可读
pickled_p0 = pickle.dumps(data, protocol=0)
print(f"\n协议 0 (可读):\n{pickled_p0.decode('ascii', errors='replace')[:100]}")

# 最新协议 - 最高效
pickled_latest = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
print(f"\n协议 {pickle.HIGHEST_PROTOCOL}: {len(pickled_latest)} 字节")
```

### 处理循环引用

```python
import pickle

class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

    def __repr__(self):
        return f"Node({self.value})"

# 创建循环引用
node1 = Node(1)
node2 = Node(2)
node3 = Node(3)

node1.next = node2
node2.next = node3
node3.next = node1  # 循环引用！

# Pickle 自动处理循环引用
pickled = pickle.dumps(node1)
restored = pickle.loads(pickled)

print(f"原始: {node1.value} -> {node1.next.value} -> {node1.next.next.value}")
print(f"恢复: {restored.value} -> {restored.next.value} -> {restored.next.next.value}")
print(f"是循环的: {restored.next.next.next is restored}")  # True
```

### 使用 `__getstate__` 和 `__setstate__` 自定义序列化

```python
import pickle

class SecureUser:
    def __init__(self, username, password, email):
        self.username = username
        self.password = password  # 敏感信息！
        self.email = email
        self._login_count = 0

    def __getstate__(self):
        # 自定义序列化 - 排除密码
        state = self.__dict__.copy()
        del state['password']  # 不序列化密码
        return state

    def __setstate__(self, state):
        # 自定义反序列化 - 恢复状态并设置默认密码
        self.__dict__.update(state)
        self.password = None  # 重置为 None

# 测试自定义序列化
user = SecureUser('alice', 'super_secret', 'alice@example.com')
user._login_count = 5

pickled = pickle.dumps(user)
restored = pickle.loads(pickled)

print(f"原始密码: {user.password}")
print(f"恢复的密码: {restored.password}")
print(f"用户名保留: {restored.username}")
print(f"登录次数保留: {restored._login_count}")
```

### 使用 Pickler 和 Unpickler 类

```python
import pickle
import io

data = {
    'numbers': [1, 2, 3, 4, 5],
    'message': 'Hello, World!'
}

# 使用 Pickler 类获得更多控制
buffer = io.BytesIO()
pickler = pickle.Pickler(buffer, protocol=pickle.HIGHEST_PROTOCOL)
pickler.dump(data)

# 获取序列化的字节
pickled_bytes = buffer.getvalue()
print(f"序列化大小: {len(pickled_bytes)} 字节")

# 使用 Unpickler 类
buffer.seek(0)
unpickler = pickle.Unpickler(buffer)
restored = unpickler.load()
print(f"恢复: {restored}")
```

## 最佳实践

### **始终指定协议版本**

```python
# 好的做法：明确指定协议以保持一致性
data = {'key': 'value'}
pickled = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)

# 避免：依赖默认值（在不同 Python 版本中会变化）
pickled = pickle.dumps(data)  # 使用默认值
```

### **永远不要反序列化不受信任的数据**

```python
import pickle

# 错误 - 永远不要对不受信任的数据这样做！
untrusted_data = receive_from_user()
# restored = pickle.loads(untrusted_data)  # 安全风险！

# 正确 - 对不受信任的数据使用更安全的替代方案
import json
trusted_data = json.loads(untrusted_data)
```

### **使用 `__reduce__` 或 `__getstate__`/`__setstate__` 进行自定义控制**

```python
import pickle

class Config:
    def __init__(self, debug=False, api_key=None):
        self.debug = debug
        self.api_key = api_key
        self.internal_cache = {}

    def __getstate__(self):
        # 排除缓存和敏感数据
        state = self.__dict__.copy()
        del state['internal_cache']
        del state['api_key']
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self.internal_cache = {}
        self.api_key = None
```

### **处理版本兼容性**

```python
import pickle

class VersionedData:
    VERSION = 2

    def __init__(self, value):
        self.value = value
        self.version = self.VERSION

    def __getstate__(self):
        return {
            'value': self.value,
            'version': self.version
        }

    def __setstate__(self, state):
        version = state.get('version', 1)

        if version == 1:
            # 处理旧格式
            self.value = state['value'] * 2  # 迁移示例
            self.version = 2
        else:
            self.__dict__.update(state)
```

### **反序列化后进行类型检查**

```python
import pickle

def safe_unpickle(data, expected_type):
    try:
        obj = pickle.loads(data)
        if not isinstance(obj, expected_type):
            raise TypeError(f"期望 {expected_type}，得到 {type(obj)}")
        return obj
    except pickle.UnpicklingError as e:
        raise ValueError(f"无效的 pickle 数据: {e}")

# 使用
pickled = pickle.dumps({'key': 'value'})
result = safe_unpickle(pickled, dict)
```

## 常见陷阱

### **序列化 Lambda 函数**

```python
import pickle

# 失败 - Lambda 函数不能被序列化
square = lambda x: x ** 2
try:
    pickled = pickle.dumps(square)
except pickle.PicklingError as e:
    print(f"错误: {e}")

# 解决方案 - 使用普通函数
def square_func(x):
    return x ** 2

pickled = pickle.dumps(square_func)  # 可以工作！
```

### **反序列化后模块未找到**

```python
import pickle

class MyClass:
    pass

# 如果类被重命名或模块被删除，反序列化会失败
# 解决方案 - 实现 __reduce__ 以保持兼容性
```

### **可变默认参数**

```python
import pickle

class BadExample:
    def __init__(self, items=[]):  # 可变默认值！
        self.items = items

# 这会导致共享状态问题
obj1 = BadExample()
obj1.items.append('first')

obj2 = BadExample()
print(obj2.items)  # ['first'] - 它们共享同一个列表！
```

### **版本不匹配**

```python
import pickle

# 使用 Python 3.9 和协议 4 进行序列化
data = {'x': 1}
pickled = pickle.dumps(data, protocol=4)

# 使用较旧的 Python (3.3) 反序列化：
# ValueError: pickle protocol 4 was not introduced until Python 3.4

# 解决方案 - 使用兼容的协议
pickled = pickle.dumps(data, protocol=3)  # 兼容 3.4+
```

## 性能考虑

### **协议选择的影响**

```python
import pickle
import timeit

data = {
    'data': list(range(10000)),
    'nested': {'a': 1, 'b': 2, 'c': list(range(1000))}
}

# 基准测试不同协议
for protocol in [2, 3, 4, pickle.HIGHEST_PROTOCOL]:
    pickled = pickle.dumps(data, protocol=protocol)
    size = len(pickled)
    print(f"协议 {protocol}: {size} 字节")
```

### **大型对象优化**

```python
import pickle

# 对于非常大的对象，使用基于文件的序列化
large_data = {
    'arrays': [list(range(10000)) for _ in range(100)],
}

# 更好：直接写入文件（使用更少内存）
with open('large_data.pkl', 'wb') as f:
    pickle.dump(large_data, f)

# 避免：将整个 pickle 加载到内存中
# pickled = pickle.dumps(large_data)  # 使用更多内存
```

### **缓存策略**

```python
import pickle
import functools

@functools.lru_cache(maxsize=128)
def expensive_computation(n):
    return sum(i**2 for i in range(n))

# 使用 pickle 缓存结果
cache = {}

def save_cache():
    with open('cache.pkl', 'wb') as f:
        pickle.dump(cache, f)

def load_cache():
    try:
        with open('cache.pkl', 'rb') as f:
            return pickle.load(f)
    except FileNotFoundError:
        return {}
```

## 实际应用场景

### **机器学习模型持久化**

```python
import pickle

class Model:
    def __init__(self):
        self.weights = [0.1, 0.2, 0.3]
        self.bias = 0.5

    def predict(self, x):
        return sum(w * xi for w, xi in zip(self.weights, x)) + self.bias

# 训练并保存模型
model = Model()

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# 稍后加载并使用
with open('model.pkl', 'rb') as f:
    loaded_model = pickle.load(f)

prediction = loaded_model.predict([1, 2, 3])
print(f"预测结果: {prediction}")
```

### **会话管理**

```python
import pickle
import base64
from datetime import datetime, timedelta

class SessionManager:
    def create_session(self, user_id, data):
        session = {
            'user_id': user_id,
            'data': data,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=24)
        }
        pickled = pickle.dumps(session)
        return base64.b64encode(pickled).decode()

    def get_session(self, session_id):
        try:
            pickled = base64.b64decode(session_id)
            session = pickle.loads(pickled)

            if session['expires_at'] < datetime.now():
                return None

            return session
        except (pickle.UnpicklingError, ValueError):
            return None

manager = SessionManager()
session_id = manager.create_session('user123', {'logged_in': True})
session = manager.get_session(session_id)
print(f"会话: {session}")
```

### **多进程数据交换**

```python
import pickle
import multiprocessing

def worker(input_queue, output_queue):
    while True:
        task = input_queue.get()
        if task is None:
            break

        data = task['data']
        result = sum(data) / len(data)
        output_queue.put({'id': task['id'], 'result': result})

if __name__ == '__main__':
    input_q = multiprocessing.Queue()
    output_q = multiprocessing.Queue()

    process = multiprocessing.Process(target=worker, args=(input_q, output_q))
    process.start()

    # 发送任务（由 multiprocessing 自动序列化）
    tasks = [
        {'id': 1, 'data': [1, 2, 3, 4, 5]},
        {'id': 2, 'data': [10, 20, 30, 40, 50]}
    ]

    for task in tasks:
        input_q.put(task)

    input_q.put(None)  # 结束信号

    for _ in tasks:
        result = output_q.get()
        print(f"任务 {result['id']}: {result['result']}")

    process.join()
```

## 面试要点

### **什么是 pickling，为什么要使用它？**

Pickling 将 Python 对象转换为字节流，用于：
- 对象持久化（保存到磁盘）
- 进程间通信
- 网络传输
- 缓存计算结果

### **pickle 的安全影响是什么？**

**关键漏洞**：反序列化不受信任的数据会执行任意 Python 代码。攻击者可以构造恶意的序列化数据来破坏系统。永远不要反序列化来自不受信任来源的数据。

### **pickle 与 JSON 有什么区别？**

- **JSON**：基于文本，人类可读，语言无关，更安全但类型有限
- **Pickle**：二进制，Python 特有，支持复杂对象，对不受信任数据有安全风险

### **什么是 pickle 协议版本？**

- 协议 0：ASCII，最慢，兼容性好
- 协议 2-3：二进制，高效，标准
- 协议 4+：大型对象优化

更高的协议更快，但需要更新的 Python 版本。

### **如何处理版本兼容性？**

- 在序列化数据中存储版本信息
- 实现自定义 `__getstate__` 和 `__setstate__` 方法
- 在反序列化中添加迁移逻辑
- 使用 `__reduce__` 进行完全控制

### **哪些对象不能被序列化？**

- Lambda 函数
- 打开的文件对象
- 锁对象和同步原语
- 动态创建的类（某些情况下）
- 某些内置函数

### **pickle 如何处理循环引用？**

Pickle 维护一个内部 memo 字典，跟踪已经序列化的对象，并通过 ID 引用它们，而不是重新序列化。

### **`dumps()` 和 `dump()` 有什么区别？**

- `dumps()`：序列化为内存中的字节
- `dump()`：直接序列化到文件对象

对于大型对象使用 `dump()` 以减少内存开销。

### **如何实现自定义序列化？**

使用 `__getstate__` 和 `__setstate__` 方法来控制序列化，或者实现 `__reduce__` 以获得完全控制。

### **不同协议的性能影响是什么？**

协议 4+ 提供更好的性能和更小的文件大小，特别是对于大型对象。权衡：兼容性与性能。

## 延伸阅读

### 官方文档
- [Python pickle 模块文档](https://docs.python.org/3/library/pickle.html)
- [PEP 574 - Pickle 协议 5](https://www.python.org/dev/peps/pep-0574/)
- [PEP 307 - pickle 协议扩展](https://www.python.org/dev/peps/pep-0307/)

### 相关标准
- [Shelve 模块](https://docs.python.org/3/library/shelve.html) - 使用 pickle 的持久化字典
- [Dill 库](https://dill.readthedocs.io/) - 扩展的序列化支持
- [CloudPickle](https://github.com/cloudpipe/cloudpickle) - 云计算的扩展序列化

### 安全资源
- [Python pickle 安全文档](https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled)
- OWASP：反序列化漏洞
- Real Python：[Pickle 与安全](https://realpython.com/python-pickle-module/#security-considerations)

### 替代方案
- **JSON**：基于文本的语言无关序列化
- **Protocol Buffers**：结构化数据序列化
- **MessagePack**：二进制序列化
- **YAML**：人类可读的配置

### 书籍和文章
- 《流畅的 Python》- Luciano Ramalho（序列化章节）
- 《Effective Python》- Brett Slatkin（Pickling 条目）
- Real Python：[Python Pickle 教程](https://realpython.com/python-pickle-module/)

### 高级主题
- 针对特定领域对象的自定义 pickler
- 大数据性能优化
- 分布式计算框架（Spark、Dask）
- 跨版本兼容性策略
- pickle 的类型提示
