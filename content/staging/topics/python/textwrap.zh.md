---
title: Python textwrap 模块详解
description: 深入学习 Python textwrap 模块的文本换行与填充功能，包括核心类与函数的使用方法、最佳实践和性能优化策略
track: python
section: stdlib
difficulty: beginner
tags:
  - 文本处理
  - 字符串处理
  - 文本格式化
  - 标准库
status: imported
origin: old/src/content/docs/python/textwrap.zh.md
divergence: 0.195
issues:
  - title-lang-en
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: Python
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## 概念解释

**textwrap 模块**是 Python 标准库提供的文本换行与填充工具，用于将长字符串按指定宽度进行换行处理、缩进调整、以及段落填充等操作。

### 核心用途

- **文本换行**：将过长的单行文本按指定宽度断行
- **文本填充**：重新组织文本以适应指定的容器宽度
- **缩进处理**：为文本添加、移除或调整前缀缩进
- **命令行输出**：格式化帮助文本、日志输出等

### 解决的问题

在实际开发中，我们常需要处理这些场景：

1. **终端友好输出**：适配不同终端宽度（通常 80 字符）
2. **文档生成**：格式化文本用于 README、日志等
3. **代码生成**：生成格式化的代码或配置文件
4. **用户界面**：CLI 应用的帮助文本和错误消息

### 历史背景

textwrap 模块首次引入于 Python 2.3，为现代化文本处理提供了便捷方案。随着版本演进，模块功能不断完善，现已成为处理文本格式化的标准方案。

## 核心原理

### 文本分割算法

textwrap 的核心逻辑基于以下算法：

1. **词级分割**：将文本按空白符（空格、换行、制表符）分割成词
2. **宽度计算**：计算每个词的宽度，检查是否超出限制
3. **行构建**：贪心地将词添加到当前行，直到添加下一个词会超出宽度
4. **断行处理**：对于无法分割的长词进行特殊处理（break_long_words）

### TextWrapper 对象

TextWrapper 是 textwrap 模块的核心类，维护了一系列配置参数：

```
TextWrapper 配置参数关系图：
┌─────────────────────────────────────────┐
│ TextWrapper 对象                         │
├─────────────────────────────────────────┤
│ 宽度相关配置                            │
│  ├─ width: 目标宽度（默认 70）         │
│  ├─ max_lines: 最大行数                │
│  └─ placeholder: 省略号（...）         │
├─────────────────────────────────────────┤
│ 缩进相关配置                            │
│  ├─ initial_indent: 首行缩进           │
│  └─ subsequent_indent: 后续行缩进      │
├─────────────────────────────────────────┤
│ 断行相关配置                            │
│  ├─ break_long_words: 强制断长词       │
│  ├─ break_on_hyphens: 在连字符处断行   │
│  └─ expand_tabs: 展开制表符            │
└─────────────────────────────────────────┘
```

### 内部工作流程

```
输入文本
  ↓
清理与规范化（normalize_whitespace）
  ↓
按词分割（split_chunks）
  ↓
贪心算法填充行
  ↓
应用缩进
  ↓
输出格式化文本
```

## 核心要点

### 主要函数与类

| 函数/类 | 功能 | 适用场景 |
|--------|------|---------|
| `wrap()` | 返回格式化后的行列表 | 需要逐行处理 |
| `fill()` | 返回格式化后的完整字符串 | 直接输出 |
| `dedent()` | 移除公共前缀缩进 | 处理缩进代码块 |
| `indent()` | 添加缩进前缀 | 嵌套结构输出 |
| `TextWrapper` | 可配置的包装器类 | 复杂场景、重复使用 |

### 重要参数说明

1. **width**：目标宽度（默认 70）
   - 影响换行位置的关键参数
   - 应考虑缩进长度

2. **initial_indent / subsequent_indent**：缩进字符串
   - initial_indent：第一行的前缀
   - subsequent_indent：其他行的前缀
   - 宽度需计入 width 内

3. **break_long_words**：是否在长词处断行
   - True：强制在宽度限制处断行
   - False：可能导致单行超过 width

4. **break_on_hyphens**：是否在连字符处断行
   - True：优先在 `-` 后断行
   - False：将连字符视为普通字符

5. **expand_tabs**：是否展开制表符
   - True：制表符转换为空格
   - False：保留原始制表符

### 常用组合模式

```python
# 模式 1：简单包装
wrap(text, width=70)

# 模式 2：带缩进的包装
wrap(text, width=70, initial_indent='>>> ', subsequent_indent='... ')

# 模式 3：处理长单词
wrap(text, width=40, break_long_words=True)

# 模式 4：代码格式化
dedent(text)  # 移除缩进
indent(text, '    ')  # 添加缩进
```

## 代码示例

### 基础使用：wrap() 和 fill()

```python
import textwrap

text = "Python textwrap 模块提供了文本换行和填充功能，" \
       "可以将长文本按指定宽度进行换行处理，" \
       "非常适合用于命令行应用和文档生成。"

# 使用 wrap() 返回行列表
lines = textwrap.wrap(text, width=40)
print("wrap() 结果：")
for i, line in enumerate(lines, 1):
    print(f"  行 {i}: {line}")

# 输出：
# 行 1: Python textwrap 模块提供了文本换行和
# 行 2: 填充功能，可以将长文本按指定宽度进行
# 行 3: 换行处理，非常适合用于命令行应用和文档
# 行 4: 生成。

# 使用 fill() 返回完整字符串
result = textwrap.fill(text, width=40)
print("\nfill() 结果：")
print(result)
```

### 缩进处理

```python
import textwrap

text = "这是一个多行文本。\n它包含多个段落。\n第三行文字。"

# initial_indent: 首行缩进
print("首行缩进示例：")
result = textwrap.fill(
    text,
    width=30,
    initial_indent='  ',  # 首行空 2 格
    subsequent_indent=''  # 其他行无缩进
)
print(result)

# subsequent_indent: 后续行缩进（常用于列表）
print("\n列表式缩进示例：")
text = "这是一个很长的文本需要进行换行处理以适应指定的宽度限制。"
result = textwrap.fill(
    text,
    width=35,
    initial_indent='• ',      # 首行：项目符号
    subsequent_indent='  '    # 其他行：缩进对齐
)
print(result)

# 输出：
# • 这是一个很长的文本需要进行换行处理
#   以适应指定的宽度限制。

# 代码块缩进
code_text = "def hello():\n    print('world')\n    return True"
print("\n代码块缩进示例：")
result = textwrap.indent(code_text, '    ')
print(result)
```

### 处理长单词

```python
import textwrap

# 场景：包含长单词（URL、驼峰命名等）
text = "访问 https://www.python.org/doc 获取文档，" \
       "或查看 CamelCaseClass 的实现。"

print("默认行为（break_long_words=True）：")
print(textwrap.fill(text, width=30, break_long_words=True))

# 输出：
# 访问 https://www.python.org/do
# c 获取文档，或查看
# CamelCaseClass 的实现。

print("\n允许长词超出宽度（break_long_words=False）：")
print(textwrap.fill(text, width=30, break_long_words=False))

# 输出：
# 访问 https://www.python.org/doc
# 获取文档，或查看 CamelCaseClass
# 的实现。
```

### 缩进处理：dedent() 和 indent()

```python
import textwrap

# dedent() - 移除公共前缀缩进
code_block = """
    def greet(name):
        print(f"Hello, {name}!")
        return True
"""

print("原始代码（包含缩进）：")
print(repr(code_block))

print("\n使用 dedent() 移除缩进：")
dedented = textwrap.dedent(code_block)
print(repr(dedented))
print(dedented)

# indent() - 添加缩进前缀
text = "Line 1\nLine 2\nLine 3"
print("\n原始文本：")
print(text)

print("\n添加缩进前缀（indent()）：")
indented = textwrap.indent(text, ">>> ")
print(indented)

# 输出：
# >>> Line 1
# >>> Line 2
# >>> Line 3

# 条件缩进：仅缩进非空行
print("\n条件缩进（仅非空行）：")
text_with_blanks = "Line 1\n\nLine 3"
predicate = lambda line: line.strip()  # 仅处理非空行
result = textwrap.indent(text_with_blanks, "  ", predicate=predicate)
print(repr(result))
```

### TextWrapper 类的高级用法

```python
import textwrap

# 场景：需要重复处理相似文本，提高效率
text1 = "这是第一个很长的文本段落，" \
        "需要按指定格式进行处理和输出。"
text2 = "这是第二个很长的文本段落，" \
        "也需要相同的格式进行处理。"

# 创建可复用的 TextWrapper 实例
wrapper = textwrap.TextWrapper(
    width=40,
    initial_indent='• ',
    subsequent_indent='  ',
    break_long_words=False,
    break_on_hyphens=True
)

print("处理文本 1：")
print(wrapper.fill(text1))

print("\n处理文本 2：")
print(wrapper.fill(text2))

# 动态修改包装器配置
wrapper.width = 50
wrapper.initial_indent = '→ '
print("\n修改宽度后处理文本 1：")
print(wrapper.fill(text1))

# 获取包装器的详细配置
print("\nTextWrapper 当前配置：")
print(f"  width: {wrapper.width}")
print(f"  initial_indent: {repr(wrapper.initial_indent)}")
print(f"  subsequent_indent: {repr(wrapper.subsequent_indent)}")
print(f"  break_long_words: {wrapper.break_long_words}")
print(f"  break_on_hyphens: {wrapper.break_on_hyphens}")
```

### 处理最大行数限制

```python
import textwrap

text = "这是一个很长的文本段落，" * 10

# 限制最大行数，使用 placeholder 截断
wrapper = textwrap.TextWrapper(
    width=50,
    max_lines=3,
    placeholder=' [...]'
)

result = wrapper.fill(text)
print("最多 3 行输出：")
print(result)
print(f"\n总行数：{result.count(chr(10)) + 1}")

# 输出示例：
# 这是一个很长的文本段落，这是一个很长的文本段落
# ，这是一个很长的文本段落，这是一个很长的
# 文本段落，这是一个很长的文本段落， [...]
```

### 实际应用：生成帮助文本

```python
import textwrap
import sys

def generate_help_text():
    """生成命令行应用的帮助文本"""

    # 使用列表结构组织帮助信息
    commands = {
        'create': '创建新项目，使用方式：myapp create <project-name>',
        'build': '编译项目代码，支持多个目标平台',
        'deploy': '部署应用到远程服务器，需要提供有效的凭证',
        'cleanup': '清理临时文件和构建产物',
    }

    help_text = "Usage: myapp <command> [options]\n\nCommands:\n"

    for cmd, desc in commands.items():
        # 使用 wrap 格式化长描述
        wrapped = textwrap.fill(
            desc,
            width=70,
            initial_indent=f'  {cmd:<10} - ',
            subsequent_indent=f'  {"":<10} - '
        )
        help_text += wrapped + '\n'

    return help_text

print(generate_help_text())
```

### 处理 HTML/Markdown 文本

```python
import textwrap
import re

def format_markdown_text(text, width=70):
    """格式化 Markdown 文本，保留列表和代码块"""

    lines = text.split('\n')
    result = []

    for line in lines:
        # 检查是否为列表项
        if re.match(r'^\s*[-*+]\s', line):
            # 列表项：保持缩进和项目符号
            match = re.match(r'^(\s*)([-*+]\s)(.*)', line)
            indent = match.group(1)
            marker = match.group(2)
            content = match.group(3)

            wrapped = textwrap.fill(
                content,
                width=width,
                initial_indent=indent + marker,
                subsequent_indent=indent + '  '
            )
            result.append(wrapped)

        # 检查是否为代码块
        elif line.startswith('```') or line.startswith('    '):
            result.append(line)

        # 普通段落
        else:
            if line.strip():
                wrapped = textwrap.fill(line, width=width)
                result.append(wrapped)
            else:
                result.append('')

    return '\n'.join(result)

# 测试
markdown = """这是一个长的段落，需要进行换行处理以适应指定的宽度限制。

列表项：
- 这是第一个列表项，它很长需要换行处理
- 第二个列表项

代码示例：
    def hello():
        print('world')

最后一个段落，也很长需要进行换行处理以适应容器宽度。"""

print(format_markdown_text(markdown, width=50))
```

## 最佳实践

### 选择合适的宽度

```python
import textwrap
import shutil

# 获取终端宽度
terminal_width = shutil.get_terminal_size().columns

# 为缩进预留空间
reserved_for_indent = 4
text_width = terminal_width - reserved_for_indent

wrapper = textwrap.TextWrapper(
    width=text_width,
    subsequent_indent=' ' * 4
)

text = "很长的文本"
print(wrapper.fill(text))
```

### 保留关键信息的可读性

```python
import textwrap

# 不推荐：宽度太小，频繁换行
textwrap.fill(text, width=20)

# 推荐：保持合理宽度
textwrap.fill(text, width=70)

# 推荐：为特殊内容（URL、代码）设置 break_long_words=False
textwrap.fill(
    "Check https://example.com for more info",
    width=40,
    break_long_words=False
)
```

### 缩进与对齐的一致性

```python
import textwrap

# 推荐：使用 initial_indent 和 subsequent_indent 保持对齐
wrapper = textwrap.TextWrapper(
    width=50,
    initial_indent='• ',
    subsequent_indent='  '  # 2 空格对齐项目符号
)

# 不推荐：混合不同的缩进方式
# 这会导致视觉上的不对齐
```

### 处理特殊字符和 Unicode

```python
import textwrap

# 正确处理中文和 Emoji
text = "Python 😀 是一门很好的编程语言，" \
       "适合初学者也适合专家使用。"

# 中文通常每个字符为 1 单位宽度
result = textwrap.fill(text, width=40)
print(result)

# 对于包含 Emoji 的文本，考虑使用 unicodedata
import unicodedata

def char_width(char):
    """获取字符的显示宽度"""
    if unicodedata.east_asian_width(char) in ['F', 'W']:
        return 2  # 全角字符
    return 1

# 如需精确宽度计算，可自定义 TextWrapper
```

### 缓存 TextWrapper 实例

```python
import textwrap

class TextFormatter:
    """复用 TextWrapper 实例提高性能"""

    def __init__(self, width=70):
        self.wrapper = textwrap.TextWrapper(width=width)

    def format(self, text, **kwargs):
        """格式化文本，支持临时覆盖配置"""
        for key, value in kwargs.items():
            setattr(self.wrapper, key, value)
        return self.wrapper.fill(text)

formatter = TextFormatter(width=70)

# 重复使用，避免每次都创建新的 TextWrapper
for text in texts:
    print(formatter.format(text))
```

## 常见陷阱

### 陷阱 1：忽视缩进占用的宽度

```python
import textwrap

text = "Python is a great programming language."
indent = ">>> "

# 错误：没有考虑缩进占用的空间
wrapper = textwrap.TextWrapper(
    width=20,
    initial_indent=indent,
    subsequent_indent=indent
)
result = wrapper.fill(text)
# 实际宽度：4（缩进）+ 16（文本）= 20

# 正确：预留缩进空间
wrapper = textwrap.TextWrapper(
    width=30,  # 为缩进预留
    initial_indent=indent,
    subsequent_indent=indent
)
result = wrapper.fill(text)
```

### 陷阱 2：在 Unicode 字符处不恰当地断行

```python
import textwrap

# 中文文本不使用空格分隔
text = "这是一个很长的中文文本，需要进行换行处理"

# 问题：textwrap 使用空格分词，无法正确处理中文
result = textwrap.wrap(text, width=10)
# 结果：['这是一个很长的中文文本，需要进行换行处理']
# 整个文本作为一个词，无法换行

# 解决方案：预处理文本，在字符间插入空格
def split_cjk_text(text):
    """为中文/日文/韩文文本添加空格分隔"""
    import unicodedata
    result = []
    for char in text:
        if unicodedata.east_asian_width(char) in ['F', 'W']:
            result.append(char + ' ')
        else:
            result.append(char)
    return ''.join(result).strip()

processed = split_cjk_text(text)
result = textwrap.wrap(processed, width=10)
```

### 陷阱 3：break_long_words 参数的误用

```python
import textwrap

# 长 URL 的处理
url_text = "详见 https://docs.python.org/3/library/textwrap.html 文档"

# 错误：break_long_words=True 会在 URL 中断行
result = textwrap.fill(url_text, width=30, break_long_words=True)
# 输出会在 URL 中间断行，破坏链接

# 正确：禁止在长词处断行
result = textwrap.fill(url_text, width=30, break_long_words=False)
```

### 陷阱 4：preserve_whitespace 与 expand_tabs 的交互

```python
import textwrap

# 包含制表符的文本
text = "Name\tAge\tCity\nAlice\t30\tNewYork"

# 默认行为：展开制表符
result = textwrap.fill(text, width=40)
print(result)

# 如果需要保留制表符，应该先禁用 expand_tabs
wrapper = textwrap.TextWrapper(expand_tabs=False)
result = wrapper.fill(text)
```

### 陷阱 5：max_lines 与 placeholder 的使用误区

```python
import textwrap

text = "Long text " * 20

# 错误：placeholder 可能被意外截断
wrapper = textwrap.TextWrapper(
    max_lines=2,
    placeholder='...'
)
result = wrapper.fill(text)
# placeholder 可能出现在行尾不恰当的位置

# 正确：选择合适的 placeholder，确保可读性
wrapper = textwrap.TextWrapper(
    max_lines=2,
    placeholder=' [...]',  # 前置空格提高可读性
    width=70
)
result = wrapper.fill(text)
```

## 性能考量

### TextWrapper 对象重用

```python
import textwrap
import time

text = "Long text " * 100
iterations = 10000

# 方法 1：每次都创建新的 TextWrapper（低效）
start = time.time()
for _ in range(iterations):
    textwrap.fill(text, width=70)
time1 = time.time() - start

# 方法 2：复用 TextWrapper 实例（高效）
wrapper = textwrap.TextWrapper(width=70)
start = time.time()
for _ in range(iterations):
    wrapper.fill(text)
time2 = time.time() - start

print(f"创建新实例：{time1:.3f}s")
print(f"复用实例：{time2:.3f}s")
print(f"性能提升：{time1/time2:.1f}x")
# 输出：
# 创建新实例：0.450s
# 复用实例：0.120s
# 性能提升：3.8x
```

### 算法复杂度

```
TextWrapper.fill() 的时间复杂度：
- 输入：文本长度 N
- 复杂度：O(N)
- 空间复杂度：O(N)（存储输出）

分解：
1. 规范化空白符：O(N)
2. 分词：O(N)
3. 填充行：O(N)（每个词最多处理一次）
```

### 大文本处理的优化策略

```python
import textwrap

def format_large_text(text, chunk_size=10000):
    """分块处理大文本"""
    wrapper = textwrap.TextWrapper(width=70)
    lines = text.split('\n')

    result = []
    buffer = []
    buffer_size = 0

    for line in lines:
        buffer.append(line)
        buffer_size += len(line)

        # 达到块大小时，处理一个块
        if buffer_size >= chunk_size:
            chunk = '\n'.join(buffer)
            result.append(wrapper.fill(chunk))
            buffer = []
            buffer_size = 0

    # 处理剩余内容
    if buffer:
        chunk = '\n'.join(buffer)
        result.append(wrapper.fill(chunk))

    return '\n'.join(result)

# 用于处理 MB 级别的大文件
```

### 内存优化

```python
import textwrap

# 不推荐：一次加载整个文件到内存
with open('large_file.txt') as f:
    content = f.read()
    result = textwrap.fill(content, width=70)

# 推荐：流式处理
def format_file_streaming(filepath, width=70):
    """流式处理文件，减少内存占用"""
    wrapper = textwrap.TextWrapper(width=width)

    with open(filepath) as f:
        buffer = []
        for line in f:
            buffer.append(line.rstrip())
            if len(buffer) >= 100:  # 每 100 行处理一次
                text = '\n'.join(buffer)
                yield wrapper.fill(text)
                buffer = []

        if buffer:
            text = '\n'.join(buffer)
            yield wrapper.fill(text)

# 使用
for formatted_chunk in format_file_streaming('large_file.txt'):
    print(formatted_chunk)
```

## 实战场景

### 场景 1：CLI 应用的帮助文本

```python
import textwrap
import sys

class CLIApp:
    """命令行应用"""

    def __init__(self):
        self.name = "myapp"
        self.version = "1.0.0"

    def show_help(self):
        """显示帮助文本"""
        help_text = f"""
{self.name} v{self.version} - Python 应用示例

Usage:
  {self.name} [command] [options]

Commands:
  create    创建新项目
  build     编译项目代码，支持多个目标平台和构建选项
  deploy    部署应用到远程服务器
  status    显示项目构建状态和部署信息
  help      显示此帮助信息

Options:
  -v, --verbose    启用详细输出模式
  -q, --quiet      启用安静模式
  -h, --help       显示帮助信息

Examples:
  {self.name} create my-project
  {self.name} build --target=linux
  {self.name} deploy --server=prod.example.com
        """

        # 移除首尾空白，规范化格式
        help_text = textwrap.dedent(help_text).strip()

        # 格式化长行
        lines = help_text.split('\n')
        formatted = []

        for line in lines:
            # 检查是否为长行（超过 80 字符）
            if len(line) > 80 and line.strip() and not line.startswith('  '):
                # 保持缩进的长行进行换行
                match = textwrap.match(r'^(\s*)', line)
                indent = match.group(1) if match else ''
                wrapped = textwrap.fill(
                    line.strip(),
                    width=80,
                    initial_indent=indent,
                    subsequent_indent=indent
                )
                formatted.append(wrapped)
            else:
                formatted.append(line)

        print('\n'.join(formatted))

app = CLIApp()
app.show_help()
```

### 场景 2：日志消息的格式化

```python
import textwrap
import logging

class FormattedLogHandler(logging.Handler):
    """自定义日志处理器，为长消息进行换行"""

    def __init__(self, width=80):
        super().__init__()
        self.wrapper = textwrap.TextWrapper(
            width=width,
            subsequent_indent='  '  # 后续行缩进
        )

    def emit(self, record):
        """格式化并输出日志"""
        try:
            msg = record.getMessage()

            # 如果消息过长，进行换行
            if len(msg) > self.wrapper.width:
                msg = self.wrapper.fill(msg)

            # 格式化完整日志
            log_entry = f"[{record.levelname}] {msg}"
            print(log_entry)
        except Exception:
            self.handleError(record)

# 使用示例
logger = logging.getLogger(__name__)
logger.addHandler(FormattedLogHandler(width=80))

logger.info("这是一个很长的日志消息，" * 5)
```

### 场景 3：生成格式化的文档

```python
import textwrap

class DocGenerator:
    """文档生成器"""

    def __init__(self, title, author, width=70):
        self.title = title
        self.author = author
        self.width = width
        self.wrapper = textwrap.TextWrapper(width=width)

    def format_section(self, title, content, level=1):
        """格式化文档章节"""
        prefix = '#' * level
        result = f"\n{prefix} {title}\n"

        # 格式化内容
        formatted = self.wrapper.fill(content)
        result += formatted + "\n"

        return result

    def format_list(self, items):
        """格式化列表"""
        result = ""
        for item in items:
            # 使用 textwrap 格式化列表项
            wrapped = textwrap.fill(
                item,
                width=self.width - 2,
                initial_indent='- ',
                subsequent_indent='  '
            )
            result += wrapped + "\n"
        return result

    def format_code_block(self, code, language="python"):
        """格式化代码块"""
        # 代码块通常不进行换行
        result = f"\n```{language}\n{code}\n```\n"
        return result

    def generate(self, sections):
        """生成完整文档"""
        doc = f"# {self.title}\n\n"
        doc += f"**作者**: {self.author}\n"

        for title, content, section_type in sections:
            if section_type == 'text':
                doc += self.format_section(title, content, level=2)
            elif section_type == 'list':
                doc += f"\n## {title}\n"
                doc += self.format_list(content)
            elif section_type == 'code':
                doc += f"\n## {title}\n"
                doc += self.format_code_block(content)

        return doc

# 使用示例
gen = DocGenerator(
    title="Python textwrap 教程",
    author="技术博主",
    width=70
)

sections = [
    ("简介", "textwrap 模块是 Python 标准库提供的文本换行和填充工具。" * 2, "text"),
    ("主要功能", [
        "文本换行：将长行按指定宽度进行断行",
        "文本填充：重新组织文本以适应容器宽度",
        "缩进处理：添加或移除文本前缀缩进"
    ], "list"),
    ("代码示例", "import textwrap\ntext = 'Hello'\nresult = textwrap.fill(text)", "code")
]

doc = gen.generate(sections)
print(doc)
```

### 场景 4：处理配置文件生成

```python
import textwrap

class ConfigGenerator:
    """配置文件生成器"""

    def __init__(self, width=80):
        self.wrapper = textwrap.TextWrapper(width=width)

    def format_comment(self, text):
        """格式化多行注释"""
        lines = []
        for line in text.split('\n'):
            wrapped = textwrap.fill(
                line.strip() if line.strip() else '',
                width=self.wrapper.width - 2,
                initial_indent='# ',
                subsequent_indent='# '
            )
            lines.append(wrapped)
        return '\n'.join(lines)

    def generate_config(self, config_data):
        """生成 INI 配置文件"""
        result = ""

        for section, items in config_data.items():
            result += f"\n[{section}]\n"

            for key, (value, description) in items.items():
                # 添加格式化的注释
                if description:
                    result += self.format_comment(description) + "\n"
                result += f"{key} = {value}\n"

        return result

# 使用示例
config = {
    "database": {
        "host": ("localhost", "数据库服务器地址"),
        "port": ("5432", "数据库服务器端口号"),
        "name": ("mydb", "数据库名称，用于连接时指定目标数据库")
    },
    "logging": {
        "level": ("INFO", "日志级别，可选值为 DEBUG INFO WARNING ERROR CRITICAL"),
        "file": ("/var/log/app.log", "日志文件路径，应该是绝对路径以确保可访问性")
    }
}

gen = ConfigGenerator(width=70)
print(gen.generate_config(config))
```

## 面试要点

### Q1：textwrap 模块的核心函数有哪些，分别用于什么场景？

**答**：

- `wrap(text, width=70)`：返回格式化后的行列表，适合逐行处理
- `fill(text, width=70)`：返回格式化后的完整字符串，适合直接输出
- `dedent(text)`：移除公共前缀缩进，用于处理代码块
- `indent(text, prefix, predicate=None)`：添加缩进前缀，用于嵌套结构
- `TextWrapper` 类：可配置的包装器，适合复杂或重复场景

### Q2：break_long_words 和 break_on_hyphens 有什么区别？

**答**：

- `break_long_words`：控制是否在宽度限制处强制断行
  - True：单个长词超出宽度时会被截断
  - False：长词可能导致单行超过宽度限制

- `break_on_hyphens`：控制是否优先在连字符处断行
  - True：优先选择在 `-` 后断行
  - False：将连字符视为普通字符，不优先断行

### Q3：如何处理 initial_indent 和 subsequent_indent 占用的宽度？

**答**：

这是常见的陷阱。应该这样处理：

```python
import textwrap

indent = ">>> "
indent_width = len(indent)

# 方法 1：减少 width 值
wrapper = textwrap.TextWrapper(
    width=70 - indent_width,  # 预留缩进空间
    initial_indent=indent,
    subsequent_indent=indent
)

# 方法 2：明确声明实际可用宽度
available_width = 70 - indent_width
wrapper = textwrap.TextWrapper(
    width=available_width,
    initial_indent=indent,
    subsequent_indent=indent
)
```

### Q4：dedent() 函数的工作原理是什么？

**答**：

dedent() 通过以下步骤工作：

1. 扫描所有非空行
2. 计算最小公共前导空白长度
3. 从每一行移除该最小空白量

```python
import textwrap

text = """
    line 1
    line 2
        line 3
"""

# 最小公共缩进是 4 个空格，会被完全移除
result = textwrap.dedent(text)
```

### Q5：如何处理中文或其他 CJK 语言的文本？

**答**：

textwrap 无法正确处理 CJK 文本，因为它依赖空格分词：

```python
import textwrap
import unicodedata

def is_cjk_char(char):
    """检查是否为 CJK 字符"""
    return unicodedata.east_asian_width(char) in ['F', 'W']

def wrap_cjk_text(text, width=70):
    """处理 CJK 文本的换行"""
    # 在 CJK 字符间插入空格
    result = []
    for char in text:
        result.append(char)
        if is_cjk_char(char):
            result.append(' ')

    processed = ''.join(result)
    wrapped = textwrap.wrap(processed, width=width)

    # 移除插入的空格
    return [''.join(line.split()) for line in wrapped]
```

### Q6：如何优化大文件处理的性能？

**答**：

关键是复用 TextWrapper 实例并分块处理：

```python
import textwrap

class FileFormatter:
    def __init__(self, width=70):
        self.wrapper = textwrap.TextWrapper(width=width)

    def format_file(self, filepath, chunk_size=50):
        """分块处理文件"""
        with open(filepath) as f:
            buffer = []
            for line in f:
                buffer.append(line.rstrip())

                if len(buffer) >= chunk_size:
                    # 处理一个块
                    text = '\n'.join(buffer)
                    yield self.wrapper.fill(text)
                    buffer = []

            # 处理剩余内容
            if buffer:
                text = '\n'.join(buffer)
                yield self.wrapper.fill(text)
```

### Q7：TextWrapper 对象可以重复使用吗，如何修改其配置？

**答**：

可以重复使用，TextWrapper 的属性都是可写的：

```python
import textwrap

wrapper = textwrap.TextWrapper(width=70)

# 复用多次
result1 = wrapper.fill(text1)
result2 = wrapper.fill(text2)

# 修改配置后继续使用
wrapper.width = 50
wrapper.initial_indent = '  '
result3 = wrapper.fill(text3)

# 查看当前配置
print(f"Current width: {wrapper.width}")
```

### Q8：max_lines 和 placeholder 如何使用？

**答**：

用于截断文本到指定行数：

```python
import textwrap

text = "Long text " * 20

wrapper = textwrap.TextWrapper(
    width=70,
    max_lines=3,
    placeholder=' [...]'  # 最后一行的后缀
)

result = wrapper.fill(text)
# 最多 3 行，最后一行以 placeholder 结尾
```

## 延伸阅读

### 官方文档

- [Python textwrap 官方文档](https://docs.python.org/zh-cn/3/library/textwrap.html)
- [Python 标准库参考](https://docs.python.org/zh-cn/3/library/index.html)

### 相关模块

- `shutil.get_terminal_size()` - 获取终端大小
- `textwrap 源码` - 深入理解实现细节
- `io` 模块 - 处理输入输出

### 扩展技术

- Unicode 文本处理：`unicodedata` 模块
- 高级文本格式化：`jinja2` 模板
- Markdown 处理：`markdown` 库
- 代码格式化：`black`, `autopep8`

### 常见应用库

| 库名 | 用途 | 与 textwrap 的区别 |
|------|------|------------------|
| Rich | 终端美化输出 | 支持颜色、样式和表格 |
| Typer | CLI 框架 | 专业的命令行应用框架 |
| Click | CLI 参数解析 | 自动生成格式化的帮助文本 |
| Sphinx | 文档生成 | 专业的文档构建工具 |

### 学习建议

1. **掌握基础**：先学会 `wrap()` 和 `fill()` 的简单用法
2. **理解参数**：深入理解各个参数的含义和影响
3. **实践应用**：在实际项目中应用（CLI、文档、日志等）
4. **性能优化**：在大数据处理中使用分块和复用策略
5. **扩展阅读**：研究源码实现，理解算法细节
