---
title: "C# Expression Trees: Metaprogramming and Advanced Patterns"
description: "Master C# expression trees: build runtime-compiled expressions, create dynamic queries, implement custom ORM logic, and leverage LINQ to Objects/SQL integration"
track: csharp
section: types-linq
difficulty: advanced
tags:
  - expression trees
  - lambda expressions
  - LINQ
  - metaprogramming
  - reflection
  - dynamic queries
status: imported
origin: old/src/content/docs/csharp/expression-trees.en.md
divergence: 0.141
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: csharp
  subcategory: ""
  order: 28
  lastUpdated: 2026-01-07
---

Expression trees are one of C#'s most powerful yet misunderstood features. They allow you to represent code as data, enabling runtime introspection, dynamic query building, and sophisticated compile-time-to-runtime transformation patterns. This comprehensive guide explores expression trees from fundamentals through advanced real-world patterns used in ORMs, dynamic LINQ, and metaprogramming frameworks.

## Concept Introduction

Expression trees are abstract syntax trees (ASTs) that represent code in a tree structure. Unlike regular lambda expressions that compile directly to IL code, expression trees can be analyzed and manipulated at runtime before compilation. This enables scenarios impossible with traditional reflection or dynamic code generation.

### Expression Trees vs. Lambda Expressions

```csharp
// Traditional lambda expression - compiled directly to IL
Func<int, int, int> lambdaAdd = (a, b) => a + b;
int result = lambdaAdd(5, 3);  // 8

// Expression tree - represented as data structure
Expression<Func<int, int, int>> exprAdd = (a, b) => a + b;

// Can compile the expression tree to a delegate
Func<int, int, int> compiled = exprAdd.Compile();
result = compiled(5, 3);  // 8

// But we can also inspect the structure
Console.WriteLine(exprAdd);  // Output: (a, b) => (a + b)
Console.WriteLine(exprAdd.Body.NodeType);  // Add
```

The key distinction:
- **Lambda expressions** (`Func<T>`) are compiled executable code
- **Expression trees** (`Expression<Func<T>>`) are data structures representing code
- Expression trees can be compiled on-demand, translated, or modified

### Real-World Scenarios

Expression trees power many modern frameworks:

1. **LINQ Providers**: Entity Framework builds SQL queries from expression trees
2. **Validation Frameworks**: FluentValidation uses them for rule composition
3. **AutoMapper**: Builds type mappings at runtime
4. **Dynamic Proxies**: Castle DynamicProxy intercepts calls using expression tree rewriting
5. **ORM Systems**: Custom query builders and dynamic filtering

## Core Principles

### Expression Tree Anatomy

Every expression tree has a specific structure:

```csharp
using System;
using System.Linq.Expressions;

// Simple expression: x => x * 2
Expression<Func<int, int>> doubleExpr = x => x * 2;

// Anatomy:
// - Body: The actual expression (x * 2)
// - Parameters: Function parameters (x)
// - ReturnType: Func<int, int> -> returns int
// - Type: The full type (Expression<Func<int, int>>)

Console.WriteLine($"Body: {doubleExpr.Body}");           // (x * 2)
Console.WriteLine($"Parameters: {doubleExpr.Parameters.Count}");  // 1
Console.WriteLine($"Return Type: {doubleExpr.ReturnType}");       // System.Int32

// Navigate the tree
var binaryExpr = doubleExpr.Body as BinaryExpression;
Console.WriteLine($"Left: {binaryExpr.Left}");           // x
Console.WriteLine($"Operator: {binaryExpr.NodeType}");   // Multiply
Console.WriteLine($"Right: {binaryExpr.Right}");         // 2
```

### Expression Types

Expression trees consist of different node types:

```csharp
// Binary operations
Expression<Func<int, int, int>> binary = (a, b) => a + b;  // BinaryExpression

// Unary operations
Expression<Func<int, int>> unary = x => -x;  // UnaryExpression

// Method calls
Expression<Func<string, int>> methodCall = s => s.Length;  // MethodCallExpression

// Member access
Expression<Func<DateTime, int>> memberAccess = d => d.Year;  // MemberExpression

// Constants
Expression<Func<int>> constant = () => 42;  // ConstantExpression

// Conditional (ternary)
Expression<Func<int, string>> conditional = x => x > 0 ? "positive" : "non-positive";

// Parameters
Expression<Func<int, int>> parameter = x => x;  // ParameterExpression

// Invocation (lambda invocation)
Expression<Func<Func<int, int>, int, int>> invocation = (f, x) => f(x);
```

### Expression Compilation

Expression trees must be compiled before execution:

```csharp
// Create expression tree
Expression<Func<int, int, int>> addExpr = (a, b) => a + b;

// Compile to delegate
Func<int, int, int> addDelegate = addExpr.Compile();

// Execute
int result = addDelegate(10, 20);  // 30
Console.WriteLine(result);

// Compilation is not free - compile once, reuse many times
var stopwatch = System.Diagnostics.Stopwatch.StartNew();
for (int i = 0; i < 1000000; i++)
{
    var compiled = addExpr.Compile();  // Expensive!
}
stopwatch.Stop();
Console.WriteLine($"1M compilations: {stopwatch.ElapsedMilliseconds}ms");

stopwatch.Restart();
for (int i = 0; i < 1000000; i++)
{
    addDelegate(5, 10);  // Much faster
}
stopwatch.Stop();
Console.WriteLine($"1M executions: {stopwatch.ElapsedMilliseconds}ms");
```

## Key Points

- **Expression trees are data**: They represent code structure, not executable code
- **Immutability**: Expression trees are immutable; modification requires creating new instances
- **Compilation overhead**: Compiling expression trees to delegates is expensive, cache compiled delegates
- **LINQ provider integration**: LINQ providers intercept expression trees before compilation
- **Visitor pattern**: Tree traversal and manipulation use the Visitor design pattern
- **Type safety**: Strong typing enables compile-time validation of expression structure
- **Performance trade-off**: Runtime flexibility comes at the cost of performance vs. compiled code
- **Reflection alternative**: Expression trees provide better performance than reflection for repeated operations
- **Method chaining**: Fluent expression building APIs simplify tree construction
- **Delegates vs. Expressions**: Use `Func<T>` when you need execution; use `Expression<Func<T>>` when you need analysis

## Code Examples

### Building Expression Trees Manually

```csharp
using System;
using System.Linq.Expressions;

// Create expression tree for: (x, y) => x * y + 10
var xParam = Expression.Parameter(typeof(int), "x");
var yParam = Expression.Parameter(typeof(int), "y");

var multiply = Expression.Multiply(xParam, yParam);
var constant10 = Expression.Constant(10);
var add = Expression.Add(multiply, constant10);

var lambda = Expression.Lambda<Func<int, int, int>>(
    add,
    xParam, yParam
);

var compiled = lambda.Compile();
Console.WriteLine(compiled(3, 4));  // (3 * 4) + 10 = 22
```

### Expression Tree Visitor Pattern

```csharp
using System;
using System.Linq.Expressions;

// Custom visitor to transform expressions
public class ParameterReplacer : ExpressionVisitor
{
    private readonly ParameterExpression _oldParameter;
    private readonly ParameterExpression _newParameter;

    public ParameterReplacer(ParameterExpression oldParam, ParameterExpression newParam)
    {
        _oldParameter = oldParam;
        _newParameter = newParam;
    }

    protected override Expression VisitParameter(ParameterExpression node)
    {
        return node == _oldParameter ? _newParameter : base.VisitParameter(node);
    }
}

// Usage
var xParam = Expression.Parameter(typeof(int), "x");
var yParam = Expression.Parameter(typeof(int), "y");
var expr = Expression.Lambda<Func<int, int>>(
    Expression.Add(xParam, xParam),
    xParam
);

// Replace parameter x with y
var replacer = new ParameterReplacer(xParam, yParam);
var newExpr = replacer.Visit(expr.Body);
Console.WriteLine($"Original: {expr}");  // x => (x + x)
Console.WriteLine($"Replaced: {newExpr}");  // (y + y)
```

### Dynamic Query Building

```csharp
using System;
using System.Linq.Expressions;
using System.Collections.Generic;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
}

public class DynamicQueryBuilder
{
    // Build dynamic filter predicates
    public static Expression<Func<T, bool>> BuildPredicate<T>(
        string propertyName,
        string comparisonOperator,
        object value)
    {
        var param = Expression.Parameter(typeof(T), "x");
        var property = Expression.Property(param, propertyName);
        var constant = Expression.Constant(value);

        Expression comparison = comparisonOperator switch
        {
            "==" => Expression.Equal(property, constant),
            "!=" => Expression.NotEqual(property, constant),
            ">" => Expression.GreaterThan(property, constant),
            ">=" => Expression.GreaterThanOrEqual(property, constant),
            "<" => Expression.LessThan(property, constant),
            "<=" => Expression.LessThanOrEqual(property, constant),
            "contains" => Expression.Call(
                property,
                typeof(string).GetMethod("Contains", new[] { typeof(string) }),
                Expression.Constant(value)
            ),
            _ => throw new ArgumentException($"Unsupported operator: {comparisonOperator}")
        };

        return Expression.Lambda<Func<T, bool>>(comparison, param);
    }

    // Combine multiple predicates with AND
    public static Expression<Func<T, bool>> CombineWith<T>(
        Expression<Func<T, bool>> expr1,
        Expression<Func<T, bool>> expr2,
        Func<Expression, Expression, Expression> combiner)
    {
        var param = Expression.Parameter(typeof(T), "x");

        // Replace parameters in both expressions
        var replacer1 = new ParameterReplacer(expr1.Parameters[0], param);
        var replacer2 = new ParameterReplacer(expr2.Parameters[0], param);

        var body1 = replacer1.Visit(expr1.Body);
        var body2 = replacer2.Visit(expr2.Body);

        var combined = combiner(body1, body2);

        return Expression.Lambda<Func<T, bool>>(combined, param);
    }
}

// Usage
var products = new List<Product>
{
    new Product { Id = 1, Name = "Laptop", Price = 1000m, CategoryId = 1 },
    new Product { Id = 2, Name = "Mouse", Price = 25m, CategoryId = 2 },
    new Product { Id = 3, Name = "Keyboard", Price = 75m, CategoryId = 2 },
};

// Build dynamic predicates
var priceFilter = DynamicQueryBuilder.BuildPredicate<Product>("Price", ">", 50m);
var nameFilter = DynamicQueryBuilder.BuildPredicate<Product>("Name", "contains", "o");

// Combine predicates
var combined = DynamicQueryBuilder.CombineWith(
    priceFilter,
    nameFilter,
    Expression.AndAlso
);

var filtered = products.AsEnumerable()
    .Where(combined.Compile())
    .ToList();

Console.WriteLine("Products matching criteria:");
foreach (var p in filtered)
{
    Console.WriteLine($"  {p.Name}: ${p.Price}");
}
```

### Expression Tree Inspection

```csharp
using System;
using System.Linq.Expressions;

public class ExpressionInspector : ExpressionVisitor
{
    private int _depth = 0;

    public void Inspect<T>(Expression<T> expression)
    {
        Console.WriteLine($"Expression: {expression}");
        Console.WriteLine("Tree structure:");
        _depth = 0;
        Visit(expression.Body);
    }

    public override Expression Visit(Expression node)
    {
        if (node != null)
        {
            Console.WriteLine(
                new string(' ', _depth * 2) +
                $"{node.NodeType}: {node.Type}"
            );
        }

        _depth++;
        var result = base.Visit(node);
        _depth--;

        return result;
    }
}

// Usage
Expression<Func<int, int, int>> expr = (x, y) => (x + y) * 2;
var inspector = new ExpressionInspector();
inspector.Inspect(expr);

/* Output:
Expression: (x, y) => ((x + y) * 2)
Tree structure:
  Lambda: System.Int32
    Multiply: System.Int32
      Add: System.Int32
        Parameter: System.Int32
        Parameter: System.Int32
      Constant: System.Int32
*/
```

### Dynamic Property Accessor Generation

```csharp
using System;
using System.Linq.Expressions;

public class PropertyAccessor<T>
{
    private readonly Func<T, object> _getter;
    private readonly Action<T, object> _setter;
    private readonly string _propertyName;

    public PropertyAccessor(string propertyName)
    {
        _propertyName = propertyName;
        var property = typeof(T).GetProperty(propertyName);

        if (property == null)
            throw new ArgumentException($"Property {propertyName} not found on {typeof(T).Name}");

        // Build getter: obj => (object)obj.PropertyName
        var param = Expression.Parameter(typeof(T), "obj");
        var propAccess = Expression.Property(param, property);
        var converted = Expression.Convert(propAccess, typeof(object));
        _getter = Expression.Lambda<Func<T, object>>(converted, param).Compile();

        // Build setter: (obj, value) => obj.PropertyName = (T)value
        var setParam = Expression.Parameter(typeof(T), "obj");
        var valueParam = Expression.Parameter(typeof(object), "value");
        var convertedValue = Expression.Convert(valueParam, property.PropertyType);
        var assignment = Expression.Assign(
            Expression.Property(setParam, property),
            convertedValue
        );
        _setter = Expression.Lambda<Action<T, object>>(assignment, setParam, valueParam).Compile();
    }

    public object Get(T instance) => _getter(instance);
    public void Set(T instance, object value) => _setter(instance, value);
}

// Usage
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
}

var accessor = new PropertyAccessor<Person>("Name");
var person = new Person { Name = "John", Age = 30 };

Console.WriteLine(accessor.Get(person));  // John
accessor.Set(person, "Jane");
Console.WriteLine(person.Name);  // Jane
```

### LINQ Provider Implementation Basics

```csharp
using System;
using System.Linq.Expressions;
using System.Linq;
using System.Collections.Generic;

// Simplified LINQ provider that translates to human-readable SQL
public class SimpleQueryTranslator : ExpressionVisitor
{
    private string _sqlQuery = "";

    public string Translate(Expression expression)
    {
        _sqlQuery = "";
        Visit(expression);
        return _sqlQuery;
    }

    protected override Expression VisitMethodCall(MethodCallExpression node)
    {
        if (node.Method.DeclaringType == typeof(Queryable))
        {
            switch (node.Method.Name)
            {
                case "Where":
                    _sqlQuery += "SELECT * FROM ... WHERE ";
                    Visit(node.Arguments[1]);
                    break;

                case "Select":
                    _sqlQuery += "SELECT ";
                    Visit(node.Arguments[1]);
                    break;

                case "OrderBy":
                    _sqlQuery += " ORDER BY ";
                    Visit(node.Arguments[1]);
                    break;
            }
        }
        return base.VisitMethodCall(node);
    }

    protected override Expression VisitBinary(BinaryExpression node)
    {
        Visit(node.Left);

        _sqlQuery += node.NodeType switch
        {
            ExpressionType.Equal => " = ",
            ExpressionType.GreaterThan => " > ",
            ExpressionType.LessThan => " < ",
            ExpressionType.AndAlso => " AND ",
            ExpressionType.OrElse => " OR ",
            _ => $" {node.NodeType} "
        };

        Visit(node.Right);
        return node;
    }

    protected override Expression VisitMember(MemberExpression node)
    {
        _sqlQuery += node.Member.Name;
        return base.VisitMember(node);
    }

    protected override Expression VisitConstant(ConstantExpression node)
    {
        _sqlQuery += $"'{node.Value}'";
        return base.VisitConstant(node);
    }
}

// Usage
Expression<Func<Product, bool>> query = p => p.Price > 100 && p.Name.Contains("Laptop");
var translator = new SimpleQueryTranslator();
string sql = translator.Translate(query.Body);
Console.WriteLine(sql);
```

## Best Practices

### Expression Reuse and Caching

```csharp
using System;
using System.Linq.Expressions;
using System.Collections.Generic;

public class ExpressionCache<TEntity, TResult>
{
    private readonly Dictionary<string, Func<TEntity, TResult>> _cache = new();

    // Cache compiled expressions to avoid repeated compilation
    public Func<TEntity, TResult> GetOrCompile(
        string key,
        Expression<Func<TEntity, TResult>> expression)
    {
        if (!_cache.TryGetValue(key, out var compiled))
        {
            compiled = expression.Compile();
            _cache[key] = compiled;
        }

        return compiled;
    }
}

// Usage
public class ProductSelector
{
    private static readonly ExpressionCache<Product, decimal> _cache
        = new();

    public decimal GetProductPrice(Product product)
    {
        // Expression is compiled once and reused
        var priceSelector = _cache.GetOrCompile(
            "GetPrice",
            p => p.Price
        );

        return priceSelector(product);
    }
}
```

### Safe Parameter Handling

```csharp
using System;
using System.Linq.Expressions;

public class SafeExpressionBuilder
{
    // Always create fresh parameters for each expression
    public static Expression<Func<T, bool>> CreateFilter<T>(
        string propertyName,
        object value)
    {
        var param = Expression.Parameter(typeof(T), "x");
        var property = Expression.Property(param, propertyName);
        var constant = Expression.Constant(value);

        var comparison = Expression.Equal(property, constant);
        return Expression.Lambda<Func<T, bool>>(comparison, param);
    }

    // DON'T reuse parameters across expressions
    private static ParameterExpression _sharedParam;  // ANTI-PATTERN

    public static Expression<Func<T, bool>> BadCreateFilter<T>(
        string propertyName,
        object value)
    {
        // This can cause issues when combining expressions
        _sharedParam ??= Expression.Parameter(typeof(T), "x");

        var property = Expression.Property(_sharedParam, propertyName);
        var constant = Expression.Constant(value);

        var comparison = Expression.Equal(property, constant);
        return Expression.Lambda<Func<T, bool>>(comparison, _sharedParam);
    }
}
```

### Null Safety in Expression Building

```csharp
using System;
using System.Linq.Expressions;

public class NullSafeExpressionBuilder
{
    // Handle null values properly
    public static Expression<Func<T, bool>> BuildNullSafeFilter<T>(
        string propertyName,
        object value)
    {
        var param = Expression.Parameter(typeof(T), "x");
        var property = Expression.Property(param, propertyName);

        if (value == null)
        {
            // For null comparisons, use "is null" semantics
            var nullCheck = Expression.Equal(
                property,
                Expression.Constant(null)
            );
            return Expression.Lambda<Func<T, bool>>(nullCheck, param);
        }

        var constant = Expression.Constant(value);
        var comparison = Expression.Equal(property, constant);
        return Expression.Lambda<Func<T, bool>>(comparison, param);
    }

    // Validate property exists before building expression
    public static Expression<Func<T, bool>> BuildValidatedFilter<T>(
        string propertyName,
        object value)
    {
        var propertyInfo = typeof(T).GetProperty(propertyName);

        if (propertyInfo == null)
            throw new ArgumentException(
                $"Property '{propertyName}' not found on type '{typeof(T).Name}'");

        var param = Expression.Parameter(typeof(T), "x");
        var property = Expression.Property(param, propertyName);
        var constant = Expression.Constant(value);

        var comparison = Expression.Equal(property, constant);
        return Expression.Lambda<Func<T, bool>>(comparison, param);
    }
}
```

### Performance-Aware Usage

```csharp
using System;
using System.Diagnostics;
using System.Linq.Expressions;

public class PerformanceOptimizedExpressions
{
    // For simple cases, Func<T> is faster than Expression<Func<T>>
    public static void DemonstratePerfDifference()
    {
        const int iterations = 1_000_000;
        var sw = Stopwatch.StartNew();

        // Scenario 1: Compiled expression tree
        Expression<Func<int, int>> exprTree = x => x * 2;
        var compiled = exprTree.Compile();

        sw.Restart();
        for (int i = 0; i < iterations; i++)
            compiled(5);
        var exprTime = sw.ElapsedMilliseconds;

        // Scenario 2: Direct lambda
        Func<int, int> lambda = x => x * 2;

        sw.Restart();
        for (int i = 0; i < iterations; i++)
            lambda(5);
        var lambdaTime = sw.ElapsedMilliseconds;

        Console.WriteLine($"Expression tree: {exprTime}ms");
        Console.WriteLine($"Direct lambda: {lambdaTime}ms");
        Console.WriteLine($"Ratio: {exprTime / (double)lambdaTime:F2}x slower");

        // Use expression trees when you need dynamic construction
        // Use direct lambdas when the expression is static/known at compile time
    }

    // Cache expression compilation results
    public static class ExpressionCompilationCache
    {
        private static readonly Dictionary<Type, object> Cache = new();

        public static Func<T, TResult> Compile<T, TResult>(
            Expression<Func<T, TResult>> expression,
            string cacheKey)
        {
            var key = typeof(T);

            if (!Cache.ContainsKey(key))
            {
                Cache[key] = expression.Compile();
            }

            return (Func<T, TResult>)Cache[key];
        }
    }
}
```

## Common Pitfalls

### Parameter Identity Issues

```csharp
using System;
using System.Linq.Expressions;

public class ParameterPitfalls
{
    // PITFALL: Reusing parameter instances
    public static void BadParameterReuse()
    {
        var param = Expression.Parameter(typeof(int), "x");

        // These expressions share the same parameter object
        var expr1 = Expression.Lambda<Func<int, int>>(
            Expression.Add(param, Expression.Constant(1)),
            param
        );

        var expr2 = Expression.Lambda<Func<int, int>>(
            Expression.Multiply(param, Expression.Constant(2)),
            param
        );

        // When combining, this causes issues
        var combined = Expression.Invoke(expr2, expr1.Body);
        // This can lead to unexpected behavior or exceptions
    }

    // SOLUTION: Create fresh parameters
    public static void GoodParameterHandling()
    {
        // Each expression gets its own parameter
        var expr1 = Expression.Lambda<Func<int, int>>(
            Expression.Add(
                Expression.Parameter(typeof(int), "x"),
                Expression.Constant(1)
            ),
            Expression.Parameter(typeof(int), "x")
        );

        var expr2 = Expression.Lambda<Func<int, int>>(
            Expression.Multiply(
                Expression.Parameter(typeof(int), "x"),
                Expression.Constant(2)
            ),
            Expression.Parameter(typeof(int), "x")
        );

        // Safe to combine
        Console.WriteLine(expr1.Compile()(5));  // 6
        Console.WriteLine(expr2.Compile()(5));  // 10
    }
}
```

### Closure and Lambda Capture Issues

```csharp
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

public class ClosurePitfalls
{
    // PITFALL: Capturing variable that changes
    public static void BadClosure()
    {
        var expressions = new List<Expression<Func<int, bool>>>();

        for (int i = 1; i <= 3; i++)
        {
            // i is captured by reference, not value!
            expressions.Add(x => x == i);
        }

        // All expressions check against i=3 now
        var compiled = expressions.Select(e => e.Compile()).ToList();

        Console.WriteLine(compiled[0](1));  // false (expected true!)
        Console.WriteLine(compiled[1](2));  // false (expected true!)
        Console.WriteLine(compiled[2](3));  // true
    }

    // SOLUTION: Create local copy
    public static void GoodClosure()
    {
        var expressions = new List<Expression<Func<int, bool>>>();

        for (int i = 1; i <= 3; i++)
        {
            int capturedI = i;  // Local copy
            expressions.Add(x => x == capturedI);
        }

        var compiled = expressions.Select(e => e.Compile()).ToList();

        Console.WriteLine(compiled[0](1));  // true
        Console.WriteLine(compiled[1](2));  // true
        Console.WriteLine(compiled[2](3));  // true
    }

    // SOLUTION 2: Use expression constants explicitly
    public static void ExplicitConstant()
    {
        var expressions = new List<Expression<Func<int, bool>>>();

        for (int i = 1; i <= 3; i++)
        {
            var param = Expression.Parameter(typeof(int), "x");
            var comparison = Expression.Equal(
                param,
                Expression.Constant(i)  // Constant captured here
            );
            expressions.Add(
                Expression.Lambda<Func<int, bool>>(comparison, param)
            );
        }

        var compiled = expressions.Select(e => e.Compile()).ToList();

        Console.WriteLine(compiled[0](1));  // true
        Console.WriteLine(compiled[1](2));  // true
        Console.WriteLine(compiled[2](3));  // true
    }
}
```

### Type Mismatch Errors

```csharp
using System;
using System.Linq.Expressions;

public class TypeMismatchPitfalls
{
    // PITFALL: Incompatible types in operations
    public static void BadTypeHandling()
    {
        var param = Expression.Parameter(typeof(int), "x");
        var stringConstant = Expression.Constant("5");

        try
        {
            // This throws: binary operation on int and string
            var addition = Expression.Add(param, stringConstant);
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            // Operand types 'Int32' and 'String' are incompatible
        }
    }

    // SOLUTION: Perform necessary conversions
    public static void GoodTypeHandling()
    {
        var param = Expression.Parameter(typeof(int), "x");
        var stringValue = "5";
        var intValue = int.Parse(stringValue);
        var intConstant = Expression.Constant(intValue);

        var addition = Expression.Add(param, intConstant);
        var expr = Expression.Lambda<Func<int, int>>(addition, param);

        Console.WriteLine(expr.Compile()(3));  // 8
    }

    // SOLUTION 2: Use Convert for type coercion in expression tree
    public static void ExpressionConversion()
    {
        var param = Expression.Parameter(typeof(object), "obj");
        var converted = Expression.Convert(param, typeof(int));
        var incremented = Expression.Increment(converted);

        var expr = Expression.Lambda<Func<object, int>>(incremented, param);
        Console.WriteLine(expr.Compile()(5));  // 6
    }
}
```

### Compilation Overhead

```csharp
using System;
using System.Diagnostics;
using System.Linq.Expressions;

public class CompilationOverheadPitfalls
{
    // PITFALL: Compiling the same expression repeatedly
    public static void IneffientCompilation()
    {
        var expression = (Expression<Func<int, int>>)(x => x * 2);

        var sw = Stopwatch.StartNew();

        // Compiling 1000 times is very expensive!
        for (int i = 0; i < 1000; i++)
        {
            var compiled = expression.Compile();
            compiled(5);
        }

        sw.Stop();
        Console.WriteLine($"Inefficient: {sw.ElapsedMilliseconds}ms");
    }

    // SOLUTION: Compile once and cache
    public static void EfficientCompilation()
    {
        var expression = (Expression<Func<int, int>>)(x => x * 2);
        var compiled = expression.Compile();  // Compile once

        var sw = Stopwatch.StartNew();

        for (int i = 0; i < 1000; i++)
        {
            compiled(5);  // Reuse compiled delegate
        }

        sw.Stop();
        Console.WriteLine($"Efficient: {sw.ElapsedMilliseconds}ms");
    }

    // SOLUTION: Use compilation cache
    public static class CachedExpressionCompiler
    {
        private static readonly Dictionary<string, object> Cache = new();

        public static Func<T, TResult> GetOrCompile<T, TResult>(
            Expression<Func<T, TResult>> expression,
            string cacheKey)
        {
            lock (Cache)
            {
                if (!Cache.TryGetValue(cacheKey, out var cached))
                {
                    cached = expression.Compile();
                    Cache[cacheKey] = cached;
                }

                return (Func<T, TResult>)cached;
            }
        }
    }
}
```

## Performance Considerations

### Expression Compilation Performance

```csharp
using System;
using System.Diagnostics;
using System.Linq.Expressions;

public class CompilationPerformance
{
    public static void CompileTimeMeasurement()
    {
        // Simple expression
        Expression<Func<int, int>> simple = x => x + 1;

        // Complex expression
        Expression<Func<int, bool>> complex = x =>
            (x > 10 && x < 100) ||
            (x > 1000 && x < 10000) ||
            (x == 42);

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 10000; i++)
            simple.Compile();
        sw.Stop();
        Console.WriteLine($"Simple compilation x10000: {sw.ElapsedMilliseconds}ms");

        sw.Restart();
        for (int i = 0; i < 10000; i++)
            complex.Compile();
        sw.Stop();
        Console.WriteLine($"Complex compilation x10000: {sw.ElapsedMilliseconds}ms");

        // Key insight: Compilation is expensive
        // For hot paths, compile once and cache
        var compiledSimple = simple.Compile();
        var compiledComplex = complex.Compile();

        sw.Restart();
        for (int i = 0; i < 1_000_000; i++)
        {
            compiledSimple(5);
            compiledComplex(42);
        }
        sw.Stop();
        Console.WriteLine($"Execution x1M: {sw.ElapsedMilliseconds}ms");
    }
}

public class ExpressionVsReflectionPerformance
{
    public class Product
    {
        public string Name { get; set; }
    }

    public static void PerformanceComparison()
    {
        var product = new Product { Name = "Laptop" };
        const int iterations = 1_000_000;

        // Method 1: Direct property access
        var sw = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var name = product.Name;
        }
        sw.Stop();
        var directTime = sw.ElapsedMilliseconds;

        // Method 2: Reflection
        var property = typeof(Product).GetProperty("Name");
        sw.Restart();
        for (int i = 0; i < iterations; i++)
        {
            var name = property.GetValue(product);
        }
        sw.Stop();
        var reflectionTime = sw.ElapsedMilliseconds;

        // Method 3: Expression tree (one-time compilation)
        var param = Expression.Parameter(typeof(Product));
        var propAccess = Expression.Property(param, "Name");
        var getter = Expression.Lambda<Func<Product, string>>(propAccess, param).Compile();

        sw.Restart();
        for (int i = 0; i < iterations; i++)
        {
            var name = getter(product);
        }
        sw.Stop();
        var exprTime = sw.ElapsedMilliseconds;

        Console.WriteLine($"Direct:     {directTime}ms");
        Console.WriteLine($"Reflection: {reflectionTime}ms ({reflectionTime / (double)directTime:F1}x slower)");
        Console.WriteLine($"Expression: {exprTime}ms ({exprTime / (double)directTime:F1}x slower)");

        // Expression trees are 10-100x faster than reflection!
    }
}
```

### Memory Considerations

```csharp
using System;
using System.Linq.Expressions;

public class ExpressionMemoryConsiderations
{
    public static void ExpressionTreeSize()
    {
        // Simple expression tree
        var simple = (Expression<Func<int, int>>)(x => x + 1);

        // Complex expression tree
        var complex = (Expression<Func<int, int>>)(x =>
            ((x + 1) * (x - 1) * (x + 2) * (x - 2)) +
            ((x * x * x) - (x * x * x * x))
        );

        Console.WriteLine($"Simple expression: {GC.GetTotalMemory(true)} bytes");
        var temp1 = simple;

        Console.WriteLine($"Complex expression: {GC.GetTotalMemory(true)} bytes");
        var temp2 = complex;

        // Each node in the tree consumes memory
        // Large dynamic expressions can consume significant memory
        // Strategy: Cache compiled expressions rather than recreating them
    }

    // Best practice: Lazy compilation with caching
    public static class LazyExpressionCompiler
    {
        private static readonly Dictionary<int, object> _compiled = new();

        public static Func<T, TResult> GetCompiled<T, TResult>(
            Lazy<Expression<Func<T, TResult>>> lazyExpr,
            int id)
        {
            lock (_compiled)
            {
                if (!_compiled.TryGetValue(id, out var cached))
                {
                    cached = lazyExpr.Value.Compile();
                    _compiled[id] = cached;
                }

                return (Func<T, TResult>)cached;
            }
        }
    }
}
```

## Real-world Scenarios

### Dynamic ORM Query Builder

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

public class SimpleDynamicORM
{
    public class Repository<T> where T : class
    {
        private readonly List<T> _data;

        public Repository(List<T> data)
        {
            _data = data;
        }

        // Dynamic filtering with multiple conditions
        public List<T> FindBy(Dictionary<string, object> filters)
        {
            Expression<Func<T, bool>> expression = null;

            foreach (var filter in filters)
            {
                var predicate = BuildPredicate<T>(filter.Key, filter.Value);

                expression = expression == null
                    ? predicate
                    : CombinePredicates(expression, predicate, ExpressionType.AndAlso);
            }

            return expression == null
                ? _data
                : _data.Where(expression.Compile()).ToList();
        }

        private Expression<Func<T, bool>> BuildPredicate<TEntity>(
            string propertyName,
            object value)
        {
            var param = Expression.Parameter(typeof(TEntity), "x");
            var property = Expression.Property(param, propertyName);
            var constant = Expression.Constant(value);
            var equality = Expression.Equal(property, constant);

            return Expression.Lambda<Func<TEntity, bool>>(equality, param);
        }

        private Expression<Func<T, bool>> CombinePredicates(
            Expression<Func<T, bool>> expr1,
            Expression<Func<T, bool>> expr2,
            ExpressionType expressionType)
        {
            var param = Expression.Parameter(typeof(T));

            var replacer1 = new ParameterReplacer(expr1.Parameters[0], param);
            var replacer2 = new ParameterReplacer(expr2.Parameters[0], param);

            var body1 = replacer1.Visit(expr1.Body);
            var body2 = replacer2.Visit(expr2.Body);

            var combined = expressionType == ExpressionType.AndAlso
                ? Expression.AndAlso((BinaryExpression)body1, (BinaryExpression)body2)
                : Expression.OrElse((BinaryExpression)body1, (BinaryExpression)body2);

            return Expression.Lambda<Func<T, bool>>(combined, param);
        }
    }

    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
    }

    public static void Demo()
    {
        var users = new List<User>
        {
            new User { Id = 1, Name = "Alice", Age = 25 },
            new User { Id = 2, Name = "Bob", Age = 30 },
            new User { Id = 3, Name = "Charlie", Age = 25 },
        };

        var repo = new Repository<User>(users);

        var result = repo.FindBy(new Dictionary<string, object>
        {
            { "Age", 25 }
        });

        Console.WriteLine("Users aged 25:");
        foreach (var user in result)
            Console.WriteLine($"  {user.Name}");
    }
}

public class ParameterReplacer : ExpressionVisitor
{
    private readonly ParameterExpression _oldParameter;
    private readonly ParameterExpression _newParameter;

    public ParameterReplacer(ParameterExpression oldParam, ParameterExpression newParam)
    {
        _oldParameter = oldParam;
        _newParameter = newParam;
    }

    protected override Expression VisitParameter(ParameterExpression node)
    {
        return node == _oldParameter ? _newParameter : base.VisitParameter(node);
    }
}
```

### Validation Rule Engine

```csharp
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

public class ValidationEngine<T> where T : class
{
    private readonly List<ValidationRule<T>> _rules = new();

    public void AddRule(
        string ruleName,
        Expression<Func<T, bool>> condition,
        string errorMessage)
    {
        _rules.Add(new ValidationRule<T>
        {
            Name = ruleName,
            Condition = condition,
            ErrorMessage = errorMessage,
            Compiled = condition.Compile()
        });
    }

    public ValidationResult Validate(T entity)
    {
        var result = new ValidationResult();

        foreach (var rule in _rules)
        {
            if (!rule.Compiled(entity))
            {
                result.Errors.Add(new ValidationError
                {
                    Rule = rule.Name,
                    Message = rule.ErrorMessage
                });
            }
        }

        return result;
    }

    public class ValidationRule<TEntity>
    {
        public string Name { get; set; }
        public Expression<Func<TEntity, bool>> Condition { get; set; }
        public string ErrorMessage { get; set; }
        public Func<TEntity, bool> Compiled { get; set; }
    }

    public class ValidationResult
    {
        public List<ValidationError> Errors { get; set; } = new();
        public bool IsValid => Errors.Count == 0;
    }

    public class ValidationError
    {
        public string Rule { get; set; }
        public string Message { get; set; }
    }
}

// Usage
public class User
{
    public string Email { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
}

public static void ValidationDemo()
{
    var validator = new ValidationEngine<User>();

    validator.AddRule(
        "EmailRequired",
        u => !string.IsNullOrEmpty(u.Email),
        "Email is required"
    );

    validator.AddRule(
        "NameRequired",
        u => !string.IsNullOrEmpty(u.Name),
        "Name is required"
    );

    validator.AddRule(
        "AgeValid",
        u => u.Age >= 18 && u.Age <= 120,
        "Age must be between 18 and 120"
    );

    var user = new User { Email = "", Name = "John", Age = 25 };
    var result = validator.Validate(user);

    if (!result.IsValid)
    {
        Console.WriteLine("Validation errors:");
        foreach (var error in result.Errors)
            Console.WriteLine($"  {error.Rule}: {error.Message}");
    }
}
```

### Expression-Based Mapper

```csharp
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

public class ExpressionMapper<TSource, TDestination>
{
    private readonly Dictionary<string, Expression> _mappings = new();

    public void Map<TProperty>(
        Expression<Func<TDestination, TProperty>> destinationSelector,
        Expression<Func<TSource, TProperty>> sourceSelector)
    {
        var propName = GetPropertyName(destinationSelector);
        _mappings[propName] = sourceSelector.Body;
    }

    public Func<TSource, TDestination> Compile()
    {
        var sourceParam = Expression.Parameter(typeof(TSource), "src");
        var bindings = new List<MemberBinding>();

        foreach (var kvp in _mappings)
        {
            var property = typeof(TDestination).GetProperty(kvp.Key);
            var valueExpr = ReplaceParameter(kvp.Value, sourceParam);

            bindings.Add(
                Expression.Bind(property, valueExpr)
            );
        }

        var memberInit = Expression.MemberInit(
            Expression.New(typeof(TDestination)),
            bindings
        );

        return Expression.Lambda<Func<TSource, TDestination>>(memberInit, sourceParam).Compile();
    }

    private string GetPropertyName<TProperty>(
        Expression<Func<TDestination, TProperty>> expression)
    {
        if (expression.Body is MemberExpression member)
            return member.Member.Name;

        throw new ArgumentException("Invalid property selector");
    }

    private Expression ReplaceParameter(Expression expression, ParameterExpression newParam)
    {
        var visitor = new ParameterReplacer(
            expression is LambdaExpression lambda ? lambda.Parameters[0] : null,
            newParam
        );
        return visitor.Visit(expression);
    }
}

// Usage
public class PersonDTO
{
    public string FullName { get; set; }
    public int Age { get; set; }
}

public class Person
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public int Age { get; set; }
}

public static void MapperDemo()
{
    var mapper = new ExpressionMapper<Person, PersonDTO>();

    mapper.Map(
        dest => dest.FullName,
        src => src.FirstName + " " + src.LastName
    );

    mapper.Map(
        dest => dest.Age,
        src => src.Age
    );

    var mapFunc = mapper.Compile();

    var person = new Person { FirstName = "John", LastName = "Doe", Age = 30 };
    var dto = mapFunc(person);

    Console.WriteLine($"Mapped: {dto.FullName}, Age: {dto.Age}");
    // Output: Mapped: John Doe, Age: 30
}
```

## Interview Points

1. **What are expression trees and how do they differ from regular lambdas?**
   - Expression trees represent code as data structures (ASTs), while lambdas are compiled executable code
   - Expression trees can be analyzed, translated, or modified at runtime
   - Expression trees must be compiled to execute

2. **How would you build a dynamic filter predicate using expression trees?**
   - Use `Expression.Parameter()` to create parameter
   - Use `Expression.Property()` to access properties
   - Use binary expression methods (`Expression.Equal()`, `Expression.GreaterThan()`, etc.)
   - Combine with `Expression.Lambda()` and compile

3. **What is the visitor pattern and how is it used with expression trees?**
   - Visitor pattern separates algorithms from object structures
   - `ExpressionVisitor` base class allows traversing and modifying expression trees
   - Override `Visit*` methods to handle specific expression types
   - Common in LINQ providers for query translation

4. **Explain parameter identity issues in expression trees**
   - Parameters are reference objects; reusing the same parameter instance across expressions causes issues
   - When combining expressions, parameters must be replaced to maintain identity
   - Use `ParameterReplacer` or `ExpressionVisitor` to safely combine expressions

5. **What are the performance implications of expression trees?**
   - Compilation is expensive; compile once and cache results
   - Compiled expressions are 10-100x faster than reflection
   - Direct lambdas are faster than compiled expression trees for static code
   - Memory overhead increases with expression tree complexity

6. **How would you implement a LINQ provider?**
   - Derive from `IQueryProvider` interface
   - Implement query translation using expression visitors
   - Convert expression trees to provider-specific format (SQL, API calls, etc.)
   - Cache compiled expressions for performance

7. **Describe closure and parameter capture issues**
   - Variables captured in lambdas are captured by reference, not value
   - Create local copies when capturing variables in loops
   - Use `Expression.Constant()` to embed values directly in expression trees

8. **How do you combine multiple expression trees safely?**
   - Create fresh parameter for combined expression
   - Use parameter replacer to replace old parameters with new one
   - Combine using binary operators like `Expression.AndAlso()` or `Expression.OrElse()`

## Further Reading

### Official Resources

- [Expression Trees in C# (Microsoft Docs)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/expression-trees/)
- [System.Linq.Expressions Namespace (API Reference)](https://docs.microsoft.com/en-us/dotnet/api/system.linq.expressions)
- [ExpressionVisitor Class (API Reference)](https://docs.microsoft.com/en-us/dotnet/api/system.linq.expressions.expressionvisitor)

### Advanced Topics

- **Entity Framework Core**: Uses expression trees for query translation
- **Dynamic LINQ**: Advanced filtering and sorting with expression trees
- **AutoMapper**: Configuration-free object mapping using expressions
- **Validation Frameworks**: FluentValidation uses expressions for rule composition

### Key Concepts to Explore

1. **Query Providers**: Implementing custom LINQ providers
2. **Expression Rewriting**: Advanced tree transformation techniques
3. **Optimization**: Expression tree optimization and simplification
4. **Tree Traversal**: Efficient visitor patterns and tree analysis
5. **Type Safety**: Ensuring type correctness in dynamic expressions

### Recommended Books

- "C# 9.0 in a Nutshell" - Joseph Albahari (Chapter on Expression Trees)
- "LINQ in Action" - Fabrice Marguerie, Steve Eichert, Jim Wooley
- "Metaprogramming in .NET" - Kevin Hazzard, Jason Bock

### Related Technologies

- **System.Reflection**: Metadata analysis and dynamic invocation
- **Source Generators**: Compile-time code generation (C# 9+)
- **Roslyn**: .NET compiler platform for code analysis
- **IL Emission**: Direct IL code generation (advanced alternative)

## Summary

Expression trees are a sophisticated C# feature that bridges the gap between compile-time and runtime code generation. Key takeaways:

1. **Expression trees represent code as data**: Unlike lambdas, they can be inspected and modified at runtime
2. **Compilation is expensive**: Cache compiled delegates in hot paths
3. **Use visitor pattern for tree traversal**: Implement `ExpressionVisitor` for complex transformations
4. **Handle parameters carefully**: Avoid identity issues by creating fresh parameters when combining expressions
5. **Performance trade-offs**: Reflect on whether expression trees are necessary for your use case
6. **LINQ providers** are the canonical use case: They translate expressions to SQL or other formats
7. **Real-world applications** include ORM systems, validation frameworks, and dynamic query builders
8. **Type safety is maintained**: C# ensures expressions are type-correct at compile time
9. **Memory considerations**: Large expression trees consume memory; cache and reuse where possible
10. **Alternative approaches**: Consider compile-time solutions (source generators) or simpler approaches first

Master expression trees, and you unlock metaprogramming capabilities that enable sophisticated framework-level abstractions and domain-specific languages (DSLs) in C#.
