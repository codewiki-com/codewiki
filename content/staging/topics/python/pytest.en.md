---
title: Python Testing with pytest
description: "Master pytest: test writing, fixtures, parametrization, mocking and coverage"
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - pytest
  - Testing
  - TDD
status: imported
origin: old/src/content/docs/python/pytest.en.md
divergence: 0.228
issues: []
legacy:
  category: Python
  subcategory: Testing and Debugging
  order: 13
  lastUpdated: 2026-01-07
---

pytest is the most popular testing framework for Python, known for its simplicity, powerful features, and extensive plugin ecosystem. We'll cover everything from basic test writing to advanced techniques like fixtures, parametrization, and mocking.

## Introduction to pytest

pytest is a mature, feature-rich testing framework that makes it easy to write small, readable tests while scaling to support complex functional testing for applications and libraries.

### Key Features

- **Simple syntax**: No boilerplate code required
- **Detailed assertion introspection**: Clear failure messages
- **Fixtures**: Powerful dependency injection system
- **Parametrization**: Run tests with multiple inputs
- **Plugin architecture**: Extensive ecosystem of plugins
- **Parallel execution**: Run tests concurrently with pytest-xdist
- **Compatible**: Works with unittest and nose tests

## Installation and Setup

Install pytest using pip:

```bash
pip install pytest
```

For additional features, install these common plugins:

```bash
pip install pytest-cov pytest-mock pytest-xdist pytest-asyncio
```

### Project Structure

A typical pytest project structure:

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

### Configuration File

Create a `pytest.ini` file in your project root:

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

## Writing Basic Tests

pytest uses simple assert statements and follows naming conventions for test discovery.

### Basic Test Example

```python
# src/myapp/calculator.py
def add(a, b):
    """Add two numbers."""
    return a + b

def subtract(a, b):
    """Subtract b from a."""
    return a - b

def multiply(a, b):
    """Multiply two numbers."""
    return a * b

def divide(a, b):
    """Divide a by b."""
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

### Test Classes

Organize related tests using classes:

```python
class TestCalculator:
    """Tests for calculator operations."""

    def test_addition(self):
        assert add(1, 2) == 3

    def test_subtraction(self):
        assert subtract(5, 2) == 3

    def test_complex_calculation(self):
        result = add(multiply(2, 3), divide(10, 2))
        assert result == 11
```

## Test Discovery and Execution

pytest automatically discovers tests based on naming conventions:

- Test files: `test_*.py` or `*_test.py`
- Test functions: `test_*()`
- Test classes: `Test*`
- Test methods: `test_*()`

### Running Tests

```bash
# Run all tests
pytest

# Run specific file
pytest tests/test_calculator.py

# Run specific test
pytest tests/test_calculator.py::test_add

# Run tests in a class
pytest tests/test_calculator.py::TestCalculator

# Run tests matching a pattern
pytest -k "add or subtract"

# Run with verbose output
pytest -v

# Run and show print statements
pytest -s

# Stop at first failure
pytest -x

# Show local variables in tracebacks
pytest -l
```

## Assertions

pytest provides detailed assertion introspection, showing the values of variables in failed assertions.

### Basic Assertions

```python
def test_assertions():
    # Equality
    assert 1 + 1 == 2

    # Inequality
    assert 5 != 3

    # Comparisons
    assert 10 > 5
    assert 3 <= 3

    # Membership
    assert 'a' in 'abc'
    assert 5 in [1, 2, 3, 4, 5]

    # Identity
    assert None is None
    assert [] is not []

    # Boolean
    assert True
    assert not False
```

### Approximate Comparisons

```python
import pytest

def test_approximate():
    # For floating point comparisons
    assert 0.1 + 0.2 == pytest.approx(0.3)
    assert {'a': 0.1 + 0.2} == pytest.approx({'a': 0.3})

    # With custom tolerance
    assert 10 == pytest.approx(10.5, abs=0.6)
    assert 100 == pytest.approx(99, rel=0.02)
```

### Exception Testing

```python
def test_exceptions():
    # Assert exception is raised
    with pytest.raises(ValueError):
        int('invalid')

    # Check exception message
    with pytest.raises(ValueError, match="invalid literal"):
        int('invalid')

    # Access exception object
    with pytest.raises(ZeroDivisionError) as exc_info:
        1 / 0
    assert "division by zero" in str(exc_info.value)
```

### Warnings Testing

```python
import warnings

def test_warnings():
    with pytest.warns(UserWarning):
        warnings.warn("This is a warning", UserWarning)

    # Check warning message
    with pytest.warns(UserWarning, match="deprecated"):
        warnings.warn("This function is deprecated", UserWarning)
```

## Fixtures

Fixtures are pytest's way of providing reusable setup and teardown code. They use dependency injection to provide test data and resources.

### Basic Fixtures

```python
# tests/conftest.py
import pytest

@pytest.fixture
def sample_data():
    """Provide sample data for tests."""
    return [1, 2, 3, 4, 5]

@pytest.fixture
def calculator():
    """Provide a calculator instance."""
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

### Fixture Scopes

Control fixture lifecycle with scopes:

```python
@pytest.fixture(scope="function")  # Default: run for each test
def function_fixture():
    return "new instance per test"

@pytest.fixture(scope="class")  # Run once per test class
def class_fixture():
    return "shared within class"

@pytest.fixture(scope="module")  # Run once per module
def module_fixture():
    return "shared within module"

@pytest.fixture(scope="session")  # Run once per test session
def session_fixture():
    return "shared across all tests"
```

### Setup and Teardown

```python
@pytest.fixture
def database_connection():
    """Setup database connection and cleanup after test."""
    # Setup
    connection = connect_to_database()

    yield connection  # Provide fixture value

    # Teardown
    connection.close()

def test_database_query(database_connection):
    result = database_connection.query("SELECT * FROM users")
    assert len(result) > 0
```

### Fixture Factories

```python
@pytest.fixture
def make_user():
    """Factory fixture to create users."""
    created_users = []

    def _make_user(name, email):
        user = User(name=name, email=email)
        created_users.append(user)
        return user

    yield _make_user

    # Cleanup all created users
    for user in created_users:
        user.delete()

def test_user_creation(make_user):
    user1 = make_user("Alice", "alice@example.com")
    user2 = make_user("Bob", "bob@example.com")

    assert user1.name == "Alice"
    assert user2.email == "bob@example.com"
```

### Parametrized Fixtures

```python
@pytest.fixture(params=[1, 2, 3])
def number(request):
    """Fixture that provides multiple values."""
    return request.param

def test_with_parametrized_fixture(number):
    # This test runs three times, once for each parameter
    assert number > 0
```

### Built-in Fixtures

pytest provides useful built-in fixtures:

```python
def test_tmp_path(tmp_path):
    """tmp_path provides a temporary directory."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("Hello, World!")
    assert test_file.read_text() == "Hello, World!"

def test_monkeypatch(monkeypatch):
    """monkeypatch allows modifying objects and environment."""
    monkeypatch.setenv("API_KEY", "test_key")
    monkeypatch.setattr("os.getcwd", lambda: "/fake/path")

    import os
    assert os.getenv("API_KEY") == "test_key"

def test_capsys(capsys):
    """capsys captures stdout and stderr."""
    print("Hello")
    print("Error", file=sys.stderr)

    captured = capsys.readouterr()
    assert "Hello" in captured.out
    assert "Error" in captured.err
```

## Parametrized Tests

Run the same test with different inputs using parametrization.

### Basic Parametrization

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

### Multiple Parameters

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

### Parametrizing Multiple Arguments

```python
@pytest.mark.parametrize("x", [0, 1, 2])
@pytest.mark.parametrize("y", [0, 1, 2])
def test_multiply_combinations(x, y):
    # Runs 9 times (3 x 3 combinations)
    result = x * y
    assert result >= 0
```

### Using pytest.param for Custom IDs

```python
@pytest.mark.parametrize("input,expected", [
    pytest.param(2, 4, id="two_squared"),
    pytest.param(3, 9, id="three_squared"),
    pytest.param(4, 16, id="four_squared"),
])
def test_square_with_ids(input, expected):
    assert input ** 2 == expected
```

### Parametrizing Fixtures

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

### Complex Parametrization

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

## Markers and Skipping Tests

Markers allow you to categorize and selectively run tests.

### Built-in Markers

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
    assert False  # Expected to fail

@pytest.mark.xfail(strict=True)
def test_must_fail():
    # Test must fail or it's an error
    assert False
```

### Custom Markers

```python
# Define markers in pytest.ini or conftest.py
@pytest.mark.slow
def test_slow_operation():
    import time
    time.sleep(2)
    assert True

@pytest.mark.integration
def test_database_integration():
    # Integration test
    pass

@pytest.mark.unit
def test_unit_test():
    # Unit test
    pass

# Combine markers
@pytest.mark.slow
@pytest.mark.integration
def test_slow_integration():
    pass
```

### Running Tests by Markers

```bash
# Run only slow tests
pytest -m slow

# Run all except slow tests
pytest -m "not slow"

# Run integration or unit tests
pytest -m "integration or unit"

# Run integration tests that are not slow
pytest -m "integration and not slow"
```

### Conditional Skipping

```python
import pytest

@pytest.mark.skipif(
    not hasattr(ssl, 'SSLContext'),
    reason="SSL not available"
)
def test_ssl_feature():
    pass

# Skip entire module
pytestmark = pytest.mark.skipif(
    sys.platform == "win32",
    reason="Not supported on Windows"
)
```

## Mocking and Patching

Use pytest-mock or unittest.mock to replace dependencies with mock objects.

### Basic Mocking with unittest.mock

```python
from unittest.mock import Mock, MagicMock, patch
import pytest

# Code to test
def get_user_data(user_id):
    """Fetch user data from external API."""
    response = requests.get(f"https://api.example.com/users/{user_id}")
    return response.json()

def test_get_user_data_with_mock():
    """Test using manual mock."""
    with patch('requests.get') as mock_get:
        # Configure mock
        mock_response = Mock()
        mock_response.json.return_value = {
            'id': 1,
            'name': 'Alice'
        }
        mock_get.return_value = mock_response

        # Test
        result = get_user_data(1)

        # Assertions
        assert result['name'] == 'Alice'
        mock_get.assert_called_once_with('https://api.example.com/users/1')
```

### Using pytest-mock

```python
def test_with_pytest_mock(mocker):
    """pytest-mock provides a mocker fixture."""
    mock_get = mocker.patch('requests.get')
    mock_get.return_value.json.return_value = {'id': 1, 'name': 'Alice'}

    result = get_user_data(1)

    assert result['name'] == 'Alice'
    mock_get.assert_called_once()
```

### Patching Objects and Methods

```python
class EmailService:
    def send_email(self, to, subject, body):
        # Actually send email
        pass

class UserService:
    def __init__(self):
        self.email_service = EmailService()

    def register_user(self, email, name):
        # Create user
        user = User(email=email, name=name)
        user.save()

        # Send welcome email
        self.email_service.send_email(
            to=email,
            subject="Welcome!",
            body=f"Hello {name}"
        )
        return user

def test_register_user(mocker):
    """Mock the email service."""
    # Patch the send_email method
    mock_send = mocker.patch.object(EmailService, 'send_email')

    service = UserService()
    user = service.register_user('alice@example.com', 'Alice')

    # Verify email was sent
    mock_send.assert_called_once_with(
        to='alice@example.com',
        subject='Welcome!',
        body='Hello Alice'
    )
```

### Mock Return Values and Side Effects

```python
def test_mock_return_values(mocker):
    """Configure different return values."""
    mock_func = mocker.Mock()

    # Single return value
    mock_func.return_value = 42
    assert mock_func() == 42

    # Multiple return values
    mock_func.side_effect = [1, 2, 3]
    assert mock_func() == 1
    assert mock_func() == 2
    assert mock_func() == 3

    # Raise exception
    mock_func.side_effect = ValueError("Error")
    with pytest.raises(ValueError):
        mock_func()
```

### Spying on Real Functions

```python
def test_spy_on_function(mocker):
    """Spy calls the real function and records calls."""
    spy = mocker.spy(Calculator, 'add')

    calc = Calculator()
    result = calc.add(2, 3)

    assert result == 5  # Real function was called
    spy.assert_called_once_with(calc, 2, 3)
```

### Mocking Context Managers

```python
def test_mock_file_operations(mocker):
    """Mock file operations."""
    mock_open = mocker.patch('builtins.open', mocker.mock_open(read_data='content'))

    with open('test.txt', 'r') as f:
        content = f.read()

    assert content == 'content'
    mock_open.assert_called_once_with('test.txt', 'r')
```

### Advanced Mocking Example

```python
class PaymentProcessor:
    def __init__(self, api_key):
        self.api_key = api_key

    def charge_card(self, amount, card_token):
        # Call external payment API
        response = payment_api.charge(
            api_key=self.api_key,
            amount=amount,
            token=card_token
        )
        return response

@pytest.fixture
def payment_processor(mocker):
    """Provide a payment processor with mocked API."""
    mocker.patch('payment_api.charge')
    return PaymentProcessor('test_key')

def test_successful_charge(payment_processor, mocker):
    """Test successful payment."""
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

## Code Coverage

Use pytest-cov to measure test coverage and identify untested code.

### Installing Coverage

```bash
pip install pytest-cov
```

### Running with Coverage

```bash
# Basic coverage report
pytest --cov=src

# HTML coverage report
pytest --cov=src --cov-report=html

# Terminal and HTML reports
pytest --cov=src --cov-report=term --cov-report=html

# Coverage for specific module
pytest --cov=myapp.calculator tests/

# Show missing lines
pytest --cov=src --cov-report=term-missing

# Fail if coverage below threshold
pytest --cov=src --cov-fail-under=80
```

### Coverage Configuration

Add to `pytest.ini` or create `.coveragerc`:

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

### Coverage in Code

```python
def complex_function(value):
    if value > 0:
        return "positive"
    elif value < 0:  # pragma: no cover - skip from coverage
        # This is legacy code we don't want to test
        return "negative"
    else:
        return "zero"
```

### Example Coverage Report

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

## Best Practices

### Test Organization

```python
# Good: Organize tests by feature
tests/
├── unit/
│   ├── test_calculator.py
│   └── test_user.py
├── integration/
│   ├── test_api.py
│   └── test_database.py
└── conftest.py

# Use descriptive test names
def test_user_registration_with_valid_email():
    pass

def test_user_registration_fails_with_duplicate_email():
    pass
```

### Use Fixtures for Setup

```python
# Good: Use fixtures for common setup
@pytest.fixture
def authenticated_client():
    client = TestClient()
    client.login('user', 'password')
    return client

def test_protected_endpoint(authenticated_client):
    response = authenticated_client.get('/protected')
    assert response.status_code == 200

# Bad: Duplicate setup in each test
def test_protected_endpoint_bad():
    client = TestClient()
    client.login('user', 'password')
    response = client.get('/protected')
    assert response.status_code == 200
```

### Test One Thing at a Time

```python
# Good: Test one behavior
def test_add_returns_sum():
    assert add(2, 3) == 5

def test_add_handles_negative_numbers():
    assert add(-1, -1) == -2

# Bad: Test multiple behaviors
def test_calculator_operations():
    assert add(2, 3) == 5
    assert subtract(5, 3) == 2
    assert multiply(2, 3) == 6
    assert divide(6, 2) == 3
```

### Use Parametrization for Similar Tests

```python
# Good: Parametrized test
@pytest.mark.parametrize("email,valid", [
    ("user@example.com", True),
    ("invalid", False),
    ("@example.com", False),
    ("user@.com", False),
])
def test_email_validation(email, valid):
    assert validate_email(email) == valid

# Bad: Duplicate tests
def test_valid_email():
    assert validate_email("user@example.com") == True

def test_invalid_email_no_at():
    assert validate_email("invalid") == False
```

### Use Markers for Test Categories

```python
@pytest.mark.unit
def test_unit_test():
    pass

@pytest.mark.integration
@pytest.mark.slow
def test_integration_test():
    pass
```

### Clear Assertions

```python
# Good: Clear assertion messages
def test_user_age():
    user = User(name="Alice", age=30)
    assert user.age > 0, f"User age should be positive, got {user.age}"

# Good: Use helper functions for complex assertions
def assert_valid_user(user):
    assert user.name
    assert user.email
    assert user.age > 0

def test_user_creation():
    user = create_user("Alice", "alice@example.com", 30)
    assert_valid_user(user)
```

### Avoid Test Interdependence

```python
# Good: Independent tests
def test_create_user():
    user = User.create("Alice")
    assert user.name == "Alice"

def test_delete_user():
    user = User.create("Bob")
    user.delete()
    assert user.is_deleted

# Bad: Tests depend on execution order
users = []

def test_create_user_bad():
    user = User.create("Alice")
    users.append(user)
    assert len(users) == 1

def test_has_users_bad():
    # Depends on previous test
    assert len(users) > 0
```

### Mock External Dependencies

```python
# Good: Mock external services
def test_fetch_weather(mocker):
    mock_api = mocker.patch('weather_service.get_weather')
    mock_api.return_value = {'temp': 20, 'conditions': 'sunny'}

    result = get_current_weather('London')
    assert result['temp'] == 20

# Bad: Call real external API
def test_fetch_weather_bad():
    result = get_current_weather('London')  # Real API call
    assert 'temp' in result
```

### Test Edge Cases

```python
@pytest.mark.parametrize("value,expected", [
    (0, "zero"),           # Edge: zero
    (1, "positive"),       # Normal: positive
    (-1, "negative"),      # Normal: negative
    (sys.maxsize, "positive"),    # Edge: max int
    (-sys.maxsize, "negative"),   # Edge: min int
])
def test_classify_number(value, expected):
    assert classify(value) == expected
```

### Cleanup After Tests

```python
@pytest.fixture
def temp_database():
    """Create temporary database and cleanup."""
    db = create_test_database()
    yield db
    db.drop_all_tables()
    db.close()
```

## Conclusion

pytest is a powerful, flexible testing framework that makes writing and maintaining tests easier. By leveraging fixtures, parametrization, markers, and mocking, you can create comprehensive test suites that provide confidence in your code quality.

Key takeaways:

- **Start simple**: Basic assert statements are powerful
- **Use fixtures**: Avoid code duplication and manage dependencies
- **Parametrize**: Test multiple scenarios efficiently
- **Mock wisely**: Isolate units and avoid external dependencies
- **Measure coverage**: Identify untested code paths
- **Follow best practices**: Keep tests independent, focused, and maintainable

With pytest and good testing practices, you can build robust, maintainable Python applications with confidence.

## Additional Resources

- [Official pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [pytest-mock Documentation](https://pytest-mock.readthedocs.io/)
- [Python Testing with pytest Book](https://pragprog.com/titles/bopytest/)
- [Real Python pytest Tutorial](https://realpython.com/pytest-python-testing/)
