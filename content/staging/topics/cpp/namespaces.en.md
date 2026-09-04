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
origin: old/src/content/docs/cpp/namespaces.en.md
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

Namespaces are an important mechanism in C++ for organizing code and preventing name conflicts. They divide the global scope into independent, named regions, making code management in large projects clearer and safer.

## Concept Explanation

### What is a Namespace

A namespace is a declarative region that provides a scope for the identifiers (types, functions, variables, etc.) inside it. Its main purposes are:

1. **Avoiding name conflicts**: Different libraries may define functions or classes with the same name, and namespaces can distinguish them
2. **Organizing code**: Group related code logic together to improve code readability
3. **Controlling visibility**: Provide finer access control than the global scope

### Historical Background

In C, all global identifiers exist in a single global namespace, which can easily lead to name conflicts in large projects. C++ introduced the namespace mechanism (C++98 standard), allowing programmers to organize code into different logical groups, solving this problem.

```cpp
// C style: using prefixes to avoid conflicts
void mylib_init();
void mylib_process();

// C++ style: using namespaces
namespace mylib {
    void init();
    void process();
}
```

## Core Principles

### How Namespaces Work

The compiler uses name mangling to distinguish identifiers with the same name in different namespaces. Each identifier in a namespace has its fully qualified name.

```cpp
namespace A {
    void func() {}  // Full name: A::func
}

namespace B {
    void func() {}  // Full name: B::func
}
```

### Scope Resolution Operator

The scope resolution operator `::` is used to access members in a specific namespace:

```cpp
#include <iostream>

namespace Math {
    const double PI = 3.14159265359;

    double square(double x) {
        return x * x;
    }
}

int main() {
    // Using scope resolution operator to access namespace members
    std::cout << "PI = " << Math::PI << std::endl;
    std::cout << "5^2 = " << Math::square(5) << std::endl;
    return 0;
}
```

### Name Lookup Rules

C++ name lookup follows these rules:

1. **Qualified name lookup**: Names specified with `::` are looked up directly in the specified scope
2. **Unqualified name lookup**: Starting from the current scope, search outward through enclosing scopes
3. **Argument-Dependent Lookup (ADL)**: Functions are looked up based on the namespaces where the function argument types are defined

```cpp
#include <iostream>

namespace N {
    class MyClass {
    public:
        int value;
    };

    // ADL will find this function
    void process(MyClass& obj) {
        std::cout << "Processing in namespace N" << std::endl;
    }
}

int main() {
    N::MyClass obj;
    process(obj);  // ADL: because obj's type is in N, it finds N::process
    return 0;
}
```

## Key Points

### Namespace Definition

```cpp
// Basic namespace definition
namespace MyNamespace {
    int value = 42;

    void function() {
        // Implementation
    }

    class MyClass {
        // Class definition
    };
}

// Namespaces can be spread across multiple files
// file1.cpp
namespace Utils {
    void helper1() {}
}

// file2.cpp
namespace Utils {
    void helper2() {}  // In the same namespace as helper1
}
```

### Nested Namespaces

```cpp
// Traditional way
namespace Outer {
    namespace Inner {
        namespace Deep {
            void function() {}
        }
    }
}

// C++17 simplified syntax
namespace Outer::Inner::Deep {
    void anotherFunction() {}
}

// Access methods
Outer::Inner::Deep::function();
Outer::Inner::Deep::anotherFunction();
```

### Using Declarations and Directives

```cpp
namespace MyLib {
    void func1() {}
    void func2() {}
    int value = 100;
}

// using declaration: introduces a single name
using MyLib::func1;

// using directive: introduces the entire namespace
using namespace MyLib;

// Usage
func1();      // OK: using declaration
func2();      // OK: using directive
```

### Anonymous Namespaces

```cpp
// Contents in anonymous namespaces are only visible in the current translation unit
namespace {
    int internalValue = 0;

    void internalFunction() {
        // Internal implementation
    }
}

// Equivalent to C's static
// static int internalValue = 0;
```

### Inline Namespaces

```cpp
// Members of inline namespaces can be accessed directly from the enclosing namespace
namespace Library {
    inline namespace v2 {
        void feature() {
            // Version 2 implementation
        }
    }

    namespace v1 {
        void feature() {
            // Version 1 implementation
        }
    }
}

// Usage
Library::feature();     // Calls v2::feature (inline version)
Library::v1::feature(); // Explicitly calls v1 version
Library::v2::feature(); // Explicitly calls v2 version
```

## Code Examples

### Basic Namespace Usage

```cpp
#include <iostream>
#include <string>

// Define a namespace for a geometry library
namespace Geometry {
    const double PI = 3.14159265359;

    // Point structure
    struct Point {
        double x, y;

        Point(double x = 0, double y = 0) : x(x), y(y) {}
    };

    // Calculate distance between two points
    double distance(const Point& p1, const Point& p2) {
        double dx = p2.x - p1.x;
        double dy = p2.y - p1.y;
        return std::sqrt(dx * dx + dy * dy);
    }

    // Circle class
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

    std::cout << "Distance between two points: " << Geometry::distance(p1, p2) << std::endl;

    Circle circle(p1, 5);
    std::cout << "Circle area: " << circle.area() << std::endl;
    std::cout << "Circle circumference: " << circle.circumference() << std::endl;

    return 0;
}
```

### Nested Namespace Example

```cpp
#include <iostream>
#include <string>
#include <vector>

// Simulating a game engine namespace structure
namespace GameEngine {
    // Core module
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

    // Graphics module
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

    // Physics module
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

// C++17 simplified syntax for defining nested namespaces
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
    // Using aliases to simplify access
    namespace GE = GameEngine;
    namespace GFX = GameEngine::Graphics;

    GE::Core::Logger::log("Game starting...");

    GFX::Renderer renderer;
    GFX::Color clearColor(0.2f, 0.3f, 0.8f, 1.0f);
    renderer.clear(clearColor);
    renderer.draw();

    GE::Physics::RigidBody body;
    body.update(0.016f);  // Approximately 60 FPS

    GE::Audio::SoundEffect sound("explosion.wav");
    sound.play();

    return 0;
}
```

### Difference Between Using Declarations and Directives

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
    std::cout << "=== using declaration ===" << std::endl;

    // using declaration: introduces only specific names
    using A::foo;
    using A::value;

    foo();    // Calls A::foo
    std::cout << "value = " << value << std::endl;  // A::value

    B::foo(); // Must use qualified name to access B::foo
}

void demonstrateUsingDirective() {
    std::cout << "=== using directive ===" << std::endl;

    // using directive: introduces the entire namespace
    using namespace A;

    foo();    // Calls A::foo
    bar();    // Calls A::bar
    std::cout << "value = " << value << std::endl;
}

void demonstrateConflict() {
    std::cout << "=== conflict handling ===" << std::endl;

    // Introducing two namespaces at once may cause ambiguity
    using namespace A;
    using namespace B;

    // foo();  // Error: ambiguous, A::foo or B::foo?

    // Solution: use qualified names
    A::foo();
    B::foo();

    // Non-conflicting names can be used directly
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

### Anonymous Namespaces for Internal Linkage

```cpp
// === math_utils.cpp ===
#include <iostream>
#include <cmath>

// Anonymous namespace: internal implementation details
namespace {
    // These functions and variables are only visible in this file
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

// Public namespace
namespace MathUtils {
    double safeDivide(double a, double b) {
        if (isNearZero(b)) {  // Using function from anonymous namespace
            std::cerr << "Warning: Division by near-zero value" << std::endl;
            return 0.0;
        }
        return a / b;
    }

    double normalizeAngle(double angle) {
        // Normalize angle to [0, 360) range
        while (angle < 0) angle += 360.0;
        while (angle >= 360.0) angle -= 360.0;
        return clamp(angle, 0.0, 360.0);  // Using function from anonymous namespace
    }
}

// === main.cpp ===
// #include "math_utils.h"

int main() {
    std::cout << MathUtils::safeDivide(10.0, 3.0) << std::endl;
    std::cout << MathUtils::safeDivide(10.0, 0.0) << std::endl;
    std::cout << MathUtils::normalizeAngle(-45.0) << std::endl;
    std::cout << MathUtils::normalizeAngle(450.0) << std::endl;

    // isNearZero(0.0);  // Error: function from anonymous namespace is not accessible

    return 0;
}
```

### Inline Namespaces for Version Control

```cpp
#include <iostream>
#include <string>

namespace MyLibrary {
    // Version 1 (old version)
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

    // Version 2 (current default version, using inline)
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

    // Experimental version
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
    // Default uses inline namespace v2
    MyLibrary::Widget widget;
    widget.process();        // v2 version
    widget.newFeature();     // v2 new feature

    std::cout << "Current version: " << MyLibrary::getVersion() << std::endl;

    // Explicitly use old version
    MyLibrary::v1::Widget oldWidget;
    oldWidget.process();
    std::cout << "v1 version: " << MyLibrary::v1::getVersion() << std::endl;

    // Use experimental version
    MyLibrary::experimental::Widget expWidget;
    expWidget.process();
    expWidget.unstableFeature();

    return 0;
}
```

### Namespace Aliases

```cpp
#include <iostream>
#include <vector>
#include <map>

// Deeply nested namespaces
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

// Using namespace aliases to simplify access
namespace CDP = Company::Department::Project;
namespace Module = Company::Department::Project::Module;

// Aliases can also be defined inside functions
void processData() {
    namespace M = Company::Department::Project::Module;

    M::DataProcessor processor;
    processor.process();

    M::DataMap data;
    data["sample"] = {1, 2, 3, 4, 5};
}

int main() {
    // Using aliases
    Module::DataProcessor processor;
    processor.process();

    Module::DataMap data;
    data["test"] = {10, 20, 30};

    // Can also use full path
    Company::Department::Project::Module::DataProcessor anotherProcessor;
    anotherProcessor.process();

    processData();

    return 0;
}
```

### Argument-Dependent Lookup (ADL) Example

```cpp
#include <iostream>

namespace Graphics {
    class Image {
    public:
        int width, height;

        Image(int w, int h) : width(w), height(h) {}
    };

    // This function will be found through ADL
    void process(const Image& img) {
        std::cout << "Processing image: " << img.width << "x" << img.height << std::endl;
    }

    // Overload output operator
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

    // ADL: automatically finds the correct function based on argument types
    process(img);    // Calls Graphics::process
    process(sound);  // Calls Audio::process

    // ADL also applies to operators
    std::cout << img << std::endl;    // Calls Graphics::operator<<
    std::cout << sound << std::endl;  // Calls Audio::operator<<

    return 0;
}
```

## Best Practices

### Avoid Using namespace in Header Files

```cpp
// === Wrong approach ===
// myheader.h
#include <string>
using namespace std;  // Don't do this! It pollutes all code that includes this header

class MyClass {
    string name;  // Depends on using namespace std
};

// === Correct approach ===
// myheader.h
#include <string>

class MyClass {
    std::string name;  // Use fully qualified name
};

// Or use within class/function scope
class AnotherClass {
    using std::string;  // Only effective within class scope
    string name;
};
```

### Organize Namespace Structure Properly

```cpp
// Good organization
namespace MyProject {
    // Public interface
    namespace API {
        class PublicInterface {};
    }

    // Internal implementation
    namespace Internal {
        class ImplementationDetail {};
    }

    // Utility functions
    namespace Utils {
        void helperFunction();
    }
}

// Use anonymous namespaces to hide implementation details
namespace MyProject {
    namespace {
        // True internal implementation, not visible to other translation units
        void privateHelper() {}
    }
}
```

### Use Namespace Aliases to Improve Readability

```cpp
#include <filesystem>
#include <chrono>

// Create aliases for long namespaces
namespace fs = std::filesystem;
namespace chrono = std::chrono;

void example() {
    fs::path p = "/home/user/documents";

    auto start = chrono::high_resolution_clock::now();
    // ... operations
    auto end = chrono::high_resolution_clock::now();

    auto duration = chrono::duration_cast<chrono::milliseconds>(end - start);
}
```

### Use Inline Namespaces for API Versioning

```cpp
namespace MyLibrary {
    // Versioned API
    inline namespace v2_0 {
        void newFunction();
        class ImprovedClass {};
    }

    namespace v1_0 {
        void oldFunction();
        class OriginalClass {};
    }

    // User code defaults to v2_0
    // MyLibrary::newFunction()  -> v2_0::newFunction
    // MyLibrary::v1_0::oldFunction() -> explicitly use old version
}
```

### Place Function Implementations Outside Namespaces

```cpp
// Header file
namespace Math {
    double calculate(double x, double y);

    class Calculator {
    public:
        double compute(double x);
    };
}

// Implementation file
double Math::calculate(double x, double y) {
    return x + y;
}

double Math::Calculator::compute(double x) {
    return x * x;
}
```

## Common Pitfalls

### Namespace Pollution

```cpp
// Pitfall: using namespace in header files
// header.h
#include <vector>
using namespace std;  // Dangerous!

// Any code that includes this header will be affected
// May cause unexpected name conflicts

// Solution: only use in local scope of implementation files
void function() {
    using namespace std;  // Only effective within this function
    vector<int> v;
}
```

### Unexpected Name Lookup Behavior

```cpp
namespace A {
    void foo(int) { std::cout << "A::foo(int)" << std::endl; }
}

namespace B {
    void foo(double) { std::cout << "B::foo(double)" << std::endl; }

    void test() {
        using A::foo;  // Introduce A::foo
        foo(1.5);      // Calls A::foo(int), not B::foo(double)!
                       // Because the using declaration hides B::foo
    }
}

// Solution: call explicitly or don't use using declaration
namespace C {
    void foo(double) { std::cout << "C::foo(double)" << std::endl; }

    void test() {
        A::foo(1);      // Explicitly call A::foo
        foo(1.5);       // Calls C::foo
    }
}
```

### Unexpected Issues with ADL

```cpp
namespace N {
    class MyClass {};

    void swap(MyClass& a, MyClass& b) {
        std::cout << "N::swap" << std::endl;
    }
}

void example() {
    N::MyClass a, b;

    // Pitfall: this calls N::swap instead of std::swap
    using std::swap;
    swap(a, b);  // ADL finds N::swap

    // If you really want to use std::swap
    std::swap(a, b);  // Force use of std::swap
}
```

### Anonymous Namespaces and ODR

```cpp
// Pitfall: anonymous namespaces in different translation units are independent

// file1.cpp
namespace {
    int counter = 0;  // file1's counter
}
void increment1() { counter++; }

// file2.cpp
namespace {
    int counter = 0;  // file2's counter (different from file1's!)
}
void increment2() { counter++; }

// These two counters are completely independent variables
```

### Circular Dependencies

```cpp
// Pitfall: circular dependencies between namespaces

// a.h
namespace A {
    class ClassA;
}
#include "b.h"  // B depends on A
namespace A {
    class ClassA {
        B::ClassB* b;  // A also depends on B
    };
}

// Solution: use forward declarations
// a.h
namespace B { class ClassB; }  // Forward declaration
namespace A {
    class ClassA {
        B::ClassB* b;  // OK: only needs pointer
    };
}
```

## Performance Considerations

### Zero Overhead of Namespaces

Namespaces are purely a compile-time mechanism and incur no runtime overhead:

```cpp
namespace MyNamespace {
    void function() {}
}

// After compilation, MyNamespace::function and a global function
// have no performance difference
// Namespaces only affect name mangling, not the generated machine code
```

### Inline Namespaces and Symbols

```cpp
// Inline namespaces affect ABI compatibility
namespace Library {
    inline namespace v2 {
        void function();  // Symbol name includes v2
    }
}

// When switching default versions, symbols will change
// This helps avoid linking to incompatible library versions
```

### Compile Time Impact

```cpp
// Using namespace may increase compile time
// Because the compiler needs to search in a larger set of names

// Faster
std::vector<int> v;

// Potentially slower (compiler needs to search for vector in entire std)
using namespace std;
vector<int> v;

// For large projects, it's recommended to use explicit qualified names or using declarations
using std::vector;
vector<int> v;
```

## Practical Scenarios

### Scenario 1: Library Development

```cpp
// mymath.h - Math library
#ifndef MYMATH_H
#define MYMATH_H

namespace MyMath {
    // Constants
    namespace Constants {
        constexpr double PI = 3.14159265358979323846;
        constexpr double E = 2.71828182845904523536;
        constexpr double SQRT2 = 1.41421356237309504880;
    }

    // Basic math functions
    namespace Basic {
        double abs(double x);
        double sqrt(double x);
        double pow(double base, double exp);
    }

    // Trigonometric functions
    namespace Trig {
        double sin(double x);
        double cos(double x);
        double tan(double x);
        double asin(double x);
        double acos(double x);
        double atan(double x);
    }

    // Statistics functions
    namespace Stats {
        double mean(const double* data, size_t n);
        double variance(const double* data, size_t n);
        double stddev(const double* data, size_t n);
    }
}

#endif // MYMATH_H

// Usage example
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

### Scenario 2: Plugin System

```cpp
#include <iostream>
#include <string>
#include <memory>
#include <map>
#include <functional>

// Plugin system framework
namespace PluginSystem {
    // Plugin base class
    class IPlugin {
    public:
        virtual ~IPlugin() = default;
        virtual std::string getName() const = 0;
        virtual void execute() = 0;
    };

    // Plugin registry
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

// Concrete plugin implementations
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

// Register plugins
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

### Scenario 3: Cross-Platform Code Organization

```cpp
#include <iostream>
#include <string>

// Platform abstraction layer
namespace Platform {
    // Common interface
    namespace Common {
        class IFileSystem {
        public:
            virtual ~IFileSystem() = default;
            virtual bool exists(const std::string& path) = 0;
            virtual std::string read(const std::string& path) = 0;
            virtual void write(const std::string& path, const std::string& content) = 0;
        };
    }

    // Windows implementation
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

    // Linux implementation
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

    // Platform selection
    #ifdef _WIN32
        inline namespace Current { using FileSystem = Windows::FileSystem; }
    #else
        inline namespace Current { using FileSystem = Linux::FileSystem; }
    #endif
}

int main() {
    // Use current platform's implementation
    Platform::FileSystem fs;

    if (fs.exists("/home/user/file.txt")) {
        std::string content = fs.read("/home/user/file.txt");
        std::cout << "Content: " << content << std::endl;
    }

    fs.write("/home/user/output.txt", "Hello, World!");

    return 0;
}
```

## Interview Points

### Common Interview Questions

**Q1: What's the difference between namespace and class scope?**

```cpp
// Namespace: purely a name organization mechanism, cannot be instantiated
namespace MyNamespace {
    int value;
    void func() {}
}

// Class: encapsulates data and behavior, can be instantiated
class MyClass {
public:
    int value;
    void func() {}
};

// Main differences:
// 1. Namespaces can be defined across multiple files, classes cannot
// 2. Namespaces have no access control (public/private), classes do
// 3. Classes can be instantiated, namespaces cannot
// 4. Classes can be inherited, namespaces cannot
```

**Q2: What's the difference between using declaration and using directive?**

```cpp
namespace A {
    void foo() {}
    void bar() {}
}

// using declaration: introduces a single name
using A::foo;  // Only introduces foo

// using directive: introduces the entire namespace
using namespace A;  // Introduces all names

// Differences:
// 1. using declaration is more precise, only introduces needed names
// 2. using directive may cause name conflicts
// 3. using declaration hides external names with the same name within the scope
// 4. using directive doesn't hide names, may cause ambiguity
```

**Q3: What is ADL (Argument-Dependent Lookup)?**

```cpp
namespace N {
    class C {};
    void func(C) { std::cout << "N::func" << std::endl; }
}

int main() {
    N::C obj;
    func(obj);  // ADL finds N::func

    // How ADL works:
    // Compiler looks at the type of argument obj: N::C
    // Automatically looks for func in namespace N

    return 0;
}
```

**Q4: What's the difference between anonymous namespace and static?**

```cpp
// static (C style)
static void helper() {}  // Internal linkage

// Anonymous namespace (C++ style)
namespace {
    void helper() {}  // Also internal linkage
}

// Differences:
// 1. Anonymous namespaces can contain type definitions
// 2. Anonymous namespaces more clearly express "internal use" intent
// 3. static can only be used for variables and functions, not types
// 4. C++ standard recommends using anonymous namespaces
```

**Q5: What's the purpose of inline namespaces?**

```cpp
namespace Library {
    inline namespace v2 {
        void func() {}  // Default version
    }
    namespace v1 {
        void func() {}  // Old version
    }
}

// Uses:
// 1. API version control
// 2. ABI compatibility management
// 3. Feature flags

Library::func();      // Calls v2::func
Library::v1::func();  // Explicitly call old version
```

### Coding Exercises

**Exercise 1: Design a logging library using namespaces**

```cpp
#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>

namespace Logging {
    // Log levels
    enum class Level {
        DEBUG,
        INFO,
        WARNING,
        ERROR
    };

    // Internal implementation
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

    // Public API
    inline void log(Level level, const std::string& message) {
        std::cout << "[" << Internal::getCurrentTime() << "] "
                  << "[" << Internal::levelToString(level) << "] "
                  << message << std::endl;
    }

    // Convenience functions
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

**Exercise 2: Implement strategy pattern using namespaces**

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

namespace Sorting {
    // Strategy interface
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

    // Sorting implementations
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

    // Convenience functions
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

## Further Reading

### Related Topics

- **Modules (C++20)**: A more powerful code organization mechanism than namespaces
- **Header file organization**: How to correctly use namespaces in header files
- **Linking and symbols**: Understanding how namespaces affect symbol resolution

### Recommended Resources

1. **C++ Standard Documentation**: ISO/IEC 14882 sections on namespaces
2. **"Effective C++"**: Scott Meyers' recommendations on namespace usage
3. **"C++ Primer"**: Detailed explanation of basic and advanced namespace usage
4. **cppreference.com**: Complete reference documentation for namespaces

### Namespaces in the Standard Library

```cpp
// Namespace organization used by the standard library
namespace std {
    // String handling
    // string, string_view, etc.

    // Containers
    // vector, map, set, etc.

    // Algorithms
    // sort, find, transform, etc.

    // File system (C++17)
    namespace filesystem { /* ... */ }

    // Time handling
    namespace chrono { /* ... */ }

    // Regular expressions
    namespace regex_constants { /* ... */ }

    // Execution policies (C++17)
    namespace execution { /* ... */ }

    // Ranges (C++20)
    namespace ranges { /* ... */ }
    namespace views { /* ... */ }
}
```

## Summary

C++ namespaces are an important mechanism for organizing and managing code, with the following main features:

### Core Functions

- **Name isolation**: Prevents name conflicts between different libraries
- **Code organization**: Groups related functionality to improve readability
- **Version control**: Manages API versions through inline namespaces

### Key Concepts

- **Nested namespaces**: Support hierarchical code organization (C++17 simplified syntax)
- **using declarations/directives**: Control how names are introduced
- **Anonymous namespaces**: Implement internal linkage, replacing static
- **Inline namespaces**: Support transparent version upgrades

### Best Practices

1. Avoid using `using namespace` in header files
2. Use namespace aliases to simplify long names
3. Use anonymous namespaces to hide implementation details
4. Use inline namespaces for API version management
5. Understand how ADL works to avoid unexpected behavior

Namespaces are an indispensable tool in C++ programming. Proper use can significantly improve code quality and maintainability in large projects.
