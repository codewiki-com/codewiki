---
title: ASP.NET Core Web Development
description: Learn ASP.NET Core for modern web development including MVC, Web API and middleware
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - ASP.NET Core
  - Web
  - API
status: imported
origin: old/src/content/docs/csharp/aspnet-core.en.md
divergence: 0.22
issues: []
legacy:
  category: CSharp
  subcategory: Web Development
  order: 13
  lastUpdated: 2026-01-07
---

ASP.NET Core is a cross-platform, high-performance, open-source framework for building modern, cloud-enabled, internet-connected applications. It is a complete rewrite of ASP.NET that unifies MVC and Web API into a single programming model, providing a modular architecture that enables developers to include only the components they need.

## Introduction and Setup

ASP.NET Core represents a significant evolution from the original ASP.NET framework, designed from the ground up for modern web development scenarios.

### Key Features

- **Cross-Platform**: Runs on Windows, Linux, and macOS
- **High Performance**: One of the fastest web frameworks available
- **Modular Architecture**: Pay-for-what-you-use model with NuGet packages
- **Built-in Dependency Injection**: First-class DI support throughout
- **Unified Programming Model**: MVC and Web API share the same base
- **Cloud-Ready**: Designed for cloud deployment and containerization
- **Open Source**: Fully open-source with community contributions

### Creating a New Project

Create a new ASP.NET Core project using the .NET CLI:

```bash
# Create a new Web API project
dotnet new webapi -n MyWebApi

# Create a new MVC project
dotnet new mvc -n MyMvcApp

# Create a minimal API project
dotnet new web -n MyMinimalApi

# Create a Razor Pages project
dotnet new webapp -n MyRazorApp

# Run the application
cd MyWebApi
dotnet run
```

### Project Structure

A typical ASP.NET Core project structure:

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

### Minimal Program.cs

ASP.NET Core 6+ uses a minimal hosting model:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline
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

## Application Architecture

Understanding the request pipeline and application lifecycle is fundamental to ASP.NET Core development.

### WebApplication and WebApplicationBuilder

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configure services (Dependency Injection)
builder.Services.AddControllers();
builder.Services.AddScoped<IMyService, MyService>();

// Configure logging
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// Configure Kestrel (web server)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
});

// Access configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var app = builder.Build();

// Configure middleware pipeline
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Host Configuration

```csharp
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    ApplicationName = "MyApp",
    ContentRootPath = Directory.GetCurrentDirectory(),
    EnvironmentName = Environments.Production,
    WebRootPath = "wwwroot"
});

// Configure host settings
builder.Host.ConfigureHostOptions(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(30);
});

// Use a specific URL
builder.WebHost.UseUrls("http://localhost:5000", "https://localhost:5001");
```

### Environment-Based Configuration

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

// Custom environment check
if (app.Environment.IsEnvironment("Testing"))
{
    // Testing-specific configuration
}
```

## Dependency Injection

ASP.NET Core has a built-in dependency injection container that is fundamental to the framework.

### Service Lifetimes

```csharp
var builder = WebApplication.CreateBuilder(args);

// Transient: New instance every time requested
builder.Services.AddTransient<ITransientService, TransientService>();

// Scoped: One instance per HTTP request
builder.Services.AddScoped<IScopedService, ScopedService>();

// Singleton: One instance for the application lifetime
builder.Services.AddSingleton<ISingletonService, SingletonService>();

// Register implementation only (no interface)
builder.Services.AddTransient<ConcreteService>();

// Register with factory method
builder.Services.AddScoped<IComplexService>(serviceProvider =>
{
    var config = serviceProvider.GetRequiredService<IConfiguration>();
    var logger = serviceProvider.GetRequiredService<ILogger<ComplexService>>();
    return new ComplexService(config["ApiKey"], logger);
});
```

### Service Registration Patterns

```csharp
// Multiple implementations of same interface
builder.Services.AddTransient<INotificationService, EmailNotificationService>();
builder.Services.AddTransient<INotificationService, SmsNotificationService>();
builder.Services.AddTransient<INotificationService, PushNotificationService>();

// Inject all implementations
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

// Keyed services (ASP.NET Core 8+)
builder.Services.AddKeyedScoped<INotificationService, EmailNotificationService>("email");
builder.Services.AddKeyedScoped<INotificationService, SmsNotificationService>("sms");

public class OrderService
{
    public OrderService([FromKeyedServices("email")] INotificationService emailService)
    {
        // Uses email notification specifically
    }
}
```

### Options Pattern

```csharp
// Configuration class
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

// Registration
builder.Services.Configure<SmtpSettings>(
    builder.Configuration.GetSection(SmtpSettings.SectionName));

// With validation
builder.Services.AddOptions<SmtpSettings>()
    .Bind(builder.Configuration.GetSection(SmtpSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Usage in service
public class EmailService
{
    private readonly SmtpSettings _settings;

    public EmailService(IOptions<SmtpSettings> options)
    {
        _settings = options.Value;
    }

    // For settings that can change at runtime
    public EmailService(IOptionsMonitor<SmtpSettings> optionsMonitor)
    {
        _settings = optionsMonitor.CurrentValue;
        optionsMonitor.OnChange(settings =>
        {
            // Handle configuration changes
        });
    }

    // For scoped settings (per request)
    public EmailService(IOptionsSnapshot<SmtpSettings> optionsSnapshot)
    {
        _settings = optionsSnapshot.Value;
    }
}
```

### Service Scope and Validation

```csharp
// Validate service registrations at startup
var app = builder.Build();

// Create a scope to resolve scoped services
using (var scope = app.Services.CreateScope())
{
    var myService = scope.ServiceProvider.GetRequiredService<IMyService>();
    // Validate or initialize
}

// Service scope in background services
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

            // Use scoped services
            await dbContext.SaveChangesAsync(stoppingToken);

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
```

## Configuration

ASP.NET Core provides a flexible configuration system that supports multiple sources.

### Configuration Sources

```csharp
var builder = WebApplication.CreateBuilder(args);

// Default configuration sources (in order of precedence):
// 1. appsettings.json
// 2. appsettings.{Environment}.json
// 3. User secrets (Development only)
// 4. Environment variables
// 5. Command-line arguments

// Add custom configuration sources
builder.Configuration
    .AddJsonFile("customsettings.json", optional: true, reloadOnChange: true)
    .AddXmlFile("settings.xml", optional: true)
    .AddIniFile("settings.ini", optional: true)
    .AddEnvironmentVariables(prefix: "MYAPP_")
    .AddCommandLine(args);

// Add Azure Key Vault
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myvault.vault.azure.net/"),
    new DefaultAzureCredential());
```

### Accessing Configuration

```csharp
// Direct access
var builder = WebApplication.CreateBuilder(args);

// Get a simple value
string apiKey = builder.Configuration["ApiKey"];

// Get a nested value
string connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];
// Or using GetConnectionString helper
connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Get a section
IConfigurationSection smtpSection = builder.Configuration.GetSection("Smtp");

// Bind to a class
var smtpSettings = new SmtpSettings();
builder.Configuration.GetSection("Smtp").Bind(smtpSettings);

// Or using Get<T>
var settings = builder.Configuration.GetSection("Smtp").Get<SmtpSettings>();
```

### Configuration in appsettings.json

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

### User Secrets for Development

```bash
# Initialize user secrets
dotnet user-secrets init

# Set a secret
dotnet user-secrets set "ApiKey" "my-secret-key"

# Set nested values
dotnet user-secrets set "Smtp:Password" "secret-password"

# List all secrets
dotnet user-secrets list

# Remove a secret
dotnet user-secrets remove "ApiKey"
```

### Environment Variables

```csharp
// Environment variables override other configuration
// Use double underscore for nested keys
// MYAPP_ConnectionStrings__DefaultConnection=Server=prod...
// MYAPP_Smtp__Host=smtp.prod.example.com

builder.Configuration.AddEnvironmentVariables(prefix: "MYAPP_");

// Access in code
var host = Environment.GetEnvironmentVariable("MYAPP_Smtp__Host");
```

## Middleware

Middleware components form the request processing pipeline in ASP.NET Core.

### Middleware Pipeline

```csharp
var app = builder.Build();

// Middleware executes in the order they are added
// Request flows down, response flows back up

app.Use(async (context, next) =>
{
    // Before next middleware
    Console.WriteLine("Request: " + context.Request.Path);

    await next(); // Call next middleware

    // After next middleware (on way back)
    Console.WriteLine("Response: " + context.Response.StatusCode);
});

// Short-circuit middleware (doesn't call next)
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/health")
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("Healthy");
        return; // Short-circuit
    }

    await next();
});

// Terminal middleware
app.Run(async context =>
{
    await context.Response.WriteAsync("Hello World!");
});
```

### Built-in Middleware

```csharp
var app = builder.Build();

// Static files (wwwroot)
app.UseStaticFiles();

// Custom static files path
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "StaticFiles")),
    RequestPath = "/static"
});

// HTTPS redirection
app.UseHttpsRedirection();

// HSTS (HTTP Strict Transport Security)
app.UseHsts();

// Response compression
app.UseResponseCompression();

// Response caching
app.UseResponseCaching();

// CORS
app.UseCors("AllowAll");

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// Routing
app.UseRouting();

// Endpoint mapping
app.MapControllers();
```

### Custom Middleware Class

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

        // Add timing header
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

// Extension method for clean registration
public static class RequestTimingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestTimingMiddleware>();
    }
}

// Usage
app.UseRequestTiming();
```

### Middleware with Dependencies

```csharp
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    // Scoped services must be injected into InvokeAsync, not constructor
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

### Conditional Middleware

```csharp
var app = builder.Build();

// Map middleware to specific paths
app.Map("/api", apiApp =>
{
    apiApp.UseMiddleware<ApiKeyMiddleware>();
    apiApp.UseRouting();
    apiApp.UseEndpoints(endpoints => endpoints.MapControllers());
});

// Conditional middleware based on request
app.MapWhen(
    context => context.Request.Query.ContainsKey("debug"),
    debugApp =>
    {
        debugApp.UseMiddleware<DebugMiddleware>();
    });

// Use when (inline condition)
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/admin"),
    adminApp =>
    {
        adminApp.UseMiddleware<AdminAuthMiddleware>();
    });
```

## Routing

ASP.NET Core provides powerful routing capabilities for both MVC and minimal APIs.

### Attribute Routing

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

    // Multiple route templates
    [HttpGet]
    [Route("search")]
    [Route("find")]
    public IActionResult Search([FromQuery] string q) => Ok();
}
```

### Route Constraints

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    // Only matches integer IDs
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id) => Ok();

    // Only matches GUIDs
    [HttpGet("guid/{id:guid}")]
    public IActionResult GetByGuid(Guid id) => Ok();

    // String with length constraint
    [HttpGet("code/{code:length(6)}")]
    public IActionResult GetByCode(string code) => Ok();

    // Range constraint
    [HttpGet("page/{page:int:min(1):max(100)}")]
    public IActionResult GetPage(int page) => Ok();

    // Regex constraint
    [HttpGet("sku/{sku:regex(^[A-Z]{{2}}\\d{{4}}$)}")]
    public IActionResult GetBySku(string sku) => Ok();

    // Optional parameter
    [HttpGet("category/{category?}")]
    public IActionResult GetByCategory(string category = "all") => Ok();

    // Catch-all parameter
    [HttpGet("files/{*filePath}")]
    public IActionResult GetFile(string filePath) => Ok();
}
```

### Conventional Routing (MVC)

```csharp
var app = builder.Build();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Area routing
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

// Custom route
app.MapControllerRoute(
    name: "blog",
    pattern: "blog/{year:int}/{month:int}/{slug}",
    defaults: new { controller = "Blog", action = "Post" });
```

### Minimal API Routing

```csharp
var app = builder.Build();

// Basic routes
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

// Route groups
var api = app.MapGroup("/api");
var products = api.MapGroup("/products");

products.MapGet("/", GetAllProducts);
products.MapGet("/{id}", GetProductById);
products.MapPost("/", CreateProduct);
```

### Route Groups and Filters

```csharp
var app = builder.Build();

// Group with common prefix and filters
var adminApi = app.MapGroup("/api/admin")
    .RequireAuthorization("AdminPolicy")
    .AddEndpointFilter<AuditLogFilter>();

adminApi.MapGet("/users", GetUsers);
adminApi.MapDelete("/users/{id}", DeleteUser);

// Endpoint filter
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

## Controllers and Actions

Controllers handle incoming HTTP requests and return responses.

### Controller Basics

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

### Action Return Types

```csharp
[ApiController]
[Route("api/[controller]")]
public class ExamplesController : ControllerBase
{
    // Return specific type
    [HttpGet("string")]
    public string GetString() => "Hello";

    // Return IActionResult for flexibility
    [HttpGet("action-result")]
    public IActionResult GetActionResult()
    {
        return Ok(new { message = "Success" });
    }

    // Return ActionResult<T> for typed responses
    [HttpGet("typed/{id}")]
    public ActionResult<Product> GetTyped(int id)
    {
        var product = _repository.GetById(id);
        if (product == null) return NotFound();
        return product; // Implicit Ok()
    }

    // Async with ActionResult<T>
    [HttpGet("async/{id}")]
    public async Task<ActionResult<Product>> GetAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    // Return file
    [HttpGet("file")]
    public IActionResult GetFile()
    {
        var bytes = System.IO.File.ReadAllBytes("path/to/file.pdf");
        return File(bytes, "application/pdf", "document.pdf");
    }

    // Return stream
    [HttpGet("stream")]
    public IActionResult GetStream()
    {
        var stream = new FileStream("path/to/file.pdf", FileMode.Open);
        return File(stream, "application/pdf");
    }

    // Redirect
    [HttpGet("redirect")]
    public IActionResult Redirect()
    {
        return RedirectToAction("GetString");
        // Or: return Redirect("https://example.com");
        // Or: return RedirectPermanent("https://example.com");
    }
}
```

### Action Filters

```csharp
// Action filter attribute
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

// Async action filter
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

// Register globally
builder.Services.AddControllers(options =>
{
    options.Filters.Add<LoggingActionFilter>();
    options.Filters.Add(new ValidateModelAttribute());
});

// Or use on specific controller/action
[ValidateModel]
[ServiceFilter(typeof(LoggingActionFilter))]
public class ProductsController : ControllerBase
{
}
```

## Web API Development

Building RESTful APIs with ASP.NET Core.

### API Controller Configuration

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

// Add XML formatters
builder.Services.AddControllers()
    .AddXmlSerializerFormatters();

// Configure API behavior
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = false;
    options.SuppressMapClientErrors = false;

    // Custom invalid model state response
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

### Content Negotiation

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

    // Accept specific content type
    [HttpPost]
    [Consumes("application/json")]
    public ActionResult<Product> Create([FromBody] Product product)
    {
        return Created($"/api/products/{product.Id}", product);
    }

    // Multiple content types
    [HttpPost("bulk")]
    [Consumes("application/json", "text/csv")]
    public ActionResult ImportProducts([FromBody] string data)
    {
        // Handle based on content type
        return Ok();
    }
}
```

### API Versioning

```csharp
// Install: dotnet add package Asp.Versioning.Mvc

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

// Version 1 controller
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class ProductsV1Controller : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(new[] { "Product1", "Product2" });
}

// Version 2 controller
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

### OpenAPI/Swagger Documentation

```csharp
// Install: dotnet add package Swashbuckle.AspNetCore

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

    // Include XML comments
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

    // Add JWT authentication to Swagger
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
        options.RoutePrefix = string.Empty; // Swagger at root
    });
}
```

### API Documentation with XML Comments

```csharp
/// <summary>
/// Manages product operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    /// <summary>
    /// Retrieves all products
    /// </summary>
    /// <param name="category">Optional category filter</param>
    /// <param name="minPrice">Minimum price filter</param>
    /// <returns>List of products</returns>
    /// <response code="200">Returns the list of products</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<ProductDto>> GetAll(
        [FromQuery] string? category = null,
        [FromQuery] decimal? minPrice = null)
    {
        // Implementation
        return Ok(new List<ProductDto>());
    }

    /// <summary>
    /// Creates a new product
    /// </summary>
    /// <param name="dto">Product creation data</param>
    /// <returns>The created product</returns>
    /// <response code="201">Product created successfully</response>
    /// <response code="400">Invalid product data</response>
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
        // Implementation
        return CreatedAtAction(nameof(GetById), new { id = 1 }, new ProductDto());
    }
}
```

## Model Binding and Validation

ASP.NET Core automatically binds HTTP request data to action parameters.

### Model Binding Sources

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    // From route
    [HttpGet("{id}")]
    public IActionResult GetById([FromRoute] int id) => Ok();

    // From query string: /api/orders/search?term=laptop&page=1
    [HttpGet("search")]
    public IActionResult Search(
        [FromQuery] string term,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) => Ok();

    // From body (JSON)
    [HttpPost]
    public IActionResult Create([FromBody] CreateOrderDto dto) => Ok();

    // From form data
    [HttpPost("upload")]
    public IActionResult Upload([FromForm] UploadModel model) => Ok();

    // From header
    [HttpGet("with-header")]
    public IActionResult GetWithHeader([FromHeader(Name = "X-Correlation-Id")] string correlationId) => Ok();

    // From services (DI)
    [HttpGet("with-service")]
    public IActionResult GetWithService([FromServices] IOrderService orderService) => Ok();

    // Complex binding
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

### Model Validation with Data Annotations

```csharp
public class CreateProductDto
{
    [Required(ErrorMessage = "Product name is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 100 characters")]
    public string Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [Range(0.01, 999999.99, ErrorMessage = "Price must be between 0.01 and 999999.99")]
    public decimal Price { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
    public int StockQuantity { get; set; }

    [Required]
    [RegularExpression(@"^[A-Z]{2}\d{4}$", ErrorMessage = "SKU must be 2 letters followed by 4 digits")]
    public string Sku { get; set; }

    [Url(ErrorMessage = "Invalid URL format")]
    public string? ImageUrl { get; set; }

    [EmailAddress]
    public string? SupplierEmail { get; set; }

    [Phone]
    public string? SupplierPhone { get; set; }

    [CreditCard]
    public string? PaymentCard { get; set; }

    [Compare(nameof(Price), ErrorMessage = "Sale price must match price")]
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
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; }

    [Required]
    [DataType(DataType.Date)]
    public DateTime DateOfBirth { get; set; }
}
```

### Custom Validation Attributes

```csharp
// Custom validation attribute
public class FutureDateAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is DateTime dateTime)
        {
            if (dateTime <= DateTime.Now)
            {
                return new ValidationResult(ErrorMessage ?? "Date must be in the future");
            }
        }

        return ValidationResult.Success;
    }
}

// Validation attribute with dependency injection
public class UniqueEmailAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        var userService = validationContext.GetService(typeof(IUserService)) as IUserService;

        if (value is string email && userService != null)
        {
            if (userService.EmailExists(email))
            {
                return new ValidationResult("Email already exists");
            }
        }

        return ValidationResult.Success;
    }
}

// Usage
public class CreateUserDto
{
    [Required]
    [EmailAddress]
    [UniqueEmail]
    public string Email { get; set; }

    [FutureDate(ErrorMessage = "Subscription must start in the future")]
    public DateTime SubscriptionStartDate { get; set; }
}
```

### IValidatableObject for Complex Validation

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
        // Ship date must be after order date
        if (ShipDate.HasValue && ShipDate.Value < OrderDate)
        {
            yield return new ValidationResult(
                "Ship date cannot be before order date",
                new[] { nameof(ShipDate) });
        }

        // Discount cannot exceed total
        if (DiscountAmount > TotalAmount)
        {
            yield return new ValidationResult(
                "Discount cannot exceed total amount",
                new[] { nameof(DiscountAmount) });
        }

        // Must have at least one item
        if (!Items.Any())
        {
            yield return new ValidationResult(
                "Order must have at least one item",
                new[] { nameof(Items) });
        }

        // Validate total matches items
        var calculatedTotal = Items.Sum(i => i.Quantity * i.UnitPrice);
        if (Math.Abs(calculatedTotal - TotalAmount) > 0.01m)
        {
            yield return new ValidationResult(
                "Total amount doesn't match item totals",
                new[] { nameof(TotalAmount) });
        }
    }
}
```

### FluentValidation Integration

```csharp
// Install: dotnet add package FluentValidation.AspNetCore

public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductDtoValidator(IProductService productService)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .Length(3, 100).WithMessage("Name must be between 3 and 100 characters")
            .MustAsync(async (name, cancellation) =>
                !await productService.ProductNameExistsAsync(name))
            .WithMessage("Product name already exists");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0")
            .LessThanOrEqualTo(999999.99m);

        RuleFor(x => x.Sku)
            .NotEmpty()
            .Matches(@"^[A-Z]{2}\d{4}$")
            .WithMessage("SKU must be 2 letters followed by 4 digits");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0);

        When(x => x.SalePrice.HasValue, () =>
        {
            RuleFor(x => x.SalePrice)
                .LessThan(x => x.Price)
                .WithMessage("Sale price must be less than regular price");
        });
    }
}

// Registration
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductDtoValidator>();

// Manual validation in controller
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

    // Process valid dto
    return Ok();
}
```

## MVC Views and Razor

ASP.NET Core MVC uses Razor syntax for server-side rendering of HTML.

### Basic View Structure

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
    ViewData["Title"] = "Home Page";
}

<div class="text-center">
    <h1 class="display-4">Welcome</h1>
    <p>Learn about <a href="https://docs.microsoft.com/aspnet/core">ASP.NET Core</a>.</p>
</div>
```

### Razor Syntax

```html
@* Views/Product/Details.cshtml *@
@model ProductViewModel

@{
    ViewData["Title"] = Model.Name;
    var discount = Model.Price * 0.1m;
}

<h1>@Model.Name</h1>
<p>Price: @Model.Price.ToString("C")</p>

@* Conditional rendering *@
@if (Model.IsInStock)
{
    <span class="badge bg-success">In Stock</span>
}
else
{
    <span class="badge bg-danger">Out of Stock</span>
}

@* Loops *@
<ul>
@foreach (var category in Model.Categories)
{
    <li>@category</li>
}
</ul>

@* Switch expression *@
@switch (Model.Status)
{
    case ProductStatus.Active:
        <span class="text-success">Active</span>
        break;
    case ProductStatus.Discontinued:
        <span class="text-danger">Discontinued</span>
        break;
    default:
        <span class="text-muted">Unknown</span>
        break;
}

@* Raw HTML output *@
@Html.Raw(Model.HtmlDescription)

@* URL generation *@
<a href="@Url.Action("Edit", "Product", new { id = Model.Id })">Edit</a>

@* Form example *@
<form asp-controller="Product" asp-action="Update" method="post">
    <input type="hidden" asp-for="Id" />
    <div class="mb-3">
        <label asp-for="Name" class="form-label"></label>
        <input asp-for="Name" class="form-control" />
        <span asp-validation-for="Name" class="text-danger"></span>
    </div>
    <button type="submit" class="btn btn-primary">Save</button>
</form>
```

### Layout and Partial Views

```html
<!-- Views/Shared/_Layout.cshtml -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewData["Title"] - My App</title>
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
            <span class="text-muted">&copy; @DateTime.Now.Year - My App</span>
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
        <a asp-action="Details" asp-route-id="@Model.Id" class="btn btn-primary">View Details</a>
    </div>
</div>
```

```html
<!-- Using partial view -->
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

### View Components

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
<!-- Using view component -->
@await Component.InvokeAsync("ShoppingCart")

<!-- Or using tag helper -->
<vc:shopping-cart></vc:shopping-cart>
```

### Tag Helpers

```html
@* Built-in tag helpers *@
<a asp-controller="Product" asp-action="Details" asp-route-id="@product.Id">View</a>

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
// Custom tag helper
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

// Usage: <alert type="warning" title="Warning!">This is a warning message.</alert>
```

## Authentication and Authorization

ASP.NET Core provides comprehensive authentication and authorization support.

### Cookie Authentication

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

        ModelState.AddModelError("", "Invalid credentials");
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

### JWT Authentication

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

### Authorization Policies

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthorization(options =>
{
    // Role-based policy
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    // Claim-based policy
    options.AddPolicy("CanEditArticles", policy =>
        policy.RequireClaim("Permission", "EditArticles"));

    // Multiple requirements
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

    // Custom requirement
    options.AddPolicy("MinimumAge", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
});
```

```csharp
// Custom authorization requirement
public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; }

    public MinimumAgeRequirement(int minimumAge)
    {
        MinimumAge = minimumAge;
    }
}

// Authorization handler
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

// Register handler
builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();
```

### Using Authorization

```csharp
[Authorize] // Requires authenticated user
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [AllowAnonymous] // Override class-level authorization
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

// Resource-based authorization
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

        // Edit article
        return Ok();
    }
}
```

## Error Handling

Proper error handling ensures a good user experience and aids in debugging.

### Global Exception Handler

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

// Custom exception handler middleware
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
                Message = "An internal server error occurred",
                Detail = app.Environment.IsDevelopment()
                    ? exceptionFeature.Error.Message
                    : null
            };

            await context.Response.WriteAsJsonAsync(error);
        }
    });
});
```

### Exception Handling Middleware

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
        _logger.LogError(exception, "An unhandled exception occurred");

        var (statusCode, message) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, exception.Message),
            ValidationException => (StatusCodes.Status400BadRequest, exception.Message),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
            ForbiddenException => (StatusCodes.Status403Forbidden, "Forbidden"),
            ConflictException => (StatusCodes.Status409Conflict, exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "An error occurred")
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

### Custom Exceptions

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
        : base($"{entityName} with ID {id} was not found", 404) { }
}

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("Validation failed", 400)
    {
        Errors = errors;
    }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409) { }
}

// Usage in services
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

### Problem Details (RFC 7807)

```csharp
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        context.ProblemDetails.Extensions["nodeId"] = Environment.MachineName;
    };
});

// Custom problem details factory
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problemDetails = new ValidationProblemDetails(context.ModelState)
            {
                Type = "https://example.com/validation-error",
                Title = "Validation Error",
                Status = StatusCodes.Status400BadRequest,
                Instance = context.HttpContext.Request.Path
            };

            problemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

            return new BadRequestObjectResult(problemDetails);
        };
    });
```

## Logging

ASP.NET Core includes a built-in logging framework with support for multiple providers.

### Logging Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventSourceLogger();

// Configure from appsettings.json
builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));

// Set minimum level
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Filter specific categories
builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);
builder.Logging.AddFilter("System", LogLevel.Warning);
builder.Logging.AddFilter("MyApp", LogLevel.Debug);
```

### appsettings.json Logging Configuration

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

### Using ILogger

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
        _logger.LogDebug("Fetching product with ID {ProductId}", id);

        try
        {
            var product = await _repository.GetByIdAsync(id);

            if (product == null)
            {
                _logger.LogWarning("Product with ID {ProductId} not found", id);
                return null;
            }

            _logger.LogInformation("Successfully retrieved product {ProductName} (ID: {ProductId})",
                product.Name, product.Id);

            return product;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product with ID {ProductId}", id);
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
            _logger.LogInformation("Creating new product");

            await _repository.AddAsync(product);
            await _repository.SaveChangesAsync();

            _logger.LogInformation("Product created with ID {ProductId}", product.Id);
        }
    }
}
```

### High-Performance Logging

```csharp
// Define log messages at compile time for better performance
public static partial class LogMessages
{
    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Information,
        Message = "Processing order {OrderId} for customer {CustomerId}")]
    public static partial void ProcessingOrder(ILogger logger, int orderId, int customerId);

    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Warning,
        Message = "Order {OrderId} processing took longer than expected: {ElapsedMs}ms")]
    public static partial void OrderProcessingSlow(ILogger logger, int orderId, long elapsedMs);

    [LoggerMessage(
        EventId = 1002,
        Level = LogLevel.Error,
        Message = "Failed to process order {OrderId}")]
    public static partial void OrderProcessingFailed(ILogger logger, Exception ex, int orderId);
}

// Usage
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public async Task ProcessOrderAsync(int orderId, int customerId)
    {
        LogMessages.ProcessingOrder(_logger, orderId, customerId);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Process order
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

### Structured Logging with Serilog

```csharp
// Install: dotnet add package Serilog.AspNetCore

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

## Testing

Testing is essential for building reliable ASP.NET Core applications.

### Unit Testing Controllers

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
        // Arrange
        var productId = 1;
        var product = new ProductDto { Id = productId, Name = "Test Product" };
        _mockService.Setup(s => s.GetByIdAsync(productId))
            .ReturnsAsync(product);

        // Act
        var result = await _controller.GetById(productId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedProduct = Assert.IsType<ProductDto>(okResult.Value);
        Assert.Equal(productId, returnedProduct.Id);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenProductDoesNotExist()
    {
        // Arrange
        _mockService.Setup(s => s.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync((ProductDto)null);

        // Act
        var result = await _controller.GetById(999);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction_WithValidProduct()
    {
        // Arrange
        var createDto = new CreateProductDto { Name = "New Product", Price = 9.99m };
        var createdProduct = new ProductDto { Id = 1, Name = "New Product", Price = 9.99m };

        _mockService.Setup(s => s.CreateAsync(createDto))
            .ReturnsAsync(createdProduct);

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ProductsController.GetById), createdResult.ActionName);
    }
}
```

### Integration Testing with WebApplicationFactory

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
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add in-memory database
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));

                // Seed test data
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
        // Act
        var response = await _client.GetAsync("/api/products");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var products = JsonSerializer.Deserialize<List<ProductDto>>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(products);
    }

    [Fact]
    public async Task Create_ReturnsCreated_WithValidProduct()
    {
        // Arrange
        var newProduct = new CreateProductDto
        {
            Name = "Test Product",
            Price = 19.99m,
            Sku = "TP0001"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", newProduct);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Contains("/api/products/", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WithInvalidProduct()
    {
        // Arrange
        var invalidProduct = new CreateProductDto { Name = "", Price = -1 };

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", invalidProduct);

        // Assert
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

### Testing with Authentication

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

### Testing Minimal APIs

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

## Best Practices

### Project Structure

```
src/
├── MyApp.Api/                    # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Filters/
│   ├── Middleware/
│   ├── Extensions/
│   └── Program.cs
├── MyApp.Application/            # Business logic
│   ├── Services/
│   ├── DTOs/
│   ├── Validators/
│   └── Interfaces/
├── MyApp.Domain/                 # Domain entities
│   ├── Entities/
│   ├── Enums/
│   └── Exceptions/
└── MyApp.Infrastructure/         # Data access, external services
    ├── Data/
    ├── Repositories/
    └── Services/
```

### Service Registration Extensions

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

// Usage in Program.cs
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
```

### Response Wrapper Pattern

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

// Usage in controller
[HttpGet("{id}")]
public async Task<ActionResult<ApiResponse<ProductDto>>> GetById(int id)
{
    var product = await _productService.GetByIdAsync(id);

    if (product == null)
    {
        return NotFound(ApiResponse<ProductDto>.ErrorResponse("Product not found"));
    }

    return Ok(ApiResponse<ProductDto>.SuccessResponse(product));
}
```

### Health Checks

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

// Ready and live endpoints
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
```

### CORS Configuration

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

### Rate Limiting

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
        await context.HttpContext.Response.WriteAsync("Rate limit exceeded", cancellationToken);
    };
});

var app = builder.Build();
app.UseRateLimiter();
```

### Summary of Best Practices

1. **Use dependency injection** throughout your application
2. **Separate concerns** using layers (API, Application, Domain, Infrastructure)
3. **Use DTOs** for data transfer between layers
4. **Validate input** at the API boundary using model validation
5. **Handle exceptions globally** with consistent error responses
6. **Use async/await** for all I/O operations
7. **Configure logging** appropriately for each environment
8. **Implement health checks** for monitoring
9. **Use configuration options pattern** for strongly-typed settings
10. **Write tests** at multiple levels (unit, integration, end-to-end)
11. **Document APIs** using OpenAPI/Swagger
12. **Implement proper authentication and authorization**
13. **Use rate limiting** to protect against abuse
14. **Configure CORS** appropriately for your security requirements

## Conclusion

ASP.NET Core provides a powerful, flexible, and high-performance framework for building modern web applications and APIs. Its modular design, built-in dependency injection, and cross-platform support make it an excellent choice for projects of all sizes.

Key takeaways:

- **WebApplicationBuilder** and **WebApplication** provide a simplified hosting model
- **Dependency Injection** is fundamental to ASP.NET Core architecture
- **Middleware** forms the request processing pipeline
- **Controllers** handle HTTP requests using routing and model binding
- **Authentication and Authorization** are built into the framework
- **Logging and Error Handling** are essential for production applications
- **Testing** ensures reliability and maintainability

By mastering these concepts and following best practices, you can build robust, scalable, and maintainable web applications with ASP.NET Core. The framework continues to evolve with each release, adding new features and performance improvements while maintaining backward compatibility.
