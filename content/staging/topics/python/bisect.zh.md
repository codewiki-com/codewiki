---
title: Python bisect 模块：二分查找和有序列表插入完全指南
description: 深入讲解 Python bisect 模块的用法、原理和最佳实践，掌握高效的二分查找和有序列表维护技巧
track: python
section: stdlib
difficulty: intermediate
tags:
  - bisect
  - 二分查找
  - 有序列表
  - 算法
  - 数据结构
status: imported
origin: old/src/content/docs/python/bisect.zh.md
divergence: 0.238
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

Python 标准库中的 bisect 模块提供了对有序列表进行二分查找和维护的工具。它是处理有序数据的强大武器，在竞赛编程、数据结构应用和系统设计中都有广泛应用。本文将系统讲解 bisect 模块的核心原理、使用方法和最佳实践。

## 概念解释

### 什么是二分查找

**二分查找（Binary Search）** 是一种高效的搜索算法，用于在有序序列中查找目标元素。其核心思想是：

- 将有序列表分为两部分
- 与中间元素比较
- 根据比较结果舍弃一半的数据
- 重复上述过程直到找到目标或确定目标不存在

**时间复杂度**：$O(\log n)$，远优于线性搜索的 $O(n)$

### bisect 模块的作用

Python 的 bisect 模块提供了两类功能：

1. **二分查找（Searching）**：在有序列表中查找元素位置
   - `bisect_left(a, x)`: 查找应该插入的左边位置
   - `bisect_right(a, x)`: 查找应该插入的右边位置

2. **有序插入（Insertion）**：在有序列表中维护排序
   - `insort_left(a, x)`: 在左边位置插入元素
   - `insort_right(a, x)`: 在右边位置插入元素

### "左"和"右"的区别

对于重复元素，bisect 模块区分插入位置：

- **左插入**：在相等元素的左边插入（保留原有顺序）
- **右插入**：在相等元素的右边插入（默认行为）

```
列表：[1, 2, 2, 2, 3]
查找值：2

bisect_left -> 位置1（第一个2的位置）
bisect_right -> 位置4（最后一个2之后的位置）
```

### 适用场景

bisect 模块特别适合以下场景：

- **范围查询**：查找值在某个范围内的元素
- **排排序列维护**：动态维护有序数据
- **成绩分级**：根据分数范围分配等级
- **排名系统**：快速定位用户排名
- **时间序列分析**：查找特定时间范围的数据

## 核心原理

### 二分查找的算法逻辑

二分查找的核心算法流程：

```
初始化：left = 0, right = len(array)

循环条件：left < right
    mid = (left + right) // 2

    如果 array[mid] < x:
        left = mid + 1  # 在右边查找
    否则：
        right = mid     # 在左边查找（包括mid）

返回 left 作为插入位置
```

这个算法找到的位置满足性质：
- `array[:left]` 中所有元素 `< x`
- `array[left:]` 中所有元素 `>= x`

### bisect_left vs bisect_right

**bisect_left** 的返回值定义：

- 返回最左边的插入位置，使得插入后列表仍有序
- `a[i] < x` 对所有 `i < result` 成立
- `a[i] >= x` 对所有 `i >= result` 成立

```python
import bisect

a = [1, 2, 2, 2, 3, 4]
print(bisect.bisect_left(a, 2))   # 输出：1（第一个2的索引）
print(bisect.bisect_left(a, 2.5)) # 输出：4
```

**bisect_right** 的返回值定义：

- 返回最右边的插入位置，使得插入后列表仍有序
- `a[i] <= x` 对所有 `i < result` 成立
- `a[i] > x` 对所有 `i >= result` 成立

```python
import bisect

a = [1, 2, 2, 2, 3, 4]
print(bisect.bisect_right(a, 2))  # 输出：4（最后一个2之后）
print(bisect.bisect_right(a, 2.5))# 输出：4
```

### insort 的实现原理

`insort` 函数结合了 `bisect` 和 `list.insert`：

```python
def insort_right(a, x, lo=0, hi=None):
    """在列表a中的合适位置插入x（右插入）"""
    if hi is None:
        hi = len(a)
    pos = bisect_right(a, x, lo, hi)
    a.insert(pos, x)

def insort_left(a, x, lo=0, hi=None):
    """在列表a中的合适位置插入x（左插入）"""
    if hi is None:
        hi = len(a)
    pos = bisect_left(a, x, lo, hi)
    a.insert(pos, x)
```

## 核心要点

### 必须是有序列表

bisect 模块假设列表已经有序，如果列表无序，结果将不可预测：

```python
import bisect

# 错误用法
a = [3, 1, 4, 1, 5, 9, 2, 6]
pos = bisect.bisect_left(a, 5)  # 结果不可靠！

# 正确用法
a = [1, 1, 2, 3, 4, 5, 6, 9]
pos = bisect.bisect_left(a, 5)  # 返回 5
```

### 支持任何可比较的元素

bisect 模块适用于任何支持比较的数据类型：

```python
import bisect

# 字符串
words = ['apple', 'banana', 'cherry', 'date']
pos = bisect.bisect_left(words, 'blueberry')
print(pos)  # 输出：2

# 元组（按第一元素比较）
coords = [(1, 5), (2, 3), (3, 1), (4, 2)]
pos = bisect.bisect_left(coords, (2.5, 0))
print(pos)  # 输出：2

# 自定义类
class Student:
    def __init__(self, score):
        self.score = score

    def __lt__(self, other):
        return self.score < other.score

    def __eq__(self, other):
        return self.score == other.score

students = [Student(70), Student(80), Student(90)]
pos = bisect.bisect_left(students, Student(85))
print(pos)  # 输出：2
```

### 查询范围内的元素个数

结合 `bisect_left` 和 `bisect_right` 可以高效统计范围内的元素：

```python
import bisect

scores = [60, 70, 70, 75, 80, 85, 90, 90, 95]

# 统计 70-90 分（含）的人数
left = bisect.bisect_left(scores, 70)
right = bisect.bisect_right(scores, 90)
count = right - left
print(f"70-90分的人数：{count}")  # 输出：7
```

### 支持 key 参数（Python 3.10+）

Python 3.10 及更高版本支持 `key` 参数，用于自定义比较方式：

```python
import bisect

# 按绝对值查找
a = [-5, -3, -1, 0, 2, 4, 6]
pos = bisect.bisect_left(a, -2, key=abs)
print(pos)  # 输出：2（第一个绝对值 >= 2 的位置）

# 按字符串长度查找
words = ['a', 'bb', 'ccc', 'dddd']
pos = bisect.bisect_left(words, 'xxx', key=len)
print(pos)  # 输出：2
```

## 代码示例

### 基础用法：查找和插入

```python
import bisect

# 初始化有序列表
numbers = [1, 3, 5, 7, 9]

# 查找元素位置
pos = bisect.bisect_left(numbers, 5)
print(f"5 在位置 {pos}")  # 输出：2

# 查找插入位置（右侧）
pos = bisect.bisect_right(numbers, 5)
print(f"5 的右侧插入位置是 {pos}")  # 输出：3

# 直接插入元素
bisect.insort_left(numbers, 5)
print(numbers)  # 输出：[1, 3, 5, 5, 7, 9]

# 重新初始化
numbers = [1, 3, 5, 7, 9]
bisect.insort_right(numbers, 5)
print(numbers)  # 输出：[1, 3, 5, 5, 7, 9]
```

### 实战场景：成绩分级系统

```python
import bisect

class GradingSystem:
    """基于分数的成绩分级系统"""

    def __init__(self):
        # 分数界限（从低到高）
        self.boundaries = [60, 70, 80, 90]
        self.grades = ['F', 'D', 'C', 'B', 'A']

    def get_grade(self, score):
        """根据分数获取成绩等级"""
        pos = bisect.bisect_left(self.boundaries, score)
        return self.grades[pos]

    def count_in_range(self, scores, lower, upper):
        """统计分数范围内的学生数"""
        left = bisect.bisect_left(self.boundaries, lower)
        right = bisect.bisect_right(self.boundaries, upper)
        return sum(1 for s in scores if self.boundaries[left-1] <= s < self.boundaries[right] if left > 0)

# 使用示例
system = GradingSystem()
test_scores = [55, 65, 72, 85, 91, 45, 78]

for score in sorted(test_scores):
    grade = system.get_grade(score)
    print(f"分数：{score:2d} -> 等级：{grade}")
```

### 实战场景：维护排序的评分列表

```python
import bisect
from dataclasses import dataclass

@dataclass
class Review:
    """评价数据类"""
    rating: float
    text: str

    def __lt__(self, other):
        return self.rating < other.rating

    def __eq__(self, other):
        return self.rating == other.rating

    def __repr__(self):
        return f"Review({self.rating}, '{self.text[:10]}...')"

class ReviewManager:
    """维护有序评价列表"""

    def __init__(self):
        self.reviews = []

    def add_review(self, rating, text):
        """添加新评价（自动保持排序）"""
        review = Review(rating, text)
        bisect.insort_right(self.reviews, review)

    def get_reviews_in_range(self, min_rating, max_rating):
        """获取特定评分范围的评价"""
        left = bisect.bisect_left(self.reviews, Review(min_rating, ''))
        right = bisect.bisect_right(self.reviews, Review(max_rating, ''))
        return self.reviews[left:right]

    def average_rating(self):
        """计算平均评分"""
        if not self.reviews:
            return 0
        return sum(r.rating for r in self.reviews) / len(self.reviews)

# 使用示例
manager = ReviewManager()
reviews_data = [
    (4.5, "很好的产品"),
    (3.0, "一般般"),
    (4.8, "非常棒！"),
    (2.5, "质量一般"),
    (5.0, "完美！"),
]

for rating, text in reviews_data:
    manager.add_review(rating, text)

print("所有评价（按评分排序）：")
for review in manager.reviews:
    print(f"  {review}")

print("\n4分以上的评价：")
high_reviews = manager.get_reviews_in_range(4.0, 5.0)
for review in high_reviews:
    print(f"  {review}")

print(f"\n平均评分：{manager.average_rating():.2f}")
```

### 实战场景：时间序列查询

```python
import bisect
from datetime import datetime, timedelta

class TimeSeriesDB:
    """简单的时间序列数据库"""

    def __init__(self):
        self.timestamps = []
        self.values = []

    def insert(self, timestamp, value):
        """插入数据点"""
        pos = bisect.bisect_right(self.timestamps, timestamp)
        self.timestamps.insert(pos, timestamp)
        self.values.insert(pos, value)

    def query_range(self, start_time, end_time):
        """查询时间范围内的数据"""
        left = bisect.bisect_left(self.timestamps, start_time)
        right = bisect.bisect_right(self.timestamps, end_time)

        result = []
        for i in range(left, right):
            result.append((self.timestamps[i], self.values[i]))
        return result

    def query_before(self, timestamp):
        """查询某时间点之前的所有数据"""
        pos = bisect.bisect_left(self.timestamps, timestamp)
        return [(self.timestamps[i], self.values[i]) for i in range(pos)]

    def query_after(self, timestamp):
        """查询某时间点之后的所有数据"""
        pos = bisect.bisect_right(self.timestamps, timestamp)
        return [(self.timestamps[i], self.values[i]) for i in range(pos, len(self.timestamps))]

# 使用示例
db = TimeSeriesDB()
base_time = datetime(2024, 1, 1, 0, 0, 0)

# 插入数据
for i in range(10):
    time = base_time + timedelta(hours=i)
    value = 20 + i * 0.5
    db.insert(time, value)

# 查询 2-5 小时内的数据
start = base_time + timedelta(hours=2)
end = base_time + timedelta(hours=5)
data = db.query_range(start, end)
print("2-5小时内的数据：")
for time, value in data:
    print(f"  {time.strftime('%H:%M')} -> {value:.1f}")
```

### 性能对比：bisect vs 线性搜索

```python
import bisect
import time
import random

def linear_search(arr, x):
    """线性搜索"""
    for i, val in enumerate(arr):
        if val == x:
            return i
    return -1

def benchmark():
    """性能基准测试"""
    sizes = [1000, 10000, 100000, 1000000]

    for size in sizes:
        arr = sorted(random.sample(range(size * 10), size))
        search_val = arr[size // 2]

        # 二分查找
        start = time.perf_counter()
        for _ in range(10000):
            bisect.bisect_left(arr, search_val)
        bisect_time = time.perf_counter() - start

        # 线性搜索
        start = time.perf_counter()
        for _ in range(10000):
            linear_search(arr, search_val)
        linear_time = time.perf_counter() - start

        print(f"数组大小：{size:7d} | bisect：{bisect_time:.4f}s | 线性：{linear_time:.4f}s | 加速：{linear_time/bisect_time:.1f}x")

benchmark()
```

输出示例：
```
数组大小：   1000 | bisect：0.2341s | 线性：2.1045s | 加速：9.0x
数组大小：  10000 | bisect：0.2367s | 线性：21.4521s | 加速：90.7x
数组大小： 100000 | bisect：0.2381s | 线性：215.3452s | 加速：904.0x
数组大小：1000000 | bisect：0.2392s | 线性：2154.2134s | 加速：9004.5x
```

## 最佳实践

### 确保列表始终有序

```python
import bisect

# 好的做法：使用 insort 维护有序性
class OrderedList:
    def __init__(self):
        self.data = []

    def add(self, value):
        """添加元素并保持排序"""
        bisect.insort_right(self.data, value)

    def find(self, value):
        """查找元素位置"""
        pos = bisect.bisect_left(self.data, value)
        if pos < len(self.data) and self.data[pos] == value:
            return pos
        return -1

# 使用
ol = OrderedList()
for val in [3, 1, 4, 1, 5, 9, 2, 6]:
    ol.add(val)
print(ol.data)  # 输出：[1, 1, 2, 3, 4, 5, 6, 9]
```

### 选择合适的 bisect 函数

```python
import bisect

# 场景1：统计重复元素
scores = [60, 70, 70, 70, 80]
target = 70
left = bisect.bisect_left(scores, target)
right = bisect.bisect_right(scores, target)
count = right - left
print(f"70 出现 {count} 次")  # 输出：3

# 场景2：查找插入位置（避免重复）
nums = [1, 3, 5, 7]
new_num = 5
pos = bisect.bisect_left(nums, new_num)
if pos < len(nums) and nums[pos] == new_num:
    print("元素已存在，不插入")
else:
    bisect.insort_left(nums, new_num)
    print(f"插入 {new_num}，列表变为：{nums}")
```

### 使用 lo 和 hi 参数优化查询

```python
import bisect

# 在子范围内查询
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 只在索引 2 到 7 的范围内查询
pos = bisect.bisect_left(arr, 5, lo=2, hi=7)
print(pos)  # 输出：4

# 避免每次查询都扫描整个列表
# 适用于频繁查询同一区域的场景
class RangeDatabase:
    def __init__(self, data):
        self.data = sorted(data)

    def find_in_range(self, value, range_start, range_end):
        """在特定范围内查找"""
        left = bisect.bisect_left(self.data, range_start)
        right = bisect.bisect_right(self.data, range_end)
        return bisect.bisect_left(self.data, value, lo=left, hi=right)
```

### 处理自定义对象时的注意事项

```python
import bisect
from functools import total_ordering

# 使用 @total_ordering 装饰器简化比较实现
@total_ordering
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def __eq__(self, other):
        return self.age == other.age

    def __lt__(self, other):
        return self.age < other.age

    def __repr__(self):
        return f"Person({self.name}, {self.age})"

people = [Person("Alice", 25), Person("Bob", 30)]
bisect.insort_right(people, Person("Charlie", 27))
print(people)  # 输出：[Person(Alice, 25), Person(Charlie, 27), Person(Bob, 30)]
```

### 避免 O(n) 的插入操作

```python
import bisect

# 不好的做法：频繁 insort（O(n)）
data = []
for value in range(1000):
    bisect.insort(data, value)  # 总时间复杂度 O(n²)

# 好的做法1：先排序后使用
data = []
values = [3, 1, 4, 1, 5, 9, 2, 6]
data = sorted(values)  # O(n log n)

# 好的做法2：使用 SortedList（需要 sortedcontainers 库）
# from sortedcontainers import SortedList
# data = SortedList(values)  # 支持高效插入

# 好的做法3：批量插入后再排序
data = []
batch = [3, 1, 4, 1, 5, 9, 2, 6]
data.extend(batch)
data.sort()  # O(n log n)
```

## 常见陷阱

### 陷阱1：在无序列表上使用 bisect

```python
import bisect

# 错误示例
arr = [3, 1, 4, 1, 5, 9, 2, 6]
pos = bisect.bisect_left(arr, 5)
print(pos)  # 输出：5（错误的位置！）

# 正确方式
arr = [3, 1, 4, 1, 5, 9, 2, 6]
arr_sorted = sorted(arr)
pos = bisect.bisect_left(arr_sorted, 5)
print(pos)  # 输出：4（正确）
```

### 陷阱2：混淆 bisect_left 和 bisect_right

```python
import bisect

arr = [1, 2, 2, 2, 3]

# 对于重复元素，两者给出不同的位置
left_pos = bisect.bisect_left(arr, 2)    # 1
right_pos = bisect.bisect_right(arr, 2)  # 4

# 如果要查找第一个等于 x 的位置：用 bisect_left
# 如果要在所有相等元素之后插入：用 bisect_right
```

### 陷阱3：返回值是插入位置，不是元素索引

```python
import bisect

arr = [1, 3, 5, 7, 9]

# 错误理解
pos = bisect.bisect_left(arr, 5)  # 返回 2
print(arr[pos])  # 输出：5（这是运气好）

# 正确做法
pos = bisect.bisect_left(arr, 4)  # 返回 2（插入位置）
# arr[pos] 是 5，不是 4！
# 需要检查元素是否存在
if pos < len(arr) and arr[pos] == 4:
    print("找到元素")
else:
    print("元素不存在")  # 这是正确的输出
```

### 陷阱4：insort 修改原列表

```python
import bisect

arr = [1, 3, 5]
# insort 直接修改原列表，不返回新列表
result = bisect.insort_right(arr, 4)
print(result)  # 输出：None（不是新列表！）
print(arr)     # 输出：[1, 3, 4, 5]（原列表被修改）
```

### 陷阱5：对元组或复杂对象排序时要小心

```python
import bisect

# 对元组排序：按第一个元素比较，然后按第二个元素...
items = [(1, 'a'), (2, 'b'), (1, 'c')]
items_sorted = sorted(items)
print(items_sorted)  # 输出：[(1, 'a'), (1, 'c'), (2, 'b')]

# bisect 的比较同样遵循元组的自然排序
pos = bisect.bisect_left(items_sorted, (1, 'b'))
print(pos)  # 输出：1（在 (1, 'c') 之前）

# 如果只想按第一个元素比较，需要自定义类
from dataclasses import dataclass

@dataclass
class Item:
    key: int
    value: str

    def __lt__(self, other):
        return self.key < other.key

    def __eq__(self, other):
        return self.key == other.key

items = [Item(1, 'a'), Item(2, 'b'), Item(1, 'c')]
items_sorted = sorted(items)
pos = bisect.bisect_left(items_sorted, Item(1, ''))
print(pos)  # 现在正确返回按 key 的位置
```

## 性能考量

### 时间复杂度分析

```
操作              时间复杂度      说明
─────────────────────────────────────
bisect_left       O(log n)       二分查找
bisect_right      O(log n)       二分查找
insort_left       O(n)           查找 O(log n) + 插入 O(n)
insort_right      O(n)           查找 O(log n) + 插入 O(n)
list.insert       O(n)           需要移动元素
```

### 空间复杂度

- bisect 查找函数：O(1) 额外空间
- insort 插入函数：O(1) 额外空间
- 总体：O(n) 用于存储列表本身

### 性能优化建议

```python
import bisect
import time

# 优化1：批量插入后排序比频繁 insort 更快
print("方法1：频繁 insort")
start = time.perf_counter()
arr = []
for i in range(10000):
    bisect.insort(arr, i % 1000)
print(f"耗时：{time.perf_counter() - start:.4f}s")

print("\n方法2：批量排序")
start = time.perf_counter()
arr = list(range(10000)) * 10
arr = sorted(set(arr))
print(f"耗时：{time.perf_counter() - start:.4f}s")

# 优化2：对大数据使用 SortedList（需要 pip install sortedcontainers）
print("\n方法3：SortedList（如果可用）")
try:
    from sortedcontainers import SortedList
    start = time.perf_counter()
    arr = SortedList()
    for i in range(10000):
        arr.add(i % 1000)
    print(f"耗时：{time.perf_counter() - start:.4f}s")
except ImportError:
    print("需要安装：pip install sortedcontainers")
```

### 内存使用考虑

```python
import bisect
import sys

# 监控内存使用
def memory_test():
    # 大列表的内存占用
    arr = list(range(1000000))
    print(f"100万个整数占用内存：{sys.getsizeof(arr) / 1024 / 1024:.2f} MB")

    # 频繁 insort 会触发内存重新分配
    # 列表会预留额外空间以加速后续插入
    arr2 = []
    for i in range(100000):
        bisect.insort(arr2, i)

    print(f"通过 insort 构建的列表内存：{sys.getsizeof(arr2) / 1024 / 1024:.2f} MB")

memory_test()
```

## 实战场景

### 场景1：竞赛排名系统

```python
import bisect
from dataclasses import dataclass

@dataclass(order=True)
class Score:
    points: int
    player_name: str

class RankingSystem:
    def __init__(self):
        self.scores = []  # 按分数从低到高排序

    def add_score(self, player_name, points):
        """添加玩家分数"""
        score = Score(points, player_name)
        bisect.insort_right(self.scores, score)

    def get_rank(self, player_name):
        """获取玩家排名（从高到低）"""
        for i, score in enumerate(reversed(self.scores)):
            if score.player_name == player_name:
                return len(self.scores) - i
        return -1

    def get_top_n(self, n):
        """获取前 n 名"""
        return list(reversed(self.scores[-n:]))

    def get_players_in_range(self, min_points, max_points):
        """获取分数范围内的玩家"""
        left = bisect.bisect_left(self.scores, Score(min_points, ''))
        right = bisect.bisect_right(self.scores, Score(max_points, 'z' * 10))
        return self.scores[left:right]

# 使用示例
ranking = RankingSystem()
players = [
    ("Alice", 1500),
    ("Bob", 1200),
    ("Charlie", 1800),
    ("David", 1450),
    ("Eve", 1600),
]

for name, points in players:
    ranking.add_score(name, points)

print("排行榜（前3名）：")
for i, score in enumerate(ranking.get_top_n(3), 1):
    print(f"  {i}. {score.player_name}: {score.points} 分")

print("\n1400-1700分的玩家：")
for score in ranking.get_players_in_range(1400, 1700):
    print(f"  {score.player_name}: {score.points} 分")
```

### 场景2：区间合并问题

```python
import bisect

def merge_intervals(intervals):
    """合并重叠区间"""
    if not intervals:
        return []

    # 按开始时间排序
    intervals = sorted(intervals)
    merged = [intervals[0]]

    for current in intervals[1:]:
        last = merged[-1]
        # 如果当前区间与最后一个区间重叠，则合并
        if current[0] <= last[1]:
            merged[-1] = (last[0], max(last[1], current[1]))
        else:
            merged.append(current)

    return merged

# 使用 bisect 快速查找覆盖某个点的区间
class IntervalTree:
    def __init__(self, intervals):
        # 存储每个区间的开始时间
        self.starts = sorted([i[0] for i in intervals])
        self.intervals = sorted(intervals)

    def find_covering(self, point):
        """找出覆盖该点的所有区间"""
        # 找最后一个开始时间 <= point 的区间
        pos = bisect.bisect_right(self.starts, point) - 1

        result = []
        for i in range(pos + 1):
            if self.intervals[i][0] <= point <= self.intervals[i][1]:
                result.append(self.intervals[i])
        return result

# 测试
intervals = [(1, 3), (2, 6), (8, 10), (15, 18)]
print("原始区间：", intervals)
print("合并后：", merge_intervals(intervals))

tree = IntervalTree(intervals)
point = 5
print(f"\n覆盖点 {point} 的区间：", tree.find_covering(point))
```

### 场景3：LRU 缓存中的时间戳管理

```python
import bisect
from collections import OrderedDict

class TimestampLRU:
    """使用时间戳的 LRU 缓存"""

    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()
        self.timestamps = []  # 维护有序的时间戳
        self.time_counter = 0

    def get(self, key):
        if key not in self.cache:
            return -1
        # 更新访问时间
        self.time_counter += 1
        old_time = self.cache[key]
        self.timestamps.remove(old_time)
        bisect.insort(self.timestamps, self.time_counter)
        self.cache[key] = self.time_counter
        return self.cache[key]

    def put(self, key, value):
        self.time_counter += 1
        if key in self.cache:
            self.timestamps.remove(self.cache[key])

        self.cache[key] = self.time_counter
        bisect.insort(self.timestamps, self.time_counter)

        if len(self.cache) > self.capacity:
            # 删除最旧的记录
            oldest_time = self.timestamps.pop(0)
            for k, t in list(self.cache.items()):
                if t == oldest_time:
                    del self.cache[k]
                    break
```

## 面试要点

### 面试题1：实现 LeetCode 704 - 二分查找

```python
class Solution:
    def search(self, nums: list[int], target: int) -> int:
        """
        在有序数组中查找目标值的索引

        进阶：也可以用 bisect 模块完成
        """
        # 方法1：使用 bisect
        pos = bisect.bisect_left(nums, target)
        if pos < len(nums) and nums[pos] == target:
            return pos
        return -1

        # 方法2：手动实现
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1

import bisect
```

### 面试题2：求排序数组中的目标范围

```python
def searchRange(nums: list[int], target: int) -> list[int]:
    """
    给定有序数组，找出目标值的起始和结束位置

    示例：
    nums = [5,7,7,8,8,10], target = 8
    输出：[3,4]
    """
    if not nums:
        return [-1, -1]

    # 使用 bisect_left 和 bisect_right
    left = bisect.bisect_left(nums, target)
    right = bisect.bisect_right(nums, target) - 1

    # 检查目标是否存在
    if left < len(nums) and nums[left] == target:
        return [left, right]
    return [-1, -1]

import bisect
```

### 面试题3：设计数据结构保持排序

```python
class SortedArray:
    """
    设计一个数据结构支持：
    1. 添加元素（保持排序）
    2. 查询排名
    3. 查询范围内元素个数
    """

    def __init__(self):
        self.arr = []

    def add(self, num: int) -> None:
        """添加数字"""
        bisect.insort_right(self.arr, num)

    def get_rank(self, x: int) -> int:
        """获取小于 x 的数字个数 + 1"""
        return bisect.bisect_left(self.arr, x) + 1

    def count_in_range(self, lower: int, upper: int) -> int:
        """统计 [lower, upper] 范围内的数字个数"""
        left = bisect.bisect_left(self.arr, lower)
        right = bisect.bisect_right(self.arr, upper)
        return right - left

import bisect
```

### 面试题4：关键问题的分析

```
Q1: bisect_left 和 bisect_right 的区别？
A: 对于重复元素，bisect_left 返回最左的位置，bisect_right 返回最右的位置。
   前者用于不重复插入，后者用于保持相对顺序。

Q2: bisect 适用于什么场景？
A: 有序列表中的查找和插入。如果列表频繁修改，考虑 SortedList。

Q3: bisect 的时间复杂度是多少？
A: bisect_left/right 是 O(log n)，insort 是 O(n)（因为 list.insert 是 O(n)）。

Q4: 如何处理无序列表？
A: 先排序再使用 bisect。或者使用其他搜索方法。

Q5: 如何处理自定义对象？
A: 实现 __lt__ 和 __eq__ 方法，或使用 key 参数（Python 3.10+）。
```

## 延伸阅读

### 相关标准库

1. **heapq**：堆操作，用于优先队列
2. **sorted/list.sort**：排序算法
3. **collections.deque**：双端队列
4. **array.array**：类型化数组，比列表更省内存

### 第三方库

```python
# SortedList：更高效的有序列表实现
# pip install sortedcontainers
from sortedcontainers import SortedList, SortedDict

# 比 bisect + list 更快的插入
sl = SortedList([1, 3, 5])
sl.add(4)  # O(log n) 而不是 O(n)

# 支持范围查询
indices = sl.bisect_left(3)
```

### 相关算法

1. **二分搜索变体**
   - 搜索旋转排序数组
   - 搜索插入位置
   - 搜索第一个和最后一个位置

2. **与 bisect 相关的问题**
   - 合并排序区间
   - 数据流的中位数
   - 时间表安排
   - 有效的三角形个数

### 扩展学习

```python
# Python 标准库文档
# https://docs.python.org/3/library/bisect.html

# 理解二分搜索的经典资源
# "二分搜索" by 花花酱
# LeetCode 题目：704, 34, 35, 69 等

# 性能对比
# list.insert: O(n)
# SortedList.add: O(log n)
# bisect.insort: O(n)
```

### 常见 LeetCode 题目

| 题号 | 标题 | 难度 | bisect 用途 |
|------|------|------|----------|
| 704 | 二分查找 | 简单 | 直接应用 |
| 34 | 在排序数组中查找元素的第一个和最后一个位置 | 中等 | bisect_left/right |
| 35 | 搜索插入位置 | 简单 | bisect_left |
| 69 | x 的平方根 | 简单 | 二分查找思想 |
| 1157 | 子数组中占绝大多数的元素 | 困难 | 范围计数 |
| 1851 | 包含每个查询的最小区间 | 困难 | 范围查询 |

## 总结

Python 的 bisect 模块是处理有序数据的强大工具：

1. **核心优势**：将搜索时间从 O(n) 降低到 O(log n)
2. **适用条件**：必须是有序列表
3. **性能考虑**：查找快但插入慢（因为 list.insert 是 O(n)）
4. **使用建议**：
   - 查询频繁时优先使用 bisect
   - 插入频繁时考虑 SortedList
   - 实现数据结构时要考虑修改频率

掌握 bisect 模块的使用，能让你在算法竞赛和系统设计中游刃有余！
