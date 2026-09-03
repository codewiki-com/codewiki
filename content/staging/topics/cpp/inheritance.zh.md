---
title: C++ 继承与多态
description: 掌握 C++ 继承机制，包括虚函数、多态、抽象类和多重继承
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - 继承
  - 多态
  - 虚函数
status: imported
origin: old/src/content/docs/cpp/inheritance.zh.md
divergence: 0.272
issues: []
legacy:
  category: Cpp
  subcategory: 面向对象
  order: 16
  lastUpdated: 2026-01-07
---

继承是面向对象编程的三大特性之一（封装、继承、多态），它允许我们基于已有的类创建新类，实现代码复用和层次化设计。本文将深入探讨 C++ 继承机制的各个方面，包括基本继承、虚函数、多态、抽象类、多重继承和 RTTI。

## 继承基础

继承允许派生类（子类）获得基类（父类）的成员变量和成员函数。

### 基本语法

```cpp
#include <iostream>
#include <string>

// 基类
class Animal {
protected:
    std::string name;
    int age;

public:
    Animal(const std::string& n, int a) : name(n), age(a) {
        std::cout << "Animal 构造函数被调用" << std::endl;
    }

    ~Animal() {
        std::cout << "Animal 析构函数被调用" << std::endl;
    }

    void eat() const {
        std::cout << name << " 正在吃东西" << std::endl;
    }

    void sleep() const {
        std::cout << name << " 正在睡觉" << std::endl;
    }

    std::string getName() const { return name; }
    int getAge() const { return age; }
};

// 派生类
class Dog : public Animal {
private:
    std::string breed;  // 品种

public:
    Dog(const std::string& n, int a, const std::string& b)
        : Animal(n, a), breed(b) {
        std::cout << "Dog 构造函数被调用" << std::endl;
    }

    ~Dog() {
        std::cout << "Dog 析构函数被调用" << std::endl;
    }

    void bark() const {
        std::cout << name << " 汪汪叫！" << std::endl;
    }

    std::string getBreed() const { return breed; }
};

int main() {
    Dog dog("旺财", 3, "金毛");

    // 继承自基类的方法
    dog.eat();      // 输出: 旺财 正在吃东西
    dog.sleep();    // 输出: 旺财 正在睡觉

    // 派生类自己的方法
    dog.bark();     // 输出: 旺财 汪汪叫！

    std::cout << "名字: " << dog.getName() << std::endl;
    std::cout << "年龄: " << dog.getAge() << std::endl;
    std::cout << "品种: " << dog.getBreed() << std::endl;

    return 0;
}
```

### 构造和析构顺序

派生类对象的构造按照从基类到派生类的顺序进行，析构则相反：

```cpp
#include <iostream>

class Base {
public:
    Base() { std::cout << "Base 构造" << std::endl; }
    ~Base() { std::cout << "Base 析构" << std::endl; }
};

class Derived : public Base {
public:
    Derived() { std::cout << "Derived 构造" << std::endl; }
    ~Derived() { std::cout << "Derived 析构" << std::endl; }
};

class GrandChild : public Derived {
public:
    GrandChild() { std::cout << "GrandChild 构造" << std::endl; }
    ~GrandChild() { std::cout << "GrandChild 析构" << std::endl; }
};

int main() {
    GrandChild gc;
    return 0;
}

// 输出:
// Base 构造
// Derived 构造
// GrandChild 构造
// GrandChild 析构
// Derived 析构
// Base 析构
```

## 访问控制符

C++ 提供三种继承方式，它们影响基类成员在派生类中的访问权限。

### public 继承

public 继承是最常用的继承方式，基类的 public 成员在派生类中保持 public，protected 成员保持 protected：

```cpp
class Base {
public:
    int publicVar;
protected:
    int protectedVar;
private:
    int privateVar;
};

class PublicDerived : public Base {
public:
    void access() {
        publicVar = 1;      // 可以访问（继承为 public）
        protectedVar = 2;   // 可以访问（继承为 protected）
        // privateVar = 3;  // 错误：无法访问基类的 private 成员
    }
};

int main() {
    PublicDerived obj;
    obj.publicVar = 10;     // 可以访问
    // obj.protectedVar = 20;  // 错误：protected 不能在类外访问
    return 0;
}
```

### protected 继承

protected 继承使基类的 public 和 protected 成员都变为派生类的 protected 成员：

```cpp
class ProtectedDerived : protected Base {
public:
    void access() {
        publicVar = 1;      // 可以访问（继承为 protected）
        protectedVar = 2;   // 可以访问（保持 protected）
    }
};

int main() {
    ProtectedDerived obj;
    // obj.publicVar = 10;  // 错误：现在是 protected
    return 0;
}
```

### private 继承

private 继承使基类的所有可访问成员都变为派生类的 private 成员：

```cpp
class PrivateDerived : private Base {
public:
    void access() {
        publicVar = 1;      // 可以访问（继承为 private）
        protectedVar = 2;   // 可以访问（继承为 private）
    }
};

class GrandChild : public PrivateDerived {
public:
    void access() {
        // publicVar = 1;      // 错误：在 PrivateDerived 中是 private
        // protectedVar = 2;   // 错误：在 PrivateDerived 中是 private
    }
};

int main() {
    PrivateDerived obj;
    // obj.publicVar = 10;  // 错误：现在是 private
    return 0;
}
```

### 访问权限总结表

| 基类成员    | public 继承   | protected 继承 | private 继承 |
|-------------|---------------|----------------|--------------|
| public      | public        | protected      | private      |
| protected   | protected     | protected      | private      |
| private     | 不可访问      | 不可访问       | 不可访问     |

## 虚函数与多态

多态允许通过基类指针或引用调用派生类的重写方法，实现运行时的动态绑定。

### 函数重写与虚函数

没有虚函数时，函数调用在编译时确定（静态绑定）：

```cpp
#include <iostream>

class Shape {
public:
    void draw() const {
        std::cout << "绘制形状" << std::endl;
    }
};

class Circle : public Shape {
public:
    void draw() const {
        std::cout << "绘制圆形" << std::endl;
    }
};

int main() {
    Circle circle;
    Shape* shapePtr = &circle;

    shapePtr->draw();  // 输出: 绘制形状（静态绑定，调用基类方法）
    circle.draw();     // 输出: 绘制圆形

    return 0;
}
```

使用虚函数实现动态绑定：

```cpp
#include <iostream>

class Shape {
public:
    virtual void draw() const {
        std::cout << "绘制形状" << std::endl;
    }

    virtual ~Shape() = default;  // 虚析构函数
};

class Circle : public Shape {
public:
    void draw() const override {
        std::cout << "绘制圆形" << std::endl;
    }
};

class Rectangle : public Shape {
public:
    void draw() const override {
        std::cout << "绘制矩形" << std::endl;
    }
};

class Triangle : public Shape {
public:
    void draw() const override {
        std::cout << "绘制三角形" << std::endl;
    }
};

int main() {
    Circle circle;
    Rectangle rectangle;
    Triangle triangle;

    // 通过基类指针实现多态
    Shape* shapes[] = {&circle, &rectangle, &triangle};

    for (const Shape* shape : shapes) {
        shape->draw();  // 动态绑定，调用各自的实现
    }

    return 0;
}

// 输出:
// 绘制圆形
// 绘制矩形
// 绘制三角形
```

### override 和 final 关键字

C++11 引入了 `override` 和 `final` 关键字，帮助避免常见的多态错误：

```cpp
class Base {
public:
    virtual void func1() { }
    virtual void func2(int x) { }
    virtual void func3() const { }
    void func4() { }  // 非虚函数
};

class Derived : public Base {
public:
    // 正确：使用 override 明确表示重写
    void func1() override { }

    // 错误示例（编译器会报错）：
    // void func2(double x) override { }  // 参数类型不匹配
    // void func3() override { }          // 缺少 const
    // void func4() override { }          // func4 不是虚函数

    void func2(int x) override { }
    void func3() const override { }
};

// 使用 final 阻止进一步重写
class FinalExample : public Base {
public:
    void func1() override final { }  // 不能被派生类重写
};

// final 类不能被继承
class FinalClass final : public Base {
    // ...
};

// class CannotDerive : public FinalClass { };  // 错误：FinalClass 是 final
```

### 虚析构函数

当通过基类指针删除派生类对象时，必须使用虚析构函数：

```cpp
#include <iostream>

class Base {
public:
    Base() { std::cout << "Base 构造" << std::endl; }

    // 非虚析构函数 - 危险！
    ~Base() { std::cout << "Base 析构" << std::endl; }
};

class Derived : public Base {
private:
    int* data;

public:
    Derived() : data(new int[100]) {
        std::cout << "Derived 构造，分配内存" << std::endl;
    }

    ~Derived() {
        delete[] data;
        std::cout << "Derived 析构，释放内存" << std::endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;  // 只调用 Base 的析构函数，Derived 的内存泄漏！

    return 0;
}
// 输出:
// Base 构造
// Derived 构造，分配内存
// Base 析构
// （注意：Derived 的析构函数未被调用，内存泄漏！）
```

正确的做法：

```cpp
#include <iostream>

class Base {
public:
    Base() { std::cout << "Base 构造" << std::endl; }

    // 虚析构函数 - 正确！
    virtual ~Base() { std::cout << "Base 析构" << std::endl; }
};

class Derived : public Base {
private:
    int* data;

public:
    Derived() : data(new int[100]) {
        std::cout << "Derived 构造，分配内存" << std::endl;
    }

    ~Derived() override {
        delete[] data;
        std::cout << "Derived 析构，释放内存" << std::endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;  // 正确调用两个析构函数

    return 0;
}
// 输出:
// Base 构造
// Derived 构造，分配内存
// Derived 析构，释放内存
// Base 析构
```

## 纯虚函数与抽象类

纯虚函数没有实现，使类成为抽象类，不能直接实例化。

### 纯虚函数

```cpp
#include <iostream>
#include <cmath>

// 抽象类
class Shape {
protected:
    std::string name;

public:
    Shape(const std::string& n) : name(n) {}
    virtual ~Shape() = default;

    // 纯虚函数
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual void draw() const = 0;

    // 普通成员函数
    std::string getName() const { return name; }

    void printInfo() const {
        std::cout << "形状: " << name << std::endl;
        std::cout << "面积: " << area() << std::endl;
        std::cout << "周长: " << perimeter() << std::endl;
    }
};

class Circle : public Shape {
private:
    double radius;

public:
    Circle(double r) : Shape("圆形"), radius(r) {}

    double area() const override {
        return M_PI * radius * radius;
    }

    double perimeter() const override {
        return 2 * M_PI * radius;
    }

    void draw() const override {
        std::cout << "绘制半径为 " << radius << " 的圆形" << std::endl;
    }
};

class Rectangle : public Shape {
private:
    double width, height;

public:
    Rectangle(double w, double h) : Shape("矩形"), width(w), height(h) {}

    double area() const override {
        return width * height;
    }

    double perimeter() const override {
        return 2 * (width + height);
    }

    void draw() const override {
        std::cout << "绘制 " << width << "x" << height << " 的矩形" << std::endl;
    }
};

int main() {
    // Shape shape("测试");  // 错误：不能实例化抽象类

    Circle circle(5.0);
    Rectangle rectangle(4.0, 6.0);

    circle.printInfo();
    std::cout << std::endl;
    rectangle.printInfo();

    return 0;
}
```

### 接口设计

抽象类常用于定义接口：

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <memory>

// 接口：可绘制对象
class IDrawable {
public:
    virtual ~IDrawable() = default;
    virtual void draw() const = 0;
};

// 接口：可移动对象
class IMovable {
public:
    virtual ~IMovable() = default;
    virtual void move(double dx, double dy) = 0;
    virtual double getX() const = 0;
    virtual double getY() const = 0;
};

// 接口：可缩放对象
class IScalable {
public:
    virtual ~IScalable() = default;
    virtual void scale(double factor) = 0;
};

// 实现多个接口的类
class GameObject : public IDrawable, public IMovable, public IScalable {
private:
    std::string name;
    double x, y;
    double size;

public:
    GameObject(const std::string& n, double px, double py, double s)
        : name(n), x(px), y(py), size(s) {}

    void draw() const override {
        std::cout << "绘制 " << name << " 在位置 (" << x << ", " << y
                  << "), 大小: " << size << std::endl;
    }

    void move(double dx, double dy) override {
        x += dx;
        y += dy;
        std::cout << name << " 移动到 (" << x << ", " << y << ")" << std::endl;
    }

    double getX() const override { return x; }
    double getY() const override { return y; }

    void scale(double factor) override {
        size *= factor;
        std::cout << name << " 缩放为 " << size << std::endl;
    }
};

int main() {
    std::vector<std::unique_ptr<IDrawable>> drawables;
    std::vector<IMovable*> movables;

    auto obj1 = std::make_unique<GameObject>("玩家", 0, 0, 1.0);
    auto obj2 = std::make_unique<GameObject>("敌人", 10, 5, 1.5);

    movables.push_back(obj1.get());
    movables.push_back(obj2.get());

    // 移动所有可移动对象
    for (auto* movable : movables) {
        movable->move(1.0, 1.0);
    }

    drawables.push_back(std::move(obj1));
    drawables.push_back(std::move(obj2));

    // 绘制所有可绘制对象
    for (const auto& drawable : drawables) {
        drawable->draw();
    }

    return 0;
}
```

### 纯虚函数的默认实现

纯虚函数可以有默认实现，派生类可以选择调用：

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() = default;

    // 纯虚函数带有默认实现
    virtual void process() = 0;
};

// 在类外定义纯虚函数的实现
void Base::process() {
    std::cout << "Base::process() 默认实现" << std::endl;
}

class Derived1 : public Base {
public:
    void process() override {
        std::cout << "Derived1::process() 开始" << std::endl;
        Base::process();  // 调用基类的默认实现
        std::cout << "Derived1::process() 结束" << std::endl;
    }
};

class Derived2 : public Base {
public:
    void process() override {
        std::cout << "Derived2::process() 完全自定义实现" << std::endl;
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
```

## 多重继承

C++ 支持一个类从多个基类继承。

### 基本多重继承

```cpp
#include <iostream>
#include <string>

class Flyable {
public:
    virtual ~Flyable() = default;

    virtual void fly() const {
        std::cout << "在天空中飞翔" << std::endl;
    }

    void takeOff() const {
        std::cout << "起飞" << std::endl;
    }
};

class Swimmable {
public:
    virtual ~Swimmable() = default;

    virtual void swim() const {
        std::cout << "在水中游泳" << std::endl;
    }

    void dive() const {
        std::cout << "潜水" << std::endl;
    }
};

class Duck : public Flyable, public Swimmable {
private:
    std::string name;

public:
    Duck(const std::string& n) : name(n) {}

    void fly() const override {
        std::cout << name << " 扑棱着翅膀飞翔" << std::endl;
    }

    void swim() const override {
        std::cout << name << " 优雅地在水面游动" << std::endl;
    }

    void quack() const {
        std::cout << name << " 嘎嘎叫" << std::endl;
    }
};

int main() {
    Duck duck("唐老鸭");

    duck.fly();     // 来自 Flyable
    duck.swim();    // 来自 Swimmable
    duck.takeOff(); // 来自 Flyable
    duck.dive();    // 来自 Swimmable
    duck.quack();   // Duck 自己的方法

    // 通过基类指针使用
    Flyable* flyable = &duck;
    flyable->fly();

    Swimmable* swimmable = &duck;
    swimmable->swim();

    return 0;
}
```

### 菱形继承问题

当两个类继承自同一个基类，而另一个类又同时继承这两个类时，会产生菱形继承问题：

```cpp
#include <iostream>

class Animal {
protected:
    std::string name;
    int age;

public:
    Animal(const std::string& n = "未知", int a = 0) : name(n), age(a) {
        std::cout << "Animal 构造: " << this << std::endl;
    }

    virtual ~Animal() = default;

    void info() const {
        std::cout << "名称: " << name << ", 年龄: " << age << std::endl;
    }
};

// 不使用虚继承
class Mammal : public Animal {
public:
    Mammal(const std::string& n, int a) : Animal(n, a) {
        std::cout << "Mammal 构造" << std::endl;
    }

    void giveBirth() const {
        std::cout << name << " 是胎生动物" << std::endl;
    }
};

class Bird : public Animal {
public:
    Bird(const std::string& n, int a) : Animal(n, a) {
        std::cout << "Bird 构造" << std::endl;
    }

    void layEggs() const {
        std::cout << name << " 会下蛋" << std::endl;
    }
};

// 菱形继承：Bat 同时继承 Mammal 和 Bird
class Bat : public Mammal, public Bird {
public:
    // 问题：Animal 被构造两次！
    Bat(const std::string& n, int a)
        : Mammal(n, a), Bird(n, a) {
        std::cout << "Bat 构造" << std::endl;
    }

    void fly() const {
        std::cout << "蝙蝠在飞行" << std::endl;
    }
};

int main() {
    Bat bat("蝙蝠侠", 5);

    // 错误：info() 有歧义
    // bat.info();

    // 必须指明使用哪个基类的版本
    bat.Mammal::info();
    bat.Bird::info();

    bat.fly();
    bat.giveBirth();
    // bat.layEggs();  // 这在逻辑上是错误的

    return 0;
}
```

## 虚继承

虚继承解决了菱形继承中基类被多次构造的问题。

### 虚继承语法

```cpp
#include <iostream>

class Animal {
protected:
    std::string name;

public:
    Animal(const std::string& n = "未知") : name(n) {
        std::cout << "Animal 构造: " << this << ", name=" << name << std::endl;
    }

    virtual ~Animal() {
        std::cout << "Animal 析构" << std::endl;
    }

    void info() const {
        std::cout << "动物名称: " << name << std::endl;
    }
};

// 使用虚继承
class Mammal : virtual public Animal {
public:
    Mammal(const std::string& n = "哺乳动物") : Animal(n) {
        std::cout << "Mammal 构造" << std::endl;
    }

    ~Mammal() override {
        std::cout << "Mammal 析构" << std::endl;
    }

    void giveBirth() const {
        std::cout << name << " 是胎生动物" << std::endl;
    }
};

class WingedAnimal : virtual public Animal {
public:
    WingedAnimal(const std::string& n = "有翼动物") : Animal(n) {
        std::cout << "WingedAnimal 构造" << std::endl;
    }

    ~WingedAnimal() override {
        std::cout << "WingedAnimal 析构" << std::endl;
    }

    void fly() const {
        std::cout << name << " 可以飞行" << std::endl;
    }
};

class Bat : public Mammal, public WingedAnimal {
public:
    // 虚继承时，最终派生类必须直接初始化虚基类
    Bat(const std::string& n) : Animal(n), Mammal(n), WingedAnimal(n) {
        std::cout << "Bat 构造" << std::endl;
    }

    ~Bat() override {
        std::cout << "Bat 析构" << std::endl;
    }

    void hunt() const {
        std::cout << name << " 在夜间捕猎" << std::endl;
    }
};

int main() {
    std::cout << "=== 创建 Bat 对象 ===" << std::endl;
    Bat bat("蝙蝠侠");

    std::cout << "\n=== 调用成员函数 ===" << std::endl;
    bat.info();       // 不再有歧义，只有一个 Animal 子对象
    bat.giveBirth();
    bat.fly();
    bat.hunt();

    std::cout << "\n=== 销毁对象 ===" << std::endl;
    return 0;
}

// 输出:
// === 创建 Bat 对象 ===
// Animal 构造: 0x..., name=蝙蝠侠
// Mammal 构造
// WingedAnimal 构造
// Bat 构造
//
// === 调用成员函数 ===
// 动物名称: 蝙蝠侠
// 蝙蝠侠 是胎生动物
// 蝙蝠侠 可以飞行
// 蝙蝠侠 在夜间捕猎
//
// === 销毁对象 ===
// Bat 析构
// WingedAnimal 析构
// Mammal 析构
// Animal 析构
```

### 虚继承的内存布局

虚继承会引入额外的间接层（虚基类指针），影响内存布局：

```cpp
#include <iostream>

class Base {
public:
    int baseValue;
    virtual void func() {}
};

class Derived1 : virtual public Base {
public:
    int d1Value;
};

class Derived2 : virtual public Base {
public:
    int d2Value;
};

class Final : public Derived1, public Derived2 {
public:
    int finalValue;
};

int main() {
    std::cout << "Base 大小: " << sizeof(Base) << std::endl;
    std::cout << "Derived1 大小: " << sizeof(Derived1) << std::endl;
    std::cout << "Derived2 大小: " << sizeof(Derived2) << std::endl;
    std::cout << "Final 大小: " << sizeof(Final) << std::endl;

    // 验证只有一个 Base 子对象
    Final f;
    f.baseValue = 42;

    Base* b1 = static_cast<Derived1*>(&f);
    Base* b2 = static_cast<Derived2*>(&f);

    std::cout << "通过 Derived1 访问: " << b1->baseValue << std::endl;
    std::cout << "通过 Derived2 访问: " << b2->baseValue << std::endl;
    std::cout << "地址相同: " << (b1 == b2 ? "是" : "否") << std::endl;

    return 0;
}
```

## 运行时类型识别（RTTI）

RTTI 允许在运行时检查对象的实际类型。

### dynamic_cast

`dynamic_cast` 用于安全地将基类指针或引用转换为派生类类型：

```cpp
#include <iostream>

class Animal {
public:
    virtual ~Animal() = default;
    virtual void speak() const = 0;
};

class Dog : public Animal {
public:
    void speak() const override {
        std::cout << "汪汪！" << std::endl;
    }

    void fetch() const {
        std::cout << "狗狗去捡球了" << std::endl;
    }
};

class Cat : public Animal {
public:
    void speak() const override {
        std::cout << "喵喵！" << std::endl;
    }

    void climb() const {
        std::cout << "猫咪爬树了" << std::endl;
    }
};

void interactWithAnimal(Animal* animal) {
    // 通用操作
    animal->speak();

    // 尝试转换为具体类型
    if (Dog* dog = dynamic_cast<Dog*>(animal)) {
        std::cout << "这是一只狗！" << std::endl;
        dog->fetch();
    } else if (Cat* cat = dynamic_cast<Cat*>(animal)) {
        std::cout << "这是一只猫！" << std::endl;
        cat->climb();
    } else {
        std::cout << "未知的动物类型" << std::endl;
    }
}

void interactWithAnimalRef(Animal& animal) {
    try {
        // 引用转换失败会抛出 std::bad_cast
        Dog& dog = dynamic_cast<Dog&>(animal);
        dog.fetch();
    } catch (const std::bad_cast& e) {
        std::cout << "转换失败: " << e.what() << std::endl;
    }
}

int main() {
    Dog dog;
    Cat cat;

    std::cout << "=== 与狗互动 ===" << std::endl;
    interactWithAnimal(&dog);

    std::cout << "\n=== 与猫互动 ===" << std::endl;
    interactWithAnimal(&cat);

    std::cout << "\n=== 引用转换测试 ===" << std::endl;
    interactWithAnimalRef(dog);  // 成功
    interactWithAnimalRef(cat);  // 失败，抛出异常

    return 0;
}
```

### typeid 运算符

`typeid` 返回对象的类型信息：

```cpp
#include <iostream>
#include <typeinfo>

class Base {
public:
    virtual ~Base() = default;
};

class Derived1 : public Base {};
class Derived2 : public Base {};

void printTypeInfo(const Base& obj) {
    std::cout << "typeid 名称: " << typeid(obj).name() << std::endl;
}

int main() {
    Base base;
    Derived1 d1;
    Derived2 d2;

    std::cout << "=== 类型信息 ===" << std::endl;
    printTypeInfo(base);
    printTypeInfo(d1);
    printTypeInfo(d2);

    std::cout << "\n=== 类型比较 ===" << std::endl;

    Base* ptr1 = &d1;
    Base* ptr2 = &d2;
    Base* ptr3 = &d1;

    if (typeid(*ptr1) == typeid(*ptr3)) {
        std::cout << "ptr1 和 ptr3 指向相同类型" << std::endl;
    }

    if (typeid(*ptr1) != typeid(*ptr2)) {
        std::cout << "ptr1 和 ptr2 指向不同类型" << std::endl;
    }

    if (typeid(*ptr1) == typeid(Derived1)) {
        std::cout << "ptr1 指向 Derived1 类型" << std::endl;
    }

    // 对于非多态类型，typeid 返回静态类型
    int x = 10;
    std::cout << "\nint 的类型名: " << typeid(x).name() << std::endl;

    return 0;
}
```

### 向下转型的比较

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() = default;
    int baseData = 10;
};

class Derived : public Base {
public:
    int derivedData = 20;
};

int main() {
    Base* basePtr = new Derived();

    // 1. dynamic_cast - 安全，运行时检查
    Derived* d1 = dynamic_cast<Derived*>(basePtr);
    if (d1) {
        std::cout << "dynamic_cast 成功: " << d1->derivedData << std::endl;
    }

    // 2. static_cast - 不安全，无运行时检查
    Derived* d2 = static_cast<Derived*>(basePtr);
    std::cout << "static_cast: " << d2->derivedData << std::endl;

    // 3. 对于非 Derived 对象的错误转换
    Base* actualBase = new Base();

    Derived* wrong1 = dynamic_cast<Derived*>(actualBase);
    if (wrong1 == nullptr) {
        std::cout << "dynamic_cast 返回 nullptr（安全检测到错误）" << std::endl;
    }

    // static_cast 无法检测错误，会导致未定义行为
    // Derived* wrong2 = static_cast<Derived*>(actualBase);
    // wrong2->derivedData;  // 危险！未定义行为

    delete basePtr;
    delete actualBase;

    return 0;
}
```

## 继承中的特殊情况

### 协变返回类型

派生类可以返回基类返回类型的派生类型：

```cpp
#include <iostream>
#include <memory>

class Animal {
public:
    virtual ~Animal() = default;
    virtual Animal* clone() const {
        return new Animal(*this);
    }

    virtual void speak() const {
        std::cout << "动物叫声" << std::endl;
    }
};

class Dog : public Animal {
public:
    // 协变返回类型：返回 Dog* 而不是 Animal*
    Dog* clone() const override {
        return new Dog(*this);
    }

    void speak() const override {
        std::cout << "汪汪！" << std::endl;
    }

    void fetch() const {
        std::cout << "狗狗捡球" << std::endl;
    }
};

int main() {
    Dog original;

    // 使用协变返回类型
    Dog* cloned = original.clone();  // 直接得到 Dog*，无需转换
    cloned->speak();
    cloned->fetch();

    // 通过基类指针使用
    Animal* animalPtr = &original;
    Animal* clonedAnimal = animalPtr->clone();
    clonedAnimal->speak();  // 输出: 汪汪！

    delete cloned;
    delete clonedAnimal;

    return 0;
}
```

### 隐藏（Name Hiding）

派生类中的同名函数会隐藏基类的所有同名函数：

```cpp
#include <iostream>

class Base {
public:
    virtual void func(int x) {
        std::cout << "Base::func(int): " << x << std::endl;
    }

    virtual void func(double x) {
        std::cout << "Base::func(double): " << x << std::endl;
    }

    void nonVirtual(int x) {
        std::cout << "Base::nonVirtual: " << x << std::endl;
    }
};

class Derived : public Base {
public:
    // 这个函数会隐藏 Base 中所有的 func 重载！
    void func(int x) override {
        std::cout << "Derived::func(int): " << x << std::endl;
    }

    // 使用 using 声明恢复基类的重载函数
    using Base::func;

    // 也会隐藏非虚函数
    void nonVirtual(double x) {
        std::cout << "Derived::nonVirtual(double): " << x << std::endl;
    }
};

int main() {
    Derived d;

    d.func(10);      // 调用 Derived::func(int)
    d.func(3.14);    // 由于 using 声明，调用 Base::func(double)

    d.nonVirtual(3.14);   // 调用 Derived::nonVirtual(double)
    // d.nonVirtual(10);  // 如果没有隐式转换，这可能调用派生类的版本

    // 显式调用基类版本
    d.Base::nonVirtual(10);

    return 0;
}
```

### 在构造/析构函数中调用虚函数

在构造函数和析构函数中，虚函数的行为与普通函数类似：

```cpp
#include <iostream>

class Base {
public:
    Base() {
        std::cout << "Base 构造中..." << std::endl;
        // 在构造函数中调用虚函数
        // 此时只有 Base 部分存在，所以调用 Base::print()
        print();
    }

    virtual ~Base() {
        std::cout << "Base 析构中..." << std::endl;
        // 在析构函数中调用虚函数
        // Derived 部分已销毁，所以调用 Base::print()
        print();
    }

    virtual void print() const {
        std::cout << "Base::print()" << std::endl;
    }
};

class Derived : public Base {
public:
    Derived() {
        std::cout << "Derived 构造中..." << std::endl;
        print();  // 现在调用 Derived::print()
    }

    ~Derived() override {
        std::cout << "Derived 析构中..." << std::endl;
        print();  // 仍然调用 Derived::print()
    }

    void print() const override {
        std::cout << "Derived::print()" << std::endl;
    }
};

int main() {
    std::cout << "=== 创建对象 ===" << std::endl;
    Derived d;

    std::cout << "\n=== 正常调用 ===" << std::endl;
    d.print();

    std::cout << "\n=== 销毁对象 ===" << std::endl;
    return 0;
}

// 输出:
// === 创建对象 ===
// Base 构造中...
// Base::print()        <- 不是 Derived::print()！
// Derived 构造中...
// Derived::print()
//
// === 正常调用 ===
// Derived::print()
//
// === 销毁对象 ===
// Derived 析构中...
// Derived::print()
// Base 析构中...
// Base::print()        <- 不是 Derived::print()！
```

## 实战示例：图形编辑器

以下是一个综合运用继承和多态的图形编辑器示例：

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <cmath>

// 点类
struct Point {
    double x, y;
    Point(double px = 0, double py = 0) : x(px), y(py) {}
};

// 抽象基类：形状
class Shape {
protected:
    Point position;
    std::string color;
    bool selected;

public:
    Shape(const Point& pos, const std::string& c)
        : position(pos), color(c), selected(false) {}

    virtual ~Shape() = default;

    // 纯虚函数
    virtual void draw() const = 0;
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual Shape* clone() const = 0;
    virtual std::string getTypeName() const = 0;

    // 通用方法
    virtual void move(double dx, double dy) {
        position.x += dx;
        position.y += dy;
    }

    void select() { selected = true; }
    void deselect() { selected = false; }
    bool isSelected() const { return selected; }

    void setColor(const std::string& c) { color = c; }
    std::string getColor() const { return color; }

    Point getPosition() const { return position; }

    virtual void printInfo() const {
        std::cout << getTypeName() << " at (" << position.x << ", " << position.y << ")"
                  << ", color: " << color
                  << ", area: " << area()
                  << ", perimeter: " << perimeter() << std::endl;
    }
};

// 圆形
class Circle : public Shape {
private:
    double radius;

public:
    Circle(const Point& center, double r, const std::string& c)
        : Shape(center, c), radius(r) {}

    void draw() const override {
        std::cout << "[绘制圆形] 圆心: (" << position.x << ", " << position.y
                  << "), 半径: " << radius << ", 颜色: " << color;
        if (selected) std::cout << " [已选中]";
        std::cout << std::endl;
    }

    double area() const override {
        return M_PI * radius * radius;
    }

    double perimeter() const override {
        return 2 * M_PI * radius;
    }

    Circle* clone() const override {
        return new Circle(*this);
    }

    std::string getTypeName() const override {
        return "Circle";
    }

    double getRadius() const { return radius; }
    void setRadius(double r) { radius = r; }
};

// 矩形
class Rectangle : public Shape {
private:
    double width, height;

public:
    Rectangle(const Point& topLeft, double w, double h, const std::string& c)
        : Shape(topLeft, c), width(w), height(h) {}

    void draw() const override {
        std::cout << "[绘制矩形] 左上角: (" << position.x << ", " << position.y
                  << "), 宽: " << width << ", 高: " << height << ", 颜色: " << color;
        if (selected) std::cout << " [已选中]";
        std::cout << std::endl;
    }

    double area() const override {
        return width * height;
    }

    double perimeter() const override {
        return 2 * (width + height);
    }

    Rectangle* clone() const override {
        return new Rectangle(*this);
    }

    std::string getTypeName() const override {
        return "Rectangle";
    }

    double getWidth() const { return width; }
    double getHeight() const { return height; }
};

// 三角形
class Triangle : public Shape {
private:
    Point p2, p3;  // position 是第一个顶点

public:
    Triangle(const Point& pt1, const Point& pt2, const Point& pt3, const std::string& c)
        : Shape(pt1, c), p2(pt2), p3(pt3) {}

    void draw() const override {
        std::cout << "[绘制三角形] 顶点: ("
                  << position.x << ", " << position.y << "), ("
                  << p2.x << ", " << p2.y << "), ("
                  << p3.x << ", " << p3.y << "), 颜色: " << color;
        if (selected) std::cout << " [已选中]";
        std::cout << std::endl;
    }

    double area() const override {
        // 使用叉积公式计算面积
        return 0.5 * std::abs(
            (p2.x - position.x) * (p3.y - position.y) -
            (p3.x - position.x) * (p2.y - position.y)
        );
    }

    double perimeter() const override {
        auto distance = [](const Point& a, const Point& b) {
            return std::sqrt((b.x - a.x) * (b.x - a.x) +
                           (b.y - a.y) * (b.y - a.y));
        };
        return distance(position, p2) + distance(p2, p3) + distance(p3, position);
    }

    Triangle* clone() const override {
        return new Triangle(*this);
    }

    std::string getTypeName() const override {
        return "Triangle";
    }

    void move(double dx, double dy) override {
        Shape::move(dx, dy);
        p2.x += dx;
        p2.y += dy;
        p3.x += dx;
        p3.y += dy;
    }
};

// 形状组（组合模式）
class ShapeGroup : public Shape {
private:
    std::vector<std::unique_ptr<Shape>> shapes;

public:
    ShapeGroup() : Shape(Point(0, 0), "group") {}

    void addShape(std::unique_ptr<Shape> shape) {
        shapes.push_back(std::move(shape));
    }

    void draw() const override {
        std::cout << "[绘制形状组] 包含 " << shapes.size() << " 个形状:" << std::endl;
        for (const auto& shape : shapes) {
            std::cout << "  ";
            shape->draw();
        }
    }

    double area() const override {
        double total = 0;
        for (const auto& shape : shapes) {
            total += shape->area();
        }
        return total;
    }

    double perimeter() const override {
        double total = 0;
        for (const auto& shape : shapes) {
            total += shape->perimeter();
        }
        return total;
    }

    ShapeGroup* clone() const override {
        auto* newGroup = new ShapeGroup();
        for (const auto& shape : shapes) {
            newGroup->shapes.push_back(
                std::unique_ptr<Shape>(shape->clone())
            );
        }
        return newGroup;
    }

    std::string getTypeName() const override {
        return "ShapeGroup";
    }

    void move(double dx, double dy) override {
        for (auto& shape : shapes) {
            shape->move(dx, dy);
        }
    }

    size_t size() const { return shapes.size(); }
};

// 图形编辑器
class GraphicsEditor {
private:
    std::vector<std::unique_ptr<Shape>> shapes;

public:
    void addShape(std::unique_ptr<Shape> shape) {
        shapes.push_back(std::move(shape));
        std::cout << "添加形状: " << shapes.back()->getTypeName() << std::endl;
    }

    void drawAll() const {
        std::cout << "\n=== 绘制所有形状 (" << shapes.size() << " 个) ===" << std::endl;
        for (const auto& shape : shapes) {
            shape->draw();
        }
    }

    void printAllInfo() const {
        std::cout << "\n=== 形状信息 ===" << std::endl;
        for (const auto& shape : shapes) {
            shape->printInfo();
        }
    }

    double totalArea() const {
        double total = 0;
        for (const auto& shape : shapes) {
            total += shape->area();
        }
        return total;
    }

    void moveSelected(double dx, double dy) {
        for (auto& shape : shapes) {
            if (shape->isSelected()) {
                shape->move(dx, dy);
            }
        }
    }

    void selectByType(const std::string& typeName) {
        for (auto& shape : shapes) {
            if (shape->getTypeName() == typeName) {
                shape->select();
            }
        }
    }

    void deselectAll() {
        for (auto& shape : shapes) {
            shape->deselect();
        }
    }
};

int main() {
    GraphicsEditor editor;

    // 添加各种形状
    editor.addShape(std::make_unique<Circle>(Point(0, 0), 5.0, "红色"));
    editor.addShape(std::make_unique<Rectangle>(Point(10, 10), 8.0, 4.0, "蓝色"));
    editor.addShape(std::make_unique<Triangle>(
        Point(0, 0), Point(4, 0), Point(2, 3), "绿色"));

    // 创建形状组
    auto group = std::make_unique<ShapeGroup>();
    group->addShape(std::make_unique<Circle>(Point(20, 20), 3.0, "黄色"));
    group->addShape(std::make_unique<Rectangle>(Point(25, 25), 4.0, 4.0, "紫色"));
    editor.addShape(std::move(group));

    // 绘制所有形状
    editor.drawAll();

    // 打印信息
    editor.printAllInfo();

    std::cout << "\n总面积: " << editor.totalArea() << std::endl;

    // 选择并移动圆形
    std::cout << "\n=== 选择所有圆形并移动 ===" << std::endl;
    editor.selectByType("Circle");
    editor.moveSelected(5, 5);
    editor.drawAll();

    editor.deselectAll();

    return 0;
}
```

## 最佳实践

### 遵循里氏替换原则

派生类应该能够替换基类使用，不改变程序的正确性：

```cpp
// 错误示例：违反里氏替换原则
class Bird {
public:
    virtual void fly() { std::cout << "Flying" << std::endl; }
};

class Penguin : public Bird {
public:
    void fly() override {
        throw std::logic_error("企鹅不会飞！");  // 违反 LSP
    }
};

// 正确设计
class Bird {
public:
    virtual void move() = 0;
};

class FlyingBird : public Bird {
public:
    void move() override { fly(); }
    virtual void fly() { std::cout << "Flying" << std::endl; }
};

class Penguin : public Bird {
public:
    void move() override { swim(); }
    void swim() { std::cout << "Swimming" << std::endl; }
};
```

### 优先使用组合而非继承

```cpp
// 使用继承（紧耦合）
class Stack : public std::vector<int> {
    // 暴露了 vector 的所有接口，可能破坏栈的语义
};

// 使用组合（松耦合，更好）
class Stack {
private:
    std::vector<int> data;

public:
    void push(int val) { data.push_back(val); }
    void pop() { data.pop_back(); }
    int top() const { return data.back(); }
    bool empty() const { return data.empty(); }
};
```

### 使用 override 和 final

```cpp
class Base {
public:
    virtual void func1() {}
    virtual void func2() {}
};

class Derived : public Base {
public:
    void func1() override {}       // 明确表示重写
    void func2() override final {} // 重写并阻止进一步重写
};
```

### 基类析构函数要么是公有虚函数，要么是保护非虚函数

```cpp
// 方式 1：公有虚析构函数（允许多态删除）
class Base1 {
public:
    virtual ~Base1() = default;
};

// 方式 2：保护非虚析构函数（禁止通过基类指针删除）
class Base2 {
protected:
    ~Base2() = default;  // 只能通过派生类删除
};
```

### 避免在构造和析构函数中调用虚函数

```cpp
class Base {
public:
    Base() {
        // 不要这样做
        // init();  // 虚函数调用不会分派到派生类
    }

    virtual void init() {}

    // 更好的方式：使用工厂方法
    static std::unique_ptr<Base> create() {
        auto obj = std::make_unique<Base>();
        obj->init();
        return obj;
    }
};
```

## 总结

本文详细介绍了 C++ 继承与多态的核心概念：

1. **继承基础**：派生类继承基类的成员，实现代码复用
2. **访问控制符**：public、protected、private 继承影响成员的可访问性
3. **虚函数与多态**：通过 virtual 实现运行时多态
4. **纯虚函数与抽象类**：定义接口，强制派生类实现
5. **多重继承**：一个类可以继承多个基类
6. **虚继承**：解决菱形继承中的歧义问题
7. **RTTI**：运行时类型识别，包括 dynamic_cast 和 typeid

掌握这些概念对于编写灵活、可扩展的 C++ 程序至关重要。继承和多态是面向对象设计的核心，合理使用它们可以创建出易于维护和扩展的代码架构。
