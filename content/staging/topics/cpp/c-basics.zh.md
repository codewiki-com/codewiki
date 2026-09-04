---
title: C 语言基础
description: 全面掌握 C 语言核心基础：数据类型、运算符、控制流、函数与作用域
track: cpp
section: basics
difficulty: beginner
tags:
  - C
  - 基础语法
  - 数据类型
  - 控制流
  - 函数
status: imported
origin: old/src/content/docs/cpp/c-basics.zh.md
divergence: 0.308
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Cpp
  subcategory: C 语言
  order: 0
  lastUpdated: 2026-01-07
---

C 语言诞生于 1972 年，由贝尔实验室的 Dennis Ritchie 设计开发。作为一门系统级编程语言，C 语言以其高效、灵活和接近底层硬件的特性，成为操作系统、嵌入式系统和高性能应用开发的首选语言。本文将全面介绍 C 语言的核心基础知识。

## 概念解释

### 什么是 C 语言？

C 语言是一种通用的、过程式的编程语言，它提供了对底层内存的直接访问能力，同时保持了良好的可移植性。C 语言的设计哲学是"相信程序员"，这意味着它给予程序员极大的自由度，同时也要求程序员承担更多的责任。

### C 语言的特点

1. **简洁高效**：语法简单，编译后的代码执行效率高
2. **可移植性强**：同一份源代码可以在不同平台上编译运行
3. **底层控制**：可以直接操作内存和硬件
4. **丰富的运算符**：提供了丰富的运算符和数据类型
5. **结构化编程**：支持函数、模块化和结构化程序设计

### C 语言的历史地位

C 语言不仅是 UNIX 操作系统的实现语言，也是众多现代编程语言的基础。C++、Java、C#、JavaScript、Python 等语言都深受 C 语言的影响。理解 C 语言有助于深入理解计算机系统的底层工作原理。

## 核心原理

### 编译执行模型

C 语言是编译型语言，源代码需要经过预处理、编译、汇编、链接四个阶段才能生成可执行文件：

```
源代码(.c) → 预处理(.i) → 编译(.s) → 汇编(.o) → 链接 → 可执行文件
```

1. **预处理**：处理以 `#` 开头的指令，如 `#include`、`#define`
2. **编译**：将预处理后的代码转换为汇编代码
3. **汇编**：将汇编代码转换为机器码（目标文件）
4. **链接**：将目标文件与库文件链接，生成可执行文件

### 内存模型

C 程序的内存布局分为以下几个区域：

- **代码段（Text）**：存放程序的机器指令
- **数据段（Data）**：存放已初始化的全局变量和静态变量
- **BSS 段**：存放未初始化的全局变量和静态变量
- **堆（Heap）**：动态分配的内存，由程序员管理
- **栈（Stack）**：存放局部变量、函数参数和返回地址

### 类型系统

C 语言是静态类型语言，变量在编译时必须确定类型。类型系统的核心目的是：

1. **内存分配**：不同类型占用不同大小的内存
2. **数据解释**：同样的二进制位根据类型有不同的解释方式
3. **运算规则**：不同类型有不同的运算规则和隐式转换规则

## 核心要点

### 数据类型

C 语言的数据类型分为基本类型、派生类型和空类型。

#### 基本数据类型

```c
#include <stdio.h>
#include <limits.h>
#include <float.h>

int main() {
    // 整型
    char c = 'A';              // 1 字节，-128 到 127
    short s = 32767;           // 2 字节，-32768 到 32767
    int i = 2147483647;        // 4 字节（通常）
    long l = 2147483647L;      // 4 或 8 字节
    long long ll = 9223372036854775807LL;  // 8 字节

    // 无符号整型
    unsigned char uc = 255;
    unsigned int ui = 4294967295U;

    // 浮点型
    float f = 3.14159f;        // 4 字节，约 6-7 位有效数字
    double d = 3.141592653589; // 8 字节，约 15-16 位有效数字
    long double ld = 3.14159265358979323846L;  // 8-16 字节

    // 打印各类型的大小
    printf("=== 数据类型大小 ===\n");
    printf("char: %zu 字节\n", sizeof(char));
    printf("short: %zu 字节\n", sizeof(short));
    printf("int: %zu 字节\n", sizeof(int));
    printf("long: %zu 字节\n", sizeof(long));
    printf("long long: %zu 字节\n", sizeof(long long));
    printf("float: %zu 字节\n", sizeof(float));
    printf("double: %zu 字节\n", sizeof(double));

    // 打印取值范围
    printf("\n=== 整型取值范围 ===\n");
    printf("char: %d 到 %d\n", CHAR_MIN, CHAR_MAX);
    printf("int: %d 到 %d\n", INT_MIN, INT_MAX);
    printf("unsigned int: 0 到 %u\n", UINT_MAX);

    return 0;
}
```

#### 类型修饰符

```c
#include <stdio.h>

int main() {
    // signed 和 unsigned
    signed int si = -100;      // 有符号（默认）
    unsigned int ui = 100;     // 无符号

    // const - 常量，不可修改
    const double PI = 3.14159265358979;
    // PI = 3.14;  // 错误：不能修改 const 变量

    // volatile - 告诉编译器变量可能被外部修改
    volatile int sensor_value = 0;

    // register - 建议编译器将变量存储在寄存器中
    register int counter = 0;

    // static - 静态变量
    static int static_var = 0;  // 生命周期贯穿整个程序

    printf("signed int: %d\n", si);
    printf("unsigned int: %u\n", ui);
    printf("PI: %.15f\n", PI);

    return 0;
}
```

#### 类型转换

```c
#include <stdio.h>

int main() {
    // 隐式类型转换（自动转换）
    int i = 10;
    double d = i;        // int 自动转换为 double
    printf("隐式转换: int %d -> double %.1f\n", i, d);

    // 整型提升
    char c1 = 100, c2 = 50;
    int result = c1 + c2;  // char 运算时提升为 int
    printf("整型提升: char %d + %d = int %d\n", c1, c2, result);

    // 混合运算中的类型转换
    int a = 5;
    double b = 2.0;
    double c = a / b;    // a 被转换为 double
    printf("混合运算: 5 / 2.0 = %.1f\n", c);

    // 显式类型转换（强制转换）
    double x = 9.7;
    int y = (int)x;      // 截断小数部分
    printf("强制转换: double %.1f -> int %d\n", x, y);

    // 整数除法与浮点除法
    int m = 7, n = 3;
    printf("整数除法: 7 / 3 = %d\n", m / n);
    printf("浮点除法: 7 / 3 = %.2f\n", (double)m / n);

    // 注意：无符号与有符号混合运算
    unsigned int u = 1;
    int s = -2;
    if (u + s > 0) {
        printf("警告: -2 被转换为大的无符号数\n");
    }
    printf("unsigned 1 + signed -2 = %u (作为无符号解释)\n", u + s);

    return 0;
}
```

### 运算符

#### 算术运算符

```c
#include <stdio.h>

int main() {
    int a = 17, b = 5;

    printf("=== 算术运算符 ===\n");
    printf("a = %d, b = %d\n\n", a, b);

    printf("加法: a + b = %d\n", a + b);      // 22
    printf("减法: a - b = %d\n", a - b);      // 12
    printf("乘法: a * b = %d\n", a * b);      // 85
    printf("除法: a / b = %d\n", a / b);      // 3（整数除法）
    printf("取模: a %% b = %d\n", a % b);     // 2（余数）

    // 负数取模
    printf("\n负数取模:\n");
    printf("-17 %% 5 = %d\n", -17 % 5);       // -2
    printf("17 %% -5 = %d\n", 17 % -5);       // 2

    // 自增和自减运算符
    printf("\n=== 自增自减运算符 ===\n");
    int x = 5;
    printf("x 初始值: %d\n", x);
    printf("++x = %d (先增后用)\n", ++x);     // 6
    printf("x++ = %d (先用后增)\n", x++);     // 6
    printf("x 现在的值: %d\n", x);            // 7
    printf("--x = %d (先减后用)\n", --x);     // 6
    printf("x-- = %d (先用后减)\n", x--);     // 6
    printf("x 最终值: %d\n", x);              // 5

    return 0;
}
```

#### 关系运算符和逻辑运算符

```c
#include <stdio.h>

int main() {
    int a = 10, b = 20, c = 10;

    printf("=== 关系运算符 ===\n");
    printf("a = %d, b = %d, c = %d\n\n", a, b, c);

    printf("a == c: %d\n", a == c);   // 1（真）
    printf("a != b: %d\n", a != b);   // 1
    printf("a > b: %d\n", a > b);     // 0（假）
    printf("a < b: %d\n", a < b);     // 1
    printf("a >= c: %d\n", a >= c);   // 1
    printf("a <= b: %d\n", a <= b);   // 1

    printf("\n=== 逻辑运算符 ===\n");
    int x = 1, y = 0;  // 非零为真，零为假

    printf("x = %d (真), y = %d (假)\n\n", x, y);

    printf("逻辑与 (x && y): %d\n", x && y);   // 0
    printf("逻辑或 (x || y): %d\n", x || y);   // 1
    printf("逻辑非 (!x): %d\n", !x);           // 0
    printf("逻辑非 (!y): %d\n", !y);           // 1

    // 短路求值
    printf("\n=== 短路求值 ===\n");
    int n = 0;

    // && 短路：第一个为假时，不计算第二个
    if (0 && (n = 100)) {
        // 不执行
    }
    printf("&& 短路后 n = %d (未被修改)\n", n);

    // || 短路：第一个为真时，不计算第二个
    if (1 || (n = 200)) {
        // 执行
    }
    printf("|| 短路后 n = %d (未被修改)\n", n);

    return 0;
}
```

#### 位运算符

```c
#include <stdio.h>

// 打印二进制表示
void print_binary(unsigned int n, int bits) {
    for (int i = bits - 1; i >= 0; i--) {
        printf("%d", (n >> i) & 1);
        if (i % 4 == 0) printf(" ");
    }
}

int main() {
    unsigned int a = 60;   // 0011 1100
    unsigned int b = 13;   // 0000 1101

    printf("=== 位运算符 ===\n");
    printf("a = %u (", a);
    print_binary(a, 8);
    printf(")\n");
    printf("b = %u (", b);
    print_binary(b, 8);
    printf(")\n\n");

    // 按位与
    printf("a & b = %u (", a & b);
    print_binary(a & b, 8);
    printf(") 按位与\n");

    // 按位或
    printf("a | b = %u (", a | b);
    print_binary(a | b, 8);
    printf(") 按位或\n");

    // 按位异或
    printf("a ^ b = %u (", a ^ b);
    print_binary(a ^ b, 8);
    printf(") 按位异或\n");

    // 按位取反
    printf("~a = %u (取低8位: ", (unsigned char)~a);
    print_binary((unsigned char)~a, 8);
    printf(") 按位取反\n");

    // 左移
    printf("a << 2 = %u (", a << 2);
    print_binary(a << 2, 8);
    printf(") 左移2位\n");

    // 右移
    printf("a >> 2 = %u (", a >> 2);
    print_binary(a >> 2, 8);
    printf(") 右移2位\n");

    // 位运算的实际应用
    printf("\n=== 位运算应用 ===\n");

    // 1. 判断奇偶
    int num = 7;
    printf("%d 是 %s\n", num, (num & 1) ? "奇数" : "偶数");

    // 2. 交换两个数（不使用临时变量）
    int x = 5, y = 9;
    printf("交换前: x = %d, y = %d\n", x, y);
    x = x ^ y;
    y = x ^ y;
    x = x ^ y;
    printf("交换后: x = %d, y = %d\n", x, y);

    // 3. 设置、清除、切换特定位
    unsigned int flags = 0;
    flags |= (1 << 2);    // 设置第2位
    printf("设置第2位: %u\n", flags);
    flags &= ~(1 << 2);   // 清除第2位
    printf("清除第2位: %u\n", flags);
    flags ^= (1 << 3);    // 切换第3位
    printf("切换第3位: %u\n", flags);

    return 0;
}
```

#### 赋值运算符和其他运算符

```c
#include <stdio.h>

int main() {
    printf("=== 赋值运算符 ===\n");

    int a = 10;
    printf("初始值 a = %d\n", a);

    a += 5;   // a = a + 5
    printf("a += 5 -> a = %d\n", a);

    a -= 3;   // a = a - 3
    printf("a -= 3 -> a = %d\n", a);

    a *= 2;   // a = a * 2
    printf("a *= 2 -> a = %d\n", a);

    a /= 4;   // a = a / 4
    printf("a /= 4 -> a = %d\n", a);

    a %= 3;   // a = a % 3
    printf("a %%= 3 -> a = %d\n", a);

    // 位赋值运算符
    a = 12;
    a &= 7;   // a = a & 7
    printf("12 &= 7 -> a = %d\n", a);

    a = 12;
    a |= 3;   // a = a | 3
    printf("12 |= 3 -> a = %d\n", a);

    printf("\n=== 三元运算符 ===\n");
    int x = 10, y = 20;
    int max = (x > y) ? x : y;
    printf("max(%d, %d) = %d\n", x, y, max);

    // 三元运算符嵌套
    int score = 85;
    char grade = (score >= 90) ? 'A' :
                 (score >= 80) ? 'B' :
                 (score >= 70) ? 'C' :
                 (score >= 60) ? 'D' : 'F';
    printf("分数 %d 对应等级: %c\n", score, grade);

    printf("\n=== sizeof 运算符 ===\n");
    printf("sizeof(char) = %zu\n", sizeof(char));
    printf("sizeof(int) = %zu\n", sizeof(int));
    printf("sizeof(double) = %zu\n", sizeof(double));

    int arr[10];
    printf("sizeof(arr) = %zu\n", sizeof(arr));
    printf("数组元素个数 = %zu\n", sizeof(arr) / sizeof(arr[0]));

    printf("\n=== 逗号运算符 ===\n");
    int result = (1 + 2, 3 + 4, 5 + 6);  // 返回最后一个表达式的值
    printf("(1+2, 3+4, 5+6) = %d\n", result);  // 11

    return 0;
}
```

#### 运算符优先级

```c
#include <stdio.h>

int main() {
    printf("=== 运算符优先级 ===\n\n");

    // 优先级示例
    int a = 2 + 3 * 4;      // 乘法优先于加法
    printf("2 + 3 * 4 = %d (乘法优先)\n", a);

    int b = (2 + 3) * 4;    // 括号改变优先级
    printf("(2 + 3) * 4 = %d (括号优先)\n", b);

    // 关系运算符与逻辑运算符
    int x = 5, y = 10, z = 15;
    int c = x < y && y < z;  // 关系运算符优先于逻辑运算符
    printf("5 < 10 && 10 < 15 = %d\n", c);

    // 赋值运算符优先级最低
    int d = 5 + 3 * 2;       // 等价于 d = (5 + (3 * 2))
    printf("d = 5 + 3 * 2 -> d = %d\n", d);

    // 结合性
    int e = 2;
    int f = 3;
    int g = 4;
    e = f = g;               // 右结合：e = (f = g)
    printf("e = f = g = 4 后: e = %d, f = %d, g = %d\n", e, f, g);

    // 常见陷阱
    int h = 1;
    int i = 2;
    // h+++i 被解析为 (h++) + i，而不是 h + (++i)
    int result = h++ + i;
    printf("h++ + i (h=1, i=2): result = %d, h = %d\n", result, h);

    /*
     * 优先级从高到低（常用）：
     * 1. () [] -> .               括号、数组下标、成员访问
     * 2. ! ~ ++ -- + - * & sizeof 单目运算符
     * 3. * / %                    乘除取模
     * 4. + -                      加减
     * 5. << >>                    移位
     * 6. < <= > >=                关系
     * 7. == !=                    相等
     * 8. &                        按位与
     * 9. ^                        按位异或
     * 10. |                       按位或
     * 11. &&                      逻辑与
     * 12. ||                      逻辑或
     * 13. ?:                      条件
     * 14. = += -= ...             赋值
     * 15. ,                       逗号
     */

    printf("\n建议：不确定优先级时使用括号明确表达意图\n");

    return 0;
}
```

### 控制流

#### 条件语句

```c
#include <stdio.h>

int main() {
    printf("=== if-else 语句 ===\n");

    int score = 85;

    // 基本 if 语句
    if (score >= 60) {
        printf("及格了！\n");
    }

    // if-else 语句
    if (score >= 90) {
        printf("优秀\n");
    } else {
        printf("继续努力\n");
    }

    // if-else if-else 语句
    if (score >= 90) {
        printf("等级: A\n");
    } else if (score >= 80) {
        printf("等级: B\n");
    } else if (score >= 70) {
        printf("等级: C\n");
    } else if (score >= 60) {
        printf("等级: D\n");
    } else {
        printf("等级: F\n");
    }

    // 嵌套 if
    int age = 25;
    int hasLicense = 1;

    if (age >= 18) {
        if (hasLicense) {
            printf("可以驾驶\n");
        } else {
            printf("需要先考驾照\n");
        }
    } else {
        printf("未成年，不能驾驶\n");
    }

    printf("\n=== switch 语句 ===\n");

    int day = 3;

    switch (day) {
        case 1:
            printf("星期一\n");
            break;
        case 2:
            printf("星期二\n");
            break;
        case 3:
            printf("星期三\n");
            break;
        case 4:
            printf("星期四\n");
            break;
        case 5:
            printf("星期五\n");
            break;
        case 6:
        case 7:
            printf("周末\n");
            break;
        default:
            printf("无效的日期\n");
            break;
    }

    // switch 的 fall-through 特性
    char grade = 'B';
    printf("\n等级 %c 的评价: ", grade);

    switch (grade) {
        case 'A':
            printf("杰出 ");
            // fall through
        case 'B':
            printf("优秀 ");
            // fall through
        case 'C':
            printf("良好 ");
            // fall through
        case 'D':
            printf("及格\n");
            break;
        case 'F':
            printf("不及格\n");
            break;
        default:
            printf("无效等级\n");
    }

    return 0;
}
```

#### 循环语句

```c
#include <stdio.h>

int main() {
    printf("=== for 循环 ===\n");

    // 基本 for 循环
    printf("1 到 5: ");
    for (int i = 1; i <= 5; i++) {
        printf("%d ", i);
    }
    printf("\n");

    // 递减循环
    printf("5 到 1: ");
    for (int i = 5; i >= 1; i--) {
        printf("%d ", i);
    }
    printf("\n");

    // 步长为 2
    printf("偶数 (2-10): ");
    for (int i = 2; i <= 10; i += 2) {
        printf("%d ", i);
    }
    printf("\n");

    // 多个循环变量
    printf("双变量: ");
    for (int i = 0, j = 10; i < j; i++, j--) {
        printf("(%d,%d) ", i, j);
    }
    printf("\n");

    // 嵌套循环 - 乘法表
    printf("\n九九乘法表:\n");
    for (int i = 1; i <= 9; i++) {
        for (int j = 1; j <= i; j++) {
            printf("%d*%d=%2d ", j, i, i * j);
        }
        printf("\n");
    }

    printf("\n=== while 循环 ===\n");

    // 基本 while 循环
    int count = 1;
    printf("while 循环: ");
    while (count <= 5) {
        printf("%d ", count);
        count++;
    }
    printf("\n");

    // 计算数字位数
    int num = 12345;
    int digits = 0;
    int temp = num;
    while (temp > 0) {
        digits++;
        temp /= 10;
    }
    printf("%d 有 %d 位数字\n", num, digits);

    printf("\n=== do-while 循环 ===\n");

    // do-while 至少执行一次
    int n = 0;
    do {
        printf("n = %d (至少执行一次)\n", n);
        n++;
    } while (n < 0);  // 条件为假，但已执行一次

    // 输入验证示例
    int input = -1;
    int attempts = 0;
    printf("模拟输入验证 (假设输入了正数后退出):\n");
    do {
        // 模拟输入
        input = attempts + 1;
        printf("  第 %d 次: 输入 = %d\n", attempts + 1, input);
        attempts++;
    } while (input <= 0 && attempts < 3);

    return 0;
}
```

#### 跳转语句

```c
#include <stdio.h>

int main() {
    printf("=== break 语句 ===\n");

    // 在循环中使用 break
    printf("查找第一个能被 7 整除的数: ");
    for (int i = 1; i <= 100; i++) {
        if (i % 7 == 0) {
            printf("%d\n", i);
            break;  // 找到后退出循环
        }
    }

    // break 只跳出最内层循环
    printf("嵌套循环中的 break:\n");
    for (int i = 1; i <= 3; i++) {
        printf("外层 i = %d: ", i);
        for (int j = 1; j <= 5; j++) {
            if (j == 3) {
                break;  // 只跳出内层循环
            }
            printf("j=%d ", j);
        }
        printf("\n");
    }

    printf("\n=== continue 语句 ===\n");

    // 跳过某些迭代
    printf("1-10 中的奇数: ");
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) {
            continue;  // 跳过偶数
        }
        printf("%d ", i);
    }
    printf("\n");

    // 在 while 中使用 continue
    printf("跳过 3 的倍数 (1-10): ");
    int n = 0;
    while (n < 10) {
        n++;
        if (n % 3 == 0) {
            continue;
        }
        printf("%d ", n);
    }
    printf("\n");

    printf("\n=== goto 语句 (不推荐使用) ===\n");

    // goto 可以跳出多层嵌套循环
    int found = 0;
    printf("使用 goto 跳出多层循环:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            for (int k = 0; k < 3; k++) {
                printf("检查 (%d,%d,%d)\n", i, j, k);
                if (i == 1 && j == 1 && k == 1) {
                    found = 1;
                    goto exit_loops;  // 跳出所有循环
                }
            }
        }
    }

exit_loops:
    if (found) {
        printf("在 (1,1,1) 找到目标\n");
    }

    // 更好的替代方案：使用标志变量
    printf("\n使用标志变量替代 goto:\n");
    found = 0;
    for (int i = 0; i < 3 && !found; i++) {
        for (int j = 0; j < 3 && !found; j++) {
            for (int k = 0; k < 3 && !found; k++) {
                if (i == 1 && j == 1 && k == 1) {
                    found = 1;
                    printf("在 (%d,%d,%d) 找到目标\n", i, j, k);
                }
            }
        }
    }

    return 0;
}
```

### 函数

#### 函数的定义和调用

```c
#include <stdio.h>

// 函数声明（原型）
int add(int a, int b);
void print_message(const char *msg);
double calculate_average(int arr[], int size);

// 无参数无返回值的函数
void greet(void) {
    printf("Hello, World!\n");
}

// 有参数有返回值的函数
int add(int a, int b) {
    return a + b;
}

// 多个参数
int max3(int a, int b, int c) {
    int max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    return max;
}

// void 返回类型
void print_message(const char *msg) {
    printf("消息: %s\n", msg);
}

// 数组作为参数（实际传递的是指针）
double calculate_average(int arr[], int size) {
    if (size <= 0) return 0.0;

    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += arr[i];
    }
    return (double)sum / size;
}

// 返回多个值（通过指针参数）
void minmax(int arr[], int size, int *min, int *max) {
    if (size <= 0) return;

    *min = *max = arr[0];
    for (int i = 1; i < size; i++) {
        if (arr[i] < *min) *min = arr[i];
        if (arr[i] > *max) *max = arr[i];
    }
}

int main() {
    printf("=== 函数调用 ===\n\n");

    // 调用无参函数
    greet();

    // 调用有返回值的函数
    int sum = add(10, 20);
    printf("10 + 20 = %d\n", sum);

    // 调用多参数函数
    printf("max(5, 12, 8) = %d\n", max3(5, 12, 8));

    // 调用 void 函数
    print_message("函数演示");

    // 数组参数
    int numbers[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    printf("平均值 = %.2f\n", calculate_average(numbers, n));

    // 通过指针返回多个值
    int min, max;
    minmax(numbers, n, &min, &max);
    printf("最小值 = %d, 最大值 = %d\n", min, max);

    return 0;
}
```

#### 参数传递

```c
#include <stdio.h>

// 值传递 - 函数内的修改不影响原变量
void swap_wrong(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
    printf("  函数内: a = %d, b = %d\n", a, b);
}

// 指针传递 - 可以修改原变量
void swap_correct(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

// 数组传递（本质是指针传递）
void modify_array(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;  // 修改会影响原数组
    }
}

// const 参数 - 防止意外修改
void print_array(const int arr[], int size) {
    // arr[0] = 100;  // 错误：不能修改 const 数组
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

int main() {
    printf("=== 值传递 vs 指针传递 ===\n\n");

    // 值传递的问题
    int x = 5, y = 10;
    printf("交换前: x = %d, y = %d\n", x, y);
    printf("调用 swap_wrong:\n");
    swap_wrong(x, y);
    printf("交换后: x = %d, y = %d (未改变!)\n\n", x, y);

    // 正确的指针传递
    printf("调用 swap_correct:\n");
    swap_correct(&x, &y);
    printf("交换后: x = %d, y = %d (已交换)\n\n", x, y);

    // 数组传递
    printf("=== 数组传递 ===\n");
    int arr[] = {1, 2, 3, 4, 5};
    int n = sizeof(arr) / sizeof(arr[0]);

    printf("修改前: ");
    print_array(arr, n);

    modify_array(arr, n);

    printf("修改后: ");
    print_array(arr, n);

    return 0;
}
```

#### 递归函数

```c
#include <stdio.h>

// 阶乘 - 经典递归示例
long long factorial(int n) {
    // 基本情况
    if (n <= 1) {
        return 1;
    }
    // 递归情况
    return n * factorial(n - 1);
}

// 斐波那契数列 - 递归（效率低）
int fibonacci_recursive(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2);
}

// 斐波那契数列 - 迭代（效率高）
long long fibonacci_iterative(int n) {
    if (n <= 1) return n;

    long long prev2 = 0, prev1 = 1, curr;
    for (int i = 2; i <= n; i++) {
        curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return curr;
}

// 最大公约数 - 欧几里得算法
int gcd(int a, int b) {
    if (b == 0) {
        return a;
    }
    return gcd(b, a % b);
}

// 汉诺塔
void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        printf("将盘子 1 从 %c 移动到 %c\n", from, to);
        return;
    }
    hanoi(n - 1, from, aux, to);
    printf("将盘子 %d 从 %c 移动到 %c\n", n, from, to);
    hanoi(n - 1, aux, to, from);
}

// 打印递归调用过程
void print_factorial_trace(int n, int depth) {
    // 打印缩进
    for (int i = 0; i < depth; i++) printf("  ");

    printf("factorial(%d)\n", n);

    if (n <= 1) {
        for (int i = 0; i < depth; i++) printf("  ");
        printf("返回 1\n");
        return;
    }

    print_factorial_trace(n - 1, depth + 1);

    for (int i = 0; i < depth; i++) printf("  ");
    printf("返回 %d * factorial(%d) = %lld\n", n, n - 1, (long long)n * factorial(n - 1));
}

int main() {
    printf("=== 递归函数 ===\n\n");

    // 阶乘
    printf("阶乘:\n");
    for (int i = 0; i <= 10; i++) {
        printf("%d! = %lld\n", i, factorial(i));
    }

    // 阶乘调用过程
    printf("\n阶乘递归调用过程 (n=4):\n");
    print_factorial_trace(4, 0);

    // 斐波那契
    printf("\n斐波那契数列 (前15项):\n");
    for (int i = 0; i < 15; i++) {
        printf("%lld ", fibonacci_iterative(i));
    }
    printf("\n");

    // 最大公约数
    printf("\n最大公约数:\n");
    printf("gcd(48, 18) = %d\n", gcd(48, 18));
    printf("gcd(100, 35) = %d\n", gcd(100, 35));

    // 汉诺塔
    printf("\n汉诺塔 (3个盘子):\n");
    hanoi(3, 'A', 'C', 'B');

    return 0;
}
```

### 作用域

#### 变量的作用域

```c
#include <stdio.h>

// 全局变量 - 整个程序可见
int global_var = 100;

// 静态全局变量 - 仅当前文件可见
static int file_scope_var = 200;

void demonstrate_scope(void);
void modify_static(void);

int main() {
    printf("=== 变量作用域 ===\n\n");

    // 全局变量
    printf("全局变量 global_var = %d\n", global_var);

    // 局部变量 - 块作用域
    int local_var = 10;
    printf("局部变量 local_var = %d\n", local_var);

    // 块作用域
    {
        int block_var = 20;
        printf("块内变量 block_var = %d\n", block_var);

        // 内层可以访问外层变量
        printf("块内访问 local_var = %d\n", local_var);

        // 内层变量可以遮蔽外层变量
        int local_var = 30;  // 遮蔽外层的 local_var
        printf("遮蔽后 local_var = %d\n", local_var);
    }
    // block_var 在这里不可见

    // 外层的 local_var 恢复可见
    printf("块外 local_var = %d\n", local_var);

    // for 循环中的作用域
    printf("\nfor 循环作用域:\n");
    for (int i = 0; i < 3; i++) {
        int loop_var = i * 10;
        printf("i = %d, loop_var = %d\n", i, loop_var);
    }
    // i 和 loop_var 在循环外不可见

    // 调用函数演示
    printf("\n");
    demonstrate_scope();

    return 0;
}

void demonstrate_scope(void) {
    // 函数内可以访问全局变量
    printf("函数内访问全局变量: %d\n", global_var);

    // 可以访问文件作用域变量
    printf("函数内访问文件作用域变量: %d\n", file_scope_var);

    // 修改全局变量
    global_var = 150;
    printf("修改后的全局变量: %d\n", global_var);
}
```

#### 生命周期与存储类别

```c
#include <stdio.h>
#include <stdlib.h>

// 全局变量 - 静态存储期
int global_count = 0;

// 函数内的静态变量
void count_calls(void) {
    static int call_count = 0;  // 只初始化一次
    call_count++;
    printf("函数被调用了 %d 次\n", call_count);
}

// 演示 auto 存储类（默认）
void auto_demo(void) {
    auto int x = 10;  // auto 是默认的，通常省略
    printf("auto 变量 x = %d\n", x);
}

// 演示 register 存储类
void register_demo(void) {
    register int counter;  // 建议存储在寄存器中
    int sum = 0;

    for (counter = 0; counter < 1000000; counter++) {
        sum += counter;
    }
    printf("使用 register 变量计算的和: %d\n", sum);
}

// 演示静态局部变量
int generate_id(void) {
    static int id = 0;  // 保持值在函数调用之间
    return ++id;
}

// 演示 extern（外部链接）
extern int external_var;  // 声明在其他文件中定义的变量

// 在本文件中定义
int external_var = 42;

int main() {
    printf("=== 存储类别 ===\n\n");

    // 静态局部变量演示
    printf("静态局部变量:\n");
    for (int i = 0; i < 5; i++) {
        count_calls();
    }

    // ID 生成器
    printf("\nID 生成器:\n");
    for (int i = 0; i < 5; i++) {
        printf("生成的 ID: %d\n", generate_id());
    }

    // auto 存储类
    printf("\nauto 存储类:\n");
    auto_demo();

    // register 存储类
    printf("\nregister 存储类:\n");
    register_demo();

    // extern 变量
    printf("\nextern 变量 = %d\n", external_var);

    // 动态分配的内存（堆）
    printf("\n动态内存分配:\n");
    int *heap_var = (int*)malloc(sizeof(int));
    if (heap_var != NULL) {
        *heap_var = 999;
        printf("堆上的变量 = %d\n", *heap_var);
        free(heap_var);
        heap_var = NULL;
    }

    /*
     * 存储类别总结：
     *
     * 1. auto（自动）
     *    - 默认的局部变量存储类
     *    - 存储在栈上
     *    - 函数结束时自动销毁
     *
     * 2. static（静态）
     *    - 局部静态：保持值在函数调用之间
     *    - 全局静态：限制为文件作用域
     *    - 存储在数据段
     *
     * 3. register（寄存器）
     *    - 建议编译器存储在 CPU 寄存器中
     *    - 不能取地址
     *    - 现代编译器通常忽略
     *
     * 4. extern（外部）
     *    - 声明在其他地方定义的变量
     *    - 用于多文件程序
     */

    return 0;
}
```

#### 作用域规则总结

```c
#include <stdio.h>

// 全局作用域
int global = 1;

void func1(void);
void func2(int param);

int main() {
    printf("=== 作用域规则总结 ===\n\n");

    int local = 2;  // 函数作用域

    printf("1. 全局变量 global = %d\n", global);
    printf("2. 局部变量 local = %d\n", local);

    {
        int block = 3;  // 块作用域
        int local = 4;  // 遮蔽外层 local

        printf("3. 块内变量 block = %d\n", block);
        printf("4. 遮蔽的 local = %d\n", local);
    }

    printf("5. 块外 local = %d (恢复)\n", local);

    func1();
    func2(10);

    /*
     * 作用域查找规则：从内向外
     *
     * 1. 先在当前块中查找
     * 2. 然后在包含它的块中查找
     * 3. 继续向外，直到函数作用域
     * 4. 最后查找全局作用域
     *
     * 变量遮蔽（Shadowing）：
     * - 内层作用域的同名变量会遮蔽外层变量
     * - 遮蔽不会改变外层变量的值
     * - 离开内层作用域后，外层变量恢复可见
     */

    return 0;
}

void func1(void) {
    // 不同函数有独立的局部作用域
    int local = 100;
    printf("6. func1 的 local = %d\n", local);
    printf("7. func1 访问全局 global = %d\n", global);
}

void func2(int param) {
    // 参数也是局部变量
    printf("8. func2 的参数 param = %d\n", param);

    static int static_local = 0;
    static_local++;
    printf("9. 静态局部变量 = %d\n", static_local);
}
```

## 代码示例

### 综合示例：简易计算器

```c
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

// 函数声明
double add(double a, double b);
double subtract(double a, double b);
double multiply(double a, double b);
double divide(double a, double b);
double power(double base, double exp);
void print_menu(void);
double get_number(const char *prompt);
char get_operator(void);

int main() {
    printf("=== 简易计算器 ===\n\n");

    int running = 1;

    while (running) {
        print_menu();

        int choice;
        printf("请选择操作 (1-7): ");
        if (scanf("%d", &choice) != 1) {
            printf("输入无效！\n\n");
            while (getchar() != '\n');  // 清除输入缓冲区
            continue;
        }

        if (choice == 7) {
            printf("感谢使用，再见！\n");
            running = 0;
            continue;
        }

        if (choice < 1 || choice > 6) {
            printf("无效选择！\n\n");
            continue;
        }

        double a = get_number("输入第一个数: ");
        double b = get_number("输入第二个数: ");
        double result;

        switch (choice) {
            case 1:
                result = add(a, b);
                printf("%.2f + %.2f = %.2f\n", a, b, result);
                break;
            case 2:
                result = subtract(a, b);
                printf("%.2f - %.2f = %.2f\n", a, b, result);
                break;
            case 3:
                result = multiply(a, b);
                printf("%.2f * %.2f = %.2f\n", a, b, result);
                break;
            case 4:
                if (b == 0) {
                    printf("错误：除数不能为零！\n");
                } else {
                    result = divide(a, b);
                    printf("%.2f / %.2f = %.2f\n", a, b, result);
                }
                break;
            case 5:
                result = fmod(a, b);
                printf("%.2f %% %.2f = %.2f\n", a, b, result);
                break;
            case 6:
                result = power(a, b);
                printf("%.2f ^ %.2f = %.2f\n", a, b, result);
                break;
        }
        printf("\n");
    }

    return 0;
}

// 函数定义
double add(double a, double b) {
    return a + b;
}

double subtract(double a, double b) {
    return a - b;
}

double multiply(double a, double b) {
    return a * b;
}

double divide(double a, double b) {
    return a / b;
}

double power(double base, double exp) {
    return pow(base, exp);
}

void print_menu(void) {
    printf("========== 菜单 ==========\n");
    printf("1. 加法 (+)\n");
    printf("2. 减法 (-)\n");
    printf("3. 乘法 (*)\n");
    printf("4. 除法 (/)\n");
    printf("5. 取模 (%%)\n");
    printf("6. 幂运算 (^)\n");
    printf("7. 退出\n");
    printf("===========================\n");
}

double get_number(const char *prompt) {
    double num;
    printf("%s", prompt);
    while (scanf("%lf", &num) != 1) {
        printf("输入无效，请重新输入: ");
        while (getchar() != '\n');
    }
    return num;
}
```

### 综合示例：学生成绩管理

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_STUDENTS 100
#define MAX_NAME_LEN 50

// 学生结构体
typedef struct {
    int id;
    char name[MAX_NAME_LEN];
    float score;
} Student;

// 全局变量
static Student students[MAX_STUDENTS];
static int student_count = 0;

// 函数声明
void add_student(void);
void display_all(void);
void search_student(void);
void calculate_statistics(void);
void sort_by_score(int ascending);
void print_student(const Student *s);

int main() {
    printf("=== 学生成绩管理系统 ===\n\n");

    int choice;
    int running = 1;

    while (running) {
        printf("\n========== 菜单 ==========\n");
        printf("1. 添加学生\n");
        printf("2. 显示所有学生\n");
        printf("3. 搜索学生\n");
        printf("4. 成绩统计\n");
        printf("5. 按成绩排序（升序）\n");
        printf("6. 按成绩排序（降序）\n");
        printf("0. 退出\n");
        printf("===========================\n");
        printf("请选择: ");

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n');
            printf("输入无效！\n");
            continue;
        }

        switch (choice) {
            case 1:
                add_student();
                break;
            case 2:
                display_all();
                break;
            case 3:
                search_student();
                break;
            case 4:
                calculate_statistics();
                break;
            case 5:
                sort_by_score(1);
                printf("已按成绩升序排序\n");
                display_all();
                break;
            case 6:
                sort_by_score(0);
                printf("已按成绩降序排序\n");
                display_all();
                break;
            case 0:
                running = 0;
                printf("再见！\n");
                break;
            default:
                printf("无效选择！\n");
        }
    }

    return 0;
}

void add_student(void) {
    if (student_count >= MAX_STUDENTS) {
        printf("学生数量已达上限！\n");
        return;
    }

    Student *s = &students[student_count];

    printf("输入学号: ");
    scanf("%d", &s->id);

    printf("输入姓名: ");
    scanf("%s", s->name);

    printf("输入成绩: ");
    while (scanf("%f", &s->score) != 1 || s->score < 0 || s->score > 100) {
        printf("成绩必须在 0-100 之间，请重新输入: ");
        while (getchar() != '\n');
    }

    student_count++;
    printf("添加成功！\n");
}

void display_all(void) {
    if (student_count == 0) {
        printf("暂无学生数据\n");
        return;
    }

    printf("\n%-10s %-20s %-10s\n", "学号", "姓名", "成绩");
    printf("----------------------------------------\n");

    for (int i = 0; i < student_count; i++) {
        print_student(&students[i]);
    }
}

void search_student(void) {
    if (student_count == 0) {
        printf("暂无学生数据\n");
        return;
    }

    int id;
    printf("输入要查找的学号: ");
    scanf("%d", &id);

    for (int i = 0; i < student_count; i++) {
        if (students[i].id == id) {
            printf("\n找到学生:\n");
            printf("%-10s %-20s %-10s\n", "学号", "姓名", "成绩");
            print_student(&students[i]);
            return;
        }
    }

    printf("未找到学号为 %d 的学生\n", id);
}

void calculate_statistics(void) {
    if (student_count == 0) {
        printf("暂无学生数据\n");
        return;
    }

    float sum = 0, max = students[0].score, min = students[0].score;
    int pass_count = 0;

    for (int i = 0; i < student_count; i++) {
        sum += students[i].score;
        if (students[i].score > max) max = students[i].score;
        if (students[i].score < min) min = students[i].score;
        if (students[i].score >= 60) pass_count++;
    }

    printf("\n========== 成绩统计 ==========\n");
    printf("学生总数: %d\n", student_count);
    printf("平均分: %.2f\n", sum / student_count);
    printf("最高分: %.2f\n", max);
    printf("最低分: %.2f\n", min);
    printf("及格人数: %d (%.1f%%)\n", pass_count,
           (float)pass_count / student_count * 100);
    printf("================================\n");
}

void sort_by_score(int ascending) {
    for (int i = 0; i < student_count - 1; i++) {
        for (int j = 0; j < student_count - i - 1; j++) {
            int should_swap = ascending
                ? (students[j].score > students[j + 1].score)
                : (students[j].score < students[j + 1].score);

            if (should_swap) {
                Student temp = students[j];
                students[j] = students[j + 1];
                students[j + 1] = temp;
            }
        }
    }
}

void print_student(const Student *s) {
    printf("%-10d %-20s %-10.2f\n", s->id, s->name, s->score);
}
```

## 最佳实践

### 命名规范

```c
// 变量命名 - 使用有意义的名称
int student_count;      // 好：描述性名称
int sc;                 // 差：含义不清

// 常量命名 - 使用大写和下划线
#define MAX_BUFFER_SIZE 1024
const int MAX_STUDENTS = 100;

// 函数命名 - 动词开头，描述功能
void calculate_average(void);
int is_valid_input(int value);
void print_error_message(const char *msg);

// 类型命名 - 使用 _t 后缀或首字母大写
typedef struct student Student;
typedef int size_t;
```

### 代码格式化

```c
// 使用一致的缩进（推荐 4 空格）
if (condition) {
    do_something();
    do_another_thing();
}

// 大括号风格（K&R 风格）
int function(int arg) {
    if (arg > 0) {
        return arg;
    } else {
        return -arg;
    }
}

// 适当的空格
int a = b + c;          // 运算符两侧加空格
func(a, b, c);          // 逗号后加空格
for (int i = 0; i < n; i++)  // 分号后加空格
```

### 函数设计原则

```c
// 单一职责 - 每个函数只做一件事
void print_header(void);        // 只打印头部
void process_data(int *data);   // 只处理数据
void save_result(FILE *fp);     // 只保存结果

// 函数长度 - 控制在 50 行以内
// 参数数量 - 最好不超过 4 个

// 使用 const 保护不应修改的参数
void process(const int *data, int size);

// 明确的返回值
int validate_input(int value) {
    if (value < 0) return -1;   // 错误码
    if (value > 100) return -2;
    return 0;                    // 成功
}
```

### 错误处理

```c
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

// 检查返回值
FILE *fp = fopen("data.txt", "r");
if (fp == NULL) {
    fprintf(stderr, "错误: 无法打开文件 - %s\n", strerror(errno));
    return -1;
}

// 使用错误码
#define SUCCESS 0
#define ERR_INVALID_INPUT -1
#define ERR_OUT_OF_MEMORY -2

int process_data(int *data, int size) {
    if (data == NULL || size <= 0) {
        return ERR_INVALID_INPUT;
    }

    int *buffer = malloc(size * sizeof(int));
    if (buffer == NULL) {
        return ERR_OUT_OF_MEMORY;
    }

    // 处理数据...

    free(buffer);
    return SUCCESS;
}

// 使用 assert 进行调试时的检查
#include <assert.h>
void divide(int a, int b) {
    assert(b != 0);  // 在调试版本中检查
    printf("%d / %d = %d\n", a, b, a / b);
}
```

## 常见陷阱

### 整数溢出

```c
#include <stdio.h>
#include <limits.h>

int main() {
    // 陷阱：整数溢出
    int a = INT_MAX;
    printf("INT_MAX = %d\n", a);
    printf("INT_MAX + 1 = %d (溢出!)\n", a + 1);

    // 解决方案：检查溢出
    int b = 1000000000;
    int c = 2000000000;

    // 加法溢出检查
    if (b > INT_MAX - c) {
        printf("加法会溢出！\n");
    }

    // 乘法溢出检查
    int x = 100000;
    int y = 100000;
    if (x > INT_MAX / y) {
        printf("乘法会溢出！\n");
    }

    // 使用更大的类型
    long long safe_result = (long long)x * y;
    printf("安全计算: %lld\n", safe_result);

    return 0;
}
```

### 浮点数精度问题

```c
#include <stdio.h>
#include <math.h>
#include <float.h>

int main() {
    // 陷阱：直接比较浮点数
    double a = 0.1 + 0.2;
    double b = 0.3;

    printf("0.1 + 0.2 = %.17f\n", a);
    printf("0.3       = %.17f\n", b);

    if (a == b) {
        printf("相等\n");
    } else {
        printf("不相等 (精度问题!)\n");
    }

    // 解决方案：使用误差范围比较
    double epsilon = 1e-9;
    if (fabs(a - b) < epsilon) {
        printf("在误差范围内相等\n");
    }

    // 使用 DBL_EPSILON
    if (fabs(a - b) < DBL_EPSILON * fmax(fabs(a), fabs(b)) * 10) {
        printf("相对误差比较：相等\n");
    }

    return 0;
}
```

### 未初始化的变量

```c
#include <stdio.h>

int main() {
    // 陷阱：使用未初始化的局部变量
    int x;  // 未初始化，值是随机的
    // printf("x = %d\n", x);  // 未定义行为！

    // 解决方案：始终初始化变量
    int a = 0;
    int b = 10;
    int c;

    // 如果后面会赋值，在使用前确保已赋值
    if (a > 0) {
        c = a;
    } else {
        c = b;  // 确保所有分支都初始化
    }
    printf("c = %d\n", c);

    // 数组初始化
    int arr1[5] = {0};           // 全部初始化为 0
    int arr2[5] = {1, 2};        // 部分初始化，其余为 0
    int arr3[] = {1, 2, 3, 4};   // 编译器推断大小

    return 0;
}
```

### 数组越界

```c
#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};

    // 陷阱：数组越界访问
    // arr[5] = 10;  // 越界！可能导致程序崩溃或数据损坏
    // arr[-1] = 0;  // 负索引也是越界！

    // 解决方案：边界检查
    int index = 3;
    int size = sizeof(arr) / sizeof(arr[0]);

    if (index >= 0 && index < size) {
        printf("arr[%d] = %d\n", index, arr[index]);
    } else {
        printf("索引越界！\n");
    }

    // 安全的数组遍历
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    return 0;
}
```

### 悬空指针和内存泄漏

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // 陷阱 1：悬空指针
    int *ptr = malloc(sizeof(int));
    *ptr = 42;
    free(ptr);
    // printf("%d\n", *ptr);  // 危险！ptr 现在是悬空指针

    // 解决方案：释放后置为 NULL
    ptr = NULL;

    // 陷阱 2：内存泄漏
    for (int i = 0; i < 1000; i++) {
        int *leak = malloc(1024);
        // 忘记 free(leak);  // 内存泄漏！
        free(leak);  // 正确：及时释放
    }

    // 陷阱 3：重复释放
    int *p = malloc(sizeof(int));
    free(p);
    // free(p);  // 危险！重复释放
    p = NULL;
    free(p);  // 安全：free(NULL) 是允许的

    // 陷阱 4：返回局部变量的地址
    // int *bad_function(void) {
    //     int local = 10;
    //     return &local;  // 危险！local 在函数返回后被销毁
    // }

    return 0;
}
```

## 性能考量

### 循环优化

```c
#include <stdio.h>
#include <time.h>

#define SIZE 10000000

// 低效：每次循环都计算长度
void inefficient_loop(int arr[], int size) {
    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += arr[i];
    }
}

// 优化：循环展开
void optimized_loop(int arr[], int size) {
    int sum = 0;
    int i;

    // 每次处理 4 个元素
    for (i = 0; i + 3 < size; i += 4) {
        sum += arr[i];
        sum += arr[i + 1];
        sum += arr[i + 2];
        sum += arr[i + 3];
    }

    // 处理剩余元素
    for (; i < size; i++) {
        sum += arr[i];
    }
}

// 优化：减少分支
int count_positive_branchy(int arr[], int size) {
    int count = 0;
    for (int i = 0; i < size; i++) {
        if (arr[i] > 0) {
            count++;
        }
    }
    return count;
}

// 无分支版本
int count_positive_branchless(int arr[], int size) {
    int count = 0;
    for (int i = 0; i < size; i++) {
        count += (arr[i] > 0);  // 布尔值直接相加
    }
    return count;
}
```

### 数据结构选择

```c
/*
 * 数组 vs 链表
 *
 * 数组：
 * - 随机访问 O(1)
 * - 缓存友好
 * - 插入/删除 O(n)
 *
 * 链表：
 * - 随机访问 O(n)
 * - 缓存不友好
 * - 插入/删除 O(1)（已知位置）
 *
 * 选择原则：
 * - 频繁随机访问：使用数组
 * - 频繁插入删除：考虑链表
 * - 大多数情况：数组更快（缓存效应）
 */

// 结构体对齐优化
struct Bad {
    char a;      // 1 字节
    // 填充 7 字节
    double b;    // 8 字节
    char c;      // 1 字节
    // 填充 7 字节
};  // 总大小：24 字节

struct Good {
    double b;    // 8 字节
    char a;      // 1 字节
    char c;      // 1 字节
    // 填充 6 字节
};  // 总大小：16 字节
```

### 函数调用开销

```c
#include <stdio.h>

// 小函数可以用宏替代（但注意副作用）
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

// 使用 inline（C99）建议内联
static inline int square(int x) {
    return x * x;
}

// 避免在循环中调用重型函数
int slow_function(int x) {
    // 假设这是一个耗时操作
    return x * x + x + 1;
}

void optimized(int arr[], int size) {
    // 差：每次循环调用函数
    // for (int i = 0; i < size; i++) {
    //     arr[i] = slow_function(i);
    // }

    // 好：批量处理或缓存结果
    int *cache = malloc(size * sizeof(int));
    for (int i = 0; i < size; i++) {
        cache[i] = slow_function(i);
    }
    for (int i = 0; i < size; i++) {
        arr[i] = cache[i];
    }
    free(cache);
}
```

## 实战场景

### 场景 1：文件处理

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_LINE_LENGTH 1024

// 统计文件中的行数、单词数、字符数
void count_file_stats(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("无法打开文件");
        return;
    }

    int lines = 0, words = 0, chars = 0;
    char line[MAX_LINE_LENGTH];

    while (fgets(line, sizeof(line), fp)) {
        lines++;
        chars += strlen(line);

        // 统计单词
        char *token = strtok(line, " \t\n");
        while (token != NULL) {
            words++;
            token = strtok(NULL, " \t\n");
        }
    }

    printf("文件: %s\n", filename);
    printf("行数: %d\n", lines);
    printf("单词数: %d\n", words);
    printf("字符数: %d\n", chars);

    fclose(fp);
}

// 复制文件
int copy_file(const char *src, const char *dst) {
    FILE *source = fopen(src, "rb");
    if (source == NULL) {
        return -1;
    }

    FILE *dest = fopen(dst, "wb");
    if (dest == NULL) {
        fclose(source);
        return -1;
    }

    char buffer[4096];
    size_t bytes;

    while ((bytes = fread(buffer, 1, sizeof(buffer), source)) > 0) {
        if (fwrite(buffer, 1, bytes, dest) != bytes) {
            fclose(source);
            fclose(dest);
            return -1;
        }
    }

    fclose(source);
    fclose(dest);
    return 0;
}
```

### 场景 2：命令行参数处理

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void print_usage(const char *program_name) {
    printf("用法: %s [选项]\n", program_name);
    printf("选项:\n");
    printf("  -h, --help     显示帮助信息\n");
    printf("  -v, --version  显示版本信息\n");
    printf("  -n <数字>      指定一个数字\n");
    printf("  -f <文件>      指定输入文件\n");
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    int number = 0;
    char *filename = NULL;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        }
        else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--version") == 0) {
            printf("版本 1.0.0\n");
            return 0;
        }
        else if (strcmp(argv[i], "-n") == 0) {
            if (i + 1 < argc) {
                number = atoi(argv[++i]);
            } else {
                fprintf(stderr, "错误: -n 需要一个参数\n");
                return 1;
            }
        }
        else if (strcmp(argv[i], "-f") == 0) {
            if (i + 1 < argc) {
                filename = argv[++i];
            } else {
                fprintf(stderr, "错误: -f 需要一个参数\n");
                return 1;
            }
        }
        else {
            fprintf(stderr, "未知选项: %s\n", argv[i]);
            print_usage(argv[0]);
            return 1;
        }
    }

    printf("解析结果:\n");
    printf("  数字: %d\n", number);
    printf("  文件: %s\n", filename ? filename : "未指定");

    return 0;
}
```

### 场景 3：简单数据结构实现

```c
#include <stdio.h>
#include <stdlib.h>

// 动态数组实现
typedef struct {
    int *data;
    int size;
    int capacity;
} DynamicArray;

DynamicArray* da_create(int initial_capacity) {
    DynamicArray *arr = malloc(sizeof(DynamicArray));
    if (arr == NULL) return NULL;

    arr->data = malloc(initial_capacity * sizeof(int));
    if (arr->data == NULL) {
        free(arr);
        return NULL;
    }

    arr->size = 0;
    arr->capacity = initial_capacity;
    return arr;
}

void da_destroy(DynamicArray *arr) {
    if (arr) {
        free(arr->data);
        free(arr);
    }
}

int da_resize(DynamicArray *arr, int new_capacity) {
    int *new_data = realloc(arr->data, new_capacity * sizeof(int));
    if (new_data == NULL) return -1;

    arr->data = new_data;
    arr->capacity = new_capacity;
    return 0;
}

int da_push(DynamicArray *arr, int value) {
    if (arr->size >= arr->capacity) {
        if (da_resize(arr, arr->capacity * 2) != 0) {
            return -1;
        }
    }
    arr->data[arr->size++] = value;
    return 0;
}

int da_get(DynamicArray *arr, int index) {
    if (index < 0 || index >= arr->size) {
        fprintf(stderr, "索引越界\n");
        exit(1);
    }
    return arr->data[index];
}

void da_print(DynamicArray *arr) {
    printf("[");
    for (int i = 0; i < arr->size; i++) {
        printf("%d", arr->data[i]);
        if (i < arr->size - 1) printf(", ");
    }
    printf("] (size=%d, capacity=%d)\n", arr->size, arr->capacity);
}

int main() {
    DynamicArray *arr = da_create(4);

    printf("动态数组演示:\n");

    for (int i = 1; i <= 10; i++) {
        da_push(arr, i * 10);
        da_print(arr);
    }

    printf("\n访问元素:\n");
    printf("arr[0] = %d\n", da_get(arr, 0));
    printf("arr[5] = %d\n", da_get(arr, 5));

    da_destroy(arr);

    return 0;
}
```

## 面试要点

### 基础概念题

**Q: C 语言中 `sizeof` 运算符的返回类型是什么？**

```c
// A: sizeof 返回 size_t 类型（无符号整数）
#include <stdio.h>
int main() {
    printf("sizeof 返回类型大小: %zu\n", sizeof(sizeof(int)));
    // 使用 %zu 格式化 size_t
    return 0;
}
```

**Q: 解释 `const int *p` 和 `int * const p` 的区别**

```c
int a = 10, b = 20;

const int *p1 = &a;  // 指向常量的指针
// *p1 = 15;         // 错误：不能修改指向的值
p1 = &b;             // 正确：可以修改指针本身

int * const p2 = &a; // 常量指针
*p2 = 15;            // 正确：可以修改指向的值
// p2 = &b;          // 错误：不能修改指针本身

const int * const p3 = &a;  // 指向常量的常量指针
// 两者都不能修改
```

### 程序输出题

**Q: 以下程序的输出是什么？**

```c
#include <stdio.h>

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int *p = arr;

    printf("%d\n", *p++);    // 输出 1，然后 p 指向 arr[1]
    printf("%d\n", ++*p);    // 输出 3（arr[1] 增加到 3）
    printf("%d\n", *++p);    // p 先移到 arr[2]，输出 3
    printf("%d\n", (*p)++);  // 输出 3，然后 arr[2] 变为 4

    return 0;
}
// 输出：1, 3, 3, 3
```

### 编程实现题

**Q: 实现一个函数，反转字符串（原地反转）**

```c
#include <stdio.h>
#include <string.h>

void reverse_string(char *str) {
    if (str == NULL || *str == '\0') return;

    int left = 0;
    int right = strlen(str) - 1;

    while (left < right) {
        char temp = str[left];
        str[left] = str[right];
        str[right] = temp;
        left++;
        right--;
    }
}

int main() {
    char str[] = "Hello, World!";
    printf("原始字符串: %s\n", str);

    reverse_string(str);
    printf("反转后: %s\n", str);

    return 0;
}
```

**Q: 实现 atoi 函数**

```c
#include <stdio.h>
#include <limits.h>
#include <ctype.h>

int my_atoi(const char *str) {
    if (str == NULL) return 0;

    // 跳过前导空格
    while (isspace(*str)) str++;

    // 处理符号
    int sign = 1;
    if (*str == '-') {
        sign = -1;
        str++;
    } else if (*str == '+') {
        str++;
    }

    // 转换数字
    long result = 0;
    while (isdigit(*str)) {
        result = result * 10 + (*str - '0');

        // 检查溢出
        if (result * sign > INT_MAX) return INT_MAX;
        if (result * sign < INT_MIN) return INT_MIN;

        str++;
    }

    return (int)(result * sign);
}

int main() {
    printf("my_atoi(\"42\") = %d\n", my_atoi("42"));
    printf("my_atoi(\"   -42\") = %d\n", my_atoi("   -42"));
    printf("my_atoi(\"4193 with words\") = %d\n", my_atoi("4193 with words"));

    return 0;
}
```

### 概念理解题

**Q: 解释 C 语言中的"未定义行为"（Undefined Behavior）**

```c
// 未定义行为的例子：

// 1. 数组越界
int arr[5];
arr[10] = 100;  // UB

// 2. 使用未初始化的变量
int x;
printf("%d", x);  // UB

// 3. 解引用空指针
int *p = NULL;
*p = 10;  // UB

// 4. 有符号整数溢出
int a = INT_MAX;
a = a + 1;  // UB（无符号整数溢出是定义好的）

// 5. 修改字符串字面量
char *s = "hello";
s[0] = 'H';  // UB

// 未定义行为可能导致：
// - 程序崩溃
// - 产生错误结果
// - 看起来正常工作（最危险！）
// - 不同编译器/平台表现不同
```

## 延伸阅读

### 推荐书籍

1. **《C程序设计语言》（K&R）** - Brian W. Kernighan, Dennis M. Ritchie
   - C 语言的"圣经"，由语言设计者编写
   - 适合有一定基础后深入学习

2. **《C和指针》** - Kenneth A. Reek
   - 深入讲解指针和内存管理
   - 包含大量练习题

3. **《C专家编程》** - Peter van der Linden
   - 深入C语言的高级特性和陷阱
   - 适合进阶学习

4. **《C陷阱与缺陷》** - Andrew Koenig
   - 总结C语言常见错误
   - 帮助避免常见陷阱

### 在线资源

- **cppreference.com** - C 语言标准库完整参考
- **GNU C Library Manual** - glibc 官方文档
- **CERT C Coding Standard** - 安全编码规范

### 相关主题

- **指针与内存管理** - 深入理解指针操作和动态内存分配
- **预处理器** - 宏定义、条件编译等高级用法
- **文件I/O** - 文件操作和格式化输入输出
- **数据结构** - 使用 C 实现常见数据结构
- **系统编程** - POSIX API 和系统调用

## 总结

C 语言作为一门经典的系统级编程语言，其核心基础包括：

1. **数据类型**：理解各种数据类型的大小、范围和用途
2. **运算符**：掌握算术、关系、逻辑、位运算符的使用
3. **控制流**：熟练使用条件语句和循环语句
4. **函数**：理解函数定义、参数传递和递归
5. **作用域**：理解变量的作用域和生命周期

掌握这些基础知识是学习 C 语言的第一步。在此基础上，还需要深入学习指针、内存管理、文件操作等高级主题，才能真正成为一名合格的 C 程序员。

**学习建议**：
- 多写代码，多调试，理解程序的执行过程
- 注意警告信息，养成良好的编程习惯
- 理解底层原理，不要死记硬背语法规则
- 多阅读优秀的开源代码，学习最佳实践
