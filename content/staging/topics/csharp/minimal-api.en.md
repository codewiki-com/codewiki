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
origin: old/src/content/docs/csharp/minimal-api.en.md
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

## Concept Explanation

Minimal API is a lightweight Web API development pattern introduced in ASP.NET Core 6.0 that allows developers to quickly build HTTP APIs with minimal code and configuration. Compared to traditional Controller-based APIs, Minimal API adopts a more concise functional programming style, writing route definitions and request handling logic directly in the `Program.cs` file.

### Why Do We Need Minimal API?

Before Minimal API, creating a simple ASP.NET Core Web API required:

1. Creating a Controller class inheriting from `ControllerBase`
2. Adding `[ApiController]` and `[Route]` attributes
3. Configuring Startup.cs or Program.cs
4. Registering MVC services and middleware

This was overly cumbersome for simple microservices or small APIs. The design goals of Minimal API are:

- **Minimal Code**: Create complete API endpoints with just a few lines of code
- **Quick Startup**: Reduce boilerplate code, boost developer productivity
- **Low Overhead**: Fewer abstraction layers, better performance
- **Easy to Learn**: Beginner-friendly, lower barrier to entry
- **Lambda Friendly**: Full utilization of C# lambda expressions and local functions

### Minimal API vs Controller-based API

| Feature | Minimal API | Controller-based API |
|---------|-------------|---------------------|
| Code Volume | Less, suitable for small APIs | More, suitable for large complex applications |
| File Structure | Centralized in Program.cs | Distributed across multiple Controllers |
| Learning Curve | Gentle | Steeper |
| Feature Completeness | Complete since .NET 7+ | Most comprehensive |
| Testing Convenience | Slightly complex | Good built-in support |
| Use Cases | Microservices, prototypes, small APIs | Enterprise applications, complex business logic |

## Core Principles

### Request Processing Pipeline

The working principle of Minimal API is based on ASP.NET Core's middleware pipeline and endpoint routing system:

```
HTTP Request → Middleware Pipeline → Route Matching → Endpoint Execution → Response Generation
```

1. **WebApplication** class is the core entry point, responsible for configuring services and middleware
2. **EndpointRouteBuilder** provides `Map*` extension methods to define routes
3. **RequestDelegate** or **Delegate** handles the actual request logic
4. **EndpointFilterFactory** provides filter mechanism (similar to MVC Filters)

### Endpoint Routing Mechanism

Minimal API leverages ASP.NET Core's endpoint routing system:

```csharp
// Simplified internal implementation
app.MapGet("/api/users", handler);

// Equivalent to creating a RouteEndpoint
// RoutePattern: /api/users
// RequestDelegate: handler
// HttpMethods: GET
```

When a request arrives, the routing system will:
1. Parse the request URL and HTTP method
2. Match registered endpoints
3. Execute parameter binding
4. Invoke the handler delegate
5. Process return value to generate response

### Parameter Binding Principles

Minimal API uses conventions and attributes to determine parameter sources:

```csharp
// Parameter binding priority (from high to low)
// 1. Explicit attributes [FromRoute], [FromQuery], [FromBody], [FromHeader], [FromServices]
// 2. Special types: HttpContext, HttpRequest, HttpResponse, CancellationToken
// 3. Route parameter matching
// 4. Query string (simple types)
// 5. Request body (complex types)
// 6. Dependency injection services
```

## Key Points

### Basic Route Mapping Methods

- `MapGet()` - Handle GET requests
- `MapPost()` - Handle POST requests
- `MapPut()` - Handle PUT requests
- `MapDelete()` - Handle DELETE requests
- `MapPatch()` - Handle PATCH requests
- `MapMethods()` - Handle multiple HTTP methods
- `Map()` - Handle all HTTP methods

### Parameter Binding Sources

- **Route Parameters**: Extracted from URL path
- **Query Parameters**: Extracted from query string
- **Request Body**: Deserialized from request body
- **Headers**: Extracted from HTTP headers
- **Services**: Resolved from dependency injection container

### Results Class Return Values

- `Results.Ok()` - 200 Success
- `Results.Created()` - 201 Created
- `Results.NoContent()` - 204 No Content
- `Results.BadRequest()` - 400 Bad Request
- `Results.NotFound()` - 404 Not Found
- `Results.Problem()` - Problem Details response

### Filter Types

- **Endpoint Filters**: Similar to MVC Action Filters
- **Route Group Filters**: Applied to entire route groups
- **Global Filters**: Applied to all endpoints

## Code Examples

### Quick Start Example

```csharp
// Program.cs - Minimal Minimal API
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Define a simple GET endpoint
app.MapGet("/", () => "Hello, Minimal API!");

// Endpoint with route parameter
app.MapGet("/hello/{name}", (string name) => $"Hello, {name}!");

app.Run();
```

### MapGet and MapPost In-Depth

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Simulated data storage
var products = new List<Product>
{
    new Product(1, "Laptop", 5999.00m, 10),
    new Product(2, "Wireless Mouse", 99.00m, 50),
    new Product(3, "Mechanical Keyboard", 399.00m, 30)
};

// GET - Get all products
app.MapGet("/api/products", () => Results.Ok(products))
   .WithName("GetProducts")
   .WithTags("Products")
   .Produces<List<Product>>(StatusCodes.Status200OK);

// GET - Get product by ID
app.MapGet("/api/products/{id:int}", (int id) =>
{
    var product = products.FirstOrDefault(p => p.Id == id);
    return product is not null
        ? Results.Ok(product)
        : Results.NotFound(new { Message = $"Product ID {id} does not exist" });
})
.WithName("GetProductById")
.WithTags("Products")
.Produces<Product>(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound);

// GET - Search with query parameters
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

// POST - Create new product
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

// PUT - Update product
app.MapPut("/api/products/{id:int}", (int id, UpdateProductRequest request) =>
{
    var index = products.FindIndex(p => p.Id == id);
    if (index == -1)
        return Results.NotFound(new { Message = $"Product ID {id} does not exist" });

    var updatedProduct = new Product(id, request.Name, request.Price, request.Stock);
    products[index] = updatedProduct;

    return Results.Ok(updatedProduct);
})
.WithName("UpdateProduct")
.WithTags("Products");

// DELETE - Delete product
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

// Data models
public record Product(int Id, string Name, decimal Price, int Stock);
public record CreateProductRequest(string Name, decimal Price, int Stock);
public record UpdateProductRequest(string Name, decimal Price, int Stock);
```

### Route Handlers In-Depth

```csharp
var app = WebApplication.Create(args);

// 1. Lambda expression handler
app.MapGet("/lambda", () => "Lambda handler");

// 2. Local function handler
app.MapGet("/local-function", LocalHandler);
string LocalHandler() => "Local function handler";

// 3. Static method handler
app.MapGet("/static-method", Handlers.StaticHandler);

// 4. Instance method handler
var handler = new MyHandler();
app.MapGet("/instance-method", handler.Handle);

// 5. Async handler
app.MapGet("/async", async () =>
{
    await Task.Delay(100);
    return "Async handler";
});

// 6. Async handler returning Task<IResult>
app.MapGet("/async-result", async (HttpContext context) =>
{
    await Task.Delay(100);
    return Results.Ok(new { Message = "Async result", Time = DateTime.Now });
});

// 7. Handler with dependency injection
app.MapGet("/with-services", (ILogger<Program> logger) =>
{
    logger.LogInformation("Processing request");
    return "Handler with services";
});

// 8. Handler with HttpContext
app.MapGet("/with-context", (HttpContext context) =>
{
    var userAgent = context.Request.Headers.UserAgent;
    return $"User-Agent: {userAgent}";
});

app.Run();

// Handler classes
public static class Handlers
{
    public static string StaticHandler() => "Static method handler";
}

public class MyHandler
{
    public string Handle() => "Instance method handler";
}
```

### Parameter Binding In-Depth

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IUserService, UserService>();
var app = builder.Build();

// 1. Route parameter binding
app.MapGet("/users/{id}", (int id) => $"User ID: {id}");

// 2. Multiple route parameters
app.MapGet("/users/{userId}/orders/{orderId}",
    (int userId, int orderId) => $"User {userId}'s order {orderId}");

// 3. Optional route parameter
app.MapGet("/items/{id?}", (int? id) =>
    id.HasValue ? $"Item ID: {id}" : "All items");

// 4. Route constraints
app.MapGet("/products/{id:int:min(1)}", (int id) => $"Product ID: {id}");
app.MapGet("/files/{*path}", (string path) => $"File path: {path}"); // Wildcard route

// 5. Query parameter binding
app.MapGet("/search", (string query, int page = 1, int pageSize = 10) =>
    $"Search: {query}, Page: {page}, PageSize: {pageSize}");

// 6. Explicit query parameter specification
app.MapGet("/filter", ([FromQuery(Name = "q")] string searchTerm) =>
    $"Search term: {searchTerm}");

// 7. Request body binding (POST/PUT)
app.MapPost("/users", ([FromBody] CreateUserRequest request) =>
    Results.Created($"/users/{1}", new { Id = 1, request.Name, request.Email }));

// 8. Header binding
app.MapGet("/headers", (
    [FromHeader(Name = "X-Request-Id")] string? requestId,
    [FromHeader(Name = "Accept-Language")] string? language) =>
    $"Request ID: {requestId}, Language: {language}");

// 9. Service injection
app.MapGet("/users/{id}/profile", (
    int id,
    [FromServices] IUserService userService) =>
{
    var user = userService.GetUser(id);
    return user is not null ? Results.Ok(user) : Results.NotFound();
});

// 10. HttpContext and related types
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

// 11. Form data binding
app.MapPost("/upload", async ([FromForm] IFormFile file) =>
{
    if (file.Length == 0)
        return Results.BadRequest("File is empty");

    var fileName = Path.GetRandomFileName();
    var filePath = Path.Combine("uploads", fileName);

    using var stream = File.Create(filePath);
    await file.CopyToAsync(stream);

    return Results.Ok(new { FileName = fileName, Size = file.Length });
}).DisableAntiforgery(); // Disable CSRF protection (for demo only)

// 12. Complex type auto-binding
app.MapGet("/complex", (PaginationParams pagination) =>
    $"Page: {pagination.Page}, PageSize: {pagination.PageSize}");

// 13. Custom parameter binding (implementing IParsable<T>)
app.MapGet("/point/{point}", (Point point) =>
    $"Coordinates: X={point.X}, Y={point.Y}");

app.Run();

// Data models
public record CreateUserRequest(string Name, string Email);

// Complex type supporting query string binding
public class PaginationParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    // Static TryParse method enables binding from query string
    public static bool TryParse(string? value, out PaginationParams? result)
    {
        result = new PaginationParams();
        return true;
    }
}

// Custom parsable type
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

// Service interface and implementation
public interface IUserService
{
    User? GetUser(int id);
}

public class UserService : IUserService
{
    private readonly List<User> _users = new()
    {
        new User(1, "John Doe", "john@example.com"),
        new User(2, "Jane Smith", "jane@example.com")
    };

    public User? GetUser(int id) => _users.FirstOrDefault(u => u.Id == id);
}

public record User(int Id, string Name, string Email);
```

### Results Class In-Depth

```csharp
var app = WebApplication.Create(args);

// 1. Success responses
app.MapGet("/ok", () => Results.Ok(new { Message = "Success" }));
app.MapGet("/ok-empty", () => Results.Ok()); // 200 no content

// 2. Created success
app.MapPost("/created", () =>
    Results.Created("/items/1", new { Id = 1, Name = "New Item" }));

app.MapPost("/created-at-route", () =>
    Results.CreatedAtRoute("GetItem", new { id = 1 }, new { Id = 1, Name = "New Item" }));

// 3. No content response
app.MapDelete("/items/{id}", (int id) => Results.NoContent());

// 4. Accepted for processing
app.MapPost("/async-job", () => Results.Accepted("/jobs/123", new { JobId = "123" }));

// 5. Error responses
app.MapGet("/bad-request", () =>
    Results.BadRequest(new { Error = "Invalid request parameters" }));

app.MapGet("/not-found", () =>
    Results.NotFound(new { Error = "Resource not found" }));

app.MapGet("/unauthorized", () => Results.Unauthorized());

app.MapGet("/forbidden", () => Results.Forbid());

app.MapGet("/conflict", () =>
    Results.Conflict(new { Error = "Resource conflict" }));

app.MapGet("/unprocessable", () =>
    Results.UnprocessableEntity(new { Error = "Unprocessable entity" }));

// 6. Server error
app.MapGet("/error", () =>
    Results.Problem(
        title: "Internal Server Error",
        detail: "An error occurred while processing the request",
        statusCode: 500));

// 7. Validation problem
app.MapPost("/validate", (CreateItemRequest request) =>
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrEmpty(request.Name))
        errors["Name"] = new[] { "Name cannot be empty" };

    if (request.Price <= 0)
        errors["Price"] = new[] { "Price must be greater than 0" };

    if (errors.Any())
        return Results.ValidationProblem(errors);

    return Results.Ok(request);
});

// 8. Redirects
app.MapGet("/redirect", () => Results.Redirect("/new-location"));
app.MapGet("/redirect-permanent", () => Results.Redirect("/new-location", permanent: true));
app.MapGet("/redirect-to-route", () => Results.RedirectToRoute("GetItem", new { id = 1 }));

// 9. File responses
app.MapGet("/file", () => Results.File(
    fileContents: System.Text.Encoding.UTF8.GetBytes("File content"),
    contentType: "text/plain",
    fileDownloadName: "example.txt"));

app.MapGet("/file-stream", () =>
{
    var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("Stream content"));
    return Results.File(stream, "text/plain", "stream.txt");
});

app.MapGet("/file-path", () =>
    Results.File("/path/to/file.pdf", "application/pdf", "document.pdf"));

// 10. JSON response (custom serialization)
app.MapGet("/json", () => Results.Json(
    new { Name = "Test", Time = DateTime.Now },
    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));

// 11. Content responses
app.MapGet("/text", () => Results.Text("Plain text content", "text/plain"));
app.MapGet("/html", () => Results.Text("<h1>HTML Content</h1>", "text/html"));

// 12. Byte response
app.MapGet("/bytes", () => Results.Bytes(
    new byte[] { 0x48, 0x65, 0x6C, 0x6C, 0x6F },
    "application/octet-stream"));

// 13. Stream response
app.MapGet("/stream", () =>
{
    var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("Stream data"));
    return Results.Stream(stream, "application/octet-stream");
});

// 14. Empty response
app.MapGet("/empty", () => Results.Empty);

// 15. Status code response
app.MapGet("/status", () => Results.StatusCode(418)); // I'm a teapot

// 16. Conditional response
app.MapGet("/conditional/{id}", (int id) =>
{
    if (id < 0)
        return Results.BadRequest("ID cannot be negative");
    if (id == 0)
        return Results.NotFound();
    if (id > 1000)
        return Results.Problem("ID out of range", statusCode: 422);

    return Results.Ok(new { Id = id, Name = $"Item {id}" });
});

// 17. TypedResults (strongly typed results for OpenAPI)
app.MapGet("/typed/{id}", (int id) =>
{
    if (id <= 0)
        return TypedResults.BadRequest("Invalid ID");

    return TypedResults.Ok(new Item(id, $"Item {id}"));
});

// Name the endpoint (for CreatedAtRoute, etc.)
app.MapGet("/items/{id}", (int id) => Results.Ok(new Item(id, $"Item {id}")))
   .WithName("GetItem");

app.Run();

public record CreateItemRequest(string Name, decimal Price);
public record Item(int Id, string Name);
```

### Filters In-Depth

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ILogger<Program>>(sp =>
    sp.GetRequiredService<ILoggerFactory>().CreateLogger<Program>());

var app = builder.Build();

// 1. Simple endpoint filter (using Lambda)
app.MapGet("/filter-lambda", () => "Hello")
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("Filter: Before request");
       var result = await next(context);
       Console.WriteLine("Filter: After request");
       return result;
   });

// 2. Multiple filters (executed in order of addition)
app.MapGet("/multi-filters", () => "Multi-filters")
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("Filter 1 - Before");
       var result = await next(context);
       Console.WriteLine("Filter 1 - After");
       return result;
   })
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("Filter 2 - Before");
       var result = await next(context);
       Console.WriteLine("Filter 2 - After");
       return result;
   });
// Output order: Filter 1 - Before → Filter 2 - Before → Handler → Filter 2 - After → Filter 1 - After

// 3. Typed filter
app.MapGet("/typed-filter", () => "Typed filter")
   .AddEndpointFilter<LoggingFilter>();

// 4. Filter with factory
app.MapGet("/factory-filter", () => "Factory filter")
   .AddEndpointFilterFactory((context, next) =>
   {
       // Can access EndpointFilterFactoryContext
       var methodInfo = context.MethodInfo;
       Console.WriteLine($"Endpoint method: {methodInfo.Name}");

       return async invocationContext =>
       {
           Console.WriteLine("Factory filter executing");
           return await next(invocationContext);
       };
   });

// 5. Validation filter
app.MapPost("/validate-filter", (CreateProductRequest request) =>
    Results.Ok(request))
   .AddEndpointFilter<ValidationFilter<CreateProductRequest>>();

// 6. Authentication/Authorization filter
app.MapGet("/auth-filter", () => "Requires authentication")
   .AddEndpointFilter(async (context, next) =>
   {
       var httpContext = context.HttpContext;
       var authHeader = httpContext.Request.Headers.Authorization.FirstOrDefault();

       if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
       {
           return Results.Unauthorized();
       }

       // Validate token (simplified example)
       var token = authHeader.Substring("Bearer ".Length);
       if (token != "valid-token")
       {
           return Results.Forbid();
       }

       return await next(context);
   });

// 7. Rate limiting filter
app.MapGet("/rate-limit", () => "Rate limited endpoint")
   .AddEndpointFilter<RateLimitFilter>();

// 8. Caching filter
app.MapGet("/cached", () => new { Time = DateTime.Now })
   .AddEndpointFilter<SimpleCacheFilter>();

// 9. Accessing and modifying parameters
app.MapGet("/modify-param/{name}", (string name) => $"Hello, {name}")
   .AddEndpointFilter(async (context, next) =>
   {
       // Get parameter
       var name = context.GetArgument<string>(0);
       Console.WriteLine($"Original name: {name}");

       // Modify parameter (if needed)
       if (string.IsNullOrEmpty(name))
       {
           context.Arguments[0] = "World";
       }

       return await next(context);
   });

// 10. Modifying response
app.MapGet("/modify-response", () => new { Message = "Original response" })
   .AddEndpointFilter(async (context, next) =>
   {
       var result = await next(context);

       // Wrap response
       return Results.Ok(new
       {
           Data = result,
           Timestamp = DateTime.UtcNow,
           RequestId = Guid.NewGuid()
       });
   });

// 11. Route group filter
var apiGroup = app.MapGroup("/api")
   .AddEndpointFilter(async (context, next) =>
   {
       Console.WriteLine("API group filter");
       return await next(context);
   });

apiGroup.MapGet("/users", () => "User list");
apiGroup.MapGet("/products", () => "Product list");

// 12. Nested route group filter
var v1Group = apiGroup.MapGroup("/v1")
   .AddEndpointFilter(async (context, next) =>
   {
       context.HttpContext.Response.Headers.Append("X-API-Version", "1.0");
       return await next(context);
   });

v1Group.MapGet("/items", () => "V1 items");

app.Run();

// Custom filter classes
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

        _logger.LogInformation("Request started: {Method} {Path}", method, path);
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            var result = await next(context);

            stopwatch.Stop();
            _logger.LogInformation(
                "Request completed: {Method} {Path} - {ElapsedMs}ms",
                method, path, stopwatch.ElapsedMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Request failed: {Method} {Path} - {ElapsedMs}ms",
                method, path, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}

// Validation filter
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        // Find parameter of type T
        var argument = context.Arguments.OfType<T>().FirstOrDefault();

        if (argument is null)
        {
            return Results.BadRequest("Request body cannot be empty");
        }

        // Simple validation (use FluentValidation in production)
        var validationErrors = new Dictionary<string, string[]>();

        foreach (var prop in typeof(T).GetProperties())
        {
            var value = prop.GetValue(argument);

            if (prop.PropertyType == typeof(string) && string.IsNullOrEmpty(value as string))
            {
                validationErrors[prop.Name] = new[] { $"{prop.Name} cannot be empty" };
            }
        }

        if (validationErrors.Any())
        {
            return Results.ValidationProblem(validationErrors);
        }

        return await next(context);
    }
}

// Rate limiting filter
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

// Simple caching filter
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

        // Check cache
        if (_cache.TryGetValue(cacheKey, out var entry) && now < entry.Expiry)
        {
            context.HttpContext.Response.Headers.Append("X-Cache", "HIT");
            return entry.Value;
        }

        // Execute handler
        var result = await next(context);

        // Store in cache
        _cache[cacheKey] = (result, now.Add(CacheDuration));
        context.HttpContext.Response.Headers.Append("X-Cache", "MISS");

        return result;
    }
}

public record CreateProductRequest(string Name, decimal Price, int Stock);
```

### Route Groups

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();

var app = builder.Build();

// 1. Basic route group
var api = app.MapGroup("/api");

api.MapGet("/health", () => "OK");
api.MapGet("/version", () => new { Version = "1.0.0" });

// 2. Nested route groups
var v1 = api.MapGroup("/v1");
var v2 = api.MapGroup("/v2");

// V1 user endpoints
var v1Users = v1.MapGroup("/users")
    .WithTags("Users V1");

v1Users.MapGet("/", () => "V1 user list");
v1Users.MapGet("/{id}", (int id) => $"V1 user {id}");

// V2 user endpoints (may have different response format)
var v2Users = v2.MapGroup("/users")
    .WithTags("Users V2");

v2Users.MapGet("/", () => new { Users = new[] { "User1", "User2" }, Format = "V2" });
v2Users.MapGet("/{id}", (int id) => new { Id = id, Version = "V2" });

// 3. Route group with filters
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

authenticated.MapGet("/profile", () => "User profile");
authenticated.MapGet("/settings", () => "User settings");

// 4. Route group with shared configuration
var products = api.MapGroup("/products")
    .WithTags("Products")
    .WithOpenApi()
    .RequireAuthorization(); // Requires authentication service configuration

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

// 5. Pattern for organizing large APIs
ConfigureUserEndpoints(api);
ConfigureProductEndpoints(api);
ConfigureOrderEndpoints(api);

app.Run();

// Using static methods or extension methods to organize endpoints
static void ConfigureUserEndpoints(RouteGroupBuilder group)
{
    var users = group.MapGroup("/users").WithTags("Users");

    users.MapGet("/", GetUsers);
    users.MapGet("/{id}", GetUserById);
    users.MapPost("/", CreateUser);
    users.MapPut("/{id}", UpdateUser);
    users.MapDelete("/{id}", DeleteUser);
}

static IResult GetUsers() => Results.Ok(new[] { "User1", "User2" });
static IResult GetUserById(int id) => Results.Ok($"User {id}");
static IResult CreateUser() => Results.Created("/users/1", new { Id = 1 });
static IResult UpdateUser(int id) => Results.Ok($"Updated user {id}");
static IResult DeleteUser(int id) => Results.NoContent();

static void ConfigureProductEndpoints(RouteGroupBuilder group)
{
    var products = group.MapGroup("/products").WithTags("Products");
    // Add product-related endpoints...
}

static void ConfigureOrderEndpoints(RouteGroupBuilder group)
{
    var orders = group.MapGroup("/orders").WithTags("Orders");
    // Add order-related endpoints...
}

// Repository interfaces and implementations
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
        Task.FromResult<User?>(new User(id, $"User{id}", $"user{id}@example.com"));
}

public class ProductRepository : IProductRepository
{
    private readonly List<Product> _products = new()
    {
        new Product(1, "Product1", 99.99m),
        new Product(2, "Product2", 199.99m)
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

### Complete Project Example

```csharp
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("TodoDb"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Todo API", Version = "v1" });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Configure endpoints
var todos = app.MapGroup("/api/todos")
    .WithTags("Todos")
    .WithOpenApi();

// Get all todos
todos.MapGet("/", async (AppDbContext db, bool? completed) =>
{
    var query = db.Todos.AsQueryable();

    if (completed.HasValue)
        query = query.Where(t => t.IsCompleted == completed.Value);

    return TypedResults.Ok(await query.ToListAsync());
})
.WithName("GetTodos")
.WithSummary("Get todo list")
.WithDescription("Returns all todos, optionally filtered by completion status");

// Get single todo
todos.MapGet("/{id}", async Task<Results<Ok<Todo>, NotFound>> (int id, AppDbContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    return todo is not null
        ? TypedResults.Ok(todo)
        : TypedResults.NotFound();
})
.WithName("GetTodoById")
.WithSummary("Get single todo");

// Create todo
todos.MapPost("/", async Task<Results<Created<Todo>, ValidationProblem>> (
    CreateTodoRequest request,
    AppDbContext db) =>
{
    // Validation
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.Title))
        errors["Title"] = new[] { "Title cannot be empty" };
    if (request.Title?.Length > 200)
        errors["Title"] = new[] { "Title cannot exceed 200 characters" };

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
.WithSummary("Create new todo");

// Update todo
todos.MapPut("/{id}", async Task<Results<Ok<Todo>, NotFound, ValidationProblem>> (
    int id,
    UpdateTodoRequest request,
    AppDbContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null)
        return TypedResults.NotFound();

    // Validation
    var errors = new Dictionary<string, string[]>();
    if (string.IsNullOrWhiteSpace(request.Title))
        errors["Title"] = new[] { "Title cannot be empty" };

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
.WithSummary("Update todo");

// Toggle completion status
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
.WithSummary("Toggle todo completion status");

// Delete todo
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
.WithSummary("Delete todo");

// Batch operations
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
.WithSummary("Batch complete todos");

// Statistics
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
.WithSummary("Get todo statistics");

// Initialize test data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.Todos.Any())
    {
        db.Todos.AddRange(
            new Todo { Title = "Learn Minimal API", Description = "Read official documentation", CreatedAt = DateTime.UtcNow },
            new Todo { Title = "Write sample code", Description = "Create demo project", CreatedAt = DateTime.UtcNow },
            new Todo { Title = "Deploy application", DueDate = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow }
        );
        db.SaveChanges();
    }
}

app.Run();

// Data models
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

// Request DTOs
public record CreateTodoRequest(string? Title, string? Description, DateTime? DueDate);
public record UpdateTodoRequest(string? Title, string? Description, DateTime? DueDate, bool IsCompleted);

// Response DTOs
public record TodoStats(int Total, int Completed, int Pending, int Overdue);

// Database context
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Todo> Todos => Set<Todo>();
}
```

## Best Practices

### Project Structure Organization

```
MinimalApiProject/
├── Program.cs              # Application entry and configuration
├── Endpoints/              # Endpoint definitions
│   ├── UserEndpoints.cs
│   ├── ProductEndpoints.cs
│   └── OrderEndpoints.cs
├── Filters/                # Custom filters
│   ├── ValidationFilter.cs
│   └── LoggingFilter.cs
├── Models/                 # Data models
│   ├── Entities/
│   └── DTOs/
├── Services/               # Business services
├── Data/                   # Data access
└── Extensions/             # Extension methods
```

### Use Extension Methods to Organize Endpoints

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

    // ... other methods
}

// Program.cs
app.MapUserEndpoints();
app.MapProductEndpoints();
```

### Use TypedResults for Better OpenAPI Support

```csharp
// Use TypedResults instead of Results
app.MapGet("/items/{id}", async Task<Results<Ok<Item>, NotFound>> (int id, IItemService service) =>
{
    var item = await service.GetByIdAsync(id);
    return item is not null
        ? TypedResults.Ok(item)
        : TypedResults.NotFound();
});
```

### Validate Request Data

```csharp
// Using FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

app.MapPost("/users", async (CreateUserRequest request, IValidator<CreateUserRequest> validator) =>
{
    var result = await validator.ValidateAsync(request);
    if (!result.IsValid)
    {
        return Results.ValidationProblem(result.ToDictionary());
    }

    // Process request...
});
```

### Handle Async Operations Correctly

```csharp
// Always use async/await
app.MapGet("/data", async (IDataService service, CancellationToken cancellationToken) =>
{
    var data = await service.GetDataAsync(cancellationToken);
    return Results.Ok(data);
});
```

### Use Dependency Injection

```csharp
// Register services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();

// Use in endpoints
app.MapGet("/users", async (IUserService userService) =>
{
    return await userService.GetAllAsync();
});
```

### Configure CORS and Authentication

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

## Common Pitfalls

### Forgetting to Handle Null Values

```csharp
// Wrong: May throw NullReferenceException
app.MapGet("/users/{id}", async (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return Results.Ok(user.Name); // user may be null
});

// Correct: Check for null
app.MapGet("/users/{id}", async (int id, IUserService service) =>
{
    var user = await service.GetByIdAsync(id);
    return user is not null
        ? Results.Ok(user)
        : Results.NotFound();
});
```

### Route Parameter Type Mismatch

```csharp
// Wrong: id is a string but expecting integer
app.MapGet("/users/{id}", (int id) => $"User {id}");
// Request /users/abc will return 400

// Correct: Use route constraints or handle conversion
app.MapGet("/users/{id:int}", (int id) => $"User {id}");
```

### Ignoring CancellationToken

```csharp
// Wrong: Does not support cancellation
app.MapGet("/slow", async () =>
{
    await Task.Delay(10000);
    return "Done";
});

// Correct: Support cancellation
app.MapGet("/slow", async (CancellationToken cancellationToken) =>
{
    await Task.Delay(10000, cancellationToken);
    return "Done";
});
```

### Filter Order Issues

```csharp
// Filters execute in order of addition
// If auth filter comes after logging filter, unauthenticated requests will still be logged
app.MapGet("/secure", () => "Secret")
   .AddEndpointFilter<LoggingFilter>()    // Executes first
   .AddEndpointFilter<AuthFilter>();       // Executes second

// Correct order
app.MapGet("/secure", () => "Secret")
   .AddEndpointFilter<AuthFilter>()        // Authenticate first
   .AddEndpointFilter<LoggingFilter>();    // Then log
```

### Using Async Operations in Synchronous Methods

```csharp
// Wrong: May cause deadlock
app.MapGet("/data", (IDataService service) =>
{
    var data = service.GetDataAsync().Result; // Blocking
    return Results.Ok(data);
});

// Correct: Use async/await
app.MapGet("/data", async (IDataService service) =>
{
    var data = await service.GetDataAsync();
    return Results.Ok(data);
});
```

### Capturing Mutable State in Closures

```csharp
// Wrong: Shared mutable state
var counter = 0;
app.MapGet("/count", () =>
{
    counter++; // Not thread-safe
    return counter;
});

// Correct: Use services or atomic operations
builder.Services.AddSingleton<CounterService>();
app.MapGet("/count", (CounterService counter) =>
{
    return counter.Increment();
});
```

## Performance Considerations

### Route Matching Optimization

```csharp
// Use route constraints to reduce unnecessary matching
app.MapGet("/users/{id:int}", ...);           // Only matches integers
app.MapGet("/users/{id:guid}", ...);          // Only matches GUIDs
app.MapGet("/files/{*path:regex(^[a-z]+$)}", ...); // Regex constraint
```

### Response Caching

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

### Response Compression

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var app = builder.Build();
app.UseResponseCompression();
```

### Async Database Operations

```csharp
// Always use async database methods
app.MapGet("/users", async (AppDbContext db) =>
{
    return await db.Users.AsNoTracking().ToListAsync();
});
```

### Reduce Unnecessary Allocations

```csharp
// Avoid creating unnecessary objects
app.MapGet("/status", () => Results.Ok()); // Good

// Use ValueTask for potentially synchronous operations
app.MapGet("/cached", async ValueTask<IResult> (ICache cache, string key) =>
{
    if (cache.TryGet(key, out var value))
        return Results.Ok(value); // Synchronous return

    var data = await FetchDataAsync(key);
    return Results.Ok(data);
});
```

### Use Filters Wisely

```csharp
// Frequently executed logic in filters may affect performance
// Consider using caching or optimizing algorithms

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
        // Use caching to avoid repeated calculations
        var cacheKey = GenerateCacheKey(context);

        if (_cache.TryGetValue(cacheKey, out var cached))
            return cached;

        var result = await next(context);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));

        return result;
    }
}
```

## Practical Scenarios

### Scenario 1: RESTful CRUD API

Used for building standard resource management APIs, such as user management, product management, etc.

### Scenario 2: Microservice Endpoints

Used for building lightweight microservices, such as authentication services, notification services, etc.

### Scenario 3: BFF (Backend for Frontend)

Backend API customized for specific frontend applications.

### Scenario 4: Webhook Receiver

Handling callback notifications from third-party services.

```csharp
app.MapPost("/webhooks/payment", async (
    HttpRequest request,
    PaymentWebhookRequest payload,
    IPaymentService service) =>
{
    // Verify signature
    var signature = request.Headers["X-Webhook-Signature"].FirstOrDefault();
    if (!service.VerifySignature(payload, signature))
        return Results.Unauthorized();

    await service.ProcessPaymentAsync(payload);
    return Results.Ok();
});
```

### Scenario 5: Health Check Endpoints

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

## Interview Key Points

### Basic Concept Questions

**Q1: What are the main differences between Minimal API and Controller-based API?**

A: Main differences include:
- Minimal API uses functional style, defining routes directly in Program.cs
- Controller API uses OOP style, requiring creation of Controller classes
- Minimal API has less code, faster startup
- Controller API has more complete features, suitable for complex scenarios

**Q2: How do you perform parameter binding in Minimal API?**

A: Parameter binding sources include:
- Route parameters: Automatically bound from URL path
- Query parameters: Use `[FromQuery]` or auto-bind simple types
- Request body: Use `[FromBody]` or auto-bind complex types
- Headers: Use `[FromHeader]`
- Services: Use `[FromServices]` or auto-resolve from DI container

**Q3: What are the commonly used methods in the Results class?**

A: Common methods include:
- `Results.Ok()` / `Results.Ok(value)` - 200 response
- `Results.Created()` - 201 response
- `Results.NoContent()` - 204 response
- `Results.BadRequest()` - 400 response
- `Results.NotFound()` - 404 response
- `Results.Problem()` - Problem details response
- `Results.ValidationProblem()` - Validation problem response

### Advanced Practice Questions

**Q4: How do you implement filters in Minimal API?**

```csharp
// Method 1: Lambda filter
app.MapGet("/", () => "Hello")
   .AddEndpointFilter(async (context, next) =>
   {
       // Pre-processing logic
       var result = await next(context);
       // Post-processing logic
       return result;
   });

// Method 2: Implement IEndpointFilter interface
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

**Q5: How do you organize large Minimal API projects?**

A: Recommended approaches:
- Use route groups (MapGroup) to organize related endpoints
- Use extension methods to move endpoint definitions to separate files
- Use filters to handle cross-cutting concerns
- Follow layered architecture, separating business logic into service layer

**Q6: What HTTP methods does Minimal API support?**

A: All standard HTTP methods are supported:
- MapGet, MapPost, MapPut, MapDelete, MapPatch
- MapMethods (specify multiple methods)
- Map (matches all methods)

## Further Reading

- [ASP.NET Core Minimal APIs Official Documentation](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis)
- [Minimal API Tutorial](https://docs.microsoft.com/aspnet/core/tutorials/min-web-api)
- [Migrating from Controller to Minimal API](https://docs.microsoft.com/aspnet/core/migration/50-to-60)
- [ASP.NET Core Performance Best Practices](https://docs.microsoft.com/aspnet/core/performance/performance-best-practices)
- [Minimal API Filters](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis/min-api-filters)
- [OpenAPI Support](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis/openapi)
