---
title: "C# Records: Immutable Data Types"
description: A comprehensive guide to C# records, immutable data types introduced in C# 9 that simplify creation of immutable classes with value-based equality, automatic property initialization, and pattern matching support.
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - records
  - immutable-data
  - value-equality
  - pattern-matching
  - c#9
  - data-structures
status: imported
origin: old/src/content/docs/csharp/records.en.md
divergence: 0.256
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: CSharp
  subcategory: ""
  order: 5
  lastUpdated: 2026-01-07
---


## Concept Explanation

C# records are a reference type that provides built-in functionality for immutability and value-based equality. Introduced in C# 9.0, records simplify the creation of immutable data types that are commonly used for data transfer objects (DTOs), domain entities, and value holders.

### Historical Context

Before records, creating immutable types in C# required significant boilerplate:
- Manual implementation of `GetHashCode()` and `Equals()`
- Property initialization patterns with backing fields
- Clone methods for creating modified copies
- Complex constructor syntax

Records eliminate this boilerplate by providing compiler-generated implementations based on the declared properties.

### Problems Solved

1. **Immutability**: Automatically enforces immutable patterns without manual readonly fields
2. **Value Equality**: Default equality based on property values rather than reference identity
3. **Boilerplate Reduction**: Compiler generates common methods automatically
4. **Deconstruction**: Built-in support for extracting property values
5. **Pattern Matching**: Enhanced support for matching records and their properties

---

## Core Principles

### Reference Type with Value Semantics

Records are reference types (like classes) but implement value-based equality and `GetHashCode()`:

```csharp
// Two records with same property values are considered equal
var person1 = new Person("Alice", 30);
var person2 = new Person("Alice", 30);

Console.WriteLine(person1 == person2);  // true (value equality)
Console.WriteLine(ReferenceEquals(person1, person2));  // false (different objects)
```

### Immutability by Convention

Records encourage immutability through init-only properties:

```csharp
public record Point(double X, double Y);  // Properties are init-only by default

var p1 = new Point(1, 2);
// p1.X = 5;  // Error: Property or indexer 'Point.X' cannot be assigned to
```

### Non-Destructive Mutation

The `with` expression creates a new record with modified properties:

```csharp
var original = new Point(1, 2);
var modified = original with { X = 5 };  // Creates new instance
Console.WriteLine(original.X);  // 1 (unchanged)
Console.WriteLine(modified.X);  // 5
```

### Structural Equality

Equality is based on property values, not object identity:

```csharp
public record Rectangle(double Width, double Height);

var r1 = new Rectangle(5, 10);
var r2 = new Rectangle(5, 10);
var r3 = new Rectangle(5, 15);

Console.WriteLine(r1.Equals(r2));  // true
Console.WriteLine(r1 == r2);       // true
Console.WriteLine(r1.Equals(r3));  // false
```

### Type Preservation in with Expressions

Derived records maintain their type through `with` expressions:

```csharp
public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

var dog = new Dog("Rex", "Labrador");
var modified = dog with { Name = "Max" };  // Still Dog type

Console.WriteLine(modified.GetType().Name);  // "Dog"
```

---

## Key Points

### Record Declarations

**Positional records** (most common):
```csharp
public record Person(string FirstName, string LastName, int Age);
```

**Nominal records** with explicit properties:
```csharp
public record Person
{
    public string FirstName { get; init; }
    public string LastName { get; init; }
    public int Age { get; init; }
}
```

**Record struct** (value type):
```csharp
public readonly record struct Point(double X, double Y);
```

### Property Generation

Positional records automatically generate:
- Init-only properties matching constructor parameters
- Constructor accepting all properties
- `ToString()` with property values
- `GetHashCode()` and `Equals()` implementations
- `Deconstruct()` for pattern matching

### Inheritance

Records support inheritance with proper equality semantics:

```csharp
public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);
public record Cat(string Name, string Color) : Animal(Name);

// Dog derived from Animal
var dog = new Dog("Rex", "Labrador");
Console.WriteLine(dog.Name);  // "Rex"
```

### Mutability in Records

Records can have mutable properties if explicitly declared:

```csharp
public record Person(string Name)
{
    public int Age { get; set; }  // Mutable property
}

var person = new Person("Alice");
person.Age = 30;  // Allowed
```

### Deconstruction

Records automatically support deconstruction:

```csharp
public record Point(double X, double Y);

var point = new Point(3, 4);
var (x, y) = point;  // Deconstruction
Console.WriteLine($"X: {x}, Y: {y}");  // "X: 3, Y: 4"
```

### Sealed Records

Records can be sealed to prevent further derivation:

```csharp
public sealed record FinalPerson(string Name, int Age);
// Cannot derive from FinalPerson
```

---

## Code Examples

### Example 1: Basic Record Definition and Usage

```csharp
// Define a simple record for representing an employee
public record Employee(string Name, string Email, decimal Salary);

// Create instances
var emp1 = new Employee("Alice", "alice@example.com", 75000);
var emp2 = new Employee("Alice", "alice@example.com", 75000);

// Value-based equality
Console.WriteLine(emp1 == emp2);  // true

// Non-destructive mutation with with expression
var emp3 = emp1 with { Salary = 85000 };
Console.WriteLine(emp1.Salary);  // 75000 (original unchanged)
Console.WriteLine(emp3.Salary);  // 85000

// Deconstruction
var (name, email, salary) = emp1;
Console.WriteLine($"{name} works at {email}");  // "Alice works at alice@example.com"

// Automatic ToString
Console.WriteLine(emp1);  // Employee { Name = Alice, Email = alice@example.com, Salary = 75000 }
```

### Example 2: Record Inheritance

```csharp
// Base record
public record Shape(string Color, double Area);

// Derived records
public record Circle(string Color, double Area, double Radius) : Shape(Color, Area);
public record Rectangle(string Color, double Area, double Width, double Height) : Shape(Color, Area);

var circle = new Circle("Red", 50.27, 4);
var rectangle = new Rectangle("Blue", 50, 10, 5);

Console.WriteLine(circle);
// Circle { Color = Red, Area = 50.27, Radius = 4 }

Console.WriteLine(rectangle);
// Rectangle { Color = Blue, Area = 50, Width = 10, Height = 5 }

// Polymorphic behavior
Shape[] shapes = { circle, rectangle };
foreach (var shape in shapes)
{
    Console.WriteLine($"Area: {shape.Area}");
}
```

### Example 3: Pattern Matching with Records

```csharp
public record Point(int X, int Y);
public record Line(Point Start, Point End);

public string AnalyzePoint(Point p) => p switch
{
    (0, 0) => "Origin",
    (0, _) => "On Y-axis",
    (_, 0) => "On X-axis",
    (> 0, > 0) => "First quadrant",
    _ => "Other"
};

public string AnalyzeLine(Line line) => line switch
{
    Line { Start: (0, 0), End: var (x, y) } when x == y
        => "Diagonal from origin",
    Line { Start.X: 0, End.X: 0 }
        => "Vertical line",
    Line { Start.Y: 0, End.Y: 0 }
        => "Horizontal line",
    _ => "Regular line"
};

var point = new Point(1, 1);
Console.WriteLine(AnalyzePoint(point));  // "First quadrant"

var line = new Line(new Point(0, 0), new Point(5, 5));
Console.WriteLine(AnalyzeLine(line));  // "Diagonal from origin"
```

### Example 4: Nominal Record with Custom Logic

```csharp
public record Order
{
    public int OrderId { get; init; }
    public string CustomerName { get; init; }
    public List<OrderItem> Items { get; init; } = new();
    public decimal Total { get; init; }

    // Custom validation in constructor
    public Order(int orderId, string customerName, List<OrderItem> items)
    {
        if (orderId <= 0)
            throw new ArgumentException("Order ID must be positive");
        if (string.IsNullOrWhiteSpace(customerName))
            throw new ArgumentException("Customer name required");

        OrderId = orderId;
        CustomerName = customerName;
        Items = items ?? new();
        Total = items?.Sum(x => x.Price * x.Quantity) ?? 0;
    }
}

public record OrderItem(int ProductId, string ProductName, decimal Price, int Quantity);

var order = new Order(
    101,
    "Alice",
    new() { new OrderItem(1, "Widget", 9.99m, 2) }
);

Console.WriteLine($"Order Total: ${order.Total}");  // Order Total: $19.98
```

### Example 5: Record Struct vs Record Class

```csharp
// Record class (reference type) - default
public record PersonClass(string Name, int Age);

// Record struct (value type) - explicitly declared
public readonly record struct PersonStruct(string Name, int Age);

var person1 = new PersonClass("Alice", 30);
var person2 = person1 with { Age = 31 };
Console.WriteLine(ReferenceEquals(person1, person2));  // false (different objects)

var struct1 = new PersonStruct("Bob", 25);
var struct2 = struct1 with { Age = 26 };
Console.WriteLine(struct1.Equals(struct2));  // false (different values)
Console.WriteLine(struct1);  // PersonStruct { Name = Bob, Age = 25 }
Console.WriteLine(struct2);  // PersonStruct { Name = Bob, Age = 26 }
```

### Example 6: Data Transfer Object Pattern

```csharp
// API Response records
public record ApiResponse<T>(int StatusCode, string Message, T Data);
public record UserDto(int Id, string Username, string Email);
public record ErrorDto(string Code, string Description);

// Usage in API layer
public async Task<ApiResponse<UserDto>> GetUserAsync(int id)
{
    try
    {
        // Simulate fetching user
        var user = new UserDto(id, "alice", "alice@example.com");
        return new ApiResponse<UserDto>(200, "Success", user);
    }
    catch (Exception ex)
    {
        return new ApiResponse<UserDto>(500, "Error", null);
    }
}

var response = await GetUserAsync(1);
Console.WriteLine($"Status: {response.StatusCode}");  // Status: 200
Console.WriteLine($"User: {response.Data}");  // User: UserDto { Id = 1, Username = alice, Email = alice@example.com }
```

---

## Best Practices

### Use Positional Records for Simple Data

```csharp
// Good: Clear and concise
public record Address(string Street, string City, string ZipCode);

// Less ideal: Overly verbose for simple structure
public record Address
{
    public string Street { get; init; }
    public string City { get; init; }
    public string ZipCode { get; init; }
}
```

### Preserve Immutability

```csharp
// Bad: Mutable collection violates immutability intent
public record Order(int Id, string Customer, List<OrderItem> Items);

// Better: Use immutable collections
public record Order(int Id, string Customer, ImmutableList<OrderItem> Items);

// Or use init property with collection initializer
public record Order
{
    public int Id { get; init; }
    public string Customer { get; init; }
    public ImmutableList<OrderItem> Items { get; init; } = ImmutableList<OrderItem>.Empty;
}
```

### Use with Expression for Updates

```csharp
// Good: Non-destructive mutation
var original = new Person("Alice", "Smith", 30);
var updated = original with { LastName = "Jones" };

// Avoid: Modifying mutable copies
var copy = original;
copy.LastName = "Jones";  // Won't work - properties are init-only
```

### Leverage Pattern Matching

```csharp
// Good: Expressive pattern matching
public decimal CalculateDiscount(Order order) => order switch
{
    { Items.Count: > 10 } => 0.15m,  // 15% for large orders
    { Total: > 1000 } => 0.10m,     // 10% for expensive orders
    _ => 0.05m                      // 5% default
};

// Less clear: Multiple if statements
public decimal CalculateDiscount(Order order)
{
    if (order.Items.Count > 10) return 0.15m;
    if (order.Total > 1000) return 0.10m;
    return 0.05m;
}
```

### Use Nominal Records for Complex Logic

```csharp
// Good: Nominal record with validation and custom methods
public record Product
{
    public int Id { get; init; }
    public string Name { get; init; }
    public decimal Price { get; init; }

    public Product(int id, string name, decimal price)
    {
        if (price < 0) throw new ArgumentException("Price cannot be negative");
        Id = id;
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Price = price;
    }

    public decimal CalculateTax(decimal taxRate) => Price * taxRate;
}
```

### Document Inheritance Hierarchy

```csharp
// Good: Clear inheritance with documentation
/// <summary>
/// Base record for all payment methods
/// </summary>
public abstract record PaymentMethod(string Provider);

/// <summary>
/// Credit card payment method
/// </summary>
public record CreditCard(string Provider, string CardNumber, string Cvv)
    : PaymentMethod(Provider);

/// <summary>
/// Digital wallet payment method
/// </summary>
public record DigitalWallet(string Provider, string WalletId)
    : PaymentMethod(Provider);
```

---

## Common Pitfalls

### Forgetting that Records are Reference Types

```csharp
// Wrong: Treating records like structs
public record Point(double X, double Y);

Point p1 = new Point(1, 2);
Point p2 = p1;
p2 = p2 with { X = 5 };

Console.WriteLine(p1.X);  // 1 (not affected - with creates new instance)
Console.WriteLine(p2.X);  // 5

// Records use reference equality at the CLR level
// but override == for value equality
```

### Mutable Collections Break Immutability

```csharp
// Bad: Mutable list can be modified externally
public record Team(string Name, List<string> Members);

var team = new Team("A-Team", new() { "Alice", "Bob" });
team.Members.Add("Charlie");  // Modifies the record's state!

// Better: Use immutable collections
public record Team(string Name, ImmutableList<string> Members);
```

### Not Using init-only Properties for Immutability

```csharp
// Bad: Properties are settable
public record Person
{
    public string Name { get; set; }  // Can be modified!
    public int Age { get; set; }
}

var person = new Person { Name = "Alice", Age = 30 };
person.Name = "Bob";  // Mutates the record

// Good: Use init-only
public record Person
{
    public string Name { get; init; }  // Can only be set during initialization
    public int Age { get; init; }
}

var person = new Person { Name = "Alice", Age = 30 };
// person.Name = "Bob";  // Error: Property or indexer cannot be assigned
```

### Assuming Hash Codes are Unique

```csharp
// Wrong assumption
public record Value(int Number);

var v1 = new Value(1);
var v2 = new Value(1);

// While v1 == v2, hash code might not be globally unique
// Different records can have same hash code (hash collision)
Console.WriteLine(v1.GetHashCode() == v2.GetHashCode());  // true (same values)

// This is fine for most uses, but can be issue with large collections
HashSet<Value> set = new() { v1 };
set.Add(v2);  // Not added - already contains equal value
Console.WriteLine(set.Count);  // 1
```

### Over-relying on with Expression

```csharp
// Inefficient: Multiple with operations
var person = new Person("Alice", 30);
var updated = person
    with { FirstName = "Alicia" }
    with { Age = 31 }
    with { Email = "alicia@example.com" };

// Better: Single with expression
var updated = person with
{
    FirstName = "Alicia",
    Age = 31,
    Email = "alicia@example.com"
};
```

### Forgetting Property Order in Positional Records

```csharp
// Bad: Easy to confuse property order
public record Location(double Latitude, double Longitude, string Name);

var loc = new Location(40.7128, -74.0060, "NYC");  // Correct
var loc2 = new Location(-74.0060, 40.7128, "NYC");  // Wrong coordinates, no compile error!

// Better: Use named properties or nominal record
public record Location
{
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public string Name { get; init; }
}

var loc = new Location { Latitude = 40.7128, Longitude = -74.0060, Name = "NYC" };
```

---

## Performance Considerations

### Memory Allocation

Records are reference types, allocating heap memory like classes:

```csharp
// Each new instance allocates heap memory
public record Point(double X, double Y);

var point1 = new Point(1, 2);     // Heap allocation
var point2 = new Point(1, 2);     // Another heap allocation
var point3 = point1 with { X = 5 };  // Another heap allocation

// For simple value types, record struct might be better
public readonly record struct PointStruct(double X, double Y);

var ps1 = new PointStruct(1, 2);  // Stack allocation (typically)
```

### Equality Performance

```csharp
// Equality check iterates through all properties
public record Person(string FirstName, string LastName, string Email, string Phone, int Age);

var p1 = new Person("Alice", "Smith", "alice@example.com", "555-1234", 30);
var p2 = new Person("Alice", "Smith", "alice@example.com", "555-1234", 30);

// Comparison checks FirstName, LastName, Email, Phone, Age in order
Console.WriteLine(p1 == p2);  // true (all properties compared)

// For records with many properties, consider caching hash codes in hot paths
```

### Hash Code Stability

```csharp
public record Item(string Id, string Name);

// Hash code is based on property values
var item1 = new Item("123", "Widget");
var hash1 = item1.GetHashCode();

// Changing reference won't change hash
var item2 = item1 with { Name = "Gadget" };
var hash2 = item2.GetHashCode();

// hash1 != hash2 because Name changed
// Suitable for use in dictionary/hash set immediately after creation

Dictionary<Item, int> inventory = new();
inventory[item1] = 10;  // Uses hash and equality

// If you later modify (via with), original key becomes unreachable
inventory[item2] = 5;   // Different key now
```

### Inheritance Chain Performance

```csharp
// Deep inheritance affects equality checking
public record Animal(string Name);
public record Mammal(string Name, int Legs) : Animal(Name);
public record Dog(string Name, int Legs, string Breed) : Mammal(Name, Legs);

// Equality check traverses entire inheritance chain
var dog1 = new Dog("Rex", 4, "Labrador");
var dog2 = new Dog("Rex", 4, "Labrador");

// Checks: Name, Legs, Breed (and respects inheritance)
Console.WriteLine(dog1 == dog2);  // true
```

### ToString() Optimization

```csharp
// Auto-generated ToString() can be expensive for complex objects
public record ComplexData(
    string Field1, string Field2, string Field3,
    string Field4, string Field5, string Field6);

var data = new ComplexData("a", "b", "c", "d", "e", "f");

// ToString() builds string from all properties
string description = data.ToString();

// In performance-critical code, consider caching or selective formatting
// Not recommended: override ToString() in record unless necessary
public record OptimizedData(string Field1, string Field2)
{
    public override string ToString() => $"{Field1}:{Field2}";  // Lighter weight
}
```

---

## Real-world Scenarios

### Scenario 1: API Request/Response DTOs

```csharp
// Domain model uses records for data transfer
public record CreateUserRequest(string Username, string Email, string Password);
public record UserResponse(int Id, string Username, string Email, DateTime CreatedAt);
public record ApiError(string Code, string Message, Dictionary<string, string[]> Errors);

// In controller
[HttpPost("/users")]
public async Task<ActionResult<UserResponse>> CreateUser([FromBody] CreateUserRequest request)
{
    try
    {
        var user = await _userService.CreateAsync(request);
        return Ok(new UserResponse(user.Id, user.Username, user.Email, user.CreatedAt));
    }
    catch (ValidationException ex)
    {
        return BadRequest(new ApiError("VALIDATION_ERROR", "Validation failed", ex.Errors));
    }
}
```

### Scenario 2: Domain Events

```csharp
// Event sourcing pattern with records
public abstract record DomainEvent(Guid AggregateId, DateTime OccurredAt);

public record AccountCreated(
    Guid AggregateId,
    DateTime OccurredAt,
    string AccountHolder,
    decimal InitialBalance
) : DomainEvent(AggregateId, OccurredAt);

public record MoneyDeposited(
    Guid AggregateId,
    DateTime OccurredAt,
    decimal Amount,
    string Reference
) : DomainEvent(AggregateId, OccurredAt);

public record MoneyWithdrawn(
    Guid AggregateId,
    DateTime OccurredAt,
    decimal Amount,
    string Reference
) : DomainEvent(AggregateId, OccurredAt);

// Event handler
public class BankAccountAggregateRoot
{
    public List<DomainEvent> Events { get; } = new();

    public void ApplyEvent(DomainEvent @event)
    {
        switch (@event)
        {
            case AccountCreated ac:
                Balance = ac.InitialBalance;
                break;
            case MoneyDeposited md:
                Balance += md.Amount;
                break;
            case MoneyWithdrawn mw:
                Balance -= mw.Amount;
                break;
        }
    }
}
```

### Scenario 3: Configuration Objects

```csharp
// Configuration records for application settings
public record DatabaseConfig(string ConnectionString, int CommandTimeout, int MaxPoolSize);
public record AuthConfig(string JwtSecret, TimeSpan TokenExpiry, bool RequireTwoFactor);
public record AppConfig(DatabaseConfig Database, AuthConfig Auth, string AppName, string Version);

// Loading configuration
public class ConfigurationLoader
{
    public AppConfig Load(IConfiguration config)
    {
        var dbConfig = new DatabaseConfig(
            config["Database:ConnectionString"],
            int.Parse(config["Database:CommandTimeout"]),
            int.Parse(config["Database:MaxPoolSize"])
        );

        var authConfig = new AuthConfig(
            config["Auth:JwtSecret"],
            TimeSpan.FromMinutes(int.Parse(config["Auth:TokenExpiryMinutes"])),
            bool.Parse(config["Auth:RequireTwoFactor"])
        );

        return new AppConfig(dbConfig, authConfig, config["AppName"], config["Version"]);
    }
}
```

### Scenario 4: Immutable State Machines

```csharp
// Order processing state machine with records
public abstract record OrderState(int OrderId, DateTime CreatedAt);
public record PendingOrder(int OrderId, DateTime CreatedAt) : OrderState(OrderId, CreatedAt);
public record ProcessingOrder(int OrderId, DateTime CreatedAt, DateTime ProcessStarted) : OrderState(OrderId, CreatedAt);
public record ShippedOrder(int OrderId, DateTime CreatedAt, string TrackingNumber) : OrderState(OrderId, CreatedAt);
public record DeliveredOrder(int OrderId, DateTime CreatedAt, DateTime DeliveredAt) : OrderState(OrderId, CreatedAt);
public record CancelledOrder(int OrderId, DateTime CreatedAt, string Reason) : OrderState(OrderId, CreatedAt);

// State transition logic
public OrderState TransitionOrder(OrderState current) => current switch
{
    PendingOrder po
        => new ProcessingOrder(po.OrderId, po.CreatedAt, DateTime.UtcNow),
    ProcessingOrder pr
        => new ShippedOrder(pr.OrderId, pr.CreatedAt, GenerateTrackingNumber()),
    ShippedOrder so
        => new DeliveredOrder(so.OrderId, so.CreatedAt, DateTime.UtcNow),
    _ => current
};
```

### Scenario 5: Hierarchical Data Processing

```csharp
// Organization hierarchy using records
public record Department(int Id, string Name, int? ParentDepartmentId);
public record Employee(int Id, string Name, int DepartmentId, decimal Salary);
public record EmployeeInfo(Employee Employee, Department Department, Employee Manager);

// Process hierarchical data
public EmployeeInfo GetEmployeeInfo(int employeeId)
{
    var employee = _employees.First(e => e.Id == employeeId);
    var department = _departments.First(d => d.Id == employee.DepartmentId);
    var manager = _employees.First(e => e.Id == GetDepartmentManager(department.Id));

    return new EmployeeInfo(employee, department, manager);
}

// Pattern matching for processing
public void ProcessEmployeeByDepartment(EmployeeInfo info) => info switch
{
    { Department.Id: 1 } => ProcessSalesEmployee(info.Employee),
    { Department.Id: 2 } => ProcessEngineeringEmployee(info.Employee),
    { Department.Id: 3, Employee.Salary: > 100000 } => ProcessSeniorManagement(info),
    _ => ProcessStandardEmployee(info.Employee)
};
```

---

## Interview Points

### Q1: What are the key differences between records and classes?

**Expected Answer:**
- Records are reference types like classes, but provide value-based equality by default
- Records generate `Equals()`, `GetHashCode()`, and `ToString()` automatically
- Records use `with` expression for non-destructive mutation
- Records support positional syntax for concise declarations
- Records are immutable by default (init-only properties)
- Records support inheritance with proper equality semantics

### Q2: Explain the with expression and why it's useful

**Expected Answer:**
The `with` expression creates a new record with specified properties changed:
```csharp
var original = new Person("Alice", 30);
var modified = original with { Age = 31 };
```
It's useful because:
- Maintains immutability while allowing "updates"
- Creates new instance rather than modifying existing
- More readable than manual object construction
- Preserves other property values automatically
- Works with inheritance hierarchies

### Q3: How do records handle equality differently from classes?

**Expected Answer:**
- Classes use reference equality (ReferenceEquals)
- Records override `==` and `Equals()` to use value equality
- Two records with same property values are considered equal
- Records generate `GetHashCode()` based on property values
- Derived records include all properties (including inherited) in equality
- This makes records suitable for DTOs and value objects

### Q4: What are record structs and when would you use them?

**Expected Answer:**
Record structs are value types (like struct) with record features:
```csharp
public readonly record struct Point(double X, double Y);
```
Use them when:
- Creating small, frequently-used data holders
- Memory efficiency is critical
- Stack allocation is preferred over heap
- No need for reference semantics
- Data structure is simple and immutable

Avoid when:
- Need inheritance (record structs don't inherit from other structs)
- Frequent boxing/unboxing
- Large data structures

### Q5: How do records work with pattern matching?

**Expected Answer:**
Records enable powerful pattern matching:
```csharp
public string Analyze(Point p) => p switch
{
    (0, 0) => "Origin",
    (_, 0) => "On X-axis",
    var (x, y) when x > 0 && y > 0 => "Quadrant 1"
};

public string ProcessOrder(Order order) => order switch
{
    { Items.Count: > 10, Total: > 1000 } => "Premium order",
    { Status: OrderStatus.Shipped, TrackingNumber: not null } => "Shipped",
    _ => "Other"
};
```
Records work with:
- Positional patterns (deconstruction)
- Property patterns
- Guard clauses
- Type patterns (with inheritance)

### Q6: What are common mistakes when using records?

**Expected Answer:**
1. Using mutable collections (violates immutability intent)
2. Forgetting records are reference types
3. Assuming hash codes are unique
4. Not using init-only properties
5. Over-relying on `with` expressions instead of single call
6. Treating immutability as automatic (must avoid mutable references)
7. Forgetting property order in positional records

### Q7: How do records compare in performance to classes?

**Expected Answer:**
- Similar performance for allocation and access
- Slight overhead in generated equality methods
- Hash code generation iterates all properties
- `with` expression creates new instance (memory cost)
- Immutability enables compiler optimizations
- Record structs can be more efficient than classes for small data
- No performance advantage over carefully written immutable classes

---

## Further Reading

### Official Documentation
- [Microsoft C# Records](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/records)
- [Record Types - C# 9.0 Features](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#record-types)
- [Pattern Matching in C#](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching)

### Related Topics
- [Immutability in C#](https://learn.microsoft.com/en-us/dotnet/api/system.collections.immutable)
- [Value Equality vs Reference Equality](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/equality-comparisons)
- [init Accessor (C# 9)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/init)
- [Top-level statements (C# 9)](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#top-level-statements)

### Recommended Resources
- "C# Player's Guide" by RB Whitaker - Chapter on Records
- "C# 9.0 in a Nutshell" by Joseph Albahari - Record types section
- Microsoft Learn Module: "Describe different types in C#"
- GitHub: dotnet/roslyn - Record implementation details

### Related Language Features
- [Nullable Reference Types](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/nullable-reference-types)
- [Target-typed New Expression](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#target-typed-new-expressions)
- [Covariant Return Types (C# 9)](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#covariant-return-types)
- [Required Members (C# 11)](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-11#required-members)

### Community Articles
- "Records in C# 9" - Scott Hanselman blog
- "C# Records - Better than Classes?" - CodeOpinion
- "Pattern Matching with Records" - Nick Chapsas
- "Record Equality and GetHashCode" - Jon Skeet discussions

### Practice Exercises
1. Refactor existing immutable class to use records
2. Implement a state machine using record inheritance
3. Create DTOs for a REST API using positional records
4. Write pattern matching expressions for complex record hierarchies
5. Compare performance of records vs classes in benchmarks
