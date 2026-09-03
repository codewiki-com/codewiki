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
origin: old/src/content/docs/cpp/c-arrays.en.md
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

Arrays are one of the most fundamental data structures in C, used to store collections of elements of the same type. Strings in C are implemented as character arrays, and understanding the relationship between these two is crucial for mastering C.

## Concept Explanation

### What is an Array?

An array is a linear data structure that allocates a contiguous block of memory to store multiple elements of the same type. Each element is accessed through an index (subscript), starting from 0.

**Characteristics of Arrays:**
- All elements are of the same type
- Memory is allocated contiguously
- Size is fixed (static arrays)
- Supports random access (O(1) time complexity)

### What is a String?

In C, a string is a character array terminated by a null character `\0` (ASCII value 0). C has no built-in string type; instead, it uses character arrays to represent and manipulate strings.

```c
// Character array vs String
char arr[] = {'H', 'e', 'l', 'l', 'o'};     // Character array, 5 characters
char str[] = {'H', 'e', 'l', 'l', 'o', '\0'}; // String, 6 characters
char str2[] = "Hello";                        // String literal, automatically adds \0
```

### Historical Background

The concept of arrays originates from vectors and matrices in mathematics. C inherited array design principles from B language, treating array names as pointers to the first element. This design is both concise and efficient, but it also introduces the issue of missing boundary checks.

The string handling method in C was established in the 1970s, and the null-terminated string convention has been used ever since, becoming the standard for many programming languages when interfacing with C.

## Core Principles

### Memory Layout of Arrays

Arrays are stored contiguously in memory, with each element occupying a fixed amount of space:

```
One-dimensional array int arr[5] = {10, 20, 30, 40, 50};

Address:  0x1000   0x1004   0x1008   0x100C   0x1010
         +--------+--------+--------+--------+--------+
Memory:  |   10   |   20   |   30   |   40   |   50   |
         +--------+--------+--------+--------+--------+
Index:     arr[0]   arr[1]   arr[2]   arr[3]   arr[4]
```

**Address Calculation Formula:**
```
Element address = Base address + Index × sizeof(element type)
```

### Memory Layout of Multidimensional Arrays

Multidimensional arrays are stored in row-major order:

```
Two-dimensional array int matrix[2][3] = {{1,2,3}, {4,5,6}};

Logical view:
        Col0  Col1  Col2
Row0 [   1     2     3  ]
Row1 [   4     5     6  ]

Memory layout (contiguous):
Address: 0x100  0x104  0x108  0x10C  0x110  0x114
        +------+------+------+------+------+------+
        |  1   |  2   |  3   |  4   |  5   |  6   |
        +------+------+------+------+------+------+
        [0][0] [0][1] [0][2] [1][0] [1][1] [1][2]
```

**Two-dimensional Array Address Calculation:**
```
Address of matrix[i][j] = Base address + (i × number of columns + j) × sizeof(element type)
```

### Relationship Between Array Names and Pointers

Array names "decay" into pointers to the first element in most expressions:

```c
int arr[5] = {1, 2, 3, 4, 5};

// The following expressions are equivalent
arr[0]     ≡  *arr
arr[i]     ≡  *(arr + i)
&arr[0]    ≡  arr
&arr[i]    ≡  arr + i
```

**Note: Array names are not pointer variables!**

```c
int arr[5];
int *ptr = arr;

sizeof(arr);  // 20 (assuming int is 4 bytes)
sizeof(ptr);  // 4 or 8 (pointer size)

arr++;        // Error! Array name is a constant
ptr++;        // Correct
```

### Storage of Strings

String literals are stored in the read-only data segment, while character arrays are stored on the stack or heap:

```c
char str1[] = "Hello";     // Allocated on stack, can be modified
char *str2 = "Hello";      // str2 points to read-only data segment, should not be modified

str1[0] = 'h';             // Correct
str2[0] = 'h';             // Dangerous! May cause segmentation fault
```

## Key Points

### One-dimensional Arrays

#### Declaration and Initialization

```c
#include <stdio.h>

int main() {
    // Method 1: Specify size
    int arr1[5];                        // Uninitialized (contains garbage values)

    // Method 2: Specify size and initialize
    int arr2[5] = {1, 2, 3, 4, 5};     // Fully initialized
    int arr3[5] = {1, 2};              // Partially initialized, rest are 0
    int arr4[5] = {0};                 // All initialized to 0

    // Method 3: Size inferred from initializer list
    int arr5[] = {1, 2, 3, 4, 5};      // Size is 5

    // Calculate array size
    int size = sizeof(arr5) / sizeof(arr5[0]);
    printf("Array size: %d\n", size);  // Output: 5

    return 0;
}
```

#### Array Access and Traversal

```c
#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int n = sizeof(arr) / sizeof(arr[0]);

    // Method 1: Index access
    printf("Index access:\n");
    for (int i = 0; i < n; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    // Method 2: Pointer access
    printf("\nPointer access:\n");
    for (int i = 0; i < n; i++) {
        printf("*(arr + %d) = %d\n", i, *(arr + i));
    }

    // Method 3: Pointer traversal
    printf("\nPointer traversal:\n");
    for (int *p = arr; p < arr + n; p++) {
        printf("*p = %d\n", *p);
    }

    return 0;
}
```

#### Arrays as Function Parameters

```c
#include <stdio.h>

// Array decays to pointer when passed as parameter
void print_array(int arr[], int size) {
    // sizeof(arr) here is pointer size, not array size
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// Equivalent syntax
void print_array2(int *arr, int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// Modifying array elements
void double_elements(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        arr[i] *= 2;  // Modification affects original array
    }
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("Original array: ");
    print_array(numbers, n);

    double_elements(numbers, n);

    printf("After doubling: ");
    print_array(numbers, n);

    return 0;
}
```

### Multidimensional Arrays

#### Two-dimensional Arrays

```c
#include <stdio.h>

int main() {
    // Two-dimensional array declaration and initialization
    int matrix[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    // Partial initialization
    int matrix2[3][4] = {
        {1, 2},       // First row: 1, 2, 0, 0
        {5},          // Second row: 5, 0, 0, 0
        {9, 10, 11}   // Third row: 9, 10, 11, 0
    };

    // Linear initialization (fills by rows)
    int matrix3[3][4] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};

    // Traverse two-dimensional array
    printf("Matrix contents:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }

    return 0;
}
```

#### Two-dimensional Arrays and Pointers

```c
#include <stdio.h>

int main() {
    int matrix[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    // matrix is a pointer to int[4]
    printf("Type of matrix: pointer to int[4]\n");

    // Various equivalent expressions
    printf("\nEquivalent expressions:\n");
    printf("matrix[1][2] = %d\n", matrix[1][2]);
    printf("*(matrix[1] + 2) = %d\n", *(matrix[1] + 2));
    printf("(*(matrix + 1))[2] = %d\n", (*(matrix + 1))[2]);
    printf("*(*(matrix + 1) + 2) = %d\n", *(*(matrix + 1) + 2));

    // Traverse using pointer to array
    int (*p)[4] = matrix;  // p points to an array of 4 ints
    printf("\nTraverse using array pointer:\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", p[i][j]);
        }
        printf("\n");
    }

    return 0;
}
```

#### Two-dimensional Arrays as Function Parameters

```c
#include <stdio.h>

// Method 1: Specify full dimensions
void print_matrix_1(int matrix[3][4], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// Method 2: Omit first dimension
void print_matrix_2(int matrix[][4], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// Method 3: Use array pointer
void print_matrix_3(int (*matrix)[4], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }
}

// Method 4: Dynamic column count (using VLA, C99+)
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

    printf("Method 1:\n");
    print_matrix_1(matrix, 3);

    printf("\nMethod 4 (VLA):\n");
    print_matrix_4(3, 4, matrix);

    return 0;
}
```

#### Three-dimensional and Higher-dimensional Arrays

```c
#include <stdio.h>

int main() {
    // Three-dimensional array: 2 matrices of 3x4
    int cube[2][3][4] = {
        {   // First 3x4 matrix
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12}
        },
        {   // Second 3x4 matrix
            {13, 14, 15, 16},
            {17, 18, 19, 20},
            {21, 22, 23, 24}
        }
    };

    printf("Three-dimensional array traversal:\n");
    for (int i = 0; i < 2; i++) {
        printf("Matrix %d:\n", i);
        for (int j = 0; j < 3; j++) {
            for (int k = 0; k < 4; k++) {
                printf("%3d ", cube[i][j][k]);
            }
            printf("\n");
        }
        printf("\n");
    }

    // Memory size
    printf("Total size of cube: %zu bytes\n", sizeof(cube));
    printf("Number of elements: %zu\n", sizeof(cube) / sizeof(int));

    return 0;
}
```

### Character Arrays and Strings

#### Declaration and Initialization of Character Arrays

```c
#include <stdio.h>
#include <string.h>

int main() {
    // Method 1: Initialize character by character
    char arr1[] = {'H', 'e', 'l', 'l', 'o', '\0'};

    // Method 2: String literal (automatically adds \0)
    char arr2[] = "Hello";

    // Method 3: Specify size
    char arr3[10] = "Hello";  // Remaining space filled with \0

    // Method 4: Character pointer (points to read-only string)
    char *str = "Hello";

    printf("arr1: %s (length: %zu)\n", arr1, strlen(arr1));
    printf("arr2: %s (length: %zu)\n", arr2, strlen(arr2));
    printf("arr3: %s (size: %zu, length: %zu)\n", arr3, sizeof(arr3), strlen(arr3));
    printf("str: %s (length: %zu)\n", str, strlen(str));

    // arr2 can be modified
    arr2[0] = 'h';
    printf("Modified arr2: %s\n", arr2);

    // str should not be modified (points to read-only memory)
    // str[0] = 'h';  // Dangerous!

    return 0;
}
```

#### Reading and Outputting Strings

```c
#include <stdio.h>
#include <string.h>

int main() {
    char name[50];
    char line[100];

    // Method 1: scanf (reads until whitespace)
    printf("Enter name (no spaces): ");
    scanf("%49s", name);  // Limit length to prevent overflow
    printf("Name: %s\n", name);

    // Clear input buffer
    int c;
    while ((c = getchar()) != '\n' && c != EOF);

    // Method 2: fgets (reads entire line, including spaces)
    printf("Enter a line of text: ");
    if (fgets(line, sizeof(line), stdin) != NULL) {
        // Remove trailing newline
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }
        printf("Input content: %s\n", line);
    }

    // Output methods
    printf("Using printf: %s\n", name);
    puts(name);  // Automatically adds newline
    fputs(name, stdout);  // Does not add newline
    printf("\n");

    return 0;
}
```

#### String Traversal

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "Hello, World!";

    // Method 1: Using strlen
    printf("Method 1 - strlen:\n");
    size_t len = strlen(str);
    for (size_t i = 0; i < len; i++) {
        printf("str[%zu] = '%c'\n", i, str[i]);
    }

    // Method 2: Check for null character
    printf("\nMethod 2 - Check \\0:\n");
    for (int i = 0; str[i] != '\0'; i++) {
        printf("str[%d] = '%c'\n", i, str[i]);
    }

    // Method 3: Pointer traversal
    printf("\nMethod 3 - Pointer:\n");
    for (char *p = str; *p != '\0'; p++) {
        printf("*p = '%c'\n", *p);
    }

    // Count character occurrences
    int count = 0;
    for (char *p = str; *p; p++) {
        if (*p == 'l') count++;
    }
    printf("\nCharacter 'l' count: %d\n", count);

    return 0;
}
```

## Code Examples

### Common String Functions

#### strlen - Calculate String Length

```c
#include <stdio.h>
#include <string.h>

// Custom strlen implementation
size_t my_strlen(const char *str) {
    size_t len = 0;
    while (*str++) {
        len++;
    }
    return len;
}

// More efficient implementation
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

    // Note: strlen does not count \0
    printf("sizeof: %zu (includes \\0)\n", sizeof(str));

    return 0;
}
```

#### strcpy and strncpy - String Copy

```c
#include <stdio.h>
#include <string.h>

// Custom strcpy implementation
char* my_strcpy(char *dest, const char *src) {
    char *original = dest;
    while ((*dest++ = *src++));
    return original;
}

// Safe version
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
    char dest3[8];  // Too small

    // strcpy - unsafe
    strcpy(dest1, src);
    printf("strcpy: %s\n", dest1);

    // strncpy - safer
    strncpy(dest2, src, sizeof(dest2) - 1);
    dest2[sizeof(dest2) - 1] = '\0';  // Ensure null termination
    printf("strncpy: %s\n", dest2);

    // Small buffer
    strncpy(dest3, src, sizeof(dest3) - 1);
    dest3[sizeof(dest3) - 1] = '\0';
    printf("Truncated: %s\n", dest3);  // Output: Hello,

    return 0;
}
```

#### strcat and strncat - String Concatenation

```c
#include <stdio.h>
#include <string.h>

// Custom strcat implementation
char* my_strcat(char *dest, const char *src) {
    char *original = dest;

    // Find end of dest
    while (*dest) dest++;

    // Copy src
    while ((*dest++ = *src++));

    return original;
}

int main() {
    char buffer[50] = "Hello";

    // strcat
    strcat(buffer, ", ");
    strcat(buffer, "World!");
    printf("strcat result: %s\n", buffer);

    // strncat - safer
    char buffer2[20] = "Hello";
    size_t remaining = sizeof(buffer2) - strlen(buffer2) - 1;
    strncat(buffer2, ", World! This is a long string", remaining);
    printf("strncat result: %s\n", buffer2);

    return 0;
}
```

#### strcmp and strncmp - String Comparison

```c
#include <stdio.h>
#include <string.h>

// Custom strcmp implementation
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
    printf("strcmp(\"apple\", \"Apple\") = %d\n", strcmp(str1, str4));   // > 0 (case sensitive)

    // Compare first n characters
    printf("\nstrncmp(\"apple\", \"application\", 5) = %d\n",
           strncmp("apple", "application", 5));  // < 0
    printf("strncmp(\"apple\", \"application\", 4) = %d\n",
           strncmp("apple", "application", 4));  // = 0

    return 0;
}
```

#### strchr and strstr - String Search

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "Hello, World! Hello, C!";

    // strchr - find character
    char *p = strchr(str, 'W');
    if (p) {
        printf("Found 'W' at position: %ld\n", p - str);
        printf("From 'W': %s\n", p);
    }

    // strrchr - search from end
    p = strrchr(str, 'o');
    if (p) {
        printf("Last 'o' at position: %ld\n", p - str);
    }

    // strstr - find substring
    p = strstr(str, "World");
    if (p) {
        printf("Found \"World\" at position: %ld\n", p - str);
    }

    // Find all occurrences
    printf("\nAll \"Hello\" positions:\n");
    p = str;
    while ((p = strstr(p, "Hello")) != NULL) {
        printf("  Position: %ld\n", p - str);
        p++;  // Move to next character to continue search
    }

    return 0;
}
```

#### strtok - String Tokenization

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "apple,banana,cherry,date";
    char *token;

    printf("Original string: %s\n", str);
    printf("\nTokenization result:\n");

    // First call passes the string
    token = strtok(str, ",");

    while (token != NULL) {
        printf("  '%s'\n", token);
        // Subsequent calls pass NULL
        token = strtok(NULL, ",");
    }

    // Note: strtok modifies the original string
    printf("\nModified original string:\n");
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

#### sprintf and sscanf - Formatted Strings

```c
#include <stdio.h>

int main() {
    char buffer[100];

    // sprintf - format output to string
    int year = 2026;
    int month = 1;
    int day = 7;

    sprintf(buffer, "%04d-%02d-%02d", year, month, day);
    printf("Date: %s\n", buffer);

    // snprintf - safer version
    snprintf(buffer, sizeof(buffer), "Name: %s, Age: %d", "Alice", 25);
    printf("Info: %s\n", buffer);

    // sscanf - parse from string
    char data[] = "Alice 25 175.5";
    char name[20];
    int age;
    float height;

    sscanf(data, "%s %d %f", name, &age, &height);
    printf("\nParsed result:\n");
    printf("  Name: %s\n", name);
    printf("  Age: %d\n", age);
    printf("  Height: %.1f\n", height);

    // Parse CSV
    char csv[] = "John,30,180.0";
    sscanf(csv, "%[^,],%d,%f", name, &age, &height);
    printf("\nCSV parsed:\n");
    printf("  Name: %s, Age: %d, Height: %.1f\n", name, age, height);

    return 0;
}
```

### Array Operation Examples

#### Array Sorting

```c
#include <stdio.h>
#include <stdlib.h>

// Bubble sort
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

// qsort comparison function
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

    print_array(arr1, n, "Original");

    // Bubble sort
    bubble_sort(arr1, n);
    print_array(arr1, n, "Bubble sort");

    // Using standard library qsort
    qsort(arr2, n, sizeof(int), compare);
    print_array(arr2, n, "qsort     ");

    return 0;
}
```

#### Array Search

```c
#include <stdio.h>
#include <stdlib.h>

// Linear search
int linear_search(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

// Binary search (array must be sorted)
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

// bsearch comparison function
int compare(const void *key, const void *element) {
    return (*(int*)key - *(int*)element);
}

int main() {
    int arr[] = {11, 12, 22, 25, 34, 64, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 25;

    // Linear search
    int idx = linear_search(arr, n, target);
    printf("Linear search %d: index %d\n", target, idx);

    // Binary search
    idx = binary_search(arr, n, target);
    printf("Binary search %d: index %d\n", target, idx);

    // Using standard library bsearch
    int *result = (int*)bsearch(&target, arr, n, sizeof(int), compare);
    if (result) {
        printf("bsearch %d: index %ld\n", target, result - arr);
    }

    return 0;
}
```

#### Dynamic Array

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int *data;
    size_t size;      // Current number of elements
    size_t capacity;  // Capacity
} DynamicArray;

// Create dynamic array
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

// Add element
int da_push(DynamicArray *arr, int value) {
    // Expand capacity
    if (arr->size >= arr->capacity) {
        size_t new_capacity = arr->capacity * 2;
        int *new_data = realloc(arr->data, new_capacity * sizeof(int));
        if (!new_data) return -1;

        arr->data = new_data;
        arr->capacity = new_capacity;
        printf("Expanded to %zu\n", new_capacity);
    }

    arr->data[arr->size++] = value;
    return 0;
}

// Get element
int da_get(DynamicArray *arr, size_t index, int *value) {
    if (index >= arr->size) return -1;
    *value = arr->data[index];
    return 0;
}

// Free memory
void da_destroy(DynamicArray *arr) {
    if (arr) {
        free(arr->data);
        free(arr);
    }
}

// Print array
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

    printf("\nFinal array: ");
    da_print(arr);

    da_destroy(arr);
    return 0;
}
```

## Best Practices

### Always Check Array Bounds

```c
#include <stdio.h>
#include <stdbool.h>

#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// Safe array access
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

    // Safe access
    if (safe_get(arr, ARRAY_SIZE(arr), 2, &value)) {
        printf("arr[2] = %d\n", value);
    }

    // Out-of-bounds access is prevented
    if (!safe_get(arr, ARRAY_SIZE(arr), 10, &value)) {
        printf("Index 10 out of bounds\n");
    }

    return 0;
}
```

### Use const to Protect Read-only Data

```c
#include <stdio.h>

// Use const when not modifying array contents
void print_array(const int *arr, size_t size) {
    for (size_t i = 0; i < size; i++) {
        printf("%d ", arr[i]);
        // arr[i] = 0;  // Compilation error
    }
    printf("\n");
}

// Use const when not modifying string
size_t safe_strlen(const char *str) {
    size_t len = 0;
    while (*str++) len++;
    return len;
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    print_array(numbers, 5);

    const char *greeting = "Hello";
    printf("Length: %zu\n", safe_strlen(greeting));

    return 0;
}
```

### Use Safe String Functions

```c
#include <stdio.h>
#include <string.h>

// Safe string copy
char* safe_strcpy(char *dest, size_t dest_size, const char *src) {
    if (dest_size == 0) return dest;

    size_t i;
    for (i = 0; i < dest_size - 1 && src[i] != '\0'; i++) {
        dest[i] = src[i];
    }
    dest[i] = '\0';

    return dest;
}

// Safe string concatenation
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
    printf("Copy result: %s\n", buffer);  // Output: Hello, Wo

    char buffer2[20] = "Hello";
    safe_strcat(buffer2, sizeof(buffer2), ", World! Extra text here");
    printf("Concat result: %s\n", buffer2);  // Output: Hello, World! Ext

    return 0;
}
```

### Properly Initialize Arrays

```c
#include <stdio.h>
#include <string.h>

int main() {
    // Method 1: Initialize to zero
    int arr1[10] = {0};

    // Method 2: Use memset
    int arr2[10];
    memset(arr2, 0, sizeof(arr2));

    // Method 3: Initialize character array
    char str1[50] = "";  // First character is \0, rest are 0
    char str2[50] = {0}; // All zeros

    // Verify initialization
    printf("arr1[5] = %d\n", arr1[5]);
    printf("arr2[5] = %d\n", arr2[5]);
    printf("str1[0] = %d\n", str1[0]);

    return 0;
}
```

### Use Macros to Simplify Array Operations

```c
#include <stdio.h>

// Get static array size
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

// Array traversal macro
#define ARRAY_FOREACH(arr, size, action) \
    do { \
        for (size_t _i = 0; _i < (size); _i++) { \
            action; \
        } \
    } while(0)

// Safe array indexing
#define ARRAY_GET(arr, size, index, default_val) \
    ((index) < (size) ? (arr)[index] : (default_val))

int main() {
    int numbers[] = {10, 20, 30, 40, 50};

    printf("Array size: %zu\n", ARRAY_SIZE(numbers));

    // Traverse using macro
    printf("Elements: ");
    ARRAY_FOREACH(numbers, ARRAY_SIZE(numbers),
        printf("%d ", numbers[_i]));
    printf("\n");

    // Safe access
    printf("arr[2] = %d\n", ARRAY_GET(numbers, ARRAY_SIZE(numbers), 2, -1));
    printf("arr[10] = %d\n", ARRAY_GET(numbers, ARRAY_SIZE(numbers), 10, -1));

    return 0;
}
```

## Common Pitfalls

### Array Out of Bounds

```c
#include <stdio.h>

int main() {
    int arr[5] = {1, 2, 3, 4, 5};

    // Dangerous: out-of-bounds access
    // printf("%d\n", arr[5]);   // Undefined behavior
    // printf("%d\n", arr[-1]);  // Undefined behavior
    // arr[10] = 100;            // May corrupt other data

    // Correct approach: check bounds
    int index = 3;
    int size = sizeof(arr) / sizeof(arr[0]);

    if (index >= 0 && index < size) {
        printf("arr[%d] = %d\n", index, arr[index]);
    }

    return 0;
}
```

### String Buffer Overflow

```c
#include <stdio.h>
#include <string.h>

void dangerous_function() {
    char buffer[10];

    // Dangerous: strcpy doesn't check length
    // strcpy(buffer, "This is a very long string");

    // Dangerous: gets is deprecated
    // gets(buffer);

    // Safe approach
    strncpy(buffer, "This is a very long string", sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    printf("Safe copy: %s\n", buffer);
}

void safe_input() {
    char buffer[50];

    printf("Enter content: ");
    if (fgets(buffer, sizeof(buffer), stdin)) {
        // Remove newline
        buffer[strcspn(buffer, "\n")] = '\0';
        printf("Safe input: %s\n", buffer);
    }
}

int main() {
    dangerous_function();
    // safe_input();  // Interactive input
    return 0;
}
```

### Confusing Arrays and Pointers

```c
#include <stdio.h>

void test_sizes() {
    int arr[10];
    int *ptr = arr;

    printf("sizeof(arr) = %zu\n", sizeof(arr));  // 40 (10 * 4)
    printf("sizeof(ptr) = %zu\n", sizeof(ptr));  // 4 or 8 (pointer size)

    // In function parameters, arrays decay to pointers
    // void func(int arr[10]) is equivalent to void func(int *arr)
}

void wrong_size_calc(int arr[]) {
    // Wrong! Here arr is a pointer
    // int size = sizeof(arr) / sizeof(arr[0]);
    printf("Inside function sizeof(arr) = %zu\n", sizeof(arr));  // Pointer size
}

int main() {
    test_sizes();

    int numbers[10] = {0};
    wrong_size_calc(numbers);

    return 0;
}
```

### Modifying String Literals

```c
#include <stdio.h>

int main() {
    // Method 1: Character array (modifiable)
    char str1[] = "Hello";
    str1[0] = 'h';  // Correct
    printf("str1: %s\n", str1);

    // Method 2: String literal pointer (should not modify)
    char *str2 = "Hello";
    // str2[0] = 'h';  // Dangerous! May cause segmentation fault

    // Correct approach: use const
    const char *str3 = "Hello";
    // str3[0] = 'h';  // Compilation error

    return 0;
}
```

### Forgetting Null Termination

```c
#include <stdio.h>
#include <string.h>

int main() {
    // Wrong: no null character
    char bad_str[5] = {'H', 'e', 'l', 'l', 'o'};
    // printf("%s\n", bad_str);  // Undefined behavior, may print garbage

    // Correct: includes null character
    char good_str[6] = {'H', 'e', 'l', 'l', 'o', '\0'};
    printf("good_str: %s\n", good_str);

    // Be careful when using strncpy
    char buffer[5];
    strncpy(buffer, "Hello, World!", sizeof(buffer));
    // buffer now has no \0 termination
    buffer[sizeof(buffer) - 1] = '\0';  // Manually add
    printf("buffer: %s\n", buffer);

    return 0;
}
```

### Returning Pointer to Local Array

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Wrong! Returning pointer to local array
char* bad_function() {
    char local_array[50] = "Hello";
    return local_array;  // Dangerous! local_array is destroyed after function returns
}

// Correct approach 1: Use static array (but not reentrant)
char* static_function() {
    static char buffer[50];
    strcpy(buffer, "Hello");
    return buffer;
}

// Correct approach 2: Dynamic allocation (caller responsible for freeing)
char* dynamic_function() {
    char *buffer = malloc(50);
    if (buffer) {
        strcpy(buffer, "Hello");
    }
    return buffer;
}

// Correct approach 3: Caller provides buffer
void caller_buffer(char *buffer, size_t size) {
    strncpy(buffer, "Hello", size - 1);
    buffer[size - 1] = '\0';
}

int main() {
    // char *bad = bad_function();
    // printf("%s\n", bad);  // Undefined behavior

    char *static_str = static_function();
    printf("Static: %s\n", static_str);

    char *dynamic_str = dynamic_function();
    if (dynamic_str) {
        printf("Dynamic: %s\n", dynamic_str);
        free(dynamic_str);
    }

    char buffer[50];
    caller_buffer(buffer, sizeof(buffer));
    printf("Caller buffer: %s\n", buffer);

    return 0;
}
```

## Performance Considerations

### Cache-friendly Access Patterns

```c
#include <stdio.h>
#include <time.h>

#define SIZE 1000

// Row-major access (cache-friendly)
void row_major(int matrix[SIZE][SIZE]) {
    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            matrix[i][j] = i + j;
        }
    }
}

// Column-major access (cache-unfriendly)
void col_major(int matrix[SIZE][SIZE]) {
    for (int j = 0; j < SIZE; j++) {
        for (int i = 0; i < SIZE; i++) {
            matrix[i][j] = i + j;
        }
    }
}

int main() {
    static int matrix[SIZE][SIZE];  // Use static to avoid stack overflow
    clock_t start, end;

    // Test row-major
    start = clock();
    for (int k = 0; k < 100; k++) {
        row_major(matrix);
    }
    end = clock();
    printf("Row-major: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    // Test column-major
    start = clock();
    for (int k = 0; k < 100; k++) {
        col_major(matrix);
    }
    end = clock();
    printf("Column-major: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    return 0;
}
```

### Avoid Frequent strlen Calls

```c
#include <stdio.h>
#include <string.h>
#include <time.h>

// Inefficient: calls strlen on every iteration
void inefficient_loop(const char *str) {
    for (size_t i = 0; i < strlen(str); i++) {  // O(n^2)
        // Process str[i]
    }
}

// Efficient: calls strlen only once
void efficient_loop(const char *str) {
    size_t len = strlen(str);
    for (size_t i = 0; i < len; i++) {  // O(n)
        // Process str[i]
    }
}

// Most efficient: no strlen call
void most_efficient_loop(const char *str) {
    for (size_t i = 0; str[i] != '\0'; i++) {  // O(n)
        // Process str[i]
    }
}

int main() {
    // Create long string
    char long_str[100001];
    memset(long_str, 'a', 100000);
    long_str[100000] = '\0';

    clock_t start, end;

    // Test inefficient version
    start = clock();
    for (int k = 0; k < 100; k++) {
        size_t count = 0;
        for (size_t i = 0; i < strlen(long_str); i++) {
            count++;
        }
    }
    end = clock();
    printf("Inefficient: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    // Test efficient version
    start = clock();
    for (int k = 0; k < 100; k++) {
        size_t count = 0;
        size_t len = strlen(long_str);
        for (size_t i = 0; i < len; i++) {
            count++;
        }
    }
    end = clock();
    printf("Efficient: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    return 0;
}
```

### Use memcpy and memset

```c
#include <stdio.h>
#include <string.h>
#include <time.h>

#define SIZE 10000000

// Manual copy
void manual_copy(int *dest, const int *src, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dest[i] = src[i];
    }
}

int main() {
    static int src[SIZE], dest[SIZE];
    clock_t start, end;

    // Initialize
    for (int i = 0; i < SIZE; i++) {
        src[i] = i;
    }

    // Manual copy
    start = clock();
    manual_copy(dest, src, SIZE);
    end = clock();
    printf("Manual copy: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    // memcpy (usually optimized)
    start = clock();
    memcpy(dest, src, SIZE * sizeof(int));
    end = clock();
    printf("memcpy:      %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    // memset initialization
    start = clock();
    memset(dest, 0, SIZE * sizeof(int));
    end = clock();
    printf("memset:      %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    return 0;
}
```

### Avoid Unnecessary String Copying

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// Inefficient: unnecessary copy
void process_inefficient(const char *input) {
    char *copy = malloc(strlen(input) + 1);
    strcpy(copy, input);

    // Only reading, not modifying
    printf("Processing: %s\n", copy);

    free(copy);
}

// Efficient: use original data directly
void process_efficient(const char *input) {
    // Use directly, no copy
    printf("Processing: %s\n", input);
}

// Only copy when modification needed
void process_with_modify(const char *input) {
    size_t len = strlen(input);
    char *copy = malloc(len + 1);
    strcpy(copy, input);

    // Need to modify
    for (size_t i = 0; i < len; i++) {
        if (copy[i] >= 'a' && copy[i] <= 'z') {
            copy[i] -= 32;  // Convert to uppercase
        }
    }

    printf("Modified: %s\n", copy);
    free(copy);
}

int main() {
    const char *text = "Hello, World!";

    process_efficient(text);
    process_with_modify(text);

    return 0;
}
```

## Practical Scenarios

### Implementing a Simple String Library

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

// String structure
typedef struct {
    char *data;
    size_t length;
    size_t capacity;
} String;

// Create string
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

// Append string
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

// Convert to uppercase
void string_to_upper(String *str) {
    for (size_t i = 0; i < str->length; i++) {
        str->data[i] = toupper(str->data[i]);
    }
}

// Convert to lowercase
void string_to_lower(String *str) {
    for (size_t i = 0; i < str->length; i++) {
        str->data[i] = tolower(str->data[i]);
    }
}

// Trim leading and trailing whitespace
void string_trim(String *str) {
    // Trim trailing whitespace
    while (str->length > 0 && isspace(str->data[str->length - 1])) {
        str->length--;
    }
    str->data[str->length] = '\0';

    // Trim leading whitespace
    size_t start = 0;
    while (start < str->length && isspace(str->data[start])) {
        start++;
    }

    if (start > 0) {
        memmove(str->data, str->data + start, str->length - start + 1);
        str->length -= start;
    }
}

// Find substring
int string_find(const String *str, const char *substr) {
    char *pos = strstr(str->data, substr);
    return pos ? (int)(pos - str->data) : -1;
}

// Free string
void string_free(String *str) {
    if (str) {
        free(str->data);
        free(str);
    }
}

int main() {
    String *str = string_create("  Hello");

    string_append(str, ", World!  ");
    printf("Original: '%s'\n", str->data);

    string_trim(str);
    printf("Trimmed: '%s'\n", str->data);

    string_to_upper(str);
    printf("Uppercase: '%s'\n", str->data);

    int pos = string_find(str, "WORLD");
    printf("'WORLD' position: %d\n", pos);

    string_free(str);
    return 0;
}
```

### Matrix Operations

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Matrix structure
typedef struct {
    double **data;
    size_t rows;
    size_t cols;
} Matrix;

// Create matrix
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

// Free matrix
void matrix_free(Matrix *m) {
    if (m) {
        for (size_t i = 0; i < m->rows; i++) {
            free(m->data[i]);
        }
        free(m->data);
        free(m);
    }
}

// Matrix multiplication
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

// Matrix transpose
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

// Print matrix
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

    // Initialize matrix A
    double a_values[2][3] = {{1, 2, 3}, {4, 5, 6}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 3; j++) {
            a->data[i][j] = a_values[i][j];
        }
    }

    // Initialize matrix B
    double b_values[3][2] = {{7, 8}, {9, 10}, {11, 12}};
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 2; j++) {
            b->data[i][j] = b_values[i][j];
        }
    }

    matrix_print(a, "Matrix A");
    matrix_print(b, "Matrix B");

    Matrix *c = matrix_multiply(a, b);
    if (c) {
        matrix_print(c, "A x B");
        matrix_free(c);
    }

    Matrix *at = matrix_transpose(a);
    if (at) {
        matrix_print(at, "Transpose of A");
        matrix_free(at);
    }

    matrix_free(a);
    matrix_free(b);

    return 0;
}
```

### Command Line Argument Parsing

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
    printf("Usage: %s [options] <input file>\n", program_name);
    printf("Options:\n");
    printf("  -h, --help       Show help information\n");
    printf("  -v, --verbose    Verbose output\n");
    printf("  -o, --output     Specify output file\n");
    printf("  -n, --count      Specify count\n");
}

bool parse_arguments(int argc, char *argv[], Options *opts) {
    // Initialize defaults
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
                fprintf(stderr, "Error: -o requires an argument\n");
                return false;
            }
        }
        else if (strcmp(argv[i], "-n") == 0 || strcmp(argv[i], "--count") == 0) {
            if (i + 1 < argc) {
                opts->count = atoi(argv[++i]);
            } else {
                fprintf(stderr, "Error: -n requires an argument\n");
                return false;
            }
        }
        else if (argv[i][0] == '-') {
            fprintf(stderr, "Error: unknown option '%s'\n", argv[i]);
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

    printf("Parse result:\n");
    printf("  Verbose mode: %s\n", opts.verbose ? "yes" : "no");
    printf("  Input file: %s\n", opts.input_file ? opts.input_file : "(not specified)");
    printf("  Output file: %s\n", opts.output_file ? opts.output_file : "(not specified)");
    printf("  Count: %d\n", opts.count);

    return 0;
}
```

## Interview Key Points

### Differences Between Arrays and Pointers

**Q: What are the differences between array names and pointers?**

```c
int arr[5];
int *ptr = arr;

// 1. sizeof differs
sizeof(arr);  // 20 (array size)
sizeof(ptr);  // 4 or 8 (pointer size)

// 2. Addresses differ
&arr;   // Type is int(*)[5], points to entire array
&ptr;   // Type is int**, points to pointer variable

// 3. Modifiability differs
ptr++;  // Correct, pointer can be modified
// arr++; // Error, array name is a constant
```

### String Literal Storage

**Q: What's the problem with the following code?**

```c
char *str = "Hello";
str[0] = 'h';  // What's the problem here?
```

**A:** The string literal `"Hello"` is stored in the read-only data segment, and `str` points to this read-only memory. Attempting to modify it causes undefined behavior (usually a segmentation fault).

Correct approach:
```c
char str[] = "Hello";  // Copy to stack
str[0] = 'h';          // Can be modified
```

### Memory Layout of Two-dimensional Arrays

**Q: How to calculate the address of a two-dimensional array element?**

```c
int arr[3][4];
// Address of arr[i][j] = (char*)arr + (i * 4 + j) * sizeof(int)
// Equivalent to: &arr[0][0] + (i * 4 + j)
```

### Arrays as Function Parameters

**Q: Why can't you get the array size inside a function?**

```c
void func(int arr[]) {
    // sizeof(arr) returns pointer size, not array size
    // Because array parameter decays to pointer
}
```

**Solution:** Pass array size as an additional parameter, or use a struct wrapper.

### strcpy vs strncpy

**Q: What's the difference between strcpy and strncpy? Is strncpy always safe?**

```c
char dest[5];
strcpy(dest, "Hello, World!");   // Buffer overflow!

strncpy(dest, "Hello, World!", sizeof(dest));
// dest is now "Hello", but without \0 terminator!

// Safe approach
strncpy(dest, "Hello, World!", sizeof(dest) - 1);
dest[sizeof(dest) - 1] = '\0';
```

### Implementing Common String Functions

**Q: Implement strlen, strcpy, strcmp**

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

### VLA (Variable Length Arrays)

**Q: What is VLA? What are its limitations?**

```c
void func(int n) {
    int arr[n];  // C99 variable length array
    // ...
}
```

**Limitations:**
- Introduced in C99, made optional in C11
- Cannot be used for global or static arrays
- May cause stack overflow
- Some compilers don't support it (e.g., MSVC)

## Further Reading

### Official Documentation and Standards

- [C Language Standard (C11)](https://www.iso.org/standard/57853.html) - ISO/IEC 9899:2011
- [cppreference - C Reference Manual](https://en.cppreference.com/w/c) - Complete C language reference
- [GCC Documentation](https://gcc.gnu.org/onlinedocs/) - GNU C compiler documentation

### Classic Books

- **"The C Programming Language"** (K&R) - Brian Kernighan, Dennis Ritchie
  - The authoritative work on C, with classic explanations of arrays and pointers

- **"Pointers on C"** - Kenneth Reek
  - In-depth coverage of the relationship between pointers and arrays

- **"Expert C Programming"** - Peter van der Linden
  - Advanced C programming techniques, including arrays and memory layout

- **"C Traps and Pitfalls"** - Andrew Koenig
  - Common C language errors and pitfalls

### Online Resources

- [GeeksforGeeks - C Arrays](https://www.geeksforgeeks.org/c-arrays/) - Detailed array tutorial
- [Learn-C.org](https://www.learn-c.org/) - Interactive C language tutorial
- [Tutorialspoint - C Strings](https://www.tutorialspoint.com/cprogramming/c_strings.htm) - String handling tutorial

### Tools

- [Valgrind](https://valgrind.org/) - Memory error detection tool
- [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer) - Memory error detection
- [Compiler Explorer](https://godbolt.org/) - Online compiler-generated code viewer
