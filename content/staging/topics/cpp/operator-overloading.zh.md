---
title: C++ 运算符重载
description: 学习 C++ 运算符重载，包括算术运算符、比较运算符、流运算符和函数调用运算符
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - 运算符重载
  - OOP
status: imported
origin: old/src/content/docs/cpp/operator-overloading.zh.md
divergence: 0.404
issues:
  - divergent
legacy:
  category: Cpp
  subcategory: 核心概念
  order: 17
  lastUpdated: 2026-01-07
---

运算符重载是 C++ 的一项强大特性，它允许程序员为自定义类型定义运算符的行为。通过运算符重载，我们可以让自定义类像内置类型一样自然地使用各种运算符，从而提高代码的可读性和表达力。

## 运算符重载基础

### 什么是运算符重载

运算符重载本质上是一种特殊的函数重载。当我们对自定义类型使用运算符时，编译器会调用相应的运算符函数。

```cpp
#include <iostream>

class Vector2D {
private:
    double x, y;

public:
    Vector2D(double xVal = 0, double yVal = 0) : x(xVal), y(yVal) {}

    // 重载 + 运算符
    Vector2D operator+(const Vector2D& other) const {
        return Vector2D(x + other.x, y + other.y);
    }

    void print() const {
        std::cout << "(" << x << ", " << y << ")" << std::endl;
    }
};

int main() {
    Vector2D v1(1, 2);
    Vector2D v2(3, 4);
    Vector2D v3 = v1 + v2;  // 调用 operator+

    v3.print();  // 输出: (4, 6)
    return 0;
}
```

### 运算符重载的语法

运算符重载函数的基本语法：

```cpp
返回类型 operator运算符(参数列表) {
    // 实现
}
```

例如：

```cpp
// 成员函数形式
Vector2D operator+(const Vector2D& other) const;

// 非成员函数形式（友元）
friend Vector2D operator+(const Vector2D& a, const Vector2D& b);
```

## 可重载的运算符

C++ 允许重载大多数运算符，但有一些不能重载：

### 可以重载的运算符

| 类别 | 运算符 |
|------|--------|
| 算术运算符 | `+` `-` `*` `/` `%` |
| 关系运算符 | `==` `!=` `<` `>` `<=` `>=` |
| 逻辑运算符 | `&&` `||` `!` |
| 位运算符 | `&` `|` `^` `~` `<<` `>>` |
| 赋值运算符 | `=` `+=` `-=` `*=` `/=` `%=` `&=` `|=` `^=` `<<=` `>>=` |
| 自增/自减 | `++` `--` |
| 下标运算符 | `[]` |
| 函数调用 | `()` |
| 成员访问 | `->` `->*` |
| 内存管理 | `new` `delete` `new[]` `delete[]` |
| 其他 | `,` `*`（解引用）`&`（取地址）|

### 不能重载的运算符

```cpp
.      // 成员访问运算符
.*     // 成员指针访问运算符
::     // 作用域解析运算符
?:     // 条件运算符
sizeof // 大小运算符
typeid // 类型信息运算符
```

## 成员函数 vs 非成员函数

运算符可以作为成员函数或非成员函数（通常是友元函数）来重载。选择哪种方式取决于运算符的性质和使用场景。

### 成员函数形式

```cpp
class Complex {
private:
    double real, imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    // 成员函数：左操作数是 this
    Complex operator+(const Complex& other) const {
        return Complex(real + other.real, imag + other.imag);
    }

    // 一元运算符：取负
    Complex operator-() const {
        return Complex(-real, -imag);
    }
};

int main() {
    Complex c1(1, 2);
    Complex c2(3, 4);

    Complex c3 = c1 + c2;  // 等价于 c1.operator+(c2)
    Complex c4 = -c1;      // 等价于 c1.operator-()

    return 0;
}
```

### 非成员函数形式（友元）

```cpp
class Complex {
private:
    double real, imag;

public:
    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    // 声明友元函数
    friend Complex operator+(const Complex& a, const Complex& b);
    friend Complex operator*(double scalar, const Complex& c);

    void print() const {
        std::cout << real << " + " << imag << "i" << std::endl;
    }
};

// 非成员函数定义
Complex operator+(const Complex& a, const Complex& b) {
    return Complex(a.real + b.real, a.imag + b.imag);
}

// 支持 scalar * complex 的形式
Complex operator*(double scalar, const Complex& c) {
    return Complex(scalar * c.real, scalar * c.imag);
}

int main() {
    Complex c1(1, 2);
    Complex c2(3, 4);

    Complex c3 = c1 + c2;    // 使用友元函数
    Complex c4 = 2.0 * c1;   // 标量在左边

    c3.print();  // 输出: 4 + 6i
    c4.print();  // 输出: 2 + 4i

    return 0;
}
```

### 选择原则

| 运算符类型 | 推荐形式 | 原因 |
|-----------|---------|------|
| 赋值运算符 `=` | 成员函数 | 必须是成员函数 |
| 下标运算符 `[]` | 成员函数 | 必须是成员函数 |
| 函数调用 `()` | 成员函数 | 必须是成员函数 |
| 成员访问 `->` | 成员函数 | 必须是成员函数 |
| 流运算符 `<<` `>>` | 非成员函数 | 左操作数是流对象 |
| 对称二元运算符 `+` `-` `*` `/` | 非成员函数 | 支持隐式转换 |
| 复合赋值 `+=` `-=` 等 | 成员函数 | 修改左操作数 |
| 一元运算符 `++` `--` `!` `-` | 成员函数 | 操作对象本身 |

## 算术运算符重载

### 基本算术运算符

```cpp
#include <iostream>

class Fraction {
private:
    int numerator;    // 分子
    int denominator;  // 分母

    // 约分
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
            throw std::invalid_argument("分母不能为零");
        }
        reduce();
    }

    // 加法
    Fraction operator+(const Fraction& other) const {
        return Fraction(
            numerator * other.denominator + other.numerator * denominator,
            denominator * other.denominator
        );
    }

    // 减法
    Fraction operator-(const Fraction& other) const {
        return Fraction(
            numerator * other.denominator - other.numerator * denominator,
            denominator * other.denominator
        );
    }

    // 乘法
    Fraction operator*(const Fraction& other) const {
        return Fraction(
            numerator * other.numerator,
            denominator * other.denominator
        );
    }

    // 除法
    Fraction operator/(const Fraction& other) const {
        if (other.numerator == 0) {
            throw std::invalid_argument("除数不能为零");
        }
        return Fraction(
            numerator * other.denominator,
            denominator * other.numerator
        );
    }

    // 取负
    Fraction operator-() const {
        return Fraction(-numerator, denominator);
    }

    // 输出
    friend std::ostream& operator<<(std::ostream& os, const Fraction& f) {
        if (f.denominator == 1) {
            os << f.numerator;
        } else {
            os << f.numerator << "/" << f.denominator;
        }
        return os;
    }
};

int main() {
    Fraction f1(1, 2);
    Fraction f2(1, 3);

    std::cout << f1 << " + " << f2 << " = " << (f1 + f2) << std::endl;  // 1/2 + 1/3 = 5/6
    std::cout << f1 << " - " << f2 << " = " << (f1 - f2) << std::endl;  // 1/2 - 1/3 = 1/6
    std::cout << f1 << " * " << f2 << " = " << (f1 * f2) << std::endl;  // 1/2 * 1/3 = 1/6
    std::cout << f1 << " / " << f2 << " = " << (f1 / f2) << std::endl;  // 1/2 / 1/3 = 3/2
    std::cout << "-" << f1 << " = " << (-f1) << std::endl;              // -1/2 = -1/2

    return 0;
}
```

### 复合赋值运算符

复合赋值运算符应该返回对象的引用，以支持链式赋值：

```cpp
class Vector2D {
private:
    double x, y;

public:
    Vector2D(double xVal = 0, double yVal = 0) : x(xVal), y(yVal) {}

    // 复合加法赋值
    Vector2D& operator+=(const Vector2D& other) {
        x += other.x;
        y += other.y;
        return *this;
    }

    // 复合减法赋值
    Vector2D& operator-=(const Vector2D& other) {
        x -= other.x;
        y -= other.y;
        return *this;
    }

    // 复合乘法赋值（标量）
    Vector2D& operator*=(double scalar) {
        x *= scalar;
        y *= scalar;
        return *this;
    }

    // 复合除法赋值（标量）
    Vector2D& operator/=(double scalar) {
        if (scalar == 0) {
            throw std::invalid_argument("除数不能为零");
        }
        x /= scalar;
        y /= scalar;
        return *this;
    }

    // 基于复合赋值实现二元运算符
    Vector2D operator+(const Vector2D& other) const {
        Vector2D result = *this;
        result += other;
        return result;
    }

    Vector2D operator-(const Vector2D& other) const {
        Vector2D result = *this;
        result -= other;
        return result;
    }

    void print() const {
        std::cout << "(" << x << ", " << y << ")" << std::endl;
    }
};

int main() {
    Vector2D v1(1, 2);
    Vector2D v2(3, 4);

    v1 += v2;
    v1.print();  // 输出: (4, 6)

    v1 *= 2;
    v1.print();  // 输出: (8, 12)

    return 0;
}
```

## 比较运算符重载

### 基本比较运算符

```cpp
#include <iostream>
#include <string>

class Date {
private:
    int year, month, day;

public:
    Date(int y, int m, int d) : year(y), month(m), day(d) {}

    // 相等运算符
    bool operator==(const Date& other) const {
        return year == other.year && month == other.month && day == other.day;
    }

    // 不等运算符
    bool operator!=(const Date& other) const {
        return !(*this == other);
    }

    // 小于运算符
    bool operator<(const Date& other) const {
        if (year != other.year) return year < other.year;
        if (month != other.month) return month < other.month;
        return day < other.day;
    }

    // 大于运算符
    bool operator>(const Date& other) const {
        return other < *this;
    }

    // 小于等于运算符
    bool operator<=(const Date& other) const {
        return !(other < *this);
    }

    // 大于等于运算符
    bool operator>=(const Date& other) const {
        return !(*this < other);
    }

    friend std::ostream& operator<<(std::ostream& os, const Date& d) {
        os << d.year << "-" << d.month << "-" << d.day;
        return os;
    }
};

int main() {
    Date d1(2025, 1, 15);
    Date d2(2025, 3, 20);
    Date d3(2025, 1, 15);

    std::cout << d1 << " == " << d3 << " : " << (d1 == d3) << std::endl;  // 1
    std::cout << d1 << " != " << d2 << " : " << (d1 != d2) << std::endl;  // 1
    std::cout << d1 << " < " << d2 << " : " << (d1 < d2) << std::endl;    // 1
    std::cout << d1 << " > " << d2 << " : " << (d1 > d2) << std::endl;    // 0
    std::cout << d1 << " <= " << d3 << " : " << (d1 <= d3) << std::endl;  // 1
    std::cout << d2 << " >= " << d1 << " : " << (d2 >= d1) << std::endl;  // 1

    return 0;
}
```

### C++20 三向比较运算符（宇宙飞船运算符）

C++20 引入了三向比较运算符 `<=>`，可以简化比较运算符的实现：

```cpp
#include <iostream>
#include <compare>

class Version {
private:
    int major, minor, patch;

public:
    Version(int maj, int min, int pat)
        : major(maj), minor(min), patch(pat) {}

    // 三向比较运算符自动生成所有比较运算符
    auto operator<=>(const Version& other) const = default;

    // 也可以手动实现
    // std::strong_ordering operator<=>(const Version& other) const {
    //     if (auto cmp = major <=> other.major; cmp != 0) return cmp;
    //     if (auto cmp = minor <=> other.minor; cmp != 0) return cmp;
    //     return patch <=> other.patch;
    // }

    friend std::ostream& operator<<(std::ostream& os, const Version& v) {
        os << v.major << "." << v.minor << "." << v.patch;
        return os;
    }
};

int main() {
    Version v1(1, 2, 3);
    Version v2(1, 2, 4);
    Version v3(1, 2, 3);

    std::cout << v1 << " == " << v3 << " : " << (v1 == v3) << std::endl;  // 1
    std::cout << v1 << " < " << v2 << " : " << (v1 < v2) << std::endl;    // 1
    std::cout << v2 << " > " << v1 << " : " << (v2 > v1) << std::endl;    // 1

    // 三向比较结果
    auto result = v1 <=> v2;
    if (result < 0) {
        std::cout << v1 << " 小于 " << v2 << std::endl;
    } else if (result > 0) {
        std::cout << v1 << " 大于 " << v2 << std::endl;
    } else {
        std::cout << v1 << " 等于 " << v2 << std::endl;
    }

    return 0;
}
```

## 流运算符重载

流运算符 `<<` 和 `>>` 必须作为非成员函数重载，因为左操作数是流对象而不是我们的类对象。

### 输出流运算符

```cpp
#include <iostream>
#include <iomanip>

class Point3D {
private:
    double x, y, z;

public:
    Point3D(double xVal = 0, double yVal = 0, double zVal = 0)
        : x(xVal), y(yVal), z(zVal) {}

    // 友元声明
    friend std::ostream& operator<<(std::ostream& os, const Point3D& p);
    friend std::istream& operator>>(std::istream& is, Point3D& p);
};

// 输出流运算符
std::ostream& operator<<(std::ostream& os, const Point3D& p) {
    os << std::fixed << std::setprecision(2);
    os << "(" << p.x << ", " << p.y << ", " << p.z << ")";
    return os;
}

// 输入流运算符
std::istream& operator>>(std::istream& is, Point3D& p) {
    char ch;
    is >> ch >> p.x >> ch >> p.y >> ch >> p.z >> ch;  // 读取 (x, y, z) 格式
    return is;
}

int main() {
    Point3D p1(1.5, 2.5, 3.5);
    std::cout << "点坐标: " << p1 << std::endl;

    Point3D p2;
    std::cout << "请输入点坐标 (x, y, z): ";
    std::cin >> p2;
    std::cout << "您输入的点: " << p2 << std::endl;

    return 0;
}
```

### 支持链式操作

流运算符返回流的引用，以支持链式操作：

```cpp
#include <iostream>

class Matrix2x2 {
private:
    double data[2][2];

public:
    Matrix2x2(double a = 0, double b = 0, double c = 0, double d = 0) {
        data[0][0] = a; data[0][1] = b;
        data[1][0] = c; data[1][1] = d;
    }

    friend std::ostream& operator<<(std::ostream& os, const Matrix2x2& m);
    friend std::istream& operator>>(std::istream& is, Matrix2x2& m);
};

std::ostream& operator<<(std::ostream& os, const Matrix2x2& m) {
    os << "[" << m.data[0][0] << ", " << m.data[0][1] << "]\n"
       << "[" << m.data[1][0] << ", " << m.data[1][1] << "]";
    return os;
}

std::istream& operator>>(std::istream& is, Matrix2x2& m) {
    is >> m.data[0][0] >> m.data[0][1]
       >> m.data[1][0] >> m.data[1][1];
    return is;
}

int main() {
    Matrix2x2 m1(1, 2, 3, 4);
    Matrix2x2 m2(5, 6, 7, 8);

    // 链式输出
    std::cout << "矩阵 1:\n" << m1 << "\n\n矩阵 2:\n" << m2 << std::endl;

    return 0;
}
```

## 函数调用运算符重载

函数调用运算符 `()` 允许对象像函数一样被调用，这样的对象称为函数对象（functor）或仿函数。

### 基本函数对象

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

class Multiplier {
private:
    int factor;

public:
    Multiplier(int f) : factor(f) {}

    // 重载函数调用运算符
    int operator()(int value) const {
        return value * factor;
    }
};

int main() {
    Multiplier doubler(2);
    Multiplier tripler(3);

    std::cout << "doubler(5) = " << doubler(5) << std::endl;  // 输出: 10
    std::cout << "tripler(5) = " << tripler(5) << std::endl;  // 输出: 15

    // 与标准算法配合使用
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::vector<int> doubled(numbers.size());

    std::transform(numbers.begin(), numbers.end(), doubled.begin(), doubler);

    std::cout << "加倍后: ";
    for (int n : doubled) {
        std::cout << n << " ";
    }
    std::cout << std::endl;  // 输出: 2 4 6 8 10

    return 0;
}
```

### 带状态的函数对象

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

class Counter {
private:
    mutable int count;  // mutable 允许在 const 函数中修改

public:
    Counter() : count(0) {}

    void operator()(int value) const {
        ++count;
        std::cout << "处理第 " << count << " 个元素: " << value << std::endl;
    }

    int getCount() const { return count; }
};

class Accumulator {
private:
    int sum;

public:
    Accumulator() : sum(0) {}

    void operator()(int value) {
        sum += value;
    }

    int getSum() const { return sum; }
};

int main() {
    std::vector<int> numbers = {10, 20, 30, 40, 50};

    // 使用 Counter
    Counter counter;
    counter = std::for_each(numbers.begin(), numbers.end(), counter);
    std::cout << "共处理 " << counter.getCount() << " 个元素" << std::endl;

    // 使用 Accumulator
    Accumulator acc;
    acc = std::for_each(numbers.begin(), numbers.end(), acc);
    std::cout << "总和: " << acc.getSum() << std::endl;  // 输出: 150

    return 0;
}
```

### 谓词函数对象

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

class InRange {
private:
    int low, high;

public:
    InRange(int l, int h) : low(l), high(h) {}

    bool operator()(int value) const {
        return value >= low && value <= high;
    }
};

class IsGreaterThan {
private:
    int threshold;

public:
    IsGreaterThan(int t) : threshold(t) {}

    bool operator()(int value) const {
        return value > threshold;
    }
};

int main() {
    std::vector<int> numbers = {5, 12, 8, 25, 3, 18, 9, 30, 7};

    // 计算在范围 [10, 20] 内的元素数量
    int count = std::count_if(numbers.begin(), numbers.end(), InRange(10, 20));
    std::cout << "在 [10, 20] 范围内的元素数量: " << count << std::endl;  // 输出: 2

    // 找到第一个大于 15 的元素
    auto it = std::find_if(numbers.begin(), numbers.end(), IsGreaterThan(15));
    if (it != numbers.end()) {
        std::cout << "第一个大于 15 的元素: " << *it << std::endl;  // 输出: 25
    }

    // 移除所有大于 20 的元素
    auto newEnd = std::remove_if(numbers.begin(), numbers.end(), IsGreaterThan(20));
    numbers.erase(newEnd, numbers.end());

    std::cout << "移除大于 20 的元素后: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

## 下标运算符重载

下标运算符 `[]` 用于访问容器中的元素。

### 基本下标运算符

```cpp
#include <iostream>
#include <stdexcept>

class Array {
private:
    int* data;
    size_t size;

public:
    Array(size_t s) : size(s), data(new int[s]()) {}

    ~Array() {
        delete[] data;
    }

    // 拷贝构造函数
    Array(const Array& other) : size(other.size), data(new int[other.size]) {
        std::copy(other.data, other.data + size, data);
    }

    // 拷贝赋值运算符
    Array& operator=(const Array& other) {
        if (this != &other) {
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    // 非 const 版本（可读写）
    int& operator[](size_t index) {
        if (index >= size) {
            throw std::out_of_range("索引越界");
        }
        return data[index];
    }

    // const 版本（只读）
    const int& operator[](size_t index) const {
        if (index >= size) {
            throw std::out_of_range("索引越界");
        }
        return data[index];
    }

    size_t getSize() const { return size; }
};

int main() {
    Array arr(5);

    // 写入数据
    for (size_t i = 0; i < arr.getSize(); ++i) {
        arr[i] = i * 10;
    }

    // 读取数据
    std::cout << "数组内容: ";
    for (size_t i = 0; i < arr.getSize(); ++i) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;

    // const 对象只能调用 const 版本
    const Array& constRef = arr;
    std::cout << "第一个元素: " << constRef[0] << std::endl;

    return 0;
}
```

### 多维下标运算符

在 C++23 之前，多维下标需要使用代理类或其他技巧。C++23 允许 `operator[]` 接受多个参数：

```cpp
#include <iostream>
#include <vector>
#include <stdexcept>

// C++23 之前的方法：使用代理类
class Matrix {
private:
    std::vector<std::vector<double>> data;
    size_t rows, cols;

    // 代理类用于二维访问
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

    // 或者使用 at() 方法
    double& at(size_t row, size_t col) {
        if (row >= rows || col >= cols) {
            throw std::out_of_range("索引越界");
        }
        return data[row][col];
    }

    const double& at(size_t row, size_t col) const {
        if (row >= rows || col >= cols) {
            throw std::out_of_range("索引越界");
        }
        return data[row][col];
    }

    size_t getRows() const { return rows; }
    size_t getCols() const { return cols; }
};

int main() {
    Matrix m(3, 3);

    // 使用代理类访问
    m[0][0] = 1; m[0][1] = 2; m[0][2] = 3;
    m[1][0] = 4; m[1][1] = 5; m[1][2] = 6;
    m[2][0] = 7; m[2][1] = 8; m[2][2] = 9;

    std::cout << "矩阵内容:" << std::endl;
    for (size_t i = 0; i < m.getRows(); ++i) {
        for (size_t j = 0; j < m.getCols(); ++j) {
            std::cout << m[i][j] << " ";
        }
        std::cout << std::endl;
    }

    // 使用 at() 方法
    std::cout << "m.at(1, 1) = " << m.at(1, 1) << std::endl;

    return 0;
}
```

## 自增和自减运算符重载

自增 `++` 和自减 `--` 运算符有前缀和后缀两种形式。

```cpp
#include <iostream>

class Iterator {
private:
    int value;

public:
    Iterator(int v = 0) : value(v) {}

    // 前缀自增 (++i)
    Iterator& operator++() {
        ++value;
        return *this;
    }

    // 后缀自增 (i++)
    Iterator operator++(int) {  // int 参数是占位符，用于区分后缀形式
        Iterator temp = *this;
        ++value;
        return temp;
    }

    // 前缀自减 (--i)
    Iterator& operator--() {
        --value;
        return *this;
    }

    // 后缀自减 (i--)
    Iterator operator--(int) {
        Iterator temp = *this;
        --value;
        return temp;
    }

    int getValue() const { return value; }

    friend std::ostream& operator<<(std::ostream& os, const Iterator& it) {
        os << it.value;
        return os;
    }
};

int main() {
    Iterator it(5);

    std::cout << "初始值: " << it << std::endl;

    std::cout << "前缀 ++: " << ++it << std::endl;  // 输出: 6
    std::cout << "当前值: " << it << std::endl;     // 输出: 6

    std::cout << "后缀 ++: " << it++ << std::endl;  // 输出: 6
    std::cout << "当前值: " << it << std::endl;     // 输出: 7

    std::cout << "前缀 --: " << --it << std::endl;  // 输出: 6
    std::cout << "后缀 --: " << it-- << std::endl;  // 输出: 6
    std::cout << "当前值: " << it << std::endl;     // 输出: 5

    return 0;
}
```

## 类型转换运算符

类型转换运算符允许对象隐式或显式转换为其他类型。

### 隐式类型转换

```cpp
#include <iostream>

class Rational {
private:
    int numerator;
    int denominator;

public:
    Rational(int num = 0, int den = 1) : numerator(num), denominator(den) {}

    // 转换为 double
    operator double() const {
        return static_cast<double>(numerator) / denominator;
    }

    // 转换为 bool
    operator bool() const {
        return numerator != 0;
    }
};

int main() {
    Rational r(3, 4);

    // 隐式转换为 double
    double d = r;
    std::cout << "转换为 double: " << d << std::endl;  // 输出: 0.75

    // 隐式转换为 bool
    if (r) {
        std::cout << "r 不为零" << std::endl;
    }

    Rational zero(0, 1);
    if (!zero) {
        std::cout << "zero 为零" << std::endl;
    }

    return 0;
}
```

### 显式类型转换

使用 `explicit` 关键字可以防止意外的隐式转换：

```cpp
#include <iostream>

class SafeInt {
private:
    int value;

public:
    SafeInt(int v = 0) : value(v) {}

    // 显式转换为 int
    explicit operator int() const {
        return value;
    }

    // 显式转换为 bool（C++11 推荐用于条件判断）
    explicit operator bool() const {
        return value != 0;
    }

    int getValue() const { return value; }
};

int main() {
    SafeInt si(42);

    // 错误：不允许隐式转换
    // int i = si;

    // 正确：显式转换
    int i = static_cast<int>(si);
    std::cout << "转换为 int: " << i << std::endl;

    // explicit operator bool() 在条件语句中仍然可以隐式使用
    if (si) {
        std::cout << "si 不为零" << std::endl;
    }

    // 但不能在其他上下文中隐式使用
    // bool b = si;  // 错误
    bool b = static_cast<bool>(si);  // 正确

    return 0;
}
```

## 解引用和成员访问运算符

这些运算符常用于实现智能指针和迭代器。

```cpp
#include <iostream>

template<typename T>
class SmartPtr {
private:
    T* ptr;

public:
    explicit SmartPtr(T* p = nullptr) : ptr(p) {}

    ~SmartPtr() {
        delete ptr;
    }

    // 禁止拷贝
    SmartPtr(const SmartPtr&) = delete;
    SmartPtr& operator=(const SmartPtr&) = delete;

    // 允许移动
    SmartPtr(SmartPtr&& other) noexcept : ptr(other.ptr) {
        other.ptr = nullptr;
    }

    SmartPtr& operator=(SmartPtr&& other) noexcept {
        if (this != &other) {
            delete ptr;
            ptr = other.ptr;
            other.ptr = nullptr;
        }
        return *this;
    }

    // 解引用运算符
    T& operator*() const {
        return *ptr;
    }

    // 成员访问运算符
    T* operator->() const {
        return ptr;
    }

    // 转换为 bool
    explicit operator bool() const {
        return ptr != nullptr;
    }

    // 获取原始指针
    T* get() const {
        return ptr;
    }
};

class Person {
public:
    std::string name;
    int age;

    Person(const std::string& n, int a) : name(n), age(a) {}

    void introduce() const {
        std::cout << "我是 " << name << "，今年 " << age << " 岁。" << std::endl;
    }
};

int main() {
    SmartPtr<Person> ptr(new Person("张三", 25));

    // 使用 -> 访问成员
    std::cout << "姓名: " << ptr->name << std::endl;
    std::cout << "年龄: " << ptr->age << std::endl;
    ptr->introduce();

    // 使用 * 解引用
    Person& p = *ptr;
    p.name = "李四";
    ptr->introduce();

    // 检查指针是否有效
    if (ptr) {
        std::cout << "指针有效" << std::endl;
    }

    return 0;
}
```

## 运算符重载的规则和最佳实践

### 基本规则

1. **不能创建新运算符**：只能重载已有的运算符
2. **不能改变运算符的优先级和结合性**
3. **不能改变运算符的操作数个数**
4. **某些运算符必须是成员函数**：`=`、`[]`、`()`、`->`

### 最佳实践

```cpp
#include <iostream>

class Money {
private:
    long cents;  // 以分为单位存储

public:
    explicit Money(long c = 0) : cents(c) {}
    Money(long dollars, long c) : cents(dollars * 100 + c) {}

    // 1. 使用 const 引用参数避免不必要的拷贝
    Money operator+(const Money& other) const {
        return Money(cents + other.cents);
    }

    // 2. 复合赋值运算符返回引用
    Money& operator+=(const Money& other) {
        cents += other.cents;
        return *this;
    }

    // 3. 基于复合赋值实现二元运算符
    Money operator-(const Money& other) const {
        Money result = *this;
        result -= other;
        return result;
    }

    Money& operator-=(const Money& other) {
        cents -= other.cents;
        return *this;
    }

    // 4. 比较运算符保持一致性
    bool operator==(const Money& other) const {
        return cents == other.cents;
    }

    bool operator!=(const Money& other) const {
        return !(*this == other);
    }

    bool operator<(const Money& other) const {
        return cents < other.cents;
    }

    bool operator>(const Money& other) const {
        return other < *this;
    }

    bool operator<=(const Money& other) const {
        return !(other < *this);
    }

    bool operator>=(const Money& other) const {
        return !(*this < other);
    }

    // 5. 流运算符作为友元函数
    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        long dollars = m.cents / 100;
        long c = std::abs(m.cents % 100);
        os << "$" << dollars << "." << (c < 10 ? "0" : "") << c;
        return os;
    }

    // 6. 前缀自增返回引用，后缀返回值
    Money& operator++() {
        cents += 100;  // 增加一美元
        return *this;
    }

    Money operator++(int) {
        Money temp = *this;
        cents += 100;
        return temp;
    }
};

int main() {
    Money m1(10, 50);  // $10.50
    Money m2(5, 25);   // $5.25

    std::cout << "m1 = " << m1 << std::endl;
    std::cout << "m2 = " << m2 << std::endl;

    std::cout << "m1 + m2 = " << (m1 + m2) << std::endl;  // $15.75
    std::cout << "m1 - m2 = " << (m1 - m2) << std::endl;  // $5.25

    m1 += m2;
    std::cout << "m1 += m2: " << m1 << std::endl;  // $15.75

    std::cout << "++m2 = " << ++m2 << std::endl;   // $6.25
    std::cout << "m2++ = " << m2++ << std::endl;   // $6.25
    std::cout << "m2 = " << m2 << std::endl;       // $7.25

    return 0;
}
```

### 常见错误和注意事项

```cpp
#include <iostream>

class BadExample {
private:
    int value;

public:
    BadExample(int v = 0) : value(v) {}

    // 错误示例 1：不应该重载 && 和 ||
    // 因为它们会失去短路求值特性
    // bool operator&&(const BadExample& other) const;  // 不推荐

    // 错误示例 2：不一致的语义
    // operator+ 应该返回新对象，而不是修改 this
    BadExample operator+(const BadExample& other) {
        value += other.value;  // 错误：修改了 this
        return *this;
    }

    // 正确做法
    BadExample correctPlus(const BadExample& other) const {
        return BadExample(value + other.value);
    }
};

class GoodExample {
private:
    int* data;
    size_t size;

public:
    GoodExample(size_t s) : size(s), data(new int[s]()) {}

    ~GoodExample() { delete[] data; }

    // 正确：自赋值检查
    GoodExample& operator=(const GoodExample& other) {
        if (this != &other) {  // 自赋值检查
            delete[] data;
            size = other.size;
            data = new int[size];
            std::copy(other.data, other.data + size, data);
        }
        return *this;
    }

    // 使用 copy-and-swap 惯用法更安全
    GoodExample& safeAssign(GoodExample other) {  // 按值传递
        std::swap(data, other.data);
        std::swap(size, other.size);
        return *this;
    }

    // 移动赋值也需要自赋值检查
    GoodExample& operator=(GoodExample&& other) noexcept {
        if (this != &other) {
            delete[] data;
            data = other.data;
            size = other.size;
            other.data = nullptr;
            other.size = 0;
        }
        return *this;
    }
};
```

## 实战示例：自定义字符串类

```cpp
#include <iostream>
#include <cstring>
#include <stdexcept>

class String {
private:
    char* data;
    size_t length;

    void init(const char* str) {
        length = std::strlen(str);
        data = new char[length + 1];
        std::strcpy(data, str);
    }

public:
    // 构造函数
    String(const char* str = "") {
        init(str);
    }

    // 拷贝构造函数
    String(const String& other) {
        init(other.data);
    }

    // 移动构造函数
    String(String&& other) noexcept : data(other.data), length(other.length) {
        other.data = nullptr;
        other.length = 0;
    }

    // 析构函数
    ~String() {
        delete[] data;
    }

    // 拷贝赋值运算符
    String& operator=(const String& other) {
        if (this != &other) {
            delete[] data;
            init(other.data);
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
        }
        return *this;
    }

    // 字符串连接
    String operator+(const String& other) const {
        char* newData = new char[length + other.length + 1];
        std::strcpy(newData, data);
        std::strcat(newData, other.data);
        String result;
        delete[] result.data;
        result.data = newData;
        result.length = length + other.length;
        return result;
    }

    String& operator+=(const String& other) {
        char* newData = new char[length + other.length + 1];
        std::strcpy(newData, data);
        std::strcat(newData, other.data);
        delete[] data;
        data = newData;
        length += other.length;
        return *this;
    }

    // 下标运算符
    char& operator[](size_t index) {
        if (index >= length) {
            throw std::out_of_range("索引越界");
        }
        return data[index];
    }

    const char& operator[](size_t index) const {
        if (index >= length) {
            throw std::out_of_range("索引越界");
        }
        return data[index];
    }

    // 比较运算符
    bool operator==(const String& other) const {
        return std::strcmp(data, other.data) == 0;
    }

    bool operator!=(const String& other) const {
        return !(*this == other);
    }

    bool operator<(const String& other) const {
        return std::strcmp(data, other.data) < 0;
    }

    bool operator>(const String& other) const {
        return other < *this;
    }

    bool operator<=(const String& other) const {
        return !(other < *this);
    }

    bool operator>=(const String& other) const {
        return !(*this < other);
    }

    // 流运算符
    friend std::ostream& operator<<(std::ostream& os, const String& str) {
        os << str.data;
        return os;
    }

    friend std::istream& operator>>(std::istream& is, String& str) {
        char buffer[1024];
        is >> buffer;
        delete[] str.data;
        str.init(buffer);
        return is;
    }

    // 获取长度
    size_t size() const { return length; }

    // 获取 C 风格字符串
    const char* c_str() const { return data; }

    // 转换为 bool
    explicit operator bool() const {
        return length > 0;
    }
};

int main() {
    String s1("Hello");
    String s2(" World");
    String s3 = s1 + s2;

    std::cout << "s1 = " << s1 << std::endl;           // Hello
    std::cout << "s2 = " << s2 << std::endl;           //  World
    std::cout << "s1 + s2 = " << s3 << std::endl;      // Hello World
    std::cout << "长度 = " << s3.size() << std::endl;  // 11

    s1 += "!!!";
    std::cout << "s1 += \"!!!\" = " << s1 << std::endl;  // Hello!!!

    std::cout << "s3[0] = " << s3[0] << std::endl;  // H
    s3[0] = 'h';
    std::cout << "修改后: " << s3 << std::endl;     // hello World

    String s4("abc");
    String s5("abd");
    std::cout << "\"abc\" < \"abd\" : " << (s4 < s5) << std::endl;  // 1

    if (s1) {
        std::cout << "s1 不为空" << std::endl;
    }

    return 0;
}
```

## 总结

运算符重载是 C++ 的一项强大特性，通过本文我们学习了：

1. **运算符重载基础**：运算符重载的概念和基本语法
2. **可重载运算符**：哪些运算符可以重载，哪些不能
3. **成员函数 vs 非成员函数**：如何选择合适的重载形式
4. **算术运算符**：`+`、`-`、`*`、`/` 以及复合赋值运算符
5. **比较运算符**：`==`、`!=`、`<`、`>` 以及 C++20 的三向比较
6. **流运算符**：`<<` 和 `>>` 的重载
7. **函数调用运算符**：创建函数对象（仿函数）
8. **下标运算符**：支持数组式访问
9. **自增自减运算符**：前缀和后缀形式
10. **类型转换运算符**：隐式和显式转换
11. **规则和最佳实践**：编写高质量运算符重载的指南

正确使用运算符重载可以使代码更加直观和易读，但也要注意不要滥用。运算符的行为应该符合用户的直觉预期，保持语义一致性是最重要的原则。
