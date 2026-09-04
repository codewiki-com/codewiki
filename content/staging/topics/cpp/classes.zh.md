---
title: C++ 类与对象
description: 深入理解 C++ 类：构造函数、析构函数、拷贝、移动语义
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - 类
  - 对象
  - RAII
status: imported
origin: old/src/content/docs/cpp/classes.zh.md
divergence: 0.279
issues: []
legacy:
  category: Cpp
  subcategory: C++ 基础
  order: 3
  lastUpdated: 2026-01-07
---

类是 C++ 面向对象编程的核心概念，它将数据和操作数据的函数封装在一起。本文将深入探讨 C++ 类的各个方面，包括构造函数、析构函数、拷贝语义、移动语义等重要特性。

## 类的定义

类是用户自定义的数据类型，它将数据成员和成员函数组合在一起。

### 基本语法

```cpp
class Person {
private:
    std::string name;
    int age;

public:
    // 构造函数
    Person(const std::string& n, int a) : name(n), age(a) {}

    // 成员函数
    void introduce() const {
        std::cout << "我叫 " << name << "，今年 " << age << " 岁。" << std::endl;
    }

    // Getter 和 Setter
    std::string getName() const { return name; }
    void setName(const std::string& n) { name = n; }

    int getAge() const { return age; }
    void setAge(int a) { age = a; }
};

// 使用示例
int main() {
    Person person("张三", 25);
    person.introduce();  // 输出: 我叫 张三，今年 25 岁。
    return 0;
}
```

### 访问控制

C++ 提供三种访问控制级别：

```cpp
class Example {
private:
    int privateData;      // 只能在类内部访问

protected:
    int protectedData;    // 类内部和派生类可以访问

public:
    int publicData;       // 任何地方都可以访问

    void publicMethod() {
        privateData = 10;      // 可以访问
        protectedData = 20;    // 可以访问
        publicData = 30;       // 可以访问
    }
};
```

## 构造函数

构造函数是在创建对象时自动调用的特殊成员函数，用于初始化对象。

### 默认构造函数

```cpp
class Point {
private:
    int x, y;

public:
    // 默认构造函数
    Point() : x(0), y(0) {
        std::cout << "默认构造函数被调用" << std::endl;
    }

    void print() const {
        std::cout << "(" << x << ", " << y << ")" << std::endl;
    }
};

int main() {
    Point p;  // 调用默认构造函数
    p.print();  // 输出: (0, 0)
    return 0;
}
```

### 参数化构造函数

```cpp
class Point {
private:
    int x, y;

public:
    // 参数化构造函数
    Point(int xVal, int yVal) : x(xVal), y(yVal) {
        std::cout << "参数化构造函数被调用" << std::endl;
    }

    void print() const {
        std::cout << "(" << x << ", " << y << ")" << std::endl;
    }
};

int main() {
    Point p(10, 20);
    p.print();  // 输出: (10, 20)
    return 0;
}
```

### 委托构造函数

从 C++11 开始，构造函数可以委托给同一个类的其他构造函数：

```cpp
class Rectangle {
private:
    int width, height;

public:
    // 主构造函数
    Rectangle(int w, int h) : width(w), height(h) {
        std::cout << "主构造函数: " << width << "x" << height << std::endl;
    }

    // 委托构造函数
    Rectangle() : Rectangle(0, 0) {
        std::cout << "委托构造完成" << std::endl;
    }

    Rectangle(int side) : Rectangle(side, side) {
        std::cout << "正方形构造完成" << std::endl;
    }
};

int main() {
    Rectangle r1;           // 调用 Rectangle()
    Rectangle r2(5);        // 调用 Rectangle(int)
    Rectangle r3(10, 20);   // 调用 Rectangle(int, int)
    return 0;
}
```

## 成员初始化列表

成员初始化列表是初始化成员变量的首选方式，它比在构造函数体内赋值更高效。

### 为什么使用初始化列表

```cpp
class Student {
private:
    const int id;           // const 成员必须用初始化列表
    std::string& name;      // 引用成员必须用初始化列表
    std::string course;

public:
    // 必须使用初始化列表初始化 const 和引用成员
    Student(int i, std::string& n, const std::string& c)
        : id(i), name(n), course(c) {
        // course = c;  // 这是赋值，不是初始化
    }

    void print() const {
        std::cout << "学号: " << id << ", 姓名: " << name
                  << ", 课程: " << course << std::endl;
    }
};
```

### 初始化顺序

成员变量的初始化顺序由它们在类中声明的顺序决定，而不是初始化列表中的顺序：

```cpp
class OrderTest {
private:
    int a;
    int b;

public:
    // 警告：b 先被初始化（因为它在类中先声明），但它使用了未初始化的 a
    OrderTest(int val) : b(val), a(b + 1) {  // 错误的做法！
        // 实际执行顺序：a = b + 1; b = val;
        // 但此时 b 还未初始化
    }

    // 正确的做法
    OrderTest(int val) : a(val), b(a + 1) {
        // a 先初始化，然后 b 使用 a 的值
    }
};
```

## 析构函数

析构函数在对象销毁时自动调用，用于释放资源和清理工作。

### 基本析构函数

```cpp
class Resource {
private:
    int* data;
    std::string name;

public:
    Resource(const std::string& n, int size) : name(n) {
        data = new int[size];
        std::cout << name << " 资源被分配" << std::endl;
    }

    ~Resource() {
        delete[] data;
        std::cout << name << " 资源被释放" << std::endl;
    }
};

int main() {
    {
        Resource r("临时资源", 100);
        // 使用资源...
    }  // r 在这里被销毁，析构函数自动调用

    std::cout << "程序继续执行" << std::endl;
    return 0;
}
```

### RAII（资源获取即初始化）

RAII 是 C++ 中管理资源的重要idiom，利用对象的生命周期来管理资源：

```cpp
#include <fstream>
#include <iostream>
#include <string>

class FileHandler {
private:
    std::ofstream file;

public:
    FileHandler(const std::string& filename) {
        file.open(filename);
        if (!file.is_open()) {
            throw std::runtime_error("无法打开文件");
        }
        std::cout << "文件打开成功" << std::endl;
    }

    ~FileHandler() {
        if (file.is_open()) {
            file.close();
            std::cout << "文件已关闭" << std::endl;
        }
    }

    void write(const std::string& content) {
        file << content;
    }

    // 禁止拷贝
    FileHandler(const FileHandler&) = delete;
    FileHandler& operator=(const FileHandler&) = delete;
};

int main() {
    try {
        FileHandler fh("output.txt");
        fh.write("Hello, RAII!\n");
        // 即使发生异常，析构函数也会被调用，确保文件被关闭
    } catch (const std::exception& e) {
        std::cerr << "错误: " << e.what() << std::endl;
    }
    return 0;
}
```

## 拷贝构造函数

拷贝构造函数用于从现有对象创建新对象。

### 默认拷贝构造函数

如果不定义拷贝构造函数，编译器会自动生成一个默认版本，进行浅拷贝：

```cpp
class ShallowCopy {
private:
    int value;

public:
    ShallowCopy(int v) : value(v) {}

    // 编译器自动生成的拷贝构造函数等价于：
    // ShallowCopy(const ShallowCopy& other) : value(other.value) {}

    int getValue() const { return value; }
};

int main() {
    ShallowCopy obj1(42);
    ShallowCopy obj2 = obj1;  // 调用拷贝构造函数

    std::cout << obj2.getValue() << std::endl;  // 输出: 42
    return 0;
}
```

### 深拷贝

当类包含指针成员时，需要自定义拷贝构造函数进行深拷贝：

```cpp
class DeepCopy {
private:
    int* data;
    int size;

public:
    DeepCopy(int s) : size(s) {
        data = new int[size];
        for (int i = 0; i < size; ++i) {
            data[i] = i;
        }
        std::cout << "构造函数: 分配 " << size << " 个整数" << std::endl;
    }

    // 拷贝构造函数 - 深拷贝
    DeepCopy(const DeepCopy& other) : size(other.size) {
        data = new int[size];
        for (int i = 0; i < size; ++i) {
            data[i] = other.data[i];
        }
        std::cout << "拷贝构造函数: 深拷贝 " << size << " 个整数" << std::endl;
    }

    ~DeepCopy() {
        delete[] data;
        std::cout << "析构函数: 释放内存" << std::endl;
    }

    void print() const {
        for (int i = 0; i < size; ++i) {
            std::cout << data[i] << " ";
        }
        std::cout << std::endl;
    }

    void set(int index, int value) {
        if (index >= 0 && index < size) {
            data[index] = value;
        }
    }
};

int main() {
    DeepCopy obj1(5);
    obj1.print();  // 输出: 0 1 2 3 4

    DeepCopy obj2 = obj1;  // 深拷贝
    obj2.set(0, 99);

    std::cout << "obj1: ";
    obj1.print();  // 输出: 0 1 2 3 4 (未被修改)

    std::cout << "obj2: ";
    obj2.print();  // 输出: 99 1 2 3 4

    return 0;
}
```

### 拷贝赋值运算符

除了拷贝构造函数，还需要定义拷贝赋值运算符：

```cpp
class Array {
private:
    int* data;
    int size;

public:
    Array(int s) : size(s) {
        data = new int[size];
    }

    // 拷贝构造函数
    Array(const Array& other) : size(other.size) {
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }

    // 拷贝赋值运算符
    Array& operator=(const Array& other) {
        if (this != &other) {  // 防止自我赋值
            // 释放旧资源
            delete[] data;

            // 分配新资源
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    ~Array() {
        delete[] data;
    }
};
```

## 移动语义（C++11）

移动语义允许资源从一个对象转移到另一个对象，避免不必要的拷贝。

### 移动构造函数

```cpp
class String {
private:
    char* data;
    size_t length;

public:
    // 构造函数
    String(const char* str = "") {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
        std::cout << "构造函数: \"" << data << "\"" << std::endl;
    }

    // 拷贝构造函数
    String(const String& other) : length(other.length) {
        data = new char[length + 1];
        std::strcpy(data, other.data);
        std::cout << "拷贝构造函数: \"" << data << "\"" << std::endl;
    }

    // 移动构造函数
    String(String&& other) noexcept : data(other.data), length(other.length) {
        other.data = nullptr;
        other.length = 0;
        std::cout << "移动构造函数: \"" << data << "\"" << std::endl;
    }

    // 拷贝赋值运算符
    String& operator=(const String& other) {
        if (this != &other) {
            delete[] data;
            length = other.length;
            data = new char[length + 1];
            std::strcpy(data, other.data);
            std::cout << "拷贝赋值: \"" << data << "\"" << std::endl;
        }
        return *this;
    }

    // 移动赋值运算符
    String& operator=(String&& other) noexcept {
        if (this != &other) {
            delete[] data;
            data = other.data;
            length = other.length;
            other.data = nullptr;
            other.length = 0;
            std::cout << "移动赋值: \"" << data << "\"" << std::endl;
        }
        return *this;
    }

    ~String() {
        if (data) {
            std::cout << "析构函数: \"" << data << "\"" << std::endl;
            delete[] data;
        } else {
            std::cout << "析构函数: (空)" << std::endl;
        }
    }

    const char* c_str() const { return data; }
};

String createString() {
    String temp("临时字符串");
    return temp;  // 返回值优化（RVO）或移动
}

int main() {
    String s1("Hello");
    String s2 = s1;              // 拷贝构造
    String s3 = std::move(s1);   // 移动构造，s1 被"掏空"

    String s4("World");
    s4 = createString();         // 移动赋值

    return 0;
}
```

### std::move 的使用

```cpp
#include <vector>
#include <iostream>

class Widget {
private:
    std::vector<int> data;
    std::string name;

public:
    Widget(const std::string& n, size_t size) : name(n), data(size) {
        std::cout << "创建 Widget: " << name << std::endl;
    }

    // 移动构造函数
    Widget(Widget&& other) noexcept
        : data(std::move(other.data)), name(std::move(other.name)) {
        std::cout << "移动 Widget" << std::endl;
    }

    void print() const {
        std::cout << name << " 包含 " << data.size() << " 个元素" << std::endl;
    }
};

int main() {
    Widget w1("原始对象", 1000000);

    // 使用 std::move 显式转换为右值引用
    Widget w2 = std::move(w1);  // 移动而非拷贝

    w2.print();  // 输出: 原始对象 包含 1000000 个元素
    // w1 现在处于有效但未指定的状态，不应再使用

    return 0;
}
```

## Rule of Five

如果类需要自定义析构函数、拷贝构造函数或拷贝赋值运算符中的任何一个，通常需要定义所有五个特殊成员函数：

```cpp
class Resource {
private:
    int* data;
    size_t size;

public:
    // 1. 构造函数
    Resource(size_t s) : size(s), data(new int[s]) {
        std::cout << "构造" << std::endl;
    }

    // 2. 析构函数
    ~Resource() {
        delete[] data;
        std::cout << "析构" << std::endl;
    }

    // 3. 拷贝构造函数
    Resource(const Resource& other) : size(other.size), data(new int[size]) {
        std::copy(other.data, other.data + size, data);
        std::cout << "拷贝构造" << std::endl;
    }

    // 4. 拷贝赋值运算符
    Resource& operator=(const Resource& other) {
        if (this != &other) {
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
            std::cout << "拷贝赋值" << std::endl;
        }
        return *this;
    }

    // 5. 移动构造函数
    Resource(Resource&& other) noexcept : size(other.size), data(other.data) {
        other.data = nullptr;
        other.size = 0;
        std::cout << "移动构造" << std::endl;
    }

    // 6. 移动赋值运算符
    Resource& operator=(Resource&& other) noexcept {
        if (this != &other) {
            delete[] data;
            data = other.data;
            size = other.size;
            other.data = nullptr;
            other.size = 0;
            std::cout << "移动赋值" << std::endl;
        }
        return *this;
    }
};
```

### Rule of Zero

如果可能，应该依赖标准库容器和智能指针，避免手动管理资源：

```cpp
#include <vector>
#include <string>
#include <memory>

// 遵循 Rule of Zero：不需要自定义任何特殊成员函数
class ModernClass {
private:
    std::vector<int> data;           // 自动管理内存
    std::string name;                // 自动管理内存
    std::unique_ptr<int> ptr;        // 智能指针自动管理

public:
    ModernClass(const std::string& n, size_t size)
        : name(n), data(size), ptr(std::make_unique<int>(42)) {
    }

    // 不需要定义析构函数、拷贝/移动构造函数或赋值运算符
    // 编译器生成的默认版本已经足够好
};
```

## 友元

友元允许外部函数或类访问类的私有成员。

### 友元函数

```cpp
class Complex {
private:
    double real;
    double imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    // 声明友元函数
    friend Complex operator+(const Complex& a, const Complex& b);
    friend std::ostream& operator<<(std::ostream& os, const Complex& c);

    // 成员函数
    void print() const {
        std::cout << real << " + " << imag << "i" << std::endl;
    }
};

// 友元函数定义（可以访问私有成员）
Complex operator+(const Complex& a, const Complex& b) {
    return Complex(a.real + b.real, a.imag + b.imag);
}

std::ostream& operator<<(std::ostream& os, const Complex& c) {
    os << c.real << " + " << c.imag << "i";
    return os;
}

int main() {
    Complex c1(3, 4);
    Complex c2(1, 2);
    Complex c3 = c1 + c2;

    std::cout << "c1 = " << c1 << std::endl;  // 输出: c1 = 3 + 4i
    std::cout << "c2 = " << c2 << std::endl;  // 输出: c2 = 1 + 2i
    std::cout << "c3 = " << c3 << std::endl;  // 输出: c3 = 4 + 6i

    return 0;
}
```

### 友元类

```cpp
class Engine {
private:
    int horsepower;

public:
    Engine(int hp) : horsepower(hp) {}

    // Car 类可以访问 Engine 的所有成员
    friend class Car;
};

class Car {
private:
    Engine engine;
    std::string model;

public:
    Car(const std::string& m, int hp) : model(m), engine(hp) {}

    void showDetails() const {
        std::cout << "车型: " << model << std::endl;
        // 可以访问 Engine 的私有成员
        std::cout << "马力: " << engine.horsepower << " HP" << std::endl;
    }
};

int main() {
    Car car("Tesla Model S", 670);
    car.showDetails();
    return 0;
}
```

## 静态成员

### 静态成员变量

静态成员变量被类的所有对象共享：

```cpp
class Counter {
private:
    static int count;  // 静态成员声明
    int id;

public:
    Counter() {
        id = ++count;
        std::cout << "创建对象 #" << id << "，当前总数: " << count << std::endl;
    }

    ~Counter() {
        --count;
        std::cout << "销毁对象 #" << id << "，剩余总数: " << count << std::endl;
    }

    static int getCount() {
        return count;
    }
};

// 静态成员定义（必须在类外定义）
int Counter::count = 0;

int main() {
    std::cout << "初始计数: " << Counter::getCount() << std::endl;

    {
        Counter c1;
        Counter c2;
        Counter c3;
        std::cout << "当前计数: " << Counter::getCount() << std::endl;
    }

    std::cout << "最终计数: " << Counter::getCount() << std::endl;
    return 0;
}
```

### 静态成员函数

```cpp
class MathUtils {
public:
    static int add(int a, int b) {
        return a + b;
    }

    static int multiply(int a, int b) {
        return a * b;
    }

    static double pi() {
        return 3.14159265359;
    }
};

int main() {
    // 静态函数可以通过类名直接调用，无需创建对象
    std::cout << "5 + 3 = " << MathUtils::add(5, 3) << std::endl;
    std::cout << "5 * 3 = " << MathUtils::multiply(5, 3) << std::endl;
    std::cout << "π = " << MathUtils::pi() << std::endl;

    return 0;
}
```

## const 成员函数

const 成员函数承诺不修改对象的状态：

```cpp
class Point {
private:
    int x, y;
    mutable int accessCount;  // mutable 允许在 const 函数中修改

public:
    Point(int xVal, int yVal) : x(xVal), y(yVal), accessCount(0) {}

    // const 成员函数
    int getX() const {
        ++accessCount;  // 可以修改 mutable 成员
        return x;
    }

    int getY() const {
        ++accessCount;
        return y;
    }

    double distance() const {
        return std::sqrt(x * x + y * y);
    }

    int getAccessCount() const {
        return accessCount;
    }

    // 非 const 成员函数
    void setX(int xVal) {
        x = xVal;
    }

    void setY(int yVal) {
        y = yVal;
    }
};

int main() {
    const Point p1(3, 4);
    // p1.setX(5);  // 错误：不能在 const 对象上调用非 const 函数

    std::cout << "x = " << p1.getX() << std::endl;  // 正确
    std::cout << "距离 = " << p1.distance() << std::endl;
    std::cout << "访问次数 = " << p1.getAccessCount() << std::endl;

    Point p2(5, 6);
    p2.setX(10);  // 正确：非 const 对象可以调用任何函数

    return 0;
}
```

## 实战示例：智能指针实现

让我们实现一个简化版的智能指针来综合运用所学知识：

```cpp
template<typename T>
class UniquePtr {
private:
    T* ptr;

public:
    // 构造函数
    explicit UniquePtr(T* p = nullptr) : ptr(p) {
        std::cout << "UniquePtr 构造" << std::endl;
    }

    // 禁止拷贝
    UniquePtr(const UniquePtr&) = delete;
    UniquePtr& operator=(const UniquePtr&) = delete;

    // 移动构造函数
    UniquePtr(UniquePtr&& other) noexcept : ptr(other.ptr) {
        other.ptr = nullptr;
        std::cout << "UniquePtr 移动构造" << std::endl;
    }

    // 移动赋值运算符
    UniquePtr& operator=(UniquePtr&& other) noexcept {
        if (this != &other) {
            delete ptr;
            ptr = other.ptr;
            other.ptr = nullptr;
            std::cout << "UniquePtr 移动赋值" << std::endl;
        }
        return *this;
    }

    // 析构函数
    ~UniquePtr() {
        delete ptr;
        std::cout << "UniquePtr 析构" << std::endl;
    }

    // 解引用运算符
    T& operator*() const {
        return *ptr;
    }

    T* operator->() const {
        return ptr;
    }

    // 获取原始指针
    T* get() const {
        return ptr;
    }

    // 释放所有权
    T* release() {
        T* temp = ptr;
        ptr = nullptr;
        return temp;
    }

    // 重置指针
    void reset(T* p = nullptr) {
        delete ptr;
        ptr = p;
    }

    // 布尔转换
    explicit operator bool() const {
        return ptr != nullptr;
    }
};

class Resource {
public:
    Resource(int val) : value(val) {
        std::cout << "Resource(" << value << ") 创建" << std::endl;
    }

    ~Resource() {
        std::cout << "Resource(" << value << ") 销毁" << std::endl;
    }

    void doSomething() {
        std::cout << "Resource::doSomething() - value = " << value << std::endl;
    }

private:
    int value;
};

int main() {
    {
        UniquePtr<Resource> ptr1(new Resource(100));
        ptr1->doSomething();

        // UniquePtr<Resource> ptr2 = ptr1;  // 错误：拷贝被禁止
        UniquePtr<Resource> ptr2 = std::move(ptr1);  // 正确：移动

        if (ptr1) {
            std::cout << "ptr1 有效" << std::endl;
        } else {
            std::cout << "ptr1 已失效" << std::endl;
        }

        if (ptr2) {
            std::cout << "ptr2 有效" << std::endl;
            ptr2->doSomething();
        }
    }

    std::cout << "离开作用域，资源自动释放" << std::endl;
    return 0;
}
```

## 总结

本文介绍了 C++ 类与对象的核心概念：

1. **类定义**：封装数据和方法，提供访问控制
2. **构造函数**：初始化对象，支持参数化和委托
3. **成员初始化列表**：高效初始化成员变量
4. **析构函数**：清理资源，实现 RAII 模式
5. **拷贝语义**：深拷贝 vs 浅拷贝，Rule of Three
6. **移动语义**：高效资源转移，Rule of Five
7. **友元**：授予外部函数或类访问私有成员的权限
8. **静态成员**：类级别的数据和方法
9. **const 正确性**：保证函数不修改对象状态

掌握这些概念是编写高质量 C++ 代码的基础，它们共同构成了现代 C++ 面向对象编程的核心。
