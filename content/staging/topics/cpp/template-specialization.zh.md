---
title: C++ 模板特化
description: 深入理解 C++ 模板特化：全特化、偏特化、函数模板与类模板特化、SFINAE 与编译期条件选择
track: cpp
section: templates-generic
difficulty: advanced
tags:
  - C++
  - 模板特化
  - 全特化
  - 偏特化
  - SFINAE
  - 泛型编程
status: imported
origin: old/src/content/docs/cpp/template-specialization.zh.md
divergence: 0.2
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 模板
  order: 5
  lastUpdated: 2026-01-07
---

模板特化是 C++ 泛型编程中最强大的技术之一，它允许我们为特定类型或类型模式提供专门的实现，在保持泛型代码通用性的同时，针对特定场景进行优化或提供特殊行为。

## 概念解释

### 什么是模板特化？

模板特化（Template Specialization）是指为模板的某些特定类型参数提供专门实现的机制。当编译器遇到模板实例化时，会优先选择最匹配的特化版本，如果没有匹配的特化，则使用主模板（Primary Template）。

模板特化解决了一个核心问题：**泛型代码不可能对所有类型都采用相同的实现方式**。例如：

- `std::vector<bool>` 需要特殊的位压缩存储
- 指针类型可能需要额外的空指针检查
- C 风格字符串（`const char*`）比较需要使用 `strcmp` 而非 `==`

### 特化的分类

C++ 模板特化分为两大类：

1. **全特化（Full Specialization / Explicit Specialization）**：为所有模板参数指定具体类型
2. **偏特化（Partial Specialization）**：只为部分模板参数或参数的某些特性指定类型

```cpp
// 主模板
template<typename T, typename U>
struct Pair { /* 通用实现 */ };

// 全特化：完全指定所有类型参数
template<>
struct Pair<int, int> { /* int, int 的特殊实现 */ };

// 偏特化：只指定部分参数或参数特性
template<typename T>
struct Pair<T, T> { /* 两个相同类型的特殊实现 */ };

template<typename T, typename U>
struct Pair<T*, U*> { /* 指针类型的特殊实现 */ };
```

## 核心原理

### 模板匹配规则

编译器在选择模板版本时遵循**最特化匹配原则**（Most Specialized Match）：

1. 首先查找完全匹配的全特化版本
2. 然后查找匹配的偏特化版本
3. 最后使用主模板

```cpp
#include <iostream>

// 主模板
template<typename T>
struct TypeInfo {
    static void print() {
        std::cout << "Primary template: unknown type" << std::endl;
    }
};

// 全特化：int
template<>
struct TypeInfo<int> {
    static void print() {
        std::cout << "Full specialization: int" << std::endl;
    }
};

// 偏特化：指针类型
template<typename T>
struct TypeInfo<T*> {
    static void print() {
        std::cout << "Partial specialization: pointer to T" << std::endl;
    }
};

// 全特化：int*（比偏特化更具体）
template<>
struct TypeInfo<int*> {
    static void print() {
        std::cout << "Full specialization: int*" << std::endl;
    }
};

int main() {
    TypeInfo<double>::print();  // Primary template: unknown type
    TypeInfo<int>::print();     // Full specialization: int
    TypeInfo<char*>::print();   // Partial specialization: pointer to T
    TypeInfo<int*>::print();    // Full specialization: int*
    return 0;
}
```

### 特化的实例化时机

模板特化在**编译期**进行选择和实例化。编译器会：

1. 解析模板声明和定义
2. 在使用点进行类型推导
3. 根据推导结果选择最匹配的特化
4. 实例化选中的模板版本

这个过程完全在编译期完成，不会产生运行时开销。

## 核心要点

### 类模板全特化

类模板全特化需要为所有模板参数指定具体类型：

```cpp
#include <iostream>
#include <cstring>

// 主模板：通用比较器
template<typename T>
class Comparator {
public:
    static bool equal(const T& a, const T& b) {
        return a == b;
    }

    static bool less(const T& a, const T& b) {
        return a < b;
    }
};

// 全特化：const char* 比较器
template<>
class Comparator<const char*> {
public:
    static bool equal(const char* a, const char* b) {
        return std::strcmp(a, b) == 0;
    }

    static bool less(const char* a, const char* b) {
        return std::strcmp(a, b) < 0;
    }
};

// 全特化：bool 比较器
template<>
class Comparator<bool> {
public:
    static bool equal(bool a, bool b) {
        return a == b;
    }

    static bool less(bool a, bool b) {
        // false < true
        return !a && b;
    }

    // 额外功能：转换为字符串
    static const char* toString(bool value) {
        return value ? "true" : "false";
    }
};

int main() {
    // 使用主模板
    std::cout << Comparator<int>::equal(5, 5) << std::endl;  // 1

    // 使用 const char* 特化
    std::cout << Comparator<const char*>::equal("hello", "hello") << std::endl;  // 1
    std::cout << Comparator<const char*>::less("apple", "banana") << std::endl;  // 1

    // 使用 bool 特化
    std::cout << Comparator<bool>::toString(true) << std::endl;  // true

    return 0;
}
```

### 类模板偏特化

偏特化允许基于类型模式进行特化：

```cpp
#include <iostream>
#include <memory>

// 主模板
template<typename T, typename U>
struct Storage {
    T first;
    U second;

    void describe() const {
        std::cout << "Generic storage for two different types" << std::endl;
    }
};

// 偏特化 1：两个相同类型
template<typename T>
struct Storage<T, T> {
    T first;
    T second;

    void describe() const {
        std::cout << "Storage for two same types" << std::endl;
    }

    // 额外功能：交换两个值
    void swap() {
        std::swap(first, second);
    }
};

// 偏特化 2：第一个参数是指针
template<typename T, typename U>
struct Storage<T*, U> {
    T* first;
    U second;

    void describe() const {
        std::cout << "Storage with pointer as first element" << std::endl;
    }

    // 额外功能：解引用
    T& deref() const {
        return *first;
    }
};

// 偏特化 3：两个参数都是指针
template<typename T, typename U>
struct Storage<T*, U*> {
    T* first;
    U* second;

    void describe() const {
        std::cout << "Storage for two pointers" << std::endl;
    }

    bool bothValid() const {
        return first != nullptr && second != nullptr;
    }
};

// 偏特化 4：智能指针
template<typename T, typename U>
struct Storage<std::shared_ptr<T>, std::shared_ptr<U>> {
    std::shared_ptr<T> first;
    std::shared_ptr<U> second;

    void describe() const {
        std::cout << "Storage for two shared_ptr" << std::endl;
    }

    long totalUseCount() const {
        return first.use_count() + second.use_count();
    }
};

int main() {
    Storage<int, double> s1;
    s1.describe();  // Generic storage for two different types

    Storage<int, int> s2;
    s2.describe();  // Storage for two same types

    int x = 10;
    Storage<int*, double> s3{&x, 3.14};
    s3.describe();  // Storage with pointer as first element

    int y = 20;
    Storage<int*, int*> s4{&x, &y};
    s4.describe();  // Storage for two pointers

    auto sp1 = std::make_shared<int>(100);
    auto sp2 = std::make_shared<double>(3.14);
    Storage<std::shared_ptr<int>, std::shared_ptr<double>> s5{sp1, sp2};
    s5.describe();  // Storage for two shared_ptr

    return 0;
}
```

### 函数模板特化

函数模板只支持**全特化**，不支持偏特化。但通常推荐使用**函数重载**来代替函数模板特化：

```cpp
#include <iostream>
#include <cstring>
#include <type_traits>

// 主模板
template<typename T>
T maximum(T a, T b) {
    std::cout << "Primary template" << std::endl;
    return (a > b) ? a : b;
}

// 函数模板全特化（不推荐）
template<>
const char* maximum<const char*>(const char* a, const char* b) {
    std::cout << "Full specialization for const char*" << std::endl;
    return (std::strcmp(a, b) > 0) ? a : b;
}

// 更好的方式：函数重载
const char* maximum(const char* a, const char* b) {
    std::cout << "Overload for const char*" << std::endl;
    return (std::strcmp(a, b) > 0) ? a : b;
}

int main() {
    // 调用主模板
    std::cout << maximum(10, 20) << std::endl;

    // 显式调用特化版本
    std::cout << maximum<const char*>("apple", "banana") << std::endl;

    // 调用重载版本（优先于特化）
    std::cout << maximum("apple", "banana") << std::endl;

    return 0;
}
```

**为什么推荐重载而非函数模板特化？**

1. 重载参与正常的重载决议，更符合直觉
2. 特化不参与重载决议，可能导致意外行为
3. 重载可以有不同的返回类型和参数数量

```cpp
#include <iostream>

// 主模板
template<typename T>
void process(T) {
    std::cout << "Primary template" << std::endl;
}

// 针对 T* 的重载
template<typename T>
void process(T*) {
    std::cout << "Overload for pointer" << std::endl;
}

// 针对 int* 的特化（特化的是第一个模板，不是第二个）
template<>
void process<int*>(int*) {
    std::cout << "Specialization for int*" << std::endl;
}

int main() {
    int x = 10;
    int* p = &x;

    process(p);  // 输出: Overload for pointer
                 // 而不是: Specialization for int*

    process<int*>(p);  // 显式指定才会调用特化

    return 0;
}
```

### 成员函数特化

可以单独特化类模板的成员函数，而不是整个类：

```cpp
#include <iostream>
#include <vector>
#include <string>

template<typename T>
class Container {
private:
    std::vector<T> data;

public:
    void add(const T& item) {
        data.push_back(item);
    }

    void print() const {
        std::cout << "Generic print: ";
        for (const auto& item : data) {
            std::cout << item << " ";
        }
        std::cout << std::endl;
    }

    // 通用的 clear 方法
    void clear() {
        data.clear();
    }
};

// 只特化 print 方法，针对 bool 类型
template<>
void Container<bool>::print() const {
    std::cout << "Boolean print: ";
    for (const auto& item : data) {
        std::cout << (item ? "true" : "false") << " ";
    }
    std::cout << std::endl;
}

// 只特化 print 方法，针对 std::string 类型
template<>
void Container<std::string>::print() const {
    std::cout << "String print: [";
    for (size_t i = 0; i < data.size(); ++i) {
        std::cout << "\"" << data[i] << "\"";
        if (i < data.size() - 1) std::cout << ", ";
    }
    std::cout << "]" << std::endl;
}

int main() {
    Container<int> intContainer;
    intContainer.add(1);
    intContainer.add(2);
    intContainer.add(3);
    intContainer.print();  // Generic print: 1 2 3

    Container<bool> boolContainer;
    boolContainer.add(true);
    boolContainer.add(false);
    boolContainer.add(true);
    boolContainer.print();  // Boolean print: true false true

    Container<std::string> stringContainer;
    stringContainer.add("hello");
    stringContainer.add("world");
    stringContainer.print();  // String print: ["hello", "world"]

    return 0;
}
```

## 代码示例

### 类型萃取（Type Traits）实现

类型萃取是模板特化最经典的应用之一：

```cpp
#include <iostream>

// ========== is_same 实现 ==========
template<typename T, typename U>
struct is_same {
    static constexpr bool value = false;
};

template<typename T>
struct is_same<T, T> {
    static constexpr bool value = true;
};

// C++17 风格的辅助变量模板
template<typename T, typename U>
inline constexpr bool is_same_v = is_same<T, U>::value;

// ========== remove_const 实现 ==========
template<typename T>
struct remove_const {
    using type = T;
};

template<typename T>
struct remove_const<const T> {
    using type = T;
};

template<typename T>
using remove_const_t = typename remove_const<T>::type;

// ========== remove_reference 实现 ==========
template<typename T>
struct remove_reference {
    using type = T;
};

template<typename T>
struct remove_reference<T&> {
    using type = T;
};

template<typename T>
struct remove_reference<T&&> {
    using type = T;
};

template<typename T>
using remove_reference_t = typename remove_reference<T>::type;

// ========== is_pointer 实现 ==========
template<typename T>
struct is_pointer {
    static constexpr bool value = false;
};

template<typename T>
struct is_pointer<T*> {
    static constexpr bool value = true;
};

template<typename T>
struct is_pointer<T* const> {
    static constexpr bool value = true;
};

template<typename T>
struct is_pointer<T* volatile> {
    static constexpr bool value = true;
};

template<typename T>
struct is_pointer<T* const volatile> {
    static constexpr bool value = true;
};

template<typename T>
inline constexpr bool is_pointer_v = is_pointer<T>::value;

// ========== is_array 实现 ==========
template<typename T>
struct is_array {
    static constexpr bool value = false;
};

template<typename T>
struct is_array<T[]> {
    static constexpr bool value = true;
};

template<typename T, std::size_t N>
struct is_array<T[N]> {
    static constexpr bool value = true;
};

template<typename T>
inline constexpr bool is_array_v = is_array<T>::value;

// ========== conditional 实现 ==========
template<bool B, typename T, typename F>
struct conditional {
    using type = T;
};

template<typename T, typename F>
struct conditional<false, T, F> {
    using type = F;
};

template<bool B, typename T, typename F>
using conditional_t = typename conditional<B, T, F>::type;

int main() {
    // is_same
    std::cout << "is_same<int, int>: " << is_same_v<int, int> << std::endl;  // 1
    std::cout << "is_same<int, double>: " << is_same_v<int, double> << std::endl;  // 0

    // remove_const
    static_assert(is_same_v<remove_const_t<const int>, int>, "");
    std::cout << "remove_const works correctly" << std::endl;

    // remove_reference
    static_assert(is_same_v<remove_reference_t<int&>, int>, "");
    static_assert(is_same_v<remove_reference_t<int&&>, int>, "");
    std::cout << "remove_reference works correctly" << std::endl;

    // is_pointer
    std::cout << "is_pointer<int*>: " << is_pointer_v<int*> << std::endl;  // 1
    std::cout << "is_pointer<int>: " << is_pointer_v<int> << std::endl;  // 0

    // is_array
    std::cout << "is_array<int[5]>: " << is_array_v<int[5]> << std::endl;  // 1
    std::cout << "is_array<int>: " << is_array_v<int> << std::endl;  // 0

    // conditional
    using ResultType = conditional_t<(sizeof(int) > 4), long long, int>;
    std::cout << "conditional type size: " << sizeof(ResultType) << std::endl;

    return 0;
}
```

### 编译期分派（Tag Dispatching）

使用特化实现基于类型特性的编译期分派：

```cpp
#include <iostream>
#include <iterator>
#include <vector>
#include <list>

// 迭代器类别标签
struct input_iterator_tag {};
struct forward_iterator_tag : input_iterator_tag {};
struct bidirectional_iterator_tag : forward_iterator_tag {};
struct random_access_iterator_tag : bidirectional_iterator_tag {};

// 获取迭代器类别的类型萃取
template<typename Iterator>
struct iterator_traits {
    using iterator_category = typename Iterator::iterator_category;
};

// 指针类型的特化
template<typename T>
struct iterator_traits<T*> {
    using iterator_category = random_access_iterator_tag;
};

// advance 的实现
template<typename Iterator, typename Distance>
void advance_impl(Iterator& it, Distance n, input_iterator_tag) {
    std::cout << "Input iterator advance: one step at a time" << std::endl;
    while (n-- > 0) {
        ++it;
    }
}

template<typename Iterator, typename Distance>
void advance_impl(Iterator& it, Distance n, bidirectional_iterator_tag) {
    std::cout << "Bidirectional iterator advance: can go backward" << std::endl;
    if (n >= 0) {
        while (n-- > 0) ++it;
    } else {
        while (n++ < 0) --it;
    }
}

template<typename Iterator, typename Distance>
void advance_impl(Iterator& it, Distance n, random_access_iterator_tag) {
    std::cout << "Random access iterator advance: direct jump" << std::endl;
    it += n;
}

template<typename Iterator, typename Distance>
void advance(Iterator& it, Distance n) {
    advance_impl(it, n,
                 typename iterator_traits<Iterator>::iterator_category{});
}

int main() {
    // vector 使用随机访问迭代器
    std::vector<int> vec = {1, 2, 3, 4, 5};
    auto vec_it = vec.begin();
    advance(vec_it, 3);
    std::cout << "Vector element: " << *vec_it << std::endl;  // 4

    // list 使用双向迭代器
    std::list<int> lst = {1, 2, 3, 4, 5};
    auto lst_it = lst.begin();
    advance(lst_it, 3);
    std::cout << "List element: " << *lst_it << std::endl;  // 4

    // 原始指针使用随机访问迭代器
    int arr[] = {1, 2, 3, 4, 5};
    int* ptr = arr;
    advance(ptr, 3);
    std::cout << "Array element: " << *ptr << std::endl;  // 4

    return 0;
}
```

### 智能指针删除器特化

```cpp
#include <iostream>
#include <memory>
#include <cstdio>

// 通用删除器模板
template<typename T>
struct Deleter {
    void operator()(T* ptr) const {
        std::cout << "Default delete for type" << std::endl;
        delete ptr;
    }
};

// 数组类型的偏特化
template<typename T>
struct Deleter<T[]> {
    void operator()(T* ptr) const {
        std::cout << "Array delete" << std::endl;
        delete[] ptr;
    }
};

// FILE* 的全特化
template<>
struct Deleter<FILE> {
    void operator()(FILE* file) const {
        if (file) {
            std::cout << "Closing FILE*" << std::endl;
            std::fclose(file);
        }
    }
};

// 示例：使用特化的删除器
template<typename T>
using UniquePtr = std::unique_ptr<T, Deleter<T>>;

int main() {
    // 普通对象
    {
        UniquePtr<int> ptr(new int(42));
        std::cout << "Value: " << *ptr << std::endl;
    }  // 输出: Default delete for type

    // 数组
    {
        UniquePtr<int[]> arr(new int[5]{1, 2, 3, 4, 5});
        std::cout << "Array[0]: " << arr[0] << std::endl;
    }  // 输出: Array delete

    // 文件句柄
    {
        UniquePtr<FILE> file(std::fopen("/tmp/test.txt", "w"));
        if (file) {
            std::fputs("Hello, World!", file.get());
        }
    }  // 输出: Closing FILE*

    return 0;
}
```

## 最佳实践

### 优先使用偏特化而非函数重载

对于类模板，应该使用偏特化来处理不同的类型模式：

```cpp
// 好的做法：使用类模板偏特化
template<typename T>
struct Processor {
    static void process(const T& value) {
        std::cout << "Generic: " << value << std::endl;
    }
};

template<typename T>
struct Processor<T*> {
    static void process(T* ptr) {
        if (ptr) {
            std::cout << "Pointer: " << *ptr << std::endl;
        } else {
            std::cout << "Null pointer" << std::endl;
        }
    }
};

template<typename T>
struct Processor<std::vector<T>> {
    static void process(const std::vector<T>& vec) {
        std::cout << "Vector of " << vec.size() << " elements" << std::endl;
    }
};
```

### 为特化提供一致的接口

特化版本应该提供与主模板一致的接口：

```cpp
// 主模板定义接口契约
template<typename T>
class Serializer {
public:
    // 接口：serialize 返回字符串，deserialize 返回类型 T
    static std::string serialize(const T& value);
    static T deserialize(const std::string& str);
};

// 特化必须遵循相同的接口
template<>
class Serializer<int> {
public:
    static std::string serialize(const int& value) {
        return std::to_string(value);
    }

    static int deserialize(const std::string& str) {
        return std::stoi(str);
    }
};

template<>
class Serializer<std::string> {
public:
    static std::string serialize(const std::string& value) {
        return value;  // 字符串直接返回
    }

    static std::string deserialize(const std::string& str) {
        return str;
    }
};
```

### 使用 static_assert 提供清晰的错误信息

```cpp
#include <type_traits>

template<typename T>
class NumericProcessor {
    static_assert(std::is_arithmetic_v<T>,
                  "NumericProcessor requires an arithmetic type (int, float, etc.)");

public:
    static T process(T value) {
        return value * 2;
    }
};

// 更精细的约束
template<typename T>
class IntegerProcessor {
    static_assert(std::is_integral_v<T>,
                  "IntegerProcessor requires an integral type");
    static_assert(!std::is_same_v<T, bool>,
                  "IntegerProcessor does not support bool");

public:
    static T factorial(T n) {
        T result = 1;
        for (T i = 2; i <= n; ++i) {
            result *= i;
        }
        return result;
    }
};
```

### 组织特化代码的文件结构

对于大型项目，推荐的文件组织方式：

```
include/
  mylib/
    container.hpp           # 主模板声明
    container_fwd.hpp       # 前向声明
    detail/
      container_impl.hpp    # 主模板实现
      container_spec.hpp    # 特化实现
```

## 常见陷阱

### 特化声明的顺序问题

特化必须在使用之前声明，否则编译器会使用主模板：

```cpp
#include <iostream>

template<typename T>
void foo(T) {
    std::cout << "Primary" << std::endl;
}

void test() {
    foo(42);  // 此时特化还未声明，使用主模板
}

// 特化在使用之后声明
template<>
void foo<int>(int) {
    std::cout << "Specialized" << std::endl;
}

int main() {
    test();    // 输出: Primary（不是期望的结果）
    foo(42);   // 输出: Specialized（特化现在可见）
    return 0;
}
```

**解决方案**：在头文件中将所有特化声明放在主模板之后、使用之前。

### 函数模板特化与重载的混淆

```cpp
#include <iostream>

// 主模板
template<typename T>
void print(T value) {
    std::cout << "Template: " << value << std::endl;
}

// 重载（不是特化！）
void print(int value) {
    std::cout << "Overload: " << value << std::endl;
}

// 特化
template<>
void print<int>(int value) {
    std::cout << "Specialization: " << value << std::endl;
}

int main() {
    print(42);       // 输出: Overload（重载优先于模板）
    print<>(42);     // 输出: Specialization（显式指定模板）
    print<int>(42);  // 输出: Specialization（显式指定类型）

    return 0;
}
```

### 偏特化的歧义

```cpp
// 两个偏特化可能产生歧义
template<typename T, typename U>
struct Pair {};

template<typename T>
struct Pair<T, T> {};  // 相同类型

template<typename T>
struct Pair<T, int> {};  // 第二个是 int

// Pair<int, int> 匹配哪个？两个都匹配！编译错误。

// 解决方案：添加更具体的特化
template<>
struct Pair<int, int> {};  // 全特化解决歧义
```

### 模板特化的 ODR（One Definition Rule）违反

```cpp
// file1.cpp
template<typename T>
struct Config {
    static constexpr int value = 0;
};

template<>
struct Config<int> {
    static constexpr int value = 42;
};

// file2.cpp
template<typename T>
struct Config {
    static constexpr int value = 0;
};

template<>
struct Config<int> {
    static constexpr int value = 100;  // 不同的定义！ODR 违反
};
```

**解决方案**：将特化定义放在头文件中，确保所有翻译单元使用相同的定义。

### 不完整类型的特化

```cpp
// 前向声明
class Incomplete;

// 主模板可以使用不完整类型
template<typename T>
struct Wrapper {
    T* ptr;  // OK：指针不需要完整类型
};

// 但某些特化可能需要完整类型
template<typename T>
struct Wrapper<std::vector<T>> {
    std::vector<T> data;  // 需要 T 是完整类型
};

// Wrapper<std::vector<Incomplete>> w;  // 错误：Incomplete 不完整
```

## 性能考量

### 编译时间影响

模板特化会增加编译时间，因为：

1. 编译器需要匹配最佳特化
2. 每个特化都需要单独实例化

**优化建议**：

```cpp
// 使用显式实例化减少编译时间

// header.hpp
template<typename T>
class HeavyTemplate {
    // 复杂实现...
};

// source.cpp
#include "header.hpp"

// 显式实例化常用类型
template class HeavyTemplate<int>;
template class HeavyTemplate<double>;
template class HeavyTemplate<std::string>;

// main.cpp
#include "header.hpp"

// 声明外部实例化存在
extern template class HeavyTemplate<int>;
extern template class HeavyTemplate<double>;
extern template class HeavyTemplate<std::string>;
```

### 代码膨胀

每个不同的模板实例化都会生成新的代码。使用特化可以减少代码膨胀：

```cpp
// 将类型无关的代码提取到基类
class ContainerBase {
protected:
    void* data;
    size_t size;

    void reallocate(size_t newSize);  // 实现在 .cpp 文件
    void deallocate();                // 实现在 .cpp 文件
};

template<typename T>
class Container : private ContainerBase {
public:
    T& operator[](size_t index) {
        return static_cast<T*>(data)[index];
    }

    void resize(size_t newSize) {
        reallocate(newSize * sizeof(T));  // 调用非模板方法
        size = newSize;
    }
};
```

### 内联与特化

特化函数默认是内联的，这可能影响代码大小：

```cpp
// 头文件中的特化默认内联
template<>
inline void process<int>(int value) {  // inline 是隐式的
    // 大量代码...
}

// 如果不想内联，将定义放在 .cpp 文件
// header.hpp
template<>
void process<int>(int value);

// source.cpp
template<>
void process<int>(int value) {
    // 大量代码，不会被内联
}
```

## 实战场景

### 场景 1：序列化框架

```cpp
#include <iostream>
#include <sstream>
#include <vector>
#include <map>
#include <string>

// 序列化框架
template<typename T>
struct Serializer {
    static std::string serialize(const T& value) {
        std::ostringstream oss;
        oss << value;
        return oss.str();
    }

    static T deserialize(const std::string& str) {
        std::istringstream iss(str);
        T value;
        iss >> value;
        return value;
    }
};

// std::string 特化
template<>
struct Serializer<std::string> {
    static std::string serialize(const std::string& value) {
        return "\"" + value + "\"";
    }

    static std::string deserialize(const std::string& str) {
        if (str.size() >= 2 && str.front() == '"' && str.back() == '"') {
            return str.substr(1, str.size() - 2);
        }
        return str;
    }
};

// std::vector 偏特化
template<typename T>
struct Serializer<std::vector<T>> {
    static std::string serialize(const std::vector<T>& vec) {
        std::ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < vec.size(); ++i) {
            if (i > 0) oss << ", ";
            oss << Serializer<T>::serialize(vec[i]);
        }
        oss << "]";
        return oss.str();
    }
};

// std::map 偏特化
template<typename K, typename V>
struct Serializer<std::map<K, V>> {
    static std::string serialize(const std::map<K, V>& map) {
        std::ostringstream oss;
        oss << "{";
        bool first = true;
        for (const auto& [key, value] : map) {
            if (!first) oss << ", ";
            first = false;
            oss << Serializer<K>::serialize(key) << ": "
                << Serializer<V>::serialize(value);
        }
        oss << "}";
        return oss.str();
    }
};

int main() {
    // 基本类型
    std::cout << Serializer<int>::serialize(42) << std::endl;  // 42
    std::cout << Serializer<double>::serialize(3.14) << std::endl;  // 3.14

    // 字符串
    std::cout << Serializer<std::string>::serialize("hello") << std::endl;  // "hello"

    // 向量
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::cout << Serializer<std::vector<int>>::serialize(vec) << std::endl;
    // [1, 2, 3, 4, 5]

    // 映射
    std::map<std::string, int> map = {{"one", 1}, {"two", 2}};
    std::cout << Serializer<std::map<std::string, int>>::serialize(map) << std::endl;
    // {"one": 1, "two": 2}

    return 0;
}
```

### 场景 2：数学运算库

```cpp
#include <iostream>
#include <cmath>
#include <complex>

// 数学运算模板
template<typename T>
struct MathOps {
    static T abs(T value) {
        return (value < 0) ? -value : value;
    }

    static T sqrt(T value) {
        return std::sqrt(static_cast<double>(value));
    }

    static T zero() {
        return T(0);
    }

    static T one() {
        return T(1);
    }
};

// 复数特化
template<typename T>
struct MathOps<std::complex<T>> {
    using Complex = std::complex<T>;

    static T abs(Complex value) {
        return std::abs(value);
    }

    static Complex sqrt(Complex value) {
        return std::sqrt(value);
    }

    static Complex zero() {
        return Complex(0, 0);
    }

    static Complex one() {
        return Complex(1, 0);
    }

    // 复数特有操作
    static Complex conjugate(Complex value) {
        return std::conj(value);
    }

    static T real(Complex value) {
        return value.real();
    }

    static T imag(Complex value) {
        return value.imag();
    }
};

// 整数特化（避免浮点运算）
template<>
struct MathOps<int> {
    static int abs(int value) {
        return (value < 0) ? -value : value;
    }

    static int sqrt(int value) {
        if (value < 0) return 0;
        int result = 0;
        while ((result + 1) * (result + 1) <= value) {
            ++result;
        }
        return result;
    }

    static int zero() { return 0; }
    static int one() { return 1; }

    // 整数特有操作
    static int gcd(int a, int b) {
        while (b != 0) {
            int t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    static int lcm(int a, int b) {
        return a / gcd(a, b) * b;
    }
};

int main() {
    // 双精度浮点
    std::cout << "double abs(-3.14): " << MathOps<double>::abs(-3.14) << std::endl;
    std::cout << "double sqrt(2): " << MathOps<double>::sqrt(2) << std::endl;

    // 整数
    std::cout << "int sqrt(17): " << MathOps<int>::sqrt(17) << std::endl;  // 4
    std::cout << "int gcd(48, 18): " << MathOps<int>::gcd(48, 18) << std::endl;  // 6

    // 复数
    std::complex<double> c(3, 4);
    std::cout << "complex abs(3+4i): " << MathOps<std::complex<double>>::abs(c) << std::endl;  // 5
    std::cout << "complex conjugate(3+4i): " << MathOps<std::complex<double>>::conjugate(c) << std::endl;  // (3,-4)

    return 0;
}
```

### 场景 3：哈希函数库

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <functional>

// 通用哈希模板
template<typename T>
struct Hash {
    size_t operator()(const T& value) const {
        return std::hash<T>{}(value);
    }
};

// C 风格字符串特化
template<>
struct Hash<const char*> {
    size_t operator()(const char* str) const {
        size_t hash = 5381;
        int c;
        while ((c = *str++)) {
            hash = ((hash << 5) + hash) + c;  // hash * 33 + c
        }
        return hash;
    }
};

// 指针类型偏特化
template<typename T>
struct Hash<T*> {
    size_t operator()(T* ptr) const {
        return reinterpret_cast<size_t>(ptr);
    }
};

// std::pair 偏特化
template<typename T1, typename T2>
struct Hash<std::pair<T1, T2>> {
    size_t operator()(const std::pair<T1, T2>& p) const {
        size_t h1 = Hash<T1>{}(p.first);
        size_t h2 = Hash<T2>{}(p.second);
        // 组合两个哈希值
        return h1 ^ (h2 << 1);
    }
};

// std::vector 偏特化
template<typename T>
struct Hash<std::vector<T>> {
    size_t operator()(const std::vector<T>& vec) const {
        size_t seed = vec.size();
        for (const auto& elem : vec) {
            size_t h = Hash<T>{}(elem);
            seed ^= h + 0x9e3779b9 + (seed << 6) + (seed >> 2);
        }
        return seed;
    }
};

int main() {
    // 基本类型
    std::cout << "Hash of 42: " << Hash<int>{}(42) << std::endl;
    std::cout << "Hash of \"hello\": " << Hash<std::string>{}("hello") << std::endl;

    // C 风格字符串
    std::cout << "Hash of C-string: " << Hash<const char*>{}("hello") << std::endl;

    // pair
    std::pair<int, std::string> p{42, "answer"};
    std::cout << "Hash of pair: " << Hash<std::pair<int, std::string>>{}(p) << std::endl;

    // vector
    std::vector<int> vec{1, 2, 3, 4, 5};
    std::cout << "Hash of vector: " << Hash<std::vector<int>>{}(vec) << std::endl;

    return 0;
}
```

## 面试要点

### 常见面试题

**1. 全特化和偏特化的区别是什么？**

- 全特化：为所有模板参数指定具体类型，使用 `template<>` 语法
- 偏特化：只为部分参数或参数特性（如指针、引用）指定类型
- 函数模板只支持全特化，类模板两者都支持

**2. 为什么函数模板不支持偏特化？**

- 函数模板可以通过重载实现类似偏特化的效果
- 重载决议比偏特化匹配更直观
- 如果允许偏特化，与重载的交互会变得非常复杂

**3. 模板特化的匹配顺序是什么？**

```cpp
// 1. 完全匹配的全特化
// 2. 最佳匹配的偏特化
// 3. 主模板
```

**4. 解释 SFINAE 原则**

SFINAE（Substitution Failure Is Not An Error）：在模板参数替换过程中，如果替换导致无效代码，编译器不会报错，而是简单地忽略该模板，继续尝试其他候选。

**5. 如何实现 enable_if？**

```cpp
template<bool B, typename T = void>
struct enable_if {};

template<typename T>
struct enable_if<true, T> {
    using type = T;
};

template<bool B, typename T = void>
using enable_if_t = typename enable_if<B, T>::type;
```

**6. 特化版本可以有不同的成员吗？**

可以。特化版本可以有完全不同的成员函数、成员变量和继承关系。但为了维护一致的接口，通常建议保持核心接口一致。

### 代码实现题

**实现一个 is_same 类型萃取：**

```cpp
template<typename T, typename U>
struct is_same {
    static constexpr bool value = false;
};

template<typename T>
struct is_same<T, T> {
    static constexpr bool value = true;
};
```

**实现一个 remove_pointer 类型萃取：**

```cpp
template<typename T>
struct remove_pointer {
    using type = T;
};

template<typename T>
struct remove_pointer<T*> {
    using type = T;
};

template<typename T>
struct remove_pointer<T* const> {
    using type = T;
};

template<typename T>
struct remove_pointer<T* volatile> {
    using type = T;
};

template<typename T>
struct remove_pointer<T* const volatile> {
    using type = T;
};
```

## 延伸阅读

### 官方资源

- [cppreference - Template Specialization](https://en.cppreference.com/w/cpp/language/template_specialization)
- [cppreference - Partial Template Specialization](https://en.cppreference.com/w/cpp/language/partial_specialization)
- [C++ Standard (ISO/IEC 14882)](https://isocpp.org/std/the-standard) - 第 14 章 Templates

### 经典书籍

- 《C++ Templates: The Complete Guide》(2nd Edition) - David Vandevoorde, Nicolai M. Josuttis, Douglas Gregor
- 《Modern C++ Design》 - Andrei Alexandrescu
- 《Effective C++》(3rd Edition) - Scott Meyers（条款 41-48）
- 《C++ Primer》(5th Edition) - Stanley B. Lippman（第 16 章）

### 进阶学习

- [Boost.TypeTraits](https://www.boost.org/doc/libs/release/libs/type_traits/) - 类型萃取库
- [Boost.MPL](https://www.boost.org/doc/libs/release/libs/mpl/) - 模板元编程库
- [C++ Core Guidelines - Templates](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-templates)

### 相关工具

- [Compiler Explorer](https://godbolt.org/) - 在线查看模板实例化结果
- [C++ Insights](https://cppinsights.io/) - 查看编译器对模板的展开
- [clang-tidy](https://clang.llvm.org/extra/clang-tidy/) - 模板相关的静态分析

---

模板特化是 C++ 泛型编程的核心技术，它允许我们在保持代码通用性的同时，为特定类型提供优化实现。掌握模板特化需要理解编译器的匹配规则、熟悉常见的特化模式，并在实践中积累经验。建议从简单的类型萃取开始，逐步深入到复杂的模板元编程技术。
