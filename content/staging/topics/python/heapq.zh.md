---
title: Python heapq 模块详解 - 堆队列算法
description: 深入理解 Python heapq 模块的堆数据结构、算法原理、应用场景。包括最小堆、优先队列、堆排序等核心概念和实战代码。
track: python
section: stdlib
difficulty: intermediate
tags:
  - heapq
  - 堆
  - 优先队列
  - 数据结构
  - 算法
  - 最小堆
status: imported
origin: old/src/content/docs/python/heapq.zh.md
divergence: 0.208
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## 概念解释

### 什么是堆？

堆（Heap）是一种特殊的树形数据结构，满足堆属性的完全二叉树。Python 的 heapq 模块实现的是**最小堆**：

- **堆属性**：任何父节点的值都小于或等于其子节点的值
- **完全二叉树**：除最后一层外，所有层都完全填充，且最后一层从左到右填充
- **存储方式**：用列表表示，索引 i 的节点的：
  - 左子节点索引：2*i + 1
  - 右子节点索引：2*i + 2
  - 父节点索引：(i - 1) // 2

### Python heapq 简介

`heapq` 是 Python 标准库提供的模块，实现了堆队列算法（也叫优先队列算法）。它提供了一组函数，允许在列表中维护堆不变量。

**关键特点**：
- 实现最小堆而不是最大堆
- 时间复杂度：插入和删除为 O(log n)，获取最小值为 O(1)
- 不稳定排序（在相等元素的顺序上无法保证）
- 基于列表的原地操作

### 解决的问题

1. **快速找到最小元素**：O(1) 时间复杂度
2. **动态维护排序**：无需完整排序，减少开销
3. **优先队列实现**：处理带优先级的任务
4. **TopK 问题**：高效获取 K 个最大/最小元素
5. **堆排序**：稳定的 O(n log n) 排序算法

---

## 核心原理

### 堆的内存结构

```
数组表示的堆：[1, 3, 2, 7, 4, 5, 6]

对应的树结构：
        1
       / \
      3   2
     / \ / \
    7  4 5  6
```

### 核心操作

#### 下滤（Sift Down）
当堆顶元素被移除后，将最后一个元素放到堆顶，然后向下调整：

```python
def sift_down(heap, pos):
    """将位置 pos 的元素向下调整"""
    item = heap[pos]
    child_pos = 2 * pos + 1  # 左子节点

    while child_pos < len(heap):
        # 选择较小的子节点
        right_pos = child_pos + 1
        if right_pos < len(heap) and heap[right_pos] < heap[child_pos]:
            child_pos = right_pos

        # 如果子节点小于当前元素，交换并继续
        if heap[child_pos] < item:
            heap[pos] = heap[child_pos]
            pos = child_pos
            child_pos = 2 * pos + 1
        else:
            break

    heap[pos] = item
```

#### 上滤（Sift Up）
在堆的末尾添加元素后，将其向上调整：

```python
def sift_up(heap, pos):
    """将位置 pos 的元素向上调整"""
    item = heap[pos]

    while pos > 0:
        parent_pos = (pos - 1) >> 1  # 位运算获取父节点
        parent = heap[parent_pos]

        if item < parent:
            heap[pos] = parent
            pos = parent_pos
        else:
            break

    heap[pos] = item
```

#### 堆化（Heapify）
将任意列表转换为堆，时间复杂度 O(n)：

```python
def heapify(heap):
    """原地将列表转换为堆"""
    n = len(heap)
    # 从最后一个非叶子节点开始向下调整
    for pos in reversed(range(n // 2)):
        sift_down(heap, pos)
```

### heapq 实现的关键函数

| 函数 | 时间复杂度 | 说明 |
|------|----------|------|
| `heapq.heappush(heap, item)` | O(log n) | 将元素推入堆 |
| `heapq.heappop(heap)` | O(log n) | 弹出堆顶（最小）元素 |
| `heapq.heappushpop(heap, item)` | O(log n) | 推入后立即弹出 |
| `heapq.heapreplace(heap, item)` | O(log n) | 弹出后推入（不同顺序） |
| `heapq.heapify(heap)` | O(n) | 原地将列表转为堆 |
| `heapq.nlargest(n, heap)` | O(n log k) | 获取 n 个最大元素 |
| `heapq.nsmallest(n, heap)` | O(n log k) | 获取 n 个最小元素 |
| `heapq.merge(*iterables)` | O(n log k) | 合并已排序的可迭代对象 |

---

## 核心要点

### heapq 实现的是最小堆
```python
import heapq

# 最小堆：根元素最小
h = []
heapq.heappush(h, 5)
heapq.heappush(h, 3)
heapq.heappush(h, 7)
heapq.heappush(h, 1)

print(h)  # [1, 3, 7, 5]
print(heapq.heappop(h))  # 1 - 最小元素
```

### 堆属性维护
- heapq 自动维护堆属性，无需手动调整
- 列表的第一个元素（索引 0）总是最小元素
- 其他元素的顺序不一定完全排序

### 元组比较的特殊性
```python
import heapq

# 使用元组作为优先级
pq = []
heapq.heappush(pq, (2, "task-2"))
heapq.heappush(pq, (1, "task-1"))
heapq.heappush(pq, (2, "task-3"))

# 优先级相同时，比较第二个元素
print(heapq.heappop(pq))  # (1, 'task-1')
```

### 堆的就地操作
```python
import heapq

# heapify 原地修改列表
data = [3, 1, 4, 1, 5, 9, 2]
heapq.heapify(data)
print(data)  # [1, 1, 2, 3, 5, 9, 4]
```

### 性能特点
- **插入和删除**：O(log n)
- **查询最小值**：O(1)
- **排序**：O(n log n)
- **建堆**：O(n)

---

## 代码示例

### 示例 1：基础操作
```python
import heapq

# 创建堆
heap = []

# 添加元素
items = [3, 1, 4, 1, 5, 9, 2, 6]
for item in items:
    heapq.heappush(heap, item)

print(f"堆: {heap}")  # [1, 1, 4, 1, 5, 9, 2, 6]

# 弹出最小元素
while heap:
    print(heapq.heappop(heap), end=" ")
# 输出: 1 1 2 3 4 5 6 9

print()

# 一步操作：heappushpop 和 heapreplace
heap = [1, 3, 5, 7]
result1 = heapq.heappushpop(heap, 4)  # 推入 4，弹出最小的 1
print(f"heappushpop 结果: {result1}, 堆: {heap}")

heap = [1, 3, 5, 7]
result2 = heapq.heapreplace(heap, 4)  # 弹出最小的 1，推入 4
print(f"heapreplace 结果: {result2}, 堆: {heap}")
```

### 示例 2：优先队列实现
```python
import heapq
from dataclasses import dataclass
from typing import Any

@dataclass(order=True)
class Task:
    """带优先级的任务"""
    priority: int
    name: str = ""

# 创建优先队列
pq = []

# 添加任务
tasks = [
    Task(3, "Low priority"),
    Task(1, "High priority"),
    Task(2, "Medium priority"),
    Task(1, "Another high priority"),
]

for task in tasks:
    heapq.heappush(pq, task)

# 按优先级处理任务
print("任务执行顺序:")
while pq:
    task = heapq.heappop(pq)
    print(f"  {task.priority}: {task.name}")
```

### 示例 3：获取 TopK 元素
```python
import heapq

data = [64, 34, 25, 12, 22, 11, 90, 88, 45, 50]

# 获取最小的 3 个元素
print(f"最小的 3 个: {heapq.nsmallest(3, data)}")  # [11, 12, 22]

# 获取最大的 3 个元素
print(f"最大的 3 个: {heapq.nlargest(3, data)}")   # [90, 88, 64]

# 使用 key 函数
words = ["apple", "pie", "a", "banana", "zoo"]
print(f"最长的 2 个: {heapq.nlargest(2, words, key=len)}")
# ['banana', 'apple']
```

### 示例 4：堆排序
```python
import heapq

def heap_sort(arr):
    """使用堆进行排序"""
    h = arr.copy()
    heapq.heapify(h)

    result = []
    while h:
        result.append(heapq.heappop(h))

    return result

data = [64, 34, 25, 12, 22, 11, 90]
print(f"原数组: {data}")
print(f"排序后: {heap_sort(data)}")  # [11, 12, 22, 25, 34, 64, 90]
```

### 示例 5：获取最大堆效果
```python
import heapq

# Python heapq 只有最小堆，如需最大堆，使用负数或自定义比较
class MaxHeap:
    def __init__(self):
        self.heap = []

    def push(self, val):
        # 存储负值以实现最大堆
        heapq.heappush(self.heap, -val)

    def pop(self):
        return -heapq.heappop(self.heap)

    def peek(self):
        return -self.heap[0] if self.heap else None

# 使用最大堆
max_heap = MaxHeap()
for val in [3, 1, 4, 1, 5, 9, 2]:
    max_heap.push(val)

print("最大堆弹出顺序:")
while max_heap.peek() is not None:
    print(max_heap.pop(), end=" ")
# 输出: 9 5 4 3 2 1 1
```

### 示例 6：合并已排序的迭代器
```python
import heapq

# 合并多个已排序的列表
list1 = [1, 4, 5, 9]
list2 = [1, 2, 6]
list3 = [3, 5, 8, 10]

result = list(heapq.merge(list1, list2, list3))
print(f"合并结果: {result}")
# [1, 1, 2, 3, 4, 5, 5, 6, 8, 9, 10]
```

### 示例 7：删除元素（延迟删除）
```python
import heapq

# heapq 不直接支持删除，需要延迟删除方法
class PriorityQueue:
    def __init__(self):
        self.heap = []
        self.entry_map = {}
        self.counter = 0

    def add_task(self, task, priority=0):
        """添加任务，更新优先级自动覆盖"""
        if task in self.entry_map:
            self.remove_task(task)

        count = self.counter
        self.counter += 1
        entry = [priority, count, task]
        self.entry_map[task] = entry
        heapq.heappush(self.heap, entry)

    def remove_task(self, task):
        """标记任务为已删除"""
        entry = self.entry_map.pop(task)
        entry[-1] = None

    def pop_task(self):
        """弹出下一个任务"""
        while self.heap:
            priority, count, task = heapq.heappop(self.heap)
            if task is not None:
                del self.entry_map[task]
                return task
        return None

# 使用优先队列
pq = PriorityQueue()
pq.add_task('task1', 1)
pq.add_task('task2', 2)
pq.add_task('task3', 1)

pq.remove_task('task2')  # 删除 task2

print("执行顺序:")
while True:
    task = pq.pop_task()
    if task is None:
        break
    print(f"  {task}")
```

---

## 最佳实践

### 使用元组实现多条件优先级
```python
import heapq

# (优先级, 唯一ID, 任务名)
pq = []
heapq.heappush(pq, (1, 0, "重要任务"))
heapq.heappush(pq, (1, 1, "另一个重要任务"))
heapq.heappush(pq, (2, 2, "普通任务"))

priority, uid, name = heapq.heappop(pq)
print(f"执行: {name}")  # 优先级相同时按 ID 顺序
```

### 实现可删除的优先队列
```python
import heapq

class RemovablePriorityQueue:
    """支持删除操作的优先队列"""
    REMOVED = object()

    def __init__(self):
        self.pq = []
        self.entry_map = {}
        self.counter = 0

    def add(self, task, priority):
        if task in self.entry_map:
            self.remove(task)
        entry = [priority, self.counter, task]
        self.counter += 1
        self.entry_map[task] = entry
        heapq.heappush(self.pq, entry)

    def remove(self, task):
        entry = self.entry_map.pop(task)
        entry[-1] = self.REMOVED

    def pop(self):
        while self.pq:
            priority, count, task = heapq.heappop(self.pq)
            if task is not self.REMOVED:
                del self.entry_map[task]
                return task
        return None
```

### 实现最大堆包装器
```python
import heapq
from functools import total_ordering

@total_ordering
class MaxHeapItem:
    """最大堆包装器"""
    def __init__(self, val, obj=None):
        self.val = val
        self.obj = obj

    def __eq__(self, other):
        return self.val == other.val

    def __lt__(self, other):
        # 反转比较以实现最大堆
        return self.val > other.val

# 使用
heap = []
heapq.heappush(heap, MaxHeapItem(3))
heapq.heappush(heap, MaxHeapItem(1))
heapq.heappush(heap, MaxHeapItem(5))

print(heapq.heappop(heap).val)  # 5
```

### 使用 heapq 在大数据集中获取 TopK
```python
import heapq

def top_k_elements(data, k):
    """高效获取最大的 K 个元素"""
    # 对于大数据集，nlargest 比排序更高效
    return heapq.nlargest(k, data)

data = list(range(1000000))
result = top_k_elements(data, 10)
print(result)  # [999999, 999998, ..., 999990]
```

### 避免频繁重建堆
```python
import heapq

# 不好：频繁重建
for value in values:
    heap = [value]
    result = heapq.heappop(heap)

# 好：维护单一堆
heap = []
for value in values:
    heapq.heappush(heap, value)
    # 如需要可使用 heappop

# 更好：预先构建
heap = values.copy()
heapq.heapify(heap)
```

---

## 常见陷阱

### 混淆最小堆和最大堆
```python
import heapq

# 错误：期望最大堆，实际是最小堆
heap = [5, 3, 7, 1]
heapq.heapify(heap)
print(heapq.heappop(heap))  # 1，不是 7！
```

### 修改堆中的元素而不重新调整
```python
import heapq

heap = [1, 3, 2]
heapq.heapify(heap)

# 错误：直接修改会破坏堆属性
heap[0] = 10
print(heapq.heappop(heap))  # 2，而不是 1！

# 正确：删除后重新插入
heap = [1, 3, 2]
heapq.heapify(heap)
old_val = heapq.heappop(heap)  # 移除 1
heapq.heappush(heap, 10)       # 插入 10
```

### 在非列表对象上使用 heapq
```python
import heapq

# 错误：不能直接用于元组或其他类型
data = (3, 1, 4)
# heapq.heappop(data)  # TypeError

# 正确：转换为列表
data = list(data)
heapq.heapify(data)
```

### 忘记堆不是完全排序的
```python
import heapq

heap = [1, 3, 2, 7, 4, 5, 6]
# 堆中的顺序不是完全排序的！
print(heap)  # [1, 3, 2, 7, 4, 5, 6]
print(heap[1] > heap[2])  # True: 3 > 2，但这是允许的

# 只有堆顶保证是最小值
print(heapq.heappop(heap))  # 1
```

### 对可比较的对象处理不当
```python
import heapq

# 错误：列表不能与列表直接比较（在某些版本）
try:
    heap = []
    heapq.heappush(heap, [2, "a"])
    heapq.heappush(heap, [1, "b"])
    heapq.heappush(heap, [1, "c"])  # 错误：[1, "b"] vs [1, "c"] 不可比较
except TypeError as e:
    print(f"错误：{e}")

# 正确：使用元组
heap = []
heapq.heappush(heap, (2, "a"))
heapq.heappush(heap, (1, "b"))
heapq.heappush(heap, (1, "c"))  # 正确
```

### heappushpop 和 heapreplace 混淆
```python
import heapq

# heappushpop：先推后弹（可能弹出推入的元素）
heap = [1, 3, 5]
result = heapq.heappushpop(heap, 2)
print(f"heappushpop: {result}, heap: {heap}")  # 1, [2, 3, 5]

# heapreplace：先弹后推（弹出不是新元素）
heap = [1, 3, 5]
result = heapq.heapreplace(heap, 2)
print(f"heapreplace: {result}, heap: {heap}")  # 1, [2, 3, 5]

# 性能：元素小于堆顶时，heappushpop 更高效
```

---

## 性能考量

### 时间复杂度对比

```python
import heapq
import time
import random

# 测试数据
n = 100000
data = [random.randint(0, 10000) for _ in range(n)]

# 方法 1：heapq.nlargest
start = time.time()
result1 = heapq.nlargest(10, data)
time1 = time.time() - start

# 方法 2：排序后取前 10
start = time.time()
result2 = sorted(data, reverse=True)[:10]
time2 = time.time() - start

# 方法 3：heapify 后逐个弹出
start = time.time()
heap = data.copy()
heapq.heapify(heap)
result3 = [heapq.heappop(heap) for _ in range(10)]
result3.reverse()
time3 = time.time() - start

print(f"nlargest: {time1:.6f}s")
print(f"sorted: {time2:.6f}s")
print(f"heapify+pop: {time3:.6f}s")
```

### 性能指导原则

| 场景 | 推荐方案 | 原因 |
|------|--------|------|
| K 远小于 n | heapq.nlargest/nsmallest | O(n log k) |
| K 接近 n | sorted() | O(n log n) 常数较小 |
| 持续添加/删除 | 维护堆 | O(log n) 每次操作 |
| 一次性使用 | heapify 后 nlargest | 平衡性能 |
| 频繁查询最小值 | 保持堆结构 | O(1) 查询 |

### 优化建议

```python
import heapq

# 预分配列表（如果元素数量已知）
initial_size = 1000
heap = [float('inf')] * initial_size
heap.clear()

# 使用 heappushpop 而不是 push + pop
heap = [1, 3, 5]
item = 2
# 不好
heapq.heappush(heap, item)
result = heapq.heappop(heap)

# 好
result = heapq.heappushpop(heap, item)

# 批量操作使用 merge
lists = [[1, 4, 5], [1, 2, 6], [0, 3, 8]]
# 不好
all_items = []
for l in lists:
    all_items.extend(l)
heapq.heapify(all_items)

# 好
merged = heapq.merge(*lists)
```

---

## 实战场景

### 场景 1：任务调度系统
```python
import heapq
import time
from datetime import datetime

class TaskScheduler:
    """基于优先级的任务调度器"""

    def __init__(self):
        self.tasks = []
        self.task_id = 0

    def schedule(self, task_name, priority=0, delay=0):
        """调度任务"""
        run_time = time.time() + delay
        self.task_id += 1
        task = (priority, run_time, self.task_id, task_name)
        heapq.heappush(self.tasks, task)
        print(f"任务已调度: {task_name} (优先级: {priority}, 延迟: {delay}s)")

    def run(self):
        """执行等待中的任务"""
        while self.tasks:
            priority, run_time, tid, task_name = self.tasks[0]

            # 检查任务是否应该运行
            current_time = time.time()
            if current_time < run_time:
                wait_time = run_time - current_time
                print(f"等待 {wait_time:.2f}s 以执行 {task_name}")
                time.sleep(min(wait_time, 1))  # 避免过长的阻塞
                continue

            heapq.heappop(self.tasks)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 执行任务: {task_name}")

# 使用示例
scheduler = TaskScheduler()
scheduler.schedule("登录验证", priority=1)
scheduler.schedule("数据同步", priority=2, delay=2)
scheduler.schedule("邮件通知", priority=0, delay=1)
# scheduler.run()  # 实际场景中运行
```

### 场景 2：中位数查询器
```python
import heapq

class MedianFinder:
    """动态数据流中的中位数"""

    def __init__(self):
        # 最大堆（存较小的一半）
        self.small = []
        # 最小堆（存较大的一半）
        self.large = []
        self.small_size = 0
        self.large_size = 0

    def addNum(self, num):
        """添加数字"""
        # 使用负数实现最大堆
        if self.small_size == 0 or num <= -self.small[0]:
            heapq.heappush(self.small, -num)
            self.small_size += 1
        else:
            heapq.heappush(self.large, num)
            self.large_size += 1

        # 平衡两个堆的大小
        if self.small_size > self.large_size + 1:
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
            self.small_size -= 1
            self.large_size += 1
        elif self.large_size > self.small_size:
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -val)
            self.large_size -= 1
            self.small_size += 1

    def findMedian(self):
        """查询中位数"""
        if self.small_size > self.large_size:
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2.0

# 使用示例
mf = MedianFinder()
for num in [1, 2, 3, 4, 5]:
    mf.addNum(num)
    print(f"中位数: {mf.findMedian()}")
```

### 场景 3：Dijkstra 最短路径算法
```python
import heapq
from collections import defaultdict

class Graph:
    """使用 heapq 实现 Dijkstra 算法"""

    def __init__(self):
        self.graph = defaultdict(list)

    def add_edge(self, u, v, weight):
        self.graph[u].append((v, weight))
        self.graph[v].append((u, weight))

    def dijkstra(self, start):
        """计算从 start 到所有节点的最短距离"""
        distances = {node: float('inf') for node in self.graph}
        distances[start] = 0
        pq = [(0, start)]
        visited = set()

        while pq:
            current_dist, node = heapq.heappop(pq)

            if node in visited:
                continue

            visited.add(node)

            if current_dist > distances[node]:
                continue

            for neighbor, weight in self.graph[node]:
                distance = current_dist + weight

                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    heapq.heappush(pq, (distance, neighbor))

        return distances

# 使用示例
g = Graph()
g.add_edge('A', 'B', 4)
g.add_edge('A', 'C', 2)
g.add_edge('B', 'C', 1)
g.add_edge('B', 'D', 5)
g.add_edge('C', 'D', 8)

distances = g.dijkstra('A')
print(f"从 A 出发的最短距离:")
for node, dist in distances.items():
    print(f"  到 {node}: {dist}")
```

### 场景 4：LRU 缓存（带优先级驱逐）
```python
import heapq
from collections import defaultdict

class LRUCache:
    """基于频率的 LFU 缓存（使用 heapq）"""

    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.freq = defaultdict(int)
        self.timestamp = 0
        self.min_freq = 0
        self.freq_to_items = defaultdict(list)

    def get(self, key):
        if key not in self.cache:
            return -1

        self.timestamp += 1
        freq = self.freq[key]
        self.freq[key] = freq + 1

        # 更新频率
        self.freq_to_items[freq].remove(key)
        self.freq_to_items[freq + 1].append(key)

        return self.cache[key]

    def put(self, key, value):
        if self.capacity <= 0:
            return

        self.timestamp += 1

        if key in self.cache:
            self.cache[key] = value
            self.get(key)
            return

        if len(self.cache) >= self.capacity:
            # 移除最低频率的最旧项
            min_freq_items = self.freq_to_items[self.min_freq]
            removed_key = min_freq_items.pop(0)
            del self.cache[removed_key]
            del self.freq[removed_key]

        self.cache[key] = value
        self.freq[key] = 1
        self.min_freq = 1
        self.freq_to_items[1].append(key)

# 使用示例
cache = LRUCache(3)
cache.put(1, 1)
cache.put(2, 2)
cache.put(3, 3)
print(cache.get(1))  # 1
cache.put(4, 4)
print(cache.cache)
```

---

## 面试要点

### heapq 与其他数据结构的对比

**Q: heapq 与 sorted() 有什么区别？**

A:
- `sorted()` 时间 O(n log n)，返回完全排序的列表
- `heapq` 时间 O(n)（heapify）+ O(k log n)（k 次 heappop），部分有序
- TopK 问题：K << n 时用 heapq，K ≈ n 时用 sorted()

### 堆的插入和删除

**Q: 为什么 heappush 和 heappop 的时间复杂度是 O(log n)？**

A: 因为堆的高度为 log n。插入或删除操作最多需要调整 log n 个节点。

### 最大堆实现

**Q: Python heapq 如何实现最大堆？**

A:
```python
# 方法 1：使用负数
heapq.heappush(heap, -value)

# 方法 2：使用自定义类
class MaxHeap:
    def __init__(self, val):
        self.val = val
    def __lt__(self, other):
        return self.val > other.val
```

### 堆的应用

**Q: 列举 heapq 的 5 个实际应用**

A:
1. 优先队列实现
2. TopK 问题（获取最大/最小的 K 个元素）
3. Dijkstra 最短路径算法
4. Huffman 编码树构建
5. 任务调度（基于优先级或时间戳）

### 性能优化

**Q: 如何高效地从大数据集中获取 TopK？**

A:
```python
import heapq

# 高效方法（O(n log k)）
k = 10
top_k = heapq.nlargest(k, large_dataset)

# 相比排序（O(n log n)）更快
# 因为 nlargest 内部使用了优化的堆算法
```

### 陷阱

**Q: 直接修改堆中的元素有什么问题？**

A: 破坏堆的不变量。堆属性要求父节点小于子节点，直接修改会违反这一要求，导致后续操作返回错误结果。

### heappushpop vs heapreplace

**Q: heappushpop 和 heapreplace 的区别？**

A:
- `heappushpop(heap, item)`：先推后弹，如果 item 小于最小值，直接返回 item
- `heapreplace(heap, item)`：先弹后推，总是弹出最小值，返回被弹出的值
- 当 item 远小于堆顶时，heappushpop 更高效

---

## 延伸阅读

### 官方文档
- [Python heapq 官方文档](https://docs.python.org/3/library/heapq.html)
- [heapq 源代码](https://github.com/python/cpython/blob/main/Lib/heapq.py)

### 相关算法书籍
- 《算法导论》- 第 6 章：堆排序
- 《数据结构与算法分析》- 第 5 章：优先队列
- 《Python 算法大全》

### 在线资源
- [LeetCode 堆相关题目](https://leetcode.com/tag/heap/)
- [GeeksforGeeks 堆教程](https://www.geeksforgeeks.org/binary-heap/)
- [Visualgo 数据结构可视化](https://visualgo.net/en/heap)

### 相关标准库
- `bisect` - 维护排序列表
- `collections.deque` - 双端队列
- `queue.PriorityQueue` - 线程安全的优先队列
- `heapq.merge` - 合并多个排序序列

### 扩展主题
- 斐波那契堆（Fibonacci Heap）- 理论上更优的实现
- 配对堆（Pairing Heap）- 实践中常用
- 左倾堆（Leftist Heap）- 支持合并操作
- 二项堆（Binomial Heap）- 支持快速合并

### 常见 LeetCode 题目
- [LeetCode 215: 数组中的第K个最大元素](https://leetcode.com/problems/kth-largest-element-in-an-array/)
- [LeetCode 347: 前 K 个高频元素](https://leetcode.com/problems/top-k-frequent-elements/)
- [LeetCode 295: 数据流的中位数](https://leetcode.com/problems/find-median-from-data-stream/)
- [LeetCode 313: 超级丑数](https://leetcode.com/problems/super-ugly-number/)
- [LeetCode 1046: 最后一块石头的重量](https://leetcode.com/problems/last-stone-weight/)

