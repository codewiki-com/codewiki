---
title: ASP.NET Core Minimal API 完全指南
description: 深入掌握 ASP.NET Core Minimal API：MapGet/MapPost、路由处理、参数绑定、Results 类与过滤器
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - ASP.NET Core
  - Minimal API
  - Web API
  - REST
status: imported
origin: old/src/content/docs/csharp/minimal-api.zh.md
divergence: 0.196
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: ASP.NET Core
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

Minimal API 是 ASP.NET Core 6.0 引入的一种轻量级 Web API 开发模式，它允许开发者使用最少的代码和配置快速构建 HTTP API。与传统的 Controller-based API 相比，Minimal API 采用更简洁的函数式编程风格，将路由定义和请求处理逻辑直接写在 `Program.cs` 文件中。

### 为什么需要 Minimal API？

在 Minimal API 出现之前，创建一个简单的 ASP.NET Core Web API 需要：

1. 创建 Controller 类并继承 `ControllerBase`
2. 添加 `[ApiController]` 和 `[Route]` 特性
3. 配置 Startup.cs 或 Program.cs
4. 注册 MVC 服务和中间件

这对于简单的微服务或小型 API 来说显得过于繁琐。Minimal API 的设计目标是：

- **极简代码**：几行代码即可创建完整的 API 端点
- **快速启动**：减少样板代码，提高开发效率
- **低开销**：更少的抽象层，更好的性能
- **易于学习**：对新手友好，降低入门门槛
- **Lambda 友好**：充分利用 C# 的 Lambda 表达式和本地函数

### Minimal API vs Controller-based API

| 特性 | Minimal API | Controller-based API |
|------|-------------|---------------------|
| 代码量 | 少，适合小型 API | 多，适合大型复杂应用 |
| 文件结构 | 集中在 Program.cs | 分散在多个 Controller |
| 学习曲线 | 平缓 | 较陡 |
| 功能完整性 | .NET 7+ 后功能完善 | 功能最全面 |
| 测试便利性 | 稍复杂 | 内置支持良好 |
| 适用场景 | 微服务、原型、小型 API | 企业级应用、复杂业务 |

## 核心原理

### 请求处理管道

Minimal API 的工作原理基于 ASP.NET Core 的中间件管道和端点路由系统：

```
HTTP 请求 → 中间件管道 → 路由匹配 → 端点执行 → 响应生成
```

1. **WebApplication** 类是核心入口点，负责配置服务和中间件
2. **EndpointRouteBuilder** 提供 `Map*` 扩展方法定义路由
3. **RequestDelegate** 或 **Delegate** 处理实际的请求逻辑
4. **EndpointFilterFactory** 提供过滤器机制（类似 MVC 的 Filter）

### 端点路由机制

Minimal API 利用 ASP.NET Core 的端点路由系统：

```csharp
// 内部实现简化示意
app.MapGet("/api/users", handler);

// 等效于创建一个 RouteEndpoint
// RoutePattern: /api/users
// RequestDelegate: handler
// HttpMethods: GET
```

当请求到达时，路由系统会：
1. 解析请求 URL 和 HTTP 方法
2. 匹配已注册的端点
3. 执行参数绑定
4. 调用处理委托
5. 处理返回值生成响应

### 参数绑定原理

Minimal API 使用约定和特性来确定参数来源：

```csharp
// 参数绑定优先级（从高到低）
// 1. 显式特性 [FromRoute], [FromQuery], [FromBody], [FromHeader], [FromServices]
// 2. 特殊类型：HttpContext, HttpRequest, HttpResponse, CancellationToken
// 3. 路由参数匹配
// 4. 查询字符串（简单类型）
// 5. 请求体（复杂类型）
// 6. 依赖注入服务
```

## 核心要点

### 基本路由映射方法

- `MapGet()` - 处理 GET 请求
- `MapPost()` - 处理 POST 请求
- `MapPut()` - 处理 PUT 请求
- `MapDelete()` - 处理 DELETE 请求
- `MapPatch()` - 处理 PATCH 请求
- `MapMethods()` - 处理多种 HTTP 方法
- `Map()` - 处理所有 HTTP 方法

### 参数绑定来源

- **路由参数**：从 URL 路径中提取
- **查询参数**：从查询字符串中提取
- **请求体**：从请求正文中反序列化
- **请求头**：从 HTTP 头中提取
- **服务**：从依赖注入容器中解析

### Results 类返回值

- `Results.Ok()` - 200 成功
- `Results.Created()` - 201 已创建
- `Results.NoContent()` - 204 无内容
- `Results.BadRequest()` - 400 错误请求
- `Results.NotFound()` - 404 未找到
- `Results.Problem()` - 问题详情响应

### 过滤器类型

- **端点过滤器（Endpoint Filters）**：类似 MVC Action Filter
- **路由组过滤器**：应用于整个路由组
- **全局过滤器**：应用于所有端点

## 代码示例

### 快速入门示例

```csharp
// Program.cs - 最小化的 Minimal API
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// 定义一个简单的 GET 端点
app.MapGet("/", () => "Hello, Minimal API!");

// 带路由参数的端点
app.MapGet("/hello/{name}", (string name) => $"Hello, {name}!");

app.Run();
```

### MapGet 和 MapPost 详解

```csharp
var builder = WebApplication.CreateBuilder(args);

// 添加服务
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 配置 Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 模拟数据存储
var products = new List<Product>
{
    new Product(1, "笔记本电脑", 5999.00m, 10),
    new Product(2, "无线鼠标", 99.00m, 50),
    new Product(3, "机械键盘", 399.00m, 30)
};

// GET - 获取所有产品
app.MapGet("/api/products", () => Results.Ok(products))
   .WithName("GetProducts")
   .WithTags("Products")
   .Produces<List<Product>>(StatusCodes.Status200OK);

// GET - 根据 ID 获取产品
app.MapGet("/api/products/{id:int}", (int id) =>
{
    var product = products.FirstOrDefault(p => p.Id == id);
    return product is not null
        ? Results.Ok(product)
        : Results.NotFound(new { Message = $"产品 ID {id} 不存在" });
})
.WithName("GetProductById")
.WithTags("Products")
.Produces<Product>(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound);

// GET - 带查询参数的搜索
app.MapGet("/api/products/search", (string? name, decimal? minPrice, decimal? maxPrice) =>
{
    var query = products.AsEnumerable();

    if (!string.IsNullOrEmpty(name))
        query = query.Where(p => p.Name.Contains(name, StringComparison.OrdinalIgnoreCase));

    if (minPrice.HasValue)
        query = query.Where(p => p.Price >= minPrice.Value);

    if (maxPrice.HasValue)
        query = query.Where(p => p.Price <= maxPrice.Value);

    return Results.Ok(query.ToList());
})
.WithName("SearchProducts")
.WithTags("Products");

// POST - 创建新产品
app.MapPost("/api/products", (CreateProductRequest request) =>
{
    var newId = products.Max(p => p.Id) + 1;
    var product = new Product(newId, request.Name, request.Price, request.Stock);
    products.Add(product);

    return Results.Created($"/api/products/{newId}", product);
})
.WithName("CreateProduct")
.WithTags("Products")
.Accepts<CreateProductRequest>("application/json")
.Produces<Product>(StatusCodes.Status201Created)
.Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest);

// PUT - 更新产品
app.MapPut("/api/products/{id:int}", (int id, UpdateProductRequest request) =>
{
    var index = products.FindIndex(p => p.Id == id);
    if (index == -1)
        return Results.NotFound(new { Message = $"产品 ID {id} 不存在" });

    var updatedProduct = new Product(id, request.Name, request.Price, request.Stock);
    products[index] = updatedProduct;

    return Results.Ok(updatedProduct);
})
.WithName("UpdateProduct")
.WithTags("Products");

// DELETE - 删除产品
app.MapDelete("/api/products/{id:int}", (int id) =>
{
    var index = products.FindIndex(p => p.Id == id);
    if (index == -1)
        return Results.NotFound();

    products.RemoveAt(index);
    return Results.NoContent();
})
.WithName("DeleteProduct")
.WithTags("Products")
.Produces(StatusCodes.Status204NoContent)
.Produces(StatusCodes.Status404NotFound);

app.Run();

// 数据模型
public record Product(int Id, string Name, decimal Price, int Stock);
public record CreateProductRequest(string Name, decimal Price, int Stock);
public record UpdateProductRequest(string Name, decimal Price, int Stock);
```

### 路由处理器（Route Handlers）详解

```csharp
var app = WebApplication.Create(args);

// 1. Lambda 表达式处理器
app.MapGet("/lambda", () => "Lambda 处理器");

// 2. 本地函数处理器
app.MapGet("/local-function", LocalHandler);
string LocalHandler() => "本地函数处理器";

// 3. 静态方法处理器
app.MapGet("/static-method", Handlers.StaticHandler);

// 4. 实例方法处理器
var handler = new MyHandler();
app.MapGet("/instance-method", handler.Handle);

// 5. 异步处理器
app.MapGet("/async", async () =>
{
    await Task.Delay(100);
    return "异步处理器";
});

// 6. 返回 Task<IResult> 的异步处理器
app.MapGet("/async-result", async (HttpContext context) =>
{
    await Task.Delay(100);
    return Results.Ok(new { Message = "异步结果", Time = DateTime.Now });
});

// 7. 带依赖注入的处理器
app.MapGet("/with-services", (ILogger<Program> logger) =>
{
    logger.LogInformation("处理请求");
    return "带服务的处理器";
});

// 8. 带 HttpContext 的处理器
app.MapGet("/with-context", (HttpContext context) =>
{
    var userAgent = context.Request.Headers.UserAgent;
    return $"User-Agent: {userAgent}";
});

app.Run();

// 处理器类
public static class Handlers
{
    public static string StaticHandler() => "静态方法处理器";
}

public class MyHandler
{
    public string Handle() => "实例方法处理器";
}
```

### 参数绑定详解

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IUserService, UserService>();
var app = builder.Build();

// 1. 路由参数绑定
app.MapGet("/users/{id}", (int id) => $"用户 ID: {id}");

// 2. 多个路由参数
app.MapGet("/users/{userId}/orders/{orderId}",
    (int userId, int orderId) => $"用户 {userId} 的订单 {orderId}");

// 3. 可选路由参数
app.MapGet("/items/{id?}", (int? id) =>
    id.HasValue ? $"项目 ID: {id}" : "所有项目");

// 4. 路由约束
app.MapGet("/products/{id:int:min(1)}", (int id) => $"产品 ID: {id}");
app.MapGet("/files/{*path}", (string path) => $"文件路径: {path}"); // 通配符路由

// 5. 查询参数绑定
app.MapGet("/search", (string query, int page = 1, int pageSize = 10) =>
    $"搜索: {query}, 页码: {page}, 每页: {pageSize}");

// 6. 显式指定查询参数
app.MapGet("/filter", ([FromQuery(Name = "q")] string searchTerm) =>
    $"搜索词: {searchTerm}");

// 7. 请求体绑定（POST/PUT）
app.MapPost("/users", ([FromBody] CreateUserRequest request) =>
    Results.Created($"/users/{1}", new { Id = 1, request.Name, request.Email }));

// 8. 请求头绑定
app.MapGet("/headers", (
    [FromHeader(Name = "X-Request-Id")] string? requestId,
    [FromHeader(Name = "Accept-Language")] string? language) =>
    $"Request ID: {requestId}, Language: {language}");

// 9. 服务注入
app.MapGet("/users/{id}/profile", (
    int id,
    [FromServices] IUserService userService) =>
{
    var user = userService.GetUser(id);
    return user is not null ? Results.Ok(user) : Results.NotFound();
});

// 10. HttpContext 和相关类型
app.MapGet("/context-info", (
    HttpContext context,
    HttpRequest request,
    HttpResponse response,
    CancellationToken cancellationToken) =>
{
    return new
    {
        Method = request.Method,
        Path = request.Path,
        ContentType = request.ContentType,
        IsCancelled = cancellationToken.IsCancellationRequested
    };
});

// 11. 表单数据绑定
app.MapPost("/upload", async ([FromForm] IFormFile file) =>
{
    if (file.Length == 0)
        return Results.BadRequest("文件为空");

    var fileName = Path.GetRandomFileName();
    var filePath = Path.Combine("uploads", fileName);

    using var stream = File.Create(filePath);
    await file.CopyToAsync(stream);

    return Results.Ok(new { FileName = fileName, Size = file.Length });
}).DisableAntiforgery(); // 禁用 CSRF 保护（仅用于演示）

// 12. 复杂类型自动绑定
app.MapGet("/complex", (PaginationParams pagination) =>
    $"页码: {pagination.Page}, 每页: {pagination.PageSize}");

// 13. 自定义参数绑定（实现 IParsable<T>）
app.MapGet("/point/{point}", (Point point) =>
    $"坐标: X={point.X}, Y={point.Y}");

app.Run();

// 数据模型
public record CreateUserRequest(string Name, string Email);

// 支持从查询字符串绑定的复杂类型
public class PaginationParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    // 静态 TryParse 方法使其可从查询字符串绑定
    public static bool TryParse(string? value, out PaginationParams? result)
    {
        result = new PaginationParams();
        return true;
    }
}

// 自定义可解析类型
public record Point(int X, int Y) : IParsable<Point>
{
    public static Point Parse(string s, IFormatProvider? provider)
    {
        var parts = s.Split(',');
        return new Point(int.Parse(parts[0]), int.Parse(parts[1]));
    }

    public static bool TryParse(string? s, IFormatProvider? provider, out Point result)
    {
        result = default!;
        if (string.IsNullOrEmpty(s)) return false;

        var parts = s.Split(',');
        if (parts.Length != 2) return false;

        if (int.TryParse(parts[0], out var x) && int.TryParse(parts[1], out var y))
        {
            result = new Point(x, y);
            return true;
        }
        return false;
    }
}

// 服务接口和实现
public interface IUserService
{
    User? GetUser(int id);
}

public class UserService : IUserService
{
    private readonly List<User> _users = new()
    {
        new User(1, "张三", "zhangsan@example.com"),
        new User(2, "李四", "lisi@example.com")
    };

    public User? GetUser(int id) => _users.FirstOrDefault(u => u.Id == id);
}

public record User(int Id, string Name, string Email);
```

### Results 类详解

```csharp
var app = WebApplication.Create(args);

// 1. 成功响应
app.MapGet("/ok", () => Results.Ok(new { Message = "成功" }));
app.MapGet("/ok-empty", () => Results.Ok()); // 200 无内容

// 2. 创建成功
app.MapPost("/created", () =>
    Results.Created("/items/1", new { Id = 1, Name = "新项目" }));

app.MapPost("/created-at-route", () =>
    Results.CreatedAtRoute("GetItem", new { id = 1 }, new { Id = 1, Name = "新项目" }));

// 3. 无内容响应
app.MapDelete("/items/{id}", (int id) => Results.NoContent());

// 4. 接受处理
app.MapPost("/async-job", () => Results.Accepted("/jobs/123", new { JobId = "123" }));

// 5. 错误响应
app.MapGet("/bad-request", () =>
    Results.BadRequest(new { Error = "请求参数无效" }));

app.MapGet("/not-found", () =>
    Results.NotFound(new { Error = "资源不存在" }));

app.MapGet("/unauthorized", () => Results.Unauthorized());

app.MapGet("/forbidden", () => Results.Forbid());

app.MapGet("/conflict", () =>
    Results.Conflict(new { Error = "资源冲突" }));

app.MapGet("/unprocessable", () =>
    Results.UnprocessableEntity(new { Error = "无法处理的实体" }));

// 6. 服务器错误
app.MapGet("/error", () =>
    Results.Problem(
        title: "服务器内部错误",
        detail: "处理请求时发生错误",
        statusCode: 500));

// 7. 验证问题
app.MapPost("/validate", (CreateItemRequest request) =>
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrEmpty(request.Name))
        errors["Name"] = new[] { "名称不能为空" };

    if (request.Price <= 0)
        errors["Price"] = new[] { "价格必须大于0" };

    if (errors.Any())
        return Results.ValidationProblem(errors);

    return Results.Ok(request);
});

// 8. 重定向
app.MapGet("/redirect", () => Results.Redirect("/new-location"));
app.MapGet("/redirect-permanent", () => Results.Redirect("/new-location", permanent: true));
app.MapGet("/redirect-to-route", () => Results.RedirectToRoute("GetItem", new { id = 1 }));

// 9. 文件响应
app.MapGet("/file", () => Results.File(
    fileContents: System.Text.Encoding.UTF8.GetBytes("文件内容"),
    contentType: "text/plain",
    fileDownloadName: "example.txt"));

app.MapGet("/file-stream", () =>
{
    var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("流内容"));
    return Results.File(stream, "text/plain", "stream.txt");
});

app.MapGet("/file-path", () =>
    Results.File("/path/to/file.pdf", "application/pdf", "document.pdf"));

// 10. JSON 响应（自定义序列化）
app.MapGet("/json", () => Results.Json(
    new { Name = "测试", Time = DateTime.Now },
    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));

// 11. 内容响应
app.MapGet("/text", () => Results.Text("纯文本内容", "text/plain"));
app.MapGet("/html", () => Results.Text("<h1>HTML 内容</h1>", "text/html"));

// 12. 字节响应
app.MapGet("/bytes", () => Results.Bytes(
    new byte[] { 0x48, 0x65, 0x6C, 0x6C, 0x6F },
    "application/octet-stream"));

// 13. 流响应
app.MapGet("/stream", () =>
{
    var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("流数据"));
    return Results.Stream(stream, "application/octet-stream");
});

// 14. 空响应
app.MapGet("/empty", () => Results.Empty);

// 15. 状态码响应
app.MapGet("/status", () => Results.StatusCode(418)); // I'm a teapot

// 16. 条件响应
app.MapGet("/conditional/{id}", (int id) =>
{
    if (id < 0)
        return Results.BadRequest("ID 不能为负数");
    if (id == 0)
        return Results.NotFound();
    if (id > 1000)
        return Results.Problem("ID 超出范围", statusCode: 422);

    return Results.Ok(new { Id = id, Name = $"项目 {id}" });
});

// 17. TypedResults（强类型结果，用于 OpenAPI）
app.MapGet("/typed/{id}", (int id) =>
{
    if (id <= 0)
        return TypedResults.BadRequest("无效的 ID");

    return TypedResults.Ok(new Item(id, $"项目 {id}"));
});

// 给端点命名（用于 CreatedAtRoute 等）
app.MapGet("/items/{id}", (int id) => Results.Ok(new Item(id, $"项目 {id}")))
   .WithName("GetItem");

app.Run();

public record CreateItemRequest(string Name, decimal Price);
public record Item(int Id, string Name);
```

### 过滤器（Filters）详解

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ILogger<Program>>(sp =>
    sp.GetRequiredService<ILoggerFactory>().CreateLogger<Program>());

var app = builder.Build();

// 1. 简单的端点过滤器（使用 Lambda）
app.MapGet("/filter-lambda", () => "Hello")
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("过滤器：请求前");
       var result = await next(context);
       Console.WriteLine("过滤器：请求后");
       return result;
   });

// 2. 多个过滤器（按添加顺序执行）
app.MapGet("/multi-filters", () => "多过滤器")
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("过滤器 1 - 前");
       var result = await next(context);
       Console.WriteLine("过滤器 1 - 后");
       return result;
   })
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("过滤器 2 - 前");
       var result = await next(context);
       Console.WriteLine("过滤器 2 - 后");
       return result;
   });
// 输出顺序：过滤器 1 - 前 → 过滤器 2 - 前 → 处理器 → 过滤器 2 - 后 → 过滤器 1 - 后

// 3. 类型化过滤器
app.MapGet("/typed-filter", () => "类型化过滤器")
   .AddEndpointFilter<LoggingFilter>();

// 4. 带工厂的过滤器
app.MapGet("/factory-filter", () => "工厂过滤器")
   .AddEndpointFilterFactory((context, next) =>
   {
       // 可以访问 EndpointFilterFactoryContext
       var methodInfo = context.MethodInfo;
       Console.WriteLine($"端点方法: {methodInfo.Name}");

       return async invocationContext =>
       {
           Console.WriteLine("工厂过滤器执行");
           return await next(invocationContext);
       };
   });

// 5. 验证过滤器
app.MapPost("/validate-filter", (CreateProductRequest request) =>
    Results.Ok(request))
   .AddEndpointFilter<ValidationFilter<CreateProductRequest>>();

// 6. 认证/授权过滤器
app.MapGet("/auth-filter", () => "需要认证")
   .AddEndpointFilter(async (context, next) =>
   {
       var httpContext = context.HttpContext;
       var authHeader = httpContext.Request.Headers.Authorization.FirstOrDefault();

       if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
       {
           return Results.Unauthorized();
       }

       // 验证 token（简化示例）
       var token = authHeader.Substring("Bearer ".Length);
       if (token != "valid-token")
       {
           return Results.Forbid();
       }

       return await next(context);
   });

// 7. 速率限制过滤器
app.MapGet("/rate-limit", () => "受限端点")
   .AddEndpointFilter<RateLimitFilter>();

// 8. 缓存过滤器
app.MapGet("/cached", () => new { Time = DateTime.Now })
   .AddEndpointFilter<SimpleCacheFilter>();

// 9. 访问和修改参数
app.MapGet("/modify-param/{name}", (string name) => $"Hello, {name}")
   .AddEndpointFilter(async (context, next) =>
   {
       // 获取参数
       var name = context.GetArgument<string>(0);
       Console.WriteLine($"原始名称: {name}");

       // 修改参数（如果需要）
       if (string.IsNullOrEmpty(name))
       {
           context.Arguments[0] = "World";
       }

       return await next(context);
   });

// 10. 修改响应
app.MapGet("/modify-response", () => new { Message = "原始响应" })
   .AddEndpointFilter(async (context, next) =>
   {
       var result = await next(context);

       // 包装响应
       return Results.Ok(new
       {
           Data = result,
           Timestamp = DateTime.UtcNow,
           RequestId = Guid.NewGuid()
       });
   });

// 11. 路由组过滤器
var apiGroup = app.MapGroup("/api")
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("API 组过滤器");
       return await next(context);
   });

apiGroup.MapGet("/users", () => "用户列表");
apiGroup.MapGet("/products", () => "产品列表");

// 12. 嵌套路由组过滤器
var v1Group = apiGroup.MapGroup("/v1")
   .AddEndpointFilter(async (context, next) =>
   {
       context.HttpContext.Response.Headers.Append("X-API-Version", "1.0");
       return await next(context);
   });

v1Group.MapGet("/items", () => "V1 项目");

app.Run();

// 自定义过滤器类
public class LoggingFilter : IEndpointFilter
{
    private readonly ILogger<LoggingFilter> _logger;

    public LoggingFilter(ILogger<LoggingFilter> logger)
    {
        _logger = logger;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        var path = httpContext.Request.Path;
        var method = httpContext.Request.Method;

        _logger.LogInformation("请求开始: {Method} {Path}", method, path);
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            var result = await next(context);

            stopwatch.Stop();
            _logger.LogInformation(
                "请求完成: {Method} {Path} - {ElapsedMs}ms",
                method, path, stopwatch.ElapsedMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "请求失败: {Method} {Path} - {ElapsedMs}ms",
                method, path, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}

// 验证过滤器
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        // 查找 T 类型的参数
        var argument = context.Arguments.OfType<T>().FirstOrDefault();

        if (argument is null)
        {
            return Results.BadRequest("请求体不能为空");
        }

        // 简单验证（实际应使用 FluentValidation 等）
        var validationErrors = new Dictionary<string, string[]>();

        foreach (var prop in typeof(T).GetProperties())
        {
            var value = prop.GetValue(argument);

            if (prop.PropertyType == typeof(string) && string.IsNullOrEmpty(value as string))
            {
                validationErrors[prop.Name] = new[] { $"{prop.Name} 不能为空" };
            }
        }

        if (validationErrors.Any())
        {
            return Results.ValidationProblem(validationErrors);
        }

        return await next(context);
    }
}

// 速率限制过滤器
public class RateLimitFilter : IEndpointFilter
{
    private static readonly Dictionary<string, (int Count, DateTime ResetTime)> _requests = new();
    private const int MaxRequests = 10;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var ip = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;

        lock (_requests)
        {
            if (_requests.TryGetValue(ip, out var entry))
            {
                if (now < entry.ResetTime)
                {
                    if (entry.Count >= MaxRequests)
                    {
                        return Results.StatusCode(429); // Too Many Requests
                    }
                    _requests[ip] = (entry.Count + 1, entry.ResetTime);
                }
                else
                {
                    _requests[ip] = (1, now.Add(Window));
                }
            }
            else
            {
                _requests[ip] = (1, now.Add(Window));
            }
        }

        return await next(context);
    }
}

// 简单缓存过滤器
public class SimpleCacheFilter : IEndpointFilter
{
    private static readonly Dictionary<string, (object? Value, DateTime Expiry)> _cache = new();
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var cacheKey = context.HttpContext.Request.Path.ToString();
        var now = DateTime.UtcNow;

        // 检查缓存
        if (_cache.TryGetValue(cacheKey, out var entry) && now < entry.Expiry)
        {
            context.HttpContext.Response.Headers.Append("X-Cache", "HIT");
            return entry.Value;
        }

        // 执行处理器
        var result = await next(context);

        // 存入缓存
        _cache[cacheKey] = (result, now.Add(CacheDuration));
        context.HttpContext.Response.Headers.Append("X-Cache", "MISS");

        return result;
    }
}

public record CreateProductRequest(string Name, decimal Price, int Stock);
```

### 路由组（Route Groups）

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();

var app = builder.Build();

// 1. 基本路由组
var api = app.MapGroup("/api");

api.MapGet("/health", () => "OK");
api.MapGet("/version", () => new { Version = "1.0.0" });

// 2. 嵌套路由组
var v1 = api.MapGroup("/v1");
var v2 = api.MapGroup("/v2");

// V1 用户端点
var v1Users = v1.MapGroup("/users")
    .WithTags("Users V1");

v1Users.MapGet("/", () => "V1 用户列表");
v1Users.MapGet("/{id}", (int id) => $"V1 用户 {id}");

// V2 用户端点（可能有不同的响应格式）
var v2Users = v2.MapGroup("/users")
    .WithTags("Users V2");

v2Users.MapGet("/", () => new { Users = new[] { "用户1", "用户2" }, Format = "V2" });
v2Users.MapGet("/{id}", (int id) => new { Id = id, Version = "V2" });

// 3. 带过滤器的路由组
var authenticated = api.MapGroup("/secure")
    .AddEndpointFilter(async (context, next) =>
    {
        var auth = context.HttpContext.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrEmpty(auth))
        {
            return Results.Unauthorized();
        }
        return await next(context);
    });

authenticated.MapGet("/profile", () => "用户资料");
authenticated.MapGet("/settings", () => "用户设置");

// 4. 带共同配置的路由组
var products = api.MapGroup("/products")
    .WithTags("Products")
    .WithOpenApi()
    .RequireAuthorization(); // 需要配置认证服务

products.MapGet("/", async (IProductRepository repo) =>
    Results.Ok(await repo.GetAllAsync()));

products.MapGet("/{id}", async (int id, IProductRepository repo) =>
{
    var product = await repo.GetByIdAsync(id);
    return product is not null ? Results.Ok(product) : Results.NotFound();
});

products.MapPost("/", async (Product product, IProductRepository repo) =>
{
    var created = await repo.CreateAsync(product);
    return Results.Created($"/api/products/{created.Id}", created);
});

// 5. 组织大型 API 的模式
ConfigureUserEndpoints(api);
ConfigureProductEndpoints(api);
ConfigureOrderEndpoints(api);

app.Run();

// 使用静态方法或扩展方法组织端点
static void ConfigureUserEndpoints(RouteGroupBuilder group)
{
    var users = group.MapGroup("/users").WithTags("Users");

    users.MapGet("/", GetUsers);
    users.MapGet("/{id}", GetUserById);
    users.MapPost("/", CreateUser);
    users.MapPut("/{id}", UpdateUser);
    users.MapDelete("/{id}", DeleteUser);
}

static IResult GetUsers() => Results.Ok(new[] { "用户1", "用户2" });
static IResult GetUserById(int id) => Results.Ok($"用户 {id}");
static IResult CreateUser() => Results.Created("/users/1", new { Id = 1 });
static IResult UpdateUser(int id) => Results.Ok($"已更新用户 {id}");
static IResult DeleteUser(int id) => Results.NoContent();

static void ConfigureProductEndpoints(RouteGroupBuilder group)
{
    var products = group.MapGroup("/products").WithTags("Products");
    // 添加产品相关端点...
}

static void ConfigureOrderEndpoints(RouteGroupBuilder group)
{
    var orders = group.MapGroup("/orders").WithTags("Orders");
    // 添加订单相关端点...
}

// 仓储接口和实现
public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllAsync();
    Task<User?> GetByIdAsync(int id);
}

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product> CreateAsync(Product product);
}

public class UserRepository : IUserRepository
{
    public Task<IEnumerable<User>> GetAllAsync() =>
        Task.FromResult<IEnumerable<User>>(new List<User>());

    public Task<User?> GetByIdAsync(int id) =>
        Task.FromResult<User?>(new User(id, $"用户{id}", $"user{id}@example.com"));
}

public class ProductRepository : IProductRepository
{
    private readonly List<Product> _products = new()
    {
        new Product(1, "产品1", 99.99m),
        new Product(2, "产品2", 199.99m)
    };

    public Task<IEnumerable<Product>> GetAllAsync() =>
        Task.FromResult<IEnumerable<Product>>(_products);

    public Task<Product?> GetByIdAsync(int id) =>
        Task.FromResult(_products.FirstOrDefault(p => p.Id == id));

    public Task<Product> CreateAsync(Product product)
    {
        var newProduct = product with { Id = _products.Max(p => p.Id) + 1 };
        _products.Add(newProduct);
        return Task.FromResult(newProduct);
    }
}

public record User(int Id, string Name, string Email);
public record Product(int Id, string Name, decimal Price);
```

### 完整项目示例

```csharp
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// 配置服务
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("TodoDb"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Todo API", Version = "v1" });
});

var app = builder.Build();

// 配置中间件
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 配置端点
var todos = app.MapGroup("/api/todos")
    .WithTags("Todos")
    .WithOpenApi();

// 获取所有待办事项
todos.MapGet("/", async (AppDbContext db, bool? completed) =>
{
    var query = db.Todos.AsQueryable();

    if (completed.HasValue)
        query = query.Where(t => t.IsCompleted == completed.Value);

    return TypedResults.Ok(await query.ToListAsync());
})
.WithName("GetTodos")
.WithSummary("获取待办事项列表")
.WithDescription("返回所有待办事项，可选按完成状态筛选");

// 获取单个待办事项
todos.MapGet("/{id}", async Task<Results<Ok<Todo>, NotFound>> (int id, AppDbContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    return todo is not null
        ? TypedResults.Ok(todo)
        : TypedResults.NotFound();
})
.WithName("GetTodoById")
.WithSummary("获取单个待办事项");

// 创建待办事项
todos.MapPost("/", async Task<Results<Created<Todo>, ValidationProblem>> (
    CreateTodoRequest request,
    AppDbContext db) =>
{
    // 验证
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.Title))
        errors["Title"] = new[] { "标题不能为空" };
    if (request.Title?.Length > 200)
        errors["Title"] = new[] { "标题长度不能超过200个字符" };

    if (errors.Any())
        return TypedResults.ValidationProblem(errors);

    var todo = new Todo
    {
        Title = request.Title!,
        Description = request.Description,
        DueDate = request.DueDate,
        IsCompleted = false,
        CreatedAt = DateTime.UtcNow
    };

    db.Todos.Add(todo);
    await db.SaveChangesAsync();

    return TypedResults.Created($"/api/todos/{todo.Id}", todo);
})
.WithName("CreateTodo")
.WithSummary("创建新的待办事项");

// 更新待办事项
todos.MapPut("/{id}", async Task<Results<Ok<Todo>, NotFound, ValidationProblem>> (
    int id,
    UpdateTodoRequest request,
    AppDbContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null)
        return TypedResults.NotFound();

    // 验证
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.Title))
        errors["Title"] = new[] { "标题不能为空" };

    if (errors.Any())
        return TypedResults.ValidationProblem(errors);

    todo.Title = request.Title!;
    todo.Description = request.Description;
    todo.DueDate = request.DueDate;
    todo.IsCompleted = request.IsCompleted;
    todo.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return TypedResults.Ok(todo);
})
.WithName("UpdateTodo")
.WithSummary("更新待办事项");

// 切换完成状态
todos.MapPatch("/{id}/toggle", async Task<Results<Ok<Todo>, NotFound>> (
    int id,
    AppDbContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null)
        return TypedResults.NotFound();

    todo.IsCompleted = !todo.IsCompleted;
    todo.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return TypedResults.Ok(todo);
})
.WithName("ToggleTodo")
.WithSummary("切换待办事项完成状态");

// 删除待办事项
todos.MapDelete("/{id}", async Task<Results<NoContent, NotFound>> (
    int id,
    AppDbContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null)
        return TypedResults.NotFound();

    db.Todos.Remove(todo);
    await db.SaveChangesAsync();

    return TypedResults.NoContent();
})
.WithName("DeleteTodo")
.WithSummary("删除待办事项");

// 批量操作
todos.MapPost("/batch/complete", async (int[] ids, AppDbContext db) =>
{
    var todos = await db.Todos
        .Where(t => ids.Contains(t.Id))
        .ToListAsync();

    foreach (var todo in todos)
    {
        todo.IsCompleted = true;
        todo.UpdatedAt = DateTime.UtcNow;
    }

    await db.SaveChangesAsync();

    return TypedResults.Ok(new { UpdatedCount = todos.Count });
})
.WithName("BatchCompleteTodos")
.WithSummary("批量完成待办事项");

// 统计信息
todos.MapGet("/stats", async (AppDbContext db) =>
{
    var total = await db.Todos.CountAsync();
    var completed = await db.Todos.CountAsync(t => t.IsCompleted);
    var pending = total - completed;
    var overdue = await db.Todos.CountAsync(t =>
        !t.IsCompleted && t.DueDate.HasValue && t.DueDate < DateTime.UtcNow);

    return TypedResults.Ok(new TodoStats(total, completed, pending, overdue));
})
.WithName("GetTodoStats")
.WithSummary("获取待办事项统计信息");

// 初始化测试数据
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.Todos.Any())
    {
        db.Todos.AddRange(
            new Todo { Title = "学习 Minimal API", Description = "阅读官方文档", CreatedAt = DateTime.UtcNow },
            new Todo { Title = "编写示例代码", Description = "创建演示项目", CreatedAt = DateTime.UtcNow },
            new Todo { Title = "部署应用", DueDate = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow }
        );
        db.SaveChanges();
    }
}

app.Run();

// 数据模型
public class Todo
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// 请求 DTO
public record CreateTodoRequest(string? Title, string? Description, DateTime? DueDate);
public record UpdateTodoRequest(string? Title, string? Description, DateTime? DueDate, bool IsCompleted);

// 响应 DTO
public record TodoStats(int Total, int Completed, int Pending, int Overdue);

// 数据库上下文
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Todo> Todos => Set<Todo>();
}
```

## 最佳实践

### 项目结构组织

```
MinimalApiProject/
├── Program.cs              # 应用入口和配置
├── Endpoints/              # 端点定义
│   ├── UserEndpoints.cs
│   ├── ProductEndpoints.cs
│   └── OrderEndpoints.cs
├── Filters/                # 自定义过滤器
│   ├── ValidationFilter.cs
│   └── LoggingFilter.cs
├── Models/                 # 数据模型
│   ├── Entities/
│   └── DTOs/
├── Services/               # 业务服务
├── Data/                   # 数据访问
└── Extensions/             # 扩展方法
```

### 使用扩展方法组织端点

```csharp
// Endpoints/UserEndpoints.cs
public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .WithOpenApi();

        group.MapGet("/", GetUsers);
        group.MapGet("/{id}", GetUserById);
        group.MapPost("/", CreateUser);
        group.MapPut("/{id}", UpdateUser);
        group.MapDelete("/{id}", DeleteUser);
    }

    private static async Task<IResult> GetUsers(IUserService service)
    {
        var users = await service.GetAllAsync();
        return Results.Ok(users);
    }

    // ... 其他方法
}

// Program.cs
app.MapUserEndpoints();
app.MapProductEndpoints();
```

### 使用 TypedResults 提供更好的 OpenAPI 支持

```csharp
// 使用 TypedResults 而不是 Results
app.MapGet("/items/{id}", async Task<Results<Ok<Item>, NotFound>> (int id, IItemService service) =>
{
    var item = await service.GetByIdAsync(id);
    return item is not null
        ? TypedResults.Ok(item)
        : TypedResults.NotFound();
});
```

### 验证请求数据

```csharp
// 使用 FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

app.MapPost("/users", async (CreateUserRequest request, IValidator<CreateUserRequest> validator) =>
{
    var result = await validator.ValidateAsync(request);
    if (!result.IsValid)
    {
        return Results.ValidationProblem(result.ToDictionary());
    }

    // 处理请求...
});
```

### 正确处理异步操作

```csharp
// 始终使用 async/await
app.MapGet("/data", async (IDataService service, CancellationToken cancellationToken) =>
{
    var data = await service.GetDataAsync(cancellationToken);
    return Results.Ok(data);
});
```

### 使用依赖注入

```csharp
// 注册服务
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();

// 在端点中使用
app.MapGet("/users", async (IUserService userService) =>
{
    return await userService.GetAllAsync();
});
```

### 配置 CORS 和认证

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/secure", () => "Secret Data")
   .RequireAuthorization();
```

## 常见陷阱

### 忘记处理空值

```csharp
// 错误：可能抛出 NullReferenceException
app.MapGet("/users/{id}", async (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return Results.Ok(user.Name); // user 可能为 null
});

// 正确：检查空值
app.MapGet("/users/{id}", async (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is not null
        ? Results.Ok(user)
        : Results.NotFound();
});
```

### 路由参数类型不匹配

```csharp
// 错误：id 是字符串，但期望是整数
app.MapGet("/users/{id}", (int id) => $"User {id}");
// 请求 /users/abc 会返回 400

// 正确：使用路由约束或处理转换
app.MapGet("/users/{id:int}", (int id) => $"User {id}");
```

### 忽略 CancellationToken

```csharp
// 错误：不支持取消
app.MapGet("/slow", async () =>
{
    await Task.Delay(10000);
    return "Done";
});

// 正确：支持取消
app.MapGet("/slow", async (CancellationToken cancellationToken) =>
{
    await Task.Delay(10000, cancellationToken);
    return "Done";
});
```

### 过滤器顺序问题

```csharp
// 过滤器按添加顺序执行
// 如果认证过滤器在日志过滤器之后，未认证请求也会被记录
app.MapGet("/secure", () => "Secret")
   .AddEndpointFilter<LoggingFilter>()    // 先执行
   .AddEndpointFilter<AuthFilter>();       // 后执行

// 正确顺序
app.MapGet("/secure", () => "Secret")
   .AddEndpointFilter<AuthFilter>()        // 先验证
   .AddEndpointFilter<LoggingFilter>();    // 再记录
```

### 同步方法中使用异步操作

```csharp
// 错误：可能导致死锁
app.MapGet("/data", (IDataService service) =>
{
    var data = service.GetDataAsync().Result; // 阻塞
    return Results.Ok(data);
});

// 正确：使用 async/await
app.MapGet("/data", async (IDataService service) =>
{
    var data = await service.GetDataAsync();
    return Results.Ok(data);
});
```

### 在闭包中捕获可变状态

```csharp
// 错误：共享可变状态
var counter = 0;
app.MapGet("/count", () =>
{
    counter++; // 非线程安全
    return counter;
});

// 正确：使用服务或原子操作
builder.Services.AddSingleton<CounterService>();
app.MapGet("/count", (CounterService counter) =>
{
    return counter.Increment();
});
```

## 性能考量

### 路由匹配优化

```csharp
// 使用路由约束减少不必要的匹配
app.MapGet("/users/{id:int}", ...);           // 只匹配整数
app.MapGet("/users/{id:guid}", ...);          // 只匹配 GUID
app.MapGet("/files/{*path:regex(^[a-z]+$)}", ...); // 正则约束
```

### 响应缓存

```csharp
builder.Services.AddOutputCache();

var app = builder.Build();
app.UseOutputCache();

app.MapGet("/products", async (IProductService service) =>
{
    return await service.GetAllAsync();
})
.CacheOutput(policy => policy.Expire(TimeSpan.FromMinutes(5)));
```

### 响应压缩

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var app = builder.Build();
app.UseResponseCompression();
```

### 异步数据库操作

```csharp
// 始终使用异步数据库方法
app.MapGet("/users", async (AppDbContext db) =>
{
    return await db.Users.AsNoTracking().ToListAsync();
});
```

### 减少不必要的分配

```csharp
// 避免创建不必要的对象
app.MapGet("/status", () => Results.Ok()); // 好

// 使用 ValueTask 对于可能同步完成的操作
app.MapGet("/cached", async ValueTask<IResult> (ICache cache, string key) =>
{
    if (cache.TryGet(key, out var value))
        return Results.Ok(value); // 同步返回

    var data = await FetchDataAsync(key);
    return Results.Ok(data);
});
```

### 合理使用过滤器

```csharp
// 将频繁执行的逻辑放在过滤器中可能影响性能
// 考虑使用缓存或优化算法

public class OptimizedFilter : IEndpointFilter
{
    private readonly IMemoryCache _cache;

    public OptimizedFilter(IMemoryCache cache)
    {
        _cache = cache;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        // 使用缓存避免重复计算
        var cacheKey = GenerateCacheKey(context);

        if (_cache.TryGetValue(cacheKey, out var cached))
            return cached;

        var result = await next(context);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));

        return result;
    }
}
```

## 实战场景

### 场景一：RESTful CRUD API

用于构建标准的资源管理 API，如用户管理、产品管理等。

### 场景二：微服务端点

用于构建轻量级微服务，如认证服务、通知服务等。

### 场景三：BFF（Backend for Frontend）

为特定前端应用定制的后端 API。

### 场景四：Webhook 接收器

处理来自第三方服务的回调通知。

```csharp
app.MapPost("/webhooks/payment", async (
    HttpRequest request,
    PaymentWebhookRequest payload,
    IPaymentService service) =>
{
    // 验证签名
    var signature = request.Headers["X-Webhook-Signature"].FirstOrDefault();
    if (!service.VerifySignature(payload, signature))
        return Results.Unauthorized();

    await service.ProcessPaymentAsync(payload);
    return Results.Ok();
});
```

### 场景五：健康检查端点

```csharp
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<CacheHealthCheck>("cache");

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
```

## 面试要点

### 基础概念题

**Q1: Minimal API 和 Controller-based API 的主要区别是什么？**

A: 主要区别包括：
- Minimal API 使用函数式风格，在 Program.cs 中直接定义路由
- Controller API 使用 OOP 风格，需要创建 Controller 类
- Minimal API 代码量更少，启动更快
- Controller API 功能更完整，适合复杂场景

**Q2: 如何在 Minimal API 中进行参数绑定？**

A: 参数绑定来源包括：
- 路由参数：自动从 URL 路径绑定
- 查询参数：使用 `[FromQuery]` 或自动绑定简单类型
- 请求体：使用 `[FromBody]` 或自动绑定复杂类型
- 请求头：使用 `[FromHeader]`
- 服务：使用 `[FromServices]` 或自动从 DI 容器解析

**Q3: Results 类有哪些常用方法？**

A: 常用方法包括：
- `Results.Ok()` / `Results.Ok(value)` - 200 响应
- `Results.Created()` - 201 响应
- `Results.NoContent()` - 204 响应
- `Results.BadRequest()` - 400 响应
- `Results.NotFound()` - 404 响应
- `Results.Problem()` - 问题详情响应
- `Results.ValidationProblem()` - 验证问题响应

### 进阶实践题

**Q4: 如何实现 Minimal API 的过滤器？**

```csharp
// 方式一：Lambda 过滤器
app.MapGet("/", () => "Hello")
   .AddEndpointFilter(async (context, next) =>
   {
       // 前置逻辑
       var result = await next(context);
       // 后置逻辑
       return result;
   });

// 方式二：实现 IEndpointFilter 接口
public class MyFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        return await next(context);
    }
}
```

**Q5: 如何组织大型 Minimal API 项目？**

A: 推荐方法：
- 使用路由组（MapGroup）组织相关端点
- 使用扩展方法将端点定义移到独立文件
- 使用过滤器处理横切关注点
- 遵循分层架构，分离业务逻辑到服务层

**Q6: Minimal API 支持哪些 HTTP 方法？**

A: 支持所有标准 HTTP 方法：
- MapGet, MapPost, MapPut, MapDelete, MapPatch
- MapMethods（指定多个方法）
- Map（匹配所有方法）

## 延伸阅读

- [ASP.NET Core Minimal APIs 官方文档](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis)
- [Minimal API 教程](https://docs.microsoft.com/aspnet/core/tutorials/min-web-api)
- [从 Controller 迁移到 Minimal API](https://docs.microsoft.com/aspnet/core/migration/50-to-60)
- [ASP.NET Core 性能最佳实践](https://docs.microsoft.com/aspnet/core/performance/performance-best-practices)
- [Minimal API 过滤器](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis/min-api-filters)
- [OpenAPI 支持](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis/openapi)
