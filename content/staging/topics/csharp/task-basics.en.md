---
title: C# Task 基础
description: 深入理解 C# Task 类：Task 与 Task<T>、Task.Run、Task.WhenAll、Task.WhenAny 及任务延续
track: csharp
section: async
difficulty: intermediate
tags:
  - C#
  - Task
  - 异步
  - 并发
  - Task.Run
  - WhenAll
  - WhenAny
status: imported
origin: old/src/content/docs/csharp/task-basics.en.md
divergence: 0.177
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 异步编程
  order: 3
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is Task

`Task` is a core type introduced in .NET Framework 4.0 that represents an asynchronous operation. It is a fundamental component of the Task Parallel Library (TPL), providing a unified asynchronous programming model for .NET.

```csharp
// Task represents an asynchronous operation that does not return a value
Task task = Task.Run(() => Console.WriteLine("Hello, Task!"));

// Task<TResult> represents an asynchronous operation that returns a value
Task<int> taskWithResult = Task.Run(() => 42);
```

### Historical Evolution of Task

Before Task appeared, .NET asynchronous programming went through several stages:

1. **APM (Asynchronous Programming Model)**: Based on `BeginXxx` / `EndXxx` method pairs
2. **EAP (Event-based Asynchronous Pattern)**: Event-based asynchronous pattern
3. **TAP (Task-based Asynchronous Pattern)**: Task-based asynchronous pattern (modern standard)

```csharp
// APM pattern (obsolete)
IAsyncResult result = stream.BeginRead(buffer, 0, buffer.Length, callback, state);

// EAP pattern (obsolete)
webClient.DownloadStringCompleted += (s, e) => { /* handle result */ };
webClient.DownloadStringAsync(uri);

// TAP pattern (recommended)
string content = await httpClient.GetStringAsync(uri);
```

### Problems Solved by Task

1. **Improved Responsiveness**: Allows UI threads to remain responsive without being blocked by long operations
2. **Improved Throughput**: Releases threads while waiting for I/O operations, improving server scalability
3. **Unified Asynchronous Model**: Provides a consistent asynchronous programming interface
4. **Simplified Concurrent Programming**: Simplifies multi-task coordination through combinators

## Core Principles

### Internal Structure of Task

Task internally maintains the following key states:

```csharp
public class Task
{
    // Simplified internal structure illustration
    private volatile int m_stateFlags;           // State flags
    private object m_stateObject;                // State object
    private TaskScheduler m_taskScheduler;       // Task scheduler
    private volatile ManualResetEventSlim m_completionEvent; // Completion event
    private List<TaskContinuation> m_continuationObject;     // Continuation tasks
}
```

### Task State Machine

Task goes through the following states during its lifecycle:

```
Created → WaitingForActivation → WaitingToRun → Running → RanToCompletion
                                                       ↘ Canceled
                                                       ↘ Faulted
```

```csharp
// State checking example
Task task = Task.Run(async () =>
{
    await Task.Delay(1000);
    return 42;
});

Console.WriteLine($"Status: {task.Status}");          // WaitingForActivation or Running
Console.WriteLine($"IsCompleted: {task.IsCompleted}");   // False
Console.WriteLine($"IsCompletedSuccessfully: {task.IsCompletedSuccessfully}"); // False

await task;

Console.WriteLine($"Status: {task.Status}");          // RanToCompletion
Console.WriteLine($"IsCompleted: {task.IsCompleted}");   // True
Console.WriteLine($"IsCompletedSuccessfully: {task.IsCompletedSuccessfully}"); // True
```

### TaskScheduler

TaskScheduler is responsible for determining which thread a Task executes on:

```csharp
// Default scheduler - uses thread pool
TaskScheduler defaultScheduler = TaskScheduler.Default;

// Current synchronization context scheduler - for UI threads
TaskScheduler syncContextScheduler = TaskScheduler.FromCurrentSynchronizationContext();

// Custom scheduler example
public class LimitedConcurrencyScheduler : TaskScheduler
{
    private readonly int _maxDegreeOfParallelism;
    private readonly LinkedList<Task> _tasks = new LinkedList<Task>();
    private int _runningTasks = 0;

    public LimitedConcurrencyScheduler(int maxDegreeOfParallelism)
    {
        _maxDegreeOfParallelism = maxDegreeOfParallelism;
    }

    protected override IEnumerable<Task> GetScheduledTasks()
    {
        lock (_tasks) { return _tasks.ToArray(); }
    }

    protected override void QueueTask(Task task)
    {
        lock (_tasks)
        {
            _tasks.AddLast(task);
            if (_runningTasks < _maxDegreeOfParallelism)
            {
                _runningTasks++;
                NotifyThreadPoolOfPendingWork();
            }
        }
    }

    protected override bool TryExecuteTaskInline(Task task, bool taskWasPreviouslyQueued)
    {
        return false; // Does not support inline execution
    }

    private void NotifyThreadPoolOfPendingWork()
    {
        ThreadPool.QueueUserWorkItem(_ =>
        {
            while (true)
            {
                Task task;
                lock (_tasks)
                {
                    if (_tasks.Count == 0)
                    {
                        _runningTasks--;
                        break;
                    }
                    task = _tasks.First.Value;
                    _tasks.RemoveFirst();
                }
                TryExecuteTask(task);
            }
        });
    }
}
```

### Relationship Between Thread Pool and Task

Task.Run executes tasks on the thread pool by default:

```csharp
// View thread information
Task.Run(() =>
{
    Console.WriteLine($"Thread ID: {Thread.CurrentThread.ManagedThreadId}");
    Console.WriteLine($"Is ThreadPool Thread: {Thread.CurrentThread.IsThreadPoolThread}");
    Console.WriteLine($"Is Background Thread: {Thread.CurrentThread.IsBackground}");
});

// Example output:
// Thread ID: 4
// Is ThreadPool Thread: True
// Is Background Thread: True
```

## Key Points

### Task Type Comparison

| Feature | Task | Task&lt;TResult&gt; |
|------|------|-------------------|
| Return Value | None | TResult |
| Purpose | Represents an async operation without return value | Represents an async operation with return value |
| Getting Result | Wait for completion only | Through Result property or await |
| Base Class | Inherits from Object | Inherits from Task |

### Ways to Create Tasks

```csharp
// 1. Task.Run - Most common, executes on thread pool
Task task1 = Task.Run(() => DoWork());
Task<int> task2 = Task.Run(() => Calculate());

// 2. Task.Factory.StartNew - More configuration options
Task task3 = Task.Factory.StartNew(
    () => DoWork(),
    CancellationToken.None,
    TaskCreationOptions.LongRunning,  // Hints to scheduler this is a long-running task
    TaskScheduler.Default
);

// 3. new Task + Start - Delayed start
Task task4 = new Task(() => DoWork());
// ... start later
task4.Start();

// 4. Task.FromResult - Create an already completed task
Task<int> completedTask = Task.FromResult(42);

// 5. Task.CompletedTask - Create an already completed task without return value
Task completed = Task.CompletedTask;

// 6. Task.FromException - Create an already failed task
Task failedTask = Task.FromException(new InvalidOperationException("Error"));

// 7. Task.FromCanceled - Create an already canceled task
CancellationTokenSource cts = new CancellationTokenSource();
cts.Cancel();
Task canceledTask = Task.FromCanceled(cts.Token);
```

### Task.Run vs Task.Factory.StartNew

```csharp
// Task.Run is a simplified version, equivalent to:
Task.Factory.StartNew(
    action,
    CancellationToken.None,
    TaskCreationOptions.DenyChildAttach,
    TaskScheduler.Default
);

// Task.Factory.StartNew provides more options
Task.Factory.StartNew(
    () => LongRunningOperation(),
    CancellationToken.None,
    TaskCreationOptions.LongRunning,  // Does not use thread pool, creates dedicated thread
    TaskScheduler.Default
);
```

**When to use Task.Factory.StartNew:**
- Need to specify TaskCreationOptions (like LongRunning)
- Need to specify custom TaskScheduler
- Need to handle parent-child task relationships

### TaskCreationOptions

```csharp
// Common options
TaskCreationOptions.None              // Default
TaskCreationOptions.LongRunning       // Long-running, does not use thread pool
TaskCreationOptions.AttachedToParent  // Attach to parent task
TaskCreationOptions.DenyChildAttach   // Deny child task attachment
TaskCreationOptions.PreferFairness    // Fair scheduling
TaskCreationOptions.RunContinuationsAsynchronously // Run continuations asynchronously
```

## Code Examples

### Basic Usage of Task Class

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

public class TaskBasicsDemo
{
    // Create and run simple tasks
    public async Task BasicTaskExampleAsync()
    {
        Console.WriteLine("=== Basic Task Example ===");

        // Create a task without return value
        Task task = Task.Run(() =>
        {
            Console.WriteLine($"Task running on thread {Thread.CurrentThread.ManagedThreadId}");
            Thread.Sleep(1000);
            Console.WriteLine("Task completed");
        });

        Console.WriteLine($"Main thread {Thread.CurrentThread.ManagedThreadId} continues execution");
        await task;
        Console.WriteLine("Continue after waiting for task completion");
    }

    // Create a task with return value
    public async Task TaskWithResultExampleAsync()
    {
        Console.WriteLine("\n=== Task<T> Example ===");

        Task<int> calculateTask = Task.Run(() =>
        {
            int sum = 0;
            for (int i = 1; i <= 100; i++)
            {
                sum += i;
            }
            return sum;
        });

        Console.WriteLine("Calculating...");
        int result = await calculateTask;
        Console.WriteLine($"Sum of 1 to 100: {result}");
    }

    // Task status monitoring
    public async Task TaskStatusExampleAsync()
    {
        Console.WriteLine("\n=== Task Status Example ===");

        Task task = Task.Run(async () =>
        {
            await Task.Delay(2000);
        });

        while (!task.IsCompleted)
        {
            Console.WriteLine($"Task status: {task.Status}");
            await Task.Delay(500);
        }

        Console.WriteLine($"Final status: {task.Status}");
    }
}
```

### Task&lt;T&gt; Detailed Explanation

```csharp
public class TaskOfTDemo
{
    // Fetch data asynchronously
    public Task<string> FetchDataAsync(string url)
    {
        return Task.Run(() =>
        {
            // Simulate network request
            Thread.Sleep(1000);
            return $"Data from {url}";
        });
    }

    // Asynchronous calculation
    public Task<double> CalculatePiAsync(int iterations)
    {
        return Task.Run(() =>
        {
            // Calculate PI using Leibniz formula
            double pi = 0;
            for (int i = 0; i < iterations; i++)
            {
                pi += (i % 2 == 0 ? 1.0 : -1.0) / (2 * i + 1);
            }
            return pi * 4;
        });
    }

    // Chained task processing
    public async Task ChainedTasksExampleAsync()
    {
        string data = await FetchDataAsync("https://api.example.com")
            .ContinueWith(t => t.Result.ToUpper())
            .ContinueWith(t => $"Processed: {t.Result}");

        Console.WriteLine(data);
    }

    // Generic task factory method
    public Task<T> CreateDelayedResultAsync<T>(T value, int delayMs)
    {
        return Task.Run(async () =>
        {
            await Task.Delay(delayMs);
            return value;
        });
    }

    public async Task DemoAsync()
    {
        var intResult = await CreateDelayedResultAsync(42, 500);
        var stringResult = await CreateDelayedResultAsync("Hello", 500);

        Console.WriteLine($"Integer result: {intResult}");
        Console.WriteLine($"String result: {stringResult}");
    }
}
```

### Deep Dive into Task.Run

```csharp
public class TaskRunDemo
{
    // Basic usage
    public async Task BasicRunAsync()
    {
        // Action delegate
        await Task.Run(() => Console.WriteLine("Task without return value"));

        // Func<TResult> delegate
        int result = await Task.Run(() => 42);
        Console.WriteLine($"Result: {result}");

        // Func<Task> delegate - supports internal async
        await Task.Run(async () =>
        {
            await Task.Delay(100);
            Console.WriteLine("Async task completed");
        });

        // Func<Task<TResult>> delegate
        string data = await Task.Run(async () =>
        {
            await Task.Delay(100);
            return "Async result";
        });
        Console.WriteLine($"Data: {data}");
    }

    // Move CPU-intensive work to thread pool
    public async Task CpuBoundWorkAsync()
    {
        Console.WriteLine($"UI thread: {Thread.CurrentThread.ManagedThreadId}");

        // Execute CPU-intensive calculation on thread pool
        var result = await Task.Run(() =>
        {
            Console.WriteLine($"Calculation thread: {Thread.CurrentThread.ManagedThreadId}");

            // Simulate CPU-intensive work
            double sum = 0;
            for (int i = 0; i < 10_000_000; i++)
            {
                sum += Math.Sqrt(i);
            }
            return sum;
        });

        Console.WriteLine($"Result: {result}");
        Console.WriteLine($"Back to UI thread: {Thread.CurrentThread.ManagedThreadId}");
    }

    // Task.Run with cancellation token
    public async Task CancellableRunAsync()
    {
        using var cts = new CancellationTokenSource();

        // Cancel after 3 seconds
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        try
        {
            await Task.Run(() =>
            {
                for (int i = 0; i < 10; i++)
                {
                    cts.Token.ThrowIfCancellationRequested();
                    Console.WriteLine($"Processing item {i}");
                    Thread.Sleep(1000);
                }
            }, cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Task was canceled");
        }
    }

    // Avoid using async void in Task.Run
    public async Task AvoidAsyncVoidInTaskRunAsync()
    {
        // ❌ Wrong: async void cannot be awaited
        // await Task.Run(async void () => { await Task.Delay(100); });

        // ✅ Correct: use async Task
        await Task.Run(async () =>
        {
            await Task.Delay(100);
        });
    }
}
```

### Task.WhenAll Usage

```csharp
public class WhenAllDemo
{
    private readonly HttpClient _httpClient = new HttpClient();

    // Basic usage - wait for all tasks to complete
    public async Task BasicWhenAllAsync()
    {
        Console.WriteLine("=== Task.WhenAll Basic Usage ===");

        Task task1 = Task.Delay(1000);
        Task task2 = Task.Delay(2000);
        Task task3 = Task.Delay(1500);

        var sw = System.Diagnostics.Stopwatch.StartNew();

        // Wait for all tasks to complete
        await Task.WhenAll(task1, task2, task3);

        sw.Stop();
        Console.WriteLine($"All tasks completed, elapsed: {sw.ElapsedMilliseconds}ms");
        // About 2000ms (time of the longest task)
    }

    // Get all results
    public async Task<int[]> WhenAllWithResultsAsync()
    {
        Task<int> task1 = Task.Run(() => { Thread.Sleep(100); return 1; });
        Task<int> task2 = Task.Run(() => { Thread.Sleep(200); return 2; });
        Task<int> task3 = Task.Run(() => { Thread.Sleep(150); return 3; });

        // WhenAll returns result array in the same order as input
        int[] results = await Task.WhenAll(task1, task2, task3);

        Console.WriteLine($"Results: [{string.Join(", ", results)}]");
        return results;
    }

    // Concurrent download of multiple URLs
    public async Task<string[]> DownloadMultipleUrlsAsync(string[] urls)
    {
        var tasks = urls.Select(url => DownloadStringAsync(url));

        // Execute all downloads concurrently
        string[] contents = await Task.WhenAll(tasks);

        return contents;
    }

    private async Task<string> DownloadStringAsync(string url)
    {
        Console.WriteLine($"Starting download: {url}");
        await Task.Delay(500); // Simulate network latency
        return $"Content from {url}";
    }

    // Handle partial failures
    public async Task WhenAllWithExceptionHandlingAsync()
    {
        var tasks = new[]
        {
            Task.FromResult("Success1"),
            Task.FromException<string>(new InvalidOperationException("Error1")),
            Task.FromResult("Success2"),
            Task.FromException<string>(new ArgumentException("Error2"))
        };

        Task<string[]> allTasks = Task.WhenAll(tasks);

        try
        {
            string[] results = await allTasks;
        }
        catch (Exception ex)
        {
            // Only catches the first exception
            Console.WriteLine($"Caught exception: {ex.Message}");

            // Get all exceptions through allTasks.Exception
            if (allTasks.Exception != null)
            {
                Console.WriteLine("All exceptions:");
                foreach (var innerEx in allTasks.Exception.InnerExceptions)
                {
                    Console.WriteLine($"  - {innerEx.GetType().Name}: {innerEx.Message}");
                }
            }
        }
    }

    // Use WhenAll to implement concurrency limiting
    public async Task WhenAllWithConcurrencyLimitAsync()
    {
        string[] urls = Enumerable.Range(1, 20).Select(i => $"url{i}").ToArray();
        int batchSize = 5;

        var allResults = new List<string>();

        // Process in batches
        for (int i = 0; i < urls.Length; i += batchSize)
        {
            var batch = urls.Skip(i).Take(batchSize);
            var tasks = batch.Select(url => DownloadStringAsync(url));

            string[] batchResults = await Task.WhenAll(tasks);
            allResults.AddRange(batchResults);

            Console.WriteLine($"Completed batch {i / batchSize + 1}");
        }

        Console.WriteLine($"Total downloaded: {allResults.Count}");
    }

    // WhenAll with timeout
    public async Task<string[]?> WhenAllWithTimeoutAsync(string[] urls, TimeSpan timeout)
    {
        var downloadTask = Task.WhenAll(urls.Select(url => DownloadStringAsync(url)));
        var timeoutTask = Task.Delay(timeout);

        Task completedTask = await Task.WhenAny(downloadTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            Console.WriteLine("Download timeout");
            return null;
        }

        return await downloadTask;
    }
}
```

### Task.WhenAny Usage

```csharp
public class WhenAnyDemo
{
    // Basic usage - returns the first completed task
    public async Task BasicWhenAnyAsync()
    {
        Console.WriteLine("=== Task.WhenAny Basic Usage ===");

        Task<string> task1 = SimulateWorkAsync("Task1", 2000);
        Task<string> task2 = SimulateWorkAsync("Task2", 1000);
        Task<string> task3 = SimulateWorkAsync("Task3", 1500);

        // Returns the first completed task
        Task<string> firstCompleted = await Task.WhenAny(task1, task2, task3);
        string result = await firstCompleted;

        Console.WriteLine($"First completed: {result}");
    }

    private async Task<string> SimulateWorkAsync(string name, int delayMs)
    {
        await Task.Delay(delayMs);
        return $"{name} (took {delayMs}ms)";
    }

    // Implement request timeout
    public async Task<string?> FetchWithTimeoutAsync(string url, TimeSpan timeout)
    {
        Task<string> fetchTask = FetchDataAsync(url);
        Task timeoutTask = Task.Delay(timeout);

        Task completedTask = await Task.WhenAny(fetchTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            Console.WriteLine("Request timeout");
            return null;
        }

        return await fetchTask;
    }

    private async Task<string> FetchDataAsync(string url)
    {
        await Task.Delay(500); // Simulate network request
        return $"Data from {url}";
    }

    // Racing pattern - fetch data from multiple sources, use the fastest
    public async Task<string> FetchFromFastestSourceAsync()
    {
        Task<string> primarySource = FetchFromSourceAsync("Primary Server", 2000);
        Task<string> backupSource = FetchFromSourceAsync("Backup Server", 1500);
        Task<string> cdnSource = FetchFromSourceAsync("CDN", 500);

        // Use the fastest responding source
        Task<string> fastest = await Task.WhenAny(primarySource, backupSource, cdnSource);
        string result = await fastest;

        Console.WriteLine($"Fastest response: {result}");
        return result;
    }

    private async Task<string> FetchFromSourceAsync(string source, int latencyMs)
    {
        await Task.Delay(latencyMs);
        return $"Data from {source}";
    }

    // Process all tasks (even when using WhenAny)
    public async Task ProcessAllWithFirstResultAsync()
    {
        var tasks = new List<Task<int>>
        {
            ComputeAsync("ComputeA", 1000),
            ComputeAsync("ComputeB", 500),
            ComputeAsync("ComputeC", 1500)
        };

        var allTasks = new List<Task<int>>(tasks);

        while (tasks.Count > 0)
        {
            Task<int> completed = await Task.WhenAny(tasks);
            tasks.Remove(completed);

            try
            {
                int result = await completed;
                Console.WriteLine($"Completed result: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Task failed: {ex.Message}");
            }
        }

        Console.WriteLine("All tasks processed");
    }

    private async Task<int> ComputeAsync(string name, int delayMs)
    {
        await Task.Delay(delayMs);
        return delayMs;
    }

    // Cancel uncompleted tasks
    public async Task WhenAnyWithCancellationAsync()
    {
        using var cts = new CancellationTokenSource();

        Task<string> task1 = LongRunningTaskAsync("Task1", 5000, cts.Token);
        Task<string> task2 = LongRunningTaskAsync("Task2", 2000, cts.Token);
        Task<string> task3 = LongRunningTaskAsync("Task3", 3000, cts.Token);

        // Wait for the first to complete
        Task<string> first = await Task.WhenAny(task1, task2, task3);

        // Cancel other tasks
        cts.Cancel();

        string result = await first;
        Console.WriteLine($"First completed: {result}");

        // Wait for other tasks to handle cancellation
        await Task.WhenAll(
            HandleCancellationAsync(task1),
            HandleCancellationAsync(task2),
            HandleCancellationAsync(task3)
        );
    }

    private async Task<string> LongRunningTaskAsync(string name, int delayMs, CancellationToken ct)
    {
        try
        {
            await Task.Delay(delayMs, ct);
            return $"{name} completed";
        }
        catch (OperationCanceledException)
        {
            return $"{name} was canceled";
        }
    }

    private async Task HandleCancellationAsync(Task<string> task)
    {
        try
        {
            await task;
        }
        catch (OperationCanceledException)
        {
            // Ignore cancellation exception
        }
    }
}
```

### Task Continuations

```csharp
public class ContinuationDemo
{
    // Basic continuation
    public async Task BasicContinuationAsync()
    {
        Console.WriteLine("=== Basic Continuation ===");

        Task<int> originalTask = Task.Run(() =>
        {
            Console.WriteLine("Original task executing");
            return 42;
        });

        // ContinueWith creates a continuation task
        Task<string> continuationTask = originalTask.ContinueWith(
            antecedent => $"Result is: {antecedent.Result}"
        );

        string result = await continuationTask;
        Console.WriteLine(result);
    }

    // Chained continuations
    public async Task ChainedContinuationsAsync()
    {
        Console.WriteLine("\n=== Chained Continuations ===");

        var result = await Task.Run(() => 1)
            .ContinueWith(t => t.Result + 1)
            .ContinueWith(t => t.Result * 2)
            .ContinueWith(t => $"Final result: {t.Result}");

        Console.WriteLine(result); // Final result: 4
    }

    // Conditional continuations
    public async Task ConditionalContinuationsAsync()
    {
        Console.WriteLine("\n=== Conditional Continuations ===");

        Task<int> task = Task.Run(() =>
        {
            if (DateTime.Now.Millisecond % 2 == 0)
                return 100;
            else
                throw new InvalidOperationException("Simulated error");
        });

        // Execute only on success
        task.ContinueWith(
            t => Console.WriteLine($"Success: {t.Result}"),
            TaskContinuationOptions.OnlyOnRanToCompletion
        );

        // Execute only on failure
        task.ContinueWith(
            t => Console.WriteLine($"Failed: {t.Exception?.GetBaseException().Message}"),
            TaskContinuationOptions.OnlyOnFaulted
        );

        // Execute only on cancellation
        task.ContinueWith(
            t => Console.WriteLine("Task was canceled"),
            TaskContinuationOptions.OnlyOnCanceled
        );

        try
        {
            await task;
        }
        catch
        {
            // Exception already handled in continuation
        }

        await Task.Delay(100); // Wait for continuation to execute
    }

    // TaskContinuationOptions explained
    public async Task ContinuationOptionsExampleAsync()
    {
        Console.WriteLine("\n=== Continuation Options ===");

        Task originalTask = Task.Delay(100);

        // Common options
        await originalTask.ContinueWith(
            _ => Console.WriteLine("Execute in sync context"),
            TaskContinuationOptions.ExecuteSynchronously
        );

        await Task.Run(() => 1).ContinueWith(
            t => Console.WriteLine($"Not attached to parent: {t.Result}"),
            TaskContinuationOptions.DenyChildAttach
        );
    }

    // Use async/await instead of ContinueWith (recommended)
    public async Task ModernContinuationStyleAsync()
    {
        Console.WriteLine("\n=== Modern Continuation Style ===");

        // ❌ Old ContinueWith style
        /*
        var result = await Task.Run(() => FetchData())
            .ContinueWith(t => ProcessData(t.Result))
            .ContinueWith(t => SaveData(t.Result));
        */

        // ✅ Recommended async/await style
        var data = await Task.Run(() => FetchData());
        var processedData = ProcessData(data);
        await SaveData(processedData);
    }

    private string FetchData() => "raw data";
    private string ProcessData(string data) => data.ToUpper();
    private Task SaveData(string data)
    {
        Console.WriteLine($"Saving: {data}");
        return Task.CompletedTask;
    }

    // Exception propagation in continuations
    public async Task ExceptionPropagationAsync()
    {
        Console.WriteLine("\n=== Exception Propagation ===");

        Task task = Task.Run(() =>
        {
            throw new InvalidOperationException("Original exception");
        });

        try
        {
            // Accessing Result in continuation throws AggregateException
            await task.ContinueWith(t =>
            {
                // Safety check
                if (t.IsFaulted)
                {
                    Console.WriteLine($"Antecedent task failed: {t.Exception?.GetBaseException().Message}");
                    return;
                }
                Console.WriteLine("Antecedent task succeeded");
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Continuation exception: {ex.Message}");
        }
    }

    // Unwrap - unwrap nested Task
    public async Task UnwrapExampleAsync()
    {
        Console.WriteLine("\n=== Unwrap Example ===");

        // Without Unwrap - get Task<Task<int>>
        Task<Task<int>> nestedTask = Task.Run(() =>
        {
            return Task.Run(() => 42);
        });

        // Use Unwrap to unwrap
        Task<int> unwrappedTask = nestedTask.Unwrap();
        int result = await unwrappedTask;
        Console.WriteLine($"Unwrapped result: {result}");

        // Task.Run automatically handles this case
        int autoUnwrapped = await Task.Run(async () =>
        {
            await Task.Delay(100);
            return 42;
        });
        Console.WriteLine($"Auto unwrapped: {autoUnwrapped}");
    }
}
```

## Best Practices

### Prefer async/await Over ContinueWith

```csharp
// ❌ Not recommended: using ContinueWith
public Task<string> ProcessDataOldWayAsync()
{
    return FetchDataAsync()
        .ContinueWith(t => Transform(t.Result))
        .ContinueWith(t => Format(t.Result));
}

// ✅ Recommended: using async/await
public async Task<string> ProcessDataAsync()
{
    var data = await FetchDataAsync();
    var transformed = Transform(data);
    return Format(transformed);
}
```

### Choose Correctly Between Task.Run and Task.Factory.StartNew

```csharp
// ✅ Use Task.Run for most cases
await Task.Run(() => CpuBoundWork());

// ✅ Use LongRunning for long-running tasks
await Task.Factory.StartNew(
    () => LongRunningBlockingOperation(),
    TaskCreationOptions.LongRunning
);

// ❌ Don't use Task.Run for I/O operations
// await Task.Run(() => file.ReadAsync(...)); // Wastes threads
// ✅ Directly await async I/O
await file.ReadAsync(...);
```

### Handle Cancellation Correctly

```csharp
public async Task<string> ProcessWithCancellationAsync(CancellationToken ct)
{
    // Check at the start
    ct.ThrowIfCancellationRequested();

    // Pass to Task.Run
    var result = await Task.Run(() =>
    {
        for (int i = 0; i < 100; i++)
        {
            ct.ThrowIfCancellationRequested();
            DoWork(i);
        }
        return "Completed";
    }, ct);

    return result;
}
```

### Avoid Blocking Calls

```csharp
// ❌ Deadlock risk: blocking wait in synchronization context
public string GetDataBadWay()
{
    return GetDataAsync().Result; // May deadlock!
}

// ❌ Same problem
public void ProcessBadWay()
{
    GetDataAsync().Wait(); // May deadlock!
}

// ✅ Correct way: use async/await
public async Task<string> GetDataGoodWayAsync()
{
    return await GetDataAsync();
}

// ✅ If synchronous call is necessary (try to avoid)
public string GetDataSyncWay()
{
    return Task.Run(() => GetDataAsync()).GetAwaiter().GetResult();
}
```

### Use ConfigureAwait Appropriately

```csharp
// Use ConfigureAwait(false) in library code
public async Task<string> LibraryMethodAsync()
{
    var data = await FetchAsync().ConfigureAwait(false);
    return await ProcessAsync(data).ConfigureAwait(false);
}

// Don't use (or use true) in UI code
public async Task UIMethodAsync()
{
    var data = await FetchAsync(); // Default ConfigureAwait(true)
    UpdateUI(data); // Needs to run on UI thread
}
```

### Handle Exceptions in WhenAll Correctly

```csharp
public async Task ProcessAllWithProperErrorHandlingAsync()
{
    var tasks = new[]
    {
        ProcessItemAsync(1),
        ProcessItemAsync(2),
        ProcessItemAsync(3)
    };

    // Save WhenAll task to check all exceptions
    Task whenAllTask = Task.WhenAll(tasks);

    try
    {
        await whenAllTask;
    }
    catch
    {
        // Get all exceptions
        if (whenAllTask.Exception != null)
        {
            foreach (var ex in whenAllTask.Exception.InnerExceptions)
            {
                Console.WriteLine($"Exception: {ex.Message}");
            }
        }
        throw; // Or handle appropriately
    }
}
```

## Common Pitfalls

### Forgetting to await

```csharp
// ❌ Forgot to await, task is not waited
public async Task ForgetToAwaitAsync()
{
    Task.Delay(1000); // Warning: unawaited task
    Console.WriteLine("This prints immediately!");
}

// ✅ Correct await
public async Task CorrectAwaitAsync()
{
    await Task.Delay(1000);
    Console.WriteLine("Prints after 1 second");
}
```

### Creating Unawaited Tasks in Loops

```csharp
// ❌ Tasks are not collected and awaited
public async Task BadLoopAsync()
{
    foreach (var item in items)
    {
        ProcessItemAsync(item); // Not awaited!
    }
    Console.WriteLine("May print before processing completes");
}

// ✅ Collect and await all tasks
public async Task GoodLoopAsync()
{
    var tasks = items.Select(item => ProcessItemAsync(item));
    await Task.WhenAll(tasks);
    Console.WriteLine("Prints after all processing completes");
}
```

### async void Causes Lost Exceptions

```csharp
// ❌ Exceptions in async void cannot be caught
public async void FireAndForgetBadAsync()
{
    await Task.Delay(100);
    throw new InvalidOperationException("This exception will crash the app!");
}

// ✅ Use async Task and handle exceptions
public async Task FireAndForgetGoodAsync()
{
    try
    {
        await Task.Delay(100);
        throw new InvalidOperationException("Can be caught");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Caught: {ex.Message}");
    }
}
```

### Task.Result and Task.Wait() Cause Deadlocks

```csharp
// ❌ Will deadlock in UI thread or ASP.NET synchronization context
public string DeadlockExample()
{
    return GetDataAsync().Result; // Deadlock!
}

// Explanation:
// 1. GetDataAsync starts executing, needs to return to original context after await
// 2. .Result blocks the original context
// 3. await can never continue because context is blocked
// 4. Deadlock!
```

### Using await in finally

```csharp
// ❌ Not supported in C# 5.0, supported in C# 6.0+ but be careful
public async Task FinallyAwaitIssueAsync()
{
    try
    {
        await DoWorkAsync();
    }
    finally
    {
        // Supported in C# 6.0+
        await CleanupAsync();
        // Note: If there's an exception in try, finally exception will override it
    }
}

// ✅ Safer pattern
public async Task SafeFinallyAsync()
{
    Exception? originalException = null;
    try
    {
        await DoWorkAsync();
    }
    catch (Exception ex)
    {
        originalException = ex;
        throw;
    }
    finally
    {
        try
        {
            await CleanupAsync();
        }
        catch (Exception cleanupEx)
        {
            if (originalException != null)
            {
                // Log cleanup exception but throw original exception
                Console.WriteLine($"Cleanup failed: {cleanupEx.Message}");
            }
            else
            {
                throw;
            }
        }
    }
}
```

### Misunderstanding Task.WhenAny

```csharp
// ❌ Wrong: thinking WhenAny will cancel other tasks
public async Task WhenAnyMisunderstandingAsync()
{
    Task task1 = LongRunningAsync();
    Task task2 = LongRunningAsync();

    await Task.WhenAny(task1, task2);
    // task1 and task2 are still running!
}

// ✅ Correct: manually cancel other tasks
public async Task WhenAnyCorrectAsync()
{
    using var cts = new CancellationTokenSource();

    Task task1 = LongRunningAsync(cts.Token);
    Task task2 = LongRunningAsync(cts.Token);

    await Task.WhenAny(task1, task2);
    cts.Cancel(); // Cancel other tasks

    // Wait for tasks to respond to cancellation
    await Task.WhenAll(
        task1.ContinueWith(_ => { }),
        task2.ContinueWith(_ => { })
    );
}
```

## Performance Considerations

### Task Creation Overhead

```csharp
// Task is allocated on the heap, has some overhead
public async Task TaskAllocationOverheadAsync()
{
    // Creates new Task object on each call
    for (int i = 0; i < 10000; i++)
    {
        await Task.Run(() => { }); // Not recommended: many small tasks
    }

    // ✅ Better: batch processing
    await Task.Run(() =>
    {
        for (int i = 0; i < 10000; i++)
        {
            // Process
        }
    });
}
```

### ValueTask Optimization

```csharp
// Use ValueTask to reduce heap allocations
public ValueTask<int> GetCachedDataAsync(int key)
{
    if (_cache.TryGetValue(key, out int cachedValue))
    {
        // Synchronous path: no Task allocation
        return new ValueTask<int>(cachedValue);
    }

    // Asynchronous path
    return new ValueTask<int>(FetchFromDatabaseAsync(key));
}

// Note: ValueTask cannot be awaited multiple times
public async Task UseValueTaskAsync()
{
    ValueTask<int> vt = GetCachedDataAsync(1);
    int result = await vt;
    // int result2 = await vt; // ❌ Error!
}
```

### Thread Pool Considerations

```csharp
// Thread pool has minimum threads, exceeding will cause creation delay
public async Task ThreadPoolConsiderationsAsync()
{
    // View thread pool info
    ThreadPool.GetMinThreads(out int workerMin, out int ioMin);
    ThreadPool.GetMaxThreads(out int workerMax, out int ioMax);
    Console.WriteLine($"Worker threads: {workerMin}-{workerMax}");
    Console.WriteLine($"IO threads: {ioMin}-{ioMax}");

    // Can adjust minimum threads (use with caution)
    // ThreadPool.SetMinThreads(100, 100);
}
```

### Concurrency Control

```csharp
// Use SemaphoreSlim to control concurrency
public async Task ControlledConcurrencyAsync()
{
    var semaphore = new SemaphoreSlim(10); // Max 10 concurrent
    var tasks = Enumerable.Range(0, 100).Select(async i =>
    {
        await semaphore.WaitAsync();
        try
        {
            await ProcessAsync(i);
        }
        finally
        {
            semaphore.Release();
        }
    });

    await Task.WhenAll(tasks);
}
```

### Performance Measurement

```csharp
public async Task MeasurePerformanceAsync()
{
    var sw = System.Diagnostics.Stopwatch.StartNew();

    // Sequential execution
    for (int i = 0; i < 10; i++)
    {
        await Task.Delay(100);
    }
    Console.WriteLine($"Sequential execution: {sw.ElapsedMilliseconds}ms"); // ~1000ms

    sw.Restart();

    // Parallel execution
    var tasks = Enumerable.Range(0, 10).Select(_ => Task.Delay(100));
    await Task.WhenAll(tasks);
    Console.WriteLine($"Parallel execution: {sw.ElapsedMilliseconds}ms"); // ~100ms
}
```

## Real-World Scenarios

### Scenario 1: Concurrent API Requests

```csharp
public class ApiAggregator
{
    private readonly HttpClient _httpClient = new();

    public async Task<DashboardData> GetDashboardDataAsync()
    {
        // Concurrently fetch all needed data
        var userTask = GetUserAsync();
        var ordersTask = GetOrdersAsync();
        var statsTask = GetStatsAsync();
        var notificationsTask = GetNotificationsAsync();

        // Wait for all to complete
        await Task.WhenAll(userTask, ordersTask, statsTask, notificationsTask);

        return new DashboardData
        {
            User = await userTask,
            Orders = await ordersTask,
            Stats = await statsTask,
            Notifications = await notificationsTask
        };
    }

    private async Task<User> GetUserAsync()
    {
        var response = await _httpClient.GetStringAsync("/api/user");
        return JsonSerializer.Deserialize<User>(response)!;
    }

    private async Task<List<Order>> GetOrdersAsync()
    {
        var response = await _httpClient.GetStringAsync("/api/orders");
        return JsonSerializer.Deserialize<List<Order>>(response)!;
    }

    private async Task<Stats> GetStatsAsync()
    {
        var response = await _httpClient.GetStringAsync("/api/stats");
        return JsonSerializer.Deserialize<Stats>(response)!;
    }

    private async Task<List<Notification>> GetNotificationsAsync()
    {
        var response = await _httpClient.GetStringAsync("/api/notifications");
        return JsonSerializer.Deserialize<List<Notification>>(response)!;
    }
}
```

### Scenario 2: Request with Retry

```csharp
public class RetryableClient
{
    public async Task<T> ExecuteWithRetryAsync<T>(
        Func<Task<T>> operation,
        int maxRetries = 3,
        TimeSpan? baseDelay = null)
    {
        baseDelay ??= TimeSpan.FromSeconds(1);

        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await operation();
            }
            catch (Exception ex) when (attempt < maxRetries && IsTransient(ex))
            {
                var delay = TimeSpan.FromMilliseconds(
                    baseDelay.Value.TotalMilliseconds * Math.Pow(2, attempt)
                );
                Console.WriteLine($"Attempt {attempt + 1} failed, retrying in {delay.TotalSeconds} seconds...");
                await Task.Delay(delay);
            }
        }

        throw new Exception($"Operation failed after {maxRetries} retries");
    }

    private bool IsTransient(Exception ex)
    {
        return ex is HttpRequestException ||
               ex is TimeoutException ||
               ex is TaskCanceledException;
    }
}
```

### Scenario 3: Producer-Consumer Pattern

```csharp
public class ProducerConsumer
{
    private readonly Channel<WorkItem> _channel;

    public ProducerConsumer(int capacity = 100)
    {
        _channel = Channel.CreateBounded<WorkItem>(capacity);
    }

    public async Task ProduceAsync(IEnumerable<WorkItem> items, CancellationToken ct)
    {
        foreach (var item in items)
        {
            await _channel.Writer.WriteAsync(item, ct);
            Console.WriteLine($"Produced: {item.Id}");
        }
        _channel.Writer.Complete();
    }

    public async Task ConsumeAsync(int consumerCount, CancellationToken ct)
    {
        var consumers = Enumerable.Range(0, consumerCount)
            .Select(id => ConsumeInternalAsync(id, ct));

        await Task.WhenAll(consumers);
    }

    private async Task ConsumeInternalAsync(int consumerId, CancellationToken ct)
    {
        await foreach (var item in _channel.Reader.ReadAllAsync(ct))
        {
            Console.WriteLine($"Consumer{consumerId} processing: {item.Id}");
            await ProcessItemAsync(item);
        }
    }

    private async Task ProcessItemAsync(WorkItem item)
    {
        await Task.Delay(100); // Simulate processing
    }
}

public record WorkItem(int Id, string Data);
```

### Scenario 4: Timeout Control

```csharp
public class TimeoutHandler
{
    public async Task<T?> ExecuteWithTimeoutAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        TimeSpan timeout,
        T? defaultValue = default)
    {
        using var cts = new CancellationTokenSource();
        cts.CancelAfter(timeout);

        try
        {
            return await operation(cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Operation timed out");
            return defaultValue;
        }
    }

    // Implement timeout using WhenAny
    public async Task<T?> ExecuteWithTimeoutUsingWhenAnyAsync<T>(
        Func<Task<T>> operation,
        TimeSpan timeout)
    {
        var operationTask = operation();
        var timeoutTask = Task.Delay(timeout);

        var completedTask = await Task.WhenAny(operationTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            Console.WriteLine("Operation timed out");
            return default;
        }

        return await operationTask;
    }
}
```

### Scenario 5: Batch Processing

```csharp
public class BatchProcessor
{
    public async Task<List<TResult>> ProcessInBatchesAsync<TItem, TResult>(
        IEnumerable<TItem> items,
        Func<TItem, Task<TResult>> processor,
        int batchSize = 10)
    {
        var results = new List<TResult>();
        var itemList = items.ToList();

        for (int i = 0; i < itemList.Count; i += batchSize)
        {
            var batch = itemList.Skip(i).Take(batchSize);
            var batchTasks = batch.Select(processor);
            var batchResults = await Task.WhenAll(batchTasks);

            results.AddRange(batchResults);

            Console.WriteLine($"Processed {Math.Min(i + batchSize, itemList.Count)}/{itemList.Count}");
        }

        return results;
    }

    // Batch processing with progress reporting
    public async Task ProcessWithProgressAsync<T>(
        IEnumerable<T> items,
        Func<T, Task> processor,
        IProgress<int>? progress = null)
    {
        var itemList = items.ToList();
        int completed = 0;

        var tasks = itemList.Select(async item =>
        {
            await processor(item);
            int current = Interlocked.Increment(ref completed);
            progress?.Report(current * 100 / itemList.Count);
        });

        await Task.WhenAll(tasks);
    }
}
```

## Interview Key Points

### Common Interview Questions

#### What is the difference between Task and Thread?

```csharp
// Thread: directly represents an OS thread
Thread thread = new Thread(() => Console.WriteLine("Thread"));
thread.Start();

// Task: represents an asynchronous operation, may run on thread pool threads
Task task = Task.Run(() => Console.WriteLine("Task"));
```

**Key Points:**
- Thread is a direct abstraction of OS threads, expensive to create
- Task is an abstraction of asynchronous operations, typically runs on thread pool
- Task supports composition, continuation, cancellation, and other advanced features
- Task is the recommended way for modern .NET asynchronous programming

#### What is the difference between Task.Run and Task.Factory.StartNew?

```csharp
// Task.Run is a simplified version
await Task.Run(() => DoWork());

// Task.Factory.StartNew is more flexible
await Task.Factory.StartNew(
    () => DoWork(),
    CancellationToken.None,
    TaskCreationOptions.LongRunning,
    TaskScheduler.Default
);
```

**Key Points:**
- Task.Run is a simplified wrapper of Task.Factory.StartNew
- Task.Run uses DenyChildAttach option by default
- Task.Factory.StartNew can specify LongRunning and other options
- Task.Run automatically unwraps returned Tasks

#### When to use WhenAll vs WhenAny?

```csharp
// WhenAll: need all operations to complete
var allData = await Task.WhenAll(
    FetchUserAsync(),
    FetchOrdersAsync(),
    FetchStatsAsync()
);

// WhenAny: only need the first to complete (timeout, racing)
var firstCompleted = await Task.WhenAny(
    FetchFromPrimaryAsync(),
    FetchFromBackupAsync()
);
```

**Key Points:**
- WhenAll is for aggregating results from multiple independent operations
- WhenAny is for timeout control or racing scenarios
- WhenAll waits for all tasks to complete before returning
- WhenAny returns the first completed task (does not cancel other tasks)

#### How to properly handle exceptions in Tasks?

```csharp
// Single task
try
{
    await SomeTaskAsync();
}
catch (SpecificException ex)
{
    // Handle specific exception
}

// Multiple tasks
Task allTasks = Task.WhenAll(task1, task2, task3);
try
{
    await allTasks;
}
catch
{
    // Get all exceptions through Exception property
    foreach (var ex in allTasks.Exception.InnerExceptions)
    {
        Console.WriteLine(ex.Message);
    }
}
```

#### What is the difference between ContinueWith and await?

```csharp
// ContinueWith: returns wrapped task
Task<string> result = task.ContinueWith(t => t.Result.ToString());

// await: compiler generates state machine
string result = await task;
var final = result.ToString();
```

**Key Points:**
- await is more intuitive, better code readability
- ContinueWith requires manual exception and cancellation handling
- await captures synchronization context (by default)
- ContinueWith can specify TaskContinuationOptions

#### Explain the purpose of ConfigureAwait(false)

```csharp
// Does not capture synchronization context
await SomeAsync().ConfigureAwait(false);
```

**Key Points:**
- Does not capture and restore synchronization context
- Using in library code can improve performance
- Avoid using in UI code (needs to return to UI thread)
- Can avoid certain deadlock scenarios

### Coding Questions

**Implement a batch processing method with concurrency limit:**

```csharp
public async Task<TResult[]> ProcessWithConcurrencyLimitAsync<TItem, TResult>(
    IEnumerable<TItem> items,
    Func<TItem, Task<TResult>> processor,
    int maxConcurrency)
{
    var semaphore = new SemaphoreSlim(maxConcurrency);
    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync();
        try
        {
            return await processor(item);
        }
        finally
        {
            semaphore.Release();
        }
    });

    return await Task.WhenAll(tasks);
}
```

## Further Reading

### Official Documentation
- [Task Class - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.task)
- [Task-based Asynchronous Pattern (TAP)](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
- [Task Parallel Library (TPL)](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl)

### Recommended Books
- "C# in Depth" - Jon Skeet
- "Concurrency in C# Cookbook" - Stephen Cleary
- "Pro .NET Performance" - Sasha Goldshtein

### Quality Articles
- [Async/Await - Best Practices in Asynchronous Programming](https://docs.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming)
- [ConfigureAwait FAQ](https://devblogs.microsoft.com/dotnet/configureawait-faq/)
- [Task.Run vs Task.Factory.StartNew](https://devblogs.microsoft.com/pfxteam/task-run-vs-task-factory-startnew/)

### Related Topics
- [C# async/await Deep Dive](/csharp/async)
- [Parallel Programming and PLINQ](/csharp/parallel-programming)
- [Synchronization Primitives](/csharp/synchronization-primitives)
- [Channel Producer-Consumer Pattern](/csharp/channels)
