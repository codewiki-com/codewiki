---
title: C++20新特性
description: C++20完全指南，概念、范围、协程与模块
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - C++20
  - Concepts
  - Ranges
status: imported
origin: old/src/content/docs/cpp/cpp20.zh.md
divergence: 0.289
issues: []
legacy:
  category: Cpp
  subcategory: 现代C++
  order: 12
  lastUpdated: 2026-01-07
---

C++20 是继 C++11 之后最重大的语言更新，引入了四大核心特性：**概念（Concepts）**、**范围（Ranges）**、**协程（Coroutines）** 和 **模块（Modules）**。本文将深入探讨这些特性以及其他重要改进。

---

## 概念（Concepts）

概念是 C++20 中最具革命性的特性之一，它为模板编程提供了一种优雅的约束机制，使得模板错误信息更加清晰易懂。

### 什么是概念？

概念本质上是一组编译期谓词，用于约束模板参数必须满足的条件。在 C++20 之前，我们使用 SFINAE 或 `static_assert` 来约束模板，但这些方法往往导致晦涩难懂的错误信息。

### 定义概念

```cpp
#include <concepts>
#include <type_traits>

// 基本概念定义
template<typename T>
concept Integral = std::is_integral_v<T>;

// 使用 requires 表达式定义更复杂的概念
template<typename T>
concept Arithmetic = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a - b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { a / b } -> std::convertible_to<T>;
};

// 组合概念
template<typename T>
concept SignedIntegral = Integral<T> && std::is_signed_v<T>;

template<typename T>
concept UnsignedIntegral = Integral<T> && !std::is_signed_v<T>;
```

### 使用概念的四种方式

```cpp
#include <concepts>
#include <iostream>

// 方式1：requires 子句
template<typename T>
requires std::integral<T>
T gcd(T a, T b) {
    while (b != 0) {
        T temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// 方式2：尾置 requires 子句
template<typename T>
T lcm(T a, T b) requires std::integral<T> {
    return (a / gcd(a, b)) * b;
}

// 方式3：概念作为模板参数约束
template<std::integral T>
T factorial(T n) {
    T result = 1;
    for (T i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

// 方式4：简化函数模板（最简洁）
auto square(std::integral auto n) {
    return n * n;
}
```

### 自定义概念实战

```cpp
#include <concepts>
#include <string>
#include <vector>

// 可哈希概念
template<typename T>
concept Hashable = requires(T t) {
    { std::hash<T>{}(t) } -> std::convertible_to<std::size_t>;
};

// 容器概念
template<typename C>
concept Container = requires(C c) {
    typename C::value_type;
    typename C::iterator;
    { c.begin() } -> std::same_as<typename C::iterator>;
    { c.end() } -> std::same_as<typename C::iterator>;
    { c.size() } -> std::convertible_to<std::size_t>;
    { c.empty() } -> std::convertible_to<bool>;
};

// 可打印概念
template<typename T>
concept Printable = requires(std::ostream& os, T t) {
    { os << t } -> std::same_as<std::ostream&>;
};

// 使用自定义概念
template<Container C>
void print_container(const C& container) requires Printable<typename C::value_type> {
    for (const auto& elem : container) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;
}

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    print_container(vec);  // 输出: 1 2 3 4 5
    return 0;
}
```

### 标准库中的概念

C++20 在 `<concepts>` 头文件中提供了丰富的标准概念：

```cpp
#include <concepts>

// 核心语言概念
static_assert(std::same_as<int, int>);
static_assert(std::derived_from<std::string, std::string>);
static_assert(std::convertible_to<int, double>);
static_assert(std::integral<int>);
static_assert(std::floating_point<double>);

// 比较概念
static_assert(std::equality_comparable<int>);
static_assert(std::totally_ordered<int>);

// 对象概念
static_assert(std::movable<std::string>);
static_assert(std::copyable<std::string>);
static_assert(std::regular<int>);

// 可调用概念
static_assert(std::invocable<decltype([](int x) { return x; }), int>);
static_assert(std::predicate<decltype([](int x) { return x > 0; }), int>);
```

---

## 范围（Ranges）

范围库是对 STL 算法的现代化重构，提供了更优雅、更可组合的数据处理方式。

### 范围基础

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <algorithm>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // 传统 STL 方式
    std::vector<int> result_old;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(result_old),
                 [](int n) { return n % 2 == 0; });

    // C++20 范围方式
    auto result_new = numbers | std::views::filter([](int n) { return n % 2 == 0; });

    for (int n : result_new) {
        std::cout << n << " ";  // 输出: 2 4 6 8 10
    }

    return 0;
}
```

### 视图适配器

视图是惰性求值的，不会立即产生结果，而是在遍历时才计算：

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // filter: 过滤元素
    auto evens = numbers | std::views::filter([](int n) { return n % 2 == 0; });

    // transform: 转换元素
    auto squares = numbers | std::views::transform([](int n) { return n * n; });

    // take: 取前 N 个元素
    auto first_five = numbers | std::views::take(5);

    // drop: 跳过前 N 个元素
    auto after_three = numbers | std::views::drop(3);

    // reverse: 反转
    auto reversed = numbers | std::views::reverse;

    // 组合使用：取偶数，平方，取前3个
    auto combined = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(3);

    for (int n : combined) {
        std::cout << n << " ";  // 输出: 4 16 36
    }

    return 0;
}
```

### 范围工厂

```cpp
#include <ranges>
#include <iostream>

int main() {
    // iota: 生成连续序列
    for (int i : std::views::iota(1, 6)) {
        std::cout << i << " ";  // 输出: 1 2 3 4 5
    }
    std::cout << std::endl;

    // iota: 无限序列（配合 take 使用）
    for (int i : std::views::iota(1) | std::views::take(5)) {
        std::cout << i << " ";  // 输出: 1 2 3 4 5
    }
    std::cout << std::endl;

    // single: 单元素视图
    for (int i : std::views::single(42)) {
        std::cout << i << " ";  // 输出: 42
    }
    std::cout << std::endl;

    // empty: 空视图
    for (int i : std::views::empty<int>) {
        std::cout << i << " ";  // 无输出
    }

    // repeat (C++23) 的 C++20 替代方案
    auto repeated = std::views::iota(0, 5)
                  | std::views::transform([](int) { return 42; });

    return 0;
}
```

### 范围算法

C++20 为大多数 STL 算法提供了范围版本：

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // 范围版本的 sort
    std::ranges::sort(numbers);

    // 范围版本的 find
    auto it = std::ranges::find(numbers, 5);
    if (it != numbers.end()) {
        std::cout << "找到: " << *it << std::endl;
    }

    // 范围版本的 count_if
    auto count = std::ranges::count_if(numbers, [](int n) { return n > 5; });
    std::cout << "大于5的元素个数: " << count << std::endl;

    // 投影（Projection）功能
    struct Person {
        std::string name;
        int age;
    };

    std::vector<Person> people = {
        {"张三", 25},
        {"李四", 30},
        {"王五", 20}
    };

    // 按年龄排序（使用投影）
    std::ranges::sort(people, {}, &Person::age);

    // 查找年龄为30的人（使用投影）
    auto person = std::ranges::find(people, 30, &Person::age);
    if (person != people.end()) {
        std::cout << "找到: " << person->name << std::endl;
    }

    return 0;
}
```

### 实际应用示例

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <sstream>

// 字符串处理管道
std::vector<std::string> parse_csv_line(const std::string& line) {
    std::vector<std::string> result;
    std::istringstream iss(line);
    std::string token;

    while (std::getline(iss, token, ',')) {
        result.push_back(token);
    }

    return result;
}

int main() {
    std::string csv_data = "Alice,25,Engineer\nBob,30,Designer\nCharlie,35,Manager";

    // 使用范围处理多行数据
    std::istringstream iss(csv_data);
    std::string line;

    std::vector<std::tuple<std::string, int, std::string>> employees;

    while (std::getline(iss, line)) {
        auto fields = parse_csv_line(line);
        if (fields.size() >= 3) {
            employees.emplace_back(fields[0], std::stoi(fields[1]), fields[2]);
        }
    }

    // 筛选年龄大于28的员工
    auto senior_employees = employees
        | std::views::filter([](const auto& emp) {
            return std::get<1>(emp) > 28;
        });

    for (const auto& [name, age, role] : senior_employees) {
        std::cout << name << " (" << age << ") - " << role << std::endl;
    }

    return 0;
}
```

---

## 协程（Coroutines）

协程是一种可以暂停和恢复执行的函数，非常适合处理异步操作、生成器和状态机。

### 协程基础概念

C++20 的协程是"无栈协程"，由编译器在编译时将协程转换为状态机。协程使用三个新关键字：
- `co_await`：暂停协程，等待异步操作完成
- `co_yield`：暂停协程并返回一个值
- `co_return`：结束协程并返回最终值

### 生成器示例

```cpp
#include <coroutine>
#include <iostream>
#include <optional>

// 简单的生成器类型
template<typename T>
class Generator {
public:
    struct promise_type {
        T current_value;

        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }

        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        std::suspend_always yield_value(T value) {
            current_value = std::move(value);
            return {};
        }

        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

    explicit Generator(handle_type h) : handle_(h) {}

    ~Generator() {
        if (handle_) handle_.destroy();
    }

    // 禁止复制
    Generator(const Generator&) = delete;
    Generator& operator=(const Generator&) = delete;

    // 允许移动
    Generator(Generator&& other) noexcept : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    Generator& operator=(Generator&& other) noexcept {
        if (this != &other) {
            if (handle_) handle_.destroy();
            handle_ = other.handle_;
            other.handle_ = nullptr;
        }
        return *this;
    }

    // 迭代器支持
    class iterator {
    public:
        using iterator_category = std::input_iterator_tag;
        using value_type = T;
        using difference_type = std::ptrdiff_t;
        using pointer = T*;
        using reference = T&;

        iterator() = default;
        explicit iterator(handle_type handle) : handle_(handle) {}

        iterator& operator++() {
            handle_.resume();
            if (handle_.done()) handle_ = nullptr;
            return *this;
        }

        T& operator*() { return handle_.promise().current_value; }

        bool operator==(const iterator& other) const {
            return handle_ == other.handle_;
        }

        bool operator!=(const iterator& other) const {
            return !(*this == other);
        }

    private:
        handle_type handle_ = nullptr;
    };

    iterator begin() {
        if (handle_) {
            handle_.resume();
            if (handle_.done()) return end();
        }
        return iterator{handle_};
    }

    iterator end() { return iterator{}; }

private:
    handle_type handle_;
};

// 使用生成器
Generator<int> fibonacci(int n) {
    int a = 0, b = 1;
    for (int i = 0; i < n; ++i) {
        co_yield a;
        int temp = a + b;
        a = b;
        b = temp;
    }
}

Generator<int> range(int start, int end) {
    for (int i = start; i < end; ++i) {
        co_yield i;
    }
}

int main() {
    std::cout << "斐波那契数列: ";
    for (int n : fibonacci(10)) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    // 输出: 斐波那契数列: 0 1 1 2 3 5 8 13 21 34

    std::cout << "范围: ";
    for (int n : range(1, 6)) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    // 输出: 范围: 1 2 3 4 5

    return 0;
}
```

### 异步任务示例

```cpp
#include <coroutine>
#include <iostream>
#include <thread>
#include <chrono>
#include <functional>
#include <queue>
#include <mutex>

// 简单的异步任务类型
template<typename T>
class Task {
public:
    struct promise_type {
        T result;
        std::exception_ptr exception;

        Task get_return_object() {
            return Task{std::coroutine_handle<promise_type>::from_promise(*this)};
        }

        std::suspend_never initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        void return_value(T value) {
            result = std::move(value);
        }

        void unhandled_exception() {
            exception = std::current_exception();
        }
    };

    using handle_type = std::coroutine_handle<promise_type>;

    explicit Task(handle_type h) : handle_(h) {}

    ~Task() {
        if (handle_) handle_.destroy();
    }

    T get() {
        if (handle_.promise().exception) {
            std::rethrow_exception(handle_.promise().exception);
        }
        return handle_.promise().result;
    }

    bool done() const { return handle_.done(); }

private:
    handle_type handle_;
};

// 模拟异步延迟
struct Delay {
    std::chrono::milliseconds duration;

    bool await_ready() const noexcept { return duration.count() <= 0; }

    void await_suspend(std::coroutine_handle<> handle) const {
        std::thread([handle, d = duration]() {
            std::this_thread::sleep_for(d);
            handle.resume();
        }).detach();
    }

    void await_resume() const noexcept {}
};

// 异步函数示例
Task<int> async_compute(int x) {
    std::cout << "开始计算..." << std::endl;
    co_await Delay{std::chrono::milliseconds(100)};
    std::cout << "计算完成!" << std::endl;
    co_return x * x;
}

int main() {
    auto task = async_compute(5);

    // 等待任务完成
    while (!task.done()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    std::cout << "结果: " << task.get() << std::endl;

    return 0;
}
```

### co_await 详解

```cpp
#include <coroutine>
#include <iostream>

// 自定义 awaitable 类型
struct PrintAwaitable {
    const char* message;

    // 是否需要挂起
    bool await_ready() const noexcept {
        std::cout << "await_ready: " << message << std::endl;
        return false;  // 返回 false 表示需要挂起
    }

    // 挂起时调用
    void await_suspend(std::coroutine_handle<> handle) const noexcept {
        std::cout << "await_suspend: " << message << std::endl;
        // 可以在这里安排异步操作
        handle.resume();  // 立即恢复（实际应用中通常由异步操作完成后调用）
    }

    // 恢复时调用，返回值作为 co_await 表达式的值
    int await_resume() const noexcept {
        std::cout << "await_resume: " << message << std::endl;
        return 42;
    }
};

struct SimpleTask {
    struct promise_type {
        SimpleTask get_return_object() { return {}; }
        std::suspend_never initial_suspend() { return {}; }
        std::suspend_never final_suspend() noexcept { return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };
};

SimpleTask demo_coroutine() {
    std::cout << "协程开始" << std::endl;

    int result = co_await PrintAwaitable{"第一次等待"};
    std::cout << "第一次等待结果: " << result << std::endl;

    co_await PrintAwaitable{"第二次等待"};

    std::cout << "协程结束" << std::endl;
}

int main() {
    demo_coroutine();
    return 0;
}
```

---

## 模块（Modules）

模块是 C++20 引入的全新代码组织机制，旨在替代传统的头文件系统。

### 为什么需要模块？

传统头文件系统存在以下问题：
1. **编译时间长**：每个翻译单元都需要重新解析头文件
2. **宏污染**：头文件中的宏会影响后续代码
3. **包含顺序敏感**：头文件的包含顺序可能影响编译结果
4. **符号可见性控制困难**：难以控制哪些符号对外可见

### 模块基础

```cpp
// math_module.cppm (模块接口文件)
export module math;  // 声明模块名

// 导出函数
export int add(int a, int b) {
    return a + b;
}

export int subtract(int a, int b) {
    return a - b;
}

// 导出类
export class Calculator {
public:
    int add(int a, int b) const { return a + b; }
    int multiply(int a, int b) const { return a * b; }
};

// 内部函数（不导出，对模块外部不可见）
int internal_helper(int x) {
    return x * 2;
}

// 导出命名空间
export namespace math_utils {
    double pi = 3.14159265358979;

    double circle_area(double radius) {
        return pi * radius * radius;
    }
}
```

```cpp
// main.cpp (使用模块)
import math;  // 导入模块
#include <iostream>

int main() {
    std::cout << "5 + 3 = " << add(5, 3) << std::endl;
    std::cout << "5 - 3 = " << subtract(5, 3) << std::endl;

    Calculator calc;
    std::cout << "5 * 3 = " << calc.multiply(5, 3) << std::endl;

    std::cout << "圆的面积 (r=2): " << math_utils::circle_area(2) << std::endl;

    return 0;
}
```

### 模块分区

大型模块可以分成多个分区：

```cpp
// shapes-rectangle.cppm (模块分区)
export module shapes:rectangle;

export struct Rectangle {
    double width;
    double height;

    double area() const { return width * height; }
    double perimeter() const { return 2 * (width + height); }
};
```

```cpp
// shapes-circle.cppm (模块分区)
export module shapes:circle;

export struct Circle {
    double radius;
    static constexpr double pi = 3.14159265358979;

    double area() const { return pi * radius * radius; }
    double circumference() const { return 2 * pi * radius; }
};
```

```cpp
// shapes.cppm (主模块接口，重新导出分区)
export module shapes;

export import :rectangle;
export import :circle;

// 可以添加额外的导出
export double total_area(const Rectangle& r, const Circle& c) {
    return r.area() + c.area();
}
```

```cpp
// main.cpp
import shapes;
#include <iostream>

int main() {
    Rectangle rect{5.0, 3.0};
    Circle circle{2.0};

    std::cout << "矩形面积: " << rect.area() << std::endl;
    std::cout << "圆形面积: " << circle.area() << std::endl;
    std::cout << "总面积: " << total_area(rect, circle) << std::endl;

    return 0;
}
```

### 模块实现单元

```cpp
// math.cppm (模块接口)
export module math;

export int factorial(int n);
export int fibonacci(int n);
```

```cpp
// math_impl.cpp (模块实现)
module math;  // 注意：没有 export 关键字

// 实现导出的函数
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
```

### 导入标准库模块

C++23 将提供标准库模块，但某些编译器已经支持：

```cpp
// 使用标准库模块（编译器支持程度不同）
import std;  // C++23
// 或
import std.core;  // 某些编译器的实验性支持

int main() {
    std::cout << "Hello, Modules!" << std::endl;
    std::vector<int> v = {1, 2, 3, 4, 5};
    return 0;
}
```

---

## 三路比较运算符

三路比较运算符（`<=>`，又称"宇宙飞船运算符"）简化了比较操作的实现。

### 基本用法

```cpp
#include <compare>
#include <iostream>

struct Point {
    int x;
    int y;

    // 自动生成所有比较运算符
    auto operator<=>(const Point&) const = default;
};

int main() {
    Point p1{1, 2};
    Point p2{1, 3};
    Point p3{1, 2};

    // 使用自动生成的运算符
    std::cout << std::boolalpha;
    std::cout << "p1 == p3: " << (p1 == p3) << std::endl;  // true
    std::cout << "p1 != p2: " << (p1 != p2) << std::endl;  // true
    std::cout << "p1 < p2: " << (p1 < p2) << std::endl;    // true
    std::cout << "p1 <= p3: " << (p1 <= p3) << std::endl;  // true
    std::cout << "p2 > p1: " << (p2 > p1) << std::endl;    // true
    std::cout << "p2 >= p1: " << (p2 >= p1) << std::endl;  // true

    return 0;
}
```

### 比较类别

```cpp
#include <compare>
#include <iostream>
#include <cmath>

// 强排序：所有值都可比较，相等的值不可区分
struct Integer {
    int value;

    std::strong_ordering operator<=>(const Integer& other) const {
        return value <=> other.value;
    }

    bool operator==(const Integer& other) const = default;
};

// 弱排序：相等的值可能有区别（如大小写不敏感的字符串）
struct CaseInsensitiveString {
    std::string value;

    std::weak_ordering operator<=>(const CaseInsensitiveString& other) const {
        auto to_lower = [](char c) { return std::tolower(c); };

        auto it1 = value.begin();
        auto it2 = other.value.begin();

        while (it1 != value.end() && it2 != other.value.end()) {
            char c1 = to_lower(*it1++);
            char c2 = to_lower(*it2++);
            if (c1 < c2) return std::weak_ordering::less;
            if (c1 > c2) return std::weak_ordering::greater;
        }

        if (value.size() < other.value.size()) return std::weak_ordering::less;
        if (value.size() > other.value.size()) return std::weak_ordering::greater;
        return std::weak_ordering::equivalent;
    }

    bool operator==(const CaseInsensitiveString& other) const {
        return (*this <=> other) == std::weak_ordering::equivalent;
    }
};

// 偏序：某些值可能无法比较（如浮点数的 NaN）
struct FloatWrapper {
    double value;

    std::partial_ordering operator<=>(const FloatWrapper& other) const {
        return value <=> other.value;  // 处理 NaN
    }

    bool operator==(const FloatWrapper& other) const {
        return value == other.value;
    }
};

int main() {
    // 强排序示例
    Integer i1{5}, i2{10};
    auto result1 = i1 <=> i2;
    if (result1 < 0) std::cout << "i1 < i2" << std::endl;

    // 弱排序示例
    CaseInsensitiveString s1{"Hello"}, s2{"hello"};
    auto result2 = s1 <=> s2;
    if (result2 == std::weak_ordering::equivalent) {
        std::cout << "s1 和 s2 等价" << std::endl;
    }

    // 偏序示例
    FloatWrapper f1{1.0}, f2{std::nan("")};
    auto result3 = f1 <=> f2;
    if (result3 == std::partial_ordering::unordered) {
        std::cout << "f1 和 f2 无法比较" << std::endl;
    }

    return 0;
}
```

### 自定义三路比较

```cpp
#include <compare>
#include <string>
#include <iostream>

class Version {
public:
    int major;
    int minor;
    int patch;

    // 自定义三路比较
    std::strong_ordering operator<=>(const Version& other) const {
        // 先比较主版本号
        if (auto cmp = major <=> other.major; cmp != 0) return cmp;
        // 再比较次版本号
        if (auto cmp = minor <=> other.minor; cmp != 0) return cmp;
        // 最后比较补丁版本号
        return patch <=> other.patch;
    }

    // 需要单独定义 == 运算符
    bool operator==(const Version& other) const = default;

    std::string to_string() const {
        return std::to_string(major) + "." +
               std::to_string(minor) + "." +
               std::to_string(patch);
    }
};

int main() {
    Version v1{1, 2, 3};
    Version v2{1, 2, 4};
    Version v3{2, 0, 0};

    std::cout << v1.to_string() << " < " << v2.to_string() << ": "
              << (v1 < v2) << std::endl;  // true

    std::cout << v2.to_string() << " < " << v3.to_string() << ": "
              << (v2 < v3) << std::endl;  // true

    return 0;
}
```

---

## 指定初始化器

指定初始化器允许按名称初始化聚合类型的成员，提高代码可读性。

### 基本用法

```cpp
#include <iostream>
#include <string>

struct Config {
    std::string host = "localhost";
    int port = 8080;
    bool use_ssl = false;
    int timeout = 30;
    int max_connections = 100;
};

int main() {
    // 指定初始化器：按名称初始化
    Config config1{
        .host = "example.com",
        .port = 443,
        .use_ssl = true
        // timeout 和 max_connections 使用默认值
    };

    // 必须按声明顺序指定
    Config config2{
        .host = "api.example.com",
        .port = 8443,
        .use_ssl = true,
        .timeout = 60,
        .max_connections = 200
    };

    std::cout << "Config1: " << config1.host << ":" << config1.port
              << ", SSL: " << config1.use_ssl
              << ", Timeout: " << config1.timeout << std::endl;

    std::cout << "Config2: " << config2.host << ":" << config2.port
              << ", SSL: " << config2.use_ssl
              << ", Timeout: " << config2.timeout << std::endl;

    return 0;
}
```

### 嵌套结构体

```cpp
#include <iostream>
#include <string>

struct Address {
    std::string city;
    std::string street;
    int zip_code;
};

struct Person {
    std::string name;
    int age;
    Address address;
};

int main() {
    Person person{
        .name = "张三",
        .age = 30,
        .address = {
            .city = "北京",
            .street = "长安街",
            .zip_code = 100000
        }
    };

    std::cout << person.name << ", " << person.age << "岁" << std::endl;
    std::cout << "地址: " << person.address.city << " "
              << person.address.street << std::endl;

    return 0;
}
```

### 数组与指定初始化器

```cpp
#include <iostream>

int main() {
    // 数组的指定初始化器
    int arr[10] = {
        [0] = 1,
        [5] = 10,
        [9] = 100
    };

    for (int i = 0; i < 10; ++i) {
        std::cout << "arr[" << i << "] = " << arr[i] << std::endl;
    }

    return 0;
}
```

### 实际应用：配置对象

```cpp
#include <iostream>
#include <string>
#include <optional>

struct DatabaseConfig {
    std::string host = "localhost";
    int port = 5432;
    std::string database = "mydb";
    std::string username = "root";
    std::string password;
    int pool_size = 10;
    int connection_timeout = 30;
    bool ssl_enabled = false;
    std::optional<std::string> ssl_cert_path;
};

struct ServerConfig {
    std::string listen_address = "0.0.0.0";
    int port = 8080;
    int worker_threads = 4;
    bool enable_logging = true;
    std::string log_level = "info";
};

struct AppConfig {
    ServerConfig server;
    DatabaseConfig database;
    bool debug_mode = false;
};

void print_config(const AppConfig& config) {
    std::cout << "=== 应用配置 ===" << std::endl;
    std::cout << "调试模式: " << (config.debug_mode ? "是" : "否") << std::endl;

    std::cout << "\n--- 服务器配置 ---" << std::endl;
    std::cout << "监听地址: " << config.server.listen_address
              << ":" << config.server.port << std::endl;
    std::cout << "工作线程: " << config.server.worker_threads << std::endl;

    std::cout << "\n--- 数据库配置 ---" << std::endl;
    std::cout << "连接: " << config.database.host
              << ":" << config.database.port << std::endl;
    std::cout << "数据库: " << config.database.database << std::endl;
    std::cout << "连接池大小: " << config.database.pool_size << std::endl;
}

int main() {
    AppConfig config{
        .server = {
            .listen_address = "127.0.0.1",
            .port = 3000,
            .worker_threads = 8,
            .enable_logging = true,
            .log_level = "debug"
        },
        .database = {
            .host = "db.example.com",
            .port = 5432,
            .database = "production",
            .username = "app_user",
            .password = "secret123",
            .pool_size = 20,
            .ssl_enabled = true,
            .ssl_cert_path = "/etc/ssl/certs/db.crt"
        },
        .debug_mode = true
    };

    print_config(config);

    return 0;
}
```

---

## constexpr 改进

C++20 大幅增强了 `constexpr` 的能力，使更多代码可以在编译期执行。

### constexpr 虚函数

```cpp
#include <iostream>

class Shape {
public:
    constexpr virtual ~Shape() = default;
    constexpr virtual double area() const = 0;
};

class Circle : public Shape {
public:
    double radius;

    constexpr Circle(double r) : radius(r) {}

    constexpr double area() const override {
        return 3.14159265358979 * radius * radius;
    }
};

class Rectangle : public Shape {
public:
    double width, height;

    constexpr Rectangle(double w, double h) : width(w), height(h) {}

    constexpr double area() const override {
        return width * height;
    }
};

constexpr double calculate_total_area() {
    Circle c(5.0);
    Rectangle r(4.0, 3.0);
    return c.area() + r.area();
}

int main() {
    constexpr double total = calculate_total_area();
    std::cout << "编译期计算的总面积: " << total << std::endl;

    static_assert(calculate_total_area() > 90.0, "总面积应该大于90");

    return 0;
}
```

### constexpr 动态内存分配

```cpp
#include <iostream>
#include <memory>

constexpr int sum_array() {
    int* arr = new int[5]{1, 2, 3, 4, 5};

    int sum = 0;
    for (int i = 0; i < 5; ++i) {
        sum += arr[i];
    }

    delete[] arr;
    return sum;
}

constexpr auto create_and_sum() {
    auto ptr = std::make_unique<int[]>(3);
    ptr[0] = 10;
    ptr[1] = 20;
    ptr[2] = 30;
    return ptr[0] + ptr[1] + ptr[2];
}

int main() {
    constexpr int result1 = sum_array();
    constexpr int result2 = create_and_sum();

    std::cout << "数组求和: " << result1 << std::endl;    // 15
    std::cout << "智能指针: " << result2 << std::endl;  // 60

    static_assert(sum_array() == 15, "求和应为15");
    static_assert(create_and_sum() == 60, "求和应为60");

    return 0;
}
```

### constexpr std::vector 和 std::string

```cpp
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <iostream>

constexpr int vector_operations() {
    std::vector<int> vec = {5, 2, 8, 1, 9};

    // 排序
    std::sort(vec.begin(), vec.end());

    // 求和
    int sum = std::accumulate(vec.begin(), vec.end(), 0);

    // 添加元素
    vec.push_back(10);

    return sum + vec.back();
}

constexpr std::size_t string_operations() {
    std::string str = "Hello, ";
    str += "World!";

    // 查找
    auto pos = str.find("World");

    return str.length() + pos;
}

constexpr bool is_palindrome(std::string_view sv) {
    std::string s(sv);
    std::string reversed(sv);
    std::reverse(reversed.begin(), reversed.end());
    return s == reversed;
}

int main() {
    constexpr int vec_result = vector_operations();
    constexpr std::size_t str_result = string_operations();

    std::cout << "向量操作结果: " << vec_result << std::endl;   // 35
    std::cout << "字符串操作结果: " << str_result << std::endl; // 20

    static_assert(is_palindrome("radar"), "radar 是回文");
    static_assert(!is_palindrome("hello"), "hello 不是回文");

    return 0;
}
```

### constexpr try-catch

```cpp
#include <stdexcept>
#include <iostream>

constexpr int safe_divide(int a, int b) {
    if (b == 0) {
        throw std::runtime_error("除数不能为零");
    }
    return a / b;
}

constexpr int safe_operation() {
    try {
        return safe_divide(10, 2);
    } catch (...) {
        return -1;
    }
}

int main() {
    constexpr int result = safe_operation();
    std::cout << "结果: " << result << std::endl;  // 5

    // 运行时会抛出异常
    try {
        int bad_result = safe_divide(10, 0);
        std::cout << bad_result << std::endl;
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << std::endl;
    }

    return 0;
}
```

### consteval：强制编译期求值

```cpp
#include <iostream>

// consteval 函数必须在编译期求值
consteval int compile_time_factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

// constinit：编译期初始化，但运行时可修改
constinit int global_value = compile_time_factorial(5);

consteval int square(int n) {
    return n * n;
}

int main() {
    // 编译期计算
    constexpr int fact5 = compile_time_factorial(5);
    std::cout << "5! = " << fact5 << std::endl;  // 120

    constexpr int sq10 = square(10);
    std::cout << "10^2 = " << sq10 << std::endl;  // 100

    // 以下代码会编译失败，因为 consteval 函数必须在编译期求值
    // int n = 5;
    // int result = compile_time_factorial(n);  // 错误！

    // constinit 变量可以在运行时修改
    global_value = 100;
    std::cout << "global_value = " << global_value << std::endl;

    return 0;
}
```

---

## 其他重要特性

### 范围 for 循环的初始化语句

```cpp
#include <iostream>
#include <vector>
#include <map>

int main() {
    // 在范围 for 循环中初始化
    for (std::vector<int> vec = {1, 2, 3, 4, 5}; int n : vec) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    // 实际应用：遍历临时容器
    for (auto get_data = []() {
            return std::vector<int>{10, 20, 30};
         };
         int n : get_data()) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### [[likely]] 和 [[unlikely]] 属性

```cpp
#include <iostream>

int process_value(int value) {
    if (value > 0) [[likely]] {
        // 编译器会优化这个分支
        return value * 2;
    } else [[unlikely]] {
        // 这个分支不太可能执行
        return handle_error(value);
    }
}

int handle_error(int value) {
    std::cerr << "错误值: " << value << std::endl;
    return -1;
}

int main() {
    // 正常情况
    std::cout << process_value(5) << std::endl;   // 10

    // 异常情况
    std::cout << process_value(-1) << std::endl;  // -1

    return 0;
}
```

### [[nodiscard]] 改进

```cpp
#include <iostream>
#include <string>

// 带消息的 [[nodiscard]]
[[nodiscard("错误码不应被忽略")]]
int open_file(const std::string& filename) {
    // 模拟打开文件
    if (filename.empty()) {
        return -1;  // 错误
    }
    return 0;  // 成功
}

// 应用于类型
struct [[nodiscard("Result 对象包含重要的错误信息")]] Result {
    bool success;
    std::string message;
};

Result perform_operation() {
    return {true, "操作成功"};
}

// 应用于构造函数
class Resource {
public:
    [[nodiscard]] Resource() = default;
};

int main() {
    // 以下代码会产生编译器警告
    // open_file("test.txt");  // 警告：返回值被忽略
    // perform_operation();     // 警告：返回值被忽略

    // 正确用法
    int result = open_file("test.txt");
    if (result != 0) {
        std::cerr << "打开文件失败" << std::endl;
    }

    auto op_result = perform_operation();
    if (op_result.success) {
        std::cout << op_result.message << std::endl;
    }

    return 0;
}
```

### std::span

```cpp
#include <span>
#include <vector>
#include <array>
#include <iostream>

// span 是非拥有的连续序列视图
void print_span(std::span<const int> data) {
    for (int n : data) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
}

void modify_span(std::span<int> data) {
    for (int& n : data) {
        n *= 2;
    }
}

int main() {
    // 从不同来源创建 span
    int c_array[] = {1, 2, 3, 4, 5};
    std::vector<int> vec = {6, 7, 8, 9, 10};
    std::array<int, 5> arr = {11, 12, 13, 14, 15};

    print_span(c_array);  // 1 2 3 4 5
    print_span(vec);      // 6 7 8 9 10
    print_span(arr);      // 11 12 13 14 15

    // 子范围
    std::span<int> full_span(vec);
    std::span<int> first_three = full_span.first(3);
    std::span<int> last_two = full_span.last(2);
    std::span<int> middle = full_span.subspan(1, 3);

    std::cout << "前三个: ";
    print_span(first_three);  // 6 7 8

    std::cout << "后两个: ";
    print_span(last_two);     // 9 10

    std::cout << "中间: ";
    print_span(middle);       // 7 8 9

    // 修改通过 span
    modify_span(vec);
    std::cout << "修改后: ";
    print_span(vec);          // 12 14 16 18 20

    // 固定大小的 span
    std::span<int, 5> fixed_span(c_array);
    static_assert(fixed_span.size() == 5);

    return 0;
}
```

### std::format

```cpp
#include <format>
#include <iostream>
#include <string>
#include <vector>

int main() {
    // 基本格式化
    std::string name = "张三";
    int age = 30;
    std::cout << std::format("姓名: {}, 年龄: {}", name, age) << std::endl;

    // 位置参数
    std::cout << std::format("{1} 今年 {0} 岁", age, name) << std::endl;

    // 格式说明符
    double pi = 3.14159265358979;
    std::cout << std::format("Pi = {:.2f}", pi) << std::endl;        // 3.14
    std::cout << std::format("Pi = {:.5f}", pi) << std::endl;        // 3.14159
    std::cout << std::format("Pi = {:10.3f}", pi) << std::endl;      // "     3.142"
    std::cout << std::format("Pi = {:>10.3f}", pi) << std::endl;     // "     3.142"
    std::cout << std::format("Pi = {:<10.3f}", pi) << std::endl;     // "3.142     "
    std::cout << std::format("Pi = {:^10.3f}", pi) << std::endl;     // "  3.142   "

    // 整数格式化
    int num = 255;
    std::cout << std::format("十进制: {}", num) << std::endl;         // 255
    std::cout << std::format("十六进制: {:x}", num) << std::endl;     // ff
    std::cout << std::format("十六进制: {:X}", num) << std::endl;     // FF
    std::cout << std::format("十六进制: {:#x}", num) << std::endl;    // 0xff
    std::cout << std::format("八进制: {:o}", num) << std::endl;       // 377
    std::cout << std::format("二进制: {:b}", num) << std::endl;       // 11111111
    std::cout << std::format("二进制: {:#b}", num) << std::endl;      // 0b11111111

    // 填充和对齐
    std::cout << std::format("{:*>10}", 42) << std::endl;   // ********42
    std::cout << std::format("{:*<10}", 42) << std::endl;   // 42********
    std::cout << std::format("{:*^10}", 42) << std::endl;   // ****42****

    // 使用 format_to 写入迭代器
    std::string buffer;
    std::format_to(std::back_inserter(buffer), "值 = {}", 100);
    std::cout << buffer << std::endl;

    return 0;
}
```

### 日历和时区库

```cpp
#include <chrono>
#include <iostream>
#include <format>

int main() {
    using namespace std::chrono;

    // 日期字面量
    auto date = 2024y/March/15d;
    std::cout << std::format("日期: {}", date) << std::endl;

    // 年月日
    year_month_day ymd{2024y, March, 15d};
    std::cout << std::format("年: {}, 月: {}, 日: {}",
                             int(ymd.year()),
                             unsigned(ymd.month()),
                             unsigned(ymd.day())) << std::endl;

    // 星期几
    auto weekday = weekday{ymd};
    std::cout << std::format("星期: {}", weekday) << std::endl;

    // 时间点和时区
    auto now = system_clock::now();
    std::cout << std::format("当前UTC时间: {}", now) << std::endl;

    // 本地时间
    auto local = zoned_time{current_zone(), now};
    std::cout << std::format("本地时间: {}", local) << std::endl;

    // 特定时区
    auto tokyo = zoned_time{"Asia/Tokyo", now};
    std::cout << std::format("东京时间: {}", tokyo) << std::endl;

    auto new_york = zoned_time{"America/New_York", now};
    std::cout << std::format("纽约时间: {}", new_york) << std::endl;

    // 日期计算
    auto future_date = ymd + months{3} + days{10};
    std::cout << std::format("三个月后: {}", future_date) << std::endl;

    // 获取某月的最后一天
    auto last_day = 2024y/February/last;
    std::cout << std::format("2024年2月最后一天: {}",
                             year_month_day{last_day}) << std::endl;

    // 时间间隔
    auto duration = 2h + 30min + 45s;
    std::cout << std::format("持续时间: {}", duration) << std::endl;

    return 0;
}
```

### std::jthread 和协作式取消

```cpp
#include <thread>
#include <stop_token>
#include <iostream>
#include <chrono>

void worker(std::stop_token stop_token, int id) {
    while (!stop_token.stop_requested()) {
        std::cout << "工作线程 " << id << " 正在运行..." << std::endl;
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
    std::cout << "工作线程 " << id << " 收到停止请求，正在退出..." << std::endl;
}

int main() {
    // jthread 自动 join
    {
        std::jthread t1(worker, 1);
        std::jthread t2(worker, 2);

        std::this_thread::sleep_for(std::chrono::seconds(2));

        // 请求停止
        t1.request_stop();
        t2.request_stop();

        // 离开作用域时自动 join
    }

    std::cout << "所有线程已停止" << std::endl;

    // 使用 stop_callback
    {
        std::jthread t([](std::stop_token st) {
            std::stop_callback callback(st, []() {
                std::cout << "停止回调被调用" << std::endl;
            });

            while (!st.stop_requested()) {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        });

        std::this_thread::sleep_for(std::chrono::milliseconds(500));
        t.request_stop();
    }

    return 0;
}
```

### std::source_location

```cpp
#include <source_location>
#include <iostream>
#include <string_view>

void log(std::string_view message,
         const std::source_location& location = std::source_location::current()) {
    std::cout << "文件: " << location.file_name() << std::endl;
    std::cout << "函数: " << location.function_name() << std::endl;
    std::cout << "行号: " << location.line() << std::endl;
    std::cout << "列号: " << location.column() << std::endl;
    std::cout << "消息: " << message << std::endl;
    std::cout << "---" << std::endl;
}

void some_function() {
    log("从 some_function 调用");
}

class MyClass {
public:
    void method() {
        log("从类方法调用");
    }
};

int main() {
    log("从 main 调用");
    some_function();

    MyClass obj;
    obj.method();

    return 0;
}
```

### std::bit_cast

```cpp
#include <bit>
#include <cstdint>
#include <iostream>
#include <iomanip>

int main() {
    // float 到 uint32_t 的位转换
    float f = 3.14159f;
    auto bits = std::bit_cast<std::uint32_t>(f);

    std::cout << "float: " << f << std::endl;
    std::cout << "位表示: 0x" << std::hex << bits << std::dec << std::endl;

    // 反向转换
    auto f2 = std::bit_cast<float>(bits);
    std::cout << "还原: " << f2 << std::endl;

    // double 到 uint64_t
    double d = 2.718281828;
    auto d_bits = std::bit_cast<std::uint64_t>(d);
    std::cout << "double 位表示: 0x" << std::hex << d_bits << std::dec << std::endl;

    // 位操作函数
    unsigned int x = 0b0011'0100;

    std::cout << "popcount: " << std::popcount(x) << std::endl;      // 3 (1的个数)
    std::cout << "has_single_bit: " << std::has_single_bit(x) << std::endl;  // false
    std::cout << "countl_zero: " << std::countl_zero(x) << std::endl;  // 前导零
    std::cout << "countr_zero: " << std::countr_zero(x) << std::endl;  // 尾随零
    std::cout << "bit_width: " << std::bit_width(x) << std::endl;      // 位宽度

    // 2的幂相关
    std::cout << "bit_ceil(5): " << std::bit_ceil(5u) << std::endl;    // 8
    std::cout << "bit_floor(5): " << std::bit_floor(5u) << std::endl;  // 4

    // 位旋转
    std::uint8_t val = 0b1011'0010;
    std::cout << "rotl: " << std::bitset<8>(std::rotl(val, 2)) << std::endl;
    std::cout << "rotr: " << std::bitset<8>(std::rotr(val, 2)) << std::endl;

    return 0;
}
```

---

## 总结

C++20 带来了革命性的改进，这些特性共同构成了现代 C++ 编程的基础：

| 特性 | 主要优势 |
|------|---------|
| **概念** | 更清晰的模板约束，更好的错误信息 |
| **范围** | 惰性求值，可组合的数据处理管道 |
| **协程** | 简化异步编程，支持生成器模式 |
| **模块** | 更快的编译，更好的封装 |
| **三路比较** | 简化比较运算符的实现 |
| **指定初始化器** | 更清晰的聚合类型初始化 |
| **constexpr 改进** | 更多编译期计算能力 |

### 迁移建议

1. **逐步采用**：从最简单的特性开始，如三路比较和指定初始化器
2. **概念优先**：在新的模板代码中使用概念替代 SFINAE
3. **范围库**：用范围替代复杂的 STL 算法链
4. **模块化**：新项目考虑使用模块组织代码

### 编译器支持

截至目前，主要编译器对 C++20 的支持情况：
- **GCC 10+**：大部分特性支持
- **Clang 12+**：大部分特性支持
- **MSVC 19.28+**：大部分特性支持

建议使用最新版本的编译器以获得最佳支持。

### 参考资源

- [C++ Reference](https://en.cppreference.com/w/cpp/20)
- [ISO C++20 标准](https://isocpp.org/std/the-standard)
- [C++20 编译器支持状态](https://en.cppreference.com/w/cpp/compiler_support/20)
