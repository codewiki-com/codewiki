---
title: Python Programming Fundamentals
description: Master Python programming basics for solid foundation
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - Programming Basics
  - Data Types
  - Functions
status: imported
origin: old/src/content/docs/backend/python-fundamentals.zh.md
divergence: 0.214
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Backend
  subcategory: Python
  order: 9
  lastUpdated: 2026-01-07
---

## 概念概述：什么是 Python？

Python 是一种高级解释型编程语言，以其清晰的语法和可读性而闻名。Python 由 Guido van Rossum 创建，于 1991 年首次发布，现已成为世界上最流行的编程语言之一，广泛应用于 Web 应用、数据科学流水线和人工智能系统等各个领域。

### 核心特性

Python 具有以下几个显著特点：

- **可读性强的语法**：使用缩进来定义代码块，使代码视觉上整洁且易于理解
- **动态类型**：变量不需要显式声明类型；类型在运行时确定
- **解释型语言**：代码逐行执行，无需单独的编译步骤
- **多范式支持**：支持过程式、面向对象和函数式编程风格
- **丰富的标准库**：内置了大量用于常见任务的模块
- **跨平台**：可在 Windows、Linux、macOS 和许多其他平台上运行

### 理想使用场景

Python 在以下场景中表现出色：

```
1. Web 开发（Django、Flask、FastAPI）
2. 数据科学和机器学习（NumPy、Pandas、TensorFlow）
3. 自动化和脚本编写
4. API 开发和后端服务
5. 科学计算和研究
6. DevOps 和基础设施工具
```

## 数据类型

理解 Python 的数据类型是编写高效代码的基础。Python 提供了多种内置数据类型，作为所有程序的构建块。

### 数值类型

Python 支持三种不同的数值类型，用于处理不同类型的数值数据：

```python
# 整数 - 没有小数点的整数
age = 25
population = 7_900_000_000  # 使用下划线提高可读性
binary_value = 0b1010       # 二进制字面量（等于 10）
hex_value = 0xFF            # 十六进制字面量（等于 255）

# 浮点数 - 带小数点的数字
price = 19.99
scientific = 3.14e-10       # 科学计数法
infinity = float('inf')     # 正无穷

# 复数 - 包含实部和虚部的数字
complex_num = 3 + 4j
another_complex = complex(2, 5)  # 创建 2 + 5j

# 数值运算
result = 10 / 3      # 除法：3.3333...
floor_div = 10 // 3  # 整除：3
remainder = 10 % 3   # 取余：1
power = 2 ** 10      # 幂运算：1024

# 类型检查和转换
print(type(age))              # <class 'int'>
print(isinstance(price, float))  # True
converted = int(19.99)        # 转换为 19
```

### 字符串

字符串是用于表示文本的字符序列。Python 提供了丰富的字符串操作功能：

```python
# 创建字符串
single_quoted = 'Hello, World!'
double_quoted = "Hello, World!"
multiline = """这是一个
跨越多行的
多行字符串。"""

# 原始字符串 - 忽略转义序列
path = r'C:\Users\name\documents'

# 字符串格式化方法
name = "Alice"
age = 30

# f-string（Python 3.6+）- 推荐方式
greeting = f"你好，{name}！你今年 {age} 岁了。"
formatted_number = f"价格：${19.99:.2f}"  # 价格：$19.99

# format() 方法
template = "你好，{}！你今年 {} 岁了。".format(name, age)

# % 格式化（旧式风格）
old_style = "你好，%s！你今年 %d 岁了。" % (name, age)

# 字符串方法
text = "  Python Programming  "
print(text.strip())           # "Python Programming"
print(text.lower())           # "  python programming  "
print(text.upper())           # "  PYTHON PROGRAMMING  "
print(text.replace("Python", "Java"))  # "  Java Programming  "
print(text.split())           # ['Python', 'Programming']

# 字符串切片
word = "Python"
print(word[0])       # 'P' - 第一个字符
print(word[-1])      # 'n' - 最后一个字符
print(word[0:3])     # 'Pyt' - 第 0-2 个字符
print(word[::2])     # 'Pto' - 每隔一个字符
print(word[::-1])    # 'nohtyP' - 反转

# 字符串成员检查和搜索
sentence = "Python is awesome"
print("Python" in sentence)    # True
print(sentence.find("is"))     # 7（"is" 开始的索引）
print(sentence.count("o"))     # 2

# 字符串连接
words = ["Python", "is", "great"]
joined = " ".join(words)       # "Python is great"
```

### 布尔类型

布尔值表示真值，对于控制流程至关重要：

```python
# 布尔值
is_active = True
is_deleted = False

# 布尔运算
print(True and False)   # False
print(True or False)    # True
print(not True)         # False

# 真值和假值
# 假值：False, None, 0, 0.0, '', [], {}, set()
# 其他所有值都是真值

# 实际示例
empty_list = []
if not empty_list:  # 空列表是假值
    print("列表为空")

# 布尔比较
x = 5
print(x > 3)        # True
print(x == 5)       # True
print(x != 5)       # False
print(1 < x < 10)   # True（链式比较）
```

### 列表

列表是有序的可变序列，可以包含任何类型的元素：

```python
# 创建列表
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True, None]
nested = [[1, 2], [3, 4], [5, 6]]
empty = []

# 使用 list 构造函数
from_range = list(range(5))  # [0, 1, 2, 3, 4]
from_string = list("hello")  # ['h', 'e', 'l', 'l', 'o']

# 访问元素
print(fruits[0])         # "apple"
print(fruits[-1])        # "cherry"
print(fruits[1:3])       # ["banana", "cherry"]

# 修改列表
fruits.append("orange")        # 添加到末尾
fruits.insert(1, "grape")      # 在索引处插入
fruits.extend(["mango", "kiwi"])  # 添加多个元素
fruits[0] = "pear"            # 替换元素

# 删除元素
fruits.remove("banana")       # 按值删除
popped = fruits.pop()         # 删除并返回最后一个元素
popped_at = fruits.pop(1)     # 删除并返回指定索引的元素
del fruits[0]                 # 按索引删除
fruits.clear()                # 删除所有元素

# 列表操作
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
print(len(numbers))           # 8
print(sum(numbers))           # 31
print(min(numbers))           # 1
print(max(numbers))           # 9
print(numbers.count(1))       # 2
print(numbers.index(5))       # 4

# 排序
numbers.sort()                # 原地排序
numbers.sort(reverse=True)    # 降序排序
sorted_nums = sorted(numbers)  # 返回新的排序列表

# 列表推导式
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
matrix = [[i*j for j in range(3)] for i in range(3)]

# 使用推导式过滤
words = ["apple", "banana", "cherry", "date"]
long_words = [w for w in words if len(w) > 5]
upper_words = [w.upper() for w in words]
```

### 元组

元组是有序的不可变序列。一旦创建，其元素就不能被修改：

```python
# 创建元组
coordinates = (10, 20)
single_element = (42,)        # 注意逗号
empty_tuple = ()
from_list = tuple([1, 2, 3])

# 访问元素（与列表相同）
print(coordinates[0])         # 10
print(coordinates[-1])        # 20

# 元组解包
x, y = coordinates
print(f"x: {x}, y: {y}")      # x: 10, y: 20

# 扩展解包
first, *rest = (1, 2, 3, 4, 5)
print(first)                  # 1
print(rest)                   # [2, 3, 4, 5]

# 元组方法
numbers = (1, 2, 3, 2, 4, 2)
print(numbers.count(2))       # 3
print(numbers.index(3))       # 2

# 命名元组用于结构化数据
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])
p = Point(10, 20)
print(p.x, p.y)              # 10 20
print(p[0], p[1])            # 10 20

# 使用场景：函数返回值、字典键、常量数据
def get_user_info():
    return ("Alice", 30, "alice@example.com")

name, age, email = get_user_info()
```

### 字典

字典是键值对的可变映射，具有快速查找功能：

```python
# 创建字典
user = {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com"
}
empty_dict = {}
from_pairs = dict([("a", 1), ("b", 2)])
from_kwargs = dict(name="Bob", age=25)

# 访问值
print(user["name"])           # "Alice"
print(user.get("phone"))      # None（不会引发 KeyError）
print(user.get("phone", "N/A"))  # "N/A"（默认值）

# 修改字典
user["phone"] = "123-456-7890"  # 添加新键
user["age"] = 31                # 更新现有键
user.update({"city": "NYC", "country": "USA"})

# 删除条目
del user["email"]              # 按键删除
phone = user.pop("phone")      # 删除并返回值
last_item = user.popitem()     # 删除并返回最后一对

# 字典方法
print(user.keys())             # dict_keys(['name', 'age', ...])
print(user.values())           # dict_values(['Alice', 31, ...])
print(user.items())            # dict_items([('name', 'Alice'), ...])

# 遍历字典
for key in user:
    print(f"{key}: {user[key]}")

for key, value in user.items():
    print(f"{key}: {value}")

# 字典推导式
squares = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# 使用推导式过滤
filtered = {k: v for k, v in user.items() if isinstance(v, str)}

# 合并字典（Python 3.9+）
defaults = {"theme": "light", "language": "en"}
settings = {"language": "es", "notifications": True}
merged = defaults | settings  # settings 覆盖 defaults

# 嵌套字典
company = {
    "name": "TechCorp",
    "employees": {
        "engineering": ["Alice", "Bob"],
        "marketing": ["Charlie", "Diana"]
    }
}
print(company["employees"]["engineering"][0])  # "Alice"
```

### 集合

集合是唯一元素的无序集合，非常适合成员检测和去重：

```python
# 创建集合
fruits = {"apple", "banana", "cherry"}
empty_set = set()             # 注意：{} 会创建空字典
from_list = set([1, 2, 2, 3, 3, 3])  # {1, 2, 3}

# 添加和删除元素
fruits.add("orange")
fruits.update(["mango", "kiwi"])
fruits.remove("banana")       # 如果不存在会引发 KeyError
fruits.discard("grape")       # 如果不存在不会报错
popped = fruits.pop()         # 删除并返回任意元素

# 集合运算
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)    # 并集：{1, 2, 3, 4, 5, 6}
print(a & b)    # 交集：{3, 4}
print(a - b)    # 差集：{1, 2}
print(a ^ b)    # 对称差集：{1, 2, 5, 6}

# 集合比较
print(a.issubset(b))          # False
print({3, 4}.issubset(a))     # True
print(a.issuperset({1, 2}))   # True
print(a.isdisjoint({7, 8}))   # True（没有共同元素）

# 成员检测（非常快 - O(1)）
numbers = set(range(1000000))
print(999999 in numbers)      # True - 即时查找

# 冻结集合（不可变集合）
frozen = frozenset([1, 2, 3])
# frozen.add(4)  # AttributeError - 无法修改

# 集合推导式
evens = {x for x in range(20) if x % 2 == 0}
```

### None 类型

None 表示没有值，是 Python 的空值等价物：

```python
# None 的使用
result = None

# 检查 None
if result is None:
    print("没有可用的结果")

# 默认函数参数
def greet(name=None):
    if name is None:
        name = "访客"
    return f"你好，{name}！"

# None 作为默认返回值
def process_data(data):
    if not data:
        return None  # 显式返回 None
    return data.upper()

# 可选类型提示（Python 3.10+）
from typing import Optional

def find_user(user_id: int) -> Optional[dict]:
    # 返回 dict 或 None
    users = {1: {"name": "Alice"}}
    return users.get(user_id)
```

## 控制流

控制流语句允许你根据条件和重复来指导程序的执行路径。

### 条件语句

Python 使用 if、elif 和 else 进行条件执行：

```python
# 基本 if 语句
age = 18

if age >= 18:
    print("你是成年人")

# if-else
temperature = 25

if temperature > 30:
    print("外面很热")
else:
    print("温度宜人")

# if-elif-else 链
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"你的成绩是：{grade}")  # 你的成绩是：B

# 条件表达式（三元运算符）
status = "成年人" if age >= 18 else "未成年人"

# 多重条件
x, y, z = 10, 20, 15

if x < y and y > z:
    print("y 是最大的")

if x < 5 or x > 8:
    print("x 不在 5-8 范围内")

# 嵌套条件
user_role = "admin"
is_authenticated = True

if is_authenticated:
    if user_role == "admin":
        print("欢迎，管理员！")
    else:
        print("欢迎，用户！")
else:
    print("请登录")

# match 语句（Python 3.10+）
command = "start"

match command:
    case "start":
        print("正在启动应用程序...")
    case "stop":
        print("正在停止应用程序...")
    case "restart":
        print("正在重启应用程序...")
    case _:
        print("未知命令")

# 结构模式匹配
point = (0, 5)

match point:
    case (0, 0):
        print("原点")
    case (0, y):
        print(f"在 Y 轴上，y={y}")
    case (x, 0):
        print(f"在 X 轴上，x={x}")
    case (x, y):
        print(f"点在 ({x}, {y})")
```

### 循环

Python 提供两种主要的循环结构：用于遍历序列的 for 循环和基于条件重复的 while 循环：

```python
# for 循环基础
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)

# 使用 range 的循环
for i in range(5):           # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 8):        # 2, 3, 4, 5, 6, 7
    print(i)

for i in range(0, 10, 2):    # 0, 2, 4, 6, 8
    print(i)

# 使用 enumerate 获取索引和值
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")

for index, fruit in enumerate(fruits, start=1):
    print(f"{index}: {fruit}")  # 从 1 开始索引

# 遍历字典
user = {"name": "Alice", "age": 30}

for key in user:
    print(f"{key}: {user[key]}")

for key, value in user.items():
    print(f"{key}: {value}")

# while 循环
count = 0

while count < 5:
    print(count)
    count += 1

# 带条件的 while
user_input = ""

while user_input.lower() != "quit":
    user_input = input("输入命令（quit 退出）：")
    print(f"你输入了：{user_input}")

# 循环控制语句
# break - 立即退出循环
for num in range(10):
    if num == 5:
        break
    print(num)  # 打印 0, 1, 2, 3, 4

# continue - 跳到下一次迭代
for num in range(10):
    if num % 2 == 0:
        continue
    print(num)  # 打印奇数：1, 3, 5, 7, 9

# 循环中的 else 子句
# 当循环正常完成时执行（没有 break）
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(f"{n} = {x} * {n//x}")
            break
    else:
        print(f"{n} 是质数")

# 嵌套循环
for i in range(3):
    for j in range(3):
        print(f"({i}, {j})", end=" ")
    print()  # 换行

# 使用 zip 进行并行迭代
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]

for name, age in zip(names, ages):
    print(f"{name} 今年 {age} 岁")

# 多序列迭代
for name, age, city in zip(names, ages, ["NYC", "LA", "Chicago"]):
    print(f"{name}, {age}, {city}")
```

### 异常处理

Python 使用 try-except 块来优雅地处理错误：

```python
# 基本异常处理
try:
    result = 10 / 0
except ZeroDivisionError:
    print("不能除以零！")

# 处理多种异常类型
try:
    value = int(input("输入一个数字："))
    result = 100 / value
except ValueError:
    print("无效输入 - 不是数字")
except ZeroDivisionError:
    print("不能除以零")

# 一起捕获多个异常
try:
    risky_operation()
except (ValueError, TypeError, KeyError) as e:
    print(f"发生错误：{e}")

# 通用异常捕获
try:
    some_function()
except Exception as e:
    print(f"意外错误：{type(e).__name__}: {e}")

# else 子句 - 没有异常时运行
try:
    value = int("42")
except ValueError:
    print("转换失败")
else:
    print(f"转换成功：{value}")

# finally 子句 - 总是运行
file = None
try:
    file = open("data.txt", "r")
    content = file.read()
except FileNotFoundError:
    print("文件未找到")
finally:
    if file:
        file.close()
    print("清理完成")

# 抛出异常
def validate_age(age):
    if age < 0:
        raise ValueError("年龄不能为负数")
    if age > 150:
        raise ValueError("年龄似乎不现实")
    return age

# 重新抛出异常
try:
    validate_age(-5)
except ValueError as e:
    print(f"验证错误：{e}")
    raise  # 重新抛出相同的异常

# 自定义异常
class InsufficientFundsError(Exception):
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"无法取款 ${amount}。余额为 ${balance}"
        )

class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return amount

# 使用自定义异常
account = BankAccount(100)
try:
    account.withdraw(150)
except InsufficientFundsError as e:
    print(f"错误：{e}")
    print(f"当前余额：${e.balance}")
```

## 函数

函数是执行特定任务的可重用代码块。Python 提供了强大的函数定义和使用功能。

### 定义函数

```python
# 基本函数定义
def greet():
    print("Hello, World!")

greet()  # 调用函数

# 带参数的函数
def greet_user(name):
    print(f"你好，{name}！")

greet_user("Alice")

# 带返回值的函数
def add(a, b):
    return a + b

result = add(3, 5)  # result = 8

# 多个返回值
def get_stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

minimum, maximum, average = get_stats([1, 2, 3, 4, 5])

# 提前返回
def is_even(n):
    if n % 2 == 0:
        return True
    return False

# 隐式返回 None
def log_message(message):
    print(f"LOG: {message}")
    # 隐式返回 None
```

### 函数参数

```python
# 默认参数
def greet(name, greeting="你好"):
    return f"{greeting}，{name}！"

print(greet("Alice"))              # "你好，Alice！"
print(greet("Bob", "嗨"))          # "嗨，Bob！"

# 关键字参数
def create_user(name, age, city="未知"):
    return {"name": name, "age": age, "city": city}

user = create_user(name="Alice", age=30, city="NYC")
user = create_user(age=25, name="Bob")  # 顺序无关紧要

# *args - 可变位置参数
def calculate_sum(*numbers):
    total = 0
    for num in numbers:
        total += num
    return total

print(calculate_sum(1, 2, 3))      # 6
print(calculate_sum(1, 2, 3, 4, 5))  # 15

# **kwargs - 可变关键字参数
def create_profile(**kwargs):
    profile = {}
    for key, value in kwargs.items():
        profile[key] = value
    return profile

user = create_profile(name="Alice", age=30, city="NYC")

# 组合参数类型
def complex_function(required, *args, default="value", **kwargs):
    print(f"必需参数：{required}")
    print(f"Args：{args}")
    print(f"默认值：{default}")
    print(f"Kwargs：{kwargs}")

complex_function("req", 1, 2, 3, default="custom", extra="data")

# 仅关键字参数（* 之后）
def configure(*, host, port, timeout=30):
    return f"连接到 {host}:{port}，超时 {timeout}s"

# 必须使用关键字参数
config = configure(host="localhost", port=8080)

# 仅位置参数（Python 3.8+，/ 之前）
def divide(a, b, /):
    return a / b

result = divide(10, 2)  # 正确
# result = divide(a=10, b=2)  # 错误 - 必须是位置参数
```

### Lambda 函数

Lambda 函数是使用 lambda 关键字定义的小型匿名函数：

```python
# 基本 lambda
square = lambda x: x ** 2
print(square(5))  # 25

# 带多个参数的 lambda
add = lambda x, y: x + y
print(add(3, 5))  # 8

# 在排序中使用 lambda
students = [
    {"name": "Alice", "grade": 85},
    {"name": "Bob", "grade": 92},
    {"name": "Charlie", "grade": 78}
]

# 按成绩排序
sorted_students = sorted(students, key=lambda s: s["grade"])

# 按名称长度排序
words = ["python", "java", "c", "javascript"]
sorted_words = sorted(words, key=lambda w: len(w))

# lambda 与 filter 配合
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = list(filter(lambda x: x % 2 == 0, numbers))

# lambda 与 map 配合
squares = list(map(lambda x: x ** 2, numbers))

# lambda 与 reduce 配合
from functools import reduce
product = reduce(lambda x, y: x * y, numbers)
```

### 装饰器

装饰器可以在不修改函数代码的情况下改变函数的行为：

```python
# 基本装饰器
def log_call(func):
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        result = func(*args, **kwargs)
        print(f"完成 {func.__name__}")
        return result
    return wrapper

@log_call
def greet(name):
    print(f"你好，{name}！")

greet("Alice")
# 输出：
# 调用 greet
# 你好，Alice！
# 完成 greet

# 带参数的装饰器
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def say_hello():
    print("你好！")

say_hello()  # 打印 "你好！" 三次

# 保留函数元数据
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """包装函数"""
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def example():
    """示例函数文档字符串"""
    pass

print(example.__name__)  # "example"（而不是 "wrapper"）
print(example.__doc__)   # "示例函数文档字符串"

# 实用装饰器示例
import time

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 耗时 {end - start:.4f} 秒")
        return result
    return wrapper

def cache(func):
    cached = {}
    @wraps(func)
    def wrapper(*args):
        if args not in cached:
            cached[args] = func(*args)
        return cached[args]
    return wrapper

@timer
@cache
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

### 闭包和作用域

```python
# 变量作用域
global_var = "我是全局变量"

def outer_function():
    enclosing_var = "我是外层变量"

    def inner_function():
        local_var = "我是局部变量"
        print(local_var)       # 局部作用域
        print(enclosing_var)   # 外层作用域
        print(global_var)      # 全局作用域

    inner_function()

# 修改全局变量
counter = 0

def increment():
    global counter
    counter += 1

# 修改外层变量
def outer():
    count = 0

    def inner():
        nonlocal count
        count += 1
        return count

    return inner

increment_counter = outer()
print(increment_counter())  # 1
print(increment_counter())  # 2

# 闭包 - 记住其外层作用域的函数
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))   # 10
print(triple(5))   # 15
```

## 面向对象编程

Python 支持面向对象编程，包括类、继承、封装和多态。

### 类和对象

```python
# 基本类定义
class Dog:
    # 类属性（所有实例共享）
    species = "Canis familiaris"

    # 构造函数（初始化器）
    def __init__(self, name, age):
        # 实例属性
        self.name = name
        self.age = age

    # 实例方法
    def bark(self):
        return f"{self.name} 说汪汪！"

    # 字符串表示
    def __str__(self):
        return f"{self.name}，{self.age} 岁"

    def __repr__(self):
        return f"Dog('{self.name}', {self.age})"

# 创建实例
buddy = Dog("Buddy", 5)
max_dog = Dog("Max", 3)

# 访问属性和方法
print(buddy.name)          # "Buddy"
print(buddy.species)       # "Canis familiaris"
print(buddy.bark())        # "Buddy 说汪汪！"
print(str(buddy))          # "Buddy，5 岁"

# 修改属性
buddy.age = 6
```

### 继承

```python
# 父类
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError("子类必须实现此方法")

    def move(self):
        return f"{self.name} 正在移动"

# 子类
class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # 调用父类构造函数
        self.breed = breed

    def speak(self):
        return f"{self.name} 说汪汪！"

    def fetch(self):
        return f"{self.name} 正在捡球"

class Cat(Animal):
    def speak(self):
        return f"{self.name} 说喵喵！"

    def scratch(self):
        return f"{self.name} 正在抓挠"

# 使用继承
dog = Dog("Buddy", "Golden Retriever")
cat = Cat("Whiskers")

print(dog.speak())         # "Buddy 说汪汪！"
print(cat.speak())         # "Whiskers 说喵喵！"
print(dog.move())          # "Buddy 正在移动"（继承的方法）

# 多态
animals = [Dog("Rex", "German Shepherd"), Cat("Luna")]
for animal in animals:
    print(animal.speak())  # 每个都使用自己的实现

# 多重继承
class Flying:
    def fly(self):
        return "在空中飞翔"

class Swimming:
    def swim(self):
        return "在水中游泳"

class Duck(Animal, Flying, Swimming):
    def speak(self):
        return f"{self.name} 说嘎嘎！"

duck = Duck("Donald")
print(duck.fly())          # "在空中飞翔"
print(duck.swim())         # "在水中游泳"
print(duck.speak())        # "Donald 说嘎嘎！"

# 方法解析顺序（MRO）
print(Duck.__mro__)
```

### 封装

```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner          # 公有属性
        self._balance = balance     # 受保护的（约定）
        self.__pin = "1234"         # 私有的（名称改写）

    # 属性 getter
    @property
    def balance(self):
        return self._balance

    # 属性 setter
    @balance.setter
    def balance(self, value):
        if value < 0:
            raise ValueError("余额不能为负数")
        self._balance = value

    # 只读属性
    @property
    def account_info(self):
        return f"账户所有者：{self.owner}"

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount
            return True
        return False

    def withdraw(self, amount):
        if 0 < amount <= self._balance:
            self._balance -= amount
            return True
        return False

    def _internal_method(self):
        """受保护的方法 - 谨慎使用"""
        pass

    def __private_method(self):
        """私有方法 - 名称改写"""
        pass

# 使用类
account = BankAccount("Alice", 1000)
print(account.balance)     # 1000（使用属性）
account.balance = 1500     # 使用 setter
# account.balance = -100   # 引发 ValueError

account.deposit(500)
print(account.balance)     # 2000

# 私有属性访问（名称改写）
# print(account.__pin)     # AttributeError
print(account._BankAccount__pin)  # "1234"（不推荐）
```

### 类方法和静态方法

```python
class Employee:
    # 类属性
    employee_count = 0
    raise_percentage = 1.05

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary
        Employee.employee_count += 1

    # 普通实例方法
    def apply_raise(self):
        self.salary *= self.raise_percentage

    # 类方法 - 操作类而非实例
    @classmethod
    def set_raise_percentage(cls, percentage):
        cls.raise_percentage = percentage

    @classmethod
    def from_string(cls, employee_string):
        """替代构造函数"""
        name, salary = employee_string.split("-")
        return cls(name, int(salary))

    # 静态方法 - 工具函数
    @staticmethod
    def is_workday(day):
        return day.weekday() < 5

# 使用类方法
Employee.set_raise_percentage(1.10)  # 影响所有实例

emp1 = Employee.from_string("Alice-50000")
emp2 = Employee("Bob", 60000)

print(Employee.employee_count)  # 2

# 使用静态方法
from datetime import date
print(Employee.is_workday(date.today()))
```

### 抽象类和接口

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    """形状的抽象基类"""

    @abstractmethod
    def area(self):
        """计算形状的面积"""
        pass

    @abstractmethod
    def perimeter(self):
        """计算形状的周长"""
        pass

    def describe(self):
        """带有默认实现的非抽象方法"""
        return f"我是一个面积为 {self.area()} 的形状"

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        import math
        return math.pi * self.radius ** 2

    def perimeter(self):
        import math
        return 2 * math.pi * self.radius

# 不能实例化抽象类
# shape = Shape()  # TypeError

rect = Rectangle(5, 3)
circle = Circle(4)

print(rect.area())         # 15
print(circle.area())       # 50.265...
print(rect.describe())     # "我是一个面积为 15 的形状"
```

### 魔术方法（双下划线方法）

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    # 字符串表示
    def __str__(self):
        return f"Vector({self.x}, {self.y})"

    def __repr__(self):
        return f"Vector({self.x!r}, {self.y!r})"

    # 算术运算
    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar):
        return self.__mul__(scalar)

    # 比较
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __lt__(self, other):
        return self.magnitude() < other.magnitude()

    # 长度和真值
    def __len__(self):
        return 2  # 向量有 2 个分量

    def __bool__(self):
        return self.x != 0 or self.y != 0

    # 索引
    def __getitem__(self, index):
        if index == 0:
            return self.x
        elif index == 1:
            return self.y
        raise IndexError("向量索引超出范围")

    # 迭代
    def __iter__(self):
        yield self.x
        yield self.y

    # 可调用
    def __call__(self):
        return self.magnitude()

    def magnitude(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

# 使用魔术方法
v1 = Vector(3, 4)
v2 = Vector(1, 2)

print(v1 + v2)        # Vector(4, 6)
print(v1 - v2)        # Vector(2, 2)
print(v1 * 2)         # Vector(6, 8)
print(2 * v1)         # Vector(6, 8)
print(v1 == v2)       # False
print(v1[0])          # 3
print(list(v1))       # [3, 4]
print(v1())           # 5.0（模长）
```

## 文件 I/O

Python 提供了简单直接的文件读写方法。

### 读取文件

```python
# 基本文件读取
file = open("example.txt", "r")
content = file.read()
file.close()

# 使用 with 语句（推荐 - 自动关闭文件）
with open("example.txt", "r") as file:
    content = file.read()
    print(content)

# 逐行读取
with open("example.txt", "r") as file:
    for line in file:
        print(line.strip())

# 将所有行读入列表
with open("example.txt", "r") as file:
    lines = file.readlines()
    # 或者
    lines = list(file)

# 读取指定数量
with open("example.txt", "r") as file:
    first_100_chars = file.read(100)
    next_line = file.readline()

# 指定编码读取
with open("unicode.txt", "r", encoding="utf-8") as file:
    content = file.read()

# 读取二进制文件
with open("image.png", "rb") as file:
    binary_data = file.read()
```

### 写入文件

```python
# 写入文件（覆盖现有内容）
with open("output.txt", "w") as file:
    file.write("Hello, World!\n")
    file.write("这是新的一行。\n")

# 写入多行
lines = ["第一行", "第二行", "第三行"]
with open("output.txt", "w") as file:
    file.writelines(line + "\n" for line in lines)

# 追加到文件
with open("log.txt", "a") as file:
    file.write("新的日志条目\n")

# 写入二进制数据
with open("binary.dat", "wb") as file:
    file.write(b"\x00\x01\x02\x03")

# 指定编码写入
with open("unicode.txt", "w", encoding="utf-8") as file:
    file.write("Hello, World!")
```

### 处理路径

```python
from pathlib import Path

# 创建 Path 对象
current_dir = Path(".")
home_dir = Path.home()
config_file = Path("/etc/config.ini")

# 路径操作
project_dir = Path("/home/user/project")
source_file = project_dir / "src" / "main.py"

print(source_file.name)        # "main.py"
print(source_file.stem)        # "main"
print(source_file.suffix)      # ".py"
print(source_file.parent)      # "/home/user/project/src"

# 检查路径
print(source_file.exists())
print(source_file.is_file())
print(project_dir.is_dir())

# 列出目录内容
for item in project_dir.iterdir():
    print(item)

# Glob 模式
for py_file in project_dir.glob("**/*.py"):
    print(py_file)

# 使用 Path 读写
config = Path("config.txt")
content = config.read_text()
config.write_text("新内容")

# 创建目录
new_dir = Path("new_folder")
new_dir.mkdir(exist_ok=True)
nested_dir = Path("a/b/c")
nested_dir.mkdir(parents=True, exist_ok=True)
```

### 处理 JSON

```python
import json

# 写入 JSON
data = {
    "name": "Alice",
    "age": 30,
    "cities": ["New York", "London"],
    "active": True
}

# 写入文件
with open("data.json", "w") as file:
    json.dump(data, file, indent=2)

# 转换为字符串
json_string = json.dumps(data, indent=2)

# 读取 JSON
with open("data.json", "r") as file:
    loaded_data = json.load(file)

# 从字符串解析
parsed = json.loads('{"name": "Bob", "age": 25}')

# 自定义 JSON 编码
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

data_with_date = {"timestamp": datetime.now()}
json_str = json.dumps(data_with_date, cls=DateTimeEncoder)
```

### 处理 CSV

```python
import csv

# 写入 CSV
with open("users.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Age", "City"])
    writer.writerow(["Alice", 30, "New York"])
    writer.writerow(["Bob", 25, "London"])

# 读取 CSV
with open("users.csv", "r") as file:
    reader = csv.reader(file)
    header = next(reader)
    for row in reader:
        name, age, city = row
        print(f"{name} 今年 {age} 岁")

# 使用 DictReader 和 DictWriter
with open("users.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row["Name"], row["Age"])

with open("output.csv", "w", newline="") as file:
    fieldnames = ["name", "age", "city"]
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({"name": "Alice", "age": 30, "city": "NYC"})
```

## 模块和包

Python 的模块系统允许你将代码组织成可重用的组件。

### 导入模块

```python
# 导入整个模块
import math
print(math.sqrt(16))       # 4.0
print(math.pi)             # 3.14159...

# 导入特定项
from math import sqrt, pi
print(sqrt(16))
print(pi)

# 带别名导入
import numpy as np
import pandas as pd

# 导入全部（不推荐）
from math import *

# 从包导入
from collections import Counter, defaultdict
from datetime import datetime, timedelta

# 相对导入（在包内）
from . import sibling_module
from .sibling_module import some_function
from .. import parent_module
```

### 创建模块

```python
# mymodule.py
"""这是一个自定义模块。"""

# 模块级常量
PI = 3.14159
VERSION = "1.0.0"

# 模块级函数
def add(a, b):
    """两数相加。"""
    return a + b

def multiply(a, b):
    """两数相乘。"""
    return a * b

# 模块级类
class Calculator:
    def __init__(self):
        self.result = 0

    def add(self, value):
        self.result += value
        return self

# 私有的（按约定）
_internal_state = {}

def _helper_function():
    pass

# 模块直接执行时运行的代码
if __name__ == "__main__":
    print("模块被直接执行")
    print(f"2 + 3 = {add(2, 3)}")
```

### 创建包

```
mypackage/
    __init__.py
    module1.py
    module2.py
    subpackage/
        __init__.py
        module3.py
```

```python
# mypackage/__init__.py
"""我的包描述。"""

from .module1 import function1
from .module2 import function2

__version__ = "1.0.0"
__all__ = ["function1", "function2"]

# mypackage/module1.py
def function1():
    return "来自 module1 的问候"

# mypackage/module2.py
def function2():
    return "来自 module2 的问候"

# 使用方式
from mypackage import function1, function2
import mypackage
print(mypackage.__version__)
```

### 标准库精选

```python
# os - 操作系统接口
import os
print(os.getcwd())              # 当前目录
os.makedirs("new/dir", exist_ok=True)
env_var = os.environ.get("PATH")

# sys - 系统特定参数
import sys
print(sys.version)
print(sys.argv)                 # 命令行参数
sys.exit(0)

# datetime - 日期和时间
from datetime import datetime, timedelta
now = datetime.now()
tomorrow = now + timedelta(days=1)
formatted = now.strftime("%Y-%m-%d %H:%M:%S")

# collections - 容器数据类型
from collections import Counter, defaultdict, deque
counter = Counter("hello")      # {'l': 2, 'h': 1, ...}
dd = defaultdict(list)
dd["key"].append(1)

# itertools - 迭代器函数
from itertools import chain, cycle, combinations
combined = list(chain([1, 2], [3, 4]))
combs = list(combinations([1, 2, 3], 2))

# functools - 高阶函数
from functools import lru_cache, partial

@lru_cache(maxsize=128)
def expensive_function(n):
    return n ** 2

add_five = partial(lambda x, y: x + y, 5)

# re - 正则表达式
import re
pattern = r"\d+"
matches = re.findall(pattern, "abc 123 def 456")
result = re.sub(r"\s+", "_", "hello world")

# random - 随机数生成
import random
random.randint(1, 100)
random.choice(["a", "b", "c"])
random.shuffle([1, 2, 3, 4, 5])

# typing - 类型提示
from typing import List, Dict, Optional, Union, Callable

def process(items: List[int]) -> Dict[str, int]:
    return {"sum": sum(items)}

def maybe_value() -> Optional[str]:
    return None
```

## 最佳实践总结

### 代码风格

1. **遵循 PEP 8** - Python 官方风格指南
2. **使用有意义的名称** - 变量和函数应该自文档化
3. **保持函数简短** - 每个函数应该只做好一件事
4. **编写文档字符串** - 为模块、类和函数编写文档

### 错误处理

1. **具体化** - 捕获具体的异常，而不是通用异常
2. **快速失败** - 尽早验证输入
3. **清理资源** - 使用上下文管理器（with 语句）
4. **记录错误** - 使用 logging 模块而不是 print 语句

### 性能

1. **使用内置函数** - 它们是用 C 优化的
2. **使用生成器** - 对于大型数据集可以节省内存
3. **先分析再优化** - 优化之前先测量
4. **使用合适的数据结构** - 用集合检查成员关系，用字典做查找

### Python 惯用法

```python
# 交换变量
a, b = b, a

# 解包可迭代对象
first, *rest, last = [1, 2, 3, 4, 5]

# 检查空集合
if not my_list:  # 而不是 len(my_list) == 0
    pass

# 使用 enumerate
for i, item in enumerate(items):
    pass

# 使用 zip 进行并行迭代
for a, b in zip(list_a, list_b):
    pass

# 字典 get 带默认值
value = d.get("key", "default")

# 列表推导式优于 map/filter
squares = [x**2 for x in range(10)]

# 上下文管理器管理资源
with open("file.txt") as f:
    pass

# 使用 any/all
if any(x > 0 for x in numbers):
    pass

if all(x > 0 for x in numbers):
    pass
```

## 延伸阅读

### 官方资源

- [Python 官方文档](https://docs.python.org/3/)
- [Python 增强提案（PEPs）](https://peps.python.org/)
- [Python 包索引（PyPI）](https://pypi.org/)

### 推荐书籍

- 《流畅的 Python》- Luciano Ramalho 著
- 《Effective Python》- Brett Slatkin 著
- 《Python Cookbook》- David Beazley 和 Brian K. Jones 著

### 练习平台

- [LeetCode](https://leetcode.com/)
- [HackerRank Python](https://www.hackerrank.com/domains/python)
- [Exercism Python 赛道](https://exercism.org/tracks/python)

### 相关主题

- **虚拟环境**：管理项目依赖
- **类型提示**：使用 mypy 进行静态类型检查
- **测试**：unittest、pytest 框架
- **调试**：pdb 调试器
- **包管理**：pip、poetry、conda

---

> 本指南涵盖了 Python 编程的基础要点。掌握这些概念，为 Web 开发、数据科学或自动化等更高级主题打下坚实基础。坚持练习并探索 Python 丰富的库生态系统，以提升你的技能。
