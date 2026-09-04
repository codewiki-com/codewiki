---
title: collections模块
description: Python collections模块详解，Counter、defaultdict、deque、namedtuple等高级容器
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - collections
  - 容器
  - 数据结构
status: imported
origin: old/src/content/docs/python/collections.zh.md
divergence: 0.214
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 19
  lastUpdated: 2026-01-07
---

`collections` 模块是 Python 标准库中的一个重要模块，提供了多种高性能的容器数据类型，作为内置类型 `dict`、`list`、`set` 和 `tuple` 的补充。这些专用容器在特定场景下能够显著提升代码的效率和可读性。

## 模块概览

```python
from collections import (
    Counter,        # 计数器，用于统计元素出现次数
    defaultdict,    # 带默认值的字典
    OrderedDict,    # 有序字典（Python 3.7+ 普通dict也有序）
    deque,          # 双端队列
    namedtuple,     # 命名元组
    ChainMap,       # 字典链，将多个映射合并
)
```

---

## Counter - 计数器

`Counter` 是 `dict` 的子类，专门用于统计可哈希对象的出现次数。它是数据分析和文本处理中最常用的工具之一。

### 基本用法

```python
from collections import Counter

# 从可迭代对象创建
counter1 = Counter(['a', 'b', 'c', 'a', 'b', 'a'])
print(counter1)  # Counter({'a': 3, 'b': 2, 'c': 1})

# 从字符串创建
counter2 = Counter('abracadabra')
print(counter2)  # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})

# 从关键字参数创建
counter3 = Counter(cats=4, dogs=8)
print(counter3)  # Counter({'dogs': 8, 'cats': 4})

# 从字典创建
counter4 = Counter({'red': 4, 'blue': 2})
print(counter4)  # Counter({'red': 4, 'blue': 2})
```

### 常用方法

```python
from collections import Counter

c = Counter('aabbcccddddeeeee')

# most_common(n) - 返回出现次数最多的n个元素
print(c.most_common(3))  # [('e', 5), ('d', 4), ('c', 3)]

# elements() - 返回一个迭代器，按计数重复元素
print(list(c.elements()))  # ['a', 'a', 'b', 'b', 'c', 'c', 'c', ...]

# update() - 增加计数
c.update('aaa')
print(c['a'])  # 5

# subtract() - 减少计数
c.subtract('aa')
print(c['a'])  # 3

# total() - 返回所有计数的总和 (Python 3.10+)
print(c.total())  # 17
```

### 算术运算

```python
from collections import Counter

c1 = Counter(a=3, b=1)
c2 = Counter(a=1, b=2)

# 加法
print(c1 + c2)  # Counter({'a': 4, 'b': 3})

# 减法（只保留正数计数）
print(c1 - c2)  # Counter({'a': 2})

# 交集（取最小值）
print(c1 & c2)  # Counter({'a': 1, 'b': 1})

# 并集（取最大值）
print(c1 | c2)  # Counter({'a': 3, 'b': 2})

# 正数计数
print(+c1)  # Counter({'a': 3, 'b': 1})

# 负数计数（取反后保留正数）
c3 = Counter(a=2, b=-4)
print(-c3)  # Counter({'b': 4})
```

### 实际应用案例

```python
from collections import Counter

# 案例1：统计单词频率
def word_frequency(text):
    """统计文本中单词出现的频率"""
    words = text.lower().split()
    return Counter(words)

text = "Python is great and Python is easy to learn"
freq = word_frequency(text)
print(freq.most_common(3))  # [('python', 2), ('is', 2), ('great', 1)]

# 案例2：找出两个列表的共同元素及其最小出现次数
list1 = ['a', 'b', 'b', 'c', 'c', 'c']
list2 = ['b', 'b', 'b', 'c', 'c', 'd']
common = Counter(list1) & Counter(list2)
print(common)  # Counter({'c': 2, 'b': 2})

# 案例3：检查是否为字母异位词
def is_anagram(word1, word2):
    """检查两个单词是否为字母异位词"""
    return Counter(word1.lower()) == Counter(word2.lower())

print(is_anagram('listen', 'silent'))  # True
print(is_anagram('hello', 'world'))    # False

# 案例4：统计日志中的错误类型
logs = [
    'ERROR: Connection failed',
    'WARNING: Low memory',
    'ERROR: Timeout',
    'ERROR: Connection failed',
    'INFO: Operation completed',
    'ERROR: Connection failed',
]
error_types = Counter(log.split(':')[0] for log in logs)
print(error_types)  # Counter({'ERROR': 4, 'WARNING': 1, 'INFO': 1})
```

---

## defaultdict - 带默认值的字典

`defaultdict` 是 `dict` 的子类，当访问不存在的键时，会自动创建默认值，而不是抛出 `KeyError`。

### 基本用法

```python
from collections import defaultdict

# 使用 int 作为默认工厂函数（默认值为 0）
dd_int = defaultdict(int)
dd_int['a'] += 1
dd_int['b'] += 2
print(dd_int)  # defaultdict(<class 'int'>, {'a': 1, 'b': 2})
print(dd_int['c'])  # 0（自动创建）

# 使用 list 作为默认工厂函数（默认值为空列表）
dd_list = defaultdict(list)
dd_list['fruits'].append('apple')
dd_list['fruits'].append('banana')
dd_list['vegetables'].append('carrot')
print(dd_list)  # defaultdict(<class 'list'>, {'fruits': ['apple', 'banana'], 'vegetables': ['carrot']})

# 使用 set 作为默认工厂函数（默认值为空集合）
dd_set = defaultdict(set)
dd_set['colors'].add('red')
dd_set['colors'].add('blue')
dd_set['colors'].add('red')  # 重复添加，不会有影响
print(dd_set)  # defaultdict(<class 'set'>, {'colors': {'red', 'blue'}})
```

### 自定义默认值

```python
from collections import defaultdict

# 使用 lambda 设置自定义默认值
dd_custom = defaultdict(lambda: 'N/A')
dd_custom['name'] = 'Alice'
print(dd_custom['name'])    # Alice
print(dd_custom['age'])     # N/A

# 使用普通函数
def default_value():
    return {'count': 0, 'items': []}

dd_func = defaultdict(default_value)
dd_func['category1']['count'] = 5
dd_func['category1']['items'].append('item1')
print(dd_func['category1'])  # {'count': 5, 'items': ['item1']}
print(dd_func['category2'])  # {'count': 0, 'items': []}
```

### 嵌套 defaultdict

```python
from collections import defaultdict

# 创建嵌套的 defaultdict
def nested_dict():
    return defaultdict(nested_dict)

# 无限层级的嵌套字典
nd = nested_dict()
nd['level1']['level2']['level3']['value'] = 'deep'
print(nd['level1']['level2']['level3']['value'])  # deep

# 更实用的两层嵌套
dd_nested = defaultdict(lambda: defaultdict(int))
dd_nested['2024']['January'] += 100
dd_nested['2024']['February'] += 200
dd_nested['2025']['January'] += 150
print(dict(dd_nested['2024']))  # {'January': 100, 'February': 200}
```

### 实际应用案例

```python
from collections import defaultdict

# 案例1：按条件分组
def group_by(items, key_func):
    """按指定条件对元素进行分组"""
    groups = defaultdict(list)
    for item in items:
        groups[key_func(item)].append(item)
    return dict(groups)

words = ['apple', 'bat', 'bar', 'atom', 'book']
grouped = group_by(words, lambda x: x[0])
print(grouped)  # {'a': ['apple', 'atom'], 'b': ['bat', 'bar', 'book']}

# 案例2：构建图的邻接表
edges = [('A', 'B'), ('A', 'C'), ('B', 'C'), ('B', 'D'), ('C', 'D')]
graph = defaultdict(list)
for start, end in edges:
    graph[start].append(end)
    graph[end].append(start)  # 无向图

print(dict(graph))
# {'A': ['B', 'C'], 'B': ['A', 'C', 'D'], 'C': ['A', 'B', 'D'], 'D': ['B', 'C']}

# 案例3：统计嵌套数据
sales_data = [
    {'region': 'North', 'product': 'A', 'amount': 100},
    {'region': 'North', 'product': 'B', 'amount': 200},
    {'region': 'South', 'product': 'A', 'amount': 150},
    {'region': 'North', 'product': 'A', 'amount': 50},
]

# 按地区和产品统计销售额
sales_by_region_product = defaultdict(lambda: defaultdict(int))
for record in sales_data:
    sales_by_region_product[record['region']][record['product']] += record['amount']

for region, products in sales_by_region_product.items():
    print(f"{region}: {dict(products)}")
# North: {'A': 150, 'B': 200}
# South: {'A': 150}

# 案例4：反转字典（一对多映射）
original = {'a': 1, 'b': 2, 'c': 1, 'd': 3, 'e': 2}
inverted = defaultdict(list)
for key, value in original.items():
    inverted[value].append(key)
print(dict(inverted))  # {1: ['a', 'c'], 2: ['b', 'e'], 3: ['d']}
```

---

## OrderedDict - 有序字典

`OrderedDict` 是记住元素插入顺序的字典。虽然从 Python 3.7 开始普通 `dict` 也保持插入顺序，但 `OrderedDict` 仍有其独特功能。

### 基本用法

```python
from collections import OrderedDict

# 创建有序字典
od = OrderedDict()
od['a'] = 1
od['b'] = 2
od['c'] = 3

print(od)  # OrderedDict([('a', 1), ('b', 2), ('c', 3)])

# 从键值对列表创建
od2 = OrderedDict([('x', 10), ('y', 20), ('z', 30)])
print(od2)  # OrderedDict([('x', 10), ('y', 20), ('z', 30)])
```

### OrderedDict vs dict 的区别

```python
from collections import OrderedDict

# 区别1：相等性比较考虑顺序
od1 = OrderedDict([('a', 1), ('b', 2)])
od2 = OrderedDict([('b', 2), ('a', 1)])
d1 = {'a': 1, 'b': 2}
d2 = {'b': 2, 'a': 1}

print(od1 == od2)  # False（顺序不同）
print(d1 == d2)    # True（普通字典不考虑顺序）

# 区别2：move_to_end() 方法
od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])
od.move_to_end('a')  # 移到末尾
print(od)  # OrderedDict([('b', 2), ('c', 3), ('a', 1)])

od.move_to_end('c', last=False)  # 移到开头
print(od)  # OrderedDict([('c', 3), ('b', 2), ('a', 1)])

# 区别3：popitem() 支持指定位置
od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])
print(od.popitem(last=True))   # ('c', 3) - 弹出最后一个
print(od.popitem(last=False))  # ('a', 1) - 弹出第一个
```

### 实际应用案例

```python
from collections import OrderedDict

# 案例1：实现 LRU 缓存
class LRUCache:
    """最近最少使用缓存"""
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key):
        if key not in self.cache:
            return -1
        # 访问后移到末尾（最近使用）
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # 删除最久未使用的（开头）
            self.cache.popitem(last=False)

cache = LRUCache(3)
cache.put('a', 1)
cache.put('b', 2)
cache.put('c', 3)
print(cache.get('a'))  # 1
cache.put('d', 4)      # 'b' 被淘汰
print(list(cache.cache.keys()))  # ['c', 'a', 'd']

# 案例2：保持配置文件的键顺序
config = OrderedDict([
    ('version', '1.0'),
    ('name', 'MyApp'),
    ('debug', False),
    ('database', OrderedDict([
        ('host', 'localhost'),
        ('port', 5432),
        ('name', 'mydb'),
    ])),
])

# 输出时保持原有顺序
import json
print(json.dumps(config, indent=2))

# 案例3：按插入顺序处理任务
class TaskQueue:
    """按插入顺序处理的任务队列（带去重）"""
    def __init__(self):
        self.tasks = OrderedDict()

    def add(self, task_id, task_data):
        if task_id in self.tasks:
            # 已存在则更新并移到末尾
            self.tasks.move_to_end(task_id)
        self.tasks[task_id] = task_data

    def process_next(self):
        if self.tasks:
            return self.tasks.popitem(last=False)
        return None

queue = TaskQueue()
queue.add('task1', {'action': 'send_email'})
queue.add('task2', {'action': 'generate_report'})
queue.add('task1', {'action': 'send_email_updated'})  # 更新并移到末尾

print(queue.process_next())  # ('task2', {'action': 'generate_report'})
print(queue.process_next())  # ('task1', {'action': 'send_email_updated'})
```

---

## deque - 双端队列

`deque`（发音为 "deck"）是一个线程安全的、支持从两端快速添加和删除元素的容器。

### 基本用法

```python
from collections import deque

# 创建 deque
d = deque([1, 2, 3, 4, 5])
print(d)  # deque([1, 2, 3, 4, 5])

# 从右端操作
d.append(6)       # 右端添加
print(d)          # deque([1, 2, 3, 4, 5, 6])
d.pop()           # 右端移除
print(d)          # deque([1, 2, 3, 4, 5])

# 从左端操作
d.appendleft(0)   # 左端添加
print(d)          # deque([0, 1, 2, 3, 4, 5])
d.popleft()       # 左端移除
print(d)          # deque([1, 2, 3, 4, 5])

# 扩展
d.extend([6, 7, 8])        # 右端扩展
d.extendleft([-2, -1, 0])  # 左端扩展（注意顺序会反转）
print(d)  # deque([0, -1, -2, 1, 2, 3, 4, 5, 6, 7, 8])
```

### 限制长度的 deque

```python
from collections import deque

# 创建有最大长度限制的 deque
d = deque(maxlen=5)
for i in range(7):
    d.append(i)
    print(f"添加 {i}: {d}")

# 输出：
# 添加 0: deque([0], maxlen=5)
# 添加 1: deque([0, 1], maxlen=5)
# 添加 2: deque([0, 1, 2], maxlen=5)
# 添加 3: deque([0, 1, 2, 3], maxlen=5)
# 添加 4: deque([0, 1, 2, 3, 4], maxlen=5)
# 添加 5: deque([1, 2, 3, 4, 5], maxlen=5)  # 0 被自动移除
# 添加 6: deque([2, 3, 4, 5, 6], maxlen=5)  # 1 被自动移除
```

### 旋转操作

```python
from collections import deque

d = deque([1, 2, 3, 4, 5])

# 向右旋转
d.rotate(2)
print(d)  # deque([4, 5, 1, 2, 3])

# 向左旋转
d.rotate(-2)
print(d)  # deque([1, 2, 3, 4, 5])
```

### 其他常用方法

```python
from collections import deque

d = deque([1, 2, 3, 2, 4, 2, 5])

# 统计元素出现次数
print(d.count(2))  # 3

# 查找元素索引
print(d.index(3))  # 2

# 在指定位置插入
d.insert(1, 'x')
print(d)  # deque([1, 'x', 2, 3, 2, 4, 2, 5])

# 移除指定元素（第一个匹配）
d.remove('x')
print(d)  # deque([1, 2, 3, 2, 4, 2, 5])

# 反转
d.reverse()
print(d)  # deque([5, 2, 4, 2, 3, 2, 1])

# 清空
d.clear()
print(d)  # deque([])
```

### 性能对比

```python
from collections import deque
import time

# deque vs list 性能对比
n = 100000

# 测试左端插入
lst = []
start = time.time()
for i in range(n):
    lst.insert(0, i)
list_time = time.time() - start

d = deque()
start = time.time()
for i in range(n):
    d.appendleft(i)
deque_time = time.time() - start

print(f"左端插入 {n} 个元素:")
print(f"  list: {list_time:.4f} 秒")
print(f"  deque: {deque_time:.4f} 秒")
print(f"  deque 快 {list_time/deque_time:.1f} 倍")

# 典型输出：
# 左端插入 100000 个元素:
#   list: 2.1234 秒
#   deque: 0.0089 秒
#   deque 快 238.6 倍
```

### 实际应用案例

```python
from collections import deque

# 案例1：滑动窗口最大值
def sliding_window_max(nums, k):
    """计算滑动窗口中的最大值"""
    result = []
    window = deque()  # 存储索引，保持对应值递减

    for i, num in enumerate(nums):
        # 移除超出窗口范围的元素
        while window and window[0] <= i - k:
            window.popleft()

        # 移除所有小于当前元素的值
        while window and nums[window[-1]] < num:
            window.pop()

        window.append(i)

        # 窗口形成后开始记录结果
        if i >= k - 1:
            result.append(nums[window[0]])

    return result

nums = [1, 3, -1, -3, 5, 3, 6, 7]
print(sliding_window_max(nums, 3))  # [3, 3, 5, 5, 6, 7]

# 案例2：保留最近 N 条记录
class RecentHistory:
    """保留最近 N 条历史记录"""
    def __init__(self, max_size=10):
        self.history = deque(maxlen=max_size)

    def add(self, item):
        self.history.append(item)

    def get_all(self):
        return list(self.history)

    def get_latest(self, n=1):
        return list(self.history)[-n:]

history = RecentHistory(5)
for i in range(8):
    history.add(f"action_{i}")
print(history.get_all())  # ['action_3', 'action_4', 'action_5', 'action_6', 'action_7']

# 案例3：BFS 广度优先搜索
def bfs(graph, start):
    """使用 deque 实现广度优先搜索"""
    visited = set()
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        if node not in visited:
            visited.add(node)
            order.append(node)
            queue.extend(n for n in graph[node] if n not in visited)

    return order

graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
print(bfs(graph, 'A'))  # ['A', 'B', 'C', 'D', 'E', 'F']

# 案例4：实现回文检测
def is_palindrome(s):
    """使用 deque 检测回文"""
    d = deque(c.lower() for c in s if c.isalnum())
    while len(d) > 1:
        if d.popleft() != d.pop():
            return False
    return True

print(is_palindrome("A man, a plan, a canal: Panama"))  # True
print(is_palindrome("race a car"))  # False
```

---

## namedtuple - 命名元组

`namedtuple` 创建具有命名字段的元组子类，使代码更具可读性，同时保持元组的不可变性和内存效率。

### 基本用法

```python
from collections import namedtuple

# 创建命名元组类
Point = namedtuple('Point', ['x', 'y'])

# 也可以用逗号分隔的字符串
Point2 = namedtuple('Point2', 'x, y')

# 或者空格分隔
Point3 = namedtuple('Point3', 'x y')

# 创建实例
p = Point(3, 4)
print(p)        # Point(x=3, y=4)
print(p.x)      # 3
print(p.y)      # 4
print(p[0])     # 3 (也支持索引访问)

# 解包
x, y = p
print(f"x={x}, y={y}")  # x=3, y=4
```

### 高级特性

```python
from collections import namedtuple

# 设置默认值 (Python 3.7+)
Person = namedtuple('Person', ['name', 'age', 'city'], defaults=['Unknown', 0, 'N/A'])
p1 = Person('Alice')       # Person(name='Alice', age=0, city='N/A')
p2 = Person('Bob', 25)     # Person(name='Bob', age=25, city='N/A')
p3 = Person('Charlie', 30, 'NYC')  # Person(name='Charlie', age=30, city='NYC')

# rename 参数处理无效字段名
Data = namedtuple('Data', ['class', 'return', 'value'], rename=True)
# 'class' 和 'return' 是关键字，会被重命名为 '_0', '_1'
print(Data._fields)  # ('_0', '_1', 'value')

# module 参数指定模块名（用于序列化）
Point = namedtuple('Point', 'x y', module='geometry')
```

### 内置方法

```python
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)

# _make() - 从可迭代对象创建实例
data = [5, 6]
p2 = Point._make(data)
print(p2)  # Point(x=5, y=6)

# _asdict() - 转换为字典
print(p._asdict())  # {'x': 3, 'y': 4}

# _replace() - 创建替换指定字段的新实例
p3 = p._replace(x=10)
print(p3)  # Point(x=10, y=4)
print(p)   # Point(x=3, y=4) - 原实例不变

# _fields - 查看字段名
print(Point._fields)  # ('x', 'y')

# _field_defaults - 查看默认值 (Python 3.8+)
Person = namedtuple('Person', ['name', 'age'], defaults=[18])
print(Person._field_defaults)  # {'age': 18}
```

### 继承 namedtuple

```python
from collections import namedtuple

# 创建基本的命名元组
_Point = namedtuple('Point', ['x', 'y'])

# 继承并添加方法
class Point(_Point):
    """二维点类，支持数学运算"""

    __slots__ = ()  # 防止创建实例字典，保持内存效率

    @property
    def distance_from_origin(self):
        """计算到原点的距离"""
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __add__(self, other):
        """向量加法"""
        return Point(self.x + other.x, self.y + other.y)

    def __str__(self):
        return f"Point({self.x}, {self.y})"

p1 = Point(3, 4)
p2 = Point(1, 2)

print(p1.distance_from_origin)  # 5.0
print(p1 + p2)  # Point(4, 6)
```

### 实际应用案例

```python
from collections import namedtuple

# 案例1：表示数据库记录
User = namedtuple('User', ['id', 'username', 'email', 'created_at'])

# 模拟从数据库获取数据
db_rows = [
    (1, 'alice', 'alice@example.com', '2024-01-01'),
    (2, 'bob', 'bob@example.com', '2024-01-02'),
]

users = [User._make(row) for row in db_rows]
for user in users:
    print(f"用户 {user.username} 的邮箱是 {user.email}")

# 案例2：表示配置
Config = namedtuple('Config', [
    'host', 'port', 'debug', 'timeout'
], defaults=['localhost', 8080, False, 30])

dev_config = Config(debug=True)
prod_config = Config(host='api.example.com', port=443)

print(dev_config)   # Config(host='localhost', port=8080, debug=True, timeout=30)
print(prod_config)  # Config(host='api.example.com', port=443, debug=False, timeout=30)

# 案例3：表示 RGB 颜色
Color = namedtuple('Color', ['red', 'green', 'blue'])

colors = {
    'white': Color(255, 255, 255),
    'black': Color(0, 0, 0),
    'red': Color(255, 0, 0),
    'green': Color(0, 255, 0),
    'blue': Color(0, 0, 255),
}

def to_hex(color):
    """转换为十六进制颜色代码"""
    return f"#{color.red:02x}{color.green:02x}{color.blue:02x}"

print(to_hex(colors['red']))    # #ff0000
print(to_hex(colors['white']))  # #ffffff

# 案例4：解析 CSV 数据
import csv
from io import StringIO

csv_data = """name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago"""

reader = csv.reader(StringIO(csv_data))
headers = next(reader)
Person = namedtuple('Person', headers)

people = [Person._make(row) for row in reader]
for person in people:
    print(f"{person.name} is {person.age} years old, lives in {person.city}")

# 案例5：表示函数返回多个值
Result = namedtuple('Result', ['success', 'data', 'error'])

def divide(a, b):
    """除法运算，返回结果对象"""
    if b == 0:
        return Result(False, None, "Division by zero")
    return Result(True, a / b, None)

result = divide(10, 2)
if result.success:
    print(f"结果: {result.data}")  # 结果: 5.0
else:
    print(f"错误: {result.error}")
```

---

## ChainMap - 字典链

`ChainMap` 将多个字典合并为一个逻辑视图，查找时按顺序搜索，非常适合处理作用域和配置优先级。

### 基本用法

```python
from collections import ChainMap

# 创建 ChainMap
defaults = {'color': 'red', 'size': 'medium', 'theme': 'dark'}
user_settings = {'color': 'blue'}
session_settings = {'size': 'large'}

# 优先级：session > user > defaults
settings = ChainMap(session_settings, user_settings, defaults)

print(settings['color'])  # blue (来自 user_settings)
print(settings['size'])   # large (来自 session_settings)
print(settings['theme'])  # dark (来自 defaults)

# 查看所有字典
print(settings.maps)
# [{'size': 'large'}, {'color': 'blue'}, {'color': 'red', 'size': 'medium', 'theme': 'dark'}]
```

### 修改操作

```python
from collections import ChainMap

dict1 = {'a': 1, 'b': 2}
dict2 = {'b': 3, 'c': 4}
cm = ChainMap(dict1, dict2)

# 修改只影响第一个字典
cm['a'] = 10
cm['d'] = 5
print(dict1)  # {'a': 10, 'b': 2, 'd': 5}
print(dict2)  # {'b': 3, 'c': 4} - 未改变

# 删除操作也只影响第一个字典
del cm['d']
print(dict1)  # {'a': 10, 'b': 2}

# 尝试删除不在第一个字典中的键会报错
# del cm['c']  # KeyError: "Key not found in the first mapping: 'c'"
```

### new_child 和 parents

```python
from collections import ChainMap

defaults = {'color': 'red', 'size': 'medium'}
user = {'color': 'blue'}
cm = ChainMap(user, defaults)

# new_child() 创建新的 ChainMap，添加一个空字典在最前面
cm_child = cm.new_child()
cm_child['color'] = 'green'
cm_child['temp'] = 'value'

print(cm_child['color'])  # green
print(cm['color'])        # blue - 原 ChainMap 不受影响

# new_child(m) 添加指定字典
session = {'size': 'large'}
cm_session = cm.new_child(session)
print(cm_session['size'])   # large
print(cm_session['color'])  # blue

# parents 返回除第一个字典外的所有字典
print(cm.parents)  # ChainMap({'color': 'red', 'size': 'medium'})
```

### 实际应用案例

```python
from collections import ChainMap
import os

# 案例1：实现变量作用域（类似 Python 的 LEGB 规则）
class Scope:
    """简单的作用域实现"""
    def __init__(self):
        self.maps = ChainMap({})  # 从一个空的全局作用域开始

    def enter_scope(self):
        """进入新的作用域"""
        self.maps = self.maps.new_child()

    def exit_scope(self):
        """退出当前作用域"""
        self.maps = self.maps.parents

    def set(self, name, value):
        """在当前作用域设置变量"""
        self.maps[name] = value

    def get(self, name):
        """获取变量（按作用域链查找）"""
        return self.maps.get(name)

scope = Scope()
scope.set('x', 1)           # 全局 x = 1
scope.enter_scope()
scope.set('y', 2)           # 局部 y = 2
print(scope.get('x'))       # 1 (从外层作用域找到)
print(scope.get('y'))       # 2
scope.set('x', 10)          # 局部 x = 10 (遮蔽全局)
print(scope.get('x'))       # 10
scope.exit_scope()
print(scope.get('x'))       # 1 (恢复全局值)
print(scope.get('y'))       # None (y 不在当前作用域)

# 案例2：多层配置优先级
def get_config():
    """按优先级加载配置：命令行 > 环境变量 > 配置文件 > 默认值"""

    defaults = {
        'debug': False,
        'host': 'localhost',
        'port': 8080,
        'log_level': 'INFO',
    }

    config_file = {
        'host': 'api.example.com',
        'port': 443,
    }

    # 从环境变量读取（带 APP_ 前缀）
    env_config = {
        key[4:].lower(): value
        for key, value in os.environ.items()
        if key.startswith('APP_')
    }

    # 模拟命令行参数
    cli_args = {
        'debug': True,
    }

    # 优先级：cli > env > file > defaults
    return ChainMap(cli_args, env_config, config_file, defaults)

config = get_config()
print(f"Debug: {config['debug']}")      # True (cli)
print(f"Host: {config['host']}")        # api.example.com (file)
print(f"Log level: {config['log_level']}")  # INFO (defaults)

# 案例3：合并多个字典并保持原始引用
def merge_dicts(*dicts):
    """合并多个字典，后面的优先级更高"""
    return ChainMap(*reversed(dicts))

base = {'a': 1, 'b': 2}
override = {'b': 20, 'c': 3}
merged = merge_dicts(base, override)

print(dict(merged))  # {'a': 1, 'b': 20, 'c': 3}

# 修改原始字典会反映在 ChainMap 中
base['a'] = 100
print(merged['a'])  # 100

# 案例4：实现简单的模板上下文
class TemplateContext:
    """模板渲染上下文"""
    def __init__(self, **globals):
        self._context = ChainMap(globals)

    def render(self, template, **locals):
        """渲染模板，locals 优先于 globals"""
        ctx = self._context.new_child(locals)
        return template.format(**ctx)

ctx = TemplateContext(site_name="MyApp", year=2024)

# globals 可用
print(ctx.render("Welcome to {site_name}!"))
# Welcome to MyApp!

# locals 覆盖 globals
print(ctx.render("Copyright {year} {site_name}", year=2025))
# Copyright 2025 MyApp
```

---

## 总结与对比

### 各容器类型适用场景

| 容器类型 | 主要用途 | 特点 |
|---------|---------|------|
| `Counter` | 计数统计 | 继承自 dict，支持数学运算 |
| `defaultdict` | 自动初始化值 | 避免 KeyError，简化代码 |
| `OrderedDict` | 需要顺序敏感的字典操作 | 支持 move_to_end，相等性考虑顺序 |
| `deque` | 双端队列操作 | 两端操作 O(1)，支持最大长度限制 |
| `namedtuple` | 轻量级不可变数据对象 | 内存效率高，支持索引和属性访问 |
| `ChainMap` | 多字典查找与合并 | 保持原字典引用，适合作用域管理 |

### 性能特点

```python
# Counter: 基于 dict，计数操作 O(1)
# defaultdict: 基于 dict，查找和插入 O(1)
# OrderedDict: 基于 dict + 双向链表，大部分操作 O(1)
# deque: 双端操作 O(1)，中间访问 O(n)
# namedtuple: 与 tuple 相同，O(1) 访问
# ChainMap: 查找 O(n*m)，n 为字典数量，m 为平均字典大小
```

### 如何选择

1. **需要统计元素出现次数** -> `Counter`
2. **需要字典默认值避免 KeyError** -> `defaultdict`
3. **需要字典顺序敏感的操作（如 LRU 缓存）** -> `OrderedDict`
4. **需要高效的队列/栈操作** -> `deque`
5. **需要轻量级的数据记录类型** -> `namedtuple`
6. **需要合并多个字典或实现作用域** -> `ChainMap`

---

## 扩展阅读

- [Python 官方文档 - collections](https://docs.python.org/3/library/collections.html)
- [typing.NamedTuple](https://docs.python.org/3/library/typing.html#typing.NamedTuple) - 类型注解版本的命名元组
- [dataclasses](https://docs.python.org/3/library/dataclasses.html) - 更现代的数据类实现
