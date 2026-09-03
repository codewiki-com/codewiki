---
title: C++ Operator Overloading
description: Learn C++ operator overloading including arithmetic, comparison, stream and function call operators
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - operator overloading
  - OOP
status: imported
origin: old/src/content/docs/cpp/operator-overloading.en.md
divergence: 0.404
issues:
  - divergent
legacy:
  category: Cpp
  subcategory: Core Concepts
  order: 17
  lastUpdated: 2026-01-07
---

Operator overloading is a powerful feature in C++ that allows you to redefine how operators work with user-defined types. This enables objects of your classes to be used with familiar syntax, making code more intuitive and expressive. We'll cover operator overloading comprehensively, including syntax, best practices, and common patterns.

## Introduction to Operator Overloading

Operator overloading allows you to define custom behavior for operators when applied to objects of your class. This makes user-defined types behave similarly to built-in types, improving code readability and usability.

```cpp
#include <iostream>

class Vector2D {
private:
    double x, y;

public:
    Vector2D(double x = 0, double y = 0) : x(x), y(y) {}

    // Overload the + operator
    Vector2D operator+(const Vector2D& other) const {
        return Vector2D(x + other.x, y + other.y);
    }

    void display() const {
        std::cout << "(" << x << ", " << y << ")" << std::endl;
    }
};

int main() {
    Vector2D v1(3.0, 4.0);
    Vector2D v2(1.0, 2.0);
    Vector2D v3 = v1 + v2;  // Uses overloaded + operator
    v3.display();  // Output: (4, 6)
    return 0;
}
```

### Operators That Can Be Overloaded

Most C++ operators can be overloaded:

| Category | Operators |
|----------|-----------|
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=`, `<=>` |
| Assignment | `=`, `+=`, `-=`, `*=`, `/=`, `%=` |
| Bitwise | `&`, `\|`, `^`, `~`, `<<`, `>>` |
| Logical | `!`, `&&`, `\|\|` |
| Increment/Decrement | `++`, `--` |
| Access | `[]`, `->`, `*`, `()` |
| I/O Stream | `<<`, `>>` |
| Other | `new`, `delete`, `,`, `->*` |

### Operators That Cannot Be Overloaded

- `::` (scope resolution)
- `.` (member access)
- `.*` (member pointer access)
- `?:` (ternary conditional)
- `sizeof`, `typeid`, `alignof`

## Syntax and Basics

Operators can be overloaded as member functions or non-member (free) functions. The general syntax is:

```cpp
// Member function syntax
ReturnType operator@(Parameters) { /* implementation */ }

// Non-member function syntax
ReturnType operator@(LeftOperand, RightOperand) { /* implementation */ }
```

Where `@` represents the operator being overloaded.

### Member Function Overloading

```cpp
class Complex {
private:
    double real, imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    // Member function: left operand is 'this'
    Complex operator+(const Complex& other) const {
        return Complex(real + other.real, imag + other.imag);
    }

    // Unary minus
    Complex operator-() const {
        return Complex(-real, -imag);
    }
};

int main() {
    Complex c1(1, 2);
    Complex c2(3, 4);
    Complex c3 = c1 + c2;  // c1.operator+(c2)
    Complex c4 = -c1;      // c1.operator-()
}
```

### Non-Member Function Overloading

```cpp
class Complex {
private:
    double real, imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    double getReal() const { return real; }
    double getImag() const { return imag; }

    // Declare friend for private access
    friend Complex operator+(const Complex& a, const Complex& b);
};

// Non-member function
Complex operator+(const Complex& a, const Complex& b) {
    return Complex(a.real + b.real, a.imag + b.imag);
}

int main() {
    Complex c1(1, 2);
    Complex c2(3, 4);
    Complex c3 = c1 + c2;  // operator+(c1, c2)
}
```

## Arithmetic Operators

Arithmetic operators include `+`, `-`, `*`, `/`, and `%`. These typically return a new object containing the result.

### Binary Arithmetic Operators

```cpp
class Fraction {
private:
    int numerator;
    int denominator;

    // Helper function to reduce fraction
    void reduce() {
        int g = gcd(std::abs(numerator), std::abs(denominator));
        numerator /= g;
        denominator /= g;
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }
    }

    static int gcd(int a, int b) {
        return b == 0 ? a : gcd(b, a % b);
    }

public:
    Fraction(int num = 0, int den = 1) : numerator(num), denominator(den) {
        if (denominator == 0) {
            throw std::invalid_argument("Denominator cannot be zero");
        }
        reduce();
    }

    // Addition
    Fraction operator+(const Fraction& other) const {
        return Fraction(
            numerator * other.denominator + other.numerator * denominator,
            denominator * other.denominator
        );
    }

    // Subtraction
    Fraction operator-(const Fraction& other) const {
        return Fraction(
            numerator * other.denominator - other.numerator * denominator,
            denominator * other.denominator
        );
    }

    // Multiplication
    Fraction operator*(const Fraction& other) const {
        return Fraction(
            numerator * other.numerator,
            denominator * other.denominator
        );
    }

    // Division
    Fraction operator/(const Fraction& other) const {
        if (other.numerator == 0) {
            throw std::invalid_argument("Division by zero");
        }
        return Fraction(
            numerator * other.denominator,
            denominator * other.numerator
        );
    }

    friend std::ostream& operator<<(std::ostream& os, const Fraction& f);
};

std::ostream& operator<<(std::ostream& os, const Fraction& f) {
    os << f.numerator;
    if (f.denominator != 1) {
        os << "/" << f.denominator;
    }
    return os;
}

int main() {
    Fraction f1(1, 2);
    Fraction f2(1, 3);

    std::cout << f1 << " + " << f2 << " = " << (f1 + f2) << std::endl;  // 5/6
    std::cout << f1 << " - " << f2 << " = " << (f1 - f2) << std::endl;  // 1/6
    std::cout << f1 << " * " << f2 << " = " << (f1 * f2) << std::endl;  // 1/6
    std::cout << f1 << " / " << f2 << " = " << (f1 / f2) << std::endl;  // 3/2
}
```

### Unary Arithmetic Operators

```cpp
class Integer {
private:
    int value;

public:
    Integer(int v = 0) : value(v) {}

    // Unary plus (usually returns a copy)
    Integer operator+() const {
        return Integer(value);
    }

    // Unary minus (negation)
    Integer operator-() const {
        return Integer(-value);
    }

    int getValue() const { return value; }
};

int main() {
    Integer n(42);
    Integer pos = +n;   // +42
    Integer neg = -n;   // -42
    std::cout << pos.getValue() << ", " << neg.getValue() << std::endl;
}
```

### Mixed-Type Arithmetic

```cpp
class Money {
private:
    long cents;  // Store as cents for precision

public:
    Money(long dollars, long cents) : cents(dollars * 100 + cents) {}
    explicit Money(long c) : cents(c) {}

    // Money + Money
    Money operator+(const Money& other) const {
        return Money(cents + other.cents);
    }

    // Money * scalar
    Money operator*(double multiplier) const {
        return Money(static_cast<long>(cents * multiplier));
    }

    long getCents() const { return cents; }

    friend std::ostream& operator<<(std::ostream& os, const Money& m);
    friend Money operator*(double multiplier, const Money& m);
};

// scalar * Money (non-member for commutativity)
Money operator*(double multiplier, const Money& m) {
    return m * multiplier;
}

std::ostream& operator<<(std::ostream& os, const Money& m) {
    os << "$" << m.cents / 100 << "." << std::setfill('0')
       << std::setw(2) << m.cents % 100;
    return os;
}

int main() {
    Money price(19, 99);
    Money tax = price * 0.08;
    Money total = price + tax;

    std::cout << "Price: " << price << std::endl;
    std::cout << "Tax: " << tax << std::endl;
    std::cout << "Total: " << total << std::endl;

    // Works both ways due to non-member overload
    Money doubled = 2.0 * price;  // scalar * Money
    std::cout << "Doubled: " << doubled << std::endl;
}
```

## Comparison Operators

Comparison operators return `bool` and include `==`, `!=`, `<`, `>`, `<=`, and `>=`.

### Equality Operators

```cpp
class Person {
private:
    std::string name;
    int age;

public:
    Person(const std::string& n, int a) : name(n), age(a) {}

    // Equality operator
    bool operator==(const Person& other) const {
        return name == other.name && age == other.age;
    }

    // Inequality operator (can be defined in terms of ==)
    bool operator!=(const Person& other) const {
        return !(*this == other);
    }
};

int main() {
    Person p1("Alice", 30);
    Person p2("Alice", 30);
    Person p3("Bob", 25);

    std::cout << std::boolalpha;
    std::cout << "p1 == p2: " << (p1 == p2) << std::endl;  // true
    std::cout << "p1 != p3: " << (p1 != p3) << std::endl;  // true
}
```

### Relational Operators

```cpp
class Date {
private:
    int year, month, day;

public:
    Date(int y, int m, int d) : year(y), month(m), day(d) {}

    bool operator<(const Date& other) const {
        if (year != other.year) return year < other.year;
        if (month != other.month) return month < other.month;
        return day < other.day;
    }

    bool operator>(const Date& other) const {
        return other < *this;
    }

    bool operator<=(const Date& other) const {
        return !(other < *this);
    }

    bool operator>=(const Date& other) const {
        return !(*this < other);
    }

    bool operator==(const Date& other) const {
        return year == other.year && month == other.month && day == other.day;
    }

    bool operator!=(const Date& other) const {
        return !(*this == other);
    }

    friend std::ostream& operator<<(std::ostream& os, const Date& d);
};

std::ostream& operator<<(std::ostream& os, const Date& d) {
    os << d.year << "-" << std::setfill('0') << std::setw(2) << d.month
       << "-" << std::setw(2) << d.day;
    return os;
}

int main() {
    Date d1(2024, 3, 15);
    Date d2(2024, 6, 20);
    Date d3(2024, 3, 15);

    std::cout << d1 << " < " << d2 << ": " << (d1 < d2) << std::endl;   // true
    std::cout << d1 << " == " << d3 << ": " << (d1 == d3) << std::endl; // true
    std::cout << d2 << " > " << d1 << ": " << (d2 > d1) << std::endl;   // true
}
```

## Assignment Operators

Assignment operators include the simple assignment `=` and compound assignment operators like `+=`, `-=`, etc.

### Copy Assignment Operator

```cpp
class DynamicArray {
private:
    int* data;
    size_t size;

public:
    DynamicArray(size_t s) : size(s), data(new int[s]()) {}

    DynamicArray(const DynamicArray& other) : size(other.size), data(new int[other.size]) {
        std::copy(other.data, other.data + size, data);
    }

    // Copy assignment operator
    DynamicArray& operator=(const DynamicArray& other) {
        if (this != &other) {  // Self-assignment check
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    ~DynamicArray() {
        delete[] data;
    }

    int& operator[](size_t index) { return data[index]; }
    const int& operator[](size_t index) const { return data[index]; }
    size_t getSize() const { return size; }
};
```

### Move Assignment Operator

```cpp
class Buffer {
private:
    char* data;
    size_t size;

public:
    Buffer(size_t s) : size(s), data(new char[s]) {}

    Buffer(Buffer&& other) noexcept : data(other.data), size(other.size) {
        other.data = nullptr;
        other.size = 0;
    }

    // Move assignment operator
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data;
            data = other.data;
            size = other.size;
            other.data = nullptr;
            other.size = 0;
        }
        return *this;
    }

    ~Buffer() {
        delete[] data;
    }
};
```

### Compound Assignment Operators

```cpp
class Vector3D {
private:
    double x, y, z;

public:
    Vector3D(double x = 0, double y = 0, double z = 0) : x(x), y(y), z(z) {}

    // Compound addition assignment
    Vector3D& operator+=(const Vector3D& other) {
        x += other.x;
        y += other.y;
        z += other.z;
        return *this;
    }

    // Compound subtraction assignment
    Vector3D& operator-=(const Vector3D& other) {
        x -= other.x;
        y -= other.y;
        z -= other.z;
        return *this;
    }

    // Compound scalar multiplication assignment
    Vector3D& operator*=(double scalar) {
        x *= scalar;
        y *= scalar;
        z *= scalar;
        return *this;
    }

    // Define binary operators in terms of compound operators
    Vector3D operator+(const Vector3D& other) const {
        Vector3D result = *this;
        result += other;
        return result;
    }

    Vector3D operator-(const Vector3D& other) const {
        Vector3D result = *this;
        result -= other;
        return result;
    }

    Vector3D operator*(double scalar) const {
        Vector3D result = *this;
        result *= scalar;
        return result;
    }

    friend std::ostream& operator<<(std::ostream& os, const Vector3D& v);
};

std::ostream& operator<<(std::ostream& os, const Vector3D& v) {
    os << "(" << v.x << ", " << v.y << ", " << v.z << ")";
    return os;
}

int main() {
    Vector3D v1(1, 2, 3);
    Vector3D v2(4, 5, 6);

    v1 += v2;
    std::cout << "After v1 += v2: " << v1 << std::endl;  // (5, 7, 9)

    v1 *= 2;
    std::cout << "After v1 *= 2: " << v1 << std::endl;   // (10, 14, 18)
}
```

## Increment and Decrement Operators

The `++` and `--` operators have prefix and postfix forms, which require different signatures.

```cpp
class Counter {
private:
    int value;

public:
    Counter(int v = 0) : value(v) {}

    // Prefix increment (++c)
    Counter& operator++() {
        ++value;
        return *this;
    }

    // Postfix increment (c++)
    // The int parameter is a dummy to distinguish from prefix
    Counter operator++(int) {
        Counter temp = *this;
        ++value;
        return temp;
    }

    // Prefix decrement (--c)
    Counter& operator--() {
        --value;
        return *this;
    }

    // Postfix decrement (c--)
    Counter operator--(int) {
        Counter temp = *this;
        --value;
        return temp;
    }

    int getValue() const { return value; }
};

int main() {
    Counter c(5);

    std::cout << "Initial: " << c.getValue() << std::endl;     // 5
    std::cout << "++c: " << (++c).getValue() << std::endl;     // 6
    std::cout << "c++: " << (c++).getValue() << std::endl;     // 6 (returns old value)
    std::cout << "After c++: " << c.getValue() << std::endl;   // 7
    std::cout << "--c: " << (--c).getValue() << std::endl;     // 6
    std::cout << "c--: " << (c--).getValue() << std::endl;     // 6 (returns old value)
    std::cout << "After c--: " << c.getValue() << std::endl;   // 5
}
```

### Iterator-Style Increment

```cpp
class StringIterator {
private:
    const std::string& str;
    size_t index;

public:
    StringIterator(const std::string& s, size_t i = 0) : str(s), index(i) {}

    char operator*() const {
        return str[index];
    }

    StringIterator& operator++() {
        ++index;
        return *this;
    }

    StringIterator operator++(int) {
        StringIterator temp = *this;
        ++index;
        return temp;
    }

    bool operator!=(const StringIterator& other) const {
        return index != other.index;
    }

    bool operator==(const StringIterator& other) const {
        return index == other.index;
    }
};

int main() {
    std::string text = "Hello";
    StringIterator begin(text, 0);
    StringIterator end(text, text.length());

    for (StringIterator it = begin; it != end; ++it) {
        std::cout << *it << " ";
    }
    // Output: H e l l o
}
```

## Stream Operators

Stream operators `<<` and `>>` are typically overloaded as non-member functions to allow chaining and proper operand order.

### Output Stream Operator

```cpp
#include <iostream>
#include <iomanip>

class Point3D {
private:
    double x, y, z;

public:
    Point3D(double x = 0, double y = 0, double z = 0) : x(x), y(y), z(z) {}

    // Friend declaration for stream operator
    friend std::ostream& operator<<(std::ostream& os, const Point3D& p);
};

// Output stream operator (non-member)
std::ostream& operator<<(std::ostream& os, const Point3D& p) {
    os << "Point(" << p.x << ", " << p.y << ", " << p.z << ")";
    return os;
}

int main() {
    Point3D p1(1.5, 2.5, 3.5);
    Point3D p2(4.0, 5.0, 6.0);

    // Chaining works because we return ostream&
    std::cout << "First: " << p1 << ", Second: " << p2 << std::endl;
}
```

### Input Stream Operator

```cpp
#include <iostream>
#include <sstream>

class Employee {
private:
    std::string name;
    int id;
    double salary;

public:
    Employee() : name(""), id(0), salary(0.0) {}
    Employee(const std::string& n, int i, double s) : name(n), id(i), salary(s) {}

    friend std::ostream& operator<<(std::ostream& os, const Employee& e);
    friend std::istream& operator>>(std::istream& is, Employee& e);
};

std::ostream& operator<<(std::ostream& os, const Employee& e) {
    os << "Employee[" << e.name << ", ID: " << e.id
       << ", Salary: $" << std::fixed << std::setprecision(2) << e.salary << "]";
    return os;
}

std::istream& operator>>(std::istream& is, Employee& e) {
    is >> e.name >> e.id >> e.salary;
    if (!is) {
        // Handle input failure
        e = Employee();  // Reset to default state
    }
    return is;
}

int main() {
    // Reading from string stream
    std::istringstream input("Alice 101 75000.50");
    Employee emp;
    input >> emp;
    std::cout << emp << std::endl;

    // Interactive input
    std::cout << "Enter employee (name id salary): ";
    Employee emp2;
    if (std::cin >> emp2) {
        std::cout << "You entered: " << emp2 << std::endl;
    }
}
```

### Custom Formatting

```cpp
#include <iostream>
#include <iomanip>

class Matrix2x2 {
private:
    double data[2][2];

public:
    Matrix2x2(double a = 0, double b = 0, double c = 0, double d = 0) {
        data[0][0] = a; data[0][1] = b;
        data[1][0] = c; data[1][1] = d;
    }

    friend std::ostream& operator<<(std::ostream& os, const Matrix2x2& m);
};

std::ostream& operator<<(std::ostream& os, const Matrix2x2& m) {
    os << std::fixed << std::setprecision(2);
    os << "| " << std::setw(8) << m.data[0][0] << " "
               << std::setw(8) << m.data[0][1] << " |" << std::endl;
    os << "| " << std::setw(8) << m.data[1][0] << " "
               << std::setw(8) << m.data[1][1] << " |";
    return os;
}

int main() {
    Matrix2x2 m(1.5, 2.0, 3.7, 4.2);
    std::cout << "Matrix:\n" << m << std::endl;
}
```

## Subscript Operator

The subscript operator `[]` provides array-like access to elements of a class.

```cpp
#include <iostream>
#include <stdexcept>

class SafeArray {
private:
    int* data;
    size_t size;

public:
    SafeArray(size_t s) : size(s), data(new int[s]()) {}

    SafeArray(const SafeArray& other) : size(other.size), data(new int[other.size]) {
        std::copy(other.data, other.data + size, data);
    }

    ~SafeArray() {
        delete[] data;
    }

    SafeArray& operator=(const SafeArray& other) {
        if (this != &other) {
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    // Non-const version (for modification)
    int& operator[](size_t index) {
        if (index >= size) {
            throw std::out_of_range("Index out of bounds");
        }
        return data[index];
    }

    // Const version (for read-only access)
    const int& operator[](size_t index) const {
        if (index >= size) {
            throw std::out_of_range("Index out of bounds");
        }
        return data[index];
    }

    size_t getSize() const { return size; }
};

int main() {
    SafeArray arr(5);

    // Write using subscript
    for (size_t i = 0; i < arr.getSize(); ++i) {
        arr[i] = static_cast<int>(i * 10);
    }

    // Read using subscript
    for (size_t i = 0; i < arr.getSize(); ++i) {
        std::cout << arr[i] << " ";  // 0 10 20 30 40
    }
    std::cout << std::endl;

    // Bounds checking
    try {
        int x = arr[100];  // Throws exception
    } catch (const std::out_of_range& e) {
        std::cout << "Exception: " << e.what() << std::endl;
    }
}
```

### Multi-Dimensional Subscript

```cpp
class Matrix {
private:
    std::vector<std::vector<double>> data;
    size_t rows, cols;

    // Proxy class for row access
    class RowProxy {
    private:
        std::vector<double>& row;
    public:
        RowProxy(std::vector<double>& r) : row(r) {}

        double& operator[](size_t col) {
            return row[col];
        }

        const double& operator[](size_t col) const {
            return row[col];
        }
    };

    class ConstRowProxy {
    private:
        const std::vector<double>& row;
    public:
        ConstRowProxy(const std::vector<double>& r) : row(r) {}

        const double& operator[](size_t col) const {
            return row[col];
        }
    };

public:
    Matrix(size_t r, size_t c) : rows(r), cols(c), data(r, std::vector<double>(c, 0)) {}

    RowProxy operator[](size_t row) {
        return RowProxy(data[row]);
    }

    ConstRowProxy operator[](size_t row) const {
        return ConstRowProxy(data[row]);
    }

    size_t getRows() const { return rows; }
    size_t getCols() const { return cols; }
};

int main() {
    Matrix m(3, 3);

    // Set values using double subscript
    for (size_t i = 0; i < m.getRows(); ++i) {
        for (size_t j = 0; j < m.getCols(); ++j) {
            m[i][j] = static_cast<double>(i * m.getCols() + j);
        }
    }

    // Read values
    for (size_t i = 0; i < m.getRows(); ++i) {
        for (size_t j = 0; j < m.getCols(); ++j) {
            std::cout << m[i][j] << " ";
        }
        std::cout << std::endl;
    }
}
```

## Function Call Operator

The function call operator `()` allows objects to be used like functions. Objects with this operator are called functors or function objects.

### Basic Functor

```cpp
class Multiplier {
private:
    int factor;

public:
    Multiplier(int f) : factor(f) {}

    int operator()(int value) const {
        return value * factor;
    }
};

int main() {
    Multiplier times3(3);
    Multiplier times5(5);

    std::cout << times3(10) << std::endl;  // 30
    std::cout << times5(10) << std::endl;  // 50

    // Works with standard algorithms
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::vector<int> result(numbers.size());

    std::transform(numbers.begin(), numbers.end(), result.begin(), Multiplier(10));
    for (int n : result) {
        std::cout << n << " ";  // 10 20 30 40 50
    }
}
```

### Stateful Functors

```cpp
class Counter {
private:
    mutable int count;  // mutable allows modification in const member function

public:
    Counter() : count(0) {}

    void operator()() const {
        ++count;
        std::cout << "Called " << count << " times" << std::endl;
    }

    int getCount() const { return count; }
};

int main() {
    Counter counter;
    counter();  // Called 1 times
    counter();  // Called 2 times
    counter();  // Called 3 times
    std::cout << "Total calls: " << counter.getCount() << std::endl;
}
```

### Predicate Functors

```cpp
#include <algorithm>
#include <vector>

class InRange {
private:
    int lower, upper;

public:
    InRange(int l, int u) : lower(l), upper(u) {}

    bool operator()(int value) const {
        return value >= lower && value <= upper;
    }
};

class GreaterThan {
private:
    int threshold;

public:
    GreaterThan(int t) : threshold(t) {}

    bool operator()(int value) const {
        return value > threshold;
    }
};

int main() {
    std::vector<int> numbers = {1, 5, 10, 15, 20, 25, 30};

    // Count numbers in range [10, 20]
    int countInRange = std::count_if(numbers.begin(), numbers.end(), InRange(10, 20));
    std::cout << "Numbers in [10, 20]: " << countInRange << std::endl;  // 3

    // Find first number greater than 12
    auto it = std::find_if(numbers.begin(), numbers.end(), GreaterThan(12));
    if (it != numbers.end()) {
        std::cout << "First number > 12: " << *it << std::endl;  // 15
    }

    // Remove numbers greater than 15
    auto newEnd = std::remove_if(numbers.begin(), numbers.end(), GreaterThan(15));
    numbers.erase(newEnd, numbers.end());

    std::cout << "After removal: ";
    for (int n : numbers) {
        std::cout << n << " ";  // 1 5 10 15
    }
}
```

### Callable Object with Multiple Overloads

```cpp
class StringProcessor {
public:
    // Process single string
    std::string operator()(const std::string& s) const {
        return "[" + s + "]";
    }

    // Process two strings
    std::string operator()(const std::string& s1, const std::string& s2) const {
        return s1 + " + " + s2;
    }

    // Process string with count
    std::string operator()(const std::string& s, int count) const {
        std::string result;
        for (int i = 0; i < count; ++i) {
            if (i > 0) result += " ";
            result += s;
        }
        return result;
    }
};

int main() {
    StringProcessor proc;

    std::cout << proc("Hello") << std::endl;                    // [Hello]
    std::cout << proc("Hello", "World") << std::endl;           // Hello + World
    std::cout << proc("Hi", 3) << std::endl;                    // Hi Hi Hi
}
```

## Conversion Operators

Conversion operators allow objects to be implicitly or explicitly converted to other types.

### Implicit Conversion

```cpp
class Percentage {
private:
    double value;

public:
    Percentage(double v) : value(v) {}

    // Conversion to double (implicit)
    operator double() const {
        return value / 100.0;
    }

    // Conversion to string (implicit)
    operator std::string() const {
        return std::to_string(value) + "%";
    }
};

int main() {
    Percentage p(75.5);

    double d = p;              // Implicit conversion to double: 0.755
    std::string s = p;         // Implicit conversion to string: "75.500000%"

    std::cout << "As double: " << d << std::endl;
    std::cout << "As string: " << s << std::endl;

    // Can be used in expressions
    double result = p * 200;   // 0.755 * 200 = 151
    std::cout << "75.5% of 200: " << result << std::endl;
}
```

### Explicit Conversion

```cpp
class SafeInt {
private:
    int value;

public:
    explicit SafeInt(int v) : value(v) {}

    // Explicit conversion to int
    explicit operator int() const {
        return value;
    }

    // Explicit conversion to bool (common for validity checks)
    explicit operator bool() const {
        return value != 0;
    }

    int getValue() const { return value; }
};

int main() {
    SafeInt si(42);

    // int x = si;           // ERROR: implicit conversion not allowed
    int x = static_cast<int>(si);  // OK: explicit conversion
    int y = int(si);              // OK: explicit conversion

    std::cout << "Value: " << x << std::endl;

    // Works in boolean context (special case)
    if (si) {
        std::cout << "SafeInt is non-zero" << std::endl;
    }

    SafeInt zero(0);
    if (!zero) {
        std::cout << "Zero is falsy" << std::endl;
    }
}
```

### Smart Pointer-Style Conversion

```cpp
template<typename T>
class OptionalValue {
private:
    T* value;

public:
    OptionalValue() : value(nullptr) {}
    OptionalValue(const T& v) : value(new T(v)) {}

    ~OptionalValue() { delete value; }

    // Disable copy (simplified)
    OptionalValue(const OptionalValue&) = delete;
    OptionalValue& operator=(const OptionalValue&) = delete;

    // Check if value is present
    explicit operator bool() const {
        return value != nullptr;
    }

    // Access the value
    T& operator*() {
        if (!value) throw std::runtime_error("No value present");
        return *value;
    }

    const T& operator*() const {
        if (!value) throw std::runtime_error("No value present");
        return *value;
    }

    T* operator->() {
        if (!value) throw std::runtime_error("No value present");
        return value;
    }
};

int main() {
    OptionalValue<std::string> opt1;
    OptionalValue<std::string> opt2("Hello");

    if (opt1) {
        std::cout << "opt1 has value" << std::endl;
    } else {
        std::cout << "opt1 is empty" << std::endl;
    }

    if (opt2) {
        std::cout << "opt2 value: " << *opt2 << std::endl;
        std::cout << "opt2 length: " << opt2->length() << std::endl;
    }
}
```

## Member vs Non-Member Overloading

Choosing between member and non-member functions for operator overloading depends on the operator and desired behavior.

### When to Use Member Functions

Use member functions when:
- The operator modifies the left operand (`=`, `+=`, `++`, `[]`, `->`, `()`)
- The left operand must be of your class type
- You need access to private members

```cpp
class Number {
private:
    int value;

public:
    Number(int v = 0) : value(v) {}

    // Must be member: modifies this object
    Number& operator+=(const Number& other) {
        value += other.value;
        return *this;
    }

    // Must be member: subscript operator
    int& operator[](size_t index) {
        // Implementation...
        return value;
    }

    // Must be member: assignment operator
    Number& operator=(const Number& other) {
        value = other.value;
        return *this;
    }
};
```

### When to Use Non-Member Functions

Use non-member functions when:
- The left operand might not be your class type (mixed-type operations)
- You want symmetric behavior
- Overloading stream operators

```cpp
class Complex {
private:
    double real, imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    double getReal() const { return real; }
    double getImag() const { return imag; }

    friend Complex operator+(const Complex& a, const Complex& b);
    friend Complex operator+(double d, const Complex& c);
    friend Complex operator+(const Complex& c, double d);
    friend std::ostream& operator<<(std::ostream& os, const Complex& c);
};

// Complex + Complex
Complex operator+(const Complex& a, const Complex& b) {
    return Complex(a.real + b.real, a.imag + b.imag);
}

// double + Complex (wouldn't work as member)
Complex operator+(double d, const Complex& c) {
    return Complex(d + c.real, c.imag);
}

// Complex + double
Complex operator+(const Complex& c, double d) {
    return Complex(c.real + d, c.imag);
}

std::ostream& operator<<(std::ostream& os, const Complex& c) {
    os << c.real << (c.imag >= 0 ? "+" : "") << c.imag << "i";
    return os;
}

int main() {
    Complex c(3, 4);

    std::cout << 5.0 + c << std::endl;  // 8+4i (non-member allows this)
    std::cout << c + 5.0 << std::endl;  // 8+4i
    std::cout << c + Complex(1, 2) << std::endl;  // 4+6i
}
```

### Hidden Friends Pattern

A modern approach that limits function scope and improves encapsulation:

```cpp
class Rational {
private:
    int num, den;

public:
    Rational(int n = 0, int d = 1) : num(n), den(d) {}

    // Hidden friend: defined inside class but not a member
    friend Rational operator+(const Rational& a, const Rational& b) {
        return Rational(a.num * b.den + b.num * a.den, a.den * b.den);
    }

    friend bool operator==(const Rational& a, const Rational& b) {
        return a.num * b.den == b.num * a.den;
    }

    friend std::ostream& operator<<(std::ostream& os, const Rational& r) {
        os << r.num << "/" << r.den;
        return os;
    }
};

int main() {
    Rational r1(1, 2);
    Rational r2(1, 3);

    std::cout << r1 << " + " << r2 << " = " << (r1 + r2) << std::endl;
    std::cout << std::boolalpha << (r1 == r2) << std::endl;
}
```

## The Three-Way Comparison Operator (C++20)

C++20 introduced the spaceship operator `<=>`, which can generate all comparison operators automatically.

```cpp
#include <compare>
#include <iostream>
#include <string>

class Version {
private:
    int major, minor, patch;

public:
    Version(int maj, int min, int pat) : major(maj), minor(min), patch(pat) {}

    // Three-way comparison operator
    auto operator<=>(const Version& other) const = default;

    // Note: operator== is also needed if you want == and !=
    bool operator==(const Version& other) const = default;

    friend std::ostream& operator<<(std::ostream& os, const Version& v) {
        os << v.major << "." << v.minor << "." << v.patch;
        return os;
    }
};

int main() {
    Version v1(1, 2, 3);
    Version v2(1, 2, 4);
    Version v3(1, 2, 3);

    std::cout << std::boolalpha;
    std::cout << v1 << " < " << v2 << ": " << (v1 < v2) << std::endl;   // true
    std::cout << v1 << " <= " << v2 << ": " << (v1 <= v2) << std::endl; // true
    std::cout << v1 << " > " << v2 << ": " << (v1 > v2) << std::endl;   // false
    std::cout << v1 << " >= " << v2 << ": " << (v1 >= v2) << std::endl; // false
    std::cout << v1 << " == " << v3 << ": " << (v1 == v3) << std::endl; // true
    std::cout << v1 << " != " << v2 << ": " << (v1 != v2) << std::endl; // true
}
```

### Custom Three-Way Comparison

```cpp
#include <compare>

class CaseInsensitiveString {
private:
    std::string value;

    static int compareIgnoreCase(const std::string& a, const std::string& b) {
        size_t minLen = std::min(a.length(), b.length());
        for (size_t i = 0; i < minLen; ++i) {
            char ca = std::tolower(a[i]);
            char cb = std::tolower(b[i]);
            if (ca < cb) return -1;
            if (ca > cb) return 1;
        }
        if (a.length() < b.length()) return -1;
        if (a.length() > b.length()) return 1;
        return 0;
    }

public:
    CaseInsensitiveString(const std::string& s) : value(s) {}

    std::strong_ordering operator<=>(const CaseInsensitiveString& other) const {
        int result = compareIgnoreCase(value, other.value);
        if (result < 0) return std::strong_ordering::less;
        if (result > 0) return std::strong_ordering::greater;
        return std::strong_ordering::equal;
    }

    bool operator==(const CaseInsensitiveString& other) const {
        return (*this <=> other) == 0;
    }

    const std::string& str() const { return value; }
};

int main() {
    CaseInsensitiveString s1("Hello");
    CaseInsensitiveString s2("HELLO");
    CaseInsensitiveString s3("World");

    std::cout << std::boolalpha;
    std::cout << "\"Hello\" == \"HELLO\": " << (s1 == s2) << std::endl;  // true
    std::cout << "\"Hello\" < \"World\": " << (s1 < s3) << std::endl;    // true
}
```

## Best Practices

### Maintain Expected Semantics

Overloaded operators should behave as users expect:

```cpp
// Good: + returns a new object, += modifies in place
class Vector {
public:
    Vector operator+(const Vector& other) const;  // Returns new Vector
    Vector& operator+=(const Vector& other);      // Modifies this, returns *this
};

// Bad: Unexpected behavior
class BadVector {
public:
    void operator+(const BadVector& other);  // Returns void - confusing!
};
```

### Implement Related Operators Consistently

```cpp
class Comparable {
public:
    bool operator==(const Comparable& other) const;

    // Implement in terms of ==
    bool operator!=(const Comparable& other) const {
        return !(*this == other);
    }

    bool operator<(const Comparable& other) const;

    // Implement in terms of <
    bool operator>(const Comparable& other) const {
        return other < *this;
    }

    bool operator<=(const Comparable& other) const {
        return !(other < *this);
    }

    bool operator>=(const Comparable& other) const {
        return !(*this < other);
    }
};
```

### Return Appropriate Types

```cpp
class MyClass {
public:
    // Compound assignment returns reference to *this
    MyClass& operator+=(const MyClass& other);

    // Binary arithmetic returns new object by value
    MyClass operator+(const MyClass& other) const;

    // Prefix increment returns reference
    MyClass& operator++();

    // Postfix increment returns copy (old value)
    MyClass operator++(int);

    // Subscript returns reference for modification
    int& operator[](size_t index);
    const int& operator[](size_t index) const;
};
```

### Use const Correctly

```cpp
class Example {
public:
    // Operators that don't modify should be const
    Example operator+(const Example& other) const;
    bool operator==(const Example& other) const;
    int operator[](size_t index) const;

    // Operators that modify should not be const
    Example& operator+=(const Example& other);
    Example& operator++();
};
```

### Consider noexcept for Move Operations

```cpp
class Resource {
public:
    Resource(Resource&& other) noexcept;
    Resource& operator=(Resource&& other) noexcept;
};
```

### Prefer Non-Member Functions for Symmetric Operations

```cpp
class Number {
    friend Number operator+(const Number& a, const Number& b);
    friend Number operator+(int n, const Number& a);
    friend Number operator+(const Number& a, int n);
};

// Allows: Number + Number, int + Number, Number + int
```

### Use explicit for Conversion Operators

```cpp
class Boolean {
public:
    // Explicit prevents accidental conversions
    explicit operator bool() const;
};

Boolean b;
// if (b) {}        // OK: boolean context
// int x = b;       // ERROR: explicit prevents this
// int y = (int)b;  // ERROR: still prevented
// bool z = bool(b); // OK: explicit conversion
```

### Document Unusual Behavior

```cpp
class Matrix {
public:
    // Note: Matrix multiplication is not commutative
    // A * B may not equal B * A
    Matrix operator*(const Matrix& other) const;
};
```

## Conclusion

Operator overloading is a powerful C++ feature that enables user-defined types to behave like built-in types. When used correctly, it can make code more intuitive, readable, and maintainable. However, it requires careful consideration to ensure operators behave as expected.

Key takeaways:
- Overload operators to maintain intuitive semantics
- Choose between member and non-member functions based on the operator's nature
- Implement related operators consistently
- Use `const`, `noexcept`, and `explicit` appropriately
- Consider the three-way comparison operator (`<=>`) in C++20 for comparison operations
- Return appropriate types (references for compound assignment, values for binary operations)
- Follow the principle of least surprise - operators should behave as users expect

By following these guidelines, you can effectively use operator overloading to create expressive, efficient, and maintainable C++ code.
