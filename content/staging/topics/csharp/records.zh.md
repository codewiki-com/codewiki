---
title: 记录类型 (Record)
description: C# Record 类型完全指南，涵盖 record class、record struct、位置记录、with 表达式与值相等性
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - Record
  - 不可变性
  - 值类型
  - 数据建模
status: imported
origin: old/src/content/docs/csharp/records.zh.md
divergence: 0.256
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: CSharp
  subcategory: 语言特性
  order: 5
  lastUpdated: 2026-01-07
---

记录类型 (Record) 是 C# 9.0 引入的一种特殊引用类型，专门用于创建不可变的数据载体。它自动生成值相等性比较、解构方法、`ToString()` 等样板代码，极大简化了数据传输对象 (DTO)、领域模型等场景的开发。C# 10 进一步引入了 `record struct`，将记录类型的便利性扩展到值类型领域。

## 概念解释

### 什么是 Record

Record 是一种专注于数据存储的类型，它与普通类 (class) 或结构体 (struct) 的主要区别在于：

1. **值语义相等性**：两个 record 实例只要属性值相同就被认为相等
2. **不可变性优先**：默认生成的属性是 `init-only`，鼓励创建后不再修改
3. **简洁的语法**：支持位置参数语法，一行代码定义完整类型
4. **内置解构支持**：自动生成 `Deconstruct` 方法
5. **with 表达式**：支持基于现有实例创建修改后的副本

### 历史背景

在 Record 出现之前，创建一个简单的数据类需要大量样板代码：

```csharp
// C# 8.0 及之前的写法
public class PersonOld
{
    public string FirstName { get; }
    public string LastName { get; }
    public int Age { get; }

    public PersonOld(string firstName, string lastName, int age)
    {
        FirstName = firstName;
        LastName = lastName;
        Age = age;
    }

    public override bool Equals(object? obj)
    {
        return obj is PersonOld other &&
               FirstName == other.FirstName &&
               LastName == other.LastName &&
               Age == other.Age;
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(FirstName, LastName, Age);
    }

    public override string ToString()
    {
        return $"PersonOld {{ FirstName = {FirstName}, LastName = {LastName}, Age = {Age} }}";
    }

    public void Deconstruct(out string firstName, out string lastName, out int age)
    {
        firstName = FirstName;
        lastName = LastName;
        age = Age;
    }
}
```

使用 Record，同样的功能只需一行：

```csharp
// C# 9.0+ Record 写法
public record Person(string FirstName, string LastName, int Age);
```

### 解决什么问题

Record 主要解决以下痛点：

| 问题 | Record 解决方案 |
|------|----------------|
| 大量样板代码 | 自动生成 Equals、GetHashCode、ToString 等方法 |
| 引用相等 vs 值相等混淆 | 默认使用值相等语义 |
| 可变状态带来的 bug | 默认不可变，修改需显式创建新实例 |
| 解构繁琐 | 自动生成 Deconstruct 方法 |
| 继承数据类困难 | 支持继承，自动处理相等性比较 |

## 核心原理

### Record 的编译器魔法

当你定义一个 record 时，编译器会自动生成大量代码。以下是编译器为 `record Person(string Name, int Age)` 生成的近似代码：

```csharp
// 编译器生成的代码（简化版）
public class Person : IEquatable<Person>
{
    // 位置参数变成 init-only 属性
    public string Name { get; init; }
    public int Age { get; init; }

    // 主构造函数
    public Person(string Name, int Age)
    {
        this.Name = Name;
        this.Age = Age;
    }

    // 解构方法
    public void Deconstruct(out string Name, out int Age)
    {
        Name = this.Name;
        Age = this.Age;
    }

    // 值相等性实现
    public virtual bool Equals(Person? other)
    {
        return other is not null &&
               EqualityContract == other.EqualityContract &&
               EqualityComparer<string>.Default.Equals(Name, other.Name) &&
               EqualityComparer<int>.Default.Equals(Age, other.Age);
    }

    public override bool Equals(object? obj) => Equals(obj as Person);

    public override int GetHashCode()
    {
        return HashCode.Combine(EqualityContract, Name, Age);
    }

    // 用于继承时的类型检查
    protected virtual Type EqualityContract => typeof(Person);

    // 运算符重载
    public static bool operator ==(Person? left, Person? right)
        => EqualityComparer<Person>.Default.Equals(left, right);

    public static bool operator !=(Person? left, Person? right)
        => !(left == right);

    // ToString
    public override string ToString()
    {
        var builder = new StringBuilder();
        builder.Append("Person");
        builder.Append(" { ");
        PrintMembers(builder);
        builder.Append(" }");
        return builder.ToString();
    }

    protected virtual bool PrintMembers(StringBuilder builder)
    {
        builder.Append($"Name = {Name}, Age = {Age}");
        return true;
    }

    // 用于 with 表达式的克隆方法
    public virtual Person <Clone>$() => new Person(this);

    // 受保护的拷贝构造函数
    protected Person(Person original)
    {
        Name = original.Name;
        Age = original.Age;
    }
}
```

### EqualityContract 的作用

`EqualityContract` 是 record 实现继承安全相等性的关键。它确保不同类型的 record 即使属性值相同也不相等：

```csharp
public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

var animal = new Animal("Buddy");
var dog = new Dog("Buddy", "Labrador");

// 即使 Name 相同，类型不同也不相等
Console.WriteLine(animal == dog);  // False
Console.WriteLine(animal.Equals(dog));  // False
```

### with 表达式的工作原理

`with` 表达式通过调用隐藏的 `<Clone>$()` 方法创建副本，然后修改指定属性：

```csharp
var person1 = new Person("Alice", 30);
var person2 = person1 with { Age = 31 };

// 等价于
var person2Equivalent = new Person(person1) { Age = 31 };
```

## 核心要点

### Record Class vs Record Struct

C# 提供两种 record 类型：

| 特性 | `record` / `record class` | `record struct` |
|------|--------------------------|-----------------|
| 类型 | 引用类型 | 值类型 |
| 默认值 | `null` | 默认构造的实例 |
| 属性默认修饰符 | `init` | `init` (可改为 `set`) |
| 内存分配 | 堆 | 栈（通常） |
| 支持继承 | 是 | 否 |
| 引入版本 | C# 9.0 | C# 10 |

```csharp
// Record Class（引用类型）
public record PersonRecord(string Name, int Age);

// Record Struct（值类型）
public record struct PointRecord(double X, double Y);

// 可读写的 Record Struct
public record struct MutablePoint(double X, double Y)
{
    // 可以重新定义为可变属性
    public double X { get; set; } = X;
    public double Y { get; set; } = Y;
}
```

### 位置记录 vs 标准记录

Record 支持两种定义风格：

```csharp
// 位置记录（Positional Record）
// - 自动生成构造函数和 Deconstruct
// - 属性是 init-only
public record PositionalPerson(string Name, int Age);

// 标准记录（Standard Record）
// - 更接近传统类的定义方式
// - 可以完全控制属性的可变性
public record StandardPerson
{
    public string Name { get; init; } = "";
    public int Age { get; init; }
}

// 混合风格
// - 结合位置参数和额外属性
public record HybridPerson(string Name, int Age)
{
    public string? Email { get; init; }
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}
```

### 继承与派生

Record class 支持继承，但有特殊规则：

```csharp
// 基础 record
public record Person(string Name, int Age);

// 派生 record - 必须重复基类的位置参数
public record Student(string Name, int Age, string School) : Person(Name, Age);

// 添加额外参数
public record Employee(string Name, int Age, string Department, decimal Salary)
    : Person(Name, Age);

// 密封 record - 防止进一步继承
public sealed record Manager(string Name, int Age, string Department, int TeamSize)
    : Employee(Name, Age, Department, 0);

// 抽象 record
public abstract record Shape(string Color);
public record Circle(string Color, double Radius) : Shape(Color);
public record Rectangle(string Color, double Width, double Height) : Shape(Color);
```

### 主构造函数参数的作用域

位置参数在整个 record 体中可用：

```csharp
public record Product(string Name, decimal Price, int Quantity)
{
    // 可以在属性初始化器中使用位置参数
    public decimal TotalValue { get; } = Price * Quantity;

    // 可以在方法中使用
    public string GetSummary() => $"{Name}: {Quantity} x {Price:C} = {TotalValue:C}";

    // 可以添加验证逻辑
    public string Name { get; init; } = !string.IsNullOrEmpty(Name)
        ? Name
        : throw new ArgumentException("Name cannot be empty");
}
```

## 代码示例

### 基本 Record 定义与使用

```csharp
// 最简单的 record 定义
public record Point(double X, double Y);

// 使用示例
var p1 = new Point(3, 4);
var p2 = new Point(3, 4);
var p3 = new Point(5, 6);

// 值相等性
Console.WriteLine(p1 == p2);           // True
Console.WriteLine(p1.Equals(p2));      // True
Console.WriteLine(ReferenceEquals(p1, p2));  // False（不同实例）

// 解构
var (x, y) = p1;
Console.WriteLine($"X: {x}, Y: {y}");  // X: 3, Y: 4

// ToString
Console.WriteLine(p1);  // Point { X = 3, Y = 4 }

// with 表达式
var p4 = p1 with { X = 10 };
Console.WriteLine(p4);  // Point { X = 10, Y = 4 }
Console.WriteLine(p1);  // Point { X = 3, Y = 4 }（原实例不变）
```

### Record Struct 示例

```csharp
// 不可变的 record struct
public readonly record struct ImmutableVector(double X, double Y, double Z)
{
    public double Magnitude => Math.Sqrt(X * X + Y * Y + Z * Z);

    public ImmutableVector Normalize()
    {
        var mag = Magnitude;
        return mag > 0 ? this with { X = X / mag, Y = Y / mag, Z = Z / mag } : this;
    }

    public static ImmutableVector operator +(ImmutableVector a, ImmutableVector b)
        => new(a.X + b.X, a.Y + b.Y, a.Z + b.Z);

    public static ImmutableVector operator *(ImmutableVector v, double scalar)
        => new(v.X * scalar, v.Y * scalar, v.Z * scalar);
}

// 可变的 record struct
public record struct MutableCounter(int Value)
{
    public int Value { get; set; } = Value;

    public void Increment() => Value++;
    public void Decrement() => Value--;
}

// 使用示例
var v1 = new ImmutableVector(1, 2, 2);
var v2 = new ImmutableVector(3, 4, 0);
var sum = v1 + v2;
Console.WriteLine($"Sum: {sum}");  // Sum: ImmutableVector { X = 4, Y = 6, Z = 2 }
Console.WriteLine($"Magnitude: {sum.Magnitude:F2}");  // Magnitude: 7.48

var counter = new MutableCounter(0);
counter.Increment();
counter.Increment();
Console.WriteLine(counter.Value);  // 2
```

### 复杂业务场景示例

```csharp
// 电商订单系统示例

// 地址信息
public record Address(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country = "中国");

// 客户信息
public record Customer(
    Guid Id,
    string Name,
    string Email,
    Address ShippingAddress,
    Address? BillingAddress = null)
{
    // 账单地址默认使用收货地址
    public Address BillingAddress { get; init; } = BillingAddress ?? ShippingAddress;
}

// 订单项
public record OrderItem(
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice)
{
    public decimal TotalPrice => Quantity * UnitPrice;
}

// 订单状态
public enum OrderStatus { Pending, Confirmed, Shipped, Delivered, Cancelled }

// 订单
public record Order(
    Guid Id,
    Customer Customer,
    IReadOnlyList<OrderItem> Items,
    DateTime CreatedAt,
    OrderStatus Status = OrderStatus.Pending)
{
    public decimal Subtotal => Items.Sum(i => i.TotalPrice);
    public decimal Tax => Subtotal * 0.13m;
    public decimal Total => Subtotal + Tax;

    // 创建订单更新的便捷方法
    public Order WithStatus(OrderStatus newStatus) => this with { Status = newStatus };

    public Order AddItem(OrderItem item) => this with
    {
        Items = Items.Append(item).ToList().AsReadOnly()
    };
}

// 使用示例
var customer = new Customer(
    Guid.NewGuid(),
    "张三",
    "zhangsan@example.com",
    new Address("中关村大街1号", "北京", "北京市", "100000")
);

var items = new List<OrderItem>
{
    new(Guid.NewGuid(), "机械键盘", 1, 599.00m),
    new(Guid.NewGuid(), "鼠标垫", 2, 49.90m)
}.AsReadOnly();

var order = new Order(Guid.NewGuid(), customer, items, DateTime.UtcNow);

Console.WriteLine($"订单号: {order.Id}");
Console.WriteLine($"客户: {order.Customer.Name}");
Console.WriteLine($"小计: {order.Subtotal:C}");
Console.WriteLine($"税费: {order.Tax:C}");
Console.WriteLine($"总计: {order.Total:C}");
Console.WriteLine($"状态: {order.Status}");

// 更新订单状态
var confirmedOrder = order.WithStatus(OrderStatus.Confirmed);
Console.WriteLine($"新状态: {confirmedOrder.Status}");  // Confirmed
Console.WriteLine($"原状态: {order.Status}");           // Pending（不变）
```

### 与模式匹配结合

```csharp
public abstract record Shape;
public record Circle(double Radius) : Shape;
public record Rectangle(double Width, double Height) : Shape;
public record Triangle(double Base, double Height) : Shape;
public record Square(double Side) : Shape;

public static class ShapeCalculator
{
    public static double CalculateArea(Shape shape) => shape switch
    {
        Circle(var r) => Math.PI * r * r,
        Rectangle(var w, var h) => w * h,
        Triangle(var b, var h) => 0.5 * b * h,
        Square(var s) => s * s,
        _ => throw new ArgumentException($"未知形状: {shape.GetType().Name}")
    };

    public static double CalculatePerimeter(Shape shape) => shape switch
    {
        Circle { Radius: var r } => 2 * Math.PI * r,
        Rectangle { Width: var w, Height: var h } => 2 * (w + h),
        Triangle => throw new InvalidOperationException("需要所有边长才能计算三角形周长"),
        Square { Side: var s } => 4 * s,
        _ => throw new ArgumentException($"未知形状: {shape.GetType().Name}")
    };

    public static string Describe(Shape shape) => shape switch
    {
        Circle(0) => "点（半径为0的圆）",
        Circle(var r) when r < 1 => $"小圆（半径 {r}）",
        Circle(var r) => $"圆（半径 {r}）",
        Rectangle(var w, var h) when w == h => $"正方形（边长 {w}）",
        Rectangle(var w, var h) => $"矩形（{w} x {h}）",
        Square(var s) => $"正方形（边长 {s}）",
        Triangle(var b, var h) => $"三角形（底 {b}，高 {h}）",
        _ => "未知形状"
    };
}

// 使用示例
Shape[] shapes = [
    new Circle(5),
    new Rectangle(4, 6),
    new Square(3),
    new Triangle(4, 3)
];

foreach (var shape in shapes)
{
    Console.WriteLine($"{ShapeCalculator.Describe(shape)}: 面积 = {ShapeCalculator.CalculateArea(shape):F2}");
}
```

### 泛型 Record

```csharp
// 泛型 record
public record Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);

    public Result<TNew> Map<TNew>(Func<T, TNew> mapper) => IsSuccess
        ? Result<TNew>.Success(mapper(Value!))
        : Result<TNew>.Failure(Error!);

    public Result<TNew> Bind<TNew>(Func<T, Result<TNew>> binder) => IsSuccess
        ? binder(Value!)
        : Result<TNew>.Failure(Error!);
}

// 分页结果
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

// 键值对
public record KeyValuePair<TKey, TValue>(TKey Key, TValue Value);

// 使用示例
var result = Result<int>.Success(42);
var doubled = result.Map(x => x * 2);
Console.WriteLine(doubled.Value);  // 84

var users = new[] { "Alice", "Bob", "Charlie", "David", "Eve" };
var pagedUsers = new PagedResult<string>(users[..2].ToList(), 1, 2, users.Length);
Console.WriteLine($"Page {pagedUsers.PageNumber}/{pagedUsers.TotalPages}");
Console.WriteLine($"Has Next: {pagedUsers.HasNextPage}");  // True
```

## 最佳实践

### 优先使用位置记录定义简单 DTO

```csharp
// 推荐：简洁明了
public record UserDto(int Id, string Name, string Email);

// 不推荐：除非需要更多控制
public record UserDtoVerbose
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string Email { get; init; } = "";
}
```

### 使用 required 修饰符确保必需属性

```csharp
// C# 11+ 可以使用 required 修饰符
public record User
{
    public required int Id { get; init; }
    public required string Username { get; init; }
    public string? DisplayName { get; init; }  // 可选属性
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

// 必须提供 required 属性
var user = new User { Id = 1, Username = "john_doe" };
```

### 为复杂初始化逻辑添加验证

```csharp
public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Email cannot be empty", nameof(value));

        if (!value.Contains('@'))
            throw new ArgumentException("Invalid email format", nameof(value));

        Value = value.ToLowerInvariant();
    }

    public override string ToString() => Value;
}

public record User(int Id, string Name, Email Email);
```

### 使用 with 表达式实现不可变更新

```csharp
public record AppState(
    User? CurrentUser,
    IReadOnlyList<string> Notifications,
    bool IsDarkMode)
{
    public static AppState Initial => new(null, [], false);

    public AppState Login(User user) => this with { CurrentUser = user };

    public AppState Logout() => this with
    {
        CurrentUser = null,
        Notifications = []
    };

    public AppState AddNotification(string message) => this with
    {
        Notifications = Notifications.Append(message).ToList()
    };

    public AppState ToggleDarkMode() => this with { IsDarkMode = !IsDarkMode };
}
```

### 使用继承建模层次结构

```csharp
// 领域事件基类
public abstract record DomainEvent(Guid Id, DateTime OccurredAt)
{
    public Guid Id { get; } = Id == Guid.Empty ? Guid.NewGuid() : Id;
    public DateTime OccurredAt { get; } = OccurredAt == default ? DateTime.UtcNow : OccurredAt;
}

// 具体事件
public record OrderPlaced(
    Guid Id,
    DateTime OccurredAt,
    Guid OrderId,
    Guid CustomerId,
    decimal TotalAmount) : DomainEvent(Id, OccurredAt);

public record OrderShipped(
    Guid Id,
    DateTime OccurredAt,
    Guid OrderId,
    string TrackingNumber) : DomainEvent(Id, OccurredAt);

public record OrderDelivered(
    Guid Id,
    DateTime OccurredAt,
    Guid OrderId,
    DateTime DeliveredAt) : DomainEvent(Id, OccurredAt);
```

### 集合属性使用不可变类型

```csharp
// 推荐：使用 IReadOnlyList 或 ImmutableList
public record Team(
    string Name,
    IReadOnlyList<string> Members)
{
    public Team AddMember(string member) => this with
    {
        Members = Members.Append(member).ToList().AsReadOnly()
    };
}

// 或使用 System.Collections.Immutable
public record ImmutableTeam(
    string Name,
    ImmutableList<string> Members)
{
    public ImmutableTeam AddMember(string member) => this with
    {
        Members = Members.Add(member)
    };
}
```

## 常见陷阱

### 误解引用类型属性的相等性

```csharp
public record Container(List<int> Items);

var list1 = new List<int> { 1, 2, 3 };
var list2 = new List<int> { 1, 2, 3 };

var c1 = new Container(list1);
var c2 = new Container(list2);

// 陷阱：即使列表内容相同，也不相等！
Console.WriteLine(c1 == c2);  // False（因为 list1 != list2）

// 解决方案：使用不可变集合或自定义相等性
public record BetterContainer(ImmutableList<int> Items);

var bc1 = new BetterContainer([1, 2, 3]);
var bc2 = new BetterContainer([1, 2, 3]);
Console.WriteLine(bc1 == bc2);  // 仍然是 False

// 真正的解决方案：重写相等性检查
public record SequenceContainer(IReadOnlyList<int> Items)
{
    public virtual bool Equals(SequenceContainer? other) =>
        other is not null && Items.SequenceEqual(other.Items);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var item in Items)
            hash.Add(item);
        return hash.ToHashCode();
    }
}
```

### 修改 Record 中的可变属性

```csharp
public record MutableRecord(StringBuilder Content);

var r1 = new MutableRecord(new StringBuilder("Hello"));
var r2 = r1;  // 复制引用

r1.Content.Append(" World");

// 陷阱：r2 的内容也被修改了！
Console.WriteLine(r2.Content);  // "Hello World"

// 解决方案：使用不可变类型
public record ImmutableRecord(string Content);
```

### with 表达式不会深拷贝

```csharp
public record Inner(string Value);
public record Outer(Inner Inner);

var original = new Outer(new Inner("Original"));
var copy = original with { };  // 浅拷贝

// 陷阱：Inner 是同一个实例
Console.WriteLine(ReferenceEquals(original.Inner, copy.Inner));  // True

// 如果 Inner 是可变的，修改会影响两个实例
```

### Record Struct 的默认值陷阱

```csharp
public record struct Point(double X, double Y);

// Record struct 有隐式的无参构造函数
Point defaultPoint = default;
Console.WriteLine(defaultPoint);  // Point { X = 0, Y = 0 }

// 可能不是你期望的行为
Point[] points = new Point[5];  // 全是 (0, 0)

// 解决方案：对于需要验证的场景，考虑使用 record class
// 或显式检查默认值
```

### 继承时的隐式转换陷阱

```csharp
public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

Dog dog = new Dog("Buddy", "Labrador");
Animal animal = dog;  // 隐式转换

// 使用 with 时，类型保持
var newAnimal = animal with { Name = "Max" };
Console.WriteLine(newAnimal.GetType().Name);  // Dog（不是 Animal！）
Console.WriteLine(newAnimal);  // Dog { Name = Max, Breed = Labrador }
```

### 循环引用导致 StackOverflow

```csharp
public record Node(string Value, Node? Next);

// 陷阱：循环引用会导致 ToString() 和 GetHashCode() 溢出
var node1 = new Node("A", null);
var node2 = new Node("B", node1);
// node1 = node1 with { Next = node2 };  // 不要这样做！

// 解决方案：对于图结构，考虑使用普通类并自定义这些方法
```

## 性能考量

### Record Class vs Record Struct 选择

```csharp
// 性能测试对比
public record class RefPoint(double X, double Y);
public record struct ValPoint(double X, double Y);

// 小型数据结构：record struct 通常更快
// - 避免堆分配
// - 减少 GC 压力
// - 更好的缓存局部性

// 大型数据结构（超过 16-24 字节）：record class 可能更好
// - 避免复制开销
// - 栈空间有限
```

### 避免频繁使用 with 表达式

```csharp
// 不推荐：循环中频繁创建新实例
public record Counter(int Value);

Counter counter = new(0);
for (int i = 0; i < 1000000; i++)
{
    counter = counter with { Value = counter.Value + 1 };  // 每次创建新实例
}

// 推荐：使用可变结构或批量更新
public record struct MutableCounter(int Value)
{
    public void Increment() => Value++;
}

// 或收集所有更改后一次性创建
var finalValue = Enumerable.Range(0, 1000000).Sum();
counter = new Counter(finalValue);
```

### 集合属性的性能影响

```csharp
// 低效：每次添加都创建新列表
public record OrderInefficient(IReadOnlyList<string> Items)
{
    public OrderInefficient AddItem(string item) => this with
    {
        Items = Items.Append(item).ToList()  // O(n) 操作
    };
}

// 高效：使用 ImmutableList
public record OrderEfficient(ImmutableList<string> Items)
{
    public OrderEfficient AddItem(string item) => this with
    {
        Items = Items.Add(item)  // O(log n) 操作
    };
}

// 或者：使用构建器模式进行批量修改
public record OrderWithBuilder(ImmutableList<string> Items)
{
    public OrderWithBuilder AddItems(IEnumerable<string> items) => this with
    {
        Items = Items.AddRange(items)
    };
}
```

### 相等性比较的开销

```csharp
// 大量属性的 record 相等性比较可能较慢
public record LargeRecord(
    string P1, string P2, string P3, string P4, string P5,
    string P6, string P7, string P8, string P9, string P10);

// 考虑：
// 1. 只比较关键属性
// 2. 使用 ID 进行快速比较
public record OptimizedRecord(
    Guid Id,
    string P1, string P2, string P3, string P4, string P5)
{
    public virtual bool Equals(OptimizedRecord? other) =>
        other is not null && Id == other.Id;

    public override int GetHashCode() => Id.GetHashCode();
}
```

## 实战场景

### 领域驱动设计 (DDD) 值对象

```csharp
// 值对象示例
public record Money(decimal Amount, string Currency)
{
    public static Money CNY(decimal amount) => new(amount, "CNY");
    public static Money USD(decimal amount) => new(amount, "USD");

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add different currencies");
        return this with { Amount = Amount + other.Amount };
    }

    public Money Multiply(decimal factor) => this with { Amount = Amount * factor };

    public override string ToString() => $"{Amount:N2} {Currency}";
}

public record DateRange(DateTime Start, DateTime End)
{
    public DateRange(DateTime start, DateTime end)
    {
        if (end < start)
            throw new ArgumentException("End must be after Start");
        Start = start;
        End = end;
    }

    public TimeSpan Duration => End - Start;
    public bool Contains(DateTime date) => date >= Start && date <= End;
    public bool Overlaps(DateRange other) => Start < other.End && other.Start < End;
}

public record Percentage
{
    public decimal Value { get; }

    public Percentage(decimal value)
    {
        if (value < 0 || value > 100)
            throw new ArgumentOutOfRangeException(nameof(value), "Must be between 0 and 100");
        Value = value;
    }

    public static implicit operator decimal(Percentage p) => p.Value / 100;
    public override string ToString() => $"{Value}%";
}
```

### API 请求/响应 DTO

```csharp
// API 请求
public record CreateUserRequest(
    string Username,
    string Email,
    string Password,
    string? DisplayName);

public record UpdateUserRequest(
    string? DisplayName,
    string? Email);

public record LoginRequest(string Username, string Password);

// API 响应
public record UserResponse(
    int Id,
    string Username,
    string Email,
    string? DisplayName,
    DateTime CreatedAt);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserResponse User);

public record ApiResponse<T>(
    bool Success,
    T? Data,
    string? Error,
    IReadOnlyList<string>? ValidationErrors = null)
{
    public static ApiResponse<T> Ok(T data) => new(true, data, null);
    public static ApiResponse<T> Fail(string error) => new(false, default, error);
    public static ApiResponse<T> Invalid(IEnumerable<string> errors) =>
        new(false, default, "Validation failed", errors.ToList());
}

// 分页请求/响应
public record PaginationRequest(int Page = 1, int PageSize = 20)
{
    public int Skip => (Page - 1) * PageSize;
}

public record PaginatedResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
}
```

### 配置对象

```csharp
public record DatabaseSettings(
    string ConnectionString,
    int MaxPoolSize = 100,
    int CommandTimeout = 30,
    bool EnableRetry = true);

public record CacheSettings(
    string RedisConnection,
    int DefaultExpirationMinutes = 60,
    string KeyPrefix = "app:");

public record JwtSettings(
    string SecretKey,
    string Issuer,
    string Audience,
    int ExpirationMinutes = 60);

public record AppSettings(
    string AppName,
    string Environment,
    DatabaseSettings Database,
    CacheSettings? Cache,
    JwtSettings Jwt)
{
    public bool IsDevelopment => Environment == "Development";
    public bool IsProduction => Environment == "Production";
}

// 从配置文件加载
// var settings = configuration.GetSection("App").Get<AppSettings>();
```

### 事件溯源 (Event Sourcing)

```csharp
// 事件基类
public abstract record DomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public int Version { get; init; }
}

// 银行账户事件
public record AccountCreated(
    Guid AccountId,
    string OwnerName,
    decimal InitialBalance) : DomainEvent;

public record MoneyDeposited(
    Guid AccountId,
    decimal Amount,
    string Description) : DomainEvent;

public record MoneyWithdrawn(
    Guid AccountId,
    decimal Amount,
    string Description) : DomainEvent;

public record AccountClosed(
    Guid AccountId,
    string Reason) : DomainEvent;

// 事件处理
public record BankAccount(Guid Id, string OwnerName, decimal Balance, bool IsClosed)
{
    public static BankAccount Apply(BankAccount? state, DomainEvent @event) => @event switch
    {
        AccountCreated e => new BankAccount(e.AccountId, e.OwnerName, e.InitialBalance, false),
        MoneyDeposited e when state is not null =>
            state with { Balance = state.Balance + e.Amount },
        MoneyWithdrawn e when state is not null =>
            state with { Balance = state.Balance - e.Amount },
        AccountClosed when state is not null =>
            state with { IsClosed = true },
        _ => state ?? throw new InvalidOperationException("Invalid event sequence")
    };

    public static BankAccount Replay(IEnumerable<DomainEvent> events) =>
        events.Aggregate((BankAccount?)null, Apply)!;
}
```

## 面试要点

### Record 和 Class 的主要区别是什么？

**答案要点：**
- Record 使用值相等性，Class 使用引用相等性
- Record 自动生成 `Equals`、`GetHashCode`、`ToString`、`Deconstruct` 等方法
- Record 支持 `with` 表达式创建修改后的副本
- Record 默认属性是 `init-only`，鼓励不可变性
- Record 之间的继承需要遵循特殊规则（EqualityContract）

### Record Class 和 Record Struct 如何选择？

**答案要点：**
- Record Class 是引用类型，适合较大的数据结构，支持继承
- Record Struct 是值类型，适合小型数据结构（通常小于 16-24 字节）
- Record Struct 避免堆分配，在性能敏感场景更优
- Record Struct 不支持继承，但可以实现接口
- 默认值行为不同：Record Class 默认 null，Record Struct 有默认值

### with 表达式的工作原理？

**答案要点：**
- `with` 表达式调用编译器生成的 `<Clone>$()` 方法
- 创建对象的浅拷贝，然后修改指定的属性
- 对于继承的 Record，会保持实际类型（多态克隆）
- 不会触发验证逻辑（如果在构造函数中有验证）
- 可以一次修改多个属性：`person with { Name = "New", Age = 30 }`

### Record 的相等性是如何实现的？

**答案要点：**
- 编译器自动生成 `IEquatable<T>` 实现
- 比较所有属性的值（使用 `EqualityComparer<T>.Default`）
- 包含 `EqualityContract` 确保继承时的类型安全
- 同时重载 `==` 和 `!=` 运算符
- `GetHashCode()` 基于所有属性计算

### 什么情况下不应该使用 Record？

**答案要点：**
- 需要频繁修改的实体（性能考虑）
- 包含大量属性且频繁比较的场景
- 需要复杂的可变状态管理
- 性能关键路径上频繁创建副本
- 需要精细控制相等性比较逻辑

### 如何处理 Record 中的集合属性相等性？

**答案要点：**
- 默认使用引用相等性比较集合
- 需要自定义 `Equals` 和 `GetHashCode` 实现序列相等性
- 考虑使用 `ImmutableList` 等不可变集合
- 或创建包装类型封装集合相等性逻辑

```csharp
public record PersonWithHobbies(string Name, IReadOnlyList<string> Hobbies)
{
    public virtual bool Equals(PersonWithHobbies? other) =>
        other is not null &&
        Name == other.Name &&
        Hobbies.SequenceEqual(other.Hobbies);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(Name);
        foreach (var hobby in Hobbies)
            hash.Add(hobby);
        return hash.ToHashCode();
    }
}
```

## 延伸阅读

### 官方文档
- [Microsoft Learn: Records (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record)
- [Microsoft Learn: record struct](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record#record-struct)
- [C# 9.0 发布说明 - Records](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#record-types)
- [C# 10 发布说明 - Record structs](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10#record-structs)

### 深入文章
- [Introducing C# 9: Records - Anthony Giretti](https://anthonygiretti.com/2020/06/17/introducing-c-9-records/)
- [Records - Essential C# - InformIT](https://www.informit.com/articles/article.aspx?p=3069200)
- [Understanding Records in C# 9 - Jon Skeet](https://codeblog.jonskeet.uk/2020/12/07/records-and-expressions-in-c-9/)

### 相关主题
- [C# 模式匹配完全指南](/docs/csharp/pattern-matching) - Record 与模式匹配的结合使用
- [C# 不可变集合](/docs/csharp/immutable-collections) - 配合 Record 使用的不可变数据结构
- [领域驱动设计中的值对象](https://martinfowler.com/bliki/ValueObject.html) - Record 的典型应用场景
