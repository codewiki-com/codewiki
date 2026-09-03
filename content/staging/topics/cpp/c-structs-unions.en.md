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
origin: old/src/content/docs/cpp/c-structs-unions.en.md
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

Structures (struct), unions (union), and enumerations (enum) are three important compound data types in C. They allow programmers to organize multiple related data items together, creating more meaningful data structures, and serve as the foundation for building complex programs and data models.

## Concept Explanation

### What Are Compound Data Types?

C's basic data types (int, char, float, etc.) can only store single-type values. However, in real-world programming, we often need to combine multiple related data items together. For example, describing a student requires multiple attributes such as name, age, and grades. Compound data types are designed to solve this problem.

### Differences Between the Three Compound Types

| Feature | Structure (struct) | Union (union) | Enumeration (enum) |
|---------|-------------------|---------------|-------------------|
| Memory Allocation | Each member has independent space | All members share the same space | Collection of integer constants |
| Size | Sum of all member sizes (including alignment) | Size of largest member | Usually int size |
| Simultaneous Access | All members can be accessed simultaneously | Only one member can be used at a time | Represents only one value |
| Primary Use | Organizing related data | Saving memory, type conversion | Defining named constants |

### Historical Background

The concept of structures can be traced back to record types in early programming languages ALGOL and COBOL. C introduced struct when Dennis Ritchie designed the language in 1972, and later added union and enum, giving C complete compound data type support. These features remain core tools for systems programming and embedded development today.

## Core Principles

### Memory Layout of Structures

Structures are stored in memory in the order their members are declared, but memory alignment must be considered:

```
struct Example {
    char a;      // 1 byte
                 // 3 bytes padding (align to 4-byte boundary)
    int b;       // 4 bytes
    char c;      // 1 byte
                 // 3 bytes padding (align to struct's maximum alignment requirement)
};
// Total size: 12 bytes (not 6 bytes)

Memory layout:
+---+---+---+---+---+---+---+---+---+---+---+---+
| a | P | P | P |    b    | c | P | P | P |
+---+---+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9  10  11

P = padding byte
```

### Memory Sharing in Unions

All members of a union share the same memory region, with size equal to the largest member:

```
union Data {
    int i;       // 4 bytes
    float f;     // 4 bytes
    char str[8]; // 8 bytes
};
// Total size: 8 bytes (size of largest member)

Memory layout:
+---+---+---+---+---+---+---+---+
|   i   |       |       |       |  <- int uses first 4 bytes
|   f   |       |       |       |  <- float uses first 4 bytes
|       str         |           |  <- char[8] uses all 8 bytes
+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7
```

### Underlying Representation of Enumerations

Enumerations are essentially collections of integer constants, typically implemented by the compiler as int type:

```c
enum Color { RED, GREEN, BLUE };  // RED=0, GREEN=1, BLUE=2

// Equivalent to:
#define RED   0
#define GREEN 1
#define BLUE  2
```

## Key Points

### Structure Key Points

1. **Declaration and Definition Separation**: You can declare a structure type first, then define variables later
2. **Member Access**: Use the dot operator (.) to access members, use arrow operator (->) for pointers
3. **Memory Alignment**: Members are arranged according to alignment requirements, which may produce padding bytes
4. **Self-Referencing**: Structures can contain pointers to their own type (used for linked lists, trees, etc.)
5. **Anonymous Structures**: C11 supports anonymous structures, which can simplify nested access

### Union Key Points

1. **Memory Sharing**: All members share the same memory region
2. **Type Punning**: Can be used to view different type representations of the same data
3. **Space Saving**: Suitable for storing mutually exclusive data
4. **Tagged Unions**: Often combined with structures to implement type-tagged unions

### Enumeration Key Points

1. **Default Values**: The first enumeration constant defaults to 0, subsequent ones increment
2. **Custom Values**: You can specify specific integer values for enumeration constants
3. **Type Safety**: Although essentially integers, they provide semantic type checking
4. **Scope**: Enumeration constants are visible within the declared scope

## Code Examples

### Structure Basics

```c
#include <stdio.h>
#include <string.h>

// Structure definition
struct Student {
    char name[50];
    int age;
    float gpa;
    char grade;
};

// Using typedef to simplify type name
typedef struct {
    double x;
    double y;
} Point;

int main() {
    // Method 1: Declare then assign individually
    struct Student s1;
    strcpy(s1.name, "Alice");
    s1.age = 20;
    s1.gpa = 3.8;
    s1.grade = 'A';

    // Method 2: Initialization list
    struct Student s2 = {"Bob", 21, 3.5, 'B'};

    // Method 3: Designated initializers (C99)
    struct Student s3 = {
        .name = "Charlie",
        .age = 22,
        .gpa = 3.9,
        .grade = 'A'
    };

    // Using typedef-defined structure
    Point p1 = {3.0, 4.0};
    Point p2 = {.x = 1.0, .y = 2.0};

    // Accessing members
    printf("Student 1: %s, age %d, GPA: %.2f\n", s1.name, s1.age, s1.gpa);
    printf("Student 2: %s, age %d, GPA: %.2f\n", s2.name, s2.age, s2.gpa);
    printf("Point 1: (%.1f, %.1f)\n", p1.x, p1.y);

    // Structure assignment (shallow copy)
    struct Student s4 = s2;
    printf("Student 4 (copied from Student 2): %s\n", s4.name);

    return 0;
}
```

### Structure Pointers

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[50];
    int age;
    float salary;
} Employee;

// Modify structure through pointer
void give_raise(Employee *emp, float percent) {
    emp->salary *= (1 + percent / 100);
}

// Print structure through pointer
void print_employee(const Employee *emp) {
    printf("Name: %s\n", emp->name);
    printf("Age: %d\n", emp->age);
    printf("Salary: %.2f\n", emp->salary);
    printf("---\n");
}

// Dynamically allocate structure
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
    // Structure on stack with pointer
    Employee emp1 = {"Zhang San", 30, 50000.0};
    Employee *ptr1 = &emp1;

    printf("Using dot operator: %s\n", emp1.name);
    printf("Using arrow operator: %s\n", ptr1->name);
    printf("Equivalent syntax: %s\n", (*ptr1).name);

    // Modify through pointer
    printf("\nBefore raise:\n");
    print_employee(ptr1);

    give_raise(ptr1, 10);  // 10% raise

    printf("After raise:\n");
    print_employee(ptr1);

    // Dynamically allocated structure
    Employee *emp2 = create_employee("Li Si", 25, 40000.0);
    if (emp2 != NULL) {
        printf("Dynamically created employee:\n");
        print_employee(emp2);
        free(emp2);
    }

    // Structure array and pointers
    Employee team[3] = {
        {"Wang Wu", 28, 45000.0},
        {"Zhao Liu", 35, 60000.0},
        {"Qian Qi", 32, 55000.0}
    };

    printf("Team members:\n");
    for (Employee *p = team; p < team + 3; p++) {
        print_employee(p);
    }

    return 0;
}
```

### Nested Structures and Self-Referencing

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Nested structures
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
    Date birthday;      // Nested structure
    Address address;    // Nested structure
} Person;

// Self-referencing structure - linked list node
typedef struct Node {
    int data;
    struct Node *next;  // Pointer to own type
} Node;

// Create new node
Node* create_node(int data) {
    Node *node = (Node*)malloc(sizeof(Node));
    if (node != NULL) {
        node->data = data;
        node->next = NULL;
    }
    return node;
}

// Print linked list
void print_list(Node *head) {
    printf("List: ");
    while (head != NULL) {
        printf("%d -> ", head->data);
        head = head->next;
    }
    printf("NULL\n");
}

// Free linked list
void free_list(Node *head) {
    while (head != NULL) {
        Node *temp = head;
        head = head->next;
        free(temp);
    }
}

int main() {
    // Nested structure initialization
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

    printf("Name: %s\n", person.name);
    printf("Birthday: %d/%d/%d\n",
           person.birthday.day,
           person.birthday.month,
           person.birthday.year);
    printf("Address: %s, %s, %s %d\n",
           person.address.street,
           person.address.city,
           person.address.country,
           person.address.zipcode);

    // Linked list example
    printf("\n=== Linked List Example ===\n");
    Node *head = create_node(1);
    head->next = create_node(2);
    head->next->next = create_node(3);
    head->next->next->next = create_node(4);

    print_list(head);
    free_list(head);

    return 0;
}
```

### Bit Fields

```c
#include <stdio.h>
#include <stdint.h>

// Bit fields: precise control over bits occupied by members
typedef struct {
    unsigned int is_active : 1;    // 1 bit
    unsigned int priority  : 3;    // 3 bits (0-7)
    unsigned int type      : 4;    // 4 bits (0-15)
    unsigned int id        : 8;    // 8 bits (0-255)
    unsigned int reserved  : 16;   // 16 bits reserved
} Flags;

// Hardware register simulation
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

// Using union to implement bit operations
typedef union {
    uint8_t byte;
    RegisterBits bits;
} Register;

// TCP flags example
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
    // Basic bit field usage
    printf("=== Basic Bit Fields ===\n");
    printf("Flags size: %zu bytes\n", sizeof(Flags));

    Flags flags = {0};
    flags.is_active = 1;
    flags.priority = 5;
    flags.type = 10;
    flags.id = 200;

    printf("is_active: %u\n", flags.is_active);
    printf("priority: %u\n", flags.priority);
    printf("type: %u\n", flags.type);
    printf("id: %u\n", flags.id);

    // Bit field overflow demonstration
    flags.priority = 15;  // Only 3 bits, max value is 7
    printf("priority (after overflow): %u\n", flags.priority);  // Outputs 7 (15 & 0x7)

    // Register operations
    printf("\n=== Register Operations ===\n");
    Register reg;
    reg.byte = 0;

    // Set specific bits
    reg.bits.bit0 = 1;
    reg.bits.bit3 = 1;
    reg.bits.bit7 = 1;

    printf("Register value: 0x%02X (binary: ", reg.byte);
    for (int i = 7; i >= 0; i--) {
        printf("%d", (reg.byte >> i) & 1);
    }
    printf(")\n");

    // TCP flags example
    printf("\n=== TCP Flags ===\n");
    TCPFlags tcp = {0};
    tcp.syn = 1;  // SYN handshake
    tcp.ack = 1;  // Acknowledgment

    printf("TCPFlags size: %zu bytes\n", sizeof(TCPFlags));
    printf("SYN: %d, ACK: %d\n", tcp.syn, tcp.ack);

    return 0;
}
```

### Unions

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>

// Basic union
union Data {
    int i;
    float f;
    char str[20];
};

// Type punning: view binary representation of float
union FloatBits {
    float f;
    uint32_t bits;
    struct {
        uint32_t mantissa : 23;
        uint32_t exponent : 8;
        uint32_t sign     : 1;
    } parts;
};

// Network byte order conversion
union IPAddress {
    uint32_t address;
    uint8_t octets[4];
};

// Tagged union (variant type)
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

// Print Variant
void print_variant(const Variant *v) {
    switch (v->type) {
        case TYPE_INT:
            printf("Integer: %d\n", v->data.i);
            break;
        case TYPE_FLOAT:
            printf("Float: %.2f\n", v->data.f);
            break;
        case TYPE_STRING:
            printf("String: %s\n", v->data.str);
            break;
    }
}

int main() {
    // Basic union usage
    printf("=== Basic Union ===\n");
    printf("union Data size: %zu bytes\n", sizeof(union Data));

    union Data data;

    data.i = 42;
    printf("data.i = %d\n", data.i);

    data.f = 3.14159;
    printf("data.f = %.5f\n", data.f);
    printf("data.i (after overwrite) = %d\n", data.i);  // Value overwritten

    strcpy(data.str, "Hello");
    printf("data.str = %s\n", data.str);

    // Type punning
    printf("\n=== Float Binary Representation ===\n");
    union FloatBits fb;
    fb.f = 3.14159f;

    printf("Float value: %.5f\n", fb.f);
    printf("Hexadecimal: 0x%08X\n", fb.bits);
    printf("Sign bit: %u\n", fb.parts.sign);
    printf("Exponent: %u (biased: %d)\n", fb.parts.exponent, fb.parts.exponent - 127);
    printf("Mantissa: 0x%06X\n", fb.parts.mantissa);

    // IP address conversion
    printf("\n=== IP Address Conversion ===\n");
    union IPAddress ip;
    ip.octets[0] = 192;
    ip.octets[1] = 168;
    ip.octets[2] = 1;
    ip.octets[3] = 100;

    printf("IP address: %d.%d.%d.%d\n",
           ip.octets[0], ip.octets[1], ip.octets[2], ip.octets[3]);
    printf("32-bit representation: 0x%08X (%u)\n", ip.address, ip.address);

    // Tagged union
    printf("\n=== Tagged Union ===\n");
    Variant v1 = {TYPE_INT, .data.i = 100};
    Variant v2 = {TYPE_FLOAT, .data.f = 2.718};
    Variant v3 = {TYPE_STRING};
    strcpy(v3.data.str, "Hello World");

    print_variant(&v1);
    print_variant(&v2);
    print_variant(&v3);

    printf("\nVariant size: %zu bytes\n", sizeof(Variant));

    return 0;
}
```

### Enumerations

```c
#include <stdio.h>
#include <string.h>

// Basic enumeration
enum Color {
    RED,        // 0
    GREEN,      // 1
    BLUE        // 2
};

// Enumeration with specified values
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

// Bit flag enumeration
enum Permission {
    PERM_NONE    = 0,
    PERM_READ    = 1 << 0,  // 0001
    PERM_WRITE   = 1 << 1,  // 0010
    PERM_EXECUTE = 1 << 2,  // 0100
    PERM_DELETE  = 1 << 3,  // 1000
    PERM_ALL     = PERM_READ | PERM_WRITE | PERM_EXECUTE | PERM_DELETE
};

// State machine enumeration
typedef enum {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_PAUSED,
    STATE_STOPPED,
    STATE_ERROR
} MachineState;

// Enum to string
const char* color_to_string(enum Color c) {
    switch (c) {
        case RED:   return "Red";
        case GREEN: return "Green";
        case BLUE:  return "Blue";
        default:    return "Unknown";
    }
}

const char* state_to_string(MachineState state) {
    static const char* names[] = {
        "Idle", "Running", "Paused", "Stopped", "Error"
    };
    if (state >= 0 && state <= STATE_ERROR) {
        return names[state];
    }
    return "Unknown";
}

// Permission check
int has_permission(int user_perms, enum Permission required) {
    return (user_perms & required) == required;
}

void print_permissions(int perms) {
    printf("Permissions: ");
    if (perms & PERM_READ)    printf("Read ");
    if (perms & PERM_WRITE)   printf("Write ");
    if (perms & PERM_EXECUTE) printf("Execute ");
    if (perms & PERM_DELETE)  printf("Delete ");
    if (perms == PERM_NONE)   printf("None");
    printf("\n");
}

int main() {
    // Basic enumeration usage
    printf("=== Basic Enumeration ===\n");
    enum Color c = GREEN;
    printf("Color: %s (value: %d)\n", color_to_string(c), c);

    // Enumeration size
    printf("enum Color size: %zu bytes\n", sizeof(enum Color));

    // HTTP status codes
    printf("\n=== HTTP Status Codes ===\n");
    enum HttpStatus status = HTTP_OK;
    printf("Status: %d\n", status);

    status = HTTP_NOT_FOUND;
    if (status >= 400 && status < 500) {
        printf("Client error: %d\n", status);
    }

    // Bit flags
    printf("\n=== Bit Flag Permissions ===\n");
    int admin_perms = PERM_ALL;
    int user_perms = PERM_READ | PERM_WRITE;
    int guest_perms = PERM_READ;

    printf("Admin ");
    print_permissions(admin_perms);

    printf("Regular user ");
    print_permissions(user_perms);

    printf("Guest ");
    print_permissions(guest_perms);

    // Permission check
    printf("\nCan regular user write? %s\n",
           has_permission(user_perms, PERM_WRITE) ? "Yes" : "No");
    printf("Can guest write? %s\n",
           has_permission(guest_perms, PERM_WRITE) ? "Yes" : "No");

    // State machine
    printf("\n=== State Machine ===\n");
    MachineState state = STATE_IDLE;
    printf("Current state: %s\n", state_to_string(state));

    state = STATE_RUNNING;
    printf("Current state: %s\n", state_to_string(state));

    // switch with enumeration
    switch (state) {
        case STATE_IDLE:
            printf("Machine idle\n");
            break;
        case STATE_RUNNING:
            printf("Machine running\n");
            break;
        case STATE_PAUSED:
            printf("Machine paused\n");
            break;
        case STATE_STOPPED:
            printf("Machine stopped\n");
            break;
        case STATE_ERROR:
            printf("Machine error\n");
            break;
    }

    return 0;
}
```

### Comprehensive Example: Configuration System

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Configuration item type
typedef enum {
    CONFIG_TYPE_INT,
    CONFIG_TYPE_FLOAT,
    CONFIG_TYPE_STRING,
    CONFIG_TYPE_BOOL
} ConfigType;

// Configuration value (tagged union)
typedef struct {
    char key[64];
    ConfigType type;
    union {
        int int_val;
        float float_val;
        char string_val[256];
        int bool_val;  // 0 or 1
    } value;
} ConfigItem;

// Configuration manager
typedef struct {
    ConfigItem *items;
    size_t count;
    size_t capacity;
} ConfigManager;

// Create configuration manager
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

// Find configuration item
ConfigItem* config_find(ConfigManager *cm, const char *key) {
    for (size_t i = 0; i < cm->count; i++) {
        if (strcmp(cm->items[i].key, key) == 0) {
            return &cm->items[i];
        }
    }
    return NULL;
}

// Add or update configuration item
int config_add_item(ConfigManager *cm, ConfigItem *item) {
    // Check if already exists
    ConfigItem *existing = config_find(cm, item->key);
    if (existing != NULL) {
        *existing = *item;
        return 0;
    }

    // Expand capacity
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

// Convenience setter functions
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

// Print configuration item
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

// Print all configurations
void config_print_all(const ConfigManager *cm) {
    printf("Configuration items (%zu):\n", cm->count);
    for (size_t i = 0; i < cm->count; i++) {
        config_print_item(&cm->items[i]);
    }
}

// Destroy configuration manager
void config_destroy(ConfigManager *cm) {
    if (cm != NULL) {
        free(cm->items);
        free(cm);
    }
}

int main() {
    ConfigManager *config = config_create();
    if (config == NULL) {
        fprintf(stderr, "Failed to create configuration manager\n");
        return 1;
    }

    // Set configuration items
    config_set_string(config, "app.name", "MyApplication");
    config_set_string(config, "app.version", "1.0.0");
    config_set_int(config, "server.port", 8080);
    config_set_string(config, "server.host", "localhost");
    config_set_int(config, "server.max_connections", 100);
    config_set_float(config, "server.timeout", 30.5);
    config_set_bool(config, "debug.enabled", 1);
    config_set_bool(config, "debug.verbose", 0);

    // Print all configurations
    config_print_all(config);

    // Find and modify configuration
    printf("\nModifying server.port...\n");
    config_set_int(config, "server.port", 9090);

    ConfigItem *item = config_find(config, "server.port");
    if (item != NULL) {
        printf("New ");
        config_print_item(item);
    }

    // Cleanup
    config_destroy(config);

    return 0;
}
```

## Best Practices

### Structure Design Principles

```c
#include <stdio.h>
#include <stddef.h>

// 1. Arrange members properly to reduce padding
// Not recommended: wasted space
struct BadLayout {
    char a;      // 1 + 7 padding
    double b;    // 8
    char c;      // 1 + 3 padding
    int d;       // 4
};  // Total 24 bytes

// Recommended: compact layout
struct GoodLayout {
    double b;    // 8
    int d;       // 4
    char a;      // 1
    char c;      // 1 + 2 padding
};  // Total 16 bytes

// 2. Use typedef to simplify type names
typedef struct Point {
    double x;
    double y;
} Point;

// 3. Provide initialization functions
Point point_create(double x, double y) {
    Point p = {x, y};
    return p;
}

// 4. Use const to protect read-only data
void point_print(const Point *p) {
    printf("(%.2f, %.2f)\n", p->x, p->y);
}

// 5. Opaque pointer pattern (hide implementation details)
// In header file:
// typedef struct Context Context;
// Context* context_create(void);
// void context_destroy(Context *ctx);

int main() {
    printf("BadLayout size: %zu bytes\n", sizeof(struct BadLayout));
    printf("GoodLayout size: %zu bytes\n", sizeof(struct GoodLayout));

    Point p = point_create(3.0, 4.0);
    point_print(&p);

    return 0;
}
```

### Union Usage Guidelines

```c
#include <stdio.h>
#include <string.h>
#include <assert.h>

// 1. Always use tagged unions
typedef enum { INT, FLOAT, STRING } DataType;

typedef struct {
    DataType type;  // Type tag
    union {
        int i;
        float f;
        char s[32];
    } data;
} SafeVariant;

// Safe accessor function
int safe_get_int(const SafeVariant *v, int *out) {
    if (v->type != INT) return -1;
    *out = v->data.i;
    return 0;
}

// 2. Document union usage conventions
/*
 * union Message usage conventions:
 * - When header.type == MSG_TEXT, access text_msg
 * - When header.type == MSG_IMAGE, access image_msg
 * - Never access multiple members simultaneously
 */

// 3. Use static assertions to verify size assumptions
typedef union {
    int i;
    float f;
} IntFloat;

// C11 static assertion
_Static_assert(sizeof(IntFloat) == sizeof(int),
               "IntFloat should be the size of int");

int main() {
    SafeVariant v = {INT, .data.i = 42};

    int value;
    if (safe_get_int(&v, &value) == 0) {
        printf("Value: %d\n", value);
    }

    return 0;
}
```

### Enumeration Usage Standards

```c
#include <stdio.h>

// 1. Use meaningful prefixes
typedef enum {
    COLOR_RED,
    COLOR_GREEN,
    COLOR_BLUE,
    COLOR_COUNT  // Common technique: get enumeration count
} Color;

// 2. Provide string conversion for enumerations
const char* const COLOR_NAMES[] = {
    [COLOR_RED]   = "Red",
    [COLOR_GREEN] = "Green",
    [COLOR_BLUE]  = "Blue"
};

const char* color_name(Color c) {
    if (c >= 0 && c < COLOR_COUNT) {
        return COLOR_NAMES[c];
    }
    return "Unknown";
}

// 3. Use uppercase and bit shifts for bit flags
typedef enum {
    FLAG_NONE     = 0,
    FLAG_READABLE = 1 << 0,
    FLAG_WRITABLE = 1 << 1,
    FLAG_HIDDEN   = 1 << 2
} FileFlags;

// 4. Explicitly specify important values
typedef enum {
    ERROR_SUCCESS = 0,
    ERROR_NOT_FOUND = -1,
    ERROR_INVALID = -2,
    ERROR_TIMEOUT = -3
} ErrorCode;

// 5. Handle all cases in switch statements
void handle_color(Color c) {
    switch (c) {
        case COLOR_RED:
            printf("Handle red\n");
            break;
        case COLOR_GREEN:
            printf("Handle green\n");
            break;
        case COLOR_BLUE:
            printf("Handle blue\n");
            break;
        case COLOR_COUNT:
            // Should not reach here
            break;
        // No default needed, compiler will warn about missing cases
    }
}

int main() {
    for (int i = 0; i < COLOR_COUNT; i++) {
        printf("Color %d: %s\n", i, color_name(i));
    }

    FileFlags flags = FLAG_READABLE | FLAG_WRITABLE;
    printf("File permissions: 0x%X\n", flags);

    return 0;
}
```

## Common Pitfalls

### Pitfall 1: Structure Pointers and Member Access

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int x;
    int y;
} Point;

void trap_pointer_access(void) {
    Point *p = NULL;

    // Error: dereferencing null pointer
    // printf("x = %d\n", p->x);  // Crash!

    // Correct: check pointer first
    if (p != NULL) {
        printf("x = %d\n", p->x);
    } else {
        printf("Pointer is null\n");
    }

    // Forgetting to initialize after dynamic allocation
    p = (Point*)malloc(sizeof(Point));
    if (p != NULL) {
        // p->x and p->y contain garbage values!
        // printf("Uninitialized: x = %d\n", p->x);  // Undefined behavior

        // Correct: initialize before use
        p->x = 0;
        p->y = 0;
        printf("After initialization: x = %d\n", p->x);
        free(p);
    }
}

int main() {
    trap_pointer_access();
    return 0;
}
```

### Pitfall 2: Shallow Copy of Structures

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char *name;  // Points to heap memory
    int age;
} Person;

void shallow_copy_trap(void) {
    // Create original object
    Person p1;
    p1.name = (char*)malloc(50);
    strcpy(p1.name, "Alice");
    p1.age = 25;

    // Shallow copy: only copies pointer value, not the pointed data
    Person p2 = p1;

    printf("p1.name: %s (address: %p)\n", p1.name, (void*)p1.name);
    printf("p2.name: %s (address: %p)\n", p2.name, (void*)p2.name);
    // Both pointers point to the same memory!

    // Modifying p2 affects p1
    strcpy(p2.name, "Bob");
    printf("After modifying p2:\n");
    printf("p1.name: %s\n", p1.name);  // Also becomes "Bob"!

    // Danger: freeing one makes the other a dangling pointer
    free(p1.name);
    // p2.name is now a dangling pointer!
    // free(p2.name);  // Double free!
}

// Correct approach: implement deep copy
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
    printf("=== Shallow Copy Pitfall Demo ===\n");
    shallow_copy_trap();

    printf("\n=== Deep Copy Correct Approach ===\n");
    Person p1 = {.name = (char*)malloc(50), .age = 30};
    strcpy(p1.name, "Charlie");

    Person p2 = deep_copy(&p1);

    printf("p1.name: %s (address: %p)\n", p1.name, (void*)p1.name);
    printf("p2.name: %s (address: %p)\n", p2.name, (void*)p2.name);

    // Now can safely free independently
    free(p1.name);
    free(p2.name);

    return 0;
}
```

### Pitfall 3: Union Member Access Errors

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

    // Set as float
    d.f = 3.14159f;

    // Error: reading wrong type member
    printf("As float: %.5f\n", d.f);
    printf("As int (misinterpreted): %d\n", d.i);  // Garbage value!

    // Set string
    strcpy(d.str, "Hello");

    // Error: previous float value overwritten
    printf("As string: %s\n", d.str);
    printf("As float (overwritten): %.5f\n", d.f);  // Garbage value!
}

// Correct approach: use tagged union
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
            printf("Integer: %d\n", tu->value.i);
            break;
        case TYPE_FLOAT:
            printf("Float: %.5f\n", tu->value.f);
            break;
        case TYPE_STRING:
            printf("String: %s\n", tu->value.str);
            break;
    }
}

int main() {
    printf("=== Union Access Pitfall ===\n");
    union_access_trap();

    printf("\n=== Safe Tagged Union ===\n");
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

### Pitfall 4: Bit Field Portability Issues

```c
#include <stdio.h>
#include <stdint.h>

// Warning: bit field memory layout depends on compiler and platform
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

    // Different compilers may have different memory layouts!
    // Do not assume specific bit field layout
}

// Portable alternative
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
    printf("=== Bit Field Portability ===\n");
    bitfield_portability();

    printf("\n=== Portable Bit Operations ===\n");
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

### Pitfall 5: Flexible Array Members

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// C99 flexible array member
typedef struct {
    int length;
    char data[];  // Flexible array member, must be last member
} FlexArray;

void flexible_array_demo(void) {
    // Error: cannot allocate flexible array on stack
    // FlexArray fa;  // data size is 0!

    // Correct: use malloc to allocate enough space
    int data_size = 10;
    FlexArray *fa = malloc(sizeof(FlexArray) + data_size * sizeof(char));

    if (fa == NULL) return;

    fa->length = data_size;
    memset(fa->data, 'A', data_size);

    printf("Length: %d\n", fa->length);
    printf("Data: ");
    for (int i = 0; i < fa->length; i++) {
        printf("%c", fa->data[i]);
    }
    printf("\n");

    // Note: sizeof(FlexArray) does not include data
    printf("sizeof(FlexArray) = %zu\n", sizeof(FlexArray));
    printf("Actually allocated: %zu\n", sizeof(FlexArray) + data_size);

    free(fa);
}

// Old-style variable-length structure (not recommended, but common in legacy code)
typedef struct {
    int length;
    char data[1];  // "struct hack"
} OldStyleFlexArray;

int main() {
    flexible_array_demo();
    return 0;
}
```

## Performance Considerations

### Memory Alignment and Cache

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stddef.h>

// Cache-unfriendly layout
typedef struct {
    char flag;           // 1 byte
    double value;        // 8 bytes
    char status;         // 1 byte
    long data;           // 8 bytes
} CacheUnfriendly;

// Cache-friendly layout
typedef struct {
    double value;        // 8 bytes
    long data;           // 8 bytes
    char flag;           // 1 byte
    char status;         // 1 byte
} CacheFriendly;

#define ARRAY_SIZE 1000000
#define ITERATIONS 100

void benchmark_access(void) {
    printf("CacheUnfriendly size: %zu bytes\n", sizeof(CacheUnfriendly));
    printf("CacheFriendly size: %zu bytes\n", sizeof(CacheFriendly));

    CacheUnfriendly *unfriendly = malloc(ARRAY_SIZE * sizeof(CacheUnfriendly));
    CacheFriendly *friendly = malloc(ARRAY_SIZE * sizeof(CacheFriendly));

    if (!unfriendly || !friendly) {
        printf("Memory allocation failed\n");
        return;
    }

    // Initialize
    for (int i = 0; i < ARRAY_SIZE; i++) {
        unfriendly[i].value = i * 1.0;
        unfriendly[i].data = i;
        friendly[i].value = i * 1.0;
        friendly[i].data = i;
    }

    clock_t start, end;
    double sum = 0;

    // Test cache-unfriendly structure
    start = clock();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        sum = 0;
        for (int i = 0; i < ARRAY_SIZE; i++) {
            sum += unfriendly[i].value;
        }
    }
    end = clock();
    printf("CacheUnfriendly access time: %.3f seconds\n",
           (double)(end - start) / CLOCKS_PER_SEC);

    // Test cache-friendly structure
    start = clock();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        sum = 0;
        for (int i = 0; i < ARRAY_SIZE; i++) {
            sum += friendly[i].value;
        }
    }
    end = clock();
    printf("CacheFriendly access time: %.3f seconds\n",
           (double)(end - start) / CLOCKS_PER_SEC);

    free(unfriendly);
    free(friendly);
}

int main() {
    benchmark_access();
    return 0;
}
```

### Array of Structures vs Structure of Arrays

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define SIZE 1000000

// Array of Structures (AoS)
typedef struct {
    float x, y, z;
} Point3D;

// Structure of Arrays (SoA)
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
            sum += aos[i].x;  // Only access x, but loads entire structure
        }
    }
    end = clock();
    printf("AoS accessing only x: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

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
            sum += soa.x[i];  // Sequential access, cache-friendly
        }
    }
    end = clock();
    printf("SoA accessing only x: %.3f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);

    free(aos);
    free_points(&soa);

    printf("\nAoS is suitable for: frequently accessing multiple members of a structure\n");
    printf("SoA is suitable for: primarily accessing single members, or needing SIMD optimization\n");
}

int main() {
    benchmark_aos_vs_soa();
    return 0;
}
```

### Using Unions to Save Memory

```c
#include <stdio.h>
#include <string.h>

// Without union: wasted space
typedef struct {
    int type;
    int int_value;
    float float_value;
    char string_value[64];
} WasteSpace;

// With union: saved space
typedef struct {
    int type;
    union {
        int int_value;
        float float_value;
        char string_value[64];
    } data;
} SaveSpace;

int main() {
    printf("WasteSpace size: %zu bytes\n", sizeof(WasteSpace));
    printf("SaveSpace size: %zu bytes\n", sizeof(SaveSpace));
    printf("Saved: %zu bytes (%.1f%%)\n",
           sizeof(WasteSpace) - sizeof(SaveSpace),
           (1.0 - (double)sizeof(SaveSpace) / sizeof(WasteSpace)) * 100);

    return 0;
}
```

## Practical Scenarios

### Scenario 1: Network Protocol Parsing

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <arpa/inet.h>

// IP packet header structure
typedef struct {
    uint8_t  version_ihl;      // Version(4 bits) + Header length(4 bits)
    uint8_t  tos;              // Type of Service
    uint16_t total_length;     // Total length
    uint16_t identification;   // Identification
    uint16_t flags_fragment;   // Flags(3 bits) + Fragment offset(13 bits)
    uint8_t  ttl;              // Time to Live
    uint8_t  protocol;         // Protocol
    uint16_t header_checksum;  // Header checksum
    uint32_t src_addr;         // Source address
    uint32_t dst_addr;         // Destination address
} __attribute__((packed)) IPHeader;

// Parse IP address
void ip_to_string(uint32_t ip, char *buf, size_t size) {
    uint8_t *bytes = (uint8_t*)&ip;
    snprintf(buf, size, "%d.%d.%d.%d",
             bytes[0], bytes[1], bytes[2], bytes[3]);
}

// Parse IP header
void parse_ip_header(const uint8_t *data) {
    const IPHeader *header = (const IPHeader*)data;

    int version = (header->version_ihl >> 4) & 0x0F;
    int ihl = header->version_ihl & 0x0F;

    char src_str[16], dst_str[16];
    ip_to_string(header->src_addr, src_str, sizeof(src_str));
    ip_to_string(header->dst_addr, dst_str, sizeof(dst_str));

    printf("=== IP Header Parsing ===\n");
    printf("Version: IPv%d\n", version);
    printf("Header length: %d bytes\n", ihl * 4);
    printf("Total length: %d bytes\n", ntohs(header->total_length));
    printf("TTL: %d\n", header->ttl);
    printf("Protocol: %d", header->protocol);
    switch (header->protocol) {
        case 1:  printf(" (ICMP)\n"); break;
        case 6:  printf(" (TCP)\n"); break;
        case 17: printf(" (UDP)\n"); break;
        default: printf("\n"); break;
    }
    printf("Source address: %s\n", src_str);
    printf("Destination address: %s\n", dst_str);
}

int main() {
    // Simulated IP packet
    uint8_t packet[] = {
        0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00,
        0x40, 0x06, 0x00, 0x00, 0xc0, 0xa8, 0x01, 0x01,
        0xc0, 0xa8, 0x01, 0x02
    };

    printf("IPHeader size: %zu bytes\n\n", sizeof(IPHeader));
    parse_ip_header(packet);

    return 0;
}
```

### Scenario 2: Simple JSON Value Representation

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// JSON value types
typedef enum {
    JSON_NULL,
    JSON_BOOL,
    JSON_NUMBER,
    JSON_STRING,
    JSON_ARRAY,
    JSON_OBJECT
} JsonType;

// Forward declarations
typedef struct JsonValue JsonValue;
typedef struct JsonArray JsonArray;
typedef struct JsonObject JsonObject;

// JSON array
struct JsonArray {
    JsonValue *items;
    size_t count;
    size_t capacity;
};

// JSON object key-value pair
typedef struct {
    char *key;
    JsonValue *value;
} JsonPair;

// JSON object
struct JsonObject {
    JsonPair *pairs;
    size_t count;
    size_t capacity;
};

// JSON value
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

// Creation functions
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

// Print JSON value
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

// Free JSON value
void json_free(JsonValue *v) {
    if (v == NULL) return;

    switch (v->type) {
        case JSON_STRING:
            free(v->data.string_val);
            break;
        case JSON_ARRAY:
            for (size_t i = 0; i < v->data.array_val->count; i++) {
                // Recursive free (simplified version)
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
    printf("=== JSON Value Example ===\n\n");

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

    printf("\nJsonValue size: %zu bytes\n", sizeof(JsonValue));

    return 0;
}
```

### Scenario 3: State Machine Implementation

```c
#include <stdio.h>
#include <string.h>

// State enumeration
typedef enum {
    STATE_IDLE,
    STATE_CONNECTING,
    STATE_CONNECTED,
    STATE_DISCONNECTING,
    STATE_ERROR,
    STATE_COUNT
} ConnectionState;

// Event enumeration
typedef enum {
    EVENT_CONNECT,
    EVENT_CONNECTED,
    EVENT_DISCONNECT,
    EVENT_DISCONNECTED,
    EVENT_ERROR,
    EVENT_RESET,
    EVENT_COUNT
} ConnectionEvent;

// State names
const char* state_names[] = {
    [STATE_IDLE] = "Idle",
    [STATE_CONNECTING] = "Connecting",
    [STATE_CONNECTED] = "Connected",
    [STATE_DISCONNECTING] = "Disconnecting",
    [STATE_ERROR] = "Error"
};

// Event names
const char* event_names[] = {
    [EVENT_CONNECT] = "Connect request",
    [EVENT_CONNECTED] = "Connection successful",
    [EVENT_DISCONNECT] = "Disconnect request",
    [EVENT_DISCONNECTED] = "Disconnected",
    [EVENT_ERROR] = "Error occurred",
    [EVENT_RESET] = "Reset"
};

// Connection context
typedef struct {
    ConnectionState state;
    int retry_count;
    char error_message[256];
} ConnectionContext;

// State handler function type
typedef void (*StateHandler)(ConnectionContext *ctx, ConnectionEvent event);

// State transition table
typedef struct {
    ConnectionState next_state;
    void (*action)(ConnectionContext *ctx);
} Transition;

// Action functions
void action_start_connect(ConnectionContext *ctx) {
    printf("  [Action] Starting connection...\n");
    ctx->retry_count = 0;
}

void action_complete_connect(ConnectionContext *ctx) {
    printf("  [Action] Connection established\n");
}

void action_start_disconnect(ConnectionContext *ctx) {
    printf("  [Action] Starting disconnection...\n");
}

void action_complete_disconnect(ConnectionContext *ctx) {
    printf("  [Action] Connection closed\n");
}

void action_handle_error(ConnectionContext *ctx) {
    printf("  [Action] Handling error: %s\n", ctx->error_message);
}

void action_reset(ConnectionContext *ctx) {
    printf("  [Action] Resetting connection state\n");
    ctx->retry_count = 0;
    ctx->error_message[0] = '\0';
}

// State transition table
// transition_table[current_state][event] = {next_state, action}
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

// Handle event
void handle_event(ConnectionContext *ctx, ConnectionEvent event) {
    ConnectionState current = ctx->state;
    Transition *trans = &transition_table[current][event];

    printf("\n[Event] %s (current state: %s)\n",
           event_names[event], state_names[current]);

    if (trans->next_state == 0 && trans->action == NULL) {
        printf("  [Warning] Ignoring event %s in state %s\n",
               event_names[event], state_names[current]);
        return;
    }

    // Execute action
    if (trans->action != NULL) {
        trans->action(ctx);
    }

    // Transition state
    if (trans->next_state != current) {
        ctx->state = trans->next_state;
        printf("  [Transition] %s -> %s\n",
               state_names[current], state_names[ctx->state]);
    }
}

int main() {
    printf("=== Connection State Machine Demo ===\n");

    ConnectionContext ctx = {
        .state = STATE_IDLE,
        .retry_count = 0,
        .error_message = ""
    };

    // Normal flow
    handle_event(&ctx, EVENT_CONNECT);
    handle_event(&ctx, EVENT_CONNECTED);
    handle_event(&ctx, EVENT_DISCONNECT);
    handle_event(&ctx, EVENT_DISCONNECTED);

    // Error handling
    handle_event(&ctx, EVENT_CONNECT);
    strcpy(ctx.error_message, "Connection timeout");
    handle_event(&ctx, EVENT_ERROR);
    handle_event(&ctx, EVENT_RESET);

    // Ignore invalid event
    handle_event(&ctx, EVENT_DISCONNECTED);

    return 0;
}
```

## Interview Key Points

### Question 1: What is the difference between a structure and a class?

**Answer**:
There is no class concept in C, only structures. In C++:
- Structure members are `public` by default, class members are `private` by default
- Structures use public inheritance by default, classes use private inheritance by default
- In all other aspects (methods, constructors, inheritance, etc.) they are identical

Structures in C can only contain data members, not function members (though they can contain function pointers).

### Question 2: Explain structure memory alignment

**Answer**:
```c
struct Example {
    char a;    // Offset 0, size 1
               // 3 bytes padding (align to 4-byte boundary)
    int b;     // Offset 4, size 4
    char c;    // Offset 8, size 1
               // 3 bytes padding (struct size must be multiple of max alignment)
};
// Total size: 12 bytes

// After optimization:
struct OptimizedExample {
    int b;     // Offset 0, size 4
    char a;    // Offset 4, size 1
    char c;    // Offset 5, size 1
               // 2 bytes padding
};
// Total size: 8 bytes
```

Alignment rules:
1. Structure members are stored in declaration order
2. Each member's offset must be a multiple of its alignment requirement
3. The total structure size must be a multiple of the largest member's alignment requirement

### Question 3: What are typical use cases for unions?

**Answer**:
1. **Type punning**: View different representations of data
   ```c
   union { float f; uint32_t bits; } u;
   u.f = 3.14f;
   printf("0x%X\n", u.bits);  // View bit representation of float
   ```

2. **Memory saving**: Store mutually exclusive data
   ```c
   struct Variant {
       int type;
       union { int i; float f; char *s; } data;
   };
   ```

3. **Network protocol parsing**: Parse different format packets

4. **Hardware register mapping**: Bit-by-bit access or whole access

### Question 4: What are the considerations for bit fields?

**Answer**:
1. **Poor portability**: Bit field memory layout depends on compiler
2. **Cannot take address**: `&bf.field` is illegal
3. **Crossing unit boundaries**: Some compilers don't allow bit fields to cross storage units
4. **Sign extension**: Signed bit fields may cause unexpected sign extension
5. **Alternative**: For portable code, use bit masks and shift operations

### Question 5: How to implement "object-oriented" in C?

**Answer**:
```c
// Encapsulation: use opaque pointers
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
// Implement functions...

// Inheritance: structure nesting
struct Animal {
    void (*speak)(void);
};

struct Dog {
    struct Animal base;  // "Inheritance"
    int age;
};

// Polymorphism: function pointers
struct Shape {
    double (*area)(struct Shape *self);
    void (*draw)(struct Shape *self);
};
```

### Question 6: What are flexible array members?

**Answer**:
A feature introduced in C99 that allows the last member of a structure to be an incomplete array type:

```c
struct FlexArray {
    int length;
    int data[];  // Flexible array member
};

// Usage
struct FlexArray *fa = malloc(sizeof(struct FlexArray) + n * sizeof(int));
fa->length = n;

// Notes
// 1. Must be the last member of the structure
// 2. The structure must have at least one other member
// 3. sizeof does not include the flexible array size
// 4. Cannot allocate structures with flexible arrays on the stack
```

## Further Reading

### Official Documentation and Standards

- [ISO/IEC 9899:2018 (C17)](https://www.iso.org/standard/74528.html) - Latest C language standard
- [cppreference - C Structures](https://en.cppreference.com/w/c/language/struct)
- [cppreference - C Unions](https://en.cppreference.com/w/c/language/union)
- [cppreference - C Enumerations](https://en.cppreference.com/w/c/language/enum)

### Classic Books

- "The C Programming Language" (K&R) - Brian Kernighan, Dennis Ritchie
- "Pointers on C" - Kenneth Reek
- "Expert C Programming" - Peter van der Linden
- "Computer Systems: A Programmer's Perspective" - Randal Bryant, David O'Hallaron

### Quality Articles

- [The Lost Art of Structure Packing](http://www.catb.org/esr/structure-packing/) - Eric S. Raymond
- [Data Alignment in C](https://developer.ibm.com/articles/pa-dalign/) - IBM Developer
- [Tagged Unions in C](https://www.embedded.com/tagged-unions-in-c/) - Embedded.com

### Tools and Practice

- [pahole](https://linux.die.net/man/1/pahole) - Analyze structure memory layout
- [Compiler Explorer](https://godbolt.org/) - View compiled assembly code
- [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) - Detect memory errors
