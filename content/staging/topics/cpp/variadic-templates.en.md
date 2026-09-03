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
origin: old/src/content/docs/cpp/variadic-templates.en.md
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

Variadic Templates are a powerful feature introduced in C++11 that allows templates to accept any number of arguments of any type. They form the foundation for implementing type-safe variadic functions, tuples, smart pointer factory functions, and other modern C++ features.

## Concept Explanation

### What Are Variadic Templates

Variadic templates are templates that can accept zero or more template parameters. Unlike traditional C-style `va_list` variadic arguments, C++ variadic templates are processed at compile time, providing complete type safety.

```cpp
// Traditional C-style variadic arguments (not type-safe)
int printf(const char* format, ...);

// C++ variadic templates (type-safe)
template<typename... Args>
void print(Args... args);
```

### Historical Background

Before C++11, implementing templates that accept arbitrary numbers of arguments was very difficult, typically requiring:
- Writing multiple overloaded versions for different argument counts
- Using macros to generate code
- Relying on C-style variadic arguments (losing type safety)

The variadic templates introduced in C++11 completely solved this problem, and C++17's fold expressions further simplified writing related code.

### Problems Solved

Variadic templates primarily solve the following problems:

1. **Type-safe variadic functions**: Such as `std::make_unique`, `std::make_shared`
2. **Tuple implementation**: `std::tuple` can store any number of elements of any type
3. **Perfect forwarding**: `std::forward` combined with variadic arguments enables perfect forwarding
4. **Compile-time computation**: Processing any number of types or values at compile time

## Core Principles

### Parameter Pack

Parameter packs are the core concept of variadic templates, divided into two types:

**Template Parameter Pack**: Represents zero or more template parameters

```cpp
template<typename... Types>  // Types is a template parameter pack
class Tuple;
```

**Function Parameter Pack**: Represents zero or more function parameters

```cpp
template<typename... Args>
void func(Args... args);  // args is a function parameter pack
```

### Internal Representation of Parameter Packs

The compiler treats parameter packs as an abstraction of a "parameter sequence". For example:

```cpp
template<typename... Types>
void example(Types... args);

// When calling example(1, 2.0, "hello"):
// Types... expands to int, double, const char*
// args...  expands to 1, 2.0, "hello"
```

### Pack Expansion

Pack expansion is the process of converting a parameter pack into a comma-separated list of actual arguments. The expansion pattern is `pattern...`, where `pattern` contains at least one parameter pack name.

```cpp
template<typename... Args>
void wrapper(Args... args) {
    // Simple expansion
    other_func(args...);  // Expands to other_func(arg1, arg2, arg3, ...)

    // Expansion with pattern
    other_func(process(args)...);  // Expands to other_func(process(arg1), process(arg2), ...)
}
```

## Key Points

### The sizeof... Operator

`sizeof...` returns the number of elements in a parameter pack as a compile-time constant.

```cpp
#include <iostream>

template<typename... Args>
constexpr std::size_t count_args(Args... args) {
    return sizeof...(Args);  // Returns template parameter pack size
    // Equivalent to sizeof...(args) which returns function parameter pack size
}

int main() {
    std::cout << count_args() << std::endl;           // 0
    std::cout << count_args(1) << std::endl;          // 1
    std::cout << count_args(1, 2.0, "hi") << std::endl; // 3

    // Compile-time usage
    static_assert(count_args(1, 2, 3) == 3);
    return 0;
}
```

### Parameter Pack Expansion Contexts

Parameter packs can be expanded in multiple contexts:

```cpp
#include <iostream>
#include <vector>
#include <tuple>

template<typename... Args>
void demonstrate_expansion(Args... args) {
    // 1. Function call arguments
    auto tuple = std::make_tuple(args...);

    // 2. Initializer list
    int arr[] = {(std::cout << args << " ", 0)...};
    std::cout << std::endl;

    // 3. Type list
    using TypeTuple = std::tuple<Args...>;

    // 4. Base class list (in class definition)
    // class Derived : public Args... {};

    // 5. Member initializer list (in constructor)
    // Constructor() : Args(default_value)... {}

    // 6. Lambda capture
    auto lambda = [args...]() {
        ((std::cout << args << " "), ...);  // C++17 fold expression
    };
    lambda();
}

int main() {
    demonstrate_expansion(1, 2.5, "hello");
    return 0;
}
```

### Nested Parameter Pack Expansion

When a pattern contains multiple parameter packs, they must have the same length and expand simultaneously:

```cpp
#include <iostream>
#include <utility>

template<typename... T, typename... U>
void zip_print(std::tuple<T...> t1, std::tuple<U...> t2) {
    // Use index sequence to access both tuples simultaneously
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

### Parameter Packs and Perfect Forwarding

Combining variadic templates with perfect forwarding is key to implementing universal factory functions:

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

// Simulating std::make_unique implementation
template<typename T, typename... Args>
std::unique_ptr<T> my_make_unique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

int main() {
    auto w1 = my_make_unique<Widget>();           // Default construction
    auto w2 = my_make_unique<Widget>(42);         // int construction
    auto w3 = my_make_unique<Widget>(42, 3.14);   // int+double construction
    auto w4 = my_make_unique<Widget>(std::string("hello")); // string construction
    return 0;
}
```

## Code Examples

### Example 1: Recursive Template Processing of Parameter Packs

Before C++17 fold expressions, recursion was the primary way to process parameter packs:

```cpp
#include <iostream>
#include <string>

// Base case: zero arguments
void print() {
    std::cout << std::endl;
}

// Recursive case: at least one argument
template<typename T, typename... Rest>
void print(T first, Rest... rest) {
    std::cout << first;
    if constexpr (sizeof...(rest) > 0) {
        std::cout << ", ";
    }
    print(rest...);  // Recursive call, parameter pack reduced by one
}

// Recursive sum
template<typename T>
T sum(T value) {
    return value;
}

template<typename T, typename... Rest>
auto sum(T first, Rest... rest) {
    return first + sum(rest...);
}

// Recursive maximum
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

### Example 2: Fold Expressions (C++17)

Fold expressions introduced in C++17 greatly simplify parameter pack processing:

```cpp
#include <iostream>
#include <string>

// ============ Four Forms of Fold Expressions ============

// 1. Unary right fold: (pack op ...)
//    Expands to: (arg1 op (arg2 op (arg3 op arg4)))
template<typename... Args>
auto sum_right(Args... args) {
    return (args + ...);
}

// 2. Unary left fold: (... op pack)
//    Expands to: (((arg1 op arg2) op arg3) op arg4)
template<typename... Args>
auto sum_left(Args... args) {
    return (... + args);
}

// 3. Binary right fold: (pack op ... op init)
//    Expands to: (arg1 op (arg2 op (arg3 op init)))
template<typename... Args>
auto sum_right_init(Args... args) {
    return (args + ... + 0);  // Returns 0 for empty pack
}

// 4. Binary left fold: (init op ... op pack)
//    Expands to: (((init op arg1) op arg2) op arg3)
template<typename... Args>
auto sum_left_init(Args... args) {
    return (0 + ... + args);  // Returns 0 for empty pack
}

// ============ Practical Examples ============

// Print all arguments
template<typename... Args>
void print_all(Args... args) {
    ((std::cout << args << " "), ...);  // Comma operator fold
    std::cout << std::endl;
}

// Print with separator
template<typename... Args>
void print_with_separator(const std::string& sep, Args... args) {
    std::size_t n = 0;
    ((std::cout << args << (++n < sizeof...(Args) ? sep : "")), ...);
    std::cout << std::endl;
}

// Logical operations
template<typename... Args>
bool all_true(Args... args) {
    return (args && ...);  // Unary right fold
}

template<typename... Args>
bool any_true(Args... args) {
    return (args || ...);  // Unary right fold
}

// Empty pack safe versions
template<typename... Args>
bool all_true_safe(Args... args) {
    return (args && ... && true);  // Binary right fold, empty pack returns true
}

template<typename... Args>
bool any_true_safe(Args... args) {
    return (false || ... || args);  // Binary left fold, empty pack returns false
}

// Chained comparison
template<typename T, typename... Args>
bool all_equal(T first, Args... args) {
    return ((first == args) && ...);
}

template<typename T, typename... Args>
bool is_in(T value, Args... args) {
    return ((value == args) || ...);
}

int main() {
    // Sum tests
    std::cout << "Sum right: " << sum_right(1, 2, 3, 4) << std::endl;      // 10
    std::cout << "Sum left: " << sum_left(1, 2, 3, 4) << std::endl;        // 10
    std::cout << "Sum right init (empty): " << sum_right_init() << std::endl;  // 0

    // Print tests
    print_all(1, 2.5, "hello", 'c');
    print_with_separator(" | ", "apple", "banana", "cherry");

    // Logical operation tests
    std::cout << "All true (1,1,1): " << all_true(true, true, true) << std::endl;   // 1
    std::cout << "All true (1,0,1): " << all_true(true, false, true) << std::endl;  // 0
    std::cout << "Any true (0,1,0): " << any_true(false, true, false) << std::endl; // 1

    // Comparison tests
    std::cout << "All equal (5,5,5): " << all_equal(5, 5, 5) << std::endl;     // 1
    std::cout << "All equal (5,5,6): " << all_equal(5, 5, 6) << std::endl;     // 0
    std::cout << "Is 3 in (1,2,3,4): " << is_in(3, 1, 2, 3, 4) << std::endl;  // 1
    std::cout << "Is 5 in (1,2,3,4): " << is_in(5, 1, 2, 3, 4) << std::endl;  // 0

    return 0;
}
```

### Example 3: Type-Safe printf

```cpp
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// Type-safe printf implementation
template<typename T>
void format_arg(std::ostream& os, const char*& fmt, T&& arg) {
    while (*fmt) {
        if (*fmt == '%') {
            if (*(fmt + 1) == '%') {
                ++fmt;  // Skip escaped %%
            } else {
                os << std::forward<T>(arg);
                ++fmt;
                // Skip format specifier (simplified handling)
                while (*fmt && *fmt != ' ' && *fmt != '%') ++fmt;
                return;
            }
        }
        os << *fmt++;
    }
    throw std::runtime_error("Extra argument provided");
}

// Base case
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

// Recursive case
template<typename T, typename... Args>
void safe_printf(std::ostream& os, const char* fmt, T&& first, Args&&... rest) {
    format_arg(os, fmt, std::forward<T>(first));
    safe_printf(os, fmt, std::forward<Args>(rest)...);
}

// Convenience interface
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

### Example 4: Compile-Time Type List Operations

```cpp
#include <iostream>
#include <type_traits>
#include <tuple>

// ============ Type List Definition ============

template<typename... Types>
struct TypeList {};

// ============ Type List Length ============

template<typename List>
struct Length;

template<typename... Types>
struct Length<TypeList<Types...>> {
    static constexpr std::size_t value = sizeof...(Types);
};

template<typename List>
inline constexpr std::size_t Length_v = Length<List>::value;

// ============ Get Nth Type ============

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

// ============ Prepend Type to List ============

template<typename T, typename List>
struct Prepend;

template<typename T, typename... Types>
struct Prepend<T, TypeList<Types...>> {
    using type = TypeList<T, Types...>;
};

template<typename T, typename List>
using Prepend_t = typename Prepend<T, List>::type;

// ============ Append Type to List ============

template<typename T, typename List>
struct Append;

template<typename T, typename... Types>
struct Append<T, TypeList<Types...>> {
    using type = TypeList<Types..., T>;
};

template<typename T, typename List>
using Append_t = typename Append<T, List>::type;

// ============ Concatenate Two Type Lists ============

template<typename List1, typename List2>
struct Concat;

template<typename... Types1, typename... Types2>
struct Concat<TypeList<Types1...>, TypeList<Types2...>> {
    using type = TypeList<Types1..., Types2...>;
};

template<typename List1, typename List2>
using Concat_t = typename Concat<List1, List2>::type;

// ============ Check If Type Is In List ============

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

// ============ Apply Template to Each Type ============

template<template<typename> class Transform, typename List>
struct Map;

template<template<typename> class Transform, typename... Types>
struct Map<Transform, TypeList<Types...>> {
    using type = TypeList<typename Transform<Types>::type...>;
};

template<template<typename> class Transform, typename List>
using Map_t = typename Map<Transform, List>::type;

// ============ Filter Type List ============

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

// ============ Tests ============

int main() {
    using MyList = TypeList<int, double, char, float, long>;

    // Length
    std::cout << "Length: " << Length_v<MyList> << std::endl;  // 5

    // Get Nth type
    static_assert(std::is_same_v<TypeAt_t<0, MyList>, int>);
    static_assert(std::is_same_v<TypeAt_t<2, MyList>, char>);
    std::cout << "TypeAt<2>: char" << std::endl;

    // Add type
    using Prepended = Prepend_t<bool, MyList>;
    static_assert(std::is_same_v<TypeAt_t<0, Prepended>, bool>);
    std::cout << "Prepend bool: new length = " << Length_v<Prepended> << std::endl;  // 6

    // Concatenate lists
    using List1 = TypeList<int, double>;
    using List2 = TypeList<char, float>;
    using Combined = Concat_t<List1, List2>;
    static_assert(Length_v<Combined> == 4);
    std::cout << "Concat: length = " << Length_v<Combined> << std::endl;  // 4

    // Check contains
    static_assert(Contains_v<double, MyList>);
    static_assert(!Contains_v<std::string, MyList>);
    std::cout << "Contains double: true" << std::endl;
    std::cout << "Contains string: false" << std::endl;

    // Map transformation (add pointer)
    using PtrList = Map_t<std::add_pointer, MyList>;
    static_assert(std::is_same_v<TypeAt_t<0, PtrList>, int*>);
    std::cout << "Map add_pointer: int* at index 0" << std::endl;

    // Filter (keep only integral types)
    using IntegralList = Filter_t<std::is_integral, MyList>;
    static_assert(Length_v<IntegralList> == 3);  // int, char, long
    std::cout << "Filter is_integral: length = " << Length_v<IntegralList> << std::endl;

    return 0;
}
```

### Example 5: Implementing a Simple std::tuple

```cpp
#include <iostream>
#include <utility>
#include <type_traits>

// ============ Tuple Definition ============

// Empty tuple base class
template<typename... Types>
class Tuple {};

// Specialization: non-empty tuple
template<typename Head, typename... Tail>
class Tuple<Head, Tail...> : private Tuple<Tail...> {
public:
    using value_type = Head;
    using base_type = Tuple<Tail...>;

private:
    Head value_;

public:
    // Default construction
    Tuple() : base_type(), value_{} {}

    // Value construction
    Tuple(Head head, Tail... tail)
        : base_type(tail...), value_(std::move(head)) {}

    // Perfect forwarding construction
    template<typename H, typename... T,
             typename = std::enable_if_t<sizeof...(T) == sizeof...(Tail)>>
    Tuple(H&& head, T&&... tail)
        : base_type(std::forward<T>(tail)...)
        , value_(std::forward<H>(head)) {}

    // Get current value
    Head& head() { return value_; }
    const Head& head() const { return value_; }

    // Get tail tuple
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

// ============ Print Tuple ============

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

// ============ Tests ============

int main() {
    // Create tuple
    auto t1 = make_tuple(1, 2.5, std::string("hello"));

    // Get size
    std::cout << "Tuple size: " << tuple_size_v<decltype(t1)> << std::endl;  // 3

    // Get elements
    std::cout << "Element 0: " << get<0>(t1) << std::endl;  // 1
    std::cout << "Element 1: " << get<1>(t1) << std::endl;  // 2.5
    std::cout << "Element 2: " << get<2>(t1) << std::endl;  // hello

    // Modify element
    get<0>(t1) = 42;
    std::cout << "Modified element 0: " << get<0>(t1) << std::endl;  // 42

    // Print tuple
    print_tuple(t1);  // (42, 2.5, hello)

    // Empty tuple
    Tuple<> empty;
    std::cout << "Empty tuple size: " << tuple_size_v<decltype(empty)> << std::endl;  // 0

    // Type checking
    static_assert(std::is_same_v<tuple_element_t<0, decltype(t1)>, int>);
    static_assert(std::is_same_v<tuple_element_t<1, decltype(t1)>, double>);
    static_assert(std::is_same_v<tuple_element_t<2, decltype(t1)>, std::string>);

    return 0;
}
```

## Best Practices

### Prefer Fold Expressions (C++17+)

```cpp
// Not recommended: Recursive approach (C++11/14)
template<typename T>
T sum_recursive(T value) {
    return value;
}

template<typename T, typename... Rest>
auto sum_recursive(T first, Rest... rest) {
    return first + sum_recursive(rest...);
}

// Recommended: Fold expression (C++17+)
template<typename... Args>
auto sum_fold(Args... args) {
    return (args + ...);
}
```

### Use if constexpr to Simplify Conditional Logic

```cpp
#include <iostream>
#include <type_traits>

// Not recommended: SFINAE approach
template<typename T>
std::enable_if_t<std::is_integral_v<T>> process_sfinae(T value) {
    std::cout << "Integer: " << value << std::endl;
}

template<typename T>
std::enable_if_t<std::is_floating_point_v<T>> process_sfinae(T value) {
    std::cout << "Floating: " << value << std::endl;
}

// Recommended: if constexpr approach (C++17+)
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

// Combined with parameter packs
template<typename... Args>
void process_all(Args... args) {
    (process_constexpr(args), ...);
}
```

### Ensure Correct Handling of Empty Parameter Packs

```cpp
#include <iostream>

// Unsafe: Empty pack causes compilation error
template<typename... Args>
auto unsafe_sum(Args... args) {
    return (args + ...);  // Cannot compile with empty pack
}

// Safe: Use binary fold to provide default value
template<typename... Args>
auto safe_sum(Args... args) {
    return (args + ... + 0);  // Returns 0 for empty pack
}

// Safe: Logical operations
template<typename... Args>
bool all_of(Args... args) {
    return (args && ... && true);  // Returns true for empty pack
}

template<typename... Args>
bool any_of(Args... args) {
    return (false || ... || args);  // Returns false for empty pack
}

int main() {
    std::cout << "safe_sum(): " << safe_sum() << std::endl;     // 0
    std::cout << "safe_sum(1,2,3): " << safe_sum(1,2,3) << std::endl;  // 6

    std::cout << "all_of(): " << all_of() << std::endl;         // true (empty set)
    std::cout << "any_of(): " << any_of() << std::endl;         // false (empty set)

    return 0;
}
```

### Use Perfect Forwarding to Preserve Value Categories

```cpp
#include <iostream>
#include <utility>
#include <string>

// Not recommended: Loses value category
template<typename... Args>
void forward_bad(Args... args) {
    // args are always lvalues, even if rvalues were passed in
    process(args...);
}

// Recommended: Preserves value category
template<typename... Args>
void forward_good(Args&&... args) {
    process(std::forward<Args>(args)...);
}

// Practical application: Constructor forwarding
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
    // Perfect forwarding construction
    Wrapper<std::string> w1("hello");           // const char* construction
    Wrapper<std::string> w2(5, 'a');            // 5 'a's construction
    Wrapper<std::string> w3(std::string("world")); // Move construction

    std::cout << w1.get() << std::endl;  // hello
    std::cout << w2.get() << std::endl;  // aaaaa
    std::cout << w3.get() << std::endl;  // world

    return 0;
}
```

### Use std::index_sequence for Index Operations

```cpp
#include <iostream>
#include <tuple>
#include <utility>
#include <array>

// Use index sequence to iterate over tuple
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

// Use index sequence to call function
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

// Generate compile-time array
template<std::size_t... I>
constexpr auto make_squares(std::index_sequence<I...>) {
    return std::array<std::size_t, sizeof...(I)>{(I * I)...};
}

template<std::size_t N>
constexpr auto squares_array = make_squares(std::make_index_sequence<N>{});

int main() {
    auto t = std::make_tuple(1, 2.5, "hello");
    print_tuple(t);  // (1, 2.5, hello)

    // Use apply to call function
    auto sum = my_apply([](auto... args) { return (args + ...); },
                        std::make_tuple(1, 2, 3, 4));
    std::cout << "Sum: " << sum << std::endl;  // 10

    // Compile-time array
    constexpr auto squares = squares_array<10>;
    for (auto sq : squares) {
        std::cout << sq << " ";
    }
    std::cout << std::endl;  // 0 1 4 9 16 25 36 49 64 81

    return 0;
}
```

## Common Pitfalls

### Pitfall 1: Forgetting to Expand Parameter Pack

```cpp
#include <iostream>
#include <vector>

// Wrong: Forgot to expand
template<typename... Args>
void wrong_init(std::vector<int>& vec, Args... args) {
    // vec.push_back(args);  // Error: args is a parameter pack, not a single value
}

// Correct: Use fold expression or initializer list
template<typename... Args>
void correct_init(std::vector<int>& vec, Args... args) {
    // Method 1: Fold expression
    (vec.push_back(args), ...);

    // Method 2: Initializer list (more efficient)
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

### Pitfall 2: Wrong Pack Expansion Location

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
    // Correct: Each argument calls process once
    // (process(args), ...);

    // Common misunderstanding:
    // process(args)... itself is not a valid statement
    // Must be used in a context that allows expansion

    // Correct usage examples
    std::cout << "Fold expansion:" << std::endl;
    (process(args), ...);  // Each args calls process

    std::cout << "\nInitializer list expansion:" << std::endl;
    int results[] = {process(args)...};  // Expand into initializer list

    for (int r : results) {
        std::cout << "Result: " << r << std::endl;
    }
}

int main() {
    demonstrate_expansion_order(1, 2, 3);
    return 0;
}
```

### Pitfall 3: Missing Recursion Termination Condition

```cpp
#include <iostream>

// Wrong: No termination condition, causes infinite recursive template instantiation
/*
template<typename T, typename... Args>
void no_base_case(T first, Args... args) {
    std::cout << first << " ";
    no_base_case(args...);  // When args is empty, no matching function
}
*/

// Correct: Provide termination condition
// Method 1: Empty parameter overload
void recursive_print() {
    std::cout << std::endl;
}

template<typename T, typename... Args>
void recursive_print(T first, Args... args) {
    std::cout << first << " ";
    recursive_print(args...);
}

// Method 2: Use if constexpr (C++17)
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

### Pitfall 4: Fold Expression Operator Precedence

```cpp
#include <iostream>

template<typename... Args>
auto subtract_fold(Args... args) {
    // Unary left fold: (... - args)
    // For subtract_fold(1, 2, 3, 4):
    // Expands to: ((1 - 2) - 3) - 4 = -8
    return (... - args);
}

template<typename... Args>
auto subtract_fold_right(Args... args) {
    // Unary right fold: (args - ...)
    // For subtract_fold_right(1, 2, 3, 4):
    // Expands to: 1 - (2 - (3 - 4)) = 1 - (2 - (-1)) = 1 - 3 = -2
    return (args - ...);
}

int main() {
    std::cout << "Left fold (... - args): " << subtract_fold(1, 2, 3, 4) << std::endl;   // -8
    std::cout << "Right fold (args - ...): " << subtract_fold_right(1, 2, 3, 4) << std::endl;  // -2

    // For non-commutative operators, fold direction matters!
    return 0;
}
```

### Pitfall 5: Argument Evaluation Order

```cpp
#include <iostream>

int get_value(int id) {
    std::cout << "Evaluating " << id << std::endl;
    return id;
}

template<typename... Args>
void print_values(Args... args) {
    // Comma operator fold evaluation order is guaranteed (left to right)
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

template<typename... Args>
void call_with_values(Args... args) {
    // Function call argument evaluation order is unspecified!
    // Different compilers may produce different evaluation orders
    // func(get_value(args)...);  // Order undefined

    // If deterministic order is needed, use initializer list or fold expression
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

## Performance Considerations

### Compile-Time vs Runtime Computation

```cpp
#include <iostream>
#include <chrono>
#include <array>

// Compile-time computation: Using constexpr and template metaprogramming
template<int N>
struct Factorial {
    static constexpr int value = N * Factorial<N - 1>::value;
};

template<>
struct Factorial<0> {
    static constexpr int value = 1;
};

// C++17: Using constexpr function
constexpr int factorial_constexpr(int n) {
    return n <= 1 ? 1 : n * factorial_constexpr(n - 1);
}

// Runtime computation
int factorial_runtime(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

// Compile-time unrolled loop
template<typename... Args>
constexpr auto sum_constexpr(Args... args) {
    return (args + ...);
}

int main() {
    // Compile-time computation
    constexpr int fact5_template = Factorial<5>::value;
    constexpr int fact5_constexpr = factorial_constexpr(5);

    static_assert(fact5_template == 120);
    static_assert(fact5_constexpr == 120);

    std::cout << "Factorial<5>: " << fact5_template << std::endl;

    // Compile-time sum
    constexpr auto compile_sum = sum_constexpr(1, 2, 3, 4, 5);
    static_assert(compile_sum == 15);
    std::cout << "Compile-time sum: " << compile_sum << std::endl;

    // Performance comparison (runtime vs precomputed)
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
        result2 = Factorial<10>::value;  // Compile-time constant
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

### Code Bloat Issues

```cpp
#include <iostream>
#include <typeinfo>

// Each different combination of argument types generates a new function instance
template<typename... Args>
void code_bloat_example(Args... args) {
    std::cout << "Function instantiated for types: ";
    ((std::cout << typeid(Args).name() << " "), ...);
    std::cout << std::endl;
}

// Strategies to reduce code bloat

// Strategy 1: Separate type-independent code into non-template function
void common_logic() {
    // Complex, type-independent logic
    std::cout << "Common logic executed" << std::endl;
}

template<typename... Args>
void optimized_function(Args... args) {
    common_logic();  // Not regenerated for each instantiation
    // Only type-related parts use template
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

// Strategy 2: Use type erasure
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
    // Generates multiple function instances
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

### Compile Time Optimization

```cpp
// Only declare template in header
// heavy_template.hpp
#ifndef HEAVY_TEMPLATE_HPP
#define HEAVY_TEMPLATE_HPP

#include <iostream>

// Explicit instantiation declaration, reduces repeated compilation
template<typename... Args>
void heavy_function(Args... args);

// Explicit instantiation declarations for common types
extern template void heavy_function(int);
extern template void heavy_function(int, int);
extern template void heavy_function(int, int, int);
extern template void heavy_function(int, double);

#endif

// Implementation file
// heavy_template.cpp
// #include "heavy_template.hpp"

template<typename... Args>
void heavy_function(Args... args) {
    // Complex implementation
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

// Explicit instantiation definitions
// template void heavy_function(int);
// template void heavy_function(int, int);
// template void heavy_function(int, int, int);
// template void heavy_function(int, double);

// Usage file
int main() {
    // These calls use precompiled instantiations
    // heavy_function(1);
    // heavy_function(1, 2);
    // heavy_function(1, 2, 3);
    // heavy_function(1, 2.0);

    std::cout << "See comments for explicit instantiation example" << std::endl;
    return 0;
}
```

## Real-World Scenarios

### Scenario 1: Logging System

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

    // Specialization: Quote strings
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

    // Structured logging
    template<typename... Args>
    void structured_log(LogLevel level, Args... args) {
        static_assert(sizeof...(args) % 2 == 0, "Arguments must be key-value pairs");

        if (level < min_level_) return;

        std::cout << "[" << get_timestamp() << "] "
                  << "[" << level_string(level) << "] ";

        // Print key-value pairs
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

### Scenario 2: Event System

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <map>
#include <string>
#include <any>
#include <typeindex>

// Type-safe event system
class EventSystem {
public:
    // Register event handler
    template<typename... Args>
    void on(const std::string& event_name, std::function<void(Args...)> handler) {
        auto type_key = std::type_index(typeid(std::function<void(Args...)>));
        handlers_[event_name].push_back({type_key, handler});
    }

    // Emit event
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
                    // Type mismatch, skip
                }
            }
        }
    }

    // Remove all handlers
    void clear(const std::string& event_name) {
        handlers_.erase(event_name);
    }

private:
    std::map<std::string, std::vector<std::pair<std::type_index, std::any>>> handlers_;
};

// Simpler strongly-typed event system
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

// Event definitions
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
    // Generic event system
    std::cout << "=== Generic Event System ===" << std::endl;
    EventSystem events;

    events.on<int, std::string>("user_action",
        std::function<void(int, std::string)>([](int id, std::string action) {
            std::cout << "User " << id << " performed: " << action << std::endl;
        }));

    events.emit("user_action", 123, std::string("login"));

    // Strongly-typed event system
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

### Scenario 3: SQL Query Builder

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
    // Simple query
    auto q1 = QueryBuilder()
        .from("users")
        .select("id", "name", "email")
        .where_eq("status", "active")
        .build();
    std::cout << q1 << std::endl;
    // SELECT id, name, email FROM users WHERE status = 'active'

    // Complex query
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

    // Select all query
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

## Interview Key Points

### Parameter Pack Basics

**Q: What is a parameter pack? What types of parameter packs exist in C++?**

A: A parameter pack is the core concept of variadic templates, representing zero or more parameters. C++ has two types of parameter packs:
- Template parameter pack: `Types` in `template<typename... Types>`
- Function parameter pack: `args` in `void func(Args... args)`

**Q: What does the sizeof... operator do?**

A: `sizeof...` returns the number of elements in a parameter pack as a compile-time constant. It can be used with template parameter packs or function parameter packs.

```cpp
template<typename... Args>
constexpr size_t count(Args... args) {
    return sizeof...(Args);  // or sizeof...(args)
}
```

### Pack Expansion

**Q: In what contexts can parameter packs be expanded?**

A: Primarily:
- Function call arguments
- Initializer lists
- Type lists
- Base class lists
- Member initializer lists
- Lambda capture lists
- Template argument lists

**Q: Explain the expansion result of the following code:**

```cpp
template<typename... Args>
void example(Args... args) {
    func(process(args)...);
}
```

A: For the call `example(1, 2, 3)`, it expands to `func(process(1), process(2), process(3))`. The pattern `process(args)` is applied to each argument, then separated by commas.

### Fold Expressions

**Q: How many forms of C++17 fold expressions are there? Explain their expansion rules.**

A: Four forms:
1. Unary right fold `(pack op ...)`: Expands to `(a1 op (a2 op (a3 op a4)))`
2. Unary left fold `(... op pack)`: Expands to `(((a1 op a2) op a3) op a4)`
3. Binary right fold `(pack op ... op init)`: Expands to `(a1 op (a2 op (a3 op init)))`
4. Binary left fold `(init op ... op pack)`: Expands to `(((init op a1) op a2) op a3)`

**Q: How do you safely handle empty parameter packs?**

A: Use binary fold expressions to provide initial values:

```cpp
template<typename... Args>
auto sum(Args... args) {
    return (args + ... + 0);  // Returns 0 for empty pack
}

template<typename... Args>
bool all_of(Args... args) {
    return (args && ... && true);  // Returns true for empty pack
}
```

### Recursive Templates

**Q: How were parameter packs handled before C++17?**

A: Using recursive template techniques, requiring:
1. Defining a base case (empty or single argument)
2. Defining a recursive case (process first argument, recursively process remaining)

```cpp
void print() {}  // Base case

template<typename T, typename... Rest>
void print(T first, Rest... rest) {
    std::cout << first << " ";
    print(rest...);  // Recursion
}
```

### Perfect Forwarding

**Q: How do variadic templates implement perfect forwarding?**

A: Using forwarding references `Args&&...` combined with `std::forward`:

```cpp
template<typename... Args>
void forward_all(Args&&... args) {
    other_func(std::forward<Args>(args)...);
}
```

This preserves the value category (lvalue/rvalue) of each argument, which is key to implementing `std::make_unique`, `std::make_shared`, and similar functions.

### Practical Applications

**Q: What are some applications of variadic templates in the standard library?**

A: Main applications include:
- `std::tuple`: Storing tuples of arbitrary types
- `std::make_unique/std::make_shared`: Perfect forwarding of constructor arguments
- `std::invoke`: Unified call interface
- `std::variant`: Type-safe union
- `std::function`: Storing any callable object

## Further Reading

### Official Documentation

- [C++ Reference: Parameter pack](https://en.cppreference.com/w/cpp/language/parameter_pack)
- [C++ Reference: Fold expressions](https://en.cppreference.com/w/cpp/language/fold)
- [C++ Reference: sizeof... operator](https://en.cppreference.com/w/cpp/language/sizeof...)

### Classic Books

- "C++ Templates: The Complete Guide (2nd Edition)" by David Vandevoorde, Nicolai M. Josuttis, Douglas Gregor
- "Effective Modern C++" by Scott Meyers - Items 25-27 on perfect forwarding
- "C++17 - The Complete Guide" by Nicolai M. Josuttis - Fold expressions chapter

### Technical Articles

- [Eli Bendersky: Variadic templates in C++](https://eli.thegreenplace.net/2014/variadic-templates-in-c/)
- [Jonathan Boccara: Fold Expressions in C++17](https://www.fluentcpp.com/2021/03/12/cpp-fold-expressions/)
- [ModernesCpp: Fold Expressions](https://www.modernescpp.com/index.php/fold-expressions)

### Related Topics

- C++ Template Metaprogramming
- SFINAE and Concepts
- Perfect Forwarding and Move Semantics
- std::tuple Implementation Principles
- Type Erasure Techniques
