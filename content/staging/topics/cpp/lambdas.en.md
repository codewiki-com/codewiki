---
title: Lambda Expressions
description: Complete guide to C++ lambda expressions, capture lists, closures and functional programming
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++
  - Lambda
  - Closures
  - Functional Programming
status: imported
origin: old/src/content/docs/cpp/lambdas.en.md
divergence: 0.301
issues: []
legacy:
  category: Cpp
  subcategory: Modern C++
  order: 8
  lastUpdated: 2026-01-07
---


## Introduction

Lambda expressions, introduced in C++11 and significantly enhanced in subsequent standards, are anonymous function objects that can be defined inline at the point of use. They provide a concise way to create function objects without explicitly defining a separate class, making code more readable and maintainable, especially when working with algorithms and callbacks.

A lambda expression creates a closure—an unnamed function object capable of capturing variables from the enclosing scope. This powerful feature enables functional programming patterns in C++ while maintaining the language's performance characteristics.

## Basic Lambda Syntax

The general syntax of a lambda expression is:

```cpp
[capture](parameters) specifiers -> return_type { body }
```

Let's break down each component:

- **capture**: Specifies which variables from the enclosing scope are accessible inside the lambda
- **parameters**: The function parameters (optional if empty in C++14+)
- **specifiers**: Optional keywords like `mutable`, `constexpr`, `noexcept`
- **return_type**: The return type (optional—usually deduced automatically)
- **body**: The function body

### Minimal Lambda Examples

```cpp
#include <iostream>

int main() {
    // Simplest lambda: no captures, no parameters
    auto hello = []{ std::cout << "Hello, World!\n"; };
    hello();  // Output: Hello, World!

    // Lambda with parameters
    auto add = [](int a, int b) { return a + b; };
    std::cout << add(3, 4) << "\n";  // Output: 7

    // Lambda with explicit return type
    auto divide = [](double a, double b) -> double {
        if (b == 0) return 0.0;
        return a / b;
    };
    std::cout << divide(10.0, 3.0) << "\n";  // Output: 3.33333

    return 0;
}
```

## Capture Modes

The capture clause is what makes lambdas truly powerful. It determines how the lambda accesses variables from its enclosing scope.

### Capture by Value

When capturing by value, the lambda receives a copy of the variable at the point where the lambda is defined:

```cpp
#include <iostream>

int main() {
    int x = 10;
    int y = 20;

    // Capture x by value
    auto lambda1 = [x]() {
        std::cout << "x = " << x << "\n";
    };

    // Capture all used variables by value (default capture)
    auto lambda2 = [=]() {
        std::cout << "x = " << x << ", y = " << y << "\n";
    };

    x = 100;  // Modify x after lambda definition
    y = 200;

    lambda1();  // Output: x = 10 (captured value, not current)
    lambda2();  // Output: x = 10, y = 20

    return 0;
}
```

### Capture by Reference

Capturing by reference allows the lambda to access and modify the original variable:

```cpp
#include <iostream>

int main() {
    int counter = 0;

    // Capture counter by reference
    auto increment = [&counter]() {
        ++counter;
    };

    // Capture all used variables by reference
    int a = 1, b = 2;
    auto swap_ab = [&]() {
        std::swap(a, b);
    };

    increment();
    increment();
    increment();
    std::cout << "counter = " << counter << "\n";  // Output: 3

    swap_ab();
    std::cout << "a = " << a << ", b = " << b << "\n";  // Output: a = 2, b = 1

    return 0;
}
```

### Mixed Capture Modes

You can combine different capture modes for different variables:

```cpp
#include <iostream>
#include <string>

int main() {
    int value = 42;
    std::string name = "Lambda";
    double factor = 2.5;

    // Capture value by reference, name by value
    auto mixed1 = [&value, name]() {
        value *= 2;  // Can modify (captured by reference)
        // name += "!";  // Error: name is const (captured by value)
        std::cout << name << ": " << value << "\n";
    };

    // Default capture by value, but factor by reference
    auto mixed2 = [=, &factor]() {
        factor = value * 1.5;  // Can modify factor
        std::cout << "New factor: " << factor << "\n";
    };

    // Default capture by reference, but name by value
    auto mixed3 = [&, name]() {
        value = 100;
        std::cout << name << " set value to " << value << "\n";
    };

    mixed1();  // Output: Lambda: 84
    mixed2();  // Output: New factor: 126
    mixed3();  // Output: Lambda set value to 100

    return 0;
}
```

### Init Capture (C++14)

C++14 introduced generalized lambda captures, allowing you to create new variables in the capture clause:

```cpp
#include <iostream>
#include <memory>
#include <string>

int main() {
    // Move a unique_ptr into the lambda
    auto ptr = std::make_unique<int>(42);
    auto lambda1 = [p = std::move(ptr)]() {
        std::cout << "Value: " << *p << "\n";
    };
    // ptr is now nullptr
    lambda1();  // Output: Value: 42

    // Create a new variable in the capture
    int x = 10;
    auto lambda2 = [y = x * 2]() {
        std::cout << "y = " << y << "\n";
    };
    lambda2();  // Output: y = 20

    // Capture with a different name
    std::string longVariableName = "Hello";
    auto lambda3 = [s = longVariableName]() {
        std::cout << s << "\n";
    };
    lambda3();  // Output: Hello

    return 0;
}
```

### Capturing `this`

When used inside a class member function, lambdas can capture the `this` pointer:

```cpp
#include <iostream>
#include <functional>

class Counter {
private:
    int count = 0;

public:
    // Capture this pointer - access members through this
    std::function<void()> getIncrementer() {
        return [this]() {
            ++count;  // Same as ++this->count
        };
    }

    // C++17: Capture *this by value (copy of the object)
    std::function<int()> getCounterCopy() {
        return [*this]() {
            return count;  // Returns copy's count
        };
    }

    // C++20: Explicit this capture with [=, this]
    std::function<void()> getLogger() {
        std::string prefix = "Count";
        return [=, this]() {
            std::cout << prefix << ": " << count << "\n";
        };
    }

    int getCount() const { return count; }
};

int main() {
    Counter c;
    auto inc = c.getIncrementer();

    inc();
    inc();
    inc();

    std::cout << "Count: " << c.getCount() << "\n";  // Output: 3

    return 0;
}
```

## Mutable Lambdas

By default, variables captured by value are const inside the lambda. The `mutable` specifier allows modification:

```cpp
#include <iostream>

int main() {
    int x = 0;

    // Without mutable - x is const inside lambda
    auto immutable = [x]() {
        // x++;  // Error: cannot modify captured variable
        return x;
    };

    // With mutable - can modify the captured copy
    auto mutableLambda = [x]() mutable {
        return ++x;  // OK: modifies the lambda's copy
    };

    std::cout << mutableLambda() << "\n";  // Output: 1
    std::cout << mutableLambda() << "\n";  // Output: 2
    std::cout << mutableLambda() << "\n";  // Output: 3
    std::cout << "Original x: " << x << "\n";  // Output: 0 (unchanged)

    // Practical example: creating a counter
    auto counter = [count = 0]() mutable {
        return ++count;
    };

    for (int i = 0; i < 5; ++i) {
        std::cout << counter() << " ";  // Output: 1 2 3 4 5
    }
    std::cout << "\n";

    return 0;
}
```

## Generic Lambdas (C++14)

C++14 introduced generic lambdas with `auto` parameters, creating function templates implicitly:

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
    // Generic lambda - works with any type
    auto print = [](const auto& value) {
        std::cout << value << "\n";
    };

    print(42);              // int
    print(3.14159);         // double
    print("Hello");         // const char*
    print(std::string("World"));  // std::string

    // Generic lambda with multiple auto parameters
    auto add = [](auto a, auto b) {
        return a + b;
    };

    std::cout << add(1, 2) << "\n";           // int + int = 3
    std::cout << add(1.5, 2.5) << "\n";       // double + double = 4.0
    std::cout << add(std::string("Hello, "), "World") << "\n";  // string

    // Generic lambda for containers
    auto printContainer = [](const auto& container) {
        for (const auto& elem : container) {
            std::cout << elem << " ";
        }
        std::cout << "\n";
    };

    std::vector<int> vec = {1, 2, 3, 4, 5};
    printContainer(vec);  // Output: 1 2 3 4 5

    return 0;
}
```

### Template Lambdas (C++20)

C++20 allows explicit template syntax in lambdas:

```cpp
#include <iostream>
#include <concepts>
#include <type_traits>

int main() {
    // Explicit template parameter
    auto getSize = []<typename T>(const std::vector<T>& vec) {
        return vec.size();
    };

    std::vector<int> intVec = {1, 2, 3};
    std::vector<std::string> strVec = {"a", "b"};

    std::cout << getSize(intVec) << "\n";  // Output: 3
    std::cout << getSize(strVec) << "\n";  // Output: 2

    // Template lambda with concepts
    auto addNumbers = []<typename T>(T a, T b)
        requires std::integral<T> || std::floating_point<T>
    {
        return a + b;
    };

    std::cout << addNumbers(1, 2) << "\n";      // OK: integral
    std::cout << addNumbers(1.5, 2.5) << "\n";  // OK: floating point
    // addNumbers("a", "b");  // Error: doesn't satisfy constraints

    // Perfect forwarding in template lambda
    auto forwarder = []<typename... Args>(Args&&... args) {
        return sizeof...(args);
    };

    std::cout << forwarder(1, 2.0, "three") << "\n";  // Output: 3

    return 0;
}
```

## Constexpr Lambdas

Since C++17, lambdas can be used in constant expressions. C++17 made lambdas implicitly constexpr when possible, and C++20 expanded this further:

```cpp
#include <iostream>
#include <array>

int main() {
    // Implicitly constexpr (C++17)
    auto square = [](int n) { return n * n; };

    constexpr int result = square(5);  // Evaluated at compile time
    static_assert(result == 25, "5 squared should be 25");

    // Explicitly constexpr
    auto factorial = [](int n) constexpr {
        int result = 1;
        for (int i = 2; i <= n; ++i) {
            result *= i;
        }
        return result;
    };

    constexpr int fact5 = factorial(5);
    static_assert(fact5 == 120, "5! should be 120");

    // Use in template arguments
    std::array<int, square(3)> arr;  // array of 9 elements
    std::cout << "Array size: " << arr.size() << "\n";  // Output: 9

    // Constexpr lambda with captures (C++17)
    constexpr int base = 10;
    auto addBase = [base](int n) constexpr { return n + base; };

    static_assert(addBase(5) == 15);

    return 0;
}
```

## Lambdas with Standard Algorithms

One of the most common uses for lambdas is with the Standard Template Library algorithms:

### Sorting and Comparison

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

struct Person {
    std::string name;
    int age;
};

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Sort in descending order
    std::sort(numbers.begin(), numbers.end(),
              [](int a, int b) { return a > b; });

    for (int n : numbers) std::cout << n << " ";  // 9 8 7 6 5 4 3 2 1
    std::cout << "\n";

    // Sort custom objects
    std::vector<Person> people = {
        {"Alice", 30}, {"Bob", 25}, {"Charlie", 35}
    };

    // Sort by age
    std::sort(people.begin(), people.end(),
              [](const Person& a, const Person& b) {
                  return a.age < b.age;
              });

    for (const auto& p : people) {
        std::cout << p.name << " (" << p.age << ")\n";
    }
    // Output: Bob (25), Alice (30), Charlie (35)

    return 0;
}
```

### Transformations and Filtering

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Transform: square each element
    std::vector<int> squared(numbers.size());
    std::transform(numbers.begin(), numbers.end(), squared.begin(),
                   [](int n) { return n * n; });

    // Filter: copy only even numbers
    std::vector<int> evens;
    std::copy_if(numbers.begin(), numbers.end(), std::back_inserter(evens),
                 [](int n) { return n % 2 == 0; });

    // Count elements matching a condition
    int countGreaterThan5 = std::count_if(numbers.begin(), numbers.end(),
                                          [](int n) { return n > 5; });

    std::cout << "Count > 5: " << countGreaterThan5 << "\n";  // Output: 5

    // Find first element matching condition
    auto it = std::find_if(numbers.begin(), numbers.end(),
                           [](int n) { return n > 7; });
    if (it != numbers.end()) {
        std::cout << "First > 7: " << *it << "\n";  // Output: 8
    }

    // Accumulate with custom operation
    int product = std::accumulate(numbers.begin(), numbers.end(), 1,
                                  [](int acc, int n) { return acc * n; });
    std::cout << "Product: " << product << "\n";  // Output: 3628800 (10!)

    return 0;
}
```

### For Each and Generation

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // For each with capture
    int sum = 0;
    std::for_each(numbers.begin(), numbers.end(),
                  [&sum](int n) { sum += n; });
    std::cout << "Sum: " << sum << "\n";  // Output: 15

    // Generate sequence
    std::vector<int> sequence(10);
    int current = 0;
    std::generate(sequence.begin(), sequence.end(),
                  [&current]() { return current++; });

    for (int n : sequence) std::cout << n << " ";  // 0 1 2 3 4 5 6 7 8 9
    std::cout << "\n";

    // Generate Fibonacci sequence
    std::vector<int> fibonacci(10);
    int a = 0, b = 1;
    std::generate(fibonacci.begin(), fibonacci.end(),
                  [&a, &b]() {
                      int result = a;
                      int next = a + b;
                      a = b;
                      b = next;
                      return result;
                  });

    for (int n : fibonacci) std::cout << n << " ";  // 0 1 1 2 3 5 8 13 21 34
    std::cout << "\n";

    return 0;
}
```

## Storing and Passing Lambdas

### Using std::function

`std::function` provides a type-erased wrapper for storing lambdas:

```cpp
#include <iostream>
#include <functional>
#include <vector>

class EventHandler {
private:
    std::vector<std::function<void(int)>> callbacks;

public:
    void addCallback(std::function<void(int)> cb) {
        callbacks.push_back(std::move(cb));
    }

    void trigger(int value) {
        for (const auto& cb : callbacks) {
            cb(value);
        }
    }
};

int main() {
    // Store lambda in std::function
    std::function<int(int, int)> operation;

    operation = [](int a, int b) { return a + b; };
    std::cout << "Add: " << operation(3, 4) << "\n";  // Output: 7

    operation = [](int a, int b) { return a * b; };
    std::cout << "Multiply: " << operation(3, 4) << "\n";  // Output: 12

    // Event handler example
    EventHandler handler;

    handler.addCallback([](int x) {
        std::cout << "Callback 1: " << x << "\n";
    });

    int multiplier = 2;
    handler.addCallback([multiplier](int x) {
        std::cout << "Callback 2: " << x * multiplier << "\n";
    });

    handler.trigger(5);
    // Output:
    // Callback 1: 5
    // Callback 2: 10

    return 0;
}
```

### Using Templates (Zero Overhead)

For maximum performance, use templates to avoid the overhead of `std::function`:

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// Template function accepting any callable
template<typename Func>
void repeat(int times, Func&& func) {
    for (int i = 0; i < times; ++i) {
        func(i);
    }
}

// Return lambda from template function
template<typename T>
auto makeMultiplier(T factor) {
    return [factor](T value) { return value * factor; };
}

// Higher-order function returning a lambda
auto compose(auto f, auto g) {
    return [f, g](auto x) { return f(g(x)); };
}

int main() {
    // Using template function with lambda
    repeat(3, [](int i) {
        std::cout << "Iteration " << i << "\n";
    });

    // Using factory function
    auto triple = makeMultiplier(3);
    auto doubler = makeMultiplier(2.0);

    std::cout << triple(5) << "\n";     // Output: 15
    std::cout << doubler(3.5) << "\n";  // Output: 7.0

    // Function composition
    auto addOne = [](int x) { return x + 1; };
    auto square = [](int x) { return x * x; };

    auto addOneThenSquare = compose(square, addOne);
    std::cout << addOneThenSquare(4) << "\n";  // (4+1)^2 = 25

    return 0;
}
```

## Immediately Invoked Lambda Expressions (IIFE)

Lambdas can be invoked immediately at the point of definition:

```cpp
#include <iostream>
#include <vector>

int main() {
    // IIFE for complex initialization
    const int value = []{
        int result = 0;
        for (int i = 1; i <= 10; ++i) {
            result += i;
        }
        return result;
    }();  // Note the () to invoke immediately

    std::cout << "Value: " << value << "\n";  // Output: 55

    // IIFE with parameters
    const std::vector<int> squares = [](int n) {
        std::vector<int> result;
        result.reserve(n);
        for (int i = 1; i <= n; ++i) {
            result.push_back(i * i);
        }
        return result;
    }(5);

    for (int s : squares) std::cout << s << " ";  // 1 4 9 16 25
    std::cout << "\n";

    // IIFE for conditional complex initialization
    const std::string message = [](bool condition) {
        if (condition) {
            return std::string("Condition is true");
        } else {
            return std::string("Condition is false");
        }
    }(true);

    std::cout << message << "\n";

    return 0;
}
```

## Recursive Lambdas

Lambdas can call themselves recursively, though it requires some extra setup:

```cpp
#include <iostream>
#include <functional>

int main() {
    // Using std::function for recursion
    std::function<int(int)> factorial = [&factorial](int n) -> int {
        return n <= 1 ? 1 : n * factorial(n - 1);
    };

    std::cout << "5! = " << factorial(5) << "\n";  // Output: 120

    // C++14: Using generic lambda for recursion (Y-combinator style)
    auto factorial2 = [](auto&& self, int n) -> int {
        return n <= 1 ? 1 : n * self(self, n - 1);
    };

    std::cout << "6! = " << factorial2(factorial2, 6) << "\n";  // Output: 720

    // Cleaner wrapper
    auto fact = [&factorial2](int n) {
        return factorial2(factorial2, n);
    };

    std::cout << "7! = " << fact(7) << "\n";  // Output: 5040

    // C++23 deducing this (preview)
    // auto factorial3 = [](this auto&& self, int n) -> int {
    //     return n <= 1 ? 1 : n * self(n - 1);
    // };

    return 0;
}
```

## Practical Examples

### Callback Pattern

```cpp
#include <iostream>
#include <functional>
#include <chrono>
#include <thread>

class Timer {
public:
    template<typename Callback>
    void setTimeout(int milliseconds, Callback&& callback) {
        std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
        callback();
    }

    template<typename Callback>
    void measureTime(Callback&& callback) {
        auto start = std::chrono::high_resolution_clock::now();
        callback();
        auto end = std::chrono::high_resolution_clock::now();

        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - start);
        std::cout << "Execution time: " << duration.count() << " microseconds\n";
    }
};

int main() {
    Timer timer;

    // Timeout callback
    std::cout << "Starting timer...\n";
    timer.setTimeout(100, []{
        std::cout << "Timer fired!\n";
    });

    // Measure execution time
    timer.measureTime([]{
        long sum = 0;
        for (int i = 0; i < 1000000; ++i) {
            sum += i;
        }
        std::cout << "Sum: " << sum << "\n";
    });

    return 0;
}
```

### Custom Deleter for Smart Pointers

```cpp
#include <iostream>
#include <memory>
#include <cstdio>

int main() {
    // Custom deleter for FILE*
    auto fileDeleter = [](FILE* f) {
        if (f) {
            std::cout << "Closing file...\n";
            fclose(f);
        }
    };

    {
        std::unique_ptr<FILE, decltype(fileDeleter)> file(
            fopen("test.txt", "w"), fileDeleter);

        if (file) {
            fputs("Hello, World!", file.get());
        }
    }  // File automatically closed here

    // Array with custom deleter
    auto arrayDeleter = [](int* p) {
        std::cout << "Deleting array...\n";
        delete[] p;
    };

    std::unique_ptr<int[], decltype(arrayDeleter)> arr(
        new int[10], arrayDeleter);

    return 0;
}
```

### Strategy Pattern

```cpp
#include <iostream>
#include <functional>
#include <map>
#include <string>

class Calculator {
private:
    std::map<std::string, std::function<double(double, double)>> operations;

public:
    Calculator() {
        operations["add"] = [](double a, double b) { return a + b; };
        operations["subtract"] = [](double a, double b) { return a - b; };
        operations["multiply"] = [](double a, double b) { return a * b; };
        operations["divide"] = [](double a, double b) {
            return b != 0 ? a / b : 0;
        };
    }

    void addOperation(const std::string& name,
                      std::function<double(double, double)> op) {
        operations[name] = std::move(op);
    }

    double calculate(const std::string& operation, double a, double b) {
        auto it = operations.find(operation);
        if (it != operations.end()) {
            return it->second(a, b);
        }
        throw std::runtime_error("Unknown operation: " + operation);
    }
};

int main() {
    Calculator calc;

    // Use built-in operations
    std::cout << "10 + 5 = " << calc.calculate("add", 10, 5) << "\n";
    std::cout << "10 - 5 = " << calc.calculate("subtract", 10, 5) << "\n";

    // Add custom operation
    calc.addOperation("power", [](double base, double exp) {
        return std::pow(base, exp);
    });

    std::cout << "2 ^ 8 = " << calc.calculate("power", 2, 8) << "\n";

    return 0;
}
```

## Best Practices

### Prefer Capture by Reference for Large Objects

```cpp
// Good: capture large object by reference
std::vector<int> largeVector(10000);
auto lambda = [&largeVector]() { /* use largeVector */ };

// Avoid: unnecessary copy of large object
auto badLambda = [largeVector]() { /* use copy */ };
```

### Be Careful with Dangling References

```cpp
std::function<int()> createBadLambda() {
    int localValue = 42;
    // DANGER: localValue will be destroyed when function returns
    return [&localValue]() { return localValue; };  // Undefined behavior!
}

std::function<int()> createGoodLambda() {
    int localValue = 42;
    // Safe: capture by value
    return [localValue]() { return localValue; };
}
```

### Use Auto for Lambda Types

```cpp
// Good: use auto
auto lambda = [](int x) { return x * 2; };

// Unnecessary: std::function adds overhead
std::function<int(int)> lambda2 = [](int x) { return x * 2; };
```

### Prefer Lambdas Over std::bind

```cpp
#include <functional>

void process(int a, int b, int c) { /* ... */ }

// Prefer lambda
auto lambda = [](int x) { process(x, 10, 20); };

// Avoid std::bind - less readable
auto bound = std::bind(process, std::placeholders::_1, 10, 20);
```

### Use Init Capture for Move-Only Types

```cpp
auto ptr = std::make_unique<int>(42);

// Correct: move into lambda
auto lambda = [p = std::move(ptr)]() {
    return *p;
};
```

## Summary

Lambda expressions are a cornerstone of modern C++ programming, enabling:

- **Inline function definitions** at the point of use
- **Closure semantics** through flexible capture mechanisms
- **Functional programming patterns** with higher-order functions
- **Seamless integration** with STL algorithms
- **Template-like behavior** with generic lambdas

Key points to remember:

| Feature | Syntax | Version |
|---------|--------|---------|
| Basic lambda | `[](){}` | C++11 |
| Capture by value | `[x]` or `[=]` | C++11 |
| Capture by reference | `[&x]` or `[&]` | C++11 |
| Init capture | `[x = expr]` | C++14 |
| Generic lambda | `[](auto x)` | C++14 |
| Constexpr lambda | `[]() constexpr` | C++17 |
| Capture `*this` | `[*this]` | C++17 |
| Template lambda | `[]<typename T>()` | C++20 |

By mastering lambda expressions, you can write more expressive, maintainable, and efficient C++ code that embraces modern functional programming techniques while retaining C++'s performance characteristics.
