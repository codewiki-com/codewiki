---
title: "Python 闭包"
description: "深入理解 Python 闭包：自由变量、__closure__ 属性、闭包原理与实战应用"
category: "Python"
subcategory: "函数式编程"
tags: ["Python", "闭包", "自由变量", "高阶函数", "函数式编程"]
difficulty: "intermediate"
order: 7
draft: false
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
