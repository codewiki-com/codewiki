---
title: Python 变量与数据类型
description: 深入理解 Python 变量声明、基本数据类型、类型转换与动态类型特性
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - 变量
  - 数据类型
  - 动态类型
status: imported
origin: old/src/content/docs/python/variables-data-types.zh.md
divergence: 0.163
issues: []
legacy:
  category: Python
  subcategory: 语言基础
  order: 1
  lastUpdated: 2026-01-07
---

Python 是一门动态类型语言,变量系统灵活且强大。本文将深入探讨 Python 中的变量声明、基本数据类型、类型转换以及动态类型特性。

## 变量声明

### 基本变量声明

Python 中不需要显式声明变量类型,直接赋值即可创建变量:

```python
# 整数
age = 25

# 浮点数
price = 19.99

# 字符串
name = "张三"

# 布尔值
is_student = True

# 空值
result = None
```

### 变量命名规则

Python 变量命名需要遵循以下规则:

```python
# 正确的命名
user_name = "李四"
userName = "王五"  # 驼峰命名
_private_var = 42  # 下划线开头表示私有
MAX_SIZE = 100     # 常量使用全大写

# 错误的命名(会导致语法错误)
# 2nd_var = 10      # 不能以数字开头
# user-name = "赵六" # 不能使用连字符
# class = "Python"  # 不能使用保留字
```

### 多重赋值

Python 支持同时为多个变量赋值:

```python
# 同时赋相同值
x = y = z = 0

# 同时赋不同值
a, b, c = 1, 2, 3

# 交换变量(Python 特有的优雅方式)
x, y = 10, 20
x, y = y, x  # 交换后 x=20, y=10

# 解包列表
numbers = [1, 2, 3]
first, second, third = numbers
```

## 基本数据类型

### 整数(int)

Python 3 中整数没有大小限制,可以表示任意大的整数:

```python
# 基本整数
count = 100
negative = -50

# 不同进制表示
binary = 0b1010      # 二进制,值为 10
octal = 0o12         # 八进制,值为 10
hexadecimal = 0xA    # 十六进制,值为 10

# 大整数(无限制)
big_number = 123456789012345678901234567890

# 使用下划线提高可读性(Python 3.6+)
million = 1_000_000
```

### 浮点数(float)

浮点数用于表示小数:

```python
# 基本浮点数
pi = 3.14159
temperature = -5.5

# 科学计数法
speed_of_light = 3e8      # 3 * 10^8
electron_mass = 9.109e-31 # 9.109 * 10^-31

# 浮点数精度问题
result = 0.1 + 0.2
print(result)  # 输出: 0.30000000000000004

# 使用 decimal 模块解决精度问题
from decimal import Decimal
accurate = Decimal('0.1') + Decimal('0.2')
print(accurate)  # 输出: 0.3
```

### 字符串(str)

字符串是不可变的字符序列:

```python
# 单引号和双引号
name = '张三'
greeting = "你好,世界!"

# 三引号(多行字符串)
multiline = """这是
一个多行
字符串"""

# 原始字符串(忽略转义字符)
path = r'C:\Users\name\Desktop'

# f-string 格式化(Python 3.6+)
age = 25
message = f"我今年 {age} 岁"

# 字符串操作
text = "Python"
print(text[0])        # 'P' - 索引
print(text[-1])       # 'n' - 负索引
print(text[0:3])      # 'Pyt' - 切片
print(text * 2)       # 'PythonPython' - 重复
print('Py' in text)   # True - 成员检查

# 常用字符串方法
s = "  Hello World  "
print(s.strip())      # 'Hello World' - 去除空白
print(s.lower())      # '  hello world  ' - 转小写
print(s.upper())      # '  HELLO WORLD  ' - 转大写
print(s.replace('World', 'Python'))  # 替换
```

### 布尔值(bool)

布尔值只有两个值:`True` 和 `False`:

```python
# 基本布尔值
is_active = True
is_deleted = False

# 比较运算返回布尔值
print(5 > 3)      # True
print(10 == 10)   # True
print(7 != 7)     # False

# 逻辑运算
print(True and False)   # False
print(True or False)    # True
print(not True)         # False

# 真值测试(Truthy/Falsy)
# 以下值被视为 False:
print(bool(0))          # False
print(bool(0.0))        # False
print(bool(''))         # False - 空字符串
print(bool([]))         # False - 空列表
print(bool({}))         # False - 空字典
print(bool(None))       # False

# 其他非零、非空值为 True
print(bool(42))         # True
print(bool('hello'))    # True
print(bool([1, 2]))     # True
```

### 空值(None)

`None` 是 Python 的特殊值,表示"无"或"空":

```python
# None 的使用
result = None

# 检查 None
if result is None:
    print("结果为空")

# None 是单例对象
a = None
b = None
print(a is b)  # True

# 函数默认返回 None
def no_return():
    pass

print(no_return())  # None
```

## 类型转换

### 显式类型转换

Python 提供内置函数进行类型转换:

```python
# 转换为整数
print(int(3.14))        # 3 - 浮点数转整数(截断)
print(int('100'))       # 100 - 字符串转整数
print(int('1010', 2))   # 10 - 二进制字符串转整数
print(int(True))        # 1 - 布尔值转整数
print(int(False))       # 0

# 转换为浮点数
print(float(42))        # 42.0
print(float('3.14'))    # 3.14
print(float('inf'))     # inf - 无穷大

# 转换为字符串
print(str(123))         # '123'
print(str(3.14))        # '3.14'
print(str(True))        # 'True'
print(str([1, 2, 3]))   # '[1, 2, 3]'

# 转换为布尔值
print(bool(1))          # True
print(bool(0))          # False
print(bool(''))         # False
print(bool('False'))    # True - 非空字符串
```

### 类型转换陷阱

```python
# 字符串转整数失败
try:
    num = int('3.14')  # ValueError: invalid literal
except ValueError as e:
    print(f"转换错误: {e}")

# 正确方式:先转浮点数再转整数
num = int(float('3.14'))  # 3

# 浮点数精度损失
large_int = 10**20
float_num = float(large_int)
back_to_int = int(float_num)
print(large_int == back_to_int)  # 可能为 False

# 字符串拼接类型错误
age = 25
# message = "我今年 " + age + " 岁"  # TypeError
message = "我今年 " + str(age) + " 岁"  # 正确
# 或使用 f-string
message = f"我今年 {age} 岁"  # 推荐
```

## 动态类型特性

### 动态类型绑定

Python 变量可以在运行时改变类型:

```python
# 变量可以重新绑定到不同类型
x = 42          # x 是整数
print(type(x))  # <class 'int'>

x = "hello"     # x 现在是字符串
print(type(x))  # <class 'str'>

x = [1, 2, 3]   # x 现在是列表
print(type(x))  # <class 'list'>
```

### 类型注解(Type Hints)

Python 3.5+ 支持类型注解,但不强制执行:

```python
# 基本类型注解
age: int = 25
name: str = "张三"
price: float = 19.99
is_active: bool = True

# 函数类型注解
def greet(name: str) -> str:
    return f"你好, {name}!"

def add(a: int, b: int) -> int:
    return a + b

# 复杂类型注解
from typing import List, Dict, Optional, Union

numbers: List[int] = [1, 2, 3]
user_data: Dict[str, Union[str, int]] = {
    "name": "李四",
    "age": 30
}

def find_user(user_id: int) -> Optional[str]:
    """返回用户名,如果不存在返回 None"""
    if user_id == 1:
        return "张三"
    return None

# 注意:类型注解不会影响运行时行为
def add_numbers(a: int, b: int) -> int:
    return a + b

result = add_numbers("hello", "world")  # 不会报错,运行时会执行
print(result)  # 'helloworld'
```

### 类型检查工具

使用 mypy 等工具进行静态类型检查:

```python
# 使用 mypy 检查类型错误
def calculate_area(width: int, height: int) -> int:
    return width * height

# mypy 会检测到以下错误
# area = calculate_area(5.5, 10)  # error: Argument 1 has incompatible type "float"

# 运行时类型检查
def process_data(data: int) -> str:
    if not isinstance(data, int):
        raise TypeError(f"期望 int 类型,得到 {type(data)}")
    return f"处理数据: {data}"
```

## 类型检查

### 使用 type() 和 isinstance()

```python
# type() - 获取对象类型
x = 42
print(type(x))           # <class 'int'>
print(type(x) == int)    # True

# isinstance() - 检查对象是否是特定类型(推荐)
print(isinstance(x, int))            # True
print(isinstance(x, (int, float)))   # True - 检查多个类型

# isinstance() 支持继承检查
class Animal:
    pass

class Dog(Animal):
    pass

dog = Dog()
print(isinstance(dog, Dog))      # True
print(isinstance(dog, Animal))   # True - 继承关系
print(type(dog) == Animal)       # False - type() 不考虑继承

# 检查多种类型
value = 3.14
if isinstance(value, (int, float)):
    print("这是一个数字")
```

### 类型判断最佳实践

```python
# 不推荐:直接比较类型
x = 42
if type(x) == int:
    print("是整数")

# 推荐:使用 isinstance()
if isinstance(x, int):
    print("是整数")

# 更好的方式:鸭子类型(Duck Typing)
def process_sequence(seq):
    """接受任何可迭代对象"""
    try:
        for item in seq:
            print(item)
    except TypeError:
        print("对象不可迭代")

# 使用 hasattr() 检查属性
def save_data(obj):
    if hasattr(obj, 'save'):
        obj.save()
    else:
        print("对象没有 save 方法")
```

## 最佳实践

### 变量命名约定

```python
# 使用有意义的变量名
# 不好
x = 100
d = {}

# 好
max_connections = 100
user_data = {}

# 使用 snake_case 命名变量和函数
user_name = "张三"
def calculate_total_price():
    pass

# 使用 UPPER_CASE 命名常量
MAX_RETRY_COUNT = 3
API_BASE_URL = "https://api.example.com"

# 私有变量使用下划线前缀
_internal_cache = {}
```

### 类型提示使用

```python
from typing import List, Dict, Optional

# 为公共 API 添加类型提示
def get_user_names(user_ids: List[int]) -> List[str]:
    """获取用户名列表"""
    return [f"用户{uid}" for uid in user_ids]

# 使用 Optional 表示可能为 None
def find_user(user_id: int) -> Optional[Dict[str, str]]:
    """查找用户,可能返回 None"""
    if user_id > 0:
        return {"name": "张三", "email": "zhangsan@example.com"}
    return None
```

### 避免可变默认参数

```python
# 错误:可变默认参数
def add_item(item, items=[]):  # 危险!
    items.append(item)
    return items

list1 = add_item(1)  # [1]
list2 = add_item(2)  # [1, 2] - 意外!

# 正确:使用 None 作为默认值
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

list1 = add_item(1)  # [1]
list2 = add_item(2)  # [2] - 正确!
```

### 使用 is 检查 None

```python
# 推荐:使用 is 检查 None
value = None
if value is None:
    print("值为空")

# 不推荐:使用 ==
if value == None:  # 可行但不符合惯例
    print("值为空")

# is 检查身份,== 检查相等性
a = []
b = []
print(a == b)   # True - 值相等
print(a is b)   # False - 不是同一对象
```

## 常见陷阱

### 浮点数精度问题

```python
# 浮点数计算不精确
print(0.1 + 0.2 == 0.3)  # False!
print(0.1 + 0.2)         # 0.30000000000000004

# 解决方案 1:使用 math.isclose()
import math
print(math.isclose(0.1 + 0.2, 0.3))  # True

# 解决方案 2:使用 decimal 模块
from decimal import Decimal
result = Decimal('0.1') + Decimal('0.2')
print(result == Decimal('0.3'))  # True

# 解决方案 3:四舍五入比较
print(round(0.1 + 0.2, 2) == 0.3)  # True
```

### 整数除法

```python
# Python 3 中 / 始终返回浮点数
print(10 / 3)    # 3.3333333333333335
print(10 / 2)    # 5.0 - 注意是浮点数

# 使用 // 进行整数除法(向下取整)
print(10 // 3)   # 3
print(-10 // 3)  # -4 (向下取整,不是截断)

# 取模运算
print(10 % 3)    # 1
```

### 字符串不可变性

```python
# 字符串是不可变的
text = "Python"
# text[0] = 'p'  # TypeError: 'str' object does not support item assignment

# 正确方式:创建新字符串
text = 'p' + text[1:]  # 'python'

# 大量字符串拼接使用 join()
# 不推荐(效率低)
result = ""
for i in range(1000):
    result += str(i)

# 推荐(效率高)
result = ''.join(str(i) for i in range(1000))
```

### 类型转换陷阱

```python
# 布尔值转整数
print(int(True))   # 1
print(int(False))  # 0

# 意外的布尔运算结果
print(True + True)   # 2
print(True * 5)      # 5

# 空字符串和 '0' 的真值
print(bool(''))      # False
print(bool('0'))     # True - 非空字符串
print(bool('False')) # True - 非空字符串

# 比较运算符链式使用
x = 5
print(1 < x < 10)    # True - 等价于 1 < x and x < 10
print(x == 5 == True)  # False - 5 == True 为 False
```

### 可变对象作为默认参数

```python
# 陷阱:列表作为默认参数
def append_to_list(item, target=[]):
    target.append(item)
    return target

# 每次调用都使用同一个列表对象
print(append_to_list(1))  # [1]
print(append_to_list(2))  # [1, 2] - 意外!
print(append_to_list(3))  # [1, 2, 3] - 意外!

# 正确做法
def append_to_list(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target

print(append_to_list(1))  # [1]
print(append_to_list(2))  # [2] - 正确!
```

## 总结

Python 的变量和数据类型系统具有以下特点:

1. **动态类型**: 变量类型在运行时确定,可以随时改变
2. **强类型**: 不会自动进行不安全的类型转换
3. **丰富的内置类型**: int、float、str、bool、None 等基本类型
4. **类型注解**: 支持可选的类型提示,提高代码可读性
5. **灵活性**: 鸭子类型和多态性使代码更加灵活

掌握这些基础知识是编写高质量 Python 代码的第一步。建议结合实际项目练习,深入理解 Python 的类型系统和最佳实践。

## 参考资源

- [Python 官方文档 - 内置类型](https://docs.python.org/zh-cn/3/library/stdtypes.html)
- [PEP 484 - Type Hints](https://www.python.org/dev/peps/pep-0484/)
- [PEP 8 - Python 代码风格指南](https://www.python.org/dev/peps/pep-0008/)
