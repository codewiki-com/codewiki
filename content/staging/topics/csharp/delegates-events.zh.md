---
title: 委托与事件
description: C#委托与事件完全指南，Func、Action、Predicate与事件模式
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - 委托
  - 事件
  - 回调
status: imported
origin: old/src/content/docs/csharp/delegates-events.zh.md
divergence: 0.096
issues: []
legacy:
  category: CSharp
  subcategory: 核心概念
  order: 5
  lastUpdated: 2026-01-07
---

委托（Delegate）和事件（Event）是 C# 中实现回调机制和观察者模式的核心特性。它们使得代码更加灵活、解耦，是构建可扩展应用程序的重要工具。

## 委托基础

### 什么是委托

委托是一种引用类型，它定义了方法的签名。委托实例可以持有对具有兼容签名的方法的引用，从而实现将方法作为参数传递。

```csharp
// 声明委托类型
public delegate int MathOperation(int x, int y);

public class Calculator
{
    // 定义符合委托签名的方法
    public static int Add(int a, int b) => a + b;
    public static int Subtract(int a, int b) => a - b;
    public static int Multiply(int a, int b) => a * b;
    public static int Divide(int a, int b) => b != 0 ? a / b : 0;
}

// 使用委托
class Program
{
    static void Main()
    {
        // 创建委托实例
        MathOperation operation = Calculator.Add;
        Console.WriteLine($"10 + 5 = {operation(10, 5)}");  // 输出: 15

        // 重新赋值为其他方法
        operation = Calculator.Multiply;
        Console.WriteLine($"10 * 5 = {operation(10, 5)}");  // 输出: 50

        // 将委托作为参数传递
        PerformOperation(10, 5, Calculator.Subtract);  // 输出: 5
    }

    static void PerformOperation(int x, int y, MathOperation op)
    {
        int result = op(x, y);
        Console.WriteLine($"结果: {result}");
    }
}
```

### 委托的实例化方式

```csharp
public delegate void MessageHandler(string message);

public class MessageProcessor
{
    public void ShowMessage(string msg) => Console.WriteLine($"消息: {msg}");
    public static void LogMessage(string msg) => Console.WriteLine($"日志: {msg}");
}

class Program
{
    static void Main()
    {
        var processor = new MessageProcessor();

        // 方式1: 使用 new 关键字
        MessageHandler handler1 = new MessageHandler(processor.ShowMessage);

        // 方式2: 直接赋值（编译器自动推断）
        MessageHandler handler2 = processor.ShowMessage;

        // 方式3: 静态方法
        MessageHandler handler3 = MessageProcessor.LogMessage;

        // 方式4: 匿名方法
        MessageHandler handler4 = delegate(string msg)
        {
            Console.WriteLine($"匿名方法: {msg}");
        };

        // 方式5: Lambda 表达式
        MessageHandler handler5 = msg => Console.WriteLine($"Lambda: {msg}");

        // 调用委托
        handler1("Hello");
        handler2("World");
        handler3("Log Entry");
        handler4("Anonymous");
        handler5("Lambda Expression");
    }
}
```

## 内置委托类型

C# 提供了三个常用的泛型委托类型，覆盖了大多数使用场景。

### Action 委托

`Action` 表示不返回值的方法（返回 void）。

```csharp
// Action 无参数
Action greet = () => Console.WriteLine("Hello!");
greet();

// Action<T> 单个参数
Action<string> printMessage = message => Console.WriteLine(message);
printMessage("Welcome to C#");

// Action<T1, T2, ...> 多个参数（最多16个）
Action<string, int> repeatMessage = (msg, times) =>
{
    for (int i = 0; i < times; i++)
        Console.WriteLine(msg);
};
repeatMessage("重复", 3);

// 实际应用: 回调函数
public class DataProcessor
{
    public void ProcessData(string[] data, Action<string> onItemProcessed)
    {
        foreach (var item in data)
        {
            // 处理数据...
            Thread.Sleep(100);  // 模拟处理时间
            onItemProcessed?.Invoke($"已处理: {item}");
        }
    }
}

// 使用
var processor = new DataProcessor();
processor.ProcessData(
    new[] { "项目A", "项目B", "项目C" },
    msg => Console.WriteLine(msg)
);
```

### Func 委托

`Func` 表示有返回值的方法，最后一个泛型参数是返回类型。

```csharp
// Func<TResult> 无参数有返回值
Func<int> getRandomNumber = () => new Random().Next(1, 100);
Console.WriteLine($"随机数: {getRandomNumber()}");

// Func<T, TResult> 一个参数
Func<int, int> square = x => x * x;
Console.WriteLine($"5的平方: {square(5)}");

// Func<T1, T2, TResult> 多个参数
Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine($"3 + 4 = {add(3, 4)}");

// Func<string, int, string> 不同类型参数
Func<string, int, string> repeat = (str, count) => string.Concat(Enumerable.Repeat(str, count));
Console.WriteLine(repeat("Ha", 3));  // 输出: HaHaHa

// 实际应用: 数据转换
public class DataTransformer
{
    public List<TOutput> Transform<TInput, TOutput>(
        List<TInput> source,
        Func<TInput, TOutput> transformer)
    {
        var result = new List<TOutput>();
        foreach (var item in source)
        {
            result.Add(transformer(item));
        }
        return result;
    }
}

// 使用
var transformer = new DataTransformer();
var numbers = new List<int> { 1, 2, 3, 4, 5 };
var squares = transformer.Transform(numbers, x => x * x);
// squares: [1, 4, 9, 16, 25]

var names = new List<string> { "alice", "bob", "charlie" };
var uppercased = transformer.Transform(names, s => s.ToUpper());
// uppercased: ["ALICE", "BOB", "CHARLIE"]
```

### Predicate 委托

`Predicate<T>` 是一个返回 bool 的特殊委托，常用于条件判断。

```csharp
// Predicate<T> 定义条件
Predicate<int> isEven = x => x % 2 == 0;
Predicate<int> isPositive = x => x > 0;
Predicate<string> isEmpty = s => string.IsNullOrEmpty(s);

Console.WriteLine($"4 是偶数: {isEven(4)}");      // True
Console.WriteLine($"-5 是正数: {isPositive(-5)}"); // False

// 常与 List<T> 方法配合使用
var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// Find - 查找第一个匹配项
int firstEven = numbers.Find(isEven);  // 2

// FindAll - 查找所有匹配项
List<int> allEvens = numbers.FindAll(isEven);  // [2, 4, 6, 8, 10]

// FindIndex - 查找索引
int index = numbers.FindIndex(x => x > 5);  // 5

// Exists - 检查是否存在
bool hasNegative = numbers.Exists(x => x < 0);  // False

// TrueForAll - 检查是否全部满足
bool allPositive = numbers.TrueForAll(isPositive);  // True

// RemoveAll - 移除所有匹配项
numbers.RemoveAll(isEven);  // numbers: [1, 3, 5, 7, 9]
```

### 委托类型对比

```csharp
// 三种委托的对比
public class DelegateComparison
{
    // Action: 执行操作，无返回值
    public void ProcessItems(List<int> items, Action<int> action)
    {
        foreach (var item in items)
            action(item);
    }

    // Func: 转换数据，有返回值
    public List<TResult> MapItems<T, TResult>(List<T> items, Func<T, TResult> mapper)
    {
        return items.Select(mapper).ToList();
    }

    // Predicate: 过滤条件，返回 bool
    public List<T> FilterItems<T>(List<T> items, Predicate<T> predicate)
    {
        return items.FindAll(predicate);
    }
}

// 使用示例
var demo = new DelegateComparison();
var numbers = new List<int> { 1, 2, 3, 4, 5 };

// Action: 打印每个数字
demo.ProcessItems(numbers, n => Console.WriteLine(n));

// Func: 转换为字符串
var strings = demo.MapItems(numbers, n => $"Number: {n}");

// Predicate: 过滤偶数
var evens = demo.FilterItems(numbers, n => n % 2 == 0);
```

## 多播委托

委托可以持有多个方法的引用，当调用委托时，所有方法按顺序执行。

```csharp
public delegate void NotificationHandler(string message);

public class NotificationService
{
    public void SendEmail(string msg) => Console.WriteLine($"邮件通知: {msg}");
    public void SendSMS(string msg) => Console.WriteLine($"短信通知: {msg}");
    public void SendPush(string msg) => Console.WriteLine($"推送通知: {msg}");
    public void LogNotification(string msg) => Console.WriteLine($"记录日志: {msg}");
}

class Program
{
    static void Main()
    {
        var service = new NotificationService();

        // 创建多播委托
        NotificationHandler handler = service.SendEmail;
        handler += service.SendSMS;
        handler += service.SendPush;
        handler += service.LogNotification;

        // 调用时所有方法按顺序执行
        Console.WriteLine("=== 发送通知 ===");
        handler("您的订单已发货");

        // 输出:
        // === 发送通知 ===
        // 邮件通知: 您的订单已发货
        // 短信通知: 您的订单已发货
        // 推送通知: 您的订单已发货
        // 记录日志: 您的订单已发货

        // 移除某个方法
        handler -= service.SendSMS;
        Console.WriteLine("\n=== 移除短信后再次发送 ===");
        handler("您的包裹已签收");

        // 获取调用列表
        Console.WriteLine($"\n委托包含 {handler.GetInvocationList().Length} 个方法");
    }
}
```

### 多播委托的返回值处理

```csharp
public delegate int Calculator(int x, int y);

class Program
{
    static int Add(int x, int y)
    {
        Console.WriteLine($"Add: {x} + {y}");
        return x + y;
    }

    static int Multiply(int x, int y)
    {
        Console.WriteLine($"Multiply: {x} * {y}");
        return x * y;
    }

    static int Subtract(int x, int y)
    {
        Console.WriteLine($"Subtract: {x} - {y}");
        return x - y;
    }

    static void Main()
    {
        Calculator calc = Add;
        calc += Multiply;
        calc += Subtract;

        // 直接调用只能获取最后一个方法的返回值
        int result = calc(10, 5);
        Console.WriteLine($"直接调用结果: {result}");  // 5 (Subtract的结果)

        // 要获取所有返回值，需要遍历调用列表
        Console.WriteLine("\n=== 获取所有返回值 ===");
        var delegates = calc.GetInvocationList();
        var results = new List<int>();

        foreach (Calculator del in delegates)
        {
            int r = del(10, 5);
            results.Add(r);
            Console.WriteLine($"返回值: {r}");
        }

        Console.WriteLine($"所有结果: [{string.Join(", ", results)}]");
        Console.WriteLine($"结果之和: {results.Sum()}");
    }
}
```

### 多播委托的异常处理

```csharp
public delegate void TaskHandler();

class Program
{
    static void Task1() => Console.WriteLine("任务1完成");
    static void Task2() => throw new Exception("任务2失败");
    static void Task3() => Console.WriteLine("任务3完成");

    static void Main()
    {
        TaskHandler handler = Task1;
        handler += Task2;
        handler += Task3;

        // 不安全的调用 - Task2抛出异常后Task3不会执行
        try
        {
            handler();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"捕获异常: {ex.Message}");
        }

        Console.WriteLine("\n=== 安全调用所有委托 ===");

        // 安全的调用方式
        SafeInvoke(handler);
    }

    static void SafeInvoke(TaskHandler handler)
    {
        if (handler == null) return;

        var exceptions = new List<Exception>();

        foreach (TaskHandler del in handler.GetInvocationList())
        {
            try
            {
                del();
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
                Console.WriteLine($"[错误] {ex.Message}");
            }
        }

        if (exceptions.Count > 0)
        {
            Console.WriteLine($"\n共有 {exceptions.Count} 个任务失败");
            // 可选: 抛出 AggregateException
            // throw new AggregateException(exceptions);
        }
    }
}
```

## 事件基础

事件是委托的封装，提供了发布-订阅模式的实现。事件只能在声明它的类内部触发。

### 事件声明与使用

```csharp
// 定义事件参数类
public class OrderEventArgs : EventArgs
{
    public string OrderId { get; }
    public decimal Amount { get; }
    public DateTime OrderTime { get; }

    public OrderEventArgs(string orderId, decimal amount)
    {
        OrderId = orderId;
        Amount = amount;
        OrderTime = DateTime.Now;
    }
}

// 发布者类
public class OrderProcessor
{
    // 使用标准事件模式声明事件
    public event EventHandler<OrderEventArgs>? OrderCreated;
    public event EventHandler<OrderEventArgs>? OrderCompleted;
    public event EventHandler<OrderEventArgs>? OrderCancelled;

    // 创建订单
    public void CreateOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"创建订单: {orderId}, 金额: {amount:C}");

        // 触发事件
        OnOrderCreated(new OrderEventArgs(orderId, amount));
    }

    // 完成订单
    public void CompleteOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"完成订单: {orderId}");
        OnOrderCompleted(new OrderEventArgs(orderId, amount));
    }

    // 取消订单
    public void CancelOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"取消订单: {orderId}");
        OnOrderCancelled(new OrderEventArgs(orderId, amount));
    }

    // 受保护的虚方法触发事件（标准模式）
    protected virtual void OnOrderCreated(OrderEventArgs e)
    {
        OrderCreated?.Invoke(this, e);
    }

    protected virtual void OnOrderCompleted(OrderEventArgs e)
    {
        OrderCompleted?.Invoke(this, e);
    }

    protected virtual void OnOrderCancelled(OrderEventArgs e)
    {
        OrderCancelled?.Invoke(this, e);
    }
}

// 订阅者类
public class EmailNotifier
{
    public void OnOrderCreated(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"[邮件] 新订单通知 - 订单号: {e.OrderId}, 金额: {e.Amount:C}");
    }

    public void OnOrderCompleted(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"[邮件] 订单完成通知 - 订单号: {e.OrderId}");
    }
}

public class InventoryManager
{
    public void OnOrderCreated(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"[库存] 预留库存 - 订单号: {e.OrderId}");
    }

    public void OnOrderCancelled(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"[库存] 释放库存 - 订单号: {e.OrderId}");
    }
}

public class AnalyticsTracker
{
    public void TrackOrder(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"[分析] 记录订单数据 - 金额: {e.Amount:C}, 时间: {e.OrderTime}");
    }
}

// 使用示例
class Program
{
    static void Main()
    {
        // 创建发布者
        var processor = new OrderProcessor();

        // 创建订阅者
        var emailNotifier = new EmailNotifier();
        var inventoryManager = new InventoryManager();
        var analytics = new AnalyticsTracker();

        // 订阅事件
        processor.OrderCreated += emailNotifier.OnOrderCreated;
        processor.OrderCreated += inventoryManager.OnOrderCreated;
        processor.OrderCreated += analytics.TrackOrder;

        processor.OrderCompleted += emailNotifier.OnOrderCompleted;
        processor.OrderCompleted += analytics.TrackOrder;

        processor.OrderCancelled += inventoryManager.OnOrderCancelled;

        // 触发事件
        Console.WriteLine("=== 创建订单 ===");
        processor.CreateOrder("ORD-001", 299.99m);

        Console.WriteLine("\n=== 完成订单 ===");
        processor.CompleteOrder("ORD-001", 299.99m);

        Console.WriteLine("\n=== 取消订单 ===");
        processor.CancelOrder("ORD-002", 159.99m);

        // 取消订阅
        processor.OrderCreated -= emailNotifier.OnOrderCreated;
    }
}
```

### 事件与委托的区别

```csharp
public class EventVsDelegate
{
    // 委托字段 - 外部可以直接调用和赋值
    public Action<string>? OnMessageDelegate;

    // 事件 - 外部只能 += 或 -=
    public event Action<string>? OnMessageEvent;

    public void TriggerEvent(string message)
    {
        OnMessageEvent?.Invoke(message);
    }
}

class Program
{
    static void Main()
    {
        var obj = new EventVsDelegate();

        // 委托可以被外部直接赋值（覆盖其他订阅者）
        obj.OnMessageDelegate = msg => Console.WriteLine($"处理器1: {msg}");
        obj.OnMessageDelegate += msg => Console.WriteLine($"处理器2: {msg}");
        obj.OnMessageDelegate = msg => Console.WriteLine($"处理器3: {msg}"); // 覆盖了1和2！
        obj.OnMessageDelegate("Hello");  // 只有处理器3执行

        // 事件只能添加或移除
        obj.OnMessageEvent += msg => Console.WriteLine($"订阅者1: {msg}");
        obj.OnMessageEvent += msg => Console.WriteLine($"订阅者2: {msg}");
        // obj.OnMessageEvent = msg => Console.WriteLine("Error");  // 编译错误！
        // obj.OnMessageEvent("Hello");  // 编译错误！不能在外部调用

        obj.TriggerEvent("Hello");  // 订阅者1和2都执行
    }
}
```

## 自定义事件模式

### 自定义事件访问器

```csharp
public class CustomEventExample
{
    // 私有委托字段
    private EventHandler<string>? _messageReceived;

    // 带访问器的事件
    public event EventHandler<string>? MessageReceived
    {
        add
        {
            Console.WriteLine("添加订阅者");
            _messageReceived += value;
        }
        remove
        {
            Console.WriteLine("移除订阅者");
            _messageReceived -= value;
        }
    }

    public void SendMessage(string message)
    {
        _messageReceived?.Invoke(this, message);
    }
}

// 线程安全的事件实现
public class ThreadSafeEventExample
{
    private readonly object _lock = new object();
    private EventHandler? _statusChanged;

    public event EventHandler? StatusChanged
    {
        add
        {
            lock (_lock)
            {
                _statusChanged += value;
            }
        }
        remove
        {
            lock (_lock)
            {
                _statusChanged -= value;
            }
        }
    }

    protected virtual void OnStatusChanged()
    {
        EventHandler? handler;
        lock (_lock)
        {
            handler = _statusChanged;
        }
        handler?.Invoke(this, EventArgs.Empty);
    }
}
```

### 泛型事件参数

```csharp
// 泛型事件参数基类
public class DataEventArgs<T> : EventArgs
{
    public T Data { get; }
    public DateTime Timestamp { get; }

    public DataEventArgs(T data)
    {
        Data = data;
        Timestamp = DateTime.Now;
    }
}

// 使用泛型事件参数
public class DataService<T>
{
    public event EventHandler<DataEventArgs<T>>? DataReceived;
    public event EventHandler<DataEventArgs<IEnumerable<T>>>? BatchDataReceived;

    public void ReceiveData(T data)
    {
        Console.WriteLine($"接收数据: {data}");
        DataReceived?.Invoke(this, new DataEventArgs<T>(data));
    }

    public void ReceiveBatch(IEnumerable<T> data)
    {
        Console.WriteLine($"接收批量数据: {data.Count()} 条");
        BatchDataReceived?.Invoke(this, new DataEventArgs<IEnumerable<T>>(data));
    }
}

// 使用示例
class Program
{
    static void Main()
    {
        var stringService = new DataService<string>();
        var intService = new DataService<int>();

        stringService.DataReceived += (s, e) =>
            Console.WriteLine($"收到字符串: {e.Data} at {e.Timestamp}");

        intService.DataReceived += (s, e) =>
            Console.WriteLine($"收到数字: {e.Data} at {e.Timestamp}");

        intService.BatchDataReceived += (s, e) =>
            Console.WriteLine($"批量数据: [{string.Join(", ", e.Data)}]");

        stringService.ReceiveData("Hello");
        intService.ReceiveData(42);
        intService.ReceiveBatch(new[] { 1, 2, 3, 4, 5 });
    }
}
```

## 实践应用

### 观察者模式实现

```csharp
// 股票价格监控系统
public class StockPriceChangedEventArgs : EventArgs
{
    public string Symbol { get; }
    public decimal OldPrice { get; }
    public decimal NewPrice { get; }
    public decimal ChangePercent => OldPrice == 0 ? 0 : (NewPrice - OldPrice) / OldPrice * 100;

    public StockPriceChangedEventArgs(string symbol, decimal oldPrice, decimal newPrice)
    {
        Symbol = symbol;
        OldPrice = oldPrice;
        NewPrice = newPrice;
    }
}

public class Stock
{
    private decimal _price;

    public string Symbol { get; }

    public decimal Price
    {
        get => _price;
        set
        {
            if (_price != value)
            {
                var oldPrice = _price;
                _price = value;
                OnPriceChanged(new StockPriceChangedEventArgs(Symbol, oldPrice, value));
            }
        }
    }

    public event EventHandler<StockPriceChangedEventArgs>? PriceChanged;

    public Stock(string symbol, decimal initialPrice)
    {
        Symbol = symbol;
        _price = initialPrice;
    }

    protected virtual void OnPriceChanged(StockPriceChangedEventArgs e)
    {
        PriceChanged?.Invoke(this, e);
    }
}

// 价格监控器
public class PriceAlertMonitor
{
    private readonly decimal _threshold;

    public PriceAlertMonitor(decimal thresholdPercent)
    {
        _threshold = thresholdPercent;
    }

    public void OnPriceChanged(object? sender, StockPriceChangedEventArgs e)
    {
        if (Math.Abs(e.ChangePercent) >= _threshold)
        {
            var direction = e.ChangePercent > 0 ? "上涨" : "下跌";
            Console.WriteLine($"[警报] {e.Symbol} {direction} {Math.Abs(e.ChangePercent):F2}%! " +
                            $"价格: {e.OldPrice:C} -> {e.NewPrice:C}");
        }
    }
}

// 价格记录器
public class PriceLogger
{
    private readonly List<StockPriceChangedEventArgs> _history = new();

    public void OnPriceChanged(object? sender, StockPriceChangedEventArgs e)
    {
        _history.Add(e);
        Console.WriteLine($"[日志] {DateTime.Now:HH:mm:ss} - {e.Symbol}: {e.NewPrice:C}");
    }

    public void PrintHistory()
    {
        Console.WriteLine("\n=== 价格历史 ===");
        foreach (var record in _history)
        {
            Console.WriteLine($"{record.Symbol}: {record.OldPrice:C} -> {record.NewPrice:C} " +
                            $"({record.ChangePercent:+0.00;-0.00}%)");
        }
    }
}

// 使用示例
class Program
{
    static void Main()
    {
        // 创建股票
        var apple = new Stock("AAPL", 150.00m);
        var google = new Stock("GOOGL", 2800.00m);

        // 创建观察者
        var alertMonitor = new PriceAlertMonitor(2.0m);  // 2%阈值
        var logger = new PriceLogger();

        // 订阅事件
        apple.PriceChanged += alertMonitor.OnPriceChanged;
        apple.PriceChanged += logger.OnPriceChanged;
        google.PriceChanged += alertMonitor.OnPriceChanged;
        google.PriceChanged += logger.OnPriceChanged;

        // 模拟价格变化
        Console.WriteLine("=== 模拟股价变化 ===\n");

        apple.Price = 152.00m;   // 1.33% 上涨
        apple.Price = 148.00m;   // 2.63% 下跌 - 触发警报
        google.Price = 2850.00m; // 1.79% 上涨
        google.Price = 2920.00m; // 2.46% 上涨 - 触发警报

        logger.PrintHistory();
    }
}
```

### 异步事件处理

```csharp
public class AsyncEventArgs : EventArgs
{
    public string Message { get; }
    public TaskCompletionSource<bool> Completion { get; } = new();

    public AsyncEventArgs(string message)
    {
        Message = message;
    }
}

public class AsyncEventPublisher
{
    public event Func<object, AsyncEventArgs, Task>? AsyncEvent;

    public async Task RaiseEventAsync(string message)
    {
        var args = new AsyncEventArgs(message);

        if (AsyncEvent != null)
        {
            var handlers = AsyncEvent.GetInvocationList()
                .Cast<Func<object, AsyncEventArgs, Task>>();

            // 并行执行所有处理器
            var tasks = handlers.Select(handler => handler(this, args));
            await Task.WhenAll(tasks);
        }
    }

    // 顺序执行版本
    public async Task RaiseEventSequentialAsync(string message)
    {
        var args = new AsyncEventArgs(message);

        if (AsyncEvent != null)
        {
            var handlers = AsyncEvent.GetInvocationList()
                .Cast<Func<object, AsyncEventArgs, Task>>();

            foreach (var handler in handlers)
            {
                await handler(this, args);
            }
        }
    }
}

// 异步订阅者
public class AsyncSubscriber
{
    private readonly string _name;
    private readonly int _delay;

    public AsyncSubscriber(string name, int delayMs)
    {
        _name = name;
        _delay = delayMs;
    }

    public async Task HandleEventAsync(object sender, AsyncEventArgs e)
    {
        Console.WriteLine($"[{_name}] 开始处理: {e.Message}");
        await Task.Delay(_delay);
        Console.WriteLine($"[{_name}] 处理完成 (耗时 {_delay}ms)");
    }
}

// 使用示例
class Program
{
    static async Task Main()
    {
        var publisher = new AsyncEventPublisher();

        var sub1 = new AsyncSubscriber("处理器A", 1000);
        var sub2 = new AsyncSubscriber("处理器B", 500);
        var sub3 = new AsyncSubscriber("处理器C", 800);

        publisher.AsyncEvent += sub1.HandleEventAsync;
        publisher.AsyncEvent += sub2.HandleEventAsync;
        publisher.AsyncEvent += sub3.HandleEventAsync;

        Console.WriteLine("=== 并行执行 ===");
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await publisher.RaiseEventAsync("并行消息");
        Console.WriteLine($"总耗时: {sw.ElapsedMilliseconds}ms\n");  // 约1000ms

        Console.WriteLine("=== 顺序执行 ===");
        sw.Restart();
        await publisher.RaiseEventSequentialAsync("顺序消息");
        Console.WriteLine($"总耗时: {sw.ElapsedMilliseconds}ms");  // 约2300ms
    }
}
```

### 弱事件模式

防止内存泄漏的弱引用事件实现。

```csharp
public class WeakEventManager<TEventArgs> where TEventArgs : EventArgs
{
    private readonly List<WeakReference<EventHandler<TEventArgs>>> _handlers = new();

    public void AddHandler(EventHandler<TEventArgs> handler)
    {
        CleanupDeadReferences();
        _handlers.Add(new WeakReference<EventHandler<TEventArgs>>(handler));
    }

    public void RemoveHandler(EventHandler<TEventArgs> handler)
    {
        _handlers.RemoveAll(wr =>
        {
            if (wr.TryGetTarget(out var target))
            {
                return target == handler;
            }
            return true;  // 移除死引用
        });
    }

    public void Raise(object sender, TEventArgs args)
    {
        CleanupDeadReferences();

        foreach (var weakRef in _handlers.ToList())
        {
            if (weakRef.TryGetTarget(out var handler))
            {
                handler(sender, args);
            }
        }
    }

    private void CleanupDeadReferences()
    {
        _handlers.RemoveAll(wr => !wr.TryGetTarget(out _));
    }
}

// 使用弱事件的发布者
public class WeakEventPublisher
{
    private readonly WeakEventManager<EventArgs> _eventManager = new();

    public event EventHandler<EventArgs> WeakEvent
    {
        add => _eventManager.AddHandler(value);
        remove => _eventManager.RemoveHandler(value);
    }

    public void RaiseEvent()
    {
        _eventManager.Raise(this, EventArgs.Empty);
    }
}
```

### 事件聚合器模式

用于解耦组件间通信的事件聚合器。

```csharp
// 事件接口
public interface IEvent { }

// 具体事件
public class UserLoggedInEvent : IEvent
{
    public string Username { get; }
    public DateTime LoginTime { get; }

    public UserLoggedInEvent(string username)
    {
        Username = username;
        LoginTime = DateTime.Now;
    }
}

public class OrderPlacedEvent : IEvent
{
    public string OrderId { get; }
    public decimal Amount { get; }

    public OrderPlacedEvent(string orderId, decimal amount)
    {
        OrderId = orderId;
        Amount = amount;
    }
}

// 事件聚合器
public class EventAggregator
{
    private static readonly Lazy<EventAggregator> _instance =
        new(() => new EventAggregator());

    public static EventAggregator Instance => _instance.Value;

    private readonly Dictionary<Type, List<object>> _subscribers = new();
    private readonly object _lock = new();

    private EventAggregator() { }

    public void Subscribe<TEvent>(Action<TEvent> handler) where TEvent : IEvent
    {
        lock (_lock)
        {
            var eventType = typeof(TEvent);
            if (!_subscribers.ContainsKey(eventType))
            {
                _subscribers[eventType] = new List<object>();
            }
            _subscribers[eventType].Add(handler);
        }
    }

    public void Unsubscribe<TEvent>(Action<TEvent> handler) where TEvent : IEvent
    {
        lock (_lock)
        {
            var eventType = typeof(TEvent);
            if (_subscribers.ContainsKey(eventType))
            {
                _subscribers[eventType].Remove(handler);
            }
        }
    }

    public void Publish<TEvent>(TEvent eventData) where TEvent : IEvent
    {
        List<object> handlers;

        lock (_lock)
        {
            var eventType = typeof(TEvent);
            if (!_subscribers.ContainsKey(eventType))
                return;

            handlers = _subscribers[eventType].ToList();
        }

        foreach (var handler in handlers)
        {
            ((Action<TEvent>)handler)(eventData);
        }
    }
}

// 组件示例
public class LoginComponent
{
    public void Login(string username)
    {
        Console.WriteLine($"用户 {username} 登录");
        EventAggregator.Instance.Publish(new UserLoggedInEvent(username));
    }
}

public class OrderComponent
{
    public void PlaceOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"创建订单 {orderId}");
        EventAggregator.Instance.Publish(new OrderPlacedEvent(orderId, amount));
    }
}

public class NotificationComponent
{
    public NotificationComponent()
    {
        // 订阅事件
        EventAggregator.Instance.Subscribe<UserLoggedInEvent>(OnUserLoggedIn);
        EventAggregator.Instance.Subscribe<OrderPlacedEvent>(OnOrderPlaced);
    }

    private void OnUserLoggedIn(UserLoggedInEvent e)
    {
        Console.WriteLine($"[通知] 欢迎回来, {e.Username}!");
    }

    private void OnOrderPlaced(OrderPlacedEvent e)
    {
        Console.WriteLine($"[通知] 订单 {e.OrderId} 已确认, 金额: {e.Amount:C}");
    }
}

public class AnalyticsComponent
{
    public AnalyticsComponent()
    {
        EventAggregator.Instance.Subscribe<UserLoggedInEvent>(OnUserLoggedIn);
        EventAggregator.Instance.Subscribe<OrderPlacedEvent>(OnOrderPlaced);
    }

    private void OnUserLoggedIn(UserLoggedInEvent e)
    {
        Console.WriteLine($"[分析] 记录登录: {e.Username} at {e.LoginTime}");
    }

    private void OnOrderPlaced(OrderPlacedEvent e)
    {
        Console.WriteLine($"[分析] 记录订单: {e.OrderId}, 金额: {e.Amount}");
    }
}

// 使用示例
class Program
{
    static void Main()
    {
        // 初始化订阅者组件
        var notification = new NotificationComponent();
        var analytics = new AnalyticsComponent();

        // 创建发布者组件
        var login = new LoginComponent();
        var order = new OrderComponent();

        Console.WriteLine("=== 用户登录 ===");
        login.Login("张三");

        Console.WriteLine("\n=== 创建订单 ===");
        order.PlaceOrder("ORD-2024-001", 599.99m);
    }
}
```

## 最佳实践

### 事件命名规范

```csharp
public class EventNamingConventions
{
    // 事件名称使用动词或动词短语
    public event EventHandler? Loading;        // 正在进行
    public event EventHandler? Loaded;         // 已完成
    public event EventHandler? LoadFailed;     // 失败

    // 使用 Before/After 前缀表示时机
    public event EventHandler? BeforeClose;
    public event EventHandler? AfterClose;

    // 使用 Changing/Changed 表示状态变化
    public event EventHandler? PropertyChanging;
    public event EventHandler? PropertyChanged;

    // 事件参数类以 EventArgs 结尾
    // 正确: OrderCreatedEventArgs
    // 错误: OrderCreatedArgs, OrderEventData

    // 触发方法使用 On 前缀
    protected virtual void OnLoading(EventArgs e) { }
    protected virtual void OnLoaded(EventArgs e) { }
}
```

### 空检查与线程安全

```csharp
public class ThreadSafeEventRaising
{
    public event EventHandler<EventArgs>? DataReceived;

    // 方式1: 使用空条件运算符（推荐）
    protected virtual void OnDataReceived(EventArgs e)
    {
        DataReceived?.Invoke(this, e);
    }

    // 方式2: 使用本地变量（传统方式）
    protected virtual void OnDataReceivedSafe(EventArgs e)
    {
        var handler = DataReceived;
        if (handler != null)
        {
            handler(this, e);
        }
    }

    // 方式3: 使用 Interlocked（高并发场景）
    private EventHandler<EventArgs>? _dataReceived;
    public event EventHandler<EventArgs>? DataReceivedVolatile
    {
        add => _dataReceived = (EventHandler<EventArgs>?)
            Delegate.Combine(_dataReceived, value);
        remove => _dataReceived = (EventHandler<EventArgs>?)
            Delegate.Remove(_dataReceived, value);
    }

    protected virtual void OnDataReceivedVolatile(EventArgs e)
    {
        Volatile.Read(ref _dataReceived)?.Invoke(this, e);
    }
}
```

### 避免内存泄漏

```csharp
public class MemoryLeakPrevention : IDisposable
{
    private readonly Publisher _publisher;
    private bool _disposed;

    public MemoryLeakPrevention(Publisher publisher)
    {
        _publisher = publisher;
        // 订阅事件
        _publisher.DataReceived += OnDataReceived;
    }

    private void OnDataReceived(object? sender, EventArgs e)
    {
        Console.WriteLine("处理数据");
    }

    // 正确实现 IDisposable
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
                // 取消订阅事件 - 防止内存泄漏！
                _publisher.DataReceived -= OnDataReceived;
            }
            _disposed = true;
        }
    }

    ~MemoryLeakPrevention()
    {
        Dispose(false);
    }
}

public class Publisher
{
    public event EventHandler? DataReceived;
}
```

### 使用标准事件模式

```csharp
// 推荐的标准事件模式
public class StandardEventPattern
{
    // 1. 定义事件参数类（如果需要传递数据）
    public class ProcessCompletedEventArgs : EventArgs
    {
        public bool Success { get; }
        public string? ErrorMessage { get; }
        public TimeSpan Duration { get; }

        public ProcessCompletedEventArgs(bool success, TimeSpan duration, string? error = null)
        {
            Success = success;
            Duration = duration;
            ErrorMessage = error;
        }
    }

    // 2. 声明事件
    public event EventHandler<ProcessCompletedEventArgs>? ProcessCompleted;

    // 3. 提供受保护的虚方法触发事件（支持继承）
    protected virtual void OnProcessCompleted(ProcessCompletedEventArgs e)
    {
        ProcessCompleted?.Invoke(this, e);
    }

    // 4. 在适当时机触发事件
    public async Task ProcessAsync()
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            await Task.Delay(1000);  // 模拟处理
            sw.Stop();
            OnProcessCompleted(new ProcessCompletedEventArgs(true, sw.Elapsed));
        }
        catch (Exception ex)
        {
            sw.Stop();
            OnProcessCompleted(new ProcessCompletedEventArgs(false, sw.Elapsed, ex.Message));
        }
    }
}
```

## 总结

| 特性 | 说明 | 适用场景 |
|------|------|----------|
| **委托** | 类型安全的方法引用 | 回调函数、策略模式 |
| **Action** | 无返回值的委托 | 执行操作、副作用 |
| **Func** | 有返回值的委托 | 数据转换、计算 |
| **Predicate** | 返回bool的委托 | 条件判断、过滤 |
| **多播委托** | 一个委托多个方法 | 通知多个订阅者 |
| **事件** | 委托的封装 | 发布-订阅模式 |

委托和事件是 C# 中实现松耦合设计的核心机制。正确使用它们可以让代码更加灵活、可维护，同时也要注意避免常见的陷阱如内存泄漏和线程安全问题。
