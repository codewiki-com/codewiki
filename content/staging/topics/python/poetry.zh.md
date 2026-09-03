---
title: Poetry包管理器
description: Python Poetry完全指南，现代化的依赖管理与项目构建工具
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Poetry
  - 包管理
  - 依赖管理
status: imported
origin: old/src/content/docs/python/poetry.zh.md
divergence: 0.214
issues: []
legacy:
  category: Python
  subcategory: 工具链
  order: 23
  lastUpdated: 2026-01-07
---

Poetry 是 Python 生态系统中最受欢迎的现代化包管理和项目构建工具之一。它提供了依赖管理、虚拟环境管理、项目构建和发布等一站式解决方案，极大地简化了 Python 项目的开发流程。

## Poetry 简介

### 为什么选择 Poetry

传统的 Python 包管理工具（如 pip + requirements.txt）存在以下问题：

- 依赖解析不够智能，容易产生版本冲突
- 需要手动管理虚拟环境
- 缺乏锁文件机制，难以保证环境一致性
- 构建和发布流程繁琐

Poetry 解决了这些问题，提供了：

- **智能依赖解析**：自动解决版本冲突，确保依赖兼容性
- **虚拟环境管理**：自动创建和管理项目虚拟环境
- **锁文件机制**：通过 `poetry.lock` 确保跨环境一致性
- **现代化配置**：使用 `pyproject.toml` 统一管理项目配置
- **一键发布**：简化包的构建和发布流程

### Poetry 与其他工具对比

| 特性 | Poetry | pip + venv | Pipenv | PDM |
|------|--------|------------|--------|-----|
| 依赖解析 | 智能 | 基础 | 智能 | 智能 |
| 虚拟环境 | 自动 | 手动 | 自动 | 自动 |
| 锁文件 | 有 | 无 | 有 | 有 |
| 构建发布 | 内置 | 需额外工具 | 无 | 内置 |
| PEP 621 | 支持 | - | 不支持 | 完全支持 |

## 安装 Poetry

### 官方安装方式（推荐）

```bash
# Linux/macOS/WSL
curl -sSL https://install.python-poetry.org | python3 -

# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

### 使用 pipx 安装

```bash
# 安装 pipx（如果尚未安装）
pip install pipx
pipx ensurepath

# 使用 pipx 安装 Poetry
pipx install poetry
```

### 验证安装

```bash
# 检查版本
poetry --version
# 输出: Poetry (version 1.8.x)

# 查看帮助
poetry --help
```

### 配置 Shell 自动补全

```bash
# Bash
poetry completions bash >> ~/.bash_completion

# Zsh
poetry completions zsh > ~/.zfunc/_poetry

# Fish
poetry completions fish > ~/.config/fish/completions/poetry.fish
```

## 项目初始化

### 创建新项目

使用 `poetry new` 创建一个标准结构的新项目：

```bash
poetry new my-project
```

生成的项目结构：

```
my-project/
├── pyproject.toml
├── README.md
├── my_project/
│   └── __init__.py
└── tests/
    └── __init__.py
```

使用 `src` 布局创建项目：

```bash
poetry new --src my-project
```

生成的结构：

```
my-project/
├── pyproject.toml
├── README.md
├── src/
│   └── my_project/
│       └── __init__.py
└── tests/
    └── __init__.py
```

### 初始化现有项目

在已存在的项目目录中初始化 Poetry：

```bash
cd existing-project
poetry init
```

该命令会交互式地引导你配置项目信息：

```
This command will guide you through creating your pyproject.toml config.

Package name [existing-project]:
Version [0.1.0]:
Description []:  我的Python项目
Author [Your Name <your.email@example.com>, n to skip]:
License []:  MIT
Compatible Python versions [^3.9]:

Would you like to define your main dependencies interactively? (yes/no) [yes]
```

## pyproject.toml 配置详解

`pyproject.toml` 是 Poetry 项目的核心配置文件，遵循 PEP 518 和 PEP 621 标准。

### 完整配置示例

```toml
[tool.poetry]
name = "my-awesome-project"
version = "0.1.0"
description = "一个很棒的Python项目"
authors = ["张三 <zhangsan@example.com>"]
license = "MIT"
readme = "README.md"
homepage = "https://github.com/username/my-awesome-project"
repository = "https://github.com/username/my-awesome-project"
documentation = "https://my-awesome-project.readthedocs.io"
keywords = ["python", "工具", "自动化"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]

# 包含的包配置
packages = [
    { include = "my_package", from = "src" }
]

# 包含额外文件
include = [
    { path = "CHANGELOG.md", format = "sdist" },
    { path = "tests", format = "sdist" }
]

# 排除文件
exclude = ["my_package/excluded_module.py"]

[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"
pydantic = "^2.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
black = "^24.0"
mypy = "^1.0"

[tool.poetry.scripts]
my-cli = "my_package.cli:main"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

### 项目元数据字段

| 字段 | 说明 | 必填 |
|------|------|------|
| `name` | 项目名称 | 是 |
| `version` | 版本号 | 是 |
| `description` | 项目描述 | 否 |
| `authors` | 作者列表 | 否 |
| `license` | 许可证 | 否 |
| `readme` | README 文件路径 | 否 |
| `homepage` | 项目主页 URL | 否 |
| `repository` | 代码仓库 URL | 否 |
| `documentation` | 文档 URL | 否 |
| `keywords` | 关键词列表 | 否 |
| `classifiers` | PyPI 分类器 | 否 |

### Python 版本约束

```toml
[tool.poetry.dependencies]
# 要求 Python 3.9 或更高版本，但低于 4.0
python = "^3.9"

# 精确版本范围
python = ">=3.9,<3.13"

# 多版本支持
python = "^3.9 || ^3.10 || ^3.11"
```

## 依赖管理

### 添加依赖

```bash
# 添加最新稳定版
poetry add requests

# 添加指定版本
poetry add requests@2.28.0

# 添加版本范围
poetry add "requests>=2.28.0,<3.0.0"

# 使用 caret 约束（允许兼容更新）
poetry add requests@^2.28.0

# 使用 tilde 约束（只允许补丁更新）
poetry add requests@~2.28.0

# 添加开发依赖
poetry add pytest --group dev

# 添加可选依赖
poetry add psycopg2 --optional
```

### 版本约束语法

| 约束 | 示例 | 允许的版本 |
|------|------|-----------|
| 精确版本 | `1.2.3` | 仅 1.2.3 |
| Caret | `^1.2.3` | >=1.2.3, <2.0.0 |
| Tilde | `~1.2.3` | >=1.2.3, <1.3.0 |
| 通配符 | `1.2.*` | >=1.2.0, <1.3.0 |
| 比较 | `>=1.2.3` | >=1.2.3 |
| 范围 | `>=1.2,<2.0` | >=1.2.0, <2.0.0 |

### 移除依赖

```bash
# 移除依赖
poetry remove requests

# 从开发组移除
poetry remove pytest --group dev
```

### 更新依赖

```bash
# 更新所有依赖到最新兼容版本
poetry update

# 更新特定包
poetry update requests

# 只更新锁文件，不安装
poetry update --lock

# 查看可更新的包
poetry show --outdated
```

### 查看依赖信息

```bash
# 列出所有已安装的包
poetry show

# 显示依赖树
poetry show --tree

# 查看特定包信息
poetry show requests

# 只显示顶层依赖
poetry show --top-level

# 显示过时的包
poetry show --outdated
```

### 依赖锁定

```bash
# 生成/更新锁文件
poetry lock

# 重新生成锁文件（忽略现有锁定）
poetry lock --regenerate

# 验证锁文件与 pyproject.toml 一致性
poetry check --lock
```

### 从其他格式导入依赖

```bash
# 从 requirements.txt 导入
cat requirements.txt | xargs poetry add
```

### 导出依赖

```bash
# 导出为 requirements.txt 格式
poetry export -f requirements.txt -o requirements.txt

# 包含开发依赖
poetry export -f requirements.txt --with dev -o requirements-dev.txt

# 包含哈希值（用于安全验证）
poetry export -f requirements.txt --with-hashes -o requirements.txt
```

## 虚拟环境管理

### 自动创建虚拟环境

Poetry 默认会自动创建和管理虚拟环境：

```bash
# 安装依赖时自动创建虚拟环境
poetry install
```

### 在虚拟环境中运行命令

```bash
# 运行 Python 脚本
poetry run python my_script.py

# 运行测试
poetry run pytest

# 运行任意命令
poetry run black .
```

### 激活虚拟环境

```bash
# 激活虚拟环境的 shell
poetry shell

# 退出虚拟环境
exit
```

### 虚拟环境管理命令

```bash
# 查看虚拟环境信息
poetry env info

# 查看虚拟环境路径
poetry env info --path

# 列出所有虚拟环境
poetry env list

# 删除虚拟环境
poetry env remove python3.9

# 使用特定 Python 版本
poetry env use python3.11

# 使用系统 Python
poetry env use system
```

### 虚拟环境配置

```bash
# 将虚拟环境创建在项目目录下（.venv）
poetry config virtualenvs.in-project true

# 自定义虚拟环境路径
poetry config virtualenvs.path /path/to/envs

# 禁用自动创建虚拟环境
poetry config virtualenvs.create false
```

## 依赖组管理

Poetry 支持将依赖分组管理，便于不同场景使用。

### 定义依赖组

```toml
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"

# 开发依赖组
[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
black = "^24.0"
mypy = "^1.0"
ruff = "^0.1.0"

# 文档依赖组
[tool.poetry.group.docs.dependencies]
mkdocs = "^1.5.0"
mkdocs-material = "^9.0"

# 测试依赖组
[tool.poetry.group.test.dependencies]
pytest = "^8.0"
pytest-cov = "^4.0"
pytest-asyncio = "^0.21"

# 可选依赖组
[tool.poetry.group.optional]
optional = true

[tool.poetry.group.optional.dependencies]
pandas = "^2.0"
```

### 安装特定依赖组

```bash
# 安装所有依赖（包括所有非可选组）
poetry install

# 排除特定组
poetry install --without dev,docs

# 只安装特定组
poetry install --only main

# 包含可选组
poetry install --with optional

# 同步安装（移除未在配置中的包）
poetry install --sync

# 只安装主依赖，同步
poetry install --without dev --sync
```

## 脚本与入口点

### 定义控制台脚本

```toml
[tool.poetry.scripts]
# 命令名 = "模块路径:函数名"
my-cli = "my_package.cli:main"
my-tool = "my_package.tools:run"
```

对应的 Python 代码：

```python
# my_package/cli.py
import argparse

def main():
    parser = argparse.ArgumentParser(description="我的CLI工具")
    parser.add_argument("name", help="你的名字")
    args = parser.parse_args()
    print(f"你好，{args.name}！")

if __name__ == "__main__":
    main()
```

安装后使用：

```bash
# 安装脚本
poetry install

# 运行脚本
poetry run my-cli 世界
# 输出: 你好，世界！
```

### 定义 GUI 脚本

```toml
[tool.poetry.gui-scripts]
my-gui-app = "my_package.gui:main"
```

### 定义插件入口点

```toml
[tool.poetry.plugins."my_app.plugins"]
plugin_name = "my_package.plugins:MyPlugin"
```

## 构建与发布

### 构建包

```bash
# 构建 wheel 和 sdist
poetry build

# 只构建 wheel
poetry build -f wheel

# 只构建 sdist
poetry build -f sdist
```

构建输出：

```
dist/
├── my_package-0.1.0-py3-none-any.whl
└── my_package-0.1.0.tar.gz
```

### 发布到 PyPI

#### 配置 PyPI 凭据

```bash
# 使用 API Token（推荐）
poetry config pypi-token.pypi pypi-xxxxxxxxxxxxxxxx

# 或使用用户名密码
poetry config http-basic.pypi username password
```

#### 发布包

```bash
# 发布到 PyPI
poetry publish

# 构建并发布
poetry publish --build

# 试运行（不实际发布）
poetry publish --dry-run
```

### 发布到私有仓库

#### 配置私有仓库

```bash
# 添加私有仓库
poetry config repositories.private https://private.pypi.example.com/simple/

# 配置凭据
poetry config http-basic.private username password
```

#### 发布到私有仓库

```bash
poetry publish -r private
```

### 发布到 TestPyPI

```bash
# 配置 TestPyPI
poetry config repositories.testpypi https://test.pypi.org/legacy/
poetry config pypi-token.testpypi pypi-xxxxxxxxxxxxxxxx

# 发布到 TestPyPI
poetry publish -r testpypi
```

## 高级配置

### Poetry 全局配置

```bash
# 查看所有配置
poetry config --list

# 设置配置项
poetry config <key> <value>

# 删除配置项
poetry config --unset <key>
```

常用配置项：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `virtualenvs.create` | 是否自动创建虚拟环境 | `true` |
| `virtualenvs.in-project` | 在项目目录创建 .venv | `false` |
| `virtualenvs.path` | 虚拟环境存储路径 | `{cache-dir}/virtualenvs` |
| `cache-dir` | 缓存目录 | 系统相关 |
| `installer.parallel` | 并行安装 | `true` |
| `installer.max-workers` | 最大并行数 | `null` (自动) |

### 配置私有包源

```toml
[[tool.poetry.source]]
name = "private"
url = "https://private.pypi.example.com/simple/"
priority = "supplemental"

[[tool.poetry.source]]
name = "torch-cpu"
url = "https://download.pytorch.org/whl/cpu"
priority = "explicit"
```

源优先级：

- `default`: 默认源，替代 PyPI
- `primary`: 主要源，与 PyPI 一起使用
- `supplemental`: 补充源，PyPI 找不到时使用
- `explicit`: 显式源，只有明确指定时才使用

使用特定源安装包：

```toml
[tool.poetry.dependencies]
requests = { version = "^2.28.0", source = "private" }
torch = { version = "^2.0", source = "torch-cpu" }
```

### 可选依赖（Extras）

```toml
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"

# 可选依赖
psycopg2 = { version = "^2.9", optional = true }
mysqlclient = { version = "^2.1", optional = true }
redis = { version = "^4.0", optional = true }

# 定义 extras
[tool.poetry.extras]
postgresql = ["psycopg2"]
mysql = ["mysqlclient"]
redis = ["redis"]
all = ["psycopg2", "mysqlclient", "redis"]
```

安装 extras：

```bash
# 安装特定 extra
poetry install --extras postgresql

# 安装多个 extras
poetry install --extras "postgresql redis"
# 或
poetry install -E postgresql -E redis

# 安装所有 extras
poetry install --all-extras
```

用户安装时：

```bash
pip install my-package[postgresql,redis]
```

### 从 Git 仓库安装依赖

```toml
[tool.poetry.dependencies]
# 从 GitHub 安装
my-package = { git = "https://github.com/user/repo.git" }

# 指定分支
my-package = { git = "https://github.com/user/repo.git", branch = "develop" }

# 指定标签
my-package = { git = "https://github.com/user/repo.git", tag = "v1.0.0" }

# 指定提交
my-package = { git = "https://github.com/user/repo.git", rev = "abc123" }

# 子目录中的包
my-package = { git = "https://github.com/user/monorepo.git", subdirectory = "packages/my-package" }
```

### 从本地路径安装依赖

```toml
[tool.poetry.dependencies]
# 本地路径依赖
my-local-package = { path = "../my-local-package", develop = true }

# 本地 wheel 文件
my-wheel = { path = "./wheels/my_wheel-1.0.0-py3-none-any.whl" }
```

### URL 依赖

```toml
[tool.poetry.dependencies]
my-package = { url = "https://example.com/my-package-1.0.0.tar.gz" }
```

## 最佳实践

### 项目结构推荐

```
my-project/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── core.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_core.py
├── docs/
│   └── index.md
├── .gitignore
├── .pre-commit-config.yaml
├── pyproject.toml
├── poetry.lock
└── README.md
```

### pyproject.toml 最佳配置

```toml
[tool.poetry]
name = "my-awesome-project"
version = "0.1.0"
description = "项目描述"
authors = ["开发者 <dev@example.com>"]
license = "MIT"
readme = "README.md"
packages = [{ include = "my_package", from = "src" }]

[tool.poetry.dependencies]
python = "^3.9"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
pytest-cov = "^4.0"
black = "^24.0"
ruff = "^0.1.0"
mypy = "^1.0"
pre-commit = "^3.0"

[tool.poetry.group.docs.dependencies]
mkdocs = "^1.5"
mkdocs-material = "^9.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

# 其他工具配置
[tool.black]
line-length = 88
target-version = ['py39', 'py310', 'py311']

[tool.ruff]
line-length = 88
select = ["E", "F", "W", "I", "N", "UP", "B"]

[tool.mypy]
python_version = "3.9"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=my_package --cov-report=term-missing"
```

### 版本管理

```bash
# 查看当前版本
poetry version

# 更新版本
poetry version patch   # 0.1.0 -> 0.1.1
poetry version minor   # 0.1.1 -> 0.2.0
poetry version major   # 0.2.0 -> 1.0.0

# 设置特定版本
poetry version 2.0.0

# 预发布版本
poetry version prepatch   # 1.0.0 -> 1.0.1a0
poetry version preminor   # 1.0.0 -> 1.1.0a0
poetry version premajor   # 1.0.0 -> 2.0.0a0
```

### 动态版本管理

使用 `poetry-dynamic-versioning` 插件从 Git 标签获取版本：

```bash
poetry self add poetry-dynamic-versioning
```

配置：

```toml
[tool.poetry-dynamic-versioning]
enable = true
vcs = "git"
style = "pep440"
```

### CI/CD 集成

GitHub Actions 示例：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11', '3.12']

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          virtualenvs-create: true
          virtualenvs-in-project: true

      - name: Load cached venv
        id: cached-poetry-dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: venv-${{ runner.os }}-${{ matrix.python-version }}-${{ hashFiles('**/poetry.lock') }}

      - name: Install dependencies
        if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
        run: poetry install --no-interaction --no-root

      - name: Install project
        run: poetry install --no-interaction

      - name: Run tests
        run: poetry run pytest

      - name: Run linting
        run: |
          poetry run ruff check .
          poetry run mypy .
```

### 常见问题解决

#### 依赖解析慢

```bash
# 使用新的依赖解析器
poetry config experimental.new-installer true

# 增加并行安装数
poetry config installer.max-workers 10
```

#### 清除缓存

```bash
# 清除所有缓存
poetry cache clear --all .

# 查看缓存
poetry cache list
```

#### 锁文件冲突

```bash
# 重新生成锁文件
poetry lock --regenerate
```

#### 虚拟环境问题

```bash
# 删除并重建虚拟环境
poetry env remove python
poetry install
```

### Poetry 插件

```bash
# 安装插件
poetry self add poetry-plugin-export

# 列出已安装插件
poetry self show plugins

# 移除插件
poetry self remove poetry-plugin-export
```

常用插件：

- `poetry-plugin-export`: 导出 requirements.txt
- `poetry-dynamic-versioning`: 动态版本管理
- `poetry-plugin-up`: 交互式更新依赖

## 总结

Poetry 是一个强大而现代化的 Python 包管理工具，它的主要优势包括：

1. **统一的项目配置**：使用 `pyproject.toml` 管理所有项目设置
2. **智能依赖解析**：自动处理复杂的依赖关系
3. **可重现的构建**：通过 `poetry.lock` 确保环境一致性
4. **简化的工作流**：从开发到发布的一站式解决方案
5. **优秀的开发体验**：自动虚拟环境管理和直观的命令行接口

通过掌握 Poetry，你可以更高效地管理 Python 项目，专注于编写代码而不是处理依赖问题。
