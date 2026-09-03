---
title: C++20 Concepts
description: Learn C++20 Concepts to constrain template parameters for clearer generic programming
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - Concepts
  - C++20
  - templates
status: imported
origin: old/src/content/docs/cpp/concepts.en.md
divergence: 0.219
issues: []
legacy:
  category: Cpp
  subcategory: C++20
  order: 20
  lastUpdated: 2026-01-07
---

C++20 Concepts represent one of the most significant additions to the C++ language, fundamentally transforming how we write and constrain templates. Concepts provide a declarative way to express requirements on template parameters, resulting in clearer code, better error messages, and more maintainable generic programming.

## Introduction to Concepts

### What Are Concepts?

**Concepts** are named compile-time predicates that constrain template parameters. They define requirements that types must satisfy to be used with a particular template. Think of concepts as contracts that specify what capabilities a type must have.

Before C++20, constraining templates relied on techniques like:
- **SFINAE** (Substitution Failure Is Not An Error): Powerful but cryptic
- **static_assert**: Produces errors but with limited context
- **std::enable_if**: Verbose and hard to read

Concepts solve these problems by providing:
- Clear, readable syntax for expressing type requirements
- Dramatically improved error messages
- Self-documenting code
- Composable constraints

### Historical Background

The idea of concepts dates back to the early days of C++ templates. They were originally proposed for C++11 but were removed due to complexity. After years of refinement and simplification, concepts finally made it into C++20.

```cpp
// C++11/14/17: Using SFINAE to constrain templates
template<typename T,
         typename = std::enable_if_t<std::is_integral_v<T>>>
T add_old(T a, T b) {
    return a + b;
}

// C++20: Using concepts to constrain templates
template<std::integral T>
T add_new(T a, T b) {
    return a + b;
}
```

The difference is striking. The concept version is shorter and immediately communicates the intent: this function works with integral types.

### Problems Solved by Concepts

1. **Incomprehensible Template Errors**: Traditional template errors can span hundreds of lines and are notoriously difficult to understand
2. **Hidden Type Requirements**: With SFINAE, type requirements are buried in implementation details
3. **Lack of Self-Documentation**: Requirements are not explicit in the interface
4. **Difficult Constraint Reuse**: Same constraints must be written repeatedly

## Core Principles

### The Nature of Concepts

A concept is essentially a compile-time boolean expression. When a template is instantiated, the concept is evaluated. If it evaluates to `true`, the template can be used; otherwise, the compiler produces a clear error message.

```cpp
#include <concepts>

// General form of a concept definition
template<typename T>
concept MyConcept = /* compile-time boolean expression */;

// A concept using type traits
template<typename T>
concept Integral = std::is_integral_v<T>;

// A concept using requires expressions
template<typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::same_as<T>;
};
```

### Requires Expressions

The `requires` expression is the primary tool for defining concepts. It can check:

1. **Simple Requirements**: Whether an expression is valid
2. **Type Requirements**: Whether a type exists
3. **Compound Requirements**: Expression validity with return type constraints
4. **Nested Requirements**: Additional compile-time predicates

```cpp
template<typename T>
concept Container = requires(T c) {
    // Simple requirements: expressions must be valid
    c.begin();
    c.end();
    c.size();

    // Type requirements: types must exist
    typename T::value_type;
    typename T::iterator;

    // Compound requirements: check return types
    { c.size() } -> std::convertible_to<std::size_t>;
    { c.empty() } -> std::same_as<bool>;

    // Nested requirements: additional compile-time predicates
    requires std::same_as<
        decltype(c.begin()),
        typename T::iterator
    >;
};
```

### Constraint Evaluation Order

When multiple constraints exist, the compiler evaluates them as follows:

1. Atomic constraints are evaluated in logical order
2. Conjunctions (`&&`) are evaluated left-to-right with short-circuit behavior
3. Disjunctions (`||`) are evaluated left-to-right with short-circuit behavior

```cpp
template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template<typename T>
concept SignedNumeric = Numeric<T> && std::is_signed_v<T>;
```

### Subsumption

Concepts support subsumption relationships, allowing the compiler to select the "more constrained" overload during overload resolution:

```cpp
#include <concepts>
#include <iostream>

template<typename T>
concept Printable = requires(std::ostream& os, T t) {
    { os << t } -> std::same_as<std::ostream&>;
};

template<typename T>
concept PrintableAndComparable = Printable<T> && requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

// Less constrained version
template<Printable T>
void process(T value) {
    std::cout << "Printable: " << value << std::endl;
}

// More constrained version - preferred when applicable
template<PrintableAndComparable T>
void process(T value) {
    std::cout << "PrintableAndComparable: " << value << std::endl;
}

int main() {
    process(42);  // Calls PrintableAndComparable version
    // int satisfies both, but the more constrained version is selected
    return 0;
}
```

## Defining Concepts

### Basic Syntax

```cpp
// Basic syntax
template<typename T>
concept ConceptName = constraint-expression;

// Using type traits
template<typename T>
concept Integral = std::is_integral_v<T>;

// Using requires expressions
template<typename T>
concept Hashable = requires(T t) {
    { std::hash<T>{}(t) } -> std::convertible_to<std::size_t>;
};

// Combining concepts
template<typename T>
concept Number = std::integral<T> || std::floating_point<T>;
```

### Concepts with Multiple Type Parameters

```cpp
template<typename T, typename U>
concept Addable = requires(T t, U u) {
    { t + u };
};

template<typename From, typename To>
concept ExplicitlyConvertible = requires(From f) {
    static_cast<To>(f);
};

template<typename T, typename U>
concept SameSize = sizeof(T) == sizeof(U);
```

### Concepts Using Other Concepts

```cpp
template<typename T>
concept Incrementable = requires(T t) {
    { ++t } -> std::same_as<T&>;
    { t++ } -> std::same_as<T>;
};

template<typename T>
concept Decrementable = requires(T t) {
    { --t } -> std::same_as<T&>;
    { t-- } -> std::same_as<T>;
};

// Combining concepts
template<typename T>
concept BidirectionallyModifiable = Incrementable<T> && Decrementable<T>;
```

## Using Concepts

### Four Ways to Apply Concepts

C++20 provides four syntactic forms for applying concepts to templates:

```cpp
#include <concepts>

// Method 1: Requires clause after template parameters
template<typename T>
requires std::integral<T>
T gcd(T a, T b) {
    return b == 0 ? a : gcd(b, a % b);
}

// Method 2: Trailing requires clause
template<typename T>
T lcm(T a, T b) requires std::integral<T> {
    return (a / gcd(a, b)) * b;
}

// Method 3: Concept as template parameter constraint
template<std::integral T>
T factorial(T n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

// Method 4: Abbreviated function template syntax (most concise)
auto square(std::integral auto n) {
    return n * n;
}
```

### Constraining Class Templates

```cpp
#include <concepts>
#include <vector>
#include <iostream>

// Constrained class template
template<std::integral T>
class IntegerContainer {
private:
    std::vector<T> data;
public:
    void add(T value) { data.push_back(value); }
    T sum() const {
        T total = 0;
        for (const auto& v : data) total += v;
        return total;
    }
};

// Class template specialization with concepts
template<typename T>
class Serializer {
public:
    static std::string serialize(const T& value) {
        return "generic";
    }
};

template<std::integral T>
class Serializer<T> {
public:
    static std::string serialize(T value) {
        return std::to_string(value);
    }
};
```

### Constraining Member Functions

```cpp
template<typename T>
concept Printable = requires(std::ostream& os, const T& t) {
    { os << t } -> std::same_as<std::ostream&>;
};

template<typename T>
class Container {
    T value;
public:
    Container(T v) : value(v) {}

    // This function only exists when T satisfies Printable
    void print() requires Printable<T> {
        std::cout << value << std::endl;
    }

    // Alternative trailing syntax
    T doubled() const requires std::integral<T> {
        return value * 2;
    }
};
```

## Requires Expressions

### The Four Types of Requirements

```cpp
template<typename T>
concept FullyFeatured = requires(T a, T b) {
    // 1. Simple requirements: expression must be valid
    a + b;
    a - b;
    *a;

    // 2. Type requirements: type must exist
    typename T::value_type;
    typename T::iterator;
    typename std::remove_reference_t<T>;

    // 3. Compound requirements: check expression return type
    { a + b } -> std::same_as<T>;
    { a < b } -> std::convertible_to<bool>;
    { a.size() } noexcept -> std::same_as<std::size_t>;

    // 4. Nested requirements: additional compile-time predicates
    requires std::is_default_constructible_v<T>;
    requires sizeof(T) >= 4;
};
```

### Simple Requirements

Simple requirements verify that an expression is valid (compiles):

```cpp
template<typename T>
concept Dereferenceable = requires(T t) {
    *t;          // Must be able to dereference
    t.operator->(); // Must have arrow operator (optional)
};

template<typename T>
concept HasSubscript = requires(T t, std::size_t i) {
    t[i];        // Must support subscript operator
};
```

### Type Requirements

Type requirements verify that a type exists:

```cpp
template<typename T>
concept HasIterator = requires {
    typename T::iterator;
    typename T::const_iterator;
    typename T::value_type;
};

template<typename T>
concept HasTraits = requires {
    typename std::iterator_traits<T>::value_type;
    typename std::iterator_traits<T>::difference_type;
};
```

### Compound Requirements

Compound requirements check both expression validity and return type:

```cpp
template<typename T>
concept Comparable = requires(T a, T b) {
    // Expression must be valid and return type must be convertible to bool
    { a == b } -> std::convertible_to<bool>;
    { a != b } -> std::convertible_to<bool>;
    { a < b } -> std::convertible_to<bool>;
    { a <= b } -> std::convertible_to<bool>;
    { a > b } -> std::convertible_to<bool>;
    { a >= b } -> std::convertible_to<bool>;
};

template<typename T>
concept StringLike = requires(T t) {
    { t.size() } -> std::convertible_to<std::size_t>;
    { t.empty() } -> std::same_as<bool>;
    { t.c_str() } -> std::same_as<const char*>;
    { t[0] } -> std::convertible_to<char>;
};
```

### Nested Requirements

Nested requirements allow additional compile-time conditions:

```cpp
template<typename T>
concept SmallObject = requires {
    requires sizeof(T) <= 16;
    requires alignof(T) <= alignof(std::max_align_t);
};

template<typename T>
concept RegularNumeric = requires(T t) {
    requires std::regular<T>;
    requires std::is_arithmetic_v<T>;
    { t + t } -> std::same_as<T>;
    { t - t } -> std::same_as<T>;
    { t * t } -> std::same_as<T>;
    { t / t } -> std::same_as<T>;
};
```

### The noexcept Specifier in Compound Requirements

```cpp
template<typename T>
concept NothrowCopyable = requires(T t) {
    { T(t) } noexcept;                    // Copy constructor is noexcept
};

template<typename T>
concept NothrowMoveable = requires(T t) {
    { T(std::move(t)) } noexcept;         // Move constructor is noexcept
};

template<typename T>
concept NothrowSwappable = requires(T a, T b) {
    { std::swap(a, b) } noexcept;
};
```

## Standard Library Concepts

C++20 provides a rich set of standard concepts in the `<concepts>` header:

### Core Language Concepts

| Concept | Description |
|---------|-------------|
| `same_as<T, U>` | T and U are the same type |
| `derived_from<Derived, Base>` | Derived is derived from Base |
| `convertible_to<From, To>` | From is implicitly convertible to To |
| `common_reference_with<T, U>` | T and U share a common reference type |
| `common_with<T, U>` | T and U share a common type |

### Comparison Concepts

| Concept | Description |
|---------|-------------|
| `equality_comparable<T>` | Supports == and != |
| `equality_comparable_with<T, U>` | T and U can be compared for equality |
| `totally_ordered<T>` | Supports all comparison operators |
| `totally_ordered_with<T, U>` | T and U can be totally ordered |
| `three_way_comparable<T>` | Supports <=> (spaceship operator) |

### Object Concepts

| Concept | Description |
|---------|-------------|
| `movable<T>` | Can be moved and swapped |
| `copyable<T>` | Can be copied, moved, and swapped |
| `semiregular<T>` | Copyable and default constructible |
| `regular<T>` | Semiregular and equality comparable |

### Callable Concepts

| Concept | Description |
|---------|-------------|
| `invocable<F, Args...>` | F can be invoked with Args |
| `regular_invocable<F, Args...>` | Invocable with no side effects |
| `predicate<F, Args...>` | Returns a boolean-like value |
| `relation<R, T, U>` | Binary relation between T and U |
| `equivalence_relation<R, T, U>` | Equivalence relation |
| `strict_weak_order<R, T, U>` | Strict weak ordering |

### Arithmetic Concepts

| Concept | Description |
|---------|-------------|
| `integral<T>` | Integer type |
| `signed_integral<T>` | Signed integer type |
| `unsigned_integral<T>` | Unsigned integer type |
| `floating_point<T>` | Floating-point type |

### Example: Using Standard Concepts

```cpp
#include <concepts>
#include <iostream>
#include <vector>
#include <algorithm>

// Using standard concepts
template<std::integral T>
T gcd(T a, T b) {
    while (b != 0) {
        T temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

template<std::floating_point T>
T average(const std::vector<T>& values) {
    if (values.empty()) return T{};
    T sum = 0;
    for (const auto& v : values) {
        sum += v;
    }
    return sum / static_cast<T>(values.size());
}

template<std::totally_ordered T>
T clamp(T value, T min, T max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

template<std::regular T>
class Optional {
    alignas(T) unsigned char storage[sizeof(T)];
    bool has_value = false;

public:
    Optional() = default;

    Optional(const T& value) : has_value(true) {
        new (storage) T(value);
    }

    ~Optional() {
        if (has_value) {
            reinterpret_cast<T*>(storage)->~T();
        }
    }

    bool empty() const { return !has_value; }

    T& value() {
        if (!has_value) throw std::runtime_error("No value");
        return *reinterpret_cast<T*>(storage);
    }
};

int main() {
    std::cout << "GCD(48, 18) = " << gcd(48, 18) << std::endl;

    std::vector<double> values = {1.0, 2.0, 3.0, 4.0, 5.0};
    std::cout << "Average = " << average(values) << std::endl;

    std::cout << "Clamp(15, 0, 10) = " << clamp(15, 0, 10) << std::endl;

    return 0;
}
```

## Advanced Topics

### Concept Composition and Refinement

```cpp
// Base concepts
template<typename T>
concept Drawable = requires(T t) {
    t.draw();
};

template<typename T>
concept Resizable = requires(T t, int w, int h) {
    t.resize(w, h);
};

template<typename T>
concept Colorable = requires(T t, unsigned int color) {
    t.setColor(color);
};

// Refined concepts
template<typename T>
concept Shape = Drawable<T> && requires(T t) {
    { t.area() } -> std::floating_point;
    { t.perimeter() } -> std::floating_point;
};

template<typename T>
concept ResizableShape = Shape<T> && Resizable<T>;

template<typename T>
concept ColoredShape = Shape<T> && Colorable<T>;

template<typename T>
concept FullFeaturedShape = ResizableShape<T> && Colorable<T>;
```

### Constrained Auto

```cpp
// Constrained auto in variable declarations
std::integral auto x = 42;        // OK: int is integral
// std::integral auto y = 3.14;   // Error: double is not integral

// Constrained auto in function parameters
void process(std::integral auto value) {
    std::cout << "Processing: " << value << std::endl;
}

// Constrained auto in return types
std::floating_point auto computePi() {
    return 3.14159265358979;
}

// Multiple constrained auto parameters
auto multiply(std::integral auto a, std::floating_point auto b) {
    return a * b;  // Returns a floating-point type
}
```

### Requires Clause vs Requires Expression

Understanding the difference is crucial:

```cpp
// Requires clause: constrains a template
template<typename T>
requires std::integral<T>  // This is a requires CLAUSE
T foo(T x) { return x; }

// Requires expression: defines constraint conditions
template<typename T>
concept Addable = requires(T a, T b) {  // This is a requires EXPRESSION
    a + b;
};

// Nested: requires clause containing a requires expression
template<typename T>
requires requires(T t) { t.foo(); }  // Clause + Expression
void bar(T t) { t.foo(); }
```

### Disjunctions in Concepts

```cpp
template<typename T>
concept StringOrNumeric =
    std::same_as<T, std::string> ||
    std::integral<T> ||
    std::floating_point<T>;

template<StringOrNumeric T>
void print(const T& value) {
    std::cout << value << std::endl;
}

// More complex disjunction
template<typename T>
concept Indexable = requires(T t, std::size_t i) {
    { t[i] };
} || requires(T t, std::size_t i) {
    { t.at(i) };
};
```

### Concepts and Overload Resolution

```cpp
#include <concepts>
#include <iostream>

// Three overloads with different constraint levels
template<typename T>
void process(T value) {
    std::cout << "Unconstrained: " << value << std::endl;
}

template<std::integral T>
void process(T value) {
    std::cout << "Integral: " << value << std::endl;
}

template<std::signed_integral T>
void process(T value) {
    std::cout << "Signed Integral: " << value << std::endl;
}

int main() {
    process(3.14);           // Calls unconstrained version
    process(42u);            // Calls integral version (unsigned)
    process(42);             // Calls signed_integral version (most constrained)
    process("hello");        // Calls unconstrained version
    return 0;
}
```

### Concepts with Non-Type Template Parameters

```cpp
template<typename T, std::size_t N>
concept FixedSizeContainer = requires(T t) {
    { t.size() } -> std::same_as<std::size_t>;
    requires (t.size() == N);
};

template<typename T, auto Value>
concept HasStaticMember = requires {
    { T::value } -> std::same_as<decltype(Value)>;
    requires (T::value == Value);
};
```

## Best Practices

### Prefer Standard Library Concepts

```cpp
// Good: Use standard library concepts
template<std::integral T>
T add(T a, T b) { return a + b; }

// Avoid: Redefining existing concepts
template<typename T>
concept MyIntegral = std::is_integral_v<T>;  // Unnecessary
```

### Use Adjective-Style Naming

```cpp
// Good: Adjective form
template<typename T>
concept Printable = /* ... */;

template<typename T>
concept Sortable = /* ... */;

template<typename T>
concept Hashable = /* ... */;

// Avoid: Noun form
template<typename T>
concept Printer = /* ... */;  // Less clear
```

### Keep Concepts Atomic

```cpp
// Good: Small, focused concepts
template<typename T>
concept Addable = requires(T a, T b) { a + b; };

template<typename T>
concept Subtractable = requires(T a, T b) { a - b; };

template<typename T>
concept Arithmetic = Addable<T> && Subtractable<T>;

// Avoid: Overly complex single concepts
template<typename T>
concept DoesEverything = requires(T t) {
    t.add(); t.subtract(); t.multiply(); t.divide();
    t.print(); t.serialize(); t.hash();
    // Too many requirements in one concept
};
```

### Use Concepts Instead of enable_if

```cpp
// Good: Using concepts
template<std::integral T>
T process(T value) { return value * 2; }

// Avoid: Using enable_if
template<typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
T process_old(T value) { return value * 2; }
```

### Make Constraints Explicit in Interfaces

```cpp
// Good: Constraints are clearly visible
template<std::ranges::random_access_range R>
requires std::sortable<std::ranges::iterator_t<R>>
void sort_range(R& range);

// Good: Using abbreviated syntax
void sort_range(std::ranges::random_access_range auto& range)
requires std::sortable<std::ranges::iterator_t<decltype(range)>>;
```

### Document Custom Concepts

```cpp
/**
 * @brief Represents a serializable type
 *
 * To satisfy this concept, type T must:
 * - Provide a serialize() member function taking ostream&
 * - Provide a static deserialize() function taking istream& and returning T
 * - Support equality comparison
 */
template<typename T>
concept Serializable = requires(T t, std::ostream& os, std::istream& is) {
    { t.serialize(os) } -> std::same_as<void>;
    { T::deserialize(is) } -> std::same_as<T>;
    { t == t } -> std::convertible_to<bool>;
};
```

### Use the Most Appropriate Syntax

```cpp
// For simple constraints, use abbreviated syntax
void print(std::integral auto value);

// For complex constraints, use requires clause
template<typename T>
requires std::integral<T> && (sizeof(T) >= 4)
void process(T value);

// For reusable constraints, define a concept
template<typename T>
concept LargeIntegral = std::integral<T> && (sizeof(T) >= 4);

template<LargeIntegral T>
void process(T value);
```

## Common Pitfalls

### Confusing Requires Expression and Requires Clause

```cpp
// Requires clause: constrains the template
template<typename T>
requires std::integral<T>  // This is a requires CLAUSE
T foo(T x) { return x; }

// Requires expression: defines constraint conditions
template<typename T>
concept Addable = requires(T a, T b) {  // This is a requires EXPRESSION
    a + b;
};

// Common mistake: nested requires requires
template<typename T>
requires requires(T t) { t.foo(); }  // requires clause + requires expression
void bar(T t) { t.foo(); }
```

### Side Effects in Concepts

```cpp
// Wrong: Concepts should not have side effects
int global_counter = 0;

template<typename T>
concept BadConcept = requires(T t) {
    { ++global_counter, t.foo() };  // Side effect!
};

// Correct: Concepts should be pure
template<typename T>
concept GoodConcept = requires(T t) {
    t.foo();
};
```

### Over-Constraining

```cpp
// Over-constrained: requires too much
template<typename T>
concept OverConstrained = requires(T t) {
    { t.method1() } -> std::same_as<int>;
    { t.method2() } -> std::same_as<void>;
    { t.method3() } -> std::same_as<std::string>;
    // Unless all these are truly needed, this is too strict
};

// Appropriately constrained: only what's needed
template<typename T>
concept JustRight = requires(T t) {
    t.process();  // Only constrain what's actually needed
};
```

### Forgetting Return Type Constraints

```cpp
template<typename T>
concept Problematic = requires(T t) {
    t.size();  // Only checks validity, not return type
};

template<typename T>
concept Better = requires(T t) {
    { t.size() } -> std::convertible_to<std::size_t>;  // Also checks return type
};
```

### Concepts Don't Check Runtime Behavior

```cpp
// Concepts only check syntax, not semantics
template<typename T>
concept Comparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

struct BadComparable {
    bool operator<(const BadComparable&) const {
        return rand() % 2;  // Non-deterministic - concept can't detect this!
    }
};

static_assert(Comparable<BadComparable>);  // Compiles, but behavior is wrong
```

### Circular Concept Definitions

```cpp
// Wrong: Circular definition
template<typename T>
concept A = B<T>;  // A depends on B

template<typename T>
concept B = A<T>;  // B depends on A - Compilation error!

// Correct: Build hierarchy from base concepts
template<typename T>
concept Base = std::is_class_v<T>;

template<typename T>
concept Derived = Base<T> && requires(T t) { t.extra(); };
```

### Assuming Concepts Affect Runtime

```cpp
// Concepts have zero runtime cost
template<std::integral T>
T add(T a, T b) { return a + b; }

// Generated code is identical to unconstrained version
template<typename T>
T add_unconstrained(T a, T b) { return a + b; }

// Both produce the same assembly for the same types
```

## Real-World Examples

### Example 1: Type-Safe Configuration System

```cpp
#include <concepts>
#include <string>
#include <map>
#include <variant>
#include <iostream>
#include <stdexcept>

// Define valid configuration value types
template<typename T>
concept ConfigValue = std::same_as<T, int> ||
                      std::same_as<T, double> ||
                      std::same_as<T, bool> ||
                      std::same_as<T, std::string>;

// Define configuration key types
template<typename T>
concept ConfigKey = std::convertible_to<T, std::string>;

class Configuration {
    using Value = std::variant<int, double, bool, std::string>;
    std::map<std::string, Value> data;

public:
    // Only accepts valid configuration value types
    template<ConfigKey K, ConfigValue V>
    void set(K&& key, V&& value) {
        data[std::string(std::forward<K>(key))] = std::forward<V>(value);
    }

    // Type-safe getter
    template<ConfigValue V, ConfigKey K>
    V get(K&& key) const {
        auto it = data.find(std::string(std::forward<K>(key)));
        if (it == data.end()) {
            throw std::runtime_error("Key not found: " + std::string(key));
        }
        return std::get<V>(it->second);
    }

    // Getter with default value
    template<ConfigValue V, ConfigKey K>
    V get_or(K&& key, V default_value) const {
        auto it = data.find(std::string(std::forward<K>(key)));
        if (it == data.end()) {
            return default_value;
        }
        try {
            return std::get<V>(it->second);
        } catch (const std::bad_variant_access&) {
            return default_value;
        }
    }
};

int main() {
    Configuration config;

    config.set("server.port", 8080);
    config.set("server.host", std::string("localhost"));
    config.set("debug.enabled", true);
    config.set("timeout.seconds", 30.5);

    std::cout << "Port: " << config.get<int>("server.port") << std::endl;
    std::cout << "Host: " << config.get<std::string>("server.host") << std::endl;
    std::cout << "Debug: " << config.get<bool>("debug.enabled") << std::endl;

    // Using default values
    std::cout << "Max connections: "
              << config.get_or<int>("max.connections", 100) << std::endl;

    // Compile error: std::vector<int> is not a ConfigValue
    // config.set("invalid", std::vector<int>{1, 2, 3});

    return 0;
}
```

### Example 2: Generic Container Utilities

```cpp
#include <concepts>
#include <iostream>
#include <vector>
#include <list>
#include <array>
#include <string>

// Iterable concept
template<typename T>
concept Iterable = requires(T t) {
    { t.begin() } -> std::input_or_output_iterator;
    { t.end() } -> std::input_or_output_iterator;
};

// Container concept
template<typename T>
concept Container = Iterable<T> && requires(T t) {
    typename T::value_type;
    typename T::size_type;
    { t.size() } -> std::convertible_to<typename T::size_type>;
    { t.empty() } -> std::same_as<bool>;
};

// Resizable container concept
template<typename T>
concept ResizableContainer = Container<T> && requires(T t, typename T::value_type v) {
    t.push_back(v);
    t.pop_back();
    { t.front() } -> std::same_as<typename T::value_type&>;
    { t.back() } -> std::same_as<typename T::value_type&>;
};

// Random access container concept
template<typename T>
concept RandomAccessContainer = Container<T> && requires(T t, typename T::size_type i) {
    { t[i] } -> std::same_as<typename T::value_type&>;
};

// Generic container print function
template<Container C>
void print_container(const C& container, const std::string& name) {
    std::cout << name << ": [";
    bool first = true;
    for (const auto& elem : container) {
        if (!first) std::cout << ", ";
        std::cout << elem;
        first = false;
    }
    std::cout << "]" << std::endl;
}

// Only accepts resizable containers
template<ResizableContainer C>
void append_elements(C& container, std::initializer_list<typename C::value_type> elements) {
    for (const auto& elem : elements) {
        container.push_back(elem);
    }
}

// Only accepts random access containers
template<RandomAccessContainer C>
typename C::value_type middle_element(const C& container) {
    if (container.empty()) {
        throw std::runtime_error("Container is empty");
    }
    return container[container.size() / 2];
}

int main() {
    std::vector<int> vec = {1, 2, 3};
    std::list<int> lst = {4, 5, 6};
    std::array<int, 3> arr = {7, 8, 9};

    print_container(vec, "vector");
    print_container(lst, "list");
    print_container(arr, "array");

    // append_elements only accepts resizable containers
    append_elements(vec, {4, 5});
    append_elements(lst, {7, 8});
    // append_elements(arr, {10}); // Compile error: array is not ResizableContainer

    print_container(vec, "vector after append");
    print_container(lst, "list after append");

    // middle_element only accepts random access containers
    std::cout << "Middle of vector: " << middle_element(vec) << std::endl;
    std::cout << "Middle of array: " << middle_element(arr) << std::endl;
    // middle_element(lst); // Compile error: list is not RandomAccessContainer

    return 0;
}
```

### Example 3: Mathematical Vector Library

```cpp
#include <concepts>
#include <cmath>
#include <iostream>
#include <array>

// Arithmetic type concept
template<typename T>
concept Arithmetic = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
    { a - b } -> std::convertible_to<T>;
    { a * b } -> std::convertible_to<T>;
    { a / b } -> std::convertible_to<T>;
};

template<typename T>
concept FloatingPointArithmetic = Arithmetic<T> && std::floating_point<T>;

// Vector class template
template<Arithmetic T, std::size_t N>
class Vec {
    std::array<T, N> data;

public:
    constexpr Vec() : data{} {}

    constexpr Vec(std::initializer_list<T> init) {
        std::size_t i = 0;
        for (auto v : init) {
            if (i < N) data[i++] = v;
        }
    }

    constexpr T& operator[](std::size_t i) { return data[i]; }
    constexpr const T& operator[](std::size_t i) const { return data[i]; }

    constexpr std::size_t size() const { return N; }

    // Vector addition
    constexpr Vec operator+(const Vec& other) const {
        Vec result;
        for (std::size_t i = 0; i < N; ++i) {
            result[i] = data[i] + other[i];
        }
        return result;
    }

    // Vector subtraction
    constexpr Vec operator-(const Vec& other) const {
        Vec result;
        for (std::size_t i = 0; i < N; ++i) {
            result[i] = data[i] - other[i];
        }
        return result;
    }

    // Scalar multiplication
    constexpr Vec operator*(T scalar) const {
        Vec result;
        for (std::size_t i = 0; i < N; ++i) {
            result[i] = data[i] * scalar;
        }
        return result;
    }

    // Dot product
    constexpr T dot(const Vec& other) const {
        T result{};
        for (std::size_t i = 0; i < N; ++i) {
            result = result + data[i] * other[i];
        }
        return result;
    }

    // Magnitude (only for floating-point types)
    T magnitude() const requires FloatingPointArithmetic<T> {
        return std::sqrt(dot(*this));
    }

    // Normalization (only for floating-point types)
    Vec normalized() const requires FloatingPointArithmetic<T> {
        T mag = magnitude();
        if (mag == T{}) return *this;
        return *this * (T{1} / mag);
    }

    // Print
    void print(const char* name = "Vec") const {
        std::cout << name << "(";
        for (std::size_t i = 0; i < N; ++i) {
            if (i > 0) std::cout << ", ";
            std::cout << data[i];
        }
        std::cout << ")" << std::endl;
    }
};

// Cross product (only for 3D vectors)
template<Arithmetic T>
constexpr Vec<T, 3> cross(const Vec<T, 3>& a, const Vec<T, 3>& b) {
    return Vec<T, 3>{
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    };
}

// Type aliases
using Vec2f = Vec<float, 2>;
using Vec3f = Vec<float, 3>;
using Vec4f = Vec<float, 4>;
using Vec2d = Vec<double, 2>;
using Vec3d = Vec<double, 3>;
using Vec2i = Vec<int, 2>;
using Vec3i = Vec<int, 3>;

int main() {
    Vec3f a{1.0f, 2.0f, 3.0f};
    Vec3f b{4.0f, 5.0f, 6.0f};

    a.print("a");
    b.print("b");

    auto sum = a + b;
    sum.print("a + b");

    auto diff = a - b;
    diff.print("a - b");

    auto scaled = a * 2.0f;
    scaled.print("a * 2");

    std::cout << "a . b = " << a.dot(b) << std::endl;
    std::cout << "|a| = " << a.magnitude() << std::endl;

    auto normalized = a.normalized();
    normalized.print("normalize(a)");
    std::cout << "|normalize(a)| = " << normalized.magnitude() << std::endl;

    auto c = cross(a, b);
    c.print("a x b");

    // Integer vectors
    Vec3i vi{1, 2, 3};
    Vec3i vj{4, 5, 6};
    auto vi_sum = vi + vj;
    vi_sum.print("vi + vj");

    // The following would cause a compile error: int is not FloatingPointArithmetic
    // std::cout << vi.magnitude() << std::endl;

    return 0;
}
```

### Example 4: Plugin System

```cpp
#include <concepts>
#include <string>
#include <memory>
#include <vector>
#include <iostream>

// Define plugin interface concept
template<typename T>
concept Plugin = requires(T plugin) {
    { plugin.name() } -> std::convertible_to<std::string>;
    { plugin.version() } -> std::convertible_to<std::string>;
    { plugin.initialize() } -> std::same_as<bool>;
    { plugin.shutdown() } -> std::same_as<void>;
};

// Data processor plugin
template<typename T, typename DataType>
concept DataProcessor = Plugin<T> && requires(T plugin, DataType& data) {
    { plugin.process(data) } -> std::same_as<bool>;
};

// Configurable plugin
template<typename T>
concept ConfigurablePlugin = Plugin<T> &&
    requires(T plugin, const std::string& key, const std::string& value) {
    { plugin.configure(key, value) } -> std::same_as<void>;
    { plugin.get_config(key) } -> std::convertible_to<std::string>;
};

// Plugin manager
class PluginManager {
    struct PluginWrapper {
        virtual ~PluginWrapper() = default;
        virtual std::string name() const = 0;
        virtual std::string version() const = 0;
        virtual bool initialize() = 0;
        virtual void shutdown() = 0;
    };

    template<Plugin P>
    struct ConcreteWrapper : PluginWrapper {
        P plugin;

        template<typename... Args>
        ConcreteWrapper(Args&&... args) : plugin(std::forward<Args>(args)...) {}

        std::string name() const override { return plugin.name(); }
        std::string version() const override { return plugin.version(); }
        bool initialize() override { return plugin.initialize(); }
        void shutdown() override { plugin.shutdown(); }
    };

    std::vector<std::unique_ptr<PluginWrapper>> plugins;

public:
    template<Plugin P, typename... Args>
    void register_plugin(Args&&... args) {
        plugins.push_back(
            std::make_unique<ConcreteWrapper<P>>(std::forward<Args>(args)...)
        );
    }

    void initialize_all() {
        for (auto& plugin : plugins) {
            std::cout << "Initializing: " << plugin->name()
                      << " v" << plugin->version() << std::endl;
            if (!plugin->initialize()) {
                std::cerr << "Failed to initialize: " << plugin->name() << std::endl;
            }
        }
    }

    void shutdown_all() {
        for (auto& plugin : plugins) {
            std::cout << "Shutting down: " << plugin->name() << std::endl;
            plugin->shutdown();
        }
    }
};

// Example plugin implementations
class LoggingPlugin {
public:
    std::string name() const { return "Logging"; }
    std::string version() const { return "1.0.0"; }

    bool initialize() {
        std::cout << "  Logging plugin initialized" << std::endl;
        return true;
    }

    void shutdown() {
        std::cout << "  Logging plugin shutdown" << std::endl;
    }
};

class MetricsPlugin {
    std::string endpoint;
public:
    MetricsPlugin(std::string ep) : endpoint(std::move(ep)) {}

    std::string name() const { return "Metrics"; }
    std::string version() const { return "2.0.0"; }

    bool initialize() {
        std::cout << "  Metrics plugin initialized, endpoint: " << endpoint << std::endl;
        return true;
    }

    void shutdown() {
        std::cout << "  Metrics plugin shutdown" << std::endl;
    }
};

// Verify concepts
static_assert(Plugin<LoggingPlugin>);
static_assert(Plugin<MetricsPlugin>);

int main() {
    PluginManager manager;

    manager.register_plugin<LoggingPlugin>();
    manager.register_plugin<MetricsPlugin>("http://metrics.example.com");

    std::cout << "=== Initializing plugins ===" << std::endl;
    manager.initialize_all();

    std::cout << "\n=== Shutting down plugins ===" << std::endl;
    manager.shutdown_all();

    return 0;
}
```

## Performance Considerations

### Compile-Time Cost

Concepts are a compile-time feature with no runtime overhead. However, complex concepts may increase compilation time:

```cpp
// Simple concept: fast compilation
template<typename T>
concept Simple = std::integral<T>;

// Complex concept: slower compilation
template<typename T>
concept Complex = requires(T t) {
    typename T::value_type;
    typename T::iterator;
    typename T::const_iterator;
    { t.begin() } -> std::same_as<typename T::iterator>;
    { t.end() } -> std::same_as<typename T::iterator>;
    { t.cbegin() } -> std::same_as<typename T::const_iterator>;
    { t.cend() } -> std::same_as<typename T::const_iterator>;
    { t.size() } -> std::convertible_to<std::size_t>;
    { t.empty() } -> std::same_as<bool>;
    { t.front() } -> std::same_as<typename T::value_type&>;
    { t.back() } -> std::same_as<typename T::value_type&>;
    requires std::default_initializable<T>;
    requires std::copy_constructible<T>;
    requires std::move_constructible<T>;
};
```

### Concepts vs SFINAE Performance

Concepts typically compile faster than SFINAE because:
1. Concepts fail immediately with a clear error
2. SFINAE needs to continue trying other overloads
3. Compilers can optimize concept evaluation

```cpp
// SFINAE version: may compile slower
template<typename T,
         typename = std::enable_if_t<std::is_integral_v<T> &&
                                     std::is_signed_v<T>>>
void sfinae_version(T) {}

// Concept version: typically compiles faster
template<std::signed_integral T>
void concept_version(T) {}
```

### Zero Runtime Overhead

Concepts don't affect runtime performance - generated code is identical to unconstrained templates:

```cpp
template<std::integral T>
T add(T a, T b) { return a + b; }

// Generated code is identical to:
template<typename T>
T add_unconstrained(T a, T b) { return a + b; }
```

## Compiler Support

C++20 Concepts are fully supported in:
- **GCC 10+**
- **Clang 12+**
- **MSVC 19.28+ (Visual Studio 2019 16.9+)**

## Summary

C++20 Concepts represent a paradigm shift in how we write generic code:

1. **Clarity**: Concepts make template constraints explicit and readable
2. **Better Errors**: Compiler messages clearly indicate which constraints failed
3. **Composability**: Concepts can be combined to create complex requirements
4. **Self-Documentation**: Code becomes its own documentation
5. **Zero Overhead**: All concept checking happens at compile time

Key takeaways:
- Use concepts instead of SFINAE for cleaner, more maintainable code
- Prefer standard library concepts when available
- Keep custom concepts small and focused
- Use the appropriate syntax for your use case
- Remember that concepts only check syntax, not semantics

By mastering concepts, you can write generic C++ code that is both powerful and approachable, with error messages that actually help rather than hinder debugging.

## Further Reading

### Official Documentation
- [cppreference - Concepts](https://en.cppreference.com/w/cpp/language/constraints)
- [cppreference - Standard Library Concepts](https://en.cppreference.com/w/cpp/concepts)
- [ISO C++ - Concepts FAQ](https://isocpp.org/wiki/faq/cpp20-concepts)

### Books
- "C++20 - The Complete Guide" by Nicolai M. Josuttis
- "Professional C++" 5th Edition by Marc Gregoire
- "C++ Templates: The Complete Guide" 2nd Edition

### Related Topics
- [C++20 New Features](/cpp/cpp20)
- [C++ Template Programming](/cpp/templates)
- [SFINAE and Type Traits](/cpp/sfinae)
