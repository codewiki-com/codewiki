---
title: C++ 函数对象 (Functors)
description: 深入理解C++函数对象：operator()重载、std::function、std::bind、Lambda对比及STL谓词
track: cpp
section: templates-generic
difficulty: intermediate
tags:
  - C++
  - 函数对象
  - 仿函数
  - std::function
  - std::bind
  - Lambda
status: imported
origin: old/src/content/docs/cpp/function-objects.en.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: STL
  order: 7
  lastUpdated: 2026-01-07
---

Function objects, also known as functors, are a powerful and flexible concept in C++. They are class objects that overload the function call operator `operator()`, allowing them to be called like regular functions while offering more powerful capabilities: they can carry state, support templatization, and can be inlined by the compiler for optimization.

## Concept Explanation

### What Are Function Objects

A function object is an instance of a class that overloads the `operator()` operator. This allows the object to be called using parenthesis syntax, just like a function.

```cpp
#include <iostream>

// Define a function object class
class Adder {
private:
    int value;
public:
    Adder(int v) : value(v) {}

    // Overload the function call operator
    int operator()(int x) const {
        return x + value;
    }
};

int main() {
    Adder add5(5);           // Create a function object that adds 5
    int result = add5(10);   // Call it like a function, result is 15
    std::cout << result << std::endl;

    // Can also use temporary objects directly
    int result2 = Adder(10)(20);  // Result is 30
    std::cout << result2 << std::endl;

    return 0;
}
```

### Function Objects vs Regular Functions

| Feature | Regular Function | Function Object |
|---------|------------------|-----------------|
| State | Stateless (unless using global/static variables) | Can carry internal state |
| Inlining | Cannot be inlined when called through function pointer | Compiler can easily inline |
| Type | Function pointer type | Unique class type |
| Template Parameter | Requires function pointer type | Can be used as template type parameter |
| Polymorphism | Cannot achieve compile-time polymorphism | Supports compile-time polymorphism |

### Historical Background

The concept of function objects originated from the design of STL (Standard Template Library). When Alexander Stepanov designed STL, he needed a mechanism to pass "behavior" within algorithms. While ordinary function pointers could accomplish this, they had the following problems:

1. **Cannot carry state**: Function pointers can only point to stateless functions
2. **Performance loss**: Calling through function pointers prevents compiler inlining
3. **Inflexible types**: Function pointer types are fixed and hard to generalize

Function objects perfectly solved these problems and became a core component of STL algorithms.

## Core Principles

### How operator() Works

When the compiler encounters a call like `obj(args...)`, it transforms it into `obj.operator()(args...)`. This means the function call operator is just an ordinary member function that can be overloaded and can have multiple versions.

```cpp
#include <iostream>
#include <string>

class Printer {
public:
    // Can define multiple operator() overloads
    void operator()(int x) const {
        std::cout << "Integer: " << x << std::endl;
    }

    void operator()(double x) const {
        std::cout << "Float: " << x << std::endl;
    }

    void operator()(const std::string& s) const {
        std::cout << "String: " << s << std::endl;
    }

    // Can accept any number of arguments
    void operator()(int a, int b, int c) const {
        std::cout << "Three integers: " << a << ", " << b << ", " << c << std::endl;
    }
};

int main() {
    Printer print;

    print(42);           // Calls operator()(int)
    print(3.14);         // Calls operator()(double)
    print("Hello");      // Calls operator()(const std::string&)
    print(1, 2, 3);      // Calls operator()(int, int, int)

    return 0;
}
```

### Compiler Optimization

An important advantage of function objects is that the compiler can perform inline optimization. When using templates, the compiler knows the exact type of the function object and can directly inline its `operator()` implementation:

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// Function object
struct Square {
    int operator()(int x) const { return x * x; }
};

// Regular function
int square(int x) { return x * x; }

template<typename Func>
void applyToAll(std::vector<int>& vec, Func f) {
    for (auto& x : vec) {
        x = f(x);  // Compiler can inline function object calls
    }
}

int main() {
    std::vector<int> vec1 = {1, 2, 3, 4, 5};
    std::vector<int> vec2 = {1, 2, 3, 4, 5};

    // Using function object: compiler can inline
    applyToAll(vec1, Square());

    // Using function pointer: may not be inlined
    applyToAll(vec2, square);

    return 0;
}
```

### State Retention Mechanism

Function objects can maintain state through member variables, which is their core advantage over regular functions:

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// Accumulator: maintains running state
class Accumulator {
private:
    int sum = 0;
    int count = 0;

public:
    void operator()(int x) {
        sum += x;
        ++count;
    }

    int getSum() const { return sum; }
    int getCount() const { return count; }
    double getAverage() const {
        return count > 0 ? static_cast<double>(sum) / count : 0.0;
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // for_each returns the final function object
    Accumulator acc = std::for_each(numbers.begin(), numbers.end(), Accumulator());

    std::cout << "Sum: " << acc.getSum() << std::endl;       // 55
    std::cout << "Count: " << acc.getCount() << std::endl;   // 10
    std::cout << "Average: " << acc.getAverage() << std::endl;   // 5.5

    return 0;
}
```

## Key Points

### Standard Function Objects in STL

STL provides a series of standard function objects in the `<functional>` header:

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3};

    // Arithmetic function objects
    std::plus<int> add;
    std::minus<int> subtract;
    std::multiplies<int> multiply;
    std::divides<int> divide;
    std::modulus<int> mod;
    std::negate<int> neg;

    std::cout << "Addition: " << add(10, 5) << std::endl;       // 15
    std::cout << "Subtraction: " << subtract(10, 5) << std::endl;  // 5
    std::cout << "Multiplication: " << multiply(10, 5) << std::endl;  // 50
    std::cout << "Division: " << divide(10, 5) << std::endl;    // 2
    std::cout << "Modulus: " << mod(10, 3) << std::endl;       // 1
    std::cout << "Negation: " << neg(10) << std::endl;          // -10

    // Comparison function objects
    std::less<int> lt;
    std::greater<int> gt;
    std::less_equal<int> lte;
    std::greater_equal<int> gte;
    std::equal_to<int> eq;
    std::not_equal_to<int> neq;

    std::cout << "Less than: " << lt(5, 10) << std::endl;     // 1
    std::cout << "Greater than: " << gt(5, 10) << std::endl;     // 0

    // Logical function objects
    std::logical_and<bool> land;
    std::logical_or<bool> lor;
    std::logical_not<bool> lnot;

    std::cout << "Logical AND: " << land(true, false) << std::endl;  // 0
    std::cout << "Logical OR: " << lor(true, false) << std::endl;   // 1
    std::cout << "Logical NOT: " << lnot(true) << std::endl;         // 0

    // Using standard function objects for sorting
    std::sort(vec.begin(), vec.end(), std::greater<int>());  // Descending sort

    std::cout << "Descending order: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;  // 9 8 5 3 2 1

    // Using standard function objects for accumulation
    int product = std::accumulate(vec.begin(), vec.end(), 1, std::multiplies<int>());
    std::cout << "Product: " << product << std::endl;  // 2160

    return 0;
}
```

### Transparent Operators (C++14)

C++14 introduced transparent operators, allowing `void` as the template parameter to avoid type conversions:

```cpp
#include <functional>
#include <set>
#include <string>
#include <iostream>

int main() {
    // C++14 transparent comparator
    std::set<std::string, std::less<>> strings = {"apple", "banana", "cherry"};

    // Can search directly with const char*, no conversion to std::string needed
    auto it = strings.find("banana");  // Won't create temporary std::string
    if (it != strings.end()) {
        std::cout << "Found: " << *it << std::endl;
    }

    // Transparent arithmetic operators
    std::plus<> add;  // Can handle different types
    std::cout << add(1, 2.5) << std::endl;  // 3.5

    return 0;
}
```

### Predicates

Predicates are function objects that return boolean values and are widely used in STL algorithms:

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

// Unary predicate: accepts one argument
class IsEven {
public:
    bool operator()(int x) const {
        return x % 2 == 0;
    }
};

// Parameterized unary predicate
class GreaterThan {
private:
    int threshold;
public:
    GreaterThan(int t) : threshold(t) {}

    bool operator()(int x) const {
        return x > threshold;
    }
};

// Binary predicate: accepts two arguments
class StringLengthCompare {
public:
    bool operator()(const std::string& a, const std::string& b) const {
        return a.length() < b.length();
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Using unary predicate
    int evenCount = std::count_if(numbers.begin(), numbers.end(), IsEven());
    std::cout << "Even number count: " << evenCount << std::endl;  // 5

    // Using parameterized predicate
    int greaterThan5 = std::count_if(numbers.begin(), numbers.end(), GreaterThan(5));
    std::cout << "Count greater than 5: " << greaterThan5 << std::endl;  // 5

    // Using predicate for partitioning
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    std::partition(nums.begin(), nums.end(), IsEven());

    std::cout << "After partition: ";
    for (int x : nums) std::cout << x << " ";
    std::cout << std::endl;  // Even numbers first, odd numbers after

    // Using binary predicate for sorting
    std::vector<std::string> words = {"a", "bbb", "cc", "dddd", "eeeee"};
    std::sort(words.begin(), words.end(), StringLengthCompare());

    std::cout << "Sorted by length: ";
    for (const auto& w : words) std::cout << w << " ";
    std::cout << std::endl;  // a cc bbb dddd eeeee

    return 0;
}
```

### Function Object Adapters

STL provides function object adapters to combine and modify function object behavior:

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // std::not_fn (C++17) - negation
    auto isOdd = std::not_fn(std::modulus<int>());  // Not divisible by 2
    // Note: This usage requires more complex composition, demonstrated with lambda below

    auto isEven = [](int x) { return x % 2 == 0; };
    auto isNotEven = std::not_fn(isEven);

    int oddCount = std::count_if(numbers.begin(), numbers.end(), isNotEven);
    std::cout << "Odd number count: " << oddCount << std::endl;  // 5

    return 0;
}
```

## Code Examples

### Basic Function Objects

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// Comparator function object
template<typename T>
class DescendingOrder {
public:
    bool operator()(const T& a, const T& b) const {
        return a > b;
    }
};

// Transformer function object
class CelsiusToFahrenheit {
public:
    double operator()(double celsius) const {
        return celsius * 9.0 / 5.0 + 32.0;
    }
};

// Filter function object
class InRange {
private:
    int min, max;
public:
    InRange(int mi, int ma) : min(mi), max(ma) {}

    bool operator()(int x) const {
        return x >= min && x <= max;
    }
};

int main() {
    // Using comparator for sorting
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    std::sort(numbers.begin(), numbers.end(), DescendingOrder<int>());

    std::cout << "Descending: ";
    for (int x : numbers) std::cout << x << " ";
    std::cout << std::endl;  // 9 8 5 2 1

    // Using transformer for conversion
    std::vector<double> celsius = {0, 20, 37, 100};
    std::vector<double> fahrenheit(celsius.size());
    std::transform(celsius.begin(), celsius.end(),
                   fahrenheit.begin(), CelsiusToFahrenheit());

    std::cout << "Fahrenheit: ";
    for (double f : fahrenheit) std::cout << f << " ";
    std::cout << std::endl;  // 32 68 98.6 212

    // Using filter
    numbers = {1, 5, 10, 15, 20, 25, 30};
    std::vector<int> filtered;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(filtered), InRange(10, 25));

    std::cout << "In range 10-25: ";
    for (int x : filtered) std::cout << x << " ";
    std::cout << std::endl;  // 10 15 20 25

    return 0;
}
```

### std::function Explained

`std::function` is a general-purpose function wrapper that can store, copy, and invoke any callable target:

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <string>

// Regular function
int add(int a, int b) {
    return a + b;
}

// Function object class
class Multiplier {
private:
    int factor;
public:
    Multiplier(int f) : factor(f) {}

    int operator()(int x) const {
        return x * factor;
    }
};

// Class member function
class Calculator {
public:
    int subtract(int a, int b) const {
        return a - b;
    }

    static int divide(int a, int b) {
        return a / b;
    }
};

int main() {
    // 1. Wrapping regular function
    std::function<int(int, int)> func1 = add;
    std::cout << "Regular function: " << func1(5, 3) << std::endl;  // 8

    // 2. Wrapping function object
    std::function<int(int)> func2 = Multiplier(3);
    std::cout << "Function object: " << func2(4) << std::endl;  // 12

    // 3. Wrapping Lambda
    std::function<int(int, int)> func3 = [](int a, int b) {
        return a * b;
    };
    std::cout << "Lambda: " << func3(4, 5) << std::endl;  // 20

    // 4. Wrapping member function
    Calculator calc;
    std::function<int(const Calculator&, int, int)> func4 = &Calculator::subtract;
    std::cout << "Member function: " << func4(calc, 10, 3) << std::endl;  // 7

    // 5. Wrapping static member function
    std::function<int(int, int)> func5 = &Calculator::divide;
    std::cout << "Static member function: " << func5(20, 4) << std::endl;  // 5

    // 6. Using std::function as callback
    std::vector<std::function<int(int, int)>> operations = {
        add,
        [](int a, int b) { return a - b; },
        [](int a, int b) { return a * b; },
        &Calculator::divide
    };

    int a = 12, b = 4;
    std::cout << "\nPerforming operations on " << a << " and " << b << ":" << std::endl;
    for (const auto& op : operations) {
        std::cout << op(a, b) << " ";  // 16 8 48 3
    }
    std::cout << std::endl;

    // 7. Checking if std::function is empty
    std::function<void()> emptyFunc;
    if (!emptyFunc) {
        std::cout << "Function is empty" << std::endl;
    }

    emptyFunc = []() { std::cout << "Now it's not empty" << std::endl; };
    if (emptyFunc) {
        emptyFunc();
    }

    return 0;
}
```

### std::bind Explained

`std::bind` is used to bind function arguments, creating new callable objects:

```cpp
#include <functional>
#include <iostream>
#include <string>
#include <algorithm>
#include <vector>

using namespace std::placeholders;  // _1, _2, _3...

int add(int a, int b) {
    return a + b;
}

int subtract(int a, int b) {
    return a - b;
}

void printInfo(const std::string& name, int age, const std::string& city) {
    std::cout << name << ", " << age << " years old, from " << city << std::endl;
}

class TextProcessor {
public:
    std::string concat(const std::string& a, const std::string& b) const {
        return a + b;
    }

    bool startsWith(const std::string& text, const std::string& prefix) const {
        return text.find(prefix) == 0;
    }
};

int main() {
    // 1. Binding partial arguments
    auto add5 = std::bind(add, _1, 5);  // Second argument fixed to 5
    std::cout << "10 + 5 = " << add5(10) << std::endl;  // 15

    // 2. Binding the first argument
    auto subtractFrom100 = std::bind(subtract, 100, _1);
    std::cout << "100 - 30 = " << subtractFrom100(30) << std::endl;  // 70

    // 3. Reordering arguments
    auto reverseSubtract = std::bind(subtract, _2, _1);
    std::cout << "Reverse subtract(5, 10): " << reverseSubtract(5, 10) << std::endl;  // 5

    // 4. Binding multiple arguments
    auto printTom = std::bind(printInfo, "Tom", _1, "Beijing");
    printTom(25);  // Tom, 25 years old, from Beijing

    auto printLiInShanghai = std::bind(printInfo, _1, 30, "Shanghai");
    printLiInShanghai("Li Ming");  // Li Ming, 30 years old, from Shanghai

    // 5. Binding member functions
    TextProcessor processor;

    // Binding object and member function
    auto concat = std::bind(&TextProcessor::concat, &processor, _1, _2);
    std::cout << concat("Hello, ", "World!") << std::endl;

    // Binding object and partial arguments
    auto startsWithHello = std::bind(&TextProcessor::startsWith,
                                      &processor, _1, "Hello");
    std::cout << std::boolalpha;
    std::cout << "\"Hello World\" starts with Hello: "
              << startsWithHello("Hello World") << std::endl;  // true
    std::cout << "\"Hi World\" starts with Hello: "
              << startsWithHello("Hi World") << std::endl;      // false

    // 6. Using bind in algorithms
    std::vector<int> numbers = {1, 5, 10, 15, 20, 25};

    // Count elements greater than 10
    int count = std::count_if(numbers.begin(), numbers.end(),
                               std::bind(std::greater<int>(), _1, 10));
    std::cout << "Count greater than 10: " << count << std::endl;  // 3

    // 7. Nested bind
    // Calculate (a + b) * 2
    auto addThenDouble = std::bind(std::multiplies<int>(),
                                    std::bind(add, _1, _2), 2);
    std::cout << "(3 + 4) * 2 = " << addThenDouble(3, 4) << std::endl;  // 14

    // 8. Reference arguments
    int counter = 0;
    auto incrementCounter = std::bind([](int& c) { ++c; }, std::ref(counter));

    incrementCounter();
    incrementCounter();
    incrementCounter();
    std::cout << "Counter: " << counter << std::endl;  // 3

    return 0;
}
```

### Lambda vs Function Objects

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

// Traditional function object
class Counter {
private:
    mutable int count = 0;  // mutable allows modification in const member function

public:
    void operator()(int) const {
        ++count;
    }

    int getCount() const { return count; }

    void reset() { count = 0; }
};

class Multiplier {
private:
    int factor;

public:
    explicit Multiplier(int f) : factor(f) {}

    int operator()(int x) const {
        return x * factor;
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // ========== Function Object Approach ==========
    std::cout << "=== Function Object Approach ===" << std::endl;

    // Using function object for counting
    Counter counter;
    counter = std::for_each(numbers.begin(), numbers.end(), counter);
    std::cout << "Element count: " << counter.getCount() << std::endl;

    // Using function object for transformation
    std::vector<int> doubled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   doubled.begin(), Multiplier(2));

    std::cout << "Doubled: ";
    for (int x : doubled) std::cout << x << " ";
    std::cout << std::endl;

    // ========== Lambda Approach ==========
    std::cout << "\n=== Lambda Approach ===" << std::endl;

    // Lambda counting
    int lambdaCount = 0;
    std::for_each(numbers.begin(), numbers.end(),
                  [&lambdaCount](int) { ++lambdaCount; });
    std::cout << "Element count: " << lambdaCount << std::endl;

    // Lambda transformation
    int factor = 2;
    std::vector<int> lambdaDoubled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   lambdaDoubled.begin(),
                   [factor](int x) { return x * factor; });

    std::cout << "Doubled: ";
    for (int x : lambdaDoubled) std::cout << x << " ";
    std::cout << std::endl;

    // ========== Complex Scenarios ==========
    std::cout << "\n=== Complex Scenarios ===" << std::endl;

    // Function objects can be reused and tested
    Multiplier tripler(3);

    std::vector<int> tripled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   tripled.begin(), tripler);

    // Same object can be used multiple times
    std::transform(tripled.begin(), tripled.end(),
                   tripled.begin(), tripler);  // Multiply by 3 again

    std::cout << "9x: ";
    for (int x : tripled) std::cout << x << " ";
    std::cout << std::endl;

    // Lambda needs to be stored for reuse
    auto multiplier = [](int x, int f) { return x * f; };
    auto times4 = [&multiplier](int x) { return multiplier(x, 4); };

    std::vector<int> quadrupled(numbers.size());
    std::transform(numbers.begin(), numbers.end(),
                   quadrupled.begin(), times4);

    std::cout << "4x: ";
    for (int x : quadrupled) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### STL Algorithms and Predicates

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <numeric>

// Employee structure
struct Employee {
    std::string name;
    int age;
    double salary;
    std::string department;
};

// Various predicate function objects
class InDepartment {
private:
    std::string dept;
public:
    InDepartment(const std::string& d) : dept(d) {}

    bool operator()(const Employee& e) const {
        return e.department == dept;
    }
};

class SalaryAbove {
private:
    double threshold;
public:
    SalaryAbove(double t) : threshold(t) {}

    bool operator()(const Employee& e) const {
        return e.salary > threshold;
    }
};

class AgeInRange {
private:
    int minAge, maxAge;
public:
    AgeInRange(int mi, int ma) : minAge(mi), maxAge(ma) {}

    bool operator()(const Employee& e) const {
        return e.age >= minAge && e.age <= maxAge;
    }
};

// Comparators
class CompareBySalary {
public:
    bool operator()(const Employee& a, const Employee& b) const {
        return a.salary > b.salary;  // Descending
    }
};

class CompareByAge {
public:
    bool operator()(const Employee& a, const Employee& b) const {
        return a.age < b.age;  // Ascending
    }
};

int main() {
    std::vector<Employee> employees = {
        {"Zhang San", 28, 15000, "R&D"},
        {"Li Si", 35, 25000, "R&D"},
        {"Wang Wu", 42, 30000, "Management"},
        {"Zhao Liu", 25, 12000, "Marketing"},
        {"Qian Qi", 30, 18000, "R&D"},
        {"Sun Ba", 38, 22000, "Marketing"},
        {"Zhou Jiu", 45, 35000, "Management"},
        {"Wu Shi", 27, 14000, "R&D"}
    };

    // 1. Count R&D department employees
    int devCount = std::count_if(employees.begin(), employees.end(),
                                  InDepartment("R&D"));
    std::cout << "R&D department employee count: " << devCount << std::endl;

    // 2. Find employees with salary above 20000
    std::cout << "\nEmployees with salary above 20000:" << std::endl;
    std::vector<Employee> highPaid;
    std::copy_if(employees.begin(), employees.end(),
                 std::back_inserter(highPaid), SalaryAbove(20000));

    for (const auto& e : highPaid) {
        std::cout << "  " << e.name << ": " << e.salary << std::endl;
    }

    // 3. Sort by salary
    std::vector<Employee> sorted = employees;
    std::sort(sorted.begin(), sorted.end(), CompareBySalary());

    std::cout << "\nSorted by salary (descending):" << std::endl;
    for (const auto& e : sorted) {
        std::cout << "  " << e.name << ": " << e.salary << std::endl;
    }

    // 4. Find employees aged 25-35
    std::cout << "\nEmployees aged 25-35:" << std::endl;
    for (const auto& e : employees) {
        if (AgeInRange(25, 35)(e)) {
            std::cout << "  " << e.name << ": " << e.age << " years old" << std::endl;
        }
    }

    // 5. Check if all R&D employees have salary above 10000
    std::vector<Employee> devEmployees;
    std::copy_if(employees.begin(), employees.end(),
                 std::back_inserter(devEmployees), InDepartment("R&D"));

    bool allAbove10k = std::all_of(devEmployees.begin(), devEmployees.end(),
                                    SalaryAbove(10000));
    std::cout << "\nAll R&D employees have salary above 10000: "
              << (allAbove10k ? "Yes" : "No") << std::endl;

    // 6. Calculate total salary (using stateful function object)
    class SalarySum {
    public:
        double operator()(double sum, const Employee& e) const {
            return sum + e.salary;
        }
    };

    double totalSalary = std::accumulate(employees.begin(), employees.end(),
                                          0.0, SalarySum());
    std::cout << "\nTotal salary: " << totalSalary << std::endl;

    // 7. Partition: put high salary employees first
    std::vector<Employee> partitioned = employees;
    auto partition_point = std::partition(partitioned.begin(), partitioned.end(),
                                           SalaryAbove(18000));

    std::cout << "\nHigh salary employees (>18000):" << std::endl;
    for (auto it = partitioned.begin(); it != partition_point; ++it) {
        std::cout << "  " << it->name << ": " << it->salary << std::endl;
    }

    return 0;
}
```

## Best Practices

### Choose the Right Callable Type

```cpp
#include <functional>
#include <iostream>

// 1. Simple one-time operations -> Lambda
void lambdaExample() {
    auto result = [](int x) { return x * 2; }(5);
    std::cout << result << std::endl;
}

// 2. Reusable logic -> Function object class
class ReuseableOperation {
    int factor;
public:
    ReuseableOperation(int f) : factor(f) {}
    int operator()(int x) const { return x * factor; }
};

// 3. Need type erasure (storing different callable types) -> std::function
void storeCallables() {
    std::vector<std::function<int(int)>> operations;
    operations.push_back([](int x) { return x + 1; });
    operations.push_back(ReuseableOperation(2));
    operations.push_back([](int x) { return x * x; });
}

// 4. Need to bind arguments -> std::bind or Lambda
void bindExample() {
    // Prefer Lambda (clearer, better performance)
    auto add5_lambda = [](int x) { return x + 5; };

    // std::bind for complex argument reordering or member function binding
    auto add5_bind = std::bind(std::plus<int>(), std::placeholders::_1, 5);
}
```

### Keep Function Objects Small

```cpp
#include <iostream>
#include <string>

// Bad: Function object is too complex
class BadFunctor {
    std::string largeData;
    std::vector<int> moreData;
    // ... many member variables

public:
    // Complex constructor
    // Complex operator()
};

// Good: Keep function objects simple
class GoodFunctor {
    int threshold;

public:
    explicit GoodFunctor(int t) : threshold(t) {}

    bool operator()(int x) const {
        return x > threshold;
    }
};

// If complex logic is needed, consider storing references or pointers
class ComplexLogicFunctor {
    const std::vector<int>& data;  // Store reference to avoid copying

public:
    explicit ComplexLogicFunctor(const std::vector<int>& d) : data(d) {}

    bool operator()(int x) const {
        // Use data for complex logic
        return std::find(data.begin(), data.end(), x) != data.end();
    }
};
```

### Use const Correctly

```cpp
#include <iostream>
#include <algorithm>
#include <vector>

// Good: operator() declared as const (when state modification is not needed)
class GoodConstFunctor {
    int value;
public:
    GoodConstFunctor(int v) : value(v) {}

    int operator()(int x) const {  // const member function
        return x + value;
    }
};

// When state modification is needed, use mutable
class StatefulFunctor {
    mutable int callCount = 0;  // mutable allows modification in const function

public:
    void operator()(int x) const {
        ++callCount;
        std::cout << "Call #" << callCount << ", argument: " << x << std::endl;
    }

    int getCallCount() const { return callCount; }
};

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};

    StatefulFunctor counter;
    counter = std::for_each(nums.begin(), nums.end(), counter);

    std::cout << "Total calls: " << counter.getCallCount() << std::endl;

    return 0;
}
```

### Consider Performance Impact

```cpp
#include <functional>
#include <iostream>
#include <chrono>
#include <vector>

// Direct function object use (compiler can inline)
struct DirectFunctor {
    int operator()(int x) const { return x * 2; }
};

// Using std::function (has runtime overhead)
void comparePerformance() {
    const int iterations = 10000000;
    std::vector<int> data(1000, 1);

    // Method 1: Direct function object (fastest)
    auto start1 = std::chrono::high_resolution_clock::now();
    DirectFunctor functor;
    for (int i = 0; i < iterations; ++i) {
        for (auto& x : data) x = functor(x);
    }
    auto end1 = std::chrono::high_resolution_clock::now();

    // Method 2: Using std::function (has overhead)
    std::fill(data.begin(), data.end(), 1);
    auto start2 = std::chrono::high_resolution_clock::now();
    std::function<int(int)> func = [](int x) { return x * 2; };
    for (int i = 0; i < iterations; ++i) {
        for (auto& x : data) x = func(x);
    }
    auto end2 = std::chrono::high_resolution_clock::now();

    auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2);

    std::cout << "Direct function object: " << duration1.count() << "ms" << std::endl;
    std::cout << "std::function: " << duration2.count() << "ms" << std::endl;
}
```

## Common Pitfalls

### Performance Overhead of std::function

```cpp
#include <functional>
#include <iostream>

// Pitfall: Unnecessarily using std::function
template<typename F>
void processWithFunction(std::function<int(int)> f, int x) {
    // std::function has type erasure overhead
    std::cout << f(x) << std::endl;
}

// Improvement: Use template parameter
template<typename F>
void processWithTemplate(F&& f, int x) {
    // Compiler can inline, no extra overhead
    std::cout << f(x) << std::endl;
}

int main() {
    auto lambda = [](int x) { return x * 2; };

    // Has overhead
    processWithFunction(lambda, 5);

    // No overhead
    processWithTemplate(lambda, 5);

    return 0;
}
```

### std::bind Pitfalls

```cpp
#include <functional>
#include <iostream>

using namespace std::placeholders;

void print(int a, int b, int c) {
    std::cout << a << ", " << b << ", " << c << std::endl;
}

int main() {
    // Pitfall 1: Arguments are passed by value by default
    int x = 10;
    auto bound = std::bind(print, x, _1, _2);
    x = 20;  // Modifying x doesn't affect bound
    bound(2, 3);  // Output: 10, 2, 3 (not 20)

    // Solution: Use std::ref
    x = 10;
    auto boundRef = std::bind(print, std::ref(x), _1, _2);
    x = 20;
    boundRef(2, 3);  // Output: 20, 2, 3

    // Pitfall 2: Nested bind may not work as expected
    auto nested = std::bind(print, std::bind(std::plus<int>(), 1, 2), _1, _2);
    nested(4, 5);  // Output: 3, 4, 5

    // Pitfall 3: bind expressions as arguments
    // When using std::bind, if an argument is itself a bind expression, it gets invoked
    // Need to use std::protect (C++20) or wrap with Lambda

    return 0;
}
```

### Dangling Reference Capture

```cpp
#include <functional>
#include <iostream>

std::function<int()> createDangerousFunctor() {
    int localVar = 42;
    // Dangerous: returning lambda that captures local variable by reference
    return [&localVar]() { return localVar; };  // localVar will be destroyed
}

std::function<int()> createSafeFunctor() {
    int localVar = 42;
    // Safe: capture by value
    return [localVar]() { return localVar; };
}

class DangerousFunctor {
    int& ref;
public:
    DangerousFunctor(int& r) : ref(r) {}
    int operator()() const { return ref; }  // Dangerous: ref may dangle
};

class SafeFunctor {
    int value;
public:
    SafeFunctor(int v) : value(v) {}
    int operator()() const { return value; }  // Safe: stored by value
};

int main() {
    // auto dangerous = createDangerousFunctor();
    // std::cout << dangerous() << std::endl;  // Undefined behavior

    auto safe = createSafeFunctor();
    std::cout << safe() << std::endl;  // Works correctly

    return 0;
}
```

### Forgetting Return Value

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

class Accumulator {
    int sum = 0;
public:
    void operator()(int x) { sum += x; }
    int getSum() const { return sum; }
};

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};

    // Pitfall: for_each uses a copy of the function object
    Accumulator acc;
    std::for_each(nums.begin(), nums.end(), acc);
    std::cout << "Wrong result: " << acc.getSum() << std::endl;  // 0, because acc wasn't modified

    // Correct: Use for_each's return value
    acc = std::for_each(nums.begin(), nums.end(), Accumulator());
    std::cout << "Correct result: " << acc.getSum() << std::endl;  // 15

    // Or use reference wrapper
    Accumulator acc2;
    std::for_each(nums.begin(), nums.end(), std::ref(acc2));
    std::cout << "Reference wrapper: " << acc2.getSum() << std::endl;  // 15

    return 0;
}
```

## Performance Considerations

### Inline Optimization

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
#include <chrono>

// Function object: compiler can inline
struct InlineFunctor {
    int operator()(int x) const { return x * 2; }
};

// Regular function: may not be inlined when called via pointer
int regularFunction(int x) { return x * 2; }

int main() {
    std::vector<int> vec(1000000);
    std::iota(vec.begin(), vec.end(), 0);

    // Test 1: Function object (usually fastest)
    auto start1 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(), InlineFunctor());
    }
    auto end1 = std::chrono::high_resolution_clock::now();

    // Test 2: Lambda (comparable to function object)
    auto start2 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(),
                       [](int x) { return x * 2; });
    }
    auto end2 = std::chrono::high_resolution_clock::now();

    // Test 3: Function pointer (may not be inlined)
    auto start3 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(), regularFunction);
    }
    auto end3 = std::chrono::high_resolution_clock::now();

    // Test 4: std::function (has type erasure overhead)
    std::function<int(int)> func = [](int x) { return x * 2; };
    auto start4 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        std::transform(vec.begin(), vec.end(), vec.begin(), func);
    }
    auto end4 = std::chrono::high_resolution_clock::now();

    auto d1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
    auto d2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2);
    auto d3 = std::chrono::duration_cast<std::chrono::milliseconds>(end3 - start3);
    auto d4 = std::chrono::duration_cast<std::chrono::milliseconds>(end4 - start4);

    std::cout << "Function object: " << d1.count() << "ms" << std::endl;
    std::cout << "Lambda: " << d2.count() << "ms" << std::endl;
    std::cout << "Function pointer: " << d3.count() << "ms" << std::endl;
    std::cout << "std::function: " << d4.count() << "ms" << std::endl;

    return 0;
}
```

### Memory Allocation

```cpp
#include <functional>
#include <iostream>
#include <string>

int main() {
    // Small Lambda: may use Small Buffer Optimization (SBO)
    std::function<int(int)> small = [](int x) { return x * 2; };

    // Large Lambda: may require heap allocation
    std::string largeCapture(1000, 'x');
    std::function<int(int)> large = [largeCapture](int x) {
        return x + static_cast<int>(largeCapture.size());
    };

    // Recommendation: For performance-sensitive code, avoid creating std::function in hot paths

    return 0;
}
```

## Real-World Scenarios

### Callback System

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>

class EventSystem {
public:
    using Callback = std::function<void(const std::string&)>;

private:
    std::unordered_map<std::string, std::vector<Callback>> listeners;

public:
    // Register event listener
    void on(const std::string& event, Callback callback) {
        listeners[event].push_back(std::move(callback));
    }

    // Trigger event
    void emit(const std::string& event, const std::string& data = "") {
        if (listeners.find(event) != listeners.end()) {
            for (const auto& callback : listeners[event]) {
                callback(data);
            }
        }
    }

    // Clear event listeners
    void off(const std::string& event) {
        listeners.erase(event);
    }
};

int main() {
    EventSystem events;

    // Register listeners
    events.on("login", [](const std::string& user) {
        std::cout << "User " << user << " logged in" << std::endl;
    });

    events.on("login", [](const std::string& user) {
        std::cout << "Logging login: " << user << std::endl;
    });

    events.on("logout", [](const std::string& user) {
        std::cout << "User " << user << " logged out" << std::endl;
    });

    // Trigger events
    events.emit("login", "John");
    events.emit("logout", "Jane");

    return 0;
}
```

### Strategy Pattern

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

// Implementing Strategy Pattern with function objects
class DataProcessor {
public:
    using FilterStrategy = std::function<bool(int)>;
    using TransformStrategy = std::function<int(int)>;
    using ReduceStrategy = std::function<int(int, int)>;

private:
    std::vector<int> data;
    FilterStrategy filter;
    TransformStrategy transform;
    ReduceStrategy reduce;

public:
    DataProcessor(std::vector<int> d) : data(std::move(d)) {}

    void setFilter(FilterStrategy f) { filter = std::move(f); }
    void setTransform(TransformStrategy t) { transform = std::move(t); }
    void setReduce(ReduceStrategy r) { reduce = std::move(r); }

    int process() {
        std::vector<int> result;

        // Apply filter strategy
        if (filter) {
            std::copy_if(data.begin(), data.end(),
                        std::back_inserter(result), filter);
        } else {
            result = data;
        }

        // Apply transform strategy
        if (transform) {
            std::transform(result.begin(), result.end(),
                          result.begin(), transform);
        }

        // Apply reduce strategy
        if (reduce && !result.empty()) {
            return std::accumulate(result.begin() + 1, result.end(),
                                   result[0], reduce);
        }

        return result.empty() ? 0 : result[0];
    }
};

int main() {
    DataProcessor processor({1, 2, 3, 4, 5, 6, 7, 8, 9, 10});

    // Set strategies: filter even numbers, square them, sum
    processor.setFilter([](int x) { return x % 2 == 0; });
    processor.setTransform([](int x) { return x * x; });
    processor.setReduce([](int a, int b) { return a + b; });

    int result = processor.process();
    std::cout << "Result: " << result << std::endl;  // 4 + 16 + 36 + 64 + 100 = 220

    return 0;
}
```

### Command Pattern

```cpp
#include <functional>
#include <iostream>
#include <vector>
#include <stack>
#include <string>

class CommandManager {
public:
    using Command = std::function<void()>;
    using UndoCommand = std::function<void()>;

private:
    std::stack<UndoCommand> undoStack;
    std::stack<Command> redoStack;

public:
    void execute(Command cmd, UndoCommand undo) {
        cmd();
        undoStack.push(undo);
        // Clear redo stack
        while (!redoStack.empty()) redoStack.pop();
    }

    void undo() {
        if (undoStack.empty()) {
            std::cout << "Nothing to undo" << std::endl;
            return;
        }

        auto cmd = undoStack.top();
        undoStack.pop();
        cmd();
        // Undo operation can be redone
    }

    bool canUndo() const { return !undoStack.empty(); }
};

// Text editor example
class TextEditor {
private:
    std::string text;
    CommandManager& cmdManager;

public:
    TextEditor(CommandManager& cm) : cmdManager(cm) {}

    void append(const std::string& str) {
        std::string oldText = text;

        cmdManager.execute(
            [this, str]() {
                text += str;
                std::cout << "Appended text: \"" << str << "\"" << std::endl;
            },
            [this, oldText]() {
                text = oldText;
                std::cout << "Undid append" << std::endl;
            }
        );
    }

    void clear() {
        std::string oldText = text;

        cmdManager.execute(
            [this]() {
                text.clear();
                std::cout << "Cleared text" << std::endl;
            },
            [this, oldText]() {
                text = oldText;
                std::cout << "Undid clear" << std::endl;
            }
        );
    }

    void print() const {
        std::cout << "Current text: \"" << text << "\"" << std::endl;
    }
};

int main() {
    CommandManager cmdManager;
    TextEditor editor(cmdManager);

    editor.append("Hello");
    editor.print();

    editor.append(" World");
    editor.print();

    editor.append("!");
    editor.print();

    std::cout << "\n--- Undo Operations ---" << std::endl;
    cmdManager.undo();
    editor.print();

    cmdManager.undo();
    editor.print();

    return 0;
}
```

### Lazy Evaluation

```cpp
#include <functional>
#include <iostream>
#include <chrono>
#include <thread>
#include <optional>

template<typename T>
class Lazy {
private:
    std::function<T()> computation;
    mutable std::optional<T> cachedValue;

public:
    explicit Lazy(std::function<T()> comp) : computation(std::move(comp)) {}

    const T& get() const {
        if (!cachedValue) {
            cachedValue = computation();
        }
        return *cachedValue;
    }

    void reset() {
        cachedValue.reset();
    }

    bool isComputed() const {
        return cachedValue.has_value();
    }
};

// Simulate expensive computation
int expensiveComputation() {
    std::cout << "Executing expensive computation..." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(1));
    return 42;
}

int main() {
    std::cout << "Creating lazy computation object" << std::endl;
    Lazy<int> lazyValue(expensiveComputation);

    std::cout << "Lazy object created, but computation not yet executed" << std::endl;
    std::cout << "Is computed: " << lazyValue.isComputed() << std::endl;

    std::cout << "\nFirst access to value:" << std::endl;
    int value1 = lazyValue.get();
    std::cout << "Value: " << value1 << std::endl;

    std::cout << "\nSecond access to value (using cache):" << std::endl;
    int value2 = lazyValue.get();
    std::cout << "Value: " << value2 << std::endl;

    return 0;
}
```

## Interview Points

### Common Interview Questions

1. **What is a function object? How does it differ from regular functions?**
   - A function object is a class object that overloads `operator()`
   - Can carry state
   - Compiler can inline for optimization
   - Has a unique class type

2. **What are the pros and cons of std::function?**
   - Pros: Type erasure, can store any callable object
   - Cons: Has runtime overhead, may involve heap allocation

3. **How to choose between std::bind and Lambda?**
   - Lambda is usually clearer and has better performance
   - std::bind can be more convenient for complex argument reordering
   - Modern C++ recommends preferring Lambda

4. **What are predicates? What types are there?**
   - Unary predicate: accepts one argument, returns bool
   - Binary predicate: accepts two arguments, returns bool
   - Used for conditional checks and comparisons in STL algorithms

5. **How to avoid common function object pitfalls?**
   - Be aware of reference capture lifetime
   - Understand std::function overhead
   - Properly handle for_each return value
   - Use mutable when state modification is needed

### Code Example Questions

```cpp
// Interview question: Implement a generic filter function object
template<typename Predicate>
class Filter {
private:
    Predicate pred;

public:
    Filter(Predicate p) : pred(std::move(p)) {}

    template<typename Container>
    Container operator()(const Container& input) const {
        Container result;
        std::copy_if(input.begin(), input.end(),
                     std::back_inserter(result), pred);
        return result;
    }
};

// Usage example
int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    Filter evenFilter([](int x) { return x % 2 == 0; });
    auto evens = evenFilter(nums);

    for (int x : evens) std::cout << x << " ";
    std::cout << std::endl;  // 2 4 6 8 10

    return 0;
}
```

## Further Reading

### Official Documentation
- [C++ Reference - Function Objects](https://en.cppreference.com/w/cpp/utility/functional)
- [C++ Reference - std::function](https://en.cppreference.com/w/cpp/utility/functional/function)
- [C++ Reference - std::bind](https://en.cppreference.com/w/cpp/utility/functional/bind)

### Classic Books
- "Effective Modern C++" - Scott Meyers
  - Item 34: Prefer lambdas to std::bind
  - Item 35: Prefer task-based programming to thread-based
- "C++ Templates: The Complete Guide" - David Vandevoorde
- "The C++ Standard Library" - Nicolai Josuttis

### Quality Articles
- [Functors in C++](https://www.geeksforgeeks.org/functors-in-cpp/)
- [C++ Function Objects and Lambdas](https://www.learncpp.com/cpp-tutorial/introduction-to-lambdas-anonymous-functions/)
- [std::function Performance](https://blog.demofox.org/2015/02/25/avoiding-the-performance-hazzards-of-stdfunction/)
