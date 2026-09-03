---
title: 移动语义
description: C++移动语义完全指南，右值引用、std::move与完美转发
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - 移动语义
  - 右值引用
  - 完美转发
status: imported
origin: old/src/content/docs/cpp/move-semantics.zh.md
divergence: 0.195
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 现代C++
  order: 10
  lastUpdated: 2026-01-07
---

移动语义是 C++11 引入的最重要的特性之一，它从根本上改变了 C++ 处理资源管理的方式。通过移动语义，我们可以避免不必要的深拷贝，显著提升程序性能。

## 理解值类别

在深入移动语义之前，我们需要理解 C++ 中的值类别（Value Categories）。

### 左值与右值

```cpp
int x = 10;      // x 是左值，10 是右值
int y = x + 5;   // x + 5 是右值
int* p = &x;     // 可以取 x 的地址，因为 x 是左值
// int* q = &(x + 5);  // 错误！不能取右值的地址
```

**左值（Lvalue）**：
- 有持久存储位置的表达式
- 可以取地址
- 可以出现在赋值语句的左边
- 例如：变量名、解引用的指针、返回左值引用的函数调用

**右值（Rvalue）**：
- 临时的、即将被销毁的值
- 通常不能取地址
- 只能出现在赋值语句的右边
- 例如：字面量、临时对象、返回非引用类型的函数调用

### C++11 的细化分类

C++11 将值类别进一步细分为：

```
        表达式
       /      \
    glvalue   rvalue
    /    \    /    \
lvalue  xvalue    prvalue
```

- **lvalue**：传统左值
- **prvalue**（纯右值）：传统右值，如字面量、临时对象
- **xvalue**（将亡值）：即将被移动的对象，如 `std::move(x)` 的返回值

### 判断值类别的实用方法

```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void check_category(T&& arg) {
    if constexpr (std::is_lvalue_reference_v<T>) {
        std::cout << "左值" << std::endl;
    } else {
        std::cout << "右值" << std::endl;
    }
}

int main() {
    int x = 42;
    check_category(x);           // 输出：左值
    check_category(42);          // 输出：右值
    check_category(std::move(x)); // 输出：右值
    check_category(x + 1);       // 输出：右值
}
```

## 右值引用

### 基本语法

右值引用使用 `&&` 声明，它只能绑定到右值：

```cpp
int x = 10;
int& lref = x;       // 左值引用，绑定到左值
// int& lref2 = 10;  // 错误！左值引用不能绑定到右值

int&& rref = 10;     // 右值引用，绑定到右值
// int&& rref2 = x;  // 错误！右值引用不能绑定到左值

const int& cref = 10; // const 左值引用可以绑定到右值（特例）
```

### 右值引用的特性

右值引用本身是一个左值：

```cpp
void process(int& x) { std::cout << "左值版本\n"; }
void process(int&& x) { std::cout << "右值版本\n"; }

int main() {
    int&& rref = 10;
    process(rref);     // 输出：左值版本！因为 rref 本身是左值
    process(10);       // 输出：右值版本
}
```

这个特性非常重要，理解它对于正确使用移动语义至关重要。

### 右值引用延长临时对象生命周期

```cpp
#include <iostream>

class Widget {
public:
    Widget() { std::cout << "构造\n"; }
    ~Widget() { std::cout << "析构\n"; }
};

Widget createWidget() {
    return Widget();
}

int main() {
    std::cout << "--- 开始 ---\n";
    Widget&& ref = createWidget();  // 临时对象生命周期延长
    std::cout << "--- 临时对象仍然存活 ---\n";
    // ref 离开作用域时，临时对象才被析构
}
// 输出：
// --- 开始 ---
// 构造
// --- 临时对象仍然存活 ---
// 析构
```

## 移动构造函数与移动赋值运算符

### 传统拷贝的问题

考虑一个简单的字符串类：

```cpp
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
        std::cout << "构造: " << data_ << "\n";
    }

    // 拷贝构造函数
    MyString(const MyString& other) {
        size_ = other.size_;
        data_ = new char[size_ + 1];
        strcpy(data_, other.data_);
        std::cout << "拷贝构造: " << data_ << "\n";
    }

    // 析构函数
    ~MyString() {
        std::cout << "析构: " << (data_ ? data_ : "null") << "\n";
        delete[] data_;
    }

    // ... 其他成员函数
};

MyString createString() {
    MyString temp("Hello, World!");
    return temp;  // 可能触发拷贝构造
}

int main() {
    MyString s = createString();  // 潜在的多次拷贝
}
```

在没有移动语义的情况下，返回临时对象可能导致不必要的深拷贝。

### 实现移动构造函数

```cpp
class MyString {
private:
    char* data_;
    size_t size_;

public:
    // ... 其他构造函数

    // 移动构造函数
    MyString(MyString&& other) noexcept
        : data_(other.data_), size_(other.size_) {
        // 接管资源
        other.data_ = nullptr;
        other.size_ = 0;
        std::cout << "移动构造: " << data_ << "\n";
    }

    // 移动赋值运算符
    MyString& operator=(MyString&& other) noexcept {
        std::cout << "移动赋值\n";
        if (this != &other) {
            // 释放当前资源
            delete[] data_;

            // 接管新资源
            data_ = other.data_;
            size_ = other.size_;

            // 置空源对象
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }
};
```

### 移动语义的核心思想

移动操作的本质是**资源的转移**而非复制：

1. 将源对象的资源（如指针）直接转移给目标对象
2. 将源对象置于有效但未定义的状态（通常置空）
3. 避免了深拷贝带来的内存分配和数据复制开销

```cpp
// 拷贝 vs 移动的对比
void demonstrateDifference() {
    MyString original("A very long string that requires heap allocation");

    // 拷贝：分配新内存 + 复制数据
    MyString copy = original;

    // 移动：仅转移指针，O(1) 操作
    MyString moved = std::move(original);
    // original 现在处于有效但未定义状态
}
```

### noexcept 的重要性

移动操作应该声明为 `noexcept`：

```cpp
MyString(MyString&& other) noexcept;
MyString& operator=(MyString&& other) noexcept;
```

原因：
1. 标准库容器（如 `std::vector`）在重新分配内存时，只有当移动构造函数是 `noexcept` 时才会使用移动而非拷贝
2. 这确保了强异常安全保证

```cpp
#include <vector>

class Widget {
public:
    // 不带 noexcept 的移动构造函数
    Widget(Widget&& other) { /* ... */ }
};

class SafeWidget {
public:
    // 带 noexcept 的移动构造函数
    SafeWidget(SafeWidget&& other) noexcept { /* ... */ }
};

int main() {
    std::vector<Widget> vec1;
    vec1.reserve(1);
    vec1.emplace_back();
    vec1.emplace_back();  // 扩容时使用拷贝（慢）

    std::vector<SafeWidget> vec2;
    vec2.reserve(1);
    vec2.emplace_back();
    vec2.emplace_back();  // 扩容时使用移动（快）
}
```

### 验证 noexcept 的影响

```cpp
#include <iostream>
#include <type_traits>

class A {
public:
    A(A&&) {}  // 非 noexcept
};

class B {
public:
    B(B&&) noexcept {}  // noexcept
};

int main() {
    std::cout << std::boolalpha;
    std::cout << "A 可无异常移动: "
              << std::is_nothrow_move_constructible_v<A> << "\n";  // false
    std::cout << "B 可无异常移动: "
              << std::is_nothrow_move_constructible_v<B> << "\n";  // true
}
```

## std::move 详解

### std::move 的本质

`std::move` 并不真正"移动"任何东西，它只是将左值**转换**为右值引用：

```cpp
// 简化的 std::move 实现
template<typename T>
typename std::remove_reference<T>::type&& move(T&& arg) noexcept {
    return static_cast<typename std::remove_reference<T>::type&&>(arg);
}
```

### 理解 std::move 的工作原理

```cpp
#include <iostream>
#include <utility>

void process(int& x) { std::cout << "左值引用版本\n"; }
void process(int&& x) { std::cout << "右值引用版本\n"; }

int main() {
    int x = 42;

    process(x);            // 调用左值引用版本
    process(std::move(x)); // 调用右值引用版本
    // x 的值仍然是 42，std::move 只是类型转换

    std::cout << "x = " << x << "\n";  // 输出：x = 42
}
```

### 正确使用 std::move

```cpp
#include <utility>
#include <vector>
#include <string>

int main() {
    std::string str = "Hello, World!";
    std::vector<std::string> vec;

    // 拷贝 str 到 vector
    vec.push_back(str);
    std::cout << "str after copy: " << str << "\n";  // str 仍然有效

    // 移动 str 到 vector
    vec.push_back(std::move(str));
    std::cout << "str after move: " << str << "\n";  // str 处于有效但未定义状态
}
```

### 常见错误

**错误 1：移动后继续使用对象**

```cpp
std::string str = "Hello";
std::string str2 = std::move(str);
std::cout << str.size();  // 未定义行为！str 已被移动

// 正确做法：移动后重新赋值
str = "New value";
std::cout << str.size();  // 现在可以安全使用
```

**错误 2：对 const 对象使用 std::move**

```cpp
const std::string str = "Hello";
std::string str2 = std::move(str);  // 实际上会调用拷贝构造函数！
// 因为 std::move(str) 返回 const std::string&&
// 它不能绑定到 std::string&& 参数
```

**错误 3：返回局部变量时使用 std::move**

```cpp
std::string createString() {
    std::string result = "Hello";
    return std::move(result);  // 错误！阻止了 RVO 优化
}

// 正确写法
std::string createString() {
    std::string result = "Hello";
    return result;  // 编译器会自动应用 NRVO 或移动语义
}
```

**错误 4：多次移动同一对象**

```cpp
std::string str = "Hello";
std::string a = std::move(str);
std::string b = std::move(str);  // str 已经被移动，这是未定义行为
```

### std::move 的正确使用场景

```cpp
class Container {
    std::vector<int> data_;

public:
    // 1. 将成员变量的所有权转移出去
    std::vector<int> extractData() && {
        return std::move(data_);
    }

    // 2. 在构造函数初始化列表中
    Container(std::vector<int> data) : data_(std::move(data)) {}

    // 3. 将局部变量移入容器
    void process() {
        std::vector<int> temp = {1, 2, 3};
        // 处理 temp...
        data_ = std::move(temp);  // temp 之后不再使用
    }
};
```

## 完美转发

### 问题引入

考虑编写一个包装函数：

```cpp
template<typename T>
void wrapper(T arg) {
    process(arg);
}

void process(int& x) { std::cout << "左值\n"; }
void process(int&& x) { std::cout << "右值\n"; }

int main() {
    int x = 10;
    wrapper(x);    // 我们希望调用 process(int&)
    wrapper(10);   // 我们希望调用 process(int&&)
}
```

问题是，无论传入什么，`arg` 在函数内部都是左值，无法保持原有的值类别。

### 尝试用重载解决

```cpp
// 方案 1：重载（不可扩展）
template<typename T>
void wrapper(T& arg) {
    process(arg);
}

template<typename T>
void wrapper(T&& arg) {
    process(std::move(arg));
}

// 问题：如果有多个参数，重载数量指数级增长
// 2 个参数需要 4 个重载，3 个参数需要 8 个重载...
```

### 转发引用（万能引用）

当 `T&&` 出现在模板参数推导的上下文中时，它是**转发引用**（也称万能引用）：

```cpp
template<typename T>
void wrapper(T&& arg) {  // 这是转发引用，不是右值引用！
    // ...
}
```

转发引用的推导规则：
- 传入左值时，`T` 推导为 `T&`，`T&&` 折叠为 `T&`
- 传入右值时，`T` 推导为 `T`，`T&&` 仍为 `T&&`

```cpp
template<typename T>
void foo(T&& arg);

int x = 42;
foo(x);   // T = int&,  T&& = int& && = int&  (左值引用)
foo(42);  // T = int,   T&& = int&&           (右值引用)
```

### 引用折叠规则

```cpp
T& &   -> T&
T& &&  -> T&
T&& &  -> T&
T&& && -> T&&
```

简单记忆：只有右值引用的右值引用才是右值引用，其他都折叠为左值引用。

### 区分转发引用和右值引用

```cpp
// 转发引用：T 是模板参数，且正在进行类型推导
template<typename T>
void foo(T&& x);           // 转发引用

// 右值引用：不是模板，或 T 已经确定
void bar(int&& x);          // 右值引用

template<typename T>
class Widget {
    void baz(T&& x);        // 右值引用！T 在类实例化时已确定
};

template<typename T>
void qux(std::vector<T>&& x);  // 右值引用！std::vector<T> 不是模板参数
```

### std::forward 实现完美转发

```cpp
template<typename T>
void wrapper(T&& arg) {
    process(std::forward<T>(arg));
}
```

`std::forward` 的实现原理：

```cpp
// 简化的 std::forward 实现
template<typename T>
T&& forward(typename std::remove_reference<T>::type& arg) noexcept {
    return static_cast<T&&>(arg);
}
```

当 `T` 是左值引用类型时，返回左值引用；当 `T` 是非引用类型时，返回右值引用。

### 完整示例

```cpp
#include <iostream>
#include <utility>

void process(int& x) {
    std::cout << "处理左值: " << x << "\n";
}

void process(int&& x) {
    std::cout << "处理右值: " << x << "\n";
}

template<typename T>
void wrapper(T&& arg) {
    std::cout << "wrapper 接收到参数\n";
    process(std::forward<T>(arg));
}

int main() {
    int x = 42;

    wrapper(x);      // 输出：处理左值: 42
    wrapper(100);    // 输出：处理右值: 100
    wrapper(std::move(x));  // 输出：处理右值: 42

    return 0;
}
```

### 可变参数模板中的完美转发

完美转发在工厂函数和包装器中特别有用：

```cpp
#include <memory>
#include <utility>

template<typename T, typename... Args>
std::unique_ptr<T> make_unique(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

class Widget {
public:
    Widget(int a, const std::string& b, double c) {
        std::cout << "构造 Widget: " << a << ", " << b << ", " << c << "\n";
    }
};

int main() {
    auto w = make_unique<Widget>(42, "hello", 3.14);
}
```

### 完美转发的实际应用

```cpp
#include <functional>
#include <utility>

// 通用的日志包装器
template<typename Func, typename... Args>
auto logAndCall(Func&& func, Args&&... args)
    -> decltype(std::forward<Func>(func)(std::forward<Args>(args)...))
{
    std::cout << "调用函数前\n";
    auto result = std::forward<Func>(func)(std::forward<Args>(args)...);
    std::cout << "调用函数后\n";
    return result;
}

int add(int a, int b) { return a + b; }

int main() {
    auto result = logAndCall(add, 3, 4);
    std::cout << "结果: " << result << "\n";

    // 也支持 lambda
    auto lambda = [](const std::string& s) { return s.size(); };
    auto len = logAndCall(lambda, std::string("hello"));
}
```

## 实战案例：智能指针的移动语义

### unique_ptr 的实现要点

`std::unique_ptr` 是移动语义的经典应用：

```cpp
template<typename T>
class UniquePtr {
private:
    T* ptr_;

public:
    // 构造函数
    explicit UniquePtr(T* ptr = nullptr) : ptr_(ptr) {}

    // 禁用拷贝
    UniquePtr(const UniquePtr&) = delete;
    UniquePtr& operator=(const UniquePtr&) = delete;

    // 移动构造
    UniquePtr(UniquePtr&& other) noexcept : ptr_(other.ptr_) {
        other.ptr_ = nullptr;
    }

    // 移动赋值
    UniquePtr& operator=(UniquePtr&& other) noexcept {
        if (this != &other) {
            delete ptr_;
            ptr_ = other.ptr_;
            other.ptr_ = nullptr;
        }
        return *this;
    }

    // 析构函数
    ~UniquePtr() { delete ptr_; }

    // 解引用
    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }
    T* get() const { return ptr_; }

    // 显式布尔转换
    explicit operator bool() const { return ptr_ != nullptr; }

    // 释放所有权
    T* release() {
        T* temp = ptr_;
        ptr_ = nullptr;
        return temp;
    }

    // 重置
    void reset(T* ptr = nullptr) {
        delete ptr_;
        ptr_ = ptr;
    }
};
```

### 使用示例

```cpp
#include <memory>
#include <vector>

class Resource {
public:
    Resource(int id) : id_(id) {
        std::cout << "Resource " << id_ << " 创建\n";
    }
    ~Resource() {
        std::cout << "Resource " << id_ << " 销毁\n";
    }
    void use() {
        std::cout << "使用 Resource " << id_ << "\n";
    }
private:
    int id_;
};

int main() {
    std::vector<std::unique_ptr<Resource>> resources;

    // 创建资源并移动到容器中
    auto r1 = std::make_unique<Resource>(1);
    resources.push_back(std::move(r1));  // r1 现在为空

    resources.push_back(std::make_unique<Resource>(2));
    resources.push_back(std::make_unique<Resource>(3));

    // 使用资源
    for (const auto& r : resources) {
        r->use();
    }

    // 转移资源所有权
    auto r = std::move(resources[0]);
    resources.erase(resources.begin());

    std::cout << "转移后使用: ";
    r->use();

    return 0;
}
```

## 性能对比与基准测试

### 基准测试代码

```cpp
#include <chrono>
#include <vector>
#include <string>
#include <iostream>

class HeavyObject {
    std::vector<int> data_;
public:
    HeavyObject() : data_(1000000, 42) {}

    // 拷贝构造
    HeavyObject(const HeavyObject& other) : data_(other.data_) {}

    // 移动构造
    HeavyObject(HeavyObject&& other) noexcept : data_(std::move(other.data_)) {}
};

template<typename Func>
long long benchmark(Func f, int iterations) {
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        f();
    }
    auto end = std::chrono::high_resolution_clock::now();
    return std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
}

int main() {
    const int iterations = 1000;

    // 测试拷贝
    HeavyObject original;
    auto copyTime = benchmark([&]() {
        HeavyObject copy(original);
    }, iterations);

    // 测试移动
    auto moveTime = benchmark([&]() {
        HeavyObject temp;
        HeavyObject moved(std::move(temp));
    }, iterations);

    std::cout << "拷贝耗时: " << copyTime << " 微秒\n";
    std::cout << "移动耗时: " << moveTime << " 微秒\n";
    std::cout << "性能提升: " << (double)copyTime / moveTime << " 倍\n";

    return 0;
}
```

典型输出：
```
拷贝耗时: 1234567 微秒
移动耗时: 12345 微秒
性能提升: 100 倍
```

### 容器操作的性能优势

```cpp
#include <vector>
#include <string>
#include <chrono>
#include <iostream>

int main() {
    std::vector<std::string> source;
    for (int i = 0; i < 100000; ++i) {
        source.push_back(std::string(1000, 'x'));
    }

    // 拷贝整个 vector
    auto start1 = std::chrono::high_resolution_clock::now();
    std::vector<std::string> copy = source;
    auto end1 = std::chrono::high_resolution_clock::now();

    // 移动整个 vector
    auto start2 = std::chrono::high_resolution_clock::now();
    std::vector<std::string> moved = std::move(source);
    auto end2 = std::chrono::high_resolution_clock::now();

    auto copyDuration = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto moveDuration = std::chrono::duration_cast<std::chrono::microseconds>(end2 - start2);

    std::cout << "拷贝 vector: " << copyDuration.count() << " 毫秒\n";
    std::cout << "移动 vector: " << moveDuration.count() << " 微秒\n";

    return 0;
}
```

### 不同操作的性能比较

```cpp
#include <vector>
#include <string>
#include <iostream>
#include <chrono>

void comparePushMethods() {
    const int N = 100000;

    // 方法 1：push_back 拷贝
    {
        std::vector<std::string> vec;
        vec.reserve(N);
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < N; ++i) {
            std::string s(100, 'a');
            vec.push_back(s);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        std::cout << "push_back 拷贝: " << duration.count() << " ms\n";
    }

    // 方法 2：push_back 移动
    {
        std::vector<std::string> vec;
        vec.reserve(N);
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < N; ++i) {
            std::string s(100, 'a');
            vec.push_back(std::move(s));
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        std::cout << "push_back 移动: " << duration.count() << " ms\n";
    }

    // 方法 3：emplace_back
    {
        std::vector<std::string> vec;
        vec.reserve(N);
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < N; ++i) {
            vec.emplace_back(100, 'a');
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        std::cout << "emplace_back: " << duration.count() << " ms\n";
    }
}
```

## 五法则（Rule of Five）

C++11 引入移动语义后，原来的"三法则"扩展为"五法则"：

如果类需要自定义以下任一函数，通常需要全部自定义：

1. 析构函数
2. 拷贝构造函数
3. 拷贝赋值运算符
4. **移动构造函数**
5. **移动赋值运算符**

### 完整示例

```cpp
class ResourceManager {
private:
    int* data_;
    size_t size_;

public:
    // 构造函数
    explicit ResourceManager(size_t size = 0)
        : size_(size), data_(size ? new int[size] : nullptr) {
        std::cout << "构造\n";
    }

    // 1. 析构函数
    ~ResourceManager() {
        std::cout << "析构\n";
        delete[] data_;
    }

    // 2. 拷贝构造函数
    ResourceManager(const ResourceManager& other)
        : size_(other.size_), data_(other.size_ ? new int[other.size_] : nullptr) {
        std::cout << "拷贝构造\n";
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // 3. 拷贝赋值运算符（使用 copy-and-swap 惯用法）
    ResourceManager& operator=(ResourceManager other) {
        std::cout << "拷贝/移动赋值\n";
        swap(*this, other);
        return *this;
    }

    // 4. 移动构造函数
    ResourceManager(ResourceManager&& other) noexcept
        : data_(nullptr), size_(0) {
        std::cout << "移动构造\n";
        swap(*this, other);
    }

    // 辅助 swap 函数
    friend void swap(ResourceManager& first, ResourceManager& second) noexcept {
        using std::swap;
        swap(first.size_, second.size_);
        swap(first.data_, second.data_);
    }

    // 5. 移动赋值运算符（已通过 copy-and-swap 统一处理）
};
```

### 零法则（Rule of Zero）

更现代的建议是遵循"零法则"：

```cpp
class ModernClass {
private:
    std::vector<int> data_;        // 使用 RAII 容器
    std::unique_ptr<Resource> res_; // 使用智能指针
    std::string name_;              // 使用标准库类型

public:
    // 不需要自定义任何特殊成员函数
    // 编译器生成的版本已经正确处理所有资源
};
```

通过使用 RAII 类型管理资源，可以让编译器生成正确的特殊成员函数。

### 何时使用哪个法则

```cpp
// 零法则：优先选择
class BestPractice {
    std::vector<int> data;
    std::string name;
    // 不需要写任何特殊成员函数
};

// 五法则：只有在确实需要手动管理资源时
class RawResourceManager {
    FILE* file_;

public:
    RawResourceManager(const char* filename)
        : file_(fopen(filename, "r")) {}

    ~RawResourceManager() { if (file_) fclose(file_); }

    // 必须实现其他四个...
    RawResourceManager(const RawResourceManager&);
    RawResourceManager& operator=(const RawResourceManager&);
    RawResourceManager(RawResourceManager&&) noexcept;
    RawResourceManager& operator=(RawResourceManager&&) noexcept;
};

// 更好的方式：封装资源，回归零法则
class BetterResourceManager {
    std::unique_ptr<FILE, decltype(&fclose)> file_;

public:
    BetterResourceManager(const char* filename)
        : file_(fopen(filename, "r"), fclose) {}
    // 不需要任何特殊成员函数！
};
```

## 高级技巧

### 按值传递与移动

对于需要存储参数副本的函数，按值传递配合移动是一种简洁的写法：

```cpp
class Widget {
    std::string name_;
public:
    // 传统方式：需要两个重载
    void setName(const std::string& name) { name_ = name; }
    void setName(std::string&& name) { name_ = std::move(name); }

    // 现代方式：单个函数
    void setName(std::string name) { name_ = std::move(name); }
};
```

权衡：
- 传入左值：1次拷贝 + 1次移动（比传统方式多1次移动）
- 传入右值：2次移动（与传统方式相同）

对于移动成本低廉的类型（如 `std::string`），这种简化是可接受的。

### 移动迭代器

`std::make_move_iterator` 可以创建移动迭代器：

```cpp
#include <algorithm>
#include <vector>
#include <string>
#include <iterator>

int main() {
    std::vector<std::string> source = {"one", "two", "three"};
    std::vector<std::string> dest;

    // 方法 1：使用 std::move 算法
    std::move(source.begin(), source.end(), std::back_inserter(dest));

    // 方法 2：使用移动迭代器
    std::vector<std::string> source2 = {"four", "five", "six"};
    std::vector<std::string> dest2(
        std::make_move_iterator(source2.begin()),
        std::make_move_iterator(source2.end())
    );

    // source 和 source2 中的元素现在处于有效但未定义状态
    return 0;
}
```

### 返回值优化（RVO）与移动

```cpp
// 情况 1：NRVO（命名返回值优化）
std::string createString1() {
    std::string result = "Hello";
    return result;  // 编译器可能直接在调用者的内存中构造
}

// 情况 2：RVO（返回临时对象）
std::string createString2() {
    return std::string("Hello");  // 同样可能被优化
}

// 情况 3：条件返回（可能无法 RVO）
std::string createString3(bool condition) {
    std::string a = "Hello";
    std::string b = "World";
    if (condition) {
        return a;  // 无法 RVO，但会自动移动
    }
    return b;
}

// 错误：不要这样做
std::string createString4() {
    std::string result = "Hello";
    return std::move(result);  // 阻止 RVO！
}
```

### 成员函数的引用限定符

C++11 允许根据对象的值类别来重载成员函数：

```cpp
class Buffer {
    std::vector<char> data_;

public:
    // 对于左值对象，返回 const 引用
    const std::vector<char>& getData() const & {
        return data_;
    }

    // 对于右值对象，返回移动后的值
    std::vector<char> getData() && {
        return std::move(data_);
    }
};

int main() {
    Buffer buf;
    // ... 填充 buf ...

    auto data1 = buf.getData();  // 拷贝（buf 是左值）

    auto data2 = Buffer().getData();  // 移动（临时对象是右值）
    auto data3 = std::move(buf).getData();  // 移动
}
```

## 常见陷阱与最佳实践

### 陷阱 1：移动自身

```cpp
std::string s = "Hello";
s = std::move(s);  // 未定义行为！

// 解决方案：在移动赋值中检查自赋值
MyString& operator=(MyString&& other) noexcept {
    if (this != &other) {
        // 移动资源
    }
    return *this;
}
```

### 陷阱 2：移动成员变量

```cpp
class Container {
    std::vector<int> data_;
public:
    // 正确：只在右值上调用
    std::vector<int> getData() && {
        return std::move(data_);
    }

    // 危险示例
    void process() {
        auto d = std::move(data_);  // 危险：对象仍然存在
        // data_ 现在为空，可能破坏类不变量
    }
};
```

### 陷阱 3：模板中的 && 不总是右值引用

```cpp
template<typename T>
void foo(T&& x);     // 转发引用

void bar(int&& x);   // 右值引用

template<typename T>
class Widget {
    void baz(T&& x); // 右值引用！不是转发引用
};
```

### 陷阱 4：移动 const 对象

```cpp
const std::vector<int> vec = {1, 2, 3};
auto vec2 = std::move(vec);  // 实际上是拷贝！

// std::move(vec) 返回 const std::vector<int>&&
// 这匹配拷贝构造函数 vector(const vector&)
// 而不是移动构造函数 vector(vector&&)
```

### 陷阱 5：基类的移动操作

```cpp
class Base {
public:
    Base(Base&& other) noexcept { /* ... */ }
};

class Derived : public Base {
public:
    // 错误：忘记移动基类
    Derived(Derived&& other) noexcept
        : Base(other) {  // 调用 Base 的拷贝构造！
    }

    // 正确
    Derived(Derived&& other) noexcept
        : Base(std::move(other)) {  // 调用 Base 的移动构造
    }
};
```

### 最佳实践总结

1. **优先使用标准库的 RAII 类型**，遵循零法则
2. **移动操作声明为 noexcept**
3. **不要返回局部变量的 std::move**
4. **移动后不要使用原对象**（除非重新赋值）
5. **对于需要接管所有权的函数，使用值传递或右值引用**
6. **使用 std::forward 进行完美转发**
7. **在模板中区分转发引用和右值引用**
8. **确保移动操作保持类不变量**
9. **处理自移动赋值的情况**
10. **考虑使用引用限定符优化成员函数**

```cpp
// 最佳实践示例
class Widget {
    std::vector<int> data_;
    std::string name_;

public:
    // 使用值传递 + 移动
    Widget(std::string name, std::vector<int> data)
        : name_(std::move(name)), data_(std::move(data)) {}

    // 引用限定符优化
    const std::vector<int>& getData() const & { return data_; }
    std::vector<int> getData() && { return std::move(data_); }

    // 遵循零法则：不需要自定义特殊成员函数
};
```

## 总结

移动语义是现代 C++ 的核心特性：

| 概念 | 作用 |
|------|------|
| 右值引用 `&&` | 绑定到临时对象，启用移动操作 |
| `std::move` | 将左值转换为右值引用 |
| 移动构造/赋值 | 高效转移资源所有权 |
| 完美转发 | 保持参数的值类别 |
| `std::forward` | 实现完美转发的工具 |
| 引用折叠 | 完美转发的底层机制 |
| 五法则 | 正确管理资源的完整指南 |
| 零法则 | 使用 RAII 避免手动管理 |

掌握移动语义可以：
- 显著提升程序性能（避免不必要的深拷贝）
- 实现更自然的资源管理（如 unique_ptr）
- 编写更高效的泛型代码（完美转发）
- 设计更合理的 API（值语义与引用语义的平衡）

移动语义与智能指针、RAII 一起，构成了现代 C++ 资源管理的基石。在实践中，应优先使用标准库组件（零法则），只在确实需要手动管理资源时才实现五法则。
