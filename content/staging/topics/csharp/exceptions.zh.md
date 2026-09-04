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
origin: old/src/content/docs/csharp/exceptions.zh.md
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

异常处理是 C# 中处理运行时错误的核心机制。通过异常处理，程序可以优雅地处理错误情况，避免程序崩溃，并提供有意义的错误信息。本文将深入介绍 C# 异常处理的各个方面。

## 什么是异常

异常是程序执行过程中发生的意外事件，它会中断正常的程序流程。当异常发生时，运行时会创建一个异常对象，包含错误的详细信息。

```csharp
// 常见的异常场景
int[] numbers = { 1, 2, 3 };
int value = numbers[10];  // IndexOutOfRangeException：索引超出范围

int result = 10 / 0;      // DivideByZeroException：除以零

string text = null;
int length = text.Length; // NullReferenceException：空引用

int number = int.Parse("abc"); // FormatException：格式错误
```

## try-catch-finally 语句

### 基本语法

try-catch-finally 是 C# 异常处理的核心结构。

```csharp
try
{
    // 可能抛出异常的代码
    int result = 10 / 0;
}
catch (Exception ex)
{
    // 处理异常
    Console.WriteLine($"发生错误：{ex.Message}");
}
finally
{
    // 无论是否发生异常都会执行的代码
    Console.WriteLine("清理工作完成");
}
```

### try-catch 块

catch 块用于捕获和处理特定类型的异常。

```csharp
try
{
    Console.Write("请输入一个数字：");
    string input = Console.ReadLine();
    int number = int.Parse(input);
    int result = 100 / number;
    Console.WriteLine($"结果：{result}");
}
catch (FormatException ex)
{
    Console.WriteLine($"输入格式错误：{ex.Message}");
}
catch (DivideByZeroException ex)
{
    Console.WriteLine($"不能除以零：{ex.Message}");
}
catch (Exception ex)
{
    // 捕获所有其他异常
    Console.WriteLine($"发生未知错误：{ex.Message}");
}
```

### 多个 catch 块的顺序

catch 块的顺序很重要：更具体的异常类型必须放在前面，更通用的放在后面。

```csharp
try
{
    // 可能抛出异常的代码
}
catch (ArgumentNullException ex)
{
    // 最具体的异常类型
    Console.WriteLine("参数为空");
}
catch (ArgumentException ex)
{
    // ArgumentNullException 的基类
    Console.WriteLine("参数无效");
}
catch (SystemException ex)
{
    // 更通用的系统异常
    Console.WriteLine("系统错误");
}
catch (Exception ex)
{
    // 最通用的异常基类
    Console.WriteLine("未知错误");
}
```

### finally 块

finally 块中的代码无论是否发生异常都会执行，通常用于释放资源。

```csharp
FileStream file = null;

try
{
    file = new FileStream("data.txt", FileMode.Open);
    // 读取文件内容
    byte[] buffer = new byte[1024];
    int bytesRead = file.Read(buffer, 0, buffer.Length);
    Console.WriteLine($"读取了 {bytesRead} 字节");
}
catch (FileNotFoundException ex)
{
    Console.WriteLine($"文件未找到：{ex.FileName}");
}
catch (IOException ex)
{
    Console.WriteLine($"IO 错误：{ex.Message}");
}
finally
{
    // 确保文件被关闭
    if (file != null)
    {
        file.Close();
        Console.WriteLine("文件已关闭");
    }
}
```

### try-finally（无 catch）

可以只使用 try-finally，不使用 catch，让异常继续向上传播。

```csharp
public void ProcessFile(string path)
{
    FileStream file = null;
    try
    {
        file = new FileStream(path, FileMode.Open);
        // 处理文件...
    }
    finally
    {
        // 即使发生异常也会执行清理
        file?.Close();
    }
    // 异常会继续向上传播
}
```

## 常见异常类型

### 系统异常层次结构

```csharp
// Exception（所有异常的基类）
//   ├── SystemException（系统异常基类）
//   │     ├── ArgumentException（参数异常）
//   │     │     ├── ArgumentNullException（参数为空）
//   │     │     └── ArgumentOutOfRangeException（参数超出范围）
//   │     ├── ArithmeticException（算术异常）
//   │     │     ├── DivideByZeroException（除以零）
//   │     │     └── OverflowException（溢出）
//   │     ├── FormatException（格式异常）
//   │     ├── IndexOutOfRangeException（索引超出范围）
//   │     ├── InvalidCastException（无效类型转换）
//   │     ├── InvalidOperationException（无效操作）
//   │     ├── NullReferenceException（空引用）
//   │     ├── NotImplementedException（未实现）
//   │     ├── NotSupportedException（不支持）
//   │     ├── OutOfMemoryException（内存不足）
//   │     ├── StackOverflowException（栈溢出）
//   │     └── IO.IOException（IO 异常）
//   │           ├── FileNotFoundException（文件未找到）
//   │           └── DirectoryNotFoundException（目录未找到）
//   └── ApplicationException（应用程序异常基类，已不推荐使用）
```

### 常用异常示例

```csharp
// ArgumentNullException：参数为空
public void ProcessData(string data)
{
    if (data == null)
        throw new ArgumentNullException(nameof(data), "数据不能为空");
}

// ArgumentOutOfRangeException：参数超出范围
public void SetAge(int age)
{
    if (age < 0 || age > 150)
        throw new ArgumentOutOfRangeException(nameof(age), age, "年龄必须在 0-150 之间");
}

// InvalidOperationException：无效操作
public class Counter
{
    private int _count = 0;
    private bool _started = false;

    public void Increment()
    {
        if (!_started)
            throw new InvalidOperationException("计数器尚未启动");
        _count++;
    }
}

// NotImplementedException：未实现
public class BaseProcessor
{
    public virtual void Process()
    {
        throw new NotImplementedException("子类必须实现此方法");
    }
}

// NotSupportedException：不支持
public class ReadOnlyCollection
{
    public void Add(object item)
    {
        throw new NotSupportedException("只读集合不支持添加操作");
    }
}
```

## 抛出异常

### throw 语句

使用 throw 语句抛出异常。

```csharp
public class BankAccount
{
    private decimal _balance;

    public BankAccount(decimal initialBalance)
    {
        if (initialBalance < 0)
            throw new ArgumentException("初始余额不能为负数", nameof(initialBalance));

        _balance = initialBalance;
    }

    public void Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "取款金额必须大于零");

        if (amount > _balance)
            throw new InvalidOperationException($"余额不足。当前余额：{_balance}，取款金额：{amount}");

        _balance -= amount;
    }

    public decimal Balance => _balance;
}

// 使用示例
try
{
    var account = new BankAccount(1000);
    account.Withdraw(1500); // 抛出 InvalidOperationException
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"操作失败：{ex.Message}");
}
```

### throw vs throw ex

重新抛出异常时，`throw` 和 `throw ex` 有重要区别。

```csharp
public void MethodA()
{
    try
    {
        MethodB();
    }
    catch (Exception ex)
    {
        // 记录日志
        Console.WriteLine($"捕获到异常：{ex.Message}");

        // 方式 1：使用 throw（推荐）
        // 保留原始堆栈跟踪信息
        throw;

        // 方式 2：使用 throw ex（不推荐）
        // 会丢失原始堆栈跟踪，重置堆栈从当前位置开始
        // throw ex;
    }
}

public void MethodB()
{
    throw new InvalidOperationException("原始异常");
}
```

### 条件性抛出

```csharp
public void ValidateUser(User user)
{
    // 使用 null 条件检查
    ArgumentNullException.ThrowIfNull(user); // .NET 6+

    // 或者传统方式
    if (user == null)
        throw new ArgumentNullException(nameof(user));

    // 使用条件表达式抛出
    _ = user.Name ?? throw new ArgumentException("用户名不能为空", nameof(user));

    // 验证年龄
    if (user.Age is < 0 or > 150)
        throw new ArgumentOutOfRangeException(nameof(user), "用户年龄无效");
}
```

## 异常过滤器

C# 6.0 引入了异常过滤器（when 子句），允许在 catch 块中添加额外条件。

### 基本语法

```csharp
try
{
    // 可能抛出异常的代码
    ProcessRequest();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    Console.WriteLine("资源未找到");
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
{
    Console.WriteLine("未授权访问");
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.InternalServerError)
{
    Console.WriteLine("服务器内部错误");
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"HTTP 请求错误：{ex.Message}");
}
```

### 使用方法作为过滤条件

```csharp
public class ExceptionHandler
{
    private static bool ShouldHandle(Exception ex)
    {
        // 可以在这里记录日志，但不应该有副作用
        Console.WriteLine($"检查异常：{ex.Message}");
        return ex.Message.Contains("可恢复");
    }

    public void ProcessData()
    {
        try
        {
            // 处理数据
        }
        catch (Exception ex) when (ShouldHandle(ex))
        {
            // 只处理 ShouldHandle 返回 true 的异常
            Console.WriteLine("处理可恢复的异常");
        }
    }
}
```

### 日志记录而不捕获

异常过滤器的一个巧妙用法是记录日志而不实际捕获异常。

```csharp
public void ProcessWithLogging()
{
    try
    {
        DoSomething();
    }
    catch (Exception ex) when (LogException(ex))
    {
        // 这个 catch 块永远不会执行
        // 因为 LogException 返回 false
    }
}

private bool LogException(Exception ex)
{
    // 记录异常日志
    Console.WriteLine($"[{DateTime.Now}] 异常：{ex.Message}");
    Console.WriteLine($"堆栈跟踪：{ex.StackTrace}");

    // 返回 false，让异常继续传播
    return false;
}
```

### 组合条件

```csharp
try
{
    ProcessFile(filePath);
}
catch (IOException ex) when (ex.HResult == -2147024864) // 文件被占用
{
    Console.WriteLine("文件正在被其他进程使用");
}
catch (IOException ex) when (IsTemporaryError(ex) && _retryCount < 3)
{
    Console.WriteLine("临时错误，正在重试...");
    _retryCount++;
    ProcessFile(filePath);
}
catch (IOException ex)
{
    Console.WriteLine($"IO 错误：{ex.Message}");
}

private bool IsTemporaryError(IOException ex)
{
    // 检查是否为临时性错误
    return ex.HResult == -2147024784; // 磁盘空间不足等
}
```

## 自定义异常

### 创建自定义异常类

```csharp
// 基本自定义异常
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

// 带额外属性的自定义异常
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

### 带错误代码的异常

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

// 使用示例
public class PaymentService
{
    public void ProcessPayment(decimal amount, string accountId)
    {
        if (amount <= 0)
            throw new AppException(ErrorCode.InvalidInput, "支付金额必须大于零");

        var account = GetAccount(accountId);
        if (account == null)
            throw new AppException(ErrorCode.NotFound, $"账户 {accountId} 不存在");

        if (account.IsLocked)
            throw new AppException(ErrorCode.AccountLocked, "账户已被锁定");

        if (account.Balance < amount)
            throw new AppException(ErrorCode.InsufficientFunds,
                $"余额不足。当前余额：{account.Balance}，支付金额：{amount}");
    }
}
```

### 领域特定异常

```csharp
// 订单相关异常
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
        : base(orderId, $"订单 {orderId} 不存在")
    {
    }
}

public class OrderAlreadyExistsException : OrderException
{
    public OrderAlreadyExistsException(string orderId)
        : base(orderId, $"订单 {orderId} 已存在")
    {
    }
}

public class OrderCancelledException : OrderException
{
    public DateTime CancelledAt { get; }
    public string Reason { get; }

    public OrderCancelledException(string orderId, DateTime cancelledAt, string reason)
        : base(orderId, $"订单 {orderId} 已于 {cancelledAt} 取消，原因：{reason}")
    {
        CancelledAt = cancelledAt;
        Reason = reason;
    }
}
```

## 异常属性

### 常用属性

```csharp
try
{
    throw new InvalidOperationException("发生错误");
}
catch (Exception ex)
{
    // Message：异常描述信息
    Console.WriteLine($"消息：{ex.Message}");

    // StackTrace：堆栈跟踪
    Console.WriteLine($"堆栈跟踪：{ex.StackTrace}");

    // Source：引发异常的应用程序或对象名称
    Console.WriteLine($"来源：{ex.Source}");

    // TargetSite：引发异常的方法
    Console.WriteLine($"目标方法：{ex.TargetSite}");

    // HResult：HRESULT 错误代码
    Console.WriteLine($"HResult：{ex.HResult}");

    // InnerException：内部异常
    if (ex.InnerException != null)
    {
        Console.WriteLine($"内部异常：{ex.InnerException.Message}");
    }

    // Data：额外数据字典
    foreach (var key in ex.Data.Keys)
    {
        Console.WriteLine($"数据 [{key}]：{ex.Data[key]}");
    }
}
```

### 使用 Data 属性

```csharp
public void ProcessOrder(string orderId, string customerId)
{
    try
    {
        // 处理订单...
        throw new InvalidOperationException("订单处理失败");
    }
    catch (Exception ex)
    {
        // 添加上下文信息
        ex.Data["OrderId"] = orderId;
        ex.Data["CustomerId"] = customerId;
        ex.Data["Timestamp"] = DateTime.UtcNow;
        ex.Data["ServerName"] = Environment.MachineName;

        // 重新抛出带有额外信息的异常
        throw;
    }
}

// 读取 Data 属性
catch (Exception ex)
{
    Console.WriteLine($"处理订单时出错：{ex.Message}");

    if (ex.Data.Contains("OrderId"))
    {
        Console.WriteLine($"订单 ID：{ex.Data["OrderId"]}");
    }

    if (ex.Data.Contains("CustomerId"))
    {
        Console.WriteLine($"客户 ID：{ex.Data["CustomerId"]}");
    }
}
```

### 内部异常链

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
            // 包装异常，保留原始异常作为 InnerException
            throw new DataAccessException("从数据库读取数据失败", ex);
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
            throw new BusinessException("数据处理失败", ex);
        }
    }
}

// 遍历异常链
public static void PrintExceptionChain(Exception ex, int level = 0)
{
    string indent = new string(' ', level * 2);
    Console.WriteLine($"{indent}异常类型：{ex.GetType().Name}");
    Console.WriteLine($"{indent}消息：{ex.Message}");

    if (ex.InnerException != null)
    {
        Console.WriteLine($"{indent}--- 内部异常 ---");
        PrintExceptionChain(ex.InnerException, level + 1);
    }
}
```

## using 语句与资源清理

### 传统 using 语句

```csharp
// 自动调用 Dispose 方法释放资源
using (var file = new FileStream("data.txt", FileMode.Open))
{
    // 使用文件
    byte[] buffer = new byte[1024];
    file.Read(buffer, 0, buffer.Length);
} // file.Dispose() 在这里自动调用

// 多个资源
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

### using 声明（C# 8.0+）

```csharp
public void ProcessFile(string path)
{
    using var file = new FileStream(path, FileMode.Open);
    using var reader = new StreamReader(file);

    string content = reader.ReadToEnd();
    Console.WriteLine(content);

    // file 和 reader 在方法结束时自动释放
}
```

### IDisposable 接口

```csharp
public class DatabaseConnection : IDisposable
{
    private bool _disposed = false;
    private SqlConnection _connection;

    public DatabaseConnection(string connectionString)
    {
        _connection = new SqlConnection(connectionString);
        _connection.Open();
        Console.WriteLine("数据库连接已打开");
    }

    public void ExecuteQuery(string sql)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(DatabaseConnection));

        // 执行查询...
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
                // 释放托管资源
                _connection?.Close();
                _connection?.Dispose();
                Console.WriteLine("数据库连接已关闭");
            }

            // 释放非托管资源

            _disposed = true;
        }
    }

    ~DatabaseConnection()
    {
        Dispose(false);
    }
}

// 使用示例
using (var db = new DatabaseConnection("连接字符串"))
{
    db.ExecuteQuery("SELECT * FROM Users");
} // 自动调用 Dispose
```

### IAsyncDisposable 接口

```csharp
public class AsyncResource : IAsyncDisposable
{
    private bool _disposed = false;

    public async ValueTask DisposeAsync()
    {
        if (!_disposed)
        {
            // 异步清理资源
            await CleanupAsync();
            _disposed = true;
        }
    }

    private async Task CleanupAsync()
    {
        await Task.Delay(100); // 模拟异步清理
        Console.WriteLine("异步资源已释放");
    }
}

// 使用示例
public async Task ProcessAsync()
{
    await using var resource = new AsyncResource();
    // 使用资源...
} // 自动调用 DisposeAsync
```

## 异步异常处理

### async/await 中的异常

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
        Console.WriteLine($"HTTP 请求失败：{ex.Message}");
        throw;
    }
    catch (TaskCanceledException ex)
    {
        Console.WriteLine("请求超时或被取消");
        throw;
    }
}

// 调用异步方法
public async Task MainAsync()
{
    try
    {
        string data = await FetchDataAsync("https://api.example.com/data");
        Console.WriteLine(data);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"获取数据失败：{ex.Message}");
    }
}
```

### 处理多个异步任务的异常

```csharp
// Task.WhenAll 的异常处理
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
        // 只捕获第一个异常
        Console.WriteLine($"发生错误：{ex.Message}");

        // 检查所有任务的异常
        var tasks = new[] { task1, task2, task3 };
        foreach (var task in tasks)
        {
            if (task.IsFaulted)
            {
                Console.WriteLine($"任务失败：{task.Exception?.InnerException?.Message}");
            }
        }
    }
}

// 使用 AggregateException 获取所有异常
public async Task ProcessAllExceptionsAsync()
{
    var tasks = new[]
    {
        Task.Run(() => throw new InvalidOperationException("错误 1")),
        Task.Run(() => throw new ArgumentException("错误 2")),
        Task.Run(() => throw new FormatException("错误 3"))
    };

    var allTasks = Task.WhenAll(tasks);

    try
    {
        await allTasks;
    }
    catch
    {
        // 获取所有异常
        AggregateException aggregateException = allTasks.Exception;

        foreach (var ex in aggregateException.InnerExceptions)
        {
            Console.WriteLine($"异常类型：{ex.GetType().Name}，消息：{ex.Message}");
        }
    }
}
```

### 取消令牌与异常

```csharp
public async Task LongRunningOperationAsync(CancellationToken cancellationToken)
{
    try
    {
        for (int i = 0; i < 100; i++)
        {
            // 检查取消请求
            cancellationToken.ThrowIfCancellationRequested();

            await Task.Delay(100, cancellationToken);
            Console.WriteLine($"进度：{i + 1}%");
        }
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("操作已取消");
        throw;
    }
}

// 使用示例
public async Task RunWithCancellationAsync()
{
    using var cts = new CancellationTokenSource();

    // 5 秒后自动取消
    cts.CancelAfter(TimeSpan.FromSeconds(5));

    try
    {
        await LongRunningOperationAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("任务被取消");
    }
}
```

## 全局异常处理

### 控制台应用程序

```csharp
class Program
{
    static void Main(string[] args)
    {
        // 处理未捕获的异常
        AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
        {
            var exception = e.ExceptionObject as Exception;
            Console.WriteLine($"未处理的异常：{exception?.Message}");
            Console.WriteLine($"堆栈跟踪：{exception?.StackTrace}");

            // 记录到日志文件
            File.AppendAllText("error.log",
                $"[{DateTime.Now}] {exception?.Message}\n{exception?.StackTrace}\n\n");
        };

        // 处理任务异常
        TaskScheduler.UnobservedTaskException += (sender, e) =>
        {
            Console.WriteLine($"未观察的任务异常：{e.Exception.Message}");
            e.SetObserved(); // 标记为已观察，防止进程终止
        };

        try
        {
            Run();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"程序错误：{ex.Message}");
        }
    }

    static void Run()
    {
        // 应用程序主逻辑
    }
}
```

### ASP.NET Core 异常处理

```csharp
// 异常处理中间件
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
            _logger.LogWarning(ex, "验证错误");
            await HandleExceptionAsync(context, ex, StatusCodes.Status400BadRequest);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "资源未找到");
            await HandleExceptionAsync(context, ex, StatusCodes.Status404NotFound);
        }
        catch (UnauthorizedException ex)
        {
            _logger.LogWarning(ex, "未授权访问");
            await HandleExceptionAsync(context, ex, StatusCodes.Status401Unauthorized);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "未处理的异常");
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

// 注册中间件
// app.UseMiddleware<ExceptionHandlingMiddleware>();
```

## 异常处理最佳实践

### 只捕获能够处理的异常

```csharp
// 不好的做法：捕获所有异常但不做任何处理
try
{
    ProcessData();
}
catch (Exception)
{
    // 吞掉异常，隐藏问题
}

// 好的做法：只捕获特定异常并适当处理
try
{
    ProcessData();
}
catch (FileNotFoundException ex)
{
    // 可以处理：使用默认数据
    Console.WriteLine($"配置文件未找到，使用默认配置：{ex.FileName}");
    LoadDefaultConfiguration();
}
catch (FormatException ex)
{
    // 可以处理：记录日志并返回错误
    _logger.LogWarning(ex, "数据格式错误");
    throw new ValidationException("输入数据格式无效", ex);
}
// 其他异常让它继续传播
```

### 使用特定异常类型

```csharp
// 不好的做法：使用通用 Exception
public void ValidateInput(string input)
{
    if (string.IsNullOrEmpty(input))
        throw new Exception("输入不能为空"); // 太笼统
}

// 好的做法：使用特定异常类型
public void ValidateInput(string input)
{
    if (input == null)
        throw new ArgumentNullException(nameof(input));

    if (input.Length == 0)
        throw new ArgumentException("输入不能为空字符串", nameof(input));

    if (input.Length > 100)
        throw new ArgumentOutOfRangeException(nameof(input), input.Length,
            "输入长度不能超过 100 个字符");
}
```

### 保留异常信息

```csharp
// 不好的做法：丢失原始异常信息
try
{
    ProcessData();
}
catch (Exception ex)
{
    throw new CustomException("处理失败"); // 丢失了原始异常
}

// 好的做法：保留原始异常作为 InnerException
try
{
    ProcessData();
}
catch (Exception ex)
{
    throw new CustomException("处理失败", ex); // 保留完整的异常链
}
```

### 不要用异常控制程序流程

```csharp
// 不好的做法：使用异常控制流程
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

// 好的做法：使用专门的方法
public bool TryParseInt(string input, out int result)
{
    return int.TryParse(input, out result);
}

// 不好的做法：使用异常检查集合元素
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

// 好的做法：使用 TryGetValue
public object GetValue(Dictionary<string, object> dict, string key)
{
    return dict.TryGetValue(key, out var value) ? value : null;
}
```

### 提供有意义的异常消息

```csharp
// 不好的做法：模糊的错误消息
throw new InvalidOperationException("错误");

// 好的做法：提供详细、有用的信息
throw new InvalidOperationException(
    $"无法处理订单 {orderId}：订单状态为 {currentStatus}，" +
    $"但只有状态为 {expectedStatus} 的订单才能处理");
```

### 记录异常日志

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
            _logger.LogInformation("开始处理订单 {OrderId}", orderId);

            var order = await GetOrderAsync(orderId);
            await ValidateOrderAsync(order);
            await ProcessPaymentAsync(order);

            _logger.LogInformation("订单 {OrderId} 处理成功", orderId);
            return order;
        }
        catch (OrderNotFoundException ex)
        {
            _logger.LogWarning(ex, "订单 {OrderId} 未找到", orderId);
            throw;
        }
        catch (PaymentException ex)
        {
            _logger.LogError(ex, "订单 {OrderId} 支付失败：{ErrorCode}",
                orderId, ex.ErrorCode);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "处理订单 {OrderId} 时发生未知错误", orderId);
            throw;
        }
    }
}
```

### 资源清理

```csharp
// 始终使用 using 或 try-finally 确保资源释放
public async Task ProcessFileAsync(string path)
{
    await using var stream = new FileStream(path, FileMode.Open);
    await using var reader = new StreamReader(stream);

    // 即使发生异常，资源也会被正确释放
    string content = await reader.ReadToEndAsync();
    ProcessContent(content);
}
```

### 避免在 finally 中抛出异常

```csharp
// 不好的做法：finally 中的异常会覆盖原始异常
try
{
    DoSomething();
}
finally
{
    throw new Exception("清理失败"); // 会覆盖 DoSomething 的异常
}

// 好的做法：在 finally 中捕获异常
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
        // 记录日志但不重新抛出
        _logger.LogWarning(ex, "清理资源时发生错误");
    }
}
```

## 实践示例

### 示例 1：文件处理服务

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

        _logger.LogInformation("开始处理文件：{FilePath}", filePath);

        try
        {
            // 检查文件是否存在
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("指定的文件不存在", filePath);
            }

            // 读取文件内容
            string content;
            try
            {
                content = await File.ReadAllTextAsync(filePath);
            }
            catch (IOException ex)
            {
                throw new FileProcessingException(
                    $"读取文件 {filePath} 时发生 IO 错误", ex);
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new FileProcessingException(
                    $"没有权限访问文件 {filePath}", ex);
            }

            // 验证内容
            if (string.IsNullOrWhiteSpace(content))
            {
                throw new ValidationException("filePath", filePath, "文件内容为空");
            }

            // 处理内容
            var result = await ProcessContentAsync(content);

            _logger.LogInformation("文件处理成功：{FilePath}", filePath);
            return result;
        }
        catch (FileProcessingException)
        {
            throw; // 已经是正确的异常类型，直接重新抛出
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "处理文件时发生未知错误：{FilePath}", filePath);
            throw new FileProcessingException($"处理文件 {filePath} 失败", ex);
        }
    }

    private async Task<ProcessingResult> ProcessContentAsync(string content)
    {
        // 处理逻辑...
        await Task.Delay(100); // 模拟处理
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

### 示例 2：带重试机制的 HTTP 客户端

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
                _logger.LogDebug("尝试请求 {Url}，第 {Attempt} 次", url, attempt);

                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                return JsonSerializer.Deserialize<T>(content);
            }
            catch (HttpRequestException ex) when (IsTransientError(ex))
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "请求 {Url} 失败（第 {Attempt} 次），将在 {Delay} 后重试",
                    url, attempt, delay);

                if (attempt < _maxRetries)
                {
                    await Task.Delay(delay, cancellationToken);
                    delay *= 2; // 指数退避
                }
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                // 超时
                lastException = ex;
                _logger.LogWarning("请求 {Url} 超时（第 {Attempt} 次）", url, attempt);

                if (attempt < _maxRetries)
                {
                    await Task.Delay(delay, cancellationToken);
                    delay *= 2;
                }
            }
            catch (JsonException ex)
            {
                // JSON 解析错误不应重试
                _logger.LogError(ex, "解析响应 JSON 失败：{Url}", url);
                throw new ApiException($"无法解析来自 {url} 的响应", ex);
            }
        }

        // 所有重试都失败
        _logger.LogError(lastException, "请求 {Url} 在 {MaxRetries} 次重试后仍然失败",
            url, _maxRetries);
        throw new ApiException($"请求 {url} 失败，已重试 {_maxRetries} 次", lastException);
    }

    private bool IsTransientError(HttpRequestException ex)
    {
        // 判断是否为临时性错误（可以重试）
        if (ex.StatusCode == null) return true; // 网络错误

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

### 示例 3：验证器与结果模式

```csharp
// Result 模式：替代异常的另一种错误处理方式
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

// 使用 Result 模式的服务
public class UserService
{
    public async Task<Result<User>> CreateUserAsync(CreateUserRequest request)
    {
        // 验证
        var validationResult = ValidateRequest(request);
        if (!validationResult.IsSuccess)
        {
            return Result<User>.Failure(validationResult.Error);
        }

        try
        {
            // 检查用户是否已存在
            if (await UserExistsAsync(request.Email))
            {
                return Result<User>.Failure($"邮箱 {request.Email} 已被注册");
            }

            // 创建用户
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
            return Result<User>.Failure("创建用户时发生错误", ex);
        }
    }

    private Result<bool> ValidateRequest(CreateUserRequest request)
    {
        if (request == null)
            return Result<bool>.Failure("请求不能为空");

        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<bool>.Failure("用户名不能为空");

        if (string.IsNullOrWhiteSpace(request.Email))
            return Result<bool>.Failure("邮箱不能为空");

        if (!IsValidEmail(request.Email))
            return Result<bool>.Failure("邮箱格式无效");

        return Result<bool>.Success(true);
    }

    private bool IsValidEmail(string email)
    {
        return email.Contains("@") && email.Contains(".");
    }

    private Task<bool> UserExistsAsync(string email) => Task.FromResult(false);
    private Task SaveUserAsync(User user) => Task.CompletedTask;
}

// 使用示例
public async Task HandleCreateUserAsync()
{
    var service = new UserService();
    var request = new CreateUserRequest { Name = "张三", Email = "zhang@example.com" };

    var result = await service.CreateUserAsync(request);

    result.Match(
        onSuccess: user =>
        {
            Console.WriteLine($"用户创建成功：{user.Name} ({user.Email})");
            return true;
        },
        onFailure: error =>
        {
            Console.WriteLine($"创建用户失败：{error}");
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

## 总结

本文详细介绍了 C# 异常处理的各个方面：

1. **try-catch-finally**：基本的异常处理结构，包括多个 catch 块、异常顺序和 finally 块
2. **异常类型**：系统异常层次结构和常见异常类型的使用场景
3. **抛出异常**：throw 语句的使用，throw 和 throw ex 的区别
4. **异常过滤器**：使用 when 子句进行条件性异常捕获
5. **自定义异常**：创建领域特定的异常类，包含错误代码和额外属性
6. **资源清理**：using 语句、IDisposable 和 IAsyncDisposable 接口
7. **异步异常处理**：async/await 中的异常处理，Task.WhenAll 和取消令牌
8. **全局异常处理**：控制台应用和 ASP.NET Core 的全局异常处理策略
9. **最佳实践**：编写健壮、可维护的异常处理代码的指导原则

掌握异常处理是编写可靠、健壮应用程序的关键。合理使用异常处理机制可以使程序更加稳定，错误信息更加清晰，调试过程更加高效。

## 下一步学习

- 日志框架（Serilog、NLog）
- 分布式系统中的错误处理
- 断路器模式（Polly）
- 单元测试中的异常测试
- 性能分析与异常开销
