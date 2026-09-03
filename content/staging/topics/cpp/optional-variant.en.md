---
title: optional, variant, and any
description: Handle optional values and type-safe unions with std::optional, std::variant, and std::any
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - cpp
  - optional
  - variant
  - any
  - cpp17
status: imported
origin: old/src/content/docs/cpp/optional-variant.en.md
divergence: 0.227
issues: []
legacy:
  category: Cpp
  subcategory: Modern C++
  order: 30
  lastUpdated: 2026-01-07
---

Modern C++ introduced three powerful type-safe mechanisms for handling optional values, type-safe unions, and type erasure. These utilities eliminate the need for sentinel values, null pointers, and unsafe casts while maintaining performance and clarity.

## std::optional

`std::optional<T>` represents a value that may or may not be present. It's a type-safe alternative to using null pointers or sentinel values.

### Basic Usage

```cpp
#include <optional>
#include <iostream>

std::optional<int> divide(int a, int b) {
    if (b == 0) {
        return std::nullopt;  // No value
    }
    return a / b;  // Value present
}

int main() {
    auto result = divide(10, 2);

    // Check if value exists
    if (result.has_value()) {
        std::cout << "Result: " << result.value() << std::endl;
    }

    // Using operator* (undefined behavior if no value)
    if (result) {
        std::cout << "Result: " << *result << std::endl;
    }

    // Using value_or() for default
    std::cout << "Result: " << result.value_or(0) << std::endl;
}
```

### Member Functions

- `has_value()`: Check if a value is present
- `value()`: Get the contained value (throws `std::bad_optional_access` if empty)
- `operator*`: Get the contained value (undefined behavior if empty)
- `operator->`: Access member of contained value
- `value_or(default)`: Get value or return default
- `emplace(args...)`: Construct value in-place
- `reset()`: Remove the contained value

### Working with Functions

```cpp
#include <optional>
#include <string>

std::optional<std::string> find_user(int id) {
    if (id > 0 && id <= 100) {
        return "User" + std::to_string(id);
    }
    return std::nullopt;
}

int main() {
    // Using and_then for chaining operations
    auto user = find_user(5);

    // Transform the value if present
    auto transformed = user.transform(
        [](const auto& str) { return str.length(); }
    );

    if (transformed) {
        std::cout << "Username length: " << *transformed << std::endl;
    }
}
```

### Monadic Operations (C++23)

C++23 introduced monadic operations for functional composition:

```cpp
#include <optional>

std::optional<int> parse_int(const std::string& str);
std::optional<int> validate_range(int value);

int main() {
    std::string input = "42";

    // Chain operations with and_then
    auto result = parse_int(input)
        .and_then(validate_range)
        .transform([](int x) { return x * 2; });

    if (result) {
        std::cout << "Final result: " << *result << std::endl;
    }
}
```

## std::variant

`std::variant<T1, T2, ...>` is a type-safe union that can hold any one of its specified types. Unlike C-style unions, it tracks which type is currently active.

### Basic Usage

```cpp
#include <variant>
#include <iostream>
#include <string>

using Response = std::variant<int, std::string, double>;

Response process_data(int type) {
    switch (type) {
        case 1: return 42;
        case 2: return std::string("success");
        case 3: return 3.14;
        default: return std::string("error");
    }
}

int main() {
    Response resp = process_data(1);

    // Check which type is active
    if (std::holds_alternative<int>(resp)) {
        std::cout << "Integer: " << std::get<int>(resp) << std::endl;
    }

    // Access by index
    std::cout << "Index: " << resp.index() << std::endl;
}
```

### Visitor Pattern

The visitor pattern provides a safe way to handle variant values. It ensures all types are handled:

```cpp
#include <variant>
#include <iostream>
#include <string>

struct Response {
    int code;
    std::variant<int, std::string, double> data;
};

// Function object visitor
struct DataHandler {
    void operator()(int value) const {
        std::cout << "Integer value: " << value << std::endl;
    }

    void operator()(const std::string& value) const {
        std::cout << "String value: " << value << std::endl;
    }

    void operator()(double value) const {
        std::cout << "Double value: " << value << std::endl;
    }
};

int main() {
    Response resp{200, 42};

    // Apply visitor
    std::visit(DataHandler{}, resp.data);

    resp.data = std::string("Hello");
    std::visit(DataHandler{}, resp.data);
}
```

### Lambda Visitor (C++20)

C++20 simplified visitors using deduced function call operators:

```cpp
#include <variant>
#include <iostream>

using Value = std::variant<int, double, std::string>;

int main() {
    Value v = 42;

    // Lambda visitor with auto
    std::visit([](auto&& arg) {
        std::cout << "Type: " << typeid(arg).name() << std::endl;
    }, v);

    // Multiple overloads (requires lambdas in overload set)
    struct Visitor {
        void operator()(int x) { std::cout << "Int: " << x << std::endl; }
        void operator()(double x) { std::cout << "Double: " << x << std::endl; }
        void operator()(const std::string& x) { std::cout << "String: " << x << std::endl; }
    };

    std::visit(Visitor{}, v);
}
```

### Overload Pattern (C++17)

A useful pattern for creating visitors from multiple lambdas:

```cpp
#include <variant>

// Helper to combine lambda overloads
template<class... Ts> struct overload : Ts... { using Ts::operator()...; };
template<class... Ts> overload(Ts...) -> overload<Ts...>;  // Deduction guide

int main() {
    std::variant<int, double, std::string> v = 3.14;

    std::visit(overload{
        [](int x) { std::cout << "Int: " << x << std::endl; },
        [](double x) { std::cout << "Double: " << x << std::endl; },
        [](const std::string& x) { std::cout << "String: " << x << std::endl; }
    }, v);
}
```

### Common Operations

```cpp
#include <variant>

using Data = std::variant<int, std::string>;

int main() {
    Data data = 42;

    // Safe access with std::get_if (returns pointer)
    if (auto* ptr = std::get_if<int>(&data)) {
        std::cout << "Got int: " << *ptr << std::endl;
    }

    // Assignment and conversion
    data = std::string("text");

    // Check active type
    std::cout << "Index: " << data.index() << std::endl;

    // Get number of types
    std::cout << "Alternatives: " << std::variant_size_v<Data> << std::endl;
}
```

## std::any

`std::any` is a type-erased container that can hold any copyable type. Unlike `std::variant`, you don't declare types upfront, but type safety is lost.

### Basic Usage

```cpp
#include <any>
#include <iostream>
#include <string>

int main() {
    std::any value = 42;
    std::cout << "Integer: " << std::any_cast<int>(value) << std::endl;

    value = std::string("Hello");
    std::cout << "String: " << std::any_cast<std::string>(value) << std::endl;

    value = 3.14;
    std::cout << "Double: " << std::any_cast<double>(value) << std::endl;
}
```

### Safe Access

```cpp
#include <any>
#include <iostream>

int main() {
    std::any value = 42;

    // Check type
    if (value.type() == typeid(int)) {
        std::cout << "Contains int" << std::endl;
    }

    // Safe cast using try-catch
    try {
        int x = std::any_cast<int>(value);
        std::cout << "Value: " << x << std::endl;
    } catch (const std::bad_any_cast& e) {
        std::cout << "Type mismatch: " << e.what() << std::endl;
    }

    // Pointer cast (returns nullptr if type mismatch)
    if (auto ptr = std::any_cast<double>(&value)) {
        std::cout << "Double: " << *ptr << std::endl;
    } else {
        std::cout << "Not a double" << std::endl;
    }
}
```

### Use Cases

```cpp
#include <any>
#include <map>
#include <string>
#include <vector>

// Configuration storage
class Config {
    std::map<std::string, std::any> settings;

public:
    template<typename T>
    void set(const std::string& key, T value) {
        settings[key] = value;
    }

    template<typename T>
    T get(const std::string& key) {
        return std::any_cast<T>(settings.at(key));
    }
};

// Generic container
std::vector<std::any> heterogeneous_data;
heterogeneous_data.push_back(42);
heterogeneous_data.push_back(std::string("text"));
heterogeneous_data.push_back(3.14);
```

## Comparison and Best Practices

### When to Use Each

| Feature | optional | variant | any |
|---------|----------|---------|-----|
| Number of values | 0 or 1 | 1 of N | 1 of unlimited |
| Type safety | Full | Full | Runtime |
| Performance | Zero-cost | Zero-cost | Overhead |
| Compile-time checks | Yes | Yes | No |
| Predefined types | Yes | Yes | No |

### Practical Example

```cpp
#include <optional>
#include <variant>
#include <iostream>
#include <string>

// Use optional for "maybe has value"
std::optional<int> parse_number(const std::string& str) {
    try {
        return std::stoi(str);
    } catch (...) {
        return std::nullopt;
    }
}

// Use variant for result type
using ParseResult = std::variant<int, std::string>;

ParseResult parse_value(const std::string& str) {
    if (auto num = parse_number(str)) {
        return *num;
    }
    return "Failed to parse: " + str;
}

// Use visitor to handle result
int main() {
    auto result = parse_value("42");

    std::visit([](auto&& arg) {
        if constexpr (std::is_same_v<decltype(arg), int>) {
            std::cout << "Parsed: " << arg << std::endl;
        } else {
            std::cout << "Error: " << arg << std::endl;
        }
    }, result);
}
```

## Performance Considerations

- **std::optional**: Zero-overhead abstraction, just storage + boolean flag
- **std::variant**: Zero-overhead abstraction, uses discriminated union
- **std::any**: Runtime overhead due to RTTI and virtual calls

```cpp
#include <optional>
#include <variant>
#include <any>
#include <memory>

// Equivalent storage requirements
struct OptionalInt {
    int value;
    bool has_value;  // 1 byte + padding
};

union VariantStorage {
    int i;
    double d;
};

struct VariantInt {
    VariantStorage data;
    unsigned index;  // discriminator
};

// std::any requires heap allocation
std::any a = 42;  // May allocate memory
```

## Key Takeaways

1. **std::optional** eliminates null pointers and sentinel values for optional data
2. **std::variant** provides type-safe unions with compile-time checking
3. **std::any** enables runtime type erasure when types are unknown at compile time
4. Use visitors with `std::visit()` to safely handle variant values
5. Prefer compile-time solutions (`optional`, `variant`) over runtime ones (`any`)
6. All three are zero-cost abstractions compared to alternatives like raw pointers or void*

These utilities form the foundation of modern, safe C++ programming practices.
