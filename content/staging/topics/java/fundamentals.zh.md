---
title: Java 语言基础
description: 深入理解 Java 数据类型、变量、运算符与控制流
track: java
section: basics
difficulty: beginner
tags:
  - Java
  - 基础
  - 数据类型
  - 控制流
status: imported
origin: old/src/content/docs/java/fundamentals.zh.md
divergence: 0.209
issues: []
legacy:
  category: Java
  subcategory: 语言基础
  order: 1
  lastUpdated: 2026-01-07
---

Java 是一门面向对象的编程语言，具有强类型、跨平台等特性。本文将深入介绍 Java 的基础知识，包括数据类型、变量、运算符、控制流、数组和字符串等核心概念。

## 数据类型

Java 的数据类型分为两大类：**基本数据类型**（Primitive Types）和**引用数据类型**（Reference Types）。

### 基本数据类型

Java 提供了 8 种基本数据类型：

#### 整数类型

```java
// byte: 8位有符号整数，范围 -128 到 127
byte age = 25;

// short: 16位有符号整数，范围 -32,768 到 32,767
short year = 2026;

// int: 32位有符号整数，范围 -2^31 到 2^31-1
int population = 1000000;

// long: 64位有符号整数，范围 -2^63 到 2^63-1
long distanceToSun = 149600000000L; // 注意后缀 L
```

#### 浮点类型

```java
// float: 32位单精度浮点数
float price = 19.99f; // 注意后缀 f

// double: 64位双精度浮点数（默认）
double pi = 3.141592653589793;
```

#### 字符类型

```java
// char: 16位 Unicode 字符
char grade = 'A';
char chineseChar = '中';
char unicodeChar = '\u4e2d'; // Unicode 表示
```

#### 布尔类型

```java
// boolean: true 或 false
boolean isJavaFun = true;
boolean isRaining = false;
```

### 引用数据类型

引用类型包括类（Class）、接口（Interface）、数组（Array）等。

```java
// 字符串（String 类）
String greeting = "Hello, Java!";

// 数组
int[] numbers = {1, 2, 3, 4, 5};

// 对象
Object obj = new Object();
```

### 类型转换

#### 自动类型转换（隐式转换）

从小范围类型到大范围类型的转换是自动的：

```java
byte b = 10;
int i = b;        // byte -> int 自动转换
long l = i;       // int -> long 自动转换
float f = l;      // long -> float 自动转换
double d = f;     // float -> double 自动转换
```

#### 强制类型转换（显式转换）

从大范围类型到小范围类型需要强制转换：

```java
double d = 100.5;
int i = (int) d;           // 100，小数部分被截断
long l = 200L;
int j = (int) l;           // 可能会丢失精度

// 注意精度损失
int largeInt = 130;
byte smallByte = (byte) largeInt; // -126，溢出
```

## 变量

变量是存储数据的容器，必须先声明后使用。

### 变量声明与初始化

```java
// 声明
int count;

// 初始化
count = 0;

// 声明并初始化
int score = 100;

// 多个变量声明
int x = 1, y = 2, z = 3;

// 常量声明（使用 final 关键字）
final double PI = 3.14159;
final int MAX_SIZE = 100;
```

### 变量命名规则

```java
// 合法的变量名
int age;
int studentAge;
int student_age;
int $price;
int _count;

// 不合法的变量名
// int 2fast;        // 不能以数字开头
// int student-age;  // 不能包含连字符
// int class;        // 不能使用关键字
```

### 变量作用域

```java
public class VariableScope {
    // 成员变量（实例变量）
    private int instanceVar = 10;

    // 静态变量（类变量）
    private static int classVar = 20;

    public void method() {
        // 局部变量
        int localVar = 30;

        if (true) {
            // 块级作用域
            int blockVar = 40;
            System.out.println(blockVar); // 正常访问
        }
        // System.out.println(blockVar); // 错误：超出作用域
    }
}
```

## 运算符

Java 提供了丰富的运算符用于各种操作。

### 算术运算符

```java
int a = 10, b = 3;

// 基本算术运算
int sum = a + b;        // 13 加法
int diff = a - b;       // 7  减法
int product = a * b;    // 30 乘法
int quotient = a / b;   // 3  除法（整数除法）
int remainder = a % b;  // 1  取模（取余）

// 浮点除法
double result = 10.0 / 3.0; // 3.3333...

// 自增自减
int x = 5;
x++;        // x = 6，后自增
++x;        // x = 7，前自增
x--;        // x = 6，后自减
--x;        // x = 5，前自减

// 前缀与后缀的区别
int y = 5;
int z = y++;  // z = 5, y = 6（先赋值后自增）
int w = ++y;  // w = 7, y = 7（先自增后赋值）
```

### 赋值运算符

```java
int num = 10;

num += 5;   // num = num + 5;  结果：15
num -= 3;   // num = num - 3;  结果：12
num *= 2;   // num = num * 2;  结果：24
num /= 4;   // num = num / 4;  结果：6
num %= 4;   // num = num % 4;  结果：2
```

### 比较运算符

```java
int a = 10, b = 20;

boolean result1 = (a == b);  // false 等于
boolean result2 = (a != b);  // true  不等于
boolean result3 = (a > b);   // false 大于
boolean result4 = (a < b);   // true  小于
boolean result5 = (a >= b);  // false 大于等于
boolean result6 = (a <= b);  // true  小于等于

// 字符串比较应使用 equals 方法
String str1 = "Hello";
String str2 = "Hello";
boolean isEqual = str1.equals(str2); // true
```

### 逻辑运算符

```java
boolean a = true, b = false;

// 逻辑与（AND）
boolean and = a && b;  // false

// 逻辑或（OR）
boolean or = a || b;   // true

// 逻辑非（NOT）
boolean not = !a;      // false

// 短路特性
int x = 5;
boolean result = (x > 10) && (++x > 0); // 第二个表达式不执行
System.out.println(x); // 输出 5

// 非短路运算符
boolean result2 = (x > 10) & (++x > 0); // 两个表达式都执行
System.out.println(x); // 输出 6
```

### 位运算符

```java
int a = 60;  // 0011 1100
int b = 13;  // 0000 1101

int and = a & b;   // 0000 1100 = 12  按位与
int or = a | b;    // 0011 1101 = 61  按位或
int xor = a ^ b;   // 0011 0001 = 49  按位异或
int not = ~a;      // 1100 0011 = -61 按位取反

int leftShift = a << 2;   // 1111 0000 = 240  左移
int rightShift = a >> 2;  // 0000 1111 = 15   右移
int unsignedRight = a >>> 2; // 无符号右移
```

### 三元运算符

```java
int a = 10, b = 20;

// 语法：条件 ? 值1 : 值2
int max = (a > b) ? a : b;  // 20

String status = (age >= 18) ? "成年" : "未成年";

// 嵌套使用
int score = 85;
String grade = (score >= 90) ? "A" :
               (score >= 80) ? "B" :
               (score >= 70) ? "C" : "D";
```

### 运算符优先级

```java
int result = 2 + 3 * 4;        // 14，乘法优先
int result2 = (2 + 3) * 4;     // 20，括号优先

boolean b = 5 > 3 && 10 < 20;  // true
boolean b2 = !false && true;   // true，! 优先于 &&
```

## 控制流

控制流语句决定程序的执行顺序。

### 条件语句

#### if 语句

```java
int score = 85;

// 简单 if
if (score >= 60) {
    System.out.println("及格");
}

// if-else
if (score >= 60) {
    System.out.println("及格");
} else {
    System.out.println("不及格");
}

// if-else if-else
if (score >= 90) {
    System.out.println("优秀");
} else if (score >= 80) {
    System.out.println("良好");
} else if (score >= 70) {
    System.out.println("中等");
} else if (score >= 60) {
    System.out.println("及格");
} else {
    System.out.println("不及格");
}

// 嵌套 if
int age = 20;
boolean hasLicense = true;

if (age >= 18) {
    if (hasLicense) {
        System.out.println("可以驾驶");
    } else {
        System.out.println("需要驾照");
    }
} else {
    System.out.println("年龄不够");
}
```

#### switch 语句

```java
int dayOfWeek = 3;

// 传统 switch
switch (dayOfWeek) {
    case 1:
        System.out.println("星期一");
        break;
    case 2:
        System.out.println("星期二");
        break;
    case 3:
        System.out.println("星期三");
        break;
    case 4:
        System.out.println("星期四");
        break;
    case 5:
        System.out.println("星期五");
        break;
    case 6:
    case 7:
        System.out.println("周末");
        break;
    default:
        System.out.println("无效的日期");
}

// switch 支持的类型
String fruit = "苹果";
switch (fruit) {
    case "苹果":
        System.out.println("Apple");
        break;
    case "香蕉":
        System.out.println("Banana");
        break;
    default:
        System.out.println("Unknown");
}

// Java 14+ 新式 switch 表达式
String dayType = switch (dayOfWeek) {
    case 1, 2, 3, 4, 5 -> "工作日";
    case 6, 7 -> "周末";
    default -> "无效";
};
```

### 循环语句

#### for 循环

```java
// 基本 for 循环
for (int i = 0; i < 5; i++) {
    System.out.println("i = " + i);
}

// 多个变量
for (int i = 0, j = 10; i < j; i++, j--) {
    System.out.println("i = " + i + ", j = " + j);
}

// 无限循环
for (;;) {
    // 需要 break 跳出
    break;
}

// 增强 for 循环（for-each）
int[] numbers = {1, 2, 3, 4, 5};
for (int num : numbers) {
    System.out.println(num);
}

String[] names = {"Alice", "Bob", "Charlie"};
for (String name : names) {
    System.out.println(name);
}
```

#### while 循环

```java
// while 循环
int count = 0;
while (count < 5) {
    System.out.println("count = " + count);
    count++;
}

// 无限循环
while (true) {
    // 需要 break 跳出
    break;
}

// 读取输入示例
Scanner scanner = new Scanner(System.in);
String input = "";
while (!input.equals("quit")) {
    System.out.print("输入命令（quit 退出）：");
    input = scanner.nextLine();
    System.out.println("你输入了：" + input);
}
```

#### do-while 循环

```java
// do-while 循环（至少执行一次）
int num = 0;
do {
    System.out.println("num = " + num);
    num++;
} while (num < 5);

// 菜单示例
Scanner scanner = new Scanner(System.in);
int choice;
do {
    System.out.println("1. 选项 1");
    System.out.println("2. 选项 2");
    System.out.println("0. 退出");
    System.out.print("请选择：");
    choice = scanner.nextInt();

    switch (choice) {
        case 1:
            System.out.println("执行选项 1");
            break;
        case 2:
            System.out.println("执行选项 2");
            break;
        case 0:
            System.out.println("退出程序");
            break;
        default:
            System.out.println("无效选择");
    }
} while (choice != 0);
```

### 跳转语句

#### break 语句

```java
// 跳出循环
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // 跳出循环
    }
    System.out.println(i);
}

// 跳出多重循环（使用标签）
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1 && j == 1) {
            break outer; // 跳出外层循环
        }
        System.out.println("i = " + i + ", j = " + j);
    }
}
```

#### continue 语句

```java
// 跳过本次迭代
for (int i = 0; i < 10; i++) {
    if (i % 2 == 0) {
        continue; // 跳过偶数
    }
    System.out.println(i); // 只打印奇数
}

// 带标签的 continue
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) {
            continue outer; // 继续外层循环
        }
        System.out.println("i = " + i + ", j = " + j);
    }
}
```

#### return 语句

```java
public class ReturnExample {
    // 返回值
    public static int add(int a, int b) {
        return a + b;
    }

    // 提前返回
    public static String checkAge(int age) {
        if (age < 0) {
            return "年龄无效";
        }
        if (age < 18) {
            return "未成年";
        }
        return "成年";
    }

    // void 方法中的 return
    public static void printPositive(int num) {
        if (num <= 0) {
            return; // 提前结束方法
        }
        System.out.println(num);
    }
}
```

## 数组

数组是存储相同类型数据的容器，大小固定。

### 数组声明与初始化

```java
// 声明数组
int[] numbers;      // 推荐方式
int numbers2[];     // 也可以，但不推荐

// 创建数组
numbers = new int[5]; // 创建长度为 5 的数组，默认值为 0

// 声明并初始化
int[] scores = {90, 85, 88, 92, 78};

// 分步初始化
int[] ages = new int[3];
ages[0] = 20;
ages[1] = 25;
ages[2] = 30;

// 使用 new 关键字并初始化
int[] values = new int[]{1, 2, 3, 4, 5};

// 其他类型数组
String[] names = {"Alice", "Bob", "Charlie"};
double[] prices = {19.99, 29.99, 39.99};
boolean[] flags = new boolean[10]; // 默认值为 false
```

### 访问数组元素

```java
int[] numbers = {10, 20, 30, 40, 50};

// 访问元素（索引从 0 开始）
int first = numbers[0];   // 10
int last = numbers[4];    // 50

// 修改元素
numbers[2] = 35;

// 获取数组长度
int length = numbers.length; // 5

// 遍历数组
for (int i = 0; i < numbers.length; i++) {
    System.out.println("numbers[" + i + "] = " + numbers[i]);
}

// 使用增强 for 循环
for (int num : numbers) {
    System.out.println(num);
}
```

### 多维数组

```java
// 二维数组声明
int[][] matrix;

// 初始化二维数组
int[][] grid = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// 创建二维数组
int[][] table = new int[3][4]; // 3 行 4 列

// 访问元素
int element = grid[1][2]; // 6（第 2 行第 3 列）

// 修改元素
table[0][0] = 100;

// 遍历二维数组
for (int i = 0; i < grid.length; i++) {
    for (int j = 0; j < grid[i].length; j++) {
        System.out.print(grid[i][j] + " ");
    }
    System.out.println();
}

// 增强 for 循环遍历
for (int[] row : grid) {
    for (int value : row) {
        System.out.print(value + " ");
    }
    System.out.println();
}

// 不规则数组（锯齿数组）
int[][] jagged = new int[3][];
jagged[0] = new int[2];
jagged[1] = new int[4];
jagged[2] = new int[3];
```

### 数组操作

```java
import java.util.Arrays;

int[] numbers = {5, 2, 8, 1, 9};

// 数组复制
int[] copy1 = numbers.clone();
int[] copy2 = Arrays.copyOf(numbers, numbers.length);
int[] copy3 = Arrays.copyOfRange(numbers, 1, 4); // {2, 8, 1}

// 数组排序
Arrays.sort(numbers); // {1, 2, 5, 8, 9}

// 数组填充
int[] filled = new int[5];
Arrays.fill(filled, 10); // {10, 10, 10, 10, 10}

// 数组比较
int[] arr1 = {1, 2, 3};
int[] arr2 = {1, 2, 3};
boolean isEqual = Arrays.equals(arr1, arr2); // true

// 数组转字符串
String str = Arrays.toString(numbers); // "[1, 2, 5, 8, 9]"

// 二分查找（数组必须有序）
int[] sorted = {1, 3, 5, 7, 9};
int index = Arrays.binarySearch(sorted, 5); // 2
```

### 数组常见算法

```java
public class ArrayAlgorithms {
    // 查找最大值
    public static int findMax(int[] arr) {
        int max = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    }

    // 查找最小值
    public static int findMin(int[] arr) {
        int min = arr[0];
        for (int num : arr) {
            if (num < min) {
                min = num;
            }
        }
        return min;
    }

    // 计算平均值
    public static double calculateAverage(int[] arr) {
        int sum = 0;
        for (int num : arr) {
            sum += num;
        }
        return (double) sum / arr.length;
    }

    // 反转数组
    public static void reverse(int[] arr) {
        for (int i = 0; i < arr.length / 2; i++) {
            int temp = arr[i];
            arr[i] = arr[arr.length - 1 - i];
            arr[arr.length - 1 - i] = temp;
        }
    }

    // 线性查找
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1; // 未找到
    }
}
```

## 字符串

字符串是 Java 中最常用的类之一，用于处理文本数据。

### 字符串创建

```java
// 字面量方式（推荐）
String str1 = "Hello, World!";

// 使用 new 关键字
String str2 = new String("Hello, World!");

// 从字符数组创建
char[] chars = {'J', 'a', 'v', 'a'};
String str3 = new String(chars);

// 从字节数组创建
byte[] bytes = {72, 101, 108, 108, 111};
String str4 = new String(bytes); // "Hello"

// 空字符串
String empty1 = "";
String empty2 = new String();
```

### 字符串特性

```java
// 字符串不可变
String s1 = "Hello";
String s2 = s1; // s2 引用同一个对象
s1 = "World";   // s1 引用新对象，s2 仍然是 "Hello"

// 字符串池（String Pool）
String a = "Java";
String b = "Java";
String c = new String("Java");

System.out.println(a == b);        // true（同一个对象）
System.out.println(a == c);        // false（不同对象）
System.out.println(a.equals(c));   // true（内容相同）
```

### 字符串常用方法

#### 获取信息

```java
String str = "Hello, Java!";

// 长度
int length = str.length(); // 12

// 判断是否为空
boolean isEmpty = str.isEmpty(); // false
boolean isBlank = str.isBlank(); // false（Java 11+）

// 获取字符
char ch = str.charAt(0);    // 'H'
char last = str.charAt(str.length() - 1); // '!'

// 获取子字符串
String sub1 = str.substring(7);      // "Java!"
String sub2 = str.substring(0, 5);   // "Hello"
```

#### 查找与判断

```java
String text = "Java Programming";

// 包含判断
boolean contains = text.contains("Program"); // true

// 开头和结尾
boolean startsWith = text.startsWith("Java");   // true
boolean endsWith = text.endsWith("ming");       // true

// 查找位置
int index1 = text.indexOf("a");           // 1（第一次出现）
int index2 = text.indexOf("a", 2);        // 3（从索引 2 开始）
int index3 = text.lastIndexOf("a");       // 3（最后一次出现）
int notFound = text.indexOf("Python");    // -1（未找到）
```

#### 比较

```java
String s1 = "Hello";
String s2 = "hello";
String s3 = "Hello";

// 区分大小写比较
boolean equals1 = s1.equals(s2);         // false
boolean equals2 = s1.equals(s3);         // true

// 忽略大小写比较
boolean equalsIgnore = s1.equalsIgnoreCase(s2); // true

// 字典序比较
int compare1 = s1.compareTo(s3);         // 0（相等）
int compare2 = s1.compareTo(s2);         // -32（s1 < s2）
int compare3 = s1.compareToIgnoreCase(s2); // 0
```

#### 修改（返回新字符串）

```java
String original = "  Hello, World!  ";

// 大小写转换
String upper = original.toUpperCase();    // "  HELLO, WORLD!  "
String lower = original.toLowerCase();    // "  hello, world!  "

// 去除空白
String trimmed = original.trim();         // "Hello, World!"
String stripped = original.strip();       // "Hello, World!"（Java 11+）

// 替换
String replaced1 = original.replace("World", "Java");
String replaced2 = original.replaceAll("\\s+", " "); // 正则替换
String replaced3 = original.replaceFirst("l", "L");

// 分割
String csv = "Apple,Banana,Orange";
String[] fruits = csv.split(","); // {"Apple", "Banana", "Orange"}

String sentence = "Hello World Java";
String[] words = sentence.split("\\s+"); // {"Hello", "World", "Java"}
```

#### 拼接

```java
// 使用 + 运算符
String greeting = "Hello" + ", " + "World!";

// 使用 concat 方法
String result = "Hello".concat(" ").concat("World!");

// 使用 join 方法（Java 8+）
String joined = String.join(", ", "Apple", "Banana", "Orange");
// "Apple, Banana, Orange"

String[] words = {"Java", "is", "fun"};
String sentence = String.join(" ", words); // "Java is fun"
```

### StringBuilder 和 StringBuffer

对于频繁修改的字符串，使用 StringBuilder 或 StringBuffer 更高效。

```java
// StringBuilder（非线程安全，性能更好）
StringBuilder sb = new StringBuilder();

// 追加
sb.append("Hello");
sb.append(" ");
sb.append("World");

// 插入
sb.insert(5, ","); // "Hello, World"

// 删除
sb.delete(5, 6);   // "Hello World"

// 替换
sb.replace(0, 5, "Hi"); // "Hi World"

// 反转
sb.reverse(); // "dlroW iH"

// 转换为 String
String result = sb.toString();

// StringBuffer（线程安全）
StringBuffer sbf = new StringBuffer("Hello");
sbf.append(" World");
String str = sbf.toString(); // "Hello World"
```

### 字符串格式化

```java
// 使用 String.format
String name = "Alice";
int age = 25;
double score = 95.5;

String formatted = String.format("姓名：%s，年龄：%d，成绩：%.2f",
                                 name, age, score);
// "姓名：Alice，年龄：25，成绩：95.50"

// 格式说明符
String s1 = String.format("%s", "文本");           // 字符串
String s2 = String.format("%d", 100);             // 十进制整数
String s3 = String.format("%f", 3.14);            // 浮点数
String s4 = String.format("%.2f", 3.14159);       // 保留 2 位小数
String s5 = String.format("%10s", "right");       // 右对齐，宽度 10
String s6 = String.format("%-10s", "left");       // 左对齐，宽度 10
String s7 = String.format("%,d", 1000000);        // 千分位：1,000,000

// 使用 printf（直接打印）
System.out.printf("姓名：%s，年龄：%d%n", name, age);

// 文本块（Java 15+）
String json = """
    {
        "name": "Alice",
        "age": 25,
        "city": "Beijing"
    }
    """;
```

### 字符串常见操作示例

```java
public class StringExamples {
    // 判断回文字符串
    public static boolean isPalindrome(String str) {
        str = str.toLowerCase().replaceAll("[^a-z0-9]", "");
        int left = 0, right = str.length() - 1;
        while (left < right) {
            if (str.charAt(left) != str.charAt(right)) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    // 统计字符出现次数
    public static int countOccurrences(String str, char ch) {
        int count = 0;
        for (int i = 0; i < str.length(); i++) {
            if (str.charAt(i) == ch) {
                count++;
            }
        }
        return count;
    }

    // 反转字符串
    public static String reverse(String str) {
        return new StringBuilder(str).reverse().toString();
    }

    // 首字母大写
    public static String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("A man a plan a canal Panama")); // true
        System.out.println(countOccurrences("Hello", 'l')); // 2
        System.out.println(reverse("Hello")); // "olleH"
        System.out.println(capitalize("java")); // "Java"
    }
}
```

## 总结

本文详细介绍了 Java 语言的基础知识：

1. **数据类型**：包括 8 种基本类型和引用类型，以及类型转换
2. **变量**：变量的声明、初始化、命名规则和作用域
3. **运算符**：算术、赋值、比较、逻辑、位运算符等
4. **控制流**：if、switch、for、while、do-while 等控制语句
5. **数组**：一维和多维数组的创建、操作和常见算法
6. **字符串**：String 类的创建、常用方法和 StringBuilder/StringBuffer

掌握这些基础知识是学习 Java 的第一步，为后续学习面向对象编程、集合框架、异常处理等高级特性打下坚实基础。建议通过大量练习和实际项目来巩固这些知识点。
