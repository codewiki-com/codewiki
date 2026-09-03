---
title: Python 列表推导式与数据结构
description: 掌握 Python 列表、字典、集合推导式和高级操作
track: python
section: basics
difficulty: intermediate
tags:
  - Python
  - 列表推导式
  - 数据结构
  - 集合
status: imported
origin: old/src/content/docs/python/list-comprehensions.zh.md
divergence: 0.252
issues: []
legacy:
  category: Python
  subcategory: Data Structures
  order: 4
  lastUpdated: 2026-01-07
---

列表推导式是 Python 最优雅的特性之一，提供了一种简洁的方式来创建列表、字典和集合。本指南深入探讨推导式，涵盖从基础到高级的模式以及性能考虑。

## 推导式简介

推导式提供了一种简洁的语法，通过遍历可迭代对象并可选地过滤元素来创建集合。它们比等效的基于循环的代码更具可读性，通常也更快。

### 基本语法

```python
# 通用推导式语法
[expression for item in iterable if condition]
```

**组成部分：**
- **expression**：要包含在新集合中的内容
- **item**：表示每个元素的变量
- **iterable**：要遍历的源集合
- **condition**：可选的过滤器（可以省略）

## 列表推导式

列表推导式通过转换和过滤现有的可迭代对象来创建新列表。

### 基本列表推导式

```python
# 传统方法
squares = []
for x in range(10):
    squares.append(x ** 2)

# 列表推导式
squares = [x ** 2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 字符串操作
names = ["alice", "bob", "charlie"]
capitalized = [name.capitalize() for name in names]
# ['Alice', 'Bob', 'Charlie']

# 方法调用
words = ["  hello  ", "  world  "]
cleaned = [word.strip() for word in words]
# ['hello', 'world']
```

### 带条件的列表推导式

```python
# 过滤偶数
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = [x for x in numbers if x % 2 == 0]
# [2, 4, 6, 8, 10]

# 过滤并转换
words = ["hello", "world", "python", "code"]
long_upper = [word.upper() for word in words if len(word) > 4]
# ['HELLO', 'WORLD', 'PYTHON']

# 多个条件
values = range(20)
filtered = [x for x in values if x % 2 == 0 if x % 3 == 0]
# [0, 6, 12, 18]（同时能被 2 和 3 整除）
```

### 条件表达式（if-else）

```python
# 表达式中的 if-else（不是过滤器）
numbers = [1, 2, 3, 4, 5]
labels = ["even" if x % 2 == 0 else "odd" for x in numbers]
# ['odd', 'even', 'odd', 'even', 'odd']

# 基于条件转换
prices = [10, 25, 5, 30, 15]
discounted = [price * 0.9 if price > 20 else price for price in prices]
# [10, 22.5, 5, 27.0, 15]

# 复杂条件逻辑
scores = [45, 67, 89, 92, 55, 78]
grades = [
    'A' if score >= 90
    else 'B' if score >= 80
    else 'C' if score >= 70
    else 'D' if score >= 60
    else 'F'
    for score in scores
]
# ['F', 'D', 'B', 'A', 'D', 'C']
```

### 使用多个可迭代对象

```python
# 使用 zip 配对元素
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
people = [f"{name} is {age}" for name, age in zip(names, ages)]
# ['Alice is 25', 'Bob is 30', 'Charlie is 35']

# 笛卡尔积
colors = ["red", "blue"]
sizes = ["S", "M", "L"]
products = [f"{color}-{size}" for color in colors for size in sizes]
# ['red-S', 'red-M', 'red-L', 'blue-S', 'blue-M', 'blue-L']

# 展平矩阵
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## 字典推导式

字典推导式使用与列表推导式类似的语法创建字典。

### 基本字典推导式

```python
# 从列表创建字典
keys = ["a", "b", "c"]
values = [1, 2, 3]
d = {k: v for k, v in zip(keys, values)}
# {'a': 1, 'b': 2, 'c': 3}

# 转换键和值
numbers = [1, 2, 3, 4, 5]
squares_dict = {x: x ** 2 for x in numbers}
# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# 字符串操作
words = ["hello", "world", "python"]
lengths = {word: len(word) for word in words}
# {'hello': 5, 'world': 5, 'python': 6}
```

### 过滤字典

```python
# 过滤现有字典
prices = {"apple": 0.5, "banana": 0.3, "orange": 0.8, "grape": 1.2}
expensive = {k: v for k, v in prices.items() if v > 0.5}
# {'orange': 0.8, 'grape': 1.2}

# 转换和过滤
data = {"a": 1, "b": 2, "c": 3, "d": 4, "e": 5}
filtered_squared = {k: v ** 2 for k, v in data.items() if v % 2 == 0}
# {'b': 4, 'd': 16}

# 大小写转换
original = {"Name": "Alice", "Age": 25, "City": "NYC"}
lowercase = {k.lower(): v for k, v in original.items()}
# {'name': 'Alice', 'age': 25, 'city': 'NYC'}
```

### 高级字典模式

```python
# 交换键和值
original = {"a": 1, "b": 2, "c": 3}
swapped = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b', 3: 'c'}

# 按属性分组
words = ["apple", "banana", "avocado", "blueberry", "apricot"]
by_first_letter = {}
for word in words:
    first_letter = word[0]
    if first_letter not in by_first_letter:
        by_first_letter[first_letter] = []
    by_first_letter[first_letter].append(word)

# 使用字典推导式和 setdefault
by_first = {
    letter: [w for w in words if w[0] == letter]
    for letter in set(w[0] for w in words)
}
# {'a': ['apple', 'avocado', 'apricot'], 'b': ['banana', 'blueberry']}

# 带转换的合并字典
dict1 = {"a": 1, "b": 2}
dict2 = {"c": 3, "d": 4}
merged = {k: v * 10 for d in [dict1, dict2] for k, v in d.items()}
# {'a': 10, 'b': 20, 'c': 30, 'd': 40}
```

### 嵌套字典推导式

```python
# 创建嵌套字典
matrix_dict = {
    i: {j: i * j for j in range(1, 4)}
    for i in range(1, 4)
}
# {1: {1: 1, 2: 2, 3: 3}, 2: {1: 2, 2: 4, 3: 6}, 3: {1: 3, 2: 6, 3: 9}}

# 转换嵌套结构
data = {
    "user1": {"name": "Alice", "age": 25},
    "user2": {"name": "Bob", "age": 30}
}
names_only = {k: v["name"] for k, v in data.items()}
# {'user1': 'Alice', 'user2': 'Bob'}
```

## 集合推导式

集合推导式创建集合，自动处理唯一性。

### 基本集合推导式

```python
# 带转换的去重
numbers = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
unique_squares = {x ** 2 for x in numbers}
# {1, 4, 9, 16}

# 提取唯一字符
words = ["hello", "world"]
unique_chars = {char for word in words for char in word}
# {'h', 'e', 'l', 'o', 'w', 'r', 'd'}

# 过滤和去重
values = [1, -2, 3, -4, 5, -6, 2, 3]
positive_unique = {x for x in values if x > 0}
# {1, 2, 3, 5}
```

### 高级集合操作

```python
# 从邮箱提取域名
emails = ["alice@gmail.com", "bob@yahoo.com", "charlie@gmail.com"]
domains = {email.split("@")[1] for email in emails}
# {'gmail.com', 'yahoo.com'}

# 找出唯一的单词长度
text = "the quick brown fox jumps over the lazy dog"
word_lengths = {len(word) for word in text.split()}
# {3, 5, 4}（唯一的长度）

# 条件集合推导式
numbers = range(20)
special = {x for x in numbers if x % 2 == 0 and x % 3 == 0}
# {0, 6, 12, 18}
```

## 生成器表达式

生成器表达式与列表推导式类似，但创建生成器而不是列表，为大型数据集提供内存效率。

### 基本生成器表达式

```python
# 语法：使用圆括号代替方括号
squares_gen = (x ** 2 for x in range(10))
# <generator object>

# 遍历生成器
for square in squares_gen:
    print(square)  # 打印 0, 1, 4, 9, ...

# 转换为列表
squares_list = list(x ** 2 for x in range(10))
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 在函数中使用
sum_of_squares = sum(x ** 2 for x in range(100))
# 328350

max_value = max(x * 2 for x in [1, 5, 3, 9, 2])
# 18
```

### 内存效率比较

```python
import sys

# 列表推导式 - 在内存中创建完整列表
list_comp = [x ** 2 for x in range(1000000)]
print(sys.getsizeof(list_comp))  # ~8000000 字节

# 生成器表达式 - 按需创建项目
gen_expr = (x ** 2 for x in range(1000000))
print(sys.getsizeof(gen_expr))  # ~112 字节

# 生成器在迭代后被消耗
gen = (x for x in range(5))
print(list(gen))  # [0, 1, 2, 3, 4]
print(list(gen))  # []（空 - 已被消耗）
```

### 实用生成器示例

```python
# 逐行处理大文件
def read_large_file(file_path):
    with open(file_path, 'r') as file:
        return (line.strip() for line in file)

# 链式生成器
numbers = range(1000000)
evens = (x for x in numbers if x % 2 == 0)
squares = (x ** 2 for x in evens)
# 内存高效的管道

# 无限生成器
def fibonacci_gen():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 与 itertools 一起使用
from itertools import islice
first_10_fibs = list(islice(fibonacci_gen(), 10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## 嵌套推导式

嵌套推导式处理多维数据结构。

### 矩阵操作

```python
# 创建矩阵
matrix = [[i * j for j in range(5)] for i in range(5)]
# [[0, 0, 0, 0, 0],
#  [0, 1, 2, 3, 4],
#  [0, 2, 4, 6, 8],
#  [0, 3, 6, 9, 12],
#  [0, 4, 8, 12, 16]]

# 矩阵转置
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]

# 展平嵌套列表
nested = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
flat = [item for sublist in nested for item in sublist]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 带条件的展平
nested_mixed = [[1, 2, 3], [4, 5], [6, 7, 8, 9]]
even_flat = [item for sublist in nested_mixed for item in sublist if item % 2 == 0]
# [2, 4, 6, 8]
```

### 复杂嵌套模式

```python
# 创建坐标对
coords = [
    (x, y)
    for x in range(3)
    for y in range(3)
    if x != y
]
# [(0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1)]

# 嵌套过滤
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
filtered_matrix = [
    [item for item in row if item % 2 == 0]
    for row in matrix
]
# [[2], [4, 6], [8]]

# 三层嵌套
cube = [
    [[i + j + k for k in range(2)]
     for j in range(2)]
    for i in range(2)
]
# [[[0, 1], [1, 2]], [[1, 2], [2, 3]]]
```

### 嵌套字典和集合推导式

```python
# 从矩阵创建嵌套字典
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
matrix_dict = {
    i: {j: matrix[i][j] for j in range(len(matrix[i]))}
    for i in range(len(matrix))
}
# {0: {0: 1, 1: 2, 2: 3}, 1: {0: 4, 1: 5, 2: 6}, 2: {0: 7, 1: 8, 2: 9}}

# 从嵌套迭代创建元组集合
pairs = {
    (x, y)
    for x in range(1, 4)
    for y in range(1, 4)
    if x < y
}
# {(1, 2), (1, 3), (2, 3)}
```

## 高级模式

### 推导式中的海象运算符（Python 3.8+）

```python
# 使用赋值表达式
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
filtered = [y for x in data if (y := x ** 2) > 20]
# [25, 36, 49, 64, 81, 100]

# 避免重复计算
import math
numbers = [1, 4, 9, 16, 25]
results = [sqrt for x in numbers if (sqrt := math.sqrt(x)) > 2]
# [3.0, 4.0, 5.0]

# 带转换的过滤
texts = ["hello", "world", "python", "code"]
upper_long = [u for text in texts if len(u := text.upper()) > 4]
# ['HELLO', 'WORLD', 'PYTHON']
```

### 复杂过滤

```python
# 多重谓词
def is_prime(n):
    if n < 2:
        return False
    return all(n % i != 0 for i in range(2, int(n ** 0.5) + 1))

primes = [x for x in range(100) if is_prime(x)]
# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, ...]

# 使用外部数据过滤
valid_ids = {1, 3, 5, 7, 9}
data = [{"id": i, "value": i * 10} for i in range(10)]
filtered_data = [item for item in data if item["id"] in valid_ids]
# [{'id': 1, 'value': 10}, {'id': 3, 'value': 30}, ...]

# 正则表达式过滤
import re
texts = ["hello@gmail.com", "invalid", "test@yahoo.com", "also-invalid"]
emails = [t for t in texts if re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', t)]
# ['hello@gmail.com', 'test@yahoo.com']
```

### 推导式中的 enumerate 和 zip

```python
# 推导式中的 enumerate
words = ["apple", "banana", "cherry"]
indexed = {i: word for i, word in enumerate(words)}
# {0: 'apple', 1: 'banana', 2: 'cherry'}

# 按索引过滤
items = ["a", "b", "c", "d", "e"]
odd_indexed = [item for i, item in enumerate(items) if i % 2 != 0]
# ['b', 'd']

# zip 多个可迭代对象
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
cities = ["NYC", "LA", "Chicago"]
people = [
    {"name": n, "age": a, "city": c}
    for n, a, c in zip(names, ages, cities)
]
# [{'name': 'Alice', 'age': 25, 'city': 'NYC'}, ...]
```

## 性能考虑

### 列表推导式 vs 循环

```python
import timeit

# 列表推导式（更快）
def comp():
    return [x ** 2 for x in range(1000)]

# 传统循环（较慢）
def loop():
    result = []
    for x in range(1000):
        result.append(x ** 2)
    return result

# 基准测试
comp_time = timeit.timeit(comp, number=10000)
loop_time = timeit.timeit(loop, number=10000)
print(f"推导式: {comp_time:.4f}s")
print(f"循环: {loop_time:.4f}s")
# 推导式通常快 20-30%
```

### 内存考虑

```python
# 列表推导式 - 全部在内存中
big_list = [x for x in range(1000000)]  # 使用 ~8MB

# 生成器表达式 - 惰性求值
big_gen = (x for x in range(1000000))   # 使用 ~112 字节

# 对大型数据集使用生成器
def process_large_data():
    # 好：内存高效
    for item in (x ** 2 for x in range(1000000)):
        if item > 1000:
            return item

    # 不好：创建完整列表
    all_items = [x ** 2 for x in range(1000000)]
    for item in all_items:
        if item > 1000:
            return item
```

### 何时使用什么

```python
# 使用列表推导式当：
# - 需要多次迭代
# - 需要随机访问
# - 数据集较小/中等
numbers = [x ** 2 for x in range(100)]
print(numbers[50])  # 随机访问
print(sum(numbers))  # 多次迭代

# 使用生成器当：
# - 单次迭代
# - 大型数据集
# - 内存受限
total = sum(x ** 2 for x in range(1000000))

# 使用普通循环当：
# - 复杂逻辑
# - 需要多个语句
# - 更好的可读性
result = []
for x in range(10):
    if x % 2 == 0:
        temp = x ** 2
        if temp > 20:
            result.append(temp)
            print(f"添加了 {temp}")
```

### 优化技巧

```python
# 尽可能预计算
# 不好：重复函数调用
results = [expensive_function(x) for x in data for y in range(100)]

# 好：计算一次
computed = expensive_function(data)
results = [computed[x] for x in range(len(computed)) for y in range(100)]

# 使用集合进行成员测试
# 不好：O(n) 在列表中查找
valid = [1, 2, 3, 4, 5]
filtered = [x for x in range(1000) if x in valid]

# 好：O(1) 在集合中查找
valid = {1, 2, 3, 4, 5}
filtered = [x for x in range(1000) if x in valid]

# 对复杂逻辑避免嵌套推导式
# 不好：难以阅读
result = [y for x in data if condition(x) for y in process(x) if validate(y)]

# 好：分步骤
intermediate = [x for x in data if condition(x)]
processed = [process(x) for x in intermediate]
result = [y for p in processed for y in p if validate(y)]
```

## 最佳实践

### 可读性指南

```python
# 推荐：简单清晰
squares = [x ** 2 for x in range(10)]

# 推荐：单个条件
evens = [x for x in range(10) if x % 2 == 0]

# 考虑使用循环：复杂逻辑
result = []
for x in data:
    if complex_condition(x):
        processed = expensive_operation(x)
        if another_condition(processed):
            result.append(transform(processed))

# 不推荐：过于复杂
result = [
    transform(processed)
    for x in data
    if complex_condition(x)
    for processed in [expensive_operation(x)]
    if another_condition(processed)
]
```

### 行长度和格式化

```python
# 简单推导式单行
squares = [x ** 2 for x in range(10)]

# 多行以提高可读性
long_result = [
    process_item(item)
    for item in large_collection
    if meets_criteria(item)
]

# 嵌套推导式
matrix = [
    [i * j for j in range(cols)]
    for i in range(rows)
]
```

### 带类型提示的推导式

```python
from typing import List, Dict, Set

def get_squares(n: int) -> List[int]:
    return [x ** 2 for x in range(n)]

def word_lengths(words: List[str]) -> Dict[str, int]:
    return {word: len(word) for word in words}

def unique_chars(text: str) -> Set[str]:
    return {char for char in text if char.isalpha()}
```

### 常见陷阱

```python
# 陷阱1：在迭代时修改列表
numbers = [1, 2, 3, 4, 5]
# 不好：不要在推导式中修改原列表
# doubled = [numbers.pop() * 2 for x in numbers]  # 不可预测

# 好：创建新列表
doubled = [x * 2 for x in numbers]

# 陷阱2：推导式中的副作用
# 不好：推导式是用于转换的，不是用于副作用
# [print(x) for x in range(10)]  # 可以工作但模式错误

# 好：对副作用使用普通循环
for x in range(10):
    print(x)

# 陷阱3：过度使用推导式
# 不好：损害可读性
result = [[i+j for j in range(5) if j % 2 == 0] for i in range(10) if i > 5]

# 好：分解或使用循环
result = []
for i in range(10):
    if i > 5:
        row = [i + j for j in range(5) if j % 2 == 0]
        result.append(row)
```

## 实用示例

### 数据处理

```python
# 类似 CSV 的数据转换
raw_data = [
    "Alice,25,NYC",
    "Bob,30,LA",
    "Charlie,35,Chicago"
]

people = [
    {
        "name": parts[0],
        "age": int(parts[1]),
        "city": parts[2]
    }
    for line in raw_data
    if (parts := line.split(","))
]

# 过滤和聚合
sales = [
    {"product": "A", "amount": 100},
    {"product": "B", "amount": 200},
    {"product": "A", "amount": 150},
    {"product": "B", "amount": 250}
]

high_sales = [
    sale for sale in sales
    if sale["amount"] > 150
]

total_by_product = {
    product: sum(s["amount"] for s in sales if s["product"] == product)
    for product in {s["product"] for s in sales}
}
```

### 文本处理

```python
# 词频统计
text = "the quick brown fox jumps over the lazy dog"
word_freq = {
    word: text.split().count(word)
    for word in set(text.split())
}

# 提取 URL
import re
html = "Visit https://example.com and http://test.org"
urls = [
    match.group()
    for match in re.finditer(r'https?://[^\s]+', html)
]

# 清理和规范化
messy_data = ["  HELLO  ", "world", "  PYTHON  "]
cleaned = [item.strip().lower() for item in messy_data]
```

### 数学运算

```python
# 向量运算
v1 = [1, 2, 3]
v2 = [4, 5, 6]
dot_product = sum(a * b for a, b in zip(v1, v2))

# 矩阵乘法
A = [[1, 2], [3, 4]]
B = [[5, 6], [7, 8]]
result = [
    [sum(a * b for a, b in zip(row, col)) for col in zip(*B)]
    for row in A
]

# 统计计算
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
mean = sum(data) / len(data)
variance = sum((x - mean) ** 2 for x in data) / len(data)
std_dev = variance ** 0.5
```

## 总结

列表推导式及其变体（字典、集合、生成器）是 Python 中的强大工具，可以促进简洁、可读和高效的代码。关键要点：

- **使用推导式**进行简单的转换和过滤
- **使用生成器**处理大型数据集以节省内存
- **使用普通循环**处理复杂逻辑或副作用
- **保持推导式可读** - 如果太复杂，使用循环
- **考虑性能** - 推导式通常更快，但并非总是必要的

掌握这些模式可以编写更 Pythonic 的代码，并有效地利用 Python 的表达能力。
