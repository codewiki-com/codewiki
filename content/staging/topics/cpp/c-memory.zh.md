---
title: C 语言内存管理
description: 掌握 C 内存管理：栈与堈、动态内存分配、内存泄漏与对齐
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C
  - 内存管理
  - malloc
  - 内存泄漏
status: imported
origin: old/src/content/docs/cpp/c-memory.zh.md
divergence: 0.255
issues: []
legacy:
  category: Cpp
  subcategory: C 语言
  order: 2
  lastUpdated: 2026-01-07
---

内存管理是 C 语言编程中最关键的技能之一。与高级语言不同，C 语言要求程序员手动管理内存，这既带来了灵活性，也增加了出错的风险。本文将深入探讨 C 语言的内存管理机制。

## 内存布局

C 程序的内存通常分为以下几个区域：

```
+------------------+  高地址
|      栈区        |  ↓ 向下增长
|    (Stack)       |
+------------------+
|        ↓         |
|     空闲区       |
|        ↑         |
+------------------+
|      堆区        |  ↑ 向上增长
|     (Heap)       |
+------------------+
|   未初始化数据   |  (BSS段)
+------------------+
|   已初始化数据   |  (Data段)
+------------------+
|     代码段       |  (Text段)
+------------------+  低地址
```

### 各区域说明

- **代码段（Text）**: 存储程序的机器代码，只读
- **数据段（Data）**: 存储已初始化的全局变量和静态变量
- **BSS 段**: 存储未初始化的全局变量和静态变量
- **堆区（Heap）**: 动态分配的内存，由程序员手动管理
- **栈区（Stack）**: 存储局部变量、函数参数、返回地址等

## 栈与堆

### 栈（Stack）

栈是一种自动管理的内存区域，遵循 LIFO（后进先出）原则。

**特点：**
- 自动分配和释放
- 访问速度快
- 空间有限（通常几 MB）
- 生命周期由作用域决定

```c
#include <stdio.h>

void stack_example() {
    int a = 10;              // 分配在栈上
    char str[100];           // 分配在栈上
    double values[50];       // 分配在栈上

    printf("栈变量 a = %d\n", a);
    // 函数结束时，这些变量自动释放
}

int main() {
    stack_example();
    // 此时 stack_example 中的变量已被释放
    return 0;
}
```

**栈溢出示例：**

```c
#include <stdio.h>

// 危险！可能导致栈溢出
void stack_overflow() {
    int huge_array[10000000];  // 尝试在栈上分配约 40MB
    huge_array[0] = 1;
}

// 递归导致的栈溢出
int infinite_recursion(int n) {
    return infinite_recursion(n + 1);  // 无终止条件
}
```

### 堆（Heap）

堆是动态内存区域，需要手动管理。

**特点：**
- 手动分配和释放
- 空间大（受系统内存限制）
- 访问速度相对较慢
- 生命周期由程序员控制
- 容易产生内存泄漏

```c
#include <stdio.h>
#include <stdlib.h>

void heap_example() {
    // 在堆上分配内存
    int *ptr = (int*)malloc(sizeof(int));
    if (ptr == NULL) {
        printf("内存分配失败\n");
        return;
    }

    *ptr = 20;
    printf("堆变量 *ptr = %d\n", *ptr);

    // 必须手动释放
    free(ptr);
    ptr = NULL;  // 避免野指针
}
```

### 栈与堆对比

| 特性 | 栈 | 堆 |
|------|-----|-----|
| 分配速度 | 快 | 慢 |
| 内存大小 | 小（几MB） | 大（GB级别） |
| 管理方式 | 自动 | 手动 |
| 碎片问题 | 无 | 有 |
| 访问方式 | 局部访问 | 全局访问 |
| 生命周期 | 函数作用域 | 程序员控制 |

## 动态内存分配

### malloc() - 分配内存

`malloc()` 分配指定字节的内存，但不初始化。

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // 分配单个整数
    int *num = (int*)malloc(sizeof(int));
    if (num == NULL) {
        fprintf(stderr, "内存分配失败\n");
        return 1;
    }

    *num = 100;
    printf("数值: %d\n", *num);
    free(num);

    // 分配数组
    int n = 5;
    int *array = (int*)malloc(n * sizeof(int));
    if (array == NULL) {
        fprintf(stderr, "内存分配失败\n");
        return 1;
    }

    // 初始化数组
    for (int i = 0; i < n; i++) {
        array[i] = i * 10;
        printf("array[%d] = %d\n", i, array[i]);
    }

    free(array);
    return 0;
}
```

### calloc() - 分配并清零

`calloc()` 分配内存并将所有字节初始化为零。

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;

    // malloc 不初始化（包含垃圾值）
    int *arr1 = (int*)malloc(n * sizeof(int));
    printf("malloc (未初始化):\n");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr1[i]);  // 可能输出垃圾值
    }
    printf("\n");
    free(arr1);

    // calloc 初始化为 0
    int *arr2 = (int*)calloc(n, sizeof(int));
    printf("calloc (初始化为0):\n");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr2[i]);  // 输出: 0 0 0 0 0
    }
    printf("\n");
    free(arr2);

    return 0;
}
```

### realloc() - 重新分配内存

`realloc()` 调整已分配内存的大小。

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = (int*)malloc(3 * sizeof(int));
    if (arr == NULL) return 1;

    // 初始化
    for (int i = 0; i < 3; i++) {
        arr[i] = i + 1;
    }

    printf("原始数组: ");
    for (int i = 0; i < 3; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // 扩展到 5 个元素
    int *temp = (int*)realloc(arr, 5 * sizeof(int));
    if (temp == NULL) {
        free(arr);  // realloc 失败，原内存仍有效
        return 1;
    }
    arr = temp;

    // 初始化新元素
    arr[3] = 4;
    arr[4] = 5;

    printf("扩展后数组: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // 缩小到 2 个元素
    temp = (int*)realloc(arr, 2 * sizeof(int));
    if (temp == NULL) {
        free(arr);
        return 1;
    }
    arr = temp;

    printf("缩小后数组: ");
    for (int i = 0; i < 2; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    free(arr);
    return 0;
}
```

**realloc() 注意事项：**

```c
// 错误示例
int *arr = (int*)malloc(10 * sizeof(int));
arr = (int*)realloc(arr, 20 * sizeof(int));  // 危险！
// 如果 realloc 失败，原指针丢失，导致内存泄漏

// 正确示例
int *arr = (int*)malloc(10 * sizeof(int));
int *temp = (int*)realloc(arr, 20 * sizeof(int));
if (temp == NULL) {
    free(arr);  // 释放原内存
    // 处理错误
} else {
    arr = temp;  // 更新指针
}
```

### free() - 释放内存

`free()` 释放动态分配的内存。

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr = (int*)malloc(sizeof(int));
    *ptr = 42;

    printf("释放前: %d\n", *ptr);

    free(ptr);        // 释放内存
    ptr = NULL;       // 避免野指针

    // 错误：使用已释放的内存
    // printf("%d\n", *ptr);  // 未定义行为

    return 0;
}
```

**free() 重要规则：**

```c
// 1. 只能释放 malloc/calloc/realloc 返回的指针
int *p1 = (int*)malloc(sizeof(int));
free(p1);  // 正确

int x = 10;
int *p2 = &x;
// free(p2);  // 错误！不能释放栈内存

// 2. 不要重复释放
int *p = (int*)malloc(sizeof(int));
free(p);
// free(p);  // 错误！重复释放（double free）

// 3. 释放后置为 NULL
free(p);
p = NULL;  // 推荐做法

// 4. 可以安全地 free(NULL)
int *p3 = NULL;
free(p3);  // 安全，什么也不做
```

## 内存泄漏

内存泄漏是指程序分配的内存没有被释放，导致可用内存逐渐减少。

### 常见内存泄漏场景

**场景 1：忘记释放**

```c
#include <stdlib.h>

void memory_leak_1() {
    int *ptr = (int*)malloc(100 * sizeof(int));
    // 使用 ptr...
    // 忘记 free(ptr)
}  // 内存泄漏！

// 正确做法
void no_leak_1() {
    int *ptr = (int*)malloc(100 * sizeof(int));
    if (ptr == NULL) return;

    // 使用 ptr...

    free(ptr);  // 正确释放
    ptr = NULL;
}
```

**场景 2：丢失指针**

```c
void memory_leak_2() {
    int *ptr = (int*)malloc(sizeof(int));
    ptr = (int*)malloc(sizeof(int));  // 第一次分配的内存泄漏！
    free(ptr);  // 只释放了第二次分配的
}

// 正确做法
void no_leak_2() {
    int *ptr = (int*)malloc(sizeof(int));
    // 使用第一次分配的内存...
    free(ptr);  // 释放第一次分配

    ptr = (int*)malloc(sizeof(int));  // 再次分配
    // 使用第二次分配的内存...
    free(ptr);  // 释放第二次分配
}
```

**场景 3：提前返回**

```c
int process_data(int size) {
    int *data = (int*)malloc(size * sizeof(int));
    if (data == NULL) {
        return -1;
    }

    // 某个错误条件
    if (size < 0) {
        return -1;  // 内存泄漏！忘记 free(data)
    }

    // 处理数据...

    free(data);
    return 0;
}

// 正确做法
int process_data_fixed(int size) {
    int *data = (int*)malloc(size * sizeof(int));
    if (data == NULL) {
        return -1;
    }

    int result = 0;

    if (size < 0) {
        result = -1;
        goto cleanup;  // 跳转到清理代码
    }

    // 处理数据...

cleanup:
    free(data);
    return result;
}
```

**场景 4：循环中的泄漏**

```c
void memory_leak_in_loop() {
    for (int i = 0; i < 100; i++) {
        int *ptr = (int*)malloc(sizeof(int));
        *ptr = i;
        // 忘记 free(ptr)
    }  // 泄漏了 100 个 int 的内存
}

// 正确做法
void no_leak_in_loop() {
    for (int i = 0; i < 100; i++) {
        int *ptr = (int*)malloc(sizeof(int));
        if (ptr == NULL) continue;

        *ptr = i;
        // 使用 ptr...

        free(ptr);  // 每次迭代都释放
    }
}
```

### 检测内存泄漏

**使用 Valgrind（Linux）：**

```bash
# 编译程序
gcc -g -o program program.c

# 使用 Valgrind 检测
valgrind --leak-check=full --show-leak-kinds=all ./program
```

**简单的手动跟踪：**

```c
#include <stdio.h>
#include <stdlib.h>

static size_t allocated_memory = 0;

void* tracked_malloc(size_t size) {
    void *ptr = malloc(size);
    if (ptr) {
        allocated_memory += size;
        printf("[分配] %zu 字节, 总计: %zu\n", size, allocated_memory);
    }
    return ptr;
}

void tracked_free(void *ptr, size_t size) {
    if (ptr) {
        free(ptr);
        allocated_memory -= size;
        printf("[释放] %zu 字节, 总计: %zu\n", size, allocated_memory);
    }
}

int main() {
    int *arr = tracked_malloc(10 * sizeof(int));
    // 使用 arr...
    tracked_free(arr, 10 * sizeof(int));

    printf("最终已分配内存: %zu\n", allocated_memory);
    return 0;
}
```

## 野指针

野指针是指向无效内存地址的指针，使用野指针会导致未定义行为。

### 野指针的产生

**1. 未初始化的指针**

```c
int *ptr;  // 野指针！指向随机地址
*ptr = 10; // 未定义行为，可能崩溃
```

**2. 释放后未置空**

```c
int *ptr = (int*)malloc(sizeof(int));
free(ptr);
// ptr 现在是悬空指针（dangling pointer）
*ptr = 10;  // 未定义行为
```

**3. 返回局部变量地址**

```c
int* get_pointer() {
    int x = 10;
    return &x;  // 危险！x 在函数结束后被销毁
}

int main() {
    int *ptr = get_pointer();
    *ptr = 20;  // 未定义行为
    return 0;
}
```

**4. 数组越界**

```c
int arr[5];
int *ptr = &arr[10];  // 越界，野指针
```

### 避免野指针

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // 1. 初始化为 NULL
    int *ptr = NULL;

    // 2. 使用前检查
    if (ptr != NULL) {
        *ptr = 10;
    }

    // 3. 分配后检查
    ptr = (int*)malloc(sizeof(int));
    if (ptr == NULL) {
        fprintf(stderr, "分配失败\n");
        return 1;
    }

    *ptr = 42;
    printf("值: %d\n", *ptr);

    // 4. 释放后置空
    free(ptr);
    ptr = NULL;

    // 5. 使用前再次检查
    if (ptr != NULL) {
        *ptr = 20;
    } else {
        printf("指针为空，安全\n");
    }

    return 0;
}
```

**安全的指针使用模式：**

```c
#include <stdlib.h>

// 安全的指针管理
typedef struct {
    int *data;
    size_t size;
} SafeArray;

SafeArray* create_array(size_t size) {
    SafeArray *arr = (SafeArray*)malloc(sizeof(SafeArray));
    if (arr == NULL) return NULL;

    arr->data = (int*)calloc(size, sizeof(int));
    if (arr->data == NULL) {
        free(arr);
        return NULL;
    }

    arr->size = size;
    return arr;
}

void destroy_array(SafeArray **arr) {
    if (arr == NULL || *arr == NULL) return;

    if ((*arr)->data != NULL) {
        free((*arr)->data);
        (*arr)->data = NULL;
    }

    free(*arr);
    *arr = NULL;  // 双指针确保调用者的指针也被置空
}

int main() {
    SafeArray *arr = create_array(10);
    if (arr == NULL) return 1;

    // 使用数组...

    destroy_array(&arr);  // arr 在函数内被置为 NULL
    // arr 现在是 NULL，安全

    return 0;
}
```

## 内存对齐

内存对齐是为了提高 CPU 访问内存的效率。

### 对齐规则

大多数平台遵循以下规则：
- `char`: 1 字节对齐
- `short`: 2 字节对齐
- `int`: 4 字节对齐
- `long`: 4/8 字节对齐（取决于平台）
- `float`: 4 字节对齐
- `double`: 8 字节对齐
- `指针`: 4/8 字节对齐（取决于平台）

**结构体对齐：**
1. 每个成员按其类型的对齐要求对齐
2. 结构体的总大小是最大成员对齐的倍数

```c
#include <stdio.h>
#include <stddef.h>

// 示例 1：未优化的结构体
struct Unoptimized {
    char a;      // 1 字节
                 // 3 字节填充
    int b;       // 4 字节
    char c;      // 1 字节
                 // 3 字节填充
    int d;       // 4 字节
};  // 总共 16 字节

// 示例 2：优化的结构体
struct Optimized {
    int b;       // 4 字节
    int d;       // 4 字节
    char a;      // 1 字节
    char c;      // 1 字节
                 // 2 字节填充
};  // 总共 12 字节

// 示例 3：复杂结构体
struct Complex {
    char a;      // 1 字节
                 // 1 字节填充
    short b;     // 2 字节
    char c;      // 1 字节
                 // 3 字节填充
    double d;    // 8 字节
    char e;      // 1 字节
                 // 7 字节填充
};  // 总共 24 字节

int main() {
    printf("Unoptimized 大小: %zu\n", sizeof(struct Unoptimized));
    printf("Optimized 大小: %zu\n", sizeof(struct Optimized));
    printf("Complex 大小: %zu\n", sizeof(struct Complex));

    // 查看成员偏移量
    printf("\nComplex 成员偏移:\n");
    printf("a: %zu\n", offsetof(struct Complex, a));
    printf("b: %zu\n", offsetof(struct Complex, b));
    printf("c: %zu\n", offsetof(struct Complex, c));
    printf("d: %zu\n", offsetof(struct Complex, d));
    printf("e: %zu\n", offsetof(struct Complex, e));

    return 0;
}
```

### 使用 `_Alignas` 和 `alignof`

C11 引入了对齐控制：

```c
#include <stdio.h>
#include <stdalign.h>

int main() {
    // 查看基本类型对齐
    printf("char 对齐: %zu\n", alignof(char));
    printf("short 对齐: %zu\n", alignof(short));
    printf("int 对齐: %zu\n", alignof(int));
    printf("long 对齐: %zu\n", alignof(long));
    printf("float 对齐: %zu\n", alignof(float));
    printf("double 对齐: %zu\n", alignof(double));
    printf("指针对齐: %zu\n", alignof(void*));

    // 自定义对齐
    alignas(16) char buffer[64];  // 强制 16 字节对齐
    printf("\nbuffer 地址: %p\n", (void*)buffer);
    printf("buffer 是否 16 字节对齐: %s\n",
           ((uintptr_t)buffer % 16 == 0) ? "是" : "否");

    return 0;
}
```

### 手动内存对齐

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

// 对齐到指定边界
void* aligned_malloc(size_t size, size_t alignment) {
    // alignment 必须是 2 的幂
    if ((alignment & (alignment - 1)) != 0) {
        return NULL;
    }

    // 分配额外空间用于对齐
    void *ptr = malloc(size + alignment + sizeof(void*));
    if (ptr == NULL) return NULL;

    // 计算对齐地址
    uintptr_t addr = (uintptr_t)ptr + sizeof(void*);
    uintptr_t aligned_addr = (addr + alignment - 1) & ~(alignment - 1);

    // 在对齐地址前存储原始指针
    void **stored_ptr = (void**)(aligned_addr - sizeof(void*));
    *stored_ptr = ptr;

    return (void*)aligned_addr;
}

void aligned_free(void *ptr) {
    if (ptr == NULL) return;

    // 获取原始指针
    void **stored_ptr = (void**)((uintptr_t)ptr - sizeof(void*));
    free(*stored_ptr);
}

int main() {
    // 分配 64 字节对齐的内存
    void *ptr = aligned_malloc(1024, 64);
    if (ptr == NULL) {
        fprintf(stderr, "对齐分配失败\n");
        return 1;
    }

    printf("对齐地址: %p\n", ptr);
    printf("是否 64 字节对齐: %s\n",
           ((uintptr_t)ptr % 64 == 0) ? "是" : "否");

    // 使用内存...

    aligned_free(ptr);
    return 0;
}
```

### POSIX `posix_memalign`

在支持 POSIX 的系统上：

```c
#include <stdlib.h>
#include <stdio.h>

int main() {
    void *ptr = NULL;
    int result = posix_memalign(&ptr, 64, 1024);

    if (result != 0) {
        fprintf(stderr, "posix_memalign 失败\n");
        return 1;
    }

    printf("对齐地址: %p\n", ptr);

    // 使用内存...

    free(ptr);  // 使用普通 free 释放
    return 0;
}
```

### 对齐的重要性

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define SIZE 10000000

// 测试对齐访问 vs 非对齐访问
int main() {
    clock_t start, end;
    double cpu_time_used;

    // 对齐访问
    int *aligned = (int*)malloc(SIZE * sizeof(int));
    start = clock();
    for (int i = 0; i < SIZE; i++) {
        aligned[i] = i;
    }
    end = clock();
    cpu_time_used = ((double)(end - start)) / CLOCKS_PER_SEC;
    printf("对齐访问时间: %f 秒\n", cpu_time_used);

    // 模拟非对齐访问（偏移 1 字节）
    char *buffer = (char*)malloc(SIZE * sizeof(int) + 1);
    int *unaligned = (int*)(buffer + 1);
    start = clock();
    for (int i = 0; i < SIZE; i++) {
        unaligned[i] = i;
    }
    end = clock();
    cpu_time_used = ((double)(end - start)) / CLOCKS_PER_SEC;
    printf("非对齐访问时间: %f 秒\n", cpu_time_used);

    free(aligned);
    free(buffer);

    return 0;
}
```

## 最佳实践

### 内存分配检查

```c
void* safe_malloc(size_t size) {
    void *ptr = malloc(size);
    if (ptr == NULL) {
        fprintf(stderr, "内存分配失败: %zu 字节\n", size);
        exit(EXIT_FAILURE);
    }
    return ptr;
}
```

### 配对原则

```c
// 谁分配，谁释放
char* create_string(const char *src) {
    char *dest = malloc(strlen(src) + 1);
    if (dest) strcpy(dest, src);
    return dest;
}

void use_string() {
    char *str = create_string("Hello");
    // 使用 str...
    free(str);  // 调用者负责释放
}
```

### 使用智能宏

```c
#define SAFE_FREE(ptr) do { \
    if (ptr) { \
        free(ptr); \
        ptr = NULL; \
    } \
} while(0)

#define SAFE_MALLOC(ptr, size) do { \
    ptr = malloc(size); \
    if (ptr == NULL) { \
        fprintf(stderr, "malloc 失败\n"); \
        exit(EXIT_FAILURE); \
    } \
} while(0)
```

### RAII 风格的资源管理

```c
#define SCOPED_PTR(type, name, size) \
    type *name = malloc(size); \
    if (name == NULL) return; \
    __attribute__((cleanup(cleanup_##type))) type *_scoped_##name = name

void cleanup_int(int **ptr) {
    if (*ptr) {
        free(*ptr);
        *ptr = NULL;
    }
}

void example_function() {
    SCOPED_PTR(int, arr, 10 * sizeof(int));
    // 使用 arr...
    // 函数结束时自动清理
}
```

### 内存池

对于频繁的小块内存分配：

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct MemoryPool {
    void *memory;
    size_t size;
    size_t used;
} MemoryPool;

MemoryPool* create_pool(size_t size) {
    MemoryPool *pool = malloc(sizeof(MemoryPool));
    if (pool == NULL) return NULL;

    pool->memory = malloc(size);
    if (pool->memory == NULL) {
        free(pool);
        return NULL;
    }

    pool->size = size;
    pool->used = 0;
    return pool;
}

void* pool_alloc(MemoryPool *pool, size_t size) {
    if (pool->used + size > pool->size) {
        return NULL;  // 池已满
    }

    void *ptr = (char*)pool->memory + pool->used;
    pool->used += size;
    return ptr;
}

void reset_pool(MemoryPool *pool) {
    pool->used = 0;  // 重置，不释放内存
}

void destroy_pool(MemoryPool *pool) {
    if (pool) {
        if (pool->memory) free(pool->memory);
        free(pool);
    }
}

int main() {
    MemoryPool *pool = create_pool(1024);

    int *a = (int*)pool_alloc(pool, sizeof(int));
    int *b = (int*)pool_alloc(pool, sizeof(int));

    *a = 10;
    *b = 20;

    printf("a = %d, b = %d\n", *a, *b);

    reset_pool(pool);  // 快速重置
    destroy_pool(pool);

    return 0;
}
```

## 调试工具

### Valgrind

```bash
valgrind --leak-check=full \
         --show-leak-kinds=all \
         --track-origins=yes \
         --verbose \
         ./program
```

### AddressSanitizer (ASan)

```bash
# 编译时添加标志
gcc -fsanitize=address -g -o program program.c

# 运行
./program
```

### 静态分析

```bash
# 使用 cppcheck
cppcheck --enable=all program.c

# 使用 clang static analyzer
clang --analyze program.c
```

## 总结

C 语言内存管理的关键点：

1. **理解栈与堆**：栈自动管理，速度快但空间有限；堆手动管理，灵活但需谨慎
2. **正确使用分配函数**：
   - `malloc`: 分配但不初始化
   - `calloc`: 分配并清零
   - `realloc`: 调整大小
   - `free`: 释放内存
3. **避免内存泄漏**：分配的内存必须释放，注意所有返回路径
4. **防止野指针**：初始化指针，释放后置 NULL，不返回局部变量地址
5. **注意内存对齐**：合理安排结构体成员，利用对齐提高性能
6. **使用调试工具**：Valgrind、ASan 等工具帮助发现问题
7. **遵循最佳实践**：检查返回值，配对分配与释放，使用安全函数

掌握这些技能，你就能编写出高效、安全的 C 程序。记住：**手动内存管理虽然繁琐，但它赋予了程序员对程序性能的完全控制**。
