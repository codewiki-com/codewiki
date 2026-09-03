---
title: Python 装饰器
description: 掌握 Python 装饰器：函数装饰器、类装饰器、参数化装饰器与常用模式
track: python
section: functions-deeper
difficulty: intermediate
tags:
  - Python
  - 装饰器
  - 高阶函数
  - 元编程
status: imported
origin: old/src/content/docs/python/decorators.zh.md
divergence: 0.193
issues: []
legacy:
  category: Python
  subcategory: 函数式编程
  order: 8
  lastUpdated: 2026-01-07
---

装饰器是 Python 中一个强大的特性，它允许我们在不修改原有函数代码的情况下，动态地增强或修改函数的行为。装饰器本质上是一个接受函数作为参数并返回新函数的高阶函数。

## 装饰器基础

### 什么是装饰器

装饰器是一个可调用对象，它接受一个函数作为参数并返回一个新的函数。使用 `@` 语法糖可以简化装饰器的应用。

```python
# 基本的装饰器结构
def my_decorator(func):
    def wrapper(*args, **kwargs):
        # 在函数执行前做一些事情
        print("函数执行前")
        result = func(*args, **kwargs)
        # 在函数执行后做一些事情
        print("函数执行后")
        return result
    return wrapper

# 使用装饰器
@my_decorator
def greet(name):
    print(f"你好，{name}！")

# 等价于：greet = my_decorator(greet)
greet("张三")
```

**输出：**
```
函数执行前
你好，张三！
函数执行后
```

### 装饰器的工作原理

```python
# 不使用 @ 语法糖
def say_hello():
    return "Hello"

# 手动应用装饰器
say_hello = my_decorator(say_hello)

# 使用 @ 语法糖（推荐）
@my_decorator
def say_hello():
    return "Hello"
```

## 函数装饰器

### 简单的函数装饰器

```python
def timer(func):
    """测量函数执行时间的装饰器"""
    import time

    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 执行时间: {end - start:.4f} 秒")
        return result
    return wrapper

@timer
def slow_function():
    import time
    time.sleep(1)
    return "完成"

result = slow_function()
```

**输出：**
```
slow_function 执行时间: 1.0023 秒
```

### 日志装饰器

```python
def log_calls(func):
    """记录函数调用的装饰器"""
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}()")
        print(f"  位置参数: {args}")
        print(f"  关键字参数: {kwargs}")
        result = func(*args, **kwargs)
        print(f"  返回值: {result}")
        return result
    return wrapper

@log_calls
def add(a, b):
    return a + b

add(3, 5)
```

**输出：**
```
调用 add()
  位置参数: (3, 5)
  关键字参数: {}
  返回值: 8
```

### 认证装饰器

```python
def require_auth(func):
    """检查用户是否已认证的装饰器"""
    def wrapper(*args, **kwargs):
        # 模拟检查认证状态
        is_authenticated = False

        if not is_authenticated:
            raise PermissionError(f"需要认证才能调用 {func.__name__}")

        return func(*args, **kwargs)
    return wrapper

@require_auth
def view_sensitive_data():
    return "敏感数据"

# 尝试调用会抛出异常
try:
    view_sensitive_data()
except PermissionError as e:
    print(f"错误: {e}")
```

## 带参数的装饰器

### 创建接受参数的装饰器

带参数的装饰器需要额外的一层包装函数。

```python
def repeat(times):
    """重复执行函数 n 次的装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            results = []
            for _ in range(times):
                result = func(*args, **kwargs)
                results.append(result)
            return results
        return wrapper
    return decorator

@repeat(times=3)
def greet(name):
    print(f"你好，{name}！")
    return f"问候 {name}"

results = greet("李四")
print(f"返回结果: {results}")
```

**输出：**
```
你好，李四！
你好，李四！
你好，李四！
返回结果: ['问候 李四', '问候 李四', '问候 李四']
```

### 缓存装饰器

```python
def cache(max_size=128):
    """带最大缓存大小的缓存装饰器"""
    def decorator(func):
        cached_results = {}

        def wrapper(*args):
            if args in cached_results:
                print(f"从缓存返回: {args}")
                return cached_results[args]

            result = func(*args)

            # 简单的缓存大小控制
            if len(cached_results) >= max_size:
                # 删除最早的缓存项
                cached_results.pop(next(iter(cached_results)))

            cached_results[args] = result
            return result

        return wrapper
    return decorator

@cache(max_size=3)
def fibonacci(n):
    print(f"计算 fibonacci({n})")
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(5))
print(fibonacci(5))  # 从缓存返回
```

### 重试装饰器

```python
def retry(max_attempts=3, delay=1):
    """失败时重试的装饰器"""
    import time

    def decorator(func):
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts >= max_attempts:
                        print(f"失败 {max_attempts} 次，放弃")
                        raise
                    print(f"尝试 {attempts} 失败: {e}，{delay}秒后重试...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def unstable_function():
    import random
    if random.random() < 0.7:
        raise Exception("随机错误")
    return "成功"

# 可能需要多次尝试
try:
    result = unstable_function()
    print(result)
except Exception:
    print("所有尝试都失败了")
```

## 类装饰器

### 使用类作为装饰器

类也可以作为装饰器使用，需要实现 `__call__` 方法。

```python
class CountCalls:
    """统计函数调用次数的类装饰器"""
    def __init__(self, func):
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"{self.func.__name__} 已被调用 {self.count} 次")
        return self.func(*args, **kwargs)

@CountCalls
def say_hello():
    print("你好！")

say_hello()
say_hello()
say_hello()
```

**输出：**
```
say_hello 已被调用 1 次
你好！
say_hello 已被调用 2 次
你好！
say_hello 已被调用 3 次
你好！
```

### 带参数的类装饰器

```python
class RateLimit:
    """限制函数调用频率的类装饰器"""
    def __init__(self, max_calls, time_window):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []

    def __call__(self, func):
        def wrapper(*args, **kwargs):
            import time
            now = time.time()

            # 移除时间窗口外的调用记录
            self.calls = [call_time for call_time in self.calls
                         if now - call_time < self.time_window]

            if len(self.calls) >= self.max_calls:
                raise Exception(
                    f"超过速率限制：{self.max_calls} 次/{self.time_window} 秒"
                )

            self.calls.append(now)
            return func(*args, **kwargs)

        return wrapper

@RateLimit(max_calls=3, time_window=5)
def api_call():
    print("API 调用成功")

# 前3次调用成功
for i in range(3):
    api_call()

# 第4次调用会失败
try:
    api_call()
except Exception as e:
    print(f"错误: {e}")
```

### 装饰类的装饰器

装饰器不仅可以装饰函数，也可以装饰类。

```python
def singleton(cls):
    """单例模式装饰器"""
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class Database:
    def __init__(self):
        print("初始化数据库连接")
        self.connection = "db_connection"

# 多次实例化返回同一个对象
db1 = Database()
db2 = Database()
print(f"db1 和 db2 是同一个对象: {db1 is db2}")
```

**输出：**
```
初始化数据库连接
db1 和 db2 是同一个对象: True
```

## 装饰器堆叠

多个装饰器可以堆叠使用，执行顺序是从下到上（从内到外）。

```python
def bold(func):
    def wrapper(*args, **kwargs):
        return "<b>" + func(*args, **kwargs) + "</b>"
    return wrapper

def italic(func):
    def wrapper(*args, **kwargs):
        return "<i>" + func(*args, **kwargs) + "</i>"
    return wrapper

def underline(func):
    def wrapper(*args, **kwargs):
        return "<u>" + func(*args, **kwargs) + "</u>"
    return wrapper

@bold
@italic
@underline
def greet():
    return "你好，世界"

# 等价于：bold(italic(underline(greet)))
print(greet())
```

**输出：**
```
<b><i><u>你好，世界</u></i></b>
```

### 装饰器执行顺序示例

```python
def decorator_1(func):
    print("装饰器 1 应用")
    def wrapper(*args, **kwargs):
        print("装饰器 1 - 执行前")
        result = func(*args, **kwargs)
        print("装饰器 1 - 执行后")
        return result
    return wrapper

def decorator_2(func):
    print("装饰器 2 应用")
    def wrapper(*args, **kwargs):
        print("装饰器 2 - 执行前")
        result = func(*args, **kwargs)
        print("装饰器 2 - 执行后")
        return result
    return wrapper

@decorator_1
@decorator_2
def my_function():
    print("原始函数执行")

print("\n调用函数:")
my_function()
```

**输出：**
```
装饰器 2 应用
装饰器 1 应用

调用函数:
装饰器 1 - 执行前
装饰器 2 - 执行前
原始函数执行
装饰器 2 - 执行后
装饰器 1 - 执行后
```

## functools.wraps

使用装饰器时，被装饰的函数的元数据（如 `__name__`、`__doc__` 等）会丢失。`functools.wraps` 可以保留这些元数据。

### 不使用 wraps 的问题

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        """wrapper 函数的文档"""
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name):
    """向指定的人问好"""
    return f"你好，{name}！"

print(f"函数名: {greet.__name__}")
print(f"文档: {greet.__doc__}")
```

**输出：**
```
函数名: wrapper
文档: wrapper 函数的文档
```

### 使用 wraps 保留元数据

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """wrapper 函数的文档"""
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name):
    """向指定的人问好"""
    return f"你好，{name}！"

print(f"函数名: {greet.__name__}")
print(f"文档: {greet.__doc__}")
```

**输出：**
```
函数名: greet
文档: 向指定的人问好
```

### wraps 的完整示例

```python
from functools import wraps

def debug(func):
    """调试装饰器，打印函数调用信息"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        args_str = ', '.join(repr(arg) for arg in args)
        kwargs_str = ', '.join(f"{k}={v!r}" for k, v in kwargs.items())
        all_args = ', '.join(filter(None, [args_str, kwargs_str]))

        print(f"调用 {func.__name__}({all_args})")
        result = func(*args, **kwargs)
        print(f"{func.__name__} 返回 {result!r}")
        return result

    return wrapper

@debug
def multiply(x, y):
    """返回两个数的乘积"""
    return x * y

result = multiply(3, 4)
print(f"\n函数名: {multiply.__name__}")
print(f"文档: {multiply.__doc__}")
```

## 常用装饰器模式

### 性能分析装饰器

```python
from functools import wraps
import time
import cProfile
import pstats
from io import StringIO

def profile(func):
    """性能分析装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()

        result = func(*args, **kwargs)

        profiler.disable()
        s = StringIO()
        stats = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
        stats.print_stats(10)  # 打印前10条
        print(s.getvalue())

        return result
    return wrapper

@profile
def complex_calculation():
    """执行复杂计算"""
    total = 0
    for i in range(100000):
        total += i ** 2
    return total

result = complex_calculation()
```

### 参数验证装饰器

```python
from functools import wraps

def validate_types(**expected_types):
    """类型验证装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 获取函数的参数名
            import inspect
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()

            # 验证类型
            for param_name, expected_type in expected_types.items():
                if param_name in bound.arguments:
                    value = bound.arguments[param_name]
                    if not isinstance(value, expected_type):
                        raise TypeError(
                            f"参数 '{param_name}' 应该是 {expected_type.__name__}，"
                            f"而不是 {type(value).__name__}"
                        )

            return func(*args, **kwargs)
        return wrapper
    return decorator

@validate_types(name=str, age=int, salary=float)
def create_employee(name, age, salary):
    return f"员工: {name}, 年龄: {age}, 薪水: {salary}"

# 正确调用
print(create_employee("王五", 30, 5000.0))

# 错误调用
try:
    print(create_employee("王五", "三十", 5000.0))
except TypeError as e:
    print(f"类型错误: {e}")
```

### 异常处理装饰器

```python
from functools import wraps

def handle_exceptions(*exception_types, default_return=None, log=True):
    """异常处理装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except exception_types as e:
                if log:
                    print(f"捕获异常 {type(e).__name__} 在 {func.__name__}: {e}")
                return default_return
        return wrapper
    return decorator

@handle_exceptions(ValueError, ZeroDivisionError, default_return=0)
def divide(a, b):
    """除法运算"""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ValueError("参数必须是数字")
    return a / b

print(divide(10, 2))     # 正常执行: 5.0
print(divide(10, 0))     # 捕获 ZeroDivisionError: 0
print(divide("10", 2))   # 捕获 ValueError: 0
```

### 属性访问装饰器

```python
from functools import wraps

class PropertyDecorator:
    """自定义属性装饰器"""
    def __init__(self, func):
        self.func = func
        self.name = func.__name__
        self.cache = {}

    def __get__(self, instance, owner):
        if instance is None:
            return self

        if instance not in self.cache:
            self.cache[instance] = self.func(instance)

        return self.cache[instance]

class Circle:
    def __init__(self, radius):
        self.radius = radius

    @PropertyDecorator
    def area(self):
        """计算圆的面积（带缓存）"""
        print(f"计算半径为 {self.radius} 的圆的面积")
        import math
        return math.pi * self.radius ** 2

circle = Circle(5)
print(f"面积: {circle.area}")  # 计算并缓存
print(f"面积: {circle.area}")  # 从缓存返回
```

### 延迟执行装饰器

```python
from functools import wraps
import time

def delay(seconds):
    """延迟执行装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            print(f"等待 {seconds} 秒后执行...")
            time.sleep(seconds)
            return func(*args, **kwargs)
        return wrapper
    return decorator

@delay(2)
def greet(name):
    print(f"你好，{name}！")

greet("赵六")
```

### 记忆化装饰器（完整版）

```python
from functools import wraps

def memoize(func):
    """记忆化装饰器，缓存函数结果"""
    cache = {}

    @wraps(func)
    def wrapper(*args, **kwargs):
        # 创建可哈希的键
        key = str(args) + str(kwargs)

        if key not in cache:
            print(f"计算 {func.__name__}{args}")
            cache[key] = func(*args, **kwargs)
        else:
            print(f"从缓存返回 {func.__name__}{args}")

        return cache[key]

    # 添加清除缓存的方法
    wrapper.cache_clear = lambda: cache.clear()
    wrapper.cache_info = lambda: {'size': len(cache), 'cache': cache}

    return wrapper

@memoize
def fibonacci(n):
    """计算斐波那契数列"""
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"fibonacci(10) = {fibonacci(10)}")
print(f"缓存信息: {fibonacci.cache_info()}")
```

### 上下文管理装饰器

```python
from functools import wraps
import sys
from io import StringIO

def capture_output(func):
    """捕获函数输出的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        old_stdout = sys.stdout
        sys.stdout = captured_output = StringIO()

        try:
            result = func(*args, **kwargs)
            output = captured_output.getvalue()
            return result, output
        finally:
            sys.stdout = old_stdout

    return wrapper

@capture_output
def noisy_function():
    print("这是第一行")
    print("这是第二行")
    return "返回值"

result, output = noisy_function()
print(f"函数返回: {result}")
print(f"捕获的输出:\n{output}")
```

### 权限检查装饰器

```python
from functools import wraps

class User:
    def __init__(self, username, role):
        self.username = username
        self.role = role

# 模拟当前用户
current_user = User("admin", "admin")

def require_role(*roles):
    """角色权限检查装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if current_user.role not in roles:
                raise PermissionError(
                    f"需要角色 {roles} 之一，当前角色: {current_user.role}"
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator

@require_role("admin", "moderator")
def delete_user(user_id):
    return f"删除用户 {user_id}"

@require_role("admin")
def view_system_settings():
    return "系统设置"

# admin 角色可以访问
print(delete_user(123))
print(view_system_settings())

# 修改为普通用户
current_user.role = "user"
try:
    delete_user(456)
except PermissionError as e:
    print(f"权限错误: {e}")
```

## 最佳实践

### 始终使用 functools.wraps

```python
from functools import wraps

def good_decorator(func):
    @wraps(func)  # 保留原函数元数据
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### 处理参数和关键字参数

```python
def flexible_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):  # 接受任意参数
        return func(*args, **kwargs)
    return wrapper
```

### 可选参数的装饰器

```python
from functools import wraps

def optional_arg_decorator(func=None, *, option=None):
    """可以带参数或不带参数使用的装饰器"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            print(f"选项: {option}")
            return f(*args, **kwargs)
        return wrapper

    if func is None:
        # 带参数调用：@optional_arg_decorator(option="value")
        return decorator
    else:
        # 不带参数调用：@optional_arg_decorator
        return decorator(func)

@optional_arg_decorator
def func1():
    print("函数1")

@optional_arg_decorator(option="自定义值")
def func2():
    print("函数2")

func1()
func2()
```

### 类方法装饰器

```python
from functools import wraps

def method_decorator(func):
    """适用于类方法的装饰器"""
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        print(f"调用 {self.__class__.__name__}.{func.__name__}")
        return func(self, *args, **kwargs)
    return wrapper

class MyClass:
    @method_decorator
    def my_method(self):
        print("方法执行")

obj = MyClass()
obj.my_method()
```

### 装饰器文档化

```python
from functools import wraps

def well_documented_decorator(func):
    """
    这是一个文档完善的装饰器。

    功能：记录函数调用次数

    参数：
        func: 要装饰的函数

    返回：
        wrapper: 包装后的函数

    示例：
        @well_documented_decorator
        def my_func():
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        print(f"调用次数: {wrapper.calls}")
        return func(*args, **kwargs)

    wrapper.calls = 0
    return wrapper
```

### 装饰器调试技巧

```python
from functools import wraps

def debug_decorator(func):
    """用于调试的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"\n{'='*50}")
        print(f"函数: {func.__name__}")
        print(f"参数: args={args}, kwargs={kwargs}")

        try:
            result = func(*args, **kwargs)
            print(f"返回: {result}")
            return result
        except Exception as e:
            print(f"异常: {type(e).__name__}: {e}")
            raise
        finally:
            print(f"{'='*50}\n")

    return wrapper

@debug_decorator
def divide(a, b):
    return a / b

divide(10, 2)
try:
    divide(10, 0)
except ZeroDivisionError:
    pass
```

## 总结

Python 装饰器是一个强大而优雅的特性，主要优势包括：

1. **代码复用**：将通用功能（如日志、计时、缓存）封装为装饰器
2. **关注点分离**：将横切关注点与业务逻辑分离
3. **可读性**：使用 `@` 语法清晰地表达函数的增强
4. **灵活性**：支持函数装饰器、类装饰器、参数化装饰器等多种形式

### 关键要点

- 装饰器本质是接受函数并返回函数的高阶函数
- 使用 `functools.wraps` 保留原函数元数据
- 装饰器可以堆叠使用，执行顺序从下到上
- 类也可以作为装饰器使用（实现 `__call__` 方法）
- 带参数的装饰器需要额外的嵌套层级

### 常见应用场景

- 日志记录
- 性能监控
- 访问控制
- 缓存结果
- 输入验证
- 错误处理
- 重试逻辑
- 限流控制

掌握装饰器将使你的 Python 代码更加优雅、模块化和可维护。
