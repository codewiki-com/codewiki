---
title: 作用域和命名空间
description: 理解Python的作用域规则、命名空间和LEGB规则
track: python
section: functions-deeper
difficulty: beginner
tags:
  - python
  - 作用域
  - 命名空间
  - legb
  - 变量
status: imported
origin: old/src/content/docs/python/scope.zh.md
divergence: 0.215
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: python
  subcategory: ""
  order: 6
  lastUpdated: 2026-01-07
---


## 引言

作用域和命名空间是Python中的基本概念，决定了变量可以在何处访问以及Python如何查找变量名。理解这些概念对于编写干净、可维护的代码以及避免与变量可见性和命名冲突相关的常见错误至关重要。

在本文中，我们将探索Python的作用域规则、不同类型的作用域，以及如何使用`global`和`nonlocal`关键字。

## 什么是命名空间？

命名空间是从名称到对象的映射。将其视为一个字典，存储变量名称及其对应的值。Python使用多个命名空间来组织变量并防止命名冲突。

### 命名空间的类型

1. **内置命名空间**：包含内置函数和异常（例如`print`、`len`、`ValueError`）
2. **全局命名空间**：包含在模块级别定义的变量
3. **局部命名空间**：包含在函数内定义的变量
4. **外层命名空间**：包含嵌套函数场景中来自外层函数的变量

您可以使用这些函数检查命名空间：

```python
# 查看当前局部命名空间
print(locals())

# 查看全局命名空间
print(globals())

# 查看内置命名空间
import builtins
print(dir(builtins))
```

## 理解作用域

作用域指的是程序中定义名称并可以访问该名称的区域。变量只能在其作用域内访问。

### LEGB规则

Python使用**LEGB规则**来解析变量名称，该规则定义了Python搜索变量的顺序：

1. **局部（L）**：在当前函数内部
2. **外层（E）**：在嵌套函数中的外层函数内部
3. **全局（G）**：在模块的顶层
4. **内置（B）**：在内置命名空间中

Python按此顺序搜索变量。一旦找到变量，搜索就会停止。

### LEGB规则的实际应用

```python
# 内置作用域
print()  # 内置函数

# 全局作用域
x = "global"

def outer_function():
    # 外层作用域
    y = "enclosing"

    def inner_function():
        # 局部作用域
        z = "local"

        # Python搜索：局部 -> 外层 -> 全局 -> 内置
        print(z)  # "local"（在局部作用域中找到）
        print(y)  # "enclosing"（在外层作用域中找到）
        print(x)  # "global"（在全局作用域中找到）
        print(len)  # <built-in function len>（在内置作用域中找到）

    inner_function()

outer_function()
```

## 局部作用域

在函数内定义的变量属于局部作用域。它们在函数被调用时创建，在函数返回时销毁。

```python
def greet(name):
    message = f"Hello, {name}!"  # 局部变量
    print(message)
    return message

greet("Alice")
# print(message)  # NameError: name 'message' is not defined
```

局部变量优先于同名的全局变量：

```python
x = "global"

def func():
    x = "local"  # 局部变量遮蔽全局变量
    print(x)  # "local"

func()
print(x)  # "global"
```

## 全局作用域

在模块级别（任何函数外）定义的变量属于全局作用域。可以从模块中的任何位置访问它们。

```python
name = "Alice"  # 全局变量

def greet():
    print(name)  # 可以访问全局变量

greet()  # "Alice"
```

但是，如果不使用`global`关键字，则无法从函数内部分配给全局变量：

```python
count = 0

def increment():
    count = count + 1  # UnboundLocalError: local variable 'count' referenced before assignment

increment()
```

这个错误发生是因为Python看到`count = ...`并将`count`视为整个函数中的局部变量。

### global关键字

使用`global`关键字声明变量是全局的并允许重新分配：

```python
count = 0

def increment():
    global count
    count = count + 1

increment()
print(count)  # 1

increment()
print(count)  # 2
```

关于`global`的重要注意事项：

- `global`关键字必须在引用变量之前使用
- 您可以一次声明多个全局变量：`global x, y, z`
- 使用`global`进行读取是不必要的；仅用于赋值

```python
x = 10

def read_global():
    print(x)  # 可以不用'global'进行读取

def modify_global():
    global x
    x = 20  # 必须使用'global'才能分配

read_global()  # 10
modify_global()
read_global()  # 20
```

## 外层作用域和嵌套函数

外层作用域适用于嵌套函数。外层函数中的变量可以由内层函数访问。

```python
def outer():
    message = "Hello"  # 外层作用域

    def inner():
        print(message)  # 可以访问外层变量

    inner()

outer()  # "Hello"
```

但是，与全局作用域一样，如果不使用`nonlocal`关键字，则无法分配给外层变量：

```python
def outer():
    x = 10

    def inner():
        x = x + 1  # UnboundLocalError
        print(x)

    inner()

outer()
```

### nonlocal关键字

使用`nonlocal`关键字声明变量属于外层作用域：

```python
def outer():
    x = 10

    def inner():
        nonlocal x
        x = x + 1
        print(x)

    inner()
    print(x)

outer()
# 11
# 11
```

`global`和`nonlocal`的关键差异：

- `global`：指模块级别的变量
- `nonlocal`：指外层函数中的变量（但不是模块级别）

```python
x = "global"

def outer():
    x = "enclosing"

    def inner():
        nonlocal x  # 指outer的x，而不是全局x
        x = "modified"
        print(x)

    inner()
    print(x)

outer()
print(x)

# 输出：
# modified
# modified
# global
```

## 内置作用域

内置作用域包含Python提供的预定义函数、异常和常量。

```python
print(type)  # <class 'type'>
print(len)   # <built-in function len>
print(ValueError)  # <class 'ValueError'>
```

您可以访问内置命名空间：

```python
import builtins

print(dir(builtins))  # 列出所有内置名称
```

虽然可能，但通常不建议遮蔽内置名称：

```python
# 避免这样做：
len = 5  # 遮蔽内置len()函数
print(len([1, 2, 3]))  # TypeError: 'int' object is not callable

# 如果需要恢复内置：
import builtins
print(builtins.len([1, 2, 3]))  # 3
```

## 实际例子

### 例子1：函数闭包

闭包允许内层函数访问外层作用域中的变量：

```python
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

times_three = make_multiplier(3)
print(times_three(5))  # 15
print(times_three(10))  # 30
```

### 例子2：使用nonlocal的计数器

```python
def make_counter():
    count = 0

    def increment():
        nonlocal count
        count += 1
        return count

    def reset():
        nonlocal count
        count = 0

    return increment, reset

inc, reset = make_counter()
print(inc())  # 1
print(inc())  # 2
print(inc())  # 3
reset()
print(inc())  # 1
```

### 例子3：类和作用域交互

```python
x = "global"

class MyClass:
    x = "class"

    def method(self):
        x = "local"
        print(x)  # "local"
        print(self.x)  # "class"
        print(globals()['x'])  # "global"

obj = MyClass()
obj.method()
```

### 例子4：默认参数和延迟绑定

一个常见的陷阱涉及使用可变的默认参数：

```python
# 问题：可变的默认参数是共享的
def append_to_list(item, lst=[]):
    lst.append(item)
    return lst

print(append_to_list(1))  # [1]
print(append_to_list(2))  # [1, 2] - 意外！

# 解决方案：使用None并在函数中创建新列表
def append_to_list(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

print(append_to_list(1))  # [1]
print(append_to_list(2))  # [2]
```

## 常见错误和最佳实践

### 错误1：忘记使用global/nonlocal

```python
# 错误
counter = 0

def increment():
    counter += 1  # UnboundLocalError

# 正确
counter = 0

def increment():
    global counter
    counter += 1
```

### 错误2：遮蔽内置名称

```python
# 避免
list = []  # 遮蔽内置list类型
dict = {}  # 遮蔽内置dict类型

# 使用描述性名称代替
items = []
config = {}
```

### 错误3：误解延迟绑定

```python
# 问题：函数使用x的当前值
functions = []
for i in range(3):
    def func():
        return i
    functions.append(func)

print([f() for f in functions])  # [2, 2, 2] - 而不是 [0, 1, 2]！

# 解决方案1：使用默认参数
functions = []
for i in range(3):
    def func(i=i):  # 捕获i的当前值
        return i
    functions.append(func)

print([f() for f in functions])  # [0, 1, 2]

# 解决方案2：使用闭包工厂
functions = []
for i in range(3):
    def make_func(n):
        def func():
            return n
        return func
    functions.append(make_func(i))

print([f() for f in functions])  # [0, 1, 2]
```

### 最佳实践：保持作用域简单

1. **最小化全局变量**：使用参数和返回值代替
2. **使用描述性名称**：从上下文中明确变量作用域
3. **避免深层嵌套**：深层嵌套函数变得难以理解
4. **记录作用域**：当作用域行为不明显时添加注释

```python
# 好：清晰的作用域和数据流
def calculate_total(items):
    subtotal = sum(item.price for item in items)
    tax = subtotal * 0.1
    return subtotal + tax

# 避免：依赖全局变量
total_items = []
total = 0

def add_item(item):
    global total
    total_items.append(item)
    total += item.price
```

## 总结

- **命名空间**：将名称映射到对象的字典
- **作用域**：名称可以访问的区域
- **LEGB规则**：局部 → 外层 → 全局 → 内置（搜索顺序）
- **局部作用域**：在函数内部
- **外层作用域**：在嵌套函数中
- **全局作用域**：模块级别
- **内置作用域**：由Python预定义
- **global关键字**：声明模块级别的变量以用于赋值
- **nonlocal关键字**：声明外层作用域的变量以用于赋值

理解作用域和命名空间可以帮助您编写更干净的代码，避免bug，并理解Python在整个程序中如何管理变量名称。
