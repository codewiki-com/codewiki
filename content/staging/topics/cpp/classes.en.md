---
title: C++ Classes and Objects
description: "Deep dive into C++ classes: constructors, destructors, copy and move semantics"
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - Classes
  - Objects
  - RAII
status: imported
origin: old/src/content/docs/cpp/classes.en.md
divergence: 0.279
issues: []
legacy:
  category: Cpp
  subcategory: C++ Basics
  order: 3
  lastUpdated: 2026-01-07
---

Classes are the foundation of object-oriented programming in C++. They allow you to encapsulate data and behavior into reusable, maintainable units. We'll explore C++ classes comprehensively, covering everything from basic definitions to advanced topics like move semantics and RAII.

## Class Definition Basics

A class in C++ is a user-defined type that encapsulates data members and member functions. Classes support access control through three specifiers: `public`, `private`, and `protected`.

```cpp
class Rectangle {
private:
    double width;
    double height;

public:
    // Constructor
    Rectangle(double w, double h) : width(w), height(h) {}

    // Member functions
    double area() const {
        return width * height;
    }

    double perimeter() const {
        return 2 * (width + height);
    }

    // Getters
    double getWidth() const { return width; }
    double getHeight() const { return height; }

    // Setters
    void setWidth(double w) {
        if (w > 0) width = w;
    }
    void setHeight(double h) {
        if (h > 0) height = h;
    }
};

// Usage
int main() {
    Rectangle rect(5.0, 3.0);
    std::cout << "Area: " << rect.area() << std::endl;
    std::cout << "Perimeter: " << rect.perimeter() << std::endl;
    return 0;
}
```

### Access Specifiers

- **`private`**: Members are accessible only within the class itself
- **`public`**: Members are accessible from anywhere
- **`protected`**: Members are accessible within the class and derived classes

By default, class members are `private`, while `struct` members are `public`.

## Constructors

Constructors are special member functions that initialize objects when they are created. C++ provides several types of constructors.

### Default Constructor

A constructor with no parameters or all parameters having default values:

```cpp
class Point {
private:
    int x, y;

public:
    // Default constructor
    Point() : x(0), y(0) {
        std::cout << "Default constructor called\n";
    }

    // Constructor with default parameters
    Point(int x_val = 0, int y_val = 0) : x(x_val), y(y_val) {}
};

Point p1;           // Calls default constructor
Point p2(10, 20);   // Calls parameterized constructor
```

### Parameterized Constructor

Accepts arguments to initialize the object with specific values:

```cpp
class Student {
private:
    std::string name;
    int age;
    double gpa;

public:
    Student(const std::string& n, int a, double g)
        : name(n), age(a), gpa(g) {
        std::cout << "Student created: " << name << std::endl;
    }
};

Student s1("Alice", 20, 3.8);
```

### Delegating Constructors (C++11)

A constructor can call another constructor of the same class:

```cpp
class Circle {
private:
    double radius;
    std::string color;

public:
    Circle(double r, const std::string& c) : radius(r), color(c) {}

    // Delegating constructor
    Circle(double r) : Circle(r, "black") {}

    Circle() : Circle(1.0) {}
};
```

### Explicit Constructors

The `explicit` keyword prevents implicit conversions:

```cpp
class Array {
private:
    int* data;
    size_t size;

public:
    // Prevent implicit conversion from int to Array
    explicit Array(size_t s) : size(s), data(new int[s]) {}

    ~Array() { delete[] data; }
};

void processArray(const Array& arr) { /* ... */ }

int main() {
    Array arr1(10);        // OK
    // processArray(10);   // ERROR: implicit conversion prevented
    processArray(Array(10)); // OK: explicit conversion
}
```

## Destructors

A destructor is a special member function that is called when an object is destroyed. It's used to release resources and perform cleanup.

```cpp
class FileHandler {
private:
    std::FILE* file;
    std::string filename;

public:
    FileHandler(const std::string& name) : filename(name) {
        file = std::fopen(name.c_str(), "r");
        if (file) {
            std::cout << "File opened: " << filename << std::endl;
        }
    }

    // Destructor
    ~FileHandler() {
        if (file) {
            std::fclose(file);
            std::cout << "File closed: " << filename << std::endl;
        }
    }

    bool isOpen() const { return file != nullptr; }
};

int main() {
    {
        FileHandler fh("data.txt");
        // Use file...
    } // Destructor called here automatically
    return 0;
}
```

### Key Points About Destructors

- Destructor name is the class name prefixed with `~`
- Cannot take parameters or return values
- Only one destructor per class
- Called automatically when object goes out of scope
- Should be virtual in base classes if you use polymorphism

## Member Initializer Lists

Member initializer lists are the preferred way to initialize class members, especially for const members, references, and objects without default constructors.

```cpp
class Engine {
private:
    int cylinders;
public:
    Engine(int c) : cylinders(c) {
        std::cout << "Engine with " << cylinders << " cylinders\n";
    }
};

class Car {
private:
    const std::string brand;    // const member
    int& modelYear;             // reference member
    Engine engine;              // object without default constructor
    double price;

public:
    // Must use initializer list for const, references, and engine
    Car(const std::string& b, int& year, int cyl, double p)
        : brand(b), modelYear(year), engine(cyl), price(p) {
        // Constructor body
    }

    void display() const {
        std::cout << brand << " (" << modelYear << ") - $" << price << std::endl;
    }
};

int main() {
    int year = 2024;
    Car myCar("Toyota", year, 4, 25000.0);
    myCar.display();
}
```

### Initialization Order

Members are initialized in the order they are declared in the class, not the order in the initializer list:

```cpp
class InitOrder {
private:
    int a;
    int b;
    int c;

public:
    // Warning: initializer list order differs from declaration order
    InitOrder(int x) : c(x), b(c + 1), a(b + 1) {}
    // Actual initialization: a (uses uninitialized b), b (uses uninitialized c), c

    // Correct approach: match declaration order
    InitOrder(int x) : a(x), b(a + 1), c(b + 1) {}
};
```

## Copy Semantics

Copy semantics define how objects are copied. C++ provides two mechanisms: copy construction and copy assignment.

### Copy Constructor

Called when an object is initialized from another object of the same type:

```cpp
class String {
private:
    char* data;
    size_t length;

public:
    // Constructor
    String(const char* str = "") {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
    }

    // Copy constructor (deep copy)
    String(const String& other) {
        length = other.length;
        data = new char[length + 1];
        std::strcpy(data, other.data);
        std::cout << "Copy constructor called\n";
    }

    // Destructor
    ~String() {
        delete[] data;
    }

    const char* c_str() const { return data; }
};

int main() {
    String s1("Hello");
    String s2 = s1;        // Copy constructor
    String s3(s1);         // Copy constructor

    // Also called when passing by value
    auto func = [](String s) { /* ... */ };
    func(s1);              // Copy constructor
}
```

### Copy Assignment Operator

Called when assigning one object to another existing object:

```cpp
class String {
private:
    char* data;
    size_t length;

public:
    String(const char* str = "") {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
    }

    String(const String& other) {
        length = other.length;
        data = new char[length + 1];
        std::strcpy(data, other.data);
    }

    // Copy assignment operator
    String& operator=(const String& other) {
        std::cout << "Copy assignment called\n";

        // Check for self-assignment
        if (this == &other) {
            return *this;
        }

        // Free existing resource
        delete[] data;

        // Copy new data
        length = other.length;
        data = new char[length + 1];
        std::strcpy(data, other.data);

        return *this;
    }

    ~String() {
        delete[] data;
    }
};

int main() {
    String s1("Hello");
    String s2("World");
    s2 = s1;  // Copy assignment operator
}
```

### Copy-and-Swap Idiom

A robust technique for implementing the copy assignment operator:

```cpp
class Array {
private:
    int* data;
    size_t size;

public:
    Array(size_t s) : size(s), data(new int[s]) {}

    Array(const Array& other) : size(other.size), data(new int[other.size]) {
        std::copy(other.data, other.data + size, data);
    }

    // Swap function
    void swap(Array& other) noexcept {
        std::swap(data, other.data);
        std::swap(size, other.size);
    }

    // Copy assignment using copy-and-swap
    Array& operator=(Array other) {  // Pass by value (copy)
        swap(other);                  // Swap with temporary
        return *this;                 // Temporary destroyed, releasing old data
    }

    ~Array() {
        delete[] data;
    }
};
```

## Move Semantics

Move semantics (C++11) allow resources to be transferred from temporary objects, avoiding unnecessary copies and improving performance.

### Move Constructor

```cpp
class Buffer {
private:
    int* data;
    size_t size;

public:
    // Constructor
    Buffer(size_t s) : size(s), data(new int[s]) {
        std::cout << "Constructor: allocating " << size << " ints\n";
    }

    // Copy constructor
    Buffer(const Buffer& other) : size(other.size), data(new int[other.size]) {
        std::copy(other.data, other.data + size, data);
        std::cout << "Copy constructor: deep copy of " << size << " ints\n";
    }

    // Move constructor
    Buffer(Buffer&& other) noexcept
        : size(other.size), data(other.data) {
        // Transfer ownership
        other.data = nullptr;
        other.size = 0;
        std::cout << "Move constructor: transferred ownership\n";
    }

    ~Buffer() {
        delete[] data;
        std::cout << "Destructor called\n";
    }
};

Buffer createBuffer(size_t s) {
    return Buffer(s);  // Return value optimization (RVO) may apply
}

int main() {
    Buffer b1(100);
    Buffer b2 = std::move(b1);  // Explicit move
    Buffer b3 = createBuffer(200);  // May use move or RVO
}
```

### Move Assignment Operator

```cpp
class Buffer {
private:
    int* data;
    size_t size;

public:
    Buffer(size_t s) : size(s), data(new int[s]) {}

    Buffer(const Buffer& other) : size(other.size), data(new int[other.size]) {
        std::copy(other.data, other.data + size, data);
    }

    Buffer(Buffer&& other) noexcept : size(other.size), data(other.data) {
        other.data = nullptr;
        other.size = 0;
    }

    // Move assignment operator
    Buffer& operator=(Buffer&& other) noexcept {
        std::cout << "Move assignment\n";

        // Check for self-assignment
        if (this == &other) {
            return *this;
        }

        // Free existing resource
        delete[] data;

        // Transfer ownership
        data = other.data;
        size = other.size;

        // Leave other in valid state
        other.data = nullptr;
        other.size = 0;

        return *this;
    }

    // Copy assignment operator
    Buffer& operator=(const Buffer& other) {
        if (this != &other) {
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    ~Buffer() {
        delete[] data;
    }
};
```

### std::move and Perfect Forwarding

```cpp
#include <utility>
#include <iostream>
#include <vector>

class Widget {
private:
    std::string name;
    std::vector<int> data;

public:
    // Perfect forwarding constructor
    template<typename T, typename U>
    Widget(T&& n, U&& d)
        : name(std::forward<T>(n)), data(std::forward<U>(d)) {}

    void display() const {
        std::cout << "Widget: " << name << ", data size: " << data.size() << std::endl;
    }
};

int main() {
    std::string name = "MyWidget";
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Copy both
    Widget w1(name, vec);

    // Move both
    Widget w2(std::move(name), std::move(vec));

    // Mix: copy name, move temporary vector
    Widget w3(std::string("Test"), std::vector<int>{10, 20, 30});
}
```

## The Rule of Five

If a class requires a user-defined destructor, copy constructor, or copy assignment operator, it almost certainly requires all five special member functions:

1. Destructor
2. Copy constructor
3. Copy assignment operator
4. Move constructor
5. Move assignment operator

```cpp
class ResourceManager {
private:
    int* resource;

public:
    // Constructor
    ResourceManager(int value = 0) : resource(new int(value)) {
        std::cout << "Constructor\n";
    }

    // 1. Destructor
    ~ResourceManager() {
        delete resource;
        std::cout << "Destructor\n";
    }

    // 2. Copy constructor
    ResourceManager(const ResourceManager& other)
        : resource(new int(*other.resource)) {
        std::cout << "Copy constructor\n";
    }

    // 3. Copy assignment
    ResourceManager& operator=(const ResourceManager& other) {
        std::cout << "Copy assignment\n";
        if (this != &other) {
            delete resource;
            resource = new int(*other.resource);
        }
        return *this;
    }

    // 4. Move constructor
    ResourceManager(ResourceManager&& other) noexcept
        : resource(other.resource) {
        other.resource = nullptr;
        std::cout << "Move constructor\n";
    }

    // 5. Move assignment
    ResourceManager& operator=(ResourceManager&& other) noexcept {
        std::cout << "Move assignment\n";
        if (this != &other) {
            delete resource;
            resource = other.resource;
            other.resource = nullptr;
        }
        return *this;
    }

    int getValue() const { return resource ? *resource : 0; }
};
```

### Rule of Zero

If your class doesn't manage resources directly, prefer using standard containers and smart pointers, and let the compiler generate the special member functions:

```cpp
// Good: No manual resource management
class Person {
private:
    std::string name;
    std::vector<std::string> addresses;
    std::unique_ptr<int> id;

public:
    Person(const std::string& n, int idNum)
        : name(n), id(std::make_unique<int>(idNum)) {}

    // Compiler-generated special members work correctly
    // No need to define destructor, copy/move constructors, or assignment operators
};
```

## Friend Functions and Classes

Friend functions and classes can access private and protected members of a class.

### Friend Functions

```cpp
class Complex {
private:
    double real;
    double imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    // Friend function declaration
    friend Complex operator+(const Complex& a, const Complex& b);
    friend std::ostream& operator<<(std::ostream& os, const Complex& c);

    double getReal() const { return real; }
    double getImag() const { return imag; }
};

// Friend function definition (can access private members)
Complex operator+(const Complex& a, const Complex& b) {
    return Complex(a.real + b.real, a.imag + b.imag);
}

std::ostream& operator<<(std::ostream& os, const Complex& c) {
    os << c.real;
    if (c.imag >= 0) os << "+";
    os << c.imag << "i";
    return os;
}

int main() {
    Complex c1(3, 4);
    Complex c2(1, 2);
    Complex c3 = c1 + c2;
    std::cout << "c1 + c2 = " << c3 << std::endl;
}
```

### Friend Classes

```cpp
class Engine {
private:
    int horsepower;
    double fuelEfficiency;

public:
    Engine(int hp, double eff) : horsepower(hp), fuelEfficiency(eff) {}

    // Car class can access private members
    friend class Car;
};

class Car {
private:
    Engine engine;
    std::string model;

public:
    Car(const std::string& m, int hp, double eff)
        : model(m), engine(hp, eff) {}

    void displaySpecs() const {
        std::cout << model << ": "
                  << engine.horsepower << " HP, "
                  << engine.fuelEfficiency << " MPG\n";
    }
};

int main() {
    Car myCar("Sedan", 200, 30.5);
    myCar.displaySpecs();
}
```

### Friend Member Functions

```cpp
class Vector3D;  // Forward declaration

class Matrix3x3 {
public:
    // This specific member function is a friend of Vector3D
    Vector3D multiply(const Vector3D& v) const;
};

class Vector3D {
private:
    double x, y, z;

public:
    Vector3D(double x = 0, double y = 0, double z = 0) : x(x), y(y), z(z) {}

    // Only this specific member function of Matrix3x3 is a friend
    friend Vector3D Matrix3x3::multiply(const Vector3D& v) const;
};
```

## RAII Pattern

Resource Acquisition Is Initialization (RAII) is a fundamental C++ idiom where resource lifetime is tied to object lifetime.

### Basic RAII Example

```cpp
class MutexLock {
private:
    std::mutex& mtx;

public:
    // Acquire resource in constructor
    explicit MutexLock(std::mutex& m) : mtx(m) {
        mtx.lock();
        std::cout << "Mutex locked\n";
    }

    // Release resource in destructor
    ~MutexLock() {
        mtx.unlock();
        std::cout << "Mutex unlocked\n";
    }

    // Prevent copying
    MutexLock(const MutexLock&) = delete;
    MutexLock& operator=(const MutexLock&) = delete;
};

void criticalSection(std::mutex& mtx) {
    MutexLock lock(mtx);
    // Critical section code
    // Mutex automatically unlocked when lock goes out of scope
}
```

### File RAII Wrapper

```cpp
class File {
private:
    std::FILE* handle;
    std::string filename;

public:
    File(const std::string& name, const char* mode)
        : filename(name), handle(std::fopen(name.c_str(), mode)) {
        if (!handle) {
            throw std::runtime_error("Failed to open file: " + filename);
        }
    }

    ~File() {
        if (handle) {
            std::fclose(handle);
        }
    }

    // Delete copy operations
    File(const File&) = delete;
    File& operator=(const File&) = delete;

    // Enable move operations
    File(File&& other) noexcept
        : handle(other.handle), filename(std::move(other.filename)) {
        other.handle = nullptr;
    }

    File& operator=(File&& other) noexcept {
        if (this != &other) {
            if (handle) std::fclose(handle);
            handle = other.handle;
            filename = std::move(other.filename);
            other.handle = nullptr;
        }
        return *this;
    }

    std::FILE* get() const { return handle; }
    bool isOpen() const { return handle != nullptr; }
};

void processFile(const std::string& filename) {
    File f(filename, "r");
    // Use file
    // Automatically closed when f goes out of scope, even if exception thrown
}
```

### Smart Pointer-like RAII

```cpp
template<typename T>
class UniquePtr {
private:
    T* ptr;

public:
    explicit UniquePtr(T* p = nullptr) : ptr(p) {}

    ~UniquePtr() {
        delete ptr;
    }

    // Delete copy operations
    UniquePtr(const UniquePtr&) = delete;
    UniquePtr& operator=(const UniquePtr&) = delete;

    // Move operations
    UniquePtr(UniquePtr&& other) noexcept : ptr(other.ptr) {
        other.ptr = nullptr;
    }

    UniquePtr& operator=(UniquePtr&& other) noexcept {
        if (this != &other) {
            delete ptr;
            ptr = other.ptr;
            other.ptr = nullptr;
        }
        return *this;
    }

    T* operator->() const { return ptr; }
    T& operator*() const { return *ptr; }
    T* get() const { return ptr; }

    T* release() {
        T* temp = ptr;
        ptr = nullptr;
        return temp;
    }

    void reset(T* p = nullptr) {
        delete ptr;
        ptr = p;
    }
};

int main() {
    UniquePtr<int> ptr(new int(42));
    std::cout << *ptr << std::endl;
    // Automatically deleted when ptr goes out of scope
}
```

## Best Practices

### Use Initialization Lists

```cpp
// Good
class MyClass {
    int a;
    std::string b;
public:
    MyClass(int x, const std::string& y) : a(x), b(y) {}
};

// Less efficient
class MyClass {
    int a;
    std::string b;
public:
    MyClass(int x, const std::string& y) {
        a = x;  // Assignment, not initialization
        b = y;  // String default constructed, then assigned
    }
};
```

### Mark Single-Argument Constructors as Explicit

```cpp
class String {
public:
    explicit String(size_t size);  // Prevent implicit conversion
};
```

### Use = default and = delete

```cpp
class NonCopyable {
public:
    NonCopyable() = default;
    NonCopyable(const NonCopyable&) = delete;
    NonCopyable& operator=(const NonCopyable&) = delete;
    NonCopyable(NonCopyable&&) = default;
    NonCopyable& operator=(NonCopyable&&) = default;
};
```

### Mark Const Member Functions

```cpp
class Point {
    int x, y;
public:
    int getX() const { return x; }  // Doesn't modify object
    void setX(int val) { x = val; }  // Modifies object
};
```

### Use noexcept for Move Operations

```cpp
class MyClass {
public:
    MyClass(MyClass&&) noexcept;
    MyClass& operator=(MyClass&&) noexcept;
};
```

### Prefer Composition Over Inheritance

```cpp
// Good: Composition
class Engine { /* ... */ };
class Car {
    Engine engine;  // Has-a relationship
};

// Use inheritance only for is-a relationships
class Vehicle { /* ... */ };
class Car : public Vehicle {  // Is-a relationship
};
```

### Follow the Rule of Zero When Possible

```cpp
// Good: Let compiler handle special members
class DataHolder {
    std::vector<int> data;
    std::string name;
    // Compiler-generated special members are correct
};
```

## Conclusion

C++ classes provide powerful mechanisms for encapsulation, resource management, and abstraction. Understanding constructors, destructors, copy and move semantics is essential for writing efficient, safe, and maintainable C++ code. The RAII pattern, in particular, is fundamental to modern C++ and helps prevent resource leaks while ensuring exception safety.

Key takeaways:
- Use member initializer lists for efficient initialization
- Follow the Rule of Five or Rule of Zero
- Implement move semantics for performance
- Apply RAII for automatic resource management
- Use `explicit`, `const`, `noexcept`, and `= delete` appropriately
- Prefer composition and smart pointers over manual resource management

Mastering these concepts will significantly improve your C++ programming skills and help you write more robust, efficient code.
