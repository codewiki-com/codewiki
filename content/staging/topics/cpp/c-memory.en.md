---
title: C Language Memory Management
description: "Master C memory management: stack vs heap, dynamic allocation, memory leaks and alignment"
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C
  - Memory Management
  - malloc
  - Memory Leaks
status: imported
origin: old/src/content/docs/cpp/c-memory.en.md
divergence: 0.255
issues: []
legacy:
  category: Cpp
  subcategory: C Language
  order: 2
  lastUpdated: 2026-01-07
---

Memory management is one of the most critical aspects of C programming. Unlike high-level languages with automatic garbage collection, C requires programmers to manually manage memory allocation and deallocation. Understanding memory management is essential for writing efficient, bug-free C programs.

## Memory Layout in C Programs

A typical C program's memory is divided into several segments:

- **Text Segment**: Contains the compiled machine code (read-only)
- **Data Segment**: Stores initialized global and static variables
- **BSS Segment**: Stores uninitialized global and static variables
- **Stack**: Stores local variables and function call information
- **Heap**: Used for dynamic memory allocation

## Stack Memory vs Heap Memory

### Stack Memory

The stack is a region of memory that operates in a Last-In-First-Out (LIFO) manner. It's managed automatically by the compiler.

**Characteristics:**
- Fast allocation and deallocation
- Limited size (typically 1-8 MB)
- Automatic memory management
- Variables have local scope
- Memory is freed automatically when function returns

**Example:**

```c
#include <stdio.h>

void stackExample() {
    int x = 10;           // Allocated on stack
    char str[50];         // Allocated on stack
    double values[100];   // Allocated on stack

    printf("x = %d\n", x);
    // Memory automatically freed when function returns
}

int main() {
    stackExample();
    return 0;
}
```

**Stack Overflow:**

```c
void causeStackOverflow() {
    int largeArray[1000000];  // May cause stack overflow
    // Stack has limited size
}

void recursiveOverflow(int n) {
    int arr[1000];
    recursiveOverflow(n + 1);  // Eventually causes stack overflow
}
```

### Heap Memory

The heap is a larger region of memory used for dynamic allocation. Memory must be manually managed by the programmer.

**Characteristics:**
- Slower allocation/deallocation compared to stack
- Much larger size (limited by system RAM)
- Manual memory management required
- Variables accessible globally (if pointer is accessible)
- Memory persists until explicitly freed

**Comparison Table:**

| Feature | Stack | Heap |
|---------|-------|------|
| Size | Limited (1-8 MB) | Large (system RAM) |
| Speed | Fast | Slower |
| Management | Automatic | Manual |
| Allocation | Compile-time | Runtime |
| Fragmentation | No | Yes |
| Resize | No | Yes (realloc) |

## Dynamic Memory Allocation Functions

### malloc() - Memory Allocation

Allocates a specified number of bytes and returns a pointer to the first byte.

**Syntax:**
```c
void* malloc(size_t size);
```

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Allocate memory for 5 integers
    int *arr = (int*)malloc(5 * sizeof(int));

    if (arr == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        return 1;
    }

    // Initialize and use the array
    for (int i = 0; i < 5; i++) {
        arr[i] = i * 10;
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    // Free the memory
    free(arr);
    arr = NULL;  // Good practice

    return 0;
}
```

**Important Notes:**
- `malloc()` does not initialize memory (contains garbage values)
- Always check if `malloc()` returns NULL
- Cast the return value for clarity (optional in C, required in C++)
- Use `sizeof()` for portability

### calloc() - Contiguous Allocation

Allocates memory for an array of elements and initializes all bytes to zero.

**Syntax:**
```c
void* calloc(size_t num, size_t size);
```

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Allocate and zero-initialize memory for 5 integers
    int *arr = (int*)calloc(5, sizeof(int));

    if (arr == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        return 1;
    }

    // All elements are initialized to 0
    for (int i = 0; i < 5; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);  // Prints 0
    }

    free(arr);
    arr = NULL;

    return 0;
}
```

**malloc() vs calloc():**

```c
// malloc - uninitialized memory
int *m = (int*)malloc(5 * sizeof(int));
// Contains garbage values

// calloc - zero-initialized memory
int *c = (int*)calloc(5, sizeof(int));
// All elements are 0

// Performance consideration:
// calloc is slightly slower due to initialization
// But safer for preventing uninitialized memory bugs
```

### realloc() - Reallocation

Resizes previously allocated memory block.

**Syntax:**
```c
void* realloc(void* ptr, size_t new_size);
```

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Initially allocate for 5 integers
    int *arr = (int*)malloc(5 * sizeof(int));
    if (arr == NULL) return 1;

    // Initialize
    for (int i = 0; i < 5; i++) {
        arr[i] = i;
    }

    // Resize to hold 10 integers
    int *temp = (int*)realloc(arr, 10 * sizeof(int));
    if (temp == NULL) {
        // Original memory still valid if realloc fails
        free(arr);
        return 1;
    }
    arr = temp;

    // Initialize new elements
    for (int i = 5; i < 10; i++) {
        arr[i] = i;
    }

    // Print all elements
    for (int i = 0; i < 10; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    free(arr);
    return 0;
}
```

**Important realloc() Behaviors:**

```c
// Behavior 1: NULL pointer acts like malloc
int *arr = (int*)realloc(NULL, 5 * sizeof(int));
// Equivalent to malloc(5 * sizeof(int))

// Behavior 2: Size 0 acts like free (implementation-defined)
arr = (int*)realloc(arr, 0);
// May free memory and return NULL

// Behavior 3: May move data to new location
// WRONG - dangerous pattern:
arr = (int*)realloc(arr, new_size);  // If fails, arr is lost

// CORRECT - safe pattern:
int *temp = (int*)realloc(arr, new_size);
if (temp == NULL) {
    // arr still valid
    free(arr);
    return 1;
}
arr = temp;
```

### free() - Deallocation

Deallocates previously allocated memory.

**Syntax:**
```c
void free(void* ptr);
```

**Example:**

```c
#include <stdlib.h>

int main() {
    int *ptr = (int*)malloc(sizeof(int));

    // Use the memory
    *ptr = 42;

    // Free the memory
    free(ptr);
    ptr = NULL;  // Prevent dangling pointer

    // Safe to call free with NULL
    free(ptr);   // No effect

    return 0;
}
```

## Common Memory Management Issues

### Memory Leaks

Memory leaks occur when allocated memory is not freed, causing the program to consume increasing amounts of memory.

**Example of Memory Leak:**

```c
#include <stdlib.h>

void leakyFunction() {
    int *ptr = (int*)malloc(100 * sizeof(int));
    // Memory allocated but never freed
    // Function returns without calling free(ptr)
}

void anotherLeak() {
    int *ptr = (int*)malloc(10 * sizeof(int));
    ptr = (int*)malloc(20 * sizeof(int));  // LEAK! First allocation lost
    free(ptr);  // Only frees second allocation
}

int main() {
    for (int i = 0; i < 1000; i++) {
        leakyFunction();  // Leaks 400 bytes per iteration
    }
    return 0;  // Total leak: ~400KB
}
```

**Correct Version:**

```c
#include <stdlib.h>

void properMemoryManagement() {
    int *ptr = (int*)malloc(100 * sizeof(int));
    if (ptr == NULL) return;

    // Use the memory

    free(ptr);  // Always free before returning
    ptr = NULL;
}

void reassignmentDone Right() {
    int *ptr = (int*)malloc(10 * sizeof(int));
    if (ptr == NULL) return;

    free(ptr);  // Free first allocation

    ptr = (int*)malloc(20 * sizeof(int));
    if (ptr == NULL) return;

    free(ptr);  // Free second allocation
    ptr = NULL;
}

int main() {
    properMemoryManagement();
    reassignmentDoneRight();
    return 0;
}
```

### Dangling Pointers

A dangling pointer points to memory that has been freed or is no longer valid.

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr = (int*)malloc(sizeof(int));
    *ptr = 42;

    free(ptr);
    // ptr is now a dangling pointer

    // DANGEROUS: Using freed memory
    printf("%d\n", *ptr);  // Undefined behavior
    *ptr = 100;             // Undefined behavior

    // SOLUTION: Set to NULL after free
    ptr = NULL;

    // Safe check before use
    if (ptr != NULL) {
        *ptr = 100;
    }

    return 0;
}
```

**Returning Pointer to Local Variable:**

```c
#include <stdio.h>
#include <stdlib.h>

// WRONG - returns dangling pointer
int* dangerousFunction() {
    int x = 42;
    return &x;  // x is destroyed when function returns
}

// CORRECT - returns dynamically allocated memory
int* safeFunction() {
    int *ptr = (int*)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
    }
    return ptr;  // Caller must free this
}

int main() {
    int *p1 = dangerousFunction();
    // *p1 is undefined behavior

    int *p2 = safeFunction();
    if (p2 != NULL) {
        printf("%d\n", *p2);
        free(p2);
    }

    return 0;
}
```

### Double Free

Freeing the same memory twice causes undefined behavior.

**Example:**

```c
#include <stdlib.h>

int main() {
    int *ptr = (int*)malloc(sizeof(int));

    free(ptr);
    free(ptr);  // DOUBLE FREE - undefined behavior

    return 0;
}
```

**Prevention:**

```c
#include <stdlib.h>

int main() {
    int *ptr = (int*)malloc(sizeof(int));

    free(ptr);
    ptr = NULL;  // Set to NULL after freeing

    free(ptr);   // Safe - free(NULL) does nothing

    return 0;
}
```

### Buffer Overflow

Writing beyond allocated memory boundaries.

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Allocate 10 bytes
    char *buffer = (char*)malloc(10);
    if (buffer == NULL) return 1;

    // WRONG - buffer overflow
    strcpy(buffer, "This is a very long string");  // Writes beyond 10 bytes

    free(buffer);

    // CORRECT - check size
    char *buffer2 = (char*)malloc(100);
    if (buffer2 == NULL) return 1;

    strncpy(buffer2, "This is a very long string", 99);
    buffer2[99] = '\0';  // Ensure null termination

    free(buffer2);

    return 0;
}
```

## Memory Alignment

Memory alignment refers to arranging data in memory at addresses that are multiples of a specific value (usually the word size).

### Why Alignment Matters

1. **Performance**: Aligned memory access is faster on most architectures
2. **Requirements**: Some CPUs require aligned access (crash on misaligned access)
3. **Atomic Operations**: Usually require aligned addresses

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

struct Unaligned {
    char c;      // 1 byte
    int i;       // 4 bytes
    char c2;     // 1 byte
    double d;    // 8 bytes
};  // Compiler may add padding

struct Aligned {
    double d;    // 8 bytes (largest first)
    int i;       // 4 bytes
    char c;      // 1 byte
    char c2;     // 1 byte
};  // Better alignment, less padding

int main() {
    printf("Unaligned struct size: %zu bytes\n", sizeof(struct Unaligned));
    printf("Aligned struct size: %zu bytes\n", sizeof(struct Aligned));

    // Check alignment of malloc
    void *ptr = malloc(1);
    printf("malloc(1) address: %p\n", ptr);
    printf("Alignment: %zu\n", (uintptr_t)ptr % sizeof(void*));
    free(ptr);

    return 0;
}
```

### aligned_alloc() (C11)

Allocate aligned memory.

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

int main() {
    size_t alignment = 64;  // 64-byte alignment (cache line)
    size_t size = 1024;

    // Size must be multiple of alignment
    void *ptr = aligned_alloc(alignment, size);

    if (ptr == NULL) {
        fprintf(stderr, "aligned_alloc failed\n");
        return 1;
    }

    printf("Address: %p\n", ptr);
    printf("Is aligned to %zu: %s\n", alignment,
           ((uintptr_t)ptr % alignment == 0) ? "yes" : "no");

    free(ptr);
    return 0;
}
```

### Manual Alignment

**Example:**

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

void* align_malloc(size_t alignment, size_t size) {
    // Allocate extra space for alignment + storing original pointer
    void *original = malloc(size + alignment + sizeof(void*));
    if (original == NULL) return NULL;

    // Calculate aligned address
    uintptr_t addr = (uintptr_t)original + sizeof(void*);
    uintptr_t aligned_addr = (addr + alignment - 1) & ~(alignment - 1);

    // Store original pointer before aligned address
    void **ptr = (void**)aligned_addr;
    ptr[-1] = original;

    return (void*)aligned_addr;
}

void align_free(void *ptr) {
    if (ptr == NULL) return;

    // Retrieve original pointer
    void **p = (void**)ptr;
    free(p[-1]);
}

int main() {
    size_t alignment = 32;
    void *ptr = align_malloc(alignment, 100);

    printf("Aligned address: %p\n", ptr);
    printf("Is aligned to %zu: %s\n", alignment,
           ((uintptr_t)ptr % alignment == 0) ? "yes" : "no");

    align_free(ptr);
    return 0;
}
```

## Best Practices

### Always Check Allocation Success

```c
int *arr = (int*)malloc(n * sizeof(int));
if (arr == NULL) {
    fprintf(stderr, "Memory allocation failed\n");
    return 1;
}
```

### Free Every Allocation

```c
void* ptr = malloc(size);
// ... use ptr ...
free(ptr);
ptr = NULL;
```

### Use sizeof() for Portability

```c
// WRONG - assumes int is 4 bytes
int *arr = (int*)malloc(n * 4);

// CORRECT - portable
int *arr = (int*)malloc(n * sizeof(int));
```

### Set Pointers to NULL After Free

```c
free(ptr);
ptr = NULL;  // Prevents accidental reuse
```

### Pair malloc/free in Same Scope When Possible

```c
void process() {
    int *data = (int*)malloc(100 * sizeof(int));
    if (data == NULL) return;

    // Process data

    free(data);  // Same scope
}
```

### Use Defensive Programming

```c
void safeFunction(int *ptr) {
    if (ptr == NULL) {
        fprintf(stderr, "NULL pointer passed\n");
        return;
    }

    // Use ptr safely
}
```

### Memory Management Wrapper

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void* safe_malloc(size_t size, const char *file, int line) {
    void *ptr = malloc(size);
    if (ptr == NULL) {
        fprintf(stderr, "malloc failed at %s:%d\n", file, line);
        exit(1);
    }
    return ptr;
}

void safe_free(void **ptr) {
    if (ptr != NULL && *ptr != NULL) {
        free(*ptr);
        *ptr = NULL;
    }
}

#define MALLOC(size) safe_malloc(size, __FILE__, __LINE__)
#define FREE(ptr) safe_free((void**)&(ptr))

int main() {
    int *arr = (int*)MALLOC(10 * sizeof(int));

    // Use arr

    FREE(arr);  // Automatically sets arr to NULL
    FREE(arr);  // Safe to call multiple times

    return 0;
}
```

## Debugging Memory Issues

### Using Valgrind (Linux)

```bash
# Compile with debug symbols
gcc -g -o program program.c

# Run with valgrind
valgrind --leak-check=full --show-leak-kinds=all ./program
```

**Example Program:**

```c
#include <stdlib.h>

int main() {
    int *leak = (int*)malloc(10 * sizeof(int));
    // Forgot to free

    int *used = (int*)malloc(5 * sizeof(int));
    free(used);

    return 0;
}
```

**Valgrind Output:**
```
==12345== HEAP SUMMARY:
==12345==     in use at exit: 40 bytes in 1 blocks
==12345==   total heap usage: 2 allocs, 1 frees, 60 bytes allocated
==12345==
==12345== 40 bytes in 1 blocks are definitely lost
```

### AddressSanitizer

```bash
# Compile with AddressSanitizer
gcc -fsanitize=address -g -o program program.c

# Run
./program
```

## Advanced Topics

### Memory Pools

Pre-allocate large blocks to reduce allocation overhead.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    void *pool;
    size_t block_size;
    size_t total_blocks;
    size_t used_blocks;
    unsigned char *availability;
} MemoryPool;

MemoryPool* pool_create(size_t block_size, size_t num_blocks) {
    MemoryPool *pool = (MemoryPool*)malloc(sizeof(MemoryPool));
    if (pool == NULL) return NULL;

    pool->pool = malloc(block_size * num_blocks);
    pool->availability = (unsigned char*)calloc(num_blocks, 1);

    if (pool->pool == NULL || pool->availability == NULL) {
        free(pool->pool);
        free(pool->availability);
        free(pool);
        return NULL;
    }

    pool->block_size = block_size;
    pool->total_blocks = num_blocks;
    pool->used_blocks = 0;

    return pool;
}

void* pool_alloc(MemoryPool *pool) {
    if (pool == NULL || pool->used_blocks >= pool->total_blocks) {
        return NULL;
    }

    for (size_t i = 0; i < pool->total_blocks; i++) {
        if (pool->availability[i] == 0) {
            pool->availability[i] = 1;
            pool->used_blocks++;
            return (char*)pool->pool + (i * pool->block_size);
        }
    }

    return NULL;
}

void pool_free(MemoryPool *pool, void *ptr) {
    if (pool == NULL || ptr == NULL) return;

    size_t index = ((char*)ptr - (char*)pool->pool) / pool->block_size;

    if (index < pool->total_blocks && pool->availability[index] == 1) {
        pool->availability[index] = 0;
        pool->used_blocks--;
    }
}

void pool_destroy(MemoryPool *pool) {
    if (pool == NULL) return;

    free(pool->pool);
    free(pool->availability);
    free(pool);
}

int main() {
    MemoryPool *pool = pool_create(sizeof(int) * 10, 100);
    if (pool == NULL) return 1;

    int *arr1 = (int*)pool_alloc(pool);
    int *arr2 = (int*)pool_alloc(pool);

    printf("Allocated 2 blocks, used: %zu/%zu\n",
           pool->used_blocks, pool->total_blocks);

    pool_free(pool, arr1);
    pool_free(pool, arr2);

    printf("Freed 2 blocks, used: %zu/%zu\n",
           pool->used_blocks, pool->total_blocks);

    pool_destroy(pool);
    return 0;
}
```

## Summary

Memory management in C requires careful attention to detail:

1. **Understand the difference** between stack and heap allocation
2. **Use appropriate functions**: `malloc`, `calloc`, `realloc`, `free`
3. **Always check** if allocation succeeded (NULL check)
4. **Free all allocated memory** to prevent memory leaks
5. **Set pointers to NULL** after freeing to prevent dangling pointers
6. **Avoid common pitfalls**: double free, buffer overflow, use-after-free
7. **Consider alignment** for performance-critical code
8. **Use debugging tools** like Valgrind and AddressSanitizer
9. **Follow best practices** and defensive programming techniques

Mastering memory management is essential for writing robust, efficient C programs. While it requires discipline and careful coding, proper memory management leads to reliable software with optimal performance.
