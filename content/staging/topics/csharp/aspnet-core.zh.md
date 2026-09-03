---
title: ASP.NET Core Web 开发
description: 学习 ASP.NET Core 现代 Web 开发，包括 MVC、Web API 和中间件
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - ASP.NET Core
  - Web
  - API
status: imported
origin: old/src/content/docs/csharp/aspnet-core.zh.md
divergence: 0.22
issues: []
legacy:
  category: CSharp
  subcategory: Web Development
  order: 13
  lastUpdated: 2026-01-07
---

ASP.NET Core 是一个跨平台、高性能、开源的框架，用于构建现代化、云端、互联网连接的应用程序。它是对 ASP.NET 的完全重写，将 MVC 和 Web API 统一到单一的编程模型中，提供模块化架构，使开发人员能够只包含他们需要的组件。

## 简介和设置

ASP.NET Core 代表了从原始 ASP.NET 框架的重大演进，从头开始为现代 Web 开发场景设计。

### 主要特性

- **跨平台**：在 Windows、Linux 和 macOS 上运行
- **高性能**：最快的 Web 框架之一
- **模块化架构**：使用 NuGet 包的按需付费模式
- **内置依赖注入**：全程一流的 DI 支持
- **统一编程模型**：MVC 和 Web API 共享相同的基础
- **云就绪**：为云部署和容器化设计
- **开源**：完全开源，社区贡献

### 创建新项目

使用 .NET CLI 创建新的 ASP.NET Core 项目：

```bash
# 创建新的 Web API 项目
dotnet new webapi -n MyWebApi

# 创建新的 MVC 项目
dotnet new mvc -n MyMvcApp

# 创建最小 API 项目
dotnet new web -n MyMinimalApi

# 创建 Razor Pages 项目
dotnet new webapp -n MyRazorApp

# 运行应用程序
cd MyWebApi
dotnet run
```

### 项目结构

典型的 ASP.NET Core 项目结构：

```
MyWebApi/
├── Controllers/
│   └── WeatherForecastController.cs
├── Models/
│   └── WeatherForecast.cs
├── Services/
│   └── WeatherService.cs
├── Properties/
│   └── launchSettings.json
├── appsettings.json
├── appsettings.Development.json
├── Program.cs
└── MyWebApi.csproj
```

### 最小化 Program.cs

ASP.NET Core 6+ 使用最小化托管模型：

```csharp
var builder = WebApplication.CreateBuilder(args);

// 向容器添加服务
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 配置 HTTP 请求管道
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

## 应用程序架构

理解请求管道和应用程序生命周期是 ASP.NET Core 开发的基础。

### WebApplication 和 WebApplicationBuilder

```csharp
var builder = WebApplication.CreateBuilder(args);

// 配置服务（依赖注入）
builder.Services.AddControllers();
builder.Services.AddScoped<IMyService, MyService>();

// 配置日志
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// 配置 Kestrel（Web 服务器）
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
});

// 访问配置
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var app = builder.Build();

// 配置中间件管道
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### 主机配置

```csharp
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    ApplicationName = "MyApp",
    ContentRootPath = Directory.GetCurrentDirectory(),
    EnvironmentName = Environments.Production,
    WebRootPath = "wwwroot"
});

// 配置主机设置
builder.Host.ConfigureHostOptions(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(30);
});

// 使用特定 URL
builder.WebHost.UseUrls("http://localhost:5000", "https://localhost:5001");
```

### 基于环境的配置

```csharp
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else if (app.Environment.IsStaging())
{
    app.UseExceptionHandler("/Error");
}
else if (app.Environment.IsProduction())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// 自定义环境检查
if (app.Environment.IsEnvironment("Testing"))
{
    // 测试特定配置
}
```

## 依赖注入

ASP.NET Core 有一个内置的依赖注入容器，是框架的基础。

### 服务生命周期

```csharp
var builder = WebApplication.CreateBuilder(args);

// Transient：每次请求都创建新实例
builder.Services.AddTransient<ITransientService, TransientService>();

// Scoped：每个 HTTP 请求一个实例
builder.Services.AddScoped<IScopedService, ScopedService>();

// Singleton：应用程序生命周期内一个实例
builder.Services.AddSingleton<ISingletonService, SingletonService>();

// 仅注册实现（无接口）
builder.Services.AddTransient<ConcreteService>();

// 使用工厂方法注册
builder.Services.AddScoped<IComplexService>(serviceProvider =>
{
    var config = serviceProvider.GetRequiredService<IConfiguration>();
    var logger = serviceProvider.GetRequiredService<ILogger<ComplexService>>();
    return new ComplexService(config["ApiKey"], logger);
});
```

### 服务注册模式

```csharp
// 同一接口的多个实现
builder.Services.AddTransient<INotificationService, EmailNotificationService>();
builder.Services.AddTransient<INotificationService, SmsNotificationService>();
builder.Services.AddTransient<INotificationService, PushNotificationService>();

// 注入所有实现
public class NotificationManager
{
    private readonly IEnumerable<INotificationService> _services;

    public NotificationManager(IEnumerable<INotificationService> services)
    {
        _services = services;
    }

    public async Task NotifyAllAsync(string message)
    {
        foreach (var service in _services)
        {
            await service.SendAsync(message);
        }
    }
}

// 键控服务（ASP.NET Core 8+）
builder.Services.AddKeyedScoped<INotificationService, EmailNotificationService>("email");
builder.Services.AddKeyedScoped<INotificationService, SmsNotificationService>("sms");

public class OrderService
{
    public OrderService([FromKeyedServices("email")] INotificationService emailService)
    {
        // 专门使用邮件通知
    }
}
```

### 选项模式

```csharp
// 配置类
public class SmtpSettings
{
    public const string SectionName = "Smtp";

    public string Host { get; set; }
    public int Port { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public bool EnableSsl { get; set; }
}

// appsettings.json
/*
{
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": 587,
    "Username": "user@example.com",
    "Password": "secret",
    "EnableSsl": true
  }
}
*/

// 注册
builder.Services.Configure<SmtpSettings>(
    builder.Configuration.GetSection(SmtpSettings.SectionName));

// 带验证
builder.Services.AddOptions<SmtpSettings>()
    .Bind(builder.Configuration.GetSection(SmtpSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// 在服务中使用
public class EmailService
{
    private readonly SmtpSettings _settings;

    public EmailService(IOptions<SmtpSettings> options)
    {
        _settings = options.Value;
    }

    // 对于可以在运行时更改的设置
    public EmailService(IOptionsMonitor<SmtpSettings> optionsMonitor)
    {
        _settings = optionsMonitor.CurrentValue;
        optionsMonitor.OnChange(settings =>
        {
            // 处理配置更改
        });
    }

    // 对于作用域设置（每请求）
    public EmailService(IOptionsSnapshot<SmtpSettings> optionsSnapshot)
    {
        _settings = optionsSnapshot.Value;
    }
}
```

### 服务作用域和验证

```csharp
// 在启动时验证服务注册
var app = builder.Build();

// 创建作用域以解析作用域服务
using (var scope = app.Services.CreateScope())
{
    var myService = scope.ServiceProvider.GetRequiredService<IMyService>();
    // 验证或初始化
}

// 后台服务中的服务作用域
public class BackgroundWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public BackgroundWorker(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // 使用作用域服务
            await dbContext.SaveChangesAsync(stoppingToken);

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
```


## 配置

ASP.NET Core 提供了一个灵活的配置系统，支持多种源。

### 配置源

```csharp
var builder = WebApplication.CreateBuilder(args);

// 默认配置源（按优先级顺序）：
// 1. appsettings.json
// 2. appsettings.{Environment}.json
// 3. 用户机密（仅开发环境）
// 4. 环境变量
// 5. 命令行参数

// 添加自定义配置源
builder.Configuration
    .AddJsonFile("customsettings.json", optional: true, reloadOnChange: true)
    .AddXmlFile("settings.xml", optional: true)
    .AddIniFile("settings.ini", optional: true)
    .AddEnvironmentVariables(prefix: "MYAPP_")
    .AddCommandLine(args);

// 添加 Azure Key Vault
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myvault.vault.azure.net/"),
    new DefaultAzureCredential());
```

### 访问配置

```csharp
// 直接访问
var builder = WebApplication.CreateBuilder(args);

// 获取简单值
string apiKey = builder.Configuration["ApiKey"];

// 获取嵌套值
string connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];
// 或使用 GetConnectionString 辅助方法
connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 获取配置节
IConfigurationSection smtpSection = builder.Configuration.GetSection("Smtp");

// 绑定到类
var smtpSettings = new SmtpSettings();
builder.Configuration.GetSection("Smtp").Bind(smtpSettings);

// 或使用 Get<T>
var settings = builder.Configuration.GetSection("Smtp").Get<SmtpSettings>();
```

### appsettings.json 中的配置

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MyApp;Trusted_Connection=True;"
  },
  "ApiSettings": {
    "BaseUrl": "https://api.example.com",
    "Timeout": 30,
    "RetryCount": 3
  },
  "Features": {
    "EnableNewFeature": true,
    "MaxItemsPerPage": 50
  },
  "AllowedHosts": "*"
}
```

### 开发环境的用户机密

```bash
# 初始化用户机密
dotnet user-secrets init

# 设置机密
dotnet user-secrets set "ApiKey" "my-secret-key"

# 设置嵌套值
dotnet user-secrets set "Smtp:Password" "secret-password"

# 列出所有机密
dotnet user-secrets list

# 删除机密
dotnet user-secrets remove "ApiKey"
```

### 环境变量

```csharp
// 环境变量会覆盖其他配置
// 嵌套键使用双下划线
// MYAPP_ConnectionStrings__DefaultConnection=Server=prod...
// MYAPP_Smtp__Host=smtp.prod.example.com

builder.Configuration.AddEnvironmentVariables(prefix: "MYAPP_");

// 在代码中访问
var host = Environment.GetEnvironmentVariable("MYAPP_Smtp__Host");
```

## 中间件

中间件组件构成了 ASP.NET Core 中的请求处理管道。

### 中间件管道

```csharp
var app = builder.Build();

// 中间件按添加顺序执行
// 请求向下流动，响应向上返回

app.Use(async (context, next) =>
{
    // 下一个中间件之前
    Console.WriteLine("Request: " + context.Request.Path);

    await next(); // 调用下一个中间件

    // 下一个中间件之后（返回途中）
    Console.WriteLine("Response: " + context.Response.StatusCode);
});

// 短路中间件（不调用 next）
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/health")
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("Healthy");
        return; // 短路
    }

    await next();
});

// 终端中间件
app.Run(async context =>
{
    await context.Response.WriteAsync("Hello World!");
});
```

### 内置中间件

```csharp
var app = builder.Build();

// 静态文件（wwwroot）
app.UseStaticFiles();

// 自定义静态文件路径
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "StaticFiles")),
    RequestPath = "/static"
});

// HTTPS 重定向
app.UseHttpsRedirection();

// HSTS（HTTP 严格传输安全）
app.UseHsts();

// 响应压缩
app.UseResponseCompression();

// 响应缓存
app.UseResponseCaching();

// CORS
app.UseCors("AllowAll");

// 身份验证和授权
app.UseAuthentication();
app.UseAuthorization();

// 路由
app.UseRouting();

// 端点映射
app.MapControllers();
```

### 自定义中间件类

```csharp
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        // 添加计时头
        context.Response.OnStarting(() =>
        {
            stopwatch.Stop();
            context.Response.Headers["X-Response-Time"] = $"{stopwatch.ElapsedMilliseconds}ms";
            return Task.CompletedTask;
        });

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation(
                "Request {Method} {Path} completed in {ElapsedMs}ms with status {StatusCode}",
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds,
                context.Response.StatusCode);
        }
    }
}

// 用于简洁注册的扩展方法
public static class RequestTimingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestTimingMiddleware>();
    }
}

// 使用
app.UseRequestTiming();
```

### 带依赖项的中间件

```csharp
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    // 作用域服务必须注入到 InvokeAsync，而不是构造函数
    public async Task InvokeAsync(HttpContext context, IRateLimiter rateLimiter)
    {
        var clientId = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (!await rateLimiter.IsAllowedAsync(clientId))
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
        }

        await _next(context);
    }
}
```

### 条件中间件

```csharp
var app = builder.Build();

// 将中间件映射到特定路径
app.Map("/api", apiApp =>
{
    apiApp.UseMiddleware<ApiKeyMiddleware>();
    apiApp.UseRouting();
    apiApp.UseEndpoints(endpoints => endpoints.MapControllers());
});

// 基于请求的条件中间件
app.MapWhen(
    context => context.Request.Query.ContainsKey("debug"),
    debugApp =>
    {
        debugApp.UseMiddleware<DebugMiddleware>();
    });

// Use when（内联条件）
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/admin"),
    adminApp =>
    {
        adminApp.UseMiddleware<AdminAuthMiddleware>();
    });
```

## 路由

ASP.NET Core 为 MVC 和最小 API 提供了强大的路由功能。

### 特性路由

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // GET api/products
    [HttpGet]
    public IActionResult GetAll() => Ok(_products);

    // GET api/products/5
    [HttpGet("{id}")]
    public IActionResult GetById(int id) => Ok(_products.Find(p => p.Id == id));

    // GET api/products/category/electronics
    [HttpGet("category/{categoryName}")]
    public IActionResult GetByCategory(string categoryName) => Ok();

    // POST api/products
    [HttpPost]
    public IActionResult Create([FromBody] Product product) => CreatedAtAction(nameof(GetById), new { id = product.Id }, product);

    // PUT api/products/5
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] Product product) => NoContent();

    // DELETE api/products/5
    [HttpDelete("{id}")]
    public IActionResult Delete(int id) => NoContent();

    // 多个路由模板
    [HttpGet]
    [Route("search")]
    [Route("find")]
    public IActionResult Search([FromQuery] string q) => Ok();
}
```

### 路由约束

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    // 仅匹配整数 ID
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id) => Ok();

    // 仅匹配 GUID
    [HttpGet("guid/{id:guid}")]
    public IActionResult GetByGuid(Guid id) => Ok();

    // 带长度约束的字符串
    [HttpGet("code/{code:length(6)}")]
    public IActionResult GetByCode(string code) => Ok();

    // 范围约束
    [HttpGet("page/{page:int:min(1):max(100)}")]
    public IActionResult GetPage(int page) => Ok();

    // 正则表达式约束
    [HttpGet("sku/{sku:regex(^[A-Z]{{2}}\\d{{4}}$)}")]
    public IActionResult GetBySku(string sku) => Ok();

    // 可选参数
    [HttpGet("category/{category?}")]
    public IActionResult GetByCategory(string category = "all") => Ok();

    // 通配符参数
    [HttpGet("files/{*filePath}")]
    public IActionResult GetFile(string filePath) => Ok();
}
```

### 传统路由（MVC）

```csharp
var app = builder.Build();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// 区域路由
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

// 自定义路由
app.MapControllerRoute(
    name: "blog",
    pattern: "blog/{year:int}/{month:int}/{slug}",
    defaults: new { controller = "Blog", action = "Post" });
```

### 最小 API 路由

```csharp
var app = builder.Build();

// 基本路由
app.MapGet("/", () => "Hello World!");

app.MapGet("/products", async (ProductService service) =>
    await service.GetAllAsync());

app.MapGet("/products/{id}", async (int id, ProductService service) =>
    await service.GetByIdAsync(id) is Product product
        ? Results.Ok(product)
        : Results.NotFound());

app.MapPost("/products", async (Product product, ProductService service) =>
{
    await service.CreateAsync(product);
    return Results.Created($"/products/{product.Id}", product);
});

app.MapPut("/products/{id}", async (int id, Product product, ProductService service) =>
{
    await service.UpdateAsync(id, product);
    return Results.NoContent();
});

app.MapDelete("/products/{id}", async (int id, ProductService service) =>
{
    await service.DeleteAsync(id);
    return Results.NoContent();
});

// 路由组
var api = app.MapGroup("/api");
var products = api.MapGroup("/products");

products.MapGet("/", GetAllProducts);
products.MapGet("/{id}", GetProductById);
products.MapPost("/", CreateProduct);
```

### 路由组和过滤器

```csharp
var app = builder.Build();

// 带通用前缀和过滤器的组
var adminApi = app.MapGroup("/api/admin")
    .RequireAuthorization("AdminPolicy")
    .AddEndpointFilter<AuditLogFilter>();

adminApi.MapGet("/users", GetUsers);
adminApi.MapDelete("/users/{id}", DeleteUser);

// 端点过滤器
public class AuditLogFilter : IEndpointFilter
{
    private readonly ILogger<AuditLogFilter> _logger;

    public AuditLogFilter(ILogger<AuditLogFilter> logger)
    {
        _logger = logger;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        _logger.LogInformation("Admin API accessed: {Path}", context.HttpContext.Request.Path);
        return await next(context);
    }
}
```


## 控制器和操作

控制器处理传入的 HTTP 请求并返回响应。

### 控制器基础

```csharp
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var customers = await _customerService.GetAllAsync(page, pageSize);
        return Ok(customers);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var customer = await _customerService.GetByIdAsync(id);

        if (customer == null)
        {
            _logger.LogWarning("Customer with ID {Id} not found", id);
            return NotFound();
        }

        return Ok(customer);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto dto)
    {
        var customer = await _customerService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerDto dto)
    {
        var success = await _customerService.UpdateAsync(id, dto);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _customerService.DeleteAsync(id);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
```

### 操作返回类型

```csharp
[ApiController]
[Route("api/[controller]")]
public class ExamplesController : ControllerBase
{
    // 返回特定类型
    [HttpGet("string")]
    public string GetString() => "Hello";

    // 返回 IActionResult 以获得灵活性
    [HttpGet("action-result")]
    public IActionResult GetActionResult()
    {
        return Ok(new { message = "Success" });
    }

    // 返回 ActionResult<T> 用于类型化响应
    [HttpGet("typed/{id}")]
    public ActionResult<Product> GetTyped(int id)
    {
        var product = _repository.GetById(id);
        if (product == null) return NotFound();
        return product; // 隐式 Ok()
    }

    // 带 ActionResult<T> 的异步
    [HttpGet("async/{id}")]
    public async Task<ActionResult<Product>> GetAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    // 返回文件
    [HttpGet("file")]
    public IActionResult GetFile()
    {
        var bytes = System.IO.File.ReadAllBytes("path/to/file.pdf");
        return File(bytes, "application/pdf", "document.pdf");
    }

    // 返回流
    [HttpGet("stream")]
    public IActionResult GetStream()
    {
        var stream = new FileStream("path/to/file.pdf", FileMode.Open);
        return File(stream, "application/pdf");
    }

    // 重定向
    [HttpGet("redirect")]
    public IActionResult Redirect()
    {
        return RedirectToAction("GetString");
        // 或：return Redirect("https://example.com");
        // 或：return RedirectPermanent("https://example.com");
    }
}
```

### 操作过滤器

```csharp
// 操作过滤器特性
public class ValidateModelAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            context.Result = new BadRequestObjectResult(context.ModelState);
        }
    }
}

// 异步操作过滤器
public class LoggingActionFilter : IAsyncActionFilter
{
    private readonly ILogger<LoggingActionFilter> _logger;

    public LoggingActionFilter(ILogger<LoggingActionFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        _logger.LogInformation("Executing action {Action}", context.ActionDescriptor.DisplayName);

        var resultContext = await next();

        if (resultContext.Exception != null)
        {
            _logger.LogError(resultContext.Exception, "Action threw exception");
        }
        else
        {
            _logger.LogInformation("Action executed successfully");
        }
    }
}

// 全局注册
builder.Services.AddControllers(options =>
{
    options.Filters.Add<LoggingActionFilter>();
    options.Filters.Add(new ValidateModelAttribute());
});

// 或在特定控制器/操作上使用
[ValidateModel]
[ServiceFilter(typeof(LoggingActionFilter))]
public class ProductsController : ControllerBase
{
}
```

## Web API 开发

使用 ASP.NET Core 构建 RESTful API。

### API 控制器配置

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 添加 XML 格式化器
builder.Services.AddControllers()
    .AddXmlSerializerFormatters();

// 配置 API 行为
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = false;
    options.SuppressMapClientErrors = false;

    // 自定义无效模型状态响应
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .Select(e => new
            {
                Field = e.Key,
                Messages = e.Value.Errors.Select(err => err.ErrorMessage)
            });

        return new BadRequestObjectResult(new
        {
            Type = "ValidationError",
            Title = "One or more validation errors occurred",
            Errors = errors
        });
    };
});
```

### 内容协商

```csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json", "application/xml")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [Produces("application/json")]
    public ActionResult<IEnumerable<Product>> GetAll()
    {
        return Ok(_products);
    }

    // 接受特定内容类型
    [HttpPost]
    [Consumes("application/json")]
    public ActionResult<Product> Create([FromBody] Product product)
    {
        return Created($"/api/products/{product.Id}", product);
    }

    // 多种内容类型
    [HttpPost("bulk")]
    [Consumes("application/json", "text/csv")]
    public ActionResult ImportProducts([FromBody] string data)
    {
        // 根据内容类型处理
        return Ok();
    }
}
```

### API 版本控制

```csharp
// 安装：dotnet add package Asp.Versioning.Mvc

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new QueryStringApiVersionReader("api-version"),
        new HeaderApiVersionReader("X-Api-Version"));
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// 版本 1 控制器
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class ProductsV1Controller : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(new[] { "Product1", "Product2" });
}

// 版本 2 控制器
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("2.0")]
public class ProductsV2Controller : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(new[]
    {
        new { Id = 1, Name = "Product1", Price = 9.99 },
        new { Id = 2, Name = "Product2", Price = 19.99 }
    });
}
```

### OpenAPI/Swagger 文档

```csharp
// 安装：dotnet add package Swashbuckle.AspNetCore

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "A sample API for demonstration",
        Contact = new OpenApiContact
        {
            Name = "Support",
            Email = "support@example.com"
        }
    });

    // 包含 XML 注释
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

    // 向 Swagger 添加 JWT 身份验证
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "My API v1");
        options.RoutePrefix = string.Empty; // Swagger 在根路径
    });
}
```

### 使用 XML 注释的 API 文档

```csharp
/// <summary>
/// 管理产品操作
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    /// <summary>
    /// 获取所有产品
    /// </summary>
    /// <param name="category">可选的分类过滤器</param>
    /// <param name="minPrice">最低价格过滤器</param>
    /// <returns>产品列表</returns>
    /// <response code="200">返回产品列表</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<ProductDto>> GetAll(
        [FromQuery] string? category = null,
        [FromQuery] decimal? minPrice = null)
    {
        // 实现
        return Ok(new List<ProductDto>());
    }

    /// <summary>
    /// 创建新产品
    /// </summary>
    /// <param name="dto">产品创建数据</param>
    /// <returns>创建的产品</returns>
    /// <response code="201">产品创建成功</response>
    /// <response code="400">无效的产品数据</response>
    /// <example>
    /// POST /api/products
    /// {
    ///     "name": "New Product",
    ///     "price": 29.99
    /// }
    /// </example>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<ProductDto> Create([FromBody] CreateProductDto dto)
    {
        // 实现
        return CreatedAtAction(nameof(GetById), new { id = 1 }, new ProductDto());
    }
}
```


## 模型绑定和验证

ASP.NET Core 自动将 HTTP 请求数据绑定到操作参数。

### 模型绑定源

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    // 从路由
    [HttpGet("{id}")]
    public IActionResult GetById([FromRoute] int id) => Ok();

    // 从查询字符串：/api/orders/search?term=laptop&page=1
    [HttpGet("search")]
    public IActionResult Search(
        [FromQuery] string term,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) => Ok();

    // 从请求体（JSON）
    [HttpPost]
    public IActionResult Create([FromBody] CreateOrderDto dto) => Ok();

    // 从表单数据
    [HttpPost("upload")]
    public IActionResult Upload([FromForm] UploadModel model) => Ok();

    // 从请求头
    [HttpGet("with-header")]
    public IActionResult GetWithHeader([FromHeader(Name = "X-Correlation-Id")] string correlationId) => Ok();

    // 从服务（DI）
    [HttpGet("with-service")]
    public IActionResult GetWithService([FromServices] IOrderService orderService) => Ok();

    // 复杂绑定
    [HttpGet("complex")]
    public IActionResult Complex(
        [FromRoute] int id,
        [FromQuery] FilterOptions filter,
        [FromHeader(Name = "X-Request-Id")] string requestId) => Ok();
}

public class FilterOptions
{
    public string? Category { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? SortBy { get; set; }
    public bool Descending { get; set; }
}
```

### 使用数据注解的模型验证

```csharp
public class CreateProductDto
{
    [Required(ErrorMessage = "产品名称是必需的")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "名称必须在 3 到 100 个字符之间")]
    public string Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "价格必须在 0.01 到 999999.99 之间")]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "库存不能为负数")]
    public int StockQuantity { get; set; }

    [Required]
    [RegularExpression(@"^[A-Z]{2}\d{4}$", ErrorMessage = "SKU 必须是 2 个字母后跟 4 个数字")]
    public string Sku { get; set; }

    [Url(ErrorMessage = "无效的 URL 格式")]
    public string? ImageUrl { get; set; }

    [EmailAddress]
    public string? SupplierEmail { get; set; }

    [Phone]
    public string? SupplierPhone { get; set; }

    [CreditCard]
    public string? PaymentCard { get; set; }

    [Compare(nameof(Price), ErrorMessage = "促销价格必须与价格匹配")]
    public decimal? SalePrice { get; set; }
}

public class RegisterUserDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 8)]
    [DataType(DataType.Password)]
    public string Password { get; set; }

    [Required]
    [Compare(nameof(Password), ErrorMessage = "密码不匹配")]
    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; }

    [Required]
    [DataType(DataType.Date)]
    public DateTime DateOfBirth { get; set; }
}
```

### 自定义验证特性

```csharp
// 自定义验证特性
public class FutureDateAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is DateTime dateTime)
        {
            if (dateTime <= DateTime.Now)
            {
                return new ValidationResult(ErrorMessage ?? "日期必须是将来的日期");
            }
        }

        return ValidationResult.Success;
    }
}

// 带依赖注入的验证特性
public class UniqueEmailAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        var userService = validationContext.GetService(typeof(IUserService)) as IUserService;

        if (value is string email && userService != null)
        {
            if (userService.EmailExists(email))
            {
                return new ValidationResult("邮箱已存在");
            }
        }

        return ValidationResult.Success;
    }
}

// 使用
public class CreateUserDto
{
    [Required]
    [EmailAddress]
    [UniqueEmail]
    public string Email { get; set; }

    [FutureDate(ErrorMessage = "订阅必须从将来开始")]
    public DateTime SubscriptionStartDate { get; set; }
}
```

### IValidatableObject 用于复杂验证

```csharp
public class OrderDto : IValidatableObject
{
    public DateTime OrderDate { get; set; }
    public DateTime? ShipDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // 发货日期必须在订单日期之后
        if (ShipDate.HasValue && ShipDate.Value < OrderDate)
        {
            yield return new ValidationResult(
                "发货日期不能早于订单日期",
                new[] { nameof(ShipDate) });
        }

        // 折扣不能超过总额
        if (DiscountAmount > TotalAmount)
        {
            yield return new ValidationResult(
                "折扣不能超过总金额",
                new[] { nameof(DiscountAmount) });
        }

        // 必须至少有一个项目
        if (!Items.Any())
        {
            yield return new ValidationResult(
                "订单必须至少有一个项目",
                new[] { nameof(Items) });
        }

        // 验证总额与项目匹配
        var calculatedTotal = Items.Sum(i => i.Quantity * i.UnitPrice);
        if (Math.Abs(calculatedTotal - TotalAmount) > 0.01m)
        {
            yield return new ValidationResult(
                "总金额与项目总计不匹配",
                new[] { nameof(TotalAmount) });
        }
    }
}
```

### FluentValidation 集成

```csharp
// 安装：dotnet add package FluentValidation.AspNetCore

public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductDtoValidator(IProductService productService)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("名称是必需的")
            .Length(3, 100).WithMessage("名称必须在 3 到 100 个字符之间")
            .MustAsync(async (name, cancellation) =>
                !await productService.ProductNameExistsAsync(name))
            .WithMessage("产品名称已存在");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("价格必须大于 0")
            .LessThanOrEqualTo(999999.99m);

        RuleFor(x => x.Sku)
            .NotEmpty()
            .Matches(@"^[A-Z]{2}\d{4}$")
            .WithMessage("SKU 必须是 2 个字母后跟 4 个数字");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0);

        When(x => x.SalePrice.HasValue, () =>
        {
            RuleFor(x => x.SalePrice)
                .LessThan(x => x.Price)
                .WithMessage("促销价格必须低于正常价格");
        });
    }
}

// 注册
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductDtoValidator>();

// 在控制器中手动验证
[HttpPost]
public async Task<IActionResult> Create(
    [FromBody] CreateProductDto dto,
    IValidator<CreateProductDto> validator)
{
    var validationResult = await validator.ValidateAsync(dto);

    if (!validationResult.IsValid)
    {
        return BadRequest(validationResult.Errors);
    }

    // 处理有效的 dto
    return Ok();
}
```

## MVC 视图和 Razor

ASP.NET Core MVC 使用 Razor 语法进行服务器端 HTML 渲染。

### 基本视图结构

```csharp
// HomeController.cs
public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Details(int id)
    {
        var product = _productService.GetById(id);
        return View(product);
    }

    public IActionResult List()
    {
        var products = _productService.GetAll();
        return View(products);
    }
}
```

```html
<!-- Views/Home/Index.cshtml -->
@{
    ViewData["Title"] = "主页";
}

<div class="text-center">
    <h1 class="display-4">欢迎</h1>
    <p>了解更多关于 <a href="https://docs.microsoft.com/aspnet/core">ASP.NET Core</a>。</p>
</div>
```

### Razor 语法

```html
@* Views/Product/Details.cshtml *@
@model ProductViewModel

@{
    ViewData["Title"] = Model.Name;
    var discount = Model.Price * 0.1m;
}

<h1>@Model.Name</h1>
<p>价格：@Model.Price.ToString("C")</p>

@* 条件渲染 *@
@if (Model.IsInStock)
{
    <span class="badge bg-success">有货</span>
}
else
{
    <span class="badge bg-danger">缺货</span>
}

@* 循环 *@
<ul>
@foreach (var category in Model.Categories)
{
    <li>@category</li>
}
</ul>

@* Switch 表达式 *@
@switch (Model.Status)
{
    case ProductStatus.Active:
        <span class="text-success">活跃</span>
        break;
    case ProductStatus.Discontinued:
        <span class="text-danger">已停产</span>
        break;
    default:
        <span class="text-muted">未知</span>
        break;
}

@* 原始 HTML 输出 *@
@Html.Raw(Model.HtmlDescription)

@* URL 生成 *@
<a href="@Url.Action("Edit", "Product", new { id = Model.Id })">编辑</a>

@* 表单示例 *@
<form asp-controller="Product" asp-action="Update" method="post">
    <input type="hidden" asp-for="Id" />
    <div class="mb-3">
        <label asp-for="Name" class="form-label"></label>
        <input asp-for="Name" class="form-control" />
        <span asp-validation-for="Name" class="text-danger"></span>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
```

### 布局和分部视图

```html
<!-- Views/Shared/_Layout.cshtml -->
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewData["Title"] - 我的应用</title>
    <link rel="stylesheet" href="~/css/site.css" />
    @await RenderSectionAsync("Styles", required: false)
</head>
<body>
    <header>
        <nav class="navbar navbar-expand-sm">
            <partial name="_NavPartial" />
        </nav>
    </header>

    <main role="main" class="container">
        @RenderBody()
    </main>

    <footer class="footer">
        <div class="container">
            <span class="text-muted">&copy; @DateTime.Now.Year - 我的应用</span>
        </div>
    </footer>

    <script src="~/js/site.js"></script>
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
```

```html
<!-- Views/Shared/_ProductCard.cshtml -->
@model ProductViewModel

<div class="card">
    <img src="@Model.ImageUrl" class="card-img-top" alt="@Model.Name">
    <div class="card-body">
        <h5 class="card-title">@Model.Name</h5>
        <p class="card-text">@Model.Description</p>
        <p class="card-text"><strong>@Model.Price.ToString("C")</strong></p>
        <a asp-action="Details" asp-route-id="@Model.Id" class="btn btn-primary">查看详情</a>
    </div>
</div>
```

```html
<!-- 使用分部视图 -->
@model IEnumerable<ProductViewModel>

<div class="row">
@foreach (var product in Model)
{
    <div class="col-md-4">
        <partial name="_ProductCard" model="product" />
    </div>
}
</div>
```

### 视图组件

```csharp
// ViewComponents/ShoppingCartViewComponent.cs
public class ShoppingCartViewComponent : ViewComponent
{
    private readonly IShoppingCartService _cartService;

    public ShoppingCartViewComponent(IShoppingCartService cartService)
    {
        _cartService = cartService;
    }

    public async Task<IViewComponentResult> InvokeAsync()
    {
        var cart = await _cartService.GetCurrentCartAsync();
        return View(cart);
    }
}
```

```html
<!-- Views/Shared/Components/ShoppingCart/Default.cshtml -->
@model ShoppingCartViewModel

<div class="shopping-cart-widget">
    <i class="bi bi-cart"></i>
    <span class="badge bg-primary">@Model.ItemCount</span>
    <span class="total">@Model.Total.ToString("C")</span>
</div>
```

```html
<!-- 使用视图组件 -->
@await Component.InvokeAsync("ShoppingCart")

<!-- 或使用标签助手 -->
<vc:shopping-cart></vc:shopping-cart>
```

### 标签助手

```html
@* 内置标签助手 *@
<a asp-controller="Product" asp-action="Details" asp-route-id="@product.Id">查看</a>

<form asp-controller="Product" asp-action="Create" asp-antiforgery="true">
    <input asp-for="Name" class="form-control" />
    <span asp-validation-for="Name"></span>

    <select asp-for="CategoryId" asp-items="@ViewBag.Categories"></select>

    <textarea asp-for="Description"></textarea>
</form>

<img src="~/images/logo.png" asp-append-version="true" />

<environment include="Development">
    <link rel="stylesheet" href="~/css/site.css" />
</environment>
<environment exclude="Development">
    <link rel="stylesheet" href="~/css/site.min.css" asp-append-version="true" />
</environment>
```

```csharp
// 自定义标签助手
[HtmlTargetElement("alert")]
public class AlertTagHelper : TagHelper
{
    public string Type { get; set; } = "info";
    public string? Title { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.Attributes.SetAttribute("class", $"alert alert-{Type}");
        output.Attributes.SetAttribute("role", "alert");

        if (!string.IsNullOrEmpty(Title))
        {
            output.PreContent.SetHtmlContent($"<strong>{Title}</strong> ");
        }
    }
}

// 使用：<alert type="warning" title="警告！">这是一条警告消息。</alert>
```


## 身份验证和授权

ASP.NET Core 提供全面的身份验证和授权支持。

### Cookie 身份验证

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    });

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
```

```csharp
public class AccountController : Controller
{
    [HttpPost]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (await _userService.ValidateCredentialsAsync(model.Email, model.Password))
        {
            var user = await _userService.GetByEmailAsync(model.Email);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
                });

            return RedirectToAction("Index", "Home");
        }

        ModelState.AddModelError("", "无效的凭据");
        return View(model);
    }

    [HttpPost]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Index", "Home");
    }
}
```

### JWT 身份验证

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});
```

```csharp
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
```

### 授权策略

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthorization(options =>
{
    // 基于角色的策略
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    // 基于声明的策略
    options.AddPolicy("CanEditArticles", policy =>
        policy.RequireClaim("Permission", "EditArticles"));

    // 多重要求
    options.AddPolicy("SeniorEmployee", policy =>
        policy.RequireRole("Employee")
              .RequireClaim("Department")
              .RequireAssertion(context =>
              {
                  var startDateClaim = context.User.FindFirst("StartDate");
                  if (startDateClaim != null && DateTime.TryParse(startDateClaim.Value, out var startDate))
                  {
                      return (DateTime.Now - startDate).TotalDays > 365 * 2;
                  }
                  return false;
              }));

    // 自定义要求
    options.AddPolicy("MinimumAge", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
});
```

```csharp
// 自定义授权要求
public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; }

    public MinimumAgeRequirement(int minimumAge)
    {
        MinimumAge = minimumAge;
    }
}

// 授权处理程序
public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        var dateOfBirthClaim = context.User.FindFirst("DateOfBirth");

        if (dateOfBirthClaim != null && DateTime.TryParse(dateOfBirthClaim.Value, out var dateOfBirth))
        {
            var age = DateTime.Today.Year - dateOfBirth.Year;
            if (dateOfBirth > DateTime.Today.AddYears(-age)) age--;

            if (age >= requirement.MinimumAge)
            {
                context.Succeed(requirement);
            }
        }

        return Task.CompletedTask;
    }
}

// 注册处理程序
builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();
```

### 使用授权

```csharp
[Authorize] // 需要已认证用户
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [AllowAnonymous] // 覆盖类级别的授权
    [HttpGet]
    public IActionResult GetAll() => Ok();

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public IActionResult Create([FromBody] ProductDto dto) => Ok();

    [Authorize(Policy = "CanEditArticles")]
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] ProductDto dto) => Ok();

    [Authorize(Policy = "SeniorEmployee")]
    [HttpDelete("{id}")]
    public IActionResult Delete(int id) => Ok();
}

// 基于资源的授权
public class ArticleController : Controller
{
    private readonly IAuthorizationService _authorizationService;

    public ArticleController(IAuthorizationService authorizationService)
    {
        _authorizationService = authorizationService;
    }

    [HttpPost("{id}/edit")]
    public async Task<IActionResult> Edit(int id, ArticleDto dto)
    {
        var article = await _articleService.GetByIdAsync(id);

        var authResult = await _authorizationService.AuthorizeAsync(
            User, article, "CanEditArticle");

        if (!authResult.Succeeded)
        {
            return Forbid();
        }

        // 编辑文章
        return Ok();
    }
}
```

## 错误处理

正确的错误处理确保良好的用户体验并有助于调试。

### 全局异常处理程序

```csharp
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// 自定义异常处理程序中间件
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();

        if (exceptionFeature != null)
        {
            var error = new
            {
                StatusCode = context.Response.StatusCode,
                Message = "发生内部服务器错误",
                Detail = app.Environment.IsDevelopment()
                    ? exceptionFeature.Error.Message
                    : null
            };

            await context.Response.WriteAsJsonAsync(error);
        }
    });
});
```

### 异常处理中间件

```csharp
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "发生未处理的异常");

        var (statusCode, message) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, exception.Message),
            ValidationException => (StatusCodes.Status400BadRequest, exception.Message),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "未授权"),
            ForbiddenException => (StatusCodes.Status403Forbidden, "禁止访问"),
            ConflictException => (StatusCodes.Status409Conflict, exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "发生错误")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse
        {
            StatusCode = statusCode,
            Message = message,
            TraceId = context.TraceIdentifier
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; }
    public string TraceId { get; set; }
}
```

### 自定义异常

```csharp
public abstract class AppException : Exception
{
    public int StatusCode { get; }

    protected AppException(string message, int statusCode = 500) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message, 404) { }

    public NotFoundException(string entityName, object id)
        : base($"未找到 ID 为 {id} 的 {entityName}", 404) { }
}

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("验证失败", 400)
    {
        Errors = errors;
    }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409) { }
}

// 在服务中使用
public class ProductService
{
    public async Task<Product> GetByIdAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);

        if (product == null)
        {
            throw new NotFoundException(nameof(Product), id);
        }

        return product;
    }
}
```

### Problem Details（RFC 7807）

```csharp
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        context.ProblemDetails.Extensions["nodeId"] = Environment.MachineName;
    };
});

// 自定义问题详情工厂
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problemDetails = new ValidationProblemDetails(context.ModelState)
            {
                Type = "https://example.com/validation-error",
                Title = "验证错误",
                Status = StatusCodes.Status400BadRequest,
                Instance = context.HttpContext.Request.Path
            };

            problemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

            return new BadRequestObjectResult(problemDetails);
        };
    });
```

## 日志记录

ASP.NET Core 包含一个内置的日志框架，支持多种提供程序。

### 日志配置

```csharp
var builder = WebApplication.CreateBuilder(args);

// 配置日志
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventSourceLogger();

// 从 appsettings.json 配置
builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));

// 设置最低级别
builder.Logging.SetMinimumLevel(LogLevel.Information);

// 过滤特定类别
builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);
builder.Logging.AddFilter("System", LogLevel.Warning);
builder.Logging.AddFilter("MyApp", LogLevel.Debug);
```

### appsettings.json 日志配置

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning",
      "MyApp": "Debug"
    },
    "Console": {
      "IncludeScopes": true,
      "LogLevel": {
        "Default": "Information"
      }
    }
  }
}
```

### 使用 ILogger

```csharp
public class ProductService : IProductService
{
    private readonly ILogger<ProductService> _logger;
    private readonly IProductRepository _repository;

    public ProductService(ILogger<ProductService> logger, IProductRepository repository)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<Product> GetByIdAsync(int id)
    {
        _logger.LogDebug("正在获取 ID 为 {ProductId} 的产品", id);

        try
        {
            var product = await _repository.GetByIdAsync(id);

            if (product == null)
            {
                _logger.LogWarning("未找到 ID 为 {ProductId} 的产品", id);
                return null;
            }

            _logger.LogInformation("成功获取产品 {ProductName}（ID：{ProductId}）",
                product.Name, product.Id);

            return product;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取 ID 为 {ProductId} 的产品时出错", id);
            throw;
        }
    }

    public async Task CreateAsync(Product product)
    {
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["ProductName"] = product.Name,
            ["SKU"] = product.Sku
        }))
        {
            _logger.LogInformation("正在创建新产品");

            await _repository.AddAsync(product);
            await _repository.SaveChangesAsync();

            _logger.LogInformation("产品已创建，ID 为 {ProductId}", product.Id);
        }
    }
}
```

### 高性能日志

```csharp
// 在编译时定义日志消息以获得更好的性能
public static partial class LogMessages
{
    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Information,
        Message = "正在处理客户 {CustomerId} 的订单 {OrderId}")]
    public static partial void ProcessingOrder(ILogger logger, int orderId, int customerId);

    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Warning,
        Message = "订单 {OrderId} 处理时间超出预期：{ElapsedMs}ms")]
    public static partial void OrderProcessingSlow(ILogger logger, int orderId, long elapsedMs);

    [LoggerMessage(
        EventId = 1002,
        Level = LogLevel.Error,
        Message = "处理订单 {OrderId} 失败")]
    public static partial void OrderProcessingFailed(ILogger logger, Exception ex, int orderId);
}

// 使用
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public async Task ProcessOrderAsync(int orderId, int customerId)
    {
        LogMessages.ProcessingOrder(_logger, orderId, customerId);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            // 处理订单
            await Task.Delay(100);

            stopwatch.Stop();

            if (stopwatch.ElapsedMilliseconds > 500)
            {
                LogMessages.OrderProcessingSlow(_logger, orderId, stopwatch.ElapsedMilliseconds);
            }
        }
        catch (Exception ex)
        {
            LogMessages.OrderProcessingFailed(_logger, ex, orderId);
            throw;
        }
    }
}
```

### 使用 Serilog 进行结构化日志

```csharp
// 安装：dotnet add package Serilog.AspNetCore

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File("logs/app-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7)
        .WriteTo.Seq("http://localhost:5341");
});

var app = builder.Build();

app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
    };
});
```


## 测试

测试对于构建可靠的 ASP.NET Core 应用程序至关重要。

### 控制器单元测试

```csharp
public class ProductsControllerTests
{
    private readonly Mock<IProductService> _mockService;
    private readonly ProductsController _controller;

    public ProductsControllerTests()
    {
        _mockService = new Mock<IProductService>();
        _controller = new ProductsController(_mockService.Object);
    }

    [Fact]
    public async Task GetById_ReturnsProduct_WhenProductExists()
    {
        // 准备
        var productId = 1;
        var product = new ProductDto { Id = productId, Name = "Test Product" };
        _mockService.Setup(s => s.GetByIdAsync(productId))
            .ReturnsAsync(product);

        // 执行
        var result = await _controller.GetById(productId);

        // 断言
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedProduct = Assert.IsType<ProductDto>(okResult.Value);
        Assert.Equal(productId, returnedProduct.Id);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenProductDoesNotExist()
    {
        // 准备
        _mockService.Setup(s => s.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync((ProductDto)null);

        // 执行
        var result = await _controller.GetById(999);

        // 断言
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction_WithValidProduct()
    {
        // 准备
        var createDto = new CreateProductDto { Name = "New Product", Price = 9.99m };
        var createdProduct = new ProductDto { Id = 1, Name = "New Product", Price = 9.99m };

        _mockService.Setup(s => s.CreateAsync(createDto))
            .ReturnsAsync(createdProduct);

        // 执行
        var result = await _controller.Create(createDto);

        // 断言
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ProductsController.GetById), createdResult.ActionName);
    }
}
```

### 使用 WebApplicationFactory 进行集成测试

```csharp
public class ProductsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public ProductsApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // 移除现有 DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // 添加内存数据库
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));

                // 填充测试数据
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.Database.EnsureCreated();
                SeedTestData(db);
            });
        });

        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsSuccessAndProducts()
    {
        // 执行
        var response = await _client.GetAsync("/api/products");

        // 断言
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(products);
    }

    [Fact]
    public async Task Create_ReturnsCreated_WithValidProduct()
    {
        // 准备
        var newProduct = new CreateProductDto
        {
            Name = "Test Product",
            Price = 19.99m,
            Sku = "TP0001"
        };

        // 执行
        var response = await _client.PostAsJsonAsync("/api/products", newProduct);

        // 断言
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Contains("/api/products/", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WithInvalidProduct()
    {
        // 准备
        var invalidProduct = new CreateProductDto { Name = "", Price = -1 };

        // 执行
        var response = await _client.PostAsJsonAsync("/api/products", invalidProduct);

        // 断言
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private void SeedTestData(ApplicationDbContext db)
    {
        db.Products.AddRange(
            new Product { Id = 1, Name = "Product 1", Price = 9.99m, Sku = "P0001" },
            new Product { Id = 2, Name = "Product 2", Price = 19.99m, Sku = "P0002" }
        );
        db.SaveChanges();
    }
}
```

### 带身份验证的测试

```csharp
public class AuthenticatedApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthenticatedApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(string role = "User")
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                        "Test", options => { });
            });
        })
        .CreateClient();
    }

    [Fact]
    public async Task AdminEndpoint_ReturnsUnauthorized_WithoutAuth()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/admin/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoint_ReturnsOk_WithAdminAuth()
    {
        var client = CreateAuthenticatedClient("Admin");

        var response = await client.GetAsync("/api/admin/users");

        response.EnsureSuccessStatusCode();
    }
}

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user"),
            new Claim(ClaimTypes.Name, "Test User"),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
```

### 最小 API 测试

```csharp
public class MinimalApiTests
{
    [Fact]
    public async Task GetProducts_ReturnsOk()
    {
        await using var app = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    services.AddSingleton<IProductService, MockProductService>();
                });
            });

        var client = app.CreateClient();

        var response = await client.GetAsync("/api/products");

        response.EnsureSuccessStatusCode();
    }
}
```

## 最佳实践

### 项目结构

```
src/
├── MyApp.Api/                    # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Filters/
│   ├── Middleware/
│   ├── Extensions/
│   └── Program.cs
├── MyApp.Application/            # 业务逻辑
│   ├── Services/
│   ├── DTOs/
│   ├── Validators/
│   └── Interfaces/
├── MyApp.Domain/                 # 领域实体
│   ├── Entities/
│   ├── Enums/
│   └── Exceptions/
└── MyApp.Infrastructure/         # 数据访问、外部服务
    ├── Data/
    ├── Repositories/
    └── Services/
```

### 服务注册扩展

```csharp
public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ICustomerService, CustomerService>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}

// 在 Program.cs 中使用
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
```

### 响应包装模式

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public IEnumerable<string>? Errors { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResponse(string message, IEnumerable<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors
        };
    }
}

// 在控制器中使用
[HttpGet("{id}")]
public async Task<ActionResult<ApiResponse<ProductDto>>> GetById(int id)
{
    var product = await _productService.GetByIdAsync(id);

    if (product == null)
    {
        return NotFound(ApiResponse<ProductDto>.ErrorResponse("未找到产品"));
    }

    return Ok(ApiResponse<ProductDto>.SuccessResponse(product));
}
```

### 健康检查

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database")
    .AddRedis(builder.Configuration.GetConnectionString("Redis"), "redis")
    .AddUrlGroup(new Uri("https://api.external.com/health"), "external-api")
    .AddCheck<CustomHealthCheck>("custom");

var app = builder.Build();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            Status = report.Status.ToString(),
            Duration = report.TotalDuration,
            Checks = report.Entries.Select(e => new
            {
                Name = e.Key,
                Status = e.Value.Status.ToString(),
                Duration = e.Value.Duration,
                Description = e.Value.Description
            })
        };

        await context.Response.WriteAsJsonAsync(response);
    }
});

// 就绪和存活端点
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
```

### CORS 配置

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins(
                "https://example.com",
                "https://app.example.com")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });

    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowSpecificOrigins");
```

### 速率限制

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 10
            });
    });

    options.AddPolicy("Api", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("超出速率限制", cancellationToken);
    };
});

var app = builder.Build();
app.UseRateLimiter();
```

### 最佳实践总结

1. **使用依赖注入**贯穿整个应用程序
2. **使用分层架构分离关注点**（API、Application、Domain、Infrastructure）
3. **使用 DTO** 在各层之间传输数据
4. **在 API 边界验证输入**使用模型验证
5. **全局处理异常**提供一致的错误响应
6. **所有 I/O 操作使用 async/await**
7. **为每个环境适当配置日志**
8. **实现健康检查**用于监控
9. **使用配置选项模式**实现强类型设置
10. **在多个级别编写测试**（单元测试、集成测试、端到端测试）
11. **使用 OpenAPI/Swagger 文档化 API**
12. **实现适当的身份验证和授权**
13. **使用速率限制**防止滥用
14. **根据安全需求适当配置 CORS**

## 总结

ASP.NET Core 提供了一个强大、灵活且高性能的框架，用于构建现代 Web 应用程序和 API。其模块化设计、内置依赖注入和跨平台支持使其成为各种规模项目的绝佳选择。

关键要点：

- **WebApplicationBuilder** 和 **WebApplication** 提供简化的托管模型
- **依赖注入**是 ASP.NET Core 架构的基础
- **中间件**构成请求处理管道
- **控制器**使用路由和模型绑定处理 HTTP 请求
- **身份验证和授权**内置于框架中
- **日志和错误处理**对于生产应用程序至关重要
- **测试**确保可靠性和可维护性

通过掌握这些概念并遵循最佳实践，您可以使用 ASP.NET Core 构建健壮、可扩展且可维护的 Web 应用程序。该框架随着每个版本不断演进，添加新功能和性能改进，同时保持向后兼容性。
