---
title: C++ 模板编程
description: 掌握 C++ 模板：函数模板、类模板、特化与模板元编程
track: cpp
section: templates-generic
difficulty: advanced
tags:
  - C++
  - 模板
  - 泛型
  - 元编程
status: imported
origin: old/src/content/docs/cpp/templates.zh.md
divergence: 0.256
issues: []
legacy:
  category: Cpp
  subcategory: 模板
  order: 4
  lastUpdated: 2026-01-07
---

C++ 模板是实现泛型编程的核心机制，允许编写与类型无关的代码。模板在编译期进行实例化，提供了零运行时开销的抽象能力。

## 函数模板

函数模板允许定义通用的函数，可以处理不同类型的参数。

### 基本语法

```cpp
#include <iostream>
#include <string>

// 简单的函数模板
template<typename T>
T max(T a, T b) {
    return (a > b) ? a : b;
}

// 多个模板参数
template<typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}

int main() {
    std::cout << max(10, 20) << std::endl;        // int 版本
    std::cout << max(3.14, 2.72) << std::endl;    // double 版本
    std::cout << max('a', 'z') << std::endl;      // char 版本

    std::cout << add(5, 3.14) << std::endl;       // int + double
    return 0;
}
```

### 模板参数推导

```cpp
#include <vector>
#include <iostream>

// 显式指定类型
template<typename T>
void print(const T& value) {
    std::cout << value << std::endl;
}

// 模板参数推导
template<typename T>
void printVector(const std::vector<T>& vec) {
    for (const auto& item : vec) {
        std::cout << item << " ";
    }
    std::cout << std::endl;
}

// C++17 类模板参数推导 (CTAD)
template<typename T>
struct Container {
    T value;
    Container(T v) : value(v) {}
};

int main() {
    print(42);              // T 推导为 int
    print("Hello");         // T 推导为 const char*

    std::vector<int> nums = {1, 2, 3, 4, 5};
    printVector(nums);      // T 推导为 int

    // C++17: 类模板参数推导
    Container c1(42);       // Container<int>
    Container c2(3.14);     // Container<double>

    return 0;
}
```

### 非类型模板参数

```cpp
#include <iostream>
#include <array>

// 非类型模板参数（编译期常量）
template<typename T, int Size>
class FixedArray {
private:
    T data[Size];

public:
    int size() const { return Size; }

    T& operator[](int index) { return data[index]; }
    const T& operator[](int index) const { return data[index]; }
};

// 编译期计算阶乘
template<int N>
struct Factorial {
    static constexpr int value = N * Factorial<N - 1>::value;
};

template<>
struct Factorial<0> {
    static constexpr int value = 1;
};

int main() {
    FixedArray<int, 5> arr;
    arr[0] = 10;
    std::cout << "Array size: " << arr.size() << std::endl;

    // 编译期计算
    std::cout << "5! = " << Factorial<5>::value << std::endl;  // 120

    return 0;
}
```

## 类模板

类模板允许创建通用的类，可以处理不同类型的数据。

### 基本类模板

```cpp
#include <iostream>
#include <stdexcept>

// 简单的栈实现
template<typename T>
class Stack {
private:
    static const int MAX_SIZE = 100;
    T elements[MAX_SIZE];
    int top;

public:
    Stack() : top(-1) {}

    void push(const T& element) {
        if (top >= MAX_SIZE - 1) {
            throw std::overflow_error("Stack overflow");
        }
        elements[++top] = element;
    }

    T pop() {
        if (isEmpty()) {
            throw std::underflow_error("Stack underflow");
        }
        return elements[top--];
    }

    const T& peek() const {
        if (isEmpty()) {
            throw std::underflow_error("Stack is empty");
        }
        return elements[top];
    }

    bool isEmpty() const {
        return top == -1;
    }

    int size() const {
        return top + 1;
    }
};

int main() {
    Stack<int> intStack;
    intStack.push(10);
    intStack.push(20);
    intStack.push(30);

    std::cout << "Top: " << intStack.peek() << std::endl;
    std::cout << "Popped: " << intStack.pop() << std::endl;
    std::cout << "Size: " << intStack.size() << std::endl;

    Stack<std::string> stringStack;
    stringStack.push("Hello");
    stringStack.push("World");
    std::cout << stringStack.pop() << std::endl;

    return 0;
}
```

### 成员函数模板

```cpp
#include <iostream>
#include <memory>

template<typename T>
class SmartContainer {
private:
    std::unique_ptr<T> data;

public:
    SmartContainer(T value) : data(std::make_unique<T>(value)) {}

    // 成员函数模板
    template<typename U>
    void convert(const U& value) {
        *data = static_cast<T>(value);
    }

    template<typename Func>
    auto apply(Func f) -> decltype(f(*data)) {
        return f(*data);
    }

    T get() const { return *data; }
};

int main() {
    SmartContainer<int> container(42);

    // 使用成员函数模板
    container.convert(3.14);  // double -> int
    std::cout << "Value: " << container.get() << std::endl;

    // 应用函数
    auto result = container.apply([](int x) { return x * 2; });
    std::cout << "Result: " << result << std::endl;

    return 0;
}
```

### 模板模板参数

```cpp
#include <iostream>
#include <vector>
#include <list>
#include <deque>

// 模板模板参数
template<typename T, template<typename, typename> class Container>
class Adapter {
private:
    Container<T, std::allocator<T>> data;

public:
    void add(const T& item) {
        data.push_back(item);
    }

    void print() const {
        for (const auto& item : data) {
            std::cout << item << " ";
        }
        std::cout << std::endl;
    }
};

int main() {
    Adapter<int, std::vector> vecAdapter;
    vecAdapter.add(1);
    vecAdapter.add(2);
    vecAdapter.add(3);
    vecAdapter.print();

    Adapter<int, std::list> listAdapter;
    listAdapter.add(10);
    listAdapter.add(20);
    listAdapter.print();

    return 0;
}
```

## 模板特化

模板特化允许为特定类型提供专门的实现。

### 全特化

```cpp
#include <iostream>
#include <cstring>

// 通用模板
template<typename T>
class Comparer {
public:
    static bool isEqual(const T& a, const T& b) {
        return a == b;
    }
};

// 针对 const char* 的全特化
template<>
class Comparer<const char*> {
public:
    static bool isEqual(const char* a, const char* b) {
        return std::strcmp(a, b) == 0;
    }
};

// 函数模板的全特化
template<typename T>
void print(const T& value) {
    std::cout << "Generic: " << value << std::endl;
}

template<>
void print<bool>(const bool& value) {
    std::cout << "Boolean: " << (value ? "true" : "false") << std::endl;
}

int main() {
    std::cout << Comparer<int>::isEqual(5, 5) << std::endl;
    std::cout << Comparer<const char*>::isEqual("hello", "hello") << std::endl;

    print(42);
    print(true);
    print(3.14);

    return 0;
}
```

### 偏特化

```cpp
#include <iostream>

// 主模板
template<typename T, typename U>
struct Pair {
    T first;
    U second;

    void print() const {
        std::cout << "Generic Pair: " << first << ", " << second << std::endl;
    }
};

// 偏特化：两个类型相同
template<typename T>
struct Pair<T, T> {
    T first;
    T second;

    void print() const {
        std::cout << "Same Type Pair: " << first << ", " << second << std::endl;
    }

    bool isEqual() const {
        return first == second;
    }
};

// 偏特化：指针类型
template<typename T, typename U>
struct Pair<T*, U*> {
    T* first;
    U* second;

    void print() const {
        std::cout << "Pointer Pair: " << *first << ", " << *second << std::endl;
    }
};

// 偏特化：const 类型
template<typename T, typename U>
struct Pair<const T, const U> {
    const T first;
    const U second;

    void print() const {
        std::cout << "Const Pair: " << first << ", " << second << std::endl;
    }
};

int main() {
    Pair<int, double> p1{10, 3.14};
    p1.print();

    Pair<int, int> p2{5, 5};
    p2.print();
    std::cout << "Equal? " << p2.isEqual() << std::endl;

    int x = 100, y = 200;
    Pair<int*, int*> p3{&x, &y};
    p3.print();

    return 0;
}
```

## 可变参数模板

可变参数模板允许接受任意数量的模板参数。

### 基本用法

```cpp
#include <iostream>

// 递归终止条件
void print() {
    std::cout << std::endl;
}

// 可变参数模板
template<typename T, typename... Args>
void print(T first, Args... args) {
    std::cout << first << " ";
    print(args...);  // 递归调用
}

// 使用折叠表达式（C++17）
template<typename... Args>
auto sum(Args... args) {
    return (args + ...);  // 一元右折叠
}

template<typename... Args>
auto product(Args... args) {
    return (args * ...);
}

int main() {
    print(1, 2, 3, "hello", 4.5, 'a');

    std::cout << "Sum: " << sum(1, 2, 3, 4, 5) << std::endl;
    std::cout << "Product: " << product(2, 3, 4) << std::endl;

    return 0;
}
```

### 高级应用

```cpp
#include <iostream>
#include <tuple>
#include <string>

// 计算参数包大小
template<typename... Args>
constexpr size_t count(Args... args) {
    return sizeof...(args);
}

// 类型安全的 printf
template<typename T>
void printFormatted(const T& value) {
    std::cout << value;
}

template<typename T, typename... Args>
void printFormatted(const T& first, const Args&... args) {
    std::cout << first << " ";
    printFormatted(args...);
}

// 完美转发
template<typename... Args>
auto makeTuple(Args&&... args) {
    return std::make_tuple(std::forward<Args>(args)...);
}

// 可变参数类模板
template<typename... Types>
class Tuple;

template<>
class Tuple<> {};

template<typename Head, typename... Tail>
class Tuple<Head, Tail...> : private Tuple<Tail...> {
    Head head;
public:
    Tuple(Head h, Tail... tail) : Tuple<Tail...>(tail...), head(h) {}

    Head getHead() const { return head; }
};

int main() {
    std::cout << "Count: " << count(1, 2, 3, 4, 5) << std::endl;

    printFormatted("Hello", 42, 3.14, "World");
    std::cout << std::endl;

    auto t = makeTuple(1, "test", 3.14);

    Tuple<int, std::string, double> customTuple(42, "answer", 3.14);
    std::cout << "Head: " << customTuple.getHead() << std::endl;

    return 0;
}
```

### 折叠表达式（C++17）

```cpp
#include <iostream>

// 一元右折叠：(args op ...)
template<typename... Args>
auto sumRight(Args... args) {
    return (args + ...);
}

// 一元左折叠：(... op args)
template<typename... Args>
auto sumLeft(Args... args) {
    return (... + args);
}

// 二元右折叠：(args op ... op init)
template<typename... Args>
auto sumWithInit(Args... args) {
    return (args + ... + 0);
}

// 逻辑运算
template<typename... Args>
bool allTrue(Args... args) {
    return (args && ...);
}

template<typename... Args>
bool anyTrue(Args... args) {
    return (args || ...);
}

// 打印所有参数
template<typename... Args>
void printAll(Args... args) {
    ((std::cout << args << " "), ...);
    std::cout << std::endl;
}

int main() {
    std::cout << "Sum: " << sumRight(1, 2, 3, 4, 5) << std::endl;
    std::cout << "All true: " << allTrue(true, true, false) << std::endl;
    std::cout << "Any true: " << anyTrue(false, true, false) << std::endl;

    printAll(1, "hello", 3.14, 'x', true);

    return 0;
}
```

## SFINAE

SFINAE（Substitution Failure Is Not An Error）是 C++ 模板元编程的重要特性。

### 基本 SFINAE

```cpp
#include <iostream>
#include <type_traits>

// 使用 std::enable_if
template<typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
add(T a, T b) {
    std::cout << "Integer version" << std::endl;
    return a + b;
}

template<typename T>
typename std::enable_if<std::is_floating_point<T>::value, T>::type
add(T a, T b) {
    std::cout << "Floating point version" << std::endl;
    return a + b;
}

// 检测成员函数
template<typename T>
class HasToString {
private:
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>().toString(), std::true_type{});

    template<typename>
    static std::false_type test(...);

public:
    static constexpr bool value = decltype(test<T>(0))::value;
};

struct WithToString {
    std::string toString() const { return "WithToString"; }
};

struct WithoutToString {
    // 没有 toString 方法
};

int main() {
    std::cout << add(5, 3) << std::endl;      // 整数版本
    std::cout << add(3.14, 2.72) << std::endl; // 浮点版本

    std::cout << "HasToString<WithToString>: "
              << HasToString<WithToString>::value << std::endl;
    std::cout << "HasToString<WithoutToString>: "
              << HasToString<WithoutToString>::value << std::endl;

    return 0;
}
```

### 高级 SFINAE 技巧

```cpp
#include <iostream>
#include <vector>
#include <type_traits>

// 检测是否可迭代
template<typename T, typename = void>
struct IsIterable : std::false_type {};

template<typename T>
struct IsIterable<T, std::void_t<
    decltype(std::declval<T>().begin()),
    decltype(std::declval<T>().end())
>> : std::true_type {};

// 根据类型特性选择实现
template<typename T>
std::enable_if_t<IsIterable<T>::value>
print(const T& container) {
    std::cout << "Iterable: ";
    for (const auto& item : container) {
        std::cout << item << " ";
    }
    std::cout << std::endl;
}

template<typename T>
std::enable_if_t<!IsIterable<T>::value>
print(const T& value) {
    std::cout << "Non-iterable: " << value << std::endl;
}

// 检测运算符重载
template<typename T, typename = void>
struct HasPlusOperator : std::false_type {};

template<typename T>
struct HasPlusOperator<T, std::void_t<
    decltype(std::declval<T>() + std::declval<T>())
>> : std::true_type {};

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    print(vec);
    print(42);

    std::cout << "int has +: " << HasPlusOperator<int>::value << std::endl;
    std::cout << "void has +: " << HasPlusOperator<void>::value << std::endl;

    return 0;
}
```

### if constexpr（C++17）

```cpp
#include <iostream>
#include <type_traits>
#include <string>

// 使用 if constexpr 简化 SFINAE
template<typename T>
auto getValue(T value) {
    if constexpr (std::is_pointer_v<T>) {
        std::cout << "Pointer type" << std::endl;
        return *value;
    } else if constexpr (std::is_integral_v<T>) {
        std::cout << "Integral type" << std::endl;
        return value * 2;
    } else {
        std::cout << "Other type" << std::endl;
        return value;
    }
}

template<typename T>
void process(T value) {
    if constexpr (std::is_same_v<T, std::string>) {
        std::cout << "String length: " << value.length() << std::endl;
    } else if constexpr (std::is_arithmetic_v<T>) {
        std::cout << "Arithmetic value: " << value << std::endl;
    } else {
        std::cout << "Unknown type" << std::endl;
    }
}

int main() {
    int x = 10;
    int* ptr = &x;

    std::cout << getValue(ptr) << std::endl;
    std::cout << getValue(5) << std::endl;
    std::cout << getValue(3.14) << std::endl;

    process(std::string("Hello"));
    process(42);
    process(3.14);

    return 0;
}
```

## Concepts (C++20)

Concepts 提供了更清晰的模板约束机制，改善了错误信息和代码可读性。

### 标准库 Concepts

```cpp
#include <iostream>
#include <concepts>
#include <vector>
#include <string>

// 使用标准 concepts
template<std::integral T>
T add(T a, T b) {
    return a + b;
}

template<std::floating_point T>
T multiply(T a, T b) {
    return a * b;
}

// 约束模板参数
template<typename T>
requires std::is_arithmetic_v<T>
T square(T value) {
    return value * value;
}

// 使用 concept 作为类型约束
template<typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template<Addable T>
T sum(T a, T b) {
    return a + b;
}

int main() {
    std::cout << add(5, 3) << std::endl;           // OK: int 是 integral
    std::cout << multiply(3.14, 2.0) << std::endl; // OK: double 是 floating_point
    std::cout << square(5) << std::endl;           // OK: int 是 arithmetic
    std::cout << sum(10, 20) << std::endl;         // OK: int 支持 +

    // add(3.14, 2.0);  // 错误: double 不是 integral

    return 0;
}
```

### 自定义 Concepts

```cpp
#include <iostream>
#include <concepts>
#include <vector>

// 定义自己的 concept
template<typename T>
concept Printable = requires(T value) {
    { std::cout << value } -> std::same_as<std::ostream&>;
};

template<typename T>
concept Container = requires(T c) {
    typename T::value_type;
    { c.begin() } -> std::same_as<typename T::iterator>;
    { c.end() } -> std::same_as<typename T::iterator>;
    { c.size() } -> std::convertible_to<std::size_t>;
};

template<typename T>
concept Comparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
    { a > b } -> std::convertible_to<bool>;
    { a == b } -> std::convertible_to<bool>;
};

// 使用自定义 concept
template<Printable T>
void print(const T& value) {
    std::cout << value << std::endl;
}

template<Container C>
void printContainer(const C& container) {
    std::cout << "Container size: " << container.size() << std::endl;
    for (const auto& item : container) {
        std::cout << item << " ";
    }
    std::cout << std::endl;
}

template<Comparable T>
T max(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    print(42);
    print("Hello");
    print(3.14);

    std::vector<int> vec = {1, 2, 3, 4, 5};
    printContainer(vec);

    std::cout << "Max: " << max(10, 20) << std::endl;

    return 0;
}
```

### 复杂的 Concept 组合

```cpp
#include <iostream>
#include <concepts>

// 组合多个 concepts
template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template<typename T>
concept Incrementable = requires(T x) {
    { ++x } -> std::same_as<T&>;
    { x++ } -> std::same_as<T>;
};

template<typename T>
concept Iterator = requires(T it) {
    { *it };
    { ++it } -> std::same_as<T&>;
    { it != it } -> std::convertible_to<bool>;
};

// 使用 requires 子句
template<typename T>
requires Numeric<T> && Incrementable<T>
void increment(T& value) {
    ++value;
    std::cout << "Incremented to: " << value << std::endl;
}

// concept 的多种约束形式
template<typename T>
concept Sortable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
} && std::copyable<T>;

template<Sortable T>
class SortedContainer {
private:
    std::vector<T> data;

public:
    void insert(const T& value) {
        auto it = std::lower_bound(data.begin(), data.end(), value);
        data.insert(it, value);
    }

    void print() const {
        for (const auto& item : data) {
            std::cout << item << " ";
        }
        std::cout << std::endl;
    }
};

int main() {
    int x = 10;
    increment(x);

    SortedContainer<int> container;
    container.insert(5);
    container.insert(2);
    container.insert(8);
    container.insert(1);
    container.print();

    return 0;
}
```

## 模板元编程

模板元编程允许在编译期进行计算和类型操作。

### 编译期计算

```cpp
#include <iostream>

// 编译期斐波那契数列
template<int N>
struct Fibonacci {
    static constexpr int value = Fibonacci<N-1>::value + Fibonacci<N-2>::value;
};

template<>
struct Fibonacci<0> {
    static constexpr int value = 0;
};

template<>
struct Fibonacci<1> {
    static constexpr int value = 1;
};

// 编译期判断质数
template<int N, int D = N - 1>
struct IsPrime {
    static constexpr bool value = (N % D != 0) && IsPrime<N, D - 1>::value;
};

template<int N>
struct IsPrime<N, 1> {
    static constexpr bool value = true;
};

template<>
struct IsPrime<1, 0> {
    static constexpr bool value = false;
};

// 编译期最大公约数
template<int A, int B>
struct GCD {
    static constexpr int value = GCD<B, A % B>::value;
};

template<int A>
struct GCD<A, 0> {
    static constexpr int value = A;
};

int main() {
    std::cout << "Fibonacci(10): " << Fibonacci<10>::value << std::endl;
    std::cout << "Is 17 prime? " << IsPrime<17>::value << std::endl;
    std::cout << "Is 18 prime? " << IsPrime<18>::value << std::endl;
    std::cout << "GCD(48, 18): " << GCD<48, 18>::value << std::endl;

    return 0;
}
```

### 类型操作

```cpp
#include <iostream>
#include <type_traits>

// 移除指针
template<typename T>
struct RemovePointer {
    using type = T;
};

template<typename T>
struct RemovePointer<T*> {
    using type = T;
};

// 类型列表
template<typename... Types>
struct TypeList {};

// 获取类型列表长度
template<typename List>
struct Length;

template<typename... Types>
struct Length<TypeList<Types...>> {
    static constexpr std::size_t value = sizeof...(Types);
};

// 获取类型列表第 N 个类型
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

// 条件类型选择
template<bool Condition, typename TrueType, typename FalseType>
struct Conditional {
    using type = TrueType;
};

template<typename TrueType, typename FalseType>
struct Conditional<false, TrueType, FalseType> {
    using type = FalseType;
};

int main() {
    using IntPtr = int*;
    using PlainInt = RemovePointer<IntPtr>::type;
    std::cout << "Same type: " << std::is_same_v<PlainInt, int> << std::endl;

    using MyTypes = TypeList<int, double, char, std::string>;
    std::cout << "Length: " << Length<MyTypes>::value << std::endl;

    using SecondType = TypeAt<1, MyTypes>::type;
    std::cout << "Second type is double: "
              << std::is_same_v<SecondType, double> << std::endl;

    using Result = Conditional<true, int, double>::type;
    std::cout << "Result is int: " << std::is_same_v<Result, int> << std::endl;

    return 0;
}
```

### 编译期多态

```cpp
#include <iostream>
#include <string>

// 策略模式的编译期实现
template<typename SortStrategy>
class Sorter {
public:
    template<typename Container>
    static void sort(Container& container) {
        SortStrategy::sort(container);
    }
};

struct BubbleSort {
    template<typename Container>
    static void sort(Container& container) {
        std::cout << "Using Bubble Sort" << std::endl;
        // 实现冒泡排序...
        for (size_t i = 0; i < container.size(); ++i) {
            for (size_t j = 0; j < container.size() - i - 1; ++j) {
                if (container[j] > container[j + 1]) {
                    std::swap(container[j], container[j + 1]);
                }
            }
        }
    }
};

struct QuickSort {
    template<typename Container>
    static void sort(Container& container) {
        std::cout << "Using Quick Sort" << std::endl;
        // 使用标准库的快速排序
        std::sort(container.begin(), container.end());
    }
};

// 类型萃取
template<typename T>
struct TypeTraits {
    static constexpr bool isPointer = false;
    static constexpr bool isReference = false;
    static constexpr bool isConst = false;
};

template<typename T>
struct TypeTraits<T*> {
    static constexpr bool isPointer = true;
    static constexpr bool isReference = false;
    static constexpr bool isConst = false;
    using BaseType = T;
};

template<typename T>
struct TypeTraits<T&> {
    static constexpr bool isPointer = false;
    static constexpr bool isReference = true;
    static constexpr bool isConst = false;
    using BaseType = T;
};

template<typename T>
struct TypeTraits<const T> {
    static constexpr bool isPointer = false;
    static constexpr bool isReference = false;
    static constexpr bool isConst = true;
    using BaseType = T;
};

int main() {
    std::vector<int> vec1 = {5, 2, 8, 1, 9};
    std::vector<int> vec2 = {5, 2, 8, 1, 9};

    Sorter<BubbleSort>::sort(vec1);
    Sorter<QuickSort>::sort(vec2);

    std::cout << "int* is pointer: "
              << TypeTraits<int*>::isPointer << std::endl;
    std::cout << "int& is reference: "
              << TypeTraits<int&>::isReference << std::endl;
    std::cout << "const int is const: "
              << TypeTraits<const int>::isConst << std::endl;

    return 0;
}
```

## 最佳实践

### 模板错误处理

```cpp
#include <iostream>
#include <type_traits>
#include <string>

// 使用 static_assert 提供友好的错误信息
template<typename T>
class NumericContainer {
    static_assert(std::is_arithmetic_v<T>,
                  "T must be an arithmetic type (int, float, double, etc.)");
private:
    T value;

public:
    NumericContainer(T v) : value(v) {}

    T getValue() const { return value; }
};

// 使用 concepts 提供更好的错误信息 (C++20)
template<typename T>
concept Serializable = requires(T obj) {
    { obj.serialize() } -> std::convertible_to<std::string>;
};

template<Serializable T>
class Serializer {
public:
    static std::string serialize(const T& obj) {
        return obj.serialize();
    }
};

struct GoodClass {
    std::string serialize() const {
        return "serialized data";
    }
};

int main() {
    NumericContainer<int> container(42);
    std::cout << container.getValue() << std::endl;

    // NumericContainer<std::string> badContainer("hello");  // 编译错误，带有清晰的错误信息

    GoodClass obj;
    std::cout << Serializer<GoodClass>::serialize(obj) << std::endl;

    return 0;
}
```

### 模板性能优化

```cpp
#include <iostream>
#include <vector>
#include <chrono>

// 使用完美转发避免不必要的拷贝
template<typename T>
class Wrapper {
private:
    T data;

public:
    // 完美转发构造函数
    template<typename U>
    Wrapper(U&& value) : data(std::forward<U>(value)) {}

    const T& get() const { return data; }
};

// 使用 constexpr 进行编译期优化
template<typename T>
constexpr T power(T base, unsigned int exp) {
    return (exp == 0) ? 1 : base * power(base, exp - 1);
}

// 避免模板代码膨胀
template<typename T>
class VectorBase {
protected:
    void* data;
    size_t size;

    void commonFunction() {
        // 与类型无关的通用代码
        std::cout << "Common function, size: " << size << std::endl;
    }
};

template<typename T>
class Vector : private VectorBase<T> {
public:
    void typeSpecificFunction() {
        this->commonFunction();
        // 类型相关的代码
    }
};

int main() {
    // 完美转发示例
    std::string s = "Hello";
    Wrapper<std::string> w1(s);              // 拷贝
    Wrapper<std::string> w2(std::move(s));   // 移动
    Wrapper<std::string> w3("World");        // 直接构造

    // 编译期计算
    constexpr int result = power(2, 10);  // 编译期计算
    std::cout << "2^10 = " << result << std::endl;

    Vector<int> vec;
    vec.typeSpecificFunction();

    return 0;
}
```

### 模板可读性

```cpp
#include <iostream>
#include <vector>
#include <type_traits>

// 使用类型别名提高可读性
template<typename T>
using ValueType = typename T::value_type;

template<typename T>
using EnableIfIntegral = std::enable_if_t<std::is_integral_v<T>>;

template<typename T>
using EnableIfFloating = std::enable_if_t<std::is_floating_point_v<T>>;

// 清晰的模板命名
template<typename Container>
void printContainerElements(const Container& container) {
    using ElementType = ValueType<Container>;

    std::cout << "Container elements: ";
    for (const ElementType& elem : container) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;
}

// 使用 requires 子句使意图清晰 (C++20)
template<typename T>
requires std::is_arithmetic_v<T>
auto computeAverage(const std::vector<T>& values) -> double {
    if (values.empty()) return 0.0;

    T sum = 0;
    for (const auto& val : values) {
        sum += val;
    }
    return static_cast<double>(sum) / values.size();
}

// 文档化的模板接口
/**
 * @brief 泛型容器适配器
 * @tparam T 元素类型，必须可拷贝和可比较
 * @tparam Allocator 分配器类型
 */
template<typename T, typename Allocator = std::allocator<T>>
class GenericContainer {
    static_assert(std::is_copy_constructible_v<T>,
                  "T must be copy constructible");
    static_assert(std::is_default_constructible_v<T>,
                  "T must be default constructible");
private:
    std::vector<T, Allocator> data;

public:
    void add(const T& item) { data.push_back(item); }
    size_t size() const { return data.size(); }

    const T& operator[](size_t index) const { return data[index]; }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    printContainerElements(numbers);

    std::cout << "Average: " << computeAverage(numbers) << std::endl;

    GenericContainer<int> container;
    container.add(10);
    container.add(20);
    std::cout << "Container size: " << container.size() << std::endl;

    return 0;
}
```

## 总结

C++ 模板是强大的编译期元编程工具，主要特点包括：

### 核心概念
- **函数模板**：实现类型无关的通用函数
- **类模板**：创建泛型类和数据结构
- **模板特化**：为特定类型提供优化实现
- **可变参数模板**：处理任意数量的模板参数

### 高级特性
- **SFINAE**：基于类型特性的函数重载
- **Concepts (C++20)**：更清晰的模板约束
- **模板元编程**：编译期计算和类型操作
- **折叠表达式 (C++17)**：简化可变参数处理

### 最佳实践建议
1. 使用 `static_assert` 和 `concepts` 提供清晰的错误信息
2. 利用完美转发和移动语义优化性能
3. 使用类型别名提高代码可读性
4. 避免过度使用模板导致代码膨胀
5. 优先使用标准库提供的类型特性和工具
6. 在适当的地方使用 `constexpr` 进行编译期优化

模板是 C++ 中实现泛型编程和零成本抽象的核心机制，掌握模板编程能够编写出高效、可复用且类型安全的代码。
