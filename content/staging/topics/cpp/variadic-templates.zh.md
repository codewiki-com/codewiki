---
title: C++ 可变参数模板
description: 深入理解 C++ 可变参数模板：参数包、包展开、折叠表达式与递归模板的完整指南
track: cpp
section: templates-generic
difficulty: advanced
tags:
  - C++
  - 模板
  - 可变参数模板
  - 参数包
  - 折叠表达式
  - 元编程
status: imported
origin: old/src/content/docs/cpp/variadic-templates.zh.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 模板
  order: 5
  lastUpdated: 2026-01-07
---

可变参数模板（Variadic Templates）是 C++11 引入的强大特性，允许模板接受任意数量、任意类型的参数。它是实现类型安全的可变参数函数、元组、智能指针工厂函数等现代 C++ 特性的基础。

## 概念解释

### 什么是可变参数模板

可变参数模板是一种能够接受零个或多个模板参数的模板。与传统 C 语言的 `va_list` 可变参数不同，C++ 可变参数模板在编译期处理，提供完全的类型安全。

```cpp
// 传统 C 风格可变参数（不类型安全）
int printf(const char* format, ...);

// C++ 可变参数模板（类型安全）
template<typename... Args>
void print(Args... args);
```

### 历史背景

在 C++11 之前，实现接受任意数量参数的模板非常困难，通常需要：
- 为不同参数数量编写多个重载版本
- 使用宏生成代码
- 依赖 C 风格的可变参数（丧失类型安全）

C++11 引入的可变参数模板彻底解决了这一问题，而 C++17 的折叠表达式进一步简化了相关代码的编写。

### 解决的问题

可变参数模板主要解决以下问题：

1. **类型安全的可变参数函数**：如 `std::make_unique`、`std::make_shared`
2. **元组实现**：`std::tuple` 可以存储任意数量、任意类型的元素
3. **完美转发**：`std::forward` 配合可变参数实现完美转发
4. **编译期计算**：在编译期处理任意数量的类型或值

## 核心原理

### 参数包（Parameter Pack）

参数包是可变参数模板的核心概念，分为两种：

**模板参数包（Template Parameter Pack）**：表示零个或多个模板参数

```cpp
template<typename... Types>  // Types 是模板参数包
class Tuple;
```

**函数参数包（Function Parameter Pack）**：表示零个或多个函数参数

```cpp
template<typename... Args>
void func(Args... args);  // args 是函数参数包
```

### 参数包的内部表示

编译器将参数包视为一个"参数序列"的抽象。例如：

```cpp
template<typename... Types>
void example(Types... args);

// 调用 example(1, 2.0, "hello") 时：
// Types... 展开为 int, double, const char*
// args...  展开为 1, 2.0, "hello"
```

### 包展开（Pack Expansion）

包展开是将参数包转换为逗号分隔的实际参数列表的过程。展开模式为 `pattern...`，其中 `pattern` 包含至少一个参数包名称。

```cpp
template<typename... Args>
void wrapper(Args... args) {
    // 简单展开
    other_func(args...);  // 展开为 other_func(arg1, arg2, arg3, ...)

    // 带模式展开
    other_func(process(args)...);  // 展开为 other_func(process(arg1), process(arg2), ...)
}
```

## 核心要点

### sizeof... 运算符

`sizeof...` 返回参数包中的元素数量，是编译期常量。

```cpp
#include <iostream>

template<typename... Args>
constexpr std::size_t count_args(Args... args) {
    return sizeof...(Args);  // 返回类型参数包大小
    // 等价于 sizeof...(args) 返回函数参数包大小
}

int main() {
    std::cout << count_args() << std::endl;           // 0
    std::cout << count_args(1) << std::endl;          // 1
    std::cout << count_args(1, 2.0, "hi") << std::endl; // 3

    // 编译期使用
    static_assert(count_args(1, 2, 3) == 3);
    return 0;
}
```

### 参数包展开上下文

参数包可以在多种上下文中展开：

```cpp
#include <iostream>
#include <vector>
#include <tuple>

template<typename... Args>
void demonstrate_expansion(Args... args) {
    // 1. 函数调用参数
    auto tuple = std::make_tuple(args...);

    // 2. 初始化列表
    int arr[] = {(std::cout << args << " ", 0)...};
    std::cout << std::endl;

    // 3. 类型列表
    using TypeTuple = std::tuple<Args...>;

    // 4. 基类列表（在类定义中）
    // class Derived : public Args... {};

    // 5. 成员初始化列表（在构造函数中）
    // Constructor() : Args(default_value)... {}

    // 6. Lambda 捕获
    auto lambda = [args...]() {
        ((std::cout << args << " "), ...);  // C++17 折叠表达式
    };
    lambda();
}

int main() {
    demonstrate_expansion(1, 2.5, "hello");
    return 0;
}
```

### 嵌套参数包展开

当模式包含多个参数包时，它们必须具有相同的长度并同时展开：

```cpp
#include <iostream>
#include <utility>

template<typename... T, typename... U>
void zip_print(std::tuple<T...> t1, std::tuple<U...> t2) {
    // 使用索引序列来同时访问两个元组
    auto print_pair = [&]<std::size_t... I>(std::index_sequence<I...>) {
        ((std::cout << "(" << std::get<I>(t1) << ", " << std::get<I>(t2) << ") "), ...);
    };
    print_pair(std::make_index_sequence<sizeof...(T)>{});
    std::cout << std::endl;
}

int main() {
    auto t1 = std::make_tuple(1, 2, 3);
    auto t2 = std::make_tuple("a", "b", "c");
    zip_print(t1, t2);  // (1, a) (2, b) (3, c)
    return 0;
}
```

### 参数包与完美转发

可变参数模板与完美转发结合是实现通用工厂函数的关键：

```cpp
#include <iostream>
#include <memory>
#include <utility>

class Widget {
public:
    Widget() { std::cout << "Default constructor" << std::endl; }
    Widget(int x) { std::cout << "Int constructor: " << x << std::endl; }
    Widget(int x, double y) {
        std::cout << "Int+Double constructor: " << x << ", " << y << std::endl;
    }
    Widget(const std::string& s) { std::cout << "String constructor: " << s << std::endl; }
};

// 模拟 std::make_unique 的实现
template<typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

int main() {
    auto w1 = my_make_unique<Widget>();           // 默认构造
    auto w2 = my_make_unique<Widget>(42);         // int 构造
    auto w3 = my_make_unique<Widget>(42, 3.14);   // int+double 构造
    auto w4 = my_make_unique<Widget>(std::string("hello")); // string 构造
    return 0;
}
```

## 代码示例

### 示例1：递归模板处理参数包

在 C++17 折叠表达式出现之前，递归是处理参数包的主要方式：

```cpp
#include <iostream>
#include <string>

// 基准情况：零个参数
void print() {
    std::cout << std::endl;
}

// 递归情况：至少一个参数
template<typename T, typename... Rest>
void print(T first, Rest... rest) {
    std::cout << first;
    if constexpr (sizeof...(rest) > 0) {
        std::cout << ", ";
    }
    print(rest...);  // 递归调用，参数包减少一个
}

// 递归求和
template<typename T>
T sum(T value) {
    return value;
}

template<typename T, typename... Rest>
auto sum(T first, Rest... rest) {
    return first + sum(rest...);
}

// 递归求最大值
template<typename T>
T max_value(T value) {
    return value;
}

template<typename T, typename... Rest>
auto max_value(T first, Rest... rest) {
    auto rest_max = max_value(rest...);
    return (first > rest_max) ? first : rest_max;
}

int main() {
    print(1, 2.5, "hello", 'c');  // 1, 2.5, hello, c

    std::cout << "Sum: " << sum(1, 2, 3, 4, 5) << std::endl;  // 15
    std::cout << "Max: " << max_value(3, 1, 4, 1, 5, 9, 2, 6) << std::endl;  // 9

    return 0;
}
```

### 示例2：折叠表达式（C++17）

C++17 引入的折叠表达式大大简化了参数包处理：

```cpp
#include <iostream>
#include <string>

// ============ 四种折叠表达式形式 ============

// 1. 一元右折叠: (pack op ...)
//    展开为: (arg1 op (arg2 op (arg3 op arg4)))
template<typename... Args>
auto sum_right(Args... args) {
    return (args + ...);
}

// 2. 一元左折叠: (... op pack)
//    展开为: (((arg1 op arg2) op arg3) op arg4)
template<typename... Args>
auto sum_left(Args... args) {
    return (... + args);
}

// 3. 二元右折叠: (pack op ... op init)
//    展开为: (arg1 op (arg2 op (arg3 op init)))
template<typename... Args>
auto sum_right_init(Args... args) {
    return (args + ... + 0);  // 空包时返回 0
}

// 4. 二元左折叠: (init op ... op pack)
//    展开为: (((init op arg1) op arg2) op arg3)
template<typename... Args>
auto sum_left_init(Args... args) {
    return (0 + ... + args);  // 空包时返回 0
}

// ============ 实用示例 ============

// 打印所有参数
template<typename... Args>
void print_all(Args... args) {
    ((std::cout << args << " "), ...);  // 逗号运算符折叠
    std::cout << std::endl;
}

// 带分隔符打印
template<typename... Args>
void print_with_separator(const std::string& sep, Args... args) {
    std::size_t n = 0;
    ((std::cout << args << (++n < sizeof...(Args) ? sep : "")), ...);
    std::cout << std::endl;
}

// 逻辑运算
template<typename... Args>
bool all_true(Args... args) {
    return (args && ...);  // 一元右折叠
}

template<typename... Args>
bool any_true(Args... args) {
    return (args || ...);  // 一元右折叠
}

// 空包安全版本
template<typename... Args>
bool all_true_safe(Args... args) {
    return (args && ... && true);  // 二元右折叠，空包返回 true
}

template<typename... Args>
bool any_true_safe(Args... args) {
    return (false || ... || args);  // 二元左折叠，空包返回 false
}

// 连续比较
template<typename T, typename... Args>
bool all_equal(T first, Args... args) {
    return ((first == args) && ...);
}

template<typename T, typename... Args>
bool is_in(T value, Args... args) {
    return ((value == args) || ...);
}

int main() {
    // 求和测试
    std::cout << "Sum right: " << sum_right(1, 2, 3, 4) << std::endl;      // 10
    std::cout << "Sum left: " << sum_left(1, 2, 3, 4) << std::endl;        // 10
    std::cout << "Sum right init (empty): " << sum_right_init() << std::endl;  // 0

    // 打印测试
    print_all(1, 2.5, "hello", 'c');
    print_with_separator(" | ", "apple", "banana", "cherry");

    // 逻辑运算测试
    std::cout << "All true (1,1,1): " << all_true(true, true, true) << std::endl;   // 1
    std::cout << "All true (1,0,1): " << all_true(true, false, true) << std::endl;  // 0
    std::cout << "Any true (0,1,0): " << any_true(false, true, false) << std::endl; // 1

    // 比较测试
    std::cout << "All equal (5,5,5): " << all_equal(5, 5, 5) << std::endl;     // 1
    std::cout << "All equal (5,5,6): " << all_equal(5, 5, 6) << std::endl;     // 0
    std::cout << "Is 3 in (1,2,3,4): " << is_in(3, 1, 2, 3, 4) << std::endl;  // 1
    std::cout << "Is 5 in (1,2,3,4): " << is_in(5, 1, 2, 3, 4) << std::endl;  // 0

    return 0;
}
```

### 示例3：类型安全的 printf

```cpp
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// 类型安全的 printf 实现
template<typename T>
void format_arg(std::ostream& os, const char*& fmt, T&& arg) {
    while (*fmt) {
        if (*fmt == '%') {
            if (*(fmt + 1) == '%') {
                ++fmt;  // 跳过转义的 %%
            } else {
                os << std::forward<T>(arg);
                ++fmt;
                // 跳过格式说明符（简化处理）
                while (*fmt && *fmt != ' ' && *fmt != '%') ++fmt;
                return;
            }
        }
        os << *fmt++;
    }
    throw std::runtime_error("Extra argument provided");
}

// 基准情况
void safe_printf(std::ostream& os, const char* fmt) {
    while (*fmt) {
        if (*fmt == '%') {
            if (*(fmt + 1) == '%') {
                ++fmt;
            } else {
                throw std::runtime_error("Missing argument");
            }
        }
        os << *fmt++;
    }
}

// 递归情况
template<typename T, typename... Args>
void safe_printf(std::ostream& os, const char* fmt, T&& first, Args&&... rest) {
    format_arg(os, fmt, std::forward<T>(first));
    safe_printf(os, fmt, std::forward<Args>(rest)...);
}

// 便捷接口
template<typename... Args>
void safe_print(const char* fmt, Args&&... args) {
    safe_printf(std::cout, fmt, std::forward<Args>(args)...);
}

template<typename... Args>
std::string safe_format(const char* fmt, Args&&... args) {
    std::ostringstream oss;
    safe_printf(oss, fmt, std::forward<Args>(args)...);
    return oss.str();
}

int main() {
    safe_print("Hello, %s! You are %d years old.\n", "Alice", 25);
    safe_print("Pi is approximately %f\n", 3.14159);
    safe_print("Escaped percent: %%\n");

    std::string result = safe_format("Result: %d + %d = %d", 2, 3, 5);
    std::cout << result << std::endl;

    return 0;
}
```

### 示例4：编译期类型列表操作

```cpp
#include <iostream>
#include <type_traits>
#include <tuple>

// ============ 类型列表定义 ============

template<typename... Types>
struct TypeList {};

// ============ 类型列表长度 ============

template<typename List>
struct Length;

template<typename... Types>
struct Length<TypeList<Types...>> {
    static constexpr std::size_t value = sizeof...(Types);
};

template<typename List>
inline constexpr std::size_t Length_v = Length<List>::value;

// ============ 获取第 N 个类型 ============

template<std::size_t N, typename List>
struct TypeAt;

template<typename Head, typename... Tail>
struct TypeAt<0, TypeList<Head, Tail...>> {
    using type = Head;
};

template<std::size_t N, typename Head, typename... Tail>
struct TypeAt<N, TypeList<Head, Tail...>> {
    using type = typename TypeAt<N - 1, TypeList<Tail...>>::type;
};

template<std::size_t N, typename List>
using TypeAt_t = typename TypeAt<N, List>::type;

// ============ 添加类型到列表头部 ============

template<typename T, typename List>
struct Prepend;

template<typename T, typename... Types>
struct Prepend<T, TypeList<Types...>> {
    using type = TypeList<T, Types...>;
};

template<typename T, typename List>
using Prepend_t = typename Prepend<T, List>::type;

// ============ 添加类型到列表尾部 ============

template<typename T, typename List>
struct Append;

template<typename T, typename... Types>
struct Append<T, TypeList<Types...>> {
    using type = TypeList<Types..., T>;
};

template<typename T, typename List>
using Append_t = typename Append<T, List>::type;

// ============ 连接两个类型列表 ============

template<typename List1, typename List2>
struct Concat;

template<typename... Types1, typename... Types2>
struct Concat<TypeList<Types1...>, TypeList<Types2...>> {
    using type = TypeList<Types1..., Types2...>;
};

template<typename List1, typename List2>
using Concat_t = typename Concat<List1, List2>::type;

// ============ 检查类型是否在列表中 ============

template<typename T, typename List>
struct Contains;

template<typename T>
struct Contains<T, TypeList<>> : std::false_type {};

template<typename T, typename Head, typename... Tail>
struct Contains<T, TypeList<Head, Tail...>>
    : std::conditional_t<std::is_same_v<T, Head>,
                         std::true_type,
                         Contains<T, TypeList<Tail...>>> {};

template<typename T, typename List>
inline constexpr bool Contains_v = Contains<T, List>::value;

// ============ 对每个类型应用模板 ============

template<template<typename> class Transform, typename List>
struct Map;

template<template<typename> class Transform, typename... Types>
struct Map<Transform, TypeList<Types...>> {
    using type = TypeList<typename Transform<Types>::type...>;
};

template<template<typename> class Transform, typename List>
using Map_t = typename Map<Transform, List>::type;

// ============ 过滤类型列表 ============

template<template<typename> class Predicate, typename List>
struct Filter;

template<template<typename> class Predicate>
struct Filter<Predicate, TypeList<>> {
    using type = TypeList<>;
};

template<template<typename> class Predicate, typename Head, typename... Tail>
struct Filter<Predicate, TypeList<Head, Tail...>> {
private:
    using filtered_tail = typename Filter<Predicate, TypeList<Tail...>>::type;
public:
    using type = std::conditional_t<
        Predicate<Head>::value,
        Prepend_t<Head, filtered_tail>,
        filtered_tail
    >;
};

template<template<typename> class Predicate, typename List>
using Filter_t = typename Filter<Predicate, List>::type;

// ============ 测试 ============

int main() {
    using MyList = TypeList<int, double, char, float, long>;

    // 长度
    std::cout << "Length: " << Length_v<MyList> << std::endl;  // 5

    // 获取第 N 个类型
    static_assert(std::is_same_v<TypeAt_t<0, MyList>, int>);
    static_assert(std::is_same_v<TypeAt_t<2, MyList>, char>);
    std::cout << "TypeAt<2>: char" << std::endl;

    // 添加类型
    using Prepended = Prepend_t<bool, MyList>;
    static_assert(std::is_same_v<TypeAt_t<0, Prepended>, bool>);
    std::cout << "Prepend bool: new length = " << Length_v<Prepended> << std::endl;  // 6

    // 连接列表
    using List1 = TypeList<int, double>;
    using List2 = TypeList<char, float>;
    using Combined = Concat_t<List1, List2>;
    static_assert(Length_v<Combined> == 4);
    std::cout << "Concat: length = " << Length_v<Combined> << std::endl;  // 4

    // 检查包含
    static_assert(Contains_v<double, MyList>);
    static_assert(!Contains_v<std::string, MyList>);
    std::cout << "Contains double: true" << std::endl;
    std::cout << "Contains string: false" << std::endl;

    // 映射转换（添加指针）
    using PtrList = Map_t<std::add_pointer, MyList>;
    static_assert(std::is_same_v<TypeAt_t<0, PtrList>, int*>);
    std::cout << "Map add_pointer: int* at index 0" << std::endl;

    // 过滤（只保留整数类型）
    using IntegralList = Filter_t<std::is_integral, MyList>;
    static_assert(Length_v<IntegralList> == 3);  // int, char, long
    std::cout << "Filter is_integral: length = " << Length_v<IntegralList> << std::endl;

    return 0;
}
```

### 示例5：实现简易 std::tuple

```cpp
#include <iostream>
#include <utility>
#include <type_traits>

// ============ Tuple 定义 ============

// 空元组基类
template<typename... Types>
class Tuple {};

// 特化：非空元组
template<typename Head, typename... Tail>
class Tuple<Head, Tail...> : private Tuple<Tail...> {
public:
    using value_type = Head;
    using base_type = Tuple<Tail...>;

private:
    Head value_;

public:
    // 默认构造
    Tuple() : base_type(), value_{} {}

    // 带值构造
    Tuple(Head head, Tail... tail)
        : base_type(tail...), value_(std::move(head)) {}

    // 完美转发构造
    template<typename H, typename... T,
             typename = std::enable_if_t<sizeof...(T) == sizeof...(Tail)>>
    Tuple(H&& head, T&&... tail)
        : base_type(std::forward<T>(tail)...)
        , value_(std::forward<H>(head)) {}

    // 获取当前值
    Head& head() { return value_; }
    const Head& head() const { return value_; }

    // 获取尾部元组
    base_type& tail() { return *this; }
    const base_type& tail() const { return *this; }
};

// ============ tuple_size ============

template<typename T>
struct tuple_size;

template<typename... Types>
struct tuple_size<Tuple<Types...>>
    : std::integral_constant<std::size_t, sizeof...(Types)> {};

template<typename T>
inline constexpr std::size_t tuple_size_v = tuple_size<T>::value;

// ============ tuple_element ============

template<std::size_t N, typename T>
struct tuple_element;

template<typename Head, typename... Tail>
struct tuple_element<0, Tuple<Head, Tail...>> {
    using type = Head;
};

template<std::size_t N, typename Head, typename... Tail>
struct tuple_element<N, Tuple<Head, Tail...>>
    : tuple_element<N - 1, Tuple<Tail...>> {};

template<std::size_t N, typename T>
using tuple_element_t = typename tuple_element<N, T>::type;

// ============ get ============

template<std::size_t N, typename Head, typename... Tail>
auto& get(Tuple<Head, Tail...>& t) {
    if constexpr (N == 0) {
        return t.head();
    } else {
        return get<N - 1>(t.tail());
    }
}

template<std::size_t N, typename Head, typename... Tail>
const auto& get(const Tuple<Head, Tail...>& t) {
    if constexpr (N == 0) {
        return t.head();
    } else {
        return get<N - 1>(t.tail());
    }
}

// ============ make_tuple ============

template<typename... Args>
auto make_tuple(Args&&... args) {
    return Tuple<std::decay_t<Args>...>(std::forward<Args>(args)...);
}

// ============ 打印元组 ============

template<typename... Types, std::size_t... I>
void print_tuple_impl(const Tuple<Types...>& t, std::index_sequence<I...>) {
    std::cout << "(";
    ((std::cout << (I == 0 ? "" : ", ") << get<I>(t)), ...);
    std::cout << ")" << std::endl;
}

template<typename... Types>
void print_tuple(const Tuple<Types...>& t) {
    print_tuple_impl(t, std::make_index_sequence<sizeof...(Types)>{});
}

// ============ 测试 ============

int main() {
    // 创建元组
    auto t1 = make_tuple(1, 2.5, std::string("hello"));

    // 获取大小
    std::cout << "Tuple size: " << tuple_size_v<decltype(t1)> << std::endl;  // 3

    // 获取元素
    std::cout << "Element 0: " << get<0>(t1) << std::endl;  // 1
    std::cout << "Element 1: " << get<1>(t1) << std::endl;  // 2.5
    std::cout << "Element 2: " << get<2>(t1) << std::endl;  // hello

    // 修改元素
    get<0>(t1) = 42;
    std::cout << "Modified element 0: " << get<0>(t1) << std::endl;  // 42

    // 打印元组
    print_tuple(t1);  // (42, 2.5, hello)

    // 空元组
    Tuple<> empty;
    std::cout << "Empty tuple size: " << tuple_size_v<decltype(empty)> << std::endl;  // 0

    // 类型检查
    static_assert(std::is_same_v<tuple_element_t<0, decltype(t1)>, int>);
    static_assert(std::is_same_v<tuple_element_t<1, decltype(t1)>, double>);
    static_assert(std::is_same_v<tuple_element_t<2, decltype(t1)>, std::string>);

    return 0;
}
```

## 最佳实践

### 优先使用折叠表达式（C++17+）

```cpp
// 不推荐：递归方式（C++11/14）
template<typename T>
T sum_recursive(T value) {
    return value;
}

template<typename T, typename... Rest>
auto sum_recursive(T first, Rest... rest) {
    return first + sum_recursive(rest...);
}

// 推荐：折叠表达式（C++17+）
template<typename... Args>
auto sum_fold(Args... args) {
    return (args + ...);
}
```

### 使用 if constexpr 简化条件逻辑

```cpp
#include <iostream>
#include <type_traits>

// 不推荐：SFINAE 方式
template<typename T>
std::enable_if_t<std::is_integral_v<T>> process_sfinae(T value) {
    std::cout << "Integer: " << value << std::endl;
}

template<typename T>
std::enable_if_t<std::is_floating_point_v<T>> process_sfinae(T value) {
    std::cout << "Floating: " << value << std::endl;
}

// 推荐：if constexpr 方式（C++17+）
template<typename T>
void process_constexpr(T value) {
    if constexpr (std::is_integral_v<T>) {
        std::cout << "Integer: " << value << std::endl;
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << "Floating: " << value << std::endl;
    } else {
        std::cout << "Other: " << value << std::endl;
    }
}

// 与参数包结合
template<typename... Args>
void process_all(Args... args) {
    (process_constexpr(args), ...);
}
```

### 确保空参数包的正确处理

```cpp
#include <iostream>

// 不安全：空包会导致编译错误
template<typename... Args>
auto unsafe_sum(Args... args) {
    return (args + ...);  // 空包时无法编译
}

// 安全：使用二元折叠提供默认值
template<typename... Args>
auto safe_sum(Args... args) {
    return (args + ... + 0);  // 空包返回 0
}

// 安全：逻辑运算
template<typename... Args>
bool all_of(Args... args) {
    return (args && ... && true);  // 空包返回 true
}

template<typename... Args>
bool any_of(Args... args) {
    return (false || ... || args);  // 空包返回 false
}

int main() {
    std::cout << "safe_sum(): " << safe_sum() << std::endl;     // 0
    std::cout << "safe_sum(1,2,3): " << safe_sum(1,2,3) << std::endl;  // 6

    std::cout << "all_of(): " << all_of() << std::endl;         // true (空集合)
    std::cout << "any_of(): " << any_of() << std::endl;         // false (空集合)

    return 0;
}
```

### 使用完美转发保持值类别

```cpp
#include <iostream>
#include <utility>
#include <string>

// 不推荐：丢失值类别
template<typename... Args>
void forward_bad(Args... args) {
    // args 总是左值，即使传入右值
    process(args...);
}

// 推荐：保持值类别
template<typename... Args>
void forward_good(Args&&... args) {
    process(std::forward<Args>(args)...);
}

// 实际应用：构造函数转发
template<typename T>
class Wrapper {
    T value_;
public:
    template<typename... Args>
    explicit Wrapper(Args&&... args)
        : value_(std::forward<Args>(args)...) {}

    const T& get() const { return value_; }
};

int main() {
    // 完美转发构造
    Wrapper<std::string> w1("hello");           // const char* 构造
    Wrapper<std::string> w2(5, 'a');            // 5 个 'a' 构造
    Wrapper<std::string> w3(std::string("world")); // 移动构造

    std::cout << w1.get() << std::endl;  // hello
    std::cout << w2.get() << std::endl;  // aaaaa
    std::cout << w3.get() << std::endl;  // world

    return 0;
}
```

### 使用 std::index_sequence 进行索引操作

```cpp
#include <iostream>
#include <tuple>
#include <utility>
#include <array>

// 使用索引序列遍历元组
template<typename Tuple, std::size_t... I>
void print_tuple_impl(const Tuple& t, std::index_sequence<I...>) {
    ((std::cout << (I == 0 ? "" : ", ") << std::get<I>(t)), ...);
}

template<typename... Args>
void print_tuple(const std::tuple<Args...>& t) {
    std::cout << "(";
    print_tuple_impl(t, std::index_sequence_for<Args...>{});
    std::cout << ")" << std::endl;
}

// 使用索引序列调用函数
template<typename F, typename Tuple, std::size_t... I>
auto apply_impl(F&& f, Tuple&& t, std::index_sequence<I...>) {
    return f(std::get<I>(std::forward<Tuple>(t))...);
}

template<typename F, typename Tuple>
auto my_apply(F&& f, Tuple&& t) {
    return apply_impl(
        std::forward<F>(f),
        std::forward<Tuple>(t),
        std::make_index_sequence<std::tuple_size_v<std::remove_reference_t<Tuple>>>{}
    );
}

// 生成编译期数组
template<std::size_t... I>
constexpr auto make_squares(std::index_sequence<I...>) {
    return std::array<std::size_t, sizeof...(I)>{(I * I)...};
}

template<std::size_t N>
constexpr auto squares_array = make_squares(std::make_index_sequence<N>{});

int main() {
    auto t = std::make_tuple(1, 2.5, "hello");
    print_tuple(t);  // (1, 2.5, hello)

    // 使用 apply 调用函数
    auto sum = my_apply([](auto... args) { return (args + ...); },
                        std::make_tuple(1, 2, 3, 4));
    std::cout << "Sum: " << sum << std::endl;  // 10

    // 编译期数组
    constexpr auto squares = squares_array<10>;
    for (auto sq : squares) {
        std::cout << sq << " ";
    }
    std::cout << std::endl;  // 0 1 4 9 16 25 36 49 64 81

    return 0;
}
```

## 常见陷阱

### 陷阱1：忘记展开参数包

```cpp
#include <iostream>
#include <vector>

// 错误：忘记展开
template<typename... Args>
void wrong_init(std::vector<int>& vec, Args... args) {
    // vec.push_back(args);  // 错误：args 是参数包，不是单个值
}

// 正确：使用折叠表达式或初始化列表
template<typename... Args>
void correct_init(std::vector<int>& vec, Args... args) {
    // 方式1：折叠表达式
    (vec.push_back(args), ...);

    // 方式2：初始化列表（更高效）
    // vec.insert(vec.end(), {args...});
}

int main() {
    std::vector<int> vec;
    correct_init(vec, 1, 2, 3, 4, 5);

    for (int v : vec) {
        std::cout << v << " ";
    }
    std::cout << std::endl;  // 1 2 3 4 5

    return 0;
}
```

### 陷阱2：包展开位置错误

```cpp
#include <iostream>
#include <vector>

template<typename T>
T process(T value) {
    std::cout << "Processing: " << value << std::endl;
    return value * 2;
}

template<typename... Args>
void demonstrate_expansion_order(Args... args) {
    // 正确：每个参数调用一次 process
    // (process(args), ...);

    // 常见错误理解：
    // process(args)... 本身不是合法语句
    // 必须在允许展开的上下文中使用

    // 正确用法示例
    std::cout << "Fold expansion:" << std::endl;
    (process(args), ...);  // 每个 args 都调用 process

    std::cout << "\nInitializer list expansion:" << std::endl;
    int results[] = {process(args)...};  // 展开到初始化列表

    for (int r : results) {
        std::cout << "Result: " << r << std::endl;
    }
}

int main() {
    demonstrate_expansion_order(1, 2, 3);
    return 0;
}
```

### 陷阱3：递归终止条件缺失

```cpp
#include <iostream>

// 错误：没有终止条件，导致无限递归模板实例化
/*
template<typename T, typename... Args>
void no_base_case(T first, Args... args) {
    std::cout << first << " ";
    no_base_case(args...);  // 当 args 为空时，无匹配函数
}
*/

// 正确：提供终止条件
// 方式1：空参数重载
void recursive_print() {
    std::cout << std::endl;
}

template<typename T, typename... Args>
void recursive_print(T first, Args... args) {
    std::cout << first << " ";
    recursive_print(args...);
}

// 方式2：使用 if constexpr（C++17）
template<typename T, typename... Args>
void recursive_print_v2(T first, Args... args) {
    std::cout << first;
    if constexpr (sizeof...(args) > 0) {
        std::cout << " ";
        recursive_print_v2(args...);
    } else {
        std::cout << std::endl;
    }
}

int main() {
    recursive_print(1, 2, 3, "hello");
    recursive_print_v2('a', 'b', 'c', 'd');
    return 0;
}
```

### 陷阱4：折叠表达式运算符优先级

```cpp
#include <iostream>

template<typename... Args>
auto subtract_fold(Args... args) {
    // 一元左折叠: (... - args)
    // 对于 subtract_fold(1, 2, 3, 4):
    // 展开为: ((1 - 2) - 3) - 4 = -8
    return (... - args);
}

template<typename... Args>
auto subtract_fold_right(Args... args) {
    // 一元右折叠: (args - ...)
    // 对于 subtract_fold_right(1, 2, 3, 4):
    // 展开为: 1 - (2 - (3 - 4)) = 1 - (2 - (-1)) = 1 - 3 = -2
    return (args - ...);
}

int main() {
    std::cout << "Left fold (... - args): " << subtract_fold(1, 2, 3, 4) << std::endl;   // -8
    std::cout << "Right fold (args - ...): " << subtract_fold_right(1, 2, 3, 4) << std::endl;  // -2

    // 对于非交换运算符，折叠方向很重要！
    return 0;
}
```

### 陷阱5：参数求值顺序

```cpp
#include <iostream>

int get_value(int id) {
    std::cout << "Evaluating " << id << std::endl;
    return id;
}

template<typename... Args>
void print_values(Args... args) {
    // 逗号运算符折叠的求值顺序是确定的（从左到右）
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

template<typename... Args>
void call_with_values(Args... args) {
    // 函数调用参数的求值顺序是未指定的！
    // 不同编译器可能产生不同的求值顺序
    // func(get_value(args)...);  // 顺序未定义

    // 如果需要确定顺序，使用初始化列表或折叠表达式
    int dummy[] = {(get_value(args), 0)...};
    (void)dummy;
}

int main() {
    std::cout << "Fold expression (guaranteed order):" << std::endl;
    print_values(1, 2, 3, 4);

    std::cout << "\nInitializer list (guaranteed order):" << std::endl;
    call_with_values(1, 2, 3, 4);

    return 0;
}
```

## 性能考量

### 编译期计算 vs 运行期计算

```cpp
#include <iostream>
#include <chrono>
#include <array>

// 编译期计算：使用 constexpr 和模板元编程
template<int N>
struct Factorial {
    static constexpr int value = N * Factorial<N - 1>::value;
};

template<>
struct Factorial<0> {
    static constexpr int value = 1;
};

// C++17: 使用 constexpr 函数
constexpr int factorial_constexpr(int n) {
    return n <= 1 ? 1 : n * factorial_constexpr(n - 1);
}

// 运行期计算
int factorial_runtime(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

// 编译期展开的循环
template<typename... Args>
constexpr auto sum_constexpr(Args... args) {
    return (args + ...);
}

int main() {
    // 编译期计算
    constexpr int fact5_template = Factorial<5>::value;
    constexpr int fact5_constexpr = factorial_constexpr(5);

    static_assert(fact5_template == 120);
    static_assert(fact5_constexpr == 120);

    std::cout << "Factorial<5>: " << fact5_template << std::endl;

    // 编译期求和
    constexpr auto compile_sum = sum_constexpr(1, 2, 3, 4, 5);
    static_assert(compile_sum == 15);
    std::cout << "Compile-time sum: " << compile_sum << std::endl;

    // 性能对比（运行期 vs 预计算）
    constexpr int iterations = 10000000;

    auto start1 = std::chrono::high_resolution_clock::now();
    volatile int result1 = 0;
    for (int i = 0; i < iterations; ++i) {
        result1 = factorial_runtime(10);
    }
    auto end1 = std::chrono::high_resolution_clock::now();

    auto start2 = std::chrono::high_resolution_clock::now();
    volatile int result2 = 0;
    for (int i = 0; i < iterations; ++i) {
        result2 = Factorial<10>::value;  // 编译期常量
    }
    auto end2 = std::chrono::high_resolution_clock::now();

    std::cout << "Runtime factorial: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1).count()
              << "ms" << std::endl;
    std::cout << "Compile-time factorial: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2).count()
              << "ms" << std::endl;

    return 0;
}
```

### 代码膨胀问题

```cpp
#include <iostream>
#include <typeinfo>

// 每种不同的参数类型组合都会生成新的函数实例
template<typename... Args>
void code_bloat_example(Args... args) {
    std::cout << "Function instantiated for types: ";
    ((std::cout << typeid(Args).name() << " "), ...);
    std::cout << std::endl;
}

// 减少代码膨胀的策略

// 策略1：将类型无关的代码分离到非模板函数
void common_logic() {
    // 复杂的、与类型无关的逻辑
    std::cout << "Common logic executed" << std::endl;
}

template<typename... Args>
void optimized_function(Args... args) {
    common_logic();  // 不会为每个实例化重复生成
    // 只有类型相关的部分使用模板
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

// 策略2：使用类型擦除
#include <functional>
#include <vector>
#include <any>

class TypeErasedProcessor {
    std::vector<std::function<void()>> tasks_;
public:
    template<typename T>
    void add(T value) {
        tasks_.push_back([v = std::move(value)]() {
            std::cout << v << " ";
        });
    }

    void process_all() {
        for (auto& task : tasks_) {
            task();
        }
        std::cout << std::endl;
    }
};

int main() {
    // 会产生多个函数实例
    code_bloat_example(1, 2, 3);
    code_bloat_example(1.0, 2.0);
    code_bloat_example("hello", "world");

    std::cout << "\n--- Optimized version ---\n";
    optimized_function(1, 2.0, "test");

    std::cout << "\n--- Type-erased version ---\n";
    TypeErasedProcessor processor;
    processor.add(1);
    processor.add(2.5);
    processor.add(std::string("hello"));
    processor.process_all();

    return 0;
}
```

### 编译时间优化

```cpp
// 头文件中只声明模板
// heavy_template.hpp
#ifndef HEAVY_TEMPLATE_HPP
#define HEAVY_TEMPLATE_HPP

#include <iostream>

// 显式实例化声明，减少重复编译
template<typename... Args>
void heavy_function(Args... args);

// 常用类型的显式实例化声明
extern template void heavy_function(int);
extern template void heavy_function(int, int);
extern template void heavy_function(int, int, int);
extern template void heavy_function(int, double);

#endif

// 实现文件
// heavy_template.cpp
// #include "heavy_template.hpp"

template<typename... Args>
void heavy_function(Args... args) {
    // 复杂实现
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

// 显式实例化定义
// template void heavy_function(int);
// template void heavy_function(int, int);
// template void heavy_function(int, int, int);
// template void heavy_function(int, double);

// 使用文件
int main() {
    // 这些调用使用预编译的实例化
    // heavy_function(1);
    // heavy_function(1, 2);
    // heavy_function(1, 2, 3);
    // heavy_function(1, 2.0);

    std::cout << "See comments for explicit instantiation example" << std::endl;
    return 0;
}
```

## 实战场景

### 场景1：日志系统

```cpp
#include <iostream>
#include <sstream>
#include <chrono>
#include <iomanip>
#include <string>

enum class LogLevel { DEBUG, INFO, WARNING, ERROR };

class Logger {
private:
    LogLevel min_level_ = LogLevel::DEBUG;

    std::string get_timestamp() {
        auto now = std::chrono::system_clock::now();
        auto time = std::chrono::system_clock::to_time_t(now);
        std::ostringstream oss;
        oss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S");
        return oss.str();
    }

    const char* level_string(LogLevel level) {
        switch (level) {
            case LogLevel::DEBUG: return "DEBUG";
            case LogLevel::INFO: return "INFO";
            case LogLevel::WARNING: return "WARNING";
            case LogLevel::ERROR: return "ERROR";
            default: return "UNKNOWN";
        }
    }

    template<typename T>
    void format_value(std::ostream& os, const T& value) {
        os << value;
    }

    // 特化：字符串加引号
    void format_value(std::ostream& os, const std::string& value) {
        os << '"' << value << '"';
    }

    void format_value(std::ostream& os, const char* value) {
        os << '"' << value << '"';
    }

public:
    void set_level(LogLevel level) { min_level_ = level; }

    template<typename... Args>
    void log(LogLevel level, const char* message, Args... args) {
        if (level < min_level_) return;

        std::cout << "[" << get_timestamp() << "] "
                  << "[" << level_string(level) << "] "
                  << message;

        if constexpr (sizeof...(args) > 0) {
            std::cout << " | Args: ";
            ((std::cout << args << " "), ...);
        }
        std::cout << std::endl;
    }

    template<typename... Args>
    void debug(const char* msg, Args... args) {
        log(LogLevel::DEBUG, msg, args...);
    }

    template<typename... Args>
    void info(const char* msg, Args... args) {
        log(LogLevel::INFO, msg, args...);
    }

    template<typename... Args>
    void warning(const char* msg, Args... args) {
        log(LogLevel::WARNING, msg, args...);
    }

    template<typename... Args>
    void error(const char* msg, Args... args) {
        log(LogLevel::ERROR, msg, args...);
    }

    // 结构化日志
    template<typename... Args>
    void structured_log(LogLevel level, Args... args) {
        static_assert(sizeof...(args) % 2 == 0, "Arguments must be key-value pairs");

        if (level < min_level_) return;

        std::cout << "[" << get_timestamp() << "] "
                  << "[" << level_string(level) << "] ";

        // 打印键值对
        print_pairs(args...);
        std::cout << std::endl;
    }

private:
    void print_pairs() {}

    template<typename K, typename V, typename... Rest>
    void print_pairs(K key, V value, Rest... rest) {
        std::cout << key << "=";
        format_value(std::cout, value);
        if constexpr (sizeof...(rest) > 0) {
            std::cout << ", ";
            print_pairs(rest...);
        }
    }
};

int main() {
    Logger logger;

    logger.debug("Application started");
    logger.info("User logged in", "user_id", 12345);
    logger.warning("Disk space low", "available_gb", 5.2);
    logger.error("Connection failed", "host", "db.example.com", "port", 5432);

    std::cout << "\n--- Structured logging ---\n";
    logger.structured_log(LogLevel::INFO,
                         "event", "purchase",
                         "user_id", 12345,
                         "amount", 99.99,
                         "currency", "USD");

    return 0;
}
```

### 场景2：事件系统

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <map>
#include <string>
#include <any>
#include <typeindex>

// 类型安全的事件系统
class EventSystem {
public:
    // 注册事件处理器
    template<typename... Args>
    void on(const std::string& event_name, std::function<void(Args...)> handler) {
        auto type_key = std::type_index(typeid(std::function<void(Args...)>));
        handlers_[event_name].push_back({type_key, handler});
    }

    // 触发事件
    template<typename... Args>
    void emit(const std::string& event_name, Args... args) {
        auto it = handlers_.find(event_name);
        if (it == handlers_.end()) return;

        auto type_key = std::type_index(typeid(std::function<void(Args...)>));

        for (auto& [stored_type, handler] : it->second) {
            if (stored_type == type_key) {
                try {
                    auto& func = std::any_cast<std::function<void(Args...)>&>(handler);
                    func(args...);
                } catch (const std::bad_any_cast&) {
                    // 类型不匹配，跳过
                }
            }
        }
    }

    // 移除所有处理器
    void clear(const std::string& event_name) {
        handlers_.erase(event_name);
    }

private:
    std::map<std::string, std::vector<std::pair<std::type_index, std::any>>> handlers_;
};

// 更简单的强类型事件系统
template<typename... EventTypes>
class TypedEventSystem;

template<typename Event>
class TypedEventSystem<Event> {
protected:
    std::vector<std::function<void(const Event&)>> handlers_;

public:
    void on(std::function<void(const Event&)> handler) {
        handlers_.push_back(handler);
    }

    void emit(const Event& event) {
        for (auto& handler : handlers_) {
            handler(event);
        }
    }
};

template<typename Event, typename... Rest>
class TypedEventSystem<Event, Rest...> : public TypedEventSystem<Event>,
                                          public TypedEventSystem<Rest...> {
public:
    using TypedEventSystem<Event>::on;
    using TypedEventSystem<Event>::emit;
    using TypedEventSystem<Rest...>::on;
    using TypedEventSystem<Rest...>::emit;
};

// 事件定义
struct MouseClickEvent {
    int x, y;
    int button;
};

struct KeyPressEvent {
    int key_code;
    bool shift, ctrl, alt;
};

struct WindowResizeEvent {
    int width, height;
};

int main() {
    // 通用事件系统
    std::cout << "=== Generic Event System ===" << std::endl;
    EventSystem events;

    events.on<int, std::string>("user_action",
        std::function<void(int, std::string)>([](int id, std::string action) {
            std::cout << "User " << id << " performed: " << action << std::endl;
        }));

    events.emit("user_action", 123, std::string("login"));

    // 强类型事件系统
    std::cout << "\n=== Typed Event System ===" << std::endl;
    TypedEventSystem<MouseClickEvent, KeyPressEvent, WindowResizeEvent> typed_events;

    typed_events.on(std::function<void(const MouseClickEvent&)>([](const MouseClickEvent& e) {
        std::cout << "Mouse click at (" << e.x << ", " << e.y << ") button: " << e.button << std::endl;
    }));

    typed_events.on(std::function<void(const KeyPressEvent&)>([](const KeyPressEvent& e) {
        std::cout << "Key pressed: " << e.key_code;
        if (e.ctrl) std::cout << " +Ctrl";
        if (e.shift) std::cout << " +Shift";
        std::cout << std::endl;
    }));

    typed_events.on(std::function<void(const WindowResizeEvent&)>([](const WindowResizeEvent& e) {
        std::cout << "Window resized to: " << e.width << "x" << e.height << std::endl;
    }));

    typed_events.emit(MouseClickEvent{100, 200, 1});
    typed_events.emit(KeyPressEvent{65, true, true, false});
    typed_events.emit(WindowResizeEvent{1920, 1080});

    return 0;
}
```

### 场景3：SQL 查询构建器

```cpp
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <variant>

class QueryBuilder {
private:
    std::string table_;
    std::vector<std::string> columns_;
    std::vector<std::string> conditions_;
    std::vector<std::string> order_by_;
    int limit_ = -1;
    int offset_ = -1;

public:
    QueryBuilder& from(const std::string& table) {
        table_ = table;
        return *this;
    }

    template<typename... Cols>
    QueryBuilder& select(Cols... cols) {
        (columns_.push_back(cols), ...);
        return *this;
    }

    template<typename T>
    std::string value_to_string(const T& value) {
        if constexpr (std::is_same_v<T, std::string>) {
            return "'" + value + "'";
        } else if constexpr (std::is_same_v<T, const char*>) {
            return std::string("'") + value + "'";
        } else if constexpr (std::is_same_v<T, bool>) {
            return value ? "TRUE" : "FALSE";
        } else {
            return std::to_string(value);
        }
    }

    template<typename T>
    QueryBuilder& where(const std::string& column, const std::string& op, const T& value) {
        std::ostringstream oss;
        oss << column << " " << op << " " << value_to_string(value);
        conditions_.push_back(oss.str());
        return *this;
    }

    template<typename T>
    QueryBuilder& where_eq(const std::string& column, const T& value) {
        return where(column, "=", value);
    }

    template<typename... Values>
    QueryBuilder& where_in(const std::string& column, Values... values) {
        std::ostringstream oss;
        oss << column << " IN (";
        bool first = true;
        ((oss << (first ? "" : ", ") << value_to_string(values), first = false), ...);
        oss << ")";
        conditions_.push_back(oss.str());
        return *this;
    }

    template<typename... Cols>
    QueryBuilder& order_by(Cols... cols) {
        (order_by_.push_back(cols), ...);
        return *this;
    }

    QueryBuilder& limit(int n) {
        limit_ = n;
        return *this;
    }

    QueryBuilder& offset(int n) {
        offset_ = n;
        return *this;
    }

    std::string build() const {
        std::ostringstream oss;

        oss << "SELECT ";
        if (columns_.empty()) {
            oss << "*";
        } else {
            for (size_t i = 0; i < columns_.size(); ++i) {
                if (i > 0) oss << ", ";
                oss << columns_[i];
            }
        }

        oss << " FROM " << table_;

        if (!conditions_.empty()) {
            oss << " WHERE ";
            for (size_t i = 0; i < conditions_.size(); ++i) {
                if (i > 0) oss << " AND ";
                oss << conditions_[i];
            }
        }

        if (!order_by_.empty()) {
            oss << " ORDER BY ";
            for (size_t i = 0; i < order_by_.size(); ++i) {
                if (i > 0) oss << ", ";
                oss << order_by_[i];
            }
        }

        if (limit_ >= 0) {
            oss << " LIMIT " << limit_;
        }

        if (offset_ >= 0) {
            oss << " OFFSET " << offset_;
        }

        return oss.str();
    }
};

int main() {
    // 简单查询
    auto q1 = QueryBuilder()
        .from("users")
        .select("id", "name", "email")
        .where_eq("status", "active")
        .build();
    std::cout << q1 << std::endl;
    // SELECT id, name, email FROM users WHERE status = 'active'

    // 复杂查询
    auto q2 = QueryBuilder()
        .from("orders")
        .select("order_id", "customer_id", "total", "created_at")
        .where("total", ">", 100.0)
        .where_eq("status", "completed")
        .where_in("category", "electronics", "books", "clothing")
        .order_by("created_at DESC", "total DESC")
        .limit(10)
        .offset(20)
        .build();
    std::cout << q2 << std::endl;

    // 全选查询
    auto q3 = QueryBuilder()
        .from("products")
        .where("price", "<", 50)
        .where_eq("in_stock", true)
        .limit(5)
        .build();
    std::cout << q3 << std::endl;

    return 0;
}
```

## 面试要点

### 参数包基础

**问：什么是参数包？C++ 中有哪几种参数包？**

答：参数包是可变参数模板的核心概念，表示零个或多个参数。C++ 中有两种参数包：
- 模板参数包：`template<typename... Types>` 中的 `Types`
- 函数参数包：`void func(Args... args)` 中的 `args`

**问：sizeof... 运算符的作用是什么？**

答：`sizeof...` 返回参数包中的元素数量，是编译期常量。它可以用于模板参数包或函数参数包。

```cpp
template<typename... Args>
constexpr size_t count(Args... args) {
    return sizeof...(Args);  // 或 sizeof...(args)
}
```

### 包展开

**问：参数包可以在哪些上下文中展开？**

答：主要包括：
- 函数调用参数
- 初始化列表
- 类型列表
- 基类列表
- 成员初始化列表
- Lambda 捕获列表
- 模板参数列表

**问：解释以下代码的展开结果：**

```cpp
template<typename... Args>
void example(Args... args) {
    func(process(args)...);
}
```

答：对于 `example(1, 2, 3)` 调用，展开为 `func(process(1), process(2), process(3))`。模式 `process(args)` 被应用到每个参数，然后用逗号分隔。

### 折叠表达式

**问：C++17 折叠表达式有几种形式？请说明它们的展开规则。**

答：四种形式：
1. 一元右折叠 `(pack op ...)`：展开为 `(a1 op (a2 op (a3 op a4)))`
2. 一元左折叠 `(... op pack)`：展开为 `(((a1 op a2) op a3) op a4)`
3. 二元右折叠 `(pack op ... op init)`：展开为 `(a1 op (a2 op (a3 op init)))`
4. 二元左折叠 `(init op ... op pack)`：展开为 `(((init op a1) op a2) op a3)`

**问：如何安全处理空参数包？**

答：使用二元折叠表达式提供初始值：

```cpp
template<typename... Args>
auto sum(Args... args) {
    return (args + ... + 0);  // 空包返回 0
}

template<typename... Args>
bool all_of(Args... args) {
    return (args && ... && true);  // 空包返回 true
}
```

### 递归模板

**问：在 C++17 之前如何处理参数包？**

答：使用递归模板技术，需要：
1. 定义基准情况（空参数或单参数）
2. 定义递归情况（处理第一个参数，递归处理剩余参数）

```cpp
void print() {}  // 基准情况

template<typename T, typename... Rest>
void print(T first, Rest... rest) {
    std::cout << first << " ";
    print(rest...);  // 递归
}
```

### 完美转发

**问：可变参数模板如何实现完美转发？**

答：使用万能引用 `Args&&...` 配合 `std::forward`：

```cpp
template<typename... Args>
void forward_all(Args&&... args) {
    other_func(std::forward<Args>(args)...);
}
```

这保留了每个参数的值类别（左值/右值），是实现 `std::make_unique`、`std::make_shared` 等函数的关键。

### 实际应用

**问：可变参数模板在标准库中有哪些应用？**

答：主要应用包括：
- `std::tuple`：存储任意类型的元组
- `std::make_unique/std::make_shared`：完美转发构造参数
- `std::invoke`：统一调用接口
- `std::variant`：类型安全的联合体
- `std::function`：存储任意可调用对象

## 延伸阅读

### 官方文档

- [C++ Reference: Parameter pack](https://en.cppreference.com/w/cpp/language/parameter_pack)
- [C++ Reference: Fold expressions](https://en.cppreference.com/w/cpp/language/fold)
- [C++ Reference: sizeof... operator](https://en.cppreference.com/w/cpp/language/sizeof...)

### 经典书籍

- 《C++ Templates: The Complete Guide (2nd Edition)》by David Vandevoorde, Nicolai M. Josuttis, Douglas Gregor
- 《Effective Modern C++》by Scott Meyers - Item 25-27 关于完美转发
- 《C++17 - The Complete Guide》by Nicolai M. Josuttis - 折叠表达式章节

### 技术文章

- [Eli Bendersky: Variadic templates in C++](https://eli.thegreenplace.net/2014/variadic-templates-in-c/)
- [Jonathan Boccara: Fold Expressions in C++17](https://www.fluentcpp.com/2021/03/12/cpp-fold-expressions/)
- [ModernesCpp: Fold Expressions](https://www.modernescpp.com/index.php/fold-expressions)

### 相关主题

- C++ 模板元编程
- SFINAE 与 Concepts
- 完美转发与移动语义
- std::tuple 实现原理
- 类型擦除技术
