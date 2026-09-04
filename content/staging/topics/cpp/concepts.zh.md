---
title: C++20 Concepts 概念
description: 学习 C++20 Concepts 约束模板参数，实现更清晰的泛型编程
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - Concepts
  - C++20
  - 模板
status: imported
origin: old/src/content/docs/cpp/concepts.zh.md
divergence: 0.219
issues: []
legacy:
  category: Cpp
  subcategory: C++20
  order: 20
  lastUpdated: 2026-01-07
---

C++20 引入的 Concepts（概念）是泛型编程领域最重要的革新之一。它提供了一种声明式的方式来约束模板参数，使得模板代码更加清晰、易读，并能产生更友好的编译错误信息。本文将全面介绍 Concepts 的核心概念和使用方法。

## 为什么需要 Concepts

在 C++20 之前，模板编程面临着几个主要问题：

### 传统模板的痛点

```cpp
#include <type_traits>

// C++17 之前：使用 SFINAE 约束模板
template<typename T,
         typename = std::enable_if_t<std::is_integral_v<T>>>
T add_old(T a, T b) {
    return a + b;
}

// 如果传入错误类型，错误信息极其冗长难懂
// add_old(3.14, 2.71);  // 编译错误信息令人困惑
```

传统方法的问题：
1. **SFINAE 代码晦涩难懂**：即使是有经验的开发者也难以快速理解
2. **错误信息冗长**：当类型不匹配时，编译器产生大量难以解读的错误
3. **约束意图不明确**：类型要求隐藏在复杂的模板元编程中
4. **难以复用**：相同的约束需要重复编写

### Concepts 的解决方案

```cpp
#include <concepts>

// C++20：使用 Concepts 约束模板
template<std::integral T>
T add_new(T a, T b) {
    return a + b;
}

// 错误信息清晰明了
// add_new(3.14, 2.71);
// 错误：约束 'std::integral<double>' 不满足
```

Concepts 带来的优势：
- **语法清晰**：约束条件一目了然
- **错误信息友好**：编译器能精确指出哪个约束不满足
- **自文档化**：概念名称本身就是文档
- **可组合性**：概念可以轻松组合和复用

## 概念定义 (Concept Definition)

### 基本语法

概念使用 `concept` 关键字定义，本质上是一个编译期布尔表达式：

```cpp
template<typename T>
concept ConceptName = /* 编译期布尔表达式 */;
```

### 使用类型特征定义概念

最简单的概念可以直接使用标准库的类型特征：

```cpp
#include <type_traits>
#include <concepts>

// 使用类型特征定义概念
template<typename T>
concept Integral = std::is_integral_v<T>;

template<typename T>
concept FloatingPoint = std::is_floating_point_v<T>;

template<typename T>
concept Signed = std::is_signed_v<T>;

template<typename T>
concept Pointer = std::is_pointer_v<T>;

// 使用自定义概念
template<Integral T>
T double_value(T x) {
    return x * 2;
}

int main() {
    auto result = double_value(42);    // OK
    // double_value(3.14);             // 编译错误：double 不是整数类型
    return 0;
}
```

### 使用 requires 表达式定义概念

更强大的概念定义使用 `requires` 表达式：

```cpp
#include <concepts>
#include <iostream>

// 定义"可加"概念
template<typename T>
concept Addable = requires(T a, T b) {
    a + b;  // 要求 a + b 表达式有效
};

// 定义"可哈希"概念
template<typename T>
concept Hashable = requires(T t) {
    { std::hash<T>{}(t) } -> std::convertible_to<std::size_t>;
};

// 定义"可打印"概念
template<typename T>
concept Printable = requires(std::ostream& os, const T& t) {
    { os << t } -> std::same_as<std::ostream&>;
};

// 使用概念
template<Addable T>
T sum(T a, T b) {
    return a + b;
}

template<Printable T>
void print(const T& value) {
    std::cout << value << std::endl;
}
```

### 组合概念

概念可以通过逻辑运算符组合：

```cpp
#include <concepts>

// 使用逻辑运算符组合概念
template<typename T>
concept Number = std::integral<T> || std::floating_point<T>;

template<typename T>
concept SignedNumber = Number<T> && std::is_signed_v<T>;

template<typename T>
concept UnsignedIntegral = std::integral<T> && !std::is_signed_v<T>;

// 更复杂的组合
template<typename T>
concept Arithmetic = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a - b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { a / b } -> std::convertible_to<T>;
};

template<typename T>
concept OrderedArithmetic = Arithmetic<T> && std::totally_ordered<T>;
```

## requires 子句 (Requires Clause)

`requires` 子句用于在模板声明中指定约束条件。有多种使用方式：

### 方式一：前置 requires 子句

```cpp
#include <concepts>

// 在模板参数列表后使用 requires 子句
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

// 多个约束
template<typename T>
requires std::integral<T> && std::is_signed_v<T>
T absolute(T x) {
    return x < 0 ? -x : x;
}
```

### 方式二：尾置 requires 子句

```cpp
#include <concepts>

// requires 子句放在函数声明末尾
template<typename T>
T lcm(T a, T b) requires std::integral<T> {
    return (a / gcd(a, b)) * b;
}

// 对于成员函数特别有用
template<typename T>
class Container {
    T value;
public:
    Container(T v) : value(v) {}

    // 只有当 T 满足概念时才启用此函数
    void print() const requires Printable<T> {
        std::cout << value << std::endl;
    }

    T doubled() const requires std::integral<T> {
        return value * 2;
    }
};
```

### 方式三：概念作为模板参数约束

```cpp
#include <concepts>

// 直接用概念约束模板参数
template<std::integral T>
T factorial(T n) {
    T result = 1;
    for (T i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

template<std::floating_point T>
T square_root(T x) {
    return std::sqrt(x);
}
```

### 方式四：简化函数模板语法

```cpp
#include <concepts>

// 最简洁的语法：auto + 概念
auto square(std::integral auto n) {
    return n * n;
}

auto add(std::integral auto a, std::integral auto b) {
    return a + b;
}

// 等价于：
// template<std::integral T, std::integral U>
// auto add(T a, U b) { return a + b; }

// 返回类型也可以约束
std::integral auto compute(std::integral auto x) {
    return x * 2;
}
```

### requires 子句中的复杂表达式

```cpp
#include <concepts>
#include <type_traits>

template<typename T>
concept HasValueType = requires {
    typename T::value_type;
};

// 复杂的 requires 子句
template<typename Container>
requires HasValueType<Container> &&
         std::integral<typename Container::value_type> &&
         requires(Container c) {
             { c.size() } -> std::convertible_to<std::size_t>;
             { c.begin() };
             { c.end() };
         }
auto sum_container(const Container& c) {
    typename Container::value_type result = 0;
    for (const auto& elem : c) {
        result += elem;
    }
    return result;
}
```

## requires 表达式 (Requires Expression)

`requires` 表达式是定义概念的核心工具，它可以检查多种编译期条件。

### 简单要求 (Simple Requirements)

检查表达式是否合法：

```cpp
template<typename T>
concept Incrementable = requires(T t) {
    ++t;        // 前置递增必须有效
    t++;        // 后置递增必须有效
    t += 1;     // 复合赋值必须有效
};

template<typename T>
concept Dereferenceable = requires(T t) {
    *t;         // 解引用必须有效
};

template<typename T>
concept Subscriptable = requires(T t, std::size_t i) {
    t[i];       // 下标操作必须有效
};
```

### 类型要求 (Type Requirements)

检查类型是否存在：

```cpp
template<typename T>
concept HasNestedTypes = requires {
    typename T::value_type;      // 必须有 value_type 类型
    typename T::iterator;        // 必须有 iterator 类型
    typename T::const_iterator;  // 必须有 const_iterator 类型
    typename T::size_type;       // 必须有 size_type 类型
};

template<typename T>
concept HasPointerType = requires {
    typename T::pointer;
    typename T::const_pointer;
};

// 可以检查模板特化是否有效
template<typename T>
concept Hashable = requires {
    typename std::hash<T>;  // std::hash<T> 必须存在
};
```

### 复合要求 (Compound Requirements)

检查表达式的返回类型：

```cpp
#include <concepts>

template<typename T>
concept Sizeable = requires(T t) {
    // 语法：{ 表达式 } -> 类型约束;
    { t.size() } -> std::convertible_to<std::size_t>;
    { t.empty() } -> std::same_as<bool>;
};

template<typename T>
concept Comparable = requires(T a, T b) {
    { a == b } -> std::convertible_to<bool>;
    { a != b } -> std::convertible_to<bool>;
    { a < b } -> std::convertible_to<bool>;
    { a > b } -> std::convertible_to<bool>;
    { a <= b } -> std::convertible_to<bool>;
    { a >= b } -> std::convertible_to<bool>;
};

// 检查 noexcept
template<typename T>
concept NothrowMovable = requires(T t) {
    { std::move(t) } noexcept;
};

template<typename T>
concept NothrowSwappable = requires(T a, T b) {
    { std::swap(a, b) } noexcept;
};
```

### 嵌套要求 (Nested Requirements)

在 requires 表达式内部添加额外的编译期谓词：

```cpp
#include <concepts>
#include <type_traits>

template<typename T>
concept ValidContainer = requires(T t) {
    typename T::value_type;
    typename T::iterator;

    { t.begin() } -> std::same_as<typename T::iterator>;
    { t.end() } -> std::same_as<typename T::iterator>;
    { t.size() } -> std::convertible_to<std::size_t>;

    // 嵌套要求
    requires std::same_as<
        decltype(*t.begin()),
        typename T::value_type&
    >;
    requires sizeof(T) >= sizeof(void*);
    requires std::is_default_constructible_v<T>;
};

template<typename T>
concept LargeType = requires {
    requires sizeof(T) > 16;
};

template<typename T, typename U>
concept SameSize = requires {
    requires sizeof(T) == sizeof(U);
};
```

### 完整示例：定义容器概念

```cpp
#include <concepts>
#include <iterator>
#include <cstddef>

// 迭代器概念
template<typename I>
concept Iterator = requires(I i) {
    typename std::iter_value_t<I>;
    { *i } -> std::same_as<std::iter_reference_t<I>>;
    { ++i } -> std::same_as<I&>;
    { i++ };
};

// 容器概念
template<typename C>
concept Container = requires(C c, const C cc) {
    // 类型要求
    typename C::value_type;
    typename C::size_type;
    typename C::iterator;
    typename C::const_iterator;

    // 构造和赋值
    requires std::default_initializable<C>;
    requires std::copy_constructible<C>;

    // 迭代器
    { c.begin() } -> std::same_as<typename C::iterator>;
    { c.end() } -> std::same_as<typename C::iterator>;
    { cc.begin() } -> std::same_as<typename C::const_iterator>;
    { cc.end() } -> std::same_as<typename C::const_iterator>;

    // 大小
    { cc.size() } -> std::convertible_to<typename C::size_type>;
    { cc.empty() } -> std::convertible_to<bool>;
};

// 序列容器概念
template<typename C>
concept SequenceContainer = Container<C> && requires(C c, typename C::value_type v) {
    c.push_back(v);
    c.pop_back();
    { c.front() } -> std::same_as<typename C::value_type&>;
    { c.back() } -> std::same_as<typename C::value_type&>;
};

// 随机访问容器概念
template<typename C>
concept RandomAccessContainer = Container<C> && requires(C c, typename C::size_type i) {
    { c[i] } -> std::same_as<typename C::value_type&>;
    { c.at(i) } -> std::same_as<typename C::value_type&>;
};
```

## 标准概念 (Standard Concepts)

C++20 在 `<concepts>` 头文件中提供了丰富的标准概念。

### 核心语言概念

```cpp
#include <concepts>

// same_as: 检查两个类型是否相同
template<typename T, typename U>
concept MySameAs = std::same_as<T, U>;
// std::same_as<int, int>  -> true
// std::same_as<int, long> -> false

// derived_from: 检查是否派生自某个类
// std::derived_from<Derived, Base>

// convertible_to: 检查是否可转换
// std::convertible_to<int, double>  -> true
// std::convertible_to<int*, void*>  -> true

// common_reference_with: 检查是否有公共引用类型
// std::common_reference_with<int&, double&>

// common_with: 检查是否有公共类型
// std::common_with<int, double>  -> true (公共类型是 double)

// 示例使用
template<typename T, typename U>
requires std::convertible_to<T, U>
U convert(T value) {
    return static_cast<U>(value);
}

template<std::derived_from<std::exception> E>
void handle_exception(const E& e) {
    std::cerr << e.what() << std::endl;
}
```

### 比较概念

```cpp
#include <concepts>
#include <compare>

// equality_comparable: 支持 == 和 !=
template<std::equality_comparable T>
bool are_equal(const T& a, const T& b) {
    return a == b;
}

// totally_ordered: 支持所有比较运算符
template<std::totally_ordered T>
T clamp(T value, T min_val, T max_val) {
    if (value < min_val) return min_val;
    if (value > max_val) return max_val;
    return value;
}

// three_way_comparable: 支持 <=> 运算符
template<std::three_way_comparable T>
auto compare(const T& a, const T& b) {
    return a <=> b;
}

// 跨类型比较
template<typename T, typename U>
requires std::equality_comparable_with<T, U>
bool cross_equal(const T& a, const U& b) {
    return a == b;
}
```

### 对象概念

```cpp
#include <concepts>

// movable: 可移动
template<std::movable T>
void move_to(T& dest, T&& src) {
    dest = std::move(src);
}

// copyable: 可复制（包含 movable）
template<std::copyable T>
T make_copy(const T& original) {
    return original;
}

// semiregular: 可默认构造且可复制
template<std::semiregular T>
std::vector<T> create_vector(std::size_t count) {
    return std::vector<T>(count);
}

// regular: semiregular 且 equality_comparable
template<std::regular T>
bool check_identity(const T& a, const T& b) {
    T copy = a;
    return copy == a && !(copy == b);
}
```

### 可调用概念

```cpp
#include <concepts>
#include <functional>

// invocable: 可调用
template<typename F, typename... Args>
requires std::invocable<F, Args...>
auto call(F&& f, Args&&... args) {
    return std::invoke(std::forward<F>(f), std::forward<Args>(args)...);
}

// regular_invocable: 可调用且无副作用（语义要求，编译器不检查）
template<std::regular_invocable<int> F>
int apply(F f, int x) {
    return f(x);
}

// predicate: 返回 bool 的可调用对象
template<typename Container, std::predicate<typename Container::value_type> Pred>
auto count_if(const Container& c, Pred pred) {
    std::size_t count = 0;
    for (const auto& elem : c) {
        if (pred(elem)) ++count;
    }
    return count;
}

// relation: 二元关系
template<typename T, std::relation<T, T> R>
bool check_relation(const T& a, const T& b, R rel) {
    return rel(a, b);
}
```

### 算术概念

```cpp
#include <concepts>

// integral: 整数类型
template<std::integral T>
T power_of_two(T n) {
    return T{1} << n;
}

// signed_integral: 有符号整数
template<std::signed_integral T>
T negate(T x) {
    return -x;
}

// unsigned_integral: 无符号整数
template<std::unsigned_integral T>
T next_power_of_two(T n) {
    --n;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return ++n;
}

// floating_point: 浮点类型
template<std::floating_point T>
T reciprocal(T x) {
    return T{1} / x;
}

// 组合使用
template<typename T>
concept Number = std::integral<T> || std::floating_point<T>;

template<Number T>
T average(T a, T b) {
    return (a + b) / T{2};
}
```

### 标准概念速查表

| 类别 | 概念 | 描述 |
|------|------|------|
| **核心语言** | `same_as<T, U>` | T 和 U 是相同类型 |
| | `derived_from<D, B>` | D 派生自 B |
| | `convertible_to<From, To>` | From 可隐式转换为 To |
| | `common_reference_with<T, U>` | T 和 U 有公共引用类型 |
| | `common_with<T, U>` | T 和 U 有公共类型 |
| | `assignable_from<T, U>` | U 可赋值给 T |
| | `swappable<T>` | T 类型的对象可交换 |
| **比较** | `equality_comparable<T>` | 支持 == 和 != |
| | `totally_ordered<T>` | 支持所有比较运算符 |
| | `three_way_comparable<T>` | 支持 <=> |
| **对象** | `destructible<T>` | 可析构 |
| | `constructible_from<T, Args...>` | 可从 Args 构造 |
| | `default_initializable<T>` | 可默认初始化 |
| | `move_constructible<T>` | 可移动构造 |
| | `copy_constructible<T>` | 可复制构造 |
| | `movable<T>` | 可移动 |
| | `copyable<T>` | 可复制 |
| | `semiregular<T>` | 可默认构造且可复制 |
| | `regular<T>` | semiregular 且可比较相等 |
| **可调用** | `invocable<F, Args...>` | 可调用 |
| | `predicate<F, Args...>` | 返回布尔值的可调用对象 |
| | `relation<R, T, U>` | 二元关系 |
| | `equivalence_relation<R, T, U>` | 等价关系 |
| | `strict_weak_order<R, T, U>` | 严格弱序 |
| **算术** | `integral<T>` | 整数类型 |
| | `signed_integral<T>` | 有符号整数 |
| | `unsigned_integral<T>` | 无符号整数 |
| | `floating_point<T>` | 浮点类型 |

## 约束的合取与析取 (Constraint Conjunction and Disjunction)

### 合取 (Conjunction) - 逻辑与

使用 `&&` 组合多个约束，所有约束都必须满足：

```cpp
#include <concepts>
#include <type_traits>

// 合取：T 必须同时是整数且有符号
template<typename T>
concept SignedInteger = std::integral<T> && std::is_signed_v<T>;

// 等价的写法
template<typename T>
concept SignedInteger2 = std::signed_integral<T>;

// 使用合取约束
template<typename T>
requires std::integral<T> && std::is_signed_v<T>
T safe_negate(T x) {
    // 处理有符号整数的安全取反
    if (x == std::numeric_limits<T>::min()) {
        throw std::overflow_error("Cannot negate minimum value");
    }
    return -x;
}

// 多个合取
template<typename T>
concept StringLike = requires(T t) {
    { t.size() } -> std::convertible_to<std::size_t>;
    { t.data() } -> std::convertible_to<const char*>;
} && std::is_class_v<T> && std::copy_constructible<T>;
```

### 析取 (Disjunction) - 逻辑或

使用 `||` 组合约束，满足任一约束即可：

```cpp
#include <concepts>

// 析取：T 可以是整数或浮点数
template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// 使用析取
template<Numeric T>
T absolute(T x) {
    return x < 0 ? -x : x;
}

// 更复杂的析取
template<typename T>
concept StringOrNumeric =
    std::same_as<T, std::string> ||
    std::integral<T> ||
    std::floating_point<T>;

template<StringOrNumeric T>
std::string to_string_value(const T& value) {
    if constexpr (std::same_as<T, std::string>) {
        return value;
    } else {
        return std::to_string(value);
    }
}
```

### 短路求值

约束的合取和析取支持短路求值：

```cpp
#include <concepts>

template<typename T>
concept HasFoo = requires(T t) { t.foo(); };

template<typename T>
concept HasBar = requires(T t) { t.bar(); };

// 合取短路：如果 HasFoo 失败，不会检查 HasBar
template<typename T>
concept HasFooAndBar = HasFoo<T> && HasBar<T>;

// 析取短路：如果 HasFoo 成功，不会检查 HasBar
template<typename T>
concept HasFooOrBar = HasFoo<T> || HasBar<T>;
```

### 约束归一化

编译器会对约束进行归一化处理，以确定子系统关系：

```cpp
#include <concepts>

// 这两个概念在归一化后是等价的
template<typename T>
concept A = std::integral<T> && std::is_signed_v<T>;

template<typename T>
concept B = std::is_signed_v<T> && std::integral<T>;

// 但概念定义的结构会影响子系统判断
template<typename T>
concept C = std::integral<T>;  // 基础概念

template<typename T>
concept D = C<T> && std::is_signed_v<T>;  // D 子系统 C
```

### 重载决议与约束子系统

当多个重载都满足时，编译器选择约束更严格的版本：

```cpp
#include <concepts>
#include <iostream>

template<typename T>
concept Printable = requires(std::ostream& os, T t) {
    { os << t } -> std::same_as<std::ostream&>;
};

template<typename T>
concept PrintableNumber = Printable<T> && (std::integral<T> || std::floating_point<T>);

template<typename T>
concept PrintableInteger = PrintableNumber<T> && std::integral<T>;

// 三个重载，约束从宽到严
template<Printable T>
void display(T value) {
    std::cout << "[Printable] " << value << std::endl;
}

template<PrintableNumber T>
void display(T value) {
    std::cout << "[PrintableNumber] " << value << std::endl;
}

template<PrintableInteger T>
void display(T value) {
    std::cout << "[PrintableInteger] " << value << std::endl;
}

int main() {
    display("Hello");  // [Printable] - 字符串只满足 Printable
    display(3.14);     // [PrintableNumber] - double 满足前两个，选更严格的
    display(42);       // [PrintableInteger] - int 满足全部，选最严格的
    return 0;
}
```

### 原子约束

原子约束是约束的最小单位，它们是子系统判断的基础：

```cpp
#include <concepts>

// 两个不同的原子约束，即使语义相同
template<typename T>
concept A = std::is_integral_v<T>;  // 使用类型特征

template<typename T>
concept B = std::integral<T>;        // 使用标准概念

// 在子系统判断中，A 和 B 被视为不同的原子约束
// 即使它们对相同类型产生相同结果

// 正确的做法：使用相同的基础定义
template<typename T>
concept Base = std::integral<T>;

template<typename T>
concept DerivedA = Base<T> && std::is_signed_v<T>;

template<typename T>
concept DerivedB = Base<T> && std::is_unsigned_v<T>;
```

## 实际应用示例

### 示例一：类型安全的数学库

```cpp
#include <concepts>
#include <cmath>
#include <iostream>
#include <stdexcept>

// 定义数学运算概念
template<typename T>
concept Arithmetic = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a - b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { a / b } -> std::convertible_to<T>;
};

template<typename T>
concept RealNumber = Arithmetic<T> && std::floating_point<T>;

// 安全的除法
template<Arithmetic T>
T safe_divide(T a, T b) {
    if (b == T{0}) {
        throw std::domain_error("Division by zero");
    }
    return a / b;
}

// 只对浮点数提供的操作
template<RealNumber T>
T square_root(T x) {
    if (x < T{0}) {
        throw std::domain_error("Cannot compute square root of negative number");
    }
    return std::sqrt(x);
}

template<RealNumber T>
T power(T base, T exponent) {
    return std::pow(base, exponent);
}

// 通用的数值统计
template<typename Container>
requires requires(Container c) {
    typename Container::value_type;
    { c.begin() };
    { c.end() };
    { c.size() } -> std::convertible_to<std::size_t>;
} && Arithmetic<typename Container::value_type>
auto mean(const Container& data) -> typename Container::value_type {
    using T = typename Container::value_type;
    if (data.empty()) {
        throw std::invalid_argument("Cannot compute mean of empty container");
    }
    T sum{};
    for (const auto& val : data) {
        sum = sum + val;
    }
    return sum / static_cast<T>(data.size());
}

int main() {
    std::cout << "10 / 3 = " << safe_divide(10, 3) << std::endl;
    std::cout << "10.0 / 3.0 = " << safe_divide(10.0, 3.0) << std::endl;
    std::cout << "sqrt(16.0) = " << square_root(16.0) << std::endl;
    std::cout << "2^10 = " << power(2.0, 10.0) << std::endl;

    std::vector<double> values = {1.0, 2.0, 3.0, 4.0, 5.0};
    std::cout << "mean = " << mean(values) << std::endl;

    return 0;
}
```

### 示例二：泛型算法库

```cpp
#include <concepts>
#include <vector>
#include <algorithm>
#include <iostream>
#include <functional>

// 范围概念
template<typename R>
concept Range = requires(R r) {
    { std::begin(r) };
    { std::end(r) };
};

// 可排序范围概念
template<typename R>
concept SortableRange = Range<R> && requires(R r) {
    requires std::totally_ordered<decltype(*std::begin(r))>;
    requires std::random_access_iterator<decltype(std::begin(r))>;
};

// 约束的排序函数
template<SortableRange R>
void my_sort(R& range) {
    std::sort(std::begin(range), std::end(range));
}

template<SortableRange R, typename Compare>
requires std::predicate<Compare,
                        decltype(*std::begin(std::declval<R>())),
                        decltype(*std::begin(std::declval<R>()))>
void my_sort(R& range, Compare comp) {
    std::sort(std::begin(range), std::end(range), comp);
}

// 约束的查找函数
template<Range R, typename T>
requires std::equality_comparable_with<decltype(*std::begin(std::declval<R>())), T>
auto my_find(R& range, const T& value) {
    return std::find(std::begin(range), std::end(range), value);
}

// 约束的过滤函数
template<Range R, typename Pred>
requires std::predicate<Pred, decltype(*std::begin(std::declval<R>()))>
auto my_filter(const R& range, Pred pred) {
    using ValueType = std::remove_cvref_t<decltype(*std::begin(range))>;
    std::vector<ValueType> result;
    for (const auto& elem : range) {
        if (pred(elem)) {
            result.push_back(elem);
        }
    }
    return result;
}

// 约束的变换函数
template<Range R, typename Func>
requires std::invocable<Func, decltype(*std::begin(std::declval<R>()))>
auto my_transform(const R& range, Func func) {
    using ResultType = std::invoke_result_t<Func, decltype(*std::begin(range))>;
    std::vector<ResultType> result;
    for (const auto& elem : range) {
        result.push_back(func(elem));
    }
    return result;
}

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // 排序
    my_sort(numbers);
    std::cout << "Sorted: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;

    // 降序排序
    my_sort(numbers, std::greater<int>{});
    std::cout << "Descending: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;

    // 查找
    auto it = my_find(numbers, 5);
    if (it != numbers.end()) {
        std::cout << "Found 5 at index: " << (it - numbers.begin()) << std::endl;
    }

    // 过滤偶数
    auto evens = my_filter(numbers, [](int n) { return n % 2 == 0; });
    std::cout << "Evens: ";
    for (int n : evens) std::cout << n << " ";
    std::cout << std::endl;

    // 变换为平方
    auto squares = my_transform(numbers, [](int n) { return n * n; });
    std::cout << "Squares: ";
    for (int n : squares) std::cout << n << " ";
    std::cout << std::endl;

    return 0;
}
```

### 示例三：约束的类模板

```cpp
#include <concepts>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

// 可序列化概念
template<typename T>
concept Serializable = requires(T t, std::ostream& os) {
    { t.serialize(os) } -> std::same_as<void>;
};

// 可反序列化概念
template<typename T>
concept Deserializable = requires(std::istream& is) {
    { T::deserialize(is) } -> std::same_as<T>;
};

// 完全可序列化
template<typename T>
concept FullySerializable = Serializable<T> && Deserializable<T>;

// 约束的存储类
template<typename T>
class Storage {
    std::vector<T> items;

public:
    void add(T item) {
        items.push_back(std::move(item));
    }

    // 只有当 T 可序列化时才提供此方法
    void save_all(std::ostream& os) const requires Serializable<T> {
        for (const auto& item : items) {
            item.serialize(os);
        }
    }

    // 只有当 T 可打印时才提供此方法
    void print_all() const requires requires(std::ostream& os, const T& t) {
        { os << t } -> std::same_as<std::ostream&>;
    } {
        for (const auto& item : items) {
            std::cout << item << std::endl;
        }
    }

    // 只有当 T 可比较时才提供排序方法
    void sort() requires std::totally_ordered<T> {
        std::sort(items.begin(), items.end());
    }

    std::size_t size() const { return items.size(); }

    const T& operator[](std::size_t i) const { return items[i]; }
};

// 智能指针包装器，只接受类类型
template<typename T>
requires std::is_class_v<T>
class SmartWrapper {
    std::unique_ptr<T> ptr;

public:
    template<typename... Args>
    requires std::constructible_from<T, Args...>
    SmartWrapper(Args&&... args)
        : ptr(std::make_unique<T>(std::forward<Args>(args)...)) {}

    T* get() { return ptr.get(); }
    const T* get() const { return ptr.get(); }

    T& operator*() { return *ptr; }
    const T& operator*() const { return *ptr; }

    T* operator->() { return ptr.get(); }
    const T* operator->() const { return ptr.get(); }
};

int main() {
    // 基本类型存储
    Storage<int> int_storage;
    int_storage.add(5);
    int_storage.add(2);
    int_storage.add(8);
    int_storage.print_all();
    int_storage.sort();
    std::cout << "After sort:" << std::endl;
    int_storage.print_all();

    // 字符串存储
    Storage<std::string> str_storage;
    str_storage.add("banana");
    str_storage.add("apple");
    str_storage.add("cherry");
    str_storage.sort();
    std::cout << "Sorted strings:" << std::endl;
    str_storage.print_all();

    // 智能包装器
    SmartWrapper<std::string> wrapped("Hello, Concepts!");
    std::cout << *wrapped << std::endl;
    std::cout << "Length: " << wrapped->length() << std::endl;

    return 0;
}
```

## 最佳实践

### 优先使用标准库概念

```cpp
#include <concepts>

// 推荐：使用标准库概念
template<std::integral T>
T add(T a, T b) { return a + b; }

// 不推荐：重新定义已有概念
template<typename T>
concept MyIntegral = std::is_integral_v<T>;  // 多余
```

### 使用形容词命名概念

```cpp
// 推荐：形容词形式，描述类型的特征
template<typename T>
concept Printable = /* ... */;

template<typename T>
concept Sortable = /* ... */;

template<typename T>
concept Hashable = /* ... */;

// 不推荐：名词形式
template<typename T>
concept Printer = /* ... */;  // 容易混淆
```

### 保持概念的原子性

```cpp
// 推荐：小而专注的概念，便于组合
template<typename T>
concept Addable = requires(T a, T b) { a + b; };

template<typename T>
concept Subtractable = requires(T a, T b) { a - b; };

template<typename T>
concept Arithmetic = Addable<T> && Subtractable<T>;

// 不推荐：过于复杂的单一概念
template<typename T>
concept DoesEverything = requires(T t) {
    t.add(); t.subtract(); t.multiply(); t.divide();
    t.print(); t.serialize(); t.hash();
};
```

### 文档化自定义概念

```cpp
/**
 * @brief 表示一个可序列化的类型
 *
 * 满足此概念的类型必须：
 * - 提供 serialize(ostream&) 成员函数
 * - 提供静态 deserialize(istream&) 函数返回 T
 * - 支持相等比较
 */
template<typename T>
concept Serializable = requires(T t, std::ostream& os, std::istream& is) {
    { t.serialize(os) } -> std::same_as<void>;
    { T::deserialize(is) } -> std::same_as<T>;
    { t == t } -> std::convertible_to<bool>;
};
```

### 避免过度约束

```cpp
// 推荐：只约束必需的能力
template<typename T>
requires requires(T t) { t.process(); }
void do_work(T& obj) {
    obj.process();
}

// 不推荐：约束与使用不匹配
template<typename T>
requires std::integral<T> && std::signed_integral<T> &&
         std::is_trivially_copyable_v<T> && (sizeof(T) >= 4)
void simple_operation(T x) {
    // 只是简单地使用 x，不需要这么多约束
}
```

## 常见陷阱

### 混淆 requires 表达式和 requires 子句

```cpp
// requires 子句：约束模板
template<typename T>
requires std::integral<T>        // <- requires 子句
T foo(T x) { return x; }

// requires 表达式：定义约束
template<typename T>
concept Addable = requires(T a, T b) {  // <- requires 表达式
    a + b;
};

// 嵌套使用
template<typename T>
requires requires(T t) { t.foo(); }  // requires 子句中的 requires 表达式
void bar(T t) { t.foo(); }
```

### 概念中的副作用

```cpp
// 错误：概念不应有副作用
int counter = 0;

template<typename T>
concept BadConcept = requires(T t) {
    { ++counter, t.foo() };  // 副作用！每次检查都会递增 counter
};

// 正确：概念应该是纯粹的
template<typename T>
concept GoodConcept = requires(T t) {
    t.foo();
};
```

### 遗漏返回类型约束

```cpp
// 不完整：只检查表达式有效性
template<typename T>
concept Incomplete = requires(T t) {
    t.size();  // 不检查返回类型
};

// 完整：检查返回类型
template<typename T>
concept Complete = requires(T t) {
    { t.size() } -> std::convertible_to<std::size_t>;
};
```

### 概念不检查运行时行为

```cpp
// 概念只检查语法，不检查语义
template<typename T>
concept Comparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

struct BadComparable {
    bool operator<(const BadComparable&) const {
        return rand() % 2;  // 非确定性！概念无法检测
    }
};

static_assert(Comparable<BadComparable>);  // 通过，但语义错误
```

### 循环概念定义

```cpp
// 错误：循环依赖
template<typename T>
concept A = B<T>;  // A 依赖 B

template<typename T>
concept B = A<T>;  // B 依赖 A - 编译错误！

// 正确：线性依赖
template<typename T>
concept Base = std::is_class_v<T>;

template<typename T>
concept Derived = Base<T> && requires(T t) { t.extra(); };
```

## 编译器支持

Concepts 需要 C++20 支持：

| 编译器 | 最低版本 | 编译选项 |
|--------|----------|----------|
| GCC | 10+ | `-std=c++20` |
| Clang | 12+ | `-std=c++20` |
| MSVC | 19.28+ | `/std:c++20` |

## 总结

C++20 Concepts 是泛型编程的重大进步：

1. **概念定义**：使用 `concept` 关键字创建命名的类型约束
2. **requires 子句**：在模板声明中应用约束
3. **requires 表达式**：检查类型的各种编译期属性
4. **标准概念**：`<concepts>` 头文件提供常用概念
5. **约束组合**：使用 `&&` 和 `||` 组合约束

掌握 Concepts 能让你写出更清晰、更安全、更易维护的模板代码，同时享受更友好的编译错误信息。

## 延伸阅读

- [cppreference - Concepts](https://en.cppreference.com/w/cpp/language/constraints)
- [cppreference - Standard Library Concepts](https://en.cppreference.com/w/cpp/concepts)
- 《C++20 - The Complete Guide》by Nicolai M. Josuttis
- 《Professional C++》5th Edition by Marc Gregoire
