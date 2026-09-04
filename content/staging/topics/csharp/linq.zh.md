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
origin: old/src/content/docs/csharp/linq.zh.md
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

语言集成查询 (LINQ) 是 C# 中最强大的功能之一，它提供了统一的语法来查询各种数据源，包括集合、数据库、XML 等。本文将深入探讨 LINQ，涵盖两种语法风格、执行模型和实际应用。

## LINQ 简介

LINQ（语言集成查询）在 C# 3.0 中引入，为不同数据源提供一致的查询体验。它将类似 SQL 的查询功能直接引入 C#，并提供完整的 IntelliSense 和编译时类型检查支持。

### 主要优势

- **类型安全**：编译时检查可防止运行时错误
- **IntelliSense 支持**：完整的 IDE 支持用于查询编写
- **统一语法**：不同数据源使用相同的查询模式
- **声明式方法**：专注于要检索什么，而不是如何检索
- **可组合性**：从简单操作构建复杂查询

### 基本示例

```csharp
using System;
using System.Linq;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // 简单的 LINQ 查询获取偶数
        var evenNumbers = from num in numbers
                         where num % 2 == 0
                         select num;

        foreach (var num in evenNumbers)
        {
            Console.WriteLine(num); // 输出: 2, 4, 6, 8, 10
        }
    }
}
```

## 查询语法 vs 方法语法

LINQ 提供两种不同的语法来编写查询：查询语法（也称为查询表达式语法）和方法语法（也称为流畅语法）。两者产生相同的结果，通常可以互换使用。

### 查询语法

查询语法类似于 SQL，使用 `from`、`where`、`select`、`orderby` 和 `join` 等关键字。编译器会将其编译为方法语法。

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

        // 查询语法
        var topStudents = from student in students
                         where student.GPA >= 3.7
                         orderby student.GPA descending
                         select new { student.Name, student.GPA };

        foreach (var student in topStudents)
        {
            Console.WriteLine($"{student.Name}: {student.GPA}");
        }
        // 输出:
        // Charlie: 3.9
        // Alice: 3.8
        // Diana: 3.7
    }
}
```

### 方法语法

方法语法使用扩展方法和 Lambda 表达式。它更加灵活，可以访问所有 LINQ 操作符。

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

        // 方法语法（等同于上面的查询语法）
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

### 结合两种语法

你可以在同一个查询中混合使用查询语法和方法语法：

```csharp
var result = (from student in students
              where student.Age > 20
              select student)
             .OrderBy(s => s.Name)
             .Take(3);
```

### 何时使用每种语法

**使用查询语法的场景：**
- 处理多个数据源（连接操作）
- 查询以类似 SQL 的格式更易读时
- 团队更偏好 SQL 风格的查询

**使用方法语法的场景：**
- 需要查询语法中不可用的操作符（如 `Take`、`Skip`、`Distinct`）
- 链式调用多个操作
- 编写函数式风格的代码
- 需要对 Lambda 表达式有更多控制

## 延迟执行

LINQ 最重要的概念之一是延迟执行（也称为惰性求值）。许多 LINQ 操作符不在定义时执行，而是在枚举时执行。

### 理解延迟执行

```csharp
class DeferredExecutionDemo
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // 查询已定义但尚未执行
        var query = numbers.Where(n => n > 2);

        Console.WriteLine("修改列表前:");
        foreach (var num in query)
        {
            Console.Write(num + " "); // 输出: 3 4 5
        }

        // 修改数据源
        numbers.Add(6);
        numbers.Add(7);

        Console.WriteLine("\n修改列表后:");
        foreach (var num in query)
        {
            Console.Write(num + " "); // 输出: 3 4 5 6 7
        }
        // 查询反映了新的状态！
    }
}
```

### 立即执行

某些 LINQ 操作会强制立即执行：

```csharp
class ImmediateExecutionDemo
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // 这些操作符会立即执行
        var list = numbers.Where(n => n > 2).ToList();     // ToList()
        var array = numbers.Where(n => n > 2).ToArray();   // ToArray()
        var count = numbers.Count(n => n > 2);              // Count()
        var first = numbers.First(n => n > 2);              // First()
        var sum = numbers.Sum();                            // Sum()

        // 修改 numbers 不会影响这些结果
        numbers.Add(6);

        Console.WriteLine($"列表数量: {list.Count}");     // 仍然是 3
        Console.WriteLine($"数组长度: {array.Length}"); // 仍然是 3
    }
}
```

### 控制执行

```csharp
class ExecutionControlDemo
{
    static void Main()
    {
        var numbers = Enumerable.Range(1, 1000000);

        // 延迟执行：仅在需要时求值
        var query = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n);

        // 强制立即执行
        var results = query.ToList();

        // 现在可以多次枚举而无需重新计算
        Console.WriteLine($"数量: {results.Count}");
        Console.WriteLine($"第一个: {results.First()}");
        Console.WriteLine($"最后一个: {results.Last()}");
    }
}
```

### 优点与陷阱

**优点：**
- 更好的性能：只处理需要的数据
- 始终使用当前数据
- 可组合的查询

**陷阱：**
- 多次枚举可能导致性能问题
- 对变化数据的查询可能产生不同结果
- Lambda 表达式中的副作用可能难以预测

```csharp
// 避免：多次枚举
var query = numbers.Where(n => ExpensiveOperation(n));
var count = query.Count();  // 枚举一次
var first = query.First();  // 再次枚举！

// 更好：执行一次
var results = query.ToList();
var count = results.Count;
var first = results.First();
```

## 常用 LINQ 操作符

LINQ 提供了丰富的操作符集合用于查询和操作数据。让我们来探索最常用的操作符。

### 过滤操作符

```csharp
class FilteringOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Where：根据条件过滤
        var evenNumbers = numbers.Where(n => n % 2 == 0);
        // 输出: 2, 4, 6, 8, 10

        // OfType：按类型过滤
        object[] mixed = { 1, "two", 3, "four", 5 };
        var integers = mixed.OfType<int>();
        // 输出: 1, 3, 5

        var strings = mixed.OfType<string>();
        // 输出: "two", "four"
    }
}
```

### 投影操作符

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

        // Select：转换每个元素
        var names = students.Select(s => s.Name);
        // 输出: "Alice", "Bob"

        // Select 与匿名类型
        var studentInfo = students.Select(s => new
        {
            s.Name,
            s.Age,
            Status = s.GPA >= 3.7 ? "荣誉学生" : "普通学生"
        });

        // SelectMany：展平嵌套集合
        List<List<int>> nestedNumbers = new List<List<int>>
        {
            new List<int> { 1, 2, 3 },
            new List<int> { 4, 5, 6 },
            new List<int> { 7, 8, 9 }
        };

        var flattened = nestedNumbers.SelectMany(list => list);
        // 输出: 1, 2, 3, 4, 5, 6, 7, 8, 9
    }
}
```

### 排序操作符

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

        // OrderBy：升序排序
        var byName = students.OrderBy(s => s.Name);

        // OrderByDescending：降序排序
        var byGPADesc = students.OrderByDescending(s => s.GPA);

        // ThenBy：二次排序
        var sorted = students
            .OrderByDescending(s => s.GPA)
            .ThenBy(s => s.Name);
        // 先按 GPA（降序），然后按 Name（升序）

        // Reverse：反转顺序
        var reversed = students.Reverse();
    }
}
```

### 分组操作符

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

        // GroupBy：按键分组元素
        var byAge = students.GroupBy(s => s.Age);

        foreach (var group in byAge)
        {
            Console.WriteLine($"年龄 {group.Key}:");
            foreach (var student in group)
            {
                Console.WriteLine($"  {student.Name}: {student.GPA}");
            }
        }

        // GroupBy 与结果选择器
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
            Console.WriteLine($"年龄 {group.Age}: {group.Count} 名学生, 平均 GPA: {group.AverageGPA:F2}");
        }
    }
}
```

### 聚合操作符

```csharp
class AggregationOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Count：元素数量
        var count = numbers.Count();
        var evenCount = numbers.Count(n => n % 2 == 0);

        // Sum：元素求和
        var sum = numbers.Sum();
        var evenSum = numbers.Where(n => n % 2 == 0).Sum();

        // Average：元素平均值
        var average = numbers.Average();

        // Min/Max：最小值/最大值
        var min = numbers.Min();
        var max = numbers.Max();

        // Aggregate：自定义聚合
        var product = numbers.Aggregate((acc, n) => acc * n);
        // 计算: 1 * 2 * 3 * 4 * 5 * 6 * 7 * 8 * 9 * 10

        // Aggregate 带种子值
        var sumOfSquares = numbers.Aggregate(0, (acc, n) => acc + n * n);

        Console.WriteLine($"数量: {count}");
        Console.WriteLine($"求和: {sum}");
        Console.WriteLine($"平均值: {average}");
        Console.WriteLine($"最小值: {min}, 最大值: {max}");
    }
}
```

### 集合操作符

```csharp
class SetOperators
{
    static void Main()
    {
        List<int> numbers1 = new List<int> { 1, 2, 3, 4, 5 };
        List<int> numbers2 = new List<int> { 4, 5, 6, 7, 8 };

        // Distinct：去除重复项
        var withDuplicates = new List<int> { 1, 2, 2, 3, 3, 3, 4 };
        var distinct = withDuplicates.Distinct();
        // 输出: 1, 2, 3, 4

        // Union：合并并去除重复项
        var union = numbers1.Union(numbers2);
        // 输出: 1, 2, 3, 4, 5, 6, 7, 8

        // Intersect：共同元素
        var intersect = numbers1.Intersect(numbers2);
        // 输出: 4, 5

        // Except：第一个集合有但第二个没有的元素
        var except = numbers1.Except(numbers2);
        // 输出: 1, 2, 3

        // Concat：连接（保留重复项）
        var concat = numbers1.Concat(numbers2);
        // 输出: 1, 2, 3, 4, 5, 4, 5, 6, 7, 8
    }
}
```

### 分区操作符

```csharp
class PartitioningOperators
{
    static void Main()
    {
        List<int> numbers = Enumerable.Range(1, 20).ToList();

        // Take：取前 n 个元素
        var first5 = numbers.Take(5);
        // 输出: 1, 2, 3, 4, 5

        // Skip：跳过前 n 个元素
        var skip5 = numbers.Skip(5);
        // 输出: 6, 7, 8, ..., 20

        // TakeWhile：当条件为真时继续取值
        var takeWhile = numbers.TakeWhile(n => n < 6);
        // 输出: 1, 2, 3, 4, 5

        // SkipWhile：当条件为真时继续跳过
        var skipWhile = numbers.SkipWhile(n => n < 6);
        // 输出: 6, 7, 8, ..., 20

        // 分页示例
        int pageSize = 5;
        int pageNumber = 2;
        var page = numbers
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize);
        // 输出: 6, 7, 8, 9, 10（第 2 页）
    }
}
```

### 元素操作符

```csharp
class ElementOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // First：获取第一个元素（如果为空则抛出异常）
        var first = numbers.First();
        var firstEven = numbers.First(n => n % 2 == 0);

        // FirstOrDefault：获取第一个元素或默认值
        var firstOrDefault = numbers.FirstOrDefault(n => n > 10);
        // 返回 0（int 的默认值）

        // Last/LastOrDefault：获取最后一个元素
        var last = numbers.Last();
        var lastOrDefault = numbers.LastOrDefault(n => n > 10);

        // Single：获取单个元素（如果为 0 个或 >1 个则抛出异常）
        var singleList = new List<int> { 42 };
        var single = singleList.Single();

        // SingleOrDefault：获取单个元素或默认值
        var singleOrDefault = numbers.SingleOrDefault(n => n == 3);

        // ElementAt：获取指定索引处的元素
        var elementAt = numbers.ElementAt(2); // 返回 3

        // ElementAtOrDefault：安全的元素访问
        var elementAtOrDefault = numbers.ElementAtOrDefault(10);
        // 返回 0（索引越界）
    }
}
```

### 量词操作符

```csharp
class QuantifierOperators
{
    static void Main()
    {
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // Any：检查是否有任何元素匹配条件
        bool hasEven = numbers.Any(n => n % 2 == 0); // true
        bool hasNegative = numbers.Any(n => n < 0);  // false

        // All：检查是否所有元素都匹配条件
        bool allPositive = numbers.All(n => n > 0);      // true
        bool allEven = numbers.All(n => n % 2 == 0);     // false

        // Contains：检查集合是否包含元素
        bool contains3 = numbers.Contains(3);   // true
        bool contains10 = numbers.Contains(10); // false

        // 实际应用示例
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

LINQ to Objects 指的是对内存中的集合（如数组、列表和其他 `IEnumerable<T>` 或 `IQueryable<T>` 集合）使用 LINQ 查询。

### 处理集合

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

        // 复杂查询示例
        var expensiveElectronics = products
            .Where(p => p.Category == "Electronics" && p.Price > 100)
            .OrderByDescending(p => p.Price)
            .Select(p => new
            {
                p.Name,
                p.Price,
                TotalValue = p.Price * p.Stock,
                Status = p.Stock < 10 ? "库存不足" : "有货"
            });

        foreach (var product in expensiveElectronics)
        {
            Console.WriteLine($"{product.Name}: ${product.Price} - {product.Status}");
            Console.WriteLine($"  总价值: ${product.TotalValue}");
        }
    }
}
```

### 连接集合

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

        // 内连接（查询语法）
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

        // 内连接（方法语法）
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
            Console.WriteLine($"订单 {detail.OrderId}: {detail.Quantity}x {detail.Name} = ${detail.Total}");
        }

        // 分组连接
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
            Console.WriteLine($"{po.Name}: 已订购 {po.TotalOrdered} 件");
        }
    }
}
```

### 复杂查询

```csharp
class ComplexQueryExample
{
    static void Main()
    {
        List<Product> products = GetProducts();

        // 多级分组和聚合
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
            Console.WriteLine($"  产品数量: {stat.ProductCount}");
            Console.WriteLine($"  总价值: ${stat.TotalValue:N2}");
            Console.WriteLine($"  平均价格: ${stat.AveragePrice:N2}");
            Console.WriteLine($"  最贵产品: {stat.MostExpensive}");
            Console.WriteLine($"  库存不足的产品: {stat.LowStockItems}");
        }

        // 嵌套查询
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
            Console.WriteLine($"\n{category.Category}（高端产品）:");
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

LINQ to Entities 是 Entity Framework 的一部分，允许你使用 LINQ 语法查询数据库。查询被翻译成 SQL 并在数据库服务器上执行。

### 基本设置

```csharp
using System;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

// 实体类
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

### 使用 LINQ to Entities 查询

```csharp
class LinqToEntitiesExample
{
    static void Main()
    {
        using (var context = new ShopContext())
        {
            // 简单查询
            var customers = context.Customers
                .Where(c => c.City == "New York")
                .OrderBy(c => c.Name)
                .ToList();

            // 使用 Include 进行预加载
            var customersWithOrders = context.Customers
                .Include(c => c.Orders)
                .Where(c => c.City == "New York")
                .ToList();

            // 加载多个级别
            var customersWithDetails = context.Customers
                .Include(c => c.Orders)
                    .ThenInclude(o => o.OrderItems)
                .Where(c => c.RegisteredDate.Year == 2025)
                .ToList();

            // 投影（选择特定字段）
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
                Console.WriteLine($"  订单数: {summary.OrderCount}");
                Console.WriteLine($"  总消费: ${summary.TotalSpent:N2}");
                Console.WriteLine($"  最后订单: {summary.LastOrderDate:d}");
            }
        }
    }
}
```

### 高级查询

```csharp
class AdvancedLinqToEntitiesExample
{
    static void Main()
    {
        using (var context = new ShopContext())
        {
            // 按月分组聚合
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

            // 使用导航属性进行复杂过滤
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

            // 子查询
            var averageOrderValue = context.Orders
                .Where(o => o.Status == "Completed")
                .Average(o => o.TotalAmount);

            var highValueCustomers = context.Customers
                .Where(c => c.Orders
                    .Where(o => o.Status == "Completed")
                    .Average(o => o.TotalAmount) > averageOrderValue)
                .ToList();

            // 跨表连接
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
                Console.WriteLine($"  售出: {product.TimesSold} 件");
                Console.WriteLine($"  收入: ${product.Revenue:N2}");
                Console.WriteLine($"  客户数: {product.UniqueCustomers}");
            }
        }
    }
}
```

### 异步查询

```csharp
using System.Threading.Tasks;

class AsyncLinqExample
{
    static async Task Main()
    {
        using (var context = new ShopContext())
        {
            // 异步查询执行
            var customers = await context.Customers
                .Where(c => c.City == "New York")
                .ToListAsync();

            // 异步聚合
            var totalOrders = await context.Orders
                .CountAsync();

            var totalRevenue = await context.Orders
                .Where(o => o.Status == "Completed")
                .SumAsync(o => o.TotalAmount);

            // 异步单结果
            var customer = await context.Customers
                .FirstOrDefaultAsync(c => c.Email == "john@example.com");

            // 异步复杂查询
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

            Console.WriteLine($"总订单数: {totalOrders}");
            Console.WriteLine($"总收入: ${totalRevenue:N2}");
        }
    }
}
```

### 原始 SQL 与 LINQ

```csharp
class RawSqlExample
{
    static void Main()
    {
        using (var context = new ShopContext())
        {
            // 执行原始 SQL 查询
            var customers = context.Customers
                .FromSqlRaw("SELECT * FROM Customers WHERE City = {0}", "New York")
                .ToList();

            // 将原始 SQL 与 LINQ 结合
            var filteredCustomers = context.Customers
                .FromSqlRaw("SELECT * FROM Customers WHERE RegisteredDate > {0}",
                           new DateTime(2025, 1, 1))
                .Where(c => c.Orders.Any())
                .OrderBy(c => c.Name)
                .ToList();

            // 执行存储过程
            var result = context.Orders
                .FromSqlRaw("EXEC GetOrdersByDateRange @StartDate, @EndDate",
                           new DateTime(2025, 1, 1),
                           new DateTime(2025, 12, 31))
                .ToList();
        }
    }
}
```

## 最佳实践与性能优化

### 性能优化

```csharp
class PerformanceOptimization
{
    static void Main()
    {
        // 1. 对数据库查询使用 IQueryable（而不是 IEnumerable）
        using (var context = new ShopContext())
        {
            // 正确：过滤在数据库中进行
            IQueryable<Customer> query = context.Customers;
            var filtered = query.Where(c => c.City == "New York").ToList();

            // 错误：先加载所有数据，然后在内存中过滤
            IEnumerable<Customer> allCustomers = context.Customers.ToList();
            var filteredBad = allCustomers.Where(c => c.City == "New York").ToList();
        }

        // 2. 避免 N+1 查询问题 - 使用 Include
        using (var context = new ShopContext())
        {
            // 错误：N+1 查询（1 次查客户 + N 次查每个客户的订单）
            var customersBad = context.Customers.ToList();
            foreach (var customer in customersBad)
            {
                var orderCount = customer.Orders.Count(); // 单独的查询！
            }

            // 正确：使用 JOIN 的单个查询
            var customersGood = context.Customers
                .Include(c => c.Orders)
                .ToList();
            foreach (var customer in customersGood)
            {
                var orderCount = customer.Orders.Count(); // 已经加载
            }
        }

        // 3. 只投影需要的字段
        using (var context = new ShopContext())
        {
            // 错误：加载所有客户数据
            var customersBad = context.Customers
                .Where(c => c.City == "New York")
                .ToList();

            // 正确：只加载需要的字段
            var customersGood = context.Customers
                .Where(c => c.City == "New York")
                .Select(c => new { c.Name, c.Email })
                .ToList();
        }

        // 4. 对只读查询使用 AsNoTracking
        using (var context = new ShopContext())
        {
            // 对只读操作更快
            var customers = context.Customers
                .AsNoTracking()
                .Where(c => c.City == "New York")
                .ToList();
        }

        // 5. 批量操作
        using (var context = new ShopContext())
        {
            // 错误：多次数据库调用
            var customers = context.Customers.ToList();
            foreach (var customer in customers)
            {
                customer.RegisteredDate = DateTime.Now;
                context.SaveChanges(); // 每次都保存！
            }

            // 正确：单次批量更新
            var customersGood = context.Customers.ToList();
            foreach (var customer in customersGood)
            {
                customer.RegisteredDate = DateTime.Now;
            }
            context.SaveChanges(); // 保存一次
        }
    }
}
```

### 常见陷阱

```csharp
class CommonPitfalls
{
    static void Main()
    {
        // 1. 多次枚举
        var numbers = Enumerable.Range(1, 1000000).Where(n => n % 2 == 0);

        // 错误：查询执行多次
        var count = numbers.Count();   // 枚举一次
        var first = numbers.First();   // 再次枚举
        var last = numbers.Last();     // 又一次枚举

        // 正确：执行一次
        var numbersList = numbers.ToList();
        var countGood = numbersList.Count;
        var firstGood = numbersList.First();
        var lastGood = numbersList.Last();

        // 2. 循环中的闭包捕获
        var predicates = new List<Func<int, bool>>();

        // 错误：所有谓词都会使用 i = 10
        for (int i = 0; i < 10; i++)
        {
            predicates.Add(n => n > i);
        }

        // 正确：捕获本地副本
        for (int i = 0; i < 10; i++)
        {
            int local = i;
            predicates.Add(n => n > local);
        }

        // 3. 先排序后过滤
        var items = Enumerable.Range(1, 1000000);

        // 错误：排序所有项，然后过滤
        var resultBad = items
            .OrderBy(n => n)
            .Where(n => n % 100 == 0)
            .ToList();

        // 正确：先过滤，再对更少的数据排序
        var resultGood = items
            .Where(n => n % 100 == 0)
            .OrderBy(n => n)
            .ToList();

        // 4. 查询中的字符串比较
        List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

        // 区分大小写
        var exactMatch = names.Where(n => n == "alice").ToList(); // 空

        // 不区分大小写
        var caseInsensitive = names.Where(n =>
            n.Equals("alice", StringComparison.OrdinalIgnoreCase)).ToList();
    }
}
```

### 测试 LINQ 查询

```csharp
using System;
using System.Linq;
using System.Collections.Generic;

class LinqTesting
{
    // 可测试的方法
    public static List<Customer> GetActiveCustomers(
        IEnumerable<Customer> customers,
        DateTime sinceDate)
    {
        return customers
            .Where(c => c.Orders.Any(o => o.OrderDate >= sinceDate))
            .OrderByDescending(c => c.Orders.Sum(o => o.TotalAmount))
            .ToList();
    }

    // 测试示例
    static void TestGetActiveCustomers()
    {
        // 准备
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

        // 执行
        var result = GetActiveCustomers(testCustomers, DateTime.Now.AddDays(-30));

        // 断言
        Console.WriteLine($"活跃客户: {result.Count}"); // 应该是 1（Alice）
        Console.WriteLine($"第一个客户: {result.First().Name}"); // 应该是 Alice
    }
}
```

### 关键要点

1. **选择正确的语法**：对连接和多数据源使用查询语法；对大多数其他操作使用方法语法。

2. **理解延迟执行**：了解查询何时执行，在需要时使用 `ToList()`、`ToArray()` 或 `Count()` 强制立即执行。

3. **性能优化**：
   - 先过滤后排序
   - 使用投影只选择需要的字段
   - 避免多次枚举
   - 对只读的 EF 查询使用 `AsNoTracking()`

4. **LINQ to Entities 特定**：
   - 使用 `Include()` 和 `ThenInclude()` 避免 N+1 查询
   - 对数据库操作使用异步方法
   - 注意什么能被翻译成 SQL

5. **编写可测试的代码**：将 LINQ 查询提取到接受 `IEnumerable<T>` 或 `IQueryable<T>` 的方法中，便于测试。

6. **处理边界情况**：始终考虑空集合，适当时使用 `FirstOrDefault()`、`SingleOrDefault()`。

## 总结

LINQ 是一个强大的功能，它将查询能力直接引入 C#。无论你是处理内存集合（LINQ to Objects）还是数据库（LINQ to Entities），掌握 LINQ 将使你的代码更易读、更易维护、更具表现力。

需要记住的关键概念：
- 查询语法和方法语法各有其用途
- 延迟执行可以提高性能，但需要理解其工作原理
- 丰富的操作符集合用于过滤、投影、分组和聚合
- Entity Framework 将 LINQ 翻译成 SQL 用于数据库操作
- 性能优化对生产应用至关重要

通过理解这些概念并遵循最佳实践，你可以利用 LINQ 在 C# 应用程序中编写优雅高效的数据访问代码。
