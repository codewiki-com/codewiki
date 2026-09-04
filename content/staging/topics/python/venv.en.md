---
title: Python 虚拟环境
description: 深入理解 Python 虚拟环境的原理与实践,掌握 venv、virtualenv、conda、pyenv 等工具的使用
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - 虚拟环境
  - venv
  - virtualenv
  - conda
  - pyenv
  - pip
  - 依赖管理
status: imported
origin: old/src/content/docs/python/venv.en.md
divergence: 0.2
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 包管理与项目结构
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is a Virtual Environment

A Python virtual environment is an independent directory tree that contains a specific version of the Python interpreter and a set of independently installed packages. It allows different projects to use different versions of packages without interfering with each other.

### Why Do We Need Virtual Environments

Without virtual environments, all Python packages are installed in the system-level site-packages directory, which leads to the following problems:

```
Problem Scenario:
Project A needs Django 2.2
Project B needs Django 4.0
Project C needs requests 2.25 + urllib3 1.26

If installed globally:
- Django can only have one version, unable to satisfy both Project A and B
- Package version conflicts may break the dependency chain
- Upgrading one project's dependencies may break other projects
```

Virtual environments solve these problems:

- **Isolation**: Each project has its own independent package space
- **Reproducibility**: Precisely control project dependency versions
- **Security**: No root/administrator privileges needed to install packages
- **Cleanliness**: System Python remains clean

### Historical Evolution

```
2007: virtualenv released (Ian Bicking)
         |
2011: virtualenvwrapper simplifies virtual environment management
         |
2012: conda released (Anaconda)
         |
2014: pyenv becomes popular (managing multiple Python versions)
         |
2015: Python 3.3 introduces venv module (PEP 405)
         |
2017: Pipenv attempts to unify package management and virtual environments
         |
2018: Poetry provides modern dependency management
         |
2024: uv brings ultra-fast virtual environment creation
```

## Core Principles

### How Virtual Environments Work

The core principle of virtual environments is to modify environment variables to change the paths where the Python interpreter looks for packages:

```python
# View Python's module search paths
import sys
print(sys.path)

# System environment output might be:
# ['', '/usr/lib/python3.10', '/usr/lib/python3.10/site-packages', ...]

# After activating virtual environment:
# ['', '/home/user/myproject/venv/lib/python3.10/site-packages',
#  '/usr/lib/python3.10', ...]
```

### Virtual Environment Directory Structure

```
myproject/
└── venv/                          # Virtual environment root directory
    ├── bin/                       # Unix systems (Scripts/ on Windows)
    │   ├── activate               # Bash activation script
    │   ├── activate.csh           # C Shell activation script
    │   ├── activate.fish          # Fish activation script
    │   ├── Activate.ps1           # PowerShell activation script
    │   ├── python -> python3.10   # Python interpreter symlink
    │   ├── python3 -> python3.10
    │   ├── python3.10             # Actual Python interpreter
    │   └── pip                    # pip executable
    ├── include/                   # C header files (for compiling extensions)
    │   └── python3.10/
    ├── lib/                       # Library files
    │   └── python3.10/
    │       └── site-packages/     # Installed third-party packages
    │           ├── pip/
    │           ├── setuptools/
    │           └── ...
    ├── lib64 -> lib               # Symlink for 64-bit systems
    └── pyvenv.cfg                 # Virtual environment configuration file
```

### pyvenv.cfg Configuration File

```ini
# pyvenv.cfg content example
home = /usr/bin                    # Base Python installation location
include-system-site-packages = false  # Whether to include system packages
version = 3.10.12                  # Python version
executable = /usr/bin/python3.10  # Original Python path
command = /usr/bin/python3 -m venv /home/user/myproject/venv
```

### How Activation Scripts Work

```bash
# Core operations of the activate script (simplified)

# Save original PATH
_OLD_VIRTUAL_PATH="$PATH"

# Add virtual environment's bin directory to the front of PATH
PATH="$VIRTUAL_ENV/bin:$PATH"
export PATH

# Set VIRTUAL_ENV environment variable
VIRTUAL_ENV="/home/user/myproject/venv"
export VIRTUAL_ENV

# Modify shell prompt
PS1="(venv) $PS1"

# Unset PYTHONHOME (if set)
unset PYTHONHOME
```

### How Python Interpreter Uses Virtual Environments

```python
# Python's path resolution process at startup
"""
1. Find executable location
2. Check if pyvenv.cfg exists in the same directory
3. If exists, read configuration to determine base Python installation
4. Build sys.path based on configuration
5. include-system-site-packages determines whether to include system packages
"""

import sys
import site

# View site-packages location
print(site.getsitepackages())
# Virtual environment: ['/home/user/myproject/venv/lib/python3.10/site-packages']

# Check if in virtual environment
print(sys.prefix)      # Virtual environment path
print(sys.base_prefix) # Base Python path
print(sys.prefix != sys.base_prefix)  # True indicates in virtual environment
```

## Key Points

### venv Module (Python Standard Library)

`venv` is the built-in virtual environment module in Python 3.3+, the officially recommended lightweight solution.

**Pros:**
- No additional installation required, comes with Python
- Lightweight and fast, quick to create
- Tightly integrated with Python version

**Cons:**
- Can only create environments for the current Python version
- Relatively simple functionality

### virtualenv (Third-party Tool)

`virtualenv` is a feature-rich virtual environment tool that predates venv.

**Pros:**
- Supports both Python 2 and Python 3
- Can create environments for different Python versions
- Faster creation (uses caching)
- More configuration options

**Cons:**
- Requires additional installation

### conda (Anaconda/Miniconda)

`conda` is a cross-language package manager and environment manager, particularly suitable for data science.

**Pros:**
- Can manage non-Python packages (such as CUDA, MKL)
- Built-in multi-version Python management
- Pre-compiled binary packages, avoiding compilation issues
- Powerful dependency resolution

**Cons:**
- Large footprint
- Mixing with pip may cause issues
- Package updates may lag behind PyPI

### pyenv (Python Version Management)

`pyenv` focuses on managing multiple Python versions, not package management.

**Pros:**
- Easily switch Python versions
- Supports installing multiple Python versions
- Can be combined with virtualenv

**Cons:**
- Primarily for Unix systems
- Requires compiling Python (slow for first installation)

### Tool Selection Guide

```
Scenario                          Recommended Tool
─────────────────────────────────────────
General Python projects           venv (standard library)
Need Python 2 support             virtualenv
Data science / Machine learning   conda
Need multiple Python versions     pyenv + venv
Enterprise project management     Poetry / PDM
Need maximum speed                uv
```

## Code Examples

### Using venv Module

```bash
# Create virtual environment
python3 -m venv myenv

# Create with specific Python version (if system has multiple versions)
python3.11 -m venv myenv

# Create without pip
python3 -m venv --without-pip myenv

# Create with system site-packages included
python3 -m venv --system-site-packages myenv

# Create and clear existing environment
python3 -m venv --clear myenv

# Upgrade core dependencies in virtual environment
python3 -m venv --upgrade myenv
```

```bash
# Activate virtual environment

# Linux / macOS (Bash/Zsh)
source myenv/bin/activate

# Windows (CMD)
myenv\Scripts\activate.bat

# Windows (PowerShell)
myenv\Scripts\Activate.ps1

# Fish shell
source myenv/bin/activate.fish

# Verify activation was successful
which python    # Linux/macOS
where python    # Windows
# Should display python path in virtual environment
```

```bash
# Deactivate virtual environment
deactivate
```

### Using virtualenv

```bash
# Install virtualenv
pip install virtualenv

# Create virtual environment
virtualenv myenv

# Specify Python interpreter
virtualenv -p python3.11 myenv
virtualenv --python=/usr/bin/python3.9 myenv

# Create with copies instead of symlinks
virtualenv --copies myenv

# Create blank environment (without pip, setuptools)
virtualenv --no-pip --no-setuptools myenv

# Use specific pip version
virtualenv --pip=23.0 myenv

# View help
virtualenv --help
```

### Using virtualenvwrapper

```bash
# Install (Unix systems)
pip install virtualenvwrapper

# Configure shell (~/.bashrc or ~/.zshrc)
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/projects
source /usr/local/bin/virtualenvwrapper.sh

# Create virtual environment
mkvirtualenv myproject

# Create and associate with project directory
mkproject myproject

# List all virtual environments
lsvirtualenv

# Switch virtual environment
workon myproject

# Deactivate current environment
deactivate

# Delete virtual environment
rmvirtualenv myproject

# Copy virtual environment
cpvirtualenv source_env dest_env
```

### conda Environment Management

```bash
# Create environment
conda create --name myenv python=3.10

# Create environment and install packages
conda create --name myenv python=3.10 numpy pandas

# Create from environment.yml
conda env create -f environment.yml

# Activate environment
conda activate myenv

# Deactivate environment
conda deactivate

# List all environments
conda env list
conda info --envs

# Delete environment
conda env remove --name myenv

# Export environment configuration
conda env export > environment.yml
conda env export --no-builds > environment.yml  # Cross-platform

# Clone environment
conda create --name myenv_clone --clone myenv
```

```yaml
# environment.yml example
name: myproject
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.10
  - numpy=1.24
  - pandas>=2.0
  - scikit-learn
  - pip
  - pip:
    - torch
    - transformers
```

### Using pyenv

```bash
# Install pyenv (macOS)
brew install pyenv

# Install pyenv (Linux)
curl https://pyenv.run | bash

# Configure shell (~/.bashrc or ~/.zshrc)
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# List available Python versions for installation
pyenv install --list

# Install specific version
pyenv install 3.11.4
pyenv install 3.10.12

# View installed versions
pyenv versions

# Set global default version
pyenv global 3.11.4

# Set version for current directory
pyenv local 3.10.12  # Creates .python-version file

# Set version for current shell
pyenv shell 3.9.17

# Uninstall version
pyenv uninstall 3.9.17
```

```bash
# pyenv-virtualenv plugin
# Install (macOS)
brew install pyenv-virtualenv

# Configure
eval "$(pyenv virtualenv-init -)"

# Create virtual environment
pyenv virtualenv 3.11.4 myproject-3.11

# Activate
pyenv activate myproject-3.11

# Auto-activate (in project directory)
pyenv local myproject-3.11

# Delete
pyenv virtualenv-delete myproject-3.11
```

### Using pip in Virtual Environments

```bash
# After activating virtual environment...

# Install packages
pip install requests
pip install requests==2.28.0
pip install "requests>=2.25,<3.0"

# Install from requirements.txt
pip install -r requirements.txt

# Upgrade package
pip install --upgrade requests

# Uninstall package
pip uninstall requests

# List installed packages
pip list
pip list --outdated

# Show package info
pip show requests

# Export dependencies
pip freeze > requirements.txt

# Export only direct dependencies (requires pip-tools)
pip-compile requirements.in > requirements.txt
```

```python
# requirements.txt example
# Fixed versions (recommended for deployment)
requests==2.28.2
numpy==1.24.0
pandas==2.0.0

# Version ranges (for library development)
requests>=2.25,<3.0
numpy>=1.20

# Install from Git
git+https://github.com/user/repo.git@v1.0.0
git+https://github.com/user/repo.git@main#egg=package

# Local package
./packages/mypackage
-e ./packages/mypackage  # Editable install

# Install from URL
https://example.com/package-1.0.tar.gz
```

### Programmatic Virtual Environment Operations

```python
import venv
import subprocess
import sys
import os

# Create virtual environment
def create_venv(path):
    """Create virtual environment using venv module"""
    builder = venv.EnvBuilder(
        system_site_packages=False,
        clear=True,
        with_pip=True,
        upgrade_deps=True
    )
    builder.create(path)
    print(f"Virtual environment created: {path}")

# Run command in virtual environment
def run_in_venv(venv_path, command):
    """Run command in specified virtual environment"""
    if sys.platform == 'win32':
        python = os.path.join(venv_path, 'Scripts', 'python.exe')
    else:
        python = os.path.join(venv_path, 'bin', 'python')

    result = subprocess.run(
        [python, '-c', command],
        capture_output=True,
        text=True
    )
    return result.stdout, result.stderr

# Install package in virtual environment
def install_package(venv_path, package):
    """Install package in specified virtual environment"""
    if sys.platform == 'win32':
        pip = os.path.join(venv_path, 'Scripts', 'pip.exe')
    else:
        pip = os.path.join(venv_path, 'bin', 'pip')

    subprocess.run([pip, 'install', package], check=True)

# Detect if currently in virtual environment
def is_in_virtualenv():
    """Detect if running in virtual environment"""
    return sys.prefix != sys.base_prefix

# Get virtual environment info
def get_venv_info():
    """Get detailed info about current virtual environment"""
    return {
        'in_venv': sys.prefix != sys.base_prefix,
        'prefix': sys.prefix,
        'base_prefix': sys.base_prefix,
        'executable': sys.executable,
        'version': sys.version,
        'path': sys.path
    }

# Usage example
if __name__ == '__main__':
    # Create virtual environment
    create_venv('./test_venv')

    # Install package in virtual environment
    install_package('./test_venv', 'requests')

    # Check virtual environment
    stdout, stderr = run_in_venv(
        './test_venv',
        'import requests; print(requests.__version__)'
    )
    print(f"requests version: {stdout.strip()}")
```

## Best Practices

### Project Structure Standards

```
myproject/
├── .venv/                    # Virtual environment directory (not committed to version control)
├── .gitignore               # Ignore .venv/
├── .python-version          # pyenv version file (optional)
├── requirements/
│   ├── base.txt             # Base dependencies
│   ├── dev.txt              # Development dependencies
│   └── prod.txt             # Production dependencies
├── pyproject.toml           # Modern project configuration
├── setup.py                 # Traditional installation script
├── src/
│   └── myproject/
│       ├── __init__.py
│       └── ...
├── tests/
│   └── ...
└── README.md
```

```gitignore
# .gitignore
# Virtual environments
.venv/
venv/
ENV/
env/

# IDE
.idea/
.vscode/

# Python
__pycache__/
*.pyc
*.pyo
.Python
*.egg-info/
dist/
build/
```

### Dependency Management Best Practices

```bash
# Layered dependency management

# requirements/base.txt - Core dependencies
requests>=2.28
pydantic>=2.0

# requirements/dev.txt - Development dependencies
-r base.txt
pytest>=7.0
black>=23.0
mypy>=1.0
pre-commit>=3.0

# requirements/prod.txt - Production dependencies
-r base.txt
gunicorn>=21.0
uvicorn>=0.23
```

```bash
# Using pip-tools to lock dependencies

# Install pip-tools
pip install pip-tools

# Create requirements.in (list only direct dependencies)
echo "requests" > requirements.in
echo "flask" >> requirements.in

# Compile to generate lock file (includes all indirect dependencies and exact versions)
pip-compile requirements.in

# Sync dependencies
pip-sync requirements.txt
```

### Automated Virtual Environment Management

```bash
# Makefile example
.PHONY: venv install test clean

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

# Create virtual environment
venv:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip setuptools wheel

# Install dependencies
install: venv
	$(PIP) install -r requirements/dev.txt
	$(PIP) install -e .

# Run tests
test:
	$(PYTHON) -m pytest tests/

# Clean up
clean:
	rm -rf $(VENV)
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
```

```bash
# Using direnv for auto-activation (after installing direnv)

# .envrc file
layout python3

# Or specify version
layout python python3.11

# First time entering directory
direnv allow
```

### Virtual Environments in CI/CD

```yaml
# GitHub Actions example
name: Python CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}

    - name: Cache pip packages
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements/dev.txt

    - name: Run tests
      run: pytest tests/
```

### Virtual Environments in Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV VIRTUAL_ENV=/opt/venv

# Create virtual environment
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app
WORKDIR /app

CMD ["python", "main.py"]
```

```dockerfile
# Multi-stage build (optimize image size)
# Build stage
FROM python:3.11-slim as builder

ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim

ENV VIRTUAL_ENV=/opt/venv
COPY --from=builder $VIRTUAL_ENV $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY . /app
WORKDIR /app

USER nobody
CMD ["python", "main.py"]
```

## Common Pitfalls

### Committing Virtual Environment to Version Control

```bash
# Wrong: Virtual environment should not be committed to Git
git add .venv/  # Don't do this!

# Correct: Add to .gitignore
echo ".venv/" >> .gitignore

# Why?
# - Virtual environment contains platform-specific binaries
# - Large size increases repository size
# - May be incompatible across different developers' systems
# - Dependencies should be recorded in requirements.txt
```

### Installing pip Packages Globally

```bash
# Wrong: Installing packages in system Python
pip install requests  # May pollute system environment

# Correct: Always install in virtual environment
python -m venv .venv
source .venv/bin/activate
pip install requests

# Or use --user flag (not recommended)
pip install --user requests
```

### Forgetting to Activate Virtual Environment

```bash
# Problem: Installed to wrong environment
pip install django  # May install to system environment

# Verify current environment
which python
# Should show virtual environment path: /path/to/venv/bin/python

# Or directly use pip from virtual environment
.venv/bin/pip install django
```

### Mixing pip and conda

```bash
# Problem: Using pip in conda environment may cause conflicts

# Recommended approach:
# Prefer using conda install
conda install numpy pandas

# If pip is necessary, declare in environment.yml
# pip install should come after conda install

# Check package sources
conda list  # Shows whether packages were installed via pip or conda
```

### Cross-platform requirements.txt Issues

```bash
# Problem: Some packages are only available on specific platforms
# For example, pywin32 is only valid on Windows

# Solution 1: Environment markers
pywin32; sys_platform == 'win32'
uvloop; sys_platform == 'linux' or sys_platform == 'darwin'

# Solution 2: Platform-specific files
# requirements/windows.txt
# requirements/linux.txt
```

### Virtual Environment Path Changes

```bash
# Problem: Virtual environment doesn't work after moving directory

# Reason: Virtual environment contains hardcoded paths
cat .venv/bin/activate | grep VIRTUAL_ENV
# VIRTUAL_ENV="/original/path/.venv"

# Solution: Don't move, recreate instead
rm -rf .venv
python -m venv .venv
pip install -r requirements.txt

# Or use relative path tools
# Poetry, PDM and other modern tools handle this better
```

### Python Version Mismatch

```bash
# Problem: Environment created with Python 3.11 doesn't work on Python 3.9 system

# Prevention:
# Document Python version requirements in README
# Declare version in pyproject.toml
# Test multiple versions in CI
```

```toml
# pyproject.toml
[project]
requires-python = ">=3.9,<4.0"
```

### Dependency Conflicts

```bash
# Problem: Dependency conflict when installing new package
pip install package-a  # Needs requests>=2.28
pip install package-b  # Needs requests<2.25

# Diagnosis
pip check  # Check for dependency conflicts

# Solutions
# Check if compatible versions exist
pip install "package-a" "package-b" --dry-run

# Use pip-tools or Poetry to resolve dependencies
pip-compile requirements.in

# Use multiple virtual environments if necessary
```

## Performance Considerations

### Virtual Environment Creation Speed Comparison

```bash
# Testing creation speed (approximate values)

# venv (Python 3.11)
time python -m venv test_venv
# real: 0.8s - 1.2s

# virtualenv (with caching)
time virtualenv test_venv
# real: 0.3s - 0.5s

# conda (creating new environment)
time conda create -n test_env python=3.11 -y
# real: 15s - 45s (depends on network)

# uv (Rust implementation)
time uv venv test_venv
# real: 0.01s - 0.05s
```

### Disk Space Usage

```bash
# Empty virtual environment size (approximate values)

# venv (Python 3.11)
du -sh .venv/
# About 15-20 MB

# virtualenv
# About 15-20 MB

# conda base environment
# About 400-500 MB

# conda minimal environment
# About 150-200 MB
```

### Optimization Tips

```bash
# Use symlinks instead of copies (default behavior)
python -m venv --symlinks .venv  # Explicitly specify

# Don't install unnecessary packages
python -m venv --without-pip .venv  # If using external pip

# Periodically clean cache
pip cache purge

# Use pip's parallel downloads
pip install -r requirements.txt --use-feature=fast-deps

# Consider using uv instead of pip (10-100x speed improvement)
pip install uv
uv pip install -r requirements.txt
```

### Memory Usage

```python
# Virtual environment itself doesn't use extra runtime memory
# Memory usage depends on installed packages

# Check memory impact of installed packages
import sys
import importlib

def get_module_size(module_name):
    """Estimate module memory usage"""
    module = importlib.import_module(module_name)
    return sys.getsizeof(module)

# Note: This is only the size of the module object itself
# Actual memory usage includes data loaded by module, caches, etc.
```

## Practical Scenarios

### Scenario 1: Multi-project Development Environment

```bash
# Directory structure
~/projects/
├── project-a/        # Django 4.x project
│   ├── .venv/
│   └── requirements.txt
├── project-b/        # Flask + legacy dependencies
│   ├── .venv/
│   └── requirements.txt
└── project-c/        # Data science project
    ├── .venv/
    └── requirements.txt

# Each project has independent virtual environment
cd ~/projects/project-a
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Use direnv for automatic switching
# ~/projects/project-a/.envrc
source .venv/bin/activate

# Auto-activate when entering directory
cd ~/projects/project-a  # Automatically activates project-a's virtual environment
```

### Scenario 2: Data Science Workflow

```bash
# Using conda to manage data science environment

# Create ML environment
conda create -n ml-env python=3.10

# Install data science stack
conda activate ml-env
conda install numpy pandas scikit-learn matplotlib jupyter

# Install PyTorch (specify CUDA version)
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

# Export environment for reproducibility
conda env export --no-builds > environment.yml

# Others can reproduce environment
conda env create -f environment.yml
```

```yaml
# environment.yml - Data science project
name: ml-project
channels:
  - pytorch
  - nvidia
  - conda-forge
  - defaults
dependencies:
  - python=3.10
  - numpy=1.24
  - pandas=2.0
  - scikit-learn=1.3
  - matplotlib=3.7
  - jupyter=1.0
  - pytorch=2.0
  - pytorch-cuda=11.8
  - pip
  - pip:
    - transformers==4.30
    - datasets==2.13
```

### Scenario 3: Microservices Deployment

```bash
# Independent dependency management for each microservice

services/
├── user-service/
│   ├── requirements.txt
│   └── Dockerfile
├── order-service/
│   ├── requirements.txt
│   └── Dockerfile
└── notification-service/
    ├── requirements.txt
    └── Dockerfile
```

```dockerfile
# services/user-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Run service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Scenario 4: Library Development and Testing

```bash
# Virtual environment strategy for Python library development

mylib/
├── src/
│   └── mylib/
│       └── __init__.py
├── tests/
├── pyproject.toml
├── requirements-dev.txt
└── tox.ini
```

```ini
# tox.ini - Multi-version testing
[tox]
envlist = py39,py310,py311

[testenv]
deps =
    pytest
    pytest-cov
commands =
    pytest tests/ --cov=mylib

[testenv:lint]
deps =
    black
    ruff
    mypy
commands =
    black --check src/
    ruff src/
    mypy src/
```

```bash
# Run multi-version tests
pip install tox
tox  # Automatically creates multiple virtual environments and runs tests
```

### Scenario 5: Legacy Project Migration

```bash
# Migrating from global installation to virtual environment

# Export currently installed packages
pip freeze > legacy_requirements.txt

# Create new virtual environment
python -m venv .venv
source .venv/bin/activate

# Try to install (may have version conflicts)
pip install -r legacy_requirements.txt

# Resolve conflicts, clean up unnecessary packages
# Edit requirements.txt, keep only packages the project truly needs

# Verify project runs correctly
python -m pytest tests/
```

## Interview Key Points

### Basic Concept Questions

**1. What is a Python virtual environment? Why do we need it?**

A virtual environment is an independent Python runtime environment that contains a specific version of the Python interpreter and independently installed packages. We need it because:
- Avoid dependency conflicts between different projects
- Keep system Python environment clean
- Ensure project dependencies are reproducible
- No administrator privileges needed to install packages

**2. What's the difference between venv and virtualenv?**

- `venv` is the built-in module in Python 3.3+, lightweight but limited in functionality, can only create environments for current Python version
- `virtualenv` is a third-party tool, more feature-rich, supports Python 2, can create environments for different versions, faster creation using caching

**3. How to detect if code is running in a virtual environment?**

```python
import sys

def is_in_virtualenv():
    return sys.prefix != sys.base_prefix
    # Or check VIRTUAL_ENV environment variable
    # return 'VIRTUAL_ENV' in os.environ
```

### Advanced Questions

**4. Explain what the virtual environment activation script does?**

The activation script mainly does the following:
1. Adds virtual environment's `bin/Scripts` directory to the front of PATH
2. Sets `VIRTUAL_ENV` environment variable to point to virtual environment path
3. Modifies shell prompt to display environment name
4. Unsets `PYTHONHOME` environment variable (if set)
5. Defines `deactivate` function to exit environment

**5. Why shouldn't you move a virtual environment directory?**

Virtual environments contain hardcoded absolute paths:
- `VIRTUAL_ENV` variable in activation scripts
- Shebang lines (`#!/path/to/venv/bin/python`)
- Symlinks pointing to original location

These paths become invalid after moving. The correct approach is to delete and recreate.

**6. Can conda and pip be used together?**

Technically yes, but be careful:
- Prioritize using conda install for packages
- pip installs should come after conda
- Declare pip dependencies in `environment.yml`
- Use `conda list` to check package sources
- Mixing may lead to inconsistent dependency resolution

### Practical Coding Questions

**7. Write a script to automatically set up project virtual environment**

```python
#!/usr/bin/env python3
"""Project initialization script"""
import subprocess
import sys
import os
from pathlib import Path

def setup_project(project_path: str):
    """Set up project virtual environment"""
    project = Path(project_path)
    venv_path = project / '.venv'
    requirements = project / 'requirements.txt'

    # 1. Create virtual environment
    print(f"Creating virtual environment: {venv_path}")
    subprocess.run([sys.executable, '-m', 'venv', str(venv_path)], check=True)

    # 2. Get pip in virtual environment
    if sys.platform == 'win32':
        pip = venv_path / 'Scripts' / 'pip.exe'
    else:
        pip = venv_path / 'bin' / 'pip'

    # 3. Upgrade pip
    print("Upgrading pip...")
    subprocess.run([str(pip), 'install', '--upgrade', 'pip'], check=True)

    # 4. Install dependencies
    if requirements.exists():
        print("Installing dependencies...")
        subprocess.run([str(pip), 'install', '-r', str(requirements)], check=True)

    print(f"\nSetup complete! Activate virtual environment:")
    if sys.platform == 'win32':
        print(f"  {venv_path}\\Scripts\\activate")
    else:
        print(f"  source {venv_path}/bin/activate")

if __name__ == '__main__':
    setup_project(sys.argv[1] if len(sys.argv) > 1 else '.')
```

**8. Implement a dependency version checking tool**

```python
#!/usr/bin/env python3
"""Check if dependency versions meet requirements"""
import subprocess
import sys
from packaging import version
from packaging.requirements import Requirement

def check_dependencies(requirements_file: str) -> list[str]:
    """Check dependency versions, return list of packages that don't meet requirements"""
    issues = []

    # Get installed packages
    result = subprocess.run(
        [sys.executable, '-m', 'pip', 'list', '--format=json'],
        capture_output=True, text=True
    )
    installed = {
        pkg['name'].lower(): pkg['version']
        for pkg in __import__('json').loads(result.stdout)
    }

    # Check each requirement
    with open(requirements_file) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            try:
                req = Requirement(line)
                pkg_name = req.name.lower()

                if pkg_name not in installed:
                    issues.append(f"Not installed: {req.name}")
                elif req.specifier and not req.specifier.contains(installed[pkg_name]):
                    issues.append(
                        f"Version mismatch: {req.name} "
                        f"(requires {req.specifier}, installed {installed[pkg_name]})"
                    )
            except Exception as e:
                issues.append(f"Cannot parse: {line} ({e})")

    return issues

if __name__ == '__main__':
    issues = check_dependencies('requirements.txt')
    if issues:
        print("Found the following issues:")
        for issue in issues:
            print(f"  - {issue}")
        sys.exit(1)
    else:
        print("All dependency versions meet requirements")
```

## Further Reading

### Official Documentation

- [venv Module Documentation](https://docs.python.org/3/library/venv.html) - Python official documentation
- [PEP 405 - Python Virtual Environments](https://peps.python.org/pep-0405/) - Virtual environment design proposal
- [pip User Guide](https://pip.pypa.io/en/stable/user_guide/) - Complete pip documentation
- [conda Documentation](https://docs.conda.io/en/latest/) - conda official documentation

### Tool Documentation

- [virtualenv Documentation](https://virtualenv.pypa.io/) - Complete virtualenv guide
- [pyenv GitHub](https://github.com/pyenv/pyenv) - pyenv project page
- [Poetry Documentation](https://python-poetry.org/docs/) - Modern dependency management tool
- [PDM Documentation](https://pdm-project.org/) - PEP 582 compatible package manager
- [uv Documentation](https://github.com/astral-sh/uv) - Ultra-fast Python package manager

### Advanced Topics

- [Pipenv vs Poetry vs PDM](https://ealizadeh.com/blog/guide-to-python-env-pkg-dependency-using-conda-poetry) - Tool comparison
- [Python Packaging User Guide](https://packaging.python.org/) - Official packaging guide
- [pip-tools](https://pip-tools.readthedocs.io/) - Dependency locking tool
- [Containerizing Python Applications](https://pythonspeed.com/docker/) - Docker best practices

### Related Standards

- [PEP 517](https://peps.python.org/pep-0517/) - Build system independent specification
- [PEP 518](https://peps.python.org/pep-0518/) - pyproject.toml specification
- [PEP 621](https://peps.python.org/pep-0621/) - Project metadata specification
- [PEP 582](https://peps.python.org/pep-0582/) - Local packages directory (draft)

---

> Virtual environments are foundational infrastructure for Python development. Mastering the principles of virtual environments and the use of various tools helps developers better manage project dependencies and avoid the common "it works on my machine" problem. It's recommended to choose the appropriate tool based on project requirements and develop the habit of always using virtual environments.
