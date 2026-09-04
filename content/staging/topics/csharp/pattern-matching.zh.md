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
origin: old/src/content/docs/csharp/pattern-matching.zh.md
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

模式匹配是 C# 中最强大的语言特性之一，它允许你以声明式的方式测试数据的"形状"，并在匹配成功时提取数据。自 C# 7.0 引入以来，模式匹配在每个主要版本中都得到了显著增强，如今已成为编写简洁、类型安全代码的核心工具。

---

## 模式匹配概述

模式匹配允许你在以下构造中测试表达式：

- **`is` 表达式**：测试表达式是否匹配某个模式
- **`switch` 语句**：根据模式执行不同的代码分支
- **`switch` 表达式**：根据模式返回不同的值

C# 支持的模式类型包括：

| 模式类型 | 引入版本 | 描述 |
|---------|---------|------|
| 声明模式 | C# 7.0 | 检查类型并声明变量 |
| 类型模式 | C# 7.0 | 检查运行时类型 |
| 常量模式 | C# 7.0 | 测试是否等于常量 |
| 属性模式 | C# 8.0 | 匹配对象的属性 |
| 位置模式 | C# 8.0 | 解构并匹配元素 |
| 关系模式 | C# 9.0 | 使用关系运算符比较 |
| 逻辑模式 | C# 9.0 | 使用 and、or、not 组合模式 |
| 列表模式 | C# 11 | 匹配集合中的元素 |

---

## 类型模式

类型模式是最基础也是最常用的模式，它检查表达式的运行时类型。

### 基本类型检查

```csharp
// 传统方式：先检查类型，再强制转换
object obj = "Hello, World!";
if (obj is string)
{
    string str = (string)obj;
    Console.WriteLine(str.ToUpper());
}

// 使用声明模式：类型检查与变量声明合二为一
if (obj is string message)
{
    Console.WriteLine(message.ToUpper()); // HELLO, WORLD!
}
```

### 类型模式与 null 检查

类型模式会自动过滤 `null` 值：

```csharp
object? data = null;

// 类型模式不会匹配 null
if (data is string text)
{
    // 这里不会执行，因为 data 是 null
    Console.WriteLine(text);
}

// 显式检查 null
if (data is null)
{
    Console.WriteLine("数据为空");
}

// 检查非 null
if (data is not null)
{
    Console.WriteLine("数据不为空");
}
```

### 多态类型匹配

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

    throw new ArgumentException("未知的形状类型", nameof(shape));
}
```

### 类型模式在 switch 中的应用

```csharp
public static string DescribeObject(object obj) => obj switch
{
    int i => $"整数: {i}",
    double d => $"浮点数: {d:F2}",
    string s => $"字符串: \"{s}\" (长度: {s.Length})",
    bool b => $"布尔值: {b}",
    null => "空值",
    _ => $"其他类型: {obj.GetType().Name}"
};

// 使用示例
Console.WriteLine(DescribeObject(42));        // 整数: 42
Console.WriteLine(DescribeObject(3.14159));   // 浮点数: 3.14
Console.WriteLine(DescribeObject("测试"));     // 字符串: "测试" (长度: 2)
Console.WriteLine(DescribeObject(true));      // 布尔值: True
Console.WriteLine(DescribeObject(null));      // 空值
```

---

## 属性模式

属性模式允许你匹配对象的属性值，使条件判断更加直观和富有表达力。

### 基本属性模式

```csharp
public class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public string City { get; set; } = "";
}

// 属性模式示例
public static string ClassifyPerson(Person person) => person switch
{
    { Age: < 18 } => "未成年人",
    { Age: >= 60 } => "老年人",
    { City: "北京" } => "北京居民",
    { City: "上海" } => "上海居民",
    _ => "普通成年人"
};

// 组合多个属性条件
public static string GetSpecialOffer(Person person) => person switch
{
    { Age: < 12, City: "北京" } => "北京儿童特惠",
    { Age: >= 65, City: "上海" } => "上海老年优惠",
    { Age: < 18 } => "青少年折扣",
    _ => "无特殊优惠"
};
```

### 嵌套属性模式

属性模式支持多层嵌套，可以深入检查对象结构：

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

// 嵌套属性模式
public static decimal CalculateTax(Employee emp) => emp switch
{
    { HomeAddress: { Country: "中国", City: "北京" }, Salary: > 50000m }
        => emp.Salary * 0.25m,
    { HomeAddress: { Country: "中国", City: "上海" }, Salary: > 50000m }
        => emp.Salary * 0.23m,
    { HomeAddress: { Country: "中国" }, Salary: > 30000m }
        => emp.Salary * 0.20m,
    { HomeAddress: { Country: "中国" } }
        => emp.Salary * 0.15m,
    { HomeAddress: null }
        => emp.Salary * 0.10m,
    _ => emp.Salary * 0.18m
};
```

### 属性模式与类型模式结合

```csharp
public static string TakeFive(object input) => input switch
{
    string { Length: >= 5 } s => s.Substring(0, 5),
    string s => s,
    ICollection<char> { Count: >= 5 } symbols => new string(symbols.Take(5).ToArray()),
    ICollection<char> symbols => new string(symbols.ToArray()),
    null => throw new ArgumentNullException(nameof(input)),
    _ => throw new ArgumentException("不支持的输入类型")
};

// 使用示例
Console.WriteLine(TakeFive("Hello, World!"));  // Hello
Console.WriteLine(TakeFive("Hi!"));            // Hi!
Console.WriteLine(TakeFive(new[] { '1', '2', '3', '4', '5', '6' }));  // 12345
```

### 扩展属性模式 (C# 10+)

C# 10 引入了扩展属性模式，允许使用点号访问嵌套属性：

```csharp
// C# 10 之前的写法
public static string OldWay(Employee emp) => emp switch
{
    { HomeAddress: { City: "北京" } } => "北京员工",
    _ => "其他地区员工"
};

// C# 10+ 扩展属性模式
public static string NewWay(Employee emp) => emp switch
{
    { HomeAddress.City: "北京" } => "北京员工",
    { HomeAddress.Country: "中国" } => "中国员工",
    _ => "其他地区员工"
};
```

---

## 位置模式

位置模式基于对象的解构能力，允许你匹配对象解构后的各个部分。

### 元组模式

元组是位置模式最常见的应用场景：

```csharp
// 石头剪刀布游戏
public static string PlayGame(string player1, string player2) =>
    (player1, player2) switch
{
    ("石头", "剪刀") or ("剪刀", "布") or ("布", "石头") => "玩家1获胜",
    ("剪刀", "石头") or ("布", "剪刀") or ("石头", "布") => "玩家2获胜",
    (var p1, var p2) when p1 == p2 => "平局",
    _ => "无效输入"
};

// 团体票价折扣计算
public static decimal GetGroupTicketPriceDiscount(int groupSize, DateTime visitDate) =>
    (groupSize, visitDate.DayOfWeek) switch
{
    (<= 0, _) => throw new ArgumentException("团体人数必须为正数"),
    (_, DayOfWeek.Saturday or DayOfWeek.Sunday) => 0.0m,  // 周末无折扣
    (>= 5 and < 10, DayOfWeek.Monday) => 20.0m,          // 周一中型团体
    (>= 10, DayOfWeek.Monday) => 30.0m,                  // 周一大型团体
    (>= 5 and < 10, _) => 12.0m,                         // 平日中型团体
    (>= 10, _) => 15.0m,                                 // 平日大型团体
    _ => 0.0m
};
```

### Record 类型的位置模式

Record 类型自动支持解构，可以直接使用位置模式：

```csharp
public record Point(double X, double Y);
public record Point3D(double X, double Y, double Z);

public static string DescribePoint(Point point) => point switch
{
    (0, 0) => "原点",
    (0, var y) => $"Y轴上的点，Y = {y}",
    (var x, 0) => $"X轴上的点，X = {x}",
    (var x, var y) when x == y => $"对角线上的点 ({x}, {y})",
    (var x, var y) when x == -y => $"反对角线上的点 ({x}, {y})",
    (var x, var y) => $"一般点 ({x}, {y})"
};

// 嵌套 Record 解构
public record Circle(Point Center, double Radius);

public static string DescribeCircle(Circle circle) => circle switch
{
    ((0, 0), var r) => $"以原点为圆心，半径为 {r} 的圆",
    ((var x, 0), var r) when x > 0 => $"圆心在X轴正半轴，半径为 {r}",
    ((0, var y), var r) when y > 0 => $"圆心在Y轴正半轴，半径为 {r}",
    var ((x, y), r) => $"圆心为 ({x}, {y})，半径为 {r}"
};
```

### 自定义 Deconstruct 方法

对于普通类，可以通过定义 `Deconstruct` 方法来支持位置模式：

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

    // 定义解构方法
    public void Deconstruct(out double width, out double height)
    {
        width = Width;
        height = Height;
    }
}

public static string ClassifyRectangle(Rectangle rect) => rect switch
{
    (0, _) or (_, 0) => "无效矩形（边长为零）",
    (var w, var h) when w == h => $"正方形，边长 {w}",
    (var w, var h) when w > h => $"横向矩形 {w} x {h}",
    (var w, var h) => $"纵向矩形 {w} x {h}"
};

// 使用扩展方法添加解构
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

// 使用日期解构
public static string DescribeDate(DateTime date) => date switch
{
    (_, 1, 1) => "元旦",
    (_, 5, 1) => "劳动节",
    (_, 10, 1) => "国庆节",
    (var y, 2, 14) => $"{y}年情人节",
    (_, 12, 25) => "圣诞节",
    var (y, m, d) => $"{y}年{m}月{d}日"
};
```

---

## switch 表达式

C# 8.0 引入的 switch 表达式是模式匹配的核心语法糖，它使代码更加简洁。

### 基本语法

```csharp
// 传统 switch 语句
public static string GetDayNameOld(DayOfWeek day)
{
    switch (day)
    {
        case DayOfWeek.Monday:
            return "星期一";
        case DayOfWeek.Tuesday:
            return "星期二";
        case DayOfWeek.Wednesday:
            return "星期三";
        case DayOfWeek.Thursday:
            return "星期四";
        case DayOfWeek.Friday:
            return "星期五";
        case DayOfWeek.Saturday:
            return "星期六";
        case DayOfWeek.Sunday:
            return "星期日";
        default:
            throw new ArgumentOutOfRangeException(nameof(day));
    }
}

// switch 表达式
public static string GetDayName(DayOfWeek day) => day switch
{
    DayOfWeek.Monday => "星期一",
    DayOfWeek.Tuesday => "星期二",
    DayOfWeek.Wednesday => "星期三",
    DayOfWeek.Thursday => "星期四",
    DayOfWeek.Friday => "星期五",
    DayOfWeek.Saturday => "星期六",
    DayOfWeek.Sunday => "星期日",
    _ => throw new ArgumentOutOfRangeException(nameof(day))
};
```

### 复杂 switch 表达式

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
        (0m, "订单金额无效"),

    { CustomerType: "VIP", Amount: >= 10000m } =>
        (0.25m, "VIP客户大额订单，享受25%折扣"),

    { CustomerType: "VIP", Amount: >= 1000m } =>
        (0.15m, "VIP客户，享受15%折扣"),

    { CustomerType: "VIP" } =>
        (0.10m, "VIP客户，享受10%折扣"),

    { IsPriority: true, Amount: >= 5000m } =>
        (0.12m, "优先客户大额订单，享受12%折扣"),

    { Amount: >= 5000m } =>
        (0.08m, "大额订单，享受8%折扣"),

    { Amount: >= 1000m } =>
        (0.05m, "满千减五"),

    _ => (0m, "暂无折扣")
};
```

### 嵌套 switch 表达式

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

    _ => throw new ArgumentException("未知的支付方式")
};
```

---

## when 子句

when 子句为模式匹配添加额外的布尔条件，使匹配更加灵活。

### 基本 when 子句

```csharp
public static string ClassifyNumber(int number) => number switch
{
    0 => "零",
    var n when n < 0 => "负数",
    var n when n % 2 == 0 => "正偶数",
    var n when IsPrime(n) => "质数",
    _ => "正奇数（非质数）"
};

private static bool IsPrime(int n)
{
    if (n < 2) return false;
    for (int i = 2; i <= Math.Sqrt(n); i++)
        if (n % i == 0) return false;
    return true;
}
```

### when 子句与属性模式结合

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

    { Stock: 0 } => "缺货",

    { ExpiryDate: var expiry } when expiry < DateTime.Now =>
        "已过期",

    { ExpiryDate: var expiry } when expiry < DateTime.Now.AddDays(7) =>
        "即将过期",

    { Stock: var s, Category: "食品" } when s < 10 =>
        "食品库存不足",

    { Price: var p, Category: "电子产品" } when p > 5000 =>
        "高端电子产品",

    { Stock: var s } when s < 5 =>
        "库存紧张",

    _ => "库存正常"
};
```

### when 子句与元组模式结合

```csharp
public static string GetShippingMethod(
    decimal orderAmount,
    double distanceKm,
    bool isFragile) => (orderAmount, distanceKm, isFragile) switch
{
    (_, _, true) when distanceKm > 500 =>
        "不支持易碎品远距离配送",

    (>= 1000m, _, true) =>
        "专车配送（易碎品大额订单）",

    (_, > 1000, _) =>
        "航空快递",

    (>= 500m, _, _) =>
        "次日达",

    (_, var d, _) when d < 50 =>
        "同城快递",

    _ => "标准快递"
};
```

### is 表达式中的 when 子句

```csharp
// is 表达式不直接支持 when，但可以结合 && 实现类似效果
public static void ProcessItem(object item)
{
    if (item is int number && number > 100)
    {
        Console.WriteLine($"大于100的整数: {number}");
    }
    else if (item is string { Length: > 0 } text && text.StartsWith("重要"))
    {
        Console.WriteLine($"重要消息: {text}");
    }
}
```

---

## 关系模式

C# 9.0 引入的关系模式允许你使用关系运算符（`<`、`>`、`<=`、`>=`）进行比较。

### 基本关系模式

```csharp
public static string ClassifyTemperature(double celsius) => celsius switch
{
    < -40 => "极寒",
    < 0 => "严寒",
    < 10 => "寒冷",
    < 20 => "凉爽",
    < 30 => "温暖",
    < 40 => "炎热",
    _ => "酷热"
};

// 水的状态（基于华氏温度）
public static string GetWaterState(int tempFahrenheit) => tempFahrenheit switch
{
    < 32 => "固态（冰）",
    32 => "固液共存（冰点）",
    > 32 and < 212 => "液态（水）",
    212 => "液气共存（沸点）",
    > 212 => "气态（水蒸气）"
};
```

### 数值范围匹配

```csharp
public static string GetGrade(int score) => score switch
{
    < 0 or > 100 => "无效分数",
    >= 90 => "优秀 (A)",
    >= 80 => "良好 (B)",
    >= 70 => "中等 (C)",
    >= 60 => "及格 (D)",
    _ => "不及格 (F)"
};

// BMI 分类
public static string ClassifyBMI(double bmi) => bmi switch
{
    < 18.5 => "体重过轻",
    >= 18.5 and < 24 => "正常体重",
    >= 24 and < 28 => "超重",
    >= 28 and < 32 => "轻度肥胖",
    >= 32 and < 40 => "中度肥胖",
    >= 40 => "重度肥胖",
    _ => "无效BMI值"  // 处理 NaN
};
```

### 关系模式与属性模式结合

```csharp
public record BankAccount(
    string AccountNumber,
    decimal Balance,
    string AccountType,
    int DaysOverdue
);

public static string AssessAccountRisk(BankAccount account) => account switch
{
    { Balance: < 0 } => "余额为负，高风险",
    { DaysOverdue: > 90 } => "严重逾期，高风险",
    { DaysOverdue: > 30 and <= 90 } => "逾期，中等风险",
    { DaysOverdue: > 0 and <= 30, Balance: < 1000 } => "轻微逾期且余额不足，中等风险",
    { DaysOverdue: > 0 and <= 30 } => "轻微逾期，低风险",
    { Balance: >= 10000, AccountType: "储蓄" } => "优质储蓄客户",
    { Balance: >= 50000 } => "高净值客户",
    _ => "正常客户"
};
```

---

## 逻辑模式

C# 9.0 引入了逻辑模式运算符 `and`、`or` 和 `not`，允许组合多个模式。

### and 模式

```csharp
// 范围检查
public static bool IsValidPercentage(int value) => value is >= 0 and <= 100;

// 工作时间检查
public static bool IsWorkingHour(int hour) => hour is >= 9 and < 18;

// 组合属性模式
public static string ClassifyPerson(Person person) => person switch
{
    { Age: >= 18 and < 65, City: "北京" } => "北京劳动年龄居民",
    { Age: >= 18 and < 65 } => "劳动年龄居民",
    { Age: < 18 } => "未成年人",
    _ => "老年人"
};
```

### or 模式

```csharp
// 元音字母检查
public static bool IsVowel(char c) =>
    c is 'a' or 'e' or 'i' or 'o' or 'u' or
         'A' or 'E' or 'I' or 'O' or 'U';

// 周末检查
public static bool IsWeekend(DayOfWeek day) =>
    day is DayOfWeek.Saturday or DayOfWeek.Sunday;

// 季节分类
public static string GetSeason(int month) => month switch
{
    12 or 1 or 2 => "冬季",
    3 or 4 or 5 => "春季",
    6 or 7 or 8 => "夏季",
    9 or 10 or 11 => "秋季",
    _ => "无效月份"
};

// HTTP 状态码分类
public static string ClassifyStatusCode(int code) => code switch
{
    >= 100 and < 200 => "信息性响应",
    >= 200 and < 300 => "成功",
    >= 300 and < 400 => "重定向",
    >= 400 and < 500 => "客户端错误",
    >= 500 and < 600 => "服务器错误",
    _ => "未知状态码"
};
```

### not 模式

```csharp
// null 检查
public static bool IsNotNull(object? obj) => obj is not null;

// 非空字符串检查
public static bool IsNotEmpty(string? str) => str is not (null or "");

// 排除特定值
public static string ProcessValue(int value) => value switch
{
    not 0 when value > 0 => "正数",
    not 0 when value < 0 => "负数",
    0 => "零"
};

// 类型排除
public static void HandleException(Exception ex)
{
    if (ex is not (ArgumentException or InvalidOperationException))
    {
        // 处理其他类型的异常
        Console.WriteLine($"未预期的异常: {ex.GetType().Name}");
    }
}
```

### 复杂逻辑组合

```csharp
public record HttpRequest(
    string Method,
    string Path,
    int ContentLength,
    string? Authorization
);

public static string ValidateRequest(HttpRequest request) => request switch
{
    null => "请求不能为空",

    { Method: not ("GET" or "POST" or "PUT" or "DELETE") } =>
        "不支持的HTTP方法",

    { Method: "POST" or "PUT", ContentLength: <= 0 } =>
        "POST/PUT请求必须包含内容",

    { Method: "POST" or "PUT", ContentLength: > 10_000_000 } =>
        "请求内容过大",

    { Path: null or "" } =>
        "路径不能为空",

    { Authorization: null or "", Path: var p } when p.StartsWith("/admin") =>
        "访问管理路径需要授权",

    _ => "请求有效"
};
```

---

## 列表模式

C# 11 引入的列表模式允许你匹配数组、列表或任何可索引的集合中的元素。

### 基本列表模式

```csharp
public static string DescribeArray(int[] numbers) => numbers switch
{
    [] => "空数组",
    [var single] => $"单元素数组: {single}",
    [var first, var second] => $"两元素数组: {first}, {second}",
    [var first, var second, var third] => $"三元素数组: {first}, {second}, {third}",
    _ => $"数组包含 {numbers.Length} 个元素"
};

// 使用示例
Console.WriteLine(DescribeArray([]));           // 空数组
Console.WriteLine(DescribeArray([42]));         // 单元素数组: 42
Console.WriteLine(DescribeArray([1, 2]));       // 两元素数组: 1, 2
Console.WriteLine(DescribeArray([1, 2, 3, 4])); // 数组包含 4 个元素
```

### 切片模式

切片模式 `..` 匹配零个或多个元素：

```csharp
public static string AnalyzeSequence(int[] sequence) => sequence switch
{
    [] => "空序列",
    [1, 2, 3] => "完全匹配 [1, 2, 3]",
    [1, ..] => "以 1 开头",
    [.., 9] => "以 9 结尾",
    [1, .., 9] => "以 1 开头，以 9 结尾",
    [var first, .., var last] => $"首元素: {first}, 末元素: {last}",
    _ => "未知序列"
};

// 匹配示例
Console.WriteLine(new[] { 1, 2, 3, 4, 5 } is [> 0, > 0, ..]);     // True
Console.WriteLine(new[] { 1, 2, 3, 4 } is [.., > 0, > 0]);        // True
Console.WriteLine(new[] { 1, 2, 3, 4 } is [>= 0, .., 2 or 4]);    // True
Console.WriteLine(new[] { 1, 0, 0, 1 } is [1, 0, .., 0, 1]);      // True
```

### 列表模式与嵌套模式

```csharp
// 在切片中捕获值
public static void MatchMessage(string message)
{
    var result = message is ['A' or 'a', .. var middle, 'A' or 'a']
        ? $"消息 \"{message}\" 匹配，中间部分: \"{middle}\""
        : $"消息 \"{message}\" 不匹配";
    Console.WriteLine(result);
}

// 验证数组结构
public static string ValidateArray(int[] numbers) => numbers switch
{
    [< 0, .. { Length: 2 or 4 }, > 0] => "有效：负数开头，正数结尾，中间2或4个元素",
    [< 0, .., > 0] => "有效：负数开头，正数结尾",
    [> 0, ..] => "以正数开头",
    [.., < 0] => "以负数结尾",
    _ => "其他情况"
};
```

### 复杂列表模式应用

```csharp
public record LogEntry(string Level, string Message, DateTime Timestamp);

public static string AnalyzeLogs(LogEntry[] logs) => logs switch
{
    [] => "无日志记录",

    [{ Level: "ERROR" }] => "单条错误日志",

    [{ Level: "ERROR" }, { Level: "ERROR" }, ..] =>
        "连续错误，可能存在严重问题",

    [.., { Level: "ERROR" }] =>
        "最近发生错误",

    [{ Level: "INFO", Message: var msg }, ..] when msg.Contains("启动") =>
        "系统启动日志序列",

    [.., { Level: "INFO", Message: var msg }] when msg.Contains("关闭") =>
        "系统关闭日志序列",

    _ => $"共 {logs.Length} 条日志记录"
};

// 命令行参数解析
public static string ParseArgs(string[] args) => args switch
{
    [] => "用法: program [命令] [选项]",
    ["help"] => "显示帮助信息",
    ["version"] => "版本 1.0.0",
    ["run", var file] => $"运行文件: {file}",
    ["run", var file, "--verbose"] => $"详细模式运行文件: {file}",
    ["config", "set", var key, var value] => $"设置配置 {key} = {value}",
    ["config", "get", var key] => $"获取配置: {key}",
    [var cmd, ..] => $"未知命令: {cmd}"
};
```

---

## var 模式与弃元模式

### var 模式

var 模式匹配任何表达式（包括 null）并将其赋值给变量：

```csharp
// var 模式总是匹配成功
public static string ProcessAny(object? input) => input switch
{
    string s => $"字符串: {s}",
    int i => $"整数: {i}",
    var other => $"其他类型: {other?.GetType().Name ?? "null"}"
};

// 在位置模式中使用 var
public static string DescribePoint(Point point) => point switch
{
    (0, 0) => "原点",
    (var x, var y) when x == y => $"对角线上 ({x}, {y})",
    var (x, y) => $"点 ({x}, {y})"  // var 可以应用于整个解构
};

// 捕获中间值进行计算
public static string AnalyzeOrder(Order order) => order switch
{
    { Amount: var amt } when amt > 10000 => $"大额订单: {amt:C}",
    { Amount: var amt, CustomerType: "VIP" } when amt > 1000 =>
        $"VIP中额订单: {amt:C}",
    var o => $"普通订单: {o.Amount:C}"
};
```

### 弃元模式

弃元模式 `_` 匹配任何表达式但不捕获值：

```csharp
// 基本弃元模式
public static decimal CalculateToll(Vehicle vehicle) => vehicle switch
{
    Car _ => 2.00m,      // 匹配 Car 类型，不需要变量
    Truck _ => 7.50m,    // 匹配 Truck 类型，不需要变量
    null => throw new ArgumentNullException(nameof(vehicle)),
    _ => throw new ArgumentException("未知车辆类型")  // 默认情况
};

// 在元组中忽略某些值
public static string CheckFirst(int first, int second) => (first, second) switch
{
    (0, _) => "第一个是零",
    (_, 0) => "第二个是零",
    (var f, _) when f < 0 => "第一个是负数",
    _ => "都是正数"
};

// 在列表模式中使用弃元
public static bool HasAtLeastThreeElements(int[] arr) => arr is [_, _, _, ..];
```

---

## 实战应用

### 状态机实现

```csharp
public enum OrderState { Created, Validated, Paid, Shipped, Delivered, Cancelled }

public record OrderEvent(string Type, string? Reason = null);

public static (OrderState NewState, string Message) ProcessOrderEvent(
    OrderState currentState,
    OrderEvent orderEvent) => (currentState, orderEvent) switch
{
    // 创建状态的转换
    (OrderState.Created, { Type: "validate" }) =>
        (OrderState.Validated, "订单已验证"),
    (OrderState.Created, { Type: "cancel", Reason: var r }) =>
        (OrderState.Cancelled, $"订单已取消: {r ?? "无原因"}"),

    // 验证状态的转换
    (OrderState.Validated, { Type: "pay" }) =>
        (OrderState.Paid, "订单已支付"),
    (OrderState.Validated, { Type: "cancel", Reason: var r }) =>
        (OrderState.Cancelled, $"订单已取消: {r ?? "无原因"}"),

    // 支付状态的转换
    (OrderState.Paid, { Type: "ship" }) =>
        (OrderState.Shipped, "订单已发货"),
    (OrderState.Paid, { Type: "refund" }) =>
        (OrderState.Cancelled, "订单已退款"),

    // 发货状态的转换
    (OrderState.Shipped, { Type: "deliver" }) =>
        (OrderState.Delivered, "订单已送达"),
    (OrderState.Shipped, { Type: "return" }) =>
        (OrderState.Cancelled, "订单已退回"),

    // 终态不允许转换
    (OrderState.Delivered, _) =>
        (OrderState.Delivered, "订单已完成，无法进行更多操作"),
    (OrderState.Cancelled, _) =>
        (OrderState.Cancelled, "订单已取消，无法进行更多操作"),

    // 无效转换
    _ => (currentState, $"无效的状态转换: {currentState} + {orderEvent.Type}")
};
```

### 表达式求值器

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
            : throw new ArgumentException($"未定义的变量: {name}"),
        Addition(var left, var right) => Evaluate(left) + Evaluate(right),
        Subtraction(var left, var right) => Evaluate(left) - Evaluate(right),
        Multiplication(var left, var right) => Evaluate(left) * Evaluate(right),
        Division(var left, var right) => Evaluate(left) / Evaluate(right),
        Negation(var inner) => -Evaluate(inner),
        null => throw new ArgumentNullException(nameof(expr)),
        _ => throw new ArgumentException($"未知表达式类型: {expr.GetType().Name}")
    };

    // 表达式简化
    public Expression Simplify(Expression expr) => expr switch
    {
        // 加法简化
        Addition(Constant(0), var right) => Simplify(right),
        Addition(var left, Constant(0)) => Simplify(left),
        Addition(Constant(var a), Constant(var b)) => new Constant(a + b),

        // 乘法简化
        Multiplication(Constant(0), _) => new Constant(0),
        Multiplication(_, Constant(0)) => new Constant(0),
        Multiplication(Constant(1), var right) => Simplify(right),
        Multiplication(var left, Constant(1)) => Simplify(left),
        Multiplication(Constant(var a), Constant(var b)) => new Constant(a * b),

        // 除法简化
        Division(var left, Constant(1)) => Simplify(left),
        Division(Constant(0), _) => new Constant(0),

        // 双重否定
        Negation(Negation(var inner)) => Simplify(inner),
        Negation(Constant(var value)) => new Constant(-value),

        // 递归简化复合表达式
        Addition(var left, var right) =>
            new Addition(Simplify(left), Simplify(right)),
        Subtraction(var left, var right) =>
            new Subtraction(Simplify(left), Simplify(right)),
        Multiplication(var left, var right) =>
            new Multiplication(Simplify(left), Simplify(right)),
        Division(var left, var right) =>
            new Division(Simplify(left), Simplify(right)),
        Negation(var inner) => new Negation(Simplify(inner)),

        // 其他情况保持不变
        _ => expr
    };
}
```

### 配置验证系统

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

        // 使用模式匹配验证各个部分
        errors.AddRange(ValidateEnvironment(config));
        errors.AddRange(ValidateDatabase(config.Database));
        errors.AddRange(ValidateOrigins(config));

        return errors;
    }

    private IEnumerable<string> ValidateEnvironment(AppConfig config) => config switch
    {
        { Environment: null or "" } =>
            new[] { "环境名称不能为空" },
        { Environment: not ("Development" or "Staging" or "Production") } =>
            new[] { "环境必须是 Development、Staging 或 Production" },
        { Environment: "Production", EnableLogging: false } =>
            new[] { "生产环境必须启用日志" },
        _ => Enumerable.Empty<string>()
    };

    private IEnumerable<string> ValidateDatabase(DatabaseConfig db) => db switch
    {
        null =>
            new[] { "数据库配置不能为空" },
        { Host: null or "" } =>
            new[] { "数据库主机不能为空" },
        { Port: <= 0 or > 65535 } =>
            new[] { "端口必须在 1-65535 之间" },
        { Database: null or "" } =>
            new[] { "数据库名称不能为空" },
        { MaxConnections: <= 0 } =>
            new[] { "最大连接数必须大于 0" },
        { MaxConnections: > 1000 } =>
            new[] { "最大连接数不能超过 1000" },
        { TimeoutSeconds: <= 0 or > 300 } =>
            new[] { "超时时间必须在 1-300 秒之间" },
        { Username: null or "", Password: not (null or "") } =>
            new[] { "设置密码时必须提供用户名" },
        _ => Enumerable.Empty<string>()
    };

    private IEnumerable<string> ValidateOrigins(AppConfig config) =>
        (config.Environment, config.AllowedOrigins) switch
    {
        (_, null or []) =>
            new[] { "至少需要一个允许的源" },
        ("Production", [.., "*"]) =>
            new[] { "生产环境不能使用通配符源" },
        ("Production", var origins) when origins.Any(o => o.StartsWith("http://")) =>
            new[] { "生产环境必须使用 HTTPS" },
        _ => Enumerable.Empty<string>()
    };
}
```

### JSON 解析与转换

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
        _ => throw new ArgumentException($"未知的 JSON 类型: {element.ValueKind}")
    };

    public string DescribeJson(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.Object => element.EnumerateObject().Count() switch
        {
            0 => "空对象 {}",
            1 => "单属性对象",
            var n when n <= 5 => $"小型对象（{n} 个属性）",
            var n => $"大型对象（{n} 个属性）"
        },
        JsonValueKind.Array => element.GetArrayLength() switch
        {
            0 => "空数组 []",
            1 => "单元素数组",
            var n when n <= 10 => $"小型数组（{n} 个元素）",
            var n => $"大型数组（{n} 个元素）"
        },
        JsonValueKind.String => element.GetString() switch
        {
            null or "" => "空字符串",
            { Length: <= 10 } s => $"短字符串: \"{s}\"",
            { Length: var len } => $"长字符串（{len} 字符）"
        },
        JsonValueKind.Number => "数值",
        JsonValueKind.True or JsonValueKind.False => "布尔值",
        JsonValueKind.Null => "null",
        _ => "未知类型"
    };
}
```

---

## 最佳实践与性能考量

### 最佳实践

1. **优先使用 switch 表达式**
   - 当需要返回值时，switch 表达式比传统 switch 语句更简洁
   - 编译器会检查是否覆盖所有情况，提供更好的类型安全

2. **保持模式简洁**
   ```csharp
   // 避免过于复杂的模式
   // 不推荐
   var result = data switch
   {
       { A: { B: { C: { D: > 10 } } }, E: < 5, F: not null } => "复杂",
       _ => "简单"
   };

   // 推荐：拆分为方法
   var result = data switch
   {
       var d when IsComplexCondition(d) => "复杂",
       _ => "简单"
   };
   ```

3. **利用编译器的穷尽性检查**
   ```csharp
   public enum Status { Active, Inactive, Pending }

   // 编译器会警告未处理所有枚举值
   public string GetStatusText(Status status) => status switch
   {
       Status.Active => "活跃",
       Status.Inactive => "非活跃",
       Status.Pending => "待定"
       // 没有 _ 分支，添加新枚举值时会收到警告
   };
   ```

4. **合理使用 when 子句**
   - 当模式本身无法表达条件时使用 when
   - 避免在 when 中放置可以用模式表达的条件

5. **注意模式的顺序**
   ```csharp
   // 更具体的模式应该放在前面
   public string Process(int value) => value switch
   {
       42 => "特殊值",      // 具体常量
       > 0 and < 100 => "小正数",  // 范围
       > 0 => "大正数",     // 更宽泛的条件
       0 => "零",
       _ => "负数"          // 默认情况
   };
   ```

### 性能考量

1. **模式匹配通常不会有显著的性能开销**
   - 编译器会将模式匹配优化为高效的条件判断
   - 对于简单的类型检查，性能与手动类型检查相当

2. **避免在热路径中使用复杂的属性模式**
   ```csharp
   // 在性能关键代码中，考虑缓存属性访问
   // 而不是
   if (obj is { Prop1.Prop2.Prop3: > 100 }) { ... }

   // 考虑
   var value = obj?.Prop1?.Prop2?.Prop3;
   if (value > 100) { ... }
   ```

3. **列表模式的性能**
   - 列表模式会访问索引器，对于某些集合类型可能不是 O(1)
   - 对于大型集合，避免使用复杂的列表模式

4. **switch 表达式 vs switch 语句**
   - 在性能上通常没有显著差异
   - 编译器可能对两者应用相同的优化

### 调试技巧

```csharp
// 使用 var 模式捕获中间值进行调试
public string Debug(object input) => input switch
{
    string { Length: var len } s when len > 10 =>
        $"长字符串: {s[..10]}...",  // 可以在这里设置断点查看 len 和 s
    var unknown => $"类型: {unknown?.GetType().Name}"  // 捕获任何值
};
```

---

## 总结

C# 的模式匹配是一项功能强大且不断演进的语言特性。从 C# 7.0 的基础类型模式到 C# 11 的列表模式，每个版本都带来了新的能力：

- **类型模式**让类型检查和转换更加简洁
- **属性模式**使对象结构匹配变得直观
- **位置模式**简化了解构和元组处理
- **switch 表达式**提供了函数式风格的条件分支
- **关系模式和逻辑模式**增强了条件表达的能力
- **列表模式**为集合处理带来了新的可能性

掌握这些模式匹配技术，可以让你的 C# 代码更加简洁、类型安全、易于维护。随着 C# 语言的持续发展，模式匹配功能还将继续增强，值得持续关注和学习。
