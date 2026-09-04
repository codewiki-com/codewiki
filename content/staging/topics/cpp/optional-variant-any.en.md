---
title: Optional, Variant and Any
description: Complete guide to C++17 type-safe containers, std::optional, std::variant and std::any
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++
  - optional
  - variant
  - C++17
status: imported
origin: old/src/content/docs/cpp/optional-variant-any.en.md
divergence: 0.256
issues: []
legacy:
  category: Cpp
  subcategory: Modern C++
  order: 14
  lastUpdated: 2026-01-07
---

C++17 introduced three powerful vocabulary types that revolutionize how we handle optional values, type-safe unions, and type-erased storage. These containers provide safer alternatives to traditional C++ idioms like null pointers, C-style unions, and void pointers.

## Overview

| Type | Purpose | Use Case |
|------|---------|----------|
| `std::optional<T>` | Maybe holds a value of type T | Return values that might not exist |
| `std::variant<Ts...>` | Holds one of several specified types | Type-safe unions, state machines |
| `std::any` | Holds any single value of any type | Plugin systems, generic containers |

## std::optional: Nullable Value Wrapper

`std::optional<T>` represents a value that may or may not be present. It eliminates the need for sentinel values, output parameters, or throwing exceptions for non-exceptional cases.

### Basic Usage

```cpp
#include <optional>
#include <string>
#include <iostream>

std::optional<int> findIndex(const std::vector<int>& vec, int target) {
    for (size_t i = 0; i < vec.size(); ++i) {
        if (vec[i] == target) {
            return i;  // Implicit conversion to optional
        }
    }
    return std::nullopt;  // No value found
}

int main() {
    std::vector<int> numbers = {10, 20, 30, 40, 50};

    auto result = findIndex(numbers, 30);

    // Check if value exists
    if (result.has_value()) {
        std::cout << "Found at index: " << result.value() << "\n";
    }

    // Alternatively, use boolean conversion
    if (result) {
        std::cout << "Found at index: " << *result << "\n";
    }

    // Handle not found case
    auto notFound = findIndex(numbers, 99);
    if (!notFound) {
        std::cout << "Value not found\n";
    }
}
```

### The value_or() Method

`value_or()` provides a convenient way to supply a default value when the optional is empty.

```cpp
#include <optional>
#include <string>
#include <map>

class Configuration {
    std::map<std::string, std::string> settings;

public:
    std::optional<std::string> getSetting(const std::string& key) const {
        auto it = settings.find(key);
        if (it != settings.end()) {
            return it->second;
        }
        return std::nullopt;
    }

    void setSetting(const std::string& key, const std::string& value) {
        settings[key] = value;
    }
};

int main() {
    Configuration config;
    config.setSetting("theme", "dark");

    // Using value_or for defaults
    std::string theme = config.getSetting("theme").value_or("light");
    std::string language = config.getSetting("language").value_or("en");

    std::cout << "Theme: " << theme << "\n";        // Output: dark
    std::cout << "Language: " << language << "\n";  // Output: en

    // value_or with expression (evaluated only if empty)
    auto computeDefault = []() {
        std::cout << "Computing default...\n";
        return "computed_value";
    };

    // Note: value_or always evaluates its argument
    // For lazy evaluation, use value_or with a pre-computed value
    // or use the pattern below
    std::string result = config.getSetting("missing")
        .value_or(computeDefault());
}
```

### Creating and Modifying Optionals

```cpp
#include <optional>
#include <string>

struct Employee {
    std::string name;
    int id;

    Employee(std::string n, int i) : name(std::move(n)), id(i) {}
};

int main() {
    // Construction methods
    std::optional<int> empty;                          // Empty optional
    std::optional<int> withValue = 42;                 // With value
    std::optional<int> explicitEmpty = std::nullopt;   // Explicitly empty

    // In-place construction (avoids copy/move)
    std::optional<Employee> emp1(std::in_place, "Alice", 101);

    // Using make_optional
    auto emp2 = std::make_optional<Employee>("Bob", 102);

    // Modifying optionals
    std::optional<std::string> name;

    name = "Charlie";                    // Assign value
    name.emplace("David");               // Construct in-place (destroys previous)
    name.reset();                        // Clear the optional
    name = std::nullopt;                 // Also clears

    // Emplace with constructor arguments
    std::optional<std::vector<int>> vec;
    vec.emplace(5, 100);  // Creates vector with 5 elements, all 100

    std::cout << "Vector size: " << vec->size() << "\n";  // Output: 5
}
```

### Optional References and Pointers

`std::optional` cannot hold references directly, but there are workarounds.

```cpp
#include <optional>
#include <functional>

class Database {
    std::vector<std::string> records = {"Record1", "Record2", "Record3"};

public:
    // Return optional pointer (common pattern)
    std::optional<std::string*> findRecord(size_t index) {
        if (index < records.size()) {
            return &records[index];
        }
        return std::nullopt;
    }

    // Using reference_wrapper for optional references
    std::optional<std::reference_wrapper<std::string>>
    findRecordRef(size_t index) {
        if (index < records.size()) {
            return std::ref(records[index]);
        }
        return std::nullopt;
    }
};

int main() {
    Database db;

    // Using optional pointer
    if (auto record = db.findRecord(1)) {
        std::cout << "Found: " << **record << "\n";
        **record = "Modified";  // Can modify original
    }

    // Using reference_wrapper
    if (auto recordRef = db.findRecordRef(0)) {
        std::cout << "Found: " << recordRef->get() << "\n";
        recordRef->get() = "Also Modified";
    }
}
```

### Monadic Operations (C++23)

C++23 adds monadic operations to `std::optional` for cleaner chaining.

```cpp
#include <optional>
#include <string>
#include <charconv>

// C++23 monadic operations
std::optional<std::string> getUserInput() {
    // Simulate getting user input
    return "42";
}

std::optional<int> parseInt(const std::string& s) {
    int value;
    auto [ptr, ec] = std::from_chars(s.data(), s.data() + s.size(), value);
    if (ec == std::errc{}) {
        return value;
    }
    return std::nullopt;
}

std::optional<int> doubleValue(int x) {
    if (x < 1000) {
        return x * 2;
    }
    return std::nullopt;  // Overflow protection
}

int main() {
    // C++23: and_then (flatMap), transform (map), or_else

    // and_then: chains operations that return optional
    auto result = getUserInput()
        .and_then(parseInt)
        .and_then(doubleValue);

    // transform: applies function to value, wraps result in optional
    auto transformed = getUserInput()
        .and_then(parseInt)
        .transform([](int x) { return x * 2; });

    // or_else: provides alternative when empty
    auto withDefault = getUserInput()
        .and_then(parseInt)
        .or_else([]() -> std::optional<int> { return 0; });

    if (result) {
        std::cout << "Result: " << *result << "\n";
    }
}
```

## std::variant: Type-Safe Union

`std::variant<Ts...>` is a type-safe union that can hold one of several specified types. Unlike C unions, it tracks which type is currently stored and prevents undefined behavior.

### Basic Usage

```cpp
#include <variant>
#include <string>
#include <iostream>

int main() {
    // Variant can hold int, double, or string
    std::variant<int, double, std::string> value;

    // Default constructs first type (int in this case)
    std::cout << "Initial: " << std::get<int>(value) << "\n";  // 0

    // Assign different types
    value = 42;
    value = 3.14;
    value = "Hello, Variant!";

    // Access with std::get (throws if wrong type)
    try {
        std::cout << std::get<std::string>(value) << "\n";
        std::cout << std::get<int>(value) << "\n";  // Throws!
    } catch (const std::bad_variant_access& e) {
        std::cout << "Wrong type: " << e.what() << "\n";
    }

    // Safe access with get_if (returns pointer or nullptr)
    if (auto* str = std::get_if<std::string>(&value)) {
        std::cout << "String value: " << *str << "\n";
    }

    // Check current type with index()
    std::cout << "Current index: " << value.index() << "\n";  // 2 (string)

    // Check if holding specific type
    if (std::holds_alternative<std::string>(value)) {
        std::cout << "Holding a string\n";
    }
}
```

### std::visit: Pattern Matching

`std::visit` applies a visitor to the variant, enabling clean pattern matching.

```cpp
#include <variant>
#include <string>
#include <iostream>

using JsonValue = std::variant<
    std::nullptr_t,
    bool,
    int,
    double,
    std::string
>;

// Visitor as a struct with overloaded operator()
struct JsonPrinter {
    void operator()(std::nullptr_t) const {
        std::cout << "null";
    }

    void operator()(bool b) const {
        std::cout << (b ? "true" : "false");
    }

    void operator()(int i) const {
        std::cout << i;
    }

    void operator()(double d) const {
        std::cout << d;
    }

    void operator()(const std::string& s) const {
        std::cout << '"' << s << '"';
    }
};

int main() {
    std::vector<JsonValue> values = {
        nullptr,
        true,
        42,
        3.14159,
        std::string("hello")
    };

    std::cout << "[";
    for (size_t i = 0; i < values.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::visit(JsonPrinter{}, values[i]);
    }
    std::cout << "]\n";
    // Output: [null, true, 42, 3.14159, "hello"]
}
```

### Generic Lambda Visitors

```cpp
#include <variant>
#include <string>
#include <iostream>

// Helper for creating overload sets (C++17)
template<class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };

// Deduction guide (C++17)
template<class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;

using Result = std::variant<int, std::string, std::vector<int>>;

int main() {
    Result result = std::vector<int>{1, 2, 3, 4, 5};

    // Using overloaded pattern for inline visitors
    std::visit(overloaded{
        [](int value) {
            std::cout << "Integer: " << value << "\n";
        },
        [](const std::string& s) {
            std::cout << "String: " << s << "\n";
        },
        [](const std::vector<int>& vec) {
            std::cout << "Vector with " << vec.size() << " elements\n";
        }
    }, result);

    // Generic lambda for common handling
    auto getSize = [](const auto& value) -> size_t {
        if constexpr (std::is_integral_v<std::decay_t<decltype(value)>>) {
            return 1;
        } else {
            return value.size();
        }
    };

    size_t size = std::visit(getSize, result);
    std::cout << "Size: " << size << "\n";  // 5
}
```

### Visiting Multiple Variants

```cpp
#include <variant>
#include <string>
#include <iostream>

using Operand = std::variant<int, double>;

struct Calculator {
    auto operator()(int a, int b) const { return a + b; }
    auto operator()(int a, double b) const { return a + b; }
    auto operator()(double a, int b) const { return a + b; }
    auto operator()(double a, double b) const { return a + b; }
};

int main() {
    Operand a = 10;
    Operand b = 3.5;

    // Visit multiple variants simultaneously
    auto result = std::visit(Calculator{}, a, b);
    std::cout << "Result: " << result << "\n";  // 13.5

    // With generic lambda
    auto multiply = [](auto x, auto y) { return x * y; };
    auto product = std::visit(multiply, a, b);
    std::cout << "Product: " << product << "\n";  // 35.0
}
```

### State Machines with Variant

```cpp
#include <variant>
#include <string>
#include <iostream>

// State definitions
struct Idle {};
struct Connecting { std::string server; };
struct Connected { int connectionId; };
struct Error { std::string message; };

using ConnectionState = std::variant<Idle, Connecting, Connected, Error>;

// Event definitions
struct Connect { std::string server; };
struct ConnectionEstablished { int id; };
struct Disconnect {};
struct ConnectionFailed { std::string reason; };

using Event = std::variant<Connect, ConnectionEstablished, Disconnect, ConnectionFailed>;

class ConnectionManager {
    ConnectionState state = Idle{};

public:
    void processEvent(const Event& event) {
        state = std::visit(overloaded{
            // From Idle
            [](Idle, const Connect& e) -> ConnectionState {
                std::cout << "Connecting to " << e.server << "...\n";
                return Connecting{e.server};
            },

            // From Connecting
            [](const Connecting&, const ConnectionEstablished& e) -> ConnectionState {
                std::cout << "Connected with ID " << e.id << "\n";
                return Connected{e.id};
            },
            [](const Connecting&, const ConnectionFailed& e) -> ConnectionState {
                std::cout << "Connection failed: " << e.reason << "\n";
                return Error{e.reason};
            },

            // From Connected
            [](const Connected&, const Disconnect&) -> ConnectionState {
                std::cout << "Disconnected\n";
                return Idle{};
            },

            // From Error
            [](const Error&, const Connect& e) -> ConnectionState {
                std::cout << "Retrying connection to " << e.server << "...\n";
                return Connecting{e.server};
            },

            // Default: ignore invalid transitions
            [](const auto& currentState, const auto&) -> ConnectionState {
                std::cout << "Invalid transition, staying in current state\n";
                return currentState;
            }
        }, state, event);
    }

    void printState() const {
        std::visit(overloaded{
            [](const Idle&) { std::cout << "State: Idle\n"; },
            [](const Connecting& s) { std::cout << "State: Connecting to " << s.server << "\n"; },
            [](const Connected& s) { std::cout << "State: Connected (ID: " << s.connectionId << ")\n"; },
            [](const Error& s) { std::cout << "State: Error - " << s.message << "\n"; }
        }, state);
    }
};

int main() {
    ConnectionManager manager;
    manager.printState();  // Idle

    manager.processEvent(Connect{"example.com"});
    manager.printState();  // Connecting

    manager.processEvent(ConnectionEstablished{42});
    manager.printState();  // Connected

    manager.processEvent(Disconnect{});
    manager.printState();  // Idle
}
```

### Variant with std::monostate

`std::monostate` enables variants with no default-constructible first type.

```cpp
#include <variant>
#include <string>

class NonDefaultConstructible {
    int value;
public:
    explicit NonDefaultConstructible(int v) : value(v) {}
    int getValue() const { return value; }
};

int main() {
    // Error: NonDefaultConstructible has no default constructor
    // std::variant<NonDefaultConstructible, std::string> bad;

    // Solution: use monostate as first alternative
    std::variant<std::monostate, NonDefaultConstructible, std::string> good;

    // Check if empty (holding monostate)
    if (std::holds_alternative<std::monostate>(good)) {
        std::cout << "Variant is 'empty'\n";
    }

    good = NonDefaultConstructible{42};

    if (auto* obj = std::get_if<NonDefaultConstructible>(&good)) {
        std::cout << "Value: " << obj->getValue() << "\n";
    }
}
```

## std::any: Type-Erased Container

`std::any` can hold a single value of any copy-constructible type. It uses type erasure to store values without knowing their types at compile time.

### Basic Usage

```cpp
#include <any>
#include <string>
#include <iostream>
#include <vector>

int main() {
    std::any container;

    // Check if empty
    if (!container.has_value()) {
        std::cout << "Container is empty\n";
    }

    // Store different types
    container = 42;
    container = std::string("Hello, Any!");
    container = std::vector<int>{1, 2, 3, 4, 5};

    // Get type information
    std::cout << "Type: " << container.type().name() << "\n";

    // Access with any_cast (throws bad_any_cast if wrong type)
    try {
        auto& vec = std::any_cast<std::vector<int>&>(container);
        std::cout << "Vector size: " << vec.size() << "\n";

        // This will throw
        auto num = std::any_cast<int>(container);
    } catch (const std::bad_any_cast& e) {
        std::cout << "Cast failed: " << e.what() << "\n";
    }

    // Safe access with pointer cast
    if (auto* vec = std::any_cast<std::vector<int>>(&container)) {
        std::cout << "First element: " << (*vec)[0] << "\n";
    }

    // Clear the container
    container.reset();
    std::cout << "Has value: " << container.has_value() << "\n";  // false
}
```

### In-Place Construction

```cpp
#include <any>
#include <string>
#include <vector>

struct ComplexType {
    std::string name;
    std::vector<int> data;

    ComplexType(std::string n, std::initializer_list<int> d)
        : name(std::move(n)), data(d) {}
};

int main() {
    // In-place construction to avoid copies
    std::any a1(std::in_place_type<std::vector<int>>, 5, 100);

    // Using make_any
    auto a2 = std::make_any<std::string>(10, 'x');  // "xxxxxxxxxx"

    // With initializer list (requires in_place_type)
    std::any a3(std::in_place_type<std::vector<int>>, {1, 2, 3, 4, 5});

    // Complex type with in-place construction
    std::any a4(std::in_place_type<ComplexType>, "test", {1, 2, 3});

    // Emplace to replace value
    a1.emplace<std::string>("New value");

    auto& vec = std::any_cast<std::vector<int>&>(a3);
    std::cout << "Vector: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << "\n";
}
```

### Practical Use Case: Property System

```cpp
#include <any>
#include <string>
#include <map>
#include <iostream>
#include <typeindex>

class PropertyBag {
    std::map<std::string, std::any> properties;

public:
    template<typename T>
    void set(const std::string& name, T&& value) {
        properties[name] = std::forward<T>(value);
    }

    template<typename T>
    std::optional<T> get(const std::string& name) const {
        auto it = properties.find(name);
        if (it == properties.end()) {
            return std::nullopt;
        }

        if (auto* value = std::any_cast<T>(&it->second)) {
            return *value;
        }
        return std::nullopt;
    }

    template<typename T>
    T getOr(const std::string& name, T defaultValue) const {
        return get<T>(name).value_or(std::move(defaultValue));
    }

    bool has(const std::string& name) const {
        return properties.find(name) != properties.end();
    }

    void remove(const std::string& name) {
        properties.erase(name);
    }

    std::type_index typeOf(const std::string& name) const {
        auto it = properties.find(name);
        if (it != properties.end() && it->second.has_value()) {
            return it->second.type();
        }
        return typeid(void);
    }
};

int main() {
    PropertyBag config;

    config.set("name", std::string("MyApplication"));
    config.set("version", 1.5);
    config.set("maxConnections", 100);
    config.set("features", std::vector<std::string>{"auth", "logging", "cache"});

    std::cout << "Name: " << config.getOr<std::string>("name", "Unknown") << "\n";
    std::cout << "Version: " << config.getOr<double>("version", 1.0) << "\n";
    std::cout << "Timeout: " << config.getOr<int>("timeout", 30) << "\n";  // Default

    if (auto features = config.get<std::vector<std::string>>("features")) {
        std::cout << "Features: ";
        for (const auto& f : *features) {
            std::cout << f << " ";
        }
        std::cout << "\n";
    }
}
```

### Plugin System Example

```cpp
#include <any>
#include <string>
#include <map>
#include <functional>
#include <iostream>

class PluginManager {
public:
    using PluginFunction = std::function<std::any(const std::vector<std::any>&)>;

private:
    std::map<std::string, PluginFunction> plugins;

public:
    void registerPlugin(const std::string& name, PluginFunction func) {
        plugins[name] = std::move(func);
    }

    template<typename R, typename... Args>
    std::optional<R> call(const std::string& name, Args&&... args) {
        auto it = plugins.find(name);
        if (it == plugins.end()) {
            return std::nullopt;
        }

        std::vector<std::any> arguments = {std::any(std::forward<Args>(args))...};

        try {
            std::any result = it->second(arguments);
            return std::any_cast<R>(result);
        } catch (const std::bad_any_cast&) {
            return std::nullopt;
        }
    }
};

int main() {
    PluginManager pm;

    // Register an "add" plugin
    pm.registerPlugin("add", [](const std::vector<std::any>& args) -> std::any {
        if (args.size() < 2) return 0;
        int a = std::any_cast<int>(args[0]);
        int b = std::any_cast<int>(args[1]);
        return a + b;
    });

    // Register a "concat" plugin
    pm.registerPlugin("concat", [](const std::vector<std::any>& args) -> std::any {
        std::string result;
        for (const auto& arg : args) {
            result += std::any_cast<std::string>(arg);
        }
        return result;
    });

    // Use plugins
    if (auto sum = pm.call<int>("add", 10, 20)) {
        std::cout << "Sum: " << *sum << "\n";  // 30
    }

    if (auto str = pm.call<std::string>("concat",
            std::string("Hello, "), std::string("World!"))) {
        std::cout << "Concatenated: " << *str << "\n";
    }
}
```

## Comparison and When to Use Each

### Feature Comparison

| Feature | std::optional | std::variant | std::any |
|---------|---------------|--------------|----------|
| Type-safe | Yes | Yes | Runtime |
| Compile-time type checking | Yes | Yes | No |
| Memory overhead | Minimal | Size of largest type | Heap allocation possible |
| Performance | Excellent | Excellent | Good (may heap allocate) |
| Types known at compile time | Yes (1 type) | Yes (N types) | No |
| Default constructible | Yes (empty) | Yes (first type) | Yes (empty) |
| Pattern matching | Limited | std::visit | Manual type checking |

### Decision Guide

**Use `std::optional<T>` when:**
- A value may or may not exist
- Replacing nullable pointers
- Return type for functions that might fail
- Optional function parameters
- Lazy initialization

```cpp
// Good use of optional
std::optional<User> findUser(int id);
std::optional<int> parseInt(std::string_view s);
void process(std::optional<Config> config = std::nullopt);
```

**Use `std::variant<Ts...>` when:**
- Value is one of a fixed set of types
- Implementing state machines
- AST nodes in parsers/interpreters
- Type-safe alternatives to inheritance
- Sum types / discriminated unions

```cpp
// Good use of variant
using JsonValue = std::variant<nullptr_t, bool, int, double, std::string, Array, Object>;
using ParseResult = std::variant<Success, Error>;
using NetworkState = std::variant<Disconnected, Connecting, Connected, Error>;
```

**Use `std::any` when:**
- Type is truly unknown at compile time
- Plugin systems with dynamic types
- Generic property systems
- Interfacing with scripting languages
- When flexibility outweighs type safety

```cpp
// Good use of any
class PropertySystem { std::map<std::string, std::any> properties; };
std::any executeScript(const std::string& code);
void registerCallback(std::any userData);
```

### Performance Considerations

```cpp
#include <any>
#include <variant>
#include <optional>
#include <chrono>
#include <iostream>

void benchmarkContainers() {
    constexpr int iterations = 1000000;

    // Optional - minimal overhead
    {
        auto start = std::chrono::high_resolution_clock::now();
        std::optional<int> opt;
        for (int i = 0; i < iterations; ++i) {
            opt = i;
            volatile int x = opt.value_or(0);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        std::cout << "Optional: " << duration.count() << " us\n";
    }

    // Variant - type-safe with fixed overhead
    {
        auto start = std::chrono::high_resolution_clock::now();
        std::variant<int, double, std::string> var;
        for (int i = 0; i < iterations; ++i) {
            var = i;
            volatile int x = std::get<int>(var);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        std::cout << "Variant: " << duration.count() << " us\n";
    }

    // Any - possible heap allocation
    {
        auto start = std::chrono::high_resolution_clock::now();
        std::any a;
        for (int i = 0; i < iterations; ++i) {
            a = i;
            volatile int x = std::any_cast<int>(a);
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        std::cout << "Any: " << duration.count() << " us\n";
    }
}
```

## Best Practices

### Prefer optional over Pointers for Optional Values

```cpp
// Bad: Using pointers for optional values
User* findUser(int id);  // Ownership unclear, null check needed

// Good: Using optional
std::optional<User> findUser(int id);  // Clear semantics
```

### Use Visitors for Variant Processing

```cpp
// Bad: Checking each type manually
if (std::holds_alternative<int>(v)) { /*...*/ }
else if (std::holds_alternative<double>(v)) { /*...*/ }

// Good: Use visitor
std::visit([](auto&& val) { /* handle all types */ }, v);
```

### Avoid std::any When Types Are Known

```cpp
// Bad: Using any when types are known
std::any value = 42;

// Good: Use appropriate type
std::optional<int> value = 42;  // If might be empty
std::variant<int, double> value = 42;  // If could be int or double
```

### Handle Empty States Explicitly

```cpp
// Always handle the possibility of empty state
std::optional<int> opt = getValue();
if (opt) {
    use(*opt);
} else {
    handleMissing();
}

// For variants, consider using monostate for "empty" state
std::variant<std::monostate, Data, Error> result;
```

## Summary

C++17's vocabulary types provide powerful, type-safe alternatives to traditional C++ idioms:

- **std::optional** replaces nullable pointers and output parameters with clear "maybe has value" semantics
- **std::variant** provides type-safe unions with exhaustive pattern matching via std::visit
- **std::any** offers type erasure for truly dynamic scenarios where compile-time types are unknown

Choose the most restrictive type that fits your needs: `optional` for single-type optionality, `variant` for known type sets, and `any` only when necessary. This approach maximizes type safety and performance while maintaining clean, expressive code.
