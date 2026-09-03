---
title: 正则表达式
description: Python 正则表达式完全指南，re 模块、模式匹配和文本处理
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - 正则表达式
  - re 模块
  - 文本处理
status: imported
origin: old/src/content/docs/python/regex.zh.md
divergence: 0.307
issues: []
legacy:
  category: Python
  subcategory: Standard Library
  order: 17
  lastUpdated: 2026-01-07
---

正则表达式（regex）是模式匹配和文本操作的强大工具。Python 的 `re` 模块提供了对正则表达式的全面支持，使开发者能够精确高效地搜索、匹配、提取和转换文本。

## re 模块简介

`re` 模块是 Python 用于处理正则表达式的内置库。使用前需要导入，它提供了模式匹配、搜索、分割和替换的函数。

```python
import re

# 基本模式匹配示例
text = "Python is powerful and Python is popular"
pattern = r"Python"

# 查找所有匹配
matches = re.findall(pattern, text)
print(matches)  # 输出: ['Python', 'Python']

# 检查模式是否存在于字符串中的任何位置
if re.search(pattern, text):
    print("找到模式!")
```

### 正则表达式中的原始字符串

始终对正则表达式模式使用原始字符串（以 `r` 为前缀）。原始字符串将反斜杠视为字面字符，防止与 Python 的字符串转义序列冲突。

```python
import re

# 不使用原始字符串 - 有问题
pattern1 = "\\d+"  # 必须转义反斜杠

# 使用原始字符串 - 更简洁，推荐使用
pattern2 = r"\d+"  # 反斜杠是字面量

# 两个模式是等效的
text = "Order 12345"
print(re.findall(pattern1, text))  # ['12345']
print(re.findall(pattern2, text))  # ['12345']

# 对于复杂模式，原始字符串是必需的
# 不使用原始字符串:
complex_pattern1 = "\\b\\w+\\s+\\w+\\b"
# 使用原始字符串:
complex_pattern2 = r"\b\w+\s+\w+\b"
```

## 模式语法参考

理解模式语法是有效使用正则表达式的基础。

### 字符类

```python
import re

text = "Contact: user@example.com, Phone: 555-123-4567"

# \d - 匹配任何数字 (0-9)
digits = re.findall(r"\d", text)
print(digits)  # ['5', '5', '5', '1', '2', '3', '4', '5', '6', '7']

# \D - 匹配任何非数字
non_digits = re.findall(r"\D+", text)
print(non_digits)  # ['Contact: user@example.com, Phone: ', '-', '-']

# \w - 匹配单词字符 (a-z, A-Z, 0-9, _)
words = re.findall(r"\w+", text)
print(words)  # ['Contact', 'user', 'example', 'com', 'Phone', '555', '123', '4567']

# \W - 匹配非单词字符
non_words = re.findall(r"\W+", text)
print(non_words)  # [': ', '@', '.', ', ', ': ', '-', '-']

# \s - 匹配空白字符（空格、制表符、换行符）
whitespace = re.findall(r"\s", text)
print(len(whitespace))  # 3

# \S - 匹配非空白字符
non_whitespace = re.findall(r"\S+", text)
print(non_whitespace)  # ['Contact:', 'user@example.com,', 'Phone:', '555-123-4567']
```

### 自定义字符集

```python
import re

text = "The quick brown fox jumps over 42 lazy dogs at 3pm"

# [abc] - 匹配集合中的任何字符
vowels = re.findall(r"[aeiou]", text)
print(vowels)  # ['e', 'u', 'i', 'o', 'o', 'u', 'o', 'e', 'a', 'o']

# [^abc] - 匹配不在集合中的任何字符
non_vowels = re.findall(r"[^aeiou\s]+", text)

# [a-z] - 匹配任何小写字母
lowercase = re.findall(r"[a-z]+", text)

# [A-Za-z] - 匹配任何字母（不区分大小写）
letters = re.findall(r"[A-Za-z]+", text)

# [0-9] - 等同于 \d
numbers = re.findall(r"[0-9]+", text)
print(numbers)  # ['42', '3']
```

### 量词

```python
import re

text = "aaa ab abbb a123 12345"

# * - 匹配 0 个或更多
pattern_star = re.findall(r"ab*", text)
print(pattern_star)  # ['a', 'a', 'a', 'a', 'ab', 'abbb', 'a']

# + - 匹配 1 个或更多
pattern_plus = re.findall(r"ab+", text)
print(pattern_plus)  # ['ab', 'abbb']

# ? - 匹配 0 个或 1 个
pattern_question = re.findall(r"ab?", text)
print(pattern_question)  # ['a', 'a', 'a', 'a', 'ab', 'ab', 'a']

# {n} - 精确匹配 n 个
pattern_exact = re.findall(r"\d{3}", text)
print(pattern_exact)  # ['123', '123']

# {n,} - 匹配 n 个或更多
pattern_min = re.findall(r"\d{3,}", text)
print(pattern_min)  # ['123', '12345']

# {n,m} - 匹配 n 到 m 个
pattern_range = re.findall(r"\d{2,4}", text)
print(pattern_range)  # ['123', '1234']

# 贪婪 vs 非贪婪（惰性）量词
html = "<div>content</div><span>more</span>"

# 贪婪（默认）- 匹配尽可能多
greedy = re.findall(r"<.*>", html)
print(greedy)  # ['<div>content</div><span>more</span>']

# 非贪婪（惰性）- 匹配尽可能少
lazy = re.findall(r"<.*?>", html)
print(lazy)  # ['<div>', '</div>', '<span>', '</span>']
```

### 锚点和边界

```python
import re

text = "Python programming in Python"
multiline_text = """Line 1: Python
Line 2: Java
Line 3: Python"""

# ^ - 匹配字符串开头（或使用 MULTILINE 标志时匹配行首）
start_match = re.findall(r"^Python", text)
print(start_match)  # ['Python']

# $ - 匹配字符串结尾（或使用 MULTILINE 标志时匹配行尾）
end_match = re.findall(r"Python$", text)
print(end_match)  # ['Python']

# \b - 匹配单词边界
word_boundary = re.findall(r"\bPython\b", text)
print(word_boundary)  # ['Python', 'Python']

# 使用 MULTILINE 标志的锚点
lines_starting_with_python = re.findall(r"^Line.*Python$", multiline_text, re.MULTILINE)
print(lines_starting_with_python)  # ['Line 1: Python', 'Line 3: Python']
```

### 特殊字符和转义

```python
import re

# 特殊的正则表达式字符: . ^ $ * + ? { } [ ] \ | ( )
text = "Price: $19.99 (50% off)"

# . 匹配除换行符外的任何字符
any_char = re.findall(r"1.", text)
print(any_char)  # ['19']

# 要匹配字面特殊字符，用反斜杠转义
price = re.findall(r"\$\d+\.\d+", text)
print(price)  # ['$19.99']

# 使用 re.escape() 处理用户提供的模式
user_input = "$19.99"
safe_pattern = re.escape(user_input)
print(safe_pattern)  # \$19\.99

# | 用于交替（或）
text2 = "I like cats and dogs but not rats"
animals = re.findall(r"cats|dogs|birds", text2)
print(animals)  # ['cats', 'dogs']
```

## 模式匹配函数

`re` 模块提供了几个函数用于不同的匹配场景。

### match() - 在开头匹配

`match()` 函数检查模式是否在字符串的最开始匹配。

```python
import re

# match() 只检查字符串开头
text = "Python 3.11 is the latest version"

result = re.match(r"Python", text)
if result:
    print(f"找到: {result.group()}")  # 找到: Python
    print(f"范围: {result.span()}")    # 范围: (0, 6)

# 如果模式不在开头，match() 失败
result = re.match(r"3.11", text)
print(result)  # None

# 实际示例：验证输入格式
def validate_id(id_string):
    """验证 ID 格式：2-3 个大写字母后跟 4-6 个数字。"""
    pattern = r"^[A-Z]{2,3}\d{4,6}$"
    return re.match(pattern, id_string) is not None

print(validate_id("AB1234"))    # True
print(validate_id("XYZ123456")) # True
print(validate_id("A12345"))    # False - 只有一个字母
```

### search() - 在任意位置搜索

`search()` 函数扫描整个字符串，查找第一个匹配模式的位置。

```python
import re

text = "The error occurred at line 42 in module.py"

# search() 在字符串中的任何位置查找模式
result = re.search(r"\d+", text)
if result:
    print(f"找到: {result.group()}")  # 找到: 42
    print(f"开始: {result.start()}")  # 开始: 27
    print(f"结束: {result.end()}")    # 结束: 29
    print(f"范围: {result.span()}")   # 范围: (27, 29)

# 提取多条信息
log_entry = "2024-01-15 14:30:45 [ERROR] Database connection timeout"

timestamp = re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", log_entry)
level = re.search(r"\[(ERROR|WARNING|INFO|DEBUG)\]", log_entry)
message = re.search(r"\] (.+)$", log_entry)

if all([timestamp, level, message]):
    print(f"时间: {timestamp.group()}")     # 时间: 2024-01-15 14:30:45
    print(f"级别: {level.group(1)}")        # 级别: ERROR
    print(f"消息: {message.group(1)}")      # 消息: Database connection timeout
```

### findall() - 查找所有匹配

`findall()` 函数返回所有非重叠匹配的字符串列表。

```python
import re

text = """
联系方式:
Email: john.doe@example.com, jane.smith@company.org
Phone: 555-123-4567, 555-987-6543
Website: https://example.com
"""

# 查找所有邮箱地址
emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", text)
print(emails)  # ['john.doe@example.com', 'jane.smith@company.org']

# 查找所有电话号码
phones = re.findall(r"\d{3}-\d{3}-\d{4}", text)
print(phones)  # ['555-123-4567', '555-987-6543']

# 当模式有分组时，findall 返回分组内容
text2 = "John: 25 years, Jane: 30 years, Bob: 22 years"
ages = re.findall(r"(\w+): (\d+) years", text2)
print(ages)  # [('John', '25'), ('Jane', '30'), ('Bob', '22')]
```

### finditer() - 匹配对象迭代器

`finditer()` 函数返回匹配对象的迭代器，提供每个匹配的详细信息。

```python
import re

text = "Error at line 10, Warning at line 25, Error at line 42"
pattern = r"(Error|Warning) at line (\d+)"

# finditer 提供带完整详情的匹配对象
for match in re.finditer(pattern, text):
    print(f"匹配: {match.group()}")
    print(f"  类型: {match.group(1)}")
    print(f"  行号: {match.group(2)}")
    print(f"  位置: {match.start()}-{match.end()}")
    print()
```

### fullmatch() - 匹配整个字符串

`fullmatch()` 函数检查整个字符串是否匹配模式。

```python
import re

# fullmatch 要求模式匹配完整字符串
pattern = r"\d{3}-\d{4}"

# 部分匹配失败
result1 = re.fullmatch(pattern, "Phone: 555-1234")
print(result1)  # None

# 完整匹配成功
result2 = re.fullmatch(pattern, "555-1234")
print(result2.group() if result2 else None)  # 555-1234

# 实际示例：输入验证
def validate_date(date_string):
    """验证 YYYY-MM-DD 格式的日期。"""
    pattern = r"\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])"
    return re.fullmatch(pattern, date_string) is not None

print(validate_date("2024-01-15"))  # True
print(validate_date("2024-13-01"))  # False - 无效月份
```

## 分组和捕获

分组允许你提取匹配的特定部分并组织复杂模式。

### 基本分组

```python
import re

# 括号创建捕获组
text = "John Smith: john.smith@example.com"
pattern = r"(\w+)\s+(\w+):\s+([\w\.-]+@[\w\.-]+)"

match = re.search(pattern, text)
if match:
    print(f"完整匹配: {match.group(0)}")   # John Smith: john.smith@example.com
    print(f"名字: {match.group(1)}")       # John
    print(f"姓氏: {match.group(2)}")       # Smith
    print(f"邮箱: {match.group(3)}")       # john.smith@example.com
    print(f"所有分组: {match.groups()}")   # ('John', 'Smith', 'john.smith@example.com')
```

### 命名分组

命名分组使用 `(?P<name>...)` 语法，使模式更易读和维护。

```python
import re

# 使用 (?P<name>pattern) 命名分组
log_entry = "2024-01-15 10:30:45 [ERROR] Connection failed: timeout"
pattern = r"""
    (?P<date>\d{4}-\d{2}-\d{2})
    \s+
    (?P<time>\d{2}:\d{2}:\d{2})
    \s+
    \[(?P<level>\w+)\]
    \s+
    (?P<message>.+)
"""

match = re.search(pattern, log_entry, re.VERBOSE)
if match:
    print(f"日期: {match.group('date')}")      # 日期: 2024-01-15
    print(f"时间: {match.group('time')}")      # 时间: 10:30:45
    print(f"级别: {match.group('level')}")     # 级别: ERROR
    print(f"消息: {match.group('message')}")   # 消息: Connection failed: timeout

    # 将所有命名分组作为字典获取
    print(match.groupdict())
```

### 非捕获组

非捕获组 `(?:...)` 分组模式但不创建捕获组，提高性能并简化结果。

```python
import re

# 捕获组 - 包含在结果中
text = "http://example.com and https://secure.org"
pattern_capturing = r"(http|https)://(\w+\.\w+)"
matches = re.findall(pattern_capturing, text)
print(matches)  # [('http', 'example.com'), ('https', 'secure.org')]

# 非捕获组 - 从结果中排除
pattern_non_capturing = r"(?:http|https)://(\w+\.\w+)"
matches = re.findall(pattern_non_capturing, text)
print(matches)  # ['example.com', 'secure.org']
```

### 反向引用

反向引用允许匹配与先前捕获组相同的文本。

```python
import re

# \1, \2 等按编号引用捕获组
# 查找重复的单词
text = "The the quick brown fox fox jumps"
pattern = r"\b(\w+)\s+\1\b"
repeated = re.findall(pattern, text, re.IGNORECASE)
print(repeated)  # ['The', 'fox']

# 查找匹配的 HTML 标签
html = "<div>Content</div> <span>Text</span>"
pattern = r"<(\w+)>.*?</\1>"
valid_tags = re.findall(pattern, html)
print(valid_tags)  # ['div', 'span']
```

## 替换

`sub()` 和 `subn()` 函数用新文本替换匹配的模式。

### 基本替换 sub()

```python
import re

# 简单字符串替换
text = "I love cats. Cats are amazing!"
result = re.sub(r"cats", "dogs", text, flags=re.IGNORECASE)
print(result)  # I love dogs. dogs are amazing!

# 使用 count 参数限制替换次数
text = "one two one two one two"
result = re.sub(r"one", "1", text, count=2)
print(result)  # 1 two 1 two one two

# 删除不需要的内容
messy_text = "Price:   $50   (discounted)"
clean = re.sub(r"\s+", " ", messy_text)  # 规范化空白
print(clean)  # Price: $50 (discounted)

# 删除 HTML 标签
html_content = "<p>Hello <b>World</b></p>"
plain_text = re.sub(r"<[^>]+>", "", html_content)
print(plain_text)  # Hello World
```

### 在替换中使用分组

```python
import re

# 使用分组引用重排匹配的内容
text = "Smith, John and Doe, Jane"
result = re.sub(r"(\w+), (\w+)", r"\2 \1", text)
print(result)  # John Smith and Jane Doe

# 一致地格式化电话号码
phones = "5551234567, 555-123-4567, (555) 123 4567"
pattern = r"\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})"
formatted = re.sub(pattern, r"(\1) \2-\3", phones)
print(formatted)  # (555) 123-4567, (555) 123-4567, (555) 123-4567

# 使用 \g<name> 的命名分组引用
date_text = "Today is 01/15/2024"
pattern = r"(?P<month>\d{2})/(?P<day>\d{2})/(?P<year>\d{4})"
iso_format = re.sub(pattern, r"\g<year>-\g<month>-\g<day>", date_text)
print(iso_format)  # Today is 2024-01-15
```

### 基于函数的替换

使用函数进行替换可以实现动态、复杂的转换。

```python
import re

# 替换函数接收匹配对象
def double_numbers(match):
    number = int(match.group())
    return str(number * 2)

text = "I have 3 cats and 5 dogs"
result = re.sub(r"\d+", double_numbers, text)
print(result)  # I have 6 cats and 10 dogs

# 温度转换
def celsius_to_fahrenheit(match):
    celsius = float(match.group(1))
    fahrenheit = (celsius * 9/5) + 32
    return f"{fahrenheit:.1f}F"

temps = "Today: 20C, Tomorrow: 25C, Next week: 15C"
converted = re.sub(r"(\d+)C", celsius_to_fahrenheit, temps)
print(converted)  # Today: 68.0F, Tomorrow: 77.0F, Next week: 59.0F
```

## 正则表达式标志

标志修改模式的解释和匹配方式。

### 常用标志

```python
import re

text = """Hello World
hello python
HELLO REGEX"""

# re.IGNORECASE (re.I) - 不区分大小写匹配
matches = re.findall(r"hello", text, re.IGNORECASE)
print(matches)  # ['Hello', 'hello', 'HELLO']

# re.MULTILINE (re.M) - ^ 和 $ 在行边界匹配
matches = re.findall(r"^hello", text, re.MULTILINE | re.IGNORECASE)
print(matches)  # ['Hello', 'hello', 'HELLO']

# re.DOTALL (re.S) - . 匹配换行符
pattern_dotall = re.findall(r"World.hello", text, re.IGNORECASE | re.DOTALL)
print(pattern_dotall)  # ['World\nhello']
```

### re.VERBOSE (re.X) 用于可读模式

VERBOSE 标志允许编写带注释的多行模式。

```python
import re

# 不使用 VERBOSE 的复杂模式 - 难以阅读
email_pattern_compact = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

# 使用 VERBOSE 的相同模式 - 更易读
email_pattern_verbose = re.compile(r"""
    ^                       # 字符串开头
    [a-zA-Z0-9._%+-]+       # 本地部分：字母、数字和特殊字符
    @                       # 字面 @ 符号
    [a-zA-Z0-9.-]+          # 域名
    \.                      # 字面点
    [a-zA-Z]{2,}            # TLD（至少 2 个字母）
    $                       # 字符串结尾
""", re.VERBOSE)
```

## 编译模式

编译模式可以提高多次使用同一模式时的性能。

```python
import re

# 编译模式以重用
email_pattern = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")

# 使用编译模式的方法
text = "Contact: user@example.com or admin@site.org"

# 所有 re 模块函数都可作为方法使用
print(email_pattern.findall(text))  # ['user@example.com', 'admin@site.org']
print(email_pattern.search(text).group())  # user@example.com

# 带标志编译
word_pattern = re.compile(r"\b[a-z]+\b", re.IGNORECASE)
print(word_pattern.findall("Hello World 123"))  # ['Hello', 'World']
```

## 前瞻和后顾断言

前瞻和后顾是零宽度断言，匹配位置而不消耗字符。

### 正向前瞻 (?=...)

正向前瞻在前面的模式匹配时匹配，但不包含在匹配中。

```python
import re

# 匹配后跟特定模式的单词
text = "cat123 dog456 cat789 bird"

# 查找后跟数字的单词
pattern = r"\w+(?=\d)"
matches = re.findall(pattern, text)
print(matches)  # ['cat', 'dog', 'cat']

# 密码验证的多个前瞻
def validate_password(password):
    """
    密码必须有:
    - 至少 8 个字符
    - 至少一个大写字母
    - 至少一个小写字母
    - 至少一个数字
    - 至少一个特殊字符
    """
    pattern = r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$"
    return re.match(pattern, password) is not None

print(validate_password("weak"))           # False
print(validate_password("StrongPass1!"))   # True
```

### 负向前瞻 (?!...)

负向前瞻在前面的模式不匹配时匹配。

```python
import re

# 匹配不后跟特定模式的单词
text = "cat123 dog bird456 fish"

# 查找不后跟数字的单词
pattern = r"\b[a-zA-Z]+\b(?!\d)"
matches = re.findall(pattern, text)
print(matches)  # ['dog', 'fish']
```

### 正向后顾 (?<=...)

正向后顾在后面的模式匹配时匹配，但不包含在匹配中。

```python
import re

# 匹配特定模式之后的内容
text = "Price: $100, Cost: $200, Value: $300"

# 查找美元符号后的金额
pattern = r"(?<=\$)\d+"
amounts = re.findall(pattern, text)
print(amounts)  # ['100', '200', '300']

# 从邮箱提取域名
emails = "john@example.com, jane@test.org"
pattern = r"(?<=@)[\w\.]+"
domains = re.findall(pattern, emails)
print(domains)  # ['example.com', 'test.org']
```

### 负向后顾 (?<!...)

负向后顾在后面的模式不匹配时匹配。

```python
import re

# 匹配不在特定文本之前的模式
text = "USD100 EUR200 GBP300 100"

# 查找不在货币代码之前的数字
pattern = r"(?<![A-Z]{3})\b\d+\b"
matches = re.findall(pattern, text)
print(matches)  # ['100']（只有独立的数字）
```

## 分割字符串

`split()` 函数根据模式匹配分割字符串。

```python
import re

# 按多个分隔符分割
text = "apple,banana;orange:grape|melon"
items = re.split(r"[,;:|]", text)
print(items)  # ['apple', 'banana', 'orange', 'grape', 'melon']

# 按空白分割（处理多个空格、制表符、换行符）
text = "one  two\t\tthree\n\nfour"
words = re.split(r"\s+", text)
print(words)  # ['one', 'two', 'three', 'four']

# 使用 maxsplit 限制分割次数
text = "a:b:c:d:e"
parts = re.split(r":", text, maxsplit=2)
print(parts)  # ['a', 'b', 'c:d:e']

# 使用捕获组保留分隔符
text = "Hello123World456Python"
parts = re.split(r"(\d+)", text)
print(parts)  # ['Hello', '123', 'World', '456', 'Python']
```

## 实用示例

### 邮箱验证和提取

```python
import re

def validate_email(email):
    """全面的邮箱验证。"""
    pattern = re.compile(r"""
        ^                           # 开头
        (?!.*\.\.)                  # 不允许连续点
        [a-zA-Z0-9]                 # 必须以字母数字开头
        [a-zA-Z0-9._%+-]{0,63}      # 本地部分（最多 64 个字符）
        @                           # @ 符号
        (?!-)                       # 域名不能以连字符开头
        [a-zA-Z0-9-]{1,63}          # 域名
        (?<!-)                      # 域名不能以连字符结尾
        (?:\.[a-zA-Z]{2,})+         # TLD
        $                           # 结尾
    """, re.VERBOSE | re.IGNORECASE)

    return pattern.match(email) is not None

def extract_emails(text):
    """从文本中提取所有邮箱地址。"""
    pattern = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
    return re.findall(pattern, text)
```

### 日志文件解析器

```python
import re
from datetime import datetime

def parse_log_file(log_content):
    """解析日志条目并返回结构化数据。"""

    pattern = re.compile(r"""
        (?P<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})  # 时间戳
        \s+
        \[(?P<level>DEBUG|INFO|WARNING|ERROR|CRITICAL)\]      # 日志级别
        \s+
        (?P<source>[\w\.]+):                                   # 源模块
        \s+
        (?P<message>.+)                                        # 消息
    """, re.VERBOSE)

    entries = []
    for line in log_content.strip().split('\n'):
        match = pattern.match(line)
        if match:
            entries.append(match.groupdict())

    return entries
```

## 最佳实践

1. **始终使用原始字符串** (`r"pattern"`) 用于正则表达式模式
2. **对复杂模式使用 VERBOSE 标志**提高可读性
3. **预编译频繁使用的模式**以提高性能
4. **使用命名分组**使代码更自文档化
5. **注意贪婪 vs 非贪婪量词**避免过度匹配
6. **使用 re.escape()** 处理用户提供的模式
7. **充分测试边界情况**确保模式正确工作
8. **优先使用具体模式**而不是过于宽泛的模式

## 总结

Python 的 `re` 模块提供了强大的正则表达式支持，用于文本处理和模式匹配。关键函数包括：

- `match()` - 在字符串开头匹配
- `search()` - 在字符串任意位置搜索
- `findall()` - 查找所有匹配
- `finditer()` - 返回匹配对象迭代器
- `fullmatch()` - 匹配整个字符串
- `sub()` - 替换匹配的模式
- `split()` - 按模式分割字符串
- `compile()` - 编译模式以重用

掌握正则表达式可以大大提高文本处理效率，是每个 Python 开发者的必备技能。
