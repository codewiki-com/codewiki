---
title: C++ Template Programming
description: "Master C++ templates: function templates, class templates, specialization and metaprogramming"
track: cpp
section: templates-generic
difficulty: advanced
tags:
  - C++
  - Templates
  - Generics
  - Metaprogramming
status: imported
origin: old/src/content/docs/cpp/templates.en.md
divergence: 0.256
issues: []
legacy:
  category: Cpp
  subcategory: Templates
  order: 4
  lastUpdated: 2026-01-07
---

Templates are one of C++'s most powerful features, enabling generic programming and compile-time computation. They allow you to write code that works with any data type while maintaining type safety and performance.

## Introduction to Templates

Templates enable **parametric polymorphism** - writing code that can operate on different types without sacrificing type safety. The compiler generates specific code for each type used with the template, resulting in zero runtime overhead.

### Key Benefits

- **Type Safety**: Compile-time type checking prevents type errors
- **Code Reuse**: Write once, use with multiple types
- **Performance**: No runtime overhead, fully optimized code
- **Compile-Time Computation**: Execute complex logic at compile time

## Function Templates

Function templates allow you to define functions that work with generic types.

### Basic Function Template

```cpp
#include <iostream>
#include <string>

// Simple function template
template <typename T>
T max(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    std::cout << max(10, 20) << std::endl;           // int version
    std::cout << max(3.14, 2.71) << std::endl;       // double version
    std::cout << max('a', 'z') << std::endl;         // char version

    std::string s1 = "hello", s2 = "world";
    std::cout << max(s1, s2) << std::endl;           // string version

    return 0;
}
```

### Multiple Template Parameters

```cpp
template <typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}

// C++14 and later: auto return type deduction
template <typename T, typename U>
auto multiply(T a, U b) {
    return a * b;
}

int main() {
    auto result1 = add(5, 3.14);        // int + double -> double
    auto result2 = multiply(2, 4.5);    // int * double -> double

    std::cout << result1 << ", " << result2 << std::endl;
    return 0;
}
```

### Non-Type Template Parameters

```cpp
#include <array>
#include <iostream>

// Template with non-type parameter
template <typename T, size_t N>
void printArray(const std::array<T, N>& arr) {
    for (const auto& elem : arr) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;
}

template <int N>
constexpr int factorial() {
    if constexpr (N <= 1) {
        return 1;
    } else {
        return N * factorial<N - 1>();
    }
}

int main() {
    std::array<int, 5> numbers = {1, 2, 3, 4, 5};
    printArray(numbers);

    // Computed at compile time
    constexpr int fact5 = factorial<5>();
    std::cout << "5! = " << fact5 << std::endl;

    return 0;
}
```

### Template Argument Deduction

```cpp
#include <vector>
#include <iostream>

template <typename T>
void printVector(const std::vector<T>& vec) {
    for (const auto& elem : vec) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;
}

// Explicit template argument specification
template <typename T>
T convert(const std::string& str);

template <>
int convert<int>(const std::string& str) {
    return std::stoi(str);
}

template <>
double convert<double>(const std::string& str) {
    return std::stod(str);
}

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};
    printVector(nums);  // T deduced as int

    // Explicit template argument
    int num = convert<int>("42");
    double pi = convert<double>("3.14159");

    std::cout << num << ", " << pi << std::endl;

    return 0;
}
```

## Class Templates

Class templates allow you to create generic classes that work with any type.

### Basic Class Template

```cpp
#include <iostream>
#include <stdexcept>

template <typename T>
class Stack {
private:
    T* data;
    size_t capacity;
    size_t top;

    void resize() {
        capacity *= 2;
        T* newData = new T[capacity];
        for (size_t i = 0; i < top; ++i) {
            newData[i] = data[i];
        }
        delete[] data;
        data = newData;
    }

public:
    Stack(size_t initialCapacity = 10)
        : capacity(initialCapacity), top(0) {
        data = new T[capacity];
    }

    ~Stack() {
        delete[] data;
    }

    void push(const T& value) {
        if (top == capacity) {
            resize();
        }
        data[top++] = value;
    }

    T pop() {
        if (empty()) {
            throw std::runtime_error("Stack is empty");
        }
        return data[--top];
    }

    const T& peek() const {
        if (empty()) {
            throw std::runtime_error("Stack is empty");
        }
        return data[top - 1];
    }

    bool empty() const {
        return top == 0;
    }

    size_t size() const {
        return top;
    }
};

int main() {
    Stack<int> intStack;
    intStack.push(10);
    intStack.push(20);
    intStack.push(30);

    std::cout << "Top: " << intStack.peek() << std::endl;
    std::cout << "Size: " << intStack.size() << std::endl;

    Stack<std::string> strStack;
    strStack.push("Hello");
    strStack.push("World");

    std::cout << strStack.pop() << " " << strStack.pop() << std::endl;

    return 0;
}
```

### Template Member Functions

```cpp
#include <iostream>
#include <memory>

template <typename T>
class Container {
private:
    std::unique_ptr<T[]> data;
    size_t sz;

public:
    Container(size_t size) : sz(size) {
        data = std::make_unique<T[]>(size);
    }

    // Template member function
    template <typename U>
    void fill(const U& value) {
        for (size_t i = 0; i < sz; ++i) {
            data[i] = static_cast<T>(value);
        }
    }

    // Another template member function
    template <typename Func>
    void transform(Func func) {
        for (size_t i = 0; i < sz; ++i) {
            data[i] = func(data[i]);
        }
    }

    T& operator[](size_t index) {
        return data[index];
    }

    const T& operator[](size_t index) const {
        return data[index];
    }

    size_t size() const { return sz; }
};

int main() {
    Container<double> cont(5);
    cont.fill(3.14);  // U deduced as double

    cont.transform([](double x) { return x * 2; });

    for (size_t i = 0; i < cont.size(); ++i) {
        std::cout << cont[i] << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### Template Template Parameters

```cpp
#include <vector>
#include <list>
#include <deque>
#include <iostream>

// Template template parameter
template <typename T, template <typename, typename> class Container>
class Wrapper {
private:
    Container<T, std::allocator<T>> data;

public:
    void add(const T& value) {
        data.push_back(value);
    }

    void print() const {
        for (const auto& elem : data) {
            std::cout << elem << " ";
        }
        std::cout << std::endl;
    }
};

int main() {
    Wrapper<int, std::vector> vecWrapper;
    vecWrapper.add(1);
    vecWrapper.add(2);
    vecWrapper.add(3);
    vecWrapper.print();

    Wrapper<double, std::list> listWrapper;
    listWrapper.add(1.1);
    listWrapper.add(2.2);
    listWrapper.add(3.3);
    listWrapper.print();

    return 0;
}
```

## Template Specialization

Template specialization allows you to provide custom implementations for specific types.

### Full Specialization

```cpp
#include <iostream>
#include <cstring>

// Primary template
template <typename T>
class Printer {
public:
    void print(const T& value) {
        std::cout << "Generic: " << value << std::endl;
    }
};

// Full specialization for const char*
template <>
class Printer<const char*> {
public:
    void print(const char* value) {
        std::cout << "String: \"" << value << "\" (length: "
                  << strlen(value) << ")" << std::endl;
    }
};

// Full specialization for bool
template <>
class Printer<bool> {
public:
    void print(bool value) {
        std::cout << "Boolean: " << (value ? "true" : "false") << std::endl;
    }
};

int main() {
    Printer<int> intPrinter;
    intPrinter.print(42);

    Printer<const char*> strPrinter;
    strPrinter.print("Hello, World!");

    Printer<bool> boolPrinter;
    boolPrinter.print(true);

    return 0;
}
```

### Partial Specialization

```cpp
#include <iostream>
#include <memory>

// Primary template
template <typename T, typename U>
class Pair {
public:
    T first;
    U second;

    void print() const {
        std::cout << "Generic Pair: (" << first << ", " << second << ")" << std::endl;
    }
};

// Partial specialization: both types are the same
template <typename T>
class Pair<T, T> {
public:
    T first;
    T second;

    void print() const {
        std::cout << "Same Type Pair: (" << first << ", " << second << ")" << std::endl;
    }

    bool equal() const {
        return first == second;
    }
};

// Partial specialization: pointers
template <typename T, typename U>
class Pair<T*, U*> {
public:
    T* first;
    U* second;

    void print() const {
        std::cout << "Pointer Pair: ("
                  << (first ? *first : 0) << ", "
                  << (second ? *second : 0) << ")" << std::endl;
    }
};

int main() {
    Pair<int, double> p1{10, 3.14};
    p1.print();

    Pair<int, int> p2{5, 10};
    p2.print();
    std::cout << "Equal: " << p2.equal() << std::endl;

    int x = 42, y = 99;
    Pair<int*, int*> p3{&x, &y};
    p3.print();

    return 0;
}
```

### Function Template Specialization

```cpp
#include <iostream>
#include <cmath>
#include <type_traits>

// Primary template
template <typename T>
bool isEqual(T a, T b) {
    return a == b;
}

// Specialization for floating-point comparison
template <>
bool isEqual<double>(double a, double b) {
    const double epsilon = 1e-9;
    return std::fabs(a - b) < epsilon;
}

template <>
bool isEqual<float>(float a, float b) {
    const float epsilon = 1e-6f;
    return std::fabs(a - b) < epsilon;
}

// Specialization for C-strings
template <>
bool isEqual<const char*>(const char* a, const char* b) {
    return strcmp(a, b) == 0;
}

int main() {
    std::cout << isEqual(10, 10) << std::endl;                    // true
    std::cout << isEqual(3.14159, 3.14159001) << std::endl;       // true (within epsilon)
    std::cout << isEqual("hello", "hello") << std::endl;          // true
    std::cout << isEqual("hello", "world") << std::endl;          // false

    return 0;
}
```

## Variadic Templates

Variadic templates allow functions and classes to accept an arbitrary number of template arguments.

### Variadic Function Templates

```cpp
#include <iostream>

// Base case: no arguments
void print() {
    std::cout << std::endl;
}

// Recursive case: at least one argument
template <typename T, typename... Args>
void print(T first, Args... rest) {
    std::cout << first;
    if constexpr (sizeof...(rest) > 0) {
        std::cout << ", ";
    }
    print(rest...);
}

// Sum function using fold expressions (C++17)
template <typename... Args>
auto sum(Args... args) {
    return (args + ...);
}

// Count arguments
template <typename... Args>
constexpr size_t countArgs(Args... args) {
    return sizeof...(args);
}

int main() {
    print(1, 2.5, "hello", 'x', true);

    std::cout << "Sum: " << sum(1, 2, 3, 4, 5) << std::endl;
    std::cout << "Count: " << countArgs(1, 2, 3, 4, 5, 6) << std::endl;

    return 0;
}
```

### Variadic Class Templates

```cpp
#include <iostream>
#include <tuple>

// Simple tuple-like structure
template <typename... Types>
class Tuple;

// Specialization for empty tuple
template <>
class Tuple<> {
public:
    static constexpr size_t size() { return 0; }
};

// Recursive definition
template <typename Head, typename... Tail>
class Tuple<Head, Tail...> : private Tuple<Tail...> {
private:
    Head head;
    using Base = Tuple<Tail...>;

public:
    Tuple(Head h, Tail... t) : Base(t...), head(h) {}

    static constexpr size_t size() { return 1 + Base::size(); }

    Head& getHead() { return head; }
    const Head& getHead() const { return head; }

    Base& getTail() { return *this; }
    const Base& getTail() const { return *this; }
};

// Perfect forwarding with variadic templates
template <typename... Args>
void forwardExample(Args&&... args) {
    // Forward all arguments to another function
    print(std::forward<Args>(args)...);
}

// Apply a function to all arguments
template <typename Func, typename... Args>
void forEach(Func func, Args&&... args) {
    (func(std::forward<Args>(args)), ...);  // C++17 fold expression
}

int main() {
    Tuple<int, double, const char*> t(42, 3.14, "hello");
    std::cout << "Size: " << t.size() << std::endl;
    std::cout << "Head: " << t.getHead() << std::endl;

    forEach([](auto x) { std::cout << x << " "; }, 1, 2.5, "test", 'x');
    std::cout << std::endl;

    return 0;
}
```

### Fold Expressions (C++17)

```cpp
#include <iostream>
#include <vector>

// Unary right fold: (args op ...)
template <typename... Args>
auto sumRight(Args... args) {
    return (args + ...);
}

// Unary left fold: (... op args)
auto sumLeft(Args... args) {
    return (... + args);
}

// Binary fold with initial value
template <typename... Args>
auto sumWithInit(Args... args) {
    return (0 + ... + args);
}

// Logical operations
template <typename... Args>
bool allTrue(Args... args) {
    return (args && ...);
}

template <typename... Args>
bool anyTrue(Args... args) {
    return (args || ...);
}

// Push back multiple elements
template <typename T, typename... Args>
void pushBack(std::vector<T>& vec, Args&&... args) {
    (vec.push_back(std::forward<Args>(args)), ...);
}

// Print with separator
template <typename... Args>
void printWithComma(Args... args) {
    bool first = true;
    ((std::cout << (first ? "" : ", ") << args, first = false), ...);
    std::cout << std::endl;
}

int main() {
    std::cout << "Sum: " << sumRight(1, 2, 3, 4, 5) << std::endl;
    std::cout << "All true: " << allTrue(true, true, false) << std::endl;
    std::cout << "Any true: " << anyTrue(false, false, true) << std::endl;

    std::vector<int> vec;
    pushBack(vec, 1, 2, 3, 4, 5);

    printWithComma(1, 2.5, "hello", 'x');

    return 0;
}
```

## SFINAE

SFINAE (Substitution Failure Is Not An Error) is a principle that allows template specialization based on type properties.

### Basic SFINAE

```cpp
#include <iostream>
#include <type_traits>

// Enable if T is integral
template <typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
increment(T value) {
    std::cout << "Integral version" << std::endl;
    return value + 1;
}

// Enable if T is floating-point
template <typename T>
typename std::enable_if<std::is_floating_point<T>::value, T>::type
increment(T value) {
    std::cout << "Floating-point version" << std::endl;
    return value + 0.1;
}

// C++14: More concise with std::enable_if_t
template <typename T>
std::enable_if_t<std::is_integral_v<T>, void>
process(T value) {
    std::cout << "Processing integer: " << value << std::endl;
}

template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, void>
process(T value) {
    std::cout << "Processing float: " << value << std::endl;
}

int main() {
    std::cout << increment(5) << std::endl;      // Calls integral version
    std::cout << increment(3.14) << std::endl;   // Calls floating-point version

    process(42);
    process(3.14159);

    return 0;
}
```

### SFINAE with Type Traits

```cpp
#include <iostream>
#include <vector>
#include <type_traits>

// Check if type has begin() method
template <typename T, typename = void>
struct has_begin : std::false_type {};

template <typename T>
struct has_begin<T, std::void_t<decltype(std::declval<T>().begin())>>
    : std::true_type {};

// Print for containers
template <typename T>
std::enable_if_t<has_begin<T>::value, void>
printContainer(const T& container) {
    std::cout << "Container: ";
    for (const auto& elem : container) {
        std::cout << elem << " ";
    }
    std::cout << std::endl;
}

// Print for non-containers
template <typename T>
std::enable_if_t<!has_begin<T>::value, void>
printContainer(const T& value) {
    std::cout << "Single value: " << value << std::endl;
}

// Check if type is callable
template <typename T, typename... Args>
struct is_callable {
private:
    template <typename U>
    static auto test(U* p) -> decltype((*p)(std::declval<Args>()...), std::true_type());

    template <typename>
    static std::false_type test(...);

public:
    static constexpr bool value = decltype(test<T>(nullptr))::value;
};

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    printContainer(vec);
    printContainer(42);

    auto lambda = [](int x) { return x * 2; };
    std::cout << "Is callable: " << is_callable<decltype(lambda), int>::value << std::endl;

    return 0;
}
```

### SFINAE for Function Overloading

```cpp
#include <iostream>
#include <type_traits>
#include <iterator>

// Version for random access iterators
template <typename Iter>
std::enable_if_t<
    std::is_same_v<
        typename std::iterator_traits<Iter>::iterator_category,
        std::random_access_iterator_tag
    >,
    typename std::iterator_traits<Iter>::difference_type
>
distance(Iter first, Iter last) {
    std::cout << "Random access version (O(1))" << std::endl;
    return last - first;
}

// Version for other iterators
template <typename Iter>
std::enable_if_t<
    !std::is_same_v<
        typename std::iterator_traits<Iter>::iterator_category,
        std::random_access_iterator_tag
    >,
    typename std::iterator_traits<Iter>::difference_type
>
distance(Iter first, Iter last) {
    std::cout << "Generic version (O(n))" << std::endl;
    typename std::iterator_traits<Iter>::difference_type count = 0;
    while (first != last) {
        ++first;
        ++count;
    }
    return count;
}

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::list<int> lst = {1, 2, 3, 4, 5};

    std::cout << "Vector distance: " << distance(vec.begin(), vec.end()) << std::endl;
    std::cout << "List distance: " << distance(lst.begin(), lst.end()) << std::endl;

    return 0;
}
```

## C++20 Concepts

Concepts provide a cleaner and more expressive way to constrain templates compared to SFINAE.

### Basic Concepts

```cpp
#include <iostream>
#include <concepts>
#include <string>

// Define custom concepts
template <typename T>
concept Numeric = std::is_arithmetic_v<T>;

template <typename T>
concept Printable = requires(T t) {
    { std::cout << t } -> std::convertible_to<std::ostream&>;
};

// Use concepts to constrain templates
template <Numeric T>
T square(T value) {
    return value * value;
}

template <Printable T>
void print(const T& value) {
    std::cout << value << std::endl;
}

// Multiple constraints
template <typename T>
concept Incrementable = requires(T t) {
    { ++t } -> std::same_as<T&>;
    { t++ } -> std::same_as<T>;
};

template <Numeric T> requires Incrementable<T>
T increment(T value) {
    return ++value;
}

int main() {
    std::cout << square(5) << std::endl;        // OK
    std::cout << square(3.14) << std::endl;     // OK
    // std::cout << square("test") << std::endl; // Error: doesn't satisfy Numeric

    print(42);
    print("Hello");
    print(3.14);

    std::cout << increment(10) << std::endl;

    return 0;
}
```

### Standard Concepts

```cpp
#include <iostream>
#include <concepts>
#include <vector>
#include <algorithm>

// Using standard concepts
template <std::integral T>
T gcd(T a, T b) {
    while (b != 0) {
        T temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

template <std::floating_point T>
T average(const std::vector<T>& values) {
    T sum = 0;
    for (const auto& val : values) {
        sum += val;
    }
    return sum / values.size();
}

// Container concepts
template <typename T>
concept Container = requires(T t) {
    typename T::value_type;
    typename T::iterator;
    { t.begin() } -> std::same_as<typename T::iterator>;
    { t.end() } -> std::same_as<typename T::iterator>;
    { t.size() } -> std::convertible_to<std::size_t>;
};

template <Container C>
void printSize(const C& container) {
    std::cout << "Size: " << container.size() << std::endl;
}

// Callable concept
template <typename Func, typename... Args>
concept Callable = requires(Func f, Args... args) {
    { f(args...) };
};

template <typename T, Callable<T> Func>
void applyToVector(std::vector<T>& vec, Func func) {
    for (auto& elem : vec) {
        func(elem);
    }
}

int main() {
    std::cout << "GCD: " << gcd(48, 18) << std::endl;

    std::vector<double> values = {1.0, 2.0, 3.0, 4.0, 5.0};
    std::cout << "Average: " << average(values) << std::endl;

    printSize(values);

    std::vector<int> nums = {1, 2, 3, 4, 5};
    applyToVector(nums, [](int& x) { x *= 2; });

    return 0;
}
```

### Concept Composition

```cpp
#include <iostream>
#include <concepts>
#include <iterator>

// Compose concepts
template <typename T>
concept Sortable = std::totally_ordered<T> && std::copyable<T>;

template <typename T>
concept NumericSortable = Sortable<T> && std::is_arithmetic_v<T>;

template <Sortable T>
void bubbleSort(T* arr, size_t size) {
    for (size_t i = 0; i < size - 1; ++i) {
        for (size_t j = 0; j < size - i - 1; ++j) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
            }
        }
    }
}

// Concept for iterators
template <typename Iter>
concept ForwardIterator = requires(Iter it) {
    { ++it } -> std::same_as<Iter&>;
    { *it };
    { it == it } -> std::convertible_to<bool>;
    { it != it } -> std::convertible_to<bool>;
};

template <ForwardIterator Iter>
void advance(Iter& it, size_t n) {
    for (size_t i = 0; i < n; ++i) {
        ++it;
    }
}

int main() {
    int arr[] = {5, 2, 8, 1, 9};
    bubbleSort(arr, 5);

    for (int x : arr) {
        std::cout << x << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### Requires Clauses

```cpp
#include <iostream>
#include <concepts>

// Requires clause at the end
template <typename T>
T add(T a, T b) requires std::is_arithmetic_v<T> {
    return a + b;
}

// Requires expression inline
template <typename T>
void process(T value) requires requires { value.process(); } {
    value.process();
}

// Multiple requirements
template <typename T, typename U>
auto multiply(T a, U b)
    requires std::is_arithmetic_v<T> && std::is_arithmetic_v<U>
{
    return a * b;
}

// Complex requires expression
template <typename T>
concept HasPushPop = requires(T t, typename T::value_type v) {
    { t.push(v) } -> std::same_as<void>;
    { t.pop() } -> std::same_as<typename T::value_type>;
    { t.empty() } -> std::convertible_to<bool>;
};

template <HasPushPop T>
void useStack(T& stack) {
    if (!stack.empty()) {
        auto value = stack.pop();
        std::cout << "Popped: " << value << std::endl;
    }
}

int main() {
    std::cout << add(5, 10) << std::endl;
    std::cout << multiply(3, 4.5) << std::endl;

    return 0;
}
```

## Template Metaprogramming

Template metaprogramming allows computation at compile time using templates.

### Compile-Time Computation

```cpp
#include <iostream>

// Factorial at compile time
template <int N>
struct Factorial {
    static constexpr int value = N * Factorial<N - 1>::value;
};

template <>
struct Factorial<0> {
    static constexpr int value = 1;
};

// Fibonacci at compile time
template <int N>
struct Fibonacci {
    static constexpr int value = Fibonacci<N - 1>::value + Fibonacci<N - 2>::value;
};

template <>
struct Fibonacci<0> {
    static constexpr int value = 0;
};

template <>
struct Fibonacci<1> {
    static constexpr int value = 1;
};

// Check if number is prime at compile time
template <int N, int D = N - 1>
struct IsPrime {
    static constexpr bool value = (N % D != 0) && IsPrime<N, D - 1>::value;
};

template <int N>
struct IsPrime<N, 1> {
    static constexpr bool value = true;
};

template <>
struct IsPrime<1, 0> {
    static constexpr bool value = false;
};

int main() {
    std::cout << "5! = " << Factorial<5>::value << std::endl;
    std::cout << "Fib(10) = " << Fibonacci<10>::value << std::endl;
    std::cout << "Is 17 prime? " << IsPrime<17>::value << std::endl;
    std::cout << "Is 20 prime? " << IsPrime<20>::value << std::endl;

    return 0;
}
```

### Type Manipulation

```cpp
#include <iostream>
#include <type_traits>

// Remove all pointers
template <typename T>
struct RemoveAllPointers {
    using type = T;
};

template <typename T>
struct RemoveAllPointers<T*> {
    using type = typename RemoveAllPointers<T>::type;
};

template <typename T>
using RemoveAllPointers_t = typename RemoveAllPointers<T>::type;

// Add const to pointer target
template <typename T>
struct AddConstToPointer {
    using type = T;
};

template <typename T>
struct AddConstToPointer<T*> {
    using type = const T*;
};

// Check if types are same ignoring cv-qualifiers
template <typename T, typename U>
struct IsSameIgnoreCV : std::is_same<
    typename std::remove_cv<T>::type,
    typename std::remove_cv<U>::type
> {};

// Get larger type
template <typename T, typename U>
struct Larger {
    using type = typename std::conditional<
        (sizeof(T) > sizeof(U)),
        T,
        U
    >::type;
};

template <typename T, typename U>
using Larger_t = typename Larger<T, U>::type;

int main() {
    using Type1 = RemoveAllPointers_t<int***>;  // int
    using Type2 = AddConstToPointer<int*>::type; // const int*
    using Type3 = Larger_t<int, long long>;      // long long

    std::cout << std::is_same_v<Type1, int> << std::endl;
    std::cout << std::is_same_v<Type2, const int*> << std::endl;
    std::cout << std::is_same_v<Type3, long long> << std::endl;

    return 0;
}
```

### Type Lists

```cpp
#include <iostream>
#include <type_traits>

// Type list
template <typename... Types>
struct TypeList {};

// Get size of type list
template <typename List>
struct Length;

template <typename... Types>
struct Length<TypeList<Types...>> {
    static constexpr size_t value = sizeof...(Types);
};

// Get element at index
template <size_t Index, typename List>
struct TypeAt;

template <typename Head, typename... Tail>
struct TypeAt<0, TypeList<Head, Tail...>> {
    using type = Head;
};

template <size_t Index, typename Head, typename... Tail>
struct TypeAt<Index, TypeList<Head, Tail...>> {
    using type = typename TypeAt<Index - 1, TypeList<Tail...>>::type;
};

template <size_t Index, typename List>
using TypeAt_t = typename TypeAt<Index, List>::type;

// Append type to list
template <typename List, typename T>
struct Append;

template <typename... Types, typename T>
struct Append<TypeList<Types...>, T> {
    using type = TypeList<Types..., T>;
};

// Check if list contains type
template <typename List, typename T>
struct Contains;

template <typename T>
struct Contains<TypeList<>, T> : std::false_type {};

template <typename T, typename... Tail>
struct Contains<TypeList<T, Tail...>, T> : std::true_type {};

template <typename Head, typename... Tail, typename T>
struct Contains<TypeList<Head, Tail...>, T> : Contains<TypeList<Tail...>, T> {};

int main() {
    using MyList = TypeList<int, double, char, float>;

    std::cout << "Length: " << Length<MyList>::value << std::endl;
    std::cout << "Contains double: " << Contains<MyList, double>::value << std::endl;
    std::cout << "Contains string: " << Contains<MyList, std::string>::value << std::endl;

    using SecondType = TypeAt_t<1, MyList>;  // double
    std::cout << "Second type is double: "
              << std::is_same_v<SecondType, double> << std::endl;

    return 0;
}
```

### Compile-Time String Manipulation

```cpp
#include <iostream>
#include <array>

// Compile-time string
template <size_t N>
struct CompileTimeString {
    char data[N];

    constexpr CompileTimeString(const char (&str)[N]) {
        for (size_t i = 0; i < N; ++i) {
            data[i] = str[i];
        }
    }

    constexpr size_t length() const {
        return N - 1;  // Exclude null terminator
    }

    constexpr char operator[](size_t i) const {
        return data[i];
    }
};

// Concatenate strings at compile time
template <size_t N1, size_t N2>
constexpr auto concat(const char (&s1)[N1], const char (&s2)[N2]) {
    char result[N1 + N2 - 1] = {};
    for (size_t i = 0; i < N1 - 1; ++i) {
        result[i] = s1[i];
    }
    for (size_t i = 0; i < N2; ++i) {
        result[N1 - 1 + i] = s2[i];
    }
    return CompileTimeString(result);
}

// C++20: Use template parameters for string literals
template <size_t N>
struct FixedString {
    char data[N];

    constexpr FixedString(const char (&str)[N]) {
        std::copy_n(str, N, data);
    }

    constexpr size_t size() const { return N - 1; }
};

template <FixedString Str>
struct Message {
    static constexpr const char* value = Str.data;
};

int main() {
    constexpr CompileTimeString str("Hello");
    std::cout << "Length: " << str.length() << std::endl;
    std::cout << "First char: " << str[0] << std::endl;

    constexpr auto combined = concat("Hello, ", "World!");
    std::cout << combined.data << std::endl;

    return 0;
}
```

## Best Practices

### Use Concepts Over SFINAE (C++20)

```cpp
// Bad: SFINAE is verbose
template <typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
add(T a, T b) {
    return a + b;
}

// Good: Concepts are clearer
template <std::integral T>
T add(T a, T b) {
    return a + b;
}
```

### Prefer constexpr Over Template Metaprogramming

```cpp
// Old style: Template metaprogramming
template <int N>
struct Factorial {
    static constexpr int value = N * Factorial<N - 1>::value;
};

template <>
struct Factorial<0> {
    static constexpr int value = 1;
};

// Modern style: constexpr function
constexpr int factorial(int n) {
    return (n <= 1) ? 1 : n * factorial(n - 1);
}
```

### Use Type Aliases

```cpp
// Make code more readable
template <typename T>
using Vec = std::vector<T>;

template <typename K, typename V>
using Map = std::unordered_map<K, V>;

// Use them
Vec<int> numbers = {1, 2, 3};
Map<std::string, int> ages = {{"Alice", 30}, {"Bob", 25}};
```

### Document Template Requirements

```cpp
/**
 * Sorts a container in place
 *
 * Requirements:
 * - T must be copyable
 * - T must support operator<
 * - Container must have begin() and end()
 * - Iterators must be random access
 */
template <typename Container>
requires std::ranges::random_access_range<Container>
void quickSort(Container& container) {
    // Implementation
}
```

### Avoid Deep Template Nesting

```cpp
// Bad: Hard to understand
template <typename T>
struct Wrapper {
    template <typename U>
    struct Inner {
        template <typename V>
        struct DeepInner {
            // Too deep!
        };
    };
};

// Good: Keep it flat
template <typename T, typename U, typename V>
struct Wrapper {
    // Easier to understand
};
```

### Use if constexpr for Compile-Time Branching

```cpp
template <typename T>
void process(T value) {
    if constexpr (std::is_integral_v<T>) {
        std::cout << "Processing integer" << std::endl;
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << "Processing float" << std::endl;
    } else {
        std::cout << "Processing other" << std::endl;
    }
}
```

### Minimize Template Code in Headers

```cpp
// Declaration in header
template <typename T>
class MyClass {
public:
    void complexMethod();
};

// Implementation in .cpp (explicit instantiation)
template <typename T>
void MyClass<T>::complexMethod() {
    // Complex implementation
}

// Explicit instantiation for known types
template class MyClass<int>;
template class MyClass<double>;
```

### Use Perfect Forwarding

```cpp
template <typename T>
void wrapper(T&& arg) {
    // Perfect forwarding preserves value category
    innerFunction(std::forward<T>(arg));
}
```

## Summary

C++ templates are a powerful feature that enables:

- **Generic Programming**: Write code that works with any type
- **Compile-Time Computation**: Execute logic at compile time for zero runtime overhead
- **Type Safety**: Catch errors at compile time
- **Code Reuse**: Eliminate code duplication while maintaining performance

Key concepts to master:

1. **Function and Class Templates**: Foundation of generic programming
2. **Template Specialization**: Customize behavior for specific types
3. **Variadic Templates**: Handle arbitrary numbers of arguments
4. **SFINAE**: Enable overloading based on type properties
5. **Concepts (C++20)**: Modern, cleaner template constraints
6. **Metaprogramming**: Compile-time computation and type manipulation

Templates are essential for modern C++ development, enabling powerful libraries like the STL while maintaining C++'s zero-overhead principle. Master them to write efficient, reusable, and type-safe code.
