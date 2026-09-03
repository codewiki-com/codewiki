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
origin: old/src/content/docs/python/venv.zh.md
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

## 概念解释

### 什么是虚拟环境

Python 虚拟环境是一个独立的目录树,包含特定版本的 Python 解释器和一组独立安装的包。它允许不同项目使用不同版本的包,而不会相互干扰。

### 为什么需要虚拟环境

在没有虚拟环境的情况下,所有 Python 包都安装在系统级别的 site-packages 目录中,这会导致以下问题:

```
问题场景:
项目 A 需要 Django 2.2
项目 B 需要 Django 4.0
项目 C 需要 requests 2.25 + urllib3 1.26

如果全局安装:
- Django 只能有一个版本,无法同时满足项目 A 和 B
- 包版本冲突可能导致依赖链断裂
- 升级一个项目的依赖可能破坏其他项目
```

虚拟环境解决了这些问题:

- **隔离性**: 每个项目有独立的包空间
- **可复现性**: 精确控制项目依赖版本
- **安全性**: 不需要 root/管理员权限安装包
- **整洁性**: 系统 Python 保持干净

### 历史演变

```
2007 年: virtualenv 发布 (Ian Bicking)
         ↓
2011 年: virtualenvwrapper 简化虚拟环境管理
         ↓
2012 年: conda 发布 (Anaconda)
         ↓
2014 年: pyenv 流行 (管理多个 Python 版本)
         ↓
2015 年: Python 3.3 引入 venv 模块 (PEP 405)
         ↓
2017 年: Pipenv 尝试统一包管理和虚拟环境
         ↓
2018 年: Poetry 提供现代化依赖管理
         ↓
2024 年: uv 带来极速虚拟环境创建
```

## 核心原理

### 虚拟环境的工作机制

虚拟环境的核心原理是通过修改环境变量来改变 Python 解释器查找包的路径:

```python
# 查看 Python 的模块搜索路径
import sys
print(sys.path)

# 系统环境下可能输出:
# ['', '/usr/lib/python3.10', '/usr/lib/python3.10/site-packages', ...]

# 激活虚拟环境后:
# ['', '/home/user/myproject/venv/lib/python3.10/site-packages',
#  '/usr/lib/python3.10', ...]
```

### 虚拟环境目录结构

```
myproject/
└── venv/                          # 虚拟环境根目录
    ├── bin/                       # Unix 系统 (Windows 为 Scripts/)
    │   ├── activate               # Bash 激活脚本
    │   ├── activate.csh           # C Shell 激活脚本
    │   ├── activate.fish          # Fish 激活脚本
    │   ├── Activate.ps1           # PowerShell 激活脚本
    │   ├── python -> python3.10   # Python 解释器符号链接
    │   ├── python3 -> python3.10
    │   ├── python3.10             # 实际的 Python 解释器
    │   └── pip                    # pip 可执行文件
    ├── include/                   # C 头文件 (用于编译扩展)
    │   └── python3.10/
    ├── lib/                       # 库文件
    │   └── python3.10/
    │       └── site-packages/     # 安装的第三方包
    │           ├── pip/
    │           ├── setuptools/
    │           └── ...
    ├── lib64 -> lib               # 64位系统的符号链接
    └── pyvenv.cfg                 # 虚拟环境配置文件
```

### pyvenv.cfg 配置文件

```ini
# pyvenv.cfg 内容示例
home = /usr/bin                    # 基础 Python 安装位置
include-system-site-packages = false  # 是否包含系统包
version = 3.10.12                  # Python 版本
executable = /usr/bin/python3.10  # 原始 Python 路径
command = /usr/bin/python3 -m venv /home/user/myproject/venv
```

### 激活脚本的工作原理

```bash
# activate 脚本的核心操作 (简化版)

# 保存原始 PATH
_OLD_VIRTUAL_PATH="$PATH"

# 将虚拟环境的 bin 目录添加到 PATH 最前面
PATH="$VIRTUAL_ENV/bin:$PATH"
export PATH

# 设置 VIRTUAL_ENV 环境变量
VIRTUAL_ENV="/home/user/myproject/venv"
export VIRTUAL_ENV

# 修改 shell 提示符
PS1="(venv) $PS1"

# 取消 PYTHONHOME (如果设置了)
unset PYTHONHOME
```

### Python 解释器如何使用虚拟环境

```python
# Python 启动时的路径解析过程
"""
1. 查找可执行文件位置
2. 检查同级目录是否存在 pyvenv.cfg
3. 如果存在,读取配置确定基础 Python 安装
4. 根据配置构建 sys.path
5. include-system-site-packages 决定是否包含系统包
"""

import sys
import site

# 查看 site-packages 位置
print(site.getsitepackages())
# 虚拟环境: ['/home/user/myproject/venv/lib/python3.10/site-packages']

# 检查是否在虚拟环境中
print(sys.prefix)      # 虚拟环境路径
print(sys.base_prefix) # 基础 Python 路径
print(sys.prefix != sys.base_prefix)  # True 表示在虚拟环境中
```

## 核心要点

### venv 模块 (Python 标准库)

`venv` 是 Python 3.3+ 内置的虚拟环境模块,是官方推荐的轻量级解决方案。

**优点:**
- 无需额外安装,Python 自带
- 轻量快速,创建速度快
- 与 Python 版本紧密集成

**缺点:**
- 只能创建当前 Python 版本的环境
- 功能相对简单

### virtualenv (第三方工具)

`virtualenv` 是功能更丰富的虚拟环境工具,早于 venv 出现。

**优点:**
- 支持 Python 2 和 Python 3
- 可以创建不同 Python 版本的环境
- 创建速度更快 (使用缓存)
- 更多配置选项

**缺点:**
- 需要额外安装

### conda (Anaconda/Miniconda)

`conda` 是跨语言的包管理器和环境管理器,特别适合数据科学。

**优点:**
- 可以管理非 Python 包 (如 CUDA, MKL)
- 内置多版本 Python 管理
- 预编译的二进制包,避免编译问题
- 强大的依赖解析

**缺点:**
- 体积较大
- 与 pip 混用可能产生问题
- 包更新可能滞后于 PyPI

### pyenv (Python 版本管理)

`pyenv` 专注于管理多个 Python 版本,而非包管理。

**优点:**
- 轻松切换 Python 版本
- 支持安装多个 Python 版本
- 可与 virtualenv 结合使用

**缺点:**
- 主要用于 Unix 系统
- 需要编译 Python (首次安装较慢)

### 工具选择指南

```
场景                          推荐工具
─────────────────────────────────────────
一般 Python 项目              venv (标准库)
需要 Python 2 支持            virtualenv
数据科学 / 机器学习           conda
需要多 Python 版本            pyenv + venv
企业级项目管理                Poetry / PDM
追求极速                      uv
```

## 代码示例

### venv 模块使用

```bash
# 创建虚拟环境
python3 -m venv myenv

# 指定 Python 版本创建 (如果系统有多个版本)
python3.11 -m venv myenv

# 创建时不包含 pip
python3 -m venv --without-pip myenv

# 创建时包含系统 site-packages
python3 -m venv --system-site-packages myenv

# 创建时清除已存在的环境
python3 -m venv --clear myenv

# 升级虚拟环境中的核心依赖
python3 -m venv --upgrade myenv
```

```bash
# 激活虚拟环境

# Linux / macOS (Bash/Zsh)
source myenv/bin/activate

# Windows (CMD)
myenv\Scripts\activate.bat

# Windows (PowerShell)
myenv\Scripts\Activate.ps1

# Fish shell
source myenv/bin/activate.fish

# 验证激活成功
which python    # Linux/macOS
where python    # Windows
# 应该显示虚拟环境中的 python 路径
```

```bash
# 退出虚拟环境
deactivate
```

### virtualenv 使用

```bash
# 安装 virtualenv
pip install virtualenv

# 创建虚拟环境
virtualenv myenv

# 指定 Python 解释器
virtualenv -p python3.11 myenv
virtualenv --python=/usr/bin/python3.9 myenv

# 创建时复制而非符号链接
virtualenv --copies myenv

# 创建空白环境 (不包含 pip, setuptools)
virtualenv --no-pip --no-setuptools myenv

# 使用特定 pip 版本
virtualenv --pip=23.0 myenv

# 查看帮助
virtualenv --help
```

### virtualenvwrapper 使用

```bash
# 安装 (Unix 系统)
pip install virtualenvwrapper

# 配置 shell (~/.bashrc 或 ~/.zshrc)
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/projects
source /usr/local/bin/virtualenvwrapper.sh

# 创建虚拟环境
mkvirtualenv myproject

# 创建并关联项目目录
mkproject myproject

# 列出所有虚拟环境
lsvirtualenv

# 切换虚拟环境
workon myproject

# 退出当前环境
deactivate

# 删除虚拟环境
rmvirtualenv myproject

# 复制虚拟环境
cpvirtualenv source_env dest_env
```

### conda 环境管理

```bash
# 创建环境
conda create --name myenv python=3.10

# 创建环境并安装包
conda create --name myenv python=3.10 numpy pandas

# 从 environment.yml 创建
conda env create -f environment.yml

# 激活环境
conda activate myenv

# 退出环境
conda deactivate

# 列出所有环境
conda env list
conda info --envs

# 删除环境
conda env remove --name myenv

# 导出环境配置
conda env export > environment.yml
conda env export --no-builds > environment.yml  # 跨平台

# 克隆环境
conda create --name myenv_clone --clone myenv
```

```yaml
# environment.yml 示例
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

### pyenv 使用

```bash
# 安装 pyenv (macOS)
brew install pyenv

# 安装 pyenv (Linux)
curl https://pyenv.run | bash

# 配置 shell (~/.bashrc 或 ~/.zshrc)
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# 列出可安装的 Python 版本
pyenv install --list

# 安装特定版本
pyenv install 3.11.4
pyenv install 3.10.12

# 查看已安装版本
pyenv versions

# 设置全局默认版本
pyenv global 3.11.4

# 设置当前目录的版本
pyenv local 3.10.12  # 创建 .python-version 文件

# 设置当前 shell 的版本
pyenv shell 3.9.17

# 卸载版本
pyenv uninstall 3.9.17
```

```bash
# pyenv-virtualenv 插件
# 安装 (macOS)
brew install pyenv-virtualenv

# 配置
eval "$(pyenv virtualenv-init -)"

# 创建虚拟环境
pyenv virtualenv 3.11.4 myproject-3.11

# 激活
pyenv activate myproject-3.11

# 自动激活 (在项目目录)
pyenv local myproject-3.11

# 删除
pyenv virtualenv-delete myproject-3.11
```

### 在虚拟环境中使用 pip

```bash
# 激活虚拟环境后...

# 安装包
pip install requests
pip install requests==2.28.0
pip install "requests>=2.25,<3.0"

# 从 requirements.txt 安装
pip install -r requirements.txt

# 升级包
pip install --upgrade requests

# 卸载包
pip uninstall requests

# 列出已安装的包
pip list
pip list --outdated

# 显示包信息
pip show requests

# 导出依赖
pip freeze > requirements.txt

# 只导出直接依赖 (需要 pip-tools)
pip-compile requirements.in > requirements.txt
```

```python
# requirements.txt 示例
# 固定版本 (推荐用于部署)
requests==2.28.2
numpy==1.24.0
pandas==2.0.0

# 版本范围 (用于库开发)
requests>=2.25,<3.0
numpy>=1.20

# 从 Git 安装
git+https://github.com/user/repo.git@v1.0.0
git+https://github.com/user/repo.git@main#egg=package

# 本地包
./packages/mypackage
-e ./packages/mypackage  # 可编辑安装

# 从 URL 安装
https://example.com/package-1.0.tar.gz
```

### 编程方式操作虚拟环境

```python
import venv
import subprocess
import sys
import os

# 创建虚拟环境
def create_venv(path):
    """使用 venv 模块创建虚拟环境"""
    builder = venv.EnvBuilder(
        system_site_packages=False,
        clear=True,
        with_pip=True,
        upgrade_deps=True
    )
    builder.create(path)
    print(f"虚拟环境已创建: {path}")

# 在虚拟环境中运行命令
def run_in_venv(venv_path, command):
    """在指定虚拟环境中运行命令"""
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

# 在虚拟环境中安装包
def install_package(venv_path, package):
    """在指定虚拟环境中安装包"""
    if sys.platform == 'win32':
        pip = os.path.join(venv_path, 'Scripts', 'pip.exe')
    else:
        pip = os.path.join(venv_path, 'bin', 'pip')

    subprocess.run([pip, 'install', package], check=True)

# 检测当前是否在虚拟环境中
def is_in_virtualenv():
    """检测是否在虚拟环境中运行"""
    return sys.prefix != sys.base_prefix

# 获取虚拟环境信息
def get_venv_info():
    """获取当前虚拟环境的详细信息"""
    return {
        'in_venv': sys.prefix != sys.base_prefix,
        'prefix': sys.prefix,
        'base_prefix': sys.base_prefix,
        'executable': sys.executable,
        'version': sys.version,
        'path': sys.path
    }

# 使用示例
if __name__ == '__main__':
    # 创建虚拟环境
    create_venv('./test_venv')

    # 在虚拟环境中安装包
    install_package('./test_venv', 'requests')

    # 检查虚拟环境
    stdout, stderr = run_in_venv(
        './test_venv',
        'import requests; print(requests.__version__)'
    )
    print(f"requests 版本: {stdout.strip()}")
```

## 最佳实践

### 项目结构规范

```
myproject/
├── .venv/                    # 虚拟环境目录 (不提交到版本控制)
├── .gitignore               # 忽略 .venv/
├── .python-version          # pyenv 版本文件 (可选)
├── requirements/
│   ├── base.txt             # 基础依赖
│   ├── dev.txt              # 开发依赖
│   └── prod.txt             # 生产依赖
├── pyproject.toml           # 现代项目配置
├── setup.py                 # 传统安装脚本
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
# 虚拟环境
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

### 依赖管理最佳实践

```bash
# 分层依赖管理

# requirements/base.txt - 核心依赖
requests>=2.28
pydantic>=2.0

# requirements/dev.txt - 开发依赖
-r base.txt
pytest>=7.0
black>=23.0
mypy>=1.0
pre-commit>=3.0

# requirements/prod.txt - 生产依赖
-r base.txt
gunicorn>=21.0
uvicorn>=0.23
```

```bash
# 使用 pip-tools 锁定依赖

# 安装 pip-tools
pip install pip-tools

# 创建 requirements.in (只列出直接依赖)
echo "requests" > requirements.in
echo "flask" >> requirements.in

# 编译生成锁定文件 (包含所有间接依赖和精确版本)
pip-compile requirements.in

# 同步依赖
pip-sync requirements.txt
```

### 自动化虚拟环境管理

```bash
# Makefile 示例
.PHONY: venv install test clean

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

# 创建虚拟环境
venv:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip setuptools wheel

# 安装依赖
install: venv
	$(PIP) install -r requirements/dev.txt
	$(PIP) install -e .

# 运行测试
test:
	$(PYTHON) -m pytest tests/

# 清理
clean:
	rm -rf $(VENV)
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
```

```bash
# 使用 direnv 自动激活 (安装 direnv 后)

# .envrc 文件
layout python3

# 或指定版本
layout python python3.11

# 首次进入目录时
direnv allow
```

### CI/CD 中的虚拟环境

```yaml
# GitHub Actions 示例
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

### Docker 中的虚拟环境

```dockerfile
# Dockerfile
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV VIRTUAL_ENV=/opt/venv

# 创建虚拟环境
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . /app
WORKDIR /app

CMD ["python", "main.py"]
```

```dockerfile
# 多阶段构建 (优化镜像大小)
# 构建阶段
FROM python:3.11-slim as builder

ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 运行阶段
FROM python:3.11-slim

ENV VIRTUAL_ENV=/opt/venv
COPY --from=builder $VIRTUAL_ENV $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY . /app
WORKDIR /app

USER nobody
CMD ["python", "main.py"]
```

## 常见陷阱

### 将虚拟环境提交到版本控制

```bash
# 错误: 虚拟环境不应该提交到 Git
git add .venv/  # 不要这样做!

# 正确: 添加到 .gitignore
echo ".venv/" >> .gitignore

# 为什么?
# - 虚拟环境包含平台特定的二进制文件
# - 体积大,增加仓库大小
# - 不同开发者的系统可能不兼容
# - 应该用 requirements.txt 来记录依赖
```

### 全局安装 pip 包

```bash
# 错误: 在系统 Python 中安装包
pip install requests  # 可能污染系统环境

# 正确: 始终在虚拟环境中安装
python -m venv .venv
source .venv/bin/activate
pip install requests

# 或使用 --user 标志 (不推荐)
pip install --user requests
```

### 忘记激活虚拟环境

```bash
# 问题: 安装到了错误的环境
pip install django  # 可能安装到了系统环境

# 验证当前环境
which python
# 应该显示虚拟环境路径: /path/to/venv/bin/python

# 或者直接使用虚拟环境中的 pip
.venv/bin/pip install django
```

### 混用 pip 和 conda

```bash
# 问题: 在 conda 环境中用 pip 安装可能导致冲突

# 推荐做法:
# 尽量使用 conda install
conda install numpy pandas

# 如果必须用 pip,在 environment.yml 中声明
# pip 安装应该放在 conda 安装之后

# 检查包来源
conda list  # 显示包是通过 pip 还是 conda 安装的
```

### 跨平台 requirements.txt 问题

```bash
# 问题: 某些包只在特定平台可用
# 例如 pywin32 只在 Windows 上有效

# 解决方案 1: 环境标记
pywin32; sys_platform == 'win32'
uvloop; sys_platform == 'linux' or sys_platform == 'darwin'

# 解决方案 2: 平台特定文件
# requirements/windows.txt
# requirements/linux.txt
```

### 虚拟环境路径变更

```bash
# 问题: 移动虚拟环境目录后无法使用

# 原因: 虚拟环境包含硬编码路径
cat .venv/bin/activate | grep VIRTUAL_ENV
# VIRTUAL_ENV="/original/path/.venv"

# 解决方案: 不要移动,而是重新创建
rm -rf .venv
python -m venv .venv
pip install -r requirements.txt

# 或者使用相对路径工具
# Poetry, PDM 等现代工具处理得更好
```

### Python 版本不匹配

```bash
# 问题: 用 Python 3.11 创建的环境在 Python 3.9 系统上无法使用

# 预防:
# 在 README 中记录 Python 版本要求
# 使用 pyproject.toml 声明版本
# CI 中测试多个版本
```

```toml
# pyproject.toml
[project]
requires-python = ">=3.9,<4.0"
```

### 依赖冲突

```bash
# 问题: 安装新包时出现依赖冲突
pip install package-a  # 需要 requests>=2.28
pip install package-b  # 需要 requests<2.25

# 诊断
pip check  # 检查依赖冲突

# 解决方案
# 查看是否有兼容版本
pip install "package-a" "package-b" --dry-run

# 使用 pip-tools 或 Poetry 解决依赖
pip-compile requirements.in

# 必要时使用多个虚拟环境
```

## 性能考量

### 虚拟环境创建速度对比

```bash
# 测试创建速度 (大约值)

# venv (Python 3.11)
time python -m venv test_venv
# real: 0.8s - 1.2s

# virtualenv (使用缓存)
time virtualenv test_venv
# real: 0.3s - 0.5s

# conda (创建新环境)
time conda create -n test_env python=3.11 -y
# real: 15s - 45s (取决于网络)

# uv (Rust 实现)
time uv venv test_venv
# real: 0.01s - 0.05s
```

### 磁盘空间占用

```bash
# 空白虚拟环境大小 (大约值)

# venv (Python 3.11)
du -sh .venv/
# 约 15-20 MB

# virtualenv
# 约 15-20 MB

# conda base 环境
# 约 400-500 MB

# conda 最小环境
# 约 150-200 MB
```

### 优化建议

```bash
# 使用符号链接而非复制 (默认行为)
python -m venv --symlinks .venv  # 显式指定

# 不安装不必要的包
python -m venv --without-pip .venv  # 如果使用外部 pip

# 定期清理缓存
pip cache purge

# 使用 pip 的并行下载
pip install -r requirements.txt --use-feature=fast-deps

# 考虑使用 uv 替代 pip (10-100 倍速度提升)
pip install uv
uv pip install -r requirements.txt
```

### 内存使用

```python
# 虚拟环境本身不占用额外运行时内存
# 内存使用取决于安装的包

# 检查已安装包的内存影响
import sys
import importlib

def get_module_size(module_name):
    """估算模块内存占用"""
    module = importlib.import_module(module_name)
    return sys.getsizeof(module)

# 注意: 这只是模块对象本身的大小
# 实际内存使用包括模块加载的数据、缓存等
```

## 实战场景

### 场景 1: 多项目开发环境

```bash
# 目录结构
~/projects/
├── project-a/        # Django 4.x 项目
│   ├── .venv/
│   └── requirements.txt
├── project-b/        # Flask + 旧版依赖
│   ├── .venv/
│   └── requirements.txt
└── project-c/        # 数据科学项目
    ├── .venv/
    └── requirements.txt

# 每个项目独立的虚拟环境
cd ~/projects/project-a
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 使用 direnv 自动切换
# ~/projects/project-a/.envrc
source .venv/bin/activate

# 进入目录自动激活
cd ~/projects/project-a  # 自动激活 project-a 的虚拟环境
```

### 场景 2: 数据科学工作流

```bash
# 使用 conda 管理数据科学环境

# 创建 ML 环境
conda create -n ml-env python=3.10

# 安装数据科学全家桶
conda activate ml-env
conda install numpy pandas scikit-learn matplotlib jupyter

# 安装 PyTorch (指定 CUDA 版本)
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

# 导出环境供他人复现
conda env export --no-builds > environment.yml

# 他人复现环境
conda env create -f environment.yml
```

```yaml
# environment.yml - 数据科学项目
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

### 场景 3: 微服务部署

```bash
# 每个微服务独立的依赖管理

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

# 创建虚拟环境
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 运行服务
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 场景 4: 库开发与测试

```bash
# 开发 Python 库时的虚拟环境策略

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
# tox.ini - 多版本测试
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
# 运行多版本测试
pip install tox
tox  # 自动创建多个虚拟环境并运行测试
```

### 场景 5: 遗留项目迁移

```bash
# 从全局安装迁移到虚拟环境

# 导出当前已安装的包
pip freeze > legacy_requirements.txt

# 创建新的虚拟环境
python -m venv .venv
source .venv/bin/activate

# 尝试安装 (可能有版本冲突)
pip install -r legacy_requirements.txt

# 解决冲突,清理不需要的包
# 编辑 requirements.txt,只保留项目真正需要的包

# 验证项目正常运行
python -m pytest tests/
```

## 面试要点

### 基础概念题

**1. 什么是 Python 虚拟环境?为什么需要它?**

虚拟环境是一个独立的 Python 运行环境,包含特定版本的 Python 解释器和独立安装的包。需要它是因为:
- 避免不同项目之间的依赖冲突
- 保持系统 Python 环境的清洁
- 确保项目依赖可复现
- 不需要管理员权限安装包

**2. venv 和 virtualenv 有什么区别?**

- `venv` 是 Python 3.3+ 内置模块,轻量但功能有限,只能创建当前 Python 版本的环境
- `virtualenv` 是第三方工具,功能更丰富,支持 Python 2,可以创建不同版本的环境,使用缓存创建更快

**3. 如何检测代码是否在虚拟环境中运行?**

```python
import sys

def is_in_virtualenv():
    return sys.prefix != sys.base_prefix
    # 或者检查 VIRTUAL_ENV 环境变量
    # return 'VIRTUAL_ENV' in os.environ
```

### 进阶问题

**4. 解释虚拟环境激活脚本做了什么?**

激活脚本主要做以下事情:
1. 将虚拟环境的 `bin/Scripts` 目录添加到 PATH 最前面
2. 设置 `VIRTUAL_ENV` 环境变量指向虚拟环境路径
3. 修改 shell 提示符显示环境名称
4. 取消 `PYTHONHOME` 环境变量(如果设置了)
5. 定义 `deactivate` 函数用于退出环境

**5. 为什么不应该移动虚拟环境目录?**

虚拟环境包含硬编码的绝对路径:
- 激活脚本中的 `VIRTUAL_ENV` 变量
- shebang 行 (`#!/path/to/venv/bin/python`)
- 符号链接指向原位置

移动后这些路径会失效。正确做法是删除后重新创建。

**6. conda 和 pip 可以混用吗?**

技术上可以,但需要注意:
- 优先使用 conda 安装包
- pip 安装应该在 conda 之后
- 在 `environment.yml` 中声明 pip 依赖
- 使用 `conda list` 检查包来源
- 混用可能导致依赖解析不一致

### 实践编码题

**7. 编写脚本自动设置项目虚拟环境**

```python
#!/usr/bin/env python3
"""项目初始化脚本"""
import subprocess
import sys
import os
from pathlib import Path

def setup_project(project_path: str):
    """设置项目虚拟环境"""
    project = Path(project_path)
    venv_path = project / '.venv'
    requirements = project / 'requirements.txt'

    # 1. 创建虚拟环境
    print(f"创建虚拟环境: {venv_path}")
    subprocess.run([sys.executable, '-m', 'venv', str(venv_path)], check=True)

    # 2. 获取虚拟环境中的 pip
    if sys.platform == 'win32':
        pip = venv_path / 'Scripts' / 'pip.exe'
    else:
        pip = venv_path / 'bin' / 'pip'

    # 3. 升级 pip
    print("升级 pip...")
    subprocess.run([str(pip), 'install', '--upgrade', 'pip'], check=True)

    # 4. 安装依赖
    if requirements.exists():
        print("安装依赖...")
        subprocess.run([str(pip), 'install', '-r', str(requirements)], check=True)

    print(f"\n设置完成! 激活虚拟环境:")
    if sys.platform == 'win32':
        print(f"  {venv_path}\\Scripts\\activate")
    else:
        print(f"  source {venv_path}/bin/activate")

if __name__ == '__main__':
    setup_project(sys.argv[1] if len(sys.argv) > 1 else '.')
```

**8. 实现依赖版本检查工具**

```python
#!/usr/bin/env python3
"""检查依赖版本是否满足要求"""
import subprocess
import sys
from packaging import version
from packaging.requirements import Requirement

def check_dependencies(requirements_file: str) -> list[str]:
    """检查依赖版本,返回不满足的包列表"""
    issues = []

    # 获取已安装的包
    result = subprocess.run(
        [sys.executable, '-m', 'pip', 'list', '--format=json'],
        capture_output=True, text=True
    )
    installed = {
        pkg['name'].lower(): pkg['version']
        for pkg in __import__('json').loads(result.stdout)
    }

    # 检查每个要求
    with open(requirements_file) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            try:
                req = Requirement(line)
                pkg_name = req.name.lower()

                if pkg_name not in installed:
                    issues.append(f"未安装: {req.name}")
                elif req.specifier and not req.specifier.contains(installed[pkg_name]):
                    issues.append(
                        f"版本不匹配: {req.name} "
                        f"(需要 {req.specifier}, 已安装 {installed[pkg_name]})"
                    )
            except Exception as e:
                issues.append(f"无法解析: {line} ({e})")

    return issues

if __name__ == '__main__':
    issues = check_dependencies('requirements.txt')
    if issues:
        print("发现以下问题:")
        for issue in issues:
            print(f"  - {issue}")
        sys.exit(1)
    else:
        print("所有依赖版本满足要求")
```

## 延伸阅读

### 官方文档

- [venv 模块文档](https://docs.python.org/3/library/venv.html) - Python 官方文档
- [PEP 405 - Python 虚拟环境](https://peps.python.org/pep-0405/) - 虚拟环境设计提案
- [pip 用户指南](https://pip.pypa.io/en/stable/user_guide/) - pip 完整文档
- [conda 文档](https://docs.conda.io/en/latest/) - conda 官方文档

### 工具文档

- [virtualenv 文档](https://virtualenv.pypa.io/) - virtualenv 完整指南
- [pyenv GitHub](https://github.com/pyenv/pyenv) - pyenv 项目页面
- [Poetry 文档](https://python-poetry.org/docs/) - 现代依赖管理工具
- [PDM 文档](https://pdm-project.org/) - PEP 582 兼容的包管理器
- [uv 文档](https://github.com/astral-sh/uv) - 极速 Python 包管理器

### 进阶主题

- [Pipenv vs Poetry vs PDM](https://ealizadeh.com/blog/guide-to-python-env-pkg-dependency-using-conda-poetry) - 工具对比
- [Python 打包用户指南](https://packaging.python.org/) - 官方打包指南
- [pip-tools](https://pip-tools.readthedocs.io/) - 依赖锁定工具
- [容器化 Python 应用](https://pythonspeed.com/docker/) - Docker 最佳实践

### 相关标准

- [PEP 517](https://peps.python.org/pep-0517/) - 构建系统独立规范
- [PEP 518](https://peps.python.org/pep-0518/) - pyproject.toml 规范
- [PEP 621](https://peps.python.org/pep-0621/) - 项目元数据规范
- [PEP 582](https://peps.python.org/pep-0582/) - 本地包目录 (草案)

---

> 虚拟环境是 Python 开发的基础设施。掌握虚拟环境的原理和各种工具的使用,能够帮助开发者更好地管理项目依赖,避免常见的"在我机器上能跑"问题。建议根据项目需求选择合适的工具,并养成始终使用虚拟环境的习惯。
