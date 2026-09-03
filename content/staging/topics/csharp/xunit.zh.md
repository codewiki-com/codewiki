---
title: C# xUnit 单元测试详解
description: 掌握 xUnit 测试框架：Fact、Theory、InlineData、测试固件、断言与测试生命周期
track: csharp
section: tooling
difficulty: intermediate
tags:
  - C#
  - xUnit
  - 单元测试
  - TDD
  - 测试
status: imported
origin: old/src/content/docs/csharp/xunit.zh.md
divergence: 0.202
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 测试
  order: 15
  lastUpdated: 2026-01-07
---

xUnit.net 是 .NET 平台上最流行的单元测试框架之一，由 NUnit 的原作者之一 Jim Newkirk 创建。它以简洁、可扩展和现代化的设计理念著称，是 ASP.NET Core 和许多微软开源项目的首选测试框架。

## 概念解释

### 什么是单元测试

单元测试是一种软件测试方法，用于验证代码中最小可测试单元（通常是方法或函数）的正确性。其核心目标是：

- **隔离验证**：独立测试每个代码单元
- **快速反馈**：在开发过程中快速发现问题
- **回归保护**：防止代码修改引入新的错误
- **文档作用**：测试代码本身就是最好的使用文档

### xUnit 的历史与特点

xUnit.net 于 2007 年首次发布，相比于 NUnit 和 MSTest，它具有以下特点：

- **更现代的设计**：利用 C# 语言特性，减少不必要的属性和约定
- **隔离性强**：每个测试方法都在新的测试类实例中运行
- **可扩展性好**：强大的扩展机制支持自定义测试行为
- **并行执行**：默认支持测试的并行执行
- **社区活跃**：广泛的社区支持和丰富的插件生态

### xUnit vs NUnit vs MSTest

| 特性 | xUnit | NUnit | MSTest |
|------|-------|-------|--------|
| 测试标记 | [Fact], [Theory] | [Test], [TestCase] | [TestMethod] |
| 初始化 | 构造函数 | [SetUp] | [TestInitialize] |
| 清理 | IDisposable | [TearDown] | [TestCleanup] |
| 参数化测试 | [Theory] + [InlineData] | [TestCase] | [DataRow] |
| 并行执行 | 默认开启 | 需配置 | 需配置 |

## 核心原理

### 测试发现机制

xUnit 使用反射机制在编译后的程序集中发现测试方法。测试发现器会查找：

1. 带有 `[Fact]` 或 `[Theory]` 属性的公共方法
2. 返回类型为 `void` 或 `Task` 的方法
3. 无参数（Fact）或有参数（Theory）的方法

```csharp
// xUnit 内部的测试发现简化逻辑
public class TestDiscoverer
{
    public IEnumerable<TestCase> DiscoverTests(Assembly assembly)
    {
        foreach (var type in assembly.GetTypes())
        {
            foreach (var method in type.GetMethods())
            {
                if (method.GetCustomAttribute<FactAttribute>() != null ||
                    method.GetCustomAttribute<TheoryAttribute>() != null)
                {
                    yield return new TestCase(type, method);
                }
            }
        }
    }
}
```

### 测试执行流程

```
测试发现 -> 测试排序 -> 创建测试类实例 -> 执行测试方法 -> 收集结果 -> 销毁实例
                                ↓
                    [每个测试都是新实例]
```

xUnit 的关键设计决策是**每个测试方法都在新的测试类实例中执行**，这确保了测试之间的完全隔离。

### 断言机制

xUnit 的断言基于静态类 `Assert`，内部使用异常来报告测试失败：

```csharp
// Assert.Equal 的简化实现
public static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
    {
        throw new EqualException(expected, actual);
    }
}
```

## 核心要点

### [Fact] 特性

`[Fact]` 用于标记无参数的测试方法，表示一个"事实"——一个应该总是为真的条件。

```csharp
using Xunit;

public class CalculatorTests
{
    [Fact]
    public void Add_TwoPositiveNumbers_ReturnsCorrectSum()
    {
        // Arrange
        var calculator = new Calculator();

        // Act
        var result = calculator.Add(2, 3);

        // Assert
        Assert.Equal(5, result);
    }

    [Fact]
    public void Divide_ByZero_ThrowsException()
    {
        var calculator = new Calculator();

        Assert.Throws<DivideByZeroException>(() => calculator.Divide(10, 0));
    }
}
```

### [Theory] 特性

`[Theory]` 用于数据驱动测试，允许用不同的数据集运行同一个测试方法。

```csharp
public class StringHelperTests
{
    [Theory]
    [InlineData("hello", "HELLO")]
    [InlineData("World", "WORLD")]
    [InlineData("", "")]
    [InlineData("123", "123")]
    public void ToUpper_ReturnsUpperCaseString(string input, string expected)
    {
        var result = input.ToUpper();
        Assert.Equal(expected, result);
    }
}
```

### [InlineData] 特性

`[InlineData]` 是最简单的数据提供方式，直接在属性中指定参数值。

```csharp
public class MathTests
{
    [Theory]
    [InlineData(1, 1, 2)]
    [InlineData(0, 0, 0)]
    [InlineData(-1, 1, 0)]
    [InlineData(int.MaxValue, 1, int.MinValue)] // 溢出测试
    public void Add_VariousInputs_ReturnsExpectedResult(int a, int b, int expected)
    {
        var calculator = new Calculator();
        Assert.Equal(expected, calculator.Add(a, b));
    }

    // 多个 InlineData 组合
    [Theory]
    [InlineData(2, 4)]
    [InlineData(3, 9)]
    [InlineData(4, 16)]
    [InlineData(-2, 4)]
    [InlineData(0, 0)]
    public void Square_ReturnsCorrectValue(int input, int expected)
    {
        Assert.Equal(expected, input * input);
    }
}
```

### [MemberData] 特性

`[MemberData]` 允许从属性、字段或方法提供测试数据。

```csharp
public class MemberDataTests
{
    // 从静态属性提供数据
    public static IEnumerable<object[]> AdditionData =>
        new List<object[]>
        {
            new object[] { 1, 2, 3 },
            new object[] { -4, -6, -10 },
            new object[] { -2, 2, 0 },
            new object[] { int.MinValue, -1, int.MaxValue }
        };

    [Theory]
    [MemberData(nameof(AdditionData))]
    public void Add_WithMemberData_ReturnsExpectedResult(int a, int b, int expected)
    {
        var calculator = new Calculator();
        Assert.Equal(expected, calculator.Add(a, b));
    }

    // 从方法提供数据（可以接受参数）
    public static IEnumerable<object[]> GetDivisionData(int numTests)
    {
        var data = new List<object[]>
        {
            new object[] { 10, 2, 5 },
            new object[] { 100, 10, 10 },
            new object[] { -6, 3, -2 }
        };
        return data.Take(numTests);
    }

    [Theory]
    [MemberData(nameof(GetDivisionData), parameters: 2)]
    public void Divide_WithMemberData_ReturnsExpectedResult(int a, int b, int expected)
    {
        var calculator = new Calculator();
        Assert.Equal(expected, calculator.Divide(a, b));
    }
}
```

### [ClassData] 特性

`[ClassData]` 使用单独的类来提供测试数据，适合复杂的数据生成逻辑。

```csharp
public class CalculatorTestData : IEnumerable<object[]>
{
    public IEnumerator<object[]> GetEnumerator()
    {
        yield return new object[] { 1, 2, 3 };
        yield return new object[] { -4, -6, -10 };
        yield return new object[] { -2, 2, 0 };
        yield return new object[] { 100, 50, 150 };
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

public class ClassDataTests
{
    [Theory]
    [ClassData(typeof(CalculatorTestData))]
    public void Add_WithClassData_ReturnsExpectedResult(int a, int b, int expected)
    {
        var calculator = new Calculator();
        Assert.Equal(expected, calculator.Add(a, b));
    }
}

// 使用 TheoryData<T> 获得更好的类型安全
public class TypedCalculatorTestData : TheoryData<int, int, int>
{
    public TypedCalculatorTestData()
    {
        Add(1, 2, 3);
        Add(-4, -6, -10);
        Add(-2, 2, 0);
        Add(100, 50, 150);
    }
}

public class TypedClassDataTests
{
    [Theory]
    [ClassData(typeof(TypedCalculatorTestData))]
    public void Add_WithTypedClassData_ReturnsExpectedResult(int a, int b, int expected)
    {
        var calculator = new Calculator();
        Assert.Equal(expected, calculator.Add(a, b));
    }
}
```

### 断言 (Assertions)

xUnit 提供丰富的断言方法：

```csharp
public class AssertionExamples
{
    [Fact]
    public void EqualityAssertions()
    {
        // 值相等
        Assert.Equal(5, 2 + 3);
        Assert.NotEqual(4, 2 + 3);

        // 字符串比较（忽略大小写）
        Assert.Equal("HELLO", "hello", ignoreCase: true);

        // 浮点数比较（指定精度）
        Assert.Equal(3.14, 3.141592, precision: 2);

        // 引用相等
        var obj = new object();
        Assert.Same(obj, obj);
        Assert.NotSame(new object(), new object());
    }

    [Fact]
    public void BooleanAssertions()
    {
        Assert.True(1 == 1);
        Assert.False(1 == 2);
    }

    [Fact]
    public void NullAssertions()
    {
        string? nullString = null;
        string nonNullString = "hello";

        Assert.Null(nullString);
        Assert.NotNull(nonNullString);
    }

    [Fact]
    public void CollectionAssertions()
    {
        var list = new List<int> { 1, 2, 3, 4, 5 };

        // 集合包含元素
        Assert.Contains(3, list);
        Assert.DoesNotContain(6, list);

        // 使用条件
        Assert.Contains(list, item => item > 4);

        // 集合相等
        Assert.Equal(new[] { 1, 2, 3, 4, 5 }, list);

        // 集合为空
        Assert.Empty(new List<int>());
        Assert.NotEmpty(list);

        // 单个元素
        Assert.Single(new[] { 42 });

        // 所有元素满足条件
        Assert.All(list, item => Assert.True(item > 0));

        // 集合大小
        Assert.Equal(5, list.Count);
    }

    [Fact]
    public void StringAssertions()
    {
        var message = "Hello, World!";

        Assert.StartsWith("Hello", message);
        Assert.EndsWith("!", message);
        Assert.Contains("World", message);
        Assert.DoesNotContain("Goodbye", message);
        Assert.Matches(@"Hello,\s\w+!", message);
    }

    [Fact]
    public void TypeAssertions()
    {
        object obj = "hello";

        // 精确类型
        Assert.IsType<string>(obj);

        // 可分配类型（包括继承）
        Assert.IsAssignableFrom<IEnumerable<char>>(obj);

        // 不是某类型
        Assert.IsNotType<int>(obj);
    }

    [Fact]
    public void ExceptionAssertions()
    {
        // 验证抛出异常
        var ex = Assert.Throws<ArgumentNullException>(() =>
            throw new ArgumentNullException("param"));
        Assert.Equal("param", ex.ParamName);

        // 验证异常消息
        Assert.Throws<InvalidOperationException>(() =>
        {
            throw new InvalidOperationException("Operation failed");
        });

        // 异步异常
        // await Assert.ThrowsAsync<InvalidOperationException>(
        //     async () => await SomeAsyncMethod());
    }

    [Fact]
    public void RangeAssertions()
    {
        var value = 5;

        Assert.InRange(value, 1, 10);
        Assert.NotInRange(value, 10, 20);
    }
}
```

### 测试生命周期

xUnit 使用构造函数和 `IDisposable` 来管理测试的初始化和清理：

```csharp
public class TestLifecycleExample : IDisposable
{
    private readonly ITestOutputHelper _output;
    private readonly DatabaseConnection _connection;

    // 构造函数：每个测试方法执行前调用
    public TestLifecycleExample(ITestOutputHelper output)
    {
        _output = output;
        _output.WriteLine("构造函数：初始化测试资源");
        _connection = new DatabaseConnection();
        _connection.Open();
    }

    [Fact]
    public void Test1()
    {
        _output.WriteLine("执行 Test1");
        Assert.True(_connection.IsOpen);
    }

    [Fact]
    public void Test2()
    {
        _output.WriteLine("执行 Test2");
        Assert.True(_connection.IsOpen);
    }

    // Dispose：每个测试方法执行后调用
    public void Dispose()
    {
        _output.WriteLine("Dispose：清理测试资源");
        _connection.Close();
    }
}

// 异步清理
public class AsyncTestLifecycleExample : IAsyncLifetime
{
    private HttpClient _client;

    public async Task InitializeAsync()
    {
        _client = new HttpClient();
        await Task.Delay(100); // 模拟异步初始化
    }

    [Fact]
    public async Task TestApiCall()
    {
        var response = await _client.GetAsync("https://api.example.com");
        Assert.True(response.IsSuccessStatusCode);
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await Task.CompletedTask;
    }
}
```

### 测试固件 (Fixtures)

测试固件用于在多个测试之间共享昂贵的资源。

#### 类固件 (Class Fixture)

在同一个测试类的所有测试之间共享资源：

```csharp
// 定义固件
public class DatabaseFixture : IDisposable
{
    public SqlConnection Connection { get; private set; }

    public DatabaseFixture()
    {
        Connection = new SqlConnection("...");
        Connection.Open();

        // 初始化测试数据
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 插入测试数据
    }

    public void Dispose()
    {
        Connection.Close();
    }
}

// 使用固件
public class DatabaseTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public DatabaseTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void CanQueryDatabase()
    {
        // 使用 _fixture.Connection 进行查询
        Assert.NotNull(_fixture.Connection);
    }

    [Fact]
    public void CanInsertRecord()
    {
        // 使用同一个连接
        Assert.True(_fixture.Connection.State == ConnectionState.Open);
    }
}
```

#### 集合固件 (Collection Fixture)

在多个测试类之间共享资源：

```csharp
// 定义集合固件
public class IntegrationTestFixture : IDisposable
{
    public HttpClient Client { get; private set; }
    public TestServer Server { get; private set; }

    public IntegrationTestFixture()
    {
        var builder = new WebHostBuilder()
            .UseStartup<TestStartup>();
        Server = new TestServer(builder);
        Client = Server.CreateClient();
    }

    public void Dispose()
    {
        Client.Dispose();
        Server.Dispose();
    }
}

// 定义集合
[CollectionDefinition("Integration Tests")]
public class IntegrationTestCollection : ICollectionFixture<IntegrationTestFixture>
{
    // 这个类没有代码，只用于定义集合
}

// 使用集合固件
[Collection("Integration Tests")]
public class UserApiTests
{
    private readonly IntegrationTestFixture _fixture;

    public UserApiTests(IntegrationTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GetUsers_ReturnsSuccess()
    {
        var response = await _fixture.Client.GetAsync("/api/users");
        Assert.True(response.IsSuccessStatusCode);
    }
}

[Collection("Integration Tests")]
public class ProductApiTests
{
    private readonly IntegrationTestFixture _fixture;

    public ProductApiTests(IntegrationTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GetProducts_ReturnsSuccess()
    {
        var response = await _fixture.Client.GetAsync("/api/products");
        Assert.True(response.IsSuccessStatusCode);
    }
}
```

## 代码示例

### 完整的测试项目结构

```
MyProject/
├── src/
│   └── MyProject/
│       ├── MyProject.csproj
│       ├── Services/
│       │   ├── IUserService.cs
│       │   └── UserService.cs
│       └── Models/
│           └── User.cs
└── tests/
    └── MyProject.Tests/
        ├── MyProject.Tests.csproj
        ├── Services/
        │   └── UserServiceTests.cs
        ├── Fixtures/
        │   └── DatabaseFixture.cs
        └── TestData/
            └── UserTestData.cs
```

### 被测试的类

```csharp
// Models/User.cs
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

// Services/IUserService.cs
public interface IUserService
{
    User? GetById(int id);
    IEnumerable<User> GetAll();
    User Create(string username, string email);
    bool Delete(int id);
    bool ValidateEmail(string email);
}

// Services/UserService.cs
public class UserService : IUserService
{
    private readonly List<User> _users = new();
    private int _nextId = 1;

    public User? GetById(int id)
    {
        return _users.FirstOrDefault(u => u.Id == id);
    }

    public IEnumerable<User> GetAll()
    {
        return _users.AsReadOnly();
    }

    public User Create(string username, string email)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username cannot be empty", nameof(username));

        if (!ValidateEmail(email))
            throw new ArgumentException("Invalid email format", nameof(email));

        if (_users.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("Email already exists");

        var user = new User
        {
            Id = _nextId++,
            Username = username,
            Email = email,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _users.Add(user);
        return user;
    }

    public bool Delete(int id)
    {
        var user = GetById(id);
        if (user == null) return false;
        return _users.Remove(user);
    }

    public bool ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;

        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
```

### 完整的测试类

```csharp
using Xunit;
using Xunit.Abstractions;

namespace MyProject.Tests.Services
{
    public class UserServiceTests : IDisposable
    {
        private readonly ITestOutputHelper _output;
        private readonly UserService _userService;

        public UserServiceTests(ITestOutputHelper output)
        {
            _output = output;
            _userService = new UserService();
            _output.WriteLine("测试初始化完成");
        }

        #region GetById Tests

        [Fact]
        public void GetById_ExistingUser_ReturnsUser()
        {
            // Arrange
            var createdUser = _userService.Create("testuser", "test@example.com");

            // Act
            var result = _userService.GetById(createdUser.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(createdUser.Id, result.Id);
            Assert.Equal("testuser", result.Username);
        }

        [Fact]
        public void GetById_NonExistingUser_ReturnsNull()
        {
            // Act
            var result = _userService.GetById(999);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region Create Tests

        [Fact]
        public void Create_ValidInput_ReturnsNewUser()
        {
            // Act
            var user = _userService.Create("newuser", "new@example.com");

            // Assert
            Assert.NotNull(user);
            Assert.True(user.Id > 0);
            Assert.Equal("newuser", user.Username);
            Assert.Equal("new@example.com", user.Email);
            Assert.True(user.IsActive);
            Assert.True(user.CreatedAt <= DateTime.UtcNow);
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData(null)]
        public void Create_EmptyUsername_ThrowsArgumentException(string? username)
        {
            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() =>
                _userService.Create(username!, "valid@email.com"));

            Assert.Equal("username", exception.ParamName);
        }

        [Theory]
        [InlineData("invalid")]
        [InlineData("@invalid.com")]
        [InlineData("invalid@")]
        [InlineData("")]
        public void Create_InvalidEmail_ThrowsArgumentException(string email)
        {
            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() =>
                _userService.Create("validuser", email));

            Assert.Equal("email", exception.ParamName);
        }

        [Fact]
        public void Create_DuplicateEmail_ThrowsInvalidOperationException()
        {
            // Arrange
            _userService.Create("user1", "duplicate@example.com");

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() =>
                _userService.Create("user2", "duplicate@example.com"));
        }

        [Fact]
        public void Create_DuplicateEmailDifferentCase_ThrowsInvalidOperationException()
        {
            // Arrange
            _userService.Create("user1", "test@example.com");

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() =>
                _userService.Create("user2", "TEST@EXAMPLE.COM"));
        }

        #endregion

        #region GetAll Tests

        [Fact]
        public void GetAll_NoUsers_ReturnsEmptyCollection()
        {
            // Act
            var result = _userService.GetAll();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void GetAll_MultipleUsers_ReturnsAllUsers()
        {
            // Arrange
            _userService.Create("user1", "user1@example.com");
            _userService.Create("user2", "user2@example.com");
            _userService.Create("user3", "user3@example.com");

            // Act
            var result = _userService.GetAll();

            // Assert
            Assert.Equal(3, result.Count());
            Assert.Contains(result, u => u.Username == "user1");
            Assert.Contains(result, u => u.Username == "user2");
            Assert.Contains(result, u => u.Username == "user3");
        }

        #endregion

        #region Delete Tests

        [Fact]
        public void Delete_ExistingUser_ReturnsTrue()
        {
            // Arrange
            var user = _userService.Create("deleteuser", "delete@example.com");

            // Act
            var result = _userService.Delete(user.Id);

            // Assert
            Assert.True(result);
            Assert.Null(_userService.GetById(user.Id));
        }

        [Fact]
        public void Delete_NonExistingUser_ReturnsFalse()
        {
            // Act
            var result = _userService.Delete(999);

            // Assert
            Assert.False(result);
        }

        #endregion

        #region ValidateEmail Tests

        [Theory]
        [InlineData("valid@example.com", true)]
        [InlineData("user.name@domain.co.uk", true)]
        [InlineData("user+tag@example.com", true)]
        [InlineData("invalid", false)]
        [InlineData("@invalid.com", false)]
        [InlineData("invalid@", false)]
        [InlineData("", false)]
        [InlineData(" ", false)]
        public void ValidateEmail_VariousInputs_ReturnsExpectedResult(
            string email, bool expected)
        {
            // Act
            var result = _userService.ValidateEmail(email);

            // Assert
            Assert.Equal(expected, result);
            _output.WriteLine($"Email: {email}, Valid: {result}");
        }

        #endregion

        public void Dispose()
        {
            _output.WriteLine("测试清理完成");
        }
    }
}
```

### 异步测试

```csharp
public class AsyncUserServiceTests
{
    private readonly AsyncUserService _service;

    public AsyncUserServiceTests()
    {
        _service = new AsyncUserService();
    }

    [Fact]
    public async Task GetByIdAsync_ExistingUser_ReturnsUser()
    {
        // Arrange
        var createdUser = await _service.CreateAsync("testuser", "test@example.com");

        // Act
        var result = await _service.GetByIdAsync(createdUser.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(createdUser.Id, result.Id);
    }

    [Fact]
    public async Task CreateAsync_ValidInput_ReturnsNewUser()
    {
        // Act
        var user = await _service.CreateAsync("asyncuser", "async@example.com");

        // Assert
        Assert.NotNull(user);
        Assert.Equal("asyncuser", user.Username);
    }

    [Fact]
    public async Task DeleteAsync_ExistingUser_ReturnsTrue()
    {
        // Arrange
        var user = await _service.CreateAsync("deleteuser", "delete@example.com");

        // Act
        var result = await _service.DeleteAsync(user.Id);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task CreateAsync_InvalidEmail_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CreateAsync("user", "invalid"));
    }
}
```

### 使用 Mock 进行单元测试

```csharp
using Moq;
using Xunit;

public class UserControllerTests
{
    private readonly Mock<IUserService> _mockUserService;
    private readonly UserController _controller;

    public UserControllerTests()
    {
        _mockUserService = new Mock<IUserService>();
        _controller = new UserController(_mockUserService.Object);
    }

    [Fact]
    public void GetUser_ExistingId_ReturnsOkResult()
    {
        // Arrange
        var expectedUser = new User { Id = 1, Username = "testuser" };
        _mockUserService.Setup(s => s.GetById(1)).Returns(expectedUser);

        // Act
        var result = _controller.GetUser(1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("testuser", user.Username);

        // 验证方法被调用
        _mockUserService.Verify(s => s.GetById(1), Times.Once);
    }

    [Fact]
    public void GetUser_NonExistingId_ReturnsNotFound()
    {
        // Arrange
        _mockUserService.Setup(s => s.GetById(It.IsAny<int>())).Returns((User?)null);

        // Act
        var result = _controller.GetUser(999);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void CreateUser_ValidInput_ReturnsCreatedResult()
    {
        // Arrange
        var newUser = new User { Id = 1, Username = "newuser", Email = "new@example.com" };
        _mockUserService
            .Setup(s => s.Create(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(newUser);

        // Act
        var result = _controller.CreateUser(new CreateUserRequest
        {
            Username = "newuser",
            Email = "new@example.com"
        });

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var user = Assert.IsType<User>(createdResult.Value);
        Assert.Equal("newuser", user.Username);
    }

    [Fact]
    public void CreateUser_ServiceThrowsException_ReturnsBadRequest()
    {
        // Arrange
        _mockUserService
            .Setup(s => s.Create(It.IsAny<string>(), It.IsAny<string>()))
            .Throws(new ArgumentException("Invalid input"));

        // Act
        var result = _controller.CreateUser(new CreateUserRequest
        {
            Username = "",
            Email = "test@example.com"
        });

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Invalid input", badRequestResult.Value?.ToString());
    }
}
```

### 集成测试示例

```csharp
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using Xunit;

public class UserApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UserApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // 替换为测试数据库
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));
            });
        });
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetUsers_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/users");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json; charset=utf-8",
            response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task CreateUser_ValidInput_ReturnsCreatedUser()
    {
        // Arrange
        var newUser = new { Username = "integrationuser", Email = "integration@test.com" };

        // Act
        var response = await _client.PostAsJsonAsync("/api/users", newUser);

        // Assert
        response.EnsureSuccessStatusCode();
        var createdUser = await response.Content.ReadFromJsonAsync<User>();
        Assert.NotNull(createdUser);
        Assert.Equal("integrationuser", createdUser.Username);
    }

    [Fact]
    public async Task GetUser_NonExistingId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/users/99999");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }
}
```

## 最佳实践

### 遵循 AAA 模式

```csharp
[Fact]
public void MethodName_Scenario_ExpectedBehavior()
{
    // Arrange - 准备测试数据和依赖
    var service = new MyService();
    var input = "test input";

    // Act - 执行被测试的方法
    var result = service.Process(input);

    // Assert - 验证结果
    Assert.Equal("expected output", result);
}
```

### 测试命名约定

```csharp
// 推荐的命名格式：MethodName_Scenario_ExpectedResult
[Fact]
public void Add_TwoPositiveNumbers_ReturnsSum() { }

[Fact]
public void Divide_ByZero_ThrowsDivideByZeroException() { }

[Fact]
public void GetUser_NonExistingId_ReturnsNull() { }

[Fact]
public void CreateUser_DuplicateEmail_ThrowsInvalidOperationException() { }
```

### 一个测试一个断言（单一职责）

```csharp
// 不推荐：一个测试验证多个不相关的行为
[Fact]
public void UserService_AllOperations_WorkCorrectly()
{
    var service = new UserService();
    var user = service.Create("user", "user@example.com");
    Assert.NotNull(user);
    Assert.True(service.Delete(user.Id));
    Assert.Null(service.GetById(user.Id));
}

// 推荐：拆分为多个专注的测试
[Fact]
public void Create_ValidInput_ReturnsNewUser()
{
    var service = new UserService();
    var user = service.Create("user", "user@example.com");
    Assert.NotNull(user);
}

[Fact]
public void Delete_ExistingUser_ReturnsTrue()
{
    var service = new UserService();
    var user = service.Create("user", "user@example.com");
    Assert.True(service.Delete(user.Id));
}

[Fact]
public void GetById_DeletedUser_ReturnsNull()
{
    var service = new UserService();
    var user = service.Create("user", "user@example.com");
    service.Delete(user.Id);
    Assert.Null(service.GetById(user.Id));
}
```

### 使用有意义的测试数据

```csharp
// 不推荐：使用无意义的数据
[Fact]
public void Test1()
{
    var result = calculator.Add(1, 2);
    Assert.Equal(3, result);
}

// 推荐：使用能说明意图的数据
[Fact]
public void Add_TwoPositiveNumbers_ReturnsCorrectSum()
{
    var result = calculator.Add(15, 27);
    Assert.Equal(42, result);
}

[Fact]
public void Add_PositiveAndNegativeNumber_ReturnsCorrectSum()
{
    var result = calculator.Add(10, -3);
    Assert.Equal(7, result);
}
```

### 测试边界条件

```csharp
public class BoundaryTests
{
    [Theory]
    [InlineData(int.MinValue)]
    [InlineData(int.MaxValue)]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1)]
    public void ProcessNumber_EdgeCases_HandlesCorrectly(int value)
    {
        var service = new NumberService();
        var result = service.Process(value);
        Assert.NotNull(result);
    }

    [Theory]
    [InlineData("")]                    // 空字符串
    [InlineData(" ")]                   // 空白字符串
    [InlineData("a")]                   // 最短有效字符串
    [InlineData("a very long string")] // 长字符串
    public void ProcessString_EdgeCases_HandlesCorrectly(string value)
    {
        var service = new StringService();
        var result = service.Process(value);
        // 验证结果
    }
}
```

### 保持测试独立

```csharp
// 不推荐：测试之间有依赖
public class DependentTests
{
    private static User? _sharedUser;

    [Fact]
    public void Test1_CreateUser()
    {
        _sharedUser = _service.Create("user", "user@example.com");
        Assert.NotNull(_sharedUser);
    }

    [Fact]
    public void Test2_UseCreatedUser()
    {
        // 依赖 Test1 先执行，这是错误的！
        Assert.NotNull(_sharedUser);
    }
}

// 推荐：每个测试独立设置
public class IndependentTests
{
    [Fact]
    public void Test1_CreateUser()
    {
        var service = new UserService();
        var user = service.Create("user", "user@example.com");
        Assert.NotNull(user);
    }

    [Fact]
    public void Test2_CreateAndUseUser()
    {
        var service = new UserService();
        var user = service.Create("user", "user@example.com");
        // 使用刚创建的用户
        Assert.NotNull(service.GetById(user.Id));
    }
}
```

## 常见陷阱

### 测试顺序依赖

```csharp
// 错误：假设测试按特定顺序执行
public class OrderDependentTests
{
    private static int _counter = 0;

    [Fact]
    public void Test1() => Assert.Equal(0, _counter++);

    [Fact]
    public void Test2() => Assert.Equal(1, _counter++);  // 可能失败！
}

// 正确：每个测试独立
public class OrderIndependentTests
{
    [Fact]
    public void Test1()
    {
        var counter = 0;
        Assert.Equal(0, counter);
    }

    [Fact]
    public void Test2()
    {
        var counter = 0;
        Assert.Equal(0, counter);
    }
}
```

### 共享可变状态

```csharp
// 错误：共享可变状态
public class SharedStateTests
{
    private readonly List<string> _items = new(); // 在测试之间共享

    [Fact]
    public void Test1()
    {
        _items.Add("item1");
        Assert.Single(_items);
    }

    [Fact]
    public void Test2()
    {
        _items.Add("item2");
        Assert.Single(_items);  // 可能失败，因为 Test1 可能已添加元素
    }
}

// 正确：每个测试有自己的实例
public class IsolatedStateTests
{
    [Fact]
    public void Test1()
    {
        var items = new List<string>();
        items.Add("item1");
        Assert.Single(items);
    }

    [Fact]
    public void Test2()
    {
        var items = new List<string>();
        items.Add("item2");
        Assert.Single(items);
    }
}
```

### 异步测试中忘记 await

```csharp
// 错误：忘记 await
[Fact]
public void WrongAsyncTest()
{
    // 这个测试会立即完成，不会等待异步操作
    _service.DoSomethingAsync();  // 没有 await！
    Assert.True(true);
}

// 正确：正确使用 async/await
[Fact]
public async Task CorrectAsyncTest()
{
    await _service.DoSomethingAsync();
    Assert.True(true);
}
```

### 测试实现细节而非行为

```csharp
// 不推荐：测试内部实现
[Fact]
public void TestImplementationDetails()
{
    var service = new UserService();
    service.Create("user", "user@example.com");

    // 不要测试内部字段或私有方法
    // Assert.Equal(1, service._users.Count);  // 访问私有字段
}

// 推荐：测试公共行为
[Fact]
public void TestPublicBehavior()
{
    var service = new UserService();
    service.Create("user", "user@example.com");

    var users = service.GetAll();
    Assert.Single(users);
}
```

### 过度使用 Mock

```csharp
// 不推荐：Mock 所有东西
[Fact]
public void OverMocking()
{
    var mockList = new Mock<IList<int>>();
    mockList.Setup(l => l.Count).Returns(1);
    mockList.Setup(l => l[0]).Returns(42);

    // 测试变得难以理解
}

// 推荐：只 Mock 必要的外部依赖
[Fact]
public void ApproprieateMocking()
{
    var mockRepository = new Mock<IUserRepository>();
    mockRepository.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });

    var service = new UserService(mockRepository.Object);
    var user = service.GetUser(1);

    Assert.NotNull(user);
}
```

### 断言消息缺失

```csharp
// 不推荐：没有断言消息
[Fact]
public void TestWithoutMessage()
{
    var result = service.Calculate(5);
    Assert.True(result > 0);  // 失败时不知道为什么
}

// 推荐：提供有意义的断言消息（虽然 xUnit 通常不需要）
[Fact]
public void TestWithClearAssertion()
{
    var input = 5;
    var result = service.Calculate(input);

    // 使用更具体的断言
    Assert.True(result > 0, $"Expected positive result for input {input}, but got {result}");

    // 或者使用更具体的断言方法
    Assert.InRange(result, 1, int.MaxValue);
}
```

## 性能考量

### 测试并行执行

```csharp
// xUnit 默认并行执行不同类的测试
// 可以通过属性控制并行行为

// 禁用某个类的并行执行
[Collection("Sequential")]
public class SequentialTests
{
    // 这些测试将顺序执行
}

// 在 xunit.runner.json 中配置
// {
//     "parallelizeTestCollections": false,
//     "maxParallelThreads": 4
// }
```

### 测试固件的合理使用

```csharp
// 昂贵的资源应该使用固件共享
public class ExpensiveResourceFixture : IAsyncLifetime
{
    public HttpClient Client { get; private set; }

    public async Task InitializeAsync()
    {
        // 只初始化一次
        Client = new HttpClient();
        await WarmUpAsync();
    }

    public async Task DisposeAsync()
    {
        Client.Dispose();
        await Task.CompletedTask;
    }

    private async Task WarmUpAsync()
    {
        // 预热操作
        await Task.Delay(100);
    }
}

// 多个测试类共享同一个固件实例
[Collection("Expensive Resource")]
public class Test1 : IClassFixture<ExpensiveResourceFixture>
{
    private readonly ExpensiveResourceFixture _fixture;

    public Test1(ExpensiveResourceFixture fixture) => _fixture = fixture;
}
```

### 避免测试中的延迟

```csharp
// 不推荐：使用 Thread.Sleep
[Fact]
public void SlowTest()
{
    service.StartProcess();
    Thread.Sleep(5000);  // 不好！
    Assert.True(service.IsCompleted);
}

// 推荐：使用轮询或等待机制
[Fact]
public async Task FastTest()
{
    service.StartProcess();

    // 使用超时轮询
    var timeout = TimeSpan.FromSeconds(5);
    var start = DateTime.UtcNow;

    while (!service.IsCompleted && DateTime.UtcNow - start < timeout)
    {
        await Task.Delay(100);
    }

    Assert.True(service.IsCompleted);
}

// 或者使用事件
[Fact]
public async Task EventBasedTest()
{
    var tcs = new TaskCompletionSource<bool>();
    service.Completed += (s, e) => tcs.SetResult(true);

    service.StartProcess();

    var completed = await Task.WhenAny(tcs.Task, Task.Delay(5000)) == tcs.Task;
    Assert.True(completed);
}
```

### 数据库测试优化

```csharp
public class DatabaseTestOptimization
{
    // 使用内存数据库加速测试
    private static DbContextOptions<AppDbContext> CreateInMemoryOptions()
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task FastDatabaseTest()
    {
        using var context = new AppDbContext(CreateInMemoryOptions());
        var service = new UserService(context);

        var user = await service.CreateAsync("test", "test@example.com");

        Assert.NotNull(user);
    }
}
```

## 实战场景

### 场景一：API 端点测试

```csharp
public class WeatherApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public WeatherApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetWeatherForecast_ReturnsSuccessAndCorrectContentType()
    {
        // Act
        var response = await _client.GetAsync("/weatherforecast");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json; charset=utf-8",
            response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task GetWeatherForecast_ReturnsFiveDayForecast()
    {
        // Act
        var response = await _client.GetAsync("/weatherforecast");
        var forecasts = await response.Content.ReadFromJsonAsync<WeatherForecast[]>();

        // Assert
        Assert.NotNull(forecasts);
        Assert.Equal(5, forecasts.Length);
        Assert.All(forecasts, f =>
        {
            Assert.InRange(f.TemperatureC, -20, 55);
            Assert.NotEmpty(f.Summary);
        });
    }
}
```

### 场景二：业务逻辑测试

```csharp
public class OrderServiceTests
{
    private readonly Mock<IInventoryService> _mockInventory;
    private readonly Mock<IPaymentService> _mockPayment;
    private readonly Mock<INotificationService> _mockNotification;
    private readonly OrderService _orderService;

    public OrderServiceTests()
    {
        _mockInventory = new Mock<IInventoryService>();
        _mockPayment = new Mock<IPaymentService>();
        _mockNotification = new Mock<INotificationService>();

        _orderService = new OrderService(
            _mockInventory.Object,
            _mockPayment.Object,
            _mockNotification.Object);
    }

    [Fact]
    public async Task PlaceOrder_ValidOrder_ProcessesSuccessfully()
    {
        // Arrange
        var order = new Order
        {
            CustomerId = 1,
            Items = new List<OrderItem>
            {
                new() { ProductId = 1, Quantity = 2, Price = 10.00m }
            }
        };

        _mockInventory.Setup(i => i.CheckAvailability(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _mockInventory.Setup(i => i.ReserveStock(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _mockPayment.Setup(p => p.ProcessPayment(It.IsAny<decimal>()))
            .ReturnsAsync(new PaymentResult { Success = true });

        // Act
        var result = await _orderService.PlaceOrderAsync(order);

        // Assert
        Assert.True(result.Success);
        Assert.NotEqual(Guid.Empty, result.OrderId);

        _mockInventory.Verify(i => i.CheckAvailability(1, 2), Times.Once);
        _mockInventory.Verify(i => i.ReserveStock(1, 2), Times.Once);
        _mockPayment.Verify(p => p.ProcessPayment(20.00m), Times.Once);
        _mockNotification.Verify(n => n.SendOrderConfirmation(It.IsAny<Order>()), Times.Once);
    }

    [Fact]
    public async Task PlaceOrder_InsufficientStock_ReturnsFailure()
    {
        // Arrange
        var order = new Order
        {
            Items = new List<OrderItem>
            {
                new() { ProductId = 1, Quantity = 100 }
            }
        };

        _mockInventory.Setup(i => i.CheckAvailability(1, 100))
            .ReturnsAsync(false);

        // Act
        var result = await _orderService.PlaceOrderAsync(order);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Insufficient stock", result.ErrorMessage);

        _mockPayment.Verify(p => p.ProcessPayment(It.IsAny<decimal>()), Times.Never);
    }

    [Fact]
    public async Task PlaceOrder_PaymentFails_RollsBackInventory()
    {
        // Arrange
        var order = new Order
        {
            Items = new List<OrderItem>
            {
                new() { ProductId = 1, Quantity = 2 }
            }
        };

        _mockInventory.Setup(i => i.CheckAvailability(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _mockInventory.Setup(i => i.ReserveStock(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _mockPayment.Setup(p => p.ProcessPayment(It.IsAny<decimal>()))
            .ReturnsAsync(new PaymentResult { Success = false, ErrorMessage = "Card declined" });

        // Act
        var result = await _orderService.PlaceOrderAsync(order);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Payment failed: Card declined", result.ErrorMessage);

        _mockInventory.Verify(i => i.ReleaseStock(1, 2), Times.Once);
    }
}
```

### 场景三：数据验证测试

```csharp
public class UserValidatorTests
{
    private readonly UserValidator _validator;

    public UserValidatorTests()
    {
        _validator = new UserValidator();
    }

    [Theory]
    [InlineData("john_doe", true)]
    [InlineData("jane.doe", true)]
    [InlineData("user123", true)]
    [InlineData("ab", false)]           // 太短
    [InlineData("", false)]             // 空
    [InlineData("user@name", false)]    // 包含非法字符
    [InlineData("a_very_long_username_that_exceeds_the_maximum_length", false)]
    public void ValidateUsername_VariousInputs_ReturnsExpectedResult(
        string username, bool expectedIsValid)
    {
        var result = _validator.ValidateUsername(username);
        Assert.Equal(expectedIsValid, result.IsValid);
    }

    [Fact]
    public void ValidateUser_AllFieldsValid_ReturnsSuccess()
    {
        var user = new UserDto
        {
            Username = "validuser",
            Email = "valid@example.com",
            Password = "SecureP@ss123",
            Age = 25
        };

        var result = _validator.Validate(user);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void ValidateUser_MultipleInvalidFields_ReturnsAllErrors()
    {
        var user = new UserDto
        {
            Username = "ab",                // 太短
            Email = "invalid-email",        // 无效格式
            Password = "123",               // 太弱
            Age = 150                       // 不合理的年龄
        };

        var result = _validator.Validate(user);

        Assert.False(result.IsValid);
        Assert.Equal(4, result.Errors.Count);
        Assert.Contains(result.Errors, e => e.Field == "Username");
        Assert.Contains(result.Errors, e => e.Field == "Email");
        Assert.Contains(result.Errors, e => e.Field == "Password");
        Assert.Contains(result.Errors, e => e.Field == "Age");
    }
}
```

## 面试要点

### xUnit 与其他测试框架的区别

**问：xUnit 相比 NUnit 和 MSTest 有什么优势？**

答：
- xUnit 使用构造函数进行初始化，IDisposable 进行清理，更符合 C# 习惯
- 每个测试方法都在新的测试类实例中运行，确保测试隔离
- 默认支持并行测试执行
- 使用 [Fact] 和 [Theory] 代替 [Test] 和 [TestCase]，语义更清晰
- 强大的可扩展性，可以自定义测试发现和执行行为

### [Fact] 和 [Theory] 的区别

**问：何时使用 [Fact]，何时使用 [Theory]？**

答：
- `[Fact]` 用于测试单一场景，不需要参数化数据
- `[Theory]` 用于数据驱动测试，同一个测试逻辑需要用多组数据验证
- `[Theory]` 需要配合数据提供者：[InlineData]、[MemberData]、[ClassData]

```csharp
[Fact]
public void SingleScenarioTest() { }

[Theory]
[InlineData(1, 2, 3)]
[InlineData(-1, 1, 0)]
public void MultipleDataTest(int a, int b, int expected) { }
```

### 测试固件的使用场景

**问：Class Fixture 和 Collection Fixture 的区别和使用场景？**

答：
- **Class Fixture**：在同一个测试类的所有测试之间共享资源
- **Collection Fixture**：在多个测试类之间共享资源
- 使用场景：数据库连接、HTTP 客户端、昂贵的初始化操作

### 如何测试异步代码

**问：xUnit 中如何正确测试异步方法？**

答：
```csharp
[Fact]
public async Task AsyncMethod_Scenario_ExpectedResult()
{
    // 使用 async Task 而不是 async void
    var result = await service.DoSomethingAsync();
    Assert.NotNull(result);
}

[Fact]
public async Task AsyncMethod_ThrowsException()
{
    // 使用 Assert.ThrowsAsync
    await Assert.ThrowsAsync<InvalidOperationException>(
        async () => await service.FailingMethodAsync());
}
```

### Mock 的使用原则

**问：在单元测试中应该 Mock 什么？**

答：
- Mock 外部依赖（数据库、API、文件系统）
- Mock 难以控制的行为（时间、随机数）
- 不要 Mock 被测试的类本身
- 不要过度 Mock，简单的值对象可以直接使用

### 测试覆盖率

**问：如何看待测试覆盖率？**

答：
- 覆盖率是指标，不是目标
- 80% 通常是合理的目标
- 关注关键业务逻辑的覆盖
- 高覆盖率不等于高质量测试
- 应该结合代码审查和其他质量指标

## 延伸阅读

### 官方文档
- [xUnit.net 官方文档](https://xunit.net/)
- [xUnit.net GitHub 仓库](https://github.com/xunit/xunit)
- [.NET 测试最佳实践](https://docs.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)

### 推荐书籍
- 《单元测试的艺术》(The Art of Unit Testing) - Roy Osherove
- 《xUnit 测试模式》(xUnit Test Patterns) - Gerard Meszaros
- 《测试驱动开发》(Test-Driven Development: By Example) - Kent Beck

### 相关工具
- [Moq](https://github.com/moq/moq4) - .NET Mock 框架
- [FluentAssertions](https://fluentassertions.com/) - 流畅断言库
- [AutoFixture](https://github.com/AutoFixture/AutoFixture) - 测试数据生成
- [Bogus](https://github.com/bchavez/Bogus) - 假数据生成器
- [Coverlet](https://github.com/coverlet-coverage/coverlet) - 代码覆盖率工具
- [Stryker.NET](https://stryker-mutator.io/docs/stryker-net/introduction/) - 突变测试

### 在线资源
- [xUnit.net Samples](https://github.com/xunit/samples.xunit)
- [Testing in .NET (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/core/testing/)
- [Unit Testing C# Code - Pluralsight](https://www.pluralsight.com/courses/unit-testing-csharp)
