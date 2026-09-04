---
title: C# Language Fundamentals
description: Deep dive into C# data types, variables, operators and control flow
track: csharp
section: basics
difficulty: beginner
tags:
  - C#
  - Fundamentals
  - Data Types
  - .NET
status: imported
origin: old/src/content/docs/csharp/fundamentals.zh.md
divergence: 0.219
issues:
  - title-lang-zh
  - title-language
legacy:
  category: CSharp
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

C# 是由微软开发的一门现代化、类型安全的面向对象编程语言，是 .NET 生态系统的核心组成部分。掌握 C# 基础知识对于构建健壮的应用程序至关重要。本指南将介绍 C# 语言的核心构建模块。

## 数据类型

C# 是一种强类型语言，这意味着每个变量都必须声明其类型。C# 的数据类型主要分为两大类：**值类型**和**引用类型**。

### 值类型

值类型直接在内存中存储数据。当你将一个值类型赋给另一个变量时，会创建该值的副本。

#### 整数类型

```csharp
// 有符号整数
sbyte smallNumber = -128;        // 8位有符号整数 (-128 到 127)
short mediumNumber = -32768;     // 16位有符号整数 (-32,768 到 32,767)
int standardNumber = -2147483648; // 32位有符号整数 (-2,147,483,648 到 2,147,483,647)
long largeNumber = -9223372036854775808L; // 64位有符号整数

// 无符号整数
byte unsignedSmall = 255;        // 8位无符号整数 (0 到 255)
ushort unsignedMedium = 65535;   // 16位无符号整数 (0 到 65,535)
uint unsignedStandard = 4294967295U; // 32位无符号整数
ulong unsignedLarge = 18446744073709551615UL; // 64位无符号整数
```

#### 浮点类型

```csharp
float singlePrecision = 3.14159f;    // 32位浮点数 (约6-9位有效数字)
double doublePrecision = 3.14159265358979; // 64位浮点数 (约15-17位有效数字)
decimal highPrecision = 3.14159265358979323846m; // 128位小数 (28-29位有效数字)

// decimal 非常适合金融计算
decimal price = 19.99m;
decimal taxRate = 0.08m;
decimal total = price * (1 + taxRate);
```

#### 布尔类型

```csharp
bool isActive = true;
bool isComplete = false;

// 布尔表达式
bool canProceed = (age >= 18) && (hasLicense == true);
```

#### 字符类型

```csharp
char letter = 'A';
char digit = '5';
char unicodeChar = '\u0041'; // 'A' 的 Unicode 表示
char newline = '\n';         // 转义序列
```

#### 其他值类型

```csharp
// DateTime 结构
DateTime now = DateTime.Now;
DateTime specificDate = new DateTime(2026, 1, 7);

// 结构体示例
struct Point
{
    public int X;
    public int Y;
}

Point origin = new Point { X = 0, Y = 0 };
```

### 引用类型

引用类型存储的是对实际数据的引用（内存地址）。多个变量可以引用同一个对象。

#### 字符串类型

```csharp
string message = "Hello, World!";
string multiLine = @"这是一个
多行字符串
使用逐字字符串字面量";

// 字符串插值
string name = "John";
int age = 30;
string greeting = $"我的名字是 {name}，今年 {age} 岁。";

// 字符串拼接
string fullName = firstName + " " + lastName;
```

#### Object 类型

```csharp
object anything = 42;           // 可以保存任何类型
anything = "Now a string";      // 装箱（值类型转换为引用类型）
int number = (int)anything;     // 拆箱需要显式转换
```

#### 数组类型（后面详细介绍）

```csharp
int[] numbers = new int[5];
string[] names = { "Alice", "Bob", "Charlie" };
```

### 可空类型

值类型可以通过添加 `?` 后缀变为可空类型：

```csharp
int? nullableInt = null;
double? nullableDouble = null;

// 检查是否为空
if (nullableInt.HasValue)
{
    Console.WriteLine($"值: {nullableInt.Value}");
}

// 空合并运算符
int result = nullableInt ?? 0; // 如果 nullableInt 为空则使用 0
```

### 使用 var 进行类型推断

`var` 关键字允许编译器从初始化表达式推断类型：

```csharp
var number = 42;              // int
var message = "Hello";        // string
var price = 19.99m;           // decimal
var isValid = true;           // bool

// var 需要初始化
// var x; // 错误：隐式类型变量必须初始化
```

## 变量和常量

### 变量

变量是可以保存值的命名存储位置。在 C# 中，变量在使用前必须先声明。

```csharp
// 变量声明
int age;
string name;

// 变量初始化
age = 25;
name = "Alice";

// 声明并初始化
int score = 100;
double temperature = 98.6;

// 多变量声明
int x = 10, y = 20, z = 30;

// 变量命名规范
string firstName;        // 局部变量使用 camelCase
string _privateField;    // 私有字段使用下划线前缀
const int MAX_VALUE = 100; // 常量使用 UPPER_CASE
```

#### 变量作用域

```csharp
class Program
{
    // 类级别变量（字段）
    private static int classField = 10;

    static void Main()
    {
        // 方法级别变量
        int methodVariable = 20;

        if (true)
        {
            // 块级别变量
            int blockVariable = 30;
            Console.WriteLine(methodVariable); // 可访问
        }

        // Console.WriteLine(blockVariable); // 错误：超出作用域
    }
}
```

### 常量

常量是声明后无法更改的不可变值：

```csharp
// const - 编译时常量
const double PI = 3.14159265359;
const string COMPANY_NAME = "Acme Corp";
const int MAX_USERS = 1000;

// PI = 3.14; // 错误：无法给常量赋值

// readonly - 运行时常量
public class Configuration
{
    public readonly string DatabaseConnection;

    public Configuration(string dbConnection)
    {
        DatabaseConnection = dbConnection; // 可以在构造函数中赋值
    }
}
```

### 默认值

```csharp
// 值类型有默认值
int defaultInt = default;        // 0
bool defaultBool = default;      // false
double defaultDouble = default;  // 0.0

// 引用类型默认为 null
string defaultString = default;  // null
object defaultObject = default;  // null

// 使用 default 关键字
int[] numbers = new int[5];      // 所有元素初始化为 0
```

## 运算符

运算符是对操作数执行操作的符号。C# 支持多种类型的运算符。

### 算术运算符

```csharp
int a = 10, b = 3;

int sum = a + b;           // 加法: 13
int difference = a - b;    // 减法: 7
int product = a * b;       // 乘法: 30
int quotient = a / b;      // 除法: 3（整数除法）
int remainder = a % b;     // 取模: 1

// 浮点除法
double result = (double)a / b;  // 3.333...

// 一元运算符
int x = 5;
int y = -x;                // 取负: -5
int z = +x;                // 一元正号: 5

// 自增和自减
int count = 0;
count++;                   // 后置自增: count = 1
++count;                   // 前置自增: count = 2
count--;                   // 后置自减: count = 1
--count;                   // 前置自减: count = 0

// 前置自增和后置自增的区别
int n = 5;
int m = n++;               // m = 5, n = 6（后置自增）
int p = ++n;               // p = 7, n = 7（前置自增）
```

### 赋值运算符

```csharp
int x = 10;

x += 5;    // x = x + 5  -> 15
x -= 3;    // x = x - 3  -> 12
x *= 2;    // x = x * 2  -> 24
x /= 4;    // x = x / 4  -> 6
x %= 4;    // x = x % 4  -> 2

// 其他运算符的复合赋值
int value = 8;
value <<= 2;  // 左移: value = 32
value >>= 1;  // 右移: value = 16
```

### 比较运算符

```csharp
int a = 10, b = 20;

bool isEqual = (a == b);        // false（相等）
bool isNotEqual = (a != b);     // true（不相等）
bool isGreater = (a > b);       // false（大于）
bool isLess = (a < b);          // true（小于）
bool isGreaterOrEqual = (a >= b); // false
bool isLessOrEqual = (a <= b);  // true

// 字符串比较
string str1 = "hello";
string str2 = "HELLO";
bool areEqual = (str1 == str2);           // false（区分大小写）
bool areEqualIgnoreCase = str1.Equals(str2, StringComparison.OrdinalIgnoreCase); // true
```

### 逻辑运算符

```csharp
bool a = true, b = false;

bool andResult = a && b;    // 逻辑与: false
bool orResult = a || b;     // 逻辑或: true
bool notResult = !a;        // 逻辑非: false

// 短路求值
bool result = (a || ExpensiveOperation()); // 如果 a 为 true，则不调用 ExpensiveOperation()

// 条件中的逻辑运算符
int age = 25;
bool hasLicense = true;
bool canDrive = (age >= 18) && hasLicense; // true

// 组合多个条件
bool isWeekend = (day == "Saturday" || day == "Sunday");
bool canRelax = isWeekend && !hasWork;
```

### 位运算符

```csharp
int a = 5;   // 二进制: 0101
int b = 3;   // 二进制: 0011

int andResult = a & b;   // 按位与: 1 (0001)
int orResult = a | b;    // 按位或: 7 (0111)
int xorResult = a ^ b;   // 按位异或: 6 (0110)
int notResult = ~a;      // 按位取反: -6（反转所有位）

int leftShift = a << 1;  // 左移: 10 (1010)
int rightShift = a >> 1; // 右移: 2 (0010)

// 实际用途：标志位
[Flags]
enum FileAccess
{
    Read = 1,      // 0001
    Write = 2,     // 0010
    Execute = 4    // 0100
}

FileAccess permissions = FileAccess.Read | FileAccess.Write; // 0011
bool canRead = (permissions & FileAccess.Read) != 0; // true
```

### 条件（三元）运算符

```csharp
int age = 18;
string status = (age >= 18) ? "成年人" : "未成年人";

// 嵌套三元运算符（为了可读性应谨慎使用）
int score = 85;
string grade = (score >= 90) ? "A" :
               (score >= 80) ? "B" :
               (score >= 70) ? "C" : "F";

// 空合并运算符
string name = null;
string displayName = name ?? "访客";  // 如果 name 为空则使用 "访客"

// 空合并赋值 (C# 8.0+)
name ??= "Default";  // 如果 name 为空则赋值 "Default"
```

### 类型测试和转换运算符

```csharp
object obj = "Hello";

// 类型测试
bool isString = obj is string;  // true
bool isInt = obj is int;        // false

// 类型转换
string str = (string)obj;       // 显式转换
// int num = (int)obj;          // 运行时错误：InvalidCastException

// 使用 'as' 进行安全转换
string safeStr = obj as string; // 返回 "Hello"
int? safeInt = obj as int?;     // 返回 null（不抛异常）

// 模式匹配 (C# 7.0+)
if (obj is string text)
{
    Console.WriteLine($"长度: {text.Length}");
}

// 使用 typeof 进行类型检查
Type type = typeof(string);
bool isSameType = (obj.GetType() == type);
```

### 其他运算符

```csharp
// 成员访问
var person = new Person();
person.Name = "Alice";

// 索引器
int[] array = { 1, 2, 3, 4, 5 };
int firstElement = array[0];

// 空条件运算符 (C# 6.0+)
string name = person?.Name;  // 如果 person 为空则返回 null
int? length = name?.Length;  // 如果 name 为空则返回 null

// 带索引器的空条件运算符
int? firstItem = array?[0];

// Lambda 运算符
Func<int, int> square = x => x * x;
int result = square(5);  // 25

// sizeof 运算符（用于值类型）
int sizeOfInt = sizeof(int);      // 4 字节
int sizeOfDouble = sizeof(double); // 8 字节
```

## 控制流

控制流语句决定代码执行的顺序。

### 条件语句

#### if 语句

```csharp
int temperature = 25;

if (temperature > 30)
{
    Console.WriteLine("天气很热！");
}

// if-else
if (temperature > 30)
{
    Console.WriteLine("天气很热！");
}
else
{
    Console.WriteLine("天气不太热。");
}

// if-else if-else
if (temperature > 30)
{
    Console.WriteLine("天气很热！");
}
else if (temperature > 20)
{
    Console.WriteLine("天气温暖。");
}
else if (temperature > 10)
{
    Console.WriteLine("天气凉爽。");
}
else
{
    Console.WriteLine("天气寒冷！");
}

// 嵌套 if 语句
int age = 25;
bool hasLicense = true;

if (age >= 18)
{
    if (hasLicense)
    {
        Console.WriteLine("你可以开车。");
    }
    else
    {
        Console.WriteLine("你需要驾照。");
    }
}
else
{
    Console.WriteLine("你年龄太小，不能开车。");
}
```

#### switch 语句

```csharp
// 传统 switch
int dayOfWeek = 3;

switch (dayOfWeek)
{
    case 1:
        Console.WriteLine("星期一");
        break;
    case 2:
        Console.WriteLine("星期二");
        break;
    case 3:
        Console.WriteLine("星期三");
        break;
    case 4:
        Console.WriteLine("星期四");
        break;
    case 5:
        Console.WriteLine("星期五");
        break;
    case 6:
    case 7:
        Console.WriteLine("周末！");
        break;
    default:
        Console.WriteLine("无效的日期");
        break;
}

// 字符串 switch
string command = "start";

switch (command.ToLower())
{
    case "start":
        Console.WriteLine("正在启动...");
        break;
    case "stop":
        Console.WriteLine("正在停止...");
        break;
    case "pause":
        Console.WriteLine("正在暂停...");
        break;
    default:
        Console.WriteLine("未知命令");
        break;
}

// switch 表达式 (C# 8.0+)
string dayName = dayOfWeek switch
{
    1 => "星期一",
    2 => "星期二",
    3 => "星期三",
    4 => "星期四",
    5 => "星期五",
    6 or 7 => "周末",
    _ => "无效的日期"
};

// switch 中的模式匹配 (C# 8.0+)
object obj = 42;

string description = obj switch
{
    int i when i < 0 => "负整数",
    int i when i == 0 => "零",
    int i when i > 0 => "正整数",
    string s => $"长度为 {s.Length} 的字符串",
    null => "空值",
    _ => "未知类型"
};
```

### 循环

#### for 循环

```csharp
// 基本 for 循环
for (int i = 0; i < 5; i++)
{
    Console.WriteLine($"第 {i} 次迭代");
}

// 倒数
for (int i = 10; i > 0; i--)
{
    Console.WriteLine(i);
}
Console.WriteLine("发射！");

// 多个变量
for (int i = 0, j = 10; i < j; i++, j--)
{
    Console.WriteLine($"i: {i}, j: {j}");
}

// 无限循环（谨慎使用）
// for (;;)
// {
//     // 无限循环 - 需要 break 条件
// }

// 嵌套循环
for (int row = 1; row <= 5; row++)
{
    for (int col = 1; col <= row; col++)
    {
        Console.Write("* ");
    }
    Console.WriteLine();
}
// 输出:
// *
// * *
// * * *
// * * * *
// * * * * *
```

#### while 循环

```csharp
// 基本 while 循环
int count = 0;
while (count < 5)
{
    Console.WriteLine($"计数: {count}");
    count++;
}

// 带条件的 while
string input = "";
while (input != "quit")
{
    Console.Write("输入命令（或输入 'quit' 退出）: ");
    input = Console.ReadLine();
    Console.WriteLine($"你输入了: {input}");
}

// 复杂条件的 while
int attempts = 0;
bool success = false;
while (!success && attempts < 3)
{
    Console.WriteLine("正在尝试连接...");
    success = TryConnect();
    attempts++;
}
```

#### do-while 循环

```csharp
// 至少执行一次
int number;
do
{
    Console.Write("输入一个正数: ");
    number = int.Parse(Console.ReadLine());
} while (number <= 0);

// 菜单示例
string choice;
do
{
    Console.WriteLine("\n=== 菜单 ===");
    Console.WriteLine("1. 选项 1");
    Console.WriteLine("2. 选项 2");
    Console.WriteLine("3. 退出");
    Console.Write("请选择: ");
    choice = Console.ReadLine();

    switch (choice)
    {
        case "1":
            Console.WriteLine("你选择了选项 1");
            break;
        case "2":
            Console.WriteLine("你选择了选项 2");
            break;
        case "3":
            Console.WriteLine("正在退出...");
            break;
        default:
            Console.WriteLine("无效选择");
            break;
    }
} while (choice != "3");
```

#### foreach 循环

```csharp
// 遍历数组
int[] numbers = { 1, 2, 3, 4, 5 };
foreach (int number in numbers)
{
    Console.WriteLine(number);
}

// 遍历集合
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
foreach (string name in names)
{
    Console.WriteLine($"你好, {name}!");
}

// 遍历字符串（字符）
string word = "Hello";
foreach (char letter in word)
{
    Console.WriteLine(letter);
}

// 在 foreach 中不能修改集合
// foreach (int num in numbers)
// {
//     numbers[0] = 10;  // 这会编译通过但可能导致问题
// }
```

### 跳转语句

#### break 语句

```csharp
// 提前退出循环
for (int i = 0; i < 10; i++)
{
    if (i == 5)
    {
        break;  // 当 i 等于 5 时退出循环
    }
    Console.WriteLine(i);
}
// 输出: 0, 1, 2, 3, 4

// 嵌套循环中的 break（只退出内层循环）
for (int i = 0; i < 3; i++)
{
    for (int j = 0; j < 3; j++)
    {
        if (j == 1)
        {
            break;  // 只退出内层循环
        }
        Console.WriteLine($"i: {i}, j: {j}");
    }
}
```

#### continue 语句

```csharp
// 跳过当前迭代
for (int i = 0; i < 10; i++)
{
    if (i % 2 == 0)
    {
        continue;  // 跳过偶数
    }
    Console.WriteLine(i);
}
// 输出: 1, 3, 5, 7, 9

// while 循环中的 continue
int count = 0;
while (count < 10)
{
    count++;
    if (count == 5)
    {
        continue;  // 当 count 等于 5 时跳过
    }
    Console.WriteLine(count);
}
```

#### return 语句

```csharp
// 从方法返回
int Add(int a, int b)
{
    return a + b;  // 退出方法并返回值
}

// 提前返回
bool IsPositive(int number)
{
    if (number <= 0)
    {
        return false;  // 提前退出
    }
    return true;
}

// void 方法中的 return
void PrintMessage(string message)
{
    if (string.IsNullOrEmpty(message))
    {
        return;  // 不返回值退出方法
    }
    Console.WriteLine(message);
}
```

#### goto 语句

```csharp
// goto（不推荐使用 - 谨慎使用）
int i = 0;

StartLoop:
if (i < 5)
{
    Console.WriteLine(i);
    i++;
    goto StartLoop;
}

// goto 的更实用场景：跳出嵌套循环
for (int x = 0; x < 10; x++)
{
    for (int y = 0; y < 10; y++)
    {
        if (x == 5 && y == 5)
        {
            goto ExitLoops;
        }
    }
}

ExitLoops:
Console.WriteLine("已退出嵌套循环");
```

## 数组

数组是相同类型元素的固定大小集合。它们提供了高效存储和访问多个值的方式。

### 一维数组

```csharp
// 数组声明和初始化
int[] numbers = new int[5];  // 5个整数的数组（全部初始化为 0）

// 用值初始化
int[] scores = { 85, 90, 78, 92, 88 };

// 数组初始化语法
int[] values = new int[] { 1, 2, 3, 4, 5 };

// 访问元素（从零开始索引）
int firstScore = scores[0];   // 85
int lastScore = scores[4];    // 88

// 修改元素
scores[0] = 95;
scores[2] = 80;

// 数组长度
int arrayLength = scores.Length;  // 5

// 遍历数组
for (int i = 0; i < scores.Length; i++)
{
    Console.WriteLine($"分数 {i + 1}: {scores[i]}");
}

// 使用 foreach
foreach (int score in scores)
{
    Console.WriteLine(score);
}
```

### 多维数组

#### 矩形数组

```csharp
// 二维数组声明
int[,] matrix = new int[3, 4];  // 3 行, 4 列

// 用值初始化
int[,] grid =
{
    { 1, 2, 3, 4 },
    { 5, 6, 7, 8 },
    { 9, 10, 11, 12 }
};

// 访问元素
int element = grid[1, 2];  // 7（第 1 行，第 2 列）

// 获取维度
int rows = grid.GetLength(0);     // 3
int columns = grid.GetLength(1);  // 4
int totalElements = grid.Length;  // 12

// 遍历二维数组
for (int row = 0; row < grid.GetLength(0); row++)
{
    for (int col = 0; col < grid.GetLength(1); col++)
    {
        Console.Write($"{grid[row, col]} ");
    }
    Console.WriteLine();
}

// 三维数组
int[,,] cube = new int[2, 3, 4];  // 2 x 3 x 4 数组
cube[0, 1, 2] = 42;
```

#### 交错数组

```csharp
// 交错数组（数组的数组）
int[][] jaggedArray = new int[3][];

// 初始化每个内部数组
jaggedArray[0] = new int[] { 1, 2, 3 };
jaggedArray[1] = new int[] { 4, 5 };
jaggedArray[2] = new int[] { 6, 7, 8, 9 };

// 访问元素
int value = jaggedArray[0][1];  // 2

// 用值初始化
int[][] scores =
{
    new int[] { 85, 90, 78 },
    new int[] { 92, 88 },
    new int[] { 95, 87, 91, 89 }
};

// 遍历交错数组
for (int i = 0; i < scores.Length; i++)
{
    Console.Write($"第 {i} 行: ");
    for (int j = 0; j < scores[i].Length; j++)
    {
        Console.Write($"{scores[i][j]} ");
    }
    Console.WriteLine();
}

// 使用 foreach
foreach (int[] row in scores)
{
    foreach (int score in row)
    {
        Console.Write($"{score} ");
    }
    Console.WriteLine();
}
```

### 数组方法和操作

```csharp
int[] numbers = { 5, 2, 8, 1, 9, 3 };

// 排序数组
Array.Sort(numbers);  // { 1, 2, 3, 5, 8, 9 }

// 反转数组
Array.Reverse(numbers);  // { 9, 8, 5, 3, 2, 1 }

// 查找元素索引
int index = Array.IndexOf(numbers, 5);  // 2

// 检查元素是否存在
bool exists = Array.Exists(numbers, x => x == 8);  // true

// 查找元素
int firstEven = Array.Find(numbers, x => x % 2 == 0);  // 8

// 查找所有匹配元素
int[] evenNumbers = Array.FindAll(numbers, x => x % 2 == 0);

// 复制数组
int[] copy = new int[numbers.Length];
Array.Copy(numbers, copy, numbers.Length);

// 克隆数组
int[] clone = (int[])numbers.Clone();

// 清除数组（将元素设为默认值）
Array.Clear(numbers, 0, numbers.Length);  // 所有元素变为 0

// 调整数组大小（创建新数组）
Array.Resize(ref numbers, 10);

// 用值填充数组 (C# 2.0+)
int[] filled = new int[5];
Array.Fill(filled, 42);  // { 42, 42, 42, 42, 42 }
```

### 数组初始化模式

```csharp
// 空数组
int[] empty = new int[0];
// 或
int[] empty2 = Array.Empty<int>();

// 用默认值初始化
int[] defaults = new int[5];  // { 0, 0, 0, 0, 0 }

// 用计算值初始化
int[] squares = new int[10];
for (int i = 0; i < squares.Length; i++)
{
    squares[i] = i * i;
}

// 使用 LINQ 初始化
int[] range = Enumerable.Range(1, 10).ToArray();  // { 1, 2, 3, ..., 10 }
int[] evenRange = Enumerable.Range(1, 10).Where(x => x % 2 == 0).ToArray();

// 集合初始化器
string[] fruits = { "Apple", "Banana", "Orange", "Grape" };

// 目标类型 new 表达式 (C# 9.0+)
int[] nums = new[] { 1, 2, 3, 4, 5 };
```

### 数组边界和安全性

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// 获取边界
int lowerBound = numbers.GetLowerBound(0);  // 0
int upperBound = numbers.GetUpperBound(0);  // 4

// 带边界检查的安全访问
int index = 10;
if (index >= 0 && index < numbers.Length)
{
    int value = numbers[index];
}
else
{
    Console.WriteLine("索引超出范围");
}

// IndexOutOfRangeException
try
{
    int value = numbers[10];  // 抛出异常
}
catch (IndexOutOfRangeException ex)
{
    Console.WriteLine("无效索引");
}

// 使用 Span<T> 进行安全切片 (C# 7.2+)
Span<int> slice = numbers.AsSpan(1, 3);  // 索引 1, 2, 3 处的元素
```

## 最佳实践

1. **使用有意义的变量名**：选择能够表明变量用途的描述性名称。

```csharp
// 不好
int x = 30;

// 好
int userAge = 30;
```

2. **选择合适的数据类型**：根据需求使用最合适的数据类型。

```csharp
// 金融计算使用 decimal
decimal accountBalance = 1234.56m;

// 计数和索引使用 int
int itemCount = 10;
```

3. **用 const 代替魔法数字**：为不变的值定义常量。

```csharp
// 不好
if (age >= 18) { }

// 好
const int LEGAL_AGE = 18;
if (age >= LEGAL_AGE) { }
```

4. **谨慎使用 var**：当类型从赋值右侧显而易见时使用 `var`。

```csharp
// 好的 var 使用
var customer = new Customer();
var numbers = new List<int>();

// 不好的 var 使用（类型不明显）
var result = GetData();  // result 是什么类型？
```

5. **避免深层嵌套条件**：将复杂的嵌套 if 语句重构为独立的方法。

```csharp
// 不好 - 深层嵌套
if (condition1)
{
    if (condition2)
    {
        if (condition3)
        {
            // 做某事
        }
    }
}

// 好 - 提前返回
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
// 做某事
```

6. **尽可能使用集合代替数组**：数组大小固定；像 `List<T>` 这样的集合更灵活。

```csharp
// 固定大小集合使用数组
int[] daysInWeek = new int[7];

// 动态集合使用 List
List<string> names = new List<string>();
names.Add("Alice");
names.Add("Bob");
```

7. **验证数组边界**：访问元素前始终检查数组索引。

```csharp
if (index >= 0 && index < array.Length)
{
    var element = array[index];
}
```

## 总结

本指南涵盖了 C# 的基本构建模块：

- **数据类型**：值类型（int、double、bool 等）和引用类型（string、object、数组）
- **变量和常量**：声明、初始化、作用域和不变性
- **运算符**：算术、逻辑、比较、位运算等
- **控制流**：条件语句（if、switch）和循环（for、while、foreach）
- **数组**：一维、多维和交错数组及各种操作

理解这些基础知识对于编写高效的 C# 代码至关重要。随着你的深入学习，你将在这些概念的基础上创建更复杂、更强大的应用程序。

## 后续学习

- 探索 C# 中的面向对象编程（类、继承、多态）
- 学习集合和泛型（List、Dictionary 等）
- 研究异常处理和错误管理
- 深入了解 LINQ 进行强大的数据查询
- 理解使用 async/await 的异步编程

祝编程愉快！
