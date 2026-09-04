---
title: C 预处理器
description: 深入理解 C 预处理器：宏定义、文件包含、条件编译、#pragma 指令与常见陷阱
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C
  - 预处理器
  - 宏
  - 条件编译
  - 头文件
status: imported
origin: old/src/content/docs/cpp/c-preprocessor.zh.md
divergence: 0.206
issues: []
legacy:
  category: Cpp
  subcategory: C 语言
  order: 3
  lastUpdated: 2026-01-07
---

C 预处理器（C Preprocessor，简称 CPP）是 C 语言编译过程中的第一个阶段。它在实际编译之前对源代码进行文本级别的处理，包括宏展开、文件包含、条件编译等操作。理解预处理器是掌握 C 语言的关键技能之一。

## 概念解释

### 什么是预处理器

预处理器是一个独立于编译器的程序，它处理以 `#` 开头的指令（称为预处理指令）。预处理器在编译器看到代码之前，先对源代码进行文本替换和处理。

**预处理器的历史：**
- 1972 年：随 C 语言诞生于贝尔实验室
- 1978 年：K&R C 标准化了基本预处理指令
- 1989 年：ANSI C (C89) 增加了 `#pragma`、`#error` 等指令
- 1999 年：C99 引入了 `_Pragma` 运算符和可变参数宏
- 2011 年：C11 进一步完善了预处理器功能

**预处理器解决的问题：**
1. **代码复用**：通过 `#include` 共享头文件
2. **常量定义**：使用宏定义避免魔数
3. **条件编译**：根据平台或配置编译不同代码
4. **代码生成**：通过宏减少重复代码
5. **调试支持**：条件性包含调试代码

### 编译阶段

C 程序的编译过程：

```
源代码 (.c) → 预处理 → 编译 → 汇编 → 链接 → 可执行文件

具体过程：
1. 预处理阶段：处理 #include, #define, #if 等指令
2. 编译阶段：将预处理后的代码转换为汇编代码
3. 汇编阶段：将汇编代码转换为目标文件 (.o)
4. 链接阶段：将多个目标文件链接成可执行文件
```

查看预处理结果：

```bash
# GCC 查看预处理输出
gcc -E source.c -o source.i

# 或直接输出到标准输出
gcc -E source.c

# Clang
clang -E source.c

# 保留注释
gcc -E -C source.c
```

## 核心原理

### 预处理器工作流程

预处理器按以下顺序处理源文件：

1. **物理行合并**：将以 `\` 结尾的行与下一行合并
2. **三字符序列替换**：替换三字符序列（现代编译器通常禁用）
3. **注释移除**：将注释替换为单个空格
4. **预处理指令处理**：执行 `#include`、`#define` 等指令
5. **宏展开**：替换所有宏调用
6. **生成预处理后的代码**：输出给编译器

```c
// 示例：预处理前
#define MAX 100
#define SQUARE(x) ((x) * (x))

int arr[MAX];
int result = SQUARE(5 + 3);

// 示例：预处理后
int arr[100];
int result = ((5 + 3) * (5 + 3));
```

### 词法单元（Token）

预处理器将源代码分解为词法单元：

```c
// 词法单元类型
// 1. 标识符：变量名、函数名、宏名
// 2. 关键字：int, if, while, return 等
// 3. 常量：100, 3.14, 'a', "hello"
// 4. 运算符：+, -, *, /, =, ==, ++ 等
// 5. 标点符号：{, }, (, ), ;, , 等

// 预处理器操作的是词法单元，而非简单的文本
#define PASTE(a, b) a ## b  // ## 是词法单元粘贴运算符
int PASTE(var, 1) = 10;     // 展开为：int var1 = 10;
```

## 核心要点

### 预处理指令分类

| 类别 | 指令 | 说明 |
|------|------|------|
| 文件包含 | `#include` | 包含头文件 |
| 宏定义 | `#define`, `#undef` | 定义和取消宏 |
| 条件编译 | `#if`, `#ifdef`, `#ifndef`, `#elif`, `#else`, `#endif` | 条件性编译代码 |
| 编译器控制 | `#pragma` | 编译器特定指令 |
| 错误处理 | `#error`, `#warning` | 生成编译错误或警告 |
| 行控制 | `#line` | 修改行号和文件名 |
| 空指令 | `#` | 无操作 |

### 预定义宏

```c
#include <stdio.h>

int main() {
    // 标准预定义宏
    printf("文件名: %s\n", __FILE__);
    printf("行号: %d\n", __LINE__);
    printf("函数名: %s\n", __func__);  // C99
    printf("编译日期: %s\n", __DATE__);
    printf("编译时间: %s\n", __TIME__);

    // 标准版本宏
    #ifdef __STDC__
    printf("符合 ANSI C 标准\n");
    #endif

    #ifdef __STDC_VERSION__
    printf("C 标准版本: %ld\n", __STDC_VERSION__);
    // 199901L = C99, 201112L = C11, 201710L = C17
    #endif

    // 编译器特定宏
    #ifdef __GNUC__
    printf("GCC 版本: %d.%d.%d\n", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
    #endif

    #ifdef _MSC_VER
    printf("MSVC 版本: %d\n", _MSC_VER);
    #endif

    #ifdef __clang__
    printf("Clang 版本: %d.%d.%d\n", __clang_major__, __clang_minor__, __clang_patchlevel__);
    #endif

    return 0;
}
```

## 代码示例

### #define 宏定义

#### 对象宏（Object-like Macros）

```c
#include <stdio.h>

// 简单常量定义
#define PI 3.14159265358979
#define MAX_SIZE 100
#define GREETING "Hello, World!"
#define NEWLINE '\n'

// 多行宏（使用反斜杠续行）
#define LONG_STRING "这是一个很长的字符串，" \
                    "它跨越了多行，" \
                    "但实际上是一行。"

// 空宏
#define DEBUG  // 仅用于条件编译检测

// 取消宏定义
#undef PI
#define PI 3.14  // 重新定义

int main() {
    double radius = 5.0;
    double area = PI * radius * radius;

    printf("圆的面积: %.2f%c", area, NEWLINE);
    printf("%s\n", GREETING);
    printf("最大尺寸: %d\n", MAX_SIZE);

    return 0;
}
```

#### 函数宏（Function-like Macros）

```c
#include <stdio.h>

// 基本函数宏
#define SQUARE(x) ((x) * (x))
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define ABS(x) ((x) < 0 ? -(x) : (x))

// 多语句宏（使用 do-while(0)）
#define SWAP(a, b) do { \
    typeof(a) temp = a; \
    a = b; \
    b = temp; \
} while(0)

// 带类型的宏
#define MALLOC_ARRAY(type, n) ((type*)malloc((n) * sizeof(type)))
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// 调试宏
#define DEBUG_PRINT(fmt, ...) \
    fprintf(stderr, "[DEBUG] %s:%d: " fmt "\n", __FILE__, __LINE__, ##__VA_ARGS__)

int main() {
    int a = 5, b = 3;

    printf("SQUARE(4) = %d\n", SQUARE(4));
    printf("MAX(%d, %d) = %d\n", a, b, MAX(a, b));
    printf("ABS(-10) = %d\n", ABS(-10));

    SWAP(a, b);
    printf("交换后: a = %d, b = %d\n", a, b);

    int arr[] = {1, 2, 3, 4, 5};
    printf("数组大小: %zu\n", ARRAY_SIZE(arr));

    DEBUG_PRINT("变量 a = %d", a);

    return 0;
}
```

#### 字符串化与词法单元粘贴

```c
#include <stdio.h>

// # 字符串化运算符
#define STRINGIFY(x) #x
#define TOSTRING(x) STRINGIFY(x)

// ## 词法单元粘贴运算符
#define CONCAT(a, b) a ## b
#define MAKE_VAR(n) var_ ## n
#define MAKE_FUNC(name) void func_ ## name(void)

// 实用示例
#define PRINT_VAR(var) printf(#var " = %d\n", var)
#define PRINT_EXPR(expr) printf(#expr " = %d\n", (expr))

// 生成枚举和字符串数组
#define FOREACH_COLOR(COLOR) \
    COLOR(RED)   \
    COLOR(GREEN) \
    COLOR(BLUE)  \
    COLOR(YELLOW)

#define GENERATE_ENUM(ENUM) ENUM,
#define GENERATE_STRING(STRING) #STRING,

enum Color {
    FOREACH_COLOR(GENERATE_ENUM)
    COLOR_COUNT
};

const char* color_names[] = {
    FOREACH_COLOR(GENERATE_STRING)
};

int main() {
    // 字符串化
    printf("%s\n", STRINGIFY(Hello World));  // 输出: Hello World
    printf("%s\n", TOSTRING(MAX_SIZE));      // 输出: MAX_SIZE（或其展开值）

    // 词法单元粘贴
    int MAKE_VAR(1) = 10;  // int var_1 = 10;
    int MAKE_VAR(2) = 20;  // int var_2 = 20;
    int CONCAT(var, 3) = 30;  // int var3 = 30;

    printf("var_1 = %d, var_2 = %d, var3 = %d\n", var_1, var_2, var3);

    // 打印变量
    int x = 42;
    PRINT_VAR(x);           // 输出: x = 42
    PRINT_EXPR(x * 2 + 1);  // 输出: x * 2 + 1 = 85

    // 枚举与字符串
    for (int i = 0; i < COLOR_COUNT; i++) {
        printf("Color %d: %s\n", i, color_names[i]);
    }

    return 0;
}
```

#### 可变参数宏（C99）

```c
#include <stdio.h>
#include <stdarg.h>

// 基本可变参数宏
#define PRINTF(fmt, ...) printf(fmt, __VA_ARGS__)

// 处理空参数的情况（GCC 扩展）
#define LOG(fmt, ...) printf("[LOG] " fmt "\n", ##__VA_ARGS__)

// 带级别的日志宏
#define LOG_LEVEL_DEBUG 0
#define LOG_LEVEL_INFO  1
#define LOG_LEVEL_WARN  2
#define LOG_LEVEL_ERROR 3

#define CURRENT_LOG_LEVEL LOG_LEVEL_DEBUG

#define LOG_DEBUG(fmt, ...) \
    do { if (CURRENT_LOG_LEVEL <= LOG_LEVEL_DEBUG) \
        fprintf(stderr, "[DEBUG] %s:%d: " fmt "\n", __FILE__, __LINE__, ##__VA_ARGS__); \
    } while(0)

#define LOG_INFO(fmt, ...) \
    do { if (CURRENT_LOG_LEVEL <= LOG_LEVEL_INFO) \
        fprintf(stderr, "[INFO] " fmt "\n", ##__VA_ARGS__); \
    } while(0)

#define LOG_ERROR(fmt, ...) \
    do { if (CURRENT_LOG_LEVEL <= LOG_LEVEL_ERROR) \
        fprintf(stderr, "[ERROR] %s:%d: " fmt "\n", __FILE__, __LINE__, ##__VA_ARGS__); \
    } while(0)

// 断言宏
#define ASSERT(cond, fmt, ...) \
    do { if (!(cond)) { \
        fprintf(stderr, "Assertion failed: %s\n", #cond); \
        fprintf(stderr, "  File: %s, Line: %d\n", __FILE__, __LINE__); \
        fprintf(stderr, "  Message: " fmt "\n", ##__VA_ARGS__); \
        abort(); \
    }} while(0)

int main() {
    int x = 10;
    LOG("程序启动");
    LOG("x = %d", x);

    LOG_DEBUG("调试信息: x = %d", x);
    LOG_INFO("程序正在运行");
    LOG_ERROR("发生错误: %s", "示例错误");

    ASSERT(x > 0, "x 必须为正数，当前值: %d", x);

    return 0;
}
```

### #include 文件包含

```c
// === 系统头文件 vs 用户头文件 ===

// 尖括号：在系统目录中搜索
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 双引号：先在当前目录搜索，然后搜索系统目录
#include "myheader.h"
#include "utils/helper.h"
#include "../common/types.h"

// === 头文件保护（Include Guards）===

// 方法 1：传统的 #ifndef 保护
// myheader.h
#ifndef MYHEADER_H
#define MYHEADER_H

// 头文件内容
typedef struct {
    int x;
    int y;
} Point;

void print_point(Point p);

#endif // MYHEADER_H

// 方法 2：#pragma once（非标准但广泛支持）
// myheader.h
#pragma once

typedef struct {
    int x;
    int y;
} Point;

void print_point(Point p);

// === 组织良好的头文件示例 ===
// config.h
#ifndef CONFIG_H
#define CONFIG_H

// 版本信息
#define VERSION_MAJOR 1
#define VERSION_MINOR 0
#define VERSION_PATCH 0

// 平台检测
#if defined(_WIN32) || defined(_WIN64)
    #define PLATFORM_WINDOWS 1
    #define PLATFORM_NAME "Windows"
#elif defined(__linux__)
    #define PLATFORM_LINUX 1
    #define PLATFORM_NAME "Linux"
#elif defined(__APPLE__)
    #define PLATFORM_MACOS 1
    #define PLATFORM_NAME "macOS"
#else
    #define PLATFORM_UNKNOWN 1
    #define PLATFORM_NAME "Unknown"
#endif

// 编译器检测
#if defined(__GNUC__)
    #define COMPILER_GCC 1
#elif defined(_MSC_VER)
    #define COMPILER_MSVC 1
#elif defined(__clang__)
    #define COMPILER_CLANG 1
#endif

// 导出宏
#ifdef PLATFORM_WINDOWS
    #ifdef BUILDING_DLL
        #define API_EXPORT __declspec(dllexport)
    #else
        #define API_EXPORT __declspec(dllimport)
    #endif
#else
    #define API_EXPORT __attribute__((visibility("default")))
#endif

#endif // CONFIG_H
```

### 条件编译

```c
#include <stdio.h>

// === #if, #elif, #else, #endif ===

#define VERSION 2

#if VERSION == 1
    #define FEATURE_A 1
    #define FEATURE_B 0
#elif VERSION == 2
    #define FEATURE_A 1
    #define FEATURE_B 1
#else
    #define FEATURE_A 0
    #define FEATURE_B 0
#endif

// === #ifdef 和 #ifndef ===

#define DEBUG

#ifdef DEBUG
    #define LOG(msg) printf("[DEBUG] %s\n", msg)
#else
    #define LOG(msg) // 空操作
#endif

#ifndef BUFFER_SIZE
    #define BUFFER_SIZE 1024
#endif

// === defined 运算符 ===

#if defined(DEBUG) && defined(VERBOSE)
    #define DETAILED_LOG 1
#endif

#if !defined(NDEBUG)
    #define ASSERTIONS_ENABLED 1
#endif

// 复杂条件
#if (defined(__linux__) || defined(__APPLE__)) && !defined(_WIN32)
    #define UNIX_LIKE 1
#endif

// === 编译时检查 ===

// 静态断言（C11）
#if __STDC_VERSION__ >= 201112L
    _Static_assert(sizeof(int) >= 4, "int must be at least 4 bytes");
#endif

// 使用 #error 进行编译时检查
#if !defined(TARGET_PLATFORM)
    #error "TARGET_PLATFORM must be defined"
#endif

#if BUFFER_SIZE < 64
    #warning "BUFFER_SIZE is very small, consider increasing it"
#endif

// === 特性检测与回退 ===

// 检测 C 标准版本
#if __STDC_VERSION__ >= 201112L
    // C11 特性可用
    #define HAS_GENERIC 1
    #define HAS_STATIC_ASSERT 1
#elif __STDC_VERSION__ >= 199901L
    // C99 特性可用
    #define HAS_GENERIC 0
    #define HAS_STATIC_ASSERT 0
#else
    // C89/C90
    #define HAS_GENERIC 0
    #define HAS_STATIC_ASSERT 0
#endif

// 条件定义内联函数
#if defined(__GNUC__) || defined(__clang__)
    #define INLINE static inline __attribute__((always_inline))
#elif defined(_MSC_VER)
    #define INLINE static __forceinline
#else
    #define INLINE static inline
#endif

int main() {
    LOG("程序开始");

    #if FEATURE_A
    printf("Feature A 已启用\n");
    #endif

    #if FEATURE_B
    printf("Feature B 已启用\n");
    #endif

    printf("缓冲区大小: %d\n", BUFFER_SIZE);

    return 0;
}
```

### #pragma 指令

```c
#include <stdio.h>

// === 常用 #pragma 指令 ===

// 头文件保护
#pragma once

// === 结构体对齐 ===

// GCC/Clang 方式
#pragma pack(push, 1)  // 保存当前对齐并设置为 1 字节对齐
struct PackedStruct {
    char a;    // 1 字节
    int b;     // 4 字节（通常）
    short c;   // 2 字节
};  // 无填充，总共 7 字节
#pragma pack(pop)  // 恢复之前的对齐

struct NormalStruct {
    char a;    // 1 字节 + 3 字节填充
    int b;     // 4 字节
    short c;   // 2 字节 + 2 字节填充
};  // 总共 12 字节（在典型的 32/64 位系统上）

// === 警告控制 ===

// GCC/Clang
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"
void function_with_warnings() {
    int unused_var = 42;  // 不会产生警告
}
#pragma GCC diagnostic pop

// MSVC
#pragma warning(push)
#pragma warning(disable: 4996)  // 禁用特定警告
// 使用被认为不安全的函数...
#pragma warning(pop)

// === 链接库 (MSVC) ===
#ifdef _MSC_VER
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "kernel32.lib")
#pragma comment(linker, "/subsystem:console")
#endif

// === 区域标记（IDE 支持）===
#pragma region Helper Functions
void helper1() { }
void helper2() { }
#pragma endregion

// === 消息 ===
#pragma message("Compiling " __FILE__ " with DEBUG enabled")

// === 优化控制 ===

// GCC
#pragma GCC optimize("O3")
void highly_optimized_function() {
    // 此函数使用 O3 优化
}

#pragma GCC optimize("O0")
void debug_friendly_function() {
    // 此函数不优化，便于调试
}

// === 循环优化提示 ===
void loop_example(int* arr, int n) {
    // GCC 循环展开提示
    #pragma GCC unroll 4
    for (int i = 0; i < n; i++) {
        arr[i] *= 2;
    }
}

// === _Pragma 运算符 (C99) ===
#define DO_PRAGMA(x) _Pragma(#x)
#define DISABLE_WARNING(warning) \
    DO_PRAGMA(GCC diagnostic push) \
    DO_PRAGMA(GCC diagnostic ignored warning)
#define ENABLE_WARNING \
    DO_PRAGMA(GCC diagnostic pop)

int main() {
    printf("PackedStruct 大小: %zu\n", sizeof(struct PackedStruct));
    printf("NormalStruct 大小: %zu\n", sizeof(struct NormalStruct));

    DISABLE_WARNING("-Wunused-variable")
    int unused = 100;
    ENABLE_WARNING

    return 0;
}
```

### #error 和 #warning

```c
// === 编译时错误和警告 ===

// 强制要求定义某个宏
#ifndef CONFIG_FILE
    #error "CONFIG_FILE must be defined. Use -DCONFIG_FILE=\"config.h\""
#endif

// 检查类型大小
#if INTPTR_MAX == INT64_MAX
    // 64 位平台
#elif INTPTR_MAX == INT32_MAX
    // 32 位平台
#else
    #error "Unsupported platform: pointer size is neither 32 nor 64 bits"
#endif

// 版本检查
#if defined(__GNUC__) && __GNUC__ < 7
    #error "GCC 7 or later is required"
#endif

// 功能提示
#ifdef USE_DEPRECATED_API
    #warning "USE_DEPRECATED_API is deprecated. Please migrate to the new API."
#endif

// 开发阶段提醒
#warning "TODO: Implement error handling before release"

// 条件警告
#if BUFFER_SIZE > 1048576
    #warning "Large buffer size may cause performance issues"
#endif
```

### #line 指令

```c
#include <stdio.h>

// #line 可以修改 __LINE__ 和 __FILE__ 的值
// 通常用于代码生成器

int main() {
    printf("当前位置: %s, 第 %d 行\n", __FILE__, __LINE__);

    #line 100 "virtual_file.c"
    printf("修改后位置: %s, 第 %d 行\n", __FILE__, __LINE__);

    // __LINE__ 继续递增
    printf("下一行: %s, 第 %d 行\n", __FILE__, __LINE__);

    #line 1  // 重置行号，保持当前文件名
    printf("重置后: %s, 第 %d 行\n", __FILE__, __LINE__);

    return 0;
}
```

## 最佳实践

### 宏命名约定

```c
// 好的命名
#define MAX_BUFFER_SIZE 1024        // 常量全大写
#define MIN(a, b) ((a) < (b) ? (a) : (b))  // 函数宏全大写
#define PROJECT_VERSION "1.0.0"     // 项目前缀

// 避免的命名
#define max(a, b) ((a) < (b) ? (a) : (b))  // 容易与标准库冲突
#define size 100  // 太通用，容易冲突
```

### 宏参数保护

```c
// 错误：缺少括号
#define SQUARE_BAD(x) x * x
int result1 = SQUARE_BAD(5 + 3);  // 展开为: 5 + 3 * 5 + 3 = 23，期望 64

// 正确：完整括号保护
#define SQUARE_GOOD(x) ((x) * (x))
int result2 = SQUARE_GOOD(5 + 3);  // 展开为: ((5 + 3) * (5 + 3)) = 64

// 参数保护规则：
// 1. 每个参数用括号包围
// 2. 整个表达式用括号包围
// 3. 避免参数被展开多次带来的副作用

#define DOUBLE_BAD(x) ((x) + (x))
int i = 5;
int result3 = DOUBLE_BAD(i++);  // 未定义行为！i 被递增两次

// 如果需要避免多次求值，使用内联函数或 GCC 扩展
#define DOUBLE_SAFE(x) ({ typeof(x) _x = (x); _x + _x; })  // GCC 扩展
```

### 多语句宏使用 do-while(0)

```c
// 错误：简单展开
#define LOG_ERROR_BAD(msg) \
    fprintf(stderr, "Error: %s\n", msg); \
    exit(1)

// 问题演示
if (error)
    LOG_ERROR_BAD("Something went wrong");
// 展开为：
// if (error)
//     fprintf(stderr, "Error: %s\n", msg);
// exit(1);  // 总是执行！

// 正确：使用 do-while(0)
#define LOG_ERROR_GOOD(msg) \
    do { \
        fprintf(stderr, "Error: %s\n", msg); \
        exit(1); \
    } while(0)

// 现在正确展开
if (error)
    LOG_ERROR_GOOD("Something went wrong");
// 展开为：
// if (error)
//     do { fprintf(stderr, "Error: %s\n", msg); exit(1); } while(0);
```

### 条件编译组织

```c
// === 清晰的条件编译结构 ===

// 平台相关代码
#if defined(_WIN32)
    // Windows 实现
    #include <windows.h>
    #define SLEEP(ms) Sleep(ms)
#elif defined(__linux__)
    // Linux 实现
    #include <unistd.h>
    #define SLEEP(ms) usleep((ms) * 1000)
#elif defined(__APPLE__)
    // macOS 实现
    #include <unistd.h>
    #define SLEEP(ms) usleep((ms) * 1000)
#else
    #error "Unsupported platform"
#endif

// 功能开关
#ifndef ENABLE_LOGGING
    #define ENABLE_LOGGING 1  // 默认启用
#endif

#if ENABLE_LOGGING
    #define LOG(fmt, ...) printf("[LOG] " fmt "\n", ##__VA_ARGS__)
#else
    #define LOG(fmt, ...) ((void)0)
#endif

// 调试与发布配置
#ifdef NDEBUG
    #define DEBUG_ONLY(code)
    #define ASSERT(cond) ((void)0)
#else
    #define DEBUG_ONLY(code) code
    #define ASSERT(cond) \
        do { if (!(cond)) { \
            fprintf(stderr, "Assertion failed: %s (%s:%d)\n", #cond, __FILE__, __LINE__); \
            abort(); \
        }} while(0)
#endif
```

### 头文件最佳实践

```c
// === mylib.h ===
#ifndef MYLIB_H
#define MYLIB_H

// 1. 首先包含必要的头文件
#include <stddef.h>
#include <stdbool.h>

// 2. C++ 兼容性
#ifdef __cplusplus
extern "C" {
#endif

// 3. 版本和配置
#define MYLIB_VERSION_MAJOR 1
#define MYLIB_VERSION_MINOR 0
#define MYLIB_VERSION_PATCH 0

// 4. 平台检测和导出宏
#if defined(_WIN32) && defined(MYLIB_BUILD_DLL)
    #define MYLIB_API __declspec(dllexport)
#elif defined(_WIN32) && defined(MYLIB_USE_DLL)
    #define MYLIB_API __declspec(dllimport)
#elif defined(__GNUC__) && __GNUC__ >= 4
    #define MYLIB_API __attribute__((visibility("default")))
#else
    #define MYLIB_API
#endif

// 5. 类型定义
typedef struct MyLibContext MyLibContext;

// 6. 函数声明
MYLIB_API MyLibContext* mylib_create(void);
MYLIB_API void mylib_destroy(MyLibContext* ctx);
MYLIB_API int mylib_process(MyLibContext* ctx, const void* data, size_t size);

// 7. 内联函数（如果需要）
static inline int mylib_version(void) {
    return MYLIB_VERSION_MAJOR * 10000 + MYLIB_VERSION_MINOR * 100 + MYLIB_VERSION_PATCH;
}

// 8. C++ 兼容性结束
#ifdef __cplusplus
}
#endif

#endif // MYLIB_H
```

### 优先使用现代替代方案

```c
// 在可能的情况下，优先使用这些现代替代方案：

// 1. 常量：使用 const 或 enum 代替 #define
// 不推荐
#define MAX_SIZE 100

// 推荐（C99+）
enum { MAX_SIZE = 100 };
// 或
static const int MAX_SIZE = 100;

// 2. 类型安全的"泛型"：使用 _Generic（C11）
#define print_value(x) _Generic((x), \
    int: print_int, \
    double: print_double, \
    char*: print_string \
)(x)

void print_int(int x) { printf("%d\n", x); }
void print_double(double x) { printf("%f\n", x); }
void print_string(char* x) { printf("%s\n", x); }

// 3. 内联函数代替函数宏
// 不推荐
#define SQUARE(x) ((x) * (x))

// 推荐
static inline int square(int x) {
    return x * x;
}

// 4. 静态断言代替 #error（C11）
// 不推荐
#if sizeof(int) != 4
#error "int must be 4 bytes"
#endif

// 推荐（C11）
_Static_assert(sizeof(int) == 4, "int must be 4 bytes");
```

## 常见陷阱

### 宏展开顺序问题

```c
#include <stdio.h>

#define A 1
#define B A + 1
#define C B + 1

// 看起来 C 应该等于 3，但...
int x = C * 2;  // 展开为: 1 + 1 + 1 * 2 = 4，而不是 6

// 正确做法：
#define A 1
#define B (A + 1)
#define C (B + 1)

int y = C * 2;  // 展开为: ((1 + 1) + 1) * 2 = 6
```

### 多次求值副作用

```c
#include <stdio.h>

#define MAX(a, b) ((a) > (b) ? (a) : (b))

int main() {
    int i = 5, j = 3;

    // 危险！i++ 可能被执行多次
    int result = MAX(i++, j++);
    // 展开为: ((i++) > (j++) ? (i++) : (j++))
    // i++ 执行两次！

    printf("i = %d, j = %d, result = %d\n", i, j, result);
    // 输出可能是: i = 7, j = 4, result = 6

    // 解决方案 1：使用临时变量
    i = 5; j = 3;
    int temp_i = i++;
    int temp_j = j++;
    result = MAX(temp_i, temp_j);

    // 解决方案 2：使用内联函数
    // static inline int max_safe(int a, int b) { return a > b ? a : b; }

    // 解决方案 3：GCC 扩展
    #define MAX_SAFE(a, b) ({ \
        typeof(a) _a = (a); \
        typeof(b) _b = (b); \
        _a > _b ? _a : _b; \
    })

    i = 5; j = 3;
    result = MAX_SAFE(i++, j++);
    printf("Safe: i = %d, j = %d, result = %d\n", i, j, result);
    // 输出: i = 6, j = 4, result = 5

    return 0;
}
```

### 宏与分号

```c
// 问题：多余的分号
#define SETUP() setup_function()

if (need_setup)
    SETUP();  // 看起来正常
else
    cleanup();
// 展开后：
// if (need_setup)
//     setup_function();;  // 两个分号！
// else  // 错误：else 与 if 不匹配
//     cleanup();

// 解决方案：使用 do-while(0)
#define SETUP() do { setup_function(); } while(0)
```

### 字符串字面量不能被宏替换

```c
#include <stdio.h>

#define VALUE 42

int main() {
    // 宏不会在字符串内部被替换
    printf("VALUE = VALUE\n");  // 输出: VALUE = VALUE
    printf("VALUE = %d\n", VALUE);  // 输出: VALUE = 42

    // 使用字符串化
    #define STR(x) #x
    #define XSTR(x) STR(x)

    printf("VALUE = " XSTR(VALUE) "\n");  // 输出: VALUE = 42

    return 0;
}
```

### 空宏参数

```c
#include <stdio.h>

#define CALL(func, arg) func(arg)

// 空参数是允许的
CALL(printf, "Hello\n");  // printf("Hello\n")
CALL(printf, );           // printf() - 编译错误！

// 解决方案：检查空参数
#define IS_EMPTY(...) (sizeof((char[]){#__VA_ARGS__}) == 1)
```

### 递归宏陷阱

```c
// 宏不能递归展开自己
#define FOO (FOO + 1)  // FOO 不会无限展开

int x = FOO;  // 展开为: int x = (FOO + 1);
// FOO 在展开后不会再次展开

// 间接递归也不行
#define A B
#define B A

int y = A;  // 展开为: int y = A; (不是无限循环)
```

### 头文件循环包含

```c
// === a.h ===
#ifndef A_H
#define A_H

#include "b.h"  // 包含 b.h

typedef struct {
    B_Type* b_ptr;  // 使用 B_Type
} A_Type;

#endif

// === b.h ===
#ifndef B_H
#define B_H

#include "a.h"  // 包含 a.h - 循环！

typedef struct {
    A_Type* a_ptr;  // 使用 A_Type - 可能还未定义！
} B_Type;

#endif

// 解决方案：前向声明
// === a.h ===
#ifndef A_H
#define A_H

struct B_Type;  // 前向声明

typedef struct {
    struct B_Type* b_ptr;
} A_Type;

#endif

// === b.h ===
#ifndef B_H
#define B_H

struct A_Type;  // 前向声明

typedef struct {
    struct A_Type* a_ptr;
} B_Type;

#endif
```

### 条件编译中的陷阱

```c
// 陷阱 1：使用未定义的宏进行比较
#if UNDEFINED_MACRO == 1  // 未定义的宏被视为 0
    // 这段代码不会被编译
#endif

#if UNDEFINED_MACRO  // 这也是 0（假）
    // 这段代码不会被编译
#endif

// 陷阱 2：宏定义的布尔值
#define FEATURE_ENABLED 0  // 定义了，但值为 0

#ifdef FEATURE_ENABLED  // 为真！因为宏已定义
    // 这段代码会被编译
#endif

#if FEATURE_ENABLED  // 为假！因为值为 0
    // 这段代码不会被编译
#endif

// 最佳实践：明确使用
#if defined(FEATURE_ENABLED) && FEATURE_ENABLED
    // 检查宏是否定义且值为真
#endif
```

## 性能考量

### 预处理对编译时间的影响

```c
// 问题：大量头文件包含增加编译时间

// 不好的做法：在头文件中包含不必要的头文件
// myheader.h
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
// ... 只是为了使用 size_t

// 好的做法：只包含必要的头文件
// myheader.h
#include <stddef.h>  // 只为 size_t
```

### 预编译头文件

```c
// 对于大型项目，使用预编译头文件加速编译

// stdafx.h（MSVC 风格）
#ifndef STDAFX_H
#define STDAFX_H

// 包含不常改变的系统头文件
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

// 项目公共头文件
#include "config.h"
#include "types.h"

#endif

// 编译命令（GCC）
// gcc -c stdafx.h -o stdafx.h.gch  // 生成预编译头
// gcc -include stdafx.h main.c     // 使用预编译头
```

### 条件编译优化代码路径

```c
#include <stdio.h>

// 编译时选择算法
#ifdef USE_FAST_MATH
    #define MULTIPLY(a, b) ((a) << (b))  // 快速但只适用于 2 的幂
#else
    #define MULTIPLY(a, b) ((a) * (b))   // 通用乘法
#endif

// 调试代码的开销
#ifdef DEBUG
    #define CHECK_BOUNDS(arr, idx, size) \
        do { if ((idx) >= (size)) { \
            fprintf(stderr, "Bounds error: %s[%zu] out of %zu\n", #arr, (size_t)(idx), (size_t)(size)); \
            abort(); \
        }} while(0)
#else
    #define CHECK_BOUNDS(arr, idx, size) ((void)0)  // 发布版本无开销
#endif

// 内联控制
#ifdef OPTIMIZE_SIZE
    #define INLINE_HINT
#else
    #define INLINE_HINT inline
#endif
```

### 宏 vs 内联函数性能

```c
#include <stdio.h>
#include <time.h>

// 宏版本
#define MACRO_MAX(a, b) ((a) > (b) ? (a) : (b))

// 内联函数版本
static inline int inline_max(int a, int b) {
    return a > b ? a : b;
}

// 性能测试
#define ITERATIONS 100000000

int main() {
    clock_t start, end;
    int result;

    // 测试宏
    start = clock();
    for (int i = 0; i < ITERATIONS; i++) {
        result = MACRO_MAX(i, i - 1);
    }
    end = clock();
    printf("宏版本: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // 测试内联函数
    start = clock();
    for (int i = 0; i < ITERATIONS; i++) {
        result = inline_max(i, i - 1);
    }
    end = clock();
    printf("内联函数: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // 现代编译器下，两者性能几乎相同
    // 但内联函数有类型安全、可调试等优势

    return 0;
}
```

## 实战场景

### 场景 1：跨平台兼容层

```c
// === platform.h ===
#ifndef PLATFORM_H
#define PLATFORM_H

// 平台检测
#if defined(_WIN32) || defined(_WIN64)
    #define PLATFORM_WINDOWS 1
#elif defined(__linux__)
    #define PLATFORM_LINUX 1
#elif defined(__APPLE__) && defined(__MACH__)
    #define PLATFORM_MACOS 1
#elif defined(__FreeBSD__)
    #define PLATFORM_FREEBSD 1
#else
    #error "Unsupported platform"
#endif

// 字节序检测
#if defined(__BYTE_ORDER__) && __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
    #define PLATFORM_BIG_ENDIAN 1
#else
    #define PLATFORM_LITTLE_ENDIAN 1
#endif

// 线程本地存储
#if defined(_MSC_VER)
    #define THREAD_LOCAL __declspec(thread)
#elif defined(__GNUC__)
    #define THREAD_LOCAL __thread
#elif __STDC_VERSION__ >= 201112L
    #define THREAD_LOCAL _Thread_local
#else
    #define THREAD_LOCAL  // 不支持
#endif

// 内存对齐
#if defined(_MSC_VER)
    #define ALIGNED(x) __declspec(align(x))
#elif defined(__GNUC__)
    #define ALIGNED(x) __attribute__((aligned(x)))
#else
    #define ALIGNED(x)
#endif

// 分支预测提示
#if defined(__GNUC__)
    #define LIKELY(x)   __builtin_expect(!!(x), 1)
    #define UNLIKELY(x) __builtin_expect(!!(x), 0)
#else
    #define LIKELY(x)   (x)
    #define UNLIKELY(x) (x)
#endif

// 函数属性
#if defined(__GNUC__) || defined(__clang__)
    #define NORETURN     __attribute__((noreturn))
    #define DEPRECATED   __attribute__((deprecated))
    #define UNUSED       __attribute__((unused))
    #define PURE         __attribute__((pure))
    #define CONST_FUNC   __attribute__((const))
    #define PRINTF_FMT(fmt, args) __attribute__((format(printf, fmt, args)))
#elif defined(_MSC_VER)
    #define NORETURN     __declspec(noreturn)
    #define DEPRECATED   __declspec(deprecated)
    #define UNUSED
    #define PURE
    #define CONST_FUNC
    #define PRINTF_FMT(fmt, args)
#else
    #define NORETURN
    #define DEPRECATED
    #define UNUSED
    #define PURE
    #define CONST_FUNC
    #define PRINTF_FMT(fmt, args)
#endif

// 平台相关头文件
#ifdef PLATFORM_WINDOWS
    #ifndef WIN32_LEAN_AND_MEAN
        #define WIN32_LEAN_AND_MEAN
    #endif
    #include <windows.h>
    typedef HANDLE ThreadHandle;
    typedef CRITICAL_SECTION Mutex;
#else
    #include <pthread.h>
    typedef pthread_t ThreadHandle;
    typedef pthread_mutex_t Mutex;
#endif

// 平台相关函数
#ifdef PLATFORM_WINDOWS
    #define SLEEP_MS(ms) Sleep(ms)
#else
    #include <unistd.h>
    #define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

#endif // PLATFORM_H
```

### 场景 2：调试和日志系统

```c
// === debug.h ===
#ifndef DEBUG_H
#define DEBUG_H

#include <stdio.h>
#include <stdlib.h>

// 日志级别
#define LOG_LEVEL_TRACE 0
#define LOG_LEVEL_DEBUG 1
#define LOG_LEVEL_INFO  2
#define LOG_LEVEL_WARN  3
#define LOG_LEVEL_ERROR 4
#define LOG_LEVEL_FATAL 5
#define LOG_LEVEL_OFF   6

// 默认日志级别
#ifndef LOG_LEVEL
    #ifdef NDEBUG
        #define LOG_LEVEL LOG_LEVEL_INFO
    #else
        #define LOG_LEVEL LOG_LEVEL_DEBUG
    #endif
#endif

// 颜色支持
#ifndef LOG_USE_COLOR
    #define LOG_USE_COLOR 1
#endif

#if LOG_USE_COLOR && !defined(_WIN32)
    #define LOG_COLOR_RESET   "\x1b[0m"
    #define LOG_COLOR_RED     "\x1b[31m"
    #define LOG_COLOR_GREEN   "\x1b[32m"
    #define LOG_COLOR_YELLOW  "\x1b[33m"
    #define LOG_COLOR_BLUE    "\x1b[34m"
    #define LOG_COLOR_MAGENTA "\x1b[35m"
    #define LOG_COLOR_CYAN    "\x1b[36m"
#else
    #define LOG_COLOR_RESET   ""
    #define LOG_COLOR_RED     ""
    #define LOG_COLOR_GREEN   ""
    #define LOG_COLOR_YELLOW  ""
    #define LOG_COLOR_BLUE    ""
    #define LOG_COLOR_MAGENTA ""
    #define LOG_COLOR_CYAN    ""
#endif

// 日志输出宏
#define LOG_IMPL(level, color, level_str, fmt, ...) \
    do { \
        fprintf(stderr, color "[%s] %s:%d (%s): " fmt LOG_COLOR_RESET "\n", \
                level_str, __FILE__, __LINE__, __func__, ##__VA_ARGS__); \
    } while(0)

#if LOG_LEVEL <= LOG_LEVEL_TRACE
    #define LOG_TRACE(fmt, ...) LOG_IMPL(LOG_LEVEL_TRACE, LOG_COLOR_CYAN, "TRACE", fmt, ##__VA_ARGS__)
#else
    #define LOG_TRACE(fmt, ...) ((void)0)
#endif

#if LOG_LEVEL <= LOG_LEVEL_DEBUG
    #define LOG_DEBUG(fmt, ...) LOG_IMPL(LOG_LEVEL_DEBUG, LOG_COLOR_BLUE, "DEBUG", fmt, ##__VA_ARGS__)
#else
    #define LOG_DEBUG(fmt, ...) ((void)0)
#endif

#if LOG_LEVEL <= LOG_LEVEL_INFO
    #define LOG_INFO(fmt, ...) LOG_IMPL(LOG_LEVEL_INFO, LOG_COLOR_GREEN, "INFO", fmt, ##__VA_ARGS__)
#else
    #define LOG_INFO(fmt, ...) ((void)0)
#endif

#if LOG_LEVEL <= LOG_LEVEL_WARN
    #define LOG_WARN(fmt, ...) LOG_IMPL(LOG_LEVEL_WARN, LOG_COLOR_YELLOW, "WARN", fmt, ##__VA_ARGS__)
#else
    #define LOG_WARN(fmt, ...) ((void)0)
#endif

#if LOG_LEVEL <= LOG_LEVEL_ERROR
    #define LOG_ERROR(fmt, ...) LOG_IMPL(LOG_LEVEL_ERROR, LOG_COLOR_RED, "ERROR", fmt, ##__VA_ARGS__)
#else
    #define LOG_ERROR(fmt, ...) ((void)0)
#endif

#if LOG_LEVEL <= LOG_LEVEL_FATAL
    #define LOG_FATAL(fmt, ...) \
        do { \
            LOG_IMPL(LOG_LEVEL_FATAL, LOG_COLOR_MAGENTA, "FATAL", fmt, ##__VA_ARGS__); \
            abort(); \
        } while(0)
#else
    #define LOG_FATAL(fmt, ...) abort()
#endif

// 断言宏
#ifdef NDEBUG
    #define ASSERT(cond) ((void)0)
    #define ASSERT_MSG(cond, msg) ((void)0)
#else
    #define ASSERT(cond) \
        do { if (!(cond)) { \
            LOG_FATAL("Assertion failed: %s", #cond); \
        }} while(0)

    #define ASSERT_MSG(cond, fmt, ...) \
        do { if (!(cond)) { \
            LOG_FATAL("Assertion failed: %s - " fmt, #cond, ##__VA_ARGS__); \
        }} while(0)
#endif

// 调试断点
#if defined(_MSC_VER)
    #define DEBUG_BREAK() __debugbreak()
#elif defined(__GNUC__) && (defined(__i386__) || defined(__x86_64__))
    #define DEBUG_BREAK() __asm__ volatile("int $3")
#elif defined(__GNUC__) && defined(__arm__)
    #define DEBUG_BREAK() __asm__ volatile("bkpt #0")
#else
    #define DEBUG_BREAK() abort()
#endif

// 变量打印
#define PRINT_INT(var)    LOG_DEBUG(#var " = %d", (var))
#define PRINT_UINT(var)   LOG_DEBUG(#var " = %u", (var))
#define PRINT_LONG(var)   LOG_DEBUG(#var " = %ld", (var))
#define PRINT_FLOAT(var)  LOG_DEBUG(#var " = %f", (var))
#define PRINT_PTR(var)    LOG_DEBUG(#var " = %p", (void*)(var))
#define PRINT_STR(var)    LOG_DEBUG(#var " = \"%s\"", (var) ? (var) : "(null)")
#define PRINT_BOOL(var)   LOG_DEBUG(#var " = %s", (var) ? "true" : "false")

// 函数进入/退出追踪
#if LOG_LEVEL <= LOG_LEVEL_TRACE
    #define TRACE_ENTER() LOG_TRACE(">>> Entering %s", __func__)
    #define TRACE_EXIT()  LOG_TRACE("<<< Exiting %s", __func__)
#else
    #define TRACE_ENTER() ((void)0)
    #define TRACE_EXIT()  ((void)0)
#endif

#endif // DEBUG_H
```

### 场景 3：简单的单元测试框架

```c
// === test.h ===
#ifndef TEST_H
#define TEST_H

#include <stdio.h>
#include <string.h>
#include <math.h>

// 测试统计
static int _test_total = 0;
static int _test_passed = 0;
static int _test_failed = 0;

// 颜色
#define TEST_RED    "\x1b[31m"
#define TEST_GREEN  "\x1b[32m"
#define TEST_YELLOW "\x1b[33m"
#define TEST_RESET  "\x1b[0m"

// 测试用例定义
#define TEST(name) void test_##name(void)

// 运行测试
#define RUN_TEST(name) \
    do { \
        _test_total++; \
        printf("Running " #name "... "); \
        fflush(stdout); \
        test_##name(); \
    } while(0)

// 断言宏
#define ASSERT_TRUE(cond) \
    do { if (!(cond)) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Expected true, got false\n", __FILE__, __LINE__); \
        printf("  Condition: %s\n", #cond); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_FALSE(cond) \
    do { if (cond) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Expected false, got true\n", __FILE__, __LINE__); \
        printf("  Condition: %s\n", #cond); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_EQ(expected, actual) \
    do { if ((expected) != (actual)) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Values not equal\n", __FILE__, __LINE__); \
        printf("  Expected: %s = %lld\n", #expected, (long long)(expected)); \
        printf("  Actual:   %s = %lld\n", #actual, (long long)(actual)); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_NEQ(expected, actual) \
    do { if ((expected) == (actual)) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Values should not be equal\n", __FILE__, __LINE__); \
        printf("  Both: %lld\n", (long long)(expected)); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_FLOAT_EQ(expected, actual, epsilon) \
    do { if (fabs((expected) - (actual)) > (epsilon)) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Float values not equal (epsilon: %g)\n", __FILE__, __LINE__, (epsilon)); \
        printf("  Expected: %g\n", (double)(expected)); \
        printf("  Actual:   %g\n", (double)(actual)); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_STR_EQ(expected, actual) \
    do { if (strcmp((expected), (actual)) != 0) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Strings not equal\n", __FILE__, __LINE__); \
        printf("  Expected: \"%s\"\n", (expected)); \
        printf("  Actual:   \"%s\"\n", (actual)); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_NULL(ptr) \
    do { if ((ptr) != NULL) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Expected NULL, got %p\n", __FILE__, __LINE__, (void*)(ptr)); \
        _test_failed++; \
        return; \
    }} while(0)

#define ASSERT_NOT_NULL(ptr) \
    do { if ((ptr) == NULL) { \
        printf(TEST_RED "FAILED" TEST_RESET "\n"); \
        printf("  %s:%d: Expected non-NULL\n", __FILE__, __LINE__); \
        _test_failed++; \
        return; \
    }} while(0)

// 测试通过
#define PASS() \
    do { \
        printf(TEST_GREEN "PASSED" TEST_RESET "\n"); \
        _test_passed++; \
    } while(0)

// 打印测试结果
#define PRINT_TEST_RESULTS() \
    do { \
        printf("\n========================================\n"); \
        printf("Test Results: %d total, ", _test_total); \
        printf(TEST_GREEN "%d passed" TEST_RESET ", ", _test_passed); \
        if (_test_failed > 0) \
            printf(TEST_RED "%d failed" TEST_RESET "\n", _test_failed); \
        else \
            printf("0 failed\n"); \
        printf("========================================\n"); \
    } while(0)

// 返回测试结果（用于 main 返回值）
#define TEST_RESULT() (_test_failed > 0 ? 1 : 0)

#endif // TEST_H

// === 使用示例 ===
// test_example.c

#include "test.h"

// 被测试的函数
int add(int a, int b) { return a + b; }
int multiply(int a, int b) { return a * b; }

// 测试用例
TEST(add_positive) {
    ASSERT_EQ(5, add(2, 3));
    ASSERT_EQ(10, add(7, 3));
    PASS();
}

TEST(add_negative) {
    ASSERT_EQ(-5, add(-2, -3));
    ASSERT_EQ(0, add(-5, 5));
    PASS();
}

TEST(multiply) {
    ASSERT_EQ(6, multiply(2, 3));
    ASSERT_EQ(0, multiply(0, 100));
    ASSERT_EQ(-6, multiply(-2, 3));
    PASS();
}

int main() {
    RUN_TEST(add_positive);
    RUN_TEST(add_negative);
    RUN_TEST(multiply);

    PRINT_TEST_RESULTS();
    return TEST_RESULT();
}
```

### 场景 4：配置驱动的代码生成

```c
// === config.def ===
// 使用 X-Macro 技术定义配置项

// CONFIG(name, type, default_value, description)
CONFIG(debug_mode, bool, false, "Enable debug mode")
CONFIG(log_level, int, 2, "Log level (0-5)")
CONFIG(max_connections, int, 100, "Maximum connections")
CONFIG(server_port, int, 8080, "Server port")
CONFIG(buffer_size, size_t, 4096, "Buffer size")
CONFIG(timeout_ms, int, 30000, "Timeout in milliseconds")

// === config.h ===
#ifndef CONFIG_H
#define CONFIG_H

#include <stdbool.h>
#include <stddef.h>

// 配置结构体
typedef struct {
    #define CONFIG(name, type, default_val, desc) type name;
    #include "config.def"
    #undef CONFIG
} Config;

// 默认配置
static inline Config config_default(void) {
    Config cfg = {
        #define CONFIG(name, type, default_val, desc) .name = default_val,
        #include "config.def"
        #undef CONFIG
    };
    return cfg;
}

// 打印配置
static inline void config_print(const Config* cfg) {
    printf("Configuration:\n");
    #define CONFIG(name, type, default_val, desc) \
        printf("  " #name " (" desc "): "); \
        _Generic((cfg->name), \
            bool: printf("%s", cfg->name ? "true" : "false"), \
            int: printf("%d", cfg->name), \
            size_t: printf("%zu", cfg->name) \
        ); \
        printf("\n");
    #include "config.def"
    #undef CONFIG
}

// 配置项名称数组
static const char* config_names[] = {
    #define CONFIG(name, type, default_val, desc) #name,
    #include "config.def"
    #undef CONFIG
    NULL
};

// 配置项数量
#define CONFIG_COUNT (sizeof(config_names) / sizeof(config_names[0]) - 1)

#endif // CONFIG_H
```

## 面试要点

### 常见面试题

**Q1: #define 和 const 的区别是什么？**

```c
// #define：预处理阶段的文本替换
#define PI 3.14159
// - 没有类型检查
// - 不占用内存（每次使用都是字面量）
// - 可以定义任意文本，包括代码片段
// - 不能被调试器看到

// const：编译器处理的常量
const double PI = 3.14159;
// - 有类型检查
// - 占用内存（但编译器可能优化）
// - 只能定义值
// - 可以被调试器看到
// - 有作用域

// 推荐：在 C++ 中优先使用 const
// 在 C 中，对于整数常量可以使用 enum
```

**Q2: 宏和内联函数的区别？**

```c
// 宏：预处理阶段的文本替换
#define SQUARE(x) ((x) * (x))
// - 没有类型检查
// - 参数可能被多次求值
// - 可以生成任意代码
// - 不能递归
// - 编译错误难以理解

// 内联函数：编译器处理
static inline int square(int x) {
    return x * x;
}
// - 有类型检查
// - 参数只求值一次
// - 可以递归（但会导致不内联）
// - 可以调试
// - 编译器可能不内联
```

**Q3: #include <> 和 #include "" 的区别？**

```c
// <> 尖括号：只在系统目录中搜索
#include <stdio.h>
// 搜索路径：编译器预定义的系统目录

// "" 双引号：先在当前目录搜索，然后搜索系统目录
#include "myheader.h"
// 搜索顺序：
// 1. 包含此文件的源文件所在目录
// 2. -I 指定的目录
// 3. 系统目录
```

**Q4: 如何避免头文件重复包含？**

```c
// 方法 1：Include Guards（标准方法）
#ifndef MYHEADER_H
#define MYHEADER_H
// 内容
#endif

// 方法 2：#pragma once（非标准但广泛支持）
#pragma once
// 内容

// Include Guards 的命名约定：
// - 使用全大写
// - 使用文件名
// - 添加项目前缀避免冲突
// 例如：PROJECT_MODULE_FILENAME_H
```

**Q5: 解释 ## 和 # 运算符**

```c
// # 字符串化运算符
#define STRINGIFY(x) #x
STRINGIFY(hello)  // "hello"

// ## 词法单元粘贴运算符
#define CONCAT(a, b) a ## b
CONCAT(var, 1)  // var1

// 常见用途
#define MAKE_PAIR(prefix) { prefix ## _KEY, prefix ## _VALUE }
#define PRINT_VAR(var) printf(#var " = %d\n", var)
```

**Q6: #ifdef 和 #if defined() 的区别？**

```c
// 功能相同，但 #if defined() 更灵活

// #ifdef：只能检查单个宏
#ifdef DEBUG
    // code
#endif

// #if defined()：可以组合条件
#if defined(DEBUG) && defined(VERBOSE)
    // code
#endif

#if defined(A) || defined(B)
    // code
#endif

#if !defined(NDEBUG)
    // code
#endif
```

**Q7: 什么是条件编译的典型用途？**

```c
// 1. 调试代码
#ifdef DEBUG
    printf("Debug: x = %d\n", x);
#endif

// 2. 平台兼容
#ifdef _WIN32
    // Windows 代码
#else
    // Unix 代码
#endif

// 3. 功能开关
#if FEATURE_X_ENABLED
    // Feature X 代码
#endif

// 4. 版本兼容
#if __STDC_VERSION__ >= 201112L
    // C11 特性
#endif
```

**Q8: 写一个安全的 MAX 宏**

```c
// 基本版本（有副作用问题）
#define MAX(a, b) ((a) > (b) ? (a) : (b))

// GCC 安全版本（避免多次求值）
#define MAX_SAFE(a, b) \
    ({ \
        typeof(a) _a = (a); \
        typeof(b) _b = (b); \
        _a > _b ? _a : _b; \
    })

// C11 _Generic 类型安全版本
#define MAX_GENERIC(a, b) _Generic((a) + (b), \
    int: max_int, \
    long: max_long, \
    double: max_double \
)((a), (b))

static inline int max_int(int a, int b) { return a > b ? a : b; }
static inline long max_long(long a, long b) { return a > b ? a : b; }
static inline double max_double(double a, double b) { return a > b ? a : b; }
```

## 延伸阅读

### 官方文档和标准

- [C11 Standard (N1570)](http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) - C 语言标准文档
- [GCC Preprocessor Manual](https://gcc.gnu.org/onlinedocs/cpp/) - GCC 预处理器文档
- [MSVC Preprocessor Reference](https://docs.microsoft.com/en-us/cpp/preprocessor/c-cpp-preprocessor-reference) - MSVC 预处理器文档

### 经典书籍

- 《C 程序设计语言》（K&R） - Brian Kernighan, Dennis Ritchie
- 《C 专家编程》- Peter van der Linden
- 《C 陷阱与缺陷》- Andrew Koenig
- 《深入理解计算机系统》- Randal Bryant

### 优质文章

- [The C Preprocessor](https://gcc.gnu.org/onlinedocs/cpp/) - GCC 官方教程
- [Understanding C/C++ Macros](https://blog.regehr.org/archives/1656) - 深入理解宏
- [X-Macros](https://en.wikipedia.org/wiki/X_Macro) - X-Macro 技术详解
- [Preprocessor Abuse](https://github.com/pfultz2/Cloak/wiki/C-Preprocessor-tricks,-tips,-and-idioms) - 预处理器高级技巧

### 工具

- [cpp](https://en.wikipedia.org/wiki/C_preprocessor) - 独立的 C 预处理器
- [clang-format](https://clang.llvm.org/docs/ClangFormat.html) - 代码格式化工具
- [Include What You Use](https://include-what-you-use.org/) - 头文件依赖分析工具
