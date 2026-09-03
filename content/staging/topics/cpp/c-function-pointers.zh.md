---
title: C 语言函数指针详解
description: 深入理解 C 语言函数指针：语法、回调函数、函数指针数组、void 指针与函数指针的高级应用
track: cpp
section: basics
difficulty: intermediate
tags:
  - C
  - 函数指针
  - 回调函数
  - 指针
  - 底层编程
status: imported
origin: old/src/content/docs/cpp/c-function-pointers.zh.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: C 语言
  order: 2
  lastUpdated: 2026-01-07
---

函数指针是 C 语言中最强大的特性之一，它允许我们将函数作为数据来处理。通过函数指针，可以实现回调机制、动态函数调用、策略模式等高级编程技术。函数指针是许多重要系统软件（如操作系统、编译器、嵌入式系统）的基础构建块。

## 概念解释

### 什么是函数指针？

函数指针是一个指向函数的指针变量。与普通指针指向数据不同，函数指针指向的是内存中可执行代码的起始地址。通过函数指针，我们可以：

1. 将函数作为参数传递给其他函数
2. 将函数存储在数据结构中
3. 在运行时动态选择要调用的函数
4. 实现回调机制和事件处理

### 历史背景

函数指针的概念源于 C 语言的设计哲学——一切都是地址。在 C 语言中，函数名本身就是一个指向函数代码的地址。这个特性使得 C 语言能够：

- 实现 UNIX 操作系统中的系统调用表
- 构建标准库中的 `qsort()`、`bsearch()` 等通用算法
- 支持面向对象编程的多态特性（通过虚函数表）
- 实现各种设计模式和回调机制

### 函数指针解决的问题

1. **代码复用**：允许编写通用的算法，通过传入不同的函数来实现不同的行为
2. **解耦**：调用者不需要知道被调用函数的具体实现
3. **运行时多态**：在程序运行时决定调用哪个函数
4. **事件驱动编程**：支持回调函数和事件处理机制

## 核心原理

### 函数在内存中的表示

当程序被编译和加载时，函数的机器码被存放在内存的代码段（text segment）中。函数名实际上代表了这段代码的起始地址。

```c
#include <stdio.h>

void hello() {
    printf("Hello, World!\n");
}

int main() {
    // 函数名就是函数的地址
    printf("函数 hello 的地址: %p\n", (void*)hello);
    printf("使用 & 获取地址: %p\n", (void*)&hello);

    // 两种写法等价
    // hello 和 &hello 都表示函数的地址

    return 0;
}
```

### 函数指针的类型

函数指针的类型由函数的签名决定，包括：

1. **返回类型**
2. **参数类型列表**

这意味着函数指针具有类型安全性——只能指向具有匹配签名的函数。

```c
// 不同签名的函数对应不同类型的函数指针

// 无参数无返回值的函数
void func1(void);
void (*ptr1)(void);  // 对应的函数指针类型

// 接受两个 int，返回 int 的函数
int func2(int, int);
int (*ptr2)(int, int);  // 对应的函数指针类型

// 接受指针参数，返回指针的函数
char* func3(const char*);
char* (*ptr3)(const char*);  // 对应的函数指针类型
```

### 函数调用的本质

通过函数指针调用函数时，编译器生成的代码会：

1. 将参数压入栈或放入寄存器（根据调用约定）
2. 跳转到函数指针指向的地址执行代码
3. 函数执行完毕后返回到调用点

```c
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int (*fp)(int, int) = add;

    // 以下三种调用方式等价
    int result1 = add(3, 4);       // 直接调用
    int result2 = fp(3, 4);        // 通过函数指针调用
    int result3 = (*fp)(3, 4);     // 显式解引用调用

    printf("result1 = %d\n", result1);
    printf("result2 = %d\n", result2);
    printf("result3 = %d\n", result3);

    return 0;
}
```

## 核心要点

### 函数指针的声明语法

函数指针的声明语法可能看起来复杂，但遵循固定的模式：

```
返回类型 (*指针名)(参数类型列表)
```

```c
// 基本声明示例
int (*fp1)(int, int);              // 指向返回 int，接受两个 int 参数的函数
void (*fp2)(void);                 // 指向无返回值，无参数的函数
double (*fp3)(double, double);     // 指向返回 double，接受两个 double 参数的函数
char* (*fp4)(const char*);         // 指向返回 char*，接受 const char* 参数的函数
int (*fp5)(int*, int);             // 指向返回 int，接受 int* 和 int 参数的函数
```

### 使用 typedef 简化声明

`typedef` 可以大大简化函数指针的使用：

```c
#include <stdio.h>

// 定义函数指针类型
typedef int (*BinaryOp)(int, int);
typedef void (*Callback)(int);
typedef int (*Comparator)(const void*, const void*);

int add(int a, int b) { return a + b; }
int multiply(int a, int b) { return a * b; }

void print_result(int value) {
    printf("结果: %d\n", value);
}

int main() {
    // 使用 typedef 定义的类型声明变量
    BinaryOp operation = add;
    Callback cb = print_result;

    int result = operation(5, 3);
    cb(result);

    operation = multiply;
    result = operation(5, 3);
    cb(result);

    return 0;
}
```

### 函数指针的赋值和调用

```c
#include <stdio.h>

int square(int x) {
    return x * x;
}

int cube(int x) {
    return x * x * x;
}

int main() {
    // 声明函数指针
    int (*math_func)(int);

    // 赋值方式 1：直接使用函数名
    math_func = square;
    printf("square(5) = %d\n", math_func(5));

    // 赋值方式 2：使用取地址运算符（效果相同）
    math_func = &cube;
    printf("cube(5) = %d\n", math_func(5));

    // 调用方式 1：直接使用函数指针
    printf("调用方式1: %d\n", math_func(3));

    // 调用方式 2：显式解引用
    printf("调用方式2: %d\n", (*math_func)(3));

    return 0;
}
```

### 函数指针与 const

函数指针也可以与 `const` 结合使用：

```c
#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

int main() {
    // 普通函数指针（可以改变指向）
    int (*fp)(int, int) = add;
    fp = sub;  // OK

    // const 函数指针（不能改变指向）
    int (* const cfp)(int, int) = add;
    // cfp = sub;  // 错误：不能修改 const 指针

    printf("fp(10, 5) = %d\n", fp(10, 5));
    printf("cfp(10, 5) = %d\n", cfp(10, 5));

    return 0;
}
```

## 代码示例

### 示例 1：基本函数指针使用

```c
#include <stdio.h>
#include <math.h>

// 数学运算函数
double add(double a, double b) { return a + b; }
double subtract(double a, double b) { return a - b; }
double multiply(double a, double b) { return a * b; }
double divide(double a, double b) {
    return b != 0 ? a / b : 0;
}

int main() {
    // 定义函数指针类型
    typedef double (*MathOp)(double, double);

    // 声明并初始化函数指针
    MathOp operation;
    double a = 10.0, b = 3.0;

    // 动态选择操作
    operation = add;
    printf("%.2f + %.2f = %.2f\n", a, b, operation(a, b));

    operation = subtract;
    printf("%.2f - %.2f = %.2f\n", a, b, operation(a, b));

    operation = multiply;
    printf("%.2f * %.2f = %.2f\n", a, b, operation(a, b));

    operation = divide;
    printf("%.2f / %.2f = %.2f\n", a, b, operation(a, b));

    return 0;
}
```

### 示例 2：回调函数实现

回调函数是函数指针最常见的应用场景之一：

```c
#include <stdio.h>
#include <stdlib.h>

// 定义回调函数类型
typedef void (*EventCallback)(int event_id, void* data);

// 事件处理结构
typedef struct {
    int event_id;
    EventCallback callback;
    void* user_data;
} EventHandler;

// 注册事件处理器
void register_event(EventHandler* handler, int event_id,
                   EventCallback callback, void* data) {
    handler->event_id = event_id;
    handler->callback = callback;
    handler->user_data = data;
}

// 触发事件
void trigger_event(EventHandler* handler, int event_id) {
    if (handler->event_id == event_id && handler->callback != NULL) {
        handler->callback(event_id, handler->user_data);
    }
}

// 具体的回调函数实现
void on_click(int event_id, void* data) {
    char* button_name = (char*)data;
    printf("按钮 '%s' 被点击，事件ID: %d\n", button_name, event_id);
}

void on_hover(int event_id, void* data) {
    int* position = (int*)data;
    printf("鼠标悬停在位置 (%d, %d)，事件ID: %d\n",
           position[0], position[1], event_id);
}

int main() {
    EventHandler click_handler, hover_handler;

    // 注册点击事件
    char* button = "提交按钮";
    register_event(&click_handler, 1, on_click, button);

    // 注册悬停事件
    int position[] = {100, 200};
    register_event(&hover_handler, 2, on_hover, position);

    // 模拟事件触发
    printf("模拟用户交互:\n");
    trigger_event(&click_handler, 1);
    trigger_event(&hover_handler, 2);

    return 0;
}
```

### 示例 3：函数指针数组

函数指针数组可以实现类似 switch-case 的功能，但更加灵活：

```c
#include <stdio.h>

// 定义操作函数
int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }
int divide(int a, int b) { return b != 0 ? a / b : 0; }
int modulo(int a, int b) { return b != 0 ? a % b : 0; }

// 定义函数指针类型
typedef int (*Operation)(int, int);

int main() {
    // 函数指针数组
    Operation operations[] = {add, subtract, multiply, divide, modulo};
    const char* op_names[] = {"加法", "减法", "乘法", "除法", "取模"};
    int num_ops = sizeof(operations) / sizeof(operations[0]);

    int a = 20, b = 6;

    printf("计算器演示 (a = %d, b = %d):\n", a, b);
    printf("================================\n");

    for (int i = 0; i < num_ops; i++) {
        printf("%s: %d\n", op_names[i], operations[i](a, b));
    }

    // 使用枚举创建更可读的代码
    enum { ADD, SUB, MUL, DIV, MOD };

    printf("\n通过索引选择操作:\n");
    printf("operations[ADD](10, 5) = %d\n", operations[ADD](10, 5));
    printf("operations[MUL](10, 5) = %d\n", operations[MUL](10, 5));

    return 0;
}
```

### 示例 4：状态机实现

函数指针数组是实现状态机的绝佳工具：

```c
#include <stdio.h>

// 状态定义
typedef enum {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_PAUSED,
    STATE_STOPPED,
    STATE_COUNT
} State;

// 事件定义
typedef enum {
    EVENT_START,
    EVENT_PAUSE,
    EVENT_RESUME,
    EVENT_STOP,
    EVENT_COUNT
} Event;

// 状态机上下文
typedef struct {
    State current_state;
    const char* name;
} StateMachine;

// 状态转换函数类型
typedef State (*TransitionFunc)(StateMachine*);

// 状态转换函数实现
State idle_start(StateMachine* sm) {
    printf("[%s] 从空闲状态启动\n", sm->name);
    return STATE_RUNNING;
}

State running_pause(StateMachine* sm) {
    printf("[%s] 暂停运行\n", sm->name);
    return STATE_PAUSED;
}

State running_stop(StateMachine* sm) {
    printf("[%s] 停止运行\n", sm->name);
    return STATE_STOPPED;
}

State paused_resume(StateMachine* sm) {
    printf("[%s] 恢复运行\n", sm->name);
    return STATE_RUNNING;
}

State paused_stop(StateMachine* sm) {
    printf("[%s] 从暂停状态停止\n", sm->name);
    return STATE_STOPPED;
}

State no_transition(StateMachine* sm) {
    printf("[%s] 无效的状态转换\n", sm->name);
    return sm->current_state;
}

// 状态转换表 [当前状态][事件] -> 转换函数
TransitionFunc transition_table[STATE_COUNT][EVENT_COUNT] = {
    // STATE_IDLE
    {idle_start, no_transition, no_transition, no_transition},
    // STATE_RUNNING
    {no_transition, running_pause, no_transition, running_stop},
    // STATE_PAUSED
    {no_transition, no_transition, paused_resume, paused_stop},
    // STATE_STOPPED
    {no_transition, no_transition, no_transition, no_transition}
};

// 处理事件
void handle_event(StateMachine* sm, Event event) {
    TransitionFunc transition = transition_table[sm->current_state][event];
    sm->current_state = transition(sm);
}

// 获取状态名称
const char* get_state_name(State state) {
    const char* names[] = {"IDLE", "RUNNING", "PAUSED", "STOPPED"};
    return names[state];
}

int main() {
    StateMachine machine = {STATE_IDLE, "进程1"};

    printf("初始状态: %s\n\n", get_state_name(machine.current_state));

    // 模拟事件序列
    Event events[] = {EVENT_START, EVENT_PAUSE, EVENT_RESUME, EVENT_STOP};
    int num_events = sizeof(events) / sizeof(events[0]);

    for (int i = 0; i < num_events; i++) {
        handle_event(&machine, events[i]);
        printf("当前状态: %s\n\n", get_state_name(machine.current_state));
    }

    return 0;
}
```

### 示例 5：通用排序与回调

实现类似标准库 `qsort` 的通用排序函数：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 比较函数类型
typedef int (*CompareFunc)(const void*, const void*);

// 通用冒泡排序
void generic_sort(void* base, size_t num, size_t size, CompareFunc compare) {
    char* arr = (char*)base;
    char* temp = (char*)malloc(size);

    for (size_t i = 0; i < num - 1; i++) {
        for (size_t j = 0; j < num - i - 1; j++) {
            void* elem1 = arr + j * size;
            void* elem2 = arr + (j + 1) * size;

            if (compare(elem1, elem2) > 0) {
                // 交换元素
                memcpy(temp, elem1, size);
                memcpy(elem1, elem2, size);
                memcpy(elem2, temp, size);
            }
        }
    }

    free(temp);
}

// 整数比较函数
int compare_int_asc(const void* a, const void* b) {
    return *(int*)a - *(int*)b;
}

int compare_int_desc(const void* a, const void* b) {
    return *(int*)b - *(int*)a;
}

// 字符串比较函数
int compare_string(const void* a, const void* b) {
    return strcmp(*(char**)a, *(char**)b);
}

// 结构体定义
typedef struct {
    char name[50];
    int age;
    float score;
} Student;

// 按年龄比较
int compare_by_age(const void* a, const void* b) {
    return ((Student*)a)->age - ((Student*)b)->age;
}

// 按分数比较（降序）
int compare_by_score(const void* a, const void* b) {
    float diff = ((Student*)b)->score - ((Student*)a)->score;
    return (diff > 0) ? 1 : (diff < 0) ? -1 : 0;
}

// 按姓名比较
int compare_by_name(const void* a, const void* b) {
    return strcmp(((Student*)a)->name, ((Student*)b)->name);
}

void print_students(Student* students, int n, const char* title) {
    printf("\n%s:\n", title);
    printf("%-15s %-5s %-6s\n", "姓名", "年龄", "分数");
    printf("----------------------------\n");
    for (int i = 0; i < n; i++) {
        printf("%-15s %-5d %-6.1f\n",
               students[i].name, students[i].age, students[i].score);
    }
}

int main() {
    // 整数排序示例
    int numbers[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(numbers) / sizeof(numbers[0]);

    printf("原始数组: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n");

    generic_sort(numbers, n, sizeof(int), compare_int_asc);
    printf("升序排序: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n");

    generic_sort(numbers, n, sizeof(int), compare_int_desc);
    printf("降序排序: ");
    for (int i = 0; i < n; i++) printf("%d ", numbers[i]);
    printf("\n");

    // 学生排序示例
    Student students[] = {
        {"张三", 20, 85.5},
        {"李四", 19, 92.0},
        {"王五", 21, 78.5},
        {"赵六", 19, 88.0},
        {"钱七", 22, 95.5}
    };
    int num_students = sizeof(students) / sizeof(students[0]);

    print_students(students, num_students, "原始顺序");

    generic_sort(students, num_students, sizeof(Student), compare_by_age);
    print_students(students, num_students, "按年龄排序");

    generic_sort(students, num_students, sizeof(Student), compare_by_score);
    print_students(students, num_students, "按分数排序(降序)");

    generic_sort(students, num_students, sizeof(Student), compare_by_name);
    print_students(students, num_students, "按姓名排序");

    return 0;
}
```

### 示例 6：函数指针与 void 指针结合

void 指针与函数指针结合可以实现高度通用的编程模式：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 通用遍历函数类型
typedef void (*IteratorFunc)(void* element, void* context);

// 通用数组遍历
void for_each(void* array, size_t count, size_t elem_size,
              IteratorFunc func, void* context) {
    char* ptr = (char*)array;
    for (size_t i = 0; i < count; i++) {
        func(ptr + i * elem_size, context);
    }
}

// 打印整数
void print_int(void* element, void* context) {
    int* value = (int*)element;
    const char* prefix = (const char*)context;
    printf("%s%d\n", prefix, *value);
}

// 累加整数
void sum_int(void* element, void* context) {
    int* value = (int*)element;
    int* sum = (int*)context;
    *sum += *value;
}

// 打印字符串
void print_string(void* element, void* context) {
    char** str = (char**)element;
    int* index = (int*)context;
    printf("[%d] %s\n", (*index)++, *str);
}

// 通用查找函数
typedef int (*PredicateFunc)(void* element, void* criteria);

void* find_if(void* array, size_t count, size_t elem_size,
              PredicateFunc predicate, void* criteria) {
    char* ptr = (char*)array;
    for (size_t i = 0; i < count; i++) {
        if (predicate(ptr + i * elem_size, criteria)) {
            return ptr + i * elem_size;
        }
    }
    return NULL;
}

// 判断整数是否大于阈值
int int_greater_than(void* element, void* criteria) {
    return *(int*)element > *(int*)criteria;
}

// 判断字符串是否包含子串
int string_contains(void* element, void* criteria) {
    char** str = (char**)element;
    char* substr = (char*)criteria;
    return strstr(*str, substr) != NULL;
}

// 通用映射函数
typedef void (*MapFunc)(void* dest, void* src, void* context);

void map(void* dest, void* src, size_t count, size_t elem_size,
         MapFunc func, void* context) {
    char* d = (char*)dest;
    char* s = (char*)src;
    for (size_t i = 0; i < count; i++) {
        func(d + i * elem_size, s + i * elem_size, context);
    }
}

// 将整数翻倍
void double_int(void* dest, void* src, void* context) {
    *(int*)dest = *(int*)src * 2;
}

// 将整数加上偏移量
void add_offset(void* dest, void* src, void* context) {
    int offset = *(int*)context;
    *(int*)dest = *(int*)src + offset;
}

int main() {
    // 整数数组操作
    int numbers[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int count = sizeof(numbers) / sizeof(numbers[0]);

    printf("=== 遍历示例 ===\n");
    printf("数组元素:\n");
    for_each(numbers, count, sizeof(int), print_int, "  值: ");

    printf("\n=== 累加示例 ===\n");
    int sum = 0;
    for_each(numbers, count, sizeof(int), sum_int, &sum);
    printf("数组总和: %d\n", sum);

    printf("\n=== 查找示例 ===\n");
    int threshold = 5;
    int* found = (int*)find_if(numbers, count, sizeof(int),
                               int_greater_than, &threshold);
    if (found) {
        printf("第一个大于 %d 的元素: %d\n", threshold, *found);
    }

    printf("\n=== 映射示例 ===\n");
    int doubled[10];
    map(doubled, numbers, count, sizeof(int), double_int, NULL);
    printf("原数组: ");
    for (int i = 0; i < count; i++) printf("%d ", numbers[i]);
    printf("\n翻倍后: ");
    for (int i = 0; i < count; i++) printf("%d ", doubled[i]);
    printf("\n");

    int offset = 100;
    int offset_arr[10];
    map(offset_arr, numbers, count, sizeof(int), add_offset, &offset);
    printf("加 %d 后: ", offset);
    for (int i = 0; i < count; i++) printf("%d ", offset_arr[i]);
    printf("\n");

    printf("\n=== 字符串数组操作 ===\n");
    char* words[] = {"apple", "banana", "cherry", "date", "elderberry"};
    int word_count = sizeof(words) / sizeof(words[0]);
    int index = 0;
    for_each(words, word_count, sizeof(char*), print_string, &index);

    char* search = "an";
    char** found_word = (char**)find_if(words, word_count, sizeof(char*),
                                        string_contains, search);
    if (found_word) {
        printf("第一个包含 '%s' 的单词: %s\n", search, *found_word);
    }

    return 0;
}
```

## 最佳实践

### 使用 typedef 提高可读性

```c
// 不推荐：直接声明函数指针
int (*operation)(int, int);
void (*callbacks[10])(int, void*);

// 推荐：使用 typedef
typedef int (*BinaryOperation)(int, int);
typedef void (*EventCallback)(int, void*);

BinaryOperation operation;
EventCallback callbacks[10];
```

### 始终检查函数指针是否为 NULL

```c
typedef void (*Callback)(void);

void execute_callback(Callback cb) {
    if (cb != NULL) {
        cb();
    } else {
        fprintf(stderr, "错误：回调函数为空\n");
    }
}
```

### 使用明确的函数签名

```c
// 不推荐：使用空参数列表
typedef void (*Handler)();  // 在 C 中表示接受任意参数

// 推荐：明确指定 void
typedef void (*Handler)(void);  // 明确表示无参数
```

### 为回调函数提供用户数据参数

```c
// 不够灵活
typedef void (*SimpleCallback)(int result);

// 更灵活：允许传递用户数据
typedef void (*FlexibleCallback)(int result, void* user_data);

void async_operation(FlexibleCallback callback, void* user_data) {
    int result = 42;  // 某些操作的结果
    if (callback) {
        callback(result, user_data);
    }
}
```

### 使用函数指针表代替 switch-case

```c
// 使用 switch-case
int calculate_switch(int op, int a, int b) {
    switch(op) {
        case 0: return a + b;
        case 1: return a - b;
        case 2: return a * b;
        case 3: return b != 0 ? a / b : 0;
        default: return 0;
    }
}

// 使用函数指针表（更易扩展）
typedef int (*Operation)(int, int);
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }
int div_op(int a, int b) { return b != 0 ? a / b : 0; }

Operation ops[] = {add, sub, mul, div_op};

int calculate_table(int op, int a, int b) {
    if (op >= 0 && op < 4) {
        return ops[op](a, b);
    }
    return 0;
}
```

### 文档化函数指针的契约

```c
/**
 * 比较函数契约：
 * @param a 第一个元素的指针
 * @param b 第二个元素的指针
 * @return 负数表示 a < b，零表示 a == b，正数表示 a > b
 *
 * 注意：比较函数必须满足传递性和反对称性
 */
typedef int (*CompareFunc)(const void* a, const void* b);
```

## 常见陷阱

### 函数指针类型不匹配

```c
#include <stdio.h>

int add(int a, int b) { return a + b; }
double add_double(double a, double b) { return a + b; }

int main() {
    int (*fp)(int, int) = add;      // 正确
    // int (*fp2)(int, int) = add_double;  // 错误：类型不匹配

    // 强制转换可以编译，但行为未定义
    // int (*fp3)(int, int) = (int (*)(int, int))add_double;  // 危险！

    return 0;
}
```

### 忘记函数指针的括号

```c
// 函数指针
int (*fp)(int, int);  // fp 是指向函数的指针

// 返回指针的函数（不是函数指针！）
int *func(int, int);  // func 是返回 int* 的函数
```

### 空函数指针调用

```c
#include <stdio.h>

typedef void (*Callback)(void);

void dangerous_call(Callback cb) {
    cb();  // 如果 cb 为 NULL，会导致段错误
}

void safe_call(Callback cb) {
    if (cb != NULL) {
        cb();
    }
}
```

### 在多线程环境中的竞态条件

```c
#include <stdio.h>
#include <pthread.h>

typedef void (*Handler)(void);
Handler global_handler = NULL;

// 危险：可能存在竞态条件
void set_handler(Handler h) {
    global_handler = h;
}

void call_handler() {
    if (global_handler != NULL) {
        // 在检查和调用之间，另一个线程可能将其设为 NULL
        global_handler();  // 可能崩溃
    }
}

// 更安全的做法：使用局部变量
void safe_call_handler() {
    Handler local = global_handler;  // 原子读取
    if (local != NULL) {
        local();  // 安全
    }
}
```

### 调用约定不匹配（Windows）

```c
// 在 Windows 上，不同的调用约定可能导致问题
#ifdef _WIN32
typedef int (__cdecl *CdeclFunc)(int, int);
typedef int (__stdcall *StdcallFunc)(int, int);

// 混用调用约定会导致栈损坏
#endif
```

### 返回局部函数指针

```c
#include <stdio.h>

typedef int (*Operation)(int);

// 危险：返回指向局部函数的指针（在某些情况下）
Operation get_operation(int type) {
    // 这是安全的，因为函数代码在程序整个生命周期都存在
    if (type == 0) {
        int square(int x) { return x * x; }  // 嵌套函数（GCC扩展）
        // 注意：标准 C 不支持嵌套函数
        // 如果支持，返回这个指针可能是危险的
    }
    return NULL;
}
```

## 性能考量

### 函数指针调用的开销

函数指针调用比直接函数调用稍慢，因为：

1. **无法内联**：编译器通常无法内联函数指针调用
2. **间接跳转**：需要额外的内存访问来获取函数地址
3. **分支预测困难**：CPU 难以预测间接跳转的目标

```c
#include <stdio.h>
#include <time.h>

int add_direct(int a, int b) { return a + b; }

typedef int (*BinaryOp)(int, int);

void benchmark() {
    const int iterations = 100000000;
    int result = 0;
    clock_t start, end;

    // 直接调用
    start = clock();
    for (int i = 0; i < iterations; i++) {
        result += add_direct(i, 1);
    }
    end = clock();
    printf("直接调用: %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);

    // 函数指针调用
    BinaryOp fp = add_direct;
    result = 0;
    start = clock();
    for (int i = 0; i < iterations; i++) {
        result += fp(i, 1);
    }
    end = clock();
    printf("函数指针调用: %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);
}

int main() {
    benchmark();
    return 0;
}
```

### 优化建议

1. **热路径避免使用函数指针**：在性能关键的循环中，考虑使用直接调用

2. **函数指针数组 vs switch**：对于少量选项，switch 可能更快

3. **局部性原则**：将相关的函数指针放在一起，提高缓存命中率

4. **减少间接调用层级**：避免函数指针调用函数指针

```c
// 优化前：多层间接调用
typedef void (*Level2)(void);
typedef void (*Level1)(Level2);

// 优化后：减少间接层级
typedef void (*DirectCallback)(void* context);
```

## 实战场景

### 场景 1：插件系统

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 插件接口定义
typedef struct {
    const char* name;
    const char* version;
    int (*init)(void);
    void (*cleanup)(void);
    int (*execute)(const char* input, char* output, size_t output_size);
} Plugin;

// 插件管理器
#define MAX_PLUGINS 10
Plugin* plugins[MAX_PLUGINS];
int plugin_count = 0;

// 注册插件
int register_plugin(Plugin* plugin) {
    if (plugin_count >= MAX_PLUGINS) {
        return -1;
    }
    plugins[plugin_count++] = plugin;
    printf("注册插件: %s (版本 %s)\n", plugin->name, plugin->version);

    if (plugin->init) {
        return plugin->init();
    }
    return 0;
}

// 执行所有插件
void execute_all_plugins(const char* input) {
    char output[256];

    for (int i = 0; i < plugin_count; i++) {
        if (plugins[i]->execute) {
            plugins[i]->execute(input, output, sizeof(output));
            printf("[%s] 输出: %s\n", plugins[i]->name, output);
        }
    }
}

// 清理所有插件
void cleanup_all_plugins() {
    for (int i = 0; i < plugin_count; i++) {
        if (plugins[i]->cleanup) {
            printf("清理插件: %s\n", plugins[i]->name);
            plugins[i]->cleanup();
        }
    }
}

// 示例插件实现
int uppercase_init(void) {
    printf("  大写转换插件初始化\n");
    return 0;
}

void uppercase_cleanup(void) {
    printf("  大写转换插件清理完成\n");
}

int uppercase_execute(const char* input, char* output, size_t size) {
    size_t i;
    for (i = 0; i < size - 1 && input[i]; i++) {
        output[i] = (input[i] >= 'a' && input[i] <= 'z')
                    ? input[i] - 32 : input[i];
    }
    output[i] = '\0';
    return 0;
}

Plugin uppercase_plugin = {
    .name = "Uppercase",
    .version = "1.0",
    .init = uppercase_init,
    .cleanup = uppercase_cleanup,
    .execute = uppercase_execute
};

// 另一个示例插件
int reverse_execute(const char* input, char* output, size_t size) {
    size_t len = strlen(input);
    size_t copy_len = (len < size - 1) ? len : size - 1;

    for (size_t i = 0; i < copy_len; i++) {
        output[i] = input[copy_len - 1 - i];
    }
    output[copy_len] = '\0';
    return 0;
}

Plugin reverse_plugin = {
    .name = "Reverse",
    .version = "1.0",
    .init = NULL,
    .cleanup = NULL,
    .execute = reverse_execute
};

int main() {
    printf("=== 插件系统演示 ===\n\n");

    // 注册插件
    register_plugin(&uppercase_plugin);
    register_plugin(&reverse_plugin);

    printf("\n=== 执行插件 ===\n");
    execute_all_plugins("Hello, World!");

    printf("\n=== 清理插件 ===\n");
    cleanup_all_plugins();

    return 0;
}
```

### 场景 2：命令解析器

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// 命令处理函数类型
typedef int (*CommandHandler)(int argc, char* argv[]);

// 命令结构
typedef struct {
    const char* name;
    const char* description;
    CommandHandler handler;
} Command;

// 命令处理函数实现
int cmd_help(int argc, char* argv[]);
int cmd_echo(int argc, char* argv[]);
int cmd_add(int argc, char* argv[]);
int cmd_exit(int argc, char* argv[]);

// 命令表
Command commands[] = {
    {"help", "显示帮助信息", cmd_help},
    {"echo", "回显输入的文本", cmd_echo},
    {"add", "将两个数字相加", cmd_add},
    {"exit", "退出程序", cmd_exit},
    {NULL, NULL, NULL}  // 结束标记
};

int cmd_help(int argc, char* argv[]) {
    printf("可用命令:\n");
    for (int i = 0; commands[i].name != NULL; i++) {
        printf("  %-10s - %s\n", commands[i].name, commands[i].description);
    }
    return 0;
}

int cmd_echo(int argc, char* argv[]) {
    for (int i = 1; i < argc; i++) {
        printf("%s ", argv[i]);
    }
    printf("\n");
    return 0;
}

int cmd_add(int argc, char* argv[]) {
    if (argc < 3) {
        printf("用法: add <数字1> <数字2>\n");
        return 1;
    }
    int a = atoi(argv[1]);
    int b = atoi(argv[2]);
    printf("%d + %d = %d\n", a, b, a + b);
    return 0;
}

int cmd_exit(int argc, char* argv[]) {
    printf("再见!\n");
    exit(0);
    return 0;
}

// 查找命令
Command* find_command(const char* name) {
    for (int i = 0; commands[i].name != NULL; i++) {
        if (strcmp(commands[i].name, name) == 0) {
            return &commands[i];
        }
    }
    return NULL;
}

// 解析并执行命令
int execute_command(char* line) {
    char* argv[10];
    int argc = 0;

    // 简单的命令行解析
    char* token = strtok(line, " \t\n");
    while (token != NULL && argc < 10) {
        argv[argc++] = token;
        token = strtok(NULL, " \t\n");
    }

    if (argc == 0) {
        return 0;
    }

    Command* cmd = find_command(argv[0]);
    if (cmd != NULL) {
        return cmd->handler(argc, argv);
    } else {
        printf("未知命令: %s (输入 'help' 查看可用命令)\n", argv[0]);
        return 1;
    }
}

int main() {
    char line[256];

    printf("简易命令解析器 (输入 'help' 查看帮助)\n");

    while (1) {
        printf("> ");
        if (fgets(line, sizeof(line), stdin) == NULL) {
            break;
        }
        execute_command(line);
    }

    return 0;
}
```

### 场景 3：定时器系统

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// 定时器回调类型
typedef void (*TimerCallback)(void* user_data);

// 定时器结构
typedef struct {
    int id;
    int interval_ms;
    int remaining_ms;
    int repeat;
    TimerCallback callback;
    void* user_data;
    int active;
} Timer;

#define MAX_TIMERS 10
Timer timers[MAX_TIMERS];
int timer_count = 0;
int next_timer_id = 1;

// 创建定时器
int create_timer(int interval_ms, int repeat,
                 TimerCallback callback, void* user_data) {
    if (timer_count >= MAX_TIMERS) {
        return -1;
    }

    Timer* t = &timers[timer_count++];
    t->id = next_timer_id++;
    t->interval_ms = interval_ms;
    t->remaining_ms = interval_ms;
    t->repeat = repeat;
    t->callback = callback;
    t->user_data = user_data;
    t->active = 1;

    printf("创建定时器 #%d (间隔: %d ms, 重复: %s)\n",
           t->id, interval_ms, repeat ? "是" : "否");

    return t->id;
}

// 取消定时器
void cancel_timer(int timer_id) {
    for (int i = 0; i < timer_count; i++) {
        if (timers[i].id == timer_id) {
            timers[i].active = 0;
            printf("取消定时器 #%d\n", timer_id);
            return;
        }
    }
}

// 模拟时间推进
void tick(int elapsed_ms) {
    for (int i = 0; i < timer_count; i++) {
        Timer* t = &timers[i];
        if (!t->active) continue;

        t->remaining_ms -= elapsed_ms;

        if (t->remaining_ms <= 0) {
            printf("定时器 #%d 触发\n", t->id);
            if (t->callback) {
                t->callback(t->user_data);
            }

            if (t->repeat) {
                t->remaining_ms = t->interval_ms;
            } else {
                t->active = 0;
            }
        }
    }
}

// 示例回调函数
void heartbeat_callback(void* data) {
    int* count = (int*)data;
    (*count)++;
    printf("  心跳 #%d\n", *count);
}

void timeout_callback(void* data) {
    const char* message = (const char*)data;
    printf("  超时消息: %s\n", message);
}

int main() {
    printf("=== 定时器系统演示 ===\n\n");

    // 创建定时器
    int heartbeat_count = 0;
    create_timer(1000, 1, heartbeat_callback, &heartbeat_count);  // 重复
    create_timer(2500, 0, timeout_callback, "操作完成");  // 一次性

    // 模拟运行 5 秒
    printf("\n模拟运行 5 秒...\n\n");
    for (int t = 0; t < 5000; t += 500) {
        printf("[时间: %d ms]\n", t);
        tick(500);
    }

    printf("\n心跳总次数: %d\n", heartbeat_count);

    return 0;
}
```

## 面试要点

### 什么是函数指针？它的用途是什么？

**答案要点**：
- 函数指针是存储函数地址的指针变量
- 用途包括：回调函数、实现多态、动态加载、状态机、插件系统等
- 函数名本身就是指向函数的地址

### 如何声明和使用函数指针？

```c
// 声明
int (*fp)(int, int);

// 赋值
fp = add;  // 或 fp = &add;

// 调用
int result = fp(3, 4);  // 或 (*fp)(3, 4);
```

### 函数指针和普通指针有什么区别？

**答案要点**：
- 普通指针指向数据，函数指针指向可执行代码
- 函数指针不能进行算术运算
- 函数指针的大小可能与数据指针不同（某些架构）
- 函数指针有更复杂的类型签名

### 实现一个使用函数指针的回调机制

```c
typedef void (*Callback)(int result, void* context);

void async_task(Callback cb, void* context) {
    int result = 42;  // 执行某些操作
    if (cb) {
        cb(result, context);
    }
}

void my_callback(int result, void* context) {
    printf("结果: %d\n", result);
}

int main() {
    async_task(my_callback, NULL);
    return 0;
}
```

### 解释 `qsort` 函数的比较函数参数

```c
void qsort(void *base, size_t nmemb, size_t size,
           int (*compar)(const void *, const void *));
```

**答案要点**：
- 比较函数接受两个 `const void*` 参数
- 返回负数表示第一个参数"小于"第二个
- 返回零表示两个参数"相等"
- 返回正数表示第一个参数"大于"第二个

### 以下代码的输出是什么？

```c
#include <stdio.h>

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

int main() {
    int (*ops[])(int, int) = {add, sub};
    printf("%d\n", ops[0](5, 3) + ops[1](5, 3));
    return 0;
}
```

**答案**：10（即 8 + 2）

### 如何通过函数指针实现简单的多态？

```c
typedef struct {
    void (*speak)(void);
    void (*move)(void);
} Animal;

void dog_speak() { printf("汪汪!\n"); }
void dog_move() { printf("跑\n"); }

void cat_speak() { printf("喵喵!\n"); }
void cat_move() { printf("跳\n"); }

Animal dog = {dog_speak, dog_move};
Animal cat = {cat_speak, cat_move};

void interact(Animal* a) {
    a->speak();
    a->move();
}
```

## 延伸阅读

### 相关概念

1. **虚函数表（vtable）**：C++ 中实现多态的机制，本质上是函数指针数组
2. **跳转表（Jump Table）**：编译器优化 switch-case 的一种方式
3. **中断向量表**：操作系统中存储中断处理函数地址的表
4. **动态链接**：运行时通过函数指针加载和调用共享库函数

### 推荐资源

1. **《C 程序设计语言》（K&R）** - 第 5 章详细讲解指针
2. **《C 和指针》（Kenneth A. Reek）** - 深入探讨指针的各种用法
3. **《深入理解计算机系统》** - 第 3 章讲解函数调用的底层机制
4. **Linux 内核源码** - 大量使用函数指针实现回调和多态

### 进阶主题

1. **setjmp/longjmp**：非局部跳转，与函数指针配合实现协程
2. **信号处理**：使用函数指针注册信号处理器
3. **dlopen/dlsym**：动态加载共享库并获取函数指针
4. **FFI（Foreign Function Interface）**：跨语言函数调用

## 总结

函数指针是 C 语言中最强大的特性之一，掌握它对于编写灵活、可扩展的程序至关重要。

**核心要点回顾**：

1. **基本语法**：理解 `返回类型 (*指针名)(参数类型列表)` 的声明格式
2. **类型安全**：函数指针必须与目标函数的签名匹配
3. **使用 typedef**：简化复杂的函数指针声明
4. **回调机制**：函数指针是实现回调的基础
5. **函数指针数组**：实现跳转表、状态机等高级模式
6. **与 void 指针结合**：实现通用的泛型算法
7. **安全检查**：调用前始终检查函数指针是否为 NULL

**实践建议**：

- 从简单的回调函数开始学习
- 阅读标准库函数（如 `qsort`、`bsearch`）的实现
- 尝试实现状态机、命令解析器等经典模式
- 研究开源项目中函数指针的使用方式
- 注意函数指针的性能开销，在性能关键路径谨慎使用

函数指针是通向底层系统编程和高级 C 编程的大门。熟练掌握这一特性，将使你能够编写出更加灵活、模块化的 C 程序。
