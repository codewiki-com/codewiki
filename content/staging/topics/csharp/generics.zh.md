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
origin: old/src/content/docs/csharp/generics.zh.md
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

泛型是 C# 中最强大的特性之一，它允许我们编写类型安全且可重用的代码。通过泛型，我们可以创建能够处理任意类型的类、方法和接口，同时保持编译时的类型检查。

## 为什么需要泛型

在没有泛型之前，如果我们想要创建一个通用的集合类，通常有两种选择：

```csharp
// 方式一：使用 object 类型（存在装箱/拆箱开销和类型安全问题）
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

// 使用时需要强制转换，且没有类型安全
ObjectList list = new ObjectList();
list.Add(42);           // 装箱
list.Add("hello");      // 可以添加任意类型，潜在的类型错误
int value = (int)list.Get(0);  // 需要拆箱和类型转换

// 方式二：为每种类型创建专门的类（代码重复）
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

泛型解决了这些问题：

```csharp
// 使用泛型：类型安全、无装箱开销、代码复用
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

// 使用时类型安全
GenericList<int> intList = new GenericList<int>();
intList.Add(42);           // 无装箱
// intList.Add("hello");   // 编译错误！类型安全
int value = intList.Get(0); // 无需类型转换
```

## 泛型类型

### 泛型类

泛型类使用类型参数来定义可以处理任意类型的类：

```csharp
// 简单的泛型类
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

// 使用
Box<string> stringBox = new Box<string>();
stringBox.Put("Hello, Generics!");
string message = stringBox.Take();

Box<int> intBox = new Box<int>();
intBox.Put(100);
int number = intBox.Take();
```

### 多类型参数

泛型类可以有多个类型参数：

```csharp
// 键值对类
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

// 三元组
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

// 使用
var pair = new Pair<string, int>("Age", 25);
Console.WriteLine(pair); // [Age: 25]

var triple = new Triple<string, int, bool>("Test", 42, true);
var (name, value, flag) = triple; // 解构
```

### 泛型接口

泛型接口定义了类型安全的契约：

```csharp
// 泛型仓储接口
public interface IRepository<T> where T : class
{
    T GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T entity);
    void Update(T entity);
    void Delete(T entity);
}

// 实体基类
public abstract class Entity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
}

// 具体实体
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

// 泛型仓储实现
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

// 使用
var userRepo = new Repository<User>();
userRepo.Add(new User { Name = "张三", Email = "zhangsan@example.com" });

var productRepo = new Repository<Product>();
productRepo.Add(new Product { Title = "笔记本电脑", Price = 5999.99m });
```

### 泛型结构体

结构体也可以是泛型的：

```csharp
// 可空值的简化实现（类似于 Nullable<T>）
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

// 使用
Optional<int> maybeNumber = 42;
Console.WriteLine(maybeNumber.HasValue); // True
Console.WriteLine(maybeNumber.Value);    // 42

Optional<string> noString = default;
Console.WriteLine(noString.HasValue);           // False
Console.WriteLine(noString.GetValueOrDefault("默认值")); // 默认值
```

## 泛型方法

泛型方法允许在方法级别定义类型参数：

```csharp
public class GenericMethods
{
    // 交换两个值
    public static void Swap<T>(ref T a, ref T b)
    {
        T temp = a;
        a = b;
        b = temp;
    }

    // 查找数组中的元素
    public static int FindIndex<T>(T[] array, T target) where T : IEquatable<T>
    {
        for (int i = 0; i < array.Length; i++)
        {
            if (array[i].Equals(target))
                return i;
        }
        return -1;
    }

    // 创建数组的副本
    public static T[] Copy<T>(T[] source)
    {
        T[] result = new T[source.Length];
        Array.Copy(source, result, source.Length);
        return result;
    }

    // 将值转换为指定类型（带默认值）
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

// 使用
int x = 1, y = 2;
GenericMethods.Swap(ref x, ref y);
Console.WriteLine($"x={x}, y={y}"); // x=2, y=1

string[] names = { "Alice", "Bob", "Charlie" };
int index = GenericMethods.FindIndex(names, "Bob"); // 1

// 类型推断：编译器自动推断类型参数
var copy = GenericMethods.Copy(names); // 无需指定 <string>

int result = GenericMethods.ConvertOrDefault(
    "42",
    s => int.Parse(s),
    0
); // 42
```

### 扩展方法与泛型

泛型与扩展方法结合使用非常强大：

```csharp
public static class GenericExtensions
{
    // 链式转换
    public static TResult Transform<TSource, TResult>(
        this TSource source,
        Func<TSource, TResult> transformer)
    {
        return transformer(source);
    }

    // 条件执行
    public static T When<T>(this T obj, bool condition, Func<T, T> action)
    {
        return condition ? action(obj) : obj;
    }

    // 安全转换
    public static TResult As<TResult>(this object obj) where TResult : class
    {
        return obj as TResult;
    }

    // 检查是否在集合中
    public static bool IsIn<T>(this T item, params T[] collection)
    {
        return collection.Contains(item);
    }

    // 管道操作
    public static T Pipe<T>(this T obj, Action<T> action)
    {
        action(obj);
        return obj;
    }
}

// 使用
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

## 泛型约束

泛型约束限制类型参数必须满足的条件，使我们能够访问特定的成员或行为。

### 约束类型一览

```csharp
// 1. 引用类型约束
public class ReferenceOnly<T> where T : class
{
    public T Value { get; set; }

    public bool IsNull() => Value == null; // 可以与 null 比较
}

// 2. 值类型约束
public class ValueOnly<T> where T : struct
{
    public T Value { get; set; }

    // T 永远不会是 null
    public Nullable<T> ToNullable() => Value;
}

// 3. 无参构造函数约束
public class Factory<T> where T : new()
{
    public T Create() => new T(); // 可以使用 new T()

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

// 4. 基类约束
public class AnimalShelter<T> where T : Animal
{
    private List<T> animals = new List<T>();

    public void AddAnimal(T animal)
    {
        animal.Feed(); // 可以访问 Animal 的成员
        animals.Add(animal);
    }
}

public class Animal
{
    public virtual void Feed() { }
}

// 5. 接口约束
public class Sorter<T> where T : IComparable<T>
{
    public void Sort(T[] array)
    {
        Array.Sort(array); // T 实现了 IComparable<T>
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

// 6. 类型参数约束（裸类型约束）
public class Container<T, TChild> where TChild : T
{
    public T Parent { get; set; }
    public TChild Child { get; set; }
}

// 7. notnull 约束 (C# 8.0+)
public class NonNullable<T> where T : notnull
{
    public T Value { get; }

    public NonNullable(T value)
    {
        Value = value ?? throw new ArgumentNullException(nameof(value));
    }
}

// 8. unmanaged 约束 (C# 7.3+)
public unsafe class PointerWrapper<T> where T : unmanaged
{
    public T* Pointer { get; private set; }

    public void Allocate()
    {
        Pointer = (T*)System.Runtime.InteropServices.Marshal.AllocHGlobal(sizeof(T));
    }
}
```

### 多重约束

可以对同一类型参数应用多个约束：

```csharp
// 多重约束示例
public class MultiConstraint<T>
    where T : class, IComparable<T>, ICloneable, new()
{
    public T CreateAndCompare(T other)
    {
        T instance = new T();                    // new() 约束

        if (instance.CompareTo(other) > 0)       // IComparable<T> 约束
        {
            return (T)instance.Clone();          // ICloneable 约束
        }

        return null;                             // class 约束允许返回 null
    }
}

// 多个类型参数各自的约束
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

### 约束的实际应用

```csharp
// 通用比较器工厂
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

// 通用对象池
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

// 使用
var pool = new ObjectPool<StringBuilder>();
var sb = pool.Rent();
sb.Append("Hello");
pool.Return(sb);

// 规格模式实现
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

## 协变与逆变

协变和逆变描述了泛型类型参数在类型转换中的行为。

### 协变 (Covariance) - out 关键字

协变允许将派生类型的泛型赋值给基类型的泛型，适用于"输出"位置：

```csharp
// IEnumerable<T> 是协变的
IEnumerable<string> strings = new List<string> { "a", "b", "c" };
IEnumerable<object> objects = strings;  // 协变：string -> object

// 自定义协变接口
public interface IProducer<out T>  // out 表示协变
{
    T Produce();                   // T 只能用于返回值（输出位置）
    // void Consume(T item);       // 错误！协变类型不能用于输入位置
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

// 使用协变
IProducer<Dog> dogProducer = new DogProducer();
IProducer<Animal> animalProducer = dogProducer;  // 协变转换
Animal animal = animalProducer.Produce();         // 返回的实际上是 Dog
```

### 逆变 (Contravariance) - in 关键字

逆变允许将基类型的泛型赋值给派生类型的泛型，适用于"输入"位置：

```csharp
// Action<T> 是逆变的
Action<object> objectAction = obj => Console.WriteLine(obj);
Action<string> stringAction = objectAction;  // 逆变：object -> string
stringAction("Hello");  // 可以工作，因为 string 是 object

// 自定义逆变接口
public interface IConsumer<in T>  // in 表示逆变
{
    void Consume(T item);         // T 只能用于参数（输入位置）
    // T Produce();               // 错误！逆变类型不能用于输出位置
}

public class AnimalConsumer : IConsumer<Animal>
{
    public void Consume(Animal animal)
    {
        Console.WriteLine($"Consuming {animal.GetType().Name}");
    }
}

// 使用逆变
IConsumer<Animal> animalConsumer = new AnimalConsumer();
IConsumer<Dog> dogConsumer = animalConsumer;  // 逆变转换
dogConsumer.Consume(new Dog());               // 可以接受 Dog
```

### 同时使用协变和逆变

```csharp
// Func<T, TResult> 既有逆变也有协变
// 定义：public delegate TResult Func<in T, out TResult>(T arg);

Func<object, string> objectToString = obj => obj.ToString();
Func<string, object> stringToObject = objectToString;  // 参数逆变，返回值协变

// 自定义示例：转换器接口
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

// 复杂的变体示例
IConverter<object, int> objToInt = new StringToIntConverter();  // 错误！string 不是 object 的基类
IConverter<string, double> strToDouble = new ObjectToNumberConverter();  // 正确！object 是 string 的基类
```

### 变体的实际应用

```csharp
// 事件处理器模式
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

// 通用事件记录器
public class EventLogger : IEventHandler<IEvent>
{
    public void Handle(IEvent @event)
    {
        Console.WriteLine($"Event occurred at: {@event.OccurredAt}");
    }
}

// 使用逆变
IEventHandler<IEvent> logger = new EventLogger();
IEventHandler<UserCreatedEvent> userEventHandler = logger;  // 逆变
IEventHandler<OrderCreatedEvent> orderEventHandler = logger; // 逆变

userEventHandler.Handle(new UserCreatedEvent
{
    OccurredAt = DateTime.Now,
    UserName = "张三"
});
```

## 默认值

`default` 关键字返回类型的默认值：

```csharp
public class DefaultValueExamples<T>
{
    // 获取类型的默认值
    public T GetDefault()
    {
        return default(T);  // 或简写为 default
    }

    // 带默认值的方法
    public T GetValueOrDefault(T value)
    {
        // 对于引用类型，default 是 null
        // 对于值类型，default 是零值
        if (EqualityComparer<T>.Default.Equals(value, default))
        {
            return CreateDefaultValue();
        }
        return value;
    }

    private T CreateDefaultValue()
    {
        // 如果 T 有无参构造函数约束，可以使用 new T()
        return default;
    }
}

// default 值示例
Console.WriteLine(default(int));        // 0
Console.WriteLine(default(bool));       // False
Console.WriteLine(default(double));     // 0
Console.WriteLine(default(string));     // null (空引用)
Console.WriteLine(default(DateTime));   // 01/01/0001 00:00:00
Console.WriteLine(default(int?));       // null

// 使用 default 表达式 (C# 7.1+)
int number = default;           // 0
string text = default;          // null
List<int> list = default;       // null
```

### 判断是否为默认值

```csharp
public static class DefaultChecker
{
    public static bool IsDefault<T>(T value)
    {
        // 处理 null 情况
        if (value == null)
            return true;

        // 使用 EqualityComparer 进行比较
        return EqualityComparer<T>.Default.Equals(value, default);
    }

    public static bool IsNullOrDefault<T>(T value)
    {
        if (value == null)
            return true;

        // 对于值类型，检查是否等于默认值
        if (typeof(T).IsValueType)
        {
            return EqualityComparer<T>.Default.Equals(value, default);
        }

        return false;
    }
}

// 使用
Console.WriteLine(DefaultChecker.IsDefault(0));        // True
Console.WriteLine(DefaultChecker.IsDefault(1));        // False
Console.WriteLine(DefaultChecker.IsDefault<string>(null));  // True
Console.WriteLine(DefaultChecker.IsDefault(""));       // False
```

## 泛型集合

.NET 提供了丰富的泛型集合类：

### List<T> - 动态数组

```csharp
// 基本操作
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
names.Add("David");
names.Insert(0, "Anna");
names.Remove("Bob");
names.RemoveAt(0);

// 查询
string first = names.First();
string last = names.Last();
bool hasCharlie = names.Contains("Charlie");
int index = names.IndexOf("Charlie");

// 批量操作
names.AddRange(new[] { "Eve", "Frank" });
names.Sort();
names.Reverse();

// 转换
string[] array = names.ToArray();
List<int> lengths = names.Select(n => n.Length).ToList();

// 遍历
names.ForEach(name => Console.WriteLine(name));
```

### Dictionary<TKey, TValue> - 字典

```csharp
// 创建和初始化
Dictionary<string, int> ages = new Dictionary<string, int>
{
    ["Alice"] = 25,
    ["Bob"] = 30,
    ["Charlie"] = 35
};

// 添加和更新
ages.Add("David", 28);
ages["Alice"] = 26;  // 更新

// 安全获取
if (ages.TryGetValue("Bob", out int bobAge))
{
    Console.WriteLine($"Bob's age: {bobAge}");
}

// 检查键是否存在
if (ages.ContainsKey("Eve"))
{
    Console.WriteLine("Eve exists");
}

// 遍历
foreach (KeyValuePair<string, int> kvp in ages)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}

// 只遍历键或值
foreach (string name in ages.Keys)
{
    Console.WriteLine(name);
}

// 使用自定义比较器
var caseInsensitiveDict = new Dictionary<string, int>(
    StringComparer.OrdinalIgnoreCase);
```

### HashSet<T> - 集合

```csharp
// 创建
HashSet<int> numbers = new HashSet<int> { 1, 2, 3, 4, 5 };
HashSet<int> evenNumbers = new HashSet<int> { 2, 4, 6, 8 };

// 添加（自动去重）
numbers.Add(3);  // 返回 false，因为 3 已存在
numbers.Add(6);  // 返回 true

// 集合运算
numbers.UnionWith(evenNumbers);       // 并集
numbers.IntersectWith(evenNumbers);   // 交集
numbers.ExceptWith(evenNumbers);      // 差集
numbers.SymmetricExceptWith(evenNumbers);  // 对称差集

// 检查
bool isSubset = numbers.IsSubsetOf(evenNumbers);
bool isSuperset = numbers.IsSupersetOf(evenNumbers);
bool overlaps = numbers.Overlaps(evenNumbers);

// 使用自定义比较器
HashSet<string> names = new HashSet<string>(
    StringComparer.OrdinalIgnoreCase);
```

### Queue<T> 和 Stack<T>

```csharp
// 队列 - 先进先出 (FIFO)
Queue<string> queue = new Queue<string>();
queue.Enqueue("First");
queue.Enqueue("Second");
queue.Enqueue("Third");

string first = queue.Dequeue();  // "First"
string peek = queue.Peek();      // "Second"（不移除）

// 栈 - 后进先出 (LIFO)
Stack<int> stack = new Stack<int>();
stack.Push(1);
stack.Push(2);
stack.Push(3);

int top = stack.Pop();   // 3
int peekTop = stack.Peek();  // 2（不移除）

// 检查
bool hasItems = queue.Count > 0;
bool contains = stack.Contains(1);
```

### LinkedList<T> - 链表

```csharp
LinkedList<string> linkedList = new LinkedList<string>();

// 添加节点
LinkedListNode<string> firstNode = linkedList.AddFirst("First");
LinkedListNode<string> lastNode = linkedList.AddLast("Last");
linkedList.AddAfter(firstNode, "Second");
linkedList.AddBefore(lastNode, "Third");

// 遍历
LinkedListNode<string> current = linkedList.First;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Next;
}

// 反向遍历
current = linkedList.Last;
while (current != null)
{
    Console.WriteLine(current.Value);
    current = current.Previous;
}

// 删除
linkedList.Remove("Second");
linkedList.RemoveFirst();
linkedList.RemoveLast();
```

### SortedDictionary 和 SortedSet

```csharp
// 自动排序的字典
SortedDictionary<string, int> sortedDict = new SortedDictionary<string, int>
{
    ["Charlie"] = 3,
    ["Alice"] = 1,
    ["Bob"] = 2
};

// 遍历时按键排序
foreach (var kvp in sortedDict)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
    // 输出：Alice: 1, Bob: 2, Charlie: 3
}

// 自动排序的集合
SortedSet<int> sortedSet = new SortedSet<int> { 5, 2, 8, 1, 9 };
foreach (int num in sortedSet)
{
    Console.WriteLine(num);  // 1, 2, 5, 8, 9
}

// 范围查询
IEnumerable<int> range = sortedSet.GetViewBetween(2, 8);  // 2, 5, 8
```

## 高级泛型模式

### 泛型单例模式

```csharp
public class Singleton<T> where T : class, new()
{
    private static readonly Lazy<T> _instance =
        new Lazy<T>(() => new T(), LazyThreadSafetyMode.ExecutionAndPublication);

    public static T Instance => _instance.Value;

    // 防止直接实例化
    protected Singleton() { }
}

// 使用
public class Logger : Singleton<Logger>
{
    public void Log(string message)
    {
        Console.WriteLine($"[{DateTime.Now}] {message}");
    }
}

Logger.Instance.Log("Hello!");
```

### 泛型工厂模式

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

// 依赖注入容器简化版
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

### 泛型表达式构建器

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

// 使用
var query = new QueryBuilder<User>()
    .Where(u => u.Age > 18)
    .Where(u => u.IsActive)
    .OrderBy(u => u.Name)
    .Skip(10)
    .Take(20);

var results = query.Execute(users);
```

### 泛型缓存模式

```csharp
public static class TypeCache<T>
{
    // 静态泛型类的每个类型参数组合都有独立的静态字段
    public static readonly Type Type = typeof(T);
    public static readonly string TypeName = typeof(T).Name;
    public static readonly bool IsValueType = typeof(T).IsValueType;
    public static readonly bool IsReferenceType = !typeof(T).IsValueType;

    // 可以存储类型特定的委托或表达式
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

// 使用 - 每种类型只计算一次
Console.WriteLine(TypeCache<int>.TypeName);      // Int32
Console.WriteLine(TypeCache<string>.TypeName);   // String
Console.WriteLine(TypeCache<int>.IsValueType);   // True
Console.WriteLine(TypeCache<string>.IsReferenceType); // True
```

## 泛型与反射

```csharp
public class GenericReflection
{
    // 检查类型是否是泛型
    public static void InspectGenericType<T>()
    {
        Type type = typeof(T);

        Console.WriteLine($"类型: {type.Name}");
        Console.WriteLine($"是否泛型: {type.IsGenericType}");
        Console.WriteLine($"是否泛型定义: {type.IsGenericTypeDefinition}");
        Console.WriteLine($"是否构造泛型: {type.IsConstructedGenericType}");

        if (type.IsGenericType)
        {
            Console.WriteLine("类型参数:");
            foreach (Type arg in type.GetGenericArguments())
            {
                Console.WriteLine($"  - {arg.Name}");
            }
        }
    }

    // 动态创建泛型类型
    public static object CreateGenericList(Type elementType)
    {
        Type listType = typeof(List<>);
        Type constructedType = listType.MakeGenericType(elementType);
        return Activator.CreateInstance(constructedType);
    }

    // 调用泛型方法
    public static void InvokeGenericMethod<T>(T value)
    {
        MethodInfo method = typeof(Console).GetMethod("WriteLine", new[] { typeof(T) });
        method?.Invoke(null, new object[] { value });
    }
}

// 使用
GenericReflection.InspectGenericType<Dictionary<string, int>>();
// 输出:
// 类型: Dictionary`2
// 是否泛型: True
// 是否泛型定义: False
// 是否构造泛型: True
// 类型参数:
//   - String
//   - Int32

var list = GenericReflection.CreateGenericList(typeof(string));
// list 是 List<string> 类型
```

## 最佳实践

### 命名约定

```csharp
// 使用描述性的类型参数名称
public interface IRepository<TEntity> { }                    // 好
public interface IKeyValueStore<TKey, TValue> { }           // 好
public interface IConverter<TSource, TDestination> { }       // 好

// 避免单字母（除非上下文非常清楚）
public interface IRepository<T> { }                          // 可接受但不够描述性
public interface IConverter<T, U> { }                        // 不推荐
```

### 合理使用约束

```csharp
// 只添加必要的约束
public class Good<T> where T : IComparable<T>
{
    public bool IsGreater(T a, T b) => a.CompareTo(b) > 0;
}

// 避免过度约束
public class OverConstrained<T>
    where T : class, IComparable<T>, IEquatable<T>, ICloneable, new()
{
    // 如果不需要所有这些约束，就不要添加
}
```

### 优先使用泛型集合

```csharp
// 推荐
List<string> names = new List<string>();
Dictionary<int, User> users = new Dictionary<int, User>();

// 不推荐
ArrayList names = new ArrayList();  // 非泛型，类型不安全
Hashtable users = new Hashtable();  // 非泛型
```

### 注意泛型和值类型

```csharp
public class ValueTypeAware<T>
{
    public bool IsEmpty(T value)
    {
        // 对于值类型，不能直接与 null 比较
        // 使用 EqualityComparer<T>.Default
        return EqualityComparer<T>.Default.Equals(value, default);
    }
}
```

### 利用类型推断

```csharp
// 好 - 让编译器推断类型
var result = Process(42);
var list = new List<string> { "a", "b", "c" };

// 避免冗余的类型参数
var result = Process<int>(42);  // 通常不必要
```

## 总结

泛型是 C# 中不可或缺的特性，它提供了：

- **类型安全**：编译时类型检查，避免运行时类型错误
- **代码复用**：一次编写，多种类型使用
- **性能优化**：避免装箱/拆箱开销
- **清晰的 API 设计**：通过约束明确表达类型要求

掌握泛型的关键在于理解：
1. 泛型类型和方法的定义与使用
2. 约束的作用和正确应用
3. 协变与逆变的概念和使用场景
4. 常用泛型集合的特点和选择
5. 高级泛型模式的应用

通过合理使用泛型，你可以编写出更加健壮、灵活和高效的 C# 代码。
