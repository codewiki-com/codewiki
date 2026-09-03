---
title: C++ 虚函数深入解析
description: 全面剖析 C++ 虚函数机制，包括 virtual 关键字、虚函数表、纯虚函数、虚析构函数、override/final 关键字
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - 虚函数
  - 多态
  - vtable
  - override
  - final
status: imported
origin: old/src/content/docs/cpp/virtual-functions.zh.md
divergence: 0.169
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 面向对象
  order: 17
  lastUpdated: 2026-01-07
---

## 概念解释

虚函数（Virtual Function）是 C++ 实现运行时多态（Runtime Polymorphism）的核心机制。通过在基类中将成员函数声明为虚函数，派生类可以重写该函数，并且在通过基类指针或引用调用时，能够动态地调用到实际对象所属类的版本。

### 历史背景

虚函数的概念源于 Simula 67 语言，由 Bjarne Stroustrup 在设计 C++ 时引入。它解决了面向对象编程中的一个核心问题：如何让程序在运行时根据对象的实际类型来选择调用哪个函数实现。

### 解决的问题

在没有虚函数的情况下，函数调用在编译时就已确定（静态绑定）。这意味着通过基类指针调用函数时，总是调用基类的版本，而不是派生类的版本：

```cpp
#include <iostream>

class Animal {
public:
    void speak() const {  // 非虚函数
        std::cout << "动物发出声音" << std::endl;
    }
};

class Dog : public Animal {
public:
    void speak() const {  // 隐藏基类的 speak
        std::cout << "汪汪汪！" << std::endl;
    }
};

int main() {
    Dog dog;
    Animal* ptr = &dog;

    ptr->speak();   // 输出：动物发出声音（调用基类版本）
    dog.speak();    // 输出：汪汪汪！（调用派生类版本）

    return 0;
}
```

使用虚函数后，程序会在运行时根据对象的实际类型选择正确的函数版本：

```cpp
#include <iostream>

class Animal {
public:
    virtual void speak() const {  // 虚函数
        std::cout << "动物发出声音" << std::endl;
    }
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void speak() const override {  // 重写虚函数
        std::cout << "汪汪汪！" << std::endl;
    }
};

int main() {
    Dog dog;
    Animal* ptr = &dog;

    ptr->speak();   // 输出：汪汪汪！（动态绑定，调用派生类版本）
    dog.speak();    // 输出：汪汪汪！

    return 0;
}
```

## 核心原理

### 虚函数表（vtable）

C++ 编译器通过虚函数表（Virtual Function Table，简称 vtable 或 vftable）来实现虚函数的动态绑定。每个包含虚函数的类都有一个 vtable，其中存储了该类所有虚函数的地址。

#### vtable 结构

```
+------------------+
|     类 vtable    |
+------------------+
| 虚函数1 的地址   |
+------------------+
| 虚函数2 的地址   |
+------------------+
| 虚函数3 的地址   |
+------------------+
| ...              |
+------------------+
```

每个包含虚函数的类的对象都有一个隐藏的指针（通常称为 vptr），指向该类的 vtable：

```cpp
#include <iostream>

class Base {
public:
    virtual void func1() { std::cout << "Base::func1" << std::endl; }
    virtual void func2() { std::cout << "Base::func2" << std::endl; }
    virtual ~Base() = default;
private:
    int data = 0;
};

class Derived : public Base {
public:
    void func1() override { std::cout << "Derived::func1" << std::endl; }
    // func2 继承自 Base
private:
    int derivedData = 0;
};

int main() {
    std::cout << "sizeof(Base): " << sizeof(Base) << std::endl;
    std::cout << "sizeof(Derived): " << sizeof(Derived) << std::endl;

    // 对象内存布局（简化）：
    // Base 对象：
    // +--------+--------+
    // |  vptr  |  data  |
    // +--------+--------+
    //    |
    //    v
    // +----------------+----------------+----------------+
    // | Base::func1    | Base::func2    | Base::~Base    |
    // +----------------+----------------+----------------+
    //                  Base vtable

    // Derived 对象：
    // +--------+--------+-------------+
    // |  vptr  |  data  | derivedData |
    // +--------+--------+-------------+
    //    |
    //    v
    // +------------------+----------------+------------------+
    // | Derived::func1   | Base::func2    | Derived::~Derived|
    // +------------------+----------------+------------------+
    //                  Derived vtable

    return 0;
}
```

#### 虚函数调用过程

当通过基类指针调用虚函数时，编译器生成的代码执行以下步骤：

1. 通过对象的 vptr 找到对应的 vtable
2. 在 vtable 中查找虚函数的地址
3. 调用该地址处的函数

```cpp
// ptr->func1() 的伪代码实现：
// (*ptr->vptr[0])()  // 调用 vtable 中第一个虚函数
```

### 动态绑定 vs 静态绑定

```cpp
#include <iostream>

class Shape {
public:
    virtual void draw() const {
        std::cout << "绘制形状" << std::endl;
    }

    void info() const {  // 非虚函数
        std::cout << "这是一个形状" << std::endl;
    }

    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    void draw() const override {
        std::cout << "绘制圆形" << std::endl;
    }

    void info() const {  // 隐藏基类的 info
        std::cout << "这是一个圆形" << std::endl;
    }
};

int main() {
    Circle circle;
    Shape* shapePtr = &circle;
    Shape& shapeRef = circle;

    // 动态绑定（虚函数）
    shapePtr->draw();    // 输出：绘制圆形
    shapeRef.draw();     // 输出：绘制圆形

    // 静态绑定（非虚函数）
    shapePtr->info();    // 输出：这是一个形状
    shapeRef.info();     // 输出：这是一个形状

    // 直接通过对象调用
    circle.draw();       // 输出：绘制圆形
    circle.info();       // 输出：这是一个圆形

    return 0;
}
```

### vptr 的初始化时机

vptr 在对象构造时初始化，且在每个类的构造函数执行时会被更新：

```cpp
#include <iostream>

class Base {
public:
    Base() {
        std::cout << "Base 构造中..." << std::endl;
        // 此时 vptr 指向 Base 的 vtable
        print();  // 调用 Base::print()
    }

    virtual void print() const {
        std::cout << "Base::print()" << std::endl;
    }

    virtual ~Base() {
        std::cout << "Base 析构中..." << std::endl;
        // 此时 vptr 仍指向 Base 的 vtable
        print();  // 调用 Base::print()
    }
};

class Derived : public Base {
public:
    Derived() {
        std::cout << "Derived 构造中..." << std::endl;
        // 此时 vptr 指向 Derived 的 vtable
        print();  // 调用 Derived::print()
    }

    void print() const override {
        std::cout << "Derived::print()" << std::endl;
    }

    ~Derived() override {
        std::cout << "Derived 析构中..." << std::endl;
        print();  // 调用 Derived::print()
    }
};

int main() {
    std::cout << "=== 创建 Derived 对象 ===" << std::endl;
    Derived d;

    std::cout << "\n=== 通过基类指针调用 ===" << std::endl;
    Base* ptr = &d;
    ptr->print();  // 调用 Derived::print()

    std::cout << "\n=== 销毁对象 ===" << std::endl;
    return 0;
}

// 输出：
// === 创建 Derived 对象 ===
// Base 构造中...
// Base::print()
// Derived 构造中...
// Derived::print()
//
// === 通过基类指针调用 ===
// Derived::print()
//
// === 销毁对象 ===
// Derived 析构中...
// Derived::print()
// Base 析构中...
// Base::print()
```

## 核心要点

### virtual 关键字

`virtual` 关键字用于声明虚函数：

```cpp
class Base {
public:
    // 虚函数声明
    virtual void func();

    // 虚函数也可以有实现
    virtual void anotherFunc() {
        // 默认实现
    }

    // const 虚函数
    virtual void constFunc() const;

    // 虚析构函数
    virtual ~Base() = default;
};
```

#### 关键规则

1. **派生类中的重写函数自动为虚函数**：即使不加 `virtual` 关键字

```cpp
class Base {
public:
    virtual void func() {}
};

class Derived : public Base {
public:
    void func() {}  // 自动是虚函数，等同于 virtual void func()
};
```

2. **虚函数不能是静态的**：静态成员函数不属于任何对象

```cpp
class Example {
public:
    // 错误：虚函数不能是静态的
    // virtual static void func();
};
```

3. **构造函数不能是虚函数**：构造对象时需要知道确切类型

```cpp
class Example {
public:
    // 错误：构造函数不能是虚的
    // virtual Example();
};
```

4. **友元函数不能是虚函数**：友元不是成员函数

```cpp
class Example {
    // 错误：友元不能是虚的
    // virtual friend void func();
};
```

### override 关键字（C++11）

`override` 关键字明确表示函数意图重写基类的虚函数，如果没有匹配的基类虚函数，编译器会报错：

```cpp
class Base {
public:
    virtual void func1(int x) {}
    virtual void func2() const {}
    virtual void func3() {}
    void func4() {}  // 非虚函数

    virtual ~Base() = default;
};

class Derived : public Base {
public:
    // 正确：重写 func1
    void func1(int x) override {}

    // 错误示例（编译器报错）：
    // void func1(double x) override {}  // 参数类型不匹配
    // void func2() override {}           // 缺少 const
    // void func5() override {}           // 基类没有 func5
    // void func4() override {}           // func4 不是虚函数

    // 正确：
    void func2() const override {}
    void func3() override {}
};
```

### final 关键字（C++11）

`final` 关键字可以：
1. 阻止虚函数被进一步重写
2. 阻止类被继承

```cpp
class Base {
public:
    virtual void func1() {}
    virtual void func2() {}
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    // func1 不能被 Derived 的子类重写
    void func1() override final {}

    // func2 可以被继续重写
    void func2() override {}
};

class GrandChild : public Derived {
public:
    // 错误：func1 是 final 的
    // void func1() override {}

    // 正确：func2 可以重写
    void func2() override {}
};

// final 类不能被继承
class FinalClass final : public Base {
public:
    void func1() override {}
};

// 错误：FinalClass 是 final 的，不能被继承
// class CannotInherit : public FinalClass {};
```

### 纯虚函数

纯虚函数是没有实现的虚函数，通过 `= 0` 语法声明。包含纯虚函数的类成为抽象类，不能被实例化：

```cpp
#include <iostream>
#include <cmath>
#include <memory>
#include <vector>

// 抽象基类
class Shape {
public:
    virtual ~Shape() = default;

    // 纯虚函数
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual void draw() const = 0;

    // 普通虚函数（有默认实现）
    virtual std::string name() const {
        return "Shape";
    }
};

// 派生类必须实现所有纯虚函数
class Circle : public Shape {
private:
    double radius;

public:
    explicit Circle(double r) : radius(r) {}

    double area() const override {
        return M_PI * radius * radius;
    }

    double perimeter() const override {
        return 2 * M_PI * radius;
    }

    void draw() const override {
        std::cout << "绘制圆形，半径：" << radius << std::endl;
    }

    std::string name() const override {
        return "Circle";
    }
};

class Rectangle : public Shape {
private:
    double width, height;

public:
    Rectangle(double w, double h) : width(w), height(h) {}

    double area() const override {
        return width * height;
    }

    double perimeter() const override {
        return 2 * (width + height);
    }

    void draw() const override {
        std::cout << "绘制矩形，宽：" << width << "，高：" << height << std::endl;
    }

    std::string name() const override {
        return "Rectangle";
    }
};

int main() {
    // Shape shape;  // 错误：不能实例化抽象类

    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes.push_back(std::make_unique<Rectangle>(4.0, 6.0));

    for (const auto& shape : shapes) {
        std::cout << shape->name() << ":" << std::endl;
        shape->draw();
        std::cout << "  面积：" << shape->area() << std::endl;
        std::cout << "  周长：" << shape->perimeter() << std::endl;
        std::cout << std::endl;
    }

    return 0;
}
```

#### 纯虚函数可以有实现

纯虚函数可以有默认实现，派生类可以选择调用：

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() = default;

    // 纯虚函数带实现
    virtual void process() = 0;
};

// 在类外定义纯虚函数的实现
void Base::process() {
    std::cout << "Base::process() 默认处理" << std::endl;
}

class Derived1 : public Base {
public:
    void process() override {
        std::cout << "Derived1::process() 开始" << std::endl;
        Base::process();  // 显式调用基类实现
        std::cout << "Derived1::process() 结束" << std::endl;
    }
};

class Derived2 : public Base {
public:
    void process() override {
        std::cout << "Derived2::process() 完全自定义" << std::endl;
    }
};

int main() {
    Derived1 d1;
    Derived2 d2;

    d1.process();
    std::cout << std::endl;
    d2.process();

    return 0;
}

// 输出：
// Derived1::process() 开始
// Base::process() 默认处理
// Derived1::process() 结束
//
// Derived2::process() 完全自定义
```

### 虚析构函数

当通过基类指针删除派生类对象时，必须使用虚析构函数，否则派生类的析构函数不会被调用，可能导致资源泄漏：

```cpp
#include <iostream>

// 错误示例：非虚析构函数
class BadBase {
public:
    BadBase() { std::cout << "BadBase 构造" << std::endl; }
    ~BadBase() { std::cout << "BadBase 析构" << std::endl; }  // 非虚！
};

class BadDerived : public BadBase {
private:
    int* data;
public:
    BadDerived() : data(new int[100]) {
        std::cout << "BadDerived 构造，分配内存" << std::endl;
    }
    ~BadDerived() {
        delete[] data;
        std::cout << "BadDerived 析构，释放内存" << std::endl;
    }
};

// 正确示例：虚析构函数
class GoodBase {
public:
    GoodBase() { std::cout << "GoodBase 构造" << std::endl; }
    virtual ~GoodBase() { std::cout << "GoodBase 析构" << std::endl; }  // 虚！
};

class GoodDerived : public GoodBase {
private:
    int* data;
public:
    GoodDerived() : data(new int[100]) {
        std::cout << "GoodDerived 构造，分配内存" << std::endl;
    }
    ~GoodDerived() override {
        delete[] data;
        std::cout << "GoodDerived 析构，释放内存" << std::endl;
    }
};

int main() {
    std::cout << "=== 错误示例（内存泄漏）===" << std::endl;
    {
        BadBase* badPtr = new BadDerived();
        delete badPtr;  // 只调用 BadBase 的析构函数！
    }

    std::cout << "\n=== 正确示例 ===" << std::endl;
    {
        GoodBase* goodPtr = new GoodDerived();
        delete goodPtr;  // 正确调用两个析构函数
    }

    return 0;
}

// 输出：
// === 错误示例（内存泄漏）===
// BadBase 构造
// BadDerived 构造，分配内存
// BadBase 析构
// （BadDerived 的析构函数未调用，内存泄漏！）
//
// === 正确示例 ===
// GoodBase 构造
// GoodDerived 构造，分配内存
// GoodDerived 析构，释放内存
// GoodBase 析构
```

#### 虚析构函数规则

```cpp
class Base {
public:
    // 规则 1：如果类有虚函数，应该有虚析构函数
    virtual void func() = 0;
    virtual ~Base() = default;
};

class PolymorphicBase {
public:
    // 规则 2：如果类将作为多态基类，应该有虚析构函数
    virtual ~PolymorphicBase() = default;
};

class NonPolymorphicBase {
protected:
    // 规则 3：如果不想通过基类指针删除，可以使用 protected 非虚析构函数
    ~NonPolymorphicBase() = default;
};
```

## 代码示例

### 完整的多态示例：动物园系统

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <string>

// 抽象基类：动物
class Animal {
protected:
    std::string name;
    int age;

public:
    Animal(const std::string& n, int a) : name(n), age(a) {}
    virtual ~Animal() = default;

    // 纯虚函数
    virtual void speak() const = 0;
    virtual void move() const = 0;
    virtual std::string getSpecies() const = 0;

    // 虚函数（有默认实现）
    virtual void eat() const {
        std::cout << name << " 正在进食" << std::endl;
    }

    virtual void sleep() const {
        std::cout << name << " 正在睡觉" << std::endl;
    }

    // 非虚函数
    std::string getName() const { return name; }
    int getAge() const { return age; }

    void printInfo() const {
        std::cout << "物种: " << getSpecies()
                  << ", 名字: " << name
                  << ", 年龄: " << age << std::endl;
    }
};

// 哺乳动物接口
class Mammal : virtual public Animal {
public:
    using Animal::Animal;

    virtual void nurse() const {
        std::cout << name << " 正在哺乳" << std::endl;
    }
};

// 飞行动物接口
class Flyable {
public:
    virtual ~Flyable() = default;
    virtual void fly() const = 0;
    virtual double getWingspan() const = 0;
};

// 具体类：狗
class Dog final : public Mammal {
private:
    std::string breed;

public:
    Dog(const std::string& n, int a, const std::string& b)
        : Animal(n, a), Mammal(n, a), breed(b) {}

    void speak() const override {
        std::cout << name << " 说：汪汪汪！" << std::endl;
    }

    void move() const override {
        std::cout << name << " 正在奔跑" << std::endl;
    }

    std::string getSpecies() const override {
        return "狗 (" + breed + ")";
    }

    void eat() const override {
        std::cout << name << " 正在吃狗粮" << std::endl;
    }

    // 狗特有的方法
    void fetch() const {
        std::cout << name << " 去捡球了！" << std::endl;
    }

    std::string getBreed() const { return breed; }
};

// 具体类：猫
class Cat final : public Mammal {
private:
    bool isIndoor;

public:
    Cat(const std::string& n, int a, bool indoor)
        : Animal(n, a), Mammal(n, a), isIndoor(indoor) {}

    void speak() const override {
        std::cout << name << " 说：喵喵喵！" << std::endl;
    }

    void move() const override {
        std::cout << name << " 正在优雅地行走" << std::endl;
    }

    std::string getSpecies() const override {
        return isIndoor ? "家猫" : "野猫";
    }

    void sleep() const override {
        std::cout << name << " 蜷缩成一团睡觉" << std::endl;
    }

    // 猫特有的方法
    void purr() const {
        std::cout << name << " 发出咕噜声" << std::endl;
    }
};

// 具体类：蝙蝠（既是哺乳动物又能飞）
class Bat final : public Mammal, public Flyable {
private:
    double wingspan;

public:
    Bat(const std::string& n, int a, double ws)
        : Animal(n, a), Mammal(n, a), wingspan(ws) {}

    void speak() const override {
        std::cout << name << " 发出超声波" << std::endl;
    }

    void move() const override {
        fly();
    }

    std::string getSpecies() const override {
        return "蝙蝠";
    }

    void fly() const override {
        std::cout << name << " 在夜空中飞翔" << std::endl;
    }

    double getWingspan() const override {
        return wingspan;
    }

    void sleep() const override {
        std::cout << name << " 倒挂着睡觉" << std::endl;
    }
};

// 动物园类
class Zoo {
private:
    std::string name;
    std::vector<std::unique_ptr<Animal>> animals;

public:
    explicit Zoo(const std::string& n) : name(n) {}

    void addAnimal(std::unique_ptr<Animal> animal) {
        std::cout << "欢迎 " << animal->getName() << " 加入 " << name << "！" << std::endl;
        animals.push_back(std::move(animal));
    }

    void showAllAnimals() const {
        std::cout << "\n=== " << name << " 的所有动物 ===" << std::endl;
        for (const auto& animal : animals) {
            animal->printInfo();
        }
    }

    void makeAllSpeak() const {
        std::cout << "\n=== 所有动物说话 ===" << std::endl;
        for (const auto& animal : animals) {
            animal->speak();
        }
    }

    void feedAll() const {
        std::cout << "\n=== 喂食时间 ===" << std::endl;
        for (const auto& animal : animals) {
            animal->eat();
        }
    }

    void napTime() const {
        std::cout << "\n=== 午睡时间 ===" << std::endl;
        for (const auto& animal : animals) {
            animal->sleep();
        }
    }

    // 查找特定类型的动物
    template<typename T>
    std::vector<T*> findAnimalsOfType() const {
        std::vector<T*> result;
        for (const auto& animal : animals) {
            if (T* derived = dynamic_cast<T*>(animal.get())) {
                result.push_back(derived);
            }
        }
        return result;
    }
};

int main() {
    Zoo zoo("城市动物园");

    // 添加各种动物
    zoo.addAnimal(std::make_unique<Dog>("旺财", 3, "金毛"));
    zoo.addAnimal(std::make_unique<Dog>("小黑", 2, "拉布拉多"));
    zoo.addAnimal(std::make_unique<Cat>("咪咪", 4, true));
    zoo.addAnimal(std::make_unique<Cat>("野猫", 2, false));
    zoo.addAnimal(std::make_unique<Bat>("夜翼", 1, 0.3));

    // 展示所有动物
    zoo.showAllAnimals();

    // 多态调用
    zoo.makeAllSpeak();
    zoo.feedAll();
    zoo.napTime();

    // 查找特定类型
    std::cout << "\n=== 查找所有狗 ===" << std::endl;
    auto dogs = zoo.findAnimalsOfType<Dog>();
    for (Dog* dog : dogs) {
        dog->fetch();
    }

    std::cout << "\n=== 查找所有会飞的动物 ===" << std::endl;
    auto flyables = zoo.findAnimalsOfType<Flyable>();
    for (Flyable* f : flyables) {
        f->fly();
        std::cout << "翼展: " << f->getWingspan() << " 米" << std::endl;
    }

    return 0;
}
```

### 虚函数表可视化

```cpp
#include <iostream>
#include <cstdint>

class Base {
public:
    virtual void func1() { std::cout << "Base::func1" << std::endl; }
    virtual void func2() { std::cout << "Base::func2" << std::endl; }
    virtual void func3() { std::cout << "Base::func3" << std::endl; }
    virtual ~Base() { std::cout << "Base::~Base" << std::endl; }

    int baseData = 10;
};

class Derived : public Base {
public:
    void func1() override { std::cout << "Derived::func1" << std::endl; }
    // func2 继承自 Base
    void func3() override { std::cout << "Derived::func3" << std::endl; }
    ~Derived() override { std::cout << "Derived::~Derived" << std::endl; }

    int derivedData = 20;
};

void inspectVTable(void* obj, const char* className) {
    std::cout << "\n=== " << className << " vtable 检查 ===" << std::endl;

    // vptr 通常位于对象的开始位置
    void** vptr = *reinterpret_cast<void***>(obj);

    std::cout << "对象地址: " << obj << std::endl;
    std::cout << "vptr 值: " << vptr << std::endl;

    // 打印 vtable 中的前几个函数指针（注意：这是平台相关的）
    for (int i = 0; i < 4; ++i) {
        std::cout << "vtable[" << i << "] = " << vptr[i] << std::endl;
    }
}

int main() {
    Base base;
    Derived derived;

    inspectVTable(&base, "Base");
    inspectVTable(&derived, "Derived");

    std::cout << "\n=== 通过基类指针调用 ===" << std::endl;
    Base* ptr = &derived;
    ptr->func1();  // Derived::func1
    ptr->func2();  // Base::func2
    ptr->func3();  // Derived::func3

    std::cout << "\n=== 对象大小 ===" << std::endl;
    std::cout << "sizeof(Base): " << sizeof(Base) << std::endl;
    std::cout << "sizeof(Derived): " << sizeof(Derived) << std::endl;
    std::cout << "sizeof(void*): " << sizeof(void*) << std::endl;

    std::cout << "\n=== 析构 ===" << std::endl;
    return 0;
}
```

## 最佳实践

### 基类应有虚析构函数

```cpp
// 好的做法
class Base {
public:
    virtual ~Base() = default;
    // 或者
    // virtual ~Base() {}
};

// 如果不打算通过基类指针删除，使用 protected 非虚析构函数
class NonDeletableBase {
protected:
    ~NonDeletableBase() = default;
};
```

### 使用 override 关键字

```cpp
class Base {
public:
    virtual void process(int x) {}
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    // 好：使用 override 让编译器检查
    void process(int x) override {}

    // 不好：容易出错且难以发现
    // void process(double x) {}  // 这不是重写！
};
```

### 使用 final 防止不当继承

```cpp
// 性能关键的类可以使用 final
class OptimizedWidget final {
    // 编译器可以进行去虚拟化优化
};

// 防止某个虚函数被进一步重写
class Base {
public:
    virtual void criticalOperation() = 0;
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void criticalOperation() override final {
        // 这个实现不应该被改变
    }
};
```

### 使用纯虚函数定义接口

```cpp
// 纯接口类
class ISerializer {
public:
    virtual ~ISerializer() = default;

    virtual void serialize(const std::string& data) = 0;
    virtual std::string deserialize() = 0;
};

class JsonSerializer : public ISerializer {
public:
    void serialize(const std::string& data) override {
        // JSON 序列化实现
    }

    std::string deserialize() override {
        // JSON 反序列化实现
        return "";
    }
};
```

### 避免在构造/析构函数中调用虚函数

```cpp
class Base {
public:
    Base() {
        // 不好：虚函数调用不会分派到派生类
        // init();
    }

    virtual void init() {}
    virtual ~Base() = default;

    // 好：使用工厂方法
    static std::unique_ptr<Base> create() {
        auto obj = std::make_unique<Base>();
        obj->init();
        return obj;
    }
};
```

### 优先使用组合而非继承

```cpp
// 不推荐：过度使用继承
class Engine {
public:
    virtual void start() {}
    virtual ~Engine() = default;
};

class Car : public Engine {  // Car 不是 Engine
    // ...
};

// 推荐：使用组合
class Car {
private:
    std::unique_ptr<Engine> engine;

public:
    Car(std::unique_ptr<Engine> e) : engine(std::move(e)) {}

    void start() {
        engine->start();
    }
};
```

## 常见陷阱

### 忘记虚析构函数

```cpp
class Base {
public:
    ~Base() {}  // 非虚析构函数 - 危险！
};

class Derived : public Base {
    std::vector<int> data;
public:
    ~Derived() {}
};

void bug() {
    Base* ptr = new Derived();
    delete ptr;  // 未定义行为！Derived 的析构函数不会被调用
}
```

### 函数签名不匹配

```cpp
class Base {
public:
    virtual void process(int x) {}
    virtual void handle(const std::string& s) const {}
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    // 错误：参数类型不同，这是隐藏而非重写
    void process(double x) {}  // 应该用 int

    // 错误：缺少 const，这是隐藏而非重写
    void handle(const std::string& s) {}  // 应该加 const

    // 正确做法：使用 override
    void process(int x) override {}
    void handle(const std::string& s) const override {}
};
```

### 切片问题

```cpp
class Base {
public:
    virtual void print() const {
        std::cout << "Base" << std::endl;
    }
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void print() const override {
        std::cout << "Derived" << std::endl;
    }
};

void slicingProblem() {
    Derived d;

    // 对象切片：派生类部分被"切掉"
    Base b = d;  // 复制，不是引用
    b.print();   // 输出 "Base"，不是 "Derived"

    // 正确：使用引用或指针
    Base& ref = d;
    ref.print(); // 输出 "Derived"

    Base* ptr = &d;
    ptr->print(); // 输出 "Derived"
}
```

### 在构造/析构函数中调用虚函数

```cpp
class Base {
public:
    Base() {
        // 危险：此时 vptr 指向 Base 的 vtable
        doSomething();  // 总是调用 Base::doSomething
    }

    virtual void doSomething() {
        std::cout << "Base::doSomething" << std::endl;
    }

    virtual ~Base() = default;
};

class Derived : public Base {
public:
    Derived() : Base() {
        // 此时 Derived::doSomething 才可用
    }

    void doSomething() override {
        std::cout << "Derived::doSomething" << std::endl;
    }
};

// 解决方案：使用两阶段构造
class BetterBase {
public:
    BetterBase() = default;

    void initialize() {
        doSomething();  // 现在可以正确分派
    }

    virtual void doSomething() = 0;
    virtual ~BetterBase() = default;
};
```

### 默认参数与虚函数

```cpp
class Base {
public:
    virtual void print(int x = 10) {
        std::cout << "Base: " << x << std::endl;
    }
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void print(int x = 20) override {
        std::cout << "Derived: " << x << std::endl;
    }
};

void defaultArgProblem() {
    Derived d;
    Base* ptr = &d;

    ptr->print();  // 输出 "Derived: 10" ！
    // 函数体来自 Derived，但默认参数来自 Base（静态绑定）

    d.print();     // 输出 "Derived: 20"
}
```

### 私有虚函数的误解

```cpp
class Base {
private:
    virtual void doWork() {  // 私有虚函数是合法的
        std::cout << "Base::doWork" << std::endl;
    }

public:
    void work() {
        doWork();  // 调用虚函数
    }

    virtual ~Base() = default;
};

class Derived : public Base {
private:
    void doWork() override {  // 可以重写私有虚函数
        std::cout << "Derived::doWork" << std::endl;
    }
};

void privateVirtualDemo() {
    Derived d;
    // d.doWork();  // 错误：doWork 是私有的
    d.work();       // 正确：通过公有接口调用，输出 "Derived::doWork"
}
```

## 性能考量

### 虚函数调用开销

虚函数调用比普通函数调用有额外开销：

1. **间接寻址**：需要通过 vptr 查找 vtable
2. **无法内联**：编译器通常无法内联虚函数调用
3. **分支预测**：可能导致分支预测失败

```cpp
#include <iostream>
#include <chrono>
#include <vector>

class Base {
public:
    virtual int compute(int x) { return x * 2; }
    int computeNonVirtual(int x) { return x * 2; }
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    int compute(int x) override { return x * 3; }
    int computeNonVirtual(int x) { return x * 3; }
};

void benchmarkVirtualCall() {
    const int iterations = 100000000;
    Derived obj;
    Base* ptr = &obj;

    // 虚函数调用
    auto start = std::chrono::high_resolution_clock::now();
    volatile int sum1 = 0;
    for (int i = 0; i < iterations; ++i) {
        sum1 += ptr->compute(i);
    }
    auto end = std::chrono::high_resolution_clock::now();
    auto virtualTime = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    // 非虚函数调用
    start = std::chrono::high_resolution_clock::now();
    volatile int sum2 = 0;
    for (int i = 0; i < iterations; ++i) {
        sum2 += obj.computeNonVirtual(i);
    }
    end = std::chrono::high_resolution_clock::now();
    auto nonVirtualTime = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    std::cout << "虚函数调用: " << virtualTime.count() << " ms" << std::endl;
    std::cout << "非虚函数调用: " << nonVirtualTime.count() << " ms" << std::endl;
}
```

### 优化建议

#### 使用 final 帮助编译器优化

```cpp
class Base {
public:
    virtual void process() {}
    virtual ~Base() = default;
};

// final 类允许编译器进行去虚拟化
class OptimizedDerived final : public Base {
public:
    void process() override {}
};

void callProcess(OptimizedDerived& obj) {
    obj.process();  // 编译器可以内联这个调用
}
```

#### 避免不必要的虚函数

```cpp
class Widget {
public:
    // 只有需要被重写的函数才声明为虚函数
    virtual void render() = 0;

    // 工具函数不需要是虚函数
    int getWidth() const { return width; }
    int getHeight() const { return height; }

    virtual ~Widget() = default;

protected:
    int width = 0;
    int height = 0;
};
```

#### 使用 CRTP 代替虚函数（静态多态）

```cpp
#include <iostream>

// CRTP: Curiously Recurring Template Pattern
template<typename Derived>
class Shape {
public:
    void draw() const {
        // 静态分派，无虚函数开销
        static_cast<const Derived*>(this)->drawImpl();
    }

    double area() const {
        return static_cast<const Derived*>(this)->areaImpl();
    }
};

class Circle : public Shape<Circle> {
private:
    double radius;

public:
    explicit Circle(double r) : radius(r) {}

    void drawImpl() const {
        std::cout << "绘制圆形" << std::endl;
    }

    double areaImpl() const {
        return 3.14159 * radius * radius;
    }
};

class Rectangle : public Shape<Rectangle> {
private:
    double width, height;

public:
    Rectangle(double w, double h) : width(w), height(h) {}

    void drawImpl() const {
        std::cout << "绘制矩形" << std::endl;
    }

    double areaImpl() const {
        return width * height;
    }
};

// 使用模板实现静态多态
template<typename ShapeType>
void renderShape(const Shape<ShapeType>& shape) {
    shape.draw();  // 编译时确定调用哪个函数
}

int main() {
    Circle c(5.0);
    Rectangle r(4.0, 6.0);

    renderShape(c);  // 编译时分派
    renderShape(r);

    std::cout << "圆面积: " << c.area() << std::endl;
    std::cout << "矩形面积: " << r.area() << std::endl;

    return 0;
}
```

#### 考虑对象大小影响

```cpp
#include <iostream>

class NoVirtual {
    int data;
};

class WithVirtual {
    int data;
public:
    virtual void func() {}
    virtual ~WithVirtual() = default;
};

int main() {
    std::cout << "sizeof(NoVirtual): " << sizeof(NoVirtual) << std::endl;
    std::cout << "sizeof(WithVirtual): " << sizeof(WithVirtual) << std::endl;
    std::cout << "sizeof(void*): " << sizeof(void*) << std::endl;

    // 在 64 位系统上：
    // NoVirtual: 4 字节（只有 int）
    // WithVirtual: 16 字节（vptr 8 字节 + int 4 字节 + padding 4 字节）

    return 0;
}
```

## 实战场景

### 场景 1：插件系统

```cpp
#include <iostream>
#include <memory>
#include <vector>
#include <string>
#include <map>

// 插件接口
class IPlugin {
public:
    virtual ~IPlugin() = default;

    virtual std::string getName() const = 0;
    virtual std::string getVersion() const = 0;
    virtual void initialize() = 0;
    virtual void shutdown() = 0;
    virtual void execute(const std::string& command) = 0;
};

// 日志插件
class LoggerPlugin : public IPlugin {
private:
    bool initialized = false;

public:
    std::string getName() const override { return "Logger"; }
    std::string getVersion() const override { return "1.0.0"; }

    void initialize() override {
        std::cout << "[Logger] 初始化日志系统..." << std::endl;
        initialized = true;
    }

    void shutdown() override {
        std::cout << "[Logger] 关闭日志系统..." << std::endl;
        initialized = false;
    }

    void execute(const std::string& command) override {
        if (initialized) {
            std::cout << "[Logger] 记录: " << command << std::endl;
        }
    }
};

// 网络插件
class NetworkPlugin : public IPlugin {
private:
    bool connected = false;

public:
    std::string getName() const override { return "Network"; }
    std::string getVersion() const override { return "2.1.0"; }

    void initialize() override {
        std::cout << "[Network] 建立网络连接..." << std::endl;
        connected = true;
    }

    void shutdown() override {
        std::cout << "[Network] 断开网络连接..." << std::endl;
        connected = false;
    }

    void execute(const std::string& command) override {
        if (connected) {
            std::cout << "[Network] 发送数据: " << command << std::endl;
        }
    }
};

// 插件管理器
class PluginManager {
private:
    std::vector<std::unique_ptr<IPlugin>> plugins;

public:
    void registerPlugin(std::unique_ptr<IPlugin> plugin) {
        std::cout << "注册插件: " << plugin->getName()
                  << " v" << plugin->getVersion() << std::endl;
        plugins.push_back(std::move(plugin));
    }

    void initializeAll() {
        std::cout << "\n=== 初始化所有插件 ===" << std::endl;
        for (auto& plugin : plugins) {
            plugin->initialize();
        }
    }

    void shutdownAll() {
        std::cout << "\n=== 关闭所有插件 ===" << std::endl;
        for (auto it = plugins.rbegin(); it != plugins.rend(); ++it) {
            (*it)->shutdown();
        }
    }

    void executeCommand(const std::string& command) {
        for (auto& plugin : plugins) {
            plugin->execute(command);
        }
    }
};

int main() {
    PluginManager manager;

    manager.registerPlugin(std::make_unique<LoggerPlugin>());
    manager.registerPlugin(std::make_unique<NetworkPlugin>());

    manager.initializeAll();

    std::cout << "\n=== 执行命令 ===" << std::endl;
    manager.executeCommand("Hello, World!");
    manager.executeCommand("数据包 #1");

    manager.shutdownAll();

    return 0;
}
```

### 场景 2：工厂模式

```cpp
#include <iostream>
#include <memory>
#include <map>
#include <functional>
#include <string>

// 产品接口
class Document {
public:
    virtual ~Document() = default;
    virtual void open() = 0;
    virtual void save() = 0;
    virtual void close() = 0;
    virtual std::string getType() const = 0;
};

// 具体产品
class TextDocument : public Document {
public:
    void open() override {
        std::cout << "打开文本文档" << std::endl;
    }

    void save() override {
        std::cout << "保存文本文档" << std::endl;
    }

    void close() override {
        std::cout << "关闭文本文档" << std::endl;
    }

    std::string getType() const override {
        return "text";
    }
};

class SpreadsheetDocument : public Document {
public:
    void open() override {
        std::cout << "打开电子表格" << std::endl;
    }

    void save() override {
        std::cout << "保存电子表格" << std::endl;
    }

    void close() override {
        std::cout << "关闭电子表格" << std::endl;
    }

    std::string getType() const override {
        return "spreadsheet";
    }
};

class PresentationDocument : public Document {
public:
    void open() override {
        std::cout << "打开演示文稿" << std::endl;
    }

    void save() override {
        std::cout << "保存演示文稿" << std::endl;
    }

    void close() override {
        std::cout << "关闭演示文稿" << std::endl;
    }

    std::string getType() const override {
        return "presentation";
    }
};

// 文档工厂
class DocumentFactory {
private:
    using Creator = std::function<std::unique_ptr<Document>()>;
    std::map<std::string, Creator> creators;

public:
    void registerType(const std::string& type, Creator creator) {
        creators[type] = std::move(creator);
    }

    std::unique_ptr<Document> create(const std::string& type) {
        auto it = creators.find(type);
        if (it != creators.end()) {
            return it->second();
        }
        throw std::runtime_error("Unknown document type: " + type);
    }
};

int main() {
    DocumentFactory factory;

    // 注册文档类型
    factory.registerType("text", []() {
        return std::make_unique<TextDocument>();
    });
    factory.registerType("spreadsheet", []() {
        return std::make_unique<SpreadsheetDocument>();
    });
    factory.registerType("presentation", []() {
        return std::make_unique<PresentationDocument>();
    });

    // 创建文档
    std::vector<std::unique_ptr<Document>> documents;
    documents.push_back(factory.create("text"));
    documents.push_back(factory.create("spreadsheet"));
    documents.push_back(factory.create("presentation"));

    // 操作所有文档
    for (auto& doc : documents) {
        std::cout << "\n处理 " << doc->getType() << " 文档:" << std::endl;
        doc->open();
        doc->save();
        doc->close();
    }

    return 0;
}
```

### 场景 3：策略模式

```cpp
#include <iostream>
#include <memory>
#include <vector>
#include <algorithm>

// 排序策略接口
class SortStrategy {
public:
    virtual ~SortStrategy() = default;
    virtual void sort(std::vector<int>& data) = 0;
    virtual std::string getName() const = 0;
};

// 冒泡排序
class BubbleSort : public SortStrategy {
public:
    void sort(std::vector<int>& data) override {
        for (size_t i = 0; i < data.size(); ++i) {
            for (size_t j = 0; j < data.size() - i - 1; ++j) {
                if (data[j] > data[j + 1]) {
                    std::swap(data[j], data[j + 1]);
                }
            }
        }
    }

    std::string getName() const override {
        return "冒泡排序";
    }
};

// 快速排序
class QuickSort : public SortStrategy {
private:
    void quickSort(std::vector<int>& data, int low, int high) {
        if (low < high) {
            int pivot = data[high];
            int i = low - 1;

            for (int j = low; j < high; ++j) {
                if (data[j] < pivot) {
                    ++i;
                    std::swap(data[i], data[j]);
                }
            }
            std::swap(data[i + 1], data[high]);

            int pi = i + 1;
            quickSort(data, low, pi - 1);
            quickSort(data, pi + 1, high);
        }
    }

public:
    void sort(std::vector<int>& data) override {
        if (!data.empty()) {
            quickSort(data, 0, static_cast<int>(data.size()) - 1);
        }
    }

    std::string getName() const override {
        return "快速排序";
    }
};

// 标准库排序
class StdSort : public SortStrategy {
public:
    void sort(std::vector<int>& data) override {
        std::sort(data.begin(), data.end());
    }

    std::string getName() const override {
        return "标准库排序";
    }
};

// 排序器上下文
class Sorter {
private:
    std::unique_ptr<SortStrategy> strategy;

public:
    void setStrategy(std::unique_ptr<SortStrategy> s) {
        strategy = std::move(s);
    }

    void sort(std::vector<int>& data) {
        if (strategy) {
            std::cout << "使用 " << strategy->getName() << std::endl;
            strategy->sort(data);
        }
    }
};

void printVector(const std::vector<int>& v) {
    std::cout << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        std::cout << v[i];
        if (i < v.size() - 1) std::cout << ", ";
    }
    std::cout << "]" << std::endl;
}

int main() {
    std::vector<int> data = {64, 34, 25, 12, 22, 11, 90};

    Sorter sorter;

    // 使用冒泡排序
    auto data1 = data;
    sorter.setStrategy(std::make_unique<BubbleSort>());
    sorter.sort(data1);
    std::cout << "结果: ";
    printVector(data1);

    // 使用快速排序
    auto data2 = data;
    sorter.setStrategy(std::make_unique<QuickSort>());
    sorter.sort(data2);
    std::cout << "结果: ";
    printVector(data2);

    // 使用标准库排序
    auto data3 = data;
    sorter.setStrategy(std::make_unique<StdSort>());
    sorter.sort(data3);
    std::cout << "结果: ";
    printVector(data3);

    return 0;
}
```

## 面试要点

### 什么是虚函数？为什么需要它？

**答案**：虚函数是使用 `virtual` 关键字声明的成员函数，允许派生类重写基类的实现。需要虚函数是为了实现运行时多态，即通过基类指针或引用调用函数时，能够根据实际对象类型调用正确的函数版本。

### 解释 vtable 和 vptr

**答案**：
- **vtable**（虚函数表）：每个包含虚函数的类都有一个 vtable，存储该类所有虚函数的地址
- **vptr**（虚函数表指针）：每个包含虚函数的对象都有一个隐藏的 vptr，指向其类的 vtable
- 虚函数调用时，通过 vptr 找到 vtable，再从 vtable 中查找函数地址并调用

### 纯虚函数与虚函数的区别？

**答案**：
- 虚函数可以有实现，派生类可以选择是否重写
- 纯虚函数使用 `= 0` 语法，使类成为抽象类，不能实例化
- 派生类必须实现所有纯虚函数才能被实例化
- 纯虚函数也可以有实现，但必须在类外定义

### 为什么基类需要虚析构函数？

**答案**：当通过基类指针删除派生类对象时，如果析构函数不是虚函数，只会调用基类的析构函数，派生类的析构函数不会被调用，可能导致资源泄漏。虚析构函数确保析构时正确调用整个继承链的析构函数。

### override 和 final 的作用？

**答案**：
- `override`：明确表示函数意图重写基类虚函数，如果签名不匹配，编译器会报错
- `final`：用于虚函数时，阻止派生类进一步重写；用于类时，阻止该类被继承

### 构造函数中可以调用虚函数吗？

**答案**：可以调用，但不会有多态效果。在构造函数执行时，派生类部分尚未初始化，vptr 指向当前正在构造的类的 vtable，所以虚函数调用不会分派到派生类的版本。同样的规则也适用于析构函数。

### 虚函数的性能开销？

**答案**：
- 每个对象额外存储一个 vptr（通常 4 或 8 字节）
- 每个类额外存储一个 vtable
- 虚函数调用需要额外的间接寻址
- 虚函数通常无法内联
- 可以使用 `final` 帮助编译器优化

### 私有虚函数有意义吗？

**答案**：有意义。私有虚函数可以被派生类重写（因为访问控制和虚函数机制是独立的），但不能被派生类直接调用。这是 NVI（Non-Virtual Interface）模式的基础，基类通过公有非虚函数调用私有虚函数，控制调用时机和上下文。

### 虚函数表存储在哪里？

**答案**：vtable 通常存储在程序的只读数据段（.rodata），因为它在编译时确定且不会改变。vptr 存储在每个对象中，通常位于对象内存的开始位置。

### 能否通过 vtable 直接调用虚函数？

**答案**：技术上可以，但这是未定义行为，不应该在正常代码中使用。vtable 的结构是编译器实现细节，不同编译器可能不同。

## 延伸阅读

### 官方文档和标准
- [C++ Reference - Virtual Functions](https://en.cppreference.com/w/cpp/language/virtual)
- [C++ Reference - Abstract Classes](https://en.cppreference.com/w/cpp/language/abstract_class)
- [C++ Reference - override](https://en.cppreference.com/w/cpp/language/override)
- [C++ Reference - final](https://en.cppreference.com/w/cpp/language/final)

### 经典书籍
- 《Effective C++》 - Scott Meyers（条款 7、33、34、35、36）
- 《C++ Primer》第 5 版 - Stanley Lippman（第 15 章：面向对象程序设计）
- 《Inside the C++ Object Model》 - Stanley Lippman（深入理解对象模型和 vtable）
- 《深度探索 C++ 对象模型》- 侯捷译

### 技术文章
- [Polymorphism in C++](https://isocpp.org/wiki/faq/virtual-functions) - ISO C++ FAQ
- [C++ Virtual Functions Demystified](https://www.learncpp.com/cpp-tutorial/the-virtual-table/)
- [Understanding Virtual Tables](https://pabloariasal.github.io/2017/06/10/understanding-virtual-tables/)

### 相关主题
- RTTI（运行时类型识别）：dynamic_cast 和 typeid
- 虚继承：解决菱形继承问题
- CRTP：编译时多态的替代方案
- 类型擦除：另一种多态实现方式
