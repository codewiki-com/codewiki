---
title: C# LINQ Deep Dive
description: "Master LINQ: query syntax, method syntax, deferred execution and common operators"
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - LINQ
  - Queries
  - Collections
status: imported
origin: old/src/content/docs/csharp/linq.en.md
divergence: 0.222
issues:
  - title-lang-zh
  - title-language
legacy:
  category: CSharp
  subcategory: LINQ
  order: 3
  lastUpdated: 2026-01-07
---

Language Integrated Query (LINQ) is one of the most powerful features in C#, providing a unified syntax for querying data from various sources including collections, databases, XML, and more. We'll explore LINQ in depth, covering both syntax styles, execution models, and practical applications.

## Introduction to LINQ

LINQ (Language Integrated Query) was introduced in C# 3.0 and provides a consistent query experience across different data sources. It brings SQL-like querying capabilities directly into C# with full IntelliSense and compile-time type checking.

### Key Benefits

- **Type Safety**: Compile-time checking prevents runtime errors
- **IntelliSense Support**: Full IDE support for query composition
- **Unified Syntax**: Same query pattern for different data sources
- **Declarative Approach**: Focus on what to retrieve, not how
- **Composability**: Build complex queries from simple operations

### Basic Example

```csharp
using System;
using System.Linq;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Simple LINQ query to get even numbers
        var evenNumbers = from num in numbers
                         where num % 2 == 0
                         select num;

        foreach (var num in evenNumbers)
        {
            Console.WriteLine(num); // Output: 2, 4, 6, 8, 10
        }
    }
}
```

## Query Syntax vs Method Syntax

LINQ provides two distinct syntaxes for writing queries: query syntax (also called query expression syntax) and method syntax (also called fluent syntax). Both produce the same results and can often be used interchangeably.

### Query Syntax

Query syntax resembles SQL and uses keywords like `from`, `where`, `select`, `orderby`, and `join`. It's compiled into method syntax by the compiler.

```csharp
public class Student
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
    public double GPA { get; set; }
}

class QuerySyntaxExample
{
    static void Main()
    {
        List<Student> students = new List<Student>
        {
            new Student { Id = 1, Name = "Alice", Age = 20, GPA = 3.8 },
            new Student { Id = 2, Name = "Bob", Age = 22, GPA = 3.5 },
            new Student { Id = 3, Name = "Charlie", Age = 21, GPA = 3.9 },
            new Student { Id = 4, Name = "Diana", Age = 19, GPA = 3.7 }
        };

        // Query syntax
        var topStudents = from student in students
                         where student.GPA >= 3.7
                         orderby student.GPA descending
                         select new { student.Name, student.GPA };

        foreach (var student in topStudents)
        {
            Console.WriteLine($"{student.Name}: {student.GPA}");
        }
        // Output:
        // Charlie: 3.9
        // Alice: 3.8
        // Diana: 3.7
    }
}
```

### Method Syntax

Method syntax uses extension methods and lambda expressions. It's more flexible and allows access to all LINQ operators.

```csharp
class MethodSyntaxExample
{
    static void Main()
    {
        List<Student> students = new List<Student>
        {
            new Student { Id = 1, Name = "Alice", Age = 20, GPA = 3.8 },
            new Student { Id = 2, Name = "Bob", Age = 22, GPA = 3.5 },
            new Student { Id = 3, Name = "Charlie", Age = 21, GPA = 3.9 },
            new Student { Id = 4, Name = "Diana", Age = 19, GPA = 3.7 }
        };

        // Method syntax (equivalent to query syntax above)
        var topStudents = students
            .Where(student => student.GPA >= 3.7)
            .OrderByDescending(student => student.GPA)
            .Select(student => new { student.Name, student.GPA });

        foreach (var student in topStudents)
        {
            Console.WriteLine($"{student.Name}: {student.GPA}");
        }
    }
}
```

### Combining Both Syntaxes

You can mix query syntax and method syntax in the same query:

```csharp
var result = (from student in students
              where student.Age > 20
              select student)
             .OrderBy(s => s.Name)
             .Take(3);
```

### When to Use Each Syntax

**Use Query Syntax When:**
- Working with multiple data sources (joins)
- Query reads more naturally in SQL-like format
- Team prefers SQL-style queries

**Use Method Syntax When:**
- Need operators not available in query syntax (like `Take`, `Skip`, `Distinct`)
- Chaining multiple operations
- Writing functional-style code
- Need more control over lambda expressions

## Deferred Execution

One of LINQ's most important concepts is deferred execution (also called lazy evaluation). Many LINQ operators don't execute when defined but when enumerated.

### Understanding Deferred Execution

```csharp
class DeferredExecutionDemo
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // Query is defined but NOT executed yet
        var query = numbers.Where(n => n > 2);

        Console.WriteLine("Before modifying list:");
        foreach (var num in query)
        {
            Console.Write(num + " "); // Output: 3 4 5
        }

        // Modify the source
        numbers.Add(6);
        numbers.Add(7);

        Console.WriteLine("\nAfter modifying list:");
        foreach (var num in query)
        {
            Console.Write(num + " "); // Output: 3 4 5 6 7
        }
        // Query reflects the new state!
    }
}
```

### Immediate Execution

Some LINQ operations force immediate execution:

```csharp
class ImmediateExecutionDemo
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // These operators execute immediately
        var list = numbers.Where(n => n > 2).ToList();     // ToList()
        var array = numbers.Where(n => n > 2).ToArray();   // ToArray()
        var count = numbers.Count(n => n > 2);              // Count()
        var first = numbers.First(n => n > 2);              // First()
        var sum = numbers.Sum();                            // Sum()

        // Modifying numbers won't affect these results
        numbers.Add(6);

        Console.WriteLine($"List count: {list.Count}");     // Still 3
        Console.WriteLine($"Array length: {array.Length}"); // Still 3
    }
}
```

### Controlling Execution

```csharp
class ExecutionControlDemo
{
    static void Main()
    {
        var numbers = Enumerable.Range(1, 1000000);

        // Deferred: Only evaluated when needed
        var query = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n);

        // Force immediate execution
        var results = query.ToList();

        // Now we can enumerate multiple times without re-evaluation
        Console.WriteLine($"Count: {results.Count}");
        Console.WriteLine($"First: {results.First()}");
        Console.WriteLine($"Last: {results.Last()}");
    }
}
```

### Benefits and Pitfalls

**Benefits:**
- Better performance: Only process what you need
- Always works with current data
- Composable queries

**Pitfalls:**
- Multiple enumeration can cause performance issues
- Queries over changing data may produce different results
- Side effects in lambda expressions can be unpredictable

```csharp
// Avoid: Multiple enumeration
var query = numbers.Where(n => ExpensiveOperation(n));
var count = query.Count();  // Enumerates once
var first = query.First();  // Enumerates again!

// Better: Execute once
var results = query.ToList();
var count = results.Count;
var first = results.First();
```

## Common LINQ Operators

LINQ provides a rich set of operators for querying and manipulating data. Let's explore the most commonly used ones.

### Filtering Operators

```csharp
class FilteringOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Where: Filter based on condition
        var evenNumbers = numbers.Where(n => n % 2 == 0);
        // Output: 2, 4, 6, 8, 10

        // OfType: Filter by type
        object[] mixed = { 1, "two", 3, "four", 5 };
        var integers = mixed.OfType<int>();
        // Output: 1, 3, 5

        var strings = mixed.OfType<string>();
        // Output: "two", "four"
    }
}
```

### Projection Operators

```csharp
class ProjectionOperators
{
    static void Main()
    {
        List<Student> students = new List<Student>
        {
            new Student { Id = 1, Name = "Alice", Age = 20, GPA = 3.8 },
            new Student { Id = 2, Name = "Bob", Age = 22, GPA = 3.5 }
        };

        // Select: Transform each element
        var names = students.Select(s => s.Name);
        // Output: "Alice", "Bob"

        // Select with anonymous type
        var studentInfo = students.Select(s => new
        {
            s.Name,
            s.Age,
            Status = s.GPA >= 3.7 ? "Honors" : "Regular"
        });

        // SelectMany: Flatten nested collections
        List<List<int>> nestedNumbers = new List<List<int>>
        {
            new List<int> { 1, 2, 3 },
            new List<int> { 4, 5, 6 },
            new List<int> { 7, 8, 9 }
        };

        var flattened = nestedNumbers.SelectMany(list => list);
        // Output: 1, 2, 3, 4, 5, 6, 7, 8, 9
    }
}
```

### Ordering Operators

```csharp
class OrderingOperators
{
    static void Main()
    {
        List<Student> students = new List<Student>
        {
            new Student { Id = 1, Name = "Charlie", Age = 21, GPA = 3.9 },
            new Student { Id = 2, Name = "Alice", Age = 20, GPA = 3.8 },
            new Student { Id = 3, Name = "Bob", Age = 22, GPA = 3.8 }
        };

        // OrderBy: Sort ascending
        var byName = students.OrderBy(s => s.Name);

        // OrderByDescending: Sort descending
        var byGPADesc = students.OrderByDescending(s => s.GPA);

        // ThenBy: Secondary sort
        var sorted = students
            .OrderByDescending(s => s.GPA)
            .ThenBy(s => s.Name);
        // First by GPA (desc), then by Name (asc)

        // Reverse: Reverse the order
        var reversed = students.Reverse();
    }
}
```

### Grouping Operators

```csharp
class GroupingOperators
{
    static void Main()
    {
        List<Student> students = new List<Student>
        {
            new Student { Id = 1, Name = "Alice", Age = 20, GPA = 3.8 },
            new Student { Id = 2, Name = "Bob", Age = 20, GPA = 3.5 },
            new Student { Id = 3, Name = "Charlie", Age = 21, GPA = 3.9 },
            new Student { Id = 4, Name = "Diana", Age = 21, GPA = 3.7 }
        };

        // GroupBy: Group elements by key
        var byAge = students.GroupBy(s => s.Age);

        foreach (var group in byAge)
        {
            Console.WriteLine($"Age {group.Key}:");
            foreach (var student in group)
            {
                Console.WriteLine($"  {student.Name}: {student.GPA}");
            }
        }

        // GroupBy with result selector
        var ageGroups = students
            .GroupBy(s => s.Age,
                    (age, studentGroup) => new
                    {
                        Age = age,
                        Count = studentGroup.Count(),
                        AverageGPA = studentGroup.Average(s => s.GPA)
                    });

        foreach (var group in ageGroups)
        {
            Console.WriteLine($"Age {group.Age}: {group.Count} students, Avg GPA: {group.AverageGPA:F2}");
        }
    }
}
```

### Aggregation Operators

```csharp
class AggregationOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Count: Number of elements
        var count = numbers.Count();
        var evenCount = numbers.Count(n => n % 2 == 0);

        // Sum: Sum of elements
        var sum = numbers.Sum();
        var evenSum = numbers.Where(n => n % 2 == 0).Sum();

        // Average: Average of elements
        var average = numbers.Average();

        // Min/Max: Minimum/Maximum value
        var min = numbers.Min();
        var max = numbers.Max();

        // Aggregate: Custom aggregation
        var product = numbers.Aggregate((acc, n) => acc * n);
        // Computes: 1 * 2 * 3 * 4 * 5 * 6 * 7 * 8 * 9 * 10

        // Aggregate with seed
        var sumOfSquares = numbers.Aggregate(0, (acc, n) => acc + n * n);

        Console.WriteLine($"Count: {count}");
        Console.WriteLine($"Sum: {sum}");
        Console.WriteLine($"Average: {average}");
        Console.WriteLine($"Min: {min}, Max: {max}");
    }
}
```

### Set Operators

```csharp
class SetOperators
{
    static void Main()
    {
        List<int> numbers1 = new List<int> { 1, 2, 3, 4, 5 };
        List<int> numbers2 = new List<int> { 4, 5, 6, 7, 8 };

        // Distinct: Remove duplicates
        var withDuplicates = new List<int> { 1, 2, 2, 3, 3, 3, 4 };
        var distinct = withDuplicates.Distinct();
        // Output: 1, 2, 3, 4

        // Union: Combine and remove duplicates
        var union = numbers1.Union(numbers2);
        // Output: 1, 2, 3, 4, 5, 6, 7, 8

        // Intersect: Common elements
        var intersect = numbers1.Intersect(numbers2);
        // Output: 4, 5

        // Except: Elements in first but not in second
        var except = numbers1.Except(numbers2);
        // Output: 1, 2, 3

        // Concat: Concatenate (keeps duplicates)
        var concat = numbers1.Concat(numbers2);
        // Output: 1, 2, 3, 4, 5, 4, 5, 6, 7, 8
    }
}
```

### Partitioning Operators

```csharp
class PartitioningOperators
{
    static void Main()
    {
        List<int> numbers = Enumerable.Range(1, 20).ToList();

        // Take: Take first n elements
        var first5 = numbers.Take(5);
        // Output: 1, 2, 3, 4, 5

        // Skip: Skip first n elements
        var skip5 = numbers.Skip(5);
        // Output: 6, 7, 8, ..., 20

        // TakeWhile: Take while condition is true
        var takeWhile = numbers.TakeWhile(n => n < 6);
        // Output: 1, 2, 3, 4, 5

        // SkipWhile: Skip while condition is true
        var skipWhile = numbers.SkipWhile(n => n < 6);
        // Output: 6, 7, 8, ..., 20

        // Pagination example
        int pageSize = 5;
        int pageNumber = 2;
        var page = numbers
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize);
        // Output: 6, 7, 8, 9, 10 (page 2)
    }
}
```

### Element Operators

```csharp
class ElementOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // First: Get first element (throws if empty)
        var first = numbers.First();
        var firstEven = numbers.First(n => n % 2 == 0);

        // FirstOrDefault: Get first or default value
        var firstOrDefault = numbers.FirstOrDefault(n => n > 10);
        // Returns 0 (default for int)

        // Last/LastOrDefault: Get last element
        var last = numbers.Last();
        var lastOrDefault = numbers.LastOrDefault(n => n > 10);

        // Single: Get single element (throws if 0 or >1)
        var singleList = new List<int> { 42 };
        var single = singleList.Single();

        // SingleOrDefault: Get single element or default
        var singleOrDefault = numbers.SingleOrDefault(n => n == 3);

        // ElementAt: Get element at index
        var elementAt = numbers.ElementAt(2); // Returns 3

        // ElementAtOrDefault: Safe element access
        var elementAtOrDefault = numbers.ElementAtOrDefault(10);
        // Returns 0 (out of range)
    }
}
```

### Quantifier Operators

```csharp
class QuantifierOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // Any: Check if any element matches condition
        bool hasEven = numbers.Any(n => n % 2 == 0); // true
        bool hasNegative = numbers.Any(n => n < 0);  // false

        // All: Check if all elements match condition
        bool allPositive = numbers.All(n => n > 0);      // true
        bool allEven = numbers.All(n => n % 2 == 0);     // false

        // Contains: Check if collection contains element
        bool contains3 = numbers.Contains(3);   // true
        bool contains10 = numbers.Contains(10); // false

        // Practical example
        List<Student> students = new List<Student>
        {
            new Student { Name = "Alice", GPA = 3.8 },
            new Student { Name = "Bob", GPA = 3.5 }
        };

        bool hasHonorsStudent = students.Any(s => s.GPA >= 3.7);
        bool allPassing = students.All(s => s.GPA >= 2.0);
    }
}
```

## LINQ to Objects

LINQ to Objects refers to using LINQ queries with in-memory collections like arrays, lists, and other `IEnumerable<T>` or `IQueryable<T>` collections.

### Working with Collections

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
}

class LinqToObjectsDemo
{
    static void Main()
    {
        List<Product> products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Category = "Electronics", Price = 999.99m, Stock = 15 },
            new Product { Id = 2, Name = "Mouse", Category = "Electronics", Price = 29.99m, Stock = 50 },
            new Product { Id = 3, Name = "Desk", Category = "Furniture", Price = 299.99m, Stock = 10 },
            new Product { Id = 4, Name = "Chair", Category = "Furniture", Price = 199.99m, Stock = 20 },
            new Product { Id = 5, Name = "Monitor", Category = "Electronics", Price = 399.99m, Stock = 8 }
        };

        // Complex query example
        var expensiveElectronics = products
            .Where(p => p.Category == "Electronics" && p.Price > 100)
            .OrderByDescending(p => p.Price)
            .Select(p => new
            {
                p.Name,
                p.Price,
                TotalValue = p.Price * p.Stock,
                Status = p.Stock < 10 ? "Low Stock" : "In Stock"
            });

        foreach (var product in expensiveElectronics)
        {
            Console.WriteLine($"{product.Name}: ${product.Price} - {product.Status}");
            Console.WriteLine($"  Total Value: ${product.TotalValue}");
        }
    }
}
```

### Joining Collections

```csharp
public class Order
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public DateTime OrderDate { get; set; }
}

class JoinExample
{
    static void Main()
    {
        List<Product> products = new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Price = 999.99m },
            new Product { Id = 2, Name = "Mouse", Price = 29.99m },
            new Product { Id = 3, Name = "Keyboard", Price = 79.99m }
        };

        List<Order> orders = new List<Order>
        {
            new Order { OrderId = 1, ProductId = 1, Quantity = 2, OrderDate = DateTime.Now.AddDays(-5) },
            new Order { OrderId = 2, ProductId = 2, Quantity = 5, OrderDate = DateTime.Now.AddDays(-3) },
            new Order { OrderId = 3, ProductId = 1, Quantity = 1, OrderDate = DateTime.Now.AddDays(-1) }
        };

        // Inner Join (Query Syntax)
        var orderDetails = from order in orders
                          join product in products on order.ProductId equals product.Id
                          select new
                          {
                              order.OrderId,
                              product.Name,
                              order.Quantity,
                              Total = order.Quantity * product.Price,
                              order.OrderDate
                          };

        // Inner Join (Method Syntax)
        var orderDetailsMethod = orders.Join(
            products,
            order => order.ProductId,
            product => product.Id,
            (order, product) => new
            {
                order.OrderId,
                product.Name,
                order.Quantity,
                Total = order.Quantity * product.Price,
                order.OrderDate
            });

        foreach (var detail in orderDetails)
        {
            Console.WriteLine($"Order {detail.OrderId}: {detail.Quantity}x {detail.Name} = ${detail.Total}");
        }

        // Group Join
        var productOrders = from product in products
                           join order in orders on product.Id equals order.ProductId into productGroup
                           select new
                           {
                               product.Name,
                               Orders = productGroup,
                               TotalOrdered = productGroup.Sum(o => o.Quantity)
                           };

        foreach (var po in productOrders)
        {
            Console.WriteLine($"{po.Name}: {po.TotalOrdered} units ordered");
        }
    }
}
```

### Complex Queries

```csharp
class ComplexQueryExample
{
    static void Main()
    {
        List<Product> products = GetProducts();

        // Multi-level grouping and aggregation
        var categoryStats = products
            .GroupBy(p => p.Category)
            .Select(g => new
            {
                Category = g.Key,
                ProductCount = g.Count(),
                TotalValue = g.Sum(p => p.Price * p.Stock),
                AveragePrice = g.Average(p => p.Price),
                MostExpensive = g.OrderByDescending(p => p.Price).First().Name,
                LowStockItems = g.Count(p => p.Stock < 10)
            })
            .OrderByDescending(x => x.TotalValue);

        foreach (var stat in categoryStats)
        {
            Console.WriteLine($"\n{stat.Category}:");
            Console.WriteLine($"  Products: {stat.ProductCount}");
            Console.WriteLine($"  Total Value: ${stat.TotalValue:N2}");
            Console.WriteLine($"  Average Price: ${stat.AveragePrice:N2}");
            Console.WriteLine($"  Most Expensive: {stat.MostExpensive}");
            Console.WriteLine($"  Low Stock Items: {stat.LowStockItems}");
        }

        // Nested queries
        var categoriesWithExpensiveProducts = products
            .GroupBy(p => p.Category)
            .Where(g => g.Any(p => p.Price > 500))
            .Select(g => new
            {
                Category = g.Key,
                ExpensiveProducts = g.Where(p => p.Price > 500)
                                    .OrderByDescending(p => p.Price)
                                    .Select(p => new { p.Name, p.Price })
            });

        foreach (var category in categoriesWithExpensiveProducts)
        {
            Console.WriteLine($"\n{category.Category} (Premium Products):");
            foreach (var product in category.ExpensiveProducts)
            {
                Console.WriteLine($"  {product.Name}: ${product.Price}");
            }
        }
    }

    static List<Product> GetProducts()
    {
        return new List<Product>
        {
            new Product { Id = 1, Name = "Laptop", Category = "Electronics", Price = 999.99m, Stock = 15 },
            new Product { Id = 2, Name = "Mouse", Category = "Electronics", Price = 29.99m, Stock = 50 },
            new Product { Id = 3, Name = "Desk", Category = "Furniture", Price = 299.99m, Stock = 10 },
            new Product { Id = 4, Name = "Gaming PC", Category = "Electronics", Price = 1499.99m, Stock = 5 },
            new Product { Id = 5, Name = "Office Chair", Category = "Furniture", Price = 399.99m, Stock = 20 }
        };
    }
}
```

## LINQ to Entities

LINQ to Entities is part of Entity Framework and allows you to query databases using LINQ syntax. The queries are translated to SQL and executed on the database server.

### Basic Setup

```csharp
using System;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

// Entity classes
public class Customer
{
    public int CustomerId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string City { get; set; }
    public DateTime RegisteredDate { get; set; }

    public ICollection<Order> Orders { get; set; }
}

public class Order
{
    public int OrderId { get; set; }
    public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; }

    public Customer Customer { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; }
}

public class OrderItem
{
    public int OrderItemId { get; set; }
    public int OrderId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public Order Order { get; set; }
}

// DbContext
public class ShopContext : DbContext
{
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(
            "Server=localhost;Database=ShopDB;Trusted_Connection=True;");
    }
}
```

### Querying with LINQ to Entities

```csharp
class LinqToEntitiesExample
{
    static void Main()
    {
        using (var context = new ShopContext())
        {
            // Simple query
            var customers = context.Customers
                .Where(c => c.City == "New York")
                .OrderBy(c => c.Name)
                .ToList();

            // Eager loading with Include
            var customersWithOrders = context.Customers
                .Include(c => c.Orders)
                .Where(c => c.City == "New York")
                .ToList();

            // Loading multiple levels
            var customersWithDetails = context.Customers
                .Include(c => c.Orders)
                    .ThenInclude(o => o.OrderItems)
                .Where(c => c.RegisteredDate.Year == 2025)
                .ToList();

            // Projection (select specific fields)
            var customerSummary = context.Customers
                .Where(c => c.Orders.Any())
                .Select(c => new
                {
                    c.Name,
                    c.Email,
                    OrderCount = c.Orders.Count(),
                    TotalSpent = c.Orders.Sum(o => o.TotalAmount),
                    LastOrderDate = c.Orders.Max(o => o.OrderDate)
                })
                .ToList();

            foreach (var summary in customerSummary)
            {
                Console.WriteLine($"{summary.Name}:");
                Console.WriteLine($"  Orders: {summary.OrderCount}");
                Console.WriteLine($"  Total Spent: ${summary.TotalSpent:N2}");
                Console.WriteLine($"  Last Order: {summary.LastOrderDate:d}");
            }
        }
    }
}
```

### Advanced Queries

```csharp
class AdvancedLinqToEntitiesExample
{
    static void Main()
    {
        using (var context = new ShopContext())
        {
            // Group by with aggregation
            var ordersByMonth = context.Orders
                .Where(o => o.OrderDate.Year == 2025)
                .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    OrderCount = g.Count(),
                    TotalRevenue = g.Sum(o => o.TotalAmount),
                    AverageOrder = g.Average(o => o.TotalAmount)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            // Complex filtering with navigation properties
            var topCustomers = context.Customers
                .Where(c => c.Orders.Any(o => o.Status == "Completed"))
                .Select(c => new
                {
                    c.Name,
                    CompletedOrders = c.Orders.Count(o => o.Status == "Completed"),
                    TotalSpent = c.Orders
                        .Where(o => o.Status == "Completed")
                        .Sum(o => o.TotalAmount)
                })
                .Where(x => x.TotalSpent > 1000)
                .OrderByDescending(x => x.TotalSpent)
                .Take(10)
                .ToList();

            // Subqueries
            var averageOrderValue = context.Orders
                .Where(o => o.Status == "Completed")
                .Average(o => o.TotalAmount);

            var highValueCustomers = context.Customers
                .Where(c => c.Orders
                    .Where(o => o.Status == "Completed")
                    .Average(o => o.TotalAmount) > averageOrderValue)
                .ToList();

            // Join across tables
            var productPopularity = context.OrderItems
                .GroupBy(oi => oi.ProductName)
                .Select(g => new
                {
                    Product = g.Key,
                    TimesSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.Quantity * oi.UnitPrice),
                    UniqueCustomers = g.Select(oi => oi.Order.CustomerId).Distinct().Count()
                })
                .OrderByDescending(x => x.Revenue)
                .Take(20)
                .ToList();

            foreach (var product in productPopularity)
            {
                Console.WriteLine($"{product.Product}:");
                Console.WriteLine($"  Sold: {product.TimesSold} units");
                Console.WriteLine($"  Revenue: ${product.Revenue:N2}");
                Console.WriteLine($"  Customers: {product.UniqueCustomers}");
            }
        }
    }
}
```

### Async Queries

```csharp
using System.Threading.Tasks;

class AsyncLinqExample
{
    static async Task Main()
    {
        using (var context = new ShopContext())
        {
            // Async query execution
            var customers = await context.Customers
                .Where(c => c.City == "New York")
                .ToListAsync();

            // Async aggregation
            var totalOrders = await context.Orders
                .CountAsync();

            var totalRevenue = await context.Orders
                .Where(o => o.Status == "Completed")
                .SumAsync(o => o.TotalAmount);

            // Async single result
            var customer = await context.Customers
                .FirstOrDefaultAsync(c => c.Email == "john@example.com");

            // Async with complex query
            var topProducts = await context.OrderItems
                .GroupBy(oi => oi.ProductName)
                .Select(g => new
                {
                    Product = g.Key,
                    TotalQuantity = g.Sum(oi => oi.Quantity)
                })
                .OrderByDescending(x => x.TotalQuantity)
                .Take(5)
                .ToListAsync();

            Console.WriteLine($"Total Orders: {totalOrders}");
            Console.WriteLine($"Total Revenue: ${totalRevenue:N2}");
        }
    }
}
```

### Raw SQL with LINQ

```csharp
class RawSqlExample
{
    static void Main()
    {
        using (var context = new ShopContext())
        {
            // Execute raw SQL query
            var customers = context.Customers
                .FromSqlRaw("SELECT * FROM Customers WHERE City = {0}", "New York")
                .ToList();

            // Combine raw SQL with LINQ
            var filteredCustomers = context.Customers
                .FromSqlRaw("SELECT * FROM Customers WHERE RegisteredDate > {0}",
                           new DateTime(2025, 1, 1))
                .Where(c => c.Orders.Any())
                .OrderBy(c => c.Name)
                .ToList();

            // Execute stored procedure
            var result = context.Orders
                .FromSqlRaw("EXEC GetOrdersByDateRange @StartDate, @EndDate",
                           new DateTime(2025, 1, 1),
                           new DateTime(2025, 12, 31))
                .ToList();
        }
    }
}
```

## Best Practices and Performance

### Performance Optimization

```csharp
class PerformanceOptimization
{
    static void Main()
    {
        // 1. Use IQueryable for database queries (not IEnumerable)
        using (var context = new ShopContext())
        {
            // Good: Filtering happens in database
            IQueryable<Customer> query = context.Customers;
            var filtered = query.Where(c => c.City == "New York").ToList();

            // Bad: All data loaded, then filtered in memory
            IEnumerable<Customer> allCustomers = context.Customers.ToList();
            var filteredBad = allCustomers.Where(c => c.City == "New York").ToList();
        }

        // 2. Avoid N+1 queries - Use Include
        using (var context = new ShopContext())
        {
            // Bad: N+1 queries (1 for customers + N for each customer's orders)
            var customersBad = context.Customers.ToList();
            foreach (var customer in customersBad)
            {
                var orderCount = customer.Orders.Count(); // Separate query!
            }

            // Good: Single query with JOIN
            var customersGood = context.Customers
                .Include(c => c.Orders)
                .ToList();
            foreach (var customer in customersGood)
            {
                var orderCount = customer.Orders.Count(); // Already loaded
            }
        }

        // 3. Project only needed fields
        using (var context = new ShopContext())
        {
            // Bad: Loads all customer data
            var customersBad = context.Customers
                .Where(c => c.City == "New York")
                .ToList();

            // Good: Only loads needed fields
            var customersGood = context.Customers
                .Where(c => c.City == "New York")
                .Select(c => new { c.Name, c.Email })
                .ToList();
        }

        // 4. Use AsNoTracking for read-only queries
        using (var context = new ShopContext())
        {
            // Faster for read-only operations
            var customers = context.Customers
                .AsNoTracking()
                .Where(c => c.City == "New York")
                .ToList();
        }

        // 5. Batch operations
        using (var context = new ShopContext())
        {
            // Bad: Multiple database calls
            var customers = context.Customers.ToList();
            foreach (var customer in customers)
            {
                customer.RegisteredDate = DateTime.Now;
                context.SaveChanges(); // Save after each!
            }

            // Good: Single batch update
            var customersGood = context.Customers.ToList();
            foreach (var customer in customersGood)
            {
                customer.RegisteredDate = DateTime.Now;
            }
            context.SaveChanges(); // Save once
        }
    }
}
```

### Common Pitfalls

```csharp
class CommonPitfalls
{
    static void Main()
    {
        // 1. Multiple enumeration
        var numbers = Enumerable.Range(1, 1000000).Where(n => n % 2 == 0);

        // Bad: Query executed multiple times
        var count = numbers.Count();   // Enumerated
        var first = numbers.First();   // Enumerated again
        var last = numbers.Last();     // Enumerated again

        // Good: Execute once
        var numbersList = numbers.ToList();
        var countGood = numbersList.Count;
        var firstGood = numbersList.First();
        var lastGood = numbersList.Last();

        // 2. Closure capture in loops
        var predicates = new List<Func<int, bool>>();

        // Bad: All predicates will use i = 10
        for (int i = 0; i < 10; i++)
        {
            predicates.Add(n => n > i);
        }

        // Good: Capture local copy
        for (int i = 0; i < 10; i++)
        {
            int local = i;
            predicates.Add(n => n > local);
        }

        // 3. Ordering before filtering
        var items = Enumerable.Range(1, 1000000);

        // Bad: Sorts all items, then filters
        var resultBad = items
            .OrderBy(n => n)
            .Where(n => n % 100 == 0)
            .ToList();

        // Good: Filters first, then sorts less data
        var resultGood = items
            .Where(n => n % 100 == 0)
            .OrderBy(n => n)
            .ToList();

        // 4. String comparisons in queries
        List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

        // Case-sensitive
        var exactMatch = names.Where(n => n == "alice").ToList(); // Empty

        // Case-insensitive
        var caseInsensitive = names.Where(n =>
            n.Equals("alice", StringComparison.OrdinalIgnoreCase)).ToList();
    }
}
```

### Testing LINQ Queries

```csharp
using System;
using System.Linq;
using System.Collections.Generic;

class LinqTesting
{
    // Testable method
    public static List<Customer> GetActiveCustomers(
        IEnumerable<Customer> customers,
        DateTime sinceDate)
    {
        return customers
            .Where(c => c.Orders.Any(o => o.OrderDate >= sinceDate))
            .OrderByDescending(c => c.Orders.Sum(o => o.TotalAmount))
            .ToList();
    }

    // Example test
    static void TestGetActiveCustomers()
    {
        // Arrange
        var testCustomers = new List<Customer>
        {
            new Customer
            {
                Name = "Alice",
                Orders = new List<Order>
                {
                    new Order { OrderDate = DateTime.Now.AddDays(-5), TotalAmount = 100 }
                }
            },
            new Customer
            {
                Name = "Bob",
                Orders = new List<Order>
                {
                    new Order { OrderDate = DateTime.Now.AddDays(-50), TotalAmount = 200 }
                }
            }
        };

        // Act
        var result = GetActiveCustomers(testCustomers, DateTime.Now.AddDays(-30));

        // Assert
        Console.WriteLine($"Active customers: {result.Count}"); // Should be 1 (Alice)
        Console.WriteLine($"First customer: {result.First().Name}"); // Should be Alice
    }
}
```

### Key Takeaways

1. **Choose the Right Syntax**: Use query syntax for joins and multiple data sources; use method syntax for most other operations.

2. **Understand Deferred Execution**: Know when queries execute and use `ToList()`, `ToArray()`, or `Count()` to force immediate execution when needed.

3. **Optimize for Performance**:
   - Filter before ordering
   - Use projection to select only needed fields
   - Avoid multiple enumeration
   - Use `AsNoTracking()` for read-only EF queries

4. **LINQ to Entities Specific**:
   - Use `Include()` and `ThenInclude()` to avoid N+1 queries
   - Use async methods for database operations
   - Be aware of what translates to SQL

5. **Write Testable Code**: Extract LINQ queries into methods that accept `IEnumerable<T>` or `IQueryable<T>` for easy testing.

6. **Handle Edge Cases**: Always consider empty collections and use `FirstOrDefault()`, `SingleOrDefault()` when appropriate.

## Conclusion

LINQ is a powerful feature that brings query capabilities directly into C#. Whether you're working with in-memory collections (LINQ to Objects) or databases (LINQ to Entities), mastering LINQ will make your code more readable, maintainable, and expressive.

Key concepts to remember:
- Both query and method syntax have their place
- Deferred execution can improve performance but requires understanding
- Rich set of operators for filtering, projection, grouping, and aggregation
- Entity Framework translates LINQ to SQL for database operations
- Performance optimization is crucial for production applications

By understanding these concepts and following best practices, you can leverage LINQ to write elegant and efficient data access code in your C# applications.
