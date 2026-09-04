---
title: Python集合(Set)完全指南
description: 深入理解Python集合数据类型，包括set创建、集合运算、frozenset、集合推导式以及成员测试性能优化
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - 集合
  - set
  - frozenset
  - 数据结构
  - 哈希表
status: imported
origin: old/src/content/docs/python/sets.zh.md
divergence: 0.257
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: 数据结构
  order: 5
  lastUpdated: 2026-01-07
---

## 概念解释

集合（Set）是 Python 中一种无序、不重复的数据容器。它基于数学中集合的概念设计，支持并集、交集、差集等标准集合运算。集合在 Python 2.4 版本正式引入，是处理去重、成员测试和集合运算的首选数据结构。

### 集合的主要特征

- **无序性**：集合中的元素没有固定顺序，不支持索引访问
- **唯一性**：集合中的元素不会重复，自动去重
- **可变性**：`set` 是可变类型，可以添加或删除元素；`frozenset` 是不可变类型
- **元素要求**：集合中的元素必须是可哈希的（hashable）

### 为什么需要集合

集合解决了以下常见编程问题：

1. **快速去重**：比列表去重更高效
2. **成员测试**：O(1) 时间复杂度的查找
3. **集合运算**：数学集合操作的原生支持
4. **数据建模**：表示具有唯一性约束的数据

---

## 核心原理

### 哈希表实现

Python 集合基于哈希表（Hash Table）实现，这是其高效性能的基础。

```python
# 哈希表的基本原理
value = "hello"
hash_value = hash(value)
print(f"'{value}' 的哈希值: {hash_value}")
# 哈希值用于确定元素在内部数组中的存储位置
```

### 哈希冲突处理

当两个不同的元素具有相同的哈希值时，Python 使用开放寻址法（Open Addressing）解决冲突：

```python
# 哈希冲突示例（虽然很罕见）
# Python 的哈希函数设计良好，冲突概率很低
a = "hello"
b = "world"
print(f"hash('hello') = {hash(a)}")
print(f"hash('world') = {hash(b)}")
# 即使哈希值相同，集合仍能正确区分不同元素
```

### 可哈希性要求

集合元素必须是可哈希的，这意味着：

```python
# 可哈希类型（可作为集合元素）
valid_set = {1, 2.5, "string", (1, 2, 3), frozenset([4, 5])}
print(valid_set)

# 不可哈希类型（不能作为集合元素）
try:
    invalid_set = {[1, 2, 3]}  # 列表不可哈希
except TypeError as e:
    print(f"错误: {e}")  # unhashable type: 'list'

try:
    invalid_set = {{1, 2}}  # 集合本身不可哈希
except TypeError as e:
    print(f"错误: {e}")  # unhashable type: 'set'

# 字典也不可哈希
try:
    invalid_set = {{'key': 'value'}}
except TypeError as e:
    print(f"错误: {e}")  # unhashable type: 'dict'
```

### 内存布局

```python
import sys

# 集合的内存开销
empty_set = set()
small_set = {1, 2, 3}
large_set = set(range(1000))

print(f"空集合大小: {sys.getsizeof(empty_set)} 字节")
print(f"3元素集合大小: {sys.getsizeof(small_set)} 字节")
print(f"1000元素集合大小: {sys.getsizeof(large_set)} 字节")

# 集合会预分配空间以减少扩容次数
```

---

## 核心要点

### 集合创建方式

```python
# 方式1：使用花括号（最常用）
set1 = {1, 2, 3, 4, 5}
print(f"花括号创建: {set1}")

# 方式2：使用 set() 构造函数
set2 = set([1, 2, 3, 4, 5])  # 从列表创建
set3 = set("hello")           # 从字符串创建
set4 = set((1, 2, 3))         # 从元组创建
set5 = set(range(5))          # 从范围创建
print(f"从列表创建: {set2}")
print(f"从字符串创建: {set3}")  # {'h', 'e', 'l', 'o'}

# 方式3：创建空集合（必须用 set()）
empty_set = set()  # 正确
empty_dict = {}    # 这是空字典，不是空集合！
print(f"空集合: {empty_set}, 类型: {type(empty_set)}")
print(f"空字典: {empty_dict}, 类型: {type(empty_dict)}")

# 方式4：集合推导式
set6 = {x**2 for x in range(10)}
print(f"集合推导式: {set6}")  # {0, 1, 4, 9, 16, 25, 36, 49, 64, 81}
```

### 基本操作

```python
s = {1, 2, 3}

# 添加元素
s.add(4)
print(f"添加后: {s}")  # {1, 2, 3, 4}

# 添加已存在的元素（无影响）
s.add(3)
print(f"添加重复元素后: {s}")  # {1, 2, 3, 4}

# 添加多个元素
s.update([5, 6, 7])
print(f"update后: {s}")  # {1, 2, 3, 4, 5, 6, 7}

# 删除元素
s.remove(7)     # 元素不存在会抛出 KeyError
s.discard(6)    # 元素不存在不会报错
print(f"删除后: {s}")  # {1, 2, 3, 4, 5}

# pop() 删除并返回任意一个元素
element = s.pop()
print(f"pop返回: {element}, 剩余: {s}")

# clear() 清空集合
s.clear()
print(f"清空后: {s}")  # set()
```

### 成员测试

```python
fruits = {"apple", "banana", "cherry", "date"}

# in 运算符
print("apple" in fruits)      # True
print("grape" in fruits)      # False
print("apple" not in fruits)  # False

# 与列表对比
import time

# 创建大型数据集
large_list = list(range(1000000))
large_set = set(range(1000000))

# 测试查找性能
def test_membership(container, value):
    start = time.perf_counter()
    for _ in range(1000):
        _ = value in container
    return time.perf_counter() - start

list_time = test_membership(large_list, 999999)
set_time = test_membership(large_set, 999999)

print(f"列表查找时间: {list_time:.6f} 秒")
print(f"集合查找时间: {set_time:.6f} 秒")
print(f"集合快 {list_time/set_time:.1f} 倍")
```

### 集合长度和迭代

```python
colors = {"red", "green", "blue", "yellow"}

# 长度
print(f"元素数量: {len(colors)}")  # 4

# 迭代（顺序不确定）
for color in colors:
    print(color)

# 转换为有序列表
sorted_colors = sorted(colors)
print(f"排序后: {sorted_colors}")
```

---

## 代码示例

### 集合运算（union, intersection, difference, symmetric_difference）

集合支持数学中的标准集合运算，可以使用方法或运算符两种方式。

#### 并集（Union）

```python
A = {1, 2, 3, 4}
B = {3, 4, 5, 6}

# 方法形式
union1 = A.union(B)
print(f"A.union(B): {union1}")  # {1, 2, 3, 4, 5, 6}

# 运算符形式
union2 = A | B
print(f"A | B: {union2}")  # {1, 2, 3, 4, 5, 6}

# 多个集合的并集
C = {7, 8, 9}
union3 = A.union(B, C)
union4 = A | B | C
print(f"A | B | C: {union4}")  # {1, 2, 3, 4, 5, 6, 7, 8, 9}

# 原集合不变
print(f"A 仍为: {A}")  # {1, 2, 3, 4}
```

#### 交集（Intersection）

```python
A = {1, 2, 3, 4}
B = {3, 4, 5, 6}

# 方法形式
intersection1 = A.intersection(B)
print(f"A.intersection(B): {intersection1}")  # {3, 4}

# 运算符形式
intersection2 = A & B
print(f"A & B: {intersection2}")  # {3, 4}

# 多个集合的交集
C = {3, 4, 7, 8}
intersection3 = A.intersection(B, C)
intersection4 = A & B & C
print(f"A & B & C: {intersection4}")  # {3, 4}

# 使用 intersection_update 原地修改
D = {1, 2, 3, 4}
D.intersection_update(B)
print(f"D 原地更新后: {D}")  # {3, 4}
```

#### 差集（Difference）

```python
A = {1, 2, 3, 4}
B = {3, 4, 5, 6}

# 方法形式 - A 中有但 B 中没有的元素
difference1 = A.difference(B)
print(f"A.difference(B): {difference1}")  # {1, 2}

# 运算符形式
difference2 = A - B
print(f"A - B: {difference2}")  # {1, 2}

# 注意顺序很重要
difference3 = B - A
print(f"B - A: {difference3}")  # {5, 6}

# 多个集合的差集
C = {2, 7}
difference4 = A - B - C
print(f"A - B - C: {difference4}")  # {1}

# 使用 difference_update 原地修改
D = {1, 2, 3, 4}
D.difference_update(B)
print(f"D 原地更新后: {D}")  # {1, 2}
```

#### 对称差集（Symmetric Difference）

```python
A = {1, 2, 3, 4}
B = {3, 4, 5, 6}

# 方法形式 - 只在其中一个集合中出现的元素
sym_diff1 = A.symmetric_difference(B)
print(f"A.symmetric_difference(B): {sym_diff1}")  # {1, 2, 5, 6}

# 运算符形式
sym_diff2 = A ^ B
print(f"A ^ B: {sym_diff2}")  # {1, 2, 5, 6}

# 等价于 (A | B) - (A & B)
equivalent = (A | B) - (A & B)
print(f"(A | B) - (A & B): {equivalent}")  # {1, 2, 5, 6}

# 也等价于 (A - B) | (B - A)
equivalent2 = (A - B) | (B - A)
print(f"(A - B) | (B - A): {equivalent2}")  # {1, 2, 5, 6}

# 使用 symmetric_difference_update 原地修改
D = {1, 2, 3, 4}
D.symmetric_difference_update(B)
print(f"D 原地更新后: {D}")  # {1, 2, 5, 6}
```

### 集合关系判断

```python
A = {1, 2, 3}
B = {1, 2, 3, 4, 5}
C = {1, 2, 3}
D = {7, 8, 9}

# 子集判断
print(f"A.issubset(B): {A.issubset(B)}")  # True
print(f"A <= B: {A <= B}")                 # True
print(f"A < B (真子集): {A < B}")          # True

# 超集判断
print(f"B.issuperset(A): {B.issuperset(A)}")  # True
print(f"B >= A: {B >= A}")                     # True
print(f"B > A (真超集): {B > A}")              # True

# 相等判断
print(f"A == C: {A == C}")  # True
print(f"A <= C and A >= C: {A <= C and A >= C}")  # True

# 不相交判断
print(f"A.isdisjoint(D): {A.isdisjoint(D)}")  # True
print(f"A.isdisjoint(B): {A.isdisjoint(B)}")  # False
```

### frozenset - 不可变集合

`frozenset` 是不可变版本的集合，可以作为字典的键或另一个集合的元素。

```python
# 创建 frozenset
fs1 = frozenset([1, 2, 3, 4])
fs2 = frozenset("hello")
fs3 = frozenset({5, 6, 7})

print(f"frozenset 从列表: {fs1}")
print(f"frozenset 从字符串: {fs2}")

# frozenset 支持所有不修改集合的操作
print(f"并集: {fs1 | fs3}")
print(f"交集: {fs1 & frozenset([2, 3, 4, 5])}")
print(f"差集: {fs1 - frozenset([1, 2])}")

# frozenset 不支持修改操作
try:
    fs1.add(5)
except AttributeError as e:
    print(f"错误: 'frozenset' object has no attribute 'add'")

# frozenset 可以作为字典的键
graph = {
    frozenset(['A', 'B']): 5,
    frozenset(['B', 'C']): 3,
    frozenset(['A', 'C']): 7,
}
print(f"边 A-B 的权重: {graph[frozenset(['A', 'B'])]}")
print(f"边 A-B 的权重: {graph[frozenset(['B', 'A'])]}")  # 顺序无关

# frozenset 可以作为集合的元素
set_of_sets = {
    frozenset([1, 2]),
    frozenset([3, 4]),
    frozenset([1, 2]),  # 重复，会被去除
}
print(f"集合的集合: {set_of_sets}")

# frozenset 可以与 set 进行运算
regular_set = {1, 2, 3}
frozen = frozenset([3, 4, 5])
result = regular_set | frozen  # 结果是 set
print(f"set | frozenset = {result}, 类型: {type(result)}")

# 空 frozenset
empty_frozen = frozenset()
print(f"空 frozenset: {empty_frozen}")
```

### 集合推导式（Set Comprehension）

```python
# 基本语法
squares = {x**2 for x in range(10)}
print(f"平方数: {squares}")

# 带条件的推导式
even_squares = {x**2 for x in range(10) if x % 2 == 0}
print(f"偶数的平方: {even_squares}")  # {0, 4, 16, 36, 64}

# 从字符串创建集合
sentence = "hello world python"
vowels = {char for char in sentence if char in 'aeiou'}
print(f"元音字母: {vowels}")  # {'e', 'o'}

# 嵌套推导式
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
all_elements = {elem for row in matrix for elem in row}
print(f"矩阵所有元素: {all_elements}")

# 使用函数
words = ["Hello", "WORLD", "Python", "hello"]
unique_lower = {word.lower() for word in words}
print(f"唯一小写单词: {unique_lower}")  # {'hello', 'world', 'python'}

# 与字典配合
data = {'a': 1, 'b': 2, 'c': 1, 'd': 3}
unique_values = {v for v in data.values()}
print(f"唯一值: {unique_values}")  # {1, 2, 3}
```

---

## 最佳实践

### 选择正确的数据结构

```python
# 需要去重时使用集合
numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
unique = list(set(numbers))  # 注意：不保持顺序
print(f"去重后: {unique}")

# 需要保持顺序的去重
def unique_ordered(items):
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

# Python 3.7+ 可以用 dict.fromkeys
unique_ordered2 = list(dict.fromkeys(numbers))
print(f"保持顺序去重: {unique_ordered2}")

# 频繁成员测试时使用集合
allowed_users = {'alice', 'bob', 'charlie'}  # 使用集合
# allowed_users = ['alice', 'bob', 'charlie']  # 不推荐用列表

def is_allowed(user):
    return user in allowed_users  # O(1) 而不是 O(n)
```

### 使用集合简化逻辑

```python
# 检查是否有共同元素
list1 = [1, 2, 3, 4, 5]
list2 = [4, 5, 6, 7, 8]

# 传统方式
has_common = False
for item in list1:
    if item in list2:
        has_common = True
        break

# 使用集合
has_common = bool(set(list1) & set(list2))
# 或者
has_common = not set(list1).isdisjoint(list2)

# 检查列表是否有重复元素
def has_duplicates(items):
    return len(items) != len(set(items))

print(has_duplicates([1, 2, 3, 4]))      # False
print(has_duplicates([1, 2, 2, 3]))      # True
```

### 集合运算的选择

```python
# 方法 vs 运算符
# 方法可以接受任何可迭代对象
s = {1, 2, 3}
s.update([4, 5], (6, 7), {8, 9})  # 接受多个可迭代对象
print(s)

# 运算符只能用于集合
# s |= [4, 5]  # TypeError
s |= {4, 5}    # 正确

# 需要保留原集合时使用非原地方法
original = {1, 2, 3}
new_set = original | {4, 5}  # original 不变
print(f"原集合: {original}")
print(f"新集合: {new_set}")
```

### 使用 frozenset 确保不可变性

```python
# 作为常量配置
ALLOWED_EXTENSIONS = frozenset({'.jpg', '.png', '.gif', '.webp'})

def is_valid_image(filename):
    import os
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

# 作为字典键（表示无序组合）
def count_pairs(items):
    """统计元素对出现的次数"""
    from collections import Counter
    pairs = Counter()
    for i, a in enumerate(items):
        for b in items[i+1:]:
            pairs[frozenset([a, b])] += 1
    return pairs

data = ['A', 'B', 'A', 'C', 'B', 'A']
print(count_pairs(data))
```

---

## 常见陷阱

### 空集合的创建

```python
# 错误：{} 是空字典，不是空集合
wrong_empty = {}
print(type(wrong_empty))  # <class 'dict'>

# 正确：使用 set()
correct_empty = set()
print(type(correct_empty))  # <class 'set'>
```

### 集合元素的可变性问题

```python
# 错误：试图将可变对象放入集合
try:
    s = {[1, 2, 3]}  # 列表不可哈希
except TypeError as e:
    print(f"错误: {e}")

# 解决方案：转换为不可变类型
s = {tuple([1, 2, 3])}  # 使用元组
s = {frozenset([1, 2, 3])}  # 使用 frozenset

# 注意：元组中的元素也必须可哈希
try:
    s = {([1, 2], [3, 4])}  # 元组包含列表，仍然不可哈希
except TypeError as e:
    print(f"错误: {e}")
```

### 迭代时修改集合

```python
# 错误：在迭代时修改集合
s = {1, 2, 3, 4, 5}
try:
    for item in s:
        if item % 2 == 0:
            s.remove(item)  # RuntimeError
except RuntimeError as e:
    print(f"错误: {e}")

# 正确方法1：创建副本迭代
s = {1, 2, 3, 4, 5}
for item in s.copy():  # 或 list(s) 或 set(s)
    if item % 2 == 0:
        s.remove(item)
print(s)  # {1, 3, 5}

# 正确方法2：使用集合推导式
s = {1, 2, 3, 4, 5}
s = {item for item in s if item % 2 != 0}
print(s)  # {1, 3, 5}

# 正确方法3：使用差集
s = {1, 2, 3, 4, 5}
to_remove = {item for item in s if item % 2 == 0}
s -= to_remove
print(s)  # {1, 3, 5}
```

### remove vs discard

```python
s = {1, 2, 3}

# remove 在元素不存在时抛出异常
try:
    s.remove(10)
except KeyError as e:
    print(f"KeyError: {e}")

# discard 在元素不存在时静默忽略
s.discard(10)  # 不会报错
print(s)  # {1, 2, 3}

# 最佳实践：不确定元素是否存在时用 discard
def safe_remove(s, item):
    s.discard(item)  # 安全
    # 或者
    # if item in s:
    #     s.remove(item)
```

### 集合顺序的不确定性

```python
# 集合是无序的，不要依赖元素顺序
s = {'c', 'a', 'b'}
print(list(s))  # 顺序不确定

# 如果需要顺序，使用 sorted()
print(sorted(s))  # ['a', 'b', 'c']

# 或使用 collections.OrderedDict 模拟有序集合
from collections import OrderedDict

class OrderedSet:
    def __init__(self, items=None):
        self._dict = OrderedDict()
        if items:
            for item in items:
                self.add(item)

    def add(self, item):
        self._dict[item] = None

    def __iter__(self):
        return iter(self._dict.keys())

    def __contains__(self, item):
        return item in self._dict

    def __len__(self):
        return len(self._dict)

os = OrderedSet(['c', 'a', 'b', 'a'])
print(list(os))  # ['c', 'a', 'b'] - 保持插入顺序，去重
```

### 浮点数在集合中的问题

```python
# 浮点数精度问题
s = {0.1 + 0.2}
print(0.3 in s)  # False!
print(0.1 + 0.2)  # 0.30000000000000004

# 解决方案：使用 Decimal 或整数
from decimal import Decimal
s = {Decimal('0.1') + Decimal('0.2')}
print(Decimal('0.3') in s)  # True

# 或者转换为整数（如金额用分表示）
cents = {10 + 20}  # 30 分
print(30 in cents)  # True
```

---

## 性能考量

### 时间复杂度对比

| 操作 | set | list |
|------|-----|------|
| 添加元素 | O(1) | O(1) 或 O(n) |
| 删除元素 | O(1) | O(n) |
| 成员测试 `in` | O(1) | O(n) |
| 获取长度 | O(1) | O(1) |
| 迭代 | O(n) | O(n) |
| 并集 | O(len(s)+len(t)) | - |
| 交集 | O(min(len(s), len(t))) | - |
| 差集 | O(len(s)) | - |

### 性能测试

```python
import time

def benchmark(name, func, *args, iterations=10000):
    start = time.perf_counter()
    for _ in range(iterations):
        func(*args)
    elapsed = time.perf_counter() - start
    print(f"{name}: {elapsed:.4f} 秒")
    return elapsed

# 准备测试数据
size = 10000
test_list = list(range(size))
test_set = set(range(size))
search_value = size - 1  # 最坏情况

# 成员测试性能对比
print("=== 成员测试 (10000次) ===")
list_time = benchmark("列表", lambda: search_value in test_list)
set_time = benchmark("集合", lambda: search_value in test_set)
print(f"集合比列表快 {list_time/set_time:.1f} 倍\n")

# 去重性能对比
data_with_dups = list(range(5000)) * 2  # 10000 个元素，50% 重复

def dedupe_list(lst):
    result = []
    for item in lst:
        if item not in result:
            result.append(item)
    return result

def dedupe_set(lst):
    return list(set(lst))

print("=== 去重性能 (1000次) ===")
list_time = benchmark("列表去重", dedupe_list, data_with_dups, iterations=100)
set_time = benchmark("集合去重", dedupe_set, data_with_dups, iterations=100)
print(f"集合去重比列表去重快 {list_time/set_time:.1f} 倍\n")

# 交集性能
set_a = set(range(10000))
set_b = set(range(5000, 15000))

print("=== 集合运算 (10000次) ===")
benchmark("交集", lambda: set_a & set_b)
benchmark("并集", lambda: set_a | set_b)
benchmark("差集", lambda: set_a - set_b)
benchmark("对称差集", lambda: set_a ^ set_b)
```

### 内存效率

```python
import sys

# 比较不同数据结构的内存占用
n = 10000
data = list(range(n))

list_size = sys.getsizeof(data) + sum(sys.getsizeof(i) for i in data)
set_size = sys.getsizeof(set(data)) + sum(sys.getsizeof(i) for i in data)
tuple_size = sys.getsizeof(tuple(data)) + sum(sys.getsizeof(i) for i in data)

print(f"列表总内存: {list_size:,} 字节")
print(f"集合总内存: {set_size:,} 字节")
print(f"元组总内存: {tuple_size:,} 字节")

# 集合的内存开销主要来自哈希表
# 集合通常比列表占用更多内存，但查找更快
```

### 优化技巧

```python
# 提前创建集合避免重复转换
users = ['alice', 'bob', 'charlie', 'alice', 'david']

# 不好：每次都创建新集合
def check_users_bad(users, allowed):
    for user in users:
        if user in set(allowed):  # 每次循环都创建新集合
            print(f"{user} is allowed")

# 好：提前创建集合
def check_users_good(users, allowed):
    allowed_set = set(allowed)  # 只创建一次
    for user in users:
        if user in allowed_set:
            print(f"{user} is allowed")

# 使用集合推导式而不是循环
# 不好
result = set()
for x in range(1000):
    if x % 2 == 0:
        result.add(x ** 2)

# 好
result = {x ** 2 for x in range(1000) if x % 2 == 0}

# 使用适当的集合操作
list1 = list(range(10000))
list2 = list(range(5000, 15000))

# 不好：手动实现交集
common = []
set2 = set(list2)
for item in list1:
    if item in set2:
        common.append(item)

# 好：使用内置集合运算
common = list(set(list1) & set(list2))
```

---

## 实战场景

### 场景1：标签系统

```python
class TagSystem:
    """文章标签系统"""

    def __init__(self):
        self.articles = {}  # {article_id: set of tags}
        self.tag_index = {}  # {tag: set of article_ids}

    def add_article(self, article_id, tags):
        """添加文章及其标签"""
        tag_set = set(tags)
        self.articles[article_id] = tag_set

        for tag in tag_set:
            if tag not in self.tag_index:
                self.tag_index[tag] = set()
            self.tag_index[tag].add(article_id)

    def get_articles_by_tag(self, tag):
        """获取包含特定标签的所有文章"""
        return self.tag_index.get(tag, set())

    def get_articles_by_all_tags(self, tags):
        """获取包含所有指定标签的文章"""
        if not tags:
            return set()

        result = self.tag_index.get(tags[0], set()).copy()
        for tag in tags[1:]:
            result &= self.tag_index.get(tag, set())
        return result

    def get_articles_by_any_tag(self, tags):
        """获取包含任一指定标签的文章"""
        result = set()
        for tag in tags:
            result |= self.tag_index.get(tag, set())
        return result

    def get_related_articles(self, article_id, min_common_tags=1):
        """获取相关文章（基于共同标签）"""
        if article_id not in self.articles:
            return set()

        article_tags = self.articles[article_id]
        related = set()

        for other_id, other_tags in self.articles.items():
            if other_id != article_id:
                common = article_tags & other_tags
                if len(common) >= min_common_tags:
                    related.add(other_id)

        return related

# 使用示例
ts = TagSystem()
ts.add_article(1, ['python', 'programming', 'tutorial'])
ts.add_article(2, ['python', 'data-science', 'pandas'])
ts.add_article(3, ['javascript', 'programming', 'web'])
ts.add_article(4, ['python', 'web', 'flask'])

print(f"Python 文章: {ts.get_articles_by_tag('python')}")
print(f"Python + Web 文章: {ts.get_articles_by_all_tags(['python', 'web'])}")
print(f"文章1的相关文章: {ts.get_related_articles(1)}")
```

### 场景2：权限管理

```python
class PermissionSystem:
    """基于集合的权限管理系统"""

    def __init__(self):
        self.roles = {}  # {role_name: set of permissions}
        self.users = {}  # {user_id: set of role_names}

    def define_role(self, role_name, permissions):
        """定义角色及其权限"""
        self.roles[role_name] = frozenset(permissions)

    def assign_role(self, user_id, role_name):
        """为用户分配角色"""
        if user_id not in self.users:
            self.users[user_id] = set()
        self.users[user_id].add(role_name)

    def revoke_role(self, user_id, role_name):
        """撤销用户角色"""
        if user_id in self.users:
            self.users[user_id].discard(role_name)

    def get_user_permissions(self, user_id):
        """获取用户的所有权限"""
        if user_id not in self.users:
            return set()

        permissions = set()
        for role in self.users[user_id]:
            if role in self.roles:
                permissions |= self.roles[role]
        return permissions

    def has_permission(self, user_id, permission):
        """检查用户是否有特定权限"""
        return permission in self.get_user_permissions(user_id)

    def has_all_permissions(self, user_id, permissions):
        """检查用户是否有所有指定权限"""
        user_perms = self.get_user_permissions(user_id)
        return set(permissions).issubset(user_perms)

    def has_any_permission(self, user_id, permissions):
        """检查用户是否有任一指定权限"""
        user_perms = self.get_user_permissions(user_id)
        return bool(set(permissions) & user_perms)

# 使用示例
ps = PermissionSystem()

# 定义角色
ps.define_role('admin', ['read', 'write', 'delete', 'manage_users'])
ps.define_role('editor', ['read', 'write'])
ps.define_role('viewer', ['read'])

# 分配角色
ps.assign_role('user1', 'admin')
ps.assign_role('user2', 'editor')
ps.assign_role('user2', 'viewer')  # 用户可以有多个角色

# 检查权限
print(f"user1 的权限: {ps.get_user_permissions('user1')}")
print(f"user2 的权限: {ps.get_user_permissions('user2')}")
print(f"user1 能删除? {ps.has_permission('user1', 'delete')}")
print(f"user2 能删除? {ps.has_permission('user2', 'delete')}")
```

### 场景3：数据去重与比较

```python
class DataComparator:
    """数据集比较工具"""

    @staticmethod
    def compare_lists(list1, list2):
        """比较两个列表的差异"""
        set1, set2 = set(list1), set(list2)

        return {
            'only_in_first': set1 - set2,
            'only_in_second': set2 - set1,
            'in_both': set1 & set2,
            'total_unique': set1 | set2,
        }

    @staticmethod
    def find_duplicates(items):
        """找出重复元素"""
        seen = set()
        duplicates = set()

        for item in items:
            if item in seen:
                duplicates.add(item)
            seen.add(item)

        return duplicates

    @staticmethod
    def remove_duplicates_preserve_order(items):
        """去重并保持顺序"""
        seen = set()
        result = []

        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)

        return result

# 使用示例
# 比较数据库和API数据
db_users = ['alice', 'bob', 'charlie', 'david']
api_users = ['bob', 'charlie', 'eve', 'frank']

comparison = DataComparator.compare_lists(db_users, api_users)
print(f"只在数据库中: {comparison['only_in_first']}")
print(f"只在API中: {comparison['only_in_second']}")
print(f"两者都有: {comparison['in_both']}")

# 找重复订单
orders = ['ORD001', 'ORD002', 'ORD001', 'ORD003', 'ORD002', 'ORD004']
duplicates = DataComparator.find_duplicates(orders)
print(f"重复订单: {duplicates}")
```

### 场景4：词汇分析

```python
def analyze_text(text):
    """文本词汇分析"""
    import re

    # 提取单词
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())

    # 基本统计
    total_words = len(words)
    unique_words = set(words)
    vocabulary_size = len(unique_words)

    # 词汇丰富度
    lexical_diversity = vocabulary_size / total_words if total_words > 0 else 0

    return {
        'total_words': total_words,
        'unique_words': unique_words,
        'vocabulary_size': vocabulary_size,
        'lexical_diversity': lexical_diversity,
    }

def compare_vocabularies(text1, text2):
    """比较两段文本的词汇"""
    analysis1 = analyze_text(text1)
    analysis2 = analyze_text(text2)

    vocab1 = analysis1['unique_words']
    vocab2 = analysis2['unique_words']

    return {
        'common_words': vocab1 & vocab2,
        'unique_to_text1': vocab1 - vocab2,
        'unique_to_text2': vocab2 - vocab1,
        'jaccard_similarity': len(vocab1 & vocab2) / len(vocab1 | vocab2) if vocab1 | vocab2 else 0,
    }

# 使用示例
text1 = """
Python is a great programming language.
It is easy to learn and very powerful.
"""

text2 = """
Python is widely used in data science.
It is powerful and has great libraries.
"""

analysis = analyze_text(text1)
print(f"词汇量: {analysis['vocabulary_size']}")
print(f"词汇丰富度: {analysis['lexical_diversity']:.2%}")

comparison = compare_vocabularies(text1, text2)
print(f"共同词汇: {comparison['common_words']}")
print(f"Jaccard 相似度: {comparison['jaccard_similarity']:.2%}")
```

---

## 面试要点

### 常见面试题

#### 集合和列表的区别是什么？什么时候用集合？

```python
"""
主要区别：
1. 集合无序，列表有序
2. 集合元素唯一，列表可以有重复
3. 集合元素必须可哈希，列表无此限制
4. 集合的成员测试是 O(1)，列表是 O(n)

使用集合的场景：
- 需要去重
- 需要快速成员测试
- 需要进行集合运算（并集、交集等）
- 不关心元素顺序
"""

# 示例：检查列表中是否有重复元素
def has_duplicates(lst):
    return len(lst) != len(set(lst))
```

#### 如何找出两个列表的交集？

```python
def find_intersection(list1, list2):
    # 方法1：使用集合（最高效）
    return list(set(list1) & set(list2))

    # 方法2：使用列表推导式
    # set2 = set(list2)
    # return [x for x in list1 if x in set2]

list1 = [1, 2, 3, 4, 5]
list2 = [4, 5, 6, 7, 8]
print(find_intersection(list1, list2))  # [4, 5]
```

#### set 和 frozenset 的区别？

```python
"""
set 是可变的，frozenset 是不可变的

frozenset 的用途：
1. 作为字典的键
2. 作为另一个集合的元素
3. 表示不应被修改的常量集合
"""

# frozenset 作为字典键
graph_edges = {
    frozenset(['A', 'B']): 5,
    frozenset(['B', 'C']): 3,
}
print(graph_edges[frozenset(['B', 'A'])])  # 5，顺序无关
```

#### 如何实现 O(1) 时间复杂度的两数之和？

```python
def two_sum(nums, target):
    """找出数组中和为 target 的两个数的索引"""
    seen = {}  # 使用字典而不是集合，因为需要索引

    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i

    return []

# 使用集合的变体（只判断是否存在）
def has_two_sum(nums, target):
    seen = set()
    for num in nums:
        if target - num in seen:
            return True
        seen.add(num)
    return False
```

#### 如何高效地找出数组中的重复元素？

```python
def find_duplicates(arr):
    """找出所有重复元素"""
    seen = set()
    duplicates = set()

    for item in arr:
        if item in seen:
            duplicates.add(item)
        else:
            seen.add(item)

    return list(duplicates)

# 时间复杂度：O(n)
# 空间复杂度：O(n)

arr = [1, 2, 3, 2, 4, 3, 5]
print(find_duplicates(arr))  # [2, 3]
```

#### 解释集合的哈希表实现原理

```python
"""
Python 集合基于哈希表实现：

1. 当添加元素时，计算元素的哈希值
2. 哈希值决定元素在内部数组中的位置
3. 如果发生哈希冲突，使用开放寻址法处理
4. 查找时同样计算哈希值，直接定位到相应位置

这就是为什么：
- 集合元素必须是可哈希的
- 成员测试的时间复杂度是 O(1)
- 集合是无序的（哈希值决定存储位置）
"""

# 演示哈希值
print(hash("hello"))
print(hash(123))
print(hash((1, 2, 3)))
# print(hash([1, 2, 3]))  # TypeError: unhashable type
```

#### 如何用集合实现简单的布隆过滤器概念？

```python
class SimpleBloomFilter:
    """简化版布隆过滤器（实际布隆过滤器使用位数组和多个哈希函数）"""

    def __init__(self):
        self.filter = set()

    def add(self, item):
        # 实际布隆过滤器会添加多个哈希值
        self.filter.add(hash(item))

    def might_contain(self, item):
        # 如果返回 False，元素一定不存在
        # 如果返回 True，元素可能存在（可能是误报）
        return hash(item) in self.filter

bf = SimpleBloomFilter()
bf.add("hello")
bf.add("world")
print(bf.might_contain("hello"))  # True
print(bf.might_contain("python"))  # False (一定不存在)
```

---

## 延伸阅读

### 官方文档

- [Python 官方文档 - Set Types](https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset)
- [Python 官方文档 - Set Objects](https://docs.python.org/3/c-api/set.html)

### 相关模块

- [collections](https://docs.python.org/3/library/collections.html) - Counter 类提供了类似集合的计数功能
- [typing](https://docs.python.org/3/library/typing.html) - Set, FrozenSet 类型注解

### 进阶主题

- [Time Complexity](https://wiki.python.org/moin/TimeComplexity) - Python 数据结构时间复杂度
- [Hash Table Implementation](https://github.com/python/cpython/blob/main/Objects/setobject.c) - CPython 集合源码

### 相关数据结构

- `dict` - 字典同样基于哈希表，键是唯一的
- `collections.Counter` - 计数器，可以看作多重集合
- `sortedcontainers.SortedSet` - 第三方有序集合实现
