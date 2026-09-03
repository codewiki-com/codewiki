---
title: Java 数据类型详解
description: 深入理解 Java 基本数据类型、包装类、自动装箱拆箱及类型转换机制
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - 数据类型
  - 包装类
  - 自动装箱
  - 类型转换
status: imported
origin: old/src/content/docs/java/data-types.en.md
divergence: 0.184
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: 语言基础
  order: 2
  lastUpdated: 2026-01-07
---

Data types are the foundation of programming languages, determining what kind of data variables can store and what operations can be performed on them. As a strongly-typed language, Java has strict definitions and specifications for its type system. This article will thoroughly explore Java's data type system, including primitive types, wrapper classes, autoboxing/unboxing, and type conversion.

## Concept Explanation

### What Are Data Types

A data type is a classification of data that defines:

1. **Storage Size**: How many bytes the variable occupies in memory
2. **Value Range**: The maximum and minimum values the variable can represent
3. **Allowed Operations**: What operations can be performed on data of this type
4. **Default Value**: The default value when uninitialized

### Overview of Java's Type System

Java's data types are divided into two main categories:

```
Java Data Types
├── Primitive Types
│   ├── Integer types: byte, short, int, long
│   ├── Floating-point types: float, double
│   ├── Character type: char
│   └── Boolean type: boolean
│
└── Reference Types
    ├── Class
    ├── Interface
    ├── Array
    └── Enum
```

### Historical Background

Java's type system design was heavily influenced by C/C++, but with important improvements:

- **Fixed Size**: Unlike C where primitive type sizes depend on the platform, Java's primitive type sizes are fixed, ensuring cross-platform consistency
- **No Unsigned Types**: Java has no unsigned types (except char), simplifying the type system
- **Introduction of Wrapper Classes**: To use primitive types in an object-oriented world, Java provides corresponding wrapper classes
- **Autoboxing/Unboxing**: Introduced in Java 5, simplifying conversion between primitive types and wrapper classes

## Core Principles

### Memory Representation of Primitive Types

#### Integer Storage

All integer types in Java use **two's complement** representation, allowing addition and subtraction operations to be handled uniformly:

```java
// byte type (8 bits) storage example
byte positive = 127;    // Binary: 0111 1111
byte negative = -128;   // Binary: 1000 0000 (two's complement)

// int type (32 bits) storage
int maxInt = 2147483647;  // 0111 1111 1111 1111 1111 1111 1111 1111
int minInt = -2147483648; // 1000 0000 0000 0000 0000 0000 0000 0000
```

**Two's Complement Calculation Rules**:
- The two's complement of a positive number is itself
- The two's complement of a negative number = invert all bits + 1

```java
// Two's complement calculation for -5 (using byte as example)
// Sign-magnitude: 1000 0101 (sign bit + absolute value)
// One's complement: 1111 1010 (sign bit unchanged, invert other bits)
// Two's complement: 1111 1011 (one's complement + 1)
byte negativeFive = -5;  // Stored in memory as: 1111 1011
```

#### Floating-Point Storage

Java's floating-point numbers follow the **IEEE 754** standard:

```
float (32 bits):
┌─────┬──────────┬───────────────────────┐
│Sign │ Exponent │       Mantissa        │
│1 bit│  8 bits  │        23 bits        │
└─────┴──────────┴───────────────────────┘

double (64 bits):
┌─────┬──────────┬───────────────────────────────────────┐
│Sign │ Exponent │              Mantissa                  │
│1 bit│  11 bits │               52 bits                  │
└─────┴──────────┴───────────────────────────────────────┘
```

**Root Cause of Floating-Point Precision Issues**:

```java
// Decimal 0.1 cannot be represented exactly in binary
double d = 0.1;
// Actually stored as: 0.1000000000000000055511151231257827021181583404541015625

System.out.println(0.1 + 0.2);  // Output: 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);  // Output: false
```

#### char Type Storage

Java's char uses **UTF-16** encoding, occupying 16 bits (2 bytes):

```java
char a = 'A';      // Stores Unicode code point 65 (0x0041)
char zhong = '中'; // Stores Unicode code point 20013 (0x4E2D)

// char is essentially an unsigned 16-bit integer
char c = 65;       // Equivalent to 'A'
System.out.println((int) 'A');  // Output: 65
```

### Internal Implementation of Wrapper Classes

#### Caching Mechanism

To improve performance, wrapper classes like Integer cache commonly used values:

```java
// Integer cache source code (simplified)
private static class IntegerCache {
    static final int low = -128;
    static final int high = 127;  // Adjustable via JVM parameter
    static final Integer[] cache;

    static {
        cache = new Integer[(high - low) + 1];
        int j = low;
        for (int k = 0; k < cache.length; k++) {
            cache[k] = new Integer(j++);
        }
    }
}

public static Integer valueOf(int i) {
    if (i >= IntegerCache.low && i <= IntegerCache.high)
        return IntegerCache.cache[i + (-IntegerCache.low)];
    return new Integer(i);
}
```

Cache ranges:
- **Byte**: -128 to 127 (all cached)
- **Short**: -128 to 127
- **Integer**: -128 to 127 (upper limit adjustable)
- **Long**: -128 to 127
- **Character**: 0 to 127
- **Boolean**: TRUE and FALSE (all cached)
- **Float/Double**: Not cached

### Implementation of Autoboxing/Unboxing

The compiler automatically inserts boxing/unboxing code during compilation:

```java
// Source code
Integer a = 10;
int b = a;

// Equivalent compiled code
Integer a = Integer.valueOf(10);  // Boxing
int b = a.intValue();             // Unboxing
```

## Key Points

### The Eight Primitive Data Types Explained

| Type | Size | Default | Range | Use Case |
|------|------|---------|-------|----------|
| byte | 8 bits | 0 | -128 ~ 127 | Memory savings, network transfer, file I/O |
| short | 16 bits | 0 | -32,768 ~ 32,767 | Rarely used, compatibility considerations |
| int | 32 bits | 0 | -2^31 ~ 2^31-1 | Most commonly used integer type |
| long | 64 bits | 0L | -2^63 ~ 2^63-1 | Large integers, timestamps |
| float | 32 bits | 0.0f | IEEE 754 | Single-precision floating-point |
| double | 64 bits | 0.0d | IEEE 754 | Most commonly used floating-point type |
| char | 16 bits | '\u0000' | 0 ~ 65,535 | Unicode characters |
| boolean | JVM-dependent | false | true/false | Logical operations |

### Min and Max Values for Each Type

```java
// Get boundary values for each type
System.out.println("byte: " + Byte.MIN_VALUE + " ~ " + Byte.MAX_VALUE);
System.out.println("short: " + Short.MIN_VALUE + " ~ " + Short.MAX_VALUE);
System.out.println("int: " + Integer.MIN_VALUE + " ~ " + Integer.MAX_VALUE);
System.out.println("long: " + Long.MIN_VALUE + " ~ " + Long.MAX_VALUE);
System.out.println("float: " + Float.MIN_VALUE + " ~ " + Float.MAX_VALUE);
System.out.println("double: " + Double.MIN_VALUE + " ~ " + Double.MAX_VALUE);
System.out.println("char: " + (int) Character.MIN_VALUE + " ~ " + (int) Character.MAX_VALUE);

/*
Output:
byte: -128 ~ 127
short: -32768 ~ 32767
int: -2147483648 ~ 2147483647
long: -9223372036854775808 ~ 9223372036854775807
float: 1.4E-45 ~ 3.4028235E38
double: 4.9E-324 ~ 1.7976931348623157E308
char: 0 ~ 65535
*/
```

### Mapping Between Wrapper Classes and Primitive Types

| Primitive Type | Wrapper Class | Inheritance |
|----------------|---------------|-------------|
| byte | Byte | Number |
| short | Short | Number |
| int | Integer | Number |
| long | Long | Number |
| float | Float | Number |
| double | Double | Number |
| char | Character | Object |
| boolean | Boolean | Object |

### Type Conversion Rules

#### Automatic Type Conversion (Implicit Conversion)

Automatic conversion from smaller to larger range follows this order:

```
byte -> short -> int -> long -> float -> double
                  ↑
                char
```

```java
byte b = 10;
short s = b;      // byte -> short
int i = s;        // short -> int
long l = i;       // int -> long
float f = l;      // long -> float (may lose precision)
double d = f;     // float -> double

char c = 'A';
int ascii = c;    // char -> int (get ASCII value)
```

#### Explicit Type Conversion (Casting)

Converting from larger to smaller range requires explicit casting:

```java
double d = 100.99;
int i = (int) d;        // 100, truncates decimal part

long l = 200L;
int j = (int) l;        // 200, safe conversion within range

int big = 130;
byte b = (byte) big;    // -126, overflow!
```

## Code Examples

### Using Primitive Data Types

```java
public class PrimitiveTypesDemo {
    public static void main(String[] args) {
        // ===== Integer Types =====

        // byte: memory-saving scenarios
        byte age = 25;
        byte[] buffer = new byte[1024];  // File read buffer

        // short: rarely used
        short year = 2026;

        // int: most commonly used integer type
        int population = 14_0000_0000;   // Underscores for readability (Java 7+)
        int hexValue = 0xFF;             // Hexadecimal notation
        int binaryValue = 0b1010_1010;   // Binary notation (Java 7+)
        int octalValue = 0755;           // Octal notation

        // long: large integers
        long distanceToSun = 149_600_000_000L;  // Must add L suffix
        long timestamp = System.currentTimeMillis();

        // ===== Floating-Point Types =====

        // float: single-precision floating-point
        float price = 19.99f;     // Must add f suffix
        float pi = 3.14159f;

        // double: double-precision floating-point (default)
        double precise = 3.141592653589793;
        double scientific = 1.5e10;  // Scientific notation

        // Special floating-point values
        double positiveInfinity = Double.POSITIVE_INFINITY;
        double negativeInfinity = Double.NEGATIVE_INFINITY;
        double notANumber = Double.NaN;

        System.out.println("1.0 / 0.0 = " + (1.0 / 0.0));   // Infinity
        System.out.println("0.0 / 0.0 = " + (0.0 / 0.0));   // NaN
        System.out.println("NaN == NaN: " + (Double.NaN == Double.NaN));  // false
        System.out.println("isNaN: " + Double.isNaN(0.0 / 0.0));  // true

        // ===== Character Type =====

        char letter = 'A';
        char chineseChar = '中';
        char unicodeChar = '\u4e2d';      // Unicode notation
        char newLine = '\n';              // Escape character
        char tab = '\t';
        char backslash = '\\';
        char singleQuote = '\'';

        // Numeric nature of char
        char start = 'a';
        for (int k = 0; k < 26; k++) {
            System.out.print((char) (start + k));  // Output a-z
        }
        System.out.println();

        // ===== Boolean Type =====

        boolean isJavaFun = true;
        boolean isRaining = false;
        boolean result = (10 > 5) && (3 < 7);  // true

        // boolean cannot be converted to/from other types
        // int num = (int) isJavaFun;  // Compilation error
    }
}
```

### Using Wrapper Classes

```java
public class WrapperClassDemo {
    public static void main(String[] args) {
        // ===== Creating Wrapper Class Objects =====

        // Method 1: valueOf (recommended, uses cache)
        Integer a = Integer.valueOf(100);
        Integer b = Integer.valueOf("100");

        // Method 2: Autoboxing (compiler automatically calls valueOf)
        Integer c = 100;

        // Method 3: Constructor (deprecated, not recommended)
        @SuppressWarnings("deprecation")
        Integer d = new Integer(100);

        // ===== Getting Primitive Type Values =====

        int value1 = a.intValue();           // Explicit unboxing
        int value2 = a;                       // Auto-unboxing
        double doubleValue = a.doubleValue(); // Convert to double

        // ===== String Conversion =====

        // String to primitive type
        int parsed = Integer.parseInt("123");
        double parsedDouble = Double.parseDouble("3.14");
        boolean parsedBool = Boolean.parseBoolean("true");

        // Primitive type to String
        String str1 = Integer.toString(123);
        String str2 = String.valueOf(123);
        String str3 = 123 + "";  // Poor performance

        // Base conversion
        String binary = Integer.toBinaryString(255);   // "11111111"
        String octal = Integer.toOctalString(255);     // "377"
        String hex = Integer.toHexString(255);         // "ff"
        int fromBinary = Integer.parseInt("11111111", 2);  // 255
        int fromHex = Integer.parseInt("ff", 16);          // 255

        // ===== Comparison Operations =====

        Integer x = 128;
        Integer y = 128;
        Integer p = 100;
        Integer q = 100;

        // Within cache range (-128 to 127)
        System.out.println(p == q);           // true (same object)
        System.out.println(p.equals(q));      // true

        // Outside cache range
        System.out.println(x == y);           // false (different objects)
        System.out.println(x.equals(y));      // true

        // Recommended: use equals or compareTo
        System.out.println(x.compareTo(y));   // 0 (equal)
        System.out.println(Integer.compare(x, y));  // 0

        // ===== Common Static Methods =====

        int max = Integer.max(10, 20);        // 20
        int min = Integer.min(10, 20);        // 10
        int sum = Integer.sum(10, 20);        // 30

        int bitCount = Integer.bitCount(255); // 8 (count of 1s in binary)
        int highestBit = Integer.highestOneBit(100);  // 64
        int leadingZeros = Integer.numberOfLeadingZeros(1);  // 31

        // ===== Handling null =====

        Integer nullable = null;

        // Auto-unboxing null throws NullPointerException
        // int willThrow = nullable;  // NullPointerException

        // Safe handling
        int safeValue = nullable != null ? nullable : 0;
        int safeValue2 = nullable == null ? 0 : nullable.intValue();

        // Java 9+ can use Objects
        // int safeValue3 = Objects.requireNonNullElse(nullable, 0);
    }
}
```

### Autoboxing/Unboxing Explained

```java
public class AutoBoxingDemo {
    public static void main(String[] args) {
        // ===== Basic Boxing/Unboxing =====

        // Autoboxing: primitive type -> wrapper class
        Integer a = 100;  // Compiles to: Integer.valueOf(100)
        Double d = 3.14;  // Compiles to: Double.valueOf(3.14)
        Boolean b = true; // Compiles to: Boolean.valueOf(true)

        // Auto-unboxing: wrapper class -> primitive type
        int x = a;        // Compiles to: a.intValue()
        double y = d;     // Compiles to: d.doubleValue()
        boolean z = b;    // Compiles to: b.booleanValue()

        // ===== Auto-unboxing in Operations =====

        Integer num1 = 10;
        Integer num2 = 20;

        // Arithmetic operations trigger auto-unboxing
        int sum = num1 + num2;           // Unbox then compute
        Integer result = num1 + num2;    // Unbox, compute, then box again

        // Comparison operations
        boolean isEqual = (num1 < num2); // Unbox then compare

        // ===== Type Promotion in Conditional Expressions =====

        Integer boxedInt = 100;
        int primitiveInt = 200;

        // Ternary operator performs type unification
        // If one side is primitive, the other will be unboxed
        Integer result1 = true ? boxedInt : primitiveInt;  // boxedInt stays, primitiveInt boxes
        int result2 = true ? boxedInt : primitiveInt;      // boxedInt unboxes

        // ===== Boxing/Unboxing in Method Overloading =====

        overloadTest(100);    // Calls int version
        overloadTest((Integer) 100);  // Calls Integer version

        // ===== Boxing in Collections =====

        List<Integer> numbers = new ArrayList<>();
        numbers.add(10);     // Autoboxing
        numbers.add(20);

        int first = numbers.get(0);  // Auto-unboxing

        // Unboxing during iteration
        int total = 0;
        for (int n : numbers) {  // Unboxes on each iteration
            total += n;
        }
    }

    static void overloadTest(int value) {
        System.out.println("int version: " + value);
    }

    static void overloadTest(Integer value) {
        System.out.println("Integer version: " + value);
    }
}
```

### Type Conversion Examples

```java
public class TypeConversionDemo {
    public static void main(String[] args) {
        // ===== Automatic Type Conversion (Implicit Conversion) =====

        byte b = 10;
        short s = b;     // byte -> short
        int i = s;       // short -> int
        long l = i;      // int -> long
        float f = l;     // long -> float
        double d = f;    // float -> double

        // char to int conversion
        char c = 'A';
        int ascii = c;   // 65

        // Type promotion in expressions
        byte b1 = 10, b2 = 20;
        // byte b3 = b1 + b2;  // Compilation error! byte operation results in int
        int b3 = b1 + b2;      // Correct
        byte b4 = (byte) (b1 + b2);  // Explicit cast

        // ===== Explicit Type Conversion (Casting) =====

        // Float to integer: truncates decimal part
        double pi = 3.14159;
        int intPi = (int) pi;       // 3

        // Integer overflow
        int bigInt = 130;
        byte smallByte = (byte) bigInt;  // -126 (overflow)

        // Verify overflow
        System.out.println("130 as byte: " + smallByte);
        System.out.println("130 in binary: " + Integer.toBinaryString(130));
        // 130 = 1000 0010, interpreted as signed byte is -126

        // ===== String and Numeric Conversion =====

        // String -> numeric
        int fromString = Integer.parseInt("123");
        long fromStringL = Long.parseLong("123456789012");
        double fromStringD = Double.parseDouble("3.14159");

        // Handling different bases
        int binary = Integer.parseInt("1010", 2);   // 10
        int hex = Integer.parseInt("FF", 16);       // 255
        int octal = Integer.parseInt("77", 8);      // 63

        // Numeric -> String
        String str1 = String.valueOf(123);
        String str2 = Integer.toString(123);
        String str3 = "" + 123;  // Not recommended, inefficient

        // Formatted conversion
        String formatted = String.format("%.2f", 3.14159);  // "3.14"

        // ===== Conversion Between Wrapper Classes =====

        Integer intObj = 100;

        // Through primitive type conversion
        Long longObj = intObj.longValue();      // Not recommended
        Long longObj2 = (long) intObj;          // Unbox then box
        Long longObj3 = Long.valueOf(intObj);   // Recommended

        Double doubleObj = intObj.doubleValue();

        // ===== Number Type Conversion =====

        Number number = Integer.valueOf(100);
        int intValue = number.intValue();
        long longValue = number.longValue();
        double doubleValue = number.doubleValue();

        // ===== Object and Primitive Types =====

        Object obj = 100;          // Autoboxed to Integer
        int value = (Integer) obj; // Cast then unbox

        // Safe conversion
        if (obj instanceof Integer) {
            int safeValue = (Integer) obj;
        }

        // Java 16+ pattern matching
        // if (obj instanceof Integer intVal) {
        //     System.out.println(intVal);
        // }
    }
}
```

### Precise Calculation Examples

```java
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;

public class PreciseCalculationDemo {
    public static void main(String[] args) {
        // ===== Floating-Point Precision Issues =====

        System.out.println("0.1 + 0.2 = " + (0.1 + 0.2));  // 0.30000000000000004
        System.out.println("1.0 - 0.9 = " + (1.0 - 0.9));  // 0.09999999999999998

        // ===== Using BigDecimal for Precise Calculations =====

        // Creating BigDecimal (recommended to use String constructor)
        BigDecimal bd1 = new BigDecimal("0.1");
        BigDecimal bd2 = new BigDecimal("0.2");

        // Not recommended: double constructor introduces precision issues
        BigDecimal bd3 = new BigDecimal(0.1);  // 0.1000000000000000055511151231257827...

        // Recommended approach
        BigDecimal bd4 = BigDecimal.valueOf(0.1);  // Uses Double.toString for conversion

        // Arithmetic operations
        BigDecimal sum = bd1.add(bd2);               // 0.3
        BigDecimal diff = bd2.subtract(bd1);         // 0.1
        BigDecimal product = bd1.multiply(bd2);      // 0.02
        BigDecimal quotient = bd1.divide(bd2, 10, RoundingMode.HALF_UP);  // 0.5

        System.out.println("BigDecimal 0.1 + 0.2 = " + sum);  // 0.3

        // Comparison
        BigDecimal a = new BigDecimal("1.0");
        BigDecimal b = new BigDecimal("1.00");
        System.out.println("equals: " + a.equals(b));      // false (different scale)
        System.out.println("compareTo: " + a.compareTo(b)); // 0 (numerically equal)

        // Setting scale and rounding mode
        BigDecimal price = new BigDecimal("19.995");
        BigDecimal rounded = price.setScale(2, RoundingMode.HALF_UP);  // 20.00

        // Rounding modes
        BigDecimal num = new BigDecimal("2.5");
        System.out.println("HALF_UP: " + num.setScale(0, RoundingMode.HALF_UP));      // 3
        System.out.println("HALF_DOWN: " + num.setScale(0, RoundingMode.HALF_DOWN));  // 2
        System.out.println("HALF_EVEN: " + num.setScale(0, RoundingMode.HALF_EVEN));  // 2 (banker's rounding)
        System.out.println("CEILING: " + num.setScale(0, RoundingMode.CEILING));      // 3
        System.out.println("FLOOR: " + num.setScale(0, RoundingMode.FLOOR));          // 2

        // ===== Using BigInteger for Large Integers =====

        BigInteger big1 = new BigInteger("123456789012345678901234567890");
        BigInteger big2 = BigInteger.valueOf(Long.MAX_VALUE);

        // Operations
        BigInteger bigSum = big1.add(big2);
        BigInteger bigProduct = big1.multiply(big2);
        BigInteger bigPow = BigInteger.TEN.pow(100);  // 10^100

        // Common methods
        System.out.println("bit length: " + big1.bitLength());
        System.out.println("is probably prime: " + big1.isProbablePrime(100));
        System.out.println("gcd: " + big1.gcd(big2));

        // ===== Financial Calculation Example =====

        BigDecimal principal = new BigDecimal("10000.00");
        BigDecimal rate = new BigDecimal("0.05");
        int years = 10;

        // Compound interest calculation: A = P(1 + r)^n
        BigDecimal factor = BigDecimal.ONE.add(rate);
        BigDecimal amount = principal.multiply(factor.pow(years));
        amount = amount.setScale(2, RoundingMode.HALF_UP);

        System.out.println("Total after 10 years: " + amount);
    }
}
```

## Best Practices

### Choosing the Right Data Type

```java
public class TypeSelectionBestPractice {

    // Recommended: use int as the default integer type
    public int calculateSum(int[] numbers) {
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        return sum;
    }

    // Recommended: use long for large values
    public long calculateTotalBytes(long fileCount, long avgFileSize) {
        return fileCount * avgFileSize;
    }

    // Recommended: use BigDecimal for financial calculations
    public BigDecimal calculateInterest(BigDecimal principal, BigDecimal rate) {
        return principal.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    // Recommended: use byte for byte array processing
    public byte[] readFile(String path) {
        // File reading...
        return new byte[0];
    }

    // Avoid: unnecessary use of short
    // short is promoted to int during operations, actually reducing performance
    // unless you have large amounts of data and need to save memory
}
```

### Proper Use of Wrapper Classes

```java
public class WrapperClassBestPractice {

    // Recommended: use Objects.equals to compare potentially null wrapper classes
    public boolean areEqual(Integer a, Integer b) {
        return Objects.equals(a, b);
    }

    // Recommended: avoid boxing in loops
    public long sumBad(List<Integer> numbers) {
        Long sum = 0L;  // Bad: boxes on each addition
        for (Integer n : numbers) {
            sum += n;
        }
        return sum;
    }

    public long sumGood(List<Integer> numbers) {
        long sum = 0L;  // Good: use primitive type
        for (Integer n : numbers) {
            sum += n;  // Only unboxing, no boxing
        }
        return sum;
    }

    // Recommended: use static factory methods instead of constructors
    public Integer createInteger(int value) {
        return Integer.valueOf(value);  // Uses cache
        // Don't use: new Integer(value)
    }

    // Recommended: handle potentially null unboxing
    public int safeUnbox(Integer value) {
        return value != null ? value : 0;
        // Or use Optional
        // return Optional.ofNullable(value).orElse(0);
    }
}
```

### Safe Type Conversion

```java
public class TypeConversionBestPractice {

    // Recommended: check range before converting
    public byte toByteChecked(int value) {
        if (value < Byte.MIN_VALUE || value > Byte.MAX_VALUE) {
            throw new ArithmeticException("Value out of byte range: " + value);
        }
        return (byte) value;
    }

    // Recommended: use Math methods for safe conversion (Java 8+)
    public int toLongChecked(long value) {
        return Math.toIntExact(value);  // Throws exception on overflow
    }

    // Recommended: handle exceptions when converting strings
    public int parseIntSafe(String str, int defaultValue) {
        try {
            return Integer.parseInt(str);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    // Recommended: use Optional for potentially failing conversions (Java 8+)
    public Optional<Integer> parseIntOptional(String str) {
        try {
            return Optional.of(Integer.parseInt(str));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
```

### Proper Floating-Point Comparison

```java
public class FloatComparisonBestPractice {

    private static final double EPSILON = 1e-10;

    // Recommended: use tolerance for comparison
    public boolean almostEqual(double a, double b) {
        return Math.abs(a - b) < EPSILON;
    }

    // Recommended: use BigDecimal for exact comparison
    public boolean exactEqual(String a, String b) {
        BigDecimal bd1 = new BigDecimal(a);
        BigDecimal bd2 = new BigDecimal(b);
        return bd1.compareTo(bd2) == 0;
    }

    // Recommended: use Double.compare to handle special values
    public int compareDoubles(double a, double b) {
        return Double.compare(a, b);  // Correctly handles NaN and Infinity
    }

    // Avoid: directly using == to compare floating-point numbers
    public boolean badComparison(double a, double b) {
        return a == b;  // Unreliable!
    }
}
```

## Common Pitfalls

### Integer Overflow

```java
public class IntegerOverflowPitfall {
    public static void main(String[] args) {
        // Pitfall 1: Integer arithmetic overflow
        int a = Integer.MAX_VALUE;
        int b = a + 1;  // Overflows to negative number
        System.out.println("MAX_VALUE + 1 = " + b);  // -2147483648

        // Pitfall 2: Multiplication overflow
        int seconds = 24 * 60 * 60 * 1000;        // OK: 86400000
        int microseconds = 24 * 60 * 60 * 1000 * 1000;  // Overflow!
        System.out.println("microseconds = " + microseconds);  // Wrong result

        // Solution: use long type
        long microsecondsCorrect = 24L * 60 * 60 * 1000 * 1000;
        System.out.println("correct microseconds = " + microsecondsCorrect);

        // Pitfall 3: Intermediate result overflow
        int total = 1000000;
        int count = 1000000;
        // int wrong = (total * count) / count;  // Overflow
        long correct = ((long) total * count) / count;

        // Java 8+ solution: use Math class exact methods
        try {
            int sum = Math.addExact(Integer.MAX_VALUE, 1);
        } catch (ArithmeticException e) {
            System.out.println("Overflow detected: " + e.getMessage());
        }
    }
}
```

### Floating-Point Precision Issues

```java
public class FloatPrecisionPitfall {
    public static void main(String[] args) {
        // Pitfall 1: Classic 0.1 + 0.2 problem
        double result = 0.1 + 0.2;
        System.out.println("0.1 + 0.2 = " + result);        // 0.30000000000000004
        System.out.println("0.1 + 0.2 == 0.3: " + (result == 0.3));  // false

        // Pitfall 2: Error accumulation in loops
        double sum = 0.0;
        for (int i = 0; i < 10; i++) {
            sum += 0.1;
        }
        System.out.println("0.1 * 10 = " + sum);  // 0.9999999999999999
        System.out.println("sum == 1.0: " + (sum == 1.0));  // false

        // Pitfall 3: Comparison precision
        double a = 1.0 - 0.9;
        double b = 0.1;
        System.out.println("1.0 - 0.9 = " + a);  // 0.09999999999999998
        System.out.println("a == b: " + (a == b));  // false

        // Solutions
        // Solution 1: Use tolerance
        System.out.println("approximately equal: " + (Math.abs(a - b) < 1e-10));

        // Solution 2: Use BigDecimal
        BigDecimal bd1 = new BigDecimal("1.0").subtract(new BigDecimal("0.9"));
        BigDecimal bd2 = new BigDecimal("0.1");
        System.out.println("BigDecimal comparison: " + (bd1.compareTo(bd2) == 0));
    }
}
```

### Wrapper Class Comparison Pitfalls

```java
public class WrapperComparisonPitfall {
    public static void main(String[] args) {
        // Pitfall 1: == comparison outside cache range
        Integer a = 128;
        Integer b = 128;
        System.out.println("a == b: " + (a == b));        // false
        System.out.println("a.equals(b): " + a.equals(b)); // true

        // Pitfall 2: Values within cache range appear equal
        Integer c = 100;
        Integer d = 100;
        System.out.println("c == d: " + (c == d));  // true (but this is coincidental!)

        // Pitfall 3: Mixed type comparison
        Integer x = 1000;
        Long y = 1000L;
        System.out.println("x.equals(y): " + x.equals(y));  // false! Different types
        System.out.println("x.intValue() == y: " + (x.intValue() == y));  // true

        // Pitfall 4: null comparison
        Integer nullInt = null;
        Integer oneHundred = 100;
        // System.out.println(nullInt == oneHundred);  // false, but can be confusing
        // System.out.println(nullInt.equals(oneHundred));  // NullPointerException!

        // Correct approach
        System.out.println(Objects.equals(nullInt, oneHundred));  // false, safe
    }
}
```

### Autoboxing/Unboxing Pitfalls

```java
public class AutoBoxingPitfall {
    public static void main(String[] args) {
        // Pitfall 1: Unboxing null
        Integer nullInteger = null;
        try {
            int value = nullInteger;  // NullPointerException!
        } catch (NullPointerException e) {
            System.out.println("null unboxing exception");
        }

        // Pitfall 2: Type promotion in ternary operator
        Integer a = 1;
        Integer b = 2;
        Integer c = null;
        // Integer result = true ? a : c;  // Safe
        // Integer result = false ? a : c;  // Returns null
        // int result = false ? a : c;  // NullPointerException!

        // Pitfall 3: Performance issue - boxing in loops
        Long sum = 0L;
        for (long i = 0; i < 1000000; i++) {
            sum += i;  // Creates new Long object each time
        }

        // Correct approach
        long sumPrimitive = 0L;
        for (long i = 0; i < 1000000; i++) {
            sumPrimitive += i;  // No boxing overhead
        }

        // Pitfall 4: Method overload ambiguity
        overloaded(100);  // Which version is called? Answer: int version
    }

    static void overloaded(int value) {
        System.out.println("int version");
    }

    static void overloaded(Integer value) {
        System.out.println("Integer version");
    }

    static void overloaded(long value) {
        System.out.println("long version");
    }
}
```

### char Type Pitfalls

```java
public class CharPitfall {
    public static void main(String[] args) {
        // Pitfall 1: char addition results in int
        char c1 = 'a';
        char c2 = 'b';
        // char c3 = c1 + c2;  // Compilation error! Result is int
        char c3 = (char) (c1 + c2);  // Requires explicit cast
        int sum = c1 + c2;  // 195

        // Pitfall 2: String and char addition
        String s = "Hello" + 'A';  // "HelloA"
        String s2 = 'A' + "Hello"; // "AHello"
        // int n = 'A' + 'B';  // 131 (numeric addition)
        String s3 = "" + 'A' + 'B';  // "AB"
        String s4 = 'A' + 'B' + "";  // "131" (numeric addition first, then string conversion)

        System.out.println(s3);  // "AB"
        System.out.println(s4);  // "131"

        // Pitfall 3: Unicode supplementary characters
        // Java's char is 16-bit, cannot represent all Unicode characters
        String emoji = "\uD83D\uDE00";  // Smiley face requires 2 chars
        System.out.println("length: " + emoji.length());  // 2
        System.out.println("code point count: " + emoji.codePointCount(0, emoji.length()));  // 1
    }
}
```

## Performance Considerations

### Primitive Types vs Wrapper Classes Performance

```java
public class PerformanceComparison {
    private static final int ITERATIONS = 100_000_000;

    public static void main(String[] args) {
        // Test primitive type performance
        long startPrimitive = System.nanoTime();
        long sumPrimitive = 0L;
        for (int i = 0; i < ITERATIONS; i++) {
            sumPrimitive += i;
        }
        long endPrimitive = System.nanoTime();
        System.out.printf("Primitive type time: %.2f ms%n",
            (endPrimitive - startPrimitive) / 1_000_000.0);

        // Test wrapper class performance
        long startBoxed = System.nanoTime();
        Long sumBoxed = 0L;
        for (int i = 0; i < ITERATIONS; i++) {
            sumBoxed += i;  // Autoboxing
        }
        long endBoxed = System.nanoTime();
        System.out.printf("Wrapper type time: %.2f ms%n",
            (endBoxed - startBoxed) / 1_000_000.0);

        // Typical result: wrapper type takes about 5-10x longer than primitive type
    }
}
```

### Impact of Caching

```java
public class CachePerformance {
    public static void main(String[] args) {
        int iterations = 10_000_000;

        // Within cache range
        long startCached = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            Integer a = Integer.valueOf(100);  // Uses cache
        }
        long endCached = System.nanoTime();

        // Outside cache range
        long startNotCached = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            Integer b = Integer.valueOf(1000);  // Creates new object each time
        }
        long endNotCached = System.nanoTime();

        System.out.printf("Within cache range: %.2f ms%n", (endCached - startCached) / 1_000_000.0);
        System.out.printf("Outside cache range: %.2f ms%n", (endNotCached - startNotCached) / 1_000_000.0);
    }
}
```

### Memory Usage Comparison

```java
public class MemoryComparison {
    public static void main(String[] args) {
        // Primitive type array
        int[] primitiveArray = new int[1_000_000];
        // Memory usage: ~4MB (1,000,000 * 4 bytes)

        // Wrapper class array
        Integer[] boxedArray = new Integer[1_000_000];
        for (int i = 0; i < boxedArray.length; i++) {
            boxedArray[i] = i;
        }
        // Memory usage: ~20MB
        // - Array itself: ~4MB (references)
        // - Integer objects: ~16MB (each object ~16 bytes)

        System.out.println("Primitive type arrays save more memory");
    }
}
```

### Performance Optimization Tips

```java
public class PerformanceOptimization {

    // Optimization 1: Use primitive type arrays instead of List<Integer>
    public int sumPrimitive(int[] numbers) {
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        return sum;
    }

    // Optimization 2: Avoid unnecessary boxing
    public long sumList(List<Integer> numbers) {
        long sum = 0L;  // Use primitive type for accumulation
        for (int n : numbers) {  // Auto-unboxing
            sum += n;
        }
        return sum;
    }

    // Optimization 3: Use specialized primitive streams (Java 8+)
    public long sumStream(List<Integer> numbers) {
        return numbers.stream()
            .mapToInt(Integer::intValue)  // Convert to IntStream
            .sum();
    }

    // Optimization 4: Use third-party libraries (e.g., Trove, Eclipse Collections)
    // TIntArrayList list = new TIntArrayList();
    // These libraries provide primitive type collection implementations
}
```

## Real-World Scenarios

### Scenario 1: Order Amount Calculation

```java
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public class OrderCalculation {

    public static class OrderItem {
        private String name;
        private BigDecimal price;
        private int quantity;

        public OrderItem(String name, BigDecimal price, int quantity) {
            this.name = name;
            this.price = price;
            this.quantity = quantity;
        }

        public BigDecimal getSubtotal() {
            return price.multiply(BigDecimal.valueOf(quantity));
        }

        // getters...
        public BigDecimal getPrice() { return price; }
        public int getQuantity() { return quantity; }
    }

    public static class Order {
        private List<OrderItem> items;
        private BigDecimal discountRate;  // Discount rate
        private BigDecimal taxRate;       // Tax rate

        public Order(List<OrderItem> items, BigDecimal discountRate, BigDecimal taxRate) {
            this.items = items;
            this.discountRate = discountRate;
            this.taxRate = taxRate;
        }

        // Calculate subtotal
        public BigDecimal calculateSubtotal() {
            return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Calculate discount
        public BigDecimal calculateDiscount() {
            return calculateSubtotal()
                .multiply(discountRate)
                .setScale(2, RoundingMode.HALF_UP);
        }

        // Calculate tax
        public BigDecimal calculateTax() {
            BigDecimal afterDiscount = calculateSubtotal().subtract(calculateDiscount());
            return afterDiscount
                .multiply(taxRate)
                .setScale(2, RoundingMode.HALF_UP);
        }

        // Calculate total
        public BigDecimal calculateTotal() {
            BigDecimal subtotal = calculateSubtotal();
            BigDecimal discount = calculateDiscount();
            BigDecimal tax = calculateTax();
            return subtotal.subtract(discount).add(tax)
                .setScale(2, RoundingMode.HALF_UP);
        }
    }

    public static void main(String[] args) {
        List<OrderItem> items = List.of(
            new OrderItem("Product A", new BigDecimal("99.99"), 2),
            new OrderItem("Product B", new BigDecimal("49.50"), 3),
            new OrderItem("Product C", new BigDecimal("199.00"), 1)
        );

        Order order = new Order(items, new BigDecimal("0.1"), new BigDecimal("0.08"));

        System.out.println("Subtotal: " + order.calculateSubtotal());
        System.out.println("Discount: " + order.calculateDiscount());
        System.out.println("Tax: " + order.calculateTax());
        System.out.println("Total: " + order.calculateTotal());
    }
}
```

### Scenario 2: Database Entities and Null Handling

```java
import java.util.Objects;
import java.util.Optional;

public class DatabaseEntity {

    public static class User {
        private Long id;           // Database primary key, may be null (when creating)
        private String username;
        private Integer age;       // Optional field, may be null
        private Double score;      // Optional field, may be null
        private Boolean active;    // Optional field, may be null

        // Safely get age, avoid NullPointerException
        public int getAgeOrDefault(int defaultAge) {
            return age != null ? age : defaultAge;
        }

        // Use Optional to represent potentially null values
        public Optional<Integer> getAgeOptional() {
            return Optional.ofNullable(age);
        }

        // Safely check if adult
        public boolean isAdult() {
            return age != null && age >= 18;
        }

        // Safe equals implementation
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            User user = (User) o;
            return Objects.equals(id, user.id);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id);
        }

        // Use builder pattern for optional fields
        public static class Builder {
            private final User user = new User();

            public Builder id(Long id) {
                user.id = id;
                return this;
            }

            public Builder username(String username) {
                user.username = username;
                return this;
            }

            public Builder age(Integer age) {
                user.age = age;
                return this;
            }

            public Builder score(Double score) {
                user.score = score;
                return this;
            }

            public Builder active(Boolean active) {
                user.active = active;
                return this;
            }

            public User build() {
                return user;
            }
        }
    }

    public static void main(String[] args) {
        User user = new User.Builder()
            .id(1L)
            .username("alice")
            .age(25)
            .active(true)
            .build();

        // Safe usage
        System.out.println("Age: " + user.getAgeOrDefault(0));
        System.out.println("Is adult: " + user.isAdult());

        user.getAgeOptional().ifPresent(age ->
            System.out.println("Optional age: " + age));
    }
}
```

### Scenario 3: High-Performance Numeric Processing

```java
import java.util.Arrays;
import java.util.concurrent.ThreadLocalRandom;

public class HighPerformanceNumeric {

    // Use primitive type arrays for high-performance computation
    public static class Statistics {

        public static double mean(double[] values) {
            double sum = 0.0;
            for (double v : values) {
                sum += v;
            }
            return sum / values.length;
        }

        public static double variance(double[] values) {
            double mean = mean(values);
            double sumSquaredDiff = 0.0;
            for (double v : values) {
                double diff = v - mean;
                sumSquaredDiff += diff * diff;
            }
            return sumSquaredDiff / values.length;
        }

        public static double standardDeviation(double[] values) {
            return Math.sqrt(variance(values));
        }

        public static double[] minMax(double[] values) {
            double min = Double.MAX_VALUE;
            double max = Double.MIN_VALUE;
            for (double v : values) {
                if (v < min) min = v;
                if (v > max) max = v;
            }
            return new double[]{min, max};
        }

        // Use Kahan summation algorithm to reduce floating-point error
        public static double kahanSum(double[] values) {
            double sum = 0.0;
            double c = 0.0;  // Error compensation
            for (double v : values) {
                double y = v - c;
                double t = sum + y;
                c = (t - sum) - y;
                sum = t;
            }
            return sum;
        }
    }

    // Bit operation optimizations
    public static class BitOperations {

        // Check if power of two
        public static boolean isPowerOfTwo(int n) {
            return n > 0 && (n & (n - 1)) == 0;
        }

        // Round up to nearest power of two
        public static int nextPowerOfTwo(int n) {
            n--;
            n |= n >> 1;
            n |= n >> 2;
            n |= n >> 4;
            n |= n >> 8;
            n |= n >> 16;
            return n + 1;
        }

        // Calculate absolute value (branchless)
        public static int abs(int n) {
            int mask = n >> 31;
            return (n ^ mask) - mask;
        }

        // Swap two numbers (no temporary variable)
        public static void swap(int[] arr, int i, int j) {
            arr[i] ^= arr[j];
            arr[j] ^= arr[i];
            arr[i] ^= arr[j];
        }
    }

    public static void main(String[] args) {
        // Generate test data
        double[] values = new double[1_000_000];
        for (int i = 0; i < values.length; i++) {
            values[i] = ThreadLocalRandom.current().nextDouble() * 100;
        }

        // Statistical calculations
        System.out.printf("Mean: %.4f%n", Statistics.mean(values));
        System.out.printf("Standard deviation: %.4f%n", Statistics.standardDeviation(values));

        double[] minMax = Statistics.minMax(values);
        System.out.printf("Min: %.4f, Max: %.4f%n", minMax[0], minMax[1]);

        // Bit operation examples
        System.out.println("16 is power of two: " + BitOperations.isPowerOfTwo(16));
        System.out.println("100 rounded up: " + BitOperations.nextPowerOfTwo(100));
    }
}
```

## Interview Key Points

### Questions About Primitive Types

**Q: What are Java's primitive data types? What are their sizes and ranges?**

A: Java has 8 primitive data types:
- Integer types: byte (8 bits), short (16 bits), int (32 bits), long (64 bits)
- Floating-point types: float (32 bits), double (64 bits)
- Character type: char (16 bits, Unicode)
- Boolean type: boolean

Key points: int range is approximately -2.1 billion to 2.1 billion, long range is approximately -9.2 quintillion to 9.2 quintillion. float has about 7 significant digits, double has about 15-16 significant digits.

**Q: Why doesn't 0.1 + 0.2 equal 0.3 in Java?**

A: Because floating-point numbers use the IEEE 754 standard for storage, and decimal 0.1 cannot be represented exactly in binary, resulting in a small error during storage. Solutions include using BigDecimal for precise calculations or using tolerance for comparisons.

### Questions About Wrapper Classes

**Q: What is Integer's caching mechanism? What does the following code output?**

```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);  // ?
System.out.println(c == d);  // ?
```

A: Output is true and false. Integer caches values in the range -128 to 127, and valueOf returns cached objects. Outside this range, a new object is created each time. You should always use equals() to compare wrapper classes.

**Q: What is the implementation principle of autoboxing/unboxing?**

A: The compiler automatically inserts conversion code during compilation:
- Boxing: calls valueOf() method, e.g., Integer.valueOf(10)
- Unboxing: calls xxxValue() method, e.g., intValue()

### Type Conversion Questions

**Q: What's wrong with the following code?**

```java
Integer a = null;
int b = a;  // ?
```

A: It will throw NullPointerException. Auto-unboxing null calls null.intValue(), causing a null pointer exception. You should perform a null check first.

**Q: What's the difference between short s = 1; s = s + 1; and s += 1;?**

A:
- s = s + 1 causes a compilation error because s + 1 results in an int, requiring explicit casting
- s += 1 compiles normally because compound assignment operators include implicit type conversion

### Comprehensive Questions

**Q: When should you use primitive types vs wrapper classes?**

A:
- Primitive types: local variables, performance-sensitive calculations, scenarios where null is not needed
- Wrapper classes: generic collections, scenarios where "no value" (null) needs to be represented, database entity fields

**Q: How do you implement a thread-safe counter?**

```java
// Option 1: Use synchronized
private int count;
public synchronized void increment() { count++; }

// Option 2: Use AtomicInteger (recommended)
private AtomicInteger count = new AtomicInteger();
public void increment() { count.incrementAndGet(); }

// Option 3: Use LongAdder (recommended for high concurrency)
private LongAdder count = new LongAdder();
public void increment() { count.increment(); }
```

## Further Reading

### Official Documentation

- [Java Language Specification - Types](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html)
- [Java Tutorial - Primitive Data Types](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html)
- [BigDecimal Javadoc](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html)

### Classic Books

- "Effective Java" Third Edition - Item 61: Prefer primitive types to boxed primitives
- "Core Java" Volume I - Chapter 3: Fundamental Programming Structures in Java
- "Understanding the JVM" - Chapter 2: Java Memory Areas and Memory Overflow Exceptions

### Related Topics

- [Java Collections Framework](/java/collections) - Understanding wrapper class usage in generic collections
- [Java Generics](/java/generics) - Deep dive into generics and type erasure
- [Java Concurrency](/java/concurrency) - Atomic classes and thread-safe numeric operations
- [JVM Memory Model](/java/jvm) - Understanding how primitive types and objects are stored in memory

### Useful Tools

- [JOL (Java Object Layout)](https://openjdk.java.net/projects/code-tools/jol/) - Analyze object memory layout
- [JMH (Java Microbenchmark Harness)](https://openjdk.java.net/projects/code-tools/jmh/) - Performance benchmarking
- Eclipse Collections / Trove - Primitive type collection libraries
