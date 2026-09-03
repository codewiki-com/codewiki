---
title: C# 属性 (Properties)
description: 深入理解 C# 属性机制，包括自动属性、表达式主体属性、init-only 设置器和 required 属性
track: csharp
section: basics
difficulty: beginner
tags:
  - C#
  - 属性
  - Properties
  - 封装
  - .NET
status: imported
origin: old/src/content/docs/csharp/properties.zh.md
divergence: 0.137
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: CSharp
  subcategory: 语言基础
  order: 3
  lastUpdated: 2026-01-07
---

属性（Properties）是 C# 中实现封装的核心机制，它提供了一种灵活的方式来读取、写入或计算私有字段的值。属性将字段的简洁语法与方法的灵活性完美结合，是面向对象编程中数据访问的最佳实践。

## 概念解释

### 什么是属性

属性是类、结构体或接口的成员，它提供了一种访问对象数据的机制。从外部看，属性像字段一样使用，但在内部，它通过访问器（accessors）来控制数据的读写。

```csharp
public class Person
{
    // 字段：直接存储数据
    private string _name;

    // 属性：通过访问器控制数据访问
    public string Name
    {
        get { return _name; }
        set { _name = value; }
    }
}

// 使用方式与字段相同
Person person = new Person();
person.Name = "张三";      // 调用 set 访问器
string name = person.Name; // 调用 get 访问器
```

### 属性的历史演变

C# 属性经历了多次重要演变：

| 版本 | 特性 | 说明 |
|------|------|------|
| C# 1.0 | 基础属性 | get/set 访问器 |
| C# 2.0 | 访问器可访问性 | 可单独设置 get/set 的访问级别 |
| C# 3.0 | 自动属性 | 编译器自动生成后备字段 |
| C# 6.0 | 表达式主体属性 | 使用 `=>` 简化单行属性 |
| C# 6.0 | 只读自动属性 | 可在构造函数中初始化 |
| C# 9.0 | init-only 设置器 | 仅在初始化时可写 |
| C# 11.0 | required 属性 | 强制在创建时初始化 |

### 属性解决的问题

1. **数据封装**：隐藏内部实现细节，只暴露必要的接口
2. **数据验证**：在设置值时进行有效性检查
3. **计算值**：动态计算并返回值，无需存储
4. **通知机制**：在值变化时触发事件（如数据绑定）
5. **延迟初始化**：在首次访问时才创建对象

## 核心原理

### 属性的编译原理

属性在编译后会转换为方法。编译器为每个属性生成对应的 `get_PropertyName` 和 `set_PropertyName` 方法。

```csharp
// 源代码
public class Product
{
    private decimal _price;

    public decimal Price
    {
        get { return _price; }
        set { _price = value; }
    }
}

// 编译后的 IL 等效代码
public class Product
{
    private decimal _price;

    public decimal get_Price()
    {
        return _price;
    }

    public void set_Price(decimal value)
    {
        _price = value;
    }
}
```

### 自动属性的后备字段

自动属性由编译器生成一个隐藏的后备字段（backing field），命名格式为 `<PropertyName>k__BackingField`。

```csharp
// 源代码
public class Book
{
    public string Title { get; set; }
}

// 编译器生成的等效代码
public class Book
{
    [CompilerGenerated]
    private string <Title>k__BackingField;

    public string Title
    {
        [CompilerGenerated]
        get { return <Title>k__BackingField; }
        [CompilerGenerated]
        set { <Title>k__BackingField = value; }
    }
}
```

### value 关键字

在属性的 `set` 访问器中，`value` 是一个隐式参数，代表调用者传入的值。

```csharp
public class Temperature
{
    private double _celsius;

    public double Celsius
    {
        get { return _celsius; }
        set
        {
            // value 是传入的新值
            if (value < -273.15)
                throw new ArgumentException("温度不能低于绝对零度");
            _celsius = value;
        }
    }
}
```

## 核心要点

### 自动属性 (Auto-Properties)

自动属性是 C# 3.0 引入的简化语法，无需显式声明后备字段。

```csharp
public class Customer
{
    // 自动属性：编译器自动生成后备字段
    public string Name { get; set; }
    public int Age { get; set; }

    // 带初始值的自动属性（C# 6.0+）
    public string Country { get; set; } = "中国";
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // 只读自动属性（C# 6.0+）
    public Guid Id { get; } = Guid.NewGuid();

    // 在构造函数中初始化只读属性
    public Customer(string name)
    {
        Name = name;
        Id = Guid.NewGuid(); // 只读属性可在构造函数中赋值
    }
}
```

### 表达式主体属性 (Expression-Bodied Properties)

表达式主体属性使用 `=>` 语法，适用于简单的单行属性。

```csharp
public class Circle
{
    public double Radius { get; set; }

    // 只读表达式主体属性
    public double Diameter => Radius * 2;
    public double Area => Math.PI * Radius * Radius;
    public double Circumference => 2 * Math.PI * Radius;

    // 带 get 和 set 的表达式主体（C# 7.0+）
    private string _name;
    public string Name
    {
        get => _name;
        set => _name = value?.Trim() ?? string.Empty;
    }
}

public class Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }

    // 表达式主体属性计算面积
    public double Area => Width * Height;

    // 表达式主体属性判断是否为正方形
    public bool IsSquare => Width == Height;
}
```

### init-only 设置器 (Init-Only Setters)

init-only 设置器（C# 9.0）允许属性仅在对象初始化时设置，之后变为只读。

```csharp
public class ImmutablePerson
{
    // init 访问器：只能在初始化时设置
    public string FirstName { get; init; }
    public string LastName { get; init; }
    public DateTime BirthDate { get; init; }

    // 计算属性仍然可以访问
    public string FullName => $"{FirstName} {LastName}";
    public int Age => DateTime.Now.Year - BirthDate.Year;
}

// 使用对象初始化器
var person = new ImmutablePerson
{
    FirstName = "张",
    LastName = "三",
    BirthDate = new DateTime(1990, 1, 1)
};

// 初始化后不能修改
// person.FirstName = "李"; // 编译错误！

// 可以使用 with 表达式创建副本（需要是 record 或支持 with）
public record PersonRecord(string FirstName, string LastName, DateTime BirthDate);

var person1 = new PersonRecord("张", "三", new DateTime(1990, 1, 1));
var person2 = person1 with { FirstName = "李" }; // 创建新对象
```

### required 属性 (Required Properties)

required 属性（C# 11.0）强制在创建对象时必须初始化指定的属性。

```csharp
public class User
{
    // required 修饰符：必须在创建时初始化
    public required string Username { get; set; }
    public required string Email { get; set; }

    // 可选属性
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// 必须提供 required 属性
var user = new User
{
    Username = "zhangsan",
    Email = "zhang@example.com"
    // DisplayName 是可选的
};

// 编译错误：缺少 required 属性
// var invalidUser = new User { Username = "test" }; // 缺少 Email

// 结合构造函数使用
public class Employee
{
    public required string EmployeeId { get; init; }
    public required string Name { get; init; }
    public string? Department { get; set; }

    // 使用 SetsRequiredMembers 特性标记构造函数
    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public Employee(string employeeId, string name)
    {
        EmployeeId = employeeId;
        Name = name;
    }

    // 无参构造函数需要通过对象初始化器设置 required 属性
    public Employee() { }
}
```

### 访问器可访问性

可以为 get 和 set 访问器设置不同的访问级别。

```csharp
public class BankAccount
{
    // 公开读取，私有写入
    public decimal Balance { get; private set; }

    // 公开读取，受保护写入
    public string AccountNumber { get; protected set; }

    // 公开读取，内部写入
    public string BankCode { get; internal set; }

    public void Deposit(decimal amount)
    {
        if (amount > 0)
            Balance += amount; // 内部可以修改
    }
}

var account = new BankAccount();
decimal balance = account.Balance; // 可以读取
// account.Balance = 1000; // 编译错误：set 是 private
```

## 代码示例

### 示例 1：完整的属性实现

```csharp
public class Product
{
    // 私有后备字段
    private string _name;
    private decimal _price;
    private int _stock;

    // 带验证的属性
    public string Name
    {
        get => _name;
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("产品名称不能为空");
            _name = value.Trim();
        }
    }

    // 带范围验证的属性
    public decimal Price
    {
        get => _price;
        set
        {
            if (value < 0)
                throw new ArgumentException("价格不能为负数");
            _price = Math.Round(value, 2);
        }
    }

    // 带约束的属性
    public int Stock
    {
        get => _stock;
        set => _stock = Math.Max(0, value); // 确保不为负
    }

    // 只读计算属性
    public decimal TotalValue => Price * Stock;

    // 带格式化的只读属性
    public string PriceDisplay => $"¥{Price:N2}";

    // 判断是否有库存
    public bool InStock => Stock > 0;
}
```

### 示例 2：属性变更通知（INotifyPropertyChanged）

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

public class ObservableObject : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
            return false;

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}

public class ViewModel : ObservableObject
{
    private string _title;
    private int _count;

    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public int Count
    {
        get => _count;
        set
        {
            if (SetProperty(ref _count, value))
            {
                // 当 Count 变化时，通知 CountDisplay 也变化了
                OnPropertyChanged(nameof(CountDisplay));
            }
        }
    }

    public string CountDisplay => $"计数: {Count}";
}
```

### 示例 3：延迟初始化属性

```csharp
public class LazyLoadingExample
{
    // 使用 Lazy<T> 实现延迟初始化
    private readonly Lazy<List<string>> _items;

    public LazyLoadingExample()
    {
        _items = new Lazy<List<string>>(() =>
        {
            Console.WriteLine("正在加载数据...");
            return LoadDataFromDatabase();
        });
    }

    // 首次访问时才会加载数据
    public List<string> Items => _items.Value;

    private List<string> LoadDataFromDatabase()
    {
        // 模拟数据库查询
        return new List<string> { "数据1", "数据2", "数据3" };
    }
}

// 手动实现延迟初始化
public class ManualLazyLoading
{
    private ExpensiveObject? _expensive;

    public ExpensiveObject Expensive
    {
        get
        {
            // 首次访问时创建对象
            _expensive ??= new ExpensiveObject();
            return _expensive;
        }
    }
}
```

### 示例 4：索引器属性

```csharp
public class StringCollection
{
    private readonly List<string> _items = new();

    // 基于整数的索引器
    public string this[int index]
    {
        get => _items[index];
        set => _items[index] = value;
    }

    // 基于字符串的索引器
    public string this[string key]
    {
        get => _items.FirstOrDefault(x => x.StartsWith(key)) ?? string.Empty;
    }

    // 多参数索引器
    public string this[int start, int end]
    {
        get => string.Join(", ", _items.Skip(start).Take(end - start));
    }

    public void Add(string item) => _items.Add(item);
    public int Count => _items.Count;
}

// 使用示例
var collection = new StringCollection();
collection.Add("Apple");
collection.Add("Banana");
collection.Add("Cherry");

string first = collection[0];        // "Apple"
string startsWithB = collection["B"]; // "Banana"
string range = collection[0, 2];     // "Apple, Banana"
```

### 示例 5：接口中的属性

```csharp
// 定义带属性的接口
public interface IEntity
{
    int Id { get; }
    DateTime CreatedAt { get; }
    DateTime? UpdatedAt { get; set; }
}

public interface INameable
{
    string Name { get; set; }
}

// 实现接口属性
public class Article : IEntity, INameable
{
    public int Id { get; init; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string Content { get; set; } = string.Empty;
}

// 显式接口实现
public class HiddenIdEntity : IEntity
{
    // 显式实现：只能通过接口访问
    int IEntity.Id => GetHashCode();
    DateTime IEntity.CreatedAt { get; } = DateTime.UtcNow;
    DateTime? IEntity.UpdatedAt { get; set; }
}
```

### 示例 6：记录类型与属性

```csharp
// 位置记录：自动生成 init-only 属性
public record Person(string FirstName, string LastName, int Age);

// 带额外属性的记录
public record Employee(string Name, string Department) : Person(Name, "", 0)
{
    public required string EmployeeId { get; init; }
    public decimal Salary { get; init; }

    // 计算属性
    public string DisplayInfo => $"{Name} ({Department}) - {EmployeeId}";
}

// 记录结构体（C# 10+）
public readonly record struct Point(double X, double Y)
{
    // 计算属性
    public double Distance => Math.Sqrt(X * X + Y * Y);
}

// 使用示例
var person = new Person("张", "三", 30);
var modified = person with { Age = 31 }; // 使用 with 创建副本

var employee = new Employee("李四", "技术部")
{
    EmployeeId = "EMP001",
    Salary = 10000m
};
```

## 最佳实践

### 优先使用自动属性

```csharp
// 推荐：使用自动属性
public class User
{
    public string Name { get; set; }
    public int Age { get; set; }
}

// 不推荐：没有额外逻辑时不需要显式后备字段
public class UserVerbose
{
    private string _name;
    private int _age;

    public string Name
    {
        get { return _name; }
        set { _name = value; }
    }

    public int Age
    {
        get { return _age; }
        set { _age = value; }
    }
}
```

### 使用表达式主体简化代码

```csharp
public class Order
{
    public List<OrderItem> Items { get; } = new();
    public decimal Discount { get; set; }

    // 推荐：表达式主体，简洁明了
    public decimal Subtotal => Items.Sum(x => x.Total);
    public decimal Tax => Subtotal * 0.13m;
    public decimal Total => Subtotal + Tax - Discount;
    public bool IsEmpty => Items.Count == 0;

    // 不推荐：冗长的写法
    public decimal SubtotalVerbose
    {
        get
        {
            return Items.Sum(x => x.Total);
        }
    }
}
```

### 合理使用 init 和 required

```csharp
// 推荐：不可变数据使用 init
public class Configuration
{
    public required string ConnectionString { get; init; }
    public required string ApiKey { get; init; }
    public int Timeout { get; init; } = 30;
    public bool EnableLogging { get; init; } = true;
}

// 使用时必须提供必需属性
var config = new Configuration
{
    ConnectionString = "Server=localhost;Database=test",
    ApiKey = "secret-key"
    // Timeout 和 EnableLogging 使用默认值
};
```

### 属性命名规范

```csharp
public class NamingConventions
{
    // 公共属性：PascalCase
    public string FirstName { get; set; }
    public string LastName { get; set; }

    // 私有后备字段：_camelCase
    private string _email;
    public string Email
    {
        get => _email;
        set => _email = value?.ToLowerInvariant();
    }

    // 布尔属性：使用 Is/Has/Can 前缀
    public bool IsActive { get; set; }
    public bool HasPermission { get; set; }
    public bool CanEdit { get; set; }

    // 集合属性：使用复数名词
    public List<string> Tags { get; } = new();
    public IReadOnlyList<Item> Items => _items.AsReadOnly();
    private readonly List<Item> _items = new();
}
```

### 只读集合属性

```csharp
public class OrderWithItems
{
    // 内部可修改的集合
    private readonly List<OrderItem> _items = new();

    // 对外暴露只读视图
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    // 或使用 IEnumerable
    public IEnumerable<OrderItem> ItemsEnumerable => _items;

    // 提供方法来修改集合
    public void AddItem(OrderItem item) => _items.Add(item);
    public void RemoveItem(OrderItem item) => _items.Remove(item);
    public void ClearItems() => _items.Clear();
}
```

## 常见陷阱

### 在属性访问器中执行耗时操作

```csharp
// 错误：属性 get 中执行耗时操作
public class BadExample
{
    public List<User> Users
    {
        get
        {
            // 每次访问都查询数据库，性能差！
            return _database.Query<User>("SELECT * FROM Users").ToList();
        }
    }
}

// 正确：使用方法或缓存
public class GoodExample
{
    private List<User>? _usersCache;

    // 方式1：使用方法表明可能耗时
    public List<User> GetUsers()
    {
        return _database.Query<User>("SELECT * FROM Users").ToList();
    }

    // 方式2：缓存结果
    public List<User> Users => _usersCache ??= LoadUsers();

    private List<User> LoadUsers()
    {
        return _database.Query<User>("SELECT * FROM Users").ToList();
    }
}
```

### 在属性中产生副作用

```csharp
// 错误：get 访问器修改状态
public class BadCounter
{
    private int _count;

    public int Count
    {
        get
        {
            _count++; // 副作用！每次读取都会增加
            return _count;
        }
    }
}

// 正确：get 应该是幂等的
public class GoodCounter
{
    public int Count { get; private set; }

    public void Increment() => Count++;
}
```

### 暴露可变集合

```csharp
// 错误：暴露内部可变集合
public class UnsafeClass
{
    public List<string> Items { get; set; } = new();
}

// 外部可以任意修改
var obj = new UnsafeClass();
obj.Items = null; // 危险！
obj.Items.Clear(); // 可能破坏内部状态

// 正确：保护内部集合
public class SafeClass
{
    private readonly List<string> _items = new();

    // 方式1：只读列表
    public IReadOnlyList<string> Items => _items.AsReadOnly();

    // 方式2：返回副本
    public List<string> GetItems() => new List<string>(_items);

    // 提供受控的修改方法
    public void AddItem(string item)
    {
        if (!string.IsNullOrEmpty(item))
            _items.Add(item);
    }
}
```

### 忘记空值检查

```csharp
// 错误：没有空值保护
public class UnsafeProperty
{
    private string _name;

    public string Name
    {
        get => _name;
        set => _name = value.Trim(); // value 可能为 null！
    }
}

// 正确：添加空值检查
public class SafeProperty
{
    private string _name = string.Empty;

    public string Name
    {
        get => _name;
        set => _name = value?.Trim() ?? string.Empty;
    }

    // 或者使用 ArgumentNullException
    public string StrictName
    {
        get => _name;
        set => _name = value ?? throw new ArgumentNullException(nameof(value));
    }
}
```

### 递归属性调用

```csharp
// 错误：属性调用自身导致栈溢出
public class RecursiveProperty
{
    public string Name
    {
        get => Name; // 递归调用自己！
        set => Name = value; // 递归调用自己！
    }
}

// 正确：使用后备字段
public class CorrectProperty
{
    private string _name;

    public string Name
    {
        get => _name;
        set => _name = value;
    }
}
```

## 性能考量

### 属性 vs 字段的性能

```csharp
public class PerformanceComparison
{
    // 字段：直接访问，无方法调用开销
    public int Field;

    // 自动属性：JIT 通常会内联，性能接近字段
    public int AutoProperty { get; set; }

    // 带验证的属性：有额外开销
    private int _validatedValue;
    public int ValidatedProperty
    {
        get => _validatedValue;
        set
        {
            if (value < 0) throw new ArgumentException();
            _validatedValue = value;
        }
    }

    // 计算属性：每次访问都会计算
    public int ComputedProperty => Field * 2 + AutoProperty;
}

// 性能提示：
// 1. 自动属性在大多数情况下与字段性能相当
// 2. JIT 编译器会内联简单的属性访问器
// 3. 热点代码中避免复杂的属性计算
```

### 缓存计算属性

```csharp
public class CachingExample
{
    private readonly List<int> _numbers = new();
    private int? _sumCache;
    private double? _averageCache;

    public IReadOnlyList<int> Numbers => _numbers.AsReadOnly();

    // 缓存计算结果
    public int Sum => _sumCache ??= _numbers.Sum();
    public double Average => _averageCache ??= _numbers.Average();

    public void Add(int number)
    {
        _numbers.Add(number);
        InvalidateCache(); // 数据变化时清除缓存
    }

    private void InvalidateCache()
    {
        _sumCache = null;
        _averageCache = null;
    }
}
```

### 避免不必要的对象创建

```csharp
public class ObjectCreationExample
{
    // 不好：每次访问都创建新对象
    public List<string> BadItems => new List<string> { "A", "B", "C" };

    // 好：返回同一个实例
    private static readonly List<string> _defaultItems = new() { "A", "B", "C" };
    public IReadOnlyList<string> GoodItems => _defaultItems;

    // 更好：使用延迟初始化
    private List<string>? _items;
    public List<string> LazyItems => _items ??= new List<string> { "A", "B", "C" };
}
```

### 结构体中的属性

```csharp
// 结构体中使用只读属性避免防御性复制
public readonly struct ImmutablePoint
{
    public double X { get; }
    public double Y { get; }

    public ImmutablePoint(double x, double y)
    {
        X = x;
        Y = y;
    }

    // readonly 方法不会导致防御性复制
    public readonly double Distance => Math.Sqrt(X * X + Y * Y);
}

// 可变结构体可能导致性能问题
public struct MutablePoint
{
    public double X { get; set; }
    public double Y { get; set; }

    // 当结构体是 readonly 字段时，访问这个属性会创建副本
    public double Distance => Math.Sqrt(X * X + Y * Y);
}
```

## 实战场景

### 场景 1：配置类

```csharp
public class AppSettings
{
    // 必需的配置
    public required string DatabaseConnection { get; init; }
    public required string ApiBaseUrl { get; init; }

    // 可选配置，带默认值
    public int ConnectionTimeout { get; init; } = 30;
    public int MaxRetries { get; init; } = 3;
    public bool EnableCaching { get; init; } = true;

    // 派生配置
    public Uri ApiUri => new Uri(ApiBaseUrl);
    public bool IsProduction => !ApiBaseUrl.Contains("localhost");
}

// 使用
var settings = new AppSettings
{
    DatabaseConnection = "Server=prod;Database=app",
    ApiBaseUrl = "https://api.example.com",
    MaxRetries = 5
};
```

### 场景 2：实体模型

```csharp
public class Order : IEntity
{
    // 标识
    public int Id { get; init; }
    public Guid PublicId { get; init; } = Guid.NewGuid();

    // 必需属性
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }

    // 订单明细
    private readonly List<OrderLine> _lines = new();
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();

    // 计算属性
    public decimal Subtotal => _lines.Sum(l => l.Total);
    public decimal Tax => Subtotal * 0.13m;
    public decimal Total => Subtotal + Tax;
    public int ItemCount => _lines.Sum(l => l.Quantity);

    // 状态属性
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;

    // 时间戳
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    // 业务方法
    public void AddLine(OrderLine line)
    {
        _lines.Add(line);
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(OrderStatus newStatus)
    {
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }
}

public record OrderLine(string ProductName, decimal UnitPrice, int Quantity)
{
    public decimal Total => UnitPrice * Quantity;
}

public enum OrderStatus { Pending, Confirmed, Shipped, Delivered, Cancelled }
```

### 场景 3：DTO（数据传输对象）

```csharp
// 请求 DTO
public class CreateUserRequest
{
    public required string Username { get; init; }
    public required string Email { get; init; }
    public required string Password { get; init; }
    public string? DisplayName { get; init; }
}

// 响应 DTO
public class UserResponse
{
    public required int Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public string? DisplayName { get; init; }
    public DateTime CreatedAt { get; init; }

    // 工厂方法
    public static UserResponse FromEntity(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        DisplayName = user.DisplayName,
        CreatedAt = user.CreatedAt
    };
}

// 分页响应
public class PagedResponse<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public required int TotalCount { get; init; }
    public required int PageNumber { get; init; }
    public required int PageSize { get; init; }

    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
```

### 场景 4：MVVM 视图模型

```csharp
public class MainViewModel : ObservableObject
{
    private string _searchText = string.Empty;
    private bool _isLoading;
    private ObservableCollection<ItemViewModel> _items = new();

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
            {
                // 搜索文本变化时执行搜索
                SearchCommand.NotifyCanExecuteChanged();
            }
        }
    }

    public bool IsLoading
    {
        get => _isLoading;
        set
        {
            if (SetProperty(ref _isLoading, value))
            {
                OnPropertyChanged(nameof(IsNotLoading));
            }
        }
    }

    public bool IsNotLoading => !IsLoading;

    public ObservableCollection<ItemViewModel> Items
    {
        get => _items;
        set => SetProperty(ref _items, value);
    }

    // 命令属性
    public IRelayCommand SearchCommand { get; }
    public IRelayCommand<ItemViewModel> SelectItemCommand { get; }

    public MainViewModel()
    {
        SearchCommand = new RelayCommand(ExecuteSearch, CanExecuteSearch);
        SelectItemCommand = new RelayCommand<ItemViewModel>(ExecuteSelectItem);
    }

    private bool CanExecuteSearch() => !string.IsNullOrWhiteSpace(SearchText) && !IsLoading;

    private async void ExecuteSearch()
    {
        IsLoading = true;
        try
        {
            var results = await _searchService.SearchAsync(SearchText);
            Items = new ObservableCollection<ItemViewModel>(results);
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void ExecuteSelectItem(ItemViewModel? item)
    {
        if (item != null)
        {
            // 处理选中项
        }
    }
}
```

## 面试要点

### 属性和字段的区别是什么？

**回答要点**：
- 属性是通过访问器方法访问的，字段是直接访问的
- 属性可以添加验证逻辑、计算逻辑和访问控制
- 属性可以定义在接口中，字段不行
- 属性支持数据绑定（如 WPF），字段不支持
- 属性是实现封装的推荐方式

### 自动属性的后备字段是如何生成的？

**回答要点**：
- 编译器自动生成名为 `<PropertyName>k__BackingField` 的私有字段
- 该字段标记了 `[CompilerGenerated]` 特性
- get 和 set 访问器也会被标记为编译器生成
- 可以通过反射访问后备字段（不推荐）

### init 和 set 的区别是什么？

**回答要点**：
- `set`：属性可以在任何时候被修改
- `init`：属性只能在对象初始化时设置（构造函数或对象初始化器）
- `init` 使属性在初始化后变为只读，支持创建不可变对象
- `init` 配合 `with` 表达式可以创建对象的修改副本

### required 修饰符的作用是什么？

**回答要点**：
- 强制在创建对象时必须初始化该属性
- 提供编译时检查，防止遗漏必需属性
- 可以与 `init` 或 `set` 一起使用
- 构造函数可以使用 `[SetsRequiredMembers]` 特性标记已设置所有必需成员

### 表达式主体属性什么时候使用？

**回答要点**：
- 当属性只需要单行表达式时使用
- 适用于只读计算属性
- 适用于简单的 get/set 实现
- 提高代码可读性，减少样板代码
- 不适用于需要多条语句的复杂逻辑

### 如何实现只读属性？

```csharp
// 方式 1：只有 get 访问器
public string Name { get; }

// 方式 2：私有 set
public string Name { get; private set; }

// 方式 3：init-only
public string Name { get; init; }

// 方式 4：表达式主体
public string FullName => $"{FirstName} {LastName}";

// 方式 5：readonly 字段
public readonly string Id = Guid.NewGuid().ToString();
```

### 属性访问器的可访问性规则是什么？

**回答要点**：
- 访问器的可访问性必须比属性更严格
- 只能设置一个访问器的可访问性，另一个继承属性的可访问性
- 常见组合：`public get, private set` 和 `public get, protected set`
- 接口中定义的属性，访问器不能有访问修饰符

## 延伸阅读

### 官方文档
- [Properties (C# Programming Guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties)
- [Auto-Implemented Properties](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/auto-implemented-properties)
- [init (C# Reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/init)
- [required modifier](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/required)

### 推荐书籍
- 《C# in Depth》 by Jon Skeet - 深入讲解 C# 特性演变
- 《Effective C#》 by Bill Wagner - 包含属性使用的最佳实践
- 《C# 12 and .NET 8 - Modern Cross-Platform Development》 by Mark J. Price

### 相关主题
- [封装与数据隐藏](/docs/architecture/encapsulation)
- [INotifyPropertyChanged 接口](/docs/csharp/inpc)
- [记录类型 (Records)](/docs/csharp/records)
- [不可变对象设计](/docs/architecture/immutability)

## 总结

C# 属性是实现封装的核心机制，从基础的 get/set 访问器到现代的 `init` 和 `required` 修饰符，属性系统不断演进以支持更多的编程场景：

1. **自动属性**：简化常见场景，减少样板代码
2. **表达式主体属性**：单行属性的简洁语法
3. **init-only 设置器**：支持不可变对象的创建
4. **required 属性**：确保必需数据的初始化

掌握属性的各种特性和最佳实践，能够帮助你编写更安全、更易维护的 C# 代码。
