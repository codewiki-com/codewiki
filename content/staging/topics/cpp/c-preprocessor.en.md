---
title: C Preprocessor
description: "In-depth Understanding of the C Preprocessor: Macro Definitions, File Inclusion, Conditional Compilation, #pragma Directives, and Common Pitfalls"
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C
  - Preprocessor
  - Macros
  - Conditional Compilation
  - Header Files
status: imported
origin: old/src/content/docs/cpp/c-preprocessor.en.md
divergence: 0.206
issues: []
legacy:
  category: Cpp
  subcategory: C Language
  order: 3
  lastUpdated: 2026-01-07
---

The C Preprocessor (CPP) is the first stage in the C language compilation process. It performs text-level processing on source code before actual compilation, including macro expansion, file inclusion, conditional compilation, and other operations. Understanding the preprocessor is one of the key skills for mastering the C language.

## Concept Explanation

### What is the Preprocessor

The preprocessor is a program independent of the compiler that processes directives beginning with `#` (called preprocessor directives). The preprocessor performs text substitution and processing on source code before the compiler sees the code.

**History of the Preprocessor:**
- 1972: Born with the C language at Bell Labs
- 1978: K&R C standardized basic preprocessor directives
- 1989: ANSI C (C89) added `#pragma`, `#error`, and other directives
- 1999: C99 introduced the `_Pragma` operator and variadic macros
- 2011: C11 further improved preprocessor functionality

**Problems the Preprocessor Solves:**
1. **Code Reuse**: Sharing header files through `#include`
2. **Constant Definitions**: Using macro definitions to avoid magic numbers
3. **Conditional Compilation**: Compiling different code based on platform or configuration
4. **Code Generation**: Reducing repetitive code through macros
5. **Debug Support**: Conditionally including debug code

### Compilation Stages

The C program compilation process:

```
Source Code (.c) → Preprocessing → Compilation → Assembly → Linking → Executable

Detailed Process:
1. Preprocessing Stage: Process #include, #define, #if, and other directives
2. Compilation Stage: Convert preprocessed code to assembly code
3. Assembly Stage: Convert assembly code to object files (.o)
4. Linking Stage: Link multiple object files into an executable
```

View preprocessing results:

```bash
# GCC view preprocessed output
gcc -E source.c -o source.i

# Or output directly to standard output
gcc -E source.c

# Clang
clang -E source.c

# Preserve comments
gcc -E -C source.c
```

## Core Principles

### Preprocessor Workflow

The preprocessor processes source files in the following order:

1. **Physical Line Merging**: Merge lines ending with `\` with the next line
2. **Trigraph Replacement**: Replace trigraphs (usually disabled in modern compilers)
3. **Comment Removal**: Replace comments with a single space
4. **Preprocessor Directive Processing**: Execute `#include`, `#define`, and other directives
5. **Macro Expansion**: Replace all macro invocations
6. **Generate Preprocessed Code**: Output to the compiler

```c
// Example: Before preprocessing
#define MAX 100
#define SQUARE(x) ((x) * (x))

int arr[MAX];
int result = SQUARE(5 + 3);

// Example: After preprocessing
int arr[100];
int result = ((5 + 3) * (5 + 3));
```

### Tokens

The preprocessor breaks source code into tokens:

```c
// Token types
// 1. Identifiers: variable names, function names, macro names
// 2. Keywords: int, if, while, return, etc.
// 3. Constants: 100, 3.14, 'a', "hello"
// 4. Operators: +, -, *, /, =, ==, ++, etc.
// 5. Punctuation: {, }, (, ), ;, , etc.

// The preprocessor operates on tokens, not simple text
#define PASTE(a, b) a ## b  // ## is the token pasting operator
int PASTE(var, 1) = 10;     // Expands to: int var1 = 10;
```

## Key Points

### Classification of Preprocessor Directives

| Category | Directive | Description |
|----------|-----------|-------------|
| File Inclusion | `#include` | Include header files |
| Macro Definition | `#define`, `#undef` | Define and undefine macros |
| Conditional Compilation | `#if`, `#ifdef`, `#ifndef`, `#elif`, `#else`, `#endif` | Conditionally compile code |
| Compiler Control | `#pragma` | Compiler-specific directives |
| Error Handling | `#error`, `#warning` | Generate compilation errors or warnings |
| Line Control | `#line` | Modify line number and filename |
| Null Directive | `#` | No operation |

### Predefined Macros

```c
#include <stdio.h>

int main() {
    // Standard predefined macros
    printf("Filename: %s\n", __FILE__);
    printf("Line number: %d\n", __LINE__);
    printf("Function name: %s\n", __func__);  // C99
    printf("Compilation date: %s\n", __DATE__);
    printf("Compilation time: %s\n", __TIME__);

    // Standard version macros
    #ifdef __STDC__
    printf("Conforms to ANSI C standard\n");
    #endif

    #ifdef __STDC_VERSION__
    printf("C standard version: %ld\n", __STDC_VERSION__);
    // 199901L = C99, 201112L = C11, 201710L = C17
    #endif

    // Compiler-specific macros
    #ifdef __GNUC__
    printf("GCC version: %d.%d.%d\n", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
    #endif

    #ifdef _MSC_VER
    printf("MSVC version: %d\n", _MSC_VER);
    #endif

    #ifdef __clang__
    printf("Clang version: %d.%d.%d\n", __clang_major__, __clang_minor__, __clang_patchlevel__);
    #endif

    return 0;
}
```

## Code Examples

### #define Macro Definitions

#### Object-like Macros

```c
#include <stdio.h>

// Simple constant definitions
#define PI 3.14159265358979
#define MAX_SIZE 100
#define GREETING "Hello, World!"
#define NEWLINE '\n'

// Multi-line macros (using backslash for line continuation)
#define LONG_STRING "This is a very long string, " \
                    "it spans multiple lines, " \
                    "but is actually one line."

// Empty macro
#define DEBUG  // Only used for conditional compilation detection

// Undefine a macro
#undef PI
#define PI 3.14  // Redefine

int main() {
    double radius = 5.0;
    double area = PI * radius * radius;

    printf("Area of circle: %.2f%c", area, NEWLINE);
    printf("%s\n", GREETING);
    printf("Maximum size: %d\n", MAX_SIZE);

    return 0;
}
```

#### Function-like Macros

```c
#include <stdio.h>

// Basic function-like macros
#define SQUARE(x) ((x) * (x))
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define ABS(x) ((x) < 0 ? -(x) : (x))

// Multi-statement macros (using do-while(0))
#define SWAP(a, b) do { \
    typeof(a) temp = a; \
    a = b; \
    b = temp; \
} while(0)

// Macros with types
#define MALLOC_ARRAY(type, n) ((type*)malloc((n) * sizeof(type)))
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// Debug macro
#define DEBUG_PRINT(fmt, ...) \
    fprintf(stderr, "[DEBUG] %s:%d: " fmt "\n", __FILE__, __LINE__, ##__VA_ARGS__)

int main() {
    int a = 5, b = 3;

    printf("SQUARE(4) = %d\n", SQUARE(4));
    printf("MAX(%d, %d) = %d\n", a, b, MAX(a, b));
    printf("ABS(-10) = %d\n", ABS(-10));

    SWAP(a, b);
    printf("After swap: a = %d, b = %d\n", a, b);

    int arr[] = {1, 2, 3, 4, 5};
    printf("Array size: %zu\n", ARRAY_SIZE(arr));

    DEBUG_PRINT("Variable a = %d", a);

    return 0;
}
```

#### Stringification and Token Pasting

```c
#include <stdio.h>

// # stringification operator
#define STRINGIFY(x) #x
#define TOSTRING(x) STRINGIFY(x)

// ## token pasting operator
#define CONCAT(a, b) a ## b
#define MAKE_VAR(n) var_ ## n
#define MAKE_FUNC(name) void func_ ## name(void)

// Practical examples
#define PRINT_VAR(var) printf(#var " = %d\n", var)
#define PRINT_EXPR(expr) printf(#expr " = %d\n", (expr))

// Generate enums and string arrays
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
    // Stringification
    printf("%s\n", STRINGIFY(Hello World));  // Output: Hello World
    printf("%s\n", TOSTRING(MAX_SIZE));      // Output: MAX_SIZE (or its expanded value)

    // Token pasting
    int MAKE_VAR(1) = 10;  // int var_1 = 10;
    int MAKE_VAR(2) = 20;  // int var_2 = 20;
    int CONCAT(var, 3) = 30;  // int var3 = 30;

    printf("var_1 = %d, var_2 = %d, var3 = %d\n", var_1, var_2, var3);

    // Print variables
    int x = 42;
    PRINT_VAR(x);           // Output: x = 42
    PRINT_EXPR(x * 2 + 1);  // Output: x * 2 + 1 = 85

    // Enums and strings
    for (int i = 0; i < COLOR_COUNT; i++) {
        printf("Color %d: %s\n", i, color_names[i]);
    }

    return 0;
}
```

#### Variadic Macros (C99)

```c
#include <stdio.h>
#include <stdarg.h>

// Basic variadic macro
#define PRINTF(fmt, ...) printf(fmt, __VA_ARGS__)

// Handle empty arguments (GCC extension)
#define LOG(fmt, ...) printf("[LOG] " fmt "\n", ##__VA_ARGS__)

// Logging macros with levels
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

// Assertion macro
#define ASSERT(cond, fmt, ...) \
    do { if (!(cond)) { \
        fprintf(stderr, "Assertion failed: %s\n", #cond); \
        fprintf(stderr, "  File: %s, Line: %d\n", __FILE__, __LINE__); \
        fprintf(stderr, "  Message: " fmt "\n", ##__VA_ARGS__); \
        abort(); \
    }} while(0)

int main() {
    int x = 10;
    LOG("Program started");
    LOG("x = %d", x);

    LOG_DEBUG("Debug info: x = %d", x);
    LOG_INFO("Program is running");
    LOG_ERROR("An error occurred: %s", "example error");

    ASSERT(x > 0, "x must be positive, current value: %d", x);

    return 0;
}
```

### #include File Inclusion

```c
// === System Headers vs User Headers ===

// Angle brackets: Search in system directories
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Double quotes: Search current directory first, then system directories
#include "myheader.h"
#include "utils/helper.h"
#include "../common/types.h"

// === Include Guards ===

// Method 1: Traditional #ifndef guards
// myheader.h
#ifndef MYHEADER_H
#define MYHEADER_H

// Header file contents
typedef struct {
    int x;
    int y;
} Point;

void print_point(Point p);

#endif // MYHEADER_H

// Method 2: #pragma once (non-standard but widely supported)
// myheader.h
#pragma once

typedef struct {
    int x;
    int y;
} Point;

void print_point(Point p);

// === Well-organized Header File Example ===
// config.h
#ifndef CONFIG_H
#define CONFIG_H

// Version information
#define VERSION_MAJOR 1
#define VERSION_MINOR 0
#define VERSION_PATCH 0

// Platform detection
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

// Compiler detection
#if defined(__GNUC__)
    #define COMPILER_GCC 1
#elif defined(_MSC_VER)
    #define COMPILER_MSVC 1
#elif defined(__clang__)
    #define COMPILER_CLANG 1
#endif

// Export macro
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

### Conditional Compilation

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

// === #ifdef and #ifndef ===

#define DEBUG

#ifdef DEBUG
    #define LOG(msg) printf("[DEBUG] %s\n", msg)
#else
    #define LOG(msg) // No operation
#endif

#ifndef BUFFER_SIZE
    #define BUFFER_SIZE 1024
#endif

// === defined operator ===

#if defined(DEBUG) && defined(VERBOSE)
    #define DETAILED_LOG 1
#endif

#if !defined(NDEBUG)
    #define ASSERTIONS_ENABLED 1
#endif

// Complex conditions
#if (defined(__linux__) || defined(__APPLE__)) && !defined(_WIN32)
    #define UNIX_LIKE 1
#endif

// === Compile-time Checks ===

// Static assertion (C11)
#if __STDC_VERSION__ >= 201112L
    _Static_assert(sizeof(int) >= 4, "int must be at least 4 bytes");
#endif

// Using #error for compile-time checks
#if !defined(TARGET_PLATFORM)
    #error "TARGET_PLATFORM must be defined"
#endif

#if BUFFER_SIZE < 64
    #warning "BUFFER_SIZE is very small, consider increasing it"
#endif

// === Feature Detection and Fallback ===

// Check C standard version
#if __STDC_VERSION__ >= 201112L
    // C11 features available
    #define HAS_GENERIC 1
    #define HAS_STATIC_ASSERT 1
#elif __STDC_VERSION__ >= 199901L
    // C99 features available
    #define HAS_GENERIC 0
    #define HAS_STATIC_ASSERT 0
#else
    // C89/C90
    #define HAS_GENERIC 0
    #define HAS_STATIC_ASSERT 0
#endif

// Conditionally define inline functions
#if defined(__GNUC__) || defined(__clang__)
    #define INLINE static inline __attribute__((always_inline))
#elif defined(_MSC_VER)
    #define INLINE static __forceinline
#else
    #define INLINE static inline
#endif

int main() {
    LOG("Program started");

    #if FEATURE_A
    printf("Feature A is enabled\n");
    #endif

    #if FEATURE_B
    printf("Feature B is enabled\n");
    #endif

    printf("Buffer size: %d\n", BUFFER_SIZE);

    return 0;
}
```

### #pragma Directives

```c
#include <stdio.h>

// === Common #pragma Directives ===

// Header file protection
#pragma once

// === Structure Alignment ===

// GCC/Clang style
#pragma pack(push, 1)  // Save current alignment and set to 1-byte alignment
struct PackedStruct {
    char a;    // 1 byte
    int b;     // 4 bytes (typically)
    short c;   // 2 bytes
};  // No padding, total 7 bytes
#pragma pack(pop)  // Restore previous alignment

struct NormalStruct {
    char a;    // 1 byte + 3 bytes padding
    int b;     // 4 bytes
    short c;   // 2 bytes + 2 bytes padding
};  // Total 12 bytes (on typical 32/64-bit systems)

// === Warning Control ===

// GCC/Clang
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"
void function_with_warnings() {
    int unused_var = 42;  // No warning generated
}
#pragma GCC diagnostic pop

// MSVC
#pragma warning(push)
#pragma warning(disable: 4996)  // Disable specific warning
// Use functions considered unsafe...
#pragma warning(pop)

// === Link Libraries (MSVC) ===
#ifdef _MSC_VER
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "kernel32.lib")
#pragma comment(linker, "/subsystem:console")
#endif

// === Region Markers (IDE Support) ===
#pragma region Helper Functions
void helper1() { }
void helper2() { }
#pragma endregion

// === Messages ===
#pragma message("Compiling " __FILE__ " with DEBUG enabled")

// === Optimization Control ===

// GCC
#pragma GCC optimize("O3")
void highly_optimized_function() {
    // This function uses O3 optimization
}

#pragma GCC optimize("O0")
void debug_friendly_function() {
    // This function is not optimized, easier to debug
}

// === Loop Optimization Hints ===
void loop_example(int* arr, int n) {
    // GCC loop unrolling hint
    #pragma GCC unroll 4
    for (int i = 0; i < n; i++) {
        arr[i] *= 2;
    }
}

// === _Pragma Operator (C99) ===
#define DO_PRAGMA(x) _Pragma(#x)
#define DISABLE_WARNING(warning) \
    DO_PRAGMA(GCC diagnostic push) \
    DO_PRAGMA(GCC diagnostic ignored warning)
#define ENABLE_WARNING \
    DO_PRAGMA(GCC diagnostic pop)

int main() {
    printf("PackedStruct size: %zu\n", sizeof(struct PackedStruct));
    printf("NormalStruct size: %zu\n", sizeof(struct NormalStruct));

    DISABLE_WARNING("-Wunused-variable")
    int unused = 100;
    ENABLE_WARNING

    return 0;
}
```

### #error and #warning

```c
// === Compile-time Errors and Warnings ===

// Require a specific macro to be defined
#ifndef CONFIG_FILE
    #error "CONFIG_FILE must be defined. Use -DCONFIG_FILE=\"config.h\""
#endif

// Check type sizes
#if INTPTR_MAX == INT64_MAX
    // 64-bit platform
#elif INTPTR_MAX == INT32_MAX
    // 32-bit platform
#else
    #error "Unsupported platform: pointer size is neither 32 nor 64 bits"
#endif

// Version check
#if defined(__GNUC__) && __GNUC__ < 7
    #error "GCC 7 or later is required"
#endif

// Feature deprecation notice
#ifdef USE_DEPRECATED_API
    #warning "USE_DEPRECATED_API is deprecated. Please migrate to the new API."
#endif

// Development stage reminder
#warning "TODO: Implement error handling before release"

// Conditional warning
#if BUFFER_SIZE > 1048576
    #warning "Large buffer size may cause performance issues"
#endif
```

### #line Directive

```c
#include <stdio.h>

// #line can modify the values of __LINE__ and __FILE__
// Typically used by code generators

int main() {
    printf("Current location: %s, line %d\n", __FILE__, __LINE__);

    #line 100 "virtual_file.c"
    printf("Modified location: %s, line %d\n", __FILE__, __LINE__);

    // __LINE__ continues to increment
    printf("Next line: %s, line %d\n", __FILE__, __LINE__);

    #line 1  // Reset line number, keep current filename
    printf("After reset: %s, line %d\n", __FILE__, __LINE__);

    return 0;
}
```

## Best Practices

### Macro Naming Conventions

```c
// Good naming
#define MAX_BUFFER_SIZE 1024        // Constants in all caps
#define MIN(a, b) ((a) < (b) ? (a) : (b))  // Function-like macros in all caps
#define PROJECT_VERSION "1.0.0"     // Project prefix

// Naming to avoid
#define max(a, b) ((a) < (b) ? (a) : (b))  // Easy to conflict with standard library
#define size 100  // Too generic, easy to conflict
```

### Macro Parameter Protection

```c
// Wrong: Missing parentheses
#define SQUARE_BAD(x) x * x
int result1 = SQUARE_BAD(5 + 3);  // Expands to: 5 + 3 * 5 + 3 = 23, expected 64

// Correct: Full parentheses protection
#define SQUARE_GOOD(x) ((x) * (x))
int result2 = SQUARE_GOOD(5 + 3);  // Expands to: ((5 + 3) * (5 + 3)) = 64

// Parameter protection rules:
// 1. Wrap each parameter in parentheses
// 2. Wrap the entire expression in parentheses
// 3. Avoid side effects from parameters being expanded multiple times

#define DOUBLE_BAD(x) ((x) + (x))
int i = 5;
int result3 = DOUBLE_BAD(i++);  // Undefined behavior! i is incremented twice

// To avoid multiple evaluation, use inline functions or GCC extensions
#define DOUBLE_SAFE(x) ({ typeof(x) _x = (x); _x + _x; })  // GCC extension
```

### Use do-while(0) for Multi-statement Macros

```c
// Wrong: Simple expansion
#define LOG_ERROR_BAD(msg) \
    fprintf(stderr, "Error: %s\n", msg); \
    exit(1)

// Problem demonstration
if (error)
    LOG_ERROR_BAD("Something went wrong");
// Expands to:
// if (error)
//     fprintf(stderr, "Error: %s\n", msg);
// exit(1);  // Always executed!

// Correct: Use do-while(0)
#define LOG_ERROR_GOOD(msg) \
    do { \
        fprintf(stderr, "Error: %s\n", msg); \
        exit(1); \
    } while(0)

// Now expands correctly
if (error)
    LOG_ERROR_GOOD("Something went wrong");
// Expands to:
// if (error)
//     do { fprintf(stderr, "Error: %s\n", msg); exit(1); } while(0);
```

### Conditional Compilation Organization

```c
// === Clear Conditional Compilation Structure ===

// Platform-specific code
#if defined(_WIN32)
    // Windows implementation
    #include <windows.h>
    #define SLEEP(ms) Sleep(ms)
#elif defined(__linux__)
    // Linux implementation
    #include <unistd.h>
    #define SLEEP(ms) usleep((ms) * 1000)
#elif defined(__APPLE__)
    // macOS implementation
    #include <unistd.h>
    #define SLEEP(ms) usleep((ms) * 1000)
#else
    #error "Unsupported platform"
#endif

// Feature switches
#ifndef ENABLE_LOGGING
    #define ENABLE_LOGGING 1  // Enabled by default
#endif

#if ENABLE_LOGGING
    #define LOG(fmt, ...) printf("[LOG] " fmt "\n", ##__VA_ARGS__)
#else
    #define LOG(fmt, ...) ((void)0)
#endif

// Debug and release configuration
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

### Header File Best Practices

```c
// === mylib.h ===
#ifndef MYLIB_H
#define MYLIB_H

// 1. First include necessary headers
#include <stddef.h>
#include <stdbool.h>

// 2. C++ compatibility
#ifdef __cplusplus
extern "C" {
#endif

// 3. Version and configuration
#define MYLIB_VERSION_MAJOR 1
#define MYLIB_VERSION_MINOR 0
#define MYLIB_VERSION_PATCH 0

// 4. Platform detection and export macros
#if defined(_WIN32) && defined(MYLIB_BUILD_DLL)
    #define MYLIB_API __declspec(dllexport)
#elif defined(_WIN32) && defined(MYLIB_USE_DLL)
    #define MYLIB_API __declspec(dllimport)
#elif defined(__GNUC__) && __GNUC__ >= 4
    #define MYLIB_API __attribute__((visibility("default")))
#else
    #define MYLIB_API
#endif

// 5. Type definitions
typedef struct MyLibContext MyLibContext;

// 6. Function declarations
MYLIB_API MyLibContext* mylib_create(void);
MYLIB_API void mylib_destroy(MyLibContext* ctx);
MYLIB_API int mylib_process(MyLibContext* ctx, const void* data, size_t size);

// 7. Inline functions (if needed)
static inline int mylib_version(void) {
    return MYLIB_VERSION_MAJOR * 10000 + MYLIB_VERSION_MINOR * 100 + MYLIB_VERSION_PATCH;
}

// 8. End C++ compatibility
#ifdef __cplusplus
}
#endif

#endif // MYLIB_H
```

### Prefer Modern Alternatives

```c
// When possible, prefer these modern alternatives:

// 1. Constants: Use const or enum instead of #define
// Not recommended
#define MAX_SIZE 100

// Recommended (C99+)
enum { MAX_SIZE = 100 };
// Or
static const int MAX_SIZE = 100;

// 2. Type-safe "generics": Use _Generic (C11)
#define print_value(x) _Generic((x), \
    int: print_int, \
    double: print_double, \
    char*: print_string \
)(x)

void print_int(int x) { printf("%d\n", x); }
void print_double(double x) { printf("%f\n", x); }
void print_string(char* x) { printf("%s\n", x); }

// 3. Inline functions instead of function-like macros
// Not recommended
#define SQUARE(x) ((x) * (x))

// Recommended
static inline int square(int x) {
    return x * x;
}

// 4. Static assertions instead of #error (C11)
// Not recommended
#if sizeof(int) != 4
#error "int must be 4 bytes"
#endif

// Recommended (C11)
_Static_assert(sizeof(int) == 4, "int must be 4 bytes");
```

## Common Pitfalls

### Macro Expansion Order Issues

```c
#include <stdio.h>

#define A 1
#define B A + 1
#define C B + 1

// It looks like C should equal 3, but...
int x = C * 2;  // Expands to: 1 + 1 + 1 * 2 = 4, not 6

// Correct approach:
#define A 1
#define B (A + 1)
#define C (B + 1)

int y = C * 2;  // Expands to: ((1 + 1) + 1) * 2 = 6
```

### Multiple Evaluation Side Effects

```c
#include <stdio.h>

#define MAX(a, b) ((a) > (b) ? (a) : (b))

int main() {
    int i = 5, j = 3;

    // Dangerous! i++ may be executed multiple times
    int result = MAX(i++, j++);
    // Expands to: ((i++) > (j++) ? (i++) : (j++))
    // i++ is executed twice!

    printf("i = %d, j = %d, result = %d\n", i, j, result);
    // Output might be: i = 7, j = 4, result = 6

    // Solution 1: Use temporary variables
    i = 5; j = 3;
    int temp_i = i++;
    int temp_j = j++;
    result = MAX(temp_i, temp_j);

    // Solution 2: Use inline functions
    // static inline int max_safe(int a, int b) { return a > b ? a : b; }

    // Solution 3: GCC extension
    #define MAX_SAFE(a, b) ({ \
        typeof(a) _a = (a); \
        typeof(b) _b = (b); \
        _a > _b ? _a : _b; \
    })

    i = 5; j = 3;
    result = MAX_SAFE(i++, j++);
    printf("Safe: i = %d, j = %d, result = %d\n", i, j, result);
    // Output: i = 6, j = 4, result = 5

    return 0;
}
```

### Macros and Semicolons

```c
// Problem: Extra semicolon
#define SETUP() setup_function()

if (need_setup)
    SETUP();  // Looks normal
else
    cleanup();
// After expansion:
// if (need_setup)
//     setup_function();;  // Two semicolons!
// else  // Error: else doesn't match if
//     cleanup();

// Solution: Use do-while(0)
#define SETUP() do { setup_function(); } while(0)
```

### String Literals Cannot Be Replaced by Macros

```c
#include <stdio.h>

#define VALUE 42

int main() {
    // Macros are not replaced inside strings
    printf("VALUE = VALUE\n");  // Output: VALUE = VALUE
    printf("VALUE = %d\n", VALUE);  // Output: VALUE = 42

    // Use stringification
    #define STR(x) #x
    #define XSTR(x) STR(x)

    printf("VALUE = " XSTR(VALUE) "\n");  // Output: VALUE = 42

    return 0;
}
```

### Empty Macro Arguments

```c
#include <stdio.h>

#define CALL(func, arg) func(arg)

// Empty arguments are allowed
CALL(printf, "Hello\n");  // printf("Hello\n")
CALL(printf, );           // printf() - Compilation error!

// Solution: Check for empty arguments
#define IS_EMPTY(...) (sizeof((char[]){#__VA_ARGS__}) == 1)
```

### Recursive Macro Trap

```c
// Macros cannot recursively expand themselves
#define FOO (FOO + 1)  // FOO won't expand infinitely

int x = FOO;  // Expands to: int x = (FOO + 1);
// FOO won't expand again after initial expansion

// Indirect recursion doesn't work either
#define A B
#define B A

int y = A;  // Expands to: int y = A; (not an infinite loop)
```

### Circular Header Inclusion

```c
// === a.h ===
#ifndef A_H
#define A_H

#include "b.h"  // Include b.h

typedef struct {
    B_Type* b_ptr;  // Use B_Type
} A_Type;

#endif

// === b.h ===
#ifndef B_H
#define B_H

#include "a.h"  // Include a.h - Circular!

typedef struct {
    A_Type* a_ptr;  // Use A_Type - May not be defined yet!
} B_Type;

#endif

// Solution: Forward declarations
// === a.h ===
#ifndef A_H
#define A_H

struct B_Type;  // Forward declaration

typedef struct {
    struct B_Type* b_ptr;
} A_Type;

#endif

// === b.h ===
#ifndef B_H
#define B_H

struct A_Type;  // Forward declaration

typedef struct {
    struct A_Type* a_ptr;
} B_Type;

#endif
```

### Pitfalls in Conditional Compilation

```c
// Pitfall 1: Comparing undefined macros
#if UNDEFINED_MACRO == 1  // Undefined macros are treated as 0
    // This code won't be compiled
#endif

#if UNDEFINED_MACRO  // This is also 0 (false)
    // This code won't be compiled
#endif

// Pitfall 2: Boolean values in macro definitions
#define FEATURE_ENABLED 0  // Defined, but value is 0

#ifdef FEATURE_ENABLED  // True! Because the macro is defined
    // This code will be compiled
#endif

#if FEATURE_ENABLED  // False! Because value is 0
    // This code won't be compiled
#endif

// Best practice: Use explicit checks
#if defined(FEATURE_ENABLED) && FEATURE_ENABLED
    // Check that macro is defined AND has a true value
#endif
```

## Performance Considerations

### Impact of Preprocessing on Compile Time

```c
// Problem: Excessive header inclusions increase compile time

// Bad practice: Including unnecessary headers in header files
// myheader.h
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
// ... just to use size_t

// Good practice: Only include necessary headers
// myheader.h
#include <stddef.h>  // Only for size_t
```

### Precompiled Headers

```c
// For large projects, use precompiled headers to speed up compilation

// stdafx.h (MSVC style)
#ifndef STDAFX_H
#define STDAFX_H

// Include system headers that don't change often
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

// Project common headers
#include "config.h"
#include "types.h"

#endif

// Compile commands (GCC)
// gcc -c stdafx.h -o stdafx.h.gch  // Generate precompiled header
// gcc -include stdafx.h main.c     // Use precompiled header
```

### Conditional Compilation to Optimize Code Paths

```c
#include <stdio.h>

// Select algorithm at compile time
#ifdef USE_FAST_MATH
    #define MULTIPLY(a, b) ((a) << (b))  // Fast but only for powers of 2
#else
    #define MULTIPLY(a, b) ((a) * (b))   // General multiplication
#endif

// Overhead of debug code
#ifdef DEBUG
    #define CHECK_BOUNDS(arr, idx, size) \
        do { if ((idx) >= (size)) { \
            fprintf(stderr, "Bounds error: %s[%zu] out of %zu\n", #arr, (size_t)(idx), (size_t)(size)); \
            abort(); \
        }} while(0)
#else
    #define CHECK_BOUNDS(arr, idx, size) ((void)0)  // No overhead in release
#endif

// Inline control
#ifdef OPTIMIZE_SIZE
    #define INLINE_HINT
#else
    #define INLINE_HINT inline
#endif
```

### Macro vs Inline Function Performance

```c
#include <stdio.h>
#include <time.h>

// Macro version
#define MACRO_MAX(a, b) ((a) > (b) ? (a) : (b))

// Inline function version
static inline int inline_max(int a, int b) {
    return a > b ? a : b;
}

// Performance test
#define ITERATIONS 100000000

int main() {
    clock_t start, end;
    int result;

    // Test macro
    start = clock();
    for (int i = 0; i < ITERATIONS; i++) {
        result = MACRO_MAX(i, i - 1);
    }
    end = clock();
    printf("Macro version: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    // Test inline function
    start = clock();
    for (int i = 0; i < ITERATIONS; i++) {
        result = inline_max(i, i - 1);
    }
    end = clock();
    printf("Inline function: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    // With modern compilers, performance is nearly identical
    // But inline functions have type safety, debuggability, and other advantages

    return 0;
}
```

## Practical Scenarios

### Scenario 1: Cross-platform Compatibility Layer

```c
// === platform.h ===
#ifndef PLATFORM_H
#define PLATFORM_H

// Platform detection
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

// Byte order detection
#if defined(__BYTE_ORDER__) && __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
    #define PLATFORM_BIG_ENDIAN 1
#else
    #define PLATFORM_LITTLE_ENDIAN 1
#endif

// Thread local storage
#if defined(_MSC_VER)
    #define THREAD_LOCAL __declspec(thread)
#elif defined(__GNUC__)
    #define THREAD_LOCAL __thread
#elif __STDC_VERSION__ >= 201112L
    #define THREAD_LOCAL _Thread_local
#else
    #define THREAD_LOCAL  // Not supported
#endif

// Memory alignment
#if defined(_MSC_VER)
    #define ALIGNED(x) __declspec(align(x))
#elif defined(__GNUC__)
    #define ALIGNED(x) __attribute__((aligned(x)))
#else
    #define ALIGNED(x)
#endif

// Branch prediction hints
#if defined(__GNUC__)
    #define LIKELY(x)   __builtin_expect(!!(x), 1)
    #define UNLIKELY(x) __builtin_expect(!!(x), 0)
#else
    #define LIKELY(x)   (x)
    #define UNLIKELY(x) (x)
#endif

// Function attributes
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

// Platform-specific headers
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

// Platform-specific functions
#ifdef PLATFORM_WINDOWS
    #define SLEEP_MS(ms) Sleep(ms)
#else
    #include <unistd.h>
    #define SLEEP_MS(ms) usleep((ms) * 1000)
#endif

#endif // PLATFORM_H
```

### Scenario 2: Debug and Logging System

```c
// === debug.h ===
#ifndef DEBUG_H
#define DEBUG_H

#include <stdio.h>
#include <stdlib.h>

// Log levels
#define LOG_LEVEL_TRACE 0
#define LOG_LEVEL_DEBUG 1
#define LOG_LEVEL_INFO  2
#define LOG_LEVEL_WARN  3
#define LOG_LEVEL_ERROR 4
#define LOG_LEVEL_FATAL 5
#define LOG_LEVEL_OFF   6

// Default log level
#ifndef LOG_LEVEL
    #ifdef NDEBUG
        #define LOG_LEVEL LOG_LEVEL_INFO
    #else
        #define LOG_LEVEL LOG_LEVEL_DEBUG
    #endif
#endif

// Color support
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

// Log output macro
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

// Assertion macros
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

// Debug breakpoint
#if defined(_MSC_VER)
    #define DEBUG_BREAK() __debugbreak()
#elif defined(__GNUC__) && (defined(__i386__) || defined(__x86_64__))
    #define DEBUG_BREAK() __asm__ volatile("int $3")
#elif defined(__GNUC__) && defined(__arm__)
    #define DEBUG_BREAK() __asm__ volatile("bkpt #0")
#else
    #define DEBUG_BREAK() abort()
#endif

// Variable printing
#define PRINT_INT(var)    LOG_DEBUG(#var " = %d", (var))
#define PRINT_UINT(var)   LOG_DEBUG(#var " = %u", (var))
#define PRINT_LONG(var)   LOG_DEBUG(#var " = %ld", (var))
#define PRINT_FLOAT(var)  LOG_DEBUG(#var " = %f", (var))
#define PRINT_PTR(var)    LOG_DEBUG(#var " = %p", (void*)(var))
#define PRINT_STR(var)    LOG_DEBUG(#var " = \"%s\"", (var) ? (var) : "(null)")
#define PRINT_BOOL(var)   LOG_DEBUG(#var " = %s", (var) ? "true" : "false")

// Function enter/exit tracing
#if LOG_LEVEL <= LOG_LEVEL_TRACE
    #define TRACE_ENTER() LOG_TRACE(">>> Entering %s", __func__)
    #define TRACE_EXIT()  LOG_TRACE("<<< Exiting %s", __func__)
#else
    #define TRACE_ENTER() ((void)0)
    #define TRACE_EXIT()  ((void)0)
#endif

#endif // DEBUG_H
```

### Scenario 3: Simple Unit Testing Framework

```c
// === test.h ===
#ifndef TEST_H
#define TEST_H

#include <stdio.h>
#include <string.h>
#include <math.h>

// Test statistics
static int _test_total = 0;
static int _test_passed = 0;
static int _test_failed = 0;

// Colors
#define TEST_RED    "\x1b[31m"
#define TEST_GREEN  "\x1b[32m"
#define TEST_YELLOW "\x1b[33m"
#define TEST_RESET  "\x1b[0m"

// Test case definition
#define TEST(name) void test_##name(void)

// Run test
#define RUN_TEST(name) \
    do { \
        _test_total++; \
        printf("Running " #name "... "); \
        fflush(stdout); \
        test_##name(); \
    } while(0)

// Assertion macros
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

// Test passed
#define PASS() \
    do { \
        printf(TEST_GREEN "PASSED" TEST_RESET "\n"); \
        _test_passed++; \
    } while(0)

// Print test results
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

// Return test result (for main return value)
#define TEST_RESULT() (_test_failed > 0 ? 1 : 0)

#endif // TEST_H

// === Usage Example ===
// test_example.c

#include "test.h"

// Functions being tested
int add(int a, int b) { return a + b; }
int multiply(int a, int b) { return a * b; }

// Test cases
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

### Scenario 4: Configuration-driven Code Generation

```c
// === config.def ===
// Using X-Macro technique to define configuration items

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

// Configuration structure
typedef struct {
    #define CONFIG(name, type, default_val, desc) type name;
    #include "config.def"
    #undef CONFIG
} Config;

// Default configuration
static inline Config config_default(void) {
    Config cfg = {
        #define CONFIG(name, type, default_val, desc) .name = default_val,
        #include "config.def"
        #undef CONFIG
    };
    return cfg;
}

// Print configuration
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

// Configuration item name array
static const char* config_names[] = {
    #define CONFIG(name, type, default_val, desc) #name,
    #include "config.def"
    #undef CONFIG
    NULL
};

// Configuration item count
#define CONFIG_COUNT (sizeof(config_names) / sizeof(config_names[0]) - 1)

#endif // CONFIG_H
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between #define and const?**

```c
// #define: Text substitution during preprocessing
#define PI 3.14159
// - No type checking
// - Does not occupy memory (each use is a literal)
// - Can define any text, including code snippets
// - Cannot be seen by debugger

// const: Constant processed by compiler
const double PI = 3.14159;
// - Has type checking
// - Occupies memory (but compiler may optimize)
// - Can only define values
// - Can be seen by debugger
// - Has scope

// Recommendation: Prefer const in C++
// In C, use enum for integer constants
```

**Q2: What is the difference between macros and inline functions?**

```c
// Macro: Text substitution during preprocessing
#define SQUARE(x) ((x) * (x))
// - No type checking
// - Arguments may be evaluated multiple times
// - Can generate any code
// - Cannot recurse
// - Compilation errors are hard to understand

// Inline function: Processed by compiler
static inline int square(int x) {
    return x * x;
}
// - Has type checking
// - Arguments evaluated only once
// - Can recurse (but may not be inlined)
// - Can be debugged
// - Compiler may choose not to inline
```

**Q3: What is the difference between #include <> and #include ""?**

```c
// <> angle brackets: Search only in system directories
#include <stdio.h>
// Search path: Compiler predefined system directories

// "" double quotes: Search current directory first, then system directories
#include "myheader.h"
// Search order:
// 1. Directory of the source file containing this include
// 2. Directories specified with -I
// 3. System directories
```

**Q4: How do you prevent header files from being included multiple times?**

```c
// Method 1: Include Guards (standard method)
#ifndef MYHEADER_H
#define MYHEADER_H
// Contents
#endif

// Method 2: #pragma once (non-standard but widely supported)
#pragma once
// Contents

// Include guard naming conventions:
// - Use all uppercase
// - Use filename
// - Add project prefix to avoid conflicts
// Example: PROJECT_MODULE_FILENAME_H
```

**Q5: Explain the ## and # operators**

```c
// # stringification operator
#define STRINGIFY(x) #x
STRINGIFY(hello)  // "hello"

// ## token pasting operator
#define CONCAT(a, b) a ## b
CONCAT(var, 1)  // var1

// Common use cases
#define MAKE_PAIR(prefix) { prefix ## _KEY, prefix ## _VALUE }
#define PRINT_VAR(var) printf(#var " = %d\n", var)
```

**Q6: What is the difference between #ifdef and #if defined()?**

```c
// Functionally the same, but #if defined() is more flexible

// #ifdef: Can only check a single macro
#ifdef DEBUG
    // code
#endif

// #if defined(): Can combine conditions
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

**Q7: What are typical uses for conditional compilation?**

```c
// 1. Debug code
#ifdef DEBUG
    printf("Debug: x = %d\n", x);
#endif

// 2. Platform compatibility
#ifdef _WIN32
    // Windows code
#else
    // Unix code
#endif

// 3. Feature switches
#if FEATURE_X_ENABLED
    // Feature X code
#endif

// 4. Version compatibility
#if __STDC_VERSION__ >= 201112L
    // C11 features
#endif
```

**Q8: Write a safe MAX macro**

```c
// Basic version (has side effect problems)
#define MAX(a, b) ((a) > (b) ? (a) : (b))

// GCC safe version (avoids multiple evaluation)
#define MAX_SAFE(a, b) \
    ({ \
        typeof(a) _a = (a); \
        typeof(b) _b = (b); \
        _a > _b ? _a : _b; \
    })

// C11 _Generic type-safe version
#define MAX_GENERIC(a, b) _Generic((a) + (b), \
    int: max_int, \
    long: max_long, \
    double: max_double \
)((a), (b))

static inline int max_int(int a, int b) { return a > b ? a : b; }
static inline long max_long(long a, long b) { return a > b ? a : b; }
static inline double max_double(double a, double b) { return a > b ? a : b; }
```

## Further Reading

### Official Documentation and Standards

- [C11 Standard (N1570)](http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) - C Language Standard Document
- [GCC Preprocessor Manual](https://gcc.gnu.org/onlinedocs/cpp/) - GCC Preprocessor Documentation
- [MSVC Preprocessor Reference](https://docs.microsoft.com/en-us/cpp/preprocessor/c-cpp-preprocessor-reference) - MSVC Preprocessor Documentation

### Classic Books

- *The C Programming Language* (K&R) - Brian Kernighan, Dennis Ritchie
- *Expert C Programming* - Peter van der Linden
- *C Traps and Pitfalls* - Andrew Koenig
- *Computer Systems: A Programmer's Perspective* - Randal Bryant

### Quality Articles

- [The C Preprocessor](https://gcc.gnu.org/onlinedocs/cpp/) - GCC Official Tutorial
- [Understanding C/C++ Macros](https://blog.regehr.org/archives/1656) - In-depth Understanding of Macros
- [X-Macros](https://en.wikipedia.org/wiki/X_Macro) - X-Macro Technique Explained
- [Preprocessor Abuse](https://github.com/pfultz2/Cloak/wiki/C-Preprocessor-tricks,-tips,-and-idioms) - Advanced Preprocessor Tricks

### Tools

- [cpp](https://en.wikipedia.org/wiki/C_preprocessor) - Standalone C Preprocessor
- [clang-format](https://clang.llvm.org/docs/ClangFormat.html) - Code Formatting Tool
- [Include What You Use](https://include-what-you-use.org/) - Header File Dependency Analysis Tool
