---
title: Optional、Variant与Any
description: C++17类型安全容器完全指南，std::optional、std::variant与std::any
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++
  - optional
  - variant
  - C++17
status: imported
origin: old/src/content/docs/cpp/optional-variant-any.zh.md
divergence: 0.256
issues: []
legacy:
  category: Cpp
  subcategory: 现代C++
  order: 14
  lastUpdated: 2026-01-07
---

C++17 引入了三个强大的类型安全容器：`std::optional`、`std::variant` 和 `std::any`。它们分别解决了不同的编程场景需求，让我们能够编写更安全、更具表达力的代码。

## 概述

| 容器 | 用途 | 类型安全 | 运行时开销 |
|------|------|----------|------------|
| `std::optional<T>` | 表示可能不存在的值 | 编译时确定类型 | 几乎无 |
| `std::variant<Ts...>` | 类型安全的联合体 | 编译时确定类型集合 | 无堆分配 |
| `std::any` | 存储任意类型 | 运行时类型检查 | 可能有堆分配 |

---

## std::optional：可选值的优雅表达

### 为什么需要 optional？

在 C++17 之前，表示"值可能不存在"通常有以下几种方式：

```cpp
// 方式1：使用指针（可能为nullptr）
int* findValue(const std::vector<int>& vec, int target);

// 方式2：使用特殊值表示"无效"
int findIndex(const std::vector<int>& vec, int target);  // 返回-1表示未找到

// 方式3：使用输出参数
bool findValue(const std::vector<int>& vec, int target, int& result);

// 方式4：抛出异常
int findValueOrThrow(const std::vector<int>& vec, int target);
```

这些方式都有各自的问题：指针需要管理内存、特殊值容易被误用、输出参数不够直观、异常开销较大。

### optional 基础用法

```cpp
#include <optional>
#include <string>
#include <iostream>

// 返回 optional 表示可能失败的操作
std::optional<int> parseInt(const std::string& str) {
    try {
        size_t pos;
        int result = std::stoi(str, &pos);
        if (pos == str.length()) {
            return result;  // 隐式转换为 optional
        }
        return std::nullopt;  // 表示"无值"
    } catch (...) {
        return std::nullopt;
    }
}

int main() {
    auto result1 = parseInt("42");
    auto result2 = parseInt("invalid");

    // 检查是否有值
    if (result1.has_value()) {
        std::cout << "解析成功: " << result1.value() << "\n";
    }

    // 使用 operator bool
    if (result2) {
        std::cout << "解析成功: " << *result2 << "\n";  // 使用 operator*
    } else {
        std::cout << "解析失败\n";
    }
}
```

### value_or：提供默认值

`value_or()` 是 `std::optional` 最实用的方法之一，它在值不存在时返回指定的默认值：

```cpp
#include <optional>
#include <string>
#include <iostream>
#include <map>

class Configuration {
    std::map<std::string, std::string> settings_;

public:
    std::optional<std::string> get(const std::string& key) const {
        auto it = settings_.find(key);
        if (it != settings_.end()) {
            return it->second;
        }
        return std::nullopt;
    }

    void set(const std::string& key, const std::string& value) {
        settings_[key] = value;
    }
};

int main() {
    Configuration config;
    config.set("host", "localhost");
    config.set("port", "8080");

    // 使用 value_or 提供默认值
    std::string host = config.get("host").value_or("127.0.0.1");
    std::string port = config.get("port").value_or("80");
    std::string timeout = config.get("timeout").value_or("30");  // 使用默认值

    std::cout << "Host: " << host << "\n";      // localhost
    std::cout << "Port: " << port << "\n";      // 8080
    std::cout << "Timeout: " << timeout << "\n"; // 30
}
```

### optional 的就地构造

使用 `std::in_place` 或 `emplace()` 可以避免不必要的拷贝：

```cpp
#include <optional>
#include <string>
#include <vector>

struct ExpensiveObject {
    std::vector<int> data;
    std::string name;

    ExpensiveObject(size_t size, const std::string& n)
        : data(size), name(n) {
        std::cout << "构造 ExpensiveObject\n";
    }
};

int main() {
    // 方式1：使用 std::in_place 就地构造
    std::optional<ExpensiveObject> opt1(std::in_place, 1000, "object1");

    // 方式2：使用 emplace
    std::optional<ExpensiveObject> opt2;
    opt2.emplace(2000, "object2");

    // 方式3：先创建再赋值（会产生移动/拷贝）
    std::optional<ExpensiveObject> opt3;
    opt3 = ExpensiveObject(3000, "object3");  // 额外的移动操作
}
```

### optional 与引用

`std::optional` 不能直接包含引用类型，但可以使用 `std::reference_wrapper`：

```cpp
#include <optional>
#include <functional>
#include <vector>
#include <algorithm>

class Database {
    std::vector<std::string> records_;

public:
    Database() : records_{"Alice", "Bob", "Charlie", "David"} {}

    // 返回对内部数据的引用
    std::optional<std::reference_wrapper<std::string>>
    find(const std::string& prefix) {
        auto it = std::find_if(records_.begin(), records_.end(),
            [&prefix](const std::string& s) {
                return s.compare(0, prefix.length(), prefix) == 0;
            });

        if (it != records_.end()) {
            return std::ref(*it);
        }
        return std::nullopt;
    }
};

int main() {
    Database db;

    if (auto result = db.find("Ch")) {
        std::cout << "找到: " << result->get() << "\n";
        result->get() = "Charles";  // 可以修改原数据
    }
}
```

### optional 的比较操作

`std::optional` 支持丰富的比较操作：

```cpp
#include <optional>
#include <iostream>

int main() {
    std::optional<int> empty;
    std::optional<int> five = 5;
    std::optional<int> ten = 10;
    std::optional<int> anotherFive = 5;

    // optional 之间的比较
    std::cout << std::boolalpha;
    std::cout << (five == anotherFive) << "\n";  // true
    std::cout << (five < ten) << "\n";            // true
    std::cout << (empty < five) << "\n";          // true（空值小于任何有值）

    // 与 nullopt 比较
    std::cout << (empty == std::nullopt) << "\n"; // true
    std::cout << (five == std::nullopt) << "\n";  // false

    // 与值直接比较
    std::cout << (five == 5) << "\n";             // true
    std::cout << (five < 10) << "\n";             // true
}
```

---

## std::variant：类型安全的联合体

### variant 基础

`std::variant` 是类型安全的联合体，可以在任意时刻存储其类型列表中的一个值：

```cpp
#include <variant>
#include <string>
#include <iostream>

int main() {
    // 可以存储 int、double 或 string
    std::variant<int, double, std::string> v;

    v = 42;                          // 存储 int
    std::cout << std::get<int>(v) << "\n";

    v = 3.14;                        // 存储 double
    std::cout << std::get<double>(v) << "\n";

    v = "Hello";                     // 存储 string
    std::cout << std::get<std::string>(v) << "\n";

    // 按索引访问
    v = 100;
    std::cout << std::get<0>(v) << "\n";  // 第一个类型是 int

    // 检查当前存储的类型
    std::cout << "当前索引: " << v.index() << "\n";

    // 安全检查
    if (std::holds_alternative<int>(v)) {
        std::cout << "当前是 int 类型\n";
    }
}
```

### std::visit：访问 variant 的优雅方式

`std::visit` 是访问 `variant` 值的首选方式，它接受一个可调用对象来处理所有可能的类型：

```cpp
#include <variant>
#include <string>
#include <iostream>

// 方式1：使用函数对象
struct Visitor {
    void operator()(int i) const {
        std::cout << "整数: " << i << "\n";
    }
    void operator()(double d) const {
        std::cout << "浮点数: " << d << "\n";
    }
    void operator()(const std::string& s) const {
        std::cout << "字符串: " << s << "\n";
    }
};

int main() {
    std::variant<int, double, std::string> v = "Hello";

    // 使用函数对象
    std::visit(Visitor{}, v);

    // 方式2：使用泛型 lambda
    v = 42;
    std::visit([](auto&& arg) {
        std::cout << "值: " << arg << "\n";
    }, v);

    // 方式3：使用 overloaded 模式（需要辅助结构）
    v = 3.14;
    std::visit([](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, int>) {
            std::cout << "这是整数: " << arg << "\n";
        } else if constexpr (std::is_same_v<T, double>) {
            std::cout << "这是浮点数: " << arg << "\n";
        } else {
            std::cout << "这是字符串: " << arg << "\n";
        }
    }, v);
}
```

### overloaded 模式

C++17 可以创建一个方便的 `overloaded` 辅助类来简化访问器的定义：

```cpp
#include <variant>
#include <string>
#include <iostream>

// overloaded 辅助模板
template<class... Ts>
struct overloaded : Ts... {
    using Ts::operator()...;
};

// C++17 需要这个推导指引
template<class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;

int main() {
    std::variant<int, double, std::string> v = "Hello, World!";

    std::visit(overloaded{
        [](int i) { std::cout << "整数: " << i << "\n"; },
        [](double d) { std::cout << "浮点数: " << d << "\n"; },
        [](const std::string& s) { std::cout << "字符串: " << s << "\n"; }
    }, v);
}
```

### 访问多个 variant

`std::visit` 可以同时访问多个 variant：

```cpp
#include <variant>
#include <string>
#include <iostream>

template<class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
template<class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;

int main() {
    using Var = std::variant<int, std::string>;

    Var v1 = 10;
    Var v2 = "hello";

    // 同时访问两个 variant
    std::visit(overloaded{
        [](int a, int b) {
            std::cout << "两个整数: " << a << ", " << b << "\n";
        },
        [](int a, const std::string& b) {
            std::cout << "整数和字符串: " << a << ", " << b << "\n";
        },
        [](const std::string& a, int b) {
            std::cout << "字符串和整数: " << a << ", " << b << "\n";
        },
        [](const std::string& a, const std::string& b) {
            std::cout << "两个字符串: " << a << ", " << b << "\n";
        }
    }, v1, v2);
}
```

### variant 的异常安全性

当 variant 赋值时抛出异常，它可能进入 `valueless_by_exception` 状态：

```cpp
#include <variant>
#include <string>
#include <iostream>

struct ThrowOnCopy {
    ThrowOnCopy() = default;
    ThrowOnCopy(const ThrowOnCopy&) {
        throw std::runtime_error("拷贝失败");
    }
    ThrowOnCopy(ThrowOnCopy&&) = default;
};

int main() {
    std::variant<int, ThrowOnCopy> v = 42;

    try {
        ThrowOnCopy t;
        v = t;  // 拷贝构造会抛出异常
    } catch (const std::exception& e) {
        std::cout << "异常: " << e.what() << "\n";

        // 检查 variant 是否处于无效状态
        if (v.valueless_by_exception()) {
            std::cout << "variant 处于无值状态\n";
        }
    }
}
```

### variant 实际应用：表达式解析器

```cpp
#include <variant>
#include <memory>
#include <string>
#include <iostream>
#include <cmath>

// 前向声明
struct BinaryOp;
struct UnaryOp;

// 表达式类型
using Expression = std::variant<
    double,                          // 数字字面量
    std::string,                     // 变量
    std::unique_ptr<BinaryOp>,       // 二元运算
    std::unique_ptr<UnaryOp>         // 一元运算
>;

struct BinaryOp {
    char op;
    Expression left;
    Expression right;

    BinaryOp(char o, Expression l, Expression r)
        : op(o), left(std::move(l)), right(std::move(r)) {}
};

struct UnaryOp {
    char op;
    Expression operand;

    UnaryOp(char o, Expression e)
        : op(o), operand(std::move(e)) {}
};

// 求值函数
double evaluate(const Expression& expr) {
    return std::visit([](auto&& arg) -> double {
        using T = std::decay_t<decltype(arg)>;

        if constexpr (std::is_same_v<T, double>) {
            return arg;
        } else if constexpr (std::is_same_v<T, std::string>) {
            // 简单示例：变量名转换为长度
            return static_cast<double>(arg.length());
        } else if constexpr (std::is_same_v<T, std::unique_ptr<BinaryOp>>) {
            double l = evaluate(arg->left);
            double r = evaluate(arg->right);
            switch (arg->op) {
                case '+': return l + r;
                case '-': return l - r;
                case '*': return l * r;
                case '/': return l / r;
                default: return 0;
            }
        } else if constexpr (std::is_same_v<T, std::unique_ptr<UnaryOp>>) {
            double v = evaluate(arg->operand);
            switch (arg->op) {
                case '-': return -v;
                case 's': return std::sqrt(v);  // sqrt
                default: return v;
            }
        }
    }, expr);
}

int main() {
    // 构建表达式: sqrt(3 * 3 + 4 * 4)
    Expression three = 3.0;
    Expression four = 4.0;

    Expression threeSquared = std::make_unique<BinaryOp>(
        '*', Expression{3.0}, Expression{3.0});
    Expression fourSquared = std::make_unique<BinaryOp>(
        '*', Expression{4.0}, Expression{4.0});
    Expression sum = std::make_unique<BinaryOp>(
        '+', std::move(threeSquared), std::move(fourSquared));
    Expression result = std::make_unique<UnaryOp>('s', std::move(sum));

    std::cout << "sqrt(3*3 + 4*4) = " << evaluate(result) << "\n";  // 5
}
```

---

## std::any：存储任意类型

### any 基础

`std::any` 可以存储任意可拷贝类型的值：

```cpp
#include <any>
#include <string>
#include <iostream>
#include <vector>

int main() {
    std::any a;

    // 检查是否有值
    std::cout << "有值: " << a.has_value() << "\n";  // false

    a = 42;
    std::cout << "类型: " << a.type().name() << "\n";
    std::cout << "值: " << std::any_cast<int>(a) << "\n";

    a = std::string("Hello");
    std::cout << "类型: " << a.type().name() << "\n";
    std::cout << "值: " << std::any_cast<std::string>(a) << "\n";

    a = std::vector<int>{1, 2, 3, 4, 5};
    auto& vec = std::any_cast<std::vector<int>&>(a);
    for (int v : vec) {
        std::cout << v << " ";
    }
    std::cout << "\n";

    // 重置
    a.reset();
    std::cout << "有值: " << a.has_value() << "\n";  // false
}
```

### any_cast 的安全使用

```cpp
#include <any>
#include <string>
#include <iostream>

int main() {
    std::any a = 42;

    // 方式1：值拷贝（类型错误时抛出 bad_any_cast）
    try {
        std::string s = std::any_cast<std::string>(a);
    } catch (const std::bad_any_cast& e) {
        std::cout << "类型转换失败: " << e.what() << "\n";
    }

    // 方式2：指针方式（类型错误时返回 nullptr）
    if (auto* p = std::any_cast<int>(&a)) {
        std::cout << "是整数: " << *p << "\n";
    }

    if (auto* p = std::any_cast<std::string>(&a)) {
        std::cout << "是字符串: " << *p << "\n";
    } else {
        std::cout << "不是字符串\n";
    }

    // 方式3：引用方式（可以修改原值）
    a = std::string("Hello");
    std::any_cast<std::string&>(a) += ", World!";
    std::cout << std::any_cast<std::string>(a) << "\n";
}
```

### any 的就地构造

```cpp
#include <any>
#include <string>
#include <vector>
#include <iostream>

struct ComplexType {
    std::string name;
    std::vector<int> data;

    ComplexType(const std::string& n, std::initializer_list<int> d)
        : name(n), data(d) {
        std::cout << "构造 ComplexType\n";
    }
};

int main() {
    // 使用 std::in_place_type 就地构造
    std::any a(std::in_place_type<ComplexType>, "test", std::initializer_list<int>{1, 2, 3});

    // 使用 emplace
    std::any b;
    b.emplace<std::vector<int>>(10, 42);  // 10个42

    auto& vec = std::any_cast<std::vector<int>&>(b);
    std::cout << "大小: " << vec.size() << "\n";

    // 使用 make_any
    auto c = std::make_any<std::string>("Hello, Any!");
    std::cout << std::any_cast<std::string>(c) << "\n";
}
```

### any 实际应用：属性系统

```cpp
#include <any>
#include <string>
#include <map>
#include <iostream>
#include <typeinfo>

class PropertyBag {
    std::map<std::string, std::any> properties_;

public:
    template<typename T>
    void set(const std::string& name, T&& value) {
        properties_[name] = std::forward<T>(value);
    }

    template<typename T>
    std::optional<T> get(const std::string& name) const {
        auto it = properties_.find(name);
        if (it != properties_.end()) {
            if (auto* p = std::any_cast<T>(&it->second)) {
                return *p;
            }
        }
        return std::nullopt;
    }

    template<typename T>
    T getOr(const std::string& name, T defaultValue) const {
        return get<T>(name).value_or(std::move(defaultValue));
    }

    bool has(const std::string& name) const {
        return properties_.find(name) != properties_.end();
    }

    void remove(const std::string& name) {
        properties_.erase(name);
    }

    void printAll() const {
        for (const auto& [name, value] : properties_) {
            std::cout << name << ": " << value.type().name() << "\n";
        }
    }
};

int main() {
    PropertyBag bag;

    bag.set("name", std::string("GameObject"));
    bag.set("health", 100);
    bag.set("position", std::vector<double>{1.0, 2.0, 3.0});
    bag.set("active", true);

    std::cout << "名称: " << bag.getOr<std::string>("name", "Unknown") << "\n";
    std::cout << "生命值: " << bag.getOr<int>("health", 0) << "\n";
    std::cout << "速度: " << bag.getOr<double>("speed", 1.0) << "\n";  // 使用默认值

    if (auto pos = bag.get<std::vector<double>>("position")) {
        std::cout << "位置: ";
        for (double v : *pos) {
            std::cout << v << " ";
        }
        std::cout << "\n";
    }

    std::cout << "\n所有属性:\n";
    bag.printAll();
}
```

---

## 三者对比

### 内存布局

```cpp
#include <optional>
#include <variant>
#include <any>
#include <string>
#include <iostream>

int main() {
    std::cout << "sizeof(int): " << sizeof(int) << "\n";
    std::cout << "sizeof(std::string): " << sizeof(std::string) << "\n";
    std::cout << "sizeof(std::optional<int>): " << sizeof(std::optional<int>) << "\n";
    std::cout << "sizeof(std::optional<std::string>): " << sizeof(std::optional<std::string>) << "\n";
    std::cout << "sizeof(std::variant<int, std::string>): " << sizeof(std::variant<int, std::string>) << "\n";
    std::cout << "sizeof(std::any): " << sizeof(std::any) << "\n";
}

// 典型输出（64位系统）：
// sizeof(int): 4
// sizeof(std::string): 32
// sizeof(std::optional<int>): 8
// sizeof(std::optional<std::string>): 40
// sizeof(std::variant<int, std::string>): 40
// sizeof(std::any): 16（但可能有堆分配）
```

### 性能对比

```cpp
#include <optional>
#include <variant>
#include <any>
#include <chrono>
#include <iostream>
#include <vector>

template<typename Func>
auto measure(Func&& f, int iterations = 1000000) {
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        f();
    }
    auto end = std::chrono::high_resolution_clock::now();
    return std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
}

int main() {
    volatile int sink = 0;

    // optional 性能
    auto optionalTime = measure([&]() {
        std::optional<int> opt = 42;
        if (opt) sink = *opt;
    });

    // variant 性能
    auto variantTime = measure([&]() {
        std::variant<int, double> var = 42;
        sink = std::get<int>(var);
    });

    // any 性能
    auto anyTime = measure([&]() {
        std::any a = 42;
        sink = std::any_cast<int>(a);
    });

    std::cout << "optional: " << optionalTime << " us\n";
    std::cout << "variant:  " << variantTime << " us\n";
    std::cout << "any:      " << anyTime << " us\n";
}
```

### 选择指南

| 场景 | 推荐使用 | 原因 |
|------|----------|------|
| 函数可能返回空值 | `std::optional` | 明确表达意图，零开销 |
| 值可能是几种固定类型之一 | `std::variant` | 编译时类型安全，无堆分配 |
| 需要存储任意类型 | `std::any` | 最大灵活性 |
| 替代可空指针 | `std::optional` | 更安全，语义更清晰 |
| 实现状态机 | `std::variant` | 类型即状态，编译器检查 |
| 插件系统/脚本绑定 | `std::any` | 运行时类型灵活性 |
| 配置系统 | `std::any` 或 `std::variant` | 取决于类型是否固定 |

---

## 实际应用案例

### 案例1：数据库查询结果

```cpp
#include <optional>
#include <variant>
#include <string>
#include <vector>
#include <iostream>
#include <map>

// 数据库单元格可以是多种类型或 NULL
using DBValue = std::optional<std::variant<
    int,
    double,
    std::string,
    bool,
    std::vector<unsigned char>  // BLOB
>>;

class QueryResult {
    std::vector<std::string> columns_;
    std::vector<std::map<std::string, DBValue>> rows_;

public:
    void addColumn(const std::string& name) {
        columns_.push_back(name);
    }

    void addRow(const std::map<std::string, DBValue>& row) {
        rows_.push_back(row);
    }

    template<typename T>
    std::optional<T> get(size_t row, const std::string& column) const {
        if (row >= rows_.size()) return std::nullopt;

        auto it = rows_[row].find(column);
        if (it == rows_[row].end() || !it->second.has_value()) {
            return std::nullopt;
        }

        if (auto* p = std::get_if<T>(&it->second.value())) {
            return *p;
        }
        return std::nullopt;
    }

    size_t rowCount() const { return rows_.size(); }
};

int main() {
    QueryResult result;
    result.addColumn("id");
    result.addColumn("name");
    result.addColumn("score");

    result.addRow({
        {"id", DBValue{1}},
        {"name", DBValue{std::string("Alice")}},
        {"score", DBValue{95.5}}
    });

    result.addRow({
        {"id", DBValue{2}},
        {"name", DBValue{std::string("Bob")}},
        {"score", std::nullopt}  // NULL 值
    });

    for (size_t i = 0; i < result.rowCount(); ++i) {
        auto id = result.get<int>(i, "id");
        auto name = result.get<std::string>(i, "name");
        auto score = result.get<double>(i, "score");

        std::cout << "ID: " << id.value_or(-1)
                  << ", Name: " << name.value_or("N/A")
                  << ", Score: " << (score ? std::to_string(*score) : "NULL")
                  << "\n";
    }
}
```

### 案例2：JSON 解析器

```cpp
#include <variant>
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <iostream>
#include <iomanip>

// 前向声明
struct JsonObject;
struct JsonArray;

// JSON 值类型
using JsonValue = std::variant<
    std::nullptr_t,                      // null
    bool,                                // boolean
    double,                              // number
    std::string,                         // string
    std::unique_ptr<JsonArray>,          // array
    std::unique_ptr<JsonObject>          // object
>;

struct JsonArray {
    std::vector<JsonValue> elements;
};

struct JsonObject {
    std::map<std::string, JsonValue> members;
};

// 打印 JSON
void printJson(const JsonValue& value, int indent = 0);

void printIndent(int indent) {
    for (int i = 0; i < indent; ++i) std::cout << "  ";
}

void printJson(const JsonValue& value, int indent) {
    std::visit([indent](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;

        if constexpr (std::is_same_v<T, std::nullptr_t>) {
            std::cout << "null";
        } else if constexpr (std::is_same_v<T, bool>) {
            std::cout << (arg ? "true" : "false");
        } else if constexpr (std::is_same_v<T, double>) {
            std::cout << arg;
        } else if constexpr (std::is_same_v<T, std::string>) {
            std::cout << std::quoted(arg);
        } else if constexpr (std::is_same_v<T, std::unique_ptr<JsonArray>>) {
            std::cout << "[\n";
            for (size_t i = 0; i < arg->elements.size(); ++i) {
                printIndent(indent + 1);
                printJson(arg->elements[i], indent + 1);
                if (i < arg->elements.size() - 1) std::cout << ",";
                std::cout << "\n";
            }
            printIndent(indent);
            std::cout << "]";
        } else if constexpr (std::is_same_v<T, std::unique_ptr<JsonObject>>) {
            std::cout << "{\n";
            size_t i = 0;
            for (const auto& [key, val] : arg->members) {
                printIndent(indent + 1);
                std::cout << std::quoted(key) << ": ";
                printJson(val, indent + 1);
                if (i < arg->members.size() - 1) std::cout << ",";
                std::cout << "\n";
                ++i;
            }
            printIndent(indent);
            std::cout << "}";
        }
    }, value);
}

int main() {
    // 构建 JSON: {"name": "John", "age": 30, "scores": [95, 87, 92]}
    auto scores = std::make_unique<JsonArray>();
    scores->elements.push_back(95.0);
    scores->elements.push_back(87.0);
    scores->elements.push_back(92.0);

    auto root = std::make_unique<JsonObject>();
    root->members["name"] = std::string("John");
    root->members["age"] = 30.0;
    root->members["active"] = true;
    root->members["data"] = nullptr;
    root->members["scores"] = std::move(scores);

    JsonValue json = std::move(root);
    printJson(json);
    std::cout << "\n";
}
```

### 案例3：事件系统

```cpp
#include <variant>
#include <any>
#include <string>
#include <functional>
#include <map>
#include <vector>
#include <iostream>

// 定义事件类型
struct MouseEvent {
    int x, y;
    int button;
};

struct KeyEvent {
    int keyCode;
    bool shift, ctrl, alt;
};

struct WindowEvent {
    int width, height;
    bool minimized;
};

// 事件变体
using Event = std::variant<MouseEvent, KeyEvent, WindowEvent>;

// 事件处理器
class EventDispatcher {
    std::map<std::string, std::vector<std::function<void(const Event&)>>> handlers_;

public:
    void subscribe(const std::string& eventType,
                   std::function<void(const Event&)> handler) {
        handlers_[eventType].push_back(std::move(handler));
    }

    void dispatch(const std::string& eventType, const Event& event) {
        auto it = handlers_.find(eventType);
        if (it != handlers_.end()) {
            for (auto& handler : it->second) {
                handler(event);
            }
        }
    }
};

int main() {
    EventDispatcher dispatcher;

    // 订阅鼠标事件
    dispatcher.subscribe("mouse", [](const Event& e) {
        std::visit([](auto&& arg) {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, MouseEvent>) {
                std::cout << "鼠标点击: (" << arg.x << ", " << arg.y
                          << "), 按钮: " << arg.button << "\n";
            }
        }, e);
    });

    // 订阅键盘事件
    dispatcher.subscribe("keyboard", [](const Event& e) {
        std::visit([](auto&& arg) {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, KeyEvent>) {
                std::cout << "按键: " << arg.keyCode;
                if (arg.ctrl) std::cout << " +Ctrl";
                if (arg.shift) std::cout << " +Shift";
                if (arg.alt) std::cout << " +Alt";
                std::cout << "\n";
            }
        }, e);
    });

    // 派发事件
    dispatcher.dispatch("mouse", MouseEvent{100, 200, 0});
    dispatcher.dispatch("keyboard", KeyEvent{65, true, true, false});  // Ctrl+Shift+A
}
```

---

## 最佳实践

### 优先使用 optional 替代空指针

```cpp
// 不推荐
User* findUser(int id);

// 推荐
std::optional<User> findUser(int id);
// 或者返回引用
std::optional<std::reference_wrapper<User>> findUser(int id);
```

### variant 配合 visit 使用

```cpp
// 不推荐：手动检查类型
if (std::holds_alternative<int>(v)) {
    doSomething(std::get<int>(v));
} else if (std::holds_alternative<double>(v)) {
    doSomething(std::get<double>(v));
}

// 推荐：使用 visit
std::visit([](auto&& arg) { doSomething(arg); }, v);
```

### 避免过度使用 any

```cpp
// 不推荐：当类型固定时使用 any
std::any value = 42;  // 已知只会存储 int

// 推荐：使用 optional 或 variant
std::optional<int> value = 42;
```

### 注意 any 的性能开销

```cpp
// 小对象优化：小于一定大小的类型可能不需要堆分配
// 但大对象会触发堆分配

// 在性能敏感的代码中避免频繁创建/销毁 any 对象
```

---

## 总结

| 特性 | optional | variant | any |
|------|----------|---------|-----|
| 存储类型数量 | 1个 | N个（编译时确定） | 任意 |
| 类型安全 | 编译时 | 编译时 | 运行时 |
| 空状态 | `std::nullopt` | `valueless_by_exception` | `!has_value()` |
| 访问方式 | `value()`, `*`, `->` | `get<>`, `visit` | `any_cast` |
| 堆分配 | 无 | 无 | 可能有 |
| 使用场景 | 可选返回值 | 类型安全联合体 | 类型擦除 |

这三个工具各有其适用场景，正确使用它们可以让代码更加安全、清晰和高效。在选择时，请遵循"够用就好"的原则：优先考虑 `optional`，其次是 `variant`，最后才是 `any`。
