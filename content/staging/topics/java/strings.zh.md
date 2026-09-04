---
title: Java String 字符串详解
description: 深入理解 Java String 类的不可变性、字符串池、StringBuilder/StringBuffer、常用方法与格式化
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - String
  - 字符串
  - StringBuilder
  - StringBuffer
  - 字符串池
status: imported
origin: old/src/content/docs/java/strings.zh.md
divergence: 0.216
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Java
  subcategory: 语言基础
  order: 2
  lastUpdated: 2026-01-07
---

## 概念解释

String（字符串）是 Java 中最常用的类之一，用于表示和操作文本数据。在 Java 中，字符串是对象而非基本数据类型，由 `java.lang.String` 类定义。

### 什么是 String

String 是 Java 中表示字符序列的不可变对象。每个字符串都是 `String` 类的实例，一旦创建就不能被修改。这种设计决策带来了线程安全性、缓存效率和安全性等多方面的优势。

```java
// String 是一个类，字符串是对象
String greeting = "Hello, World!";  // 字符串字面量
String name = new String("Alice");  // 使用构造函数创建

// String 类的继承关系
// java.lang.Object
//     └── java.lang.String (实现了 Serializable, Comparable<String>, CharSequence)
```

### 历史背景

Java 从 1.0 版本开始就将 String 设计为不可变类，这是 James Gosling 等设计者深思熟虑的结果。不可变性使得字符串可以安全地在多线程环境中共享，同时支持字符串池（String Pool）机制来优化内存使用。

### 解决的问题

- **内存优化**：通过字符串池复用相同的字符串对象
- **线程安全**：不可变对象天然线程安全
- **安全性**：作为类加载、网络连接等关键参数时不会被意外修改
- **哈希缓存**：String 的 hashCode 可以被缓存，提高 HashMap 等集合的性能

## 核心原理

### String 的内部实现

在 Java 9 之前，String 内部使用 `char[]` 数组存储字符数据。从 Java 9 开始，采用紧凑字符串（Compact Strings）优化，使用 `byte[]` 数组配合编码标志来存储：

```java
// Java 8 及之前的实现
public final class String {
    private final char[] value;  // 每个字符占用 2 字节
    private int hash;
}

// Java 9+ 的实现（紧凑字符串）
public final class String {
    private final byte[] value;   // 每个字符可能占用 1 或 2 字节
    private final byte coder;     // 编码标志：LATIN1(0) 或 UTF16(1)
    private int hash;
    private boolean hashIsZero;   // Java 14+ 缓存 0 值 hashCode
}
```

### 不可变性原理

String 的不可变性通过以下机制保证：

```java
public final class String {
    // 1. 类被声明为 final，不能被继承

    // 2. 字符数组被声明为 private final
    private final byte[] value;

    // 3. 没有提供修改内部数组的方法
    // 所有看似修改的方法都返回新的 String 对象

    public String concat(String str) {
        // 不修改原字符串，而是创建并返回新对象
        if (str.isEmpty()) {
            return this;
        }
        return StringConcatHelper.simpleConcat(this, str);
    }

    public String substring(int beginIndex) {
        // 同样返回新对象
        return substring(beginIndex, length());
    }
}
```

### 字符串池（String Pool）

字符串池是 JVM 中的一块特殊内存区域，用于存储字符串字面量和调用 `intern()` 方法后的字符串：

```java
// 字符串池的工作机制
String s1 = "Hello";  // 在字符串池中创建 "Hello"
String s2 = "Hello";  // 直接引用池中已存在的 "Hello"
String s3 = new String("Hello");  // 在堆中创建新对象
String s4 = s3.intern();  // 返回池中的 "Hello"

System.out.println(s1 == s2);  // true - 同一个池中对象
System.out.println(s1 == s3);  // false - 不同对象
System.out.println(s1 == s4);  // true - intern() 返回池中对象

// 字符串池位置的变化
// Java 6: 永久代（PermGen）
// Java 7+: 堆内存（Heap）
```

字符串池的内存结构示意：

```
                    ┌──────────────────────────────────────┐
                    │              JVM 堆内存               │
                    │                                      │
                    │   ┌────────────────────────────┐    │
                    │   │     String Pool（字符串池）  │    │
                    │   │                            │    │
  String s1 ───────────>│  "Hello"  "World"  "Java" │    │
  String s2 ───────────>│                            │    │
                    │   └────────────────────────────┘    │
                    │                                      │
                    │   ┌────────────────────────────┐    │
  String s3 ───────────>│    new String("Hello")     │    │
                    │   │      （独立的堆对象）         │    │
                    │   └────────────────────────────┘    │
                    │                                      │
                    └──────────────────────────────────────┘
```

### 字符串拼接原理

Java 编译器和运行时对字符串拼接进行了多层优化：

```java
// 编译时常量折叠
String s1 = "Hello" + " " + "World";  // 编译为 "Hello World"

// 运行时拼接（Java 9+ 使用 invokedynamic）
String name = "Alice";
String greeting = "Hello, " + name + "!";

// 反编译后类似于：
// String greeting = StringConcatFactory.makeConcatWithConstants(
//     "Hello, ", name, "!");

// Java 8 及之前使用 StringBuilder
// StringBuilder sb = new StringBuilder();
// sb.append("Hello, ").append(name).append("!");
// String greeting = sb.toString();
```

## 核心要点

### String 类的关键特性

| 特性 | 说明 |
|------|------|
| 不可变性 | 创建后不能修改，任何修改操作返回新对象 |
| 字符串池 | 字面量自动进入池中，支持 intern() 手动入池 |
| final 类 | 不能被继承，保证不可变性 |
| 实现接口 | Serializable, Comparable, CharSequence |
| 线程安全 | 天然线程安全，可安全共享 |
| hashCode 缓存 | 首次计算后缓存，提高哈希表性能 |

### 创建字符串的方式

```java
// 1. 字符串字面量（推荐）
String s1 = "Hello";

// 2. new 关键字
String s2 = new String("Hello");

// 3. 字符数组
char[] chars = {'H', 'e', 'l', 'l', 'o'};
String s3 = new String(chars);
String s4 = new String(chars, 0, 3);  // "Hel"

// 4. 字节数组
byte[] bytes = {72, 101, 108, 108, 111};
String s5 = new String(bytes);
String s6 = new String(bytes, StandardCharsets.UTF_8);

// 5. StringBuilder/StringBuffer
StringBuilder sb = new StringBuilder("Hello");
String s7 = sb.toString();

// 6. String.valueOf()
String s8 = String.valueOf(123);
String s9 = String.valueOf(true);
String s10 = String.valueOf(new char[]{'a', 'b', 'c'});

// 7. String.format()
String s11 = String.format("Hello, %s!", "World");

// 8. String.join()（Java 8+）
String s12 = String.join("-", "2026", "01", "07");  // "2026-01-07"

// 9. 文本块（Java 15+）
String s13 = """
    Hello,
    World!
    """;
```

### String vs StringBuilder vs StringBuffer

| 特性 | String | StringBuilder | StringBuffer |
|------|--------|---------------|--------------|
| 可变性 | 不可变 | 可变 | 可变 |
| 线程安全 | 是 | 否 | 是（synchronized） |
| 性能 | 拼接慢 | 最快 | 较快 |
| 使用场景 | 少量操作 | 单线程大量拼接 | 多线程大量拼接 |
| 内存消耗 | 每次修改创建新对象 | 复用内部数组 | 复用内部数组 |

```java
// 性能对比示例
int iterations = 100000;

// String 拼接（慢）
String s = "";
long start = System.currentTimeMillis();
for (int i = 0; i < iterations; i++) {
    s += "a";  // 每次创建新对象
}
System.out.println("String: " + (System.currentTimeMillis() - start) + "ms");

// StringBuilder（快）
StringBuilder sb = new StringBuilder();
start = System.currentTimeMillis();
for (int i = 0; i < iterations; i++) {
    sb.append("a");  // 复用内部数组
}
String result = sb.toString();
System.out.println("StringBuilder: " + (System.currentTimeMillis() - start) + "ms");

// StringBuffer（线程安全，稍慢）
StringBuffer sbf = new StringBuffer();
start = System.currentTimeMillis();
for (int i = 0; i < iterations; i++) {
    sbf.append("a");  // 同步方法
}
String result2 = sbf.toString();
System.out.println("StringBuffer: " + (System.currentTimeMillis() - start) + "ms");
```

## 代码示例

### 字符串常用方法

#### 获取信息

```java
String str = "Hello, Java World!";

// 长度
int length = str.length();  // 18

// 判断空字符串
boolean isEmpty = str.isEmpty();  // false
boolean isBlank = str.isBlank();  // false（Java 11+，检查是否全为空白字符）

// 获取字符
char first = str.charAt(0);   // 'H'
char last = str.charAt(str.length() - 1);  // '!'

// 获取子串
String sub1 = str.substring(7);      // "Java World!"
String sub2 = str.substring(7, 11);  // "Java"

// 转换为字符数组
char[] chars = str.toCharArray();

// 获取字节数组
byte[] bytes = str.getBytes(StandardCharsets.UTF_8);

// 获取代码点（处理 Unicode）
int codePoint = str.codePointAt(0);  // 72（'H' 的代码点）
int codePointCount = str.codePointCount(0, str.length());
```

#### 查找与匹配

```java
String text = "Java is a programming language. Java is powerful.";

// 查找索引
int index1 = text.indexOf("Java");        // 0（首次出现）
int index2 = text.indexOf("Java", 1);     // 32（从索引 1 开始找）
int index3 = text.lastIndexOf("Java");    // 32（最后一次出现）
int notFound = text.indexOf("Python");    // -1（未找到）

// 包含判断
boolean contains = text.contains("programming");  // true

// 前缀后缀判断
boolean startsWith = text.startsWith("Java");     // true
boolean endsWith = text.endsWith("powerful.");    // true
boolean startsAt = text.startsWith("is", 5);      // true（从索引 5 开始）

// 正则表达式匹配
boolean matches = "abc123".matches("[a-z]+\\d+");  // true

// 区域匹配
boolean regionMatches = text.regionMatches(
    true,     // 忽略大小写
    0,        // 本字符串起始索引
    "JAVA",   // 目标字符串
    0,        // 目标字符串起始索引
    4         // 比较长度
);  // true
```

#### 比较方法

```java
String s1 = "Hello";
String s2 = "hello";
String s3 = "Hello";
String s4 = new String("Hello");

// equals - 比较内容
boolean eq1 = s1.equals(s2);        // false（区分大小写）
boolean eq2 = s1.equals(s3);        // true
boolean eq3 = s1.equals(s4);        // true

// equalsIgnoreCase - 忽略大小写比较
boolean eqIgnore = s1.equalsIgnoreCase(s2);  // true

// == 比较引用
boolean ref1 = (s1 == s3);  // true（字符串池中同一对象）
boolean ref2 = (s1 == s4);  // false（不同对象）

// compareTo - 字典序比较
int cmp1 = s1.compareTo(s2);         // -32（'H' - 'h'）
int cmp2 = "abc".compareTo("abd");   // -1（'c' - 'd'）
int cmp3 = "abc".compareTo("abc");   // 0

// compareToIgnoreCase - 忽略大小写的字典序比较
int cmpIgnore = s1.compareToIgnoreCase(s2);  // 0

// contentEquals - 与 CharSequence 比较
StringBuilder sb = new StringBuilder("Hello");
boolean contentEq = s1.contentEquals(sb);  // true
```

#### 转换方法

```java
String str = "  Hello, World!  ";

// 大小写转换
String upper = str.toUpperCase();        // "  HELLO, WORLD!  "
String lower = str.toLowerCase();        // "  hello, world!  "
String upperLocale = str.toUpperCase(Locale.ENGLISH);

// 去除空白
String trimmed = str.trim();             // "Hello, World!"
String stripped = str.strip();           // "Hello, World!"（Java 11+）
String stripLeading = str.stripLeading();    // "Hello, World!  "
String stripTrailing = str.stripTrailing();  // "  Hello, World!"

// 替换
String replaced1 = str.replace("World", "Java");       // "  Hello, Java!  "
String replaced2 = str.replace('o', '0');              // "  Hell0, W0rld!  "
String replaced3 = str.replaceAll("\\s+", " ");        // " Hello, World! "
String replaced4 = str.replaceFirst("\\s+", "");       // "Hello, World!  "

// 分割
String csv = "apple,banana,orange";
String[] fruits = csv.split(",");                // ["apple", "banana", "orange"]
String[] limited = csv.split(",", 2);            // ["apple", "banana,orange"]
String path = "a.b.c.d";
String[] parts = path.split("\\.");              // ["a", "b", "c", "d"]

// 连接
String joined = String.join("-", "a", "b", "c");     // "a-b-c"
String joined2 = String.join(", ", fruits);          // "apple, banana, orange"

// 重复（Java 11+）
String repeated = "ab".repeat(3);            // "ababab"

// 缩进（Java 12+）
String indented = "Hello\nWorld".indent(4);  // "    Hello\n    World\n"
String stripIndent = """
    Hello
    World
    """.stripIndent();  // 移除公共前导空白
```

#### 格式化

```java
// String.format()
String name = "Alice";
int age = 25;
double score = 95.5;

String formatted = String.format("Name: %s, Age: %d, Score: %.2f", name, age, score);
// "Name: Alice, Age: 25, Score: 95.50"

// 格式说明符
String s1 = String.format("%s", "text");              // 字符串
String s2 = String.format("%d", 42);                  // 十进制整数
String s3 = String.format("%x", 255);                 // 十六进制：ff
String s4 = String.format("%o", 8);                   // 八进制：10
String s5 = String.format("%f", 3.14);                // 浮点数：3.140000
String s6 = String.format("%.2f", 3.14159);           // 保留2位：3.14
String s7 = String.format("%e", 123456.789);          // 科学计数：1.234568e+05
String s8 = String.format("%10d", 42);                // 右对齐宽度10："        42"
String s9 = String.format("%-10d", 42);               // 左对齐宽度10："42        "
String s10 = String.format("%010d", 42);              // 零填充："0000000042"
String s11 = String.format("%+d", 42);                // 显示正号：+42
String s12 = String.format("%,d", 1000000);           // 千分位：1,000,000
String s13 = String.format("%b", true);               // 布尔值：true
String s14 = String.format("%c", 'A');                // 字符：A
String s15 = String.format("%n");                     // 换行符
String s16 = String.format("%%");                     // 百分号：%

// 参数索引
String s17 = String.format("%2$s %1$s", "World", "Hello");  // "Hello World"

// formatted() 方法（Java 15+）
String result = "Name: %s".formatted(name);  // "Name: Alice"
```

### StringBuilder 详解

```java
// 创建 StringBuilder
StringBuilder sb1 = new StringBuilder();           // 默认容量 16
StringBuilder sb2 = new StringBuilder(100);        // 指定初始容量
StringBuilder sb3 = new StringBuilder("Hello");    // 从字符串创建

// 追加操作
sb1.append("Hello");
sb1.append(' ');
sb1.append("World");
sb1.append(123);
sb1.append(true);
// sb1 = "Hello World123true"

// 链式调用
StringBuilder sb = new StringBuilder()
    .append("Name: ")
    .append("Alice")
    .append(", Age: ")
    .append(25);

// 插入操作
sb1.insert(5, ",");        // "Hello, World123true"
sb1.insert(0, ">>> ");     // ">>> Hello, World123true"

// 删除操作
sb1.delete(0, 4);          // 删除索引 0-3
sb1.deleteCharAt(5);       // 删除索引 5 的字符

// 替换操作
sb1.replace(0, 5, "Hi");   // 替换索引 0-4 为 "Hi"

// 反转
sb1.reverse();

// 设置长度
sb1.setLength(10);         // 截断或用 '\0' 填充

// 设置字符
sb1.setCharAt(0, 'X');

// 获取容量
int capacity = sb1.capacity();
int length = sb1.length();

// 确保容量
sb1.ensureCapacity(100);

// 缩减容量到当前长度
sb1.trimToSize();

// 转换为 String
String result = sb1.toString();

// 获取子串
String sub = sb1.substring(0, 5);
CharSequence cs = sb1.subSequence(0, 5);
```

### StringBuffer 详解

```java
// StringBuffer 与 StringBuilder API 基本相同，但方法都是 synchronized
StringBuffer sbf = new StringBuffer();

// 线程安全操作
sbf.append("Thread-safe ");
sbf.append("operations");

// 在多线程环境中使用
class StringBufferExample {
    private StringBuffer buffer = new StringBuffer();

    public void appendData(String data) {
        // 多线程调用此方法是安全的
        buffer.append(data);
    }

    public String getData() {
        return buffer.toString();
    }
}

// 实际上，现代 Java 开发中更推荐使用 StringBuilder
// 需要线程安全时，使用显式同步或其他并发工具
```

### 字符串与其他类型转换

```java
// 基本类型转 String
String s1 = String.valueOf(123);         // "123"
String s2 = String.valueOf(3.14);        // "3.14"
String s3 = String.valueOf(true);        // "true"
String s4 = String.valueOf('A');         // "A"
String s5 = Integer.toString(123);       // "123"
String s6 = Double.toString(3.14);       // "3.14"
String s7 = "" + 123;                    // "123"（不推荐）

// String 转基本类型
int i1 = Integer.parseInt("123");        // 123
int i2 = Integer.valueOf("123");         // 123（返回 Integer 对象）
double d1 = Double.parseDouble("3.14");  // 3.14
boolean b1 = Boolean.parseBoolean("true");  // true
long l1 = Long.parseLong("123456789");   // 123456789L

// 指定进制
int hex = Integer.parseInt("FF", 16);    // 255
int bin = Integer.parseInt("1010", 2);   // 10
int oct = Integer.parseInt("17", 8);     // 15

// 处理解析异常
try {
    int value = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("无法解析为整数");
}

// 字符数组转换
char[] chars = "Hello".toCharArray();
String fromChars = new String(chars);
String fromChars2 = String.valueOf(chars);
String partial = new String(chars, 0, 3);  // "Hel"

// 字节数组转换
byte[] bytes = "Hello".getBytes(StandardCharsets.UTF_8);
String fromBytes = new String(bytes, StandardCharsets.UTF_8);
```

## 最佳实践

### 字符串比较

```java
// 正确：使用 equals() 比较内容
String s1 = "Hello";
String s2 = new String("Hello");
if (s1.equals(s2)) {
    System.out.println("内容相等");
}

// 错误：使用 == 比较引用
if (s1 == s2) {  // 可能返回 false
    System.out.println("这不可靠");
}

// 防止 NullPointerException
String str = getUserInput();  // 可能为 null

// 方法 1：常量在前
if ("expected".equals(str)) {
    // 即使 str 为 null 也不会抛异常
}

// 方法 2：Objects.equals()
if (Objects.equals(str, "expected")) {
    // null 安全的比较
}

// 方法 3：先检查 null
if (str != null && str.equals("expected")) {
    // 明确的 null 检查
}
```

### 字符串拼接

```java
// 少量拼接：直接使用 + 运算符
String fullName = firstName + " " + lastName;

// 循环中拼接：使用 StringBuilder
StringBuilder sb = new StringBuilder();
for (String item : items) {
    sb.append(item).append(", ");
}
String result = sb.toString();

// 集合元素拼接：使用 String.join() 或 Collectors.joining()
List<String> list = Arrays.asList("a", "b", "c");
String joined = String.join(", ", list);  // "a, b, c"

// Stream API 拼接
String collected = list.stream()
    .collect(Collectors.joining(", ", "[", "]"));  // "[a, b, c]"

// 预估容量以减少扩容
StringBuilder sb2 = new StringBuilder(items.size() * 20);
```

### 字符串常量

```java
// 使用常量定义重复使用的字符串
public class Constants {
    public static final String ERROR_MESSAGE = "An error occurred";
    public static final String SUCCESS_MESSAGE = "Operation successful";
    public static final String DATE_FORMAT = "yyyy-MM-dd";
}

// 使用枚举定义相关字符串
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

### 字符串处理工具方法

```java
public class StringUtils {

    // 判断是否为空或空白
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    // 判断是否不为空
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    // 安全的 trim
    public static String safeTrim(String str) {
        return str == null ? null : str.trim();
    }

    // 默认值处理
    public static String defaultIfBlank(String str, String defaultValue) {
        return isBlank(str) ? defaultValue : str;
    }

    // 首字母大写
    public static String capitalize(String str) {
        if (isBlank(str)) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    // 截断字符串
    public static String truncate(String str, int maxLength, String suffix) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - suffix.length()) + suffix;
    }

    // 安全的 substring
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

## 常见陷阱

### 字符串比较陷阱

```java
// 陷阱 1：使用 == 比较字符串内容
String s1 = "Hello";
String s2 = new String("Hello");
System.out.println(s1 == s2);      // false - 不同对象！
System.out.println(s1.equals(s2)); // true - 正确方式

// 陷阱 2：忽略大小写问题
String userInput = "YES";
if (userInput.equals("yes")) {      // false
    // 永远不会执行
}
// 正确做法
if (userInput.equalsIgnoreCase("yes")) {
    // 正确处理
}

// 陷阱 3：null 值处理
String str = null;
// str.equals("test")  // NullPointerException!
"test".equals(str);    // false，不会抛异常
Objects.equals(str, "test");  // false，null 安全
```

### 字符串不可变性陷阱

```java
// 陷阱：以为修改了原字符串
String str = "Hello";
str.toUpperCase();  // 返回新字符串，原字符串不变
System.out.println(str);  // 仍然是 "Hello"

// 正确做法
str = str.toUpperCase();
System.out.println(str);  // "HELLO"

// 陷阱：循环中大量拼接
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i;  // 每次创建新对象，非常低效！
}

// 正确做法
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);
}
String result2 = sb.toString();
```

### 字符串池陷阱

```java
// 陷阱：过度使用 intern()
for (int i = 0; i < 1000000; i++) {
    String s = ("str" + i).intern();  // 可能导致内存问题
}

// intern() 应谨慎使用，仅当：
// 1. 确定会有大量重复字符串
// 2. 这些字符串会长期存在
// 3. 内存优化优先级很高

// 陷阱：假设 new String() 总是创建新对象
String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");
String s4 = new String("Hello").intern();

System.out.println(s1 == s2);  // true
System.out.println(s1 == s3);  // false
System.out.println(s1 == s4);  // true - intern() 返回池中对象
```

### 编码陷阱

```java
// 陷阱：不指定编码
String str = "中文";
byte[] bytes1 = str.getBytes();  // 使用平台默认编码，不可移植！

// 正确做法：显式指定编码
byte[] bytes2 = str.getBytes(StandardCharsets.UTF_8);
String decoded = new String(bytes2, StandardCharsets.UTF_8);

// 陷阱：文件读写不指定编码
// Files.readString(path);  // 使用 UTF-8，但要注意文件实际编码
Files.readString(path, StandardCharsets.UTF_8);

// 陷阱：URL 编码
String url = "https://example.com?name=张三";
// 需要进行 URL 编码
String encoded = URLEncoder.encode("张三", StandardCharsets.UTF_8);
```

### 正则表达式陷阱

```java
// 陷阱：特殊字符未转义
String str = "a.b.c";
String[] parts1 = str.split(".");  // 错误！"." 是正则通配符
// parts1 = []（空数组）

String[] parts2 = str.split("\\.");  // 正确
// parts2 = ["a", "b", "c"]

// 陷阱：重复编译正则
for (String line : lines) {
    if (line.matches("\\d+")) {  // 每次都编译正则，低效
        // ...
    }
}

// 正确做法：预编译正则
Pattern pattern = Pattern.compile("\\d+");
for (String line : lines) {
    if (pattern.matcher(line).matches()) {  // 复用编译后的正则
        // ...
    }
}
```

### substring 陷阱

```java
// 历史陷阱（Java 6 及之前）
// substring 返回的新字符串共享原字符串的 char[] 数组
// 这可能导致内存泄漏
String largeString = loadHugeFile();
String small = largeString.substring(0, 10);
largeString = null;
// 在 Java 6 中，small 仍然持有整个大字符串的引用！

// Java 7+ 已修复，substring 会复制需要的字符
// 但了解历史有助于理解旧代码

// 陷阱：索引越界
String str = "Hello";
// str.substring(10);  // StringIndexOutOfBoundsException
// str.charAt(10);     // StringIndexOutOfBoundsException

// 安全做法：先检查长度
if (str.length() > 10) {
    String sub = str.substring(0, 10);
}
```

## 性能考量

### 字符串拼接性能

```java
// 测试不同拼接方式的性能
public class StringConcatPerformance {
    private static final int ITERATIONS = 100000;

    public static void main(String[] args) {
        // 方式 1：String + 运算符
        long start = System.nanoTime();
        String s = "";
        for (int i = 0; i < ITERATIONS; i++) {
            s += "a";
        }
        System.out.printf("String +: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // 约 5000+ ms（非常慢）

        // 方式 2：StringBuilder
        start = System.nanoTime();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ITERATIONS; i++) {
            sb.append("a");
        }
        String result = sb.toString();
        System.out.printf("StringBuilder: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // 约 2-5 ms

        // 方式 3：预分配容量的 StringBuilder
        start = System.nanoTime();
        StringBuilder sb2 = new StringBuilder(ITERATIONS);
        for (int i = 0; i < ITERATIONS; i++) {
            sb2.append("a");
        }
        String result2 = sb2.toString();
        System.out.printf("StringBuilder (预分配): %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // 约 1-3 ms（最快）

        // 方式 4：StringBuffer
        start = System.nanoTime();
        StringBuffer sbf = new StringBuffer();
        for (int i = 0; i < ITERATIONS; i++) {
            sbf.append("a");
        }
        String result3 = sbf.toString();
        System.out.printf("StringBuffer: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);
        // 约 3-8 ms（同步开销）
    }
}
```

### 字符串池与 intern() 性能

```java
// intern() 的使用场景与性能影响
public class InternPerformance {

    // 场景：大量重复字符串
    public static void main(String[] args) {
        List<String> withoutIntern = new ArrayList<>();
        List<String> withIntern = new ArrayList<>();

        // 模拟大量重复字符串
        String[] cities = {"Beijing", "Shanghai", "Guangzhou", "Shenzhen"};
        Random random = new Random();

        long start = System.nanoTime();
        for (int i = 0; i < 1000000; i++) {
            String city = new String(cities[random.nextInt(4)]);
            withoutIntern.add(city);
        }
        System.out.printf("Without intern: %.2f ms, estimated size: %d%n",
            (System.nanoTime() - start) / 1_000_000.0,
            withoutIntern.size() * 50);  // 粗略估计

        start = System.nanoTime();
        for (int i = 0; i < 1000000; i++) {
            String city = new String(cities[random.nextInt(4)]).intern();
            withIntern.add(city);
        }
        System.out.printf("With intern: %.2f ms%n",
            (System.nanoTime() - start) / 1_000_000.0);

        // intern() 会增加处理时间，但减少内存使用
        // 适用于：大量重复、长期存在的字符串
    }
}
```

### 字符串操作优化

```java
public class StringOptimization {

    // 优化 1：避免创建不必要的字符串
    // 不好
    public boolean containsIgnoreCaseBad(String str, String search) {
        return str.toLowerCase().contains(search.toLowerCase());
        // 每次调用都创建两个新字符串
    }

    // 更好
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

    // 优化 2：使用 charAt() 代替 substring(i, i+1)
    // 不好
    public void processCharsBad(String str) {
        for (int i = 0; i < str.length(); i++) {
            String ch = str.substring(i, i + 1);  // 创建新字符串
            // 处理
        }
    }

    // 更好
    public void processCharsGood(String str) {
        for (int i = 0; i < str.length(); i++) {
            char ch = str.charAt(i);  // 不创建新对象
            // 处理
        }
    }

    // 优化 3：正则表达式预编译
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    public boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    // 优化 4：使用 isEmpty() 而非 length() == 0
    public boolean isEmptyGood(String str) {
        return str == null || str.isEmpty();
    }

    // 优化 5：使用 StringJoiner 或 String.join()
    public String joinWithDelimiter(List<String> items, String delimiter) {
        return String.join(delimiter, items);
        // 或
        // StringJoiner joiner = new StringJoiner(delimiter);
        // items.forEach(joiner::add);
        // return joiner.toString();
    }
}
```

### 内存优化建议

```java
// 1. 使用字符串字面量而非 new String()
String good = "Hello";        // 使用字符串池
String bad = new String("Hello");  // 额外创建堆对象

// 2. 大量重复字符串考虑 intern()
// 但要注意 intern() 本身有开销，且字符串池有大小限制

// 3. 处理大文本时使用 Stream
Files.lines(path, StandardCharsets.UTF_8)
    .filter(line -> line.contains("keyword"))
    .forEach(System.out::println);

// 4. 使用 CharSequence 参数类型提高灵活性
public void process(CharSequence text) {
    // 可以接受 String, StringBuilder, StringBuffer 等
}

// 5. Java 11+ 使用更高效的字符串方法
String repeated = "ab".repeat(100);       // 比循环拼接高效
boolean isBlank = str.isBlank();          // 比 trim().isEmpty() 高效
String[] lines = str.lines().toArray(String[]::new);  // 流式处理行
```

## 实战场景

### 场景一：日志消息构建

```java
public class LogMessageBuilder {

    // 使用 StringBuilder 构建复杂日志消息
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

    // 使用 String.format 的简洁版本
    public String buildSimpleLog(String level, String format, Object... args) {
        return String.format("[%s] [%s] %s",
            LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            level,
            String.format(format, args));
    }
}
```

### 场景二：字符串模板引擎

```java
public class SimpleTemplateEngine {

    private static final Pattern PLACEHOLDER_PATTERN =
        Pattern.compile("\\$\\{([^}]+)\\}");

    // 简单的模板替换
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

    // 使用示例
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

### 场景三：CSV 解析与生成

```java
public class CsvUtils {

    // CSV 解析
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
        // 简化版本，不处理引号内的分隔符
        return line.split(Pattern.quote(delimiter));
    }

    // CSV 生成
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

        // 如果包含特殊字符，用引号包围
        if (cell.contains(delimiter) || cell.contains("\"") ||
            cell.contains("\n") || cell.contains("\r")) {
            return "\"" + cell.replace("\"", "\"\"") + "\"";
        }

        return cell;
    }
}
```

### 场景四：URL 构建器

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

    // 使用示例
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

### 场景五：文本处理工具

```java
public class TextProcessor {

    // 驼峰命名转下划线
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

    // 下划线转驼峰
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

    // 提取字符串中的数字
    public List<Integer> extractNumbers(String text) {
        List<Integer> numbers = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\d+");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            numbers.add(Integer.parseInt(matcher.group()));
        }

        return numbers;
    }

    // 统计单词频率
    public Map<String, Long> wordFrequency(String text) {
        return Arrays.stream(text.toLowerCase().split("\\W+"))
            .filter(word -> !word.isEmpty())
            .collect(Collectors.groupingBy(
                Function.identity(),
                Collectors.counting()
            ));
    }

    // 文本截断并添加省略号
    public String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }

        // 尝试在单词边界截断
        int lastSpace = text.lastIndexOf(' ', maxLength - 3);
        if (lastSpace > maxLength * 0.7) {
            return text.substring(0, lastSpace) + "...";
        }

        return text.substring(0, maxLength - 3) + "...";
    }
}
```

## 面试要点

### 基础概念题

**Q1: String 为什么是不可变的？有什么好处？**

String 不可变的实现机制：
1. `String` 类被声明为 `final`，不能被继承
2. 内部 `char[]`（Java 9+ 是 `byte[]`）被声明为 `private final`
3. 没有提供修改内部数组的方法

不可变性的好处：
- **线程安全**：不可变对象可以安全地在多线程间共享
- **字符串池**：相同内容的字符串可以复用
- **安全性**：作为参数传递时不会被修改
- **哈希缓存**：hashCode 可以缓存，提高哈希表性能

```java
// 示例：hashCode 缓存
String key = "important_key";
int hash = key.hashCode();  // 首次计算
int hash2 = key.hashCode(); // 返回缓存值，无需重新计算
```

**Q2: String、StringBuilder、StringBuffer 的区别？**

| 特性 | String | StringBuilder | StringBuffer |
|------|--------|---------------|--------------|
| 可变性 | 不可变 | 可变 | 可变 |
| 线程安全 | 是（不可变） | 否 | 是（synchronized） |
| 性能 | 拼接慢 | 最快 | 较快 |
| 使用场景 | 少量操作 | 单线程大量拼接 | 多线程大量拼接 |

**Q3: 什么是字符串池？new String("abc") 创建了几个对象？**

字符串池是 JVM 中存储字符串字面量的特殊区域，位于堆内存中（Java 7+）。

```java
String s = new String("abc");
// 创建了 1 或 2 个对象：
// 1. 如果字符串池中没有 "abc"，先在池中创建一个
// 2. 在堆中创建一个新的 String 对象
// 所以：第一次执行时创建 2 个，之后执行创建 1 个
```

**Q4: String 的 equals() 和 == 有什么区别？**

```java
String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");

// == 比较引用（内存地址）
s1 == s2  // true - 字符串池中同一对象
s1 == s3  // false - 不同对象

// equals() 比较内容
s1.equals(s2)  // true
s1.equals(s3)  // true
```

**Q5: intern() 方法的作用是什么？**

`intern()` 方法检查字符串池：
- 如果池中存在相等的字符串，返回池中的引用
- 如果不存在，将字符串加入池中并返回引用

```java
String s1 = new String("hello");  // 堆中对象
String s2 = s1.intern();          // 池中对象
String s3 = "hello";              // 池中对象

System.out.println(s2 == s3);     // true
System.out.println(s1 == s2);     // false
```

### 进阶题

**Q6: 如何高效地拼接大量字符串？**

```java
// 方案 1：StringBuilder（单线程）
StringBuilder sb = new StringBuilder(expectedLength);
for (String s : strings) {
    sb.append(s);
}
String result = sb.toString();

// 方案 2：String.join()（Java 8+）
String result = String.join(delimiter, strings);

// 方案 3：Collectors.joining()（Stream API）
String result = list.stream()
    .collect(Collectors.joining(", "));
```

**Q7: Java 9 中 String 的内部实现有什么变化？**

Java 9 引入了紧凑字符串（Compact Strings）：
- 使用 `byte[]` 代替 `char[]` 存储
- 新增 `coder` 字段标识编码（LATIN1 或 UTF16）
- 纯 ASCII 字符串内存减少一半

```java
// Java 8
private final char[] value;  // 每个字符 2 字节

// Java 9+
private final byte[] value;  // LATIN1: 每字符 1 字节，UTF16: 每字符 2 字节
private final byte coder;    // 0 = LATIN1, 1 = UTF16
```

**Q8: 字符串拼接在编译和运行时是如何优化的？**

```java
// 编译时常量折叠
String s = "Hello" + " " + "World";  // 编译为 "Hello World"

// Java 9+ 运行时使用 invokedynamic
String name = "Alice";
String greeting = "Hello, " + name + "!";
// 编译为调用 StringConcatFactory.makeConcatWithConstants

// 循环中的拼接不会自动优化
String result = "";
for (int i = 0; i < n; i++) {
    result += i;  // 仍然低效，应使用 StringBuilder
}
```

### 编码实现题

**Q9: 实现字符串反转**

```java
// 方法 1：StringBuilder
public String reverse(String s) {
    return new StringBuilder(s).reverse().toString();
}

// 方法 2：字符数组
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

// 方法 3：递归
public String reverseRecursive(String s) {
    if (s.length() <= 1) return s;
    return reverseRecursive(s.substring(1)) + s.charAt(0);
}
```

**Q10: 判断两个字符串是否为变位词（Anagram）**

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;

    // 方法 1：排序比较
    char[] sChars = s.toCharArray();
    char[] tChars = t.toCharArray();
    Arrays.sort(sChars);
    Arrays.sort(tChars);
    return Arrays.equals(sChars, tChars);
}

public boolean isAnagramOptimized(String s, String t) {
    if (s.length() != t.length()) return false;

    // 方法 2：字符计数
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

**Q11: 实现 KMP 字符串匹配算法**

```java
public class KMPSearch {

    // 构建部分匹配表（前缀函数）
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

    // KMP 搜索
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
                return i - pattern.length() + 1;  // 找到匹配
            }
        }

        return -1;  // 未找到
    }
}
```

## 延伸阅读

### 官方文档

- [Java String API 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [StringBuilder API 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html)
- [StringBuffer API 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html)
- [JEP 254: Compact Strings](https://openjdk.org/jeps/254) - 紧凑字符串提案

### 相关主题

- **正则表达式**：`java.util.regex` 包提供了强大的模式匹配功能
- **字符编码**：`java.nio.charset` 包处理各种字符编码
- **文本处理**：`java.text` 包提供格式化和解析功能
- **Unicode 支持**：`Character` 类提供 Unicode 相关操作

### 进阶阅读

- *Effective Java* 第 63 条：当心字符串拼接的性能
- *Java Performance: The Definitive Guide* - 字符串操作优化章节
- [JVM 字符串常量池详解](https://www.baeldung.com/java-string-pool)
- [Java 字符串不可变性深入分析](https://www.baeldung.com/java-string-immutable)

### 工具库

- **Apache Commons Lang**：`StringUtils` 提供丰富的字符串工具方法
- **Guava**：`Strings`、`CharMatcher`、`Splitter`、`Joiner` 等工具类
- **Apache Commons Text**：更多文本处理工具，如相似度计算、转义处理等

```java
// Apache Commons Lang 示例
import org.apache.commons.lang3.StringUtils;

StringUtils.isBlank(str);
StringUtils.capitalize(str);
StringUtils.abbreviate(str, 10);
StringUtils.leftPad(str, 10, '0');

// Guava 示例
import com.google.common.base.Strings;
import com.google.common.base.Splitter;

Strings.isNullOrEmpty(str);
Strings.padStart(str, 10, '0');
Splitter.on(',').trimResults().split("a, b, c");
```

---

> 本文深入介绍了 Java String 类的核心概念、实现原理和最佳实践。理解字符串的不可变性、字符串池机制以及 StringBuilder/StringBuffer 的使用场景，是编写高效 Java 代码的基础。建议读者通过实际编码练习来巩固这些知识点。
