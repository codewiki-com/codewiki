---
title: C++20 Features
description: Complete guide to C++20, Concepts, Ranges, Coroutines and Modules
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - C++20
  - Concepts
  - Ranges
status: imported
origin: old/src/content/docs/cpp/cpp20.en.md
divergence: 0.289
issues: []
legacy:
  category: Cpp
  subcategory: Modern C++
  order: 12
  lastUpdated: 2026-01-07
---

C++20 represents one of the most significant updates to the C++ language since C++11. This release introduces four major features—Concepts, Ranges, Coroutines, and Modules—along with numerous smaller but impactful improvements. We'll take a deep dive into these features with practical examples.

---

## Concepts

Concepts are a revolutionary feature that allows you to specify constraints on template parameters. They make template error messages more readable and enable better overload resolution.

### Defining Concepts

A concept is defined using the `concept` keyword and evaluates to a boolean expression:

```cpp
#include <concepts>
#include <type_traits>

// Basic concept definition
template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

// Concept using requires expression
template<typename T>
concept Hashable = requires(T a) {
    { std::hash<T>{}(a) } -> std::convertible_to<std::size_t>;
};

// Compound concept
template<typename T>
concept SignedNumeric = Numeric<T> && std::is_signed_v<T>;
```

### Using Concepts

There are multiple ways to apply concepts to templates:

```cpp
#include <concepts>
#include <iostream>

// Method 1: Requires clause after template parameters
template<typename T>
requires std::integral<T>
T gcd(T a, T b) {
    while (b != 0) {
        T temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Method 2: Trailing requires clause
template<typename T>
T abs_value(T x) requires std::signed_integral<T> {
    return x < 0 ? -x : x;
}

// Method 3: Constrained template parameter
template<std::floating_point T>
T square_root(T x) {
    return std::sqrt(x);
}

// Method 4: Abbreviated function template with auto
void print_integral(std::integral auto value) {
    std::cout << "Integral value: " << value << '\n';
}
```

### Requires Expressions

Requires expressions allow you to specify complex constraints:

```cpp
#include <concepts>
#include <iostream>
#include <string>

template<typename T>
concept Printable = requires(T t, std::ostream& os) {
    // Simple requirement: expression must be valid
    t.to_string();

    // Compound requirement: expression must be valid and return specific type
    { t.size() } -> std::convertible_to<std::size_t>;

    // Compound requirement with noexcept
    { t.data() } noexcept -> std::same_as<const char*>;

    // Nested requirement
    requires std::is_copy_constructible_v<T>;
};

template<typename T>
concept Container = requires(T container) {
    typename T::value_type;           // Type requirement
    typename T::iterator;
    { container.begin() } -> std::same_as<typename T::iterator>;
    { container.end() } -> std::same_as<typename T::iterator>;
    { container.size() } -> std::convertible_to<std::size_t>;
};

// Using the Container concept
template<Container C>
void print_container(const C& container) {
    for (const auto& elem : container) {
        std::cout << elem << ' ';
    }
    std::cout << '\n';
}
```

### Standard Library Concepts

C++20 provides many useful concepts in the `<concepts>` header:

```cpp
#include <concepts>

// Core language concepts
static_assert(std::same_as<int, int>);
static_assert(std::derived_from<std::string, std::string>);
static_assert(std::convertible_to<int, double>);
static_assert(std::integral<int>);
static_assert(std::floating_point<double>);

// Comparison concepts
static_assert(std::equality_comparable<int>);
static_assert(std::totally_ordered<double>);

// Object concepts
static_assert(std::movable<std::string>);
static_assert(std::copyable<int>);
static_assert(std::regular<int>);

// Callable concepts
template<typename F>
requires std::invocable<F, int, int>
auto apply(F func, int a, int b) {
    return func(a, b);
}
```

### Concept Subsumption and Overloading

Concepts support subsumption, allowing more specific concepts to be preferred during overload resolution:

```cpp
#include <concepts>
#include <iostream>

template<typename T>
concept Animal = requires(T t) {
    { t.speak() } -> std::same_as<void>;
};

template<typename T>
concept Dog = Animal<T> && requires(T t) {
    { t.bark() } -> std::same_as<void>;
};

// More constrained overload is preferred
void interact(Animal auto& a) {
    std::cout << "Generic animal interaction\n";
    a.speak();
}

void interact(Dog auto& d) {
    std::cout << "Dog-specific interaction\n";
    d.bark();
}
```

---

## Ranges

The Ranges library provides a new way to work with sequences of elements, offering composable algorithms and lazy evaluation through views.

### Range Concepts

```cpp
#include <ranges>
#include <vector>
#include <list>

// Check if a type satisfies range concepts
static_assert(std::ranges::range<std::vector<int>>);
static_assert(std::ranges::sized_range<std::vector<int>>);
static_assert(std::ranges::random_access_range<std::vector<int>>);
static_assert(std::ranges::bidirectional_range<std::list<int>>);
```

### Views and Adaptors

Views are lightweight, non-owning ranges that provide lazy evaluation:

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Filter and transform with views
    auto even_squares = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    // Views are lazy - nothing computed yet
    for (int n : even_squares) {
        std::cout << n << ' ';  // Output: 4 16 36 64 100
    }
    std::cout << '\n';

    // Take and drop
    auto middle = numbers
        | std::views::drop(2)
        | std::views::take(5);
    // Result: 3, 4, 5, 6, 7

    // Reverse view
    for (int n : numbers | std::views::reverse) {
        std::cout << n << ' ';  // Output: 10 9 8 7 6 5 4 3 2 1
    }
    std::cout << '\n';

    return 0;
}
```

### Common View Adaptors

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};

    // std::views::all - view of entire container
    auto all = std::views::all(nums);

    // std::views::counted - view of n elements from iterator
    auto counted = std::views::counted(nums.begin(), 3);  // 1, 2, 3

    // std::views::iota - generate sequence
    for (int i : std::views::iota(1, 6)) {
        std::cout << i << ' ';  // 1 2 3 4 5
    }
    std::cout << '\n';

    // std::views::iota with infinite range
    auto first_10 = std::views::iota(1) | std::views::take(10);

    // std::views::split - split by delimiter
    std::string csv = "apple,banana,cherry";
    for (auto word : csv | std::views::split(',')) {
        std::cout << std::string_view(word.begin(), word.end()) << '\n';
    }

    // std::views::join - flatten nested ranges
    std::vector<std::vector<int>> nested = {{1, 2}, {3, 4}, {5}};
    for (int n : nested | std::views::join) {
        std::cout << n << ' ';  // 1 2 3 4 5
    }
    std::cout << '\n';

    // std::views::elements - access tuple elements
    std::vector<std::pair<int, std::string>> pairs = {
        {1, "one"}, {2, "two"}, {3, "three"}
    };
    for (int key : pairs | std::views::keys) {
        std::cout << key << ' ';  // 1 2 3
    }
    std::cout << '\n';

    return 0;
}
```

### Range Algorithms

C++20 provides range-based versions of standard algorithms:

```cpp
#include <ranges>
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> nums = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Range-based sort
    std::ranges::sort(nums);

    // Range-based find
    auto it = std::ranges::find(nums, 5);

    // Range-based count_if
    auto count = std::ranges::count_if(nums, [](int n) { return n > 5; });

    // Range-based transform
    std::vector<int> squares(nums.size());
    std::ranges::transform(nums, squares.begin(), [](int n) { return n * n; });

    // Projections - apply function before comparison
    struct Person {
        std::string name;
        int age;
    };

    std::vector<Person> people = {
        {"Alice", 30}, {"Bob", 25}, {"Charlie", 35}
    };

    // Sort by age using projection
    std::ranges::sort(people, {}, &Person::age);

    // Find by name using projection
    auto person = std::ranges::find(people, "Bob", &Person::name);

    return 0;
}
```

### Range Factories

```cpp
#include <ranges>
#include <iostream>

int main() {
    // Generate infinite sequence
    auto naturals = std::views::iota(1);

    // Take first 10 even numbers
    auto first_10_even = naturals
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::take(10);

    for (int n : first_10_even) {
        std::cout << n << ' ';  // 2 4 6 8 10 12 14 16 18 20
    }
    std::cout << '\n';

    // Repeat a value
    for (int n : std::views::repeat(42) | std::views::take(5)) {
        std::cout << n << ' ';  // 42 42 42 42 42
    }
    std::cout << '\n';

    // Empty range
    for (int n : std::views::empty<int>) {
        std::cout << n;  // Never executes
    }

    // Single element range
    for (int n : std::views::single(99)) {
        std::cout << n << '\n';  // 99
    }

    return 0;
}
```

---

## Coroutines

Coroutines are functions that can suspend execution and be resumed later. They enable elegant asynchronous programming and generator patterns.

### Coroutine Basics

A coroutine is defined by using one of these keywords in the function body:
- `co_await` - suspend until awaitable completes
- `co_yield` - suspend and return a value
- `co_return` - complete the coroutine

### Generator Example

```cpp
#include <coroutine>
#include <iostream>
#include <optional>

template<typename T>
class Generator {
public:
    struct promise_type {
        T current_value;

        Generator get_return_object() {
            return Generator{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }

        std::suspend_always yield_value(T value) {
            current_value = std::move(value);
            return {};
        }

        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

    explicit Generator(handle_type h) : handle_(h) {}

    ~Generator() {
        if (handle_) handle_.destroy();
    }

    Generator(Generator&& other) noexcept : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    Generator& operator=(Generator&& other) noexcept {
        if (this != &other) {
            if (handle_) handle_.destroy();
            handle_ = other.handle_;
            other.handle_ = nullptr;
        }
        return *this;
    }

    // Iterator support
    class iterator {
    public:
        using iterator_category = std::input_iterator_tag;
        using value_type = T;
        using difference_type = std::ptrdiff_t;
        using pointer = T*;
        using reference = T&;

        iterator() : handle_(nullptr) {}
        explicit iterator(handle_type h) : handle_(h) {}

        T& operator*() { return handle_.promise().current_value; }

        iterator& operator++() {
            handle_.resume();
            if (handle_.done()) handle_ = nullptr;
            return *this;
        }

        bool operator==(const iterator& other) const {
            return handle_ == other.handle_;
        }

    private:
        handle_type handle_;
    };

    iterator begin() {
        if (handle_) {
            handle_.resume();
            if (handle_.done()) return end();
        }
        return iterator{handle_};
    }

    iterator end() { return iterator{}; }

private:
    handle_type handle_;
};

// Using the generator
Generator<int> fibonacci(int n) {
    int a = 0, b = 1;
    for (int i = 0; i < n; ++i) {
        co_yield a;
        int temp = a + b;
        a = b;
        b = temp;
    }
}

int main() {
    for (int fib : fibonacci(10)) {
        std::cout << fib << ' ';  // 0 1 1 2 3 5 8 13 21 34
    }
    std::cout << '\n';
    return 0;
}
```

### Awaitable Types

```cpp
#include <coroutine>
#include <iostream>
#include <thread>
#include <chrono>

struct SleepAwaiter {
    std::chrono::milliseconds duration;

    bool await_ready() const noexcept { return duration.count() <= 0; }

    void await_suspend(std::coroutine_handle<> handle) const {
        std::thread([handle, this]() {
            std::this_thread::sleep_for(duration);
            handle.resume();
        }).detach();
    }

    void await_resume() const noexcept {}
};

SleepAwaiter sleep_for(std::chrono::milliseconds ms) {
    return SleepAwaiter{ms};
}

// Task type for async operations
template<typename T = void>
class Task {
public:
    struct promise_type {
        std::optional<T> result;
        std::exception_ptr exception;
        std::coroutine_handle<> continuation;

        Task get_return_object() {
            return Task{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }

        std::suspend_never initial_suspend() { return {}; }

        auto final_suspend() noexcept {
            struct FinalAwaiter {
                bool await_ready() noexcept { return false; }
                std::coroutine_handle<> await_suspend(
                    std::coroutine_handle<promise_type> h) noexcept {
                    if (h.promise().continuation)
                        return h.promise().continuation;
                    return std::noop_coroutine();
                }
                void await_resume() noexcept {}
            };
            return FinalAwaiter{};
        }

        void return_value(T value) { result = std::move(value); }
        void unhandled_exception() { exception = std::current_exception(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

    explicit Task(handle_type h) : handle_(h) {}
    ~Task() { if (handle_) handle_.destroy(); }

    T get() {
        if (handle_.promise().exception)
            std::rethrow_exception(handle_.promise().exception);
        return *handle_.promise().result;
    }

private:
    handle_type handle_;
};
```

### Practical Coroutine Patterns

```cpp
#include <coroutine>
#include <iostream>
#include <vector>
#include <functional>

// Lazy evaluation with coroutines
Generator<int> lazy_range(int start, int end, int step = 1) {
    for (int i = start; i < end; i += step) {
        co_yield i;
    }
}

// Filter generator
template<typename T, typename Pred>
Generator<T> filter(Generator<T> gen, Pred predicate) {
    for (T value : gen) {
        if (predicate(value)) {
            co_yield value;
        }
    }
}

// Map generator
template<typename T, typename U, typename Func>
Generator<U> map(Generator<T> gen, Func func) {
    for (T value : gen) {
        co_yield func(value);
    }
}

int main() {
    // Lazy processing pipeline
    auto numbers = lazy_range(1, 100);

    // Process only what we need
    int count = 0;
    for (int n : numbers) {
        if (n % 2 == 0 && n * n > 100) {
            std::cout << n << " ";
            if (++count >= 5) break;  // Only process 5 elements
        }
    }
    std::cout << '\n';

    return 0;
}
```

---

## Modules

Modules provide a modern alternative to header files, offering better compilation times, encapsulation, and avoiding preprocessor issues.

### Module Interface Unit

```cpp
// math_utils.cppm (module interface unit)
export module math_utils;

import <cmath>;

export namespace math {
    // Exported function
    double square(double x) {
        return x * x;
    }

    double cube(double x) {
        return x * x * x;
    }

    // Exported class
    class Calculator {
    public:
        void add(double value) { result_ += value; }
        void subtract(double value) { result_ -= value; }
        void multiply(double value) { result_ *= value; }
        void divide(double value) { result_ /= value; }
        double result() const { return result_; }
        void reset() { result_ = 0.0; }
    private:
        double result_ = 0.0;
    };
}

// Internal function (not exported)
double internal_helper(double x) {
    return x * 2;
}
```

### Module Implementation Unit

```cpp
// math_utils_impl.cpp (module implementation unit)
module math_utils;

// Additional implementation that uses internal_helper
namespace math {
    // This can access internal_helper from the interface unit
}
```

### Using Modules

```cpp
// main.cpp
import math_utils;
import <iostream>;

int main() {
    std::cout << math::square(5.0) << '\n';  // 25
    std::cout << math::cube(3.0) << '\n';    // 27

    math::Calculator calc;
    calc.add(10);
    calc.multiply(2);
    std::cout << calc.result() << '\n';  // 20

    return 0;
}
```

### Module Partitions

```cpp
// math_utils-geometry.cppm (partition interface)
export module math_utils:geometry;

export namespace math::geometry {
    constexpr double pi = 3.14159265358979323846;

    double circle_area(double radius) {
        return pi * radius * radius;
    }

    double circle_circumference(double radius) {
        return 2 * pi * radius;
    }
}

// math_utils.cppm (primary interface, re-exports partitions)
export module math_utils;

export import :geometry;  // Re-export geometry partition

export namespace math {
    double square(double x) { return x * x; }
}
```

### Private Module Fragments

```cpp
// single_file_module.cppm
export module single_file;

export class PublicAPI {
public:
    void do_something();
    int get_result() const;
private:
    int internal_data_;
};

// Private module fragment - not visible to importers
module :private;

#include <iostream>  // Safe to use includes here

void PublicAPI::do_something() {
    std::cout << "Doing something\n";
    internal_data_ = 42;
}

int PublicAPI::get_result() const {
    return internal_data_;
}
```

---

## Three-Way Comparison (Spaceship Operator)

The three-way comparison operator `<=>` simplifies comparison operations by generating all comparison operators from a single definition.

### Basic Usage

```cpp
#include <compare>
#include <iostream>
#include <string>

struct Version {
    int major;
    int minor;
    int patch;

    // Define spaceship operator - generates ==, !=, <, <=, >, >=
    auto operator<=>(const Version&) const = default;
};

int main() {
    Version v1{1, 2, 3};
    Version v2{1, 3, 0};

    if (v1 < v2) {
        std::cout << "v1 is older\n";
    }

    if (v1 != v2) {
        std::cout << "Versions are different\n";
    }

    return 0;
}
```

### Comparison Categories

```cpp
#include <compare>
#include <iostream>

// strong_ordering: a == b implies f(a) == f(b) for any function f
struct Point {
    int x, y;
    std::strong_ordering operator<=>(const Point&) const = default;
};

// weak_ordering: equivalent elements may not be substitutable
struct CaseInsensitiveString {
    std::string value;

    std::weak_ordering operator<=>(const CaseInsensitiveString& other) const {
        // Case-insensitive comparison
        auto to_lower = [](unsigned char c) {
            return static_cast<char>(std::tolower(c));
        };

        size_t min_len = std::min(value.size(), other.value.size());
        for (size_t i = 0; i < min_len; ++i) {
            char c1 = to_lower(value[i]);
            char c2 = to_lower(other.value[i]);
            if (c1 < c2) return std::weak_ordering::less;
            if (c1 > c2) return std::weak_ordering::greater;
        }

        if (value.size() < other.value.size()) return std::weak_ordering::less;
        if (value.size() > other.value.size()) return std::weak_ordering::greater;
        return std::weak_ordering::equivalent;
    }

    bool operator==(const CaseInsensitiveString& other) const {
        return (*this <=> other) == 0;
    }
};

// partial_ordering: some pairs may be incomparable (like NaN in floats)
struct OptionalValue {
    std::optional<int> value;

    std::partial_ordering operator<=>(const OptionalValue& other) const {
        if (!value.has_value() && !other.value.has_value())
            return std::partial_ordering::equivalent;
        if (!value.has_value() || !other.value.has_value())
            return std::partial_ordering::unordered;
        return *value <=> *other.value;
    }
};

int main() {
    Point p1{1, 2}, p2{1, 3};
    std::cout << std::boolalpha;
    std::cout << "p1 < p2: " << (p1 < p2) << '\n';

    CaseInsensitiveString s1{"Hello"}, s2{"HELLO"};
    std::cout << "s1 == s2: " << (s1 == s2) << '\n';

    return 0;
}
```

### Custom Three-Way Comparison

```cpp
#include <compare>
#include <string>

class Person {
    std::string name_;
    int age_;

public:
    Person(std::string name, int age) : name_(std::move(name)), age_(age) {}

    // Custom comparison: compare by age, then by name
    std::strong_ordering operator<=>(const Person& other) const {
        if (auto cmp = age_ <=> other.age_; cmp != 0)
            return cmp;
        return name_ <=> other.name_;
    }

    // Need explicit == for heterogeneous comparisons
    bool operator==(const Person& other) const = default;
};

// Comparing with different types
struct Meters {
    double value;

    auto operator<=>(const Meters&) const = default;

    // Heterogeneous comparison with double
    std::partial_ordering operator<=>(double other) const {
        return value <=> other;
    }

    bool operator==(double other) const {
        return value == other;
    }
};
```

---

## Designated Initializers

Designated initializers allow you to initialize specific members of an aggregate by name.

### Basic Usage

```cpp
#include <iostream>
#include <string>

struct Config {
    std::string host = "localhost";
    int port = 8080;
    bool ssl = false;
    int timeout = 30;
    std::string username;
    std::string password;
};

int main() {
    // Initialize specific members by name
    Config config1{
        .host = "example.com",
        .port = 443,
        .ssl = true
        // Other members use default values
    };

    // Order must match declaration order
    Config config2{
        .host = "api.example.com",
        .ssl = true,
        .timeout = 60,
        .username = "admin"
    };

    std::cout << "Host: " << config1.host << '\n';
    std::cout << "Port: " << config1.port << '\n';
    std::cout << "SSL: " << std::boolalpha << config1.ssl << '\n';

    return 0;
}
```

### Nested Aggregates

```cpp
struct Point {
    int x = 0;
    int y = 0;
};

struct Rectangle {
    Point top_left;
    Point bottom_right;
    std::string color = "black";
};

int main() {
    Rectangle rect{
        .top_left = {.x = 10, .y = 20},
        .bottom_right = {.x = 100, .y = 200},
        .color = "red"
    };

    // Mixed initialization
    Rectangle rect2{
        .top_left{0, 0},
        .bottom_right = Point{50, 50}
    };

    return 0;
}
```

### Practical Examples

```cpp
#include <iostream>
#include <vector>
#include <string>

struct NetworkRequest {
    std::string url;
    std::string method = "GET";
    std::vector<std::pair<std::string, std::string>> headers;
    std::string body;
    int timeout_ms = 5000;
    bool follow_redirects = true;
};

struct DatabaseConfig {
    std::string host = "localhost";
    int port = 5432;
    std::string database;
    std::string user;
    std::string password;
    int pool_size = 10;
    bool ssl_mode = false;
};

int main() {
    // Clear, self-documenting initialization
    NetworkRequest req{
        .url = "https://api.example.com/data",
        .method = "POST",
        .headers = {{"Content-Type", "application/json"}},
        .body = R"({"key": "value"})",
        .timeout_ms = 10000
    };

    DatabaseConfig db{
        .host = "db.example.com",
        .database = "myapp",
        .user = "admin",
        .password = "secret",
        .pool_size = 20,
        .ssl_mode = true
    };

    std::cout << "Request to: " << req.url << '\n';
    std::cout << "Database: " << db.database << " on " << db.host << '\n';

    return 0;
}
```

---

## Constexpr Improvements

C++20 significantly expands what can be done in constant expressions.

### Constexpr Virtual Functions

```cpp
class Base {
public:
    constexpr virtual int value() const { return 1; }
    constexpr virtual ~Base() = default;
};

class Derived : public Base {
public:
    constexpr int value() const override { return 2; }
};

consteval int get_value() {
    Derived d;
    Base* b = &d;
    return b->value();  // Returns 2 at compile time
}

static_assert(get_value() == 2);
```

### Constexpr Dynamic Allocation

```cpp
#include <memory>

constexpr int sum_array() {
    int* arr = new int[5]{1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i < 5; ++i) {
        sum += arr[i];
    }
    delete[] arr;
    return sum;
}

static_assert(sum_array() == 15);

// Using smart pointers
constexpr int smart_pointer_demo() {
    auto ptr = std::make_unique<int>(42);
    return *ptr;
}

static_assert(smart_pointer_demo() == 42);
```

### Constexpr std::vector and std::string

```cpp
#include <vector>
#include <string>
#include <algorithm>

constexpr int vector_operations() {
    std::vector<int> v = {5, 3, 1, 4, 2};
    std::sort(v.begin(), v.end());

    int sum = 0;
    for (int x : v) sum += x;

    v.push_back(6);
    return v.size() + sum;  // 6 + 15 = 21
}

static_assert(vector_operations() == 21);

constexpr size_t string_length() {
    std::string s = "Hello, ";
    s += "World!";
    return s.length();
}

static_assert(string_length() == 13);
```

### Consteval - Immediate Functions

```cpp
// consteval forces compile-time evaluation
consteval int square(int n) {
    return n * n;
}

consteval const char* compile_time_message() {
    return "This is computed at compile time";
}

int main() {
    constexpr int x = square(5);  // OK: compile-time

    // int y = 5;
    // int z = square(y);  // ERROR: y is not a constant expression

    const int a = 5;
    int b = square(a);  // OK: a is a constant expression

    return 0;
}
```

### Constinit - Constant Initialization

```cpp
// constinit ensures static initialization (no dynamic initialization)
constinit int global_value = 42;
constinit thread_local int thread_value = 100;

// Can be modified at runtime, but initialization is compile-time
void modify() {
    global_value = 100;  // OK
}

// Prevents static initialization order fiasco
constexpr int compute_initial_value() { return 42; }

struct Config {
    static constinit int value;
};
constinit int Config::value = compute_initial_value();
```

### is_constant_evaluated()

```cpp
#include <type_traits>
#include <cmath>

constexpr double power(double base, int exp) {
    if (std::is_constant_evaluated()) {
        // Compile-time path: use simple algorithm
        double result = 1.0;
        for (int i = 0; i < exp; ++i) {
            result *= base;
        }
        return result;
    } else {
        // Runtime path: use optimized library function
        return std::pow(base, exp);
    }
}

// Compile-time evaluation
static_assert(power(2.0, 10) == 1024.0);

int main() {
    // Runtime evaluation (uses std::pow)
    int exp = 10;
    double result = power(2.0, exp);
    return 0;
}
```

---

## Additional C++20 Features

### Abbreviated Function Templates

```cpp
// Before C++20
template<typename T, typename U>
auto add_old(T a, U b) {
    return a + b;
}

// C++20: Abbreviated syntax
auto add_new(auto a, auto b) {
    return a + b;
}

// With concepts
auto add_numeric(std::integral auto a, std::integral auto b) {
    return a + b;
}
```

### Template Syntax for Lambdas

```cpp
#include <vector>
#include <concepts>

int main() {
    // Template lambda
    auto generic_lambda = []<typename T>(std::vector<T>& vec, T value) {
        vec.push_back(value);
    };

    // Constrained template lambda
    auto numeric_lambda = []<std::integral T>(T a, T b) {
        return a + b;
    };

    // Perfect forwarding lambda
    auto forward_lambda = []<typename... Args>(Args&&... args) {
        return std::make_tuple(std::forward<Args>(args)...);
    };

    std::vector<int> v;
    generic_lambda(v, 42);

    return 0;
}
```

### Calendar and Time Zone Library

```cpp
#include <chrono>
#include <iostream>

int main() {
    using namespace std::chrono;

    // Date literals
    auto date = 2024y/March/15;
    auto date2 = March/15/2024;

    // Year, month, day components
    year_month_day ymd{2024y, March, 15d};

    std::cout << "Year: " << int(ymd.year()) << '\n';
    std::cout << "Month: " << unsigned(ymd.month()) << '\n';
    std::cout << "Day: " << unsigned(ymd.day()) << '\n';

    // Weekday calculations
    weekday wd{sys_days{ymd}};
    std::cout << "Weekday: " << wd << '\n';

    // Duration arithmetic
    auto next_week = sys_days{ymd} + weeks{1};

    // Last day of month
    auto last_feb = 2024y/February/last;
    year_month_day last_feb_day{last_feb};
    std::cout << "Last day of Feb 2024: " << unsigned(last_feb_day.day()) << '\n';

    return 0;
}
```

### std::span

```cpp
#include <span>
#include <vector>
#include <array>
#include <iostream>

void print_ints(std::span<const int> data) {
    for (int value : data) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
}

void modify_ints(std::span<int> data) {
    for (int& value : data) {
        value *= 2;
    }
}

int main() {
    // Works with C-style arrays
    int c_array[] = {1, 2, 3, 4, 5};
    print_ints(c_array);

    // Works with std::vector
    std::vector<int> vec = {6, 7, 8, 9, 10};
    print_ints(vec);

    // Works with std::array
    std::array<int, 3> arr = {11, 12, 13};
    print_ints(arr);

    // Subspans
    std::span<int> full_span{vec};
    auto first_three = full_span.first(3);
    auto last_two = full_span.last(2);
    auto middle = full_span.subspan(1, 3);

    // Fixed-size span
    std::span<int, 5> fixed_span{c_array};
    static_assert(fixed_span.size() == 5);

    return 0;
}
```

### std::format

```cpp
#include <format>
#include <iostream>
#include <string>

int main() {
    // Basic formatting
    std::string s1 = std::format("Hello, {}!", "World");
    std::cout << s1 << '\n';  // Hello, World!

    // Positional arguments
    std::string s2 = std::format("{1} before {0}", "second", "first");
    std::cout << s2 << '\n';  // first before second

    // Format specifiers
    int n = 42;
    std::cout << std::format("Decimal: {}", n) << '\n';
    std::cout << std::format("Hex: {:x}", n) << '\n';
    std::cout << std::format("Binary: {:b}", n) << '\n';
    std::cout << std::format("Padded: {:05}", n) << '\n';

    // Floating point formatting
    double pi = 3.14159265358979;
    std::cout << std::format("Default: {}", pi) << '\n';
    std::cout << std::format("Fixed: {:.2f}", pi) << '\n';
    std::cout << std::format("Scientific: {:.4e}", pi) << '\n';

    // Width and alignment
    std::cout << std::format("|{:>10}|", "right") << '\n';
    std::cout << std::format("|{:<10}|", "left") << '\n';
    std::cout << std::format("|{:^10}|", "center") << '\n';

    // Fill character
    std::cout << std::format("{:*^20}", "centered") << '\n';

    return 0;
}
```

### std::source_location

```cpp
#include <source_location>
#include <iostream>

void log(const std::string& message,
         const std::source_location location = std::source_location::current()) {
    std::cout << location.file_name() << ':'
              << location.line() << ' '
              << location.function_name() << ": "
              << message << '\n';
}

int main() {
    log("Starting application");
    // Output: main.cpp:15 main: Starting application

    return 0;
}
```

### std::bit_cast

```cpp
#include <bit>
#include <cstdint>
#include <iostream>

int main() {
    float f = 3.14f;

    // Type-safe bit reinterpretation
    auto bits = std::bit_cast<std::uint32_t>(f);
    std::cout << "Float bits: " << std::hex << bits << '\n';

    // Reverse the conversion
    float f2 = std::bit_cast<float>(bits);
    std::cout << "Recovered: " << f2 << '\n';

    return 0;
}
```

### Bit Manipulation Utilities

```cpp
#include <bit>
#include <bitset>
#include <cstdint>
#include <iostream>

int main() {
    std::uint32_t x = 0b00110100;

    // Population count (number of 1 bits)
    std::cout << "popcount: " << std::popcount(x) << '\n';  // 3

    // Count leading zeros
    std::cout << "countl_zero: " << std::countl_zero(x) << '\n';

    // Count trailing zeros
    std::cout << "countr_zero: " << std::countr_zero(x) << '\n';

    // Check if power of two
    std::cout << "has_single_bit(8): " << std::has_single_bit(8u) << '\n';  // true

    // Round up to power of two
    std::cout << "bit_ceil(5): " << std::bit_ceil(5u) << '\n';  // 8

    // Round down to power of two
    std::cout << "bit_floor(5): " << std::bit_floor(5u) << '\n';  // 4

    // Bit width (minimum bits needed)
    std::cout << "bit_width(5): " << std::bit_width(5u) << '\n';  // 3

    // Rotate bits
    std::uint8_t y = 0b10110001;
    std::cout << "rotl: " << std::bitset<8>(std::rotl(y, 2)) << '\n';
    std::cout << "rotr: " << std::bitset<8>(std::rotr(y, 2)) << '\n';

    return 0;
}
```

### std::jthread and Cooperative Cancellation

```cpp
#include <thread>
#include <iostream>
#include <chrono>

void worker(std::stop_token stop_token) {
    while (!stop_token.stop_requested()) {
        std::cout << "Working...\n";
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
    std::cout << "Stopped gracefully\n";
}

int main() {
    // jthread automatically joins on destruction
    std::jthread worker_thread(worker);

    std::this_thread::sleep_for(std::chrono::seconds(2));

    // Request stop - worker will see this and exit
    worker_thread.request_stop();

    // Thread joins automatically when jthread goes out of scope
    return 0;
}
```

### std::atomic_ref

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

int main() {
    int counter = 0;

    auto increment = [&counter]() {
        std::atomic_ref<int> atomic_counter(counter);
        for (int i = 0; i < 1000; ++i) {
            atomic_counter.fetch_add(1, std::memory_order_relaxed);
        }
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(increment);
    }

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "Counter: " << counter << '\n';  // 10000

    return 0;
}
```

---

## Summary

C++20 brings transformative changes to the language:

| Feature | Purpose |
|---------|---------|
| **Concepts** | Constrain templates with clear, composable requirements |
| **Ranges** | Compose algorithms with lazy, efficient views |
| **Coroutines** | Enable cooperative multitasking and generators |
| **Modules** | Replace headers with faster, safer imports |
| **Spaceship Operator** | Simplify comparison implementations |
| **Designated Initializers** | Clear, named aggregate initialization |
| **Constexpr Enhancements** | More compile-time computation |

These features work together to make C++ more expressive, safer, and often more performant. Start adopting them gradually in your codebase, beginning with the features that address your most pressing needs.

## Compiler Support

As of 2025, all major compilers (GCC, Clang, MSVC) have full or near-complete support for C++20 features. Check your compiler's documentation for specific feature availability:

- **GCC**: Full C++20 support since GCC 11+
- **Clang**: Full C++20 support since Clang 16+
- **MSVC**: Full C++20 support since Visual Studio 2022 17.0+

Enable C++20 with your compiler's flag:
- GCC/Clang: `-std=c++20`
- MSVC: `/std:c++20`
