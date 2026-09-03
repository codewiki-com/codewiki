---
title: 使用 pytest 进行 Python 测试
description: 掌握 pytest：测试编写、fixtures、参数化、mock 和覆盖率
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - pytest
  - Testing
  - TDD
status: imported
origin: old/src/content/docs/python/pytest.zh.md
divergence: 0.228
issues: []
legacy:
  category: Python
  subcategory: Testing and Debugging
  order: 13
  lastUpdated: 2026-01-07
---

pytest 是最流行的 Python 测试框架，以其简单性、强大功能和广泛的插件生态系统而闻名。本指南涵盖了从基本测试编写到高级技术（如 fixtures、参数化和 mock）的所有内容。

## pytest 简介

pytest 是一个成熟、功能丰富的测试框架，可以轻松编写小型、可读的测试，同时扩展以支持应用程序和库的复杂功能测试。

### 主要特性

- **简单语法**：无需样板代码
- **详细的断言内省**：清晰的失败消息
- **Fixtures**：强大的依赖注入系统
- **参数化**：使用多个输入运行测试
- **插件架构**：广泛的插件生态系统
- **并行执行**：使用 pytest-xdist 并发运行测试
- **兼容性**：与 unittest 和 nose 测试兼容

## 安装和设置

使用 pip 安装 pytest：

```bash
pip install pytest
```

对于额外功能，安装这些常用插件：

```bash
pip install pytest-cov pytest-mock pytest-xdist pytest-asyncio
```

### 项目结构

典型的 pytest 项目结构：

```
my_project/
├── src/
│   └── myapp/
│       ├── __init__.py
│       ├── calculator.py
│       └── user.py
├── tests/
│   ├── __init__.py
│   ├── test_calculator.py
│   ├── test_user.py
│   └── conftest.py
├── pytest.ini
└── requirements.txt
```

### 配置文件

在项目根目录创建 `pytest.ini` 文件：

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --cov=src
    --cov-report=html
    --cov-report=term
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

## 编写基本测试

pytest 使用简单的 assert 语句，并遵循命名约定进行测试发现。

### 基本测试示例

```python
# src/myapp/calculator.py
def add(a, b):
    """两数相加。"""
    return a + b

def subtract(a, b):
    """从 a 中减去 b。"""
    return a - b

def multiply(a, b):
    """两数相乘。"""
    return a * b

def divide(a, b):
    """a 除以 b。"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

```python
# tests/test_calculator.py
from myapp.calculator import add, subtract, multiply, divide
import pytest

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(0, 0) == 0

def test_subtract():
    assert subtract(5, 3) == 2
    assert subtract(0, 5) == -5

def test_multiply():
    assert multiply(3, 4) == 12
    assert multiply(-2, 3) == -6

def test_divide():
    assert divide(10, 2) == 5
    assert divide(9, 3) == 3

def test_divide_by_zero():
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(10, 0)
```

### 测试类

使用类组织相关测试：

```python
class TestCalculator:
    """计算器操作测试。"""

    def test_addition(self):
        assert add(1, 2) == 3

    def test_subtraction(self):
        assert subtract(5, 2) == 3

    def test_complex_calculation(self):
        result = add(multiply(2, 3), divide(10, 2))
        assert result == 11
```

## 测试发现和执行

pytest 根据命名约定自动发现测试：

- 测试文件：`test_*.py` 或 `*_test.py`
- 测试函数：`test_*()`
- 测试类：`Test*`
- 测试方法：`test_*()`

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/test_calculator.py

# 运行特定测试
pytest tests/test_calculator.py::test_add

# 运行类中的测试
pytest tests/test_calculator.py::TestCalculator

# 运行匹配模式的测试
pytest -k "add or subtract"

# 详细输出
pytest -v

# 显示 print 语句
pytest -s

# 在第一个失败时停止
pytest -x

# 在回溯中显示局部变量
pytest -l
```

## 断言

pytest 提供详细的断言内省，在失败的断言中显示变量的值。

### 基本断言

```python
def test_assertions():
    # 相等
    assert 1 + 1 == 2

    # 不相等
    assert 5 != 3

    # 比较
    assert 10 > 5
    assert 3 <= 3

    # 成员关系
    assert 'a' in 'abc'
    assert 5 in [1, 2, 3, 4, 5]

    # 身份
    assert None is None
    assert [] is not []

    # 布尔
    assert True
    assert not False
```

### 近似比较

```python
import pytest

def test_approximate():
    # 对于浮点数比较
    assert 0.1 + 0.2 == pytest.approx(0.3)
    assert {'a': 0.1 + 0.2} == pytest.approx({'a': 0.3})

    # 自定义容差
    assert 10 == pytest.approx(10.5, abs=0.6)
    assert 100 == pytest.approx(99, rel=0.02)
```

### 异常测试

```python
def test_exceptions():
    # 断言抛出异常
    with pytest.raises(ValueError):
        int('invalid')

    # 检查异常消息
    with pytest.raises(ValueError, match="invalid literal"):
        int('invalid')

    # 访问异常对象
    with pytest.raises(ZeroDivisionError) as exc_info:
        1 / 0
    assert "division by zero" in str(exc_info.value)
```

### 警告测试

```python
import warnings

def test_warnings():
    with pytest.warns(UserWarning):
        warnings.warn("This is a warning", UserWarning)

    # 检查警告消息
    with pytest.warns(UserWarning, match="deprecated"):
        warnings.warn("This function is deprecated", UserWarning)
```

## Fixtures

Fixtures 是 pytest 提供可重用设置和清理代码的方式。它们使用依赖注入来提供测试数据和资源。

### 基本 Fixtures

```python
# tests/conftest.py
import pytest

@pytest.fixture
def sample_data():
    """为测试提供示例数据。"""
    return [1, 2, 3, 4, 5]

@pytest.fixture
def calculator():
    """提供计算器实例。"""
    from myapp.calculator import Calculator
    return Calculator()
```

```python
# tests/test_with_fixtures.py
def test_with_sample_data(sample_data):
    assert len(sample_data) == 5
    assert sum(sample_data) == 15

def test_calculator_fixture(calculator):
    assert calculator.add(2, 3) == 5
```

### Fixture 作用域

使用作用域控制 fixture 生命周期：

```python
@pytest.fixture(scope="function")  # 默认：每个测试运行一次
def function_fixture():
    return "new instance per test"

@pytest.fixture(scope="class")  # 每个测试类运行一次
def class_fixture():
    return "shared within class"

@pytest.fixture(scope="module")  # 每个模块运行一次
def module_fixture():
    return "shared within module"

@pytest.fixture(scope="session")  # 每个测试会话运行一次
def session_fixture():
    return "shared across all tests"
```

### 设置和清理

```python
@pytest.fixture
def database_connection():
    """设置数据库连接并在测试后清理。"""
    # 设置
    connection = connect_to_database()

    yield connection  # 提供 fixture 值

    # 清理
    connection.close()

def test_database_query(database_connection):
    result = database_connection.query("SELECT * FROM users")
    assert len(result) > 0
```

### Fixture 工厂

```python
@pytest.fixture
def make_user():
    """创建用户的工厂 fixture。"""
    created_users = []

    def _make_user(name, email):
        user = User(name=name, email=email)
        created_users.append(user)
        return user

    yield _make_user

    # 清理所有创建的用户
    for user in created_users:
        user.delete()

def test_user_creation(make_user):
    user1 = make_user("Alice", "alice@example.com")
    user2 = make_user("Bob", "bob@example.com")

    assert user1.name == "Alice"
    assert user2.email == "bob@example.com"
```

### 参数化 Fixtures

```python
@pytest.fixture(params=[1, 2, 3])
def number(request):
    """提供多个值的 fixture。"""
    return request.param

def test_with_parametrized_fixture(number):
    # 此测试运行三次，每个参数一次
    assert number > 0
```

### 内置 Fixtures

pytest 提供有用的内置 fixtures：

```python
def test_tmp_path(tmp_path):
    """tmp_path 提供临时目录。"""
    test_file = tmp_path / "test.txt"
    test_file.write_text("Hello, World!")
    assert test_file.read_text() == "Hello, World!"

def test_monkeypatch(monkeypatch):
    """monkeypatch 允许修改对象和环境。"""
    monkeypatch.setenv("API_KEY", "test_key")
    monkeypatch.setattr("os.getcwd", lambda: "/fake/path")

    import os
    assert os.getenv("API_KEY") == "test_key"

def test_capsys(capsys):
    """capsys 捕获 stdout 和 stderr。"""
    print("Hello")
    print("Error", file=sys.stderr)

    captured = capsys.readouterr()
    assert "Hello" in captured.out
    assert "Error" in captured.err
```

## 参数化测试

使用参数化运行具有不同输入的相同测试。

### 基本参数化

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    (2, 4),
    (3, 9),
    (4, 16),
    (5, 25),
])
def test_square(input, expected):
    assert input ** 2 == expected
```

### 多参数

```python
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (5, 3, 8),
    (10, -5, 5),
    (0, 0, 0),
])
def test_addition(a, b, expected):
    assert add(a, b) == expected
```

### 参数化多个参数

```python
@pytest.mark.parametrize("x", [0, 1, 2])
@pytest.mark.parametrize("y", [0, 1, 2])
def test_multiply_combinations(x, y):
    # 运行 9 次（3 x 3 组合）
    result = x * y
    assert result >= 0
```

### 使用 pytest.param 自定义 ID

```python
@pytest.mark.parametrize("input,expected", [
    pytest.param(2, 4, id="two_squared"),
    pytest.param(3, 9, id="three_squared"),
    pytest.param(4, 16, id="four_squared"),
])
def test_square_with_ids(input, expected):
    assert input ** 2 == expected
```

### 参数化 Fixtures

```python
@pytest.fixture(params=[
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25},
    {"name": "Charlie", "age": 35},
])
def user_data(request):
    return request.param

def test_user_age(user_data):
    assert user_data["age"] > 0
    assert isinstance(user_data["name"], str)
```

### 复杂参数化

```python
@pytest.mark.parametrize("input_value,expected_output,should_raise", [
    (10, 2, None),
    ("invalid", None, ValueError),
    (-5, None, ValueError),
    (100, 10, None),
])
def test_function_with_exceptions(input_value, expected_output, should_raise):
    if should_raise:
        with pytest.raises(should_raise):
            process_value(input_value)
    else:
        assert process_value(input_value) == expected_output
```

## 标记和跳过测试

标记允许你对测试进行分类并选择性地运行测试。

### 内置标记

```python
import pytest
import sys

@pytest.mark.skip(reason="Not implemented yet")
def test_future_feature():
    pass

@pytest.mark.skipif(sys.version_info < (3, 8), reason="Requires Python 3.8+")
def test_python38_feature():
    pass

@pytest.mark.xfail(reason="Known bug in library")
def test_known_issue():
    assert False  # 预期失败

@pytest.mark.xfail(strict=True)
def test_must_fail():
    # 测试必须失败，否则是错误
    assert False
```

### 自定义标记

```python
# 在 pytest.ini 或 conftest.py 中定义标记
@pytest.mark.slow
def test_slow_operation():
    import time
    time.sleep(2)
    assert True

@pytest.mark.integration
def test_database_integration():
    # 集成测试
    pass

@pytest.mark.unit
def test_unit_test():
    # 单元测试
    pass

# 组合标记
@pytest.mark.slow
@pytest.mark.integration
def test_slow_integration():
    pass
```

### 按标记运行测试

```bash
# 只运行慢速测试
pytest -m slow

# 运行所有非慢速测试
pytest -m "not slow"

# 运行集成或单元测试
pytest -m "integration or unit"

# 运行非慢速的集成测试
pytest -m "integration and not slow"
```

### 条件跳过

```python
import pytest

@pytest.mark.skipif(
    not hasattr(ssl, 'SSLContext'),
    reason="SSL not available"
)
def test_ssl_feature():
    pass

# 跳过整个模块
pytestmark = pytest.mark.skipif(
    sys.platform == "win32",
    reason="Not supported on Windows"
)
```

## Mock 和 Patching

使用 pytest-mock 或 unittest.mock 将依赖项替换为 mock 对象。

### 使用 unittest.mock 进行基本 Mock

```python
from unittest.mock import Mock, MagicMock, patch
import pytest

# 要测试的代码
def get_user_data(user_id):
    """从外部 API 获取用户数据。"""
    response = requests.get(f"https://api.example.com/users/{user_id}")
    return response.json()

def test_get_user_data_with_mock():
    """使用手动 mock 进行测试。"""
    with patch('requests.get') as mock_get:
        # 配置 mock
        mock_response = Mock()
        mock_response.json.return_value = {
            'id': 1,
            'name': 'Alice'
        }
        mock_get.return_value = mock_response

        # 测试
        result = get_user_data(1)

        # 断言
        assert result['name'] == 'Alice'
        mock_get.assert_called_once_with('https://api.example.com/users/1')
```

### 使用 pytest-mock

```python
def test_with_pytest_mock(mocker):
    """pytest-mock 提供 mocker fixture。"""
    mock_get = mocker.patch('requests.get')
    mock_get.return_value.json.return_value = {'id': 1, 'name': 'Alice'}

    result = get_user_data(1)

    assert result['name'] == 'Alice'
    mock_get.assert_called_once()
```

### Patch 对象和方法

```python
class EmailService:
    def send_email(self, to, subject, body):
        # 实际发送邮件
        pass

class UserService:
    def __init__(self):
        self.email_service = EmailService()

    def register_user(self, email, name):
        # 创建用户
        user = User(email=email, name=name)
        user.save()

        # 发送欢迎邮件
        self.email_service.send_email(
            to=email,
            subject="Welcome!",
            body=f"Hello {name}"
        )
        return user

def test_register_user(mocker):
    """Mock 邮件服务。"""
    # Patch send_email 方法
    mock_send = mocker.patch.object(EmailService, 'send_email')

    service = UserService()
    user = service.register_user('alice@example.com', 'Alice')

    # 验证邮件已发送
    mock_send.assert_called_once_with(
        to='alice@example.com',
        subject='Welcome!',
        body='Hello Alice'
    )
```

### Mock 返回值和副作用

```python
def test_mock_return_values(mocker):
    """配置不同的返回值。"""
    mock_func = mocker.Mock()

    # 单个返回值
    mock_func.return_value = 42
    assert mock_func() == 42

    # 多个返回值
    mock_func.side_effect = [1, 2, 3]
    assert mock_func() == 1
    assert mock_func() == 2
    assert mock_func() == 3

    # 抛出异常
    mock_func.side_effect = ValueError("Error")
    with pytest.raises(ValueError):
        mock_func()
```

### 监视真实函数

```python
def test_spy_on_function(mocker):
    """Spy 调用真实函数并记录调用。"""
    spy = mocker.spy(Calculator, 'add')

    calc = Calculator()
    result = calc.add(2, 3)

    assert result == 5  # 真实函数被调用
    spy.assert_called_once_with(calc, 2, 3)
```

### Mock 上下文管理器

```python
def test_mock_file_operations(mocker):
    """Mock 文件操作。"""
    mock_open = mocker.patch('builtins.open', mocker.mock_open(read_data='content'))

    with open('test.txt', 'r') as f:
        content = f.read()

    assert content == 'content'
    mock_open.assert_called_once_with('test.txt', 'r')
```

### 高级 Mock 示例

```python
class PaymentProcessor:
    def __init__(self, api_key):
        self.api_key = api_key

    def charge_card(self, amount, card_token):
        # 调用外部支付 API
        response = payment_api.charge(
            api_key=self.api_key,
            amount=amount,
            token=card_token
        )
        return response

@pytest.fixture
def payment_processor(mocker):
    """提供带有 mock API 的支付处理器。"""
    mocker.patch('payment_api.charge')
    return PaymentProcessor('test_key')

def test_successful_charge(payment_processor, mocker):
    """测试成功支付。"""
    mock_charge = mocker.patch('payment_api.charge')
    mock_charge.return_value = {
        'status': 'success',
        'transaction_id': 'txn_123'
    }

    result = payment_processor.charge_card(100.00, 'card_token')

    assert result['status'] == 'success'
    mock_charge.assert_called_with(
        api_key='test_key',
        amount=100.00,
        token='card_token'
    )
```

## 代码覆盖率

使用 pytest-cov 测量测试覆盖率并识别未测试的代码。

### 安装覆盖率

```bash
pip install pytest-cov
```

### 运行覆盖率

```bash
# 基本覆盖率报告
pytest --cov=src

# HTML 覆盖率报告
pytest --cov=src --cov-report=html

# 终端和 HTML 报告
pytest --cov=src --cov-report=term --cov-report=html

# 特定模块的覆盖率
pytest --cov=myapp.calculator tests/

# 显示缺失行
pytest --cov=src --cov-report=term-missing

# 如果覆盖率低于阈值则失败
pytest --cov=src --cov-fail-under=80
```

### 覆盖率配置

添加到 `pytest.ini` 或创建 `.coveragerc`：

```ini
[coverage:run]
source = src
omit =
    */tests/*
    */venv/*
    */__pycache__/*

[coverage:report]
precision = 2
show_missing = True
skip_covered = False

exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
    if TYPE_CHECKING:
```

### 代码中的覆盖率

```python
def complex_function(value):
    if value > 0:
        return "positive"
    elif value < 0:  # pragma: no cover - 从覆盖率中跳过
        # 这是我们不想测试的遗留代码
        return "negative"
    else:
        return "zero"
```

### 覆盖率报告示例

```
---------- coverage: platform linux, python 3.10.0 -----------
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
src/calculator.py          15      2    87%   23-24
src/user.py                45      5    89%   67, 89-92
src/utils.py               30      0   100%
-----------------------------------------------------
TOTAL                      90      7    92%
```

## 最佳实践

### 测试组织

```python
# 好：按功能组织测试
tests/
├── unit/
│   ├── test_calculator.py
│   └── test_user.py
├── integration/
│   ├── test_api.py
│   └── test_database.py
└── conftest.py

# 使用描述性测试名称
def test_user_registration_with_valid_email():
    pass

def test_user_registration_fails_with_duplicate_email():
    pass
```

### 使用 Fixtures 进行设置

```python
# 好：使用 fixtures 进行通用设置
@pytest.fixture
def authenticated_client():
    client = TestClient()
    client.login('user', 'password')
    return client

def test_protected_endpoint(authenticated_client):
    response = authenticated_client.get('/protected')
    assert response.status_code == 200

# 不好：在每个测试中重复设置
def test_protected_endpoint_bad():
    client = TestClient()
    client.login('user', 'password')
    response = client.get('/protected')
    assert response.status_code == 200
```

### 一次只测试一件事

```python
# 好：测试一个行为
def test_add_returns_sum():
    assert add(2, 3) == 5

def test_add_handles_negative_numbers():
    assert add(-1, -1) == -2

# 不好：测试多个行为
def test_calculator_operations():
    assert add(2, 3) == 5
    assert subtract(5, 3) == 2
    assert multiply(2, 3) == 6
    assert divide(6, 2) == 3
```

### 对类似测试使用参数化

```python
# 好：参数化测试
@pytest.mark.parametrize("email,valid", [
    ("user@example.com", True),
    ("invalid", False),
    ("@example.com", False),
    ("user@.com", False),
])
def test_email_validation(email, valid):
    assert validate_email(email) == valid

# 不好：重复测试
def test_valid_email():
    assert validate_email("user@example.com") == True

def test_invalid_email_no_at():
    assert validate_email("invalid") == False
```

### 使用标记进行测试分类

```python
@pytest.mark.unit
def test_unit_test():
    pass

@pytest.mark.integration
@pytest.mark.slow
def test_integration_test():
    pass
```

### 清晰的断言

```python
# 好：清晰的断言消息
def test_user_age():
    user = User(name="Alice", age=30)
    assert user.age > 0, f"User age should be positive, got {user.age}"

# 好：使用辅助函数进行复杂断言
def assert_valid_user(user):
    assert user.name
    assert user.email
    assert user.age > 0

def test_user_creation():
    user = create_user("Alice", "alice@example.com", 30)
    assert_valid_user(user)
```

### 避免测试相互依赖

```python
# 好：独立测试
def test_create_user():
    user = User.create("Alice")
    assert user.name == "Alice"

def test_delete_user():
    user = User.create("Bob")
    user.delete()
    assert user.is_deleted

# 不好：测试依赖执行顺序
users = []

def test_create_user_bad():
    user = User.create("Alice")
    users.append(user)
    assert len(users) == 1

def test_has_users_bad():
    # 依赖前一个测试
    assert len(users) > 0
```

### Mock 外部依赖

```python
# 好：Mock 外部服务
def test_fetch_weather(mocker):
    mock_api = mocker.patch('weather_service.get_weather')
    mock_api.return_value = {'temp': 20, 'conditions': 'sunny'}

    result = get_current_weather('London')
    assert result['temp'] == 20

# 不好：调用真实外部 API
def test_fetch_weather_bad():
    result = get_current_weather('London')  # 真实 API 调用
    assert 'temp' in result
```

### 测试边界情况

```python
@pytest.mark.parametrize("value,expected", [
    (0, "zero"),           # 边界：零
    (1, "positive"),       # 正常：正数
    (-1, "negative"),      # 正常：负数
    (sys.maxsize, "positive"),    # 边界：最大整数
    (-sys.maxsize, "negative"),   # 边界：最小整数
])
def test_classify_number(value, expected):
    assert classify(value) == expected
```

### 测试后清理

```python
@pytest.fixture
def temp_database():
    """创建临时数据库并清理。"""
    db = create_test_database()
    yield db
    db.drop_all_tables()
    db.close()
```

## 总结

pytest 是一个强大、灵活的测试框架，使编写和维护测试更容易。通过利用 fixtures、参数化、标记和 mock，你可以创建全面的测试套件，为你的代码质量提供信心。

关键要点：

- **从简单开始**：基本的 assert 语句很强大
- **使用 fixtures**：避免代码重复和管理依赖
- **参数化**：高效地测试多个场景
- **明智地 mock**：隔离单元并避免外部依赖
- **测量覆盖率**：识别未测试的代码路径
- **遵循最佳实践**：保持测试独立、专注和可维护

使用 pytest 和良好的测试实践，你可以自信地构建健壮、可维护的 Python 应用程序。

## 额外资源

- [官方 pytest 文档](https://docs.pytest.org/)
- [pytest-cov 文档](https://pytest-cov.readthedocs.io/)
- [pytest-mock 文档](https://pytest-mock.readthedocs.io/)
- [Python Testing with pytest 书籍](https://pragprog.com/titles/bopytest/)
- [Real Python pytest 教程](https://realpython.com/pytest-python-testing/)
