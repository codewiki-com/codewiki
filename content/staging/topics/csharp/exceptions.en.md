---
title: C# 异常处理
description: 掌握 C# 异常处理机制，包括 try-catch-finally、自定义异常和异常最佳实践
track: csharp
section: basics
difficulty: intermediate
tags:
  - C#
  - 异常
  - 错误处理
status: imported
origin: old/src/content/docs/csharp/exceptions.en.md
divergence: 0.214
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 核心概念
  order: 12
  lastUpdated: 2026-01-07
---

Exception handling is the core mechanism in C# for dealing with runtime errors. Through exception handling, programs can gracefully handle error situations, prevent crashes, and provide meaningful error messages. We'll delve into all aspects of C# exception handling.

## What is an Exception

An exception is an unexpected event that occurs during program execution, interrupting the normal program flow. When an exception occurs, the runtime creates an exception object containing detailed information about the error.

```csharp
// Common exception scenarios
int[] numbers = { 1, 2, 3 };
int value = numbers[10];  // IndexOutOfRangeException: Index out of range

int result = 10 / 0;      // DivideByZeroException: Division by zero

string text = null;
int length = text.Length; // NullReferenceException: Null reference

int number = int.Parse("abc"); // FormatException: Format error
```

## try-catch-finally Statement

### Basic Syntax

try-catch-finally is the core structure for exception handling in C#.

```csharp
try
{
    // Code that might throw an exception
    int result = 10 / 0;
}
catch (Exception ex)
{
    // Handle the exception
    Console.WriteLine($"An error occurred: {ex.Message}");
}
finally
{
    // Code that executes regardless of whether an exception occurred
    Console.WriteLine("Cleanup completed");
}
```

### try-catch Block

The catch block is used to capture and handle specific types of exceptions.

```csharp
try
{
    Console.Write("Please enter a number: ");
    string input = Console.ReadLine();
    int number = int.Parse(input);
    int result = 100 / number;
    Console.WriteLine($"Result: {result}");
}
catch (FormatException ex)
{
    Console.WriteLine($"Invalid input format: {ex.Message}");
}
catch (DivideByZeroException ex)
{
    Console.WriteLine($"Cannot divide by zero: {ex.Message}");
}
catch (Exception ex)
{
    // Catch all other exceptions
    Console.WriteLine($"An unknown error occurred: {ex.Message}");
}
```

### Order of Multiple catch Blocks

The order of catch blocks matters: more specific exception types must come before more general ones.

```csharp
try
{
    // Code that might throw an exception
}
catch (ArgumentNullException ex)
{
    // Most specific exception type
    Console.WriteLine("Argument is null");
}
catch (ArgumentException ex)
{
    // Base class of ArgumentNullException
    Console.WriteLine("Invalid argument");
}
catch (SystemException ex)
{
    // More general system exception
    Console.WriteLine("System error");
}
catch (Exception ex)
{
    // Most general exception base class
    Console.WriteLine("Unknown error");
}
```

### finally Block

Code in the finally block executes regardless of whether an exception occurred, typically used for releasing resources.

```csharp
FileStream file = null;

try
{
    file = new FileStream("data.txt", FileMode.Open);
    // Read file contents
    byte[] buffer = new byte[1024];
    int bytesRead = file.Read(buffer, 0, buffer.Length);
    Console.WriteLine($"Read {bytesRead} bytes");
}
catch (FileNotFoundException ex)
{
    Console.WriteLine($"File not found: {ex.FileName}");
}
catch (IOException ex)
{
    Console.WriteLine($"IO error: {ex.Message}");
}
finally
{
    // Ensure the file is closed
    if (file != null)
    {
        file.Close();
        Console.WriteLine("File closed");
    }
}
```

### try-finally (Without catch)

You can use try-finally without catch, allowing exceptions to continue propagating upward.

```csharp
public void ProcessFile(string path)
{
    FileStream file = null;
    try
    {
        file = new FileStream(path, FileMode.Open);
        // Process file...
    }
    finally
    {
        // Cleanup executes even if an exception occurs
        file?.Close();
    }
    // Exception continues to propagate upward
}
```

## Common Exception Types

### System Exception Hierarchy

```csharp
// Exception (base class for all exceptions)
//   ├── SystemException (base class for system exceptions)
//   │     ├── ArgumentException (argument exception)
//   │     │     ├── ArgumentNullException (argument is null)
//   │     │     └── ArgumentOutOfRangeException (argument out of range)
//   │     ├── ArithmeticException (arithmetic exception)
//   │     │     ├── DivideByZeroException (division by zero)
//   │     │     └── OverflowException (overflow)
//   │     ├── FormatException (format exception)
//   │     ├── IndexOutOfRangeException (index out of range)
//   │     ├── InvalidCastException (invalid type cast)
//   │     ├── InvalidOperationException (invalid operation)
//   │     ├── NullReferenceException (null reference)
//   │     ├── NotImplementedException (not implemented)
//   │     ├── NotSupportedException (not supported)
//   │     ├── OutOfMemoryException (out of memory)
//   │     ├── StackOverflowException (stack overflow)
//   │     └── IO.IOException (IO exception)
//   │           ├── FileNotFoundException (file not found)
//   │           └── DirectoryNotFoundException (directory not found)
//   └── ApplicationException (application exception base class, no longer recommended)
```

### Common Exception Examples

```csharp
// ArgumentNullException: Argument is null
public void ProcessData(string data)
{
    if (data == null)
        throw new ArgumentNullException(nameof(data), "Data cannot be null");
}

// ArgumentOutOfRangeException: Argument out of range
public void SetAge(int age)
{
    if (age < 0 || age > 150)
        throw new ArgumentOutOfRangeException(nameof(age), age, "Age must be between 0 and 150");
}

// InvalidOperationException: Invalid operation
public class Counter
{
    private int _count = 0;
    private bool _started = false;

    public void Increment()
    {
        if (!_started)
            throw new InvalidOperationException("Counter has not been started");
        _count++;
    }
}

// NotImplementedException: Not implemented
public class BaseProcessor
{
    public virtual void Process()
    {
        throw new NotImplementedException("Subclass must implement this method");
    }
}

// NotSupportedException: Not supported
public class ReadOnlyCollection
{
    public void Add(object item)
    {
        throw new NotSupportedException("Read-only collection does not support add operations");
    }
}
```

## Throwing Exceptions

### throw Statement

Use the throw statement to throw exceptions.

```csharp
public class BankAccount
{
    private decimal _balance;

    public BankAccount(decimal initialBalance)
    {
        if (initialBalance < 0)
            throw new ArgumentException("Initial balance cannot be negative", nameof(initialBalance));

        _balance = initialBalance;
    }

    public void Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Withdrawal amount must be greater than zero");

        if (amount > _balance)
            throw new InvalidOperationException($"Insufficient balance. Current balance: {_balance}, Withdrawal amount: {amount}");

        _balance -= amount;
    }

    public decimal Balance => _balance;
}

// Usage example
try
{
    var account = new BankAccount(1000);
    account.Withdraw(1500); // Throws InvalidOperationException
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"Operation failed: {ex.Message}");
}
```

### throw vs throw ex

When rethrowing exceptions, there is an important difference between `throw` and `throw ex`.

```csharp
public void MethodA()
{
    try
    {
        MethodB();
    }
    catch (Exception ex)
    {
        // Log the error
        Console.WriteLine($"Exception caught: {ex.Message}");

        // Method 1: Using throw (recommended)
        // Preserves the original stack trace
        throw;

        // Method 2: Using throw ex (not recommended)
        // Loses the original stack trace, resets stack from current location
        // throw ex;
    }
}

public void MethodB()
{
    throw new InvalidOperationException("Original exception");
}
```

### Conditional Throwing

```csharp
public void ValidateUser(User user)
{
    // Using null condition check
    ArgumentNullException.ThrowIfNull(user); // .NET 6+

    // Or traditional approach
    if (user == null)
        throw new ArgumentNullException(nameof(user));

    // Throwing with conditional expression
    _ = user.Name ?? throw new ArgumentException("Username cannot be null", nameof(user));

    // Validate age
    if (user.Age is < 0 or > 150)
        throw new ArgumentOutOfRangeException(nameof(user), "User age is invalid");
}
```

## Exception Filters

C# 6.0 introduced exception filters (when clause), allowing additional conditions to be added to catch blocks.

### Basic Syntax

```csharp
try
{
    // Code that might throw an exception
    ProcessRequest();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    Console.WriteLine("Resource not found");
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
{
    Console.WriteLine("Unauthorized access");
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.InternalServerError)
{
    Console.WriteLine("Internal server error");
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"HTTP request error: {ex.Message}");
}
```

### Using Methods as Filter Conditions

```csharp
public class ExceptionHandler
{
    private static bool ShouldHandle(Exception ex)
    {
        // Can log here, but should not have side effects
        Console.WriteLine($"Checking exception: {ex.Message}");
        return ex.Message.Contains("recoverable");
    }

    public void ProcessData()
    {
        try
        {
            // Process data
        }
        catch (Exception ex) when (ShouldHandle(ex))
        {
            // Only handle exceptions where ShouldHandle returns true
            Console.WriteLine("Handling recoverable exception");
        }
    }
}
```

### Logging Without Catching

A clever use of exception filters is to log without actually catching the exception.

```csharp
public void ProcessWithLogging()
{
    try
    {
        DoSomething();
    }
    catch (Exception ex) when (LogException(ex))
    {
        // This catch block never executes
        // because LogException returns false
    }
}

private bool LogException(Exception ex)
{
    // Log the exception
    Console.WriteLine($"[{DateTime.Now}] Exception: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");

    // Return false to let the exception continue propagating
    return false;
}
```

### Combining Conditions

```csharp
try
{
    ProcessFile(filePath);
}
catch (IOException ex) when (ex.HResult == -2147024864) // File in use
{
    Console.WriteLine("File is being used by another process");
}
catch (IOException ex) when (IsTemporaryError(ex) && _retryCount < 3)
{
    Console.WriteLine("Temporary error, retrying...");
    _retryCount++;
    ProcessFile(filePath);
}
catch (IOException ex)
{
    Console.WriteLine($"IO error: {ex.Message}");
}

private bool IsTemporaryError(IOException ex)
{
    // Check if it's a temporary error
    return ex.HResult == -2147024784; // Insufficient disk space, etc.
}
```

## Custom Exceptions

### Creating Custom Exception Classes

```csharp
// Basic custom exception
public class BusinessException : Exception
{
    public BusinessException() : base()
    {
    }

    public BusinessException(string message) : base(message)
    {
    }

    public BusinessException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

// Custom exception with additional properties
public class ValidationException : Exception
{
    public string PropertyName { get; }
    public object AttemptedValue { get; }

    public ValidationException(string propertyName, object attemptedValue, string message)
        : base(message)
    {
        PropertyName = propertyName;
        AttemptedValue = attemptedValue;
    }

    public ValidationException(string propertyName, object attemptedValue, string message,
        Exception innerException)
        : base(message, innerException)
    {
        PropertyName = propertyName;
        AttemptedValue = attemptedValue;
    }
}
```

### Exception with Error Codes

```csharp
public enum ErrorCode
{
    Unknown = 0,
    InvalidInput = 1001,
    NotFound = 1002,
    Unauthorized = 1003,
    InsufficientFunds = 2001,
    AccountLocked = 2002,
    TransactionFailed = 2003
}

public class AppException : Exception
{
    public ErrorCode ErrorCode { get; }
    public DateTime Timestamp { get; }
    public string CorrelationId { get; }

    public AppException(ErrorCode errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
        Timestamp = DateTime.UtcNow;
        CorrelationId = Guid.NewGuid().ToString();
    }

    public AppException(ErrorCode errorCode, string message, Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
        Timestamp = DateTime.UtcNow;
        CorrelationId = Guid.NewGuid().ToString();
    }

    public override string ToString()
    {
        return $"[{ErrorCode}] {Message} (CorrelationId: {CorrelationId}, Time: {Timestamp})";
    }
}

// Usage example
public class PaymentService
{
    public void ProcessPayment(decimal amount, string accountId)
    {
        if (amount <= 0)
            throw new AppException(ErrorCode.InvalidInput, "Payment amount must be greater than zero");

        var account = GetAccount(accountId);
        if (account == null)
            throw new AppException(ErrorCode.NotFound, $"Account {accountId} does not exist");

        if (account.IsLocked)
            throw new AppException(ErrorCode.AccountLocked, "Account is locked");

        if (account.Balance < amount)
            throw new AppException(ErrorCode.InsufficientFunds,
                $"Insufficient balance. Current balance: {account.Balance}, Payment amount: {amount}");
    }
}
```

### Domain-Specific Exceptions

```csharp
// Order-related exceptions
public class OrderException : Exception
{
    public string OrderId { get; }

    public OrderException(string orderId, string message) : base(message)
    {
        OrderId = orderId;
    }

    public OrderException(string orderId, string message, Exception innerException)
        : base(message, innerException)
    {
        OrderId = orderId;
    }
}

public class OrderNotFoundException : OrderException
{
    public OrderNotFoundException(string orderId)
        : base(orderId, $"Order {orderId} does not exist")
    {
    }
}

public class OrderAlreadyExistsException : OrderException
{
    public OrderAlreadyExistsException(string orderId)
        : base(orderId, $"Order {orderId} already exists")
    {
    }
}

public class OrderCancelledException : OrderException
{
    public DateTime CancelledAt { get; }
    public string Reason { get; }

    public OrderCancelledException(string orderId, DateTime cancelledAt, string reason)
        : base(orderId, $"Order {orderId} was cancelled at {cancelledAt}, reason: {reason}")
    {
        CancelledAt = cancelledAt;
        Reason = reason;
    }
}
```

## Exception Properties

### Common Properties

```csharp
try
{
    throw new InvalidOperationException("An error occurred");
}
catch (Exception ex)
{
    // Message: Exception description
    Console.WriteLine($"Message: {ex.Message}");

    // StackTrace: Stack trace
    Console.WriteLine($"Stack trace: {ex.StackTrace}");

    // Source: Name of the application or object that caused the exception
    Console.WriteLine($"Source: {ex.Source}");

    // TargetSite: Method that threw the exception
    Console.WriteLine($"Target method: {ex.TargetSite}");

    // HResult: HRESULT error code
    Console.WriteLine($"HResult: {ex.HResult}");

    // InnerException: Inner exception
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
    }

    // Data: Additional data dictionary
    foreach (var key in ex.Data.Keys)
    {
        Console.WriteLine($"Data [{key}]: {ex.Data[key]}");
    }
}
```

### Using the Data Property

```csharp
public void ProcessOrder(string orderId, string customerId)
{
    try
    {
        // Process order...
        throw new InvalidOperationException("Order processing failed");
    }
    catch (Exception ex)
    {
        // Add context information
        ex.Data["OrderId"] = orderId;
        ex.Data["CustomerId"] = customerId;
        ex.Data["Timestamp"] = DateTime.UtcNow;
        ex.Data["ServerName"] = Environment.MachineName;

        // Rethrow with additional information
        throw;
    }
}

// Reading the Data property
catch (Exception ex)
{
    Console.WriteLine($"Error processing order: {ex.Message}");

    if (ex.Data.Contains("OrderId"))
    {
        Console.WriteLine($"Order ID: {ex.Data["OrderId"]}");
    }

    if (ex.Data.Contains("CustomerId"))
    {
        Console.WriteLine($"Customer ID: {ex.Data["CustomerId"]}");
    }
}
```

### Inner Exception Chain

```csharp
public class DataService
{
    public void LoadData()
    {
        try
        {
            ReadFromDatabase();
        }
        catch (SqlException ex)
        {
            // Wrap exception, preserving original as InnerException
            throw new DataAccessException("Failed to read data from database", ex);
        }
    }

    public void ProcessData()
    {
        try
        {
            LoadData();
        }
        catch (DataAccessException ex)
        {
            throw new BusinessException("Data processing failed", ex);
        }
    }
}

// Traverse the exception chain
public static void PrintExceptionChain(Exception ex, int level = 0)
{
    string indent = new string(' ', level * 2);
    Console.WriteLine($"{indent}Exception type: {ex.GetType().Name}");
    Console.WriteLine($"{indent}Message: {ex.Message}");

    if (ex.InnerException != null)
    {
        Console.WriteLine($"{indent}--- Inner Exception ---");
        PrintExceptionChain(ex.InnerException, level + 1);
    }
}
```

## using Statement and Resource Cleanup

### Traditional using Statement

```csharp
// Automatically calls Dispose method to release resources
using (var file = new FileStream("data.txt", FileMode.Open))
{
    // Use the file
    byte[] buffer = new byte[1024];
    file.Read(buffer, 0, buffer.Length);
} // file.Dispose() is automatically called here

// Multiple resources
using (var reader = new StreamReader("input.txt"))
using (var writer = new StreamWriter("output.txt"))
{
    string line;
    while ((line = reader.ReadLine()) != null)
    {
        writer.WriteLine(line.ToUpper());
    }
}
```

### using Declaration (C# 8.0+)

```csharp
public void ProcessFile(string path)
{
    using var file = new FileStream(path, FileMode.Open);
    using var reader = new StreamReader(file);

    string content = reader.ReadToEnd();
    Console.WriteLine(content);

    // file and reader are automatically released when the method ends
}
```

### IDisposable Interface

```csharp
public class DatabaseConnection : IDisposable
{
    private bool _disposed = false;
    private SqlConnection _connection;

    public DatabaseConnection(string connectionString)
    {
        _connection = new SqlConnection(connectionString);
        _connection.Open();
        Console.WriteLine("Database connection opened");
    }

    public void ExecuteQuery(string sql)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(DatabaseConnection));

        // Execute query...
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // Release managed resources
                _connection?.Close();
                _connection?.Dispose();
                Console.WriteLine("Database connection closed");
            }

            // Release unmanaged resources

            _disposed = true;
        }
    }

    ~DatabaseConnection()
    {
        Dispose(false);
    }
}

// Usage example
using (var db = new DatabaseConnection("connection string"))
{
    db.ExecuteQuery("SELECT * FROM Users");
} // Dispose is automatically called
```

### IAsyncDisposable Interface

```csharp
public class AsyncResource : IAsyncDisposable
{
    private bool _disposed = false;

    public async ValueTask DisposeAsync()
    {
        if (!_disposed)
        {
            // Asynchronously cleanup resources
            await CleanupAsync();
            _disposed = true;
        }
    }

    private async Task CleanupAsync()
    {
        await Task.Delay(100); // Simulate async cleanup
        Console.WriteLine("Async resource released");
    }
}

// Usage example
public async Task ProcessAsync()
{
    await using var resource = new AsyncResource();
    // Use resource...
} // DisposeAsync is automatically called
```

## Async Exception Handling

### Exceptions in async/await

```csharp
public async Task<string> FetchDataAsync(string url)
{
    try
    {
        using var client = new HttpClient();
        var response = await client.GetStringAsync(url);
        return response;
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"HTTP request failed: {ex.Message}");
        throw;
    }
    catch (TaskCanceledException ex)
    {
        Console.WriteLine("Request timed out or was cancelled");
        throw;
    }
}

// Calling async method
public async Task MainAsync()
{
    try
    {
        string data = await FetchDataAsync("https://api.example.com/data");
        Console.WriteLine(data);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to fetch data: {ex.Message}");
    }
}
```

### Handling Exceptions from Multiple Async Tasks

```csharp
// Exception handling with Task.WhenAll
public async Task ProcessMultipleAsync()
{
    var task1 = FetchDataAsync("https://api1.example.com");
    var task2 = FetchDataAsync("https://api2.example.com");
    var task3 = FetchDataAsync("https://api3.example.com");

    try
    {
        string[] results = await Task.WhenAll(task1, task2, task3);
        foreach (var result in results)
        {
            Console.WriteLine(result);
        }
    }
    catch (Exception ex)
    {
        // Only catches the first exception
        Console.WriteLine($"An error occurred: {ex.Message}");

        // Check all task exceptions
        var tasks = new[] { task1, task2, task3 };
        foreach (var task in tasks)
        {
            if (task.IsFaulted)
            {
                Console.WriteLine($"Task failed: {task.Exception?.InnerException?.Message}");
            }
        }
    }
}

// Using AggregateException to get all exceptions
public async Task ProcessAllExceptionsAsync()
{
    var tasks = new[]
    {
        Task.Run(() => throw new InvalidOperationException("Error 1")),
        Task.Run(() => throw new ArgumentException("Error 2")),
        Task.Run(() => throw new FormatException("Error 3"))
    };

    var allTasks = Task.WhenAll(tasks);

    try
    {
        await allTasks;
    }
    catch
    {
        // Get all exceptions
        AggregateException aggregateException = allTasks.Exception;

        foreach (var ex in aggregateException.InnerExceptions)
        {
            Console.WriteLine($"Exception type: {ex.GetType().Name}, Message: {ex.Message}");
        }
    }
}
```

### Cancellation Token and Exceptions

```csharp
public async Task LongRunningOperationAsync(CancellationToken cancellationToken)
{
    try
    {
        for (int i = 0; i < 100; i++)
        {
            // Check for cancellation request
            cancellationToken.ThrowIfCancellationRequested();

            await Task.Delay(100, cancellationToken);
            Console.WriteLine($"Progress: {i + 1}%");
        }
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("Operation cancelled");
        throw;
    }
}

// Usage example
public async Task RunWithCancellationAsync()
{
    using var cts = new CancellationTokenSource();

    // Auto-cancel after 5 seconds
    cts.CancelAfter(TimeSpan.FromSeconds(5));

    try
    {
        await LongRunningOperationAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("Task was cancelled");
    }
}
```

## Global Exception Handling

### Console Application

```csharp
class Program
{
    static void Main(string[] args)
    {
        // Handle unhandled exceptions
        AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
        {
            var exception = e.ExceptionObject as Exception;
            Console.WriteLine($"Unhandled exception: {exception?.Message}");
            Console.WriteLine($"Stack trace: {exception?.StackTrace}");

            // Log to file
            File.AppendAllText("error.log",
                $"[{DateTime.Now}] {exception?.Message}\n{exception?.StackTrace}\n\n");
        };

        // Handle task exceptions
        TaskScheduler.UnobservedTaskException += (sender, e) =>
        {
            Console.WriteLine($"Unobserved task exception: {e.Exception.Message}");
            e.SetObserved(); // Mark as observed to prevent process termination
        };

        try
        {
            Run();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Program error: {ex.Message}");
        }
    }

    static void Run()
    {
        // Main application logic
    }
}
```

### ASP.NET Core Exception Handling

```csharp
// Exception handling middleware
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
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
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            await HandleExceptionAsync(context, ex, StatusCodes.Status400BadRequest);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found");
            await HandleExceptionAsync(context, ex, StatusCodes.Status404NotFound);
        }
        catch (UnauthorizedException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access");
            await HandleExceptionAsync(context, ex, StatusCodes.Status401Unauthorized);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(context, ex, StatusCodes.Status500InternalServerError);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex, int statusCode)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new
        {
            StatusCode = statusCode,
            Message = ex.Message,
            Timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}

// Register middleware
// app.UseMiddleware<ExceptionHandlingMiddleware>();
```

## Exception Handling Best Practices

### Only Catch Exceptions You Can Handle

```csharp
// Bad practice: Catching all exceptions without handling them
try
{
    ProcessData();
}
catch (Exception)
{
    // Swallowing the exception, hiding the problem
}

// Good practice: Catch specific exceptions and handle appropriately
try
{
    ProcessData();
}
catch (FileNotFoundException ex)
{
    // Can handle: Use default data
    Console.WriteLine($"Configuration file not found, using defaults: {ex.FileName}");
    LoadDefaultConfiguration();
}
catch (FormatException ex)
{
    // Can handle: Log and return error
    _logger.LogWarning(ex, "Data format error");
    throw new ValidationException("Input data format is invalid", ex);
}
// Let other exceptions continue to propagate
```

### Use Specific Exception Types

```csharp
// Bad practice: Using generic Exception
public void ValidateInput(string input)
{
    if (string.IsNullOrEmpty(input))
        throw new Exception("Input cannot be empty"); // Too generic
}

// Good practice: Use specific exception types
public void ValidateInput(string input)
{
    if (input == null)
        throw new ArgumentNullException(nameof(input));

    if (input.Length == 0)
        throw new ArgumentException("Input cannot be an empty string", nameof(input));

    if (input.Length > 100)
        throw new ArgumentOutOfRangeException(nameof(input), input.Length,
            "Input length cannot exceed 100 characters");
}
```

### Preserve Exception Information

```csharp
// Bad practice: Losing original exception information
try
{
    ProcessData();
}
catch (Exception ex)
{
    throw new CustomException("Processing failed"); // Lost the original exception
}

// Good practice: Preserve original exception as InnerException
try
{
    ProcessData();
}
catch (Exception ex)
{
    throw new CustomException("Processing failed", ex); // Preserves the complete exception chain
}
```

### Don't Use Exceptions for Flow Control

```csharp
// Bad practice: Using exceptions for flow control
public bool TryParseInt(string input)
{
    try
    {
        int.Parse(input);
        return true;
    }
    catch
    {
        return false;
    }
}

// Good practice: Use dedicated methods
public bool TryParseInt(string input, out int result)
{
    return int.TryParse(input, out result);
}

// Bad practice: Using exceptions to check collection elements
public object GetValue(Dictionary<string, object> dict, string key)
{
    try
    {
        return dict[key];
    }
    catch (KeyNotFoundException)
    {
        return null;
    }
}

// Good practice: Use TryGetValue
public object GetValue(Dictionary<string, object> dict, string key)
{
    return dict.TryGetValue(key, out var value) ? value : null;
}
```

### Provide Meaningful Exception Messages

```csharp
// Bad practice: Vague error message
throw new InvalidOperationException("Error");

// Good practice: Provide detailed, useful information
throw new InvalidOperationException(
    $"Cannot process order {orderId}: Order status is {currentStatus}, " +
    $"but only orders with status {expectedStatus} can be processed");
```

### Log Exception Information

```csharp
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger)
    {
        _logger = logger;
    }

    public async Task<Order> ProcessOrderAsync(string orderId)
    {
        try
        {
            _logger.LogInformation("Starting to process order {OrderId}", orderId);

            var order = await GetOrderAsync(orderId);
            await ValidateOrderAsync(order);
            await ProcessPaymentAsync(order);

            _logger.LogInformation("Order {OrderId} processed successfully", orderId);
            return order;
        }
        catch (OrderNotFoundException ex)
        {
            _logger.LogWarning(ex, "Order {OrderId} not found", orderId);
            throw;
        }
        catch (PaymentException ex)
        {
            _logger.LogError(ex, "Order {OrderId} payment failed: {ErrorCode}",
                orderId, ex.ErrorCode);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unknown error occurred while processing order {OrderId}", orderId);
            throw;
        }
    }
}
```

### Resource Cleanup

```csharp
// Always use using or try-finally to ensure resource release
public async Task ProcessFileAsync(string path)
{
    await using var stream = new FileStream(path, FileMode.Open);
    await using var reader = new StreamReader(stream);

    // Resources are properly released even if an exception occurs
    string content = await reader.ReadToEndAsync();
    ProcessContent(content);
}
```

### Avoid Throwing Exceptions in finally

```csharp
// Bad practice: Exception in finally overwrites original exception
try
{
    DoSomething();
}
finally
{
    throw new Exception("Cleanup failed"); // Will overwrite DoSomething's exception
}

// Good practice: Catch exceptions in finally
try
{
    DoSomething();
}
finally
{
    try
    {
        Cleanup();
    }
    catch (Exception ex)
    {
        // Log but don't rethrow
        _logger.LogWarning(ex, "Error occurred during resource cleanup");
    }
}
```

## Practical Examples

### Example 1: File Processing Service

```csharp
public class FileProcessingService
{
    private readonly ILogger<FileProcessingService> _logger;

    public FileProcessingService(ILogger<FileProcessingService> logger)
    {
        _logger = logger;
    }

    public async Task<ProcessingResult> ProcessFileAsync(string filePath)
    {
        ArgumentException.ThrowIfNullOrEmpty(filePath);

        _logger.LogInformation("Starting to process file: {FilePath}", filePath);

        try
        {
            // Check if file exists
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("The specified file does not exist", filePath);
            }

            // Read file content
            string content;
            try
            {
                content = await File.ReadAllTextAsync(filePath);
            }
            catch (IOException ex)
            {
                throw new FileProcessingException(
                    $"IO error occurred while reading file {filePath}", ex);
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new FileProcessingException(
                    $"No permission to access file {filePath}", ex);
            }

            // Validate content
            if (string.IsNullOrWhiteSpace(content))
            {
                throw new ValidationException("filePath", filePath, "File content is empty");
            }

            // Process content
            var result = await ProcessContentAsync(content);

            _logger.LogInformation("File processed successfully: {FilePath}", filePath);
            return result;
        }
        catch (FileProcessingException)
        {
            throw; // Already the correct exception type, rethrow directly
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unknown error occurred while processing file: {FilePath}", filePath);
            throw new FileProcessingException($"Failed to process file {filePath}", ex);
        }
    }

    private async Task<ProcessingResult> ProcessContentAsync(string content)
    {
        // Processing logic...
        await Task.Delay(100); // Simulate processing
        return new ProcessingResult { Success = true, ProcessedLines = content.Split('\n').Length };
    }
}

public class FileProcessingException : Exception
{
    public FileProcessingException(string message) : base(message) { }
    public FileProcessingException(string message, Exception innerException)
        : base(message, innerException) { }
}

public class ProcessingResult
{
    public bool Success { get; set; }
    public int ProcessedLines { get; set; }
}
```

### Example 2: HTTP Client with Retry Mechanism

```csharp
public class ResilientHttpClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ResilientHttpClient> _logger;
    private readonly int _maxRetries = 3;
    private readonly TimeSpan _initialDelay = TimeSpan.FromSeconds(1);

    public ResilientHttpClient(HttpClient httpClient, ILogger<ResilientHttpClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<T> GetAsync<T>(string url, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(url);

        Exception lastException = null;
        var delay = _initialDelay;

        for (int attempt = 1; attempt <= _maxRetries; attempt++)
        {
            try
            {
                _logger.LogDebug("Attempting request to {Url}, attempt {Attempt}", url, attempt);

                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                return JsonSerializer.Deserialize<T>(content);
            }
            catch (HttpRequestException ex) when (IsTransientError(ex))
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "Request to {Url} failed (attempt {Attempt}), will retry in {Delay}",
                    url, attempt, delay);

                if (attempt < _maxRetries)
                {
                    await Task.Delay(delay, cancellationToken);
                    delay *= 2; // Exponential backoff
                }
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                // Timeout
                lastException = ex;
                _logger.LogWarning("Request to {Url} timed out (attempt {Attempt})", url, attempt);

                if (attempt < _maxRetries)
                {
                    await Task.Delay(delay, cancellationToken);
                    delay *= 2;
                }
            }
            catch (JsonException ex)
            {
                // JSON parsing error should not retry
                _logger.LogError(ex, "Failed to parse response JSON: {Url}", url);
                throw new ApiException($"Unable to parse response from {url}", ex);
            }
        }

        // All retries failed
        _logger.LogError(lastException, "Request to {Url} still failed after {MaxRetries} retries",
            url, _maxRetries);
        throw new ApiException($"Request to {url} failed after {_maxRetries} retries", lastException);
    }

    private bool IsTransientError(HttpRequestException ex)
    {
        // Determine if it's a transient error (can retry)
        if (ex.StatusCode == null) return true; // Network error

        return ex.StatusCode switch
        {
            HttpStatusCode.RequestTimeout => true,
            HttpStatusCode.TooManyRequests => true,
            HttpStatusCode.InternalServerError => true,
            HttpStatusCode.BadGateway => true,
            HttpStatusCode.ServiceUnavailable => true,
            HttpStatusCode.GatewayTimeout => true,
            _ => false
        };
    }
}

public class ApiException : Exception
{
    public ApiException(string message) : base(message) { }
    public ApiException(string message, Exception innerException)
        : base(message, innerException) { }
}
```

### Example 3: Validator and Result Pattern

```csharp
// Result pattern: An alternative error handling approach to exceptions
public class Result<T>
{
    public bool IsSuccess { get; }
    public T Value { get; }
    public string Error { get; }
    public Exception Exception { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
    }

    private Result(string error, Exception exception = null)
    {
        IsSuccess = false;
        Error = error;
        Exception = exception;
    }

    public static Result<T> Success(T value) => new Result<T>(value);
    public static Result<T> Failure(string error) => new Result<T>(error);
    public static Result<T> Failure(string error, Exception ex) => new Result<T>(error, ex);

    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<string, TResult> onFailure)
    {
        return IsSuccess ? onSuccess(Value) : onFailure(Error);
    }
}

// Service using Result pattern
public class UserService
{
    public async Task<Result<User>> CreateUserAsync(CreateUserRequest request)
    {
        // Validation
        var validationResult = ValidateRequest(request);
        if (!validationResult.IsSuccess)
        {
            return Result<User>.Failure(validationResult.Error);
        }

        try
        {
            // Check if user already exists
            if (await UserExistsAsync(request.Email))
            {
                return Result<User>.Failure($"Email {request.Email} is already registered");
            }

            // Create user
            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                Email = request.Email,
                CreatedAt = DateTime.UtcNow
            };

            await SaveUserAsync(user);
            return Result<User>.Success(user);
        }
        catch (Exception ex)
        {
            return Result<User>.Failure("An error occurred while creating user", ex);
        }
    }

    private Result<bool> ValidateRequest(CreateUserRequest request)
    {
        if (request == null)
            return Result<bool>.Failure("Request cannot be null");

        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<bool>.Failure("Username cannot be empty");

        if (string.IsNullOrWhiteSpace(request.Email))
            return Result<bool>.Failure("Email cannot be empty");

        if (!IsValidEmail(request.Email))
            return Result<bool>.Failure("Email format is invalid");

        return Result<bool>.Success(true);
    }

    private bool IsValidEmail(string email)
    {
        return email.Contains("@") && email.Contains(".");
    }

    private Task<bool> UserExistsAsync(string email) => Task.FromResult(false);
    private Task SaveUserAsync(User user) => Task.CompletedTask;
}

// Usage example
public async Task HandleCreateUserAsync()
{
    var service = new UserService();
    var request = new CreateUserRequest { Name = "John Doe", Email = "john@example.com" };

    var result = await service.CreateUserAsync(request);

    result.Match(
        onSuccess: user =>
        {
            Console.WriteLine($"User created successfully: {user.Name} ({user.Email})");
            return true;
        },
        onFailure: error =>
        {
            Console.WriteLine($"Failed to create user: {error}");
            return false;
        }
    );
}

public class CreateUserRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
}

public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

## Summary

This article covered all aspects of C# exception handling:

1. **try-catch-finally**: The basic exception handling structure, including multiple catch blocks, exception ordering, and finally blocks
2. **Exception types**: System exception hierarchy and common exception types with their use cases
3. **Throwing exceptions**: Using the throw statement, differences between throw and throw ex
4. **Exception filters**: Conditional exception catching using the when clause
5. **Custom exceptions**: Creating domain-specific exception classes with error codes and additional properties
6. **Resource cleanup**: using statement, IDisposable and IAsyncDisposable interfaces
7. **Async exception handling**: Exception handling in async/await, Task.WhenAll, and cancellation tokens
8. **Global exception handling**: Global exception handling strategies for console applications and ASP.NET Core
9. **Best practices**: Guidelines for writing robust, maintainable exception handling code

Mastering exception handling is key to writing reliable, robust applications. Proper use of exception handling mechanisms makes programs more stable, error messages clearer, and debugging more efficient.

## Next Steps

- Logging frameworks (Serilog, NLog)
- Error handling in distributed systems
- Circuit breaker pattern (Polly)
- Exception testing in unit tests
- Performance analysis and exception overhead
