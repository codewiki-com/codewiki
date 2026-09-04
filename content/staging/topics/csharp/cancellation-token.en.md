---
title: C# CancellationToken 深度解析
description: 全面掌握 C# 取消令牌机制：CancellationTokenSource、协作式取消、链接令牌与超时控制
track: csharp
section: async
difficulty: intermediate
tags:
  - C#
  - CancellationToken
  - async
  - 取消操作
  - 超时控制
status: imported
origin: old/src/content/docs/csharp/cancellation-token.en.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 异步编程
  order: 3
  lastUpdated: 2026-01-07
---

In modern asynchronous programming, gracefully canceling long-running operations is a critical capability. C# provides the `CancellationToken` mechanism, enabling developers to cancel asynchronous operations in a cooperative manner, avoiding resource waste and improving user experience.

## Concept Explanation

### What is CancellationToken

`CancellationToken` is the core type in .NET for implementing cooperative cancellation. It is a lightweight struct used to propagate cancellation signals between asynchronous operations.

**Cooperative cancellation** means:
- Cancellation is a request, not a forced termination
- The operation being canceled must actively check the cancellation status and respond accordingly
- Operations can choose how to respond to cancellation (stop immediately, cleanup then stop, ignore, etc.)

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                  CancellationToken System                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐     ┌──────────────────────┐      │
│  │ CancellationToken    │     │ CancellationToken    │      │
│  │ Source               │────>│                      │      │
│  │                      │     │ (passed to async ops)│      │
│  │ - Initiates cancel   │     │ - Check cancel status│      │
│  │ - Manages token      │     │ - Respond to cancel  │      │
│  │ - Sets timeout       │     │ - Register callbacks │      │
│  └──────────────────────┘     └──────────────────────┘      │
│                                                              │
│  Held by creator/caller        Held by async methods called  │
└─────────────────────────────────────────────────────────────┘
```

### Why Do We Need CancellationToken

1. **User Experience**: Allow users to cancel long-running operations
2. **Resource Management**: Release resources that are no longer needed in a timely manner
3. **Timeout Control**: Prevent operations from waiting indefinitely
4. **Application Lifecycle**: Gracefully terminate background tasks when the application shuts down
5. **Error Recovery**: Cancel related operations when errors occur

## Core Principles

### Internal Mechanism of CancellationTokenSource

`CancellationTokenSource` is the creator and manager of cancellation tokens. When the `Cancel()` method is called, it:

1. Sets the internal `_state` flag
2. Triggers all registered callbacks
3. Notifies all associated `CancellationToken` instances

```csharp
// Simplified internal structure of CancellationTokenSource
public class CancellationTokenSource : IDisposable
{
    // Cancellation state flag
    private volatile int _state;

    // Linked list of registered callbacks
    private CallbackNode _callbacks;

    // Associated CancellationToken
    public CancellationToken Token { get; }

    // Request cancellation
    public void Cancel()
    {
        // 1. Set cancellation state
        // 2. Execute all callbacks
        // 3. Release waiting threads
    }
}
```

### How CancellationToken Works

`CancellationToken` is a read-only struct that:

1. Holds a reference to the `CancellationTokenSource`
2. Provides methods to check cancellation status
3. Supports registering cancellation callbacks

```csharp
// Simplified structure of CancellationToken
public readonly struct CancellationToken
{
    private readonly CancellationTokenSource _source;

    // Whether cancellation has been requested
    public bool IsCancellationRequested => _source?.IsCancellationRequested ?? false;

    // Check and throw exception
    public void ThrowIfCancellationRequested()
    {
        if (IsCancellationRequested)
            throw new OperationCanceledException(this);
    }

    // Register cancellation callback
    public CancellationTokenRegistration Register(Action callback);
}
```

### Cancellation Propagation Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cancellation Propagation Flow                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User clicks cancel                                              │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────┐                                         │
│  │ CancellationToken   │                                         │
│  │ Source.Cancel()     │                                         │
│  └─────────┬───────────┘                                         │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────────┐     ┌─────────────────────┐            │
│  │ Set _state = 1      │────>│ Trigger all         │            │
│  └─────────────────────┘     │ callbacks           │            │
│            │                 └─────────────────────┘            │
│            ▼                                                     │
│  ┌─────────────────────────────────────────────────┐            │
│  │          All operations holding the Token        │            │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │            │
│  │  │ Op A    │  │ Op B    │  │ Op C    │         │            │
│  │  │Check    │  │Check    │  │Check    │         │            │
│  │  │status   │  │status   │  │status   │         │            │
│  │  │Respond  │  │Respond  │  │Respond  │         │            │
│  │  └─────────┘  └─────────┘  └─────────┘         │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

### CancellationTokenSource Lifecycle

| State | Description | IsCancellationRequested |
|-------|-------------|------------------------|
| Initial | Just created, not cancelled | false |
| Cancelled | After Cancel() is called | true |
| Disposed | After Dispose() is called | Throws ObjectDisposedException |

### Ways to Respond to Cancellation

| Method | Approach | Behavior |
|--------|----------|----------|
| Polling | `IsCancellationRequested` | Returns bool, no exception |
| Throw Exception | `ThrowIfCancellationRequested()` | Throws `OperationCanceledException` |
| Callback Response | `Register()` | Executes callback when cancelled |

### Key Properties and Methods

```csharp
// Key members of CancellationTokenSource
public class CancellationTokenSource
{
    // Get the associated cancellation token
    public CancellationToken Token { get; }

    // Whether cancellation has been requested
    public bool IsCancellationRequested { get; }

    // Request cancellation
    public void Cancel();
    public void Cancel(bool throwOnFirstException);

    // Delayed cancellation
    public void CancelAfter(int millisecondsDelay);
    public void CancelAfter(TimeSpan delay);

    // Create linked token source
    public static CancellationTokenSource CreateLinkedTokenSource(
        CancellationToken token1,
        CancellationToken token2);

    // Release resources
    public void Dispose();
}
```

### Special Values of CancellationToken

```csharp
// A token that will never be cancelled
CancellationToken neverCancel = CancellationToken.None;

// Check if it can be cancelled
bool canBeCanceled = token.CanBeCanceled;
// CancellationToken.None.CanBeCanceled == false
```

## Code Examples

### Basic Usage: Creating and Using Cancellation Tokens

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

public class BasicCancellationExample
{
    public async Task DemonstrateBasicCancellationAsync()
    {
        // 1. Create cancellation token source
        using var cts = new CancellationTokenSource();

        // 2. Get cancellation token
        CancellationToken token = cts.Token;

        // 3. Start async operation
        Task longRunningTask = LongRunningOperationAsync(token);

        // 4. Simulate user cancelling after 2 seconds
        await Task.Delay(2000);
        Console.WriteLine("Requesting cancellation...");
        cts.Cancel();

        // 5. Wait for task to complete or be cancelled
        try
        {
            await longRunningTask;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation was cancelled");
        }
    }

    private async Task LongRunningOperationAsync(CancellationToken cancellationToken)
    {
        for (int i = 0; i < 10; i++)
        {
            // Check cancellation status
            cancellationToken.ThrowIfCancellationRequested();

            Console.WriteLine($"Executing step {i + 1}/10");
            await Task.Delay(500, cancellationToken);
        }

        Console.WriteLine("Operation completed");
    }
}
```

### ThrowIfCancellationRequested Explained

```csharp
public class ThrowIfCancellationRequestedExample
{
    // Method 1: Using ThrowIfCancellationRequested
    public async Task ProcessWithThrowAsync(CancellationToken cancellationToken)
    {
        foreach (var item in GetItems())
        {
            // Check for cancellation on each iteration
            cancellationToken.ThrowIfCancellationRequested();

            await ProcessItemAsync(item);
        }
    }

    // Method 2: Using IsCancellationRequested for graceful handling
    public async Task<ProcessResult> ProcessWithGracefulExitAsync(
        CancellationToken cancellationToken)
    {
        var processedItems = new List<string>();

        foreach (var item in GetItems())
        {
            // Check cancellation status, cleanup and return
            if (cancellationToken.IsCancellationRequested)
            {
                Console.WriteLine("Cancellation detected, performing cleanup...");
                await CleanupAsync();

                return new ProcessResult
                {
                    IsCompleted = false,
                    ProcessedItems = processedItems,
                    Message = "Operation cancelled by user"
                };
            }

            await ProcessItemAsync(item);
            processedItems.Add(item);
        }

        return new ProcessResult
        {
            IsCompleted = true,
            ProcessedItems = processedItems,
            Message = "Processing completed"
        };
    }

    // Method 3: Mixed approach - throw at critical points, graceful handling in loops
    public async Task ProcessMixedApproachAsync(CancellationToken cancellationToken)
    {
        // Check before starting
        cancellationToken.ThrowIfCancellationRequested();

        await InitializeAsync();

        foreach (var batch in GetBatches())
        {
            // Check between batches, allow graceful exit
            if (cancellationToken.IsCancellationRequested)
            {
                await SaveProgressAsync();
                cancellationToken.ThrowIfCancellationRequested();
            }

            await ProcessBatchAsync(batch, cancellationToken);
        }

        await FinalizeAsync();
    }

    private IEnumerable<string> GetItems() =>
        new[] { "item1", "item2", "item3" };

    private IEnumerable<string[]> GetBatches() =>
        new[] { new[] { "a", "b" }, new[] { "c", "d" } };

    private Task ProcessItemAsync(string item) => Task.Delay(100);
    private Task ProcessBatchAsync(string[] batch, CancellationToken ct) => Task.Delay(200);
    private Task CleanupAsync() => Task.Delay(50);
    private Task InitializeAsync() => Task.Delay(50);
    private Task SaveProgressAsync() => Task.Delay(50);
    private Task FinalizeAsync() => Task.Delay(50);
}

public class ProcessResult
{
    public bool IsCompleted { get; set; }
    public List<string> ProcessedItems { get; set; }
    public string Message { get; set; }
}
```

### Timeout Cancellation

```csharp
public class TimeoutCancellationExample
{
    // Method 1: Set timeout in constructor
    public async Task OperationWithTimeoutAsync()
    {
        // Create token source that auto-cancels after 5 seconds
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

        try
        {
            await LongRunningOperationAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation timed out");
        }
    }

    // Method 2: CancelAfter method
    public async Task OperationWithDynamicTimeoutAsync()
    {
        using var cts = new CancellationTokenSource();

        // Set timeout after starting operation
        var task = LongRunningOperationAsync(cts.Token);

        // Dynamically set timeout based on conditions
        cts.CancelAfter(TimeSpan.FromSeconds(10));

        try
        {
            await task;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation timed out");
        }
    }

    // Method 3: Implement timeout using Task.WhenAny
    public async Task<T> ExecuteWithTimeoutAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        TimeSpan timeout)
    {
        using var cts = new CancellationTokenSource();

        var operationTask = operation(cts.Token);
        var timeoutTask = Task.Delay(timeout, cts.Token);

        var completedTask = await Task.WhenAny(operationTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            cts.Cancel(); // Cancel the operation
            throw new TimeoutException($"Operation timed out after {timeout}");
        }

        return await operationTask;
    }

    // Usage example
    public async Task UseTimeoutHelperAsync()
    {
        try
        {
            var result = await ExecuteWithTimeoutAsync(
                async ct =>
                {
                    await Task.Delay(3000, ct); // Simulate 3-second operation
                    return "Success";
                },
                TimeSpan.FromSeconds(5));

            Console.WriteLine($"Result: {result}");
        }
        catch (TimeoutException ex)
        {
            Console.WriteLine(ex.Message);
        }
    }

    private async Task LongRunningOperationAsync(CancellationToken token)
    {
        for (int i = 0; i < 20; i++)
        {
            token.ThrowIfCancellationRequested();
            Console.WriteLine($"Step {i + 1}");
            await Task.Delay(500, token);
        }
    }
}
```

### Linked Tokens

```csharp
public class LinkedTokensExample
{
    // Scenario: User cancellation + timeout cancellation + application shutdown cancellation
    public async Task ProcessWithMultipleCancellationSourcesAsync(
        CancellationToken userCancellation,
        CancellationToken applicationShutdown)
    {
        // Create timeout cancellation source
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

        // Create linked token source, any cancellation will trigger
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            userCancellation,
            applicationShutdown,
            timeoutCts.Token);

        try
        {
            await PerformOperationAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            // Determine which source triggered the cancellation
            if (userCancellation.IsCancellationRequested)
            {
                Console.WriteLine("User cancelled the operation");
            }
            else if (applicationShutdown.IsCancellationRequested)
            {
                Console.WriteLine("Application is shutting down");
            }
            else if (timeoutCts.IsCancellationRequested)
            {
                Console.WriteLine("Operation timed out");
            }
        }
    }

    // Multi-level nested linked tokens
    public async Task NestedLinkedTokensAsync(CancellationToken parentToken)
    {
        // Level 1: Parent token + local timeout
        using var localTimeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var level1Cts = CancellationTokenSource.CreateLinkedTokenSource(
            parentToken,
            localTimeoutCts.Token);

        await Task.WhenAll(
            ProcessPartA(level1Cts.Token),
            ProcessPartB(level1Cts.Token)
        );
    }

    // Dynamically add cancellation conditions
    public async Task DynamicCancellationAsync(CancellationToken baseToken)
    {
        var additionalConditions = new List<CancellationTokenSource>();

        try
        {
            // Add resource-based cancellation condition
            var memoryCts = new CancellationTokenSource();
            additionalConditions.Add(memoryCts);

            // Monitor memory usage
            _ = MonitorMemoryAsync(memoryCts);

            // Create linked token containing all conditions
            var allTokens = additionalConditions
                .Select(cts => cts.Token)
                .Prepend(baseToken)
                .ToArray();

            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(allTokens);

            await PerformOperationAsync(combinedCts.Token);
        }
        finally
        {
            foreach (var cts in additionalConditions)
            {
                cts.Dispose();
            }
        }
    }

    private async Task MonitorMemoryAsync(CancellationTokenSource memoryCts)
    {
        while (!memoryCts.IsCancellationRequested)
        {
            var memoryInfo = GC.GetGCMemoryInfo();
            if (memoryInfo.MemoryLoadBytes > memoryInfo.HighMemoryLoadThresholdBytes * 0.9)
            {
                Console.WriteLine("Memory usage too high, cancelling operation");
                memoryCts.Cancel();
                break;
            }
            await Task.Delay(1000);
        }
    }

    private Task PerformOperationAsync(CancellationToken token) => Task.Delay(10000, token);
    private Task ProcessPartA(CancellationToken token) => Task.Delay(5000, token);
    private Task ProcessPartB(CancellationToken token) => Task.Delay(5000, token);
}
```

### Registering Cancellation Callbacks

```csharp
public class CancellationCallbackExample
{
    // Basic callback registration
    public async Task BasicCallbackAsync()
    {
        using var cts = new CancellationTokenSource();

        // Register callback
        using var registration = cts.Token.Register(() =>
        {
            Console.WriteLine("Cancellation callback executed");
        });

        // Register callback with state
        using var registrationWithState = cts.Token.Register(
            state => Console.WriteLine($"Callback with state: {state}"),
            "Custom state object");

        // Simulate operation
        var task = Task.Run(async () =>
        {
            await Task.Delay(5000, cts.Token);
        }, cts.Token);

        // Cancel after 2 seconds
        await Task.Delay(2000);
        cts.Cancel();

        try
        {
            await task;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Task was cancelled");
        }
    }

    // Using callbacks for resource cleanup
    public async Task CleanupOnCancellationAsync(CancellationToken cancellationToken)
    {
        var tempFile = Path.GetTempFileName();
        FileStream fileStream = null;

        // Register cleanup callback
        using var cleanup = cancellationToken.Register(() =>
        {
            Console.WriteLine("Performing cleanup...");

            fileStream?.Dispose();

            if (File.Exists(tempFile))
            {
                File.Delete(tempFile);
                Console.WriteLine($"Deleted temp file: {tempFile}");
            }
        });

        try
        {
            fileStream = new FileStream(tempFile, FileMode.Create);

            // Perform file operations
            for (int i = 0; i < 100; i++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var data = new byte[1024];
                await fileStream.WriteAsync(data, cancellationToken);
                await Task.Delay(100, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation cancelled, cleanup callback will execute");
            throw;
        }
        finally
        {
            fileStream?.Dispose();
        }
    }

    // Async callback pattern
    public async Task AsyncCallbackPatternAsync()
    {
        using var cts = new CancellationTokenSource();
        var tcs = new TaskCompletionSource<bool>();

        // Register async cleanup callback
        using var registration = cts.Token.Register(() =>
        {
            // Start async cleanup
            _ = Task.Run(async () =>
            {
                Console.WriteLine("Starting async cleanup...");
                await Task.Delay(500); // Simulate cleanup operation
                Console.WriteLine("Async cleanup completed");
                tcs.TrySetResult(true);
            });
        });

        // Simulate operation
        _ = Task.Run(async () =>
        {
            await Task.Delay(2000);
            cts.Cancel();
        });

        try
        {
            await Task.Delay(5000, cts.Token);
        }
        catch (OperationCanceledException)
        {
            // Wait for cleanup to complete
            await tcs.Task;
            Console.WriteLine("All cleanup completed");
        }
    }
}
```

### Working with HttpClient

```csharp
public class HttpClientCancellationExample
{
    private readonly HttpClient _httpClient = new HttpClient();

    // Basic HTTP request cancellation
    public async Task<string> FetchDataAsync(
        string url,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            Console.WriteLine("HTTP request was cancelled");
            throw;
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"HTTP request failed: {ex.Message}");
            throw;
        }
    }

    // HTTP request with timeout
    public async Task<string> FetchDataWithTimeoutAsync(
        string url,
        TimeSpan timeout,
        CancellationToken cancellationToken)
    {
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeoutCts.Token);

        try
        {
            return await FetchDataAsync(url, linkedCts.Token);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
        {
            throw new TimeoutException($"Request timed out after {timeout}");
        }
    }

    // Concurrent requests with cancellation
    public async Task<string[]> FetchMultipleAsync(
        string[] urls,
        CancellationToken cancellationToken)
    {
        var tasks = urls.Select(url => FetchDataAsync(url, cancellationToken));

        try
        {
            return await Task.WhenAll(tasks);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Batch request was cancelled");
            throw;
        }
    }

    // Using SendAsync for finer-grained control
    public async Task<HttpResponseMessage> SendWithCancellationAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        // HttpCompletionOption.ResponseHeadersRead allows returning immediately after receiving response headers
        // This enables faster response to cancellation when downloading large files
        return await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
    }

    // Download large file with cancellation support
    public async Task DownloadFileAsync(
        string url,
        string destinationPath,
        IProgress<double> progress,
        CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(
            url,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var totalBytes = response.Content.Headers.ContentLength ?? -1L;
        var downloadedBytes = 0L;

        await using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var fileStream = new FileStream(
            destinationPath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 8192,
            useAsync: true);

        var buffer = new byte[8192];
        int bytesRead;

        while ((bytesRead = await contentStream.ReadAsync(buffer, cancellationToken)) > 0)
        {
            await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);

            downloadedBytes += bytesRead;

            if (totalBytes > 0)
            {
                progress?.Report((double)downloadedBytes / totalBytes * 100);
            }
        }
    }
}
```

### Working with Database Operations

```csharp
public class DatabaseCancellationExample
{
    private readonly string _connectionString;

    public DatabaseCancellationExample(string connectionString)
    {
        _connectionString = connectionString;
    }

    // Basic database query cancellation
    public async Task<List<User>> GetUsersAsync(CancellationToken cancellationToken)
    {
        var users = new List<User>();

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new SqlCommand("SELECT Id, Name, Email FROM Users", connection);

        // CommandTimeout works independently from CancellationToken
        command.CommandTimeout = 30;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            users.Add(new User
            {
                Id = reader.GetInt32(0),
                Name = reader.GetString(1),
                Email = reader.GetString(2)
            });
        }

        return users;
    }

    // Bulk insert with cancellation
    public async Task BulkInsertAsync(
        IEnumerable<User> users,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            foreach (var user in users)
            {
                // Check cancellation before each insert
                cancellationToken.ThrowIfCancellationRequested();

                await using var command = new SqlCommand(
                    "INSERT INTO Users (Name, Email) VALUES (@Name, @Email)",
                    connection,
                    transaction);

                command.Parameters.AddWithValue("@Name", user.Name);
                command.Parameters.AddWithValue("@Email", user.Email);

                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            await transaction.RollbackAsync();
            Console.WriteLine("Bulk insert cancelled, transaction rolled back");
            throw;
        }
    }

    // Long-running report query
    public async Task<ReportData> GenerateReportAsync(
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken)
    {
        var report = new ReportData();

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        // Generate report in steps, check cancellation at each step
        report.Summary = await GetReportSummaryAsync(
            connection, startDate, endDate, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();

        report.Details = await GetReportDetailsAsync(
            connection, startDate, endDate, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();

        report.Charts = await GenerateChartsAsync(
            report.Summary, report.Details, cancellationToken);

        return report;
    }

    private Task<ReportSummary> GetReportSummaryAsync(
        SqlConnection connection,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken) => Task.FromResult(new ReportSummary());

    private Task<List<ReportDetail>> GetReportDetailsAsync(
        SqlConnection connection,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken) => Task.FromResult(new List<ReportDetail>());

    private Task<List<Chart>> GenerateChartsAsync(
        ReportSummary summary,
        List<ReportDetail> details,
        CancellationToken cancellationToken) => Task.FromResult(new List<Chart>());
}

// Helper class definitions
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

public class ReportData
{
    public ReportSummary Summary { get; set; }
    public List<ReportDetail> Details { get; set; }
    public List<Chart> Charts { get; set; }
}

public class ReportSummary { }
public class ReportDetail { }
public class Chart { }
```

### Channel and CancellationToken

```csharp
public class ChannelCancellationExample
{
    // Producer-Consumer pattern with cancellation
    public async Task ProducerConsumerWithCancellationAsync(
        CancellationToken cancellationToken)
    {
        var channel = Channel.CreateBounded<int>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait
        });

        // Start producer
        var producerTask = Task.Run(async () =>
        {
            try
            {
                for (int i = 0; i < 1000; i++)
                {
                    await channel.Writer.WriteAsync(i, cancellationToken);
                    Console.WriteLine($"Produced: {i}");
                    await Task.Delay(10, cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("Producer cancelled");
            }
            finally
            {
                channel.Writer.Complete();
            }
        }, cancellationToken);

        // Start multiple consumers
        var consumerTasks = Enumerable.Range(0, 3)
            .Select(consumerId => Task.Run(async () =>
            {
                try
                {
                    await foreach (var item in channel.Reader.ReadAllAsync(cancellationToken))
                    {
                        Console.WriteLine($"Consumer {consumerId} processing: {item}");
                        await Task.Delay(50, cancellationToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    Console.WriteLine($"Consumer {consumerId} cancelled");
                }
            }, cancellationToken))
            .ToArray();

        await Task.WhenAll(producerTask);
        await Task.WhenAll(consumerTasks);
    }

    // Read with timeout
    public async Task<T?> ReadWithTimeoutAsync<T>(
        ChannelReader<T> reader,
        TimeSpan timeout,
        CancellationToken cancellationToken)
    {
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeoutCts.Token);

        try
        {
            if (await reader.WaitToReadAsync(linkedCts.Token))
            {
                return await reader.ReadAsync(linkedCts.Token);
            }
            return default;
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
        {
            Console.WriteLine("Read timed out");
            return default;
        }
    }
}
```

## Best Practices

### Always Dispose CancellationTokenSource

```csharp
// Correct: Use using statement to ensure disposal
public async Task CorrectUsageAsync()
{
    using var cts = new CancellationTokenSource();
    await DoWorkAsync(cts.Token);
}

// Correct: Manually dispose in try-finally
public async Task ManualDisposeAsync()
{
    var cts = new CancellationTokenSource();
    try
    {
        await DoWorkAsync(cts.Token);
    }
    finally
    {
        cts.Dispose();
    }
}

// Wrong: Forgot to dispose
public async Task LeakyUsageAsync()
{
    var cts = new CancellationTokenSource(); // Memory leak!
    await DoWorkAsync(cts.Token);
}
```

### Pass CancellationToken to All Methods That Support It

```csharp
public async Task ComprehensiveCancellationAsync(CancellationToken cancellationToken)
{
    // Pass token to all async operations
    await Task.Delay(1000, cancellationToken);

    using var client = new HttpClient();
    var response = await client.GetAsync("https://api.example.com", cancellationToken);
    var content = await response.Content.ReadAsStringAsync(cancellationToken);

    await using var connection = new SqlConnection("...");
    await connection.OpenAsync(cancellationToken);

    // Stream operations
    await using var stream = new FileStream("file.txt", FileMode.Open);
    var buffer = new byte[1024];
    await stream.ReadAsync(buffer, cancellationToken);
}
```

### Check Cancellation Status at Appropriate Locations

```csharp
public async Task WellPlacedChecksAsync(
    IEnumerable<Item> items,
    CancellationToken cancellationToken)
{
    // Check before starting
    cancellationToken.ThrowIfCancellationRequested();

    await InitializeAsync();

    foreach (var item in items)
    {
        // Check at the beginning of loop (recommended location)
        cancellationToken.ThrowIfCancellationRequested();

        // Check before time-consuming operations
        if (item.RequiresHeavyProcessing)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await HeavyProcessingAsync(item, cancellationToken);
        }
        else
        {
            await LightProcessingAsync(item, cancellationToken);
        }
    }
}
```

### Handle OperationCanceledException Properly

```csharp
public async Task ProperExceptionHandlingAsync(CancellationToken cancellationToken)
{
    try
    {
        await DoWorkAsync(cancellationToken);
    }
    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
    {
        // User/application requested cancellation - usually expected
        Console.WriteLine("Operation was cancelled");
        // May need to log, but usually not an error
    }
    catch (OperationCanceledException)
    {
        // Cancellation for other reasons (e.g., timeout)
        Console.WriteLine("Operation cancelled for other reasons");
        throw; // May need to rethrow
    }
    catch (Exception ex)
    {
        // Actual error
        Console.WriteLine($"Operation failed: {ex.Message}");
        throw;
    }
}

// Distinguish between timeout and user cancellation
public async Task DistinguishCancellationAsync(
    CancellationToken userCancellation)
{
    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        userCancellation, timeoutCts.Token);

    try
    {
        await DoWorkAsync(linkedCts.Token);
    }
    catch (OperationCanceledException)
    {
        if (userCancellation.IsCancellationRequested)
        {
            Console.WriteLine("User cancelled");
        }
        else if (timeoutCts.IsCancellationRequested)
        {
            Console.WriteLine("Operation timed out");
            throw new TimeoutException("Operation timed out");
        }
        throw;
    }
}
```

### Use Default Parameters for Optional Cancellation Support

```csharp
// Use default value in method signature
public async Task DoWorkAsync(CancellationToken cancellationToken = default)
{
    // Caller can choose whether to pass a cancellation token
    await Task.Delay(1000, cancellationToken);
}

// Overloaded methods
public Task DoWorkAsync() => DoWorkAsync(CancellationToken.None);

public async Task DoWorkAsync(CancellationToken cancellationToken)
{
    await Task.Delay(1000, cancellationToken);
}
```

## Common Pitfalls

### Forgetting to Dispose CancellationTokenSource

```csharp
// Pitfall: CancellationTokenSource not disposed causes memory leak
public async Task MemoryLeakAsync()
{
    var cts = new CancellationTokenSource();
    cts.CancelAfter(TimeSpan.FromSeconds(5));

    // cts never disposed, internal Timer keeps reference
    await DoWorkAsync(cts.Token);
}

// Solution: Use using
public async Task NoLeakAsync()
{
    using var cts = new CancellationTokenSource();
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    await DoWorkAsync(cts.Token);
}
```

### Continuing to Use CancellationTokenSource After Cancellation

```csharp
// Pitfall: Reusing CancellationTokenSource after cancellation
public async Task ReuseMistakeAsync()
{
    var cts = new CancellationTokenSource();

    // First operation
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    try
    {
        await DoWorkAsync(cts.Token);
    }
    catch (OperationCanceledException) { }

    // Wrong: Cancelled CancellationTokenSource cannot be reset
    // This operation will be cancelled immediately!
    await DoWorkAsync(cts.Token); // Immediately throws OperationCanceledException
}

// Solution: Create new CancellationTokenSource for each operation
public async Task CorrectReuseAsync()
{
    for (int i = 0; i < 3; i++)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        try
        {
            await DoWorkAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine($"Operation {i} timed out");
        }
    }
}
```

### Throwing Exceptions in Callbacks

```csharp
// Pitfall: Exceptions in callbacks may be swallowed or cause issues
public void CallbackExceptionTrap()
{
    using var cts = new CancellationTokenSource();

    cts.Token.Register(() =>
    {
        // Dangerous: This exception may be swallowed or cause unexpected behavior
        throw new InvalidOperationException("Exception in callback");
    });

    cts.Cancel(); // When cancelling, exception behavior depends on Cancel's parameters
}

// Solution: Handle exceptions in callbacks
public void SafeCallbackAsync()
{
    using var cts = new CancellationTokenSource();

    cts.Token.Register(() =>
    {
        try
        {
            // Cleanup operation that might throw
            CleanupResources();
        }
        catch (Exception ex)
        {
            // Log but don't rethrow
            Console.WriteLine($"Error during cleanup: {ex.Message}");
        }
    });

    cts.Cancel();
}
```

### Blocking Wait on Cancelled Operations

```csharp
// Pitfall: Synchronous waiting may cause deadlock
public void DeadlockRiskAsync()
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));

    // Dangerous: Synchronously waiting on UI thread
    var result = DoWorkAsync(cts.Token).Result; // May deadlock!
}

// Solution: Use async waiting
public async Task NoDeadlockAsync()
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));

    try
    {
        var result = await DoWorkAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        // Handle cancellation
    }
}
```

### Ignoring CancellationToken Parameter

```csharp
// Pitfall: Received CancellationToken but completely ignored it
public async Task IgnoredTokenAsync(CancellationToken cancellationToken)
{
    // Wrong: Not using the passed cancellationToken
    await Task.Delay(10000); // Will wait 10 seconds even if caller cancels

    for (int i = 0; i < 1000; i++)
    {
        // Wrong: No cancellation check in loop
        await ProcessItemAsync(i);
    }
}

// Solution: Use token at all appropriate locations
public async Task ProperTokenUsageAsync(CancellationToken cancellationToken)
{
    await Task.Delay(10000, cancellationToken);

    for (int i = 0; i < 1000; i++)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await ProcessItemAsync(i, cancellationToken);
    }
}
```

### Not Disposing Linked Token Sources

```csharp
// Pitfall: Linked CancellationTokenSource not disposed
public async Task LinkedTokenLeakAsync(CancellationToken parentToken)
{
    var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        parentToken, timeoutCts.Token);

    // Neither linkedCts nor timeoutCts disposed!
    await DoWorkAsync(linkedCts.Token);
}

// Solution: Ensure all created CancellationTokenSources are disposed
public async Task NoLinkedTokenLeakAsync(CancellationToken parentToken)
{
    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        parentToken, timeoutCts.Token);

    await DoWorkAsync(linkedCts.Token);
}
```

## Performance Considerations

### CancellationToken is a Struct

```csharp
// CancellationToken is a struct, copied when passed
// But since it only contains a reference to CancellationTokenSource, copying cost is low
public void PassToken(CancellationToken token)
{
    // Performance overhead of passing CancellationToken is very small
}
```

### Avoid Frequently Creating CancellationTokenSource

```csharp
// Bad practice: Creating new CancellationTokenSource for each small operation
public async Task FrequentCreationAsync()
{
    for (int i = 0; i < 10000; i++)
    {
        using var cts = new CancellationTokenSource(); // Lots of allocations
        await SmallOperationAsync(cts.Token);
    }
}

// Good practice: Reuse or pass existing CancellationToken
public async Task EfficientAsync(CancellationToken cancellationToken)
{
    for (int i = 0; i < 10000; i++)
    {
        await SmallOperationAsync(cancellationToken);
    }
}
```

### Cost of Checking Cancellation Status

```csharp
// IsCancellationRequested is a simple field read, very fast
// ThrowIfCancellationRequested is also fast when not cancelled

// In tight loops, consider reducing check frequency
public async Task OptimizedCheckingAsync(CancellationToken cancellationToken)
{
    for (int i = 0; i < 1000000; i++)
    {
        // Check every 1000 iterations
        if (i % 1000 == 0)
        {
            cancellationToken.ThrowIfCancellationRequested();
        }

        // Fast operation
        DoQuickWork(i);
    }
}
```

### Performance of Callback Registration

```csharp
// Registering callbacks has some overhead, avoid registering in hot paths
// Callbacks execute synchronously on cancellation, ensure callbacks return quickly

public void EfficientCallbackRegistration()
{
    using var cts = new CancellationTokenSource();

    // Good: Register once during initialization
    using var registration = cts.Token.Register(() => Cleanup());

    // Perform operations...
}

public void InefficientCallbackRegistration()
{
    using var cts = new CancellationTokenSource();

    for (int i = 0; i < 1000; i++)
    {
        // Bad: Repeatedly registering in loop
        cts.Token.Register(() => Cleanup());
    }
}
```

### Memory Allocation Optimization

```csharp
// Use allocation-free pattern to check cancellation status
public void LowAllocationPattern(CancellationToken cancellationToken)
{
    // Good: Check property directly
    if (cancellationToken.IsCancellationRequested)
    {
        throw new OperationCanceledException(cancellationToken);
    }

    // Or use built-in method (also allocation-free)
    cancellationToken.ThrowIfCancellationRequested();
}
```

## Real-World Scenarios

### Scenario 1: Web API Request Timeout

```csharp
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReport(
        int id,
        CancellationToken cancellationToken) // ASP.NET Core provides automatically
    {
        try
        {
            // Set additional timeout limit
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken, timeoutCts.Token);

            var report = await _reportService.GenerateReportAsync(id, linkedCts.Token);
            return Ok(report);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Client disconnected
            return StatusCode(499, "Client closed request");
        }
        catch (OperationCanceledException)
        {
            // Timeout
            return StatusCode(504, "Request timeout");
        }
    }
}
```

### Scenario 2: Background Service Graceful Shutdown

```csharp
public class BackgroundWorkerService : BackgroundService
{
    private readonly ILogger<BackgroundWorkerService> _logger;
    private readonly IMessageQueue _messageQueue;

    public BackgroundWorkerService(
        ILogger<BackgroundWorkerService> logger,
        IMessageQueue messageQueue)
    {
        _logger = logger;
        _messageQueue = messageQueue;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Wait for message, supports cancellation
                var message = await _messageQueue.DequeueAsync(stoppingToken);

                if (message != null)
                {
                    await ProcessMessageAsync(message, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Background service received stop signal");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message");
                await Task.Delay(1000, stoppingToken);
            }
        }

        _logger.LogInformation("Background service stopped");
    }

    private async Task ProcessMessageAsync(Message message, CancellationToken cancellationToken)
    {
        // Set timeout for individual message processing
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken, timeoutCts.Token);

        await DoProcessingAsync(message, linkedCts.Token);
    }
}
```

### Scenario 3: User-Cancellable File Upload

```csharp
public class FileUploadService
{
    public async Task<UploadResult> UploadFileAsync(
        Stream fileStream,
        string fileName,
        IProgress<UploadProgress> progress,
        CancellationToken cancellationToken)
    {
        var totalBytes = fileStream.Length;
        var uploadedBytes = 0L;
        var buffer = new byte[81920]; // 80KB buffer

        using var httpClient = new HttpClient();
        using var content = new StreamContent(new ProgressStream(
            fileStream,
            bytesRead =>
            {
                uploadedBytes += bytesRead;
                progress?.Report(new UploadProgress
                {
                    FileName = fileName,
                    BytesUploaded = uploadedBytes,
                    TotalBytes = totalBytes,
                    PercentComplete = (double)uploadedBytes / totalBytes * 100
                });
            }));

        try
        {
            var response = await httpClient.PostAsync(
                "https://api.example.com/upload",
                content,
                cancellationToken);

            response.EnsureSuccessStatusCode();

            return new UploadResult
            {
                Success = true,
                FileName = fileName,
                BytesUploaded = uploadedBytes
            };
        }
        catch (OperationCanceledException)
        {
            return new UploadResult
            {
                Success = false,
                FileName = fileName,
                BytesUploaded = uploadedBytes,
                Error = "Upload cancelled by user"
            };
        }
    }
}

public class UploadProgress
{
    public string FileName { get; set; }
    public long BytesUploaded { get; set; }
    public long TotalBytes { get; set; }
    public double PercentComplete { get; set; }
}

public class UploadResult
{
    public bool Success { get; set; }
    public string FileName { get; set; }
    public long BytesUploaded { get; set; }
    public string Error { get; set; }
}
```

### Scenario 4: Parallel Task Processing with Cancellation

```csharp
public class ParallelTaskProcessor
{
    public async Task<ProcessingResult> ProcessItemsInParallelAsync(
        IEnumerable<WorkItem> items,
        int maxDegreeOfParallelism,
        CancellationToken cancellationToken)
    {
        var results = new ConcurrentBag<ItemResult>();
        var exceptions = new ConcurrentBag<Exception>();
        var processedCount = 0;

        var semaphore = new SemaphoreSlim(maxDegreeOfParallelism);

        var tasks = items.Select(async item =>
        {
            await semaphore.WaitAsync(cancellationToken);

            try
            {
                cancellationToken.ThrowIfCancellationRequested();

                var result = await ProcessItemAsync(item, cancellationToken);
                results.Add(result);
                Interlocked.Increment(ref processedCount);
            }
            catch (OperationCanceledException)
            {
                throw; // Rethrow cancellation exception
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
            finally
            {
                semaphore.Release();
            }
        });

        try
        {
            await Task.WhenAll(tasks);
        }
        catch (OperationCanceledException)
        {
            // Handle cancellation
        }

        return new ProcessingResult
        {
            TotalItems = items.Count(),
            ProcessedCount = processedCount,
            Results = results.ToList(),
            Errors = exceptions.ToList(),
            WasCancelled = cancellationToken.IsCancellationRequested
        };
    }

    private async Task<ItemResult> ProcessItemAsync(
        WorkItem item,
        CancellationToken cancellationToken)
    {
        await Task.Delay(100, cancellationToken); // Simulate processing
        return new ItemResult { ItemId = item.Id, Success = true };
    }
}

public class WorkItem { public int Id { get; set; } }
public class ItemResult { public int ItemId { get; set; } public bool Success { get; set; } }
public class ProcessingResult
{
    public int TotalItems { get; set; }
    public int ProcessedCount { get; set; }
    public List<ItemResult> Results { get; set; }
    public List<Exception> Errors { get; set; }
    public bool WasCancelled { get; set; }
}
```

## Interview Key Points

### What is the difference between CancellationToken and CancellationTokenSource?

**Key Points:**
- `CancellationTokenSource` is the initiator of cancellation requests, responsible for creating tokens and initiating cancellation
- `CancellationToken` is a read-only struct used to check cancellation status and register callbacks
- `CancellationTokenSource` needs to be disposed (implements `IDisposable`)
- A `CancellationTokenSource` can only be cancelled once and cannot be reset

### Why use cooperative cancellation instead of forcefully terminating threads?

**Key Points:**
- Forceful termination (like `Thread.Abort`) can cause resource leaks and data corruption
- Cooperative cancellation allows operations to stop at safe points and clean up resources
- Operations can choose how to respond to cancellation (save progress, rollback transactions, etc.)
- .NET Core no longer supports `Thread.Abort`

### What is the difference between ThrowIfCancellationRequested and checking IsCancellationRequested?

**Key Points:**
- `ThrowIfCancellationRequested()` throws `OperationCanceledException` when cancelled
- `IsCancellationRequested` returns a boolean, allowing more flexible handling
- Use cases: Use the former for quick exit, use the latter when cleanup work is needed
- Performance difference between the two is minimal

### How to properly handle OperationCanceledException?

**Key Points:**
```csharp
try
{
    await DoWorkAsync(cancellationToken);
}
catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
{
    // Expected cancellation, usually needs no special handling
}
catch (OperationCanceledException)
{
    // Timeout or other reason for cancellation
}
```

### Explain use cases for linked tokens

**Key Points:**
- Used when multiple cancellation conditions are needed (user cancellation + timeout + application shutdown)
- Created using `CreateLinkedTokenSource`
- Cancellation of any source triggers the linked token cancellation
- Must dispose the linked `CancellationTokenSource`

### What is the purpose of CancellationToken.None?

**Key Points:**
- Represents a token that will never be cancelled
- `CanBeCanceled` property is `false`
- Used in scenarios where cancellation support is not needed
- As default value for method parameters

## Further Reading

### Official Documentation
- [Microsoft Docs: Cancellation in Managed Threads](https://docs.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads)
- [Task Cancellation](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/task-cancellation)
- [How to: Cancel a Task and Its Children](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/how-to-cancel-a-task-and-its-children)

### Related Topics
- [C# Asynchronous Programming (async/await)](/docs/csharp/async)
- [Task Parallel Library (TPL)](/docs/csharp/async#parallel-类)
- [IAsyncEnumerable Async Streams](/docs/csharp/async#异步流-async-streams---iasyncenumerablet)

### Advanced Reading
- Stephen Cleary - "Concurrency in C# Cookbook"
- Stephen Toub - "Patterns for Parallel Programming"
- [Async Guidance by David Fowler](https://github.com/davidfowl/AspNetCoreDiagnosticScenarios)

---

> CancellationToken is an indispensable tool in C# asynchronous programming. Proper use of cancellation mechanisms can significantly improve application responsiveness and user experience. Remember to always dispose `CancellationTokenSource`, pass tokens to all async operations that support them, and check cancellation status at appropriate locations.
