---
title: C# 事件机制深入解析
description: C#事件完全指南：event关键字、EventHandler模式、自定义事件、事件访问器与弱事件实现
track: csharp
section: basics
difficulty: intermediate
tags:
  - C#
  - 事件
  - event
  - EventHandler
  - 弱事件
  - 发布订阅
status: imported
origin: old/src/content/docs/csharp/events.zh.md
divergence: 0.216
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 核心概念
  order: 6
  lastUpdated: 2026-01-07
---

事件（Event）是 C# 中实现发布-订阅模式的核心机制。它基于委托构建，提供了一种类型安全的方式让对象通知其他对象发生了某些事情，同时保持发布者与订阅者之间的松耦合关系。

## 概念解释

### 什么是事件

事件是一种特殊的多播委托，它只能在声明它的类内部被触发（invoke），而外部代码只能订阅（+=）或取消订阅（-=）。这种封装机制确保了发布者对事件触发的完全控制权。

```csharp
// 事件的基本结构
public class Publisher
{
    // 声明事件 - 基于 EventHandler 委托
    public event EventHandler? SomethingHappened;

    // 只有类内部可以触发事件
    public void DoSomething()
    {
        Console.WriteLine("执行操作...");
        // 触发事件
        SomethingHappened?.Invoke(this, EventArgs.Empty);
    }
}

// 订阅者
public class Subscriber
{
    public void Subscribe(Publisher publisher)
    {
        // 订阅事件
        publisher.SomethingHappened += OnSomethingHappened;
    }

    public void Unsubscribe(Publisher publisher)
    {
        // 取消订阅
        publisher.SomethingHappened -= OnSomethingHappened;
    }

    private void OnSomethingHappened(object? sender, EventArgs e)
    {
        Console.WriteLine("收到事件通知！");
    }
}
```

### 事件的历史背景

事件机制源于观察者设计模式（Observer Pattern），最早在 C# 1.0 中引入。随着 C# 的演进，事件机制也得到了增强：

- **C# 1.0**: 基本事件语法，需要显式 null 检查
- **C# 2.0**: 引入匿名方法，简化事件处理器编写
- **C# 3.0**: Lambda 表达式进一步简化语法
- **C# 6.0**: 空条件运算符（?.）简化事件触发
- **C# 8.0**: 可空引用类型增强事件的空安全

### 事件解决什么问题

1. **松耦合通信**: 发布者不需要知道订阅者的具体实现
2. **一对多通知**: 一个事件可以有多个订阅者
3. **封装性保护**: 防止外部代码随意触发事件或覆盖订阅列表
4. **标准化模式**: .NET 生态系统中统一的通信方式

## 核心原理

### 事件的底层实现

事件在底层是一个私有委托字段加上两个公共访问器方法（add 和 remove）。编译器会自动生成这些代码。

```csharp
// 源代码
public class MyClass
{
    public event EventHandler? MyEvent;
}

// 编译器生成的等效代码（伪代码）
public class MyClass
{
    // 私有委托字段
    private EventHandler? _myEvent;

    // 公共事件访问器
    public event EventHandler? MyEvent
    {
        add { _myEvent = (EventHandler?)Delegate.Combine(_myEvent, value); }
        remove { _myEvent = (EventHandler?)Delegate.Remove(_myEvent, value); }
    }
}
```

### EventHandler 委托签名

.NET 定义了标准的事件委托签名：

```csharp
// 非泛型版本（用于不需要传递数据的事件）
public delegate void EventHandler(object? sender, EventArgs e);

// 泛型版本（用于需要传递自定义数据的事件）
public delegate void EventHandler<TEventArgs>(object? sender, TEventArgs e);
```

参数说明：
- `sender`: 触发事件的对象引用，通常传递 `this`
- `e`: 事件参数，包含与事件相关的数据

### 事件的内存模型

```csharp
// 事件订阅时的内存关系
public class EventMemoryModel
{
    public event EventHandler? DataChanged;

    public void Demonstrate()
    {
        var subscriber = new Subscriber();

        // 订阅时，委托持有对 subscriber 实例的引用
        // 这可能导致内存泄漏！
        DataChanged += subscriber.HandleEvent;

        // 如果不取消订阅，即使 subscriber 不再使用，
        // 它也不会被垃圾回收（因为委托仍然引用它）
    }
}

public class Subscriber
{
    public void HandleEvent(object? sender, EventArgs e) { }
}
```

## 核心要点

### event 关键字

`event` 关键字的作用：

```csharp
public class EventKeywordDemo
{
    // 使用 event 关键字
    public event EventHandler? MyEvent;

    // 不使用 event（普通委托字段）
    public EventHandler? MyDelegate;
}

class Program
{
    static void Main()
    {
        var demo = new EventKeywordDemo();

        // 事件：只能 += 或 -=
        demo.MyEvent += Handler;
        demo.MyEvent -= Handler;
        // demo.MyEvent = Handler;     // 编译错误！
        // demo.MyEvent(demo, null);   // 编译错误！
        // demo.MyEvent?.Invoke(...);  // 编译错误！

        // 委托：可以直接赋值和调用
        demo.MyDelegate = Handler;            // 允许（会覆盖其他订阅者）
        demo.MyDelegate += Handler;           // 允许
        demo.MyDelegate?.Invoke(demo, EventArgs.Empty); // 允许
    }

    static void Handler(object? sender, EventArgs e) { }
}
```

### EventHandler 与自定义委托

```csharp
// 方式1：使用 EventHandler（推荐用于无数据事件）
public event EventHandler? SimpleEvent;

// 方式2：使用 EventHandler<TEventArgs>（推荐用于有数据事件）
public event EventHandler<MyEventArgs>? DataEvent;

// 方式3：自定义委托（不推荐，除非有特殊需求）
public delegate void CustomEventHandler(string message, int code);
public event CustomEventHandler? CustomEvent;

// 事件参数类
public class MyEventArgs : EventArgs
{
    public string Message { get; }
    public int Code { get; }

    public MyEventArgs(string message, int code)
    {
        Message = message;
        Code = code;
    }
}
```

### 标准事件模式

```csharp
public class StandardEventPattern
{
    // 步骤1：定义事件参数类（继承 EventArgs）
    public class ProcessEventArgs : EventArgs
    {
        public string ProcessName { get; }
        public int Progress { get; }
        public bool IsCompleted { get; }

        public ProcessEventArgs(string name, int progress, bool completed = false)
        {
            ProcessName = name;
            Progress = progress;
            IsCompleted = completed;
        }
    }

    // 步骤2：声明事件
    public event EventHandler<ProcessEventArgs>? ProcessStarted;
    public event EventHandler<ProcessEventArgs>? ProgressChanged;
    public event EventHandler<ProcessEventArgs>? ProcessCompleted;

    // 步骤3：提供受保护的虚方法触发事件
    protected virtual void OnProcessStarted(ProcessEventArgs e)
    {
        ProcessStarted?.Invoke(this, e);
    }

    protected virtual void OnProgressChanged(ProcessEventArgs e)
    {
        ProgressChanged?.Invoke(this, e);
    }

    protected virtual void OnProcessCompleted(ProcessEventArgs e)
    {
        ProcessCompleted?.Invoke(this, e);
    }

    // 步骤4：在适当时机触发事件
    public async Task RunProcessAsync(string name)
    {
        OnProcessStarted(new ProcessEventArgs(name, 0));

        for (int i = 1; i <= 100; i += 10)
        {
            await Task.Delay(100);
            OnProgressChanged(new ProcessEventArgs(name, i));
        }

        OnProcessCompleted(new ProcessEventArgs(name, 100, true));
    }
}
```

### 事件访问器

自定义事件的 add 和 remove 访问器：

```csharp
public class CustomEventAccessors
{
    // 私有委托存储
    private EventHandler<string>? _messageReceived;
    private readonly object _lockObject = new object();
    private int _subscriberCount = 0;

    // 带自定义逻辑的事件访问器
    public event EventHandler<string>? MessageReceived
    {
        add
        {
            lock (_lockObject)
            {
                _messageReceived += value;
                _subscriberCount++;
                Console.WriteLine($"新订阅者加入，当前订阅者数量: {_subscriberCount}");
            }
        }
        remove
        {
            lock (_lockObject)
            {
                _messageReceived -= value;
                _subscriberCount--;
                Console.WriteLine($"订阅者离开，当前订阅者数量: {_subscriberCount}");
            }
        }
    }

    public int SubscriberCount => _subscriberCount;

    public void SendMessage(string message)
    {
        EventHandler<string>? handler;
        lock (_lockObject)
        {
            handler = _messageReceived;
        }
        handler?.Invoke(this, message);
    }
}
```

### 接口中的事件

```csharp
// 在接口中声明事件
public interface INotifyPropertyChanged
{
    event PropertyChangedEventHandler? PropertyChanged;
}

public interface IDataSource
{
    event EventHandler<DataEventArgs>? DataReceived;
    event EventHandler? ConnectionLost;
}

// 实现接口事件
public class DataSource : IDataSource
{
    public event EventHandler<DataEventArgs>? DataReceived;
    public event EventHandler? ConnectionLost;

    protected virtual void OnDataReceived(DataEventArgs e)
    {
        DataReceived?.Invoke(this, e);
    }

    protected virtual void OnConnectionLost()
    {
        ConnectionLost?.Invoke(this, EventArgs.Empty);
    }
}

public class DataEventArgs : EventArgs
{
    public byte[] Data { get; }
    public DataEventArgs(byte[] data) => Data = data;
}
```

## 代码示例

### 基础事件示例

```csharp
using System;

// 温度传感器示例
public class TemperatureChangedEventArgs : EventArgs
{
    public double OldTemperature { get; }
    public double NewTemperature { get; }
    public DateTime Timestamp { get; }

    public double Change => NewTemperature - OldTemperature;

    public TemperatureChangedEventArgs(double oldTemp, double newTemp)
    {
        OldTemperature = oldTemp;
        NewTemperature = newTemp;
        Timestamp = DateTime.Now;
    }
}

public class TemperatureSensor
{
    private double _currentTemperature;

    // 声明事件
    public event EventHandler<TemperatureChangedEventArgs>? TemperatureChanged;
    public event EventHandler? OverheatWarning;

    public double CurrentTemperature
    {
        get => _currentTemperature;
        set
        {
            if (Math.Abs(_currentTemperature - value) > 0.01)
            {
                var oldTemp = _currentTemperature;
                _currentTemperature = value;

                // 触发温度变化事件
                OnTemperatureChanged(new TemperatureChangedEventArgs(oldTemp, value));

                // 检查是否过热
                if (value > 100)
                {
                    OnOverheatWarning();
                }
            }
        }
    }

    protected virtual void OnTemperatureChanged(TemperatureChangedEventArgs e)
    {
        TemperatureChanged?.Invoke(this, e);
    }

    protected virtual void OnOverheatWarning()
    {
        OverheatWarning?.Invoke(this, EventArgs.Empty);
    }
}

// 温度显示器（订阅者）
public class TemperatureDisplay
{
    private readonly string _name;

    public TemperatureDisplay(string name)
    {
        _name = name;
    }

    public void OnTemperatureChanged(object? sender, TemperatureChangedEventArgs e)
    {
        var direction = e.Change > 0 ? "上升" : "下降";
        Console.WriteLine($"[{_name}] 温度{direction}: {e.OldTemperature:F1}C -> {e.NewTemperature:F1}C");
    }
}

// 警报系统（订阅者）
public class AlarmSystem
{
    public void OnOverheat(object? sender, EventArgs e)
    {
        Console.WriteLine("[警报] 温度过高！请立即检查设备！");
    }
}

// 使用示例
class Program
{
    static void Main()
    {
        var sensor = new TemperatureSensor();
        var display1 = new TemperatureDisplay("主显示屏");
        var display2 = new TemperatureDisplay("副显示屏");
        var alarm = new AlarmSystem();

        // 订阅事件
        sensor.TemperatureChanged += display1.OnTemperatureChanged;
        sensor.TemperatureChanged += display2.OnTemperatureChanged;
        sensor.OverheatWarning += alarm.OnOverheat;

        // 也可以使用 Lambda 表达式订阅
        sensor.TemperatureChanged += (s, e) =>
            Console.WriteLine($"[日志] 温度记录: {e.NewTemperature:F1}C at {e.Timestamp}");

        // 模拟温度变化
        Console.WriteLine("=== 温度监控开始 ===\n");

        sensor.CurrentTemperature = 25.0;
        sensor.CurrentTemperature = 35.5;
        sensor.CurrentTemperature = 75.0;
        sensor.CurrentTemperature = 105.0;  // 触发过热警报

        // 取消部分订阅
        Console.WriteLine("\n=== 取消副显示屏订阅 ===\n");
        sensor.TemperatureChanged -= display2.OnTemperatureChanged;

        sensor.CurrentTemperature = 80.0;
    }
}
```

### 自定义事件访问器示例

```csharp
using System;
using System.Collections.Generic;

public class EventAccessorDemo
{
    // 使用字典存储多个事件的委托
    private readonly Dictionary<string, Delegate?> _eventHandlers = new();
    private readonly object _lock = new();

    // 定义事件键
    private const string DataReceivedKey = "DataReceived";
    private const string ErrorOccurredKey = "ErrorOccurred";

    // 带访问器的事件 - 数据接收
    public event EventHandler<string>? DataReceived
    {
        add
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(DataReceivedKey, out var existing);
                _eventHandlers[DataReceivedKey] = Delegate.Combine(existing, value);
                LogSubscription(DataReceivedKey, "添加");
            }
        }
        remove
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(DataReceivedKey, out var existing);
                _eventHandlers[DataReceivedKey] = Delegate.Remove(existing, value);
                LogSubscription(DataReceivedKey, "移除");
            }
        }
    }

    // 带访问器的事件 - 错误发生
    public event EventHandler<Exception>? ErrorOccurred
    {
        add
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(ErrorOccurredKey, out var existing);
                _eventHandlers[ErrorOccurredKey] = Delegate.Combine(existing, value);
                LogSubscription(ErrorOccurredKey, "添加");
            }
        }
        remove
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(ErrorOccurredKey, out var existing);
                _eventHandlers[ErrorOccurredKey] = Delegate.Remove(existing, value);
                LogSubscription(ErrorOccurredKey, "移除");
            }
        }
    }

    private void LogSubscription(string eventName, string action)
    {
        _eventHandlers.TryGetValue(eventName, out var handler);
        var count = handler?.GetInvocationList().Length ?? 0;
        Console.WriteLine($"[事件管理] {eventName} - {action}订阅者，当前数量: {count}");
    }

    // 触发事件的方法
    public void SimulateDataReceived(string data)
    {
        EventHandler<string>? handler;
        lock (_lock)
        {
            _eventHandlers.TryGetValue(DataReceivedKey, out var del);
            handler = del as EventHandler<string>;
        }
        handler?.Invoke(this, data);
    }

    public void SimulateError(Exception ex)
    {
        EventHandler<Exception>? handler;
        lock (_lock)
        {
            _eventHandlers.TryGetValue(ErrorOccurredKey, out var del);
            handler = del as EventHandler<Exception>;
        }
        handler?.Invoke(this, ex);
    }
}

// 使用示例
class Program
{
    static void Main()
    {
        var demo = new EventAccessorDemo();

        // 订阅事件
        demo.DataReceived += (s, data) => Console.WriteLine($"处理器1收到: {data}");
        demo.DataReceived += (s, data) => Console.WriteLine($"处理器2收到: {data}");
        demo.ErrorOccurred += (s, ex) => Console.WriteLine($"错误处理: {ex.Message}");

        Console.WriteLine("\n=== 触发事件 ===\n");
        demo.SimulateDataReceived("Hello, World!");
        demo.SimulateError(new InvalidOperationException("测试错误"));
    }
}
```

### 异步事件处理示例

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;

public class AsyncEventDemo
{
    // 异步事件委托类型
    public delegate Task AsyncEventHandler<TEventArgs>(object sender, TEventArgs e);

    // 异步事件
    public event AsyncEventHandler<string>? DataProcessingAsync;

    // 普通事件（同步）
    public event EventHandler<string>? DataProcessed;

    // 并行触发所有异步处理器
    public async Task ProcessDataParallelAsync(string data)
    {
        Console.WriteLine($"开始并行处理: {data}");

        if (DataProcessingAsync != null)
        {
            var handlers = DataProcessingAsync.GetInvocationList()
                .Cast<AsyncEventHandler<string>>();

            var tasks = handlers.Select(handler => handler(this, data));
            await Task.WhenAll(tasks);
        }

        Console.WriteLine("并行处理完成");
        DataProcessed?.Invoke(this, data);
    }

    // 顺序触发所有异步处理器
    public async Task ProcessDataSequentialAsync(string data)
    {
        Console.WriteLine($"开始顺序处理: {data}");

        if (DataProcessingAsync != null)
        {
            var handlers = DataProcessingAsync.GetInvocationList()
                .Cast<AsyncEventHandler<string>>();

            foreach (var handler in handlers)
            {
                await handler(this, data);
            }
        }

        Console.WriteLine("顺序处理完成");
        DataProcessed?.Invoke(this, data);
    }
}

// 异步订阅者
public class AsyncSubscriber
{
    private readonly string _name;
    private readonly int _processingTime;

    public AsyncSubscriber(string name, int processingTimeMs)
    {
        _name = name;
        _processingTime = processingTimeMs;
    }

    public async Task HandleDataAsync(object sender, string data)
    {
        Console.WriteLine($"  [{_name}] 开始处理...");
        await Task.Delay(_processingTime);
        Console.WriteLine($"  [{_name}] 完成处理 (耗时 {_processingTime}ms)");
    }
}

class Program
{
    static async Task Main()
    {
        var demo = new AsyncEventDemo();

        var sub1 = new AsyncSubscriber("处理器A", 300);
        var sub2 = new AsyncSubscriber("处理器B", 200);
        var sub3 = new AsyncSubscriber("处理器C", 400);

        demo.DataProcessingAsync += sub1.HandleDataAsync;
        demo.DataProcessingAsync += sub2.HandleDataAsync;
        demo.DataProcessingAsync += sub3.HandleDataAsync;
        demo.DataProcessed += (s, d) => Console.WriteLine($"所有处理完成: {d}\n");

        var sw = System.Diagnostics.Stopwatch.StartNew();

        Console.WriteLine("=== 并行执行 ===");
        await demo.ProcessDataParallelAsync("并行数据");
        Console.WriteLine($"总耗时: {sw.ElapsedMilliseconds}ms\n");  // 约400ms

        sw.Restart();

        Console.WriteLine("=== 顺序执行 ===");
        await demo.ProcessDataSequentialAsync("顺序数据");
        Console.WriteLine($"总耗时: {sw.ElapsedMilliseconds}ms");  // 约900ms
    }
}
```

### 可取消的事件示例

```csharp
using System;
using System.ComponentModel;

// 可取消的事件参数
public class CancelableEventArgs : CancelEventArgs
{
    public string Reason { get; set; } = string.Empty;
}

public class FileOperationEventArgs : CancelableEventArgs
{
    public string FilePath { get; }
    public string Operation { get; }

    public FileOperationEventArgs(string filePath, string operation)
    {
        FilePath = filePath;
        Operation = operation;
    }
}

public class FileManager
{
    // 可取消的事件
    public event EventHandler<FileOperationEventArgs>? FileDeleting;
    public event EventHandler<string>? FileDeleted;

    public bool DeleteFile(string filePath)
    {
        // 触发删除前事件
        var args = new FileOperationEventArgs(filePath, "Delete");
        OnFileDeleting(args);

        // 检查是否被取消
        if (args.Cancel)
        {
            Console.WriteLine($"删除操作被取消: {args.Reason}");
            return false;
        }

        // 执行删除（模拟）
        Console.WriteLine($"正在删除文件: {filePath}");
        // File.Delete(filePath);

        // 触发删除后事件
        OnFileDeleted(filePath);
        return true;
    }

    protected virtual void OnFileDeleting(FileOperationEventArgs e)
    {
        FileDeleting?.Invoke(this, e);
    }

    protected virtual void OnFileDeleted(string filePath)
    {
        FileDeleted?.Invoke(this, filePath);
    }
}

// 文件保护器（可以取消删除操作）
public class FileProtector
{
    private readonly string[] _protectedExtensions;

    public FileProtector(params string[] protectedExtensions)
    {
        _protectedExtensions = protectedExtensions;
    }

    public void OnFileDeleting(object? sender, FileOperationEventArgs e)
    {
        var extension = System.IO.Path.GetExtension(e.FilePath).ToLower();

        if (_protectedExtensions.Contains(extension))
        {
            e.Cancel = true;
            e.Reason = $"文件类型 {extension} 受保护，不允许删除";
        }
    }
}

// 审计日志
public class AuditLogger
{
    public void OnFileDeleting(object? sender, FileOperationEventArgs e)
    {
        Console.WriteLine($"[审计] 尝试{e.Operation}文件: {e.FilePath}");
    }

    public void OnFileDeleted(object? sender, string filePath)
    {
        Console.WriteLine($"[审计] 文件已删除: {filePath}");
    }
}

class Program
{
    static void Main()
    {
        var fileManager = new FileManager();
        var protector = new FileProtector(".exe", ".dll", ".sys");
        var logger = new AuditLogger();

        // 订阅事件
        fileManager.FileDeleting += logger.OnFileDeleting;
        fileManager.FileDeleting += protector.OnFileDeleting;
        fileManager.FileDeleted += logger.OnFileDeleted;

        Console.WriteLine("=== 尝试删除普通文件 ===");
        fileManager.DeleteFile("document.txt");

        Console.WriteLine("\n=== 尝试删除受保护文件 ===");
        fileManager.DeleteFile("system.dll");

        Console.WriteLine("\n=== 尝试删除另一个普通文件 ===");
        fileManager.DeleteFile("image.png");
    }
}
```

## 最佳实践

### 使用标准事件模式

```csharp
public class BestPracticeEventPattern
{
    // 最佳实践：事件参数继承 EventArgs
    public class ItemAddedEventArgs : EventArgs
    {
        public string Item { get; }
        public int Index { get; }

        public ItemAddedEventArgs(string item, int index)
        {
            Item = item;
            Index = index;
        }
    }

    // 最佳实践：使用 EventHandler<T>
    public event EventHandler<ItemAddedEventArgs>? ItemAdded;

    // 最佳实践：提供 protected virtual 触发方法
    protected virtual void OnItemAdded(ItemAddedEventArgs e)
    {
        // 最佳实践：使用空条件运算符
        ItemAdded?.Invoke(this, e);
    }

    private readonly List<string> _items = new();

    public void AddItem(string item)
    {
        _items.Add(item);
        OnItemAdded(new ItemAddedEventArgs(item, _items.Count - 1));
    }
}
```

### 正确的事件命名

```csharp
public class EventNamingBestPractices
{
    // 进行中的动作：使用动词ing形式
    public event EventHandler? Loading;
    public event EventHandler? Saving;
    public event EventHandler? Connecting;

    // 已完成的动作：使用动词ed形式
    public event EventHandler? Loaded;
    public event EventHandler? Saved;
    public event EventHandler? Connected;

    // 即将发生/已发生：使用 Before/After 前缀
    public event EventHandler? BeforeClose;
    public event EventHandler? AfterClose;

    // 状态变化：使用 Changing/Changed
    public event EventHandler? SelectionChanging;  // 变化前（可取消）
    public event EventHandler? SelectionChanged;   // 变化后

    // 事件参数类：以 EventArgs 结尾
    public class SelectionChangedEventArgs : EventArgs { }

    // 触发方法：以 On 开头
    protected virtual void OnLoading(EventArgs e) => Loading?.Invoke(this, e);
    protected virtual void OnLoaded(EventArgs e) => Loaded?.Invoke(this, e);
}
```

### 线程安全的事件触发

```csharp
public class ThreadSafeEvents
{
    private EventHandler<string>? _dataReceived;
    private readonly object _eventLock = new();

    public event EventHandler<string>? DataReceived
    {
        add
        {
            lock (_eventLock)
            {
                _dataReceived += value;
            }
        }
        remove
        {
            lock (_eventLock)
            {
                _dataReceived -= value;
            }
        }
    }

    protected virtual void OnDataReceived(string data)
    {
        EventHandler<string>? handler;

        // 方式1：使用锁获取委托副本
        lock (_eventLock)
        {
            handler = _dataReceived;
        }
        handler?.Invoke(this, data);

        // 方式2：使用 Volatile.Read（更高效）
        // Volatile.Read(ref _dataReceived)?.Invoke(this, data);
    }
}
```

### 避免在构造函数中触发事件

```csharp
public class AvoidEventInConstructor
{
    public event EventHandler? Initialized;

    // 不好的做法：在构造函数中触发事件
    public AvoidEventInConstructor_Bad()
    {
        // 此时订阅者可能还没来得及订阅！
        // Initialized?.Invoke(this, EventArgs.Empty);  // 避免这样做
    }

    // 好的做法：提供初始化方法
    public AvoidEventInConstructor() { }

    public void Initialize()
    {
        // 执行初始化逻辑...
        OnInitialized();
    }

    protected virtual void OnInitialized()
    {
        Initialized?.Invoke(this, EventArgs.Empty);
    }
}
```

### 实现 IDisposable 取消订阅

```csharp
public class EventSubscriber : IDisposable
{
    private readonly Publisher _publisher;
    private bool _disposed;

    public EventSubscriber(Publisher publisher)
    {
        _publisher = publisher;
        _publisher.DataReceived += OnDataReceived;
        _publisher.ErrorOccurred += OnErrorOccurred;
    }

    private void OnDataReceived(object? sender, EventArgs e)
    {
        if (_disposed) return;
        Console.WriteLine("处理数据");
    }

    private void OnErrorOccurred(object? sender, EventArgs e)
    {
        if (_disposed) return;
        Console.WriteLine("处理错误");
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
                // 取消所有订阅
                _publisher.DataReceived -= OnDataReceived;
                _publisher.ErrorOccurred -= OnErrorOccurred;
            }
            _disposed = true;
        }
    }
}

public class Publisher
{
    public event EventHandler? DataReceived;
    public event EventHandler? ErrorOccurred;
}
```

## 常见陷阱

### 内存泄漏

```csharp
public class MemoryLeakExample
{
    public event EventHandler? LongLivedEvent;
}

public class ShortLivedSubscriber
{
    public ShortLivedSubscriber(MemoryLeakExample publisher)
    {
        // 订阅但从不取消 - 内存泄漏！
        publisher.LongLivedEvent += OnEvent;
    }

    private void OnEvent(object? sender, EventArgs e)
    {
        Console.WriteLine("处理事件");
    }

    // 没有提供取消订阅的方法
    // 即使这个对象不再使用，它也不会被回收
}

// 正确做法
public class ProperSubscriber : IDisposable
{
    private readonly MemoryLeakExample _publisher;

    public ProperSubscriber(MemoryLeakExample publisher)
    {
        _publisher = publisher;
        _publisher.LongLivedEvent += OnEvent;
    }

    private void OnEvent(object? sender, EventArgs e)
    {
        Console.WriteLine("处理事件");
    }

    public void Dispose()
    {
        _publisher.LongLivedEvent -= OnEvent;
    }
}
```

### 空引用异常

```csharp
public class NullReferenceExample
{
    public event EventHandler? MyEvent;

    // 错误做法：直接调用（可能抛出 NullReferenceException）
    public void TriggerBad()
    {
        // MyEvent(this, EventArgs.Empty);  // 如果没有订阅者会抛异常！
    }

    // 传统做法：空检查
    public void TriggerTraditional()
    {
        var handler = MyEvent;
        if (handler != null)
        {
            handler(this, EventArgs.Empty);
        }
    }

    // 推荐做法：使用空条件运算符
    public void TriggerModern()
    {
        MyEvent?.Invoke(this, EventArgs.Empty);
    }
}
```

### Lambda 表达式无法取消订阅

```csharp
public class LambdaUnsubscribeIssue
{
    public event EventHandler? MyEvent;

    public void Demonstrate()
    {
        // 问题：Lambda 表达式无法取消订阅
        MyEvent += (s, e) => Console.WriteLine("Handler 1");
        MyEvent += (s, e) => Console.WriteLine("Handler 2");

        // 这不会移除任何处理器！
        // 因为每次创建的是不同的委托实例
        MyEvent -= (s, e) => Console.WriteLine("Handler 1");

        // 解决方案：保存委托引用
        EventHandler handler = (s, e) => Console.WriteLine("Handler 3");
        MyEvent += handler;
        MyEvent -= handler;  // 现在可以正确移除
    }
}
```

### 事件处理器中抛出异常

```csharp
public class ExceptionInHandlerIssue
{
    public event EventHandler? MyEvent;

    // 问题：一个处理器抛异常，后续处理器不会执行
    public void DemonstrateProblem()
    {
        MyEvent += (s, e) => Console.WriteLine("Handler 1");
        MyEvent += (s, e) => throw new Exception("Handler 2 失败");
        MyEvent += (s, e) => Console.WriteLine("Handler 3");  // 不会执行！

        try
        {
            MyEvent?.Invoke(this, EventArgs.Empty);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"捕获异常: {ex.Message}");
        }
    }

    // 解决方案：安全调用每个处理器
    public void SafeInvoke()
    {
        var handler = MyEvent;
        if (handler == null) return;

        var exceptions = new List<Exception>();

        foreach (EventHandler del in handler.GetInvocationList())
        {
            try
            {
                del(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
        }

        if (exceptions.Count > 0)
        {
            throw new AggregateException("事件处理过程中发生错误", exceptions);
        }
    }
}
```

### 跨线程触发事件

```csharp
public class CrossThreadEventIssue
{
    public event EventHandler? DataUpdated;

    // 在后台线程触发事件
    public void UpdateDataAsync()
    {
        Task.Run(() =>
        {
            // 处理数据...

            // 问题：如果订阅者在 UI 线程，直接调用会引发跨线程异常
            DataUpdated?.Invoke(this, EventArgs.Empty);
        });
    }
}

// WPF/WinForms 中的解决方案
public class ThreadSafeEventRaising
{
    public event EventHandler? DataUpdated;
    private readonly SynchronizationContext? _syncContext;

    public ThreadSafeEventRaising()
    {
        // 捕获当前同步上下文（通常是 UI 线程）
        _syncContext = SynchronizationContext.Current;
    }

    public void UpdateDataAsync()
    {
        Task.Run(() =>
        {
            // 处理数据...

            // 在捕获的上下文中触发事件
            if (_syncContext != null)
            {
                _syncContext.Post(_ => DataUpdated?.Invoke(this, EventArgs.Empty), null);
            }
            else
            {
                DataUpdated?.Invoke(this, EventArgs.Empty);
            }
        });
    }
}
```

## 性能考量

### 事件订阅/取消订阅的开销

```csharp
using System.Diagnostics;

public class EventPerformanceTest
{
    public event EventHandler? TestEvent;

    public static void BenchmarkSubscription()
    {
        var test = new EventPerformanceTest();
        var handler = new EventHandler((s, e) => { });

        const int iterations = 1_000_000;

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            test.TestEvent += handler;
        }
        sw.Stop();
        Console.WriteLine($"订阅 {iterations:N0} 次: {sw.ElapsedMilliseconds}ms");

        sw.Restart();
        for (int i = 0; i < iterations; i++)
        {
            test.TestEvent -= handler;
        }
        sw.Stop();
        Console.WriteLine($"取消订阅 {iterations:N0} 次: {sw.ElapsedMilliseconds}ms");
    }
}

// 注意：随着订阅者增加，操作会变慢
// 因为底层是链表结构，需要遍历查找
```

### 减少事件触发频率

```csharp
public class ThrottledEventPublisher
{
    public event EventHandler<double>? ProgressChanged;

    private double _lastReportedProgress;
    private readonly double _reportThreshold;

    public ThrottledEventPublisher(double reportThreshold = 0.01)
    {
        _reportThreshold = reportThreshold;
    }

    public void ReportProgress(double progress)
    {
        // 只有当进度变化超过阈值时才触发事件
        if (Math.Abs(progress - _lastReportedProgress) >= _reportThreshold)
        {
            _lastReportedProgress = progress;
            ProgressChanged?.Invoke(this, progress);
        }
    }
}

// 使用防抖的事件触发
public class DebouncedEventPublisher
{
    public event EventHandler<string>? SearchQueryChanged;

    private CancellationTokenSource? _debounceTokenSource;
    private readonly int _debounceMs;

    public DebouncedEventPublisher(int debounceMs = 300)
    {
        _debounceMs = debounceMs;
    }

    public async void OnSearchQueryChanged(string query)
    {
        // 取消之前的延迟触发
        _debounceTokenSource?.Cancel();
        _debounceTokenSource = new CancellationTokenSource();

        try
        {
            await Task.Delay(_debounceMs, _debounceTokenSource.Token);
            SearchQueryChanged?.Invoke(this, query);
        }
        catch (TaskCanceledException)
        {
            // 被取消，忽略
        }
    }
}
```

### 避免在热路径中使用事件

```csharp
public class HotPathOptimization
{
    public event EventHandler<int>? ItemProcessed;

    // 不推荐：在热路径中触发事件
    public void ProcessItemsSlow(int[] items)
    {
        foreach (var item in items)
        {
            // 每次循环都触发事件 - 性能差
            ItemProcessed?.Invoke(this, item);
        }
    }

    // 推荐：批量通知
    public event EventHandler<int[]>? BatchProcessed;

    public void ProcessItemsFast(int[] items)
    {
        // 处理所有项目
        foreach (var item in items)
        {
            // 处理逻辑...
        }

        // 一次性通知
        BatchProcessed?.Invoke(this, items);
    }

    // 或者：使用回调而非事件
    public void ProcessItemsWithCallback(int[] items, Action<int>? onItemProcessed)
    {
        foreach (var item in items)
        {
            // 处理逻辑...
            onItemProcessed?.Invoke(item);
        }
    }
}
```

### 委托缓存

```csharp
public class DelegateCaching
{
    public event EventHandler? MyEvent;

    // 不推荐：每次都创建新的委托
    public void SubscribeBad()
    {
        MyEvent += (s, e) => Console.WriteLine("处理");  // 每次调用创建新委托
    }

    // 推荐：缓存委托
    private static readonly EventHandler _cachedHandler = (s, e) => Console.WriteLine("处理");

    public void SubscribeGood()
    {
        MyEvent += _cachedHandler;  // 重用同一个委托实例
    }

    public void UnsubscribeGood()
    {
        MyEvent -= _cachedHandler;  // 可以正确移除
    }
}
```

## 实战场景

### 弱事件模式实现

弱事件允许订阅者被垃圾回收，即使没有显式取消订阅。

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

// 弱事件管理器
public class WeakEventManager<TEventArgs> where TEventArgs : EventArgs
{
    private readonly List<WeakReference<EventHandler<TEventArgs>>> _handlers = new();
    private readonly object _lock = new();

    public void AddHandler(EventHandler<TEventArgs> handler)
    {
        lock (_lock)
        {
            CleanupDeadReferences();
            _handlers.Add(new WeakReference<EventHandler<TEventArgs>>(handler));
        }
    }

    public void RemoveHandler(EventHandler<TEventArgs> handler)
    {
        lock (_lock)
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
    }

    public void Raise(object sender, TEventArgs args)
    {
        List<EventHandler<TEventArgs>> liveHandlers;

        lock (_lock)
        {
            CleanupDeadReferences();
            liveHandlers = _handlers
                .Select(wr => wr.TryGetTarget(out var handler) ? handler : null)
                .Where(h => h != null)
                .Cast<EventHandler<TEventArgs>>()
                .ToList();
        }

        foreach (var handler in liveHandlers)
        {
            handler(sender, args);
        }
    }

    private void CleanupDeadReferences()
    {
        _handlers.RemoveAll(wr => !wr.TryGetTarget(out _));
    }

    public int HandlerCount
    {
        get
        {
            lock (_lock)
            {
                CleanupDeadReferences();
                return _handlers.Count;
            }
        }
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

    public int SubscriberCount => _eventManager.HandlerCount;
}

// 订阅者示例
public class WeakEventSubscriber
{
    private readonly string _name;

    public WeakEventSubscriber(string name)
    {
        _name = name;
    }

    public void OnEvent(object? sender, EventArgs e)
    {
        Console.WriteLine($"[{_name}] 收到事件");
    }
}

// 演示
class WeakEventDemo
{
    static void Demo()
    {
        var publisher = new WeakEventPublisher();

        // 创建订阅者
        var subscriber1 = new WeakEventSubscriber("订阅者1");
        var subscriber2 = new WeakEventSubscriber("订阅者2");

        publisher.WeakEvent += subscriber1.OnEvent;
        publisher.WeakEvent += subscriber2.OnEvent;

        Console.WriteLine($"订阅者数量: {publisher.SubscriberCount}");
        publisher.RaiseEvent();

        // 让 subscriber2 可被回收
        subscriber2 = null;
        GC.Collect();
        GC.WaitForPendingFinalizers();

        Console.WriteLine($"\n强制GC后订阅者数量: {publisher.SubscriberCount}");
        publisher.RaiseEvent();
    }
}
```

### 事件聚合器模式

用于在松耦合的组件之间传递消息。

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

// 消息接口
public interface IMessage { }

// 具体消息类型
public class UserLoggedIn : IMessage
{
    public string Username { get; }
    public DateTime LoginTime { get; }

    public UserLoggedIn(string username)
    {
        Username = username;
        LoginTime = DateTime.Now;
    }
}

public class OrderCreated : IMessage
{
    public string OrderId { get; }
    public decimal Amount { get; }

    public OrderCreated(string orderId, decimal amount)
    {
        OrderId = orderId;
        Amount = amount;
    }
}

// 事件聚合器
public interface IEventAggregator
{
    void Subscribe<TMessage>(Action<TMessage> handler) where TMessage : IMessage;
    void Unsubscribe<TMessage>(Action<TMessage> handler) where TMessage : IMessage;
    void Publish<TMessage>(TMessage message) where TMessage : IMessage;
    Task PublishAsync<TMessage>(TMessage message) where TMessage : IMessage;
}

public class EventAggregator : IEventAggregator
{
    private readonly ConcurrentDictionary<Type, List<Delegate>> _subscribers = new();
    private readonly object _lock = new();

    public void Subscribe<TMessage>(Action<TMessage> handler) where TMessage : IMessage
    {
        var messageType = typeof(TMessage);

        lock (_lock)
        {
            if (!_subscribers.TryGetValue(messageType, out var handlers))
            {
                handlers = new List<Delegate>();
                _subscribers[messageType] = handlers;
            }
            handlers.Add(handler);
        }
    }

    public void Unsubscribe<TMessage>(Action<TMessage> handler) where TMessage : IMessage
    {
        var messageType = typeof(TMessage);

        lock (_lock)
        {
            if (_subscribers.TryGetValue(messageType, out var handlers))
            {
                handlers.Remove(handler);
            }
        }
    }

    public void Publish<TMessage>(TMessage message) where TMessage : IMessage
    {
        var messageType = typeof(TMessage);
        List<Delegate> handlers;

        lock (_lock)
        {
            if (!_subscribers.TryGetValue(messageType, out var h))
                return;
            handlers = new List<Delegate>(h);
        }

        foreach (var handler in handlers)
        {
            ((Action<TMessage>)handler)(message);
        }
    }

    public async Task PublishAsync<TMessage>(TMessage message) where TMessage : IMessage
    {
        var messageType = typeof(TMessage);
        List<Delegate> handlers;

        lock (_lock)
        {
            if (!_subscribers.TryGetValue(messageType, out var h))
                return;
            handlers = new List<Delegate>(h);
        }

        var tasks = handlers.Select(handler =>
            Task.Run(() => ((Action<TMessage>)handler)(message)));

        await Task.WhenAll(tasks);
    }
}

// 使用示例
public class LoginService
{
    private readonly IEventAggregator _eventAggregator;

    public LoginService(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }

    public void Login(string username, string password)
    {
        // 验证登录...
        Console.WriteLine($"用户 {username} 登录成功");

        // 发布消息
        _eventAggregator.Publish(new UserLoggedIn(username));
    }
}

public class OrderService
{
    private readonly IEventAggregator _eventAggregator;

    public OrderService(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }

    public void CreateOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"创建订单: {orderId}, 金额: {amount:C}");
        _eventAggregator.Publish(new OrderCreated(orderId, amount));
    }
}

public class NotificationService
{
    public NotificationService(IEventAggregator eventAggregator)
    {
        eventAggregator.Subscribe<UserLoggedIn>(OnUserLoggedIn);
        eventAggregator.Subscribe<OrderCreated>(OnOrderCreated);
    }

    private void OnUserLoggedIn(UserLoggedIn message)
    {
        Console.WriteLine($"[通知] 欢迎回来, {message.Username}!");
    }

    private void OnOrderCreated(OrderCreated message)
    {
        Console.WriteLine($"[通知] 订单 {message.OrderId} 已创建, 金额: {message.Amount:C}");
    }
}

public class AnalyticsService
{
    public AnalyticsService(IEventAggregator eventAggregator)
    {
        eventAggregator.Subscribe<UserLoggedIn>(OnUserLoggedIn);
        eventAggregator.Subscribe<OrderCreated>(OnOrderCreated);
    }

    private void OnUserLoggedIn(UserLoggedIn message)
    {
        Console.WriteLine($"[分析] 记录登录: {message.Username} at {message.LoginTime}");
    }

    private void OnOrderCreated(OrderCreated message)
    {
        Console.WriteLine($"[分析] 记录订单金额: {message.Amount}");
    }
}

// 程序入口
class Program
{
    static void Main()
    {
        // 创建事件聚合器
        var eventAggregator = new EventAggregator();

        // 创建服务
        var loginService = new LoginService(eventAggregator);
        var orderService = new OrderService(eventAggregator);

        // 创建订阅者
        var notification = new NotificationService(eventAggregator);
        var analytics = new AnalyticsService(eventAggregator);

        Console.WriteLine("=== 用户登录 ===");
        loginService.Login("张三", "password123");

        Console.WriteLine("\n=== 创建订单 ===");
        orderService.CreateOrder("ORD-001", 599.99m);
    }
}
```

### 域事件模式

```csharp
using System;
using System.Collections.Generic;

// 域事件基类
public abstract class DomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}

// 具体域事件
public class OrderPlacedEvent : DomainEvent
{
    public string OrderId { get; }
    public string CustomerId { get; }
    public decimal TotalAmount { get; }

    public OrderPlacedEvent(string orderId, string customerId, decimal totalAmount)
    {
        OrderId = orderId;
        CustomerId = customerId;
        TotalAmount = totalAmount;
    }
}

public class PaymentReceivedEvent : DomainEvent
{
    public string OrderId { get; }
    public decimal Amount { get; }
    public string PaymentMethod { get; }

    public PaymentReceivedEvent(string orderId, decimal amount, string paymentMethod)
    {
        OrderId = orderId;
        Amount = amount;
        PaymentMethod = paymentMethod;
    }
}

// 聚合根基类
public abstract class AggregateRoot
{
    private readonly List<DomainEvent> _domainEvents = new();

    public IReadOnlyList<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

// 订单聚合根
public class Order : AggregateRoot
{
    public string Id { get; private set; }
    public string CustomerId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }

    private Order() { }

    public static Order Create(string customerId, decimal totalAmount)
    {
        var order = new Order
        {
            Id = Guid.NewGuid().ToString("N")[..8].ToUpper(),
            CustomerId = customerId,
            TotalAmount = totalAmount,
            Status = OrderStatus.Pending
        };

        // 添加域事件
        order.AddDomainEvent(new OrderPlacedEvent(order.Id, customerId, totalAmount));

        return order;
    }

    public void ReceivePayment(decimal amount, string paymentMethod)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("订单状态不允许支付");

        if (amount < TotalAmount)
            throw new InvalidOperationException("支付金额不足");

        Status = OrderStatus.Paid;

        AddDomainEvent(new PaymentReceivedEvent(Id, amount, paymentMethod));
    }
}

public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Delivered,
    Cancelled
}

// 域事件处理器接口
public interface IDomainEventHandler<in TEvent> where TEvent : DomainEvent
{
    void Handle(TEvent domainEvent);
}

// 域事件分发器
public class DomainEventDispatcher
{
    private readonly Dictionary<Type, List<object>> _handlers = new();

    public void Register<TEvent>(IDomainEventHandler<TEvent> handler) where TEvent : DomainEvent
    {
        var eventType = typeof(TEvent);
        if (!_handlers.ContainsKey(eventType))
        {
            _handlers[eventType] = new List<object>();
        }
        _handlers[eventType].Add(handler);
    }

    public void Dispatch(DomainEvent domainEvent)
    {
        var eventType = domainEvent.GetType();
        if (_handlers.TryGetValue(eventType, out var handlers))
        {
            foreach (var handler in handlers)
            {
                var handleMethod = handler.GetType().GetMethod("Handle");
                handleMethod?.Invoke(handler, new object[] { domainEvent });
            }
        }
    }

    public void DispatchAll(IEnumerable<DomainEvent> domainEvents)
    {
        foreach (var domainEvent in domainEvents)
        {
            Dispatch(domainEvent);
        }
    }
}

// 事件处理器实现
public class OrderPlacedEventHandler : IDomainEventHandler<OrderPlacedEvent>
{
    public void Handle(OrderPlacedEvent domainEvent)
    {
        Console.WriteLine($"[处理] 订单创建 - 订单号: {domainEvent.OrderId}, " +
                         $"客户: {domainEvent.CustomerId}, 金额: {domainEvent.TotalAmount:C}");
        // 发送确认邮件、更新库存等
    }
}

public class PaymentReceivedEventHandler : IDomainEventHandler<PaymentReceivedEvent>
{
    public void Handle(PaymentReceivedEvent domainEvent)
    {
        Console.WriteLine($"[处理] 收到付款 - 订单号: {domainEvent.OrderId}, " +
                         $"金额: {domainEvent.Amount:C}, 方式: {domainEvent.PaymentMethod}");
        // 更新财务记录、触发发货流程等
    }
}

// 使用示例
class DomainEventDemo
{
    static void Demo()
    {
        // 设置事件分发器
        var dispatcher = new DomainEventDispatcher();
        dispatcher.Register(new OrderPlacedEventHandler());
        dispatcher.Register(new PaymentReceivedEventHandler());

        Console.WriteLine("=== 创建订单 ===");
        var order = Order.Create("CUST-001", 299.99m);

        // 分发域事件
        dispatcher.DispatchAll(order.DomainEvents);
        order.ClearDomainEvents();

        Console.WriteLine("\n=== 处理付款 ===");
        order.ReceivePayment(299.99m, "信用卡");

        dispatcher.DispatchAll(order.DomainEvents);
        order.ClearDomainEvents();
    }
}
```

## 面试要点

### 事件与委托的区别是什么？

**答案要点**：
- 事件是委托的封装，提供了更好的封装性
- 事件只能在声明它的类内部触发（Invoke）
- 外部代码只能订阅（+=）或取消订阅（-=）事件
- 事件不能被外部代码直接赋值（=），防止覆盖其他订阅者

```csharp
public class EventVsDelegate
{
    public event EventHandler? MyEvent;      // 事件
    public EventHandler? MyDelegate;         // 委托
}

// 外部使用
var obj = new EventVsDelegate();
obj.MyDelegate = Handler;            // 允许 - 会覆盖之前的订阅者
obj.MyDelegate?.Invoke(obj, null);   // 允许 - 可以直接调用

obj.MyEvent += Handler;              // 允许
// obj.MyEvent = Handler;            // 编译错误
// obj.MyEvent?.Invoke(obj, null);   // 编译错误
```

### 如何正确触发事件避免空引用异常？

**答案要点**：
```csharp
public event EventHandler? MyEvent;

// 方式1（推荐）：空条件运算符
protected virtual void OnMyEvent()
{
    MyEvent?.Invoke(this, EventArgs.Empty);
}

// 方式2（传统）：临时变量
protected virtual void OnMyEvent()
{
    var handler = MyEvent;  // 复制引用
    if (handler != null)
    {
        handler(this, EventArgs.Empty);
    }
}
```

### 如何避免事件导致的内存泄漏？

**答案要点**：
- 在订阅者的 Dispose 方法中取消订阅
- 使用弱事件模式
- 确保短生命周期对象取消订阅长生命周期对象的事件
- 避免使用 Lambda 表达式订阅事件（难以取消订阅）

### 什么是弱事件？为什么需要它？

**答案要点**：
- 弱事件使用 WeakReference 持有订阅者引用
- 允许订阅者在没有显式取消订阅的情况下被垃圾回收
- 解决长生命周期发布者持有短生命周期订阅者引用导致的内存泄漏

### 解释 EventHandler<TEventArgs> 的标准签名

**答案要点**：
```csharp
public delegate void EventHandler<TEventArgs>(object? sender, TEventArgs e);
```
- `sender`: 触发事件的对象，允许订阅者知道事件来源
- `e`: 事件参数，包含与事件相关的数据
- `TEventArgs`: 通常继承自 EventArgs

### 多播委托触发时如果一个处理器抛异常会怎样？

**答案要点**：
- 默认情况下，后续处理器不会执行
- 解决方案：遍历 GetInvocationList() 逐个调用并捕获异常

### 如何实现线程安全的事件？

**答案要点**：
```csharp
private EventHandler? _myEvent;
private readonly object _lock = new();

public event EventHandler? MyEvent
{
    add { lock (_lock) { _myEvent += value; } }
    remove { lock (_lock) { _myEvent -= value; } }
}

protected void OnMyEvent()
{
    EventHandler? handler;
    lock (_lock) { handler = _myEvent; }
    handler?.Invoke(this, EventArgs.Empty);
}
```

## 延伸阅读

### 官方文档
- [Events (C# Programming Guide)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/events/)
- [EventHandler Delegate](https://docs.microsoft.com/en-us/dotnet/api/system.eventhandler)
- [Handling and Raising Events](https://docs.microsoft.com/en-us/dotnet/standard/events/)

### 设计模式
- [Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [Publish-Subscribe Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber)

### 进阶主题
- [Weak Event Patterns](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/advanced/weak-event-patterns)
- [Reactive Extensions (Rx)](https://github.com/dotnet/reactive)
- [MediatR - Mediator Pattern Library](https://github.com/jbogard/MediatR)

### 推荐书籍
- 《CLR via C#》- Jeffrey Richter
- 《C# in Depth》- Jon Skeet
- 《Concurrency in C# Cookbook》- Stephen Cleary
