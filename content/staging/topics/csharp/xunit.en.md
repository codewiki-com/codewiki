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
origin: old/src/content/docs/csharp/xunit.en.md
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

xUnit.net is one of the most popular unit testing frameworks on the .NET platform, created by Jim Newkirk, one of the original authors of NUnit. It is renowned for its clean, extensible, and modern design philosophy, and is the testing framework of choice for ASP.NET Core and many Microsoft open-source projects.

## Concept Explanation

### What is Unit Testing

Unit testing is a software testing method used to verify the correctness of the smallest testable units in code (typically methods or functions). Its core objectives are:

- **Isolated Verification**: Test each code unit independently
- **Fast Feedback**: Quickly discover issues during development
- **Regression Protection**: Prevent code modifications from introducing new bugs
- **Documentation**: Test code itself serves as the best usage documentation

### History and Characteristics of xUnit

xUnit.net was first released in 2007. Compared to NUnit and MSTest, it has the following characteristics:

- **More Modern Design**: Leverages C# language features, reducing unnecessary attributes and conventions
- **Strong Isolation**: Each test method runs in a new test class instance
- **Good Extensibility**: Powerful extension mechanisms support custom test behaviors
- **Parallel Execution**: Supports parallel test execution by default
- **Active Community**: Extensive community support and rich plugin ecosystem

### xUnit vs NUnit vs MSTest

| Feature | xUnit | NUnit | MSTest |
|---------|-------|-------|--------|
| Test Markers | [Fact], [Theory] | [Test], [TestCase] | [TestMethod] |
| Initialization | Constructor | [SetUp] | [TestInitialize] |
| Cleanup | IDisposable | [TearDown] | [TestCleanup] |
| Parameterized Tests | [Theory] + [InlineData] | [TestCase] | [DataRow] |
| Parallel Execution | Enabled by default | Requires configuration | Requires configuration |

## Core Principles

### Test Discovery Mechanism

xUnit uses reflection to discover test methods in compiled assemblies. The test discoverer looks for:

1. Public methods with `[Fact]` or `[Theory]` attributes
2. Methods with return type `void` or `Task`
3. Methods with no parameters (Fact) or with parameters (Theory)

```csharp
// Simplified xUnit internal test discovery logic
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

### Test Execution Flow

```
Test Discovery -> Test Ordering -> Create Test Class Instance -> Execute Test Method -> Collect Results -> Destroy Instance
                                ↓
                    [Each test gets a new instance]
```

A key design decision in xUnit is that **each test method executes in a new test class instance**, ensuring complete isolation between tests.

### Assertion Mechanism

xUnit's assertions are based on the static `Assert` class, which internally uses exceptions to report test failures:

```csharp
// Simplified implementation of Assert.Equal
public static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
    {
        throw new EqualException(expected, actual);
    }
}
```

## Core Concepts

### [Fact] Attribute

`[Fact]` is used to mark parameterless test methods, representing a "fact" - a condition that should always be true.

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

### [Theory] Attribute

`[Theory]` is used for data-driven tests, allowing the same test method to run with different data sets.

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

### [InlineData] Attribute

`[InlineData]` is the simplest way to provide data, specifying parameter values directly in the attribute.

```csharp
public class MathTests
{
    [Theory]
    [InlineData(1, 1, 2)]
    [InlineData(0, 0, 0)]
    [InlineData(-1, 1, 0)]
    [InlineData(int.MaxValue, 1, int.MinValue)] // Overflow test
    public void Add_VariousInputs_ReturnsExpectedResult(int a, int b, int expected)
    {
        var calculator = new Calculator();
        Assert.Equal(expected, calculator.Add(a, b));
    }

    // Multiple InlineData combinations
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

### [MemberData] Attribute

`[MemberData]` allows providing test data from properties, fields, or methods.

```csharp
public class MemberDataTests
{
    // Provide data from a static property
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

    // Provide data from a method (can accept parameters)
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

### [ClassData] Attribute

`[ClassData]` uses a separate class to provide test data, suitable for complex data generation logic.

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

// Using TheoryData<T> for better type safety
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

### Assertions

xUnit provides rich assertion methods:

```csharp
public class AssertionExamples
{
    [Fact]
    public void EqualityAssertions()
    {
        // Value equality
        Assert.Equal(5, 2 + 3);
        Assert.NotEqual(4, 2 + 3);

        // String comparison (case insensitive)
        Assert.Equal("HELLO", "hello", ignoreCase: true);

        // Floating point comparison (with precision)
        Assert.Equal(3.14, 3.141592, precision: 2);

        // Reference equality
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

        // Collection contains element
        Assert.Contains(3, list);
        Assert.DoesNotContain(6, list);

        // Using conditions
        Assert.Contains(list, item => item > 4);

        // Collection equality
        Assert.Equal(new[] { 1, 2, 3, 4, 5 }, list);

        // Collection is empty
        Assert.Empty(new List<int>());
        Assert.NotEmpty(list);

        // Single element
        Assert.Single(new[] { 42 });

        // All elements satisfy condition
        Assert.All(list, item => Assert.True(item > 0));

        // Collection size
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

        // Exact type
        Assert.IsType<string>(obj);

        // Assignable type (including inheritance)
        Assert.IsAssignableFrom<IEnumerable<char>>(obj);

        // Is not a certain type
        Assert.IsNotType<int>(obj);
    }

    [Fact]
    public void ExceptionAssertions()
    {
        // Verify exception is thrown
        var ex = Assert.Throws<ArgumentNullException>(() =>
            throw new ArgumentNullException("param"));
        Assert.Equal("param", ex.ParamName);

        // Verify exception message
        Assert.Throws<InvalidOperationException>(() =>
        {
            throw new InvalidOperationException("Operation failed");
        });

        // Async exception
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

### Test Lifecycle

xUnit uses constructors and `IDisposable` to manage test initialization and cleanup:

```csharp
public class TestLifecycleExample : IDisposable
{
    private readonly ITestOutputHelper _output;
    private readonly DatabaseConnection _connection;

    // Constructor: called before each test method executes
    public TestLifecycleExample(ITestOutputHelper output)
    {
        _output = output;
        _output.WriteLine("Constructor: Initializing test resources");
        _connection = new DatabaseConnection();
        _connection.Open();
    }

    [Fact]
    public void Test1()
    {
        _output.WriteLine("Executing Test1");
        Assert.True(_connection.IsOpen);
    }

    [Fact]
    public void Test2()
    {
        _output.WriteLine("Executing Test2");
        Assert.True(_connection.IsOpen);
    }

    // Dispose: called after each test method executes
    public void Dispose()
    {
        _output.WriteLine("Dispose: Cleaning up test resources");
        _connection.Close();
    }
}

// Async cleanup
public class AsyncTestLifecycleExample : IAsyncLifetime
{
    private HttpClient _client;

    public async Task InitializeAsync()
    {
        _client = new HttpClient();
        await Task.Delay(100); // Simulate async initialization
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

### Test Fixtures

Test fixtures are used to share expensive resources among multiple tests.

#### Class Fixture

Shares resources among all tests in the same test class:

```csharp
// Define fixture
public class DatabaseFixture : IDisposable
{
    public SqlConnection Connection { get; private set; }

    public DatabaseFixture()
    {
        Connection = new SqlConnection("...");
        Connection.Open();

        // Initialize test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Insert test data
    }

    public void Dispose()
    {
        Connection.Close();
    }
}

// Use fixture
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
        // Use _fixture.Connection for queries
        Assert.NotNull(_fixture.Connection);
    }

    [Fact]
    public void CanInsertRecord()
    {
        // Use the same connection
        Assert.True(_fixture.Connection.State == ConnectionState.Open);
    }
}
```

#### Collection Fixture

Shares resources among multiple test classes:

```csharp
// Define collection fixture
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

// Define collection
[CollectionDefinition("Integration Tests")]
public class IntegrationTestCollection : ICollectionFixture<IntegrationTestFixture>
{
    // This class has no code, it's only used to define the collection
}

// Use collection fixture
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

## Code Examples

### Complete Test Project Structure

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

### Class Under Test

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

### Complete Test Class

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
            _output.WriteLine("Test initialization complete");
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
            _output.WriteLine("Test cleanup complete");
        }
    }
}
```

### Async Tests

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

### Unit Testing with Mocks

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

        // Verify method was called
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

### Integration Test Example

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
                // Replace with test database
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

## Best Practices

### Follow the AAA Pattern

```csharp
[Fact]
public void MethodName_Scenario_ExpectedBehavior()
{
    // Arrange - Prepare test data and dependencies
    var service = new MyService();
    var input = "test input";

    // Act - Execute the method under test
    var result = service.Process(input);

    // Assert - Verify the result
    Assert.Equal("expected output", result);
}
```

### Test Naming Conventions

```csharp
// Recommended naming format: MethodName_Scenario_ExpectedResult
[Fact]
public void Add_TwoPositiveNumbers_ReturnsSum() { }

[Fact]
public void Divide_ByZero_ThrowsDivideByZeroException() { }

[Fact]
public void GetUser_NonExistingId_ReturnsNull() { }

[Fact]
public void CreateUser_DuplicateEmail_ThrowsInvalidOperationException() { }
```

### One Assertion per Test (Single Responsibility)

```csharp
// Not recommended: One test verifying multiple unrelated behaviors
[Fact]
public void UserService_AllOperations_WorkCorrectly()
{
    var service = new UserService();
    var user = service.Create("user", "user@example.com");
    Assert.NotNull(user);
    Assert.True(service.Delete(user.Id));
    Assert.Null(service.GetById(user.Id));
}

// Recommended: Split into multiple focused tests
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

### Use Meaningful Test Data

```csharp
// Not recommended: Using meaningless data
[Fact]
public void Test1()
{
    var result = calculator.Add(1, 2);
    Assert.Equal(3, result);
}

// Recommended: Using data that conveys intent
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

### Test Boundary Conditions

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
    [InlineData("")]                    // Empty string
    [InlineData(" ")]                   // Whitespace string
    [InlineData("a")]                   // Shortest valid string
    [InlineData("a very long string")] // Long string
    public void ProcessString_EdgeCases_HandlesCorrectly(string value)
    {
        var service = new StringService();
        var result = service.Process(value);
        // Verify result
    }
}
```

### Keep Tests Independent

```csharp
// Not recommended: Tests with dependencies
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
        // Depends on Test1 executing first - this is wrong!
        Assert.NotNull(_sharedUser);
    }
}

// Recommended: Each test sets up independently
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
        // Use the just-created user
        Assert.NotNull(service.GetById(user.Id));
    }
}
```

## Common Pitfalls

### Test Order Dependencies

```csharp
// Wrong: Assuming tests execute in a specific order
public class OrderDependentTests
{
    private static int _counter = 0;

    [Fact]
    public void Test1() => Assert.Equal(0, _counter++);

    [Fact]
    public void Test2() => Assert.Equal(1, _counter++);  // May fail!
}

// Correct: Each test is independent
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

### Shared Mutable State

```csharp
// Wrong: Shared mutable state
public class SharedStateTests
{
    private readonly List<string> _items = new(); // Shared between tests

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
        Assert.Single(_items);  // May fail because Test1 may have already added an element
    }
}

// Correct: Each test has its own instance
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

### Forgetting await in Async Tests

```csharp
// Wrong: Forgetting await
[Fact]
public void WrongAsyncTest()
{
    // This test will complete immediately, not waiting for the async operation
    _service.DoSomethingAsync();  // No await!
    Assert.True(true);
}

// Correct: Properly using async/await
[Fact]
public async Task CorrectAsyncTest()
{
    await _service.DoSomethingAsync();
    Assert.True(true);
}
```

### Testing Implementation Details Instead of Behavior

```csharp
// Not recommended: Testing internal implementation
[Fact]
public void TestImplementationDetails()
{
    var service = new UserService();
    service.Create("user", "user@example.com");

    // Don't test internal fields or private methods
    // Assert.Equal(1, service._users.Count);  // Accessing private field
}

// Recommended: Testing public behavior
[Fact]
public void TestPublicBehavior()
{
    var service = new UserService();
    service.Create("user", "user@example.com");

    var users = service.GetAll();
    Assert.Single(users);
}
```

### Over-mocking

```csharp
// Not recommended: Mocking everything
[Fact]
public void OverMocking()
{
    var mockList = new Mock<IList<int>>();
    mockList.Setup(l => l.Count).Returns(1);
    mockList.Setup(l => l[0]).Returns(42);

    // Test becomes hard to understand
}

// Recommended: Only mock necessary external dependencies
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

### Missing Assertion Messages

```csharp
// Not recommended: No assertion message
[Fact]
public void TestWithoutMessage()
{
    var result = service.Calculate(5);
    Assert.True(result > 0);  // Don't know why it failed
}

// Recommended: Provide meaningful assertion messages (though xUnit usually doesn't require them)
[Fact]
public void TestWithClearAssertion()
{
    var input = 5;
    var result = service.Calculate(input);

    // Use more specific assertions
    Assert.True(result > 0, $"Expected positive result for input {input}, but got {result}");

    // Or use more specific assertion methods
    Assert.InRange(result, 1, int.MaxValue);
}
```

## Performance Considerations

### Parallel Test Execution

```csharp
// xUnit executes tests from different classes in parallel by default
// You can control parallel behavior with attributes

// Disable parallel execution for a class
[Collection("Sequential")]
public class SequentialTests
{
    // These tests will execute sequentially
}

// Configure in xunit.runner.json
// {
//     "parallelizeTestCollections": false,
//     "maxParallelThreads": 4
// }
```

### Proper Use of Test Fixtures

```csharp
// Expensive resources should be shared using fixtures
public class ExpensiveResourceFixture : IAsyncLifetime
{
    public HttpClient Client { get; private set; }

    public async Task InitializeAsync()
    {
        // Initialize only once
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
        // Warm-up operations
        await Task.Delay(100);
    }
}

// Multiple test classes share the same fixture instance
[Collection("Expensive Resource")]
public class Test1 : IClassFixture<ExpensiveResourceFixture>
{
    private readonly ExpensiveResourceFixture _fixture;

    public Test1(ExpensiveResourceFixture fixture) => _fixture = fixture;
}
```

### Avoid Delays in Tests

```csharp
// Not recommended: Using Thread.Sleep
[Fact]
public void SlowTest()
{
    service.StartProcess();
    Thread.Sleep(5000);  // Bad!
    Assert.True(service.IsCompleted);
}

// Recommended: Use polling or waiting mechanisms
[Fact]
public async Task FastTest()
{
    service.StartProcess();

    // Use timeout polling
    var timeout = TimeSpan.FromSeconds(5);
    var start = DateTime.UtcNow;

    while (!service.IsCompleted && DateTime.UtcNow - start < timeout)
    {
        await Task.Delay(100);
    }

    Assert.True(service.IsCompleted);
}

// Or use events
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

### Database Test Optimization

```csharp
public class DatabaseTestOptimization
{
    // Use in-memory database to speed up tests
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

## Practical Scenarios

### Scenario 1: API Endpoint Testing

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

### Scenario 2: Business Logic Testing

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

### Scenario 3: Data Validation Testing

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
    [InlineData("ab", false)]           // Too short
    [InlineData("", false)]             // Empty
    [InlineData("user@name", false)]    // Contains illegal characters
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
            Username = "ab",                // Too short
            Email = "invalid-email",        // Invalid format
            Password = "123",               // Too weak
            Age = 150                       // Unreasonable age
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

## Interview Key Points

### Differences Between xUnit and Other Testing Frameworks

**Q: What are the advantages of xUnit compared to NUnit and MSTest?**

A:
- xUnit uses constructors for initialization and IDisposable for cleanup, more idiomatic to C#
- Each test method runs in a new test class instance, ensuring test isolation
- Supports parallel test execution by default
- Uses [Fact] and [Theory] instead of [Test] and [TestCase], with clearer semantics
- Powerful extensibility, allowing customization of test discovery and execution behavior

### Difference Between [Fact] and [Theory]

**Q: When to use [Fact] and when to use [Theory]?**

A:
- `[Fact]` is for testing a single scenario, no parameterized data needed
- `[Theory]` is for data-driven tests, where the same test logic needs to be verified with multiple data sets
- `[Theory]` requires data providers: [InlineData], [MemberData], [ClassData]

```csharp
[Fact]
public void SingleScenarioTest() { }

[Theory]
[InlineData(1, 2, 3)]
[InlineData(-1, 1, 0)]
public void MultipleDataTest(int a, int b, int expected) { }
```

### Test Fixture Use Cases

**Q: What's the difference between Class Fixture and Collection Fixture, and when to use each?**

A:
- **Class Fixture**: Shares resources among all tests in the same test class
- **Collection Fixture**: Shares resources among multiple test classes
- Use cases: Database connections, HTTP clients, expensive initialization operations

### How to Test Async Code

**Q: How do you properly test async methods in xUnit?**

A:
```csharp
[Fact]
public async Task AsyncMethod_Scenario_ExpectedResult()
{
    // Use async Task instead of async void
    var result = await service.DoSomethingAsync();
    Assert.NotNull(result);
}

[Fact]
public async Task AsyncMethod_ThrowsException()
{
    // Use Assert.ThrowsAsync
    await Assert.ThrowsAsync<InvalidOperationException>(
        async () => await service.FailingMethodAsync());
}
```

### Mocking Principles

**Q: What should you mock in unit tests?**

A:
- Mock external dependencies (databases, APIs, file system)
- Mock behaviors that are difficult to control (time, random numbers)
- Don't mock the class being tested
- Don't over-mock; simple value objects can be used directly

### Test Coverage

**Q: How do you view test coverage?**

A:
- Coverage is a metric, not a goal
- 80% is usually a reasonable target
- Focus on coverage of critical business logic
- High coverage doesn't equal high-quality tests
- Should be combined with code review and other quality metrics

## Further Reading

### Official Documentation
- [xUnit.net Official Documentation](https://xunit.net/)
- [xUnit.net GitHub Repository](https://github.com/xunit/xunit)
- [.NET Testing Best Practices](https://docs.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)

### Recommended Books
- "The Art of Unit Testing" - Roy Osherove
- "xUnit Test Patterns" - Gerard Meszaros
- "Test-Driven Development: By Example" - Kent Beck

### Related Tools
- [Moq](https://github.com/moq/moq4) - .NET Mock Framework
- [FluentAssertions](https://fluentassertions.com/) - Fluent Assertion Library
- [AutoFixture](https://github.com/AutoFixture/AutoFixture) - Test Data Generation
- [Bogus](https://github.com/bchavez/Bogus) - Fake Data Generator
- [Coverlet](https://github.com/coverlet-coverage/coverlet) - Code Coverage Tool
- [Stryker.NET](https://stryker-mutator.io/docs/stryker-net/introduction/) - Mutation Testing

### Online Resources
- [xUnit.net Samples](https://github.com/xunit/samples.xunit)
- [Testing in .NET (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/core/testing/)
- [Unit Testing C# Code - Pluralsight](https://www.pluralsight.com/courses/unit-testing-csharp)
