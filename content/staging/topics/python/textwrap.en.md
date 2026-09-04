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
origin: old/src/content/docs/python/textwrap.en.md
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


## Concept Explanation

The **textwrap module** is a text wrapping and filling utility provided by the Python standard library, used for wrapping long strings at specified widths, adjusting indentation, and filling paragraphs.

### Core Uses

- **Text Wrapping**: Break long single-line text at specified widths
- **Text Filling**: Reorganize text to fit specified container widths
- **Indentation Handling**: Add, remove, or adjust prefix indentation for text
- **Command-line Output**: Format help text, log output, etc.

### Problems Solved

In practice, we often need to handle these scenarios:

1. **Terminal-friendly Output**: Adapt to different terminal widths (typically 80 characters)
2. **Documentation Generation**: Format text for README, logs, etc.
3. **Code Generation**: Generate formatted code or configuration files
4. **User Interface**: Help text and error messages for CLI applications

### Historical Background

The textwrap module was first introduced in Python 2.3, providing a convenient solution for modern text processing. As versions evolved, the module's functionality has been continuously improved, and it has become the standard solution for handling text formatting.

## Core Principles

### Text Splitting Algorithm

The core logic of textwrap is based on the following algorithm:

1. **Word-level Splitting**: Split text into words by whitespace (spaces, newlines, tabs)
2. **Width Calculation**: Calculate the width of each word, check if it exceeds the limit
3. **Line Building**: Greedily add words to the current line until adding the next word would exceed the width
4. **Line Breaking**: Special handling for long words that cannot be split (break_long_words)

### TextWrapper Object

TextWrapper is the core class of the textwrap module, maintaining a series of configuration parameters:

```
TextWrapper Configuration Parameters Diagram:
+------------------------------------------+
| TextWrapper Object                        |
+------------------------------------------+
| Width-related Configuration              |
|  |-- width: Target width (default 70)    |
|  |-- max_lines: Maximum number of lines  |
|  +-- placeholder: Ellipsis (...)         |
+------------------------------------------+
| Indentation-related Configuration        |
|  |-- initial_indent: First line indent   |
|  +-- subsequent_indent: Following lines  |
+------------------------------------------+
| Line Breaking Configuration              |
|  |-- break_long_words: Force break long  |
|  |-- break_on_hyphens: Break at hyphens  |
|  +-- expand_tabs: Expand tab characters  |
+------------------------------------------+
```

### Internal Workflow

```
Input Text
  |
  v
Cleanup and Normalization (normalize_whitespace)
  |
  v
Split by Words (split_chunks)
  |
  v
Greedy Algorithm to Fill Lines
  |
  v
Apply Indentation
  |
  v
Output Formatted Text
```

## Key Points

### Main Functions and Classes

| Function/Class | Purpose | Use Case |
|----------------|---------|----------|
| `wrap()` | Returns a list of formatted lines | When line-by-line processing is needed |
| `fill()` | Returns a complete formatted string | For direct output |
| `dedent()` | Removes common leading indentation | Processing indented code blocks |
| `indent()` | Adds indentation prefix | Nested structure output |
| `TextWrapper` | Configurable wrapper class | Complex scenarios, repeated use |

### Important Parameter Descriptions

1. **width**: Target width (default 70)
   - Key parameter affecting line break positions
   - Should consider indentation length

2. **initial_indent / subsequent_indent**: Indentation strings
   - initial_indent: Prefix for the first line
   - subsequent_indent: Prefix for other lines
   - Width counts towards the total width

3. **break_long_words**: Whether to break at long words
   - True: Force break at width limit
   - False: May result in single lines exceeding width

4. **break_on_hyphens**: Whether to break at hyphens
   - True: Prefer breaking after `-`
   - False: Treat hyphens as regular characters

5. **expand_tabs**: Whether to expand tab characters
   - True: Convert tabs to spaces
   - False: Preserve original tabs

### Common Combination Patterns

```python
# Pattern 1: Simple wrapping
wrap(text, width=70)

# Pattern 2: Wrapping with indentation
wrap(text, width=70, initial_indent='>>> ', subsequent_indent='... ')

# Pattern 3: Handling long words
wrap(text, width=40, break_long_words=True)

# Pattern 4: Code formatting
dedent(text)  # Remove indentation
indent(text, '    ')  # Add indentation
```

## Code Examples

### Basic Usage: wrap() and fill()

```python
import textwrap

text = "The Python textwrap module provides text wrapping and filling " \
       "functionality, allowing long text to be wrapped at specified widths, " \
       "making it ideal for command-line applications and documentation generation."

# Using wrap() returns a list of lines
lines = textwrap.wrap(text, width=40)
print("wrap() result:")
for i, line in enumerate(lines, 1):
    print(f"  Line {i}: {line}")

# Output:
# Line 1: The Python textwrap module provides
# Line 2: text wrapping and filling
# Line 3: functionality, allowing long text to
# Line 4: be wrapped at specified widths,
# Line 5: making it ideal for command-line
# Line 6: applications and documentation
# Line 7: generation.

# Using fill() returns a complete string
result = textwrap.fill(text, width=40)
print("\nfill() result:")
print(result)
```

### Indentation Handling

```python
import textwrap

text = "This is a multi-line text.\nIt contains multiple paragraphs.\nThird line of text."

# initial_indent: First line indentation
print("First line indentation example:")
result = textwrap.fill(
    text,
    width=30,
    initial_indent='  ',  # First line indented 2 spaces
    subsequent_indent=''  # Other lines no indentation
)
print(result)

# subsequent_indent: Following line indentation (commonly used for lists)
print("\nList-style indentation example:")
text = "This is a very long text that needs to be wrapped to fit the specified width limit."
result = textwrap.fill(
    text,
    width=35,
    initial_indent='* ',      # First line: bullet point
    subsequent_indent='  '    # Other lines: indented alignment
)
print(result)

# Output:
# * This is a very long text that
#   needs to be wrapped to fit the
#   specified width limit.

# Code block indentation
code_text = "def hello():\n    print('world')\n    return True"
print("\nCode block indentation example:")
result = textwrap.indent(code_text, '    ')
print(result)
```

### Handling Long Words

```python
import textwrap

# Scenario: Text containing long words (URLs, CamelCase names, etc.)
text = "Visit https://www.python.org/doc for documentation, " \
       "or check the CamelCaseClass implementation."

print("Default behavior (break_long_words=True):")
print(textwrap.fill(text, width=30, break_long_words=True))

# Output:
# Visit https://www.python.org/do
# c for documentation, or check
# the CamelCaseClass
# implementation.

print("\nAllow long words to exceed width (break_long_words=False):")
print(textwrap.fill(text, width=30, break_long_words=False))

# Output:
# Visit https://www.python.org/doc
# for documentation, or check the
# CamelCaseClass implementation.
```

### Indentation Processing: dedent() and indent()

```python
import textwrap

# dedent() - Remove common leading indentation
code_block = """
    def greet(name):
        print(f"Hello, {name}!")
        return True
"""

print("Original code (with indentation):")
print(repr(code_block))

print("\nUsing dedent() to remove indentation:")
dedented = textwrap.dedent(code_block)
print(repr(dedented))
print(dedented)

# indent() - Add indentation prefix
text = "Line 1\nLine 2\nLine 3"
print("\nOriginal text:")
print(text)

print("\nAdding indentation prefix (indent()):")
indented = textwrap.indent(text, ">>> ")
print(indented)

# Output:
# >>> Line 1
# >>> Line 2
# >>> Line 3

# Conditional indentation: Only indent non-empty lines
print("\nConditional indentation (non-empty lines only):")
text_with_blanks = "Line 1\n\nLine 3"
predicate = lambda line: line.strip()  # Only process non-empty lines
result = textwrap.indent(text_with_blanks, "  ", predicate=predicate)
print(repr(result))
```

### Advanced Usage of TextWrapper Class

```python
import textwrap

# Scenario: Need to repeatedly process similar text, boost productivity
text1 = "This is the first long text paragraph " \
        "that needs to be processed and output in a specified format."
text2 = "This is the second long text paragraph " \
        "that also needs to be processed in the same format."

# Create a reusable TextWrapper instance
wrapper = textwrap.TextWrapper(
    width=40,
    initial_indent='* ',
    subsequent_indent='  ',
    break_long_words=False,
    break_on_hyphens=True
)

print("Processing text 1:")
print(wrapper.fill(text1))

print("\nProcessing text 2:")
print(wrapper.fill(text2))

# Dynamically modify wrapper configuration
wrapper.width = 50
wrapper.initial_indent = '-> '
print("\nProcessing text 1 after modifying width:")
print(wrapper.fill(text1))

# Get detailed wrapper configuration
print("\nTextWrapper current configuration:")
print(f"  width: {wrapper.width}")
print(f"  initial_indent: {repr(wrapper.initial_indent)}")
print(f"  subsequent_indent: {repr(wrapper.subsequent_indent)}")
print(f"  break_long_words: {wrapper.break_long_words}")
print(f"  break_on_hyphens: {wrapper.break_on_hyphens}")
```

### Handling Maximum Line Limits

```python
import textwrap

text = "This is a very long text paragraph, " * 10

# Limit maximum lines, use placeholder for truncation
wrapper = textwrap.TextWrapper(
    width=50,
    max_lines=3,
    placeholder=' [...]'
)

result = wrapper.fill(text)
print("Maximum 3 lines output:")
print(result)
print(f"\nTotal lines: {result.count(chr(10)) + 1}")

# Example output:
# This is a very long text paragraph, This is a
# very long text paragraph, This is a very long
# text paragraph, This is a very long [...]
```

### Practical Application: Generating Help Text

```python
import textwrap
import sys

def generate_help_text():
    """Generate help text for command-line application"""

    # Use list structure to organize help information
    commands = {
        'create': 'Create a new project, usage: myapp create <project-name>',
        'build': 'Compile project code, supports multiple target platforms',
        'deploy': 'Deploy application to remote server, requires valid credentials',
        'cleanup': 'Clean up temporary files and build artifacts',
    }

    help_text = "Usage: myapp <command> [options]\n\nCommands:\n"

    for cmd, desc in commands.items():
        # Use wrap to format long descriptions
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

### Processing HTML/Markdown Text

```python
import textwrap
import re

def format_markdown_text(text, width=70):
    """Format Markdown text, preserving lists and code blocks"""

    lines = text.split('\n')
    result = []

    for line in lines:
        # Check if it's a list item
        if re.match(r'^\s*[-*+]\s', line):
            # List item: maintain indentation and bullet point
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

        # Check if it's a code block
        elif line.startswith('```') or line.startswith('    '):
            result.append(line)

        # Regular paragraph
        else:
            if line.strip():
                wrapped = textwrap.fill(line, width=width)
                result.append(wrapped)
            else:
                result.append('')

    return '\n'.join(result)

# Test
markdown = """This is a long paragraph that needs to be wrapped to fit the specified width limit.

List items:
- This is the first list item, it's long and needs wrapping
- Second list item

Code example:
    def hello():
        print('world')

The last paragraph, also long and needs to be wrapped to fit the container width."""

print(format_markdown_text(markdown, width=50))
```

## Best Practices

### Choose Appropriate Width

```python
import textwrap
import shutil

# Get terminal width
terminal_width = shutil.get_terminal_size().columns

# Reserve space for indentation
reserved_for_indent = 4
text_width = terminal_width - reserved_for_indent

wrapper = textwrap.TextWrapper(
    width=text_width,
    subsequent_indent=' ' * 4
)

text = "Very long text"
print(wrapper.fill(text))
```

### Maintain Readability of Key Information

```python
import textwrap

# Not recommended: Width too small, frequent line breaks
textwrap.fill(text, width=20)

# Recommended: Maintain reasonable width
textwrap.fill(text, width=70)

# Recommended: Set break_long_words=False for special content (URLs, code)
textwrap.fill(
    "Check https://example.com for more info",
    width=40,
    break_long_words=False
)
```

### Consistency in Indentation and Alignment

```python
import textwrap

# Recommended: Use initial_indent and subsequent_indent to maintain alignment
wrapper = textwrap.TextWrapper(
    width=50,
    initial_indent='* ',
    subsequent_indent='  '  # 2 spaces to align with bullet point
)

# Not recommended: Mixing different indentation methods
# This causes visual misalignment
```

### Handling Special Characters and Unicode

```python
import textwrap

# Correctly handle Chinese and Emoji
text = "Python is a great programming language, " \
       "suitable for beginners and experts alike."

# Chinese characters typically have 1 unit width each
result = textwrap.fill(text, width=40)
print(result)

# For text containing Emoji, consider using unicodedata
import unicodedata

def char_width(char):
    """Get the display width of a character"""
    if unicodedata.east_asian_width(char) in ['F', 'W']:
        return 2  # Full-width characters
    return 1

# For precise width calculation, customize TextWrapper
```

### Cache TextWrapper Instances

```python
import textwrap

class TextFormatter:
    """Reuse TextWrapper instances for better performance"""

    def __init__(self, width=70):
        self.wrapper = textwrap.TextWrapper(width=width)

    def format(self, text, **kwargs):
        """Format text, supports temporary configuration override"""
        for key, value in kwargs.items():
            setattr(self.wrapper, key, value)
        return self.wrapper.fill(text)

formatter = TextFormatter(width=70)

# Reuse to avoid creating new TextWrapper each time
for text in texts:
    print(formatter.format(text))
```

## Common Pitfalls

### Pitfall 1: Ignoring Width Occupied by Indentation

```python
import textwrap

text = "Python is a great programming language."
indent = ">>> "

# Wrong: Not considering space occupied by indentation
wrapper = textwrap.TextWrapper(
    width=20,
    initial_indent=indent,
    subsequent_indent=indent
)
result = wrapper.fill(text)
# Actual width: 4 (indent) + 16 (text) = 20

# Correct: Reserve space for indentation
wrapper = textwrap.TextWrapper(
    width=30,  # Reserve for indentation
    initial_indent=indent,
    subsequent_indent=indent
)
result = wrapper.fill(text)
```

### Pitfall 2: Inappropriate Line Breaking at Unicode Characters

```python
import textwrap

# Chinese text doesn't use spaces for word separation
text = "This is a very long Chinese text that needs line wrapping"

# Problem: textwrap uses space tokenization, cannot correctly handle CJK text
result = textwrap.wrap(text, width=10)
# Result: The entire text as one word, cannot wrap

# Solution: Preprocess text, insert spaces between characters
def split_cjk_text(text):
    """Add space separation for Chinese/Japanese/Korean text"""
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

### Pitfall 3: Misuse of break_long_words Parameter

```python
import textwrap

# Handling long URLs
url_text = "See https://docs.python.org/3/library/textwrap.html for documentation"

# Wrong: break_long_words=True will break within the URL
result = textwrap.fill(url_text, width=30, break_long_words=True)
# Output will break in the middle of the URL, breaking the link

# Correct: Disable breaking at long words
result = textwrap.fill(url_text, width=30, break_long_words=False)
```

### Pitfall 4: Interaction Between preserve_whitespace and expand_tabs

```python
import textwrap

# Text containing tab characters
text = "Name\tAge\tCity\nAlice\t30\tNewYork"

# Default behavior: Expand tabs
result = textwrap.fill(text, width=40)
print(result)

# If you need to preserve tabs, disable expand_tabs first
wrapper = textwrap.TextWrapper(expand_tabs=False)
result = wrapper.fill(text)
```

### Pitfall 5: Misunderstanding max_lines and placeholder Usage

```python
import textwrap

text = "Long text " * 20

# Wrong: placeholder might be unexpectedly truncated
wrapper = textwrap.TextWrapper(
    max_lines=2,
    placeholder='...'
)
result = wrapper.fill(text)
# placeholder might appear at an inappropriate position at line end

# Correct: Choose appropriate placeholder to ensure readability
wrapper = textwrap.TextWrapper(
    max_lines=2,
    placeholder=' [...]',  # Leading space improves readability
    width=70
)
result = wrapper.fill(text)
```

## Performance Considerations

### TextWrapper Object Reuse

```python
import textwrap
import time

text = "Long text " * 100
iterations = 10000

# Method 1: Create new TextWrapper each time (inefficient)
start = time.time()
for _ in range(iterations):
    textwrap.fill(text, width=70)
time1 = time.time() - start

# Method 2: Reuse TextWrapper instance (efficient)
wrapper = textwrap.TextWrapper(width=70)
start = time.time()
for _ in range(iterations):
    wrapper.fill(text)
time2 = time.time() - start

print(f"Creating new instance: {time1:.3f}s")
print(f"Reusing instance: {time2:.3f}s")
print(f"Performance improvement: {time1/time2:.1f}x")
# Output:
# Creating new instance: 0.450s
# Reusing instance: 0.120s
# Performance improvement: 3.8x
```

### Algorithm Complexity

```
Time complexity of TextWrapper.fill():
- Input: Text length N
- Complexity: O(N)
- Space complexity: O(N) (storing output)

Breakdown:
1. Normalizing whitespace: O(N)
2. Tokenization: O(N)
3. Filling lines: O(N) (each word processed at most once)
```

### Optimization Strategy for Large Text Processing

```python
import textwrap

def format_large_text(text, chunk_size=10000):
    """Process large text in chunks"""
    wrapper = textwrap.TextWrapper(width=70)
    lines = text.split('\n')

    result = []
    buffer = []
    buffer_size = 0

    for line in lines:
        buffer.append(line)
        buffer_size += len(line)

        # When chunk size is reached, process a chunk
        if buffer_size >= chunk_size:
            chunk = '\n'.join(buffer)
            result.append(wrapper.fill(chunk))
            buffer = []
            buffer_size = 0

    # Process remaining content
    if buffer:
        chunk = '\n'.join(buffer)
        result.append(wrapper.fill(chunk))

    return '\n'.join(result)

# For processing MB-level large files
```

### Memory Optimization

```python
import textwrap

# Not recommended: Load entire file into memory at once
with open('large_file.txt') as f:
    content = f.read()
    result = textwrap.fill(content, width=70)

# Recommended: Stream processing
def format_file_streaming(filepath, width=70):
    """Stream process file, reduce memory usage"""
    wrapper = textwrap.TextWrapper(width=width)

    with open(filepath) as f:
        buffer = []
        for line in f:
            buffer.append(line.rstrip())
            if len(buffer) >= 100:  # Process every 100 lines
                text = '\n'.join(buffer)
                yield wrapper.fill(text)
                buffer = []

        if buffer:
            text = '\n'.join(buffer)
            yield wrapper.fill(text)

# Usage
for formatted_chunk in format_file_streaming('large_file.txt'):
    print(formatted_chunk)
```

## Real-world Scenarios

### Scenario 1: CLI Application Help Text

```python
import textwrap
import sys

class CLIApp:
    """Command-line application"""

    def __init__(self):
        self.name = "myapp"
        self.version = "1.0.0"

    def show_help(self):
        """Display help text"""
        help_text = f"""
{self.name} v{self.version} - Python Application Example

Usage:
  {self.name} [command] [options]

Commands:
  create    Create new project
  build     Compile project code, supports multiple target platforms and build options
  deploy    Deploy application to remote server
  status    Display project build status and deployment information
  help      Display this help information

Options:
  -v, --verbose    Enable verbose output mode
  -q, --quiet      Enable quiet mode
  -h, --help       Display help information

Examples:
  {self.name} create my-project
  {self.name} build --target=linux
  {self.name} deploy --server=prod.example.com
        """

        # Remove leading/trailing whitespace, normalize format
        help_text = textwrap.dedent(help_text).strip()

        # Format long lines
        lines = help_text.split('\n')
        formatted = []

        for line in lines:
            # Check if it's a long line (over 80 characters)
            if len(line) > 80 and line.strip() and not line.startswith('  '):
                # Wrap long lines while maintaining indentation
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

### Scenario 2: Log Message Formatting

```python
import textwrap
import logging

class FormattedLogHandler(logging.Handler):
    """Custom log handler that wraps long messages"""

    def __init__(self, width=80):
        super().__init__()
        self.wrapper = textwrap.TextWrapper(
            width=width,
            subsequent_indent='  '  # Indent continuation lines
        )

    def emit(self, record):
        """Format and output log"""
        try:
            msg = record.getMessage()

            # If message is too long, wrap it
            if len(msg) > self.wrapper.width:
                msg = self.wrapper.fill(msg)

            # Format complete log entry
            log_entry = f"[{record.levelname}] {msg}"
            print(log_entry)
        except Exception:
            self.handleError(record)

# Usage example
logger = logging.getLogger(__name__)
logger.addHandler(FormattedLogHandler(width=80))

logger.info("This is a very long log message, " * 5)
```

### Scenario 3: Generating Formatted Documentation

```python
import textwrap

class DocGenerator:
    """Documentation generator"""

    def __init__(self, title, author, width=70):
        self.title = title
        self.author = author
        self.width = width
        self.wrapper = textwrap.TextWrapper(width=width)

    def format_section(self, title, content, level=1):
        """Format document section"""
        prefix = '#' * level
        result = f"\n{prefix} {title}\n"

        # Format content
        formatted = self.wrapper.fill(content)
        result += formatted + "\n"

        return result

    def format_list(self, items):
        """Format list"""
        result = ""
        for item in items:
            # Use textwrap to format list items
            wrapped = textwrap.fill(
                item,
                width=self.width - 2,
                initial_indent='- ',
                subsequent_indent='  '
            )
            result += wrapped + "\n"
        return result

    def format_code_block(self, code, language="python"):
        """Format code block"""
        # Code blocks typically don't need wrapping
        result = f"\n```{language}\n{code}\n```\n"
        return result

    def generate(self, sections):
        """Generate complete document"""
        doc = f"# {self.title}\n\n"
        doc += f"**Author**: {self.author}\n"

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

# Usage example
gen = DocGenerator(
    title="Python textwrap Tutorial",
    author="Tech Blogger",
    width=70
)

sections = [
    ("Introduction", "The textwrap module is a text wrapping and filling tool provided by the Python standard library. " * 2, "text"),
    ("Main Features", [
        "Text wrapping: Break long lines at specified widths",
        "Text filling: Reorganize text to fit container widths",
        "Indentation handling: Add or remove text prefix indentation"
    ], "list"),
    ("Code Example", "import textwrap\ntext = 'Hello'\nresult = textwrap.fill(text)", "code")
]

doc = gen.generate(sections)
print(doc)
```

### Scenario 4: Configuration File Generation

```python
import textwrap

class ConfigGenerator:
    """Configuration file generator"""

    def __init__(self, width=80):
        self.wrapper = textwrap.TextWrapper(width=width)

    def format_comment(self, text):
        """Format multi-line comment"""
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
        """Generate INI configuration file"""
        result = ""

        for section, items in config_data.items():
            result += f"\n[{section}]\n"

            for key, (value, description) in items.items():
                # Add formatted comment
                if description:
                    result += self.format_comment(description) + "\n"
                result += f"{key} = {value}\n"

        return result

# Usage example
config = {
    "database": {
        "host": ("localhost", "Database server address"),
        "port": ("5432", "Database server port number"),
        "name": ("mydb", "Database name, used to specify target database when connecting")
    },
    "logging": {
        "level": ("INFO", "Log level, options are DEBUG INFO WARNING ERROR CRITICAL"),
        "file": ("/var/log/app.log", "Log file path, should be absolute path to ensure accessibility")
    }
}

gen = ConfigGenerator(width=70)
print(gen.generate_config(config))
```

## Interview Key Points

### Q1: What are the core functions of the textwrap module and what scenarios are they used for?

**Answer**:

- `wrap(text, width=70)`: Returns a list of formatted lines, suitable for line-by-line processing
- `fill(text, width=70)`: Returns a complete formatted string, suitable for direct output
- `dedent(text)`: Removes common leading indentation, used for processing code blocks
- `indent(text, prefix, predicate=None)`: Adds indentation prefix, used for nested structures
- `TextWrapper` class: Configurable wrapper, suitable for complex or repeated scenarios

### Q2: What's the difference between break_long_words and break_on_hyphens?

**Answer**:

- `break_long_words`: Controls whether to force line breaks at width limits
  - True: Single long words exceeding width will be truncated
  - False: Long words may cause single lines to exceed width limit

- `break_on_hyphens`: Controls whether to prefer breaking at hyphens
  - True: Prefer breaking after `-`
  - False: Treat hyphens as regular characters, don't prefer breaking there

### Q3: How to handle width occupied by initial_indent and subsequent_indent?

**Answer**:

This is a common pitfall. Here's how to handle it:

```python
import textwrap

indent = ">>> "
indent_width = len(indent)

# Method 1: Reduce width value
wrapper = textwrap.TextWrapper(
    width=70 - indent_width,  # Reserve space for indentation
    initial_indent=indent,
    subsequent_indent=indent
)

# Method 2: Explicitly declare actual available width
available_width = 70 - indent_width
wrapper = textwrap.TextWrapper(
    width=available_width,
    initial_indent=indent,
    subsequent_indent=indent
)
```

### Q4: How does the dedent() function work?

**Answer**:

dedent() works through the following steps:

1. Scan all non-empty lines
2. Calculate minimum common leading whitespace length
3. Remove that minimum whitespace from each line

```python
import textwrap

text = """
    line 1
    line 2
        line 3
"""

# Minimum common indentation is 4 spaces, will be completely removed
result = textwrap.dedent(text)
```

### Q5: How to handle Chinese or other CJK language text?

**Answer**:

textwrap cannot correctly handle CJK text because it relies on space tokenization:

```python
import textwrap
import unicodedata

def is_cjk_char(char):
    """Check if it's a CJK character"""
    return unicodedata.east_asian_width(char) in ['F', 'W']

def wrap_cjk_text(text, width=70):
    """Handle line wrapping for CJK text"""
    # Insert spaces between CJK characters
    result = []
    for char in text:
        result.append(char)
        if is_cjk_char(char):
            result.append(' ')

    processed = ''.join(result)
    wrapped = textwrap.wrap(processed, width=width)

    # Remove inserted spaces
    return [''.join(line.split()) for line in wrapped]
```

### Q6: How to optimize performance for large file processing?

**Answer**:

The key is reusing TextWrapper instances and processing in chunks:

```python
import textwrap

class FileFormatter:
    def __init__(self, width=70):
        self.wrapper = textwrap.TextWrapper(width=width)

    def format_file(self, filepath, chunk_size=50):
        """Process file in chunks"""
        with open(filepath) as f:
            buffer = []
            for line in f:
                buffer.append(line.rstrip())

                if len(buffer) >= chunk_size:
                    # Process a chunk
                    text = '\n'.join(buffer)
                    yield self.wrapper.fill(text)
                    buffer = []

            # Process remaining content
            if buffer:
                text = '\n'.join(buffer)
                yield self.wrapper.fill(text)
```

### Q7: Can TextWrapper objects be reused, and how to modify their configuration?

**Answer**:

Yes, they can be reused. All TextWrapper attributes are writable:

```python
import textwrap

wrapper = textwrap.TextWrapper(width=70)

# Reuse multiple times
result1 = wrapper.fill(text1)
result2 = wrapper.fill(text2)

# Modify configuration and continue using
wrapper.width = 50
wrapper.initial_indent = '  '
result3 = wrapper.fill(text3)

# View current configuration
print(f"Current width: {wrapper.width}")
```

### Q8: How to use max_lines and placeholder?

**Answer**:

Used to truncate text to a specified number of lines:

```python
import textwrap

text = "Long text " * 20

wrapper = textwrap.TextWrapper(
    width=70,
    max_lines=3,
    placeholder=' [...]'  # Suffix for the last line
)

result = wrapper.fill(text)
# Maximum 3 lines, last line ends with placeholder
```

## Further Reading

### Official Documentation

- [Python textwrap Official Documentation](https://docs.python.org/3/library/textwrap.html)
- [Python Standard Library Reference](https://docs.python.org/3/library/index.html)

### Related Modules

- `shutil.get_terminal_size()` - Get terminal size
- `textwrap source code` - Deep understanding of implementation details
- `io` module - Handle input/output

### Extended Technologies

- Unicode text processing: `unicodedata` module
- Advanced text formatting: `jinja2` templates
- Markdown processing: `markdown` library
- Code formatting: `black`, `autopep8`

### Common Application Libraries

| Library | Purpose | Difference from textwrap |
|---------|---------|--------------------------|
| Rich | Terminal beautification output | Supports colors, styles, and tables |
| Typer | CLI framework | Professional command-line application framework |
| Click | CLI argument parsing | Automatically generates formatted help text |
| Sphinx | Documentation generation | Professional documentation building tool |

### Learning Recommendations

1. **Master the Basics**: First learn simple usage of `wrap()` and `fill()`
2. **Understand Parameters**: Fully understand the meaning and impact of each parameter
3. **Practice Application**: Apply in real projects (CLI, documentation, logs, etc.)
4. **Performance Optimization**: Use chunking and reuse strategies in large data processing
5. **Extended Reading**: Study source code implementation, understand algorithm details
