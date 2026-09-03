---
title: C++17 string_view：非拥有字符串引用
description: 深入理解 C++17 string_view，掌握非拥有字符串视图的概念、核心原理、性能优势与最佳实践。
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - string_view
  - C++17
  - 引用
  - 性能优化
  - 字符串
  - 内存管理
status: imported
origin: old/src/content/docs/cpp/string-view.zh.md
divergence: 0.179
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Cpp
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---


## 概念解释

### 什么是 string_view？

`std::string_view` 是 C++17 引入的一个轻量级字符串视图类，它提供了一个**非拥有的、只读的字符序列引用**。它本质上是一个对现有字符数据的"视图"，不复制数据，也不负责管理数据的生命周期。

### 核心特点

1. **非拥有** - 不管理字符数据的内存
2. **轻量级** - 仅存储指针和长度（通常 16 字节）
3. **只读** - 不支持修改字符数据
4. **零复制** - 避免不必要的字符串拷贝
5. **兼容性强** - 可以引用 `std::string`、C 字符串、`std::array` 等

### 解决的问题

在 C++17 之前，函数接收字符串参数时面临的困境：

- **`const std::string&`** - 需要完整的字符串对象，不能直接使用字面量或 C 字符串
- **`const char*`** - 不安全，丢失长度信息
- **频繁拷贝** - 传递字符串时产生不必要的拷贝开销

`string_view` 统一了这些用法，提供了安全高效的解决方案。

---

## 核心原理

### 内存布局

```cpp
template<class CharT, class Traits = std::char_traits<CharT>>
class basic_string_view {
private:
    const CharT* data_;      // 指向字符数据
    size_type size_;         // 字符数量
};

// 对应的特化版本
using string_view = basic_string_view<char>;
using wstring_view = basic_string_view<wchar_t>;
using u8string_view = basic_string_view<char8_t>;   // C++20
using u16string_view = basic_string_view<char16_t>;
using u32string_view = basic_string_view<char32_t>;
```

### 关键性质

1. **指针+长度** - 只需 16 字节（64 位系统）
2. **不拥有数据** - 没有析构函数代码
3. **可复制构造** - 浅拷贝，O(1) 时间复杂度
4. **迭代器** - 提供只读迭代器支持范围算法

### 隐式转换规则

```cpp
std::string_view sv;

// 隐式转换支持
sv = "C string literal";              // const char*
sv = std::string("std string");       // std::string（临时对象）

std::string s = "hello";
sv = s;                                // std::string 引用

// 数组支持
char arr[] = "array";
sv = std::string_view(arr);           // 数组需要显式构造
```

---

## 核心要点

### 构造方式

```cpp
// 默认构造 - 空视图
std::string_view sv1;
assert(sv1.empty());

// 从 C 字符串构造
const char* cstr = "hello world";
std::string_view sv2(cstr);
assert(sv2.size() == 11);

// 从 std::string 构造
std::string s = "hello";
std::string_view sv3(s);

// 指定长度
std::string_view sv4(cstr, 5);  // "hello"
assert(sv4 == "hello");

// 从其他 string_view 构造
std::string_view sv5(sv4);
```

### 基本操作

```cpp
std::string_view sv = "hello world";

// 访问字符
char c = sv[0];              // 'h'
char c2 = sv.at(1);          // 'e'，支持边界检查

// 获取子视图
auto sub = sv.substr(0, 5);  // "hello"

// 查找
size_t pos = sv.find("world");
bool has = sv.find("xyz") != std::string_view::npos;

// 比较
bool eq = sv.compare("hello world") == 0;
```

### 关键成员函数

| 函数 | 说明 | 返回值 |
|-----|------|--------|
| `data()` | 获取字符指针 | `const CharT*` |
| `size()` / `length()` | 获取长度 | `size_t` |
| `empty()` | 检查是否为空 | `bool` |
| `operator[]` | 索引访问 | `CharT` |
| `at()` | 安全访问（抛异常） | `CharT` |
| `front()` / `back()` | 首/末字符 | `CharT` |
| `substr()` | 提取子视图 | `string_view` |
| `find()` | 查找子串 | `size_t` |
| `starts_with()` | 检查前缀 (C++20) | `bool` |
| `ends_with()` | 检查后缀 (C++20) | `bool` |
| `contains()` | 检查包含 (C++23) | `bool` |

### 临时对象问题 ⚠️

```cpp
std::string_view create_view() {
    std::string temp = "hello";
    return std::string_view(temp);  // 危险！引用已销毁的对象
}

// 调用时会导致未定义行为
auto sv = create_view();
// sv.data() 指向已释放的内存
```

---

## 代码示例

### 示例 1：函数参数最佳实践

```cpp
#include <iostream>
#include <string>
#include <string_view>
#include <vector>

// 旧方式：需要三个重载
void process_old_string(const std::string& s) {
    std::cout << "std::string: " << s << '\n';
}

void process_old_cstring(const char* s) {
    std::cout << "C string: " << s << '\n';
}

// 新方式：统一接口
void process(std::string_view sv) {
    std::cout << "Length: " << sv.size() << ", Content: " << sv << '\n';

    // 支持所有字符串操作
    if (sv.starts_with("hello")) {
        std::cout << "Greeting detected!\n";
    }
}

int main() {
    std::string str = "hello world";
    const char* cstr = "hello C-string";

    // 所有调用都使用同一个函数
    process(str);           // std::string
    process(cstr);          // C 字符串
    process("hello");       // 字符串字面量
    process(str.substr(0, 5));  // 临时 std::string（小心！）

    // ✓ 正确：使用 substr 返回的 string_view
    std::string_view hello = std::string_view(str).substr(0, 5);
    std::cout << hello << '\n';
}
```

### 示例 2：字符串处理

```cpp
#include <string>
#include <string_view>
#include <iostream>

// 分割字符串函数
std::vector<std::string_view> split(
    std::string_view str,
    char delimiter)
{
    std::vector<std::string_view> result;
    size_t start = 0;

    while (true) {
        size_t end = str.find(delimiter, start);
        result.push_back(str.substr(start, end - start));

        if (end == std::string_view::npos) break;
        start = end + 1;
    }

    return result;
}

// 去除前导和尾随空格
std::string_view trim(std::string_view str) {
    constexpr auto ws = " \t\n\r";

    // 去除前导
    size_t first = str.find_first_not_of(ws);
    if (first == std::string_view::npos)
        return std::string_view();

    // 去除尾随
    size_t last = str.find_last_not_of(ws);

    return str.substr(first, last - first + 1);
}

int main() {
    // 分割示例
    std::string text = "apple,banana,orange,grape";
    auto parts = split(text, ',');

    for (auto part : parts) {
        std::cout << '[' << part << "] ";
    }
    std::cout << '\n';

    // 修剪示例
    std::string_view messy = "  \t  hello world  \n ";
    auto clean = trim(messy);
    std::cout << '[' << clean << "]\n";

    return 0;
}
```

### 示例 3：性能对比

```cpp
#include <string>
#include <string_view>
#include <chrono>
#include <iostream>

// 使用 string& 的版本
bool contains_string(const std::string& s, const std::string& needle) {
    return s.find(needle) != std::string::npos;
}

// 使用 string_view 的版本
bool contains_view(std::string_view sv, std::string_view needle) {
    return sv.find(needle) != std::string_view::npos;
}

int main() {
    std::string text = "The quick brown fox jumps over the lazy dog";

    // 性能测试：1,000,000 次调用
    const int iterations = 1000000;

    // 方式 1：string& - 产生临时对象和拷贝
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        volatile bool result = contains_string(text, "fox");
        (void)result;
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto time1 = std::chrono::duration_cast<std::chrono::microseconds>(
        end - start).count();

    // 方式 2：string_view - 零复制
    start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        volatile bool result = contains_view(text, "fox");
        (void)result;
    }
    end = std::chrono::high_resolution_clock::now();
    auto time2 = std::chrono::duration_cast<std::chrono::microseconds>(
        end - start).count();

    std::cout << "std::string&: " << time1 << " us\n";
    std::cout << "std::string_view: " << time2 << " us\n";
    std::cout << "Speedup: " << (double)time1 / time2 << "x\n";
}
```

### 示例 4：与容器的集成

```cpp
#include <string>
#include <string_view>
#include <vector>
#include <algorithm>
#include <iostream>

int main() {
    std::vector<std::string> words = {
        "apple", "banana", "apricot", "avocado", "blueberry"
    };

    // 使用 string_view 作为搜索条件
    std::string_view prefix = "ap";

    auto matches = std::count_if(
        words.begin(), words.end(),
        [prefix](const std::string& word) {
            return std::string_view(word).starts_with(prefix);
        }
    );

    std::cout << "Words starting with '" << prefix
              << "': " << matches << '\n';

    // 过滤出前缀匹配的单词（使用 string_view 避免复制）
    std::vector<std::string_view> filtered;
    for (const auto& word : words) {
        if (std::string_view(word).starts_with(prefix)) {
            filtered.push_back(word);
        }
    }

    std::cout << "Filtered: ";
    for (auto sv : filtered) {
        std::cout << sv << " ";
    }
    std::cout << '\n';

    return 0;
}
```

---

## 最佳实践

### 函数参数设计

```cpp
// ✓ 推荐：string_view 用于只读输入
void analyze(std::string_view data);
void process(std::string_view name, int value);

// ✗ 避免：无必要的 string& 重载
void analyze(const std::string& data);
void analyze(const char* data);

// ⚠️ 特殊情况：如果需要修改，使用 string&
void modify(std::string& str);

// ⚠️ 特殊情况：返回字符串所有权，使用 string
std::string create_message();
```

### 临时对象处理

```cpp
// ✗ 危险：不要返回临时 string_view
std::string_view get_view() {
    std::string temp = "danger";
    return std::string_view(temp);  // UB!
}

// ✓ 正确：返回拥有的 string
std::string get_string() {
    return "safe";
}

// ✓ 正确：返回视图但调用者负责生命周期
std::string_view process(const std::string& s) {
    // 返回引用参数的视图是安全的
    return std::string_view(s).substr(0, 5);
}

int main() {
    std::string source = "hello world";
    auto view = process(source);  // 安全，source 仍存活
    std::cout << view << '\n';
}
```

### 与 const char* 的互操作

```cpp
// 字符串字面量处理
constexpr std::string_view status = "OK";

// 检查空指针
void safe_process(const char* ptr) {
    if (!ptr) return;
    std::string_view sv(ptr);
    // 继续处理
}

// 带长度的 C 字符串
void process_buffer(const char* data, size_t len) {
    std::string_view sv(data, len);
    // 无需单独管理长度
}
```

### 编译期优化

```cpp
// 编译期字符串处理（C++17 constexpr string_view）
constexpr std::string_view version = "1.2.3";

constexpr bool check_version(std::string_view v) {
    return v.length() > 0 && v[0] == '1';
}

static_assert(check_version(version));  // 编译期检查
```

### 集合操作最佳实践

```cpp
// ✓ 推荐：string_view 容器用于存储字符串引用
std::vector<std::string_view> lines(
    content.begin(),
    content.end()
);

// ⚠️ 危险：确保源字符串生命周期足够长
std::vector<std::string_view> dangerous() {
    std::string temp = "hello";
    std::vector<std::string_view> v;
    v.push_back(temp);
    return v;  // UB! temp 已销毁
}

// ✓ 正确：在安全的作用域内使用
void safe() {
    std::string source = "data";
    std::vector<std::string_view> refs;
    refs.push_back(source);
    // 在 source 存活的同时使用
}
```

---

## 常见陷阱

### 陷阱 1：返回临时对象的视图

```cpp
// ✗ 最常见的错误
std::string_view get_error_message() {
    std::string msg = "Error occurred";
    return msg;  // 返回对临时对象的引用 - UB!
}

// 问题症状
auto sv = get_error_message();
std::cout << sv << '\n';  // 可能崩溃或输出垃圾

// ✓ 修复方案
std::string_view get_error_message() {
    static std::string msg = "Error occurred";
    return msg;  // 或返回 std::string
}
```

### 陷阱 2：修改 string_view 指向的数据

```cpp
// ✗ 语义错误
std::string text = "hello";
std::string_view sv = text;
// sv[0] = 'H';  // 编译错误 - 正确阻止了修改

// 如果需要修改，使用 string&
std::string& s = text;
s[0] = 'H';  // ✓
```

### 陷阱 3：使用过期的 string_view

```cpp
std::string_view sv;

{
    std::string temp = "temporary";
    sv = temp;
    std::cout << sv << '\n';  // ✓ 安全，temp 仍存活
}

std::cout << sv << '\n';  // ✗ 未定义行为！temp 已销毁
```

### 陷阱 4：忽视字符串编码问题

```cpp
// ✗ 索引未必是字符
std::string_view utf8 = "你好";  // UTF-8 编码：6 字节
std::cout << utf8.size() << '\n';  // 输出：6，不是字符数
std::cout << utf8[0] << '\n';      // 输出：乱码，只是一个字节

// 需要正确的 UTF-8 处理库
```

### 陷阱 5：容器持有时生命周期问题

```cpp
// ✗ 危险
std::vector<std::string_view> extract_lines(const std::string& text) {
    std::vector<std::string_view> lines;
    // ... 分割逻辑 ...
    return lines;  // 返回对 text 的多个引用
}

auto lines = extract_lines(some_string);
// 如果 some_string 销毁，lines 中的所有 view 都失效

// ✓ 修复
std::vector<std::string_view> extract_lines(std::string_view text) {
    // 调用者负责保证 text 的生命周期
    std::vector<std::string_view> lines;
    // ... 分割逻辑 ...
    return lines;
}

std::string source = "line1\nline2\nline3";
auto lines = extract_lines(source);  // source 需要保持活跃
```

---

## 性能考量

### 复制成本对比

```cpp
// std::string：16-32 字节（含内存管理）
// std::string_view：16 字节（指针+长度）

struct CopyComparison {
    // std::string 拷贝：
    // - 调用 allocator
    // - 分配新内存
    // - 复制字符数据
    // - 更新引用计数或检查容量
    // 成本：O(n)

    // std::string_view 拷贝：
    // - 复制指针
    // - 复制长度
    // 成本：O(1)
};

std::string s = "hello world";  // 新建并复制数据
std::string_view v1(s);         // O(1) 拷贝
std::string_view v2 = v1;       // O(1) 拷贝
```

### 性能基准数据

```cpp
// 典型测试结果（1,000,000 次调用）

// 场景：查找子字符串
std::string big = "The quick brown fox jumps..."; // 1000 字节

// 使用 const std::string&
void search(const std::string& s) { s.find("fox"); }
// 时间：15-20ms（产生临时对象）

// 使用 std::string_view
void search(std::string_view sv) { sv.find("fox"); }
// 时间：5-8ms（无复制）

// 性能提升：2-4x
```

### 避免的开销

```cpp
// ❌ 不必要的拷贝（之前需要做的）
std::string process(const std::string& s1, const std::string& s2) {
    std::string temp = s1 + s2;        // 拷贝 1
    std::string result = temp.substr(0, 10);  // 拷贝 2
    return result;                     // 拷贝 3（通常被省略）
}

// ✅ 现在可以避免
std::string_view process(std::string_view s1, std::string_view s2) {
    // 不需要拷贝，直接操作引用
    return s1.substr(0, 10);           // 返回视图
}
```

### 内存访问模式

```cpp
// string_view 的内存友好特性
std::string_view create_many_views(std::string_view source) {
    std::vector<std::string_view> views;

    // 创建 1000 个子视图
    for (size_t i = 0; i < source.size(); ++i) {
        views.push_back(source.substr(i));
    }

    // views[999] 仍指向同一块内存
    // 总内存占用：~16KB (1000 × 16 字节)
    // 而不是：~1MB (1000 × 1000 字节)

    return views.back();
}
```

---

## 实战场景

### 场景 1：配置文件解析

```cpp
#include <string>
#include <string_view>
#include <unordered_map>
#include <sstream>

class Config {
private:
    std::string content;
    std::unordered_map<std::string, std::string> settings;

public:
    void parse(const std::string& data) {
        content = data;
        settings.clear();

        std::istringstream stream(content);
        std::string line;

        while (std::getline(stream, line)) {
            parse_line(line);
        }
    }

    void parse_line(std::string_view line) {
        // 去除空白
        auto trimmed = trim(line);
        if (trimmed.empty() || trimmed[0] == '#')
            return;

        // 分割 key=value
        auto pos = trimmed.find('=');
        if (pos == std::string_view::npos)
            return;

        auto key = trimmed.substr(0, pos);
        auto val = trimmed.substr(pos + 1);

        // 使用 string 作为 map 的键值
        settings[std::string(key)] = std::string(val);
    }

    bool get(std::string_view key, std::string& out) const {
        auto it = settings.find(std::string(key));
        if (it != settings.end()) {
            out = it->second;
            return true;
        }
        return false;
    }

private:
    std::string_view trim(std::string_view s) {
        constexpr auto ws = " \t\r\n";
        auto start = s.find_first_not_of(ws);
        if (start == std::string_view::npos) return {};
        auto end = s.find_last_not_of(ws);
        return s.substr(start, end - start + 1);
    }
};

int main() {
    Config cfg;
    cfg.parse("# Settings\nhost = localhost\nport = 8080\n");

    std::string host;
    if (cfg.get("host", host)) {
        std::cout << "Host: " << host << '\n';
    }
}
```

### 场景 2：日志系统

```cpp
#include <string>
#include <string_view>
#include <iostream>
#include <chrono>

class Logger {
public:
    void log(std::string_view level, std::string_view message) {
        auto timestamp = get_timestamp();
        std::cout << '[' << timestamp << "] [" << level
                  << "] " << message << '\n';
    }

    void info(std::string_view msg) { log("INFO", msg); }
    void error(std::string_view msg) { log("ERROR", msg); }
    void warn(std::string_view msg) { log("WARN", msg); }

private:
    std::string get_timestamp() const {
        auto now = std::chrono::system_clock::now();
        auto time = std::chrono::system_clock::to_time_t(now);
        return std::ctime(&time);  // 简化版
    }
};

int main() {
    Logger logger;

    logger.info("Application started");
    logger.warn("Configuration not found, using defaults");
    logger.error("Connection failed");

    return 0;
}
```

### 场景 3：命令行参数处理

```cpp
#include <string>
#include <string_view>
#include <vector>
#include <optional>

class ArgumentParser {
private:
    std::vector<std::string_view> args;

public:
    ArgumentParser(int argc, const char* argv[]) {
        for (int i = 1; i < argc; ++i) {
            args.push_back(argv[i]);
        }
    }

    std::optional<std::string_view> get_option(std::string_view name) const {
        for (size_t i = 0; i < args.size(); ++i) {
            if (args[i] == name && i + 1 < args.size()) {
                return args[i + 1];
            }
        }
        return std::nullopt;
    }

    bool has_flag(std::string_view name) const {
        for (const auto& arg : args) {
            if (arg == name) return true;
        }
        return false;
    }

    std::vector<std::string_view> positional() const {
        std::vector<std::string_view> result;
        for (const auto& arg : args) {
            if (!arg.empty() && arg[0] != '-') {
                result.push_back(arg);
            }
        }
        return result;
    }
};

int main(int argc, const char* argv[]) {
    ArgumentParser parser(argc, argv);

    if (auto input = parser.get_option("--input")) {
        std::cout << "Input file: " << *input << '\n';
    }

    if (parser.has_flag("--verbose")) {
        std::cout << "Verbose mode enabled\n";
    }

    auto positional = parser.positional();
    std::cout << "Positional args: " << positional.size() << '\n';

    return 0;
}
```

---

## 面试要点

### Q1：string_view 和 string& 的区别？

**答案：**
| 特性 | string_view | const string& |
|-----|-----------|--------------|
| 大小 | 16 字节 | 24+ 字节 |
| 拷贝成本 | O(1) | O(n) |
| 接受源 | 任意字符串 | 只能 std::string |
| 生命周期 | 依赖源字符串 | 独立 |
| 修改 | 不支持 | 可修改（非 const） |
| 实现 | 指针 + 长度 | 动态分配的缓冲 |

### Q2：为什么 string_view 不能返回？

**答案：**
string_view 是非拥有引用。如果返回指向局部变量或临时对象的视图，会导致悬垂引用（use-after-free）。安全做法是返回 `std::string` 或确保返回值引用的对象生命周期足够长。

### Q3：string_view 适用于什么场景？

**答案：**
1. **函数参数** - 统一字符串参数接口，避免多重载
2. **只读操作** - 查找、比较、截取子串
3. **性能敏感** - 避免不必要的拷贝
4. **API 稳定性** - 不依赖 std::string 的具体实现
5. **编译期计算** - constexpr string_view 支持编译期字符串处理

### Q4：如何安全地使用 string_view？

**答案：**
1. 确保源字符串生命周期足够长
2. 不要在容器中长期持有视图
3. 避免返回局部或临时对象的视图
4. 使用 `constexpr` 版本进行编译期操作
5. 参数传递时优先使用 string_view

### Q5：C++17 之前如何模拟 string_view？

**答案：**
```cpp
// 简单的手工实现
class StringView {
    const char* data_;
    size_t size_;
public:
    StringView(const char* s, size_t len)
        : data_(s), size_(len) {}

    const char* data() const { return data_; }
    size_t size() const { return size_; }
};
```

---

## 延伸阅读

### 官方文档
- [cppreference - std::string_view](https://en.cppreference.com/w/cpp/string/basic_string_view)
- [C++ 标准草案 - string_view](https://wg21.link/string.view)

### 关键论文
- [P0220R1: Adopt Library Fundamentals V1 as a Library Technical Specification](https://wg21.link/P0220)
- [P1361R2: Integration of chrono with calendars and time zones](https://wg21.link/P1361)（包含 string_view 的发展历程）

### 相关特性
- **C++20 starts_with/ends_with** - string_view 的进一步增强
- **C++20 std::span** - 泛化的非拥有数据引用
- **C++23 std::expected** - 错误处理改进
- **RAII** - 资源管理的核心原则

### 最佳实践资源
- Herb Sutter 的 "C++ Core Guidelines"
- Scott Meyers《Effective Modern C++》第三章"Moving to Modern C++"
- Jason Turner 的"C++ Weekly"系列视频

### 相关头文件和类型
```cpp
#include <string_view>

// 相关类型
std::string_view           // char 版本
std::wstring_view          // wchar_t 版本
std::u8string_view         // char8_t (C++20)
std::u16string_view        // char16_t (C++20)
std::u32string_view        // char32_t (C++20)

// 关联工具
std::hash<std::string_view>      // 哈希支持
std::compare_three_way           // C++20 三路比较
```

### 常见问题清单
- [ ] 理解 string_view 不拥有数据
- [ ] 掌握安全的生命周期管理
- [ ] 知道何时使用 string_view vs string
- [ ] 能够实现字符串处理函数
- [ ] 理解性能优势与权衡
- [ ] 避免常见陷阱（返回临时对象的视图等）
- [ ] 在现有代码中识别可优化的地方

---

*最后更新：2026-01-07 • 难度：中等 • 约 3000+ 字*
