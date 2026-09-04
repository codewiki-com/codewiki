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
origin: old/src/content/docs/csharp/dependency-injection.en.md
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

## Concept Explanation

Dependency Injection (DI) is a design pattern used to implement the Inversion of Control (IoC) principle. Its core idea is: instead of creating dependency objects inside a class, dependencies are passed in from the outside, thereby reducing coupling between classes.

### What is a Dependency?

In object-oriented programming, when class A needs to use the functionality of class B, we say A depends on B.

```csharp
// Traditional approach: hardcoded dependencies
public class OrderService
{
    private readonly SqlOrderRepository _repository;
    private readonly SmtpEmailService _emailService;

    public OrderService()
    {
        // Creating dependencies directly in the constructor
        _repository = new SqlOrderRepository();
        _emailService = new SmtpEmailService();
    }

    public void CreateOrder(Order order)
    {
        _repository.Save(order);
        _emailService.Send($"Order {order.Id} has been created");
    }
}
```

This approach has the following problems:

1. **Tight coupling**: OrderService directly depends on concrete implementation classes
2. **Difficult to test**: Cannot replace real dependencies with Mock objects
3. **Poor flexibility**: Changing implementations requires modifying OrderService code
4. **Violates Open/Closed Principle**: Open for modification, closed for extension

### The Dependency Injection Solution

```csharp
// Define abstract interfaces
public interface IOrderRepository
{
    void Save(Order order);
    Order? GetById(int id);
}

public interface IEmailService
{
    void Send(string message);
}

// Dependency injection approach
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailService _emailService;

    // Inject dependencies through the constructor
    public OrderService(IOrderRepository repository, IEmailService emailService)
    {
        _repository = repository;
        _emailService = emailService;
    }

    public void CreateOrder(Order order)
    {
        _repository.Save(order);
        _emailService.Send($"Order {order.Id} has been created");
    }
}
```

### Advantages of Dependency Injection

| Advantage | Description |
|-----------|-------------|
| Loose coupling | Classes depend only on abstract interfaces, not concrete implementations |
| Testability | Can easily inject Mock objects for unit testing |
| Maintainability | Changing implementations only requires modifying registration code, not business logic |
| Extensibility | Adding new implementations only requires implementing the interface and registering |
| Separation of concerns | Object creation and usage are separated |

### .NET Built-in Dependency Injection Container

.NET Core and later versions include a lightweight dependency injection container, which is the core infrastructure of ASP.NET Core applications. It provides:

- **IServiceCollection**: Service registration interface
- **IServiceProvider**: Service resolution interface
- **Three lifetimes**: Transient, Scoped, Singleton

## Core Principles

### How IoC Containers Work

The IoC container is the core of dependency injection, responsible for:

1. **Service registration**: Establishing mappings from abstract types to concrete types
2. **Service resolution**: Creating and returning instances based on requested types
3. **Lifetime management**: Controlling when objects are created and destroyed
4. **Dependency graph construction**: Automatically resolving object dependency chains

```
Registration Phase              Resolution Phase
┌─────────────────┐        ┌─────────────────┐
│ IServiceCollection │ ──→ │ IServiceProvider │
│  - Service descriptor list    │        │  - BuildServiceProvider()  │
│  - Interface→Implementation mapping   │        │  - GetService<T>()        │
│  - Lifetime configuration    │        │  - GetRequiredService<T>()│
└─────────────────┘        └─────────────────┘
```

### ServiceDescriptor

ServiceDescriptor is the core data structure for service registration:

```csharp
public class ServiceDescriptor
{
    // Service type (usually an interface)
    public Type ServiceType { get; }

    // Implementation type
    public Type? ImplementationType { get; }

    // Implementation instance (used for singletons)
    public object? ImplementationInstance { get; }

    // Implementation factory
    public Func<IServiceProvider, object>? ImplementationFactory { get; }

    // Lifetime
    public ServiceLifetime Lifetime { get; }
}
```

### Dependency Resolution Process

When the container resolves a service, it performs the following steps:

```csharp
// Assuming the following services are registered
services.AddScoped<IOrderService, OrderService>();
services.AddScoped<IOrderRepository, SqlOrderRepository>();
services.AddScoped<IEmailService, SmtpEmailService>();

// OrderService constructor
public OrderService(IOrderRepository repository, IEmailService emailService)
```

When resolving `IOrderService`:

1. Look up the registration information for `IOrderService`
2. Discover the implementation type is `OrderService`
3. Check the constructor parameters of `OrderService`
4. Recursively resolve `IOrderRepository` and `IEmailService`
5. Create `SqlOrderRepository` and `SmtpEmailService` instances
6. Call `OrderService` constructor, passing in dependencies
7. Return `OrderService` instance

### Circular Dependency Detection

The container detects and throws circular dependency exceptions:

```csharp
// Circular dependency example
public class ServiceA
{
    public ServiceA(ServiceB b) { }
}

public class ServiceB
{
    public ServiceB(ServiceA a) { }  // Circular!
}

// Will throw InvalidOperationException when resolving
// "A circular dependency was detected for the service of type 'ServiceA'"
```

## Key Concepts

### IServiceCollection Service Registration

IServiceCollection is a collection of service descriptors, providing multiple registration methods:

#### Basic Registration Methods

```csharp
var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;

// 1. Generic method registration (recommended)
services.AddTransient<IEmailService, SmtpEmailService>();
services.AddScoped<IOrderService, OrderService>();
services.AddSingleton<ICacheService, MemoryCacheService>();

// 2. Non-generic method registration
services.AddTransient(typeof(ILogger<>), typeof(Logger<>));

// 3. Register concrete type (self-registration)
services.AddScoped<OrderService>();

// 4. Register instance
var settings = new AppSettings { MaxRetries = 3 };
services.AddSingleton(settings);
services.AddSingleton<IAppSettings>(settings);
```

#### Factory Method Registration

```csharp
// Use factory method for complex initialization
services.AddScoped<IOrderService>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<OrderService>>();
    var repository = provider.GetRequiredService<IOrderRepository>();

    var apiKey = config["OrderApi:Key"];
    return new OrderService(repository, logger, apiKey);
});

// Conditional registration
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

#### TryAdd Methods

TryAdd methods only add if the service is not already registered:

```csharp
// Skip if IEmailService is already registered
services.TryAddTransient<IEmailService, SmtpEmailService>();
services.TryAddScoped<IOrderService, OrderService>();
services.TryAddSingleton<ICacheService, MemoryCacheService>();

// TryAddEnumerable: avoid adding duplicate implementations
services.TryAddEnumerable(
    ServiceDescriptor.Transient<IValidator, EmailValidator>());
services.TryAddEnumerable(
    ServiceDescriptor.Transient<IValidator, PhoneValidator>());
```

#### Replace and RemoveAll

```csharp
// Replace an already registered service
services.Replace(
    ServiceDescriptor.Scoped<IOrderService, NewOrderService>());

// Remove all registrations of a specified type
services.RemoveAll<IEmailService>();
services.RemoveAll(typeof(ILogger<>));
```

### Service Lifetimes

The .NET DI container supports three lifetimes. Choosing the correct lifetime is crucial:

#### Transient

Creates a new instance every time the service is requested:

```csharp
services.AddTransient<IEmailService, SmtpEmailService>();

// Every GetService creates a new instance
var service1 = provider.GetService<IEmailService>();
var service2 = provider.GetService<IEmailService>();
// service1 != service2
```

**Suitable scenarios**:
- Lightweight, stateless services
- Services that need fresh state each time they're used
- Services containing random or time-related logic

```csharp
// Examples of services suitable for Transient
public class GuidGenerator : IGuidGenerator
{
    public Guid NewGuid() => Guid.NewGuid();
}

public class EmailSender : IEmailSender
{
    // Each email send is an independent operation
    public Task SendAsync(Email email) { ... }
}
```

#### Scoped

Shares an instance within the same scope, creates new instance for different scopes:

```csharp
services.AddScoped<IOrderService, OrderService>();

// In ASP.NET Core, each HTTP request is a scope
// Same instance is obtained within the same request
```

**Suitable scenarios**:
- Database context (DbContext)
- Unit of Work
- Request-level state management

```csharp
// Examples of services suitable for Scoped
public class ApplicationDbContext : DbContext
{
    // Share database connection and transaction within the same request
}

public class CurrentUserService : ICurrentUserService
{
    // User information doesn't change within the same request
    public string UserId { get; set; }
}

services.AddScoped<ApplicationDbContext>();
services.AddScoped<ICurrentUserService, CurrentUserService>();
```

#### Singleton

Creates only one instance for the entire application lifetime:

```csharp
services.AddSingleton<ICacheService, MemoryCacheService>();

// Same instance is obtained everywhere
var service1 = provider.GetService<ICacheService>();
var service2 = provider.GetService<ICacheService>();
// service1 == service2
```

**Suitable scenarios**:
- Cache services
- Configuration services
- Logging services
- Thread-safe shared resources

```csharp
// Examples of services suitable for Singleton
public class MemoryCacheService : ICacheService
{
    private readonly ConcurrentDictionary<string, object> _cache = new();

    public void Set<T>(string key, T value) => _cache[key] = value!;
    public T? Get<T>(string key) => _cache.TryGetValue(key, out var val) ? (T)val : default;
}

public class ApplicationConfiguration : IApplicationConfiguration
{
    // Configuration loaded at application startup, doesn't change afterwards
    public string ApiKey { get; init; }
    public int MaxRetries { get; init; }
}
```

#### Lifetime Comparison Table

| Lifetime | Instance Creation Timing | Instance Disposal Timing | Thread Safety Requirement |
|----------|-------------------------|-------------------------|--------------------------|
| Transient | Every service request | Scope ends or GC collection | No special requirement |
| Scoped | First request in scope | Scope ends | Single-threaded within scope |
| Singleton | First request or at startup | Application shutdown | Must be thread-safe |

#### Lifetime Pitfall: Captive Dependency

When a long-lived service depends on a short-lived service, a "captive dependency" problem occurs:

```csharp
// Wrong example: Singleton depends on Scoped
public class CacheService : ICacheService  // Singleton
{
    private readonly IOrderService _orderService;  // Scoped

    public CacheService(IOrderService orderService)
    {
        // This Scoped service is "captured" by the Singleton
        // Causing it to effectively become a Singleton too
        _orderService = orderService;
    }
}
```

**Solutions**:

```csharp
// Solution 1: Use IServiceScopeFactory
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
        // Use orderService...
    }
}

// Solution 2: Inject IServiceProvider
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
        // Use orderService...
    }
}
```

### Constructor Injection

Constructor injection is the most common and recommended injection method:

#### Basic Usage

```csharp
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrderController> _logger;
    private readonly IMapper _mapper;

    // Constructor injection
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
        _logger.LogInformation("Getting order {OrderId}", id);
        var order = await _orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(_mapper.Map<OrderDto>(order));
    }
}
```

#### Primary Constructor (C# 12+)

C# 12 introduced primary constructors, simplifying dependency injection syntax:

```csharp
// Traditional approach
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
        _logger.LogInformation("Querying order {OrderId}", id);
        return await _repository.GetByIdAsync(id);
    }
}

// C# 12 primary constructor approach
public class OrderService(
    IOrderRepository repository,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Order?> GetByIdAsync(int id)
    {
        logger.LogInformation("Querying order {OrderId}", id);
        return await repository.GetByIdAsync(id);
    }
}
```

#### Constructor Selection Rules

When a class has multiple constructors, the container selects according to these rules:

```csharp
public class MyService
{
    // Container selects the constructor with the most parameters
    // where all parameters can be resolved
    public MyService() { }  // Constructor 1

    public MyService(ILogger logger) { }  // Constructor 2

    public MyService(ILogger logger, IConfiguration config) { }  // Constructor 3 ✓
}
```

Use `[ActivatorUtilitiesConstructor]` to specify the preferred constructor:

```csharp
public class MyService
{
    public MyService(ILogger logger, IConfiguration config) { }

    [ActivatorUtilitiesConstructor]  // Force use of this constructor
    public MyService(ILogger logger) { }
}
```

### Other Injection Methods

#### Property Injection (Not Recommended)

The .NET built-in container doesn't support property injection, but third-party containers (like Autofac) do:

```csharp
// Autofac property injection example
public class OrderService
{
    // Property injection
    public ILogger<OrderService> Logger { get; set; }
}

// Configure Autofac to enable property injection
builder.RegisterType<OrderService>()
    .PropertiesAutowired();
```

#### Method Injection

Use `[FromServices]` to inject in Action methods:

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(
        int id,
        [FromServices] IOrderService orderService,  // Method injection
        [FromServices] ILogger<OrderController> logger)
    {
        logger.LogInformation("Getting order {OrderId}", id);
        var order = await orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }
}
```

### IOptions Pattern

The IOptions pattern is used to bind configuration to strongly-typed objects:

#### Configuration Class Definition

```csharp
// appsettings.json
{
    "EmailSettings": {
        "SmtpServer": "smtp.example.com",
        "Port": 587,
        "UseSsl": true,
        "SenderName": "System Notification",
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

// Configuration classes
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

#### Registering Options

```csharp
var builder = WebApplication.CreateBuilder(args);

// Method 1: Configure method
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));

// Method 2: AddOptions method (supports validation)
builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection(EmailSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Method 3: Manual configuration
builder.Services.Configure<EmailSettings>(options =>
{
    options.SmtpServer = "smtp.example.com";
    options.Port = 587;
});

// Method 4: PostConfigure (executes after all Configure)
builder.Services.PostConfigure<EmailSettings>(options =>
{
    // Add default values or post-processing
    if (string.IsNullOrEmpty(options.SenderName))
    {
        options.SenderName = "Default Sender";
    }
});
```

#### Options Interface Comparison

| Interface | Lifetime | Hot Reload | Use Case |
|-----------|----------|------------|----------|
| IOptions<T> | Singleton | Not supported | Configuration that doesn't change |
| IOptionsSnapshot<T> | Scoped | Supported | Need latest config per request |
| IOptionsMonitor<T> | Singleton | Supported | Need to monitor config changes |

```csharp
// IOptions<T>: Singleton, configuration read at startup, won't update
public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;  // Read only once
    }
}

// IOptionsSnapshot<T>: Scoped, re-reads configuration each request
public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptionsSnapshot<EmailSettings> options)
    {
        _settings = options.Value;  // Reads latest config each request
    }
}

// IOptionsMonitor<T>: Singleton, supports configuration change notifications
public class EmailService : IDisposable
{
    private readonly IOptionsMonitor<EmailSettings> _optionsMonitor;
    private readonly IDisposable? _changeToken;
    private EmailSettings _currentSettings;

    public EmailService(IOptionsMonitor<EmailSettings> optionsMonitor)
    {
        _optionsMonitor = optionsMonitor;
        _currentSettings = optionsMonitor.CurrentValue;

        // Monitor configuration changes
        _changeToken = _optionsMonitor.OnChange(settings =>
        {
            _currentSettings = settings;
            Console.WriteLine($"Configuration updated: {settings.SmtpServer}");
        });
    }

    public void SendEmail(string to, string subject, string body)
    {
        // Use _currentSettings or _optionsMonitor.CurrentValue
    }

    public void Dispose()
    {
        _changeToken?.Dispose();
    }
}
```

#### Named Options

Used for multiple instances of the same configuration type:

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

// Register named Options
builder.Services.Configure<EmailSettings>("Primary",
    builder.Configuration.GetSection("EmailProviders:Primary"));
builder.Services.Configure<EmailSettings>("Backup",
    builder.Configuration.GetSection("EmailProviders:Backup"));

// Use named Options
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

#### Options Validation

```csharp
using System.ComponentModel.DataAnnotations;

public class EmailSettings
{
    [Required(ErrorMessage = "SMTP server address is required")]
    public string SmtpServer { get; set; } = string.Empty;

    [Range(1, 65535, ErrorMessage = "Port must be between 1-65535")]
    public int Port { get; set; }

    [Required, EmailAddress(ErrorMessage = "Sender email format is invalid")]
    public string SenderEmail { get; set; } = string.Empty;

    [Range(1, 10, ErrorMessage = "Retry count must be between 1-10")]
    public int MaxRetries { get; set; }
}

// Register Options with validation
builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection("EmailSettings"))
    .ValidateDataAnnotations()
    .ValidateOnStart();  // Validate at application startup

// Custom validation logic
builder.Services.AddOptions<EmailSettings>()
    .Bind(builder.Configuration.GetSection("EmailSettings"))
    .Validate(settings =>
    {
        // Custom validation logic
        if (settings.UseSsl && settings.Port == 25)
        {
            return false;
        }
        return true;
    }, "Cannot use port 25 when SSL is enabled")
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.SmtpServer),
        "SMTP server cannot be empty");

// Use IValidateOptions<T> for complex validation
public class EmailSettingsValidator : IValidateOptions<EmailSettings>
{
    public ValidateOptionsResult Validate(string? name, EmailSettings options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.SmtpServer))
        {
            errors.Add("SMTP server address cannot be empty");
        }

        if (options.Port < 1 || options.Port > 65535)
        {
            errors.Add("Port must be between 1-65535");
        }

        if (options.UseSsl && options.Port == 25)
        {
            errors.Add("Port 25 is not recommended when using SSL");
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

## Code Examples

### Complete Service Registration Example

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add framework services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
});

// Configure Options
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

// Register database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register business services
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IUserService, UserService>();

// Register infrastructure services
builder.Services.AddTransient<IEmailService, SmtpEmailService>();
builder.Services.AddTransient<ISmsService, TwilioSmsService>();
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// Register HttpClient
builder.Services.AddHttpClient<IExternalApiService, ExternalApiService>(client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Register background services
builder.Services.AddHostedService<OrderProcessingService>();
builder.Services.AddHostedService<CacheRefreshService>();

var app = builder.Build();

// Configure middleware
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

### Dependency Injection in Layered Architecture

```csharp
// Domain Layer - No dependencies
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

// Domain Layer - Repository interfaces
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

// Application Layer
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
            _logger.LogInformation("Creating order: CustomerId={CustomerId}", request.CustomerId);

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

            // Send confirmation email
            await _emailService.SendAsync(
                request.CustomerEmail,
                "Order Confirmation",
                $"Your order #{createdOrder.Id} has been created, total amount: {createdOrder.TotalAmount:C}");

            _logger.LogInformation("Order created successfully: OrderId={OrderId}", createdOrder.Id);

            return _mapper.Map<OrderDto>(createdOrder);
        }

        public async Task UpdateOrderStatusAsync(int orderId, OrderStatus status)
        {
            var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
            if (order is null)
            {
                throw new NotFoundException($"Order {orderId} not found");
            }

            order.Status = status;
            await _unitOfWork.Orders.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Order status updated: OrderId={OrderId}, Status={Status}",
                orderId, status);
        }

        public async Task CancelOrderAsync(int orderId)
        {
            await UpdateOrderStatusAsync(orderId, OrderStatus.Cancelled);
        }
    }
}

// Infrastructure Layer
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

// Infrastructure Layer - Extension methods
namespace MyApp.Infrastructure.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Database
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection")));

            // Repository and Unit of Work
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Email service
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

            // Application services
            services.AddScoped<IOrderService, OrderService>();

            return services;
        }
    }
}

// Program.cs using extension methods
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();
// ...
```

### Injecting Multiple Implementations

```csharp
// Define notification service interface
public interface INotificationService
{
    string Channel { get; }
    Task SendAsync(string userId, string message);
}

// Multiple implementations
public class EmailNotificationService : INotificationService
{
    public string Channel => "Email";

    public async Task SendAsync(string userId, string message)
    {
        // Send email notification
        await Task.CompletedTask;
    }
}

public class SmsNotificationService : INotificationService
{
    public string Channel => "SMS";

    public async Task SendAsync(string userId, string message)
    {
        // Send SMS notification
        await Task.CompletedTask;
    }
}

public class PushNotificationService : INotificationService
{
    public string Channel => "Push";

    public async Task SendAsync(string userId, string message)
    {
        // Send push notification
        await Task.CompletedTask;
    }
}

// Register all implementations
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services.AddScoped<INotificationService, SmsNotificationService>();
builder.Services.AddScoped<INotificationService, PushNotificationService>();

// Inject all implementations
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

    // Send to all channels
    public async Task NotifyAllAsync(string userId, string message)
    {
        var tasks = _notificationServices.Select(async service =>
        {
            try
            {
                await service.SendAsync(userId, message);
                _logger.LogInformation("Notification sent: Channel={Channel}, UserId={UserId}",
                    service.Channel, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification: Channel={Channel}", service.Channel);
            }
        });

        await Task.WhenAll(tasks);
    }

    // Send to specific channel
    public async Task NotifyAsync(string userId, string message, string channel)
    {
        var service = _notificationServices.FirstOrDefault(s => s.Channel == channel);
        if (service is null)
        {
            throw new ArgumentException($"Notification channel not found: {channel}");
        }

        await service.SendAsync(userId, message);
    }
}

// .NET 8+ Keyed services
builder.Services.AddKeyedScoped<INotificationService, EmailNotificationService>("email");
builder.Services.AddKeyedScoped<INotificationService, SmsNotificationService>("sms");
builder.Services.AddKeyedScoped<INotificationService, PushNotificationService>("push");

// Using keyed services
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

### Decorator Pattern

```csharp
// Base service
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

// Caching decorator
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
            _logger.LogDebug("Cache hit: {CacheKey}", cacheKey);
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

// Logging decorator
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
        _logger.LogInformation("Getting product: ProductId={ProductId}", id);
        var sw = Stopwatch.StartNew();

        var result = await _inner.GetByIdAsync(id);

        sw.Stop();
        _logger.LogInformation("Get product completed: ProductId={ProductId}, Found={Found}, Duration={Duration}ms",
            id, result is not null, sw.ElapsedMilliseconds);

        return result;
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        _logger.LogInformation("Getting all products");
        var sw = Stopwatch.StartNew();

        var result = await _inner.GetAllAsync();

        sw.Stop();
        _logger.LogInformation("Get all products completed: Count={Count}, Duration={Duration}ms",
            result.Count(), sw.ElapsedMilliseconds);

        return result;
    }
}

// Manual decorator registration
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<IProductService>(provider =>
{
    var inner = provider.GetRequiredService<ProductService>();
    var cache = provider.GetRequiredService<ICacheService>();
    var loggerCached = provider.GetRequiredService<ILogger<CachedProductService>>();
    var loggerLogging = provider.GetRequiredService<ILogger<LoggingProductService>>();

    // Decoration order: Logging -> Cached -> ProductService
    var cached = new CachedProductService(inner, cache, loggerCached);
    return new LoggingProductService(cached, loggerLogging);
});

// Simplify decorator registration using Scrutor library
// dotnet add package Scrutor
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.Decorate<IProductService, CachedProductService>();
builder.Services.Decorate<IProductService, LoggingProductService>();
```

## Best Practices

### Program to Interfaces

Always depend on abstractions (interfaces) rather than concrete implementations:

```csharp
// Good practice
public class OrderService
{
    private readonly IOrderRepository _repository;  // Depend on interface

    public OrderService(IOrderRepository repository)
    {
        _repository = repository;
    }
}

// Avoid this
public class OrderService
{
    private readonly SqlOrderRepository _repository;  // Depend on concrete class

    public OrderService(SqlOrderRepository repository)
    {
        _repository = repository;
    }
}
```

### Single Responsibility Principle

Each service should have only one responsibility:

```csharp
// Good practice: Separation of concerns
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

// Avoid this: Mixed responsibilities
public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request);
    Task<Order?> GetOrderAsync(int id);
    Task SendOrderConfirmationAsync(Order order);  // Shouldn't be here
    Task<ValidationResult> ValidateOrderAsync(CreateOrderRequest request);  // Shouldn't be here
}
```

### Constructor Parameter Count

Limit the number of constructor parameters. Too many parameters indicates the class has too many responsibilities:

```csharp
// Good practice: Reasonable number of dependencies (3-5)
public class OrderService(
    IOrderRepository repository,
    ILogger<OrderService> logger,
    IMapper mapper)
{
}

// Needs refactoring: Too many dependencies
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
    // Too many dependencies - consider splitting or using aggregate service
}

// Refactoring approach: Use aggregate service
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

### Use Extension Methods to Organize Registration Code

```csharp
// Organize by functional module
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

// Program.cs is clean and concise
builder.Services.AddOrderModule();
builder.Services.AddNotificationModule();
builder.Services.AddCachingModule(builder.Configuration);
```

### Avoid Service Locator Anti-Pattern

```csharp
// Avoid this: Service locator
public class OrderService
{
    private readonly IServiceProvider _serviceProvider;

    public OrderService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void CreateOrder()
    {
        // Service locator pattern - hides real dependencies
        var repository = _serviceProvider.GetRequiredService<IOrderRepository>();
        var emailService = _serviceProvider.GetRequiredService<IEmailService>();
    }
}

// Good practice: Explicit dependencies
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

### Choose Service Lifetimes Correctly

```csharp
// DbContext should be Scoped
services.AddDbContext<ApplicationDbContext>(options => ...);  // Default is Scoped

// HttpClient uses IHttpClientFactory
services.AddHttpClient<IExternalApiService, ExternalApiService>();

// Configuration classes are usually Singleton
services.AddSingleton<IConfiguration>(configuration);

// Stateless services can be Transient
services.AddTransient<IEmailSender, SmtpEmailSender>();

// Services that need caching are Singleton
services.AddSingleton<ICacheService, MemoryCacheService>();
```

## Common Pitfalls

### Captive Dependency

```csharp
// Wrong: Singleton depends on Scoped
services.AddSingleton<ISingletonService, SingletonService>();
services.AddScoped<IScopedService, ScopedService>();

public class SingletonService : ISingletonService
{
    private readonly IScopedService _scopedService;  // Captured!

    public SingletonService(IScopedService scopedService)
    {
        _scopedService = scopedService;
    }
}

// Solution: Use IServiceScopeFactory
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

### Using DbContext in Singleton

```csharp
// Wrong: Directly inject DbContext into Singleton
public class CacheService : ICacheService
{
    private readonly ApplicationDbContext _context;  // DbContext is Scoped!

    public CacheService(ApplicationDbContext context)
    {
        _context = context;
    }
}

// Solution 1: Use DbContextFactory
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
        // Update cache
    }
}

// Solution 2: Use IServiceScopeFactory
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
        // Update cache
    }
}
```

### Circular Dependencies

```csharp
// Circular dependencies cause runtime exceptions
public class ServiceA
{
    public ServiceA(ServiceB b) { }
}

public class ServiceB
{
    public ServiceB(ServiceA a) { }
}

// Solution 1: Refactor design, extract common dependency
public class ServiceA
{
    public ServiceA(ISharedService shared) { }
}

public class ServiceB
{
    public ServiceB(ISharedService shared) { }
}

// Solution 2: Use Lazy<T>
public class ServiceA
{
    private readonly Lazy<ServiceB> _serviceB;

    public ServiceA(Lazy<ServiceB> serviceB)
    {
        _serviceB = serviceB;
    }
}

// Solution 3: Use events or message passing
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

### Forgetting to Handle IDisposable

```csharp
// The container automatically handles Dispose for registered services
// But manually created objects need to be handled yourself

// Wrong: Manually created object not disposed
public class MyService
{
    public void DoWork()
    {
        var context = new ApplicationDbContext();  // Won't be auto-disposed
        // ...
    }
}

// Correct: Get via DI or use using
public class MyService
{
    private readonly ApplicationDbContext _context;

    public MyService(ApplicationDbContext context)
    {
        _context = context;  // Container handles disposal
    }
}

// Or
public class MyService
{
    private readonly IDbContextFactory<ApplicationDbContext> _factory;

    public async Task DoWorkAsync()
    {
        await using var context = await _factory.CreateDbContextAsync();
        // context is disposed when using block ends
    }
}
```

### Executing Async Operations in Constructors

```csharp
// Wrong: Executing async operations in constructor
public class MyService
{
    private readonly Data _data;

    public MyService(IDataLoader loader)
    {
        // Blocking wait on async operation
        _data = loader.LoadAsync().GetAwaiter().GetResult();  // May deadlock!
    }
}

// Solution 1: Use initialization method
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

// Solution 2: Use Lazy<Task<T>>
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

// Solution 3: Use factory method
public static class MyServiceFactory
{
    public static async Task<MyService> CreateAsync(IDataLoader loader)
    {
        var data = await loader.LoadAsync();
        return new MyService(data);
    }
}
```

### Overusing IServiceProvider

```csharp
// Avoid: Injecting IServiceProvider everywhere
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
        // This approach hides real dependencies, difficult to test
    }
}

// Correct: Declare dependencies explicitly
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

## Performance Considerations

### Service Resolution Performance

```csharp
// Avoid frequently resolving services in hot paths
public class SlowService
{
    private readonly IServiceProvider _provider;

    public void ProcessItems(IEnumerable<Item> items)
    {
        foreach (var item in items)
        {
            // Resolving service every iteration - poor performance
            var processor = _provider.GetRequiredService<IItemProcessor>();
            processor.Process(item);
        }
    }
}

// Optimized: Resolve service outside the loop
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
            _processor.Process(item);  // Use already injected instance
        }
    }
}
```

### Avoid Unnecessary Transient

```csharp
// If a service is stateless and expensive to create, consider using Singleton
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

// If it's stateless, can use Singleton
services.AddSingleton<IExpensiveService, ExpensiveService>();

// But ensure thread safety!
```

### Use Object Pooling

```csharp
// For frequently created/destroyed objects, use object pooling
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

### Warm Up Singleton Services

```csharp
// Warm up critical Singleton services at application startup
var app = builder.Build();

// Warm up services
var cacheService = app.Services.GetRequiredService<ICacheService>();
await cacheService.WarmUpAsync();

var configService = app.Services.GetRequiredService<IConfigurationService>();
await configService.LoadAsync();

app.Run();
```

### Use Source Generator to Reduce Reflection

```csharp
// .NET 8+ can use Source Generator to generate DI code
// Avoiding runtime reflection overhead

// Use [RegisterScoped], [RegisterSingleton] and other attributes
// With Source Generator to automatically generate registration code
```

## Real-World Scenarios

### Scenario 1: Multi-Tenant Application

```csharp
// Tenant resolution service
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
            ?? throw new InvalidOperationException("Tenant ID not provided");
    }
}

// Tenant-aware DbContext
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
        // Global query filter
        modelBuilder.Entity<Order>().HasQueryFilter(o => o.TenantId == _tenantId);
        modelBuilder.Entity<Product>().HasQueryFilter(p => p.TenantId == _tenantId);
    }
}

// Registration
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

### Scenario 2: Strategy Pattern with DI

```csharp
// Define payment strategy interface
public interface IPaymentStrategy
{
    string PaymentMethod { get; }
    Task<PaymentResult> ProcessAsync(PaymentRequest request);
}

// Multiple payment implementations
public class CreditCardPayment : IPaymentStrategy
{
    public string PaymentMethod => "CreditCard";

    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // Credit card payment logic
        return new PaymentResult { Success = true };
    }
}

public class PayPalPayment : IPaymentStrategy
{
    public string PaymentMethod => "PayPal";

    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // PayPal payment logic
        return new PaymentResult { Success = true };
    }
}

public class AlipayPayment : IPaymentStrategy
{
    public string PaymentMethod => "Alipay";

    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // Alipay payment logic
        return new PaymentResult { Success = true };
    }
}

// Payment service
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
            _logger.LogWarning("Unsupported payment method: {PaymentMethod}", request.PaymentMethod);
            return new PaymentResult
            {
                Success = false,
                ErrorMessage = $"Unsupported payment method: {request.PaymentMethod}"
            };
        }

        _logger.LogInformation("Processing payment: Method={Method}, Amount={Amount}",
            request.PaymentMethod, request.Amount);

        return await strategy.ProcessAsync(request);
    }
}

// Registration
services.AddScoped<IPaymentStrategy, CreditCardPayment>();
services.AddScoped<IPaymentStrategy, PayPalPayment>();
services.AddScoped<IPaymentStrategy, AlipayPayment>();
services.AddScoped<PaymentService>();
```

### Scenario 3: Background Tasks and Scopes

```csharp
// Correctly using Scoped services in background services
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
                // Create a new scope for each processing
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
                _logger.LogError(ex, "Error occurred while processing orders");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}

// Register background service
services.AddHostedService<OrderProcessingBackgroundService>();
```

### Scenario 4: Feature Flags and Conditional Registration

```csharp
// Configuration-based conditional registration
public static class FeatureServiceExtensions
{
    public static IServiceCollection AddFeatureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var features = configuration.GetSection("Features").Get<FeatureSettings>()
            ?? new FeatureSettings();

        // Register different implementations based on feature flags
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

// Null implementation for disabled features
public class NullCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key) => Task.FromResult<T?>(default);
    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) => Task.CompletedTask;
    public Task RemoveAsync(string key) => Task.CompletedTask;
}
```

## Interview Key Points

### Basic Questions

**1. What is dependency injection? What problems does it solve?**

Dependency injection is a design pattern used to implement Inversion of Control. It solves:
- Tight coupling between classes
- Difficulty in testing code
- Violation of Open/Closed Principle
- Coupling of object creation and usage

**2. What are the differences between the three service lifetimes in .NET?**

- **Transient**: Creates a new instance every time the service is requested, suitable for lightweight, stateless services
- **Scoped**: Creates one instance per scope (HTTP request), suitable for DbContext, Unit of Work
- **Singleton**: Creates only one instance for the entire application lifetime, suitable for cache, configuration services

**3. What is Captive Dependency? How to avoid it?**

When a long-lived service (Singleton) depends on a short-lived service (Scoped/Transient), the short-lived service is "captured" and effectively becomes a Singleton.

Avoidance methods:
- Use `IServiceScopeFactory` to create scopes
- Use `IDbContextFactory` instead of directly injecting DbContext
- Redesign service dependencies

### Advanced Questions

**4. What are the differences between IOptions, IOptionsSnapshot, and IOptionsMonitor?**

| Feature | IOptions | IOptionsSnapshot | IOptionsMonitor |
|---------|----------|-----------------|-----------------|
| Lifetime | Singleton | Scoped | Singleton |
| Configuration hot reload | Not supported | Supported | Supported |
| Change notifications | None | None | OnChange callback |
| Use case | Static configuration | Per-request configuration | Need to monitor changes |

**5. How to register and use multiple implementations of the same interface?**

```csharp
// Registration
services.AddScoped<INotificationService, EmailService>();
services.AddScoped<INotificationService, SmsService>();

// Inject all implementations
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

// .NET 8 Keyed services
services.AddKeyedScoped<INotificationService, EmailService>("email");
services.AddKeyedScoped<INotificationService, SmsService>("sms");
```

**6. How to correctly use Scoped services in background services?**

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
            // Use dbContext
        }
    }
}
```

### Design Questions

**7. When should you use the factory pattern instead of direct injection?**

- When you need to create different instances based on runtime parameters
- When object creation requires complex initialization logic
- When you need to delay object creation
- When you need to create unmanaged resources

```csharp
// Factory example
public interface IReportGeneratorFactory
{
    IReportGenerator Create(ReportType type);
}

services.AddSingleton<IReportGeneratorFactory, ReportGeneratorFactory>();
```

**8. How to design an extensible plugin system?**

```csharp
// Plugin interface
public interface IPlugin
{
    string Name { get; }
    void Execute();
}

// Automatically scan and register all implementations
services.Scan(scan => scan
    .FromAssembliesOf(typeof(IPlugin))
    .AddClasses(classes => classes.AssignableTo<IPlugin>())
    .AsImplementedInterfaces()
    .WithTransientLifetime());
```

## Further Reading

### Official Documentation

- [.NET Dependency Injection Official Documentation](https://learn.microsoft.com/dotnet/core/extensions/dependency-injection)
- [ASP.NET Core Dependency Injection](https://learn.microsoft.com/aspnet/core/fundamentals/dependency-injection)
- [Options Pattern Configuration](https://learn.microsoft.com/dotnet/core/extensions/options)
- [Service Lifetimes](https://learn.microsoft.com/dotnet/core/extensions/dependency-injection#service-lifetimes)

### Third-Party DI Containers

- [Autofac](https://autofac.org/) - Feature-rich DI container
- [Scrutor](https://github.com/khellang/Scrutor) - Assembly scanning and decorator support
- [Simple Injector](https://simpleinjector.org/) - High-performance DI container
- [Castle Windsor](https://github.com/castleproject/Windsor) - Mature enterprise-grade container

### Related Design Patterns

- Inversion of Control (IoC)
- Service Locator Pattern (anti-pattern)
- Factory Pattern
- Strategy Pattern
- Decorator Pattern

### Recommended Books

- "Dependency Injection Principles, Practices, and Patterns" - Mark Seemann
- "Clean Architecture" - Robert C. Martin
- "Design Patterns" - Gang of Four
