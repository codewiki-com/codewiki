---
title: Java Strings Comprehensive Guide
description: In-depth understanding of Java String immutability, string pool, StringBuilder/StringBuffer, common methods and formatting
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - String
  - StringBuilder
  - StringBuffer
  - String Pool
  - Immutability
status: imported
origin: old/src/content/docs/java/strings.en.md
divergence: 0.216
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: java
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-07
---

## Concept Explanation

String is one of the most commonly used classes in Java, used to represent and manipulate text data. In Java, strings are objects rather than primitive data types, defined by the `java.lang.String` class.

### What is String

String is an immutable object in Java that represents a sequence of characters. Each string is an instance of the `String` class, and once created, it cannot be modified. This design decision provides advantages in thread safety, caching efficiency, and security.

```java
// String is a class, strings are objects
String greeting = "Hello, World!";  // String literal
String name = new String("Alice");  // Created using constructor

// String class inheritance hierarchy
// java.lang.Object
//     └── java.lang.String (implements Serializable, Comparable<String>, CharSequence)
```

### Historical Background

Java has designed String as an immutable class since version 1.0, a result of careful consideration by designers like James Gosling. Immutability allows strings to be safely shared in multi-threaded environments while supporting the String Pool mechanism to optimize memory usage.

### Problems It Solves

- **Memory Optimization**: Reuses identical string objects through the string pool
- **Thread Safety**: Immutable objects are inherently thread-safe
- **Security**: Cannot be accidentally modified when used as critical parameters in class loading, network connections, etc.
- **Hash Caching**: String's hashCode can be cached, improving performance of collections like HashMap

## Core Principles

### String Internal Implementation

Before Java 9, String internally used a `char[]` array to store character data. Starting from Java 9, it adopted Compact Strings optimization, using a `byte[]` array with an encoding flag:

```java
// Java 8 and earlier implementation
public final class String {
    private final char[] value;  // Each character occupies 2 bytes
    private int hash;
}

// Java 9+ implementation (Compact Strings)
public final class String {
    private final byte[] value;   // Each character occupies 1 or 2 bytes
    private final byte coder;     // Encoding flag: LATIN1(0) or UTF16(1)
    private int hash;
    private boolean hashIsZero;   // Java 14+ caches 0 value hashCode
}
```

### Immutability Principle

String immutability is guaranteed through the following mechanisms:

```java
public final class String {
    // 1. Class is declared as final and cannot be inherited

    // 2. Character array is declared as private final
    private final byte[] value;

    // 3. No methods provide modification of the internal array
    // All seemingly modifying methods return a new String object

    public String concat(String str) {
        // Does not modify the original string, but creates and returns a new object
        if (str.isEmpty()) {
            return this;
        }
        return StringConcatHelper.simpleConcat(this, str);
    }

    public String substring(int beginIndex) {
        // Also returns a new object
        return substring(beginIndex, length());
    }
}
```

### String Pool (String Pool)

The String Pool is a special memory area in the JVM used to store string literals and strings after calling the `intern()` method:

```java
// How the string pool works
String s1 = "Hello";  // Creates "Hello" in the string pool
String s2 = "Hello";  // References the existing "Hello" in the pool
String s3 = new String("Hello");  // Creates a new object in the heap
String s4 = s3.intern();  // Returns "Hello" from the pool

System.out.println(s1 == s2);  // true - same object in pool
System.out.println(s1 == s3);  // false - different objects
System.out.println(s1 == s4);  // true - intern() returns pool object

// String pool location changes over Java versions
// Java 6: Permanent Generation (PermGen)
// Java 7+: Heap Memory
```

String pool memory structure illustration:

```
                    ┌──────────────────────────────────────┐
                    │         JVM Heap Memory               │
                    │                                      │
                    │   ┌────────────────────────────┐    │
                    │   │   String Pool              │    │
                    │   │                            │    │
  String s1 ───────────>│  "Hello"  "World"  "Java" │    │
  String s2 ───────────>│                            │    │
                    │   └────────────────────────────┘    │
                    │                                      │
                    │   ┌────────────────────────────┐    │
  String s3 ───────────>│  new String("Hello")       │    │
                    │   │ (Separate heap object)     │    │
                    │   └────────────────────────────┘    │
                    │                                      │
                    └──────────────────────────────────────┘
```

### String Concatenation Principle

The Java compiler and runtime apply multi-level optimizations for string concatenation:

```java
// Compile-time constant folding
String s1 = "Hello" + " " + "World";  // Compiled as "Hello World"

// Runtime concatenation (Java 9+ uses invokedynamic)
String name = "Alice";
String greeting = "Hello, " + name + "!";

// Decompiled similar to:
// String greeting = StringConcatFactory.makeConcatWithConstants(
//     "Hello, ", name, "!");

// Java 8 and earlier use StringBuilder
// StringBuilder sb = new StringBuilder();
// sb.append("Hello, ").append(name).append("!");
// String greeting = sb.toString();
```

## Key Points

### String Class Key Characteristics

| Characteristic | Description |
|---|---|
| Immutability | Cannot be modified after creation, any modification returns a new object |
| String Pool | Literals automatically enter the pool, supports manual entry via intern() |
| Final Class | Cannot be inherited, ensures immutability |
| Interfaces Implemented | Serializable, Comparable, CharSequence |
| Thread Safety | Inherently thread-safe, can be safely shared |
| HashCode Caching | Cached after first calculation, improves hash table performance |

### String Creation Methods

```java
// 1. String literal (recommended)
String s1 = "Hello";

// 2. Using new keyword
String s2 = new String("Hello");

// 3. From character array
char[] chars = {'H', 'e', 'l', 'l', 'o'};
String s3 = new String(chars);
String s4 = new String(chars, 0, 3);  // "Hel"

// 4. From byte array
byte[] bytes = {72, 101, 108, 108, 111};
String s5 = new String(bytes);
String s6 = new String(bytes, StandardCharsets.UTF_8);

// 5. From StringBuilder/StringBuffer
StringBuilder sb = new StringBuilder("Hello");
String s7 = sb.toString();

// 6. String.valueOf()
String s8 = String.valueOf(123);
String s9 = String.valueOf(true);
String s10 = String.valueOf(new char[]{'a', 'b', 'c'});

// 7. String.format()
String s11 = String.format("Hello, %s!", "World");

// 8. String.join() (Java 8+)
String s12 = String.join("-", "2026", "01", "07");  // "2026-01-07"

// 9. Text blocks (Java 15+)
String s13 = """
    Hello,
    World!
    """;
```

### String vs StringBuilder vs StringBuffer

| Characteristic | String | StringBuilder | StringBuffer |
|---|---|---|---|
| Mutability | Immutable | Mutable | Mutable |
| Thread Safe | Yes | No | Yes (synchronized) |
| Performance | Slow concatenation | Fastest | Faster |
| Use Case | Few operations | Single-thread heavy concatenation | Multi-thread heavy concatenation |
| Memory Consumption | Creates new object on modification | Reuses internal array | Reuses internal array |

```java
// Performance comparison example
int iterations = 100000;

// String concatenation (slow)
String s = "";
long start = System.currentTimeMillis();
for (int i = 0; i < iterations; i++) {
    s += "a";  // Creates new object each time
}
System.out.println("String: " + (System.currentTimeMillis() - start) + "ms");

// StringBuilder (fast)
StringBuilder sb = new StringBuilder();
start = System.currentTimeMillis();
for (int i = 0; i < iterations; i++) {
    sb.append("a");  // Reuses internal array
}
String result = sb.toString();
System.out.println("StringBuilder: " + (System.currentTimeMillis() - start) + "ms");

// StringBuffer (thread-safe, slightly slower)
StringBuffer sbf = new StringBuffer();
start = System.currentTimeMillis();
for (int i = 0; i < iterations; i++) {
    sbf.append("a");  // Synchronized method
}
String result2 = sbf.toString();
System.out.println("StringBuffer: " + (System.currentTimeMillis() - start) + "ms");
```

## Code Examples

### Common String Methods

#### Getting Information

```java
String str = "Hello, Java World!";

// Length
int length = str.length();  // 18

// Check for empty string
boolean isEmpty = str.isEmpty();  // false
boolean isBlank = str.isBlank();  // false (Java 11+, checks if all whitespace)

// Get character
char first = str.charAt(0);   // 'H'
char last = str.charAt(str.length() - 1);  // '!'

// Get substring
String sub1 = str.substring(7);      // "Java World!"
String sub2 = str.substring(7, 11);  // "Java"

// Convert to character array
char[] chars = str.toCharArray();

// Get byte array
byte[] bytes = str.getBytes(StandardCharsets.UTF_8);

// Get code points (handle Unicode)
int codePoint = str.codePointAt(0);  // 72 (code point of 'H')
int codePointCount = str.codePointCount(0, str.length());
```

#### Searching and Matching

```java
String text = "Java is a programming language. Java is powerful.";

// Find index
int index1 = text.indexOf("Java");        // 0 (first occurrence)
int index2 = text.indexOf("Java", 1);     // 32 (find from index 1)
int index3 = text.lastIndexOf("Java");    // 32 (last occurrence)
int notFound = text.indexOf("Python");    // -1 (not found)

// Contains check
boolean contains = text.contains("programming");  // true

// Prefix/suffix check
boolean startsWith = text.startsWith("Java");     // true
boolean endsWith = text.endsWith("powerful.");    // true
boolean startsAt = text.startsWith("is", 5);      // true (from index 5)

// Regular expression matching
boolean matches = "abc123".matches("[a-z]+\\d+");  // true

// Region matching
boolean regionMatches = text.regionMatches(
    true,     // ignore case
    0,        // start index in this string
    "JAVA",   // target string
    0,        // start index in target string
    4         // comparison length
);  // true
```

#### Comparison Methods

```java
String s1 = "Hello";
String s2 = "hello";
String s3 = "Hello";
String s4 = new String("Hello");

// equals - compare content
boolean eq1 = s1.equals(s2);        // false (case-sensitive)
boolean eq2 = s1.equals(s3);        // true
boolean eq3 = s1.equals(s4);        // true

// equalsIgnoreCase - case-insensitive comparison
boolean eqIgnore = s1.equalsIgnoreCase(s2);  // true

// == compare references
boolean ref1 = (s1 == s3);  // true (same object in pool)
boolean ref2 = (s1 == s4);  // false (different objects)

// compareTo - lexicographic comparison
int cmp1 = s1.compareTo(s2);         // -32 ('H' - 'h')
int cmp2 = "abc".compareTo("abd");   // -1 ('c' - 'd')
int cmp3 = "abc".compareTo("abc");   // 0

// compareToIgnoreCase - case-insensitive lexicographic comparison
int cmpIgnore = s1.compareToIgnoreCase(s2);  // 0

// contentEquals - compare with CharSequence
StringBuilder sb = new StringBuilder("Hello");
boolean contentEq = s1.contentEquals(sb);  // true
```

#### Conversion Methods

```java
String str = "  Hello, World!  ";

// Case conversion
String upper = str.toUpperCase();        // "  HELLO, WORLD!  "
String lower = str.toLowerCase();        // "  hello, world!  "
String upperLocale = str.toUpperCase(Locale.ENGLISH);

// Whitespace removal
String trimmed = str.trim();             // "Hello, World!"
String stripped = str.strip();           // "Hello, World!" (Java 11+)
String stripLeading = str.stripLeading();    // "Hello, World!  "
String stripTrailing = str.stripTrailing();  // "  Hello, World!"

// Replacement
String replaced1 = str.replace("World", "Java");       // "  Hello, Java!  "
String replaced2 = str.replace('o', '0');              // "  Hell0, W0rld!  "
String replaced3 = str.replaceAll("\\s+", " ");        // " Hello, World! "
String replaced4 = str.replaceFirst("\\s+", "");       // "Hello, World!  "

// Splitting
String csv = "apple,banana,orange";
String[] fruits = csv.split(",");                // ["apple", "banana", "orange"]
String[] limited = csv.split(",", 2);            // ["apple", "banana,orange"]
String path = "a.b.c.d";
String[] parts = path.split("\\.");              // ["a", "b", "c", "d"]

// Joining
String joined = String.join("-", "a", "b", "c");     // "a-b-c"
String joined2 = String.join(", ", fruits);          // "apple, banana, orange"

// Repeat (Java 11+)
String repeated = "ab".repeat(3);            // "ababab"

// Indentation (Java 12+)
String indented = "Hello\nWorld".indent(4);  // "    Hello\n    World\n"
String stripIndent = """
    Hello
    World
    """.stripIndent();  // removes common leading whitespace
```

#### Formatting

```java
// String.format()
String name = "Alice";
int age = 25;
double score = 95.5;

String formatted = String.format("Name: %s, Age: %d, Score: %.2f", name, age, score);
// "Name: Alice, Age: 25, Score: 95.50"

// Format specifiers
String s1 = String.format("%s", "text");              // string
String s2 = String.format("%d", 42);                  // decimal integer
String s3 = String.format("%x", 255);                 // hexadecimal: ff
String s4 = String.format("%o", 8);                   // octal: 10
String s5 = String.format("%f", 3.14);                // float: 3.140000
String s6 = String.format("%.2f", 3.14159);           // keep 2 decimals: 3.14
String s7 = String.format("%e", 123456.789);          // scientific: 1.234568e+05
String s8 = String.format("%10d", 42);                // right-aligned width 10: "        42"
String s9 = String.format("%-10d", 42);               // left-aligned width 10: "42        "
String s10 = String.format("%010d", 42);              // zero-padded: "0000000042"
String s11 = String.format("%+d", 42);                // show plus sign: +42
String s12 = String.format("%,d", 1000000);           // thousands separator: 1,000,000
String s13 = String.format("%b", true);               // boolean: true
String s14 = String.format("%c", 'A');                // character: A
String s15 = String.format("%n");                     // newline
String s16 = String.format("%%");                     // percent sign: %

// Argument indexing
String s17 = String.format("%2$s %1$s", "World", "Hello");  // "Hello World"

// formatted() method (Java 15+)
String result = "Name: %s".formatted(name);  // "Name: Alice"
```

### StringBuilder Details

```java
// Create StringBuilder
StringBuilder sb1 = new StringBuilder();           // default capacity 16
StringBuilder sb2 = new StringBuilder(100);        // specify initial capacity
StringBuilder sb3 = new StringBuilder("Hello");    // create from string

// Append operations
sb1.append("Hello");
sb1.append(' ');
sb1.append("World");
sb1.append(123);
sb1.append(true);
// sb1 = "Hello World123true"

// Method chaining
StringBuilder sb = new StringBuilder()
    .append("Name: ")
    .append("Alice")
    .append(", Age: ")
    .append(25);

// Insert operations
sb1.insert(5, ",");        // "Hello, World123true"
sb1.insert(0, ">>> ");     // ">>> Hello, World123true"

// Delete operations
sb1.delete(0, 4);          // delete index 0-3
sb1.deleteCharAt(5);       // delete character at index 5

// Replace operations
sb1.replace(0, 5, "Hi");   // replace index 0-4 with "Hi"

// Reverse
sb1.reverse();

// Set length
sb1.setLength(10);         // truncate or pad with '\0'

// Set character
sb1.setCharAt(0, 'X');

// Get capacity
int capacity = sb1.capacity();
int length = sb1.length();

// Ensure capacity
sb1.ensureCapacity(100);

// Trim capacity to current length
sb1.trimToSize();

// Convert to String
String result = sb1.toString();

// Get substring
String sub = sb1.substring(0, 5);
CharSequence cs = sb1.subSequence(0, 5);
```

### StringBuffer Details

```java
// StringBuffer has the same API as StringBuilder, but all methods are synchronized
StringBuffer sbf = new StringBuffer();

// Thread-safe operations
sbf.append("Thread-safe ");
sbf.append("operations");

// Use in multi-threaded environment
class StringBufferExample {
    private StringBuffer buffer = new StringBuffer();

    public void appendData(String data) {
        // Calling this method from multiple threads is safe
        buffer.append(data);
    }

    public String getData() {
        return buffer.toString();
    }
}

// In modern Java development, StringBuilder is preferred
// When thread safety is needed, use explicit synchronization or other concurrency utilities
```

### String and Other Type Conversion

```java
// Primitive types to String
String s1 = String.valueOf(123);         // "123"
String s2 = String.valueOf(3.14);        // "3.14"
String s3 = String.valueOf(true);        // "true"
String s4 = String.valueOf('A');         // "A"
String s5 = Integer.toString(123);       // "123"
String s6 = Double.toString(3.14);       // "3.14"
String s7 = "" + 123;                    // "123" (not recommended)

// String to primitive types
int i1 = Integer.parseInt("123");        // 123
int i2 = Integer.valueOf("123");         // 123 (returns Integer object)
double d1 = Double.parseDouble("3.14");  // 3.14
boolean b1 = Boolean.parseBoolean("true");  // true
long l1 = Long.parseLong("123456789");   // 123456789L

// Specify radix
int hex = Integer.parseInt("FF", 16);    // 255
int bin = Integer.parseInt("1010", 2);   // 10
int oct = Integer.parseInt("17", 8);     // 15

// Handle parsing exceptions
try {
    int value = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("Cannot parse as integer");
}

// Character array conversion
char[] chars = "Hello".toCharArray();
String fromChars = new String(chars);
String fromChars2 = String.valueOf(chars);
String partial = new String(chars, 0, 3);  // "Hel"

// Byte array conversion
byte[] bytes = "Hello".getBytes(StandardCharsets.UTF_8);
String fromBytes = new String(bytes, StandardCharsets.UTF_8);
```

## Best Practices

### String Comparison

```java
// Correct: use equals() to compare content
String s1 = "Hello";
String s2 = new String("Hello");
if (s1.equals(s2)) {
    System.out.println("Content is equal");
}

// Wrong: use == to compare references
if (s1 == s2) {  // may return false
    System.out.println("This is unreliable");
}

// Prevent NullPointerException
String str = getUserInput();  // may be null

// Method 1: constant first
if ("expected".equals(str)) {
    // Won't throw exception even if str is null
}

// Method 2: Objects.equals()
if (Objects.equals(str, "expected")) {
    // null-safe comparison
}

// Method 3: null check first
if (str != null && str.equals("expected")) {
    // explicit null check
}
```

### String Concatenation

```java
// Few concatenations: use + operator directly
String fullName = firstName + " " + lastName;

// Concatenation in loops: use StringBuilder
StringBuilder sb = new StringBuilder();
for (String item : items) {
    sb.append(item).append(", ");
}
String result = sb.toString();

// Join collection elements: use String.join() or Collectors.joining()
List<String> list = Arrays.asList("a", "b", "c");
String joined = String.join(", ", list);  // "a, b, c"

// Join with Stream API
String collected = list.stream()
    .collect(Collectors.joining(", ", "[", "]"));  // "[a, b, c]"

// Pre-allocate capacity to reduce resizing
StringBuilder sb2 = new StringBuilder(items.size() * 20);
```

### String Constants

```java
// Use constants for frequently used strings
public class Constants {
    public static final String ERROR_MESSAGE = "An error occurred";
    public static final String SUCCESS_MESSAGE = "Operation successful";
    public static final String DATE_FORMAT = "yyyy-MM-dd";
}

// Use enum for related strings
public enum Status {
    PENDING("Pending"),
    APPROVED("Approved"),
    REJECTED("Rejected");

    private final String displayName;

    Status(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
```

### String Processing Utility Methods

```java
public class StringUtils {

    // Check if null or blank
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    // Check if not blank
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    // Safe trim
    public static String safeTrim(String str) {
        return str == null ? null : str.trim();
    }

    // Default value handling
    public static String defaultIfBlank(String str, String defaultValue) {
        return isBlank(str) ? defaultValue : str;
    }

    // Capitalize first letter
    public static String capitalize(String str) {
        if (isBlank(str)) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    // Truncate string
    public static String truncate(String str, int maxLength, String suffix) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - suffix.length()) + suffix;
    }

    // Safe substring
    public static String safeSubstring(String str, int start, int end) {
        if (str == null) {
            return null;
        }
        int len = str.length();
        start = Math.max(0, start);
        end = Math.min(len, end);
        if (start > end) {
            return "";
        }
        return str.substring(start, end);
    }
}
```

## Common Pitfalls

### String Comparison Pitfalls

```java
// Pitfall 1: using == to compare string content
String s1 = "Hello";
String s2 = new String("Hello");
System.out.println(s1 == s2);      // false - different objects!
System.out.println(s1.equals(s2)); // true - correct way

// Pitfall 2: ignoring case sensitivity
String userInput = "YES";
if (userInput.equals("yes")) {      // false
    // never executes
}
// Correct approach
if (userInput.equalsIgnoreCase("yes")) {
    // handles correctly
}

// Pitfall 3: null handling
String str = null;
// str.equals("test")  // NullPointerException!
"test".equals(str);    // false, no exception
Objects.equals(str, "test");  // false, null-safe
```

### String Immutability Pitfalls

```java
// Pitfall: thinking you modified the original string
String str = "Hello";
str.toUpperCase();  // returns new string, original unchanged
System.out.println(str);  // still "Hello"

// Correct approach
str = str.toUpperCase();
System.out.println(str);  // "HELLO"

// Pitfall: heavy concatenation in loops
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i;  // creates new object each time, very inefficient!
}

// Correct approach
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);
}
String result2 = sb.toString();
```

### String Pool Pitfalls

```java
// Pitfall: excessive use of intern()
for (int i = 0; i < 1000000; i++) {
    String s = ("str" + i).intern();  // may cause memory issues
}

// intern() should be used carefully only when:
// 1. You're certain there will be many duplicate strings
// 2. These strings will persist for a long time
// 3. Memory optimization is a high priority

// Pitfall: assuming new String() always creates new object
String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");
String s4 = new String("Hello").intern();

System.out.println(s1 == s2);  // true
System.out.println(s1 == s3);  // false
System.out.println(s1 == s4);  // true - intern() returns pool object
```

### Encoding Pitfalls

```java
// Pitfall: not specifying encoding
String str = "Chinese";
byte[] bytes1 = str.getBytes();  // uses platform default encoding, not portable!

// Correct approach: explicitly specify encoding
byte[] bytes2 = str.getBytes(StandardCharsets.UTF_8);
String decoded = new String(bytes2, StandardCharsets.UTF_8);

// Pitfall: file read/write without specifying encoding
// Files.readString(path);  // uses UTF-8, but watch file's actual encoding
Files.readString(path, StandardCharsets.UTF_8);

// Pitfall: URL encoding
String url = "https://example.com?name=Chinese";
// needs URL encoding
String encoded = URLEncoder.encode("Chinese", StandardCharsets.UTF_8);
```

### Regular Expression Pitfalls

```java
// Pitfall: unescaped special characters
String str = "a.b.c";
String[] parts1 = str.split(".");  // wrong! "." is regex wildcard
// parts1 = [] (empty array)

String[] parts2 = str.split("\\.");  // correct
// parts2 = ["a", "b", "c"]

// Pitfall: recompiling regex repeatedly
for (String line : lines) {
    if (line.matches("\\d+")) {  // recompiles regex each time, inefficient
        // ...
    }
}

// Correct approach: precompile regex
Pattern pattern = Pattern.compile("\\d+");
for (String line : lines) {
    if (pattern.matcher(line).matches()) {  // reuses compiled regex
        // ...
    }
}
```

### Substring Pitfalls

```java
// Historical pitfall (Java 6 and earlier)
// substring returned new string sharing original's char[] array
// This could cause memory leaks
String largeString = loadHugeFile();
String small = largeString.substring(0, 10);
largeString = null;
// In Java 6, small still held reference to entire large string!

// Java 7+ fixed it, substring copies needed characters
// But understanding history helps understand legacy code

// Pitfall: index out of bounds
String str = "Hello";
// str.substring(10);  // StringIndexOutOfBoundsException
// str.charAt(10);     // StringIndexOutOfBoundsException

// Safe approach: check length first
if (str.length() > 10) {
    String sub = str.substring(0, 10);
}
```

## Performance Considerations

### String Concatenation Performance

```java
// Test performance of different concatenation methods
public class StringConcatPerformance {
    private static final int ITERATIONS = 100000;

    public static void main(String[] args) {
        // Method 1: String + operator
        long start = System.nanoTime();
        String s = "";
        for (int i = 0; i < ITERATIONS; i++) {
            s += "a";
        }
        System.out.printf("String +: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // approximately 5000+ ms (very slow)

        // Method 2: StringBuilder
        start = System.nanoTime();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ITERATIONS; i++) {
            sb.append("a");
        }
        String result = sb.toString();
        System.out.printf("StringBuilder: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // approximately 2-5 ms

        // Method 3: StringBuilder with pre-allocated capacity
        start = System.nanoTime();
        StringBuilder sb2 = new StringBuilder(ITERATIONS);
        for (int i = 0; i < ITERATIONS; i++) {
            sb2.append("a");
        }
        String result2 = sb2.toString();
        System.out.printf("StringBuilder (pre-allocated): %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // approximately 1-3 ms (fastest)

        // Method 4: StringBuffer
        start = System.nanoTime();
        StringBuffer sbf = new StringBuffer();
        for (int i = 0; i < ITERATIONS; i++) {
            sbf.append("a");
        }
        String result3 = sbf.toString();
        System.out.printf("StringBuffer: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // approximately 3-8 ms (synchronization overhead)
    }
}
```

### String Pool and intern() Performance

```java
// Use cases and performance impact of intern()
public class InternPerformance {

    // Scenario: many duplicate strings
    public static void main(String[] args) {
        List<String> withoutIntern = new ArrayList<>();
        List<String> withIntern = new ArrayList<>();

        // Simulate many duplicate strings
        String[] cities = {"Beijing", "Shanghai", "Guangzhou", "Shenzhen"};
        Random random = new Random();

        long start = System.nanoTime();
        for (int i = 0; i < 1000000; i++) {
            String city = new String(cities[random.nextInt(4)]);
            withoutIntern.add(city);
        }
        System.out.printf("Without intern: %.2f ms, estimated size: %d%n",
            (System.nanoTime() - start) / 1_000_000.0,
            withoutIntern.size() * 50);  // rough estimate

        start = System.nanoTime();
        for (int i = 0; i < 1000000; i++) {
            String city = new String(cities[random.nextInt(4)]).intern();
            withIntern.add(city);
        }
        System.out.printf("With intern: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);

        // intern() increases processing time but reduces memory usage
        // Suitable for: many duplicates, long-lived strings
    }
}
```

### String Operation Optimization

```java
public class StringOptimization {

    // Optimization 1: avoid creating unnecessary strings
    // Bad
    public boolean containsIgnoreCaseBad(String str, String search) {
        return str.toLowerCase().contains(search.toLowerCase());
        // creates two new strings each call
    }

    // Better
    public boolean containsIgnoreCaseGood(String str, String search) {
        int searchLen = search.length();
        int max = str.length() - searchLen;
        for (int i = 0; i <= max; i++) {
            if (str.regionMatches(true, i, search, 0, searchLen)) {
                return true;
            }
        }
        return false;
    }

    // Optimization 2: use charAt() instead of substring(i, i+1)
    // Bad
    public void processCharsBad(String str) {
        for (int i = 0; i < str.length(); i++) {
            String ch = str.substring(i, i + 1);  // creates new string
            // process
        }
    }

    // Better
    public void processCharsGood(String str) {
        for (int i = 0; i < str.length(); i++) {
            char ch = str.charAt(i);  // doesn't create new object
            // process
        }
    }

    // Optimization 3: precompile regular expressions
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    public boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    // Optimization 4: use isEmpty() instead of length() == 0
    public boolean isEmptyGood(String str) {
        return str == null || str.isEmpty();
    }

    // Optimization 5: use StringJoiner or String.join()
    public String joinWithDelimiter(List<String> items, String delimiter) {
        return String.join(delimiter, items);
        // or
        // StringJoiner joiner = new StringJoiner(delimiter);
        // items.forEach(joiner::add);
        // return joiner.toString();
    }
}
```

### Memory Optimization Recommendations

```java
// 1. Use string literals instead of new String()
String good = "Hello";        // uses string pool
String bad = new String("Hello");  // creates extra heap object

// 2. Consider intern() for many duplicate strings
// But be aware intern() has overhead and pool has size limit

// 3. Use Stream for large text processing
Files.lines(path, StandardCharsets.UTF_8)
    .filter(line -> line.contains("keyword"))
    .forEach(System.out::println);

// 4. Use CharSequence parameter type for flexibility
public void process(CharSequence text) {
    // Can accept String, StringBuilder, StringBuffer etc.
}

// 5. Java 11+ uses more efficient string methods
String repeated = "ab".repeat(100);       // more efficient than loop concatenation
boolean isBlank = str.isBlank();          // more efficient than trim().isEmpty()
String[] lines = str.lines().toArray(String[]::new);  // streaming line processing
```

## Real-World Scenarios

### Scenario One: Building Log Messages

```java
public class LogMessageBuilder {

    // Use StringBuilder to build complex log messages
    public String buildLogMessage(String level, String message,
                                  Map<String, Object> context) {
        StringBuilder sb = new StringBuilder(256);

        sb.append("[")
          .append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
          .append("] ")
          .append("[").append(level).append("] ")
          .append(message);

        if (context != null && !context.isEmpty()) {
            sb.append(" | Context: {");
            boolean first = true;
            for (Map.Entry<String, Object> entry : context.entrySet()) {
                if (!first) {
                    sb.append(", ");
                }
                sb.append(entry.getKey())
                  .append("=")
                  .append(entry.getValue());
                first = false;
            }
            sb.append("}");
        }

        return sb.toString();
    }

    // Simple version using String.format
    public String buildSimpleLog(String level, String format, Object... args) {
        return String.format("[%s] [%s] %s",
            LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            level,
            String.format(format, args));
    }
}
```

### Scenario Two: Simple Template Engine

```java
public class SimpleTemplateEngine {

    private static final Pattern PLACEHOLDER_PATTERN =
        Pattern.compile("\\$\\{([^}]+)\\}");

    // Simple template replacement
    public String render(String template, Map<String, Object> variables) {
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        StringBuilder result = new StringBuilder();

        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = variables.getOrDefault(key, "");
            matcher.appendReplacement(result,
                Matcher.quoteReplacement(String.valueOf(value)));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    // Usage example
    public static void main(String[] args) {
        SimpleTemplateEngine engine = new SimpleTemplateEngine();

        String template = "Hello, ${name}! You have ${count} new messages.";
        Map<String, Object> vars = Map.of(
            "name", "Alice",
            "count", 5
        );

        String result = engine.render(template, vars);
        // "Hello, Alice! You have 5 new messages."
        System.out.println(result);
    }
}
```

### Scenario Three: CSV Parsing and Generation

```java
public class CsvUtils {

    // CSV parsing
    public List<String[]> parseCsv(String content, String delimiter) {
        List<String[]> result = new ArrayList<>();
        String[] lines = content.split("\n");

        for (String line : lines) {
            if (!line.trim().isEmpty()) {
                result.add(parseCsvLine(line, delimiter));
            }
        }

        return result;
    }

    private String[] parseCsvLine(String line, String delimiter) {
        // Simplified version, doesn't handle delimiters within quotes
        return line.split(Pattern.quote(delimiter));
    }

    // CSV generation
    public String generateCsv(List<String[]> data, String delimiter) {
        StringBuilder sb = new StringBuilder();

        for (String[] row : data) {
            StringJoiner joiner = new StringJoiner(delimiter);
            for (String cell : row) {
                joiner.add(escapeCsvCell(cell, delimiter));
            }
            sb.append(joiner.toString()).append("\n");
        }

        return sb.toString();
    }

    private String escapeCsvCell(String cell, String delimiter) {
        if (cell == null) {
            return "";
        }

        // Surround with quotes if contains special characters
        if (cell.contains(delimiter) || cell.contains("\"") ||
            cell.contains("\n") || cell.contains("\r")) {
            return "\"" + cell.replace("\"", "\"\"") + "\"";
        }

        return cell;
    }
}
```

### Scenario Four: URL Builder

```java
public class UrlBuilder {
    private String baseUrl;
    private Map<String, String> queryParams = new LinkedHashMap<>();
    private String fragment;

    public UrlBuilder(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public UrlBuilder addQueryParam(String key, String value) {
        queryParams.put(key, value);
        return this;
    }

    public UrlBuilder addQueryParam(String key, int value) {
        return addQueryParam(key, String.valueOf(value));
    }

    public UrlBuilder setFragment(String fragment) {
        this.fragment = fragment;
        return this;
    }

    public String build() {
        StringBuilder url = new StringBuilder(baseUrl);

        if (!queryParams.isEmpty()) {
            url.append("?");
            StringJoiner joiner = new StringJoiner("&");
            for (Map.Entry<String, String> entry : queryParams.entrySet()) {
                joiner.add(encodeParam(entry.getKey()) + "=" +
                          encodeParam(entry.getValue()));
            }
            url.append(joiner.toString());
        }

        if (fragment != null && !fragment.isEmpty()) {
            url.append("#").append(fragment);
        }

        return url.toString();
    }

    private String encodeParam(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // Usage example
    public static void main(String[] args) {
        String url = new UrlBuilder("https://api.example.com/search")
            .addQueryParam("q", "Java String")
            .addQueryParam("page", 1)
            .addQueryParam("limit", 20)
            .setFragment("results")
            .build();

        System.out.println(url);
        // https://api.example.com/search?q=Java+String&page=1&limit=20#results
    }
}
```

### Scenario Five: Text Processing Utilities

```java
public class TextProcessor {

    // Convert camelCase to snake_case
    public String camelToSnake(String camelCase) {
        if (camelCase == null || camelCase.isEmpty()) {
            return camelCase;
        }

        StringBuilder result = new StringBuilder();
        for (int i = 0; i < camelCase.length(); i++) {
            char c = camelCase.charAt(i);
            if (Character.isUpperCase(c)) {
                if (i > 0) {
                    result.append('_');
                }
                result.append(Character.toLowerCase(c));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    // Convert snake_case to camelCase
    public String snakeToCamel(String snakeCase) {
        if (snakeCase == null || snakeCase.isEmpty()) {
            return snakeCase;
        }

        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = false;

        for (int i = 0; i < snakeCase.length(); i++) {
            char c = snakeCase.charAt(i);
            if (c == '_') {
                capitalizeNext = true;
            } else {
                if (capitalizeNext) {
                    result.append(Character.toUpperCase(c));
                    capitalizeNext = false;
                } else {
                    result.append(c);
                }
            }
        }
        return result.toString();
    }

    // Extract numbers from string
    public List<Integer> extractNumbers(String text) {
        List<Integer> numbers = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\d+");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            numbers.add(Integer.parseInt(matcher.group()));
        }

        return numbers;
    }

    // Calculate word frequency
    public Map<String, Long> wordFrequency(String text) {
        return Arrays.stream(text.toLowerCase().split("\\W+"))
            .filter(word -> !word.isEmpty())
            .collect(Collectors.groupingBy(
                Function.identity(),
                Collectors.counting()
            ));
    }

    // Truncate text and add ellipsis
    public String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }

        // Try to truncate at word boundary
        int lastSpace = text.lastIndexOf(' ', maxLength - 3);
        if (lastSpace > maxLength * 0.7) {
            return text.substring(0, lastSpace) + "...";
        }

        return text.substring(0, maxLength - 3) + "...";
    }
}
```

## Interview Key Points

### Basic Concepts

**Q1: Why is String immutable? What are the benefits?**

String immutability implementation mechanism:
1. `String` class is declared as `final` and cannot be inherited
2. Internal `char[]` (Java 9+ uses `byte[]`) is declared as `private final`
3. No methods provided to modify the internal array

Benefits of immutability:
- **Thread Safety**: Immutable objects can be safely shared among threads
- **String Pool**: Identical content strings can be reused
- **Security**: Cannot be modified when passed as parameters
- **Hash Caching**: hashCode can be cached, improving hash table performance

```java
// Example: hashCode caching
String key = "important_key";
int hash = key.hashCode();  // calculated first time
int hash2 = key.hashCode(); // returns cached value
```

**Q2: Differences between String, StringBuilder, and StringBuffer?**

| Characteristic | String | StringBuilder | StringBuffer |
|---|---|---|---|
| Mutability | Immutable | Mutable | Mutable |
| Thread Safe | Yes (immutable) | No | Yes (synchronized) |
| Performance | Slow concatenation | Fastest | Faster |
| Use Case | Few operations | Single-thread heavy concat | Multi-thread heavy concat |

**Q3: What is the string pool? How many objects does new String("abc") create?**

The String Pool is a special area in JVM storing string literals, located in heap memory (Java 7+).

```java
String s = new String("abc");
// Creates 1 or 2 objects:
// 1. If "abc" doesn't exist in pool, creates one in the pool
// 2. Creates a new String object in heap
// Result: 2 objects first time, 1 object afterwards
```

**Q4: What's the difference between String.equals() and ==?**

```java
String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");

// == compares references (memory addresses)
s1 == s2  // true - same object in pool
s1 == s3  // false - different objects

// equals() compares content
s1.equals(s2)  // true
s1.equals(s3)  // true
```

**Q5: What does the intern() method do?**

The `intern()` method checks the string pool:
- Returns pool reference if equal string exists
- Adds string to pool and returns reference if not exists

```java
String s1 = new String("hello");  // heap object
String s2 = s1.intern();          // pool object
String s3 = "hello";              // pool object

System.out.println(s2 == s3);     // true
System.out.println(s1 == s2);     // false
```

### Advanced Topics

**Q6: How to efficiently concatenate many strings?**

```java
// Solution 1: StringBuilder (single-thread)
StringBuilder sb = new StringBuilder(expectedLength);
for (String s : strings) {
    sb.append(s);
}
String result = sb.toString();

// Solution 2: String.join() (Java 8+)
String result = String.join(delimiter, strings);

// Solution 3: Collectors.joining() (Stream API)
String result = list.stream()
    .collect(Collectors.joining(", "));
```

**Q7: What changed in String internal implementation in Java 9?**

Java 9 introduced Compact Strings:
- Uses `byte[]` instead of `char[]`
- Added `coder` field to indicate encoding (LATIN1 or UTF16)
- ASCII-only strings use half the memory

```java
// Java 8
private final char[] value;  // 2 bytes per character

// Java 9+
private final byte[] value;  // 1 byte (LATIN1) or 2 bytes (UTF16)
private final byte coder;    // 0 = LATIN1, 1 = UTF16
```

**Q8: How is string concatenation optimized at compile-time and runtime?**

```java
// Compile-time constant folding
String s = "Hello" + " " + "World";  // compiled as "Hello World"

// Java 9+ runtime uses invokedynamic
String name = "Alice";
String greeting = "Hello, " + name + "!";
// compiled to call StringConcatFactory.makeConcatWithConstants

// Loop concatenation is not auto-optimized
String result = "";
for (int i = 0; i < n; i++) {
    result += i;  // still inefficient, should use StringBuilder
}
```

### Coding Implementation Questions

**Q9: Implement string reversal**

```java
// Method 1: StringBuilder
public String reverse(String s) {
    return new StringBuilder(s).reverse().toString();
}

// Method 2: Character array
public String reverseManual(String s) {
    char[] chars = s.toCharArray();
    int left = 0, right = chars.length - 1;
    while (left < right) {
        char temp = chars[left];
        chars[left] = chars[right];
        chars[right] = temp;
        left++;
        right--;
    }
    return new String(chars);
}

// Method 3: Recursive
public String reverseRecursive(String s) {
    if (s.length() <= 1) return s;
    return reverseRecursive(s.substring(1)) + s.charAt(0);
}
```

**Q10: Check if two strings are anagrams**

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;

    // Method 1: Sort and compare
    char[] sChars = s.toCharArray();
    char[] tChars = t.toCharArray();
    Arrays.sort(sChars);
    Arrays.sort(tChars);
    return Arrays.equals(sChars, tChars);
}

public boolean isAnagramOptimized(String s, String t) {
    if (s.length() != t.length()) return false;

    // Method 2: Character counting
    int[] count = new int[26];
    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }
    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
```

**Q11: Implement KMP string matching algorithm**

```java
public class KMPSearch {

    // Build partial match table (prefix function)
    private int[] buildPrefixTable(String pattern) {
        int[] table = new int[pattern.length()];
        int j = 0;

        for (int i = 1; i < pattern.length(); i++) {
            while (j > 0 && pattern.charAt(i) != pattern.charAt(j)) {
                j = table[j - 1];
            }
            if (pattern.charAt(i) == pattern.charAt(j)) {
                j++;
            }
            table[i] = j;
        }

        return table;
    }

    // KMP search
    public int search(String text, String pattern) {
        if (pattern.isEmpty()) return 0;

        int[] table = buildPrefixTable(pattern);
        int j = 0;

        for (int i = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != pattern.charAt(j)) {
                j = table[j - 1];
            }
            if (text.charAt(i) == pattern.charAt(j)) {
                j++;
            }
            if (j == pattern.length()) {
                return i - pattern.length() + 1;  // found match
            }
        }

        return -1;  // not found
    }
}
```

## Further Reading

### Official Documentation

- [Java String API Documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [StringBuilder API Documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html)
- [StringBuffer API Documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html)
- [JEP 254: Compact Strings](https://openjdk.org/jeps/254) - Compact Strings proposal

### Related Topics

- **Regular Expressions**: `java.util.regex` package provides powerful pattern matching
- **Character Encoding**: `java.nio.charset` package handles various character encodings
- **Text Processing**: `java.text` package provides formatting and parsing functionality
- **Unicode Support**: `Character` class provides Unicode-related operations

### Advanced Reading

- *Effective Java* Item 63: Beware the performance of string concatenation
- *Java Performance: The Definitive Guide* - String operation optimization chapter
- [JVM String Constant Pool Explained](https://www.baeldung.com/java-string-pool)
- [Deep Analysis of Java String Immutability](https://www.baeldung.com/java-string-immutable)

### Utility Libraries

- **Apache Commons Lang**: `StringUtils` provides rich string utility methods
- **Guava**: `Strings`, `CharMatcher`, `Splitter`, `Joiner` and other utility classes
- **Apache Commons Text**: More text processing tools like similarity calculation, escaping etc.

```java
// Apache Commons Lang example
import org.apache.commons.lang3.StringUtils;

StringUtils.isBlank(str);
StringUtils.capitalize(str);
StringUtils.abbreviate(str, 10);
StringUtils.leftPad(str, 10, '0');

// Guava example
import com.google.common.base.Strings;
import com.google.common.base.Splitter;

Strings.isNullOrEmpty(str);
Strings.padStart(str, 10, '0');
Splitter.on(',').trimResults().split("a, b, c");
```

---

> We covered Java String class core concepts, implementation principles, and best practices in depth. Understanding string immutability, the string pool mechanism, and proper usage of StringBuilder/StringBuffer is fundamental to writing efficient Java code. Readers are encouraged to practice with actual code to solidify these knowledge points.
