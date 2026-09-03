---
title: Python 代码质量工具全指南
description: 深入掌握 Python 代码质量工具链：Black、Ruff、isort、Flake8、pylint、mypy 及 pre-commit 集成
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Black
  - Ruff
  - isort
  - Flake8
  - pylint
  - mypy
  - pre-commit
  - 代码质量
  - CI/CD
status: imported
origin: old/src/content/docs/python/code-quality.zh.md
divergence: 0.549
issues:
  - order-mismatch
  - divergent
legacy:
  category: Python
  subcategory: 包管理与项目结构
  order: 44
  lastUpdated: 2026-01-07
---

在团队协作和大型项目开发中，保持代码质量和风格一致性至关重要。Python 生态系统提供了丰富的代码质量工具，从格式化、导入排序到静态类型检查，形成了完整的工具链。本文将深入介绍这些工具的使用方法、配置技巧和最佳实践。

## 概念解释

代码质量工具是一类自动化工具，用于确保代码符合既定的风格规范、避免常见错误，并提高代码可维护性。在 Python 开发中，主要有以下几类工具：

### 工具分类

| 类型 | 工具 | 功能 |
|------|------|------|
| 代码格式化 | Black, autopep8, yapf | 自动格式化代码风格 |
| 导入排序 | isort | 自动排序和分组 import 语句 |
| 代码检查 (Linter) | Ruff, Flake8, pylint | 检查代码规范和潜在问题 |
| 类型检查 | mypy, pyright, pytype | 静态类型分析 |
| 安全检查 | bandit, safety | 检测安全漏洞 |
| 集成工具 | pre-commit | 统一管理和执行检查 |

### 为什么需要代码质量工具？

1. **一致性**：团队成员代码风格统一，减少代码审查中的风格争论
2. **效率**：自动化检查和修复，节省手动调整时间
3. **质量**：尽早发现潜在 bug 和不规范代码
4. **可维护性**：规范的代码更易于理解和维护
5. **协作**：降低新成员融入团队的门槛

## 核心原理

### 代码格式化原理

代码格式化工具通过解析 Python 源代码为抽象语法树 (AST)，然后按照预定义规则重新生成格式化后的代码。这种方式确保了格式化的准确性和一致性。

```
源代码 → 词法分析 → 语法分析 → AST → 格式化规则 → 格式化代码
```

### 静态分析原理

Linter 和类型检查器通过静态分析代码，不实际执行代码，而是分析代码结构、控制流和数据流，检测潜在问题：

- **语法检查**：确保代码符合 Python 语法规范
- **风格检查**：遵循 PEP 8 等编码规范
- **类型推断**：分析变量类型和函数签名
- **数据流分析**：检测未使用变量、重复定义等问题

## 核心要点

### 工具选择指南

**现代化项目推荐组合**：
- **格式化**: Black（零配置，统一风格）
- **Linting**: Ruff（极速，替代多个工具）
- **类型检查**: mypy（成熟稳定）
- **集成**: pre-commit

**传统项目组合**：
- **格式化**: Black + isort
- **Linting**: Flake8 + pylint
- **类型检查**: mypy
- **集成**: pre-commit

## 代码示例

### Black - 无妥协的代码格式化器

Black 是 Python 社区最流行的代码格式化工具，其设计理念是"无妥协"——只提供极少的配置选项，确保所有使用 Black 的项目代码风格完全一致。

#### 安装与基本使用

```bash
# 安装 Black
pip install black

# 格式化单个文件
black myfile.py

# 格式化整个目录
black src/

# 检查模式（不修改文件，只显示需要修改的地方）
black --check src/

# 显示差异
black --diff src/

# 指定行长度（默认 88）
black --line-length 120 src/
```

#### 格式化效果示例

**格式化前：**
```python
def   calculate_sum(numbers:list[int],multiplier:int=1)->int:
    result=0
    for num in numbers:result+=num*multiplier
    return result

data = {"name":"Alice","age":30,"email":"alice@example.com","scores":[95,87,92,88,91]}

very_long_function_call(first_argument="hello",second_argument="world",third_argument=42,fourth_argument=True)
```

**Black 格式化后：**
```python
def calculate_sum(numbers: list[int], multiplier: int = 1) -> int:
    result = 0
    for num in numbers:
        result += num * multiplier
    return result


data = {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com",
    "scores": [95, 87, 92, 88, 91],
}

very_long_function_call(
    first_argument="hello",
    second_argument="world",
    third_argument=42,
    fourth_argument=True,
)
```

#### 配置文件

在 `pyproject.toml` 中配置 Black：

```toml
[tool.black]
line-length = 88
target-version = ['py310', 'py311', 'py312']
include = '\.pyi?$'
exclude = '''
/(
    \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
  | migrations
)/
'''
```

#### 跳过格式化

使用 `# fmt: off` 和 `# fmt: on` 注释控制格式化范围：

```python
# fmt: off
matrix = [
    [1,  0,  0],
    [0,  1,  0],
    [0,  0,  1],
]
# fmt: on

# 单行跳过
some_code = some_value  # fmt: skip
```

### isort - 智能导入排序

isort 自动对 Python 的 import 语句进行排序和分组，确保导入顺序符合 PEP 8 规范。

#### 安装与使用

```bash
# 安装 isort
pip install isort

# 排序单个文件
isort myfile.py

# 排序整个项目
isort .

# 检查模式
isort --check-only --diff src/

# 与 Black 兼容
isort --profile black src/
```

#### 排序效果示例

**排序前：**
```python
from myapp.models import User
import os
from typing import List, Optional
import sys
from django.db import models
import json
from myapp.utils import helper
from collections import defaultdict
import requests
```

**isort 排序后：**
```python
import json
import os
import sys
from collections import defaultdict
from typing import List, Optional

import requests
from django.db import models

from myapp.models import User
from myapp.utils import helper
```

isort 将导入分为以下几组（按顺序）：
1. **标准库导入**（os, sys, json 等）
2. **第三方库导入**（requests, django 等）
3. **本地应用导入**（myapp 等）

#### 配置文件

在 `pyproject.toml` 中配置：

```toml
[tool.isort]
profile = "black"  # 与 Black 兼容
line_length = 88
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
known_first_party = ["myapp", "mypackage"]
known_third_party = ["django", "requests", "numpy"]
sections = ["FUTURE", "STDLIB", "THIRDPARTY", "FIRSTPARTY", "LOCALFOLDER"]
skip = [".venv", "migrations", "build"]
skip_glob = ["**/migrations/*"]
```

#### 跳过排序

```python
# isort: skip_file
# 在文件开头添加，跳过整个文件

import third_party  # isort: skip
# 跳过单行

# isort: off
# 这部分不排序
import b
import a
# isort: on
```

### Ruff - 超快速 Python Linter

Ruff 是用 Rust 编写的极速 Python linter，比传统工具快 10-100 倍。它可以替代 Flake8、isort、pydocstyle、pyupgrade 等多个工具。

#### 安装与使用

```bash
# 安装 Ruff
pip install ruff

# 检查代码
ruff check .

# 自动修复问题
ruff check --fix .

# 格式化代码（类似 Black）
ruff format .

# 监视模式
ruff check --watch .
```

#### Ruff 规则类别

Ruff 实现了来自多个工具的规则：

| 前缀 | 来源 | 说明 |
|------|------|------|
| E, W | pycodestyle | 代码风格检查 |
| F | Pyflakes | 逻辑错误检查 |
| I | isort | 导入排序 |
| N | pep8-naming | 命名规范 |
| D | pydocstyle | 文档字符串规范 |
| UP | pyupgrade | Python 版本升级建议 |
| B | flake8-bugbear | 潜在 bug 检测 |
| S | flake8-bandit | 安全问题检测 |
| C | McCabe | 复杂度检查 |
| PL | Pylint | 代码质量检查 |
| RUF | Ruff 特有 | Ruff 自定义规则 |

#### 配置示例

在 `pyproject.toml` 中配置：

```toml
[tool.ruff]
# 目标 Python 版本
target-version = "py310"

# 行长度
line-length = 88

# 包含/排除文件
exclude = [
    ".git",
    ".mypy_cache",
    ".ruff_cache",
    ".venv",
    "build",
    "dist",
    "migrations",
]

[tool.ruff.lint]
# 启用的规则
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # Pyflakes
    "I",      # isort
    "B",      # flake8-bugbear
    "C4",     # flake8-comprehensions
    "UP",     # pyupgrade
    "N",      # pep8-naming
    "S",      # flake8-bandit (安全)
    "T20",    # flake8-print
    "SIM",    # flake8-simplify
    "RUF",    # Ruff 特有规则
]

# 忽略的规则
ignore = [
    "E501",   # 行太长（由 formatter 处理）
    "S101",   # 使用 assert（测试中需要）
]

# 可自动修复的规则
fixable = ["ALL"]
unfixable = []

# 每个文件忽略特定规则
[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101", "D103"]
"__init__.py" = ["F401"]
"conftest.py" = ["E501"]

[tool.ruff.lint.isort]
known-first-party = ["myapp"]
force-single-line = false
lines-after-imports = 2

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
docstring-code-format = true
```

#### Ruff 检查示例

```python
# 问题代码
import os
import sys
from typing import List
import json  # F401: 未使用的导入

def badFunctionName(x):  # N802: 函数名应为小写
    unused_var = 10  # F841: 未使用的变量
    if x == True:  # E712: 与 True 比较应使用 is
        print("debug")  # T201: 使用了 print
    return x

class myClass:  # N801: 类名应为 CamelCase
    pass
```

运行 `ruff check` 后：

```
example.py:4:1: F401 `json` imported but unused
example.py:6:5: N802 Function name `badFunctionName` should be lowercase
example.py:7:5: F841 Local variable `unused_var` is assigned to but never used
example.py:8:8: E712 Comparison to `True` should be `cond is True`
example.py:9:9: T201 `print` found
example.py:12:7: N801 Class name `myClass` should use CapWords convention
```

### Flake8 - 经典代码检查器

Flake8 是 Python 社区使用最广泛的 linter 之一，结合了 PyFlakes、pycodestyle 和 McCabe 复杂度检查。

#### 安装与使用

```bash
# 安装 Flake8 及常用插件
pip install flake8
pip install flake8-bugbear      # 额外 bug 检查
pip install flake8-comprehensions  # 优化推导式
pip install flake8-docstrings   # 文档字符串检查
pip install flake8-import-order # 导入顺序检查

# 检查代码
flake8 src/

# 指定配置文件
flake8 --config=.flake8 src/

# 显示统计信息
flake8 --statistics src/
```

#### 配置文件

创建 `.flake8` 或在 `setup.cfg` 中配置：

```ini
[flake8]
max-line-length = 88
max-complexity = 10
extend-ignore = E203, E266, E501, W503
per-file-ignores =
    __init__.py: F401
    tests/*: S101
exclude =
    .git,
    __pycache__,
    .venv,
    build,
    dist,
    migrations,
    *.egg-info
```

#### 常见错误代码

| 代码 | 说明 |
|------|------|
| E1xx | 缩进问题 |
| E2xx | 空白问题 |
| E3xx | 空行问题 |
| E4xx | 导入问题 |
| E5xx | 行长度问题 |
| E7xx | 语句问题 |
| E9xx | 运行时错误 |
| W1xx-W6xx | 警告 |
| F4xx | 导入相关 |
| F8xx | 变量相关 |
| C901 | 复杂度过高 |

### pylint - 全面的代码分析

pylint 是最全面的 Python 代码分析工具，检查代码错误、编码标准、代码异味，并提供代码评分。

#### 安装与使用

```bash
# 安装 pylint
pip install pylint

# 检查代码
pylint src/

# 生成配置文件
pylint --generate-rcfile > .pylintrc

# 指定输出格式
pylint --output-format=json src/

# 只显示错误
pylint --errors-only src/
```

#### 配置文件

创建 `.pylintrc` 或在 `pyproject.toml` 中配置：

```toml
[tool.pylint.main]
load-plugins = [
    "pylint.extensions.docparams",
    "pylint.extensions.docstyle",
]
jobs = 4
ignore = ["migrations", "tests"]

[tool.pylint.messages_control]
disable = [
    "C0114",  # missing-module-docstring
    "C0115",  # missing-class-docstring
    "C0116",  # missing-function-docstring
    "R0903",  # too-few-public-methods
    "W0511",  # fixme
]

[tool.pylint.format]
max-line-length = 88

[tool.pylint.design]
max-args = 6
max-locals = 15
max-returns = 6
max-branches = 12
max-statements = 50
max-parents = 7
max-attributes = 10
min-public-methods = 1
max-public-methods = 20

[tool.pylint.similarities]
min-similarity-lines = 4
ignore-comments = true
ignore-docstrings = true
ignore-imports = true
```

#### pylint 评分

pylint 会为代码打分（满分 10 分）：

```
Your code has been rated at 8.50/10 (previous run: 7.80/10, +0.70)
```

### mypy - 静态类型检查

mypy 是 Python 的静态类型检查器，帮助在运行前发现类型错误。

#### 安装与使用

```bash
# 安装 mypy
pip install mypy

# 检查代码
mypy src/

# 严格模式
mypy --strict src/

# 生成类型存根
stubgen -p mypackage
```

#### 类型注解示例

```python
from typing import Optional, Union, List, Dict, Callable, TypeVar

# 基本类型注解
def greet(name: str) -> str:
    return f"Hello, {name}!"

# 可选类型
def find_user(user_id: int) -> Optional[dict]:
    # 可能返回 dict 或 None
    users = {1: {"name": "Alice"}}
    return users.get(user_id)

# 联合类型
def process(value: Union[int, str]) -> str:
    return str(value)

# Python 3.10+ 新语法
def process_new(value: int | str) -> str:
    return str(value)

# 泛型
T = TypeVar('T')

def first(items: List[T]) -> Optional[T]:
    return items[0] if items else None

# 回调函数类型
def apply_operation(
    numbers: List[int],
    operation: Callable[[int], int]
) -> List[int]:
    return [operation(n) for n in numbers]

# 类型别名
UserDict = Dict[str, Union[str, int, List[str]]]

def create_user(data: UserDict) -> UserDict:
    return {**data, "id": 1}
```

#### 配置文件

在 `pyproject.toml` 中配置：

```toml
[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_ignores = true
warn_redundant_casts = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
strict_equality = true
show_error_codes = true
show_column_numbers = true

# 第三方库配置
[[tool.mypy.overrides]]
module = [
    "requests.*",
    "redis.*",
    "celery.*",
]
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

#### 常见 mypy 错误

```python
# error: Incompatible return value type (got "int", expected "str")
def get_name() -> str:
    return 42

# error: Argument 1 to "len" has incompatible type "int"; expected "Sized"
length = len(42)

# error: Item "None" of "Optional[str]" has no attribute "upper"
def process(name: Optional[str]) -> str:
    return name.upper()  # 需要先检查 None

# 正确写法
def process_correct(name: Optional[str]) -> str:
    if name is None:
        return ""
    return name.upper()
```

### pre-commit - 统一管理工具链

pre-commit 是一个管理 Git 钩子的框架，可以在提交代码前自动运行各种检查工具。

#### 安装与配置

```bash
# 安装 pre-commit
pip install pre-commit

# 安装 Git 钩子
pre-commit install

# 手动运行所有钩子
pre-commit run --all-files

# 更新钩子版本
pre-commit autoupdate

# 跳过钩子（紧急情况）
git commit --no-verify
```

#### 配置文件示例

创建 `.pre-commit-config.yaml`：

```yaml
# .pre-commit-config.yaml
repos:
  # Ruff - 极速 linter 和格式化器
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  # Black - 代码格式化（如果不用 Ruff format）
  # - repo: https://github.com/psf/black
  #   rev: 24.4.2
  #   hooks:
  #     - id: black

  # isort - 导入排序（如果不用 Ruff）
  # - repo: https://github.com/pycqa/isort
  #   rev: 5.13.2
  #   hooks:
  #     - id: isort
  #       args: ["--profile", "black"]

  # mypy - 类型检查
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies:
          - types-requests
          - types-redis
        args: [--config-file=pyproject.toml]

  # 通用检查
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-toml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: ['--maxkb=1024']
      - id: debug-statements
      - id: detect-private-key
      - id: check-ast

  # 安全检查
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.8
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]
        additional_dependencies: ["bandit[toml]"]

  # 提交信息规范
  - repo: https://github.com/commitizen-tools/commitizen
    rev: v3.27.0
    hooks:
      - id: commitizen
        stages: [commit-msg]

# CI 配置
ci:
  autofix_commit_msg: "style: auto-fix by pre-commit hooks"
  autofix_prs: true
  autoupdate_commit_msg: "chore: update pre-commit hooks"
  autoupdate_schedule: weekly
```

#### pre-commit 工作流程

```
git add .
    ↓
git commit -m "feat: add new feature"
    ↓
pre-commit 触发
    ↓
┌─────────────────────────────┐
│  1. trailing-whitespace     │ → 删除行尾空白
│  2. end-of-file-fixer       │ → 确保文件以换行结束
│  3. ruff                    │ → 代码检查和修复
│  4. ruff-format             │ → 代码格式化
│  5. mypy                    │ → 类型检查
│  6. bandit                  │ → 安全检查
└─────────────────────────────┘
    ↓
所有检查通过 → 提交成功
任何检查失败 → 提交中止，显示错误信息
```

### CI/CD 集成

#### GitHub Actions 示例

```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy

      - name: Run Ruff
        run: ruff check --output-format=github .

      - name: Run Ruff Format Check
        run: ruff format --check .

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install mypy types-requests
          pip install -e .

      - name: Run mypy
        run: mypy src/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install bandit
        run: pip install bandit[toml]

      - name: Run bandit
        run: bandit -c pyproject.toml -r src/
```

#### GitLab CI 示例

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - type-check

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"

cache:
  paths:
    - .pip-cache/

lint:
  stage: lint
  image: python:3.11-slim
  script:
    - pip install ruff
    - ruff check --output-format=gitlab .
    - ruff format --check .

mypy:
  stage: type-check
  image: python:3.11-slim
  script:
    - pip install mypy types-requests
    - pip install -e .
    - mypy src/
```

## 最佳实践

### 项目初始化配置

创建完整的 `pyproject.toml` 配置：

```toml
[project]
name = "myproject"
version = "1.0.0"
requires-python = ">=3.10"

[tool.black]
line-length = 88
target-version = ['py310', 'py311']

[tool.ruff]
target-version = "py310"
line-length = 88

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "C4", "UP", "N", "S", "T20", "SIM", "RUF"]
ignore = ["E501", "S101"]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101", "D103"]

[tool.ruff.lint.isort]
known-first-party = ["myproject"]

[tool.mypy]
python_version = "3.10"
warn_return_any = true
disallow_untyped_defs = true
show_error_codes = true

[[tool.mypy.overrides]]
module = ["requests.*", "redis.*"]
ignore_missing_imports = true

[tool.bandit]
exclude_dirs = ["tests", ".venv"]
skips = ["B101"]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --tb=short"
```

### 渐进式采用策略

对于遗留项目，建议渐进式采用代码质量工具：

```python
# 阶段 1：基础格式化
# 配置 Black 和 isort，统一代码风格

# 阶段 2：基础 Linting
# 配置 Ruff/Flake8，从少量规则开始
# [tool.ruff.lint]
# select = ["E", "F"]  # 只启用基础规则

# 阶段 3：逐步增加规则
# select = ["E", "F", "W", "I", "B"]

# 阶段 4：添加类型检查
# 先为新代码添加类型注解
# 逐步为旧代码添加

# 阶段 5：完整配置
# 启用所有推荐规则
# 配置严格模式
```

### IDE 集成

**VS Code 配置 (.vscode/settings.json)：**

```json
{
    "python.linting.enabled": true,
    "python.linting.ruffEnabled": true,
    "python.formatting.provider": "none",
    "[python]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {
            "source.fixAll.ruff": "explicit",
            "source.organizeImports.ruff": "explicit"
        }
    },
    "python.analysis.typeCheckingMode": "basic",
    "mypy.enabled": true,
    "mypy.runUsingActiveInterpreter": true
}
```

**PyCharm 配置：**

1. Settings → Tools → External Tools → 添加 Ruff
2. Settings → Tools → File Watchers → 添加 Black/Ruff Format
3. 安装 Mypy 插件

### 团队协作规范

创建 `CONTRIBUTING.md` 文档：

```markdown
# 贡献指南

## 代码规范

本项目使用以下工具确保代码质量：

- **Ruff**: 代码检查和格式化
- **mypy**: 静态类型检查
- **pre-commit**: 提交前检查

## 开发环境设置

1. 安装依赖：
   ```bash
   pip install -e ".[dev]"
   ```

2. 安装 pre-commit 钩子：
   ```bash
   pre-commit install
   ```

3. 运行检查：
   ```bash
   ruff check .
   ruff format .
   mypy src/
   ```

## 提交规范

- 所有代码必须通过 pre-commit 检查
- 新代码必须添加类型注解
- 函数和类必须添加文档字符串
```

## 常见陷阱

### 工具冲突

**问题**：Black 和 isort 格式化导入时可能冲突。

**解决方案**：
```toml
# 使用 isort 的 black profile
[tool.isort]
profile = "black"

# 或者完全使用 Ruff（替代两者）
[tool.ruff.lint]
select = ["I"]  # isort 规则
```

### 忽略规则过多

**问题**：为了快速通过检查，忽略过多规则。

**解决方案**：
- 优先修复问题，而非忽略
- 使用 `per-file-ignores` 精确控制
- 定期审查忽略规则列表

### 类型检查过于严格

**问题**：启用严格模式后，大量遗留代码报错。

**解决方案**：
```toml
# 渐进式启用
[tool.mypy]
# 先宽松
disallow_untyped_defs = false

# 新文件使用严格模式
[[tool.mypy.overrides]]
module = "myapp.new_module.*"
disallow_untyped_defs = true
```

### pre-commit 钩子太慢

**问题**：每次提交等待时间过长。

**解决方案**：
- 使用 Ruff 替代 Flake8（快 10-100 倍）
- 配置 `stages` 限制钩子运行时机
- 使用 `--no-verify` 跳过（紧急情况）

```yaml
hooks:
  - id: mypy
    stages: [push]  # 只在 push 时运行
```

### 忽略 vendor 代码

**问题**：第三方代码触发大量警告。

**解决方案**：
```toml
[tool.ruff]
exclude = ["vendor/", "third_party/", "generated/"]

[tool.mypy]
exclude = ["vendor/", "third_party/"]
```

## 性能考量

### 工具性能对比

| 工具 | 检查 10000 文件耗时 | 说明 |
|------|---------------------|------|
| Ruff | ~1 秒 | Rust 实现，极速 |
| Flake8 | ~30 秒 | Python 实现 |
| pylint | ~2 分钟 | 最全面但最慢 |
| mypy | ~1-5 分钟 | 取决于项目复杂度 |

### 优化建议

1. **使用 Ruff 替代多个工具**：单个工具处理格式化和 linting
2. **增量检查**：只检查修改的文件
3. **并行执行**：配置工具使用多核
4. **缓存结果**：启用工具缓存机制

```bash
# Ruff 自动缓存
ruff check .

# mypy 增量模式
mypy --incremental src/

# pylint 并行
pylint -j 4 src/
```

## 实战场景

### 场景一：新项目初始化

```bash
# 创建项目结构
mkdir myproject && cd myproject
mkdir src tests

# 初始化 pyproject.toml
cat > pyproject.toml << 'EOF'
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.10"

[tool.ruff]
target-version = "py310"
line-length = 88

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "C4", "UP", "N", "S", "T20", "SIM", "RUF"]

[tool.mypy]
python_version = "3.10"
disallow_untyped_defs = true
EOF

# 创建 pre-commit 配置
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
EOF

# 安装工具
pip install ruff mypy pre-commit
pre-commit install

# 首次运行
pre-commit run --all-files
```

### 场景二：遗留项目迁移

```python
# migration_script.py
"""遗留项目代码质量工具迁移脚本"""
import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str]) -> tuple[int, str]:
    """运行命令并返回结果"""
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout + result.stderr


def migrate_project(project_path: Path) -> None:
    """迁移项目到新的代码质量工具链"""

    print("Step 1: 安装工具...")
    run_command([sys.executable, "-m", "pip", "install", "ruff", "black", "isort"])

    print("Step 2: 运行 Black 格式化...")
    run_command(["black", str(project_path)])

    print("Step 3: 运行 isort 排序导入...")
    run_command(["isort", "--profile", "black", str(project_path)])

    print("Step 4: 运行 Ruff 检查...")
    code, output = run_command(["ruff", "check", str(project_path)])
    print(f"Ruff 发现 {output.count('error')} 个问题")

    print("Step 5: 尝试自动修复...")
    run_command(["ruff", "check", "--fix", str(project_path)])

    print("迁移完成！请检查剩余问题并手动修复。")


if __name__ == "__main__":
    migrate_project(Path("."))
```

### 场景三：CI 流水线配置

```yaml
# 完整的 CI 流水线示例
name: Python CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy pytest pytest-cov
          pip install -e .

      - name: Lint with Ruff
        run: |
          ruff check --output-format=github .
          ruff format --check .

      - name: Type check with mypy
        run: mypy src/

      - name: Test with pytest
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
```

## 面试要点

### 基础问题

**Q1: 为什么要使用代码格式化工具？**

A: 代码格式化工具（如 Black）的主要好处：
1. **一致性**：团队代码风格统一，减少代码审查中的风格争论
2. **节省时间**：自动格式化，无需手动调整
3. **减少 diff**：格式统一后，PR 的差异更清晰
4. **降低认知负担**：不需要记忆和讨论代码风格规则

**Q2: Ruff 相比 Flake8 有什么优势？**

A:
1. **速度**：Rust 实现，比 Flake8 快 10-100 倍
2. **功能集成**：替代 Flake8、isort、pydocstyle 等多个工具
3. **自动修复**：支持自动修复大部分问题
4. **现代配置**：统一在 pyproject.toml 配置
5. **内置格式化**：`ruff format` 可替代 Black

**Q3: 什么是静态类型检查？mypy 如何工作？**

A: 静态类型检查是在不运行代码的情况下分析代码类型正确性。mypy 工作原理：
1. 解析源代码和类型注解
2. 构建类型推断图
3. 检查类型一致性
4. 报告类型错误

好处：提前发现类型错误、改善 IDE 支持、作为文档、提高代码可维护性。

### 进阶问题

**Q4: 如何在大型遗留项目中引入类型检查？**

A: 渐进式策略：
1. 配置宽松的 mypy 选项，忽略未注解代码
2. 为新代码强制添加类型注解
3. 使用 `--warn-unused-ignores` 追踪进度
4. 按模块逐步收紧检查
5. 使用 `monkeytype` 等工具自动生成类型注解

**Q5: pre-commit 钩子失败但必须紧急提交怎么办？**

A:
```bash
# 跳过所有钩子
git commit --no-verify -m "emergency fix"

# 但之后应该：
# 创建 issue 跟踪问题
# 尽快修复
# 理解为什么需要跳过
```

**Q6: 如何选择合适的代码质量工具组合？**

A: 考虑因素：
- **项目规模**：小项目用 Ruff，大项目可加 pylint
- **团队经验**：新团队从简单配置开始
- **性能要求**：CI 时间紧用 Ruff
- **类型安全**：重要项目启用 mypy strict 模式
- **现有工具**：渐进式迁移，不要一次性改变太多

## 延伸阅读

### 官方文档

- [Black 官方文档](https://black.readthedocs.io/)
- [Ruff 官方文档](https://docs.astral.sh/ruff/)
- [isort 官方文档](https://pycqa.github.io/isort/)
- [Flake8 官方文档](https://flake8.pycqa.org/)
- [pylint 官方文档](https://pylint.readthedocs.io/)
- [mypy 官方文档](https://mypy.readthedocs.io/)
- [pre-commit 官方文档](https://pre-commit.com/)

### PEP 规范

- [PEP 8 - Python 代码风格指南](https://peps.python.org/pep-0008/)
- [PEP 257 - 文档字符串规范](https://peps.python.org/pep-0257/)
- [PEP 484 - 类型提示](https://peps.python.org/pep-0484/)
- [PEP 585 - 泛型别名](https://peps.python.org/pep-0585/)

### 推荐阅读

- [Hypermodern Python](https://cjolowicz.github.io/posts/hypermodern-python-01-setup/)
- [Real Python - Python Code Quality](https://realpython.com/python-code-quality/)
- [mypy 类型检查指南](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)
