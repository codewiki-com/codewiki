---
title: Python 打包与分发
description: 深入理解Python项目打包机制，掌握pyproject.toml、setup.py、wheel和PyPI发布全流程
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - 打包
  - pyproject.toml
  - setup.py
  - wheel
  - PyPI
  - twine
status: imported
origin: old/src/content/docs/python/packaging.zh.md
divergence: 0.289
issues:
  - order-mismatch
legacy:
  category: Python
  subcategory: 工具链
  order: 43
  lastUpdated: 2026-01-07
---

Python 打包是将代码组织成可分发、可安装的形式，使其能够被其他开发者或项目使用。本文将全面介绍 Python 打包生态系统，从传统的 setup.py 到现代的 pyproject.toml，帮助你掌握专业的打包技能。

## 概念解释

### 什么是 Python 打包

Python 打包是指将 Python 代码及其相关资源（如数据文件、文档等）组织成标准格式的分发包，使其能够通过 pip 等工具安装。打包后的代码可以上传到 PyPI（Python Package Index）供全球开发者使用。

### 打包的历史演进

Python 打包经历了多个阶段的发展：

1. **distutils 时代（1998年）**：Python 标准库中的打包工具，功能有限
2. **setuptools 时代（2004年）**：增强版的 distutils，引入了 `setup.py`
3. **wheel 格式（2012年，PEP 427）**：二进制分发格式，替代 egg
4. **pyproject.toml 时代（2016年起）**：
   - PEP 518（2016）：定义构建系统需求
   - PEP 517（2017）：定义构建后端接口
   - PEP 621（2020）：标准化项目元数据
   - PEP 660（2021）：可编辑安装支持

### 核心术语

| 术语 | 说明 |
|------|------|
| **sdist** | Source Distribution，源代码分发包（.tar.gz） |
| **wheel** | 预编译的二进制分发格式（.whl） |
| **build backend** | 构建后端，负责实际构建过程（如 setuptools、flit、hatch） |
| **build frontend** | 构建前端，调用后端进行构建（如 pip、build） |
| **PyPI** | Python Package Index，Python 官方包仓库 |
| **twine** | 安全上传包到 PyPI 的工具 |

## 核心原理

### 打包工作流程

```
源代码 → 构建前端(build/pip) → 构建后端(setuptools/flit/hatch)
                                    ↓
                              sdist + wheel
                                    ↓
                           twine → PyPI → pip install
```

### PEP 517/518 构建系统

PEP 517 和 PEP 518 定义了一个解耦的构建系统：

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]  # PEP 518: 构建依赖
build-backend = "setuptools.build_meta"    # PEP 517: 构建后端
```

构建前端（如 `python -m build`）会：
1. 读取 `build-system.requires`，安装构建依赖
2. 调用 `build-system.build-backend` 的标准接口
3. 后端执行实际构建，生成 sdist 和 wheel

### 包的结构

一个标准的 Python 包结构：

```
my_package/
├── pyproject.toml          # 项目配置（推荐）
├── setup.py                # 传统配置（可选）
├── setup.cfg               # 声明式配置（可选）
├── MANIFEST.in             # 源码包包含文件配置
├── README.md               # 项目说明
├── LICENSE                 # 许可证
├── src/                    # 源代码目录（推荐的 src 布局）
│   └── my_package/
│       ├── __init__.py
│       ├── core.py
│       └── utils.py
└── tests/                  # 测试目录
    ├── __init__.py
    └── test_core.py
```

## 核心要点

### 三种配置方式对比

| 特性 | setup.py | setup.cfg | pyproject.toml |
|------|----------|-----------|----------------|
| 格式 | Python 代码 | INI 格式 | TOML 格式 |
| 动态配置 | 完全支持 | 有限支持 | 有限支持 |
| 标准化 | 非标准 | 部分标准 | PEP 621 标准 |
| 可读性 | 一般 | 好 | 最好 |
| 推荐程度 | 不推荐（除非需要动态逻辑） | 过渡方案 | 强烈推荐 |

### 关键配置字段

**必填字段：**
- `name`：包名称
- `version`：版本号

**重要字段：**
- `description`：简短描述
- `readme`：README 文件
- `license`：许可证
- `authors`：作者信息
- `dependencies`：运行时依赖
- `python_requires`：Python 版本要求

## 代码示例

### 现代 pyproject.toml 配置（推荐）

```toml
# pyproject.toml - 完整示例
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-awesome-package"
version = "1.0.0"
description = "一个功能强大的Python工具包"
readme = "README.md"
license = {text = "MIT"}
authors = [
    {name = "张三", email = "zhangsan@example.com"},
    {name = "李四", email = "lisi@example.com"}
]
maintainers = [
    {name = "维护者", email = "maintainer@example.com"}
]
keywords = ["工具", "自动化", "Python"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Topic :: Software Development :: Libraries :: Python Modules",
]
requires-python = ">=3.9"
dependencies = [
    "requests>=2.28.0",
    "pydantic>=2.0",
    "click>=8.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=4.0",
    "black>=24.0",
    "mypy>=1.0",
    "ruff>=0.1.0",
]
docs = [
    "mkdocs>=1.5",
    "mkdocs-material>=9.0",
]
all = [
    "my-awesome-package[dev,docs]",
]

[project.urls]
Homepage = "https://github.com/username/my-awesome-package"
Documentation = "https://my-awesome-package.readthedocs.io"
Repository = "https://github.com/username/my-awesome-package.git"
Changelog = "https://github.com/username/my-awesome-package/blob/main/CHANGELOG.md"
"Bug Tracker" = "https://github.com/username/my-awesome-package/issues"

[project.scripts]
my-cli = "my_package.cli:main"
my-tool = "my_package.tools:run"

[project.gui-scripts]
my-gui = "my_package.gui:main"

[project.entry-points."my_app.plugins"]
plugin1 = "my_package.plugins:Plugin1"
plugin2 = "my_package.plugins:Plugin2"

# setuptools 特定配置
[tool.setuptools]
package-dir = {"" = "src"}
include-package-data = true

[tool.setuptools.packages.find]
where = ["src"]
include = ["my_package*"]
exclude = ["tests*"]

[tool.setuptools.package-data]
my_package = ["*.json", "*.yaml", "templates/*"]

# 动态字段（从其他来源获取）
[project.dynamic]
# version = ["attr: my_package.__version__"]
```

### 动态版本配置

从 `__init__.py` 读取版本：

```toml
# pyproject.toml
[project]
name = "my-package"
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "my_package.__version__"}
```

```python
# src/my_package/__init__.py
__version__ = "1.0.0"
```

从文件读取版本：

```toml
# pyproject.toml
[project]
name = "my-package"
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {file = "VERSION"}
```

使用 setuptools-scm 从 Git 标签获取版本：

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61.0", "setuptools-scm>=8.0"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
dynamic = ["version"]

[tool.setuptools_scm]
write_to = "src/my_package/_version.py"
version_scheme = "release-branch-semver"
```

### 传统 setup.py 配置

虽然不推荐，但了解 setup.py 仍然重要：

```python
# setup.py
from setuptools import setup, find_packages
import os

# 读取 README
def read_file(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), encoding='utf-8') as f:
        return f.read()

# 读取版本号
def get_version():
    version_file = os.path.join('src', 'my_package', '__init__.py')
    with open(version_file, encoding='utf-8') as f:
        for line in f:
            if line.startswith('__version__'):
                return line.split('=')[1].strip().strip('"\'')
    raise RuntimeError('Version not found')

setup(
    name='my-awesome-package',
    version=get_version(),
    author='张三',
    author_email='zhangsan@example.com',
    description='一个功能强大的Python工具包',
    long_description=read_file('README.md'),
    long_description_content_type='text/markdown',
    url='https://github.com/username/my-awesome-package',
    project_urls={
        'Documentation': 'https://my-awesome-package.readthedocs.io',
        'Bug Tracker': 'https://github.com/username/my-awesome-package/issues',
    },
    license='MIT',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
    package_dir={'': 'src'},
    packages=find_packages(where='src'),
    python_requires='>=3.9',
    install_requires=[
        'requests>=2.28.0',
        'pydantic>=2.0',
        'click>=8.0',
    ],
    extras_require={
        'dev': [
            'pytest>=8.0',
            'black>=24.0',
            'mypy>=1.0',
        ],
        'docs': [
            'mkdocs>=1.5',
        ],
    },
    entry_points={
        'console_scripts': [
            'my-cli=my_package.cli:main',
        ],
    },
    include_package_data=True,
    package_data={
        'my_package': ['*.json', 'templates/*'],
    },
    zip_safe=False,
)
```

### setup.cfg 配置

声明式配置风格：

```ini
# setup.cfg
[metadata]
name = my-awesome-package
version = attr: my_package.__version__
author = 张三
author_email = zhangsan@example.com
description = 一个功能强大的Python工具包
long_description = file: README.md
long_description_content_type = text/markdown
url = https://github.com/username/my-awesome-package
license = MIT
classifiers =
    Development Status :: 4 - Beta
    Intended Audience :: Developers
    License :: OSI Approved :: MIT License
    Programming Language :: Python :: 3
    Programming Language :: Python :: 3.9
    Programming Language :: Python :: 3.10
    Programming Language :: Python :: 3.11

[options]
package_dir =
    = src
packages = find:
python_requires = >=3.9
install_requires =
    requests>=2.28.0
    pydantic>=2.0
    click>=8.0
include_package_data = True
zip_safe = False

[options.packages.find]
where = src

[options.extras_require]
dev =
    pytest>=8.0
    black>=24.0
    mypy>=1.0

[options.entry_points]
console_scripts =
    my-cli = my_package.cli:main

[options.package_data]
my_package = *.json, templates/*
```

配合最小化的 setup.py：

```python
# setup.py
from setuptools import setup
setup()
```

### MANIFEST.in 文件

控制源码包（sdist）包含的文件：

```
# MANIFEST.in

# 包含文件
include LICENSE
include README.md
include CHANGELOG.md
include pyproject.toml
include setup.py
include setup.cfg

# 包含目录
recursive-include src *.py
recursive-include src *.pyi
recursive-include src *.json
recursive-include src *.yaml
recursive-include docs *

# 排除文件
exclude .gitignore
exclude .pre-commit-config.yaml

# 排除目录
global-exclude __pycache__
global-exclude *.py[cod]
global-exclude .git
global-exclude .mypy_cache
prune tests
prune .github
```

### 构建与安装命令

```bash
# 安装构建工具
pip install build twine

# 构建包（生成 sdist 和 wheel）
python -m build

# 只构建 wheel
python -m build --wheel

# 只构建 sdist
python -m build --sdist

# 查看构建产物
ls dist/
# my_awesome_package-1.0.0-py3-none-any.whl
# my_awesome_package-1.0.0.tar.gz

# 检查包
twine check dist/*

# 本地安装测试
pip install dist/my_awesome_package-1.0.0-py3-none-any.whl

# 可编辑安装（开发模式）
pip install -e .

# 安装带可选依赖
pip install -e ".[dev,docs]"
```

### 发布到 PyPI

```bash
# 注册 PyPI 账号后，创建 API Token
# https://pypi.org/manage/account/token/

# 配置 twine（创建 ~/.pypirc）
cat > ~/.pypirc << 'EOF'
[pypi]
username = __token__
password = pypi-xxxxxxxxxxxxxxxxxxxxxxxx

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-xxxxxxxxxxxxxxxxxxxxxxxx
EOF

# 上传到 TestPyPI（测试）
twine upload --repository testpypi dist/*

# 从 TestPyPI 安装测试
pip install --index-url https://test.pypi.org/simple/ my-awesome-package

# 上传到正式 PyPI
twine upload dist/*

# 使用环境变量（更安全，适合 CI/CD）
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-xxxxxxxxxxxxxxxxxxxxxxxx
twine upload dist/*
```

### CI/CD 自动发布

GitHub Actions 示例：

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install build twine

      - name: Build package
        run: python -m build

      - name: Check package
        run: twine check dist/*

      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
        run: twine upload dist/*
```

使用 Trusted Publishers（更安全，无需 Token）：

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install build

      - name: Build package
        run: python -m build

      - name: Store artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish:
    needs: build
    runs-on: ubuntu-latest
    environment: pypi
    permissions:
      id-token: write  # 用于 Trusted Publishers

    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
```

### 不同构建后端示例

**Flit 配置：**

```toml
# pyproject.toml
[build-system]
requires = ["flit_core>=3.4"]
build-backend = "flit_core.buildapi"

[project]
name = "my-package"
version = "1.0.0"
description = "My package"
readme = "README.md"
requires-python = ">=3.9"
license = {file = "LICENSE"}
authors = [{name = "Author", email = "author@example.com"}]
dependencies = ["requests>=2.28"]

[project.scripts]
my-cli = "my_package:main"
```

**Hatchling 配置：**

```toml
# pyproject.toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "1.0.0"
description = "My package"
readme = "README.md"
requires-python = ">=3.9"
dependencies = ["requests>=2.28"]

[tool.hatch.build.targets.wheel]
packages = ["src/my_package"]

[tool.hatch.build.targets.sdist]
include = ["/src", "/tests"]
```

**PDM 配置：**

```toml
# pyproject.toml
[build-system]
requires = ["pdm-backend"]
build-backend = "pdm.backend"

[project]
name = "my-package"
version = "1.0.0"
description = "My package"
readme = "README.md"
requires-python = ">=3.9"
dependencies = ["requests>=2.28"]

[tool.pdm.build]
includes = ["src/my_package"]
```

### 包含数据文件

```toml
# pyproject.toml
[tool.setuptools]
include-package-data = true

[tool.setuptools.package-data]
my_package = [
    "*.json",
    "*.yaml",
    "*.yml",
    "templates/*.html",
    "static/**/*",
    "data/*.csv",
]
```

在代码中访问数据文件：

```python
# my_package/utils.py
from importlib import resources

# Python 3.9+
def load_config():
    # 使用 files API（推荐）
    config_file = resources.files('my_package').joinpath('config.json')
    return config_file.read_text()

def load_template(name: str) -> str:
    template_path = resources.files('my_package.templates').joinpath(name)
    return template_path.read_text()

# 兼容旧版本
try:
    from importlib.resources import files
except ImportError:
    from importlib_resources import files
```

## 最佳实践

### 项目结构推荐

使用 src 布局，避免导入问题：

```
my-project/
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── py.typed          # 标记为类型化包
│       ├── core.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_core.py
├── docs/
├── pyproject.toml
├── README.md
├── LICENSE
├── CHANGELOG.md
└── .gitignore
```

### 版本号规范

遵循语义化版本（Semantic Versioning）：

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

1.0.0        # 正式版本
1.0.1        # 补丁版本（bug 修复）
1.1.0        # 次版本（新功能，向后兼容）
2.0.0        # 主版本（破坏性变更）
1.0.0a1      # Alpha 预发布
1.0.0b1      # Beta 预发布
1.0.0rc1     # Release Candidate
1.0.0.post1  # 发布后修正
1.0.0.dev1   # 开发版本
```

### 分类器（Classifiers）选择

```toml
classifiers = [
    # 开发状态
    "Development Status :: 1 - Planning",
    "Development Status :: 2 - Pre-Alpha",
    "Development Status :: 3 - Alpha",
    "Development Status :: 4 - Beta",
    "Development Status :: 5 - Production/Stable",
    "Development Status :: 6 - Mature",

    # 目标用户
    "Intended Audience :: Developers",
    "Intended Audience :: Science/Research",

    # 许可证
    "License :: OSI Approved :: MIT License",
    "License :: OSI Approved :: Apache Software License",

    # 操作系统
    "Operating System :: OS Independent",
    "Operating System :: POSIX :: Linux",
    "Operating System :: Microsoft :: Windows",
    "Operating System :: MacOS",

    # Python 版本
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3 :: Only",

    # 类型提示
    "Typing :: Typed",

    # 主题
    "Topic :: Software Development :: Libraries :: Python Modules",
]
```

### 依赖版本约束策略

```toml
[project]
dependencies = [
    # 最小版本约束（推荐用于库）
    "requests>=2.28.0",

    # 兼容版本约束
    "pydantic>=2.0,<3.0",

    # 精确版本（谨慎使用）
    "critical-lib==1.2.3",

    # 排除特定版本
    "buggy-lib>=1.0,!=1.2.0",

    # 带 extras 的依赖
    "httpx[http2]>=0.24",
]
```

### 类型提示支持

创建 `py.typed` 标记文件：

```bash
touch src/my_package/py.typed
```

配置 mypy：

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.9"
strict = true
warn_return_any = true
warn_unused_ignores = true

[[tool.mypy.overrides]]
module = "tests.*"
ignore_missing_imports = true
```

### 完整的 pyproject.toml 模板

```toml
# pyproject.toml - 生产就绪模板

[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "1.0.0"
description = "项目描述"
readme = "README.md"
license = {text = "MIT"}
authors = [
    {name = "作者", email = "author@example.com"}
]
keywords = ["python", "工具"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Typing :: Typed",
]
requires-python = ">=3.9"
dependencies = [
    "requests>=2.28.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=4.0",
    "black>=24.0",
    "ruff>=0.1.0",
    "mypy>=1.0",
    "pre-commit>=3.0",
]
docs = [
    "mkdocs>=1.5",
    "mkdocs-material>=9.0",
]

[project.urls]
Homepage = "https://github.com/username/my-package"
Documentation = "https://my-package.readthedocs.io"
Repository = "https://github.com/username/my-package"
Changelog = "https://github.com/username/my-package/blob/main/CHANGELOG.md"

[project.scripts]
my-cli = "my_package.cli:main"

[tool.setuptools]
package-dir = {"" = "src"}
include-package-data = true

[tool.setuptools.packages.find]
where = ["src"]

# 代码格式化
[tool.black]
line-length = 88
target-version = ["py39", "py310", "py311", "py312"]

# 代码检查
[tool.ruff]
line-length = 88
select = ["E", "F", "W", "I", "N", "UP", "B", "C4", "PT"]
ignore = ["E501"]

[tool.ruff.isort]
known-first-party = ["my_package"]

# 类型检查
[tool.mypy]
python_version = "3.9"
strict = true
warn_return_any = true

# 测试
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=my_package --cov-report=term-missing"

[tool.coverage.run]
source = ["src/my_package"]
branch = true

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

## 常见陷阱

### 导入问题

**问题**：平级布局导致测试时导入错误的包

```
my-package/           # 错误示例
├── my_package/
│   └── __init__.py
├── tests/
│   └── test_core.py  # import my_package 可能导入本地目录
└── pyproject.toml
```

**解决方案**：使用 src 布局

```
my-package/           # 正确示例
├── src/
│   └── my_package/
│       └── __init__.py
├── tests/
│   └── test_core.py
└── pyproject.toml
```

### 缺少数据文件

**问题**：数据文件未包含在分发包中

**解决方案**：

```toml
# pyproject.toml
[tool.setuptools]
include-package-data = true

[tool.setuptools.package-data]
my_package = ["*.json", "data/*"]
```

并确保 MANIFEST.in 正确配置：

```
include src/my_package/*.json
recursive-include src/my_package/data *
```

### 版本不一致

**问题**：多处定义版本，容易不一致

**解决方案**：单一版本来源

```toml
# pyproject.toml
[project]
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "my_package.__version__"}
```

### 依赖版本过于宽松

**问题**：`requests` 没有版本约束，可能导致兼容问题

**解决方案**：始终指定最小版本

```toml
dependencies = [
    "requests>=2.28.0",  # 指定最小版本
]
```

### wheel 构建失败

**问题**：C 扩展或特定平台依赖导致构建失败

**解决方案**：提供预编译 wheel 或在构建时指定依赖

```toml
# pyproject.toml
[build-system]
requires = [
    "setuptools>=61.0",
    "wheel",
    "cython>=3.0",  # 如果有 Cython 代码
]
```

### 命名冲突

**问题**：包名与 PyPI 上已有包冲突

**解决方案**：发布前检查

```bash
# 检查包名是否已被使用
pip index versions my-package-name

# 或访问 https://pypi.org/project/my-package-name/
```

## 性能考量

### wheel vs sdist 安装速度

- **wheel**：预编译，安装快，无需构建
- **sdist**：需要编译，安装慢，但更通用

**建议**：同时提供 wheel 和 sdist

### 包大小优化

```toml
# 排除不必要的文件
[tool.setuptools]
exclude-package-data = {"" = ["tests*", "docs*", "*.pyc"]}
```

### 可选依赖

将大型依赖设为可选，减少默认安装大小：

```toml
[project]
dependencies = [
    "requests>=2.28.0",  # 核心依赖
]

[project.optional-dependencies]
ml = ["numpy>=1.24", "pandas>=2.0"]  # 可选的机器学习依赖
```

## 实战场景

### 场景 1：创建一个 CLI 工具

```python
# src/my_cli/__init__.py
__version__ = "1.0.0"

# src/my_cli/main.py
import click

@click.group()
@click.version_option()
def cli():
    """我的命令行工具"""
    pass

@cli.command()
@click.argument('name')
def greet(name):
    """向某人问好"""
    click.echo(f'你好，{name}！')

def main():
    cli()
```

```toml
# pyproject.toml
[project]
name = "my-cli-tool"
version = "1.0.0"
dependencies = ["click>=8.0"]

[project.scripts]
my-cli = "my_cli.main:main"
```

### 场景 2：发布带有 C 扩展的包

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61.0", "wheel", "cython>=3.0"]
build-backend = "setuptools.build_meta"

[tool.setuptools]
ext-modules = [
    {name = "my_package._speedups", sources = ["src/my_package/_speedups.pyx"]}
]
```

### 场景 3：私有 PyPI 仓库发布

```bash
# 配置私有仓库
cat >> ~/.pypirc << 'EOF'
[private]
repository = https://private.pypi.company.com/
username = __token__
password = private-token-xxx
EOF

# 上传到私有仓库
twine upload --repository private dist/*
```

## 面试要点

### Q1: setup.py 和 pyproject.toml 的区别是什么？

**答案**：
- `setup.py` 是传统的 Python 脚本配置，灵活但不标准化
- `pyproject.toml` 是 PEP 517/518/621 标准化的配置格式
- pyproject.toml 是声明式的，更易读、可维护
- pyproject.toml 可以集成多个工具的配置
- 推荐使用 pyproject.toml 作为新项目的首选

### Q2: wheel 和 sdist 有什么区别？

**答案**：
- **sdist**（Source Distribution）：包含源代码，安装时需要构建
- **wheel**：预编译的二进制格式，安装快，无需构建过程
- wheel 是 `.whl` 文件，实际上是 ZIP 格式
- wheel 可以是纯 Python（`-py3-none-any.whl`）或平台特定的
- 发布时应同时提供 sdist 和 wheel

### Q3: 如何处理包中的数据文件？

**答案**：
1. 使用 `package_data` 或 `include-package-data` 包含文件
2. 使用 `importlib.resources` API 访问数据文件
3. 在 MANIFEST.in 中声明源码包包含的文件
4. 避免使用 `__file__` 定位资源，因为在 ZIP 导入时会失败

### Q4: 什么是 PEP 517/518？

**答案**：
- **PEP 518**：定义 `pyproject.toml` 中的 `[build-system]` 表，声明构建依赖
- **PEP 517**：定义构建后端的标准接口（`build_wheel`、`build_sdist` 等）
- 这两个 PEP 实现了构建前端和后端的解耦
- 允许使用不同的构建后端（setuptools、flit、hatch、poetry 等）

### Q5: 如何安全地发布包到 PyPI？

**答案**：
1. 使用 API Token 而非密码
2. 使用 Trusted Publishers（GitHub OIDC）
3. 先发布到 TestPyPI 测试
4. 使用 `twine check` 验证包
5. 在 CI/CD 中自动发布，避免手动操作
6. 启用 PyPI 的 2FA

## 延伸阅读

### 官方文档

- [Python Packaging User Guide](https://packaging.python.org/)
- [PEP 517 - Build System Interface](https://peps.python.org/pep-0517/)
- [PEP 518 - Build System Requirements](https://peps.python.org/pep-0518/)
- [PEP 621 - Project Metadata](https://peps.python.org/pep-0621/)
- [setuptools 文档](https://setuptools.pypa.io/)

### 构建工具

- [build - Python Build Frontend](https://pypa-build.readthedocs.io/)
- [twine - PyPI 上传工具](https://twine.readthedocs.io/)
- [flit - 简化的打包工具](https://flit.pypa.io/)
- [hatch - 现代项目管理工具](https://hatch.pypa.io/)
- [PDM - 现代包管理器](https://pdm-project.org/)

### 推荐资源

- [PyPI Help - Trusted Publishers](https://docs.pypi.org/trusted-publishers/)
- [Hypermodern Python](https://cjolowicz.github.io/posts/hypermodern-python-01-setup/)
- [Real Python - Python Packages](https://realpython.com/pypi-publish-python-package/)
