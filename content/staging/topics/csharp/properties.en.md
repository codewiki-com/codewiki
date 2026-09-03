---
title: C# Properties and Auto-Properties
description: Comprehensive guide to C# properties and auto-properties, covering traditional properties, auto-properties, initialization, and best practices for encapsulation and data access.
track: csharp
section: basics
difficulty: beginner
tags:
  - properties
  - encapsulation
  - getters-setters
  - auto-properties
  - initialization
status: imported
origin: old/src/content/docs/csharp/properties.en.md
divergence: 0.137
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: CSharp
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-07
---


## Concept Explanation

Properties in C# provide a mechanism for encapsulation that bridges the gap between fields and methods. They allow you to define controlled access to object data while maintaining a simple syntax similar to field access. A property exposes a get accessor (for reading) and/or a set accessor (for writing) that control how data is accessed and modified.

Properties solve the fundamental problem of balancing simplicity with control. In languages like C, you might directly access public fields, losing the ability to validate or transform data. In languages requiring explicit getters and setters, code becomes verbose. C# properties strike a balance by providing field-like syntax while enabling behind-the-scenes logic.

Auto-properties, introduced in C# 3.0, further simplified property declaration by automatically generating a private backing field. This reduced boilerplate code significantly and became the standard for simple property access patterns.

### Historical Context

- **Pre-C# 2.0**: Developers used explicit get/set methods or public fields
- **C# 2.0**: Traditional properties with backing fields became standard
- **C# 3.0**: Auto-properties introduced, reducing verbosity
- **C# 6.0**: Auto-property initializers allowed inline initialization
- **C# 9.0**: Init-only properties enabled immutable initialization patterns
- **C# 11.0**: Required properties enforced initialization at construction

## Core Principles

### Encapsulation
Properties implement the encapsulation principle by hiding internal implementation details. The getter and setter methods can contain logic to validate, transform, or log data access, while consumers see a simple property-like interface.

### Single Responsibility
A property should represent a single logical piece of data. Complex operations should be delegated to methods rather than overloading property logic.

### Asymmetric Access Control
Properties can have different access levels for getters and setters. For example, a public getter with a private setter allows external read-only access while internal modification remains possible.

### Consistency with Field-Like Syntax
Properties maintain consistency with field access syntax, reducing cognitive load for developers while providing the flexibility of methods behind the scenes.

### Lazy Evaluation
Properties can compute values on-demand rather than storing them, useful for derived or expensive calculations.

## Key Points

### Traditional Properties
- Require explicit backing field declaration
- Support arbitrary logic in getters and setters
- More verbose but highly flexible
- Suitable for complex access patterns with validation or side effects

### Auto-Properties
- Automatically generate backing fields
- Cleaner, more concise syntax
- Suitable for simple read/write patterns
- Can be initialized at declaration (C# 6.0+)

### Init-Only Properties
- Created with `init` accessor (C# 9.0+)
- Allow setting only during object initialization
- Enable immutable object creation
- Perfect for data transfer objects and records

### Required Properties
- Declared with `required` keyword (C# 11.0+)
- Must be set during construction
- Enforce complete object initialization
- Improve type safety for complex objects

### Indexers
- Properties with parameters (typically array indices)
- Provide dictionary-like or array-like access
- Useful for collection types

### Calculated Properties
- Return computed values rather than stored state
- No backing field required
- Useful for derived or dependent values

## Code Examples

### Traditional Properties with Backing Fields

```csharp
public class Person
{
    private int _age;
    private string _name;

    // Traditional property with validation
    public int Age
    {
        get { return _age; }
        set
        {
            if (value < 0 || value > 150)
                throw new ArgumentException("Age must be between 0 and 150");
            _age = value;
        }
    }

    // Traditional property with side effects
    public string Name
    {
        get { return _name; }
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Name cannot be empty");
            _name = value.Trim();
            OnNameChanged();
        }
    }

    private void OnNameChanged()
    {
        // Log or trigger other actions when name changes
        Console.WriteLine($"Name changed to: {_name}");
    }
}

// Usage
var person = new Person();
person.Name = "John Doe";    // Logs the change
person.Age = 30;              // Validates age
```

### Auto-Properties

```csharp
public class Product
{
    // Simple auto-property - backing field generated automatically
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string Sku { get; set; }

    // Auto-property with initialization (C# 6.0+)
    public DateTime CreatedDate { get; set; } = DateTime.Now;
    public bool IsActive { get; set; } = true;
    public int StockQuantity { get; set; } = 0;
}

// Usage
var product = new Product
{
    Name = "Laptop",
    Price = 999.99m,
    Sku = "LAPTOP-001"
};

Console.WriteLine(product.CreatedDate); // Current date/time
```

### Asymmetric Access Control

```csharp
public class BankAccount
{
    // Public getter, private setter - read-only to consumers
    public decimal Balance { get; private set; }

    // Internal setter for class use
    public string AccountNumber { get; internal set; }

    public BankAccount(decimal initialBalance)
    {
        Balance = initialBalance;
    }

    public void Deposit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Deposit amount must be positive");
        Balance += amount;
    }

    public void Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive");
        if (amount > Balance)
            throw new InvalidOperationException("Insufficient funds");
        Balance -= amount;
    }
}

// Usage
var account = new BankAccount(1000m);
Console.WriteLine(account.Balance);  // 1000 - readable
account.Deposit(500);                // OK - method call
// account.Balance = 2000;            // ERROR - setter is private
```

### Init-Only Properties (C# 9.0+)

```csharp
public class UserProfile
{
    // Can only be set during initialization
    public string UserId { get; init; }
    public string Email { get; init; }
    public string DisplayName { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.Now;
}

// Usage - object initializer syntax
var user = new UserProfile
{
    UserId = "usr_12345",
    Email = "user@example.com",
    DisplayName = "John Doe"
};

Console.WriteLine(user.Email);  // Readable
// user.Email = "newemail@example.com";  // ERROR - cannot set after initialization
```

### Required Properties (C# 11.0+)

```csharp
public class Employee
{
    // Must be set during initialization
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string EmployeeId { get; set; }

    // Optional property
    public string Department { get; set; } = "Unassigned";
    public decimal Salary { get; set; }
}

// Usage
var employee = new Employee
{
    FirstName = "Jane",
    LastName = "Smith",
    EmployeeId = "EMP001",
    Department = "Engineering"
};

// Compilation error if any required property is missing:
// var incomplete = new Employee { FirstName = "John" }; // ERROR
```

### Calculated Properties

```csharp
public class Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }

    // Calculated property - no backing field
    public double Area
    {
        get { return Width * Height; }
    }

    // Expression-bodied property (C# 6.0+)
    public double Perimeter => 2 * (Width + Height);

    // Readonly calculated property
    public bool IsSquare => Width == Height;
}

// Usage
var rect = new Rectangle { Width = 5, Height = 10 };
Console.WriteLine(rect.Area);       // 50 - calculated on access
Console.WriteLine(rect.Perimeter);  // 30 - calculated on access
```

### Indexers

```csharp
public class StudentGrades
{
    private Dictionary<string, double> _grades = new();

    // Indexer property
    public double this[string subject]
    {
        get
        {
            if (_grades.TryGetValue(subject, out var grade))
                return grade;
            throw new KeyNotFoundException($"No grade found for {subject}");
        }
        set
        {
            if (value < 0 || value > 100)
                throw new ArgumentException("Grade must be between 0 and 100");
            _grades[subject] = value;
        }
    }

    // Indexer with integer index
    public string this[int index]
    {
        get
        {
            var keys = _grades.Keys.ToList();
            if (index >= 0 && index < keys.Count)
                return keys[index];
            throw new IndexOutOfRangeException();
        }
    }
}

// Usage
var grades = new StudentGrades();
grades["Math"] = 95;
grades["English"] = 87;

Console.WriteLine(grades["Math"]);           // 95
Console.WriteLine(grades[0]);                // "Math"
// grades["Physics"] = 110;                  // Throws exception
```

### Property Initialization Patterns

```csharp
public class Configuration
{
    // Basic auto-property
    public string AppName { get; set; }

    // Auto-property with initialization
    public string Version { get; set; } = "1.0.0";

    // Init-only with default
    public string Environment { get; init; } = "Development";

    // Init-only required
    public required string ApiKey { get; init; }

    // Calculated property
    public string DisplayName => $"{AppName} v{Version}";
}

// Various initialization patterns
var config = new Configuration
{
    AppName = "MyApp",
    ApiKey = "secret-key-123"
};

// Using Primary Constructor (C# 12.0+)
public class ConfigAlt(string apiKey, string appName = "DefaultApp")
{
    public string ApiKey { get; } = apiKey;
    public string AppName { get; } = appName;
}
```

### Null-Coalescing and Null-Checking in Properties

```csharp
public class NotificationService
{
    private string _emailTemplate;

    // Property with null-coalescing
    public string EmailTemplate
    {
        get => _emailTemplate ?? "Default Template";
        set => _emailTemplate = value;
    }

    // Auto-property with null-coalescing initializer
    public string DefaultLanguage { get; set; } = "en-US";

    // Nullable reference type with property (C# 8.0+)
    public string? OptionalField { get; set; }

    // Non-nullable property
    public string RequiredField { get; set; } = string.Empty;
}
```

## Best Practices

### Prefer Auto-Properties for Simple Cases
For straightforward read/write patterns with no additional logic, use auto-properties. They reduce boilerplate and clearly communicate intent.

```csharp
// Good
public class Book
{
    public string Title { get; set; }
    public string Author { get; set; }
    public int PageCount { get; set; }
}

// Avoid - unnecessary verbosity for simple properties
public class Book
{
    private string _title;
    public string Title
    {
        get { return _title; }
        set { _title = value; }
    }
}
```

### Use Init-Only Properties for Immutability
When you need to create objects that shouldn't change after initialization, use `init` accessors instead of traditional setters.

```csharp
// Good - immutable after creation
public class Order
{
    public required string OrderId { get; init; }
    public required DateTime OrderDate { get; init; }
    public decimal Total { get; init; }
}

// Avoid - allows mutable state
public class Order
{
    public string OrderId { get; set; }
    public DateTime OrderDate { get; set; }
}
```

### Validate in Setters (or Factory Methods)
When complex validation is needed, validate in the setter or use factory methods. For complex creation, consider using the Builder pattern.

```csharp
// Good - validation in setter
public class Temperature
{
    private double _celsius;
    public double Celsius
    {
        get { return _celsius; }
        set
        {
            if (double.IsNaN(value))
                throw new ArgumentException("Temperature cannot be NaN");
            _celsius = value;
        }
    }
}

// Alternative - factory method for complex creation
public class User
{
    public string Email { get; init; }
    public string PasswordHash { get; init; }

    public static User Create(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email required");
        if (password.Length < 8)
            throw new ArgumentException("Password too short");

        return new User
        {
            Email = email,
            PasswordHash = HashPassword(password)
        };
    }

    private static string HashPassword(string password) => /* ... */;
}
```

### Use Asymmetric Access Modifiers Effectively
Expose only the access level needed externally.

```csharp
// Good - precise access control
public class Document
{
    public string Title { get; set; }
    public string Content { get; private set; }  // Write internally only
    internal string InternalNotes { get; set; }  // Internal use only
    public string Id { get; }                     // Read-only after construction

    public void UpdateContent(string newContent) => Content = newContent;
}
```

### Make Calculated Properties Efficient
For expensive calculations, consider caching or lazy evaluation.

```csharp
// Good - lazy evaluation with caching
public class Dataset
{
    private double? _cachedAverage;

    public IList<double> Values { get; init; }

    public double Average
    {
        get
        {
            _cachedAverage ??= Values.Count > 0 ? Values.Average() : 0;
            return _cachedAverage.Value;
        }
    }

    // Clear cache if values change
    public void AddValue(double value)
    {
        Values.Add(value);
        _cachedAverage = null;
    }
}

// Avoid - recalculating expensive operation repeatedly
public class BadDataset
{
    public IList<double> Values { get; init; }

    // Called every time - expensive!
    public double Average => Values.Count > 0 ? Values.Average() : 0;
}
```

### Use Expression-Bodied Properties Appropriately
Expression-bodied properties are excellent for read-only calculated properties and simple getters.

```csharp
public class Point
{
    public double X { get; set; }
    public double Y { get; set; }

    // Good - simple expression
    public double Distance => Math.Sqrt(X * X + Y * Y);

    // Good - simple transformation
    public bool IsOrigin => X == 0 && Y == 0;

    // Avoid - complex logic in expression property
    // public double ComplexValue => /* complex multi-statement logic */;
}
```

### Consider Records for Data-Centric Types
For types primarily used to hold data, records provide a cleaner syntax with immutability by default.

```csharp
// Good - record provides init properties automatically
public record PersonRecord(string FirstName, string LastName, int Age);

// Equivalent traditional class - more verbose
public class PersonClass
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required int Age { get; init; }
}
```

## Common Pitfalls

### Over-Complicating Auto-Properties
Avoid trying to add logic to auto-properties; convert to traditional properties instead.

```csharp
// Bad - auto-property trying to do validation (won't compile)
// public int Age { get; set { if (value > 0) _age = value; } }

// Good - use traditional property for validation
private int _age;
public int Age
{
    get { return _age; }
    set { _age = value > 0 ? value : throw new ArgumentException("Age must be positive"); }
}
```

### Storing Mutable Objects in Properties
Be careful when properties contain mutable reference types; consider defensive copying.

```csharp
// Problematic - external code can modify the list
public class Team
{
    public List<string> Members { get; set; } = new();
}

var team = new Team();
team.Members.Add("Alice");
var members = team.Members;
members.Add("Bob");  // This modifies the original!

// Better - return read-only collection
public class TeamBetter
{
    private List<string> _members = new();
    public IReadOnlyList<string> Members => _members.AsReadOnly();

    public void AddMember(string name) => _members.Add(name);
}
```

### Forgetting Property Initialization
Uninitialized auto-properties without setters cause compilation errors.

```csharp
// Bad - property has no setter and no initializer
public class Config
{
    // public string ApiKey { get; }  // ERROR - never set
}

// Good - provide initialization
public class Config
{
    public string ApiKey { get; } = "default-key";
    // or
    public string ApiKey { get; init; }
    // or
    public Config(string apiKey) => ApiKey = apiKey;
}
```

### Side Effects in Getters
Avoid performing expensive operations or side effects in getters; they should be simple and predictable.

```csharp
// Bad - getter has side effects
public class Logger
{
    public string LastLog
    {
        get
        {
            var log = File.ReadAllText("log.txt");  // Expensive I/O!
            _logAccessCount++;                       // Side effect!
            return log;
        }
    }
}

// Good - method for expensive operation
public class Logger
{
    public string GetLastLog() => File.ReadAllText("log.txt");
    public void ResetLogAccessCount() => _logAccessCount = 0;
}
```

### Ignoring Nullable Reference Types
With C# 8.0+ nullable reference types enabled, properly annotate property nullability.

```csharp
// Bad - unclear if value can be null
public class User
{
    public string Name { get; set; }  // Can be null?
}

// Good - explicit nullability
public class User
{
    public string Name { get; set; }      // Cannot be null
    public string? OptionalField { get; set; }  // Can be null
}
```

### Public Mutable Fields vs Properties
Always prefer properties over public fields for better encapsulation and future flexibility.

```csharp
// Bad - direct field access, no control
public class Rectangle
{
    public double Width;
    public double Height;
}

// Good - properties allow future validation
public class Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }
}
```

## Performance Considerations

### Auto-Properties Have Minimal Overhead
Auto-properties compile to the same IL code as simple property methods, so there's no performance penalty. The compiler generates the backing field transparently.

```csharp
// These compile to identical IL:
public class A { public int Value { get; set; } }
public class B { private int _value; public int Value { get { return _value; } set { _value = value; } } }
```

### Expression-Bodied Properties Are Inlined
Expression-bodied properties (both getters and entire properties) are typically inlined by the JIT compiler, resulting in zero overhead compared to direct field access.

```csharp
public class Point
{
    public double X { get; set; }
    public double Y { get; set; }

    // Likely inlined - no performance penalty
    public double Distance => Math.Sqrt(X * X + Y * Y);
}
```

### Caching Expensive Calculations
Cache the results of expensive property calculations to avoid recomputation.

```csharp
public class DataAnalyzer
{
    private double? _cachedStandardDeviation;

    public double[] Data { get; init; }

    // First access computes, subsequent accesses return cached value
    public double StandardDeviation
    {
        get
        {
            _cachedStandardDeviation ??= CalculateStdDev();
            return _cachedStandardDeviation.Value;
        }
    }

    private double CalculateStdDev() { /* expensive calculation */ }
}
```

### Avoiding Repeated Calculations in Properties
Don't recalculate values inside properties if they're accessed frequently.

```csharp
// Inefficient - recalculates every access
public class BadPrice
{
    public decimal BasePrice { get; set; }
    public decimal Tax { get; set; }
    public decimal Total => BasePrice * (1 + Tax);  // Recalculates each time
}

// Better - if calculated very frequently, consider storing
public class BetterPrice
{
    private decimal _total;
    public decimal BasePrice { get; set; }
    public decimal Tax { get; set; }

    public decimal Total
    {
        get
        {
            var calculated = BasePrice * (1 + Tax);
            if (Math.Abs(_total - calculated) > 0.01m)
                _total = calculated;
            return _total;
        }
    }
}
```

### Struct Property Boxing
Be aware that accessing value-type properties can cause boxing. Use `ref` returns judiciously.

```csharp
public struct Vector3
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }

    // Ref return avoids boxing in performance-critical code (C# 7.0+)
    public ref float GetComponent(int index) => index switch
    {
        0 => ref X,
        1 => ref Y,
        2 => ref Z,
        _ => throw new IndexOutOfRangeException()
    };
}
```

## Real-world Scenarios

### Data Transfer Objects (DTOs)
Properties are essential for DTOs that transfer data between layers.

```csharp
public record UserDto(
    int Id,
    string Email,
    string DisplayName,
    DateTime CreatedAt
);

// Or with traditional class
public class OrderDto
{
    public int OrderId { get; init; }
    public string CustomerId { get; init; }
    public DateTime OrderDate { get; init; }
    public List<OrderItemDto> Items { get; init; } = new();
    public decimal Total { get; init; }
}
```

### Model-View-ViewModel (MVVM) Pattern
Properties are crucial in MVVM for binding between views and view models.

```csharp
public class UserViewModel : INotifyPropertyChanged
{
    private string _name;

    public string Name
    {
        get { return _name; }
        set
        {
            if (_name != value)
            {
                _name = value;
                OnPropertyChanged();
            }
        }
    }

    public event PropertyChangedEventHandler PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string name = "") =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
```

### Entity Framework Core Models
Properties define entity structure and relationships in EF Core.

```csharp
public class Blog
{
    public int BlogId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<Post> Posts { get; } = new List<Post>();
}

public class Post
{
    public int PostId { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }

    // Foreign key property
    public int BlogId { get; set; }
    public Blog Blog { get; set; } = null!;
}
```

### Settings and Configuration Objects
Properties provide clean API for configuration classes.

```csharp
public class AppSettings
{
    // Database configuration
    public string ConnectionString { get; init; } = "";
    public int CommandTimeout { get; init; } = 30;

    // API configuration
    public string ApiBaseUrl { get; init; } = "";
    public string ApiKey { get; init; } = "";

    // Logging configuration
    public string LogLevel { get; init; } = "Information";
    public bool EnableDetailedErrors { get; init; }

    // Computed property
    public bool IsDevelopment => LogLevel == "Debug";
}
```

### Validation Objects with Rich Behavior
Properties with validation logic enforce business rules.

```csharp
public class Email
{
    private string _address;

    public string Address
    {
        get { return _address; }
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Email cannot be empty");
            if (!IsValidEmail(value))
                throw new ArgumentException("Invalid email format");
            _address = value;
        }
    }

    public Email(string address) => Address = address;

    private static bool IsValidEmail(string email) =>
        Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$");

    public override string ToString() => _address;
}
```

### Lazy-Loaded Properties
Properties that defer expensive operations until needed.

```csharp
public class UserProfile
{
    private Lazy<List<Post>> _postsLoader;

    public int UserId { get; set; }
    public string Username { get; set; }

    // Only loads posts when accessed
    public List<Post> Posts => _postsLoader.Value;

    public UserProfile(int userId, Func<List<Post>> loadPosts)
    {
        UserId = userId;
        _postsLoader = new Lazy<List<Post>>(loadPosts);
    }
}
```

## Interview Points

### Q1: What's the difference between fields and properties?
**Answer**: Fields are raw data storage; properties provide controlled access through getters/setters. Properties enable validation, side effects, and future logic changes without breaking the API. While fields are direct memory access, properties allow encapsulation and flexibility.

### Q2: Explain auto-properties and when to use them.
**Answer**: Auto-properties automatically generate backing fields, reducing boilerplate. Use them for simple get/set patterns. Convert to traditional properties when you need validation, side effects, or dependent calculations. They're the default choice for most properties today.

### Q3: What are init-only properties and what problems do they solve?
**Answer**: Init-only properties (C# 9.0+) can only be set during object initialization, not modified afterward. They enable immutability, which improves thread-safety, predictability, and makes concurrent code easier to reason about. Perfect for value objects and DTOs.

### Q4: How do you validate property values?
**Answer**: Implement validation logic in traditional property setters. For complex validation, use factory methods or the Builder pattern. In C# 11.0+, use `required` keyword to enforce initialization of critical properties at construction time.

### Q5: What are indexers?
**Answer**: Indexers are properties with parameters (typically array indices), allowing dictionary-like or array-like access using bracket notation. They're useful for collection types and provide a natural interface for accessing elements by key or position.

### Q6: Explain expression-bodied properties.
**Answer**: Introduced in C# 6.0, they allow concise syntax for read-only properties or simple calculations using `=>`. They compile to the same IL as traditional properties and are often inlined by the JIT compiler, resulting in zero performance penalty. Use them for simple, read-only calculated properties.

### Q7: How would you handle a property that's expensive to calculate?
**Answer**: Implement caching using the null-coalescing operator or nullable fields. Calculate the value once and store it, invalidating the cache when dependencies change. Use `Lazy<T>` for thread-safe lazy initialization.

### Q8: What's the relationship between records and properties?
**Answer**: Records automatically generate init properties from constructor parameters, reducing boilerplate for immutable data types. They're syntactic sugar over traditional classes with auto-generated `Equals`, `GetHashCode`, and `ToString` methods, ideal for data-centric types.

### Q9: Can properties be abstract?
**Answer**: Yes, abstract properties define a contract that derived classes must implement. The derived class can use auto-properties or traditional properties to fulfill the abstract property contract, allowing flexibility in implementation details.

### Q10: How do nullable reference types affect property design?
**Answer**: With C# 8.0+ nullable reference types enabled, you must explicitly mark properties that can be null with `?`. This clarifies intent, helps prevent null reference exceptions, and makes contracts clearer. A non-nullable property guarantees a non-null value.

## Further Reading

### Microsoft Official Documentation
- [Properties (C# Programming Guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties)
- [Auto-Implemented Properties](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/auto-implemented-properties)
- [Init-Only Properties](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-9.0/init)
- [Using Properties](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/using-properties)
- [C# Language Features by Version](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-version-history)

### Related Topics
- **Classes and Structs**: Understanding the broader context of properties in object-oriented design
- **Encapsulation**: Core principle behind property-based design
- **SOLID Principles**: How properties relate to the Single Responsibility and Open/Closed principles
- **Design Patterns**: Builder pattern for complex object creation, MVVM pattern for UI binding
- **Entity Framework Core**: Using properties to model database entities
- **Reflection**: How to inspect properties at runtime

### Key Concepts to Explore Further
- **Backing fields**: Understand how auto-properties implement backing fields automatically
- **Access modifiers**: Asymmetric access control (different levels for get/set)
- **INotifyPropertyChanged**: Pattern for UI binding with property change notifications
- **Property validation**: Best practices for input validation in setters
- **Lazy initialization**: Using `Lazy<T>` for performance optimization
- **Records and positional properties**: Modern data-centric programming patterns
