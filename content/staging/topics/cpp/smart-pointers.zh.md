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
origin: old/src/content/docs/cpp/smart-pointers.zh.md
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

## 概述

智能指针是 C++ 标准库提供的一种自动内存管理工具,用于解决手动管理动态内存可能导致的内存泄漏、悬空指针等问题。智能指针基于 RAII(Resource Acquisition Is Initialization)原则,在对象生命周期结束时自动释放所管理的资源。

C++11 引入了三种主要的智能指针:
- `std::unique_ptr` - 独占所有权的智能指针
- `std::shared_ptr` - 共享所有权的智能指针
- `std::weak_ptr` - 不控制对象生命周期的弱引用指针

## RAII 原则

RAII(Resource Acquisition Is Initialization)是 C++ 中最重要的资源管理技术之一。其核心思想是:

1. 资源的获取在对象构造时完成
2. 资源的释放在对象析构时自动完成
3. 利用栈对象的生命周期来管理资源

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
    // 函数结束时,unique_ptr 自动析构,Resource 被释放
}

int main() {
    demonstrateRAII();
    std::cout << "Function completed\n";
    return 0;
}
```

## std::unique_ptr

`unique_ptr` 是独占所有权的智能指针,同一时刻只能有一个 `unique_ptr` 指向某个对象。

### 基本用法

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
    // 创建 unique_ptr
    std::unique_ptr<Person> p1(new Person("Alice", 25));

    // 使用 make_unique (C++14,推荐)
    auto p2 = std::make_unique<Person>("Bob", 30);

    // 访问对象成员
    p1->introduce();
    (*p2).introduce();

    // unique_ptr 不能复制
    // std::unique_ptr<Person> p3 = p1; // 编译错误

    // 但可以移动
    std::unique_ptr<Person> p3 = std::move(p1);
    if (!p1) {
        std::cout << "p1 is now null\n";
    }
    p3->introduce();

    return 0;
}
```

### make_unique

`std::make_unique` (C++14) 是创建 `unique_ptr` 的推荐方式:

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
    // 推荐:使用 make_unique
    auto w1 = std::make_unique<Widget>(42);

    // 创建数组
    auto arr = std::make_unique<int[]>(10);
    for (int i = 0; i < 10; ++i) {
        arr[i] = i * i;
    }

    // make_unique 的优势:
    // 1. 异常安全
    // 2. 更简洁
    // 3. 避免重复类型名称

    return 0;
}
```

### unique_ptr 与容器

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

    // 添加任务
    tasks.push_back(std::make_unique<Task>("Task1"));
    tasks.push_back(std::make_unique<Task>("Task2"));
    tasks.push_back(std::make_unique<Task>("Task3"));

    // 执行所有任务
    for (const auto& task : tasks) {
        task->execute();
    }

    // vector 销毁时,所有 unique_ptr 及其管理的对象都会被自动销毁
    return 0;
}
```

### 自定义删除器

```cpp
#include <memory>
#include <iostream>
#include <cstdio>

// 文件句柄的自定义删除器
struct FileCloser {
    void operator()(FILE* fp) const {
        if (fp) {
            std::cout << "Closing file\n";
            fclose(fp);
        }
    }
};

// 使用 lambda 作为删除器
void customDeleterExample() {
    // 使用函数对象
    std::unique_ptr<FILE, FileCloser> file1(
        fopen("test.txt", "w")
    );

    // 使用 lambda
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

// 数组删除器示例
class Connection {
public:
    Connection() { std::cout << "Connection established\n"; }
    ~Connection() { std::cout << "Connection closed\n"; }
    void send(const std::string& msg) {
        std::cout << "Sending: " << msg << "\n";
    }
};

void arrayDeleterExample() {
    // 自定义删除器用于数组
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

`shared_ptr` 是共享所有权的智能指针,多个 `shared_ptr` 可以指向同一个对象。对象在最后一个 `shared_ptr` 被销毁时才会被释放。

### 基本用法

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
    // 创建 shared_ptr
    std::shared_ptr<Data> sp1 = std::make_shared<Data>(100);
    std::cout << "sp1 use_count: " << sp1.use_count() << "\n";

    {
        // 共享所有权
        std::shared_ptr<Data> sp2 = sp1;
        std::cout << "sp1 use_count: " << sp1.use_count() << "\n";
        std::cout << "sp2 use_count: " << sp2.use_count() << "\n";

        std::shared_ptr<Data> sp3 = sp2;
        std::cout << "sp1 use_count: " << sp1.use_count() << "\n";

        // sp2 和 sp3 在此作用域结束时被销毁
    }

    std::cout << "After scope, sp1 use_count: " << sp1.use_count() << "\n";

    // sp1 在 main 函数结束时被销毁,此时 Data 对象才被释放
    return 0;
}
```

### make_shared

`std::make_shared` 是创建 `shared_ptr` 的推荐方式:

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
    // 推荐:使用 make_shared
    auto node1 = std::make_shared<Node>(1, 1000);

    // 不推荐:直接使用 new
    // std::shared_ptr<Node> node2(new Node(2, 1000));

    // make_shared 的优势:
    // 1. 一次内存分配(控制块和对象在一起)
    // 2. 异常安全
    // 3. 性能更好

    return 0;
}
```

### shared_ptr 引用计数

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

    // reset 减少引用计数
    sp2.reset();
    checkUseCount(sp1, "sp1");
    checkUseCount(sp2, "sp2");

    // reset 并指向新对象
    sp3.reset(new int(100));
    checkUseCount(sp1, "sp1");
    checkUseCount(sp3, "sp3");

    return 0;
}
```

### shared_ptr 与多态

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

### 循环引用问题

```cpp
#include <memory>
#include <iostream>

class B; // 前向声明

class A {
public:
    std::shared_ptr<B> b_ptr;
    ~A() { std::cout << "A destroyed\n"; }
};

class B {
public:
    std::shared_ptr<A> a_ptr; // 这会导致循环引用!
    ~B() { std::cout << "B destroyed\n"; }
};

void circularReferenceDemo() {
    auto a = std::make_shared<A>();
    auto b = std::make_shared<B>();

    a->b_ptr = b;
    b->a_ptr = a;

    std::cout << "a use_count: " << a.use_count() << "\n"; // 2
    std::cout << "b use_count: " << b.use_count() << "\n"; // 2

    // 函数结束时,a 和 b 都不会被销毁,造成内存泄漏!
}

int main() {
    circularReferenceDemo();
    std::cout << "Function ended\n";
    // 注意:析构函数没有被调用!
    return 0;
}
```

## std::weak_ptr

`weak_ptr` 是一种不控制对象生命周期的智能指针,用于解决 `shared_ptr` 的循环引用问题。

### 基本用法

```cpp
#include <memory>
#include <iostream>

void weakPtrBasics() {
    std::weak_ptr<int> wp;

    {
        auto sp = std::make_shared<int>(42);
        wp = sp; // weak_ptr 不增加引用计数

        std::cout << "sp use_count: " << sp.use_count() << "\n"; // 1
        std::cout << "wp use_count: " << wp.use_count() << "\n"; // 1
        std::cout << "wp expired: " << wp.expired() << "\n"; // false

        // 使用 weak_ptr:需要先转换为 shared_ptr
        if (auto sp2 = wp.lock()) {
            std::cout << "Value: " << *sp2 << "\n";
            std::cout << "sp use_count: " << sp.use_count() << "\n"; // 2
        }

        // sp 在此作用域结束时被销毁
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

### 解决循环引用

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
    std::weak_ptr<Department> dept; // 使用 weak_ptr 避免循环引用
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

    // 所有对象都能正确销毁,没有内存泄漏
    return 0;
}
```

### weak_ptr 观察者模式

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
        // 清理已经失效的观察者
        auto it = observers.begin();
        while (it != observers.end()) {
            if (auto obs = it->lock()) {
                obs->update(message);
                ++it;
            } else {
                // 观察者已销毁,从列表中移除
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

        // obs2 在此作用域结束时被销毁
    }

    std::cout << "\nAfter obs2 destroyed:\n";
    subject.showObserverCount();
    subject.notify("Second message");

    return 0;
}
```

## 智能指针的选择指南

### 何时使用 unique_ptr

```cpp
#include <memory>
#include <vector>

// 1. 工厂函数返回值
std::unique_ptr<Widget> createWidget(int value) {
    return std::make_unique<Widget>(value);
}

// 2. Pimpl 惯用法(指向实现的指针)
class MyClass {
private:
    class Impl; // 前向声明
    std::unique_ptr<Impl> pImpl;
public:
    MyClass();
    ~MyClass();
    // ...
};

// 3. 管理独占资源
class FileManager {
private:
    std::unique_ptr<FILE, decltype(&fclose)> file;
public:
    FileManager(const char* filename)
        : file(fopen(filename, "r"), &fclose) {}
};

// 4. 容器中存储多态对象
void containerExample() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes.push_back(std::make_unique<Rectangle>(4.0, 6.0));
}
```

### 何时使用 shared_ptr

```cpp
#include <memory>
#include <thread>
#include <vector>

// 1. 需要共享所有权
class Cache {
private:
    std::vector<std::shared_ptr<Data>> cache;
public:
    std::shared_ptr<Data> getData(int id) {
        // 返回共享的数据,多个使用者可以持有
        return cache[id];
    }
};

// 2. 多线程共享数据
void threadSafeSharing() {
    auto data = std::make_shared<std::vector<int>>(1000);

    std::thread t1([data]() {
        // 线程 1 使用 data
        for (auto& val : *data) {
            val *= 2;
        }
    });

    std::thread t2([data]() {
        // 线程 2 使用 data
        // shared_ptr 保证 data 在两个线程都使用完后才销毁
    });

    t1.join();
    t2.join();
}

// 3. 回调函数需要保持对象存活
class AsyncProcessor {
public:
    void processAsync(std::shared_ptr<Data> data) {
        // 异步处理,shared_ptr 保证对象在处理期间存活
        std::thread([data]() {
            // 处理 data
        }).detach();
    }
};
```

### 何时使用 weak_ptr

```cpp
#include <memory>

// 1. 打破循环引用
class Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev; // 使用 weak_ptr 避免循环
};

// 2. 缓存系统
class DataCache {
private:
    std::map<int, std::weak_ptr<Data>> cache;
public:
    std::shared_ptr<Data> getData(int id) {
        auto it = cache.find(id);
        if (it != cache.end()) {
            if (auto data = it->second.lock()) {
                return data; // 缓存命中
            }
        }
        // 加载新数据
        auto data = loadData(id);
        cache[id] = data;
        return data;
    }
private:
    std::shared_ptr<Data> loadData(int id);
};

// 3. 观察者模式(如前所示)
```

## 性能考虑

### 智能指针开销

```cpp
#include <memory>
#include <iostream>
#include <chrono>

void performanceComparison() {
    const int N = 1000000;

    // 原始指针
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

### 最佳实践

```cpp
#include <memory>
#include <vector>

class BestPractices {
public:
    // 1. 优先使用 make_shared 和 make_unique
    void preferMakeFunctions() {
        auto ptr1 = std::make_unique<int>(42); // 好
        // std::unique_ptr<int> ptr2(new int(42)); // 不推荐

        auto ptr3 = std::make_shared<int>(42); // 好
        // std::shared_ptr<int> ptr4(new int(42)); // 不推荐
    }

    // 2. 按值传递 shared_ptr 当需要共享所有权时
    void shareOwnership(std::shared_ptr<Data> data) {
        // 增加引用计数,确保对象在函数执行期间存活
    }

    // 3. 按 const 引用传递 shared_ptr 当不需要共享所有权时
    void useData(const std::shared_ptr<Data>& data) {
        // 不增加引用计数,更高效
    }

    // 4. 使用 weak_ptr 打破循环引用
    struct Node {
        std::shared_ptr<Node> next;
        std::weak_ptr<Node> prev;
    };

    // 5. 使用 unique_ptr 作为默认选择
    std::unique_ptr<Widget> createWidget() {
        return std::make_unique<Widget>(42);
        // 调用者可以将其转换为 shared_ptr 如果需要
    }

    // 6. 避免从原始指针创建多个 shared_ptr
    void avoidDoubleOwnership() {
        Widget* raw = new Widget(42);
        // std::shared_ptr<Widget> sp1(raw); // 危险!
        // std::shared_ptr<Widget> sp2(raw); // 双重释放!

        // 正确做法:
        auto sp = std::make_shared<Widget>(42);
    }
};
```

## 常见陷阱与解决方案

### 陷阱 1: 从 this 创建 shared_ptr

```cpp
#include <memory>
#include <iostream>

// 错误示例
class BadWidget {
public:
    std::shared_ptr<BadWidget> getShared() {
        return std::shared_ptr<BadWidget>(this); // 危险!
    }
};

// 正确示例:使用 enable_shared_from_this
class GoodWidget : public std::enable_shared_from_this<GoodWidget> {
public:
    std::shared_ptr<GoodWidget> getShared() {
        return shared_from_this(); // 正确
    }

    void doSomething() {
        std::cout << "Doing something\n";
    }
};

void demonstrateSharedFromThis() {
    // 注意:必须已经有一个 shared_ptr 管理对象
    auto widget = std::make_shared<GoodWidget>();
    auto widget2 = widget->getShared();

    std::cout << "widget use_count: " << widget.use_count() << "\n"; // 2
    std::cout << "widget2 use_count: " << widget2.use_count() << "\n"; // 2
}
```

### 陷阱 2: 循环引用

```cpp
#include <memory>
#include <iostream>

// 问题:循环引用导致内存泄漏
class BadNode {
public:
    std::shared_ptr<BadNode> next;
    std::shared_ptr<BadNode> prev; // 循环引用!
    ~BadNode() { std::cout << "BadNode destroyed\n"; }
};

// 解决方案:使用 weak_ptr
class GoodNode {
public:
    std::shared_ptr<GoodNode> next;
    std::weak_ptr<GoodNode> prev; // 使用 weak_ptr
    ~GoodNode() { std::cout << "GoodNode destroyed\n"; }
};

void demonstrateCircularReference() {
    {
        auto bad1 = std::make_shared<BadNode>();
        auto bad2 = std::make_shared<BadNode>();
        bad1->next = bad2;
        bad2->prev = bad1; // 循环引用
        // 作用域结束时对象不会被销毁!
    }
    std::cout << "Bad nodes should be destroyed but aren't\n";

    {
        auto good1 = std::make_shared<GoodNode>();
        auto good2 = std::make_shared<GoodNode>();
        good1->next = good2;
        good2->prev = good1; // weak_ptr 不增加引用计数
        // 作用域结束时对象正确销毁
    }
    std::cout << "Good nodes destroyed correctly\n";
}
```

### 陷阱 3: 提前释放

```cpp
#include <memory>
#include <iostream>

void prematureRelease() {
    std::weak_ptr<int> wp;

    {
        auto sp = std::make_shared<int>(42);
        wp = sp;

        // 正确使用 weak_ptr
        if (auto sp2 = wp.lock()) {
            std::cout << "Value: " << *sp2 << "\n";
        }
    } // sp 在此销毁

    // 尝试使用已销毁的对象
    if (auto sp = wp.lock()) {
        std::cout << "Value: " << *sp << "\n";
    } else {
        std::cout << "Object has been destroyed\n"; // 这里会执行
    }
}
```

## 实际应用示例

### 示例 1: 资源管理器

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
        // 检查缓存
        auto it = cache.find(name);
        if (it != cache.end()) {
            if (auto resource = it->second.lock()) {
                std::cout << "Resource found in cache: " << name << "\n";
                return resource;
            }
        }

        // 加载新资源
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
        auto res3 = manager.loadResource("texture.png", 1024); // 从缓存加载

        manager.showCacheStatus();
    }

    std::cout << "\nAfter resources released:\n";
    manager.showCacheStatus();
    manager.cleanCache();
    manager.showCacheStatus();

    return 0;
}
```

### 示例 2: 图结构

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

    // 构建图结构
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

### 示例 3: 观察者模式完整实现

```cpp
#include <memory>
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

// 观察者接口
class IObserver {
public:
    virtual ~IObserver() = default;
    virtual void onNotify(const std::string& event) = 0;
    virtual std::string getName() const = 0;
};

// 主题类
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

// 具体观察者
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
    } // obs2 被销毁

    std::cout << "\nAfter obs2 destroyed, observer count: "
              << subject.getObserverCount() << "\n";

    subject.setState("Inactive");

    return 0;
}
```

## 总结

智能指针是现代 C++ 中不可或缺的工具,它们提供了安全、高效的内存管理机制:

1. **unique_ptr**: 独占所有权,零开销抽象,应作为默认选择
2. **shared_ptr**: 共享所有权,使用引用计数,适合需要多个所有者的场景
3. **weak_ptr**: 不拥有对象,用于打破循环引用和实现缓存等场景

### 选择指南

- 默认使用 `unique_ptr`
- 需要共享所有权时使用 `shared_ptr`
- 使用 `weak_ptr` 避免循环引用
- 优先使用 `make_unique` 和 `make_shared`
- 注意性能影响,但不要过早优化

### 最佳实践

- 遵循 RAII 原则
- 避免手动 `new` 和 `delete`
- 正确处理循环引用
- 使用 `enable_shared_from_this` 时注意前提条件
- 按值传递 `shared_ptr` 当需要共享所有权,按引用传递当只需要访问

通过正确使用智能指针,可以编写出更安全、更易维护的 C++ 代码,同时避免常见的内存管理问题。
