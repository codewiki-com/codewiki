---
title: Python map、filter、reduce 函数详解
description: 深入理解 Python 函数式编程三大核心工具：map、filter、reduce 的原理、用法、性能特点及最佳实践
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - map
  - filter
  - reduce
  - 函数式编程
  - 高阶函数
  - 迭代器
  - 列表推导式
status: imported
origin: old/src/content/docs/python/map-filter-reduce.zh.md
divergence: 0.21
issues: []
legacy:
  category: Python
  subcategory: 函数式编程
  order: 1
  lastUpdated: 2026-01-07
---

## 概念解释

`map`、`filter` 和 `reduce` 是 Python 函数式编程的三大核心高阶函数，它们源自函数式编程范式，在 Lisp、Haskell 等语言中有着悠久的历史。

**高阶函数**是指能够接受函数作为参数或返回函数的函数。这三个函数都接受一个函数和一个或多个可迭代对象作为参数，对数据进行转换、过滤或聚合操作。

- **map**: 将函数应用到可迭代对象的每个元素上，返回转换后的结果
- **filter**: 根据函数的返回值（真/假）筛选可迭代对象中的元素
- **reduce**: 将可迭代对象中的元素累积归约为单个值

这些函数体现了"声明式编程"的思想：我们描述"做什么"而非"怎么做"，让代码更加简洁、易读且不易出错。

```python
# 命令式编程：描述"怎么做"
squares = []
for x in range(10):
    squares.append(x ** 2)

# 声明式编程：描述"做什么"
squares = list(map(lambda x: x ** 2, range(10)))
```

## 核心原理

### map 函数的工作原理

`map(function, iterable, ...)` 返回一个迭代器，该迭代器将 `function` 应用于 `iterable` 的每个元素。

```python
# map 的等效实现
def my_map(func, *iterables):
    iterators = [iter(it) for it in iterables]
    while True:
        try:
            args = [next(it) for it in iterators]
            yield func(*args)
        except StopIteration:
            return
```

关键特性：
1. **惰性求值**：`map` 返回的是迭代器，不会立即计算所有结果
2. **多迭代器支持**：可以同时处理多个可迭代对象
3. **短路行为**：当最短的迭代器耗尽时停止

### filter 函数的工作原理

`filter(function, iterable)` 返回一个迭代器，只包含使 `function` 返回 `True` 的元素。

```python
# filter 的等效实现
def my_filter(func, iterable):
    for item in iterable:
        if func is None:
            if item:
                yield item
        elif func(item):
            yield item
```

关键特性：
1. **惰性求值**：同样返回迭代器
2. **None 函数**：当 `function` 为 `None` 时，过滤掉所有假值
3. **保持顺序**：结果保持原始顺序

### reduce 函数的工作原理

`functools.reduce(function, iterable[, initializer])` 将一个二元函数累积应用到序列的元素上，从左到右，将序列归约为单个值。

```python
# reduce 的等效实现
def my_reduce(func, iterable, initializer=None):
    it = iter(iterable)
    if initializer is None:
        try:
            value = next(it)
        except StopIteration:
            raise TypeError('reduce() of empty sequence with no initial value')
    else:
        value = initializer
    for element in it:
        value = func(value, element)
    return value
```

关键特性：
1. **立即求值**：`reduce` 返回单个值，必须遍历整个序列
2. **初始值可选**：可以提供初始值作为累积的起点
3. **空序列处理**：没有初始值时，空序列会抛出 `TypeError`

## 核心要点

### map 核心要点

| 特性 | 说明 |
|------|------|
| 返回类型 | `map` 对象（迭代器） |
| 参数数量 | 函数参数数量需与可迭代对象数量匹配 |
| 惰性求值 | 不消费迭代器就不会执行计算 |
| 多输入处理 | 以最短的可迭代对象为准 |

### filter 核心要点

| 特性 | 说明 |
|------|------|
| 返回类型 | `filter` 对象（迭代器） |
| None 函数 | 过滤假值（0, '', None, False, [], {} 等） |
| 真值判断 | 任何返回真值的结果都会保留元素 |
| 单一输入 | 只接受一个可迭代对象 |

### reduce 核心要点

| 特性 | 说明 |
|------|------|
| 模块位置 | `functools` 模块（Python 3） |
| 返回类型 | 单个累积值 |
| 初始值作用 | 处理空序列、设定类型 |
| 结合律要求 | 最适合满足结合律的操作 |

### 惰性求值详解

```python
# 惰性求值演示
def debug_transform(x):
    print(f"Processing: {x}")
    return x * 2

# 创建 map 对象，此时不会有任何输出
result = map(debug_transform, [1, 2, 3, 4, 5])
print("Map object created")  # 先输出这行

# 只有在迭代时才会处理
print("Starting iteration")
for item in result:
    print(f"Got: {item}")
    if item > 4:
        break  # 提前退出，后续元素不会被处理
```

## 代码示例

### map 基础用法

```python
# 基本转换
numbers = [1, 2, 3, 4, 5]

# 使用 lambda
squares = list(map(lambda x: x ** 2, numbers))
print(squares)  # [1, 4, 9, 16, 25]

# 使用内置函数
strings = ['1', '2', '3', '4', '5']
integers = list(map(int, strings))
print(integers)  # [1, 2, 3, 4, 5]

# 使用自定义函数
def celsius_to_fahrenheit(c):
    return c * 9/5 + 32

celsius = [0, 10, 20, 30, 40]
fahrenheit = list(map(celsius_to_fahrenheit, celsius))
print(fahrenheit)  # [32.0, 50.0, 68.0, 86.0, 104.0]
```

### map 多参数用法

```python
# 多个可迭代对象
list1 = [1, 2, 3]
list2 = [10, 20, 30]
list3 = [100, 200, 300]

# 使用多个可迭代对象
sums = list(map(lambda x, y, z: x + y + z, list1, list2, list3))
print(sums)  # [111, 222, 333]

# 使用 operator 模块
from operator import add, mul
products = list(map(mul, list1, list2))
print(products)  # [10, 40, 90]

# 不等长序列（以最短为准）
a = [1, 2, 3, 4, 5]
b = [10, 20, 30]
result = list(map(add, a, b))
print(result)  # [11, 22, 33]
```

### filter 基础用法

```python
# 基本过滤
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 过滤偶数
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)  # [2, 4, 6, 8, 10]

# 过滤正数
mixed = [-3, -2, -1, 0, 1, 2, 3]
positives = list(filter(lambda x: x > 0, mixed))
print(positives)  # [1, 2, 3]

# 使用自定义函数
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

primes = list(filter(is_prime, range(20)))
print(primes)  # [2, 3, 5, 7, 11, 13, 17, 19]
```

### filter 与 None

```python
# 使用 None 过滤假值
mixed_data = [0, 1, '', 'hello', None, [], [1, 2], False, True, {}, {'a': 1}]

# 过滤所有假值
truthy_values = list(filter(None, mixed_data))
print(truthy_values)  # [1, 'hello', [1, 2], True, {'a': 1}]

# 清理空字符串
strings = ['hello', '', 'world', '', 'python', '']
non_empty = list(filter(None, strings))
print(non_empty)  # ['hello', 'world', 'python']

# 注意：0 也是假值
numbers_with_zero = [0, 1, 2, 0, 3, 0, 4]
without_zeros = list(filter(None, numbers_with_zero))
print(without_zeros)  # [1, 2, 3, 4]
```

### reduce 基础用法

```python
from functools import reduce

# 基本累积操作
numbers = [1, 2, 3, 4, 5]

# 求和
total = reduce(lambda x, y: x + y, numbers)
print(total)  # 15

# 求积
product = reduce(lambda x, y: x * y, numbers)
print(product)  # 120

# 使用 operator 模块
from operator import add, mul
total = reduce(add, numbers)
product = reduce(mul, numbers)
```

### reduce 初始值用法

```python
from functools import reduce

# 使用初始值
numbers = [1, 2, 3, 4, 5]

# 带初始值的求和
total = reduce(lambda x, y: x + y, numbers, 10)
print(total)  # 25 (10 + 1 + 2 + 3 + 4 + 5)

# 处理空列表
empty = []
# result = reduce(lambda x, y: x + y, empty)  # TypeError!
result = reduce(lambda x, y: x + y, empty, 0)  # 正常，返回 0

# 初始值用于设定结果类型
strings = ['a', 'b', 'c']
result = reduce(lambda x, y: x + [y.upper()], strings, [])
print(result)  # ['A', 'B', 'C']
```

### reduce 高级用法

```python
from functools import reduce

# 复杂累积操作
# 扁平化嵌套列表
nested = [[1, 2], [3, 4], [5, 6]]
flat = reduce(lambda x, y: x + y, nested)
print(flat)  # [1, 2, 3, 4, 5, 6]

# 找最大值（演示用，实际使用 max()）
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
maximum = reduce(lambda x, y: x if x > y else y, numbers)
print(maximum)  # 9

# 组合字典
dicts = [{'a': 1}, {'b': 2}, {'c': 3}]
combined = reduce(lambda x, y: {**x, **y}, dicts)
print(combined)  # {'a': 1, 'b': 2, 'c': 3}

# 分组计数
words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
count = reduce(
    lambda acc, word: {**acc, word: acc.get(word, 0) + 1},
    words,
    {}
)
print(count)  # {'apple': 3, 'banana': 2, 'cherry': 1}
```

### 组合使用

```python
from functools import reduce

# 数据处理管道
data = ['  Alice  ', 'BOB', '  Charlie', 'david  ', '']

# 清洗、过滤、转换
result = list(
    map(
        str.title,  # 转为标题格式
        filter(
            None,  # 过滤空字符串
            map(str.strip, data)  # 去除空白
        )
    )
)
print(result)  # ['Alice', 'Bob', 'Charlie', 'David']

# 计算购物车总价
cart = [
    {'name': 'Apple', 'price': 1.5, 'quantity': 4},
    {'name': 'Banana', 'price': 0.5, 'quantity': 6},
    {'name': 'Orange', 'price': 2.0, 'quantity': 3},
]

# 过滤、转换、归约
total = reduce(
    lambda acc, x: acc + x,
    map(
        lambda item: item['price'] * item['quantity'],
        filter(
            lambda item: item['quantity'] > 0,
            cart
        )
    ),
    0
)
print(f"Total: ${total:.2f}")  # Total: $15.00
```

### 与列表推导式对比

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# --- map vs 列表推导式 ---
# map
squares_map = list(map(lambda x: x ** 2, numbers))
# 列表推导式
squares_comp = [x ** 2 for x in numbers]

# --- filter vs 列表推导式 ---
# filter
evens_filter = list(filter(lambda x: x % 2 == 0, numbers))
# 列表推导式
evens_comp = [x for x in numbers if x % 2 == 0]

# --- map + filter vs 列表推导式 ---
# map + filter
even_squares_mf = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, numbers)))
# 列表推导式（更清晰）
even_squares_comp = [x ** 2 for x in numbers if x % 2 == 0]

# --- 生成器表达式（惰性） ---
# 等效于 map 的惰性行为
squares_gen = (x ** 2 for x in numbers)
```

## 最佳实践

### 优先使用列表推导式处理简单场景

```python
# 推荐：列表推导式更直观
squares = [x ** 2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# 不推荐：lambda 降低可读性
squares = list(map(lambda x: x ** 2, range(10)))
evens = list(filter(lambda x: x % 2 == 0, range(20)))
```

### 使用内置函数或已有函数时优先 map/filter

```python
# 推荐：使用现有函数时 map 更简洁
strings = ['1', '2', '3', '4', '5']
numbers = list(map(int, strings))
lower_strings = list(map(str.lower, ['HELLO', 'WORLD']))

# 不推荐：这种情况列表推导式冗余
numbers = [int(s) for s in strings]
```

### 利用惰性求值处理大数据集

```python
# 推荐：处理大文件时使用惰性迭代
def process_large_file(filepath):
    with open(filepath) as f:
        # 惰性处理，不会一次性加载所有数据
        processed = map(str.strip, f)
        filtered = filter(lambda line: not line.startswith('#'), processed)
        for line in filtered:
            yield line

# 不推荐：列表推导式会一次性加载
def process_large_file_bad(filepath):
    with open(filepath) as f:
        return [line.strip() for line in f if not line.startswith('#')]
```

### 使用 operator 模块替代简单 lambda

```python
from operator import add, mul, itemgetter, attrgetter
from functools import reduce

# 推荐：使用 operator 模块
total = reduce(add, numbers)
product = reduce(mul, numbers)

# 排序时使用 itemgetter/attrgetter
data = [{'name': 'Alice', 'age': 30}, {'name': 'Bob', 'age': 25}]
sorted_data = sorted(data, key=itemgetter('age'))

# 不推荐：简单操作使用 lambda
total = reduce(lambda x, y: x + y, numbers)
sorted_data = sorted(data, key=lambda x: x['age'])
```

### reduce 使用初始值确保类型安全

```python
from functools import reduce

# 推荐：始终提供初始值
def safe_sum(numbers):
    return reduce(lambda x, y: x + y, numbers, 0)

def safe_concat(strings):
    return reduce(lambda x, y: x + y, strings, '')

# 不推荐：空序列会抛出异常
def unsafe_sum(numbers):
    return reduce(lambda x, y: x + y, numbers)  # 空列表会报错
```

### 复杂操作使用普通函数而非 lambda

```python
# 推荐：复杂逻辑使用命名函数
def calculate_discount_price(item):
    """计算折扣后价格"""
    if item['category'] == 'electronics':
        return item['price'] * 0.9
    elif item['category'] == 'clothing':
        return item['price'] * 0.8
    return item['price']

discounted = list(map(calculate_discount_price, items))

# 不推荐：复杂 lambda 难以理解和调试
discounted = list(map(
    lambda x: x['price'] * 0.9 if x['category'] == 'electronics'
              else x['price'] * 0.8 if x['category'] == 'clothing'
              else x['price'],
    items
))
```

## 常见陷阱

### 忘记 map/filter 返回迭代器

```python
# 错误：迭代器只能遍历一次
numbers = [1, 2, 3, 4, 5]
doubled = map(lambda x: x * 2, numbers)

print(list(doubled))  # [2, 4, 6, 8, 10]
print(list(doubled))  # []  空列表！迭代器已耗尽

# 正确：需要多次使用时转换为列表
doubled = list(map(lambda x: x * 2, numbers))
print(doubled)  # [2, 4, 6, 8, 10]
print(doubled)  # [2, 4, 6, 8, 10]
```

### reduce 不导入就使用

```python
# 错误：Python 3 中 reduce 不是内置函数
# result = reduce(lambda x, y: x + y, [1, 2, 3])  # NameError!

# 正确：从 functools 导入
from functools import reduce
result = reduce(lambda x, y: x + y, [1, 2, 3])
```

### 在 lambda 中修改外部状态

```python
# 错误：lambda 产生副作用
results = []
list(map(lambda x: results.append(x * 2), [1, 2, 3]))  # 不应这样做

# 正确：使用列表推导式或普通循环
results = [x * 2 for x in [1, 2, 3]]
# 或
results = list(map(lambda x: x * 2, [1, 2, 3]))
```

### filter 中 None 会过滤 0

```python
# 陷阱：0 是假值，会被 filter(None, ...) 过滤
numbers = [0, 1, 2, 0, 3, 0, 4]
result = list(filter(None, numbers))
print(result)  # [1, 2, 3, 4]  0 被过滤了！

# 正确：明确指定过滤条件
result = list(filter(lambda x: x is not None, numbers))
print(result)  # [0, 1, 2, 0, 3, 0, 4]
```

### map 处理不等长序列

```python
# 陷阱：map 以最短序列为准
list1 = [1, 2, 3, 4, 5]
list2 = [10, 20, 30]

result = list(map(lambda x, y: x + y, list1, list2))
print(result)  # [11, 22, 33]  丢失了后两个元素！

# 如需处理所有元素，使用 itertools.zip_longest
from itertools import zip_longest

result = list(map(
    lambda pair: pair[0] + pair[1] if pair[1] is not None else pair[0],
    zip_longest(list1, list2)
))
print(result)  # [11, 22, 33, 4, 5]
```

### reduce 空序列异常

```python
from functools import reduce

# 陷阱：空序列没有初始值会报错
empty = []
# result = reduce(lambda x, y: x + y, empty)  # TypeError!

# 正确：提供初始值
result = reduce(lambda x, y: x + y, empty, 0)
print(result)  # 0
```

### 惰性求值导致的延迟异常

```python
# 陷阱：异常在迭代时才会抛出
def risky_transform(x):
    if x == 3:
        raise ValueError("Bad value!")
    return x * 2

# 创建时不会报错
result = map(risky_transform, [1, 2, 3, 4, 5])
print("Map created")  # 正常输出

# 迭代时才报错
# list(result)  # ValueError: Bad value!
```

### 闭包变量陷阱

```python
# 陷阱：lambda 捕获变量引用而非值
multipliers = []
for i in range(5):
    multipliers.append(lambda x: x * i)

# 所有 lambda 都使用最后的 i 值
print([m(2) for m in multipliers])  # [8, 8, 8, 8, 8]

# 正确：使用默认参数捕获当前值
multipliers = []
for i in range(5):
    multipliers.append(lambda x, i=i: x * i)

print([m(2) for m in multipliers])  # [0, 2, 4, 6, 8]
```

## 性能考量

### 基准测试对比

```python
import timeit
from functools import reduce

# 测试数据
numbers = list(range(10000))

# --- map vs 列表推导式 ---
def using_map():
    return list(map(lambda x: x ** 2, numbers))

def using_comprehension():
    return [x ** 2 for x in numbers]

def using_map_builtin():
    return list(map(str, numbers))

def using_comprehension_builtin():
    return [str(x) for x in numbers]

# 使用 lambda 时，列表推导式通常更快
# 使用内置函数时，map 通常更快或相当
```

### 性能测试结果（典型场景）

| 操作 | map/filter | 列表推导式 | 说明 |
|------|-----------|-----------|------|
| 简单转换 (lambda) | 较慢 | **较快** | lambda 有额外开销 |
| 内置函数调用 | **较快** | 较慢 | 避免了额外包装 |
| 大数据集（惰性） | **内存高效** | 内存消耗大 | 迭代器按需生成 |
| 链式操作 | 内存高效 | 每步创建新列表 | 迭代器链不创建中间列表 |

### 内存效率对比

```python
import sys

numbers = range(1000000)

# 列表推导式：立即创建完整列表
list_comp = [x * 2 for x in numbers]
print(f"List: {sys.getsizeof(list_comp):,} bytes")  # ~8MB

# map：只创建迭代器对象
map_obj = map(lambda x: x * 2, numbers)
print(f"Map: {sys.getsizeof(map_obj):,} bytes")  # ~48 bytes

# 生成器表达式：也是惰性的
gen_exp = (x * 2 for x in numbers)
print(f"Generator: {sys.getsizeof(gen_exp):,} bytes")  # ~120 bytes
```

### 链式操作的性能优势

```python
# 场景：处理大数据集
data = range(1000000)

# 方法1：列表推导式（每步创建中间列表）
def using_lists():
    step1 = [x * 2 for x in data]           # 创建列表
    step2 = [x for x in step1 if x % 4 == 0] # 创建列表
    step3 = [x + 1 for x in step2]           # 创建列表
    return sum(step3)

# 方法2：map/filter 链（不创建中间列表）
def using_iterators():
    step1 = map(lambda x: x * 2, data)
    step2 = filter(lambda x: x % 4 == 0, step1)
    step3 = map(lambda x: x + 1, step2)
    return sum(step3)

# 方法3：生成器表达式链
def using_generators():
    step1 = (x * 2 for x in data)
    step2 = (x for x in step1 if x % 4 == 0)
    step3 = (x + 1 for x in step2)
    return sum(step3)

# 方法2和3内存效率相当，都优于方法1
```

### reduce 性能注意事项

```python
from functools import reduce

# 字符串拼接：reduce 效率低
words = ['hello'] * 10000

# 慢：每次创建新字符串对象
def slow_concat():
    return reduce(lambda x, y: x + y, words)

# 快：使用 join
def fast_concat():
    return ''.join(words)

# 列表扁平化：同样的问题
nested = [[i] for i in range(10000)]

# 慢：每次创建新列表
def slow_flatten():
    return reduce(lambda x, y: x + y, nested)

# 快：使用列表推导式
def fast_flatten():
    return [item for sublist in nested for item in sublist]

# 更快：使用 itertools.chain
from itertools import chain
def fastest_flatten():
    return list(chain.from_iterable(nested))
```

### 优化建议

1. **简单转换**：优先使用列表推导式
2. **内置函数**：优先使用 map
3. **大数据集**：使用迭代器/生成器保持惰性
4. **字符串拼接**：使用 `''.join()` 而非 reduce
5. **列表扁平化**：使用 `itertools.chain`
6. **累积计算**：考虑使用 `itertools.accumulate`

## 实战场景

### 场景1：数据清洗管道

```python
from functools import reduce

# 原始数据
raw_data = [
    "  ALICE,25,engineer  ",
    "bob,30,designer",
    "  CHARLIE,35,  ",  # 无效数据
    "diana,28,manager",
    "",  # 空行
    "  EVE,32,analyst",
]

def clean_record(line):
    """清洗单条记录"""
    parts = line.strip().split(',')
    if len(parts) != 3 or not all(p.strip() for p in parts):
        return None
    name, age, role = parts
    return {
        'name': name.strip().title(),
        'age': int(age.strip()),
        'role': role.strip().lower()
    }

# 数据清洗管道
cleaned = list(filter(None, map(clean_record, filter(None, raw_data))))
print(cleaned)
# [{'name': 'Alice', 'age': 25, 'role': 'engineer'},
#  {'name': 'Bob', 'age': 30, 'role': 'designer'},
#  {'name': 'Diana', 'age': 28, 'role': 'manager'},
#  {'name': 'Eve', 'age': 32, 'role': 'analyst'}]
```

### 场景2：日志分析

```python
from functools import reduce
from datetime import datetime
from collections import defaultdict

# 模拟日志数据
logs = [
    "2024-01-15 10:30:00 INFO User login: alice",
    "2024-01-15 10:31:00 ERROR Database connection failed",
    "2024-01-15 10:32:00 INFO User login: bob",
    "2024-01-15 10:33:00 WARNING High memory usage",
    "2024-01-15 10:34:00 ERROR API timeout",
    "2024-01-15 10:35:00 INFO User logout: alice",
]

def parse_log(line):
    """解析日志行"""
    parts = line.split(' ', 3)
    return {
        'timestamp': f"{parts[0]} {parts[1]}",
        'level': parts[2],
        'message': parts[3]
    }

def is_error(log):
    """判断是否为错误日志"""
    return log['level'] == 'ERROR'

# 解析所有日志
parsed_logs = list(map(parse_log, logs))

# 筛选错误日志
errors = list(filter(is_error, parsed_logs))
print(f"Error count: {len(errors)}")

# 按级别分组统计
def count_by_level(acc, log):
    acc[log['level']] = acc.get(log['level'], 0) + 1
    return acc

level_counts = reduce(count_by_level, parsed_logs, {})
print(f"Counts by level: {level_counts}")
# {'INFO': 3, 'ERROR': 2, 'WARNING': 1}
```

### 场景3：电商订单处理

```python
from functools import reduce
from decimal import Decimal

# 订单数据
orders = [
    {
        'order_id': 'ORD001',
        'customer': 'Alice',
        'items': [
            {'product': 'Laptop', 'price': 999.99, 'quantity': 1},
            {'product': 'Mouse', 'price': 29.99, 'quantity': 2},
        ],
        'discount': 0.1  # 10% 折扣
    },
    {
        'order_id': 'ORD002',
        'customer': 'Bob',
        'items': [
            {'product': 'Keyboard', 'price': 79.99, 'quantity': 1},
            {'product': 'Monitor', 'price': 299.99, 'quantity': 2},
        ],
        'discount': 0.05  # 5% 折扣
    },
]

def calculate_order_total(order):
    """计算订单总额（含折扣）"""
    subtotal = reduce(
        lambda acc, item: acc + item['price'] * item['quantity'],
        order['items'],
        0
    )
    return {
        **order,
        'subtotal': subtotal,
        'total': subtotal * (1 - order['discount'])
    }

def is_high_value(order, threshold=500):
    """判断是否为高价值订单"""
    return order['total'] >= threshold

# 处理订单
processed_orders = list(map(calculate_order_total, orders))

# 筛选高价值订单
high_value_orders = list(filter(is_high_value, processed_orders))

# 计算总收入
total_revenue = reduce(
    lambda acc, order: acc + order['total'],
    processed_orders,
    0
)

print(f"Total revenue: ${total_revenue:.2f}")
print(f"High value orders: {len(high_value_orders)}")
```

### 场景4：并行数据处理

```python
from functools import reduce
from multiprocessing import Pool
import math

def process_chunk(numbers):
    """处理数据块"""
    # 复杂计算
    return list(map(lambda x: math.sqrt(x) * math.log(x + 1), numbers))

def parallel_map(func, data, chunk_size=1000, workers=4):
    """并行 map 实现"""
    # 分块
    chunks = [data[i:i+chunk_size] for i in range(0, len(data), chunk_size)]

    # 并行处理
    with Pool(workers) as pool:
        results = pool.map(func, chunks)

    # 合并结果
    return reduce(lambda x, y: x + y, results, [])

# 使用
large_data = list(range(1, 100001))
results = parallel_map(process_chunk, large_data)
print(f"Processed {len(results)} items")
```

### 场景5：配置合并

```python
from functools import reduce

# 多层配置
default_config = {
    'debug': False,
    'database': {
        'host': 'localhost',
        'port': 5432,
        'name': 'mydb'
    },
    'cache': {
        'enabled': True,
        'ttl': 3600
    }
}

env_config = {
    'debug': True,
    'database': {
        'host': 'prod-db.example.com'
    }
}

user_config = {
    'cache': {
        'ttl': 7200
    }
}

def deep_merge(base, override):
    """深度合并字典"""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

# 合并所有配置
final_config = reduce(deep_merge, [default_config, env_config, user_config])
print(final_config)
# 深度合并后的配置
```

## 面试要点

### 基础问题

**Q1: map、filter、reduce 在 Python 3 中的返回值是什么？**

A: `map` 和 `filter` 返回迭代器对象（惰性求值），`reduce` 返回单个累积值。在 Python 2 中，`map` 和 `filter` 返回列表。

**Q2: 为什么 Python 3 中 reduce 被移到了 functools 模块？**

A: Guido van Rossum 认为 `reduce` 的可读性较差，除了少数常见用法（如求和、求积）外，使用显式循环通常更清晰。将其移到 `functools` 模块是为了不鼓励过度使用。

**Q3: 什么是惰性求值？有什么优势？**

A: 惰性求值是指表达式在真正需要其值时才计算。优势包括：
- 内存效率：不需要一次性存储所有结果
- 支持无限序列：可以处理无限数据流
- 性能优化：可以提前终止不需要的计算

### 进阶问题

**Q4: map/filter 与列表推导式在什么情况下应该选择哪个？**

A:
- 使用列表推导式：需要列表结果、使用 lambda、简单表达式
- 使用 map/filter：已有函数可用、需要惰性求值、处理多个序列
- 两者都可：看团队代码风格和可读性

**Q5: 如何实现一个支持多个函数的管道（pipe）？**

```python
from functools import reduce

def pipe(*functions):
    """创建函数管道"""
    def pipeline(value):
        return reduce(lambda v, f: f(v), functions, value)
    return pipeline

# 使用
process = pipe(
    lambda x: x * 2,
    lambda x: x + 10,
    lambda x: x ** 2
)
result = process(5)  # ((5 * 2) + 10) ** 2 = 400
```

**Q6: reduce 的时间复杂度和空间复杂度是多少？**

A: 时间复杂度 O(n)，空间复杂度 O(1)（不计函数内部分配）。但如果累积操作本身是 O(n)（如字符串拼接），总体复杂度会是 O(n^2)。

### 实战问题

**Q7: 用 map/filter/reduce 实现以下功能：找出列表中所有偶数的平方和**

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 方法1：组合使用
result = reduce(
    lambda acc, x: acc + x,
    map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, numbers)),
    0
)

# 方法2：列表推导式
result = sum(x ** 2 for x in numbers if x % 2 == 0)

print(result)  # 220
```

**Q8: 如何处理 reduce 中的空序列问题？**

```python
from functools import reduce

def safe_reduce(func, iterable, default=None):
    """安全的 reduce 实现"""
    try:
        return reduce(func, iterable)
    except TypeError:
        if default is not None:
            return default
        raise

# 或者始终提供初始值
result = reduce(lambda x, y: x + y, [], 0)
```

**Q9: map 可以替代哪些常见的循环模式？**

```python
# 类型转换
strings = ['1', '2', '3']
numbers = list(map(int, strings))  # vs [int(s) for s in strings]

# 方法调用
words = ['hello', 'world']
upper = list(map(str.upper, words))  # vs [w.upper() for w in words]

# 多序列操作
a = [1, 2, 3]
b = [4, 5, 6]
sums = list(map(lambda x, y: x + y, a, b))  # vs [x + y for x, y in zip(a, b)]

# 字典值提取
data = [{'name': 'Alice'}, {'name': 'Bob'}]
names = list(map(lambda x: x['name'], data))  # vs [d['name'] for d in data]
```

## 延伸阅读

### 官方文档

- [Python 内置函数 - map](https://docs.python.org/3/library/functions.html#map)
- [Python 内置函数 - filter](https://docs.python.org/3/library/functions.html#filter)
- [functools.reduce](https://docs.python.org/3/library/functools.html#functools.reduce)
- [itertools 模块](https://docs.python.org/3/library/itertools.html)

### 进阶阅读

- [Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html) - Python 官方函数式编程指南
- [PEP 289 - Generator Expressions](https://peps.python.org/pep-0289/) - 生成器表达式提案
- [PEP 202 - List Comprehensions](https://peps.python.org/pep-0202/) - 列表推导式提案

### 相关工具库

- [toolz](https://toolz.readthedocs.io/) - 函数式编程工具库
- [more-itertools](https://more-itertools.readthedocs.io/) - itertools 扩展
- [fn.py](https://github.com/kachayev/fn.py) - Python 函数式编程库

### 推荐书籍

- 《Fluent Python》- Luciano Ramalho：深入讲解 Python 函数式编程特性
- 《Functional Programming in Python》- David Mertz：O'Reilly 免费电子书
