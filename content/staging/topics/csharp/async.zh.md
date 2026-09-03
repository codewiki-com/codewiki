---
title: C# 异步编程
description: 掌握 C# 异步：Task、async/await、并行编程与同步原语
track: csharp
section: async
difficulty: intermediate
tags:
  - C#
  - async
  - await
  - Task
status: imported
origin: old/src/content/docs/csharp/async.zh.md
divergence: 0.195
issues: []
legacy:
  category: CSharp
  subcategory: 异步编程
  order: 2
  lastUpdated: 2026-01-07
---

异步编程是现代 C# 开发中的核心技能，它能够提高应用程序的响应性和可扩展性。本文将深入探讨 C# 异步编程的各个方面。

## Task 基础

`Task` 是 .NET 中表示异步操作的核心类型。它代表一个可能尚未完成的操作。

### 创建和启动 Task

```csharp
// 方法 1: 使用 Task.Run
Task task1 = Task.Run(() =>
{
    Console.WriteLine("任务正在执行");
    Thread.Sleep(1000);
});

// 方法 2: 使用 Task.Factory.StartNew
Task task2 = Task.Factory.StartNew(() =>
{
    Console.WriteLine("使用 Factory 创建的任务");
});

// 方法 3: 创建但不立即启动
Task task3 = new Task(() =>
{
    Console.WriteLine("手动启动的任务");
});
task3.Start();
```

### Task<TResult> - 返回值的任务

```csharp
// 创建返回值的任务
Task<int> calculateTask = Task.Run(() =>
{
    Thread.Sleep(1000);
    return 42;
});

// 获取结果（会阻塞直到任务完成）
int result = calculateTask.Result;
Console.WriteLine($"计算结果: {result}");

// 使用 GetAwaiter().GetResult() 获取结果
int result2 = calculateTask.GetAwaiter().GetResult();
```

### 等待任务完成

```csharp
Task task = Task.Run(() =>
{
    Thread.Sleep(2000);
    Console.WriteLine("任务完成");
});

// 阻塞等待
task.Wait();

// 等待多个任务
Task task1 = Task.Delay(1000);
Task task2 = Task.Delay(2000);
Task.WaitAll(task1, task2); // 等待所有任务完成
Task.WaitAny(task1, task2); // 等待任何一个任务完成

// 使用 WhenAll 和 WhenAny（异步版本）
await Task.WhenAll(task1, task2);
await Task.WhenAny(task1, task2);
```

### Task 的状态

```csharp
Task task = Task.Run(() => Thread.Sleep(1000));

Console.WriteLine($"状态: {task.Status}");
// 可能的状态: Created, WaitingForActivation, WaitingToRun,
// Running, WaitingForChildrenToComplete, RanToCompletion,
// Canceled, Faulted

// 检查任务是否完成
if (task.IsCompleted)
{
    Console.WriteLine("任务已完成");
}

// 检查是否成功完成
if (task.IsCompletedSuccessfully)
{
    Console.WriteLine("任务成功完成");
}

// 检查是否有异常
if (task.IsFaulted)
{
    Console.WriteLine($"任务失败: {task.Exception}");
}
```

## async/await 模式

`async` 和 `await` 关键字是 C# 异步编程的核心，它们使异步代码看起来像同步代码。

### 基本用法

```csharp
// 异步方法的定义
public async Task<string> DownloadDataAsync(string url)
{
    using (HttpClient client = new HttpClient())
    {
        // await 关键字暂停方法执行，直到任务完成
        string content = await client.GetStringAsync(url);
        return content;
    }
}

// 调用异步方法
public async Task ProcessDataAsync()
{
    string data = await DownloadDataAsync("https://api.example.com/data");
    Console.WriteLine($"下载的数据长度: {data.Length}");
}
```

### async void vs async Task

```csharp
// ❌ 避免使用 async void（除非是事件处理程序）
public async void BadMethodAsync()
{
    await Task.Delay(1000);
    // 无法捕获此方法的异常
}

// ✅ 推荐使用 async Task
public async Task GoodMethodAsync()
{
    await Task.Delay(1000);
    // 异常可以被调用者捕获
}

// ✅ async void 的合法用途：事件处理程序
private async void Button_Click(object sender, EventArgs e)
{
    try
    {
        await ProcessDataAsync();
    }
    catch (Exception ex)
    {
        // 必须在方法内部处理异常
        Console.WriteLine($"错误: {ex.Message}");
    }
}
```

### 顺序执行 vs 并发执行

```csharp
// 顺序执行（串行）
public async Task SequentialExecutionAsync()
{
    Stopwatch sw = Stopwatch.StartNew();

    string result1 = await DownloadDataAsync("url1"); // 等待 1 秒
    string result2 = await DownloadDataAsync("url2"); // 等待 1 秒

    sw.Stop();
    Console.WriteLine($"顺序执行耗时: {sw.ElapsedMilliseconds}ms"); // 约 2000ms
}

// 并发执行（并行）
public async Task ConcurrentExecutionAsync()
{
    Stopwatch sw = Stopwatch.StartNew();

    // 同时启动两个任务
    Task<string> task1 = DownloadDataAsync("url1");
    Task<string> task2 = DownloadDataAsync("url2");

    // 等待两个任务都完成
    string[] results = await Task.WhenAll(task1, task2);

    sw.Stop();
    Console.WriteLine($"并发执行耗时: {sw.ElapsedMilliseconds}ms"); // 约 1000ms
}
```

### 异步流 (Async Streams) - IAsyncEnumerable<T>

```csharp
// C# 8.0+ 支持异步流
public async IAsyncEnumerable<int> GenerateNumbersAsync(int count)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(100); // 模拟异步操作
        yield return i;
    }
}

// 使用异步流
public async Task ConsumeAsyncStreamAsync()
{
    await foreach (int number in GenerateNumbersAsync(10))
    {
        Console.WriteLine($"接收到数字: {number}");
    }
}
```

### ConfigureAwait

```csharp
// ConfigureAwait(false) - 不捕获同步上下文
public async Task LibraryMethodAsync()
{
    // 在库代码中，使用 ConfigureAwait(false) 提高性能
    await Task.Delay(1000).ConfigureAwait(false);
    // 后续代码可能在不同的线程上执行
}

// ConfigureAwait(true) 或不使用 - 捕获同步上下文（默认行为）
public async Task UIMethodAsync()
{
    await Task.Delay(1000); // 默认 ConfigureAwait(true)
    // 在 UI 应用中，后续代码会返回到 UI 线程
    UpdateUIElement(); // 安全地更新 UI
}
```

## 异常处理

异步代码中的异常处理需要特别注意。

### 基本异常处理

```csharp
public async Task HandleExceptionAsync()
{
    try
    {
        await Task.Run(() =>
        {
            throw new InvalidOperationException("模拟异常");
        });
    }
    catch (InvalidOperationException ex)
    {
        Console.WriteLine($"捕获异常: {ex.Message}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"捕获通用异常: {ex.Message}");
    }
    finally
    {
        Console.WriteLine("清理资源");
    }
}
```

### 多个任务的异常处理

```csharp
public async Task HandleMultipleTaskExceptionsAsync()
{
    try
    {
        Task task1 = Task.Run(() => throw new InvalidOperationException("任务1异常"));
        Task task2 = Task.Run(() => throw new ArgumentException("任务2异常"));
        Task task3 = Task.Delay(1000);

        // WhenAll 会等待所有任务完成，即使有异常
        await Task.WhenAll(task1, task2, task3);
    }
    catch (Exception ex)
    {
        // 只捕获第一个异常
        Console.WriteLine($"捕获的第一个异常: {ex.Message}");
    }
}

// 捕获所有异常
public async Task HandleAllExceptionsAsync()
{
    Task task1 = Task.Run(() => throw new InvalidOperationException("任务1异常"));
    Task task2 = Task.Run(() => throw new ArgumentException("任务2异常"));

    Task allTasks = Task.WhenAll(task1, task2);

    try
    {
        await allTasks;
    }
    catch
    {
        // 通过 Exception 属性获取所有异常
        if (allTasks.Exception != null)
        {
            foreach (var ex in allTasks.Exception.InnerExceptions)
            {
                Console.WriteLine($"异常: {ex.Message}");
            }
        }
    }
}
```

### AggregateException

```csharp
public void HandleAggregateException()
{
    Task task = Task.Run(() =>
    {
        throw new InvalidOperationException("内部异常");
    });

    try
    {
        task.Wait(); // Wait() 会抛出 AggregateException
    }
    catch (AggregateException ae)
    {
        ae.Handle(ex =>
        {
            if (ex is InvalidOperationException)
            {
                Console.WriteLine($"处理异常: {ex.Message}");
                return true; // 已处理
            }
            return false; // 未处理，重新抛出
        });
    }
}
```

## 取消令牌 (CancellationToken)

`CancellationToken` 允许协作式取消异步操作。

### 基本用法

```csharp
public async Task CancellableOperationAsync(CancellationToken cancellationToken)
{
    for (int i = 0; i < 10; i++)
    {
        // 检查是否请求取消
        cancellationToken.ThrowIfCancellationRequested();

        Console.WriteLine($"处理项 {i}");
        await Task.Delay(500, cancellationToken);
    }
}

// 使用取消令牌
public async Task UseCancellationTokenAsync()
{
    CancellationTokenSource cts = new CancellationTokenSource();

    // 5 秒后自动取消
    cts.CancelAfter(TimeSpan.FromSeconds(5));

    try
    {
        await CancellableOperationAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("操作已取消");
    }
    finally
    {
        cts.Dispose();
    }
}
```

### 手动取消

```csharp
public async Task ManualCancellationAsync()
{
    CancellationTokenSource cts = new CancellationTokenSource();

    // 在另一个线程中取消
    Task.Run(async () =>
    {
        await Task.Delay(2000);
        Console.WriteLine("请求取消操作");
        cts.Cancel();
    });

    try
    {
        await LongRunningOperationAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("操作被取消");
    }
}

private async Task LongRunningOperationAsync(CancellationToken cancellationToken)
{
    for (int i = 0; i < 100; i++)
    {
        if (cancellationToken.IsCancellationRequested)
        {
            Console.WriteLine("检测到取消请求");
            cancellationToken.ThrowIfCancellationRequested();
        }

        await Task.Delay(100);
    }
}
```

### 链接取消令牌

```csharp
public async Task LinkedCancellationTokensAsync()
{
    CancellationTokenSource cts1 = new CancellationTokenSource();
    CancellationTokenSource cts2 = new CancellationTokenSource();

    // 创建链接的取消令牌源
    using (CancellationTokenSource linkedCts =
        CancellationTokenSource.CreateLinkedTokenSource(cts1.Token, cts2.Token))
    {
        // 如果 cts1 或 cts2 任一被取消，linkedCts 也会被取消
        try
        {
            await CancellableOperationAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("操作被取消");
        }
    }
}
```

### 注册取消回调

```csharp
public async Task CancellationCallbackAsync()
{
    CancellationTokenSource cts = new CancellationTokenSource();

    // 注册取消时的回调
    cts.Token.Register(() =>
    {
        Console.WriteLine("取消回调被执行");
        // 清理资源
    });

    // 也可以传递状态
    cts.Token.Register(state =>
    {
        Console.WriteLine($"带状态的回调: {state}");
    }, "自定义状态");

    cts.CancelAfter(1000);

    try
    {
        await Task.Delay(5000, cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("延迟被取消");
    }
}
```

## 并行编程 (Parallel 类)

`Parallel` 类提供了简单的数据并行操作。

### Parallel.For

```csharp
public void ParallelForExample()
{
    // 并行执行 for 循环
    Parallel.For(0, 100, i =>
    {
        Console.WriteLine($"处理索引 {i}，线程 {Thread.CurrentThread.ManagedThreadId}");
        Thread.Sleep(10);
    });

    // 带选项的并行 for
    ParallelOptions options = new ParallelOptions
    {
        MaxDegreeOfParallelism = 4, // 最多使用 4 个线程
        CancellationToken = CancellationToken.None
    };

    Parallel.For(0, 100, options, i =>
    {
        // 处理逻辑
    });
}
```

### Parallel.ForEach

```csharp
public void ParallelForEachExample()
{
    List<string> urls = new List<string>
    {
        "https://api1.example.com",
        "https://api2.example.com",
        "https://api3.example.com"
    };

    // 并行处理集合
    Parallel.ForEach(urls, url =>
    {
        Console.WriteLine($"处理 URL: {url}");
        // 执行下载或处理
    });

    // 带分区器的并行处理（优化性能）
    var partitioner = Partitioner.Create(urls);
    Parallel.ForEach(partitioner, url =>
    {
        // 处理逻辑
    });
}
```

### Parallel.Invoke

```csharp
public void ParallelInvokeExample()
{
    // 并行执行多个操作
    Parallel.Invoke(
        () => Operation1(),
        () => Operation2(),
        () => Operation3()
    );
}

private void Operation1()
{
    Console.WriteLine("操作 1 执行");
    Thread.Sleep(1000);
}

private void Operation2()
{
    Console.WriteLine("操作 2 执行");
    Thread.Sleep(1000);
}

private void Operation3()
{
    Console.WriteLine("操作 3 执行");
    Thread.Sleep(1000);
}
```

### Parallel.ForEachAsync (异步版本)

```csharp
// .NET 6+ 支持
public async Task ParallelForEachAsyncExample()
{
    List<string> urls = new List<string>
    {
        "https://api1.example.com",
        "https://api2.example.com",
        "https://api3.example.com"
    };

    ParallelOptions options = new ParallelOptions
    {
        MaxDegreeOfParallelism = 3
    };

    await Parallel.ForEachAsync(urls, options, async (url, ct) =>
    {
        using (HttpClient client = new HttpClient())
        {
            string content = await client.GetStringAsync(url, ct);
            Console.WriteLine($"下载 {url}: {content.Length} 字节");
        }
    });
}
```

### PLINQ (Parallel LINQ)

```csharp
public void PLINQExample()
{
    int[] numbers = Enumerable.Range(0, 1000).ToArray();

    // 使用 PLINQ 并行查询
    var result = numbers
        .AsParallel()
        .Where(n => n % 2 == 0)
        .Select(n => n * n)
        .ToArray();

    // 控制并行度
    var result2 = numbers
        .AsParallel()
        .WithDegreeOfParallelism(4)
        .Where(n => IsPrime(n))
        .ToArray();

    // 保持顺序
    var result3 = numbers
        .AsParallel()
        .AsOrdered()
        .Select(n => n * 2)
        .ToArray();
}

private bool IsPrime(int number)
{
    if (number < 2) return false;
    for (int i = 2; i <= Math.Sqrt(number); i++)
    {
        if (number % i == 0) return false;
    }
    return true;
}
```

## 同步原语

在异步编程中，需要使用适当的同步原语来协调多个任务的访问。

### SemaphoreSlim

```csharp
public class ResourcePool
{
    private SemaphoreSlim _semaphore = new SemaphoreSlim(3, 3); // 最多 3 个并发

    public async Task AccessResourceAsync()
    {
        Console.WriteLine($"等待进入... 线程 {Thread.CurrentThread.ManagedThreadId}");

        // 等待获取信号量
        await _semaphore.WaitAsync();

        try
        {
            Console.WriteLine($"访问资源... 线程 {Thread.CurrentThread.ManagedThreadId}");
            await Task.Delay(2000); // 模拟资源使用
        }
        finally
        {
            Console.WriteLine($"释放资源... 线程 {Thread.CurrentThread.ManagedThreadId}");
            _semaphore.Release();
        }
    }

    // 使用超时
    public async Task<bool> TryAccessResourceAsync(TimeSpan timeout)
    {
        if (await _semaphore.WaitAsync(timeout))
        {
            try
            {
                // 访问资源
                await Task.Delay(1000);
                return true;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        return false; // 超时
    }
}
```

### Lock vs SemaphoreSlim

```csharp
public class ThreadSafeCounter
{
    private int _count = 0;
    private readonly object _lock = new object();
    private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    // ❌ 在异步方法中不能使用 lock
    public async Task BadIncrementAsync()
    {
        // 编译错误：不能在 lock 语句中使用 await
        // lock (_lock)
        // {
        //     await Task.Delay(10);
        //     _count++;
        // }
    }

    // ✅ 使用 SemaphoreSlim
    public async Task GoodIncrementAsync()
    {
        await _semaphore.WaitAsync();
        try
        {
            await Task.Delay(10);
            _count++;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    // ✅ 同步方法可以使用 lock
    public void SyncIncrement()
    {
        lock (_lock)
        {
            _count++;
        }
    }

    public int GetCount() => _count;
}
```

### AsyncLocal<T>

```csharp
public class AsyncContextExample
{
    private static AsyncLocal<string> _asyncLocalContext = new AsyncLocal<string>();

    public async Task DemonstrateAsyncLocalAsync()
    {
        _asyncLocalContext.Value = "主任务上下文";

        Console.WriteLine($"主任务: {_asyncLocalContext.Value}");

        Task task1 = Task.Run(async () =>
        {
            // 继承父任务的上下文
            Console.WriteLine($"子任务 1: {_asyncLocalContext.Value}");

            _asyncLocalContext.Value = "子任务 1 修改";
            await Task.Delay(100);

            Console.WriteLine($"子任务 1 (延迟后): {_asyncLocalContext.Value}");
        });

        Task task2 = Task.Run(async () =>
        {
            Console.WriteLine($"子任务 2: {_asyncLocalContext.Value}");

            _asyncLocalContext.Value = "子任务 2 修改";
            await Task.Delay(100);

            Console.WriteLine($"子任务 2 (延迟后): {_asyncLocalContext.Value}");
        });

        await Task.WhenAll(task1, task2);

        // 主任务的上下文不受子任务影响
        Console.WriteLine($"主任务 (完成后): {_asyncLocalContext.Value}");
    }
}
```

### ReaderWriterLockSlim (用于同步场景)

```csharp
public class CachedData
{
    private readonly ReaderWriterLockSlim _lock = new ReaderWriterLockSlim();
    private Dictionary<string, string> _cache = new Dictionary<string, string>();

    public string Read(string key)
    {
        _lock.EnterReadLock();
        try
        {
            return _cache.TryGetValue(key, out string value) ? value : null;
        }
        finally
        {
            _lock.ExitReadLock();
        }
    }

    public void Write(string key, string value)
    {
        _lock.EnterWriteLock();
        try
        {
            _cache[key] = value;
        }
        finally
        {
            _lock.ExitWriteLock();
        }
    }

    // 可升级的读锁
    public void UpgradeableRead(string key, string defaultValue)
    {
        _lock.EnterUpgradeableReadLock();
        try
        {
            if (!_cache.ContainsKey(key))
            {
                _lock.EnterWriteLock();
                try
                {
                    _cache[key] = defaultValue;
                }
                finally
                {
                    _lock.ExitWriteLock();
                }
            }
        }
        finally
        {
            _lock.ExitUpgradeableReadLock();
        }
    }
}
```

### Interlocked 操作

```csharp
public class AtomicOperations
{
    private int _counter = 0;
    private long _longCounter = 0;

    public void IncrementCounter()
    {
        // 原子递增
        Interlocked.Increment(ref _counter);
    }

    public void DecrementCounter()
    {
        // 原子递减
        Interlocked.Decrement(ref _counter);
    }

    public void AddValue(int value)
    {
        // 原子加法
        Interlocked.Add(ref _counter, value);
    }

    public void CompareAndSwap(int comparand, int newValue)
    {
        // 比较并交换（CAS 操作）
        int original = Interlocked.CompareExchange(ref _counter, newValue, comparand);

        if (original == comparand)
        {
            Console.WriteLine("交换成功");
        }
        else
        {
            Console.WriteLine("交换失败");
        }
    }

    public int GetCounter()
    {
        // 原子读取
        return Interlocked.Read(ref _longCounter);
    }
}
```

## 最佳实践

### 避免异步方法返回 void

```csharp
// ❌ 不好的做法
public async void ProcessDataBadAsync()
{
    await Task.Delay(1000);
}

// ✅ 好的做法
public async Task ProcessDataGoodAsync()
{
    await Task.Delay(1000);
}

// ✅ 事件处理程序例外
private async void Button_Click(object sender, EventArgs e)
{
    await ProcessDataGoodAsync();
}
```

### 使用 ConfigureAwait(false) 在库代码中

```csharp
// 库代码
public async Task<string> LibraryMethodAsync()
{
    using (HttpClient client = new HttpClient())
    {
        // 不需要返回原始上下文，提高性能
        return await client.GetStringAsync("https://api.example.com")
            .ConfigureAwait(false);
    }
}

// UI 代码
public async Task UIMethodAsync()
{
    // 需要返回 UI 线程，不使用 ConfigureAwait(false)
    var data = await FetchDataAsync();
    UpdateUI(data); // 必须在 UI 线程上执行
}
```

### 避免同步阻塞异步代码

```csharp
// ❌ 不好的做法 - 可能导致死锁
public void BadSyncMethod()
{
    var result = SomeAsyncMethod().Result; // 阻塞
    var result2 = SomeAsyncMethod().GetAwaiter().GetResult(); // 也是阻塞
}

// ✅ 好的做法
public async Task GoodAsyncMethod()
{
    var result = await SomeAsyncMethod(); // 异步等待
}
```

### 正确处理异步流中的异常

```csharp
public async Task ConsumeAsyncStreamWithErrorHandlingAsync()
{
    await foreach (var item in GetItemsAsync())
    {
        try
        {
            await ProcessItemAsync(item);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"处理项失败: {ex.Message}");
            // 继续处理下一项
        }
    }
}

private async IAsyncEnumerable<int> GetItemsAsync()
{
    for (int i = 0; i < 10; i++)
    {
        await Task.Delay(100);
        yield return i;
    }
}

private async Task ProcessItemAsync(int item)
{
    await Task.Delay(50);
}
```

### 使用 ValueTask 优化性能

```csharp
// 当结果经常同步可用时，使用 ValueTask
public ValueTask<int> GetCachedValueAsync(string key)
{
    if (_cache.TryGetValue(key, out int value))
    {
        // 同步返回，避免 Task 分配
        return new ValueTask<int>(value);
    }

    // 异步获取
    return new ValueTask<int>(FetchFromDatabaseAsync(key));
}

private Dictionary<string, int> _cache = new Dictionary<string, int>();

private async Task<int> FetchFromDatabaseAsync(string key)
{
    await Task.Delay(100); // 模拟数据库访问
    return 42;
}

// 注意：ValueTask 不能多次 await
public async Task UseValueTaskAsync()
{
    ValueTask<int> valueTask = GetCachedValueAsync("key");

    int result = await valueTask; // ✅ 可以
    // int result2 = await valueTask; // ❌ 不能再次 await
}
```

### 合理使用 Task.Yield

```csharp
// 在同步上下文中避免阻塞
public async Task AvoidBlockingAsync()
{
    // 立即让出控制权
    await Task.Yield();

    // 执行耗时操作
    PerformHeavyComputation();
}

// 在递归异步方法中避免栈溢出
public async Task RecursiveAsyncMethod(int depth)
{
    if (depth <= 0) return;

    await Task.Yield(); // 防止同步递归
    await RecursiveAsyncMethod(depth - 1);
}
```

### 处理超时

```csharp
public async Task<string> DownloadWithTimeoutAsync(string url, TimeSpan timeout)
{
    using (HttpClient client = new HttpClient())
    {
        client.Timeout = timeout;

        try
        {
            return await client.GetStringAsync(url);
        }
        catch (TaskCanceledException)
        {
            throw new TimeoutException($"下载超时: {url}");
        }
    }
}

// 使用 CancellationTokenSource 实现超时
public async Task<T> ExecuteWithTimeoutAsync<T>(
    Func<CancellationToken, Task<T>> operation,
    TimeSpan timeout)
{
    using (var cts = new CancellationTokenSource(timeout))
    {
        try
        {
            return await operation(cts.Token);
        }
        catch (OperationCanceledException)
        {
            throw new TimeoutException("操作超时");
        }
    }
}
```

## 总结

C# 异步编程是一个强大的工具，能够显著提高应用程序的性能和响应性。关键要点：

1. **Task 基础**：理解 Task 和 Task<TResult> 的创建和使用
2. **async/await**：掌握异步方法的定义和调用模式
3. **异常处理**：正确处理异步代码中的异常，特别是多任务场景
4. **取消令牌**：使用 CancellationToken 实现协作式取消
5. **并行编程**：合理使用 Parallel 类和 PLINQ 进行数据并行处理
6. **同步原语**：在异步场景中使用适当的同步机制（如 SemaphoreSlim）
7. **最佳实践**：避免常见陷阱，编写高效、可维护的异步代码

掌握这些概念将帮助您编写出高性能、可扩展的 C# 应用程序。
