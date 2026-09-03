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
origin: old/src/content/docs/java/data-types.zh.md
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

数据类型是编程语言的基石，决定了变量可以存储什么样的数据以及可以进行哪些操作。Java 作为一门强类型语言，对类型系统有着严格的定义和规范。本文将深入探讨 Java 的数据类型体系，包括基本类型、包装类、自动装箱拆箱以及类型转换等核心概念。

## 概念解释

### 什么是数据类型

数据类型是对数据的一种分类，它定义了：

1. **存储空间大小**：变量在内存中占用多少字节
2. **数值范围**：变量可以表示的最大和最小值
3. **可执行的操作**：对该类型数据可以进行哪些运算
4. **默认值**：未初始化时的默认值

### Java 类型系统概览

Java 的数据类型分为两大类：

```
Java 数据类型
├── 基本数据类型（Primitive Types）
│   ├── 整数类型：byte, short, int, long
│   ├── 浮点类型：float, double
│   ├── 字符类型：char
│   └── 布尔类型：boolean
│
└── 引用数据类型（Reference Types）
    ├── 类（Class）
    ├── 接口（Interface）
    ├── 数组（Array）
    └── 枚举（Enum）
```

### 历史背景

Java 的类型系统设计深受 C/C++ 的影响，但做了重要改进：

- **固定大小**：不同于 C 语言中基本类型大小依赖平台，Java 的基本类型大小是固定的，保证了跨平台一致性
- **无无符号类型**：Java 没有 unsigned 类型（除了 char），简化了类型系统
- **引入包装类**：为了在面向对象世界中使用基本类型，Java 提供了对应的包装类
- **自动装箱拆箱**：Java 5 引入，简化了基本类型与包装类之间的转换

## 核心原理

### 基本数据类型的内存表示

#### 整数类型的存储

Java 中所有整数类型都使用**二进制补码**表示，这使得加法和减法运算可以统一处理：

```java
// byte 类型（8 位）的存储示例
byte positive = 127;    // 二进制：0111 1111
byte negative = -128;   // 二进制：1000 0000（补码）

// int 类型（32 位）的存储
int maxInt = 2147483647;  // 0111 1111 1111 1111 1111 1111 1111 1111
int minInt = -2147483648; // 1000 0000 0000 0000 0000 0000 0000 0000
```

**补码的计算规则**：
- 正数的补码是其本身
- 负数的补码 = 原码取反 + 1

```java
// -5 的补码计算（以 byte 为例）
// 原码：1000 0101（符号位 + 绝对值）
// 反码：1111 1010（符号位不变，其他位取反）
// 补码：1111 1011（反码 + 1）
byte negativeFive = -5;  // 内存中存储：1111 1011
```

#### 浮点类型的存储

Java 的浮点数遵循 **IEEE 754** 标准：

```
float（32 位）：
┌─────┬──────────┬───────────────────────┐
│符号位│  指数位   │       尾数位           │
│ 1位  │   8位    │        23位            │
└─────┴──────────┴───────────────────────┘

double（64 位）：
┌─────┬──────────┬───────────────────────────────────────┐
│符号位│  指数位   │              尾数位                    │
│ 1位  │   11位   │               52位                     │
└─────┴──────────┴───────────────────────────────────────┘
```

**浮点数精度问题的根源**：

```java
// 十进制 0.1 无法用二进制精确表示
double d = 0.1;
// 实际存储的是：0.1000000000000000055511151231257827021181583404541015625

System.out.println(0.1 + 0.2);  // 输出：0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);  // 输出：false
```

#### char 类型的存储

Java 的 char 使用 **UTF-16** 编码，占用 16 位（2 字节）：

```java
char a = 'A';      // 存储 Unicode 码点 65（0x0041）
char zhong = '中'; // 存储 Unicode 码点 20013（0x4E2D）

// char 本质上是无符号 16 位整数
char c = 65;       // 等同于 'A'
System.out.println((int) 'A');  // 输出：65
```

### 包装类的内部实现

#### 缓存机制

为了提高性能，Integer 等包装类对常用值进行了缓存：

```java
// Integer 缓存源码（简化版）
private static class IntegerCache {
    static final int low = -128;
    static final int high = 127;  // 可通过 JVM 参数调整
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

缓存范围：
- **Byte**：-128 到 127（全部缓存）
- **Short**：-128 到 127
- **Integer**：-128 到 127（上限可调整）
- **Long**：-128 到 127
- **Character**：0 到 127
- **Boolean**：TRUE 和 FALSE（全部缓存）
- **Float/Double**：不缓存

### 自动装箱拆箱的实现

编译器在编译时自动插入装箱拆箱代码：

```java
// 源代码
Integer a = 10;
int b = a;

// 编译后等效代码
Integer a = Integer.valueOf(10);  // 装箱
int b = a.intValue();             // 拆箱
```

## 核心要点

### 八种基本数据类型详解

| 类型 | 大小 | 默认值 | 范围 | 用途 |
|------|------|--------|------|------|
| byte | 8位 | 0 | -128 ~ 127 | 节省内存、网络传输、文件读写 |
| short | 16位 | 0 | -32,768 ~ 32,767 | 较少使用，兼容性考虑 |
| int | 32位 | 0 | -2^31 ~ 2^31-1 | 最常用的整数类型 |
| long | 64位 | 0L | -2^63 ~ 2^63-1 | 大整数、时间戳 |
| float | 32位 | 0.0f | IEEE 754 | 单精度浮点数 |
| double | 64位 | 0.0d | IEEE 754 | 最常用的浮点类型 |
| char | 16位 | '\u0000' | 0 ~ 65,535 | Unicode 字符 |
| boolean | JVM相关 | false | true/false | 逻辑判断 |

### 各类型的最大最小值

```java
// 获取各类型的边界值
System.out.println("byte: " + Byte.MIN_VALUE + " ~ " + Byte.MAX_VALUE);
System.out.println("short: " + Short.MIN_VALUE + " ~ " + Short.MAX_VALUE);
System.out.println("int: " + Integer.MIN_VALUE + " ~ " + Integer.MAX_VALUE);
System.out.println("long: " + Long.MIN_VALUE + " ~ " + Long.MAX_VALUE);
System.out.println("float: " + Float.MIN_VALUE + " ~ " + Float.MAX_VALUE);
System.out.println("double: " + Double.MIN_VALUE + " ~ " + Double.MAX_VALUE);
System.out.println("char: " + (int) Character.MIN_VALUE + " ~ " + (int) Character.MAX_VALUE);

/*
输出：
byte: -128 ~ 127
short: -32768 ~ 32767
int: -2147483648 ~ 2147483647
long: -9223372036854775808 ~ 9223372036854775807
float: 1.4E-45 ~ 3.4028235E38
double: 4.9E-324 ~ 1.7976931348623157E308
char: 0 ~ 65535
*/
```

### 包装类与基本类型对应关系

| 基本类型 | 包装类 | 继承关系 |
|----------|--------|----------|
| byte | Byte | Number |
| short | Short | Number |
| int | Integer | Number |
| long | Long | Number |
| float | Float | Number |
| double | Double | Number |
| char | Character | Object |
| boolean | Boolean | Object |

### 类型转换规则

#### 自动类型转换（隐式转换）

从小范围到大范围自动转换，遵循以下顺序：

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
float f = l;      // long -> float（可能丢失精度）
double d = f;     // float -> double

char c = 'A';
int ascii = c;    // char -> int（获取 ASCII 值）
```

#### 强制类型转换（显式转换）

从大范围到小范围需要强制转换：

```java
double d = 100.99;
int i = (int) d;        // 100，截断小数部分

long l = 200L;
int j = (int) l;        // 200，范围内安全转换

int big = 130;
byte b = (byte) big;    // -126，溢出！
```

## 代码示例

### 基本数据类型的使用

```java
public class PrimitiveTypesDemo {
    public static void main(String[] args) {
        // ===== 整数类型 =====

        // byte: 节省内存的场景
        byte age = 25;
        byte[] buffer = new byte[1024];  // 文件读取缓冲区

        // short: 较少使用
        short year = 2026;

        // int: 最常用的整数类型
        int population = 14_0000_0000;   // 可使用下划线增加可读性（Java 7+）
        int hexValue = 0xFF;             // 十六进制表示
        int binaryValue = 0b1010_1010;   // 二进制表示（Java 7+）
        int octalValue = 0755;           // 八进制表示

        // long: 大整数
        long distanceToSun = 149_600_000_000L;  // 必须加 L 后缀
        long timestamp = System.currentTimeMillis();

        // ===== 浮点类型 =====

        // float: 单精度浮点数
        float price = 19.99f;     // 必须加 f 后缀
        float pi = 3.14159f;

        // double: 双精度浮点数（默认）
        double precise = 3.141592653589793;
        double scientific = 1.5e10;  // 科学计数法

        // 特殊浮点值
        double positiveInfinity = Double.POSITIVE_INFINITY;
        double negativeInfinity = Double.NEGATIVE_INFINITY;
        double notANumber = Double.NaN;

        System.out.println("1.0 / 0.0 = " + (1.0 / 0.0));   // Infinity
        System.out.println("0.0 / 0.0 = " + (0.0 / 0.0));   // NaN
        System.out.println("NaN == NaN: " + (Double.NaN == Double.NaN));  // false
        System.out.println("isNaN: " + Double.isNaN(0.0 / 0.0));  // true

        // ===== 字符类型 =====

        char letter = 'A';
        char chineseChar = '中';
        char unicodeChar = '\u4e2d';      // Unicode 表示
        char newLine = '\n';              // 转义字符
        char tab = '\t';
        char backslash = '\\';
        char singleQuote = '\'';

        // char 的数值特性
        char start = 'a';
        for (int k = 0; k < 26; k++) {
            System.out.print((char) (start + k));  // 输出 a-z
        }
        System.out.println();

        // ===== 布尔类型 =====

        boolean isJavaFun = true;
        boolean isRaining = false;
        boolean result = (10 > 5) && (3 < 7);  // true

        // boolean 不能与其他类型转换
        // int num = (int) isJavaFun;  // 编译错误
    }
}
```

### 包装类的使用

```java
public class WrapperClassDemo {
    public static void main(String[] args) {
        // ===== 创建包装类对象 =====

        // 方式1：valueOf（推荐，利用缓存）
        Integer a = Integer.valueOf(100);
        Integer b = Integer.valueOf("100");

        // 方式2：自动装箱（编译器自动调用 valueOf）
        Integer c = 100;

        // 方式3：构造函数（已废弃，不推荐）
        @SuppressWarnings("deprecation")
        Integer d = new Integer(100);

        // ===== 获取基本类型值 =====

        int value1 = a.intValue();           // 显式拆箱
        int value2 = a;                       // 自动拆箱
        double doubleValue = a.doubleValue(); // 转换为 double

        // ===== 字符串转换 =====

        // 字符串转基本类型
        int parsed = Integer.parseInt("123");
        double parsedDouble = Double.parseDouble("3.14");
        boolean parsedBool = Boolean.parseBoolean("true");

        // 基本类型转字符串
        String str1 = Integer.toString(123);
        String str2 = String.valueOf(123);
        String str3 = 123 + "";  // 性能较差

        // 进制转换
        String binary = Integer.toBinaryString(255);   // "11111111"
        String octal = Integer.toOctalString(255);     // "377"
        String hex = Integer.toHexString(255);         // "ff"
        int fromBinary = Integer.parseInt("11111111", 2);  // 255
        int fromHex = Integer.parseInt("ff", 16);          // 255

        // ===== 比较操作 =====

        Integer x = 128;
        Integer y = 128;
        Integer p = 100;
        Integer q = 100;

        // 缓存范围内（-128 到 127）
        System.out.println(p == q);           // true（同一对象）
        System.out.println(p.equals(q));      // true

        // 缓存范围外
        System.out.println(x == y);           // false（不同对象）
        System.out.println(x.equals(y));      // true

        // 推荐使用 equals 或 compareTo
        System.out.println(x.compareTo(y));   // 0（相等）
        System.out.println(Integer.compare(x, y));  // 0

        // ===== 常用静态方法 =====

        int max = Integer.max(10, 20);        // 20
        int min = Integer.min(10, 20);        // 10
        int sum = Integer.sum(10, 20);        // 30

        int bitCount = Integer.bitCount(255); // 8（二进制中 1 的个数）
        int highestBit = Integer.highestOneBit(100);  // 64
        int leadingZeros = Integer.numberOfLeadingZeros(1);  // 31

        // ===== 处理 null =====

        Integer nullable = null;

        // 自动拆箱遇到 null 会抛出 NullPointerException
        // int willThrow = nullable;  // NullPointerException

        // 安全处理
        int safeValue = nullable != null ? nullable : 0;
        int safeValue2 = nullable == null ? 0 : nullable.intValue();

        // Java 9+ 可以使用 Objects
        // int safeValue3 = Objects.requireNonNullElse(nullable, 0);
    }
}
```

### 自动装箱拆箱详解

```java
public class AutoBoxingDemo {
    public static void main(String[] args) {
        // ===== 基本装箱拆箱 =====

        // 自动装箱：基本类型 -> 包装类
        Integer a = 100;  // 编译为：Integer.valueOf(100)
        Double d = 3.14;  // 编译为：Double.valueOf(3.14)
        Boolean b = true; // 编译为：Boolean.valueOf(true)

        // 自动拆箱：包装类 -> 基本类型
        int x = a;        // 编译为：a.intValue()
        double y = d;     // 编译为：d.doubleValue()
        boolean z = b;    // 编译为：b.booleanValue()

        // ===== 运算中的自动拆箱 =====

        Integer num1 = 10;
        Integer num2 = 20;

        // 算术运算会触发自动拆箱
        int sum = num1 + num2;           // 拆箱后运算
        Integer result = num1 + num2;    // 拆箱运算后再装箱

        // 比较运算
        boolean isEqual = (num1 < num2); // 拆箱后比较

        // ===== 条件表达式中的类型提升 =====

        Integer boxedInt = 100;
        int primitiveInt = 200;

        // 三元运算符会进行类型统一
        // 如果一边是基本类型，另一边会拆箱
        Integer result1 = true ? boxedInt : primitiveInt;  // boxedInt 保持，primitiveInt 装箱
        int result2 = true ? boxedInt : primitiveInt;      // boxedInt 拆箱

        // ===== 方法重载中的装箱拆箱 =====

        overloadTest(100);    // 调用 int 版本
        overloadTest((Integer) 100);  // 调用 Integer 版本

        // ===== 集合中的装箱 =====

        List<Integer> numbers = new ArrayList<>();
        numbers.add(10);     // 自动装箱
        numbers.add(20);

        int first = numbers.get(0);  // 自动拆箱

        // 遍历时的拆箱
        int total = 0;
        for (int n : numbers) {  // 每次迭代都会拆箱
            total += n;
        }
    }

    static void overloadTest(int value) {
        System.out.println("int 版本: " + value);
    }

    static void overloadTest(Integer value) {
        System.out.println("Integer 版本: " + value);
    }
}
```

### 类型转换示例

```java
public class TypeConversionDemo {
    public static void main(String[] args) {
        // ===== 自动类型转换（隐式转换） =====

        byte b = 10;
        short s = b;     // byte -> short
        int i = s;       // short -> int
        long l = i;      // int -> long
        float f = l;     // long -> float
        double d = f;    // float -> double

        // char 到 int 的转换
        char c = 'A';
        int ascii = c;   // 65

        // 表达式中的类型提升
        byte b1 = 10, b2 = 20;
        // byte b3 = b1 + b2;  // 编译错误！byte 运算结果是 int
        int b3 = b1 + b2;      // 正确
        byte b4 = (byte) (b1 + b2);  // 强制转换

        // ===== 强制类型转换（显式转换） =====

        // 浮点转整数：截断小数部分
        double pi = 3.14159;
        int intPi = (int) pi;       // 3

        // 整数溢出
        int bigInt = 130;
        byte smallByte = (byte) bigInt;  // -126（溢出）

        // 验证溢出
        System.out.println("130 的 byte 值: " + smallByte);
        System.out.println("130 的二进制: " + Integer.toBinaryString(130));
        // 130 = 1000 0010，作为有符号 byte 解释为 -126

        // ===== 字符串与数值的转换 =====

        // 字符串 -> 数值
        int fromString = Integer.parseInt("123");
        long fromStringL = Long.parseLong("123456789012");
        double fromStringD = Double.parseDouble("3.14159");

        // 处理进制
        int binary = Integer.parseInt("1010", 2);   // 10
        int hex = Integer.parseInt("FF", 16);       // 255
        int octal = Integer.parseInt("77", 8);      // 63

        // 数值 -> 字符串
        String str1 = String.valueOf(123);
        String str2 = Integer.toString(123);
        String str3 = "" + 123;  // 不推荐，效率低

        // 格式化转换
        String formatted = String.format("%.2f", 3.14159);  // "3.14"

        // ===== 包装类之间的转换 =====

        Integer intObj = 100;

        // 通过基本类型转换
        Long longObj = intObj.longValue();      // 不推荐
        Long longObj2 = (long) intObj;          // 先拆箱再装箱
        Long longObj3 = Long.valueOf(intObj);   // 推荐

        Double doubleObj = intObj.doubleValue();

        // ===== Number 类型转换 =====

        Number number = Integer.valueOf(100);
        int intValue = number.intValue();
        long longValue = number.longValue();
        double doubleValue = number.doubleValue();

        // ===== Object 与基本类型 =====

        Object obj = 100;          // 自动装箱为 Integer
        int value = (Integer) obj; // 先转型再拆箱

        // 安全转换
        if (obj instanceof Integer) {
            int safeValue = (Integer) obj;
        }

        // Java 16+ 模式匹配
        // if (obj instanceof Integer intVal) {
        //     System.out.println(intVal);
        // }
    }
}
```

### 精确计算示例

```java
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;

public class PreciseCalculationDemo {
    public static void main(String[] args) {
        // ===== 浮点数精度问题 =====

        System.out.println("0.1 + 0.2 = " + (0.1 + 0.2));  // 0.30000000000000004
        System.out.println("1.0 - 0.9 = " + (1.0 - 0.9));  // 0.09999999999999998

        // ===== 使用 BigDecimal 进行精确计算 =====

        // 创建 BigDecimal（推荐使用字符串构造）
        BigDecimal bd1 = new BigDecimal("0.1");
        BigDecimal bd2 = new BigDecimal("0.2");

        // 不推荐：double 构造会引入精度问题
        BigDecimal bd3 = new BigDecimal(0.1);  // 0.1000000000000000055511151231257827...

        // 推荐方式
        BigDecimal bd4 = BigDecimal.valueOf(0.1);  // 使用 Double.toString 转换

        // 四则运算
        BigDecimal sum = bd1.add(bd2);               // 0.3
        BigDecimal diff = bd2.subtract(bd1);         // 0.1
        BigDecimal product = bd1.multiply(bd2);      // 0.02
        BigDecimal quotient = bd1.divide(bd2, 10, RoundingMode.HALF_UP);  // 0.5

        System.out.println("BigDecimal 0.1 + 0.2 = " + sum);  // 0.3

        // 比较
        BigDecimal a = new BigDecimal("1.0");
        BigDecimal b = new BigDecimal("1.00");
        System.out.println("equals: " + a.equals(b));      // false（精度不同）
        System.out.println("compareTo: " + a.compareTo(b)); // 0（数值相等）

        // 设置精度和舍入模式
        BigDecimal price = new BigDecimal("19.995");
        BigDecimal rounded = price.setScale(2, RoundingMode.HALF_UP);  // 20.00

        // 舍入模式
        BigDecimal num = new BigDecimal("2.5");
        System.out.println("HALF_UP: " + num.setScale(0, RoundingMode.HALF_UP));      // 3
        System.out.println("HALF_DOWN: " + num.setScale(0, RoundingMode.HALF_DOWN));  // 2
        System.out.println("HALF_EVEN: " + num.setScale(0, RoundingMode.HALF_EVEN));  // 2（银行家舍入）
        System.out.println("CEILING: " + num.setScale(0, RoundingMode.CEILING));      // 3
        System.out.println("FLOOR: " + num.setScale(0, RoundingMode.FLOOR));          // 2

        // ===== 使用 BigInteger 处理大整数 =====

        BigInteger big1 = new BigInteger("123456789012345678901234567890");
        BigInteger big2 = BigInteger.valueOf(Long.MAX_VALUE);

        // 运算
        BigInteger bigSum = big1.add(big2);
        BigInteger bigProduct = big1.multiply(big2);
        BigInteger bigPow = BigInteger.TEN.pow(100);  // 10^100

        // 常用方法
        System.out.println("bit length: " + big1.bitLength());
        System.out.println("是否为质数: " + big1.isProbablePrime(100));
        System.out.println("最大公约数: " + big1.gcd(big2));

        // ===== 金融计算示例 =====

        BigDecimal principal = new BigDecimal("10000.00");
        BigDecimal rate = new BigDecimal("0.05");
        int years = 10;

        // 复利计算：A = P(1 + r)^n
        BigDecimal factor = BigDecimal.ONE.add(rate);
        BigDecimal amount = principal.multiply(factor.pow(years));
        amount = amount.setScale(2, RoundingMode.HALF_UP);

        System.out.println("10年后本息合计: " + amount);
    }
}
```

## 最佳实践

### 选择合适的数据类型

```java
public class TypeSelectionBestPractice {

    // 推荐：使用 int 作为默认整数类型
    public int calculateSum(int[] numbers) {
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        return sum;
    }

    // 推荐：大数值使用 long
    public long calculateTotalBytes(long fileCount, long avgFileSize) {
        return fileCount * avgFileSize;
    }

    // 推荐：金融计算使用 BigDecimal
    public BigDecimal calculateInterest(BigDecimal principal, BigDecimal rate) {
        return principal.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    // 推荐：字节数组处理使用 byte
    public byte[] readFile(String path) {
        // 文件读取...
        return new byte[0];
    }

    // 避免：不必要地使用 short
    // short 在运算时会提升为 int，反而降低性能
    // 除非有大量数据需要节省内存
}
```

### 包装类的正确使用

```java
public class WrapperClassBestPractice {

    // 推荐：使用 Objects.equals 比较可能为 null 的包装类
    public boolean areEqual(Integer a, Integer b) {
        return Objects.equals(a, b);
    }

    // 推荐：避免在循环中进行装箱
    public long sumBad(List<Integer> numbers) {
        Long sum = 0L;  // 不好：每次相加都会装箱
        for (Integer n : numbers) {
            sum += n;
        }
        return sum;
    }

    public long sumGood(List<Integer> numbers) {
        long sum = 0L;  // 好：使用基本类型
        for (Integer n : numbers) {
            sum += n;  // 只发生拆箱，无装箱
        }
        return sum;
    }

    // 推荐：使用静态工厂方法而非构造函数
    public Integer createInteger(int value) {
        return Integer.valueOf(value);  // 利用缓存
        // 不要使用：new Integer(value)
    }

    // 推荐：处理可能为 null 的拆箱
    public int safeUnbox(Integer value) {
        return value != null ? value : 0;
        // 或使用 Optional
        // return Optional.ofNullable(value).orElse(0);
    }
}
```

### 类型转换的安全处理

```java
public class TypeConversionBestPractice {

    // 推荐：范围检查后再转换
    public byte toByteChecked(int value) {
        if (value < Byte.MIN_VALUE || value > Byte.MAX_VALUE) {
            throw new ArithmeticException("Value out of byte range: " + value);
        }
        return (byte) value;
    }

    // 推荐：使用 Math 方法进行安全转换（Java 8+）
    public int toLongChecked(long value) {
        return Math.toIntExact(value);  // 溢出时抛出异常
    }

    // 推荐：字符串转换时处理异常
    public int parseIntSafe(String str, int defaultValue) {
        try {
            return Integer.parseInt(str);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    // 推荐：使用 Optional 处理可能失败的转换（Java 8+）
    public Optional<Integer> parseIntOptional(String str) {
        try {
            return Optional.of(Integer.parseInt(str));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
```

### 浮点数比较的正确方式

```java
public class FloatComparisonBestPractice {

    private static final double EPSILON = 1e-10;

    // 推荐：使用误差范围比较
    public boolean almostEqual(double a, double b) {
        return Math.abs(a - b) < EPSILON;
    }

    // 推荐：使用 BigDecimal 进行精确比较
    public boolean exactEqual(String a, String b) {
        BigDecimal bd1 = new BigDecimal(a);
        BigDecimal bd2 = new BigDecimal(b);
        return bd1.compareTo(bd2) == 0;
    }

    // 推荐：使用 Double.compare 处理特殊值
    public int compareDoubles(double a, double b) {
        return Double.compare(a, b);  // 正确处理 NaN 和 Infinity
    }

    // 避免：直接使用 == 比较浮点数
    public boolean badComparison(double a, double b) {
        return a == b;  // 不可靠！
    }
}
```

## 常见陷阱

### 整数溢出

```java
public class IntegerOverflowPitfall {
    public static void main(String[] args) {
        // 陷阱1：整数运算溢出
        int a = Integer.MAX_VALUE;
        int b = a + 1;  // 溢出为负数
        System.out.println("MAX_VALUE + 1 = " + b);  // -2147483648

        // 陷阱2：乘法溢出
        int seconds = 24 * 60 * 60 * 1000;        // 正常：86400000
        int microseconds = 24 * 60 * 60 * 1000 * 1000;  // 溢出！
        System.out.println("微秒数 = " + microseconds);  // 错误结果

        // 解决方案：使用 long 类型
        long microsecondsCorrect = 24L * 60 * 60 * 1000 * 1000;
        System.out.println("正确微秒数 = " + microsecondsCorrect);

        // 陷阱3：中间结果溢出
        int total = 1000000;
        int count = 1000000;
        // int wrong = (total * count) / count;  // 溢出
        long correct = ((long) total * count) / count;

        // Java 8+ 解决方案：使用 Math 类的精确方法
        try {
            int sum = Math.addExact(Integer.MAX_VALUE, 1);
        } catch (ArithmeticException e) {
            System.out.println("检测到溢出: " + e.getMessage());
        }
    }
}
```

### 浮点数精度问题

```java
public class FloatPrecisionPitfall {
    public static void main(String[] args) {
        // 陷阱1：经典的 0.1 + 0.2 问题
        double result = 0.1 + 0.2;
        System.out.println("0.1 + 0.2 = " + result);        // 0.30000000000000004
        System.out.println("0.1 + 0.2 == 0.3: " + (result == 0.3));  // false

        // 陷阱2：循环累加误差
        double sum = 0.0;
        for (int i = 0; i < 10; i++) {
            sum += 0.1;
        }
        System.out.println("0.1 * 10 = " + sum);  // 0.9999999999999999
        System.out.println("sum == 1.0: " + (sum == 1.0));  // false

        // 陷阱3：比较精度
        double a = 1.0 - 0.9;
        double b = 0.1;
        System.out.println("1.0 - 0.9 = " + a);  // 0.09999999999999998
        System.out.println("a == b: " + (a == b));  // false

        // 解决方案
        // 方案1：使用误差范围
        System.out.println("近似相等: " + (Math.abs(a - b) < 1e-10));

        // 方案2：使用 BigDecimal
        BigDecimal bd1 = new BigDecimal("1.0").subtract(new BigDecimal("0.9"));
        BigDecimal bd2 = new BigDecimal("0.1");
        System.out.println("BigDecimal 比较: " + (bd1.compareTo(bd2) == 0));
    }
}
```

### 包装类比较陷阱

```java
public class WrapperComparisonPitfall {
    public static void main(String[] args) {
        // 陷阱1：== 比较缓存范围外的值
        Integer a = 128;
        Integer b = 128;
        System.out.println("a == b: " + (a == b));        // false
        System.out.println("a.equals(b): " + a.equals(b)); // true

        // 陷阱2：缓存范围内的值看起来相等
        Integer c = 100;
        Integer d = 100;
        System.out.println("c == d: " + (c == d));  // true（但这是巧合！）

        // 陷阱3：混合类型比较
        Integer x = 1000;
        Long y = 1000L;
        System.out.println("x.equals(y): " + x.equals(y));  // false！类型不同
        System.out.println("x.intValue() == y: " + (x.intValue() == y));  // true

        // 陷阱4：null 比较
        Integer nullInt = null;
        Integer oneHundred = 100;
        // System.out.println(nullInt == oneHundred);  // false，但可能让人困惑
        // System.out.println(nullInt.equals(oneHundred));  // NullPointerException!

        // 正确做法
        System.out.println(Objects.equals(nullInt, oneHundred));  // false，安全
    }
}
```

### 自动装箱拆箱陷阱

```java
public class AutoBoxingPitfall {
    public static void main(String[] args) {
        // 陷阱1：null 拆箱
        Integer nullInteger = null;
        try {
            int value = nullInteger;  // NullPointerException!
        } catch (NullPointerException e) {
            System.out.println("null 拆箱异常");
        }

        // 陷阱2：三元运算符中的类型提升
        Integer a = 1;
        Integer b = 2;
        Integer c = null;
        // Integer result = true ? a : c;  // 安全
        // Integer result = false ? a : c;  // 返回 null
        // int result = false ? a : c;  // NullPointerException!

        // 陷阱3：性能问题 - 循环中的装箱
        Long sum = 0L;
        for (long i = 0; i < 1000000; i++) {
            sum += i;  // 每次都会创建新的 Long 对象
        }

        // 正确做法
        long sumPrimitive = 0L;
        for (long i = 0; i < 1000000; i++) {
            sumPrimitive += i;  // 无装箱开销
        }

        // 陷阱4：方法重载歧义
        overloaded(100);  // 调用哪个版本？答案是 int 版本
    }

    static void overloaded(int value) {
        System.out.println("int 版本");
    }

    static void overloaded(Integer value) {
        System.out.println("Integer 版本");
    }

    static void overloaded(long value) {
        System.out.println("long 版本");
    }
}
```

### char 类型陷阱

```java
public class CharPitfall {
    public static void main(String[] args) {
        // 陷阱1：char 加法结果是 int
        char c1 = 'a';
        char c2 = 'b';
        // char c3 = c1 + c2;  // 编译错误！结果是 int
        char c3 = (char) (c1 + c2);  // 需要强制转换
        int sum = c1 + c2;  // 195

        // 陷阱2：字符串与 char 的加法
        String s = "Hello" + 'A';  // "HelloA"
        String s2 = 'A' + "Hello"; // "AHello"
        // int n = 'A' + 'B';  // 131（数值相加）
        String s3 = "" + 'A' + 'B';  // "AB"
        String s4 = 'A' + 'B' + "";  // "131"（先数值相加再转字符串）

        System.out.println(s3);  // "AB"
        System.out.println(s4);  // "131"

        // 陷阱3：Unicode 补充字符
        // Java 的 char 是 16 位，无法表示所有 Unicode 字符
        String emoji = "\uD83D\uDE00";  // 笑脸表情需要 2 个 char
        System.out.println("长度: " + emoji.length());  // 2
        System.out.println("码点数: " + emoji.codePointCount(0, emoji.length()));  // 1
    }
}
```

## 性能考量

### 基本类型 vs 包装类性能

```java
public class PerformanceComparison {
    private static final int ITERATIONS = 100_000_000;

    public static void main(String[] args) {
        // 测试基本类型性能
        long startPrimitive = System.nanoTime();
        long sumPrimitive = 0L;
        for (int i = 0; i < ITERATIONS; i++) {
            sumPrimitive += i;
        }
        long endPrimitive = System.nanoTime();
        System.out.printf("基本类型耗时: %.2f ms%n",
            (endPrimitive - startPrimitive) / 1_000_000.0);

        // 测试包装类性能
        long startBoxed = System.nanoTime();
        Long sumBoxed = 0L;
        for (int i = 0; i < ITERATIONS; i++) {
            sumBoxed += i;  // 自动装箱
        }
        long endBoxed = System.nanoTime();
        System.out.printf("包装类型耗时: %.2f ms%n",
            (endBoxed - startBoxed) / 1_000_000.0);

        // 典型结果：包装类型耗时约为基本类型的 5-10 倍
    }
}
```

### 缓存的影响

```java
public class CachePerformance {
    public static void main(String[] args) {
        int iterations = 10_000_000;

        // 缓存范围内
        long startCached = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            Integer a = Integer.valueOf(100);  // 使用缓存
        }
        long endCached = System.nanoTime();

        // 缓存范围外
        long startNotCached = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            Integer b = Integer.valueOf(1000);  // 每次创建新对象
        }
        long endNotCached = System.nanoTime();

        System.out.printf("缓存范围内: %.2f ms%n", (endCached - startCached) / 1_000_000.0);
        System.out.printf("缓存范围外: %.2f ms%n", (endNotCached - startNotCached) / 1_000_000.0);
    }
}
```

### 内存占用对比

```java
public class MemoryComparison {
    public static void main(String[] args) {
        // 基本类型数组
        int[] primitiveArray = new int[1_000_000];
        // 内存占用：约 4MB（1,000,000 * 4 bytes）

        // 包装类数组
        Integer[] boxedArray = new Integer[1_000_000];
        for (int i = 0; i < boxedArray.length; i++) {
            boxedArray[i] = i;
        }
        // 内存占用：约 20MB
        // - 数组本身：~4MB（引用）
        // - Integer 对象：~16MB（每个对象约 16 bytes）

        System.out.println("基本类型数组更节省内存");
    }
}
```

### 性能优化建议

```java
public class PerformanceOptimization {

    // 优化1：使用基本类型数组而非 List<Integer>
    public int sumPrimitive(int[] numbers) {
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        return sum;
    }

    // 优化2：避免不必要的装箱
    public long sumList(List<Integer> numbers) {
        long sum = 0L;  // 使用基本类型累加
        for (int n : numbers) {  // 自动拆箱
            sum += n;
        }
        return sum;
    }

    // 优化3：使用专门的原始类型流（Java 8+）
    public long sumStream(List<Integer> numbers) {
        return numbers.stream()
            .mapToInt(Integer::intValue)  // 转为 IntStream
            .sum();
    }

    // 优化4：使用第三方库（如 Trove、Eclipse Collections）
    // TIntArrayList list = new TIntArrayList();
    // 这些库提供原始类型的集合实现
}
```

## 实战场景

### 场景1：订单金额计算

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
        private BigDecimal discountRate;  // 折扣率
        private BigDecimal taxRate;       // 税率

        public Order(List<OrderItem> items, BigDecimal discountRate, BigDecimal taxRate) {
            this.items = items;
            this.discountRate = discountRate;
            this.taxRate = taxRate;
        }

        // 计算小计
        public BigDecimal calculateSubtotal() {
            return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // 计算折扣
        public BigDecimal calculateDiscount() {
            return calculateSubtotal()
                .multiply(discountRate)
                .setScale(2, RoundingMode.HALF_UP);
        }

        // 计算税费
        public BigDecimal calculateTax() {
            BigDecimal afterDiscount = calculateSubtotal().subtract(calculateDiscount());
            return afterDiscount
                .multiply(taxRate)
                .setScale(2, RoundingMode.HALF_UP);
        }

        // 计算总额
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
            new OrderItem("商品A", new BigDecimal("99.99"), 2),
            new OrderItem("商品B", new BigDecimal("49.50"), 3),
            new OrderItem("商品C", new BigDecimal("199.00"), 1)
        );

        Order order = new Order(items, new BigDecimal("0.1"), new BigDecimal("0.08"));

        System.out.println("小计: " + order.calculateSubtotal());
        System.out.println("折扣: " + order.calculateDiscount());
        System.out.println("税费: " + order.calculateTax());
        System.out.println("总计: " + order.calculateTotal());
    }
}
```

### 场景2：数据库实体与空值处理

```java
import java.util.Objects;
import java.util.Optional;

public class DatabaseEntity {

    public static class User {
        private Long id;           // 数据库主键，可能为 null（新建时）
        private String username;
        private Integer age;       // 可选字段，可能为 null
        private Double score;      // 可选字段，可能为 null
        private Boolean active;    // 可选字段，可能为 null

        // 安全获取 age，避免 NullPointerException
        public int getAgeOrDefault(int defaultAge) {
            return age != null ? age : defaultAge;
        }

        // 使用 Optional 表示可能为空的值
        public Optional<Integer> getAgeOptional() {
            return Optional.ofNullable(age);
        }

        // 安全判断是否成年
        public boolean isAdult() {
            return age != null && age >= 18;
        }

        // 安全的 equals 实现
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

        // 使用建造者模式设置可选字段
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

        // 安全使用
        System.out.println("年龄: " + user.getAgeOrDefault(0));
        System.out.println("是否成年: " + user.isAdult());

        user.getAgeOptional().ifPresent(age ->
            System.out.println("Optional 年龄: " + age));
    }
}
```

### 场景3：高性能数值处理

```java
import java.util.Arrays;
import java.util.concurrent.ThreadLocalRandom;

public class HighPerformanceNumeric {

    // 使用原始类型数组进行高性能计算
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

        // 使用 Kahan 求和算法减少浮点误差
        public static double kahanSum(double[] values) {
            double sum = 0.0;
            double c = 0.0;  // 误差补偿
            for (double v : values) {
                double y = v - c;
                double t = sum + y;
                c = (t - sum) - y;
                sum = t;
            }
            return sum;
        }
    }

    // 位运算优化
    public static class BitOperations {

        // 判断是否为 2 的幂
        public static boolean isPowerOfTwo(int n) {
            return n > 0 && (n & (n - 1)) == 0;
        }

        // 向上取整到最近的 2 的幂
        public static int nextPowerOfTwo(int n) {
            n--;
            n |= n >> 1;
            n |= n >> 2;
            n |= n >> 4;
            n |= n >> 8;
            n |= n >> 16;
            return n + 1;
        }

        // 计算绝对值（无分支）
        public static int abs(int n) {
            int mask = n >> 31;
            return (n ^ mask) - mask;
        }

        // 交换两个数（无临时变量）
        public static void swap(int[] arr, int i, int j) {
            arr[i] ^= arr[j];
            arr[j] ^= arr[i];
            arr[i] ^= arr[j];
        }
    }

    public static void main(String[] args) {
        // 生成测试数据
        double[] values = new double[1_000_000];
        for (int i = 0; i < values.length; i++) {
            values[i] = ThreadLocalRandom.current().nextDouble() * 100;
        }

        // 统计计算
        System.out.printf("平均值: %.4f%n", Statistics.mean(values));
        System.out.printf("标准差: %.4f%n", Statistics.standardDeviation(values));

        double[] minMax = Statistics.minMax(values);
        System.out.printf("最小值: %.4f, 最大值: %.4f%n", minMax[0], minMax[1]);

        // 位运算示例
        System.out.println("16 是 2 的幂: " + BitOperations.isPowerOfTwo(16));
        System.out.println("100 向上取整: " + BitOperations.nextPowerOfTwo(100));
    }
}
```

## 面试要点

### 基本类型相关问题

**问：Java 有哪些基本数据类型？它们的大小和范围是什么？**

答：Java 有 8 种基本数据类型：
- 整数类型：byte(8位)、short(16位)、int(32位)、long(64位)
- 浮点类型：float(32位)、double(64位)
- 字符类型：char(16位，Unicode)
- 布尔类型：boolean

重点：int 范围约 -21 亿到 21 亿，long 范围约 -922 京到 922 京。float 有效位约 7 位，double 有效位约 15-16 位。

**问：为什么 Java 中 0.1 + 0.2 不等于 0.3？**

答：因为浮点数使用 IEEE 754 标准存储，十进制的 0.1 无法用二进制精确表示，存储时会有微小误差。解决方案是使用 BigDecimal 进行精确计算，或使用误差范围进行比较。

### 包装类相关问题

**问：Integer 缓存机制是什么？以下代码输出什么？**

```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);  // ?
System.out.println(c == d);  // ?
```

答：输出 true 和 false。Integer 缓存了 -128 到 127 范围内的值，valueOf 返回缓存的对象。超出范围则每次创建新对象。应该始终使用 equals() 比较包装类。

**问：自动装箱拆箱的实现原理是什么？**

答：编译器在编译时自动插入转换代码：
- 装箱：调用 valueOf() 方法，如 Integer.valueOf(10)
- 拆箱：调用 xxxValue() 方法，如 intValue()

### 类型转换问题

**问：以下代码有什么问题？**

```java
Integer a = null;
int b = a;  // ?
```

答：会抛出 NullPointerException。自动拆箱 null 会调用 null.intValue()，导致空指针异常。应该先进行 null 检查。

**问：short s = 1; s = s + 1; 和 s += 1; 的区别？**

答：
- s = s + 1 编译错误，因为 s + 1 结果是 int，需要显式转换
- s += 1 正常编译，复合赋值运算符包含隐式类型转换

### 综合问题

**问：什么情况下使用基本类型，什么情况下使用包装类？**

答：
- 基本类型：局部变量、性能敏感的计算、不需要 null 的场景
- 包装类：泛型集合、需要表示"无值"(null)的场景、数据库实体字段

**问：如何实现线程安全的计数器？**

```java
// 方案1：使用 synchronized
private int count;
public synchronized void increment() { count++; }

// 方案2：使用 AtomicInteger（推荐）
private AtomicInteger count = new AtomicInteger();
public void increment() { count.incrementAndGet(); }

// 方案3：使用 LongAdder（高并发推荐）
private LongAdder count = new LongAdder();
public void increment() { count.increment(); }
```

## 延伸阅读

### 官方文档

- [Java Language Specification - Types](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html)
- [Java Tutorial - Primitive Data Types](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html)
- [BigDecimal Javadoc](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html)

### 经典书籍

- 《Effective Java》第三版 - Item 61: 基本类型优先于装箱基本类型
- 《Java 核心技术》卷一 - 第 3 章：Java 的基本程序设计结构
- 《深入理解 Java 虚拟机》- 第 2 章：Java 内存区域与内存溢出异常

### 相关主题

- [Java 集合框架](/java/collections) - 了解泛型集合中包装类的使用
- [Java 泛型](/java/generics) - 深入理解泛型与类型擦除
- [Java 并发编程](/java/concurrency) - 原子类与线程安全的数值操作
- [JVM 内存模型](/java/jvm) - 了解基本类型和对象在内存中的存储

### 实用工具

- [JOL (Java Object Layout)](https://openjdk.java.net/projects/code-tools/jol/) - 分析对象内存布局
- [JMH (Java Microbenchmark Harness)](https://openjdk.java.net/projects/code-tools/jmh/) - 性能基准测试
- Eclipse Collections / Trove - 原始类型集合库
