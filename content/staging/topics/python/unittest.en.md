---
title: Python unittest Testing Framework
description: Master Python's built-in unittest testing framework including test cases, assertions, test suites, and mocking
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - unittest
  - testing
  - TDD
status: imported
origin: old/src/content/docs/python/unittest.en.md
divergence: 0.227
issues: []
legacy:
  category: Python
  subcategory: Testing
  order: 30
  lastUpdated: 2026-01-07
---

unittest is Python's built-in unit testing framework, available in the standard library without any additional installation. Inspired by JUnit, it provides an object-oriented approach to organizing test code with rich assertion methods, test fixtures, and test discovery mechanisms. We'll cover the core features and best practices of unittest.

## Getting Started with unittest

### Your First Test

unittest requires test classes to inherit from `unittest.TestCase`, and test methods must start with `test_`.

```python
# test_basic.py
import unittest

def add(a, b):
    """Simple addition function."""
    return a + b

def subtract(a, b):
    """Simple subtraction function."""
    return a - b

class TestMathFunctions(unittest.TestCase):
    """Test mathematical functions."""

    def test_add(self):
        """Test addition."""
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)
        self.assertEqual(add(0, 0), 0)

    def test_add_strings(self):
        """Test string concatenation."""
        self.assertEqual(add("hello", "world"), "helloworld")

    def test_subtract(self):
        """Test subtraction."""
        self.assertEqual(subtract(5, 3), 2)
        self.assertEqual(subtract(0, 5), -5)

if __name__ == '__main__':
    unittest.main()
```

### Running Tests

```bash
# Run a single test file
python test_basic.py

# Run using the unittest module
python -m unittest test_basic

# Display verbose output
python -m unittest test_basic -v

# Run a specific test class
python -m unittest test_basic.TestMathFunctions

# Run a specific test method
python -m unittest test_basic.TestMathFunctions.test_add
```

### Output Example

```
test_add (test_basic.TestMathFunctions) ... ok
test_add_strings (test_basic.TestMathFunctions) ... ok
test_subtract (test_basic.TestMathFunctions) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.001s

OK
```

## The TestCase Class

`TestCase` is the core class in unittest. All test classes must inherit from it.

### Basic Structure

```python
# test_calculator.py
import unittest

class Calculator:
    """Simple calculator class."""

    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b

    def multiply(self, a, b):
        return a * b

    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

    def power(self, base, exponent):
        if not isinstance(exponent, int) or exponent < 0:
            raise ValueError("Exponent must be a non-negative integer")
        return base ** exponent

class TestCalculator(unittest.TestCase):
    """Calculator test class."""

    def setUp(self):
        """Called before each test method."""
        self.calc = Calculator()

    def test_add(self):
        """Test addition operation."""
        self.assertEqual(self.calc.add(10, 5), 15)
        self.assertEqual(self.calc.add(-3, 3), 0)
        self.assertEqual(self.calc.add(0.1, 0.2), 0.30000000000000004)

    def test_subtract(self):
        """Test subtraction operation."""
        self.assertEqual(self.calc.subtract(10, 5), 5)
        self.assertEqual(self.calc.subtract(5, 10), -5)

    def test_multiply(self):
        """Test multiplication operation."""
        self.assertEqual(self.calc.multiply(3, 4), 12)
        self.assertEqual(self.calc.multiply(-2, 5), -10)
        self.assertEqual(self.calc.multiply(0, 100), 0)

    def test_divide(self):
        """Test division operation."""
        self.assertEqual(self.calc.divide(10, 2), 5)
        self.assertEqual(self.calc.divide(7, 2), 3.5)

    def test_divide_by_zero(self):
        """Test division by zero."""
        with self.assertRaises(ValueError) as context:
            self.calc.divide(10, 0)
        self.assertEqual(str(context.exception), "Cannot divide by zero")

    def test_power(self):
        """Test power operation."""
        self.assertEqual(self.calc.power(2, 3), 8)
        self.assertEqual(self.calc.power(5, 0), 1)
        self.assertEqual(self.calc.power(10, 2), 100)

    def test_power_invalid_exponent(self):
        """Test invalid exponent."""
        with self.assertRaises(ValueError):
            self.calc.power(2, -1)
        with self.assertRaises(ValueError):
            self.calc.power(2, 1.5)

if __name__ == '__main__':
    unittest.main()
```

### Testing a User Class

```python
# test_user.py
import unittest
import re

class User:
    """User class."""

    def __init__(self, username, email, age=None):
        self.username = username
        self.email = email
        self.age = age
        self.is_active = True
        self._validate()

    def _validate(self):
        """Validate user data."""
        if not self.username or len(self.username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not self._is_valid_email(self.email):
            raise ValueError("Invalid email format")
        if self.age is not None and (self.age < 0 or self.age > 150):
            raise ValueError("Age must be between 0 and 150")

    def _is_valid_email(self, email):
        """Validate email format."""
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return bool(re.match(pattern, email))

    def deactivate(self):
        """Deactivate the user."""
        self.is_active = False

    def activate(self):
        """Activate the user."""
        self.is_active = True

    def update_email(self, new_email):
        """Update email address."""
        if not self._is_valid_email(new_email):
            raise ValueError("Invalid email format")
        self.email = new_email

    def get_display_name(self):
        """Get display name."""
        suffix = "" if self.is_active else " (deactivated)"
        return f"{self.username}{suffix}"

    def __str__(self):
        return f"User({self.username}, {self.email})"

    def __eq__(self, other):
        if not isinstance(other, User):
            return False
        return self.username == other.username and self.email == other.email

class TestUser(unittest.TestCase):
    """User class tests."""

    def test_user_creation(self):
        """Test user creation."""
        user = User("johndoe", "john@example.com", 25)
        self.assertEqual(user.username, "johndoe")
        self.assertEqual(user.email, "john@example.com")
        self.assertEqual(user.age, 25)
        self.assertTrue(user.is_active)

    def test_user_creation_without_age(self):
        """Test user creation without age."""
        user = User("janedoe", "jane@example.com")
        self.assertIsNone(user.age)

    def test_invalid_username(self):
        """Test invalid username."""
        with self.assertRaises(ValueError) as context:
            User("ab", "test@example.com")
        self.assertIn("at least 3 characters", str(context.exception))

    def test_invalid_email(self):
        """Test invalid email."""
        with self.assertRaises(ValueError):
            User("testuser", "invalid-email")

    def test_invalid_age(self):
        """Test invalid age."""
        with self.assertRaises(ValueError):
            User("testuser", "test@example.com", -1)
        with self.assertRaises(ValueError):
            User("testuser", "test@example.com", 200)

    def test_deactivate_and_activate(self):
        """Test deactivating and activating user."""
        user = User("testuser", "test@example.com")
        self.assertTrue(user.is_active)

        user.deactivate()
        self.assertFalse(user.is_active)

        user.activate()
        self.assertTrue(user.is_active)

    def test_update_email(self):
        """Test email update."""
        user = User("testuser", "old@example.com")
        user.update_email("new@example.com")
        self.assertEqual(user.email, "new@example.com")

    def test_update_email_invalid(self):
        """Test invalid email update."""
        user = User("testuser", "test@example.com")
        with self.assertRaises(ValueError):
            user.update_email("invalid")

    def test_get_display_name_active(self):
        """Test display name for active user."""
        user = User("testuser", "test@example.com")
        self.assertEqual(user.get_display_name(), "testuser")

    def test_get_display_name_inactive(self):
        """Test display name for deactivated user."""
        user = User("testuser", "test@example.com")
        user.deactivate()
        self.assertEqual(user.get_display_name(), "testuser (deactivated)")

    def test_user_equality(self):
        """Test user equality."""
        user1 = User("testuser", "test@example.com")
        user2 = User("testuser", "test@example.com")
        user3 = User("testuser", "other@example.com")

        self.assertEqual(user1, user2)
        self.assertNotEqual(user1, user3)

    def test_user_str(self):
        """Test user string representation."""
        user = User("testuser", "test@example.com")
        self.assertEqual(str(user), "User(testuser, test@example.com)")

if __name__ == '__main__':
    unittest.main()
```

## Assertion Methods

unittest provides a rich set of assertion methods for validating test results.

### Basic Assertions

```python
# test_assertions.py
import unittest

class TestBasicAssertions(unittest.TestCase):
    """Basic assertion methods test."""

    def test_assertEqual(self):
        """Test equality assertion."""
        self.assertEqual(1 + 1, 2)
        self.assertEqual("hello", "hello")
        self.assertEqual([1, 2, 3], [1, 2, 3])
        self.assertEqual({"a": 1}, {"a": 1})

    def test_assertNotEqual(self):
        """Test inequality assertion."""
        self.assertNotEqual(1, 2)
        self.assertNotEqual("hello", "world")

    def test_assertTrue_assertFalse(self):
        """Test boolean assertions."""
        self.assertTrue(True)
        self.assertTrue(1)
        self.assertTrue([1, 2, 3])

        self.assertFalse(False)
        self.assertFalse(0)
        self.assertFalse([])
        self.assertFalse("")

    def test_assertIs_assertIsNot(self):
        """Test identity assertions."""
        a = [1, 2, 3]
        b = a
        c = [1, 2, 3]

        self.assertIs(a, b)
        self.assertIsNot(a, c)

    def test_assertIsNone_assertIsNotNone(self):
        """Test None assertions."""
        self.assertIsNone(None)
        self.assertIsNotNone(0)
        self.assertIsNotNone("")
        self.assertIsNotNone([])

    def test_assertIn_assertNotIn(self):
        """Test membership assertions."""
        self.assertIn(3, [1, 2, 3, 4, 5])
        self.assertIn("hello", "hello world")
        self.assertIn("a", {"a": 1, "b": 2})

        self.assertNotIn(6, [1, 2, 3, 4, 5])
        self.assertNotIn("foo", "hello world")

    def test_assertIsInstance_assertNotIsInstance(self):
        """Test type assertions."""
        self.assertIsInstance(1, int)
        self.assertIsInstance("hello", str)
        self.assertIsInstance([1, 2], list)
        self.assertIsInstance({"a": 1}, dict)

        self.assertNotIsInstance("hello", int)
        self.assertNotIsInstance(1, str)

if __name__ == '__main__':
    unittest.main()
```

### Comparison Assertions

```python
# test_comparison_assertions.py
import unittest

class TestComparisonAssertions(unittest.TestCase):
    """Comparison assertion methods test."""

    def test_assertGreater(self):
        """Test greater than assertion."""
        self.assertGreater(5, 3)
        self.assertGreater(10.5, 10.4)
        self.assertGreater("b", "a")

    def test_assertGreaterEqual(self):
        """Test greater than or equal assertion."""
        self.assertGreaterEqual(5, 5)
        self.assertGreaterEqual(5, 3)

    def test_assertLess(self):
        """Test less than assertion."""
        self.assertLess(3, 5)
        self.assertLess(-1, 0)

    def test_assertLessEqual(self):
        """Test less than or equal assertion."""
        self.assertLessEqual(5, 5)
        self.assertLessEqual(3, 5)

    def test_assertAlmostEqual(self):
        """Test approximate equality (for floating point)."""
        # Default precision is 7 decimal places
        self.assertAlmostEqual(0.1 + 0.2, 0.3, places=10)
        self.assertAlmostEqual(1.0 / 3.0, 0.333333, places=5)

        # Using delta parameter
        self.assertAlmostEqual(100, 101, delta=2)

    def test_assertNotAlmostEqual(self):
        """Test approximate inequality."""
        self.assertNotAlmostEqual(0.1, 0.2, places=1)
        self.assertNotAlmostEqual(100, 200, delta=50)

if __name__ == '__main__':
    unittest.main()
```

### Container Assertions

```python
# test_container_assertions.py
import unittest

class TestContainerAssertions(unittest.TestCase):
    """Container assertion methods test."""

    def test_assertCountEqual(self):
        """Test element count equality (order-independent)."""
        self.assertCountEqual([1, 2, 3], [3, 2, 1])
        self.assertCountEqual([1, 1, 2], [1, 2, 1])
        self.assertCountEqual("abc", "cba")

    def test_assertSequenceEqual(self):
        """Test sequence equality."""
        self.assertSequenceEqual([1, 2, 3], [1, 2, 3])
        self.assertSequenceEqual((1, 2, 3), (1, 2, 3))
        self.assertSequenceEqual("abc", "abc")

    def test_assertListEqual(self):
        """Test list equality."""
        self.assertListEqual([1, 2, 3], [1, 2, 3])
        self.assertListEqual([], [])

    def test_assertTupleEqual(self):
        """Test tuple equality."""
        self.assertTupleEqual((1, 2, 3), (1, 2, 3))
        self.assertTupleEqual((), ())

    def test_assertSetEqual(self):
        """Test set equality."""
        self.assertSetEqual({1, 2, 3}, {3, 2, 1})
        self.assertSetEqual(set(), set())

    def test_assertDictEqual(self):
        """Test dictionary equality."""
        self.assertDictEqual(
            {"a": 1, "b": 2},
            {"b": 2, "a": 1}
        )
        self.assertDictEqual({}, {})

    def test_assertMultiLineEqual(self):
        """Test multiline string equality."""
        text1 = """First line
Second line
Third line"""
        text2 = """First line
Second line
Third line"""
        self.assertMultiLineEqual(text1, text2)

if __name__ == '__main__':
    unittest.main()
```

### Exception Assertions

```python
# test_exception_assertions.py
import unittest

def divide(a, b):
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

def validate_age(age):
    if not isinstance(age, int):
        raise TypeError("Age must be an integer")
    if age < 0:
        raise ValueError("Age cannot be negative")
    if age > 150:
        raise ValueError("Age cannot exceed 150")
    return True

class TestExceptionAssertions(unittest.TestCase):
    """Exception assertion methods test."""

    def test_assertRaises(self):
        """Test exception raising."""
        # Method 1: Using context manager
        with self.assertRaises(ZeroDivisionError):
            divide(10, 0)

        # Method 2: Passing callable and arguments
        self.assertRaises(ZeroDivisionError, divide, 10, 0)

    def test_assertRaises_with_message(self):
        """Test exception message."""
        with self.assertRaises(ZeroDivisionError) as context:
            divide(10, 0)
        self.assertEqual(str(context.exception), "Cannot divide by zero")

    def test_assertRaisesRegex(self):
        """Test exception message matches regex."""
        with self.assertRaisesRegex(ValueError, r"cannot be negative"):
            validate_age(-1)

        with self.assertRaisesRegex(ValueError, r"cannot exceed \d+"):
            validate_age(200)

    def test_assertRaises_type_error(self):
        """Test type error."""
        with self.assertRaises(TypeError) as context:
            validate_age("twenty")
        self.assertIn("integer", str(context.exception))

    def test_no_exception(self):
        """Test normal case without exception."""
        try:
            result = divide(10, 2)
            self.assertEqual(result, 5)
        except Exception as e:
            self.fail(f"Should not raise exception: {e}")

if __name__ == '__main__':
    unittest.main()
```

### Warning Assertions

```python
# test_warning_assertions.py
import unittest
import warnings

def deprecated_function():
    """A deprecated function."""
    warnings.warn("This function is deprecated, use new_function() instead", DeprecationWarning)
    return "old result"

def resource_warning_function():
    """A function that may produce resource warnings."""
    warnings.warn("File not properly closed", ResourceWarning)

class TestWarningAssertions(unittest.TestCase):
    """Warning assertion methods test."""

    def test_assertWarns(self):
        """Test warning is raised."""
        with self.assertWarns(DeprecationWarning):
            deprecated_function()

    def test_assertWarnsRegex(self):
        """Test warning message matches regex."""
        with self.assertWarnsRegex(DeprecationWarning, r"deprecated"):
            deprecated_function()

    def test_assertWarns_resource(self):
        """Test resource warning."""
        with self.assertWarns(ResourceWarning):
            resource_warning_function()

if __name__ == '__main__':
    unittest.main()
```

### Custom Assertion Messages

```python
# test_custom_messages.py
import unittest

class TestCustomMessages(unittest.TestCase):
    """Custom assertion messages test."""

    def test_custom_message(self):
        """All assertion methods support custom error messages."""
        value = 42
        expected = 42

        self.assertEqual(
            value,
            expected,
            msg=f"Computed value {value} does not equal expected {expected}"
        )

    def test_custom_fail_message(self):
        """Using fail() for custom failure messages."""
        condition = True
        if not condition:
            self.fail("Condition check failed: condition should be True")

    def test_subTest(self):
        """Using subTest for parameterized testing."""
        test_cases = [
            (2, 3, 5),
            (0, 0, 0),
            (-1, 1, 0),
            (100, 200, 300),
        ]

        for a, b, expected in test_cases:
            with self.subTest(a=a, b=b, expected=expected):
                self.assertEqual(a + b, expected, f"{a} + {b} should equal {expected}")

if __name__ == '__main__':
    unittest.main()
```

## setUp and tearDown

unittest provides test fixtures for setting up preconditions and cleanup after tests.

### Method-Level setUp and tearDown

```python
# test_fixtures_method.py
import unittest
import tempfile
import os

class TestFileOperations(unittest.TestCase):
    """File operations test."""

    def setUp(self):
        """Called before each test method."""
        print(f"\n[setUp] Preparing test: {self._testMethodName}")
        # Create temporary file
        self.temp_file = tempfile.NamedTemporaryFile(
            mode='w',
            delete=False,
            suffix='.txt'
        )
        self.temp_file.write("Test content")
        self.temp_file.close()
        self.file_path = self.temp_file.name

    def tearDown(self):
        """Called after each test method."""
        print(f"[tearDown] Cleaning up test: {self._testMethodName}")
        # Delete temporary file
        if os.path.exists(self.file_path):
            os.remove(self.file_path)

    def test_read_file(self):
        """Test reading file."""
        with open(self.file_path, 'r') as f:
            content = f.read()
        self.assertEqual(content, "Test content")

    def test_file_exists(self):
        """Test file exists."""
        self.assertTrue(os.path.exists(self.file_path))

    def test_append_to_file(self):
        """Test appending content to file."""
        with open(self.file_path, 'a') as f:
            f.write(" - appended")

        with open(self.file_path, 'r') as f:
            content = f.read()

        self.assertEqual(content, "Test content - appended")

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

### Class-Level setUpClass and tearDownClass

```python
# test_fixtures_class.py
import unittest
import sqlite3

class TestDatabase(unittest.TestCase):
    """Database test."""

    @classmethod
    def setUpClass(cls):
        """Called once before all tests in this class."""
        print("\n[setUpClass] Creating database connection")
        cls.conn = sqlite3.connect(':memory:')
        cls.cursor = cls.conn.cursor()
        cls.cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL,
                age INTEGER
            )
        ''')
        cls.conn.commit()

    @classmethod
    def tearDownClass(cls):
        """Called once after all tests in this class."""
        print("\n[tearDownClass] Closing database connection")
        cls.conn.close()

    def setUp(self):
        """Called before each test method."""
        # Clear table data
        self.cursor.execute('DELETE FROM users')
        self.conn.commit()

    def test_insert_user(self):
        """Test inserting a user."""
        self.cursor.execute(
            'INSERT INTO users (username, email, age) VALUES (?, ?, ?)',
            ('johndoe', 'john@example.com', 25)
        )
        self.conn.commit()

        self.cursor.execute('SELECT * FROM users WHERE username = ?', ('johndoe',))
        user = self.cursor.fetchone()

        self.assertIsNotNone(user)
        self.assertEqual(user[1], 'johndoe')
        self.assertEqual(user[2], 'john@example.com')
        self.assertEqual(user[3], 25)

    def test_insert_multiple_users(self):
        """Test inserting multiple users."""
        users = [
            ('user1', 'user1@example.com', 20),
            ('user2', 'user2@example.com', 30),
            ('user3', 'user3@example.com', 40),
        ]
        self.cursor.executemany(
            'INSERT INTO users (username, email, age) VALUES (?, ?, ?)',
            users
        )
        self.conn.commit()

        self.cursor.execute('SELECT COUNT(*) FROM users')
        count = self.cursor.fetchone()[0]

        self.assertEqual(count, 3)

    def test_unique_constraint(self):
        """Test username uniqueness constraint."""
        self.cursor.execute(
            'INSERT INTO users (username, email, age) VALUES (?, ?, ?)',
            ('unique_user', 'email1@example.com', 25)
        )
        self.conn.commit()

        with self.assertRaises(sqlite3.IntegrityError):
            self.cursor.execute(
                'INSERT INTO users (username, email, age) VALUES (?, ?, ?)',
                ('unique_user', 'email2@example.com', 30)
            )

    def test_query_by_age(self):
        """Test querying by age."""
        users = [
            ('young1', 'young1@example.com', 18),
            ('young2', 'young2@example.com', 22),
            ('older1', 'older1@example.com', 50),
        ]
        self.cursor.executemany(
            'INSERT INTO users (username, email, age) VALUES (?, ?, ?)',
            users
        )
        self.conn.commit()

        self.cursor.execute('SELECT * FROM users WHERE age < ?', (30,))
        young_users = self.cursor.fetchall()

        self.assertEqual(len(young_users), 2)

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

### Module-Level setUpModule and tearDownModule

```python
# test_fixtures_module.py
import unittest
import tempfile
import shutil
import os

# Module-level variable
TEST_DIR = None

def setUpModule():
    """Called once before all tests in this module."""
    global TEST_DIR
    print("\n[setUpModule] Creating test directory")
    TEST_DIR = tempfile.mkdtemp(prefix='unittest_')
    print(f"Test directory: {TEST_DIR}")

def tearDownModule():
    """Called once after all tests in this module."""
    print("\n[tearDownModule] Removing test directory")
    if TEST_DIR and os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR)

class TestDirectoryOperations(unittest.TestCase):
    """Directory operations test."""

    def test_create_file(self):
        """Test creating file in test directory."""
        file_path = os.path.join(TEST_DIR, 'test_file.txt')
        with open(file_path, 'w') as f:
            f.write('Test content')

        self.assertTrue(os.path.exists(file_path))

    def test_create_subdirectory(self):
        """Test creating subdirectory."""
        subdir_path = os.path.join(TEST_DIR, 'subdir')
        os.makedirs(subdir_path, exist_ok=True)

        self.assertTrue(os.path.isdir(subdir_path))

class TestAnotherClass(unittest.TestCase):
    """Another test class."""

    def test_test_dir_exists(self):
        """Test that test directory exists."""
        self.assertTrue(os.path.exists(TEST_DIR))

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

### Using addCleanup

```python
# test_cleanup.py
import unittest
import tempfile
import os

class TestWithCleanup(unittest.TestCase):
    """Using addCleanup for automatic cleanup."""

    def test_with_cleanup(self):
        """Test using addCleanup for automatic cleanup."""
        # Create temporary file
        fd, path = tempfile.mkstemp()
        os.write(fd, b"test content")
        os.close(fd)

        # Register cleanup function
        self.addCleanup(os.remove, path)

        # Cleanup function is called even if test fails
        self.assertTrue(os.path.exists(path))

        with open(path, 'r') as f:
            content = f.read()
        self.assertEqual(content, "test content")

    def test_multiple_cleanups(self):
        """Test multiple cleanup functions."""
        resources = []

        def cleanup_resource(resource):
            print(f"Cleaning up resource: {resource}")
            resources.remove(resource)

        # Create multiple resources
        for i in range(3):
            resource = f"resource_{i}"
            resources.append(resource)
            self.addCleanup(cleanup_resource, resource)

        self.assertEqual(len(resources), 3)
        # Cleanup functions are called in LIFO order

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

## Test Discovery and Execution

### Test Discovery Mechanism

unittest can automatically discover and run tests.

```bash
# Discover and run all tests in current directory and subdirectories
python -m unittest discover

# Specify start directory
python -m unittest discover -s tests

# Specify test file pattern
python -m unittest discover -p "test_*.py"

# Specify top-level directory (for imports)
python -m unittest discover -s tests -t .

# Verbose output
python -m unittest discover -v

# Combine options
python -m unittest discover -s tests -p "*_test.py" -v
```

### Project Structure Example

```
myproject/
├── myproject/
│   ├── __init__.py
│   ├── calculator.py
│   ├── user.py
│   └── utils.py
├── tests/
│   ├── __init__.py
│   ├── test_calculator.py
│   ├── test_user.py
│   └── test_utils.py
└── setup.py
```

### Command Line Options

```python
# test_cli_demo.py
import unittest

class TestDemo(unittest.TestCase):

    def test_pass(self):
        """A passing test."""
        self.assertTrue(True)

    def test_another_pass(self):
        """Another passing test."""
        self.assertEqual(1, 1)

    @unittest.skip("Skipping this test")
    def test_skip(self):
        """A skipped test."""
        pass

if __name__ == '__main__':
    # Common command line options:
    # -v, --verbose: Verbose output
    # -q, --quiet: Quiet mode
    # -f, --failfast: Stop at first failure
    # -c, --catch: Catch Ctrl+C signal
    # -b, --buffer: Buffer stdout and stderr

    unittest.main(verbosity=2, failfast=False, buffer=True)
```

Running examples:

```bash
# Verbose mode
python -m unittest test_cli_demo -v

# Stop at first failure
python -m unittest test_cli_demo -f

# Quiet mode
python -m unittest test_cli_demo -q

# Buffer output
python -m unittest test_cli_demo -b
```

### Using TestLoader for Custom Loading

```python
# custom_loader.py
import unittest

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)

    def test_subtract(self):
        self.assertEqual(5 - 3, 2)

class TestString(unittest.TestCase):
    def test_upper(self):
        self.assertEqual("hello".upper(), "HELLO")

    def test_lower(self):
        self.assertEqual("HELLO".lower(), "hello")

if __name__ == '__main__':
    # Create test loader
    loader = unittest.TestLoader()

    # Load specific test class
    suite = loader.loadTestsFromTestCase(TestMath)

    # Or load from module
    # suite = loader.loadTestsFromModule(test_module)

    # Or load specific method by name
    # suite = loader.loadTestsFromName('test_cli_demo.TestDemo.test_pass')

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)
```

## Test Suites

Test suites (`TestSuite`) are used to organize and run multiple tests together.

### Creating Test Suites

```python
# test_suite.py
import unittest

# Define test classes
class TestArithmetic(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)

    def test_subtract(self):
        self.assertEqual(5 - 3, 2)

    def test_multiply(self):
        self.assertEqual(3 * 4, 12)

class TestString(unittest.TestCase):
    def test_upper(self):
        self.assertEqual("hello".upper(), "HELLO")

    def test_lower(self):
        self.assertEqual("HELLO".lower(), "hello")

    def test_capitalize(self):
        self.assertEqual("hello world".capitalize(), "Hello world")

class TestList(unittest.TestCase):
    def test_append(self):
        lst = [1, 2, 3]
        lst.append(4)
        self.assertEqual(lst, [1, 2, 3, 4])

    def test_remove(self):
        lst = [1, 2, 3]
        lst.remove(2)
        self.assertEqual(lst, [1, 3])

def create_arithmetic_suite():
    """Create arithmetic test suite."""
    suite = unittest.TestSuite()
    suite.addTest(TestArithmetic('test_add'))
    suite.addTest(TestArithmetic('test_subtract'))
    suite.addTest(TestArithmetic('test_multiply'))
    return suite

def create_string_suite():
    """Create string test suite."""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestString)
    return suite

def create_full_suite():
    """Create full test suite."""
    suite = unittest.TestSuite()

    # Add individual test
    suite.addTest(TestArithmetic('test_add'))

    # Add entire test class
    loader = unittest.TestLoader()
    suite.addTests(loader.loadTestsFromTestCase(TestString))
    suite.addTests(loader.loadTestsFromTestCase(TestList))

    return suite

if __name__ == '__main__':
    # Run specific suite
    runner = unittest.TextTestRunner(verbosity=2)

    print("=== Running Arithmetic Suite ===")
    runner.run(create_arithmetic_suite())

    print("\n=== Running String Suite ===")
    runner.run(create_string_suite())

    print("\n=== Running Full Suite ===")
    runner.run(create_full_suite())
```

### Using TestRunner

```python
# test_runner.py
import unittest
import sys
from io import StringIO

class TestExample(unittest.TestCase):
    def test_pass(self):
        self.assertTrue(True)

    def test_another_pass(self):
        self.assertEqual(1, 1)

def run_with_text_runner():
    """Using TextTestRunner."""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestExample)

    # Create custom runner
    runner = unittest.TextTestRunner(
        stream=sys.stdout,
        verbosity=2,
        failfast=False,
        buffer=True
    )

    result = runner.run(suite)

    # Check results
    print(f"\nRun: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")

    return result.wasSuccessful()

def run_with_result_capture():
    """Capture test results."""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestExample)

    # Use StringIO to capture output
    stream = StringIO()
    runner = unittest.TextTestRunner(stream=stream, verbosity=2)
    result = runner.run(suite)

    output = stream.getvalue()
    print("Captured output:")
    print(output)

    return result

if __name__ == '__main__':
    run_with_text_runner()
```

### Organizing Large Test Projects

```python
# tests/__init__.py
import unittest

def load_tests(loader, tests, pattern):
    """
    Custom test loading function.
    This function is automatically called by unittest.
    """
    # Discover all tests in current package
    start_dir = 'tests'
    suite = loader.discover(start_dir, pattern='test_*.py')
    return suite

# tests/test_suite_config.py
import unittest
import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def create_test_suite():
    """Create project test suite."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Discover all tests in tests directory
    tests_dir = os.path.join(project_root, 'tests')
    discovered = loader.discover(tests_dir, pattern='test_*.py')
    suite.addTests(discovered)

    return suite

def run_tests():
    """Run all tests."""
    suite = create_test_suite()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return exit code based on results
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    exit_code = run_tests()
    sys.exit(exit_code)
```

## Mock and Patch

The `unittest.mock` module provides powerful mocking capabilities to isolate test dependencies.

### Mock Basics

```python
# test_mock_basic.py
import unittest
from unittest.mock import Mock, MagicMock, call

class TestMockBasic(unittest.TestCase):
    """Basic Mock usage."""

    def test_mock_creation(self):
        """Create Mock object."""
        mock = Mock()

        # Mock objects can have arbitrary attributes
        mock.name = "test object"
        self.assertEqual(mock.name, "test object")

        # Mock objects can be called
        mock.return_value = 42
        result = mock()
        self.assertEqual(result, 42)

    def test_mock_method(self):
        """Mock methods."""
        mock = Mock()

        # Set method return value
        mock.get_data.return_value = {"key": "value"}
        self.assertEqual(mock.get_data(), {"key": "value"})

        # Chained calls
        mock.api.users.get.return_value = [{"id": 1, "name": "John"}]
        users = mock.api.users.get()
        self.assertEqual(users[0]["name"], "John")

    def test_mock_call_assertions(self):
        """Assert Mock calls."""
        mock = Mock()

        # Call the Mock
        mock.some_method("arg1", key="value")

        # Assert calls
        mock.some_method.assert_called()
        mock.some_method.assert_called_once()
        mock.some_method.assert_called_with("arg1", key="value")
        mock.some_method.assert_called_once_with("arg1", key="value")

    def test_mock_call_count(self):
        """Check call count."""
        mock = Mock()

        mock.method()
        mock.method()
        mock.method()

        self.assertEqual(mock.method.call_count, 3)

    def test_mock_call_args(self):
        """Get call arguments."""
        mock = Mock()

        mock.method("first", key1="value1")
        mock.method("second", key2="value2")

        # Get the last call's arguments
        args, kwargs = mock.method.call_args
        self.assertEqual(args, ("second",))
        self.assertEqual(kwargs, {"key2": "value2"})

        # Get all calls
        expected_calls = [
            call("first", key1="value1"),
            call("second", key2="value2"),
        ]
        mock.method.assert_has_calls(expected_calls)

    def test_mock_side_effect(self):
        """Using side_effect."""
        mock = Mock()

        # Return multiple values
        mock.side_effect = [1, 2, 3]
        self.assertEqual(mock(), 1)
        self.assertEqual(mock(), 2)
        self.assertEqual(mock(), 3)

    def test_mock_side_effect_exception(self):
        """side_effect raising exception."""
        mock = Mock()
        mock.side_effect = ValueError("Test exception")

        with self.assertRaises(ValueError) as context:
            mock()
        self.assertEqual(str(context.exception), "Test exception")

    def test_mock_side_effect_function(self):
        """side_effect with function."""
        mock = Mock()

        def side_effect_func(x):
            return x * 2

        mock.side_effect = side_effect_func

        self.assertEqual(mock(5), 10)
        self.assertEqual(mock(3), 6)

class TestMagicMock(unittest.TestCase):
    """MagicMock usage."""

    def test_magic_methods(self):
        """MagicMock supports magic methods."""
        mock = MagicMock()

        # Set __len__ return value
        mock.__len__.return_value = 10
        self.assertEqual(len(mock), 10)

        # Set __getitem__ return value
        mock.__getitem__.return_value = "item"
        self.assertEqual(mock[0], "item")

        # Set __iter__ return value
        mock.__iter__.return_value = iter([1, 2, 3])
        self.assertEqual(list(mock), [1, 2, 3])

    def test_magic_mock_as_context_manager(self):
        """MagicMock as context manager."""
        mock = MagicMock()
        mock.__enter__.return_value = "resource"

        with mock as resource:
            self.assertEqual(resource, "resource")

        mock.__enter__.assert_called_once()
        mock.__exit__.assert_called_once()

if __name__ == '__main__':
    unittest.main()
```

### Using patch Decorator

```python
# services.py
import requests
import smtplib
from datetime import datetime

class WeatherService:
    """Weather service."""

    def get_weather(self, city):
        """Get weather information."""
        response = requests.get(
            f"https://api.weather.com/v1/city/{city}",
            timeout=10
        )
        return response.json()

    def get_temperature(self, city):
        """Get temperature."""
        data = self.get_weather(city)
        return data.get("temperature")

class EmailService:
    """Email service."""

    def __init__(self, smtp_host, smtp_port):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def send_email(self, to, subject, body):
        """Send email."""
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            message = f"Subject: {subject}\n\n{body}"
            server.sendmail("noreply@example.com", to, message)
        return True

class TimeService:
    """Time service."""

    @staticmethod
    def get_current_time():
        """Get current time."""
        return datetime.now()

    def is_business_hours(self):
        """Check if it's business hours."""
        current = self.get_current_time()
        return 9 <= current.hour < 18 and current.weekday() < 5
```

```python
# test_mock_patch.py
import unittest
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime

# Assuming services module is in the same directory
from services import WeatherService, EmailService, TimeService

class TestWeatherService(unittest.TestCase):
    """Weather service test."""

    @patch('services.requests.get')
    def test_get_weather(self, mock_get):
        """Test getting weather."""
        # Set mock response
        mock_response = Mock()
        mock_response.json.return_value = {
            "city": "London",
            "temperature": 25,
            "humidity": 60
        }
        mock_get.return_value = mock_response

        # Call service
        service = WeatherService()
        weather = service.get_weather("London")

        # Assertions
        self.assertEqual(weather["temperature"], 25)
        mock_get.assert_called_once_with(
            "https://api.weather.com/v1/city/London",
            timeout=10
        )

    @patch('services.requests.get')
    def test_get_temperature(self, mock_get):
        """Test getting temperature."""
        mock_response = Mock()
        mock_response.json.return_value = {"temperature": 30}
        mock_get.return_value = mock_response

        service = WeatherService()
        temp = service.get_temperature("Paris")

        self.assertEqual(temp, 30)

    @patch('services.requests.get')
    def test_weather_api_error(self, mock_get):
        """Test API error."""
        mock_get.side_effect = Exception("Network error")

        service = WeatherService()
        with self.assertRaises(Exception) as context:
            service.get_weather("Tokyo")

        self.assertEqual(str(context.exception), "Network error")

class TestEmailService(unittest.TestCase):
    """Email service test."""

    @patch('services.smtplib.SMTP')
    def test_send_email(self, mock_smtp):
        """Test sending email."""
        # Set mock SMTP instance
        mock_smtp_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_smtp_instance

        # Call service
        service = EmailService("smtp.example.com", 587)
        result = service.send_email(
            "user@example.com",
            "Test Subject",
            "Test Body"
        )

        # Assertions
        self.assertTrue(result)
        mock_smtp.assert_called_once_with("smtp.example.com", 587)
        mock_smtp_instance.sendmail.assert_called_once()

    def test_send_email_with_context(self):
        """Test sending email using context manager."""
        with patch('services.smtplib.SMTP') as mock_smtp:
            mock_smtp_instance = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_smtp_instance

            service = EmailService("smtp.test.com", 25)
            service.send_email("test@example.com", "Subject", "Body")

            mock_smtp_instance.sendmail.assert_called_once()

class TestTimeService(unittest.TestCase):
    """Time service test."""

    @patch.object(TimeService, 'get_current_time')
    def test_is_business_hours_true(self, mock_time):
        """Test within business hours."""
        # Set to Monday 10 AM
        mock_time.return_value = datetime(2026, 1, 5, 10, 0, 0)  # Monday

        service = TimeService()
        self.assertTrue(service.is_business_hours())

    @patch.object(TimeService, 'get_current_time')
    def test_is_business_hours_false_weekend(self, mock_time):
        """Test on weekend."""
        # Set to Saturday 10 AM
        mock_time.return_value = datetime(2026, 1, 3, 10, 0, 0)  # Saturday

        service = TimeService()
        self.assertFalse(service.is_business_hours())

    @patch.object(TimeService, 'get_current_time')
    def test_is_business_hours_false_evening(self, mock_time):
        """Test after business hours."""
        # Set to Monday 8 PM
        mock_time.return_value = datetime(2026, 1, 5, 20, 0, 0)  # Monday

        service = TimeService()
        self.assertFalse(service.is_business_hours())

if __name__ == '__main__':
    unittest.main()
```

### Various patch Usage Patterns

```python
# test_patch_variations.py
import unittest
from unittest.mock import patch, Mock, PropertyMock

class Config:
    """Configuration class."""
    API_URL = "https://api.production.com"
    DEBUG = False

class DataProcessor:
    """Data processor."""

    def __init__(self):
        self._cache = {}

    @property
    def cache_size(self):
        return len(self._cache)

    def process(self, data):
        return data.upper()

class TestPatchVariations(unittest.TestCase):
    """Various patch usage patterns."""

    def test_patch_dict(self):
        """Using patch.dict to modify dictionaries."""
        import os

        with patch.dict(os.environ, {'API_KEY': 'test-key', 'DEBUG': 'true'}):
            self.assertEqual(os.environ.get('API_KEY'), 'test-key')
            self.assertEqual(os.environ.get('DEBUG'), 'true')

        # Original values restored after context
        self.assertIsNone(os.environ.get('API_KEY'))

    def test_patch_object(self):
        """Using patch.object to modify object attributes."""
        with patch.object(Config, 'API_URL', 'https://api.test.com'):
            self.assertEqual(Config.API_URL, 'https://api.test.com')

        # Original value restored after context
        self.assertEqual(Config.API_URL, 'https://api.production.com')

    def test_patch_multiple(self):
        """Patch multiple objects simultaneously."""
        with patch.object(Config, 'API_URL', 'https://api.test.com'), \
             patch.object(Config, 'DEBUG', True):
            self.assertEqual(Config.API_URL, 'https://api.test.com')
            self.assertTrue(Config.DEBUG)

    @patch.object(Config, 'DEBUG', True)
    @patch.object(Config, 'API_URL', 'https://api.staging.com')
    def test_patch_decorators(self, mock_url, mock_debug):
        """Using multiple patch decorators."""
        # Note: Decorators are applied bottom-up, parameters left-to-right
        self.assertEqual(Config.API_URL, 'https://api.staging.com')
        self.assertTrue(Config.DEBUG)

    def test_patch_property(self):
        """Patch a property."""
        processor = DataProcessor()

        with patch.object(
            DataProcessor,
            'cache_size',
            new_callable=PropertyMock,
            return_value=100
        ):
            self.assertEqual(processor.cache_size, 100)

    def test_patch_builtin(self):
        """Patch a builtin function."""
        with patch('builtins.open', Mock()):
            # Now open is a Mock object
            result = open('test.txt')
            self.assertIsInstance(result, Mock)

    def test_patch_start_stop(self):
        """Manually control patch start and stop."""
        patcher = patch.object(Config, 'API_URL', 'https://api.manual.com')

        # Start patch
        patcher.start()
        self.assertEqual(Config.API_URL, 'https://api.manual.com')

        # Stop patch
        patcher.stop()
        self.assertEqual(Config.API_URL, 'https://api.production.com')

if __name__ == '__main__':
    unittest.main()
```

### Mocking Classes and Dependency Injection

```python
# test_mock_injection.py
import unittest
from unittest.mock import Mock, MagicMock, create_autospec

class Database:
    """Database interface."""

    def connect(self):
        raise NotImplementedError

    def execute(self, query, params=None):
        raise NotImplementedError

    def close(self):
        raise NotImplementedError

class UserRepository:
    """User repository."""

    def __init__(self, database):
        self.db = database

    def get_user(self, user_id):
        self.db.connect()
        try:
            result = self.db.execute(
                "SELECT * FROM users WHERE id = ?",
                (user_id,)
            )
            return result
        finally:
            self.db.close()

    def create_user(self, username, email):
        self.db.connect()
        try:
            self.db.execute(
                "INSERT INTO users (username, email) VALUES (?, ?)",
                (username, email)
            )
            return True
        finally:
            self.db.close()

    def get_all_users(self):
        self.db.connect()
        try:
            return self.db.execute("SELECT * FROM users")
        finally:
            self.db.close()

class TestUserRepository(unittest.TestCase):
    """User repository test."""

    def setUp(self):
        """Set up mock database."""
        self.mock_db = Mock(spec=Database)
        self.repo = UserRepository(self.mock_db)

    def test_get_user(self):
        """Test getting a user."""
        # Set return value
        self.mock_db.execute.return_value = {
            "id": 1,
            "username": "johndoe",
            "email": "john@example.com"
        }

        # Call method
        user = self.repo.get_user(1)

        # Assertions
        self.assertEqual(user["username"], "johndoe")
        self.mock_db.connect.assert_called_once()
        self.mock_db.execute.assert_called_once_with(
            "SELECT * FROM users WHERE id = ?",
            (1,)
        )
        self.mock_db.close.assert_called_once()

    def test_create_user(self):
        """Test creating a user."""
        result = self.repo.create_user("janedoe", "jane@example.com")

        self.assertTrue(result)
        self.mock_db.execute.assert_called_once_with(
            "INSERT INTO users (username, email) VALUES (?, ?)",
            ("janedoe", "jane@example.com")
        )

    def test_get_all_users(self):
        """Test getting all users."""
        self.mock_db.execute.return_value = [
            {"id": 1, "username": "user1"},
            {"id": 2, "username": "user2"},
        ]

        users = self.repo.get_all_users()

        self.assertEqual(len(users), 2)
        self.mock_db.execute.assert_called_once_with("SELECT * FROM users")

class TestAutospec(unittest.TestCase):
    """Using autospec to create Mock."""

    def test_create_autospec(self):
        """create_autospec checks method signatures."""
        mock_db = create_autospec(Database)

        # autospec-created mock validates method existence
        mock_db.connect()  # OK
        mock_db.execute("query", params=(1,))  # OK

        # Calling non-existent method raises error
        with self.assertRaises(AttributeError):
            mock_db.nonexistent_method()

if __name__ == '__main__':
    unittest.main()
```

### Mocking Async Code

```python
# test_async_mock.py
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio

class AsyncService:
    """Async service."""

    async def fetch_data(self, url):
        """Asynchronously fetch data."""
        # Actual implementation would use aiohttp or similar
        pass

    async def process_data(self, data):
        """Asynchronously process data."""
        await asyncio.sleep(0.1)
        return data.upper()

class TestAsyncMock(unittest.TestCase):
    """Async Mock tests."""

    def test_async_mock_basic(self):
        """AsyncMock basic usage."""
        mock = AsyncMock()
        mock.return_value = "async result"

        # Run async code
        result = asyncio.run(mock())

        self.assertEqual(result, "async result")
        mock.assert_awaited_once()

    def test_async_mock_side_effect(self):
        """AsyncMock side_effect."""
        mock = AsyncMock()
        mock.side_effect = [1, 2, 3]

        async def run_mock():
            results = []
            for _ in range(3):
                results.append(await mock())
            return results

        results = asyncio.run(run_mock())
        self.assertEqual(results, [1, 2, 3])

    @patch.object(AsyncService, 'fetch_data', new_callable=AsyncMock)
    def test_patch_async_method(self, mock_fetch):
        """Patch async method."""
        mock_fetch.return_value = {"data": "test"}

        async def test_async():
            service = AsyncService()
            result = await service.fetch_data("http://example.com")
            return result

        result = asyncio.run(test_async())

        self.assertEqual(result["data"], "test")
        mock_fetch.assert_awaited_once_with("http://example.com")

if __name__ == '__main__':
    unittest.main()
```

## Best Practices

### Test Naming Conventions

```python
# test_naming.py
import unittest

class TestUserAuthentication(unittest.TestCase):
    """User authentication tests.

    Test class names should start with Test and describe the tested feature.
    """

    def test_user_can_login_with_valid_credentials(self):
        """Test method names should clearly describe the scenario and expected result."""
        pass

    def test_login_fails_with_invalid_password(self):
        """Describe failure scenarios."""
        pass

    def test_login_raises_exception_when_user_not_found(self):
        """Describe exception cases."""
        pass

    def test_password_is_hashed_before_storage(self):
        """Describe specific behaviors."""
        pass
```

### Use the AAA Pattern

```python
# test_aaa_pattern.py
import unittest

class ShoppingCart:
    def __init__(self):
        self.items = []

    def add_item(self, item, price, quantity=1):
        self.items.append({
            "item": item,
            "price": price,
            "quantity": quantity
        })

    def get_total(self):
        return sum(i["price"] * i["quantity"] for i in self.items)

    def get_item_count(self):
        return sum(i["quantity"] for i in self.items)

class TestShoppingCart(unittest.TestCase):
    """Using AAA (Arrange-Act-Assert) pattern."""

    def test_get_total_with_multiple_items(self):
        """Test total with multiple items."""
        # Arrange
        cart = ShoppingCart()
        cart.add_item("Book", 50, 2)
        cart.add_item("Pen", 10, 3)

        # Act
        total = cart.get_total()

        # Assert
        self.assertEqual(total, 130)  # 50*2 + 10*3

    def test_get_item_count(self):
        """Test item count."""
        # Arrange
        cart = ShoppingCart()
        cart.add_item("Item A", 100, 2)
        cart.add_item("Item B", 50, 3)

        # Act
        count = cart.get_item_count()

        # Assert
        self.assertEqual(count, 5)

if __name__ == '__main__':
    unittest.main()
```

### One Test, One Assertion Focus

```python
# test_single_responsibility.py
import unittest

class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email
        self.is_active = True

    def deactivate(self):
        self.is_active = False

class TestUser(unittest.TestCase):
    """Each test method tests one behavior."""

    # Good practice: Each test focuses on one aspect
    def test_user_has_correct_username(self):
        user = User("testuser", "test@example.com")
        self.assertEqual(user.username, "testuser")

    def test_user_has_correct_email(self):
        user = User("testuser", "test@example.com")
        self.assertEqual(user.email, "test@example.com")

    def test_new_user_is_active_by_default(self):
        user = User("testuser", "test@example.com")
        self.assertTrue(user.is_active)

    def test_deactivate_sets_is_active_to_false(self):
        user = User("testuser", "test@example.com")
        user.deactivate()
        self.assertFalse(user.is_active)

    # Avoid: Testing multiple things in one test
    # def test_user(self):
    #     user = User("testuser", "test@example.com")
    #     self.assertEqual(user.username, "testuser")
    #     self.assertEqual(user.email, "test@example.com")
    #     self.assertTrue(user.is_active)
    #     user.deactivate()
    #     self.assertFalse(user.is_active)

if __name__ == '__main__':
    unittest.main()
```

### Use subTest for Parameterized Testing

```python
# test_subtest.py
import unittest

def is_palindrome(s):
    """Check if string is a palindrome."""
    s = s.lower().replace(" ", "")
    return s == s[::-1]

class TestPalindrome(unittest.TestCase):
    """Using subTest for parameterized testing."""

    def test_is_palindrome(self):
        """Test multiple palindrome strings."""
        test_cases = [
            ("radar", True),
            ("level", True),
            ("hello", False),
            ("A man a plan a canal Panama", True),
            ("race car", True),
            ("python", False),
        ]

        for text, expected in test_cases:
            with self.subTest(text=text, expected=expected):
                self.assertEqual(is_palindrome(text), expected)

    def test_is_palindrome_edge_cases(self):
        """Test edge cases."""
        edge_cases = [
            ("", True),
            ("a", True),
            ("aa", True),
            ("ab", False),
        ]

        for text, expected in edge_cases:
            with self.subTest(text=repr(text)):
                result = is_palindrome(text)
                self.assertEqual(
                    result,
                    expected,
                    f"is_palindrome({repr(text)}) should return {expected}"
                )

if __name__ == '__main__':
    unittest.main()
```

### Proper Use of setUp and tearDown

```python
# test_setup_best_practices.py
import unittest

class DatabaseConnection:
    """Simulated database connection."""

    def __init__(self):
        self.connected = False

    def connect(self):
        self.connected = True

    def disconnect(self):
        self.connected = False

    def execute(self, query):
        if not self.connected:
            raise RuntimeError("Not connected to database")
        return f"Executed: {query}"

class TestDatabaseOperations(unittest.TestCase):
    """Database operations test."""

    @classmethod
    def setUpClass(cls):
        """Set up class-level resources (runs once)."""
        # Suitable for: Creating connection pools, loading config, etc.
        cls.config = {"database": "test_db", "host": "localhost"}
        print("Configuration loaded")

    @classmethod
    def tearDownClass(cls):
        """Clean up class-level resources."""
        cls.config = None
        print("Configuration cleaned up")

    def setUp(self):
        """Set up before each test."""
        # Suitable for: Creating test objects, preparing test data
        self.db = DatabaseConnection()
        self.db.connect()

    def tearDown(self):
        """Clean up after each test."""
        # Suitable for: Disconnecting, cleaning up test data
        if self.db.connected:
            self.db.disconnect()

    def test_execute_query(self):
        """Test executing a query."""
        result = self.db.execute("SELECT * FROM users")
        self.assertIn("SELECT", result)

    def test_execute_without_connection_raises_error(self):
        """Test executing without connection."""
        self.db.disconnect()
        with self.assertRaises(RuntimeError):
            self.db.execute("SELECT 1")

if __name__ == '__main__':
    unittest.main()
```

### Testing Exceptions Properly

```python
# test_exceptions_best_practices.py
import unittest

class Validator:
    """Data validator."""

    @staticmethod
    def validate_positive(value):
        if not isinstance(value, (int, float)):
            raise TypeError("Value must be a number")
        if value <= 0:
            raise ValueError("Value must be positive")
        return True

    @staticmethod
    def validate_email(email):
        if not isinstance(email, str):
            raise TypeError("Email must be a string")
        if "@" not in email:
            raise ValueError("Invalid email format: missing @")
        if "." not in email.split("@")[1]:
            raise ValueError("Invalid email format: invalid domain")
        return True

class TestValidator(unittest.TestCase):
    """Validator tests."""

    def test_validate_positive_with_valid_input(self):
        """Test valid input."""
        self.assertTrue(Validator.validate_positive(5))
        self.assertTrue(Validator.validate_positive(0.1))

    def test_validate_positive_raises_type_error_for_non_numeric(self):
        """Test non-numeric input."""
        invalid_inputs = ["string", None, [], {}]

        for value in invalid_inputs:
            with self.subTest(value=value):
                with self.assertRaises(TypeError) as context:
                    Validator.validate_positive(value)
                self.assertIn("must be a number", str(context.exception))

    def test_validate_positive_raises_value_error_for_non_positive(self):
        """Test non-positive input."""
        with self.assertRaises(ValueError) as context:
            Validator.validate_positive(0)
        self.assertIn("must be positive", str(context.exception))

        with self.assertRaises(ValueError):
            Validator.validate_positive(-5)

    def test_validate_email_with_valid_email(self):
        """Test valid emails."""
        valid_emails = [
            "user@example.com",
            "test.user@domain.org",
            "name@sub.domain.com",
        ]

        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(Validator.validate_email(email))

    def test_validate_email_raises_value_error_for_invalid_format(self):
        """Test invalid email format."""
        test_cases = [
            ("invalid.com", "missing @"),
            ("user@domain", "invalid domain"),
        ]

        for email, expected_error in test_cases:
            with self.subTest(email=email):
                with self.assertRaisesRegex(ValueError, expected_error):
                    Validator.validate_email(email)

if __name__ == '__main__':
    unittest.main()
```

### Testing Boundary Conditions

```python
# test_boundary_conditions.py
import unittest

def paginate(items, page, page_size):
    """Pagination function."""
    if page < 1:
        raise ValueError("Page number must be greater than 0")
    if page_size < 1:
        raise ValueError("Page size must be greater than 0")

    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]

class TestPaginate(unittest.TestCase):
    """Pagination function tests."""

    def setUp(self):
        self.items = list(range(1, 101))  # 1-100

    def test_first_page(self):
        """Test first page."""
        result = paginate(self.items, 1, 10)
        self.assertEqual(result, list(range(1, 11)))

    def test_middle_page(self):
        """Test middle page."""
        result = paginate(self.items, 5, 10)
        self.assertEqual(result, list(range(41, 51)))

    def test_last_page(self):
        """Test last page."""
        result = paginate(self.items, 10, 10)
        self.assertEqual(result, list(range(91, 101)))

    def test_page_beyond_total(self):
        """Test page beyond total pages."""
        result = paginate(self.items, 11, 10)
        self.assertEqual(result, [])

    def test_partial_last_page(self):
        """Test incomplete last page."""
        items = list(range(1, 26))  # 25 elements
        result = paginate(items, 3, 10)  # 3rd page has only 5
        self.assertEqual(result, list(range(21, 26)))

    def test_empty_list(self):
        """Test empty list."""
        result = paginate([], 1, 10)
        self.assertEqual(result, [])

    def test_page_size_larger_than_total(self):
        """Test page size larger than total items."""
        result = paginate(self.items, 1, 200)
        self.assertEqual(result, self.items)

    def test_invalid_page_number(self):
        """Test invalid page number."""
        with self.assertRaises(ValueError):
            paginate(self.items, 0, 10)

        with self.assertRaises(ValueError):
            paginate(self.items, -1, 10)

    def test_invalid_page_size(self):
        """Test invalid page size."""
        with self.assertRaises(ValueError):
            paginate(self.items, 1, 0)

        with self.assertRaises(ValueError):
            paginate(self.items, 1, -1)

if __name__ == '__main__':
    unittest.main()
```

### Test File Organization

```
project/
├── src/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth.py
│   └── utils/
│       ├── __init__.py
│       └── validators.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Shared fixtures
│   ├── test_models/
│   │   ├── __init__.py
│   │   └── test_user.py
│   ├── test_services/
│   │   ├── __init__.py
│   │   └── test_auth.py
│   └── test_utils/
│       ├── __init__.py
│       └── test_validators.py
└── setup.py
```

### Skip Tests When Appropriate

```python
# test_skip_examples.py
import unittest
import sys

class TestSkipExamples(unittest.TestCase):
    """Skip test examples."""

    @unittest.skip("Feature not yet implemented")
    def test_future_feature(self):
        """Skip unconditionally."""
        pass

    @unittest.skipIf(sys.version_info < (3, 10), "Requires Python 3.10+")
    def test_python310_feature(self):
        """Skip based on condition."""
        pass

    @unittest.skipUnless(sys.platform.startswith('linux'), "Linux only")
    def test_linux_specific(self):
        """Skip unless condition is true."""
        pass

    @unittest.expectedFailure
    def test_known_bug(self):
        """Mark test as expected to fail."""
        self.assertEqual(1, 2)  # This is a known bug

if __name__ == '__main__':
    unittest.main()
```

### Test Isolation

```python
# test_isolation.py
import unittest

class TestIsolation(unittest.TestCase):
    """Tests should be isolated and independent."""

    # Good: Each test is independent
    def test_create_user(self):
        users = []
        users.append("Alice")
        self.assertEqual(len(users), 1)

    def test_create_another_user(self):
        users = []
        users.append("Bob")
        self.assertEqual(len(users), 1)

    # Bad: Tests sharing state (avoid this)
    # users = []  # Shared state - Don't do this!
    #
    # def test_add_first_user(self):
    #     self.users.append("Alice")
    #     self.assertEqual(len(self.users), 1)
    #
    # def test_add_second_user(self):
    #     # This depends on previous test running first
    #     self.users.append("Bob")
    #     self.assertEqual(len(self.users), 2)  # May fail if order changes

if __name__ == '__main__':
    unittest.main()
```

## Summary

unittest is a full-featured testing framework built into Python's standard library. This guide covered:

1. **TestCase class**: The basic unit for organizing tests with rich testing methods
2. **Assertion methods**: Various assertions for validating test results
3. **Test fixtures**: setUp/tearDown mechanisms for test preparation and cleanup
4. **Test discovery**: Automatic discovery and execution of tests
5. **Test suites**: Organizing and running multiple tests together
6. **Mock and Patch**: Simulating external dependencies for isolated testing
7. **Best practices**: Guidelines for writing high-quality test code

While third-party frameworks like pytest offer more concise syntax and additional features, unittest remains valuable as part of the standard library. It requires no additional installation, making it ideal for restricted environments, and serves as an excellent foundation for understanding Python testing fundamentals.

## Additional Resources

- [unittest Official Documentation](https://docs.python.org/3/library/unittest.html)
- [unittest.mock Official Documentation](https://docs.python.org/3/library/unittest.mock.html)
- [Python Testing Best Practices](https://docs.python-guide.org/writing/tests/)
- [Test-Driven Development (TDD) Introduction](https://realpython.com/python-testing/)
