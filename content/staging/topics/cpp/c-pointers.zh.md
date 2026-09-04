---
title: C 语言指针
description: 深入理解 C 语言指针：基础、运算、数组、函数指针与多级指针
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C
  - 指针
  - 内存
  - 数组
status: imported
origin: old/src/content/docs/cpp/c-pointers.zh.md
divergence: 0.222
issues: []
legacy:
  category: Cpp
  subcategory: C 语言
  order: 1
  lastUpdated: 2026-01-07
---

指针是 C 语言最强大也是最容易出错的特性之一。理解指针对于掌握 C 语言至关重要，它是实现高效内存管理、动态数据结构和底层系统编程的基础。

## 指针基础

### 什么是指针？

指针是一个变量，其值为另一个变量的内存地址。通过指针，我们可以间接访问和操作内存中的数据。

### 指针的声明和初始化

```c
#include <stdio.h>

int main() {
    int num = 42;        // 普通整型变量
    int *ptr;            // 声明一个整型指针

    ptr = &num;          // 将 num 的地址赋给 ptr

    printf("num 的值: %d\n", num);
    printf("num 的地址: %p\n", (void*)&num);
    printf("ptr 的值(地址): %p\n", (void*)ptr);
    printf("ptr 指向的值: %d\n", *ptr);

    return 0;
}
```

**关键概念：**
- `&` 运算符：取地址运算符，获取变量的内存地址
- `*` 运算符：解引用运算符，访问指针指向的值
- `int *ptr`：声明一个指向整型的指针

### 指针的类型

指针的类型必须与它所指向的数据类型匹配：

```c
#include <stdio.h>

int main() {
    int i = 10;
    float f = 3.14;
    char c = 'A';

    int *ip = &i;
    float *fp = &f;
    char *cp = &c;

    printf("整型指针指向的值: %d\n", *ip);
    printf("浮点型指针指向的值: %.2f\n", *fp);
    printf("字符型指针指向的值: %c\n", *cp);

    return 0;
}
```

### 空指针

空指针是不指向任何有效内存位置的指针：

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr = NULL;  // 初始化为空指针

    if (ptr == NULL) {
        printf("指针为空，不能解引用\n");
    }

    // 安全的指针使用
    ptr = (int*)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 100;
        printf("动态分配的值: %d\n", *ptr);
        free(ptr);
    }

    return 0;
}
```

## 指针运算

指针支持特定的算术运算，这些运算考虑了所指向数据类型的大小。

### 指针的递增和递减

```c
#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int *ptr = arr;

    printf("初始位置: *ptr = %d, 地址 = %p\n", *ptr, (void*)ptr);

    ptr++;  // 指针向前移动一个 int 的大小
    printf("递增后: *ptr = %d, 地址 = %p\n", *ptr, (void*)ptr);

    ptr += 2;  // 向前移动两个 int 的大小
    printf("移动2位后: *ptr = %d, 地址 = %p\n", *ptr, (void*)ptr);

    ptr--;  // 向后移动
    printf("递减后: *ptr = %d, 地址 = %p\n", *ptr, (void*)ptr);

    return 0;
}
```

### 指针的加减运算

```c
#include <stdio.h>

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int *p1 = &numbers[1];  // 指向第二个元素
    int *p2 = &numbers[4];  // 指向第五个元素

    // 指针相减得到元素个数差
    printf("p2 和 p1 之间的元素个数: %ld\n", p2 - p1);

    // 使用指针偏移访问元素
    printf("p1[0] = %d\n", p1[0]);  // 等同于 *p1
    printf("p1[2] = %d\n", p1[2]);  // 等同于 *(p1 + 2)

    return 0;
}
```

### 指针比较

```c
#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40};
    int *ptr1 = &arr[0];
    int *ptr2 = &arr[2];

    if (ptr1 < ptr2) {
        printf("ptr1 指向的地址在 ptr2 之前\n");
    }

    // 遍历数组
    int *start = arr;
    int *end = arr + 4;

    for (int *p = start; p < end; p++) {
        printf("%d ", *p);
    }
    printf("\n");

    return 0;
}
```

## 指针与数组

数组名本质上是指向数组第一个元素的常量指针。

### 数组与指针的关系

```c
#include <stdio.h>

int main() {
    int arr[] = {100, 200, 300, 400, 500};
    int *ptr = arr;  // arr 等价于 &arr[0]

    printf("使用数组下标访问:\n");
    for (int i = 0; i < 5; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    printf("\n使用指针访问:\n");
    for (int i = 0; i < 5; i++) {
        printf("*(ptr + %d) = %d\n", i, *(ptr + i));
    }

    printf("\n以下表达式等价:\n");
    printf("arr[2] = %d\n", arr[2]);
    printf("*(arr + 2) = %d\n", *(arr + 2));
    printf("ptr[2] = %d\n", ptr[2]);
    printf("*(ptr + 2) = %d\n", *(ptr + 2));

    return 0;
}
```

### 指针数组

指针数组是数组的元素为指针的数组：

```c
#include <stdio.h>

int main() {
    char *names[] = {
        "Alice",
        "Bob",
        "Charlie",
        "David"
    };

    int n = sizeof(names) / sizeof(names[0]);

    printf("字符串数组:\n");
    for (int i = 0; i < n; i++) {
        printf("%d: %s\n", i, names[i]);
    }

    // 修改指针指向
    names[1] = "Bobby";
    printf("\n修改后: %s\n", names[1]);

    return 0;
}
```

### 字符串与指针

```c
#include <stdio.h>
#include <string.h>

int main() {
    // 字符数组（可修改）
    char str1[] = "Hello";

    // 字符串字面量（不可修改）
    char *str2 = "World";

    printf("str1: %s\n", str1);
    printf("str2: %s\n", str2);

    // 可以修改字符数组
    str1[0] = 'h';
    printf("修改后的 str1: %s\n", str1);

    // 不应该修改字符串字面量
    // str2[0] = 'w';  // 危险！可能导致段错误

    // 遍历字符串
    char *p = str1;
    while (*p != '\0') {
        printf("%c ", *p);
        p++;
    }
    printf("\n");

    return 0;
}
```

### 多维数组与指针

```c
#include <stdio.h>

int main() {
    int matrix[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    // 指向数组的指针
    int (*ptr)[4] = matrix;  // 指向包含4个整数的数组

    printf("使用指针访问二维数组:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", *(*(ptr + i) + j));
            // 等价于: ptr[i][j] 或 (*(ptr + i))[j]
        }
        printf("\n");
    }

    return 0;
}
```

## 多级指针

多级指针是指向指针的指针。

### 二级指针

```c
#include <stdio.h>

int main() {
    int num = 100;
    int *ptr = &num;        // 一级指针
    int **pptr = &ptr;      // 二级指针

    printf("num 的值: %d\n", num);
    printf("num 的地址: %p\n", (void*)&num);
    printf("\n");

    printf("ptr 的值(num的地址): %p\n", (void*)ptr);
    printf("ptr 的地址: %p\n", (void*)&ptr);
    printf("*ptr 的值: %d\n", *ptr);
    printf("\n");

    printf("pptr 的值(ptr的地址): %p\n", (void*)pptr);
    printf("*pptr 的值(num的地址): %p\n", (void*)*pptr);
    printf("**pptr 的值: %d\n", **pptr);

    // 通过二级指针修改值
    **pptr = 200;
    printf("\n修改后 num 的值: %d\n", num);

    return 0;
}
```

### 二级指针的实际应用

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 动态分配二维数组
int** create_2d_array(int rows, int cols) {
    int **array = (int**)malloc(rows * sizeof(int*));

    for (int i = 0; i < rows; i++) {
        array[i] = (int*)malloc(cols * sizeof(int));
    }

    return array;
}

// 释放二维数组
void free_2d_array(int **array, int rows) {
    for (int i = 0; i < rows; i++) {
        free(array[i]);
    }
    free(array);
}

int main() {
    int rows = 3, cols = 4;
    int **matrix = create_2d_array(rows, cols);

    // 初始化数组
    int value = 1;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            matrix[i][j] = value++;
        }
    }

    // 打印数组
    printf("动态二维数组:\n");
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }

    free_2d_array(matrix, rows);

    return 0;
}
```

### 指针数组与二级指针

```c
#include <stdio.h>

void print_strings(char **strings, int count) {
    for (int i = 0; i < count; i++) {
        printf("%d: %s\n", i, strings[i]);
    }
}

int main() {
    char *fruits[] = {"Apple", "Banana", "Cherry", "Date"};
    int count = sizeof(fruits) / sizeof(fruits[0]);

    // 指针数组可以传递给接受二级指针的函数
    printf("水果列表:\n");
    print_strings(fruits, count);

    // 使用二级指针遍历
    char **ptr = fruits;
    printf("\n使用二级指针遍历:\n");
    for (int i = 0; i < count; i++) {
        printf("%s ", *(ptr + i));
    }
    printf("\n");

    return 0;
}
```

## 函数指针

函数指针是指向函数的指针，可以用来实现回调函数和动态函数调用。

### 函数指针的声明和使用

```c
#include <stdio.h>

// 普通函数
int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

int multiply(int a, int b) {
    return a * b;
}

int main() {
    // 声明函数指针
    int (*operation)(int, int);

    // 指向 add 函数
    operation = add;
    printf("10 + 5 = %d\n", operation(10, 5));

    // 指向 subtract 函数
    operation = subtract;
    printf("10 - 5 = %d\n", operation(10, 5));

    // 指向 multiply 函数
    operation = multiply;
    printf("10 * 5 = %d\n", operation(10, 5));

    return 0;
}
```

### 函数指针数组

```c
#include <stdio.h>

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }
int divide(int a, int b) { return b != 0 ? a / b : 0; }

int main() {
    // 函数指针数组
    int (*operations[])(int, int) = {add, subtract, multiply, divide};
    char *op_names[] = {"加法", "减法", "乘法", "除法"};

    int a = 20, b = 4;

    printf("计算器演示 (a=%d, b=%d):\n", a, b);
    for (int i = 0; i < 4; i++) {
        printf("%s: %d\n", op_names[i], operations[i](a, b));
    }

    return 0;
}
```

### 回调函数

```c
#include <stdio.h>

// 回调函数类型
typedef void (*Callback)(int);

// 使用回调函数的函数
void process_array(int arr[], int size, Callback callback) {
    for (int i = 0; i < size; i++) {
        callback(arr[i]);
    }
}

// 不同的回调实现
void print_number(int n) {
    printf("%d ", n);
}

void print_square(int n) {
    printf("%d ", n * n);
}

void print_double(int n) {
    printf("%d ", n * 2);
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);

    printf("原始数字: ");
    process_array(numbers, size, print_number);
    printf("\n");

    printf("平方值: ");
    process_array(numbers, size, print_square);
    printf("\n");

    printf("双倍值: ");
    process_array(numbers, size, print_double);
    printf("\n");

    return 0;
}
```

### 函数指针作为参数和返回值

```c
#include <stdio.h>

// 比较函数类型
typedef int (*CompareFn)(int, int);

int ascending(int a, int b) {
    return a - b;
}

int descending(int a, int b) {
    return b - a;
}

// 冒泡排序，接受比较函数作为参数
void bubble_sort(int arr[], int size, CompareFn compare) {
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - i - 1; j++) {
            if (compare(arr[j], arr[j + 1]) > 0) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

void print_array(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

int main() {
    int numbers[] = {64, 34, 25, 12, 22, 11, 90};
    int size = sizeof(numbers) / sizeof(numbers[0]);

    printf("原始数组: ");
    print_array(numbers, size);

    bubble_sort(numbers, size, ascending);
    printf("升序排序: ");
    print_array(numbers, size);

    bubble_sort(numbers, size, descending);
    printf("降序排序: ");
    print_array(numbers, size);

    return 0;
}
```

## void 指针

void 指针是通用指针类型，可以指向任何数据类型。

### void 指针的基本使用

```c
#include <stdio.h>

int main() {
    int i = 10;
    float f = 3.14;
    char c = 'A';

    void *ptr;

    // void 指针可以指向任何类型
    ptr = &i;
    printf("整数值: %d\n", *(int*)ptr);

    ptr = &f;
    printf("浮点值: %.2f\n", *(float*)ptr);

    ptr = &c;
    printf("字符值: %c\n", *(char*)ptr);

    return 0;
}
```

### void 指针的实际应用

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 通用比较函数
typedef int (*CompareFunc)(const void*, const void*);

// 整数比较
int compare_ints(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

// 字符串比较
int compare_strings(const void *a, const void *b) {
    return strcmp(*(char**)a, *(char**)b);
}

// 通用打印函数
void print_array_generic(void *arr, int size, int elem_size,
                        void (*print_elem)(void*)) {
    for (int i = 0; i < size; i++) {
        void *elem = (char*)arr + i * elem_size;
        print_elem(elem);
    }
    printf("\n");
}

void print_int(void *elem) {
    printf("%d ", *(int*)elem);
}

void print_string(void *elem) {
    printf("%s ", *(char**)elem);
}

int main() {
    // 整数数组排序
    int numbers[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("排序前的整数: ");
    print_array_generic(numbers, n, sizeof(int), print_int);

    qsort(numbers, n, sizeof(int), compare_ints);

    printf("排序后的整数: ");
    print_array_generic(numbers, n, sizeof(int), print_int);

    // 字符串数组排序
    char *names[] = {"Charlie", "Alice", "Bob", "David"};
    int m = sizeof(names) / sizeof(names[0]);

    printf("\n排序前的字符串: ");
    print_array_generic(names, m, sizeof(char*), print_string);

    qsort(names, m, sizeof(char*), compare_strings);

    printf("排序后的字符串: ");
    print_array_generic(names, m, sizeof(char*), print_string);

    return 0;
}
```

### void 指针与动态内存

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 通用内存复制（类似 memcpy）
void* my_memcpy(void *dest, const void *src, size_t n) {
    char *d = (char*)dest;
    const char *s = (const char*)src;

    for (size_t i = 0; i < n; i++) {
        d[i] = s[i];
    }

    return dest;
}

int main() {
    // 使用 void 指针进行动态内存分配
    void *buffer = malloc(100);

    if (buffer == NULL) {
        printf("内存分配失败\n");
        return 1;
    }

    // 复制整数数组
    int source[] = {1, 2, 3, 4, 5};
    my_memcpy(buffer, source, sizeof(source));

    int *int_ptr = (int*)buffer;
    printf("复制的整数数组: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", int_ptr[i]);
    }
    printf("\n");

    // 复制字符串
    const char *str = "Hello, World!";
    my_memcpy(buffer, str, strlen(str) + 1);

    printf("复制的字符串: %s\n", (char*)buffer);

    free(buffer);

    return 0;
}
```

## 指针的常见陷阱和最佳实践

### 常见错误

```c
#include <stdio.h>
#include <stdlib.h>

void common_mistakes() {
    // 错误 1: 未初始化的指针
    // int *ptr;  // 悬空指针
    // *ptr = 10;  // 危险！

    // 正确做法
    int *ptr = NULL;
    int value = 10;
    ptr = &value;
    *ptr = 20;

    // 错误 2: 访问已释放的内存
    int *p = (int*)malloc(sizeof(int));
    *p = 100;
    free(p);
    // printf("%d\n", *p);  // 危险！访问已释放内存

    // 正确做法：释放后置为 NULL
    p = NULL;

    // 错误 3: 内存泄漏
    for (int i = 0; i < 10; i++) {
        int *temp = (int*)malloc(sizeof(int));
        // 忘记 free(temp);  // 内存泄漏！
        *temp = i;
        free(temp);  // 正确：及时释放
    }
}

int main() {
    common_mistakes();
    printf("演示完成\n");
    return 0;
}
```

### 最佳实践

```c
#include <stdio.h>
#include <stdlib.h>

// 1. 函数返回指针时要小心
int* create_int(int value) {
    int *ptr = (int*)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = value;
    }
    return ptr;
}

// 错误示例：返回局部变量的地址
// int* bad_function() {
//     int local = 10;
//     return &local;  // 危险！局部变量在函数返回后被销毁
// }

// 2. 使用 const 保护数据
void print_array_safe(const int *arr, int size) {
    // arr[0] = 100;  // 编译错误：不能修改 const 数据
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// 3. 检查内存分配是否成功
int* safe_allocate(int size) {
    int *ptr = (int*)malloc(size * sizeof(int));
    if (ptr == NULL) {
        fprintf(stderr, "内存分配失败\n");
        exit(1);
    }
    return ptr;
}

int main() {
    // 使用安全的函数
    int *num = create_int(42);
    if (num != NULL) {
        printf("创建的整数: %d\n", num);
        free(num);
        num = NULL;  // 避免悬空指针
    }

    // 使用 const 保护
    int arr[] = {1, 2, 3, 4, 5};
    print_array_safe(arr, 5);

    // 安全分配
    int *data = safe_allocate(10);
    for (int i = 0; i < 10; i++) {
        data[i] = i * i;
    }
    print_array_safe(data, 10);
    free(data);

    return 0;
}
```

## 总结

指针是 C 语言的核心特性，掌握指针对于编写高效的 C 程序至关重要：

1. **指针基础**：理解指针的本质是存储内存地址的变量
2. **指针运算**：掌握指针的算术运算，特别是在数组遍历中的应用
3. **指针与数组**：理解数组名与指针的关系，灵活运用两种访问方式
4. **多级指针**：掌握指针的指针，特别是在动态二维数组中的应用
5. **函数指针**：学会使用函数指针实现回调和动态函数调用
6. **void 指针**：理解通用指针的使用场景和类型转换

**关键要点**：
- 始终初始化指针，避免使用悬空指针
- 使用完动态分配的内存后及时释放
- 释放内存后将指针设为 NULL
- 使用 const 保护不应修改的数据
- 检查指针是否为 NULL 再解引用
- 注意指针的作用域和生命周期

熟练掌握指针需要大量实践，建议通过编写实际程序来加深理解。记住，指针虽然强大，但也要谨慎使用，避免常见的内存错误。
