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
origin: old/src/content/docs/csharp/data-types.en.md
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

C# is a strongly typed language, and its type system is a core foundation. A deep understanding of data types helps you write correct, high-performance, memory-friendly applications. This article comprehensively analyzes the C# type system, including the essential differences between value types and reference types, nullable type usage, boxing and unboxing mechanisms, and various type conversion methods.

## Concept Explanation

### What is a Type System

A type system is a set of rules used to define and classify data in a programming language. The C# type system is built on the .NET Common Type System (CTS), ensuring cross-language type compatibility.

In C#, all types directly or indirectly inherit from `System.Object`, forming a unified type hierarchy:

```
System.Object
├── Value Types (System.ValueType)
│   ├── Simple Types (int, double, bool, char, etc.)
│   ├── Structs (struct)
│   └── Enums (enum)
└── Reference Types
    ├── Classes (class)
    ├── Interfaces (interface)
    ├── Arrays (Array)
    ├── Delegates (delegate)
    └── Strings (string)
```

### Value Types vs Reference Types

This is the most important distinction in the C# type system:

**Value Types**:
- Store data values directly
- Stored on the Stack (local variables) or inline within the containing object
- Entire value is copied on assignment
- Default value is the "zero value" for each type

**Reference Types**:
- Store memory addresses (references) to data
- Actual data is stored on the Heap
- Only the reference is copied on assignment
- Default value is `null`

```csharp
// Value type example
int a = 10;
int b = a;      // Copies value, b is independent of a
b = 20;         // Modifying b does not affect a
Console.WriteLine(a);  // Output: 10

// Reference type example
int[] arr1 = { 1, 2, 3 };
int[] arr2 = arr1;    // Copies reference, points to the same array
arr2[0] = 100;        // Modifying arr2 affects arr1
Console.WriteLine(arr1[0]);  // Output: 100
```

### Nullable Types

C# 2.0 introduced nullable value types, allowing value types to store `null`. C# 8.0 further introduced nullable reference types to enhance null safety.

```csharp
// Nullable value types
int? nullableInt = null;
double? nullableDouble = 3.14;

// Nullable reference types (requires enabling nullable context)
#nullable enable
string? nullableString = null;
string nonNullString = "Hello";  // Compiler expects this variable to not be null
```

### Boxing and Unboxing

Boxing is the process of converting a value type to a reference type; Unboxing is the reverse operation.

```csharp
int value = 42;
object boxed = value;       // Boxing: value type -> reference type
int unboxed = (int)boxed;   // Unboxing: reference type -> value type
```

## Core Principles

### Memory Layout Principles

Understanding the memory layout of value types and reference types is key to mastering the C# type system.

#### Value Type Memory Layout

Value type data is stored directly at the allocated memory location:

```csharp
struct Point
{
    public int X;  // 4 bytes
    public int Y;  // 4 bytes
}
// Point struct takes up 8 bytes total (may vary due to alignment)

// Local variables are stored on the stack
void Method()
{
    int a = 10;        // 4 bytes allocated on stack
    Point p = new Point { X = 1, Y = 2 };  // 8 bytes allocated on stack
}
```

**Stack Memory Layout Diagram**:
```
Stack Top ↑
+------------------+
|  p.Y = 2         |  ← 4 bytes
+------------------+
|  p.X = 1         |  ← 4 bytes
+------------------+
|  a = 10          |  ← 4 bytes
+------------------+
Stack Bottom ↓
```

#### Reference Type Memory Layout

Reference types are allocated on the heap, and variables only store references (pointers):

```csharp
class Person
{
    public string Name;   // Reference (8 bytes on 64-bit systems)
    public int Age;       // 4 bytes
}

void Method()
{
    Person person = new Person { Name = "John", Age = 30 };
    // person variable stores a reference on the stack (8 bytes)
    // Person object actual data is on the heap
}
```

**Memory Layout Diagram**:
```
Stack                        Heap
+----------------+          +-------------------+
| person (ref)   | ------→  | Object Header (16 bytes) |
+----------------+          | Name ref (8 bytes)| → points to string "John"
                            | Age = 30 (4 bytes)|
                            | Padding (4 bytes) |
                            +-------------------+
```

#### Object Header Structure

Every reference type object in .NET has an object header containing:
- **Sync Block Index**: Used for thread synchronization
- **Type Handle**: Points to type metadata (method table)

```csharp
// You can use the ObjectLayoutInspector tool to view object layout
// An empty reference type object takes at least 24 bytes on 64-bit systems
class EmptyClass { }  // 16 bytes object header + 8 bytes minimum alignment = 24 bytes
```

### Boxing and Unboxing Underlying Mechanism

#### Boxing Process

The boxing operation includes the following steps:
1. Allocate memory on the managed heap (object header + space for value)
2. Copy the value type data to the newly allocated heap memory
3. Return a reference pointing to the heap object

```csharp
int value = 42;
object boxed = value;  // Boxing

// IL code is roughly as follows:
// ldloc.0          // Load local variable value
// box [mscorlib]System.Int32  // Execute boxing operation
// stloc.1          // Store to boxed variable
```

**Boxing Memory Diagram**:
```
Before boxing:
Stack: [value = 42]

After boxing:
Stack: [value = 42] [boxed → heap address]
Heap: [Object Header | 42]
```

#### Unboxing Process

The unboxing operation includes the following steps:
1. Check if the object reference is `null` (throws `NullReferenceException` if true)
2. Check if the object is a boxed value of the specified value type (throws `InvalidCastException` if not)
3. Return a pointer to the value in the heap object
4. Copy the value to the target location

```csharp
object boxed = 42;
int value = (int)boxed;  // Unboxing

// IL code is roughly as follows:
// ldloc.0          // Load boxed
// unbox.any [mscorlib]System.Int32  // Execute unboxing operation
// stloc.1          // Store to value
```

### Type Conversion Mechanism

#### Implicit Conversion

Safe conversions automatically performed by the compiler that don't lose data:

```csharp
// Numeric type implicit conversion chain
// byte → short → int → long → float → double → decimal
// sbyte → short → int → long → float → double → decimal

byte b = 10;
int i = b;      // Implicit conversion: byte → int
long l = i;     // Implicit conversion: int → long
double d = l;   // Implicit conversion: long → double

// Reference type implicit conversion (subclass → parent class)
string str = "Hello";
object obj = str;  // Implicit conversion: string → object
```

#### Explicit Conversion

Conversions that require explicit specification and may lose data or throw exceptions:

```csharp
// Numeric type explicit conversion
double d = 3.14159;
int i = (int)d;     // Explicit conversion: 3 (loses decimal part)

long big = 1000000000000L;
int small = (int)big;  // Explicit conversion: may overflow

// Reference type explicit conversion (downcasting)
object obj = "Hello";
string str = (string)obj;  // Explicit conversion: object → string
```

#### User-Defined Conversions

You can define implicit or explicit conversion operators for custom types:

```csharp
public struct Celsius
{
    public double Temperature { get; }

    public Celsius(double temperature)
    {
        Temperature = temperature;
    }

    // Implicit conversion: Celsius → double
    public static implicit operator double(Celsius c)
    {
        return c.Temperature;
    }

    // Explicit conversion: double → Celsius
    public static explicit operator Celsius(double d)
    {
        return new Celsius(d);
    }

    // Implicit conversion: Celsius → Fahrenheit
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

// Usage example
Celsius celsius = (Celsius)25.0;  // Explicit conversion
double temp = celsius;             // Implicit conversion
Fahrenheit fahrenheit = celsius;   // Implicit conversion
```

## Core Points

### Value Types in Detail

#### Simple Value Types

| Type | .NET Type | Size | Range | Default Value |
|------|-----------|------|------|--------|
| `sbyte` | System.SByte | 1 byte | -128 ~ 127 | 0 |
| `byte` | System.Byte | 1 byte | 0 ~ 255 | 0 |
| `short` | System.Int16 | 2 bytes | -32,768 ~ 32,767 | 0 |
| `ushort` | System.UInt16 | 2 bytes | 0 ~ 65,535 | 0 |
| `int` | System.Int32 | 4 bytes | -2^31 ~ 2^31-1 | 0 |
| `uint` | System.UInt32 | 4 bytes | 0 ~ 2^32-1 | 0 |
| `long` | System.Int64 | 8 bytes | -2^63 ~ 2^63-1 | 0L |
| `ulong` | System.UInt64 | 8 bytes | 0 ~ 2^64-1 | 0UL |
| `float` | System.Single | 4 bytes | ±1.5×10^-45 ~ ±3.4×10^38 | 0.0f |
| `double` | System.Double | 8 bytes | ±5.0×10^-324 ~ ±1.7×10^308 | 0.0d |
| `decimal` | System.Decimal | 16 bytes | ±1.0×10^-28 ~ ±7.9×10^28 | 0.0m |
| `bool` | System.Boolean | 1 byte | true/false | false |
| `char` | System.Char | 2 bytes | U+0000 ~ U+FFFF | '\0' |

#### Structs

Structs are user-defined value types:

```csharp
// Immutable struct (recommended pattern)
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

// Using record struct (C# 10+)
public readonly record struct Point3D(double X, double Y, double Z);
```

#### Enums

Enums are named collections of integer constants:

```csharp
// Basic enum
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

// Specifying underlying type
public enum FilePermission : byte
{
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4
}

// Flags enum
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

// Using flags enum
FileAccess access = FileAccess.Read | FileAccess.Write;
bool canRead = (access & FileAccess.Read) == FileAccess.Read;  // true
bool canExecute = access.HasFlag(FileAccess.Execute);  // false
```

### Reference Types in Detail

#### Classes

Classes are the most commonly used reference types:

```csharp
public class Person
{
    // Fields
    private string _name;
    private int _age;

    // Properties
    public string Name
    {
        get => _name;
        set => _name = value ?? throw new ArgumentNullException(nameof(value));
    }

    public int Age
    {
        get => _age;
        set => _age = value >= 0 ? value : throw new ArgumentException("Age cannot be negative");
    }

    // Auto-properties
    public string? Email { get; set; }

    // Read-only property
    public bool IsAdult => Age >= 18;

    // Constructor
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}
```

#### Strings

Strings are special reference types with value-type semantics:

```csharp
// String immutability
string s1 = "Hello";
string s2 = s1;
s1 = "World";  // s1 points to new string, s2 is still "Hello"
Console.WriteLine(s2);  // Output: Hello

// String Interning
string a = "Hello";
string b = "Hello";
Console.WriteLine(ReferenceEquals(a, b));  // true (same object)

string c = new string("Hello".ToCharArray());
Console.WriteLine(ReferenceEquals(a, c));  // false (different objects)

// Force interning
string d = string.Intern(c);
Console.WriteLine(ReferenceEquals(a, d));  // true
```

#### Arrays

Arrays are reference types, and elements can be value types or reference types:

```csharp
// Value type array: element values are stored in the array
int[] numbers = { 1, 2, 3, 4, 5 };

// Reference type array: references are stored
string[] names = { "Alice", "Bob", "Charlie" };

// Multi-dimensional arrays
int[,] matrix = new int[3, 3];

// Jagged arrays (arrays of arrays)
int[][] jagged = new int[3][];
jagged[0] = new int[] { 1, 2 };
jagged[1] = new int[] { 3, 4, 5 };
jagged[2] = new int[] { 6 };
```

### Nullable Types in Detail

#### Nullable Value Types (Nullable<T>)

```csharp
// Nullable<T> struct
public struct Nullable<T> where T : struct
{
    private readonly bool hasValue;
    private readonly T value;

    public bool HasValue => hasValue;
    public T Value => hasValue ? value : throw new InvalidOperationException();
    public T GetValueOrDefault() => value;
    public T GetValueOrDefault(T defaultValue) => hasValue ? value : defaultValue;
}

// Using nullable value types
int? nullableInt = null;
int? anotherInt = 42;

// Checking value
if (nullableInt.HasValue)
{
    Console.WriteLine(nullableInt.Value);
}

// Null-coalescing operator
int result = nullableInt ?? 0;

// Null-conditional operator combined with null-coalescing
int length = nullableInt?.ToString().Length ?? 0;

// Nullable value type comparison
int? a = 10;
int? b = null;
int? c = 10;

Console.WriteLine(a == c);   // true
Console.WriteLine(a == b);   // false
Console.WriteLine(b == null); // true

// Lifted Operators
int? x = 5;
int? y = 10;
int? sum = x + y;  // 15
int? product = x * null;  // null
```

#### Nullable Reference Types (C# 8.0+)

```csharp
#nullable enable

public class NullableReferenceDemo
{
    // Non-nullable reference type - compiler expects it to never be null
    private string _name;

    // Nullable reference type - may be null
    private string? _nickname;

    public NullableReferenceDemo(string name)
    {
        _name = name ?? throw new ArgumentNullException(nameof(name));
        // _nickname defaults to null, which is allowed
    }

    public string GetDisplayName()
    {
        // Need to check nullable type
        if (_nickname != null)
        {
            return _nickname;  // Compiler knows _nickname is not null here
        }

        // Using null-coalescing operator
        return _nickname ?? _name;
    }

    public void ProcessData(string? data)
    {
        // Null-forgiving operator (!) - tells compiler this won't be null
        // Use carefully, may cause runtime NullReferenceException
        int length = data!.Length;

        // Safer approach
        if (data is not null)
        {
            Console.WriteLine(data.Length);
        }
    }
}
```

### Type Conversion in Detail

#### Safe Type Conversion Methods

```csharp
// as operator - returns null on conversion failure
object obj = "Hello";
string? str = obj as string;  // "Hello"
int? num = obj as int?;       // null (cannot directly convert to value type)

// is operator - type check
if (obj is string s)
{
    Console.WriteLine(s.Length);  // s is available in this scope
}

// is with pattern matching
object value = 42;
if (value is int n && n > 0)
{
    Console.WriteLine($"Positive integer: {n}");
}

// Type patterns in switch expressions
string GetTypeDescription(object obj) => obj switch
{
    int i => $"Integer: {i}",
    double d => $"Float: {d:F2}",
    string s => $"String length: {s.Length}",
    null => "Null value",
    _ => $"Other type: {obj.GetType().Name}"
};
```

#### Convert Class

```csharp
// Convert class provides type conversion methods
string strNumber = "42";
int intValue = Convert.ToInt32(strNumber);
double doubleValue = Convert.ToDouble(strNumber);

// Handling null
string? nullStr = null;
int result = Convert.ToInt32(nullStr);  // Returns 0, doesn't throw exception

// Base conversion
int number = 255;
string binary = Convert.ToString(number, 2);   // "11111111"
string octal = Convert.ToString(number, 8);    // "377"
string hex = Convert.ToString(number, 16);     // "ff"

int fromBinary = Convert.ToInt32("11111111", 2);  // 255
int fromHex = Convert.ToInt32("ff", 16);          // 255
```

#### Parse and TryParse

```csharp
// Parse - throws exception on conversion failure
int value1 = int.Parse("42");
double value2 = double.Parse("3.14");
DateTime date = DateTime.Parse("2024-01-15");

// TryParse - returns false on conversion failure (recommended)
if (int.TryParse("42", out int result))
{
    Console.WriteLine($"Conversion successful: {result}");
}
else
{
    Console.WriteLine("Conversion failed");
}

// Parsing with format
if (int.TryParse("FF", NumberStyles.HexNumber, null, out int hexValue))
{
    Console.WriteLine($"Hexadecimal parsing: {hexValue}");  // 255
}

// Culture-specific parsing
var culture = new CultureInfo("de-DE");  // Germany uses comma as decimal point
if (double.TryParse("3,14", NumberStyles.Float, culture, out double germanNumber))
{
    Console.WriteLine($"German format number: {germanNumber}");  // 3.14
}
```

## Code Examples

### Example 1: Behavioral Differences Between Value Types and Reference Types

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
        Console.WriteLine("=== Value Type Behavior ===");

        // Value type: copies value
        PointStruct ps1 = new PointStruct(10, 20);
        PointStruct ps2 = ps1;  // Copies entire struct
        ps2.X = 100;

        Console.WriteLine($"ps1: {ps1}");  // (10, 20) - unchanged
        Console.WriteLine($"ps2: {ps2}");  // (100, 20)

        // Method parameter passing
        ModifyStruct(ps1);
        Console.WriteLine($"After calling ModifyStruct, ps1: {ps1}");  // (10, 20) - unchanged

        Console.WriteLine("\n=== Reference Type Behavior ===");

        // Reference type: copies reference
        PointClass pc1 = new PointClass(10, 20);
        PointClass pc2 = pc1;  // Copies reference, points to same object
        pc2.X = 100;

        Console.WriteLine($"pc1: {pc1}");  // (100, 20) - changed!
        Console.WriteLine($"pc2: {pc2}");  // (100, 20)

        // Method parameter passing
        pc1 = new PointClass(10, 20);  // Reset
        ModifyClass(pc1);
        Console.WriteLine($"After calling ModifyClass, pc1: {pc1}");  // (999, 20) - changed!

        Console.WriteLine("\n=== ref Parameter Passing ===");

        // Using ref allows value types to be "passed by reference"
        PointStruct ps3 = new PointStruct(10, 20);
        ModifyStructByRef(ref ps3);
        Console.WriteLine($"After calling ModifyStructByRef, ps3: {ps3}");  // (888, 20)
    }

    static void ModifyStruct(PointStruct p)
    {
        p.X = 999;  // Modifying a copy
    }

    static void ModifyClass(PointClass p)
    {
        p.X = 999;  // Modifying the original object
    }

    static void ModifyStructByRef(ref PointStruct p)
    {
        p.X = 888;  // Modifying original struct through reference
    }
}
```

### Example 2: Performance Impact of Boxing and Unboxing

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
        Console.WriteLine($"Iterations: {Iterations:N0}\n");

        // Test non-generic collection (boxing occurs)
        TestArrayList();

        // Test generic collection (no boxing)
        TestGenericList();

        // Test boxing operation
        TestBoxing();

        // Test avoiding boxing
        TestAvoidBoxing();
    }

    static void TestArrayList()
    {
        var sw = Stopwatch.StartNew();
        ArrayList list = new ArrayList();

        for (int i = 0; i < Iterations; i++)
        {
            list.Add(i);  // Boxing happens here
        }

        long sum = 0;
        foreach (object obj in list)
        {
            sum += (int)obj;  // Unboxing happens here
        }

        sw.Stop();
        Console.WriteLine($"ArrayList (boxing/unboxing): {sw.ElapsedMilliseconds} ms, Sum: {sum}");
    }

    static void TestGenericList()
    {
        var sw = Stopwatch.StartNew();
        List<int> list = new List<int>();

        for (int i = 0; i < Iterations; i++)
        {
            list.Add(i);  // No boxing
        }

        long sum = 0;
        foreach (int num in list)
        {
            sum += num;  // No unboxing
        }

        sw.Stop();
        Console.WriteLine($"List<int> (no boxing):       {sw.ElapsedMilliseconds} ms, Sum: {sum}");
    }

    static void TestBoxing()
    {
        var sw = Stopwatch.StartNew();
        object boxed = null;

        for (int i = 0; i < Iterations; i++)
        {
            boxed = i;  // Boxing each time
            int value = (int)boxed;  // Unboxing each time
        }

        sw.Stop();
        Console.WriteLine($"Explicit boxing/unboxing:    {sw.ElapsedMilliseconds} ms");
    }

    static void TestAvoidBoxing()
    {
        var sw = Stopwatch.StartNew();

        for (int i = 0; i < Iterations; i++)
        {
            int value = i;  // No boxing
            int copy = value;  // Value copy
        }

        sw.Stop();
        Console.WriteLine($"No boxing operation:         {sw.ElapsedMilliseconds} ms");
    }
}
```

### Example 3: Advanced Usage of Nullable Types

```csharp
using System;

public class NullableAdvancedDemo
{
    public static void Run()
    {
        // Database scenario simulation
        var person = new PersonRecord
        {
            Id = 1,
            Name = "John",
            Age = 30,
            Email = null,  // Optional field
            BirthDate = new DateTime(1994, 5, 15),
            LastLoginDate = null  // Never logged in
        };

        DisplayPersonInfo(person);

        Console.WriteLine("\n=== Nullable Type Operations ===");
        NullableArithmetic();

        Console.WriteLine("\n=== Null Handling Patterns ===");
        NullHandlingPatterns();
    }

    static void DisplayPersonInfo(PersonRecord person)
    {
        Console.WriteLine("=== Person Information ===");
        Console.WriteLine($"ID: {person.Id}");
        Console.WriteLine($"Name: {person.Name}");
        Console.WriteLine($"Age: {person.Age}");

        // Using null-coalescing operator to provide default value
        Console.WriteLine($"Email: {person.Email ?? "Not set"}");

        // Using null-conditional operator for safe access
        Console.WriteLine($"Email domain: {person.Email?.Split('@').LastOrDefault() ?? "None"}");

        // Conditional expression handling nullable value
        string loginStatus = person.LastLoginDate.HasValue
            ? $"Last login: {person.LastLoginDate.Value:yyyy-MM-dd HH:mm}"
            : "Never logged in";
        Console.WriteLine(loginStatus);

        // Calculate age (from birth date)
        if (person.BirthDate.HasValue)
        {
            int calculatedAge = DateTime.Today.Year - person.BirthDate.Value.Year;
            if (DateTime.Today < person.BirthDate.Value.AddYears(calculatedAge))
                calculatedAge--;
            Console.WriteLine($"Age calculated from birth date: {calculatedAge}");
        }
    }

    static void NullableArithmetic()
    {
        int? a = 10;
        int? b = 5;
        int? c = null;

        // Nullable type operations
        Console.WriteLine($"a + b = {a + b}");      // 15
        Console.WriteLine($"a * b = {a * b}");      // 50
        Console.WriteLine($"a + c = {a + c}");      // null (any operation with null results in null)
        Console.WriteLine($"a > b = {a > b}");      // true
        Console.WriteLine($"a > c = {a > c}");      // false (comparison with null is always false)
        Console.WriteLine($"c > a = {c > a}");      // false

        // Using GetValueOrDefault
        Console.WriteLine($"c.GetValueOrDefault() = {c.GetValueOrDefault()}");      // 0
        Console.WriteLine($"c.GetValueOrDefault(100) = {c.GetValueOrDefault(100)}"); // 100

        // Null-coalescing assignment
        c ??= 50;  // If c is null, assign 50
        Console.WriteLine($"After c ??= 50, c = {c}");  // 50
    }

    static void NullHandlingPatterns()
    {
        string? input = GetUserInput();

        // Pattern 1: Traditional null check
        if (input != null)
        {
            Console.WriteLine($"[Traditional check] Input length: {input.Length}");
        }

        // Pattern 2: is not null pattern matching
        if (input is not null)
        {
            Console.WriteLine($"[Pattern matching] Input: {input}");
        }

        // Pattern 3: Null-coalescing operator
        string safeInput = input ?? "Default value";
        Console.WriteLine($"[Null-coalescing] Safe input: {safeInput}");

        // Pattern 4: Null-conditional operator chain
        int? length = input?.Trim()?.ToUpper()?.Length;
        Console.WriteLine($"[Null-conditional chain] Length: {length?.ToString() ?? "Unable to get"}");

        // Pattern 5: switch expression handling null
        string description = input switch
        {
            null => "Input is null",
            "" => "Input is empty string",
            { Length: < 5 } => "Input is too short",
            { Length: > 100 } => "Input is too long",
            _ => $"Valid input: {input}"
        };
        Console.WriteLine($"[switch expression] {description}");
    }

    static string? GetUserInput()
    {
        // Simulating a method that may return null
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

### Example 4: Safe Practices for Type Conversion

```csharp
using System;
using System.Globalization;

public class TypeConversionDemo
{
    public static void Run()
    {
        Console.WriteLine("=== Safe Type Conversion ===\n");

        // Numeric conversion
        SafeNumericConversions();

        // String parsing
        SafeStringParsing();

        // Object type casting
        SafeObjectCasting();

        // Custom type conversions
        CustomTypeConversions();
    }

    static void SafeNumericConversions()
    {
        Console.WriteLine("--- Numeric Type Conversion ---");

        // checked context - throws exception on overflow
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
            Console.WriteLine("checked: Integer overflow detected");
        }

        // unchecked context - wraps around on overflow
        unchecked
        {
            int maxInt = int.MaxValue;
            int wrapped = maxInt + 1;
            Console.WriteLine($"unchecked: int.MaxValue + 1 = {wrapped}");  // -2147483648
        }

        // Safe narrowing conversion
        long bigNumber = 1000000000000L;
        if (bigNumber >= int.MinValue && bigNumber <= int.MaxValue)
        {
            int safeInt = (int)bigNumber;
            Console.WriteLine($"Safe conversion: {safeInt}");
        }
        else
        {
            Console.WriteLine($"Value {bigNumber} exceeds int range");
        }

        // Floating-point precision issues
        float f = 0.1f;
        double d = 0.1;
        decimal m = 0.1m;

        Console.WriteLine($"float precision:   {f:G20}");    // 0.100000001490116...
        Console.WriteLine($"double precision:  {d:G20}");   // 0.10000000000000001
        Console.WriteLine($"decimal precision: {m}");        // 0.1 (exact)

        Console.WriteLine();
    }

    static void SafeStringParsing()
    {
        Console.WriteLine("--- String Parsing ---");

        string[] inputs = { "42", "-100", "3.14", "not a number", "", null! };

        foreach (string input in inputs)
        {
            // Safe integer parsing
            if (int.TryParse(input, out int intResult))
            {
                Console.WriteLine($"'{input}' -> int: {intResult}");
            }
            else
            {
                Console.WriteLine($"'{input ?? "null"}' -> Cannot parse as int");
            }
        }

        Console.WriteLine();

        // Parsing with format
        string[] moneyInputs = { "$1,234.56", "1234.56", "1.234,56" };

        foreach (string money in moneyInputs)
        {
            // US format
            if (decimal.TryParse(money, NumberStyles.Currency, CultureInfo.GetCultureInfo("en-US"), out decimal usd))
            {
                Console.WriteLine($"'{money}' (US) -> {usd:C}");
            }
            // German format
            else if (decimal.TryParse(money, NumberStyles.Currency, CultureInfo.GetCultureInfo("de-DE"), out decimal eur))
            {
                Console.WriteLine($"'{money}' (DE) -> {eur:C}");
            }
            else
            {
                Console.WriteLine($"'{money}' -> Cannot parse");
            }
        }

        Console.WriteLine();
    }

    static void SafeObjectCasting()
    {
        Console.WriteLine("--- Object Type Casting ---");

        object[] objects = { 42, "Hello", 3.14, new int[] { 1, 2, 3 }, null! };

        foreach (object obj in objects)
        {
            // Using is for safe checking and conversion
            string description = obj switch
            {
                int i => $"Integer: {i}",
                string s => $"String: '{s}' (length: {s.Length})",
                double d => $"Float: {d:F2}",
                int[] arr => $"Integer array: [{string.Join(", ", arr)}]",
                null => "Null value",
                _ => $"Unknown type: {obj.GetType().Name}"
            };

            Console.WriteLine(description);
        }

        // Using as operator
        object maybeString = "Hello";
        string? str = maybeString as string;
        Console.WriteLine($"\nas conversion result: {str ?? "Conversion failed"}");

        // Using generic method for safe casting
        var result = SafeCast<string>(maybeString);
        Console.WriteLine($"SafeCast result: {result ?? "Conversion failed"}");

        Console.WriteLine();
    }

    static T? SafeCast<T>(object obj) where T : class
    {
        return obj as T;
    }

    static void CustomTypeConversions()
    {
        Console.WriteLine("--- Custom Type Conversions ---");

        // Using custom conversions
        Temperature celsius = new Temperature(25, TemperatureUnit.Celsius);
        Temperature fahrenheit = celsius.ToFahrenheit();
        Temperature kelvin = celsius.ToKelvin();

        Console.WriteLine($"Celsius: {celsius}");
        Console.WriteLine($"Fahrenheit: {fahrenheit}");
        Console.WriteLine($"Kelvin: {kelvin}");

        // Implicit and explicit conversions
        double tempValue = celsius;  // Implicit conversion
        Temperature fromDouble = (Temperature)30.5;  // Explicit conversion

        Console.WriteLine($"Implicit conversion to double: {tempValue}");
        Console.WriteLine($"Explicit conversion from double: {fromDouble}");
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

    // Implicit conversion to double
    public static implicit operator double(Temperature t) => t.Value;

    // Explicit conversion from double (assumes Celsius)
    public static explicit operator Temperature(double value) =>
        new Temperature(value, TemperatureUnit.Celsius);

    public override string ToString() => $"{Value:F2}° {Unit}";
}
```

## Best Practices

### Choose the Correct Type

```csharp
// Preferred types for specific scenarios

// 1. Use decimal for financial calculations to avoid floating-point errors
decimal price = 19.99m;
decimal total = price * 100;  // Exact 1999.00

// 2. Use double for scientific calculations, better performance
double distance = 384400.5;  // Earth-Moon distance (km)
double speed = 299792.458;   // Speed of light (km/s)

// 3. Use arrays for small collections, List<T> for large collections
int[] fixedArray = new int[10];  // Fixed size
List<int> dynamicList = new List<int>();  // Dynamic size

// 4. Use structs for simple data transfer
public readonly record struct Coordinate(double Latitude, double Longitude);

// 5. Use classes when inheritance or polymorphism is needed
public abstract class Shape
{
    public abstract double Area { get; }
}
```

### Avoid Unnecessary Boxing

```csharp
// Bad practice: causes boxing
void PrintValues(ArrayList list)  // Non-generic collection
{
    foreach (object item in list)  // Unboxing
    {
        Console.WriteLine(item);
    }
}

// Good practice: use generics to avoid boxing
void PrintValues<T>(IEnumerable<T> items)
{
    foreach (T item in items)  // No boxing
    {
        Console.WriteLine(item);
    }
}

// Bad practice: string concatenation causes boxing
int count = 42;
string message = "Count: " + count;  // count is boxed

// Good practice: use string interpolation or ToString()
string message1 = $"Count: {count}";  // No boxing
string message2 = "Count: " + count.ToString();  // No boxing
```

### Use Nullable Types Correctly

```csharp
// Enable nullable reference types
#nullable enable

public class Repository
{
    // Clearly mark return values that may be null
    public User? FindById(int id)
    {
        // May return null
        return _users.FirstOrDefault(u => u.Id == id);
    }

    // Method that won't return null
    public User GetById(int id)
    {
        return _users.First(u => u.Id == id);
        // Throws exception if not found
    }

    // Parameter handling
    public void UpdateUser(User user, string? email = null)
    {
        // Null-safe handling
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
    public string? Email { get; set; }  // Explicitly nullable
}
```

### Safe Patterns for Type Conversion

```csharp
public static class SafeConvert
{
    // Safe integer conversion
    public static int? ToInt32(string? value)
    {
        return int.TryParse(value, out int result) ? result : null;
    }

    // Conversion with default value
    public static int ToInt32(string? value, int defaultValue)
    {
        return int.TryParse(value, out int result) ? result : defaultValue;
    }

    // Safe enum conversion
    public static TEnum? ToEnum<TEnum>(string? value) where TEnum : struct, Enum
    {
        return Enum.TryParse<TEnum>(value, true, out var result) ? result : null;
    }

    // Safe object conversion
    public static T? As<T>(object? obj) where T : class
    {
        return obj as T;
    }

    // Conversion with validation
    public static T Cast<T>(object? obj)
    {
        if (obj is T result)
        {
            return result;
        }

        throw new InvalidCastException(
            $"Cannot convert '{obj?.GetType().Name ?? "null"}' to '{typeof(T).Name}'");
    }
}
```

### Struct Design Guidelines

```csharp
// Good struct design - immutable, small, represents a single value
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
            throw new InvalidOperationException("Currency mismatch");
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

## Common Pitfalls

### Floating-Point Precision Issues

```csharp
// Pitfall: floating-point comparison
double a = 0.1 + 0.2;
double b = 0.3;
Console.WriteLine(a == b);  // false!

// Reason: floating-point cannot precisely represent certain decimals
Console.WriteLine($"0.1 + 0.2 = {a:G17}");  // 0.30000000000000004
Console.WriteLine($"0.3 = {b:G17}");        // 0.29999999999999999

// Solution 1: use tolerance comparison
const double Epsilon = 1e-10;
bool areEqual = Math.Abs(a - b) < Epsilon;
Console.WriteLine($"Using tolerance comparison: {areEqual}");  // true

// Solution 2: use decimal for precise calculations
decimal x = 0.1m + 0.2m;
decimal y = 0.3m;
Console.WriteLine(x == y);  // true
```

### Equality Issues with Boxed Objects

```csharp
// Pitfall: comparison of boxed objects
int value1 = 100;
int value2 = 100;
object boxed1 = value1;
object boxed2 = value2;

Console.WriteLine(value1 == value2);   // true (value comparison)
Console.WriteLine(boxed1 == boxed2);   // false! (reference comparison)

// Solution: use Equals method
Console.WriteLine(boxed1.Equals(boxed2));  // true

// Note: small integers have caching (but this is implementation detail, don't rely on it)
// This may return true in some languages, but always false in C#
```

### Null Propagation in Nullable Types

```csharp
// Pitfall: null propagation in operations
int? a = 10;
int? b = null;
int? result = a + b;  // null, not 10!

// Pitfall: conditional operator and nullable types
int? value = null;
// int result = condition ? value : 0;  // Compilation error!
int? nullableResult = true ? value : 0;  // Correct

// Solution: use null-coalescing operator
int safeResult = (a + b) ?? 0;  // 0
int computed = (a ?? 0) + (b ?? 0);  // 10
```

### Value Type Default Value Pitfalls

```csharp
public struct Config
{
    public int Timeout;      // Default value is 0
    public bool IsEnabled;   // Default value is false
}

// Pitfall: cannot distinguish "not set" from "set to default value"
Config config = new Config();
Console.WriteLine(config.Timeout);    // 0 - intentionally set or not set?
Console.WriteLine(config.IsEnabled);  // false - same issue

// Solution 1: use nullable types
public struct ConfigV2
{
    public int? Timeout;
    public bool? IsEnabled;
}

// Solution 2: use Nullable or special value to indicate not set
public struct ConfigV3
{
    public int Timeout;
    public bool TimeoutWasSet;
}
```

### String Comparison Pitfalls

```csharp
// Pitfall: string comparison across different cultures
string s1 = "straße";  // German: street
string s2 = "STRASSE";

// Default comparison may produce unexpected results
Console.WriteLine(s1.Equals(s2, StringComparison.CurrentCultureIgnoreCase));

// Solution: explicitly specify comparison type
Console.WriteLine(s1.Equals(s2, StringComparison.OrdinalIgnoreCase));

// Pitfall: string.Empty vs null
string? empty = "";
string? nullStr = null;

Console.WriteLine(string.IsNullOrEmpty(empty));     // true
Console.WriteLine(string.IsNullOrEmpty(nullStr));   // true
Console.WriteLine(empty == nullStr);                // false

// Recommended: use IsNullOrWhiteSpace for stricter checking
Console.WriteLine(string.IsNullOrWhiteSpace("  ")); // true
```

### Implicit Precision Loss in Type Conversion

```csharp
// Pitfall: integer division
int a = 5;
int b = 2;
double result = a / b;  // 2.0, not 2.5!

// Reason: integer division is performed first, then result is converted

// Solution: convert operands first
double correctResult = (double)a / b;  // 2.5
double alsoCorrect = a / (double)b;    // 2.5

// Pitfall: precision loss
long bigNumber = 9007199254740993L;  // Exceeds double precision
double asDouble = bigNumber;
long backToLong = (long)asDouble;
Console.WriteLine(bigNumber == backToLong);  // false!

// Solution: use decimal to maintain precision
decimal asDecimal = bigNumber;
long safeBack = (long)asDecimal;
Console.WriteLine(bigNumber == safeBack);  // true
```

## Performance Considerations

### Value Type vs Reference Type Performance

```csharp
using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]
public class TypePerformanceBenchmark
{
    private const int Iterations = 100000;

    // Struct version
    public readonly struct PointStruct
    {
        public readonly double X, Y;
        public PointStruct(double x, double y) { X = x; Y = y; }
        public double Distance => Math.Sqrt(X * X + Y * Y);
    }

    // Class version
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
            var p = new PointStruct(i, i);  // Stack allocation
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
            var p = new PointClass(i, i);  // Heap allocation
            sum += p.Distance;
        }
        return sum;
    }
}

// Typical results:
// |           Method |     Mean |    Allocated |
// |----------------- |---------:|-------------:|
// | StructPerformance|  1.5 ms  |         0 B  |
// |  ClassPerformance|  3.2 ms  |  2,400,000 B |
```

### Performance Impact of Boxing and Unboxing

```csharp
// Performance costs of boxing and unboxing
// 1. Heap memory allocation
// 2. Data copying
// 3. Garbage collection pressure

// Strategies to avoid boxing

// Strategy 1: Use generics
public interface IProcessor<T>
{
    void Process(T value);
}

public class IntProcessor : IProcessor<int>
{
    public void Process(int value) { /* No boxing */ }
}

// Strategy 2: Use generic constraints
public void ProcessValue<T>(T value) where T : struct
{
    // value won't be boxed
}

// Strategy 3: Avoid passing value types to object parameters
// Bad:
void LogObject(object value)
{
    Console.WriteLine(value);  // Value types will be boxed
}

// Good:
void Log<T>(T value)
{
    Console.WriteLine(value);  // No boxing
}
```

### String Performance Optimization

```csharp
// Strings are immutable, every modification creates a new object

// Bad practice: string concatenation in a loop
string result = "";
for (int i = 0; i < 1000; i++)
{
    result += i.ToString();  // Creates new string each time
}

// Good practice: use StringBuilder
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++)
{
    sb.Append(i);
}
string result2 = sb.ToString();

// Better practice: use string.Join
var numbers = Enumerable.Range(0, 1000);
string result3 = string.Join("", numbers);

// Pre-allocate capacity
var sb2 = new StringBuilder(capacity: 5000);  // Estimated size
```

### Span<T> and High-Performance Types

```csharp
// Span<T> provides high-performance memory access
public void ProcessData(ReadOnlySpan<byte> data)
{
    // Span is stack-allocated, no heap memory overhead
    foreach (byte b in data)
    {
        // Process data
    }
}

// String slicing without allocating new memory
public void ParseHeader(ReadOnlySpan<char> line)
{
    int colonIndex = line.IndexOf(':');
    if (colonIndex > 0)
    {
        ReadOnlySpan<char> key = line.Slice(0, colonIndex);
        ReadOnlySpan<char> value = line.Slice(colonIndex + 1).Trim();
        // No string allocation
    }
}

// stackalloc for small temporary arrays
public int ComputeHash(ReadOnlySpan<byte> data)
{
    Span<byte> buffer = stackalloc byte[256];  // Stack allocation
    // Use buffer...
    return 0;
}
```

## Real-World Scenarios

### Scenario 1: Database Entity Mapping

```csharp
// Database may return null values, use nullable types to handle
public class UserEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string? Email { get; set; }           // Optional
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }   // null when never logged in
    public int? DepartmentId { get; set; }       // Foreign key may be null
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
            Email = entity.Email ?? "Not set",
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

### Scenario 2: Configuration System

```csharp
// Configuration values may come from different sources, requiring type conversion
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

    // Usage example
    public void Example()
    {
        int timeout = GetValue("Timeout", 30);
        bool debug = GetValue("Debug", false);
        int? maxRetries = GetNullableValue<int>("MaxRetries");
    }
}
```

### Scenario 3: API Response Handling

```csharp
// API responses may contain various types of data
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
                ErrorMessage = "Request failed",
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

    // Usage example
    public async Task ProcessUserAsync()
    {
        var response = await GetAsync<UserDto>("/api/users/1");

        if (response.Success && response.Data is not null)
        {
            Console.WriteLine($"User: {response.Data.Username}");
        }
        else
        {
            Console.WriteLine($"Error: {response.ErrorMessage ?? "Unknown error"}");
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

### Scenario 4: Data Type Selection in Game Development

```csharp
// Game development requires high-performance value types
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
    public float SqrMagnitude => X * X + Y * Y;  // Avoid square root

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

    // Use squared distance for comparison, avoid square root operation
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

// Game entity usage example
public class GameObject
{
    public Vector2 Position;
    public Vector2 Velocity;
    public float MaxSpeed = 10f;

    public void Update(float deltaTime)
    {
        // High-performance calculations using value types
        Position += Velocity * deltaTime;

        // Limit speed
        if (Velocity.SqrMagnitude > MaxSpeed * MaxSpeed)
        {
            Velocity = Velocity.Normalized * MaxSpeed;
        }
    }

    public bool IsInRange(GameObject other, float range)
    {
        // Use squared distance to avoid square root
        return Vector2.SqrDistance(Position, other.Position) <= range * range;
    }
}
```

## Interview Key Points

### Common Interview Questions

**1. What is the difference between value types and reference types?**

Key points:
- Storage location: value types typically on stack, reference types on heap
- Assignment behavior: value types copy value, reference types copy reference
- Default values: value types have default zero values, reference types default to null
- Inheritance: value types implicitly inherit System.ValueType, reference types inherit System.Object
- Performance: value types have no GC pressure, reference types require garbage collection

**2. What is boxing and unboxing? What is the performance impact?**

Key points:
- Boxing: converting value type to object or interface type, allocates memory on heap
- Unboxing: converting boxed value back to value type, requires type checking and data copying
- Performance impact:
  - Heap memory allocation
  - Data copying overhead
  - Increased GC pressure
- Avoidance: use generics, avoid non-generic collections

**3. When should you use struct and when should you use class?**

Key points:

Use struct scenarios:
- Data size less than 16 bytes
- Represents a single value (e.g., coordinates, colors)
- Immutable data
- Short lifecycle, frequently created and destroyed
- No need for inheritance

Use class scenarios:
- Need inheritance or polymorphism
- Need null to represent "no value"
- Large or complex data
- Need to share the same instance across multiple places

**4. Is string a value type or reference type? Why does it behave like a value type?**

Key points:
- string is a reference type
- Reasons for value-type-like behavior:
  - Immutability (each modification creates a new object)
  - Operator overloading (== compares content, not reference)
  - String interning (identical literals share instances)

**5. Explain nullable types in C#.**

Key points:
- Nullable value types: `Nullable<T>` or `T?`, allows value types to store null
- Nullable reference types (C# 8.0+): compile-time null checking, requires enabling nullable context
- Common operations: `HasValue`, `Value`, `GetValueOrDefault()`
- Operators: `??` (null-coalescing), `?.` (null-conditional), `??=` (null-coalescing assignment)

### Code Interview Examples

```csharp
// Question 1: What is the output of this code?
int a = 10;
object o = a;
a = 20;
Console.WriteLine(o);  // Output: 10 (boxing copied the value)

// Question 2: What's the problem with this code?
public struct Counter
{
    public int Value;

    public void Increment()
    {
        Value++;
    }
}

// Issue: In some scenarios Increment won't modify the original value
List<Counter> counters = new List<Counter> { new Counter() };
counters[0].Increment();  // Compilation error or doesn't take effect
// Because the indexer returns a copy of the value

// Question 3: Implement a generic method for safe type conversion
public static TTarget? SafeCast<TSource, TTarget>(TSource? source)
    where TTarget : class
{
    return source as TTarget;
}
```

## Further Reading

### Official Documentation

- [C# Type System | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/)
- [Value Types | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types)
- [Nullable Value Types | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-value-types)
- [Nullable Reference Types | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references)

### Classic Books

- "CLR via C#" - Jeffrey Richter
- "C# in Depth" - Jon Skeet
- "Pro .NET Memory Management" - Konrad Kokosa

### Advanced Topics

- Advanced usage of Span<T> and Memory<T>
- ref struct and readonly ref struct
- Managed memory and unmanaged memory
- .NET garbage collection mechanism
- High-performance C# programming patterns

### Related Tools

- **BenchmarkDotNet**: Performance benchmarking
- **ObjectLayoutInspector**: View object memory layout
- **dotMemory**: Memory analysis tool
- **PerfView**: Performance analysis tool
