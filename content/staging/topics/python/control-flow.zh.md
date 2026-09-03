---
title: Python 控制流
description: 掌握 Python 条件语句、循环结构与流程控制的完整指南
track: python
section: basics
difficulty: beginner
tags:
  - Python
  - 控制流
  - 条件语句
  - 循环
status: imported
origin: old/src/content/docs/python/control-flow.zh.md
divergence: 0.342
issues: []
legacy:
  category: Python
  subcategory: 语言基础
  order: 2
  lastUpdated: 2026-01-07
---

控制流是编程中的核心概念，它决定了程序代码的执行顺序和逻辑。Python 提供了丰富的控制流语句，让开发者能够编写灵活且强大的程序。

## 条件语句

### if 语句

`if` 语句用于基于条件执行代码块。只有当条件为真（True）时，代码块才会执行。

```python
age = 18

if age >= 18:
    print("你已经成年了")
```

**输出：**
```
你已经成年了
```

### if-else 语句

`else` 子句提供了当 `if` 条件为假时执行的替代代码块。

```python
temperature = 15

if temperature > 25:
    print("天气很热")
else:
    print("天气凉爽")
```

**输出：**
```
天气凉爽
```

### if-elif-else 语句

`elif`（else if 的缩写）允许你检查多个条件。Python 会按顺序评估每个条件，执行第一个为真的代码块。

```python
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

print(f"你的成绩是: {grade}")
```

**输出：**
```
你的成绩是: B
```

### 嵌套条件语句

你可以在条件语句内部嵌套其他条件语句，以处理更复杂的逻辑。

```python
age = 20
has_license = True

if age >= 18:
    if has_license:
        print("你可以驾驶汽车")
    else:
        print("你需要先获得驾照")
else:
    print("你年龄不够，不能驾驶")
```

**输出：**
```
你可以驾驶汽车
```

### 三元运算符

Python 支持简洁的单行条件表达式，也称为三元运算符。

```python
age = 16
status = "成年人" if age >= 18 else "未成年人"
print(status)
```

**输出：**
```
未成年人
```

## 循环结构

### for 循环

`for` 循环用于遍历序列（如列表、元组、字符串）或其他可迭代对象。

#### 遍历列表

```python
fruits = ["苹果", "香蕉", "橙子"]

for fruit in fruits:
    print(f"我喜欢吃{fruit}")
```

**输出：**
```
我喜欢吃苹果
我喜欢吃香蕉
我喜欢吃橙子
```

#### 使用 range() 函数

`range()` 函数生成数字序列，常用于循环指定次数。

```python
# range(n) 生成 0 到 n-1 的数字
for i in range(5):
    print(f"第 {i + 1} 次迭代")
```

**输出：**
```
第 1 次迭代
第 2 次迭代
第 3 次迭代
第 4 次迭代
第 5 次迭代
```

```python
# range(start, stop, step)
for i in range(0, 10, 2):
    print(i, end=" ")
```

**输出：**
```
0 2 4 6 8
```

#### 遍历字典

```python
student = {"姓名": "张三", "年龄": 20, "专业": "计算机科学"}

# 遍历键
for key in student:
    print(key)

# 遍历值
for value in student.values():
    print(value)

# 同时遍历键和值
for key, value in student.items():
    print(f"{key}: {value}")
```

**输出：**
```
姓名
年龄
专业
张三
20
计算机科学
姓名: 张三
年龄: 20
专业: 计算机科学
```

#### 使用 enumerate()

`enumerate()` 函数在遍历时同时获取索引和值。

```python
colors = ["红色", "绿色", "蓝色"]

for index, color in enumerate(colors):
    print(f"索引 {index}: {color}")

# 从指定索引开始
for index, color in enumerate(colors, start=1):
    print(f"第 {index} 个颜色: {color}")
```

**输出：**
```
索引 0: 红色
索引 1: 绿色
索引 2: 蓝色
第 1 个颜色: 红色
第 2 个颜色: 绿色
第 3 个颜色: 蓝色
```

### while 循环

`while` 循环在条件为真时重复执行代码块。

```python
count = 0

while count < 5:
    print(f"计数: {count}")
    count += 1
```

**输出：**
```
计数: 0
计数: 1
计数: 2
计数: 3
计数: 4
```

#### 无限循环

小心使用 `while True` 创建无限循环，确保有适当的退出条件。

```python
# 用户输入验证示例
while True:
    user_input = input("请输入 'quit' 退出: ")
    if user_input.lower() == 'quit':
        print("程序退出")
        break
    print(f"你输入了: {user_input}")
```

## 流程控制关键字

### break 语句

`break` 语句用于立即终止循环，无论循环条件是否满足。

```python
# 在列表中查找特定元素
numbers = [1, 3, 5, 7, 9, 2, 4, 6]

for num in numbers:
    if num % 2 == 0:
        print(f"找到第一个偶数: {num}")
        break
```

**输出：**
```
找到第一个偶数: 2
```

```python
# 嵌套循环中的 break
for i in range(3):
    for j in range(3):
        if i == 1 and j == 1:
            print(f"在 i={i}, j={j} 时跳出内层循环")
            break
        print(f"i={i}, j={j}")
```

**输出：**
```
i=0, j=0
i=0, j=1
i=0, j=2
i=1, j=0
在 i=1, j=1 时跳出内层循环
i=2, j=0
i=2, j=1
i=2, j=2
```

### continue 语句

`continue` 语句跳过当前迭代的剩余代码，直接进入下一次迭代。

```python
# 跳过偶数
for i in range(10):
    if i % 2 == 0:
        continue
    print(i, end=" ")
```

**输出：**
```
1 3 5 7 9
```

```python
# 实际应用示例：过滤无效数据
scores = [85, -1, 92, 0, 78, -5, 88]

print("有效成绩:")
for score in scores:
    if score < 0:
        continue  # 跳过负数
    print(score, end=" ")
```

**输出：**
```
有效成绩:
85 92 0 78 88
```

### pass 语句

`pass` 是一个空操作语句，用作占位符。它在语法上需要语句但不需要执行任何操作时很有用。

```python
# 作为占位符
def future_function():
    pass  # 稍后实现

# 在条件语句中
for i in range(5):
    if i == 2:
        pass  # 暂时不做任何事
    else:
        print(i, end=" ")
```

**输出：**
```
0 1 3 4
```

## 循环的 else 子句

Python 的循环可以有 `else` 子句，它在循环正常结束（没有被 `break` 中断）时执行。

### for 循环的 else

```python
# 在列表中搜索元素
numbers = [1, 3, 5, 7, 9]
search_for = 4

for num in numbers:
    if num == search_for:
        print(f"找到了 {search_for}")
        break
else:
    print(f"没有找到 {search_for}")
```

**输出：**
```
没有找到 4
```

```python
# 检查质数
def is_prime(n):
    if n < 2:
        return False

    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            print(f"{n} 可以被 {i} 整除")
            break
    else:
        print(f"{n} 是质数")
        return True

    print(f"{n} 不是质数")
    return False

is_prime(17)
is_prime(18)
```

**输出：**
```
17 是质数
18 可以被 2 整除
18 不是质数
```

### while 循环的 else

```python
count = 0
limit = 5

while count < limit:
    print(f"计数: {count}")
    count += 1
else:
    print("循环正常结束")
```

**输出：**
```
计数: 0
计数: 1
计数: 2
计数: 3
计数: 4
循环正常结束
```

```python
# 使用 break 时 else 不会执行
count = 0
while count < 10:
    if count == 3:
        print("提前终止循环")
        break
    count += 1
else:
    print("这条语句不会执行")
```

**输出：**
```
提前终止循环
```

## match 语句（Python 3.10+）

Python 3.10 引入了 `match` 语句（也称为结构模式匹配），提供了比传统 `if-elif-else` 更强大和简洁的模式匹配功能。

### 基本用法

```python
def http_status(status):
    match status:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500:
            return "Internal Server Error"
        case _:
            return "Unknown Status"

print(http_status(200))
print(http_status(404))
print(http_status(403))
```

**输出：**
```
OK
Not Found
Unknown Status
```

### 匹配多个值

```python
def day_type(day):
    match day:
        case "星期一" | "星期二" | "星期三" | "星期四" | "星期五":
            return "工作日"
        case "星期六" | "星期日":
            return "周末"
        case _:
            return "无效的日期"

print(day_type("星期三"))
print(day_type("星期六"))
```

**输出：**
```
工作日
周末
```

### 模式匹配与解构

```python
# 匹配列表和元组
def analyze_point(point):
    match point:
        case (0, 0):
            return "原点"
        case (0, y):
            return f"Y轴上的点，y={y}"
        case (x, 0):
            return f"X轴上的点，x={x}"
        case (x, y):
            return f"坐标点 ({x}, {y})"
        case _:
            return "无效的点"

print(analyze_point((0, 0)))
print(analyze_point((0, 5)))
print(analyze_point((3, 4)))
```

**输出：**
```
原点
Y轴上的点，y=5
坐标点 (3, 4)
```

### 匹配字典

```python
def process_command(command):
    match command:
        case {"action": "create", "item": item}:
            return f"创建 {item}"
        case {"action": "delete", "item": item}:
            return f"删除 {item}"
        case {"action": "update", "item": item, "value": value}:
            return f"更新 {item} 为 {value}"
        case _:
            return "未知命令"

print(process_command({"action": "create", "item": "文件"}))
print(process_command({"action": "update", "item": "配置", "value": "新值"}))
```

**输出：**
```
创建 文件
更新 配置 为 新值
```

### 使用守卫（Guards）

守卫允许你在模式后添加额外的条件。

```python
def categorize_number(num):
    match num:
        case x if x < 0:
            return "负数"
        case 0:
            return "零"
        case x if x > 0 and x < 10:
            return "个位正数"
        case x if x >= 10 and x < 100:
            return "两位数"
        case _:
            return "大数"

print(categorize_number(-5))
print(categorize_number(0))
print(categorize_number(7))
print(categorize_number(42))
print(categorize_number(150))
```

**输出：**
```
负数
零
个位正数
两位数
大数
```

### 类模式匹配

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def describe_point(point):
    match point:
        case Point(x=0, y=0):
            return "原点"
        case Point(x=0, y=y):
            return f"Y轴，y={y}"
        case Point(x=x, y=0):
            return f"X轴，x={x}"
        case Point(x=x, y=y) if x == y:
            return f"对角线，坐标=({x}, {y})"
        case Point(x=x, y=y):
            return f"普通点 ({x}, {y})"

p1 = Point(0, 0)
p2 = Point(0, 5)
p3 = Point(3, 3)

print(describe_point(p1))
print(describe_point(p2))
print(describe_point(p3))
```

**输出：**
```
原点
Y轴，y=5
对角线，坐标=(3, 3)
```

## 最佳实践

### 保持条件简洁

```python
# 不推荐
if is_valid == True:
    pass

# 推荐
if is_valid:
    pass
```

### 避免深度嵌套

```python
# 不推荐
if condition1:
    if condition2:
        if condition3:
            do_something()

# 推荐：使用早期返回
if not condition1:
    return
if not condition2:
    return
if not condition3:
    return
do_something()

# 或使用逻辑运算符
if condition1 and condition2 and condition3:
    do_something()
```

### 合理使用 break 和 continue

```python
# 清晰的循环控制
for item in items:
    if not is_valid(item):
        continue

    if is_target(item):
        process(item)
        break

    regular_processing(item)
```

### 利用 Python 的真值测试

```python
# Python 中这些值被视为 False：
# None, False, 0, 0.0, '', [], {}, set()

items = []

# 不推荐
if len(items) == 0:
    print("列表为空")

# 推荐
if not items:
    print("列表为空")
```

### 使用 match 语句简化复杂条件

```python
# 使用 if-elif 链（较繁琐）
if command == "start":
    start_process()
elif command == "stop":
    stop_process()
elif command == "restart":
    restart_process()
else:
    unknown_command()

# 使用 match 语句（更清晰）- Python 3.10+
match command:
    case "start":
        start_process()
    case "stop":
        stop_process()
    case "restart":
        restart_process()
    case _:
        unknown_command()
```

### 循环中的性能优化

```python
# 不推荐：在循环中重复计算
for i in range(len(items)):
    if i < len(items) - 1:
        process(items[i])

# 推荐：提前计算
length = len(items)
for i in range(length):
    if i < length - 1:
        process(items[i])

# 更好：直接迭代
for item in items[:-1]:
    process(item)
```

## 总结

Python 的控制流语句提供了强大而灵活的方式来控制程序执行：

- **条件语句**（`if`/`elif`/`else`）用于基于条件执行不同的代码路径
- **for 循环**适合遍历序列和可迭代对象
- **while 循环**适合在条件满足时重复执行代码
- **break**、**continue** 和 **pass** 提供了精细的流程控制
- **循环的 else 子句**在循环正常结束时执行
- **match 语句**（Python 3.10+）提供了强大的模式匹配功能

掌握这些控制流工具，你将能够编写出逻辑清晰、结构优雅的 Python 程序。记住，良好的代码不仅要正确运行，还要易于阅读和维护。
