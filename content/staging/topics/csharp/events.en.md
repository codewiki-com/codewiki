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
origin: old/src/content/docs/csharp/events.en.md
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

Events are the core mechanism in C# for implementing the publish-subscribe pattern. Built on delegates, they provide a type-safe way for objects to notify other objects that something has happened, while maintaining a loosely coupled relationship between publishers and subscribers.

## Concept Explanation

### What are Events

An event is a special multicast delegate that can only be invoked within the class that declares it, while external code can only subscribe (+=) or unsubscribe (-=). This encapsulation mechanism ensures that the publisher has complete control over event triggering.

```csharp
// Basic event structure
public class Publisher
{
    // Declare event - based on EventHandler delegate
    public event EventHandler? SomethingHappened;

    // Only the class itself can trigger the event
    public void DoSomething()
    {
        Console.WriteLine("Performing operation...");
        // Trigger the event
        SomethingHappened?.Invoke(this, EventArgs.Empty);
    }
}

// Subscriber
public class Subscriber
{
    public void Subscribe(Publisher publisher)
    {
        // Subscribe to event
        publisher.SomethingHappened += OnSomethingHappened;
    }

    public void Unsubscribe(Publisher publisher)
    {
        // Unsubscribe from event
        publisher.SomethingHappened -= OnSomethingHappened;
    }

    private void OnSomethingHappened(object? sender, EventArgs e)
    {
        Console.WriteLine("Event notification received!");
    }
}
```

### Historical Background of Events

The event mechanism originated from the Observer design pattern and was first introduced in C# 1.0. As C# evolved, the event mechanism was also enhanced:

- **C# 1.0**: Basic event syntax, requiring explicit null checks
- **C# 2.0**: Introduced anonymous methods, simplifying event handler writing
- **C# 3.0**: Lambda expressions further simplified syntax
- **C# 6.0**: Null-conditional operator (?.) simplified event triggering
- **C# 8.0**: Nullable reference types enhanced null safety for events

### Problems Events Solve

1. **Loosely Coupled Communication**: Publishers don't need to know the specific implementation of subscribers
2. **One-to-Many Notification**: One event can have multiple subscribers
3. **Encapsulation Protection**: Prevents external code from arbitrarily triggering events or overwriting subscription lists
4. **Standardized Pattern**: Unified communication method in the .NET ecosystem

## Core Principles

### Underlying Implementation of Events

Events are essentially a private delegate field plus two public accessor methods (add and remove). The compiler automatically generates this code.

```csharp
// Source code
public class MyClass
{
    public event EventHandler? MyEvent;
}

// Equivalent compiler-generated code (pseudocode)
public class MyClass
{
    // Private delegate field
    private EventHandler? _myEvent;

    // Public event accessors
    public event EventHandler? MyEvent
    {
        add { _myEvent = (EventHandler?)Delegate.Combine(_myEvent, value); }
        remove { _myEvent = (EventHandler?)Delegate.Remove(_myEvent, value); }
    }
}
```

### EventHandler Delegate Signature

.NET defines standard event delegate signatures:

```csharp
// Non-generic version (for events that don't need to pass data)
public delegate void EventHandler(object? sender, EventArgs e);

// Generic version (for events that need to pass custom data)
public delegate void EventHandler<TEventArgs>(object? sender, TEventArgs e);
```

Parameter explanation:
- `sender`: Reference to the object that triggered the event, typically passing `this`
- `e`: Event arguments, containing data related to the event

### Memory Model of Events

```csharp
// Memory relationship during event subscription
public class EventMemoryModel
{
    public event EventHandler? DataChanged;

    public void Demonstrate()
    {
        var subscriber = new Subscriber();

        // When subscribing, the delegate holds a reference to the subscriber instance
        // This can cause memory leaks!
        DataChanged += subscriber.HandleEvent;

        // If you don't unsubscribe, even if subscriber is no longer used,
        // it won't be garbage collected (because the delegate still references it)
    }
}

public class Subscriber
{
    public void HandleEvent(object? sender, EventArgs e) { }
}
```

## Core Concepts

### The event Keyword

The purpose of the `event` keyword:

```csharp
public class EventKeywordDemo
{
    // Using the event keyword
    public event EventHandler? MyEvent;

    // Without event (regular delegate field)
    public EventHandler? MyDelegate;
}

class Program
{
    static void Main()
    {
        var demo = new EventKeywordDemo();

        // Event: can only += or -=
        demo.MyEvent += Handler;
        demo.MyEvent -= Handler;
        // demo.MyEvent = Handler;     // Compile error!
        // demo.MyEvent(demo, null);   // Compile error!
        // demo.MyEvent?.Invoke(...);  // Compile error!

        // Delegate: can be directly assigned and invoked
        demo.MyDelegate = Handler;            // Allowed (will overwrite other subscribers)
        demo.MyDelegate += Handler;           // Allowed
        demo.MyDelegate?.Invoke(demo, EventArgs.Empty); // Allowed
    }

    static void Handler(object? sender, EventArgs e) { }
}
```

### EventHandler and Custom Delegates

```csharp
// Method 1: Using EventHandler (recommended for events without data)
public event EventHandler? SimpleEvent;

// Method 2: Using EventHandler<TEventArgs> (recommended for events with data)
public event EventHandler<MyEventArgs>? DataEvent;

// Method 3: Custom delegate (not recommended unless there are special requirements)
public delegate void CustomEventHandler(string message, int code);
public event CustomEventHandler? CustomEvent;

// Event arguments class
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

### Standard Event Pattern

```csharp
public class StandardEventPattern
{
    // Step 1: Define event arguments class (inheriting from EventArgs)
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

    // Step 2: Declare events
    public event EventHandler<ProcessEventArgs>? ProcessStarted;
    public event EventHandler<ProcessEventArgs>? ProgressChanged;
    public event EventHandler<ProcessEventArgs>? ProcessCompleted;

    // Step 3: Provide protected virtual methods to trigger events
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

    // Step 4: Trigger events at appropriate times
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

### Event Accessors

Custom add and remove accessors for events:

```csharp
public class CustomEventAccessors
{
    // Private delegate storage
    private EventHandler<string>? _messageReceived;
    private readonly object _lockObject = new object();
    private int _subscriberCount = 0;

    // Event accessor with custom logic
    public event EventHandler<string>? MessageReceived
    {
        add
        {
            lock (_lockObject)
            {
                _messageReceived += value;
                _subscriberCount++;
                Console.WriteLine($"New subscriber added, current subscriber count: {_subscriberCount}");
            }
        }
        remove
        {
            lock (_lockObject)
            {
                _messageReceived -= value;
                _subscriberCount--;
                Console.WriteLine($"Subscriber removed, current subscriber count: {_subscriberCount}");
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

### Events in Interfaces

```csharp
// Declaring events in interfaces
public interface INotifyPropertyChanged
{
    event PropertyChangedEventHandler? PropertyChanged;
}

public interface IDataSource
{
    event EventHandler<DataEventArgs>? DataReceived;
    event EventHandler? ConnectionLost;
}

// Implementing interface events
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

## Code Examples

### Basic Event Example

```csharp
using System;

// Temperature sensor example
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

    // Declare events
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

                // Trigger temperature change event
                OnTemperatureChanged(new TemperatureChangedEventArgs(oldTemp, value));

                // Check for overheating
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

// Temperature display (subscriber)
public class TemperatureDisplay
{
    private readonly string _name;

    public TemperatureDisplay(string name)
    {
        _name = name;
    }

    public void OnTemperatureChanged(object? sender, TemperatureChangedEventArgs e)
    {
        var direction = e.Change > 0 ? "rising" : "falling";
        Console.WriteLine($"[{_name}] Temperature {direction}: {e.OldTemperature:F1}C -> {e.NewTemperature:F1}C");
    }
}

// Alarm system (subscriber)
public class AlarmSystem
{
    public void OnOverheat(object? sender, EventArgs e)
    {
        Console.WriteLine("[ALARM] Temperature too high! Please check the equipment immediately!");
    }
}

// Usage example
class Program
{
    static void Main()
    {
        var sensor = new TemperatureSensor();
        var display1 = new TemperatureDisplay("Main Display");
        var display2 = new TemperatureDisplay("Secondary Display");
        var alarm = new AlarmSystem();

        // Subscribe to events
        sensor.TemperatureChanged += display1.OnTemperatureChanged;
        sensor.TemperatureChanged += display2.OnTemperatureChanged;
        sensor.OverheatWarning += alarm.OnOverheat;

        // Can also subscribe using lambda expressions
        sensor.TemperatureChanged += (s, e) =>
            Console.WriteLine($"[Log] Temperature recorded: {e.NewTemperature:F1}C at {e.Timestamp}");

        // Simulate temperature changes
        Console.WriteLine("=== Temperature Monitoring Started ===\n");

        sensor.CurrentTemperature = 25.0;
        sensor.CurrentTemperature = 35.5;
        sensor.CurrentTemperature = 75.0;
        sensor.CurrentTemperature = 105.0;  // Triggers overheat alarm

        // Unsubscribe partially
        Console.WriteLine("\n=== Unsubscribing Secondary Display ===\n");
        sensor.TemperatureChanged -= display2.OnTemperatureChanged;

        sensor.CurrentTemperature = 80.0;
    }
}
```

### Custom Event Accessor Example

```csharp
using System;
using System.Collections.Generic;

public class EventAccessorDemo
{
    // Using a dictionary to store delegates for multiple events
    private readonly Dictionary<string, Delegate?> _eventHandlers = new();
    private readonly object _lock = new();

    // Define event keys
    private const string DataReceivedKey = "DataReceived";
    private const string ErrorOccurredKey = "ErrorOccurred";

    // Event with accessor - Data received
    public event EventHandler<string>? DataReceived
    {
        add
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(DataReceivedKey, out var existing);
                _eventHandlers[DataReceivedKey] = Delegate.Combine(existing, value);
                LogSubscription(DataReceivedKey, "added");
            }
        }
        remove
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(DataReceivedKey, out var existing);
                _eventHandlers[DataReceivedKey] = Delegate.Remove(existing, value);
                LogSubscription(DataReceivedKey, "removed");
            }
        }
    }

    // Event with accessor - Error occurred
    public event EventHandler<Exception>? ErrorOccurred
    {
        add
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(ErrorOccurredKey, out var existing);
                _eventHandlers[ErrorOccurredKey] = Delegate.Combine(existing, value);
                LogSubscription(ErrorOccurredKey, "added");
            }
        }
        remove
        {
            lock (_lock)
            {
                _eventHandlers.TryGetValue(ErrorOccurredKey, out var existing);
                _eventHandlers[ErrorOccurredKey] = Delegate.Remove(existing, value);
                LogSubscription(ErrorOccurredKey, "removed");
            }
        }
    }

    private void LogSubscription(string eventName, string action)
    {
        _eventHandlers.TryGetValue(eventName, out var handler);
        var count = handler?.GetInvocationList().Length ?? 0;
        Console.WriteLine($"[Event Manager] {eventName} - Subscriber {action}, current count: {count}");
    }

    // Methods to trigger events
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

// Usage example
class Program
{
    static void Main()
    {
        var demo = new EventAccessorDemo();

        // Subscribe to events
        demo.DataReceived += (s, data) => Console.WriteLine($"Handler 1 received: {data}");
        demo.DataReceived += (s, data) => Console.WriteLine($"Handler 2 received: {data}");
        demo.ErrorOccurred += (s, ex) => Console.WriteLine($"Error handler: {ex.Message}");

        Console.WriteLine("\n=== Triggering Events ===\n");
        demo.SimulateDataReceived("Hello, World!");
        demo.SimulateError(new InvalidOperationException("Test error"));
    }
}
```

### Async Event Handling Example

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;

public class AsyncEventDemo
{
    // Async event delegate type
    public delegate Task AsyncEventHandler<TEventArgs>(object sender, TEventArgs e);

    // Async event
    public event AsyncEventHandler<string>? DataProcessingAsync;

    // Regular event (synchronous)
    public event EventHandler<string>? DataProcessed;

    // Trigger all async handlers in parallel
    public async Task ProcessDataParallelAsync(string data)
    {
        Console.WriteLine($"Starting parallel processing: {data}");

        if (DataProcessingAsync != null)
        {
            var handlers = DataProcessingAsync.GetInvocationList()
                .Cast<AsyncEventHandler<string>>();

            var tasks = handlers.Select(handler => handler(this, data));
            await Task.WhenAll(tasks);
        }

        Console.WriteLine("Parallel processing completed");
        DataProcessed?.Invoke(this, data);
    }

    // Trigger all async handlers sequentially
    public async Task ProcessDataSequentialAsync(string data)
    {
        Console.WriteLine($"Starting sequential processing: {data}");

        if (DataProcessingAsync != null)
        {
            var handlers = DataProcessingAsync.GetInvocationList()
                .Cast<AsyncEventHandler<string>>();

            foreach (var handler in handlers)
            {
                await handler(this, data);
            }
        }

        Console.WriteLine("Sequential processing completed");
        DataProcessed?.Invoke(this, data);
    }
}

// Async subscriber
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
        Console.WriteLine($"  [{_name}] Starting processing...");
        await Task.Delay(_processingTime);
        Console.WriteLine($"  [{_name}] Processing completed (took {_processingTime}ms)");
    }
}

class Program
{
    static async Task Main()
    {
        var demo = new AsyncEventDemo();

        var sub1 = new AsyncSubscriber("Handler A", 300);
        var sub2 = new AsyncSubscriber("Handler B", 200);
        var sub3 = new AsyncSubscriber("Handler C", 400);

        demo.DataProcessingAsync += sub1.HandleDataAsync;
        demo.DataProcessingAsync += sub2.HandleDataAsync;
        demo.DataProcessingAsync += sub3.HandleDataAsync;
        demo.DataProcessed += (s, d) => Console.WriteLine($"All processing completed: {d}\n");

        var sw = System.Diagnostics.Stopwatch.StartNew();

        Console.WriteLine("=== Parallel Execution ===");
        await demo.ProcessDataParallelAsync("Parallel data");
        Console.WriteLine($"Total time: {sw.ElapsedMilliseconds}ms\n");  // ~400ms

        sw.Restart();

        Console.WriteLine("=== Sequential Execution ===");
        await demo.ProcessDataSequentialAsync("Sequential data");
        Console.WriteLine($"Total time: {sw.ElapsedMilliseconds}ms");  // ~900ms
    }
}
```

### Cancelable Event Example

```csharp
using System;
using System.ComponentModel;

// Cancelable event arguments
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
    // Cancelable event
    public event EventHandler<FileOperationEventArgs>? FileDeleting;
    public event EventHandler<string>? FileDeleted;

    public bool DeleteFile(string filePath)
    {
        // Trigger pre-delete event
        var args = new FileOperationEventArgs(filePath, "Delete");
        OnFileDeleting(args);

        // Check if canceled
        if (args.Cancel)
        {
            Console.WriteLine($"Delete operation canceled: {args.Reason}");
            return false;
        }

        // Perform deletion (simulated)
        Console.WriteLine($"Deleting file: {filePath}");
        // File.Delete(filePath);

        // Trigger post-delete event
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

// File protector (can cancel delete operations)
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
            e.Reason = $"File type {extension} is protected, deletion not allowed";
        }
    }
}

// Audit logger
public class AuditLogger
{
    public void OnFileDeleting(object? sender, FileOperationEventArgs e)
    {
        Console.WriteLine($"[Audit] Attempting to {e.Operation} file: {e.FilePath}");
    }

    public void OnFileDeleted(object? sender, string filePath)
    {
        Console.WriteLine($"[Audit] File deleted: {filePath}");
    }
}

class Program
{
    static void Main()
    {
        var fileManager = new FileManager();
        var protector = new FileProtector(".exe", ".dll", ".sys");
        var logger = new AuditLogger();

        // Subscribe to events
        fileManager.FileDeleting += logger.OnFileDeleting;
        fileManager.FileDeleting += protector.OnFileDeleting;
        fileManager.FileDeleted += logger.OnFileDeleted;

        Console.WriteLine("=== Attempting to delete regular file ===");
        fileManager.DeleteFile("document.txt");

        Console.WriteLine("\n=== Attempting to delete protected file ===");
        fileManager.DeleteFile("system.dll");

        Console.WriteLine("\n=== Attempting to delete another regular file ===");
        fileManager.DeleteFile("image.png");
    }
}
```

## Best Practices

### Use the Standard Event Pattern

```csharp
public class BestPracticeEventPattern
{
    // Best practice: Event arguments inherit from EventArgs
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

    // Best practice: Use EventHandler<T>
    public event EventHandler<ItemAddedEventArgs>? ItemAdded;

    // Best practice: Provide protected virtual trigger method
    protected virtual void OnItemAdded(ItemAddedEventArgs e)
    {
        // Best practice: Use null-conditional operator
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

### Proper Event Naming

```csharp
public class EventNamingBestPractices
{
    // Actions in progress: Use verb -ing form
    public event EventHandler? Loading;
    public event EventHandler? Saving;
    public event EventHandler? Connecting;

    // Completed actions: Use verb -ed form
    public event EventHandler? Loaded;
    public event EventHandler? Saved;
    public event EventHandler? Connected;

    // About to happen/Already happened: Use Before/After prefix
    public event EventHandler? BeforeClose;
    public event EventHandler? AfterClose;

    // State changes: Use Changing/Changed
    public event EventHandler? SelectionChanging;  // Before change (cancelable)
    public event EventHandler? SelectionChanged;   // After change

    // Event argument classes: End with EventArgs
    public class SelectionChangedEventArgs : EventArgs { }

    // Trigger methods: Start with On
    protected virtual void OnLoading(EventArgs e) => Loading?.Invoke(this, e);
    protected virtual void OnLoaded(EventArgs e) => Loaded?.Invoke(this, e);
}
```

### Thread-Safe Event Triggering

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

        // Method 1: Use lock to get delegate copy
        lock (_eventLock)
        {
            handler = _dataReceived;
        }
        handler?.Invoke(this, data);

        // Method 2: Use Volatile.Read (more efficient)
        // Volatile.Read(ref _dataReceived)?.Invoke(this, data);
    }
}
```

### Avoid Triggering Events in Constructors

```csharp
public class AvoidEventInConstructor
{
    public event EventHandler? Initialized;

    // Bad practice: Triggering event in constructor
    public AvoidEventInConstructor_Bad()
    {
        // Subscribers might not have had a chance to subscribe yet!
        // Initialized?.Invoke(this, EventArgs.Empty);  // Avoid this
    }

    // Good practice: Provide initialization method
    public AvoidEventInConstructor() { }

    public void Initialize()
    {
        // Perform initialization logic...
        OnInitialized();
    }

    protected virtual void OnInitialized()
    {
        Initialized?.Invoke(this, EventArgs.Empty);
    }
}
```

### Implement IDisposable to Unsubscribe

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
        Console.WriteLine("Processing data");
    }

    private void OnErrorOccurred(object? sender, EventArgs e)
    {
        if (_disposed) return;
        Console.WriteLine("Processing error");
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
                // Unsubscribe from all events
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

## Common Pitfalls

### Memory Leaks

```csharp
public class MemoryLeakExample
{
    public event EventHandler? LongLivedEvent;
}

public class ShortLivedSubscriber
{
    public ShortLivedSubscriber(MemoryLeakExample publisher)
    {
        // Subscribes but never unsubscribes - memory leak!
        publisher.LongLivedEvent += OnEvent;
    }

    private void OnEvent(object? sender, EventArgs e)
    {
        Console.WriteLine("Processing event");
    }

    // No method provided to unsubscribe
    // Even if this object is no longer used, it won't be collected
}

// Correct approach
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
        Console.WriteLine("Processing event");
    }

    public void Dispose()
    {
        _publisher.LongLivedEvent -= OnEvent;
    }
}
```

### Null Reference Exception

```csharp
public class NullReferenceExample
{
    public event EventHandler? MyEvent;

    // Wrong approach: Direct invocation (may throw NullReferenceException)
    public void TriggerBad()
    {
        // MyEvent(this, EventArgs.Empty);  // Will throw if no subscribers!
    }

    // Traditional approach: Null check
    public void TriggerTraditional()
    {
        var handler = MyEvent;
        if (handler != null)
        {
            handler(this, EventArgs.Empty);
        }
    }

    // Recommended approach: Use null-conditional operator
    public void TriggerModern()
    {
        MyEvent?.Invoke(this, EventArgs.Empty);
    }
}
```

### Lambda Expressions Cannot Be Unsubscribed

```csharp
public class LambdaUnsubscribeIssue
{
    public event EventHandler? MyEvent;

    public void Demonstrate()
    {
        // Problem: Lambda expressions cannot be unsubscribed
        MyEvent += (s, e) => Console.WriteLine("Handler 1");
        MyEvent += (s, e) => Console.WriteLine("Handler 2");

        // This won't remove any handler!
        // Because a different delegate instance is created each time
        MyEvent -= (s, e) => Console.WriteLine("Handler 1");

        // Solution: Save delegate reference
        EventHandler handler = (s, e) => Console.WriteLine("Handler 3");
        MyEvent += handler;
        MyEvent -= handler;  // Now it can be correctly removed
    }
}
```

### Exception Thrown in Event Handler

```csharp
public class ExceptionInHandlerIssue
{
    public event EventHandler? MyEvent;

    // Problem: If one handler throws, subsequent handlers won't execute
    public void DemonstrateProblem()
    {
        MyEvent += (s, e) => Console.WriteLine("Handler 1");
        MyEvent += (s, e) => throw new Exception("Handler 2 failed");
        MyEvent += (s, e) => Console.WriteLine("Handler 3");  // Won't execute!

        try
        {
            MyEvent?.Invoke(this, EventArgs.Empty);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Caught exception: {ex.Message}");
        }
    }

    // Solution: Safely invoke each handler
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
            throw new AggregateException("Errors occurred during event handling", exceptions);
        }
    }
}
```

### Cross-Thread Event Triggering

```csharp
public class CrossThreadEventIssue
{
    public event EventHandler? DataUpdated;

    // Triggering event on background thread
    public void UpdateDataAsync()
    {
        Task.Run(() =>
        {
            // Processing data...

            // Problem: If subscriber is on UI thread, direct call will cause cross-thread exception
            DataUpdated?.Invoke(this, EventArgs.Empty);
        });
    }
}

// Solution in WPF/WinForms
public class ThreadSafeEventRaising
{
    public event EventHandler? DataUpdated;
    private readonly SynchronizationContext? _syncContext;

    public ThreadSafeEventRaising()
    {
        // Capture current synchronization context (usually UI thread)
        _syncContext = SynchronizationContext.Current;
    }

    public void UpdateDataAsync()
    {
        Task.Run(() =>
        {
            // Processing data...

            // Trigger event in captured context
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

## Performance Considerations

### Subscribe/Unsubscribe Overhead

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
        Console.WriteLine($"Subscribing {iterations:N0} times: {sw.ElapsedMilliseconds}ms");

        sw.Restart();
        for (int i = 0; i < iterations; i++)
        {
            test.TestEvent -= handler;
        }
        sw.Stop();
        Console.WriteLine($"Unsubscribing {iterations:N0} times: {sw.ElapsedMilliseconds}ms");
    }
}

// Note: Operations become slower as subscribers increase
// Because the underlying structure is a linked list that requires traversal
```

### Reducing Event Trigger Frequency

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
        // Only trigger event when progress change exceeds threshold
        if (Math.Abs(progress - _lastReportedProgress) >= _reportThreshold)
        {
            _lastReportedProgress = progress;
            ProgressChanged?.Invoke(this, progress);
        }
    }
}

// Using debounced event triggering
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
        // Cancel previous delayed trigger
        _debounceTokenSource?.Cancel();
        _debounceTokenSource = new CancellationTokenSource();

        try
        {
            await Task.Delay(_debounceMs, _debounceTokenSource.Token);
            SearchQueryChanged?.Invoke(this, query);
        }
        catch (TaskCanceledException)
        {
            // Canceled, ignore
        }
    }
}
```

### Avoid Events in Hot Paths

```csharp
public class HotPathOptimization
{
    public event EventHandler<int>? ItemProcessed;

    // Not recommended: Triggering events in hot path
    public void ProcessItemsSlow(int[] items)
    {
        foreach (var item in items)
        {
            // Triggers event on every iteration - poor performance
            ItemProcessed?.Invoke(this, item);
        }
    }

    // Recommended: Batch notification
    public event EventHandler<int[]>? BatchProcessed;

    public void ProcessItemsFast(int[] items)
    {
        // Process all items
        foreach (var item in items)
        {
            // Processing logic...
        }

        // Notify once
        BatchProcessed?.Invoke(this, items);
    }

    // Or: Use callback instead of event
    public void ProcessItemsWithCallback(int[] items, Action<int>? onItemProcessed)
    {
        foreach (var item in items)
        {
            // Processing logic...
            onItemProcessed?.Invoke(item);
        }
    }
}
```

### Delegate Caching

```csharp
public class DelegateCaching
{
    public event EventHandler? MyEvent;

    // Not recommended: Creating new delegate each time
    public void SubscribeBad()
    {
        MyEvent += (s, e) => Console.WriteLine("Processing");  // Creates new delegate each call
    }

    // Recommended: Cache delegate
    private static readonly EventHandler _cachedHandler = (s, e) => Console.WriteLine("Processing");

    public void SubscribeGood()
    {
        MyEvent += _cachedHandler;  // Reuse same delegate instance
    }

    public void UnsubscribeGood()
    {
        MyEvent -= _cachedHandler;  // Can be correctly removed
    }
}
```

## Real-World Scenarios

### Weak Event Pattern Implementation

Weak events allow subscribers to be garbage collected even without explicit unsubscription.

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

// Weak event manager
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
                return true;  // Remove dead references
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

// Publisher using weak events
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

// Subscriber example
public class WeakEventSubscriber
{
    private readonly string _name;

    public WeakEventSubscriber(string name)
    {
        _name = name;
    }

    public void OnEvent(object? sender, EventArgs e)
    {
        Console.WriteLine($"[{_name}] Event received");
    }
}

// Demo
class WeakEventDemo
{
    static void Demo()
    {
        var publisher = new WeakEventPublisher();

        // Create subscribers
        var subscriber1 = new WeakEventSubscriber("Subscriber 1");
        var subscriber2 = new WeakEventSubscriber("Subscriber 2");

        publisher.WeakEvent += subscriber1.OnEvent;
        publisher.WeakEvent += subscriber2.OnEvent;

        Console.WriteLine($"Subscriber count: {publisher.SubscriberCount}");
        publisher.RaiseEvent();

        // Allow subscriber2 to be collected
        subscriber2 = null;
        GC.Collect();
        GC.WaitForPendingFinalizers();

        Console.WriteLine($"\nSubscriber count after forced GC: {publisher.SubscriberCount}");
        publisher.RaiseEvent();
    }
}
```

### Event Aggregator Pattern

Used for passing messages between loosely coupled components.

```csharp
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

// Message interface
public interface IMessage { }

// Concrete message types
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

// Event aggregator
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

// Usage examples
public class LoginService
{
    private readonly IEventAggregator _eventAggregator;

    public LoginService(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }

    public void Login(string username, string password)
    {
        // Validate login...
        Console.WriteLine($"User {username} logged in successfully");

        // Publish message
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
        Console.WriteLine($"Creating order: {orderId}, Amount: {amount:C}");
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
        Console.WriteLine($"[Notification] Welcome back, {message.Username}!");
    }

    private void OnOrderCreated(OrderCreated message)
    {
        Console.WriteLine($"[Notification] Order {message.OrderId} created, Amount: {message.Amount:C}");
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
        Console.WriteLine($"[Analytics] Recording login: {message.Username} at {message.LoginTime}");
    }

    private void OnOrderCreated(OrderCreated message)
    {
        Console.WriteLine($"[Analytics] Recording order amount: {message.Amount}");
    }
}

// Program entry point
class Program
{
    static void Main()
    {
        // Create event aggregator
        var eventAggregator = new EventAggregator();

        // Create services
        var loginService = new LoginService(eventAggregator);
        var orderService = new OrderService(eventAggregator);

        // Create subscribers
        var notification = new NotificationService(eventAggregator);
        var analytics = new AnalyticsService(eventAggregator);

        Console.WriteLine("=== User Login ===");
        loginService.Login("John", "password123");

        Console.WriteLine("\n=== Create Order ===");
        orderService.CreateOrder("ORD-001", 599.99m);
    }
}
```

### Domain Event Pattern

```csharp
using System;
using System.Collections.Generic;

// Domain event base class
public abstract class DomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}

// Concrete domain events
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

// Aggregate root base class
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

// Order aggregate root
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

        // Add domain event
        order.AddDomainEvent(new OrderPlacedEvent(order.Id, customerId, totalAmount));

        return order;
    }

    public void ReceivePayment(decimal amount, string paymentMethod)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Order status does not allow payment");

        if (amount < TotalAmount)
            throw new InvalidOperationException("Payment amount insufficient");

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

// Domain event handler interface
public interface IDomainEventHandler<in TEvent> where TEvent : DomainEvent
{
    void Handle(TEvent domainEvent);
}

// Domain event dispatcher
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

// Event handler implementations
public class OrderPlacedEventHandler : IDomainEventHandler<OrderPlacedEvent>
{
    public void Handle(OrderPlacedEvent domainEvent)
    {
        Console.WriteLine($"[Handler] Order placed - Order ID: {domainEvent.OrderId}, " +
                         $"Customer: {domainEvent.CustomerId}, Amount: {domainEvent.TotalAmount:C}");
        // Send confirmation email, update inventory, etc.
    }
}

public class PaymentReceivedEventHandler : IDomainEventHandler<PaymentReceivedEvent>
{
    public void Handle(PaymentReceivedEvent domainEvent)
    {
        Console.WriteLine($"[Handler] Payment received - Order ID: {domainEvent.OrderId}, " +
                         $"Amount: {domainEvent.Amount:C}, Method: {domainEvent.PaymentMethod}");
        // Update financial records, trigger shipping process, etc.
    }
}

// Usage example
class DomainEventDemo
{
    static void Demo()
    {
        // Setup event dispatcher
        var dispatcher = new DomainEventDispatcher();
        dispatcher.Register(new OrderPlacedEventHandler());
        dispatcher.Register(new PaymentReceivedEventHandler());

        Console.WriteLine("=== Create Order ===");
        var order = Order.Create("CUST-001", 299.99m);

        // Dispatch domain events
        dispatcher.DispatchAll(order.DomainEvents);
        order.ClearDomainEvents();

        Console.WriteLine("\n=== Process Payment ===");
        order.ReceivePayment(299.99m, "Credit Card");

        dispatcher.DispatchAll(order.DomainEvents);
        order.ClearDomainEvents();
    }
}
```

## Interview Key Points

### What is the difference between events and delegates?

**Key Points**:
- Events are encapsulations of delegates, providing better encapsulation
- Events can only be invoked within the class that declares them
- External code can only subscribe (+=) or unsubscribe (-=) from events
- Events cannot be directly assigned (=) by external code, preventing overwriting of other subscribers

```csharp
public class EventVsDelegate
{
    public event EventHandler? MyEvent;      // Event
    public EventHandler? MyDelegate;         // Delegate
}

// External usage
var obj = new EventVsDelegate();
obj.MyDelegate = Handler;            // Allowed - will overwrite previous subscribers
obj.MyDelegate?.Invoke(obj, null);   // Allowed - can invoke directly

obj.MyEvent += Handler;              // Allowed
// obj.MyEvent = Handler;            // Compile error
// obj.MyEvent?.Invoke(obj, null);   // Compile error
```

### How to correctly trigger events to avoid null reference exceptions?

**Key Points**:
```csharp
public event EventHandler? MyEvent;

// Method 1 (Recommended): Null-conditional operator
protected virtual void OnMyEvent()
{
    MyEvent?.Invoke(this, EventArgs.Empty);
}

// Method 2 (Traditional): Temporary variable
protected virtual void OnMyEvent()
{
    var handler = MyEvent;  // Copy reference
    if (handler != null)
    {
        handler(this, EventArgs.Empty);
    }
}
```

### How to avoid memory leaks caused by events?

**Key Points**:
- Unsubscribe in the subscriber's Dispose method
- Use weak event pattern
- Ensure short-lived objects unsubscribe from long-lived objects' events
- Avoid using lambda expressions for event subscription (hard to unsubscribe)

### What are weak events? Why do we need them?

**Key Points**:
- Weak events use WeakReference to hold subscriber references
- Allows subscribers to be garbage collected without explicit unsubscription
- Solves memory leaks caused by long-lived publishers holding references to short-lived subscribers

### Explain the standard signature of EventHandler<TEventArgs>

**Key Points**:
```csharp
public delegate void EventHandler<TEventArgs>(object? sender, TEventArgs e);
```
- `sender`: The object that triggered the event, allowing subscribers to know the event source
- `e`: Event arguments, containing data related to the event
- `TEventArgs`: Usually inherits from EventArgs

### What happens when a multicast delegate is invoked and one handler throws an exception?

**Key Points**:
- By default, subsequent handlers won't execute
- Solution: Iterate through GetInvocationList() and invoke each handler individually while catching exceptions

### How to implement thread-safe events?

**Key Points**:
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

## Further Reading

### Official Documentation
- [Events (C# Programming Guide)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/events/)
- [EventHandler Delegate](https://docs.microsoft.com/en-us/dotnet/api/system.eventhandler)
- [Handling and Raising Events](https://docs.microsoft.com/en-us/dotnet/standard/events/)

### Design Patterns
- [Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [Publish-Subscribe Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber)

### Advanced Topics
- [Weak Event Patterns](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/advanced/weak-event-patterns)
- [Reactive Extensions (Rx)](https://github.com/dotnet/reactive)
- [MediatR - Mediator Pattern Library](https://github.com/jbogard/MediatR)

### Recommended Books
- "CLR via C#" - Jeffrey Richter
- "C# in Depth" - Jon Skeet
- "Concurrency in C# Cookbook" - Stephen Cleary
