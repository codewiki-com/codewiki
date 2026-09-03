---
title: CSV文件处理
description: Python csv模块完全指南，涵盖读写操作、DictReader/DictWriter、方言配置与高级技巧
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - CSV
  - 数据处理
  - 文件操作
  - 数据导入导出
status: imported
origin: old/src/content/docs/python/csv.zh.md
divergence: 0.213
issues: []
legacy:
  category: Python
  subcategory: 标准库
  order: 28
  lastUpdated: 2026-01-07
---

CSV（Comma-Separated Values，逗号分隔值）是一种简单而广泛使用的数据交换格式。Python 内置的 `csv` 模块提供了强大而灵活的 CSV 文件处理能力。本文将全面介绍 CSV 的读写操作、字典接口、方言配置、引用策略以及各种高级技巧。

## 概念解释

### 什么是 CSV

CSV 是一种纯文本格式，用于存储表格数据。其特点包括：

- 每行代表一条记录
- 字段之间用分隔符（通常是逗号）分隔
- 可选的表头行定义字段名称
- 支持引号包裹含有特殊字符的字段
- 跨平台兼容，几乎所有电子表格软件都支持

### CSV 格式示例

```csv
姓名,年龄,城市,薪资
张三,28,北京,15000
李四,32,上海,20000
"王五,Jr",25,"深圳,广东",18000
```

### 为什么使用 csv 模块

虽然 CSV 格式看起来简单，但手动解析存在诸多陷阱：

- 字段中可能包含逗号、换行符等特殊字符
- 需要处理引号转义
- 不同系统的换行符不同
- 编码问题

`csv` 模块自动处理这些复杂情况，提供可靠的读写功能。

## 核心原理

### csv 模块架构

```
csv 模块
├── reader       # 基础读取器，返回列表
├── writer       # 基础写入器，写入列表
├── DictReader   # 字典读取器，返回字典
├── DictWriter   # 字典写入器，写入字典
├── Dialect      # 方言基类，定义格式参数
├── excel        # Excel 方言（默认）
├── excel_tab    # Tab 分隔方言
└── unix_dialect # Unix 风格方言
```

### 读写流程

```
读取流程:
文件 → open() → csv.reader/DictReader → 迭代获取行 → 处理数据

写入流程:
数据 → csv.writer/DictWriter → writerow/writerows → 文件
```

## 核心要点

### 基础读写要点

| 功能 | 方法 | 返回/输入类型 |
|------|------|--------------|
| 读取一行 | `next(reader)` | `list` |
| 读取所有行 | `list(reader)` | `list[list]` |
| 写入一行 | `writer.writerow(row)` | `list` |
| 写入多行 | `writer.writerows(rows)` | `list[list]` |

### 字典接口要点

| 功能 | 方法 | 返回/输入类型 |
|------|------|--------------|
| 字典读取 | `DictReader` | `dict` |
| 字典写入 | `DictWriter` | `dict` |
| 获取字段名 | `reader.fieldnames` | `list` |
| 写入表头 | `writer.writeheader()` | - |

### 关键参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `delimiter` | 字段分隔符 | `,` |
| `quotechar` | 引号字符 | `"` |
| `quoting` | 引用策略 | `QUOTE_MINIMAL` |
| `lineterminator` | 行终止符 | `\r\n` |
| `escapechar` | 转义字符 | `None` |

## 代码示例

### 基本读取操作

```python
import csv

# 读取 CSV 文件
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)

    # 获取表头
    header = next(reader)
    print(f"列名: {header}")

    # 遍历数据行
    for row in reader:
        print(row)
```

### 基本写入操作

```python
import csv

# 准备数据
header = ["姓名", "年龄", "城市"]
data = [
    ["张三", 28, "北京"],
    ["李四", 32, "上海"],
    ["王五", 25, "深圳"]
]

# 写入 CSV 文件
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)  # 写入表头
    writer.writerows(data)   # 写入所有数据行
```

**注意**：在 Windows 上打开文件时使用 `newline=""` 参数，避免产生多余的空行。

### 使用 DictReader 读取

`DictReader` 将每行数据作为字典返回，键为表头字段名：

```python
import csv

# 示例 CSV 内容:
# 姓名,年龄,城市,薪资
# 张三,28,北京,15000
# 李四,32,上海,20000

with open("employees.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    # 获取字段名
    print(f"字段: {reader.fieldnames}")

    # 遍历数据
    for row in reader:
        print(f"{row['姓名']} 在 {row['城市']} 工作，月薪 {row['薪资']} 元")
```

输出：
```
字段: ['姓名', '年龄', '城市', '薪资']
张三 在 北京 工作，月薪 15000 元
李四 在 上海 工作，月薪 20000 元
```

### 使用 DictWriter 写入

```python
import csv

# 准备字典数据
employees = [
    {"姓名": "张三", "年龄": 28, "城市": "北京", "薪资": 15000},
    {"姓名": "李四", "年龄": 32, "城市": "上海", "薪资": 20000},
    {"姓名": "王五", "年龄": 25, "城市": "深圳", "薪资": 18000}
]

# 定义字段顺序
fieldnames = ["姓名", "年龄", "城市", "薪资"]

with open("employees.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    writer.writeheader()  # 写入表头
    writer.writerows(employees)  # 写入所有数据
```

### 自定义分隔符

处理 TSV（Tab 分隔）或其他分隔符格式：

```python
import csv

# 读取 TSV 文件
with open("data.tsv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter="\t")
    for row in reader:
        print(row)

# 写入分号分隔的文件
with open("data_semicolon.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, delimiter=";")
    writer.writerow(["姓名", "年龄", "城市"])
    writer.writerow(["张三", 28, "北京"])
```

### 使用方言（Dialect）

方言是一组预定义的格式参数：

```python
import csv

# 查看可用方言
print(csv.list_dialects())  # ['excel', 'excel-tab', 'unix']

# 使用 Excel Tab 方言
with open("data.tsv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, dialect="excel-tab")
    for row in reader:
        print(row)

# 使用 Unix 方言（LF 换行符，最小引用）
with open("data_unix.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, dialect="unix")
    writer.writerow(["姓名", "年龄", "城市"])
```

### 自定义方言

```python
import csv

# 注册自定义方言
csv.register_dialect(
    "custom",
    delimiter="|",
    quotechar="'",
    quoting=csv.QUOTE_MINIMAL,
    lineterminator="\n"
)

# 使用自定义方言
with open("data_custom.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, dialect="custom")
    writer.writerow(["姓名", "年龄", "城市"])
    writer.writerow(["张三", 28, "北京"])

# 读取时也使用相同方言
with open("data_custom.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f, dialect="custom")
    for row in reader:
        print(row)

# 用完后注销方言
csv.unregister_dialect("custom")
```

### 引用选项（Quoting）

```python
import csv

data = [
    ["姓名", "描述", "金额"],
    ["张三", "这是一段,包含逗号的描述", 1000],
    ["李四", '他说:"你好"', 2000]
]

# QUOTE_MINIMAL: 仅在必要时引用（默认）
with open("quote_minimal.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerows(data)
# 输出: 姓名,描述,金额
#       张三,"这是一段,包含逗号的描述",1000
#       李四,"他说:""你好""",2000

# QUOTE_ALL: 所有字段都引用
with open("quote_all.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerows(data)
# 输出: "姓名","描述","金额"
#       "张三","这是一段,包含逗号的描述","1000"

# QUOTE_NONNUMERIC: 非数字字段引用
with open("quote_nonnumeric.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_NONNUMERIC)
    writer.writerows(data)
# 输出: "姓名","描述","金额"
#       "张三","这是一段,包含逗号的描述",1000

# QUOTE_NONE: 从不引用（需要设置 escapechar）
with open("quote_none.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_NONE, escapechar="\\")
    writer.writerow(["姓名", "城市"])
    writer.writerow(["张三", "北京"])
```

### 处理带 BOM 的文件

某些程序（如 Excel）创建的 UTF-8 文件带有 BOM（字节顺序标记）：

```python
import csv

# 读取带 BOM 的文件
with open("data_with_bom.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)

# 写入带 BOM 的文件（Excel 兼容）
with open("excel_compatible.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["姓名", "年龄", "城市"])
    writer.writerow(["张三", 28, "北京"])
```

### 从字符串读取 CSV

```python
import csv
from io import StringIO

csv_string = """姓名,年龄,城市
张三,28,北京
李四,32,上海"""

# 使用 StringIO 包装字符串
reader = csv.reader(StringIO(csv_string))
for row in reader:
    print(row)
```

### 跳过特定行

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)

    # 跳过前两行（如注释行）
    next(reader)
    next(reader)

    # 第三行作为表头
    header = next(reader)

    for row in reader:
        print(row)
```

### 处理缺失字段

```python
import csv

# DictReader 处理缺失字段
with open("incomplete.csv", "r", encoding="utf-8") as f:
    # restkey: 多余字段的键名
    # restval: 缺失字段的默认值
    reader = csv.DictReader(f, restkey="extra", restval="N/A")
    for row in reader:
        print(row)

# DictWriter 处理缺失字段
fieldnames = ["姓名", "年龄", "城市", "邮箱"]
data = [
    {"姓名": "张三", "年龄": 28},  # 缺少城市和邮箱
    {"姓名": "李四", "年龄": 32, "城市": "上海"}  # 缺少邮箱
]

with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, restval="未知")
    writer.writeheader()
    writer.writerows(data)
```

### 只写入部分字段

```python
import csv

data = [
    {"姓名": "张三", "年龄": 28, "城市": "北京", "内部ID": 1001},
    {"姓名": "李四", "年龄": 32, "城市": "上海", "内部ID": 1002}
]

# 只导出部分字段
export_fields = ["姓名", "城市"]

with open("partial.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=export_fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(data)
```

### 数据类型转换

```python
import csv
from datetime import datetime
from decimal import Decimal

def convert_row(row: dict) -> dict:
    """转换行数据类型"""
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "salary": Decimal(row["salary"]),
        "join_date": datetime.strptime(row["join_date"], "%Y-%m-%d"),
        "is_active": row["is_active"].lower() == "true"
    }

with open("employees.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    employees = [convert_row(row) for row in reader]

    for emp in employees:
        print(f"{emp['name']}: {emp['salary']}, 入职: {emp['join_date'].date()}")
```

## 最佳实践

### 始终使用上下文管理器

```python
import csv

# 推荐
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    data = list(reader)

# 不推荐
f = open("data.csv", "r")
reader = csv.reader(f)
data = list(reader)
f.close()  # 容易忘记关闭
```

### 明确指定编码

```python
import csv

# 总是指定编码，避免平台差异
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    ...

# 处理其他编码
with open("gbk_data.csv", "r", encoding="gbk") as f:
    reader = csv.reader(f)
    ...
```

### Windows 上使用 newline=""

```python
import csv

# Windows 上写入时必须使用 newline=""
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b", "c"])
```

### 使用 DictReader/DictWriter 提高可读性

```python
import csv

# 使用字段名访问，代码更清晰
with open("employees.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        # 清晰的字段访问
        print(f"{row['姓名']}: {row['薪资']}")

        # 而不是
        # print(f"{row[0]}: {row[3]}")
```

### 大文件流式处理

```python
import csv

def process_large_csv(filepath: str):
    """流式处理大型 CSV 文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # 逐行处理，不加载全部到内存
            process_row(row)

def process_row(row: dict):
    # 处理单行数据
    pass
```

### 封装常用操作

```python
import csv
from pathlib import Path
from typing import Iterator

def read_csv(
    filepath: str | Path,
    encoding: str = "utf-8",
    as_dict: bool = True
) -> Iterator[dict | list]:
    """通用 CSV 读取函数"""
    with open(filepath, "r", encoding=encoding) as f:
        if as_dict:
            reader = csv.DictReader(f)
        else:
            reader = csv.reader(f)
        yield from reader

def write_csv(
    filepath: str | Path,
    data: list[dict] | list[list],
    fieldnames: list[str] | None = None,
    encoding: str = "utf-8"
) -> None:
    """通用 CSV 写入函数"""
    with open(filepath, "w", encoding=encoding, newline="") as f:
        if data and isinstance(data[0], dict):
            fieldnames = fieldnames or list(data[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        else:
            writer = csv.writer(f)
            if fieldnames:
                writer.writerow(fieldnames)
            writer.writerows(data)

# 使用示例
employees = list(read_csv("employees.csv"))
write_csv("output.csv", employees)
```

## 常见陷阱

### 忘记使用 newline=""

```python
import csv

# 错误：Windows 上会产生多余空行
with open("output.csv", "w", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b"])
    writer.writerow(["c", "d"])

# 正确
with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b"])
    writer.writerow(["c", "d"])
```

### reader 只能迭代一次

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)

    # 第一次迭代
    for row in reader:
        print(row)

    # 第二次迭代：什么都不会输出！
    for row in reader:
        print(row)  # 不会执行

# 解决方案：转为列表
with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    data = list(reader)  # 转为列表

    # 可以多次迭代
    for row in data:
        print(row)
```

### 混淆 reader 和 DictReader

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)  # 返回列表

    for row in reader:
        # 错误：reader 返回列表，不是字典
        # print(row["name"])  # TypeError
        print(row[0])  # 正确

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)  # 返回字典

    for row in reader:
        print(row["name"])  # 正确
```

### 修改 DictReader 的行数据

```python
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        # 注意：直接修改 row 不会影响源文件
        row["new_field"] = "value"  # 这只修改内存中的字典
```

### 字段顺序问题

```python
import csv

# DictWriter 必须指定 fieldnames
data = [{"b": 2, "a": 1, "c": 3}]

# 不指定 fieldnames 时字典键顺序可能不确定（Python 3.7+ 有序）
# 但最好明确指定以确保一致性
fieldnames = ["a", "b", "c"]

with open("output.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)
```

### 处理包含换行符的字段

```python
import csv

# CSV 模块会自动处理字段内的换行符
data = [
    ["标题", "内容"],
    ["文章1", "这是第一行\n这是第二行\n这是第三行"]
]

with open("multiline.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(data)

# 读取时也能正确处理
with open("multiline.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)
```

### 数字精度丢失

```python
import csv
from decimal import Decimal

# 问题：浮点数精度
data = [["金额"], [0.1 + 0.2]]  # 实际是 0.30000000000000004

# 解决：使用 Decimal 或字符串
data = [["金额"], [str(Decimal("0.1") + Decimal("0.2"))]]
```

## 性能考量

### 基准测试对比

```python
import csv
import time
from io import StringIO

def benchmark_csv_operations():
    """CSV 操作性能基准测试"""

    # 准备测试数据
    rows = 100000
    data = [["id", "name", "value"]]
    data.extend([[i, f"item_{i}", i * 1.5] for i in range(rows)])

    # 测试写入性能
    start = time.perf_counter()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerows(data)
    write_time = time.perf_counter() - start
    print(f"写入 {rows} 行: {write_time:.3f} 秒")

    # 测试读取性能
    csv_content = output.getvalue()
    start = time.perf_counter()
    reader = csv.reader(StringIO(csv_content))
    _ = list(reader)
    read_time = time.perf_counter() - start
    print(f"读取 {rows} 行: {read_time:.3f} 秒")

    # 测试 DictReader 性能
    start = time.perf_counter()
    reader = csv.DictReader(StringIO(csv_content))
    _ = list(reader)
    dict_read_time = time.perf_counter() - start
    print(f"DictReader 读取: {dict_read_time:.3f} 秒")

benchmark_csv_operations()
```

### 大文件处理策略

```python
import csv
from typing import Iterator, Generator

def read_csv_chunks(
    filepath: str,
    chunk_size: int = 10000
) -> Generator[list[dict], None, None]:
    """分块读取大型 CSV 文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        chunk = []

        for row in reader:
            chunk.append(row)
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []

        if chunk:  # 处理最后一批
            yield chunk

# 使用示例
for chunk in read_csv_chunks("large_file.csv", chunk_size=5000):
    process_chunk(chunk)
```

### 使用生成器节省内存

```python
import csv
from typing import Iterator

def filter_csv(
    filepath: str,
    condition: callable
) -> Iterator[dict]:
    """使用生成器过滤 CSV 数据"""
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if condition(row):
                yield row

# 使用示例：过滤薪资大于 10000 的员工
high_salary = filter_csv(
    "employees.csv",
    lambda row: int(row["薪资"]) > 10000
)

for emp in high_salary:
    print(emp["姓名"])
```

### 并行处理大文件

```python
import csv
from concurrent.futures import ProcessPoolExecutor
from typing import Callable
import os

def process_chunk(args: tuple) -> list:
    """处理数据块"""
    filepath, start_line, num_lines, processor = args
    results = []

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # 跳到起始行
        for _ in range(start_line):
            next(reader, None)

        # 处理指定数量的行
        for i, row in enumerate(reader):
            if i >= num_lines:
                break
            results.append(processor(row))

    return results

def parallel_csv_process(
    filepath: str,
    processor: Callable,
    num_workers: int = None,
    chunk_size: int = 10000
) -> list:
    """并行处理 CSV 文件"""
    # 统计行数
    with open(filepath, "r", encoding="utf-8") as f:
        total_lines = sum(1 for _ in f) - 1  # 减去表头

    num_workers = num_workers or os.cpu_count()

    # 创建任务
    tasks = []
    for start in range(0, total_lines, chunk_size):
        num_lines = min(chunk_size, total_lines - start)
        tasks.append((filepath, start, num_lines, processor))

    # 并行执行
    results = []
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        for chunk_results in executor.map(process_chunk, tasks):
            results.extend(chunk_results)

    return results
```

### 对比 Pandas 性能

对于大数据处理，Pandas 通常更高效：

```python
import csv
import time
import pandas as pd

# 准备测试文件
# ... 假设有一个大型 CSV 文件

# csv 模块读取
start = time.perf_counter()
with open("large.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    data = list(reader)
csv_time = time.perf_counter() - start

# Pandas 读取
start = time.perf_counter()
df = pd.read_csv("large.csv")
pandas_time = time.perf_counter() - start

print(f"csv 模块: {csv_time:.3f} 秒")
print(f"Pandas: {pandas_time:.3f} 秒")
```

## 实战场景

### 场景一：数据导出报表

```python
import csv
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List

@dataclass
class SalesRecord:
    order_id: str
    product: str
    quantity: int
    unit_price: float
    total: float
    sale_date: str

def export_sales_report(
    records: List[SalesRecord],
    filepath: str
) -> None:
    """导出销售报表为 CSV"""

    fieldnames = [
        "订单号", "产品", "数量", "单价", "总价", "销售日期"
    ]

    field_mapping = {
        "order_id": "订单号",
        "product": "产品",
        "quantity": "数量",
        "unit_price": "单价",
        "total": "总价",
        "sale_date": "销售日期"
    }

    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for record in records:
            row = {
                field_mapping[k]: v
                for k, v in asdict(record).items()
            }
            writer.writerow(row)

    print(f"已导出 {len(records)} 条记录到 {filepath}")

# 使用示例
records = [
    SalesRecord("ORD001", "笔记本电脑", 2, 5999.00, 11998.00, "2026-01-07"),
    SalesRecord("ORD002", "无线鼠标", 5, 99.00, 495.00, "2026-01-07"),
]

export_sales_report(records, "sales_report.csv")
```

### 场景二：配置数据导入

```python
import csv
from typing import Dict, Any, List
from pathlib import Path

class ConfigImporter:
    """配置数据导入器"""

    def __init__(self, config_dir: str):
        self.config_dir = Path(config_dir)

    def import_products(self) -> List[Dict[str, Any]]:
        """导入产品配置"""
        filepath = self.config_dir / "products.csv"
        products = []

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                product = {
                    "id": int(row["id"]),
                    "name": row["name"],
                    "category": row["category"],
                    "price": float(row["price"]),
                    "stock": int(row["stock"]),
                    "is_active": row["is_active"].lower() == "true"
                }
                products.append(product)

        return products

    def import_users(self) -> List[Dict[str, Any]]:
        """导入用户配置"""
        filepath = self.config_dir / "users.csv"
        users = []

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                user = {
                    "id": int(row["id"]),
                    "username": row["username"],
                    "email": row["email"],
                    "roles": row["roles"].split("|") if row["roles"] else []
                }
                users.append(user)

        return users

# 使用示例
importer = ConfigImporter("./config")
products = importer.import_products()
users = importer.import_users()
```

### 场景三：日志分析

```python
import csv
from collections import Counter, defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

def analyze_access_log(filepath: str) -> Dict[str, Any]:
    """分析访问日志 CSV"""

    stats = {
        "total_requests": 0,
        "status_codes": Counter(),
        "top_paths": Counter(),
        "hourly_traffic": defaultdict(int),
        "error_requests": []
    }

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            stats["total_requests"] += 1

            # 统计状态码
            status = int(row["status"])
            stats["status_codes"][status] += 1

            # 统计路径
            stats["top_paths"][row["path"]] += 1

            # 统计每小时流量
            timestamp = datetime.fromisoformat(row["timestamp"])
            hour = timestamp.strftime("%Y-%m-%d %H:00")
            stats["hourly_traffic"][hour] += 1

            # 收集错误请求
            if status >= 400:
                stats["error_requests"].append({
                    "timestamp": row["timestamp"],
                    "path": row["path"],
                    "status": status,
                    "message": row.get("message", "")
                })

    # 转换 Counter 为普通字典并排序
    stats["top_paths"] = dict(stats["top_paths"].most_common(10))
    stats["status_codes"] = dict(stats["status_codes"])
    stats["hourly_traffic"] = dict(stats["hourly_traffic"])

    return stats

def export_analysis_report(stats: Dict, output_path: str) -> None:
    """导出分析报告"""

    # 导出错误请求详情
    if stats["error_requests"]:
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            fieldnames = ["timestamp", "path", "status", "message"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(stats["error_requests"])

# 使用示例
stats = analyze_access_log("access.log.csv")
print(f"总请求数: {stats['total_requests']}")
print(f"状态码分布: {stats['status_codes']}")
print(f"热门路径: {stats['top_paths']}")
```

### 场景四：数据转换与清洗

```python
import csv
import re
from typing import Dict, List, Optional

class DataCleaner:
    """CSV 数据清洗器"""

    @staticmethod
    def clean_phone(phone: str) -> str:
        """清洗电话号码"""
        # 移除非数字字符
        return re.sub(r"\D", "", phone)

    @staticmethod
    def clean_email(email: str) -> str:
        """清洗并验证邮箱"""
        email = email.strip().lower()
        if re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
            return email
        return ""

    @staticmethod
    def clean_name(name: str) -> str:
        """清洗姓名"""
        # 移除多余空格，标准化大小写
        return " ".join(name.split()).title()

def clean_customer_data(
    input_file: str,
    output_file: str
) -> Dict[str, int]:
    """清洗客户数据"""

    cleaner = DataCleaner()
    stats = {
        "total": 0,
        "cleaned": 0,
        "invalid_emails": 0,
        "invalid_phones": 0
    }

    with open(input_file, "r", encoding="utf-8") as infile, \
         open(output_file, "w", encoding="utf-8", newline="") as outfile:

        reader = csv.DictReader(infile)
        fieldnames = ["id", "name", "email", "phone", "city"]
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            stats["total"] += 1

            # 清洗数据
            cleaned_row = {
                "id": row["id"],
                "name": cleaner.clean_name(row.get("name", "")),
                "email": cleaner.clean_email(row.get("email", "")),
                "phone": cleaner.clean_phone(row.get("phone", "")),
                "city": row.get("city", "").strip()
            }

            # 统计无效数据
            if not cleaned_row["email"]:
                stats["invalid_emails"] += 1
            if len(cleaned_row["phone"]) != 11:
                stats["invalid_phones"] += 1

            writer.writerow(cleaned_row)
            stats["cleaned"] += 1

    return stats

# 使用示例
stats = clean_customer_data("raw_customers.csv", "clean_customers.csv")
print(f"处理完成: {stats}")
```

### 场景五：CSV 与数据库交互

```python
import csv
import sqlite3
from typing import List, Dict, Any

class CSVDatabaseSync:
    """CSV 与数据库同步工具"""

    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

    def import_csv_to_table(
        self,
        csv_path: str,
        table_name: str,
        create_table: bool = True
    ) -> int:
        """将 CSV 导入数据库表"""

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames

            if create_table:
                # 创建表
                columns = ", ".join([f'"{col}" TEXT' for col in fieldnames])
                self.conn.execute(
                    f'CREATE TABLE IF NOT EXISTS "{table_name}" ({columns})'
                )

            # 插入数据
            placeholders = ", ".join(["?" for _ in fieldnames])
            columns = ", ".join([f'"{col}"' for col in fieldnames])
            sql = f'INSERT INTO "{table_name}" ({columns}) VALUES ({placeholders})'

            count = 0
            for row in reader:
                values = [row[col] for col in fieldnames]
                self.conn.execute(sql, values)
                count += 1

            self.conn.commit()
            return count

    def export_table_to_csv(
        self,
        table_name: str,
        csv_path: str,
        query: str = None
    ) -> int:
        """将数据库表导出为 CSV"""

        if query is None:
            query = f'SELECT * FROM "{table_name}"'

        cursor = self.conn.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return 0

        fieldnames = rows[0].keys()

        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for row in rows:
                writer.writerow(dict(row))

        return len(rows)

    def close(self):
        self.conn.close()

# 使用示例
db = CSVDatabaseSync("data.db")

# 导入 CSV 到数据库
count = db.import_csv_to_table("employees.csv", "employees")
print(f"导入 {count} 条记录")

# 导出数据库到 CSV
count = db.export_table_to_csv(
    "employees",
    "export.csv",
    query="SELECT * FROM employees WHERE salary > 10000"
)
print(f"导出 {count} 条记录")

db.close()
```

## 面试要点

### csv.reader 和 csv.DictReader 的区别是什么？

**答案**：
- `csv.reader` 返回列表，通过索引访问字段
- `csv.DictReader` 返回字典，通过字段名访问
- `DictReader` 更易读但略慢
- `DictReader` 自动使用第一行作为字段名

### 为什么在 Windows 上写入 CSV 时需要 newline=""？

**答案**：
- CSV 模块自己处理换行符
- 如果不设置 `newline=""`，Python 会额外添加 `\r`
- 导致每行之间出现空行
- 这是 Windows 特有的问题，Unix 系统不受影响

### 如何处理包含特殊字符（逗号、换行符、引号）的字段？

**答案**：
- csv 模块自动处理这些情况
- 包含分隔符的字段会被引号包裹
- 引号会被转义（双引号变成两个引号）
- 可以通过 `quoting` 参数控制引用策略

### CSV 的四种引用策略是什么？

**答案**：
```python
import csv

# QUOTE_MINIMAL: 仅在必要时引用（默认）
# QUOTE_ALL: 所有字段都引用
# QUOTE_NONNUMERIC: 非数字字段引用
# QUOTE_NONE: 从不引用（需要 escapechar）
```

### 如何处理大型 CSV 文件？

**答案**：
- 使用迭代器逐行处理，不要用 `list()` 加载全部
- 分块处理（chunk）
- 使用生成器
- 考虑使用 Pandas 的 `chunksize` 参数
- 并行处理

### DictWriter 的 extrasaction 参数有什么用？

**答案**：
```python
import csv

# extrasaction="raise": 数据中有额外字段时抛出异常（默认）
# extrasaction="ignore": 忽略额外字段

fieldnames = ["a", "b"]
data = {"a": 1, "b": 2, "c": 3}  # c 是额外字段

writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
# 只写入 a 和 b，忽略 c
```

### 如何让导出的 CSV 能被 Excel 正确识别中文？

**答案**：
```python
# 使用 UTF-8 with BOM 编码
with open("data.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["中文", "内容"])
```

### csv 模块和 Pandas 读取 CSV 有什么区别？

**答案**：

| 特性 | csv 模块 | Pandas |
|------|----------|--------|
| 依赖 | 标准库 | 需要安装 |
| 内存使用 | 可流式处理 | 通常加载全部 |
| 性能 | 大文件较慢 | 优化的 C 实现 |
| 功能 | 基础读写 | 丰富的数据处理 |
| 类型推断 | 无（全是字符串） | 自动推断 |
| 适用场景 | 简单读写 | 数据分析 |

## 延伸阅读

### 官方文档
- [Python csv 模块官方文档](https://docs.python.org/zh-cn/3/library/csv.html)
- [PEP 305 - CSV File API](https://peps.python.org/pep-0305/)

### 相关库
- [Pandas read_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html) - 功能更强大的 CSV 处理
- [csvkit](https://csvkit.readthedocs.io/) - CSV 命令行工具套件
- [agate](https://agate.readthedocs.io/) - 数据分析库

### RFC 标准
- [RFC 4180 - Common Format and MIME Type for CSV Files](https://www.rfc-editor.org/rfc/rfc4180)

### 推荐文章
- [Real Python - Reading and Writing CSV Files in Python](https://realpython.com/python-csv/)
- [Python CSV 模块性能优化指南](https://docs.python.org/3/library/csv.html#csv-fmt-params)
