---
title: Python 性能分析
description: 掌握 Python 性能分析工具：cProfile、timeit、pstats、line_profiler、memory_profiler、py-spy 与 snakeviz 可视化
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - 性能分析
  - cProfile
  - timeit
  - 优化
  - 调试
status: imported
origin: old/src/content/docs/python/profiling.zh.md
divergence: 0.209
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 测试与调试
  order: 25
  lastUpdated: 2026-01-07
---

性能分析（Profiling）是优化 Python 程序的关键步骤。通过性能分析，我们可以识别代码中的性能瓶颈，找出耗时最多的函数和代码行，从而有针对性地进行优化。Python 提供了多种内置和第三方性能分析工具，本文将深入介绍这些工具的使用方法和最佳实践。

## 概念解释

### 什么是性能分析

性能分析是一种动态程序分析技术，用于测量程序的时间复杂度、空间复杂度以及特定指令或函数的调用频率和持续时间。通过性能分析，开发者可以：

- **识别性能瓶颈**：找出程序中最耗时的部分
- **优化资源使用**：发现内存泄漏和不必要的资源消耗
- **验证优化效果**：量化评估优化前后的性能差异
- **理解程序行为**：深入了解程序的执行流程

### 性能分析的类型

```
+─────────────────────────────────────────────────────────+
│                    性能分析类型                          │
+─────────────────────+───────────────────────────────────+
│  确定性分析          │  统计性分析                        │
│  (Deterministic)    │  (Statistical)                    │
+─────────────────────+───────────────────────────────────+
│  - 监控所有函数调用   │  - 周期性采样程序状态              │
│  - 精确但开销大       │  - 开销小但精度较低                │
│  - cProfile, profile │  - py-spy, pyinstrument           │
+─────────────────────+───────────────────────────────────+
```

### Python 性能分析工具生态

| 工具 | 类型 | 用途 | 开销 |
|------|------|------|------|
| `timeit` | 基准测试 | 测量小代码片段执行时间 | 极低 |
| `cProfile` | 确定性分析 | 函数级别的 CPU 分析 | 中等 |
| `profile` | 确定性分析 | 纯 Python 实现的分析器 | 较高 |
| `pstats` | 结果处理 | 分析和展示 profiler 结果 | 无 |
| `line_profiler` | 行级分析 | 逐行分析代码性能 | 较高 |
| `memory_profiler` | 内存分析 | 监控内存使用 | 较高 |
| `py-spy` | 采样分析 | 低开销的生产环境分析 | 极低 |
| `snakeviz` | 可视化 | 可视化 cProfile 结果 | 无 |

## 核心原理

### cProfile 工作原理

cProfile 是 Python 标准库中的确定性性能分析器，使用 C 语言实现以减少开销。

```
+─────────────────────────────────────────────────────────+
│                 cProfile 工作流程                        │
+─────────────────────────────────────────────────────────+
│                                                         │
│  +──────────+    +──────────+    +──────────+          │
│  │ 函数调用  │───>│  计时器   │───>│ 记录数据  │          │
│  +──────────+    +──────────+    +──────────+          │
│        │                              │                 │
│        v                              v                 │
│  +──────────+                  +──────────+            │
│  │ 函数返回  │<────────────────│ 累计统计  │            │
│  +──────────+                  +──────────+            │
│                                                         │
+─────────────────────────────────────────────────────────+
```

cProfile 监控每个函数的：
- **ncalls**：调用次数
- **tottime**：函数本身执行时间（不包括子函数）
- **cumtime**：累计执行时间（包括子函数）
- **percall**：每次调用平均时间

### timeit 工作原理

timeit 模块通过多次执行代码来获得准确的执行时间测量：

```python
# timeit 的核心逻辑简化版
import gc
import time

def timeit_logic(stmt, setup, number):
    """
    1. 执行 setup 代码（只执行一次）
    2. 执行 stmt 代码 number 次
    3. 测量总时间并返回
    """
    # 禁用垃圾回收以减少干扰
    gc.disable()
    try:
        # 执行设置代码
        exec(setup)
        # 记录开始时间
        start = time.perf_counter()
        # 执行 number 次
        for _ in range(number):
            exec(stmt)
        # 返回总时间
        return time.perf_counter() - start
    finally:
        gc.enable()
```

### 采样分析器原理

py-spy 等采样分析器使用不同的方法：

```
+─────────────────────────────────────────────────────────+
│                采样分析器工作原理                         │
+─────────────────────────────────────────────────────────+
│                                                         │
│  程序执行:  ════════════════════════════════════════    │
│                                                         │
│  采样点:      |     |     |     |     |     |           │
│            样本1  样本2  样本3  样本4  样本5  样本6       │
│                                                         │
│  统计: 函数A出现在 60% 的样本中 -> 占用 60% 的时间        │
│                                                         │
+─────────────────────────────────────────────────────────+
```

## 核心要点

### timeit 模块

timeit 是测量小代码片段执行时间的标准方法。

```python
import timeit

# 方式1: 使用字符串
time_result = timeit.timeit(
    stmt='"-".join(str(n) for n in range(100))',
    number=10000
)
print(f"执行时间: {time_result:.4f} 秒")

# 方式2: 使用函数
def test_function():
    return "-".join(str(n) for n in range(100))

time_result = timeit.timeit(test_function, number=10000)
print(f"执行时间: {time_result:.4f} 秒")

# 方式3: 带设置代码
time_result = timeit.timeit(
    stmt='sorted(data)',
    setup='import random; data = [random.random() for _ in range(1000)]',
    number=1000
)
print(f"排序时间: {time_result:.4f} 秒")
```

**命令行使用：**

```bash
# 基本用法
python -m timeit '"-".join(str(n) for n in range(100))'

# 带设置代码
python -m timeit -s 'import random; data = [random.random() for _ in range(1000)]' 'sorted(data)'

# 指定重复次数
python -m timeit -n 10000 -r 5 'sum(range(100))'
```

### cProfile 模块

cProfile 是 Python 标准库中最常用的性能分析器。

```python
import cProfile
import pstats
from io import StringIO

def fibonacci(n):
    """计算斐波那契数列"""
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def factorial(n):
    """计算阶乘"""
    if n <= 1:
        return 1
    return n * factorial(n-1)

def main():
    """主函数"""
    result1 = fibonacci(25)
    result2 = factorial(100)
    return result1, result2

# 方式1: 直接运行
cProfile.run('main()')

# 方式2: 保存结果到文件
cProfile.run('main()', 'profile_output.prof')

# 方式3: 使用 Profile 对象获得更多控制
profiler = cProfile.Profile()
profiler.enable()

main()

profiler.disable()

# 打印结果
profiler.print_stats(sort='cumulative')

# 保存结果
profiler.dump_stats('profile_output.prof')
```

**命令行使用：**

```bash
# 分析整个脚本
python -m cProfile my_script.py

# 保存结果到文件
python -m cProfile -o output.prof my_script.py

# 按累计时间排序
python -m cProfile -s cumulative my_script.py
```

### pstats 模块

pstats 用于分析和处理 cProfile 的输出结果。

```python
import pstats
from pstats import SortKey

# 从文件加载分析结果
stats = pstats.Stats('profile_output.prof')

# 去除文件路径，使输出更简洁
stats.strip_dirs()

# 按不同方式排序并打印
# 按累计时间排序
stats.sort_stats(SortKey.CUMULATIVE)
stats.print_stats(10)  # 打印前10条

# 按调用次数排序
stats.sort_stats(SortKey.CALLS)
stats.print_stats(10)

# 按函数本身执行时间排序
stats.sort_stats(SortKey.TIME)
stats.print_stats(10)

# 只显示特定函数的统计
stats.print_stats('fibonacci')

# 显示调用者信息
stats.print_callers('fibonacci')

# 显示被调用者信息
stats.print_callees('main')

# 合并多个分析结果
stats1 = pstats.Stats('profile1.prof')
stats2 = pstats.Stats('profile2.prof')
stats1.add(stats2)
stats1.print_stats()
```

### profile 模块

profile 是纯 Python 实现的分析器，开销比 cProfile 大但更容易扩展。

```python
import profile

def slow_function():
    total = 0
    for i in range(100000):
        total += i ** 2
    return total

# 使用方式与 cProfile 相同
profile.run('slow_function()')
```

### line_profiler (第三方库)

line_profiler 提供逐行的性能分析。

```bash
# 安装
pip install line_profiler
```

```python
# 使用装饰器标记要分析的函数
from line_profiler import profile

@profile
def process_data(data):
    result = []
    for item in data:
        # 这行会被详细分析
        processed = item ** 2
        result.append(processed)

    # 这行也会被分析
    total = sum(result)
    return total

# 运行函数
data = list(range(10000))
process_data(data)
```

**命令行使用：**

```bash
# 分析脚本
kernprof -l -v my_script.py

# 查看之前的分析结果
python -m line_profiler my_script.py.lprof
```

**手动使用 LineProfiler：**

```python
from line_profiler import LineProfiler

def compute_sum(n):
    total = 0
    for i in range(n):
        total += i
    return total

def compute_product(n):
    product = 1
    for i in range(1, n + 1):
        product *= i
    return product

# 创建分析器
lp = LineProfiler()

# 添加要分析的函数
lp.add_function(compute_sum)
lp.add_function(compute_product)

# 包装主函数
lp_wrapper = lp(lambda: (compute_sum(1000), compute_product(100)))
lp_wrapper()

# 打印结果
lp.print_stats()
```

### memory_profiler (第三方库)

memory_profiler 用于分析内存使用情况。

```bash
# 安装
pip install memory_profiler
```

```python
from memory_profiler import profile

@profile
def create_large_list():
    """创建大列表，观察内存变化"""
    # 创建包含100万个整数的列表
    large_list = [i for i in range(1000000)]

    # 创建另一个列表
    another_list = [x * 2 for x in large_list]

    # 删除第一个列表
    del large_list

    return another_list

result = create_large_list()
```

**命令行使用：**

```bash
# 运行内存分析
python -m memory_profiler my_script.py

# 生成内存使用图表
mprof run my_script.py
mprof plot
```

**监控内存使用：**

```python
from memory_profiler import memory_usage
import time

def memory_intensive_task():
    """内存密集型任务"""
    data = []
    for _ in range(10):
        data.append([0] * 1000000)
        time.sleep(0.1)
    return len(data)

# 监控内存使用
mem_usage = memory_usage(
    (memory_intensive_task,),
    interval=0.1,
    timeout=10
)

print(f"峰值内存使用: {max(mem_usage):.2f} MiB")
print(f"内存变化: {mem_usage[-1] - mem_usage[0]:.2f} MiB")
```

### py-spy (第三方库)

py-spy 是一个采样分析器，开销极低，可用于生产环境。

```bash
# 安装
pip install py-spy
```

**命令行使用：**

```bash
# 分析正在运行的进程
py-spy top --pid 12345

# 记录分析数据
py-spy record -o profile.svg --pid 12345

# 分析脚本
py-spy record -o profile.svg -- python my_script.py

# 生成火焰图
py-spy record --format speedscope -o profile.json -- python my_script.py
```

### snakeviz (可视化工具)

snakeviz 提供交互式的 cProfile 结果可视化。

```bash
# 安装
pip install snakeviz
```

```bash
# 首先生成 profile 数据
python -m cProfile -o output.prof my_script.py

# 使用 snakeviz 可视化
snakeviz output.prof
```

这会在浏览器中打开一个交互式界面，显示：
- **Sunburst 图**：显示函数调用的层次结构
- **Icicle 图**：另一种可视化方式
- **详细统计表**：可排序的函数调用统计

## 代码示例

### 完整的性能分析示例

```python
"""
performance_analysis.py
演示各种性能分析技术
"""

import cProfile
import pstats
import timeit
from io import StringIO
from functools import lru_cache

# ============================================================
# 示例函数：不同复杂度的算法
# ============================================================

def bubble_sort(arr):
    """冒泡排序 O(n^2)"""
    arr = arr.copy()
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(arr):
    """快速排序 O(n log n)"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

def fibonacci_recursive(n):
    """递归斐波那契（无缓存）"""
    if n < 2:
        return n
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

@lru_cache(maxsize=None)
def fibonacci_cached(n):
    """带缓存的斐波那契"""
    if n < 2:
        return n
    return fibonacci_cached(n - 1) + fibonacci_cached(n - 2)

def fibonacci_iterative(n):
    """迭代斐波那契"""
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

# ============================================================
# 使用 timeit 比较性能
# ============================================================

def compare_with_timeit():
    """使用 timeit 比较不同实现的性能"""
    print("=" * 60)
    print("使用 timeit 比较算法性能")
    print("=" * 60)

    # 比较排序算法
    print("\n排序算法比较（1000个元素）:")
    setup = "import random; data = [random.random() for _ in range(1000)]"

    bubble_time = timeit.timeit(
        "bubble_sort(data)",
        setup=setup + "; from __main__ import bubble_sort",
        number=10
    )

    quick_time = timeit.timeit(
        "quick_sort(data)",
        setup=setup + "; from __main__ import quick_sort",
        number=10
    )

    builtin_time = timeit.timeit(
        "sorted(data)",
        setup=setup,
        number=10
    )

    print(f"  冒泡排序: {bubble_time:.4f} 秒 (10次)")
    print(f"  快速排序: {quick_time:.4f} 秒 (10次)")
    print(f"  内置排序: {builtin_time:.4f} 秒 (10次)")

    # 比较斐波那契实现
    print("\n斐波那契实现比较（n=30）:")

    recursive_time = timeit.timeit(
        "fibonacci_recursive(30)",
        setup="from __main__ import fibonacci_recursive",
        number=1
    )

    # 清除缓存后测试
    fibonacci_cached.cache_clear()
    cached_time = timeit.timeit(
        "fibonacci_cached(30)",
        setup="from __main__ import fibonacci_cached",
        number=1
    )

    iterative_time = timeit.timeit(
        "fibonacci_iterative(30)",
        setup="from __main__ import fibonacci_iterative",
        number=1000
    )

    print(f"  递归版本: {recursive_time:.4f} 秒 (1次)")
    print(f"  缓存版本: {cached_time:.6f} 秒 (1次)")
    print(f"  迭代版本: {iterative_time:.6f} 秒 (1000次)")

# ============================================================
# 使用 cProfile 进行详细分析
# ============================================================

def profile_sorting():
    """分析排序函数"""
    import random
    data = [random.random() for _ in range(1000)]

    # 执行排序
    bubble_sort(data)
    quick_sort(data)
    sorted(data)

def analyze_with_cprofile():
    """使用 cProfile 进行详细分析"""
    print("\n" + "=" * 60)
    print("使用 cProfile 进行详细分析")
    print("=" * 60)

    # 创建分析器
    profiler = cProfile.Profile()

    # 运行分析
    profiler.enable()
    profile_sorting()
    profiler.disable()

    # 创建统计对象
    stream = StringIO()
    stats = pstats.Stats(profiler, stream=stream)
    stats.strip_dirs()
    stats.sort_stats(pstats.SortKey.CUMULATIVE)
    stats.print_stats(20)

    print(stream.getvalue())

# ============================================================
# 自定义性能分析装饰器
# ============================================================

def profile_decorator(func):
    """性能分析装饰器"""
    from functools import wraps

    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()

        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()

        # 打印统计
        stream = StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.strip_dirs()
        stats.sort_stats(pstats.SortKey.CUMULATIVE)
        stats.print_stats(10)
        print(f"\n函数 {func.__name__} 的性能分析:")
        print(stream.getvalue())

        return result

    return wrapper

def timer_decorator(func):
    """简单计时装饰器"""
    from functools import wraps
    import time

    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} 执行时间: {end - start:.6f} 秒")
        return result

    return wrapper

# 使用装饰器
@timer_decorator
def compute_intensive_task():
    """计算密集型任务"""
    result = 0
    for i in range(100000):
        result += i ** 2 % 1000
    return result

# ============================================================
# 上下文管理器形式的性能分析
# ============================================================

class Profiler:
    """性能分析上下文管理器"""

    def __init__(self, name="Profile"):
        self.name = name
        self.profiler = cProfile.Profile()

    def __enter__(self):
        self.profiler.enable()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.profiler.disable()

        stream = StringIO()
        stats = pstats.Stats(self.profiler, stream=stream)
        stats.strip_dirs()
        stats.sort_stats(pstats.SortKey.CUMULATIVE)
        stats.print_stats(10)

        print(f"\n{self.name} 性能分析结果:")
        print(stream.getvalue())

        return False

class Timer:
    """计时上下文管理器"""

    def __init__(self, name="Timer"):
        self.name = name
        self.start = None
        self.end = None

    def __enter__(self):
        import time
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.end = time.perf_counter()
        print(f"{self.name}: {self.end - self.start:.6f} 秒")
        return False

    @property
    def elapsed(self):
        if self.end is None:
            import time
            return time.perf_counter() - self.start
        return self.end - self.start

# 使用上下文管理器
def demonstrate_context_managers():
    """演示上下文管理器的使用"""
    print("\n" + "=" * 60)
    print("使用上下文管理器进行性能分析")
    print("=" * 60)

    # 使用 Timer
    with Timer("列表推导式"):
        result = [i ** 2 for i in range(100000)]

    # 使用 Profiler
    with Profiler("斐波那契计算"):
        fibonacci_cached.cache_clear()
        fibonacci_cached(100)

# ============================================================
# 内存使用分析
# ============================================================

def analyze_memory_usage():
    """分析内存使用（需要 memory_profiler）"""
    import sys

    print("\n" + "=" * 60)
    print("内存使用分析")
    print("=" * 60)

    # 使用 sys.getsizeof 获取对象大小
    objects = {
        "空列表": [],
        "1000个整数的列表": list(range(1000)),
        "空字典": {},
        "1000项字典": {i: i for i in range(1000)},
        "空集合": set(),
        "1000元素集合": set(range(1000)),
        "空字符串": "",
        "1000字符字符串": "a" * 1000,
    }

    for name, obj in objects.items():
        size = sys.getsizeof(obj)
        print(f"  {name}: {size:,} 字节")

# ============================================================
# 比较不同方法的性能
# ============================================================

def compare_list_operations():
    """比较不同列表操作的性能"""
    print("\n" + "=" * 60)
    print("列表操作性能比较")
    print("=" * 60)

    n = 100000

    # 列表推导式 vs 循环
    with Timer("列表推导式"):
        result1 = [i ** 2 for i in range(n)]

    with Timer("传统循环"):
        result2 = []
        for i in range(n):
            result2.append(i ** 2)

    with Timer("map 函数"):
        result3 = list(map(lambda x: x ** 2, range(n)))

    # 字符串连接方式比较
    print("\n字符串连接比较（10000次）:")

    with Timer("join 方法"):
        result = "".join(str(i) for i in range(10000))

    with Timer("+ 运算符"):
        result = ""
        for i in range(10000):
            result += str(i)

# ============================================================
# 主程序
# ============================================================

if __name__ == "__main__":
    # 执行所有演示
    compare_with_timeit()
    analyze_with_cprofile()

    # 测试装饰器
    print("\n" + "=" * 60)
    print("装饰器演示")
    print("=" * 60)
    compute_intensive_task()

    demonstrate_context_managers()
    analyze_memory_usage()
    compare_list_operations()
```

### timeit 高级用法

```python
import timeit
from functools import partial

# ============================================================
# Timer 类的使用
# ============================================================

# 创建 Timer 对象进行更精细的控制
timer = timeit.Timer(
    stmt='sum(range(1000))',
    globals=globals()
)

# 自动确定合适的执行次数
number, time_taken = timer.autorange()
print(f"自动选择执行 {number} 次，总时间 {time_taken:.4f} 秒")

# 多次重复测试
times = timer.repeat(repeat=5, number=10000)
print(f"5次测试结果: {times}")
print(f"最小值: {min(times):.6f} 秒")
print(f"平均值: {sum(times)/len(times):.6f} 秒")

# ============================================================
# 比较多个实现
# ============================================================

def benchmark_implementations():
    """比较多种实现方式"""

    implementations = {
        "列表推导式": "[x**2 for x in range(1000)]",
        "map + lambda": "list(map(lambda x: x**2, range(1000)))",
        "map + pow": "list(map(pow, range(1000), [2]*1000))",
        "生成器表达式": "list(x**2 for x in range(1000))",
    }

    results = {}
    for name, stmt in implementations.items():
        time_result = timeit.timeit(stmt, number=10000)
        results[name] = time_result

    # 按时间排序输出
    print("\n性能排名（从快到慢）:")
    for i, (name, time_result) in enumerate(sorted(results.items(), key=lambda x: x[1]), 1):
        print(f"  {i}. {name}: {time_result:.4f} 秒")

benchmark_implementations()

# ============================================================
# 使用 globals 参数传递变量
# ============================================================

def test_with_globals():
    """演示如何传递变量到 timeit"""

    # 要测试的数据
    my_list = list(range(10000))
    my_dict = {i: i for i in range(10000)}

    # 使用 globals() 传递变量
    list_time = timeit.timeit(
        'my_list[5000]',
        globals={'my_list': my_list},
        number=100000
    )

    dict_time = timeit.timeit(
        'my_dict[5000]',
        globals={'my_dict': my_dict},
        number=100000
    )

    print(f"\n列表索引访问: {list_time:.6f} 秒")
    print(f"字典键访问: {dict_time:.6f} 秒")

test_with_globals()
```

### cProfile 高级用法

```python
import cProfile
import pstats
from pstats import SortKey
from io import StringIO
import os

# ============================================================
# 自定义分析结果输出
# ============================================================

def custom_profile_output(func, *args, **kwargs):
    """自定义性能分析输出格式"""
    profiler = cProfile.Profile()

    # 运行函数
    profiler.runcall(func, *args, **kwargs)

    # 获取统计数据
    stream = StringIO()
    stats = pstats.Stats(profiler, stream=stream)
    stats.strip_dirs()

    # 打印不同排序方式的结果
    print("\n按累计时间排序（前5个）:")
    stats.sort_stats(SortKey.CUMULATIVE)
    stats.print_stats(5)

    print("\n按调用次数排序（前5个）:")
    stats.sort_stats(SortKey.CALLS)
    stats.print_stats(5)

    print("\n按函数内部时间排序（前5个）:")
    stats.sort_stats(SortKey.TIME)
    stats.print_stats(5)

    return stats

# ============================================================
# 过滤和搜索分析结果
# ============================================================

def filter_profile_results():
    """演示如何过滤分析结果"""

    def sample_function():
        import json
        import re

        # 执行一些操作
        data = {"key": "value" * 1000}
        json_str = json.dumps(data)
        json.loads(json_str)

        text = "Hello World " * 100
        re.findall(r'\w+', text)

    # 分析函数
    profiler = cProfile.Profile()
    profiler.runcall(sample_function)

    stats = pstats.Stats(profiler)
    stats.strip_dirs()

    # 只显示包含 'json' 的函数
    print("\n包含 'json' 的函数:")
    stats.print_stats('json')

    # 只显示包含 're' 的函数
    print("\n包含 're' 的函数:")
    stats.print_stats('re')

    # 组合过滤条件
    print("\n只显示调用次数 > 10 的函数:")
    stats.sort_stats(SortKey.CALLS)
    # 注意：print_stats 的参数可以是正则表达式
    stats.print_stats(r'.*', 10)

filter_profile_results()

# ============================================================
# 分析调用关系
# ============================================================

def analyze_call_relationships():
    """分析函数调用关系"""

    def outer():
        for _ in range(10):
            middle()

    def middle():
        for _ in range(5):
            inner()

    def inner():
        sum(range(100))

    profiler = cProfile.Profile()
    profiler.runcall(outer)

    stats = pstats.Stats(profiler)
    stats.strip_dirs()

    # 显示谁调用了 inner
    print("\n谁调用了 inner 函数:")
    stats.print_callers('inner')

    # 显示 outer 调用了谁
    print("\nouter 函数调用了谁:")
    stats.print_callees('outer')

analyze_call_relationships()

# ============================================================
# 合并多个分析结果
# ============================================================

def merge_profile_results():
    """合并多个分析会话的结果"""

    def task1():
        return sum(i ** 2 for i in range(10000))

    def task2():
        return [x ** 0.5 for x in range(10000)]

    # 分别分析两个任务
    prof1 = cProfile.Profile()
    prof1.runcall(task1)
    prof1.dump_stats('/tmp/profile1.prof')

    prof2 = cProfile.Profile()
    prof2.runcall(task2)
    prof2.dump_stats('/tmp/profile2.prof')

    # 合并结果
    combined_stats = pstats.Stats('/tmp/profile1.prof')
    combined_stats.add('/tmp/profile2.prof')

    print("\n合并后的分析结果:")
    combined_stats.strip_dirs()
    combined_stats.sort_stats(SortKey.CUMULATIVE)
    combined_stats.print_stats(10)

    # 清理临时文件
    os.remove('/tmp/profile1.prof')
    os.remove('/tmp/profile2.prof')

merge_profile_results()
```

## 最佳实践

### 选择合适的工具

```python
"""
性能分析工具选择指南
"""

# 场景1: 快速比较两种实现
# 推荐：timeit
import timeit

# 比较列表和生成器
list_time = timeit.timeit(
    'sum([i for i in range(1000)])',
    number=10000
)
gen_time = timeit.timeit(
    'sum(i for i in range(1000))',
    number=10000
)
print(f"列表: {list_time:.4f}s, 生成器: {gen_time:.4f}s")

# 场景2: 找出程序瓶颈
# 推荐：cProfile
import cProfile
# cProfile.run('main()', sort='cumulative')

# 场景3: 精确定位某个函数的问题
# 推荐：line_profiler
# 在代码中添加 @profile 装饰器
# 然后运行 kernprof -l -v script.py

# 场景4: 分析内存问题
# 推荐：memory_profiler
# 在代码中添加 @profile 装饰器
# 然后运行 python -m memory_profiler script.py

# 场景5: 生产环境分析
# 推荐：py-spy
# py-spy record -o profile.svg --pid <PID>
```

### 建立基准测试框架

```python
"""
可复用的基准测试框架
"""

import timeit
import statistics
from typing import Callable, Dict, List
from dataclasses import dataclass

@dataclass
class BenchmarkResult:
    """基准测试结果"""
    name: str
    min_time: float
    max_time: float
    mean_time: float
    median_time: float
    std_dev: float
    iterations: int

class Benchmark:
    """基准测试类"""

    def __init__(self, warmup: int = 3, iterations: int = 10, number: int = 1000):
        self.warmup = warmup
        self.iterations = iterations
        self.number = number
        self.results: Dict[str, BenchmarkResult] = {}

    def run(self, name: str, func: Callable, *args, **kwargs) -> BenchmarkResult:
        """运行基准测试"""
        # 预热
        for _ in range(self.warmup):
            func(*args, **kwargs)

        # 收集数据
        times = []
        for _ in range(self.iterations):
            start = timeit.default_timer()
            for _ in range(self.number):
                func(*args, **kwargs)
            end = timeit.default_timer()
            times.append(end - start)

        result = BenchmarkResult(
            name=name,
            min_time=min(times),
            max_time=max(times),
            mean_time=statistics.mean(times),
            median_time=statistics.median(times),
            std_dev=statistics.stdev(times) if len(times) > 1 else 0,
            iterations=self.iterations * self.number
        )

        self.results[name] = result
        return result

    def compare(self, funcs: Dict[str, Callable], *args, **kwargs):
        """比较多个函数"""
        for name, func in funcs.items():
            self.run(name, func, *args, **kwargs)

        self.print_results()

    def print_results(self):
        """打印结果"""
        print("\n" + "=" * 70)
        print(f"{'名称':<20} {'最小':<12} {'平均':<12} {'标准差':<12}")
        print("=" * 70)

        # 按平均时间排序
        sorted_results = sorted(
            self.results.values(),
            key=lambda x: x.mean_time
        )

        baseline = sorted_results[0].mean_time

        for result in sorted_results:
            ratio = result.mean_time / baseline
            print(
                f"{result.name:<20} "
                f"{result.min_time*1000:>8.3f} ms  "
                f"{result.mean_time*1000:>8.3f} ms  "
                f"{result.std_dev*1000:>8.3f} ms  "
                f"({ratio:.2f}x)"
            )

# 使用示例
def bubble_sort(arr):
    arr = arr.copy()
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def insertion_sort(arr):
    arr = arr.copy()
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr

def builtin_sort(arr):
    return sorted(arr)

# 运行基准测试
import random
test_data = [random.random() for _ in range(100)]

benchmark = Benchmark(warmup=3, iterations=10, number=100)
benchmark.compare(
    {
        "冒泡排序": bubble_sort,
        "插入排序": insertion_sort,
        "内置排序": builtin_sort,
    },
    test_data
)
```

### 性能分析报告生成

```python
"""
生成详细的性能分析报告
"""

import cProfile
import pstats
from pstats import SortKey
from io import StringIO
from datetime import datetime

class ProfileReport:
    """性能分析报告生成器"""

    def __init__(self, name: str = "Profile Report"):
        self.name = name
        self.profiler = cProfile.Profile()
        self.stats = None

    def start(self):
        """开始分析"""
        self.profiler.enable()

    def stop(self):
        """停止分析"""
        self.profiler.disable()
        self.stats = pstats.Stats(self.profiler)
        self.stats.strip_dirs()

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()
        return False

    def get_top_functions(self, n: int = 20, sort_by: str = 'cumulative'):
        """获取最耗时的函数"""
        sort_key = {
            'cumulative': SortKey.CUMULATIVE,
            'time': SortKey.TIME,
            'calls': SortKey.CALLS,
        }.get(sort_by, SortKey.CUMULATIVE)

        stream = StringIO()
        self.stats.stream = stream
        self.stats.sort_stats(sort_key)
        self.stats.print_stats(n)

        return stream.getvalue()

    def get_call_graph(self, func_name: str):
        """获取函数调用图"""
        stream = StringIO()
        self.stats.stream = stream

        stream.write(f"\n调用 {func_name} 的函数:\n")
        self.stats.print_callers(func_name)

        stream.write(f"\n{func_name} 调用的函数:\n")
        self.stats.print_callees(func_name)

        return stream.getvalue()

    def generate_report(self, output_file: str = None):
        """生成完整报告"""
        report = []
        report.append(f"# {self.name}")
        report.append(f"生成时间: {datetime.now().isoformat()}")
        report.append("")

        report.append("## 按累计时间排序（前20个函数）")
        report.append("```")
        report.append(self.get_top_functions(20, 'cumulative'))
        report.append("```")

        report.append("## 按调用次数排序（前20个函数）")
        report.append("```")
        report.append(self.get_top_functions(20, 'calls'))
        report.append("```")

        report.append("## 按函数内部时间排序（前20个函数）")
        report.append("```")
        report.append(self.get_top_functions(20, 'time'))
        report.append("```")

        report_text = "\n".join(report)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report_text)

        return report_text

    def save_stats(self, filename: str):
        """保存原始统计数据"""
        self.profiler.dump_stats(filename)

# 使用示例
def complex_computation():
    """复杂计算示例"""
    import math

    result = 0
    for i in range(10000):
        result += math.sin(i) * math.cos(i)
        result += math.sqrt(abs(result)) if result > 0 else 0

    data = [i ** 2 for i in range(5000)]
    sorted_data = sorted(data, reverse=True)

    return result, sorted_data

# 生成报告
with ProfileReport("复杂计算分析") as report:
    for _ in range(10):
        complex_computation()

print(report.generate_report())
```

### 持续性能监控

```python
"""
持续性能监控模块
"""

import time
import functools
import threading
from collections import defaultdict
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from contextlib import contextmanager

@dataclass
class PerformanceMetrics:
    """性能指标"""
    call_count: int = 0
    total_time: float = 0.0
    min_time: float = float('inf')
    max_time: float = 0.0
    times: List[float] = field(default_factory=list)

    def record(self, duration: float):
        self.call_count += 1
        self.total_time += duration
        self.min_time = min(self.min_time, duration)
        self.max_time = max(self.max_time, duration)
        self.times.append(duration)

    @property
    def avg_time(self) -> float:
        return self.total_time / self.call_count if self.call_count > 0 else 0

    @property
    def p95_time(self) -> float:
        if not self.times:
            return 0
        sorted_times = sorted(self.times)
        idx = int(len(sorted_times) * 0.95)
        return sorted_times[idx]

class PerformanceMonitor:
    """性能监控器"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance.metrics: Dict[str, PerformanceMetrics] = defaultdict(PerformanceMetrics)
        return cls._instance

    def record(self, name: str, duration: float):
        """记录性能数据"""
        self.metrics[name].record(duration)

    def get_metrics(self, name: str) -> Optional[PerformanceMetrics]:
        """获取指定函数的指标"""
        return self.metrics.get(name)

    def get_all_metrics(self) -> Dict[str, PerformanceMetrics]:
        """获取所有指标"""
        return dict(self.metrics)

    def print_summary(self):
        """打印摘要"""
        print("\n" + "=" * 80)
        print("性能监控摘要")
        print("=" * 80)
        print(f"{'函数名':<30} {'调用次数':<10} {'平均时间':<15} {'P95':<15}")
        print("-" * 80)

        for name, metrics in sorted(self.metrics.items(), key=lambda x: x[1].total_time, reverse=True):
            print(
                f"{name:<30} "
                f"{metrics.call_count:<10} "
                f"{metrics.avg_time*1000:>10.3f} ms   "
                f"{metrics.p95_time*1000:>10.3f} ms"
            )

    def reset(self):
        """重置所有指标"""
        self.metrics.clear()

# 监控装饰器
def monitor(name: str = None):
    """性能监控装饰器"""
    def decorator(func):
        func_name = name or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                duration = time.perf_counter() - start
                PerformanceMonitor().record(func_name, duration)

        return wrapper
    return decorator

# 监控上下文管理器
@contextmanager
def monitor_block(name: str):
    """代码块性能监控"""
    start = time.perf_counter()
    try:
        yield
    finally:
        duration = time.perf_counter() - start
        PerformanceMonitor().record(name, duration)

# 使用示例
@monitor()
def database_query():
    """模拟数据库查询"""
    time.sleep(0.01)  # 模拟 IO
    return {"data": "result"}

@monitor()
def process_data(data):
    """处理数据"""
    return sum(range(10000))

@monitor("api_handler")
def handle_request():
    """处理 API 请求"""
    data = database_query()
    result = process_data(data)
    return result

# 运行示例
for _ in range(100):
    handle_request()

    with monitor_block("custom_block"):
        time.sleep(0.001)

# 打印监控结果
PerformanceMonitor().print_summary()
```

## 常见陷阱

### 测量不准确

```python
"""
避免不准确的性能测量
"""

import timeit
import time

# 陷阱1: 只运行一次
# 错误做法
def bad_timing():
    start = time.time()
    result = sum(range(10000))
    end = time.time()
    print(f"时间: {end - start}")  # 单次测量不准确

# 正确做法
def good_timing():
    # 使用 timeit 多次运行取平均
    time_result = timeit.timeit(
        'sum(range(10000))',
        number=1000
    )
    print(f"平均时间: {time_result/1000:.6f} 秒")

# 陷阱2: 不使用 perf_counter
# time.time() 精度较低，受系统时间影响
# time.perf_counter() 更适合性能测量

def accurate_timing():
    start = time.perf_counter()
    result = sum(range(10000))
    end = time.perf_counter()
    print(f"时间: {end - start:.6f} 秒")

# 陷阱3: 忽略预热
def test_with_warmup():
    """带预热的测试"""
    func = lambda: sum(range(10000))

    # 预热（让 JIT 编译器优化）
    for _ in range(10):
        func()

    # 正式测量
    times = []
    for _ in range(100):
        start = time.perf_counter()
        func()
        times.append(time.perf_counter() - start)

    print(f"平均时间: {sum(times)/len(times):.6f} 秒")
    print(f"最小时间: {min(times):.6f} 秒")
```

### 分析器开销影响结果

```python
"""
注意分析器本身的开销
"""

import cProfile
import timeit

def fast_function():
    """快速函数"""
    return sum(range(100))

# 问题：对于非常快的函数，cProfile 开销可能比函数本身还大
# 这会导致分析结果失真

# 不使用分析器
time_without_profiler = timeit.timeit(fast_function, number=100000)
print(f"不使用分析器: {time_without_profiler:.4f} 秒")

# 使用分析器
profiler = cProfile.Profile()
profiler.enable()
for _ in range(100000):
    fast_function()
profiler.disable()

# 解决方案：
# 对于快速函数，使用 timeit 而不是 cProfile
# 增加函数的工作量来减少相对开销
# 使用采样分析器（如 py-spy）减少开销
```

### 忽略 I/O 等待时间

```python
"""
区分 CPU 时间和 I/O 等待时间
"""

import cProfile
import time

def io_bound_function():
    """I/O 密集型函数"""
    time.sleep(0.1)  # 模拟 I/O 等待
    return "done"

def cpu_bound_function():
    """CPU 密集型函数"""
    return sum(i ** 2 for i in range(100000))

def mixed_function():
    """混合函数"""
    cpu_bound_function()
    io_bound_function()

# cProfile 会显示 wall time（包括等待时间）
# 但 tottime 不包括子函数调用时间
# 需要结合 cumtime 和 tottime 分析

# 对于 I/O 密集型应用，考虑使用：
# - py-spy --native 可以看到系统调用
# - strace 跟踪系统调用
# - asyncio 的调试工具

cProfile.run('mixed_function()')
```

### 采样偏差

```python
"""
避免采样偏差
"""

import random
import timeit

# 陷阱：使用相同的输入数据
def test_sort_biased():
    """有偏差的测试"""
    data = list(range(1000))  # 已排序的数据
    return timeit.timeit(
        'sorted(data)',
        globals={'data': data},
        number=1000
    )

# 正确做法：使用随机数据
def test_sort_unbiased():
    """无偏差的测试"""
    times = []
    for _ in range(100):
        data = [random.random() for _ in range(1000)]
        time_result = timeit.timeit(
            'sorted(data)',
            globals={'data': data},
            number=10
        )
        times.append(time_result)

    return sum(times) / len(times)

print(f"已排序数据: {test_sort_biased():.4f} 秒")
print(f"随机数据: {test_sort_unbiased():.4f} 秒")
```

### 忽略缓存效应

```python
"""
注意缓存对性能的影响
"""

import timeit
from functools import lru_cache

# 陷阱：不清除缓存导致测试不公平
@lru_cache(maxsize=None)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 错误：缓存会影响后续测试
time1 = timeit.timeit('fibonacci(30)', globals=globals(), number=1)
time2 = timeit.timeit('fibonacci(30)', globals=globals(), number=1)  # 会更快

print(f"第一次: {time1:.6f} 秒")
print(f"第二次: {time2:.6f} 秒")  # 几乎为0，因为有缓存

# 正确做法：每次测试前清除缓存
def test_fibonacci_correctly():
    times = []
    for _ in range(5):
        fibonacci.cache_clear()  # 清除缓存
        time_result = timeit.timeit('fibonacci(30)', globals=globals(), number=1)
        times.append(time_result)

    return sum(times) / len(times)

print(f"正确测试: {test_fibonacci_correctly():.6f} 秒")
```

## 性能考量

### 分析器开销比较

```python
"""
比较不同分析器的开销
"""

import time
import cProfile
import profile

def test_function():
    """测试函数"""
    total = 0
    for i in range(100000):
        total += i ** 2
    return total

# 基准：无分析器
start = time.perf_counter()
for _ in range(10):
    test_function()
base_time = time.perf_counter() - start
print(f"无分析器: {base_time:.4f} 秒")

# cProfile（C 实现）
profiler = cProfile.Profile()
start = time.perf_counter()
for _ in range(10):
    profiler.runcall(test_function)
cprofile_time = time.perf_counter() - start
print(f"cProfile: {cprofile_time:.4f} 秒 (开销: {(cprofile_time/base_time - 1)*100:.1f}%)")

# profile（纯 Python 实现）
profiler = profile.Profile()
start = time.perf_counter()
for _ in range(10):
    profiler.runcall(test_function)
profile_time = time.perf_counter() - start
print(f"profile:  {profile_time:.4f} 秒 (开销: {(profile_time/base_time - 1)*100:.1f}%)")
```

### 选择合适的粒度

```python
"""
根据需求选择分析粒度
"""

# 粗粒度分析：快速定位问题
# 使用 cProfile，关注 cumtime 最高的函数

# 细粒度分析：深入分析特定函数
# 使用 line_profiler 进行逐行分析

# 生产环境分析：最小化开销
# 使用 py-spy 进行采样分析

# 示例：分层分析策略
def analyze_hierarchically(target_function):
    """分层性能分析"""
    import cProfile

    # 第一层：使用 cProfile 找出热点函数
    print("=" * 50)
    print("第一层：粗粒度分析")
    print("=" * 50)
    cProfile.runctx(
        'target_function()',
        globals(),
        {'target_function': target_function}
    )

    # 第二层：对热点函数使用 line_profiler
    # （需要手动添加 @profile 装饰器）
    print("\n提示：对热点函数添加 @profile 装饰器，然后运行 kernprof -l -v script.py")
```

## 实战场景

### 场景1：Web 应用性能分析

```python
"""
Web 应用性能分析示例
"""

import cProfile
import pstats
from io import StringIO
from functools import wraps
import time

# 模拟 Flask 应用的性能分析

def profile_request(func):
    """请求级别的性能分析装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # 只在开发模式下启用
        if not getattr(wrapper, 'profiling_enabled', False):
            return func(*args, **kwargs)

        profiler = cProfile.Profile()
        profiler.enable()

        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()

            # 记录慢请求
            stream = StringIO()
            stats = pstats.Stats(profiler, stream=stream)
            stats.strip_dirs()
            stats.sort_stats('cumulative')
            stats.print_stats(10)

            # 可以将结果发送到日志系统
            print(f"\n请求 {func.__name__} 性能分析:")
            print(stream.getvalue())

        return result

    wrapper.profiling_enabled = True
    return wrapper

# 模拟数据库查询
def query_database(query):
    time.sleep(0.05)  # 模拟数据库延迟
    return [{"id": i, "data": f"record_{i}"} for i in range(10)]

# 模拟数据处理
def process_results(results):
    processed = []
    for r in results:
        # 模拟 CPU 密集型处理
        processed.append({
            **r,
            "processed": sum(range(10000))
        })
    return processed

# 模拟视图函数
@profile_request
def api_endpoint():
    """API 端点"""
    # 数据库查询
    results = query_database("SELECT * FROM table")

    # 数据处理
    processed = process_results(results)

    # 返回响应
    return {"status": "success", "data": processed}

# 测试
api_endpoint()
```

### 场景2：数据处理管道优化

```python
"""
数据处理管道性能优化
"""

import time
import timeit

# 原始实现
def process_data_v1(data):
    """原始版本：逐步处理"""
    # 步骤1：过滤
    filtered = []
    for item in data:
        if item > 0:
            filtered.append(item)

    # 步骤2：转换
    transformed = []
    for item in filtered:
        transformed.append(item ** 2)

    # 步骤3：聚合
    total = 0
    for item in transformed:
        total += item

    return total

# 优化版本1：使用列表推导式
def process_data_v2(data):
    """优化版本1：列表推导式"""
    filtered = [x for x in data if x > 0]
    transformed = [x ** 2 for x in filtered]
    return sum(transformed)

# 优化版本2：使用生成器
def process_data_v3(data):
    """优化版本2：生成器表达式"""
    return sum(x ** 2 for x in data if x > 0)

# 优化版本3：使用 map/filter
def process_data_v4(data):
    """优化版本3：map/filter"""
    filtered = filter(lambda x: x > 0, data)
    transformed = map(lambda x: x ** 2, filtered)
    return sum(transformed)

# 性能比较
test_data = list(range(-5000, 5000))

print("数据处理管道性能比较:")
print("=" * 50)

for name, func in [
    ("原始版本", process_data_v1),
    ("列表推导式", process_data_v2),
    ("生成器表达式", process_data_v3),
    ("map/filter", process_data_v4),
]:
    time_result = timeit.timeit(
        lambda: func(test_data),
        number=1000
    )
    print(f"{name}: {time_result:.4f} 秒")
```

### 场景3：算法优化

```python
"""
算法优化案例：查找重复元素
"""

import timeit
import random
from collections import Counter

# 方法1：暴力搜索 O(n^2)
def find_duplicates_v1(arr):
    """暴力方法"""
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates

# 方法2：使用集合 O(n)
def find_duplicates_v2(arr):
    """使用集合"""
    seen = set()
    duplicates = set()
    for item in arr:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)

# 方法3：使用 Counter O(n)
def find_duplicates_v3(arr):
    """使用 Counter"""
    counter = Counter(arr)
    return [item for item, count in counter.items() if count > 1]

# 方法4：排序后检查 O(n log n)
def find_duplicates_v4(arr):
    """排序后检查"""
    if not arr:
        return []
    sorted_arr = sorted(arr)
    duplicates = []
    prev = sorted_arr[0]
    for i in range(1, len(sorted_arr)):
        if sorted_arr[i] == prev and prev not in duplicates:
            duplicates.append(prev)
        prev = sorted_arr[i]
    return duplicates

# 性能比较
print("\n查找重复元素算法比较:")
print("=" * 60)

for size in [100, 500, 1000]:
    test_data = [random.randint(0, size // 2) for _ in range(size)]
    print(f"\n数据大小: {size}")

    for name, func in [
        ("暴力搜索", find_duplicates_v1),
        ("集合方法", find_duplicates_v2),
        ("Counter", find_duplicates_v3),
        ("排序方法", find_duplicates_v4),
    ]:
        # 对于大数据集跳过暴力方法
        if size > 500 and name == "暴力搜索":
            print(f"  {name}: 跳过（太慢）")
            continue

        time_result = timeit.timeit(
            lambda f=func, d=test_data: f(d),
            number=100
        )
        print(f"  {name}: {time_result:.4f} 秒")
```

## 面试要点

### cProfile 和 timeit 的区别是什么？

```python
"""
cProfile vs timeit 比较
"""

# timeit:
# - 用于测量小代码片段的执行时间
# - 自动多次运行取平均值
# - 适合比较不同实现的性能
# - 开销非常小

import timeit
time_result = timeit.timeit('"-".join(str(i) for i in range(100))', number=10000)
print(f"timeit: {time_result:.4f} 秒")

# cProfile:
# - 用于分析整个程序或函数的性能
# - 提供函数调用次数、时间分布等详细信息
# - 适合找出程序瓶颈
# - 有一定开销

import cProfile
cProfile.run('"-".join(str(i) for i in range(100))')

# 总结：
# - 需要简单计时：用 timeit
# - 需要找瓶颈：用 cProfile
```

### 如何分析生产环境中的性能问题？

```python
"""
生产环境性能分析策略
"""

# 使用低开销的采样分析器
# py-spy 可以附加到正在运行的进程
# py-spy record -o profile.svg --pid <PID>

# 添加性能监控点
import time
import logging

logger = logging.getLogger(__name__)

def monitor_performance(threshold_ms=100):
    """性能监控装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = func(*args, **kwargs)
            duration_ms = (time.perf_counter() - start) * 1000

            if duration_ms > threshold_ms:
                logger.warning(
                    f"慢调用: {func.__name__} 耗时 {duration_ms:.2f}ms"
                )

            return result
        return wrapper
    return decorator

# 使用 APM 工具（如 New Relic, Datadog）
# 分析日志中的慢查询
# 使用分布式追踪（如 Jaeger, Zipkin）
```

### tottime 和 cumtime 的区别？

```python
"""
tottime vs cumtime 解释
"""

# tottime (total time):
# - 函数本身执行的时间
# - 不包括子函数调用的时间

# cumtime (cumulative time):
# - 函数的累计执行时间
# - 包括所有子函数调用的时间

# 示例
def inner():
    return sum(range(10000))

def outer():
    result = 0
    for _ in range(10):
        result += inner()
    return result

import cProfile
cProfile.run('outer()')

# 分析结果：
# - outer 的 tottime 很小（只有循环开销）
# - outer 的 cumtime 很大（包含 inner 的时间）
# - inner 的 tottime 和 cumtime 接近（没有子函数）
```

### 如何优化 Python 程序性能？

```python
"""
Python 性能优化策略
"""

import math
import numpy as np

# 算法优化（最重要）
# - 选择正确的数据结构
# - 降低时间复杂度

# 使用内置函数和库
# 内置函数通常用 C 实现，比 Python 循环快
# 差：
total = 0
for x in range(1000):
    total += x
# 好：
total = sum(range(1000))

# 避免全局变量查找
# 差：
def slow():
    return [math.sin(x) for x in range(1000)]
# 好：
def fast():
    sin = math.sin  # 本地变量查找更快
    return [sin(x) for x in range(1000)]

# 使用生成器减少内存
# 差：
def get_squares_list(n):
    return [x**2 for x in range(n)]
# 好：
def get_squares_gen(n):
    return (x**2 for x in range(n))

# 使用 __slots__ 减少内存
class Point:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

# 使用 NumPy 进行数值计算
# 差：
result = sum([x**2 for x in range(1000000)])
# 好：
arr = np.arange(1000000)
result = np.sum(arr**2)

# 使用缓存
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(n):
    return sum(i**2 for i in range(n))

# 使用多进程处理 CPU 密集型任务
from concurrent.futures import ProcessPoolExecutor

def cpu_bound_task(n):
    return sum(i**2 for i in range(n))

with ProcessPoolExecutor() as executor:
    results = list(executor.map(cpu_bound_task, [1000000] * 4))
```

### 什么是采样分析器？与确定性分析器有什么区别？

```python
"""
采样分析器 vs 确定性分析器
"""

# 确定性分析器（Deterministic Profiler）
# - 例如：cProfile, profile
# - 监控每一个函数调用
# - 精确但开销大
# - 可能影响程序行为（特别是对于快速函数）

# 采样分析器（Statistical Profiler）
# - 例如：py-spy, pyinstrument
# - 周期性采样程序状态
# - 开销小，适合生产环境
# - 精度取决于采样频率
# - 对于短时运行的函数可能不够准确

# 选择建议：
# - 开发调试：使用 cProfile
# - 生产环境：使用 py-spy
# - 逐行分析：使用 line_profiler
# - 内存分析：使用 memory_profiler
```

## 延伸阅读

### 官方文档

- [Python timeit 文档](https://docs.python.org/3/library/timeit.html)
- [Python cProfile 文档](https://docs.python.org/3/library/profile.html)
- [Python pstats 文档](https://docs.python.org/3/library/profile.html#the-stats-class)

### 第三方工具文档

- [line_profiler GitHub](https://github.com/pyutils/line_profiler)
- [memory_profiler GitHub](https://github.com/pythonprofilers/memory_profiler)
- [py-spy GitHub](https://github.com/benfred/py-spy)
- [snakeviz GitHub](https://github.com/jiffyclub/snakeviz)
- [pyinstrument GitHub](https://github.com/joerick/pyinstrument)
- [Scalene GitHub](https://github.com/plasma-umass/scalene)

### 推荐书籍

- 《High Performance Python》- Micha Gorelick, Ian Ozsvald
- 《Python 性能分析与优化》

### 相关工具

- **Scalene**：同时分析 CPU、GPU 和内存的高性能分析器
- **pyinstrument**：基于调用栈的采样分析器，输出更易读
- **yappi**：支持多线程的分析器
- **Fil**：专注于内存分析的工具
- **Austin**：低开销的 Python 帧栈采样器

### 进阶主题

- Python GIL 对多线程性能的影响
- NumPy/Pandas 性能优化
- Cython 和 Numba 的使用
- 异步 I/O 性能分析
- 分布式系统性能追踪
