---
title: optional、variant 和 any
description: 使用 std::optional、std::variant 和 std::any 处理可选值和类型安全的联合类型
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - cpp
  - optional
  - variant
  - any
  - cpp17
status: imported
origin: old/src/content/docs/cpp/optional-variant.zh.md
divergence: 0.227
issues: []
legacy:
  category: Cpp
  subcategory: Modern C++
  order: 30
  lastUpdated: 2026-01-07
---

现代 C++ 引入了三个强大的类型安全机制来处理可选值、类型安全的联合类型和类型擦除。这些工具消除了对哨兵值、空指针和不安全类型转换的需求，同时保持性能和代码清晰性。

## std::optional

`std::optional<T>` 表示一个可能存在也可能不存在的值。它是使用空指针或哨兵值的类型安全替代方案。

### 基本用法

```cpp
#include <optional>
#include <iostream>

std::optional<int> divide(int a, int b) {
    if (b == 0) {
        return std::nullopt;  // 无值
    }
    return a / b;  // 值存在
}

int main() {
    auto result = divide(10, 2);

    // 检查值是否存在
    if (result.has_value()) {
        std::cout << "Result: " << result.value() << std::endl;
    }

    // 使用 operator*（如果无值则行为未定义）
    if (result) {
        std::cout << "Result: " << *result << std::endl;
    }

    // 使用 value_or() 提供默认值
    std::cout << "Result: " << result.value_or(0) << std::endl;
}
```

### 成员函数

- `has_value()`：检查值是否存在
- `value()`：获取包含的值（如果为空则抛出 `std::bad_optional_access`）
- `operator*`：获取包含的值（如果为空则行为未定义）
- `operator->`：访问包含值的成员
- `value_or(default)`：获取值或返回默认值
- `emplace(args...)`：原地构造值
- `reset()`：移除包含的值

### 与函数配合使用

```cpp
#include <optional>
#include <string>

std::optional<std::string> find_user(int id) {
    if (id > 0 && id <= 100) {
        return "User" + std::to_string(id);
    }
    return std::nullopt;
}

int main() {
    // 使用 and_then 链接操作
    auto user = find_user(5);

    // 如果值存在则转换该值
    auto transformed = user.transform(
        [](const auto& str) { return str.length(); }
    );

    if (transformed) {
        std::cout << "Username length: " << *transformed << std::endl;
    }
}
```

### 单子操作（C++23）

C++23 引入了单子操作用于函数组合：

```cpp
#include <optional>

std::optional<int> parse_int(const std::string& str);
std::optional<int> validate_range(int value);

int main() {
    std::string input = "42";

    // 使用 and_then 链接操作
    auto result = parse_int(input)
        .and_then(validate_range)
        .transform([](int x) { return x * 2; });

    if (result) {
        std::cout << "Final result: " << *result << std::endl;
    }
}
```

## std::variant

`std::variant<T1, T2, ...>` 是一个可以保存其指定类型中任意一个的类型安全联合。与 C 风格的联合不同，它会跟踪当前活动的类型。

### 基本用法

```cpp
#include <variant>
#include <iostream>
#include <string>

using Response = std::variant<int, std::string, double>;

Response process_data(int type) {
    switch (type) {
        case 1: return 42;
        case 2: return std::string("success");
        case 3: return 3.14;
        default: return std::string("error");
    }
}

int main() {
    Response resp = process_data(1);

    // 检查哪种类型处于活动状态
    if (std::holds_alternative<int>(resp)) {
        std::cout << "Integer: " << std::get<int>(resp) << std::endl;
    }

    // 按索引访问
    std::cout << "Index: " << resp.index() << std::endl;
}
```

### 访问者模式

访问者模式提供了一种安全的方式来处理 variant 值。它确保所有类型都被处理：

```cpp
#include <variant>
#include <iostream>
#include <string>

struct Response {
    int code;
    std::variant<int, std::string, double> data;
};

// 函数对象访问者
struct DataHandler {
    void operator()(int value) const {
        std::cout << "Integer value: " << value << std::endl;
    }

    void operator()(const std::string& value) const {
        std::cout << "String value: " << value << std::endl;
    }

    void operator()(double value) const {
        std::cout << "Double value: " << value << std::endl;
    }
};

int main() {
    Response resp{200, 42};

    // 应用访问者
    std::visit(DataHandler{}, resp.data);

    resp.data = std::string("Hello");
    std::visit(DataHandler{}, resp.data);
}
```

### Lambda 访问者（C++20）

C++20 使用推导函数调用操作符简化了访问者：

```cpp
#include <variant>
#include <iostream>

using Value = std::variant<int, double, std::string>;

int main() {
    Value v = 42;

    // 带有 auto 的 Lambda 访问者
    std::visit([](auto&& arg) {
        std::cout << "Type: " << typeid(arg).name() << std::endl;
    }, v);

    // 多重重载（需要 Lambda 在重载集合中）
    struct Visitor {
        void operator()(int x) { std::cout << "Int: " << x << std::endl; }
        void operator()(double x) { std::cout << "Double: " << x << std::endl; }
        void operator()(const std::string& x) { std::cout << "String: " << x << std::endl; }
    };

    std::visit(Visitor{}, v);
}
```

### 重载模式（C++17）

用于从多个 Lambda 创建访问者的有用模式：

```cpp
#include <variant>

// 用于组合 Lambda 重载的辅助类
template<class... Ts> struct overload : Ts... { using Ts::operator()...; };
template<class... Ts> overload(Ts...) -> overload<Ts...>;  // 推导指南

int main() {
    std::variant<int, double, std::string> v = 3.14;

    std::visit(overload{
        [](int x) { std::cout << "Int: " << x << std::endl; },
        [](double x) { std::cout << "Double: " << x << std::endl; },
        [](const std::string& x) { std::cout << "String: " << x << std::endl; }
    }, v);
}
```

### 常见操作

```cpp
#include <variant>

using Data = std::variant<int, std::string>;

int main() {
    Data data = 42;

    // 使用 std::get_if 安全访问（返回指针）
    if (auto* ptr = std::get_if<int>(&data)) {
        std::cout << "Got int: " << *ptr << std::endl;
    }

    // 赋值和转换
    data = std::string("text");

    // 检查活动类型
    std::cout << "Index: " << data.index() << std::endl;

    // 获取类型数量
    std::cout << "Alternatives: " << std::variant_size_v<Data> << std::endl;
}
```

## std::any

`std::any` 是一个可以保存任何可复制类型的类型擦除容器。与 `std::variant` 不同，你不需要预先声明类型，但会失去类型安全性。

### 基本用法

```cpp
#include <any>
#include <iostream>
#include <string>

int main() {
    std::any value = 42;
    std::cout << "Integer: " << std::any_cast<int>(value) << std::endl;

    value = std::string("Hello");
    std::cout << "String: " << std::any_cast<std::string>(value) << std::endl;

    value = 3.14;
    std::cout << "Double: " << std::any_cast<double>(value) << std::endl;
}
```

### 安全访问

```cpp
#include <any>
#include <iostream>

int main() {
    std::any value = 42;

    // 检查类型
    if (value.type() == typeid(int)) {
        std::cout << "Contains int" << std::endl;
    }

    // 使用 try-catch 进行安全转换
    try {
        int x = std::any_cast<int>(value);
        std::cout << "Value: " << x << std::endl;
    } catch (const std::bad_any_cast& e) {
        std::cout << "Type mismatch: " << e.what() << std::endl;
    }

    // 指针转换（类型不匹配时返回 nullptr）
    if (auto ptr = std::any_cast<double>(&value)) {
        std::cout << "Double: " << *ptr << std::endl;
    } else {
        std::cout << "Not a double" << std::endl;
    }
}
```

### 使用场景

```cpp
#include <any>
#include <map>
#include <string>
#include <vector>

// 配置存储
class Config {
    std::map<std::string, std::any> settings;

public:
    template<typename T>
    void set(const std::string& key, T value) {
        settings[key] = value;
    }

    template<typename T>
    T get(const std::string& key) {
        return std::any_cast<T>(settings.at(key));
    }
};

// 通用容器
std::vector<std::any> heterogeneous_data;
heterogeneous_data.push_back(42);
heterogeneous_data.push_back(std::string("text"));
heterogeneous_data.push_back(3.14);
```

## 比较和最佳实践

### 何时使用各种类型

| 特性 | optional | variant | any |
|---------|----------|---------|-----|
| 值的数量 | 0 或 1 | N 选 1 | 无限制 1 个 |
| 类型安全 | 完全 | 完全 | 运行时 |
| 性能 | 零成本 | 零成本 | 有开销 |
| 编译时检查 | 是 | 是 | 否 |
| 预定义类型 | 是 | 是 | 否 |

### 实际示例

```cpp
#include <optional>
#include <variant>
#include <iostream>
#include <string>

// 对于"可能有值"使用 optional
std::optional<int> parse_number(const std::string& str) {
    try {
        return std::stoi(str);
    } catch (...) {
        return std::nullopt;
    }
}

// 对于结果类型使用 variant
using ParseResult = std::variant<int, std::string>;

ParseResult parse_value(const std::string& str) {
    if (auto num = parse_number(str)) {
        return *num;
    }
    return "Failed to parse: " + str;
}

// 使用访问者处理结果
int main() {
    auto result = parse_value("42");

    std::visit([](auto&& arg) {
        if constexpr (std::is_same_v<decltype(arg), int>) {
            std::cout << "Parsed: " << arg << std::endl;
        } else {
            std::cout << "Error: " << arg << std::endl;
        }
    }, result);
}
```

## 性能考虑

- **std::optional**：零开销抽象，仅为存储 + 布尔标志
- **std::variant**：零开销抽象，使用判别联合
- **std::any**：由于 RTTI 和虚函数调用而产生运行时开销

```cpp
#include <optional>
#include <variant>
#include <any>
#include <memory>

// 等效的存储需求
struct OptionalInt {
    int value;
    bool has_value;  // 1 字节 + 填充
};

union VariantStorage {
    int i;
    double d;
};

struct VariantInt {
    VariantStorage data;
    unsigned index;  // 判别器
};

// std::any 需要堆分配
std::any a = 42;  // 可能分配内存
```

## 关键要点

1. **std::optional** 消除了可选数据的空指针和哨兵值
2. **std::variant** 提供具有编译时检查的类型安全联合
3. **std::any** 在编译时类型未知时实现运行时类型擦除
4. 使用 `std::visit()` 的访问者安全处理 variant 值
5. 优先选择编译时解决方案（`optional`、`variant`）而非运行时方案（`any`）
6. 与原始指针或 `void*` 等替代方案相比，所有三个都是零成本抽象

这些工具构成了现代、安全的 C++ 编程实践的基础。
