---
title: C++ 命名空间
description: 深入理解 C++ 命名空间：定义、嵌套、using 声明、匿名命名空间与内联命名空间
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - 命名空间
  - 代码组织
  - 模块化
status: imported
origin: old/src/content/docs/cpp/namespaces.zh.md
divergence: 0.239
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 基础
  order: 2
  lastUpdated: 2026-01-07
---

命名空间（Namespace）是 C++ 中用于组织代码和防止名称冲突的重要机制。它将全局作用域划分为独立的、具名的区域，使大型项目中的代码管理更加清晰和安全。

## 概念解释

### 什么是命名空间

命名空间是一种声明性区域，为其内部的标识符（类型、函数、变量等）提供作用域。它的主要目的是：

1. **避免命名冲突**：不同库可能定义相同名称的函数或类，命名空间可以区分它们
2. **组织代码**：将相关的代码逻辑分组，提高代码可读性
3. **控制可见性**：提供比全局作用域更精细的访问控制

### 历史背景

在 C 语言中，所有全局标识符都处于同一个全局命名空间，这在大型项目中容易导致命名冲突。C++ 引入命名空间机制（C++98标准），允许程序员将代码组织到不同的逻辑分组中，解决了这一问题。

```cpp
// C 语言风格：使用前缀避免冲突
void mylib_init();
void mylib_process();

// C++ 风格：使用命名空间
namespace mylib {
    void init();
    void process();
}
```

## 核心原理

### 命名空间的工作机制

编译器通过名称修饰（Name Mangling）来区分不同命名空间中的同名标识符。每个命名空间中的标识符都有其完整的限定名称。

```cpp
namespace A {
    void func() {}  // 完整名称: A::func
}

namespace B {
    void func() {}  // 完整名称: B::func
}
```

### 作用域解析运算符

作用域解析运算符 `::` 用于访问特定命名空间中的成员：

```cpp
#include <iostream>

namespace Math {
    const double PI = 3.14159265359;

    double square(double x) {
        return x * x;
    }
}

int main() {
    // 使用作用域解析运算符访问命名空间成员
    std::cout << "PI = " << Math::PI << std::endl;
    std::cout << "5^2 = " << Math::square(5) << std::endl;
    return 0;
}
```

### 名称查找规则

C++ 的名称查找遵循以下规则：

1. **限定名称查找**：使用 `::` 指定的名称，直接在指定的作用域中查找
2. **非限定名称查找**：从当前作用域开始，向外层作用域依次查找
3. **参数依赖查找（ADL）**：根据函数参数的类型所在的命名空间查找函数

```cpp
#include <iostream>

namespace N {
    class MyClass {
    public:
        int value;
    };

    // ADL 会找到这个函数
    void process(MyClass& obj) {
        std::cout << "Processing in namespace N" << std::endl;
    }
}

int main() {
    N::MyClass obj;
    process(obj);  // ADL: 因为 obj 类型在 N 中，所以查找 N::process
    return 0;
}
```

## 核心要点

### 命名空间定义

```cpp
// 基本命名空间定义
namespace MyNamespace {
    int value = 42;

    void function() {
        // 实现
    }

    class MyClass {
        // 类定义
    };
}

// 命名空间可以分散在多个文件中
// file1.cpp
namespace Utils {
    void helper1() {}
}

// file2.cpp
namespace Utils {
    void helper2() {}  // 与 helper1 在同一个命名空间
}
```

### 嵌套命名空间

```cpp
// 传统方式
namespace Outer {
    namespace Inner {
        namespace Deep {
            void function() {}
        }
    }
}

// C++17 简化语法
namespace Outer::Inner::Deep {
    void anotherFunction() {}
}

// 访问方式
Outer::Inner::Deep::function();
Outer::Inner::Deep::anotherFunction();
```

### using 声明与指令

```cpp
namespace MyLib {
    void func1() {}
    void func2() {}
    int value = 100;
}

// using 声明：引入单个名称
using MyLib::func1;

// using 指令：引入整个命名空间
using namespace MyLib;

// 使用
func1();      // OK: using 声明
func2();      // OK: using 指令
```

### 匿名命名空间

```cpp
// 匿名命名空间中的内容只在当前翻译单元可见
namespace {
    int internalValue = 0;

    void internalFunction() {
        // 内部实现
    }
}

// 等价于 C 语言的 static
// static int internalValue = 0;
```

### 内联命名空间

```cpp
// 内联命名空间的成员可以直接从外层命名空间访问
namespace Library {
    inline namespace v2 {
        void feature() {
            // 版本 2 实现
        }
    }

    namespace v1 {
        void feature() {
            // 版本 1 实现
        }
    }
}

// 使用
Library::feature();     // 调用 v2::feature (内联版本)
Library::v1::feature(); // 显式调用 v1 版本
Library::v2::feature(); // 显式调用 v2 版本
```

## 代码示例

### 基本命名空间使用

```cpp
#include <iostream>
#include <string>

// 定义一个几何库的命名空间
namespace Geometry {
    const double PI = 3.14159265359;

    // 点结构
    struct Point {
        double x, y;

        Point(double x = 0, double y = 0) : x(x), y(y) {}
    };

    // 计算两点距离
    double distance(const Point& p1, const Point& p2) {
        double dx = p2.x - p1.x;
        double dy = p2.y - p1.y;
        return std::sqrt(dx * dx + dy * dy);
    }

    // 圆类
    class Circle {
    private:
        Point center;
        double radius;

    public:
        Circle(const Point& c, double r) : center(c), radius(r) {}

        double area() const {
            return PI * radius * radius;
        }

        double circumference() const {
            return 2 * PI * radius;
        }
    };
}

int main() {
    using Geometry::Point;
    using Geometry::Circle;

    Point p1(0, 0);
    Point p2(3, 4);

    std::cout << "两点距离: " << Geometry::distance(p1, p2) << std::endl;

    Circle circle(p1, 5);
    std::cout << "圆的面积: " << circle.area() << std::endl;
    std::cout << "圆的周长: " << circle.circumference() << std::endl;

    return 0;
}
```

### 嵌套命名空间示例

```cpp
#include <iostream>
#include <string>
#include <vector>

// 模拟一个游戏引擎的命名空间结构
namespace GameEngine {
    // 核心模块
    namespace Core {
        class Logger {
        public:
            static void log(const std::string& message) {
                std::cout << "[LOG] " << message << std::endl;
            }

            static void error(const std::string& message) {
                std::cout << "[ERROR] " << message << std::endl;
            }
        };
    }

    // 图形模块
    namespace Graphics {
        struct Color {
            float r, g, b, a;

            Color(float r = 0, float g = 0, float b = 0, float a = 1)
                : r(r), g(g), b(b), a(a) {}
        };

        class Renderer {
        public:
            void clear(const Color& color) {
                Core::Logger::log("Clearing screen with color");
            }

            void draw() {
                Core::Logger::log("Drawing frame");
            }
        };
    }

    // 物理模块
    namespace Physics {
        struct Vector3 {
            float x, y, z;

            Vector3(float x = 0, float y = 0, float z = 0)
                : x(x), y(y), z(z) {}

            Vector3 operator+(const Vector3& other) const {
                return Vector3(x + other.x, y + other.y, z + other.z);
            }
        };

        class RigidBody {
        private:
            Vector3 position;
            Vector3 velocity;

        public:
            void update(float deltaTime) {
                position = position + Vector3(
                    velocity.x * deltaTime,
                    velocity.y * deltaTime,
                    velocity.z * deltaTime
                );
            }
        };
    }
}

// C++17 简化语法定义嵌套命名空间
namespace GameEngine::Audio {
    class SoundEffect {
    private:
        std::string filename;

    public:
        SoundEffect(const std::string& file) : filename(file) {}

        void play() {
            Core::Logger::log("Playing sound: " + filename);
        }
    };
}

int main() {
    // 使用别名简化访问
    namespace GE = GameEngine;
    namespace GFX = GameEngine::Graphics;

    GE::Core::Logger::log("Game starting...");

    GFX::Renderer renderer;
    GFX::Color clearColor(0.2f, 0.3f, 0.8f, 1.0f);
    renderer.clear(clearColor);
    renderer.draw();

    GE::Physics::RigidBody body;
    body.update(0.016f);  // 约 60 FPS

    GE::Audio::SoundEffect sound("explosion.wav");
    sound.play();

    return 0;
}
```

### using 声明与指令的区别

```cpp
#include <iostream>
#include <string>

namespace A {
    void foo() { std::cout << "A::foo" << std::endl; }
    void bar() { std::cout << "A::bar" << std::endl; }
    int value = 10;
}

namespace B {
    void foo() { std::cout << "B::foo" << std::endl; }
    void baz() { std::cout << "B::baz" << std::endl; }
    int value = 20;
}

void demonstrateUsingDeclaration() {
    std::cout << "=== using 声明 ===" << std::endl;

    // using 声明：只引入特定的名称
    using A::foo;
    using A::value;

    foo();    // 调用 A::foo
    std::cout << "value = " << value << std::endl;  // A::value

    B::foo(); // 必须限定访问 B::foo
}

void demonstrateUsingDirective() {
    std::cout << "=== using 指令 ===" << std::endl;

    // using 指令：引入整个命名空间
    using namespace A;

    foo();    // 调用 A::foo
    bar();    // 调用 A::bar
    std::cout << "value = " << value << std::endl;
}

void demonstrateConflict() {
    std::cout << "=== 冲突处理 ===" << std::endl;

    // 同时引入两个命名空间可能导致歧义
    using namespace A;
    using namespace B;

    // foo();  // 错误：歧义，A::foo 还是 B::foo?

    // 解决方法：使用限定名称
    A::foo();
    B::foo();

    // 非冲突名称可以直接使用
    bar();  // A::bar
    baz();  // B::baz
}

int main() {
    demonstrateUsingDeclaration();
    demonstrateUsingDirective();
    demonstrateConflict();
    return 0;
}
```

### 匿名命名空间实现内部链接

```cpp
// === math_utils.cpp ===
#include <iostream>
#include <cmath>

// 匿名命名空间：内部实现细节
namespace {
    // 这些函数和变量只在本文件可见
    const double EPSILON = 1e-10;

    bool isNearZero(double value) {
        return std::abs(value) < EPSILON;
    }

    double clamp(double value, double min, double max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}

// 公开的命名空间
namespace MathUtils {
    double safeDivide(double a, double b) {
        if (isNearZero(b)) {  // 使用匿名命名空间的函数
            std::cerr << "Warning: Division by near-zero value" << std::endl;
            return 0.0;
        }
        return a / b;
    }

    double normalizeAngle(double angle) {
        // 将角度归一化到 [0, 360) 范围
        while (angle < 0) angle += 360.0;
        while (angle >= 360.0) angle -= 360.0;
        return clamp(angle, 0.0, 360.0);  // 使用匿名命名空间的函数
    }
}

// === main.cpp ===
// #include "math_utils.h"

int main() {
    std::cout << MathUtils::safeDivide(10.0, 3.0) << std::endl;
    std::cout << MathUtils::safeDivide(10.0, 0.0) << std::endl;
    std::cout << MathUtils::normalizeAngle(-45.0) << std::endl;
    std::cout << MathUtils::normalizeAngle(450.0) << std::endl;

    // isNearZero(0.0);  // 错误：匿名命名空间的函数不可访问

    return 0;
}
```

### 内联命名空间实现版本控制

```cpp
#include <iostream>
#include <string>

namespace MyLibrary {
    // 版本 1（旧版本）
    namespace v1 {
        class Widget {
        public:
            void process() {
                std::cout << "Widget v1: Basic processing" << std::endl;
            }
        };

        std::string getVersion() {
            return "1.0.0";
        }
    }

    // 版本 2（当前默认版本，使用 inline）
    inline namespace v2 {
        class Widget {
        public:
            void process() {
                std::cout << "Widget v2: Enhanced processing with optimizations" << std::endl;
            }

            void newFeature() {
                std::cout << "Widget v2: New feature available" << std::endl;
            }
        };

        std::string getVersion() {
            return "2.0.0";
        }
    }

    // 实验性版本
    namespace experimental {
        class Widget {
        public:
            void process() {
                std::cout << "Widget experimental: Cutting-edge features" << std::endl;
            }

            void unstableFeature() {
                std::cout << "Widget experimental: Unstable feature" << std::endl;
            }
        };
    }
}

int main() {
    // 默认使用内联命名空间 v2
    MyLibrary::Widget widget;
    widget.process();        // v2 版本
    widget.newFeature();     // v2 新功能

    std::cout << "Current version: " << MyLibrary::getVersion() << std::endl;

    // 显式使用旧版本
    MyLibrary::v1::Widget oldWidget;
    oldWidget.process();
    std::cout << "v1 version: " << MyLibrary::v1::getVersion() << std::endl;

    // 使用实验性版本
    MyLibrary::experimental::Widget expWidget;
    expWidget.process();
    expWidget.unstableFeature();

    return 0;
}
```

### 命名空间别名

```cpp
#include <iostream>
#include <vector>
#include <map>

// 深层嵌套的命名空间
namespace Company {
    namespace Department {
        namespace Project {
            namespace Module {
                class DataProcessor {
                public:
                    void process() {
                        std::cout << "Processing data..." << std::endl;
                    }
                };

                using DataMap = std::map<std::string, std::vector<int>>;
            }
        }
    }
}

// 使用命名空间别名简化访问
namespace CDP = Company::Department::Project;
namespace Module = Company::Department::Project::Module;

// 也可以在函数内部定义别名
void processData() {
    namespace M = Company::Department::Project::Module;

    M::DataProcessor processor;
    processor.process();

    M::DataMap data;
    data["sample"] = {1, 2, 3, 4, 5};
}

int main() {
    // 使用别名
    Module::DataProcessor processor;
    processor.process();

    Module::DataMap data;
    data["test"] = {10, 20, 30};

    // 也可以使用完整路径
    Company::Department::Project::Module::DataProcessor anotherProcessor;
    anotherProcessor.process();

    processData();

    return 0;
}
```

### 参数依赖查找（ADL）示例

```cpp
#include <iostream>

namespace Graphics {
    class Image {
    public:
        int width, height;

        Image(int w, int h) : width(w), height(h) {}
    };

    // 这个函数会通过 ADL 被找到
    void process(const Image& img) {
        std::cout << "Processing image: " << img.width << "x" << img.height << std::endl;
    }

    // 重载输出运算符
    std::ostream& operator<<(std::ostream& os, const Image& img) {
        return os << "Image(" << img.width << ", " << img.height << ")";
    }
}

namespace Audio {
    class Sound {
    public:
        std::string name;
        double duration;

        Sound(const std::string& n, double d) : name(n), duration(d) {}
    };

    void process(const Sound& sound) {
        std::cout << "Processing sound: " << sound.name
                  << " (" << sound.duration << "s)" << std::endl;
    }

    std::ostream& operator<<(std::ostream& os, const Sound& sound) {
        return os << "Sound(" << sound.name << ", " << sound.duration << "s)";
    }
}

int main() {
    Graphics::Image img(1920, 1080);
    Audio::Sound sound("bgm.mp3", 180.5);

    // ADL：根据参数类型自动查找正确的函数
    process(img);    // 调用 Graphics::process
    process(sound);  // 调用 Audio::process

    // ADL 也适用于运算符
    std::cout << img << std::endl;    // 调用 Graphics::operator<<
    std::cout << sound << std::endl;  // 调用 Audio::operator<<

    return 0;
}
```

## 最佳实践

### 避免在头文件中使用 using namespace

```cpp
// === 错误做法 ===
// myheader.h
#include <string>
using namespace std;  // 不要这样做！会污染所有包含此头文件的代码

class MyClass {
    string name;  // 依赖 using namespace std
};

// === 正确做法 ===
// myheader.h
#include <string>

class MyClass {
    std::string name;  // 使用完整限定名称
};

// 或者在类/函数作用域内使用
class AnotherClass {
    using std::string;  // 只在类作用域内有效
    string name;
};
```

### 合理组织命名空间结构

```cpp
// 好的组织方式
namespace MyProject {
    // 公共接口
    namespace API {
        class PublicInterface {};
    }

    // 内部实现
    namespace Internal {
        class ImplementationDetail {};
    }

    // 工具函数
    namespace Utils {
        void helperFunction();
    }
}

// 使用匿名命名空间隐藏实现细节
namespace MyProject {
    namespace {
        // 真正的内部实现，其他翻译单元不可见
        void privateHelper() {}
    }
}
```

### 使用命名空间别名提高可读性

```cpp
#include <filesystem>
#include <chrono>

// 为长命名空间创建别名
namespace fs = std::filesystem;
namespace chrono = std::chrono;

void example() {
    fs::path p = "/home/user/documents";

    auto start = chrono::high_resolution_clock::now();
    // ... 操作
    auto end = chrono::high_resolution_clock::now();

    auto duration = chrono::duration_cast<chrono::milliseconds>(end - start);
}
```

### 使用内联命名空间进行 API 版本控制

```cpp
namespace MyLibrary {
    // 版本化的 API
    inline namespace v2_0 {
        void newFunction();
        class ImprovedClass {};
    }

    namespace v1_0 {
        void oldFunction();
        class OriginalClass {};
    }

    // 用户代码默认使用 v2_0
    // MyLibrary::newFunction()  -> v2_0::newFunction
    // MyLibrary::v1_0::oldFunction() -> 显式使用旧版本
}
```

### 函数实现放在命名空间外部

```cpp
// 头文件
namespace Math {
    double calculate(double x, double y);

    class Calculator {
    public:
        double compute(double x);
    };
}

// 实现文件
double Math::calculate(double x, double y) {
    return x + y;
}

double Math::Calculator::compute(double x) {
    return x * x;
}
```

## 常见陷阱

### 命名空间污染

```cpp
// 陷阱：在头文件中使用 using namespace
// header.h
#include <vector>
using namespace std;  // 危险！

// 任何包含此头文件的代码都会受到影响
// 可能导致意外的名称冲突

// 解决方案：只在实现文件的局部作用域使用
void function() {
    using namespace std;  // 只在此函数内有效
    vector<int> v;
}
```

### 名称查找的意外行为

```cpp
namespace A {
    void foo(int) { std::cout << "A::foo(int)" << std::endl; }
}

namespace B {
    void foo(double) { std::cout << "B::foo(double)" << std::endl; }

    void test() {
        using A::foo;  // 引入 A::foo
        foo(1.5);      // 调用 A::foo(int)，而不是 B::foo(double)！
                       // 因为 using 声明隐藏了 B::foo
    }
}

// 解决方案：显式调用或不使用 using 声明
namespace C {
    void foo(double) { std::cout << "C::foo(double)" << std::endl; }

    void test() {
        A::foo(1);      // 明确调用 A::foo
        foo(1.5);       // 调用 C::foo
    }
}
```

### ADL 带来的意外问题

```cpp
namespace N {
    class MyClass {};

    void swap(MyClass& a, MyClass& b) {
        std::cout << "N::swap" << std::endl;
    }
}

void example() {
    N::MyClass a, b;

    // 陷阱：这会调用 N::swap 而不是 std::swap
    using std::swap;
    swap(a, b);  // ADL 找到 N::swap

    // 如果你确实想用 std::swap
    std::swap(a, b);  // 强制使用 std::swap
}
```

### 匿名命名空间与 ODR

```cpp
// 陷阱：不同翻译单元中的匿名命名空间是独立的

// file1.cpp
namespace {
    int counter = 0;  // file1 的 counter
}
void increment1() { counter++; }

// file2.cpp
namespace {
    int counter = 0;  // file2 的 counter（与 file1 的不同！）
}
void increment2() { counter++; }

// 这两个 counter 是完全独立的变量
```

### 循环依赖

```cpp
// 陷阱：命名空间之间的循环依赖

// a.h
namespace A {
    class ClassA;
}
#include "b.h"  // B 依赖 A
namespace A {
    class ClassA {
        B::ClassB* b;  // A 也依赖 B
    };
}

// 解决方案：使用前向声明
// a.h
namespace B { class ClassB; }  // 前向声明
namespace A {
    class ClassA {
        B::ClassB* b;  // OK: 只需要指针
    };
}
```

## 性能考量

### 命名空间的零开销

命名空间是纯粹的编译期机制，不会产生任何运行时开销：

```cpp
namespace MyNamespace {
    void function() {}
}

// 编译后，MyNamespace::function 和全局 function
// 在性能上没有任何区别
// 命名空间只影响名称修饰，不影响生成的机器码
```

### 内联命名空间与符号

```cpp
// 内联命名空间会影响 ABI 兼容性
namespace Library {
    inline namespace v2 {
        void function();  // 符号名包含 v2
    }
}

// 当切换默认版本时，符号会改变
// 这有助于避免链接到不兼容的库版本
```

### 编译时间影响

```cpp
// 使用 using namespace 可能增加编译时间
// 因为编译器需要在更大的名称集合中查找

// 较快
std::vector<int> v;

// 可能稍慢（编译器需要在整个 std 中查找 vector）
using namespace std;
vector<int> v;

// 对于大型项目，建议使用明确的限定名称或 using 声明
using std::vector;
vector<int> v;
```

## 实战场景

### 场景一：库开发

```cpp
// mymath.h - 数学库
#ifndef MYMATH_H
#define MYMATH_H

namespace MyMath {
    // 常量
    namespace Constants {
        constexpr double PI = 3.14159265358979323846;
        constexpr double E = 2.71828182845904523536;
        constexpr double SQRT2 = 1.41421356237309504880;
    }

    // 基础数学函数
    namespace Basic {
        double abs(double x);
        double sqrt(double x);
        double pow(double base, double exp);
    }

    // 三角函数
    namespace Trig {
        double sin(double x);
        double cos(double x);
        double tan(double x);
        double asin(double x);
        double acos(double x);
        double atan(double x);
    }

    // 统计函数
    namespace Stats {
        double mean(const double* data, size_t n);
        double variance(const double* data, size_t n);
        double stddev(const double* data, size_t n);
    }
}

#endif // MYMATH_H

// 使用示例
#include <iostream>
// #include "mymath.h"

int main() {
    namespace MM = MyMath;

    double radius = 5.0;
    double area = MM::Constants::PI * MM::Basic::pow(radius, 2);

    std::cout << "Circle area: " << area << std::endl;
    std::cout << "sin(PI/4) = " << MM::Trig::sin(MM::Constants::PI / 4) << std::endl;

    return 0;
}
```

### 场景二：插件系统

```cpp
#include <iostream>
#include <string>
#include <memory>
#include <map>
#include <functional>

// 插件系统框架
namespace PluginSystem {
    // 插件基类
    class IPlugin {
    public:
        virtual ~IPlugin() = default;
        virtual std::string getName() const = 0;
        virtual void execute() = 0;
    };

    // 插件注册表
    namespace Registry {
        using PluginFactory = std::function<std::unique_ptr<IPlugin>()>;

        inline std::map<std::string, PluginFactory>& getRegistry() {
            static std::map<std::string, PluginFactory> registry;
            return registry;
        }

        inline void registerPlugin(const std::string& name, PluginFactory factory) {
            getRegistry()[name] = factory;
        }

        inline std::unique_ptr<IPlugin> createPlugin(const std::string& name) {
            auto it = getRegistry().find(name);
            if (it != getRegistry().end()) {
                return it->second();
            }
            return nullptr;
        }
    }
}

// 具体插件实现
namespace Plugins {
    namespace ImageProcessing {
        class BlurPlugin : public PluginSystem::IPlugin {
        public:
            std::string getName() const override { return "Blur"; }
            void execute() override {
                std::cout << "Applying blur effect..." << std::endl;
            }
        };

        class SharpenPlugin : public PluginSystem::IPlugin {
        public:
            std::string getName() const override { return "Sharpen"; }
            void execute() override {
                std::cout << "Applying sharpen effect..." << std::endl;
            }
        };
    }

    namespace Audio {
        class ReverbPlugin : public PluginSystem::IPlugin {
        public:
            std::string getName() const override { return "Reverb"; }
            void execute() override {
                std::cout << "Applying reverb effect..." << std::endl;
            }
        };
    }
}

// 注册插件
namespace {
    struct PluginRegistrar {
        PluginRegistrar() {
            using namespace PluginSystem::Registry;
            using namespace Plugins;

            registerPlugin("blur", []{
                return std::make_unique<ImageProcessing::BlurPlugin>();
            });
            registerPlugin("sharpen", []{
                return std::make_unique<ImageProcessing::SharpenPlugin>();
            });
            registerPlugin("reverb", []{
                return std::make_unique<Audio::ReverbPlugin>();
            });
        }
    } registrar;
}

int main() {
    namespace PS = PluginSystem;

    auto blur = PS::Registry::createPlugin("blur");
    if (blur) {
        std::cout << "Plugin: " << blur->getName() << std::endl;
        blur->execute();
    }

    auto reverb = PS::Registry::createPlugin("reverb");
    if (reverb) {
        std::cout << "Plugin: " << reverb->getName() << std::endl;
        reverb->execute();
    }

    return 0;
}
```

### 场景三：跨平台代码组织

```cpp
#include <iostream>
#include <string>

// 平台抽象层
namespace Platform {
    // 通用接口
    namespace Common {
        class IFileSystem {
        public:
            virtual ~IFileSystem() = default;
            virtual bool exists(const std::string& path) = 0;
            virtual std::string read(const std::string& path) = 0;
            virtual void write(const std::string& path, const std::string& content) = 0;
        };
    }

    // Windows 实现
    namespace Windows {
        class FileSystem : public Common::IFileSystem {
        public:
            bool exists(const std::string& path) override {
                std::cout << "[Windows] Checking: " << path << std::endl;
                return true;
            }

            std::string read(const std::string& path) override {
                std::cout << "[Windows] Reading: " << path << std::endl;
                return "Windows file content";
            }

            void write(const std::string& path, const std::string& content) override {
                std::cout << "[Windows] Writing to: " << path << std::endl;
            }
        };
    }

    // Linux 实现
    namespace Linux {
        class FileSystem : public Common::IFileSystem {
        public:
            bool exists(const std::string& path) override {
                std::cout << "[Linux] Checking: " << path << std::endl;
                return true;
            }

            std::string read(const std::string& path) override {
                std::cout << "[Linux] Reading: " << path << std::endl;
                return "Linux file content";
            }

            void write(const std::string& path, const std::string& content) override {
                std::cout << "[Linux] Writing to: " << path << std::endl;
            }
        };
    }

    // 平台选择
    #ifdef _WIN32
        inline namespace Current { using FileSystem = Windows::FileSystem; }
    #else
        inline namespace Current { using FileSystem = Linux::FileSystem; }
    #endif
}

int main() {
    // 使用当前平台的实现
    Platform::FileSystem fs;

    if (fs.exists("/home/user/file.txt")) {
        std::string content = fs.read("/home/user/file.txt");
        std::cout << "Content: " << content << std::endl;
    }

    fs.write("/home/user/output.txt", "Hello, World!");

    return 0;
}
```

## 面试要点

### 常见面试问题

**Q1: 命名空间和类的作用域有什么区别？**

```cpp
// 命名空间：纯粹的名称组织机制，不能实例化
namespace MyNamespace {
    int value;
    void func() {}
}

// 类：封装数据和行为，可以实例化
class MyClass {
public:
    int value;
    void func() {}
};

// 主要区别：
// 1. 命名空间可以跨多个文件定义，类不能
// 2. 命名空间没有访问控制（public/private），类有
// 3. 类可以实例化，命名空间不能
// 4. 类可以继承，命名空间不能
```

**Q2: using 声明和 using 指令的区别是什么？**

```cpp
namespace A {
    void foo() {}
    void bar() {}
}

// using 声明：引入单个名称
using A::foo;  // 只引入 foo

// using 指令：引入整个命名空间
using namespace A;  // 引入所有名称

// 区别：
// 1. using 声明更精确，只引入需要的名称
// 2. using 指令可能导致名称冲突
// 3. using 声明在作用域内会隐藏同名的外部名称
// 4. using 指令不会隐藏名称，可能导致歧义
```

**Q3: 什么是 ADL（参数依赖查找）？**

```cpp
namespace N {
    class C {};
    void func(C) { std::cout << "N::func" << std::endl; }
}

int main() {
    N::C obj;
    func(obj);  // ADL 找到 N::func

    // ADL 的工作原理：
    // 编译器查看参数 obj 的类型 N::C
    // 自动在命名空间 N 中查找 func

    return 0;
}
```

**Q4: 匿名命名空间和 static 的区别？**

```cpp
// static（C 风格）
static void helper() {}  // 内部链接

// 匿名命名空间（C++ 风格）
namespace {
    void helper() {}  // 也是内部链接
}

// 区别：
// 1. 匿名命名空间可以包含类型定义
// 2. 匿名命名空间更清晰地表达"内部使用"的意图
// 3. static 只能用于变量和函数，不能用于类型
// 4. C++ 标准推荐使用匿名命名空间
```

**Q5: 内联命名空间有什么作用？**

```cpp
namespace Library {
    inline namespace v2 {
        void func() {}  // 默认版本
    }
    namespace v1 {
        void func() {}  // 旧版本
    }
}

// 用途：
// 1. API 版本控制
// 2. ABI 兼容性管理
// 3. 特性标志（feature flags）

Library::func();      // 调用 v2::func
Library::v1::func();  // 显式调用旧版本
```

### 编码练习题

**练习1：设计一个使用命名空间的日志库**

```cpp
#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>

namespace Logging {
    // 日志级别
    enum class Level {
        DEBUG,
        INFO,
        WARNING,
        ERROR
    };

    // 内部实现
    namespace Internal {
        inline std::string levelToString(Level level) {
            switch (level) {
                case Level::DEBUG:   return "DEBUG";
                case Level::INFO:    return "INFO";
                case Level::WARNING: return "WARNING";
                case Level::ERROR:   return "ERROR";
                default:             return "UNKNOWN";
            }
        }

        inline std::string getCurrentTime() {
            auto now = std::chrono::system_clock::now();
            auto time = std::chrono::system_clock::to_time_t(now);
            std::stringstream ss;
            ss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S");
            return ss.str();
        }
    }

    // 公共 API
    inline void log(Level level, const std::string& message) {
        std::cout << "[" << Internal::getCurrentTime() << "] "
                  << "[" << Internal::levelToString(level) << "] "
                  << message << std::endl;
    }

    // 便捷函数
    inline void debug(const std::string& msg) { log(Level::DEBUG, msg); }
    inline void info(const std::string& msg) { log(Level::INFO, msg); }
    inline void warning(const std::string& msg) { log(Level::WARNING, msg); }
    inline void error(const std::string& msg) { log(Level::ERROR, msg); }
}

int main() {
    Logging::debug("This is a debug message");
    Logging::info("Application started");
    Logging::warning("Resource usage high");
    Logging::error("Connection failed");

    return 0;
}
```

**练习2：使用命名空间实现策略模式**

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

namespace Sorting {
    // 策略接口
    namespace Strategy {
        template<typename T>
        using Comparator = bool(*)(const T&, const T&);

        template<typename T>
        bool ascending(const T& a, const T& b) {
            return a < b;
        }

        template<typename T>
        bool descending(const T& a, const T& b) {
            return a > b;
        }
    }

    // 排序实现
    namespace Algorithms {
        template<typename T>
        void bubbleSort(std::vector<T>& arr, Strategy::Comparator<T> comp) {
            for (size_t i = 0; i < arr.size(); ++i) {
                for (size_t j = 0; j < arr.size() - i - 1; ++j) {
                    if (comp(arr[j + 1], arr[j])) {
                        std::swap(arr[j], arr[j + 1]);
                    }
                }
            }
        }
    }

    // 便捷函数
    template<typename T>
    void sortAscending(std::vector<T>& arr) {
        Algorithms::bubbleSort(arr, Strategy::ascending<T>);
    }

    template<typename T>
    void sortDescending(std::vector<T>& arr) {
        Algorithms::bubbleSort(arr, Strategy::descending<T>);
    }
}

int main() {
    std::vector<int> nums = {5, 2, 8, 1, 9, 3};

    Sorting::sortAscending(nums);
    std::cout << "Ascending: ";
    for (int n : nums) std::cout << n << " ";
    std::cout << std::endl;

    Sorting::sortDescending(nums);
    std::cout << "Descending: ";
    for (int n : nums) std::cout << n << " ";
    std::cout << std::endl;

    return 0;
}
```

## 延伸阅读

### 相关主题

- **模块（C++20）**：比命名空间更强大的代码组织机制
- **头文件组织**：如何在头文件中正确使用命名空间
- **链接与符号**：理解命名空间如何影响符号解析

### 推荐资源

1. **C++ 标准文档**：ISO/IEC 14882 关于命名空间的章节
2. **《Effective C++》**：Scott Meyers 关于命名空间使用的建议
3. **《C++ Primer》**：命名空间基础和高级用法详解
4. **cppreference.com**：命名空间的完整参考文档

### 标准库中的命名空间

```cpp
// 标准库使用的命名空间组织
namespace std {
    // 字符串处理
    // string, string_view, etc.

    // 容器
    // vector, map, set, etc.

    // 算法
    // sort, find, transform, etc.

    // 文件系统 (C++17)
    namespace filesystem { /* ... */ }

    // 时间处理
    namespace chrono { /* ... */ }

    // 正则表达式
    namespace regex_constants { /* ... */ }

    // 执行策略 (C++17)
    namespace execution { /* ... */ }

    // 范围 (C++20)
    namespace ranges { /* ... */ }
    namespace views { /* ... */ }
}
```

## 总结

C++ 命名空间是组织和管理代码的重要机制，主要特点包括：

### 核心功能

- **名称隔离**：防止不同库之间的命名冲突
- **代码组织**：将相关功能分组，提高可读性
- **版本控制**：通过内联命名空间管理 API 版本

### 关键概念

- **嵌套命名空间**：支持层次化的代码组织（C++17 简化语法）
- **using 声明/指令**：控制名称的引入方式
- **匿名命名空间**：实现内部链接，替代 static
- **内联命名空间**：支持透明的版本升级

### 最佳实践

1. 避免在头文件中使用 `using namespace`
2. 使用命名空间别名简化长名称
3. 利用匿名命名空间隐藏实现细节
4. 通过内联命名空间进行 API 版本管理
5. 理解 ADL 的工作机制，避免意外行为

命名空间是 C++ 程序设计中不可或缺的工具，合理使用可以显著提高大型项目的代码质量和可维护性。
