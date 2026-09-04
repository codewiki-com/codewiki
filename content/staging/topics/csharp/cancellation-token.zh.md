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
origin: old/src/content/docs/csharp/cancellation-token.zh.md
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

在现代异步编程中，优雅地取消长时间运行的操作是一个关键能力。C# 提供了 `CancellationToken` 机制，让开发者能够以协作式的方式取消异步操作，避免资源浪费和改善用户体验。

## 概念解释

### 什么是 CancellationToken

`CancellationToken` 是 .NET 中用于实现协作式取消的核心类型。它是一个轻量级的结构体，用于在异步操作之间传递取消信号。

**协作式取消**意味着：
- 取消是一种请求，而非强制终止
- 被取消的操作需要主动检查取消状态并作出响应
- 操作可以选择如何响应取消（立即停止、清理后停止、忽略等）

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                  CancellationToken 体系                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐     ┌──────────────────────┐      │
│  │ CancellationToken    │     │ CancellationToken    │      │
│  │ Source               │────>│                      │      │
│  │                      │     │ (传递给异步操作)      │      │
│  │ - 发起取消请求        │     │ - 检查取消状态        │      │
│  │ - 管理取消令牌        │     │ - 响应取消请求        │      │
│  │ - 设置超时            │     │ - 注册取消回调        │      │
│  └──────────────────────┘     └──────────────────────┘      │
│                                                              │
│  创建者/调用者持有              被调用的异步方法持有           │
└─────────────────────────────────────────────────────────────┘
```

### 为什么需要 CancellationToken

1. **用户体验**：允许用户取消长时间运行的操作
2. **资源管理**：及时释放不再需要的资源
3. **超时控制**：防止操作无限期等待
4. **应用生命周期**：在应用关闭时优雅终止后台任务
5. **错误恢复**：在发生错误时取消相关联的操作

## 核心原理

### CancellationTokenSource 的内部机制

`CancellationTokenSource` 是取消令牌的创建者和管理者。当调用 `Cancel()` 方法时，它会：

1. 设置内部的 `_state` 标志
2. 触发所有已注册的回调
3. 通知所有关联的 `CancellationToken`

```csharp
// CancellationTokenSource 的简化内部结构
public class CancellationTokenSource : IDisposable
{
    // 取消状态标志
    private volatile int _state;

    // 已注册的回调链表
    private CallbackNode _callbacks;

    // 关联的 CancellationToken
    public CancellationToken Token { get; }

    // 请求取消
    public void Cancel()
    {
        // 1. 设置取消状态
        // 2. 执行所有回调
        // 3. 释放等待的线程
    }
}
```

### CancellationToken 的工作原理

`CancellationToken` 是一个只读的结构体，它：

1. 持有对 `CancellationTokenSource` 的引用
2. 提供检查取消状态的方法
3. 支持注册取消回调

```csharp
// CancellationToken 的简化结构
public readonly struct CancellationToken
{
    private readonly CancellationTokenSource _source;

    // 是否已请求取消
    public bool IsCancellationRequested => _source?.IsCancellationRequested ?? false;

    // 检查并抛出异常
    public void ThrowIfCancellationRequested()
    {
        if (IsCancellationRequested)
            throw new OperationCanceledException(this);
    }

    // 注册取消回调
    public CancellationTokenRegistration Register(Action callback);
}
```

### 取消传播机制

```
┌─────────────────────────────────────────────────────────────────┐
│                        取消传播流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用户点击取消                                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────┐                                         │
│  │ CancellationToken   │                                         │
│  │ Source.Cancel()     │                                         │
│  └─────────┬───────────┘                                         │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────────┐     ┌─────────────────────┐            │
│  │ 设置 _state = 1     │────>│ 触发所有回调         │            │
│  └─────────────────────┘     └─────────────────────┘            │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────────────────────────────────────┐            │
│  │              所有持有 Token 的操作                 │            │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │            │
│  │  │ 操作 A  │  │ 操作 B  │  │ 操作 C  │         │            │
│  │  │检查状态 │  │检查状态 │  │检查状态 │         │            │
│  │  │响应取消 │  │响应取消 │  │响应取消 │         │            │
│  │  └─────────┘  └─────────┘  └─────────┘         │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 核心要点

### CancellationTokenSource 生命周期

| 状态 | 描述 | IsCancellationRequested |
|------|------|------------------------|
| 初始 | 刚创建，未取消 | false |
| 已取消 | 调用 Cancel() 后 | true |
| 已释放 | 调用 Dispose() 后 | 抛出 ObjectDisposedException |

### 响应取消的方式

| 方式 | 方法 | 行为 |
|------|------|------|
| 轮询检查 | `IsCancellationRequested` | 返回 bool，不抛异常 |
| 抛出异常 | `ThrowIfCancellationRequested()` | 抛出 `OperationCanceledException` |
| 回调响应 | `Register()` | 取消时执行回调 |

### 关键属性和方法

```csharp
// CancellationTokenSource 的关键成员
public class CancellationTokenSource
{
    // 获取关联的取消令牌
    public CancellationToken Token { get; }

    // 是否已取消
    public bool IsCancellationRequested { get; }

    // 请求取消
    public void Cancel();
    public void Cancel(bool throwOnFirstException);

    // 延迟取消
    public void CancelAfter(int millisecondsDelay);
    public void CancelAfter(TimeSpan delay);

    // 创建链接令牌源
    public static CancellationTokenSource CreateLinkedTokenSource(
        CancellationToken token1,
        CancellationToken token2);

    // 释放资源
    public void Dispose();
}
```

### CancellationToken 的特殊值

```csharp
// 永远不会取消的令牌
CancellationToken neverCancel = CancellationToken.None;

// 检查是否可以被取消
bool canBeCanceled = token.CanBeCanceled;
// CancellationToken.None.CanBeCanceled == false
```

## 代码示例

### 基础用法：创建和使用取消令牌

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

public class BasicCancellationExample
{
    public async Task DemonstrateBasicCancellationAsync()
    {
        // 1. 创建取消令牌源
        using var cts = new CancellationTokenSource();

        // 2. 获取取消令牌
        CancellationToken token = cts.Token;

        // 3. 启动异步操作
        Task longRunningTask = LongRunningOperationAsync(token);

        // 4. 模拟用户在 2 秒后取消
        await Task.Delay(2000);
        Console.WriteLine("请求取消操作...");
        cts.Cancel();

        // 5. 等待任务完成或被取消
        try
        {
            await longRunningTask;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("操作已被取消");
        }
    }

    private async Task LongRunningOperationAsync(CancellationToken cancellationToken)
    {
        for (int i = 0; i < 10; i++)
        {
            // 检查取消状态
            cancellationToken.ThrowIfCancellationRequested();

            Console.WriteLine($"执行步骤 {i + 1}/10");
            await Task.Delay(500, cancellationToken);
        }

        Console.WriteLine("操作完成");
    }
}
```

### ThrowIfCancellationRequested 详解

```csharp
public class ThrowIfCancellationRequestedExample
{
    // 方式 1: 使用 ThrowIfCancellationRequested
    public async Task ProcessWithThrowAsync(CancellationToken cancellationToken)
    {
        foreach (var item in GetItems())
        {
            // 在每次迭代时检查取消
            cancellationToken.ThrowIfCancellationRequested();

            await ProcessItemAsync(item);
        }
    }

    // 方式 2: 使用 IsCancellationRequested 进行优雅处理
    public async Task<ProcessResult> ProcessWithGracefulExitAsync(
        CancellationToken cancellationToken)
    {
        var processedItems = new List<string>();

        foreach (var item in GetItems())
        {
            // 检查取消状态，进行清理后返回
            if (cancellationToken.IsCancellationRequested)
            {
                Console.WriteLine("检测到取消请求，执行清理...");
                await CleanupAsync();

                return new ProcessResult
                {
                    IsCompleted = false,
                    ProcessedItems = processedItems,
                    Message = "操作被用户取消"
                };
            }

            await ProcessItemAsync(item);
            processedItems.Add(item);
        }

        return new ProcessResult
        {
            IsCompleted = true,
            ProcessedItems = processedItems,
            Message = "处理完成"
        };
    }

    // 方式 3: 混合使用 - 关键点检查并抛出，循环中优雅处理
    public async Task ProcessMixedApproachAsync(CancellationToken cancellationToken)
    {
        // 开始前检查
        cancellationToken.ThrowIfCancellationRequested();

        await InitializeAsync();

        foreach (var batch in GetBatches())
        {
            // 批次之间检查，允许优雅退出
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

### 超时取消

```csharp
public class TimeoutCancellationExample
{
    // 方式 1: 构造函数设置超时
    public async Task OperationWithTimeoutAsync()
    {
        // 创建 5 秒后自动取消的令牌源
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

        try
        {
            await LongRunningOperationAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("操作超时");
        }
    }

    // 方式 2: CancelAfter 方法
    public async Task OperationWithDynamicTimeoutAsync()
    {
        using var cts = new CancellationTokenSource();

        // 启动操作后设置超时
        var task = LongRunningOperationAsync(cts.Token);

        // 根据条件动态设置超时
        cts.CancelAfter(TimeSpan.FromSeconds(10));

        try
        {
            await task;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("操作超时");
        }
    }

    // 方式 3: 结合 Task.WhenAny 实现超时
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
            cts.Cancel(); // 取消操作
            throw new TimeoutException($"操作在 {timeout} 后超时");
        }

        return await operationTask;
    }

    // 使用示例
    public async Task UseTimeoutHelperAsync()
    {
        try
        {
            var result = await ExecuteWithTimeoutAsync(
                async ct =>
                {
                    await Task.Delay(3000, ct); // 模拟 3 秒操作
                    return "成功";
                },
                TimeSpan.FromSeconds(5));

            Console.WriteLine($"结果: {result}");
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
            Console.WriteLine($"步骤 {i + 1}");
            await Task.Delay(500, token);
        }
    }
}
```

### 链接令牌 (Linked Tokens)

```csharp
public class LinkedTokensExample
{
    // 场景：用户取消 + 超时取消 + 应用关闭取消
    public async Task ProcessWithMultipleCancellationSourcesAsync(
        CancellationToken userCancellation,
        CancellationToken applicationShutdown)
    {
        // 创建超时取消源
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

        // 创建链接令牌源，任一取消都会触发
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
            // 确定是哪个源触发了取消
            if (userCancellation.IsCancellationRequested)
            {
                Console.WriteLine("用户取消了操作");
            }
            else if (applicationShutdown.IsCancellationRequested)
            {
                Console.WriteLine("应用程序正在关闭");
            }
            else if (timeoutCts.IsCancellationRequested)
            {
                Console.WriteLine("操作超时");
            }
        }
    }

    // 多层嵌套的链接令牌
    public async Task NestedLinkedTokensAsync(CancellationToken parentToken)
    {
        // 第一层：父令牌 + 本地超时
        using var localTimeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var level1Cts = CancellationTokenSource.CreateLinkedTokenSource(
            parentToken,
            localTimeoutCts.Token);

        await Task.WhenAll(
            ProcessPartA(level1Cts.Token),
            ProcessPartB(level1Cts.Token)
        );
    }

    // 动态添加取消条件
    public async Task DynamicCancellationAsync(CancellationToken baseToken)
    {
        var additionalConditions = new List<CancellationTokenSource>();

        try
        {
            // 添加基于资源的取消条件
            var memoryCts = new CancellationTokenSource();
            additionalConditions.Add(memoryCts);

            // 监控内存使用
            _ = MonitorMemoryAsync(memoryCts);

            // 创建包含所有条件的链接令牌
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
                Console.WriteLine("内存使用过高，取消操作");
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

### 注册取消回调

```csharp
public class CancellationCallbackExample
{
    // 基本回调注册
    public async Task BasicCallbackAsync()
    {
        using var cts = new CancellationTokenSource();

        // 注册回调
        using var registration = cts.Token.Register(() =>
        {
            Console.WriteLine("取消回调被执行");
        });

        // 注册带状态的回调
        using var registrationWithState = cts.Token.Register(
            state => Console.WriteLine($"带状态的回调: {state}"),
            "自定义状态对象");

        // 模拟操作
        var task = Task.Run(async () =>
        {
            await Task.Delay(5000, cts.Token);
        }, cts.Token);

        // 2 秒后取消
        await Task.Delay(2000);
        cts.Cancel();

        try
        {
            await task;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("任务已取消");
        }
    }

    // 使用回调进行资源清理
    public async Task CleanupOnCancellationAsync(CancellationToken cancellationToken)
    {
        var tempFile = Path.GetTempFileName();
        FileStream fileStream = null;

        // 注册清理回调
        using var cleanup = cancellationToken.Register(() =>
        {
            Console.WriteLine("执行清理...");

            fileStream?.Dispose();

            if (File.Exists(tempFile))
            {
                File.Delete(tempFile);
                Console.WriteLine($"已删除临时文件: {tempFile}");
            }
        });

        try
        {
            fileStream = new FileStream(tempFile, FileMode.Create);

            // 执行文件操作
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
            Console.WriteLine("操作被取消，清理回调将执行");
            throw;
        }
        finally
        {
            fileStream?.Dispose();
        }
    }

    // 异步回调处理
    public async Task AsyncCallbackPatternAsync()
    {
        using var cts = new CancellationTokenSource();
        var tcs = new TaskCompletionSource<bool>();

        // 注册异步清理回调
        using var registration = cts.Token.Register(() =>
        {
            // 启动异步清理
            _ = Task.Run(async () =>
            {
                Console.WriteLine("开始异步清理...");
                await Task.Delay(500); // 模拟清理操作
                Console.WriteLine("异步清理完成");
                tcs.TrySetResult(true);
            });
        });

        // 模拟操作
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
            // 等待清理完成
            await tcs.Task;
            Console.WriteLine("所有清理已完成");
        }
    }
}
```

### 与 HttpClient 配合使用

```csharp
public class HttpClientCancellationExample
{
    private readonly HttpClient _httpClient = new HttpClient();

    // 基本的 HTTP 请求取消
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
            Console.WriteLine("HTTP 请求被取消");
            throw;
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"HTTP 请求失败: {ex.Message}");
            throw;
        }
    }

    // 带超时的 HTTP 请求
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
            throw new TimeoutException($"请求在 {timeout} 后超时");
        }
    }

    // 并发请求与取消
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
            Console.WriteLine("批量请求被取消");
            throw;
        }
    }

    // 使用 SendAsync 获得更细粒度的控制
    public async Task<HttpResponseMessage> SendWithCancellationAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        // HttpCompletionOption.ResponseHeadersRead 允许在收到响应头后立即返回
        // 这使得可以在下载大文件时更快地响应取消
        return await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
    }

    // 下载大文件并支持取消
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

### 与数据库操作配合使用

```csharp
public class DatabaseCancellationExample
{
    private readonly string _connectionString;

    public DatabaseCancellationExample(string connectionString)
    {
        _connectionString = connectionString;
    }

    // 基本的数据库查询取消
    public async Task<List<User>> GetUsersAsync(CancellationToken cancellationToken)
    {
        var users = new List<User>();

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new SqlCommand("SELECT Id, Name, Email FROM Users", connection);

        // CommandTimeout 与 CancellationToken 独立工作
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

    // 批量插入与取消
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
                // 在每次插入前检查取消
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
            Console.WriteLine("批量插入已取消，事务已回滚");
            throw;
        }
    }

    // 长时间运行的报表查询
    public async Task<ReportData> GenerateReportAsync(
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken)
    {
        var report = new ReportData();

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        // 分步骤生成报表，每步检查取消状态
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

// 辅助类定义
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

### Channel 与 CancellationToken

```csharp
public class ChannelCancellationExample
{
    // 生产者-消费者模式与取消
    public async Task ProducerConsumerWithCancellationAsync(
        CancellationToken cancellationToken)
    {
        var channel = Channel.CreateBounded<int>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait
        });

        // 启动生产者
        var producerTask = Task.Run(async () =>
        {
            try
            {
                for (int i = 0; i < 1000; i++)
                {
                    await channel.Writer.WriteAsync(i, cancellationToken);
                    Console.WriteLine($"生产: {i}");
                    await Task.Delay(10, cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("生产者被取消");
            }
            finally
            {
                channel.Writer.Complete();
            }
        }, cancellationToken);

        // 启动多个消费者
        var consumerTasks = Enumerable.Range(0, 3)
            .Select(consumerId => Task.Run(async () =>
            {
                try
                {
                    await foreach (var item in channel.Reader.ReadAllAsync(cancellationToken))
                    {
                        Console.WriteLine($"消费者 {consumerId} 处理: {item}");
                        await Task.Delay(50, cancellationToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    Console.WriteLine($"消费者 {consumerId} 被取消");
                }
            }, cancellationToken))
            .ToArray();

        await Task.WhenAll(producerTask);
        await Task.WhenAll(consumerTasks);
    }

    // 带超时的读取
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
            Console.WriteLine("读取超时");
            return default;
        }
    }
}
```

## 最佳实践

### 始终释放 CancellationTokenSource

```csharp
// 正确：使用 using 语句确保释放
public async Task CorrectUsageAsync()
{
    using var cts = new CancellationTokenSource();
    await DoWorkAsync(cts.Token);
}

// 正确：在 try-finally 中手动释放
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

// 错误：忘记释放
public async Task LeakyUsageAsync()
{
    var cts = new CancellationTokenSource(); // 内存泄漏！
    await DoWorkAsync(cts.Token);
}
```

### 传递 CancellationToken 到所有支持的方法

```csharp
public async Task ComprehensiveCancellationAsync(CancellationToken cancellationToken)
{
    // 将令牌传递给所有异步操作
    await Task.Delay(1000, cancellationToken);

    using var client = new HttpClient();
    var response = await client.GetAsync("https://api.example.com", cancellationToken);
    var content = await response.Content.ReadAsStringAsync(cancellationToken);

    await using var connection = new SqlConnection("...");
    await connection.OpenAsync(cancellationToken);

    // Stream 操作
    await using var stream = new FileStream("file.txt", FileMode.Open);
    var buffer = new byte[1024];
    await stream.ReadAsync(buffer, cancellationToken);
}
```

### 在适当的位置检查取消状态

```csharp
public async Task WellPlacedChecksAsync(
    IEnumerable<Item> items,
    CancellationToken cancellationToken)
{
    // 开始前检查
    cancellationToken.ThrowIfCancellationRequested();

    await InitializeAsync();

    foreach (var item in items)
    {
        // 循环开始时检查（推荐位置）
        cancellationToken.ThrowIfCancellationRequested();

        // 耗时操作前检查
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

### 正确处理 OperationCanceledException

```csharp
public async Task ProperExceptionHandlingAsync(CancellationToken cancellationToken)
{
    try
    {
        await DoWorkAsync(cancellationToken);
    }
    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
    {
        // 用户/应用请求的取消 - 通常是预期的
        Console.WriteLine("操作被取消");
        // 可能需要记录日志，但通常不是错误
    }
    catch (OperationCanceledException)
    {
        // 其他原因的取消（如超时）
        Console.WriteLine("操作因其他原因被取消");
        throw; // 可能需要重新抛出
    }
    catch (Exception ex)
    {
        // 真正的错误
        Console.WriteLine($"操作失败: {ex.Message}");
        throw;
    }
}

// 区分超时和用户取消
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
            Console.WriteLine("用户取消");
        }
        else if (timeoutCts.IsCancellationRequested)
        {
            Console.WriteLine("操作超时");
            throw new TimeoutException("操作超时");
        }
        throw;
    }
}
```

### 使用默认参数提供可选的取消支持

```csharp
// 方法签名中使用默认值
public async Task DoWorkAsync(CancellationToken cancellationToken = default)
{
    // 调用者可以选择是否传递取消令牌
    await Task.Delay(1000, cancellationToken);
}

// 重载方法
public Task DoWorkAsync() => DoWorkAsync(CancellationToken.None);

public async Task DoWorkAsync(CancellationToken cancellationToken)
{
    await Task.Delay(1000, cancellationToken);
}
```

## 常见陷阱

### 忘记释放 CancellationTokenSource

```csharp
// 陷阱：CancellationTokenSource 未释放导致内存泄漏
public async Task MemoryLeakAsync()
{
    var cts = new CancellationTokenSource();
    cts.CancelAfter(TimeSpan.FromSeconds(5));

    // cts 从未释放，内部的 Timer 会保持引用
    await DoWorkAsync(cts.Token);
}

// 解决方案：使用 using
public async Task NoLeakAsync()
{
    using var cts = new CancellationTokenSource();
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    await DoWorkAsync(cts.Token);
}
```

### 取消后继续使用 CancellationTokenSource

```csharp
// 陷阱：取消后重用 CancellationTokenSource
public async Task ReuseMistakeAsync()
{
    var cts = new CancellationTokenSource();

    // 第一次操作
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    try
    {
        await DoWorkAsync(cts.Token);
    }
    catch (OperationCanceledException) { }

    // 错误：取消后的 CancellationTokenSource 无法重置
    // 这个操作会立即被取消！
    await DoWorkAsync(cts.Token); // 立即抛出 OperationCanceledException
}

// 解决方案：每次操作创建新的 CancellationTokenSource
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
            Console.WriteLine($"操作 {i} 超时");
        }
    }
}
```

### 在回调中抛出异常

```csharp
// 陷阱：回调中抛出异常会被吞掉或导致问题
public void CallbackExceptionTrap()
{
    using var cts = new CancellationTokenSource();

    cts.Token.Register(() =>
    {
        // 危险：这个异常可能被吞掉或导致意外行为
        throw new InvalidOperationException("回调中的异常");
    });

    cts.Cancel(); // 取消时，异常行为取决于 Cancel 的参数
}

// 解决方案：在回调中处理异常
public void SafeCallbackAsync()
{
    using var cts = new CancellationTokenSource();

    cts.Token.Register(() =>
    {
        try
        {
            // 可能抛出异常的清理操作
            CleanupResources();
        }
        catch (Exception ex)
        {
            // 记录日志但不重新抛出
            Console.WriteLine($"清理时发生错误: {ex.Message}");
        }
    });

    cts.Cancel();
}
```

### 阻塞等待已取消的操作

```csharp
// 陷阱：同步等待可能导致死锁
public void DeadlockRiskAsync()
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));

    // 危险：在 UI 线程上同步等待
    var result = DoWorkAsync(cts.Token).Result; // 可能死锁！
}

// 解决方案：使用异步等待
public async Task NoDeadlockAsync()
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));

    try
    {
        var result = await DoWorkAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        // 处理取消
    }
}
```

### 忽略 CancellationToken 参数

```csharp
// 陷阱：接收了 CancellationToken 但完全忽略
public async Task IgnoredTokenAsync(CancellationToken cancellationToken)
{
    // 错误：没有使用传入的 cancellationToken
    await Task.Delay(10000); // 即使调用者取消，也会等待 10 秒

    for (int i = 0; i < 1000; i++)
    {
        // 错误：循环中没有检查取消
        await ProcessItemAsync(i);
    }
}

// 解决方案：在所有适当的位置使用令牌
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

### 链接令牌后不释放链接源

```csharp
// 陷阱：链接的 CancellationTokenSource 未释放
public async Task LinkedTokenLeakAsync(CancellationToken parentToken)
{
    var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        parentToken, timeoutCts.Token);

    // linkedCts 和 timeoutCts 都未释放！
    await DoWorkAsync(linkedCts.Token);
}

// 解决方案：确保所有创建的 CancellationTokenSource 都被释放
public async Task NoLinkedTokenLeakAsync(CancellationToken parentToken)
{
    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
        parentToken, timeoutCts.Token);

    await DoWorkAsync(linkedCts.Token);
}
```

## 性能考量

### CancellationToken 是结构体

```csharp
// CancellationToken 是 struct，传递时会复制
// 但由于它只包含一个对 CancellationTokenSource 的引用，复制成本很低
public void PassToken(CancellationToken token)
{
    // 传递 CancellationToken 的性能开销非常小
}
```

### 避免频繁创建 CancellationTokenSource

```csharp
// 不好的做法：为每个小操作创建新的 CancellationTokenSource
public async Task FrequentCreationAsync()
{
    for (int i = 0; i < 10000; i++)
    {
        using var cts = new CancellationTokenSource(); // 大量分配
        await SmallOperationAsync(cts.Token);
    }
}

// 好的做法：重用或传递已有的 CancellationToken
public async Task EfficientAsync(CancellationToken cancellationToken)
{
    for (int i = 0; i < 10000; i++)
    {
        await SmallOperationAsync(cancellationToken);
    }
}
```

### 检查取消状态的开销

```csharp
// IsCancellationRequested 是一个简单的字段读取，非常快
// ThrowIfCancellationRequested 在未取消时也很快

// 在紧密循环中可以考虑减少检查频率
public async Task OptimizedCheckingAsync(CancellationToken cancellationToken)
{
    for (int i = 0; i < 1000000; i++)
    {
        // 每 1000 次迭代检查一次
        if (i % 1000 == 0)
        {
            cancellationToken.ThrowIfCancellationRequested();
        }

        // 快速操作
        DoQuickWork(i);
    }
}
```

### 回调注册的性能

```csharp
// 注册回调有一定开销，避免在热路径中注册
// 回调会在取消时同步执行，确保回调快速返回

public void EfficientCallbackRegistration()
{
    using var cts = new CancellationTokenSource();

    // 好：在初始化时注册一次
    using var registration = cts.Token.Register(() => Cleanup());

    // 执行操作...
}

public void InefficientCallbackRegistration()
{
    using var cts = new CancellationTokenSource();

    for (int i = 0; i < 1000; i++)
    {
        // 不好：在循环中重复注册
        cts.Token.Register(() => Cleanup());
    }
}
```

### 内存分配优化

```csharp
// 使用无分配的模式检查取消状态
public void LowAllocationPattern(CancellationToken cancellationToken)
{
    // 好：直接检查属性
    if (cancellationToken.IsCancellationRequested)
    {
        throw new OperationCanceledException(cancellationToken);
    }

    // 或使用内置方法（也是无分配的）
    cancellationToken.ThrowIfCancellationRequested();
}
```

## 实战场景

### 场景 1: Web API 请求超时

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
        CancellationToken cancellationToken) // ASP.NET Core 自动提供
    {
        try
        {
            // 设置额外的超时限制
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken, timeoutCts.Token);

            var report = await _reportService.GenerateReportAsync(id, linkedCts.Token);
            return Ok(report);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // 客户端断开连接
            return StatusCode(499, "Client closed request");
        }
        catch (OperationCanceledException)
        {
            // 超时
            return StatusCode(504, "Request timeout");
        }
    }
}
```

### 场景 2: 后台服务优雅关闭

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
        _logger.LogInformation("后台服务启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 等待消息，支持取消
                var message = await _messageQueue.DequeueAsync(stoppingToken);

                if (message != null)
                {
                    await ProcessMessageAsync(message, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("后台服务收到停止信号");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理消息时发生错误");
                await Task.Delay(1000, stoppingToken);
            }
        }

        _logger.LogInformation("后台服务已停止");
    }

    private async Task ProcessMessageAsync(Message message, CancellationToken cancellationToken)
    {
        // 为单个消息处理设置超时
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken, timeoutCts.Token);

        await DoProcessingAsync(message, linkedCts.Token);
    }
}
```

### 场景 3: 用户可取消的文件上传

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
        var buffer = new byte[81920]; // 80KB 缓冲区

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
                Error = "上传已被用户取消"
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

### 场景 4: 并行任务处理与取消

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
                throw; // 重新抛出取消异常
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
            // 处理取消
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
        await Task.Delay(100, cancellationToken); // 模拟处理
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

## 面试要点

### CancellationToken 和 CancellationTokenSource 的区别是什么？

**答案要点：**
- `CancellationTokenSource` 是取消请求的发起者，负责创建令牌和发起取消
- `CancellationToken` 是只读的结构体，用于检查取消状态和注册回调
- `CancellationTokenSource` 需要被释放（实现了 `IDisposable`）
- 一个 `CancellationTokenSource` 只能取消一次，不能重置

### 为什么使用协作式取消而不是强制终止线程？

**答案要点：**
- 强制终止（如 `Thread.Abort`）可能导致资源泄漏和数据损坏
- 协作式取消允许操作在安全点停止并清理资源
- 操作可以选择如何响应取消（保存进度、回滚事务等）
- .NET Core 已经不再支持 `Thread.Abort`

### ThrowIfCancellationRequested 和检查 IsCancellationRequested 有什么区别？

**答案要点：**
- `ThrowIfCancellationRequested()` 在取消时抛出 `OperationCanceledException`
- `IsCancellationRequested` 返回布尔值，允许更灵活的处理
- 使用场景：需要快速退出用前者，需要清理工作用后者
- 性能上两者差异很小

### 如何正确处理 OperationCanceledException？

**答案要点：**
```csharp
try
{
    await DoWorkAsync(cancellationToken);
}
catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
{
    // 预期的取消，通常不需要特殊处理
}
catch (OperationCanceledException)
{
    // 超时或其他原因的取消
}
```

### 解释链接令牌的使用场景

**答案要点：**
- 当需要多个取消条件时使用（用户取消 + 超时 + 应用关闭）
- 使用 `CreateLinkedTokenSource` 创建
- 任一源取消都会触发链接令牌取消
- 必须释放链接的 `CancellationTokenSource`

### CancellationToken.None 的作用是什么？

**答案要点：**
- 表示一个永远不会被取消的令牌
- `CanBeCanceled` 属性为 `false`
- 用于不需要取消支持的场景
- 作为方法参数的默认值

## 延伸阅读

### 官方文档
- [Microsoft Docs: Cancellation in Managed Threads](https://docs.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads)
- [Task Cancellation](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/task-cancellation)
- [How to: Cancel a Task and Its Children](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/how-to-cancel-a-task-and-its-children)

### 相关主题
- [C# 异步编程 (async/await)](/docs/csharp/async)
- [Task 并行库 (TPL)](/docs/csharp/async#parallel-类)
- [IAsyncEnumerable 异步流](/docs/csharp/async#异步流-async-streams---iasyncenumerablet)

### 进阶阅读
- Stephen Cleary - "Concurrency in C# Cookbook"
- Stephen Toub - "Patterns for Parallel Programming"
- [Async Guidance by David Fowler](https://github.com/davidfowl/AspNetCoreDiagnosticScenarios)

---

> CancellationToken 是 C# 异步编程中不可或缺的工具。正确使用取消机制可以显著提升应用程序的响应性和用户体验。记住始终释放 `CancellationTokenSource`，将令牌传递给所有支持的异步操作，并在适当的位置检查取消状态。
