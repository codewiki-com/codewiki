---
title: difflib模块
description: Python difflib模块详解，用于序列比较、生成diff结果、匹配相似度分析
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - difflib
  - 序列比较
  - 文本diff
  - 相似度
status: imported
origin: old/src/content/docs/python/difflib.zh.md
divergence: 0.279
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: 标准库
  order: 45
  lastUpdated: 2026-01-07
---

`difflib` 是 Python 标准库中用于比较序列（如列表、字符串）的模块。它提供了强大的工具来计算两个序列之间的差异，生成易于阅读的 diff 报告，以及评估序列的相似度。这对文本比较、版本控制系统、代码审查和数据验证等场景非常有用。

## 概念解释

### difflib 的核心概念

1. **序列比较**：对两个序列（通常是字符串或列表）进行逐个元素的对比，找出相同、插入、删除、替换等操作

2. **最长公共子序列（LCS）**：difflib 使用高效的算法找到两个序列中最长的相同子序列，作为基础来确定差异

3. **匹配块**：连续相同的元素块，diff 算法会优先匹配这些块以减少输出

4. **相似度比**：0 到 1 之间的浮点数，表示两个序列的相似程度，1.0 表示完全相同

### 常用类和函数

- `SequenceMatcher`：比较一对序列，找出最长的连续匹配子序列
- `Differ`：比较一行一行的文本，生成有 '+' '-' ' ' 等标记的差异报告
- `unified_diff`：生成统一 diff 格式（类似 Git diff）
- `ndiff`：按行生成详细的差异，使用 `?` 标记指出改变位置
- `SequenceMatcher.ratio`：计算相似度比
- `get_close_matches`：找到与给定字符串最接近的匹配项

---

## 核心原理

### SequenceMatcher 的工作原理

`SequenceMatcher` 使用 Gestalt Pattern Matching 算法的变种：

1. **初始化**：接受两个序列和一个"垃圾"过滤函数
2. **找最长匹配**：递归地找到序列中最长的相同子序列
3. **生成匹配块**：返回所有匹配块及其位置信息
4. **计算差异**：基于匹配块推导出 insert、delete、replace 等操作

```python
# 简化的工作流程
# 初始化对象
sm = SequenceMatcher(None, a, b)

# 内部递归找最长匹配
# matching_blocks() 返回所有匹配块

# 基于匹配块生成 opcodes
# opcodes 表示从 a 到 b 需要的操作序列
```

### 时间复杂度

- `SequenceMatcher.ratio()`：O(n*m)，其中 n 和 m 是两个序列的长度
- `get_close_matches()`：O(n*m*l)，n 是序列数量，m 是序列长度，l 是每个元素的复杂度
- 一般来说，对于中等规模的数据非常高效

---

## 核心要点

1. **SequenceMatcher** 是最灵活的工具，适合细粒度的序列比较
2. **Differ** 最适合生成可读的行级差异报告
3. **unified_diff** 和 **ndiff** 生成标准格式的 diff，适合版本控制
4. **ratio** 返回的相似度 (0-1) 可用于模糊匹配和去重
5. **get_close_matches** 快速找到相似的字符串，内置 cutoff 参数控制匹配严格度
6. difflib 支持任何可比较的序列，不限于字符串
7. 大规模数据比较可考虑使用 `junk` 参数优化性能
8. 相似度的定义：2*M / (len(a) + len(b))，M 为匹配的元素数量

---

## 代码示例

### SequenceMatcher - 序列比较

```python
from difflib import SequenceMatcher

# 基础用法
a = "abracadabra"
b = "autocratadabra"

sm = SequenceMatcher(None, a, b)

# 计算相似度
ratio = sm.ratio()
print(f"相似度: {ratio:.2%}")  # 相似度: 76.47%

# 获取匹配块
print("匹配块:")
for block in sm.get_matching_blocks():
    print(f"  a[{block.a}:{block.a+block.size}] = b[{block.b}:{block.b+block.size}] = {a[block.a:block.a+block.size]}")

# 获取 opcodes（操作码）
print("\n操作序列:")
for opcode, i1, i2, j1, j2 in sm.get_opcodes():
    print(f"  {opcode:7} a[{i1}:{i2}] b[{j1}:{j2}] | {repr(a[i1:i2])} -> {repr(b[j1:j2])}")
```

输出：
```
相似度: 76.47%

匹配块:
  a[0:3] = b[2:5] = abr
  a[3:7] = b[8:12] = cada
  a[7:11] = b[13:17] = abra
  a[11:11] = b[15:15] =

操作序列:
  replace a[0:3] b[0:2] | 'abr' -> 'au'
  equal   a[3:7] b[2:6] | 'cada' -> 'cada'
  replace a[7:11] b[6:12] | 'abra' -> 'atada'
  equal   a[11:11] b[12:15] | '' -> 'bra'
```

### Differ - 生成可读的差异报告

```python
from difflib import Differ

text1 = """One apple a day
keeps the doctor away
An apple a day
keeps the health up""".split('\n')

text2 = """Two apples a day
keeps the doctor away
An apple a day
keeps the fitness up""".split('\n')

differ = Differ()
diff = list(differ.compare(text1, text2))

print("差异报告:")
for line in diff:
    print(repr(line))
```

输出：
```
'- One apple a day\n'
'+ Two apples a day\n'
'  keeps the doctor away\n'
'  An apple a day\n'
'- keeps the health up\n'
'?           ------\n'
'+ keeps the fitness up\n'
'?           ++++++\n'
```

### unified_diff - Git 风格的 diff

```python
from difflib import unified_diff

file1_lines = """def hello():
    print("Hello")
    return True
""".split('\n')

file2_lines = """def hello(name):
    print(f"Hello {name}")
    return True
""".split('\n')

# 生成统一 diff
diff = unified_diff(
    file1_lines,
    file2_lines,
    fromfile='old_hello.py',
    tofile='new_hello.py',
    lineterm=''
)

print('\n'.join(diff))
```

输出：
```
--- old_hello.py
+++ new_hello.py
@@ -1,3 +1,3 @@
-def hello():
-    print("Hello")
+def hello(name):
+    print(f"Hello {name}")
     return True
```

### ndiff - 字符级别的差异

```python
from difflib import ndiff

text1 = "The quick brown fox"
text2 = "The quack brown fox"

diff = ndiff(text1.split(), text2.split())

print("字符级差异:")
for line in diff:
    print(line)
```

### get_close_matches - 模糊匹配

```python
from difflib import get_close_matches

words = ["apple", "application", "apply", "appointment", "banana", "branch"]

# 查找相似的单词
query = "apply"
matches = get_close_matches(query, words, n=3, cutoff=0.6)
print(f"'{query}' 的相似词: {matches}")
# 'apply' 的相似词: ['apply', 'apple', 'application']

# 拼写检查示例
misspelled = "aple"
suggestions = get_close_matches(misspelled, words, n=3, cutoff=0.6)
print(f"'{misspelled}' 的建议: {suggestions}")
# 'aple' 的建议: ['apple', 'apply', 'application']
```

### 比较列表而不是字符串

```python
from difflib import SequenceMatcher

list1 = [1, 2, 3, 4, 5]
list2 = [1, 2, 10, 4, 5, 6]

sm = SequenceMatcher(None, list1, list2)

print(f"列表相似度: {sm.ratio():.2%}")

for opcode, i1, i2, j1, j2 in sm.get_opcodes():
    if opcode != 'equal':
        print(f"{opcode}: {list1[i1:i2]} -> {list2[j1:j2]}")
```

---

## 最佳实践

### 为大文本指定 junk 函数优化性能

```python
from difflib import SequenceMatcher

# 忽略空行和注释行可以提高性能
def is_blank_line(x):
    return x.strip() == '' or x.startswith('#')

with open('file1.py') as f1, open('file2.py') as f2:
    lines1 = f1.readlines()
    lines2 = f2.readlines()

sm = SequenceMatcher(is_blank_line, lines1, lines2)
print(f"代码相似度: {sm.ratio():.2%}")
```

### 选择合适的 cutoff 值进行模糊匹配

```python
from difflib import get_close_matches

# cutoff 通常在 0.6-0.8 之间
# 0.6: 相对宽松的匹配，可能包含一些较差的结果
# 0.8: 严格的匹配，只返回高相似度的结果

words = ["Python", "javascript", "Cython", "Jython"]

print("cutoff=0.6:", get_close_matches("python", words, cutoff=0.6))
# cutoff=0.6: ['Python', 'Cython', 'Jython']

print("cutoff=0.8:", get_close_matches("python", words, cutoff=0.8))
# cutoff=0.8: ['Python', 'Cython']
```

### 使用上下文来生成更可读的 diff

```python
from difflib import unified_diff

def generate_diff(old_text, new_text, context_lines=3):
    """生成带上下文的 diff"""
    old_lines = old_text.splitlines(keepends=True)
    new_lines = new_text.splitlines(keepends=True)

    return unified_diff(
        old_lines,
        new_lines,
        fromfile='old',
        tofile='new',
        n=context_lines  # 上下文行数
    )

old = "line1\nline2\nline3\nline4\nline5"
new = "line1\nline2-modified\nline3\nline4\nline5"

for line in generate_diff(old, new):
    print(line, end='')
```

### 批量比较序列时缓存结果

```python
from difflib import SequenceMatcher

def compare_with_cache(sequences):
    """缓存 SequenceMatcher 以提高性能"""
    cache = {}

    for i, seq1 in enumerate(sequences):
        for j, seq2 in enumerate(sequences):
            if i >= j:
                continue

            key = (i, j)
            if key not in cache:
                sm = SequenceMatcher(None, seq1, seq2)
                cache[key] = sm.ratio()

            print(f"seq{i} vs seq{j}: {cache[key]:.2%}")

    return cache

sequences = ["apple", "apply", "append", "application"]
compare_with_cache(sequences)
```

### 为敏感应用验证匹配质量

```python
from difflib import SequenceMatcher, get_close_matches

def safe_fuzzy_match(query, candidates, strict=False):
    """安全的模糊匹配，包含质量检查"""

    if not candidates:
        return None

    # 直接匹配优先
    if query in candidates:
        return query

    # 模糊匹配
    cutoff = 0.95 if strict else 0.6
    matches = get_close_matches(query, candidates, n=1, cutoff=cutoff)

    if matches:
        # 验证匹配质量
        match = matches[0]
        sm = SequenceMatcher(None, query, match)

        if strict and sm.ratio() < 0.9:
            return None

        return match

    return None

# 测试
users = ["alice", "bob", "charlie"]
print(safe_fuzzy_match("alise", users))        # alice
print(safe_fuzzy_match("alise", users, strict=True))  # None (质量不够好)
```

---

## 常见陷阱

### 忽视大小写敏感性

```python
from difflib import get_close_matches

words = ["Apple", "BANANA", "Orange"]

# 错误：大小写完全匹配
print(get_close_matches("apple", words))  # [] 空列表

# 正确：转换为同一大小写
words_lower = [w.lower() for w in words]
matches = get_close_matches("apple", words_lower)
print(words[[words_lower.index(m) for m in matches]])  # ['Apple']
```

### 对大序列使用不当导致性能问题

```python
# 错误：对整个文件进行字符级比较
with open('large_file.txt') as f:
    content = f.read()
sm = SequenceMatcher(None, content, other_content)
# 非常慢！

# 正确：按行比较
with open('large_file.txt') as f:
    lines = f.readlines()
sm = SequenceMatcher(None, lines, other_lines)
```

### 不指定 junk 参数导致不准确的结果

```python
from difflib import SequenceMatcher

# 错误：不忽略空白
code1 = "def foo():\n    pass\n".split('\n')
code2 = "def foo():\n\n    pass\n\n".split('\n')
sm = SequenceMatcher(None, code1, code2)
print(sm.ratio())  # 可能因为空行而降低相似度

# 正确：忽略空白行
def is_blank(line):
    return line.strip() == ''

sm = SequenceMatcher(is_blank, code1, code2)
print(sm.ratio())  # 更准确
```

### 误解相似度的含义

```python
from difflib import SequenceMatcher

# ratio 是基于最长匹配块的
a = "abcdef"
b = "azbzcdf"

sm = SequenceMatcher(None, a, b)
print(f"相似度: {sm.ratio():.2%}")  # 50.00%
# 并非简单地计算相同字符的百分比

# 实际计算：2*M / (len(a) + len(b))
# M = 4 (a, c, d, f)
# 相似度 = 2*4 / (6+7) = 8/13 = 61.54%
```

### 在需要精确匹配时使用 get_close_matches

```python
from difflib import get_close_matches

# 错误：用于精确数据库查询
user_id = "USER123"
db_users = ["USER123", "USER124", "USER234"]

# get_close_matches 会返回所有相似的
matches = get_close_matches(user_id, db_users)
print(matches)  # 可能返回多个

# 正确：如需精确匹配用 in 或 ==
if user_id in db_users:
    print("找到用户")
```

---

## 性能考量

### 时间复杂度分析

```python
from difflib import SequenceMatcher, get_close_matches
import time

# SequenceMatcher 时间复杂度：O(n*m)
# n, m 为序列长度

def benchmark_sequence_matcher(size1, size2):
    """基准测试 SequenceMatcher 性能"""
    seq1 = 'a' * size1
    seq2 = 'b' * size2

    start = time.time()
    sm = SequenceMatcher(None, seq1, seq2)
    ratio = sm.ratio()
    elapsed = time.time() - start

    return elapsed

# 测试不同大小
print("SequenceMatcher 性能:")
for size in [100, 1000, 10000]:
    elapsed = benchmark_sequence_matcher(size, size)
    print(f"  大小 {size}x{size}: {elapsed*1000:.2f}ms")
```

### 优化策略

```python
from difflib import SequenceMatcher

# 使用 junk 参数跳过不重要的元素
def optimize_with_junk(seq1, seq2):
    """使用 junk 参数优化"""
    # 跳过空白和标点
    def is_junk(x):
        return x in ' \t' or x in ',.!?;:'

    sm = SequenceMatcher(is_junk, seq1, seq2)
    return sm.ratio()

# 分块处理大数据
def optimize_large_data(large_seq1, large_seq2, chunk_size=1000):
    """分块比较大序列"""
    ratios = []

    for i in range(0, len(large_seq1), chunk_size):
        chunk1 = large_seq1[i:i+chunk_size]
        chunk2 = large_seq2[i:i+chunk_size]

        sm = SequenceMatcher(None, chunk1, chunk2)
        ratios.append(sm.ratio())

    return sum(ratios) / len(ratios) if ratios else 0

# 使用更高效的相似度计算
def fast_similarity(seq1, seq2):
    """快速相似度计算（牺牲精度）"""
    # 对大序列使用采样
    if len(seq1) > 10000:
        step = len(seq1) // 1000
        seq1 = seq1[::step]
        seq2 = seq2[::step]

    sm = SequenceMatcher(None, seq1, seq2)
    return sm.ratio()
```

### 内存优化

```python
# 避免在内存中加载整个大文件
def compare_large_files(file1, file2):
    """以流的方式比较大文件"""
    from difflib import unified_diff

    with open(file1, 'r') as f1, open(file2, 'r') as f2:
        # 使用生成器避免加载整个文件
        diff = unified_diff(f1, f2)

        # 处理 diff 而不是一次加载到内存
        for line in diff:
            yield line

# 使用
for diff_line in compare_large_files('large_file1.txt', 'large_file2.txt'):
    print(diff_line, end='')
```

---

## 实战场景

### 场景1：文本编辑器的版本比较

```python
from difflib import unified_diff
from datetime import datetime

class DocumentVersionControl:
    """简单的文档版本控制系统"""

    def __init__(self):
        self.versions = []

    def save_version(self, content, message=""):
        """保存文档版本"""
        self.versions.append({
            'content': content,
            'message': message,
            'timestamp': datetime.now(),
            'lines': content.splitlines(keepends=True)
        })

    def compare_versions(self, version_idx1, version_idx2):
        """比较两个版本"""
        v1 = self.versions[version_idx1]
        v2 = self.versions[version_idx2]

        diff = unified_diff(
            v1['lines'],
            v2['lines'],
            fromfile=f"版本 {version_idx1}",
            tofile=f"版本 {version_idx2}"
        )

        return ''.join(diff)

    def find_changes(self):
        """查找最新两个版本的改动"""
        if len(self.versions) < 2:
            return "没有足够的版本进行比较"

        return self.compare_versions(-2, -1)

# 使用
vc = DocumentVersionControl()
vc.save_version("Hello World\nVersion 1", "初始版本")
vc.save_version("Hello Python\nVersion 1.1", "更新内容")
vc.save_version("Hello Python\nVersion 2.0", "大版本更新")

print(vc.find_changes())
```

### 场景2：拼写检查和建议

```python
from difflib import get_close_matches
import json

class SpellChecker:
    """简单的拼写检查器"""

    def __init__(self, dictionary_file):
        """从文件加载词典"""
        try:
            with open(dictionary_file) as f:
                self.words = json.load(f)
        except:
            # 若无文件，使用默认词典
            self.words = [
                "python", "javascript", "programming", "developer",
                "algorithm", "database", "framework", "library"
            ]

    def check_word(self, word):
        """检查单词是否正确"""
        return word.lower() in self.words

    def suggest_corrections(self, word, n=3):
        """建议更正"""
        if self.check_word(word):
            return None

        # 查找相似的单词
        suggestions = get_close_matches(
            word.lower(),
            self.words,
            n=n,
            cutoff=0.6
        )

        return suggestions if suggestions else None

    def check_text(self, text):
        """检查整个文本"""
        words = text.lower().split()
        errors = {}

        for word in words:
            # 移除标点
            clean_word = ''.join(c for c in word if c.isalnum())

            if clean_word and not self.check_word(clean_word):
                if clean_word not in errors:
                    errors[clean_word] = self.suggest_corrections(clean_word)

        return errors

# 使用
checker = SpellChecker('dictionary.json')
text = "Pyton is a progaming language"
errors = checker.check_text(text)

print("拼写错误:")
for word, suggestions in errors.items():
    if suggestions:
        print(f"  '{word}' -> 建议: {suggestions}")
```

### 场景3：数据去重和匹配

```python
from difflib import SequenceMatcher, get_close_matches

class DataDeduplicator:
    """数据去重和匹配工具"""

    def __init__(self, similarity_threshold=0.85):
        self.threshold = similarity_threshold
        self.records = []

    def add_record(self, record):
        """添加记录并检查重复"""
        # 查找相似的现有记录
        similar = self.find_similar(record)

        if similar:
            return {
                'action': 'duplicate',
                'message': f"这可能是重复的，相似记录: {similar}"
            }

        self.records.append(record)
        return {'action': 'added', 'message': '记录已添加'}

    def find_similar(self, record):
        """查找相似的记录"""
        for existing in self.records:
            ratio = self._calculate_similarity(record, existing)
            if ratio >= self.threshold:
                return existing

        return None

    def _calculate_similarity(self, record1, record2):
        """计算两条记录的相似度"""
        # 对字典记录，比较字符串化后的值
        str1 = '|'.join(str(v) for v in record1.values() if v)
        str2 = '|'.join(str(v) for v in record2.values() if v)

        sm = SequenceMatcher(None, str1, str2)
        return sm.ratio()

    def get_duplicates(self):
        """获取所有可能的重复"""
        duplicates = []

        for i, rec1 in enumerate(self.records):
            for j, rec2 in enumerate(self.records[i+1:], i+1):
                ratio = self._calculate_similarity(rec1, rec2)
                if ratio >= self.threshold:
                    duplicates.append({
                        'record1': rec1,
                        'record2': rec2,
                        'similarity': ratio
                    })

        return duplicates

# 使用
dedup = DataDeduplicator(similarity_threshold=0.8)

records = [
    {'name': 'John Smith', 'email': 'john@example.com'},
    {'name': 'Jon Smith', 'email': 'jon@example.com'},
    {'name': 'Jane Doe', 'email': 'jane@example.com'},
]

for record in records:
    result = dedup.add_record(record)
    print(result['message'])

# 检查重复
duplicates = dedup.get_duplicates()
if duplicates:
    print("\n可能的重复:")
    for dup in duplicates:
        print(f"  相似度: {dup['similarity']:.2%}")
        print(f"    1: {dup['record1']}")
        print(f"    2: {dup['record2']}")
```

### 场景4：代码审查工具

```python
from difflib import unified_diff, ndiff

class CodeReviewTool:
    """简单的代码审查工具"""

    def __init__(self):
        self.original_code = None

    def load_original(self, filename):
        """加载原始代码"""
        with open(filename) as f:
            self.original_code = f.readlines()

    def review(self, new_code_str):
        """审查新代码"""
        new_code = new_code_str.splitlines(keepends=True)

        return {
            'unified_diff': self._get_unified_diff(new_code),
            'detailed_diff': self._get_detailed_diff(new_code),
            'statistics': self._get_statistics(new_code),
            'suggestions': self._get_suggestions(new_code)
        }

    def _get_unified_diff(self, new_code):
        """生成统一 diff"""
        return ''.join(unified_diff(
            self.original_code,
            new_code,
            fromfile='原始代码',
            tofile='新代码'
        ))

    def _get_detailed_diff(self, new_code):
        """生成详细 diff"""
        return '\n'.join(ndiff(self.original_code, new_code))

    def _get_statistics(self, new_code):
        """生成统计信息"""
        added = len(new_code) - len(self.original_code)

        sm = SequenceMatcher(None, self.original_code, new_code)

        return {
            'similarity': sm.ratio(),
            'lines_added': max(0, added),
            'lines_removed': max(0, -added),
            'total_changes': len(new_code)
        }

    def _get_suggestions(self, new_code):
        """生成审查建议"""
        suggestions = []

        sm = SequenceMatcher(None, self.original_code, new_code)

        if sm.ratio() < 0.5:
            suggestions.append("⚠️ 改动很大，请确保没有无意的更改")

        # 检查代码长度
        original_chars = sum(len(line) for line in self.original_code)
        new_chars = sum(len(line) for line in new_code)

        if new_chars > original_chars * 1.5:
            suggestions.append("⚠️ 新代码增加了很多行数，是否可以简化？")

        return suggestions

# 使用
reviewer = CodeReviewTool()

original = """def greet():
    print("Hello")
    return True
"""

new = """def greet(name="World"):
    greeting = f"Hello {name}"
    print(greeting)
    return len(greeting) > 0
"""

review = reviewer.review(new)
print("统一 diff:")
print(review['unified_diff'])

print("\n统计:")
print(review['statistics'])

print("\n建议:")
for suggestion in review['suggestions']:
    print(f"  {suggestion}")
```

---

## 面试要点

### difflib 的核心算法是什么？

**答案**：difflib 使用 Gestalt Pattern Matching 算法的变种，核心是找出两个序列中最长的连续匹配子序列（LCS），然后递归地处理剩余部分。时间复杂度为 O(n*m)。

### SequenceMatcher.ratio() 的计算公式是什么？

**答案**：`ratio = 2.0*M / (len(a) + len(b))`，其中 M 是匹配的元素数量。返回值在 0 到 1 之间。

### Differ、unified_diff 和 ndiff 的区别是什么？

**答案**：
- `Differ`：生成带 `+`、`-`、` ` 标记的行级差异
- `unified_diff`：生成标准的统一 diff 格式（Git style）
- `ndiff`：生成更详细的差异，包括 `?` 标记指出改变位置

### 如何提高大文件比较的性能？

**答案**：使用 `junk` 参数忽略不重要的元素；分块处理；使用采样；对非常大的文件可考虑只比较哈希值。

### get_close_matches 的 cutoff 参数有什么作用？

**答案**：`cutoff` 是相似度阈值（0-1），只返回相似度大于等于该值的匹配项。常用值为 0.6 或 0.8。

### difflib 可以处理什么类型的序列？

**答案**：任何可比较的序列，包括字符串、列表、元组等。只要元素可以比较相等。

### 如何在 difflib 中处理大小写敏感性？

**答案**：`get_close_matches` 默认是大小写敏感的。需要大小写不敏感时，可以将输入转换为同一大小写再处理。

### 什么是 opcodes？

**答案**：`get_opcodes()` 返回从一个序列转换到另一个序列所需的操作序列，每个操作包含类型（replace、delete、insert、equal）和对应的索引范围。

---

## 延伸阅读

- [Python 官方文档 - difflib](https://docs.python.org/3/library/difflib.html)
- [Gestalt Pattern Matching 算法](https://en.wikipedia.org/wiki/Gestalt_Pattern_Matching)
- [相似度算法 - Levenshtein 距离](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [fuzzywuzzy](https://github.com/seatgeek/fuzzywuzzy) - 基于 difflib 的高级模糊匹配库
- [python-Levenshtein](https://github.com/maxbachmann/python-Levenshtein) - C 实现的高性能字符串距离计算
- [Unified Diff Format](https://en.wikipedia.org/wiki/Unified_format)
- [PEP 8 - 代码风格指南](https://www.python.org/dev/peps/pep-0008/) - 用于代码审查场景
