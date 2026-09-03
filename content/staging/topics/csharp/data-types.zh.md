---
title: C# 数据类型深入解析
description: 全面掌握 C# 值类型与引用类型、可空类型、装箱拆箱、类型转换等核心概念
track: csharp
section: basics
difficulty: intermediate
tags:
  - C#
  - 数据类型
  - 值类型
  - 引用类型
  - 装箱拆箱
  - .NET
status: imported
origin: old/src/content/docs/csharp/data-types.zh.md
divergence: 0.188
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 语言基础
  order: 2
  lastUpdated: 2026-01-07
---

C# 是一门强类型语言，类型系统是其核心基础。深入理解数据类型不仅能帮助你编写正确的代码，更能让你写出高性能、内存友好的应用程序。本文将全面剖析 C# 的类型系统，包括值类型与引用类型的本质区别、可空类型的使用、装箱拆箱机制以及各种类型转换方式。

## 概念解释

### 什么是类型系统

类型系统是编程语言中用于定义和分类数据的规则集合。C# 的类型系统建立在 .NET 通用类型系统 (CTS, Common Type System) 之上，确保了跨语言的类型兼容性。

在 C# 中，所有类型都直接或间接继承自 `System.Object`，形成统一的类型层次结构：

```
System.Object
├── 值类型 (System.ValueType)
│   ├── 简单类型 (int, double, bool, char 等)
│   ├── 结构体 (struct)
│   └── 枚举 (enum)
└── 引用类型
    ├── 类 (class)
    ├── 接口 (interface)
    ├── 数组 (Array)
    ├── 委托 (delegate)
    └── 字符串 (string)
```

### 值类型 vs 引用类型

这是 C# 类型系统中最重要的区分：

**值类型 (Value Types)**：
- 直接存储数据值
- 存储在栈 (Stack) 上（局部变量）或内联在包含它的对象中
- 赋值时复制整个值
- 默认值为各类型的"零值"

**引用类型 (Reference Types)**：
- 存储数据的内存地址（引用）
- 实际数据存储在堆 (Heap) 上
- 赋值时只复制引用
- 默认值为 `null`

```csharp
// 值类型示例
int a = 10;
int b = a;      // 复制值，b 独立于 a
b = 20;         // 修改 b 不影响 a
Console.WriteLine(a);  // 输出：10

// 引用类型示例
int[] arr1 = { 1, 2, 3 };
int[] arr2 = arr1;    // 复制引用，指向同一数组
arr2[0] = 100;        // 修改 arr2 影响 arr1
Console.WriteLine(arr1[0]);  // 输出：100
```

### 可空类型

C# 2.0 引入了可空值类型，允许值类型存储 `null`。C# 8.0 进一步引入了可空引用类型，增强了空安全性。

```csharp
// 可空值类型
int? nullableInt = null;
double? nullableDouble = 3.14;

// 可空引用类型（需要启用可空上下文）
#nullable enable
string? nullableString = null;
string nonNullString = "Hello";  // 编译器期望此变量不为 null
```

### 装箱与拆箱

装箱 (Boxing) 是将值类型转换为引用类型的过程；拆箱 (Unboxing) 则是相反的操作。

```csharp
int value = 42;
object boxed = value;       // 装箱：值类型 -> 引用类型
int unboxed = (int)boxed;   // 拆箱：引用类型 -> 值类型
```

## 核心原理

### 内存布局原理

理解值类型和引用类型的内存布局是掌握 C# 类型系统的关键。

#### 值类型的内存布局

值类型的数据直接存储在分配的内存位置：

```csharp
struct Point
{
    public int X;  // 4 字节
    public int Y;  // 4 字节
}
// Point 结构体总共占用 8 字节（可能因对齐而有所不同）

// 局部变量存储在栈上
void Method()
{
    int a = 10;        // 栈上分配 4 字节
    Point p = new Point { X = 1, Y = 2 };  // 栈上分配 8 字节
}
```

**栈内存布局示意**：
```
栈顶 ↑
+------------------+
|  p.Y = 2         |  ← 4 字节
+------------------+
|  p.X = 1         |  ← 4 字节
+------------------+
|  a = 10          |  ← 4 字节
+------------------+
栈底 ↓
```

#### 引用类型的内存布局

引用类型在堆上分配，变量只存储引用（指针）：

```csharp
class Person
{
    public string Name;   // 引用（8 字节，64位系统）
    public int Age;       // 4 字节
}

void Method()
{
    Person person = new Person { Name = "张三", Age = 30 };
    // person 变量在栈上存储一个引用（8 字节）
    // Person 对象实际数据在堆上
}
```

**内存布局示意**：
```
栈                           堆
+----------------+          +-------------------+
| person (引用)  | ------→  | 对象头 (16 字节)   |
+----------------+          | Name 引用 (8 字节) | → 指向字符串 "张三"
                            | Age = 30 (4 字节)  |
                            | 填充 (4 字节)      |
                            +-------------------+
```

#### 对象头结构

.NET 中每个引用类型对象都有一个对象头，包含：
- **同步块索引**：用于线程同步
- **类型句柄**：指向类型元数据（方法表）

```csharp
// 使用 ObjectLayoutInspector 工具可以查看对象布局
// 一个空的引用类型对象在 64 位系统上至少占用 24 字节
class EmptyClass { }  // 16 字节对象头 + 8 字节最小对齐 = 24 字节
```

### 装箱拆箱的底层机制

#### 装箱过程

装箱操作包含以下步骤：
1. 在托管堆上分配内存（对象头 + 值的空间）
2. 将值类型的数据复制到新分配的堆内存
3. 返回指向堆对象的引用

```csharp
int value = 42;
object boxed = value;  // 装箱

// IL 代码大致如下：
// ldloc.0          // 加载局部变量 value
// box [mscorlib]System.Int32  // 执行装箱操作
// stloc.1          // 存储到 boxed 变量
```

**装箱内存示意**：
```
装箱前：
栈: [value = 42]

装箱后：
栈: [value = 42] [boxed → 堆地址]
堆: [对象头 | 42]
```

#### 拆箱过程

拆箱操作包含以下步骤：
1. 检查对象引用是否为 `null`（是则抛出 `NullReferenceException`）
2. 检查对象是否为指定值类型的装箱值（否则抛出 `InvalidCastException`）
3. 返回指向堆对象中值的指针
4. 将值复制到目标位置

```csharp
object boxed = 42;
int value = (int)boxed;  // 拆箱

// IL 代码大致如下：
// ldloc.0          // 加载 boxed
// unbox.any [mscorlib]System.Int32  // 执行拆箱操作
// stloc.1          // 存储到 value
```

### 类型转换机制

#### 隐式转换

编译器自动执行的安全转换，不会丢失数据：

```csharp
// 数值类型隐式转换链
// byte → short → int → long → float → double → decimal
// sbyte → short → int → long → float → double → decimal

byte b = 10;
int i = b;      // 隐式转换：byte → int
long l = i;     // 隐式转换：int → long
double d = l;   // 隐式转换：long → double

// 引用类型隐式转换（子类 → 父类）
string str = "Hello";
object obj = str;  // 隐式转换：string → object
```

#### 显式转换

需要显式指定的转换，可能丢失数据或抛出异常：

```csharp
// 数值类型显式转换
double d = 3.14159;
int i = (int)d;     // 显式转换：3（丢失小数部分）

long big = 1000000000000L;
int small = (int)big;  // 显式转换：可能溢出

// 引用类型显式转换（向下转型）
object obj = "Hello";
string str = (string)obj;  // 显式转换：object → string
```

#### 用户定义的转换

可以为自定义类型定义隐式或显式转换运算符：

```csharp
public struct Celsius
{
    public double Temperature { get; }

    public Celsius(double temperature)
    {
        Temperature = temperature;
    }

    // 隐式转换：Celsius → double
    public static implicit operator double(Celsius c)
    {
        return c.Temperature;
    }

    // 显式转换：double → Celsius
    public static explicit operator Celsius(double d)
    {
        return new Celsius(d);
    }

    // 隐式转换：Celsius → Fahrenheit
    public static implicit operator Fahrenheit(Celsius c)
    {
        return new Fahrenheit(c.Temperature * 9 / 5 + 32);
    }
}

public struct Fahrenheit
{
    public double Temperature { get; }

    public Fahrenheit(double temperature)
    {
        Temperature = temperature;
    }
}

// 使用示例
Celsius celsius = (Celsius)25.0;  // 显式转换
double temp = celsius;             // 隐式转换
Fahrenheit fahrenheit = celsius;   // 隐式转换
```

## 核心要点

### 值类型详解

#### 简单值类型

| 类型 | .NET 类型 | 大小 | 范围 | 默认值 |
|------|-----------|------|------|--------|
| `sbyte` | System.SByte | 1 字节 | -128 ~ 127 | 0 |
| `byte` | System.Byte | 1 字节 | 0 ~ 255 | 0 |
| `short` | System.Int16 | 2 字节 | -32,768 ~ 32,767 | 0 |
| `ushort` | System.UInt16 | 2 字节 | 0 ~ 65,535 | 0 |
| `int` | System.Int32 | 4 字节 | -2^31 ~ 2^31-1 | 0 |
| `uint` | System.UInt32 | 4 字节 | 0 ~ 2^32-1 | 0 |
| `long` | System.Int64 | 8 字节 | -2^63 ~ 2^63-1 | 0L |
| `ulong` | System.UInt64 | 8 字节 | 0 ~ 2^64-1 | 0UL |
| `float` | System.Single | 4 字节 | ±1.5×10^-45 ~ ±3.4×10^38 | 0.0f |
| `double` | System.Double | 8 字节 | ±5.0×10^-324 ~ ±1.7×10^308 | 0.0d |
| `decimal` | System.Decimal | 16 字节 | ±1.0×10^-28 ~ ±7.9×10^28 | 0.0m |
| `bool` | System.Boolean | 1 字节 | true/false | false |
| `char` | System.Char | 2 字节 | U+0000 ~ U+FFFF | '\0' |

#### 结构体 (struct)

结构体是用户自定义的值类型：

```csharp
// 不可变结构体（推荐模式）
public readonly struct Vector3
{
    public readonly float X;
    public readonly float Y;
    public readonly float Z;

    public Vector3(float x, float y, float z)
    {
        X = x;
        Y = y;
        Z = z;
    }

    public float Length => MathF.Sqrt(X * X + Y * Y + Z * Z);

    public Vector3 Normalize()
    {
        float len = Length;
        return new Vector3(X / len, Y / len, Z / len);
    }

    public static Vector3 operator +(Vector3 a, Vector3 b)
        => new Vector3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);

    public static Vector3 operator *(Vector3 v, float scalar)
        => new Vector3(v.X * scalar, v.Y * scalar, v.Z * scalar);
}

// 使用 record struct（C# 10+）
public readonly record struct Point3D(double X, double Y, double Z);
```

#### 枚举 (enum)

枚举是命名的整数常量集合：

```csharp
// 基本枚举
public enum DayOfWeek
{
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
}

// 指定基础类型
public enum FilePermission : byte
{
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4
}

// 标志枚举
[Flags]
public enum FileAccess
{
    None = 0,
    Read = 1,       // 0001
    Write = 2,      // 0010
    Execute = 4,    // 0100
    ReadWrite = Read | Write,  // 0011
    All = Read | Write | Execute  // 0111
}

// 使用标志枚举
FileAccess access = FileAccess.Read | FileAccess.Write;
bool canRead = (access & FileAccess.Read) == FileAccess.Read;  // true
bool canExecute = access.HasFlag(FileAccess.Execute);  // false
```

### 引用类型详解

#### 类 (class)

类是最常用的引用类型：

```csharp
public class Person
{
    // 字段
    private string _name;
    private int _age;

    // 属性
    public string Name
    {
        get => _name;
        set => _name = value ?? throw new ArgumentNullException(nameof(value));
    }

    public int Age
    {
        get => _age;
        set => _age = value >= 0 ? value : throw new ArgumentException("年龄不能为负");
    }

    // 自动属性
    public string? Email { get; set; }

    // 只读属性
    public bool IsAdult => Age >= 18;

    // 构造函数
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}
```

#### 字符串 (string)

字符串是特殊的引用类型，具有值类型的语义：

```csharp
// 字符串的不可变性
string s1 = "Hello";
string s2 = s1;
s1 = "World";  // s1 指向新字符串，s2 仍然是 "Hello"
Console.WriteLine(s2);  // 输出：Hello

// 字符串驻留 (String Interning)
string a = "Hello";
string b = "Hello";
Console.WriteLine(ReferenceEquals(a, b));  // true（同一对象）

string c = new string("Hello".ToCharArray());
Console.WriteLine(ReferenceEquals(a, c));  // false（不同对象）

// 强制驻留
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));  // true
```

#### 数组

数组是引用类型，元素可以是值类型或引用类型：

```csharp
// 值类型数组：元素值存储在数组中
int[] numbers = { 1, 2, 3, 4, 5 };

// 引用类型数组：存储的是引用
string[] names = { "Alice", "Bob", "Charlie" };

// 多维数组
int[,] matrix = new int[3, 3];

// 交错数组（数组的数组）
int[][] jagged = new int[3][];
jagged[0] = new int[] { 1, 2 };
jagged[1] = new int[] { 3, 4, 5 };
jagged[2] = new int[] { 6 };
```

### 可空类型详解

#### 可空值类型 (Nullable<T>)

```csharp
// Nullable<T> 结构体
public struct Nullable<T> where T : struct
{
    private readonly bool hasValue;
    private readonly T value;

    public bool HasValue => hasValue;
    public T Value => hasValue ? value : throw new InvalidOperationException();
    public T GetValueOrDefault() => value;
    public T GetValueOrDefault(T defaultValue) => hasValue ? value : defaultValue;
}

// 使用可空值类型
int? nullableInt = null;
int? anotherInt = 42;

// 检查值
if (nullableInt.HasValue)
{
    Console.WriteLine(nullableInt.Value);
}

// 空合并运算符
int result = nullableInt ?? 0;

// 空条件运算符与空合并组合
int length = nullableInt?.ToString().Length ?? 0;

// 可空值类型的比较
int? a = 10;
int? b = null;
int? c = 10;

Console.WriteLine(a == c);   // true
Console.WriteLine(a == b);   // false
Console.WriteLine(b == null); // true

// 提升的运算符 (Lifted Operators)
int? x = 5;
int? y = 10;
int? sum = x + y;  // 15
int? product = x * null;  // null
```

#### 可空引用类型 (C# 8.0+)

```csharp
#nullable enable

public class NullableReferenceDemo
{
    // 不可空引用类型 - 编译器期望永不为 null
    private string _name;

    // 可空引用类型 - 可能为 null
    private string? _nickname;

    public NullableReferenceDemo(string name)
    {
        _name = name ?? throw new ArgumentNullException(nameof(name));
        // _nickname 默认为 null，这是允许的
    }

    public string GetDisplayName()
    {
        // 需要检查可空类型
        if (_nickname != null)
        {
            return _nickname;  // 这里编译器知道 _nickname 不为 null
        }

        // 使用空合并运算符
        return _nickname ?? _name;
    }

    public void ProcessData(string? data)
    {
        // 空容忍运算符 (!) - 告诉编译器这里不会是 null
        // 谨慎使用，可能导致运行时 NullReferenceException
        int length = data!.Length;

        // 更安全的方式
        if (data is not null)
        {
            Console.WriteLine(data.Length);
        }
    }
}
```

### 类型转换详解

#### 安全类型转换方法

```csharp
// as 运算符 - 转换失败返回 null
object obj = "Hello";
string? str = obj as string;  // "Hello"
int? num = obj as int?;       // null（不能直接转为值类型）

// is 运算符 - 类型检查
if (obj is string s)
{
    Console.WriteLine(s.Length);  // s 在此作用域内可用
}

// is 与模式匹配
object value = 42;
if (value is int n && n > 0)
{
    Console.WriteLine($"正整数：{n}");
}

// switch 表达式中的类型模式
string GetTypeDescription(object obj) => obj switch
{
    int i => $"整数：{i}",
    double d => $"浮点数：{d:F2}",
    string s => $"字符串长度：{s.Length}",
    null => "空值",
    _ => $"其他类型：{obj.GetType().Name}"
};
```

#### Convert 类

```csharp
// Convert 类提供类型转换方法
string strNumber = "42";
int intValue = Convert.ToInt32(strNumber);
double doubleValue = Convert.ToDouble(strNumber);

// 处理 null
string? nullStr = null;
int result = Convert.ToInt32(nullStr);  // 返回 0，不会抛出异常

// 进制转换
int number = 255;
string binary = Convert.ToString(number, 2);   // "11111111"
string octal = Convert.ToString(number, 8);    // "377"
string hex = Convert.ToString(number, 16);     // "ff"

int fromBinary = Convert.ToInt32("11111111", 2);  // 255
int fromHex = Convert.ToInt32("ff", 16);          // 255
```

#### Parse 和 TryParse

```csharp
// Parse - 转换失败抛出异常
int value1 = int.Parse("42");
double value2 = double.Parse("3.14");
DateTime date = DateTime.Parse("2024-01-15");

// TryParse - 转换失败返回 false（推荐）
if (int.TryParse("42", out int result))
{
    Console.WriteLine($"转换成功：{result}");
}
else
{
    Console.WriteLine("转换失败");
}

// 带格式的解析
if (int.TryParse("FF", NumberStyles.HexNumber, null, out int hexValue))
{
    Console.WriteLine($"十六进制解析：{hexValue}");  // 255
}

// 区域性相关的解析
var culture = new CultureInfo("de-DE");  // 德国使用逗号作为小数点
if (double.TryParse("3,14", NumberStyles.Float, culture, out double germanNumber))
{
    Console.WriteLine($"德国格式数字：{germanNumber}");  // 3.14
}
```

## 代码示例

### 示例 1：值类型与引用类型的行为差异

```csharp
using System;

public struct PointStruct
{
    public int X;
    public int Y;

    public PointStruct(int x, int y)
    {
        X = x;
        Y = y;
    }

    public override string ToString() => $"({X}, {Y})";
}

public class PointClass
{
    public int X;
    public int Y;

    public PointClass(int x, int y)
    {
        X = x;
        Y = y;
    }

    public override string ToString() => $"({X}, {Y})";
}

public class ValueVsReferenceDemo
{
    public static void Run()
    {
        Console.WriteLine("=== 值类型行为 ===");

        // 值类型：复制值
        PointStruct ps1 = new PointStruct(10, 20);
        PointStruct ps2 = ps1;  // 复制整个结构体
        ps2.X = 100;

        Console.WriteLine($"ps1: {ps1}");  // (10, 20) - 未改变
        Console.WriteLine($"ps2: {ps2}");  // (100, 20)

        // 方法参数传递
        ModifyStruct(ps1);
        Console.WriteLine($"调用 ModifyStruct 后 ps1: {ps1}");  // (10, 20) - 未改变

        Console.WriteLine("\n=== 引用类型行为 ===");

        // 引用类型：复制引用
        PointClass pc1 = new PointClass(10, 20);
        PointClass pc2 = pc1;  // 复制引用，指向同一对象
        pc2.X = 100;

        Console.WriteLine($"pc1: {pc1}");  // (100, 20) - 被改变！
        Console.WriteLine($"pc2: {pc2}");  // (100, 20)

        // 方法参数传递
        pc1 = new PointClass(10, 20);  // 重置
        ModifyClass(pc1);
        Console.WriteLine($"调用 ModifyClass 后 pc1: {pc1}");  // (999, 20) - 被改变！

        Console.WriteLine("\n=== ref 参数传递 ===");

        // 使用 ref 可以让值类型也"按引用传递"
        PointStruct ps3 = new PointStruct(10, 20);
        ModifyStructByRef(ref ps3);
        Console.WriteLine($"调用 ModifyStructByRef 后 ps3: {ps3}");  // (888, 20)
    }

    static void ModifyStruct(PointStruct p)
    {
        p.X = 999;  // 修改的是副本
    }

    static void ModifyClass(PointClass p)
    {
        p.X = 999;  // 修改的是原对象
    }

    static void ModifyStructByRef(ref PointStruct p)
    {
        p.X = 888;  // 通过引用修改原结构体
    }
}
```

### 示例 2：装箱拆箱的性能影响

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;

public class BoxingPerformanceDemo
{
    private const int Iterations = 1000000;

    public static void Run()
    {
        Console.WriteLine($"迭代次数：{Iterations:N0}\n");

        // 测试非泛型集合（会发生装箱）
        TestArrayList();

        // 测试泛型集合（不会装箱）
        TestGenericList();

        // 测试装箱操作
        TestBoxing();

        // 测试避免装箱的方法
        TestAvoidBoxing();
    }

    static void TestArrayList()
    {
        var sw = Stopwatch.StartNew();
        ArrayList list = new ArrayList();

        for (int i = 0; i < Iterations; i++)
        {
            list.Add(i);  // 装箱发生在这里
        }

        long sum = 0;
        foreach (object obj in list)
        {
            sum += (int)obj;  // 拆箱发生在这里
        }

        sw.Stop();
        Console.WriteLine($"ArrayList (装箱/拆箱): {sw.ElapsedMilliseconds} ms, Sum: {sum}");
    }

    static void TestGenericList()
    {
        var sw = Stopwatch.StartNew();
        List<int> list = new List<int>();

        for (int i = 0; i < Iterations; i++)
        {
            list.Add(i);  // 无装箱
        }

        long sum = 0;
        foreach (int num in list)
        {
            sum += num;  // 无拆箱
        }

        sw.Stop();
        Console.WriteLine($"List<int> (无装箱):    {sw.ElapsedMilliseconds} ms, Sum: {sum}");
    }

    static void TestBoxing()
    {
        var sw = Stopwatch.StartNew();
        object boxed = null;

        for (int i = 0; i < Iterations; i++)
        {
            boxed = i;  // 每次都装箱
            int value = (int)boxed;  // 每次都拆箱
        }

        sw.Stop();
        Console.WriteLine($"显式装箱/拆箱:         {sw.ElapsedMilliseconds} ms");
    }

    static void TestAvoidBoxing()
    {
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            int value = i;  // 无装箱
            int copy = value;  // 值复制
        }

        sw.Stop();
        Console.WriteLine($"无装箱操作:            {sw.ElapsedMilliseconds} ms");
    }
}
```

### 示例 3：可空类型的高级用法

```csharp
using System;

public class NullableAdvancedDemo
{
    public static void Run()
    {
        // 数据库场景模拟
        var person = new PersonRecord
        {
            Id = 1,
            Name = "张三",
            Age = 30,
            Email = null,  // 可选字段
            BirthDate = new DateTime(1994, 5, 15),
            LastLoginDate = null  // 从未登录
        };

        DisplayPersonInfo(person);

        Console.WriteLine("\n=== 可空类型运算 ===");
        NullableArithmetic();

        Console.WriteLine("\n=== 空值处理模式 ===");
        NullHandlingPatterns();
    }

    static void DisplayPersonInfo(PersonRecord person)
    {
        Console.WriteLine("=== 人员信息 ===");
        Console.WriteLine($"ID: {person.Id}");
        Console.WriteLine($"姓名: {person.Name}");
        Console.WriteLine($"年龄: {person.Age}");

        // 使用空合并运算符提供默认值
        Console.WriteLine($"邮箱: {person.Email ?? "未设置"}");

        // 使用空条件运算符安全访问
        Console.WriteLine($"邮箱域名: {person.Email?.Split('@').LastOrDefault() ?? "无"}");

        // 条件表达式处理可空值
        string loginStatus = person.LastLoginDate.HasValue
            ? $"最后登录: {person.LastLoginDate.Value:yyyy-MM-dd HH:mm}"
            : "从未登录";
        Console.WriteLine(loginStatus);

        // 计算年龄（从出生日期）
        if (person.BirthDate.HasValue)
        {
            int calculatedAge = DateTime.Today.Year - person.BirthDate.Value.Year;
            if (DateTime.Today < person.BirthDate.Value.AddYears(calculatedAge))
                calculatedAge--;
            Console.WriteLine($"根据出生日期计算的年龄: {calculatedAge}");
        }
    }

    static void NullableArithmetic()
    {
        int? a = 10;
        int? b = 5;
        int? c = null;

        // 可空类型运算
        Console.WriteLine($"a + b = {a + b}");      // 15
        Console.WriteLine($"a * b = {a * b}");      // 50
        Console.WriteLine($"a + c = {a + c}");      // null（任何与 null 运算结果为 null）
        Console.WriteLine($"a > b = {a > b}");      // true
        Console.WriteLine($"a > c = {a > c}");      // false（与 null 比较总是 false）
        Console.WriteLine($"c > a = {c > a}");      // false

        // GetValueOrDefault 的使用
        Console.WriteLine($"c.GetValueOrDefault() = {c.GetValueOrDefault()}");      // 0
        Console.WriteLine($"c.GetValueOrDefault(100) = {c.GetValueOrDefault(100)}"); // 100

        // 空合并赋值
        c ??= 50;  // 如果 c 为 null，则赋值为 50
        Console.WriteLine($"c ??= 50 后，c = {c}");  // 50
    }

    static void NullHandlingPatterns()
    {
        string? input = GetUserInput();

        // 模式 1：传统 null 检查
        if (input != null)
        {
            Console.WriteLine($"[传统检查] 输入长度: {input.Length}");
        }

        // 模式 2：is not null 模式匹配
        if (input is not null)
        {
            Console.WriteLine($"[模式匹配] 输入: {input}");
        }

        // 模式 3：空合并运算符
        string safeInput = input ?? "默认值";
        Console.WriteLine($"[空合并] 安全输入: {safeInput}");

        // 模式 4：空条件运算符链
        int? length = input?.Trim()?.ToUpper()?.Length;
        Console.WriteLine($"[空条件链] 长度: {length?.ToString() ?? "无法获取"}");

        // 模式 5：switch 表达式处理 null
        string description = input switch
        {
            null => "输入为空",
            "" => "输入为空字符串",
            { Length: < 5 } => "输入太短",
            { Length: > 100 } => "输入太长",
            _ => $"有效输入: {input}"
        };
        Console.WriteLine($"[switch 表达式] {description}");
    }

    static string? GetUserInput()
    {
        // 模拟可能返回 null 的方法
        return "  Hello World  ";
    }
}

public class PersonRecord
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public string? Email { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? LastLoginDate { get; set; }
}
```

### 示例 4：类型转换的安全实践

```csharp
using System;
using System.Globalization;

public class TypeConversionDemo
{
    public static void Run()
    {
        Console.WriteLine("=== 安全的类型转换 ===\n");

        // 数值转换
        SafeNumericConversions();

        // 字符串解析
        SafeStringParsing();

        // 对象类型转换
        SafeObjectCasting();

        // 自定义类型转换
        CustomTypeConversions();
    }

    static void SafeNumericConversions()
    {
        Console.WriteLine("--- 数值类型转换 ---");

        // checked 上下文 - 溢出时抛出异常
        try
        {
            checked
            {
                int maxInt = int.MaxValue;
                int overflow = maxInt + 1;  // OverflowException
            }
        }
        catch (OverflowException)
        {
            Console.WriteLine("checked: 检测到整数溢出");
        }

        // unchecked 上下文 - 溢出时回绕
        unchecked
        {
            int maxInt = int.MaxValue;
            int wrapped = maxInt + 1;
            Console.WriteLine($"unchecked: int.MaxValue + 1 = {wrapped}");  // -2147483648
        }

        // 安全的窄化转换
        long bigNumber = 1000000000000L;
        if (bigNumber >= int.MinValue && bigNumber <= int.MaxValue)
        {
            int safeInt = (int)bigNumber;
            Console.WriteLine($"安全转换: {safeInt}");
        }
        else
        {
            Console.WriteLine($"数值 {bigNumber} 超出 int 范围");
        }

        // 浮点数精度问题
        float f = 0.1f;
        double d = 0.1;
        decimal m = 0.1m;

        Console.WriteLine($"float 精度:   {f:G20}");    // 0.100000001490116...
        Console.WriteLine($"double 精度:  {d:G20}");   // 0.10000000000000001
        Console.WriteLine($"decimal 精度: {m}");        // 0.1（精确）

        Console.WriteLine();
    }

    static void SafeStringParsing()
    {
        Console.WriteLine("--- 字符串解析 ---");

        string[] inputs = { "42", "-100", "3.14", "not a number", "", null! };

        foreach (string input in inputs)
        {
            // 安全的整数解析
            if (int.TryParse(input, out int intResult))
            {
                Console.WriteLine($"'{input}' -> int: {intResult}");
            }
            else
            {
                Console.WriteLine($"'{input ?? "null"}' -> 无法解析为 int");
            }
        }

        Console.WriteLine();

        // 带格式的解析
        string[] moneyInputs = { "$1,234.56", "1234.56", "1.234,56" };

        foreach (string money in moneyInputs)
        {
            // 美国格式
            if (decimal.TryParse(money, NumberStyles.Currency, CultureInfo.GetCultureInfo("en-US"), out decimal usd))
            {
                Console.WriteLine($"'{money}' (US) -> {usd:C}");
            }
            // 德国格式
            else if (decimal.TryParse(money, NumberStyles.Currency, CultureInfo.GetCultureInfo("de-DE"), out decimal eur))
            {
                Console.WriteLine($"'{money}' (DE) -> {eur:C}");
            }
            else
            {
                Console.WriteLine($"'{money}' -> 无法解析");
            }
        }

        Console.WriteLine();
    }

    static void SafeObjectCasting()
    {
        Console.WriteLine("--- 对象类型转换 ---");

        object[] objects = { 42, "Hello", 3.14, new int[] { 1, 2, 3 }, null! };

        foreach (object obj in objects)
        {
            // 使用 is 进行安全检查和转换
            string description = obj switch
            {
                int i => $"整数: {i}",
                string s => $"字符串: '{s}' (长度: {s.Length})",
                double d => $"浮点数: {d:F2}",
                int[] arr => $"整数数组: [{string.Join(", ", arr)}]",
                null => "空值",
                _ => $"未知类型: {obj.GetType().Name}"
            };

            Console.WriteLine(description);
        }

        // as 运算符的使用
        object maybeString = "Hello";
        string? str = maybeString as string;
        Console.WriteLine($"\nas 转换结果: {str ?? "转换失败"}");

        // 使用泛型方法进行安全转换
        var result = SafeCast<string>(maybeString);
        Console.WriteLine($"SafeCast 结果: {result ?? "转换失败"}");

        Console.WriteLine();
    }

    static T? SafeCast<T>(object obj) where T : class
    {
        return obj as T;
    }

    static void CustomTypeConversions()
    {
        Console.WriteLine("--- 自定义类型转换 ---");

        // 使用自定义转换
        Temperature celsius = new Temperature(25, TemperatureUnit.Celsius);
        Temperature fahrenheit = celsius.ToFahrenheit();
        Temperature kelvin = celsius.ToKelvin();

        Console.WriteLine($"摄氏度: {celsius}");
        Console.WriteLine($"华氏度: {fahrenheit}");
        Console.WriteLine($"开尔文: {kelvin}");

        // 隐式和显式转换
        double tempValue = celsius;  // 隐式转换
        Temperature fromDouble = (Temperature)30.5;  // 显式转换

        Console.WriteLine($"隐式转换到 double: {tempValue}");
        Console.WriteLine($"显式转换从 double: {fromDouble}");
    }
}

public enum TemperatureUnit { Celsius, Fahrenheit, Kelvin }

public readonly struct Temperature
{
    public double Value { get; }
    public TemperatureUnit Unit { get; }

    public Temperature(double value, TemperatureUnit unit)
    {
        Value = value;
        Unit = unit;
    }

    public Temperature ToFahrenheit() => Unit switch
    {
        TemperatureUnit.Celsius => new Temperature(Value * 9 / 5 + 32, TemperatureUnit.Fahrenheit),
        TemperatureUnit.Kelvin => new Temperature((Value - 273.15) * 9 / 5 + 32, TemperatureUnit.Fahrenheit),
        _ => this
    };

    public Temperature ToCelsius() => Unit switch
    {
        TemperatureUnit.Fahrenheit => new Temperature((Value - 32) * 5 / 9, TemperatureUnit.Celsius),
        TemperatureUnit.Kelvin => new Temperature(Value - 273.15, TemperatureUnit.Celsius),
        _ => this
    };

    public Temperature ToKelvin() => Unit switch
    {
        TemperatureUnit.Celsius => new Temperature(Value + 273.15, TemperatureUnit.Kelvin),
        TemperatureUnit.Fahrenheit => new Temperature((Value - 32) * 5 / 9 + 273.15, TemperatureUnit.Kelvin),
        _ => this
    };

    // 隐式转换到 double
    public static implicit operator double(Temperature t) => t.Value;

    // 显式转换从 double（假定摄氏度）
    public static explicit operator Temperature(double value) =>
        new Temperature(value, TemperatureUnit.Celsius);

    public override string ToString() => $"{Value:F2}° {Unit}";
}
```

## 最佳实践

### 选择正确的类型

```csharp
// 优先选择的类型场景

// 1. 金融计算使用 decimal，避免浮点误差
decimal price = 19.99m;
decimal total = price * 100;  // 精确的 1999.00

// 2. 科学计算使用 double，性能更好
double distance = 384400.5;  // 地月距离（公里）
double speed = 299792.458;   // 光速（公里/秒）

// 3. 小数据集合使用数组，大数据集合使用 List<T>
int[] fixedArray = new int[10];  // 固定大小
List<int> dynamicList = new List<int>();  // 动态大小

// 4. 简单数据传输使用结构体
public readonly record struct Coordinate(double Latitude, double Longitude);

// 5. 需要继承或多态时使用类
public abstract class Shape
{
    public abstract double Area { get; }
}
```

### 避免不必要的装箱

```csharp
// 不好的做法：导致装箱
void PrintValues(ArrayList list)  // 非泛型集合
{
    foreach (object item in list)  // 拆箱
    {
        Console.WriteLine(item);
    }
}

// 好的做法：使用泛型避免装箱
void PrintValues<T>(IEnumerable<T> items)
{
    foreach (T item in items)  // 无装箱
    {
        Console.WriteLine(item);
    }
}

// 不好的做法：字符串拼接导致装箱
int count = 42;
string message = "Count: " + count;  // count 被装箱

// 好的做法：使用字符串插值或 ToString()
string message1 = $"Count: {count}";  // 无装箱
string message2 = "Count: " + count.ToString();  // 无装箱
```

### 正确使用可空类型

```csharp
// 启用可空引用类型
#nullable enable

public class Repository
{
    // 明确标记可能为 null 的返回值
    public User? FindById(int id)
    {
        // 可能返回 null
        return _users.FirstOrDefault(u => u.Id == id);
    }

    // 不会返回 null 的方法
    public User GetById(int id)
    {
        return _users.First(u => u.Id == id);
        // 如果找不到会抛出异常
    }

    // 参数处理
    public void UpdateUser(User user, string? email = null)
    {
        // 空值安全处理
        if (email is not null)
        {
            user.Email = email;
        }
    }

    private readonly List<User> _users = new();
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }  // 明确可空
}
```

### 类型转换的安全模式

```csharp
public static class SafeConvert
{
    // 安全的整数转换
    public static int? ToInt32(string? value)
    {
        return int.TryParse(value, out int result) ? result : null;
    }

    // 带默认值的转换
    public static int ToInt32(string? value, int defaultValue)
    {
        return int.TryParse(value, out int result) ? result : defaultValue;
    }

    // 安全的枚举转换
    public static TEnum? ToEnum<TEnum>(string? value) where TEnum : struct, Enum
    {
        return Enum.TryParse<TEnum>(value, true, out var result) ? result : null;
    }

    // 安全的对象转换
    public static T? As<T>(object? obj) where T : class
    {
        return obj as T;
    }

    // 带验证的转换
    public static T Cast<T>(object? obj)
    {
        if (obj is T result)
        {
            return result;
        }

        throw new InvalidCastException(
            $"无法将 '{obj?.GetType().Name ?? "null"}' 转换为 '{typeof(T).Name}'");
    }
}
```

### 结构体设计准则

```csharp
// 好的结构体设计 - 不可变、小型、表示单一值
public readonly struct Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency ?? throw new ArgumentNullException(nameof(currency));
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("货币类型不匹配");
        return new Money(Amount + other.Amount, Currency);
    }

    public bool Equals(Money other)
    {
        return Amount == other.Amount && Currency == other.Currency;
    }

    public override bool Equals(object? obj)
    {
        return obj is Money other && Equals(other);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Amount, Currency);
    }

    public static bool operator ==(Money left, Money right) => left.Equals(right);
    public static bool operator !=(Money left, Money right) => !left.Equals(right);

    public override string ToString() => $"{Amount:N2} {Currency}";
}
```

## 常见陷阱

### 浮点数精度问题

```csharp
// 陷阱：浮点数比较
double a = 0.1 + 0.2;
double b = 0.3;
Console.WriteLine(a == b);  // false！

// 原因：浮点数无法精确表示某些小数
Console.WriteLine($"0.1 + 0.2 = {a:G17}");  // 0.30000000000000004
Console.WriteLine($"0.3 = {b:G17}");        // 0.29999999999999999

// 解决方案 1：使用容差比较
const double Epsilon = 1e-10;
bool areEqual = Math.Abs(a - b) < Epsilon;
Console.WriteLine($"使用容差比较: {areEqual}");  // true

// 解决方案 2：使用 decimal 进行精确计算
decimal x = 0.1m + 0.2m;
decimal y = 0.3m;
Console.WriteLine(x == y);  // true
```

### 装箱导致的相等性问题

```csharp
// 陷阱：装箱对象的比较
int value1 = 100;
int value2 = 100;
object boxed1 = value1;
object boxed2 = value2;

Console.WriteLine(value1 == value2);   // true（值比较）
Console.WriteLine(boxed1 == boxed2);   // false！（引用比较）

// 解决方案：使用 Equals 方法
Console.WriteLine(boxed1.Equals(boxed2));  // true

// 注意：小整数有缓存（但这是实现细节，不要依赖）
// 这在某些语言中可能返回 true，但在 C# 中总是 false
```

### 可空类型的 null 传播

```csharp
// 陷阱：null 在运算中的传播
int? a = 10;
int? b = null;
int? result = a + b;  // null，不是 10！

// 陷阱：条件运算符和可空类型
int? value = null;
// int result = condition ? value : 0;  // 编译错误！
int? nullableResult = true ? value : 0;  // 正确

// 解决方案：使用空合并运算符
int safeResult = (a + b) ?? 0;  // 0
int computed = (a ?? 0) + (b ?? 0);  // 10
```

### 值类型的默认值陷阱

```csharp
public struct Config
{
    public int Timeout;      // 默认值是 0
    public bool IsEnabled;   // 默认值是 false
}

// 陷阱：无法区分"未设置"和"设置为默认值"
Config config = new Config();
Console.WriteLine(config.Timeout);    // 0 - 是有意设置还是未设置？
Console.WriteLine(config.IsEnabled);  // false - 同样的问题

// 解决方案 1：使用可空类型
public struct ConfigV2
{
    public int? Timeout;
    public bool? IsEnabled;
}

// 解决方案 2：使用 Nullable 或特殊值表示未设置
public struct ConfigV3
{
    public int Timeout;
    public bool TimeoutWasSet;
}
```

### 字符串比较陷阱

```csharp
// 陷阱：不同文化下的字符串比较
string s1 = "straße";  // 德语：街道
string s2 = "STRASSE";

// 默认比较可能产生意外结果
Console.WriteLine(s1.Equals(s2, StringComparison.CurrentCultureIgnoreCase));

// 解决方案：明确指定比较类型
Console.WriteLine(s1.Equals(s2, StringComparison.OrdinalIgnoreCase));

// 陷阱：string.Empty vs null
string? empty = "";
string? nullStr = null;

Console.WriteLine(string.IsNullOrEmpty(empty));     // true
Console.WriteLine(string.IsNullOrEmpty(nullStr));   // true
Console.WriteLine(empty == nullStr);                // false

// 推荐：使用 IsNullOrWhiteSpace 进行更严格的检查
Console.WriteLine(string.IsNullOrWhiteSpace("  ")); // true
```

### 类型转换的隐式丢失

```csharp
// 陷阱：整数除法
int a = 5;
int b = 2;
double result = a / b;  // 2.0，不是 2.5！

// 原因：先执行整数除法，再转换结果

// 解决方案：先转换操作数
double correctResult = (double)a / b;  // 2.5
double alsoCorrect = a / (double)b;    // 2.5

// 陷阱：精度丢失
long bigNumber = 9007199254740993L;  // 超过 double 精度
double asDouble = bigNumber;
long backToLong = (long)asDouble;
Console.WriteLine(bigNumber == backToLong);  // false！

// 解决方案：使用 decimal 保持精度
decimal asDecimal = bigNumber;
long safeBack = (long)asDecimal;
Console.WriteLine(bigNumber == safeBack);  // true
```

## 性能考量

### 值类型 vs 引用类型的性能

```csharp
using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]
public class TypePerformanceBenchmark
{
    private const int Iterations = 100000;

    // 结构体版本
    public readonly struct PointStruct
    {
        public readonly double X, Y;
        public PointStruct(double x, double y) { X = x; Y = y; }
        public double Distance => Math.Sqrt(X * X + Y * Y);
    }

    // 类版本
    public class PointClass
    {
        public double X, Y;
        public PointClass(double x, double y) { X = x; Y = y; }
        public double Distance => Math.Sqrt(X * X + Y * Y);
    }

    [Benchmark]
    public double StructPerformance()
    {
        double sum = 0;
        for (int i = 0; i < Iterations; i++)
        {
            var p = new PointStruct(i, i);  // 栈分配
            sum += p.Distance;
        }
        return sum;
    }

    [Benchmark]
    public double ClassPerformance()
    {
        double sum = 0;
        for (int i = 0; i < Iterations; i++)
        {
            var p = new PointClass(i, i);  // 堆分配
            sum += p.Distance;
        }
        return sum;
    }
}

// 典型结果：
// |           Method |     Mean |    Allocated |
// |----------------- |---------:|-------------:|
// | StructPerformance|  1.5 ms  |         0 B  |
// |  ClassPerformance|  3.2 ms  |  2,400,000 B |
```

### 装箱拆箱的性能影响

```csharp
// 装箱拆箱的性能成本
// 1. 堆内存分配
// 2. 数据复制
// 3. 垃圾回收压力

// 避免装箱的策略

// 策略 1：使用泛型
public interface IProcessor<T>
{
    void Process(T value);
}

public class IntProcessor : IProcessor<int>
{
    public void Process(int value) { /* 无装箱 */ }
}

// 策略 2：使用泛型约束
public void ProcessValue<T>(T value) where T : struct
{
    // value 不会被装箱
}

// 策略 3：避免将值类型传给 object 参数
// 不好：
void LogObject(object value)
{
    Console.WriteLine(value);  // 值类型会装箱
}

// 好：
void Log<T>(T value)
{
    Console.WriteLine(value);  // 无装箱
}
```

### 字符串性能优化

```csharp
// 字符串是不可变的，每次修改都会创建新对象

// 不好的做法：循环中拼接字符串
string result = "";
for (int i = 0; i < 1000; i++)
{
    result += i.ToString();  // 每次都创建新字符串
}

// 好的做法：使用 StringBuilder
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++)
{
    sb.Append(i);
}
string result2 = sb.ToString();

// 更好的做法：使用 string.Join
var numbers = Enumerable.Range(0, 1000);
string result3 = string.Join("", numbers);

// 预分配容量
var sb2 = new StringBuilder(capacity: 5000);  // 预估大小
```

### Span<T> 和高性能类型

```csharp
// Span<T> 提供高性能的内存访问
public void ProcessData(ReadOnlySpan<byte> data)
{
    // Span 是栈分配的，无堆内存开销
    foreach (byte b in data)
    {
        // 处理数据
    }
}

// 字符串切片无需分配新内存
public void ParseHeader(ReadOnlySpan<char> line)
{
    int colonIndex = line.IndexOf(':');
    if (colonIndex > 0)
    {
        ReadOnlySpan<char> key = line.Slice(0, colonIndex);
        ReadOnlySpan<char> value = line.Slice(colonIndex + 1).Trim();
        // 无字符串分配
    }
}

// stackalloc 用于小型临时数组
public int ComputeHash(ReadOnlySpan<byte> data)
{
    Span<byte> buffer = stackalloc byte[256];  // 栈分配
    // 使用 buffer...
    return 0;
}
```

## 实战场景

### 场景 1：数据库实体映射

```csharp
// 数据库可能返回 null 值，使用可空类型处理
public class UserEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string? Email { get; set; }           // 可选
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }   // 从未登录时为 null
    public int? DepartmentId { get; set; }       // 外键可能为空
}

public class UserRepository
{
    public UserDto? GetUser(int id)
    {
        var entity = _context.Users.Find(id);
        if (entity == null) return null;

        return new UserDto
        {
            Id = entity.Id,
            Username = entity.Username,
            Email = entity.Email ?? "未设置",
            DisplayName = FormatDisplayName(entity),
            DaysSinceLastLogin = entity.LastLoginAt.HasValue
                ? (DateTime.Now - entity.LastLoginAt.Value).Days
                : (int?)null
        };
    }

    private string FormatDisplayName(UserEntity entity)
    {
        return entity.Email?.Split('@').FirstOrDefault()
            ?? entity.Username;
    }
}
```

### 场景 2：配置系统

```csharp
// 配置值可能来自不同来源，需要类型转换
public class ConfigurationManager
{
    private readonly Dictionary<string, string> _config;

    public ConfigurationManager(Dictionary<string, string> config)
    {
        _config = config;
    }

    public T GetValue<T>(string key, T defaultValue = default!)
    {
        if (!_config.TryGetValue(key, out string? strValue))
        {
            return defaultValue;
        }

        try
        {
            return (T)Convert.ChangeType(strValue, typeof(T));
        }
        catch
        {
            return defaultValue;
        }
    }

    public T? GetNullableValue<T>(string key) where T : struct
    {
        if (!_config.TryGetValue(key, out string? strValue))
        {
            return null;
        }

        try
        {
            return (T)Convert.ChangeType(strValue, typeof(T));
        }
        catch
        {
            return null;
        }
    }

    // 使用示例
    public void Example()
    {
        int timeout = GetValue("Timeout", 30);
        bool debug = GetValue("Debug", false);
        int? maxRetries = GetNullableValue<int>("MaxRetries");
    }
}
```

### 场景 3：API 响应处理

```csharp
// API 响应可能包含各种类型的数据
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public int? ErrorCode { get; set; }
}

public class ApiClient
{
    public async Task<ApiResponse<TResult>> GetAsync<TResult>(string endpoint)
        where TResult : class
    {
        try
        {
            var response = await _httpClient.GetAsync(endpoint);
            var json = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var data = JsonSerializer.Deserialize<TResult>(json);
                return new ApiResponse<TResult>
                {
                    Success = true,
                    Data = data
                };
            }

            return new ApiResponse<TResult>
            {
                Success = false,
                ErrorMessage = "请求失败",
                ErrorCode = (int)response.StatusCode
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<TResult>
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    // 使用示例
    public async Task ProcessUserAsync()
    {
        var response = await GetAsync<UserDto>("/api/users/1");

        if (response.Success && response.Data is not null)
        {
            Console.WriteLine($"用户: {response.Data.Username}");
        }
        else
        {
            Console.WriteLine($"错误: {response.ErrorMessage ?? "未知错误"}");
        }
    }

    private readonly HttpClient _httpClient = new();
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public int? DaysSinceLastLogin { get; set; }
}
```

### 场景 4：游戏开发中的数据类型选择

```csharp
// 游戏开发中需要高性能的值类型
public readonly struct Vector2 : IEquatable<Vector2>
{
    public readonly float X;
    public readonly float Y;

    public Vector2(float x, float y)
    {
        X = x;
        Y = y;
    }

    public float Magnitude => MathF.Sqrt(X * X + Y * Y);
    public float SqrMagnitude => X * X + Y * Y;  // 避免开方

    public Vector2 Normalized
    {
        get
        {
            float mag = Magnitude;
            return mag > 0 ? new Vector2(X / mag, Y / mag) : Zero;
        }
    }

    public static Vector2 Zero => new Vector2(0, 0);
    public static Vector2 One => new Vector2(1, 1);
    public static Vector2 Up => new Vector2(0, 1);
    public static Vector2 Right => new Vector2(1, 0);

    public static Vector2 operator +(Vector2 a, Vector2 b)
        => new Vector2(a.X + b.X, a.Y + b.Y);

    public static Vector2 operator -(Vector2 a, Vector2 b)
        => new Vector2(a.X - b.X, a.Y - b.Y);

    public static Vector2 operator *(Vector2 v, float scalar)
        => new Vector2(v.X * scalar, v.Y * scalar);

    public static float Dot(Vector2 a, Vector2 b)
        => a.X * b.X + a.Y * b.Y;

    public static float Distance(Vector2 a, Vector2 b)
        => (a - b).Magnitude;

    // 使用平方距离进行比较，避免开方运算
    public static float SqrDistance(Vector2 a, Vector2 b)
        => (a - b).SqrMagnitude;

    public bool Equals(Vector2 other)
        => X == other.X && Y == other.Y;

    public override bool Equals(object? obj)
        => obj is Vector2 other && Equals(other);

    public override int GetHashCode()
        => HashCode.Combine(X, Y);

    public override string ToString()
        => $"({X:F2}, {Y:F2})";
}

// 游戏实体使用示例
public class GameObject
{
    public Vector2 Position;
    public Vector2 Velocity;
    public float MaxSpeed = 10f;

    public void Update(float deltaTime)
    {
        // 使用值类型进行高性能计算
        Position += Velocity * deltaTime;

        // 限制速度
        if (Velocity.SqrMagnitude > MaxSpeed * MaxSpeed)
        {
            Velocity = Velocity.Normalized * MaxSpeed;
        }
    }

    public bool IsInRange(GameObject other, float range)
    {
        // 使用平方距离避免开方
        return Vector2.SqrDistance(Position, other.Position) <= range * range;
    }
}
```

## 面试要点

### 常见面试问题

**1. 值类型和引用类型的区别是什么？**

答案要点：
- 存储位置：值类型通常在栈上，引用类型在堆上
- 赋值行为：值类型复制值，引用类型复制引用
- 默认值：值类型有默认零值，引用类型默认为 null
- 继承：值类型隐式继承 System.ValueType，引用类型继承 System.Object
- 性能：值类型无 GC 压力，引用类型需要垃圾回收

**2. 什么是装箱和拆箱？有什么性能影响？**

答案要点：
- 装箱：值类型转换为 object 或接口类型，在堆上分配内存
- 拆箱：将装箱的值转回值类型，需要类型检查和数据复制
- 性能影响：
  - 堆内存分配
  - 数据复制开销
  - 增加 GC 压力
- 避免方法：使用泛型、避免非泛型集合

**3. 什么时候使用 struct，什么时候使用 class？**

答案要点：

使用 struct 的场景：
- 数据大小小于 16 字节
- 表示单一值（如坐标、颜色）
- 不可变的数据
- 短生命周期，频繁创建销毁
- 不需要继承

使用 class 的场景：
- 需要继承或多态
- 需要 null 表示"无值"
- 数据较大或复杂
- 需要在多处共享同一实例

**4. string 是值类型还是引用类型？为什么它表现得像值类型？**

答案要点：
- string 是引用类型
- 表现像值类型的原因：
  - 不可变性（每次修改创建新对象）
  - 运算符重载（== 比较内容而非引用）
  - 字符串驻留（相同字面量共享实例）

**5. 解释 C# 中的可空类型。**

答案要点：
- 可空值类型：`Nullable<T>` 或 `T?`，允许值类型存储 null
- 可空引用类型（C# 8.0+）：编译时空检查，需要启用可空上下文
- 常用操作：`HasValue`、`Value`、`GetValueOrDefault()`
- 运算符：`??`（空合并）、`?.`（空条件）、`??=`（空合并赋值）

### 代码面试题示例

```csharp
// 题目 1：这段代码的输出是什么？
int a = 10;
object o = a;
a = 20;
Console.WriteLine(o);  // 输出：10（装箱复制了值）

// 题目 2：这段代码有什么问题？
public struct Counter
{
    public int Value;

    public void Increment()
    {
        Value++;
    }
}

// 问题：在某些场景下 Increment 不会修改原始值
List<Counter> counters = new List<Counter> { new Counter() };
counters[0].Increment();  // 编译错误或不生效
// 因为索引器返回值的副本

// 题目 3：实现一个泛型方法，安全地进行类型转换
public static TTarget? SafeCast<TSource, TTarget>(TSource? source)
    where TTarget : class
{
    return source as TTarget;
}
```

## 延伸阅读

### 官方文档

- [C# 类型系统 | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/types/)
- [值类型 | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/value-types)
- [可空值类型 | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/nullable-value-types)
- [可空引用类型 | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/nullable-references)

### 经典书籍

- 《CLR via C#》 - Jeffrey Richter
- 《C# in Depth》 - Jon Skeet
- 《Pro .NET Memory Management》 - Konrad Kokosa

### 进阶主题

- Span<T> 和 Memory<T> 的高级用法
- ref struct 和 readonly ref struct
- 托管内存与非托管内存
- .NET 垃圾回收机制
- 高性能 C# 编程模式

### 相关工具

- **BenchmarkDotNet**：性能基准测试
- **ObjectLayoutInspector**：查看对象内存布局
- **dotMemory**：内存分析工具
- **PerfView**：性能分析工具
