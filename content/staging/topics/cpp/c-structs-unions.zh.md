---
title: C 语言结构体、联合体与枚举
description: 深入理解 C 语言复合数据类型：结构体定义、结构体指针、位域、联合体与枚举
track: cpp
section: basics
difficulty: intermediate
tags:
  - C
  - 结构体
  - 联合体
  - 枚举
  - 位域
  - 内存布局
status: imported
origin: old/src/content/docs/cpp/c-structs-unions.zh.md
divergence: 0.202
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: C 语言
  order: 3
  lastUpdated: 2026-01-07
---

结构体（struct）、联合体（union）和枚举（enum）是 C 语言中三种重要的复合数据类型。它们允许程序员将多个相关数据组织在一起，创建更有意义的数据结构，是构建复杂程序和数据模型的基石。

## 概念解释

### 什么是复合数据类型？

C 语言的基本数据类型（int、char、float 等）只能存储单一类型的值。然而在实际编程中，我们经常需要将多个相关的数据项组合在一起。例如，描述一个学生需要姓名、年龄、成绩等多个属性。复合数据类型就是为了解决这个问题而设计的。

### 三种复合类型的区别

| 特性 | 结构体（struct） | 联合体（union） | 枚举（enum） |
|------|------------------|-----------------|--------------|
| 内存分配 | 所有成员各占独立空间 | 所有成员共享同一空间 | 整型常量集合 |
| 大小 | 所有成员大小之和（含对齐） | 最大成员的大小 | 通常为 int 大小 |
| 同时访问 | 可同时访问所有成员 | 同一时刻只能使用一个成员 | 只表示一个值 |
| 主要用途 | 组织相关数据 | 节省内存、类型转换 | 定义命名常量 |

### 历史背景

结构体的概念可以追溯到早期编程语言 ALGOL 和 COBOL 中的记录（record）类型。C 语言在 1972 年由 Dennis Ritchie 设计时引入了 struct，后来又添加了 union 和 enum，使 C 语言具备了完整的复合数据类型支持。这些特性至今仍是系统编程和嵌入式开发的核心工具。

## 核心原理

### 结构体的内存布局

结构体在内存中按照成员声明的顺序存储，但需要考虑内存对齐：

```
struct Example {
    char a;      // 1 字节
                 // 3 字节填充（对齐到 4 字节边界）
    int b;       // 4 字节
    char c;      // 1 字节
                 // 3 字节填充（对齐到结构体最大对齐要求）
};
// 总大小：12 字节（而非 6 字节）

内存布局：
+---+---+---+---+---+---+---+---+---+---+---+---+
| a | P | P | P |    b    | c | P | P | P |
+---+---+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9  10  11

P = 填充字节
```

### 联合体的内存共享

联合体的所有成员共享同一块内存区域，大小等于最大成员的大小：

```
union Data {
    int i;       // 4 字节
    float f;     // 4 字节
    char str[8]; // 8 字节
};
// 总大小：8 字节（最大成员的大小）

内存布局：
+---+---+---+---+---+---+---+---+
|   i   |       |       |       |  ← int 使用前 4 字节
|   f   |       |       |       |  ← float 使用前 4 字节
|       str         |           |  ← char[8] 使用全部 8 字节
+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7
```

### 枚举的底层表示

枚举本质上是整型常量的集合，编译器通常将其实现为 int 类型：

```c
enum Color { RED, GREEN, BLUE };  // RED=0, GREEN=1, BLUE=2

// 等价于：
#define RED   0
#define GREEN 1
#define BLUE  2
```

## 核心要点

### 结构体要点

1. **声明与定义分离**：可以先声明结构体类型，再定义变量
2. **成员访问**：使用点运算符（.）访问成员，指针使用箭头运算符（->）
3. **内存对齐**：成员按对齐要求排列，可能产生填充字节
4. **自引用**：结构体可以包含指向自身类型的指针（用于链表、树等）
5. **匿名结构体**：C11 支持匿名结构体，可简化嵌套访问

### 联合体要点

1. **内存共享**：所有成员共用同一内存区域
2. **类型双关**：可用于查看同一数据的不同类型表示
3. **节省空间**：适用于互斥数据的存储
4. **标记联合**：常与结构体配合实现带类型标记的联合

### 枚举要点

1. **默认值**：第一个枚举常量默认为 0，后续依次递增
2. **自定义值**：可以为枚举常量指定特定的整数值
3. **类型安全**：虽然本质是整型，但提供了语义上的类型检查
4. **作用域**：枚举常量在声明的作用域内可见

## 代码示例

### 结构体基础

```c
#include <stdio.h>
#include <string.h>

// 结构体定义
struct Student {
    char name[50];
    int age;
    float gpa;
    char grade;
};

// 使用 typedef 简化类型名
typedef struct {
    double x;
    double y;
} Point;

int main() {
    // 方式 1：声明后逐个赋值
    struct Student s1;
    strcpy(s1.name, "Alice");
    s1.age = 20;
    s1.gpa = 3.8;
    s1.grade = 'A';

    // 方式 2：初始化列表
    struct Student s2 = {"Bob", 21, 3.5, 'B'};

    // 方式 3：指定初始化器（C99）
    struct Student s3 = {
        .name = "Charlie",
        .age = 22,
        .gpa = 3.9,
        .grade = 'A'
    };

    // 使用 typedef 定义的结构体
    Point p1 = {3.0, 4.0};
    Point p2 = {.x = 1.0, .y = 2.0};

    // 访问成员
    printf("学生 1: %s, %d 岁, GPA: %.2f\n", s1.name, s1.age, s1.gpa);
    printf("学生 2: %s, %d 岁, GPA: %.2f\n", s2.name, s2.age, s2.gpa);
    printf("点 1: (%.1f, %.1f)\n", p1.x, p1.y);

    // 结构体赋值（浅拷贝）
    struct Student s4 = s2;
    printf("学生 4 (复制自学生 2): %s\n", s4.name);

    return 0;
}
```

### 结构体指针

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[50];
    int age;
    float salary;
} Employee;

// 通过指针修改结构体
void give_raise(Employee *emp, float percent) {
    emp->salary *= (1 + percent / 100);
}

// 通过指针打印结构体
void print_employee(const Employee *emp) {
    printf("姓名: %s\n", emp->name);
    printf("年龄: %d\n", emp->age);
    printf("薪资: %.2f\n", emp->salary);
    printf("---\n");
}

// 动态分配结构体
Employee* create_employee(const char *name, int age, float salary) {
    Employee *emp = (Employee*)malloc(sizeof(Employee));
    if (emp == NULL) {
        return NULL;
    }
    strncpy(emp->name, name, sizeof(emp->name) - 1);
    emp->name[sizeof(emp->name) - 1] = '\0';
    emp->age = age;
    emp->salary = salary;
    return emp;
}

int main() {
    // 栈上的结构体和指针
    Employee emp1 = {"张三", 30, 50000.0};
    Employee *ptr1 = &emp1;

    printf("使用点运算符: %s\n", emp1.name);
    printf("使用箭头运算符: %s\n", ptr1->name);
    printf("等价写法: %s\n", (*ptr1).name);

    // 通过指针修改
    printf("\n加薪前:\n");
    print_employee(ptr1);

    give_raise(ptr1, 10);  // 加薪 10%

    printf("加薪后:\n");
    print_employee(ptr1);

    // 动态分配的结构体
    Employee *emp2 = create_employee("李四", 25, 40000.0);
    if (emp2 != NULL) {
        printf("动态创建的员工:\n");
        print_employee(emp2);
        free(emp2);
    }

    // 结构体数组与指针
    Employee team[3] = {
        {"王五", 28, 45000.0},
        {"赵六", 35, 60000.0},
        {"钱七", 32, 55000.0}
    };

    printf("团队成员:\n");
    for (Employee *p = team; p < team + 3; p++) {
        print_employee(p);
    }

    return 0;
}
```

### 结构体嵌套与自引用

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 嵌套结构体
typedef struct {
    int day;
    int month;
    int year;
} Date;

typedef struct {
    char street[100];
    char city[50];
    char country[50];
    int zipcode;
} Address;

typedef struct {
    char name[50];
    Date birthday;      // 嵌套结构体
    Address address;    // 嵌套结构体
} Person;

// 自引用结构体 - 链表节点
typedef struct Node {
    int data;
    struct Node *next;  // 指向自身类型的指针
} Node;

// 创建新节点
Node* create_node(int data) {
    Node *node = (Node*)malloc(sizeof(Node));
    if (node != NULL) {
        node->data = data;
        node->next = NULL;
    }
    return node;
}

// 打印链表
void print_list(Node *head) {
    printf("链表: ");
    while (head != NULL) {
        printf("%d -> ", head->data);
        head = head->next;
    }
    printf("NULL\n");
}

// 释放链表
void free_list(Node *head) {
    while (head != NULL) {
        Node *temp = head;
        head = head->next;
        free(temp);
    }
}

int main() {
    // 嵌套结构体初始化
    Person person = {
        .name = "John Doe",
        .birthday = {15, 6, 1990},
        .address = {
            .street = "123 Main St",
            .city = "Beijing",
            .country = "China",
            .zipcode = 100000
        }
    };

    printf("姓名: %s\n", person.name);
    printf("生日: %d/%d/%d\n",
           person.birthday.day,
           person.birthday.month,
           person.birthday.year);
    printf("地址: %s, %s, %s %d\n",
           person.address.street,
           person.address.city,
           person.address.country,
           person.address.zipcode);

    // 链表示例
    printf("\n=== 链表示例 ===\n");
    Node *head = create_node(1);
    head->next = create_node(2);
    head->next->next = create_node(3);
    head->next->next->next = create_node(4);

    print_list(head);
    free_list(head);

    return 0;
}
```

### 位域

```c
#include <stdio.h>
#include <stdint.h>

// 位域：精确控制成员占用的位数
typedef struct {
    unsigned int is_active : 1;    // 1 位
    unsigned int priority  : 3;    // 3 位（0-7）
    unsigned int type      : 4;    // 4 位（0-15）
    unsigned int id        : 8;    // 8 位（0-255）
    unsigned int reserved  : 16;   // 16 位保留
} Flags;

// 硬件寄存器模拟
typedef struct {
    uint8_t bit0 : 1;
    uint8_t bit1 : 1;
    uint8_t bit2 : 1;
    uint8_t bit3 : 1;
    uint8_t bit4 : 1;
    uint8_t bit5 : 1;
    uint8_t bit6 : 1;
    uint8_t bit7 : 1;
} RegisterBits;

// 使用联合体实现位操作
typedef union {
    uint8_t byte;
    RegisterBits bits;
} Register;

// TCP 标志位示例
typedef struct {
    uint16_t fin : 1;
    uint16_t syn : 1;
    uint16_t rst : 1;
    uint16_t psh : 1;
    uint16_t ack : 1;
    uint16_t urg : 1;
    uint16_t ece : 1;
    uint16_t cwr : 1;
    uint16_t reserved : 8;
} TCPFlags;

int main() {
    // 基本位域使用
    printf("=== 基本位域 ===\n");
    printf("Flags 大小: %zu 字节\n", sizeof(Flags));

    Flags flags = {0};
    flags.is_active = 1;
    flags.priority = 5;
    flags.type = 10;
    flags.id = 200;

    printf("is_active: %u\n", flags.is_active);
    printf("priority: %u\n", flags.priority);
    printf("type: %u\n", flags.type);
    printf("id: %u\n", flags.id);

    // 位域溢出演示
    flags.priority = 15;  // 只有 3 位，最大值为 7
    printf("priority (溢出后): %u\n", flags.priority);  // 输出 7（15 & 0x7）

    // 寄存器操作
    printf("\n=== 寄存器操作 ===\n");
    Register reg;
    reg.byte = 0;

    // 设置特定位
    reg.bits.bit0 = 1;
    reg.bits.bit3 = 1;
    reg.bits.bit7 = 1;

    printf("寄存器值: 0x%02X (二进制: ", reg.byte);
    for (int i = 7; i >= 0; i--) {
        printf("%d", (reg.byte >> i) & 1);
    }
    printf(")\n");

    // TCP 标志示例
    printf("\n=== TCP 标志 ===\n");
    TCPFlags tcp = {0};
    tcp.syn = 1;  // SYN 握手
    tcp.ack = 1;  // 确认

    printf("TCPFlags 大小: %zu 字节\n", sizeof(TCPFlags));
    printf("SYN: %d, ACK: %d\n", tcp.syn, tcp.ack);

    return 0;
}
```

### 联合体

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>

// 基本联合体
union Data {
    int i;
    float f;
    char str[20];
};

// 类型双关：查看浮点数的二进制表示
union FloatBits {
    float f;
    uint32_t bits;
    struct {
        uint32_t mantissa : 23;
        uint32_t exponent : 8;
        uint32_t sign     : 1;
    } parts;
};

// 网络字节序转换
union IPAddress {
    uint32_t address;
    uint8_t octets[4];
};

// 带标记的联合体（变体类型）
typedef enum {
    TYPE_INT,
    TYPE_FLOAT,
    TYPE_STRING
} ValueType;

typedef struct {
    ValueType type;
    union {
        int i;
        float f;
        char str[32];
    } data;
} Variant;

// 打印 Variant
void print_variant(const Variant *v) {
    switch (v->type) {
        case TYPE_INT:
            printf("整数: %d\n", v->data.i);
            break;
        case TYPE_FLOAT:
            printf("浮点: %.2f\n", v->data.f);
            break;
        case TYPE_STRING:
            printf("字符串: %s\n", v->data.str);
            break;
    }
}

int main() {
    // 基本联合体使用
    printf("=== 基本联合体 ===\n");
    printf("union Data 大小: %zu 字节\n", sizeof(union Data));

    union Data data;

    data.i = 42;
    printf("data.i = %d\n", data.i);

    data.f = 3.14159;
    printf("data.f = %.5f\n", data.f);
    printf("data.i (覆盖后) = %d\n", data.i);  // 值被覆盖

    strcpy(data.str, "Hello");
    printf("data.str = %s\n", data.str);

    // 类型双关
    printf("\n=== 浮点数二进制表示 ===\n");
    union FloatBits fb;
    fb.f = 3.14159f;

    printf("浮点值: %.5f\n", fb.f);
    printf("十六进制: 0x%08X\n", fb.bits);
    printf("符号位: %u\n", fb.parts.sign);
    printf("指数: %u (偏移后: %d)\n", fb.parts.exponent, fb.parts.exponent - 127);
    printf("尾数: 0x%06X\n", fb.parts.mantissa);

    // IP 地址转换
    printf("\n=== IP 地址转换 ===\n");
    union IPAddress ip;
    ip.octets[0] = 192;
    ip.octets[1] = 168;
    ip.octets[2] = 1;
    ip.octets[3] = 100;

    printf("IP 地址: %d.%d.%d.%d\n",
           ip.octets[0], ip.octets[1], ip.octets[2], ip.octets[3]);
    printf("32位表示: 0x%08X (%u)\n", ip.address, ip.address);

    // 带标记的联合体
    printf("\n=== 带标记的联合体 ===\n");
    Variant v1 = {TYPE_INT, .data.i = 100};
    Variant v2 = {TYPE_FLOAT, .data.f = 2.718};
    Variant v3 = {TYPE_STRING};
    strcpy(v3.data.str, "Hello World");

    print_variant(&v1);
    print_variant(&v2);
    print_variant(&v3);

    printf("\nVariant 大小: %zu 字节\n", sizeof(Variant));

    return 0;
}
```

### 枚举

```c
#include <stdio.h>
#include <string.h>

// 基本枚举
enum Color {
    RED,        // 0
    GREEN,      // 1
    BLUE        // 2
};

// 指定值的枚举
enum HttpStatus {
    HTTP_OK = 200,
    HTTP_CREATED = 201,
    HTTP_ACCEPTED = 202,
    HTTP_BAD_REQUEST = 400,
    HTTP_UNAUTHORIZED = 401,
    HTTP_FORBIDDEN = 403,
    HTTP_NOT_FOUND = 404,
    HTTP_INTERNAL_ERROR = 500
};

// 位标志枚举
enum Permission {
    PERM_NONE    = 0,
    PERM_READ    = 1 << 0,  // 0001
    PERM_WRITE   = 1 << 1,  // 0010
    PERM_EXECUTE = 1 << 2,  // 0100
    PERM_DELETE  = 1 << 3,  // 1000
    PERM_ALL     = PERM_READ | PERM_WRITE | PERM_EXECUTE | PERM_DELETE
};

// 状态机枚举
typedef enum {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_PAUSED,
    STATE_STOPPED,
    STATE_ERROR
} MachineState;

// 枚举转字符串
const char* color_to_string(enum Color c) {
    switch (c) {
        case RED:   return "红色";
        case GREEN: return "绿色";
        case BLUE:  return "蓝色";
        default:    return "未知";
    }
}

const char* state_to_string(MachineState state) {
    static const char* names[] = {
        "空闲", "运行中", "暂停", "停止", "错误"
    };
    if (state >= 0 && state <= STATE_ERROR) {
        return names[state];
    }
    return "未知";
}

// 权限检查
int has_permission(int user_perms, enum Permission required) {
    return (user_perms & required) == required;
}

void print_permissions(int perms) {
    printf("权限: ");
    if (perms & PERM_READ)    printf("读 ");
    if (perms & PERM_WRITE)   printf("写 ");
    if (perms & PERM_EXECUTE) printf("执行 ");
    if (perms & PERM_DELETE)  printf("删除 ");
    if (perms == PERM_NONE)   printf("无");
    printf("\n");
}

int main() {
    // 基本枚举使用
    printf("=== 基本枚举 ===\n");
    enum Color c = GREEN;
    printf("颜色: %s (值: %d)\n", color_to_string(c), c);

    // 枚举大小
    printf("enum Color 大小: %zu 字节\n", sizeof(enum Color));

    // HTTP 状态码
    printf("\n=== HTTP 状态码 ===\n");
    enum HttpStatus status = HTTP_OK;
    printf("状态: %d\n", status);

    status = HTTP_NOT_FOUND;
    if (status >= 400 && status < 500) {
        printf("客户端错误: %d\n", status);
    }

    // 位标志
    printf("\n=== 位标志权限 ===\n");
    int admin_perms = PERM_ALL;
    int user_perms = PERM_READ | PERM_WRITE;
    int guest_perms = PERM_READ;

    printf("管理员 ");
    print_permissions(admin_perms);

    printf("普通用户 ");
    print_permissions(user_perms);

    printf("访客 ");
    print_permissions(guest_perms);

    // 权限检查
    printf("\n普通用户可以写入? %s\n",
           has_permission(user_perms, PERM_WRITE) ? "是" : "否");
    printf("访客可以写入? %s\n",
           has_permission(guest_perms, PERM_WRITE) ? "是" : "否");

    // 状态机
    printf("\n=== 状态机 ===\n");
    MachineState state = STATE_IDLE;
    printf("当前状态: %s\n", state_to_string(state));

    state = STATE_RUNNING;
    printf("当前状态: %s\n", state_to_string(state));

    // switch 与枚举
    switch (state) {
        case STATE_IDLE:
            printf("机器空闲\n");
            break;
        case STATE_RUNNING:
            printf("机器运行中\n");
            break;
        case STATE_PAUSED:
            printf("机器暂停\n");
            break;
        case STATE_STOPPED:
            printf("机器停止\n");
            break;
        case STATE_ERROR:
            printf("机器错误\n");
            break;
    }

    return 0;
}
```

### 综合示例：配置系统

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 配置项类型
typedef enum {
    CONFIG_TYPE_INT,
    CONFIG_TYPE_FLOAT,
    CONFIG_TYPE_STRING,
    CONFIG_TYPE_BOOL
} ConfigType;

// 配置值（带标记的联合体）
typedef struct {
    char key[64];
    ConfigType type;
    union {
        int int_val;
        float float_val;
        char string_val[256];
        int bool_val;  // 0 或 1
    } value;
} ConfigItem;

// 配置管理器
typedef struct {
    ConfigItem *items;
    size_t count;
    size_t capacity;
} ConfigManager;

// 创建配置管理器
ConfigManager* config_create(void) {
    ConfigManager *cm = (ConfigManager*)malloc(sizeof(ConfigManager));
    if (cm == NULL) return NULL;

    cm->capacity = 16;
    cm->count = 0;
    cm->items = (ConfigItem*)malloc(sizeof(ConfigItem) * cm->capacity);

    if (cm->items == NULL) {
        free(cm);
        return NULL;
    }

    return cm;
}

// 查找配置项
ConfigItem* config_find(ConfigManager *cm, const char *key) {
    for (size_t i = 0; i < cm->count; i++) {
        if (strcmp(cm->items[i].key, key) == 0) {
            return &cm->items[i];
        }
    }
    return NULL;
}

// 添加或更新配置项
int config_add_item(ConfigManager *cm, ConfigItem *item) {
    // 检查是否已存在
    ConfigItem *existing = config_find(cm, item->key);
    if (existing != NULL) {
        *existing = *item;
        return 0;
    }

    // 扩容
    if (cm->count >= cm->capacity) {
        size_t new_capacity = cm->capacity * 2;
        ConfigItem *new_items = (ConfigItem*)realloc(
            cm->items, sizeof(ConfigItem) * new_capacity);
        if (new_items == NULL) return -1;
        cm->items = new_items;
        cm->capacity = new_capacity;
    }

    cm->items[cm->count++] = *item;
    return 0;
}

// 便捷设置函数
void config_set_int(ConfigManager *cm, const char *key, int value) {
    ConfigItem item = {0};
    strncpy(item.key, key, sizeof(item.key) - 1);
    item.type = CONFIG_TYPE_INT;
    item.value.int_val = value;
    config_add_item(cm, &item);
}

void config_set_float(ConfigManager *cm, const char *key, float value) {
    ConfigItem item = {0};
    strncpy(item.key, key, sizeof(item.key) - 1);
    item.type = CONFIG_TYPE_FLOAT;
    item.value.float_val = value;
    config_add_item(cm, &item);
}

void config_set_string(ConfigManager *cm, const char *key, const char *value) {
    ConfigItem item = {0};
    strncpy(item.key, key, sizeof(item.key) - 1);
    item.type = CONFIG_TYPE_STRING;
    strncpy(item.value.string_val, value, sizeof(item.value.string_val) - 1);
    config_add_item(cm, &item);
}

void config_set_bool(ConfigManager *cm, const char *key, int value) {
    ConfigItem item = {0};
    strncpy(item.key, key, sizeof(item.key) - 1);
    item.type = CONFIG_TYPE_BOOL;
    item.value.bool_val = value ? 1 : 0;
    config_add_item(cm, &item);
}

// 打印配置项
void config_print_item(const ConfigItem *item) {
    printf("  %s = ", item->key);
    switch (item->type) {
        case CONFIG_TYPE_INT:
            printf("%d (int)\n", item->value.int_val);
            break;
        case CONFIG_TYPE_FLOAT:
            printf("%.2f (float)\n", item->value.float_val);
            break;
        case CONFIG_TYPE_STRING:
            printf("\"%s\" (string)\n", item->value.string_val);
            break;
        case CONFIG_TYPE_BOOL:
            printf("%s (bool)\n", item->value.bool_val ? "true" : "false");
            break;
    }
}

// 打印所有配置
void config_print_all(const ConfigManager *cm) {
    printf("配置项 (%zu 个):\n", cm->count);
    for (size_t i = 0; i < cm->count; i++) {
        config_print_item(&cm->items[i]);
    }
}

// 销毁配置管理器
void config_destroy(ConfigManager *cm) {
    if (cm != NULL) {
        free(cm->items);
        free(cm);
    }
}

int main() {
    ConfigManager *config = config_create();
    if (config == NULL) {
        fprintf(stderr, "无法创建配置管理器\n");
        return 1;
    }

    // 设置配置项
    config_set_string(config, "app.name", "MyApplication");
    config_set_string(config, "app.version", "1.0.0");
    config_set_int(config, "server.port", 8080);
    config_set_string(config, "server.host", "localhost");
    config_set_int(config, "server.max_connections", 100);
    config_set_float(config, "server.timeout", 30.5);
    config_set_bool(config, "debug.enabled", 1);
    config_set_bool(config, "debug.verbose", 0);

    // 打印所有配置
    config_print_all(config);

    // 查找并修改配置
    printf("\n修改 server.port...\n");
    config_set_int(config, "server.port", 9090);

    ConfigItem *item = config_find(config, "server.port");
    if (item != NULL) {
        printf("新的 ");
        config_print_item(item);
    }

    // 清理
    config_destroy(config);

    return 0;
}
```

## 最佳实践

### 结构体设计原则

```c
#include <stdio.h>
#include <stddef.h>

// 1. 合理排列成员以减少填充
// 不推荐：浪费空间
struct BadLayout {
    char a;      // 1 + 7 填充
    double b;    // 8
    char c;      // 1 + 3 填充
    int d;       // 4
};  // 总共 24 字节

// 推荐：紧凑布局
struct GoodLayout {
    double b;    // 8
    int d;       // 4
    char a;      // 1
    char c;      // 1 + 2 填充
};  // 总共 16 字节

// 2. 使用 typedef 简化类型名
typedef struct Point {
    double x;
    double y;
} Point;

// 3. 提供初始化函数
Point point_create(double x, double y) {
    Point p = {x, y};
    return p;
}

// 4. 使用 const 保护只读数据
void point_print(const Point *p) {
    printf("(%.2f, %.2f)\n", p->x, p->y);
}

// 5. 不透明指针模式（隐藏实现细节）
// 头文件中：
// typedef struct Context Context;
// Context* context_create(void);
// void context_destroy(Context *ctx);

int main() {
    printf("BadLayout 大小: %zu 字节\n", sizeof(struct BadLayout));
    printf("GoodLayout 大小: %zu 字节\n", sizeof(struct GoodLayout));

    Point p = point_create(3.0, 4.0);
    point_print(&p);

    return 0;
}
```

### 联合体使用建议

```c
#include <stdio.h>
#include <string.h>
#include <assert.h>

// 1. 始终使用标记联合体
typedef enum { INT, FLOAT, STRING } DataType;

typedef struct {
    DataType type;  // 类型标记
    union {
        int i;
        float f;
        char s[32];
    } data;
} SafeVariant;

// 安全访问函数
int safe_get_int(const SafeVariant *v, int *out) {
    if (v->type != INT) return -1;
    *out = v->data.i;
    return 0;
}

// 2. 文档化联合体的使用约定
/*
 * union Message 使用约定：
 * - 当 header.type == MSG_TEXT 时，访问 text_msg
 * - 当 header.type == MSG_IMAGE 时，访问 image_msg
 * - 永远不要同时访问多个成员
 */

// 3. 使用静态断言验证大小假设
typedef union {
    int i;
    float f;
} IntFloat;

// C11 静态断言
_Static_assert(sizeof(IntFloat) == sizeof(int),
               "IntFloat should be the size of int");

int main() {
    SafeVariant v = {INT, .data.i = 42};

    int value;
    if (safe_get_int(&v, &value) == 0) {
        printf("值: %d\n", value);
    }

    return 0;
}
```

### 枚举使用规范

```c
#include <stdio.h>

// 1. 使用有意义的前缀
typedef enum {
    COLOR_RED,
    COLOR_GREEN,
    COLOR_BLUE,
    COLOR_COUNT  // 常用技巧：获取枚举数量
} Color;

// 2. 为枚举提供字符串转换
const char* const COLOR_NAMES[] = {
    [COLOR_RED]   = "红色",
    [COLOR_GREEN] = "绿色",
    [COLOR_BLUE]  = "蓝色"
};

const char* color_name(Color c) {
    if (c >= 0 && c < COLOR_COUNT) {
        return COLOR_NAMES[c];
    }
    return "未知";
}

// 3. 位标志使用大写和移位
typedef enum {
    FLAG_NONE     = 0,
    FLAG_READABLE = 1 << 0,
    FLAG_WRITABLE = 1 << 1,
    FLAG_HIDDEN   = 1 << 2
} FileFlags;

// 4. 显式指定重要的值
typedef enum {
    ERROR_SUCCESS = 0,
    ERROR_NOT_FOUND = -1,
    ERROR_INVALID = -2,
    ERROR_TIMEOUT = -3
} ErrorCode;

// 5. 在 switch 中处理所有情况
void handle_color(Color c) {
    switch (c) {
        case COLOR_RED:
            printf("处理红色\n");
            break;
        case COLOR_GREEN:
            printf("处理绿色\n");
            break;
        case COLOR_BLUE:
            printf("处理蓝色\n");
            break;
        case COLOR_COUNT:
            // 不应该到达这里
            break;
        // 不需要 default，编译器会警告遗漏的情况
    }
}

int main() {
    for (int i = 0; i < COLOR_COUNT; i++) {
        printf("颜色 %d: %s\n", i, color_name(i));
    }

    FileFlags flags = FLAG_READABLE | FLAG_WRITABLE;
    printf("文件权限: 0x%X\n", flags);

    return 0;
}
```

## 常见陷阱

### 陷阱 1：结构体指针与成员访问

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int x;
    int y;
} Point;

void trap_pointer_access(void) {
    Point *p = NULL;

    // 错误：解引用空指针
    // printf("x = %d\n", p->x);  // 崩溃！

    // 正确：先检查指针
    if (p != NULL) {
        printf("x = %d\n", p->x);
    } else {
        printf("指针为空\n");
    }

    // 动态分配后忘记初始化
    p = (Point*)malloc(sizeof(Point));
    if (p != NULL) {
        // p->x 和 p->y 包含垃圾值！
        // printf("未初始化: x = %d\n", p->x);  // 未定义行为

        // 正确：初始化后使用
        p->x = 0;
        p->y = 0;
        printf("初始化后: x = %d\n", p->x);
        free(p);
    }
}

int main() {
    trap_pointer_access();
    return 0;
}
```

### 陷阱 2：结构体浅拷贝

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char *name;  // 指向堆内存
    int age;
} Person;

void shallow_copy_trap(void) {
    // 创建原始对象
    Person p1;
    p1.name = (char*)malloc(50);
    strcpy(p1.name, "Alice");
    p1.age = 25;

    // 浅拷贝：只复制指针值，不复制指向的数据
    Person p2 = p1;

    printf("p1.name: %s (地址: %p)\n", p1.name, (void*)p1.name);
    printf("p2.name: %s (地址: %p)\n", p2.name, (void*)p2.name);
    // 两个指针指向同一块内存！

    // 修改 p2 会影响 p1
    strcpy(p2.name, "Bob");
    printf("修改 p2 后:\n");
    printf("p1.name: %s\n", p1.name);  // 也变成 "Bob"！

    // 危险：释放一个后另一个成为悬空指针
    free(p1.name);
    // p2.name 现在是悬空指针！
    // free(p2.name);  // 双重释放！
}

// 正确做法：实现深拷贝
Person deep_copy(const Person *src) {
    Person dst;
    dst.age = src->age;

    if (src->name != NULL) {
        dst.name = (char*)malloc(strlen(src->name) + 1);
        if (dst.name != NULL) {
            strcpy(dst.name, src->name);
        }
    } else {
        dst.name = NULL;
    }

    return dst;
}

int main() {
    printf("=== 浅拷贝陷阱演示 ===\n");
    shallow_copy_trap();

    printf("\n=== 深拷贝正确做法 ===\n");
    Person p1 = {.name = (char*)malloc(50), .age = 30};
    strcpy(p1.name, "Charlie");

    Person p2 = deep_copy(&p1);

    printf("p1.name: %s (地址: %p)\n", p1.name, (void*)p1.name);
    printf("p2.name: %s (地址: %p)\n", p2.name, (void*)p2.name);

    // 现在可以安全地独立释放
    free(p1.name);
    free(p2.name);

    return 0;
}
```

### 陷阱 3：联合体成员访问错误

```c
#include <stdio.h>
#include <string.h>

typedef union {
    int i;
    float f;
    char str[20];
} Data;

void union_access_trap(void) {
    Data d;

    // 设置为浮点数
    d.f = 3.14159f;

    // 错误：读取错误类型的成员
    printf("作为 float: %.5f\n", d.f);
    printf("作为 int (错误解释): %d\n", d.i);  // 垃圾值！

    // 设置字符串
    strcpy(d.str, "Hello");

    // 错误：之前的 float 值已被覆盖
    printf("作为 string: %s\n", d.str);
    printf("作为 float (已覆盖): %.5f\n", d.f);  // 垃圾值！
}

// 正确做法：使用标记联合体
typedef enum { TYPE_INT, TYPE_FLOAT, TYPE_STRING } DataType;

typedef struct {
    DataType type;
    union {
        int i;
        float f;
        char str[20];
    } value;
} TaggedUnion;

void safe_print(const TaggedUnion *tu) {
    switch (tu->type) {
        case TYPE_INT:
            printf("整数: %d\n", tu->value.i);
            break;
        case TYPE_FLOAT:
            printf("浮点: %.5f\n", tu->value.f);
            break;
        case TYPE_STRING:
            printf("字符串: %s\n", tu->value.str);
            break;
    }
}

int main() {
    printf("=== 联合体访问陷阱 ===\n");
    union_access_trap();

    printf("\n=== 安全的标记联合体 ===\n");
    TaggedUnion tu1 = {TYPE_INT, .value.i = 42};
    TaggedUnion tu2 = {TYPE_FLOAT, .value.f = 3.14159f};
    TaggedUnion tu3 = {TYPE_STRING};
    strcpy(tu3.value.str, "Hello");

    safe_print(&tu1);
    safe_print(&tu2);
    safe_print(&tu3);

    return 0;
}
```

### 陷阱 4：位域的可移植性问题

```c
#include <stdio.h>
#include <stdint.h>

// 警告：位域的内存布局依赖于编译器和平台
typedef struct {
    unsigned int a : 4;
    unsigned int b : 4;
    unsigned int c : 8;
} BitfieldExample;

void bitfield_portability(void) {
    BitfieldExample bf = {0xA, 0xB, 0xCD};

    printf("a = 0x%X\n", bf.a);
    printf("b = 0x%X\n", bf.b);
    printf("c = 0x%X\n", bf.c);

    // 不同编译器可能有不同的内存布局！
    // 不要假设位域的具体布局

    // 如果需要精确控制，使用位操作代替位域
}

// 可移植的替代方案
typedef struct {
    uint16_t data;
} PortableBitfield;

#define GET_A(x) ((x).data & 0x0F)
#define GET_B(x) (((x).data >> 4) & 0x0F)
#define GET_C(x) (((x).data >> 8) & 0xFF)

#define SET_A(x, v) ((x).data = ((x).data & ~0x0F) | ((v) & 0x0F))
#define SET_B(x, v) ((x).data = ((x).data & ~0xF0) | (((v) & 0x0F) << 4))
#define SET_C(x, v) ((x).data = ((x).data & ~0xFF00) | (((v) & 0xFF) << 8))

int main() {
    printf("=== 位域可移植性 ===\n");
    bitfield_portability();

    printf("\n=== 可移植的位操作 ===\n");
    PortableBitfield pbf = {0};
    SET_A(pbf, 0xA);
    SET_B(pbf, 0xB);
    SET_C(pbf, 0xCD);

    printf("a = 0x%X\n", GET_A(pbf));
    printf("b = 0x%X\n", GET_B(pbf));
    printf("c = 0x%X\n", GET_C(pbf));
    printf("data = 0x%04X\n", pbf.data);

    return 0;
}
```

### 陷阱 5：柔性数组成员

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// C99 柔性数组成员
typedef struct {
    int length;
    char data[];  // 柔性数组成员，必须是最后一个成员
} FlexArray;

void flexible_array_demo(void) {
    // 错误：不能在栈上分配柔性数组
    // FlexArray fa;  // data 大小为 0！

    // 正确：使用 malloc 分配足够空间
    int data_size = 10;
    FlexArray *fa = malloc(sizeof(FlexArray) + data_size * sizeof(char));

    if (fa == NULL) return;

    fa->length = data_size;
    memset(fa->data, 'A', data_size);

    printf("长度: %d\n", fa->length);
    printf("数据: ");
    for (int i = 0; i < fa->length; i++) {
        printf("%c", fa->data[i]);
    }
    printf("\n");

    // 注意：sizeof(FlexArray) 不包含 data
    printf("sizeof(FlexArray) = %zu\n", sizeof(FlexArray));
    printf("实际分配: %zu\n", sizeof(FlexArray) + data_size);

    free(fa);
}

// 旧式变长结构（不推荐，但常见于旧代码）
typedef struct {
    int length;
    char data[1];  // "结构体黑客"
} OldStyleFlexArray;

int main() {
    flexible_array_demo();
    return 0;
}
```

## 性能考量

### 内存对齐与缓存

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stddef.h>

// 缓存不友好的布局
typedef struct {
    char flag;           // 1 字节
    double value;        // 8 字节
    char status;         // 1 字节
    long data;           // 8 字节
} CacheUnfriendly;

// 缓存友好的布局
typedef struct {
    double value;        // 8 字节
    long data;           // 8 字节
    char flag;           // 1 字节
    char status;         // 1 字节
} CacheFriendly;

#define ARRAY_SIZE 1000000
#define ITERATIONS 100

void benchmark_access(void) {
    printf("CacheUnfriendly 大小: %zu 字节\n", sizeof(CacheUnfriendly));
    printf("CacheFriendly 大小: %zu 字节\n", sizeof(CacheFriendly));

    CacheUnfriendly *unfriendly = malloc(ARRAY_SIZE * sizeof(CacheUnfriendly));
    CacheFriendly *friendly = malloc(ARRAY_SIZE * sizeof(CacheFriendly));

    if (!unfriendly || !friendly) {
        printf("内存分配失败\n");
        return;
    }

    // 初始化
    for (int i = 0; i < ARRAY_SIZE; i++) {
        unfriendly[i].value = i * 1.0;
        unfriendly[i].data = i;
        friendly[i].value = i * 1.0;
        friendly[i].data = i;
    }

    clock_t start, end;
    double sum = 0;

    // 测试缓存不友好的结构
    start = clock();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        sum = 0;
        for (int i = 0; i < ARRAY_SIZE; i++) {
            sum += unfriendly[i].value;
        }
    }
    end = clock();
    printf("CacheUnfriendly 访问时间: %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);

    // 测试缓存友好的结构
    start = clock();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        sum = 0;
        for (int i = 0; i < ARRAY_SIZE; i++) {
            sum += friendly[i].value;
        }
    }
    end = clock();
    printf("CacheFriendly 访问时间: %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);

    free(unfriendly);
    free(friendly);
}

int main() {
    benchmark_access();
    return 0;
}
```

### 结构体数组 vs 数组结构体

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define SIZE 1000000

// 数组结构体（AoS - Array of Structures）
typedef struct {
    float x, y, z;
} Point3D;

// 结构体数组（SoA - Structure of Arrays）
typedef struct {
    float *x, *y, *z;
} Points3D;

Points3D create_points(int n) {
    Points3D p;
    p.x = malloc(n * sizeof(float));
    p.y = malloc(n * sizeof(float));
    p.z = malloc(n * sizeof(float));
    return p;
}

void free_points(Points3D *p) {
    free(p->x);
    free(p->y);
    free(p->z);
}

void benchmark_aos_vs_soa(void) {
    clock_t start, end;
    float sum;

    // AoS
    Point3D *aos = malloc(SIZE * sizeof(Point3D));
    for (int i = 0; i < SIZE; i++) {
        aos[i].x = i * 0.1f;
        aos[i].y = i * 0.2f;
        aos[i].z = i * 0.3f;
    }

    start = clock();
    sum = 0;
    for (int iter = 0; iter < 100; iter++) {
        for (int i = 0; i < SIZE; i++) {
            sum += aos[i].x;  // 只访问 x，但会加载整个结构
        }
    }
    end = clock();
    printf("AoS 只访问 x: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    // SoA
    Points3D soa = create_points(SIZE);
    for (int i = 0; i < SIZE; i++) {
        soa.x[i] = i * 0.1f;
        soa.y[i] = i * 0.2f;
        soa.z[i] = i * 0.3f;
    }

    start = clock();
    sum = 0;
    for (int iter = 0; iter < 100; iter++) {
        for (int i = 0; i < SIZE; i++) {
            sum += soa.x[i];  // 连续访问，缓存友好
        }
    }
    end = clock();
    printf("SoA 只访问 x: %.3f 秒\n", (double)(end - start) / CLOCKS_PER_SEC);

    free(aos);
    free_points(&soa);

    printf("\nAoS 适用于：经常需要访问结构的多个成员\n");
    printf("SoA 适用于：主要访问单个成员，或需要 SIMD 优化\n");
}

int main() {
    benchmark_aos_vs_soa();
    return 0;
}
```

### 使用联合体节省内存

```c
#include <stdio.h>
#include <string.h>

// 不使用联合体：浪费空间
typedef struct {
    int type;
    int int_value;
    float float_value;
    char string_value[64];
} WasteSpace;

// 使用联合体：节省空间
typedef struct {
    int type;
    union {
        int int_value;
        float float_value;
        char string_value[64];
    } data;
} SaveSpace;

int main() {
    printf("WasteSpace 大小: %zu 字节\n", sizeof(WasteSpace));
    printf("SaveSpace 大小: %zu 字节\n", sizeof(SaveSpace));
    printf("节省: %zu 字节 (%.1f%%)\n",
           sizeof(WasteSpace) - sizeof(SaveSpace),
           (1.0 - (double)sizeof(SaveSpace) / sizeof(WasteSpace)) * 100);

    return 0;
}
```

## 实战场景

### 场景 1：网络协议解析

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <arpa/inet.h>

// IP 数据包头部结构
typedef struct {
    uint8_t  version_ihl;      // 版本(4位) + 头部长度(4位)
    uint8_t  tos;              // 服务类型
    uint16_t total_length;     // 总长度
    uint16_t identification;   // 标识
    uint16_t flags_fragment;   // 标志(3位) + 片偏移(13位)
    uint8_t  ttl;              // 生存时间
    uint8_t  protocol;         // 协议
    uint16_t header_checksum;  // 头部校验和
    uint32_t src_addr;         // 源地址
    uint32_t dst_addr;         // 目标地址
} __attribute__((packed)) IPHeader;

// 解析 IP 地址
void ip_to_string(uint32_t ip, char *buf, size_t size) {
    uint8_t *bytes = (uint8_t*)&ip;
    snprintf(buf, size, "%d.%d.%d.%d",
             bytes[0], bytes[1], bytes[2], bytes[3]);
}

// 解析 IP 头部
void parse_ip_header(const uint8_t *data) {
    const IPHeader *header = (const IPHeader*)data;

    int version = (header->version_ihl >> 4) & 0x0F;
    int ihl = header->version_ihl & 0x0F;

    char src_str[16], dst_str[16];
    ip_to_string(header->src_addr, src_str, sizeof(src_str));
    ip_to_string(header->dst_addr, dst_str, sizeof(dst_str));

    printf("=== IP 头部解析 ===\n");
    printf("版本: IPv%d\n", version);
    printf("头部长度: %d 字节\n", ihl * 4);
    printf("总长度: %d 字节\n", ntohs(header->total_length));
    printf("TTL: %d\n", header->ttl);
    printf("协议: %d", header->protocol);
    switch (header->protocol) {
        case 1:  printf(" (ICMP)\n"); break;
        case 6:  printf(" (TCP)\n"); break;
        case 17: printf(" (UDP)\n"); break;
        default: printf("\n"); break;
    }
    printf("源地址: %s\n", src_str);
    printf("目标地址: %s\n", dst_str);
}

int main() {
    // 模拟 IP 数据包
    uint8_t packet[] = {
        0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00,
        0x40, 0x06, 0x00, 0x00, 0xc0, 0xa8, 0x01, 0x01,
        0xc0, 0xa8, 0x01, 0x02
    };

    printf("IPHeader 大小: %zu 字节\n\n", sizeof(IPHeader));
    parse_ip_header(packet);

    return 0;
}
```

### 场景 2：简单的 JSON 值表示

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// JSON 值类型
typedef enum {
    JSON_NULL,
    JSON_BOOL,
    JSON_NUMBER,
    JSON_STRING,
    JSON_ARRAY,
    JSON_OBJECT
} JsonType;

// 前向声明
typedef struct JsonValue JsonValue;
typedef struct JsonArray JsonArray;
typedef struct JsonObject JsonObject;

// JSON 数组
struct JsonArray {
    JsonValue *items;
    size_t count;
    size_t capacity;
};

// JSON 对象键值对
typedef struct {
    char *key;
    JsonValue *value;
} JsonPair;

// JSON 对象
struct JsonObject {
    JsonPair *pairs;
    size_t count;
    size_t capacity;
};

// JSON 值
struct JsonValue {
    JsonType type;
    union {
        int bool_val;
        double number_val;
        char *string_val;
        JsonArray *array_val;
        JsonObject *object_val;
    } data;
};

// 创建函数
JsonValue* json_null(void) {
    JsonValue *v = malloc(sizeof(JsonValue));
    if (v) v->type = JSON_NULL;
    return v;
}

JsonValue* json_bool(int val) {
    JsonValue *v = malloc(sizeof(JsonValue));
    if (v) {
        v->type = JSON_BOOL;
        v->data.bool_val = val ? 1 : 0;
    }
    return v;
}

JsonValue* json_number(double val) {
    JsonValue *v = malloc(sizeof(JsonValue));
    if (v) {
        v->type = JSON_NUMBER;
        v->data.number_val = val;
    }
    return v;
}

JsonValue* json_string(const char *val) {
    JsonValue *v = malloc(sizeof(JsonValue));
    if (v) {
        v->type = JSON_STRING;
        v->data.string_val = strdup(val);
    }
    return v;
}

// 打印 JSON 值
void json_print(const JsonValue *v, int indent);

void json_print_indent(int indent) {
    for (int i = 0; i < indent; i++) printf("  ");
}

void json_print(const JsonValue *v, int indent) {
    if (v == NULL) {
        printf("null");
        return;
    }

    switch (v->type) {
        case JSON_NULL:
            printf("null");
            break;
        case JSON_BOOL:
            printf("%s", v->data.bool_val ? "true" : "false");
            break;
        case JSON_NUMBER:
            printf("%g", v->data.number_val);
            break;
        case JSON_STRING:
            printf("\"%s\"", v->data.string_val);
            break;
        case JSON_ARRAY:
            printf("[\n");
            for (size_t i = 0; i < v->data.array_val->count; i++) {
                json_print_indent(indent + 1);
                json_print(&v->data.array_val->items[i], indent + 1);
                if (i < v->data.array_val->count - 1) printf(",");
                printf("\n");
            }
            json_print_indent(indent);
            printf("]");
            break;
        case JSON_OBJECT:
            printf("{\n");
            for (size_t i = 0; i < v->data.object_val->count; i++) {
                json_print_indent(indent + 1);
                printf("\"%s\": ", v->data.object_val->pairs[i].key);
                json_print(v->data.object_val->pairs[i].value, indent + 1);
                if (i < v->data.object_val->count - 1) printf(",");
                printf("\n");
            }
            json_print_indent(indent);
            printf("}");
            break;
    }
}

// 释放 JSON 值
void json_free(JsonValue *v) {
    if (v == NULL) return;

    switch (v->type) {
        case JSON_STRING:
            free(v->data.string_val);
            break;
        case JSON_ARRAY:
            for (size_t i = 0; i < v->data.array_val->count; i++) {
                // 递归释放（简化版本）
            }
            free(v->data.array_val->items);
            free(v->data.array_val);
            break;
        case JSON_OBJECT:
            for (size_t i = 0; i < v->data.object_val->count; i++) {
                free(v->data.object_val->pairs[i].key);
                json_free(v->data.object_val->pairs[i].value);
            }
            free(v->data.object_val->pairs);
            free(v->data.object_val);
            break;
        default:
            break;
    }
    free(v);
}

int main() {
    printf("=== JSON 值示例 ===\n\n");

    JsonValue *v1 = json_null();
    printf("null: ");
    json_print(v1, 0);
    printf("\n");
    json_free(v1);

    JsonValue *v2 = json_bool(1);
    printf("bool: ");
    json_print(v2, 0);
    printf("\n");
    json_free(v2);

    JsonValue *v3 = json_number(3.14159);
    printf("number: ");
    json_print(v3, 0);
    printf("\n");
    json_free(v3);

    JsonValue *v4 = json_string("Hello, World!");
    printf("string: ");
    json_print(v4, 0);
    printf("\n");
    json_free(v4);

    printf("\nJsonValue 大小: %zu 字节\n", sizeof(JsonValue));

    return 0;
}
```

### 场景 3：状态机实现

```c
#include <stdio.h>
#include <string.h>

// 状态枚举
typedef enum {
    STATE_IDLE,
    STATE_CONNECTING,
    STATE_CONNECTED,
    STATE_DISCONNECTING,
    STATE_ERROR,
    STATE_COUNT
} ConnectionState;

// 事件枚举
typedef enum {
    EVENT_CONNECT,
    EVENT_CONNECTED,
    EVENT_DISCONNECT,
    EVENT_DISCONNECTED,
    EVENT_ERROR,
    EVENT_RESET,
    EVENT_COUNT
} ConnectionEvent;

// 状态名称
const char* state_names[] = {
    [STATE_IDLE] = "空闲",
    [STATE_CONNECTING] = "连接中",
    [STATE_CONNECTED] = "已连接",
    [STATE_DISCONNECTING] = "断开中",
    [STATE_ERROR] = "错误"
};

// 事件名称
const char* event_names[] = {
    [EVENT_CONNECT] = "连接请求",
    [EVENT_CONNECTED] = "连接成功",
    [EVENT_DISCONNECT] = "断开请求",
    [EVENT_DISCONNECTED] = "已断开",
    [EVENT_ERROR] = "发生错误",
    [EVENT_RESET] = "重置"
};

// 连接上下文
typedef struct {
    ConnectionState state;
    int retry_count;
    char error_message[256];
} ConnectionContext;

// 状态处理函数类型
typedef void (*StateHandler)(ConnectionContext *ctx, ConnectionEvent event);

// 状态转换表
typedef struct {
    ConnectionState next_state;
    void (*action)(ConnectionContext *ctx);
} Transition;

// 动作函数
void action_start_connect(ConnectionContext *ctx) {
    printf("  [动作] 开始建立连接...\n");
    ctx->retry_count = 0;
}

void action_complete_connect(ConnectionContext *ctx) {
    printf("  [动作] 连接建立完成\n");
}

void action_start_disconnect(ConnectionContext *ctx) {
    printf("  [动作] 开始断开连接...\n");
}

void action_complete_disconnect(ConnectionContext *ctx) {
    printf("  [动作] 连接已断开\n");
}

void action_handle_error(ConnectionContext *ctx) {
    printf("  [动作] 处理错误: %s\n", ctx->error_message);
}

void action_reset(ConnectionContext *ctx) {
    printf("  [动作] 重置连接状态\n");
    ctx->retry_count = 0;
    ctx->error_message[0] = '\0';
}

// 状态转换表
// transition_table[当前状态][事件] = {下一状态, 动作}
Transition transition_table[STATE_COUNT][EVENT_COUNT] = {
    // STATE_IDLE
    [STATE_IDLE] = {
        [EVENT_CONNECT] = {STATE_CONNECTING, action_start_connect},
        [EVENT_ERROR]   = {STATE_ERROR, action_handle_error},
    },
    // STATE_CONNECTING
    [STATE_CONNECTING] = {
        [EVENT_CONNECTED]    = {STATE_CONNECTED, action_complete_connect},
        [EVENT_ERROR]        = {STATE_ERROR, action_handle_error},
        [EVENT_DISCONNECT]   = {STATE_IDLE, action_complete_disconnect},
    },
    // STATE_CONNECTED
    [STATE_CONNECTED] = {
        [EVENT_DISCONNECT] = {STATE_DISCONNECTING, action_start_disconnect},
        [EVENT_ERROR]      = {STATE_ERROR, action_handle_error},
    },
    // STATE_DISCONNECTING
    [STATE_DISCONNECTING] = {
        [EVENT_DISCONNECTED] = {STATE_IDLE, action_complete_disconnect},
        [EVENT_ERROR]        = {STATE_ERROR, action_handle_error},
    },
    // STATE_ERROR
    [STATE_ERROR] = {
        [EVENT_RESET] = {STATE_IDLE, action_reset},
    },
};

// 处理事件
void handle_event(ConnectionContext *ctx, ConnectionEvent event) {
    ConnectionState current = ctx->state;
    Transition *trans = &transition_table[current][event];

    printf("\n[事件] %s (当前状态: %s)\n",
           event_names[event], state_names[current]);

    if (trans->next_state == 0 && trans->action == NULL) {
        printf("  [警告] 在状态 %s 下忽略事件 %s\n",
               state_names[current], event_names[event]);
        return;
    }

    // 执行动作
    if (trans->action != NULL) {
        trans->action(ctx);
    }

    // 转换状态
    if (trans->next_state != current) {
        ctx->state = trans->next_state;
        printf("  [转换] %s -> %s\n",
               state_names[current], state_names[ctx->state]);
    }
}

int main() {
    printf("=== 连接状态机演示 ===\n");

    ConnectionContext ctx = {
        .state = STATE_IDLE,
        .retry_count = 0,
        .error_message = ""
    };

    // 正常流程
    handle_event(&ctx, EVENT_CONNECT);
    handle_event(&ctx, EVENT_CONNECTED);
    handle_event(&ctx, EVENT_DISCONNECT);
    handle_event(&ctx, EVENT_DISCONNECTED);

    // 错误处理
    handle_event(&ctx, EVENT_CONNECT);
    strcpy(ctx.error_message, "连接超时");
    handle_event(&ctx, EVENT_ERROR);
    handle_event(&ctx, EVENT_RESET);

    // 忽略无效事件
    handle_event(&ctx, EVENT_DISCONNECTED);

    return 0;
}
```

## 面试要点

### 问题 1：结构体和类的区别？

**答案**：
在 C 语言中没有类的概念，只有结构体。在 C++ 中：
- 结构体成员默认是 `public`，类成员默认是 `private`
- 结构体默认公有继承，类默认私有继承
- 其他方面（方法、构造函数、继承等）完全相同

C 语言中的结构体只能包含数据成员，不能包含函数成员（但可以包含函数指针）。

### 问题 2：解释结构体内存对齐

**答案**：
```c
struct Example {
    char a;    // 偏移 0，大小 1
               // 3 字节填充（对齐到 4 字节边界）
    int b;     // 偏移 4，大小 4
    char c;    // 偏移 8，大小 1
               // 3 字节填充（结构体大小需是最大对齐的倍数）
};
// 总大小：12 字节

// 优化后：
struct OptimizedExample {
    int b;     // 偏移 0，大小 4
    char a;    // 偏移 4，大小 1
    char c;    // 偏移 5，大小 1
               // 2 字节填充
};
// 总大小：8 字节
```

对齐规则：
1. 结构体成员按声明顺序存放
2. 每个成员的偏移量必须是其对齐要求的倍数
3. 结构体总大小必须是最大成员对齐要求的倍数

### 问题 3：联合体的典型应用场景？

**答案**：
1. **类型双关**：查看数据的不同表示
   ```c
   union { float f; uint32_t bits; } u;
   u.f = 3.14f;
   printf("0x%X\n", u.bits);  // 查看浮点数的位表示
   ```

2. **节省内存**：存储互斥数据
   ```c
   struct Variant {
       int type;
       union { int i; float f; char *s; } data;
   };
   ```

3. **网络协议解析**：解析不同格式的数据包

4. **硬件寄存器映射**：按位访问或整体访问

### 问题 4：位域的注意事项？

**答案**：
1. **可移植性差**：位域的内存布局依赖编译器
2. **不能取地址**：`&bf.field` 是非法的
3. **跨单元边界**：某些编译器不允许位域跨存储单元
4. **符号扩展**：有符号位域可能导致意外的符号扩展
5. **替代方案**：对于需要可移植性的代码，使用位掩码和移位操作

### 问题 5：如何实现 C 语言的"面向对象"？

**答案**：
```c
// 封装：使用不透明指针
// person.h
typedef struct Person Person;
Person* person_create(const char *name, int age);
void person_destroy(Person *p);
const char* person_get_name(const Person *p);

// person.c
struct Person {
    char name[50];
    int age;
};
// 实现函数...

// 继承：结构体嵌套
struct Animal {
    void (*speak)(void);
};

struct Dog {
    struct Animal base;  // "继承"
    int age;
};

// 多态：函数指针
struct Shape {
    double (*area)(struct Shape *self);
    void (*draw)(struct Shape *self);
};
```

### 问题 6：柔性数组成员是什么？

**答案**：
C99 引入的特性，允许结构体的最后一个成员是不完整的数组类型：

```c
struct FlexArray {
    int length;
    int data[];  // 柔性数组成员
};

// 使用
struct FlexArray *fa = malloc(sizeof(struct FlexArray) + n * sizeof(int));
fa->length = n;

// 注意
// 1. 必须是结构体的最后一个成员
// 2. 结构体必须至少有一个其他成员
// 3. sizeof 不包含柔性数组的大小
// 4. 不能在栈上分配包含柔性数组的结构体
```

## 延伸阅读

### 官方文档与标准

- [ISO/IEC 9899:2018 (C17)](https://www.iso.org/standard/74528.html) - C 语言最新标准
- [cppreference - C 结构体](https://en.cppreference.com/w/c/language/struct)
- [cppreference - C 联合体](https://en.cppreference.com/w/c/language/union)
- [cppreference - C 枚举](https://en.cppreference.com/w/c/language/enum)

### 经典书籍

- 《C程序设计语言》(K&R) - Brian Kernighan, Dennis Ritchie
- 《C和指针》- Kenneth Reek
- 《C专家编程》- Peter van der Linden
- 《深入理解计算机系统》- Randal Bryant, David O'Hallaron

### 优质文章

- [The Lost Art of Structure Packing](http://www.catb.org/esr/structure-packing/) - Eric S. Raymond
- [Data Alignment in C](https://developer.ibm.com/articles/pa-dalign/) - IBM Developer
- [Tagged Unions in C](https://www.embedded.com/tagged-unions-in-c/) - Embedded.com

### 工具与实践

- [pahole](https://linux.die.net/man/1/pahole) - 分析结构体内存布局
- [Compiler Explorer](https://godbolt.org/) - 查看编译后的汇编代码
- [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) - 检测内存错误
