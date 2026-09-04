---
title: Pandas 完全指南
description: 掌握 Python 中用于数据操作和分析的 Pandas 库
track: datascience
section: python-stack
difficulty: intermediate
tags:
  - Pandas
  - Python
  - 数据分析
  - DataFrame
status: imported
origin: old/src/content/docs/data/pandas-guide.zh.md
divergence: 0.207
issues: []
legacy:
  category: Data
  subcategory: Python
  order: 2
  lastUpdated: 2026-01-07
---

Pandas 是 Python 数据科学生态系统中最重要的库之一，提供高性能、易用的数据结构和数据分析工具。无论你是数据科学家、分析师还是后端开发者，掌握 Pandas 是处理结构化数据的基本技能。

## 核心概念

### 什么是 Pandas？

"Pandas" 这个名字源自 "Panel Data"（面板数据）和 "Python Data Analysis"（Python 数据分析）。Pandas 建立在 NumPy 之上，提供两种主要数据结构：**Series**（一维）和 **DataFrame**（二维），使数据操作直观高效。

### 为什么选择 Pandas？

1. **强大的数据操作**：支持数据清洗、转换、合并和重塑操作
2. **灵活的索引**：同时支持基于标签和基于位置的索引
3. **高效的 I/O 操作**：可以读写 CSV、Excel、SQL、JSON、Parquet 等多种格式
4. **时间序列支持**：内置强大的日期时间处理功能
5. **无缝集成**：与 NumPy、Matplotlib、Scikit-learn 等库完美配合

```python
import pandas as pd
import numpy as np

# 查看 Pandas 版本
print(pd.__version__)
```

---

## DataFrame 和 Series

### Series：一维标签数组

Series 是一维标签数组，可以容纳任何数据类型。

```python
# 创建 Series
s = pd.Series([1, 3, 5, 7, 9])
print(s)

# 带自定义索引的 Series
s = pd.Series([1, 3, 5, 7, 9], index=['a', 'b', 'c', 'd', 'e'])
print(s)

# 从字典创建 Series
data = {'纽约': 8336, '洛杉矶': 3979, '芝加哥': 2693, '休斯顿': 2320}
population = pd.Series(data, name='人口（千人）')
print(population)

# Series 基本属性
print(f"索引: {s.index}")
print(f"值: {s.values}")
print(f"数据类型: {s.dtype}")
print(f"形状: {s.shape}")
```

### DataFrame：二维表格结构

DataFrame 是最常用的 Pandas 数据结构，类似于电子表格或 SQL 表。

```python
# 从字典创建 DataFrame
data = {
    '姓名': ['Alice', 'Bob', 'Charlie', 'Diana'],
    '年龄': [25, 30, 35, 28],
    '城市': ['纽约', '洛杉矶', '芝加哥', '休斯顿'],
    '薪资': [75000, 85000, 90000, 82000]
}
df = pd.DataFrame(data)
print(df)

# 从列表的列表创建 DataFrame
data = [
    ['Alice', 25, '纽约'],
    ['Bob', 30, '洛杉矶'],
    ['Charlie', 35, '芝加哥']
]
df = pd.DataFrame(data, columns=['姓名', '年龄', '城市'])
print(df)

# DataFrame 基本属性和方法
print(f"形状: {df.shape}")
print(f"列: {df.columns.tolist()}")
print(f"索引: {df.index.tolist()}")
print(f"数据类型:\n{df.dtypes}")

# 数据概览方法
print(df.head())       # 前 5 行
print(df.tail(3))      # 后 3 行
print(df.info())       # 数据信息
print(df.describe())   # 统计摘要
```

### Series 和 DataFrame 的主要区别

| 特性 | Series | DataFrame |
|---------|--------|-----------|
| 维度 | 1D | 2D |
| 结构 | 带索引的单列 | 带索引的多列 |
| 创建方式 | 从列表、字典、标量 | 从字典、字典列表、2D 数组 |
| 访问方式 | 单索引/标签 | 行列索引 |

---

## 数据加载

Pandas 提供了广泛的 I/O 功能，用于读写各种格式的数据。

### 读取 CSV 文件

```python
# 基本 CSV 读取
df = pd.read_csv('data.csv')

# 带特定选项
df = pd.read_csv(
    'data.csv',
    sep=',',                    # 分隔符
    header=0,                   # 列名所在行号
    index_col='id',             # 用作索引的列
    usecols=['name', 'age'],    # 要读取的列
    dtype={'age': int},         # 数据类型
    na_values=['N/A', 'NULL'],  # 作为 NaN 处理的值
    parse_dates=['date'],       # 解析为日期的列
    encoding='utf-8',           # 文件编码
    nrows=1000                  # 要读取的行数
)

# 分块读取大文件
chunks = pd.read_csv('large_file.csv', chunksize=10000)
for chunk in chunks:
    # 处理每个块
    process(chunk)
```

### 读取 Excel 文件

```python
# 基本 Excel 读取
df = pd.read_excel('data.xlsx')

# 带特定选项
df = pd.read_excel(
    'data.xlsx',
    sheet_name='Sheet1',        # 工作表名称或索引
    header=0,                   # 列名所在行
    usecols='A:D',              # 要读取的列
    skiprows=2,                 # 要跳过的行
    engine='openpyxl'           # .xlsx 文件的引擎
)

# 读取多个工作表
all_sheets = pd.read_excel('data.xlsx', sheet_name=None)
for sheet_name, df in all_sheets.items():
    print(f"工作表: {sheet_name}, 形状: {df.shape}")
```

### 从数据库读取

```python
import sqlite3
from sqlalchemy import create_engine

# 使用 SQLite
conn = sqlite3.connect('database.db')
df = pd.read_sql('SELECT * FROM users', conn)
conn.close()

# 使用 SQLAlchemy（推荐）
engine = create_engine('postgresql://user:password@localhost/dbname')
df = pd.read_sql('SELECT * FROM users WHERE active = true', engine)

# 读取整个表
df = pd.read_sql_table('users', engine)

# 参数化查询（防止 SQL 注入）
df = pd.read_sql(
    'SELECT * FROM users WHERE city = %(city)s',
    engine,
    params={'city': '纽约'}
)
```

### 读取 JSON 和其他格式

```python
# JSON
df = pd.read_json('data.json')
df = pd.read_json('data.json', orient='records', lines=True)

# Parquet（高效的列式格式）
df = pd.read_parquet('data.parquet')

# HTML 表格
tables = pd.read_html('https://example.com/page.html')
df = tables[0]  # 页面上的第一个表格

# 剪贴板
df = pd.read_clipboard()
```

### 写入数据

```python
# CSV
df.to_csv('output.csv', index=False)

# Excel
df.to_excel('output.xlsx', sheet_name='Data', index=False)

# JSON
df.to_json('output.json', orient='records', indent=2)

# Parquet
df.to_parquet('output.parquet', compression='snappy')

# SQL
df.to_sql('table_name', engine, if_exists='replace', index=False)
```

---

## 选择和过滤

### 列选择

```python
# 单列选择（返回 Series）
ages = df['年龄']

# 多列选择（返回 DataFrame）
subset = df[['姓名', '年龄']]

# 使用 .loc 和 .iloc 进行列选择
df.loc[:, '姓名']              # 按标签
df.iloc[:, 0]                  # 按位置
df.loc[:, '姓名':'城市']       # 按标签切片
```

### 行选择

```python
# 使用 .loc（基于标签）
df.loc[0]                      # 索引为 0 的行
df.loc[0:2]                    # 第 0 到 2 行（包含）
df.loc[0:2, '姓名':'城市']     # 行和列一起

# 使用 .iloc（基于位置）
df.iloc[0]                     # 第一行
df.iloc[0:2]                   # 前两行（不包含 2）
df.iloc[0:2, 0:2]              # 前 2 行，前 2 列

# 使用 .at 和 .iat（快速标量访问）
df.at[0, '姓名']               # 按标签（单个值）
df.iat[0, 0]                   # 按位置（单个值）
```

### 条件过滤

```python
# 简单条件过滤
df[df['年龄'] > 28]

# 多条件（使用 & 表示 AND，| 表示 OR）
df[(df['年龄'] > 25) & (df['薪资'] > 80000)]
df[(df['城市'] == '纽约') | (df['城市'] == '洛杉矶')]

# 使用 isin() 进行过滤
df[df['城市'].isin(['纽约', '洛杉矶'])]

# 使用 query() 方法（更简洁的语法）
df.query('年龄 > 25 and 薪资 > 80000')
df.query('城市 in ["纽约", "洛杉矶"]')

# 字符串方法过滤
df[df['姓名'].str.contains('li', case=False)]
df[df['姓名'].str.startswith('A')]
df[df['姓名'].str.len() > 5]
```

### 高级布尔索引

```python
# 使用 where() 保留结构
df.where(df['年龄'] > 28, other='N/A')

# 使用 mask() 进行反向操作
df.mask(df['年龄'] > 28, other='已过滤')

# 使用 np.where() 进行条件赋值
df['年龄组'] = np.where(df['年龄'] > 30, '资深', '初级')

# 多条件使用 np.select()
conditions = [
    df['年龄'] < 25,
    (df['年龄'] >= 25) & (df['年龄'] < 35),
    df['年龄'] >= 35
]
choices = ['青年', '中年', '资深']
df['年龄类别'] = np.select(conditions, choices, default='未知')
```

---

## 数据清洗

数据清洗是数据分析中最耗时但最关键的步骤。Pandas 提供了丰富的工具来处理脏数据。

### 处理缺失值

```python
# 创建包含缺失值的数据
df = pd.DataFrame({
    '姓名': ['Alice', 'Bob', None, 'Diana'],
    '年龄': [25, None, 35, 28],
    '薪资': [75000, 85000, None, 82000]
})

# 检测缺失值
print(df.isnull())               # 布尔 DataFrame
print(df.isnull().sum())         # 每列的计数
print(df.isnull().any())         # 每列是否有缺失
print(df.isnull().sum().sum())   # 总缺失计数

# 删除缺失值
df.dropna()                      # 删除包含任何 NaN 的行
df.dropna(axis=1)                # 删除包含任何 NaN 的列
df.dropna(how='all')             # 删除所有值都是 NaN 的行
df.dropna(thresh=2)              # 保留至少有 2 个非 NaN 的行
df.dropna(subset=['姓名'])       # 只考虑特定列

# 填充缺失值
df.fillna(0)                               # 用 0 填充
df.fillna({'年龄': 30, '薪资': 80000})    # 按列填充
df['年龄'].fillna(df['年龄'].mean())         # 用均值填充
df['年龄'].fillna(df['年龄'].median())       # 用中位数填充
df.fillna(method='ffill')                  # 前向填充
df.fillna(method='bfill')                  # 后向填充

# 插值
df['年龄'].interpolate(method='linear')     # 线性插值
df['薪资'].interpolate(method='polynomial', order=2)
```

### 处理重复值

```python
# 创建包含重复项的数据
df = pd.DataFrame({
    '姓名': ['Alice', 'Bob', 'Alice', 'Charlie'],
    '年龄': [25, 30, 25, 35],
    '城市': ['纽约', '洛杉矶', '纽约', '芝加哥']
})

# 检测重复项
print(df.duplicated())                     # 布尔 Series
print(df.duplicated().sum())               # 重复项计数
print(df.duplicated(subset=['姓名']))      # 基于特定列
print(df.duplicated(keep='last'))          # 将第一次出现标记为重复

# 删除重复项
df.drop_duplicates()                       # 保留第一次出现
df.drop_duplicates(keep='last')            # 保留最后一次出现
df.drop_duplicates(keep=False)             # 删除所有重复项
df.drop_duplicates(subset=['姓名'])        # 基于特定列
df.drop_duplicates(subset=['姓名', '年龄'], keep='first')
```

### 数据类型转换

```python
# 查看数据类型
print(df.dtypes)

# 转换数据类型
df['年龄'] = df['年龄'].astype(int)
df['薪资'] = df['薪资'].astype(float)
df['姓名'] = df['姓名'].astype('string')

# 转换为类别（节省内存）
df['城市'] = df['城市'].astype('category')

# 使用 pd.to_numeric() 处理混合类型
df['混合列'] = pd.to_numeric(df['混合列'], errors='coerce')

# 转换日期时间
df['日期'] = pd.to_datetime(df['日期'])
df['日期'] = pd.to_datetime(df['日期'], format='%Y-%m-%d')

# 转换为可空整数类型（支持 NaN）
df['年龄'] = df['年龄'].astype('Int64')  # 注意：大写 I
```

### 字符串处理

```python
# 通过 .str 访问器使用字符串方法
df['姓名'].str.upper()                 # 大写
df['姓名'].str.lower()                 # 小写
df['姓名'].str.strip()                 # 移除空白
df['姓名'].str.replace('old', 'new')   # 替换
df['姓名'].str.split(' ')              # 分割
df['姓名'].str.len()                   # 长度
df['姓名'].str.title()                 # 首字母大写

# 正则表达式
df['电话'].str.extract(r'(\d{3})-(\d{4})-(\d{4})')
df['文本'].str.findall(r'\d+')
df['邮箱'].str.match(r'[\w.]+@[\w.]+')

# 组合字符串方法
df['姓名'].str.strip().str.lower().str.replace(' ', '_')
```

### 重命名和替换

```python
# 重命名列
df.rename(columns={'姓名': '全名', '年龄': '岁数'})

# 使用函数重命名
df.rename(columns=str.lower)
df.rename(columns=lambda x: x.replace(' ', '_'))

# 替换值
df['城市'].replace('纽约', '纽约市')
df.replace({'纽约': '纽约市', '洛杉矶': '洛杉矶市'})
df['等级'].replace([1, 2, 3], ['低', '中', '高'])
```

---

## GroupBy 操作

GroupBy 是 Pandas 最强大的功能之一，可以对数据进行拆分-应用-合并操作。

### 基本 GroupBy 操作

```python
# 创建示例销售数据
sales = pd.DataFrame({
    '日期': pd.date_range('2024-01-01', periods=10, freq='D'),
    '产品': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
    '地区': ['东区', '东区', '西区', '西区', '东区', '东区', '西区', '西区', '东区', '东区'],
    '数量': [100, 150, 200, 180, 120, 160, 140, 190, 130, 170],
    '收入': [1000, 1500, 2000, 1800, 1200, 1600, 1400, 1900, 1300, 1700]
})

# 单列分组
grouped = sales.groupby('产品')
print(grouped.mean())
print(grouped.sum())

# 多列分组
grouped = sales.groupby(['产品', '地区'])
print(grouped.sum())

# 常用聚合函数
grouped.count()     # 计数
grouped.sum()       # 求和
grouped.mean()      # 均值
grouped.median()    # 中位数
grouped.std()       # 标准差
grouped.min()       # 最小值
grouped.max()       # 最大值
grouped.first()     # 第一个值
grouped.last()      # 最后一个值
```

### 高级聚合

```python
# 使用 agg() 进行多种聚合
result = sales.groupby('产品').agg({
    '数量': ['sum', 'mean', 'max'],
    '收入': ['sum', 'mean']
})

# 自定义聚合函数
def range_func(x):
    return x.max() - x.min()

result = sales.groupby('产品')['数量'].agg(['sum', 'mean', range_func])

# 命名聚合（Pandas 0.25+）
result = sales.groupby('产品').agg(
    总数量=('数量', 'sum'),
    平均数量=('数量', 'mean'),
    总收入=('收入', 'sum'),
    最大收入=('收入', 'max')
)

# Transform：保持原始形状
sales['产品平均数量'] = sales.groupby('产品')['数量'].transform('mean')
sales['产品总收入占比'] = (
    sales['收入'] / sales.groupby('产品')['收入'].transform('sum') * 100
)

# Apply：灵活的自定义操作
def top_n(group, n=2):
    return group.nlargest(n, '数量')

result = sales.groupby('产品').apply(top_n)

# Filter：保留满足条件的组
result = sales.groupby('产品').filter(lambda x: x['数量'].mean() > 140)
```

### 数据透视表

```python
# 创建数据透视表
pivot = sales.pivot_table(
    values='收入',
    index='产品',
    columns='地区',
    aggfunc='sum'
)
print(pivot)

# 多种聚合
pivot = sales.pivot_table(
    values=['数量', '收入'],
    index='产品',
    columns='地区',
    aggfunc='sum'
)

# 带边际（总计）
pivot = sales.pivot_table(
    values='收入',
    index='产品',
    columns='地区',
    aggfunc='sum',
    margins=True,
    margins_name='总计'
)

# 交叉表
ct = pd.crosstab(sales['产品'], sales['地区'])
ct = pd.crosstab(sales['产品'], sales['地区'], normalize='index')
```

---

## 合并和连接

### concat：堆叠 DataFrame

```python
df1 = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
df2 = pd.DataFrame({'A': [5, 6], 'B': [7, 8]})

# 垂直拼接（默认）
result = pd.concat([df1, df2])
result = pd.concat([df1, df2], ignore_index=True)

# 水平拼接
result = pd.concat([df1, df2], axis=1)

# 处理不同的列
df3 = pd.DataFrame({'A': [9, 10], 'C': [11, 12]})
result = pd.concat([df1, df3], join='inner')  # 只保留共同列
result = pd.concat([df1, df3], join='outer')  # 所有列（默认）

# 使用 keys 创建多级索引
result = pd.concat([df1, df2], keys=['第一', '第二'])
```

### merge：SQL 风格的连接

```python
# 创建示例数据
employees = pd.DataFrame({
    '员工ID': [1, 2, 3, 4],
    '姓名': ['Alice', 'Bob', 'Charlie', 'Diana'],
    '部门ID': [101, 102, 101, 103]
})

departments = pd.DataFrame({
    '部门ID': [101, 102, 104],
    '部门名称': ['工程部', '市场部', '财务部']
})

# 内连接（默认）
result = pd.merge(employees, departments, on='部门ID')

# 左连接
result = pd.merge(employees, departments, on='部门ID', how='left')

# 右连接
result = pd.merge(employees, departments, on='部门ID', how='right')

# 外连接
result = pd.merge(employees, departments, on='部门ID', how='outer')

# 在不同列名上连接
result = pd.merge(
    employees, departments,
    left_on='部门ID', right_on='dept_id'
)

# 多键连接
result = pd.merge(df1, df2, on=['Key1', 'Key2'])

# 使用索引连接
result = pd.merge(df1, df2, left_index=True, right_index=True)

# 处理重叠的列名
result = pd.merge(df1, df2, on='Key', suffixes=('_左', '_右'))

# 用于调试的指示列
result = pd.merge(employees, departments, on='部门ID', how='outer', indicator=True)
```

### join：基于索引的连接

```python
# join 默认使用索引
df1 = pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c'])
df2 = pd.DataFrame({'B': [4, 5, 6]}, index=['a', 'b', 'd'])

result = df1.join(df2, how='left')
result = df1.join(df2, how='outer')

# 在列上连接
df1 = df1.set_index('Key')
result = df1.join(df2, on='Key')
```

---

## 时间序列

Pandas 提供了强大的时间序列处理功能，这是其核心优势之一。

### 日期时间基础

```python
# 创建日期时间索引
dates = pd.date_range('2024-01-01', periods=10, freq='D')
dates = pd.date_range('2024-01-01', '2024-12-31', freq='M')
dates = pd.date_range('2024-01-01', periods=24, freq='H')

# 常用频率别名
# 'D' - 日历日
# 'B' - 工作日
# 'W' - 周
# 'M' - 月末
# 'MS' - 月初
# 'Q' - 季末
# 'Y' - 年末
# 'H' - 小时
# 'T' 或 'min' - 分钟

# 时间序列 DataFrame
ts = pd.DataFrame({
    '日期': pd.date_range('2024-01-01', periods=100, freq='D'),
    '值': np.random.randn(100).cumsum()
})
ts.set_index('日期', inplace=True)

# 日期时间属性
ts.index.year          # 年
ts.index.month         # 月
ts.index.day           # 日
ts.index.dayofweek     # 星期几（0=周一）
ts.index.quarter       # 季度
ts.index.is_month_end  # 是否月末
ts.index.day_name()    # 星期名称（'Monday' 等）
```

### 时间序列索引和切片

```python
# 基于日期的索引
ts['2024-01-15']                    # 单日
ts['2024-01']                       # 整月
ts['2024-01':'2024-03']             # 日期范围
ts.loc['2024-01-01':'2024-01-15']   # 使用 loc

# 按时间组件过滤
ts[ts.index.month == 1]             # 仅一月
ts[ts.index.dayofweek < 5]          # 仅工作日
```

### 重采样

```python
# 降采样（高频到低频）
ts.resample('W').mean()      # 周均值
ts.resample('M').sum()       # 月总和
ts.resample('Q').last()      # 季度最后一个值
ts.resample('M').agg({
    '值': ['mean', 'std', 'min', 'max']
})

# 升采样（低频到高频）
ts_monthly = ts.resample('M').mean()
ts_daily = ts_monthly.resample('D').ffill()    # 前向填充
ts_daily = ts_monthly.resample('D').interpolate()  # 插值

# OHLC 聚合（开盘、最高、最低、收盘）
ts.resample('W').ohlc()
```

### 滚动窗口计算

```python
# 滚动计算
ts['MA7'] = ts['值'].rolling(window=7).mean()      # 7 日移动平均
ts['MA30'] = ts['值'].rolling(window=30).mean()    # 30 日移动平均
ts['Std7'] = ts['值'].rolling(window=7).std()      # 7 日滚动标准差

# 扩展窗口（从开始到当前）
ts['累计均值'] = ts['值'].expanding().mean()
ts['累计最大'] = ts['值'].expanding().max()

# 指数加权移动平均
ts['EMA'] = ts['值'].ewm(span=7).mean()
ts['EMA12'] = ts['值'].ewm(span=12, adjust=False).mean()

# 移位和差分
ts['滞后1'] = ts['值'].shift(1)          # 滞后 1 期
ts['领先1'] = ts['值'].shift(-1)        # 领先 1 期
ts['差分'] = ts['值'].diff()            # 一阶差分
ts['百分比变化'] = ts['值'].pct_change() # 百分比变化
ts['对数收益'] = np.log(ts['值'] / ts['值'].shift(1))
```

### 时区处理

```python
# 本地化时区
ts.index = ts.index.tz_localize('UTC')
ts.index = ts.index.tz_localize('America/New_York')

# 转换时区
ts.index = ts.index.tz_convert('Europe/London')

# 移除时区信息
ts.index = ts.index.tz_localize(None)
```

---

## 性能技巧

处理大型数据集时，性能优化至关重要。

### 内存优化

```python
# 查看内存使用
print(df.memory_usage(deep=True))
print(f"总内存: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# 优化数据类型
def optimize_dtypes(df):
    """通过向下转换类型来优化 DataFrame 内存使用。"""
    df = df.copy()

    # 向下转换整数
    for col in df.select_dtypes(include=['int64']).columns:
        df[col] = pd.to_numeric(df[col], downcast='integer')

    # 向下转换浮点数
    for col in df.select_dtypes(include=['float64']).columns:
        df[col] = pd.to_numeric(df[col], downcast='float')

    # 将低基数字符串转换为类别
    for col in df.select_dtypes(include=['object']).columns:
        if df[col].nunique() / len(df) < 0.5:
            df[col] = df[col].astype('category')

    return df

df_optimized = optimize_dtypes(df)

# 比较内存使用
print(f"之前: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
print(f"之后: {df_optimized.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# 分块读取大文件
chunks = pd.read_csv('large_file.csv', chunksize=10000)
result = pd.concat([chunk.query('condition') for chunk in chunks])

# 使用高效的文件格式
df.to_parquet('data.parquet')  # 对于大数据比 CSV 快得多
```

### 计算优化

```python
# 向量化操作 vs 循环
# 错误：使用循环
for i in range(len(df)):
    df.loc[i, 'NewCol'] = df.loc[i, 'A'] + df.loc[i, 'B']

# 正确：向量化操作
df['NewCol'] = df['A'] + df['B']

# 使用 DataFrame.assign() 进行链式操作
df = df.assign(NewCol=df['A'] + df['B'] * df['C'])

# 使用 query() 替代布尔索引
# 对于小 DataFrame 稍慢，对于大 DataFrame 更快
df.query('A > 0 and B < 100')

# 尽可能避免 apply() - 使用向量化替代方案
# 错误
df['Result'] = df['Value'].apply(lambda x: x ** 2 + x)

# 正确
df['Result'] = df['Value'] ** 2 + df['Value']

# 当必须使用 apply() 时，对 numpy 操作使用 raw=True
df['Result'] = df[['A', 'B']].apply(lambda x: np.sum(x), axis=1, raw=True)

# 使用 numba 加速自定义操作
from numba import jit

@jit(nopython=True)
def custom_calc(values):
    result = np.empty(len(values))
    for i in range(len(values)):
        result[i] = values[i] ** 2 + values[i]
    return result

df['Result'] = custom_calc(df['Value'].values)
```

### 索引优化

```python
# 设置适当的索引
df.set_index('ID', inplace=True)

# 对索引排序以加快查找
df.sort_index(inplace=True)

# 使用 .loc 替代链式索引
# 错误
df[df['A'] > 0]['B']

# 正确
df.loc[df['A'] > 0, 'B']

# 对重复值使用分类索引
df.index = pd.CategoricalIndex(df.index)
```

### 并行处理

```python
# 使用 swifter 自动并行化
# pip install swifter
import swifter
df['Result'] = df['Value'].swifter.apply(lambda x: complex_function(x))

# 使用 multiprocessing 与 pandas
from multiprocessing import Pool

def process_chunk(chunk):
    return chunk.apply(complex_function)

chunks = np.array_split(df, 4)
with Pool(4) as pool:
    results = pool.map(process_chunk, chunks)
df = pd.concat(results)
```

---

## 面试重点

### 常见问题

**问题1：loc 和 iloc 有什么区别？**

- `loc`：基于标签的索引，使用行/列名
- `iloc`：基于位置的索引，使用整数位置

```python
df.loc[0:2]     # 包含索引 2
df.iloc[0:2]    # 不包含位置 2
```

**问题2：merge 和 join 有什么区别？**

- `merge`：类似 SQL 的连接操作，可以在列或索引上连接
- `join`：主要是基于索引的连接，是 merge 的简化版本

**问题3：如何处理大型数据集？**

- 使用 `chunksize` 进行分块读取
- 优化数据类型以减少内存
- 使用 `query()` 方法进行高效过滤
- 考虑使用 Dask 或 Modin 进行分布式计算
- 使用 Parquet 格式替代 CSV

**问题4：如何在 groupby 后保持原始索引？**

使用 `transform` 方法：

```python
df['组均值'] = df.groupby('类别')['值'].transform('mean')
```

**问题5：如何提高 apply() 函数的性能？**

- 优先使用向量化操作
- 使用 `swifter` 库自动并行化
- 使用 `numba` JIT 编译加速
- 考虑 numpy 的 `ufunc`
- 尽可能设置 `raw=True`

**问题6：pivot_table 和 groupby 有什么区别？**

- `groupby`：返回扁平化的聚合结果
- `pivot_table`：创建类似电子表格的 2D 透视表，更适合展示

**问题7：如何处理大型 DataFrame 的内存错误？**

```python
# 分块读取
for chunk in pd.read_csv('large.csv', chunksize=10000):
    process(chunk)

# 使用优化的数据类型减少内存
df = pd.read_csv('data.csv', dtype={'col1': 'int32', 'col2': 'category'})

# 只选择需要的列
df = pd.read_csv('data.csv', usecols=['col1', 'col2'])

# 使用 Dask 进行核外计算
import dask.dataframe as dd
ddf = dd.read_csv('large.csv')
```

**问题8：解释 Pandas 中的写时复制行为。**

```python
# 创建视图 vs 副本
subset = df[df['A'] > 0]  # 在大多数情况下创建副本
subset.loc[:, 'B'] = 0    # 修改 subset，不影响原始 df

# 显式复制
df_copy = df.copy()       # 始终创建新副本
df_copy['A'] = 0          # 不影响原始数据
```

---

## 实战案例

### 案例 1：销售数据分析

```python
import pandas as pd
import numpy as np

# 生成示例销售数据
np.random.seed(42)
n = 1000

sales_data = pd.DataFrame({
    '订单ID': range(1, n + 1),
    '日期': pd.date_range('2024-01-01', periods=n, freq='H'),
    '产品': np.random.choice(['手机', '笔记本', '平板', '耳机'], n),
    '地区': np.random.choice(['东区', '西区', '北区', '南区'], n),
    '数量': np.random.randint(1, 10, n),
    '单价': np.random.uniform(100, 2000, n).round(2),
    '客户类型': np.random.choice(['VIP', '普通', '新客'], n, p=[0.2, 0.5, 0.3])
})
sales_data['收入'] = sales_data['数量'] * sales_data['单价']

# 基本统计
print("=== 销售概览 ===")
print(f"总收入: ¥{sales_data['收入'].sum():,.2f}")
print(f"平均订单金额: ¥{sales_data['收入'].mean():,.2f}")
print(f"总订单数: {len(sales_data)}")

# 产品分析
print("\n=== 产品销售分析 ===")
product_analysis = sales_data.groupby('产品').agg(
    订单数=('订单ID', 'count'),
    总数量=('数量', 'sum'),
    总收入=('收入', 'sum'),
    平均单价=('单价', 'mean')
).round(2)
print(product_analysis.sort_values('总收入', ascending=False))

# 地区-产品交叉分析
print("\n=== 地区-产品交叉分析 ===")
pivot = sales_data.pivot_table(
    values='收入',
    index='地区',
    columns='产品',
    aggfunc='sum',
    margins=True
).round(2)
print(pivot)

# 时间趋势分析
sales_data.set_index('日期', inplace=True)
daily_sales = sales_data.resample('D')['收入'].sum()
weekly_sales = sales_data.resample('W')['收入'].sum()

print("\n=== 日销售趋势（前 10 天）===")
print(daily_sales.head(10))
```

### 案例 2：数据清洗流程

```python
def data_cleaning_pipeline(df):
    """
    综合数据清洗流程。
    """
    df = df.copy()

    # 1. 标准化列名
    df.columns = df.columns.str.lower().str.replace(' ', '_')

    # 2. 处理缺失值
    # 用中位数填充数值列
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        df[col].fillna(df[col].median(), inplace=True)

    # 用众数填充分类列
    cat_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in cat_cols:
        df[col].fillna(df[col].mode()[0], inplace=True)

    # 3. 处理重复项
    df.drop_duplicates(inplace=True)

    # 4. 处理异常值（IQR 方法）
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df[col] = df[col].clip(lower_bound, upper_bound)

    # 5. 优化数据类型
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], downcast='float')
    for col in cat_cols:
        if df[col].nunique() < 50:
            df[col] = df[col].astype('category')

    return df

# 使用
# cleaned_df = data_cleaning_pipeline(raw_df)
```

### 案例 3：客户群组分析

```python
def cohort_analysis(df, user_col, date_col, value_col):
    """
    对用户数据进行群组分析。
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    # 获取每个用户的首次购买日期
    df['群组月'] = df.groupby(user_col)[date_col].transform('min').dt.to_period('M')
    df['订单月'] = df[date_col].dt.to_period('M')

    # 计算自首次购买以来的月数
    df['群组索引'] = (
        (df['订单月'].dt.year - df['群组月'].dt.year) * 12 +
        (df['订单月'].dt.month - df['群组月'].dt.month)
    )

    # 创建群组表
    cohort_data = df.groupby(['群组月', '群组索引'])[user_col].nunique()
    cohort_table = cohort_data.unstack(fill_value=0)

    # 计算留存率
    cohort_sizes = cohort_table.iloc[:, 0]
    retention_table = cohort_table.divide(cohort_sizes, axis=0) * 100

    return retention_table.round(2)

# 使用
# retention = cohort_analysis(orders_df, '客户ID', '订单日期', '收入')
```

---

## 延伸阅读

### 官方资源

- [Pandas 官方文档](https://pandas.pydata.org/docs/)
- [Pandas Cookbook](https://pandas.pydata.org/docs/user_guide/cookbook.html)
- [10 分钟入门 Pandas](https://pandas.pydata.org/docs/user_guide/10min.html)

### 推荐书籍

- **《利用 Python 进行数据分析》** - Wes McKinney（Pandas 创建者）
- **《Effective Pandas》** - Matt Harrison
- **《Pandas 1.x Cookbook》** - Matt Harrison

### 替代工具

- **Dask**：用于处理超过内存大小数据集的分布式 Pandas
- **Modin**：具有并行执行的 Pandas 替代品
- **Polars**：用 Rust 编写的高性能 DataFrame 库
- **Vaex**：用于十亿级行数据集的 DataFrame 库
- **cuDF**：GPU DataFrame 库（RAPIDS 的一部分）

### 在线练习

- [Kaggle Learn - Pandas](https://www.kaggle.com/learn/pandas)
- [DataCamp - Pandas 课程](https://www.datacamp.com/courses/pandas-foundations)
- [LeetCode 数据库问题](https://leetcode.com/problemset/database/)（可以用 Pandas 解决）
- [HackerRank Python](https://www.hackerrank.com/domains/python)

### 相关 Code Wiki 文章

- [NumPy 基础](/data/numpy) - Pandas 构建的基础
- [SQL 高级查询](/data/sql-advanced) - 与 SQL 操作的比较
- [数据可视化](/data/visualization) - 可视化 Pandas DataFrames
- [统计学基础](/data/statistics-fundamentals) - 数据分析的统计概念

---

> **总结**：掌握 Pandas 是数据分析的基础。通过持续练习和实际项目应用，你将能够高效处理各种数据操作任务。记住，学习的最佳方式是动手处理真实数据集。
