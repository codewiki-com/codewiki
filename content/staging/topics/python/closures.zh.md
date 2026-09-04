---
title: Python 闭包
description: 深入理解 Python 闭包：自由变量、__closure__ 属性、闭包原理与实战应用
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 闭包
  - 自由变量
  - 高阶函数
  - 函数式编程
status: imported
origin: old/src/content/docs/python/closures.zh.md
divergence: 0.208
issues:
  - missing-subcategory-en
legacy:
  category: Python
  subcategory: 函数式编程
  order: 7
  lastUpdated: 2026-01-07
---

闭包（Closure）是函数式编程中的核心概念之一，也是 Python 中实现数据封装、状态保持和装饰器的基础。理解闭包对于编写优雅、高效的 Python 代码至关重要。

## 概念解释

### 什么是闭包

**闭包**是指一个函数对象，它记住了其定义时所在作用域中的变量，即使该作用域已经执行完毕。换句话说，闭包是一个内部函数，它携带着外部函数作用域中变量的引用。

闭包的三个必要条件：

1. **存在嵌套函数**：必须有一个内部函数定义在外部函数内
2. **内部函数引用外部变量**：内部函数必须使用外部函数作用域中的变量（自由变量）
3. **外部函数返回内部函数**：外部函数必须将内部函数作为返回值

```python
def outer_function(x):
    """外部函数"""
    # x 是外部函数的局部变量

    def inner_function(y):
        """内部函数 - 这就是闭包"""
        # inner_function 引用了外部变量 x
        return x + y

    return inner_function  # 返回内部函数

# 创建闭包
add_5 = outer_function(5)
add_10 = outer_function(10)

# 调用闭包
print(add_5(3))   # 输出：8  (5 + 3)
print(add_10(3))  # 输出：13 (10 + 3)
```

### 自由变量

**自由变量**（Free Variable）是指在函数内部使用但既不是参数也不是局部变量的变量。在闭包中，自由变量是来自外部函数作用域的变量。

```python
def make_counter():
    count = 0  # count 是自由变量

    def counter():
        nonlocal count  # 声明使用外部变量
        count += 1
        return count

    return counter

# 创建计数器闭包
my_counter = make_counter()
print(my_counter())  # 输出：1
print(my_counter())  # 输出：2
print(my_counter())  # 输出：3
```

### 闭包的历史背景

闭包的概念最早源于 1960 年代的 Lambda 演算（Lambda Calculus），由数学家 Alonzo Church 提出。在 Lisp 语言中，闭包被首次应用于实际编程。Python 作为一门支持多范式的语言，自然地继承了这一强大特性。

闭包解决的核心问题：

- **数据封装**：将数据和操作数据的函数绑定在一起
- **状态保持**：在函数调用之间保持状态，而无需使用全局变量或类
- **延迟计算**：创建携带上下文信息的可调用对象

## 核心原理

### Python 作用域规则 (LEGB)

理解闭包需要先理解 Python 的作用域查找规则 LEGB：

- **L (Local)**：函数内部作用域
- **E (Enclosing)**：外部嵌套函数的作用域（闭包的关键）
- **G (Global)**：全局作用域（模块级别）
- **B (Built-in)**：内置作用域

```python
# Built-in 作用域
# print, len, str 等内置函数

global_var = "全局变量"  # Global 作用域

def outer():
    enclosing_var = "外部函数变量"  # Enclosing 作用域

    def inner():
        local_var = "局部变量"  # Local 作用域
        # 按 LEGB 顺序查找变量
        print(local_var)      # L: 局部
        print(enclosing_var)  # E: 闭包
        print(global_var)     # G: 全局
        print(len([1, 2, 3])) # B: 内置

    return inner

closure = outer()
closure()
```

### 闭包的内存模型

当创建闭包时，Python 会执行以下操作：

1. 外部函数执行时创建局部变量
2. 内部函数被定义时，引用的外部变量被识别为自由变量
3. 这些自由变量被存储在内部函数的 `__closure__` 属性中
4. 外部函数返回后，虽然其局部作用域消失，但自由变量通过闭包继续存活

```python
def create_multiplier(factor):
    """创建乘法器"""
    def multiplier(x):
        return x * factor
    return multiplier

# 查看闭包的内部结构
double = create_multiplier(2)

# __closure__ 存储自由变量的 cell 对象
print(double.__closure__)
# 输出：(<cell at 0x...: int object at 0x...>,)

# 获取自由变量的值
print(double.__closure__[0].cell_contents)
# 输出：2

# 查看自由变量的名称
print(double.__code__.co_freevars)
# 输出：('factor',)
```

### __closure__ 属性详解

`__closure__` 是函数对象的特殊属性，它是一个元组，包含了所有自由变量对应的 cell 对象。

```python
def outer(a, b, c):
    """外部函数定义多个变量"""
    x = a + 1
    y = b + 2

    def inner():
        # 只引用了部分外部变量
        return x * y  # 只使用 x 和 y，不使用 c

    return inner

closure = outer(1, 2, 3)

# 查看闭包信息
print(f"闭包存在: {closure.__closure__ is not None}")
print(f"自由变量数量: {len(closure.__closure__)}")
print(f"自由变量名称: {closure.__code__.co_freevars}")

# 遍历所有自由变量
for i, cell in enumerate(closure.__closure__):
    var_name = closure.__code__.co_freevars[i]
    print(f"{var_name} = {cell.cell_contents}")

# 输出：
# 闭包存在: True
# 自由变量数量: 2
# 自由变量名称: ('x', 'y')
# x = 2
# y = 4
```

### 非闭包函数

如果内部函数没有引用外部变量，则不会形成闭包：

```python
def outer():
    x = 10

    def inner():
        # 没有引用外部变量
        return "Hello"

    return inner

func = outer()
print(func.__closure__)  # 输出：None
```

## 核心要点

### 闭包的本质特征

| 特征 | 描述 |
|------|------|
| 函数嵌套 | 必须存在内外两层函数 |
| 变量引用 | 内部函数必须引用外部函数的变量 |
| 函数返回 | 外部函数返回内部函数对象 |
| 状态保持 | 自由变量的值在闭包生命周期内保持 |
| 延迟绑定 | 自由变量的值在闭包调用时确定 |

### nonlocal 关键字

当需要在闭包中修改自由变量时，必须使用 `nonlocal` 声明：

```python
def make_accumulator(initial=0):
    """创建累加器"""
    total = initial

    def accumulator(value):
        nonlocal total  # 声明修改外部变量
        total += value
        return total

    return accumulator

acc = make_accumulator(100)
print(acc(10))   # 输出：110
print(acc(20))   # 输出：130
print(acc(30))   # 输出：160
```

如果不使用 `nonlocal`，会导致 `UnboundLocalError`：

```python
def broken_accumulator(initial=0):
    total = initial

    def accumulator(value):
        # 没有 nonlocal，Python 认为 total 是局部变量
        total += value  # UnboundLocalError!
        return total

    return accumulator

# acc = broken_accumulator(100)
# acc(10)  # 抛出 UnboundLocalError
```

### 闭包与 global 的区别

```python
counter = 0  # 全局变量

def global_increment():
    global counter
    counter += 1
    return counter

def make_closure_counter():
    count = 0  # 闭包变量

    def increment():
        nonlocal count
        count += 1
        return count

    return increment

# global 方式 - 污染全局命名空间
print(global_increment())  # 1
print(global_increment())  # 2

# 闭包方式 - 封装状态，可创建多个独立实例
counter1 = make_closure_counter()
counter2 = make_closure_counter()

print(counter1())  # 1
print(counter1())  # 2
print(counter2())  # 1 (独立的计数器)
print(counter2())  # 2
```

### 闭包变量的延迟绑定

闭包中的自由变量是延迟绑定的，即在闭包调用时才获取变量的值，而不是定义时：

```python
def create_functions():
    """演示延迟绑定问题"""
    functions = []
    for i in range(5):
        def func():
            return i  # i 的值在调用时确定
        functions.append(func)
    return functions

funcs = create_functions()
# 所有函数都返回 4，因为循环结束后 i = 4
print([f() for f in funcs])
# 输出：[4, 4, 4, 4, 4]

# 解决方案 1：使用默认参数捕获当前值
def create_functions_fixed_v1():
    functions = []
    for i in range(5):
        def func(x=i):  # 默认参数在定义时求值
            return x
        functions.append(func)
    return functions

# 解决方案 2：使用立即执行的闭包
def create_functions_fixed_v2():
    functions = []
    for i in range(5):
        def make_func(x):
            def func():
                return x
            return func
        functions.append(make_func(i))
    return functions

# 解决方案 3：使用 functools.partial
from functools import partial

def create_functions_fixed_v3():
    def func(x):
        return x
    return [partial(func, i) for i in range(5)]

funcs1 = create_functions_fixed_v1()
funcs2 = create_functions_fixed_v2()
funcs3 = create_functions_fixed_v3()

print([f() for f in funcs1])  # [0, 1, 2, 3, 4]
print([f() for f in funcs2])  # [0, 1, 2, 3, 4]
print([f() for f in funcs3])  # [0, 1, 2, 3, 4]
```

## 代码示例

### 基础示例：创建函数工厂

```python
def power_factory(exponent):
    """
    创建幂函数工厂

    Args:
        exponent: 指数

    Returns:
        计算幂的闭包函数
    """
    def power(base):
        return base ** exponent
    return power

# 创建不同的幂函数
square = power_factory(2)
cube = power_factory(3)
fourth = power_factory(4)

print(square(5))  # 25
print(cube(5))    # 125
print(fourth(5))  # 625
```

### 进阶示例：带状态的闭包

```python
def create_bank_account(initial_balance):
    """
    创建银行账户闭包

    返回存款、取款、查询余额三个操作函数
    """
    balance = initial_balance

    def deposit(amount):
        nonlocal balance
        if amount > 0:
            balance += amount
            return f"存入 {amount}，当前余额：{balance}"
        return "存款金额必须大于 0"

    def withdraw(amount):
        nonlocal balance
        if amount > balance:
            return f"余额不足，当前余额：{balance}"
        if amount > 0:
            balance -= amount
            return f"取出 {amount}，当前余额：{balance}"
        return "取款金额必须大于 0"

    def get_balance():
        return f"当前余额：{balance}"

    return deposit, withdraw, get_balance

# 创建账户
deposit, withdraw, get_balance = create_bank_account(1000)

print(get_balance())      # 当前余额：1000
print(deposit(500))       # 存入 500，当前余额：1500
print(withdraw(200))      # 取出 200，当前余额：1300
print(withdraw(2000))     # 余额不足，当前余额：1300
```

### 高级示例：可配置的装饰器闭包

```python
def retry_with_backoff(max_retries=3, initial_delay=1, backoff_factor=2):
    """
    创建带指数退避的重试装饰器

    Args:
        max_retries: 最大重试次数
        initial_delay: 初始延迟秒数
        backoff_factor: 退避因子
    """
    def decorator(func):
        from functools import wraps
        import time

        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        print(f"第 {attempt + 1} 次尝试失败: {e}")
                        print(f"等待 {delay} 秒后重试...")
                        time.sleep(delay)
                        delay *= backoff_factor

            raise last_exception

        return wrapper
    return decorator

# 使用装饰器
@retry_with_backoff(max_retries=3, initial_delay=0.1, backoff_factor=2)
def unreliable_api_call():
    import random
    if random.random() < 0.7:
        raise ConnectionError("网络连接失败")
    return "API 调用成功"

# 测试
try:
    result = unreliable_api_call()
    print(result)
except ConnectionError as e:
    print(f"最终失败: {e}")
```

### 实用示例：记忆化缓存

```python
def memoize(func):
    """
    记忆化装饰器 - 使用闭包缓存函数结果
    """
    cache = {}  # 闭包变量存储缓存

    def wrapper(*args, **kwargs):
        # 创建可哈希的键
        key = (args, tuple(sorted(kwargs.items())))

        if key not in cache:
            print(f"计算: {func.__name__}{args}")
            cache[key] = func(*args, **kwargs)
        else:
            print(f"缓存命中: {func.__name__}{args}")

        return cache[key]

    # 提供缓存管理方法
    wrapper.cache = cache
    wrapper.clear_cache = lambda: cache.clear()
    wrapper.cache_size = lambda: len(cache)

    return wrapper

@memoize
def fibonacci(n):
    """计算斐波那契数列"""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# 使用缓存
print(f"fibonacci(10) = {fibonacci(10)}")
print(f"缓存大小: {fibonacci.cache_size()}")

# 再次调用，全部从缓存获取
print(f"fibonacci(10) = {fibonacci(10)}")
```

### 示例：事件处理系统

```python
def create_event_emitter():
    """
    创建事件发射器

    使用闭包管理事件监听器
    """
    listeners = {}  # 存储事件监听器

    def on(event_name, callback):
        """注册事件监听器"""
        if event_name not in listeners:
            listeners[event_name] = []
        listeners[event_name].append(callback)
        return lambda: off(event_name, callback)

    def off(event_name, callback):
        """移除事件监听器"""
        if event_name in listeners:
            listeners[event_name].remove(callback)

    def emit(event_name, *args, **kwargs):
        """触发事件"""
        if event_name in listeners:
            for callback in listeners[event_name]:
                callback(*args, **kwargs)

    def once(event_name, callback):
        """注册一次性监听器"""
        def wrapper(*args, **kwargs):
            off(event_name, wrapper)
            callback(*args, **kwargs)
        on(event_name, wrapper)

    return on, off, emit, once

# 使用事件系统
on, off, emit, once = create_event_emitter()

def on_user_login(username):
    print(f"用户登录: {username}")

def on_first_login(username):
    print(f"首次登录欢迎: {username}")

# 注册监听器
unsubscribe = on("login", on_user_login)
once("login", on_first_login)

emit("login", "张三")
# 输出：
# 用户登录: 张三
# 首次登录欢迎: 张三

emit("login", "李四")
# 输出：
# 用户登录: 李四
# (首次登录欢迎只触发一次)

# 取消订阅
unsubscribe()
emit("login", "王五")  # 无输出
```

## 最佳实践

### 优先使用闭包而非全局变量

```python
# 不推荐：使用全局变量
call_count = 0

def track_calls_global(func):
    def wrapper(*args, **kwargs):
        global call_count
        call_count += 1
        return func(*args, **kwargs)
    return wrapper

# 推荐：使用闭包
def track_calls_closure(func):
    count = 0

    def wrapper(*args, **kwargs):
        nonlocal count
        count += 1
        print(f"{func.__name__} 被调用了 {count} 次")
        return func(*args, **kwargs)

    wrapper.get_count = lambda: count
    return wrapper

@track_calls_closure
def my_function():
    pass

my_function()
my_function()
print(f"总调用次数: {my_function.get_count()}")
```

### 使用 functools.wraps 保留函数元信息

```python
from functools import wraps

def good_decorator(func):
    @wraps(func)  # 保留原函数的 __name__, __doc__ 等
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@good_decorator
def documented_function():
    """这个函数有文档字符串"""
    pass

print(documented_function.__name__)  # documented_function
print(documented_function.__doc__)   # 这个函数有文档字符串
```

### 避免在循环中创建闭包的陷阱

```python
# 推荐方式：使用生成器表达式或列表推导式配合立即求值
def create_handlers(names):
    """为每个名称创建处理函数"""
    return {
        name: (lambda n=name: f"处理: {n}")
        for name in names
    }

handlers = create_handlers(["Alice", "Bob", "Charlie"])
print(handlers["Alice"]())   # 处理: Alice
print(handlers["Bob"]())     # 处理: Bob
print(handlers["Charlie"]()) # 处理: Charlie
```

### 合理组织闭包返回多个函数

```python
from collections import namedtuple

def create_stack():
    """
    创建栈数据结构

    返回命名元组以提高代码可读性
    """
    items = []

    StackOps = namedtuple('StackOps', ['push', 'pop', 'peek', 'is_empty', 'size'])

    def push(item):
        items.append(item)

    def pop():
        if items:
            return items.pop()
        raise IndexError("栈为空")

    def peek():
        if items:
            return items[-1]
        raise IndexError("栈为空")

    def is_empty():
        return len(items) == 0

    def size():
        return len(items)

    return StackOps(push, pop, peek, is_empty, size)

# 使用
stack = create_stack()
stack.push(1)
stack.push(2)
stack.push(3)
print(stack.peek())     # 3
print(stack.pop())      # 3
print(stack.size())     # 2
print(stack.is_empty()) # False
```

### 类型注解与闭包

```python
from typing import Callable, TypeVar

T = TypeVar('T')
R = TypeVar('R')

def curry(func: Callable[[T, T], R]) -> Callable[[T], Callable[[T], R]]:
    """
    柯里化装饰器

    将接受两个参数的函数转换为接受一个参数并返回函数的形式
    """
    def curried(x: T) -> Callable[[T], R]:
        def inner(y: T) -> R:
            return func(x, y)
        return inner
    return curried

@curry
def add(x: int, y: int) -> int:
    return x + y

add_5 = add(5)
print(add_5(3))  # 8
```

## 常见陷阱

### 陷阱 1：循环变量延迟绑定

```python
# 问题代码
def create_buttons():
    buttons = []
    for i in range(5):
        def on_click():
            print(f"按钮 {i} 被点击")
        buttons.append(on_click)
    return buttons

buttons = create_buttons()
buttons[0]()  # 输出：按钮 4 被点击（而非 0）
buttons[1]()  # 输出：按钮 4 被点击（而非 1）

# 修复方案
def create_buttons_fixed():
    buttons = []
    for i in range(5):
        def on_click(index=i):  # 使用默认参数捕获
            print(f"按钮 {index} 被点击")
        buttons.append(on_click)
    return buttons

buttons_fixed = create_buttons_fixed()
buttons_fixed[0]()  # 输出：按钮 0 被点击
buttons_fixed[1]()  # 输出：按钮 1 被点击
```

### 陷阱 2：忘记使用 nonlocal

```python
def make_counter_broken():
    count = 0

    def increment():
        # 错误：没有 nonlocal，count 被视为局部变量
        count = count + 1  # UnboundLocalError
        return count

    return increment

def make_counter_fixed():
    count = 0

    def increment():
        nonlocal count  # 正确：声明使用外部变量
        count += 1
        return count

    return increment

# counter = make_counter_broken()
# counter()  # UnboundLocalError

counter = make_counter_fixed()
print(counter())  # 1
print(counter())  # 2
```

### 陷阱 3：可变对象作为闭包变量

```python
def create_appender():
    """演示可变对象在闭包中的行为"""
    data = []  # 可变对象

    def appender(item):
        # 注意：修改可变对象不需要 nonlocal
        data.append(item)
        return data

    return appender

append = create_appender()
print(append(1))  # [1]
print(append(2))  # [1, 2]
print(append(3))  # [1, 2, 3]

# 注意：如果是重新赋值，则需要 nonlocal
def create_resetter():
    data = []

    def reset(new_data):
        nonlocal data  # 因为要重新赋值
        data = new_data
        return data

    return reset
```

### 陷阱 4：闭包中的内存泄漏

```python
def potential_leak():
    """闭包可能导致内存泄漏"""
    large_data = [i for i in range(1000000)]  # 大数据

    def process():
        # 只用到一小部分数据，但整个 large_data 都被保留
        return large_data[0]

    return process

# 修复：只保留需要的数据
def no_leak():
    large_data = [i for i in range(1000000)]
    first_item = large_data[0]  # 只提取需要的数据
    del large_data  # 显式删除大对象

    def process():
        return first_item

    return process
```

### 陷阱 5：混淆闭包和类

```python
# 闭包适合简单的状态封装
def make_simple_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

# 类适合复杂的状态和行为
class Counter:
    """当需要多个方法或继承时使用类"""
    def __init__(self, start=0):
        self.count = start

    def increment(self):
        self.count += 1
        return self.count

    def decrement(self):
        self.count -= 1
        return self.count

    def reset(self):
        self.count = 0

    def __repr__(self):
        return f"Counter({self.count})"
```

## 性能考量

### 闭包 vs 类的性能比较

```python
import timeit

# 闭包实现
def make_adder_closure(n):
    def adder(x):
        return x + n
    return adder

# 类实现
class Adder:
    def __init__(self, n):
        self.n = n

    def __call__(self, x):
        return x + self.n

# 性能测试
closure_adder = make_adder_closure(5)
class_adder = Adder(5)

# 创建性能
print("创建性能:")
print(f"闭包: {timeit.timeit(lambda: make_adder_closure(5), number=100000):.4f}s")
print(f"类: {timeit.timeit(lambda: Adder(5), number=100000):.4f}s")

# 调用性能
print("\n调用性能:")
print(f"闭包: {timeit.timeit(lambda: closure_adder(10), number=100000):.4f}s")
print(f"类: {timeit.timeit(lambda: class_adder(10), number=100000):.4f}s")
```

### 内存占用分析

```python
import sys

def make_closure(x, y, z):
    def inner():
        return x + y + z
    return inner

class SimpleClass:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def __call__(self):
        return self.x + self.y + self.z

closure = make_closure(1, 2, 3)
obj = SimpleClass(1, 2, 3)

print(f"闭包大小: {sys.getsizeof(closure)} bytes")
print(f"类实例大小: {sys.getsizeof(obj)} bytes")

# 注意：闭包通常更轻量，但类提供更多功能
```

### 优化建议

1. **简单状态封装**：优先使用闭包
2. **复杂对象**：当需要多个方法、继承或序列化时使用类
3. **高频调用**：两者性能差异通常可以忽略
4. **内存敏感场景**：注意闭包可能意外保留大对象引用

## 实战场景

### 场景 1：配置管理器

```python
def create_config_manager(defaults=None):
    """
    创建配置管理器

    支持默认值、覆盖和验证
    """
    config = defaults.copy() if defaults else {}
    validators = {}

    def get(key, default=None):
        return config.get(key, default)

    def set_value(key, value):
        if key in validators:
            if not validators[key](value):
                raise ValueError(f"配置项 {key} 的值无效: {value}")
        config[key] = value

    def add_validator(key, validator):
        validators[key] = validator

    def get_all():
        return config.copy()

    return get, set_value, add_validator, get_all

# 使用
get_config, set_config, add_validator, get_all_config = create_config_manager({
    'debug': False,
    'timeout': 30,
    'max_connections': 100
})

# 添加验证器
add_validator('timeout', lambda x: isinstance(x, int) and x > 0)
add_validator('debug', lambda x: isinstance(x, bool))

set_config('timeout', 60)
print(get_config('timeout'))  # 60

try:
    set_config('timeout', -1)  # 抛出 ValueError
except ValueError as e:
    print(f"验证失败: {e}")
```

### 场景 2：中间件系统

```python
def create_middleware_chain():
    """
    创建中间件链

    类似 Express.js 的中间件模式
    """
    middlewares = []

    def use(middleware):
        """添加中间件"""
        middlewares.append(middleware)

    def execute(context):
        """执行中间件链"""
        index = 0

        def next_middleware():
            nonlocal index
            if index < len(middlewares):
                current = middlewares[index]
                index += 1
                return current(context, next_middleware)
            return context

        return next_middleware()

    return use, execute

# 定义中间件
def logging_middleware(ctx, next_fn):
    print(f"[LOG] 请求开始: {ctx.get('path')}")
    result = next_fn()
    print(f"[LOG] 请求结束: {ctx.get('path')}")
    return result

def auth_middleware(ctx, next_fn):
    if not ctx.get('token'):
        return {'error': '未授权'}
    print("[AUTH] 认证通过")
    return next_fn()

def handler_middleware(ctx, next_fn):
    print(f"[HANDLER] 处理请求: {ctx.get('path')}")
    ctx['response'] = '请求成功'
    return ctx

# 使用
use, execute = create_middleware_chain()
use(logging_middleware)
use(auth_middleware)
use(handler_middleware)

# 测试有 token 的请求
result = execute({'path': '/api/users', 'token': 'abc123'})
print(f"结果: {result}")

# 测试无 token 的请求
result = execute({'path': '/api/users'})
print(f"结果: {result}")
```

### 场景 3：懒加载属性

```python
def lazy_property(func):
    """
    懒加载属性装饰器

    第一次访问时计算并缓存结果
    """
    cache = {}

    def wrapper(self):
        if id(self) not in cache:
            print(f"计算 {func.__name__}...")
            cache[id(self)] = func(self)
        return cache[id(self)]

    return property(wrapper)

class DataProcessor:
    def __init__(self, data):
        self.data = data

    @lazy_property
    def processed_data(self):
        """模拟耗时的数据处理"""
        import time
        time.sleep(0.1)  # 模拟耗时操作
        return [x * 2 for x in self.data]

    @lazy_property
    def statistics(self):
        """计算统计信息"""
        data = self.processed_data
        return {
            'sum': sum(data),
            'avg': sum(data) / len(data),
            'min': min(data),
            'max': max(data)
        }

# 使用
processor = DataProcessor([1, 2, 3, 4, 5])

print("第一次访问 processed_data:")
print(processor.processed_data)

print("\n第二次访问 processed_data (从缓存):")
print(processor.processed_data)

print("\n访问 statistics:")
print(processor.statistics)
```

### 场景 4：回调函数管理

```python
def create_async_task_manager():
    """
    创建异步任务管理器

    管理回调函数的注册和执行
    """
    callbacks = {
        'on_start': [],
        'on_progress': [],
        'on_complete': [],
        'on_error': []
    }

    def on(event, callback):
        """注册回调"""
        if event in callbacks:
            callbacks[event].append(callback)
        return lambda: callbacks[event].remove(callback)

    def trigger(event, *args, **kwargs):
        """触发事件"""
        for callback in callbacks.get(event, []):
            callback(*args, **kwargs)

    def run_task(task_func, *args, **kwargs):
        """运行任务并触发回调"""
        trigger('on_start')
        try:
            result = task_func(*args, **kwargs)
            trigger('on_complete', result)
            return result
        except Exception as e:
            trigger('on_error', e)
            raise

    return on, trigger, run_task

# 使用
on, trigger, run_task = create_async_task_manager()

on('on_start', lambda: print("任务开始"))
on('on_complete', lambda result: print(f"任务完成: {result}"))
on('on_error', lambda e: print(f"任务失败: {e}"))

def my_task(x, y):
    return x + y

result = run_task(my_task, 5, 3)
print(f"最终结果: {result}")
```

## 闭包 vs 类

### 何时使用闭包

- **简单的状态封装**：只需要封装少量变量
- **函数工厂**：创建配置化的函数
- **装饰器实现**：增强函数功能
- **回调函数**：需要携带上下文的回调
- **性能敏感场景**：需要轻量级对象

### 何时使用类

- **复杂状态管理**：多个相关的状态变量
- **多个公开方法**：需要暴露多个操作接口
- **继承需求**：需要扩展和复用
- **序列化需求**：需要对象序列化
- **需要特殊方法**：`__repr__`, `__eq__` 等
- **类型检查**：需要 `isinstance` 检查

### 对比示例

```python
# 闭包版本 - 简洁但功能有限
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

# 类版本 - 功能完整但更复杂
class Counter:
    def __init__(self, start=0, step=1):
        self.count = start
        self.step = step

    def increment(self):
        self.count += self.step
        return self.count

    def decrement(self):
        self.count -= self.step
        return self.count

    def reset(self):
        self.count = 0

    def __repr__(self):
        return f"Counter(count={self.count}, step={self.step})"

    def __add__(self, other):
        return Counter(self.count + other.count)
```

## 面试要点

### 常见面试问题

**Q1: 什么是闭包？闭包的三个条件是什么？**

A: 闭包是一个函数对象，它记住了定义时外部作用域中的变量。三个条件：
1. 存在嵌套函数
2. 内部函数引用外部函数的变量
3. 外部函数返回内部函数

**Q2: 解释 Python 中 `nonlocal` 和 `global` 的区别**

A:
- `global`: 声明变量来自全局作用域
- `nonlocal`: 声明变量来自外层函数作用域（闭包）
- 使用场景：`global` 用于模块级变量，`nonlocal` 用于闭包中修改外部函数变量

**Q3: 下面代码的输出是什么？为什么？**

```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)
print([f() for f in funcs])
```

A: 输出 `[2, 2, 2]`。因为 lambda 中的 `i` 是自由变量，在调用时才求值，此时循环已结束，`i = 2`。修复方法：使用默认参数 `lambda i=i: i`。

**Q4: 如何查看闭包的自由变量？**

A: 使用 `__closure__` 属性查看 cell 对象，使用 `__code__.co_freevars` 查看变量名称。

```python
def outer(x):
    def inner():
        return x
    return inner

f = outer(10)
print(f.__code__.co_freevars)  # ('x',)
print(f.__closure__[0].cell_contents)  # 10
```

**Q5: 闭包和装饰器有什么关系？**

A: 装饰器是闭包的典型应用。装饰器函数返回一个闭包（wrapper），这个闭包记住了被装饰的原函数。

### 代码题

**实现一个带有取消订阅功能的事件发射器**

```python
def create_emitter():
    listeners = {}

    def subscribe(event, callback):
        if event not in listeners:
            listeners[event] = []
        listeners[event].append(callback)
        # 返回取消订阅函数
        def unsubscribe():
            listeners[event].remove(callback)
        return unsubscribe

    def emit(event, data):
        for callback in listeners.get(event, []):
            callback(data)

    return subscribe, emit

# 测试
subscribe, emit = create_emitter()
unsub = subscribe('click', lambda d: print(f"点击: {d}"))
emit('click', '按钮1')  # 输出: 点击: 按钮1
unsub()
emit('click', '按钮2')  # 无输出
```

## 延伸阅读

### 官方文档

- [Python 执行模型 - 命名与绑定](https://docs.python.org/zh-cn/3/reference/executionmodel.html#naming-and-binding)
- [functools - 高阶函数和可调用对象上的操作](https://docs.python.org/zh-cn/3/library/functools.html)
- [PEP 3104 -- Access to Names in Outer Scopes](https://peps.python.org/pep-3104/)

### 推荐书籍

- 《流畅的 Python》第 7 章 - 函数装饰器和闭包
- 《Python Cookbook》第 7 章 - 函数
- 《Effective Python》条目 21 - 了解闭包如何与变量作用域交互

### 相关概念

- [装饰器](/python/decorators) - 闭包的典型应用
- [函数式编程](/python/functools) - 高阶函数与函数组合
- [作用域与命名空间](/python/functions) - LEGB 规则详解

### 进阶主题

- **柯里化（Currying）**：使用闭包实现函数柯里化
- **偏函数（Partial）**：`functools.partial` 的闭包实现
- **装饰器模式**：闭包在设计模式中的应用
- **协程与生成器**：闭包在异步编程中的应用

## 总结

闭包是 Python 函数式编程的核心概念，它提供了一种优雅的方式来：

- **封装状态**：不使用全局变量或类即可保持状态
- **创建工厂函数**：生成配置化的函数
- **实现装饰器**：在不修改原函数的情况下增强功能
- **延迟计算**：携带上下文信息的可调用对象

### 关键要点回顾

1. 闭包的三要素：嵌套函数、引用外部变量、返回内部函数
2. 使用 `nonlocal` 在闭包中修改外部变量
3. 注意循环变量的延迟绑定陷阱
4. 通过 `__closure__` 和 `__code__.co_freevars` 检查闭包
5. 根据场景选择闭包或类实现

掌握闭包是成为 Python 高级开发者的必经之路，它不仅能帮助你理解装饰器、上下文管理器等高级特性，还能让你写出更加简洁、优雅的代码。
