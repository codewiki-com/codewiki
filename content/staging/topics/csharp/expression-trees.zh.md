---
title: C# 表达式树详解
description: 深入理解表达式树：Expression<T>、Lambda到表达式转换、动态构建与编译、LINQ Provider原理
track: csharp
section: types-linq
difficulty: advanced
tags:
  - C#
  - 表达式树
  - LINQ
  - 动态编译
  - 元编程
status: imported
origin: old/src/content/docs/csharp/expression-trees.zh.md
divergence: 0.141
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: CSharp
  subcategory: 高级特性
  order: 28
  lastUpdated: 2026-01-07
---

表达式树（Expression Trees）是 C# 中一项强大的元编程特性，它允许你将代码表示为数据结构，从而可以在运行时分析、修改或执行代码。表达式树是 LINQ Provider（如 Entity Framework）的核心基础，也是构建动态查询、规则引擎和 DSL 的关键技术。

## 概念解释

### 什么是表达式树

表达式树是一种将代码表示为树形数据结构的技术。树中的每个节点代表一个表达式，如常量、变量、方法调用、二元运算等。与直接执行的委托不同，表达式树可以被检查、遍历和转换。

```csharp
using System;
using System.Linq.Expressions;

// Lambda 表达式（直接可执行）
Func<int, int, int> addFunc = (a, b) => a + b;
Console.WriteLine(addFunc(3, 4));  // 输出: 7

// 表达式树（代码的数据表示）
Expression<Func<int, int, int>> addExpr = (a, b) => a + b;
Console.WriteLine(addExpr);  // 输出: (a, b) => (a + b)

// 表达式树可以被编译为可执行委托
Func<int, int, int> compiledAdd = addExpr.Compile();
Console.WriteLine(compiledAdd(3, 4));  // 输出: 7
```

### 历史背景

表达式树在 C# 3.0 (2007年) 与 LINQ 一起引入，主要目的是支持 LINQ to SQL 等将 C# 查询转换为其他查询语言（如 SQL）的场景。此后，表达式树成为许多高级框架和库的基础设施。

### 解决什么问题

1. **查询翻译**：将 C# 代码转换为 SQL 或其他查询语言
2. **动态代码生成**：在运行时构建和编译代码
3. **代码分析**：检查和理解代码结构
4. **AOP 实现**：拦截和修改方法调用
5. **规则引擎**：将业务规则表示为可配置的表达式

## 核心原理

### 表达式树的内部结构

表达式树由 `System.Linq.Expressions.Expression` 及其派生类组成。每种表达式类型对应一个特定的节点类。

```csharp
using System;
using System.Linq.Expressions;

class ExpressionTreeStructure
{
    static void Main()
    {
        // 创建一个简单的表达式树: (x, y) => x + y * 2
        Expression<Func<int, int, int>> expr = (x, y) => x + y * 2;

        // 分析表达式树结构
        Console.WriteLine($"表达式类型: {expr.NodeType}");  // Lambda
        Console.WriteLine($"返回类型: {expr.ReturnType}");  // System.Int32

        // 获取 Lambda 表达式的各个部分
        LambdaExpression lambda = expr;
        Console.WriteLine($"参数数量: {lambda.Parameters.Count}");

        foreach (var param in lambda.Parameters)
        {
            Console.WriteLine($"  参数: {param.Name}, 类型: {param.Type}");
        }

        // 分析表达式体
        Console.WriteLine($"\n表达式体类型: {lambda.Body.NodeType}");  // Add

        if (lambda.Body is BinaryExpression addExpr)
        {
            Console.WriteLine($"左操作数: {addExpr.Left} ({addExpr.Left.NodeType})");
            Console.WriteLine($"右操作数: {addExpr.Right} ({addExpr.Right.NodeType})");

            if (addExpr.Right is BinaryExpression multiplyExpr)
            {
                Console.WriteLine($"  乘法左操作数: {multiplyExpr.Left}");
                Console.WriteLine($"  乘法右操作数: {multiplyExpr.Right}");
            }
        }
    }
}
```

输出：
```
表达式类型: Lambda
返回类型: System.Int32
参数数量: 2
  参数: x, 类型: System.Int32
  参数: y, 类型: System.Int32

表达式体类型: Add
左操作数: x (Parameter)
右操作数: (y * 2) (Multiply)
  乘法左操作数: y
  乘法右操作数: 2
```

### Expression<T> vs Func<T>

```csharp
public class ExpressionVsFunc
{
    // Func<T> - 编译后的委托，直接可执行
    public void UsingFunc()
    {
        Func<int, bool> isEven = x => x % 2 == 0;

        // 只能执行，无法分析内部逻辑
        bool result = isEven(4);  // true

        // 无法获取 "x % 2 == 0" 的结构信息
    }

    // Expression<T> - 代码的数据表示
    public void UsingExpression()
    {
        Expression<Func<int, bool>> isEvenExpr = x => x % 2 == 0;

        // 可以分析表达式结构
        var body = isEvenExpr.Body as BinaryExpression;
        Console.WriteLine($"操作: {body?.NodeType}");  // Equal
        Console.WriteLine($"左侧: {body?.Left}");      // (x % 2)
        Console.WriteLine($"右侧: {body?.Right}");     // 0

        // 需要时可以编译执行
        Func<int, bool> compiled = isEvenExpr.Compile();
        bool result = compiled(4);  // true
    }
}
```

### 表达式节点类型

```csharp
using System;
using System.Linq.Expressions;

class ExpressionNodeTypes
{
    static void Main()
    {
        // 1. ConstantExpression - 常量
        ConstantExpression constant = Expression.Constant(42);
        Console.WriteLine($"常量: {constant.Value}");

        // 2. ParameterExpression - 参数
        ParameterExpression param = Expression.Parameter(typeof(int), "x");
        Console.WriteLine($"参数: {param.Name}");

        // 3. BinaryExpression - 二元运算
        BinaryExpression add = Expression.Add(param, constant);
        Console.WriteLine($"加法: {add}");  // (x + 42)

        // 4. UnaryExpression - 一元运算
        UnaryExpression negate = Expression.Negate(param);
        Console.WriteLine($"取负: {negate}");  // -x

        // 5. MethodCallExpression - 方法调用
        var toStringMethod = typeof(int).GetMethod("ToString", Type.EmptyTypes);
        MethodCallExpression methodCall = Expression.Call(param, toStringMethod!);
        Console.WriteLine($"方法调用: {methodCall}");  // x.ToString()

        // 6. MemberExpression - 成员访问
        var lengthProperty = typeof(string).GetProperty("Length");
        ParameterExpression strParam = Expression.Parameter(typeof(string), "s");
        MemberExpression memberAccess = Expression.Property(strParam, lengthProperty!);
        Console.WriteLine($"属性访问: {memberAccess}");  // s.Length

        // 7. ConditionalExpression - 条件表达式
        ConditionalExpression conditional = Expression.Condition(
            Expression.GreaterThan(param, Expression.Constant(0)),
            Expression.Constant("正数"),
            Expression.Constant("非正数")
        );
        Console.WriteLine($"条件: {conditional}");  // IIF((x > 0), "正数", "非正数")

        // 8. NewExpression - 对象创建
        var ctor = typeof(DateTime).GetConstructor(new[] { typeof(int), typeof(int), typeof(int) });
        NewExpression newExpr = Expression.New(ctor!,
            Expression.Constant(2024),
            Expression.Constant(1),
            Expression.Constant(1));
        Console.WriteLine($"创建对象: {newExpr}");
    }
}
```

## 核心要点

### Lambda 表达式到表达式树的转换

当 Lambda 表达式被赋值给 `Expression<TDelegate>` 类型时，编译器会自动将其转换为表达式树。

```csharp
using System;
using System.Linq.Expressions;

class LambdaToExpression
{
    static void Main()
    {
        // 自动转换为表达式树
        Expression<Func<string, int>> getLength = s => s.Length;
        Expression<Func<int, int, bool>> isGreater = (a, b) => a > b;
        Expression<Func<string, bool>> startsWithA = s => s.StartsWith("A");

        // 复杂表达式
        Expression<Func<Person, bool>> isAdultMale =
            p => p.Age >= 18 && p.Gender == "Male";

        // 表达式树可以转换为字符串表示
        Console.WriteLine(getLength);      // s => s.Length
        Console.WriteLine(isGreater);      // (a, b) => (a > b)
        Console.WriteLine(startsWithA);    // s => s.StartsWith("A")
        Console.WriteLine(isAdultMale);    // p => ((p.Age >= 18) AndAlso (p.Gender == "Male"))
    }
}

class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public string Gender { get; set; } = "";
}
```

### 表达式树的限制

并非所有 Lambda 表达式都可以转换为表达式树：

```csharp
// 以下类型的 Lambda 无法转换为表达式树：

// 1. 包含语句块的 Lambda
// Expression<Func<int, int>> invalid1 = x => { return x * 2; };  // 编译错误

// 2. 包含赋值的 Lambda
// Expression<Action<int>> invalid2 = x => x = 10;  // 编译错误

// 3. 包含动态类型操作的 Lambda
// dynamic d = 5;
// Expression<Func<int>> invalid3 = () => d + 1;  // 编译错误

// 4. 包含 await 的 Lambda
// Expression<Func<Task<int>>> invalid4 = async () => await Task.FromResult(1);  // 编译错误

// 正确的表达式树必须是"表达式 Lambda"
Expression<Func<int, int>> valid = x => x * 2;  // 没有花括号
```

### 遍历表达式树

使用 `ExpressionVisitor` 遍历和分析表达式树：

```csharp
using System;
using System.Linq.Expressions;

// 自定义表达式访问器
public class ExpressionAnalyzer : ExpressionVisitor
{
    private int _depth = 0;

    public void Analyze(Expression expression)
    {
        Visit(expression);
    }

    public override Expression? Visit(Expression? node)
    {
        if (node == null) return null;

        string indent = new string(' ', _depth * 2);
        Console.WriteLine($"{indent}{node.NodeType}: {GetNodeDescription(node)}");

        _depth++;
        var result = base.Visit(node);
        _depth--;

        return result;
    }

    private string GetNodeDescription(Expression node)
    {
        return node switch
        {
            ConstantExpression c => $"值={c.Value}",
            ParameterExpression p => $"名称={p.Name}, 类型={p.Type.Name}",
            BinaryExpression b => $"运算符={b.NodeType}",
            MemberExpression m => $"成员={m.Member.Name}",
            MethodCallExpression mc => $"方法={mc.Method.Name}",
            LambdaExpression l => $"参数数量={l.Parameters.Count}",
            _ => node.Type.Name
        };
    }
}

class Program
{
    static void Main()
    {
        Expression<Func<int, int, bool>> expr = (x, y) => x + y > 10 && x * y < 100;

        Console.WriteLine("表达式树结构分析：");
        Console.WriteLine(new string('-', 50));

        var analyzer = new ExpressionAnalyzer();
        analyzer.Analyze(expr);
    }
}
```

## 代码示例

### 手动构建表达式树

```csharp
using System;
using System.Linq.Expressions;

class BuildExpressionManually
{
    static void Main()
    {
        // 目标: 构建表达式 (x, y) => x + y

        // 1. 创建参数表达式
        ParameterExpression paramX = Expression.Parameter(typeof(int), "x");
        ParameterExpression paramY = Expression.Parameter(typeof(int), "y");

        // 2. 创建加法表达式
        BinaryExpression addExpr = Expression.Add(paramX, paramY);

        // 3. 创建 Lambda 表达式
        Expression<Func<int, int, int>> lambda =
            Expression.Lambda<Func<int, int, int>>(addExpr, paramX, paramY);

        Console.WriteLine($"构建的表达式: {lambda}");

        // 4. 编译并执行
        Func<int, int, int> compiled = lambda.Compile();
        Console.WriteLine($"3 + 5 = {compiled(3, 5)}");
    }
}
```

### 构建复杂表达式

```csharp
using System;
using System.Linq.Expressions;
using System.Reflection;

class ComplexExpressionBuilder
{
    static void Main()
    {
        // 构建: person => person.Age >= 18 && person.Name.StartsWith("张")

        // 1. 创建参数
        ParameterExpression personParam = Expression.Parameter(typeof(Person), "person");

        // 2. 访问 Age 属性
        MemberExpression ageProperty = Expression.Property(personParam, "Age");
        ConstantExpression eighteen = Expression.Constant(18);
        BinaryExpression ageCheck = Expression.GreaterThanOrEqual(ageProperty, eighteen);

        // 3. 访问 Name 属性并调用 StartsWith
        MemberExpression nameProperty = Expression.Property(personParam, "Name");
        MethodInfo startsWithMethod = typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!;
        MethodCallExpression nameCheck = Expression.Call(
            nameProperty,
            startsWithMethod,
            Expression.Constant("张")
        );

        // 4. 组合条件
        BinaryExpression combinedCondition = Expression.AndAlso(ageCheck, nameCheck);

        // 5. 创建 Lambda
        Expression<Func<Person, bool>> predicate =
            Expression.Lambda<Func<Person, bool>>(combinedCondition, personParam);

        Console.WriteLine($"构建的表达式: {predicate}");

        // 6. 测试
        Func<Person, bool> compiled = predicate.Compile();

        var testPeople = new[]
        {
            new Person { Name = "张三", Age = 25 },
            new Person { Name = "李四", Age = 30 },
            new Person { Name = "张小明", Age = 16 },
            new Person { Name = "张伟", Age = 22 }
        };

        Console.WriteLine("\n符合条件的人：");
        foreach (var person in testPeople)
        {
            if (compiled(person))
            {
                Console.WriteLine($"  {person.Name}, {person.Age}岁");
            }
        }
    }
}

class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}
```

### 动态构建排序表达式

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

class DynamicSorting
{
    public static IOrderedQueryable<T> OrderByProperty<T>(
        IQueryable<T> source,
        string propertyName,
        bool ascending = true)
    {
        // 获取属性信息
        PropertyInfo? property = typeof(T).GetProperty(propertyName);
        if (property == null)
            throw new ArgumentException($"属性 {propertyName} 不存在");

        // 创建参数表达式: x
        ParameterExpression parameter = Expression.Parameter(typeof(T), "x");

        // 创建属性访问表达式: x.PropertyName
        MemberExpression propertyAccess = Expression.Property(parameter, property);

        // 创建 Lambda 表达式: x => x.PropertyName
        LambdaExpression orderByExpression = Expression.Lambda(propertyAccess, parameter);

        // 获取 OrderBy 或 OrderByDescending 方法
        string methodName = ascending ? "OrderBy" : "OrderByDescending";

        MethodCallExpression resultExpression = Expression.Call(
            typeof(Queryable),
            methodName,
            new Type[] { typeof(T), property.PropertyType },
            source.Expression,
            Expression.Quote(orderByExpression)
        );

        return (IOrderedQueryable<T>)source.Provider.CreateQuery<T>(resultExpression);
    }

    static void Main()
    {
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "笔记本", Price = 5999, Stock = 10 },
            new Product { Id = 2, Name = "鼠标", Price = 99, Stock = 50 },
            new Product { Id = 3, Name = "键盘", Price = 299, Stock = 30 },
            new Product { Id = 4, Name = "显示器", Price = 1999, Stock = 15 }
        }.AsQueryable();

        Console.WriteLine("按价格升序排序：");
        foreach (var p in OrderByProperty(products, "Price", true))
        {
            Console.WriteLine($"  {p.Name}: ¥{p.Price}");
        }

        Console.WriteLine("\n按库存降序排序：");
        foreach (var p in OrderByProperty(products, "Stock", false))
        {
            Console.WriteLine($"  {p.Name}: 库存 {p.Stock}");
        }

        Console.WriteLine("\n按名称升序排序：");
        foreach (var p in OrderByProperty(products, "Name", true))
        {
            Console.WriteLine($"  {p.Name}");
        }
    }
}

class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
}
```

### 表达式树组合与修改

```csharp
using System;
using System.Linq.Expressions;

// 表达式组合工具
public static class ExpressionCombiner
{
    // 组合两个条件表达式 (AND)
    public static Expression<Func<T, bool>> And<T>(
        Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        // 使用第一个表达式的参数
        var parameter = first.Parameters[0];

        // 替换第二个表达式中的参数
        var secondBody = new ParameterReplacer(second.Parameters[0], parameter)
            .Visit(second.Body);

        // 组合两个表达式体
        var combined = Expression.AndAlso(first.Body, secondBody);

        return Expression.Lambda<Func<T, bool>>(combined, parameter);
    }

    // 组合两个条件表达式 (OR)
    public static Expression<Func<T, bool>> Or<T>(
        Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        var parameter = first.Parameters[0];
        var secondBody = new ParameterReplacer(second.Parameters[0], parameter)
            .Visit(second.Body);
        var combined = Expression.OrElse(first.Body, secondBody);

        return Expression.Lambda<Func<T, bool>>(combined, parameter);
    }

    // 取反表达式
    public static Expression<Func<T, bool>> Not<T>(Expression<Func<T, bool>> expression)
    {
        var negated = Expression.Not(expression.Body);
        return Expression.Lambda<Func<T, bool>>(negated, expression.Parameters);
    }
}

// 参数替换访问器
class ParameterReplacer : ExpressionVisitor
{
    private readonly ParameterExpression _oldParameter;
    private readonly ParameterExpression _newParameter;

    public ParameterReplacer(ParameterExpression oldParameter, ParameterExpression newParameter)
    {
        _oldParameter = oldParameter;
        _newParameter = newParameter;
    }

    protected override Expression VisitParameter(ParameterExpression node)
    {
        return node == _oldParameter ? _newParameter : base.VisitParameter(node);
    }
}

class Program
{
    static void Main()
    {
        // 定义独立的条件
        Expression<Func<Person, bool>> isAdult = p => p.Age >= 18;
        Expression<Func<Person, bool>> isMale = p => p.Gender == "Male";
        Expression<Func<Person, bool>> isStudent = p => p.Occupation == "Student";

        // 组合条件
        var adultMale = ExpressionCombiner.And(isAdult, isMale);
        var adultOrStudent = ExpressionCombiner.Or(isAdult, isStudent);
        var notAdult = ExpressionCombiner.Not(isAdult);

        Console.WriteLine($"成年男性: {adultMale}");
        Console.WriteLine($"成年或学生: {adultOrStudent}");
        Console.WriteLine($"非成年: {notAdult}");

        // 测试数据
        var people = new[]
        {
            new Person { Name = "张三", Age = 25, Gender = "Male", Occupation = "Engineer" },
            new Person { Name = "李四", Age = 16, Gender = "Male", Occupation = "Student" },
            new Person { Name = "王芳", Age = 30, Gender = "Female", Occupation = "Teacher" },
            new Person { Name = "赵敏", Age = 17, Gender = "Female", Occupation = "Student" }
        };

        Console.WriteLine("\n成年男性：");
        var adultMaleFunc = adultMale.Compile();
        foreach (var p in people.Where(adultMaleFunc))
        {
            Console.WriteLine($"  {p.Name}");
        }

        Console.WriteLine("\n成年或学生：");
        var adultOrStudentFunc = adultOrStudent.Compile();
        foreach (var p in people.Where(adultOrStudentFunc))
        {
            Console.WriteLine($"  {p.Name}");
        }
    }
}

class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public string Gender { get; set; } = "";
    public string Occupation { get; set; } = "";
}
```

### 构建动态查询

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

// 动态查询构建器
public class QueryBuilder<T>
{
    private Expression<Func<T, bool>>? _predicate;

    public QueryBuilder<T> Where(Expression<Func<T, bool>> condition)
    {
        _predicate = _predicate == null
            ? condition
            : ExpressionCombiner.And(_predicate, condition);
        return this;
    }

    public QueryBuilder<T> WhereIf(bool condition, Expression<Func<T, bool>> predicate)
    {
        if (condition)
        {
            Where(predicate);
        }
        return this;
    }

    public IEnumerable<T> Apply(IEnumerable<T> source)
    {
        if (_predicate == null)
            return source;

        return source.Where(_predicate.Compile());
    }

    public IQueryable<T> Apply(IQueryable<T> source)
    {
        if (_predicate == null)
            return source;

        return source.Where(_predicate);
    }

    public Expression<Func<T, bool>> Build()
    {
        return _predicate ?? (x => true);
    }
}

// 产品搜索示例
class ProductSearch
{
    static void Main()
    {
        var products = new List<Product>
        {
            new Product { Id = 1, Name = "iPhone 15", Category = "电子产品", Price = 6999, Stock = 100, IsActive = true },
            new Product { Id = 2, Name = "MacBook Pro", Category = "电子产品", Price = 14999, Stock = 50, IsActive = true },
            new Product { Id = 3, Name = "AirPods", Category = "电子产品", Price = 1299, Stock = 200, IsActive = true },
            new Product { Id = 4, Name = "办公椅", Category = "家具", Price = 899, Stock = 30, IsActive = true },
            new Product { Id = 5, Name = "已下架产品", Category = "其他", Price = 199, Stock = 0, IsActive = false }
        };

        // 模拟搜索条件
        string? keyword = "iPhone";
        string? category = "电子产品";
        decimal? minPrice = 1000;
        decimal? maxPrice = null;
        bool onlyActive = true;
        bool onlyInStock = true;

        // 构建动态查询
        var query = new QueryBuilder<Product>()
            .WhereIf(!string.IsNullOrEmpty(keyword),
                p => p.Name.Contains(keyword!))
            .WhereIf(!string.IsNullOrEmpty(category),
                p => p.Category == category)
            .WhereIf(minPrice.HasValue,
                p => p.Price >= minPrice!.Value)
            .WhereIf(maxPrice.HasValue,
                p => p.Price <= maxPrice!.Value)
            .WhereIf(onlyActive,
                p => p.IsActive)
            .WhereIf(onlyInStock,
                p => p.Stock > 0);

        Console.WriteLine($"查询表达式: {query.Build()}");
        Console.WriteLine("\n搜索结果：");

        foreach (var product in query.Apply(products))
        {
            Console.WriteLine($"  {product.Name} - ¥{product.Price} ({product.Category})");
        }

        // 另一个搜索示例
        Console.WriteLine("\n=== 搜索所有家具 ===");
        var furnitureQuery = new QueryBuilder<Product>()
            .Where(p => p.Category == "家具")
            .Where(p => p.IsActive);

        foreach (var product in furnitureQuery.Apply(products))
        {
            Console.WriteLine($"  {product.Name} - ¥{product.Price}");
        }
    }
}

class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
}
```

## 最佳实践

### 缓存编译结果

编译表达式树是一个相对昂贵的操作，应该缓存编译后的委托。

```csharp
using System;
using System.Collections.Concurrent;
using System.Linq.Expressions;

public class ExpressionCache<TResult>
{
    private static readonly ConcurrentDictionary<string, Delegate> _cache = new();

    public static TResult Execute<T>(Expression<Func<T, TResult>> expression, T input)
    {
        // 使用表达式的字符串表示作为缓存键
        string key = expression.ToString();

        var compiled = (Func<T, TResult>)_cache.GetOrAdd(key, _ => expression.Compile());

        return compiled(input);
    }
}

// 使用示例
class CachingExample
{
    static void Main()
    {
        Expression<Func<int, int>> square = x => x * x;

        // 多次调用，只编译一次
        for (int i = 1; i <= 5; i++)
        {
            int result = ExpressionCache<int>.Execute(square, i);
            Console.WriteLine($"{i}^2 = {result}");
        }
    }
}
```

### 使用强类型成员访问

使用 `nameof` 和表达式来避免魔法字符串：

```csharp
using System;
using System.Linq.Expressions;
using System.Reflection;

public static class PropertyHelper
{
    public static string GetPropertyName<T, TProperty>(Expression<Func<T, TProperty>> expression)
    {
        if (expression.Body is MemberExpression memberExpression)
        {
            return memberExpression.Member.Name;
        }

        throw new ArgumentException("表达式必须是属性访问表达式");
    }

    public static PropertyInfo GetPropertyInfo<T, TProperty>(Expression<Func<T, TProperty>> expression)
    {
        if (expression.Body is MemberExpression memberExpression &&
            memberExpression.Member is PropertyInfo propertyInfo)
        {
            return propertyInfo;
        }

        throw new ArgumentException("表达式必须是属性访问表达式");
    }
}

class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

class Program
{
    static void Main()
    {
        // 类型安全的属性名称获取
        string propName = PropertyHelper.GetPropertyName<Person, string>(p => p.Name);
        Console.WriteLine($"属性名: {propName}");  // Name

        // 获取属性信息
        PropertyInfo propInfo = PropertyHelper.GetPropertyInfo<Person, int>(p => p.Age);
        Console.WriteLine($"属性类型: {propInfo.PropertyType}");  // System.Int32
    }
}
```

### 参数化表达式构建

```csharp
using System;
using System.Linq.Expressions;
using System.Reflection;

public static class PredicateBuilder
{
    // 创建等于条件
    public static Expression<Func<T, bool>> Equal<T, TValue>(
        Expression<Func<T, TValue>> propertySelector,
        TValue value)
    {
        var parameter = propertySelector.Parameters[0];
        var property = propertySelector.Body;
        var constant = Expression.Constant(value, typeof(TValue));
        var equals = Expression.Equal(property, constant);

        return Expression.Lambda<Func<T, bool>>(equals, parameter);
    }

    // 创建包含条件（用于字符串）
    public static Expression<Func<T, bool>> Contains<T>(
        Expression<Func<T, string>> propertySelector,
        string value)
    {
        var parameter = propertySelector.Parameters[0];
        var property = propertySelector.Body;
        var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;
        var constant = Expression.Constant(value);
        var contains = Expression.Call(property, containsMethod, constant);

        return Expression.Lambda<Func<T, bool>>(contains, parameter);
    }

    // 创建范围条件
    public static Expression<Func<T, bool>> Between<T, TValue>(
        Expression<Func<T, TValue>> propertySelector,
        TValue min,
        TValue max) where TValue : IComparable<TValue>
    {
        var parameter = propertySelector.Parameters[0];
        var property = propertySelector.Body;

        var minConstant = Expression.Constant(min, typeof(TValue));
        var maxConstant = Expression.Constant(max, typeof(TValue));

        var greaterThanOrEqual = Expression.GreaterThanOrEqual(property, minConstant);
        var lessThanOrEqual = Expression.LessThanOrEqual(property, maxConstant);
        var combined = Expression.AndAlso(greaterThanOrEqual, lessThanOrEqual);

        return Expression.Lambda<Func<T, bool>>(combined, parameter);
    }
}

class Product
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = "";
}

class Program
{
    static void Main()
    {
        // 使用参数化构建器
        var categoryFilter = PredicateBuilder.Equal<Product, string>(p => p.Category, "电子产品");
        var nameFilter = PredicateBuilder.Contains<Product, string>(p => p.Name, "Phone");
        var priceFilter = PredicateBuilder.Between<Product, decimal>(p => p.Price, 1000, 5000);

        Console.WriteLine($"类别过滤: {categoryFilter}");
        Console.WriteLine($"名称过滤: {nameFilter}");
        Console.WriteLine($"价格过滤: {priceFilter}");
    }
}
```

## 常见陷阱

### 混淆 Expression<Func> 和 Func

```csharp
public class ExpressionMistakes
{
    // 错误：使用 Func 无法被 EF Core 转换为 SQL
    public IQueryable<Product> GetProductsBad(
        IQueryable<Product> products,
        Func<Product, bool> predicate)  // 错误！
    {
        // 这会在内存中过滤，而不是在数据库
        return products.Where(predicate).AsQueryable();
    }

    // 正确：使用 Expression<Func> 可以转换为 SQL
    public IQueryable<Product> GetProductsGood(
        IQueryable<Product> products,
        Expression<Func<Product, bool>> predicate)  // 正确！
    {
        // 这会生成 SQL WHERE 子句
        return products.Where(predicate);
    }
}
```

### 忽略编译开销

```csharp
public class CompilationOverhead
{
    // 错误：每次调用都编译
    public bool IsMatchBad<T>(Expression<Func<T, bool>> expression, T value)
    {
        return expression.Compile()(value);  // 每次都编译！
    }

    // 正确：缓存编译结果
    private readonly ConcurrentDictionary<string, Delegate> _cache = new();

    public bool IsMatchGood<T>(Expression<Func<T, bool>> expression, T value)
    {
        var key = expression.ToString();
        var compiled = (Func<T, bool>)_cache.GetOrAdd(key, _ => expression.Compile());
        return compiled(value);
    }
}
```

### 参数替换错误

```csharp
public class ParameterMistakes
{
    // 错误：直接使用不同的参数表达式会导致问题
    public static Expression<Func<T, bool>> CombineWrong<T>(
        Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        // first.Parameters[0] 和 second.Parameters[0] 是不同的对象！
        var combined = Expression.AndAlso(first.Body, second.Body);

        // 这会抛出异常，因为表达式体引用了不在参数列表中的参数
        return Expression.Lambda<Func<T, bool>>(combined, first.Parameters);
    }

    // 正确：替换参数后再组合
    public static Expression<Func<T, bool>> CombineCorrect<T>(
        Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        var parameter = first.Parameters[0];

        // 将 second 中的参数替换为 first 的参数
        var visitor = new ParameterReplacer(second.Parameters[0], parameter);
        var secondBody = visitor.Visit(second.Body);

        var combined = Expression.AndAlso(first.Body, secondBody);
        return Expression.Lambda<Func<T, bool>>(combined, parameter);
    }
}
```

### 闭包变量捕获

```csharp
public class ClosureMistakes
{
    static void Main()
    {
        var filters = new List<Expression<Func<int, bool>>>();

        // 错误：循环变量捕获问题
        for (int i = 0; i < 3; i++)
        {
            // 捕获的是变量 i 的引用，不是值
            filters.Add(x => x == i);
        }

        // 所有表达式都会使用 i 的最终值 (3)
        Console.WriteLine("错误的方式：");
        foreach (var filter in filters)
        {
            Console.WriteLine(filter);  // 都是 x => (x == 3)
        }

        filters.Clear();

        // 正确：使用局部变量
        for (int i = 0; i < 3; i++)
        {
            int capturedValue = i;  // 捕获值
            filters.Add(x => x == capturedValue);
        }

        Console.WriteLine("\n正确的方式：");
        foreach (var filter in filters)
        {
            Console.WriteLine(filter);  // x => (x == 0), x => (x == 1), x => (x == 2)
        }
    }
}
```

## 性能考量

### 表达式编译性能测试

```csharp
using System;
using System.Diagnostics;
using System.Linq.Expressions;

class PerformanceTest
{
    static void Main()
    {
        const int iterations = 100000;
        Expression<Func<int, int, int>> expr = (a, b) => a + b;

        // 测试 1：每次编译
        var sw1 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var compiled = expr.Compile();
            _ = compiled(i, i);
        }
        sw1.Stop();
        Console.WriteLine($"每次编译: {sw1.ElapsedMilliseconds}ms");

        // 测试 2：编译一次，多次调用
        var sw2 = Stopwatch.StartNew();
        var compiledOnce = expr.Compile();
        for (int i = 0; i < iterations; i++)
        {
            _ = compiledOnce(i, i);
        }
        sw2.Stop();
        Console.WriteLine($"编译一次: {sw2.ElapsedMilliseconds}ms");

        // 测试 3：直接使用委托
        Func<int, int, int> directFunc = (a, b) => a + b;
        var sw3 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            _ = directFunc(i, i);
        }
        sw3.Stop();
        Console.WriteLine($"直接委托: {sw3.ElapsedMilliseconds}ms");

        Console.WriteLine($"\n编译开销: 约 {sw1.ElapsedMilliseconds / (double)iterations:F4}ms 每次");
    }
}
```

### 优化建议

1. **缓存编译结果**：使用 `ConcurrentDictionary` 缓存编译后的委托
2. **避免频繁构建**：在启动时预构建常用表达式
3. **使用表达式池**：对于相似的表达式，考虑使用对象池
4. **选择合适的场景**：简单操作直接使用委托，复杂查询翻译使用表达式树

## 实战场景

### LINQ Provider 原理示例

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

// 简化的 SQL 生成器，演示 LINQ Provider 原理
public class SimpleSqlGenerator : ExpressionVisitor
{
    private readonly List<string> _whereClauses = new();
    private readonly List<string> _selectColumns = new();
    private string _tableName = "";

    public string GenerateSql<T>(Expression<Func<T, bool>>? where = null)
    {
        _tableName = typeof(T).Name + "s";  // 简单复数化

        var sql = $"SELECT * FROM {_tableName}";

        if (where != null)
        {
            Visit(where.Body);
            if (_whereClauses.Count > 0)
            {
                sql += " WHERE " + string.Join(" AND ", _whereClauses);
            }
        }

        return sql;
    }

    protected override Expression VisitBinary(BinaryExpression node)
    {
        if (node.NodeType == ExpressionType.AndAlso)
        {
            Visit(node.Left);
            Visit(node.Right);
        }
        else
        {
            var left = GetMemberName(node.Left);
            var right = GetValue(node.Right);
            var op = GetOperator(node.NodeType);

            _whereClauses.Add($"{left} {op} {right}");
        }

        return node;
    }

    protected override Expression VisitMethodCall(MethodCallExpression node)
    {
        if (node.Method.Name == "Contains" && node.Object != null)
        {
            var member = GetMemberName(node.Object);
            var value = GetValue(node.Arguments[0]);
            _whereClauses.Add($"{member} LIKE '%{value.Trim('\'')}%'");
        }
        else if (node.Method.Name == "StartsWith")
        {
            var member = GetMemberName(node.Object!);
            var value = GetValue(node.Arguments[0]);
            _whereClauses.Add($"{member} LIKE '{value.Trim('\'')}%'");
        }

        return node;
    }

    private string GetMemberName(Expression expression)
    {
        if (expression is MemberExpression member)
            return member.Member.Name;
        return expression.ToString();
    }

    private string GetValue(Expression expression)
    {
        if (expression is ConstantExpression constant)
        {
            if (constant.Value is string strValue)
                return $"'{strValue}'";
            return constant.Value?.ToString() ?? "NULL";
        }

        // 处理闭包中的变量
        var lambda = Expression.Lambda(expression);
        var compiled = lambda.Compile();
        var value = compiled.DynamicInvoke();

        if (value is string strVal)
            return $"'{strVal}'";
        return value?.ToString() ?? "NULL";
    }

    private string GetOperator(ExpressionType type) => type switch
    {
        ExpressionType.Equal => "=",
        ExpressionType.NotEqual => "<>",
        ExpressionType.GreaterThan => ">",
        ExpressionType.GreaterThanOrEqual => ">=",
        ExpressionType.LessThan => "<",
        ExpressionType.LessThanOrEqual => "<=",
        _ => throw new NotSupportedException($"不支持的运算符: {type}")
    };
}

class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = "";
}

class Program
{
    static void Main()
    {
        var generator = new SimpleSqlGenerator();

        // 示例 1：简单条件
        Expression<Func<Product, bool>> simpleWhere = p => p.Price > 100;
        Console.WriteLine(generator.GenerateSql<Product>(simpleWhere));
        // 输出: SELECT * FROM Products WHERE Price > 100

        // 示例 2：多条件
        generator = new SimpleSqlGenerator();
        Expression<Func<Product, bool>> complexWhere =
            p => p.Price >= 50 && p.Category == "电子产品";
        Console.WriteLine(generator.GenerateSql<Product>(complexWhere));
        // 输出: SELECT * FROM Products WHERE Price >= 50 AND Category = '电子产品'

        // 示例 3：包含方法调用
        generator = new SimpleSqlGenerator();
        Expression<Func<Product, bool>> containsWhere =
            p => p.Name.Contains("Phone") && p.Price < 10000;
        Console.WriteLine(generator.GenerateSql<Product>(containsWhere));
        // 输出: SELECT * FROM Products WHERE Name LIKE '%Phone%' AND Price < 10000
    }
}
```

### 规则引擎实现

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

// 规则定义
public class Rule<T>
{
    public string Name { get; set; } = "";
    public Expression<Func<T, bool>> Condition { get; set; } = null!;
    public Action<T> Action { get; set; } = null!;
    public int Priority { get; set; }
}

// 规则引擎
public class RuleEngine<T>
{
    private readonly List<Rule<T>> _rules = new();
    private readonly Dictionary<string, Func<T, bool>> _compiledConditions = new();

    public void AddRule(Rule<T> rule)
    {
        _rules.Add(rule);
        // 预编译条件
        _compiledConditions[rule.Name] = rule.Condition.Compile();
    }

    public void Execute(T entity)
    {
        // 按优先级排序执行
        var orderedRules = _rules.OrderByDescending(r => r.Priority);

        foreach (var rule in orderedRules)
        {
            if (_compiledConditions[rule.Name](entity))
            {
                Console.WriteLine($"  触发规则: {rule.Name}");
                rule.Action(entity);
            }
        }
    }

    public void ExecuteFirst(T entity)
    {
        // 只执行第一个匹配的规则
        var rule = _rules
            .OrderByDescending(r => r.Priority)
            .FirstOrDefault(r => _compiledConditions[r.Name](entity));

        if (rule != null)
        {
            Console.WriteLine($"  触发规则: {rule.Name}");
            rule.Action(entity);
        }
    }

    public IEnumerable<Rule<T>> GetMatchingRules(T entity)
    {
        return _rules.Where(r => _compiledConditions[r.Name](entity));
    }
}

// 订单处理示例
public class Order
{
    public string OrderId { get; set; } = "";
    public decimal Amount { get; set; }
    public string CustomerType { get; set; } = "";
    public int ItemCount { get; set; }
    public decimal Discount { get; set; }
    public string Message { get; set; } = "";
}

class Program
{
    static void Main()
    {
        var engine = new RuleEngine<Order>();

        // 添加折扣规则
        engine.AddRule(new Rule<Order>
        {
            Name = "VIP 客户 20% 折扣",
            Priority = 100,
            Condition = o => o.CustomerType == "VIP",
            Action = o => o.Discount = 0.20m
        });

        engine.AddRule(new Rule<Order>
        {
            Name = "大额订单 15% 折扣",
            Priority = 90,
            Condition = o => o.Amount >= 10000 && o.CustomerType != "VIP",
            Action = o => o.Discount = 0.15m
        });

        engine.AddRule(new Rule<Order>
        {
            Name = "多件商品 10% 折扣",
            Priority = 80,
            Condition = o => o.ItemCount >= 5 && o.Discount == 0,
            Action = o => o.Discount = 0.10m
        });

        engine.AddRule(new Rule<Order>
        {
            Name = "大额订单免费配送",
            Priority = 50,
            Condition = o => o.Amount >= 500,
            Action = o => o.Message += "免费配送; "
        });

        engine.AddRule(new Rule<Order>
        {
            Name = "首单优惠提示",
            Priority = 10,
            Condition = o => o.CustomerType == "New",
            Action = o => o.Message += "欢迎新客户！"
        });

        // 测试订单
        var orders = new[]
        {
            new Order { OrderId = "001", Amount = 15000, CustomerType = "VIP", ItemCount = 3 },
            new Order { OrderId = "002", Amount = 8000, CustomerType = "Regular", ItemCount = 6 },
            new Order { OrderId = "003", Amount = 600, CustomerType = "New", ItemCount = 2 }
        };

        foreach (var order in orders)
        {
            Console.WriteLine($"\n处理订单 {order.OrderId} (金额: ¥{order.Amount}, 客户: {order.CustomerType}):");
            engine.Execute(order);
            Console.WriteLine($"  最终折扣: {order.Discount:P0}");
            Console.WriteLine($"  消息: {order.Message}");
        }
    }
}
```

### 属性映射器

```csharp
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;

// 通用对象映射器
public class ObjectMapper<TSource, TDestination>
    where TDestination : new()
{
    private readonly List<Action<TSource, TDestination>> _mappings = new();

    public ObjectMapper<TSource, TDestination> Map<TValue>(
        Expression<Func<TSource, TValue>> sourceProperty,
        Expression<Func<TDestination, TValue>> destProperty)
    {
        var sourceGetter = sourceProperty.Compile();
        var destSetter = CreateSetter(destProperty);

        _mappings.Add((src, dest) => destSetter(dest, sourceGetter(src)));

        return this;
    }

    public ObjectMapper<TSource, TDestination> Map<TSourceValue, TDestValue>(
        Expression<Func<TSource, TSourceValue>> sourceProperty,
        Expression<Func<TDestination, TDestValue>> destProperty,
        Func<TSourceValue, TDestValue> converter)
    {
        var sourceGetter = sourceProperty.Compile();
        var destSetter = CreateSetter(destProperty);

        _mappings.Add((src, dest) => destSetter(dest, converter(sourceGetter(src))));

        return this;
    }

    public TDestination Map(TSource source)
    {
        var destination = new TDestination();
        foreach (var mapping in _mappings)
        {
            mapping(source, destination);
        }
        return destination;
    }

    public IEnumerable<TDestination> MapAll(IEnumerable<TSource> sources)
    {
        return sources.Select(Map);
    }

    private static Action<TDestination, TValue> CreateSetter<TValue>(
        Expression<Func<TDestination, TValue>> propertyExpression)
    {
        if (propertyExpression.Body is MemberExpression memberExpression &&
            memberExpression.Member is PropertyInfo property)
        {
            var instance = Expression.Parameter(typeof(TDestination), "instance");
            var value = Expression.Parameter(typeof(TValue), "value");
            var propertyAccess = Expression.Property(instance, property);
            var assign = Expression.Assign(propertyAccess, value);
            var lambda = Expression.Lambda<Action<TDestination, TValue>>(assign, instance, value);

            return lambda.Compile();
        }

        throw new ArgumentException("表达式必须是属性访问");
    }
}

// 示例实体
public class UserEntity
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateTime BirthDate { get; set; }
    public bool IsActive { get; set; }
}

public class UserDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = "";
    public int Age { get; set; }
    public string Status { get; set; } = "";
}

class Program
{
    static void Main()
    {
        // 配置映射
        var mapper = new ObjectMapper<UserEntity, UserDto>()
            .Map(src => src.Id, dest => dest.UserId)
            .Map(
                src => src.FirstName,
                dest => dest.FullName,
                firstName => firstName)  // 需要更复杂的映射
            .Map(
                src => src.BirthDate,
                dest => dest.Age,
                birthDate => DateTime.Today.Year - birthDate.Year)
            .Map(
                src => src.IsActive,
                dest => dest.Status,
                isActive => isActive ? "活跃" : "禁用");

        var entity = new UserEntity
        {
            Id = 1,
            FirstName = "张三",
            LastName = "李",
            BirthDate = new DateTime(1990, 5, 15),
            IsActive = true
        };

        var dto = mapper.Map(entity);

        Console.WriteLine($"UserId: {dto.UserId}");
        Console.WriteLine($"FullName: {dto.FullName}");
        Console.WriteLine($"Age: {dto.Age}");
        Console.WriteLine($"Status: {dto.Status}");
    }
}
```

## 面试要点

### 常见面试问题

1. **什么是表达式树？它与委托有什么区别？**
   - 表达式树是代码的数据结构表示，可以被分析和转换
   - 委托是可执行的代码引用，只能调用不能分析

2. **LINQ to Entities 为什么需要表达式树？**
   - 需要将 C# 查询翻译为 SQL
   - 表达式树可以被遍历和分析，提取查询逻辑
   - 委托是编译后的代码，无法获取其内部逻辑

3. **如何手动构建表达式树？**
   - 使用 `Expression` 类的静态工厂方法
   - `Expression.Parameter`, `Expression.Constant`, `Expression.Add` 等

4. **表达式树有哪些性能考量？**
   - 编译表达式有开销，应该缓存编译结果
   - 构建表达式比直接写代码慢
   - 适用于需要动态性的场景

5. **如何组合多个表达式？**
   - 需要处理参数替换问题
   - 使用 `ExpressionVisitor` 替换参数
   - 使用 `Expression.AndAlso` / `Expression.OrElse` 组合

### 代码示例题

```csharp
// 面试题：实现一个根据属性名动态生成 getter 的方法
public static Func<T, object> CreateGetter<T>(string propertyName)
{
    var parameter = Expression.Parameter(typeof(T), "x");
    var property = Expression.Property(parameter, propertyName);
    var converted = Expression.Convert(property, typeof(object));
    var lambda = Expression.Lambda<Func<T, object>>(converted, parameter);

    return lambda.Compile();
}

// 使用
var getName = CreateGetter<Person>("Name");
var person = new Person { Name = "张三" };
Console.WriteLine(getName(person));  // 输出: 张三
```

## 延伸阅读

### 官方文档
- [Expression Trees (C#)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/expression-trees/)
- [System.Linq.Expressions Namespace](https://docs.microsoft.com/en-us/dotnet/api/system.linq.expressions)
- [Building Expression Trees](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/expression-trees/building-expression-trees)

### 推荐书籍
- 《C# in Depth》 by Jon Skeet - 深入讲解表达式树
- 《Pro LINQ》 by Joseph Rattz - LINQ 和表达式树实战
- 《Metaprogramming in .NET》 by Kevin Hazzard - .NET 元编程技术

### 开源项目参考
- [Entity Framework Core](https://github.com/dotnet/efcore) - 表达式树在 ORM 中的应用
- [AutoMapper](https://github.com/AutoMapper/AutoMapper) - 对象映射中的表达式树使用
- [Dynamic LINQ](https://github.com/zzzprojects/System.Linq.Dynamic.Core) - 动态 LINQ 查询构建

## 总结

表达式树是 C# 中强大的元编程工具，它将代码表示为可分析的数据结构。核心要点：

| 概念 | 说明 | 应用场景 |
|------|------|----------|
| **Expression<T>** | 表达式的数据表示 | LINQ Provider、动态查询 |
| **Lambda 转换** | 编译器自动转换 | 声明式查询构建 |
| **手动构建** | 使用 Expression 工厂方法 | 运行时动态生成代码 |
| **编译执行** | Compile() 方法 | 将表达式转为可执行委托 |
| **表达式遍历** | ExpressionVisitor | SQL 生成、表达式分析 |
| **表达式组合** | 参数替换与组合 | 动态条件构建 |

掌握表达式树可以让你：
- 理解 Entity Framework 等 ORM 的工作原理
- 构建灵活的动态查询系统
- 实现高性能的规则引擎
- 开发自定义的 DSL（领域特定语言）
