---
title: Python weakref 弱引用
description: 深入掌握 Python weakref 模块，包括 ref()、proxy()、WeakValueDictionary、WeakKeyDictionary、finalize 等弱引用工具
track: python
section: stdlib
difficulty: advanced
tags:
  - Python
  - weakref
  - 内存管理
  - 垃圾回收
  - 缓存
status: imported
origin: old/src/content/docs/python/weakref.zh.md
divergence: 0.206
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Python
  subcategory: 标准库
  order: 33
  lastUpdated: 2026-01-07
---

`weakref` 是 Python 标准库中用于创建弱引用的模块。弱引用允许你引用一个对象而不阻止该对象被垃圾回收，这在缓存、观察者模式、循环引用处理等场景中非常有用。

## 概念解释

### 什么是弱引用？

在 Python 中，当你创建一个变量指向某个对象时，就创建了一个**强引用**。只要存在强引用，对象就不会被垃圾回收。而**弱引用**则不同，它不会增加对象的引用计数，因此不会阻止对象被回收。

```python
import weakref

class MyClass:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"MyClass({self.name!r})"

# 创建对象和强引用
obj = MyClass("example")
strong_ref = obj  # 强引用，引用计数 +1

# 创建弱引用
weak_ref = weakref.ref(obj)  # 弱引用，引用计数不变

print(f"对象存在: {weak_ref()}")  # MyClass('example')

# 删除所有强引用
del obj
del strong_ref

# 对象被回收，弱引用返回 None
print(f"对象已回收: {weak_ref()}")  # None
```

### 弱引用的历史背景

弱引用的概念源于垃圾回收和内存管理领域。在 Python 2.1 中引入 `weakref` 模块，解决以下问题：

1. **循环引用**：两个对象互相引用导致无法回收
2. **缓存优化**：缓存对象而不阻止其被回收
3. **观察者模式**：观察者不应阻止被观察对象的回收
4. **大对象管理**：避免不必要地延长大对象的生命周期

### 哪些对象可以被弱引用？

不是所有 Python 对象都支持弱引用：

```python
import weakref

# 支持弱引用的类型
class CustomClass: pass
custom_obj = CustomClass()
weakref.ref(custom_obj)  # OK

# 内置类型通常不支持弱引用
# weakref.ref([1, 2, 3])    # TypeError: cannot create weak reference to 'list' object
# weakref.ref({1, 2, 3})    # TypeError: cannot create weak reference to 'set' object
# weakref.ref((1, 2, 3))    # TypeError: cannot create weak reference to 'tuple' object
# weakref.ref("hello")      # TypeError: cannot create weak reference to 'str' object

# 可以通过继承使内置类型支持弱引用
class WeakableList(list):
    __slots__ = ('__weakref__',)

wl = WeakableList([1, 2, 3])
weakref.ref(wl)  # OK
```

---

## 核心原理

### 引用计数与垃圾回收

Python 使用**引用计数**作为主要的内存管理机制：

```python
import sys

obj = [1, 2, 3]
print(sys.getrefcount(obj))  # 2（obj 本身 + getrefcount 的参数）

another = obj
print(sys.getrefcount(obj))  # 3

del another
print(sys.getrefcount(obj))  # 2
```

弱引用的关键在于它不增加引用计数：

```python
import sys
import weakref

class MyClass:
    pass

obj = MyClass()
print(sys.getrefcount(obj))  # 2

# 创建弱引用不增加引用计数
weak = weakref.ref(obj)
print(sys.getrefcount(obj))  # 仍然是 2
```

### 弱引用的内部机制

Python 对象内部有一个 `__weakref__` 槽位用于存储弱引用：

```python
import weakref

class MyClass:
    pass

obj = MyClass()

# 查看弱引用槽位
print(hasattr(obj, '__weakref__'))  # True
print(obj.__weakref__)  # None（尚未创建弱引用）

# 创建弱引用后
weak = weakref.ref(obj)
print(obj.__weakref__)  # <weakref at 0x...; to 'MyClass' at 0x...>

# 多个弱引用共享同一个槽位（形成链表）
weak2 = weakref.ref(obj)
print(weak is weak2)  # True（返回相同的弱引用对象）
```

### 回调机制

当对象被回收时，可以触发回调函数：

```python
import weakref

class Resource:
    def __init__(self, name):
        self.name = name

def cleanup_callback(weak_ref):
    print(f"对象已被回收，弱引用: {weak_ref}")

obj = Resource("重要资源")
weak = weakref.ref(obj, cleanup_callback)

print(f"对象存在: {weak()}")
del obj  # 触发回调：对象已被回收，弱引用: <weakref at 0x...; dead>
print(f"对象已回收: {weak()}")  # None
```

---

## 核心要点

### weakref 模块主要组件

| 组件 | 说明 |
|------|------|
| `ref(object, callback=None)` | 创建弱引用对象 |
| `proxy(object, callback=None)` | 创建弱引用代理 |
| `getweakrefcount(object)` | 获取对象的弱引用数量 |
| `getweakrefs(object)` | 获取对象的所有弱引用列表 |
| `WeakValueDictionary` | 值为弱引用的字典 |
| `WeakKeyDictionary` | 键为弱引用的字典 |
| `WeakSet` | 元素为弱引用的集合 |
| `WeakMethod` | 绑定方法的弱引用 |
| `finalize` | 注册终结器（对象回收时执行清理） |

### ref() 与 proxy() 的区别

```python
import weakref

class MyClass:
    def __init__(self, value):
        self.value = value

    def show(self):
        return f"值: {self.value}"

obj = MyClass(42)

# ref() 返回弱引用对象，需要调用才能获取原对象
weak_ref = weakref.ref(obj)
print(type(weak_ref))      # <class 'weakref'>
print(weak_ref())          # <__main__.MyClass object at ...>
print(weak_ref().value)    # 42

# proxy() 返回代理对象，可以直接访问原对象的属性和方法
weak_proxy = weakref.proxy(obj)
print(type(weak_proxy))    # <class 'weakproxy'>
print(weak_proxy.value)    # 42（直接访问）
print(weak_proxy.show())   # 值: 42

# 当原对象被删除后
del obj

# ref() 返回 None
print(weak_ref())  # None

# proxy() 抛出异常
try:
    print(weak_proxy.value)
except ReferenceError as e:
    print(f"ReferenceError: {e}")  # weakly-referenced object no longer exists
```

---

## 代码示例

### ref() - 创建弱引用

```python
import weakref

class DataObject:
    def __init__(self, data):
        self.data = data

    def process(self):
        return sum(self.data)

# 基本用法
obj = DataObject([1, 2, 3, 4, 5])
weak = weakref.ref(obj)

# 通过弱引用访问对象
if weak() is not None:
    result = weak().process()
    print(f"处理结果: {result}")  # 15

# 安全访问模式
def safe_access(weak_ref):
    """安全地访问弱引用对象"""
    target = weak_ref()
    if target is not None:
        return target
    raise ValueError("对象已被回收")

# 带回调的弱引用
def on_delete(ref):
    print(f"对象被删除，弱引用状态: {'dead' if ref() is None else 'alive'}")

obj2 = DataObject([10, 20])
weak2 = weakref.ref(obj2, on_delete)

del obj2  # 输出: 对象被删除，弱引用状态: dead
```

### proxy() - 创建弱引用代理

```python
import weakref

class DatabaseConnection:
    def __init__(self, host):
        self.host = host
        self.connected = True

    def query(self, sql):
        return f"在 {self.host} 上执行: {sql}"

    def close(self):
        self.connected = False
        print(f"关闭连接: {self.host}")

# 创建代理
conn = DatabaseConnection("localhost:5432")
conn_proxy = weakref.proxy(conn)

# 代理透明地转发所有操作
print(conn_proxy.host)           # localhost:5432
print(conn_proxy.query("SELECT 1"))  # 在 localhost:5432 上执行: SELECT 1
print(conn_proxy.connected)      # True

# 可调用对象的代理
class Calculator:
    def __call__(self, x, y):
        return x + y

calc = Calculator()
calc_proxy = weakref.proxy(calc)
print(calc_proxy(3, 5))  # 8

# 代理的限制：对象删除后访问会抛出 ReferenceError
del conn
try:
    print(conn_proxy.host)
except ReferenceError:
    print("连接对象已被回收")
```

### WeakValueDictionary - 弱引用值字典

```python
import weakref

class User:
    def __init__(self, user_id, name):
        self.user_id = user_id
        self.name = name

    def __repr__(self):
        return f"User({self.user_id}, {self.name!r})"

# 创建弱引用值字典作为缓存
user_cache = weakref.WeakValueDictionary()

def get_user(user_id):
    """获取用户，使用弱引用缓存"""
    if user_id in user_cache:
        print(f"从缓存获取用户 {user_id}")
        return user_cache[user_id]

    print(f"创建新用户 {user_id}")
    user = User(user_id, f"用户{user_id}")
    user_cache[user_id] = user
    return user

# 使用缓存
user1 = get_user(1)  # 创建新用户 1
user2 = get_user(1)  # 从缓存获取用户 1
print(f"同一对象: {user1 is user2}")  # True

# 保持引用时，缓存有效
print(f"缓存大小: {len(user_cache)}")  # 1

# 删除强引用后，缓存自动清理
del user1
del user2

# 强制垃圾回收（通常不需要）
import gc
gc.collect()

print(f"缓存大小: {len(user_cache)}")  # 0

# 遍历弱引用字典
user_cache[1] = User(1, "Alice")
user_cache[2] = User(2, "Bob")
ref_user1 = user_cache[1]  # 保持引用

for user_id, user in user_cache.items():
    print(f"  {user_id}: {user}")
```

### WeakKeyDictionary - 弱引用键字典

```python
import weakref

class Session:
    def __init__(self, session_id):
        self.session_id = session_id

    def __repr__(self):
        return f"Session({self.session_id!r})"

# 使用弱引用键字典存储会话数据
session_data = weakref.WeakKeyDictionary()

def store_session_data(session, data):
    """存储会话数据，会话对象被回收时自动清理"""
    session_data[session] = data

def get_session_data(session):
    """获取会话数据"""
    return session_data.get(session)

# 创建会话并存储数据
session1 = Session("abc123")
session2 = Session("def456")

store_session_data(session1, {"user": "Alice", "cart": [1, 2, 3]})
store_session_data(session2, {"user": "Bob", "cart": []})

print(f"会话数据数量: {len(session_data)}")  # 2

# 获取数据
print(get_session_data(session1))  # {'user': 'Alice', 'cart': [1, 2, 3]}

# 删除会话后，数据自动清理
del session1
import gc; gc.collect()

print(f"会话数据数量: {len(session_data)}")  # 1

# 实际应用：对象元数据存储
class Widget:
    def __init__(self, name):
        self.name = name

widget_metadata = weakref.WeakKeyDictionary()

def set_metadata(widget, **kwargs):
    widget_metadata[widget] = kwargs

def get_metadata(widget):
    return widget_metadata.get(widget, {})

w1 = Widget("按钮")
set_metadata(w1, color="blue", size="large")
print(get_metadata(w1))  # {'color': 'blue', 'size': 'large'}
```

### WeakSet - 弱引用集合

```python
import weakref

class Observer:
    def __init__(self, name):
        self.name = name

    def notify(self, message):
        print(f"{self.name} 收到通知: {message}")

    def __repr__(self):
        return f"Observer({self.name!r})"

class Subject:
    """被观察者，使用 WeakSet 存储观察者"""
    def __init__(self):
        self._observers = weakref.WeakSet()

    def attach(self, observer):
        self._observers.add(observer)
        print(f"添加观察者: {observer}")

    def detach(self, observer):
        self._observers.discard(observer)
        print(f"移除观察者: {observer}")

    def notify_all(self, message):
        # 遍历时创建副本，避免迭代时修改
        for observer in list(self._observers):
            observer.notify(message)

    @property
    def observer_count(self):
        return len(self._observers)

# 使用观察者模式
subject = Subject()

obs1 = Observer("观察者A")
obs2 = Observer("观察者B")
obs3 = Observer("观察者C")

subject.attach(obs1)
subject.attach(obs2)
subject.attach(obs3)

print(f"观察者数量: {subject.observer_count}")  # 3

subject.notify_all("第一条消息")

# 删除观察者后自动从集合中移除
del obs2
import gc; gc.collect()

print(f"观察者数量: {subject.observer_count}")  # 2

subject.notify_all("第二条消息")  # 只有 obs1 和 obs3 收到
```

### finalize - 终结器

```python
import weakref
import tempfile
import os

class TempFileManager:
    """使用 finalize 确保临时文件被清理"""
    def __init__(self, content):
        # 创建临时文件
        fd, self.filepath = tempfile.mkstemp(suffix='.txt')
        os.write(fd, content.encode())
        os.close(fd)
        print(f"创建临时文件: {self.filepath}")

        # 注册终结器，对象被回收时自动清理文件
        self._finalizer = weakref.finalize(
            self,
            self._cleanup,
            self.filepath
        )

    @staticmethod
    def _cleanup(filepath):
        """静态方法作为清理函数，避免循环引用"""
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"清理临时文件: {filepath}")

    def read(self):
        with open(self.filepath, 'r') as f:
            return f.read()

    def close(self):
        """手动清理"""
        self._finalizer()

    @property
    def is_alive(self):
        return self._finalizer.alive

# 使用终结器
manager = TempFileManager("Hello, World!")
print(f"文件内容: {manager.read()}")
print(f"终结器存活: {manager.is_alive}")  # True

# 删除对象，自动清理
del manager
import gc; gc.collect()
# 输出: 清理临时文件: /tmp/xxxxx.txt

# 手动调用终结器
manager2 = TempFileManager("Test content")
manager2.close()  # 手动清理
print(f"终结器存活: {manager2.is_alive}")  # False

# 多次调用终结器是安全的（只执行一次）
manager2.close()  # 不会再次执行清理
```

### finalize 的高级用法

```python
import weakref

class ResourcePool:
    """资源池，使用 finalize 跟踪资源泄漏"""
    _active_resources = set()

    def __init__(self, name):
        self.name = name
        self._id = id(self)
        ResourcePool._active_resources.add(self._id)

        # 注册终结器进行泄漏检测
        self._finalizer = weakref.finalize(
            self,
            ResourcePool._check_leak,
            self.name,
            self._id
        )

    @staticmethod
    def _check_leak(name, resource_id):
        if resource_id in ResourcePool._active_resources:
            print(f"警告: 资源 '{name}' 未正确释放就被回收!")
            ResourcePool._active_resources.discard(resource_id)

    def release(self):
        """正确释放资源"""
        ResourcePool._active_resources.discard(self._id)
        self._finalizer.detach()  # 分离终结器，不再执行清理回调
        print(f"资源 '{self.name}' 已释放")

    @classmethod
    def active_count(cls):
        return len(cls._active_resources)

# 正确使用
res1 = ResourcePool("数据库连接")
res1.release()  # 正确释放
del res1

# 泄漏检测
res2 = ResourcePool("文件句柄")
del res2  # 未调用 release()，触发泄漏警告
import gc; gc.collect()
```

### WeakMethod - 绑定方法的弱引用

```python
import weakref

class Button:
    def __init__(self, label):
        self.label = label

    def on_click(self):
        print(f"按钮 '{self.label}' 被点击")

class EventManager:
    """事件管理器，使用 WeakMethod 避免循环引用"""
    def __init__(self):
        self._handlers = []

    def subscribe(self, handler):
        """订阅事件处理器"""
        if hasattr(handler, '__self__'):
            # 绑定方法，使用 WeakMethod
            weak_handler = weakref.WeakMethod(handler, self._remove_handler)
            self._handlers.append(weak_handler)
        else:
            # 普通函数，使用 ref
            weak_handler = weakref.ref(handler, self._remove_handler)
            self._handlers.append(weak_handler)

    def _remove_handler(self, weak_ref):
        """回调：弱引用失效时移除"""
        self._handlers = [h for h in self._handlers if h() is not None]

    def emit(self):
        """触发所有处理器"""
        for weak_handler in self._handlers[:]:  # 使用副本遍历
            handler = weak_handler()
            if handler is not None:
                handler()

    @property
    def handler_count(self):
        return len([h for h in self._handlers if h() is not None])

# 使用
manager = EventManager()

btn1 = Button("确定")
btn2 = Button("取消")

manager.subscribe(btn1.on_click)
manager.subscribe(btn2.on_click)

print(f"处理器数量: {manager.handler_count}")  # 2

manager.emit()
# 输出:
# 按钮 '确定' 被点击
# 按钮 '取消' 被点击

# 删除按钮后，处理器自动移除
del btn1
import gc; gc.collect()

print(f"处理器数量: {manager.handler_count}")  # 1

manager.emit()
# 输出:
# 按钮 '取消' 被点击
```

---

## 最佳实践

### 使用弱引用实现缓存

```python
import weakref
from typing import TypeVar, Generic, Optional, Callable

T = TypeVar('T')

class WeakCache(Generic[T]):
    """通用弱引用缓存"""
    def __init__(self, factory: Callable[[str], T]):
        self._cache = weakref.WeakValueDictionary()
        self._factory = factory
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> T:
        """获取或创建对象"""
        if key in self._cache:
            self._hits += 1
            return self._cache[key]

        self._misses += 1
        value = self._factory(key)
        self._cache[key] = value
        return value

    def stats(self) -> dict:
        return {
            'hits': self._hits,
            'misses': self._misses,
            'size': len(self._cache),
            'hit_rate': self._hits / max(1, self._hits + self._misses)
        }

# 使用示例
class ExpensiveObject:
    def __init__(self, name):
        self.name = name
        print(f"创建昂贵对象: {name}")

cache = WeakCache(ExpensiveObject)

# 获取对象（会创建）
obj1 = cache.get("config")
obj2 = cache.get("config")  # 从缓存获取

print(f"同一对象: {obj1 is obj2}")  # True
print(cache.stats())
```

### 避免循环引用

```python
import weakref

class Parent:
    def __init__(self, name):
        self.name = name
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child._parent = weakref.ref(self)  # 使用弱引用避免循环

class Child:
    def __init__(self, name):
        self.name = name
        self._parent = None  # 弱引用

    @property
    def parent(self):
        if self._parent is not None:
            return self._parent()
        return None

    def get_parent_name(self):
        p = self.parent
        return p.name if p else "无父节点"

# 使用
parent = Parent("父节点")
child = Child("子节点")
parent.add_child(child)

print(child.get_parent_name())  # 父节点

# 删除父节点后
del parent
import gc; gc.collect()

print(child.get_parent_name())  # 无父节点
```

### 使用 finalize 进行资源管理

```python
import weakref
from contextlib import contextmanager

class ManagedResource:
    """使用 finalize 的资源管理模式"""
    _instances = weakref.WeakSet()

    def __init__(self, resource_id):
        self.resource_id = resource_id
        self._closed = False
        self._instances.add(self)

        # 使用 finalize 作为安全网
        self._ensure_cleanup = weakref.finalize(
            self,
            self._warn_unclosed,
            resource_id
        )
        print(f"打开资源: {resource_id}")

    @staticmethod
    def _warn_unclosed(resource_id):
        print(f"警告: 资源 {resource_id} 未正确关闭!")

    def close(self):
        if not self._closed:
            self._closed = True
            self._ensure_cleanup.detach()  # 取消警告
            print(f"关闭资源: {self.resource_id}")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    @classmethod
    def close_all(cls):
        """关闭所有活跃资源"""
        for instance in list(cls._instances):
            instance.close()

# 推荐：使用上下文管理器
with ManagedResource("db_connection") as res:
    print("使用资源...")
# 自动关闭

# 不推荐：忘记关闭（会触发警告）
res = ManagedResource("file_handle")
del res
import gc; gc.collect()
# 警告: 资源 file_handle 未正确关闭!
```

### 观察者模式的正确实现

```python
import weakref
from typing import Callable, Set

class Observable:
    """可观察对象，使用 WeakSet 管理观察者"""
    def __init__(self):
        self._observers: weakref.WeakSet = weakref.WeakSet()
        self._callbacks: Set[weakref.ref] = set()

    def add_observer(self, observer):
        """添加观察者对象"""
        self._observers.add(observer)

    def add_callback(self, callback: Callable):
        """添加回调函数"""
        if hasattr(callback, '__self__'):
            # 绑定方法
            ref = weakref.WeakMethod(callback, self._remove_callback)
        else:
            # 普通函数需要保持强引用或使用其他策略
            ref = weakref.ref(callback, self._remove_callback)
        self._callbacks.add(ref)

    def _remove_callback(self, ref):
        self._callbacks.discard(ref)

    def notify(self, *args, **kwargs):
        """通知所有观察者"""
        # 通知观察者对象
        for observer in list(self._observers):
            if hasattr(observer, 'update'):
                observer.update(*args, **kwargs)

        # 调用回调函数
        for ref in list(self._callbacks):
            callback = ref()
            if callback is not None:
                callback(*args, **kwargs)
```

---

## 常见陷阱

### 对不可弱引用对象使用 weakref

```python
import weakref

# 错误：内置类型不支持弱引用
try:
    weakref.ref([1, 2, 3])
except TypeError as e:
    print(f"错误: {e}")
    # cannot create weak reference to 'list' object

# 解决方案1：使用可弱引用的子类
class WeakableList(list):
    __slots__ = ('__weakref__',)

wl = WeakableList([1, 2, 3])
ref = weakref.ref(wl)  # OK

# 解决方案2：使用包装类
class ListWrapper:
    def __init__(self, data):
        self.data = data

wrapper = ListWrapper([1, 2, 3])
ref = weakref.ref(wrapper)  # OK
```

### 弱引用立即失效

```python
import weakref

class MyClass:
    pass

# 错误：对象没有其他强引用，立即被回收
weak = weakref.ref(MyClass())
print(weak())  # None（对象已被回收）

# 正确：保持强引用
obj = MyClass()
weak = weakref.ref(obj)
print(weak())  # <__main__.MyClass object at ...>
```

### 在回调中创建新的强引用

```python
import weakref

class Resource:
    pass

leaked_resources = []

def bad_callback(weak_ref):
    """错误：回调中尝试复活对象"""
    obj = weak_ref()
    if obj is not None:
        leaked_resources.append(obj)  # 可能导致内存泄漏

# 回调在对象已经不可访问时调用
# weak_ref() 在回调中返回 None
```

### WeakValueDictionary 的迭代问题

```python
import weakref

cache = weakref.WeakValueDictionary()

class Item:
    def __init__(self, name):
        self.name = name

# 添加项目
items = [Item(f"item_{i}") for i in range(5)]
for i, item in enumerate(items):
    cache[i] = item

# 错误：迭代过程中可能发生回收
# for key, value in cache.items():  # 可能抛出 RuntimeError
#     del items[key]  # 危险操作

# 正确：创建副本后迭代
for key, value in list(cache.items()):
    print(f"{key}: {value.name}")
```

### 忽略 proxy 的 ReferenceError

```python
import weakref

class Data:
    value = 42

obj = Data()
proxy = weakref.proxy(obj)

# 错误：不检查对象是否存活
def unsafe_access(proxy):
    return proxy.value  # 可能抛出 ReferenceError

# 正确：使用异常处理
def safe_access(proxy):
    try:
        return proxy.value
    except ReferenceError:
        return None

del obj

print(safe_access(proxy))  # None
```

### finalize 回调中的循环引用

```python
import weakref

class BadExample:
    def __init__(self):
        # 错误：回调引用了 self，导致循环引用
        self._finalizer = weakref.finalize(self, self.cleanup)

    def cleanup(self):
        print("清理")  # 永远不会被调用

class GoodExample:
    def __init__(self):
        # 正确：使用静态方法或外部函数
        self._finalizer = weakref.finalize(
            self,
            GoodExample._cleanup,
            "resource_id"
        )

    @staticmethod
    def _cleanup(resource_id):
        print(f"清理资源: {resource_id}")
```

---

## 性能考量

### 弱引用的开销

```python
import weakref
import time
import sys

class TestObject:
    def __init__(self, value):
        self.value = value

# 测试创建开销
n = 100000

# 普通对象
start = time.perf_counter()
objects = [TestObject(i) for i in range(n)]
normal_time = time.perf_counter() - start

# 带弱引用的对象
start = time.perf_counter()
weak_objects = [(TestObject(i), None) for i in range(n)]
for i, (obj, _) in enumerate(weak_objects):
    weak_objects[i] = (obj, weakref.ref(obj))
weak_time = time.perf_counter() - start

print(f"普通对象创建: {normal_time:.4f}s")
print(f"弱引用创建: {weak_time:.4f}s")
print(f"弱引用开销: {(weak_time - normal_time) / normal_time * 100:.1f}%")
```

### 访问性能比较

```python
import weakref
import time

class Data:
    def __init__(self):
        self.value = 42

obj = Data()
ref = weakref.ref(obj)
proxy = weakref.proxy(obj)

iterations = 1000000

# 直接访问
start = time.perf_counter()
for _ in range(iterations):
    _ = obj.value
direct_time = time.perf_counter() - start

# 通过 ref 访问
start = time.perf_counter()
for _ in range(iterations):
    _ = ref().value
ref_time = time.perf_counter() - start

# 通过 proxy 访问
start = time.perf_counter()
for _ in range(iterations):
    _ = proxy.value
proxy_time = time.perf_counter() - start

print(f"直接访问: {direct_time:.4f}s")
print(f"ref() 访问: {ref_time:.4f}s ({ref_time/direct_time:.1f}x)")
print(f"proxy 访问: {proxy_time:.4f}s ({proxy_time/direct_time:.1f}x)")
```

### WeakValueDictionary vs dict

```python
import weakref
import time

class Value:
    def __init__(self, x):
        self.x = x

n = 10000

# 普通字典
normal_dict = {}
start = time.perf_counter()
for i in range(n):
    normal_dict[i] = Value(i)
for i in range(n):
    _ = normal_dict[i]
dict_time = time.perf_counter() - start

# 保持引用以避免回收
values = list(normal_dict.values())

# 弱引用字典
weak_dict = weakref.WeakValueDictionary()
start = time.perf_counter()
for i in range(n):
    weak_dict[i] = values[i]
for i in range(n):
    _ = weak_dict[i]
weak_time = time.perf_counter() - start

print(f"普通字典: {dict_time:.4f}s")
print(f"弱引用字典: {weak_time:.4f}s ({weak_time/dict_time:.1f}x)")
```

### 内存优化建议

```python
import weakref
import sys

class HeavyObject:
    def __init__(self):
        self.data = [0] * 10000  # 大对象

# 使用弱引用缓存可以节省内存
class MemoryAwareCache:
    def __init__(self, max_strong_refs=100):
        self._weak_cache = weakref.WeakValueDictionary()
        self._strong_cache = {}  # LRU 强引用
        self._max_strong = max_strong_refs
        self._access_order = []

    def get(self, key, factory):
        # 先检查弱引用缓存
        if key in self._weak_cache:
            value = self._weak_cache[key]
            self._promote(key, value)
            return value

        # 创建新对象
        value = factory()
        self._weak_cache[key] = value
        self._promote(key, value)
        return value

    def _promote(self, key, value):
        """提升到强引用缓存"""
        if key in self._strong_cache:
            self._access_order.remove(key)
        elif len(self._strong_cache) >= self._max_strong:
            # 移除最旧的
            oldest = self._access_order.pop(0)
            del self._strong_cache[oldest]

        self._strong_cache[key] = value
        self._access_order.append(key)
```

---

## 实战场景

### 场景1：图像缓存系统

```python
import weakref
from pathlib import Path
from typing import Optional

class Image:
    """模拟图像对象"""
    def __init__(self, path: str, width: int, height: int):
        self.path = path
        self.width = width
        self.height = height
        self.pixels = bytearray(width * height * 4)  # RGBA
        print(f"加载图像: {path} ({width}x{height})")

    def __repr__(self):
        return f"Image({self.path!r}, {self.width}x{self.height})"

class ImageCache:
    """图像缓存管理器"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._cache = weakref.WeakValueDictionary()
            cls._instance._stats = {'hits': 0, 'misses': 0}
        return cls._instance

    def load(self, path: str) -> Image:
        """加载图像（带缓存）"""
        if path in self._cache:
            self._stats['hits'] += 1
            print(f"缓存命中: {path}")
            return self._cache[path]

        self._stats['misses'] += 1
        # 模拟加载图像
        image = Image(path, 800, 600)
        self._cache[path] = image
        return image

    def get_stats(self) -> dict:
        return {
            **self._stats,
            'cached': len(self._cache),
            'hit_rate': self._stats['hits'] / max(1, sum(self._stats.values()))
        }

# 使用
cache = ImageCache()

# 加载图像
img1 = cache.load("/images/photo1.jpg")
img2 = cache.load("/images/photo2.jpg")
img3 = cache.load("/images/photo1.jpg")  # 缓存命中

print(f"同一对象: {img1 is img3}")  # True
print(cache.get_stats())

# 释放图像后自动从缓存移除
del img1, img3
import gc; gc.collect()

print(f"缓存后统计: {cache.get_stats()}")
```

### 场景2：对象注册表

```python
import weakref
from typing import Dict, Optional, Type, TypeVar

T = TypeVar('T')

class ObjectRegistry:
    """全局对象注册表，不阻止对象回收"""
    _registries: Dict[str, 'ObjectRegistry'] = {}

    def __init__(self, name: str):
        self.name = name
        self._objects = weakref.WeakValueDictionary()
        ObjectRegistry._registries[name] = self

    def register(self, key: str, obj: T) -> T:
        """注册对象"""
        self._objects[key] = obj
        return obj

    def get(self, key: str) -> Optional[T]:
        """获取对象"""
        return self._objects.get(key)

    def list_keys(self) -> list:
        """列出所有注册的键"""
        return list(self._objects.keys())

    @classmethod
    def get_registry(cls, name: str) -> 'ObjectRegistry':
        """获取或创建注册表"""
        if name not in cls._registries:
            return cls(name)
        return cls._registries[name]

# 使用示例
class Service:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Service({self.name!r})"

# 服务注册表
services = ObjectRegistry.get_registry("services")

# 注册服务
db_service = services.register("database", Service("PostgreSQL"))
cache_service = services.register("cache", Service("Redis"))

print(f"已注册服务: {services.list_keys()}")  # ['database', 'cache']

# 获取服务
db = services.get("database")
print(f"数据库服务: {db}")  # Service('PostgreSQL')

# 服务不再使用时自动注销
del db_service, db
import gc; gc.collect()

print(f"剩余服务: {services.list_keys()}")  # ['cache']
```

### 场景3：事件系统

```python
import weakref
from typing import Callable, Dict, List, Any
from dataclasses import dataclass

@dataclass
class Event:
    name: str
    data: Any

class EventBus:
    """事件总线，使用弱引用管理订阅者"""
    def __init__(self):
        self._subscribers: Dict[str, List[weakref.ref]] = {}

    def subscribe(self, event_name: str, handler: Callable[[Event], None]):
        """订阅事件"""
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []

        # 创建弱引用，根据处理器类型选择适当的方式
        if hasattr(handler, '__self__'):
            ref = weakref.WeakMethod(handler, lambda r: self._cleanup(event_name, r))
        else:
            # 对于普通函数，需要特殊处理
            ref = weakref.ref(handler, lambda r: self._cleanup(event_name, r))

        self._subscribers[event_name].append(ref)

    def _cleanup(self, event_name: str, dead_ref):
        """清理失效的引用"""
        if event_name in self._subscribers:
            self._subscribers[event_name] = [
                r for r in self._subscribers[event_name]
                if r() is not None
            ]

    def publish(self, event: Event):
        """发布事件"""
        handlers = self._subscribers.get(event.name, [])
        for ref in handlers[:]:  # 使用副本迭代
            handler = ref()
            if handler is not None:
                try:
                    handler(event)
                except Exception as e:
                    print(f"处理器错误: {e}")

    def subscriber_count(self, event_name: str) -> int:
        """获取订阅者数量"""
        handlers = self._subscribers.get(event_name, [])
        return len([r for r in handlers if r() is not None])

class UserController:
    """用户控制器，订阅事件"""
    def __init__(self, name: str, bus: EventBus):
        self.name = name
        bus.subscribe("user.created", self.on_user_created)
        bus.subscribe("user.deleted", self.on_user_deleted)

    def on_user_created(self, event: Event):
        print(f"[{self.name}] 用户创建: {event.data}")

    def on_user_deleted(self, event: Event):
        print(f"[{self.name}] 用户删除: {event.data}")

# 使用
bus = EventBus()

ctrl1 = UserController("Controller1", bus)
ctrl2 = UserController("Controller2", bus)

print(f"订阅者数量: {bus.subscriber_count('user.created')}")  # 2

bus.publish(Event("user.created", {"id": 1, "name": "Alice"}))

# 删除控制器后自动取消订阅
del ctrl1
import gc; gc.collect()

print(f"订阅者数量: {bus.subscriber_count('user.created')}")  # 1

bus.publish(Event("user.created", {"id": 2, "name": "Bob"}))
# 只有 Controller2 收到事件
```

### 场景4：连接池管理

```python
import weakref
from typing import Optional
from dataclasses import dataclass, field
from queue import Queue
import threading

@dataclass
class Connection:
    """数据库连接"""
    conn_id: int
    host: str
    _pool: Optional['ConnectionPool'] = field(default=None, repr=False)
    _finalizer: Optional[weakref.finalize] = field(default=None, repr=False)

    def __post_init__(self):
        if self._pool is not None:
            # 注册终结器，确保连接被归还
            self._finalizer = weakref.finalize(
                self,
                ConnectionPool._return_leaked,
                self._pool,
                self.conn_id
            )

    def execute(self, query: str) -> str:
        return f"[Conn-{self.conn_id}] 执行: {query}"

    def close(self):
        """归还连接到池"""
        if self._pool is not None and self._finalizer is not None:
            self._finalizer.detach()
            self._pool._return(self)

class ConnectionPool:
    """连接池"""
    def __init__(self, host: str, size: int = 5):
        self.host = host
        self.size = size
        self._pool = Queue()
        self._active = weakref.WeakSet()
        self._next_id = 0
        self._lock = threading.Lock()

        # 预创建连接
        for _ in range(size):
            self._pool.put(self._create_connection())

    def _create_connection(self) -> Connection:
        with self._lock:
            self._next_id += 1
            conn = Connection(self._next_id, self.host, self)
            return conn

    def acquire(self) -> Connection:
        """获取连接"""
        conn = self._pool.get()
        self._active.add(conn)
        print(f"获取连接: {conn.conn_id}")
        return conn

    def _return(self, conn: Connection):
        """归还连接"""
        self._active.discard(conn)
        self._pool.put(conn)
        print(f"归还连接: {conn.conn_id}")

    @staticmethod
    def _return_leaked(pool: 'ConnectionPool', conn_id: int):
        """处理泄漏的连接"""
        print(f"警告: 连接 {conn_id} 未正确归还，已泄漏!")
        # 在实际应用中，这里可以创建新连接补充池

    @property
    def available(self) -> int:
        return self._pool.qsize()

    @property
    def active(self) -> int:
        return len(self._active)

# 使用
pool = ConnectionPool("localhost:5432", size=3)
print(f"可用连接: {pool.available}")  # 3

# 正确使用
conn1 = pool.acquire()
print(conn1.execute("SELECT 1"))
conn1.close()  # 正确归还

# 忘记归还（终结器会发出警告）
conn2 = pool.acquire()
del conn2
import gc; gc.collect()
# 警告: 连接 2 未正确归还，已泄漏!

print(f"可用连接: {pool.available}")
```

---

## 面试要点

### Q1: 什么是弱引用？它与强引用有什么区别？

**答案：**

弱引用是一种不增加对象引用计数的引用方式。与强引用的区别：

```python
import weakref
import sys

class MyClass:
    pass

obj = MyClass()
print(sys.getrefcount(obj))  # 2（obj + getrefcount参数）

# 强引用增加引用计数
strong = obj
print(sys.getrefcount(obj))  # 3

# 弱引用不增加引用计数
weak = weakref.ref(obj)
print(sys.getrefcount(obj))  # 仍然是 3

# 删除所有强引用后，对象被回收
del obj, strong
print(weak())  # None
```

关键区别：
- 强引用阻止对象被回收
- 弱引用允许对象在没有强引用时被回收
- 弱引用需要调用才能获取对象（可能返回 None）

### Q2: WeakValueDictionary 和普通字典有什么区别？使用场景是什么？

**答案：**

```python
import weakref

class Data:
    def __init__(self, value):
        self.value = value

# 普通字典：保持强引用
normal_dict = {}
normal_dict['key'] = Data(1)

# WeakValueDictionary：值是弱引用
weak_dict = weakref.WeakValueDictionary()
data = Data(2)
weak_dict['key'] = data

# 区别：删除外部引用后
del data
import gc; gc.collect()

print('key' in weak_dict)  # False，条目自动被移除
```

使用场景：
1. **缓存系统**：缓存对象但不阻止回收
2. **对象注册表**：跟踪对象但不延长生命周期
3. **避免内存泄漏**：大对象的临时引用

### Q3: 如何用弱引用解决循环引用问题？

**答案：**

```python
import weakref

# 有问题的循环引用
class Node:
    def __init__(self, value):
        self.value = value
        self.parent = None
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child.parent = self  # 循环引用！

# 使用弱引用解决
class SafeNode:
    def __init__(self, value):
        self.value = value
        self._parent = None  # 弱引用
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child._parent = weakref.ref(self)  # 弱引用

    @property
    def parent(self):
        return self._parent() if self._parent else None
```

### Q4: finalize 和 `__del__` 有什么区别？为什么推荐使用 finalize？

**答案：**

```python
import weakref

# __del__ 的问题
class ProblematicClass:
    def __init__(self):
        self.resource = "重要资源"

    def __del__(self):
        # 问题1：可能在解释器关闭时不被调用
        # 问题2：循环引用时可能不被调用
        # 问题3：异常被忽略
        print(f"清理: {self.resource}")

# finalize 更可靠
class SafeClass:
    def __init__(self):
        self.resource = "重要资源"
        self._cleanup = weakref.finalize(
            self,
            SafeClass._cleanup_resource,
            self.resource
        )

    @staticmethod
    def _cleanup_resource(resource):
        print(f"清理: {resource}")

# finalize 的优势：
# 保证在对象回收时执行
# 可以手动调用或取消
# 避免循环引用问题（使用静态方法）
# 可检查是否已执行（.alive 属性）
```

### Q5: 如何实现一个线程安全的弱引用缓存？

**答案：**

```python
import weakref
import threading
from typing import TypeVar, Callable, Optional

T = TypeVar('T')

class ThreadSafeWeakCache:
    def __init__(self):
        self._cache = weakref.WeakValueDictionary()
        self._lock = threading.RLock()

    def get_or_create(self, key: str, factory: Callable[[], T]) -> T:
        # 先尝试无锁读取
        if key in self._cache:
            return self._cache[key]

        # 需要创建时加锁
        with self._lock:
            # 双重检查
            if key in self._cache:
                return self._cache[key]

            value = factory()
            self._cache[key] = value
            return value

    def get(self, key: str) -> Optional[T]:
        return self._cache.get(key)

    def invalidate(self, key: str):
        with self._lock:
            self._cache.pop(key, None)
```

### Q6: WeakMethod 和普通的 ref 有什么区别？

**答案：**

```python
import weakref

class Handler:
    def process(self):
        print("处理中...")

handler = Handler()

# 错误：ref 对绑定方法无效
# 因为每次访问 handler.process 都创建新的方法对象
weak_method = weakref.ref(handler.process)
print(weak_method())  # None（方法对象立即被回收）

# 正确：使用 WeakMethod
weak_method = weakref.WeakMethod(handler.process)
print(weak_method())  # <bound method Handler.process of ...>

del handler
print(weak_method())  # None
```

WeakMethod 内部同时弱引用对象和函数，只有两者都存活时才返回绑定方法。

---

## 延伸阅读

### 官方文档

- [weakref - 弱引用支持](https://docs.python.org/3/library/weakref.html)
- [Python 数据模型 - __weakref__](https://docs.python.org/3/reference/datamodel.html)
- [gc - 垃圾回收器接口](https://docs.python.org/3/library/gc.html)

### 深入理解

- [PEP 205 - Weak References](https://peps.python.org/pep-0205/)
- [Python 垃圾回收机制详解](https://docs.python.org/3/faq/design.html#how-does-python-manage-memory)
- [Weak References in Python - Real Python](https://realpython.com/python-memory-management/)

### 相关模块

- `gc` - 垃圾回收器控制
- `sys.getrefcount()` - 获取引用计数
- `tracemalloc` - 内存分配跟踪
- `objgraph` - 对象引用图可视化（第三方库）

### 设计模式参考

- 观察者模式与弱引用
- 享元模式的缓存实现
- 对象池模式

---

## 总结

`weakref` 模块提供了强大的弱引用工具：

| 工具 | 用途 | 典型场景 |
|------|------|----------|
| `ref()` | 创建弱引用 | 缓存、观察者引用 |
| `proxy()` | 创建透明代理 | 需要直接访问属性的场景 |
| `WeakValueDictionary` | 值弱引用字典 | 缓存系统 |
| `WeakKeyDictionary` | 键弱引用字典 | 对象元数据存储 |
| `WeakSet` | 弱引用集合 | 观察者集合 |
| `WeakMethod` | 绑定方法弱引用 | 事件处理器 |
| `finalize` | 终结器 | 资源清理、泄漏检测 |

掌握弱引用可以：
- 实现高效的缓存系统而不造成内存泄漏
- 正确处理循环引用问题
- 实现松耦合的观察者模式
- 进行可靠的资源管理和清理

在实际开发中，弱引用是处理内存管理和对象生命周期的重要工具，尤其在大型应用和长时间运行的服务中不可或缺。
