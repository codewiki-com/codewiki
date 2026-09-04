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
origin: old/src/content/docs/csharp/task-basics.zh.md
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

## 概念解释

### 什么是 Task

`Task` 是 .NET Framework 4.0 引入的核心类型，代表一个异步操作。它是 Task Parallel Library (TPL) 的基础组件，为 .NET 提供了统一的异步编程模型。

```csharp
// Task 表示一个不返回值的异步操作
Task task = Task.Run(() => Console.WriteLine("Hello, Task!"));

// Task<TResult> 表示一个返回值的异步操作
Task<int> taskWithResult = Task.Run(() => 42);
```

### Task 的历史演进

在 Task 出现之前，.NET 的异步编程经历了几个阶段：

1. **APM (Asynchronous Programming Model)**：基于 `BeginXxx` / `EndXxx` 方法对
2. **EAP (Event-based Asynchronous Pattern)**：基于事件的异步模式
3. **TAP (Task-based Asynchronous Pattern)**：基于 Task 的异步模式（现代标准）

```csharp
// APM 模式（已过时）
IAsyncResult result = stream.BeginRead(buffer, 0, buffer.Length, callback, state);

// EAP 模式（已过时）
webClient.DownloadStringCompleted += (s, e) => { /* 处理结果 */ };
webClient.DownloadStringAsync(uri);

// TAP 模式（推荐）
string content = await httpClient.GetStringAsync(uri);
```

### Task 解决的问题

1. **提高响应性**：允许 UI 线程保持响应，不被长时间操作阻塞
2. **提高吞吐量**：在等待 I/O 操作时释放线程，提高服务器可扩展性
3. **统一异步模型**：提供一致的异步编程接口
4. **简化并发编程**：通过组合器简化多任务协调

## 核心原理

### Task 的内部结构

Task 内部维护了以下关键状态：

```csharp
public class Task
{
    // 简化的内部结构示意
    private volatile int m_stateFlags;           // 状态标志
    private object m_stateObject;                // 状态对象
    private TaskScheduler m_taskScheduler;       // 任务调度器
    private volatile ManualResetEventSlim m_completionEvent; // 完成事件
    private List<TaskContinuation> m_continuationObject;     // 延续任务
}
```

### Task 的状态机

Task 在其生命周期中会经历以下状态：

```
Created → WaitingForActivation → WaitingToRun → Running → RanToCompletion
                                                       ↘ Canceled
                                                       ↘ Faulted
```

```csharp
// 状态检查示例
Task task = Task.Run(async () =>
{
    await Task.Delay(1000);
    return 42;
});

Console.WriteLine($"状态: {task.Status}");          // WaitingForActivation 或 Running
Console.WriteLine($"已完成: {task.IsCompleted}");   // False
Console.WriteLine($"成功完成: {task.IsCompletedSuccessfully}"); // False

await task;

Console.WriteLine($"状态: {task.Status}");          // RanToCompletion
Console.WriteLine($"已完成: {task.IsCompleted}");   // True
Console.WriteLine($"成功完成: {task.IsCompletedSuccessfully}"); // True
```

### TaskScheduler 调度器

TaskScheduler 负责决定 Task 在哪个线程上执行：

```csharp
// 默认调度器 - 使用线程池
TaskScheduler defaultScheduler = TaskScheduler.Default;

// 当前同步上下文调度器 - 用于 UI 线程
TaskScheduler syncContextScheduler = TaskScheduler.FromCurrentSynchronizationContext();

// 自定义调度器示例
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
        return false; // 不支持内联执行
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

### 线程池与 Task 的关系

Task.Run 默认在线程池上执行任务：

```csharp
// 查看线程信息
Task.Run(() =>
{
    Console.WriteLine($"线程ID: {Thread.CurrentThread.ManagedThreadId}");
    Console.WriteLine($"是线程池线程: {Thread.CurrentThread.IsThreadPoolThread}");
    Console.WriteLine($"是后台线程: {Thread.CurrentThread.IsBackground}");
});

// 输出示例：
// 线程ID: 4
// 是线程池线程: True
// 是后台线程: True
```

## 核心要点

### Task 类型对比

| 特性 | Task | Task&lt;TResult&gt; |
|------|------|-------------------|
| 返回值 | 无 | TResult |
| 用途 | 表示无返回值的异步操作 | 表示有返回值的异步操作 |
| 获取结果 | 仅等待完成 | 通过 Result 属性或 await |
| 基类 | 继承自 Object | 继承自 Task |

### 创建 Task 的方式

```csharp
// 1. Task.Run - 最常用，在线程池执行
Task task1 = Task.Run(() => DoWork());
Task<int> task2 = Task.Run(() => Calculate());

// 2. Task.Factory.StartNew - 更多配置选项
Task task3 = Task.Factory.StartNew(
    () => DoWork(),
    CancellationToken.None,
    TaskCreationOptions.LongRunning,  // 提示调度器这是长时间运行的任务
    TaskScheduler.Default
);

// 3. new Task + Start - 延迟启动
Task task4 = new Task(() => DoWork());
// ... 稍后启动
task4.Start();

// 4. Task.FromResult - 创建已完成的任务
Task<int> completedTask = Task.FromResult(42);

// 5. Task.CompletedTask - 创建已完成的无返回值任务
Task completed = Task.CompletedTask;

// 6. Task.FromException - 创建已失败的任务
Task failedTask = Task.FromException(new InvalidOperationException("错误"));

// 7. Task.FromCanceled - 创建已取消的任务
CancellationTokenSource cts = new CancellationTokenSource();
cts.Cancel();
Task canceledTask = Task.FromCanceled(cts.Token);
```

### Task.Run vs Task.Factory.StartNew

```csharp
// Task.Run 是简化版本，等价于：
Task.Factory.StartNew(
    action,
    CancellationToken.None,
    TaskCreationOptions.DenyChildAttach,
    TaskScheduler.Default
);

// Task.Factory.StartNew 提供更多选项
Task.Factory.StartNew(
    () => LongRunningOperation(),
    CancellationToken.None,
    TaskCreationOptions.LongRunning,  // 不使用线程池，创建专用线程
    TaskScheduler.Default
);
```

**何时使用 Task.Factory.StartNew：**
- 需要指定 TaskCreationOptions（如 LongRunning）
- 需要指定自定义 TaskScheduler
- 需要处理父子任务关系

### TaskCreationOptions 选项

```csharp
// 常用选项
TaskCreationOptions.None              // 默认
TaskCreationOptions.LongRunning       // 长时间运行，不使用线程池
TaskCreationOptions.AttachedToParent  // 附加到父任务
TaskCreationOptions.DenyChildAttach   // 禁止子任务附加
TaskCreationOptions.PreferFairness    // 公平调度
TaskCreationOptions.RunContinuationsAsynchronously // 异步运行延续
```

## 代码示例

### Task 类基本用法

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

public class TaskBasicsDemo
{
    // 创建和运行简单任务
    public async Task BasicTaskExampleAsync()
    {
        Console.WriteLine("=== 基本 Task 示例 ===");

        // 创建无返回值的任务
        Task task = Task.Run(() =>
        {
            Console.WriteLine($"任务运行在线程 {Thread.CurrentThread.ManagedThreadId}");
            Thread.Sleep(1000);
            Console.WriteLine("任务完成");
        });

        Console.WriteLine($"主线程 {Thread.CurrentThread.ManagedThreadId} 继续执行");
        await task;
        Console.WriteLine("等待任务完成后继续");
    }

    // 创建返回值的任务
    public async Task TaskWithResultExampleAsync()
    {
        Console.WriteLine("\n=== Task<T> 示例 ===");

        Task<int> calculateTask = Task.Run(() =>
        {
            int sum = 0;
            for (int i = 1; i <= 100; i++)
            {
                sum += i;
            }
            return sum;
        });

        Console.WriteLine("计算中...");
        int result = await calculateTask;
        Console.WriteLine($"1到100的和: {result}");
    }

    // 任务状态监控
    public async Task TaskStatusExampleAsync()
    {
        Console.WriteLine("\n=== 任务状态示例 ===");

        Task task = Task.Run(async () =>
        {
            await Task.Delay(2000);
        });

        while (!task.IsCompleted)
        {
            Console.WriteLine($"任务状态: {task.Status}");
            await Task.Delay(500);
        }

        Console.WriteLine($"最终状态: {task.Status}");
    }
}
```

### Task&lt;T&gt; 详解

```csharp
public class TaskOfTDemo
{
    // 异步获取数据
    public Task<string> FetchDataAsync(string url)
    {
        return Task.Run(() =>
        {
            // 模拟网络请求
            Thread.Sleep(1000);
            return $"数据来自 {url}";
        });
    }

    // 异步计算
    public Task<double> CalculatePiAsync(int iterations)
    {
        return Task.Run(() =>
        {
            // 使用莱布尼茨公式计算 PI
            double pi = 0;
            for (int i = 0; i < iterations; i++)
            {
                pi += (i % 2 == 0 ? 1.0 : -1.0) / (2 * i + 1);
            }
            return pi * 4;
        });
    }

    // 链式任务处理
    public async Task ChainedTasksExampleAsync()
    {
        string data = await FetchDataAsync("https://api.example.com")
            .ContinueWith(t => t.Result.ToUpper())
            .ContinueWith(t => $"处理后: {t.Result}");

        Console.WriteLine(data);
    }

    // 泛型任务工厂方法
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

        Console.WriteLine($"整数结果: {intResult}");
        Console.WriteLine($"字符串结果: {stringResult}");
    }
}
```

### Task.Run 深入使用

```csharp
public class TaskRunDemo
{
    // 基本用法
    public async Task BasicRunAsync()
    {
        // Action 委托
        await Task.Run(() => Console.WriteLine("无返回值任务"));

        // Func<TResult> 委托
        int result = await Task.Run(() => 42);
        Console.WriteLine($"结果: {result}");

        // Func<Task> 委托 - 支持内部 async
        await Task.Run(async () =>
        {
            await Task.Delay(100);
            Console.WriteLine("异步任务完成");
        });

        // Func<Task<TResult>> 委托
        string data = await Task.Run(async () =>
        {
            await Task.Delay(100);
            return "异步结果";
        });
        Console.WriteLine($"数据: {data}");
    }

    // 将 CPU 密集型工作移到线程池
    public async Task CpuBoundWorkAsync()
    {
        Console.WriteLine($"UI 线程: {Thread.CurrentThread.ManagedThreadId}");

        // 在线程池执行 CPU 密集型计算
        var result = await Task.Run(() =>
        {
            Console.WriteLine($"计算线程: {Thread.CurrentThread.ManagedThreadId}");

            // 模拟 CPU 密集型工作
            double sum = 0;
            for (int i = 0; i < 10_000_000; i++)
            {
                sum += Math.Sqrt(i);
            }
            return sum;
        });

        Console.WriteLine($"结果: {result}");
        Console.WriteLine($"返回 UI 线程: {Thread.CurrentThread.ManagedThreadId}");
    }

    // 带取消令牌的 Task.Run
    public async Task CancellableRunAsync()
    {
        using var cts = new CancellationTokenSource();

        // 3秒后取消
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        try
        {
            await Task.Run(() =>
            {
                for (int i = 0; i < 10; i++)
                {
                    cts.Token.ThrowIfCancellationRequested();
                    Console.WriteLine($"处理项 {i}");
                    Thread.Sleep(1000);
                }
            }, cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("任务被取消");
        }
    }

    // 避免在 Task.Run 中使用 async void
    public async Task AvoidAsyncVoidInTaskRunAsync()
    {
        // ❌ 错误：async void 无法被等待
        // await Task.Run(async void () => { await Task.Delay(100); });

        // ✅ 正确：使用 async Task
        await Task.Run(async () =>
        {
            await Task.Delay(100);
        });
    }
}
```

### Task.WhenAll 用法

```csharp
public class WhenAllDemo
{
    private readonly HttpClient _httpClient = new HttpClient();

    // 基本用法 - 等待所有任务完成
    public async Task BasicWhenAllAsync()
    {
        Console.WriteLine("=== Task.WhenAll 基本用法 ===");

        Task task1 = Task.Delay(1000);
        Task task2 = Task.Delay(2000);
        Task task3 = Task.Delay(1500);

        var sw = System.Diagnostics.Stopwatch.StartNew();

        // 等待所有任务完成
        await Task.WhenAll(task1, task2, task3);

        sw.Stop();
        Console.WriteLine($"所有任务完成，耗时: {sw.ElapsedMilliseconds}ms");
        // 约 2000ms（最长任务的时间）
    }

    // 获取所有结果
    public async Task<int[]> WhenAllWithResultsAsync()
    {
        Task<int> task1 = Task.Run(() => { Thread.Sleep(100); return 1; });
        Task<int> task2 = Task.Run(() => { Thread.Sleep(200); return 2; });
        Task<int> task3 = Task.Run(() => { Thread.Sleep(150); return 3; });

        // WhenAll 返回结果数组，顺序与输入顺序一致
        int[] results = await Task.WhenAll(task1, task2, task3);

        Console.WriteLine($"结果: [{string.Join(", ", results)}]");
        return results;
    }

    // 并发下载多个 URL
    public async Task<string[]> DownloadMultipleUrlsAsync(string[] urls)
    {
        var tasks = urls.Select(url => DownloadStringAsync(url));

        // 并发执行所有下载
        string[] contents = await Task.WhenAll(tasks);

        return contents;
    }

    private async Task<string> DownloadStringAsync(string url)
    {
        Console.WriteLine($"开始下载: {url}");
        await Task.Delay(500); // 模拟网络延迟
        return $"内容来自 {url}";
    }

    // 处理部分失败
    public async Task WhenAllWithExceptionHandlingAsync()
    {
        var tasks = new[]
        {
            Task.FromResult("成功1"),
            Task.FromException<string>(new InvalidOperationException("错误1")),
            Task.FromResult("成功2"),
            Task.FromException<string>(new ArgumentException("错误2"))
        };

        Task<string[]> allTasks = Task.WhenAll(tasks);

        try
        {
            string[] results = await allTasks;
        }
        catch (Exception ex)
        {
            // 只捕获第一个异常
            Console.WriteLine($"捕获异常: {ex.Message}");

            // 通过 allTasks.Exception 获取所有异常
            if (allTasks.Exception != null)
            {
                Console.WriteLine("所有异常:");
                foreach (var innerEx in allTasks.Exception.InnerExceptions)
                {
                    Console.WriteLine($"  - {innerEx.GetType().Name}: {innerEx.Message}");
                }
            }
        }
    }

    // 使用 WhenAll 实现并发限制
    public async Task WhenAllWithConcurrencyLimitAsync()
    {
        string[] urls = Enumerable.Range(1, 20).Select(i => $"url{i}").ToArray();
        int batchSize = 5;

        var allResults = new List<string>();

        // 分批处理
        for (int i = 0; i < urls.Length; i += batchSize)
        {
            var batch = urls.Skip(i).Take(batchSize);
            var tasks = batch.Select(url => DownloadStringAsync(url));

            string[] batchResults = await Task.WhenAll(tasks);
            allResults.AddRange(batchResults);

            Console.WriteLine($"完成批次 {i / batchSize + 1}");
        }

        Console.WriteLine($"总共下载: {allResults.Count} 个");
    }

    // 带超时的 WhenAll
    public async Task<string[]?> WhenAllWithTimeoutAsync(string[] urls, TimeSpan timeout)
    {
        var downloadTask = Task.WhenAll(urls.Select(url => DownloadStringAsync(url)));
        var timeoutTask = Task.Delay(timeout);

        Task completedTask = await Task.WhenAny(downloadTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            Console.WriteLine("下载超时");
            return null;
        }

        return await downloadTask;
    }
}
```

### Task.WhenAny 用法

```csharp
public class WhenAnyDemo
{
    // 基本用法 - 返回第一个完成的任务
    public async Task BasicWhenAnyAsync()
    {
        Console.WriteLine("=== Task.WhenAny 基本用法 ===");

        Task<string> task1 = SimulateWorkAsync("任务1", 2000);
        Task<string> task2 = SimulateWorkAsync("任务2", 1000);
        Task<string> task3 = SimulateWorkAsync("任务3", 1500);

        // 返回第一个完成的任务
        Task<string> firstCompleted = await Task.WhenAny(task1, task2, task3);
        string result = await firstCompleted;

        Console.WriteLine($"首先完成的: {result}");
    }

    private async Task<string> SimulateWorkAsync(string name, int delayMs)
    {
        await Task.Delay(delayMs);
        return $"{name} (耗时 {delayMs}ms)";
    }

    // 实现请求超时
    public async Task<string?> FetchWithTimeoutAsync(string url, TimeSpan timeout)
    {
        Task<string> fetchTask = FetchDataAsync(url);
        Task timeoutTask = Task.Delay(timeout);

        Task completedTask = await Task.WhenAny(fetchTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            Console.WriteLine("请求超时");
            return null;
        }

        return await fetchTask;
    }

    private async Task<string> FetchDataAsync(string url)
    {
        await Task.Delay(500); // 模拟网络请求
        return $"数据来自 {url}";
    }

    // 竞争模式 - 多个源获取数据，使用最快的
    public async Task<string> FetchFromFastestSourceAsync()
    {
        Task<string> primarySource = FetchFromSourceAsync("主服务器", 2000);
        Task<string> backupSource = FetchFromSourceAsync("备用服务器", 1500);
        Task<string> cdnSource = FetchFromSourceAsync("CDN", 500);

        // 使用最快响应的源
        Task<string> fastest = await Task.WhenAny(primarySource, backupSource, cdnSource);
        string result = await fastest;

        Console.WriteLine($"最快响应: {result}");
        return result;
    }

    private async Task<string> FetchFromSourceAsync(string source, int latencyMs)
    {
        await Task.Delay(latencyMs);
        return $"数据来自 {source}";
    }

    // 处理所有任务（即使使用 WhenAny）
    public async Task ProcessAllWithFirstResultAsync()
    {
        var tasks = new List<Task<int>>
        {
            ComputeAsync("计算A", 1000),
            ComputeAsync("计算B", 500),
            ComputeAsync("计算C", 1500)
        };

        var allTasks = new List<Task<int>>(tasks);

        while (tasks.Count > 0)
        {
            Task<int> completed = await Task.WhenAny(tasks);
            tasks.Remove(completed);

            try
            {
                int result = await completed;
                Console.WriteLine($"完成结果: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"任务失败: {ex.Message}");
            }
        }

        Console.WriteLine("所有任务已处理");
    }

    private async Task<int> ComputeAsync(string name, int delayMs)
    {
        await Task.Delay(delayMs);
        return delayMs;
    }

    // 取消未完成的任务
    public async Task WhenAnyWithCancellationAsync()
    {
        using var cts = new CancellationTokenSource();

        Task<string> task1 = LongRunningTaskAsync("任务1", 5000, cts.Token);
        Task<string> task2 = LongRunningTaskAsync("任务2", 2000, cts.Token);
        Task<string> task3 = LongRunningTaskAsync("任务3", 3000, cts.Token);

        // 等待第一个完成
        Task<string> first = await Task.WhenAny(task1, task2, task3);

        // 取消其他任务
        cts.Cancel();

        string result = await first;
        Console.WriteLine($"第一个完成: {result}");

        // 等待其他任务处理取消
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
            return $"{name} 完成";
        }
        catch (OperationCanceledException)
        {
            return $"{name} 被取消";
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
            // 忽略取消异常
        }
    }
}
```

### Task 延续 (Continuation)

```csharp
public class ContinuationDemo
{
    // 基本延续
    public async Task BasicContinuationAsync()
    {
        Console.WriteLine("=== 基本延续 ===");

        Task<int> originalTask = Task.Run(() =>
        {
            Console.WriteLine("原始任务执行");
            return 42;
        });

        // ContinueWith 创建延续任务
        Task<string> continuationTask = originalTask.ContinueWith(
            antecedent => $"结果是: {antecedent.Result}"
        );

        string result = await continuationTask;
        Console.WriteLine(result);
    }

    // 链式延续
    public async Task ChainedContinuationsAsync()
    {
        Console.WriteLine("\n=== 链式延续 ===");

        var result = await Task.Run(() => 1)
            .ContinueWith(t => t.Result + 1)
            .ContinueWith(t => t.Result * 2)
            .ContinueWith(t => $"最终结果: {t.Result}");

        Console.WriteLine(result); // 最终结果: 4
    }

    // 条件延续
    public async Task ConditionalContinuationsAsync()
    {
        Console.WriteLine("\n=== 条件延续 ===");

        Task<int> task = Task.Run(() =>
        {
            if (DateTime.Now.Millisecond % 2 == 0)
                return 100;
            else
                throw new InvalidOperationException("模拟错误");
        });

        // 仅在成功时执行
        task.ContinueWith(
            t => Console.WriteLine($"成功: {t.Result}"),
            TaskContinuationOptions.OnlyOnRanToCompletion
        );

        // 仅在失败时执行
        task.ContinueWith(
            t => Console.WriteLine($"失败: {t.Exception?.GetBaseException().Message}"),
            TaskContinuationOptions.OnlyOnFaulted
        );

        // 仅在取消时执行
        task.ContinueWith(
            t => Console.WriteLine("任务被取消"),
            TaskContinuationOptions.OnlyOnCanceled
        );

        try
        {
            await task;
        }
        catch
        {
            // 异常已在延续中处理
        }

        await Task.Delay(100); // 等待延续执行
    }

    // TaskContinuationOptions 详解
    public async Task ContinuationOptionsExampleAsync()
    {
        Console.WriteLine("\n=== 延续选项 ===");

        Task originalTask = Task.Delay(100);

        // 常用选项
        await originalTask.ContinueWith(
            _ => Console.WriteLine("在同步上下文执行"),
            TaskContinuationOptions.ExecuteSynchronously
        );

        await Task.Run(() => 1).ContinueWith(
            t => Console.WriteLine($"不附加到父任务: {t.Result}"),
            TaskContinuationOptions.DenyChildAttach
        );
    }

    // 使用 async/await 替代 ContinueWith（推荐）
    public async Task ModernContinuationStyleAsync()
    {
        Console.WriteLine("\n=== 现代延续风格 ===");

        // ❌ 旧式 ContinueWith 风格
        /*
        var result = await Task.Run(() => FetchData())
            .ContinueWith(t => ProcessData(t.Result))
            .ContinueWith(t => SaveData(t.Result));
        */

        // ✅ 推荐的 async/await 风格
        var data = await Task.Run(() => FetchData());
        var processedData = ProcessData(data);
        await SaveData(processedData);
    }

    private string FetchData() => "原始数据";
    private string ProcessData(string data) => data.ToUpper();
    private Task SaveData(string data)
    {
        Console.WriteLine($"保存: {data}");
        return Task.CompletedTask;
    }

    // 异常在延续中的传播
    public async Task ExceptionPropagationAsync()
    {
        Console.WriteLine("\n=== 异常传播 ===");

        Task task = Task.Run(() =>
        {
            throw new InvalidOperationException("原始异常");
        });

        try
        {
            // 延续任务访问 Result 会抛出 AggregateException
            await task.ContinueWith(t =>
            {
                // 安全检查
                if (t.IsFaulted)
                {
                    Console.WriteLine($"前驱任务失败: {t.Exception?.GetBaseException().Message}");
                    return;
                }
                Console.WriteLine("前驱任务成功");
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"延续异常: {ex.Message}");
        }
    }

    // Unwrap - 展开嵌套 Task
    public async Task UnwrapExampleAsync()
    {
        Console.WriteLine("\n=== Unwrap 示例 ===");

        // 不使用 Unwrap - 得到 Task<Task<int>>
        Task<Task<int>> nestedTask = Task.Run(() =>
        {
            return Task.Run(() => 42);
        });

        // 使用 Unwrap 展开
        Task<int> unwrappedTask = nestedTask.Unwrap();
        int result = await unwrappedTask;
        Console.WriteLine($"展开后的结果: {result}");

        // Task.Run 自动处理这种情况
        int autoUnwrapped = await Task.Run(async () =>
        {
            await Task.Delay(100);
            return 42;
        });
        Console.WriteLine($"自动展开: {autoUnwrapped}");
    }
}
```

## 最佳实践

### 优先使用 async/await 而非 ContinueWith

```csharp
// ❌ 不推荐：使用 ContinueWith
public Task<string> ProcessDataOldWayAsync()
{
    return FetchDataAsync()
        .ContinueWith(t => Transform(t.Result))
        .ContinueWith(t => Format(t.Result));
}

// ✅ 推荐：使用 async/await
public async Task<string> ProcessDataAsync()
{
    var data = await FetchDataAsync();
    var transformed = Transform(data);
    return Format(transformed);
}
```

### 正确选择 Task.Run 和 Task.Factory.StartNew

```csharp
// ✅ 大多数情况使用 Task.Run
await Task.Run(() => CpuBoundWork());

// ✅ 长时间运行的任务使用 LongRunning
await Task.Factory.StartNew(
    () => LongRunningBlockingOperation(),
    TaskCreationOptions.LongRunning
);

// ❌ 不要对 I/O 操作使用 Task.Run
// await Task.Run(() => file.ReadAsync(...)); // 浪费线程
// ✅ 直接 await 异步 I/O
await file.ReadAsync(...);
```

### 正确处理取消

```csharp
public async Task<string> ProcessWithCancellationAsync(CancellationToken ct)
{
    // 在开始时检查
    ct.ThrowIfCancellationRequested();

    // 传递给 Task.Run
    var result = await Task.Run(() =>
    {
        for (int i = 0; i < 100; i++)
        {
            ct.ThrowIfCancellationRequested();
            DoWork(i);
        }
        return "完成";
    }, ct);

    return result;
}
```

### 避免阻塞调用

```csharp
// ❌ 死锁风险：在同步上下文中阻塞等待
public string GetDataBadWay()
{
    return GetDataAsync().Result; // 可能死锁！
}

// ❌ 同样有问题
public void ProcessBadWay()
{
    GetDataAsync().Wait(); // 可能死锁！
}

// ✅ 正确方式：使用 async/await
public async Task<string> GetDataGoodWayAsync()
{
    return await GetDataAsync();
}

// ✅ 如果必须同步调用（尽量避免）
public string GetDataSyncWay()
{
    return Task.Run(() => GetDataAsync()).GetAwaiter().GetResult();
}
```

### 合理使用 ConfigureAwait

```csharp
// 库代码中使用 ConfigureAwait(false)
public async Task<string> LibraryMethodAsync()
{
    var data = await FetchAsync().ConfigureAwait(false);
    return await ProcessAsync(data).ConfigureAwait(false);
}

// UI 代码中不使用（或使用 true）
public async Task UIMethodAsync()
{
    var data = await FetchAsync(); // 默认 ConfigureAwait(true)
    UpdateUI(data); // 需要在 UI 线程执行
}
```

### 正确处理 WhenAll 中的异常

```csharp
public async Task ProcessAllWithProperErrorHandlingAsync()
{
    var tasks = new[]
    {
        ProcessItemAsync(1),
        ProcessItemAsync(2),
        ProcessItemAsync(3)
    };

    // 保存 WhenAll 任务以便检查所有异常
    Task whenAllTask = Task.WhenAll(tasks);

    try
    {
        await whenAllTask;
    }
    catch
    {
        // 获取所有异常
        if (whenAllTask.Exception != null)
        {
            foreach (var ex in whenAllTask.Exception.InnerExceptions)
            {
                Console.WriteLine($"异常: {ex.Message}");
            }
        }
        throw; // 或适当处理
    }
}
```

## 常见陷阱

### 忘记 await

```csharp
// ❌ 忘记 await，任务未被等待
public async Task ForgetToAwaitAsync()
{
    Task.Delay(1000); // 警告：未等待的任务
    Console.WriteLine("这会立即打印！");
}

// ✅ 正确等待
public async Task CorrectAwaitAsync()
{
    await Task.Delay(1000);
    Console.WriteLine("1秒后打印");
}
```

### 在循环中创建未等待的任务

```csharp
// ❌ 任务未被收集和等待
public async Task BadLoopAsync()
{
    foreach (var item in items)
    {
        ProcessItemAsync(item); // 未等待！
    }
    Console.WriteLine("可能在处理完成前打印");
}

// ✅ 收集并等待所有任务
public async Task GoodLoopAsync()
{
    var tasks = items.Select(item => ProcessItemAsync(item));
    await Task.WhenAll(tasks);
    Console.WriteLine("所有处理完成后打印");
}
```

### async void 导致异常丢失

```csharp
// ❌ async void 中的异常无法被捕获
public async void FireAndForgetBadAsync()
{
    await Task.Delay(100);
    throw new InvalidOperationException("这个异常会崩溃应用！");
}

// ✅ 使用 async Task 并处理异常
public async Task FireAndForgetGoodAsync()
{
    try
    {
        await Task.Delay(100);
        throw new InvalidOperationException("可以被捕获");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"捕获: {ex.Message}");
    }
}
```

### Task.Result 和 Task.Wait() 导致死锁

```csharp
// ❌ 在 UI 线程或 ASP.NET 同步上下文中会死锁
public string DeadlockExample()
{
    return GetDataAsync().Result; // 死锁！
}

// 解释：
// 1. GetDataAsync 开始执行，await 后需要返回原始上下文
// 2. .Result 阻塞了原始上下文
// 3. await 永远无法继续，因为上下文被阻塞
// 4. 死锁！
```

### 在 finally 中使用 await

```csharp
// ❌ C# 5.0 不支持，C# 6.0+ 支持但需注意
public async Task FinallyAwaitIssueAsync()
{
    try
    {
        await DoWorkAsync();
    }
    finally
    {
        // C# 6.0+ 支持
        await CleanupAsync();
        // 注意：如果 try 中有异常，finally 中的异常会覆盖它
    }
}

// ✅ 更安全的模式
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
                // 记录清理异常但抛出原始异常
                Console.WriteLine($"清理失败: {cleanupEx.Message}");
            }
            else
            {
                throw;
            }
        }
    }
}
```

### 错误理解 Task.WhenAny

```csharp
// ❌ 错误：以为 WhenAny 会取消其他任务
public async Task WhenAnyMisunderstandingAsync()
{
    Task task1 = LongRunningAsync();
    Task task2 = LongRunningAsync();

    await Task.WhenAny(task1, task2);
    // task1 和 task2 仍在运行！
}

// ✅ 正确：手动取消其他任务
public async Task WhenAnyCorrectAsync()
{
    using var cts = new CancellationTokenSource();

    Task task1 = LongRunningAsync(cts.Token);
    Task task2 = LongRunningAsync(cts.Token);

    await Task.WhenAny(task1, task2);
    cts.Cancel(); // 取消其他任务

    // 等待任务响应取消
    await Task.WhenAll(
        task1.ContinueWith(_ => { }),
        task2.ContinueWith(_ => { })
    );
}
```

## 性能考量

### Task 创建开销

```csharp
// Task 分配在堆上，有一定开销
public async Task TaskAllocationOverheadAsync()
{
    // 每次调用都创建新的 Task 对象
    for (int i = 0; i < 10000; i++)
    {
        await Task.Run(() => { }); // 不推荐：大量小任务
    }

    // ✅ 更好：批量处理
    await Task.Run(() =>
    {
        for (int i = 0; i < 10000; i++)
        {
            // 处理
        }
    });
}
```

### ValueTask 优化

```csharp
// 使用 ValueTask 减少堆分配
public ValueTask<int> GetCachedDataAsync(int key)
{
    if (_cache.TryGetValue(key, out int cachedValue))
    {
        // 同步路径：不分配 Task
        return new ValueTask<int>(cachedValue);
    }

    // 异步路径
    return new ValueTask<int>(FetchFromDatabaseAsync(key));
}

// 注意：ValueTask 不能多次 await
public async Task UseValueTaskAsync()
{
    ValueTask<int> vt = GetCachedDataAsync(1);
    int result = await vt;
    // int result2 = await vt; // ❌ 错误！
}
```

### 线程池考量

```csharp
// 线程池有最小线程数，超出会有创建延迟
public async Task ThreadPoolConsiderationsAsync()
{
    // 查看线程池信息
    ThreadPool.GetMinThreads(out int workerMin, out int ioMin);
    ThreadPool.GetMaxThreads(out int workerMax, out int ioMax);
    Console.WriteLine($"工作线程: {workerMin}-{workerMax}");
    Console.WriteLine($"IO线程: {ioMin}-{ioMax}");

    // 可以调整最小线程数（谨慎使用）
    // ThreadPool.SetMinThreads(100, 100);
}
```

### 并发度控制

```csharp
// 使用 SemaphoreSlim 控制并发度
public async Task ControlledConcurrencyAsync()
{
    var semaphore = new SemaphoreSlim(10); // 最多10个并发
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

### 性能测量

```csharp
public async Task MeasurePerformanceAsync()
{
    var sw = System.Diagnostics.Stopwatch.StartNew();

    // 顺序执行
    for (int i = 0; i < 10; i++)
    {
        await Task.Delay(100);
    }
    Console.WriteLine($"顺序执行: {sw.ElapsedMilliseconds}ms"); // ~1000ms

    sw.Restart();

    // 并行执行
    var tasks = Enumerable.Range(0, 10).Select(_ => Task.Delay(100));
    await Task.WhenAll(tasks);
    Console.WriteLine($"并行执行: {sw.ElapsedMilliseconds}ms"); // ~100ms
}
```

## 实战场景

### 场景1：并发API请求

```csharp
public class ApiAggregator
{
    private readonly HttpClient _httpClient = new();

    public async Task<DashboardData> GetDashboardDataAsync()
    {
        // 并发获取所有需要的数据
        var userTask = GetUserAsync();
        var ordersTask = GetOrdersAsync();
        var statsTask = GetStatsAsync();
        var notificationsTask = GetNotificationsAsync();

        // 等待所有完成
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

### 场景2：带重试的请求

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
                Console.WriteLine($"尝试 {attempt + 1} 失败，{delay.TotalSeconds}秒后重试...");
                await Task.Delay(delay);
            }
        }

        throw new Exception($"操作在 {maxRetries} 次重试后仍然失败");
    }

    private bool IsTransient(Exception ex)
    {
        return ex is HttpRequestException ||
               ex is TimeoutException ||
               ex is TaskCanceledException;
    }
}
```

### 场景3：生产者消费者模式

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
            Console.WriteLine($"生产: {item.Id}");
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
            Console.WriteLine($"消费者{consumerId} 处理: {item.Id}");
            await ProcessItemAsync(item);
        }
    }

    private async Task ProcessItemAsync(WorkItem item)
    {
        await Task.Delay(100); // 模拟处理
    }
}

public record WorkItem(int Id, string Data);
```

### 场景4：超时控制

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
            Console.WriteLine("操作超时");
            return defaultValue;
        }
    }

    // 使用 WhenAny 实现超时
    public async Task<T?> ExecuteWithTimeoutUsingWhenAnyAsync<T>(
        Func<Task<T>> operation,
        TimeSpan timeout)
    {
        var operationTask = operation();
        var timeoutTask = Task.Delay(timeout);

        var completedTask = await Task.WhenAny(operationTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            Console.WriteLine("操作超时");
            return default;
        }

        return await operationTask;
    }
}
```

### 场景5：批量处理

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

            Console.WriteLine($"已处理 {Math.Min(i + batchSize, itemList.Count)}/{itemList.Count}");
        }

        return results;
    }

    // 带进度报告的批处理
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

## 面试要点

### 常见面试题

#### Task 和 Thread 的区别是什么？

```csharp
// Thread：直接代表操作系统线程
Thread thread = new Thread(() => Console.WriteLine("线程"));
thread.Start();

// Task：代表异步操作，可能在线程池线程上执行
Task task = Task.Run(() => Console.WriteLine("任务"));
```

**答案要点**：
- Thread 是操作系统线程的直接抽象，创建开销大
- Task 是对异步操作的抽象，通常运行在线程池上
- Task 支持组合、延续、取消等高级特性
- Task 是现代 .NET 异步编程的推荐方式

#### Task.Run 和 Task.Factory.StartNew 有什么区别？

```csharp
// Task.Run 是简化版本
await Task.Run(() => DoWork());

// Task.Factory.StartNew 更灵活
await Task.Factory.StartNew(
    () => DoWork(),
    CancellationToken.None,
    TaskCreationOptions.LongRunning,
    TaskScheduler.Default
);
```

**答案要点**：
- Task.Run 是 Task.Factory.StartNew 的简化封装
- Task.Run 默认使用 DenyChildAttach 选项
- Task.Factory.StartNew 可以指定 LongRunning 等选项
- Task.Run 会自动展开返回的 Task（Unwrap）

#### 什么时候使用 WhenAll，什么时候使用 WhenAny？

```csharp
// WhenAll：需要所有操作都完成
var allData = await Task.WhenAll(
    FetchUserAsync(),
    FetchOrdersAsync(),
    FetchStatsAsync()
);

// WhenAny：只需要第一个完成（如超时、竞争）
var firstCompleted = await Task.WhenAny(
    FetchFromPrimaryAsync(),
    FetchFromBackupAsync()
);
```

**答案要点**：
- WhenAll 用于聚合多个独立操作的结果
- WhenAny 用于超时控制或竞争场景
- WhenAll 会等待所有任务完成后才返回
- WhenAny 返回第一个完成的任务（不会取消其他任务）

#### 如何正确处理 Task 中的异常？

```csharp
// 单个任务
try
{
    await SomeTaskAsync();
}
catch (SpecificException ex)
{
    // 处理特定异常
}

// 多个任务
Task allTasks = Task.WhenAll(task1, task2, task3);
try
{
    await allTasks;
}
catch
{
    // 通过 Exception 属性获取所有异常
    foreach (var ex in allTasks.Exception.InnerExceptions)
    {
        Console.WriteLine(ex.Message);
    }
}
```

#### ContinueWith 和 await 有什么区别？

```csharp
// ContinueWith：返回包装的任务
Task<string> result = task.ContinueWith(t => t.Result.ToString());

// await：编译器生成状态机
string result = await task;
var final = result.ToString();
```

**答案要点**：
- await 更直观，代码可读性更好
- ContinueWith 需要手动处理异常和取消
- await 保留同步上下文（默认）
- ContinueWith 可以指定 TaskContinuationOptions

#### 解释 ConfigureAwait(false) 的作用

```csharp
// 不捕获同步上下文
await SomeAsync().ConfigureAwait(false);
```

**答案要点**：
- 不捕获并恢复同步上下文
- 在库代码中使用可提高性能
- 避免在 UI 代码中使用（需要返回 UI 线程）
- 可以避免某些死锁场景

### 代码题

**实现一个带并发限制的批量处理方法**：

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

## 延伸阅读

### 官方文档
- [Task 类 - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task)
- [基于任务的异步模式 (TAP)](https://docs.microsoft.com/zh-cn/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
- [任务并行库 (TPL)](https://docs.microsoft.com/zh-cn/dotnet/standard/parallel-programming/task-parallel-library-tpl)

### 推荐书籍
- 《C# in Depth》 - Jon Skeet
- 《Concurrency in C# Cookbook》 - Stephen Cleary
- 《Pro .NET Performance》 - Sasha Goldshtein

### 优质文章
- [Async/Await - Best Practices in Asynchronous Programming](https://docs.microsoft.com/zh-cn/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming)
- [ConfigureAwait FAQ](https://devblogs.microsoft.com/dotnet/configureawait-faq/)
- [Task.Run vs Task.Factory.StartNew](https://devblogs.microsoft.com/pfxteam/task-run-vs-task-factory-startnew/)

### 相关主题
- [C# async/await 深入理解](/csharp/async)
- [并行编程与 PLINQ](/csharp/parallel-programming)
- [同步原语](/csharp/synchronization-primitives)
- [Channel 生产者消费者模式](/csharp/channels)
