---
title: C# Moq Mocking Framework Guide
description: "Comprehensive guide to Moq: Creating mock objects, Setup configuration, Returns values, Verify calls, and Callback execution"
track: csharp
section: tooling
difficulty: intermediate
tags:
  - C#
  - Moq
  - Unit Testing
  - Mock
  - TDD
status: imported
origin: old/src/content/docs/csharp/moq.en.md
divergence: 0.209
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: csharp
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

Moq (pronounced "Mock-you") is one of the most popular mocking frameworks on the .NET platform. It leverages C# lambda expressions and LINQ expression trees to provide a type-safe and intuitive API for creating and configuring mock objects. It's an essential tool for writing high-quality unit tests.

## Concepts

### What is Mock?

In unit testing, we want to isolate the code unit being tested and prevent its dependencies (such as databases, network services, file systems, etc.) from affecting test results. Mock objects are "fake" objects used to replace these real dependencies.

**Key roles of Mock:**

1. **Isolate Dependencies**: Separate the tested code from external dependencies to ensure test independence
2. **Control Behavior**: Precisely control the return values and behavior of dependencies
3. **Verify Interactions**: Verify that the tested code correctly calls its dependencies
4. **Improve Efficiency**: Avoid performance overhead and complex configuration from real dependencies

### Mock vs Stub vs Fake

Among test double terminology, there are several common concepts to distinguish:

| Type | Description | Purpose |
|------|-------------|---------|
| **Stub** | Provides preset return values | Control indirect input to tested code |
| **Mock** | Verifiable stub | Verify indirect output from tested code (method calls) |
| **Fake** | Working version with simplified implementation | Replace complex real implementations (e.g., in-memory database) |
| **Spy** | Real object wrapper that records call information | Partial mocking, preserving original behavior |

The Moq framework is primarily used to create mocks and stubs, providing a rich API for flexible configuration and behavior verification.

### Why Choose Moq

Moq has several advantages over other mocking frameworks:

- **Type Safety**: Use strong-typed lambda expressions with compile-time error checking
- **Fluent API**: Method chaining with highly readable code
- **No Special Syntax**: Based on standard C# syntax
- **Powerful Verification**: Support for precise call count verification
- **Active Community**: Continuous maintenance, updates, and comprehensive documentation

## Core Principles

### Dynamic Proxy Mechanism

The core principle of Moq is **dynamic proxy**. When you create a `Mock<T>` object, Moq dynamically generates a proxy class at runtime that inherits from `T` (if it's a class) or implements `T` (if it's an interface).

```
┌─────────────────────────────────────────────┐
│              Mock<IUserService>             │
│  ┌───────────────────────────────────────┐  │
│  │      Dynamically Generated Proxy      │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Implements IUserService        │  │  │
│  │  │  - GetUserById() → Returns Value│  │  │
│  │  │  - CreateUser() → Records Call  │  │  │
│  │  │  - Other Methods → Default Behavior│ │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│  Setup Configuration → Interceptor → Configured Values/Callback  │
│  Verify Verification → Check Call Records              │
└─────────────────────────────────────────────┘
```

### Expression Tree Parsing

Moq uses C# expression trees to capture method call information:

```csharp
// This doesn't actually call the method; it creates an expression tree
mock.Setup(x => x.GetUserById(It.IsAny<int>()))
    .Returns(new User { Id = 1, Name = "Test" });
```

The expression `x => x.GetUserById(It.IsAny<int>())` is compiled into an expression tree, which Moq parses to determine:
- The method name to intercept
- Parameter matching rules
- Configured return value or behavior

### MockBehavior Patterns

Moq supports two behavior patterns:

```csharp
// Loose mode (default): Unconfigured methods return default values
var looseMock = new Mock<IService>(MockBehavior.Loose);

// Strict mode: Unconfigured methods throw an exception
var strictMock = new Mock<IService>(MockBehavior.Strict);
```

| MockBehavior | Behavior for Unconfigured Methods | Use Case |
|--------------|-----------------------------------|----------|
| `Loose` (default) | Returns type default value | Most test scenarios, more flexible |
| `Strict` | Throws `MockException` | When all interactions must be configured |
| `Default` | Equivalent to `Loose` | Backward compatibility |

## Core Concepts

### Mock<T> Creates Mock Objects

`Mock<T>` is the core class of Moq, used to create mock objects:

```csharp
// Create mock of interface
var mockService = new Mock<IUserService>();

// Create mock of class (class must have virtual methods or be unsealed)
var mockRepository = new Mock<UserRepository>();

// Get the actual mock object
IUserService service = mockService.Object;
```

### Setup Configures Behavior

The `Setup` method configures the behavior of a mock object:

```csharp
// Configure method return value
mock.Setup(x => x.GetUser(1)).Returns(new User { Id = 1 });

// Configure property
mock.Setup(x => x.IsEnabled).Returns(true);

// Configure method to throw exception
mock.Setup(x => x.Delete(-1)).Throws<ArgumentException>();
```

### Returns Sets Return Values

The `Returns` method specifies the return value for method calls:

```csharp
// Static return value
mock.Setup(x => x.GetCount()).Returns(42);

// Dynamic return value (based on parameters)
mock.Setup(x => x.GetUser(It.IsAny<int>()))
    .Returns((int id) => new User { Id = id });

// Async method
mock.Setup(x => x.GetUserAsync(1))
    .ReturnsAsync(new User { Id = 1 });
```

### Verify Verifies Calls

The `Verify` method verifies that methods are called correctly:

```csharp
// Verify method was called
mock.Verify(x => x.Save(It.IsAny<User>()));

// Verify call count
mock.Verify(x => x.Save(It.IsAny<User>()), Times.Once);
mock.Verify(x => x.Log(It.IsAny<string>()), Times.AtLeast(2));

// Verify never called
mock.Verify(x => x.Delete(It.IsAny<int>()), Times.Never);
```

### Callback Executes Callbacks

`Callback` allows execution of custom logic when a method is called:

```csharp
var capturedUsers = new List<User>();

mock.Setup(x => x.Save(It.IsAny<User>()))
    .Callback<User>(user => capturedUsers.Add(user))
    .Returns(true);
```

### Parameter Matchers (It Class)

The `It` class provides powerful parameter matching functionality:

```csharp
It.IsAny<T>()           // Match any value
It.Is<T>(predicate)     // Match values satisfying condition
It.IsIn<T>(values)      // Match values in specified collection
It.IsNotIn<T>(values)   // Match values not in collection
It.IsInRange<T>(from, to, rangeKind)  // Match values in range
It.IsRegex(pattern)     // String regex matching
```

## Code Examples

### Install Moq

Install via NuGet:

```bash
dotnet add package Moq
```

### Basic Example: User Service Tests

Suppose we have the following interface and class to test:

```csharp
// User entity
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
}

// User repository interface
public interface IUserRepository
{
    User GetById(int id);
    IEnumerable<User> GetAll();
    void Add(User user);
    void Update(User user);
    void Delete(int id);
    bool Exists(int id);
}

// Email service interface
public interface IEmailService
{
    void SendWelcomeEmail(string email, string name);
    Task SendEmailAsync(string to, string subject, string body);
}

// User service (class under test)
public class UserService
{
    private readonly IUserRepository _repository;
    private readonly IEmailService _emailService;

    public UserService(IUserRepository repository, IEmailService emailService)
    {
        _repository = repository;
        _emailService = emailService;
    }

    public User GetUser(int id)
    {
        return _repository.GetById(id);
    }

    public void RegisterUser(User user)
    {
        if (_repository.Exists(user.Id))
        {
            throw new InvalidOperationException("User already exists");
        }

        user.IsActive = true;
        _repository.Add(user);
        _emailService.SendWelcomeEmail(user.Email, user.Name);
    }

    public void DeactivateUser(int id)
    {
        var user = _repository.GetById(id);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        user.IsActive = false;
        _repository.Update(user);
    }
}
```

### Writing Unit Tests

```csharp
using Moq;
using Xunit;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepository;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        // Create mock objects
        _mockRepository = new Mock<IUserRepository>();
        _mockEmailService = new Mock<IEmailService>();

        // Create object under test, inject mocks
        _userService = new UserService(
            _mockRepository.Object,
            _mockEmailService.Object
        );
    }

    [Fact]
    public void GetUser_WithValidId_ReturnsUser()
    {
        // Arrange - Configure mock behavior
        var expectedUser = new User { Id = 1, Name = "John Smith", Email = "john@test.com" };
        _mockRepository.Setup(r => r.GetById(1)).Returns(expectedUser);

        // Act - Execute tested method
        var result = _userService.GetUser(1);

        // Assert - Verify result
        Assert.NotNull(result);
        Assert.Equal("John Smith", result.Name);
        Assert.Equal("john@test.com", result.Email);

        // Verify repository method was called
        _mockRepository.Verify(r => r.GetById(1), Times.Once);
    }

    [Fact]
    public void GetUser_WithInvalidId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetById(It.IsAny<int>())).Returns((User)null);

        // Act
        var result = _userService.GetUser(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void RegisterUser_WithNewUser_AddsUserAndSendsEmail()
    {
        // Arrange
        var newUser = new User { Id = 1, Name = "Jane Doe", Email = "jane@test.com" };
        _mockRepository.Setup(r => r.Exists(1)).Returns(false);

        // Act
        _userService.RegisterUser(newUser);

        // Assert
        Assert.True(newUser.IsActive);

        // Verify repository Add method was called
        _mockRepository.Verify(r => r.Add(It.Is<User>(u =>
            u.Id == 1 &&
            u.Name == "Jane Doe" &&
            u.IsActive == true
        )), Times.Once);

        // Verify email service was called
        _mockEmailService.Verify(e => e.SendWelcomeEmail(
            "jane@test.com",
            "Jane Doe"
        ), Times.Once);
    }

    [Fact]
    public void RegisterUser_WithExistingUser_ThrowsException()
    {
        // Arrange
        var existingUser = new User { Id = 1, Name = "Mike Wilson" };
        _mockRepository.Setup(r => r.Exists(1)).Returns(true);

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(
            () => _userService.RegisterUser(existingUser)
        );

        Assert.Equal("User already exists", exception.Message);

        // Verify Add method was not called
        _mockRepository.Verify(r => r.Add(It.IsAny<User>()), Times.Never);

        // Verify email was not sent
        _mockEmailService.Verify(
            e => e.SendWelcomeEmail(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Fact]
    public void DeactivateUser_WithValidUser_UpdatesUser()
    {
        // Arrange
        var user = new User { Id = 1, Name = "Sarah Brown", IsActive = true };
        _mockRepository.Setup(r => r.GetById(1)).Returns(user);

        // Act
        _userService.DeactivateUser(1);

        // Assert
        Assert.False(user.IsActive);
        _mockRepository.Verify(r => r.Update(It.Is<User>(u =>
            u.Id == 1 && u.IsActive == false
        )), Times.Once);
    }

    [Fact]
    public void DeactivateUser_WithInvalidId_ThrowsException()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetById(It.IsAny<int>())).Returns((User)null);

        // Act & Assert
        Assert.Throws<KeyNotFoundException>(() => _userService.DeactivateUser(999));
    }
}
```

### Advanced Callback Usage

```csharp
public class CallbackExamplesTests
{
    [Fact]
    public void Callback_CapturesMethodArguments()
    {
        // Arrange
        var mock = new Mock<IUserRepository>();
        var capturedUsers = new List<User>();

        mock.Setup(r => r.Add(It.IsAny<User>()))
            .Callback<User>(user => capturedUsers.Add(user));

        var service = new UserService(mock.Object, Mock.Of<IEmailService>());

        // Act
        service.RegisterUser(new User { Id = 1, Name = "User1" });
        service.RegisterUser(new User { Id = 2, Name = "User2" });

        // Assert
        Assert.Equal(2, capturedUsers.Count);
        Assert.Equal("User1", capturedUsers[0].Name);
        Assert.Equal("User2", capturedUsers[1].Name);
    }

    [Fact]
    public void Callback_ExecutesBeforeAndAfterReturns()
    {
        // Arrange
        var mock = new Mock<IUserRepository>();
        var callOrder = new List<string>();

        mock.Setup(r => r.GetById(It.IsAny<int>()))
            .Callback<int>(id => callOrder.Add($"Before: {id}"))
            .Returns(new User { Id = 1 })
            .Callback(() => callOrder.Add("After"));

        // Act
        mock.Object.GetById(42);

        // Assert
        Assert.Equal(new[] { "Before: 42", "After" }, callOrder);
    }

    [Fact]
    public void Callback_WithMultipleParameters()
    {
        // Arrange
        var mock = new Mock<IEmailService>();
        string capturedTo = null;
        string capturedSubject = null;
        string capturedBody = null;

        mock.Setup(e => e.SendEmailAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()))
            .Callback<string, string, string>((to, subject, body) =>
            {
                capturedTo = to;
                capturedSubject = subject;
                capturedBody = body;
            })
            .ReturnsAsync(Task.CompletedTask);

        // Act
        mock.Object.SendEmailAsync("test@example.com", "Test Subject", "Test Content");

        // Assert
        Assert.Equal("test@example.com", capturedTo);
        Assert.Equal("Test Subject", capturedSubject);
        Assert.Equal("Test Content", capturedBody);
    }
}
```

### Sequential Return Values (SetupSequence)

```csharp
[Fact]
public void SetupSequence_ReturnsDifferentValuesOnEachCall()
{
    // Arrange
    var mock = new Mock<IUserRepository>();

    mock.SetupSequence(r => r.GetById(1))
        .Returns(new User { Id = 1, Name = "First Call" })
        .Returns(new User { Id = 1, Name = "Second Call" })
        .Returns(new User { Id = 1, Name = "Third Call" })
        .Throws<InvalidOperationException>();  // Fourth call throws

    // Act & Assert
    Assert.Equal("First Call", mock.Object.GetById(1).Name);
    Assert.Equal("Second Call", mock.Object.GetById(1).Name);
    Assert.Equal("Third Call", mock.Object.GetById(1).Name);
    Assert.Throws<InvalidOperationException>(() => mock.Object.GetById(1));
}
```

### Property Mocking

```csharp
public interface IConfiguration
{
    string ConnectionString { get; set; }
    int MaxRetries { get; }
    bool IsDebugMode { get; set; }
}

[Fact]
public void Property_MockingExamples()
{
    var mock = new Mock<IConfiguration>();

    // Set read-only property
    mock.Setup(c => c.MaxRetries).Returns(3);

    // Set read-write property (automatically tracks value changes)
    mock.SetupProperty(c => c.ConnectionString);
    mock.SetupProperty(c => c.IsDebugMode, true);  // With initial value

    var config = mock.Object;

    // Test read-only property
    Assert.Equal(3, config.MaxRetries);

    // Test read-write property
    config.ConnectionString = "Server=localhost;Database=test";
    Assert.Equal("Server=localhost;Database=test", config.ConnectionString);

    Assert.True(config.IsDebugMode);
    config.IsDebugMode = false;
    Assert.False(config.IsDebugMode);

    // Set all properties to auto-track
    var mock2 = new Mock<IConfiguration>();
    mock2.SetupAllProperties();
}
```

### Async Method Mocking

```csharp
public interface IAsyncUserRepository
{
    Task<User> GetByIdAsync(int id);
    Task<IEnumerable<User>> GetAllAsync();
    Task<bool> SaveAsync(User user);
    ValueTask<User> GetByIdValueTaskAsync(int id);
}

[Fact]
public async Task AsyncMethod_MockingExamples()
{
    var mock = new Mock<IAsyncUserRepository>();

    // Using ReturnsAsync
    mock.Setup(r => r.GetByIdAsync(1))
        .ReturnsAsync(new User { Id = 1, Name = "Async User" });

    // Using ReturnsAsync with delay
    mock.Setup(r => r.GetAllAsync())
        .ReturnsAsync(new List<User>
        {
            new User { Id = 1, Name = "User1" },
            new User { Id = 2, Name = "User2" }
        });

    // Throw exception asynchronously
    mock.Setup(r => r.GetByIdAsync(-1))
        .ThrowsAsync(new ArgumentException("Invalid ID"));

    // ValueTask support
    mock.Setup(r => r.GetByIdValueTaskAsync(1))
        .ReturnsAsync(new User { Id = 1, Name = "ValueTask User" });

    // Act
    var user = await mock.Object.GetByIdAsync(1);
    var users = await mock.Object.GetAllAsync();

    // Assert
    Assert.Equal("Async User", user.Name);
    Assert.Equal(2, users.Count());

    await Assert.ThrowsAsync<ArgumentException>(
        () => mock.Object.GetByIdAsync(-1)
    );
}

[Fact]
public async Task AsyncCallback_Example()
{
    var mock = new Mock<IAsyncUserRepository>();
    var saveCount = 0;

    mock.Setup(r => r.SaveAsync(It.IsAny<User>()))
        .Callback<User>(user => saveCount++)
        .ReturnsAsync(true);

    // Act
    await mock.Object.SaveAsync(new User { Id = 1 });
    await mock.Object.SaveAsync(new User { Id = 2 });

    // Assert
    Assert.Equal(2, saveCount);
}
```

### MockBehavior.Strict Example

```csharp
[Fact]
public void StrictMock_ThrowsOnUnexpectedCall()
{
    // Arrange
    var strictMock = new Mock<IUserRepository>(MockBehavior.Strict);

    // Only configure GetById method
    strictMock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });

    // Act & Assert
    // Configured method works normally
    var user = strictMock.Object.GetById(1);
    Assert.NotNull(user);

    // Unconfigured methods throw exception
    Assert.Throws<MockException>(() => strictMock.Object.GetById(2));
    Assert.Throws<MockException>(() => strictMock.Object.GetAll());
}

[Fact]
public void StrictMock_MustSetupAllUsedMethods()
{
    // Arrange
    var strictMock = new Mock<IUserRepository>(MockBehavior.Strict);
    var emailMock = new Mock<IEmailService>(MockBehavior.Strict);

    // Configure all methods that will be called
    strictMock.Setup(r => r.Exists(It.IsAny<int>())).Returns(false);
    strictMock.Setup(r => r.Add(It.IsAny<User>()));
    emailMock.Setup(e => e.SendWelcomeEmail(It.IsAny<string>(), It.IsAny<string>()));

    var service = new UserService(strictMock.Object, emailMock.Object);

    // Act - Won't throw because all methods are configured
    service.RegisterUser(new User { Id = 1, Name = "Test", Email = "test@test.com" });

    // Assert
    strictMock.Verify(r => r.Add(It.IsAny<User>()), Times.Once);
}
```

### Protected Method Mocking

```csharp
public abstract class BaseService
{
    public string Process(string input)
    {
        var validated = ValidateInput(input);
        return FormatOutput(validated);
    }

    protected abstract string ValidateInput(string input);
    protected virtual string FormatOutput(string input) => $"[{input}]";
}

[Fact]
public void Protected_MethodMocking()
{
    // Arrange
    var mock = new Mock<BaseService>();

    // Mock protected abstract method
    mock.Protected()
        .Setup<string>("ValidateInput", ItExpr.IsAny<string>())
        .Returns("Validated");

    // Mock protected virtual method
    mock.Protected()
        .Setup<string>("FormatOutput", ItExpr.IsAny<string>())
        .Returns<string>(s => $"<{s}>");

    // Act
    var result = mock.Object.Process("Test Input");

    // Assert
    Assert.Equal("<Validated>", result);

    // Verify protected method was called
    mock.Protected()
        .Verify("ValidateInput", Times.Once(), ItExpr.IsAny<string>());
}
```

### Generic Method Mocking

```csharp
public interface IGenericRepository
{
    T GetById<T>(int id) where T : class;
    IEnumerable<T> GetAll<T>() where T : class;
    void Save<T>(T entity) where T : class;
}

[Fact]
public void GenericMethod_Mocking()
{
    var mock = new Mock<IGenericRepository>();

    // Configure generic method
    mock.Setup(r => r.GetById<User>(1))
        .Returns(new User { Id = 1, Name = "Generic User" });

    mock.Setup(r => r.GetById<User>(It.IsAny<int>()))
        .Returns<int>(id => new User { Id = id, Name = $"User{id}" });

    mock.Setup(r => r.GetAll<User>())
        .Returns(new List<User>
        {
            new User { Id = 1 },
            new User { Id = 2 }
        });

    // Act
    var user1 = mock.Object.GetById<User>(1);
    var user5 = mock.Object.GetById<User>(5);
    var allUsers = mock.Object.GetAll<User>();

    // Assert
    Assert.Equal("Generic User", user1.Name);  // Exact match takes precedence
    Assert.Equal("User5", user5.Name);
    Assert.Equal(2, allUsers.Count());
}
```

## Best Practices

### Use Interfaces for Dependency Injection

```csharp
// Recommended: Depend on interface
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IPaymentService _paymentService;

    public OrderService(IOrderRepository repository, IPaymentService paymentService)
    {
        _repository = repository;
        _paymentService = paymentService;
    }
}

// Not recommended: Depend on concrete class (difficult to mock)
public class OrderService
{
    private readonly OrderRepository _repository = new OrderRepository();
}
```

### Follow AAA Pattern

```csharp
[Fact]
public void MethodName_Scenario_ExpectedBehavior()
{
    // Arrange - Prepare test data and mocks
    var mock = new Mock<IUserRepository>();
    mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });
    var service = new UserService(mock.Object);

    // Act - Execute tested method
    var result = service.GetUser(1);

    // Assert - Verify result
    Assert.NotNull(result);
    Assert.Equal(1, result.Id);
}
```

### Use MockRepository for Unified Management

```csharp
public class OrderServiceTests
{
    private readonly MockRepository _mockRepository;
    private readonly Mock<IOrderRepository> _orderRepoMock;
    private readonly Mock<IPaymentService> _paymentMock;
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        // Use MockRepository to manage all mocks uniformly
        _mockRepository = new MockRepository(MockBehavior.Strict);

        _orderRepoMock = _mockRepository.Create<IOrderRepository>();
        _paymentMock = _mockRepository.Create<IPaymentService>();

        _service = new OrderService(_orderRepoMock.Object, _paymentMock.Object);
    }

    [Fact]
    public void PlaceOrder_ValidOrder_ProcessesSuccessfully()
    {
        // Arrange
        _orderRepoMock.Setup(r => r.Save(It.IsAny<Order>())).Returns(true);
        _paymentMock.Setup(p => p.Process(It.IsAny<decimal>())).Returns(true);

        // Act
        var result = _service.PlaceOrder(new Order { Total = 100m });

        // Assert
        Assert.True(result);

        // Verify all mock expectations
        _mockRepository.VerifyAll();
    }
}
```

### Avoid Over-Mocking

```csharp
// Bad: Mocking simple value objects
var mockUser = new Mock<User>();
mockUser.Setup(u => u.Name).Returns("John");

// Good: Use real objects directly
var user = new User { Name = "John" };

// Only mock dependencies that really need isolation (databases, external services)
```

### Use VerifyNoOtherCalls

```csharp
[Fact]
public void Method_ShouldOnlyCallSpecificMethods()
{
    // Arrange
    var mock = new Mock<IUserRepository>();
    mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });

    var service = new UserService(mock.Object);

    // Act
    service.GetUser(1);

    // Assert
    mock.Verify(r => r.GetById(1), Times.Once);
    mock.VerifyNoOtherCalls();  // Ensure no other methods were called
}
```

### Use Mock.Of<T> for Quick Simple Mocks

```csharp
// Traditional approach
var mock = new Mock<IUserRepository>();
mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1, Name = "John" });
var repository = mock.Object;

// Concise approach (suitable for simple scenarios)
var repository = Mock.Of<IUserRepository>(r =>
    r.GetById(1) == new User { Id = 1, Name = "John" } &&
    r.Exists(1) == true
);
```

## Common Pitfalls

### Forgetting to Call .Object

```csharp
// Wrong: Passing mock object instead of mocked object
var mock = new Mock<IUserRepository>();
var service = new UserService(mock);  // Compilation error or runtime error

// Correct: Use .Object to get the mock object
var service = new UserService(mock.Object);
```

### Imprecise Parameter Matching

```csharp
// Problem: Setup and Verify use different parameters
mock.Setup(r => r.GetById(1)).Returns(new User());
mock.Verify(r => r.GetById(It.IsAny<int>()), Times.Once);  // May mismatch

// Recommendation: Keep consistent or clarify intent
mock.Setup(r => r.GetById(1)).Returns(new User());
mock.Verify(r => r.GetById(1), Times.Once);  // Exact match
```

### Async Methods Not Configured Correctly

```csharp
// Wrong: Returns null Task
mock.Setup(r => r.GetUserAsync(1)).Returns(null);  // NullReferenceException

// Wrong: Using Returns instead of ReturnsAsync
mock.Setup(r => r.GetUserAsync(1)).Returns(new User());  // Compilation error

// Correct: Use ReturnsAsync
mock.Setup(r => r.GetUserAsync(1)).ReturnsAsync(new User { Id = 1 });

// Or use Task.FromResult
mock.Setup(r => r.GetUserAsync(1)).Returns(Task.FromResult(new User { Id = 1 }));
```

### Generic Method Parameter Type Mismatch

```csharp
// Problem: Generic parameter type may cause Setup mismatch
mock.Setup(r => r.GetById<User>(1)).Returns(new User());
mock.Object.GetById<Admin>(1);  // Returns null because type doesn't match

// Solution: Configure each type separately
mock.Setup(r => r.GetById<User>(It.IsAny<int>())).Returns(new User());
mock.Setup(r => r.GetById<Admin>(It.IsAny<int>())).Returns(new Admin());
```

### Callback Exception Affecting Tests

```csharp
// Problem: Exception in callback may be ignored or misleading
mock.Setup(r => r.Save(It.IsAny<User>()))
    .Callback<User>(u =>
    {
        if (u == null) throw new ArgumentNullException();
    })
    .Returns(true);

// Recommendation: Record in callback, not verify
var savedUser = (User)null;
mock.Setup(r => r.Save(It.IsAny<User>()))
    .Callback<User>(u => savedUser = u)
    .Returns(true);

// Verify in Assert phase
Assert.NotNull(savedUser);
```

### Verifying Call Order Dependency

```csharp
// Moq doesn't directly support verifying call order
// Use Callback to record if needed

var callOrder = new List<string>();

mock.Setup(r => r.BeginTransaction())
    .Callback(() => callOrder.Add("BeginTransaction"));
mock.Setup(r => r.Commit())
    .Callback(() => callOrder.Add("Commit"));

// Verify order after test execution
Assert.Equal(new[] { "BeginTransaction", "Commit" }, callOrder);
```

## Performance Considerations

### Mock Object Creation Overhead

Mock objects are created via dynamic proxy at runtime, with some performance cost:

```csharp
// Create mock in test class constructor (recommended)
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mock;

    public UserServiceTests()
    {
        _mock = new Mock<IUserRepository>();  // Created once per test class instance
    }
}

// Avoid repeated creation of same configured mock in each test method
[Fact]
public void Test1()
{
    var mock = new Mock<IUserRepository>();  // Avoid
    // ...
}
```

### Avoid Excessive Setup

```csharp
// Bad: Configure methods you don't need
mock.Setup(r => r.GetById(It.IsAny<int>())).Returns(new User());
mock.Setup(r => r.GetAll()).Returns(new List<User>());
mock.Setup(r => r.Count()).Returns(10);
mock.Setup(r => r.Exists(It.IsAny<int>())).Returns(true);
// Actually only using GetById

// Good: Only configure methods needed for test
mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });
```

### Use Loose Mock Unless Necessary

```csharp
// Strict Mock has additional verification overhead
var strictMock = new Mock<IService>(MockBehavior.Strict);

// Use default Loose Mock for most cases
var looseMock = new Mock<IService>();  // MockBehavior.Loose
```

### Batch Test Data

```csharp
// Use Theory and InlineData to reduce repetitive code
[Theory]
[InlineData(1, "John")]
[InlineData(2, "Jane")]
[InlineData(3, "Bob")]
public void GetUser_ReturnsCorrectUser(int id, string expectedName)
{
    _mock.Setup(r => r.GetById(id)).Returns(new User { Id = id, Name = expectedName });

    var result = _service.GetUser(id);

    Assert.Equal(expectedName, result.Name);
}
```

## Real-World Scenarios

### Scenario 1: Testing Business Logic with External Service Dependencies

```csharp
public interface IPaymentGateway
{
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request);
    Task<RefundResult> RefundAsync(string transactionId, decimal amount);
}

public class PaymentService
{
    private readonly IPaymentGateway _gateway;
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IPaymentGateway gateway,
        IOrderRepository orderRepository,
        ILogger<PaymentService> logger)
    {
        _gateway = gateway;
        _orderRepository = orderRepository;
        _logger = logger;
    }

    public async Task<bool> ProcessOrderPaymentAsync(int orderId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found", orderId);
            return false;
        }

        if (order.IsPaid)
        {
            _logger.LogWarning("Order {OrderId} already paid", orderId);
            return false;
        }

        var request = new PaymentRequest
        {
            OrderId = orderId,
            Amount = order.TotalAmount,
            Currency = "USD"
        };

        var result = await _gateway.ProcessPaymentAsync(request);

        if (result.Success)
        {
            order.IsPaid = true;
            order.TransactionId = result.TransactionId;
            await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("Order {OrderId} paid successfully", orderId);
            return true;
        }

        _logger.LogError("Order {OrderId} payment failed: {Error}", orderId, result.ErrorMessage);
        return false;
    }
}

// Tests
public class PaymentServiceTests
{
    private readonly Mock<IPaymentGateway> _gatewayMock;
    private readonly Mock<IOrderRepository> _orderRepoMock;
    private readonly Mock<ILogger<PaymentService>> _loggerMock;
    private readonly PaymentService _service;

    public PaymentServiceTests()
    {
        _gatewayMock = new Mock<IPaymentGateway>();
        _orderRepoMock = new Mock<IOrderRepository>();
        _loggerMock = new Mock<ILogger<PaymentService>>();
        _service = new PaymentService(
            _gatewayMock.Object,
            _orderRepoMock.Object,
            _loggerMock.Object
        );
    }

    [Fact]
    public async Task ProcessOrderPayment_SuccessfulPayment_UpdatesOrder()
    {
        // Arrange
        var order = new Order
        {
            Id = 1,
            TotalAmount = 199.99m,
            IsPaid = false
        };

        _orderRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);
        _gatewayMock.Setup(g => g.ProcessPaymentAsync(It.Is<PaymentRequest>(r =>
            r.OrderId == 1 && r.Amount == 199.99m && r.Currency == "USD")))
            .ReturnsAsync(new PaymentResult
            {
                Success = true,
                TransactionId = "TXN123456"
            });

        // Act
        var result = await _service.ProcessOrderPaymentAsync(1);

        // Assert
        Assert.True(result);
        Assert.True(order.IsPaid);
        Assert.Equal("TXN123456", order.TransactionId);

        _orderRepoMock.Verify(r => r.UpdateAsync(It.Is<Order>(o =>
            o.Id == 1 && o.IsPaid && o.TransactionId == "TXN123456"
        )), Times.Once);
    }

    [Fact]
    public async Task ProcessOrderPayment_PaymentFails_DoesNotUpdateOrder()
    {
        // Arrange
        var order = new Order { Id = 1, TotalAmount = 100m, IsPaid = false };
        _orderRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);
        _gatewayMock.Setup(g => g.ProcessPaymentAsync(It.IsAny<PaymentRequest>()))
            .ReturnsAsync(new PaymentResult
            {
                Success = false,
                ErrorMessage = "Insufficient funds"
            });

        // Act
        var result = await _service.ProcessOrderPaymentAsync(1);

        // Assert
        Assert.False(result);
        Assert.False(order.IsPaid);
        _orderRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Order>()), Times.Never);
    }
}
```

### Scenario 2: Testing Retry Logic

```csharp
public class ResilientService
{
    private readonly IExternalApi _api;
    private readonly int _maxRetries;

    public ResilientService(IExternalApi api, int maxRetries = 3)
    {
        _api = api;
        _maxRetries = maxRetries;
    }

    public async Task<string> GetDataWithRetryAsync(string key)
    {
        for (int attempt = 1; attempt <= _maxRetries; attempt++)
        {
            try
            {
                return await _api.FetchAsync(key);
            }
            catch (TimeoutException) when (attempt < _maxRetries)
            {
                await Task.Delay(100 * attempt);  // Simple backoff
            }
        }

        throw new Exception($"Failed after {_maxRetries} retries");
    }
}

[Fact]
public async Task GetDataWithRetry_RetriesOnTimeout_SucceedsOnThirdAttempt()
{
    // Arrange
    var mock = new Mock<IExternalApi>();
    var callCount = 0;

    mock.Setup(a => a.FetchAsync("key"))
        .Returns(() =>
        {
            callCount++;
            if (callCount < 3)
            {
                throw new TimeoutException();
            }
            return Task.FromResult("Success");
        });

    var service = new ResilientService(mock.Object, maxRetries: 3);

    // Act
    var result = await service.GetDataWithRetryAsync("key");

    // Assert
    Assert.Equal("Success", result);
    Assert.Equal(3, callCount);
    mock.Verify(a => a.FetchAsync("key"), Times.Exactly(3));
}
```

### Scenario 3: Testing Event Publishing

```csharp
public interface IEventBus
{
    void Publish<T>(T @event) where T : class;
    Task PublishAsync<T>(T @event) where T : class;
}

public class OrderCreatedEvent
{
    public int OrderId { get; set; }
    public string CustomerEmail { get; set; }
    public decimal TotalAmount { get; set; }
}

public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEventBus _eventBus;

    public OrderService(IOrderRepository repository, IEventBus eventBus)
    {
        _repository = repository;
        _eventBus = eventBus;
    }

    public async Task<Order> CreateOrderAsync(Order order)
    {
        await _repository.AddAsync(order);

        _eventBus.Publish(new OrderCreatedEvent
        {
            OrderId = order.Id,
            CustomerEmail = order.CustomerEmail,
            TotalAmount = order.TotalAmount
        });

        return order;
    }
}

[Fact]
public async Task CreateOrder_PublishesOrderCreatedEvent()
{
    // Arrange
    var repoMock = new Mock<IOrderRepository>();
    var eventBusMock = new Mock<IEventBus>();
    OrderCreatedEvent capturedEvent = null;

    eventBusMock.Setup(e => e.Publish(It.IsAny<OrderCreatedEvent>()))
        .Callback<OrderCreatedEvent>(e => capturedEvent = e);

    var service = new OrderService(repoMock.Object, eventBusMock.Object);
    var order = new Order
    {
        Id = 1,
        CustomerEmail = "customer@test.com",
        TotalAmount = 299.99m
    };

    // Act
    await service.CreateOrderAsync(order);

    // Assert
    Assert.NotNull(capturedEvent);
    Assert.Equal(1, capturedEvent.OrderId);
    Assert.Equal("customer@test.com", capturedEvent.CustomerEmail);
    Assert.Equal(299.99m, capturedEvent.TotalAmount);

    eventBusMock.Verify(e => e.Publish(It.IsAny<OrderCreatedEvent>()), Times.Once);
}
```

## Interview Key Points

### Common Interview Questions

**1. What is Moq? Why use it?**

Moq is a mocking framework for the .NET platform used to create fake objects (mocks) in unit tests to replace real dependencies. Using Moq allows you to:
- Isolate code under test for independence
- Control dependency behavior and return values
- Verify code interactions with dependencies

**2. What are the differences between Mock, Stub, and Fake?**

- **Stub**: Provides preset return values, no call verification
- **Mock**: Verifiable stub, focused on behavior verification
- **Fake**: Working version with simplified implementation

**3. What's the difference between Setup and Verify?**

- **Setup**: Configure mock object behavior (method return values, exceptions, etc.)
- **Verify**: Verify methods are called and how many times

```csharp
mock.Setup(x => x.Method()).Returns(value);  // Configure behavior
mock.Verify(x => x.Method(), Times.Once);    // Verify call
```

**4. Difference between MockBehavior.Strict and MockBehavior.Loose?**

- **Loose** (default): Unconfigured methods return default values
- **Strict**: Unconfigured methods throw exception, requires explicit configuration

**5. How to verify method call count?**

```csharp
mock.Verify(x => x.Method(), Times.Once);
mock.Verify(x => x.Method(), Times.Exactly(3));
mock.Verify(x => x.Method(), Times.AtLeast(2));
mock.Verify(x => x.Method(), Times.Never);
```

**6. How to mock async methods?**

```csharp
mock.Setup(x => x.GetAsync(1)).ReturnsAsync(new User());
mock.Setup(x => x.SaveAsync()).ThrowsAsync(new Exception());
```

**7. Difference between It.IsAny<T>() and concrete value matching?**

- `It.IsAny<T>()`: Matches any value, more flexible
- Concrete value: Exact match, stricter test

**8. What is Callback used for?**

Callback allows executing custom logic when a method is called, commonly used for:
- Capturing method parameters
- Recording call order
- Executing side effects

**9. Why can only interfaces and virtual methods be mocked?**

Moq uses dynamic proxy technology, which requires ability to override methods. Only interface methods and virtual methods can be overridden.

**10. How to avoid over-mocking?**

- Only mock dependencies that really need isolation
- Use real instances for simple value objects
- Consider integration tests for some scenarios

## Further Reading

### Official Resources

- [Moq GitHub Repository](https://github.com/moq/moq4)
- [Moq Quick Start](https://github.com/moq/moq4/wiki/Quickstart)
- [Moq API Documentation](https://moq.github.io/moq4/)

### Related Tools

- **xUnit**: Popular .NET test framework
- **NUnit**: Widely used alternative test framework
- **FluentAssertions**: Fluent assertion API
- **AutoFixture**: Automatic test data generation
- **Bogus**: Fake data generation library

### Alternative Solutions

- **NSubstitute**: Mocking framework with cleaner syntax
- **FakeItEasy**: Another popular mocking framework
- **JustMock**: Commercial mocking framework by Telerik

### Advanced Topics

- Test-Driven Development (TDD)
- Behavior-Driven Development (BDD)
- Integration and end-to-end testing
- Test pyramid strategy
- Dependency injection and inversion of control

### Recommended Books

- "The Art of Unit Testing" - Roy Osherove
- "xUnit Test Patterns" - Gerard Meszaros
- "Growing Object-Oriented Software, Guided by Tests" - Steve Freeman & Nat Pryce

## Summary

Moq is one of the most powerful and flexible mocking frameworks in the .NET ecosystem. After reading this guide, you should be able to:

1. Understand Mock concepts and Moq's working principles
2. Use Mock<T> to create mock objects
3. Master Setup, Returns, Verify, and Callback configuration and verification
4. Use parameter matchers and advanced mocking techniques
5. Avoid common pitfalls and performance issues
6. Apply best practices in real projects

Remember, the goal of unit testing is to verify code correctness, and Moq is a powerful tool for achieving this. Using mocks wisely makes your tests more stable, faster, and easier to maintain.
