---
title: Python unittest 单元测试框架
description: 深入学习 Python 内置的 unittest 测试框架，包括测试用例、断言方法、测试套件和 Mock
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - unittest
  - 测试
  - TDD
status: imported
origin: old/src/content/docs/python/unittest.zh.md
divergence: 0.227
issues: []
legacy:
  category: Python
  subcategory: 测试
  order: 30
  lastUpdated: 2026-01-07
---

unittest 是 Python 标准库中内置的单元测试框架，无需额外安装即可使用。它受到 JUnit 的启发，采用面向对象的方式组织测试代码，提供了丰富的断言方法、测试夹具（fixtures）和测试发现机制。本文将全面介绍 unittest 的核心功能和最佳实践。

## unittest 基础

### 第一个测试

unittest 要求测试类继承自 `unittest.TestCase`，测试方法以 `test_` 开头。

```python
# test_basic.py
import unittest

def add(a, b):
    """简单的加法函数"""
    return a + b

def subtract(a, b):
    """简单的减法函数"""
    return a - b

class TestMathFunctions(unittest.TestCase):
    """测试数学函数"""

    def test_add(self):
        """测试加法"""
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)
        self.assertEqual(add(0, 0), 0)

    def test_add_strings(self):
        """测试字符串相加"""
        self.assertEqual(add("hello", "world"), "helloworld")

    def test_subtract(self):
        """测试减法"""
        self.assertEqual(subtract(5, 3), 2)
        self.assertEqual(subtract(0, 5), -5)

if __name__ == '__main__':
    unittest.main()
```

### 运行测试

```bash
# 运行单个测试文件
python test_basic.py

# 使用 unittest 模块运行
python -m unittest test_basic

# 显示详细输出
python -m unittest test_basic -v

# 运行特定测试类
python -m unittest test_basic.TestMathFunctions

# 运行特定测试方法
python -m unittest test_basic.TestMathFunctions.test_add
```

### 输出示例

```
test_add (test_basic.TestMathFunctions) ... ok
test_add_strings (test_basic.TestMathFunctions) ... ok
test_subtract (test_basic.TestMathFunctions) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.001s

OK
```

## TestCase 类详解

`TestCase` 是 unittest 的核心类，所有测试类都需要继承它。

### 基本结构

```python
# test_calculator.py
import unittest

class Calculator:
    """简单计算器类"""

    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b

    def multiply(self, a, b):
        return a * b

    def divide(self, a, b):
        if b == 0:
            raise ValueError("除数不能为零")
        return a / b

    def power(self, base, exponent):
        if not isinstance(exponent, int) or exponent < 0:
            raise ValueError("指数必须是非负整数")
        return base ** exponent

class TestCalculator(unittest.TestCase):
    """计算器测试类"""

    def setUp(self):
        """每个测试方法执行前调用"""
        self.calc = Calculator()

    def test_add(self):
        """测试加法运算"""
        self.assertEqual(self.calc.add(10, 5), 15)
        self.assertEqual(self.calc.add(-3, 3), 0)
        self.assertEqual(self.calc.add(0.1, 0.2), 0.30000000000000004)

    def test_subtract(self):
        """测试减法运算"""
        self.assertEqual(self.calc.subtract(10, 5), 5)
        self.assertEqual(self.calc.subtract(5, 10), -5)

    def test_multiply(self):
        """测试乘法运算"""
        self.assertEqual(self.calc.multiply(3, 4), 12)
        self.assertEqual(self.calc.multiply(-2, 5), -10)
        self.assertEqual(self.calc.multiply(0, 100), 0)

    def test_divide(self):
        """测试除法运算"""
        self.assertEqual(self.calc.divide(10, 2), 5)
        self.assertEqual(self.calc.divide(7, 2), 3.5)

    def test_divide_by_zero(self):
        """测试除以零的情况"""
        with self.assertRaises(ValueError) as context:
            self.calc.divide(10, 0)
        self.assertEqual(str(context.exception), "除数不能为零")

    def test_power(self):
        """测试幂运算"""
        self.assertEqual(self.calc.power(2, 3), 8)
        self.assertEqual(self.calc.power(5, 0), 1)
        self.assertEqual(self.calc.power(10, 2), 100)

    def test_power_invalid_exponent(self):
        """测试无效指数"""
        with self.assertRaises(ValueError):
            self.calc.power(2, -1)
        with self.assertRaises(ValueError):
            self.calc.power(2, 1.5)

if __name__ == '__main__':
    unittest.main()
```

### 测试用户类

```python
# test_user.py
import unittest
import re

class User:
    """用户类"""

    def __init__(self, username, email, age=None):
        self.username = username
        self.email = email
        self.age = age
        self.is_active = True
        self._validate()

    def _validate(self):
        """验证用户数据"""
        if not self.username or len(self.username) < 3:
            raise ValueError("用户名至少需要3个字符")
        if not self._is_valid_email(self.email):
            raise ValueError("邮箱格式无效")
        if self.age is not None and (self.age < 0 or self.age > 150):
            raise ValueError("年龄必须在0-150之间")

    def _is_valid_email(self, email):
        """验证邮箱格式"""
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return bool(re.match(pattern, email))

    def deactivate(self):
        """停用用户"""
        self.is_active = False

    def activate(self):
        """激活用户"""
        self.is_active = True

    def update_email(self, new_email):
        """更新邮箱"""
        if not self._is_valid_email(new_email):
            raise ValueError("邮箱格式无效")
        self.email = new_email

    def get_display_name(self):
        """获取显示名称"""
        suffix = "" if self.is_active else " (已停用)"
        return f"{self.username}{suffix}"

    def __str__(self):
        return f"User({self.username}, {self.email})"

    def __eq__(self, other):
        if not isinstance(other, User):
            return False
        return self.username == other.username and self.email == other.email

class TestUser(unittest.TestCase):
    """用户类测试"""

    def test_user_creation(self):
        """测试用户创建"""
        user = User("zhangsan", "zhangsan@example.com", 25)
        self.assertEqual(user.username, "zhangsan")
        self.assertEqual(user.email, "zhangsan@example.com")
        self.assertEqual(user.age, 25)
        self.assertTrue(user.is_active)

    def test_user_creation_without_age(self):
        """测试不带年龄创建用户"""
        user = User("lisi", "lisi@example.com")
        self.assertIsNone(user.age)

    def test_invalid_username(self):
        """测试无效用户名"""
        with self.assertRaises(ValueError) as context:
            User("ab", "test@example.com")
        self.assertIn("至少需要3个字符", str(context.exception))

    def test_invalid_email(self):
        """测试无效邮箱"""
        with self.assertRaises(ValueError):
            User("testuser", "invalid-email")

    def test_invalid_age(self):
        """测试无效年龄"""
        with self.assertRaises(ValueError):
            User("testuser", "test@example.com", -1)
        with self.assertRaises(ValueError):
            User("testuser", "test@example.com", 200)

    def test_deactivate_and_activate(self):
        """测试停用和激活用户"""
        user = User("testuser", "test@example.com")
        self.assertTrue(user.is_active)

        user.deactivate()
        self.assertFalse(user.is_active)

        user.activate()
        self.assertTrue(user.is_active)

    def test_update_email(self):
        """测试更新邮箱"""
        user = User("testuser", "old@example.com")
        user.update_email("new@example.com")
        self.assertEqual(user.email, "new@example.com")

    def test_update_email_invalid(self):
        """测试更新无效邮箱"""
        user = User("testuser", "test@example.com")
        with self.assertRaises(ValueError):
            user.update_email("invalid")

    def test_get_display_name_active(self):
        """测试获取活跃用户显示名称"""
        user = User("testuser", "test@example.com")
        self.assertEqual(user.get_display_name(), "testuser")

    def test_get_display_name_inactive(self):
        """测试获取已停用用户显示名称"""
        user = User("testuser", "test@example.com")
        user.deactivate()
        self.assertEqual(user.get_display_name(), "testuser (已停用)")

    def test_user_equality(self):
        """测试用户相等性"""
        user1 = User("testuser", "test@example.com")
        user2 = User("testuser", "test@example.com")
        user3 = User("testuser", "other@example.com")

        self.assertEqual(user1, user2)
        self.assertNotEqual(user1, user3)

    def test_user_str(self):
        """测试用户字符串表示"""
        user = User("testuser", "test@example.com")
        self.assertEqual(str(user), "User(testuser, test@example.com)")

if __name__ == '__main__':
    unittest.main()
```

## 断言方法

unittest 提供了丰富的断言方法，用于验证测试结果。

### 基本断言

```python
# test_assertions.py
import unittest

class TestBasicAssertions(unittest.TestCase):
    """基本断言方法测试"""

    def test_assertEqual(self):
        """测试相等断言"""
        self.assertEqual(1 + 1, 2)
        self.assertEqual("hello", "hello")
        self.assertEqual([1, 2, 3], [1, 2, 3])
        self.assertEqual({"a": 1}, {"a": 1})

    def test_assertNotEqual(self):
        """测试不相等断言"""
        self.assertNotEqual(1, 2)
        self.assertNotEqual("hello", "world")

    def test_assertTrue_assertFalse(self):
        """测试布尔断言"""
        self.assertTrue(True)
        self.assertTrue(1)
        self.assertTrue([1, 2, 3])

        self.assertFalse(False)
        self.assertFalse(0)
        self.assertFalse([])
        self.assertFalse("")

    def test_assertIs_assertIsNot(self):
        """测试身份断言"""
        a = [1, 2, 3]
        b = a
        c = [1, 2, 3]

        self.assertIs(a, b)
        self.assertIsNot(a, c)

    def test_assertIsNone_assertIsNotNone(self):
        """测试 None 断言"""
        self.assertIsNone(None)
        self.assertIsNotNone(0)
        self.assertIsNotNone("")
        self.assertIsNotNone([])

    def test_assertIn_assertNotIn(self):
        """测试成员断言"""
        self.assertIn(3, [1, 2, 3, 4, 5])
        self.assertIn("hello", "hello world")
        self.assertIn("a", {"a": 1, "b": 2})

        self.assertNotIn(6, [1, 2, 3, 4, 5])
        self.assertNotIn("foo", "hello world")

    def test_assertIsInstance_assertNotIsInstance(self):
        """测试类型断言"""
        self.assertIsInstance(1, int)
        self.assertIsInstance("hello", str)
        self.assertIsInstance([1, 2], list)
        self.assertIsInstance({"a": 1}, dict)

        self.assertNotIsInstance("hello", int)
        self.assertNotIsInstance(1, str)

if __name__ == '__main__':
    unittest.main()
```

### 比较断言

```python
# test_comparison_assertions.py
import unittest

class TestComparisonAssertions(unittest.TestCase):
    """比较断言方法测试"""

    def test_assertGreater(self):
        """测试大于断言"""
        self.assertGreater(5, 3)
        self.assertGreater(10.5, 10.4)
        self.assertGreater("b", "a")

    def test_assertGreaterEqual(self):
        """测试大于等于断言"""
        self.assertGreaterEqual(5, 5)
        self.assertGreaterEqual(5, 3)

    def test_assertLess(self):
        """测试小于断言"""
        self.assertLess(3, 5)
        self.assertLess(-1, 0)

    def test_assertLessEqual(self):
        """测试小于等于断言"""
        self.assertLessEqual(5, 5)
        self.assertLessEqual(3, 5)

    def test_assertAlmostEqual(self):
        """测试近似相等断言（浮点数比较）"""
        # 默认精度为7位小数
        self.assertAlmostEqual(0.1 + 0.2, 0.3, places=10)
        self.assertAlmostEqual(1.0 / 3.0, 0.333333, places=5)

        # 使用 delta 参数
        self.assertAlmostEqual(100, 101, delta=2)

    def test_assertNotAlmostEqual(self):
        """测试近似不相等断言"""
        self.assertNotAlmostEqual(0.1, 0.2, places=1)
        self.assertNotAlmostEqual(100, 200, delta=50)

if __name__ == '__main__':
    unittest.main()
```

### 容器断言

```python
# test_container_assertions.py
import unittest

class TestContainerAssertions(unittest.TestCase):
    """容器断言方法测试"""

    def test_assertCountEqual(self):
        """测试元素计数相等（不考虑顺序）"""
        self.assertCountEqual([1, 2, 3], [3, 2, 1])
        self.assertCountEqual([1, 1, 2], [1, 2, 1])
        self.assertCountEqual("abc", "cba")

    def test_assertSequenceEqual(self):
        """测试序列相等"""
        self.assertSequenceEqual([1, 2, 3], [1, 2, 3])
        self.assertSequenceEqual((1, 2, 3), (1, 2, 3))
        self.assertSequenceEqual("abc", "abc")

    def test_assertListEqual(self):
        """测试列表相等"""
        self.assertListEqual([1, 2, 3], [1, 2, 3])
        self.assertListEqual([], [])

    def test_assertTupleEqual(self):
        """测试元组相等"""
        self.assertTupleEqual((1, 2, 3), (1, 2, 3))
        self.assertTupleEqual((), ())

    def test_assertSetEqual(self):
        """测试集合相等"""
        self.assertSetEqual({1, 2, 3}, {3, 2, 1})
        self.assertSetEqual(set(), set())

    def test_assertDictEqual(self):
        """测试字典相等"""
        self.assertDictEqual(
            {"a": 1, "b": 2},
            {"b": 2, "a": 1}
        )
        self.assertDictEqual({}, {})

    def test_assertMultiLineEqual(self):
        """测试多行字符串相等"""
        text1 = """第一行
第二行
第三行"""
        text2 = """第一行
第二行
第三行"""
        self.assertMultiLineEqual(text1, text2)

if __name__ == '__main__':
    unittest.main()
```

### 异常断言

```python
# test_exception_assertions.py
import unittest

def divide(a, b):
    if b == 0:
        raise ZeroDivisionError("除数不能为零")
    return a / b

def validate_age(age):
    if not isinstance(age, int):
        raise TypeError("年龄必须是整数")
    if age < 0:
        raise ValueError("年龄不能为负数")
    if age > 150:
        raise ValueError("年龄不能超过150")
    return True

class TestExceptionAssertions(unittest.TestCase):
    """异常断言方法测试"""

    def test_assertRaises(self):
        """测试异常抛出"""
        # 方式一：使用上下文管理器
        with self.assertRaises(ZeroDivisionError):
            divide(10, 0)

        # 方式二：传入可调用对象
        self.assertRaises(ZeroDivisionError, divide, 10, 0)

    def test_assertRaises_with_message(self):
        """测试异常消息"""
        with self.assertRaises(ZeroDivisionError) as context:
            divide(10, 0)
        self.assertEqual(str(context.exception), "除数不能为零")

    def test_assertRaisesRegex(self):
        """测试异常消息匹配正则表达式"""
        with self.assertRaisesRegex(ValueError, r"不能为负"):
            validate_age(-1)

        with self.assertRaisesRegex(ValueError, r"不能超过\d+"):
            validate_age(200)

    def test_assertRaises_type_error(self):
        """测试类型错误"""
        with self.assertRaises(TypeError) as context:
            validate_age("twenty")
        self.assertIn("整数", str(context.exception))

    def test_no_exception(self):
        """测试正常情况不抛出异常"""
        try:
            result = divide(10, 2)
            self.assertEqual(result, 5)
        except Exception as e:
            self.fail(f"不应该抛出异常: {e}")

if __name__ == '__main__':
    unittest.main()
```

### 警告断言

```python
# test_warning_assertions.py
import unittest
import warnings

def deprecated_function():
    """已弃用的函数"""
    warnings.warn("此函数已弃用，请使用 new_function()", DeprecationWarning)
    return "old result"

def resource_warning_function():
    """可能产生资源警告的函数"""
    warnings.warn("文件未正确关闭", ResourceWarning)

class TestWarningAssertions(unittest.TestCase):
    """警告断言方法测试"""

    def test_assertWarns(self):
        """测试警告抛出"""
        with self.assertWarns(DeprecationWarning):
            deprecated_function()

    def test_assertWarnsRegex(self):
        """测试警告消息匹配正则表达式"""
        with self.assertWarnsRegex(DeprecationWarning, r"已弃用"):
            deprecated_function()

    def test_assertWarns_resource(self):
        """测试资源警告"""
        with self.assertWarns(ResourceWarning):
            resource_warning_function()

if __name__ == '__main__':
    unittest.main()
```

### 自定义断言消息

```python
# test_custom_messages.py
import unittest

class TestCustomMessages(unittest.TestCase):
    """自定义断言消息测试"""

    def test_custom_message(self):
        """所有断言方法都支持自定义错误消息"""
        value = 42
        expected = 42

        self.assertEqual(
            value,
            expected,
            msg=f"计算结果 {value} 不等于预期值 {expected}"
        )

    def test_custom_fail_message(self):
        """使用 fail() 自定义失败消息"""
        condition = True
        if not condition:
            self.fail("条件检查失败：condition 应该为 True")

    def test_subTest(self):
        """使用 subTest 进行参数化测试"""
        test_cases = [
            (2, 3, 5),
            (0, 0, 0),
            (-1, 1, 0),
            (100, 200, 300),
        ]

        for a, b, expected in test_cases:
            with self.subTest(a=a, b=b, expected=expected):
                self.assertEqual(a + b, expected, f"{a} + {b} 应该等于 {expected}")

if __name__ == '__main__':
    unittest.main()
```

## setUp 和 tearDown

unittest 提供了测试夹具（test fixtures）机制，用于设置测试前置条件和清理工作。

### 方法级别的 setUp 和 tearDown

```python
# test_fixtures_method.py
import unittest
import tempfile
import os

class TestFileOperations(unittest.TestCase):
    """文件操作测试"""

    def setUp(self):
        """每个测试方法执行前调用"""
        print(f"\n[setUp] 准备测试: {self._testMethodName}")
        # 创建临时文件
        self.temp_file = tempfile.NamedTemporaryFile(
            mode='w',
            delete=False,
            suffix='.txt'
        )
        self.temp_file.write("测试内容")
        self.temp_file.close()
        self.file_path = self.temp_file.name

    def tearDown(self):
        """每个测试方法执行后调用"""
        print(f"[tearDown] 清理测试: {self._testMethodName}")
        # 删除临时文件
        if os.path.exists(self.file_path):
            os.remove(self.file_path)

    def test_read_file(self):
        """测试读取文件"""
        with open(self.file_path, 'r') as f:
            content = f.read()
        self.assertEqual(content, "测试内容")

    def test_file_exists(self):
        """测试文件存在"""
        self.assertTrue(os.path.exists(self.file_path))

    def test_append_to_file(self):
        """测试追加内容到文件"""
        with open(self.file_path, 'a') as f:
            f.write("追加内容")

        with open(self.file_path, 'r') as f:
            content = f.read()

        self.assertEqual(content, "测试内容追加内容")

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

### 类级别的 setUpClass 和 tearDownClass

```python
# test_fixtures_class.py
import unittest
import sqlite3

class TestDatabase(unittest.TestCase):
    """数据库测试"""

    @classmethod
    def setUpClass(cls):
        """整个测试类执行前调用一次"""
        print("\n[setUpClass] 创建数据库连接")
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
        """整个测试类执行后调用一次"""
        print("\n[tearDownClass] 关闭数据库连接")
        cls.conn.close()

    def setUp(self):
        """每个测试方法执行前调用"""
        # 清空表数据
        self.cursor.execute('DELETE FROM users')
        self.conn.commit()

    def test_insert_user(self):
        """测试插入用户"""
        self.cursor.execute(
            'INSERT INTO users (username, email, age) VALUES (?, ?, ?)',
            ('zhangsan', 'zhangsan@example.com', 25)
        )
        self.conn.commit()

        self.cursor.execute('SELECT * FROM users WHERE username = ?', ('zhangsan',))
        user = self.cursor.fetchone()

        self.assertIsNotNone(user)
        self.assertEqual(user[1], 'zhangsan')
        self.assertEqual(user[2], 'zhangsan@example.com')
        self.assertEqual(user[3], 25)

    def test_insert_multiple_users(self):
        """测试插入多个用户"""
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
        """测试用户名唯一约束"""
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
        """测试按年龄查询"""
        users = [
            ('young1', 'young1@example.com', 18),
            ('young2', 'young2@example.com', 22),
            ('old1', 'old1@example.com', 50),
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

### 模块级别的 setUpModule 和 tearDownModule

```python
# test_fixtures_module.py
import unittest
import tempfile
import shutil
import os

# 模块级变量
TEST_DIR = None

def setUpModule():
    """整个模块执行前调用一次"""
    global TEST_DIR
    print("\n[setUpModule] 创建测试目录")
    TEST_DIR = tempfile.mkdtemp(prefix='unittest_')
    print(f"测试目录: {TEST_DIR}")

def tearDownModule():
    """整个模块执行后调用一次"""
    print("\n[tearDownModule] 删除测试目录")
    if TEST_DIR and os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR)

class TestDirectoryOperations(unittest.TestCase):
    """目录操作测试"""

    def test_create_file(self):
        """测试在测试目录中创建文件"""
        file_path = os.path.join(TEST_DIR, 'test_file.txt')
        with open(file_path, 'w') as f:
            f.write('测试内容')

        self.assertTrue(os.path.exists(file_path))

    def test_create_subdirectory(self):
        """测试创建子目录"""
        subdir_path = os.path.join(TEST_DIR, 'subdir')
        os.makedirs(subdir_path, exist_ok=True)

        self.assertTrue(os.path.isdir(subdir_path))

class TestAnotherClass(unittest.TestCase):
    """另一个测试类"""

    def test_test_dir_exists(self):
        """测试测试目录存在"""
        self.assertTrue(os.path.exists(TEST_DIR))

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

### 使用 addCleanup

```python
# test_cleanup.py
import unittest
import tempfile
import os

class TestWithCleanup(unittest.TestCase):
    """使用 addCleanup 进行清理"""

    def test_with_cleanup(self):
        """测试使用 addCleanup 自动清理"""
        # 创建临时文件
        fd, path = tempfile.mkstemp()
        os.write(fd, b"test content")
        os.close(fd)

        # 注册清理函数
        self.addCleanup(os.remove, path)

        # 即使测试失败，清理函数也会被调用
        self.assertTrue(os.path.exists(path))

        with open(path, 'r') as f:
            content = f.read()
        self.assertEqual(content, "test content")

    def test_multiple_cleanups(self):
        """测试多个清理函数"""
        resources = []

        def cleanup_resource(resource):
            print(f"清理资源: {resource}")
            resources.remove(resource)

        # 创建多个资源
        for i in range(3):
            resource = f"resource_{i}"
            resources.append(resource)
            self.addCleanup(cleanup_resource, resource)

        self.assertEqual(len(resources), 3)
        # 清理函数按照 LIFO 顺序执行

if __name__ == '__main__':
    unittest.main(verbosity=2)
```

## 测试发现与运行

### 测试发现机制

unittest 可以自动发现并运行测试。

```bash
# 发现并运行当前目录及子目录下的所有测试
python -m unittest discover

# 指定起始目录
python -m unittest discover -s tests

# 指定测试文件模式
python -m unittest discover -p "test_*.py"

# 指定顶级目录（用于导入）
python -m unittest discover -s tests -t .

# 详细输出
python -m unittest discover -v

# 组合使用
python -m unittest discover -s tests -p "*_test.py" -v
```

### 项目结构示例

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

### 命令行选项

```python
# test_cli_demo.py
import unittest

class TestDemo(unittest.TestCase):

    def test_pass(self):
        """通过的测试"""
        self.assertTrue(True)

    def test_fail(self):
        """失败的测试"""
        self.assertEqual(1, 1)

    @unittest.skip("跳过此测试")
    def test_skip(self):
        """跳过的测试"""
        pass

if __name__ == '__main__':
    # 常用命令行选项
    # -v, --verbose: 详细输出
    # -q, --quiet: 静默模式
    # -f, --failfast: 遇到第一个失败就停止
    # -c, --catch: 捕获 Ctrl+C 信号
    # -b, --buffer: 缓冲 stdout 和 stderr

    unittest.main(verbosity=2, failfast=False, buffer=True)
```

运行选项示例：

```bash
# 详细模式
python -m unittest test_cli_demo -v

# 遇到失败立即停止
python -m unittest test_cli_demo -f

# 静默模式
python -m unittest test_cli_demo -q

# 缓冲输出
python -m unittest test_cli_demo -b
```

### 使用 TestLoader 自定义加载

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
    # 创建测试加载器
    loader = unittest.TestLoader()

    # 加载特定测试类
    suite = loader.loadTestsFromTestCase(TestMath)

    # 或者加载特定模块
    # suite = loader.loadTestsFromModule(test_module)

    # 或者加载特定方法
    # suite = loader.loadTestsFromName('test_cli_demo.TestDemo.test_pass')

    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)
```

## 测试套件

测试套件（TestSuite）用于组织和运行多个测试。

### 创建测试套件

```python
# test_suite.py
import unittest

# 定义测试类
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
    """创建算术测试套件"""
    suite = unittest.TestSuite()
    suite.addTest(TestArithmetic('test_add'))
    suite.addTest(TestArithmetic('test_subtract'))
    suite.addTest(TestArithmetic('test_multiply'))
    return suite

def create_string_suite():
    """创建字符串测试套件"""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestString)
    return suite

def create_full_suite():
    """创建完整测试套件"""
    suite = unittest.TestSuite()

    # 添加单个测试
    suite.addTest(TestArithmetic('test_add'))

    # 添加整个测试类
    loader = unittest.TestLoader()
    suite.addTests(loader.loadTestsFromTestCase(TestString))
    suite.addTests(loader.loadTestsFromTestCase(TestList))

    return suite

if __name__ == '__main__':
    # 运行特定套件
    runner = unittest.TextTestRunner(verbosity=2)

    print("=== 运行算术测试套件 ===")
    runner.run(create_arithmetic_suite())

    print("\n=== 运行字符串测试套件 ===")
    runner.run(create_string_suite())

    print("\n=== 运行完整测试套件 ===")
    runner.run(create_full_suite())
```

### 使用 TestRunner

```python
# test_runner.py
import unittest
import sys
from io import StringIO

class TestExample(unittest.TestCase):
    def test_pass(self):
        self.assertTrue(True)

    def test_fail(self):
        self.assertEqual(1, 1)

def run_with_text_runner():
    """使用 TextTestRunner"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestExample)

    # 创建自定义运行器
    runner = unittest.TextTestRunner(
        stream=sys.stdout,
        verbosity=2,
        failfast=False,
        buffer=True
    )

    result = runner.run(suite)

    # 检查结果
    print(f"\n运行: {result.testsRun}")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    print(f"跳过: {len(result.skipped)}")

    return result.wasSuccessful()

def run_with_result_capture():
    """捕获测试结果"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestExample)

    # 使用 StringIO 捕获输出
    stream = StringIO()
    runner = unittest.TextTestRunner(stream=stream, verbosity=2)
    result = runner.run(suite)

    output = stream.getvalue()
    print("捕获的输出:")
    print(output)

    return result

if __name__ == '__main__':
    run_with_text_runner()
```

### 组织大型测试项目

```python
# tests/__init__.py
import unittest

def load_tests(loader, tests, pattern):
    """
    自定义测试加载函数
    这个函数会被 unittest 自动调用
    """
    # 发现当前包下的所有测试
    start_dir = 'tests'
    suite = loader.discover(start_dir, pattern='test_*.py')
    return suite

# tests/test_suite_config.py
import unittest
import os
import sys

# 添加项目根目录到路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def create_test_suite():
    """创建项目测试套件"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # 发现 tests 目录下的所有测试
    tests_dir = os.path.join(project_root, 'tests')
    discovered = loader.discover(tests_dir, pattern='test_*.py')
    suite.addTests(discovered)

    return suite

def run_tests():
    """运行所有测试"""
    suite = create_test_suite()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # 根据测试结果返回退出码
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    exit_code = run_tests()
    sys.exit(exit_code)
```

## Mock 和 Patch

`unittest.mock` 模块提供了强大的模拟对象功能，用于隔离测试依赖。

### Mock 基础

```python
# test_mock_basic.py
import unittest
from unittest.mock import Mock, MagicMock, call

class TestMockBasic(unittest.TestCase):
    """Mock 基础用法"""

    def test_mock_creation(self):
        """创建 Mock 对象"""
        mock = Mock()

        # Mock 对象可以有任意属性
        mock.name = "测试对象"
        self.assertEqual(mock.name, "测试对象")

        # Mock 对象可以被调用
        mock.return_value = 42
        result = mock()
        self.assertEqual(result, 42)

    def test_mock_method(self):
        """Mock 方法"""
        mock = Mock()

        # 设置方法返回值
        mock.get_data.return_value = {"key": "value"}
        self.assertEqual(mock.get_data(), {"key": "value"})

        # 链式调用
        mock.api.users.get.return_value = [{"id": 1, "name": "张三"}]
        users = mock.api.users.get()
        self.assertEqual(users[0]["name"], "张三")

    def test_mock_call_assertions(self):
        """断言 Mock 调用"""
        mock = Mock()

        # 调用 Mock
        mock.some_method("arg1", key="value")

        # 断言调用
        mock.some_method.assert_called()
        mock.some_method.assert_called_once()
        mock.some_method.assert_called_with("arg1", key="value")
        mock.some_method.assert_called_once_with("arg1", key="value")

    def test_mock_call_count(self):
        """检查调用次数"""
        mock = Mock()

        mock.method()
        mock.method()
        mock.method()

        self.assertEqual(mock.method.call_count, 3)

    def test_mock_call_args(self):
        """获取调用参数"""
        mock = Mock()

        mock.method("first", key1="value1")
        mock.method("second", key2="value2")

        # 获取最后一次调用的参数
        args, kwargs = mock.method.call_args
        self.assertEqual(args, ("second",))
        self.assertEqual(kwargs, {"key2": "value2"})

        # 获取所有调用的参数列表
        expected_calls = [
            call("first", key1="value1"),
            call("second", key2="value2"),
        ]
        mock.method.assert_has_calls(expected_calls)

    def test_mock_side_effect(self):
        """使用 side_effect"""
        mock = Mock()

        # 返回多个值
        mock.side_effect = [1, 2, 3]
        self.assertEqual(mock(), 1)
        self.assertEqual(mock(), 2)
        self.assertEqual(mock(), 3)

    def test_mock_side_effect_exception(self):
        """side_effect 抛出异常"""
        mock = Mock()
        mock.side_effect = ValueError("测试异常")

        with self.assertRaises(ValueError) as context:
            mock()
        self.assertEqual(str(context.exception), "测试异常")

    def test_mock_side_effect_function(self):
        """side_effect 使用函数"""
        mock = Mock()

        def side_effect_func(x):
            return x * 2

        mock.side_effect = side_effect_func

        self.assertEqual(mock(5), 10)
        self.assertEqual(mock(3), 6)

class TestMagicMock(unittest.TestCase):
    """MagicMock 用法"""

    def test_magic_methods(self):
        """MagicMock 支持魔法方法"""
        mock = MagicMock()

        # 设置 __len__ 返回值
        mock.__len__.return_value = 10
        self.assertEqual(len(mock), 10)

        # 设置 __getitem__ 返回值
        mock.__getitem__.return_value = "item"
        self.assertEqual(mock[0], "item")

        # 设置 __iter__ 返回值
        mock.__iter__.return_value = iter([1, 2, 3])
        self.assertEqual(list(mock), [1, 2, 3])

    def test_magic_mock_as_context_manager(self):
        """MagicMock 作为上下文管理器"""
        mock = MagicMock()
        mock.__enter__.return_value = "resource"

        with mock as resource:
            self.assertEqual(resource, "resource")

        mock.__enter__.assert_called_once()
        mock.__exit__.assert_called_once()

if __name__ == '__main__':
    unittest.main()
```

### 使用 patch 装饰器

```python
# services.py
import requests
import smtplib
from datetime import datetime

class WeatherService:
    """天气服务"""

    def get_weather(self, city):
        """获取天气信息"""
        response = requests.get(
            f"https://api.weather.com/v1/city/{city}",
            timeout=10
        )
        return response.json()

    def get_temperature(self, city):
        """获取温度"""
        data = self.get_weather(city)
        return data.get("temperature")

class EmailService:
    """邮件服务"""

    def __init__(self, smtp_host, smtp_port):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def send_email(self, to, subject, body):
        """发送邮件"""
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            message = f"Subject: {subject}\n\n{body}"
            server.sendmail("noreply@example.com", to, message)
        return True

class TimeService:
    """时间服务"""

    @staticmethod
    def get_current_time():
        """获取当前时间"""
        return datetime.now()

    def is_business_hours(self):
        """检查是否是工作时间"""
        current = self.get_current_time()
        return 9 <= current.hour < 18 and current.weekday() < 5
```

```python
# test_mock_patch.py
import unittest
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime

# 假设 services 模块在同一目录
from services import WeatherService, EmailService, TimeService

class TestWeatherService(unittest.TestCase):
    """天气服务测试"""

    @patch('services.requests.get')
    def test_get_weather(self, mock_get):
        """测试获取天气"""
        # 设置 mock 响应
        mock_response = Mock()
        mock_response.json.return_value = {
            "city": "北京",
            "temperature": 25,
            "humidity": 60
        }
        mock_get.return_value = mock_response

        # 调用服务
        service = WeatherService()
        weather = service.get_weather("北京")

        # 断言
        self.assertEqual(weather["temperature"], 25)
        mock_get.assert_called_once_with(
            "https://api.weather.com/v1/city/北京",
            timeout=10
        )

    @patch('services.requests.get')
    def test_get_temperature(self, mock_get):
        """测试获取温度"""
        mock_response = Mock()
        mock_response.json.return_value = {"temperature": 30}
        mock_get.return_value = mock_response

        service = WeatherService()
        temp = service.get_temperature("上海")

        self.assertEqual(temp, 30)

    @patch('services.requests.get')
    def test_weather_api_error(self, mock_get):
        """测试 API 错误"""
        mock_get.side_effect = Exception("网络错误")

        service = WeatherService()
        with self.assertRaises(Exception) as context:
            service.get_weather("广州")

        self.assertEqual(str(context.exception), "网络错误")

class TestEmailService(unittest.TestCase):
    """邮件服务测试"""

    @patch('services.smtplib.SMTP')
    def test_send_email(self, mock_smtp):
        """测试发送邮件"""
        # 设置 mock SMTP 实例
        mock_smtp_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_smtp_instance

        # 调用服务
        service = EmailService("smtp.example.com", 587)
        result = service.send_email(
            "user@example.com",
            "测试主题",
            "测试内容"
        )

        # 断言
        self.assertTrue(result)
        mock_smtp.assert_called_once_with("smtp.example.com", 587)
        mock_smtp_instance.sendmail.assert_called_once()

    def test_send_email_with_context(self):
        """使用上下文管理器测试发送邮件"""
        with patch('services.smtplib.SMTP') as mock_smtp:
            mock_smtp_instance = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_smtp_instance

            service = EmailService("smtp.test.com", 25)
            service.send_email("test@example.com", "主题", "内容")

            mock_smtp_instance.sendmail.assert_called_once()

class TestTimeService(unittest.TestCase):
    """时间服务测试"""

    @patch.object(TimeService, 'get_current_time')
    def test_is_business_hours_true(self, mock_time):
        """测试工作时间内"""
        # 设置为周一上午 10 点
        mock_time.return_value = datetime(2026, 1, 5, 10, 0, 0)  # 周一

        service = TimeService()
        self.assertTrue(service.is_business_hours())

    @patch.object(TimeService, 'get_current_time')
    def test_is_business_hours_false_weekend(self, mock_time):
        """测试周末"""
        # 设置为周六上午 10 点
        mock_time.return_value = datetime(2026, 1, 3, 10, 0, 0)  # 周六

        service = TimeService()
        self.assertFalse(service.is_business_hours())

    @patch.object(TimeService, 'get_current_time')
    def test_is_business_hours_false_evening(self, mock_time):
        """测试下班后"""
        # 设置为周一晚上 8 点
        mock_time.return_value = datetime(2026, 1, 5, 20, 0, 0)  # 周一

        service = TimeService()
        self.assertFalse(service.is_business_hours())

if __name__ == '__main__':
    unittest.main()
```

### patch 的多种用法

```python
# test_patch_variations.py
import unittest
from unittest.mock import patch, Mock, PropertyMock

class Config:
    """配置类"""
    API_URL = "https://api.production.com"
    DEBUG = False

class DataProcessor:
    """数据处理器"""

    def __init__(self):
        self._cache = {}

    @property
    def cache_size(self):
        return len(self._cache)

    def process(self, data):
        return data.upper()

class TestPatchVariations(unittest.TestCase):
    """patch 的多种用法"""

    def test_patch_dict(self):
        """使用 patch.dict 修改字典"""
        import os

        with patch.dict(os.environ, {'API_KEY': 'test-key', 'DEBUG': 'true'}):
            self.assertEqual(os.environ.get('API_KEY'), 'test-key')
            self.assertEqual(os.environ.get('DEBUG'), 'true')

        # 退出上下文后恢复原值
        self.assertIsNone(os.environ.get('API_KEY'))

    def test_patch_object(self):
        """使用 patch.object 修改对象属性"""
        with patch.object(Config, 'API_URL', 'https://api.test.com'):
            self.assertEqual(Config.API_URL, 'https://api.test.com')

        # 退出上下文后恢复原值
        self.assertEqual(Config.API_URL, 'https://api.production.com')

    def test_patch_multiple(self):
        """同时 patch 多个对象"""
        with patch.object(Config, 'API_URL', 'https://api.test.com'), \
             patch.object(Config, 'DEBUG', True):
            self.assertEqual(Config.API_URL, 'https://api.test.com')
            self.assertTrue(Config.DEBUG)

    @patch.object(Config, 'DEBUG', True)
    @patch.object(Config, 'API_URL', 'https://api.staging.com')
    def test_patch_decorators(self, mock_url, mock_debug):
        """使用多个 patch 装饰器"""
        # 注意：装饰器从下到上应用，参数从左到右传入
        self.assertEqual(Config.API_URL, 'https://api.staging.com')
        self.assertTrue(Config.DEBUG)

    def test_patch_property(self):
        """patch 属性"""
        processor = DataProcessor()

        with patch.object(
            DataProcessor,
            'cache_size',
            new_callable=PropertyMock,
            return_value=100
        ):
            self.assertEqual(processor.cache_size, 100)

    def test_patch_builtin(self):
        """patch 内置函数"""
        with patch('builtins.open', Mock()):
            # 现在 open 是一个 Mock 对象
            result = open('test.txt')
            self.assertIsInstance(result, Mock)

    def test_patch_start_stop(self):
        """手动控制 patch 的开始和结束"""
        patcher = patch.object(Config, 'API_URL', 'https://api.manual.com')

        # 开始 patch
        patcher.start()
        self.assertEqual(Config.API_URL, 'https://api.manual.com')

        # 停止 patch
        patcher.stop()
        self.assertEqual(Config.API_URL, 'https://api.production.com')

if __name__ == '__main__':
    unittest.main()
```

### Mock 类和依赖注入

```python
# test_mock_injection.py
import unittest
from unittest.mock import Mock, MagicMock, create_autospec

class Database:
    """数据库接口"""

    def connect(self):
        raise NotImplementedError

    def execute(self, query, params=None):
        raise NotImplementedError

    def close(self):
        raise NotImplementedError

class UserRepository:
    """用户仓储"""

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
    """用户仓储测试"""

    def setUp(self):
        """设置 mock 数据库"""
        self.mock_db = Mock(spec=Database)
        self.repo = UserRepository(self.mock_db)

    def test_get_user(self):
        """测试获取用户"""
        # 设置返回值
        self.mock_db.execute.return_value = {
            "id": 1,
            "username": "zhangsan",
            "email": "zhangsan@example.com"
        }

        # 调用方法
        user = self.repo.get_user(1)

        # 断言
        self.assertEqual(user["username"], "zhangsan")
        self.mock_db.connect.assert_called_once()
        self.mock_db.execute.assert_called_once_with(
            "SELECT * FROM users WHERE id = ?",
            (1,)
        )
        self.mock_db.close.assert_called_once()

    def test_create_user(self):
        """测试创建用户"""
        result = self.repo.create_user("lisi", "lisi@example.com")

        self.assertTrue(result)
        self.mock_db.execute.assert_called_once_with(
            "INSERT INTO users (username, email) VALUES (?, ?)",
            ("lisi", "lisi@example.com")
        )

    def test_get_all_users(self):
        """测试获取所有用户"""
        self.mock_db.execute.return_value = [
            {"id": 1, "username": "user1"},
            {"id": 2, "username": "user2"},
        ]

        users = self.repo.get_all_users()

        self.assertEqual(len(users), 2)
        self.mock_db.execute.assert_called_once_with("SELECT * FROM users")

class TestAutospec(unittest.TestCase):
    """使用 autospec 创建 Mock"""

    def test_create_autospec(self):
        """create_autospec 会检查方法签名"""
        mock_db = create_autospec(Database)

        # autospec 创建的 mock 会检查方法是否存在
        mock_db.connect()  # OK
        mock_db.execute("query", params=(1,))  # OK

        # 调用不存在的方法会报错
        with self.assertRaises(AttributeError):
            mock_db.nonexistent_method()

if __name__ == '__main__':
    unittest.main()
```

### 异步代码的 Mock

```python
# test_async_mock.py
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio

class AsyncService:
    """异步服务"""

    async def fetch_data(self, url):
        """异步获取数据"""
        # 实际实现会使用 aiohttp 等库
        pass

    async def process_data(self, data):
        """异步处理数据"""
        await asyncio.sleep(0.1)
        return data.upper()

class TestAsyncMock(unittest.TestCase):
    """异步 Mock 测试"""

    def test_async_mock_basic(self):
        """AsyncMock 基础用法"""
        mock = AsyncMock()
        mock.return_value = "async result"

        # 运行异步代码
        result = asyncio.run(mock())

        self.assertEqual(result, "async result")
        mock.assert_awaited_once()

    def test_async_mock_side_effect(self):
        """AsyncMock side_effect"""
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
        """patch 异步方法"""
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

## 最佳实践

### 测试命名规范

```python
# test_naming.py
import unittest

class TestUserAuthentication(unittest.TestCase):
    """用户认证测试

    测试类名应该以 Test 开头，描述被测试的功能
    """

    def test_user_can_login_with_valid_credentials(self):
        """测试方法名应该清楚描述测试的场景和预期结果"""
        pass

    def test_login_fails_with_invalid_password(self):
        """描述失败场景"""
        pass

    def test_login_raises_exception_when_user_not_found(self):
        """描述异常情况"""
        pass

    def test_password_is_hashed_before_storage(self):
        """描述具体行为"""
        pass
```

### 使用 AAA 模式

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
    """使用 AAA (Arrange-Act-Assert) 模式"""

    def test_get_total_with_multiple_items(self):
        """测试多个商品的总价"""
        # Arrange (准备)
        cart = ShoppingCart()
        cart.add_item("书籍", 50, 2)
        cart.add_item("笔", 10, 3)

        # Act (执行)
        total = cart.get_total()

        # Assert (断言)
        self.assertEqual(total, 130)  # 50*2 + 10*3

    def test_get_item_count(self):
        """测试商品数量"""
        # Arrange
        cart = ShoppingCart()
        cart.add_item("商品A", 100, 2)
        cart.add_item("商品B", 50, 3)

        # Act
        count = cart.get_item_count()

        # Assert
        self.assertEqual(count, 5)

if __name__ == '__main__':
    unittest.main()
```

### 一个测试只测一件事

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
    """每个测试方法只测试一个行为"""

    # 好的做法：每个测试专注于一个方面
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

    # 避免：一个测试测试多个东西
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

### 使用 subTest 进行参数化测试

```python
# test_subtest.py
import unittest

def is_palindrome(s):
    """检查字符串是否是回文"""
    s = s.lower().replace(" ", "")
    return s == s[::-1]

class TestPalindrome(unittest.TestCase):
    """使用 subTest 进行参数化测试"""

    def test_is_palindrome(self):
        """测试多个回文字符串"""
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
        """测试边界情况"""
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
                    f"is_palindrome({repr(text)}) 应该返回 {expected}"
                )

if __name__ == '__main__':
    unittest.main()
```

### 合理使用 setUp 和 tearDown

```python
# test_setup_best_practices.py
import unittest

class DatabaseConnection:
    """模拟数据库连接"""

    def __init__(self):
        self.connected = False

    def connect(self):
        self.connected = True

    def disconnect(self):
        self.connected = False

    def execute(self, query):
        if not self.connected:
            raise RuntimeError("未连接到数据库")
        return f"执行: {query}"

class TestDatabaseOperations(unittest.TestCase):
    """数据库操作测试"""

    @classmethod
    def setUpClass(cls):
        """设置类级别的资源（只执行一次）"""
        # 适合：创建数据库连接池、加载配置等
        cls.config = {"database": "test_db", "host": "localhost"}
        print("加载配置完成")

    @classmethod
    def tearDownClass(cls):
        """清理类级别的资源"""
        cls.config = None
        print("清理配置完成")

    def setUp(self):
        """每个测试前的设置"""
        # 适合：创建测试对象、准备测试数据
        self.db = DatabaseConnection()
        self.db.connect()

    def tearDown(self):
        """每个测试后的清理"""
        # 适合：断开连接、清理测试数据
        if self.db.connected:
            self.db.disconnect()

    def test_execute_query(self):
        """测试执行查询"""
        result = self.db.execute("SELECT * FROM users")
        self.assertIn("SELECT", result)

    def test_execute_without_connection_raises_error(self):
        """测试未连接时执行查询"""
        self.db.disconnect()
        with self.assertRaises(RuntimeError):
            self.db.execute("SELECT 1")

if __name__ == '__main__':
    unittest.main()
```

### 测试异常情况

```python
# test_exceptions_best_practices.py
import unittest

class Validator:
    """数据验证器"""

    @staticmethod
    def validate_positive(value):
        if not isinstance(value, (int, float)):
            raise TypeError("值必须是数字")
        if value <= 0:
            raise ValueError("值必须是正数")
        return True

    @staticmethod
    def validate_email(email):
        if not isinstance(email, str):
            raise TypeError("邮箱必须是字符串")
        if "@" not in email:
            raise ValueError("邮箱格式无效：缺少 @")
        if "." not in email.split("@")[1]:
            raise ValueError("邮箱格式无效：域名格式错误")
        return True

class TestValidator(unittest.TestCase):
    """验证器测试"""

    def test_validate_positive_with_valid_input(self):
        """测试有效输入"""
        self.assertTrue(Validator.validate_positive(5))
        self.assertTrue(Validator.validate_positive(0.1))

    def test_validate_positive_raises_type_error_for_non_numeric(self):
        """测试非数字输入"""
        invalid_inputs = ["string", None, [], {}]

        for value in invalid_inputs:
            with self.subTest(value=value):
                with self.assertRaises(TypeError) as context:
                    Validator.validate_positive(value)
                self.assertIn("必须是数字", str(context.exception))

    def test_validate_positive_raises_value_error_for_non_positive(self):
        """测试非正数输入"""
        with self.assertRaises(ValueError) as context:
            Validator.validate_positive(0)
        self.assertIn("必须是正数", str(context.exception))

        with self.assertRaises(ValueError):
            Validator.validate_positive(-5)

    def test_validate_email_with_valid_email(self):
        """测试有效邮箱"""
        valid_emails = [
            "user@example.com",
            "test.user@domain.org",
            "name@sub.domain.com",
        ]

        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(Validator.validate_email(email))

    def test_validate_email_raises_value_error_for_invalid_format(self):
        """测试无效邮箱格式"""
        test_cases = [
            ("invalid.com", "缺少 @"),
            ("user@domain", "域名格式错误"),
        ]

        for email, expected_error in test_cases:
            with self.subTest(email=email):
                with self.assertRaisesRegex(ValueError, expected_error):
                    Validator.validate_email(email)

if __name__ == '__main__':
    unittest.main()
```

### 测试边界条件

```python
# test_boundary_conditions.py
import unittest

def paginate(items, page, page_size):
    """分页函数"""
    if page < 1:
        raise ValueError("页码必须大于 0")
    if page_size < 1:
        raise ValueError("每页大小必须大于 0")

    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]

class TestPaginate(unittest.TestCase):
    """分页函数测试"""

    def setUp(self):
        self.items = list(range(1, 101))  # 1-100

    def test_first_page(self):
        """测试第一页"""
        result = paginate(self.items, 1, 10)
        self.assertEqual(result, list(range(1, 11)))

    def test_middle_page(self):
        """测试中间页"""
        result = paginate(self.items, 5, 10)
        self.assertEqual(result, list(range(41, 51)))

    def test_last_page(self):
        """测试最后一页"""
        result = paginate(self.items, 10, 10)
        self.assertEqual(result, list(range(91, 101)))

    def test_page_beyond_total(self):
        """测试超出总页数"""
        result = paginate(self.items, 11, 10)
        self.assertEqual(result, [])

    def test_partial_last_page(self):
        """测试不完整的最后一页"""
        items = list(range(1, 26))  # 25 个元素
        result = paginate(items, 3, 10)  # 第三页只有 5 个
        self.assertEqual(result, list(range(21, 26)))

    def test_empty_list(self):
        """测试空列表"""
        result = paginate([], 1, 10)
        self.assertEqual(result, [])

    def test_page_size_larger_than_total(self):
        """测试每页大小大于总数"""
        result = paginate(self.items, 1, 200)
        self.assertEqual(result, self.items)

    def test_invalid_page_number(self):
        """测试无效页码"""
        with self.assertRaises(ValueError):
            paginate(self.items, 0, 10)

        with self.assertRaises(ValueError):
            paginate(self.items, -1, 10)

    def test_invalid_page_size(self):
        """测试无效每页大小"""
        with self.assertRaises(ValueError):
            paginate(self.items, 1, 0)

        with self.assertRaises(ValueError):
            paginate(self.items, 1, -1)

if __name__ == '__main__':
    unittest.main()
```

### 测试文件组织

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
│   ├── conftest.py          # 共享 fixtures
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

## 总结

unittest 是 Python 标准库中功能完整的测试框架。本文介绍了：

1. **TestCase 类**：测试的基本组织单元，提供了丰富的测试方法
2. **断言方法**：多种断言方法用于验证测试结果
3. **测试夹具**：setUp/tearDown 机制用于测试前后的准备和清理
4. **测试发现**：自动发现并运行测试的机制
5. **测试套件**：组织和运行多个测试的方式
6. **Mock 和 Patch**：模拟外部依赖，实现隔离测试
7. **最佳实践**：编写高质量测试代码的指导原则

虽然 pytest 等第三方框架提供了更简洁的语法和更多功能，但 unittest 作为标准库的一部分，无需额外安装，适合在受限环境中使用，也是理解 Python 测试基础的良好起点。

## 相关资源

- [unittest 官方文档](https://docs.python.org/3/library/unittest.html)
- [unittest.mock 官方文档](https://docs.python.org/3/library/unittest.mock.html)
- [Python 测试最佳实践](https://docs.python-guide.org/writing/tests/)
- [测试驱动开发 (TDD) 入门](https://realpython.com/python-testing/)
