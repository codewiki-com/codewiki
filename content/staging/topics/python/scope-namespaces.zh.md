---
title: Python 作用域与命名空间 (LEGB 规则)
description: 深入理解 Python 作用域链、命名空间机制、LEGB 查找规则及 global/nonlocal 关键字的使用
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 作用域
  - 命名空间
  - LEGB
  - 闭包
  - 面试
status: imported
origin: old/src/content/docs/python/scope-namespaces.zh.md
divergence: 0.216
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Python
  subcategory: 语言核心
  order: 6
  lastUpdated: 2026-01-07
---

作用域（Scope）和命名空间（Namespace）是 Python 中两个核心概念，它们决定了变量的可见性和生命周期。理解这些概念对于编写清晰、可维护的 Python 代码至关重要，也是掌握闭包、装饰器等高级特性的基础。

## 概念解释

### 什么是命名空间

命名空间是一个从名称到对象的映射。在 Python 中，命名空间本质上就是一个字典，其中键是变量名（字符串），值是变量所引用的对象。

```python
# 命名空间可以理解为这样一个字典
namespace = {
    'x': 10,
    'name': 'Python',
    'func': <function object>,
    'MyClass': <class object>
}
```

不同类型的命名空间：

1. **内置命名空间（Built-in Namespace）**：包含 Python 的内置函数和异常，如 `print`、`len`、`Exception` 等
2. **全局命名空间（Global Namespace）**：模块级别的变量、函数和类定义
3. **局部命名空间（Local Namespace）**：函数内部定义的变量
4. **闭包命名空间（Enclosing Namespace）**：嵌套函数的外层函数的命名空间

### 什么是作用域

作用域是 Python 程序中可以直接访问某个命名空间的文本区域。换句话说，作用域决定了在代码的哪些位置可以访问特定的变量。

作用域是静态的（词法作用域），在代码编写时就确定了，而不是在运行时动态确定。这意味着函数定义时的位置决定了它可以访问哪些变量。

```python
x = "global"

def outer():
    x = "enclosing"

    def inner():
        x = "local"
        print(x)  # 作用域决定了这里访问的是哪个 x

    inner()

outer()  # 输出: local
```

### LEGB 规则

LEGB 是 Python 变量查找顺序的缩写，代表四个作用域层次：

- **L（Local）**：局部作用域，函数内部定义的变量
- **E（Enclosing）**：闭包作用域，外层嵌套函数的作用域
- **G（Global）**：全局作用域，模块级别的变量
- **B（Built-in）**：内置作用域，Python 内置的名称

当 Python 需要查找一个变量时，会按照 L -> E -> G -> B 的顺序依次查找，直到找到为止。如果在所有作用域都找不到，则抛出 `NameError`。

## 核心原理

### 命名空间的生命周期

不同命名空间有不同的创建和销毁时机：

```python
# 内置命名空间：Python 解释器启动时创建，解释器退出时销毁
print  # 内置函数，始终可用

# 全局命名空间：模块被导入时创建，解释器退出时销毁
module_var = "I'm global"

# 局部命名空间：函数被调用时创建，函数返回时销毁
def my_function():
    local_var = "I'm local"  # 函数调用时创建
    return local_var
# 函数返回后，local_var 所在的命名空间被销毁

# 闭包命名空间：特殊情况，被内部函数引用时会保持存活
def outer():
    enclosing_var = "I'm enclosing"

    def inner():
        return enclosing_var  # 引用了外层变量

    return inner

closure = outer()
# outer 函数已返回，但 enclosing_var 仍然存活
print(closure())  # 输出: I'm enclosing
```

### 作用域的静态性

Python 使用词法作用域（Lexical Scoping），这意味着变量的作用域在代码编写时就确定了：

```python
x = "global"

def func():
    print(x)  # Python 在编译时就确定了这里的 x 指向全局变量

func()  # 输出: global

# 动态作用域的语言会在运行时查找，但 Python 不是
def caller():
    x = "local in caller"
    func()  # 仍然输出 global，而不是 "local in caller"

caller()  # 输出: global
```

### 变量解析的时机

一个重要的细节是，Python 在函数定义时就确定了变量属于哪个作用域：

```python
x = 10

def func():
    print(x)  # 这行代码会报错！
    x = 20    # 因为这行赋值使 x 成为局部变量

# func()  # UnboundLocalError: local variable 'x' referenced before assignment
```

Python 在编译 `func` 函数时发现 `x = 20`，于是将 `x` 标记为局部变量。但在执行 `print(x)` 时，局部变量 `x` 还未被赋值，因此抛出 `UnboundLocalError`。

### 命名空间字典

Python 提供了直接访问命名空间的方法：

```python
# 查看全局命名空间
print(globals())  # 返回全局命名空间的字典

# 查看局部命名空间
def show_locals():
    a = 1
    b = 2
    print(locals())  # 返回局部命名空间的字典

show_locals()  # 输出: {'a': 1, 'b': 2}

# 可以动态创建全局变量
globals()['dynamic_var'] = "I was created dynamically"
print(dynamic_var)  # 输出: I was created dynamically
```

## 核心要点

### 四种作用域详解

#### Local（局部作用域）

局部作用域是最内层的作用域，包含函数内定义的变量：

```python
def calculate_area(radius):
    # radius 和 pi、area 都是局部变量
    pi = 3.14159
    area = pi * radius ** 2
    return area

# 在函数外无法访问这些变量
# print(pi)  # NameError: name 'pi' is not defined
```

#### Enclosing（闭包作用域）

当函数嵌套时，内层函数可以访问外层函数的变量：

```python
def outer_function():
    message = "Hello from outer"  # 闭包变量

    def inner_function():
        # inner_function 可以访问 outer_function 的变量
        print(message)

    return inner_function

greet = outer_function()
greet()  # 输出: Hello from outer
```

闭包作用域可以有多层：

```python
def level1():
    x = "level1"

    def level2():
        y = "level2"

        def level3():
            z = "level3"
            # 可以访问所有外层变量
            print(f"x={x}, y={y}, z={z}")

        return level3

    return level2

func = level1()()
func()  # 输出: x=level1, y=level2, z=level3
```

#### Global（全局作用域）

全局作用域包含模块级别的定义：

```python
# 全局变量
APP_NAME = "MyApplication"
VERSION = "1.0.0"

# 全局函数
def global_function():
    pass

# 全局类
class GlobalClass:
    pass

def use_globals():
    # 函数内可以读取全局变量
    print(f"{APP_NAME} v{VERSION}")

use_globals()  # 输出: MyApplication v1.0.0
```

#### Built-in（内置作用域）

内置作用域包含 Python 的内置函数、类型和异常：

```python
# 这些都来自内置作用域
print(len([1, 2, 3]))  # len 是内置函数
print(type(42))        # type 是内置函数
print(str(123))        # str 是内置类型

# 可以查看所有内置名称
import builtins
print(dir(builtins))

# 内置名称可以被覆盖（但不推荐）
len = lambda x: "I'm not the real len!"
print(len([1, 2, 3]))  # 输出: I'm not the real len!

# 恢复原来的 len
del len
print(len([1, 2, 3]))  # 输出: 3
```

### global 关键字

`global` 关键字用于在函数内部声明要使用全局变量，而不是创建局部变量：

```python
counter = 0

def increment():
    global counter  # 声明使用全局变量 counter
    counter += 1

def increment_wrong():
    counter += 1  # 没有 global，这会创建局部变量并报错

increment()
increment()
print(counter)  # 输出: 2

# increment_wrong()  # UnboundLocalError
```

`global` 的常见用法：

```python
# 修改全局变量
total = 0

def add_to_total(value):
    global total
    total += value

add_to_total(10)
add_to_total(20)
print(total)  # 输出: 30

# 在函数内创建全局变量
def create_global():
    global new_variable
    new_variable = "I'm created inside a function but I'm global!"

create_global()
print(new_variable)  # 输出: I'm created inside a function but I'm global!

# 多个 global 声明
def multiple_globals():
    global x, y, z
    x = 1
    y = 2
    z = 3

multiple_globals()
print(x, y, z)  # 输出: 1 2 3
```

### nonlocal 关键字

`nonlocal` 关键字用于在嵌套函数中声明要使用外层函数（非全局）的变量：

```python
def outer():
    count = 0

    def inner():
        nonlocal count  # 声明使用外层函数的 count
        count += 1
        return count

    return inner

counter = outer()
print(counter())  # 输出: 1
print(counter())  # 输出: 2
print(counter())  # 输出: 3
```

`nonlocal` 与 `global` 的区别：

```python
x = "global"

def outer():
    x = "enclosing"

    def inner_with_global():
        global x  # 指向全局变量
        x = "modified by global"

    def inner_with_nonlocal():
        nonlocal x  # 指向外层函数的变量
        x = "modified by nonlocal"

    inner_with_nonlocal()
    print(f"After nonlocal: {x}")  # 输出: After nonlocal: modified by nonlocal

    inner_with_global()
    print(f"After global: {x}")    # 仍然是 modified by nonlocal

outer()
print(f"Global x: {x}")  # 输出: Global x: modified by global
```

`nonlocal` 会查找最近的外层作用域：

```python
def level1():
    x = "level1"

    def level2():
        x = "level2"

        def level3():
            nonlocal x  # 指向 level2 的 x
            x = "modified by level3"

        level3()
        print(f"level2 x: {x}")  # 输出: level2 x: modified by level3

    level2()
    print(f"level1 x: {x}")  # 输出: level1 x: level1 (未被修改)

level1()
```

## 代码示例

### 示例 1：LEGB 查找顺序演示

```python
# Built-in
# print, len, str 等都在 Built-in 作用域

# Global
x = "global x"

def outer():
    # Enclosing
    x = "enclosing x"

    def inner():
        # Local
        x = "local x"
        print(f"Inner sees: {x}")  # 找到 Local 的 x

    inner()
    print(f"Outer sees: {x}")  # 找到 Enclosing 的 x

outer()
print(f"Module sees: {x}")  # 找到 Global 的 x

# 输出:
# Inner sees: local x
# Outer sees: enclosing x
# Module sees: global x
```

### 示例 2：命名空间字典操作

```python
def namespace_demo():
    """演示命名空间字典的使用"""
    a = 1
    b = 2
    c = 3

    # 获取当前局部命名空间
    local_ns = locals()
    print("局部命名空间:", local_ns)

    # 注意：locals() 返回的是一个副本，修改它不会影响实际变量
    local_ns['a'] = 100
    print(f"a 仍然是: {a}")  # 输出: a 仍然是: 1

namespace_demo()

# globals() 返回的是实际的全局命名空间字典
globals()['dynamic_var'] = "动态创建"
print(dynamic_var)  # 输出: 动态创建
```

### 示例 3：使用闭包创建计数器

```python
def make_counter(start=0, step=1):
    """创建一个计数器闭包"""
    count = start

    def counter():
        nonlocal count
        current = count
        count += step
        return current

    def reset():
        nonlocal count
        count = start

    def get_count():
        return count

    # 返回多个闭包函数
    counter.reset = reset
    counter.get = get_count

    return counter

# 使用计数器
counter = make_counter(start=0, step=2)
print(counter())        # 输出: 0
print(counter())        # 输出: 2
print(counter())        # 输出: 4
print(counter.get())    # 输出: 6
counter.reset()
print(counter())        # 输出: 0
```

### 示例 4：作用域与类

```python
class MyClass:
    # 类属性（类命名空间）
    class_var = "I'm a class variable"

    def __init__(self, value):
        # 实例属性（通过 self 访问）
        self.instance_var = value

    def method(self):
        # 方法内的局部变量
        local_var = "I'm local to this method"

        # 访问不同作用域的变量
        print(f"Local: {local_var}")
        print(f"Instance: {self.instance_var}")
        print(f"Class: {self.class_var}")  # 通过 self 或类名访问
        print(f"Class via name: {MyClass.class_var}")

obj = MyClass("instance value")
obj.method()

# 注意：类体内的变量不遵循 LEGB 规则
x = "global"

class Confusing:
    x = "class"

    def method(self):
        print(x)  # 输出 "global"，不是 "class"！
        print(self.x)  # 输出 "class"

Confusing().method()
```

### 示例 5：闭包陷阱与解决方案

```python
# 经典的循环闭包陷阱
def create_multipliers_wrong():
    """错误的实现：所有函数都使用最后的 i 值"""
    multipliers = []
    for i in range(5):
        def multiplier(x):
            return x * i  # i 是自由变量，在调用时才解析
        multipliers.append(multiplier)
    return multipliers

# 测试错误版本
mult_wrong = create_multipliers_wrong()
print([m(2) for m in mult_wrong])  # 输出: [8, 8, 8, 8, 8]

# 解决方案 1：使用默认参数捕获值
def create_multipliers_v1():
    multipliers = []
    for i in range(5):
        def multiplier(x, i=i):  # i=i 在定义时捕获当前值
            return x * i
        multipliers.append(multiplier)
    return multipliers

mult_v1 = create_multipliers_v1()
print([m(2) for m in mult_v1])  # 输出: [0, 2, 4, 6, 8]

# 解决方案 2：使用闭包工厂函数
def create_multipliers_v2():
    def make_multiplier(i):
        def multiplier(x):
            return x * i
        return multiplier

    return [make_multiplier(i) for i in range(5)]

mult_v2 = create_multipliers_v2()
print([m(2) for m in mult_v2])  # 输出: [0, 2, 4, 6, 8]

# 解决方案 3：使用 functools.partial
from functools import partial

def multiplier(i, x):
    return x * i

def create_multipliers_v3():
    return [partial(multiplier, i) for i in range(5)]

mult_v3 = create_multipliers_v3()
print([m(2) for m in mult_v3])  # 输出: [0, 2, 4, 6, 8]

# 解决方案 4：使用 lambda
def create_multipliers_v4():
    return [(lambda x, i=i: x * i) for i in range(5)]

mult_v4 = create_multipliers_v4()
print([m(2) for m in mult_v4])  # 输出: [0, 2, 4, 6, 8]
```

### 示例 6：模拟私有变量

```python
def create_bank_account(initial_balance):
    """使用闭包模拟私有变量"""
    # 私有变量，外部无法直接访问
    _balance = initial_balance
    _transactions = []

    def _record_transaction(type_, amount):
        """私有方法"""
        import datetime
        _transactions.append({
            'type': type_,
            'amount': amount,
            'balance_after': _balance,
            'timestamp': datetime.datetime.now()
        })

    def deposit(amount):
        nonlocal _balance
        if amount <= 0:
            raise ValueError("存款金额必须大于0")
        _balance += amount
        _record_transaction('存款', amount)
        return _balance

    def withdraw(amount):
        nonlocal _balance
        if amount <= 0:
            raise ValueError("取款金额必须大于0")
        if amount > _balance:
            raise ValueError("余额不足")
        _balance -= amount
        _record_transaction('取款', amount)
        return _balance

    def get_balance():
        return _balance

    def get_statement():
        return _transactions.copy()  # 返回副本，防止外部修改

    # 返回公共接口
    return {
        'deposit': deposit,
        'withdraw': withdraw,
        'get_balance': get_balance,
        'get_statement': get_statement
    }

# 使用
account = create_bank_account(1000)
print(account['get_balance']())  # 输出: 1000
account['deposit'](500)
account['withdraw'](200)
print(account['get_balance']())  # 输出: 1300
print(account['get_statement']())

# 无法直接访问 _balance
# print(account['_balance'])  # KeyError
```

## 最佳实践

### 最小化全局变量的使用

全局变量使代码难以理解和测试，应该尽量使用局部变量和参数传递：

```python
# 不推荐
result = []

def process_data(data):
    global result
    result = [x * 2 for x in data]

process_data([1, 2, 3])
print(result)

# 推荐
def process_data(data):
    return [x * 2 for x in data]

result = process_data([1, 2, 3])
print(result)
```

### 使用常量命名约定

对于真正需要的全局变量，使用大写命名表示它们是常量：

```python
# 常量使用大写
MAX_CONNECTIONS = 100
DEFAULT_TIMEOUT = 30
API_BASE_URL = "https://api.example.com"

# 不要修改常量
def get_connection():
    # global MAX_CONNECTIONS  # 不要这样做
    # MAX_CONNECTIONS = 200   # 不要这样做
    pass
```

### 避免覆盖内置名称

覆盖内置名称可能导致难以调试的错误：

```python
# 不推荐
list = [1, 2, 3]  # 覆盖了内置的 list 类型
# list("abc")  # TypeError: 'list' object is not callable

# 推荐
my_list = [1, 2, 3]
items = [1, 2, 3]

# 常见的误用
id = 123  # 覆盖内置的 id 函数
type = "user"  # 覆盖内置的 type 函数
input = "test"  # 覆盖内置的 input 函数

# 推荐使用更具描述性的名称
user_id = 123
item_type = "user"
user_input = "test"
```

### 明确使用 global 和 nonlocal

如果确实需要修改外部变量，应该明确声明：

```python
def make_accumulator(start=0):
    """明确使用 nonlocal 的示例"""
    total = start

    def add(value):
        nonlocal total  # 明确声明意图
        total += value
        return total

    return add

acc = make_accumulator(10)
print(acc(5))   # 输出: 15
print(acc(10))  # 输出: 25
```

### 优先使用类封装状态

对于复杂的状态管理，使用类比闭包更清晰：

```python
# 使用闭包（适合简单场景）
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

# 使用类（适合复杂场景）
class Counter:
    def __init__(self, start=0, step=1):
        self._count = start
        self._step = step

    def __call__(self):
        result = self._count
        self._count += self._step
        return result

    def reset(self):
        self._count = 0

    @property
    def count(self):
        return self._count

# 类的方式更易于扩展和测试
counter = Counter(start=0, step=2)
print(counter())  # 输出: 0
print(counter())  # 输出: 2
counter.reset()
print(counter.count)  # 输出: 0
```

## 常见陷阱

### 陷阱 1：UnboundLocalError

```python
x = 10

def func():
    print(x)  # UnboundLocalError!
    x = 20

# 原因：Python 在编译时发现函数内有 x = 20，将 x 标记为局部变量
# 但在 print(x) 执行时，局部变量 x 还未赋值

# 解决方案 1：使用 global
def func_v1():
    global x
    print(x)
    x = 20

# 解决方案 2：使用不同的变量名
def func_v2():
    print(x)
    local_x = 20
```

### 陷阱 2：闭包中的变量共享

```python
# 问题代码
functions = []
for i in range(3):
    functions.append(lambda: i)

print([f() for f in functions])  # 输出: [2, 2, 2]，不是 [0, 1, 2]

# 解决方案：使用默认参数
functions = []
for i in range(3):
    functions.append(lambda i=i: i)

print([f() for f in functions])  # 输出: [0, 1, 2]
```

### 陷阱 3：类作用域不遵循 LEGB

```python
x = "global"

class A:
    x = "class A"

    # 列表推导式有自己的作用域（Python 3）
    y = [x for _ in range(3)]  # 这里的 x 是什么？

# 在 Python 3 中，列表推导式的 x 查找会跳过类作用域
print(A.y)  # 输出: ['global', 'global', 'global']

# 如果想使用类变量
class B:
    x = "class B"
    y = [x for x in [x] * 3]  # 技巧：先引入一个使用类变量的可迭代对象

    # 或者更清晰的写法
    @classmethod
    def create_y(cls):
        return [cls.x for _ in range(3)]

print(B.y)  # 输出: ['class B', 'class B', 'class B']
```

### 陷阱 4：locals() 的只读性

```python
def modify_locals():
    x = 1
    locals()['x'] = 2  # 尝试修改
    print(x)  # 输出: 1，修改无效！

modify_locals()

# 但 globals() 是可写的
globals()['new_var'] = "created"
print(new_var)  # 输出: created
```

### 陷阱 5：nonlocal 的作用域限制

```python
# nonlocal 不能用于全局变量
x = "global"

def func():
    # nonlocal x  # SyntaxError: no binding for nonlocal 'x' found
    pass

# nonlocal 只能用于嵌套函数
def outer():
    x = "enclosing"

    def inner():
        nonlocal x  # 正确
        x = "modified"

    inner()
    print(x)  # 输出: modified

outer()
```

### 陷阱 6：可变默认参数与闭包

```python
def make_adder_wrong(items=[]):
    """错误示例：可变默认参数"""
    def adder(x):
        items.append(x)
        return items
    return adder

add1 = make_adder_wrong()
add2 = make_adder_wrong()

print(add1(1))  # 输出: [1]
print(add2(2))  # 输出: [1, 2]  # 共享了同一个列表！

# 正确做法
def make_adder_correct(items=None):
    if items is None:
        items = []

    def adder(x):
        items.append(x)
        return items
    return adder

add1 = make_adder_correct()
add2 = make_adder_correct()

print(add1(1))  # 输出: [1]
print(add2(2))  # 输出: [2]  # 独立的列表
```

## 性能考量

### 局部变量访问最快

Python 对局部变量的访问进行了优化，使用 `LOAD_FAST` 指令：

```python
import dis

# 全局变量访问
x = 1

def use_global():
    return x

# 局部变量访问
def use_local():
    x = 1
    return x

print("全局变量:")
dis.dis(use_global)
# LOAD_GLOBAL 指令

print("\n局部变量:")
dis.dis(use_local)
# LOAD_FAST 指令（更快）
```

### 避免频繁的全局变量查找

```python
import math

# 不推荐：每次都查找 math.sqrt
def calculate_distances_slow(points):
    return [math.sqrt(x**2 + y**2) for x, y in points]

# 推荐：将函数引用保存为局部变量
def calculate_distances_fast(points):
    sqrt = math.sqrt  # 局部变量查找更快
    return [sqrt(x**2 + y**2) for x, y in points]

# 性能测试
import timeit

points = [(i, i) for i in range(1000)]

slow_time = timeit.timeit(lambda: calculate_distances_slow(points), number=1000)
fast_time = timeit.timeit(lambda: calculate_distances_fast(points), number=1000)

print(f"慢版本: {slow_time:.4f}s")
print(f"快版本: {fast_time:.4f}s")
print(f"加速: {(slow_time - fast_time) / slow_time * 100:.1f}%")
```

### 闭包的内存开销

```python
import sys

def create_closure():
    large_list = list(range(10000))

    def inner():
        return len(large_list)

    return inner

# 闭包会保持对外部变量的引用
closure = create_closure()
# large_list 不会被垃圾回收

# 如果只需要某些值，考虑提前计算
def create_closure_optimized():
    large_list = list(range(10000))
    length = len(large_list)  # 提前计算

    def inner():
        return length  # 只保持对 length 的引用

    return inner
    # large_list 可以被垃圾回收
```

### 查找顺序的性能影响

```python
import timeit

# 假设我们要多次使用内置函数
def using_builtin():
    result = []
    for i in range(100):
        result.append(len(str(i)))
    return result

# 优化版本：缓存内置函数
def using_local():
    result = []
    _len = len
    _str = str
    _append = result.append
    for i in range(100):
        _append(_len(_str(i)))
    return result

print("使用内置函数:", timeit.timeit(using_builtin, number=10000))
print("使用局部缓存:", timeit.timeit(using_local, number=10000))
```

## 实战场景

### 场景 1：配置管理

```python
"""使用模块级变量管理配置"""

# config.py
_config = {
    'debug': False,
    'database_url': 'sqlite:///app.db',
    'max_connections': 100
}

def get_config(key, default=None):
    """获取配置项"""
    return _config.get(key, default)

def set_config(key, value):
    """设置配置项"""
    _config[key] = value

def update_config(**kwargs):
    """批量更新配置"""
    _config.update(kwargs)

# 使用
# from config import get_config, set_config
#
# debug = get_config('debug')
# set_config('debug', True)
```

### 场景 2：装饰器中的作用域

```python
from functools import wraps
import time

def retry(max_attempts=3, delay=1):
    """带参数的重试装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            last_exception = None

            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    last_exception = e
                    if attempts < max_attempts:
                        time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def unstable_operation():
    import random
    if random.random() < 0.7:
        raise ValueError("随机失败")
    return "成功"

# 使用
try:
    result = unstable_operation()
    print(result)
except ValueError:
    print("最终失败")
```

### 场景 3：状态机实现

```python
def create_traffic_light():
    """使用闭包实现状态机"""
    current_state = 'red'

    states = {
        'red': {'next': 'green', 'duration': 30},
        'green': {'next': 'yellow', 'duration': 25},
        'yellow': {'next': 'red', 'duration': 5}
    }

    def get_state():
        return current_state

    def get_duration():
        return states[current_state]['duration']

    def next_state():
        nonlocal current_state
        current_state = states[current_state]['next']
        return current_state

    def set_state(state):
        nonlocal current_state
        if state in states:
            current_state = state
        else:
            raise ValueError(f"无效状态: {state}")

    return {
        'get_state': get_state,
        'get_duration': get_duration,
        'next': next_state,
        'set': set_state
    }

# 使用
light = create_traffic_light()
print(f"当前: {light['get_state']()}, 持续: {light['get_duration']()}s")  # red, 30s
light['next']()
print(f"当前: {light['get_state']()}, 持续: {light['get_duration']()}s")  # green, 25s
```

### 场景 4：缓存/记忆化

```python
from functools import wraps

def memoize(func):
    """通用记忆化装饰器"""
    cache = {}

    @wraps(func)
    def wrapper(*args, **kwargs):
        # 创建缓存键
        key = (args, tuple(sorted(kwargs.items())))

        if key not in cache:
            cache[key] = func(*args, **kwargs)

        return cache[key]

    # 提供清除缓存的方法
    wrapper.cache_clear = lambda: cache.clear()
    wrapper.cache_info = lambda: {'size': len(cache), 'keys': list(cache.keys())}

    return wrapper

@memoize
def fibonacci(n):
    """计算斐波那契数列"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 使用
print(fibonacci(100))  # 快速计算
print(fibonacci.cache_info())  # 查看缓存状态
```

### 场景 5：依赖注入容器

```python
def create_container():
    """简单的依赖注入容器"""
    _services = {}
    _singletons = {}

    def register(name, factory, singleton=False):
        """注册服务"""
        _services[name] = {
            'factory': factory,
            'singleton': singleton
        }

    def resolve(name):
        """解析服务"""
        if name not in _services:
            raise KeyError(f"服务未注册: {name}")

        service = _services[name]

        if service['singleton']:
            if name not in _singletons:
                _singletons[name] = service['factory'](resolve)
            return _singletons[name]

        return service['factory'](resolve)

    def clear():
        """清除所有注册"""
        _services.clear()
        _singletons.clear()

    return {
        'register': register,
        'resolve': resolve,
        'clear': clear
    }

# 使用
container = create_container()

# 注册服务
container['register']('config', lambda _: {'debug': True}, singleton=True)
# container['register']('logger', lambda c: Logger(c('config')))
# container['register']('database', lambda c: Database(c('config')), singleton=True)

# 解析服务
# config = container['resolve']('config')
# logger = container['resolve']('logger')
```

## 面试要点

### 常见面试题

#### 解释 Python 的 LEGB 规则

**答案要点**：
- L (Local)：函数内部的变量
- E (Enclosing)：嵌套函数的外层函数变量
- G (Global)：模块级别的变量
- B (Built-in)：Python 内置的名称
- 查找顺序是 L -> E -> G -> B

#### global 和 nonlocal 的区别

```python
# global：用于在函数内声明使用全局变量
x = "global"

def func():
    global x
    x = "modified"  # 修改全局变量

# nonlocal：用于在嵌套函数中声明使用外层函数的变量
def outer():
    x = "enclosing"

    def inner():
        nonlocal x
        x = "modified"  # 修改外层函数的变量

    inner()
```

#### 以下代码输出什么？为什么？

```python
x = 1

def func():
    x += 1
    return x

print(func())
```

**答案**：抛出 `UnboundLocalError`。因为 `x += 1` 等价于 `x = x + 1`，Python 在编译时将 `x` 标记为局部变量，但在读取 `x` 时它还未被赋值。

#### 解释闭包中的变量捕获

```python
def make_functions():
    funcs = []
    for i in range(3):
        funcs.append(lambda: i)
    return funcs

result = [f() for f in make_functions()]
print(result)  # 输出什么？
```

**答案**：输出 `[2, 2, 2]`。闭包捕获的是变量的引用而非值，循环结束时 `i` 的值是 2。

#### 如何在函数内创建全局变量？

```python
def create_global():
    global new_var
    new_var = "I'm global now"

create_global()
print(new_var)  # 输出: I'm global now
```

#### locals() 和 globals() 的区别

```python
x = "global"

def func():
    y = "local"
    print(locals())   # 返回局部命名空间的副本 {'y': 'local'}
    print(globals())  # 返回实际的全局命名空间字典

    # 修改 locals() 不会影响实际变量
    locals()['y'] = "changed"
    print(y)  # 仍然是 "local"

    # 修改 globals() 会影响实际变量
    globals()['x'] = "changed"
    print(x)  # 现在是 "changed"
```

### 面试回答模板

当被问到 "解释 Python 的作用域和命名空间" 时：

1. **定义**：
   - 命名空间是名称到对象的映射（字典）
   - 作用域是程序中可以访问命名空间的区域

2. **LEGB 规则**：解释四个层次和查找顺序

3. **关键字**：
   - `global`：在函数内使用/修改全局变量
   - `nonlocal`：在嵌套函数中使用/修改外层函数的变量

4. **注意事项**：
   - 变量在编译时确定作用域
   - 闭包捕获变量引用而非值
   - 避免覆盖内置名称

5. **最佳实践**：
   - 最小化全局变量使用
   - 使用类封装复杂状态
   - 注意循环中的闭包陷阱

## 延伸阅读

### 官方文档

- [Python 作用域和命名空间](https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces)
- [执行模型 - 命名和绑定](https://docs.python.org/3/reference/executionmodel.html#naming-and-binding)
- [global 语句](https://docs.python.org/3/reference/simple_stmts.html#the-global-statement)
- [nonlocal 语句](https://docs.python.org/3/reference/simple_stmts.html#the-nonlocal-statement)

### 推荐书籍

- 《流畅的 Python》第 7 章：函数装饰器和闭包
- 《Python Cookbook》第 7 章：函数
- 《Effective Python》第 21 条：了解闭包如何与变量作用域进行交互

### 相关主题

- **闭包**：深入理解闭包的创建和使用
- **装饰器**：作用域在装饰器中的应用
- **描述符**：另一种属性访问控制机制
- **元类**：类创建时的命名空间处理

## 总结

Python 的作用域和命名空间是理解变量访问和管理的基础。核心要点：

1. **LEGB 规则**：Local -> Enclosing -> Global -> Built-in 的查找顺序
2. **静态作用域**：变量的作用域在代码编写时确定，而非运行时
3. **global 和 nonlocal**：用于在内层作用域中声明使用外层变量
4. **命名空间字典**：`globals()` 和 `locals()` 提供对命名空间的访问
5. **闭包特性**：捕获变量引用而非值，注意循环陷阱

掌握这些概念对于：
- 编写清晰、可维护的代码
- 理解和使用闭包、装饰器等高级特性
- 避免常见的变量作用域错误
- 通过技术面试

都至关重要。在实际开发中，应该遵循最小化全局变量、避免覆盖内置名称等最佳实践，写出更加 Pythonic 的代码。
