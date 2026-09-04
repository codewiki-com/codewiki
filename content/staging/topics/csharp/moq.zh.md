---
title: C# Moq 模拟框架详解
description: 深入理解 Moq：Mock 对象创建、Setup 配置、Returns 返回值、Verify 验证与 Callback 回调
track: csharp
section: tooling
difficulty: intermediate
tags:
  - C#
  - Moq
  - 单元测试
  - Mock
  - TDD
status: imported
origin: old/src/content/docs/csharp/moq.zh.md
divergence: 0.209
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: CSharp
  subcategory: Testing
  order: 15
  lastUpdated: 2026-01-07
---

Moq（发音为 "Mock-you"）是 .NET 平台上最流行的模拟（Mocking）框架之一。它利用 C# 的 Lambda 表达式和 LINQ 表达式树，提供了类型安全且直观的 API 来创建和配置 Mock 对象，是编写高质量单元测试的必备工具。

## 概念解释

### 什么是 Mock

在单元测试中，我们希望隔离被测试的代码单元，避免其依赖项（如数据库、网络服务、文件系统等）影响测试结果。Mock 对象就是用来替代这些真实依赖的"假"对象。

**Mock 的主要作用：**

1. **隔离依赖**：将被测代码与外部依赖隔离，确保测试的独立性
2. **控制行为**：精确控制依赖项的返回值和行为
3. **验证交互**：验证被测代码是否正确调用了依赖项
4. **提高效率**：避免真实依赖带来的性能开销和复杂配置

### Mock vs Stub vs Fake

在测试替身（Test Double）的术语中，有几个常见概念需要区分：

| 类型 | 描述 | 用途 |
|------|------|------|
| **Stub** | 提供预设的返回值 | 控制被测代码的间接输入 |
| **Mock** | 可验证的 Stub | 验证被测代码的间接输出（方法调用） |
| **Fake** | 具有简化实现的工作版本 | 替代复杂的真实实现（如内存数据库） |
| **Spy** | 记录调用信息的真实对象包装 | 部分模拟，保留原有行为 |

Moq 框架主要用于创建 Mock 和 Stub，通过其丰富的 API 可以灵活地配置和验证对象行为。

### 为什么选择 Moq

Moq 相比其他模拟框架具有以下优势：

- **类型安全**：使用强类型 Lambda 表达式，编译时检查错误
- **流畅的 API**：链式调用，代码可读性强
- **无需学习特殊语法**：基于标准 C# 语法
- **强大的验证功能**：支持精确的调用次数验证
- **活跃的社区**：持续维护更新，文档完善

## 核心原理

### 动态代理机制

Moq 的核心原理是**动态代理**（Dynamic Proxy）。当你创建一个 `Mock<T>` 对象时，Moq 会在运行时动态生成一个继承自 `T`（如果是类）或实现 `T`（如果是接口）的代理类。

```
┌─────────────────────────────────────────────┐
│              Mock<IUserService>             │
│  ┌───────────────────────────────────────┐  │
│  │        动态生成的代理类                │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  实现 IUserService 接口          │  │  │
│  │  │  - GetUserById() → 返回配置值    │  │  │
│  │  │  - CreateUser() → 记录调用       │  │  │
│  │  │  - 其他方法 → 默认行为           │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│  Setup 配置 → 拦截器 → 返回配置的值/执行回调  │
│  Verify 验证 → 检查调用记录                  │
└─────────────────────────────────────────────┘
```

### 表达式树解析

Moq 使用 C# 的表达式树（Expression Tree）来捕获方法调用信息：

```csharp
// 这不是真正调用方法，而是创建一个表达式树
mock.Setup(x => x.GetUserById(It.IsAny<int>()))
    .Returns(new User { Id = 1, Name = "Test" });
```

表达式 `x => x.GetUserById(It.IsAny<int>())` 被编译为表达式树，Moq 解析这个树结构来确定：
- 要拦截的方法名称
- 参数匹配规则
- 配置的返回值或行为

### MockBehavior 模式

Moq 支持两种行为模式：

```csharp
// 松散模式（默认）：未配置的方法返回默认值
var looseMock = new Mock<IService>(MockBehavior.Loose);

// 严格模式：未配置的方法抛出异常
var strictMock = new Mock<IService>(MockBehavior.Strict);
```

| MockBehavior | 未配置方法的行为 | 适用场景 |
|--------------|------------------|----------|
| `Loose`（默认） | 返回类型默认值 | 大多数测试场景，更灵活 |
| `Strict` | 抛出 `MockException` | 需要确保所有交互都被配置时 |
| `Default` | 等同于 `Loose` | 保持向后兼容 |

## 核心要点

### Mock<T> 创建模拟对象

`Mock<T>` 是 Moq 的核心类，用于创建模拟对象：

```csharp
// 创建接口的 Mock
var mockService = new Mock<IUserService>();

// 创建类的 Mock（类必须有虚方法或非密封）
var mockRepository = new Mock<UserRepository>();

// 获取模拟的实际对象
IUserService service = mockService.Object;
```

### Setup 配置行为

`Setup` 方法用于配置 Mock 对象的行为：

```csharp
// 配置方法返回值
mock.Setup(x => x.GetUser(1)).Returns(new User { Id = 1 });

// 配置属性
mock.Setup(x => x.IsEnabled).Returns(true);

// 配置方法抛出异常
mock.Setup(x => x.Delete(-1)).Throws<ArgumentException>();
```

### Returns 设置返回值

`Returns` 方法指定方法调用的返回值：

```csharp
// 静态返回值
mock.Setup(x => x.GetCount()).Returns(42);

// 动态返回值（基于参数）
mock.Setup(x => x.GetUser(It.IsAny<int>()))
    .Returns((int id) => new User { Id = id });

// 异步方法
mock.Setup(x => x.GetUserAsync(1))
    .ReturnsAsync(new User { Id = 1 });
```

### Verify 验证调用

`Verify` 方法验证方法是否被正确调用：

```csharp
// 验证方法被调用
mock.Verify(x => x.Save(It.IsAny<User>()));

// 验证调用次数
mock.Verify(x => x.Save(It.IsAny<User>()), Times.Once);
mock.Verify(x => x.Log(It.IsAny<string>()), Times.AtLeast(2));

// 验证从未调用
mock.Verify(x => x.Delete(It.IsAny<int>()), Times.Never);
```

### Callback 执行回调

`Callback` 允许在方法调用时执行自定义逻辑：

```csharp
var capturedUsers = new List<User>();

mock.Setup(x => x.Save(It.IsAny<User>()))
    .Callback<User>(user => capturedUsers.Add(user))
    .Returns(true);
```

### 参数匹配器（It 类）

`It` 类提供强大的参数匹配功能：

```csharp
It.IsAny<T>()           // 匹配任意值
It.Is<T>(predicate)     // 匹配满足条件的值
It.IsIn<T>(values)      // 匹配指定集合中的值
It.IsNotIn<T>(values)   // 匹配不在集合中的值
It.IsInRange<T>(from, to, rangeKind)  // 匹配范围内的值
It.IsRegex(pattern)     // 字符串正则匹配
```

## 代码示例

### 安装 Moq

通过 NuGet 安装：

```bash
dotnet add package Moq
```

### 基础示例：用户服务测试

假设我们有以下接口和类需要测试：

```csharp
// 用户实体
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
}

// 用户仓储接口
public interface IUserRepository
{
    User GetById(int id);
    IEnumerable<User> GetAll();
    void Add(User user);
    void Update(User user);
    void Delete(int id);
    bool Exists(int id);
}

// 邮件服务接口
public interface IEmailService
{
    void SendWelcomeEmail(string email, string name);
    Task SendEmailAsync(string to, string subject, string body);
}

// 用户服务（被测试类）
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
            throw new InvalidOperationException("用户已存在");
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
            throw new KeyNotFoundException("用户不存在");
        }

        user.IsActive = false;
        _repository.Update(user);
    }
}
```

### 编写单元测试

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
        // 创建 Mock 对象
        _mockRepository = new Mock<IUserRepository>();
        _mockEmailService = new Mock<IEmailService>();

        // 创建被测试对象，注入 Mock
        _userService = new UserService(
            _mockRepository.Object,
            _mockEmailService.Object
        );
    }

    [Fact]
    public void GetUser_WithValidId_ReturnsUser()
    {
        // Arrange - 配置 Mock 行为
        var expectedUser = new User { Id = 1, Name = "张三", Email = "zhangsan@test.com" };
        _mockRepository.Setup(r => r.GetById(1)).Returns(expectedUser);

        // Act - 执行被测方法
        var result = _userService.GetUser(1);

        // Assert - 验证结果
        Assert.NotNull(result);
        Assert.Equal("张三", result.Name);
        Assert.Equal("zhangsan@test.com", result.Email);

        // 验证仓储方法被调用
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
        var newUser = new User { Id = 1, Name = "李四", Email = "lisi@test.com" };
        _mockRepository.Setup(r => r.Exists(1)).Returns(false);

        // Act
        _userService.RegisterUser(newUser);

        // Assert
        Assert.True(newUser.IsActive);

        // 验证仓储的 Add 方法被调用
        _mockRepository.Verify(r => r.Add(It.Is<User>(u =>
            u.Id == 1 &&
            u.Name == "李四" &&
            u.IsActive == true
        )), Times.Once);

        // 验证邮件服务被调用
        _mockEmailService.Verify(e => e.SendWelcomeEmail(
            "lisi@test.com",
            "李四"
        ), Times.Once);
    }

    [Fact]
    public void RegisterUser_WithExistingUser_ThrowsException()
    {
        // Arrange
        var existingUser = new User { Id = 1, Name = "王五" };
        _mockRepository.Setup(r => r.Exists(1)).Returns(true);

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(
            () => _userService.RegisterUser(existingUser)
        );

        Assert.Equal("用户已存在", exception.Message);

        // 验证不应调用添加方法
        _mockRepository.Verify(r => r.Add(It.IsAny<User>()), Times.Never);

        // 验证不应发送邮件
        _mockEmailService.Verify(
            e => e.SendWelcomeEmail(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Fact]
    public void DeactivateUser_WithValidUser_UpdatesUser()
    {
        // Arrange
        var user = new User { Id = 1, Name = "赵六", IsActive = true };
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

### Callback 高级用法

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
        service.RegisterUser(new User { Id = 1, Name = "用户1" });
        service.RegisterUser(new User { Id = 2, Name = "用户2" });

        // Assert
        Assert.Equal(2, capturedUsers.Count);
        Assert.Equal("用户1", capturedUsers[0].Name);
        Assert.Equal("用户2", capturedUsers[1].Name);
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
        mock.Object.SendEmailAsync("test@example.com", "测试标题", "测试内容");

        // Assert
        Assert.Equal("test@example.com", capturedTo);
        Assert.Equal("测试标题", capturedSubject);
        Assert.Equal("测试内容", capturedBody);
    }
}
```

### 序列返回值（SetupSequence）

```csharp
[Fact]
public void SetupSequence_ReturnsDifferentValuesOnEachCall()
{
    // Arrange
    var mock = new Mock<IUserRepository>();

    mock.SetupSequence(r => r.GetById(1))
        .Returns(new User { Id = 1, Name = "第一次调用" })
        .Returns(new User { Id = 1, Name = "第二次调用" })
        .Returns(new User { Id = 1, Name = "第三次调用" })
        .Throws<InvalidOperationException>();  // 第四次抛异常

    // Act & Assert
    Assert.Equal("第一次调用", mock.Object.GetById(1).Name);
    Assert.Equal("第二次调用", mock.Object.GetById(1).Name);
    Assert.Equal("第三次调用", mock.Object.GetById(1).Name);
    Assert.Throws<InvalidOperationException>(() => mock.Object.GetById(1));
}
```

### 属性模拟

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

    // 设置只读属性
    mock.Setup(c => c.MaxRetries).Returns(3);

    // 设置可读写属性（自动跟踪值变化）
    mock.SetupProperty(c => c.ConnectionString);
    mock.SetupProperty(c => c.IsDebugMode, true);  // 带初始值

    var config = mock.Object;

    // 测试只读属性
    Assert.Equal(3, config.MaxRetries);

    // 测试可读写属性
    config.ConnectionString = "Server=localhost;Database=test";
    Assert.Equal("Server=localhost;Database=test", config.ConnectionString);

    Assert.True(config.IsDebugMode);
    config.IsDebugMode = false;
    Assert.False(config.IsDebugMode);

    // 设置所有属性自动跟踪
    var mock2 = new Mock<IConfiguration>();
    mock2.SetupAllProperties();
}
```

### 异步方法模拟

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

    // 使用 ReturnsAsync
    mock.Setup(r => r.GetByIdAsync(1))
        .ReturnsAsync(new User { Id = 1, Name = "异步用户" });

    // 使用 ReturnsAsync 带延迟
    mock.Setup(r => r.GetAllAsync())
        .ReturnsAsync(new List<User>
        {
            new User { Id = 1, Name = "用户1" },
            new User { Id = 2, Name = "用户2" }
        });

    // 异步抛出异常
    mock.Setup(r => r.GetByIdAsync(-1))
        .ThrowsAsync(new ArgumentException("无效的 ID"));

    // ValueTask 支持
    mock.Setup(r => r.GetByIdValueTaskAsync(1))
        .ReturnsAsync(new User { Id = 1, Name = "ValueTask用户" });

    // Act
    var user = await mock.Object.GetByIdAsync(1);
    var users = await mock.Object.GetAllAsync();

    // Assert
    Assert.Equal("异步用户", user.Name);
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

### MockBehavior.Strict 示例

```csharp
[Fact]
public void StrictMock_ThrowsOnUnexpectedCall()
{
    // Arrange
    var strictMock = new Mock<IUserRepository>(MockBehavior.Strict);

    // 只配置 GetById 方法
    strictMock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });

    // Act & Assert
    // 配置过的方法正常工作
    var user = strictMock.Object.GetById(1);
    Assert.NotNull(user);

    // 未配置的方法抛出异常
    Assert.Throws<MockException>(() => strictMock.Object.GetById(2));
    Assert.Throws<MockException>(() => strictMock.Object.GetAll());
}

[Fact]
public void StrictMock_MustSetupAllUsedMethods()
{
    // Arrange
    var strictMock = new Mock<IUserRepository>(MockBehavior.Strict);
    var emailMock = new Mock<IEmailService>(MockBehavior.Strict);

    // 配置所有会被调用的方法
    strictMock.Setup(r => r.Exists(It.IsAny<int>())).Returns(false);
    strictMock.Setup(r => r.Add(It.IsAny<User>()));
    emailMock.Setup(e => e.SendWelcomeEmail(It.IsAny<string>(), It.IsAny<string>()));

    var service = new UserService(strictMock.Object, emailMock.Object);

    // Act - 不会抛异常，因为所有方法都已配置
    service.RegisterUser(new User { Id = 1, Name = "测试", Email = "test@test.com" });

    // Assert
    strictMock.Verify(r => r.Add(It.IsAny<User>()), Times.Once);
}
```

### Protected 方法模拟

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

    // 模拟 protected abstract 方法
    mock.Protected()
        .Setup<string>("ValidateInput", ItExpr.IsAny<string>())
        .Returns("已验证");

    // 模拟 protected virtual 方法
    mock.Protected()
        .Setup<string>("FormatOutput", ItExpr.IsAny<string>())
        .Returns<string>(s => $"<{s}>");

    // Act
    var result = mock.Object.Process("测试输入");

    // Assert
    Assert.Equal("<已验证>", result);

    // 验证 protected 方法被调用
    mock.Protected()
        .Verify("ValidateInput", Times.Once(), ItExpr.IsAny<string>());
}
```

### 泛型方法模拟

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

    // 配置泛型方法
    mock.Setup(r => r.GetById<User>(1))
        .Returns(new User { Id = 1, Name = "泛型用户" });

    mock.Setup(r => r.GetById<User>(It.IsAny<int>()))
        .Returns<int>(id => new User { Id = id, Name = $"用户{id}" });

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
    Assert.Equal("泛型用户", user1.Name);  // 精确匹配优先
    Assert.Equal("用户5", user5.Name);
    Assert.Equal(2, allUsers.Count());
}
```

## 最佳实践

### 使用接口进行依赖注入

```csharp
// 推荐：依赖接口
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

// 不推荐：依赖具体类（难以模拟）
public class OrderService
{
    private readonly OrderRepository _repository = new OrderRepository();
}
```

### 遵循 AAA 模式

```csharp
[Fact]
public void MethodName_Scenario_ExpectedBehavior()
{
    // Arrange - 准备测试数据和 Mock
    var mock = new Mock<IUserRepository>();
    mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });
    var service = new UserService(mock.Object);

    // Act - 执行被测方法
    var result = service.GetUser(1);

    // Assert - 验证结果
    Assert.NotNull(result);
    Assert.Equal(1, result.Id);
}
```

### 使用 MockRepository 统一管理

```csharp
public class OrderServiceTests
{
    private readonly MockRepository _mockRepository;
    private readonly Mock<IOrderRepository> _orderRepoMock;
    private readonly Mock<IPaymentService> _paymentMock;
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        // 使用 MockRepository 统一管理所有 Mock
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

        // 验证所有 Mock 的预期调用
        _mockRepository.VerifyAll();
    }
}
```

### 避免过度模拟

```csharp
// 不好：模拟简单的值对象
var mockUser = new Mock<User>();
mockUser.Setup(u => u.Name).Returns("张三");

// 好：直接使用真实对象
var user = new User { Name = "张三" };

// 只模拟真正需要隔离的依赖（如数据库、外部服务）
```

### 使用 VerifyNoOtherCalls

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
    mock.VerifyNoOtherCalls();  // 确保没有其他方法被调用
}
```

### 使用 Mock.Of<T> 快速创建简单 Mock

```csharp
// 传统方式
var mock = new Mock<IUserRepository>();
mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1, Name = "张三" });
var repository = mock.Object;

// 简洁方式（适合简单场景）
var repository = Mock.Of<IUserRepository>(r =>
    r.GetById(1) == new User { Id = 1, Name = "张三" } &&
    r.Exists(1) == true
);
```

## 常见陷阱

### 忘记调用 .Object

```csharp
// 错误：传递 Mock 对象而非模拟对象
var mock = new Mock<IUserRepository>();
var service = new UserService(mock);  // 编译错误或运行时错误

// 正确：使用 .Object 获取模拟对象
var service = new UserService(mock.Object);
```

### 参数匹配不精确

```csharp
// 问题：Setup 和 Verify 使用不同的参数
mock.Setup(r => r.GetById(1)).Returns(new User());
mock.Verify(r => r.GetById(It.IsAny<int>()), Times.Once);  // 可能误匹配

// 建议：保持一致或明确意图
mock.Setup(r => r.GetById(1)).Returns(new User());
mock.Verify(r => r.GetById(1), Times.Once);  // 精确匹配
```

### 异步方法未正确配置

```csharp
// 错误：Returns 返回 null Task
mock.Setup(r => r.GetUserAsync(1)).Returns(null);  // NullReferenceException

// 错误：使用 Returns 而非 ReturnsAsync
mock.Setup(r => r.GetUserAsync(1)).Returns(new User());  // 编译错误

// 正确：使用 ReturnsAsync
mock.Setup(r => r.GetUserAsync(1)).ReturnsAsync(new User { Id = 1 });

// 或使用 Task.FromResult
mock.Setup(r => r.GetUserAsync(1)).Returns(Task.FromResult(new User { Id = 1 }));
```

### 泛型方法参数类型不匹配

```csharp
// 问题：泛型参数类型可能导致 Setup 不匹配
mock.Setup(r => r.GetById<User>(1)).Returns(new User());
mock.Object.GetById<Admin>(1);  // 返回 null，因为类型不匹配

// 解决：分别配置每种类型
mock.Setup(r => r.GetById<User>(It.IsAny<int>())).Returns(new User());
mock.Setup(r => r.GetById<Admin>(It.IsAny<int>())).Returns(new Admin());
```

### Callback 中抛出异常影响测试

```csharp
// 问题：Callback 中的异常可能被忽略或导致误导
mock.Setup(r => r.Save(It.IsAny<User>()))
    .Callback<User>(u =>
    {
        if (u == null) throw new ArgumentNullException();
    })
    .Returns(true);

// 建议：在 Callback 中记录而非验证
var savedUser = (User)null;
mock.Setup(r => r.Save(It.IsAny<User>()))
    .Callback<User>(u => savedUser = u)
    .Returns(true);

// 在 Assert 阶段验证
Assert.NotNull(savedUser);
```

### 验证顺序依赖

```csharp
// Moq 不直接支持验证调用顺序
// 如需验证顺序，使用 Callback 记录

var callOrder = new List<string>();

mock.Setup(r => r.BeginTransaction())
    .Callback(() => callOrder.Add("BeginTransaction"));
mock.Setup(r => r.Commit())
    .Callback(() => callOrder.Add("Commit"));

// 执行测试后验证顺序
Assert.Equal(new[] { "BeginTransaction", "Commit" }, callOrder);
```

## 性能考量

### Mock 对象创建开销

Mock 对象在运行时通过动态代理创建，有一定性能开销：

```csharp
// 在测试类构造函数中创建 Mock（推荐）
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mock;

    public UserServiceTests()
    {
        _mock = new Mock<IUserRepository>();  // 每个测试类实例创建一次
    }
}

// 避免在每个测试方法中重复创建相同配置的 Mock
[Fact]
public void Test1()
{
    var mock = new Mock<IUserRepository>();  // 避免
    // ...
}
```

### 避免过多的 Setup

```csharp
// 不好：配置过多不需要的方法
mock.Setup(r => r.GetById(It.IsAny<int>())).Returns(new User());
mock.Setup(r => r.GetAll()).Returns(new List<User>());
mock.Setup(r => r.Count()).Returns(10);
mock.Setup(r => r.Exists(It.IsAny<int>())).Returns(true);
// 实际只用到 GetById

// 好：只配置测试需要的方法
mock.Setup(r => r.GetById(1)).Returns(new User { Id = 1 });
```

### 使用 Loose Mock 除非必要

```csharp
// Strict Mock 有额外的验证开销
var strictMock = new Mock<IService>(MockBehavior.Strict);

// 大多数情况使用默认的 Loose Mock
var looseMock = new Mock<IService>();  // MockBehavior.Loose
```

### 批量测试数据

```csharp
// 使用 Theory 和 InlineData 减少重复代码
[Theory]
[InlineData(1, "张三")]
[InlineData(2, "李四")]
[InlineData(3, "王五")]
public void GetUser_ReturnsCorrectUser(int id, string expectedName)
{
    _mock.Setup(r => r.GetById(id)).Returns(new User { Id = id, Name = expectedName });

    var result = _service.GetUser(id);

    Assert.Equal(expectedName, result.Name);
}
```

## 实战场景

### 场景一：测试带有外部服务依赖的业务逻辑

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
            _logger.LogWarning("订单 {OrderId} 不存在", orderId);
            return false;
        }

        if (order.IsPaid)
        {
            _logger.LogWarning("订单 {OrderId} 已支付", orderId);
            return false;
        }

        var request = new PaymentRequest
        {
            OrderId = orderId,
            Amount = order.TotalAmount,
            Currency = "CNY"
        };

        var result = await _gateway.ProcessPaymentAsync(request);

        if (result.Success)
        {
            order.IsPaid = true;
            order.TransactionId = result.TransactionId;
            await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("订单 {OrderId} 支付成功", orderId);
            return true;
        }

        _logger.LogError("订单 {OrderId} 支付失败: {Error}", orderId, result.ErrorMessage);
        return false;
    }
}

// 测试
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
            r.OrderId == 1 && r.Amount == 199.99m && r.Currency == "CNY")))
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
                ErrorMessage = "余额不足"
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

### 场景二：测试重试逻辑

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
                await Task.Delay(100 * attempt);  // 简单退避
            }
        }

        throw new Exception($"在 {_maxRetries} 次重试后仍失败");
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
            return Task.FromResult("成功");
        });

    var service = new ResilientService(mock.Object, maxRetries: 3);

    // Act
    var result = await service.GetDataWithRetryAsync("key");

    // Assert
    Assert.Equal("成功", result);
    Assert.Equal(3, callCount);
    mock.Verify(a => a.FetchAsync("key"), Times.Exactly(3));
}
```

### 场景三：测试事件发布

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

## 面试要点

### 常见面试问题

**1. Moq 是什么？为什么要使用它？**

Moq 是 .NET 平台上的模拟框架，用于在单元测试中创建假对象（Mock）来替代真实依赖。使用 Moq 可以：
- 隔离被测代码，确保测试独立性
- 控制依赖项的行为和返回值
- 验证代码与依赖项的交互

**2. Mock、Stub、Fake 的区别是什么？**

- **Stub**：提供预设返回值，不验证调用
- **Mock**：可验证调用的 Stub，关注行为验证
- **Fake**：具有简化实现的工作版本

**3. Setup 和 Verify 的区别？**

- **Setup**：配置 Mock 对象的行为（方法返回值、异常等）
- **Verify**：验证方法是否被调用及调用次数

```csharp
mock.Setup(x => x.Method()).Returns(value);  // 配置行为
mock.Verify(x => x.Method(), Times.Once);    // 验证调用
```

**4. MockBehavior.Strict 和 MockBehavior.Loose 的区别？**

- **Loose**（默认）：未配置的方法返回默认值
- **Strict**：未配置的方法抛出异常，要求显式配置所有调用

**5. 如何验证方法被调用的次数？**

```csharp
mock.Verify(x => x.Method(), Times.Once);
mock.Verify(x => x.Method(), Times.Exactly(3));
mock.Verify(x => x.Method(), Times.AtLeast(2));
mock.Verify(x => x.Method(), Times.Never);
```

**6. 如何模拟异步方法？**

```csharp
mock.Setup(x => x.GetAsync(1)).ReturnsAsync(new User());
mock.Setup(x => x.SaveAsync()).ThrowsAsync(new Exception());
```

**7. It.IsAny<T>() 和具体值匹配有什么区别？**

- `It.IsAny<T>()`：匹配任意值，更灵活
- 具体值：精确匹配，测试更严格

**8. Callback 的作用是什么？**

Callback 允许在方法调用时执行自定义逻辑，常用于：
- 捕获方法参数
- 记录调用顺序
- 执行副作用

**9. 为什么只能模拟接口和虚方法？**

Moq 使用动态代理技术，必须能够重写方法才能拦截调用。只有接口方法和虚方法可以被重写。

**10. 如何避免过度模拟？**

- 只模拟真正需要隔离的外部依赖
- 对于简单的值对象使用真实实例
- 考虑使用集成测试覆盖某些场景

## 延伸阅读

### 官方资源

- [Moq GitHub 仓库](https://github.com/moq/moq4)
- [Moq 快速入门](https://github.com/moq/moq4/wiki/Quickstart)
- [Moq API 文档](https://moq.github.io/moq4/)

### 相关工具

- **xUnit**：流行的 .NET 测试框架
- **NUnit**：另一个广泛使用的测试框架
- **FluentAssertions**：提供流畅的断言 API
- **AutoFixture**：自动生成测试数据
- **Bogus**：生成假数据的库

### 替代方案

- **NSubstitute**：语法更简洁的模拟框架
- **FakeItEasy**：另一个流行的模拟框架
- **JustMock**：Telerik 提供的商业模拟框架

### 进阶主题

- 测试驱动开发（TDD）
- 行为驱动开发（BDD）
- 集成测试与端到端测试
- 测试金字塔策略
- 依赖注入与控制反转

### 推荐书籍

- 《The Art of Unit Testing》- Roy Osherove
- 《xUnit Test Patterns》- Gerard Meszaros
- 《Growing Object-Oriented Software, Guided by Tests》- Steve Freeman & Nat Pryce

## 总结

Moq 是 .NET 生态系统中最强大、最灵活的模拟框架之一。通过本文的学习，你应该能够：

1. 理解 Mock 的概念和 Moq 的工作原理
2. 使用 Mock<T> 创建模拟对象
3. 熟练使用 Setup、Returns、Verify、Callback 配置和验证行为
4. 掌握参数匹配器和高级模拟技巧
5. 避免常见的陷阱和性能问题
6. 在实际项目中应用最佳实践

记住，单元测试的目标是验证代码的正确性，而 Moq 是实现这一目标的有力工具。合理使用模拟可以让你的测试更加稳定、快速且易于维护。
