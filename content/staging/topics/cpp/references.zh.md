---
title: C++ 引用详解
description: 深入理解 C++ 引用，包括左值引用、右值引用、引用折叠和完美转发
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C++
  - 引用
  - 左值
  - 右值
status: imported
origin: old/src/content/docs/cpp/references.zh.md
divergence: 0.21
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 核心概念
  order: 15
  lastUpdated: 2026-01-07
---

引用是 C++ 中最基础也是最重要的概念之一。它提供了一种为变量创建别名的机制，是实现高效参数传递、运算符重载和现代 C++ 移动语义的基石。本文将全面介绍 C++ 引用的各个方面，从基础的左值引用到 C++11 引入的右值引用，以及由此衍生的引用折叠和完美转发技术。

## 左值引用基础

### 什么是左值引用

左值引用（Lvalue Reference）是 C++ 中最基本的引用类型，使用 `&` 符号声明。它本质上是变量的别名，与原变量共享同一块内存。

```cpp
#include <iostream>

int main() {
    int x = 10;
    int& ref = x;  // ref 是 x 的引用（别名）

    std::cout << "x = " << x << std::endl;      // 输出: x = 10
    std::cout << "ref = " << ref << std::endl;  // 输出: ref = 10

    ref = 20;  // 通过引用修改
    std::cout << "x = " << x << std::endl;      // 输出: x = 20

    // 引用和原变量地址相同
    std::cout << "&x = " << &x << std::endl;
    std::cout << "&ref = " << &ref << std::endl;  // 相同地址

    return 0;
}
```

### 引用的特性

引用具有以下几个重要特性：

```cpp
#include <iostream>

int main() {
    int a = 10;
    int b = 20;

    // 1. 引用必须初始化
    // int& ref;  // 错误！引用必须在声明时初始化
    int& ref = a;  // 正确

    // 2. 引用不能重新绑定
    ref = b;  // 这不是重新绑定，而是将 b 的值赋给 a
    std::cout << "a = " << a << std::endl;  // 输出: a = 20

    // 3. 没有引用的引用
    // int& & rref = ref;  // 错误！不存在引用的引用

    // 4. 没有引用数组
    // int& arr[3];  // 错误！不能创建引用数组

    // 5. 可以创建数组的引用
    int arr[3] = {1, 2, 3};
    int (&arrRef)[3] = arr;  // arrRef 是 arr 的引用
    arrRef[0] = 100;
    std::cout << "arr[0] = " << arr[0] << std::endl;  // 输出: 100

    return 0;
}
```

### const 引用

`const` 引用（常量引用）是一种特殊的左值引用，它可以绑定到右值：

```cpp
#include <iostream>
#include <string>

int getValue() {
    return 42;
}

int main() {
    // const 引用可以绑定到右值
    const int& ref1 = 10;         // 绑定到字面量
    const int& ref2 = getValue(); // 绑定到临时对象

    // 原理：编译器创建临时对象，const 引用绑定到该临时对象
    // 等价于：
    // int temp = 10;
    // const int& ref1 = temp;

    // const 引用不能修改绑定的对象
    // ref1 = 20;  // 错误！不能修改 const 引用

    // 非 const 引用不能绑定到右值
    // int& ref3 = 10;  // 错误！

    // const 引用延长临时对象的生命周期
    const std::string& str = std::string("Hello");
    std::cout << str << std::endl;  // 安全，临时对象生命周期被延长

    return 0;
}
```

### 引用作为函数参数

引用最常见的用途是作为函数参数，实现按引用传递：

```cpp
#include <iostream>
#include <vector>
#include <string>

// 1. 传值 - 创建参数副本
void byValue(std::vector<int> vec) {
    vec.push_back(100);
    // 修改的是副本，不影响原对象
}

// 2. 传引用 - 直接操作原对象
void byReference(std::vector<int>& vec) {
    vec.push_back(100);
    // 修改原对象
}

// 3. 传 const 引用 - 避免拷贝，但不能修改
void byConstReference(const std::vector<int>& vec) {
    // vec.push_back(100);  // 错误！不能修改
    std::cout << "Size: " << vec.size() << std::endl;
}

// 交换两个值
void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    std::vector<int> v = {1, 2, 3};

    byValue(v);
    std::cout << "After byValue: " << v.size() << std::endl;  // 3

    byReference(v);
    std::cout << "After byReference: " << v.size() << std::endl;  // 4

    byConstReference(v);  // 不会修改 v

    int x = 10, y = 20;
    swap(x, y);
    std::cout << "x = " << x << ", y = " << y << std::endl;  // x = 20, y = 10

    return 0;
}
```

### 引用作为返回值

函数可以返回引用，允许链式调用和作为左值使用：

```cpp
#include <iostream>
#include <vector>

class Array {
private:
    int data[10];

public:
    Array() {
        for (int i = 0; i < 10; ++i) {
            data[i] = 0;
        }
    }

    // 返回引用，允许修改元素
    int& operator[](int index) {
        return data[index];
    }

    // const 版本，用于 const 对象
    const int& operator[](int index) const {
        return data[index];
    }

    // 返回 *this 的引用，支持链式调用
    Array& setValue(int index, int value) {
        data[index] = value;
        return *this;
    }
};

// 警告：不要返回局部变量的引用！
int& dangerousFunction() {
    int local = 42;
    return local;  // 危险！返回悬空引用
}

// 安全：返回静态变量或参数的引用
int& safeFunction(int& param) {
    return param;  // 安全，返回参数的引用
}

int main() {
    Array arr;

    // 使用返回的引用修改元素
    arr[0] = 100;
    arr[1] = 200;

    // 链式调用
    arr.setValue(2, 300).setValue(3, 400).setValue(4, 500);

    std::cout << "arr[0] = " << arr[0] << std::endl;  // 100
    std::cout << "arr[2] = " << arr[2] << std::endl;  // 300

    return 0;
}
```

## 理解值类别

在深入右值引用之前，我们需要理解 C++ 中的值类别（Value Categories）。

### 左值与右值

```cpp
#include <iostream>

int main() {
    int x = 10;      // x 是左值，10 是右值
    int y = x + 5;   // x + 5 是右值
    int* p = &x;     // 可以取 x 的地址，因为 x 是左值
    // int* q = &(x + 5);  // 错误！不能取右值的地址

    return 0;
}
```

**左值（Lvalue）**的特点：
- 有持久存储位置的表达式
- 可以取地址（使用 `&` 运算符）
- 可以出现在赋值语句的左边
- 例如：变量名、解引用的指针、返回左值引用的函数调用

**右值（Rvalue）**的特点：
- 临时的、即将被销毁的值
- 通常不能取地址
- 只能出现在赋值语句的右边
- 例如：字面量、临时对象、返回非引用类型的函数调用

### C++11 值类别的细分

C++11 将值类别进一步细分为五种：

```
              表达式
             /      \
        glvalue      rvalue
        /    \      /     \
    lvalue   xvalue      prvalue
```

- **lvalue（左值）**：传统意义上的左值
- **prvalue（纯右值）**：传统意义上的右值，如字面量、临时对象
- **xvalue（将亡值）**：即将被移动的对象，如 `std::move(x)` 的返回值
- **glvalue（泛左值）**：lvalue 和 xvalue 的并集
- **rvalue（右值）**：prvalue 和 xvalue 的并集

### 判断值类别

```cpp
#include <iostream>
#include <type_traits>

// 辅助函数判断值类别
template<typename T>
void checkCategory(T&& arg) {
    if constexpr (std::is_lvalue_reference_v<T>) {
        std::cout << "左值" << std::endl;
    } else {
        std::cout << "右值" << std::endl;
    }
}

int getValue() { return 42; }
int& getRef() { static int x = 10; return x; }

int main() {
    int x = 42;
    int& ref = x;

    checkCategory(x);              // 左值
    checkCategory(ref);            // 左值
    checkCategory(42);             // 右值
    checkCategory(x + 1);          // 右值
    checkCategory(getValue());     // 右值
    checkCategory(getRef());       // 左值
    checkCategory(std::move(x));   // 右值（xvalue）

    return 0;
}
```

## 右值引用

### 基本概念

右值引用是 C++11 引入的新特性，使用 `&&` 声明，它只能绑定到右值：

```cpp
#include <iostream>

int main() {
    int x = 10;

    // 左值引用
    int& lref = x;       // 正确：左值引用绑定到左值
    // int& lref2 = 10;  // 错误：左值引用不能绑定到右值

    // 右值引用
    int&& rref = 10;     // 正确：右值引用绑定到右值
    // int&& rref2 = x;  // 错误：右值引用不能绑定到左值

    // const 左值引用的特例
    const int& cref = 10;  // 正确：const 左值引用可以绑定到右值

    // 右值引用可以修改绑定的临时值
    rref = 20;
    std::cout << "rref = " << rref << std::endl;  // 输出: 20

    return 0;
}
```

### 右值引用本身是左值

一个非常重要但容易混淆的概念：右值引用变量本身是左值！

```cpp
#include <iostream>

void process(int& x) { std::cout << "左值版本" << std::endl; }
void process(int&& x) { std::cout << "右值版本" << std::endl; }

int main() {
    int&& rref = 10;

    // rref 是右值引用，但作为表达式，它是左值
    process(rref);   // 调用左值版本！
    process(10);     // 调用右值版本

    // 要想调用右值版本，需要使用 std::move
    process(std::move(rref));  // 调用右值版本

    return 0;
}
```

### 右值引用延长临时对象生命周期

```cpp
#include <iostream>

class Widget {
public:
    Widget() { std::cout << "Widget 构造" << std::endl; }
    ~Widget() { std::cout << "Widget 析构" << std::endl; }
    void use() { std::cout << "使用 Widget" << std::endl; }
};

Widget createWidget() {
    return Widget();
}

int main() {
    std::cout << "=== 开始 ===" << std::endl;

    // 右值引用延长临时对象的生命周期
    Widget&& ref = createWidget();

    std::cout << "=== 临时对象仍然存活 ===" << std::endl;
    ref.use();

    std::cout << "=== 即将离开作用域 ===" << std::endl;
    return 0;
}
// 输出:
// === 开始 ===
// Widget 构造
// === 临时对象仍然存活 ===
// 使用 Widget
// === 即将离开作用域 ===
// Widget 析构
```

### 右值引用与移动语义

右值引用的主要用途是实现移动语义，避免不必要的深拷贝：

```cpp
#include <iostream>
#include <cstring>
#include <utility>

class MyString {
private:
    char* data_;
    size_t size_;

public:
    // 构造函数
    MyString(const char* str = "") {
        size_ = strlen(str);
        data_ = new char[size_ + 1];
        strcpy(data_, str);
        std::cout << "构造: " << data_ << std::endl;
    }

    // 拷贝构造函数
    MyString(const MyString& other) {
        size_ = other.size_;
        data_ = new char[size_ + 1];
        strcpy(data_, other.data_);
        std::cout << "拷贝构造: " << data_ << std::endl;
    }

    // 移动构造函数
    MyString(MyString&& other) noexcept
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
        std::cout << "移动构造: " << data_ << std::endl;
    }

    // 拷贝赋值运算符
    MyString& operator=(const MyString& other) {
        if (this != &other) {
            delete[] data_;
            size_ = other.size_;
            data_ = new char[size_ + 1];
            strcpy(data_, other.data_);
            std::cout << "拷贝赋值: " << data_ << std::endl;
        }
        return *this;
    }

    // 移动赋值运算符
    MyString& operator=(MyString&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
            std::cout << "移动赋值" << std::endl;
        }
        return *this;
    }

    // 析构函数
    ~MyString() {
        std::cout << "析构: " << (data_ ? data_ : "null") << std::endl;
        delete[] data_;
    }

    const char* c_str() const { return data_; }
};

int main() {
    MyString s1("Hello");

    // 拷贝构造
    MyString s2 = s1;

    // 移动构造
    MyString s3 = std::move(s1);

    // s1 现在处于有效但未定义的状态
    std::cout << "s1 被移动后" << std::endl;

    return 0;
}
```

## 引用折叠

### 引用折叠规则

当引用的引用出现时（通过模板或类型别名），C++ 会应用引用折叠规则：

```cpp
// 引用折叠规则：
// T& &   -> T&
// T& &&  -> T&
// T&& &  -> T&
// T&& && -> T&&

// 简单记忆：只有右值引用的右值引用才是右值引用，其他情况都折叠为左值引用
```

### 引用折叠示例

```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void showType() {
    if (std::is_lvalue_reference_v<T>) {
        std::cout << "T 是左值引用" << std::endl;
    } else if (std::is_rvalue_reference_v<T>) {
        std::cout << "T 是右值引用" << std::endl;
    } else {
        std::cout << "T 不是引用" << std::endl;
    }
}

// 使用类型别名演示引用折叠
using LRef = int&;
using RRef = int&&;

int main() {
    // 引用折叠
    using Type1 = LRef&;   // int& & -> int&
    using Type2 = LRef&&;  // int& && -> int&
    using Type3 = RRef&;   // int&& & -> int&
    using Type4 = RRef&&;  // int&& && -> int&&

    showType<Type1>();  // T 是左值引用
    showType<Type2>();  // T 是左值引用
    showType<Type3>();  // T 是左值引用
    showType<Type4>();  // T 是右值引用

    return 0;
}
```

### 模板中的引用折叠

```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void foo(T&& param) {
    std::cout << "T 的类型: ";
    if constexpr (std::is_lvalue_reference_v<T>) {
        std::cout << "左值引用";
    } else {
        std::cout << "非引用";
    }

    std::cout << ", param 的类型: ";
    using ParamType = decltype(param);
    if constexpr (std::is_lvalue_reference_v<ParamType>) {
        std::cout << "左值引用";
    } else if constexpr (std::is_rvalue_reference_v<ParamType>) {
        std::cout << "右值引用";
    }
    std::cout << std::endl;
}

int main() {
    int x = 42;

    foo(x);   // T = int&,  T&& = int& && = int&
    foo(42);  // T = int,   T&& = int&&

    return 0;
}
```

## 转发引用（万能引用）

### 什么是转发引用

当 `T&&` 出现在模板参数推导的上下文中，且 `T` 是被推导的类型时，它是**转发引用**（也称万能引用或通用引用）：

```cpp
#include <iostream>
#include <vector>

// 这是转发引用
template<typename T>
void forwardingRef(T&& param) {
    // param 可以绑定到左值或右值
}

// 这不是转发引用（auto&& 也是转发引用）
void notForwarding(int&& param) {
    // 这只是普通的右值引用
}

int main() {
    int x = 10;

    forwardingRef(x);   // T = int&, param 是左值引用
    forwardingRef(10);  // T = int, param 是右值引用

    // auto&& 也是转发引用
    auto&& ref1 = x;   // ref1 是 int&
    auto&& ref2 = 10;  // ref2 是 int&&

    return 0;
}
```

### 区分转发引用和右值引用

```cpp
// 转发引用的条件：
// 1. 必须是模板参数
// 2. T 必须正在被推导
// 3. 形式必须是 T&&（不能有 const 或其他修饰）

template<typename T>
void foo(T&& x);                    // 转发引用

void bar(int&& x);                  // 右值引用（不是模板）

template<typename T>
void baz(const T&& x);              // 右值引用（有 const）

template<typename T>
void qux(std::vector<T>&& x);       // 右值引用（T 只是 vector 的模板参数）

template<typename T>
class Widget {
public:
    void process(T&& x);            // 右值引用！（T 在类实例化时已确定）

    template<typename U>
    void handle(U&& x);             // 转发引用
};
```

### 转发引用的推导规则

```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void explain(T&& param) {
    std::cout << "传入参数后：" << std::endl;
    std::cout << "  T 是: ";

    if constexpr (std::is_same_v<T, int>) {
        std::cout << "int" << std::endl;
    } else if constexpr (std::is_same_v<T, int&>) {
        std::cout << "int&" << std::endl;
    } else if constexpr (std::is_same_v<T, int&&>) {
        std::cout << "int&&" << std::endl;
    }

    std::cout << "  T&& 折叠为: ";
    using ParamType = T&&;
    if constexpr (std::is_lvalue_reference_v<ParamType>) {
        std::cout << "左值引用" << std::endl;
    } else {
        std::cout << "右值引用" << std::endl;
    }
}

int main() {
    int x = 42;

    std::cout << "explain(x):" << std::endl;
    explain(x);
    // T = int&
    // T&& = int& && = int& (引用折叠)

    std::cout << "\nexplain(42):" << std::endl;
    explain(42);
    // T = int
    // T&& = int&&

    std::cout << "\nexplain(std::move(x)):" << std::endl;
    explain(std::move(x));
    // T = int
    // T&& = int&&

    return 0;
}
```

## 完美转发

### 问题引入

考虑编写一个包装函数，希望它能保持参数的值类别：

```cpp
#include <iostream>

void process(int& x) { std::cout << "处理左值: " << x << std::endl; }
void process(int&& x) { std::cout << "处理右值: " << x << std::endl; }

// 尝试 1：按值传递
template<typename T>
void wrapper1(T arg) {
    process(arg);  // arg 总是左值！
}

// 尝试 2：按引用传递
template<typename T>
void wrapper2(T& arg) {
    process(arg);  // arg 总是左值！
}

int main() {
    int x = 10;

    std::cout << "wrapper1:" << std::endl;
    wrapper1(x);   // 期望：左值
    wrapper1(10);  // 期望：右值，但实际调用左值版本

    std::cout << "\nwrapper2:" << std::endl;
    wrapper2(x);   // 期望：左值
    // wrapper2(10);  // 编译错误！

    return 0;
}
```

### std::forward 实现完美转发

`std::forward` 配合转发引用可以实现完美转发：

```cpp
#include <iostream>
#include <utility>

void process(int& x) { std::cout << "处理左值: " << x << std::endl; }
void process(int&& x) { std::cout << "处理右值: " << x << std::endl; }

template<typename T>
void perfectWrapper(T&& arg) {
    // std::forward<T>(arg) 保持 arg 的原始值类别
    process(std::forward<T>(arg));
}

int main() {
    int x = 10;

    perfectWrapper(x);              // 调用 process(int&)
    perfectWrapper(10);             // 调用 process(int&&)
    perfectWrapper(std::move(x));   // 调用 process(int&&)

    return 0;
}
```

### std::forward 的工作原理

```cpp
// 简化的 std::forward 实现
template<typename T>
T&& forward(typename std::remove_reference<T>::type& arg) noexcept {
    return static_cast<T&&>(arg);
}

// 当 T = int& 时（传入左值）：
// forward<int&>(arg) 返回 static_cast<int& &&>(arg) = static_cast<int&>(arg)
// 结果是左值引用

// 当 T = int 时（传入右值）：
// forward<int>(arg) 返回 static_cast<int&&>(arg)
// 结果是右值引用
```

### 完美转发的实际应用

#### 工厂函数

```cpp
#include <memory>
#include <utility>
#include <iostream>

class Widget {
public:
    Widget(int a, const std::string& b) {
        std::cout << "Widget(" << a << ", " << b << ")" << std::endl;
    }

    Widget(int a, std::string&& b) {
        std::cout << "Widget(" << a << ", move(" << b << "))" << std::endl;
    }
};

// 使用完美转发的工厂函数
template<typename T, typename... Args>
std::unique_ptr<T> makeUnique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

int main() {
    std::string str = "Hello";

    auto w1 = makeUnique<Widget>(42, str);            // 调用 const string& 版本
    auto w2 = makeUnique<Widget>(42, "World");        // 调用 string&& 版本
    auto w3 = makeUnique<Widget>(42, std::move(str)); // 调用 string&& 版本

    return 0;
}
```

#### 包装器函数

```cpp
#include <iostream>
#include <utility>
#include <chrono>
#include <string>

// 通用的计时包装器
template<typename Func, typename... Args>
auto timeIt(Func&& func, Args&&... args)
    -> decltype(std::forward<Func>(func)(std::forward<Args>(args)...))
{
    auto start = std::chrono::high_resolution_clock::now();
    auto result = std::forward<Func>(func)(std::forward<Args>(args)...);
    auto end = std::chrono::high_resolution_clock::now();

    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    std::cout << "执行时间: " << duration.count() << " 微秒" << std::endl;

    return result;
}

int add(int a, int b) { return a + b; }

int main() {
    auto result = timeIt(add, 3, 4);
    std::cout << "结果: " << result << std::endl;

    // 也支持 lambda
    auto lambda = [](const std::string& s) { return s.size(); };
    auto len = timeIt(lambda, std::string("Hello, World!"));
    std::cout << "字符串长度: " << len << std::endl;

    return 0;
}
```

#### emplace 系列函数

```cpp
#include <vector>
#include <string>
#include <iostream>

class Person {
public:
    std::string name;
    int age;

    Person(const std::string& n, int a) : name(n), age(a) {
        std::cout << "Person 构造(拷贝): " << name << std::endl;
    }

    Person(std::string&& n, int a) : name(std::move(n)), age(a) {
        std::cout << "Person 构造(移动): " << name << std::endl;
    }
};

int main() {
    std::vector<Person> people;
    people.reserve(3);

    std::string name = "Alice";

    // push_back 需要先构造对象
    people.push_back(Person(name, 25));         // 拷贝构造 + 可能的移动
    people.push_back(Person("Bob", 30));        // 移动构造 + 可能的移动

    // emplace_back 使用完美转发，直接在容器内构造
    people.emplace_back(std::move(name), 35);   // 直接移动构造

    return 0;
}
```

## 引用与指针的对比

### 语法差异

```cpp
#include <iostream>

int main() {
    int x = 10;
    int y = 20;

    // 指针
    int* ptr = &x;      // 需要取地址
    *ptr = 15;          // 需要解引用
    ptr = &y;           // 可以重新指向其他对象
    ptr = nullptr;      // 可以为空

    // 引用
    int& ref = x;       // 直接初始化，不需要取地址
    ref = 15;           // 直接使用，不需要解引用
    // ref = y;         // 这是赋值，不是重新绑定！
    // 引用不能为空，必须初始化

    // 指针的指针
    int** pptr = &ptr;  // 合法

    // 引用的引用（直接声明不合法，但通过模板/别名可以产生）
    // int& & rref;     // 非法

    return 0;
}
```

### 内存模型

```cpp
#include <iostream>

int main() {
    int x = 10;
    int& ref = x;
    int* ptr = &x;

    // 引用没有自己的存储空间（从语义上）
    // 实际上编译器可能用指针实现引用

    std::cout << "sizeof(x) = " << sizeof(x) << std::endl;      // 4
    std::cout << "sizeof(ref) = " << sizeof(ref) << std::endl;  // 4（x 的大小）
    std::cout << "sizeof(ptr) = " << sizeof(ptr) << std::endl;  // 8（64位系统）

    // 地址比较
    std::cout << "&x = " << &x << std::endl;
    std::cout << "&ref = " << &ref << std::endl;  // 与 &x 相同
    std::cout << "&ptr = " << &ptr << std::endl;  // ptr 自己的地址

    return 0;
}
```

### 使用场景对比

```cpp
#include <iostream>
#include <memory>

// 1. 可选参数：使用指针
void processOptional(int* data) {
    if (data) {
        std::cout << "处理: " << *data << std::endl;
    } else {
        std::cout << "无数据" << std::endl;
    }
}

// 2. 必须的参数：使用引用
void processRequired(int& data) {
    std::cout << "处理: " << data << std::endl;
}

// 3. 需要重新绑定：使用指针
class Iterator {
    int* current_;
public:
    Iterator(int* start) : current_(start) {}
    Iterator& operator++() {
        ++current_;
        return *this;
    }
    int& operator*() { return *current_; }
};

// 4. 实现运算符重载：使用引用
class Counter {
    int value_;
public:
    Counter(int v) : value_(v) {}

    // 返回引用支持链式调用
    Counter& operator++() {
        ++value_;
        return *this;
    }

    // 拷贝赋值运算符
    Counter& operator=(const Counter& other) {
        value_ = other.value_;
        return *this;
    }

    int getValue() const { return value_; }
};

// 5. 多态：都可以
class Base {
public:
    virtual void speak() { std::cout << "Base" << std::endl; }
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void speak() override { std::cout << "Derived" << std::endl; }
};

void polyWithPointer(Base* b) { b->speak(); }
void polyWithReference(Base& b) { b.speak(); }

int main() {
    int x = 10;

    processOptional(&x);
    processOptional(nullptr);
    processRequired(x);

    Counter c(0);
    ++++c;  // 链式调用
    std::cout << "Counter: " << c.getValue() << std::endl;

    Derived d;
    polyWithPointer(&d);
    polyWithReference(d);

    return 0;
}
```

### 何时选择引用，何时选择指针

| 场景 | 推荐 | 原因 |
|------|------|------|
| 函数参数（必须存在） | 引用 | 语法简洁，无需空指针检查 |
| 函数参数（可选） | 指针或 `std::optional` | 可以传递 `nullptr` |
| 返回容器元素 | 引用 | 避免拷贝 |
| 需要重新指向 | 指针 | 引用不能重新绑定 |
| 运算符重载 | 引用 | 语法要求 |
| 动态内存管理 | 智能指针 | 自动内存管理 |
| 实现数据结构 | 指针 | 需要空值和重新绑定 |

## 高级话题

### 引用限定符

C++11 允许根据对象的值类别来重载成员函数：

```cpp
#include <iostream>
#include <vector>
#include <utility>

class DataHolder {
    std::vector<int> data_;

public:
    DataHolder() : data_{1, 2, 3, 4, 5} {}

    // 对于左值对象，返回 const 引用（避免拷贝）
    const std::vector<int>& getData() const & {
        std::cout << "返回 const 引用" << std::endl;
        return data_;
    }

    // 对于右值对象，返回移动后的值
    std::vector<int> getData() && {
        std::cout << "返回移动后的值" << std::endl;
        return std::move(data_);
    }
};

DataHolder createHolder() {
    return DataHolder();
}

int main() {
    DataHolder holder;

    // holder 是左值，调用 const& 版本
    auto data1 = holder.getData();

    // 临时对象是右值，调用 && 版本
    auto data2 = createHolder().getData();

    // 显式移动后调用 && 版本
    auto data3 = std::move(holder).getData();

    return 0;
}
```

### 悬空引用问题

```cpp
#include <iostream>
#include <string>

// 危险：返回局部变量的引用
std::string& dangerous() {
    std::string local = "Hello";
    return local;  // 警告：返回局部变量的引用
}

// 危险：返回临时对象成员的引用
class Wrapper {
public:
    std::string str;
    Wrapper(const std::string& s) : str(s) {}
};

const std::string& alsoDANGEROUS() {
    return Wrapper("Hello").str;  // Wrapper 是临时对象，立即被销毁
}

// 安全的做法
class Safe {
    std::string data_;
public:
    Safe(const std::string& s) : data_(s) {}

    // 返回成员的引用是安全的（只要对象存活）
    const std::string& getData() const { return data_; }

    // 返回参数的引用是安全的
    static const std::string& identity(const std::string& s) { return s; }
};

int main() {
    // 以下代码存在悬空引用风险
    // std::string& ref = dangerous();
    // const std::string& ref2 = alsoDangerous();

    // 安全的用法
    Safe safe("Hello");
    const std::string& ref = safe.getData();
    std::cout << ref << std::endl;

    return 0;
}
```

### 引用与生命周期

```cpp
#include <iostream>
#include <vector>

class Observer {
public:
    virtual void notify() = 0;
    virtual ~Observer() = default;
};

class Subject {
    std::vector<Observer*> observers_;  // 使用指针，因为可能为空

public:
    void addObserver(Observer& obs) {  // 参数使用引用，表示必须存在
        observers_.push_back(&obs);
    }

    void notifyAll() {
        for (auto* obs : observers_) {
            obs->notify();
        }
    }
};

class ConcreteObserver : public Observer {
    std::string name_;
public:
    ConcreteObserver(const std::string& name) : name_(name) {}
    void notify() override {
        std::cout << name_ << " 收到通知" << std::endl;
    }
};

int main() {
    Subject subject;

    ConcreteObserver obs1("Observer1");
    ConcreteObserver obs2("Observer2");

    subject.addObserver(obs1);
    subject.addObserver(obs2);

    subject.notifyAll();

    // 注意：如果 obs1 或 obs2 被销毁，subject 中的指针会悬空
    // 在实际应用中需要考虑生命周期管理

    return 0;
}
```

## 最佳实践总结

### 选择合适的引用类型

```cpp
// 输入参数：使用 const 引用
void process(const std::string& input);

// 输出参数：使用引用
void getResult(int& output);

// 输入/输出参数：使用引用
void modify(std::string& data);

// 移动语义：使用右值引用
void takeOwnership(std::unique_ptr<Widget>&& ptr);

// 完美转发：使用转发引用
template<typename T>
void forward(T&& arg);
```

### 避免常见陷阱

```cpp
// 陷阱 1：返回局部变量的引用
// 错误：
// int& bad() { int x = 10; return x; }

// 陷阱 2：混淆右值引用和转发引用
template<typename T>
void foo(T&& x);     // 转发引用
void bar(int&& x);   // 右值引用

// 陷阱 3：忘记 std::forward
template<typename T>
void wrapper(T&& arg) {
    // 错误：process(arg);  // arg 总是左值
    process(std::forward<T>(arg));  // 正确
}

// 陷阱 4：移动 const 对象
const std::string str = "Hello";
// std::move(str) 返回 const std::string&&，实际会调用拷贝构造
```

### 遵循的原则

1. **优先使用 const 引用**作为函数输入参数
2. **使用右值引用**实现移动构造函数和移动赋值运算符
3. **使用 std::forward**进行完美转发
4. **不要返回局部变量的引用**
5. **区分转发引用和右值引用**
6. **移动操作声明为 noexcept**
7. **引用不能为空，指针可以**
8. **需要可选参数时使用指针或 `std::optional`**

## 总结

C++ 引用是一个功能强大的特性，理解它对于编写高效、安全的 C++ 代码至关重要。

| 引用类型 | 语法 | 用途 |
|----------|------|------|
| 左值引用 | `T&` | 别名、函数参数、返回值 |
| const 左值引用 | `const T&` | 只读参数、绑定临时对象 |
| 右值引用 | `T&&` | 移动语义、资源转移 |
| 转发引用 | `T&&`（模板） | 完美转发 |

关键要点：

1. **左值引用**是变量的别名，必须初始化且不能重新绑定
2. **const 左值引用**可以绑定到右值，延长临时对象生命周期
3. **右值引用**只能绑定到右值，是实现移动语义的基础
4. **引用折叠**规则使得完美转发成为可能
5. **转发引用**结合 `std::forward` 实现参数的完美转发
6. 引用和指针各有适用场景，选择取决于具体需求

掌握 C++ 引用是理解现代 C++ 的关键。引用与移动语义、智能指针一起，构成了现代 C++ 高效资源管理的基础。在实践中，应根据具体场景选择合适的引用类型，遵循最佳实践，避免常见陷阱。
