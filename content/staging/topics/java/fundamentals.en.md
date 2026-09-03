---
title: Java Language Fundamentals
description: Deep dive into Java data types, variables, operators and control flow
track: java
section: basics
difficulty: beginner
tags:
  - Java
  - Fundamentals
  - Data Types
  - Control Flow
status: imported
origin: old/src/content/docs/java/fundamentals.en.md
divergence: 0.209
issues: []
legacy:
  category: Java
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

Java is a strongly-typed, object-oriented programming language that requires understanding of fundamental concepts before diving into advanced topics. We cover the essential building blocks of Java programming.

## Data Types

Java has two categories of data types: **primitive types** and **reference types**.

### Primitive Data Types

Java has 8 primitive data types that store simple values:

#### Integer Types

```java
byte myByte = 127;        // 8-bit, range: -128 to 127
short myShort = 32000;     // 16-bit, range: -32,768 to 32,767
int myInt = 2147483647;    // 32-bit, range: -2^31 to 2^31-1
long myLong = 9223372036854775807L; // 64-bit, range: -2^63 to 2^63-1
```

#### Floating-Point Types

```java
float myFloat = 3.14f;     // 32-bit IEEE 754 floating point
double myDouble = 3.14159265359; // 64-bit IEEE 754 floating point
```

#### Other Primitive Types

```java
boolean isValid = true;    // true or false
char myChar = 'A';         // 16-bit Unicode character
```

### Reference Types

Reference types include classes, interfaces, arrays, and enumerations. They store references (memory addresses) to objects rather than the actual values.

```java
String name = "John";      // String is a reference type
Integer num = 42;          // Wrapper class for int
Object obj = new Object(); // Base class for all objects
```

### Type Conversion

#### Implicit Conversion (Widening)

```java
int myInt = 100;
long myLong = myInt;       // Automatic conversion
float myFloat = myLong;    // int -> long -> float
```

#### Explicit Conversion (Narrowing)

```java
double myDouble = 9.78;
int myInt = (int) myDouble; // myInt becomes 9 (truncation)
```

## Variables

Variables are containers that hold data values during program execution.

### Variable Declaration and Initialization

```java
// Declaration
int age;

// Initialization
age = 25;

// Declaration and initialization
int count = 0;
String message = "Hello, Java!";

// Multiple variables of same type
int x = 5, y = 10, z = 15;
```

### Variable Naming Conventions

```java
// Valid variable names
int age;
int studentAge;
int _count;
int $price;

// Invalid variable names
// int 2fast;        // Cannot start with a digit
// int my-var;       // Hyphens not allowed
// int class;        // Reserved keyword
```

### Variable Scope

```java
public class ScopeExample {
    // Instance variable (class scope)
    private int instanceVar = 10;

    // Static variable (class scope)
    private static int staticVar = 20;

    public void method() {
        // Local variable (method scope)
        int localVar = 30;

        if (true) {
            // Block scope
            int blockVar = 40;
            System.out.println(blockVar); // OK
        }

        // System.out.println(blockVar); // Error: out of scope
    }
}
```

### Constants

```java
final int MAX_USERS = 100;
final double PI = 3.14159;
final String APP_NAME = "MyApp";

// Constants cannot be reassigned
// MAX_USERS = 200; // Compilation error
```

## Operators

Java provides various operators for performing operations on variables and values.

### Arithmetic Operators

```java
int a = 10, b = 3;

int sum = a + b;        // Addition: 13
int diff = a - b;       // Subtraction: 7
int product = a * b;    // Multiplication: 30
int quotient = a / b;   // Division: 3 (integer division)
int remainder = a % b;  // Modulus: 1

// Increment and Decrement
int x = 5;
x++;  // Post-increment: x becomes 6
++x;  // Pre-increment: x becomes 7
x--;  // Post-decrement: x becomes 6
--x;  // Pre-decrement: x becomes 5
```

### Assignment Operators

```java
int num = 10;

num += 5;   // num = num + 5;  Result: 15
num -= 3;   // num = num - 3;  Result: 12
num *= 2;   // num = num * 2;  Result: 24
num /= 4;   // num = num / 4;  Result: 6
num %= 4;   // num = num % 4;  Result: 2
```

### Comparison Operators

```java
int x = 10, y = 20;

boolean result1 = (x == y);  // Equal to: false
boolean result2 = (x != y);  // Not equal to: true
boolean result3 = (x > y);   // Greater than: false
boolean result4 = (x < y);   // Less than: true
boolean result5 = (x >= 10); // Greater than or equal: true
boolean result6 = (y <= 20); // Less than or equal: true
```

### Logical Operators

```java
boolean a = true, b = false;

boolean and = a && b;  // Logical AND: false
boolean or = a || b;   // Logical OR: true
boolean not = !a;      // Logical NOT: false

// Short-circuit evaluation
int x = 5;
if (x > 0 && x / 0 == 1) {  // Second condition not evaluated
    // This won't cause ArithmeticException
}
```

### Bitwise Operators

```java
int a = 5;  // Binary: 0101
int b = 3;  // Binary: 0011

int and = a & b;   // Bitwise AND: 1 (0001)
int or = a | b;    // Bitwise OR: 7 (0111)
int xor = a ^ b;   // Bitwise XOR: 6 (0110)
int not = ~a;      // Bitwise NOT: -6
int left = a << 1; // Left shift: 10 (1010)
int right = a >> 1; // Right shift: 2 (0010)
```

### Ternary Operator

```java
int age = 20;
String status = (age >= 18) ? "Adult" : "Minor";

// Equivalent to:
String status2;
if (age >= 18) {
    status2 = "Adult";
} else {
    status2 = "Minor";
}
```

## Control Flow

Control flow statements determine the order in which code executes.

### If-Else Statements

```java
int score = 85;

if (score >= 90) {
    System.out.println("Grade: A");
} else if (score >= 80) {
    System.out.println("Grade: B");
} else if (score >= 70) {
    System.out.println("Grade: C");
} else if (score >= 60) {
    System.out.println("Grade: D");
} else {
    System.out.println("Grade: F");
}
```

### Switch Statements

```java
int dayOfWeek = 3;
String dayName;

switch (dayOfWeek) {
    case 1:
        dayName = "Monday";
        break;
    case 2:
        dayName = "Tuesday";
        break;
    case 3:
        dayName = "Wednesday";
        break;
    case 4:
        dayName = "Thursday";
        break;
    case 5:
        dayName = "Friday";
        break;
    case 6:
    case 7:
        dayName = "Weekend";
        break;
    default:
        dayName = "Invalid day";
}
```

#### Switch Expressions (Java 12+)

```java
int dayOfWeek = 3;
String dayName = switch (dayOfWeek) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    case 4 -> "Thursday";
    case 5 -> "Friday";
    case 6, 7 -> "Weekend";
    default -> "Invalid day";
};
```

### For Loop

```java
// Traditional for loop
for (int i = 0; i < 5; i++) {
    System.out.println("Count: " + i);
}

// Nested for loop
for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 3; j++) {
        System.out.println(i + " x " + j + " = " + (i * j));
    }
}

// Enhanced for loop (for-each)
int[] numbers = {1, 2, 3, 4, 5};
for (int num : numbers) {
    System.out.println(num);
}
```

### While Loop

```java
int count = 0;
while (count < 5) {
    System.out.println("Count: " + count);
    count++;
}

// Infinite loop
while (true) {
    // Loop until break is encountered
    if (someCondition) {
        break;
    }
}
```

### Do-While Loop

```java
int count = 0;
do {
    System.out.println("Count: " + count);
    count++;
} while (count < 5);

// Executes at least once, even if condition is false
int x = 10;
do {
    System.out.println("This runs once");
} while (x < 5);
```

### Break and Continue

```java
// Break: exits the loop
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break;  // Loop terminates when i equals 5
    }
    System.out.println(i);
}

// Continue: skips to next iteration
for (int i = 0; i < 10; i++) {
    if (i % 2 == 0) {
        continue;  // Skip even numbers
    }
    System.out.println(i);  // Prints only odd numbers
}

// Labeled break (for nested loops)
outer: for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1 && j == 1) {
            break outer;  // Breaks out of both loops
        }
        System.out.println(i + ", " + j);
    }
}
```

## Arrays

Arrays are containers that hold a fixed number of elements of the same type.

### Array Declaration and Initialization

```java
// Declaration
int[] numbers;
String[] names;

// Initialization with size
numbers = new int[5];  // Creates array of 5 integers (default: 0)
names = new String[3]; // Creates array of 3 strings (default: null)

// Declaration and initialization
int[] scores = new int[5];

// Array literal
int[] values = {1, 2, 3, 4, 5};
String[] fruits = {"Apple", "Banana", "Orange"};

// Alternative syntax (less common)
int numbers2[] = new int[5];
```

### Accessing Array Elements

```java
int[] numbers = {10, 20, 30, 40, 50};

// Access elements by index (0-based)
int first = numbers[0];   // 10
int third = numbers[2];   // 30

// Modify elements
numbers[1] = 25;          // Changes second element to 25

// Array length
int size = numbers.length; // 5
```

### Iterating Through Arrays

```java
int[] numbers = {1, 2, 3, 4, 5};

// Traditional for loop
for (int i = 0; i < numbers.length; i++) {
    System.out.println("Element at index " + i + ": " + numbers[i]);
}

// Enhanced for loop
for (int num : numbers) {
    System.out.println(num);
}
```

### Multidimensional Arrays

```java
// 2D array declaration
int[][] matrix = new int[3][4];  // 3 rows, 4 columns

// 2D array initialization
int[][] grid = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// Accessing elements
int element = grid[1][2];  // 6 (row 1, column 2)

// Iterating 2D array
for (int i = 0; i < grid.length; i++) {
    for (int j = 0; j < grid[i].length; j++) {
        System.out.print(grid[i][j] + " ");
    }
    System.out.println();
}

// Jagged array (rows with different lengths)
int[][] jagged = {
    {1, 2},
    {3, 4, 5},
    {6, 7, 8, 9}
};
```

### Array Utility Methods

```java
import java.util.Arrays;

int[] numbers = {5, 2, 8, 1, 9};

// Sorting
Arrays.sort(numbers);  // {1, 2, 5, 8, 9}

// Searching (array must be sorted)
int index = Arrays.binarySearch(numbers, 5);  // Returns index of 5

// Copying
int[] copy = Arrays.copyOf(numbers, numbers.length);
int[] partial = Arrays.copyOfRange(numbers, 1, 4);  // Elements 1-3

// Filling
int[] filled = new int[5];
Arrays.fill(filled, 10);  // {10, 10, 10, 10, 10}

// Comparing
int[] arr1 = {1, 2, 3};
int[] arr2 = {1, 2, 3};
boolean equal = Arrays.equals(arr1, arr2);  // true

// Converting to String
String str = Arrays.toString(numbers);  // "[1, 2, 5, 8, 9]"
```

## Strings

Strings are sequences of characters used to store and manipulate text.

### String Creation

```java
// String literals
String greeting = "Hello, World!";
String name = "Java";

// Using new keyword
String str1 = new String("Hello");
String str2 = new String(new char[] {'J', 'a', 'v', 'a'});

// Empty string
String empty = "";
```

### String Immutability

```java
String original = "Hello";
String modified = original.concat(" World");

System.out.println(original);  // "Hello" (unchanged)
System.out.println(modified);  // "Hello World" (new string)
```

### String Operations

#### Length and Character Access

```java
String text = "Hello, Java!";

int length = text.length();        // 12
char firstChar = text.charAt(0);   // 'H'
char lastChar = text.charAt(text.length() - 1); // '!'
```

#### String Comparison

```java
String str1 = "Hello";
String str2 = "Hello";
String str3 = "hello";

// Using == (compares references, not content)
boolean same = (str1 == str2);  // May be true (string pool)

// Using equals() (compares content)
boolean equal = str1.equals(str2);      // true
boolean equal2 = str1.equals(str3);     // false

// Case-insensitive comparison
boolean equalIgnoreCase = str1.equalsIgnoreCase(str3);  // true

// Lexicographic comparison
int result = str1.compareTo(str2);      // 0 (equal)
int result2 = str1.compareTo(str3);     // negative (str1 < str3)
```

#### String Searching

```java
String text = "Java Programming Language";

// Check if contains substring
boolean contains = text.contains("Programming");  // true

// Find index of substring
int index = text.indexOf("Programming");     // 5
int lastIndex = text.lastIndexOf("a");       // 23

// Check prefix and suffix
boolean starts = text.startsWith("Java");    // true
boolean ends = text.endsWith("Language");    // true
```

#### String Modification

```java
String text = "  Hello, World!  ";

// Convert case
String upper = text.toUpperCase();  // "  HELLO, WORLD!  "
String lower = text.toLowerCase();  // "  hello, world!  "

// Trim whitespace
String trimmed = text.trim();       // "Hello, World!"

// Replace characters/substrings
String replaced = text.replace('o', '0');  // "  Hell0, W0rld!  "
String replaced2 = text.replace("World", "Java");  // "  Hello, Java!  "

// Substring
String sub1 = text.substring(7);       // "World!  "
String sub2 = text.substring(2, 7);    // "Hello"

// Split
String csv = "apple,banana,orange";
String[] fruits = csv.split(",");  // ["apple", "banana", "orange"]
```

#### String Concatenation

```java
// Using + operator
String firstName = "John";
String lastName = "Doe";
String fullName = firstName + " " + lastName;  // "John Doe"

// Using concat()
String result = "Hello".concat(" ").concat("World");  // "Hello World"

// Using join() (Java 8+)
String joined = String.join(", ", "apple", "banana", "orange");
// "apple, banana, orange"
```

### StringBuilder and StringBuffer

For efficient string manipulation (especially in loops), use StringBuilder or StringBuffer:

```java
// StringBuilder (not thread-safe, faster)
StringBuilder sb = new StringBuilder();
sb.append("Hello");
sb.append(" ");
sb.append("World");
String result = sb.toString();  // "Hello World"

// StringBuilder methods
StringBuilder builder = new StringBuilder("Hello");
builder.insert(5, " World");    // "Hello World"
builder.delete(5, 11);          // "Hello"
builder.reverse();              // "olleH"
builder.replace(0, 5, "Hi");    // "Hi"

// StringBuffer (thread-safe, slower)
StringBuffer buffer = new StringBuffer();
buffer.append("Thread-safe");
buffer.append(" string");
```

### String Formatting

```java
// Using String.format()
String name = "Alice";
int age = 25;
String formatted = String.format("Name: %s, Age: %d", name, age);
// "Name: Alice, Age: 25"

// Common format specifiers
String s = String.format("%d", 42);           // "42" (decimal integer)
String s2 = String.format("%f", 3.14159);     // "3.141590" (floating point)
String s3 = String.format("%.2f", 3.14159);   // "3.14" (2 decimal places)
String s4 = String.format("%s", "Hello");     // "Hello" (string)
String s5 = String.format("%10s", "Hi");      // "        Hi" (right-aligned)
String s6 = String.format("%-10s", "Hi");     // "Hi        " (left-aligned)

// Using printf()
System.out.printf("Name: %s, Age: %d%n", name, age);
```

### String Pool

```java
// String literals are stored in string pool
String str1 = "Hello";
String str2 = "Hello";
System.out.println(str1 == str2);  // true (same reference)

// new String() creates object in heap
String str3 = new String("Hello");
System.out.println(str1 == str3);  // false (different references)
System.out.println(str1.equals(str3));  // true (same content)

// Intern() adds to string pool
String str4 = str3.intern();
System.out.println(str1 == str4);  // true (same reference)
```

## Best Practices

1. **Use appropriate data types**: Choose the smallest data type that can hold your data to save memory.

2. **Initialize variables**: Always initialize variables before use to avoid unexpected behavior.

3. **Use meaningful variable names**: Choose descriptive names that indicate the variable's purpose.

4. **Prefer primitives over wrappers**: Use primitive types when possible for better performance.

5. **Use enhanced for loops**: When you don't need the index, use for-each loops for better readability.

6. **Use StringBuilder for string concatenation in loops**: Avoid using + operator in loops as it creates multiple String objects.

7. **Validate array indices**: Always check array bounds to avoid ArrayIndexOutOfBoundsException.

8. **Use constants for fixed values**: Define constants using `final` keyword for values that don't change.

9. **Compare strings with equals()**: Never use == to compare string content.

10. **Handle edge cases**: Consider null values, empty arrays, and boundary conditions in your code.

## Summary

Java fundamentals form the foundation of Java programming:

- **Data Types**: Understand primitive types (byte, short, int, long, float, double, boolean, char) and reference types.
- **Variables**: Declare, initialize, and use variables following proper naming conventions and scope rules.
- **Operators**: Use arithmetic, assignment, comparison, logical, and bitwise operators for computations.
- **Control Flow**: Direct program execution using if-else, switch, for, while, and do-while statements.
- **Arrays**: Store and manipulate collections of elements of the same type.
- **Strings**: Work with text using String class methods and understand string immutability.

Mastering these fundamentals is essential before moving on to object-oriented programming concepts like classes, inheritance, and polymorphism.
