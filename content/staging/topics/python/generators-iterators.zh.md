---
title: Python 生成器与迭代器
description: 深入理解 Python 迭代器协议、生成器函数、yield 与 itertools
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 生成器
  - 迭代器
  - yield
status: imported
origin: old/src/content/docs/python/generators-iterators.zh.md
divergence: 0.239
issues: []
legacy:
  category: Python
  subcategory: 函数式编程
  order: 9
  lastUpdated: 2026-01-07
---

生成器和迭代器是 Python 中强大的特性,用于高效处理序列数据。它们支持惰性求值,节省内存,特别适合处理大数据集或无限序列。

## 迭代器协议

迭代器协议定义了两个方法:`__iter__()` 和 `__next__()`。

### 基本概念

```python
# 可迭代对象(Iterable)与迭代器(Iterator)的区别
numbers = [1, 2, 3, 4, 5]  # 可迭代对象

# 获取迭代器
iterator = iter(numbers)  # 调用 __iter__() 方法

# 使用迭代器
print(next(iterator))  # 1
print(next(iterator))  # 2
print(next(iterator))  # 3

# 迭代器耗尽后会抛出 StopIteration
try:
    while True:
        print(next(iterator))
except StopIteration:
    print("迭代器已耗尽")
```

### 迭代器的特性

```python
# 迭代器是一次性的
my_list = [1, 2, 3]
it = iter(my_list)

# 第一次迭代
for num in it:
    print(num)  # 1, 2, 3

# 第二次迭代 - 不会输出任何内容
for num in it:
    print(num)  # 无输出

# 迭代器本身是可迭代的
it = iter([1, 2, 3])
print(iter(it) is it)  # True - 迭代器的 __iter__() 返回自身

# 手动迭代
it = iter([10, 20, 30])
while True:
    try:
        value = next(it)
        print(value)
    except StopIteration:
        break
```

## 创建自定义迭代器

通过实现迭代器协议创建自定义迭代器类。

### 简单迭代器

```python
class Counter:
    """计数器迭代器"""
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.end:
            raise StopIteration
        self.current += 1
        return self.current - 1

# 使用自定义迭代器
counter = Counter(1, 5)
for num in counter:
    print(num)  # 1, 2, 3, 4

# 手动迭代
counter = Counter(10, 13)
print(next(counter))  # 10
print(next(counter))  # 11
print(next(counter))  # 12
```

### 斐波那契数列迭代器

```python
class Fibonacci:
    """生成斐波那契数列的迭代器"""
    def __init__(self, max_count=None):
        self.max_count = max_count
        self.count = 0
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self):
        if self.max_count is not None and self.count >= self.max_count:
            raise StopIteration

        self.count += 1
        self.a, self.b = self.b, self.a + self.b
        return self.a

# 生成前 10 个斐波那契数
fib = Fibonacci(10)
print(list(fib))  # [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

# 无限斐波那契数列
fib_infinite = Fibonacci()
for i, num in enumerate(fib_infinite):
    if i >= 5:
        break
    print(num)  # 1, 1, 2, 3, 5
```

### 文件行迭代器

```python
class FileLineIterator:
    """逐行读取文件的迭代器"""
    def __init__(self, filename):
        self.filename = filename
        self.file = None

    def __iter__(self):
        self.file = open(self.filename, 'r', encoding='utf-8')
        return self

    def __next__(self):
        if self.file is None:
            raise StopIteration

        line = self.file.readline()
        if not line:
            self.file.close()
            raise StopIteration

        return line.strip()

    def __del__(self):
        if self.file and not self.file.closed:
            self.file.close()

# 使用示例
# for line in FileLineIterator('data.txt'):
#     print(line)
```

## 生成器函数

生成器函数使用 `yield` 关键字,自动实现迭代器协议,语法更简洁。

### 基本生成器

```python
def simple_generator():
    """简单生成器示例"""
    print("开始生成")
    yield 1
    print("继续生成")
    yield 2
    print("最后生成")
    yield 3
    print("生成结束")

# 使用生成器
gen = simple_generator()
print(type(gen))  # <class 'generator'>

print(next(gen))  # 开始生成 -> 1
print(next(gen))  # 继续生成 -> 2
print(next(gen))  # 最后生成 -> 3
# print(next(gen))  # 生成结束 -> StopIteration
```

### 计数器生成器

```python
def counter(start, end):
    """计数器生成器"""
    current = start
    while current < end:
        yield current
        current += 1

# 使用生成器
for num in counter(1, 5):
    print(num)  # 1, 2, 3, 4

# 生成器可以转换为列表
numbers = list(counter(10, 15))
print(numbers)  # [10, 11, 12, 13, 14]
```

### 斐波那契生成器

```python
def fibonacci(max_count=None):
    """斐波那契数列生成器"""
    a, b = 0, 1
    count = 0

    while max_count is None or count < max_count:
        a, b = b, a + b
        yield a
        count += 1

# 生成前 10 个数
print(list(fibonacci(10)))

# 使用生成器进行惰性求值
fib_gen = fibonacci()
for i, num in enumerate(fib_gen):
    if i >= 5:
        break
    print(num)
```

### 素数生成器

```python
def is_prime(n):
    """判断是否为素数"""
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

def prime_generator(max_num=None):
    """生成素数的生成器"""
    num = 2
    while max_num is None or num <= max_num:
        if is_prime(num):
            yield num
        num += 1

# 生成小于 30 的所有素数
primes = list(prime_generator(30))
print(primes)  # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

# 生成前 10 个素数
prime_gen = prime_generator()
first_ten = [next(prime_gen) for _ in range(10)]
print(first_ten)  # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```

## yield 关键字

`yield` 关键字使函数变成生成器,支持暂停和恢复执行。

### yield 的工作原理

```python
def demo_yield():
    """演示 yield 的执行流程"""
    print("第一次执行")
    value1 = yield 1
    print(f"接收到: {value1}")

    print("第二次执行")
    value2 = yield 2
    print(f"接收到: {value2}")

    print("第三次执行")
    yield 3

# 基本使用
gen = demo_yield()
print(next(gen))  # 第一次执行 -> 1
print(next(gen))  # 接收到: None, 第二次执行 -> 2
print(next(gen))  # 接收到: None, 第三次执行 -> 3

# 使用 send() 发送值
gen = demo_yield()
print(gen.send(None))  # 第一次必须发送 None -> 1
print(gen.send("Hello"))  # 接收到: Hello, 第二次执行 -> 2
print(gen.send("World"))  # 接收到: World, 第三次执行 -> 3
```

### 生成器方法

```python
def generator_methods():
    """演示生成器的各种方法"""
    try:
        for i in range(10):
            received = yield i
            if received:
                print(f"接收到: {received}")
    except GeneratorExit:
        print("生成器被关闭")
    finally:
        print("清理资源")

# send() - 发送值到生成器
gen = generator_methods()
print(next(gen))  # 0
print(gen.send("测试"))  # 接收到: 测试 -> 1

# throw() - 在生成器中抛出异常
gen = generator_methods()
next(gen)
try:
    gen.throw(ValueError, "错误消息")
except ValueError as e:
    print(f"捕获异常: {e}")

# close() - 关闭生成器
gen = generator_methods()
next(gen)
gen.close()  # 生成器被关闭, 清理资源
```

### 双向通信生成器

```python
def running_average():
    """计算移动平均值的生成器"""
    total = 0
    count = 0
    average = None

    while True:
        value = yield average
        total += value
        count += 1
        average = total / count

# 使用生成器计算平均值
avg_gen = running_average()
next(avg_gen)  # 启动生成器

print(avg_gen.send(10))  # 10.0
print(avg_gen.send(20))  # 15.0
print(avg_gen.send(30))  # 20.0
print(avg_gen.send(40))  # 25.0
```

### 协程式生成器

```python
def grep_generator(pattern):
    """搜索包含特定模式的行"""
    print(f"开始搜索包含 '{pattern}' 的行")
    while True:
        line = yield
        if pattern in line:
            print(f"找到匹配: {line}")

# 使用协程
grep = grep_generator("Python")
next(grep)  # 启动协程

grep.send("我喜欢 Python")  # 找到匹配: 我喜欢 Python
grep.send("Java 也不错")  # 无输出
grep.send("Python 很强大")  # 找到匹配: Python 很强大
```

## yield from 表达式

`yield from` 用于委托给另一个生成器或可迭代对象。

### 基本用法

```python
def sub_generator():
    """子生成器"""
    yield 1
    yield 2
    yield 3

def main_generator_without_yield_from():
    """不使用 yield from"""
    for value in sub_generator():
        yield value

def main_generator_with_yield_from():
    """使用 yield from"""
    yield from sub_generator()

# 两者效果相同
print(list(main_generator_without_yield_from()))  # [1, 2, 3]
print(list(main_generator_with_yield_from()))  # [1, 2, 3]
```

### 链接多个生成器

```python
def gen1():
    yield from range(1, 4)

def gen2():
    yield from range(4, 7)

def gen3():
    yield from range(7, 10)

def chain_generators():
    """链接多个生成器"""
    yield from gen1()
    yield from gen2()
    yield from gen3()

print(list(chain_generators()))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### 扁平化嵌套结构

```python
def flatten(nested_list):
    """递归扁平化嵌套列表"""
    for item in nested_list:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item

# 扁平化嵌套列表
nested = [1, [2, 3, [4, 5]], 6, [7, [8, 9]]]
flat = list(flatten(nested))
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 更复杂的例子
complex_nested = [1, [2, [3, [4, [5]]]]]
print(list(flatten(complex_nested)))  # [1, 2, 3, 4, 5]
```

### 树遍历

```python
class TreeNode:
    """树节点类"""
    def __init__(self, value, children=None):
        self.value = value
        self.children = children or []

def traverse_tree(node):
    """深度优先遍历树"""
    yield node.value
    for child in node.children:
        yield from traverse_tree(child)

# 构建树结构
tree = TreeNode(1, [
    TreeNode(2, [
        TreeNode(4),
        TreeNode(5)
    ]),
    TreeNode(3, [
        TreeNode(6),
        TreeNode(7, [
            TreeNode(8)
        ])
    ])
])

# 遍历树
print(list(traverse_tree(tree)))  # [1, 2, 4, 5, 3, 6, 7, 8]
```

### yield from 的返回值

```python
def sub_gen():
    """子生成器,返回值"""
    yield 1
    yield 2
    return "子生成器完成"

def main_gen():
    """主生成器,接收返回值"""
    result = yield from sub_gen()
    print(f"接收到返回值: {result}")
    yield 3

# 使用生成器
gen = main_gen()
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # 接收到返回值: 子生成器完成 -> 3
```

## 生成器表达式

生成器表达式是创建生成器的简洁语法,类似列表推导式但使用圆括号。

### 基本语法

```python
# 列表推导式 - 立即创建整个列表
squares_list = [x**2 for x in range(10)]
print(type(squares_list))  # <class 'list'>
print(squares_list)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 生成器表达式 - 惰性求值
squares_gen = (x**2 for x in range(10))
print(type(squares_gen))  # <class 'generator'>
print(list(squares_gen))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

### 内存效率对比

```python
import sys

# 列表推导式 - 占用大量内存
large_list = [x for x in range(1000000)]
print(f"列表大小: {sys.getsizeof(large_list)} 字节")

# 生成器表达式 - 占用很小内存
large_gen = (x for x in range(1000000))
print(f"生成器大小: {sys.getsizeof(large_gen)} 字节")

# 输出:
# 列表大小: 8000056 字节
# 生成器大小: 128 字节
```

### 条件过滤

```python
# 偶数生成器
evens = (x for x in range(20) if x % 2 == 0)
print(list(evens))  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# 多条件过滤
numbers = (x for x in range(50) if x % 2 == 0 if x % 3 == 0)
print(list(numbers))  # [0, 6, 12, 18, 24, 30, 36, 42, 48]

# 字符串处理
text = "Hello World Python"
uppercase = (char.upper() for char in text if char.isalpha())
print(''.join(uppercase))  # HELLOWORLDPYTHON
```

### 嵌套生成器表达式

```python
# 笛卡尔积
pairs = ((x, y) for x in range(3) for y in range(3))
print(list(pairs))
# [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]

# 矩阵扁平化
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = (num for row in matrix for num in row)
print(list(flattened))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 条件笛卡尔积
valid_pairs = ((x, y) for x in range(5) for y in range(5) if x + y == 5)
print(list(valid_pairs))  # [(0, 5), (1, 4), (2, 3), (3, 2), (4, 1)]
```

### 实用示例

```python
# 文件处理
def read_large_file(filename):
    """使用生成器读取大文件"""
    with open(filename, 'r', encoding='utf-8') as f:
        return (line.strip() for line in f)

# 数据转换管道
numbers = range(1, 11)
squared = (x**2 for x in numbers)
filtered = (x for x in squared if x > 20)
print(list(filtered))  # [25, 36, 49, 64, 81, 100]

# 逐行处理日志
def process_log_lines(filename):
    """处理日志文件"""
    with open(filename, 'r', encoding='utf-8') as f:
        # 过滤空行和注释
        lines = (line.strip() for line in f if line.strip() and not line.startswith('#'))
        # 提取错误信息
        errors = (line for line in lines if 'ERROR' in line)
        return errors

# 无限序列
def infinite_sequence():
    """无限序列生成器"""
    num = 0
    while True:
        yield num
        num += 1

# 取前 10 个
seq = infinite_sequence()
first_ten = [next(seq) for _ in range(10)]
print(first_ten)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## itertools 模块

`itertools` 提供了强大的迭代器工具,用于高效的迭代操作。

### 无限迭代器

```python
import itertools

# count() - 无限计数
counter = itertools.count(start=10, step=2)
print([next(counter) for _ in range(5)])  # [10, 12, 14, 16, 18]

# cycle() - 循环迭代
colors = itertools.cycle(['红', '绿', '蓝'])
print([next(colors) for _ in range(7)])  # ['红', '绿', '蓝', '红', '绿', '蓝', '红']

# repeat() - 重复元素
repeater = itertools.repeat('Python', 3)
print(list(repeater))  # ['Python', 'Python', 'Python']

# repeat 配合 map
squares = list(map(pow, range(5), itertools.repeat(2)))
print(squares)  # [0, 1, 4, 9, 16]
```

### 组合迭代器

```python
import itertools

# chain() - 连接多个迭代器
chain1 = itertools.chain([1, 2], [3, 4], [5, 6])
print(list(chain1))  # [1, 2, 3, 4, 5, 6]

# chain.from_iterable() - 从嵌套序列创建链
chain2 = itertools.chain.from_iterable([[1, 2], [3, 4], [5, 6]])
print(list(chain2))  # [1, 2, 3, 4, 5, 6]

# compress() - 根据选择器过滤
data = ['A', 'B', 'C', 'D', 'E']
selectors = [1, 0, 1, 0, 1]
filtered = itertools.compress(data, selectors)
print(list(filtered))  # ['A', 'C', 'E']

# dropwhile() - 删除满足条件的前缀
numbers = [1, 3, 5, 7, 2, 4, 6]
result = itertools.dropwhile(lambda x: x < 5, numbers)
print(list(result))  # [5, 7, 2, 4, 6]

# takewhile() - 保留满足条件的前缀
numbers = [1, 3, 5, 7, 2, 4, 6]
result = itertools.takewhile(lambda x: x < 5, numbers)
print(list(result))  # [1, 3]

# filterfalse() - 过滤不满足条件的元素
numbers = range(10)
odds = itertools.filterfalse(lambda x: x % 2 == 0, numbers)
print(list(odds))  # [1, 3, 5, 7, 9]

# islice() - 切片迭代器
numbers = itertools.count()
first_ten = itertools.islice(numbers, 10)
print(list(first_ten))  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 跳过前 5 个,取接下来的 5 个
numbers = range(20)
sliced = itertools.islice(numbers, 5, 10)
print(list(sliced))  # [5, 6, 7, 8, 9]
```

### 排列组合

```python
import itertools

# product() - 笛卡尔积
colors = ['红', '蓝']
sizes = ['S', 'M', 'L']
products = itertools.product(colors, sizes)
print(list(products))
# [('红', 'S'), ('红', 'M'), ('红', 'L'), ('蓝', 'S'), ('蓝', 'M'), ('蓝', 'L')]

# 自身笛卡尔积
pairs = itertools.product(range(3), repeat=2)
print(list(pairs))
# [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]

# permutations() - 排列
items = ['A', 'B', 'C']
perms = itertools.permutations(items, 2)
print(list(perms))
# [('A', 'B'), ('A', 'C'), ('B', 'A'), ('B', 'C'), ('C', 'A'), ('C', 'B')]

# 全排列
full_perms = itertools.permutations(items)
print(list(full_perms))
# [('A', 'B', 'C'), ('A', 'C', 'B'), ('B', 'A', 'C'),
#  ('B', 'C', 'A'), ('C', 'A', 'B'), ('C', 'B', 'A')]

# combinations() - 组合(不重复)
items = ['A', 'B', 'C', 'D']
combs = itertools.combinations(items, 2)
print(list(combs))
# [('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]

# combinations_with_replacement() - 组合(可重复)
combs_rep = itertools.combinations_with_replacement(['A', 'B', 'C'], 2)
print(list(combs_rep))
# [('A', 'A'), ('A', 'B'), ('A', 'C'), ('B', 'B'), ('B', 'C'), ('C', 'C')]
```

### 分组和累积

```python
import itertools

# groupby() - 分组
data = [
    {'name': '张三', 'age': 25},
    {'name': '李四', 'age': 25},
    {'name': '王五', 'age': 30},
    {'name': '赵六', 'age': 30},
]

# 按年龄分组(需要先排序)
sorted_data = sorted(data, key=lambda x: x['age'])
for age, group in itertools.groupby(sorted_data, key=lambda x: x['age']):
    print(f"年龄 {age}: {list(group)}")
# 年龄 25: [{'name': '张三', 'age': 25}, {'name': '李四', 'age': 25}]
# 年龄 30: [{'name': '王五', 'age': 30}, {'name': '赵六', 'age': 30}]

# 字符串分组
text = "aaabbcccdddd"
for char, group in itertools.groupby(text):
    print(f"{char}: {len(list(group))}")
# a: 3, b: 2, c: 3, d: 4

# accumulate() - 累积计算
numbers = [1, 2, 3, 4, 5]
accumulated = itertools.accumulate(numbers)
print(list(accumulated))  # [1, 3, 6, 10, 15]

# 使用自定义函数
import operator
accumulated_product = itertools.accumulate(numbers, operator.mul)
print(list(accumulated_product))  # [1, 2, 6, 24, 120]

# 计算最大值序列
numbers = [5, 2, 8, 3, 9, 1]
max_sequence = itertools.accumulate(numbers, max)
print(list(max_sequence))  # [5, 5, 8, 8, 9, 9]
```

### 其他实用迭代器

```python
import itertools

# tee() - 复制迭代器
original = iter([1, 2, 3, 4, 5])
it1, it2, it3 = itertools.tee(original, 3)

print(list(it1))  # [1, 2, 3, 4, 5]
print(list(it2))  # [1, 2, 3, 4, 5]
print(list(it3))  # [1, 2, 3, 4, 5]

# zip_longest() - 补齐最长序列
from itertools import zip_longest

list1 = [1, 2, 3]
list2 = ['a', 'b', 'c', 'd', 'e']
zipped = zip_longest(list1, list2, fillvalue=0)
print(list(zipped))
# [(1, 'a'), (2, 'b'), (3, 'c'), (0, 'd'), (0, 'e')]

# starmap() - 解包参数
pairs = [(2, 5), (3, 2), (10, 3)]
powers = itertools.starmap(pow, pairs)
print(list(powers))  # [32, 9, 1000]

# 等价于:
powers_manual = [pow(x, y) for x, y in pairs]
print(powers_manual)  # [32, 9, 1000]

# pairwise() - 成对迭代 (Python 3.10+)
# data = [1, 2, 3, 4, 5]
# pairs = itertools.pairwise(data)
# print(list(pairs))  # [(1, 2), (2, 3), (3, 4), (4, 5)]
```

### 实际应用示例

```python
import itertools

# 滑动窗口
def sliding_window(iterable, n):
    """创建大小为 n 的滑动窗口"""
    iterators = itertools.tee(iterable, n)
    for i, it in enumerate(iterators):
        for _ in range(i):
            next(it, None)
    return zip(*iterators)

data = [1, 2, 3, 4, 5, 6]
windows = sliding_window(data, 3)
print(list(windows))  # [(1, 2, 3), (2, 3, 4), (3, 4, 5), (4, 5, 6)]

# 批处理数据
def batch_data(iterable, batch_size):
    """将数据分批处理"""
    iterator = iter(iterable)
    while True:
        batch = list(itertools.islice(iterator, batch_size))
        if not batch:
            break
        yield batch

data = range(10)
for batch in batch_data(data, 3):
    print(batch)
# [0, 1, 2]
# [3, 4, 5]
# [6, 7, 8]
# [9]

# 唯一元素生成器
def unique_everseen(iterable, key=None):
    """保持顺序的去重"""
    seen = set()
    seen_add = seen.add
    if key is None:
        for element in itertools.filterfalse(seen.__contains__, iterable):
            seen_add(element)
            yield element
    else:
        for element in iterable:
            k = key(element)
            if k not in seen:
                seen_add(k)
                yield element

data = [1, 2, 3, 2, 4, 1, 5, 3]
print(list(unique_everseen(data)))  # [1, 2, 3, 4, 5]

# 轮询调度
def roundrobin(*iterables):
    """轮流从多个迭代器中取值"""
    num_active = len(iterables)
    nexts = itertools.cycle(iter(it).__next__ for it in iterables)
    while num_active:
        try:
            for next_func in nexts:
                yield next_func()
        except StopIteration:
            num_active -= 1
            nexts = itertools.cycle(itertools.islice(nexts, num_active))

result = roundrobin('ABC', '12', 'xyz')
print(list(result))  # ['A', '1', 'x', 'B', '2', 'y', 'C', 'z']

# 分块读取
def chunked(iterable, n):
    """将迭代器分成固定大小的块"""
    it = iter(iterable)
    while True:
        chunk = tuple(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk

data = range(10)
for chunk in chunked(data, 3):
    print(chunk)
# (0, 1, 2)
# (3, 4, 5)
# (6, 7, 8)
# (9,)
```

## 最佳实践

### 选择合适的工具

```python
# 不推荐: 使用列表处理大数据
def process_large_file_bad(filename):
    with open(filename) as f:
        lines = f.readlines()  # 一次性读入内存
        return [line.strip().upper() for line in lines]

# 推荐: 使用生成器
def process_large_file_good(filename):
    with open(filename) as f:
        for line in f:  # 逐行读取
            yield line.strip().upper()

# 推荐: 使用生成器表达式
def process_large_file_better(filename):
    with open(filename) as f:
        return (line.strip().upper() for line in f)
```

### 避免多次迭代生成器

```python
# 错误示例
gen = (x**2 for x in range(10))
print(list(gen))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
print(list(gen))  # [] - 生成器已耗尽!

# 正确做法: 使用 itertools.tee
import itertools
gen = (x**2 for x in range(10))
gen1, gen2 = itertools.tee(gen, 2)
print(list(gen1))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
print(list(gen2))  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 或者: 转换为列表
gen = (x**2 for x in range(10))
data = list(gen)
print(data)  # 可多次使用
print(data)  # 可多次使用
```

### 生成器的异常处理

```python
def safe_generator(data):
    """带异常处理的生成器"""
    try:
        for item in data:
            if item < 0:
                raise ValueError(f"负数不允许: {item}")
            yield item * 2
    except ValueError as e:
        print(f"错误: {e}")
        return
    finally:
        print("生成器清理")

# 使用
data = [1, 2, 3, -1, 5]
gen = safe_generator(data)
print(list(gen))
# 错误: 负数不允许: -1
# 生成器清理
# [2, 4, 6]
```

### 生成器链式调用

```python
def pipeline_example():
    """生成器管道处理数据"""
    # 数据源
    def read_data():
        for i in range(100):
            yield i

    # 过滤器1: 只要偶数
    def filter_even(numbers):
        for n in numbers:
            if n % 2 == 0:
                yield n

    # 过滤器2: 只要能被3整除的
    def filter_divisible_by_3(numbers):
        for n in numbers:
            if n % 3 == 0:
                yield n

    # 转换器: 平方
    def square(numbers):
        for n in numbers:
            yield n ** 2

    # 构建管道
    data = read_data()
    data = filter_even(data)
    data = filter_divisible_by_3(data)
    data = square(data)

    return list(data)

result = pipeline_example()
print(result)  # [0, 36, 144, 324, 576, 900, 1296, 1764, 2304, 2916, ...]
```

### 内存效率对比

```python
import sys
import time

# 列表方式
def sum_squares_list(n):
    return sum([x**2 for x in range(n)])

# 生成器方式
def sum_squares_gen(n):
    return sum(x**2 for x in range(n))

# 性能测试
n = 1000000

# 测试列表
start = time.time()
result1 = sum_squares_list(n)
time1 = time.time() - start

# 测试生成器
start = time.time()
result2 = sum_squares_gen(n)
time2 = time.time() - start

print(f"列表方式: {time1:.4f} 秒")
print(f"生成器方式: {time2:.4f} 秒")
print(f"结果相同: {result1 == result2}")

# 内存占用
list_obj = [x for x in range(10000)]
gen_obj = (x for x in range(10000))

print(f"\n列表内存: {sys.getsizeof(list_obj)} 字节")
print(f"生成器内存: {sys.getsizeof(gen_obj)} 字节")
```

### 实用生成器模式

```python
# 配置生成器返回值
def process_with_stats(data):
    """带统计信息的生成器"""
    count = 0
    total = 0

    for item in data:
        if item > 0:
            yield item
            count += 1
            total += item

    # 返回统计信息
    return {'count': count, 'total': total, 'average': total / count if count else 0}

# 获取返回值需要处理 StopIteration
gen = process_with_stats([1, 2, -1, 3, 4, -2, 5])
results = list(gen)
print(f"处理结果: {results}")  # [1, 2, 3, 4, 5]

# 上下文管理器生成器
from contextlib import contextmanager

@contextmanager
def timer_context(name):
    """计时上下文管理器"""
    start = time.time()
    print(f"{name} 开始")
    yield
    elapsed = time.time() - start
    print(f"{name} 完成,耗时 {elapsed:.4f} 秒")

# 使用
with timer_context("数据处理"):
    time.sleep(1)
    print("处理中...")

# 装饰器生成器
def coroutine(func):
    """自动启动协程的装饰器"""
    def wrapper(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)  # 自动启动
        return gen
    return wrapper

@coroutine
def accumulator():
    """累加器协程"""
    total = 0
    while True:
        value = yield total
        total += value

acc = accumulator()
print(acc.send(10))  # 10
print(acc.send(20))  # 30
print(acc.send(30))  # 60
```

### 常见陷阱

```python
# 陷阱 1: 生成器表达式中的闭包问题
# 错误
funcs = [(lambda: i) for i in range(5)]
print([f() for f in funcs])  # [4, 4, 4, 4, 4] - 错误!

# 正确
funcs = [(lambda i=i: i) for i in range(5)]
print([f() for f in funcs])  # [0, 1, 2, 3, 4] - 正确!

# 陷阱 2: 过早消耗生成器
def create_gen():
    return (x for x in range(5))

gen = create_gen()
print(3 in gen)  # True - 但消耗了前 4 个元素!
print(list(gen))  # [4] - 只剩最后一个!

# 陷阱 3: 在循环中修改生成器
data = [1, 2, 3, 4, 5]
gen = (x for x in data)
data.append(6)  # 修改原始数据
print(list(gen))  # [1, 2, 3, 4, 5, 6] - 生成器会看到修改!
```

## 总结

生成器和迭代器是 Python 中处理序列数据的强大工具:

1. **迭代器协议**: 通过 `__iter__()` 和 `__next__()` 实现自定义迭代器
2. **生成器函数**: 使用 `yield` 创建简洁的迭代器
3. **yield 关键字**: 支持暂停和恢复,实现协程
4. **yield from**: 委托给子生成器,简化代码
5. **生成器表达式**: 内存高效的惰性求值
6. **itertools**: 提供丰富的迭代器工具函数

选择合适的工具,可以编写出高效、优雅的 Python 代码。

## 参考资料

- [Python 官方文档 - 迭代器](https://docs.python.org/zh-cn/3/tutorial/classes.html#iterators)
- [Python 官方文档 - 生成器](https://docs.python.org/zh-cn/3/tutorial/classes.html#generators)
- [PEP 255 - Simple Generators](https://www.python.org/dev/peps/pep-0255/)
- [PEP 342 - Coroutines via Enhanced Generators](https://www.python.org/dev/peps/pep-0342/)
- [Python itertools 文档](https://docs.python.org/zh-cn/3/library/itertools.html)
