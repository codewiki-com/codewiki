---
title: C++20 std::format 字符串格式化
description: 深入理解 C++20 std::format：编译时格式化、类型安全、性能优势与 printf 的完全替代
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++20
  - format
  - 字符串格式化
  - 编译时检查
  - 类型安全
status: imported
origin: old/src/content/docs/cpp/format.zh.md
divergence: 0.245
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Cpp
  subcategory: 标准库
  order: 45
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 std::format

`std::format` 是 C++20 引入的现代字符串格式化库，提供了一种类型安全、性能优异的方式来格式化字符串。它完全替代了传统的 `printf` 族函数，同时提供了类似 Python 和 Rust 等现代语言的格式化语法。

```cpp
#include <format>

std::string result = std::format("Hello, {}!", "World");
// result = "Hello, World!"
```

### std::format 的核心特点

| 特性 | std::format | printf | std::stringstream |
|------|-----------|--------|------------------|
| 类型安全 | ✓ 编译时检查 | ✗ 运行时崩溃 | ✓ 编译时检查 |
| 性能 | ✓ 高（编译时优化） | ~ 中等 | ✗ 低（状态管理） |
| 易用性 | ✓ 简洁清晰 | ✓ 简洁但易错 | ✗ 冗长 |
| 自定义格式 | ✓ 简单 | ✗ 复杂 | ✓ 可行但繁琐 |
| 编译时检查 | ✓ 支持 | ✗ 不支持 | ✓ 部分支持 |

### 历史背景

传统的字符串格式化方案存在诸多问题：

- **printf 系列**：类型不安全，格式串与参数类型不匹配易导致崩溃或内存溢出
- **std::stringstream**：冗长、性能较低、状态管理复杂
- **sprintf**：缓冲区溢出风险

C++20 通过引入 `std::format` 借鉴了 Python 的 `str.format` 和 Rust 的 `format!` 宏的设计理念，提供了一种现代、安全、高效的解决方案。

## 核心原理

### 格式字符串的编译时解析

`std::format` 的关键创新是在编译时解析和验证格式字符串，而不是在运行时。

```cpp
// 编译时检查，格式字符串错误会在编译阶段被发现
std::string result = std::format("{0} {1}", "Hello");
// 编译错误！参数不足

std::string result = std::format("{3}", "a", "b", "c");
// 编译错误！索引越界

// 正确的用法
std::string result = std::format("{0} {1}", "Hello", "World");
```

### 可变参数模板与类型擦除

`std::format` 内部使用了高级的 C++ 模板技术来实现类型安全：

```cpp
// 简化的实现原理
template<typename... Args>
std::string format(std::string_view fmt, Args&&... args) {
    // 1. 编译时：解析格式字符串，验证占位符与参数数量
    // 2. 编译时：生成类型转换代码
    // 3. 运行时：执行格式化和写入
}
```

### 格式说明符（Format Specifier）语法

格式说明符遵循 Python 格式字符串的语法：

```
{[参数索引][:格式说明]}

参数索引: 可选的整数，指定使用第几个参数
格式说明: 包括对齐、宽度、精度、数值进制等信息
```

完整的格式说明符语法：

```
{[arg-id][:[[fill]align][sign][#][0][width][.precision][type]]}

- fill:       填充字符
- align:      <（左对齐）| >（右对齐）| ^（居中）| =（符号后填充）
- sign:       +（总显示符号）| -（仅负数显示）| ' '（正数前空格）
- #:          备用形式（0x 前缀等）
- 0:          用 0 填充（相当于宽度和 = 对齐）
- width:      最小宽度
- precision:  精度（小数位数或字符串长度）
- type:       输出类型（b/B、o、x/X、d、e/E、f/F、g/G、s 等）
```

### 自定义类型的格式化

通过特化 `std::formatter` 可以为自定义类型提供格式化支持：

```cpp
template<>
struct std::formatter<MyClass> : std::formatter<std::string> {
    template<typename FormatContext>
    auto format(const MyClass& obj, FormatContext& ctx) const {
        // 将对象转换为字符串并格式化
        return std::formatter<std::string>::format(
            std::format("MyClass({})", obj.value), ctx);
    }
};
```

## 核心要点

### 参数索引与自动编号

```cpp
// 自动编号
std::format("{} + {} = {}", 1, 2, 3);  // "1 + 2 = 3"

// 显式索引
std::format("{2} {1} {0}", "a", "b", "c");  // "c b a"

// 混合使用（可以但不推荐）
std::format("{} {} {2}", "a", "b", "c");  // "a b c"
```

### 对齐和填充

```cpp
std::format("{:>10}", "right");        // "     right"（右对齐）
std::format("{:<10}", "left");         // "left     "（左对齐）
std::format("{:^10}", "center");       // "  center "（居中）
std::format("{:*^10}", "fill");        // "***fill***"（用 * 填充）
std::format("{:=+10}", 42);            // "+      42"（符号后填充）
```

### 数值格式化

```cpp
// 整数进制
std::format("{:d}", 255);              // "255"（十进制）
std::format("{:x}", 255);              // "ff"（小写十六进制）
std::format("{:X}", 255);              // "FF"（大写十六进制）
std::format("{:o}", 255);              // "377"（八进制）
std::format("{:b}", 255);              // "11111111"（二进制）
std::format("{:#x}", 255);             // "0xff"（带前缀）

// 浮点数格式化
std::format("{:.2f}", 3.14159);        // "3.14"（固定小数位）
std::format("{:.2e}", 1234.5);         // "1.23e+03"（科学记数法）
std::format("{:.2g}", 1234.5);         // "1.2e+03"（通用格式）

// 符号显示
std::format("{:+d}", 42);              // "+42"
std::format("{:+d}", -42);             // "-42"
std::format("{: d}", 42);              // " 42"（正数前加空格）
std::format("{: d}", -42);             // "-42"
```

### 字符串和字符格式化

```cpp
std::format("{}", "hello");            // "hello"
std::format("{:>10}", "hello");        // "     hello"
std::format("{:.3}", "hello");         // "hel"（截断到 3 字符）
std::format("{:>10.3}", "hello");      // "       hel"（截断并对齐）
std::format("{:c}", 65);               // "A"（整数转字符）
```

### 布尔值格式化

```cpp
std::format("{}", true);               // "true"
std::format("{}", false);              // "false"
std::format("{:d}", true);             // "1"
std::format("{:d}", false);            // "0"
```

## 代码示例

### 基础示例

```cpp
#include <format>
#include <iostream>

int main() {
    // 基本格式化
    std::cout << std::format("Hello, {}!", "World") << '\n';

    // 多个参数
    std::cout << std::format("{} + {} = {}", 1, 2, 3) << '\n';

    // 参数索引
    std::cout << std::format("{1} {0}", "World", "Hello") << '\n';

    // 存储为字符串
    std::string message = std::format("The answer is {}", 42);
    std::cout << message << '\n';

    return 0;
}

// 输出：
// Hello, World!
// 1 + 2 = 3
// Hello World
// The answer is 42
```

### 高级数值格式化

```cpp
#include <format>
#include <iostream>

int main() {
    int value = 255;
    double pi = 3.14159265359;

    // 不同进制
    std::cout << "Decimal: " << std::format("{:d}", value) << '\n';
    std::cout << "Hex: " << std::format("{:x}", value) << '\n';
    std::cout << "Octal: " << std::format("{:o}", value) << '\n';
    std::cout << "Binary: " << std::format("{:b}", value) << '\n';

    // 浮点数精度
    std::cout << "Float: " << std::format("{:.2f}", pi) << '\n';
    std::cout << "Scientific: " << std::format("{:.2e}", pi) << '\n';

    // 宽度和对齐
    std::cout << std::format("|{:10}|", "left") << '\n';
    std::cout << std::format("|{:>10}|", "right") << '\n';
    std::cout << std::format("|{:^10}|", "center") << '\n';

    // 填充字符
    std::cout << std::format("{:*>10}", 42) << '\n';

    return 0;
}

// 输出：
// Decimal: 255
// Hex: ff
// Octal: 377
// Binary: 11111111
// Float: 3.14
// Scientific: 3.14e+00
// |left      |
// |     right|
// |  center  |
// *******42
```

### 自定义类型的格式化

```cpp
#include <format>
#include <iostream>
#include <string>

struct Point {
    int x, y;
};

// 为 Point 类型定制格式化
template<>
struct std::formatter<Point> {
    constexpr auto parse(std::format_parse_context& ctx) {
        return ctx.begin();
    }

    auto format(const Point& p, std::format_context& ctx) const {
        return std::format_to(ctx.out(), "({}, {})", p.x, p.y);
    }
};

int main() {
    Point p{10, 20};
    std::cout << std::format("Point: {}", p) << '\n';
    std::cout << std::format("Points: {} and {}", p, Point{5, 15}) << '\n';

    return 0;
}

// 输出：
// Point: (10, 20)
// Points: (10, 20) and (5, 15)
```

### 使用 std::format_to 追加到缓冲区

```cpp
#include <format>
#include <iostream>
#include <vector>

int main() {
    std::string buffer;

    // 使用 format_to 追加到字符串
    std::format_to(std::back_inserter(buffer), "Name: {}\n", "Alice");
    std::format_to(std::back_inserter(buffer), "Age: {}\n", 30);
    std::format_to(std::back_inserter(buffer), "Score: {:.2f}\n", 95.5);

    std::cout << buffer;

    // 计算格式化后的大小
    size_t size = std::formatted_size("Value: {}", 42);
    std::cout << "Formatted size: " << size << '\n';

    return 0;
}

// 输出：
// Name: Alice
// Age: 30
// Score: 95.50
// Formatted size: 9
```

### 复杂的格式化场景

```cpp
#include <format>
#include <iostream>
#include <vector>

struct Record {
    std::string name;
    int id;
    double score;
};

template<>
struct std::formatter<Record> {
    constexpr auto parse(std::format_parse_context& ctx) {
        return ctx.begin();
    }

    auto format(const Record& r, std::format_context& ctx) const {
        return std::format_to(ctx.out(),
            "Record(name={}, id={:04d}, score={:.1f})",
            r.name, r.id, r.score);
    }
};

int main() {
    std::vector<Record> records = {
        {"Alice", 1, 95.5},
        {"Bob", 2, 87.3},
        {"Charlie", 3, 92.0}
    };

    // 表格输出
    std::cout << std::format("{:^20} {:^10} {:^10}\n", "Name", "ID", "Score");
    std::cout << std::string(40, '-') << '\n';

    for (const auto& r : records) {
        std::cout << std::format("{:<20} {:>10} {:>10.1f}\n",
                                 r.name, r.id, r.score);
    }

    // 单个记录格式化
    std::cout << std::format("\nDetails: {}\n", records[0]);

    return 0;
}

// 输出：
//                Name         ID       Score
// ----------------------------------------
// Alice                        1       95.5
// Bob                          2       87.3
// Charlie                      3       92.0
//
// Details: Record(name=Alice, id=0001, score=95.5)
```

## 最佳实践

### 优先使用 std::format 而不是 printf

```cpp
// 不推荐：printf 类型不安全
printf("Value: %d, String: %s\n", "string", 42);  // 类型不匹配，运行时错误

// 推荐：std::format 编译时检查
std::cout << std::format("Value: {}, String: {}\n", 42, "string");
```

### 显式指定参数索引提高可读性

```cpp
// 不够清晰
std::format("Dear {}, your account {} is {}", name, account_id, status);

// 更清晰
std::format("Dear {0}, your account {1} is {2}", name, account_id, status);

// 可重复使用参数
std::format("Start at {0} and end at {0}", location);
```

### 使用 format_to 构建大字符串时更高效

```cpp
// 如果需要多次格式化追加
std::string output;
for (const auto& item : items) {
    // 使用 format_to 避免多次字符串拷贝
    std::format_to(std::back_inserter(output),
                   "Item: {}\n", item);
}

// 而不是
std::string output;
for (const auto& item : items) {
    output += std::format("Item: {}\n", item);  // 每次都会创建临时字符串
}
```

### 为自定义类型提供格式化支持

```cpp
template<>
struct std::formatter<CustomType> {
    // 使用 constexpr 函数指示编译器可以在编译时执行
    constexpr auto parse(std::format_parse_context& ctx) {
        // 如果需要支持格式选项，在这里解析
        return ctx.begin();
    }

    auto format(const CustomType& obj, std::format_context& ctx) const {
        return std::format_to(ctx.out(),
                             "CustomType({})", obj.value);
    }
};
```

### 处理特殊字符

```cpp
// 使用花括号需要转义
std::format("{{literal braces}}");  // "{literal braces}"

// 包含特殊字符
std::format("Path: {}", "C:\\Users\\name");
std::format("Quote: \"{}\"", "hello");

// 使用宽字符串
std::wformat(L"Hello, {}!", L"World");
```

### 编译时格式字符串验证（如果支持）

```cpp
// 利用编译时检查，某些编译器可以在编译时验证格式字符串
// 确保参数数量和类型匹配
constexpr std::string_view fmt = "Value: {}";
std::cout << std::format(fmt, 42);  // 安全

// 不推荐在运行时构建格式字符串，会丧失编译时检查优势
std::string dynamic_fmt = "Value: {}";
std::cout << std::format(dynamic_fmt, 42);  // 仍然是安全的，但失去编译时验证
```

## 常见陷阱

### 混淆参数索引和自动编号

```cpp
// 错误：混合使用自动编号和显式索引
std::format("{} {1}", "a", "b");  // 某些编译器可能拒绝

// 正确：一致使用
std::format("{0} {1}", "a", "b");
std::format("{} {}", "a", "b");
```

### 格式说明符类型不匹配

```cpp
// 错误：将整数格式化为字符
std::format("{:c}", 256);  // 整数超出字符范围

// 正确：使用合适的格式说明符
std::format("{:d}", 256);
std::format("{:c}", static_cast<char>(65));
```

### 精度值误解

```cpp
// 对于浮点数，精度指小数位数
std::format("{:.2f}", 3.14159);  // "3.14"

// 对于字符串，精度指最大字符数
std::format("{:.3}", "hello");   // "hel"

// 对于整数，精度无效
std::format("{:.5d}", 42);       // "42"，精度被忽略
```

### 性能陷阱：重复格式化

```cpp
// 不推荐：在循环中多次格式化相同的模板
for (int i = 0; i < n; ++i) {
    std::cout << std::format("Item {}: {}\n", i, items[i]);
    // 每次都需要解析格式字符串
}

// 更好的方式：如果格式字符串固定，某些编译器可能优化
// 但不能完全保证，因此最好的做法是使用 format_to
std::string output;
for (int i = 0; i < n; ++i) {
    std::format_to(std::back_inserter(output),
                   "Item {}: {}\n", i, items[i]);
}
```

### 局部变量引用问题

```cpp
// 错误：引用不支持
std::string s = "test";
std::format("Value: {}", std::ref(s));  // 不通过编译

// 正确：直接传递对象
std::format("Value: {}", s);
```

### 宽字符和多字节字符处理

```cpp
// 小心宽字符的对齐和宽度计算
std::format("{:10}", "你好");  // 中文字符的宽度计算可能不符合预期

// 在 UTF-8 中，中文字符占多个字节但通常占 2 个显示宽度
// std::format 按字节计数，不是显示宽度
```

## 性能考量

### 编译时优化

`std::format` 最大的性能优势来自于编译时优化：

```cpp
// 编译器可以在编译时确定：
// 1. 格式字符串的有效性
// 2. 每个参数需要的转换类型
// 3. 输出大小（某些情况下）

std::cout << std::format("Value: {}", 42);

// 编译器可能生成几乎与以下手写代码等同的机器码：
const char* str = "Value: ";
int len = std::strlen(str);
std::cout.write(str, len);
std::cout << 42;
```

### 编译时大小计算

```cpp
#include <format>

// std::formatted_size 可以计算格式化后的大小
size_t size = std::formatted_size("Hello, {}", "World");
// size = 12

// 这样可以预分配正确大小的缓冲区
std::string buffer;
buffer.reserve(std::formatted_size("Value: {:.2f}", 3.14159));
std::format_to(std::back_inserter(buffer), "Value: {:.2f}", 3.14159);
```

### 避免临时字符串

```cpp
// 避免：创建临时字符串
std::string result = std::format("Value: {}", value);
std::cout << result;

// 更好：直接输出
std::cout << std::format("Value: {}", value);

// 或使用 format_to
std::cout.rdbuf()->sputn(
    buffer.data(),
    std::format_to(std::back_inserter(buffer), "Value: {}", value) - buffer.begin()
);
```

### 自定义格式化的性能

```cpp
template<>
struct std::formatter<Point> {
    constexpr auto parse(std::format_parse_context& ctx) {
        return ctx.begin();
    }

    // 确保 format 函数是高效的，避免额外分配
    auto format(const Point& p, std::format_context& ctx) const {
        // 直接写入到输出迭代器，避免中间字符串创建
        return std::format_to(ctx.out(), "({}, {})", p.x, p.y);
    }
};
```

### 性能基准测试

```cpp
#include <format>
#include <chrono>
#include <iostream>
#include <cstdio>

int main() {
    const int iterations = 1000000;

    // 测试 std::format
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        volatile auto s = std::format("Value: {}", i);
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto format_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    // 测试 printf
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        char buffer[50];
        volatile int len = snprintf(buffer, sizeof(buffer), "Value: %d", i);
    }
    end = std::chrono::high_resolution_clock::now();
    auto printf_time = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    std::cout << "std::format: " << format_time.count() << "ms\n";
    std::cout << "printf: " << printf_time.count() << "ms\n";

    return 0;
}

// 通常结果：std::format 和 printf 性能相当或更优
// （取决于编译器优化水平）
```

## 实战场景

### 场景 1：日志系统

```cpp
#include <format>
#include <iostream>
#include <chrono>

enum class LogLevel { DEBUG, INFO, WARNING, ERROR };

std::string get_timestamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    struct tm* tm_info = std::localtime(&time);
    char buffer[20];
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", tm_info);
    return buffer;
}

class Logger {
public:
    template<typename... Args>
    void log(LogLevel level, std::string_view fmt, Args&&... args) {
        std::string level_str = get_level_string(level);
        std::string message = std::format(fmt, std::forward<Args>(args)...);
        std::cout << std::format("[{}] {}: {}\n",
                                 get_timestamp(), level_str, message);
    }

private:
    static std::string get_level_string(LogLevel level) {
        switch (level) {
            case LogLevel::DEBUG:   return "DEBUG";
            case LogLevel::INFO:    return "INFO";
            case LogLevel::WARNING: return "WARNING";
            case LogLevel::ERROR:   return "ERROR";
        }
        return "UNKNOWN";
    }
};

int main() {
    Logger logger;
    logger.log(LogLevel::INFO, "Starting application");
    logger.log(LogLevel::DEBUG, "Processing item {} of {}", 1, 10);
    logger.log(LogLevel::WARNING, "Slow operation: {}ms", 1500);
    logger.log(LogLevel::ERROR, "Failed to load file: {}", "config.json");

    return 0;
}

// 输出示例：
// [2026-01-07 12:34:56] INFO: Starting application
// [2026-01-07 12:34:56] DEBUG: Processing item 1 of 10
// [2026-01-07 12:34:56] WARNING: Slow operation: 1500ms
// [2026-01-07 12:34:56] ERROR: Failed to load file: config.json
```

### 场景 2：数据导出（CSV/TSV）

```cpp
#include <format>
#include <iostream>
#include <vector>

struct Student {
    std::string name;
    int id;
    double gpa;
    std::string major;
};

class CSVExporter {
public:
    std::string export_students(const std::vector<Student>& students) {
        std::string output;

        // 导出表头
        std::format_to(std::back_inserter(output),
                      "{},{},{},{}\n", "Name", "ID", "GPA", "Major");

        // 导出数据
        for (const auto& s : students) {
            std::format_to(std::back_inserter(output),
                          "{},{},{:.2f},{}\n",
                          s.name, s.id, s.gpa, s.major);
        }

        return output;
    }
};

int main() {
    std::vector<Student> students = {
        {"Alice Johnson", 1001, 3.95, "Computer Science"},
        {"Bob Smith", 1002, 3.87, "Mathematics"},
        {"Charlie Brown", 1003, 3.76, "Physics"}
    };

    CSVExporter exporter;
    std::string csv = exporter.export_students(students);
    std::cout << csv;

    return 0;
}

// 输出：
// Name,ID,GPA,Major
// Alice Johnson,1001,3.95,Computer Science
// Bob Smith,1002,3.87,Mathematics
// Charlie Brown,1003,3.76,Physics
```

### 场景 3：HTTP 请求构建

```cpp
#include <format>
#include <string>
#include <map>

class HTTPRequestBuilder {
public:
    HTTPRequestBuilder& method(std::string_view m) {
        request_method = m;
        return *this;
    }

    HTTPRequestBuilder& path(std::string_view p) {
        request_path = p;
        return *this;
    }

    HTTPRequestBuilder& header(std::string_view key, std::string_view value) {
        headers[std::string(key)] = value;
        return *this;
    }

    HTTPRequestBuilder& body(std::string_view b) {
        request_body = b;
        return *this;
    }

    std::string build() const {
        std::string request;

        // 请求行
        std::format_to(std::back_inserter(request),
                      "{} {} HTTP/1.1\r\n",
                      request_method, request_path);

        // 请求头
        for (const auto& [key, value] : headers) {
            std::format_to(std::back_inserter(request),
                          "{}: {}\r\n", key, value);
        }

        // Content-Length
        if (!request_body.empty()) {
            std::format_to(std::back_inserter(request),
                          "Content-Length: {}\r\n",
                          request_body.size());
        }

        // 空行
        request += "\r\n";

        // 请求体
        if (!request_body.empty()) {
            request += request_body;
        }

        return request;
    }

private:
    std::string request_method = "GET";
    std::string request_path = "/";
    std::map<std::string, std::string> headers;
    std::string request_body;
};

int main() {
    HTTPRequestBuilder builder;
    std::string request = builder
        .method("POST")
        .path("/api/users")
        .header("Host", "example.com")
        .header("Content-Type", "application/json")
        .body(R"({"name":"Alice","age":30})")
        .build();

    std::cout << request;

    return 0;
}

// 输出：
// POST /api/users HTTP/1.1
// Content-Type: application/json
// Content-Length: 27
// Host: example.com
//
// {"name":"Alice","age":30}
```

### 场景 4：SQL 查询生成（带安全考虑）

```cpp
#include <format>
#include <string>
#include <vector>

class SQLQueryBuilder {
public:
    static std::string escape_string(std::string_view str) {
        std::string result;
        result.push_back('\'');
        for (char c : str) {
            if (c == '\'') {
                result += "''";  // SQL 转义单引号
            } else {
                result.push_back(c);
            }
        }
        result.push_back('\'');
        return result;
    }

    SQLQueryBuilder& select(const std::vector<std::string>& columns) {
        query = "SELECT ";
        for (size_t i = 0; i < columns.size(); ++i) {
            if (i > 0) query += ", ";
            query += columns[i];
        }
        return *this;
    }

    SQLQueryBuilder& from(std::string_view table) {
        std::format_to(std::back_inserter(query),
                      " FROM {}", table);
        return *this;
    }

    SQLQueryBuilder& where(std::string_view column,
                          std::string_view op,
                          std::string_view value) {
        std::format_to(std::back_inserter(query),
                      " WHERE {} {} {}", column, op, value);
        return *this;
    }

    SQLQueryBuilder& order_by(std::string_view column,
                             std::string_view direction = "ASC") {
        std::format_to(std::back_inserter(query),
                      " ORDER BY {} {}", column, direction);
        return *this;
    }

    SQLQueryBuilder& limit(int count) {
        std::format_to(std::back_inserter(query),
                      " LIMIT {}", count);
        return *this;
    }

    std::string build() const { return query; }

private:
    std::string query;
};

int main() {
    std::string query1 = SQLQueryBuilder()
        .select({"id", "name", "email"})
        .from("users")
        .where("age", ">", "18")
        .order_by("created_at", "DESC")
        .limit(10)
        .build();

    std::cout << query1 << '\n';

    std::string user_input = "O'Reilly";  // 包含单引号的输入
    std::string query2 = SQLQueryBuilder()
        .select({"*"})
        .from("authors")
        .where("name", "=", SQLQueryBuilder::escape_string(user_input))
        .build();

    std::cout << query2 << '\n';

    return 0;
}

// 输出：
// SELECT id, name, email FROM users WHERE age > 18 ORDER BY created_at DESC LIMIT 10
// SELECT * FROM authors WHERE name = 'O''Reilly'
```

## 面试要点

### std::format 与 printf 的区别

**问题**：std::format 相比 printf 的主要优势是什么？

**回答**：
- 类型安全：编译时检查参数类型，printf 在运行时才会出错
- 易用性：使用 {} 占位符，比 %d、%s 等格式说明符更直观
- 性能：编译时优化，某些场景性能等同或更优
- 可扩展性：支持自定义类型的格式化
- 不存在缓冲区溢出风险

### 格式字符串如何在编译时被验证

**问题**：std::format 如何实现编译时格式字符串验证？

**回答**：
- 利用 C++20 consteval 函数和编译时字符串操作
- 编译器在编译阶段解析格式字符串，检查占位符数量和类型
- 如果格式字符串错误，编译器会报告编译错误，而不是运行时崩溃

### 自定义类型的格式化实现

**问题**：如何为自定义类型提供格式化支持？

**回答**：
特化 `std::formatter` 模板，实现两个关键函数：
- `parse()`：编译时解析格式说明符
- `format()`：实际格式化逻辑，使用 `format_to()` 写入输出

```cpp
template<>
struct std::formatter<MyType> {
    constexpr auto parse(std::format_parse_context& ctx) {
        return ctx.begin();
    }

    auto format(const MyType& obj, std::format_context& ctx) const {
        return std::format_to(ctx.out(), "format here");
    }
};
```

### 参数索引和自动编号

**问题**：什么时候使用参数索引，什么时候使用自动编号？

**回答**：
- 自动编号（{}）：参数顺序明确，参数数量少的简单情况
- 显式索引（{0} {1}）：参数被重复使用、需要重新排序、或代码需要清晰表达意图的情况

### 性能考量

**问题**：std::format 的性能如何？是否存在性能陷阱？

**回答**：
- 通常性能与 printf 相当或更优，得益于编译时优化
- 避免在循环中重复格式化相同的模板
- 使用 `format_to` 构建大字符串时比多次调用 `format` 更高效
- 避免创建临时字符串

### format_to vs format

**问题**：何时使用 `format_to`，何时使用 `format`？

**回答**：
- `format()`：返回格式化后的字符串，用于简单场景
- `format_to()`：向输出迭代器写入，用于追加到现有缓冲区或构建大字符串，更高效

### 常见错误

**问题**：使用 std::format 时有哪些常见错误？

**回答**：
- 混合使用自动编号和显式索引
- 格式说明符类型不匹配（如用 :d 格式化字符串）
- 误解精度的含义（对浮点数是小数位数，对字符串是最大长度）
- 在运行时构建格式字符串，丧失编译时检查优势

### 宽字符和 Unicode 支持

**问题**：std::format 如何处理 Unicode 和宽字符？

**回答**：
- `std::format()` 处理普通字符串（UTF-8）
- `std::wformat()` 处理宽字符串（wchar_t）
- 在 UTF-8 中，多字节字符的宽度计算可能与显示宽度不符
- 复杂的 Unicode 支持（如 emoji 宽度）需要外部库辅助

## 延伸阅读

### 相关标准库功能

1. **std::string_view**：用于高效传递格式字符串参数
2. **std::back_inserter**：配合 format_to 使用，向容器末尾追加
3. **std::locale**：国际化数字和货币格式化
4. **std::to_chars/from_chars**：底层数值转换

### 编译器支持

- **GCC**：8.0+ 支持（需要 -std=c++20 及以上）
- **Clang**：10.0+ 支持
- **MSVC**：Visual Studio 2019 16.10+ 支持

### 进阶话题

1. **自定义格式说明符**：在 parse() 中解析并存储自定义选项
2. **动态宽度和精度**：使用 {} 作为占位符动态设置
3. **本地化格式化**：结合 std::locale 处理地区特定的格式
4. **性能优化**：使用 std::formatted_size 预分配缓冲区

### 推荐资源

- C++20 标准文档：<format> 头文件规范
- cppreference.com：std::format 详细文档
- Compiler Explorer：实时查看生成的汇编代码
- PapersWithCode：关于 std::format 的提案历史

### 迁移指南

从 printf 迁移到 std::format：

```cpp
// 之前：printf
printf("Value: %d, Float: %.2f, String: %s\n", 42, 3.14, "hello");

// 之后：std::format
std::cout << std::format("Value: {}, Float: {:.2f}, String: {}\n",
                        42, 3.14, "hello");
```

### 替代方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| std::format | 类型安全、编译时检查、易用 | 需要 C++20 | 现代 C++ 项目 |
| printf | 简洁、广泛支持 | 类型不安全、易出错 | 简单格式化或需要 C 兼容性 |
| std::stringstream | 类型安全、可处理流状态 | 冗长、性能较低 | 流式 I/O 或需要复杂状态 |
| 第三方库（fmtlib） | 丰富功能、好兼容性 | 额外依赖 | 不能使用 C++20 的项目 |

