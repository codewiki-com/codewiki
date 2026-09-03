---
title: Python sqlite3 数据库
description: 学习 Python 内置 sqlite3 模块进行数据库操作，包括 CRUD、事务和参数化查询
track: backend
section: databases
difficulty: beginner
tags:
  - Python
  - sqlite3
  - 数据库
  - SQL
status: imported
origin: old/src/content/docs/python/sqlite3.zh.md
divergence: 0.106
issues: []
legacy:
  category: Python
  subcategory: 数据库
  order: 39
  lastUpdated: 2026-01-07
---

`sqlite3` 是 Python 内置的标准库模块，提供了与 SQLite 数据库交互的接口。SQLite 是一个轻量级、无服务器、零配置的嵌入式关系型数据库，非常适合小型应用、原型开发、测试和本地数据存储。

## 模块概览

```python
import sqlite3

# 核心组件
# sqlite3.connect()     - 连接数据库
# Connection 对象       - 数据库连接
# Cursor 对象           - 执行 SQL 语句
# Row 对象              - 查询结果行

# 常用函数
print(sqlite3.version)         # sqlite3 模块版本
print(sqlite3.sqlite_version)  # SQLite 库版本
```

---

## 连接数据库

### 基本连接

```python
import sqlite3

# 连接到数据库文件（如果不存在会自动创建）
conn = sqlite3.connect('example.db')

# 使用完毕后关闭连接
conn.close()

# 连接到内存数据库（临时数据库，程序结束后消失）
conn_memory = sqlite3.connect(':memory:')
conn_memory.close()
```

### 使用上下文管理器（推荐）

```python
import sqlite3

# 使用 with 语句自动管理连接
with sqlite3.connect('example.db') as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT sqlite_version()')
    print(cursor.fetchone())
# 退出 with 块时自动提交事务（如果没有异常）
```

### 连接参数

```python
import sqlite3

# 完整的连接参数示例
conn = sqlite3.connect(
    'example.db',
    timeout=5.0,              # 等待锁的超时时间（秒）
    detect_types=sqlite3.PARSE_DECLTYPES,  # 自动类型检测
    isolation_level='DEFERRED',  # 事务隔离级别
    check_same_thread=False,  # 允许多线程访问（需谨慎）
)
```

---

## Cursor 游标对象

游标（Cursor）是执行 SQL 语句和获取结果的核心对象。

### 创建和使用游标

```python
import sqlite3

conn = sqlite3.connect(':memory:')

# 创建游标
cursor = conn.cursor()

# 执行单条 SQL 语句
cursor.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)')

# 执行带参数的 SQL 语句
cursor.execute('INSERT INTO users (name) VALUES (?)', ('Alice',))

# 执行多条相同的 SQL 语句
users = [('Bob',), ('Charlie',), ('Diana',)]
cursor.executemany('INSERT INTO users (name) VALUES (?)', users)

# 执行多条不同的 SQL 语句（用分号分隔）
cursor.executescript('''
    INSERT INTO users (name) VALUES ('Eve');
    INSERT INTO users (name) VALUES ('Frank');
''')

# 提交更改
conn.commit()

# 查询数据
cursor.execute('SELECT * FROM users')
print(cursor.fetchall())

conn.close()
```

### 获取查询结果

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建测试数据
cursor.execute('CREATE TABLE products (id INTEGER, name TEXT, price REAL)')
products = [
    (1, '苹果', 5.5),
    (2, '香蕉', 3.0),
    (3, '橙子', 4.5),
    (4, '葡萄', 8.0),
    (5, '西瓜', 15.0),
]
cursor.executemany('INSERT INTO products VALUES (?, ?, ?)', products)

# 查询所有数据
cursor.execute('SELECT * FROM products')

# fetchone() - 获取一行
print(cursor.fetchone())  # (1, '苹果', 5.5)

# fetchmany(n) - 获取 n 行
print(cursor.fetchmany(2))  # [(2, '香蕉', 3.0), (3, '橙子', 4.5)]

# fetchall() - 获取剩余所有行
print(cursor.fetchall())  # [(4, '葡萄', 8.0), (5, '西瓜', 15.0)]

# 迭代游标
cursor.execute('SELECT * FROM products')
for row in cursor:
    print(row)

conn.close()
```

### 游标属性

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

cursor.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)')
cursor.execute('INSERT INTO test (value) VALUES (?)', ('hello',))

# lastrowid - 最后插入行的 ID
print(f"最后插入的行 ID: {cursor.lastrowid}")

cursor.execute('UPDATE test SET value = ? WHERE id = ?', ('world', 1))

# rowcount - 受影响的行数
print(f"受影响的行数: {cursor.rowcount}")

cursor.execute('SELECT * FROM test')

# description - 查询结果的列信息
print(f"列描述: {cursor.description}")
# 输出: (('id', None, None, None, None, None, None), ('value', None, None, None, None, None, None))

conn.close()
```

---

## CRUD 操作

### Create（创建表和插入数据）

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建表
cursor.execute('''
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department TEXT,
        salary REAL,
        hire_date TEXT,
        is_active INTEGER DEFAULT 1
    )
''')

# 插入单条数据
cursor.execute('''
    INSERT INTO employees (name, department, salary, hire_date)
    VALUES (?, ?, ?, ?)
''', ('张三', '技术部', 15000.00, '2023-01-15'))

# 插入多条数据
employees = [
    ('李四', '市场部', 12000.00, '2023-03-20'),
    ('王五', '技术部', 18000.00, '2022-08-10'),
    ('赵六', '人事部', 10000.00, '2023-06-01'),
]
cursor.executemany('''
    INSERT INTO employees (name, department, salary, hire_date)
    VALUES (?, ?, ?, ?)
''', employees)

# 使用命名参数插入
cursor.execute('''
    INSERT INTO employees (name, department, salary, hire_date)
    VALUES (:name, :department, :salary, :hire_date)
''', {
    'name': '钱七',
    'department': '财务部',
    'salary': 13000.00,
    'hire_date': '2023-09-15'
})

conn.commit()

# 验证插入
cursor.execute('SELECT * FROM employees')
for row in cursor.fetchall():
    print(row)

conn.close()
```

### Read（查询数据）

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建测试数据
cursor.execute('''
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL,
        stock INTEGER
    )
''')

products = [
    (1, '笔记本电脑', '电子产品', 5999.00, 50),
    (2, '无线鼠标', '电子产品', 99.00, 200),
    (3, '机械键盘', '电子产品', 399.00, 100),
    (4, '办公椅', '办公用品', 899.00, 30),
    (5, '台灯', '办公用品', 159.00, 80),
]
cursor.executemany('INSERT INTO products VALUES (?, ?, ?, ?, ?)', products)

# 查询所有数据
cursor.execute('SELECT * FROM products')
print("所有产品:", cursor.fetchall())

# 条件查询
cursor.execute('SELECT * FROM products WHERE category = ?', ('电子产品',))
print("电子产品:", cursor.fetchall())

# 排序查询
cursor.execute('SELECT * FROM products ORDER BY price DESC')
print("按价格降序:", cursor.fetchall())

# 限制结果数量
cursor.execute('SELECT * FROM products ORDER BY price DESC LIMIT 3')
print("最贵的3个产品:", cursor.fetchall())

# 聚合查询
cursor.execute('SELECT category, COUNT(*), AVG(price) FROM products GROUP BY category')
print("分类统计:", cursor.fetchall())

# 使用 LIKE 模糊查询
cursor.execute('SELECT * FROM products WHERE name LIKE ?', ('%电%',))
print("名称包含'电'的产品:", cursor.fetchall())

# 范围查询
cursor.execute('SELECT * FROM products WHERE price BETWEEN ? AND ?', (100, 500))
print("价格在100-500之间:", cursor.fetchall())

conn.close()
```

### Update（更新数据）

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建测试表和数据
cursor.execute('CREATE TABLE inventory (id INTEGER PRIMARY KEY, product TEXT, quantity INTEGER)')
cursor.executemany('INSERT INTO inventory VALUES (?, ?, ?)', [
    (1, 'Apple', 100),
    (2, 'Banana', 150),
    (3, 'Orange', 80),
])
conn.commit()

# 更新单个字段
cursor.execute('UPDATE inventory SET quantity = ? WHERE product = ?', (120, 'Apple'))
print(f"更新了 {cursor.rowcount} 行")

# 更新多个字段
cursor.execute('''
    UPDATE inventory
    SET product = ?, quantity = ?
    WHERE id = ?
''', ('Green Apple', 130, 1))

# 批量更新
updates = [
    (200, 'Banana'),
    (100, 'Orange'),
]
cursor.executemany('UPDATE inventory SET quantity = ? WHERE product = ?', updates)

# 条件更新
cursor.execute('UPDATE inventory SET quantity = quantity + 10 WHERE quantity < 150')

conn.commit()

# 验证更新
cursor.execute('SELECT * FROM inventory')
print("更新后的数据:", cursor.fetchall())

conn.close()
```

### Delete（删除数据）

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建测试表和数据
cursor.execute('CREATE TABLE logs (id INTEGER PRIMARY KEY, level TEXT, message TEXT)')
logs = [
    (1, 'INFO', '应用启动'),
    (2, 'DEBUG', '调试信息'),
    (3, 'ERROR', '发生错误'),
    (4, 'WARNING', '警告信息'),
    (5, 'DEBUG', '更多调试'),
]
cursor.executemany('INSERT INTO logs VALUES (?, ?, ?)', logs)
conn.commit()

# 删除单条记录
cursor.execute('DELETE FROM logs WHERE id = ?', (1,))
print(f"删除了 {cursor.rowcount} 行")

# 条件删除
cursor.execute('DELETE FROM logs WHERE level = ?', ('DEBUG',))
print(f"删除了 {cursor.rowcount} 行 DEBUG 日志")

# 删除所有数据
cursor.execute('DELETE FROM logs')
print(f"清空表，删除了 {cursor.rowcount} 行")

# 或者使用 TRUNCATE 等效操作（更快）
# cursor.execute('DELETE FROM logs')
# cursor.execute('VACUUM')  # 回收空间

conn.commit()
conn.close()
```

---

## 参数化查询

参数化查询是防止 SQL 注入攻击的关键技术，应该始终使用参数化查询而不是字符串拼接。

### 位置参数（?）

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

cursor.execute('CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)')

# 单个参数（注意元组的逗号）
cursor.execute('INSERT INTO users VALUES (?, ?, ?)', (1, 'Alice', 25))

# 多个参数
name = 'Bob'
age = 30
cursor.execute('INSERT INTO users VALUES (?, ?, ?)', (2, name, age))

# 在 WHERE 子句中使用
cursor.execute('SELECT * FROM users WHERE age > ?', (20,))
print(cursor.fetchall())

conn.close()
```

### 命名参数（:name）

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

cursor.execute('CREATE TABLE products (id INTEGER, name TEXT, price REAL)')

# 使用字典传递命名参数
cursor.execute('''
    INSERT INTO products VALUES (:id, :name, :price)
''', {'id': 1, 'name': '商品A', 'price': 99.99})

# 更复杂的查询
params = {
    'min_price': 50,
    'max_price': 200,
    'name_pattern': '%商品%'
}
cursor.execute('''
    SELECT * FROM products
    WHERE price BETWEEN :min_price AND :max_price
    AND name LIKE :name_pattern
''', params)

print(cursor.fetchall())

conn.close()
```

### 避免 SQL 注入

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

cursor.execute('CREATE TABLE users (id INTEGER, username TEXT, password TEXT)')
cursor.execute('INSERT INTO users VALUES (1, "admin", "secret123")')
conn.commit()

# 危险的做法（永远不要这样做！）
def unsafe_login(username, password):
    # SQL 注入漏洞！
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    return cursor.fetchone()

# 攻击者可以输入: username = "admin' --", password = "anything"
# 生成的 SQL: SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything'
# 这会绕过密码验证！

# 安全的做法
def safe_login(username, password):
    cursor.execute('''
        SELECT * FROM users WHERE username = ? AND password = ?
    ''', (username, password))
    return cursor.fetchone()

# 参数化查询会正确处理特殊字符
result = safe_login("admin' --", "anything")
print(f"攻击尝试结果: {result}")  # None，攻击失败

result = safe_login("admin", "secret123")
print(f"正常登录结果: {result}")  # 返回用户信息

conn.close()
```

---

## 事务管理

SQLite 支持事务，确保数据操作的原子性、一致性、隔离性和持久性（ACID）。

### 基本事务操作

```python
import sqlite3

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

cursor.execute('CREATE TABLE accounts (id INTEGER, name TEXT, balance REAL)')
cursor.executemany('INSERT INTO accounts VALUES (?, ?, ?)', [
    (1, 'Alice', 1000.0),
    (2, 'Bob', 500.0),
])
conn.commit()

# 转账操作（事务示例）
def transfer(from_id, to_id, amount):
    try:
        # 检查余额
        cursor.execute('SELECT balance FROM accounts WHERE id = ?', (from_id,))
        balance = cursor.fetchone()[0]

        if balance < amount:
            raise ValueError("余额不足")

        # 扣款
        cursor.execute(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            (amount, from_id)
        )

        # 存款
        cursor.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            (amount, to_id)
        )

        # 提交事务
        conn.commit()
        print(f"转账成功: {amount} 从账户 {from_id} 到账户 {to_id}")

    except Exception as e:
        # 回滚事务
        conn.rollback()
        print(f"转账失败: {e}")

# 成功的转账
transfer(1, 2, 300)

# 查看结果
cursor.execute('SELECT * FROM accounts')
print("转账后余额:", cursor.fetchall())
# 输出: [(1, 'Alice', 700.0), (2, 'Bob', 800.0)]

# 失败的转账（余额不足）
transfer(1, 2, 1000)

conn.close()
```

### 使用上下文管理器管理事务

```python
import sqlite3
from contextlib import contextmanager

@contextmanager
def transaction(conn):
    """事务上下文管理器"""
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise

# 使用示例
conn = sqlite3.connect(':memory:')
cursor = conn.cursor()
cursor.execute('CREATE TABLE orders (id INTEGER, product TEXT, quantity INTEGER)')
conn.commit()

try:
    with transaction(conn) as cur:
        cur.execute('INSERT INTO orders VALUES (1, "Product A", 10)')
        cur.execute('INSERT INTO orders VALUES (2, "Product B", 20)')
        # 如果这里发生异常，上面的操作都会回滚
        # raise Exception("模拟错误")
    print("订单创建成功")
except Exception as e:
    print(f"订单创建失败: {e}")

conn.close()
```

### 隔离级别

```python
import sqlite3

# isolation_level 参数控制事务行为
# None - 自动提交模式（每条语句自动提交）
# 'DEFERRED' - 延迟事务（默认，第一次读写时开始事务）
# 'IMMEDIATE' - 立即事务（连接时立即获取写锁）
# 'EXCLUSIVE' - 独占事务（连接时获取独占锁）

# 自动提交模式
conn_autocommit = sqlite3.connect(':memory:', isolation_level=None)
cursor = conn_autocommit.cursor()
cursor.execute('CREATE TABLE test (id INTEGER)')
cursor.execute('INSERT INTO test VALUES (1)')  # 自动提交
conn_autocommit.close()

# 手动事务模式
conn_manual = sqlite3.connect(':memory:', isolation_level='DEFERRED')
cursor = conn_manual.cursor()
cursor.execute('CREATE TABLE test (id INTEGER)')
cursor.execute('BEGIN TRANSACTION')  # 显式开始事务
cursor.execute('INSERT INTO test VALUES (1)')
cursor.execute('INSERT INTO test VALUES (2)')
cursor.execute('COMMIT')  # 显式提交
conn_manual.close()
```

---

## Row 工厂

Row 工厂可以自定义查询结果的返回格式。

### 使用 sqlite3.Row

```python
import sqlite3

conn = sqlite3.connect(':memory:')
conn.row_factory = sqlite3.Row  # 设置 Row 工厂
cursor = conn.cursor()

cursor.execute('CREATE TABLE employees (id INTEGER, name TEXT, salary REAL)')
cursor.execute('INSERT INTO employees VALUES (1, "张三", 15000)')
cursor.execute('INSERT INTO employees VALUES (2, "李四", 12000)')

cursor.execute('SELECT * FROM employees')
rows = cursor.fetchall()

for row in rows:
    # 可以通过列名访问
    print(f"ID: {row['id']}, 姓名: {row['name']}, 薪资: {row['salary']}")

    # 也可以通过索引访问
    print(f"第一列: {row[0]}")

    # 获取所有列名
    print(f"列名: {row.keys()}")

conn.close()
```

### 自定义 Row 工厂

```python
import sqlite3

# 返回字典
def dict_factory(cursor, row):
    """将查询结果转换为字典"""
    return {
        col[0]: row[idx]
        for idx, col in enumerate(cursor.description)
    }

conn = sqlite3.connect(':memory:')
conn.row_factory = dict_factory
cursor = conn.cursor()

cursor.execute('CREATE TABLE products (id INTEGER, name TEXT, price REAL)')
cursor.execute('INSERT INTO products VALUES (1, "商品A", 99.99)')

cursor.execute('SELECT * FROM products')
result = cursor.fetchone()
print(result)  # {'id': 1, 'name': '商品A', 'price': 99.99}
print(type(result))  # <class 'dict'>

conn.close()
```

### 使用 namedtuple

```python
import sqlite3
from collections import namedtuple

def namedtuple_factory(cursor, row):
    """将查询结果转换为命名元组"""
    fields = [col[0] for col in cursor.description]
    Row = namedtuple('Row', fields)
    return Row(*row)

conn = sqlite3.connect(':memory:')
conn.row_factory = namedtuple_factory
cursor = conn.cursor()

cursor.execute('CREATE TABLE users (id INTEGER, name TEXT, email TEXT)')
cursor.execute('INSERT INTO users VALUES (1, "Alice", "alice@example.com")')

cursor.execute('SELECT * FROM users')
user = cursor.fetchone()

print(user)           # Row(id=1, name='Alice', email='alice@example.com')
print(user.name)      # Alice
print(user.email)     # alice@example.com

conn.close()
```

---

## 类型适配器与转换器

SQLite 原生只支持几种数据类型（NULL、INTEGER、REAL、TEXT、BLOB），但可以通过适配器和转换器扩展类型支持。

### 日期时间处理

```python
import sqlite3
from datetime import datetime, date

# 使用内置的日期时间支持
conn = sqlite3.connect(
    ':memory:',
    detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
)
cursor = conn.cursor()

# 创建表（使用 TIMESTAMP 类型声明）
cursor.execute('''
    CREATE TABLE events (
        id INTEGER PRIMARY KEY,
        name TEXT,
        event_date DATE,
        created_at TIMESTAMP
    )
''')

# 插入日期时间数据
now = datetime.now()
today = date.today()
cursor.execute(
    'INSERT INTO events (name, event_date, created_at) VALUES (?, ?, ?)',
    ('会议', today, now)
)

# 查询时自动转换为 Python 日期时间对象
cursor.execute('SELECT * FROM events')
row = cursor.fetchone()
print(f"ID: {row[0]}")
print(f"名称: {row[1]}")
print(f"日期: {row[2]} (类型: {type(row[2])})")
print(f"创建时间: {row[3]} (类型: {type(row[3])})")

conn.close()
```

### 自定义类型适配器

```python
import sqlite3
import json

# 自定义类：Point
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

# 适配器：将 Python 对象转换为 SQLite 可存储的格式
def adapt_point(point):
    return f"{point.x},{point.y}"

# 转换器：将 SQLite 数据转换回 Python 对象
def convert_point(data):
    x, y = map(float, data.decode().split(','))
    return Point(x, y)

# 注册适配器和转换器
sqlite3.register_adapter(Point, adapt_point)
sqlite3.register_converter("POINT", convert_point)

# 使用自定义类型
conn = sqlite3.connect(':memory:', detect_types=sqlite3.PARSE_DECLTYPES)
cursor = conn.cursor()

cursor.execute('CREATE TABLE locations (name TEXT, position POINT)')
cursor.execute('INSERT INTO locations VALUES (?, ?)', ('北京', Point(116.4, 39.9)))
cursor.execute('INSERT INTO locations VALUES (?, ?)', ('上海', Point(121.5, 31.2)))

cursor.execute('SELECT * FROM locations')
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]}")  # 北京: Point(116.4, 39.9)

conn.close()
```

### 存储 JSON 数据

```python
import sqlite3
import json

# JSON 适配器和转换器
def adapt_json(data):
    return json.dumps(data, ensure_ascii=False)

def convert_json(data):
    return json.loads(data.decode())

sqlite3.register_adapter(dict, adapt_json)
sqlite3.register_adapter(list, adapt_json)
sqlite3.register_converter("JSON", convert_json)

conn = sqlite3.connect(':memory:', detect_types=sqlite3.PARSE_DECLTYPES)
cursor = conn.cursor()

cursor.execute('CREATE TABLE configs (name TEXT, data JSON)')

# 存储字典
config = {'theme': 'dark', 'language': 'zh-CN', 'notifications': True}
cursor.execute('INSERT INTO configs VALUES (?, ?)', ('user_prefs', config))

# 存储列表
tags = ['Python', 'SQLite', '数据库']
cursor.execute('INSERT INTO configs VALUES (?, ?)', ('tags', tags))

# 查询并自动转换
cursor.execute('SELECT * FROM configs')
for name, data in cursor.fetchall():
    print(f"{name}: {data} (类型: {type(data).__name__})")

conn.close()
```

---

## 高级功能

### 创建自定义函数

```python
import sqlite3
import math
import hashlib

conn = sqlite3.connect(':memory:')

# 注册标量函数（返回单个值）
def md5_hash(text):
    """计算 MD5 哈希值"""
    if text is None:
        return None
    return hashlib.md5(text.encode()).hexdigest()

conn.create_function('md5', 1, md5_hash)

# 注册数学函数
conn.create_function('sqrt', 1, math.sqrt)
conn.create_function('power', 2, math.pow)

cursor = conn.cursor()

# 使用自定义函数
cursor.execute("SELECT md5('hello')")
print(f"MD5: {cursor.fetchone()[0]}")

cursor.execute("SELECT sqrt(16)")
print(f"平方根: {cursor.fetchone()[0]}")

cursor.execute("SELECT power(2, 10)")
print(f"2的10次方: {cursor.fetchone()[0]}")

conn.close()
```

### 创建聚合函数

```python
import sqlite3

class Median:
    """计算中位数的聚合函数"""
    def __init__(self):
        self.values = []

    def step(self, value):
        """每行数据调用一次"""
        if value is not None:
            self.values.append(value)

    def finalize(self):
        """所有数据处理完毕后调用"""
        if not self.values:
            return None
        sorted_values = sorted(self.values)
        n = len(sorted_values)
        if n % 2 == 0:
            return (sorted_values[n//2 - 1] + sorted_values[n//2]) / 2
        return sorted_values[n//2]

conn = sqlite3.connect(':memory:')
conn.create_aggregate('median', 1, Median)

cursor = conn.cursor()
cursor.execute('CREATE TABLE scores (student TEXT, score INTEGER)')
cursor.executemany('INSERT INTO scores VALUES (?, ?)', [
    ('Alice', 85),
    ('Bob', 90),
    ('Charlie', 78),
    ('Diana', 92),
    ('Eve', 88),
])

cursor.execute('SELECT median(score) FROM scores')
print(f"中位数分数: {cursor.fetchone()[0]}")  # 88.0

conn.close()
```

### 创建排序规则

```python
import sqlite3

def chinese_collation(str1, str2):
    """中文拼音排序"""
    try:
        import pypinyin
        pinyin1 = pypinyin.lazy_pinyin(str1)
        pinyin2 = pypinyin.lazy_pinyin(str2)
        if pinyin1 < pinyin2:
            return -1
        elif pinyin1 > pinyin2:
            return 1
        return 0
    except ImportError:
        # 如果没有 pypinyin，使用默认比较
        if str1 < str2:
            return -1
        elif str1 > str2:
            return 1
        return 0

conn = sqlite3.connect(':memory:')
conn.create_collation('CHINESE', chinese_collation)

cursor = conn.cursor()
cursor.execute('CREATE TABLE names (name TEXT)')
cursor.executemany('INSERT INTO names VALUES (?)', [
    ('张三',),
    ('李四',),
    ('王五',),
    ('赵六',),
])

# 使用自定义排序规则
cursor.execute('SELECT * FROM names ORDER BY name COLLATE CHINESE')
print("拼音顺序:", [row[0] for row in cursor.fetchall()])

conn.close()
```

### 备份数据库

```python
import sqlite3

# 创建源数据库
source = sqlite3.connect(':memory:')
source_cursor = source.cursor()
source_cursor.execute('CREATE TABLE data (id INTEGER, value TEXT)')
source_cursor.executemany('INSERT INTO data VALUES (?, ?)', [
    (1, 'one'),
    (2, 'two'),
    (3, 'three'),
])
source.commit()

# 备份到文件
def backup_to_file(source_conn, backup_path):
    """备份数据库到文件"""
    backup = sqlite3.connect(backup_path)
    source_conn.backup(backup)
    backup.close()
    print(f"数据库已备份到: {backup_path}")

# 备份到另一个内存数据库
def backup_to_memory(source_conn):
    """备份数据库到内存"""
    backup = sqlite3.connect(':memory:')
    source_conn.backup(backup)
    return backup

# 执行备份
# backup_to_file(source, 'backup.db')

backup_memory = backup_to_memory(source)
backup_cursor = backup_memory.cursor()
backup_cursor.execute('SELECT * FROM data')
print("备份的数据:", backup_cursor.fetchall())

source.close()
backup_memory.close()
```

---

## 性能优化

### 批量操作优化

```python
import sqlite3
import time

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()
cursor.execute('CREATE TABLE benchmark (id INTEGER, value TEXT)')

# 准备测试数据
data = [(i, f'value_{i}') for i in range(10000)]

# 方法1：逐条插入（最慢）
start = time.time()
for item in data:
    cursor.execute('INSERT INTO benchmark VALUES (?, ?)', item)
conn.commit()
print(f"逐条插入: {time.time() - start:.4f} 秒")

# 清空表
cursor.execute('DELETE FROM benchmark')

# 方法2：使用 executemany（较快）
start = time.time()
cursor.executemany('INSERT INTO benchmark VALUES (?, ?)', data)
conn.commit()
print(f"executemany: {time.time() - start:.4f} 秒")

# 清空表
cursor.execute('DELETE FROM benchmark')

# 方法3：使用事务 + executemany（最快）
start = time.time()
cursor.execute('BEGIN TRANSACTION')
cursor.executemany('INSERT INTO benchmark VALUES (?, ?)', data)
cursor.execute('COMMIT')
print(f"事务 + executemany: {time.time() - start:.4f} 秒")

conn.close()
```

### 使用索引

```python
import sqlite3
import time

conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建表并插入大量数据
cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        email TEXT,
        age INTEGER
    )
''')

# 插入10万条测试数据
import random
import string

def random_string(length):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

data = [
    (i, random_string(10), f'{random_string(8)}@example.com', random.randint(18, 80))
    for i in range(100000)
]
cursor.executemany('INSERT INTO users VALUES (?, ?, ?, ?)', data)
conn.commit()

# 无索引查询
start = time.time()
cursor.execute("SELECT * FROM users WHERE username = 'testuser'")
cursor.fetchall()
print(f"无索引查询: {time.time() - start:.4f} 秒")

# 创建索引
cursor.execute('CREATE INDEX idx_username ON users(username)')
conn.commit()

# 有索引查询
start = time.time()
cursor.execute("SELECT * FROM users WHERE username = 'testuser'")
cursor.fetchall()
print(f"有索引查询: {time.time() - start:.4f} 秒")

# 查看查询计划
cursor.execute("EXPLAIN QUERY PLAN SELECT * FROM users WHERE username = 'testuser'")
print("查询计划:", cursor.fetchall())

conn.close()
```

### PRAGMA 优化设置

```python
import sqlite3

conn = sqlite3.connect('optimized.db')
cursor = conn.cursor()

# 常用的 PRAGMA 优化设置

# 日志模式（WAL 模式提高并发性能）
cursor.execute('PRAGMA journal_mode = WAL')

# 同步模式（NORMAL 在大多数情况下足够安全）
cursor.execute('PRAGMA synchronous = NORMAL')

# 缓存大小（负数表示 KB，正数表示页数）
cursor.execute('PRAGMA cache_size = -64000')  # 64MB 缓存

# 临时存储位置
cursor.execute('PRAGMA temp_store = MEMORY')

# 内存映射大小
cursor.execute('PRAGMA mmap_size = 268435456')  # 256MB

# 查看当前设置
cursor.execute('PRAGMA journal_mode')
print(f"日志模式: {cursor.fetchone()[0]}")

cursor.execute('PRAGMA synchronous')
print(f"同步模式: {cursor.fetchone()[0]}")

cursor.execute('PRAGMA cache_size')
print(f"缓存大小: {cursor.fetchone()[0]}")

conn.close()

# 清理测试文件
import os
for f in ['optimized.db', 'optimized.db-shm', 'optimized.db-wal']:
    if os.path.exists(f):
        os.remove(f)
```

---

## 完整示例：任务管理系统

```python
import sqlite3
from datetime import datetime
from contextlib import contextmanager

class TaskManager:
    """简单的任务管理系统"""

    def __init__(self, db_path='tasks.db'):
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def _get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        """初始化数据库表"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 1,
                    due_date TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_status ON tasks(status)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_priority ON tasks(priority)
            ''')
            conn.commit()

    def add_task(self, title, description=None, priority=1, due_date=None):
        """添加新任务"""
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tasks (title, description, priority, due_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (title, description, priority, due_date, now, now))
            conn.commit()
            return cursor.lastrowid

    def get_task(self, task_id):
        """获取单个任务"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_all_tasks(self, status=None, order_by='priority DESC'):
        """获取所有任务"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute(
                    f'SELECT * FROM tasks WHERE status = ? ORDER BY {order_by}',
                    (status,)
                )
            else:
                cursor.execute(f'SELECT * FROM tasks ORDER BY {order_by}')
            return [dict(row) for row in cursor.fetchall()]

    def update_task(self, task_id, **kwargs):
        """更新任务"""
        allowed_fields = {'title', 'description', 'status', 'priority', 'due_date'}
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}

        if not updates:
            return False

        updates['updated_at'] = datetime.now().isoformat()

        set_clause = ', '.join(f'{k} = ?' for k in updates.keys())
        values = list(updates.values()) + [task_id]

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f'UPDATE tasks SET {set_clause} WHERE id = ?',
                values
            )
            conn.commit()
            return cursor.rowcount > 0

    def complete_task(self, task_id):
        """完成任务"""
        return self.update_task(task_id, status='completed')

    def delete_task(self, task_id):
        """删除任务"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
            conn.commit()
            return cursor.rowcount > 0

    def search_tasks(self, keyword):
        """搜索任务"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM tasks
                WHERE title LIKE ? OR description LIKE ?
                ORDER BY priority DESC
            ''', (f'%{keyword}%', f'%{keyword}%'))
            return [dict(row) for row in cursor.fetchall()]

    def get_statistics(self):
        """获取任务统计"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT
                    status,
                    COUNT(*) as count,
                    AVG(priority) as avg_priority
                FROM tasks
                GROUP BY status
            ''')
            return [dict(row) for row in cursor.fetchall()]


# 使用示例
if __name__ == '__main__':
    # 使用内存数据库进行测试
    manager = TaskManager(':memory:')

    # 添加任务
    task1_id = manager.add_task(
        '学习 Python sqlite3',
        '掌握数据库操作基础',
        priority=3,
        due_date='2024-12-31'
    )
    print(f"创建任务 ID: {task1_id}")

    task2_id = manager.add_task(
        '完成项目文档',
        '编写 API 文档和使用说明',
        priority=2
    )

    task3_id = manager.add_task(
        '代码审查',
        '审查团队成员的 PR',
        priority=1
    )

    # 获取所有任务
    print("\n所有任务:")
    for task in manager.get_all_tasks():
        print(f"  [{task['id']}] {task['title']} (优先级: {task['priority']}, 状态: {task['status']})")

    # 完成任务
    manager.complete_task(task1_id)
    print(f"\n任务 {task1_id} 已完成")

    # 搜索任务
    print("\n搜索 '文档':")
    for task in manager.search_tasks('文档'):
        print(f"  [{task['id']}] {task['title']}")

    # 获取统计
    print("\n任务统计:")
    for stat in manager.get_statistics():
        print(f"  {stat['status']}: {stat['count']} 个任务, 平均优先级: {stat['avg_priority']:.1f}")
```

---

## 最佳实践

### 始终使用参数化查询

```python
# 正确做法
cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))

# 错误做法（SQL 注入风险）
cursor.execute(f'SELECT * FROM users WHERE id = {user_id}')
```

### 使用上下文管理器

```python
# 推荐：自动管理连接和事务
with sqlite3.connect('example.db') as conn:
    cursor = conn.cursor()
    # 执行操作...
```

### 正确处理事务

```python
try:
    cursor.execute('BEGIN TRANSACTION')
    # 多个操作...
    cursor.execute('COMMIT')
except Exception:
    cursor.execute('ROLLBACK')
    raise
```

### 为常用查询创建索引

```python
cursor.execute('CREATE INDEX idx_email ON users(email)')
cursor.execute('CREATE INDEX idx_status_date ON orders(status, order_date)')
```

### 使用合适的 Row 工厂

```python
conn.row_factory = sqlite3.Row  # 支持列名访问
```

### 批量操作使用 executemany

```python
# 比循环调用 execute 更高效
cursor.executemany('INSERT INTO table VALUES (?, ?)', data_list)
```

### 关闭不再使用的连接

```python
conn.close()
# 或使用 with 语句自动关闭
```

---

## 常见问题

### 数据库被锁定

```python
# 增加超时时间
conn = sqlite3.connect('example.db', timeout=30.0)

# 使用 WAL 模式提高并发
cursor.execute('PRAGMA journal_mode = WAL')
```

### 多线程访问

```python
# 方法1：每个线程创建自己的连接
import threading

def worker():
    conn = sqlite3.connect('example.db')
    # 操作...
    conn.close()

# 方法2：使用 check_same_thread=False（需要自行确保线程安全）
conn = sqlite3.connect('example.db', check_same_thread=False)
```

### 日期时间处理

```python
# 启用日期时间自动转换
conn = sqlite3.connect(
    'example.db',
    detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
)
```

---

## 扩展阅读

- [Python 官方文档 - sqlite3](https://docs.python.org/3/library/sqlite3.html)
- [SQLite 官方网站](https://www.sqlite.org/)
- [SQLite SQL 语法参考](https://www.sqlite.org/lang.html)
- [SQLAlchemy](https://www.sqlalchemy.org/) - 更强大的 Python ORM 库
