---
title: C# Async Programming
description: "Master C# async: Task, async/await, parallel programming and synchronization"
track: csharp
section: async
difficulty: intermediate
tags:
  - C#
  - async
  - await
  - Task
status: imported
origin: old/src/content/docs/csharp/async.en.md
divergence: 0.195
issues: []
legacy:
  category: CSharp
  subcategory: Async Programming
  order: 2
  lastUpdated: 2026-01-07
---

Asynchronous programming in C# allows you to write responsive applications by performing long-running operations without blocking the main thread. This comprehensive guide covers the essential concepts and patterns for mastering async programming in C#.

## Introduction to Asynchronous Programming

Asynchronous programming enables your application to remain responsive while performing time-consuming operations such as:

- Network requests (HTTP calls, database queries)
- File I/O operations
- CPU-intensive computations
- Long-running background tasks

Instead of blocking execution while waiting for operations to complete, async programming allows the thread to do other work, improving overall application performance and responsiveness.

## Task Basics

The `Task` class represents an asynchronous operation. It's the foundation of async programming in C#.

### Creating Tasks

```csharp
using System;
using System.Threading.Tasks;

public class TaskBasics
{
    // Using Task.Run for CPU-bound operations
    public static Task<int> CalculateAsync()
    {
        return Task.Run(() =>
        {
            int sum = 0;
            for (int i = 0; i < 1000000; i++)
            {
                sum += i;
            }
            return sum;
        });
    }

    // Using Task.FromResult for already completed operations
    public static Task<string> GetCachedDataAsync()
    {
        return Task.FromResult("Cached data");
    }

    // Using TaskCompletionSource for custom async operations
    public static Task<int> CustomAsyncOperation()
    {
        var tcs = new TaskCompletionSource<int>();

        // Simulate async completion
        Task.Run(() =>
        {
            Thread.Sleep(1000);
            tcs.SetResult(42);
        });

        return tcs.Task;
    }
}
```

### Task States and Properties

```csharp
public class TaskStates
{
    public static async Task DemonstrateTaskStates()
    {
        var task = Task.Run(() =>
        {
            Thread.Sleep(2000);
            return 100;
        });

        Console.WriteLine($"Status: {task.Status}"); // Running
        Console.WriteLine($"IsCompleted: {task.IsCompleted}"); // False
        Console.WriteLine($"IsCanceled: {task.IsCanceled}"); // False
        Console.WriteLine($"IsFaulted: {task.IsFaulted}"); // False

        var result = await task;

        Console.WriteLine($"Status: {task.Status}"); // RanToCompletion
        Console.WriteLine($"IsCompleted: {task.IsCompleted}"); // True
        Console.WriteLine($"Result: {result}"); // 100
    }
}
```

### Task Continuations

```csharp
public class TaskContinuations
{
    public static async Task DemonstrateContinuations()
    {
        var task = Task.Run(() => 10);

        // ContinueWith allows chaining operations
        var continuationTask = task.ContinueWith(t =>
        {
            Console.WriteLine($"Original result: {t.Result}");
            return t.Result * 2;
        });

        var finalResult = await continuationTask;
        Console.WriteLine($"Final result: {finalResult}"); // 20
    }

    public static async Task MultipleContinuations()
    {
        var task = Task.Run(() => 5);

        var doubled = task.ContinueWith(t => t.Result * 2);
        var tripled = task.ContinueWith(t => t.Result * 3);

        await Task.WhenAll(doubled, tripled);

        Console.WriteLine($"Doubled: {doubled.Result}"); // 10
        Console.WriteLine($"Tripled: {tripled.Result}"); // 15
    }
}
```

## Async/Await Pattern

The `async` and `await` keywords provide a clean, readable way to work with asynchronous operations.

### Basic Async/Await

```csharp
using System.Net.Http;

public class AsyncAwaitBasics
{
    // Method signature includes 'async' keyword
    // Return type is Task<T> for methods that return a value
    public static async Task<string> FetchDataAsync(string url)
    {
        using var client = new HttpClient();

        // 'await' suspends execution until the task completes
        string result = await client.GetStringAsync(url);

        return result;
    }

    // Return type is Task for methods that don't return a value
    public static async Task ProcessDataAsync()
    {
        await Task.Delay(1000); // Asynchronous delay
        Console.WriteLine("Processing complete");
    }

    // Async methods can be void for event handlers only
    private static async void Button_Click(object sender, EventArgs e)
    {
        await ProcessDataAsync();
    }
}
```

### Async Execution Flow

```csharp
public class ExecutionFlow
{
    public static async Task DemonstrateFlowAsync()
    {
        Console.WriteLine("1. Before first await");

        await Task.Delay(1000);

        Console.WriteLine("2. After first await");

        var result = await GetNumberAsync();

        Console.WriteLine($"3. Got result: {result}");
    }

    private static async Task<int> GetNumberAsync()
    {
        Console.WriteLine("  Inside GetNumberAsync - before delay");
        await Task.Delay(500);
        Console.WriteLine("  Inside GetNumberAsync - after delay");
        return 42;
    }
}
```

### Combining Multiple Async Operations

```csharp
public class CombiningAsyncOperations
{
    // Sequential execution (slow)
    public static async Task<int> SequentialAsync()
    {
        var result1 = await GetNumberAsync(1000);
        var result2 = await GetNumberAsync(1000);
        return result1 + result2;
        // Total time: ~2000ms
    }

    // Concurrent execution (fast)
    public static async Task<int> ConcurrentAsync()
    {
        var task1 = GetNumberAsync(1000);
        var task2 = GetNumberAsync(1000);

        await Task.WhenAll(task1, task2);

        return task1.Result + task2.Result;
        // Total time: ~1000ms
    }

    // WhenAny - complete when first task completes
    public static async Task<int> FirstToCompleteAsync()
    {
        var task1 = GetNumberAsync(500);
        var task2 = GetNumberAsync(1000);
        var task3 = GetNumberAsync(1500);

        var completedTask = await Task.WhenAny(task1, task2, task3);
        return await completedTask;
    }

    private static async Task<int> GetNumberAsync(int delay)
    {
        await Task.Delay(delay);
        return delay;
    }
}
```

### ValueTask for Performance Optimization

```csharp
public class ValueTaskExample
{
    private int cachedValue = -1;

    // ValueTask is useful when results might be cached
    public ValueTask<int> GetValueAsync()
    {
        if (cachedValue != -1)
        {
            // Synchronous path - no allocation
            return new ValueTask<int>(cachedValue);
        }

        // Asynchronous path
        return new ValueTask<int>(FetchValueAsync());
    }

    private async Task<int> FetchValueAsync()
    {
        await Task.Delay(100);
        cachedValue = 42;
        return cachedValue;
    }
}
```

## Exception Handling in Async Code

Proper exception handling is crucial in asynchronous code to prevent silent failures.

### Basic Exception Handling

```csharp
public class AsyncExceptionHandling
{
    public static async Task HandleExceptionsAsync()
    {
        try
        {
            await RiskyOperationAsync();
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Network error: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Unexpected error: {ex.Message}");
        }
        finally
        {
            Console.WriteLine("Cleanup operations");
        }
    }

    private static async Task RiskyOperationAsync()
    {
        using var client = new HttpClient();
        await client.GetStringAsync("https://invalid-url-example.com");
    }
}
```

### Exception Handling with Multiple Tasks

```csharp
public class MultipleTaskExceptions
{
    public static async Task HandleMultipleTasksAsync()
    {
        var tasks = new[]
        {
            Task.Run(() => throw new InvalidOperationException("Task 1 failed")),
            Task.Run(() => throw new ArgumentException("Task 2 failed")),
            Task.Run(() => 42)
        };

        try
        {
            await Task.WhenAll(tasks);
        }
        catch (Exception ex)
        {
            // Only the first exception is caught
            Console.WriteLine($"Caught: {ex.Message}");
        }
    }

    public static async Task HandleAllExceptionsAsync()
    {
        var tasks = new[]
        {
            Task.Run(() => throw new InvalidOperationException("Task 1 failed")),
            Task.Run(() => throw new ArgumentException("Task 2 failed")),
            Task.Run(() => 42)
        };

        try
        {
            await Task.WhenAll(tasks);
        }
        catch
        {
            // Get all exceptions from AggregateException
            foreach (var task in tasks)
            {
                if (task.IsFaulted && task.Exception != null)
                {
                    foreach (var ex in task.Exception.InnerExceptions)
                    {
                        Console.WriteLine($"Exception: {ex.Message}");
                    }
                }
            }
        }
    }
}
```

### Async Void Exception Handling

```csharp
public class AsyncVoidExceptions
{
    // AVOID: Exceptions in async void methods crash the application
    private static async void DangerousAsync()
    {
        await Task.Delay(100);
        throw new Exception("This will crash the app!");
    }

    // PREFER: Use async Task instead
    private static async Task SafeAsync()
    {
        await Task.Delay(100);
        throw new Exception("This can be caught");
    }

    public static async Task UseAsyncMethodsCorrectly()
    {
        try
        {
            await SafeAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Caught safely: {ex.Message}");
        }
    }
}
```

## Cancellation Tokens

Cancellation tokens provide a cooperative mechanism to cancel async operations.

### Basic Cancellation

```csharp
public class CancellationBasics
{
    public static async Task CancellableOperationAsync(CancellationToken cancellationToken)
    {
        for (int i = 0; i < 10; i++)
        {
            // Check if cancellation was requested
            cancellationToken.ThrowIfCancellationRequested();

            Console.WriteLine($"Processing item {i}");
            await Task.Delay(1000, cancellationToken);
        }
    }

    public static async Task UseCancellationAsync()
    {
        var cts = new CancellationTokenSource();

        // Cancel after 3 seconds
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        try
        {
            await CancellableOperationAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation was cancelled");
        }
        finally
        {
            cts.Dispose();
        }
    }
}
```

### Manual Cancellation

```csharp
public class ManualCancellation
{
    public static async Task ManualCancelAsync()
    {
        var cts = new CancellationTokenSource();

        var task = LongRunningOperationAsync(cts.Token);

        // Cancel after user input
        Console.WriteLine("Press any key to cancel...");
        _ = Task.Run(() =>
        {
            Console.ReadKey();
            cts.Cancel();
        });

        try
        {
            await task;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Cancelled by user");
        }
        finally
        {
            cts.Dispose();
        }
    }

    private static async Task LongRunningOperationAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            Console.WriteLine("Working...");
            await Task.Delay(500, cancellationToken);
        }
    }
}
```

### Linked Cancellation Tokens

```csharp
public class LinkedCancellation
{
    public static async Task LinkedTokensAsync()
    {
        var cts1 = new CancellationTokenSource();
        var cts2 = new CancellationTokenSource();

        // Create a linked token that cancels when either source cancels
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cts1.Token, cts2.Token);

        cts1.CancelAfter(5000); // Cancel after 5 seconds
        cts2.CancelAfter(3000); // Cancel after 3 seconds (wins)

        try
        {
            await ProcessWithTimeoutAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Cancelled by linked token");
        }
        finally
        {
            cts1.Dispose();
            cts2.Dispose();
        }
    }

    private static async Task ProcessWithTimeoutAsync(CancellationToken cancellationToken)
    {
        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.Delay(500, cancellationToken);
            Console.WriteLine("Processing...");
        }
    }
}
```

### Cancellation Callbacks

```csharp
public class CancellationCallbacks
{
    public static async Task CancellationCallbackAsync()
    {
        var cts = new CancellationTokenSource();

        // Register a callback for when cancellation occurs
        cts.Token.Register(() =>
        {
            Console.WriteLine("Cancellation requested - cleaning up...");
        });

        // Can register multiple callbacks
        cts.Token.Register(() =>
        {
            Console.WriteLine("Logging cancellation event...");
        });

        cts.CancelAfter(2000);

        try
        {
            await Task.Delay(5000, cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation cancelled");
        }
        finally
        {
            cts.Dispose();
        }
    }
}
```

## Parallel Programming

The `Parallel` class and PLINQ provide tools for parallel execution of CPU-bound operations.

### Parallel.For and Parallel.ForEach

```csharp
public class ParallelLoops
{
    public static void ParallelForExample()
    {
        // Process items in parallel
        Parallel.For(0, 100, i =>
        {
            Console.WriteLine($"Processing {i} on thread {Thread.CurrentThread.ManagedThreadId}");
            Thread.Sleep(10);
        });
    }

    public static void ParallelForEachExample()
    {
        var items = Enumerable.Range(1, 100).ToList();

        Parallel.ForEach(items, item =>
        {
            var result = ProcessItem(item);
            Console.WriteLine($"Item {item}: {result}");
        });
    }

    private static int ProcessItem(int item)
    {
        Thread.Sleep(10);
        return item * item;
    }
}
```

### Parallel Options and Degree of Parallelism

```csharp
public class ParallelOptions
{
    public static void ConfiguredParallelExecution()
    {
        var options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 4, // Limit to 4 threads
            CancellationToken = CancellationToken.None
        };

        Parallel.For(0, 1000, options, i =>
        {
            ProcessCpuIntensiveOperation(i);
        });
    }

    public static void ParallelWithCancellation()
    {
        var cts = new CancellationTokenSource();
        cts.CancelAfter(5000); // Cancel after 5 seconds

        var options = new ParallelOptions
        {
            CancellationToken = cts.Token
        };

        try
        {
            Parallel.For(0, 10000, options, i =>
            {
                Thread.Sleep(100);
                Console.WriteLine($"Processing {i}");
            });
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Parallel operation cancelled");
        }
        finally
        {
            cts.Dispose();
        }
    }

    private static void ProcessCpuIntensiveOperation(int i)
    {
        double result = 0;
        for (int j = 0; j < 1000; j++)
        {
            result += Math.Sqrt(j * i);
        }
    }
}
```

### Parallel.Invoke

```csharp
public class ParallelInvoke
{
    public static void ExecuteMultipleActions()
    {
        Parallel.Invoke(
            () => ProcessData("Dataset A"),
            () => ProcessData("Dataset B"),
            () => ProcessData("Dataset C"),
            () => ProcessData("Dataset D")
        );

        Console.WriteLine("All parallel actions completed");
    }

    private static void ProcessData(string datasetName)
    {
        Console.WriteLine($"Processing {datasetName} on thread {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(1000);
        Console.WriteLine($"Completed {datasetName}");
    }
}
```

### PLINQ (Parallel LINQ)

```csharp
public class PlinqExamples
{
    public static void BasicPlinq()
    {
        var numbers = Enumerable.Range(1, 1000);

        var results = numbers
            .AsParallel()
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .ToList();

        Console.WriteLine($"Processed {results.Count} items");
    }

    public static void OrderedPlinq()
    {
        var numbers = Enumerable.Range(1, 100);

        // Preserve order with AsOrdered
        var orderedResults = numbers
            .AsParallel()
            .AsOrdered()
            .Select(n => n * 2)
            .ToList();

        Console.WriteLine($"First: {orderedResults[0]}, Last: {orderedResults[^1]}");
    }

    public static void PlinqWithDegreeOfParallelism()
    {
        var numbers = Enumerable.Range(1, 1000);

        var results = numbers
            .AsParallel()
            .WithDegreeOfParallelism(4)
            .Where(n => IsPrime(n))
            .ToList();

        Console.WriteLine($"Found {results.Count} prime numbers");
    }

    private static bool IsPrime(int n)
    {
        if (n < 2) return false;
        for (int i = 2; i <= Math.Sqrt(n); i++)
        {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void PlinqExceptionHandling()
    {
        var numbers = Enumerable.Range(1, 100);

        try
        {
            var results = numbers
                .AsParallel()
                .Select(n =>
                {
                    if (n == 50) throw new InvalidOperationException($"Error at {n}");
                    return n * 2;
                })
                .ToList();
        }
        catch (AggregateException ae)
        {
            foreach (var ex in ae.InnerExceptions)
            {
                Console.WriteLine($"Exception: {ex.Message}");
            }
        }
    }
}
```

## Synchronization Primitives

When working with shared resources in async code, proper synchronization is essential.

### SemaphoreSlim

```csharp
public class SemaphoreExample
{
    private static readonly SemaphoreSlim semaphore = new SemaphoreSlim(3); // Allow 3 concurrent operations

    public static async Task LimitedConcurrencyAsync()
    {
        var tasks = Enumerable.Range(1, 10).Select(i => AccessResourceAsync(i));
        await Task.WhenAll(tasks);
    }

    private static async Task AccessResourceAsync(int id)
    {
        Console.WriteLine($"Task {id} waiting...");

        await semaphore.WaitAsync();

        try
        {
            Console.WriteLine($"Task {id} entered at {DateTime.Now:HH:mm:ss.fff}");
            await Task.Delay(2000); // Simulate work
            Console.WriteLine($"Task {id} leaving at {DateTime.Now:HH:mm:ss.fff}");
        }
        finally
        {
            semaphore.Release();
        }
    }

    // With timeout
    public static async Task AccessWithTimeoutAsync(int timeoutMs)
    {
        if (await semaphore.WaitAsync(timeoutMs))
        {
            try
            {
                await Task.Delay(1000);
                Console.WriteLine("Resource accessed");
            }
            finally
            {
                semaphore.Release();
            }
        }
        else
        {
            Console.WriteLine("Timeout waiting for resource");
        }
    }
}
```

### Lock vs SemaphoreSlim

```csharp
public class LockComparison
{
    private static readonly object lockObj = new object();
    private static readonly SemaphoreSlim semaphore = new SemaphoreSlim(1, 1);
    private static int counter = 0;

    // Traditional lock - NOT async-compatible
    public static void IncrementWithLock()
    {
        lock (lockObj)
        {
            counter++;
            // Cannot use await here!
        }
    }

    // SemaphoreSlim - async-compatible
    public static async Task IncrementWithSemaphoreAsync()
    {
        await semaphore.WaitAsync();
        try
        {
            counter++;
            await Task.Delay(10); // Can use await
        }
        finally
        {
            semaphore.Release();
        }
    }
}
```

### AsyncLocal for Async Context

```csharp
public class AsyncLocalExample
{
    private static readonly AsyncLocal<string> asyncLocalValue = new AsyncLocal<string>();

    public static async Task DemonstrateAsyncLocalAsync()
    {
        asyncLocalValue.Value = "Main";
        Console.WriteLine($"Main: {asyncLocalValue.Value}");

        await Task.Run(async () =>
        {
            Console.WriteLine($"Task 1 before: {asyncLocalValue.Value}"); // "Main"
            asyncLocalValue.Value = "Task 1";
            await Task.Delay(100);
            Console.WriteLine($"Task 1 after: {asyncLocalValue.Value}"); // "Task 1"
        });

        Console.WriteLine($"Main after task: {asyncLocalValue.Value}"); // Still "Main"
    }
}
```

### Interlocked for Atomic Operations

```csharp
public class InterlockedExample
{
    private static int counter = 0;

    public static async Task SafeIncrementAsync()
    {
        var tasks = Enumerable.Range(1, 1000).Select(_ => Task.Run(() =>
        {
            for (int i = 0; i < 1000; i++)
            {
                Interlocked.Increment(ref counter); // Thread-safe increment
            }
        }));

        await Task.WhenAll(tasks);
        Console.WriteLine($"Final counter: {counter}"); // Always 1,000,000
    }

    public static async Task InterlockedOperationsAsync()
    {
        int value = 10;

        // Atomic add
        Interlocked.Add(ref value, 5);
        Console.WriteLine($"After Add: {value}"); // 15

        // Atomic exchange
        int oldValue = Interlocked.Exchange(ref value, 100);
        Console.WriteLine($"Old: {oldValue}, New: {value}"); // Old: 15, New: 100

        // Atomic compare and exchange
        int compared = Interlocked.CompareExchange(ref value, 200, 100);
        Console.WriteLine($"Compared: {compared}, Current: {value}"); // Compared: 100, Current: 200
    }
}
```

### ReaderWriterLockSlim

```csharp
public class ReaderWriterExample
{
    private static readonly ReaderWriterLockSlim rwLock = new ReaderWriterLockSlim();
    private static readonly Dictionary<int, string> cache = new Dictionary<int, string>();

    public static async Task ReadDataAsync(int key)
    {
        await Task.Run(() =>
        {
            rwLock.EnterReadLock();
            try
            {
                if (cache.TryGetValue(key, out var value))
                {
                    Console.WriteLine($"Read: {key} = {value}");
                }
            }
            finally
            {
                rwLock.ExitReadLock();
            }
        });
    }

    public static async Task WriteDataAsync(int key, string value)
    {
        await Task.Run(() =>
        {
            rwLock.EnterWriteLock();
            try
            {
                cache[key] = value;
                Console.WriteLine($"Written: {key} = {value}");
            }
            finally
            {
                rwLock.ExitWriteLock();
            }
        });
    }
}
```

## Best Practices

### Avoid Async Void

```csharp
public class AsyncVoidPractice
{
    // BAD: Async void (only for event handlers)
    private static async void BadAsyncMethod()
    {
        await Task.Delay(100);
    }

    // GOOD: Async Task
    private static async Task GoodAsyncMethod()
    {
        await Task.Delay(100);
    }

    // ACCEPTABLE: Event handler
    private static async void Button_Click(object sender, EventArgs e)
    {
        try
        {
            await GoodAsyncMethod();
        }
        catch (Exception ex)
        {
            // Handle exceptions in async void event handlers
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}
```

### ConfigureAwait Usage

```csharp
public class ConfigureAwaitPractice
{
    // In library code - use ConfigureAwait(false)
    public static async Task<string> LibraryMethodAsync()
    {
        var result = await GetDataAsync().ConfigureAwait(false);
        return ProcessData(result);
    }

    // In UI code - don't use ConfigureAwait or use ConfigureAwait(true)
    public static async Task UpdateUIAsync()
    {
        var data = await GetDataAsync(); // Returns to UI context
        // UpdateUI(data); // Safe to update UI here
    }

    private static async Task<string> GetDataAsync()
    {
        await Task.Delay(100);
        return "data";
    }

    private static string ProcessData(string data) => data.ToUpper();
}
```

### Avoid Blocking on Async Code

```csharp
public class BlockingPractice
{
    // BAD: Blocking on async code (can cause deadlocks)
    public static void BadSynchronousMethod()
    {
        var result = GetDataAsync().Result; // DON'T DO THIS
        var result2 = GetDataAsync().GetAwaiter().GetResult(); // DON'T DO THIS
    }

    // GOOD: Async all the way
    public static async Task GoodAsyncMethod()
    {
        var result = await GetDataAsync();
    }

    // GOOD: If you must block, use Task.Run
    public static void SynchronousWrapper()
    {
        Task.Run(async () => await GetDataAsync()).Wait();
    }

    private static async Task<string> GetDataAsync()
    {
        await Task.Delay(100);
        return "data";
    }
}
```

### Exception Handling Best Practices

```csharp
public class ExceptionBestPractices
{
    public static async Task<Result<string>> SafeAsyncMethodAsync()
    {
        try
        {
            var data = await GetDataAsync();
            return Result<string>.Success(data);
        }
        catch (HttpRequestException ex)
        {
            // Log specific exception
            Console.WriteLine($"Network error: {ex.Message}");
            return Result<string>.Failure("Network error occurred");
        }
        catch (Exception ex)
        {
            // Log unexpected exception
            Console.WriteLine($"Unexpected error: {ex}");
            return Result<string>.Failure("An unexpected error occurred");
        }
    }

    private static async Task<string> GetDataAsync()
    {
        await Task.Delay(100);
        return "data";
    }
}

public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T Value { get; set; }
    public string Error { get; set; }

    public static Result<T> Success(T value) => new Result<T>
    {
        IsSuccess = true,
        Value = value
    };

    public static Result<T> Failure(string error) => new Result<T>
    {
        IsSuccess = false,
        Error = error
    };
}
```

### Task Disposal and Cleanup

```csharp
public class DisposalPractices
{
    public static async Task ProperResourceManagementAsync()
    {
        using var cts = new CancellationTokenSource();
        using var client = new HttpClient();

        try
        {
            var response = await client.GetAsync("https://api.example.com", cts.Token);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            // Process stream
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
        // All resources automatically disposed
    }
}
```

### Avoid Fire-and-Forget

```csharp
public class FireAndForgetPractice
{
    // BAD: Fire-and-forget loses exceptions
    public static void BadFireAndForget()
    {
        _ = DoWorkAsync(); // Exception will be lost
    }

    // GOOD: Track the task
    public static async Task GoodAsyncMethod()
    {
        await DoWorkAsync(); // Exception can be caught
    }

    // ACCEPTABLE: Explicit fire-and-forget with error handling
    public static void ExplicitFireAndForget()
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await DoWorkAsync();
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Background task error: {ex.Message}");
            }
        });
    }

    private static async Task DoWorkAsync()
    {
        await Task.Delay(100);
        throw new Exception("Something went wrong");
    }
}
```

## Conclusion

Mastering async programming in C# requires understanding these key concepts:

1. **Tasks** are the foundation of async operations
2. **Async/await** provides clean, readable asynchronous code
3. **Exception handling** must be carefully managed in async contexts
4. **Cancellation tokens** enable cooperative cancellation
5. **Parallel programming** optimizes CPU-bound operations
6. **Synchronization primitives** protect shared resources

By following best practices and understanding these patterns, you can build responsive, efficient, and maintainable applications. Remember to:

- Use async/await consistently throughout your codebase
- Avoid blocking on async code
- Handle exceptions properly
- Use cancellation tokens for long-running operations
- Choose the right synchronization primitive for your scenario
- Profile and measure to ensure async code provides real benefits

With these tools and techniques, you're well-equipped to handle asynchronous programming challenges in C#.
