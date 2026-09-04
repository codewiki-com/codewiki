---
title: C# 依赖注入
description: 深入理解 .NET 依赖注入机制，包括 IServiceCollection、服务生命周期、构造函数注入和 IOptions 模式
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - 依赖注入
  - DI
  - IoC
  - .NET
  - ASP.NET Core
status: imported
origin: old/src/content/docs/csharp/dependency-injection.zh.md
divergence: 0.212
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 依赖注入
  order: 14
  lastUpdated: 2026-01-07
---

## 概念解释

依赖注入（Dependency Injection，简称 DI）是一种设计模式，用于实现控制反转（Inversion of Control，IoC）原则。它的核心思想是：不在类内部创建依赖对象，而是通过外部传入依赖，从而降低类之间的耦合度。

### 什么是依赖？

在面向对象编程中，当一个类 A 需要使用另一个类 B 的功能时，我们称 A 依赖于 B。

```csharp
// 传统方式：硬编码依赖
public class OrderService
{
    private readonly SqlOrderRepository _repository;
    private readonly SmtpEmailService _emailService;

    public OrderService()
    {
        // 在构造函数中直接创建依赖
        _repository = new SqlOrderRepository();
        _emailService = new SmtpEmailService();
    }

    public void CreateOrder(Order order)
    {
        _repository.Save(order);
        _emailService.Send($"订单 {order.Id} 已创建");
    }
}
```

这种方式存在以下问题：

1. **紧耦合**：OrderService 直接依赖于具体实现类
2. **难以测试**：无法用 Mock 对象替换真实依赖
3. **灵活性差**：更换实现需要修改 OrderService 的代码
4. **违反开闭原则**：对修改开放，对扩展封闭

### 依赖注入的解决方案

```csharp
// 定义抽象接口
public interface IOrderRepository
{
    void Save(Order order);
    Order? GetById(int id);
}

public interface IEmailService
{
    void Send(string message);
}

// 依赖注入方式
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailService _emailService;

    // 通过构造函数注入依赖
    public OrderService(IOrderRepository repository, IEmailService emailService)
    {
        _repository = repository;
        _emailService = emailService;
    }

    public void CreateOrder(Order order)
    {
        _repository.Save(order);
        _emailService.Send($"订单 {order.Id} 已创建");
    }
}
```

### 依赖注入的优势

| 优势 | 说明 |
|------|------|
| 松耦合 | 类只依赖抽象接口，不依赖具体实现 |
| 可测试性 | 可以轻松注入 Mock 对象进行单元测试 |
| 可维护性 | 更换实现只需修改注册代码，无需修改业务逻辑 |
| 可扩展性 | 新增实现只需实现接口并注册 |
| 关注点分离 | 对象的创建和使用分离 |

### .NET 内置依赖注入容器

.NET Core 及以后版本内置了轻量级的依赖注入容器，是 ASP.NET Core 应用的核心基础设施。它提供：

- **IServiceCollection**：服务注册接口
- **IServiceProvider**：服务解析接口
- **三种生命周期**：Transient、Scoped、Singleton

## 核心原理

### IoC 容器的工作原理

IoC 容器是依赖注入的核心，负责：

1. **服务注册**：建立抽象类型到具体类型的映射关系
2. **服务解析**：根据请求类型创建并返回实例
3. **生命周期管理**：控制对象的创建和销毁时机
4. **依赖图构建**：自动解析对象的依赖链

```
注册阶段                    解析阶段
┌─────────────────┐        ┌─────────────────┐
│ IServiceCollection │ ──→ │ IServiceProvider │
│  - 服务描述列表    │        │  - BuildServiceProvider()  │
│  - 接口→实现映射   │        │  - GetService<T>()        │
│  - 生命周期配置    │        │  - GetRequiredService<T>()│
└─────────────────┘        └─────────────────┘
```

### ServiceDescriptor 服务描述符

ServiceDescriptor 是服务注册的核心数据结构：

```csharp
public class ServiceDescriptor
{
    // 服务类型（通常是接口）
    public Type ServiceType { get; }

    // 实现类型
    public Type? ImplementationType { get; }

    // 实现实例（用于单例）
    public object? ImplementationInstance { get; }

    // 实现工厂
    public Func<IServiceProvider, object>? ImplementationFactory { get; }

    // 生命周期
    public ServiceLifetime Lifetime { get; }
}
```

### 依赖解析过程

当容器解析一个服务时，会执行以下步骤：

```csharp
// 假设注册了以下服务
services.AddScoped<IOrderService, OrderService>();
services.AddScoped<IOrderRepository, SqlOrderRepository>();
services.AddScoped<IEmailService, SmtpEmailService>();

// OrderService 构造函数
public OrderService(IOrderRepository repository, IEmailService emailService)
```

解析 `IOrderService` 时：

1. 查找 `IOrderService` 的注册信息
2. 发现实现类型是 `OrderService`
3. 检查 `OrderService` 的构造函数参数
4. 递归解析 `IOrderRepository` 和 `IEmailService`
5. 创建 `SqlOrderRepository` 和 `SmtpEmailService` 实例
6. 调用 `OrderService` 构造函数，传入依赖
7. 返回 `OrderService` 实例

### 循环依赖检测

容器会检测并抛出循环依赖异常：

```csharp
// 循环依赖示例
public class ServiceA
{
    public ServiceA(ServiceB b) { }
}

public class ServiceB
{
    public ServiceB(ServiceA a) { }  // 循环！
}

// 解析时会抛出 InvalidOperationException
// "A circular dependency was detected for the service of type 'ServiceA'"
```

## 核心要点

### IServiceCollection 服务注册

IServiceCollection 是一个服务描述符的集合，提供多种注册方式：

#### 基本注册方法

```csharp
var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;

// 1. 泛型方法注册（推荐）
services.AddTransient<IEmailService, SmtpEmailService>();
services.AddScoped<IOrderService, OrderService>();
services.AddSingleton<ICacheService, MemoryCacheService>();

// 2. 非泛型方法注册
services.AddTransient(typeof(ILogger<>), typeof(Logger<>));

// 3. 注册具体类型（自己注册自己）
services.AddScoped<OrderService>();

// 4. 注册实例
var settings = new AppSettings { MaxRetries = 3 };
services.AddSingleton(settings);
services.AddSingleton<IAppSettings>(settings);
```

#### 工厂方法注册

```csharp
// 使用工厂方法进行复杂初始化
services.AddScoped<IOrderService>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<OrderService>>();
    var repository = provider.GetRequiredService<IOrderRepository>();

    var apiKey = config["OrderApi:Key"];
    return new OrderService(repository, logger, apiKey);
});

// 条件注册
services.AddScoped<IPaymentService>(provider =>
{
    var env = provider.GetRequiredService<IHostEnvironment>();
    if (env.IsDevelopment())
    {
        return new MockPaymentService();
    }
    return new StripePaymentService(
        provider.GetRequiredService<IConfiguration>());
});
```

#### TryAdd 方法

TryAdd 方法只在服务未注册时才添加：

```csharp
// 如果 IEmailService 已注册，则跳过
services.TryAddTransient<IEmailService, SmtpEmailService>();
services.TryAddScoped<IOrderService, OrderService>();
services.TryAddSingleton<ICacheService, MemoryCacheService>();

// TryAddEnumerable：避免重复添加相同的实现
services.TryAddEnumerable(
    ServiceDescriptor.Transient<IValidator, EmailValidator>());
services.TryAddEnumerable(
    ServiceDescriptor.Transient<IValidator, PhoneValidator>());
```

#### Replace 和 RemoveAll

```csharp
// 替换已注册的服务
services.Replace(
    ServiceDescriptor.Scoped<IOrderService, NewOrderService>());

// 移除所有指定类型的注册
services.RemoveAll<IEmailService>();
services.RemoveAll(typeof(ILogger<>));
```

### 服务生命周期

.NET DI 容器支持三种生命周期，选择正确的生命周期至关重要：

#### Transient（瞬时）

每次请求服务时都创建新实例：

```csharp
services.AddTransient<IEmailService, SmtpEmailService>();

// 每次 GetService 都是新实例
var service1 = provider.GetService<IEmailService>();
var service2 = provider.GetService<IEmailService>();
// service1 != service2
```

**适用场景**：
- 轻量级、无状态的服务
- 每次使用都需要全新状态的服务
- 包含随机或时间相关逻辑的服务

```csharp
// 适合 Transient 的服务示例
public class GuidGenerator : IGuidGenerator
{
    public Guid NewGuid() => Guid.NewGuid();
}

public class EmailSender : IEmailSender
{
    // 每次发送邮件都是独立操作
    public Task SendAsync(Email email) { ... }
}
```

#### Scoped（作用域）

在同一作用域内共享实例，不同作用域创建新实例：

```csharp
services.AddScoped<IOrderService, OrderService>();

// 在 ASP.NET Core 中，每个 HTTP 请求是一个作用域
// 同一请求内获取的是同一实例
```

**适用场景**：
- 数据库上下文（DbContext）
- 单位工作（Unit of Work）
- 请求级别的状态管理

```csharp
// 适合 Scoped 的服务示例
public class ApplicationDbContext : DbContext
{
    // 同一请求内共享数据库连接和事务
}

public class CurrentUserService : ICurrentUserService
{
    // 同一请求内用户信息不变
    public string UserId { get; set; }
}

services.AddScoped<ApplicationDbContext>();
services.AddScoped<ICurrentUserService, CurrentUserService>();
```

#### Singleton（单例）

整个应用生命周期只创建一个实例：

```csharp
services.AddSingleton<ICacheService, MemoryCacheService>();

// 所有地方获取的都是同一实例
var service1 = provider.GetService<ICacheService>();
var service2 = provider.GetService<ICacheService>();
// service1 == service2
```

**适用场景**：
- 缓存服务
- 配置服务
- 日志服务
- 线程安全的共享资源

```csharp
// 适合 Singleton 的服务示例
public class MemoryCacheService : ICacheService
{
    private readonly ConcurrentDictionary<string, object> _cache = new();

    public void Set<T>(string key, T value) => _cache[key] = value!;
    public T? Get<T>(string key) => _cache.TryGetValue(key, out var val) ? (T)val : default;
}

public class ApplicationConfiguration : IApplicationConfiguration
{
    // 配置在应用启动时加载，之后不变
    public string ApiKey { get; init; }
    public int MaxRetries { get; init; }
}
```

#### 生命周期对比表

| 生命周期 | 实例创建时机 | 实例销毁时机 | 线程安全要求 |
|---------|------------|------------|------------|
| Transient | 每次请求服务 | 作用域结束或 GC 回收 | 无特殊要求 |
| Scoped | 作用域首次请求 | 作用域结束 | 作用域内单线程 |
| Singleton | 首次请求或启动时 | 应用关闭 | 必须线程安全 |

#### 生命周期陷阱：Captive Dependency

当长生命周期服务依赖短生命周期服务时，会产生"俘获依赖"问题：

```csharp
// 错误示例：Singleton 依赖 Scoped
public class CacheService : ICacheService  // Singleton
{
    private readonly IOrderService _orderService;  // Scoped

    public CacheService(IOrderService orderService)
    {
        // 这个 Scoped 服务会被 Singleton "俘获"
        // 导致它实际上也变成了 Singleton
        _orderService = orderService;
    }
}
```

**解决方案**：

```csharp
// 方案1：使用 IServiceScopeFactory
public class CacheService : ICacheService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public CacheService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task RefreshCacheAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();
        // 使用 orderService...
    }
}

// 方案2：注入 IServiceProvider
public class CacheService : ICacheService
{
    private readonly IServiceProvider _serviceProvider;

    public CacheService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void DoWork()
    {
        using var scope = _serviceProvider.CreateScope();
        var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();
        // 使用 orderService...
    }
}
```

### 构造函数注入

构造函数注入是最常用和推荐的注入方式：

#### 基本用法

```csharp
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrderController> _logger;
    private readonly IMapper _mapper;

    // 构造函数注入
    public OrderController(
        IOrderService orderService,
        ILogger<OrderController> logger,
        IMapper mapper)
    {
        _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        _logger.LogInformation("获取订单 {OrderId}", id);
        var order = await _orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(_mapper.Map<OrderDto>(order));
    }
}
```

#### Primary Constructor（C# 12+）

C# 12 引入了主构造函数，简化了依赖注入的写法：

```csharp
// 传统写法
public class OrderService : IOrderService
{
    private readonly IOrderRepository _repository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository repository, ILogger<OrderService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        _logger.LogInformation("查询订单 {OrderId}", id);
        return await _repository.GetByIdAsync(id);
    }
}

// C# 12 主构造函数写法
public class OrderService(
    IOrderRepository repository,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Order?> GetByIdAsync(int id)
    {
        logger.LogInformation("查询订单 {OrderId}", id);
        return await repository.GetByIdAsync(id);
    }
}
```

#### 构造函数选择规则

当类有多个构造函数时，容器按以下规则选择：

```csharp
public class MyService
{
    // 容器会选择参数最多且所有参数都能解析的构造函数
    public MyService() { }  // 构造函数1

    public MyService(ILogger logger) { }  // 构造函数2

    public MyService(ILogger logger, IConfiguration config) { }  // 构造函数3 ✓
}
```

使用 `[ActivatorUtilitiesConstructor]` 指定首选构造函数：

```csharp
public class MyService
{
    public MyService(ILogger logger, IConfiguration config) { }

    [ActivatorUtilitiesConstructor]  // 强制使用此构造函数
    public MyService(ILogger logger) { }
}
```

### 其他注入方式

#### 属性注入（不推荐）

.NET 内置容器不支持属性注入，但第三方容器（如 Autofac）支持：

```csharp
// Autofac 属性注入示例
public class OrderService
{
    // 属性注入
    public ILogger<OrderService> Logger { get; set; }
}

// 配置 Autofac 启用属性注入
builder.RegisterType<OrderService>()
    .PropertiesAutowired();
```

#### 方法注入

使用 `[FromServices]` 在 Action 方法中注入：

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(
        int id,
        [FromServices] IOrderService orderService,  // 方法注入
        [FromServices] ILogger<OrderController> logger)
    {
        logger.LogInformation("获取订单 {OrderId}", id);
        var order = await orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }
}
```

### IOptions 模式

IOptions 模式用于将配置绑定到强类型对象：

#### 配置类定义

```csharp
// appsettings.json
{
    "EmailSettings": {
        "SmtpServer": "smtp.example.com",
        "Port": 587,
        "UseSsl": true,
        "SenderName": "系统通知",
        "SenderEmail": "noreply@example.com",
        "MaxRetries": 3
    },
    "JwtSettings": {
        "Secret": "your-secret-key-at-least-32-characters",
        "Issuer": "MyApp",
        "Audience": "MyAppUsers",
        "ExpirationMinutes": 60
    }
}

// 配置类
public class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string SmtpServer { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public int MaxRetries { get; set; } = 3;
}

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 60;
}
```

#### 注册 Options

```csharp
var builder = WebApplication.CreateBuilder(args);

// 方式1：Configure 方法
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));

// 方式2：AddOptions 方法（支持验证）
builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection(EmailSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// 方式3：手动配置
builder.Services.Configure<EmailSettings>(options =>
{
    options.SmtpServer = "smtp.example.com";
    options.Port = 587;
});

// 方式4：PostConfigure（在所有 Configure 之后执行）
builder.Services.PostConfigure<EmailSettings>(options =>
{
    // 添加默认值或后处理
    if (string.IsNullOrEmpty(options.SenderName))
    {
        options.SenderName = "Default Sender";
    }
});
```

#### Options 接口对比

| 接口 | 生命周期 | 热重载 | 使用场景 |
|-----|---------|--------|---------|
| IOptions<T> | Singleton | 不支持 | 配置不变的场景 |
| IOptionsSnapshot<T> | Scoped | 支持 | 每个请求需要最新配置 |
| IOptionsMonitor<T> | Singleton | 支持 | 需要监听配置变更 |

```csharp
// IOptions<T>：单例，配置在启动时读取，不会更新
public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;  // 只读取一次
    }
}

// IOptionsSnapshot<T>：作用域，每个请求重新读取配置
public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptionsSnapshot<EmailSettings> options)
    {
        _settings = options.Value;  // 每个请求都读取最新配置
    }
}

// IOptionsMonitor<T>：单例，支持配置变更通知
public class EmailService : IDisposable
{
    private readonly IOptionsMonitor<EmailSettings> _optionsMonitor;
    private readonly IDisposable? _changeToken;
    private EmailSettings _currentSettings;

    public EmailService(IOptionsMonitor<EmailSettings> optionsMonitor)
    {
        _optionsMonitor = optionsMonitor;
        _currentSettings = optionsMonitor.CurrentValue;

        // 监听配置变更
        _changeToken = _optionsMonitor.OnChange(settings =>
        {
            _currentSettings = settings;
            Console.WriteLine($"配置已更新: {settings.SmtpServer}");
        });
    }

    public void SendEmail(string to, string subject, string body)
    {
        // 使用 _currentSettings 或 _optionsMonitor.CurrentValue
    }

    public void Dispose()
    {
        _changeToken?.Dispose();
    }
}
```

#### 命名 Options

用于同一配置类型的多个实例：

```csharp
// appsettings.json
{
    "EmailProviders": {
        "Primary": {
            "SmtpServer": "smtp.primary.com",
            "Port": 587
        },
        "Backup": {
            "SmtpServer": "smtp.backup.com",
            "Port": 465
        }
    }
}

// 注册命名 Options
builder.Services.Configure<EmailSettings>("Primary",
    builder.Configuration.GetSection("EmailProviders:Primary"));
builder.Services.Configure<EmailSettings>("Backup",
    builder.Configuration.GetSection("EmailProviders:Backup"));

// 使用命名 Options
public class EmailService
{
    private readonly EmailSettings _primarySettings;
    private readonly EmailSettings _backupSettings;

    public EmailService(IOptionsSnapshot<EmailSettings> optionsSnapshot)
    {
        _primarySettings = optionsSnapshot.Get("Primary");
        _backupSettings = optionsSnapshot.Get("Backup");
    }
}
```

#### Options 验证

```csharp
using System.ComponentModel.DataAnnotations;

public class EmailSettings
{
    [Required(ErrorMessage = "SMTP 服务器地址必填")]
    public string SmtpServer { get; set; } = string.Empty;

    [Range(1, 65535, ErrorMessage = "端口必须在 1-65535 之间")]
    public int Port { get; set; }

    [Required, EmailAddress(ErrorMessage = "发送者邮箱格式不正确")]
    public string SenderEmail { get; set; } = string.Empty;

    [Range(1, 10, ErrorMessage = "重试次数必须在 1-10 之间")]
    public int MaxRetries { get; set; }
}

// 注册带验证的 Options
builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection("EmailSettings"))
    .ValidateDataAnnotations()
    .ValidateOnStart();  // 应用启动时验证

// 自定义验证逻辑
builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection("EmailSettings"))
    .Validate(settings =>
    {
        // 自定义验证逻辑
        if (settings.UseSsl && settings.Port == 25)
        {
            return false;
        }
        return true;
    }, "使用 SSL 时不能使用端口 25")
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.SmtpServer),
        "SMTP 服务器不能为空");

// 使用 IValidateOptions<T> 进行复杂验证
public class EmailSettingsValidator : IValidateOptions<EmailSettings>
{
    public ValidateOptionsResult Validate(string? name, EmailSettings options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.SmtpServer))
        {
            errors.Add("SMTP 服务器地址不能为空");
        }

        if (options.Port < 1 || options.Port > 65535)
        {
            errors.Add("端口必须在 1-65535 之间");
        }

        if (options.UseSsl && options.Port == 25)
        {
            errors.Add("使用 SSL 时不建议使用端口 25");
        }

        if (errors.Count > 0)
        {
            return ValidateOptionsResult.Fail(errors);
        }

        return ValidateOptionsResult.Success;
    }
}

builder.Services.AddSingleton<IValidateOptions<EmailSettings>, EmailSettingsValidator>();
```

## 代码示例

### 完整的服务注册示例

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// 添加框架服务
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 添加日志
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
});

// 配置 Options
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

// 注册数据库上下文
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 注册仓储
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// 注册业务服务
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IUserService, UserService>();

// 注册基础设施服务
builder.Services.AddTransient<IEmailService, SmtpEmailService>();
builder.Services.AddTransient<ISmsService, TwilioSmsService>();
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// 注册 HttpClient
builder.Services.AddHttpClient<IExternalApiService, ExternalApiService>(client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// 注册后台服务
builder.Services.AddHostedService<OrderProcessingService>();
builder.Services.AddHostedService<CacheRefreshService>();

var app = builder.Build();

// 配置中间件
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### 分层架构中的依赖注入

```csharp
// Domain Layer - 领域层（无依赖）
namespace MyApp.Domain.Entities
{
    public class Order
    {
        public int Id { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public OrderStatus Status { get; set; }
        public List<OrderItem> Items { get; set; } = new();
        public decimal TotalAmount => Items.Sum(i => i.Price * i.Quantity);
    }

    public class OrderItem
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }

    public enum OrderStatus
    {
        Pending,
        Confirmed,
        Shipped,
        Delivered,
        Cancelled
    }
}

// Domain Layer - 仓储接口
namespace MyApp.Domain.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(int id);
        Task<IEnumerable<Order>> GetByCustomerIdAsync(string customerId);
        Task<Order> AddAsync(Order order);
        Task UpdateAsync(Order order);
        Task DeleteAsync(int id);
    }

    public interface IUnitOfWork
    {
        IOrderRepository Orders { get; }
        Task<int> SaveChangesAsync();
    }
}

// Application Layer - 应用层
namespace MyApp.Application.Services
{
    public interface IOrderService
    {
        Task<OrderDto?> GetByIdAsync(int id);
        Task<IEnumerable<OrderDto>> GetByCustomerIdAsync(string customerId);
        Task<OrderDto> CreateOrderAsync(CreateOrderRequest request);
        Task UpdateOrderStatusAsync(int orderId, OrderStatus status);
        Task CancelOrderAsync(int orderId);
    }

    public class OrderService : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly ILogger<OrderService> _logger;
        private readonly IMapper _mapper;

        public OrderService(
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            ILogger<OrderService> logger,
            IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<OrderDto?> GetByIdAsync(int id)
        {
            var order = await _unitOfWork.Orders.GetByIdAsync(id);
            return order is null ? null : _mapper.Map<OrderDto>(order);
        }

        public async Task<IEnumerable<OrderDto>> GetByCustomerIdAsync(string customerId)
        {
            var orders = await _unitOfWork.Orders.GetByCustomerIdAsync(customerId);
            return _mapper.Map<IEnumerable<OrderDto>>(orders);
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request)
        {
            _logger.LogInformation("创建订单: CustomerId={CustomerId}", request.CustomerId);

            var order = new Order
            {
                CustomerId = request.CustomerId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                Items = request.Items.Select(i => new OrderItem
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Price = i.Price,
                    Quantity = i.Quantity
                }).ToList()
            };

            var createdOrder = await _unitOfWork.Orders.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            // 发送确认邮件
            await _emailService.SendAsync(
                request.CustomerEmail,
                "订单确认",
                $"您的订单 #{createdOrder.Id} 已创建，总金额：{createdOrder.TotalAmount:C}");

            _logger.LogInformation("订单创建成功: OrderId={OrderId}", createdOrder.Id);

            return _mapper.Map<OrderDto>(createdOrder);
        }

        public async Task UpdateOrderStatusAsync(int orderId, OrderStatus status)
        {
            var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
            if (order is null)
            {
                throw new NotFoundException($"订单 {orderId} 不存在");
            }

            order.Status = status;
            await _unitOfWork.Orders.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("订单状态更新: OrderId={OrderId}, Status={Status}",
                orderId, status);
        }

        public async Task CancelOrderAsync(int orderId)
        {
            await UpdateOrderStatusAsync(orderId, OrderStatus.Cancelled);
        }
    }
}

// Infrastructure Layer - 基础设施层
namespace MyApp.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasMany(e => e.Items)
                    .WithOne()
                    .HasForeignKey("OrderId");
            });
        }
    }

    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Order>> GetByCustomerIdAsync(string customerId)
        {
            return await _context.Orders
                .Include(o => o.Items)
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order> AddAsync(Order order)
        {
            var entry = await _context.Orders.AddAsync(order);
            return entry.Entity;
        }

        public async Task UpdateAsync(Order order)
        {
            _context.Orders.Update(order);
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(int id)
        {
            var order = await GetByIdAsync(id);
            if (order != null)
            {
                _context.Orders.Remove(order);
            }
        }
    }

    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IOrderRepository? _orders;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public IOrderRepository Orders =>
            _orders ??= new OrderRepository(_context);

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}

// Infrastructure Layer - 扩展方法
namespace MyApp.Infrastructure.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // 数据库
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection")));

            // 仓储和工作单元
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // 邮件服务
            services.Configure<EmailSettings>(
                configuration.GetSection("EmailSettings"));
            services.AddTransient<IEmailService, SmtpEmailService>();

            return services;
        }

        public static IServiceCollection AddApplication(
            this IServiceCollection services)
        {
            // AutoMapper
            services.AddAutoMapper(typeof(MappingProfile));

            // 应用服务
            services.AddScoped<IOrderService, OrderService>();

            return services;
        }
    }
}

// Program.cs 使用扩展方法
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();
// ...
```

### 注入多个实现

```csharp
// 定义通知服务接口
public interface INotificationService
{
    string Channel { get; }
    Task SendAsync(string userId, string message);
}

// 多个实现
public class EmailNotificationService : INotificationService
{
    public string Channel => "Email";

    public async Task SendAsync(string userId, string message)
    {
        // 发送邮件通知
        await Task.CompletedTask;
    }
}

public class SmsNotificationService : INotificationService
{
    public string Channel => "SMS";

    public async Task SendAsync(string userId, string message)
    {
        // 发送短信通知
        await Task.CompletedTask;
    }
}

public class PushNotificationService : INotificationService
{
    public string Channel => "Push";

    public async Task SendAsync(string userId, string message)
    {
        // 发送推送通知
        await Task.CompletedTask;
    }
}

// 注册所有实现
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services.AddScoped<INotificationService, SmsNotificationService>();
builder.Services.AddScoped<INotificationService, PushNotificationService>();

// 注入所有实现
public class NotificationManager
{
    private readonly IEnumerable<INotificationService> _notificationServices;
    private readonly ILogger<NotificationManager> _logger;

    public NotificationManager(
        IEnumerable<INotificationService> notificationServices,
        ILogger<NotificationManager> logger)
    {
        _notificationServices = notificationServices;
        _logger = logger;
    }

    // 发送到所有渠道
    public async Task NotifyAllAsync(string userId, string message)
    {
        var tasks = _notificationServices.Select(async service =>
        {
            try
            {
                await service.SendAsync(userId, message);
                _logger.LogInformation("通知已发送: Channel={Channel}, UserId={UserId}",
                    service.Channel, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "通知发送失败: Channel={Channel}", service.Channel);
            }
        });

        await Task.WhenAll(tasks);
    }

    // 发送到指定渠道
    public async Task NotifyAsync(string userId, string message, string channel)
    {
        var service = _notificationServices.FirstOrDefault(s => s.Channel == channel);
        if (service is null)
        {
            throw new ArgumentException($"未找到通知渠道: {channel}");
        }

        await service.SendAsync(userId, message);
    }
}

// .NET 8+ 键控服务
builder.Services.AddKeyedScoped<INotificationService, EmailNotificationService>("email");
builder.Services.AddKeyedScoped<INotificationService, SmsNotificationService>("sms");
builder.Services.AddKeyedScoped<INotificationService, PushNotificationService>("push");

// 使用键控服务
public class NotificationController : ControllerBase
{
    [HttpPost("email")]
    public async Task<IActionResult> SendEmail(
        [FromKeyedServices("email")] INotificationService emailService,
        [FromBody] NotificationRequest request)
    {
        await emailService.SendAsync(request.UserId, request.Message);
        return Ok();
    }

    [HttpPost("sms")]
    public async Task<IActionResult> SendSms(
        [FromKeyedServices("sms")] INotificationService smsService,
        [FromBody] NotificationRequest request)
    {
        await smsService.SendAsync(request.UserId, request.Message);
        return Ok();
    }
}
```

### 装饰器模式

```csharp
// 基础服务
public interface IProductService
{
    Task<Product?> GetByIdAsync(int id);
    Task<IEnumerable<Product>> GetAllAsync();
}

public class ProductService : IProductService
{
    private readonly IProductRepository _repository;

    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }
}

// 缓存装饰器
public class CachedProductService : IProductService
{
    private readonly IProductService _inner;
    private readonly ICacheService _cache;
    private readonly ILogger<CachedProductService> _logger;

    public CachedProductService(
        IProductService inner,
        ICacheService cache,
        ILogger<CachedProductService> logger)
    {
        _inner = inner;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        var cacheKey = $"product:{id}";
        var cached = await _cache.GetAsync<Product>(cacheKey);

        if (cached is not null)
        {
            _logger.LogDebug("缓存命中: {CacheKey}", cacheKey);
            return cached;
        }

        var product = await _inner.GetByIdAsync(id);

        if (product is not null)
        {
            await _cache.SetAsync(cacheKey, product, TimeSpan.FromMinutes(10));
        }

        return product;
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        var cacheKey = "products:all";
        var cached = await _cache.GetAsync<IEnumerable<Product>>(cacheKey);

        if (cached is not null)
        {
            return cached;
        }

        var products = await _inner.GetAllAsync();
        await _cache.SetAsync(cacheKey, products, TimeSpan.FromMinutes(5));

        return products;
    }
}

// 日志装饰器
public class LoggingProductService : IProductService
{
    private readonly IProductService _inner;
    private readonly ILogger<LoggingProductService> _logger;

    public LoggingProductService(
        IProductService inner,
        ILogger<LoggingProductService> logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        _logger.LogInformation("获取产品: ProductId={ProductId}", id);
        var sw = Stopwatch.StartNew();

        var result = await _inner.GetByIdAsync(id);

        sw.Stop();
        _logger.LogInformation("获取产品完成: ProductId={ProductId}, Found={Found}, Duration={Duration}ms",
            id, result is not null, sw.ElapsedMilliseconds);

        return result;
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        _logger.LogInformation("获取所有产品");
        var sw = Stopwatch.StartNew();

        var result = await _inner.GetAllAsync();

        sw.Stop();
        _logger.LogInformation("获取所有产品完成: Count={Count}, Duration={Duration}ms",
            result.Count(), sw.ElapsedMilliseconds);

        return result;
    }
}

// 手动注册装饰器
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<IProductService>(provider =>
{
    var inner = provider.GetRequiredService<ProductService>();
    var cache = provider.GetRequiredService<ICacheService>();
    var loggerCached = provider.GetRequiredService<ILogger<CachedProductService>>();
    var loggerLogging = provider.GetRequiredService<ILogger<LoggingProductService>>();

    // 装饰顺序：Logging -> Cached -> ProductService
    var cached = new CachedProductService(inner, cache, loggerCached);
    return new LoggingProductService(cached, loggerLogging);
});

// 使用 Scrutor 库简化装饰器注册
// dotnet add package Scrutor
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.Decorate<IProductService, CachedProductService>();
builder.Services.Decorate<IProductService, LoggingProductService>();
```

## 最佳实践

### 面向接口编程

始终依赖抽象（接口）而非具体实现：

```csharp
// 好的做法
public class OrderService
{
    private readonly IOrderRepository _repository;  // 依赖接口

    public OrderService(IOrderRepository repository)
    {
        _repository = repository;
    }
}

// 避免的做法
public class OrderService
{
    private readonly SqlOrderRepository _repository;  // 依赖具体类

    public OrderService(SqlOrderRepository repository)
    {
        _repository = repository;
    }
}
```

### 单一职责原则

每个服务应该只有一个职责：

```csharp
// 好的做法：职责分离
public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request);
    Task<Order?> GetOrderAsync(int id);
}

public interface IOrderNotificationService
{
    Task SendOrderConfirmationAsync(Order order);
}

public interface IOrderValidationService
{
    Task<ValidationResult> ValidateOrderAsync(CreateOrderRequest request);
}

// 避免的做法：职责混杂
public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request);
    Task<Order?> GetOrderAsync(int id);
    Task SendOrderConfirmationAsync(Order order);  // 不应该在这里
    Task<ValidationResult> ValidateOrderAsync(CreateOrderRequest request);  // 不应该在这里
}
```

### 构造函数参数数量

限制构造函数参数数量，过多参数表明类承担了太多职责：

```csharp
// 好的做法：适量的依赖（3-5 个）
public class OrderService(
    IOrderRepository repository,
    ILogger<OrderService> logger,
    IMapper mapper)
{
}

// 需要重构的情况：过多依赖
public class OrderService(
    IOrderRepository repository,
    IProductRepository productRepository,
    ICustomerRepository customerRepository,
    IInventoryService inventoryService,
    IPaymentService paymentService,
    IShippingService shippingService,
    INotificationService notificationService,
    ILogger<OrderService> logger,
    IMapper mapper,
    ICacheService cacheService)
{
    // 太多依赖 - 考虑拆分或使用聚合服务
}

// 重构方案：使用聚合服务
public interface IOrderDependencies
{
    IOrderRepository OrderRepository { get; }
    IProductRepository ProductRepository { get; }
    IInventoryService InventoryService { get; }
}

public class OrderService(
    IOrderDependencies dependencies,
    ILogger<OrderService> logger)
{
}
```

### 使用扩展方法组织注册代码

```csharp
// 按功能模块组织
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddOrderModule(this IServiceCollection services)
    {
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderValidationService, OrderValidationService>();
        return services;
    }

    public static IServiceCollection AddNotificationModule(this IServiceCollection services)
    {
        services.AddTransient<IEmailService, SmtpEmailService>();
        services.AddTransient<ISmsService, TwilioSmsService>();
        services.AddScoped<INotificationManager, NotificationManager>();
        return services;
    }

    public static IServiceCollection AddCachingModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<CacheSettings>(configuration.GetSection("Caching"));
        services.AddSingleton<ICacheService, RedisCacheService>();
        services.AddMemoryCache();
        return services;
    }
}

// Program.cs 清晰简洁
builder.Services.AddOrderModule();
builder.Services.AddNotificationModule();
builder.Services.AddCachingModule(builder.Configuration);
```

### 避免服务定位器反模式

```csharp
// 避免的做法：服务定位器
public class OrderService
{
    private readonly IServiceProvider _serviceProvider;

    public OrderService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void CreateOrder()
    {
        // 服务定位器模式 - 隐藏了真实依赖
        var repository = _serviceProvider.GetRequiredService<IOrderRepository>();
        var emailService = _serviceProvider.GetRequiredService<IEmailService>();
    }
}

// 好的做法：显式依赖
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailService _emailService;

    public OrderService(IOrderRepository repository, IEmailService emailService)
    {
        _repository = repository;
        _emailService = emailService;
    }
}
```

### 正确选择服务生命周期

```csharp
// DbContext 应该是 Scoped
services.AddDbContext<ApplicationDbContext>(options => ...);  // 默认 Scoped

// HttpClient 使用 IHttpClientFactory
services.AddHttpClient<IExternalApiService, ExternalApiService>();

// 配置类通常是 Singleton
services.AddSingleton<IConfiguration>(configuration);

// 无状态服务可以是 Transient
services.AddTransient<IEmailSender, SmtpEmailSender>();

// 需要缓存的服务是 Singleton
services.AddSingleton<ICacheService, MemoryCacheService>();
```

## 常见陷阱

### Captive Dependency（俘获依赖）

```csharp
// 错误：Singleton 依赖 Scoped
services.AddSingleton<ISingletonService, SingletonService>();
services.AddScoped<IScopedService, ScopedService>();

public class SingletonService : ISingletonService
{
    private readonly IScopedService _scopedService;  // 被俘获！

    public SingletonService(IScopedService scopedService)
    {
        _scopedService = scopedService;
    }
}

// 解决方案：使用 IServiceScopeFactory
public class SingletonService : ISingletonService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public SingletonService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task DoWorkAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var scopedService = scope.ServiceProvider.GetRequiredService<IScopedService>();
        await scopedService.ProcessAsync();
    }
}
```

### 在 Singleton 中使用 DbContext

```csharp
// 错误：直接注入 DbContext 到 Singleton
public class CacheService : ICacheService
{
    private readonly ApplicationDbContext _context;  // DbContext 是 Scoped！

    public CacheService(ApplicationDbContext context)
    {
        _context = context;
    }
}

// 解决方案1：使用 DbContextFactory
services.AddDbContextFactory<ApplicationDbContext>(options => ...);

public class CacheService : ICacheService
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public CacheService(IDbContextFactory<ApplicationDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task RefreshCacheAsync()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var data = await context.Products.ToListAsync();
        // 更新缓存
    }
}

// 解决方案2：使用 IServiceScopeFactory
public class CacheService : ICacheService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public CacheService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task RefreshCacheAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var data = await context.Products.ToListAsync();
        // 更新缓存
    }
}
```

### 循环依赖

```csharp
// 循环依赖会导致运行时异常
public class ServiceA
{
    public ServiceA(ServiceB b) { }
}

public class ServiceB
{
    public ServiceB(ServiceA a) { }
}

// 解决方案1：重构设计，提取公共依赖
public class ServiceA
{
    public ServiceA(ISharedService shared) { }
}

public class ServiceB
{
    public ServiceB(ISharedService shared) { }
}

// 解决方案2：使用 Lazy<T>
public class ServiceA
{
    private readonly Lazy<ServiceB> _serviceB;

    public ServiceA(Lazy<ServiceB> serviceB)
    {
        _serviceB = serviceB;
    }
}

// 解决方案3：使用事件或消息传递
public class ServiceA
{
    private readonly IEventBus _eventBus;

    public ServiceA(IEventBus eventBus)
    {
        _eventBus = eventBus;
    }

    public void DoWork()
    {
        _eventBus.Publish(new WorkCompletedEvent());
    }
}
```

### 忘记处理 IDisposable

```csharp
// 容器会自动处理已注册服务的 Dispose
// 但手动创建的对象需要自己处理

// 错误：手动创建的对象没有被释放
public class MyService
{
    public void DoWork()
    {
        var context = new ApplicationDbContext();  // 不会被自动释放
        // ...
    }
}

// 正确：通过 DI 获取或使用 using
public class MyService
{
    private readonly ApplicationDbContext _context;

    public MyService(ApplicationDbContext context)
    {
        _context = context;  // 容器负责释放
    }
}

// 或者
public class MyService
{
    private readonly IDbContextFactory<ApplicationDbContext> _factory;

    public async Task DoWorkAsync()
    {
        await using var context = await _factory.CreateDbContextAsync();
        // context 在 using 块结束时被释放
    }
}
```

### 在构造函数中执行异步操作

```csharp
// 错误：构造函数中执行异步操作
public class MyService
{
    private readonly Data _data;

    public MyService(IDataLoader loader)
    {
        // 阻塞等待异步操作
        _data = loader.LoadAsync().GetAwaiter().GetResult();  // 可能死锁！
    }
}

// 解决方案1：使用初始化方法
public interface IAsyncInitializable
{
    Task InitializeAsync();
}

public class MyService : IAsyncInitializable
{
    private readonly IDataLoader _loader;
    private Data? _data;

    public MyService(IDataLoader loader)
    {
        _loader = loader;
    }

    public async Task InitializeAsync()
    {
        _data = await _loader.LoadAsync();
    }
}

// 解决方案2：使用 Lazy<Task<T>>
public class MyService
{
    private readonly Lazy<Task<Data>> _dataTask;

    public MyService(IDataLoader loader)
    {
        _dataTask = new Lazy<Task<Data>>(() => loader.LoadAsync());
    }

    public async Task<Data> GetDataAsync()
    {
        return await _dataTask.Value;
    }
}

// 解决方案3：使用工厂方法
public static class MyServiceFactory
{
    public static async Task<MyService> CreateAsync(IDataLoader loader)
    {
        var data = await loader.LoadAsync();
        return new MyService(data);
    }
}
```

### 过度使用 IServiceProvider

```csharp
// 避免：到处注入 IServiceProvider
public class OrderService
{
    private readonly IServiceProvider _provider;

    public OrderService(IServiceProvider provider)
    {
        _provider = provider;
    }

    public void ProcessOrder()
    {
        var repo = _provider.GetRequiredService<IOrderRepository>();
        var email = _provider.GetRequiredService<IEmailService>();
        // 这种方式隐藏了真实依赖，难以测试
    }
}

// 正确：显式声明依赖
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailService _emailService;

    public OrderService(IOrderRepository repository, IEmailService emailService)
    {
        _repository = repository;
        _emailService = emailService;
    }
}
```

## 性能考量

### 服务解析性能

```csharp
// 避免在热路径中频繁解析服务
public class SlowService
{
    private readonly IServiceProvider _provider;

    public void ProcessItems(IEnumerable<Item> items)
    {
        foreach (var item in items)
        {
            // 每次循环都解析服务 - 性能差
            var processor = _provider.GetRequiredService<IItemProcessor>();
            processor.Process(item);
        }
    }
}

// 优化：在循环外解析服务
public class FastService
{
    private readonly IItemProcessor _processor;

    public FastService(IItemProcessor processor)
    {
        _processor = processor;
    }

    public void ProcessItems(IEnumerable<Item> items)
    {
        foreach (var item in items)
        {
            _processor.Process(item);  // 使用已注入的实例
        }
    }
}
```

### 避免不必要的 Transient

```csharp
// 如果服务是无状态的且创建成本高，考虑使用 Singleton
public class ExpensiveService : IExpensiveService
{
    private readonly HttpClient _client;
    private readonly IConfiguration _config;

    public ExpensiveService(IHttpClientFactory clientFactory, IConfiguration config)
    {
        _client = clientFactory.CreateClient();
        _config = config;
    }
}

// 如果是无状态的，可以用 Singleton
services.AddSingleton<IExpensiveService, ExpensiveService>();

// 但要确保线程安全！
```

### 使用对象池

```csharp
// 对于频繁创建销毁的对象，使用对象池
services.AddSingleton<ObjectPool<StringBuilder>>(provider =>
{
    var policy = new DefaultPooledObjectPolicy<StringBuilder>();
    return new DefaultObjectPool<StringBuilder>(policy, maximumRetained: 100);
});

public class StringProcessor
{
    private readonly ObjectPool<StringBuilder> _pool;

    public StringProcessor(ObjectPool<StringBuilder> pool)
    {
        _pool = pool;
    }

    public string Process(IEnumerable<string> items)
    {
        var sb = _pool.Get();
        try
        {
            foreach (var item in items)
            {
                sb.AppendLine(item);
            }
            return sb.ToString();
        }
        finally
        {
            sb.Clear();
            _pool.Return(sb);
        }
    }
}
```

### 预热 Singleton 服务

```csharp
// 在应用启动时预热关键的 Singleton 服务
var app = builder.Build();

// 预热服务
var cacheService = app.Services.GetRequiredService<ICacheService>();
await cacheService.WarmUpAsync();

var configService = app.Services.GetRequiredService<IConfigurationService>();
await configService.LoadAsync();

app.Run();
```

### 使用 Source Generator 减少反射

```csharp
// .NET 8+ 可以使用 Source Generator 生成 DI 代码
// 避免运行时反射开销

// 使用 [RegisterScoped], [RegisterSingleton] 等特性
// 配合 Source Generator 自动生成注册代码
```

## 实战场景

### 场景1：多租户应用

```csharp
// 租户解析服务
public interface ITenantResolver
{
    string GetCurrentTenantId();
}

public class HttpContextTenantResolver : ITenantResolver
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextTenantResolver(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetCurrentTenantId()
    {
        return _httpContextAccessor.HttpContext?.Request.Headers["X-Tenant-Id"].FirstOrDefault()
            ?? throw new InvalidOperationException("租户 ID 未提供");
    }
}

// 租户感知的 DbContext
public class TenantDbContext : DbContext
{
    private readonly string _tenantId;

    public TenantDbContext(
        DbContextOptions<TenantDbContext> options,
        ITenantResolver tenantResolver)
        : base(options)
    {
        _tenantId = tenantResolver.GetCurrentTenantId();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 全局查询过滤器
        modelBuilder.Entity<Order>().HasQueryFilter(o => o.TenantId == _tenantId);
        modelBuilder.Entity<Product>().HasQueryFilter(p => p.TenantId == _tenantId);
    }
}

// 注册
services.AddHttpContextAccessor();
services.AddScoped<ITenantResolver, HttpContextTenantResolver>();
services.AddDbContext<TenantDbContext>((provider, options) =>
{
    var tenantResolver = provider.GetRequiredService<ITenantResolver>();
    var tenantId = tenantResolver.GetCurrentTenantId();
    var connectionString = GetConnectionStringForTenant(tenantId);
    options.UseSqlServer(connectionString);
});
```

### 场景2：策略模式与 DI

```csharp
// 定义支付策略接口
public interface IPaymentStrategy
{
    string PaymentMethod { get; }
    Task<PaymentResult> ProcessAsync(PaymentRequest request);
}

// 多种支付实现
public class CreditCardPayment : IPaymentStrategy
{
    public string PaymentMethod => "CreditCard";

    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // 信用卡支付逻辑
        return new PaymentResult { Success = true };
    }
}

public class PayPalPayment : IPaymentStrategy
{
    public string PaymentMethod => "PayPal";

    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // PayPal 支付逻辑
        return new PaymentResult { Success = true };
    }
}

public class AlipayPayment : IPaymentStrategy
{
    public string PaymentMethod => "Alipay";

    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // 支付宝支付逻辑
        return new PaymentResult { Success = true };
    }
}

// 支付服务
public class PaymentService
{
    private readonly IEnumerable<IPaymentStrategy> _strategies;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IEnumerable<IPaymentStrategy> strategies,
        ILogger<PaymentService> logger)
    {
        _strategies = strategies;
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        var strategy = _strategies.FirstOrDefault(s =>
            s.PaymentMethod.Equals(request.PaymentMethod, StringComparison.OrdinalIgnoreCase));

        if (strategy is null)
        {
            _logger.LogWarning("不支持的支付方式: {PaymentMethod}", request.PaymentMethod);
            return new PaymentResult
            {
                Success = false,
                ErrorMessage = $"不支持的支付方式: {request.PaymentMethod}"
            };
        }

        _logger.LogInformation("处理支付: Method={Method}, Amount={Amount}",
            request.PaymentMethod, request.Amount);

        return await strategy.ProcessAsync(request);
    }
}

// 注册
services.AddScoped<IPaymentStrategy, CreditCardPayment>();
services.AddScoped<IPaymentStrategy, PayPalPayment>();
services.AddScoped<IPaymentStrategy, AlipayPayment>();
services.AddScoped<PaymentService>();
```

### 场景3：后台任务与作用域

```csharp
// 后台服务中正确使用 Scoped 服务
public class OrderProcessingBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderProcessingBackgroundService> _logger;

    public OrderProcessingBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderProcessingBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 每次处理创建新的作用域
                using var scope = _scopeFactory.CreateScope();
                var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var pendingOrders = await orderService.GetPendingOrdersAsync();

                foreach (var order in pendingOrders)
                {
                    await orderService.ProcessOrderAsync(order.Id);
                }

                await unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理订单时发生错误");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}

// 注册后台服务
services.AddHostedService<OrderProcessingBackgroundService>();
```

### 场景4：功能开关与条件注册

```csharp
// 基于配置的条件注册
public static class FeatureServiceExtensions
{
    public static IServiceCollection AddFeatureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var features = configuration.GetSection("Features").Get<FeatureSettings>()
            ?? new FeatureSettings();

        // 根据功能开关注册不同实现
        if (features.UseNewPaymentSystem)
        {
            services.AddScoped<IPaymentService, NewPaymentService>();
        }
        else
        {
            services.AddScoped<IPaymentService, LegacyPaymentService>();
        }

        if (features.EnableCaching)
        {
            services.AddSingleton<ICacheService, RedisCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, NullCacheService>();
        }

        if (features.EnableNotifications)
        {
            services.AddScoped<INotificationService, EmailNotificationService>();
            services.AddScoped<INotificationService, SmsNotificationService>();
        }
        else
        {
            services.AddScoped<INotificationService, NullNotificationService>();
        }

        return services;
    }
}

public class FeatureSettings
{
    public bool UseNewPaymentSystem { get; set; }
    public bool EnableCaching { get; set; } = true;
    public bool EnableNotifications { get; set; } = true;
}

// 空实现用于功能禁用时
public class NullCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key) => Task.FromResult<T?>(default);
    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) => Task.CompletedTask;
    public Task RemoveAsync(string key) => Task.CompletedTask;
}
```

## 面试要点

### 基础问题

**1. 什么是依赖注入？它解决了什么问题？**

依赖注入是一种设计模式，用于实现控制反转。它解决了：
- 类之间的紧耦合问题
- 代码难以测试的问题
- 违反开闭原则的问题
- 对象创建和使用耦合的问题

**2. .NET 中三种服务生命周期的区别是什么？**

- **Transient**：每次请求服务时创建新实例，适用于轻量级、无状态服务
- **Scoped**：每个作用域（HTTP 请求）创建一个实例，适用于 DbContext、单位工作
- **Singleton**：整个应用生命周期只创建一个实例，适用于缓存、配置服务

**3. 什么是 Captive Dependency？如何避免？**

当长生命周期服务（Singleton）依赖短生命周期服务（Scoped/Transient）时，短生命周期服务会被"俘获"，实际变成了 Singleton。

避免方法：
- 使用 `IServiceScopeFactory` 创建作用域
- 使用 `IDbContextFactory` 代替直接注入 DbContext
- 重新设计服务依赖关系

### 进阶问题

**4. IOptions、IOptionsSnapshot、IOptionsMonitor 的区别？**

| 特性 | IOptions | IOptionsSnapshot | IOptionsMonitor |
|-----|---------|-----------------|-----------------|
| 生命周期 | Singleton | Scoped | Singleton |
| 配置热重载 | 不支持 | 支持 | 支持 |
| 变更通知 | 无 | 无 | OnChange 回调 |
| 适用场景 | 静态配置 | 请求级配置 | 需要监听变更 |

**5. 如何注册和使用多个相同接口的实现？**

```csharp
// 注册
services.AddScoped<INotificationService, EmailService>();
services.AddScoped<INotificationService, SmsService>();

// 注入所有实现
public class NotificationManager(IEnumerable<INotificationService> services)
{
    public async Task NotifyAllAsync(string message)
    {
        foreach (var service in services)
        {
            await service.SendAsync(message);
        }
    }
}

// .NET 8 键控服务
services.AddKeyedScoped<INotificationService, EmailService>("email");
services.AddKeyedScoped<INotificationService, SmsService>("sms");
```

**6. 如何在后台服务中正确使用 Scoped 服务？**

```csharp
public class MyBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public MyBackgroundService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // 使用 dbContext
        }
    }
}
```

### 设计问题

**7. 什么时候应该使用工厂模式而不是直接注入？**

- 需要根据运行时参数创建不同实例时
- 对象创建需要复杂的初始化逻辑时
- 需要延迟创建对象时
- 需要创建非托管资源时

```csharp
// 工厂示例
public interface IReportGeneratorFactory
{
    IReportGenerator Create(ReportType type);
}

services.AddSingleton<IReportGeneratorFactory, ReportGeneratorFactory>();
```

**8. 如何设计一个支持扩展的插件系统？**

```csharp
// 插件接口
public interface IPlugin
{
    string Name { get; }
    void Execute();
}

// 自动扫描注册所有实现
services.Scan(scan => scan
    .FromAssembliesOf(typeof(IPlugin))
    .AddClasses(classes => classes.AssignableTo<IPlugin>())
    .AsImplementedInterfaces()
    .WithTransientLifetime());
```

## 延伸阅读

### 官方文档

- [.NET 依赖注入官方文档](https://learn.microsoft.com/dotnet/core/extensions/dependency-injection)
- [ASP.NET Core 依赖注入](https://learn.microsoft.com/aspnet/core/fundamentals/dependency-injection)
- [配置选项模式](https://learn.microsoft.com/dotnet/core/extensions/options)
- [服务生命周期](https://learn.microsoft.com/dotnet/core/extensions/dependency-injection#service-lifetimes)

### 第三方 DI 容器

- [Autofac](https://autofac.org/) - 功能丰富的 DI 容器
- [Scrutor](https://github.com/khellang/Scrutor) - 程序集扫描和装饰器支持
- [Simple Injector](https://simpleinjector.org/) - 高性能 DI 容器
- [Castle Windsor](https://github.com/castleproject/Windsor) - 成熟的企业级容器

### 相关设计模式

- 控制反转（IoC）
- 服务定位器模式（反模式）
- 工厂模式
- 策略模式
- 装饰器模式

### 推荐书籍

- 《Dependency Injection Principles, Practices, and Patterns》- Mark Seemann
- 《Clean Architecture》- Robert C. Martin
- 《Design Patterns》- Gang of Four
