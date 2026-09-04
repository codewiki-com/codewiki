---
title: Poetry Package Manager
description: Complete guide to Python Poetry, a modern dependency management and project build tool
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Poetry
  - 包管理
  - 依赖管理
status: imported
origin: old/src/content/docs/python/poetry.en.md
divergence: 0.214
issues: []
legacy:
  category: Python
  subcategory: 工具链
  order: 23
  lastUpdated: 2026-01-07
---

Poetry is one of the most popular modern package management and project build tools in the Python ecosystem. It provides an all-in-one solution for dependency management, virtual environment management, project building, and publishing, greatly simplifying the Python project development workflow.

## Introduction to Poetry

### Why Choose Poetry

Traditional Python package management tools (like pip + requirements.txt) have the following issues:

- Dependency resolution isn't smart enough, easily causing version conflicts
- Virtual environments need to be managed manually
- Lack of lock file mechanism, making it difficult to ensure environment consistency
- Build and publish workflows are cumbersome

Poetry solves these problems by providing:

- **Smart dependency resolution**: Automatically resolves version conflicts, ensuring dependency compatibility
- **Virtual environment management**: Automatically creates and manages project virtual environments
- **Lock file mechanism**: Ensures cross-environment consistency through `poetry.lock`
- **Modern configuration**: Uses `pyproject.toml` to unify project configuration management
- **One-click publishing**: Simplifies package building and publishing workflow

### Poetry Compared to Other Tools

| Feature | Poetry | pip + venv | Pipenv | PDM |
|---------|--------|------------|--------|-----|
| Dependency resolution | Smart | Basic | Smart | Smart |
| Virtual environment | Automatic | Manual | Automatic | Automatic |
| Lock file | Yes | No | Yes | Yes |
| Build & publish | Built-in | Requires additional tools | No | Built-in |
| PEP 621 | Supported | - | Not supported | Fully supported |

## Installing Poetry

### Official Installation Method (Recommended)

```bash
# Linux/macOS/WSL
curl -sSL https://install.python-poetry.org | python3 -

# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

### Install Using pipx

```bash
# Install pipx (if not already installed)
pip install pipx
pipx ensurepath

# Install Poetry using pipx
pipx install poetry
```

### Verify Installation

```bash
# Check version
poetry --version
# Output: Poetry (version 1.8.x)

# View help
poetry --help
```

### Configure Shell Auto-completion

```bash
# Bash
poetry completions bash >> ~/.bash_completion

# Zsh
poetry completions zsh > ~/.zfunc/_poetry

# Fish
poetry completions fish > ~/.config/fish/completions/poetry.fish
```

## Project Initialization

### Creating a New Project

Use `poetry new` to create a new project with standard structure:

```bash
poetry new my-project
```

Generated project structure:

```
my-project/
├── pyproject.toml
├── README.md
├── my_project/
│   └── __init__.py
└── tests/
    └── __init__.py
```

Create project with `src` layout:

```bash
poetry new --src my-project
```

Generated structure:

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

### Initializing an Existing Project

Initialize Poetry in an existing project directory:

```bash
cd existing-project
poetry init
```

This command interactively guides you through configuring project information:

```
This command will guide you through creating your pyproject.toml config.

Package name [existing-project]:
Version [0.1.0]:
Description []:  My Python project
Author [Your Name <your.email@example.com>, n to skip]:
License []:  MIT
Compatible Python versions [^3.9]:

Would you like to define your main dependencies interactively? (yes/no) [yes]
```

## pyproject.toml Configuration Guide

`pyproject.toml` is the core configuration file for Poetry projects, following PEP 518 and PEP 621 standards.

### Complete Configuration Example

```toml
[tool.poetry]
name = "my-awesome-project"
version = "0.1.0"
description = "An awesome Python project"
authors = ["John Doe <john@example.com>"]
license = "MIT"
readme = "README.md"
homepage = "https://github.com/username/my-awesome-project"
repository = "https://github.com/username/my-awesome-project"
documentation = "https://my-awesome-project.readthedocs.io"
keywords = ["python", "tools", "automation"]
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

# Package configuration
packages = [
    { include = "my_package", from = "src" }
]

# Include extra files
include = [
    { path = "CHANGELOG.md", format = "sdist" },
    { path = "tests", format = "sdist" }
]

# Exclude files
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

### Project Metadata Fields

| Field | Description | Required |
|-------|-------------|----------|
| `name` | Project name | Yes |
| `version` | Version number | Yes |
| `description` | Project description | No |
| `authors` | Author list | No |
| `license` | License | No |
| `readme` | README file path | No |
| `homepage` | Project homepage URL | No |
| `repository` | Repository URL | No |
| `documentation` | Documentation URL | No |
| `keywords` | Keyword list | No |
| `classifiers` | PyPI classifiers | No |

### Python Version Constraints

```toml
[tool.poetry.dependencies]
# Require Python 3.9 or higher, but lower than 4.0
python = "^3.9"

# Exact version range
python = ">=3.9,<3.13"

# Multiple version support
python = "^3.9 || ^3.10 || ^3.11"
```

## Dependency Management

### Adding Dependencies

```bash
# Add latest stable version
poetry add requests

# Add specific version
poetry add requests@2.28.0

# Add version range
poetry add "requests>=2.28.0,<3.0.0"

# Use caret constraint (allow compatible updates)
poetry add requests@^2.28.0

# Use tilde constraint (only allow patch updates)
poetry add requests@~2.28.0

# Add development dependency
poetry add pytest --group dev

# Add optional dependency
poetry add psycopg2 --optional
```

### Version Constraint Syntax

| Constraint | Example | Allowed Versions |
|------------|---------|------------------|
| Exact version | `1.2.3` | Only 1.2.3 |
| Caret | `^1.2.3` | >=1.2.3, <2.0.0 |
| Tilde | `~1.2.3` | >=1.2.3, <1.3.0 |
| Wildcard | `1.2.*` | >=1.2.0, <1.3.0 |
| Comparison | `>=1.2.3` | >=1.2.3 |
| Range | `>=1.2,<2.0` | >=1.2.0, <2.0.0 |

### Removing Dependencies

```bash
# Remove dependency
poetry remove requests

# Remove from dev group
poetry remove pytest --group dev
```

### Updating Dependencies

```bash
# Update all dependencies to latest compatible versions
poetry update

# Update specific package
poetry update requests

# Only update lock file, don't install
poetry update --lock

# View packages that can be updated
poetry show --outdated
```

### Viewing Dependency Information

```bash
# List all installed packages
poetry show

# Show dependency tree
poetry show --tree

# View specific package information
poetry show requests

# Show only top-level dependencies
poetry show --top-level

# Show outdated packages
poetry show --outdated
```

### Dependency Locking

```bash
# Generate/update lock file
poetry lock

# Regenerate lock file (ignore existing lock)
poetry lock --regenerate

# Verify lock file consistency with pyproject.toml
poetry check --lock
```

### Import Dependencies from Other Formats

```bash
# Import from requirements.txt
cat requirements.txt | xargs poetry add
```

### Export Dependencies

```bash
# Export to requirements.txt format
poetry export -f requirements.txt -o requirements.txt

# Include dev dependencies
poetry export -f requirements.txt --with dev -o requirements-dev.txt

# Include hashes (for security verification)
poetry export -f requirements.txt --with-hashes -o requirements.txt
```

## Virtual Environment Management

### Automatic Virtual Environment Creation

Poetry automatically creates and manages virtual environments by default:

```bash
# Virtual environment is automatically created when installing dependencies
poetry install
```

### Running Commands in Virtual Environment

```bash
# Run Python script
poetry run python my_script.py

# Run tests
poetry run pytest

# Run any command
poetry run black .
```

### Activating Virtual Environment

```bash
# Activate virtual environment shell
poetry shell

# Exit virtual environment
exit
```

### Virtual Environment Management Commands

```bash
# View virtual environment information
poetry env info

# View virtual environment path
poetry env info --path

# List all virtual environments
poetry env list

# Delete virtual environment
poetry env remove python3.9

# Use specific Python version
poetry env use python3.11

# Use system Python
poetry env use system
```

### Virtual Environment Configuration

```bash
# Create virtual environment in project directory (.venv)
poetry config virtualenvs.in-project true

# Custom virtual environment path
poetry config virtualenvs.path /path/to/envs

# Disable automatic virtual environment creation
poetry config virtualenvs.create false
```

## Dependency Group Management

Poetry supports grouping dependencies for different scenarios.

### Defining Dependency Groups

```toml
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"

# Dev dependency group
[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
black = "^24.0"
mypy = "^1.0"
ruff = "^0.1.0"

# Documentation dependency group
[tool.poetry.group.docs.dependencies]
mkdocs = "^1.5.0"
mkdocs-material = "^9.0"

# Test dependency group
[tool.poetry.group.test.dependencies]
pytest = "^8.0"
pytest-cov = "^4.0"
pytest-asyncio = "^0.21"

# Optional dependency group
[tool.poetry.group.optional]
optional = true

[tool.poetry.group.optional.dependencies]
pandas = "^2.0"
```

### Installing Specific Dependency Groups

```bash
# Install all dependencies (including all non-optional groups)
poetry install

# Exclude specific groups
poetry install --without dev,docs

# Install only specific groups
poetry install --only main

# Include optional groups
poetry install --with optional

# Sync install (remove packages not in configuration)
poetry install --sync

# Install only main dependencies, sync
poetry install --without dev --sync
```

## Scripts and Entry Points

### Defining Console Scripts

```toml
[tool.poetry.scripts]
# command_name = "module_path:function_name"
my-cli = "my_package.cli:main"
my-tool = "my_package.tools:run"
```

Corresponding Python code:

```python
# my_package/cli.py
import argparse

def main():
    parser = argparse.ArgumentParser(description="My CLI tool")
    parser.add_argument("name", help="Your name")
    args = parser.parse_args()
    print(f"Hello, {args.name}!")

if __name__ == "__main__":
    main()
```

Usage after installation:

```bash
# Install script
poetry install

# Run script
poetry run my-cli World
# Output: Hello, World!
```

### Defining GUI Scripts

```toml
[tool.poetry.gui-scripts]
my-gui-app = "my_package.gui:main"
```

### Defining Plugin Entry Points

```toml
[tool.poetry.plugins."my_app.plugins"]
plugin_name = "my_package.plugins:MyPlugin"
```

## Building and Publishing

### Building Package

```bash
# Build wheel and sdist
poetry build

# Build only wheel
poetry build -f wheel

# Build only sdist
poetry build -f sdist
```

Build output:

```
dist/
├── my_package-0.1.0-py3-none-any.whl
└── my_package-0.1.0.tar.gz
```

### Publishing to PyPI

#### Configure PyPI Credentials

```bash
# Use API Token (recommended)
poetry config pypi-token.pypi pypi-xxxxxxxxxxxxxxxx

# Or use username and password
poetry config http-basic.pypi username password
```

#### Publish Package

```bash
# Publish to PyPI
poetry publish

# Build and publish
poetry publish --build

# Dry run (don't actually publish)
poetry publish --dry-run
```

### Publishing to Private Repository

#### Configure Private Repository

```bash
# Add private repository
poetry config repositories.private https://private.pypi.example.com/simple/

# Configure credentials
poetry config http-basic.private username password
```

#### Publish to Private Repository

```bash
poetry publish -r private
```

### Publishing to TestPyPI

```bash
# Configure TestPyPI
poetry config repositories.testpypi https://test.pypi.org/legacy/
poetry config pypi-token.testpypi pypi-xxxxxxxxxxxxxxxx

# Publish to TestPyPI
poetry publish -r testpypi
```

## Advanced Configuration

### Poetry Global Configuration

```bash
# View all configuration
poetry config --list

# Set configuration item
poetry config <key> <value>

# Delete configuration item
poetry config --unset <key>
```

Common configuration items:

| Configuration | Description | Default |
|---------------|-------------|---------|
| `virtualenvs.create` | Whether to auto-create virtual environment | `true` |
| `virtualenvs.in-project` | Create .venv in project directory | `false` |
| `virtualenvs.path` | Virtual environment storage path | `{cache-dir}/virtualenvs` |
| `cache-dir` | Cache directory | System dependent |
| `installer.parallel` | Parallel installation | `true` |
| `installer.max-workers` | Maximum parallel workers | `null` (auto) |

### Configuring Private Package Sources

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

Source priorities:

- `default`: Default source, replaces PyPI
- `primary`: Primary source, used alongside PyPI
- `supplemental`: Supplemental source, used when PyPI doesn't have it
- `explicit`: Explicit source, only used when explicitly specified

Install package from specific source:

```toml
[tool.poetry.dependencies]
requests = { version = "^2.28.0", source = "private" }
torch = { version = "^2.0", source = "torch-cpu" }
```

### Optional Dependencies (Extras)

```toml
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"

# Optional dependencies
psycopg2 = { version = "^2.9", optional = true }
mysqlclient = { version = "^2.1", optional = true }
redis = { version = "^4.0", optional = true }

# Define extras
[tool.poetry.extras]
postgresql = ["psycopg2"]
mysql = ["mysqlclient"]
redis = ["redis"]
all = ["psycopg2", "mysqlclient", "redis"]
```

Installing extras:

```bash
# Install specific extra
poetry install --extras postgresql

# Install multiple extras
poetry install --extras "postgresql redis"
# or
poetry install -E postgresql -E redis

# Install all extras
poetry install --all-extras
```

When users install:

```bash
pip install my-package[postgresql,redis]
```

### Installing Dependencies from Git Repository

```toml
[tool.poetry.dependencies]
# Install from GitHub
my-package = { git = "https://github.com/user/repo.git" }

# Specify branch
my-package = { git = "https://github.com/user/repo.git", branch = "develop" }

# Specify tag
my-package = { git = "https://github.com/user/repo.git", tag = "v1.0.0" }

# Specify commit
my-package = { git = "https://github.com/user/repo.git", rev = "abc123" }

# Package in subdirectory
my-package = { git = "https://github.com/user/monorepo.git", subdirectory = "packages/my-package" }
```

### Installing Dependencies from Local Path

```toml
[tool.poetry.dependencies]
# Local path dependency
my-local-package = { path = "../my-local-package", develop = true }

# Local wheel file
my-wheel = { path = "./wheels/my_wheel-1.0.0-py3-none-any.whl" }
```

### URL Dependencies

```toml
[tool.poetry.dependencies]
my-package = { url = "https://example.com/my-package-1.0.0.tar.gz" }
```

## Best Practices

### Recommended Project Structure

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

### Best pyproject.toml Configuration

```toml
[tool.poetry]
name = "my-awesome-project"
version = "0.1.0"
description = "Project description"
authors = ["Developer <dev@example.com>"]
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

# Other tool configurations
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

### Version Management

```bash
# View current version
poetry version

# Update version
poetry version patch   # 0.1.0 -> 0.1.1
poetry version minor   # 0.1.1 -> 0.2.0
poetry version major   # 0.2.0 -> 1.0.0

# Set specific version
poetry version 2.0.0

# Pre-release versions
poetry version prepatch   # 1.0.0 -> 1.0.1a0
poetry version preminor   # 1.0.0 -> 1.1.0a0
poetry version premajor   # 1.0.0 -> 2.0.0a0
```

### Dynamic Version Management

Use `poetry-dynamic-versioning` plugin to get version from Git tags:

```bash
poetry self add poetry-dynamic-versioning
```

Configuration:

```toml
[tool.poetry-dynamic-versioning]
enable = true
vcs = "git"
style = "pep440"
```

### CI/CD Integration

GitHub Actions example:

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

### Common Problem Solutions

#### Slow Dependency Resolution

```bash
# Use new dependency resolver
poetry config experimental.new-installer true

# Increase parallel installation workers
poetry config installer.max-workers 10
```

#### Clear Cache

```bash
# Clear all cache
poetry cache clear --all .

# View cache
poetry cache list
```

#### Lock File Conflicts

```bash
# Regenerate lock file
poetry lock --regenerate
```

#### Virtual Environment Issues

```bash
# Delete and rebuild virtual environment
poetry env remove python
poetry install
```

### Poetry Plugins

```bash
# Install plugin
poetry self add poetry-plugin-export

# List installed plugins
poetry self show plugins

# Remove plugin
poetry self remove poetry-plugin-export
```

Common plugins:

- `poetry-plugin-export`: Export requirements.txt
- `poetry-dynamic-versioning`: Dynamic version management
- `poetry-plugin-up`: Interactive dependency updates

## Summary

Poetry is a powerful and modern Python package management tool. Its main advantages include:

1. **Unified project configuration**: Uses `pyproject.toml` to manage all project settings
2. **Smart dependency resolution**: Automatically handles complex dependency relationships
3. **Reproducible builds**: Ensures environment consistency through `poetry.lock`
4. **Simplified workflow**: All-in-one solution from development to publishing
5. **Excellent developer experience**: Automatic virtual environment management and intuitive CLI

By mastering Poetry, you can manage Python projects more efficiently and focus on writing code rather than dealing with dependency issues.
