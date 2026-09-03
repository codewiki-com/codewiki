---
title: Python 函数定义与调用
description: 深入学习 Python 函数定义、参数类型、返回值与高级函数特性
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - 函数
  - 参数
  - 返回值
status: imported
origin: old/src/content/docs/python/functions.zh.md
divergence: 0.215
issues: []
legacy:
  category: Python
  subcategory: 语言基础
  order: 3
  lastUpdated: 2026-01-07
---

函数是组织好的、可重复使用的代码块，用于实现单一或相关联功能。本文将深入介绍 Python 函数的各种特性和用法。

## 函数定义基础

使用 `def` 关键字定义函数，基本语法如下：

```python
def function_name(parameters):
    """文档字符串"""
    # 函数体
    return value
```

### 简单函数示例

```python
def greet(name):
    """向指定的人打招呼"""
    return f"你好，{name}！"

# 调用函数
message = greet("小明")
print(message)  # 输出：你好，小明！
```

### 无参数函数

```python
def say_hello():
    """简单的问候函数"""
    print("Hello, World!")

say_hello()  # 输出：Hello, World!
```

## 参数类型详解

Python 支持多种参数类型，提供了灵活的函数调用方式。

### 位置参数（Positional Arguments）

位置参数是最常见的参数类型，按照定义顺序传递：

```python
def calculate_rectangle_area(length, width):
    """计算矩形面积"""
    return length * width

# 按位置传递参数
area = calculate_rectangle_area(5, 3)
print(f"面积: {area}")  # 输出：面积: 15
```

### 关键字参数（Keyword Arguments）

使用参数名称传递参数，不依赖顺序：

```python
def introduce_person(name, age, city):
    """介绍一个人"""
    return f"{name}，{age}岁，来自{city}"

# 使用关键字参数
info = introduce_person(age=25, city="北京", name="张三")
print(info)  # 输出：张三，25岁，来自北京

# 混合使用位置参数和关键字参数
info2 = introduce_person("李四", age=30, city="上海")
print(info2)  # 输出：李四，30岁，来自上海
```

### 默认参数（Default Arguments）

为参数设置默认值，调用时可以省略：

```python
def make_coffee(size="中杯", sugar=1, milk=False):
    """制作咖啡"""
    coffee = f"{size}咖啡，{sugar}份糖"
    if milk:
        coffee += "，加奶"
    return coffee

# 使用默认参数
print(make_coffee())  # 输出：中杯咖啡，1份糖
print(make_coffee("大杯"))  # 输出：大杯咖啡，1份糖
print(make_coffee(sugar=2, milk=True))  # 输出：中杯咖啡，2份糖，加奶
```

**注意**：默认参数必须放在非默认参数之后。

```python
# 错误示例
# def wrong_function(a=1, b):  # SyntaxError
#     pass

# 正确示例
def correct_function(b, a=1):
    return a + b
```

### 可变位置参数（*args）

使用 `*args` 接收任意数量的位置参数，以元组形式存储：

```python
def sum_numbers(*args):
    """计算所有数字的和"""
    total = 0
    for num in args:
        total += num
    return total

print(sum_numbers(1, 2, 3))  # 输出：6
print(sum_numbers(10, 20, 30, 40, 50))  # 输出：150
```

```python
def print_students(class_name, *students):
    """打印班级学生名单"""
    print(f"{class_name}班级学生：")
    for student in students:
        print(f"  - {student}")

print_students("三年级一班", "小明", "小红", "小刚", "小丽")
# 输出：
# 三年级一班级学生：
#   - 小明
#   - 小红
#   - 小刚
#   - 小丽
```

### 可变关键字参数（**kwargs）

使用 `**kwargs` 接收任意数量的关键字参数，以字典形式存储：

```python
def create_user(**kwargs):
    """创建用户信息"""
    user = {}
    for key, value in kwargs.items():
        user[key] = value
    return user

user1 = create_user(name="王五", age=28, city="深圳", job="工程师")
print(user1)
# 输出：{'name': '王五', 'age': 28, 'city': '深圳', 'job': '工程师'}
```

```python
def build_profile(first, last, **user_info):
    """构建用户档案"""
    profile = {
        'first_name': first,
        'last_name': last
    }
    profile.update(user_info)
    return profile

user_profile = build_profile(
    "李", "明",
    location="杭州",
    field="计算机科学",
    hobby="篮球"
)
print(user_profile)
# 输出：{'first_name': '李', 'last_name': '明', 'location': '杭州',
#       'field': '计算机科学', 'hobby': '篮球'}
```

### 组合使用不同参数类型

参数顺序必须是：位置参数 → 默认参数 → *args → **kwargs

```python
def complex_function(a, b, c=3, *args, **kwargs):
    """演示组合使用各种参数"""
    print(f"位置参数 a: {a}")
    print(f"位置参数 b: {b}")
    print(f"默认参数 c: {c}")
    print(f"可变位置参数 args: {args}")
    print(f"可变关键字参数 kwargs: {kwargs}")

complex_function(1, 2, 4, 5, 6, x=10, y=20)
# 输出：
# 位置参数 a: 1
# 位置参数 b: 2
# 默认参数 c: 4
# 可变位置参数 args: (5, 6)
# 可变关键字参数 kwargs: {'x': 10, 'y': 20}
```

### 仅限关键字参数（Keyword-Only Arguments）

在 `*` 之后定义的参数必须使用关键字传递：

```python
def create_connection(host, port, *, timeout=30, ssl=True):
    """创建网络连接"""
    return f"连接到 {host}:{port}，超时：{timeout}秒，SSL：{ssl}"

# 正确调用
print(create_connection("localhost", 8080, timeout=60, ssl=False))

# 错误调用
# print(create_connection("localhost", 8080, 60, False))  # TypeError
```

### 仅限位置参数（Positional-Only Arguments）

Python 3.8+ 支持使用 `/` 标记仅限位置参数：

```python
def divide(a, b, /):
    """除法运算，参数只能使用位置传递"""
    return a / b

print(divide(10, 2))  # 输出：5.0

# 错误调用
# print(divide(a=10, b=2))  # TypeError
```

## 返回值

### 单个返回值

```python
def square(x):
    """计算平方"""
    return x ** 2

result = square(5)
print(result)  # 输出：25
```

### 多个返回值

Python 函数可以返回多个值（实际返回一个元组）：

```python
def get_min_max(numbers):
    """返回列表的最小值和最大值"""
    return min(numbers), max(numbers)

nums = [3, 7, 2, 9, 1, 5]
minimum, maximum = get_min_max(nums)
print(f"最小值: {minimum}, 最大值: {maximum}")
# 输出：最小值: 1, 最大值: 9
```

```python
def calculate_circle(radius):
    """计算圆的周长和面积"""
    import math
    circumference = 2 * math.pi * radius
    area = math.pi * radius ** 2
    return circumference, area

c, a = calculate_circle(5)
print(f"周长: {c:.2f}, 面积: {a:.2f}")
# 输出：周长: 31.42, 面积: 78.54
```

### 无返回值

没有 `return` 语句或 `return` 后无值的函数返回 `None`：

```python
def print_message(msg):
    """打印消息，无返回值"""
    print(msg)

result = print_message("Hello")
print(result)  # 输出：None
```

### 提前返回

```python
def find_first_negative(numbers):
    """查找第一个负数"""
    for num in numbers:
        if num < 0:
            return num
    return None

nums = [1, 5, -3, 8, -2]
first_neg = find_first_negative(nums)
print(first_neg)  # 输出：-3
```

## 函数注解（Function Annotations）

Python 3.0+ 支持函数注解，用于提供类型提示和文档说明：

```python
def greet_user(name: str, age: int) -> str:
    """
    问候用户

    参数:
        name: 用户名
        age: 用户年龄

    返回:
        问候字符串
    """
    return f"你好，{name}！你今年{age}岁了。"

message = greet_user("小华", 20)
print(message)
```

### 复杂类型注解

```python
from typing import List, Dict, Tuple, Optional

def process_data(
    items: List[int],
    config: Dict[str, str],
    threshold: Optional[float] = None
) -> Tuple[int, float]:
    """
    处理数据

    参数:
        items: 整数列表
        config: 配置字典
        threshold: 可选的阈值

    返回:
        处理后的计数和平均值
    """
    count = len(items)
    average = sum(items) / count if count > 0 else 0.0
    return count, average

result = process_data([1, 2, 3, 4, 5], {"mode": "fast"})
print(result)  # 输出：(5, 3.0)
```

## 文档字符串（Docstring）

文档字符串是函数的说明文档，使用三引号定义：

```python
def calculate_bmi(weight: float, height: float) -> float:
    """
    计算身体质量指数（BMI）

    BMI = 体重(kg) / 身高(m)²

    参数:
        weight (float): 体重，单位为千克
        height (float): 身高，单位为米

    返回:
        float: BMI 值

    示例:
        >>> calculate_bmi(70, 1.75)
        22.86

    注意:
        身高必须大于 0，否则会引发 ValueError
    """
    if height <= 0:
        raise ValueError("身高必须大于 0")

    bmi = weight / (height ** 2)
    return round(bmi, 2)

# 访问文档字符串
print(calculate_bmi.__doc__)

# 查看帮助信息
help(calculate_bmi)
```

### Google 风格文档字符串

```python
def fetch_user_data(user_id: int, include_posts: bool = False) -> dict:
    """获取用户数据

    Args:
        user_id (int): 用户ID
        include_posts (bool, optional): 是否包含用户发帖. 默认为 False.

    Returns:
        dict: 包含用户信息的字典

    Raises:
        ValueError: 当 user_id 小于 0 时抛出
        ConnectionError: 当无法连接到数据库时抛出

    Examples:
        >>> fetch_user_data(123)
        {'id': 123, 'name': '张三', 'email': 'zhangsan@example.com'}

        >>> fetch_user_data(123, include_posts=True)
        {'id': 123, 'name': '张三', 'posts': [...]}
    """
    if user_id < 0:
        raise ValueError("用户ID不能为负数")

    # 模拟数据获取
    user_data = {'id': user_id, 'name': '张三', 'email': 'zhangsan@example.com'}

    if include_posts:
        user_data['posts'] = ['帖子1', '帖子2']

    return user_data
```

## 高级函数特性

### Lambda 函数

Lambda 函数是小型匿名函数：

```python
# 普通函数
def add(x, y):
    return x + y

# Lambda 函数
add_lambda = lambda x, y: x + y

print(add(3, 5))  # 输出：8
print(add_lambda(3, 5))  # 输出：8

# 在排序中使用 lambda
students = [
    {'name': '小明', 'score': 85},
    {'name': '小红', 'score': 92},
    {'name': '小刚', 'score': 78}
]

sorted_students = sorted(students, key=lambda s: s['score'], reverse=True)
print(sorted_students)
# 输出：[{'name': '小红', 'score': 92}, {'name': '小明', 'score': 85},
#       {'name': '小刚', 'score': 78}]
```

### 递归函数

函数调用自身：

```python
def factorial(n: int) -> int:
    """
    计算阶乘

    Args:
        n: 非负整数

    Returns:
        n 的阶乘
    """
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 输出：120


def fibonacci(n: int) -> int:
    """
    计算斐波那契数列第 n 项

    Args:
        n: 项数（从 0 开始）

    Returns:
        第 n 项的值
    """
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i), end=' ')
# 输出：0 1 1 2 3 5 8 13 21 34
```

### 嵌套函数与闭包

```python
def outer_function(x):
    """外部函数"""
    def inner_function(y):
        """内部函数 - 闭包"""
        return x + y
    return inner_function

add_5 = outer_function(5)
print(add_5(3))  # 输出：8
print(add_5(10))  # 输出：15
```

```python
def make_multiplier(factor):
    """创建乘法器函数"""
    def multiplier(number):
        return number * factor
    return multiplier

times_3 = make_multiplier(3)
times_5 = make_multiplier(5)

print(times_3(10))  # 输出：30
print(times_5(10))  # 输出：50
```

### 装饰器基础

```python
def timer_decorator(func):
    """计时装饰器"""
    import time

    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} 执行时间: {end_time - start_time:.4f} 秒")
        return result

    return wrapper

@timer_decorator
def slow_function():
    """模拟耗时操作"""
    import time
    time.sleep(1)
    return "完成"

result = slow_function()
# 输出：slow_function 执行时间: 1.0001 秒
```

## 实用示例

### 参数解包

```python
def calculate_total(price, quantity, discount=0):
    """计算总价"""
    return price * quantity * (1 - discount)

# 使用元组解包
order1 = (100, 2)
print(calculate_total(*order1))  # 输出：200

# 使用字典解包
order2 = {'price': 100, 'quantity': 2, 'discount': 0.1}
print(calculate_total(**order2))  # 输出：180.0
```

### 可调用对象检查

```python
def my_function():
    pass

class MyClass:
    def __call__(self):
        return "我是可调用对象"

print(callable(my_function))  # 输出：True
print(callable(MyClass()))  # 输出：True
print(callable(123))  # 输出：False
```

### 函数作为参数

```python
def apply_operation(numbers: List[int], operation) -> List[int]:
    """对列表中每个元素应用操作"""
    return [operation(num) for num in numbers]

nums = [1, 2, 3, 4, 5]

# 使用内置函数
doubled = apply_operation(nums, lambda x: x * 2)
print(doubled)  # 输出：[2, 4, 6, 8, 10]

# 使用自定义函数
def square(x):
    return x ** 2

squared = apply_operation(nums, square)
print(squared)  # 输出：[1, 4, 9, 16, 25]
```

## 最佳实践

1. **函数应该只做一件事**：保持函数功能单一，易于理解和测试
2. **使用描述性的函数名**：函数名应清楚地表达其功能
3. **限制参数数量**：通常不超过 3-4 个参数，过多参数考虑使用对象
4. **编写文档字符串**：为所有公开函数添加清晰的文档
5. **使用类型注解**：提高代码可读性和可维护性
6. **避免修改可变默认参数**：使用 `None` 作为默认值

```python
# 不推荐
def append_to_list(item, target_list=[]):
    target_list.append(item)
    return target_list

# 推荐
def append_to_list(item, target_list=None):
    if target_list is None:
        target_list = []
    target_list.append(item)
    return target_list
```

## 总结

Python 函数是代码复用和模块化的基础。本文介绍了：

- 函数的基本定义和调用
- 各种参数类型：位置参数、关键字参数、默认参数、*args、**kwargs
- 返回值的使用
- 函数注解和文档字符串
- Lambda 函数、递归、闭包等高级特性

掌握这些知识能够帮助你编写更加灵活、可维护的 Python 代码。
