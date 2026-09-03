---
title: Code Quality Tools
description: Improve Python code quality with linters, formatters, and static analysis tools
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - python
  - linting
  - black
  - flake8
  - mypy
  - ruff
status: imported
origin: old/src/content/docs/python/code-quality.en.md
divergence: 0.549
issues:
  - order-mismatch
  - divergent
legacy:
  category: Python
  subcategory: Development Tools
  order: 44
  lastUpdated: 2026-01-07
---

Writing high-quality Python code requires more than just making sure it runs. Code quality tools help you maintain consistency, catch bugs early, ensure type safety, and follow best practices. We'll cover the essential tools for Python code quality assurance.

## Why Code Quality Matters

Poor code quality leads to:
- **Bugs and runtime errors** that could have been caught automatically
- **Inconsistent code style** making collaboration difficult
- **Technical debt** that accumulates over time
- **Difficult maintenance** and debugging
- **Performance issues** that go unnoticed

Using code quality tools prevents these problems by automating checks and enforcing standards before code reaches production.

## Black: The Uncompromising Code Formatter

Black is an opinionated code formatter that automatically formats Python code to meet consistent style requirements. It's called "uncompromising" because it takes minimal configuration—you get one way to format code, period.

### Installation

```bash
pip install black
```

### Basic Usage

```bash
# Format a single file
black myfile.py

# Format an entire directory
black src/

# Check formatting without modifying files
black --check src/

# Show what would be changed
black --diff myfile.py
```

### Configuration

Create a `pyproject.toml` file for Black configuration:

```toml
[tool.black]
line-length = 100
target-version = ['py39', 'py310', 'py311']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''
```

### Example: Before and After

**Before:**
```python
def calculate_total(items,tax_rate=0.1,discount=0):
    return sum([item['price']*(1-discount) for item in items])*(1+tax_rate)
```

**After (with Black):**
```python
def calculate_total(items, tax_rate=0.1, discount=0):
    return (
        sum([item["price"] * (1 - discount) for item in items]) * (1 + tax_rate)
    )
```

## Flake8: Style and Error Detection

Flake8 is a style guide enforcement tool that checks your code against PEP 8 (Python's style guide) and detects logical errors. It combines PyCodeStyle, PyFlakes, and McCabe complexity checker.

### Installation

```bash
pip install flake8
```

### Basic Usage

```bash
# Check a file
flake8 myfile.py

# Check a directory
flake8 src/

# Show statistics
flake8 --statistics

# Get detailed reports
flake8 --count --show-source
```

### Configuration

Create a `.flake8` file or add to `setup.cfg`:

```ini
[flake8]
max-line-length = 100
exclude = .git,__pycache__,venv,tests
ignore = E203, W503
max-complexity = 10
```

### Common Error Codes

- **E### - PEP 8 errors:** E302 (blank lines), E501 (line too long)
- **W### - PEP 8 warnings:** W291 (trailing whitespace)
- **F### - PyFlakes errors:** F401 (unused import), F841 (unused variable)
- **C### - Complexity:** C901 (function too complex)

### Example: Error Detection

```python
import os  # F401: imported but unused
import sys

def process_data(x,y):  # E231: missing whitespace after comma
    z = 5  # F841: local variable assigned but never used
    return x+y
```

Running Flake8 would report:
```
myfile.py:1:1: F401 'os' imported but unused
myfile.py:4:17: E231 missing whitespace after ','
myfile.py:5:5: F841 local variable 'z' is assigned to but never used
```

## Pylint: Comprehensive Code Analysis

Pylint is a powerful linter that goes beyond style checking to analyze code for errors, refactoring opportunities, and conventions. It provides detailed reports and code ratings.

### Installation

```bash
pip install pylint
```

### Basic Usage

```bash
# Analyze a file
pylint myfile.py

# Generate an HTML report
pylint --output-format=html myfile.py

# Analyze with specific configuration
pylint --rcfile=.pylintrc myfile.py
```

### Configuration

Create a `.pylintrc` file:

```ini
[MASTER]
disable=
    missing-docstring,
    too-few-public-methods,

[FORMAT]
max-line-length=100

[DESIGN]
max-attributes=7
```

### Message Categories

- **C (Convention):** Code style issues
- **R (Refactor):** Potential refactoring opportunities
- **W (Warning):** Suspicious code patterns
- **E (Error):** Definite errors
- **F (Fatal):** Errors preventing analysis

### Example: Detailed Analysis

```python
class DataProcessor:
    def process(self):
        """Process data."""
        data = load_data()
        # Missing docstring for method
        # Potential issue: unused variable
        result = transform(data)
        return result
```

Pylint provides:
```
Your code has been rated at 8.5/10
```

Along with specific recommendations for improvement.

## Mypy: Static Type Checking

Mypy enables static type checking for Python by leveraging type hints. It helps catch type-related bugs before runtime without executing code.

### Installation

```bash
pip install mypy
```

### Basic Usage

```bash
# Type-check a file
mypy myfile.py

# Type-check a directory
mypy src/

# Strict mode
mypy --strict src/
```

### Configuration

Create a `mypy.ini` or add to `pyproject.toml`:

```ini
[mypy]
python_version = 3.10
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
```

### Type Hints and Examples

```python
from typing import List, Dict, Optional

def calculate_average(numbers: List[float]) -> float:
    """Calculate the average of a list of numbers."""
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)

def fetch_user(user_id: int) -> Optional[Dict[str, str]]:
    """Fetch user data or return None if not found."""
    # Implementation here
    pass

def process_items(items: List[str]) -> None:
    """Process items and return nothing."""
    for item in items:
        print(item)
```

### Type Errors Caught

```python
# mypy detects these errors
name = "Alice"
age = name + 5  # Error: unsupported operand type(s)

def greet(person: str) -> str:
    return person

result = greet(42)  # Error: argument 1 has incompatible type
```

## Ruff: Fast Unified Linting

Ruff is a modern, extremely fast linter written in Rust that combines many tools into one. It's compatible with Flake8, Pylint, and other tools while being significantly faster.

### Installation

```bash
pip install ruff
```

### Basic Usage

```bash
# Check files
ruff check src/

# Fix issues automatically
ruff check --fix src/

# Format code (Black-compatible)
ruff format src/

# Show detailed output
ruff check --show-source src/
```

### Configuration

Add to `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py39"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "RUF"]
ignore = ["E501"]

[tool.ruff.lint.isort]
known-first-party = ["myproject"]

[tool.ruff.format]
quote-style = "double"
```

### Key Features

- **Import sorting:** Organizes imports automatically
- **Unused code detection:** Finds unused variables and imports
- **Upgrade syntax:** Modernizes Python syntax
- **Docstring formatting:** Ensures proper docstring formatting
- **Formatting:** Includes Black-compatible formatting

### Example: Comprehensive Checking

```bash
ruff check --fix --show-source .
# Automatically fixes many issues and shows what was changed
```

## Integrating Code Quality Tools

### Pre-commit Hooks

Use `pre-commit` to run tools before committing:

```bash
pip install pre-commit
```

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.10

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.8
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
```

Install hooks:

```bash
pre-commit install
pre-commit run --all-files
```

### CI/CD Integration

#### GitHub Actions Example

Create `.github/workflows/code-quality.yml`:

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          pip install black flake8 mypy ruff

      - name: Format check with Black
        run: black --check src/ tests/

      - name: Lint with Ruff
        run: ruff check src/ tests/

      - name: Type check with Mypy
        run: mypy src/

      - name: Lint with Flake8
        run: flake8 src/ tests/
```

#### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
quality:
  image: python:3.10
  before_script:
    - pip install black flake8 mypy ruff
  script:
    - black --check src/
    - ruff check src/
    - mypy src/
    - flake8 src/
  only:
    - merge_requests
    - main
```

### Local Development Workflow

1. **During development:** Use Ruff for quick feedback (fastest)
2. **Before commit:** Let pre-commit hooks run Black and Ruff
3. **Before push:** Run complete checks locally:
   ```bash
   black src/
   ruff check --fix src/
   mypy src/
   flake8 src/
   ```
4. **In CI/CD:** Run full suite on every push

## Best Practices

### Choose the Right Tools

- **Black + Ruff:** Modern, fast combination (recommended)
- **Black + Flake8 + Mypy:** Traditional, well-established
- **Pylint alone:** Comprehensive but slower
- **Ruff + Mypy:** Fast linting with type checking

### Configure Consistently

Keep tool configurations in `pyproject.toml` for centralized management:

```toml
[tool.black]
line-length = 100

[tool.ruff]
line-length = 100

[tool.mypy]
python_version = "3.10"
```

### Start Gradual

When introducing tools to existing projects:

```bash
# Check current state without fixing
ruff check src/ --count

# Fix auto-fixable issues
ruff check src/ --fix

# Address remaining issues over time
```

### Document Decisions

In your project's CONTRIBUTING.md:

```markdown
## Code Quality

We use:
- **Black** for code formatting
- **Ruff** for linting and import sorting
- **Mypy** for type checking

Run before committing:
```bash
pre-commit run --all-files
```
```

### Team Alignment

- Include tool setup in project README
- Pin versions in requirements files
- Use pre-commit hooks to enforce standards
- Code review checklist should include quality tool results

## Common Pitfalls

### Ignoring All Warnings

```python
# BAD: Suppressing legitimate issues
# noqa: F401
import unused_module
```

**Better:** Fix the actual problem
```python
# Remove unused imports entirely
```

### Conflicting Configurations

Different tools with conflicting settings cause confusion:

```toml
# GOOD: Consistent line length
[tool.black]
line-length = 100

[tool.ruff]
line-length = 100

[tool.pylint]
max-line-length = 100
```

### Not Using Type Hints

Type hints enable Mypy and improve code clarity:

```python
# Before: unclear what types are expected
def process(data):
    return [item.upper() for item in data]

# After: clear contract
def process(data: List[str]) -> List[str]:
    return [item.upper() for item in data]
```

## Performance Considerations

Tool execution time matters for developer experience:

| Tool | Speed | Coverage |
|------|-------|----------|
| Black | Fast | Formatting |
| Ruff | Very Fast | Linting, Formatting, Imports |
| Flake8 | Medium | Linting, Style |
| Pylint | Slow | Comprehensive analysis |
| Mypy | Medium-Slow | Type checking |

**Recommendation:** Use Ruff for fast feedback, Mypy for type safety, and optionally Pylint for deeper analysis.

## Conclusion

Python code quality tools are essential for professional development. Start with:

1. **Black** for consistent formatting
2. **Ruff** or **Flake8** for linting
3. **Mypy** for type safety
4. **Pre-commit hooks** to enforce standards
5. **CI/CD integration** to catch issues early

These tools work together to catch bugs, maintain consistency, and improve code maintainability. The investment in setup pays dividends through fewer bugs and easier collaboration.

## Further Reading

- [Black Documentation](https://black.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Flake8 Documentation](https://flake8.pycqa.org/)
- [Mypy Documentation](https://mypy.readthedocs.io/)
- [PEP 8 Style Guide](https://www.python.org/dev/peps/pep-0008/)
- [Type Hints PEP 484](https://www.python.org/dev/peps/pep-0484/)
