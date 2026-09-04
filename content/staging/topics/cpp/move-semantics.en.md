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
origin: old/src/content/docs/cpp/move-semantics.en.md
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

Move semantics is one of the most important features introduced in C++11, fundamentally changing how C++ handles resource management. Through move semantics, we can avoid unnecessary deep copies and significantly improve program performance.

## Understanding Value Categories

Before diving into move semantics, we need to understand value categories in C++.

### Lvalues and Rvalues

```cpp
int x = 10;      // x is an lvalue, 10 is an rvalue
int y = x + 5;   // x + 5 is an rvalue
int* p = &x;     // Can take the address of x because x is an lvalue
// int* q = &(x + 5);  // Error! Cannot take the address of an rvalue
```

**Lvalue**:
- An expression with a persistent storage location
- Can take its address
- Can appear on the left side of an assignment
- Examples: variable names, dereferenced pointers, function calls returning lvalue references

**Rvalue**:
- A temporary value that is about to be destroyed
- Generally cannot take its address
- Can only appear on the right side of an assignment
- Examples: literals, temporary objects, function calls returning non-reference types

### C++11 Refined Categories

C++11 further subdivides value categories into:

```
        expression
       /      \
    glvalue   rvalue
    /    \    /    \
lvalue  xvalue    prvalue
```

- **lvalue**: Traditional lvalue
- **prvalue** (pure rvalue): Traditional rvalue, such as literals and temporary objects
- **xvalue** (expiring value): An object about to be moved, such as the return value of `std::move(x)`

### Practical Method for Determining Value Categories

```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void check_category(T&& arg) {
    if constexpr (std::is_lvalue_reference_v<T>) {
        std::cout << "lvalue" << std::endl;
    } else {
        std::cout << "rvalue" << std::endl;
    }
}

int main() {
    int x = 42;
    check_category(x);           // Output: lvalue
    check_category(42);          // Output: rvalue
    check_category(std::move(x)); // Output: rvalue
    check_category(x + 1);       // Output: rvalue
}
```

## Rvalue References

### Basic Syntax

Rvalue references are declared using `&&` and can only bind to rvalues:

```cpp
int x = 10;
int& lref = x;       // Lvalue reference, binds to lvalue
// int& lref2 = 10;  // Error! Lvalue reference cannot bind to rvalue

int&& rref = 10;     // Rvalue reference, binds to rvalue
// int&& rref2 = x;  // Error! Rvalue reference cannot bind to lvalue

const int& cref = 10; // const lvalue reference can bind to rvalue (special case)
```

### Characteristics of Rvalue References

An rvalue reference itself is an lvalue:

```cpp
void process(int& x) { std::cout << "lvalue version\n"; }
void process(int&& x) { std::cout << "rvalue version\n"; }

int main() {
    int&& rref = 10;
    process(rref);     // Output: lvalue version! Because rref itself is an lvalue
    process(10);       // Output: rvalue version
}
```

This characteristic is very important; understanding it is crucial for correctly using move semantics.

### Rvalue References Extend Temporary Object Lifetime

```cpp
#include <iostream>

class Widget {
public:
    Widget() { std::cout << "Constructed\n"; }
    ~Widget() { std::cout << "Destructed\n"; }
};

Widget createWidget() {
    return Widget();
}

int main() {
    std::cout << "--- Start ---\n";
    Widget&& ref = createWidget();  // Temporary object lifetime extended
    std::cout << "--- Temporary object is still alive ---\n";
    // When ref goes out of scope, the temporary object is destructed
}
// Output:
// --- Start ---
// Constructed
// --- Temporary object is still alive ---
// Destructed
```

## Move Constructor and Move Assignment Operator

### The Problem with Traditional Copying

Consider a simple string class:

```cpp
class MyString {
private:
    char* data_;
    size_t size_;

public:
    // Constructor
    MyString(const char* str = "") {
        size_ = strlen(str);
        data_ = new char[size_ + 1];
        strcpy(data_, str);
        std::cout << "Constructed: " << data_ << "\n";
    }

    // Copy constructor
    MyString(const MyString& other) {
        size_ = other.size_;
        data_ = new char[size_ + 1];
        strcpy(data_, other.data_);
        std::cout << "Copy constructed: " << data_ << "\n";
    }

    // Destructor
    ~MyString() {
        std::cout << "Destructed: " << (data_ ? data_ : "null") << "\n";
        delete[] data_;
    }

    // ... other member functions
};

MyString createString() {
    MyString temp("Hello, World!");
    return temp;  // May trigger copy construction
}

int main() {
    MyString s = createString();  // Potential multiple copies
}
```

Without move semantics, returning temporary objects may lead to unnecessary deep copies.

### Implementing Move Constructor

```cpp
class MyString {
private:
    char* data_;
    size_t size_;

public:
    // ... other constructors

    // Move constructor
    MyString(MyString&& other) noexcept
        : data_(other.data_), size_(other.size_) {
        // Take over resources
        other.data_ = nullptr;
        other.size_ = 0;
        std::cout << "Move constructed: " << data_ << "\n";
    }

    // Move assignment operator
    MyString& operator=(MyString&& other) noexcept {
        std::cout << "Move assignment\n";
        if (this != &other) {
            // Release current resources
            delete[] data_;

            // Take over new resources
            data_ = other.data_;
            size_ = other.size_;

            // Nullify source object
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }
};
```

### Core Idea of Move Semantics

The essence of move operations is **resource transfer** rather than copying:

1. Transfer the source object's resources (such as pointers) directly to the target object
2. Leave the source object in a valid but unspecified state (usually nullified)
3. Avoid the memory allocation and data copying overhead of deep copying

```cpp
// Copy vs Move comparison
void demonstrateDifference() {
    MyString original("A very long string that requires heap allocation");

    // Copy: allocate new memory + copy data
    MyString copy = original;

    // Move: just transfer the pointer, O(1) operation
    MyString moved = std::move(original);
    // original is now in a valid but unspecified state
}
```

### The Importance of noexcept

Move operations should be declared as `noexcept`:

```cpp
MyString(MyString&& other) noexcept;
MyString& operator=(MyString&& other) noexcept;
```

Reasons:
1. Standard library containers (like `std::vector`) will only use move instead of copy when reallocating memory if the move constructor is `noexcept`
2. This ensures strong exception safety guarantee

```cpp
#include <vector>

class Widget {
public:
    // Move constructor without noexcept
    Widget(Widget&& other) { /* ... */ }
};

class SafeWidget {
public:
    // Move constructor with noexcept
    SafeWidget(SafeWidget&& other) noexcept { /* ... */ }
};

int main() {
    std::vector<Widget> vec1;
    vec1.reserve(1);
    vec1.emplace_back();
    vec1.emplace_back();  // Uses copy during expansion (slow)

    std::vector<SafeWidget> vec2;
    vec2.reserve(1);
    vec2.emplace_back();
    vec2.emplace_back();  // Uses move during expansion (fast)
}
```

### Verifying the Impact of noexcept

```cpp
#include <iostream>
#include <type_traits>

class A {
public:
    A(A&&) {}  // Not noexcept
};

class B {
public:
    B(B&&) noexcept {}  // noexcept
};

int main() {
    std::cout << std::boolalpha;
    std::cout << "A is nothrow move constructible: "
              << std::is_nothrow_move_constructible_v<A> << "\n";  // false
    std::cout << "B is nothrow move constructible: "
              << std::is_nothrow_move_constructible_v<B> << "\n";  // true
}
```

## std::move Explained

### The Essence of std::move

`std::move` doesn't actually "move" anything; it only **casts** an lvalue to an rvalue reference:

```cpp
// Simplified std::move implementation
template<typename T>
typename std::remove_reference<T>::type&& move(T&& arg) noexcept {
    return static_cast<typename std::remove_reference<T>::type&&>(arg);
}
```

### Understanding How std::move Works

```cpp
#include <iostream>
#include <utility>

void process(int& x) { std::cout << "lvalue reference version\n"; }
void process(int&& x) { std::cout << "rvalue reference version\n"; }

int main() {
    int x = 42;

    process(x);            // Calls lvalue reference version
    process(std::move(x)); // Calls rvalue reference version
    // x's value is still 42, std::move is just a type cast

    std::cout << "x = " << x << "\n";  // Output: x = 42
}
```

### Correct Usage of std::move

```cpp
#include <utility>
#include <vector>
#include <string>

int main() {
    std::string str = "Hello, World!";
    std::vector<std::string> vec;

    // Copy str to vector
    vec.push_back(str);
    std::cout << "str after copy: " << str << "\n";  // str is still valid

    // Move str to vector
    vec.push_back(std::move(str));
    std::cout << "str after move: " << str << "\n";  // str is in valid but unspecified state
}
```

### Common Mistakes

**Mistake 1: Using an object after moving from it**

```cpp
std::string str = "Hello";
std::string str2 = std::move(str);
std::cout << str.size();  // Undefined behavior! str has been moved

// Correct approach: reassign after move
str = "New value";
std::cout << str.size();  // Now safe to use
```

**Mistake 2: Using std::move on const objects**

```cpp
const std::string str = "Hello";
std::string str2 = std::move(str);  // Actually calls copy constructor!
// Because std::move(str) returns const std::string&&
// It cannot bind to std::string&& parameter
```

**Mistake 3: Using std::move when returning local variables**

```cpp
std::string createString() {
    std::string result = "Hello";
    return std::move(result);  // Wrong! Prevents RVO optimization
}

// Correct way
std::string createString() {
    std::string result = "Hello";
    return result;  // Compiler will automatically apply NRVO or move semantics
}
```

**Mistake 4: Moving the same object multiple times**

```cpp
std::string str = "Hello";
std::string a = std::move(str);
std::string b = std::move(str);  // str has already been moved, this is undefined behavior
```

### Correct Use Cases for std::move

```cpp
class Container {
    std::vector<int> data_;

public:
    // 1. Transfer ownership of member variable
    std::vector<int> extractData() && {
        return std::move(data_);
    }

    // 2. In constructor initializer list
    Container(std::vector<int> data) : data_(std::move(data)) {}

    // 3. Move local variable into container
    void process() {
        std::vector<int> temp = {1, 2, 3};
        // Process temp...
        data_ = std::move(temp);  // temp is not used after this
    }
};
```

## Perfect Forwarding

### Problem Introduction

Consider writing a wrapper function:

```cpp
template<typename T>
void wrapper(T arg) {
    process(arg);
}

void process(int& x) { std::cout << "lvalue\n"; }
void process(int&& x) { std::cout << "rvalue\n"; }

int main() {
    int x = 10;
    wrapper(x);    // We want to call process(int&)
    wrapper(10);   // We want to call process(int&&)
}
```

The problem is that regardless of what is passed in, `arg` is always an lvalue inside the function, unable to preserve the original value category.

### Attempting to Solve with Overloads

```cpp
// Approach 1: Overloading (not scalable)
template<typename T>
void wrapper(T& arg) {
    process(arg);
}

template<typename T>
void wrapper(T&& arg) {
    process(std::move(arg));
}

// Problem: If there are multiple parameters, the number of overloads grows exponentially
// 2 parameters need 4 overloads, 3 parameters need 8 overloads...
```

### Forwarding References (Universal References)

When `T&&` appears in a template parameter deduction context, it is a **forwarding reference** (also called universal reference):

```cpp
template<typename T>
void wrapper(T&& arg) {  // This is a forwarding reference, not an rvalue reference!
    // ...
}
```

Forwarding reference deduction rules:
- When passed an lvalue, `T` is deduced as `T&`, and `T&&` collapses to `T&`
- When passed an rvalue, `T` is deduced as `T`, and `T&&` remains `T&&`

```cpp
template<typename T>
void foo(T&& arg);

int x = 42;
foo(x);   // T = int&,  T&& = int& && = int&  (lvalue reference)
foo(42);  // T = int,   T&& = int&&           (rvalue reference)
```

### Reference Collapsing Rules

```cpp
T& &   -> T&
T& &&  -> T&
T&& &  -> T&
T&& && -> T&&
```

Simple mnemonic: Only an rvalue reference to an rvalue reference is an rvalue reference; all others collapse to lvalue references.

### Distinguishing Forwarding References from Rvalue References

```cpp
// Forwarding reference: T is a template parameter and type deduction is occurring
template<typename T>
void foo(T&& x);           // Forwarding reference

// Rvalue reference: Not a template, or T is already determined
void bar(int&& x);          // Rvalue reference

template<typename T>
class Widget {
    void baz(T&& x);        // Rvalue reference! T is determined when class is instantiated
};

template<typename T>
void qux(std::vector<T>&& x);  // Rvalue reference! std::vector<T> is not a template parameter
```

### std::forward Implements Perfect Forwarding

```cpp
template<typename T>
void wrapper(T&& arg) {
    process(std::forward<T>(arg));
}
```

The implementation principle of `std::forward`:

```cpp
// Simplified std::forward implementation
template<typename T>
T&& forward(typename std::remove_reference<T>::type& arg) noexcept {
    return static_cast<T&&>(arg);
}
```

When `T` is an lvalue reference type, it returns an lvalue reference; when `T` is a non-reference type, it returns an rvalue reference.

### Complete Example

```cpp
#include <iostream>
#include <utility>

void process(int& x) {
    std::cout << "Processing lvalue: " << x << "\n";
}

void process(int&& x) {
    std::cout << "Processing rvalue: " << x << "\n";
}

template<typename T>
void wrapper(T&& arg) {
    std::cout << "wrapper received argument\n";
    process(std::forward<T>(arg));
}

int main() {
    int x = 42;

    wrapper(x);      // Output: Processing lvalue: 42
    wrapper(100);    // Output: Processing rvalue: 100
    wrapper(std::move(x));  // Output: Processing rvalue: 42

    return 0;
}
```

### Perfect Forwarding in Variadic Templates

Perfect forwarding is particularly useful in factory functions and wrappers:

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
        std::cout << "Constructing Widget: " << a << ", " << b << ", " << c << "\n";
    }
};

int main() {
    auto w = make_unique<Widget>(42, "hello", 3.14);
}
```

### Practical Applications of Perfect Forwarding

```cpp
#include <functional>
#include <utility>

// Generic logging wrapper
template<typename Func, typename... Args>
auto logAndCall(Func&& func, Args&&... args)
    -> decltype(std::forward<Func>(func)(std::forward<Args>(args)...))
{
    std::cout << "Before function call\n";
    auto result = std::forward<Func>(func)(std::forward<Args>(args)...);
    std::cout << "After function call\n";
    return result;
}

int add(int a, int b) { return a + b; }

int main() {
    auto result = logAndCall(add, 3, 4);
    std::cout << "Result: " << result << "\n";

    // Also supports lambdas
    auto lambda = [](const std::string& s) { return s.size(); };
    auto len = logAndCall(lambda, std::string("hello"));
}
```

## Practical Case: Move Semantics in Smart Pointers

### Key Points of unique_ptr Implementation

`std::unique_ptr` is a classic application of move semantics:

```cpp
template<typename T>
class UniquePtr {
private:
    T* ptr_;

public:
    // Constructor
    explicit UniquePtr(T* ptr = nullptr) : ptr_(ptr) {}

    // Disable copying
    UniquePtr(const UniquePtr&) = delete;
    UniquePtr& operator=(const UniquePtr&) = delete;

    // Move constructor
    UniquePtr(UniquePtr&& other) noexcept : ptr_(other.ptr_) {
        other.ptr_ = nullptr;
    }

    // Move assignment
    UniquePtr& operator=(UniquePtr&& other) noexcept {
        if (this != &other) {
            delete ptr_;
            ptr_ = other.ptr_;
            other.ptr_ = nullptr;
        }
        return *this;
    }

    // Destructor
    ~UniquePtr() { delete ptr_; }

    // Dereference
    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }
    T* get() const { return ptr_; }

    // Explicit boolean conversion
    explicit operator bool() const { return ptr_ != nullptr; }

    // Release ownership
    T* release() {
        T* temp = ptr_;
        ptr_ = nullptr;
        return temp;
    }

    // Reset
    void reset(T* ptr = nullptr) {
        delete ptr_;
        ptr_ = ptr;
    }
};
```

### Usage Example

```cpp
#include <memory>
#include <vector>

class Resource {
public:
    Resource(int id) : id_(id) {
        std::cout << "Resource " << id_ << " created\n";
    }
    ~Resource() {
        std::cout << "Resource " << id_ << " destroyed\n";
    }
    void use() {
        std::cout << "Using Resource " << id_ << "\n";
    }
private:
    int id_;
};

int main() {
    std::vector<std::unique_ptr<Resource>> resources;

    // Create resources and move them into the container
    auto r1 = std::make_unique<Resource>(1);
    resources.push_back(std::move(r1));  // r1 is now empty

    resources.push_back(std::make_unique<Resource>(2));
    resources.push_back(std::make_unique<Resource>(3));

    // Use resources
    for (const auto& r : resources) {
        r->use();
    }

    // Transfer resource ownership
    auto r = std::move(resources[0]);
    resources.erase(resources.begin());

    std::cout << "After transfer: ";
    r->use();

    return 0;
}
```

## Performance Comparison and Benchmarking

### Benchmark Code

```cpp
#include <chrono>
#include <vector>
#include <string>
#include <iostream>

class HeavyObject {
    std::vector<int> data_;
public:
    HeavyObject() : data_(1000000, 42) {}

    // Copy constructor
    HeavyObject(const HeavyObject& other) : data_(other.data_) {}

    // Move constructor
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

    // Test copy
    HeavyObject original;
    auto copyTime = benchmark([&]() {
        HeavyObject copy(original);
    }, iterations);

    // Test move
    auto moveTime = benchmark([&]() {
        HeavyObject temp;
        HeavyObject moved(std::move(temp));
    }, iterations);

    std::cout << "Copy time: " << copyTime << " microseconds\n";
    std::cout << "Move time: " << moveTime << " microseconds\n";
    std::cout << "Performance improvement: " << (double)copyTime / moveTime << "x\n";

    return 0;
}
```

Typical output:
```
Copy time: 1234567 microseconds
Move time: 12345 microseconds
Performance improvement: 100x
```

### Performance Advantage in Container Operations

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

    // Copy the entire vector
    auto start1 = std::chrono::high_resolution_clock::now();
    std::vector<std::string> copy = source;
    auto end1 = std::chrono::high_resolution_clock::now();

    // Move the entire vector
    auto start2 = std::chrono::high_resolution_clock::now();
    std::vector<std::string> moved = std::move(source);
    auto end2 = std::chrono::high_resolution_clock::now();

    auto copyDuration = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto moveDuration = std::chrono::duration_cast<std::chrono::microseconds>(end2 - start2);

    std::cout << "Copy vector: " << copyDuration.count() << " milliseconds\n";
    std::cout << "Move vector: " << moveDuration.count() << " microseconds\n";

    return 0;
}
```

### Performance Comparison of Different Operations

```cpp
#include <vector>
#include <string>
#include <iostream>
#include <chrono>

void comparePushMethods() {
    const int N = 100000;

    // Method 1: push_back with copy
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
        std::cout << "push_back with copy: " << duration.count() << " ms\n";
    }

    // Method 2: push_back with move
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
        std::cout << "push_back with move: " << duration.count() << " ms\n";
    }

    // Method 3: emplace_back
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

## Rule of Five

With the introduction of move semantics in C++11, the original "Rule of Three" expanded to the "Rule of Five":

If a class needs to customize any one of the following functions, it usually needs to customize all of them:

1. Destructor
2. Copy constructor
3. Copy assignment operator
4. **Move constructor**
5. **Move assignment operator**

### Complete Example

```cpp
class ResourceManager {
private:
    int* data_;
    size_t size_;

public:
    // Constructor
    explicit ResourceManager(size_t size = 0)
        : size_(size), data_(size ? new int[size] : nullptr) {
        std::cout << "Constructed\n";
    }

    // 1. Destructor
    ~ResourceManager() {
        std::cout << "Destructed\n";
        delete[] data_;
    }

    // 2. Copy constructor
    ResourceManager(const ResourceManager& other)
        : size_(other.size_), data_(other.size_ ? new int[other.size_] : nullptr) {
        std::cout << "Copy constructed\n";
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // 3. Copy assignment operator (using copy-and-swap idiom)
    ResourceManager& operator=(ResourceManager other) {
        std::cout << "Copy/Move assignment\n";
        swap(*this, other);
        return *this;
    }

    // 4. Move constructor
    ResourceManager(ResourceManager&& other) noexcept
        : data_(nullptr), size_(0) {
        std::cout << "Move constructed\n";
        swap(*this, other);
    }

    // Helper swap function
    friend void swap(ResourceManager& first, ResourceManager& second) noexcept {
        using std::swap;
        swap(first.size_, second.size_);
        swap(first.data_, second.data_);
    }

    // 5. Move assignment operator (already handled through copy-and-swap)
};
```

### Rule of Zero

A more modern recommendation is to follow the "Rule of Zero":

```cpp
class ModernClass {
private:
    std::vector<int> data_;        // Use RAII containers
    std::unique_ptr<Resource> res_; // Use smart pointers
    std::string name_;              // Use standard library types

public:
    // No need to customize any special member functions
    // Compiler-generated versions correctly handle all resources
};
```

By using RAII types to manage resources, the compiler can generate correct special member functions.

### When to Use Which Rule

```cpp
// Rule of Zero: Preferred choice
class BestPractice {
    std::vector<int> data;
    std::string name;
    // No need to write any special member functions
};

// Rule of Five: Only when manual resource management is truly needed
class RawResourceManager {
    FILE* file_;

public:
    RawResourceManager(const char* filename)
        : file_(fopen(filename, "r")) {}

    ~RawResourceManager() { if (file_) fclose(file_); }

    // Must implement the other four...
    RawResourceManager(const RawResourceManager&);
    RawResourceManager& operator=(const RawResourceManager&);
    RawResourceManager(RawResourceManager&&) noexcept;
    RawResourceManager& operator=(RawResourceManager&&) noexcept;
};

// Better approach: Encapsulate resources, return to Rule of Zero
class BetterResourceManager {
    std::unique_ptr<FILE, decltype(&fclose)> file_;

public:
    BetterResourceManager(const char* filename)
        : file_(fopen(filename, "r"), fclose) {}
    // No special member functions needed!
};
```

## Advanced Techniques

### Pass by Value and Move

For functions that need to store a copy of the parameter, pass by value combined with move is a concise approach:

```cpp
class Widget {
    std::string name_;
public:
    // Traditional approach: need two overloads
    void setName(const std::string& name) { name_ = name; }
    void setName(std::string&& name) { name_ = std::move(name); }

    // Modern approach: single function
    void setName(std::string name) { name_ = std::move(name); }
};
```

Trade-offs:
- Passing lvalue: 1 copy + 1 move (1 more move than traditional)
- Passing rvalue: 2 moves (same as traditional)

For types with cheap move operations (like `std::string`), this simplification is acceptable.

### Move Iterators

`std::make_move_iterator` can create move iterators:

```cpp
#include <algorithm>
#include <vector>
#include <string>
#include <iterator>

int main() {
    std::vector<std::string> source = {"one", "two", "three"};
    std::vector<std::string> dest;

    // Method 1: Using std::move algorithm
    std::move(source.begin(), source.end(), std::back_inserter(dest));

    // Method 2: Using move iterators
    std::vector<std::string> source2 = {"four", "five", "six"};
    std::vector<std::string> dest2(
        std::make_move_iterator(source2.begin()),
        std::make_move_iterator(source2.end())
    );

    // Elements in source and source2 are now in valid but unspecified state
    return 0;
}
```

### Return Value Optimization (RVO) and Move

```cpp
// Case 1: NRVO (Named Return Value Optimization)
std::string createString1() {
    std::string result = "Hello";
    return result;  // Compiler may construct directly in caller's memory
}

// Case 2: RVO (returning temporary object)
std::string createString2() {
    return std::string("Hello");  // Can also be optimized
}

// Case 3: Conditional return (RVO may not apply)
std::string createString3(bool condition) {
    std::string a = "Hello";
    std::string b = "World";
    if (condition) {
        return a;  // Cannot apply RVO, but will automatically move
    }
    return b;
}

// Wrong: Don't do this
std::string createString4() {
    std::string result = "Hello";
    return std::move(result);  // Prevents RVO!
}
```

### Ref-qualifiers for Member Functions

C++11 allows overloading member functions based on the value category of the object:

```cpp
class Buffer {
    std::vector<char> data_;

public:
    // For lvalue objects, return const reference
    const std::vector<char>& getData() const & {
        return data_;
    }

    // For rvalue objects, return moved value
    std::vector<char> getData() && {
        return std::move(data_);
    }
};

int main() {
    Buffer buf;
    // ... fill buf ...

    auto data1 = buf.getData();  // Copy (buf is lvalue)

    auto data2 = Buffer().getData();  // Move (temporary is rvalue)
    auto data3 = std::move(buf).getData();  // Move
}
```

## Common Pitfalls and Best Practices

### Pitfall 1: Moving from Self

```cpp
std::string s = "Hello";
s = std::move(s);  // Undefined behavior!

// Solution: Check for self-assignment in move assignment
MyString& operator=(MyString&& other) noexcept {
    if (this != &other) {
        // Move resources
    }
    return *this;
}
```

### Pitfall 2: Moving Member Variables

```cpp
class Container {
    std::vector<int> data_;
public:
    // Correct: Only called on rvalue
    std::vector<int> getData() && {
        return std::move(data_);
    }

    // Dangerous example
    void process() {
        auto d = std::move(data_);  // Dangerous: object still exists
        // data_ is now empty, may break class invariants
    }
};
```

### Pitfall 3: && in Templates is Not Always Rvalue Reference

```cpp
template<typename T>
void foo(T&& x);     // Forwarding reference

void bar(int&& x);   // Rvalue reference

template<typename T>
class Widget {
    void baz(T&& x); // Rvalue reference! Not a forwarding reference
};
```

### Pitfall 4: Moving const Objects

```cpp
const std::vector<int> vec = {1, 2, 3};
auto vec2 = std::move(vec);  // Actually a copy!

// std::move(vec) returns const std::vector<int>&&
// This matches copy constructor vector(const vector&)
// Not move constructor vector(vector&&)
```

### Pitfall 5: Move Operations in Base Classes

```cpp
class Base {
public:
    Base(Base&& other) noexcept { /* ... */ }
};

class Derived : public Base {
public:
    // Wrong: forgot to move base class
    Derived(Derived&& other) noexcept
        : Base(other) {  // Calls Base's copy constructor!
    }

    // Correct
    Derived(Derived&& other) noexcept
        : Base(std::move(other)) {  // Calls Base's move constructor
    }
};
```

### Best Practices Summary

1. **Prefer standard library RAII types**, follow the Rule of Zero
2. **Declare move operations as noexcept**
3. **Don't use std::move on return of local variables**
4. **Don't use an object after moving from it** (unless reassigned)
5. **For functions that need to take ownership, use pass by value or rvalue reference**
6. **Use std::forward for perfect forwarding**
7. **Distinguish forwarding references from rvalue references in templates**
8. **Ensure move operations maintain class invariants**
9. **Handle self-move-assignment cases**
10. **Consider using ref-qualifiers to optimize member functions**

```cpp
// Best practice example
class Widget {
    std::vector<int> data_;
    std::string name_;

public:
    // Use pass by value + move
    Widget(std::string name, std::vector<int> data)
        : name_(std::move(name)), data_(std::move(data)) {}

    // Ref-qualifier optimization
    const std::vector<int>& getData() const & { return data_; }
    std::vector<int> getData() && { return std::move(data_); }

    // Following Rule of Zero: no custom special member functions needed
};
```

## Summary

Move semantics is a core feature of modern C++:

| Concept | Purpose |
|---------|---------|
| Rvalue reference `&&` | Binds to temporary objects, enables move operations |
| `std::move` | Casts lvalue to rvalue reference |
| Move constructor/assignment | Efficiently transfers resource ownership |
| Perfect forwarding | Preserves argument value category |
| `std::forward` | Tool for implementing perfect forwarding |
| Reference collapsing | Underlying mechanism of perfect forwarding |
| Rule of Five | Complete guide for proper resource management |
| Rule of Zero | Use RAII to avoid manual management |

Mastering move semantics enables you to:
- Significantly improve program performance (avoid unnecessary deep copies)
- Implement more natural resource management (like unique_ptr)
- Write more efficient generic code (perfect forwarding)
- Design better APIs (balance between value semantics and reference semantics)

Move semantics, together with smart pointers and RAII, form the cornerstone of modern C++ resource management. In practice, prefer using standard library components (Rule of Zero), and only implement the Rule of Five when manual resource management is truly necessary.
