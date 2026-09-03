---
title: 泛型
description: C#泛型完全指南，泛型类型、约束、协变与逆变
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - 泛型
  - 协变
  - 逆变
status: imported
origin: old/src/content/docs/csharp/generics.en.md
divergence: 0.211
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 类型系统
  order: 6
  lastUpdated: 2026-01-07
---

Generics is one of the most powerful features in C#, allowing us to write type-safe and reusable code. Through generics, we can create classes, methods, and interfaces that can handle any type while maintaining compile-time type checking.

## Why Do We Need Generics

Before generics, if we wanted to create a universal collection class, we typically had two choices:

```csharp
// Approach 1: Using object type (has boxing/unboxing overhead and type safety issues)
public class ObjectList
{
    private object[] items = new object[10];
    private int count = 0;

    public void Add(object item)
    {
        items[count++] = item;
    }

    public object Get(int index)
    {
        return items[index];
    }
}

// Usage requires type casting and lacks type safety
ObjectList list = new ObjectList();
list.Add(42);           // Boxing
list.Add("hello");      // Can add any type, potential type errors
int value = (int)list.Get(0);  // Requires unboxing and type conversion

// Approach 2: Creating specialized classes for each type (code duplication)
public class IntList
{
    private int[] items = new int[10];
    // ...
}

public class StringList
{
    private string[] items = new string[10];
    // ...
}
```

Generics solves these problems:

```csharp
// Using generics: type-safe, no boxing overhead, code reuse
public class GenericList<T>
{
    private T[] items = new T[10];
    private int count = 0;

    public void Add(T item)
    {
        items[count++] = item;
    }

    public T Get(int index)
    {
        return items[index];
    }
}

// Type-safe usage
GenericList<int> intList = new GenericList<int>();
intList.Add(42);           // No boxing
// intList.Add("hello");   // Compile error! Type-safe
int value = intList.Get(0); // No type conversion needed
```

## Generic Types

### Generic Classes

Generic classes use type parameters to define classes that can handle any type:

```csharp
// Simple generic class
public class Box<T>
{
    private T content;

    public void Put(T item)
    {
        content = item;
    }

    public T Take()
    {
        return content;
    }

    public bool IsEmpty => content == null || content.Equals(default(T));
}

// Usage
Box<string> stringBox = new Box<string>();
stringBox.Put("Hello, Generics!");
string message = stringBox.Take();

Box<int> intBox = new Box<int>();
intBox.Put(100);
int number = intBox.Take();
```

### Multiple Type Parameters

Generic classes can have multiple type parameters:

```csharp
// Key-value pair class
public class Pair<TKey, TValue>
{
    public TKey Key { get; set; }
    public TValue Value { get; set; }

    public Pair(TKey key, TValue value)
    {
        Key = key;
        Value = value;
    }

    public override string ToString()
    {
        return $"[{Key}: {Value}]";
    }
}

// Triple
public class Triple<T1, T2, T3>
{
    public T1 First { get; set; }
    public T2 Second { get; set; }
    public T3 Third { get; set; }

    public Triple(T1 first, T2 second, T3 third)
    {
        First = first;
        Second = second;
        Third = third;
    }

    public void Deconstruct(out T1 first, out T2 second, out T3 third)
    {
        first = First;
        second = Second;
        third = Third;
    }
}

// Usage
var pair = new Pair<string, int>("Age", 25);
Console.WriteLine(pair); // [Age: 25]

var triple = new Triple<string, int, bool>("Test", 42, true);
var (name, value, flag) = triple; // Deconstruction
```

### Generic Interfaces

Generic interfaces define type-safe contracts:

```csharp
// Generic repository interface
public interface IRepository<T> where T : class
{
    T GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T entity);
    void Update(T entity);
    void Delete(T entity);
}

// Base entity class
public abstract class Entity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Concrete entities
public class User : Entity
{
    public string Name { get; set; }
    public string Email { get; set; }
}

public class Product : Entity
{
    public string Title { get; set; }
    public decimal Price { get; set; }
}

// Generic repository implementation
public class Repository<T> : IRepository<T> where T : Entity
{
    private readonly List<T> _items = new List<T>();
    private int _nextId = 1;

    public T GetById(int id)
    {
        return _items.FirstOrDefault(x => x.Id == id);
    }

    public IEnumerable<T> GetAll()
    {
        return _items.AsReadOnly();
    }

    public void Add(T entity)
    {
        entity.Id = _nextId++;
        entity.CreatedAt = DateTime.Now;
        _items.Add(entity);
    }

    public void Update(T entity)
    {
        var index = _items.FindIndex(x => x.Id == entity.Id);
        if (index >= 0)
        {
            _items[index] = entity;
        }
    }

    public void Delete(T entity)
    {
        _items.RemoveAll(x => x.Id == entity.Id);
    }
}

// Usage
var userRepo = new Repository<User>();
userRepo.Add(new User { Name = "John", Email = "john@example.com" });

var productRepo = new Repository<Product>();
productRepo.Add(new Product { Title = "Laptop", Price = 5999.99m });
```

### Generic Structs

Structs can also be generic:

```csharp
// Simplified implementation of nullable values (similar to Nullable<T>)
public struct Optional<T>
{
    private readonly T _value;
    private readonly bool _hasValue;

    public bool HasValue => _hasValue;

    public T Value
    {
        get
        {
            if (!_hasValue)
                throw new InvalidOperationException("Optional has no value");
            return _value;
        }
    }

    public Optional(T value)
    {
        _value = value;
        _hasValue = true;
    }

    public T GetValueOrDefault() => _hasValue ? _value : default;
    public T GetValueOrDefault(T defaultValue) => _hasValue ? _value : defaultValue;

    public static implicit operator Optional<T>(T value) => new Optional<T>(value);

    public override string ToString()
    {
        return _hasValue ? _value.ToString() : "None";
    }
}

// Usage
Optional<int> maybeNumber = 42;
Console.WriteLine(maybeNumber.HasValue); // True
Console.WriteLine(maybeNumber.Value);    // 42

Optional<string> noString = default;
Console.WriteLine(noString.HasValue);           // False
Console.WriteLine(noString.GetValueOrDefault("Default Value")); // Default Value
```

## Generic Methods

Generic methods allow defining type parameters at the method level:

```csharp
public class GenericMethods
{
    // Swap two values
    public static void Swap<T>(ref T a, ref T b)
    {
        T temp = a;
        a = b;
        b = temp;
    }

    // Find element in array
    public static int FindIndex<T>(T[] array, T target) where T : IEquatable<T>
    {
        for (int i = 0; i < array.Length; i++)
        {
            if (array[i].Equals(target))
                return i;
        }
        return -1;
    }

    // Create a copy of an array
    public static T[] Copy<T>(T[] source)
    {
        T[] result = new T[source.Length];
        Array.Copy(source, result, source.Length);
        return result;
    }

    // Convert value to specified type (with default value)
    public static TOutput ConvertOrDefault<TInput, TOutput>(
        TInput input,
        Func<TInput, TOutput> converter,
        TOutput defaultValue = default)
    {
        try
        {
            return converter(input);
        }
        catch
        {
            return defaultValue;
        }
    }
}

// Usage
int x = 1, y = 2;
GenericMethods.Swap(ref x, ref y);
Console.WriteLine($"x={x}, y={y}"); // x=2, y=1

string[] names = { "Alice", "Bob", "Charlie" };
int index = GenericMethods.FindIndex(names, "Bob"); // 1

// Type inference: compiler automatically infers type parameters
var copy = GenericMethods.Copy(names); // No need to specify <string>

int result = GenericMethods.ConvertOrDefault(
    "42",
    s => int.Parse(s),
    0
); // 42
```

### Extension Methods and Generics

Combining generics with extension methods is very powerful:

```csharp
public static class GenericExtensions
{
    // Chained transformation
    public static TResult Transform<TSource, TResult>(
        this TSource source,
        Func<TSource, TResult> transformer)
    {
        return transformer(source);
    }

    // Conditional execution
    public static T When<T>(this T obj, bool condition, Func<T, T> action)
    {
        return condition ? action(obj) : obj;
    }

    // Safe cast
    public static TResult As<TResult>(this object obj) where TResult : class
    {
        return obj as TResult;
    }

    // Check if in collection
    public static bool IsIn<T>(this T item, params T[] collection)
    {
        return collection.Contains(item);
    }

    // Pipe operation
    public static T Pipe<T>(this T obj, Action<T> action)
    {
        action(obj);
        return obj;
    }
}

// Usage
string result = 42
    .Transform(x => x * 2)          // 84
    .Transform(x => x.ToString())   // "84"
    .Transform(x => $"Result: {x}"); // "Result: 84"

var list = new List<int> { 1, 2, 3 }
    .When(true, l => { l.Add(4); return l; })
    .Pipe(l => Console.WriteLine($"Count: {l.Count}"));

bool isWeekend = DateTime.Now.DayOfWeek.IsIn(
    DayOfWeek.Saturday,
    DayOfWeek.Sunday
);
```

## Generic Constraints

Generic constraints limit the conditions that type parameters must satisfy, allowing us to access specific members or behaviors.

### Overview of Constraint Types

```csharp
// 1. Reference type constraint
public class ReferenceOnly<T> where T : class
{
    public T Value { get; set; }

    public bool IsNull() => Value == null; // Can compare with null
}

// 2. Value type constraint
public class ValueOnly<T> where T : struct
{
    public T Value { get; set; }

    // T will never be null
    public Nullable<T> ToNullable() => Value;
}

// 3. Parameterless constructor constraint
public class Factory<T> where T : new()
{
    public T Create() => new T(); // Can use new T()

    public T[] CreateArray(int count)
    {
        T[] array = new T[count];
        for (int i = 0; i < count; i++)
        {
            array[i] = new T();
        }
        return array;
    }
}

// 4. Base class constraint
public class AnimalShelter<T> where T : Animal
{
    private List<T> animals = new List<T>();

    public void AddAnimal(T animal)
    {
        animal.Feed(); // Can access Animal members
        animals.Add(animal);
    }
}

public class Animal
{
    public virtual void Feed() { }
}

// 5. Interface constraint
public class Sorter<T> where T : IComparable<T>
{
    public void Sort(T[] array)
    {
        Array.Sort(array); // T implements IComparable<T>
    }

    public T FindMax(T[] array)
    {
        T max = array[0];
        for (int i = 1; i < array.Length; i++)
        {
            if (array[i].CompareTo(max) > 0)
                max = array[i];
        }
        return max;
    }
}

// 6. Type parameter constraint (naked type constraint)
public class Container<T, TChild> where TChild : T
{
    public T Parent { get; set; }
    public TChild Child { get; set; }
}

// 7. notnull constraint (C# 8.0+)
public class NonNullable<T> where T : notnull
{
    public T Value { get; }

    public NonNullable(T value)
    {
        Value = value ?? throw new ArgumentNullException(nameof(value));
    }
}

// 8. unmanaged constraint (C# 7.3+)
public unsafe class PointerWrapper<T> where T : unmanaged
{
    public T* Pointer { get; private set; }

    public void Allocate()
    {
        Pointer = (T*)System.Runtime.InteropServices.Marshal.AllocHGlobal(sizeof(T));
    }
}
```

### Multiple Constraints

Multiple constraints can be applied to the same type parameter:

```csharp
// Multiple constraints example
public class MultiConstraint<T>
    where T : class, IComparable<T>, ICloneable, new()
{
    public T CreateAndCompare(T other)
    {
        T instance = new T();                    // new() constraint

        if (instance.CompareTo(other) > 0)       // IComparable<T> constraint
        {
            return (T)instance.Clone();          // ICloneable constraint
        }

        return null;                             // class constraint allows returning null
    }
}

// Multiple type parameters with their own constraints
public class Repository<TEntity, TKey>
    where TEntity : class, IEntity<TKey>, new()
    where TKey : struct, IEquatable<TKey>
{
    private Dictionary<TKey, TEntity> _store = new();

    public TEntity GetOrCreate(TKey key)
    {
        if (_store.TryGetValue(key, out var entity))
            return entity;

        entity = new TEntity { Id = key };
        _store[key] = entity;
        return entity;
    }
}

public interface IEntity<TKey>
{
    TKey Id { get; set; }
}
```

### Practical Applications of Constraints

```csharp
// Generic comparer factory
public static class ComparerFactory
{
    public static IComparer<T> Create<T, TKey>(
        Func<T, TKey> keySelector)
        where TKey : IComparable<TKey>
    {
        return Comparer<T>.Create((x, y) =>
            keySelector(x).CompareTo(keySelector(y)));
    }
}

// Generic object pool
public class ObjectPool<T> where T : class, new()
{
    private readonly ConcurrentBag<T> _objects = new();
    private readonly Func<T> _objectGenerator;

    public ObjectPool(Func<T> objectGenerator = null)
    {
        _objectGenerator = objectGenerator ?? (() => new T());
    }

    public T Rent()
    {
        return _objects.TryTake(out T item) ? item : _objectGenerator();
    }

    public void Return(T item)
    {
        _objects.Add(item);
    }
}

// Usage
var pool = new ObjectPool<StringBuilder>();
var sb = pool.Rent();
sb.Append("Hello");
pool.Return(sb);

// Specification pattern implementation
public interface ISpecification<T>
{
    bool IsSatisfiedBy(T entity);
}

public abstract class Specification<T> : ISpecification<T>
{
    public abstract bool IsSatisfiedBy(T entity);

    public Specification<T> And(Specification<T> other)
    {
        return new AndSpecification<T>(this, other);
    }

    public Specification<T> Or(Specification<T> other)
    {
        return new OrSpecification<T>(this, other);
    }

    public Specification<T> Not()
    {
        return new NotSpecification<T>(this);
    }
}

public class AndSpecification<T> : Specification<T>
{
    private readonly Specification<T> _left;
    private readonly Specification<T> _right;

    public AndSpecification(Specification<T> left, Specification<T> right)
    {
        _left = left;
        _right = right;
    }

    public override bool IsSatisfiedBy(T entity)
    {
        return _left.IsSatisfiedBy(entity) && _right.IsSatisfiedBy(entity);
    }
}
```

## Covariance and Contravariance

Covariance and contravariance describe how generic type parameters behave during type conversions.

### Covariance - out Keyword

Covariance allows assigning a generic of a derived type to a generic of a base type, applicable to "output" positions:

```csharp
// IEnumerable<T> is covariant
IEnumerable<string> strings = new List<string> { "a", "b", "c" };
IEnumerable<object> objects = strings;  // Covariance: string -> object

// Custom covariant interface
public interface IProducer<out T>  // out indicates covariance
{
    T Produce();                   // T can only be used in return values (output position)
    // void Consume(T item);       // Error! Covariant type cannot be used in input position
}

public class AnimalProducer : IProducer<Animal>
{
    public Animal Produce() => new Animal();
}

public class DogProducer : IProducer<Dog>
{
    public Dog Produce() => new Dog();
}

public class Dog : Animal { }

// Using covariance
IProducer<Dog> dogProducer = new DogProducer();
IProducer<Animal> animalProducer = dogProducer;  // Covariant conversion
Animal animal = animalProducer.Produce();         // Actually returns a Dog
```

### Contravariance - in Keyword

Contravariance allows assigning a generic of a base type to a generic of a derived type, applicable to "input" positions:

```csharp
// Action<T> is contravariant
Action<object> objectAction = obj => Console.WriteLine(obj);
Action<string> stringAction = objectAction;  // Contravariance: object -> string
stringAction("Hello");  // Works because string is an object

// Custom contravariant interface
public interface IConsumer<in T>  // in indicates contravariance
{
    void Consume(T item);         // T can only be used in parameters (input position)
    // T Produce();               // Error! Contravariant type cannot be used in output position
}

public class AnimalConsumer : IConsumer<Animal>
{
    public void Consume(Animal animal)
    {
        Console.WriteLine($"Consuming {animal.GetType().Name}");
    }
}

// Using contravariance
IConsumer<Animal> animalConsumer = new AnimalConsumer();
IConsumer<Dog> dogConsumer = animalConsumer;  // Contravariant conversion
dogConsumer.Consume(new Dog());               // Can accept Dog
```

### Using Both Covariance and Contravariance

```csharp
// Func<T, TResult> has both contravariance and covariance
// Definition: public delegate TResult Func<in T, out TResult>(T arg);

Func<object, string> objectToString = obj => obj.ToString();
Func<string, object> stringToObject = objectToString;  // Parameter contravariant, return value covariant

// Custom example: converter interface
public interface IConverter<in TInput, out TOutput>
{
    TOutput Convert(TInput input);
}

public class StringToIntConverter : IConverter<string, int>
{
    public int Convert(string input) => int.Parse(input);
}

public class ObjectToNumberConverter : IConverter<object, double>
{
    public double Convert(object input) => System.Convert.ToDouble(input);
}

// Complex variance example
IConverter<object, int> objToInt = new StringToIntConverter();  // Error! string is not a base class of object
IConverter<string, double> strToDouble = new ObjectToNumberConverter();  // Correct! object is a base class of string
```

### Practical Applications of Variance

```csharp
// Event handler pattern
public interface IEventHandler<in TEvent> where TEvent : IEvent
{
    void Handle(TEvent @event);
}

public interface IEvent
{
    DateTime OccurredAt { get; }
}

public class UserCreatedEvent : IEvent
{
    public DateTime OccurredAt { get; set; }
    public string UserName { get; set; }
}

public class OrderCreatedEvent : IEvent
{
    public DateTime OccurredAt { get; set; }
    public int OrderId { get; set; }
}

// Generic event logger
public class EventLogger : IEventHandler<IEvent>
{
    public void Handle(IEvent @event)
    {
        Console.WriteLine($"Event occurred at: {@event.OccurredAt}");
    }
}

// Using contravariance
IEventHandler<IEvent> logger = new EventLogger();
IEventHandler<UserCreatedEvent> userEventHandler = logger;  // Contravariance
IEventHandler<OrderCreatedEvent> orderEventHandler = logger; // Contravariance

userEventHandler.Handle(new UserCreatedEvent
{
    OccurredAt = DateTime.Now,
    UserName = "John"
});
```

## Default Values

The `default` keyword returns the default value of a type:

```csharp
public class DefaultValueExamples<T>
{
    // Get the default value of a type
    public T GetDefault()
    {
        return default(T);  // Or shorthand: default
    }

    // Method with default value
    public T GetValueOrDefault(T value)
    {
        // For reference types, default is null
        // For value types, default is the zero value
        if (EqualityComparer<T>.Default.Equals(value, default))
        {
            return CreateDefaultValue();
        }
        return value;
    }

    private T CreateDefaultValue()
    {
        // If T has a parameterless constructor constraint, can use new T()
        return default;
    }
}

// Default value examples
Console.WriteLine(default(int));        // 0
Console.WriteLine(default(bool));       // False
Console.WriteLine(default(double));     // 0
Console.WriteLine(default(string));     // null (null reference)
Console.WriteLine(default(DateTime));   // 01/01/0001 00:00:00
Console.WriteLine(default(int?));       // null

// Using default expression (C# 7.1+)
int number = default;           // 0
string text = default;          // null
List<int> list = default;       // null
```

### Checking for Default Values

```csharp
public static class DefaultChecker
{
    public static bool IsDefault<T>(T value)
    {
        // Handle null case
        if (value == null)
            return true;

        // Use EqualityComparer for comparison
        return EqualityComparer<T>.Default.Equals(value, default);
    }

    public static bool IsNullOrDefault<T>(T value)
    {
        if (value == null)
            return true;

        // For value types, check if equal to default value
        if (typeof(T).IsValueType)
        {
            return EqualityComparer<T>.Default.Equals(value, default);
        }

        return false;
    }
}

// Usage
Console.WriteLine(DefaultChecker.IsDefault(0));        // True
Console.WriteLine(DefaultChecker.IsDefault(1));        // False
Console.WriteLine(DefaultChecker.IsDefault<string>(null));  // True
Console.WriteLine(DefaultChecker.IsDefault(""));       // False
```

## Generic Collections

.NET provides a rich set of generic collection classes:

### List<T> - Dynamic Array

```csharp
// Basic operations
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
names.Add("David");
names.Insert(0, "Anna");
names.Remove("Bob");
names.RemoveAt(0);

// Queries
string first = names.First();
string last = names.Last();
bool hasCharlie = names.Contains("Charlie");
int index = names.IndexOf("Charlie");

// Bulk operations
names.AddRange(new[] { "Eve", "Frank" });
names.Sort();
names.Reverse();

// Conversion
string[] array = names.ToArray();
List<int> lengths = names.Select(n => n.Length).ToList();

// Iteration
names.ForEach(name => Console.WriteLine(name));
```

### Dictionary<TKey, TValue> - Dictionary

```csharp
// Creation and initialization
Dictionary<string, int> ages = new Dictionary<string, int>
{
    ["Alice"] = 25,
    ["Bob"] = 30,
    ["Charlie"] = 35
};

// Adding and updating
ages.Add("David", 28);
ages["Alice"] = 26;  // Update

// Safe retrieval
if (ages.TryGetValue("Bob", out int bobAge))
{
    Console.WriteLine($"Bob's age: {bobAge}");
}

// Check if key exists
if (ages.ContainsKey("Eve"))
{
    Console.WriteLine("Eve exists");
}

// Iteration
foreach (KeyValuePair<string, int> kvp in ages)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}

// Iterate only keys or values
foreach (string name in ages.Keys)
{
    Console.WriteLine(name);
}

// Using custom comparer
var caseInsensitiveDict = new Dictionary<string, int>(
    StringComparer.OrdinalIgnoreCase);
```

### HashSet<T> - Set

```csharp
// Creation
HashSet<int> numbers = new HashSet<int> { 1, 2, 3, 4, 5 };
HashSet<int> evenNumbers = new HashSet<int> { 2, 4, 6, 8 };

// Adding (automatic deduplication)
numbers.Add(3);  // Returns false because 3 already exists
numbers.Add(6);  // Returns true

// Set operations
numbers.UnionWith(evenNumbers);       // Union
numbers.IntersectWith(evenNumbers);   // Intersection
numbers.ExceptWith(evenNumbers);      // Difference
numbers.SymmetricExceptWith(evenNumbers);  // Symmetric difference

// Checks
bool isSubset = numbers.IsSubsetOf(evenNumbers);
bool isSuperset = numbers.IsSupersetOf(evenNumbers);
bool overlaps = numbers.Overlaps(evenNumbers);

// Using custom comparer
HashSet<string> names = new HashSet<string>(
    StringComparer.OrdinalIgnoreCase);
```

### Queue<T> and Stack<T>

```csharp
// Queue - First In First Out (FIFO)
Queue<string> queue = new Queue<string>();
queue.Enqueue("First");
queue.Enqueue("Second");
queue.Enqueue("Third");

string first = queue.Dequeue();  // "First"
string peek = queue.Peek();      // "Second" (does not remove)

// Stack - Last In First Out (LIFO)
Stack<int> stack = new Stack<int>();
stack.Push(1);
stack.Push(2);
stack.Push(3);

int top = stack.Pop();   // 3
int peekTop = stack.Peek();  // 2 (does not remove)

// Checks
bool hasItems = queue.Count > 0;
bool contains = stack.Contains(1);
```

### LinkedList<T> - Linked List

```csharp
LinkedList<string> linkedList = new LinkedList<string>();

// Adding nodes
LinkedListNode<string> firstNode = linkedList.AddFirst("First");
LinkedListNode<string> lastNode = linkedList.AddLast("Last");
linkedList.AddAfter(firstNode, "Second");
linkedList.AddBefore(lastNode, "Third");

// Iteration
LinkedListNode<string> current = linkedList.First;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Next;
}

// Reverse iteration
current = linkedList.Last;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Previous;
}

// Deletion
linkedList.Remove("Second");
linkedList.RemoveFirst();
linkedList.RemoveLast();
```

### SortedDictionary and SortedSet

```csharp
// Auto-sorted dictionary
SortedDictionary<string, int> sortedDict = new SortedDictionary<string, int>
{
    ["Charlie"] = 3,
    ["Alice"] = 1,
    ["Bob"] = 2
};

// Sorted by key when iterating
foreach (var kvp in sortedDict)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
    // Output: Alice: 1, Bob: 2, Charlie: 3
}

// Auto-sorted set
SortedSet<int> sortedSet = new SortedSet<int> { 5, 2, 8, 1, 9 };
foreach (int num in sortedSet)
{
    Console.WriteLine(num);  // 1, 2, 5, 8, 9
}

// Range query
IEnumerable<int> range = sortedSet.GetViewBetween(2, 8);  // 2, 5, 8
```

## Advanced Generic Patterns

### Generic Singleton Pattern

```csharp
public class Singleton<T> where T : class, new()
{
    private static readonly Lazy<T> _instance =
        new Lazy<T>(() => new T(), LazyThreadSafetyMode.ExecutionAndPublication);

    public static T Instance => _instance.Value;

    // Prevent direct instantiation
    protected Singleton() { }
}

// Usage
public class Logger : Singleton<Logger>
{
    public void Log(string message)
    {
        Console.WriteLine($"[{DateTime.Now}] {message}");
    }
}

Logger.Instance.Log("Hello!");
```

### Generic Factory Pattern

```csharp
public interface IFactory<out T>
{
    T Create();
}

public interface IFactory<in TParam, out T>
{
    T Create(TParam parameter);
}

public class GenericFactory<T> : IFactory<T> where T : new()
{
    public T Create() => new T();
}

public class FuncFactory<TParam, T> : IFactory<TParam, T>
{
    private readonly Func<TParam, T> _factory;

    public FuncFactory(Func<TParam, T> factory)
    {
        _factory = factory;
    }

    public T Create(TParam parameter) => _factory(parameter);
}

// Simplified dependency injection container
public class SimpleContainer
{
    private readonly Dictionary<Type, Func<object>> _registrations = new();

    public void Register<TService, TImplementation>()
        where TImplementation : TService, new()
    {
        _registrations[typeof(TService)] = () => new TImplementation();
    }

    public void Register<TService>(Func<TService> factory)
    {
        _registrations[typeof(TService)] = () => factory();
    }

    public TService Resolve<TService>()
    {
        return (TService)_registrations[typeof(TService)]();
    }
}
```

### Generic Expression Builder

```csharp
public class QueryBuilder<T>
{
    private readonly List<Expression<Func<T, bool>>> _predicates = new();
    private Expression<Func<T, object>> _orderBy;
    private bool _orderDescending;
    private int? _skip;
    private int? _take;

    public QueryBuilder<T> Where(Expression<Func<T, bool>> predicate)
    {
        _predicates.Add(predicate);
        return this;
    }

    public QueryBuilder<T> OrderBy<TKey>(Expression<Func<T, TKey>> keySelector)
    {
        _orderBy = x => keySelector.Compile()(x);
        _orderDescending = false;
        return this;
    }

    public QueryBuilder<T> OrderByDescending<TKey>(Expression<Func<T, TKey>> keySelector)
    {
        _orderBy = x => keySelector.Compile()(x);
        _orderDescending = true;
        return this;
    }

    public QueryBuilder<T> Skip(int count)
    {
        _skip = count;
        return this;
    }

    public QueryBuilder<T> Take(int count)
    {
        _take = count;
        return this;
    }

    public IEnumerable<T> Execute(IEnumerable<T> source)
    {
        IEnumerable<T> result = source;

        foreach (var predicate in _predicates)
        {
            result = result.Where(predicate.Compile());
        }

        if (_orderBy != null)
        {
            result = _orderDescending
                ? result.OrderByDescending(_orderBy.Compile())
                : result.OrderBy(_orderBy.Compile());
        }

        if (_skip.HasValue)
            result = result.Skip(_skip.Value);

        if (_take.HasValue)
            result = result.Take(_take.Value);

        return result;
    }
}

// Usage
var query = new QueryBuilder<User>()
    .Where(u => u.Age > 18)
    .Where(u => u.IsActive)
    .OrderBy(u => u.Name)
    .Skip(10)
    .Take(20);

var results = query.Execute(users);
```

### Generic Cache Pattern

```csharp
public static class TypeCache<T>
{
    // Each type parameter combination of a static generic class has its own static fields
    public static readonly Type Type = typeof(T);
    public static readonly string TypeName = typeof(T).Name;
    public static readonly bool IsValueType = typeof(T).IsValueType;
    public static readonly bool IsReferenceType = !typeof(T).IsValueType;

    // Can store type-specific delegates or expressions
    public static readonly Func<T> DefaultFactory = CreateDefaultFactory();

    private static Func<T> CreateDefaultFactory()
    {
        if (typeof(T).IsValueType)
        {
            return () => default;
        }

        var ctor = typeof(T).GetConstructor(Type.EmptyTypes);
        if (ctor != null)
        {
            var newExpr = Expression.New(ctor);
            return Expression.Lambda<Func<T>>(newExpr).Compile();
        }

        return () => default;
    }
}

// Usage - computed only once per type
Console.WriteLine(TypeCache<int>.TypeName);      // Int32
Console.WriteLine(TypeCache<string>.TypeName);   // String
Console.WriteLine(TypeCache<int>.IsValueType);   // True
Console.WriteLine(TypeCache<string>.IsReferenceType); // True
```

## Generics and Reflection

```csharp
public class GenericReflection
{
    // Check if type is generic
    public static void InspectGenericType<T>()
    {
        Type type = typeof(T);

        Console.WriteLine($"Type: {type.Name}");
        Console.WriteLine($"Is Generic: {type.IsGenericType}");
        Console.WriteLine($"Is Generic Definition: {type.IsGenericTypeDefinition}");
        Console.WriteLine($"Is Constructed Generic: {type.IsConstructedGenericType}");

        if (type.IsGenericType)
        {
            Console.WriteLine("Type Parameters:");
            foreach (Type arg in type.GetGenericArguments())
            {
                Console.WriteLine($"  - {arg.Name}");
            }
        }
    }

    // Dynamically create generic type
    public static object CreateGenericList(Type elementType)
    {
        Type listType = typeof(List<>);
        Type constructedType = listType.MakeGenericType(elementType);
        return Activator.CreateInstance(constructedType);
    }

    // Invoke generic method
    public static void InvokeGenericMethod<T>(T value)
    {
        MethodInfo method = typeof(Console).GetMethod("WriteLine", new[] { typeof(T) });
        method?.Invoke(null, new object[] { value });
    }
}

// Usage
GenericReflection.InspectGenericType<Dictionary<string, int>>();
// Output:
// Type: Dictionary`2
// Is Generic: True
// Is Generic Definition: False
// Is Constructed Generic: True
// Type Parameters:
//   - String
//   - Int32

var list = GenericReflection.CreateGenericList(typeof(string));
// list is of type List<string>
```

## Best Practices

### Naming Conventions

```csharp
// Use descriptive type parameter names
public interface IRepository<TEntity> { }                    // Good
public interface IKeyValueStore<TKey, TValue> { }           // Good
public interface IConverter<TSource, TDestination> { }       // Good

// Avoid single letters (unless context is very clear)
public interface IRepository<T> { }                          // Acceptable but not descriptive
public interface IConverter<T, U> { }                        // Not recommended
```

### Use Constraints Appropriately

```csharp
// Add only necessary constraints
public class Good<T> where T : IComparable<T>
{
    public bool IsGreater(T a, T b) => a.CompareTo(b) > 0;
}

// Avoid over-constraining
public class OverConstrained<T>
    where T : class, IComparable<T>, IEquatable<T>, ICloneable, new()
{
    // Don't add constraints you don't need
}
```

### Prefer Generic Collections

```csharp
// Recommended
List<string> names = new List<string>();
Dictionary<int, User> users = new Dictionary<int, User>();

// Not recommended
ArrayList names = new ArrayList();  // Non-generic, not type-safe
Hashtable users = new Hashtable();  // Non-generic
```

### Be Aware of Generics and Value Types

```csharp
public class ValueTypeAware<T>
{
    public bool IsEmpty(T value)
    {
        // For value types, cannot directly compare with null
        // Use EqualityComparer<T>.Default
        return EqualityComparer<T>.Default.Equals(value, default);
    }
}
```

### Leverage Type Inference

```csharp
// Good - let the compiler infer types
var result = Process(42);
var list = new List<string> { "a", "b", "c" };

// Avoid redundant type parameters
var result = Process<int>(42);  // Usually unnecessary
```

## Summary

Generics is an indispensable feature in C#, providing:

- **Type Safety**: Compile-time type checking, avoiding runtime type errors
- **Code Reuse**: Write once, use with multiple types
- **Performance Optimization**: Avoid boxing/unboxing overhead
- **Clear API Design**: Clearly express type requirements through constraints

The keys to mastering generics are understanding:
1. Definition and usage of generic types and methods
2. The role and proper application of constraints
3. Concepts and use cases for covariance and contravariance
4. Characteristics and selection of common generic collections
5. Application of advanced generic patterns

By using generics appropriately, you can write more robust, flexible, and efficient C# code.
