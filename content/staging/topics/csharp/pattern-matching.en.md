---
title: 模式匹配
description: C#模式匹配完全指南，switch表达式、类型模式与属性模式
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - 模式匹配
  - switch
  - 类型系统
status: imported
origin: old/src/content/docs/csharp/pattern-matching.en.md
divergence: 0.216
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 语言特性
  order: 4
  lastUpdated: 2026-01-07
---

Pattern matching is one of the most powerful language features in C#. It allows you to test the "shape" of data in a declarative way and extract data when a match succeeds. Since its introduction in C# 7.0, pattern matching has been significantly enhanced in every major version and has become a core tool for writing concise, type-safe code.

---

## Pattern Matching Overview

Pattern matching allows you to test expressions in the following constructs:

- **`is` expression**: Test whether an expression matches a pattern
- **`switch` statement**: Execute different code branches based on patterns
- **`switch` expression**: Return different values based on patterns

Pattern types supported by C# include:

| Pattern Type | Introduced In | Description |
|-------------|---------------|-------------|
| Declaration Pattern | C# 7.0 | Check type and declare variable |
| Type Pattern | C# 7.0 | Check runtime type |
| Constant Pattern | C# 7.0 | Test equality to a constant |
| Property Pattern | C# 8.0 | Match object properties |
| Positional Pattern | C# 8.0 | Deconstruct and match elements |
| Relational Pattern | C# 9.0 | Compare using relational operators |
| Logical Pattern | C# 9.0 | Combine patterns using and, or, not |
| List Pattern | C# 11 | Match elements in collections |

---

## Type Patterns

Type patterns are the most fundamental and commonly used patterns. They check the runtime type of an expression.

### Basic Type Checking

```csharp
// Traditional approach: check type first, then cast
object obj = "Hello, World!";
if (obj is string)
{
    string str = (string)obj;
    Console.WriteLine(str.ToUpper());
}

// Using declaration pattern: type checking and variable declaration in one
if (obj is string message)
{
    Console.WriteLine(message.ToUpper()); // HELLO, WORLD!
}
```

### Type Patterns and Null Checking

Type patterns automatically filter out `null` values:

```csharp
object? data = null;

// Type pattern does not match null
if (data is string text)
{
    // This won't execute because data is null
    Console.WriteLine(text);
}

// Explicit null check
if (data is null)
{
    Console.WriteLine("Data is empty");
}

// Check for non-null
if (data is not null)
{
    Console.WriteLine("Data is not empty");
}
```

### Polymorphic Type Matching

```csharp
public abstract class Shape { }
public class Circle : Shape
{
    public double Radius { get; init; }
}
public class Rectangle : Shape
{
    public double Width { get; init; }
    public double Height { get; init; }
}
public class Triangle : Shape
{
    public double Base { get; init; }
    public double Height { get; init; }
}

public static double CalculateArea(Shape shape)
{
    if (shape is Circle circle)
    {
        return Math.PI * circle.Radius * circle.Radius;
    }
    else if (shape is Rectangle rect)
    {
        return rect.Width * rect.Height;
    }
    else if (shape is Triangle tri)
    {
        return 0.5 * tri.Base * tri.Height;
    }

    throw new ArgumentException("Unknown shape type", nameof(shape));
}
```

### Type Patterns in Switch

```csharp
public static string DescribeObject(object obj) => obj switch
{
    int i => $"Integer: {i}",
    double d => $"Floating point: {d:F2}",
    string s => $"String: \"{s}\" (length: {s.Length})",
    bool b => $"Boolean: {b}",
    null => "Null value",
    _ => $"Other type: {obj.GetType().Name}"
};

// Usage examples
Console.WriteLine(DescribeObject(42));        // Integer: 42
Console.WriteLine(DescribeObject(3.14159));   // Floating point: 3.14
Console.WriteLine(DescribeObject("Test"));    // String: "Test" (length: 4)
Console.WriteLine(DescribeObject(true));      // Boolean: True
Console.WriteLine(DescribeObject(null));      // Null value
```

---

## Property Patterns

Property patterns allow you to match object property values, making conditional logic more intuitive and expressive.

### Basic Property Patterns

```csharp
public class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public string City { get; set; } = "";
}

// Property pattern examples
public static string ClassifyPerson(Person person) => person switch
{
    { Age: < 18 } => "Minor",
    { Age: >= 60 } => "Senior",
    { City: "Beijing" } => "Beijing resident",
    { City: "Shanghai" } => "Shanghai resident",
    _ => "Regular adult"
};

// Combining multiple property conditions
public static string GetSpecialOffer(Person person) => person switch
{
    { Age: < 12, City: "Beijing" } => "Beijing children's discount",
    { Age: >= 65, City: "Shanghai" } => "Shanghai senior discount",
    { Age: < 18 } => "Youth discount",
    _ => "No special offer"
};
```

### Nested Property Patterns

Property patterns support multi-level nesting to deeply inspect object structures:

```csharp
public class Address
{
    public string Country { get; set; } = "";
    public string City { get; set; } = "";
    public string Street { get; set; } = "";
}

public class Employee
{
    public string Name { get; set; } = "";
    public decimal Salary { get; set; }
    public Address? HomeAddress { get; set; }
}

// Nested property pattern
public static decimal CalculateTax(Employee emp) => emp switch
{
    { HomeAddress: { Country: "China", City: "Beijing" }, Salary: > 50000m }
        => emp.Salary * 0.25m,
    { HomeAddress: { Country: "China", City: "Shanghai" }, Salary: > 50000m }
        => emp.Salary * 0.23m,
    { HomeAddress: { Country: "China" }, Salary: > 30000m }
        => emp.Salary * 0.20m,
    { HomeAddress: { Country: "China" } }
        => emp.Salary * 0.15m,
    { HomeAddress: null }
        => emp.Salary * 0.10m,
    _ => emp.Salary * 0.18m
};
```

### Combining Property Patterns with Type Patterns

```csharp
public static string TakeFive(object input) => input switch
{
    string { Length: >= 5 } s => s.Substring(0, 5),
    string s => s,
    ICollection<char> { Count: >= 5 } symbols => new string(symbols.Take(5).ToArray()),
    ICollection<char> symbols => new string(symbols.ToArray()),
    null => throw new ArgumentNullException(nameof(input)),
    _ => throw new ArgumentException("Unsupported input type")
};

// Usage examples
Console.WriteLine(TakeFive("Hello, World!"));  // Hello
Console.WriteLine(TakeFive("Hi!"));            // Hi!
Console.WriteLine(TakeFive(new[] { '1', '2', '3', '4', '5', '6' }));  // 12345
```

### Extended Property Patterns (C# 10+)

C# 10 introduced extended property patterns, allowing dot notation to access nested properties:

```csharp
// Pre-C# 10 syntax
public static string OldWay(Employee emp) => emp switch
{
    { HomeAddress: { City: "Beijing" } } => "Beijing employee",
    _ => "Other region employee"
};

// C# 10+ extended property pattern
public static string NewWay(Employee emp) => emp switch
{
    { HomeAddress.City: "Beijing" } => "Beijing employee",
    { HomeAddress.Country: "China" } => "China employee",
    _ => "Other region employee"
};
```

---

## Positional Patterns

Positional patterns are based on an object's deconstruction capability, allowing you to match individual parts of a deconstructed object.

### Tuple Patterns

Tuples are the most common use case for positional patterns:

```csharp
// Rock Paper Scissors game
public static string PlayGame(string player1, string player2) =>
    (player1, player2) switch
{
    ("Rock", "Scissors") or ("Scissors", "Paper") or ("Paper", "Rock") => "Player 1 wins",
    ("Scissors", "Rock") or ("Paper", "Scissors") or ("Rock", "Paper") => "Player 2 wins",
    (var p1, var p2) when p1 == p2 => "Draw",
    _ => "Invalid input"
};

// Group ticket price discount calculation
public static decimal GetGroupTicketPriceDiscount(int groupSize, DateTime visitDate) =>
    (groupSize, visitDate.DayOfWeek) switch
{
    (<= 0, _) => throw new ArgumentException("Group size must be positive"),
    (_, DayOfWeek.Saturday or DayOfWeek.Sunday) => 0.0m,  // No weekend discount
    (>= 5 and < 10, DayOfWeek.Monday) => 20.0m,          // Monday medium group
    (>= 10, DayOfWeek.Monday) => 30.0m,                  // Monday large group
    (>= 5 and < 10, _) => 12.0m,                         // Weekday medium group
    (>= 10, _) => 15.0m,                                 // Weekday large group
    _ => 0.0m
};
```

### Positional Patterns with Record Types

Record types automatically support deconstruction and can use positional patterns directly:

```csharp
public record Point(double X, double Y);
public record Point3D(double X, double Y, double Z);

public static string DescribePoint(Point point) => point switch
{
    (0, 0) => "Origin",
    (0, var y) => $"Point on Y-axis, Y = {y}",
    (var x, 0) => $"Point on X-axis, X = {x}",
    (var x, var y) when x == y => $"Point on diagonal ({x}, {y})",
    (var x, var y) when x == -y => $"Point on anti-diagonal ({x}, {y})",
    (var x, var y) => $"General point ({x}, {y})"
};

// Nested Record deconstruction
public record Circle(Point Center, double Radius);

public static string DescribeCircle(Circle circle) => circle switch
{
    ((0, 0), var r) => $"Circle centered at origin with radius {r}",
    ((var x, 0), var r) when x > 0 => $"Center on positive X-axis, radius {r}",
    ((0, var y), var r) when y > 0 => $"Center on positive Y-axis, radius {r}",
    var ((x, y), r) => $"Center at ({x}, {y}), radius {r}"
};
```

### Custom Deconstruct Methods

For regular classes, you can support positional patterns by defining a `Deconstruct` method:

```csharp
public class Rectangle
{
    public double Width { get; }
    public double Height { get; }

    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }

    // Define deconstruction method
    public void Deconstruct(out double width, out double height)
    {
        width = Width;
        height = Height;
    }
}

public static string ClassifyRectangle(Rectangle rect) => rect switch
{
    (0, _) or (_, 0) => "Invalid rectangle (zero side length)",
    (var w, var h) when w == h => $"Square with side {w}",
    (var w, var h) when w > h => $"Horizontal rectangle {w} x {h}",
    (var w, var h) => $"Vertical rectangle {w} x {h}"
};

// Adding deconstruction via extension method
public static class DateTimeExtensions
{
    public static void Deconstruct(
        this DateTime date,
        out int year,
        out int month,
        out int day)
    {
        year = date.Year;
        month = date.Month;
        day = date.Day;
    }
}

// Using date deconstruction
public static string DescribeDate(DateTime date) => date switch
{
    (_, 1, 1) => "New Year's Day",
    (_, 5, 1) => "Labor Day",
    (_, 10, 1) => "National Day",
    (var y, 2, 14) => $"Valentine's Day {y}",
    (_, 12, 25) => "Christmas",
    var (y, m, d) => $"{m}/{d}/{y}"
};
```

---

## Switch Expressions

Switch expressions, introduced in C# 8.0, are the core syntactic sugar for pattern matching, making code more concise.

### Basic Syntax

```csharp
// Traditional switch statement
public static string GetDayNameOld(DayOfWeek day)
{
    switch (day)
    {
        case DayOfWeek.Monday:
            return "Monday";
        case DayOfWeek.Tuesday:
            return "Tuesday";
        case DayOfWeek.Wednesday:
            return "Wednesday";
        case DayOfWeek.Thursday:
            return "Thursday";
        case DayOfWeek.Friday:
            return "Friday";
        case DayOfWeek.Saturday:
            return "Saturday";
        case DayOfWeek.Sunday:
            return "Sunday";
        default:
            throw new ArgumentOutOfRangeException(nameof(day));
    }
}

// Switch expression
public static string GetDayName(DayOfWeek day) => day switch
{
    DayOfWeek.Monday => "Monday",
    DayOfWeek.Tuesday => "Tuesday",
    DayOfWeek.Wednesday => "Wednesday",
    DayOfWeek.Thursday => "Thursday",
    DayOfWeek.Friday => "Friday",
    DayOfWeek.Saturday => "Saturday",
    DayOfWeek.Sunday => "Sunday",
    _ => throw new ArgumentOutOfRangeException(nameof(day))
};
```

### Complex Switch Expressions

```csharp
public record Order(
    string Id,
    decimal Amount,
    string CustomerType,
    DateTime OrderDate,
    bool IsPriority
);

public static (decimal Discount, string Message) CalculateDiscount(Order order) =>
    order switch
{
    null => throw new ArgumentNullException(nameof(order)),

    { Amount: <= 0 } =>
        (0m, "Invalid order amount"),

    { CustomerType: "VIP", Amount: >= 10000m } =>
        (0.25m, "VIP customer large order, 25% discount"),

    { CustomerType: "VIP", Amount: >= 1000m } =>
        (0.15m, "VIP customer, 15% discount"),

    { CustomerType: "VIP" } =>
        (0.10m, "VIP customer, 10% discount"),

    { IsPriority: true, Amount: >= 5000m } =>
        (0.12m, "Priority customer large order, 12% discount"),

    { Amount: >= 5000m } =>
        (0.08m, "Large order, 8% discount"),

    { Amount: >= 1000m } =>
        (0.05m, "Orders over 1000, 5% off"),

    _ => (0m, "No discount available")
};
```

### Nested Switch Expressions

```csharp
public enum PaymentMethod { CreditCard, DebitCard, BankTransfer, Cash, Crypto }
public enum CustomerTier { Bronze, Silver, Gold, Platinum }

public static decimal GetProcessingFee(
    PaymentMethod method,
    CustomerTier tier,
    decimal amount) => method switch
{
    PaymentMethod.Cash => 0m,

    PaymentMethod.CreditCard => tier switch
    {
        CustomerTier.Platinum => 0m,
        CustomerTier.Gold => amount * 0.01m,
        CustomerTier.Silver => amount * 0.015m,
        _ => amount * 0.02m
    },

    PaymentMethod.DebitCard => tier switch
    {
        CustomerTier.Platinum or CustomerTier.Gold => 0m,
        _ => amount * 0.005m
    },

    PaymentMethod.BankTransfer => amount switch
    {
        >= 10000m => 0m,
        >= 1000m => 5m,
        _ => 10m
    },

    PaymentMethod.Crypto => amount * 0.001m,

    _ => throw new ArgumentException("Unknown payment method")
};
```

---

## When Clauses

When clauses add additional boolean conditions to pattern matching, making matches more flexible.

### Basic When Clauses

```csharp
public static string ClassifyNumber(int number) => number switch
{
    0 => "Zero",
    var n when n < 0 => "Negative",
    var n when n % 2 == 0 => "Positive even",
    var n when IsPrime(n) => "Prime",
    _ => "Positive odd (not prime)"
};

private static bool IsPrime(int n)
{
    if (n < 2) return false;
    for (int i = 2; i <= Math.Sqrt(n); i++)
        if (n % i == 0) return false;
    return true;
}
```

### When Clauses with Property Patterns

```csharp
public record Product(
    string Name,
    string Category,
    decimal Price,
    int Stock,
    DateTime ExpiryDate
);

public static string GetProductStatus(Product product) => product switch
{
    null => throw new ArgumentNullException(nameof(product)),

    { Stock: 0 } => "Out of stock",

    { ExpiryDate: var expiry } when expiry < DateTime.Now =>
        "Expired",

    { ExpiryDate: var expiry } when expiry < DateTime.Now.AddDays(7) =>
        "Expiring soon",

    { Stock: var s, Category: "Food" } when s < 10 =>
        "Food stock low",

    { Price: var p, Category: "Electronics" } when p > 5000 =>
        "High-end electronics",

    { Stock: var s } when s < 5 =>
        "Low stock",

    _ => "In stock"
};
```

### When Clauses with Tuple Patterns

```csharp
public static string GetShippingMethod(
    decimal orderAmount,
    double distanceKm,
    bool isFragile) => (orderAmount, distanceKm, isFragile) switch
{
    (_, _, true) when distanceKm > 500 =>
        "Long-distance fragile shipping not supported",

    (>= 1000m, _, true) =>
        "Dedicated vehicle delivery (fragile large order)",

    (_, > 1000, _) =>
        "Air express",

    (>= 500m, _, _) =>
        "Next-day delivery",

    (_, var d, _) when d < 50 =>
        "Same-city express",

    _ => "Standard shipping"
};
```

### When Clauses in Is Expressions

```csharp
// Is expressions don't directly support when, but similar effects can be achieved with &&
public static void ProcessItem(object item)
{
    if (item is int number && number > 100)
    {
        Console.WriteLine($"Integer greater than 100: {number}");
    }
    else if (item is string { Length: > 0 } text && text.StartsWith("Important"))
    {
        Console.WriteLine($"Important message: {text}");
    }
}
```

---

## Relational Patterns

Relational patterns, introduced in C# 9.0, allow you to use relational operators (`<`, `>`, `<=`, `>=`) for comparisons.

### Basic Relational Patterns

```csharp
public static string ClassifyTemperature(double celsius) => celsius switch
{
    < -40 => "Extreme cold",
    < 0 => "Freezing",
    < 10 => "Cold",
    < 20 => "Cool",
    < 30 => "Warm",
    < 40 => "Hot",
    _ => "Scorching"
};

// Water state (based on Fahrenheit)
public static string GetWaterState(int tempFahrenheit) => tempFahrenheit switch
{
    < 32 => "Solid (ice)",
    32 => "Solid-liquid coexistence (freezing point)",
    > 32 and < 212 => "Liquid (water)",
    212 => "Liquid-gas coexistence (boiling point)",
    > 212 => "Gas (steam)"
};
```

### Numeric Range Matching

```csharp
public static string GetGrade(int score) => score switch
{
    < 0 or > 100 => "Invalid score",
    >= 90 => "Excellent (A)",
    >= 80 => "Good (B)",
    >= 70 => "Average (C)",
    >= 60 => "Pass (D)",
    _ => "Fail (F)"
};

// BMI classification
public static string ClassifyBMI(double bmi) => bmi switch
{
    < 18.5 => "Underweight",
    >= 18.5 and < 24 => "Normal weight",
    >= 24 and < 28 => "Overweight",
    >= 28 and < 32 => "Mild obesity",
    >= 32 and < 40 => "Moderate obesity",
    >= 40 => "Severe obesity",
    _ => "Invalid BMI value"  // Handles NaN
};
```

### Relational Patterns with Property Patterns

```csharp
public record BankAccount(
    string AccountNumber,
    decimal Balance,
    string AccountType,
    int DaysOverdue
);

public static string AssessAccountRisk(BankAccount account) => account switch
{
    { Balance: < 0 } => "Negative balance, high risk",
    { DaysOverdue: > 90 } => "Severely overdue, high risk",
    { DaysOverdue: > 30 and <= 90 } => "Overdue, medium risk",
    { DaysOverdue: > 0 and <= 30, Balance: < 1000 } => "Slightly overdue with low balance, medium risk",
    { DaysOverdue: > 0 and <= 30 } => "Slightly overdue, low risk",
    { Balance: >= 10000, AccountType: "Savings" } => "Premium savings customer",
    { Balance: >= 50000 } => "High net worth customer",
    _ => "Regular customer"
};
```

---

## Logical Patterns

C# 9.0 introduced logical pattern operators `and`, `or`, and `not`, allowing you to combine multiple patterns.

### And Pattern

```csharp
// Range check
public static bool IsValidPercentage(int value) => value is >= 0 and <= 100;

// Working hours check
public static bool IsWorkingHour(int hour) => hour is >= 9 and < 18;

// Combining property patterns
public static string ClassifyPerson(Person person) => person switch
{
    { Age: >= 18 and < 65, City: "Beijing" } => "Working-age Beijing resident",
    { Age: >= 18 and < 65 } => "Working-age resident",
    { Age: < 18 } => "Minor",
    _ => "Senior"
};
```

### Or Pattern

```csharp
// Vowel check
public static bool IsVowel(char c) =>
    c is 'a' or 'e' or 'i' or 'o' or 'u' or
         'A' or 'E' or 'I' or 'O' or 'U';

// Weekend check
public static bool IsWeekend(DayOfWeek day) =>
    day is DayOfWeek.Saturday or DayOfWeek.Sunday;

// Season classification
public static string GetSeason(int month) => month switch
{
    12 or 1 or 2 => "Winter",
    3 or 4 or 5 => "Spring",
    6 or 7 or 8 => "Summer",
    9 or 10 or 11 => "Autumn",
    _ => "Invalid month"
};

// HTTP status code classification
public static string ClassifyStatusCode(int code) => code switch
{
    >= 100 and < 200 => "Informational response",
    >= 200 and < 300 => "Success",
    >= 300 and < 400 => "Redirection",
    >= 400 and < 500 => "Client error",
    >= 500 and < 600 => "Server error",
    _ => "Unknown status code"
};
```

### Not Pattern

```csharp
// Null check
public static bool IsNotNull(object? obj) => obj is not null;

// Non-empty string check
public static bool IsNotEmpty(string? str) => str is not (null or "");

// Excluding specific values
public static string ProcessValue(int value) => value switch
{
    not 0 when value > 0 => "Positive",
    not 0 when value < 0 => "Negative",
    0 => "Zero"
};

// Type exclusion
public static void HandleException(Exception ex)
{
    if (ex is not (ArgumentException or InvalidOperationException))
    {
        // Handle other types of exceptions
        Console.WriteLine($"Unexpected exception: {ex.GetType().Name}");
    }
}
```

### Complex Logical Combinations

```csharp
public record HttpRequest(
    string Method,
    string Path,
    int ContentLength,
    string? Authorization
);

public static string ValidateRequest(HttpRequest request) => request switch
{
    null => "Request cannot be null",

    { Method: not ("GET" or "POST" or "PUT" or "DELETE") } =>
        "Unsupported HTTP method",

    { Method: "POST" or "PUT", ContentLength: <= 0 } =>
        "POST/PUT requests must contain content",

    { Method: "POST" or "PUT", ContentLength: > 10_000_000 } =>
        "Request content too large",

    { Path: null or "" } =>
        "Path cannot be empty",

    { Authorization: null or "", Path: var p } when p.StartsWith("/admin") =>
        "Authorization required for admin paths",

    _ => "Request valid"
};
```

---

## List Patterns

List patterns, introduced in C# 11, allow you to match elements in arrays, lists, or any indexable collection.

### Basic List Patterns

```csharp
public static string DescribeArray(int[] numbers) => numbers switch
{
    [] => "Empty array",
    [var single] => $"Single-element array: {single}",
    [var first, var second] => $"Two-element array: {first}, {second}",
    [var first, var second, var third] => $"Three-element array: {first}, {second}, {third}",
    _ => $"Array contains {numbers.Length} elements"
};

// Usage examples
Console.WriteLine(DescribeArray([]));           // Empty array
Console.WriteLine(DescribeArray([42]));         // Single-element array: 42
Console.WriteLine(DescribeArray([1, 2]));       // Two-element array: 1, 2
Console.WriteLine(DescribeArray([1, 2, 3, 4])); // Array contains 4 elements
```

### Slice Patterns

The slice pattern `..` matches zero or more elements:

```csharp
public static string AnalyzeSequence(int[] sequence) => sequence switch
{
    [] => "Empty sequence",
    [1, 2, 3] => "Exact match [1, 2, 3]",
    [1, ..] => "Starts with 1",
    [.., 9] => "Ends with 9",
    [1, .., 9] => "Starts with 1, ends with 9",
    [var first, .., var last] => $"First element: {first}, last element: {last}",
    _ => "Unknown sequence"
};

// Match examples
Console.WriteLine(new[] { 1, 2, 3, 4, 5 } is [> 0, > 0, ..]);     // True
Console.WriteLine(new[] { 1, 2, 3, 4 } is [.., > 0, > 0]);        // True
Console.WriteLine(new[] { 1, 2, 3, 4 } is [>= 0, .., 2 or 4]);    // True
Console.WriteLine(new[] { 1, 0, 0, 1 } is [1, 0, .., 0, 1]);      // True
```

### List Patterns with Nested Patterns

```csharp
// Capturing values in slices
public static void MatchMessage(string message)
{
    var result = message is ['A' or 'a', .. var middle, 'A' or 'a']
        ? $"Message \"{message}\" matches, middle part: \"{middle}\""
        : $"Message \"{message}\" does not match";
    Console.WriteLine(result);
}

// Validating array structure
public static string ValidateArray(int[] numbers) => numbers switch
{
    [< 0, .. { Length: 2 or 4 }, > 0] => "Valid: negative start, positive end, 2 or 4 elements in middle",
    [< 0, .., > 0] => "Valid: negative start, positive end",
    [> 0, ..] => "Starts with positive",
    [.., < 0] => "Ends with negative",
    _ => "Other case"
};
```

### Complex List Pattern Applications

```csharp
public record LogEntry(string Level, string Message, DateTime Timestamp);

public static string AnalyzeLogs(LogEntry[] logs) => logs switch
{
    [] => "No log entries",

    [{ Level: "ERROR" }] => "Single error log",

    [{ Level: "ERROR" }, { Level: "ERROR" }, ..] =>
        "Consecutive errors, possible serious issue",

    [.., { Level: "ERROR" }] =>
        "Recent error occurred",

    [{ Level: "INFO", Message: var msg }, ..] when msg.Contains("startup") =>
        "System startup log sequence",

    [.., { Level: "INFO", Message: var msg }] when msg.Contains("shutdown") =>
        "System shutdown log sequence",

    _ => $"Total {logs.Length} log entries"
};

// Command line argument parsing
public static string ParseArgs(string[] args) => args switch
{
    [] => "Usage: program [command] [options]",
    ["help"] => "Display help information",
    ["version"] => "Version 1.0.0",
    ["run", var file] => $"Run file: {file}",
    ["run", var file, "--verbose"] => $"Run file in verbose mode: {file}",
    ["config", "set", var key, var value] => $"Set config {key} = {value}",
    ["config", "get", var key] => $"Get config: {key}",
    [var cmd, ..] => $"Unknown command: {cmd}"
};
```

---

## Var Pattern and Discard Pattern

### Var Pattern

The var pattern matches any expression (including null) and assigns it to a variable:

```csharp
// var pattern always matches
public static string ProcessAny(object? input) => input switch
{
    string s => $"String: {s}",
    int i => $"Integer: {i}",
    var other => $"Other type: {other?.GetType().Name ?? "null"}"
};

// Using var in positional patterns
public static string DescribePoint(Point point) => point switch
{
    (0, 0) => "Origin",
    (var x, var y) when x == y => $"On diagonal ({x}, {y})",
    var (x, y) => $"Point ({x}, {y})"  // var can apply to entire deconstruction
};

// Capturing intermediate values for calculations
public static string AnalyzeOrder(Order order) => order switch
{
    { Amount: var amt } when amt > 10000 => $"Large order: {amt:C}",
    { Amount: var amt, CustomerType: "VIP" } when amt > 1000 =>
        $"VIP medium order: {amt:C}",
    var o => $"Regular order: {o.Amount:C}"
};
```

### Discard Pattern

The discard pattern `_` matches any expression without capturing the value:

```csharp
// Basic discard pattern
public static decimal CalculateToll(Vehicle vehicle) => vehicle switch
{
    Car _ => 2.00m,      // Match Car type, variable not needed
    Truck _ => 7.50m,    // Match Truck type, variable not needed
    null => throw new ArgumentNullException(nameof(vehicle)),
    _ => throw new ArgumentException("Unknown vehicle type")  // Default case
};

// Ignoring certain values in tuples
public static string CheckFirst(int first, int second) => (first, second) switch
{
    (0, _) => "First is zero",
    (_, 0) => "Second is zero",
    (var f, _) when f < 0 => "First is negative",
    _ => "Both are positive"
};

// Using discard in list patterns
public static bool HasAtLeastThreeElements(int[] arr) => arr is [_, _, _, ..];
```

---

## Practical Applications

### State Machine Implementation

```csharp
public enum OrderState { Created, Validated, Paid, Shipped, Delivered, Cancelled }

public record OrderEvent(string Type, string? Reason = null);

public static (OrderState NewState, string Message) ProcessOrderEvent(
    OrderState currentState,
    OrderEvent orderEvent) => (currentState, orderEvent) switch
{
    // Created state transitions
    (OrderState.Created, { Type: "validate" }) =>
        (OrderState.Validated, "Order validated"),
    (OrderState.Created, { Type: "cancel", Reason: var r }) =>
        (OrderState.Cancelled, $"Order cancelled: {r ?? "no reason"}"),

    // Validated state transitions
    (OrderState.Validated, { Type: "pay" }) =>
        (OrderState.Paid, "Order paid"),
    (OrderState.Validated, { Type: "cancel", Reason: var r }) =>
        (OrderState.Cancelled, $"Order cancelled: {r ?? "no reason"}"),

    // Paid state transitions
    (OrderState.Paid, { Type: "ship" }) =>
        (OrderState.Shipped, "Order shipped"),
    (OrderState.Paid, { Type: "refund" }) =>
        (OrderState.Cancelled, "Order refunded"),

    // Shipped state transitions
    (OrderState.Shipped, { Type: "deliver" }) =>
        (OrderState.Delivered, "Order delivered"),
    (OrderState.Shipped, { Type: "return" }) =>
        (OrderState.Cancelled, "Order returned"),

    // Terminal states do not allow transitions
    (OrderState.Delivered, _) =>
        (OrderState.Delivered, "Order completed, no further operations allowed"),
    (OrderState.Cancelled, _) =>
        (OrderState.Cancelled, "Order cancelled, no further operations allowed"),

    // Invalid transition
    _ => (currentState, $"Invalid state transition: {currentState} + {orderEvent.Type}")
};
```

### Expression Evaluator

```csharp
public abstract record Expression;
public record Constant(double Value) : Expression;
public record Variable(string Name) : Expression;
public record Addition(Expression Left, Expression Right) : Expression;
public record Subtraction(Expression Left, Expression Right) : Expression;
public record Multiplication(Expression Left, Expression Right) : Expression;
public record Division(Expression Left, Expression Right) : Expression;
public record Negation(Expression Inner) : Expression;

public class ExpressionEvaluator
{
    private readonly Dictionary<string, double> _variables;

    public ExpressionEvaluator(Dictionary<string, double>? variables = null)
    {
        _variables = variables ?? new Dictionary<string, double>();
    }

    public double Evaluate(Expression expr) => expr switch
    {
        Constant(var value) => value,
        Variable(var name) => _variables.TryGetValue(name, out var val)
            ? val
            : throw new ArgumentException($"Undefined variable: {name}"),
        Addition(var left, var right) => Evaluate(left) + Evaluate(right),
        Subtraction(var left, var right) => Evaluate(left) - Evaluate(right),
        Multiplication(var left, var right) => Evaluate(left) * Evaluate(right),
        Division(var left, var right) => Evaluate(left) / Evaluate(right),
        Negation(var inner) => -Evaluate(inner),
        null => throw new ArgumentNullException(nameof(expr)),
        _ => throw new ArgumentException($"Unknown expression type: {expr.GetType().Name}")
    };

    // Expression simplification
    public Expression Simplify(Expression expr) => expr switch
    {
        // Addition simplification
        Addition(Constant(0), var right) => Simplify(right),
        Addition(var left, Constant(0)) => Simplify(left),
        Addition(Constant(var a), Constant(var b)) => new Constant(a + b),

        // Multiplication simplification
        Multiplication(Constant(0), _) => new Constant(0),
        Multiplication(_, Constant(0)) => new Constant(0),
        Multiplication(Constant(1), var right) => Simplify(right),
        Multiplication(var left, Constant(1)) => Simplify(left),
        Multiplication(Constant(var a), Constant(var b)) => new Constant(a * b),

        // Division simplification
        Division(var left, Constant(1)) => Simplify(left),
        Division(Constant(0), _) => new Constant(0),

        // Double negation
        Negation(Negation(var inner)) => Simplify(inner),
        Negation(Constant(var value)) => new Constant(-value),

        // Recursively simplify compound expressions
        Addition(var left, var right) =>
            new Addition(Simplify(left), Simplify(right)),
        Subtraction(var left, var right) =>
            new Subtraction(Simplify(left), Simplify(right)),
        Multiplication(var left, var right) =>
            new Multiplication(Simplify(left), Simplify(right)),
        Division(var left, var right) =>
            new Division(Simplify(left), Simplify(right)),
        Negation(var inner) => new Negation(Simplify(inner)),

        // Other cases remain unchanged
        _ => expr
    };
}
```

### Configuration Validation System

```csharp
public record DatabaseConfig(
    string Host,
    int Port,
    string Database,
    string? Username,
    string? Password,
    int MaxConnections,
    int TimeoutSeconds
);

public record AppConfig(
    string Environment,
    DatabaseConfig Database,
    string[] AllowedOrigins,
    bool EnableLogging
);

public class ConfigValidator
{
    public IEnumerable<string> Validate(AppConfig config)
    {
        var errors = new List<string>();

        // Use pattern matching to validate each part
        errors.AddRange(ValidateEnvironment(config));
        errors.AddRange(ValidateDatabase(config.Database));
        errors.AddRange(ValidateOrigins(config));

        return errors;
    }

    private IEnumerable<string> ValidateEnvironment(AppConfig config) => config switch
    {
        { Environment: null or "" } =>
            new[] { "Environment name cannot be empty" },
        { Environment: not ("Development" or "Staging" or "Production") } =>
            new[] { "Environment must be Development, Staging, or Production" },
        { Environment: "Production", EnableLogging: false } =>
            new[] { "Logging must be enabled in production" },
        _ => Enumerable.Empty<string>()
    };

    private IEnumerable<string> ValidateDatabase(DatabaseConfig db) => db switch
    {
        null =>
            new[] { "Database configuration cannot be null" },
        { Host: null or "" } =>
            new[] { "Database host cannot be empty" },
        { Port: <= 0 or > 65535 } =>
            new[] { "Port must be between 1-65535" },
        { Database: null or "" } =>
            new[] { "Database name cannot be empty" },
        { MaxConnections: <= 0 } =>
            new[] { "Max connections must be greater than 0" },
        { MaxConnections: > 1000 } =>
            new[] { "Max connections cannot exceed 1000" },
        { TimeoutSeconds: <= 0 or > 300 } =>
            new[] { "Timeout must be between 1-300 seconds" },
        { Username: null or "", Password: not (null or "") } =>
            new[] { "Username must be provided when password is set" },
        _ => Enumerable.Empty<string>()
    };

    private IEnumerable<string> ValidateOrigins(AppConfig config) =>
        (config.Environment, config.AllowedOrigins) switch
    {
        (_, null or []) =>
            new[] { "At least one allowed origin is required" },
        ("Production", [.., "*"]) =>
            new[] { "Wildcard origin not allowed in production" },
        ("Production", var origins) when origins.Any(o => o.StartsWith("http://")) =>
            new[] { "Production must use HTTPS" },
        _ => Enumerable.Empty<string>()
    };
}
```

### JSON Parsing and Transformation

```csharp
using System.Text.Json;

public class JsonProcessor
{
    public object? ProcessJsonElement(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.Null => null,
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Number when element.TryGetInt32(out var i) => i,
        JsonValueKind.Number when element.TryGetInt64(out var l) => l,
        JsonValueKind.Number when element.TryGetDouble(out var d) => d,
        JsonValueKind.String when element.TryGetDateTime(out var dt) => dt,
        JsonValueKind.String => element.GetString(),
        JsonValueKind.Array => element.EnumerateArray()
            .Select(ProcessJsonElement)
            .ToList(),
        JsonValueKind.Object => element.EnumerateObject()
            .ToDictionary(p => p.Name, p => ProcessJsonElement(p.Value)),
        _ => throw new ArgumentException($"Unknown JSON type: {element.ValueKind}")
    };

    public string DescribeJson(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.Object => element.EnumerateObject().Count() switch
        {
            0 => "Empty object {}",
            1 => "Single-property object",
            var n when n <= 5 => $"Small object ({n} properties)",
            var n => $"Large object ({n} properties)"
        },
        JsonValueKind.Array => element.GetArrayLength() switch
        {
            0 => "Empty array []",
            1 => "Single-element array",
            var n when n <= 10 => $"Small array ({n} elements)",
            var n => $"Large array ({n} elements)"
        },
        JsonValueKind.String => element.GetString() switch
        {
            null or "" => "Empty string",
            { Length: <= 10 } s => $"Short string: \"{s}\"",
            { Length: var len } => $"Long string ({len} characters)"
        },
        JsonValueKind.Number => "Number",
        JsonValueKind.True or JsonValueKind.False => "Boolean",
        JsonValueKind.Null => "null",
        _ => "Unknown type"
    };
}
```

---

## Best Practices and Performance Considerations

### Best Practices

1. **Prefer switch expressions**
   - When you need to return a value, switch expressions are more concise than traditional switch statements
   - The compiler checks for exhaustiveness, providing better type safety

2. **Keep patterns simple**
   ```csharp
   // Avoid overly complex patterns
   // Not recommended
   var result = data switch
   {
       { A: { B: { C: { D: > 10 } } }, E: < 5, F: not null } => "Complex",
       _ => "Simple"
   };

   // Recommended: extract to methods
   var result = data switch
   {
       var d when IsComplexCondition(d) => "Complex",
       _ => "Simple"
   };
   ```

3. **Leverage compiler exhaustiveness checking**
   ```csharp
   public enum Status { Active, Inactive, Pending }

   // Compiler will warn about unhandled enum values
   public string GetStatusText(Status status) => status switch
   {
       Status.Active => "Active",
       Status.Inactive => "Inactive",
       Status.Pending => "Pending"
       // No _ branch, you'll get a warning when new enum values are added
   };
   ```

4. **Use when clauses appropriately**
   - Use when when the pattern itself cannot express the condition
   - Avoid putting conditions in when that can be expressed with patterns

5. **Pay attention to pattern order**
   ```csharp
   // More specific patterns should come first
   public string Process(int value) => value switch
   {
       42 => "Special value",      // Specific constant
       > 0 and < 100 => "Small positive",  // Range
       > 0 => "Large positive",     // Broader condition
       0 => "Zero",
       _ => "Negative"          // Default case
   };
   ```

### Performance Considerations

1. **Pattern matching typically has no significant performance overhead**
   - The compiler optimizes pattern matching into efficient conditional checks
   - For simple type checks, performance is comparable to manual type checking

2. **Avoid complex property patterns in hot paths**
   ```csharp
   // In performance-critical code, consider caching property access
   // Instead of
   if (obj is { Prop1.Prop2.Prop3: > 100 }) { ... }

   // Consider
   var value = obj?.Prop1?.Prop2?.Prop3;
   if (value > 100) { ... }
   ```

3. **List pattern performance**
   - List patterns access indexers, which may not be O(1) for some collection types
   - Avoid complex list patterns for large collections

4. **Switch expressions vs switch statements**
   - Typically no significant performance difference
   - The compiler may apply the same optimizations to both

### Debugging Tips

```csharp
// Use var patterns to capture intermediate values for debugging
public string Debug(object input) => input switch
{
    string { Length: var len } s when len > 10 =>
        $"Long string: {s[..10]}...",  // You can set a breakpoint here to inspect len and s
    var unknown => $"Type: {unknown?.GetType().Name}"  // Capture any value
};
```

---

## Summary

C# pattern matching is a powerful and continuously evolving language feature. From basic type patterns in C# 7.0 to list patterns in C# 11, each version has brought new capabilities:

- **Type patterns** make type checking and casting more concise
- **Property patterns** make object structure matching intuitive
- **Positional patterns** simplify deconstruction and tuple handling
- **Switch expressions** provide functional-style conditional branching
- **Relational and logical patterns** enhance conditional expression capabilities
- **List patterns** bring new possibilities for collection handling

Mastering these pattern matching techniques will make your C# code more concise, type-safe, and maintainable. As the C# language continues to evolve, pattern matching capabilities will continue to be enhanced, making it worthwhile to follow and learn.
