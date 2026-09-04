---
title: Delegates and Events
description: Complete guide to C# delegates and events, Func, Action, Predicate and event patterns
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - Delegates
  - Events
  - Callbacks
status: imported
origin: old/src/content/docs/csharp/delegates-events.en.md
divergence: 0.096
issues: []
legacy:
  category: CSharp
  subcategory: Core Concepts
  order: 5
  lastUpdated: 2026-01-07
---

Delegates and events are fundamental concepts in C# that enable powerful callback mechanisms, event-driven programming, and loose coupling between components. You'll learn everything you need to effectively use delegates and events in your applications.

## What is a Delegate?

A delegate is a type-safe function pointer that holds a reference to a method. It defines the signature of a method (return type and parameters) that it can reference, allowing methods to be passed as parameters, stored in variables, and invoked dynamically.

### Declaring and Using Delegates

```csharp
// Declare a delegate type
public delegate int MathOperation(int x, int y);

public class Calculator
{
    // Methods that match the delegate signature
    public static int Add(int a, int b) => a + b;
    public static int Subtract(int a, int b) => a - b;
    public static int Multiply(int a, int b) => a * b;

    public static void Main()
    {
        // Create delegate instances
        MathOperation operation = Add;
        Console.WriteLine($"Add: {operation(10, 5)}");        // Output: Add: 15

        // Reassign to a different method
        operation = Subtract;
        Console.WriteLine($"Subtract: {operation(10, 5)}");   // Output: Subtract: 5

        // Using delegates as method parameters
        int result = PerformOperation(10, 5, Multiply);
        Console.WriteLine($"Multiply: {result}");             // Output: Multiply: 50
    }

    // Method that accepts a delegate as parameter
    public static int PerformOperation(int x, int y, MathOperation op)
    {
        return op(x, y);
    }
}
```

### Delegate Instantiation Methods

There are several ways to instantiate a delegate:

```csharp
public delegate void MessageHandler(string message);

public class DelegateInstantiation
{
    public void DisplayMessage(string msg) => Console.WriteLine(msg);

    public void DemonstrateInstantiation()
    {
        // 1. Traditional instantiation
        MessageHandler handler1 = new MessageHandler(DisplayMessage);

        // 2. Simplified syntax (method group conversion)
        MessageHandler handler2 = DisplayMessage;

        // 3. Anonymous method
        MessageHandler handler3 = delegate(string msg)
        {
            Console.WriteLine($"Anonymous: {msg}");
        };

        // 4. Lambda expression
        MessageHandler handler4 = (msg) => Console.WriteLine($"Lambda: {msg}");

        // 5. Expression-bodied lambda
        MessageHandler handler5 = msg => Console.WriteLine($"Short lambda: {msg}");

        // Invoke all handlers
        handler1("Hello from handler1");
        handler2("Hello from handler2");
        handler3("Hello from handler3");
        handler4("Hello from handler4");
        handler5("Hello from handler5");
    }
}
```

## Built-in Delegate Types: Func, Action, and Predicate

C# provides generic delegate types that cover most common scenarios, eliminating the need to declare custom delegates in many cases.

### Action Delegates

`Action` represents a method that returns void and takes zero to sixteen parameters.

```csharp
public class ActionExamples
{
    public void DemonstrateAction()
    {
        // Action with no parameters
        Action greet = () => Console.WriteLine("Hello!");
        greet();  // Output: Hello!

        // Action with one parameter
        Action<string> greetPerson = name => Console.WriteLine($"Hello, {name}!");
        greetPerson("Alice");  // Output: Hello, Alice!

        // Action with multiple parameters
        Action<string, int> displayInfo = (name, age) =>
            Console.WriteLine($"{name} is {age} years old");
        displayInfo("Bob", 30);  // Output: Bob is 30 years old

        // Using Action as a callback
        ProcessData("Important data", result => Console.WriteLine($"Processed: {result}"));
    }

    public void ProcessData(string data, Action<string> callback)
    {
        // Simulate processing
        string result = data.ToUpper();
        callback(result);
    }
}
```

### Func Delegates

`Func` represents a method that returns a value and takes zero to sixteen input parameters. The last type parameter is always the return type.

```csharp
public class FuncExamples
{
    public void DemonstrateFunc()
    {
        // Func with no input, returns int
        Func<int> getRandomNumber = () => new Random().Next(1, 100);
        Console.WriteLine($"Random: {getRandomNumber()}");

        // Func with one input, returns output
        Func<int, int> square = x => x * x;
        Console.WriteLine($"Square of 5: {square(5)}");  // Output: 25

        // Func with two inputs, returns output
        Func<int, int, int> add = (a, b) => a + b;
        Console.WriteLine($"Sum: {add(3, 4)}");  // Output: 7

        // Func with string manipulation
        Func<string, string, string> concatenate = (s1, s2) => $"{s1} {s2}";
        Console.WriteLine(concatenate("Hello", "World"));  // Output: Hello World

        // Using Func in LINQ-style operations
        var numbers = new List<int> { 1, 2, 3, 4, 5 };
        var transformed = Transform(numbers, x => x * 2);
        // Result: [2, 4, 6, 8, 10]
    }

    public List<T> Transform<T>(List<T> items, Func<T, T> transformer)
    {
        var result = new List<T>();
        foreach (var item in items)
        {
            result.Add(transformer(item));
        }
        return result;
    }
}
```

### Predicate Delegates

`Predicate<T>` represents a method that takes one parameter and returns a boolean. It's commonly used for filtering and matching operations.

```csharp
public class PredicateExamples
{
    public void DemonstratePredicate()
    {
        // Simple predicate
        Predicate<int> isEven = num => num % 2 == 0;
        Console.WriteLine($"Is 4 even? {isEven(4)}");  // Output: True
        Console.WriteLine($"Is 7 even? {isEven(7)}");  // Output: False

        // Predicate with strings
        Predicate<string> isLongString = s => s.Length > 10;
        Console.WriteLine($"Is 'Hello' long? {isLongString("Hello")}");  // Output: False

        // Using Predicate with List.FindAll
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        var evenNumbers = numbers.FindAll(isEven);
        Console.WriteLine($"Even numbers: {string.Join(", ", evenNumbers)}");
        // Output: Even numbers: 2, 4, 6, 8, 10

        // Complex predicate with objects
        var products = new List<Product>
        {
            new Product("Laptop", 999.99m),
            new Product("Mouse", 29.99m),
            new Product("Keyboard", 79.99m),
            new Product("Monitor", 399.99m)
        };

        Predicate<Product> isExpensive = p => p.Price > 100;
        var expensiveProducts = products.FindAll(isExpensive);
    }
}

public record Product(string Name, decimal Price);
```

### Comparing Func, Action, and Predicate

```csharp
public class DelegateComparison
{
    public void CompareBuiltInDelegates()
    {
        // These are equivalent:
        Predicate<int> predicate = x => x > 0;
        Func<int, bool> funcEquivalent = x => x > 0;

        // Both can be used, but Predicate is more semantically clear for filtering
        var list = new List<int> { -2, -1, 0, 1, 2 };

        // List.FindAll expects Predicate<T>
        var positiveWithPredicate = list.FindAll(predicate);

        // LINQ Where expects Func<T, bool>
        var positiveWithFunc = list.Where(funcEquivalent).ToList();

        // Action vs Func<void> - Action is the only option for void returns
        Action doSomething = () => Console.WriteLine("Done!");
        // Func<void> doesn't exist - use Action instead
    }
}
```

## Multicast Delegates

Delegates in C# are multicast, meaning a single delegate instance can reference multiple methods. When invoked, all methods are called in the order they were added.

```csharp
public delegate void NotificationHandler(string message);

public class MulticastDelegateExample
{
    public static void SendEmail(string message)
    {
        Console.WriteLine($"Email sent: {message}");
    }

    public static void SendSMS(string message)
    {
        Console.WriteLine($"SMS sent: {message}");
    }

    public static void LogToConsole(string message)
    {
        Console.WriteLine($"Logged: {message}");
    }

    public static void SaveToDatabase(string message)
    {
        Console.WriteLine($"Saved to DB: {message}");
    }

    public static void Main()
    {
        // Create a multicast delegate
        NotificationHandler notifications = SendEmail;
        notifications += SendSMS;
        notifications += LogToConsole;
        notifications += SaveToDatabase;

        // Invoke all methods
        Console.WriteLine("--- Sending notification ---");
        notifications("Order #12345 confirmed");

        // Output:
        // --- Sending notification ---
        // Email sent: Order #12345 confirmed
        // SMS sent: Order #12345 confirmed
        // Logged: Order #12345 confirmed
        // Saved to DB: Order #12345 confirmed

        // Remove a method from the invocation list
        notifications -= SendSMS;

        Console.WriteLine("\n--- After removing SMS ---");
        notifications("Order #12346 shipped");

        // Get individual delegates
        Delegate[] invocationList = notifications.GetInvocationList();
        Console.WriteLine($"\nMethods in delegate: {invocationList.Length}");
    }
}
```

### Handling Return Values in Multicast Delegates

When a multicast delegate returns a value, only the last method's return value is captured. To get all return values, iterate through the invocation list.

```csharp
public delegate int Calculator(int value);

public class MulticastReturnValues
{
    public static int Double(int x) => x * 2;
    public static int Triple(int x) => x * 3;
    public static int Square(int x) => x * x;

    public static void Main()
    {
        Calculator calc = Double;
        calc += Triple;
        calc += Square;

        // Only returns the last result (Square)
        int result = calc(5);
        Console.WriteLine($"Last result: {result}");  // Output: 25

        // To get all results, iterate through the invocation list
        Console.WriteLine("\nAll results:");
        foreach (Calculator method in calc.GetInvocationList())
        {
            int individualResult = method(5);
            Console.WriteLine($"Result: {individualResult}");
        }
        // Output:
        // Result: 10
        // Result: 15
        // Result: 25
    }
}
```

## Events in C#

Events provide a way for a class to notify other classes when something of interest occurs. They are built on top of delegates but add important encapsulation and safety features.

### Basic Event Declaration and Usage

```csharp
public class Button
{
    // Declare an event using EventHandler
    public event EventHandler? Clicked;

    // Method to raise the event
    public void Click()
    {
        Console.WriteLine("Button was clicked!");

        // Safely raise the event
        OnClicked(EventArgs.Empty);
    }

    // Protected virtual method for raising the event
    protected virtual void OnClicked(EventArgs e)
    {
        Clicked?.Invoke(this, e);
    }
}

public class Program
{
    public static void Main()
    {
        var button = new Button();

        // Subscribe to the event
        button.Clicked += Button_Clicked;
        button.Clicked += (sender, e) => Console.WriteLine("Lambda handler executed");

        // Trigger the event
        button.Click();

        // Unsubscribe from the event
        button.Clicked -= Button_Clicked;
    }

    private static void Button_Clicked(object? sender, EventArgs e)
    {
        Console.WriteLine("Button_Clicked handler executed");
    }
}
```

### Custom EventArgs

For events that need to pass data, create a custom class that inherits from `EventArgs`.

```csharp
// Custom EventArgs class
public class OrderEventArgs : EventArgs
{
    public string OrderId { get; }
    public decimal Amount { get; }
    public DateTime OrderDate { get; }

    public OrderEventArgs(string orderId, decimal amount)
    {
        OrderId = orderId;
        Amount = amount;
        OrderDate = DateTime.Now;
    }
}

// Publisher class
public class OrderProcessor
{
    // Event with custom EventArgs
    public event EventHandler<OrderEventArgs>? OrderPlaced;
    public event EventHandler<OrderEventArgs>? OrderShipped;
    public event EventHandler<OrderEventArgs>? OrderCancelled;

    public void PlaceOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"Processing order {orderId}...");

        // Business logic here...

        // Raise the event
        OnOrderPlaced(new OrderEventArgs(orderId, amount));
    }

    public void ShipOrder(string orderId, decimal amount)
    {
        Console.WriteLine($"Shipping order {orderId}...");
        OnOrderShipped(new OrderEventArgs(orderId, amount));
    }

    protected virtual void OnOrderPlaced(OrderEventArgs e)
    {
        OrderPlaced?.Invoke(this, e);
    }

    protected virtual void OnOrderShipped(OrderEventArgs e)
    {
        OrderShipped?.Invoke(this, e);
    }
}

// Subscriber classes
public class EmailService
{
    public void OnOrderPlaced(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"Email: Order {e.OrderId} confirmed. Amount: ${e.Amount}");
    }

    public void OnOrderShipped(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"Email: Order {e.OrderId} has been shipped!");
    }
}

public class InventoryService
{
    public void OnOrderPlaced(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"Inventory: Reserving items for order {e.OrderId}");
    }
}

public class AnalyticsService
{
    public void OnOrderPlaced(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"Analytics: Recording order {e.OrderId}, Amount: ${e.Amount}");
    }
}

// Usage
public class OrderExample
{
    public static void Main()
    {
        var processor = new OrderProcessor();
        var emailService = new EmailService();
        var inventoryService = new InventoryService();
        var analyticsService = new AnalyticsService();

        // Subscribe to events
        processor.OrderPlaced += emailService.OnOrderPlaced;
        processor.OrderPlaced += inventoryService.OnOrderPlaced;
        processor.OrderPlaced += analyticsService.OnOrderPlaced;
        processor.OrderShipped += emailService.OnOrderShipped;

        // Place an order
        processor.PlaceOrder("ORD-001", 149.99m);

        Console.WriteLine();

        // Ship the order
        processor.ShipOrder("ORD-001", 149.99m);
    }
}
```

### Event Accessors

You can define custom add and remove accessors for events, similar to property accessors.

```csharp
public class EventAccessorExample
{
    private EventHandler<EventArgs>? _customEvent;
    private readonly object _lockObject = new object();

    // Event with custom accessors
    public event EventHandler<EventArgs>? CustomEvent
    {
        add
        {
            lock (_lockObject)
            {
                _customEvent += value;
                Console.WriteLine("Handler added to CustomEvent");
            }
        }
        remove
        {
            lock (_lockObject)
            {
                _customEvent -= value;
                Console.WriteLine("Handler removed from CustomEvent");
            }
        }
    }

    public void RaiseEvent()
    {
        _customEvent?.Invoke(this, EventArgs.Empty);
    }
}
```

## Event Patterns and Best Practices

### The Standard Event Pattern

Follow the standard .NET event pattern for consistency and interoperability:

```csharp
public class StandardEventPattern
{
    // 1. Define EventArgs (if needed)
    public class TemperatureChangedEventArgs : EventArgs
    {
        public double OldTemperature { get; }
        public double NewTemperature { get; }

        public TemperatureChangedEventArgs(double oldTemp, double newTemp)
        {
            OldTemperature = oldTemp;
            NewTemperature = newTemp;
        }
    }

    // 2. Declare the event using EventHandler<T>
    public event EventHandler<TemperatureChangedEventArgs>? TemperatureChanged;

    private double _temperature;

    public double Temperature
    {
        get => _temperature;
        set
        {
            if (_temperature != value)
            {
                double oldTemp = _temperature;
                _temperature = value;

                // 3. Raise the event through a protected virtual method
                OnTemperatureChanged(new TemperatureChangedEventArgs(oldTemp, value));
            }
        }
    }

    // 4. Protected virtual method to raise the event
    protected virtual void OnTemperatureChanged(TemperatureChangedEventArgs e)
    {
        // 5. Use null-conditional operator for thread safety
        TemperatureChanged?.Invoke(this, e);
    }
}
```

### Weak Event Pattern

To prevent memory leaks when subscribers outlive publishers, consider the weak event pattern:

```csharp
using System.Windows;

public class WeakEventExample
{
    // For WPF applications, use WeakEventManager
    public class DataChangedEventManager : WeakEventManager
    {
        private static DataChangedEventManager CurrentManager
        {
            get
            {
                var managerType = typeof(DataChangedEventManager);
                var manager = (DataChangedEventManager)GetCurrentManager(managerType);

                if (manager == null)
                {
                    manager = new DataChangedEventManager();
                    SetCurrentManager(managerType, manager);
                }

                return manager;
            }
        }

        public static void AddHandler(DataSource source, EventHandler<EventArgs> handler)
        {
            CurrentManager.ProtectedAddHandler(source, handler);
        }

        public static void RemoveHandler(DataSource source, EventHandler<EventArgs> handler)
        {
            CurrentManager.ProtectedRemoveHandler(source, handler);
        }

        protected override void StartListening(object source)
        {
            ((DataSource)source).DataChanged += OnDataChanged;
        }

        protected override void StopListening(object source)
        {
            ((DataSource)source).DataChanged -= OnDataChanged;
        }

        private void OnDataChanged(object? sender, EventArgs e)
        {
            DeliverEvent(sender, e);
        }
    }

    public class DataSource
    {
        public event EventHandler<EventArgs>? DataChanged;

        public void UpdateData()
        {
            DataChanged?.Invoke(this, EventArgs.Empty);
        }
    }
}
```

### Cancellable Events

Create events that subscribers can cancel:

```csharp
public class CancellableEventArgs : EventArgs
{
    public bool Cancel { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class FileDownloader
{
    public event EventHandler<CancellableEventArgs>? BeforeDownload;
    public event EventHandler<EventArgs>? DownloadCompleted;

    public bool DownloadFile(string url)
    {
        // Check if any subscriber wants to cancel
        var args = new CancellableEventArgs();
        OnBeforeDownload(args);

        if (args.Cancel)
        {
            Console.WriteLine($"Download cancelled: {args.Reason}");
            return false;
        }

        // Proceed with download
        Console.WriteLine($"Downloading: {url}");
        // ... download logic ...

        OnDownloadCompleted(EventArgs.Empty);
        return true;
    }

    protected virtual void OnBeforeDownload(CancellableEventArgs e)
    {
        BeforeDownload?.Invoke(this, e);
    }

    protected virtual void OnDownloadCompleted(EventArgs e)
    {
        DownloadCompleted?.Invoke(this, e);
    }
}

// Usage
public class CancellableEventExample
{
    public static void Main()
    {
        var downloader = new FileDownloader();

        // Subscriber that might cancel the download
        downloader.BeforeDownload += (sender, e) =>
        {
            // Example: Cancel if it's a certain file type
            Console.WriteLine("Checking download...");
            // e.Cancel = true;
            // e.Reason = "File type not allowed";
        };

        downloader.DownloadCompleted += (sender, e) =>
        {
            Console.WriteLine("Download completed successfully!");
        };

        downloader.DownloadFile("https://example.com/file.pdf");
    }
}
```

## Advanced Delegate Concepts

### Covariance and Contravariance

Delegates support covariance (for return types) and contravariance (for parameter types):

```csharp
public class Animal { }
public class Dog : Animal { }
public class Labrador : Dog { }

public class VarianceExample
{
    // Covariance: delegate can return a more derived type
    public delegate Animal AnimalFactory();

    public static Dog CreateDog() => new Dog();
    public static Labrador CreateLabrador() => new Labrador();

    // Contravariance: delegate can accept a more base type parameter
    public delegate void DogHandler(Dog dog);

    public static void HandleAnimal(Animal animal)
    {
        Console.WriteLine($"Handling: {animal.GetType().Name}");
    }

    public static void Main()
    {
        // Covariance: Dog is-a Animal, so this works
        AnimalFactory factory = CreateDog;
        Animal animal = factory();

        factory = CreateLabrador;
        animal = factory();

        // Contravariance: HandleAnimal accepts Animal,
        // which is a base of Dog, so this works
        DogHandler handler = HandleAnimal;
        handler(new Dog());
        handler(new Labrador());
    }
}
```

### Generic Delegates

Create reusable, type-safe delegates using generics:

```csharp
// Generic delegate for transformations
public delegate TOutput Transformer<TInput, TOutput>(TInput input);

// Generic delegate for comparisons
public delegate int Comparer<T>(T x, T y);

public class GenericDelegateExample
{
    public static void Main()
    {
        // String to int transformation
        Transformer<string, int> stringLength = s => s.Length;
        Console.WriteLine($"Length: {stringLength("Hello")}");  // Output: 5

        // Int to string transformation
        Transformer<int, string> intToHex = n => $"0x{n:X}";
        Console.WriteLine($"Hex: {intToHex(255)}");  // Output: 0xFF

        // Custom comparer
        Comparer<string> lengthComparer = (s1, s2) => s1.Length.CompareTo(s2.Length);
        Console.WriteLine($"Compare: {lengthComparer("Hi", "Hello")}");  // Output: -1

        // Using with sorting
        var words = new List<string> { "apple", "cat", "banana", "dog" };
        words.Sort(new Comparison<string>(lengthComparer));
        Console.WriteLine($"Sorted: {string.Join(", ", words)}");
        // Output: cat, dog, apple, banana
    }
}
```

### Asynchronous Delegates

Use delegates with async/await for asynchronous operations:

```csharp
public class AsyncDelegateExample
{
    // Async Func delegate
    public static async Task Main()
    {
        // Async lambda with Func
        Func<string, Task<int>> asyncProcessor = async (data) =>
        {
            await Task.Delay(100); // Simulate async work
            return data.Length;
        };

        int result = await asyncProcessor("Hello, Async World!");
        Console.WriteLine($"Processed length: {result}");

        // Async Action equivalent
        Func<string, Task> asyncLogger = async (message) =>
        {
            await Task.Delay(50);
            Console.WriteLine($"Logged: {message}");
        };

        await asyncLogger("This is an async log message");

        // Processing multiple items asynchronously
        var items = new[] { "Item1", "Item2", "Item3" };
        var tasks = items.Select(item => asyncProcessor(item));
        var results = await Task.WhenAll(tasks);

        Console.WriteLine($"Results: {string.Join(", ", results)}");
    }
}
```

## Practical Examples

### Observer Pattern Implementation

```csharp
public interface IObserver<T>
{
    void OnNext(T value);
    void OnError(Exception error);
    void OnCompleted();
}

public class StockTicker
{
    public event EventHandler<StockPriceEventArgs>? PriceChanged;

    private readonly Dictionary<string, decimal> _prices = new();

    public void UpdatePrice(string symbol, decimal newPrice)
    {
        decimal oldPrice = _prices.GetValueOrDefault(symbol, 0);
        _prices[symbol] = newPrice;

        OnPriceChanged(new StockPriceEventArgs(symbol, oldPrice, newPrice));
    }

    protected virtual void OnPriceChanged(StockPriceEventArgs e)
    {
        PriceChanged?.Invoke(this, e);
    }
}

public class StockPriceEventArgs : EventArgs
{
    public string Symbol { get; }
    public decimal OldPrice { get; }
    public decimal NewPrice { get; }
    public decimal Change => NewPrice - OldPrice;
    public decimal PercentChange => OldPrice > 0 ? (Change / OldPrice) * 100 : 0;

    public StockPriceEventArgs(string symbol, decimal oldPrice, decimal newPrice)
    {
        Symbol = symbol;
        OldPrice = oldPrice;
        NewPrice = newPrice;
    }
}

public class StockMonitor
{
    private readonly string _name;

    public StockMonitor(string name) => _name = name;

    public void Subscribe(StockTicker ticker)
    {
        ticker.PriceChanged += OnPriceChanged;
    }

    public void Unsubscribe(StockTicker ticker)
    {
        ticker.PriceChanged -= OnPriceChanged;
    }

    private void OnPriceChanged(object? sender, StockPriceEventArgs e)
    {
        string direction = e.Change >= 0 ? "up" : "down";
        Console.WriteLine($"[{_name}] {e.Symbol}: ${e.NewPrice:F2} " +
                         $"({direction} {Math.Abs(e.PercentChange):F2}%)");
    }
}

// Usage
public class ObserverPatternDemo
{
    public static void Main()
    {
        var ticker = new StockTicker();
        var monitor1 = new StockMonitor("Desktop");
        var monitor2 = new StockMonitor("Mobile");

        monitor1.Subscribe(ticker);
        monitor2.Subscribe(ticker);

        ticker.UpdatePrice("AAPL", 150.00m);
        ticker.UpdatePrice("GOOGL", 2800.00m);
        ticker.UpdatePrice("AAPL", 152.50m);

        monitor2.Unsubscribe(ticker);

        ticker.UpdatePrice("AAPL", 151.00m);
    }
}
```

### Command Pattern with Delegates

```csharp
public class CommandPattern
{
    public class TextEditor
    {
        private string _content = string.Empty;
        private readonly Stack<Action> _undoStack = new();
        private readonly Stack<Action> _redoStack = new();

        public string Content => _content;

        public void Execute(Action doAction, Action undoAction)
        {
            doAction();
            _undoStack.Push(undoAction);
            _redoStack.Clear();
        }

        public void InsertText(string text, int position)
        {
            Execute(
                () => _content = _content.Insert(position, text),
                () => _content = _content.Remove(position, text.Length)
            );
        }

        public void DeleteText(int position, int length)
        {
            string deleted = _content.Substring(position, length);
            Execute(
                () => _content = _content.Remove(position, length),
                () => _content = _content.Insert(position, deleted)
            );
        }

        public void Undo()
        {
            if (_undoStack.Count > 0)
            {
                var undoAction = _undoStack.Pop();
                undoAction();
                // Note: In a full implementation, we'd track redo here
            }
        }
    }

    public static void Main()
    {
        var editor = new TextEditor();

        editor.InsertText("Hello", 0);
        Console.WriteLine($"After insert: '{editor.Content}'");  // Hello

        editor.InsertText(" World", 5);
        Console.WriteLine($"After insert: '{editor.Content}'");  // Hello World

        editor.Undo();
        Console.WriteLine($"After undo: '{editor.Content}'");    // Hello
    }
}
```

### Event Aggregator Pattern

```csharp
public class EventAggregator
{
    private readonly Dictionary<Type, List<Delegate>> _handlers = new();

    public void Subscribe<TEvent>(Action<TEvent> handler)
    {
        var eventType = typeof(TEvent);

        if (!_handlers.ContainsKey(eventType))
        {
            _handlers[eventType] = new List<Delegate>();
        }

        _handlers[eventType].Add(handler);
    }

    public void Unsubscribe<TEvent>(Action<TEvent> handler)
    {
        var eventType = typeof(TEvent);

        if (_handlers.ContainsKey(eventType))
        {
            _handlers[eventType].Remove(handler);
        }
    }

    public void Publish<TEvent>(TEvent eventData)
    {
        var eventType = typeof(TEvent);

        if (_handlers.ContainsKey(eventType))
        {
            foreach (var handler in _handlers[eventType].ToList())
            {
                ((Action<TEvent>)handler)(eventData);
            }
        }
    }
}

// Event definitions
public record UserLoggedInEvent(string Username, DateTime LoginTime);
public record OrderCreatedEvent(string OrderId, decimal Total);

// Usage
public class EventAggregatorDemo
{
    public static void Main()
    {
        var aggregator = new EventAggregator();

        // Subscribe to events
        aggregator.Subscribe<UserLoggedInEvent>(e =>
            Console.WriteLine($"User {e.Username} logged in at {e.LoginTime}")
        );

        aggregator.Subscribe<OrderCreatedEvent>(e =>
            Console.WriteLine($"Order {e.OrderId} created: ${e.Total}")
        );

        aggregator.Subscribe<OrderCreatedEvent>(e =>
            Console.WriteLine($"Sending confirmation email for order {e.OrderId}")
        );

        // Publish events
        aggregator.Publish(new UserLoggedInEvent("john_doe", DateTime.Now));
        aggregator.Publish(new OrderCreatedEvent("ORD-001", 99.99m));
    }
}
```

## Common Pitfalls and Solutions

### Memory Leaks from Event Subscriptions

```csharp
public class MemoryLeakExample
{
    public class Publisher
    {
        public event EventHandler? SomeEvent;

        public void RaiseEvent() => SomeEvent?.Invoke(this, EventArgs.Empty);
    }

    public class Subscriber : IDisposable
    {
        private readonly Publisher _publisher;
        private bool _disposed;

        public Subscriber(Publisher publisher)
        {
            _publisher = publisher;
            _publisher.SomeEvent += OnSomeEvent;
        }

        private void OnSomeEvent(object? sender, EventArgs e)
        {
            Console.WriteLine("Event received");
        }

        // IMPORTANT: Always unsubscribe when done
        public void Dispose()
        {
            if (!_disposed)
            {
                _publisher.SomeEvent -= OnSomeEvent;
                _disposed = true;
            }
        }
    }

    public static void Main()
    {
        var publisher = new Publisher();

        using (var subscriber = new Subscriber(publisher))
        {
            publisher.RaiseEvent();
        }
        // Subscriber properly unsubscribed after using block
    }
}
```

### Thread Safety with Events

```csharp
public class ThreadSafeEvents
{
    private EventHandler<EventArgs>? _myEvent;
    private readonly object _eventLock = new();

    public event EventHandler<EventArgs>? MyEvent
    {
        add
        {
            lock (_eventLock)
            {
                _myEvent += value;
            }
        }
        remove
        {
            lock (_eventLock)
            {
                _myEvent -= value;
            }
        }
    }

    public void RaiseEvent()
    {
        // Create a local copy for thread safety
        EventHandler<EventArgs>? handler;
        lock (_eventLock)
        {
            handler = _myEvent;
        }

        // Invoke outside the lock
        handler?.Invoke(this, EventArgs.Empty);
    }
}
```

### Avoiding Null Reference Exceptions

```csharp
public class NullSafeEvents
{
    public event EventHandler<EventArgs>? MyEvent;

    // Method 1: Null-conditional operator (C# 6+)
    public void RaiseEventSafe1()
    {
        MyEvent?.Invoke(this, EventArgs.Empty);
    }

    // Method 2: Local copy (older pattern, still valid)
    public void RaiseEventSafe2()
    {
        var handler = MyEvent;
        if (handler != null)
        {
            handler(this, EventArgs.Empty);
        }
    }

    // Method 3: Initialize with empty delegate
    public event EventHandler<EventArgs> AlwaysSafeEvent = delegate { };

    public void RaiseAlwaysSafe()
    {
        // No null check needed
        AlwaysSafeEvent(this, EventArgs.Empty);
    }
}
```

## Summary

Delegates and events are powerful features in C# that enable:

- **Delegates**: Type-safe function pointers that allow methods to be passed as parameters, stored in variables, and invoked dynamically
- **Built-in delegates**: `Func<>`, `Action<>`, and `Predicate<>` cover most common delegate scenarios
- **Multicast delegates**: Allow multiple methods to be called from a single delegate invocation
- **Events**: Provide encapsulated publish-subscribe patterns with proper access control
- **Standard patterns**: Follow the .NET event pattern with `EventHandler<TEventArgs>` for consistency

Key best practices:

1. Use built-in delegate types when possible
2. Follow the standard event pattern with protected virtual raise methods
3. Always unsubscribe from events to prevent memory leaks
4. Use the null-conditional operator for thread-safe event invocation
5. Consider weak events for long-lived publishers with short-lived subscribers

Understanding delegates and events is essential for writing loosely coupled, maintainable C# code and implementing common design patterns like Observer, Command, and Strategy.
