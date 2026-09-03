---
title: C Language Pointers
description: "Deep dive into C pointers: basics, arithmetic, arrays, function pointers and multi-level pointers"
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C
  - Pointers
  - Memory
  - Arrays
status: imported
origin: old/src/content/docs/cpp/c-pointers.en.md
divergence: 0.222
issues: []
legacy:
  category: Cpp
  subcategory: C Language
  order: 1
  lastUpdated: 2026-01-07
---

Pointers are one of the most powerful and fundamental features of the C programming language. They provide direct access to memory addresses, enabling efficient data manipulation, dynamic memory allocation, and complex data structures. This comprehensive guide explores pointers from basic concepts to advanced usage patterns.

## Pointer Basics

A pointer is a variable that stores the memory address of another variable. Understanding pointers requires familiarity with two key operators:

- **Address-of operator (`&`)**: Returns the memory address of a variable
- **Dereference operator (`*`)**: Accesses the value stored at a memory address

### Declaration and Initialization

```c
#include <stdio.h>

int main() {
    int num = 42;           // Regular integer variable
    int *ptr;               // Pointer declaration

    ptr = &num;             // Store address of num in ptr

    printf("Value of num: %d\n", num);
    printf("Address of num: %p\n", (void*)&num);
    printf("Value of ptr: %p\n", (void*)ptr);
    printf("Value pointed to by ptr: %d\n", *ptr);

    // Modify value through pointer
    *ptr = 100;
    printf("New value of num: %d\n", num);

    return 0;
}
```

**Output:**
```
Value of num: 42
Address of num: 0x7ffd5c3a8b4c
Value of ptr: 0x7ffd5c3a8b4c
Value pointed to by ptr: 42
New value of num: 100
```

### Pointer Types

Pointers have types that match the data they point to. This is crucial for correct memory interpretation:

```c
#include <stdio.h>

int main() {
    int i = 10;
    float f = 3.14;
    char c = 'A';

    int *p_int = &i;
    float *p_float = &f;
    char *p_char = &c;

    printf("Integer: %d (size: %zu bytes)\n", *p_int, sizeof(int));
    printf("Float: %.2f (size: %zu bytes)\n", *p_float, sizeof(float));
    printf("Char: %c (size: %zu bytes)\n", *p_char, sizeof(char));

    return 0;
}
```

### NULL Pointers

A NULL pointer is a pointer that doesn't point to any valid memory location. It's good practice to initialize pointers to NULL:

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr = NULL;  // Initialize to NULL

    if (ptr == NULL) {
        printf("Pointer is NULL - safe to check before dereferencing\n");
    }

    // Allocate memory
    ptr = (int*)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 50;
        printf("Value: %d\n", *ptr);
        free(ptr);
    }

    return 0;
}
```

## Pointer Arithmetic

Pointer arithmetic allows you to navigate through memory by adding or subtracting integer values from pointers. The actual byte offset depends on the pointer type.

### Basic Operations

```c
#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int *ptr = arr;  // Points to first element

    printf("Initial pointer address: %p\n", (void*)ptr);
    printf("Value at ptr: %d\n", *ptr);

    // Increment pointer
    ptr++;
    printf("\nAfter ptr++:\n");
    printf("Pointer address: %p\n", (void*)ptr);
    printf("Value at ptr: %d\n", *ptr);

    // Add 2 to pointer
    ptr += 2;
    printf("\nAfter ptr += 2:\n");
    printf("Pointer address: %p\n", (void*)ptr);
    printf("Value at ptr: %d\n", *ptr);

    // Pointer subtraction
    printf("\nPointer difference: %ld elements\n", ptr - arr);

    return 0;
}
```

### Traversing an Array

```c
#include <stdio.h>

int main() {
    int numbers[] = {2, 4, 6, 8, 10};
    int *ptr = numbers;
    int size = sizeof(numbers) / sizeof(numbers[0]);

    // Method 1: Using pointer increment
    printf("Using pointer increment:\n");
    for (int i = 0; i < size; i++) {
        printf("%d ", *ptr);
        ptr++;
    }
    printf("\n");

    // Method 2: Using pointer arithmetic
    printf("\nUsing pointer arithmetic:\n");
    ptr = numbers;  // Reset pointer
    for (int i = 0; i < size; i++) {
        printf("%d ", *(ptr + i));
    }
    printf("\n");

    return 0;
}
```

### Pointer Comparison

```c
#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    int *start = arr;
    int *end = arr + 4;

    if (start < end) {
        printf("start pointer comes before end pointer\n");
    }

    // Calculate distance
    printf("Distance: %ld elements\n", end - start);

    return 0;
}
```

## Pointers and Arrays

In C, arrays and pointers are closely related. An array name can be used as a pointer to its first element.

### Array-Pointer Equivalence

```c
#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};

    // These are equivalent
    printf("arr[0]: %d\n", arr[0]);
    printf("*arr: %d\n", *arr);

    printf("\narr[2]: %d\n", arr[2]);
    printf("*(arr + 2): %d\n", *(arr + 2));

    // Using pointer variable
    int *ptr = arr;
    printf("\nptr[3]: %d\n", ptr[3]);
    printf("*(ptr + 3): %d\n", *(ptr + 3));

    return 0;
}
```

### Passing Arrays to Functions

Arrays are passed to functions as pointers, which is why the function can modify the original array:

```c
#include <stdio.h>

// These declarations are equivalent
void printArray1(int arr[], int size);
void printArray2(int *arr, int size);

void modifyArray(int *arr, int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;
    }
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);

    printf("Original array: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\n");

    modifyArray(numbers, size);

    printf("Modified array: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
    }
    printf("\n");

    return 0;
}
```

### Dynamic Arrays

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int size;

    printf("Enter array size: ");
    scanf("%d", &size);

    // Allocate memory dynamically
    int *arr = (int*)malloc(size * sizeof(int));

    if (arr == NULL) {
        printf("Memory allocation failed\n");
        return 1;
    }

    // Initialize array
    for (int i = 0; i < size; i++) {
        arr[i] = i * 10;
    }

    // Print array
    printf("Dynamic array: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // Free memory
    free(arr);

    return 0;
}
```

### Pointer to Array vs Array of Pointers

```c
#include <stdio.h>

int main() {
    // Array of pointers
    int a = 10, b = 20, c = 30;
    int *ptrArray[3] = {&a, &b, &c};

    printf("Array of pointers:\n");
    for (int i = 0; i < 3; i++) {
        printf("Value: %d\n", *ptrArray[i]);
    }

    // Pointer to an array
    int arr[3] = {40, 50, 60};
    int (*ptrToArray)[3] = &arr;

    printf("\nPointer to array:\n");
    for (int i = 0; i < 3; i++) {
        printf("Value: %d\n", (*ptrToArray)[i]);
    }

    return 0;
}
```

## Multi-level Pointers

Multi-level pointers (pointer to pointer) are commonly used for dynamic multi-dimensional arrays and modifying pointers in functions.

### Double Pointers (Pointer to Pointer)

```c
#include <stdio.h>

int main() {
    int num = 42;
    int *ptr = &num;        // Single pointer
    int **pptr = &ptr;      // Double pointer

    printf("Value using num: %d\n", num);
    printf("Value using *ptr: %d\n", *ptr);
    printf("Value using **pptr: %d\n", **pptr);

    printf("\nAddress of num: %p\n", (void*)&num);
    printf("Value of ptr: %p\n", (void*)ptr);
    printf("Address of ptr: %p\n", (void*)&ptr);
    printf("Value of pptr: %p\n", (void*)pptr);

    // Modify through double pointer
    **pptr = 100;
    printf("\nModified value: %d\n", num);

    return 0;
}
```

### Dynamic 2D Arrays

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int rows = 3, cols = 4;

    // Allocate array of pointers
    int **matrix = (int**)malloc(rows * sizeof(int*));

    // Allocate each row
    for (int i = 0; i < rows; i++) {
        matrix[i] = (int*)malloc(cols * sizeof(int));
    }

    // Initialize matrix
    int value = 1;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            matrix[i][j] = value++;
        }
    }

    // Print matrix
    printf("Matrix:\n");
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }

    // Free memory
    for (int i = 0; i < rows; i++) {
        free(matrix[i]);
    }
    free(matrix);

    return 0;
}
```

### Modifying Pointers in Functions

```c
#include <stdio.h>
#include <stdlib.h>

void allocateMemory(int **ptr, int value) {
    *ptr = (int*)malloc(sizeof(int));
    if (*ptr != NULL) {
        **ptr = value;
    }
}

void swap(int **a, int **b) {
    int *temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int *p = NULL;
    allocateMemory(&p, 99);

    if (p != NULL) {
        printf("Allocated value: %d\n", *p);
    }

    int x = 10, y = 20;
    int *px = &x, *py = &y;

    printf("\nBefore swap: *px = %d, *py = %d\n", *px, *py);
    swap(&px, &py);
    printf("After swap: *px = %d, *py = %d\n", *px, *py);

    free(p);
    return 0;
}
```

### Triple Pointers and Beyond

```c
#include <stdio.h>

int main() {
    int num = 42;
    int *ptr = &num;
    int **pptr = &ptr;
    int ***ppptr = &pptr;

    printf("Value: %d\n", num);
    printf("Value via *ptr: %d\n", *ptr);
    printf("Value via **pptr: %d\n", **pptr);
    printf("Value via ***ppptr: %d\n", ***ppptr);

    // Modify through triple pointer
    ***ppptr = 999;
    printf("Modified value: %d\n", num);

    return 0;
}
```

## Function Pointers

Function pointers allow you to store and call functions dynamically, enabling callback mechanisms and flexible program design.

### Basic Function Pointers

```c
#include <stdio.h>

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
    // Declare function pointer
    int (*operation)(int, int);

    // Point to add function
    operation = add;
    printf("10 + 5 = %d\n", operation(10, 5));

    // Point to subtract function
    operation = subtract;
    printf("10 - 5 = %d\n", operation(10, 5));

    // Point to multiply function
    operation = multiply;
    printf("10 * 5 = %d\n", operation(10, 5));

    return 0;
}
```

### Array of Function Pointers

```c
#include <stdio.h>

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }
int divide(int a, int b) { return b != 0 ? a / b : 0; }

int main() {
    // Array of function pointers
    int (*operations[4])(int, int) = {add, subtract, multiply, divide};
    char *names[] = {"Addition", "Subtraction", "Multiplication", "Division"};

    int x = 20, y = 4;

    for (int i = 0; i < 4; i++) {
        printf("%s: %d\n", names[i], operations[i](x, y));
    }

    return 0;
}
```

### Callback Functions

```c
#include <stdio.h>

void processArray(int arr[], int size, void (*callback)(int)) {
    for (int i = 0; i < size; i++) {
        callback(arr[i]);
    }
}

void printSquare(int n) {
    printf("%d squared = %d\n", n, n * n);
}

void printDouble(int n) {
    printf("%d doubled = %d\n", n, n * 2);
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);

    printf("Squaring numbers:\n");
    processArray(numbers, size, printSquare);

    printf("\nDoubling numbers:\n");
    processArray(numbers, size, printDouble);

    return 0;
}
```

### Function Pointers in Structures

```c
#include <stdio.h>

typedef struct {
    int (*add)(int, int);
    int (*subtract)(int, int);
    int (*multiply)(int, int);
} Calculator;

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }

int main() {
    Calculator calc = {add, subtract, multiply};

    int x = 15, y = 3;

    printf("%d + %d = %d\n", x, y, calc.add(x, y));
    printf("%d - %d = %d\n", x, y, calc.subtract(x, y));
    printf("%d * %d = %d\n", x, y, calc.multiply(x, y));

    return 0;
}
```

## Void Pointers

Void pointers (`void*`) are generic pointers that can point to any data type. They must be cast to a specific type before dereferencing.

### Basic Void Pointer Usage

```c
#include <stdio.h>

int main() {
    int i = 10;
    float f = 3.14;
    char c = 'A';

    void *ptr;

    // Point to integer
    ptr = &i;
    printf("Integer: %d\n", *(int*)ptr);

    // Point to float
    ptr = &f;
    printf("Float: %.2f\n", *(float*)ptr);

    // Point to char
    ptr = &c;
    printf("Char: %c\n", *(char*)ptr);

    return 0;
}
```

### Generic Functions with Void Pointers

```c
#include <stdio.h>
#include <string.h>

void swap(void *a, void *b, size_t size) {
    unsigned char temp[size];
    memcpy(temp, a, size);
    memcpy(a, b, size);
    memcpy(b, temp, size);
}

int main() {
    // Swap integers
    int x = 10, y = 20;
    printf("Before: x = %d, y = %d\n", x, y);
    swap(&x, &y, sizeof(int));
    printf("After: x = %d, y = %d\n", x, y);

    // Swap floats
    float f1 = 1.5, f2 = 2.5;
    printf("\nBefore: f1 = %.1f, f2 = %.1f\n", f1, f2);
    swap(&f1, &f2, sizeof(float));
    printf("After: f1 = %.1f, f2 = %.1f\n", f1, f2);

    return 0;
}
```

### Void Pointers and Memory Allocation

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // malloc returns void*
    void *memory = malloc(100);

    if (memory != NULL) {
        // Cast to appropriate type
        int *intArray = (int*)memory;

        // Use the memory
        for (int i = 0; i < 10; i++) {
            intArray[i] = i * 10;
        }

        printf("Array values: ");
        for (int i = 0; i < 10; i++) {
            printf("%d ", intArray[i]);
        }
        printf("\n");

        free(memory);
    }

    return 0;
}
```

## Common Pitfalls and Best Practices

### Dangling Pointers

```c
#include <stdio.h>
#include <stdlib.h>

// DANGEROUS: Returning pointer to local variable
int* badFunction() {
    int local = 42;
    return &local;  // BAD: local goes out of scope
}

// GOOD: Returning pointer to dynamically allocated memory
int* goodFunction() {
    int *ptr = (int*)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
    }
    return ptr;
}

int main() {
    // Dangling pointer after free
    int *ptr1 = (int*)malloc(sizeof(int));
    *ptr1 = 10;
    free(ptr1);
    // ptr1 is now dangling - don't use it!
    ptr1 = NULL;  // GOOD: Set to NULL after free

    // Proper usage
    int *ptr2 = goodFunction();
    if (ptr2 != NULL) {
        printf("Value: %d\n", *ptr2);
        free(ptr2);
        ptr2 = NULL;
    }

    return 0;
}
```

### Memory Leaks

```c
#include <stdio.h>
#include <stdlib.h>

void memoryLeakExample() {
    int *ptr = (int*)malloc(sizeof(int));
    *ptr = 100;
    // FORGOT TO FREE - Memory leak!
}

void properMemoryManagement() {
    int *ptr = (int*)malloc(sizeof(int));
    if (ptr == NULL) {
        return;
    }

    *ptr = 100;
    printf("Value: %d\n", *ptr);

    free(ptr);  // GOOD: Free the memory
    ptr = NULL; // GOOD: Prevent dangling pointer
}

int main() {
    properMemoryManagement();
    return 0;
}
```

### Pointer Initialization

```c
#include <stdio.h>

int main() {
    // BAD: Uninitialized pointer
    int *bad_ptr;  // Contains garbage value
    // *bad_ptr = 10;  // CRASH! Don't do this

    // GOOD: Initialize to NULL
    int *good_ptr = NULL;
    if (good_ptr != NULL) {
        *good_ptr = 10;  // Safe: won't execute
    }

    // GOOD: Initialize with valid address
    int value = 42;
    int *proper_ptr = &value;
    *proper_ptr = 10;  // Safe

    printf("Value: %d\n", value);

    return 0;
}
```

### Const Pointers

```c
#include <stdio.h>

int main() {
    int x = 10, y = 20;

    // Pointer to constant integer (can't change value)
    const int *ptr1 = &x;
    // *ptr1 = 20;  // ERROR: Can't modify value
    ptr1 = &y;      // OK: Can change pointer

    // Constant pointer (can't change pointer)
    int *const ptr2 = &x;
    *ptr2 = 30;     // OK: Can modify value
    // ptr2 = &y;   // ERROR: Can't change pointer

    // Constant pointer to constant integer
    const int *const ptr3 = &x;
    // *ptr3 = 40;  // ERROR: Can't modify value
    // ptr3 = &y;   // ERROR: Can't change pointer

    printf("x = %d\n", x);

    return 0;
}
```

### Best Practices Summary

1. **Always initialize pointers**: Set to NULL or a valid address
2. **Check for NULL**: Before dereferencing or freeing
3. **Free allocated memory**: Prevent memory leaks
4. **Set pointers to NULL after free**: Prevent dangling pointers
5. **Match allocation and deallocation**: malloc/free, new/delete
6. **Use const correctness**: Prevent unintended modifications
7. **Avoid returning addresses of local variables**: They become invalid
8. **Be careful with pointer arithmetic**: Ensure you stay within bounds
9. **Use meaningful variable names**: ptr is generic, studentPtr is clear
10. **Consider using smart pointers in C++**: Automatic memory management

## Conclusion

Pointers are a fundamental feature of C that provide low-level memory control and enable powerful programming patterns. While they can be challenging to master, understanding pointers is essential for:

- Dynamic memory allocation
- Efficient array and string manipulation
- Implementing complex data structures
- Creating flexible callback mechanisms
- Interfacing with hardware and system-level programming

By following best practices and understanding common pitfalls, you can leverage pointers effectively while avoiding the bugs and security issues that come with improper pointer usage. Practice with small examples, use debugging tools, and always validate your pointer operations to write robust C code.
