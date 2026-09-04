---
title: Python Packaging
description: Create and distribute Python packages using setuptools and pyproject.toml
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - python
  - packaging
  - setuptools
  - pypi
  - distribution
status: imported
origin: old/src/content/docs/python/packaging.en.md
divergence: 0.289
issues:
  - order-mismatch
legacy:
  category: Python
  subcategory: Development Tools
  order: 43
  lastUpdated: 2026-01-07
---

Python packaging is the process of preparing your Python code for distribution and making it available to other developers. This comprehensive guide covers the tools, configuration files, and steps needed to create, build, and publish Python packages.

## Overview

A Python package is a way to organize related modules and code into a directory hierarchy. Packaging allows you to:

- Distribute your code to other developers
- Manage dependencies
- Version your releases
- Maintain a clean code structure
- Share reusable libraries and tools

The Python packaging ecosystem has evolved significantly over the years. Modern Python packaging uses `pyproject.toml` as the configuration standard, though `setup.py` is still widely used and supported.

## Package Structure

Before diving into configuration files, let's understand the typical structure of a Python package:

```
my-package/
├── README.md
├── LICENSE
├── pyproject.toml
├── setup.py (optional in modern packaging)
├── setup.cfg (optional)
├── MANIFEST.in
├── my_package/
│   ├── __init__.py
│   ├── module1.py
│   ├── module2.py
│   └── subpackage/
│       ├── __init__.py
│       └── module3.py
├── tests/
│   ├── __init__.py
│   ├── test_module1.py
│   └── test_module2.py
└── docs/
    ├── index.md
    └── guide.md
```

### Key Components

- **Package directory** (`my_package/`): Contains your Python code with an `__init__.py` file
- **pyproject.toml**: Modern configuration file for package metadata and build tools
- **setup.py**: Legacy configuration file (still used, but being replaced by `pyproject.toml`)
- **setup.cfg**: Alternative configuration format
- **tests/**: Directory containing test modules
- **docs/**: Directory for documentation
- **README.md**: Package description and usage instructions
- **LICENSE**: Software license file
- **MANIFEST.in**: Specifies which non-Python files to include in distribution

## setup.py

The `setup.py` file is a Python script that tells setuptools how to build and install your package. While being phased out in favor of `pyproject.toml`, it's still widely used.

### Basic setup.py Example

```python
from setuptools import setup, find_packages

setup(
    name="my-package",
    version="0.1.0",
    description="A brief description of what the package does",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Your Name",
    author_email="your.email@example.com",
    url="https://github.com/yourusername/my-package",
    license="MIT",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
)
```

### Common setup() Parameters

| Parameter | Description |
|-----------|-------------|
| `name` | The name of your package |
| `version` | Current version (use semantic versioning) |
| `description` | Short description of the package |
| `long_description` | Detailed description (often from README.md) |
| `author` | Author name |
| `author_email` | Author email address |
| `url` | Project home page URL |
| `license` | License type (e.g., "MIT") |
| `packages` | List of packages to include |
| `py_modules` | List of single-file modules |
| `install_requires` | List of dependencies |
| `python_requires` | Minimum Python version required |
| `classifiers` | PyPI classifiers for categorization |
| `entry_points` | Command-line entry points |

### Entry Points

Entry points allow you to expose command-line scripts:

```python
entry_points={
    'console_scripts': [
        'my-cli=my_package.cli:main',
    ],
}
```

This creates a `my-cli` command that calls the `main()` function from `my_package.cli`.

## pyproject.toml

`pyproject.toml` is the modern standard for Python project configuration, defined in PEP 517, PEP 518, and PEP 621. It provides a unified way to configure build systems, dependencies, and package metadata.

### Basic pyproject.toml Example

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "0.1.0"
description = "A brief description of what the package does"
readme = "README.md"
requires-python = ">=3.8"
license = {text = "MIT"}
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
keywords = ["packaging", "example"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
]

dependencies = [
    "requests>=2.25.0",
    "click>=8.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "black>=22.0",
    "flake8>=4.0",
    "mypy>=0.900",
]
docs = [
    "sphinx>=4.0",
    "sphinx-rtd-theme>=1.0",
]

[project.urls]
Homepage = "https://github.com/yourusername/my-package"
Documentation = "https://my-package.readthedocs.io"
Repository = "https://github.com/yourusername/my-package.git"
Issues = "https://github.com/yourusername/my-package/issues"

[project.scripts]
my-cli = "my_package.cli:main"

[tool.setuptools]
packages = ["my_package"]

[tool.black]
line-length = 88
target-version = ["py38"]

[tool.isort]
profile = "black"
line_length = 88

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = false
```

### Key Sections

#### [build-system]

Specifies the build backend and its requirements:

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"
```

#### [project]

Contains core package metadata:

- `name`: Package name
- `version`: Package version
- `description`: Short description
- `readme`: Path to README file
- `requires-python`: Minimum Python version
- `dependencies`: Required dependencies
- `authors`: List of authors with name and email
- `classifiers`: PyPI classifiers

#### [project.optional-dependencies]

Defines optional dependency groups:

```toml
[project.optional-dependencies]
dev = ["pytest>=7.0", "black>=22.0"]
docs = ["sphinx>=4.0"]
```

Install with: `pip install my-package[dev]` or `pip install my-package[docs]`

#### [project.urls]

Links to relevant project resources:

```toml
[project.urls]
Homepage = "https://github.com/yourusername/my-package"
Documentation = "https://my-package.readthedocs.io"
```

#### [project.scripts]

Defines command-line entry points:

```toml
[project.scripts]
my-cli = "my_package.cli:main"
```

#### Tool-Specific Sections

Configuration for other tools like `black`, `isort`, and `mypy`:

```toml
[tool.black]
line-length = 88

[tool.isort]
profile = "black"

[tool.mypy]
python_version = "3.8"
```

## setuptools

Setuptools is the standard package for building and distributing Python packages. It extends the standard `distutils` library and is what powers both `setup.py` and modern `pyproject.toml` configurations.

### Installation

```bash
pip install setuptools wheel
```

### Key Functions

#### find_packages()

Automatically discovers package directories:

```python
from setuptools import find_packages

packages = find_packages()
# Finds all directories with __init__.py
```

You can exclude packages:

```python
packages = find_packages(exclude=["tests", "tests.*"])
```

#### find_namespace_packages()

For namespace packages (Python 3.3+ feature):

```python
from setuptools import find_namespace_packages

packages = find_namespace_packages()
```

### Building Packages

#### Source Distribution (sdist)

Creates a `.tar.gz` file containing all source files:

```bash
python setup.py sdist
# or with build module
python -m build --sdist
```

#### Wheel Distribution

Creates a `.whl` file (pre-built binary format):

```bash
python setup.py bdist_wheel
# or with build module
python -m build --wheel
```

#### Building Both

```bash
python -m build
```

This creates both source and wheel distributions.

## Building and Distribution

### Using the build Module

The `build` module is the recommended tool for building packages:

```bash
# Installation
pip install build

# Build both source and wheel distributions
python -m build

# Build only wheel
python -m build --wheel

# Build only source distribution
python -m build --sdist
```

### Project Root Requirements

Ensure your project has:

1. A `pyproject.toml` file with `[build-system]` section
2. Or a `setup.py` file for legacy projects
3. Package code with `__init__.py` files in directories

### Version Management

Use semantic versioning (MAJOR.MINOR.PATCH):

```toml
version = "1.2.3"
```

You can also read version from a file:

```toml
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "my_package.__version__"}
```

And in `my_package/__init__.py`:

```python
__version__ = "1.2.3"
```

## Publishing to PyPI

### Prerequisites

1. Create an account on [PyPI](https://pypi.org) and [TestPyPI](https://test.pypi.org)
2. Install `twine` for uploading:

```bash
pip install twine
```

3. Create `~/.pypirc` configuration file:

```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-AgEIcHlwaS5vcmc...  # Your PyPI token

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-AgEIcHlwaS5vcmc...  # Your TestPyPI token
```

### Generate API Tokens

1. Log in to PyPI
2. Go to Account Settings → API Tokens
3. Create a new token with "Entire repository" scope
4. Copy the token (shown only once)

### Test Publishing

Always test with TestPyPI first:

```bash
# Build your package
python -m build

# Upload to TestPyPI
twine upload --repository testpypi dist/*

# Test installation
pip install --index-url https://test.pypi.org/simple/ my-package
```

### Production Publishing

Once tested, publish to PyPI:

```bash
# Upload to PyPI
twine upload dist/*
```

Your package is now available on PyPI and installable via:

```bash
pip install my-package
```

### Publishing Workflow Checklist

1. Update version number in `pyproject.toml` or `__init__.py`
2. Update `CHANGELOG.md` or release notes
3. Commit and tag the release:
   ```bash
   git tag v1.0.0
   git push origin main --tags
   ```
4. Build distributions: `python -m build`
5. Test on TestPyPI: `twine upload --repository testpypi dist/*`
6. Publish to PyPI: `twine upload dist/*`
7. Create release on GitHub/GitLab with release notes

### Automating with CI/CD

You can automate publishing with GitHub Actions:

```yaml
name: Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - run: pip install build twine

      - run: python -m build

      - uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: ${{ secrets.PYPI_API_TOKEN }}
```

## Best Practices

### Clear Package Naming

- Use lowercase with hyphens: `my-package`
- Avoid names that conflict with popular packages
- Check availability on PyPI before starting

### Semantic Versioning

Follow MAJOR.MINOR.PATCH format:

- MAJOR: Breaking API changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

Example: `1.2.3` → `1.2.4` (patch), `1.3.0` (minor), `2.0.0` (major)

### Comprehensive Documentation

- Provide clear README with examples
- Include installation instructions
- Document all public APIs
- Add usage examples
- Maintain a CHANGELOG

### Manage Dependencies

- Specify version constraints appropriately:
  ```toml
  dependencies = [
      "requests>=2.25.0,<3",      # Compatible release
      "click==8.0.1",              # Exact version
      "numpy>=1.20.0",             # Minimum version
  ]
  ```

- Use optional dependencies for optional features
- Keep dependencies minimal

### Include Required Files

- `README.md`: Project description and quick start
- `LICENSE`: License file (MIT, Apache 2.0, etc.)
- `CHANGELOG.md`: Version history and changes
- `MANIFEST.in`: Non-Python files to include

Example `MANIFEST.in`:

```
include README.md
include LICENSE
include CHANGELOG.md
recursive-include docs *
```

### Test Your Package

Always test locally before publishing:

```bash
# Build the package
python -m build

# Create a virtual environment
python -m venv test_env
source test_env/bin/activate

# Install from the built wheel
pip install dist/my_package-*.whl

# Test the package
python -c "import my_package; print(my_package.__version__)"
```

### Use Type Hints

Include type hints in your code for better IDE support and type checking:

```python
def greet(name: str) -> str:
    """Greet someone by name."""
    return f"Hello, {name}!"
```

Configure type checking in `pyproject.toml`:

```toml
[tool.mypy]
python_version = "3.8"
warn_return_any = true
disallow_untyped_defs = true
```

### Version Files Wisely

Use one of these approaches for version management:

**Option 1: Dynamic version from module**

```toml
[project]
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "my_package.__version__"}
```

**Option 2: Single-source version**

Keep version in `pyproject.toml` and import it in `__init__.py`:

```python
# my_package/__init__.py
from importlib.metadata import version

__version__ = version("my-package")
```

**Option 3: Use tools like bumpversion or commitizen**

### Continuous Integration

Set up CI/CD pipeline to:

- Run tests on multiple Python versions
- Check code quality (linting, formatting)
- Build distribution packages
- Automatically publish on release

### Keep Backward Compatibility

- Minimize breaking changes
- Deprecate features gradually with warnings
- Maintain compatibility with previous versions when possible
- Document breaking changes clearly

## Summary

Python packaging combines several components:

- **pyproject.toml**: Modern standard for configuration
- **setup.py**: Legacy but still used build configuration
- **setuptools**: The build system that handles packaging
- **twine**: Tool for uploading to PyPI
- **build**: Tool for creating distributions

By following these practices and using modern tools, you can create professional, distributable Python packages that other developers can easily install and use. Start with `pyproject.toml`, build your package with the `build` module, test on TestPyPI, and publish to PyPI with `twine`.

## Additional Resources

- [Python Packaging User Guide](https://packaging.python.org/)
- [PEP 517 - Build system interface](https://www.python.org/dev/peps/pep-0517/)
- [PEP 518 - Build backend requirements](https://www.python.org/dev/peps/pep-0518/)
- [PEP 621 - pyproject.toml](https://www.python.org/dev/peps/pep-0621/)
- [setuptools Documentation](https://setuptools.pypa.io/)
- [twine Documentation](https://twine.readthedocs.io/)
- [PyPI Help](https://pypi.org/help/)
