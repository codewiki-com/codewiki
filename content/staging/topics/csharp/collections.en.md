---
title: C# Collections Framework
description: Complete guide to C# collection types including List, Dictionary, HashSet and concurrent collections
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - collections
  - data structures
  - generics
status: imported
origin: old/src/content/docs/csharp/collections.en.md
divergence: 0.309
issues: []
legacy:
  category: CSharp
  subcategory: Data Structures
  order: 11
  lastUpdated: 2026-01-07
---

The .NET Collections Framework provides a comprehensive set of data structures for storing, organizing, and manipulating groups of objects. Understanding when and how to use different collection types is essential for writing efficient and maintainable C# code.

## Overview of Collection Types

C# collections are organized into several namespaces and categories:

| Namespace | Purpose |
|-----------|---------|
| `System.Collections.Generic` | Generic type-safe collections |
| `System.Collections.Concurrent` | Thread-safe collections for parallel programming |
| `System.Collections.Immutable` | Immutable collections that cannot be modified |
| `System.Collections.ObjectModel` | Observable and read-only collection wrappers |
| `System.Collections` | Legacy non-generic collections (avoid in new code) |

### Choosing the Right Collection

```
Need key-value lookup?
├── Yes → Dictionary<TKey, TValue>
│         └── Need sorted keys? → SortedDictionary<TKey, TValue>
│         └── Need thread-safety? → ConcurrentDictionary<TKey, TValue>
└── No → Need unique elements?
          ├── Yes → HashSet<T>
          │         └── Need sorted? → SortedSet<T>
          └── No → Need FIFO order?
                    ├── Yes → Queue<T>
                    └── No → Need LIFO order?
                              ├── Yes → Stack<T>
                              └── No → Need fast insert/remove at both ends?
                                        ├── Yes → LinkedList<T>
                                        └── No → List<T>
```

## List<T>: The Dynamic Array

`List<T>` is the most commonly used collection in C#. It provides a dynamic array that grows automatically as elements are added.

### Basic Operations

```csharp
// Creating lists
var numbers = new List<int>();
var names = new List<string> { "Alice", "Bob", "Charlie" };
var fromArray = new List<int>(new[] { 1, 2, 3, 4, 5 });
var withCapacity = new List<int>(100); // Pre-allocate for performance

// Adding elements
numbers.Add(1);
numbers.Add(2);
numbers.AddRange(new[] { 3, 4, 5 });
numbers.Insert(0, 0); // Insert at index 0

// Accessing elements
int first = numbers[0];
int last = numbers[^1]; // C# 8.0+ index from end
var slice = numbers[1..4]; // Range: elements 1, 2, 3

// Removing elements
numbers.Remove(3); // Remove first occurrence of 3
numbers.RemoveAt(0); // Remove element at index 0
numbers.RemoveAll(n => n % 2 == 0); // Remove all even numbers
numbers.RemoveRange(0, 2); // Remove 2 elements starting at index 0
numbers.Clear(); // Remove all elements
```

### Searching and Filtering

```csharp
var people = new List<Person>
{
    new Person { Name = "Alice", Age = 30 },
    new Person { Name = "Bob", Age = 25 },
    new Person { Name = "Charlie", Age = 35 },
    new Person { Name = "Diana", Age = 28 }
};

// Finding elements
Person alice = people.Find(p => p.Name == "Alice");
Person lastOver30 = people.FindLast(p => p.Age > 30);
int index = people.FindIndex(p => p.Age > 30);
int lastIndex = people.FindLastIndex(p => p.Age > 30);

// Finding multiple elements
List<Person> adults = people.FindAll(p => p.Age >= 18);

// Checking existence
bool hasAlice = people.Exists(p => p.Name == "Alice");
bool allAdults = people.TrueForAll(p => p.Age >= 18);
bool containsBob = people.Any(p => p.Name == "Bob"); // LINQ

// Binary search (requires sorted list)
var sortedNumbers = new List<int> { 1, 3, 5, 7, 9, 11 };
int binaryIndex = sortedNumbers.BinarySearch(7); // Returns 3
```

### Sorting and Transforming

```csharp
var numbers = new List<int> { 5, 2, 8, 1, 9, 3 };

// Basic sorting
numbers.Sort(); // Ascending order
numbers.Sort((a, b) => b.CompareTo(a)); // Descending order

// Sorting complex objects
var people = new List<Person>
{
    new Person { Name = "Charlie", Age = 35 },
    new Person { Name = "Alice", Age = 30 },
    new Person { Name = "Bob", Age = 25 }
};

// Sort by single property
people.Sort((a, b) => a.Name.CompareTo(b.Name));

// Sort by multiple properties
people.Sort((a, b) =>
{
    int ageComparison = a.Age.CompareTo(b.Age);
    return ageComparison != 0 ? ageComparison : a.Name.CompareTo(b.Name);
});

// Using IComparer<T>
people.Sort(Comparer<Person>.Create((a, b) => a.Age - b.Age));

// Reversing
numbers.Reverse();

// Transforming
var doubled = numbers.ConvertAll(n => n * 2);

// ForEach
numbers.ForEach(n => Console.WriteLine(n));
```

### Performance Considerations

```csharp
// Pre-allocate capacity when size is known
var largeList = new List<int>(10000);
for (int i = 0; i < 10000; i++)
{
    largeList.Add(i); // No resizing needed
}

// Check capacity and count
Console.WriteLine($"Count: {largeList.Count}");
Console.WriteLine($"Capacity: {largeList.Capacity}");

// Trim excess capacity
largeList.TrimExcess();

// Performance characteristics:
// - Add (end): O(1) amortized, O(n) when resizing
// - Insert (middle): O(n)
// - Remove (by index): O(n)
// - Access by index: O(1)
// - Find/Contains: O(n)
// - BinarySearch: O(log n) on sorted list
```

## Dictionary<TKey, TValue>: Key-Value Storage

`Dictionary<TKey, TValue>` provides fast lookup, insertion, and deletion of key-value pairs using hash-based storage.

### Basic Operations

```csharp
// Creating dictionaries
var ages = new Dictionary<string, int>();
var scores = new Dictionary<string, int>
{
    ["Alice"] = 100,
    ["Bob"] = 85,
    ["Charlie"] = 92
};

// Alternative initialization syntax
var config = new Dictionary<string, string>
{
    { "host", "localhost" },
    { "port", "8080" },
    { "timeout", "30" }
};

// Adding and updating
ages["Alice"] = 30;
ages["Bob"] = 25;
ages.Add("Charlie", 35); // Throws if key exists
ages.TryAdd("Diana", 28); // Returns false if key exists

// Safe retrieval
if (ages.TryGetValue("Alice", out int aliceAge))
{
    Console.WriteLine($"Alice is {aliceAge} years old");
}

// GetValueOrDefault (C# 7.1+)
int unknownAge = ages.GetValueOrDefault("Unknown", -1);

// Checking keys and values
bool hasAlice = ages.ContainsKey("Alice");
bool hasAge30 = ages.ContainsValue(30);

// Removing
ages.Remove("Bob");
ages.Remove("Charlie", out int charlieAge); // Also returns the value
ages.Clear();
```

### Iteration Patterns

```csharp
var inventory = new Dictionary<string, int>
{
    ["Apples"] = 50,
    ["Oranges"] = 30,
    ["Bananas"] = 25
};

// Iterating over key-value pairs
foreach (KeyValuePair<string, int> kvp in inventory)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}

// Deconstruction (C# 7.0+)
foreach (var (item, quantity) in inventory)
{
    Console.WriteLine($"{item}: {quantity}");
}

// Iterating over keys only
foreach (string item in inventory.Keys)
{
    Console.WriteLine(item);
}

// Iterating over values only
foreach (int quantity in inventory.Values)
{
    Console.WriteLine(quantity);
}

// LINQ operations
var lowStock = inventory
    .Where(kvp => kvp.Value < 35)
    .Select(kvp => kvp.Key)
    .ToList();
```

### Custom Key Types

When using custom types as dictionary keys, you must override `GetHashCode()` and `Equals()`:

```csharp
public class Coordinate : IEquatable<Coordinate>
{
    public int X { get; }
    public int Y { get; }

    public Coordinate(int x, int y)
    {
        X = x;
        Y = y;
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(X, Y);
    }

    public override bool Equals(object obj)
    {
        return Equals(obj as Coordinate);
    }

    public bool Equals(Coordinate other)
    {
        if (other is null) return false;
        return X == other.X && Y == other.Y;
    }
}

// Using record types (C# 9.0+) - automatically implements equality
public record Point(int X, int Y);

// Usage
var grid = new Dictionary<Coordinate, string>();
grid[new Coordinate(0, 0)] = "Origin";
grid[new Coordinate(1, 1)] = "Diagonal";

var pointGrid = new Dictionary<Point, string>();
pointGrid[new Point(0, 0)] = "Origin";
```

### Custom Equality Comparers

```csharp
// Case-insensitive string dictionary
var caseInsensitive = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
{
    ["Apple"] = 1
};

Console.WriteLine(caseInsensitive["APPLE"]); // Works: returns 1
Console.WriteLine(caseInsensitive["apple"]); // Works: returns 1

// Custom comparer
public class ModuloComparer : IEqualityComparer<int>
{
    private readonly int divisor;

    public ModuloComparer(int divisor)
    {
        this.divisor = divisor;
    }

    public bool Equals(int x, int y)
    {
        return x % divisor == y % divisor;
    }

    public int GetHashCode(int obj)
    {
        return (obj % divisor).GetHashCode();
    }
}

// Group by modulo 3
var moduloDict = new Dictionary<int, string>(new ModuloComparer(3));
moduloDict[0] = "Zero mod 3";
moduloDict[1] = "One mod 3";
moduloDict[2] = "Two mod 3";
// moduloDict[3] would overwrite key 0
```

## HashSet<T>: Unique Element Collections

`HashSet<T>` stores unique elements with O(1) average lookup, add, and remove operations.

### Basic Operations

```csharp
// Creating hash sets
var numbers = new HashSet<int>();
var fruits = new HashSet<string> { "Apple", "Banana", "Cherry" };

// Adding elements
numbers.Add(1);
numbers.Add(2);
numbers.Add(1); // No effect - duplicate
bool wasAdded = numbers.Add(3); // Returns true

// Removing elements
numbers.Remove(1);
int removed = numbers.RemoveWhere(n => n % 2 == 0); // Remove all even

// Checking membership
bool hasApple = fruits.Contains("Apple"); // O(1)

// Converting
int[] array = numbers.ToArray();
List<int> list = numbers.ToList();
```

### Set Operations

HashSet provides efficient mathematical set operations:

```csharp
var setA = new HashSet<int> { 1, 2, 3, 4, 5 };
var setB = new HashSet<int> { 4, 5, 6, 7, 8 };

// Union: elements in either set
var union = new HashSet<int>(setA);
union.UnionWith(setB); // { 1, 2, 3, 4, 5, 6, 7, 8 }

// Intersection: elements in both sets
var intersection = new HashSet<int>(setA);
intersection.IntersectWith(setB); // { 4, 5 }

// Difference: elements in A but not in B
var difference = new HashSet<int>(setA);
difference.ExceptWith(setB); // { 1, 2, 3 }

// Symmetric difference: elements in either but not both
var symmetricDiff = new HashSet<int>(setA);
symmetricDiff.SymmetricExceptWith(setB); // { 1, 2, 3, 6, 7, 8 }

// Set relationships
bool isSubset = setA.IsSubsetOf(setB);
bool isSuperset = setA.IsSupersetOf(setB);
bool isProperSubset = setA.IsProperSubsetOf(setB);
bool overlaps = setA.Overlaps(setB);
bool setEquals = setA.SetEquals(setB);
```

### Practical Examples

```csharp
// Remove duplicates from a list
var listWithDuplicates = new List<int> { 1, 2, 2, 3, 3, 3, 4, 4, 4, 4 };
var uniqueItems = new HashSet<int>(listWithDuplicates).ToList();

// Find common elements
var list1 = new List<string> { "a", "b", "c", "d" };
var list2 = new List<string> { "c", "d", "e", "f" };
var common = new HashSet<string>(list1);
common.IntersectWith(list2); // { "c", "d" }

// Track visited items
public class WebCrawler
{
    private readonly HashSet<string> visitedUrls = new();

    public async Task CrawlAsync(string url)
    {
        if (!visitedUrls.Add(url))
        {
            return; // Already visited
        }

        // Process the URL...
        var links = await ExtractLinksAsync(url);
        foreach (var link in links)
        {
            await CrawlAsync(link);
        }
    }
}

// Tag system
public class Article
{
    public string Title { get; set; }
    public HashSet<string> Tags { get; } = new(StringComparer.OrdinalIgnoreCase);

    public void AddTags(params string[] tags)
    {
        foreach (var tag in tags)
        {
            Tags.Add(tag);
        }
    }

    public bool HasTag(string tag) => Tags.Contains(tag);
}
```

## Queue<T> and Stack<T>

### Queue<T>: First-In, First-Out (FIFO)

```csharp
var queue = new Queue<string>();

// Adding elements
queue.Enqueue("First");
queue.Enqueue("Second");
queue.Enqueue("Third");

// Peeking (doesn't remove)
string front = queue.Peek(); // "First"

// Removing elements
string dequeued = queue.Dequeue(); // "First"

// Safe operations
if (queue.TryPeek(out string peeked))
{
    Console.WriteLine($"Front: {peeked}");
}

if (queue.TryDequeue(out string item))
{
    Console.WriteLine($"Dequeued: {item}");
}

// Check count
Console.WriteLine($"Items remaining: {queue.Count}");

// Convert to array (preserves order)
string[] array = queue.ToArray();
```

### Practical Queue Example: Task Processor

```csharp
public class TaskProcessor<T>
{
    private readonly Queue<T> taskQueue = new();
    private readonly Action<T> processAction;

    public TaskProcessor(Action<T> processAction)
    {
        this.processAction = processAction;
    }

    public void EnqueueTask(T task)
    {
        taskQueue.Enqueue(task);
    }

    public void ProcessAll()
    {
        while (taskQueue.Count > 0)
        {
            var task = taskQueue.Dequeue();
            processAction(task);
        }
    }

    public void ProcessBatch(int batchSize)
    {
        int processed = 0;
        while (processed < batchSize && taskQueue.Count > 0)
        {
            var task = taskQueue.Dequeue();
            processAction(task);
            processed++;
        }
    }
}

// Usage
var processor = new TaskProcessor<string>(task =>
    Console.WriteLine($"Processing: {task}"));

processor.EnqueueTask("Task 1");
processor.EnqueueTask("Task 2");
processor.EnqueueTask("Task 3");
processor.ProcessAll();
```

### Stack<T>: Last-In, First-Out (LIFO)

```csharp
var stack = new Stack<int>();

// Adding elements
stack.Push(1);
stack.Push(2);
stack.Push(3);

// Peeking (doesn't remove)
int top = stack.Peek(); // 3

// Removing elements
int popped = stack.Pop(); // 3

// Safe operations
if (stack.TryPeek(out int peekedItem))
{
    Console.WriteLine($"Top: {peekedItem}");
}

if (stack.TryPop(out int poppedItem))
{
    Console.WriteLine($"Popped: {poppedItem}");
}

// Check if contains
bool hasOne = stack.Contains(1);

// Iterate (from top to bottom)
foreach (var item in stack)
{
    Console.WriteLine(item);
}
```

### Practical Stack Example: Undo System

```csharp
public class UndoRedoManager<T>
{
    private readonly Stack<T> undoStack = new();
    private readonly Stack<T> redoStack = new();
    private T currentState;

    public UndoRedoManager(T initialState)
    {
        currentState = initialState;
    }

    public T CurrentState => currentState;

    public void Execute(T newState)
    {
        undoStack.Push(currentState);
        currentState = newState;
        redoStack.Clear(); // Clear redo history on new action
    }

    public bool CanUndo => undoStack.Count > 0;
    public bool CanRedo => redoStack.Count > 0;

    public void Undo()
    {
        if (!CanUndo) return;

        redoStack.Push(currentState);
        currentState = undoStack.Pop();
    }

    public void Redo()
    {
        if (!CanRedo) return;

        undoStack.Push(currentState);
        currentState = redoStack.Pop();
    }
}

// Usage
var editor = new UndoRedoManager<string>("Initial text");
editor.Execute("First edit");
editor.Execute("Second edit");
Console.WriteLine(editor.CurrentState); // "Second edit"

editor.Undo();
Console.WriteLine(editor.CurrentState); // "First edit"

editor.Redo();
Console.WriteLine(editor.CurrentState); // "Second edit"
```

## LinkedList<T>: Doubly-Linked List

`LinkedList<T>` provides O(1) insertion and removal at any position, but O(n) access by index.

### Basic Operations

```csharp
var list = new LinkedList<string>();

// Adding elements
list.AddFirst("First");
list.AddLast("Last");

LinkedListNode<string> firstNode = list.First;
LinkedListNode<string> lastNode = list.Last;

list.AddAfter(firstNode, "Second");
list.AddBefore(lastNode, "Third");
// List: First -> Second -> Third -> Last

// Finding nodes
LinkedListNode<string> secondNode = list.Find("Second");
LinkedListNode<string> thirdNode = list.FindLast("Third");

// Removing nodes
list.Remove("Second");
list.Remove(thirdNode);
list.RemoveFirst();
list.RemoveLast();

// Navigating
var current = list.First;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Next;
}

// Reverse navigation
current = list.Last;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Previous;
}
```

### Practical Example: LRU Cache

```csharp
public class LRUCache<TKey, TValue>
{
    private readonly int capacity;
    private readonly Dictionary<TKey, LinkedListNode<(TKey Key, TValue Value)>> cache;
    private readonly LinkedList<(TKey Key, TValue Value)> order;

    public LRUCache(int capacity)
    {
        this.capacity = capacity;
        cache = new Dictionary<TKey, LinkedListNode<(TKey, TValue)>>(capacity);
        order = new LinkedList<(TKey, TValue)>();
    }

    public bool TryGet(TKey key, out TValue value)
    {
        if (cache.TryGetValue(key, out var node))
        {
            // Move to front (most recently used)
            order.Remove(node);
            order.AddFirst(node);
            value = node.Value.Value;
            return true;
        }

        value = default;
        return false;
    }

    public void Put(TKey key, TValue value)
    {
        if (cache.TryGetValue(key, out var existingNode))
        {
            // Update existing
            order.Remove(existingNode);
            existingNode.Value = (key, value);
            order.AddFirst(existingNode);
        }
        else
        {
            // Add new
            if (cache.Count >= capacity)
            {
                // Remove least recently used (last)
                var lru = order.Last;
                order.RemoveLast();
                cache.Remove(lru.Value.Key);
            }

            var newNode = new LinkedListNode<(TKey, TValue)>((key, value));
            order.AddFirst(newNode);
            cache[key] = newNode;
        }
    }

    public int Count => cache.Count;
}

// Usage
var cache = new LRUCache<string, int>(3);
cache.Put("a", 1);
cache.Put("b", 2);
cache.Put("c", 3);
cache.TryGet("a", out _); // "a" is now most recently used
cache.Put("d", 4); // "b" is evicted (least recently used)
```

## Sorted Collections

### SortedList<TKey, TValue>

Uses a sorted array internally; efficient memory usage but slower insertion:

```csharp
var sortedList = new SortedList<string, int>
{
    ["Charlie"] = 3,
    ["Alice"] = 1,
    ["Bob"] = 2
};

// Keys are automatically sorted
foreach (var key in sortedList.Keys)
{
    Console.WriteLine(key); // Alice, Bob, Charlie
}

// Access by index (O(1))
string firstKey = sortedList.Keys[0]; // "Alice"
int firstValue = sortedList.Values[0]; // 1

// Access by key (O(log n))
int aliceValue = sortedList["Alice"];

// Get index of key
int index = sortedList.IndexOfKey("Bob"); // 1
```

### SortedDictionary<TKey, TValue>

Uses a red-black tree; faster insertion but more memory:

```csharp
var sortedDict = new SortedDictionary<int, string>
{
    [3] = "Three",
    [1] = "One",
    [2] = "Two"
};

// Iteration is in sorted order
foreach (var kvp in sortedDict)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}
// Output: 1: One, 2: Two, 3: Three

// Custom comparer for descending order
var descending = new SortedDictionary<int, string>(
    Comparer<int>.Create((a, b) => b.CompareTo(a)));
```

### SortedSet<T>

A sorted collection of unique elements:

```csharp
var sortedSet = new SortedSet<int> { 5, 2, 8, 1, 9, 3 };

// Iteration in sorted order
foreach (var num in sortedSet)
{
    Console.WriteLine(num); // 1, 2, 3, 5, 8, 9
}

// Get range views
var range = sortedSet.GetViewBetween(2, 8);
foreach (var num in range)
{
    Console.WriteLine(num); // 2, 3, 5, 8
}

// Min and Max
int min = sortedSet.Min; // 1
int max = sortedSet.Max; // 9

// Reverse iteration
foreach (var num in sortedSet.Reverse())
{
    Console.WriteLine(num); // 9, 8, 5, 3, 2, 1
}

// Custom comparer
var descending = new SortedSet<int>(Comparer<int>.Create((a, b) => b.CompareTo(a)));
```

### Comparison of Sorted Collections

| Operation | SortedList | SortedDictionary | SortedSet |
|-----------|------------|------------------|-----------|
| Add | O(n) | O(log n) | O(log n) |
| Remove | O(n) | O(log n) | O(log n) |
| Lookup by key | O(log n) | O(log n) | O(log n) |
| Lookup by index | O(1) | O(n) | O(n) |
| Memory | Lower | Higher | Moderate |

## Concurrent Collections

Thread-safe collections for multi-threaded scenarios are in `System.Collections.Concurrent`.

### ConcurrentDictionary<TKey, TValue>

```csharp
var concurrentDict = new ConcurrentDictionary<string, int>();

// Thread-safe add or update
concurrentDict.TryAdd("key1", 1);
concurrentDict.AddOrUpdate("key1", 1, (key, oldValue) => oldValue + 1);
concurrentDict["key2"] = 2;

// Thread-safe get or add
int value = concurrentDict.GetOrAdd("key3", 3);
int computed = concurrentDict.GetOrAdd("key4", key => key.Length);

// Thread-safe update
concurrentDict.TryUpdate("key1", newValue: 10, comparisonValue: 2);

// Thread-safe remove
concurrentDict.TryRemove("key1", out int removed);

// Practical example: Thread-safe counter
public class ThreadSafeCounter
{
    private readonly ConcurrentDictionary<string, int> counters = new();

    public void Increment(string key)
    {
        counters.AddOrUpdate(key, 1, (_, count) => count + 1);
    }

    public int GetCount(string key)
    {
        return counters.GetValueOrDefault(key, 0);
    }
}
```

### ConcurrentQueue<T> and ConcurrentStack<T>

```csharp
var queue = new ConcurrentQueue<int>();

// Enqueue is thread-safe
queue.Enqueue(1);
queue.Enqueue(2);

// TryDequeue instead of Dequeue
if (queue.TryDequeue(out int item))
{
    Console.WriteLine(item);
}

// TryPeek for peeking
if (queue.TryPeek(out int front))
{
    Console.WriteLine($"Front: {front}");
}

// ConcurrentStack works similarly
var stack = new ConcurrentStack<int>();
stack.Push(1);
stack.PushRange(new[] { 2, 3, 4 });

if (stack.TryPop(out int top))
{
    Console.WriteLine(top);
}

// Pop multiple items
int[] items = new int[2];
int popped = stack.TryPopRange(items);
```

### ConcurrentBag<T>

An unordered, thread-safe collection optimized for scenarios where the same thread produces and consumes items:

```csharp
var bag = new ConcurrentBag<int>();

// Add items
bag.Add(1);
bag.Add(2);
bag.Add(3);

// Try to take an item (no guaranteed order)
if (bag.TryTake(out int item))
{
    Console.WriteLine(item);
}

// Try to peek
if (bag.TryPeek(out int peeked))
{
    Console.WriteLine(peeked);
}

// Practical example: Parallel processing
var results = new ConcurrentBag<ProcessResult>();

Parallel.ForEach(items, item =>
{
    var result = ProcessItem(item);
    results.Add(result);
});
```

### BlockingCollection<T>

A wrapper that adds blocking and bounding capabilities:

```csharp
// Bounded collection with max capacity
var collection = new BlockingCollection<int>(boundedCapacity: 10);

// Producer thread
Task.Run(() =>
{
    for (int i = 0; i < 100; i++)
    {
        collection.Add(i); // Blocks if collection is full
    }
    collection.CompleteAdding();
});

// Consumer thread
Task.Run(() =>
{
    // GetConsumingEnumerable blocks until items are available
    foreach (var item in collection.GetConsumingEnumerable())
    {
        Console.WriteLine($"Consumed: {item}");
    }
});

// Producer-consumer pattern
public class ProducerConsumer<T>
{
    private readonly BlockingCollection<T> queue;
    private readonly Action<T> consumer;
    private readonly CancellationTokenSource cts = new();

    public ProducerConsumer(Action<T> consumer, int boundedCapacity = -1)
    {
        queue = boundedCapacity > 0
            ? new BlockingCollection<T>(boundedCapacity)
            : new BlockingCollection<T>();
        this.consumer = consumer;
        StartConsumer();
    }

    public void Produce(T item)
    {
        queue.Add(item);
    }

    private void StartConsumer()
    {
        Task.Run(() =>
        {
            try
            {
                foreach (var item in queue.GetConsumingEnumerable(cts.Token))
                {
                    consumer(item);
                }
            }
            catch (OperationCanceledException) { }
        });
    }

    public void Complete()
    {
        queue.CompleteAdding();
    }

    public void Cancel()
    {
        cts.Cancel();
    }
}
```

## Immutable Collections

Immutable collections from `System.Collections.Immutable` cannot be modified after creation. Instead, operations return new instances.

### ImmutableList<T>

```csharp
using System.Collections.Immutable;

// Creating
var empty = ImmutableList<int>.Empty;
var list = ImmutableList.Create(1, 2, 3);
var fromEnumerable = new[] { 1, 2, 3 }.ToImmutableList();

// "Modifying" returns a new list
ImmutableList<int> list2 = list.Add(4);
ImmutableList<int> list3 = list2.Remove(2);
ImmutableList<int> list4 = list3.SetItem(0, 100);

Console.WriteLine(string.Join(", ", list));  // 1, 2, 3
Console.WriteLine(string.Join(", ", list4)); // 100, 3, 4

// Efficient batch modifications with builder
var builder = ImmutableList.CreateBuilder<int>();
for (int i = 0; i < 1000; i++)
{
    builder.Add(i);
}
ImmutableList<int> finalList = builder.ToImmutable();

// Or convert existing to builder
var existingBuilder = list.ToBuilder();
existingBuilder.Add(10);
existingBuilder.Add(20);
ImmutableList<int> modified = existingBuilder.ToImmutable();
```

### ImmutableDictionary<TKey, TValue>

```csharp
var dict = ImmutableDictionary<string, int>.Empty
    .Add("one", 1)
    .Add("two", 2)
    .Add("three", 3);

// Updates return new dictionary
var updated = dict.SetItem("one", 100);
var removed = updated.Remove("two");

// Contains original values
Console.WriteLine(dict["one"]); // 1

// Contains modified values
Console.WriteLine(updated["one"]); // 100

// Builder for batch operations
var builder = ImmutableDictionary.CreateBuilder<string, int>();
builder.AddRange(new[]
{
    new KeyValuePair<string, int>("a", 1),
    new KeyValuePair<string, int>("b", 2)
});
var immutableDict = builder.ToImmutable();
```

### ImmutableHashSet<T> and ImmutableSortedSet<T>

```csharp
var set = ImmutableHashSet.Create(1, 2, 3);
var set2 = set.Add(4).Remove(2);

// Set operations return new sets
var setA = ImmutableHashSet.Create(1, 2, 3, 4);
var setB = ImmutableHashSet.Create(3, 4, 5, 6);

var union = setA.Union(setB);
var intersection = setA.Intersect(setB);
var difference = setA.Except(setB);

// Sorted set
var sortedSet = ImmutableSortedSet.Create(5, 2, 8, 1);
foreach (var item in sortedSet)
{
    Console.WriteLine(item); // 1, 2, 5, 8
}
```

### Benefits of Immutable Collections

```csharp
// Thread-safe by nature
public class ImmutableCache<TKey, TValue>
{
    private ImmutableDictionary<TKey, TValue> cache =
        ImmutableDictionary<TKey, TValue>.Empty;

    public TValue GetOrAdd(TKey key, Func<TKey, TValue> factory)
    {
        // No locking needed for reads
        if (cache.TryGetValue(key, out var value))
        {
            return value;
        }

        // Atomic update using Interlocked
        var newValue = factory(key);
        var newCache = cache.Add(key, newValue);
        Interlocked.CompareExchange(ref cache, newCache, cache);

        return newValue;
    }
}

// Safe to pass around without defensive copying
public class ConfigurationService
{
    public ImmutableDictionary<string, string> Settings { get; private set; }
        = ImmutableDictionary<string, string>.Empty;

    public void UpdateSetting(string key, string value)
    {
        Settings = Settings.SetItem(key, value);
    }

    // Callers get an immutable snapshot
    public ImmutableDictionary<string, string> GetSettings() => Settings;
}
```

## Observable Collections

`System.Collections.ObjectModel` provides collections that notify when items are added or removed.

### ObservableCollection<T>

```csharp
using System.Collections.ObjectModel;
using System.Collections.Specialized;

var collection = new ObservableCollection<string>();

// Subscribe to changes
collection.CollectionChanged += (sender, e) =>
{
    switch (e.Action)
    {
        case NotifyCollectionChangedAction.Add:
            Console.WriteLine($"Added: {string.Join(", ", e.NewItems)}");
            break;
        case NotifyCollectionChangedAction.Remove:
            Console.WriteLine($"Removed: {string.Join(", ", e.OldItems)}");
            break;
        case NotifyCollectionChangedAction.Replace:
            Console.WriteLine($"Replaced {e.OldItems[0]} with {e.NewItems[0]}");
            break;
        case NotifyCollectionChangedAction.Move:
            Console.WriteLine($"Moved from {e.OldStartingIndex} to {e.NewStartingIndex}");
            break;
        case NotifyCollectionChangedAction.Reset:
            Console.WriteLine("Collection was cleared");
            break;
    }
};

collection.Add("Item 1");      // Triggers Add
collection.Add("Item 2");      // Triggers Add
collection[0] = "Modified";    // Triggers Replace
collection.Move(0, 1);         // Triggers Move
collection.Remove("Item 2");   // Triggers Remove
collection.Clear();            // Triggers Reset
```

### Read-Only Collections

```csharp
// ReadOnlyCollection<T> - wraps an existing list
var list = new List<int> { 1, 2, 3 };
var readOnly = list.AsReadOnly();
// readOnly.Add(4); // Compile error!

// But changes to original list are reflected
list.Add(4);
Console.WriteLine(readOnly.Count); // 4

// ReadOnlyDictionary<TKey, TValue>
var dict = new Dictionary<string, int> { ["a"] = 1 };
var readOnlyDict = new ReadOnlyDictionary<string, int>(dict);

// IReadOnlyList<T> and IReadOnlyCollection<T> interfaces
public IReadOnlyList<Person> GetPeople()
{
    var people = new List<Person>();
    // ... populate list
    return people; // Implicitly cast to IReadOnlyList<T>
}
```

## Collection Interfaces Hierarchy

Understanding the collection interfaces helps in choosing the right abstraction:

```
IEnumerable<T>
    |
    +-- ICollection<T>
    |       |
    |       +-- IList<T>
    |       |       |
    |       |       +-- List<T>
    |       |       +-- T[]
    |       |
    |       +-- ISet<T>
    |               |
    |               +-- HashSet<T>
    |               +-- SortedSet<T>
    |
    +-- IReadOnlyCollection<T>
            |
            +-- IReadOnlyList<T>
            |
            +-- IReadOnlyDictionary<TKey, TValue>

IDictionary<TKey, TValue>
    |
    +-- Dictionary<TKey, TValue>
    +-- SortedDictionary<TKey, TValue>
    +-- ConcurrentDictionary<TKey, TValue>
```

### Choosing the Right Interface

```csharp
// Use the most restrictive interface possible

// Only need enumeration
public void ProcessItems(IEnumerable<Item> items)
{
    foreach (var item in items)
    {
        // Process item
    }
}

// Need count and contains
public void ProcessCollection(ICollection<Item> items)
{
    Console.WriteLine($"Processing {items.Count} items");
    if (items.Contains(specificItem))
    {
        // ...
    }
}

// Need index access
public void ProcessList(IList<Item> items)
{
    for (int i = 0; i < items.Count; i++)
    {
        ProcessItem(items[i]);
    }
}

// Return read-only to prevent modification
public IReadOnlyList<Item> GetItems()
{
    return itemsList;
}
```

## Performance Best Practices

### Collection Initialization

```csharp
// Pre-allocate when size is known
var list = new List<int>(1000);
var dict = new Dictionary<string, int>(1000);
var set = new HashSet<int>(1000);

// Use collection expressions (C# 12)
int[] array = [1, 2, 3, 4, 5];
List<int> list2 = [1, 2, 3, 4, 5];
Dictionary<string, int> dict2 = new() { ["a"] = 1, ["b"] = 2 };
```

### Avoiding Common Pitfalls

```csharp
// BAD: Multiple enumeration
public void Process(IEnumerable<int> numbers)
{
    Console.WriteLine($"Count: {numbers.Count()}"); // Enumerates
    Console.WriteLine($"Sum: {numbers.Sum()}");     // Enumerates again
}

// GOOD: Materialize once
public void Process(IEnumerable<int> numbers)
{
    var list = numbers.ToList();
    Console.WriteLine($"Count: {list.Count}");
    Console.WriteLine($"Sum: {list.Sum()}");
}

// BAD: Using List when HashSet is better for lookups
var list = new List<int> { 1, 2, 3, 4, 5 };
bool contains = list.Contains(3); // O(n)

// GOOD: Use HashSet for frequent Contains checks
var set = new HashSet<int> { 1, 2, 3, 4, 5 };
bool containsSet = set.Contains(3); // O(1)

// BAD: Modifying collection while iterating
foreach (var item in list)
{
    if (ShouldRemove(item))
    {
        list.Remove(item); // InvalidOperationException!
    }
}

// GOOD: Use RemoveAll or iterate backwards
list.RemoveAll(item => ShouldRemove(item));

// Or iterate backwards with for loop
for (int i = list.Count - 1; i >= 0; i--)
{
    if (ShouldRemove(list[i]))
    {
        list.RemoveAt(i);
    }
}
```

### Benchmarking Example

```csharp
// Time complexity comparison for 100,000 operations:

// List<T>.Contains: ~5ms (O(n))
// HashSet<T>.Contains: ~0.01ms (O(1))

// Dictionary lookup: ~0.01ms (O(1))
// SortedDictionary lookup: ~0.1ms (O(log n))

// List<T>.Add: ~1ms (O(1) amortized)
// List<T>.Insert(0, item): ~50ms (O(n))
// LinkedList<T>.AddFirst: ~2ms (O(1))
```

## Summary

The C# Collections Framework provides a rich set of data structures for every scenario:

- **List<T>**: General-purpose dynamic array with O(1) index access
- **Dictionary<TKey, TValue>**: Fast key-value lookup with O(1) operations
- **HashSet<T>**: Unique elements with O(1) membership testing and set operations
- **Queue<T>/Stack<T>**: FIFO and LIFO collections for ordered processing
- **LinkedList<T>**: O(1) insertion/removal at any position
- **Sorted collections**: Automatically maintain sorted order
- **Concurrent collections**: Thread-safe for parallel programming
- **Immutable collections**: Safe sharing without defensive copying
- **Observable collections**: UI data binding with change notifications

Choose the right collection based on:
1. **Access patterns**: Random access vs. sequential iteration
2. **Operation frequency**: Lookups vs. insertions vs. deletions
3. **Thread safety requirements**: Single-threaded vs. concurrent access
4. **Memory constraints**: Compact storage vs. fast operations
5. **Ordering requirements**: Unordered vs. sorted vs. insertion order

By understanding the characteristics and trade-offs of each collection type, you can write more efficient and maintainable C# code.
