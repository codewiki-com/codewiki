---
title: C 语言数组与字符串
description: 全面掌握 C 语言数组：一维数组、多维数组、字符数组与字符串函数
track: cpp
section: basics
difficulty: intermediate
tags:
  - C
  - 数组
  - 字符串
  - 内存
status: imported
origin: old/src/content/docs/cpp/c-arrays.zh.md
divergence: 0.199
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: C 语言
  order: 3
  lastUpdated: 2026-01-07
---

数组是 C 语言中最基础的数据结构之一，用于存储相同类型的元素集合。字符串在 C 语言中以字符数组的形式实现，理解这两者的关系对于掌握 C 语言至关重要。

## 概念解释

### 什么是数组？

数组是一种线性数据结构，它在内存中分配一块连续的存储空间，用于存放相同类型的多个元素。每个元素通过索引（下标）访问，索引从 0 开始。

**数组的特点：**
- 元素类型相同
- 内存连续分配
- 大小固定（静态数组）
- 支持随机访问（O(1) 时间复杂度）

### 什么是字符串？

在 C 语言中，字符串是以空字符 `\0`（ASCII 值为 0）结尾的字符数组。C 语言没有内置的字符串类型，而是使用字符数组来表示和操作字符串。

```c
// 字符数组 vs 字符串
char arr[] = {'H', 'e', 'l', 'l', 'o'};     // 字符数组，5个字符
char str[] = {'H', 'e', 'l', 'l', 'o', '\0'}; // 字符串，6个字符
char str2[] = "Hello";                        // 字符串字面量，自动添加 \0
```

### 历史背景

数组的概念源自数学中的向量和矩阵。C 语言继承了 B 语言的数组设计理念，将数组名视为指向第一个元素的指针。这种设计既简洁又高效，但也带来了边界检查缺失的问题。

C 语言的字符串处理方式在 1970 年代确立，以空字符结尾的约定（null-terminated string）一直沿用至今，成为许多编程语言处理 C 接口时的标准。

## 核心原理

### 数组的内存布局

数组在内存中连续存储，每个元素占用固定大小的空间：

```
一维数组 int arr[5] = {10, 20, 30, 40, 50};

地址:     0x1000   0x1004   0x1008   0x100C   0x1010
         +--------+--------+--------+--------+--------+
内存:    |   10   |   20   |   30   |   40   |   50   |
         +--------+--------+--------+--------+--------+
索引:      arr[0]   arr[1]   arr[2]   arr[3]   arr[4]
```

**地址计算公式：**
```
元素地址 = 基地址 + 索引 × sizeof(元素类型)
```

### 多维数组的内存布局

多维数组按行优先（row-major）顺序存储：

```
二维数组 int matrix[2][3] = {{1,2,3}, {4,5,6}};

逻辑视图:
        列0   列1   列2
行0  [   1     2     3  ]
行1  [   4     5     6  ]

内存布局（连续）:
地址:   0x100  0x104  0x108  0x10C  0x110  0x114
       +------+------+------+------+------+------+
       |  1   |  2   |  3   |  4   |  5   |  6   |
       +------+------+------+------+------+------+
       [0][0] [0][1] [0][2] [1][0] [1][1] [1][2]
```

**二维数组地址计算：**
```
matrix[i][j] 的地址 = 基地址 + (i × 列数 + j) × sizeof(元素类型)
```

### 数组名与指针的关系

数组名在大多数表达式中会"退化"（decay）为指向第一个元素的指针：

```c
int arr[5] = {1, 2, 3, 4, 5};

// 以下表达式等价
arr[0]     ≡  *arr
arr[i]     ≡  *(arr + i)
&arr[0]    ≡  arr
&arr[i]    ≡  arr + i
```

**注意：数组名不是指针变量！**

```c
int arr[5];
int *ptr = arr;

sizeof(arr);  // 20（假设 int 为 4 字节）
sizeof(ptr);  // 4 或 8（指针大小）

arr++;        // 错误！数组名是常量
ptr++;        // 正确
```

### 字符串的存储方式

字符串字面量存储在只读数据段，而字符数组存储在栈或堆上：

```c
char str1[] = "Hello";     // 栈上分配，可修改
char *str2 = "Hello";      // str2 指向只读数据段，不应修改

str1[0] = 'h';             // 正确
str2[0] = 'h';             // 危险！可能导致段错误
```

## 核心要点

### 一维数组

#### 声明与初始化

```c
#include <stdio.h>

int main() {
    // 方式1：指定大小
    int arr1[5];                        // 未初始化（包含垃圾值）

    // 方式2：指定大小并初始化
    int arr2[5] = {1, 2, 3, 4, 5};     // 完全初始化
    int arr3[5] = {1, 2};              // 部分初始化，其余为 0
    int arr4[5] = {0};                 // 全部初始化为 0

    // 方式3：由初始化列表推断大小
    int arr5[] = {1, 2, 3, 4, 5};      // 大小为 5

    // 计算数组大小
    int size = sizeof(arr5) / sizeof(arr5[0]);
    printf("数组大小: %d\n", size);  // 输出: 5

    return 0;
}
```

#### 数组的访问与遍历

```c
#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = sizeof(arr) / sizeof(arr[0]);

    // 方式1：下标访问
    printf("下标访问:\n");
    for (int i = 0; i < n; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    // 方式2：指针访问
    printf("\n指针访问:\n");
    for (int i = 0; i < n; i++) {
        printf("*(arr + %d) = %d\n", i, *(arr + i));
    }

    // 方式3：指针遍历
    printf("\n指针遍历:\n");
    for (int *p = arr; p < arr + n; p++) {
        printf("*p = %d\n", *p);
    }

    return 0;
}
```

#### 数组作为函数参数

```c
#include <stdio.h>

// 数组作为参数时退化为指针
void print_array(int arr[], int size) {
    // sizeof(arr) 在这里是指针大小，不是数组大小
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// 等价写法
void print_array2(int *arr, int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// 修改数组元素
void double_elements(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;  // 修改会影响原数组
    }
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("原数组: ");
    print_array(numbers, n);

    double_elements(numbers, n);

    printf("加倍后: ");
    print_array(numbers, n);

    return 0;
}
```

### 多维数组

#### 二维数组

```c
#include <stdio.h>

int main() {
    // 二维数组声明与初始化
    int matrix[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    // 部分初始化
    int matrix2[3][4] = {
        {1, 2},       // 第一行: 1, 2, 0, 0
        {5},          // 第二行: 5, 0, 0, 0
        {9, 10, 11}   // 第三行: 9, 10, 11, 0
    };

    // 线性初始化（按行填充）
    int matrix3[3][4] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};

    // 遍历二维数组
    printf("矩阵内容:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }

    return 0;
}
```

#### 二维数组与指针

```c
#include <stdio.h>

int main() {
    int matrix[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    // matrix 是指向 int[4] 的指针
    printf("matrix 的类型: 指向 int[4] 的指针\n");

    // 各种等价表达式
    printf("\n等价表达式:\n");
    printf("matrix[1][2] = %d\n", matrix[1][2]);
    printf("*(matrix[1] + 2) = %d\n", *(matrix[1] + 2));
    printf("(*(matrix + 1))[2] = %d\n", (*(matrix + 1))[2]);
    printf("*(*(matrix + 1) + 2) = %d\n", *(*(matrix + 1) + 2));

    // 使用指向数组的指针遍历
    int (*p)[4] = matrix;  // p 指向包含 4 个 int 的数组
    printf("\n使用数组指针遍历:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", p[i][j]);
        }
        printf("\n");
    }

    return 0;
}
```

#### 二维数组作为函数参数

```c
#include <stdio.h>

// 方式1：指定完整维度
void print_matrix_1(int matrix[3][4], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// 方式2：省略第一维
void print_matrix_2(int matrix[][4], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// 方式3：使用数组指针
void print_matrix_3(int (*matrix)[4], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// 方式4：动态列数（使用 VLA，C99+）
void print_matrix_4(int rows, int cols, int matrix[rows][cols]) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

int main() {
    int matrix[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    printf("方式1:\n");
    print_matrix_1(matrix, 3);

    printf("\n方式4 (VLA):\n");
    print_matrix_4(3, 4, matrix);

    return 0;
}
```

#### 三维及更高维数组

```c
#include <stdio.h>

int main() {
    // 三维数组：2 个 3x4 的矩阵
    int cube[2][3][4] = {
        {   // 第一个 3x4 矩阵
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12}
        },
        {   // 第二个 3x4 矩阵
            {13, 14, 15, 16},
            {17, 18, 19, 20},
            {21, 22, 23, 24}
        }
    };

    printf("三维数组遍历:\n");
    for (int i = 0; i < 2; i++) {
        printf("矩阵 %d:\n", i);
        for (int j = 0; j < 3; j++) {
            for (int k = 0; k < 4; k++) {
                printf("%3d ", cube[i][j][k]);
            }
            printf("\n");
        }
        printf("\n");
    }

    // 内存大小
    printf("cube 总大小: %zu 字节\n", sizeof(cube));
    printf("元素个数: %zu\n", sizeof(cube) / sizeof(int));

    return 0;
}
```

### 字符数组与字符串

#### 字符数组的声明与初始化

```c
#include <stdio.h>
#include <string.h>

int main() {
    // 方式1：逐个字符初始化
    char arr1[] = {'H', 'e', 'l', 'l', 'o', '\0'};

    // 方式2：字符串字面量（自动添加 \0）
    char arr2[] = "Hello";

    // 方式3：指定大小
    char arr3[10] = "Hello";  // 剩余空间填充 \0

    // 方式4：字符指针（指向只读字符串）
    char *str = "Hello";

    printf("arr1: %s (长度: %zu)\n", arr1, strlen(arr1));
    printf("arr2: %s (长度: %zu)\n", arr2, strlen(arr2));
    printf("arr3: %s (大小: %zu, 长度: %zu)\n", arr3, sizeof(arr3), strlen(arr3));
    printf("str: %s (长度: %zu)\n", str, strlen(str));

    // arr2 可修改
    arr2[0] = 'h';
    printf("修改后 arr2: %s\n", arr2);

    // str 不应修改（指向只读内存）
    // str[0] = 'h';  // 危险！

    return 0;
}
```

#### 字符串的读取与输出

```c
#include <stdio.h>
#include <string.h>

int main() {
    char name[50];
    char line[100];

    // 方式1：scanf（读取到空白字符为止）
    printf("输入名字（无空格）: ");
    scanf("%49s", name);  // 限制长度防止溢出
    printf("名字: %s\n", name);

    // 清空输入缓冲区
    int c;
    while ((c = getchar()) != '\n' && c != EOF);

    // 方式2：fgets（读取整行，包括空格）
    printf("输入一行文字: ");
    if (fgets(line, sizeof(line), stdin) != NULL) {
        // 移除末尾的换行符
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }
        printf("输入内容: %s\n", line);
    }

    // 输出方式
    printf("使用 printf: %s\n", name);
    puts(name);  // 自动添加换行
    fputs(name, stdout);  // 不添加换行
    printf("\n");

    return 0;
}
```

#### 字符串遍历

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "Hello, World!";

    // 方式1：使用 strlen
    printf("方式1 - strlen:\n");
    size_t len = strlen(str);
    for (size_t i = 0; i < len; i++) {
        printf("str[%zu] = '%c'\n", i, str[i]);
    }

    // 方式2：检查空字符
    printf("\n方式2 - 检查 \\0:\n");
    for (int i = 0; str[i] != '\0'; i++) {
        printf("str[%d] = '%c'\n", i, str[i]);
    }

    // 方式3：指针遍历
    printf("\n方式3 - 指针:\n");
    for (char *p = str; *p != '\0'; p++) {
        printf("*p = '%c'\n", *p);
    }

    // 统计字符出现次数
    int count = 0;
    for (char *p = str; *p; p++) {
        if (*p == 'l') count++;
    }
    printf("\n字符 'l' 出现次数: %d\n", count);

    return 0;
}
```

## 代码示例

### 常用字符串函数

#### strlen - 计算字符串长度

```c
#include <stdio.h>
#include <string.h>

// 自定义 strlen 实现
size_t my_strlen(const char *str) {
    size_t len = 0;
    while (*str++) {
        len++;
    }
    return len;
}

// 更高效的实现
size_t my_strlen_v2(const char *str) {
    const char *p = str;
    while (*p) p++;
    return p - str;
}

int main() {
    char str[] = "Hello, World!";

    printf("strlen: %zu\n", strlen(str));
    printf("my_strlen: %zu\n", my_strlen(str));
    printf("my_strlen_v2: %zu\n", my_strlen_v2(str));

    // 注意：strlen 不计算 \0
    printf("sizeof: %zu (包含 \\0)\n", sizeof(str));

    return 0;
}
```

#### strcpy 和 strncpy - 字符串复制

```c
#include <stdio.h>
#include <string.h>

// 自定义 strcpy 实现
char* my_strcpy(char *dest, const char *src) {
    char *original = dest;
    while ((*dest++ = *src++));
    return original;
}

// 安全版本
char* my_strncpy(char *dest, const char *src, size_t n) {
    char *original = dest;
    while (n > 0 && (*dest++ = *src++)) {
        n--;
    }
    while (n-- > 0) {
        *dest++ = '\0';
    }
    return original;
}

int main() {
    char src[] = "Hello, World!";
    char dest1[20];
    char dest2[20];
    char dest3[8];  // 太小

    // strcpy - 不安全
    strcpy(dest1, src);
    printf("strcpy: %s\n", dest1);

    // strncpy - 更安全
    strncpy(dest2, src, sizeof(dest2) - 1);
    dest2[sizeof(dest2) - 1] = '\0';  // 确保以 \0 结尾
    printf("strncpy: %s\n", dest2);

    // 小缓冲区
    strncpy(dest3, src, sizeof(dest3) - 1);
    dest3[sizeof(dest3) - 1] = '\0';
    printf("截断: %s\n", dest3);  // 输出: Hello,

    return 0;
}
```

#### strcat 和 strncat - 字符串连接

```c
#include <stdio.h>
#include <string.h>

// 自定义 strcat 实现
char* my_strcat(char *dest, const char *src) {
    char *original = dest;

    // 找到 dest 的末尾
    while (*dest) dest++;

    // 复制 src
    while ((*dest++ = *src++));

    return original;
}

int main() {
    char buffer[50] = "Hello";

    // strcat
    strcat(buffer, ", ");
    strcat(buffer, "World!");
    printf("strcat 结果: %s\n", buffer);

    // strncat - 更安全
    char buffer2[20] = "Hello";
    size_t remaining = sizeof(buffer2) - strlen(buffer2) - 1;
    strncat(buffer2, ", World! This is a long string", remaining);
    printf("strncat 结果: %s\n", buffer2);

    return 0;
}
```

#### strcmp 和 strncmp - 字符串比较

```c
#include <stdio.h>
#include <string.h>

// 自定义 strcmp 实现
int my_strcmp(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return *(unsigned char*)s1 - *(unsigned char*)s2;
}

int main() {
    char str1[] = "apple";
    char str2[] = "banana";
    char str3[] = "apple";
    char str4[] = "Apple";

    printf("strcmp(\"apple\", \"banana\") = %d\n", strcmp(str1, str2));  // < 0
    printf("strcmp(\"apple\", \"apple\") = %d\n", strcmp(str1, str3));   // = 0
    printf("strcmp(\"banana\", \"apple\") = %d\n", strcmp(str2, str1));  // > 0
    printf("strcmp(\"apple\", \"Apple\") = %d\n", strcmp(str1, str4));   // > 0（区分大小写）

    // 比较前 n 个字符
    printf("\nstrncmp(\"apple\", \"application\", 5) = %d\n",
           strncmp("apple", "application", 5));  // < 0
    printf("strncmp(\"apple\", \"application\", 4) = %d\n",
           strncmp("apple", "application", 4));  // = 0

    return 0;
}
```

#### strchr 和 strstr - 字符串搜索

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "Hello, World! Hello, C!";

    // strchr - 查找字符
    char *p = strchr(str, 'W');
    if (p) {
        printf("找到 'W' 于位置: %ld\n", p - str);
        printf("从 'W' 开始: %s\n", p);
    }

    // strrchr - 从后向前查找
    p = strrchr(str, 'o');
    if (p) {
        printf("最后一个 'o' 于位置: %ld\n", p - str);
    }

    // strstr - 查找子字符串
    p = strstr(str, "World");
    if (p) {
        printf("找到 \"World\" 于位置: %ld\n", p - str);
    }

    // 查找所有出现位置
    printf("\n所有 \"Hello\" 的位置:\n");
    p = str;
    while ((p = strstr(p, "Hello")) != NULL) {
        printf("  位置: %ld\n", p - str);
        p++;  // 移动到下一个字符继续搜索
    }

    return 0;
}
```

#### strtok - 字符串分割

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "apple,banana,cherry,date";
    char *token;

    printf("原字符串: %s\n", str);
    printf("\n分割结果:\n");

    // 第一次调用传入字符串
    token = strtok(str, ",");

    while (token != NULL) {
        printf("  '%s'\n", token);
        // 后续调用传入 NULL
        token = strtok(NULL, ",");
    }

    // 注意：strtok 会修改原字符串
    printf("\n修改后的原字符串:\n");
    for (int i = 0; i < 30; i++) {
        if (str[i] == '\0') {
            printf("[\\0]");
        } else {
            printf("%c", str[i]);
        }
    }
    printf("\n");

    return 0;
}
```

#### sprintf 和 sscanf - 格式化字符串

```c
#include <stdio.h>

int main() {
    char buffer[100];

    // sprintf - 格式化输出到字符串
    int year = 2026;
    int month = 1;
    int day = 7;

    sprintf(buffer, "%04d-%02d-%02d", year, month, day);
    printf("日期: %s\n", buffer);

    // snprintf - 更安全的版本
    snprintf(buffer, sizeof(buffer), "Name: %s, Age: %d", "Alice", 25);
    printf("信息: %s\n", buffer);

    // sscanf - 从字符串解析
    char data[] = "Alice 25 175.5";
    char name[20];
    int age;
    float height;

    sscanf(data, "%s %d %f", name, &age, &height);
    printf("\n解析结果:\n");
    printf("  姓名: %s\n", name);
    printf("  年龄: %d\n", age);
    printf("  身高: %.1f\n", height);

    // 解析 CSV
    char csv[] = "John,30,180.0";
    sscanf(csv, "%[^,],%d,%f", name, &age, &height);
    printf("\nCSV 解析:\n");
    printf("  姓名: %s, 年龄: %d, 身高: %.1f\n", name, age, height);

    return 0;
}
```

### 数组操作实例

#### 数组排序

```c
#include <stdio.h>
#include <stdlib.h>

// 冒泡排序
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

// qsort 比较函数
int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

void print_array(int arr[], int n, const char *label) {
    printf("%s: ", label);
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

int main() {
    int arr1[] = {64, 34, 25, 12, 22, 11, 90};
    int arr2[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr1) / sizeof(arr1[0]);

    print_array(arr1, n, "原数组");

    // 冒泡排序
    bubble_sort(arr1, n);
    print_array(arr1, n, "冒泡排序");

    // 使用标准库 qsort
    qsort(arr2, n, sizeof(int), compare);
    print_array(arr2, n, "qsort  ");

    return 0;
}
```

#### 数组查找

```c
#include <stdio.h>
#include <stdlib.h>

// 线性查找
int linear_search(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

// 二分查找（数组必须已排序）
int binary_search(int arr[], int n, int target) {
    int left = 0, right = n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}

// bsearch 比较函数
int compare(const void *key, const void *element) {
    return (*(int*)key - *(int*)element);
}

int main() {
    int arr[] = {11, 12, 22, 25, 34, 64, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 25;

    // 线性查找
    int idx = linear_search(arr, n, target);
    printf("线性查找 %d: 索引 %d\n", target, idx);

    // 二分查找
    idx = binary_search(arr, n, target);
    printf("二分查找 %d: 索引 %d\n", target, idx);

    // 使用标准库 bsearch
    int *result = (int*)bsearch(&target, arr, n, sizeof(int), compare);
    if (result) {
        printf("bsearch %d: 索引 %ld\n", target, result - arr);
    }

    return 0;
}
```

#### 动态数组

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int *data;
    size_t size;      // 当前元素数量
    size_t capacity;  // 容量
} DynamicArray;

// 创建动态数组
DynamicArray* da_create(size_t initial_capacity) {
    DynamicArray *arr = malloc(sizeof(DynamicArray));
    if (!arr) return NULL;

    arr->data = malloc(initial_capacity * sizeof(int));
    if (!arr->data) {
        free(arr);
        return NULL;
    }

    arr->size = 0;
    arr->capacity = initial_capacity;
    return arr;
}

// 添加元素
int da_push(DynamicArray *arr, int value) {
    // 扩容
    if (arr->size >= arr->capacity) {
        size_t new_capacity = arr->capacity * 2;
        int *new_data = realloc(arr->data, new_capacity * sizeof(int));
        if (!new_data) return -1;

        arr->data = new_data;
        arr->capacity = new_capacity;
        printf("扩容到 %zu\n", new_capacity);
    }

    arr->data[arr->size++] = value;
    return 0;
}

// 获取元素
int da_get(DynamicArray *arr, size_t index, int *value) {
    if (index >= arr->size) return -1;
    *value = arr->data[index];
    return 0;
}

// 释放内存
void da_destroy(DynamicArray *arr) {
    if (arr) {
        free(arr->data);
        free(arr);
    }
}

// 打印数组
void da_print(DynamicArray *arr) {
    printf("[");
    for (size_t i = 0; i < arr->size; i++) {
        printf("%d", arr->data[i]);
        if (i < arr->size - 1) printf(", ");
    }
    printf("] (size: %zu, capacity: %zu)\n", arr->size, arr->capacity);
}

int main() {
    DynamicArray *arr = da_create(4);

    for (int i = 1; i <= 10; i++) {
        da_push(arr, i * 10);
    }

    printf("\n最终数组: ");
    da_print(arr);

    da_destroy(arr);
    return 0;
}
```

## 最佳实践

### 始终检查数组边界

```c
#include <stdio.h>
#include <stdbool.h>

#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// 安全的数组访问
bool safe_get(int arr[], size_t size, size_t index, int *value) {
    if (index >= size) {
        return false;
    }
    *value = arr[index];
    return true;
}

bool safe_set(int arr[], size_t size, size_t index, int value) {
    if (index >= size) {
        return false;
    }
    arr[index] = value;
    return true;
}

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int value;

    // 安全访问
    if (safe_get(arr, ARRAY_SIZE(arr), 2, &value)) {
        printf("arr[2] = %d\n", value);
    }

    // 越界访问会被阻止
    if (!safe_get(arr, ARRAY_SIZE(arr), 10, &value)) {
        printf("索引 10 越界\n");
    }

    return 0;
}
```

### 使用 const 保护只读数据

```c
#include <stdio.h>

// 不修改数组内容时使用 const
void print_array(const int *arr, size_t size) {
    for (size_t i = 0; i < size; i++) {
        printf("%d ", arr[i]);
        // arr[i] = 0;  // 编译错误
    }
    printf("\n");
}

// 不修改字符串时使用 const
size_t safe_strlen(const char *str) {
    size_t len = 0;
    while (*str++) len++;
    return len;
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    print_array(numbers, 5);

    const char *greeting = "Hello";
    printf("长度: %zu\n", safe_strlen(greeting));

    return 0;
}
```

### 使用安全的字符串函数

```c
#include <stdio.h>
#include <string.h>

// 安全的字符串复制
char* safe_strcpy(char *dest, size_t dest_size, const char *src) {
    if (dest_size == 0) return dest;

    size_t i;
    for (i = 0; i < dest_size - 1 && src[i] != '\0'; i++) {
        dest[i] = src[i];
    }
    dest[i] = '\0';

    return dest;
}

// 安全的字符串连接
char* safe_strcat(char *dest, size_t dest_size, const char *src) {
    size_t dest_len = strlen(dest);
    if (dest_len >= dest_size - 1) return dest;

    size_t remaining = dest_size - dest_len - 1;
    strncat(dest, src, remaining);

    return dest;
}

int main() {
    char buffer[10];

    safe_strcpy(buffer, sizeof(buffer), "Hello, World!");
    printf("复制结果: %s\n", buffer);  // 输出: Hello, Wo

    char buffer2[20] = "Hello";
    safe_strcat(buffer2, sizeof(buffer2), ", World! Extra text here");
    printf("连接结果: %s\n", buffer2);  // 输出: Hello, World! Ext

    return 0;
}
```

### 正确初始化数组

```c
#include <stdio.h>
#include <string.h>

int main() {
    // 方式1：初始化为零
    int arr1[10] = {0};

    // 方式2：使用 memset
    int arr2[10];
    memset(arr2, 0, sizeof(arr2));

    // 方式3：初始化字符数组
    char str1[50] = "";  // 第一个字符为 \0，其余为 0
    char str2[50] = {0}; // 全部为 0

    // 验证初始化
    printf("arr1[5] = %d\n", arr1[5]);
    printf("arr2[5] = %d\n", arr2[5]);
    printf("str1[0] = %d\n", str1[0]);

    return 0;
}
```

### 使用宏简化数组操作

```c
#include <stdio.h>

// 获取静态数组大小
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// 数组遍历宏
#define ARRAY_FOREACH(arr, size, action) \
    do { \
        for (size_t _i = 0; _i < (size); _i++) { \
            action; \
        } \
    } while(0)

// 安全的数组索引
#define ARRAY_GET(arr, size, index, default_val) \
    ((index) < (size) ? (arr)[index] : (default_val))

int main() {
    int numbers[] = {10, 20, 30, 40, 50};

    printf("数组大小: %zu\n", ARRAY_SIZE(numbers));

    // 使用宏遍历
    printf("元素: ");
    ARRAY_FOREACH(numbers, ARRAY_SIZE(numbers),
        printf("%d ", numbers[_i]));
    printf("\n");

    // 安全访问
    printf("arr[2] = %d\n", ARRAY_GET(numbers, ARRAY_SIZE(numbers), 2, -1));
    printf("arr[10] = %d\n", ARRAY_GET(numbers, ARRAY_SIZE(numbers), 10, -1));

    return 0;
}
```

## 常见陷阱

### 数组越界

```c
#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};

    // 危险：越界访问
    // printf("%d\n", arr[5]);   // 未定义行为
    // printf("%d\n", arr[-1]);  // 未定义行为
    // arr[10] = 100;            // 可能破坏其他数据

    // 正确做法：检查边界
    int index = 3;
    int size = sizeof(arr) / sizeof(arr[0]);

    if (index >= 0 && index < size) {
        printf("arr[%d] = %d\n", index, arr[index]);
    }

    return 0;
}
```

### 字符串缓冲区溢出

```c
#include <stdio.h>
#include <string.h>

void dangerous_function() {
    char buffer[10];

    // 危险：strcpy 不检查长度
    // strcpy(buffer, "This is a very long string");

    // 危险：gets 已被废弃
    // gets(buffer);

    // 安全做法
    strncpy(buffer, "This is a very long string", sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    printf("安全复制: %s\n", buffer);
}

void safe_input() {
    char buffer[50];

    printf("输入内容: ");
    if (fgets(buffer, sizeof(buffer), stdin)) {
        // 移除换行符
        buffer[strcspn(buffer, "\n")] = '\0';
        printf("安全输入: %s\n", buffer);
    }
}

int main() {
    dangerous_function();
    // safe_input();  // 交互式输入
    return 0;
}
```

### 混淆数组和指针

```c
#include <stdio.h>

void test_sizes() {
    int arr[10];
    int *ptr = arr;

    printf("sizeof(arr) = %zu\n", sizeof(arr));  // 40（10 * 4）
    printf("sizeof(ptr) = %zu\n", sizeof(ptr));  // 4 或 8（指针大小）

    // 在函数参数中，数组退化为指针
    // void func(int arr[10]) 与 void func(int *arr) 等价
}

void wrong_size_calc(int arr[]) {
    // 错误！这里 arr 是指针
    // int size = sizeof(arr) / sizeof(arr[0]);
    printf("在函数内 sizeof(arr) = %zu\n", sizeof(arr));  // 指针大小
}

int main() {
    test_sizes();

    int numbers[10] = {0};
    wrong_size_calc(numbers);

    return 0;
}
```

### 修改字符串字面量

```c
#include <stdio.h>

int main() {
    // 方式1：字符数组（可修改）
    char str1[] = "Hello";
    str1[0] = 'h';  // 正确
    printf("str1: %s\n", str1);

    // 方式2：字符串字面量指针（不应修改）
    char *str2 = "Hello";
    // str2[0] = 'h';  // 危险！可能导致段错误

    // 正确做法：使用 const
    const char *str3 = "Hello";
    // str3[0] = 'h';  // 编译错误

    return 0;
}
```

### 忘记空字符终止

```c
#include <stdio.h>
#include <string.h>

int main() {
    // 错误：没有空字符
    char bad_str[5] = {'H', 'e', 'l', 'l', 'o'};
    // printf("%s\n", bad_str);  // 未定义行为，可能打印垃圾

    // 正确：包含空字符
    char good_str[6] = {'H', 'e', 'l', 'l', 'o', '\0'};
    printf("good_str: %s\n", good_str);

    // 使用 strncpy 时要注意
    char buffer[5];
    strncpy(buffer, "Hello, World!", sizeof(buffer));
    // buffer 现在没有 \0 结尾
    buffer[sizeof(buffer) - 1] = '\0';  // 手动添加
    printf("buffer: %s\n", buffer);

    return 0;
}
```

### 返回局部数组的指针

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 错误！返回局部数组指针
char* bad_function() {
    char local_array[50] = "Hello";
    return local_array;  // 危险！函数返回后 local_array 被销毁
}

// 正确做法1：使用静态数组（但不可重入）
char* static_function() {
    static char buffer[50];
    strcpy(buffer, "Hello");
    return buffer;
}

// 正确做法2：动态分配（调用者负责释放）
char* dynamic_function() {
    char *buffer = malloc(50);
    if (buffer) {
        strcpy(buffer, "Hello");
    }
    return buffer;
}

// 正确做法3：调用者提供缓冲区
void caller_buffer(char *buffer, size_t size) {
    strncpy(buffer, "Hello", size - 1);
    buffer[size - 1] = '\0';
}

int main() {
    // char *bad = bad_function();
    // printf("%s\n", bad);  // 未定义行为

    char *static_str = static_function();
    printf("静态: %s\n", static_str);

    char *dynamic_str = dynamic_function();
    if (dynamic_str) {
        printf("动态: %s\n", dynamic_str);
        free(dynamic_str);
    }

    char buffer[50];
    caller_buffer(buffer, sizeof(buffer));
    printf("调用者缓冲区: %s\n", buffer);

    return 0;
}
```

## 性能考量

### 缓存友好的访问模式

```c
#include <stdio.h>
#include <time.h>

#define SIZE 1000

// 行优先访问（缓存友好）
void row_major(int matrix[SIZE][SIZE]) {
    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            matrix[i][j] = i + j;
        }
    }
}

// 列优先访问（缓存不友好）
void col_major(int matrix[SIZE][SIZE]) {
    for (int j = 0; j < SIZE; j++) {
        for (int i = 0; i < SIZE; i++) {
            matrix[i][j] = i + j;
        }
    }
}

int main() {
    static int matrix[SIZE][SIZE];  // 使用 static 避免栈溢出
    clock_t start, end;

    // 测试行优先
    start = clock();
    for (int k = 0; k < 100; k++) {
        row_major(matrix);
    }
    end = clock();
    printf("行优先: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // 测试列优先
    start = clock();
    for (int k = 0; k < 100; k++) {
        col_major(matrix);
    }
    end = clock();
    printf("列优先: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    return 0;
}
```

### 避免频繁调用 strlen

```c
#include <stdio.h>
#include <string.h>
#include <time.h>

// 低效：每次迭代都调用 strlen
void inefficient_loop(const char *str) {
    for (size_t i = 0; i < strlen(str); i++) {  // O(n^2)
        // 处理 str[i]
    }
}

// 高效：只调用一次 strlen
void efficient_loop(const char *str) {
    size_t len = strlen(str);
    for (size_t i = 0; i < len; i++) {  // O(n)
        // 处理 str[i]
    }
}

// 更高效：不调用 strlen
void most_efficient_loop(const char *str) {
    for (size_t i = 0; str[i] != '\0'; i++) {  // O(n)
        // 处理 str[i]
    }
}

int main() {
    // 创建长字符串
    char long_str[100001];
    memset(long_str, 'a', 100000);
    long_str[100000] = '\0';

    clock_t start, end;

    // 测试低效版本
    start = clock();
    for (int k = 0; k < 100; k++) {
        size_t count = 0;
        for (size_t i = 0; i < strlen(long_str); i++) {
            count++;
        }
    }
    end = clock();
    printf("低效版本: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // 测试高效版本
    start = clock();
    for (int k = 0; k < 100; k++) {
        size_t count = 0;
        size_t len = strlen(long_str);
        for (size_t i = 0; i < len; i++) {
            count++;
        }
    }
    end = clock();
    printf("高效版本: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    return 0;
}
```

### 使用 memcpy 和 memset

```c
#include <stdio.h>
#include <string.h>
#include <time.h>

#define SIZE 10000000

// 手动复制
void manual_copy(int *dest, const int *src, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dest[i] = src[i];
    }
}

int main() {
    static int src[SIZE], dest[SIZE];
    clock_t start, end;

    // 初始化
    for (int i = 0; i < SIZE; i++) {
        src[i] = i;
    }

    // 手动复制
    start = clock();
    manual_copy(dest, src, SIZE);
    end = clock();
    printf("手动复制: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // memcpy（通常经过优化）
    start = clock();
    memcpy(dest, src, SIZE * sizeof(int));
    end = clock();
    printf("memcpy:   %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // memset 初始化
    start = clock();
    memset(dest, 0, SIZE * sizeof(int));
    end = clock();
    printf("memset:   %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    return 0;
}
```

### 避免不必要的字符串复制

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// 低效：不必要的复制
void process_inefficient(const char *input) {
    char *copy = malloc(strlen(input) + 1);
    strcpy(copy, input);

    // 只读取，不修改
    printf("处理: %s\n", copy);

    free(copy);
}

// 高效：直接使用原始数据
void process_efficient(const char *input) {
    // 直接使用，不复制
    printf("处理: %s\n", input);
}

// 需要修改时才复制
void process_with_modify(const char *input) {
    size_t len = strlen(input);
    char *copy = malloc(len + 1);
    strcpy(copy, input);

    // 需要修改
    for (size_t i = 0; i < len; i++) {
        if (copy[i] >= 'a' && copy[i] <= 'z') {
            copy[i] -= 32;  // 转大写
        }
    }

    printf("修改后: %s\n", copy);
    free(copy);
}

int main() {
    const char *text = "Hello, World!";

    process_efficient(text);
    process_with_modify(text);

    return 0;
}
```

## 实战场景

### 实现简单的字符串库

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

// 字符串结构
typedef struct {
    char *data;
    size_t length;
    size_t capacity;
} String;

// 创建字符串
String* string_create(const char *init) {
    String *str = malloc(sizeof(String));
    if (!str) return NULL;

    str->length = init ? strlen(init) : 0;
    str->capacity = str->length + 1;
    str->data = malloc(str->capacity);

    if (!str->data) {
        free(str);
        return NULL;
    }

    if (init) {
        strcpy(str->data, init);
    } else {
        str->data[0] = '\0';
    }

    return str;
}

// 追加字符串
bool string_append(String *str, const char *suffix) {
    size_t suffix_len = strlen(suffix);
    size_t new_len = str->length + suffix_len;

    if (new_len + 1 > str->capacity) {
        size_t new_capacity = (new_len + 1) * 2;
        char *new_data = realloc(str->data, new_capacity);
        if (!new_data) return false;

        str->data = new_data;
        str->capacity = new_capacity;
    }

    strcpy(str->data + str->length, suffix);
    str->length = new_len;
    return true;
}

// 转大写
void string_to_upper(String *str) {
    for (size_t i = 0; i < str->length; i++) {
        str->data[i] = toupper(str->data[i]);
    }
}

// 转小写
void string_to_lower(String *str) {
    for (size_t i = 0; i < str->length; i++) {
        str->data[i] = tolower(str->data[i]);
    }
}

// 去除首尾空白
void string_trim(String *str) {
    // 去除尾部空白
    while (str->length > 0 && isspace(str->data[str->length - 1])) {
        str->length--;
    }
    str->data[str->length] = '\0';

    // 去除首部空白
    size_t start = 0;
    while (start < str->length && isspace(str->data[start])) {
        start++;
    }

    if (start > 0) {
        memmove(str->data, str->data + start, str->length - start + 1);
        str->length -= start;
    }
}

// 查找子串
int string_find(const String *str, const char *substr) {
    char *pos = strstr(str->data, substr);
    return pos ? (int)(pos - str->data) : -1;
}

// 释放字符串
void string_free(String *str) {
    if (str) {
        free(str->data);
        free(str);
    }
}

int main() {
    String *str = string_create("  Hello");

    string_append(str, ", World!  ");
    printf("原始: '%s'\n", str->data);

    string_trim(str);
    printf("去空白: '%s'\n", str->data);

    string_to_upper(str);
    printf("大写: '%s'\n", str->data);

    int pos = string_find(str, "WORLD");
    printf("'WORLD' 位置: %d\n", pos);

    string_free(str);
    return 0;
}
```

### 矩阵运算

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 矩阵结构
typedef struct {
    double **data;
    size_t rows;
    size_t cols;
} Matrix;

// 创建矩阵
Matrix* matrix_create(size_t rows, size_t cols) {
    Matrix *m = malloc(sizeof(Matrix));
    if (!m) return NULL;

    m->rows = rows;
    m->cols = cols;
    m->data = malloc(rows * sizeof(double*));

    if (!m->data) {
        free(m);
        return NULL;
    }

    for (size_t i = 0; i < rows; i++) {
        m->data[i] = calloc(cols, sizeof(double));
        if (!m->data[i]) {
            for (size_t j = 0; j < i; j++) {
                free(m->data[j]);
            }
            free(m->data);
            free(m);
            return NULL;
        }
    }

    return m;
}

// 释放矩阵
void matrix_free(Matrix *m) {
    if (m) {
        for (size_t i = 0; i < m->rows; i++) {
            free(m->data[i]);
        }
        free(m->data);
        free(m);
    }
}

// 矩阵乘法
Matrix* matrix_multiply(const Matrix *a, const Matrix *b) {
    if (a->cols != b->rows) return NULL;

    Matrix *result = matrix_create(a->rows, b->cols);
    if (!result) return NULL;

    for (size_t i = 0; i < a->rows; i++) {
        for (size_t j = 0; j < b->cols; j++) {
            double sum = 0;
            for (size_t k = 0; k < a->cols; k++) {
                sum += a->data[i][k] * b->data[k][j];
            }
            result->data[i][j] = sum;
        }
    }

    return result;
}

// 矩阵转置
Matrix* matrix_transpose(const Matrix *m) {
    Matrix *result = matrix_create(m->cols, m->rows);
    if (!result) return NULL;

    for (size_t i = 0; i < m->rows; i++) {
        for (size_t j = 0; j < m->cols; j++) {
            result->data[j][i] = m->data[i][j];
        }
    }

    return result;
}

// 打印矩阵
void matrix_print(const Matrix *m, const char *name) {
    printf("%s (%zux%zu):\n", name, m->rows, m->cols);
    for (size_t i = 0; i < m->rows; i++) {
        printf("  ");
        for (size_t j = 0; j < m->cols; j++) {
            printf("%8.2f ", m->data[i][j]);
        }
        printf("\n");
    }
}

int main() {
    Matrix *a = matrix_create(2, 3);
    Matrix *b = matrix_create(3, 2);

    // 初始化矩阵 A
    double a_values[2][3] = {{1, 2, 3}, {4, 5, 6}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 3; j++) {
            a->data[i][j] = a_values[i][j];
        }
    }

    // 初始化矩阵 B
    double b_values[3][2] = {{7, 8}, {9, 10}, {11, 12}};
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 2; j++) {
            b->data[i][j] = b_values[i][j];
        }
    }

    matrix_print(a, "矩阵 A");
    matrix_print(b, "矩阵 B");

    Matrix *c = matrix_multiply(a, b);
    if (c) {
        matrix_print(c, "A x B");
        matrix_free(c);
    }

    Matrix *at = matrix_transpose(a);
    if (at) {
        matrix_print(at, "A 的转置");
        matrix_free(at);
    }

    matrix_free(a);
    matrix_free(b);

    return 0;
}
```

### 命令行参数解析

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

typedef struct {
    bool verbose;
    bool help;
    char *input_file;
    char *output_file;
    int count;
} Options;

void print_usage(const char *program_name) {
    printf("用法: %s [选项] <输入文件>\n", program_name);
    printf("选项:\n");
    printf("  -h, --help       显示帮助信息\n");
    printf("  -v, --verbose    详细输出\n");
    printf("  -o, --output     指定输出文件\n");
    printf("  -n, --count      指定计数\n");
}

bool parse_arguments(int argc, char *argv[], Options *opts) {
    // 初始化默认值
    opts->verbose = false;
    opts->help = false;
    opts->input_file = NULL;
    opts->output_file = NULL;
    opts->count = 1;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            opts->help = true;
        }
        else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--verbose") == 0) {
            opts->verbose = true;
        }
        else if (strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0) {
            if (i + 1 < argc) {
                opts->output_file = argv[++i];
            } else {
                fprintf(stderr, "错误: -o 需要参数\n");
                return false;
            }
        }
        else if (strcmp(argv[i], "-n") == 0 || strcmp(argv[i], "--count") == 0) {
            if (i + 1 < argc) {
                opts->count = atoi(argv[++i]);
            } else {
                fprintf(stderr, "错误: -n 需要参数\n");
                return false;
            }
        }
        else if (argv[i][0] == '-') {
            fprintf(stderr, "错误: 未知选项 '%s'\n", argv[i]);
            return false;
        }
        else {
            opts->input_file = argv[i];
        }
    }

    return true;
}

int main(int argc, char *argv[]) {
    Options opts;

    if (!parse_arguments(argc, argv, &opts)) {
        print_usage(argv[0]);
        return 1;
    }

    if (opts.help) {
        print_usage(argv[0]);
        return 0;
    }

    printf("解析结果:\n");
    printf("  详细模式: %s\n", opts.verbose ? "是" : "否");
    printf("  输入文件: %s\n", opts.input_file ? opts.input_file : "(未指定)");
    printf("  输出文件: %s\n", opts.output_file ? opts.output_file : "(未指定)");
    printf("  计数: %d\n", opts.count);

    return 0;
}
```

## 面试要点

### 数组与指针的区别

**问：数组名和指针有什么区别？**

```c
int arr[5];
int *ptr = arr;

// 1. sizeof 不同
sizeof(arr);  // 20（数组大小）
sizeof(ptr);  // 4 或 8（指针大小）

// 2. 地址不同
&arr;   // 类型是 int(*)[5]，指向整个数组
&ptr;   // 类型是 int**，指向指针变量

// 3. 可修改性不同
ptr++;  // 正确，指针可修改
// arr++; // 错误，数组名是常量
```

### 字符串字面量存储

**问：以下代码有什么问题？**

```c
char *str = "Hello";
str[0] = 'h';  // 问题在哪里？
```

**答：** 字符串字面量 `"Hello"` 存储在只读数据段，`str` 指向这个只读内存。尝试修改会导致未定义行为（通常是段错误）。

正确做法：
```c
char str[] = "Hello";  // 复制到栈上
str[0] = 'h';          // 可以修改
```

### 二维数组的内存布局

**问：如何计算二维数组元素的地址？**

```c
int arr[3][4];
// arr[i][j] 的地址 = (char*)arr + (i * 4 + j) * sizeof(int)
// 等价于: &arr[0][0] + (i * 4 + j)
```

### 数组作为函数参数

**问：为什么无法在函数内获取数组大小？**

```c
void func(int arr[]) {
    // sizeof(arr) 返回指针大小，不是数组大小
    // 因为数组参数退化为指针
}
```

**解决方案：** 额外传递数组大小参数，或使用结构体封装。

### strcpy 与 strncpy

**问：strcpy 和 strncpy 的区别？strncpy 一定安全吗？**

```c
char dest[5];
strcpy(dest, "Hello, World!");   // 缓冲区溢出！

strncpy(dest, "Hello, World!", sizeof(dest));
// dest 现在是 "Hello"，但没有 \0 终止符！

// 安全做法
strncpy(dest, "Hello, World!", sizeof(dest) - 1);
dest[sizeof(dest) - 1] = '\0';
```

### 实现常用字符串函数

**问：实现 strlen、strcpy、strcmp**

```c
size_t my_strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return p - s;
}

char* my_strcpy(char *dest, const char *src) {
    char *d = dest;
    while ((*d++ = *src++));
    return dest;
}

int my_strcmp(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return *(unsigned char*)s1 - *(unsigned char*)s2;
}
```

### VLA（变长数组）

**问：什么是 VLA？有什么限制？**

```c
void func(int n) {
    int arr[n];  // C99 变长数组
    // ...
}
```

**限制：**
- C99 引入，C11 变为可选
- 不能用于全局或静态数组
- 可能导致栈溢出
- 某些编译器不支持（如 MSVC）

## 延伸阅读

### 官方文档与标准

- [C 语言标准 (C11)](https://www.iso.org/standard/57853.html) - ISO/IEC 9899:2011
- [cppreference - C 参考手册](https://en.cppreference.com/w/c) - 完整的 C 语言参考
- [GCC 文档](https://gcc.gnu.org/onlinedocs/) - GNU C 编译器文档

### 经典书籍

- **《C 程序设计语言》** (K&R) - Brian Kernighan, Dennis Ritchie
  - C 语言的权威著作，数组和指针的经典讲解

- **《C 和指针》** - Kenneth Reek
  - 深入讲解指针和数组的关系

- **《C 专家编程》** - Peter van der Linden
  - 高级 C 编程技巧，包括数组和内存布局

- **《C 陷阱与缺陷》** - Andrew Koenig
  - C 语言常见错误和陷阱

### 在线资源

- [GeeksforGeeks - C 数组](https://www.geeksforgeeks.org/c-arrays/) - 详细的数组教程
- [Learn-C.org](https://www.learn-c.org/) - 交互式 C 语言教程
- [Tutorialspoint - C 字符串](https://www.tutorialspoint.com/cprogramming/c_strings.htm) - 字符串处理教程

### 工具

- [Valgrind](https://valgrind.org/) - 内存错误检测工具
- [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer) - 内存错误检测
- [Compiler Explorer](https://godbolt.org/) - 在线查看编译器生成的代码
