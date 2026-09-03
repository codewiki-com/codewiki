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
origin: old/src/content/docs/csharp/fundamentals.en.md
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

C# is a modern, type-safe, object-oriented programming language developed by Microsoft as part of the .NET ecosystem. Understanding C# fundamentals is essential for building robust applications. We'll cover the core building blocks of the C# language.

## Data Types

C# is a strongly-typed language, meaning every variable must have a declared type. C# data types are categorized into two main groups: **value types** and **reference types**.

### Value Types

Value types store data directly in memory. When you assign a value type to another variable, a copy of the value is created.

#### Integral Types

```csharp
// Signed integers
sbyte smallNumber = -128;        // 8-bit signed integer (-128 to 127)
short mediumNumber = -32768;     // 16-bit signed integer (-32,768 to 32,767)
int standardNumber = -2147483648; // 32-bit signed integer (-2,147,483,648 to 2,147,483,647)
long largeNumber = -9223372036854775808L; // 64-bit signed integer

// Unsigned integers
byte unsignedSmall = 255;        // 8-bit unsigned integer (0 to 255)
ushort unsignedMedium = 65535;   // 16-bit unsigned integer (0 to 65,535)
uint unsignedStandard = 4294967295U; // 32-bit unsigned integer
ulong unsignedLarge = 18446744073709551615UL; // 64-bit unsigned integer
```

#### Floating-Point Types

```csharp
float singlePrecision = 3.14159f;    // 32-bit floating point (~6-9 digits precision)
double doublePrecision = 3.14159265358979; // 64-bit floating point (~15-17 digits precision)
decimal highPrecision = 3.14159265358979323846m; // 128-bit decimal (28-29 significant digits)

// Decimal is ideal for financial calculations
decimal price = 19.99m;
decimal taxRate = 0.08m;
decimal total = price * (1 + taxRate);
```

#### Boolean Type

```csharp
bool isActive = true;
bool isComplete = false;

// Boolean expressions
bool canProceed = (age >= 18) && (hasLicense == true);
```

#### Character Type

```csharp
char letter = 'A';
char digit = '5';
char unicodeChar = '\u0041'; // Unicode representation of 'A'
char newline = '\n';         // Escape sequence
```

#### Other Value Types

```csharp
// DateTime structure
DateTime now = DateTime.Now;
DateTime specificDate = new DateTime(2026, 1, 7);

// Struct example
struct Point
{
    public int X;
    public int Y;
}

Point origin = new Point { X = 0, Y = 0 };
```

### Reference Types

Reference types store a reference (memory address) to the actual data. Multiple variables can reference the same object.

#### String Type

```csharp
string message = "Hello, World!";
string multiLine = @"This is a
multi-line string
using verbatim string literal";

// String interpolation
string name = "John";
int age = 30;
string greeting = $"My name is {name} and I am {age} years old.";

// String concatenation
string fullName = firstName + " " + lastName;
```

#### Object Type

```csharp
object anything = 42;           // Can hold any type
anything = "Now a string";      // Boxing (value type to reference type)
int number = (int)anything;     // Unboxing requires explicit cast
```

#### Array Type (covered in detail later)

```csharp
int[] numbers = new int[5];
string[] names = { "Alice", "Bob", "Charlie" };
```

### Nullable Types

Value types can be made nullable by adding the `?` suffix:

```csharp
int? nullableInt = null;
double? nullableDouble = null;

// Checking for null
if (nullableInt.HasValue)
{
    Console.WriteLine($"Value: {nullableInt.Value}");
}

// Null-coalescing operator
int result = nullableInt ?? 0; // Use 0 if nullableInt is null
```

### Type Inference with var

The `var` keyword allows the compiler to infer the type from the initialization expression:

```csharp
var number = 42;              // int
var message = "Hello";        // string
var price = 19.99m;           // decimal
var isValid = true;           // bool

// var requires initialization
// var x; // Error: implicitly-typed variables must be initialized
```

## Variables and Constants

### Variables

Variables are named storage locations that can hold values. In C#, variables must be declared before use.

```csharp
// Variable declaration
int age;
string name;

// Variable initialization
age = 25;
name = "Alice";

// Declaration and initialization
int score = 100;
double temperature = 98.6;

// Multiple variable declaration
int x = 10, y = 20, z = 30;

// Variable naming conventions
string firstName;        // camelCase for local variables
string _privateField;    // underscore prefix for private fields
const int MAX_VALUE = 100; // UPPER_CASE for constants
```

#### Variable Scope

```csharp
class Program
{
    // Class-level variable (field)
    private static int classField = 10;

    static void Main()
    {
        // Method-level variable
        int methodVariable = 20;

        if (true)
        {
            // Block-level variable
            int blockVariable = 30;
            Console.WriteLine(methodVariable); // Accessible
        }

        // Console.WriteLine(blockVariable); // Error: out of scope
    }
}
```

### Constants

Constants are immutable values that cannot be changed after declaration:

```csharp
// const - compile-time constant
const double PI = 3.14159265359;
const string COMPANY_NAME = "Acme Corp";
const int MAX_USERS = 1000;

// PI = 3.14; // Error: cannot assign to a constant

// readonly - runtime constant
public class Configuration
{
    public readonly string DatabaseConnection;

    public Configuration(string dbConnection)
    {
        DatabaseConnection = dbConnection; // Can be assigned in constructor
    }
}
```

### Default Values

```csharp
// Value types have default values
int defaultInt = default;        // 0
bool defaultBool = default;      // false
double defaultDouble = default;  // 0.0

// Reference types default to null
string defaultString = default;  // null
object defaultObject = default;  // null

// Using default keyword
int[] numbers = new int[5];      // All elements initialized to 0
```

## Operators

Operators are symbols that perform operations on operands. C# supports various types of operators.

### Arithmetic Operators

```csharp
int a = 10, b = 3;

int sum = a + b;           // Addition: 13
int difference = a - b;    // Subtraction: 7
int product = a * b;       // Multiplication: 30
int quotient = a / b;      // Division: 3 (integer division)
int remainder = a % b;     // Modulus: 1

// Floating-point division
double result = (double)a / b;  // 3.333...

// Unary operators
int x = 5;
int y = -x;                // Negation: -5
int z = +x;                // Unary plus: 5

// Increment and decrement
int count = 0;
count++;                   // Post-increment: count = 1
++count;                   // Pre-increment: count = 2
count--;                   // Post-decrement: count = 1
--count;                   // Pre-decrement: count = 0

// Difference between pre and post increment
int n = 5;
int m = n++;               // m = 5, n = 6 (post-increment)
int p = ++n;               // p = 7, n = 7 (pre-increment)
```

### Assignment Operators

```csharp
int x = 10;

x += 5;    // x = x + 5  → 15
x -= 3;    // x = x - 3  → 12
x *= 2;    // x = x * 2  → 24
x /= 4;    // x = x / 4  → 6
x %= 4;    // x = x % 4  → 2

// Compound assignment with other operators
int value = 8;
value <<= 2;  // Left shift: value = 32
value >>= 1;  // Right shift: value = 16
```

### Comparison Operators

```csharp
int a = 10, b = 20;

bool isEqual = (a == b);        // false (equality)
bool isNotEqual = (a != b);     // true (inequality)
bool isGreater = (a > b);       // false (greater than)
bool isLess = (a < b);          // true (less than)
bool isGreaterOrEqual = (a >= b); // false
bool isLessOrEqual = (a <= b);  // true

// String comparison
string str1 = "hello";
string str2 = "HELLO";
bool areEqual = (str1 == str2);           // false (case-sensitive)
bool areEqualIgnoreCase = str1.Equals(str2, StringComparison.OrdinalIgnoreCase); // true
```

### Logical Operators

```csharp
bool a = true, b = false;

bool andResult = a && b;    // Logical AND: false
bool orResult = a || b;     // Logical OR: true
bool notResult = !a;        // Logical NOT: false

// Short-circuit evaluation
bool result = (a || ExpensiveOperation()); // ExpensiveOperation() not called if a is true

// Logical operators with conditions
int age = 25;
bool hasLicense = true;
bool canDrive = (age >= 18) && hasLicense; // true

// Combining multiple conditions
bool isWeekend = (day == "Saturday" || day == "Sunday");
bool canRelax = isWeekend && !hasWork;
```

### Bitwise Operators

```csharp
int a = 5;   // Binary: 0101
int b = 3;   // Binary: 0011

int andResult = a & b;   // Bitwise AND: 1 (0001)
int orResult = a | b;    // Bitwise OR: 7 (0111)
int xorResult = a ^ b;   // Bitwise XOR: 6 (0110)
int notResult = ~a;      // Bitwise NOT: -6 (inverts all bits)

int leftShift = a << 1;  // Left shift: 10 (1010)
int rightShift = a >> 1; // Right shift: 2 (0010)

// Practical use: flags
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

### Conditional (Ternary) Operator

```csharp
int age = 18;
string status = (age >= 18) ? "Adult" : "Minor";

// Nested ternary (use sparingly for readability)
int score = 85;
string grade = (score >= 90) ? "A" :
               (score >= 80) ? "B" :
               (score >= 70) ? "C" : "F";

// Null-coalescing operators
string name = null;
string displayName = name ?? "Guest";  // "Guest" if name is null

// Null-coalescing assignment (C# 8.0+)
name ??= "Default";  // Assign "Default" if name is null
```

### Type Testing and Casting Operators

```csharp
object obj = "Hello";

// Type testing
bool isString = obj is string;  // true
bool isInt = obj is int;        // false

// Type casting
string str = (string)obj;       // Explicit cast
// int num = (int)obj;          // Runtime error: InvalidCastException

// Safe casting with 'as'
string safeStr = obj as string; // Returns "Hello"
int? safeInt = obj as int?;     // Returns null (no exception)

// Pattern matching (C# 7.0+)
if (obj is string text)
{
    Console.WriteLine($"Length: {text.Length}");
}

// Type checking with typeof
Type type = typeof(string);
bool isSameType = (obj.GetType() == type);
```

### Other Operators

```csharp
// Member access
var person = new Person();
person.Name = "Alice";

// Indexer
int[] array = { 1, 2, 3, 4, 5 };
int firstElement = array[0];

// Null-conditional operators (C# 6.0+)
string name = person?.Name;  // Returns null if person is null
int? length = name?.Length;  // Returns null if name is null

// Null-conditional with indexer
int? firstItem = array?[0];

// Lambda operator
Func<int, int> square = x => x * x;
int result = square(5);  // 25

// sizeof operator (for value types)
int sizeOfInt = sizeof(int);      // 4 bytes
int sizeOfDouble = sizeof(double); // 8 bytes
```

## Control Flow

Control flow statements determine the order in which code is executed.

### Conditional Statements

#### if Statement

```csharp
int temperature = 25;

if (temperature > 30)
{
    Console.WriteLine("It's hot!");
}

// if-else
if (temperature > 30)
{
    Console.WriteLine("It's hot!");
}
else
{
    Console.WriteLine("It's not too hot.");
}

// if-else if-else
if (temperature > 30)
{
    Console.WriteLine("It's hot!");
}
else if (temperature > 20)
{
    Console.WriteLine("It's warm.");
}
else if (temperature > 10)
{
    Console.WriteLine("It's cool.");
}
else
{
    Console.WriteLine("It's cold!");
}

// Nested if statements
int age = 25;
bool hasLicense = true;

if (age >= 18)
{
    if (hasLicense)
    {
        Console.WriteLine("You can drive.");
    }
    else
    {
        Console.WriteLine("You need a license.");
    }
}
else
{
    Console.WriteLine("You're too young to drive.");
}
```

#### switch Statement

```csharp
// Traditional switch
int dayOfWeek = 3;

switch (dayOfWeek)
{
    case 1:
        Console.WriteLine("Monday");
        break;
    case 2:
        Console.WriteLine("Tuesday");
        break;
    case 3:
        Console.WriteLine("Wednesday");
        break;
    case 4:
        Console.WriteLine("Thursday");
        break;
    case 5:
        Console.WriteLine("Friday");
        break;
    case 6:
    case 7:
        Console.WriteLine("Weekend!");
        break;
    default:
        Console.WriteLine("Invalid day");
        break;
}

// Switch with string
string command = "start";

switch (command.ToLower())
{
    case "start":
        Console.WriteLine("Starting...");
        break;
    case "stop":
        Console.WriteLine("Stopping...");
        break;
    case "pause":
        Console.WriteLine("Pausing...");
        break;
    default:
        Console.WriteLine("Unknown command");
        break;
}

// Switch expression (C# 8.0+)
string dayName = dayOfWeek switch
{
    1 => "Monday",
    2 => "Tuesday",
    3 => "Wednesday",
    4 => "Thursday",
    5 => "Friday",
    6 or 7 => "Weekend",
    _ => "Invalid day"
};

// Pattern matching in switch (C# 8.0+)
object obj = 42;

string description = obj switch
{
    int i when i < 0 => "Negative integer",
    int i when i == 0 => "Zero",
    int i when i > 0 => "Positive integer",
    string s => $"String with length {s.Length}",
    null => "Null value",
    _ => "Unknown type"
};
```

### Loops

#### for Loop

```csharp
// Basic for loop
for (int i = 0; i < 5; i++)
{
    Console.WriteLine($"Iteration: {i}");
}

// Counting backwards
for (int i = 10; i > 0; i--)
{
    Console.WriteLine(i);
}
Console.WriteLine("Liftoff!");

// Multiple variables
for (int i = 0, j = 10; i < j; i++, j--)
{
    Console.WriteLine($"i: {i}, j: {j}");
}

// Infinite loop (use with caution)
// for (;;)
// {
//     // Infinite loop - needs break condition
// }

// Nested loops
for (int row = 1; row <= 5; row++)
{
    for (int col = 1; col <= row; col++)
    {
        Console.Write("* ");
    }
    Console.WriteLine();
}
// Output:
// *
// * *
// * * *
// * * * *
// * * * * *
```

#### while Loop

```csharp
// Basic while loop
int count = 0;
while (count < 5)
{
    Console.WriteLine($"Count: {count}");
    count++;
}

// While with condition
string input = "";
while (input != "quit")
{
    Console.Write("Enter a command (or 'quit' to exit): ");
    input = Console.ReadLine();
    Console.WriteLine($"You entered: {input}");
}

// While with complex condition
int attempts = 0;
bool success = false;
while (!success && attempts < 3)
{
    Console.WriteLine("Attempting connection...");
    success = TryConnect();
    attempts++;
}
```

#### do-while Loop

```csharp
// Execute at least once
int number;
do
{
    Console.Write("Enter a positive number: ");
    number = int.Parse(Console.ReadLine());
} while (number <= 0);

// Menu example
string choice;
do
{
    Console.WriteLine("\n=== Menu ===");
    Console.WriteLine("1. Option 1");
    Console.WriteLine("2. Option 2");
    Console.WriteLine("3. Exit");
    Console.Write("Choose an option: ");
    choice = Console.ReadLine();

    switch (choice)
    {
        case "1":
            Console.WriteLine("You chose option 1");
            break;
        case "2":
            Console.WriteLine("You chose option 2");
            break;
        case "3":
            Console.WriteLine("Exiting...");
            break;
        default:
            Console.WriteLine("Invalid choice");
            break;
    }
} while (choice != "3");
```

#### foreach Loop

```csharp
// Iterate over array
int[] numbers = { 1, 2, 3, 4, 5 };
foreach (int number in numbers)
{
    Console.WriteLine(number);
}

// Iterate over collection
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
foreach (string name in names)
{
    Console.WriteLine($"Hello, {name}!");
}

// Iterate over string (characters)
string word = "Hello";
foreach (char letter in word)
{
    Console.WriteLine(letter);
}

// Cannot modify collection during foreach
// foreach (int num in numbers)
// {
//     numbers[0] = 10;  // This will compile but may cause issues
// }
```

### Jump Statements

#### break Statement

```csharp
// Exit loop early
for (int i = 0; i < 10; i++)
{
    if (i == 5)
    {
        break;  // Exit loop when i equals 5
    }
    Console.WriteLine(i);
}
// Output: 0, 1, 2, 3, 4

// Break in nested loops (only exits inner loop)
for (int i = 0; i < 3; i++)
{
    for (int j = 0; j < 3; j++)
    {
        if (j == 1)
        {
            break;  // Only exits inner loop
        }
        Console.WriteLine($"i: {i}, j: {j}");
    }
}
```

#### continue Statement

```csharp
// Skip current iteration
for (int i = 0; i < 10; i++)
{
    if (i % 2 == 0)
    {
        continue;  // Skip even numbers
    }
    Console.WriteLine(i);
}
// Output: 1, 3, 5, 7, 9

// Continue in while loop
int count = 0;
while (count < 10)
{
    count++;
    if (count == 5)
    {
        continue;  // Skip when count is 5
    }
    Console.WriteLine(count);
}
```

#### return Statement

```csharp
// Return from method
int Add(int a, int b)
{
    return a + b;  // Exit method and return value
}

// Early return
bool IsPositive(int number)
{
    if (number <= 0)
    {
        return false;  // Exit early
    }
    return true;
}

// Return in void method
void PrintMessage(string message)
{
    if (string.IsNullOrEmpty(message))
    {
        return;  // Exit method without returning a value
    }
    Console.WriteLine(message);
}
```

#### goto Statement

```csharp
// goto (discouraged - use sparingly)
int i = 0;

StartLoop:
if (i < 5)
{
    Console.WriteLine(i);
    i++;
    goto StartLoop;
}

// More practical goto use case: breaking out of nested loops
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
Console.WriteLine("Exited nested loops");
```

## Arrays

Arrays are fixed-size collections of elements of the same type. They provide efficient storage and access to multiple values.

### Single-Dimensional Arrays

```csharp
// Array declaration and initialization
int[] numbers = new int[5];  // Array of 5 integers (all initialized to 0)

// Initialize with values
int[] scores = { 85, 90, 78, 92, 88 };

// Array initialization syntax
int[] values = new int[] { 1, 2, 3, 4, 5 };

// Access elements (zero-based indexing)
int firstScore = scores[0];   // 85
int lastScore = scores[4];    // 88

// Modify elements
scores[0] = 95;
scores[2] = 80;

// Array length
int arrayLength = scores.Length;  // 5

// Iterate through array
for (int i = 0; i < scores.Length; i++)
{
    Console.WriteLine($"Score {i + 1}: {scores[i]}");
}

// Using foreach
foreach (int score in scores)
{
    Console.WriteLine(score);
}
```

### Multi-Dimensional Arrays

#### Rectangular Arrays

```csharp
// 2D array declaration
int[,] matrix = new int[3, 4];  // 3 rows, 4 columns

// Initialize with values
int[,] grid =
{
    { 1, 2, 3, 4 },
    { 5, 6, 7, 8 },
    { 9, 10, 11, 12 }
};

// Access elements
int element = grid[1, 2];  // 7 (row 1, column 2)

// Get dimensions
int rows = grid.GetLength(0);     // 3
int columns = grid.GetLength(1);  // 4
int totalElements = grid.Length;  // 12

// Iterate through 2D array
for (int row = 0; row < grid.GetLength(0); row++)
{
    for (int col = 0; col < grid.GetLength(1); col++)
    {
        Console.Write($"{grid[row, col]} ");
    }
    Console.WriteLine();
}

// 3D array
int[,,] cube = new int[2, 3, 4];  // 2 x 3 x 4 array
cube[0, 1, 2] = 42;
```

#### Jagged Arrays

```csharp
// Jagged array (array of arrays)
int[][] jaggedArray = new int[3][];

// Initialize each inner array
jaggedArray[0] = new int[] { 1, 2, 3 };
jaggedArray[1] = new int[] { 4, 5 };
jaggedArray[2] = new int[] { 6, 7, 8, 9 };

// Access elements
int value = jaggedArray[0][1];  // 2

// Initialize with values
int[][] scores =
{
    new int[] { 85, 90, 78 },
    new int[] { 92, 88 },
    new int[] { 95, 87, 91, 89 }
};

// Iterate through jagged array
for (int i = 0; i < scores.Length; i++)
{
    Console.Write($"Row {i}: ");
    for (int j = 0; j < scores[i].Length; j++)
    {
        Console.Write($"{scores[i][j]} ");
    }
    Console.WriteLine();
}

// Using foreach
foreach (int[] row in scores)
{
    foreach (int score in row)
    {
        Console.Write($"{score} ");
    }
    Console.WriteLine();
}
```

### Array Methods and Operations

```csharp
int[] numbers = { 5, 2, 8, 1, 9, 3 };

// Sort array
Array.Sort(numbers);  // { 1, 2, 3, 5, 8, 9 }

// Reverse array
Array.Reverse(numbers);  // { 9, 8, 5, 3, 2, 1 }

// Find index of element
int index = Array.IndexOf(numbers, 5);  // 2

// Check if element exists
bool exists = Array.Exists(numbers, x => x == 8);  // true

// Find element
int firstEven = Array.Find(numbers, x => x % 2 == 0);  // 8

// Find all matching elements
int[] evenNumbers = Array.FindAll(numbers, x => x % 2 == 0);

// Copy array
int[] copy = new int[numbers.Length];
Array.Copy(numbers, copy, numbers.Length);

// Clone array
int[] clone = (int[])numbers.Clone();

// Clear array (set elements to default value)
Array.Clear(numbers, 0, numbers.Length);  // All elements become 0

// Resize array (creates new array)
Array.Resize(ref numbers, 10);

// Fill array with value (C# 2.0+)
int[] filled = new int[5];
Array.Fill(filled, 42);  // { 42, 42, 42, 42, 42 }
```

### Array Initialization Patterns

```csharp
// Empty array
int[] empty = new int[0];
// or
int[] empty2 = Array.Empty<int>();

// Initialize with default values
int[] defaults = new int[5];  // { 0, 0, 0, 0, 0 }

// Initialize with calculated values
int[] squares = new int[10];
for (int i = 0; i < squares.Length; i++)
{
    squares[i] = i * i;
}

// Using LINQ for initialization
int[] range = Enumerable.Range(1, 10).ToArray();  // { 1, 2, 3, ..., 10 }
int[] evenRange = Enumerable.Range(1, 10).Where(x => x % 2 == 0).ToArray();

// Collection initializer
string[] fruits = { "Apple", "Banana", "Orange", "Grape" };

// Target-typed new expression (C# 9.0+)
int[] nums = new[] { 1, 2, 3, 4, 5 };
```

### Array Bounds and Safety

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// Get bounds
int lowerBound = numbers.GetLowerBound(0);  // 0
int upperBound = numbers.GetUpperBound(0);  // 4

// Safe access with bounds checking
int index = 10;
if (index >= 0 && index < numbers.Length)
{
    int value = numbers[index];
}
else
{
    Console.WriteLine("Index out of range");
}

// IndexOutOfRangeException
try
{
    int value = numbers[10];  // Throws exception
}
catch (IndexOutOfRangeException ex)
{
    Console.WriteLine("Invalid index");
}

// Using Span<T> for safe slicing (C# 7.2+)
Span<int> slice = numbers.AsSpan(1, 3);  // Elements at index 1, 2, 3
```

## Best Practices

1. **Use meaningful variable names**: Choose descriptive names that indicate the purpose of the variable.

```csharp
// Bad
int x = 30;

// Good
int userAge = 30;
```

2. **Choose appropriate data types**: Use the most suitable data type for your needs.

```csharp
// Use decimal for financial calculations
decimal accountBalance = 1234.56m;

// Use int for counts and indices
int itemCount = 10;
```

3. **Prefer const over magic numbers**: Define constants for values that don't change.

```csharp
// Bad
if (age >= 18) { }

// Good
const int LEGAL_AGE = 18;
if (age >= LEGAL_AGE) { }
```

4. **Use var judiciously**: Use `var` when the type is obvious from the right side of the assignment.

```csharp
// Good use of var
var customer = new Customer();
var numbers = new List<int>();

// Poor use of var (type not obvious)
var result = GetData();  // What type is result?
```

5. **Avoid deeply nested conditionals**: Refactor complex nested if statements into separate methods.

```csharp
// Bad - deeply nested
if (condition1)
{
    if (condition2)
    {
        if (condition3)
        {
            // Do something
        }
    }
}

// Good - early returns
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
// Do something
```

6. **Use collections over arrays when possible**: Arrays have fixed size; collections like `List<T>` are more flexible.

```csharp
// Arrays for fixed-size collections
int[] daysInWeek = new int[7];

// Lists for dynamic collections
List<string> names = new List<string>();
names.Add("Alice");
names.Add("Bob");
```

7. **Validate array bounds**: Always check array indices before accessing elements.

```csharp
if (index >= 0 && index < array.Length)
{
    var element = array[index];
}
```

## Summary

This guide covered the fundamental building blocks of C#:

- **Data Types**: Value types (int, double, bool, etc.) and reference types (string, object, arrays)
- **Variables and Constants**: Declaration, initialization, scope, and immutability
- **Operators**: Arithmetic, logical, comparison, bitwise, and more
- **Control Flow**: Conditional statements (if, switch) and loops (for, while, foreach)
- **Arrays**: Single-dimensional, multi-dimensional, and jagged arrays with various operations

Understanding these fundamentals is crucial for writing effective C# code. As you progress, you'll build upon these concepts to create more complex and powerful applications.

## Next Steps

- Explore object-oriented programming in C# (classes, inheritance, polymorphism)
- Learn about collections and generics (List, Dictionary, etc.)
- Study exception handling and error management
- Dive into LINQ for powerful data querying
- Understand asynchronous programming with async/await

Happy coding!
