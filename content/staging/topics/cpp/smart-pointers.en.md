---
title: C++ 智能指针
description: 深入理解 C++ 智能指针:unique_ptr、shared_ptr、weak_ptr 与 RAII
track: cpp
section: memory-ownership
difficulty: intermediate
tags:
  - C++
  - 智能指针
  - RAII
  - 内存管理
status: imported
origin: old/src/content/docs/cpp/smart-pointers.en.md
divergence: 0.194
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 现代 C++
  order: 5
  lastUpdated: 2026-01-07
---

## Overview

Smart pointers are automatic memory management tools provided by the C++ standard library, designed to address issues like memory leaks and dangling pointers that can arise from manual dynamic memory management. Smart pointers are based on the RAII (Resource Acquisition Is Initialization) principle, automatically releasing managed resources when the object's lifetime ends.

C++11 introduced three main types of smart pointers:
- `std::unique_ptr` - Smart pointer with exclusive ownership
- `std::shared_ptr` - Smart pointer with shared ownership
- `std::weak_ptr` - Weak reference pointer that doesn't control the object's lifetime

## The RAII Principle

RAII (Resource Acquisition Is Initialization) is one of the most important resource management techniques in C++. Its core concepts are:

1. Resource acquisition occurs during object construction
2. Resource release happens automatically during object destruction
3. Stack object lifetime is used to manage resources

```cpp
#include <iostream>
#include <memory>

class Resource {
public:
    Resource() { std::cout << "Resource acquired\n"; }
    ~Resource() { std::cout << "Resource released\n"; }
    void use() { std::cout << "Using resource\n"; }
};

void demonstrateRAII() {
    std::unique_ptr<Resource> ptr(new Resource());
    ptr->use();
    // When the function ends, unique_ptr automatically destructs, and Resource is released
}

int main() {
    demonstrateRAII();
    std::cout << "Function completed\n";
    return 0;
}
```

## std::unique_ptr

`unique_ptr` is a smart pointer with exclusive ownership - at any given time, only one `unique_ptr` can point to a particular object.

### Basic Usage

```cpp
#include <memory>
#include <iostream>
#include <string>

class Person {
private:
    std::string name;
    int age;
public:
    Person(const std::string& n, int a) : name(n), age(a) {
        std::cout << "Person created: " << name << "\n";
    }
    ~Person() {
        std::cout << "Person destroyed: " << name << "\n";
    }
    void introduce() const {
        std::cout << "I'm " << name << ", " << age << " years old\n";
    }
};

int main() {
    // Create unique_ptr
    std::unique_ptr<Person> p1(new Person("Alice", 25));

    // Use make_unique (C++14, recommended)
    auto p2 = std::make_unique<Person>("Bob", 30);

    // Access object members
    p1->introduce();
    (*p2).introduce();

    // unique_ptr cannot be copied
    // std::unique_ptr<Person> p3 = p1; // Compilation error

    // But it can be moved
    std::unique_ptr<Person> p3 = std::move(p1);
    if (!p1) {
        std::cout << "p1 is now null\n";
    }
    p3->introduce();

    return 0;
}
```

### make_unique

`std::make_unique` (C++14) is the recommended way to create `unique_ptr`:

```cpp
#include <memory>
#include <vector>

class Widget {
private:
    int data;
public:
    explicit Widget(int d) : data(d) {}
    int getData() const { return data; }
};

int main() {
    // Recommended: use make_unique
    auto w1 = std::make_unique<Widget>(42);

    // Create arrays
    auto arr = std::make_unique<int[]>(10);
    for (int i = 0; i < 10; ++i) {
        arr[i] = i * i;
    }

    // Advantages of make_unique:
    // 1. Exception safety
    // 2. More concise
    // 3. Avoids repeating type names

    return 0;
}
```

### unique_ptr with Containers

```cpp
#include <memory>
#include <vector>
#include <iostream>

class Task {
private:
    std::string name;
public:
    explicit Task(const std::string& n) : name(n) {
        std::cout << "Task created: " << name << "\n";
    }
    ~Task() {
        std::cout << "Task destroyed: " << name << "\n";
    }
    void execute() const {
        std::cout << "Executing task: " << name << "\n";
    }
};

int main() {
    std::vector<std::unique_ptr<Task>> tasks;

    // Add tasks
    tasks.push_back(std::make_unique<Task>("Task1"));
    tasks.push_back(std::make_unique<Task>("Task2"));
    tasks.push_back(std::make_unique<Task>("Task3"));

    // Execute all tasks
    for (const auto& task : tasks) {
        task->execute();
    }

    // When the vector is destroyed, all unique_ptrs and their managed objects are automatically destroyed
    return 0;
}
```

### Custom Deleters

```cpp
#include <memory>
#include <iostream>
#include <cstdio>

// Custom deleter for file handles
struct FileCloser {
    void operator()(FILE* fp) const {
        if (fp) {
            std::cout << "Closing file\n";
            fclose(fp);
        }
    }
};

// Using lambda as a deleter
void customDeleterExample() {
    // Using function object
    std::unique_ptr<FILE, FileCloser> file1(
        fopen("test.txt", "w")
    );

    // Using lambda
    auto deleter = [](FILE* fp) {
        if (fp) {
            std::cout << "Lambda closing file\n";
            fclose(fp);
        }
    };

    std::unique_ptr<FILE, decltype(deleter)> file2(
        fopen("test2.txt", "w"),
        deleter
    );

    if (file1) {
        fprintf(file1.get(), "Hello from unique_ptr!\n");
    }
}

// Array deleter example
class Connection {
public:
    Connection() { std::cout << "Connection established\n"; }
    ~Connection() { std::cout << "Connection closed\n"; }
    void send(const std::string& msg) {
        std::cout << "Sending: " << msg << "\n";
    }
};

void arrayDeleterExample() {
    // Custom deleter for array
    auto deleter = [](Connection* conn) {
        std::cout << "Custom deleter for connection\n";
        delete conn;
    };

    std::unique_ptr<Connection, decltype(deleter)> conn(
        new Connection(),
        deleter
    );

    conn->send("Hello");
}

int main() {
    customDeleterExample();
    arrayDeleterExample();
    return 0;
}
```

## std::shared_ptr

`shared_ptr` is a smart pointer with shared ownership - multiple `shared_ptr` instances can point to the same object. The object is only released when the last `shared_ptr` is destroyed.

### Basic Usage

```cpp
#include <memory>
#include <iostream>

class Data {
private:
    int value;
public:
    explicit Data(int v) : value(v) {
        std::cout << "Data created with value: " << value << "\n";
    }
    ~Data() {
        std::cout << "Data destroyed with value: " << value << "\n";
    }
    int getValue() const { return value; }
};

int main() {
    // Create shared_ptr
    std::shared_ptr<Data> sp1 = std::make_shared<Data>(100);
    std::cout << "sp1 use_count: " << sp1.use_count() << "\n";

    {
        // Share ownership
        std::shared_ptr<Data> sp2 = sp1;
        std::cout << "sp1 use_count: " << sp1.use_count() << "\n";
        std::cout << "sp2 use_count: " << sp2.use_count() << "\n";

        std::shared_ptr<Data> sp3 = sp2;
        std::cout << "sp1 use_count: " << sp1.use_count() << "\n";

        // sp2 and sp3 are destroyed at the end of this scope
    }

    std::cout << "After scope, sp1 use_count: " << sp1.use_count() << "\n";

    // sp1 is destroyed at the end of main, and the Data object is released then
    return 0;
}
```

### make_shared

`std::make_shared` is the recommended way to create `shared_ptr`:

```cpp
#include <memory>
#include <iostream>
#include <vector>

class Node {
private:
    int id;
    std::vector<int> data;
public:
    Node(int i, size_t size) : id(i), data(size) {
        std::cout << "Node " << id << " created\n";
    }
    ~Node() {
        std::cout << "Node " << id << " destroyed\n";
    }
};

int main() {
    // Recommended: use make_shared
    auto node1 = std::make_shared<Node>(1, 1000);

    // Not recommended: using new directly
    // std::shared_ptr<Node> node2(new Node(2, 1000));

    // Advantages of make_shared:
    // 1. Single memory allocation (control block and object are together)
    // 2. Exception safety
    // 3. Better performance

    return 0;
}
```

### shared_ptr Reference Counting

```cpp
#include <memory>
#include <iostream>

void checkUseCount(const std::shared_ptr<int>& ptr, const std::string& name) {
    if (ptr) {
        std::cout << name << " use_count: " << ptr.use_count()
                  << ", value: " << *ptr << "\n";
    } else {
        std::cout << name << " is null\n";
    }
}

int main() {
    auto sp1 = std::make_shared<int>(42);
    checkUseCount(sp1, "sp1");

    auto sp2 = sp1;
    checkUseCount(sp1, "sp1");
    checkUseCount(sp2, "sp2");

    auto sp3 = sp1;
    checkUseCount(sp1, "sp1");

    // reset decreases the reference count
    sp2.reset();
    checkUseCount(sp1, "sp1");
    checkUseCount(sp2, "sp2");

    // reset and point to a new object
    sp3.reset(new int(100));
    checkUseCount(sp1, "sp1");
    checkUseCount(sp3, "sp3");

    return 0;
}
```

### shared_ptr and Polymorphism

```cpp
#include <memory>
#include <iostream>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual void draw() const = 0;
    virtual double area() const = 0;
};

class Circle : public Shape {
private:
    double radius;
public:
    explicit Circle(double r) : radius(r) {
        std::cout << "Circle created with radius: " << radius << "\n";
    }
    ~Circle() override {
        std::cout << "Circle destroyed\n";
    }
    void draw() const override {
        std::cout << "Drawing circle with radius: " << radius << "\n";
    }
    double area() const override {
        return 3.14159 * radius * radius;
    }
};

class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h) : width(w), height(h) {
        std::cout << "Rectangle created: " << width << "x" << height << "\n";
    }
    ~Rectangle() override {
        std::cout << "Rectangle destroyed\n";
    }
    void draw() const override {
        std::cout << "Drawing rectangle: " << width << "x" << height << "\n";
    }
    double area() const override {
        return width * height;
    }
};

int main() {
    std::vector<std::shared_ptr<Shape>> shapes;

    shapes.push_back(std::make_shared<Circle>(5.0));
    shapes.push_back(std::make_shared<Rectangle>(4.0, 6.0));
    shapes.push_back(std::make_shared<Circle>(3.0));

    std::cout << "\nDrawing all shapes:\n";
    for (const auto& shape : shapes) {
        shape->draw();
        std::cout << "Area: " << shape->area() << "\n\n";
    }

    return 0;
}
```

### Circular Reference Problem

```cpp
#include <memory>
#include <iostream>

class B; // Forward declaration

class A {
public:
    std::shared_ptr<B> b_ptr;
    ~A() { std::cout << "A destroyed\n"; }
};

class B {
public:
    std::shared_ptr<A> a_ptr; // This causes a circular reference!
    ~B() { std::cout << "B destroyed\n"; }
};

void circularReferenceDemo() {
    auto a = std::make_shared<A>();
    auto b = std::make_shared<B>();

    a->b_ptr = b;
    b->a_ptr = a;

    std::cout << "a use_count: " << a.use_count() << "\n"; // 2
    std::cout << "b use_count: " << b.use_count() << "\n"; // 2

    // When the function ends, neither a nor b will be destroyed, causing a memory leak!
}

int main() {
    circularReferenceDemo();
    std::cout << "Function ended\n";
    // Note: Destructors were not called!
    return 0;
}
```

## std::weak_ptr

`weak_ptr` is a smart pointer that doesn't control the object's lifetime, used to solve the circular reference problem with `shared_ptr`.

### Basic Usage

```cpp
#include <memory>
#include <iostream>

void weakPtrBasics() {
    std::weak_ptr<int> wp;

    {
        auto sp = std::make_shared<int>(42);
        wp = sp; // weak_ptr doesn't increase the reference count

        std::cout << "sp use_count: " << sp.use_count() << "\n"; // 1
        std::cout << "wp use_count: " << wp.use_count() << "\n"; // 1
        std::cout << "wp expired: " << wp.expired() << "\n"; // false

        // Using weak_ptr: must first convert to shared_ptr
        if (auto sp2 = wp.lock()) {
            std::cout << "Value: " << *sp2 << "\n";
            std::cout << "sp use_count: " << sp.use_count() << "\n"; // 2
        }

        // sp is destroyed at the end of this scope
    }

    std::cout << "After scope:\n";
    std::cout << "wp expired: " << wp.expired() << "\n"; // true

    if (auto sp = wp.lock()) {
        std::cout << "Value: " << *sp << "\n";
    } else {
        std::cout << "Object has been destroyed\n";
    }
}

int main() {
    weakPtrBasics();
    return 0;
}
```

### Solving Circular References

```cpp
#include <memory>
#include <iostream>
#include <string>

class Employee;

class Department {
private:
    std::string name;
    std::vector<std::shared_ptr<Employee>> employees;
public:
    explicit Department(const std::string& n) : name(n) {
        std::cout << "Department created: " << name << "\n";
    }
    ~Department() {
        std::cout << "Department destroyed: " << name << "\n";
    }
    void addEmployee(const std::shared_ptr<Employee>& emp) {
        employees.push_back(emp);
    }
    const std::string& getName() const { return name; }
};

class Employee {
private:
    std::string name;
    std::weak_ptr<Department> dept; // Use weak_ptr to avoid circular reference
public:
    explicit Employee(const std::string& n) : name(n) {
        std::cout << "Employee created: " << name << "\n";
    }
    ~Employee() {
        std::cout << "Employee destroyed: " << name << "\n";
    }
    void setDepartment(const std::shared_ptr<Department>& d) {
        dept = d;
    }
    void showDepartment() const {
        if (auto d = dept.lock()) {
            std::cout << name << " works in " << d->getName() << "\n";
        } else {
            std::cout << name << " has no department\n";
        }
    }
};

int main() {
    auto dept = std::make_shared<Department>("Engineering");

    auto emp1 = std::make_shared<Employee>("Alice");
    auto emp2 = std::make_shared<Employee>("Bob");

    emp1->setDepartment(dept);
    emp2->setDepartment(dept);

    dept->addEmployee(emp1);
    dept->addEmployee(emp2);

    emp1->showDepartment();
    emp2->showDepartment();

    // All objects are correctly destroyed, no memory leak
    return 0;
}
```

### weak_ptr Observer Pattern

```cpp
#include <memory>
#include <iostream>
#include <vector>
#include <string>

class Observer {
public:
    virtual ~Observer() = default;
    virtual void update(const std::string& message) = 0;
};

class ConcreteObserver : public Observer {
private:
    std::string name;
public:
    explicit ConcreteObserver(const std::string& n) : name(n) {}
    void update(const std::string& message) override {
        std::cout << name << " received: " << message << "\n";
    }
};

class Subject {
private:
    std::vector<std::weak_ptr<Observer>> observers;
public:
    void attach(const std::shared_ptr<Observer>& observer) {
        observers.push_back(observer);
    }

    void notify(const std::string& message) {
        // Clean up expired observers
        auto it = observers.begin();
        while (it != observers.end()) {
            if (auto obs = it->lock()) {
                obs->update(message);
                ++it;
            } else {
                // Observer has been destroyed, remove from list
                it = observers.erase(it);
            }
        }
    }

    void showObserverCount() {
        int count = 0;
        for (auto& wp : observers) {
            if (!wp.expired()) {
                ++count;
            }
        }
        std::cout << "Active observers: " << count << "\n";
    }
};

int main() {
    Subject subject;

    {
        auto obs1 = std::make_shared<ConcreteObserver>("Observer1");
        auto obs2 = std::make_shared<ConcreteObserver>("Observer2");

        subject.attach(obs1);
        subject.attach(obs2);

        subject.showObserverCount();
        subject.notify("First message");

        // obs2 is destroyed at the end of this scope
    }

    std::cout << "\nAfter obs2 destroyed:\n";
    subject.showObserverCount();
    subject.notify("Second message");

    return 0;
}
```

## Smart Pointer Selection Guide

### When to Use unique_ptr

```cpp
#include <memory>
#include <vector>

// 1. Factory function return values
std::unique_ptr<Widget> createWidget(int value) {
    return std::make_unique<Widget>(value);
}

// 2. Pimpl idiom (Pointer to Implementation)
class MyClass {
private:
    class Impl; // Forward declaration
    std::unique_ptr<Impl> pImpl;
public:
    MyClass();
    ~MyClass();
    // ...
};

// 3. Managing exclusive resources
class FileManager {
private:
    std::unique_ptr<FILE, decltype(&fclose)> file;
public:
    FileManager(const char* filename)
        : file(fopen(filename, "r"), &fclose) {}
};

// 4. Storing polymorphic objects in containers
void containerExample() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes.push_back(std::make_unique<Rectangle>(4.0, 6.0));
}
```

### When to Use shared_ptr

```cpp
#include <memory>
#include <thread>
#include <vector>

// 1. When shared ownership is needed
class Cache {
private:
    std::vector<std::shared_ptr<Data>> cache;
public:
    std::shared_ptr<Data> getData(int id) {
        // Return shared data, multiple users can hold it
        return cache[id];
    }
};

// 2. Sharing data across threads
void threadSafeSharing() {
    auto data = std::make_shared<std::vector<int>>(1000);

    std::thread t1([data]() {
        // Thread 1 uses data
        for (auto& val : *data) {
            val *= 2;
        }
    });

    std::thread t2([data]() {
        // Thread 2 uses data
        // shared_ptr ensures data is destroyed only after both threads finish
    });

    t1.join();
    t2.join();
}

// 3. Keeping objects alive for callbacks
class AsyncProcessor {
public:
    void processAsync(std::shared_ptr<Data> data) {
        // Async processing, shared_ptr ensures object stays alive during processing
        std::thread([data]() {
            // Process data
        }).detach();
    }
};
```

### When to Use weak_ptr

```cpp
#include <memory>

// 1. Breaking circular references
class Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev; // Use weak_ptr to avoid cycles
};

// 2. Caching systems
class DataCache {
private:
    std::map<int, std::weak_ptr<Data>> cache;
public:
    std::shared_ptr<Data> getData(int id) {
        auto it = cache.find(id);
        if (it != cache.end()) {
            if (auto data = it->second.lock()) {
                return data; // Cache hit
            }
        }
        // Load new data
        auto data = loadData(id);
        cache[id] = data;
        return data;
    }
private:
    std::shared_ptr<Data> loadData(int id);
};

// 3. Observer pattern (as shown earlier)
```

## Performance Considerations

### Smart Pointer Overhead

```cpp
#include <memory>
#include <iostream>
#include <chrono>

void performanceComparison() {
    const int N = 1000000;

    // Raw pointer
    {
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < N; ++i) {
            int* p = new int(i);
            delete p;
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        std::cout << "Raw pointer: " << duration.count() << "ms\n";
    }

    // unique_ptr
    {
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < N; ++i) {
            auto p = std::make_unique<int>(i);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        std::cout << "unique_ptr: " << duration.count() << "ms\n";
    }

    // shared_ptr
    {
        auto start = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < N; ++i) {
            auto p = std::make_shared<int>(i);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        std::cout << "shared_ptr: " << duration.count() << "ms\n";
    }
}
```

### Best Practices

```cpp
#include <memory>
#include <vector>

class BestPractices {
public:
    // 1. Prefer make_shared and make_unique
    void preferMakeFunctions() {
        auto ptr1 = std::make_unique<int>(42); // Good
        // std::unique_ptr<int> ptr2(new int(42)); // Not recommended

        auto ptr3 = std::make_shared<int>(42); // Good
        // std::shared_ptr<int> ptr4(new int(42)); // Not recommended
    }

    // 2. Pass shared_ptr by value when sharing ownership is needed
    void shareOwnership(std::shared_ptr<Data> data) {
        // Increases reference count, ensures object survives during function execution
    }

    // 3. Pass shared_ptr by const reference when sharing ownership is not needed
    void useData(const std::shared_ptr<Data>& data) {
        // Doesn't increase reference count, more efficient
    }

    // 4. Use weak_ptr to break circular references
    struct Node {
        std::shared_ptr<Node> next;
        std::weak_ptr<Node> prev;
    };

    // 5. Use unique_ptr as the default choice
    std::unique_ptr<Widget> createWidget() {
        return std::make_unique<Widget>(42);
        // Caller can convert to shared_ptr if needed
    }

    // 6. Avoid creating multiple shared_ptrs from raw pointers
    void avoidDoubleOwnership() {
        Widget* raw = new Widget(42);
        // std::shared_ptr<Widget> sp1(raw); // Dangerous!
        // std::shared_ptr<Widget> sp2(raw); // Double delete!

        // Correct approach:
        auto sp = std::make_shared<Widget>(42);
    }
};
```

## Common Pitfalls and Solutions

### Pitfall 1: Creating shared_ptr from this

```cpp
#include <memory>
#include <iostream>

// Incorrect example
class BadWidget {
public:
    std::shared_ptr<BadWidget> getShared() {
        return std::shared_ptr<BadWidget>(this); // Dangerous!
    }
};

// Correct example: using enable_shared_from_this
class GoodWidget : public std::enable_shared_from_this<GoodWidget> {
public:
    std::shared_ptr<GoodWidget> getShared() {
        return shared_from_this(); // Correct
    }

    void doSomething() {
        std::cout << "Doing something\n";
    }
};

void demonstrateSharedFromThis() {
    // Note: There must already be a shared_ptr managing the object
    auto widget = std::make_shared<GoodWidget>();
    auto widget2 = widget->getShared();

    std::cout << "widget use_count: " << widget.use_count() << "\n"; // 2
    std::cout << "widget2 use_count: " << widget2.use_count() << "\n"; // 2
}
```

### Pitfall 2: Circular References

```cpp
#include <memory>
#include <iostream>

// Problem: Circular references cause memory leaks
class BadNode {
public:
    std::shared_ptr<BadNode> next;
    std::shared_ptr<BadNode> prev; // Circular reference!
    ~BadNode() { std::cout << "BadNode destroyed\n"; }
};

// Solution: Use weak_ptr
class GoodNode {
public:
    std::shared_ptr<GoodNode> next;
    std::weak_ptr<GoodNode> prev; // Use weak_ptr
    ~GoodNode() { std::cout << "GoodNode destroyed\n"; }
};

void demonstrateCircularReference() {
    {
        auto bad1 = std::make_shared<BadNode>();
        auto bad2 = std::make_shared<BadNode>();
        bad1->next = bad2;
        bad2->prev = bad1; // Circular reference
        // Objects won't be destroyed when scope ends!
    }
    std::cout << "Bad nodes should be destroyed but aren't\n";

    {
        auto good1 = std::make_shared<GoodNode>();
        auto good2 = std::make_shared<GoodNode>();
        good1->next = good2;
        good2->prev = good1; // weak_ptr doesn't increase reference count
        // Objects are correctly destroyed when scope ends
    }
    std::cout << "Good nodes destroyed correctly\n";
}
```

### Pitfall 3: Premature Release

```cpp
#include <memory>
#include <iostream>

void prematureRelease() {
    std::weak_ptr<int> wp;

    {
        auto sp = std::make_shared<int>(42);
        wp = sp;

        // Correct use of weak_ptr
        if (auto sp2 = wp.lock()) {
            std::cout << "Value: " << *sp2 << "\n";
        }
    } // sp is destroyed here

    // Attempting to use the destroyed object
    if (auto sp = wp.lock()) {
        std::cout << "Value: " << *sp << "\n";
    } else {
        std::cout << "Object has been destroyed\n"; // This will execute
    }
}
```

## Practical Application Examples

### Example 1: Resource Manager

```cpp
#include <memory>
#include <iostream>
#include <string>
#include <map>

class Resource {
private:
    std::string name;
    size_t size;
public:
    Resource(const std::string& n, size_t s) : name(n), size(s) {
        std::cout << "Loading resource: " << name << " (" << size << " bytes)\n";
    }
    ~Resource() {
        std::cout << "Unloading resource: " << name << "\n";
    }
    const std::string& getName() const { return name; }
    size_t getSize() const { return size; }
};

class ResourceManager {
private:
    std::map<std::string, std::weak_ptr<Resource>> cache;

public:
    std::shared_ptr<Resource> loadResource(const std::string& name, size_t size) {
        // Check cache
        auto it = cache.find(name);
        if (it != cache.end()) {
            if (auto resource = it->second.lock()) {
                std::cout << "Resource found in cache: " << name << "\n";
                return resource;
            }
        }

        // Load new resource
        auto resource = std::make_shared<Resource>(name, size);
        cache[name] = resource;
        return resource;
    }

    void cleanCache() {
        auto it = cache.begin();
        while (it != cache.end()) {
            if (it->second.expired()) {
                std::cout << "Removing expired cache entry: " << it->first << "\n";
                it = cache.erase(it);
            } else {
                ++it;
            }
        }
    }

    void showCacheStatus() {
        std::cout << "\nCache status:\n";
        for (const auto& pair : cache) {
            if (pair.second.expired()) {
                std::cout << "  " << pair.first << ": expired\n";
            } else {
                std::cout << "  " << pair.first << ": active (refcount="
                          << pair.second.use_count() << ")\n";
            }
        }
    }
};

int main() {
    ResourceManager manager;

    {
        auto res1 = manager.loadResource("texture.png", 1024);
        auto res2 = manager.loadResource("sound.wav", 2048);
        auto res3 = manager.loadResource("texture.png", 1024); // Load from cache

        manager.showCacheStatus();
    }

    std::cout << "\nAfter resources released:\n";
    manager.showCacheStatus();
    manager.cleanCache();
    manager.showCacheStatus();

    return 0;
}
```

### Example 2: Graph Structure

```cpp
#include <memory>
#include <iostream>
#include <vector>
#include <string>

class GraphNode : public std::enable_shared_from_this<GraphNode> {
private:
    std::string name;
    std::vector<std::weak_ptr<GraphNode>> neighbors;

public:
    explicit GraphNode(const std::string& n) : name(n) {
        std::cout << "Node created: " << name << "\n";
    }

    ~GraphNode() {
        std::cout << "Node destroyed: " << name << "\n";
    }

    void addNeighbor(const std::shared_ptr<GraphNode>& node) {
        neighbors.push_back(node);
        std::cout << name << " -> " << node->name << "\n";
    }

    void traverse(int depth = 0) {
        std::string indent(depth * 2, ' ');
        std::cout << indent << name << "\n";

        for (auto& wp : neighbors) {
            if (auto neighbor = wp.lock()) {
                neighbor->traverse(depth + 1);
            }
        }
    }

    const std::string& getName() const { return name; }

    int getActiveNeighborCount() const {
        int count = 0;
        for (const auto& wp : neighbors) {
            if (!wp.expired()) {
                ++count;
            }
        }
        return count;
    }
};

int main() {
    auto nodeA = std::make_shared<GraphNode>("A");
    auto nodeB = std::make_shared<GraphNode>("B");
    auto nodeC = std::make_shared<GraphNode>("C");
    auto nodeD = std::make_shared<GraphNode>("D");

    // Build graph structure
    nodeA->addNeighbor(nodeB);
    nodeA->addNeighbor(nodeC);
    nodeB->addNeighbor(nodeD);
    nodeC->addNeighbor(nodeD);

    std::cout << "\nTraversing graph from A:\n";
    nodeA->traverse();

    std::cout << "\nNode A has " << nodeA->getActiveNeighborCount()
              << " active neighbors\n";

    return 0;
}
```

### Example 3: Complete Observer Pattern Implementation

```cpp
#include <memory>
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

// Observer interface
class IObserver {
public:
    virtual ~IObserver() = default;
    virtual void onNotify(const std::string& event) = 0;
    virtual std::string getName() const = 0;
};

// Subject class
class Subject {
private:
    std::vector<std::weak_ptr<IObserver>> observers;
    std::string state;

    void cleanupExpiredObservers() {
        auto it = std::remove_if(observers.begin(), observers.end(),
            [](const std::weak_ptr<IObserver>& wp) {
                return wp.expired();
            });
        observers.erase(it, observers.end());
    }

public:
    void attach(const std::shared_ptr<IObserver>& observer) {
        cleanupExpiredObservers();
        observers.push_back(observer);
        std::cout << "Attached observer: " << observer->getName() << "\n";
    }

    void detach(const std::shared_ptr<IObserver>& observer) {
        auto it = std::remove_if(observers.begin(), observers.end(),
            [&observer](const std::weak_ptr<IObserver>& wp) {
                if (auto sp = wp.lock()) {
                    return sp == observer;
                }
                return false;
            });
        observers.erase(it, observers.end());
        std::cout << "Detached observer: " << observer->getName() << "\n";
    }

    void setState(const std::string& newState) {
        state = newState;
        notify("State changed to: " + state);
    }

    void notify(const std::string& event) {
        cleanupExpiredObservers();
        std::cout << "\nNotifying " << observers.size() << " observers about: "
                  << event << "\n";

        for (auto& wp : observers) {
            if (auto observer = wp.lock()) {
                observer->onNotify(event);
            }
        }
    }

    size_t getObserverCount() const {
        size_t count = 0;
        for (const auto& wp : observers) {
            if (!wp.expired()) {
                ++count;
            }
        }
        return count;
    }
};

// Concrete observer
class ConcreteObserver : public IObserver {
private:
    std::string name;

public:
    explicit ConcreteObserver(const std::string& n) : name(n) {
        std::cout << "Observer created: " << name << "\n";
    }

    ~ConcreteObserver() override {
        std::cout << "Observer destroyed: " << name << "\n";
    }

    void onNotify(const std::string& event) override {
        std::cout << "  [" << name << "] received event: " << event << "\n";
    }

    std::string getName() const override {
        return name;
    }
};

int main() {
    Subject subject;

    {
        auto obs1 = std::make_shared<ConcreteObserver>("Observer1");
        auto obs2 = std::make_shared<ConcreteObserver>("Observer2");
        auto obs3 = std::make_shared<ConcreteObserver>("Observer3");

        subject.attach(obs1);
        subject.attach(obs2);
        subject.attach(obs3);

        subject.setState("Active");

        std::cout << "\n--- Observer2 going out of scope ---\n";
    } // obs2 is destroyed

    std::cout << "\nAfter obs2 destroyed, observer count: "
              << subject.getObserverCount() << "\n";

    subject.setState("Inactive");

    return 0;
}
```

## Summary

Smart pointers are indispensable tools in modern C++, providing safe and efficient memory management mechanisms:

1. **unique_ptr**: Exclusive ownership, zero-overhead abstraction, should be the default choice
2. **shared_ptr**: Shared ownership, uses reference counting, suitable for scenarios requiring multiple owners
3. **weak_ptr**: Doesn't own the object, used for breaking circular references and implementing caches

### Selection Guide

- Use `unique_ptr` by default
- Use `shared_ptr` when shared ownership is needed
- Use `weak_ptr` to avoid circular references
- Prefer `make_unique` and `make_shared`
- Be aware of performance implications, but don't optimize prematurely

### Best Practices

- Follow the RAII principle
- Avoid manual `new` and `delete`
- Handle circular references correctly
- Be aware of prerequisites when using `enable_shared_from_this`
- Pass `shared_ptr` by value when sharing ownership is needed, pass by reference when only access is needed

By correctly using smart pointers, you can write safer, more maintainable C++ code while avoiding common memory management issues.
