---
title: itertools模块
description: Python itertools完全指南，高效迭代器工具与组合生成
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - itertools
  - 迭代器
  - 函数式
status: imported
origin: old/src/content/docs/python/itertools.zh.md
divergence: 0.215
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 29
  lastUpdated: 2026-01-07
---

`itertools` 是 Python 标准库中最强大的模块之一，提供了一系列用于高效迭代的工具函数。这些函数返回迭代器，能够以内存高效的方式处理大量数据，是函数式编程和数据处理的利器。

   - [count - 无限计数器](#count---无限计数器)
   - [cycle - 无限循环](#cycle---无限循环)
   - [repeat - 重复元素](#repeat---重复元素)
2. [终止迭代器](#终止迭代器)
   - [chain - 连接迭代器](#chain---连接迭代器)
   - [compress - 过滤选择](#compress---过滤选择)
   - [islice - 切片迭代器](#islice---切片迭代器)
   - [takewhile 与 dropwhile](#takewhile-与-dropwhile)
   - [groupby - 分组](#groupby---分组)
   - [starmap - 展开参数映射](#starmap---展开参数映射)
3. [组合迭代器](#组合迭代器)
   - [product - 笛卡尔积](#product---笛卡尔积)
   - [permutations - 排列](#permutations---排列)
   - [combinations - 组合](#combinations---组合)
   - [combinations_with_replacement - 可重复组合](#combinations_with_replacement---可重复组合)
4. [实战应用](#实战应用)
5. [性能优化技巧](#性能优化技巧)
6. [总结](#总结)

---

## 无限迭代器

无限迭代器会持续生成值，永不停止。使用时必须配合终止条件，否则程序将陷入无限循环。

### count - 无限计数器

`count(start=0, step=1)` 从指定起始值开始，按指定步长无限递增。

```python
from itertools import count

# 基本用法：从 0 开始计数
counter = count()
for i in counter:
    if i >= 5:
        break
    print(i, end=' ')  # 0 1 2 3 4

print()

# 指定起始值和步长
counter = count(start=10, step=2)
for i in counter:
    if i >= 20:
        break
    print(i, end=' ')  # 10 12 14 16 18

print()

# 支持浮点数
counter = count(start=0.5, step=0.5)
values = []
for i in counter:
    if i > 3:
        break
    values.append(i)
print(values)  # [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
```

#### 实际应用：为数据添加序号

```python
from itertools import count

def add_index(items, start=1):
    """为可迭代对象的每个元素添加索引"""
    return zip(count(start), items)

fruits = ['apple', 'banana', 'cherry']
for index, fruit in add_index(fruits):
    print(f"{index}. {fruit}")
# 输出:
# apple
# banana
# cherry

# 也可以用 enumerate 实现，但 count 更灵活
# 例如，从 100 开始编号，步长为 10
for index, fruit in zip(count(100, 10), fruits):
    print(f"编号 {index}: {fruit}")
# 输出:
# 编号 100: apple
# 编号 110: banana
# 编号 120: cherry
```

#### 实际应用：生成唯一 ID

```python
from itertools import count

class IDGenerator:
    """简单的 ID 生成器"""
    def __init__(self, prefix='ID', start=1):
        self.prefix = prefix
        self._counter = count(start)

    def generate(self):
        return f"{self.prefix}_{next(self._counter):06d}"

# 使用示例
id_gen = IDGenerator(prefix='USER')
for _ in range(5):
    print(id_gen.generate())
# 输出:
# USER_000001
# USER_000002
# USER_000003
# USER_000004
# USER_000005
```

### cycle - 无限循环

`cycle(iterable)` 无限循环遍历给定的可迭代对象。

```python
from itertools import cycle

# 基本用法
colors = cycle(['red', 'green', 'blue'])
for i in range(7):
    print(next(colors), end=' ')
# 输出: red green blue red green blue red

print()

# 循环遍历字符串
chars = cycle('ABC')
result = [next(chars) for _ in range(10)]
print(result)  # ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A']
```

#### 实际应用：轮询调度器

```python
from itertools import cycle

class RoundRobinScheduler:
    """轮询调度器"""
    def __init__(self, servers):
        self.servers = servers
        self._cycle = cycle(servers)

    def get_next_server(self):
        return next(self._cycle)

# 使用示例
scheduler = RoundRobinScheduler(['server1', 'server2', 'server3'])
for i in range(7):
    server = scheduler.get_next_server()
    print(f"请求 {i+1} 分配到: {server}")
# 输出:
# 请求 1 分配到: server1
# 请求 2 分配到: server2
# 请求 3 分配到: server3
# 请求 4 分配到: server1
# 请求 5 分配到: server2
# 请求 6 分配到: server3
# 请求 7 分配到: server1
```

#### 实际应用：交替显示样式

```python
from itertools import cycle

def format_table_rows(rows, styles=None):
    """交替格式化表格行"""
    if styles is None:
        styles = ['odd', 'even']

    style_cycle = cycle(styles)
    for row in rows:
        style = next(style_cycle)
        yield f'<tr class="{style}">{row}</tr>'

# 使用示例
data = ['行数据 1', '行数据 2', '行数据 3', '行数据 4']
for formatted_row in format_table_rows(data):
    print(formatted_row)
# 输出:
# <tr class="odd">行数据 1</tr>
# <tr class="even">行数据 2</tr>
# <tr class="odd">行数据 3</tr>
# <tr class="even">行数据 4</tr>
```

### repeat - 重复元素

`repeat(object, times=None)` 重复返回指定对象。如果指定 `times`，则重复有限次。

```python
from itertools import repeat

# 无限重复
repeater = repeat('Hello')
for _ in range(3):
    print(next(repeater))
# 输出:
# Hello
# Hello
# Hello

# 有限次重复
values = list(repeat(10, 5))
print(values)  # [10, 10, 10, 10, 10]

# 重复可变对象时要注意：所有元素指向同一对象
lists = list(repeat([1, 2, 3], 3))
lists[0].append(4)
print(lists)  # [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]
```

#### 实际应用：配合 map 和 zip 使用

```python
from itertools import repeat

# 配合 map 使用固定参数
numbers = [1, 2, 3, 4, 5]
powered = list(map(pow, numbers, repeat(2)))
print(powered)  # [1, 4, 9, 16, 25]

# 配合 zip 创建键值对
keys = ['a', 'b', 'c']
default_dict = dict(zip(keys, repeat(0)))
print(default_dict)  # {'a': 0, 'b': 0, 'c': 0}

# 初始化二维数组（正确方式）
rows, cols = 3, 4
# 错误方式：matrix = [[0] * cols] * rows  # 所有行指向同一列表
# 正确方式：
matrix = [list(repeat(0, cols)) for _ in range(rows)]
matrix[0][0] = 1
print(matrix)  # [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
```

---

## 终止迭代器

终止迭代器处理有限的输入序列，并在适当时候停止。

### chain - 连接迭代器

`chain(*iterables)` 将多个可迭代对象连接成一个连续的迭代器。

```python
from itertools import chain

# 连接多个列表
list1 = [1, 2, 3]
list2 = [4, 5, 6]
list3 = [7, 8, 9]

combined = list(chain(list1, list2, list3))
print(combined)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 连接不同类型的可迭代对象
result = list(chain('ABC', [1, 2, 3], (10, 20)))
print(result)  # ['A', 'B', 'C', 1, 2, 3, 10, 20]

# 扁平化嵌套列表（一层）
nested = [[1, 2], [3, 4], [5, 6]]
flattened = list(chain(*nested))
print(flattened)  # [1, 2, 3, 4, 5, 6]
```

#### chain.from_iterable - 从可迭代对象中展开

```python
from itertools import chain

# 当可迭代对象本身在一个容器中时
nested = [[1, 2], [3, 4], [5, 6]]

# 使用 chain.from_iterable 更简洁
flattened = list(chain.from_iterable(nested))
print(flattened)  # [1, 2, 3, 4, 5, 6]

# 展开字符串列表
words = ['hello', 'world']
chars = list(chain.from_iterable(words))
print(chars)  # ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']
```

#### 实际应用：合并多个数据源

```python
from itertools import chain

def get_all_users():
    """从多个来源获取用户"""
    admin_users = ['admin1', 'admin2']
    regular_users = ['user1', 'user2', 'user3']
    guest_users = ['guest1']

    return chain(admin_users, regular_users, guest_users)

# 使用示例
all_users = list(get_all_users())
print(f"所有用户: {all_users}")
# 输出: 所有用户: ['admin1', 'admin2', 'user1', 'user2', 'user3', 'guest1']
```

#### 实际应用：处理多个文件

```python
from itertools import chain

def read_lines_from_files(file_paths):
    """从多个文件中读取所有行"""
    def file_lines(path):
        with open(path, 'r') as f:
            for line in f:
                yield line.strip()

    return chain.from_iterable(file_lines(path) for path in file_paths)

# 使用示例（假设文件存在）
# files = ['file1.txt', 'file2.txt', 'file3.txt']
# for line in read_lines_from_files(files):
#     process(line)
```

### compress - 过滤选择

`compress(data, selectors)` 根据选择器中的真值来过滤数据。

```python
from itertools import compress

# 基本用法
data = ['A', 'B', 'C', 'D', 'E']
selectors = [1, 0, 1, 0, 1]  # 或使用 True/False

result = list(compress(data, selectors))
print(result)  # ['A', 'C', 'E']

# 使用布尔值
data = range(10)
selectors = [n % 2 == 0 for n in data]  # 选择偶数
evens = list(compress(data, selectors))
print(evens)  # [0, 2, 4, 6, 8]
```

#### 实际应用：根据条件过滤

```python
from itertools import compress

def filter_by_condition(items, condition_func):
    """根据条件函数过滤项目"""
    selectors = [condition_func(item) for item in items]
    return compress(items, selectors)

# 示例：过滤正数
numbers = [-2, -1, 0, 1, 2, 3]
positives = list(filter_by_condition(numbers, lambda x: x > 0))
print(positives)  # [1, 2, 3]

# 示例：过滤有效数据
data = [
    {'name': 'Alice', 'valid': True},
    {'name': 'Bob', 'valid': False},
    {'name': 'Charlie', 'valid': True}
]
valid_data = list(filter_by_condition(data, lambda x: x['valid']))
print([d['name'] for d in valid_data])  # ['Alice', 'Charlie']
```

#### 实际应用：按掩码选择数据

```python
from itertools import compress

# 模拟数据分析场景
scores = [85, 92, 78, 95, 88, 76, 91]
# 假设我们有一个掩码标识哪些学生通过了考试（80分以上）
pass_mask = [score >= 80 for score in scores]

passing_scores = list(compress(scores, pass_mask))
print(f"及格成绩: {passing_scores}")  # 及格成绩: [85, 92, 95, 88, 91]
print(f"及格人数: {len(passing_scores)}/{len(scores)}")  # 及格人数: 5/7
```

### islice - 切片迭代器

`islice(iterable, stop)` 或 `islice(iterable, start, stop, step)` 对迭代器进行切片操作。

```python
from itertools import islice

# 获取前 N 个元素
data = range(100)
first_10 = list(islice(data, 10))
print(first_10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 指定起始和结束位置
middle = list(islice(range(100), 20, 30))
print(middle)  # [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]

# 带步长
every_third = list(islice(range(20), 0, 20, 3))
print(every_third)  # [0, 3, 6, 9, 12, 15, 18]

# 跳过前 N 个元素
data = ['a', 'b', 'c', 'd', 'e', 'f']
skip_first_2 = list(islice(data, 2, None))
print(skip_first_2)  # ['c', 'd', 'e', 'f']
```

#### 实际应用：分页处理

```python
from itertools import islice

def paginate(iterable, page_size):
    """将可迭代对象分页"""
    iterator = iter(iterable)
    while True:
        page = list(islice(iterator, page_size))
        if not page:
            break
        yield page

# 使用示例
items = range(1, 23)
for i, page in enumerate(paginate(items, 5), 1):
    print(f"第 {i} 页: {page}")
# 输出:
# 第 1 页: [1, 2, 3, 4, 5]
# 第 2 页: [6, 7, 8, 9, 10]
# 第 3 页: [11, 12, 13, 14, 15]
# 第 4 页: [16, 17, 18, 19, 20]
# 第 5 页: [21, 22]
```

#### 实际应用：限制生成器输出

```python
from itertools import islice, count

def fibonacci():
    """无限斐波那契数列生成器"""
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 获取前 10 个斐波那契数
fib_10 = list(islice(fibonacci(), 10))
print(fib_10)  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# 获取第 20 到第 30 个斐波那契数
fib_20_30 = list(islice(fibonacci(), 20, 30))
print(fib_20_30)  # [6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229]
```

### takewhile 与 dropwhile

`takewhile(predicate, iterable)` 在条件为真时获取元素，遇到假值立即停止。
`dropwhile(predicate, iterable)` 在条件为真时跳过元素，遇到假值后开始获取所有后续元素。

```python
from itertools import takewhile, dropwhile

# takewhile：获取满足条件的前缀
data = [1, 3, 5, 7, 2, 4, 6, 8]

# 获取连续的奇数
odd_prefix = list(takewhile(lambda x: x % 2 == 1, data))
print(odd_prefix)  # [1, 3, 5, 7]

# dropwhile：跳过满足条件的前缀
remaining = list(dropwhile(lambda x: x % 2 == 1, data))
print(remaining)  # [2, 4, 6, 8]

# 注意：一旦条件不满足，不会再检查后续元素
data2 = [1, 3, 5, 2, 4, 7, 9]
result = list(takewhile(lambda x: x % 2 == 1, data2))
print(result)  # [1, 3, 5]  # 不包含后面的 7, 9
```

#### 实际应用：解析日志文件

```python
from itertools import takewhile, dropwhile

def parse_log_section(lines, section_header):
    """解析日志中的特定部分"""
    # 跳过直到找到目标节头
    after_header = dropwhile(
        lambda line: section_header not in line,
        lines
    )

    # 跳过节头本身
    next(after_header, None)

    # 获取直到下一个节头或空行
    section_lines = takewhile(
        lambda line: line.strip() and not line.startswith('['),
        after_header
    )

    return list(section_lines)

# 模拟日志
log_lines = [
    "[Header1]",
    "line1",
    "line2",
    "[Header2]",
    "data1",
    "data2",
    "data3",
    "[Header3]",
    "more data"
]

section = parse_log_section(iter(log_lines), "[Header2]")
print(section)  # ['data1', 'data2', 'data3']
```

#### 实际应用：处理排序数据

```python
from itertools import takewhile, dropwhile

def get_top_scores(scores, threshold=80):
    """获取高于阈值的前导分数（假设已降序排列）"""
    return list(takewhile(lambda x: x >= threshold, scores))

def get_failing_scores(scores, threshold=60):
    """获取低于阈值的分数（假设已降序排列）"""
    return list(dropwhile(lambda x: x >= threshold, scores))

# 已排序的成绩
sorted_scores = [98, 95, 92, 88, 85, 78, 72, 65, 58, 45]

top_scores = get_top_scores(sorted_scores, 80)
print(f"优秀成绩: {top_scores}")  # 优秀成绩: [98, 95, 92, 88, 85]

failing = get_failing_scores(sorted_scores, 60)
print(f"不及格成绩: {failing}")  # 不及格成绩: [58, 45]
```

### groupby - 分组

`groupby(iterable, key=None)` 将连续的相同元素（或相同键值的元素）分组。

> **重要提示**: `groupby` 只对**连续**的相同元素进行分组。如果需要对非连续元素分组，需要先排序。

```python
from itertools import groupby

# 基本用法：对连续相同元素分组
data = 'AAAABBBCCDAABB'
for key, group in groupby(data):
    print(f"'{key}': {list(group)}")
# 输出:
# 'A': ['A', 'A', 'A', 'A']
# 'B': ['B', 'B', 'B']
# 'C': ['C', 'C']
# 'D': ['D']
# 'A': ['A', 'A']  # 注意：后面的 A 单独成组
# 'B': ['B', 'B']

# 使用 key 函数
numbers = [1, 1, 2, 3, 3, 3, 4, 5, 5]
for key, group in groupby(numbers, key=lambda x: x % 2):
    parity = "奇数" if key else "偶数"
    print(f"{parity}: {list(group)}")
# 输出:
# 奇数: [1, 1]
# 偶数: [2]
# 奇数: [3, 3, 3]
# 偶数: [4]
# 奇数: [5, 5]
```

#### 按键分组（需要先排序）

```python
from itertools import groupby
from operator import itemgetter

# 按类别分组
products = [
    {'name': 'Apple', 'category': 'Fruit'},
    {'name': 'Carrot', 'category': 'Vegetable'},
    {'name': 'Banana', 'category': 'Fruit'},
    {'name': 'Broccoli', 'category': 'Vegetable'},
    {'name': 'Orange', 'category': 'Fruit'},
]

# 必须先排序！
products_sorted = sorted(products, key=itemgetter('category'))

# 然后分组
for category, items in groupby(products_sorted, key=itemgetter('category')):
    item_names = [item['name'] for item in items]
    print(f"{category}: {item_names}")
# 输出:
# Fruit: ['Apple', 'Banana', 'Orange']
# Vegetable: ['Carrot', 'Broccoli']
```

#### 实际应用：压缩连续数据

```python
from itertools import groupby

def run_length_encode(data):
    """游程编码：压缩连续重复字符"""
    return [(char, len(list(group))) for char, group in groupby(data)]

def run_length_decode(encoded):
    """解码游程编码"""
    return ''.join(char * count for char, count in encoded)

# 使用示例
original = 'AAABBBCCCCDDDDDEEFFF'
encoded = run_length_encode(original)
print(f"编码: {encoded}")
# 输出: 编码: [('A', 3), ('B', 3), ('C', 4), ('D', 5), ('E', 2), ('F', 3)]

decoded = run_length_decode(encoded)
print(f"解码: {decoded}")
# 输出: 解码: AAABBBCCCCDDDDDEEFFF

print(f"原始长度: {len(original)}, 编码长度: {len(encoded)}")
# 输出: 原始长度: 20, 编码长度: 6
```

#### 实际应用：合并连续区间

```python
from itertools import groupby

def merge_consecutive_ranges(numbers):
    """合并连续的数字为区间"""
    if not numbers:
        return []

    ranges = []
    # 按照 number - index 分组，连续数字的这个值相同
    for _, group in groupby(enumerate(sorted(numbers)),
                            key=lambda x: x[1] - x[0]):
        group_list = list(group)
        start = group_list[0][1]
        end = group_list[-1][1]
        if start == end:
            ranges.append(str(start))
        else:
            ranges.append(f"{start}-{end}")

    return ranges

# 使用示例
numbers = [1, 2, 3, 5, 6, 7, 10, 15, 16, 17, 18, 20]
result = merge_consecutive_ranges(numbers)
print(f"区间: {result}")
# 输出: 区间: ['1-3', '5-7', '10', '15-18', '20']
```

### starmap - 展开参数映射

`starmap(function, iterable)` 类似于 `map()`，但会将可迭代对象中的每个元素展开为函数参数。

```python
from itertools import starmap

# 基本用法
pairs = [(2, 5), (3, 2), (10, 3)]
results = list(starmap(pow, pairs))
print(results)  # [32, 9, 1000]

# 相当于：
# [pow(2, 5), pow(3, 2), pow(10, 3)]

# 对比 map 和 starmap
def add(a, b):
    return a + b

pairs = [(1, 2), (3, 4), (5, 6)]

# 使用 map（需要 lambda 解包）
result_map = list(map(lambda p: add(*p), pairs))
print(result_map)  # [3, 7, 11]

# 使用 starmap（更简洁）
result_starmap = list(starmap(add, pairs))
print(result_starmap)  # [3, 7, 11]
```

#### 实际应用：批量字符串格式化

```python
from itertools import starmap

def format_user(name, age, city):
    return f"{name}（{age}岁，来自{city}）"

users = [
    ('Alice', 25, '北京'),
    ('Bob', 30, '上海'),
    ('Charlie', 28, '广州')
]

formatted_users = list(starmap(format_user, users))
for user in formatted_users:
    print(user)
# 输出:
# Alice（25岁，来自北京）
# Bob（30岁，来自上海）
# Charlie（28岁，来自广州）
```

#### 实际应用：向量运算

```python
from itertools import starmap
from operator import mul, add

def dot_product(vec1, vec2):
    """计算两个向量的点积"""
    return sum(starmap(mul, zip(vec1, vec2)))

def vector_add(vec1, vec2):
    """向量加法"""
    return list(starmap(add, zip(vec1, vec2)))

# 使用示例
v1 = [1, 2, 3]
v2 = [4, 5, 6]

print(f"点积: {dot_product(v1, v2)}")  # 点积: 32 (1*4 + 2*5 + 3*6)
print(f"向量和: {vector_add(v1, v2)}")  # 向量和: [5, 7, 9]
```

#### 实际应用：多列数据处理

```python
from itertools import starmap

def calculate_bmi(weight, height):
    """计算 BMI 指数"""
    return weight / (height ** 2)

# 体重(kg)和身高(m)的数据
data = [
    (70, 1.75),
    (60, 1.65),
    (80, 1.80),
    (55, 1.60)
]

bmi_values = list(starmap(calculate_bmi, data))
for (weight, height), bmi in zip(data, bmi_values):
    print(f"体重={weight}kg, 身高={height}m, BMI={bmi:.2f}")
# 输出:
# 体重=70kg, 身高=1.75m, BMI=22.86
# 体重=60kg, 身高=1.65m, BMI=22.04
# 体重=80kg, 身高=1.80m, BMI=24.69
# 体重=55kg, 身高=1.60m, BMI=21.48
```

---

## 组合迭代器

组合迭代器用于生成排列、组合和笛卡尔积等组合数学中的序列。

### product - 笛卡尔积

`product(*iterables, repeat=1)` 计算输入可迭代对象的笛卡尔积。

```python
from itertools import product

# 两个序列的笛卡尔积
colors = ['red', 'green']
sizes = ['S', 'M', 'L']

combinations = list(product(colors, sizes))
print(combinations)
# [('red', 'S'), ('red', 'M'), ('red', 'L'),
#  ('green', 'S'), ('green', 'M'), ('green', 'L')]

# 三个序列的笛卡尔积
a = [1, 2]
b = ['a', 'b']
c = [True, False]

result = list(product(a, b, c))
print(f"组合数: {len(result)}")  # 组合数: 8
for item in result:
    print(item)

# 使用 repeat 参数（相当于重复自身）
digits = [0, 1]
binary_3bit = list(product(digits, repeat=3))
print(binary_3bit)
# [(0, 0, 0), (0, 0, 1), (0, 1, 0), (0, 1, 1),
#  (1, 0, 0), (1, 0, 1), (1, 1, 0), (1, 1, 1)]
```

#### 实际应用：生成密码组合

```python
from itertools import product
import string

def generate_passwords(length, chars=None):
    """生成所有可能的密码组合"""
    if chars is None:
        chars = string.ascii_lowercase + string.digits

    for combo in product(chars, repeat=length):
        yield ''.join(combo)

# 示例：生成所有 2 位数字密码
two_digit_passwords = list(generate_passwords(2, '0123456789'))
print(f"2位数字密码数量: {len(two_digit_passwords)}")  # 100
print(f"前10个: {two_digit_passwords[:10]}")
# ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09']

# 注意：对于较长的密码，组合数会急剧增加
# 4位小写字母密码: 26^4 = 456,976 种
```

#### 实际应用：参数网格搜索

```python
from itertools import product

def grid_search(param_grid):
    """生成参数组合用于网格搜索"""
    keys = param_grid.keys()
    values = param_grid.values()

    for combo in product(*values):
        yield dict(zip(keys, combo))

# 机器学习超参数搜索
param_grid = {
    'learning_rate': [0.001, 0.01, 0.1],
    'batch_size': [32, 64, 128],
    'epochs': [10, 20]
}

print("参数组合:")
for i, params in enumerate(grid_search(param_grid), 1):
    print(f"{i}. {params}")
# 输出:
# {'learning_rate': 0.001, 'batch_size': 32, 'epochs': 10}
# {'learning_rate': 0.001, 'batch_size': 32, 'epochs': 20}
# ...
# {'learning_rate': 0.1, 'batch_size': 128, 'epochs': 20}
```

#### 实际应用：多维坐标遍历

```python
from itertools import product

def traverse_grid(dimensions):
    """遍历多维网格的所有坐标"""
    ranges = [range(dim) for dim in dimensions]
    return product(*ranges)

# 遍历 3x4x2 的三维空间
for coord in traverse_grid((3, 4, 2)):
    print(coord)
# (0, 0, 0), (0, 0, 1), (0, 1, 0), ...

# 棋盘坐标
rows = 'abcdefgh'
cols = '12345678'
chess_squares = [''.join(sq) for sq in product(rows, cols)]
print(f"棋盘格子: {chess_squares[:8]}...")  # ['a1', 'a2', ..., 'a8']...
print(f"总共 {len(chess_squares)} 个格子")  # 64
```

### permutations - 排列

`permutations(iterable, r=None)` 生成长度为 r 的所有排列。排列考虑顺序，元素不重复使用。

```python
from itertools import permutations

# 全排列
items = ['A', 'B', 'C']
perms = list(permutations(items))
print(f"全排列数量: {len(perms)}")  # 6 (3!)
for p in perms:
    print(p)
# ('A', 'B', 'C'), ('A', 'C', 'B'), ('B', 'A', 'C'),
# ('B', 'C', 'A'), ('C', 'A', 'B'), ('C', 'B', 'A')

# 指定排列长度
perms_2 = list(permutations(items, 2))
print(f"\n2元素排列数量: {len(perms_2)}")  # 6 (P(3,2) = 3*2)
for p in perms_2:
    print(p)
# ('A', 'B'), ('A', 'C'), ('B', 'A'),
# ('B', 'C'), ('C', 'A'), ('C', 'B')

# 字符串排列
word = 'ABC'
word_perms = [''.join(p) for p in permutations(word)]
print(f"\n单词排列: {word_perms}")
# ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA']
```

#### 实际应用：旅行商问题

```python
from itertools import permutations

def calculate_route_distance(route, distances):
    """计算路线总距离"""
    total = 0
    for i in range(len(route) - 1):
        total += distances[route[i]][route[i + 1]]
    # 返回起点
    total += distances[route[-1]][route[0]]
    return total

def solve_tsp_brute_force(cities, distances):
    """暴力求解旅行商问题（小规模）"""
    # 固定第一个城市，对其余城市进行排列
    other_cities = cities[1:]
    best_route = None
    best_distance = float('inf')

    for perm in permutations(other_cities):
        route = [cities[0]] + list(perm)
        distance = calculate_route_distance(route, distances)
        if distance < best_distance:
            best_distance = distance
            best_route = route

    return best_route, best_distance

# 使用示例
cities = ['A', 'B', 'C', 'D']
distances = {
    'A': {'A': 0, 'B': 10, 'C': 15, 'D': 20},
    'B': {'A': 10, 'B': 0, 'C': 35, 'D': 25},
    'C': {'A': 15, 'B': 35, 'C': 0, 'D': 30},
    'D': {'A': 20, 'B': 25, 'C': 30, 'D': 0}
}

route, distance = solve_tsp_brute_force(cities, distances)
print(f"最短路线: {' -> '.join(route)} -> {route[0]}")
print(f"总距离: {distance}")
```

#### 实际应用：字谜求解

```python
from itertools import permutations

def find_anagrams(word, dictionary):
    """找出单词的所有有效变位词"""
    word_lower = word.lower()
    valid_anagrams = set()

    for perm in permutations(word_lower):
        candidate = ''.join(perm)
        if candidate in dictionary and candidate != word_lower:
            valid_anagrams.add(candidate)

    return valid_anagrams

# 模拟词典
dictionary = {'eat', 'tea', 'ate', 'eta', 'tae', 'aet', 'cat', 'act'}

word = 'eat'
anagrams = find_anagrams(word, dictionary)
print(f"'{word}' 的变位词: {anagrams}")
# 'eat' 的变位词: {'ate', 'eta', 'tea', 'tae'}
```

### combinations - 组合

`combinations(iterable, r)` 生成长度为 r 的所有组合。组合不考虑顺序，元素不重复使用。

```python
from itertools import combinations

# 基本用法
items = ['A', 'B', 'C', 'D']

# 选择 2 个元素的组合
combs_2 = list(combinations(items, 2))
print(f"2元素组合数量: {len(combs_2)}")  # 6 (C(4,2) = 6)
print(combs_2)
# [('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]

# 选择 3 个元素的组合
combs_3 = list(combinations(items, 3))
print(f"\n3元素组合数量: {len(combs_3)}")  # 4 (C(4,3) = 4)
print(combs_3)
# [('A', 'B', 'C'), ('A', 'B', 'D'), ('A', 'C', 'D'), ('B', 'C', 'D')]

# 数字组合
numbers = [1, 2, 3, 4, 5]
pairs = list(combinations(numbers, 2))
print(f"\n数字对: {pairs}")
# [(1, 2), (1, 3), (1, 4), (1, 5), (2, 3), (2, 4), (2, 5), (3, 4), (3, 5), (4, 5)]
```

#### 实际应用：子集和问题

```python
from itertools import combinations

def find_subsets_with_sum(numbers, target_sum):
    """找出所有和为目标值的子集"""
    results = []
    for r in range(1, len(numbers) + 1):
        for combo in combinations(numbers, r):
            if sum(combo) == target_sum:
                results.append(combo)
    return results

# 使用示例
numbers = [1, 2, 3, 4, 5, 6]
target = 10

subsets = find_subsets_with_sum(numbers, target)
print(f"和为 {target} 的子集:")
for subset in subsets:
    print(f"  {subset} = {sum(subset)}")
# 输出:
#   (4, 6) = 10
#   (1, 3, 6) = 10
#   (1, 4, 5) = 10
#   (2, 3, 5) = 10
#   (1, 2, 3, 4) = 10
```

#### 实际应用：团队组合

```python
from itertools import combinations

def generate_teams(members, team_size):
    """生成所有可能的团队组合"""
    return list(combinations(members, team_size))

def generate_matches(teams):
    """生成所有可能的比赛配对"""
    return list(combinations(teams, 2))

# 使用示例
players = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']

# 生成 3 人团队
teams = generate_teams(players, 3)
print(f"可能的3人团队数量: {len(teams)}")  # C(6,3) = 20

# 显示前 5 个团队
print("前5个团队:")
for team in teams[:5]:
    print(f"  {team}")

# 如果只有 4 人，生成所有可能的 2v2 对战
four_players = ['Alice', 'Bob', 'Charlie', 'David']
# 先生成所有 2 人组合
pairs = list(combinations(four_players, 2))
# 然后选出不重叠的配对
matches = []
for pair1, pair2 in combinations(pairs, 2):
    if not set(pair1) & set(pair2):  # 没有重叠成员
        matches.append((pair1, pair2))

print(f"\n2v2 比赛配对:")
for match in matches:
    print(f"  {match[0]} vs {match[1]}")
```

#### 实际应用：特征选择

```python
from itertools import combinations

def evaluate_feature_combinations(features, X, y, model_class, scorer):
    """评估不同特征组合的模型性能（示意）"""
    results = []

    # 尝试不同数量的特征组合
    for r in range(1, len(features) + 1):
        for feature_combo in combinations(range(len(features)), r):
            feature_names = [features[i] for i in feature_combo]
            # 这里简化了实际的模型训练和评估过程
            # score = train_and_evaluate(X[:, feature_combo], y, model_class, scorer)
            score = sum(feature_combo)  # 示意分数
            results.append({
                'features': feature_names,
                'n_features': r,
                'score': score
            })

    return sorted(results, key=lambda x: x['score'], reverse=True)

# 示例
features = ['年龄', '收入', '学历', '工作年限']
# 实际使用时需要提供 X, y 数据和模型
print(f"特征组合数量: {sum(len(list(combinations(features, r))) for r in range(1, 5))}")
# 特征组合数量: 15 (C(4,1) + C(4,2) + C(4,3) + C(4,4) = 4 + 6 + 4 + 1)
```

### combinations_with_replacement - 可重复组合

`combinations_with_replacement(iterable, r)` 生成长度为 r 的组合，允许元素重复选择。

```python
from itertools import combinations_with_replacement

# 基本用法
items = ['A', 'B', 'C']

# 可重复选择 2 个元素
combs = list(combinations_with_replacement(items, 2))
print(f"可重复2元素组合数量: {len(combs)}")  # 6
print(combs)
# [('A', 'A'), ('A', 'B'), ('A', 'C'), ('B', 'B'), ('B', 'C'), ('C', 'C')]

# 对比普通 combinations
from itertools import combinations
normal_combs = list(combinations(items, 2))
print(f"\n普通组合: {normal_combs}")
# [('A', 'B'), ('A', 'C'), ('B', 'C')]  # 没有重复元素

# 数字示例
digits = [1, 2, 3]
with_rep = list(combinations_with_replacement(digits, 2))
print(f"\n可重复数字组合: {with_rep}")
# [(1, 1), (1, 2), (1, 3), (2, 2), (2, 3), (3, 3)]
```

#### 实际应用：硬币组合问题

```python
from itertools import combinations_with_replacement

def coin_combinations(coins, n):
    """找出使用 n 枚硬币的所有可能组合"""
    return list(combinations_with_replacement(coins, n))

def find_exact_change(coins, amount, max_coins=10):
    """找出凑成指定金额的所有方式"""
    results = []
    for n in range(1, max_coins + 1):
        for combo in combinations_with_replacement(coins, n):
            if sum(combo) == amount:
                results.append(combo)
    return results

# 使用示例
coins = [1, 5, 10, 25]  # 美分：便士、镍币、角币、25美分

# 用3枚硬币的所有组合
three_coins = coin_combinations(coins, 3)
print(f"3枚硬币的组合数: {len(three_coins)}")
print("部分组合:")
for combo in three_coins[:10]:
    print(f"  {combo} = {sum(combo)} 美分")

# 凑成 30 美分的方式
ways = find_exact_change(coins, 30, max_coins=6)
print(f"\n凑成 30 美分的方式 ({len(ways)} 种):")
for way in ways:
    print(f"  {way}")
```

#### 实际应用：骰子点数组合

```python
from itertools import combinations_with_replacement
from collections import Counter

def dice_combinations(n_dice, n_sides=6):
    """生成 n 个骰子的所有可能组合"""
    sides = range(1, n_sides + 1)
    return list(combinations_with_replacement(sides, n_dice))

def dice_sum_probability(n_dice, target_sum, n_sides=6):
    """计算 n 个骰子和为 target_sum 的概率"""
    combos = dice_combinations(n_dice, n_sides)

    # 统计每种组合出现的排列数
    total_outcomes = n_sides ** n_dice
    favorable_outcomes = 0

    for combo in combos:
        if sum(combo) == target_sum:
            # 计算这个组合的排列数
            counter = Counter(combo)
            # 多项式系数
            from math import factorial
            permutations = factorial(n_dice)
            for count in counter.values():
                permutations //= factorial(count)
            favorable_outcomes += permutations

    return favorable_outcomes / total_outcomes

# 使用示例
# 2个骰子的所有组合
two_dice = dice_combinations(2)
print(f"2个骰子的组合数（不考虑顺序）: {len(two_dice)}")  # 21

# 计算 2 个骰子和为 7 的概率
prob_7 = dice_sum_probability(2, 7)
print(f"2个骰子和为7的概率: {prob_7:.4f}")  # 约 0.1667 (1/6)

# 统计各种和的概率
print("\n2个骰子各种和的概率:")
for target in range(2, 13):
    prob = dice_sum_probability(2, target)
    bar = '*' * int(prob * 100)
    print(f"  {target:2d}: {prob:.4f} {bar}")
```

---

## 实战应用

### 综合示例：数据处理管道

```python
from itertools import chain, islice, groupby, takewhile, dropwhile
from operator import itemgetter

# 模拟日志数据
log_entries = [
    {'timestamp': '2024-01-01 10:00', 'level': 'INFO', 'message': '系统启动'},
    {'timestamp': '2024-01-01 10:01', 'level': 'DEBUG', 'message': '加载配置'},
    {'timestamp': '2024-01-01 10:02', 'level': 'INFO', 'message': '服务就绪'},
    {'timestamp': '2024-01-01 10:05', 'level': 'ERROR', 'message': '连接超时'},
    {'timestamp': '2024-01-01 10:06', 'level': 'ERROR', 'message': '重试失败'},
    {'timestamp': '2024-01-01 10:07', 'level': 'INFO', 'message': '连接恢复'},
    {'timestamp': '2024-01-01 10:10', 'level': 'WARNING', 'message': '内存使用高'},
    {'timestamp': '2024-01-01 10:15', 'level': 'INFO', 'message': '执行清理'},
]

# 过滤非 DEBUG 级别的日志
non_debug = (e for e in log_entries if e['level'] != 'DEBUG')

# 按级别分组统计
sorted_entries = sorted(log_entries, key=itemgetter('level'))
print("按级别统计:")
for level, entries in groupby(sorted_entries, key=itemgetter('level')):
    count = len(list(entries))
    print(f"  {level}: {count} 条")

# 获取第一个错误之后的所有日志
def is_error(entry):
    return entry['level'] == 'ERROR'

after_first_error = list(dropwhile(lambda e: not is_error(e), log_entries))
print(f"\n第一个错误后的日志数: {len(after_first_error)}")

# 获取错误连续出现的日志
errors_only = [e for e in log_entries if is_error(e)]
print(f"错误日志: {[e['message'] for e in errors_only]}")
```

### 综合示例：密码学工具

```python
from itertools import permutations, product, cycle
import string

def caesar_cipher(text, shift):
    """凯撒密码"""
    alphabet = string.ascii_lowercase
    shifted = alphabet[shift:] + alphabet[:shift]
    table = str.maketrans(alphabet + alphabet.upper(),
                          shifted + shifted.upper())
    return text.translate(table)

def caesar_brute_force(ciphertext):
    """暴力破解凯撒密码"""
    for shift in range(26):
        plaintext = caesar_cipher(ciphertext, -shift)
        yield shift, plaintext

def vigenere_cipher(text, key, decrypt=False):
    """维吉尼亚密码"""
    alphabet = string.ascii_lowercase
    key_cycle = cycle(key.lower())
    result = []

    for char in text.lower():
        if char in alphabet:
            shift = alphabet.index(next(key_cycle))
            if decrypt:
                shift = -shift
            idx = (alphabet.index(char) + shift) % 26
            result.append(alphabet[idx])
        else:
            result.append(char)

    return ''.join(result)

# 使用示例
# 凯撒密码
original = "Hello World"
encrypted = caesar_cipher(original, 3)
print(f"原文: {original}")
print(f"凯撒加密 (位移=3): {encrypted}")

# 暴力破解
print("\n暴力破解尝试:")
for shift, plaintext in caesar_brute_force(encrypted):
    if plaintext.lower().startswith('hello'):
        print(f"  位移 {shift}: {plaintext} <-- 可能的明文")
        break

# 维吉尼亚密码
key = "key"
vig_encrypted = vigenere_cipher(original, key)
vig_decrypted = vigenere_cipher(vig_encrypted, key, decrypt=True)
print(f"\n维吉尼亚加密 (密钥='{key}'): {vig_encrypted}")
print(f"维吉尼亚解密: {vig_decrypted}")
```

### 综合示例：数学工具

```python
from itertools import combinations, permutations, count, takewhile
from functools import reduce
from operator import mul

def factorial(n):
    """计算阶乘"""
    return reduce(mul, range(1, n + 1), 1)

def nPr(n, r):
    """排列数 P(n,r)"""
    return len(list(permutations(range(n), r)))

def nCr(n, r):
    """组合数 C(n,r)"""
    return len(list(combinations(range(n), r)))

def generate_primes(limit):
    """生成素数（埃拉托斯特尼筛法的迭代器版本）"""
    def is_prime(n):
        if n < 2:
            return False
        for i in range(2, int(n**0.5) + 1):
            if n % i == 0:
                return False
        return True

    return (n for n in count(2) if is_prime(n))

def prime_factorization(n):
    """质因数分解"""
    factors = []
    primes = generate_primes(n)

    for p in primes:
        if p * p > n:
            break
        while n % p == 0:
            factors.append(p)
            n //= p

    if n > 1:
        factors.append(n)

    return factors

# 使用示例
print(f"5! = {factorial(5)}")  # 120
print(f"P(5,3) = {nPr(5, 3)}")  # 60
print(f"C(5,3) = {nCr(5, 3)}")  # 10

# 生成前 20 个素数
first_20_primes = list(takewhile(lambda x: x < 80, generate_primes(100)))
print(f"80以内的素数: {first_20_primes}")

# 质因数分解
n = 360
factors = prime_factorization(n)
print(f"{n} 的质因数分解: {factors}")  # [2, 2, 2, 3, 3, 5]
```

---

## 性能优化技巧

### 惰性求值的优势

```python
from itertools import islice, chain, count
import sys

# 迭代器的内存效率
def compare_memory():
    # 列表：一次性创建所有元素
    list_version = list(range(1000000))

    # 迭代器：按需生成
    iter_version = range(1000000)

    print(f"列表内存占用: {sys.getsizeof(list_version)} 字节")
    print(f"range内存占用: {sys.getsizeof(iter_version)} 字节")

compare_memory()
# 列表内存占用: 约 8.5MB
# range内存占用: 48 字节

# 使用 itertools 处理大数据
def process_large_file(filename, batch_size=1000):
    """分批处理大文件"""
    with open(filename, 'r') as f:
        while True:
            batch = list(islice(f, batch_size))
            if not batch:
                break
            # 处理批次
            yield batch
```

### 避免多次迭代

```python
from itertools import tee

# 错误：多次迭代生成器
def wrong_approach():
    gen = (x * 2 for x in range(5))
    print(f"最大值: {max(gen)}")  # 8
    print(f"最小值: {min(gen)}")  # 报错或空！生成器已耗尽

# 正确：使用 tee 创建独立迭代器
def correct_approach():
    gen = (x * 2 for x in range(5))
    gen1, gen2 = tee(gen, 2)
    print(f"最大值: {max(gen1)}")  # 8
    print(f"最小值: {min(gen2)}")  # 0

# 或者转换为列表（如果内存允许）
def list_approach():
    data = list(x * 2 for x in range(5))
    print(f"最大值: {max(data)}")  # 8
    print(f"最小值: {min(data)}")  # 0

correct_approach()
list_approach()
```

### 组合复杂操作

```python
from itertools import chain, compress, islice, takewhile
from operator import itemgetter

def efficient_data_pipeline(data):
    """高效的数据处理管道"""

    # 1. 过滤有效数据
    valid = (item for item in data if item.get('valid', False))

    # 2. 提取需要的字段
    extracted = (
        {'name': item['name'], 'score': item['score']}
        for item in valid
    )

    # 3. 按分数过滤
    high_scorers = (
        item for item in extracted
        if item['score'] >= 80
    )

    # 4. 限制结果数量
    top_10 = islice(high_scorers, 10)

    return list(top_10)

# 测试数据
test_data = [
    {'name': 'Alice', 'score': 95, 'valid': True},
    {'name': 'Bob', 'score': 75, 'valid': True},
    {'name': 'Charlie', 'score': 88, 'valid': False},
    {'name': 'David', 'score': 92, 'valid': True},
    {'name': 'Eve', 'score': 85, 'valid': True},
]

result = efficient_data_pipeline(test_data)
print(f"结果: {result}")
```

---

## 总结

`itertools` 模块提供了三类强大的迭代器工具：

### 无限迭代器

| 函数 | 描述 | 示例 |
|------|------|------|
| `count(start, step)` | 无限计数 | `count(10, 2)` -> 10, 12, 14, ... |
| `cycle(iterable)` | 无限循环 | `cycle('ABC')` -> A, B, C, A, B, C, ... |
| `repeat(elem, n)` | 重复元素 | `repeat(10, 3)` -> 10, 10, 10 |

### 终止迭代器

| 函数 | 描述 | 示例 |
|------|------|------|
| `chain(*iterables)` | 连接多个迭代器 | `chain([1,2], [3,4])` -> 1, 2, 3, 4 |
| `compress(data, selectors)` | 按选择器过滤 | `compress('ABCD', [1,0,1,0])` -> A, C |
| `islice(iterable, stop)` | 切片迭代器 | `islice(range(10), 5)` -> 0, 1, 2, 3, 4 |
| `takewhile(pred, iterable)` | 条件为真时获取 | `takewhile(lambda x: x<5, [1,3,5,2])` -> 1, 3 |
| `dropwhile(pred, iterable)` | 条件为真时跳过 | `dropwhile(lambda x: x<5, [1,3,5,2])` -> 5, 2 |
| `groupby(iterable, key)` | 连续元素分组 | 按键分组连续元素 |
| `starmap(func, iterable)` | 展开参数映射 | `starmap(pow, [(2,3), (3,2)])` -> 8, 9 |

### 组合迭代器

| 函数 | 描述 | 示例 |
|------|------|------|
| `product(*iterables)` | 笛卡尔积 | `product('AB', '12')` -> A1, A2, B1, B2 |
| `permutations(iterable, r)` | 排列（考虑顺序） | `permutations('ABC', 2)` -> AB, AC, BA, BC, CA, CB |
| `combinations(iterable, r)` | 组合（不考虑顺序） | `combinations('ABC', 2)` -> AB, AC, BC |
| `combinations_with_replacement` | 可重复组合 | `combinations_with_replacement('AB', 2)` -> AA, AB, BB |

### 使用建议

1. **内存效率**: 迭代器是惰性求值的，非常适合处理大数据集
2. **管道组合**: 多个 itertools 函数可以组合形成数据处理管道
3. **无限迭代器**: 使用时必须配合终止条件（如 `islice`、`takewhile` 或 `break`）
4. **groupby 注意事项**: 需要先对数据排序，否则相同键的元素可能分散在多个组中
5. **组合数增长**: 排列组合的结果数量会随输入规模急剧增长，注意性能

`itertools` 是 Python 函数式编程和高效数据处理的核心模块，掌握它能够显著提升代码的简洁性和性能。

---

## 延伸阅读

- [Python 官方文档 - itertools](https://docs.python.org/3/library/itertools.html)
- [itertools 配方](https://docs.python.org/3/library/itertools.html#itertools-recipes)
- [more-itertools 扩展库](https://more-itertools.readthedocs.io/)
- [functools 模块](https://docs.python.org/3/library/functools.html)
