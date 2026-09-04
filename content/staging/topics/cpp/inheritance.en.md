---
title: C++ Inheritance and Polymorphism
description: Master C++ inheritance including virtual functions, polymorphism, abstract classes and multiple inheritance
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - inheritance
  - polymorphism
  - virtual functions
status: imported
origin: old/src/content/docs/cpp/inheritance.en.md
divergence: 0.272
issues: []
legacy:
  category: Cpp
  subcategory: OOP
  order: 16
  lastUpdated: 2026-01-07
---

Inheritance is one of the fundamental pillars of object-oriented programming in C++. It allows you to create new classes based on existing ones, promoting code reuse and establishing hierarchical relationships between types. Combined with polymorphism, inheritance enables writing flexible, extensible code that can work with objects of different types through a common interface.

## Introduction to Inheritance

Inheritance establishes an "is-a" relationship between classes. A derived class (also called subclass or child class) inherits members from a base class (also called superclass or parent class) and can add new members or modify inherited behavior.

### Basic Inheritance Syntax

```cpp
#include <iostream>
#include <string>

// Base class
class Animal {
protected:
    std::string name;
    int age;

public:
    Animal(const std::string& n, int a) : name(n), age(a) {
        std::cout << "Animal constructor called\n";
    }

    void eat() const {
        std::cout << name << " is eating.\n";
    }

    void sleep() const {
        std::cout << name << " is sleeping.\n";
    }

    std::string getName() const { return name; }
    int getAge() const { return age; }
};

// Derived class
class Dog : public Animal {
private:
    std::string breed;

public:
    Dog(const std::string& n, int a, const std::string& b)
        : Animal(n, a), breed(b) {
        std::cout << "Dog constructor called\n";
    }

    void bark() const {
        std::cout << name << " says: Woof!\n";
    }

    void fetch() const {
        std::cout << name << " is fetching the ball.\n";
    }

    std::string getBreed() const { return breed; }
};

int main() {
    Dog dog("Buddy", 3, "Golden Retriever");

    // Inherited methods
    dog.eat();
    dog.sleep();

    // Dog-specific methods
    dog.bark();
    dog.fetch();

    std::cout << dog.getName() << " is a " << dog.getBreed() << std::endl;

    return 0;
}
```

Output:
```
Animal constructor called
Dog constructor called
Buddy is eating.
Buddy is sleeping.
Buddy says: Woof!
Buddy is fetching the ball.
Buddy is a Golden Retriever
```

### What Gets Inherited

When a class inherits from another:

- **Inherited**: Data members, member functions, nested types
- **Not Inherited**: Constructors, destructors, assignment operators, friend declarations

```cpp
class Base {
public:
    int publicMember;
    void publicMethod() {}

protected:
    int protectedMember;
    void protectedMethod() {}

private:
    int privateMember;        // Not accessible in derived class
    void privateMethod() {}   // Not accessible in derived class
};

class Derived : public Base {
public:
    void accessMembers() {
        publicMember = 1;      // OK: public in base
        publicMethod();        // OK

        protectedMember = 2;   // OK: protected accessible in derived
        protectedMethod();     // OK

        // privateMember = 3;  // ERROR: private not accessible
        // privateMethod();    // ERROR: private not accessible
    }
};
```

## Access Specifiers in Inheritance

The inheritance access specifier determines how base class members are exposed in the derived class.

### Public Inheritance

Public inheritance maintains the access levels of base class members:

```cpp
class Base {
public:
    int publicMember;
protected:
    int protectedMember;
private:
    int privateMember;
};

class PublicDerived : public Base {
    // publicMember remains public
    // protectedMember remains protected
    // privateMember is inaccessible
};

int main() {
    PublicDerived obj;
    obj.publicMember = 1;      // OK: public
    // obj.protectedMember = 2; // ERROR: protected
}
```

### Protected Inheritance

Protected inheritance makes public members protected in the derived class:

```cpp
class ProtectedDerived : protected Base {
    // publicMember becomes protected
    // protectedMember remains protected
    // privateMember is inaccessible
};

int main() {
    ProtectedDerived obj;
    // obj.publicMember = 1;   // ERROR: now protected
}
```

### Private Inheritance

Private inheritance makes all inherited members private in the derived class:

```cpp
class PrivateDerived : private Base {
    // publicMember becomes private
    // protectedMember becomes private
    // privateMember is inaccessible
};

class FurtherDerived : public PrivateDerived {
    void test() {
        // publicMember;       // ERROR: private in PrivateDerived
        // protectedMember;    // ERROR: private in PrivateDerived
    }
};
```

### Access Specifier Summary

| Base Access | Public Inheritance | Protected Inheritance | Private Inheritance |
|-------------|-------------------|----------------------|---------------------|
| public      | public            | protected            | private             |
| protected   | protected         | protected            | private             |
| private     | inaccessible      | inaccessible         | inaccessible        |

### Using Declarations to Change Access

You can use `using` declarations to restore or change access levels:

```cpp
class Base {
public:
    void publicMethod() { std::cout << "public\n"; }
protected:
    void protectedMethod() { std::cout << "protected\n"; }
};

class Derived : private Base {
public:
    // Make publicMethod public again
    using Base::publicMethod;

    // Make protectedMethod public
    using Base::protectedMethod;
};

int main() {
    Derived d;
    d.publicMethod();     // OK: made public via using
    d.protectedMethod();  // OK: made public via using
}
```

## Constructors and Destructors in Inheritance

Understanding how constructors and destructors work in inheritance hierarchies is crucial for proper object initialization and cleanup.

### Constructor Chaining

Derived class constructors must initialize the base class part of the object:

```cpp
#include <iostream>

class Vehicle {
protected:
    std::string brand;
    int year;

public:
    Vehicle(const std::string& b, int y) : brand(b), year(y) {
        std::cout << "Vehicle constructor: " << brand << " (" << year << ")\n";
    }

    ~Vehicle() {
        std::cout << "Vehicle destructor: " << brand << "\n";
    }
};

class Car : public Vehicle {
private:
    int numDoors;

public:
    // Must call base class constructor in initializer list
    Car(const std::string& b, int y, int doors)
        : Vehicle(b, y), numDoors(doors) {
        std::cout << "Car constructor: " << numDoors << " doors\n";
    }

    ~Car() {
        std::cout << "Car destructor\n";
    }
};

class ElectricCar : public Car {
private:
    int batteryCapacity;

public:
    ElectricCar(const std::string& b, int y, int doors, int battery)
        : Car(b, y, doors), batteryCapacity(battery) {
        std::cout << "ElectricCar constructor: " << batteryCapacity << " kWh\n";
    }

    ~ElectricCar() {
        std::cout << "ElectricCar destructor\n";
    }
};

int main() {
    std::cout << "Creating ElectricCar:\n";
    ElectricCar tesla("Tesla", 2024, 4, 100);

    std::cout << "\nDestroying ElectricCar:\n";
    return 0;
}
```

Output:
```
Creating ElectricCar:
Vehicle constructor: Tesla (2024)
Car constructor: 4 doors
ElectricCar constructor: 100 kWh

Destroying ElectricCar:
ElectricCar destructor
Car destructor
Vehicle destructor: Tesla
```

**Key Points:**
- Constructors are called from base to derived (top-down)
- Destructors are called from derived to base (bottom-up)
- Base class must be initialized before derived class members

### Default Base Class Constructor

If no base constructor is explicitly called, the default constructor is used:

```cpp
class Base {
public:
    Base() {
        std::cout << "Base default constructor\n";
    }

    Base(int x) {
        std::cout << "Base parameterized constructor: " << x << "\n";
    }
};

class Derived : public Base {
public:
    // Implicitly calls Base()
    Derived() {
        std::cout << "Derived constructor\n";
    }

    // Explicitly calls Base(int)
    Derived(int x) : Base(x) {
        std::cout << "Derived constructor with param\n";
    }
};
```

### Inheriting Constructors (C++11)

The `using` declaration can bring base class constructors into the derived class:

```cpp
class Base {
public:
    Base() { std::cout << "Base()\n"; }
    Base(int x) { std::cout << "Base(int): " << x << "\n"; }
    Base(int x, int y) { std::cout << "Base(int, int): " << x << ", " << y << "\n"; }
};

class Derived : public Base {
public:
    // Inherit all Base constructors
    using Base::Base;

    // Can still add derived-specific constructors
    Derived(const std::string& s) : Base() {
        std::cout << "Derived(string): " << s << "\n";
    }
};

int main() {
    Derived d1;          // Calls inherited Base()
    Derived d2(10);      // Calls inherited Base(int)
    Derived d3(1, 2);    // Calls inherited Base(int, int)
    Derived d4("hello"); // Calls Derived(string)
}
```

## Virtual Functions and Polymorphism

Polymorphism allows objects of different derived classes to be treated uniformly through base class pointers or references, while still invoking the appropriate derived class behavior.

### Non-Virtual vs Virtual Functions

```cpp
#include <iostream>

class Shape {
public:
    // Non-virtual function
    void identify() const {
        std::cout << "I am a Shape\n";
    }

    // Virtual function
    virtual void draw() const {
        std::cout << "Drawing a generic shape\n";
    }
};

class Circle : public Shape {
public:
    void identify() const {  // Hides base class version
        std::cout << "I am a Circle\n";
    }

    void draw() const override {  // Overrides base class version
        std::cout << "Drawing a circle\n";
    }
};

int main() {
    Circle circle;
    Shape* shapePtr = &circle;
    Shape& shapeRef = circle;

    // Non-virtual: calls Shape::identify() - determined at compile time
    shapePtr->identify();  // Output: I am a Shape
    shapeRef.identify();   // Output: I am a Shape

    // Virtual: calls Circle::draw() - determined at runtime
    shapePtr->draw();      // Output: Drawing a circle
    shapeRef.draw();       // Output: Drawing a circle

    // Direct calls use Circle's versions
    circle.identify();     // Output: I am a Circle
    circle.draw();         // Output: Drawing a circle

    return 0;
}
```

### How Virtual Functions Work (vtable)

When a class has virtual functions, the compiler creates a virtual table (vtable) containing pointers to the virtual functions. Each object contains a hidden pointer (vptr) to its class's vtable.

```cpp
#include <iostream>

class Animal {
public:
    virtual void speak() const {
        std::cout << "Animal sound\n";
    }

    virtual void move() const {
        std::cout << "Animal moving\n";
    }

    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void speak() const override {
        std::cout << "Woof!\n";
    }

    void move() const override {
        std::cout << "Dog running\n";
    }
};

class Cat : public Animal {
public:
    void speak() const override {
        std::cout << "Meow!\n";
    }
    // move() not overridden - uses Animal::move()
};

void makeAnimalSpeak(const Animal& animal) {
    animal.speak();  // Polymorphic call
}

int main() {
    Dog dog;
    Cat cat;
    Animal animal;

    makeAnimalSpeak(dog);     // Output: Woof!
    makeAnimalSpeak(cat);     // Output: Meow!
    makeAnimalSpeak(animal);  // Output: Animal sound

    // Array of base class pointers
    Animal* animals[] = {&dog, &cat, &animal};

    for (const auto* a : animals) {
        a->speak();
        a->move();
        std::cout << "---\n";
    }

    return 0;
}
```

### Virtual Destructors

When deleting objects through base class pointers, the destructor must be virtual to ensure proper cleanup:

```cpp
#include <iostream>

class Base {
public:
    Base() { std::cout << "Base constructor\n"; }

    // WRONG: Non-virtual destructor
    // ~Base() { std::cout << "Base destructor\n"; }

    // CORRECT: Virtual destructor
    virtual ~Base() { std::cout << "Base destructor\n"; }
};

class Derived : public Base {
private:
    int* data;

public:
    Derived() : data(new int[100]) {
        std::cout << "Derived constructor - allocated memory\n";
    }

    ~Derived() override {
        delete[] data;
        std::cout << "Derived destructor - freed memory\n";
    }
};

int main() {
    Base* ptr = new Derived();

    // With virtual destructor: calls Derived::~Derived() then Base::~Base()
    // Without virtual destructor: only calls Base::~Base() - MEMORY LEAK!
    delete ptr;

    return 0;
}
```

**Rule**: If a class has any virtual functions, it should have a virtual destructor.

### Covariant Return Types

Virtual functions can return pointers/references to derived types:

```cpp
class Animal {
public:
    virtual Animal* clone() const {
        return new Animal(*this);
    }
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    // Covariant return type: Dog* instead of Animal*
    Dog* clone() const override {
        return new Dog(*this);
    }
};

int main() {
    Dog dog;
    Dog* clonedDog = dog.clone();  // Returns Dog*, not Animal*
    delete clonedDog;
}
```

## Abstract Classes and Pure Virtual Functions

An abstract class defines an interface that derived classes must implement. It cannot be instantiated directly.

### Defining Abstract Classes

```cpp
#include <iostream>
#include <cmath>

// Abstract base class
class Shape {
protected:
    std::string name;

public:
    Shape(const std::string& n) : name(n) {}

    // Pure virtual functions - must be overridden
    virtual double area() const = 0;
    virtual double perimeter() const = 0;

    // Regular virtual function with implementation
    virtual void describe() const {
        std::cout << "This is a " << name << std::endl;
    }

    // Non-virtual function
    std::string getName() const { return name; }

    virtual ~Shape() = default;
};

class Rectangle : public Shape {
private:
    double width, height;

public:
    Rectangle(double w, double h)
        : Shape("Rectangle"), width(w), height(h) {}

    double area() const override {
        return width * height;
    }

    double perimeter() const override {
        return 2 * (width + height);
    }
};

class Circle : public Shape {
private:
    double radius;

public:
    Circle(double r) : Shape("Circle"), radius(r) {}

    double area() const override {
        return M_PI * radius * radius;
    }

    double perimeter() const override {
        return 2 * M_PI * radius;
    }

    void describe() const override {
        Shape::describe();  // Call base class version
        std::cout << "  Radius: " << radius << std::endl;
    }
};

class Triangle : public Shape {
private:
    double a, b, c;  // Side lengths

public:
    Triangle(double side1, double side2, double side3)
        : Shape("Triangle"), a(side1), b(side2), c(side3) {}

    double area() const override {
        // Heron's formula
        double s = (a + b + c) / 2;
        return std::sqrt(s * (s - a) * (s - b) * (s - c));
    }

    double perimeter() const override {
        return a + b + c;
    }
};

void printShapeInfo(const Shape& shape) {
    shape.describe();
    std::cout << "  Area: " << shape.area() << std::endl;
    std::cout << "  Perimeter: " << shape.perimeter() << std::endl;
}

int main() {
    // Shape s("test");  // ERROR: cannot instantiate abstract class

    Rectangle rect(5, 3);
    Circle circle(4);
    Triangle triangle(3, 4, 5);

    printShapeInfo(rect);
    std::cout << std::endl;
    printShapeInfo(circle);
    std::cout << std::endl;
    printShapeInfo(triangle);

    return 0;
}
```

### Interface Classes

An interface class contains only pure virtual functions:

```cpp
// Pure interface
class Drawable {
public:
    virtual void draw() const = 0;
    virtual void setColor(int r, int g, int b) = 0;
    virtual ~Drawable() = default;
};

class Resizable {
public:
    virtual void resize(double factor) = 0;
    virtual double getWidth() const = 0;
    virtual double getHeight() const = 0;
    virtual ~Resizable() = default;
};

// Concrete class implementing multiple interfaces
class Button : public Drawable, public Resizable {
private:
    int red, green, blue;
    double width, height;

public:
    Button(double w, double h)
        : red(0), green(0), blue(0), width(w), height(h) {}

    // Drawable implementation
    void draw() const override {
        std::cout << "Drawing button (" << width << "x" << height << ") "
                  << "color: RGB(" << red << "," << green << "," << blue << ")\n";
    }

    void setColor(int r, int g, int b) override {
        red = r; green = g; blue = b;
    }

    // Resizable implementation
    void resize(double factor) override {
        width *= factor;
        height *= factor;
    }

    double getWidth() const override { return width; }
    double getHeight() const override { return height; }
};
```

### Pure Virtual Functions with Implementation

A pure virtual function can have a default implementation that derived classes can use:

```cpp
class Logger {
public:
    virtual void log(const std::string& message) = 0;

    virtual ~Logger() = default;
};

// Provide default implementation
void Logger::log(const std::string& message) {
    std::cout << "[DEFAULT] " << message << std::endl;
}

class FileLogger : public Logger {
public:
    void log(const std::string& message) override {
        // Use base class implementation
        Logger::log(message);
        // Add file-specific logging...
        std::cout << "  (also logged to file)\n";
    }
};

class ConsoleLogger : public Logger {
public:
    void log(const std::string& message) override {
        std::cout << "[CONSOLE] " << message << std::endl;
    }
};
```

## Multiple Inheritance

C++ allows a class to inherit from multiple base classes.

### Basic Multiple Inheritance

```cpp
#include <iostream>
#include <string>

class Printable {
public:
    virtual void print() const = 0;
    virtual ~Printable() = default;
};

class Serializable {
public:
    virtual std::string serialize() const = 0;
    virtual void deserialize(const std::string& data) = 0;
    virtual ~Serializable() = default;
};

class Persistable {
public:
    virtual void save(const std::string& filename) const = 0;
    virtual void load(const std::string& filename) = 0;
    virtual ~Persistable() = default;
};

class Document : public Printable, public Serializable, public Persistable {
private:
    std::string content;
    std::string title;

public:
    Document(const std::string& t, const std::string& c)
        : title(t), content(c) {}

    // Printable implementation
    void print() const override {
        std::cout << "=== " << title << " ===\n" << content << std::endl;
    }

    // Serializable implementation
    std::string serialize() const override {
        return title + "|" + content;
    }

    void deserialize(const std::string& data) override {
        size_t pos = data.find('|');
        if (pos != std::string::npos) {
            title = data.substr(0, pos);
            content = data.substr(pos + 1);
        }
    }

    // Persistable implementation
    void save(const std::string& filename) const override {
        std::cout << "Saving to " << filename << ": " << serialize() << std::endl;
    }

    void load(const std::string& filename) override {
        std::cout << "Loading from " << filename << std::endl;
        // Simulated loading...
    }
};

int main() {
    Document doc("My Document", "Hello, World!");

    // Use as Printable
    Printable* printable = &doc;
    printable->print();

    // Use as Serializable
    Serializable* serializable = &doc;
    std::cout << "Serialized: " << serializable->serialize() << std::endl;

    // Use as Persistable
    Persistable* persistable = &doc;
    persistable->save("document.txt");

    return 0;
}
```

### The Diamond Problem

Multiple inheritance can lead to ambiguity when two base classes inherit from a common ancestor:

```cpp
#include <iostream>

class Animal {
public:
    int age;

    Animal(int a = 0) : age(a) {
        std::cout << "Animal constructor\n";
    }

    virtual void speak() const {
        std::cout << "Animal sound\n";
    }
};

class Mammal : public Animal {
public:
    Mammal(int a = 0) : Animal(a) {
        std::cout << "Mammal constructor\n";
    }

    void speak() const override {
        std::cout << "Mammal sound\n";
    }
};

class Bird : public Animal {
public:
    Bird(int a = 0) : Animal(a) {
        std::cout << "Bird constructor\n";
    }

    void speak() const override {
        std::cout << "Bird sound\n";
    }
};

// Diamond inheritance: Bat inherits from both Mammal and Bird
class Bat : public Mammal, public Bird {
public:
    Bat(int a = 0) : Mammal(a), Bird(a) {
        std::cout << "Bat constructor\n";
    }

    // Must override to resolve ambiguity
    void speak() const override {
        std::cout << "Bat sound (echolocation)\n";
    }
};

int main() {
    Bat bat(5);

    // bat.age = 10;        // ERROR: ambiguous - which Animal's age?
    bat.Mammal::age = 10;   // OK: specify which path
    bat.Bird::age = 10;     // OK: specify which path

    // bat.Animal::speak(); // ERROR: ambiguous
    bat.Mammal::speak();    // OK: calls Mammal::speak()
    bat.Bird::speak();      // OK: calls Bird::speak()
    bat.speak();            // OK: calls Bat::speak()

    return 0;
}
```

## Virtual Inheritance

Virtual inheritance solves the diamond problem by ensuring only one copy of the common base class exists.

### Using Virtual Inheritance

```cpp
#include <iostream>

class Animal {
public:
    int age;
    std::string name;

    Animal(const std::string& n = "", int a = 0) : name(n), age(a) {
        std::cout << "Animal constructor: " << name << "\n";
    }

    virtual ~Animal() {
        std::cout << "Animal destructor: " << name << "\n";
    }
};

// Virtual inheritance
class Mammal : virtual public Animal {
public:
    Mammal(const std::string& n = "", int a = 0) : Animal(n, a) {
        std::cout << "Mammal constructor\n";
    }
};

class WingedAnimal : virtual public Animal {
public:
    WingedAnimal(const std::string& n = "", int a = 0) : Animal(n, a) {
        std::cout << "WingedAnimal constructor\n";
    }
};

// Bat now has only ONE Animal subobject
class Bat : public Mammal, public WingedAnimal {
public:
    // Must directly initialize the virtual base class
    Bat(const std::string& n, int a)
        : Animal(n, a), Mammal(n, a), WingedAnimal(n, a) {
        std::cout << "Bat constructor\n";
    }
};

int main() {
    std::cout << "Creating Bat:\n";
    Bat bat("Bruce", 3);

    bat.age = 5;           // OK: unambiguous - only one Animal
    bat.name = "Batman";   // OK: unambiguous

    std::cout << "\nBat info: " << bat.name << ", age " << bat.age << "\n";

    std::cout << "\nDestroying Bat:\n";
    return 0;
}
```

Output:
```
Creating Bat:
Animal constructor: Bruce
Mammal constructor
WingedAnimal constructor
Bat constructor

Bat info: Batman, age 5

Destroying Bat:
Bat destructor
WingedAnimal destructor
Mammal destructor
Animal destructor: Batman
```

### Virtual Base Class Initialization

With virtual inheritance, the most derived class is responsible for initializing the virtual base:

```cpp
class A {
public:
    A(int x) { std::cout << "A(" << x << ")\n"; }
};

class B : virtual public A {
public:
    B(int x) : A(x) { std::cout << "B\n"; }
};

class C : virtual public A {
public:
    C(int x) : A(x) { std::cout << "C\n"; }
};

class D : public B, public C {
public:
    // D must initialize A, even though B and C also have A in their initializer lists
    D(int x) : A(x), B(x), C(x) { std::cout << "D\n"; }
    // B's and C's initialization of A is ignored
};

int main() {
    D d(42);  // A is constructed only once with 42
}
```

## The override and final Specifiers

C++11 introduced `override` and `final` to make inheritance safer and more explicit.

### The override Specifier

`override` ensures a function is actually overriding a virtual function:

```cpp
class Base {
public:
    virtual void foo() const {}
    virtual void bar(int x) {}
    void baz() {}  // Non-virtual
};

class Derived : public Base {
public:
    // void foo() override {}           // ERROR: missing const
    void foo() const override {}        // OK

    // void bar(double x) override {}   // ERROR: parameter type mismatch
    void bar(int x) override {}         // OK

    // void baz() override {}           // ERROR: baz is not virtual
};
```

### The final Specifier

`final` prevents further overriding or inheritance:

```cpp
class Animal {
public:
    virtual void speak() const {}
    virtual void eat() {}
};

class Dog : public Animal {
public:
    // No class can override speak() after Dog
    void speak() const final {
        std::cout << "Woof!\n";
    }

    void eat() override {}
};

class Poodle : public Dog {
public:
    // void speak() const override {}  // ERROR: speak is final in Dog
    void eat() override {}             // OK: eat is not final
};

// Prevent any class from inheriting from Cat
class Cat final : public Animal {
public:
    void speak() const override {}
};

// class Kitten : public Cat {};  // ERROR: Cat is final
```

### Benefits of override and final

```cpp
class Widget {
public:
    virtual void update(int value) {}
    virtual void render() const {}
    virtual ~Widget() = default;
};

class Button : public Widget {
public:
    // Without override, this typo silently creates a new function
    // void updata(int value) {}  // Typo - no warning without override

    // With override, compiler catches the error
    // void updata(int value) override {}  // ERROR: no function to override

    void update(int value) override {}  // Correct

    // final prevents accidental overriding in deeper hierarchies
    void render() const final {}
};
```

## RTTI and Dynamic Casting

Runtime Type Information (RTTI) allows examining object types at runtime.

### The typeid Operator

```cpp
#include <iostream>
#include <typeinfo>

class Animal {
public:
    virtual ~Animal() = default;  // Must have virtual function for RTTI
};

class Dog : public Animal {};
class Cat : public Animal {};

int main() {
    Dog dog;
    Cat cat;
    Animal* animalPtr = &dog;

    // typeid returns type_info reference
    std::cout << "dog type: " << typeid(dog).name() << std::endl;
    std::cout << "cat type: " << typeid(cat).name() << std::endl;

    // With polymorphism, typeid gives runtime type
    std::cout << "*animalPtr type: " << typeid(*animalPtr).name() << std::endl;

    // Comparing types
    if (typeid(*animalPtr) == typeid(Dog)) {
        std::cout << "animalPtr points to a Dog\n";
    }

    return 0;
}
```

### dynamic_cast

`dynamic_cast` safely converts pointers/references within inheritance hierarchies:

```cpp
#include <iostream>

class Animal {
public:
    virtual void speak() const = 0;
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void speak() const override { std::cout << "Woof!\n"; }
    void fetch() const { std::cout << "Fetching ball\n"; }
};

class Cat : public Animal {
public:
    void speak() const override { std::cout << "Meow!\n"; }
    void climb() const { std::cout << "Climbing tree\n"; }
};

void handleAnimal(Animal* animal) {
    animal->speak();

    // Try to cast to Dog
    if (Dog* dog = dynamic_cast<Dog*>(animal)) {
        // Cast succeeded - animal is actually a Dog
        dog->fetch();
    }
    // Try to cast to Cat
    else if (Cat* cat = dynamic_cast<Cat*>(animal)) {
        // Cast succeeded - animal is actually a Cat
        cat->climb();
    }
}

void handleAnimalRef(Animal& animal) {
    animal.speak();

    try {
        // dynamic_cast with references throws on failure
        Dog& dog = dynamic_cast<Dog&>(animal);
        dog.fetch();
    } catch (const std::bad_cast& e) {
        std::cout << "Not a Dog: " << e.what() << std::endl;
    }
}

int main() {
    Dog dog;
    Cat cat;

    std::cout << "Handling Dog:\n";
    handleAnimal(&dog);

    std::cout << "\nHandling Cat:\n";
    handleAnimal(&cat);

    std::cout << "\nUsing references:\n";
    handleAnimalRef(dog);
    handleAnimalRef(cat);

    return 0;
}
```

### Downcasting vs Upcasting

```cpp
class Base {
public:
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void derivedMethod() {}
};

int main() {
    Derived derived;

    // Upcasting: always safe, implicit
    Base* basePtr = &derived;
    Base& baseRef = derived;

    // Downcasting: potentially unsafe
    // static_cast: no runtime check - undefined behavior if wrong
    Derived* d1 = static_cast<Derived*>(basePtr);  // Works but unsafe

    // dynamic_cast: runtime check - returns nullptr/throws if wrong
    Derived* d2 = dynamic_cast<Derived*>(basePtr); // Safe
    if (d2) {
        d2->derivedMethod();
    }

    // Wrong downcast
    Base baseObj;
    Base* wrongPtr = &baseObj;
    Derived* d3 = dynamic_cast<Derived*>(wrongPtr);  // Returns nullptr
    if (d3 == nullptr) {
        std::cout << "Cast failed - not actually a Derived\n";
    }

    return 0;
}
```

### Cross-casting with dynamic_cast

```cpp
class Interface1 {
public:
    virtual void method1() = 0;
    virtual ~Interface1() = default;
};

class Interface2 {
public:
    virtual void method2() = 0;
    virtual ~Interface2() = default;
};

class Implementation : public Interface1, public Interface2 {
public:
    void method1() override { std::cout << "method1\n"; }
    void method2() override { std::cout << "method2\n"; }
};

int main() {
    Implementation impl;
    Interface1* i1 = &impl;

    // Cross-cast from Interface1* to Interface2*
    Interface2* i2 = dynamic_cast<Interface2*>(i1);
    if (i2) {
        i2->method2();  // Works!
    }

    return 0;
}
```

## Inheritance vs Composition

Choosing between inheritance and composition is a fundamental design decision.

### When to Use Inheritance (Is-A Relationship)

```cpp
// Good use of inheritance: Dog IS-A Animal
class Animal {
public:
    virtual void speak() const = 0;
    virtual void move() const = 0;
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void speak() const override { std::cout << "Woof!\n"; }
    void move() const override { std::cout << "Running on four legs\n"; }
};

class Bird : public Animal {
public:
    void speak() const override { std::cout << "Tweet!\n"; }
    void move() const override { std::cout << "Flying\n"; }
};
```

### When to Use Composition (Has-A Relationship)

```cpp
// Engine is a component, not a type of Car
class Engine {
private:
    int horsepower;
    bool running;

public:
    Engine(int hp) : horsepower(hp), running(false) {}

    void start() {
        running = true;
        std::cout << "Engine started (" << horsepower << " HP)\n";
    }

    void stop() {
        running = false;
        std::cout << "Engine stopped\n";
    }

    bool isRunning() const { return running; }
};

// Wheels are components
class Wheel {
private:
    int diameter;

public:
    Wheel(int d) : diameter(d) {}
    int getDiameter() const { return diameter; }
};

// Car HAS-A Engine and HAS Wheels (composition)
class Car {
private:
    Engine engine;
    std::array<Wheel, 4> wheels;
    std::string model;

public:
    Car(const std::string& m, int hp, int wheelSize)
        : model(m), engine(hp),
          wheels{Wheel(wheelSize), Wheel(wheelSize),
                 Wheel(wheelSize), Wheel(wheelSize)} {}

    void start() {
        std::cout << model << ": ";
        engine.start();
    }

    void stop() {
        std::cout << model << ": ";
        engine.stop();
    }
};
```

### Prefer Composition Over Inheritance

```cpp
// Bad: Inheriting just to reuse code
class Stack : public std::vector<int> {  // Stack IS-A vector? No!
public:
    void push(int x) { push_back(x); }
    void pop() { pop_back(); }
    int top() const { return back(); }
    // Problem: User can still call vector methods like insert(), erase()
};

// Good: Composition with a clear interface
class Stack {
private:
    std::vector<int> data;  // Stack HAS-A vector

public:
    void push(int x) { data.push_back(x); }

    void pop() {
        if (!empty()) data.pop_back();
    }

    int top() const {
        if (empty()) throw std::runtime_error("Stack is empty");
        return data.back();
    }

    bool empty() const { return data.empty(); }
    size_t size() const { return data.size(); }
    // User cannot access underlying vector directly
};
```

## Best Practices

### Use Public Inheritance for Is-A Relationships

```cpp
// Good: Square is-a Rectangle? Actually debatable...
class Rectangle {
protected:
    double width, height;
public:
    virtual void setWidth(double w) { width = w; }
    virtual void setHeight(double h) { height = h; }
    double area() const { return width * height; }
};

// Problematic: Liskov Substitution Principle violation
class Square : public Rectangle {
public:
    void setWidth(double w) override {
        width = height = w;  // Breaks Rectangle's contract
    }
    void setHeight(double h) override {
        width = height = h;  // Breaks Rectangle's contract
    }
};
```

### Always Use Virtual Destructors in Base Classes

```cpp
class Base {
public:
    // ALWAYS make destructor virtual if class has virtual functions
    virtual ~Base() = default;
};
```

### Use override Consistently

```cpp
class Derived : public Base {
public:
    void virtualMethod() override;     // Always use override
    void anotherMethod() override;     // Catches errors at compile time
};
```

### Consider Making Non-Leaf Classes Abstract

```cpp
// Good: Abstract base class
class Shape {
public:
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual ~Shape() = default;
};

// Concrete classes
class Circle : public Shape { /* implementation */ };
class Rectangle : public Shape { /* implementation */ };
```

### Use final to Prevent Unintended Inheritance

```cpp
class Singleton final {
    // No class should inherit from Singleton
};

class Base {
public:
    virtual void criticalMethod() final;  // Prevent override
};
```

### Prefer Interfaces Over Deep Hierarchies

```cpp
// Bad: Deep hierarchy
class A {};
class B : public A {};
class C : public B {};
class D : public C {};
class E : public D {};  // Hard to understand and maintain

// Good: Flat hierarchy with interfaces
class Drawable { virtual void draw() = 0; };
class Clickable { virtual void onClick() = 0; };
class Draggable { virtual void onDrag() = 0; };

class Button : public Drawable, public Clickable {
    // Implements specific interfaces
};
```

### Be Careful with Multiple Inheritance

```cpp
// Use multiple inheritance mainly for interface classes
class ILogger { virtual void log(const std::string&) = 0; };
class IMetrics { virtual void record(const std::string&, double) = 0; };

// Implementation inherits from interfaces
class MonitoredService : public ILogger, public IMetrics {
    // Clean multiple inheritance from pure interfaces
};
```

### Document Virtual Function Contracts

```cpp
class Processor {
public:
    /**
     * Process the input data.
     * @pre data must not be empty
     * @post result contains processed data
     * @note Derived classes must call base implementation first
     */
    virtual void process(const Data& data) {
        // Base implementation
    }
};
```

## Conclusion

Inheritance and polymorphism are powerful tools in C++ that enable:

- **Code Reuse**: Share common functionality across related classes
- **Abstraction**: Define interfaces that hide implementation details
- **Extensibility**: Add new types without modifying existing code
- **Polymorphism**: Write code that works with any derived type

Key takeaways:

- Use public inheritance only for true "is-a" relationships
- Always make destructors virtual in polymorphic base classes
- Use `override` to catch errors and improve readability
- Prefer composition over inheritance when appropriate
- Use virtual inheritance carefully to solve the diamond problem
- Apply abstract classes to define clean interfaces
- Be mindful of the Liskov Substitution Principle

Understanding these concepts and applying them judiciously will help you design flexible, maintainable object-oriented systems in C++.
