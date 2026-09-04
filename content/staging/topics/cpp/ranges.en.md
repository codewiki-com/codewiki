---
title: C++20 Ranges Library
description: "Master C++20 Ranges: range concepts, views, view adapters, lazy evaluation, and range algorithms"
track: cpp
section: modern-cpp
difficulty: advanced
tags:
  - C++
  - C++20
  - Ranges
  - Views
  - Functional Programming
  - Lazy Evaluation
status: imported
origin: old/src/content/docs/cpp/ranges.en.md
divergence: 0.265
issues:
  - missing-subcategory-en
legacy:
  category: Cpp
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-07
---

The C++20 Ranges library represents a fundamental modernization of the traditional STL algorithms. It introduces the Range abstraction, providing a more elegant, composable, and safer approach to data processing. Through lazy evaluation and the pipe operator, Ranges brings functional programming paradigms to modern C++ in a natural and expressive way.

## Concept Explanation

### What is a Range?

A Range is an abstraction representing an iterable sequence of elements. In C++20, any object providing `begin()` and `end()` functions can be viewed as a range. Unlike traditional STL which requires passing iterator pairs, ranges encapsulate both iterators into a unified concept.

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Traditional STL: requires passing two iterators
    std::sort(vec.begin(), vec.end());

    // C++20 Ranges: pass the container directly
    std::ranges::sort(vec);

    // A range is simply an iterable object
    for (int n : vec) {
        std::cout << n << " ";
    }

    return 0;
}
```

### Why Do We Need Ranges?

Traditional STL algorithms have several limitations:

1. **Redundant iterator pairs**: Every algorithm call requires `begin()` and `end()`
2. **Type unsafety**: Easy to pass mismatched iterator pairs
3. **Poor composability**: Chaining operations requires intermediate containers
4. **Eager evaluation**: All operations execute immediately, potentially wasting computation

Ranges solve these problems:

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Traditional approach: intermediate containers, eager evaluation
    std::vector<int> evens;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(evens),
                 [](int n) { return n % 2 == 0; });

    std::vector<int> squares;
    std::transform(evens.begin(), evens.end(),
                   std::back_inserter(squares),
                   [](int n) { return n * n; });

    // Ranges approach: pipeline composition, lazy evaluation
    auto result = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    // Computation only happens during iteration
    for (int n : result) {
        std::cout << n << " ";  // 4 16 36 64 100
    }

    return 0;
}
```

### History and Context

The Ranges library originated from Eric Niebler's Range-v3 library, which began development in 2013. After years of refinement and community feedback, it was standardized in C++20. The Range-v3 design philosophy profoundly influenced the evolution of modern C++.

## Core Principles

### Range Concepts Hierarchy

C++20 defines a hierarchy of range concepts in `<ranges>` that describe the capabilities of different range types:

```cpp
#include <ranges>
#include <vector>
#include <list>
#include <forward_list>

// Range concept hierarchy:
// range                : basic range with begin() and end()
// input_range          : supports single-pass input iteration
// forward_range        : supports multi-pass forward iteration
// bidirectional_range  : supports bidirectional iteration
// random_access_range  : supports random access
// contiguous_range     : elements stored contiguously in memory
// sized_range          : can obtain size in constant time
// common_range         : begin() and end() return same type

template<std::ranges::input_range R>
void process_input_range(R&& r) {
    for (auto&& elem : r) {
        // process element
    }
}

template<std::ranges::random_access_range R>
void process_random_access_range(R&& r) {
    // can use subscript access
    auto size = std::ranges::size(r);
    for (size_t i = 0; i < size; ++i) {
        // r[i] access possible
    }
}

int main() {
    std::vector<int> vec = {1, 2, 3};
    std::list<int> lst = {1, 2, 3};
    std::forward_list<int> flst = {1, 2, 3};

    // vector satisfies all range concepts
    static_assert(std::ranges::contiguous_range<std::vector<int>>);
    static_assert(std::ranges::random_access_range<std::vector<int>>);
    static_assert(std::ranges::sized_range<std::vector<int>>);

    // list is bidirectional but not random access
    static_assert(std::ranges::bidirectional_range<std::list<int>>);
    static_assert(!std::ranges::random_access_range<std::list<int>>);

    // forward_list is only forward
    static_assert(std::ranges::forward_range<std::forward_list<int>>);
    static_assert(!std::ranges::bidirectional_range<std::forward_list<int>>);

    return 0;
}
```

### The Nature of Views

Views are special ranges with distinctive characteristics:

1. **Non-owning**: Views don't own their data; they're a "window" into underlying data
2. **Lazy Evaluation**: Computation deferred until iteration
3. **Lightweight Copying**: O(1) copy and move operations
4. **Composable**: Multiple views can chain via the pipe operator

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // View is lazy - no computation happens yet
    auto view = data
        | std::views::filter([](int n) {
            std::cout << "filter: " << n << std::endl;
            return n % 2 == 0;
        })
        | std::views::transform([](int n) {
            std::cout << "transform: " << n << std::endl;
            return n * n;
        });

    std::cout << "View created, but not yet computed" << std::endl;

    // Computation happens only during iteration
    std::cout << "\nStarting iteration:" << std::endl;
    for (int n : view) {
        std::cout << "Result: " << n << std::endl;
    }

    return 0;
}
```

### The Pipe Operator

The pipe operator `|` is syntactic sugar enabling elegant view composition:

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Pipe operator (recommended)
    auto result1 = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(3);

    // Nested function calls (equivalent but harder to read)
    auto result2 = std::views::take(
        std::views::transform(
            std::views::filter(numbers, [](int n) { return n % 2 == 0; }),
            [](int n) { return n * n; }
        ),
        3
    );

    // Function call syntax (verbose)
    auto filtered = std::views::filter(numbers, [](int n) { return n % 2 == 0; });
    auto transformed = std::views::transform(filtered, [](int n) { return n * n; });
    auto result3 = std::views::take(transformed, 3);

    // Pipe operator is more readable
    for (int n : result1) {
        std::cout << n << " ";  // 4 16 36
    }

    return 0;
}
```

## Key Points

### View Adapters Categories

C++20 Ranges provides rich view adapters, categorized by function:

| Category | Adapters | Purpose |
|----------|----------|---------|
| **Filtering** | `filter` | Select elements matching a predicate |
| **Transformation** | `transform` | Convert each element |
| **Slicing** | `take`, `take_while` | Take first N or elements matching predicate |
| **Skipping** | `drop`, `drop_while` | Skip first N or elements matching predicate |
| **Reversal** | `reverse` | Iterate in reverse order |
| **Flattening** | `join` | Flatten nested ranges |
| **Splitting** | `split` | Split by delimiter |
| **Element Access** | `elements`, `keys`, `values` | Extract tuple/pair elements |

### Range Factories

Range factories create new ranges:

| Factory | Purpose |
|---------|---------|
| `iota(start, end)` | Generate consecutive integer sequence |
| `single(value)` | Single-element range |
| `empty<T>()` | Empty range |
| `repeat(value)` | Repeat element (C++23) |

### Range Algorithms

Range versions of algorithms offer advantages over traditional STL:

1. **Accept ranges as parameters**: No need for iterator pairs
2. **Projection support**: Can specify which member to operate on
3. **Better error messages**: Concept constraints provide clear diagnostics
4. **Unified namespace**: All algorithms under `std::ranges`

## Code Examples

### View Adapters in Detail

#### filter - Filtering Views

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Basic filtering
    auto evens = numbers | std::views::filter([](int n) {
        return n % 2 == 0;
    });

    std::cout << "Even numbers: ";
    for (int n : evens) {
        std::cout << n << " ";  // 2 4 6 8 10
    }
    std::cout << std::endl;

    // Filtering objects
    struct Person {
        std::string name;
        int age;
    };

    std::vector<Person> people = {
        {"Alice", 25}, {"Bob", 17}, {"Charlie", 30}, {"David", 16}
    };

    auto adults = people | std::views::filter([](const Person& p) {
        return p.age >= 18;
    });

    std::cout << "Adults: ";
    for (const auto& p : adults) {
        std::cout << p.name << " ";  // Alice Charlie
    }
    std::cout << std::endl;

    return 0;
}
```

#### transform - Transformation Views

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>
#include <cmath>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // Numeric transformation
    auto squares = numbers | std::views::transform([](int n) {
        return n * n;
    });

    std::cout << "Squares: ";
    for (int n : squares) {
        std::cout << n << " ";  // 1 4 9 16 25
    }
    std::cout << std::endl;

    // Type conversion
    auto as_doubles = numbers | std::views::transform([](int n) {
        return std::sqrt(static_cast<double>(n));
    });

    std::cout << "Square roots: ";
    for (double d : as_doubles) {
        std::cout << d << " ";
    }
    std::cout << std::endl;

    // Member extraction
    struct Product {
        std::string name;
        double price;
    };

    std::vector<Product> products = {
        {"Apple", 5.0}, {"Banana", 3.0}, {"Orange", 4.0}
    };

    auto prices = products | std::views::transform([](const Product& p) {
        return p.price;
    });

    double total = 0;
    for (double price : prices) {
        total += price;
    }
    std::cout << "Total price: " << total << std::endl;  // 12.0

    return 0;
}
```

#### take and drop - Slicing Views

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // take: get first N elements
    auto first_five = numbers | std::views::take(5);
    std::cout << "First 5: ";
    for (int n : first_five) {
        std::cout << n << " ";  // 1 2 3 4 5
    }
    std::cout << std::endl;

    // drop: skip first N elements
    auto after_three = numbers | std::views::drop(3);
    std::cout << "Skip first 3: ";
    for (int n : after_three) {
        std::cout << n << " ";  // 4 5 6 7 8 9 10
    }
    std::cout << std::endl;

    // take_while: take while predicate holds
    auto less_than_five = numbers | std::views::take_while([](int n) {
        return n < 5;
    });
    std::cout << "Less than 5: ";
    for (int n : less_than_five) {
        std::cout << n << " ";  // 1 2 3 4
    }
    std::cout << std::endl;

    // drop_while: skip while predicate holds
    auto from_five = numbers | std::views::drop_while([](int n) {
        return n < 5;
    });
    std::cout << "From 5 onwards: ";
    for (int n : from_five) {
        std::cout << n << " ";  // 5 6 7 8 9 10
    }
    std::cout << std::endl;

    // Pagination: page 2, 3 items per page
    int page = 2, page_size = 3;
    auto page_data = numbers
        | std::views::drop((page - 1) * page_size)
        | std::views::take(page_size);

    std::cout << "Page 2 (3 per page): ";
    for (int n : page_data) {
        std::cout << n << " ";  // 4 5 6
    }
    std::cout << std::endl;

    return 0;
}
```

#### reverse - Reverse Views

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};

    // Reverse iteration
    auto reversed = numbers | std::views::reverse;
    std::cout << "Reversed: ";
    for (int n : reversed) {
        std::cout << n << " ";  // 5 4 3 2 1
    }
    std::cout << std::endl;

    // Reverse a string
    std::string str = "Hello, World!";
    auto reversed_str = str | std::views::reverse;
    std::cout << "Reversed string: ";
    for (char c : reversed_str) {
        std::cout << c;  // !dlroW ,olleH
    }
    std::cout << std::endl;

    // Get last 3 elements
    auto last_three = numbers
        | std::views::reverse
        | std::views::take(3)
        | std::views::reverse;

    std::cout << "Last 3: ";
    for (int n : last_three) {
        std::cout << n << " ";  // 3 4 5
    }
    std::cout << std::endl;

    return 0;
}
```

#### join - Flattening Views

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>

int main() {
    // Flatten nested vector
    std::vector<std::vector<int>> nested = {
        {1, 2, 3},
        {4, 5},
        {6, 7, 8, 9}
    };

    auto flattened = nested | std::views::join;
    std::cout << "Flattened: ";
    for (int n : flattened) {
        std::cout << n << " ";  // 1 2 3 4 5 6 7 8 9
    }
    std::cout << std::endl;

    // Join strings
    std::vector<std::string> words = {"Hello", " ", "World", "!"};
    auto joined = words | std::views::join;
    std::cout << "Joined strings: ";
    for (char c : joined) {
        std::cout << c;  // Hello World!
    }
    std::cout << std::endl;

    return 0;
}
```

#### split - Splitting Views

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string text = "apple,banana,orange,grape";

    // Split by comma
    auto parts = text | std::views::split(',');

    std::cout << "Split results:" << std::endl;
    for (auto part : parts) {
        std::string_view sv(part.begin(), part.end());
        std::cout << "  - " << sv << std::endl;
    }

    // Count words
    std::string sentence = "The quick brown fox jumps";
    auto words = sentence | std::views::split(' ');

    int word_count = 0;
    for (auto word : words) {
        ++word_count;
    }
    std::cout << "Word count: " << word_count << std::endl;  // 5

    return 0;
}
```

#### elements, keys, values - Element Views

```cpp
#include <ranges>
#include <vector>
#include <map>
#include <iostream>
#include <tuple>

int main() {
    // Extract elements from pairs
    std::vector<std::pair<std::string, int>> pairs = {
        {"Alice", 25},
        {"Bob", 30},
        {"Charlie", 35}
    };

    // Extract all keys (first element)
    auto names = pairs | std::views::keys;
    std::cout << "Names: ";
    for (const auto& name : names) {
        std::cout << name << " ";  // Alice Bob Charlie
    }
    std::cout << std::endl;

    // Extract all values (second element)
    auto ages = pairs | std::views::values;
    std::cout << "Ages: ";
    for (int age : ages) {
        std::cout << age << " ";  // 25 30 35
    }
    std::cout << std::endl;

    // Extract from map
    std::map<std::string, double> prices = {
        {"Apple", 5.0},
        {"Banana", 3.0},
        {"Orange", 4.0}
    };

    std::cout << "Products: ";
    for (const auto& key : prices | std::views::keys) {
        std::cout << key << " ";
    }
    std::cout << std::endl;

    // Extract specific index from tuples
    std::vector<std::tuple<int, std::string, double>> records = {
        {1, "A", 10.0},
        {2, "B", 20.0},
        {3, "C", 30.0}
    };

    // Extract first element (index 0)
    auto ids = records | std::views::elements<0>;
    std::cout << "IDs: ";
    for (int id : ids) {
        std::cout << id << " ";  // 1 2 3
    }
    std::cout << std::endl;

    return 0;
}
```

### Range Factories in Detail

```cpp
#include <ranges>
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    // iota: generate consecutive integers
    std::cout << "iota(1, 6): ";
    for (int n : std::views::iota(1, 6)) {
        std::cout << n << " ";  // 1 2 3 4 5
    }
    std::cout << std::endl;

    // Infinite sequence (must combine with take)
    std::cout << "Infinite sequence first 10: ";
    for (int n : std::views::iota(100) | std::views::take(10)) {
        std::cout << n << " ";  // 100 101 102 ... 109
    }
    std::cout << std::endl;

    // single: single-element view
    std::cout << "single(42): ";
    for (int n : std::views::single(42)) {
        std::cout << n << " ";  // 42
    }
    std::cout << std::endl;

    // empty: empty view
    std::cout << "empty<int> count: ";
    int count = 0;
    for (int n : std::views::empty<int>) {
        ++count;
    }
    std::cout << count << std::endl;  // 0

    // Generate arithmetic sequence (first term 5, common difference 3)
    auto arithmetic_sequence = std::views::iota(0, 10)
        | std::views::transform([](int n) { return 5 + n * 3; });

    std::cout << "Arithmetic sequence: ";
    for (int n : arithmetic_sequence) {
        std::cout << n << " ";  // 5 8 11 14 17 20 23 26 29 32
    }
    std::cout << std::endl;

    return 0;
}
```

### Range Algorithms in Detail

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <iostream>
#include <string>

int main() {
    // Basic sorting
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3, 7};

    std::ranges::sort(numbers);
    std::cout << "Sorted: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;

    // Custom comparator
    std::ranges::sort(numbers, std::greater<>{});
    std::cout << "Descending: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;

    // Projection feature - sort by member
    struct Person {
        std::string name;
        int age;
        double salary;
    };

    std::vector<Person> people = {
        {"Alice", 25, 8000},
        {"Bob", 30, 12000},
        {"Charlie", 22, 6000},
        {"David", 35, 15000}
    };

    // Sort by age using projection
    std::ranges::sort(people, {}, &Person::age);
    std::cout << "\nSorted by age:" << std::endl;
    for (const auto& p : people) {
        std::cout << p.name << " (" << p.age << ")" << std::endl;
    }

    // Find with projection
    auto it = std::ranges::find(people, "Bob", &Person::name);
    if (it != people.end()) {
        std::cout << "\nFound: " << it->name << ", age " << it->age << std::endl;
    }

    // Count with condition
    auto high_salary_count = std::ranges::count_if(people, [](const Person& p) {
        return p.salary > 10000;
    });
    std::cout << "High salary count: " << high_salary_count << std::endl;

    // Min/Max elements with projection
    auto oldest = std::ranges::max_element(people, {}, &Person::age);
    auto youngest = std::ranges::min_element(people, {}, &Person::age);
    std::cout << "Oldest: " << oldest->name << std::endl;
    std::cout << "Youngest: " << youngest->name << std::endl;

    return 0;
}
```

### Complex Pipeline Example

```cpp
#include <ranges>
#include <vector>
#include <map>
#include <algorithm>
#include <iostream>
#include <string>

struct Transaction {
    int id;
    std::string customer;
    std::string category;
    double amount;
    bool is_refund;
};

int main() {
    std::vector<Transaction> transactions = {
        {1, "Alice", "Electronics", 500.0, false},
        {2, "Bob", "Books", 50.0, false},
        {3, "Alice", "Electronics", 100.0, true},   // refund
        {4, "Charlie", "Electronics", 300.0, false},
        {5, "Bob", "Electronics", 200.0, false},
        {6, "Alice", "Books", 30.0, false},
        {7, "Charlie", "Books", 25.0, false},
        {8, "Bob", "Electronics", 150.0, true},     // refund
    };

    // Calculate electronics sales (excluding refunds)
    auto electronics_sales = transactions
        | std::views::filter([](const Transaction& t) {
            return t.category == "Electronics" && !t.is_refund;
        })
        | std::views::transform([](const Transaction& t) {
            return t.amount;
        });

    double total_electronics = 0;
    for (double amount : electronics_sales) {
        total_electronics += amount;
    }
    std::cout << "Electronics sales: $" << total_electronics << std::endl;

    // Process all valid transactions
    std::cout << "\nValid transactions:" << std::endl;
    auto valid_transactions = transactions
        | std::views::filter([](const Transaction& t) { return !t.is_refund; });

    for (const auto& t : valid_transactions) {
        std::cout << "ID:" << t.id << " " << t.customer
                  << " - " << t.category << " $" << t.amount << std::endl;
    }

    return 0;
}
```

## Best Practices

### Prefer Views Over Intermediate Containers

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Not recommended: creates intermediate containers
    std::vector<int> evens;
    std::copy_if(numbers.begin(), numbers.end(),
                 std::back_inserter(evens),
                 [](int n) { return n % 2 == 0; });
    std::vector<int> squares;
    std::transform(evens.begin(), evens.end(),
                   std::back_inserter(squares),
                   [](int n) { return n * n; });

    // Recommended: use view pipelines
    auto result = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    for (int n : result) {
        std::cout << n << " ";
    }

    return 0;
}
```

### Use Projections for Clean Code

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <string>

struct Employee {
    std::string name;
    std::string department;
    int salary;
};

int main() {
    std::vector<Employee> employees = {
        {"Alice", "R&D", 15000},
        {"Bob", "Sales", 12000},
        {"Charlie", "R&D", 18000},
    };

    // Not recommended: lambda accesses member
    std::ranges::sort(employees, [](const Employee& a, const Employee& b) {
        return a.salary < b.salary;
    });

    // Recommended: use projection
    std::ranges::sort(employees, {}, &Employee::salary);

    // Complex projection with lambda
    std::ranges::sort(employees, {}, [](const Employee& e) {
        return std::make_tuple(e.department, e.salary);
    });

    return 0;
}
```

### Understand View Lifetime

```cpp
#include <ranges>
#include <vector>
#include <iostream>

// Dangerous: returns dangling view
// auto dangerous_view() {
//     std::vector<int> local = {1, 2, 3, 4, 5};
//     return local | std::views::filter([](int n) { return n % 2 == 0; });
//     // local is destroyed, view is dangling!
// }

// Safe: accept external range
auto safe_view(std::vector<int>& data) {
    return data | std::views::filter([](int n) { return n % 2 == 0; });
}

// Safe: return concrete container
std::vector<int> safe_materialized(const std::vector<int>& data) {
    auto view = data | std::views::filter([](int n) { return n % 2 == 0; });
    return std::vector<int>(view.begin(), view.end());
}

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = safe_view(data);
    for (int n : view) {
        std::cout << n << " ";
    }
    return 0;
}
```

### Materialize Views When Multiple Iterations Needed

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <numeric>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Complex view pipeline
    auto complex_view = numbers
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    // If needing multiple iterations, materialize
    std::vector<int> materialized(complex_view.begin(), complex_view.end());

    // Now can efficiently iterate multiple times
    int sum = std::accumulate(materialized.begin(), materialized.end(), 0);
    int count = materialized.size();
    double avg = static_cast<double>(sum) / count;

    std::cout << "Sum: " << sum << ", Average: " << avg << std::endl;

    return 0;
}
```

### Combine Views Thoughtfully

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Combine related operations
    auto combined = data
        | std::views::filter([](int n) {
            // merge multiple conditions
            return (n % 2 == 0) && (n > 2);
        })
        | std::views::transform([](int n) {
            // single transformation
            return n * n;
        });

    for (int n : combined) {
        std::cout << n << " ";  // 16 36 64 100
    }
    std::cout << std::endl;

    return 0;
}
```

## Common Pitfalls

### Dangling View References

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_dangling() {
    // WRONG: temporary object
    // auto view = std::vector{1, 2, 3, 4, 5}
    //     | std::views::filter([](int n) { return n > 2; });
    // for (int n : view) { ... }  // Undefined behavior!

    // CORRECT
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = data | std::views::filter([](int n) { return n > 2; });
    for (int n : view) {
        std::cout << n << " ";
    }
}
```

### Multiple Iteration Overhead

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_multiple_iteration() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    int call_count = 0;

    auto view = data | std::views::filter([&call_count](int n) {
        ++call_count;
        return n % 2 == 0;
    });

    // First iteration
    for (int n : view) {
        std::cout << n << " ";
    }
    std::cout << "\nCall count: " << call_count << std::endl;  // 5

    // Second iteration - filter called again!
    for (int n : view) {
        std::cout << n << " ";
    }
    std::cout << "\nCall count: " << call_count << std::endl;  // 10

    // If expensive operation, should materialize
}
```

### Modifying Underlying Container

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_modify_underlying() {
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = data | std::views::take(3);

    // DANGEROUS: modifying underlying container may invalidate view
    data.push_back(6);  // May cause reallocation
    data.insert(data.begin(), 0);  // Changes element positions

    // Using view now may cause undefined behavior
    // for (int n : view) { ... }  // DANGEROUS!
}
```

### Confusing filter and take_while

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_filter_vs_take_while() {
    std::vector<int> data = {1, 3, 2, 4, 1, 5};

    // filter: checks all elements, keeps matching ones
    auto filtered = data | std::views::filter([](int n) { return n < 3; });
    std::cout << "filter (< 3): ";
    for (int n : filtered) {
        std::cout << n << " ";  // 1 2 1
    }
    std::cout << std::endl;

    // take_while: stops at first non-matching element
    auto taken = data | std::views::take_while([](int n) { return n < 3; });
    std::cout << "take_while (< 3): ";
    for (int n : taken) {
        std::cout << n << " ";  // 1
    }
    std::cout << std::endl;
}
```

### Ignoring Non-Owning Semantics

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void pitfall_non_owning() {
    // WRONG: returning view of temporary
    // auto get_view() {
    //     std::vector<int> temp = {1, 2, 3, 4, 5};
    //     return temp | std::views::all;  // Dangling!
    // }

    // CORRECT: ensure data lifetime exceeds view usage
    std::vector<int> data = {1, 2, 3, 4, 5};
    auto view = data | std::views::all;  // OK, data still exists

    for (int n : view) {
        std::cout << n << " ";
    }
}
```

## Performance Considerations

### Lazy Evaluation Advantages

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <chrono>

void performance_lazy_evaluation() {
    std::vector<int> large_data(1000000);
    std::iota(large_data.begin(), large_data.end(), 1);

    // Lazy evaluation: only computes needed elements
    auto start = std::chrono::high_resolution_clock::now();

    auto first_10_squares = large_data
        | std::views::filter([](int n) { return n % 1000 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(10);

    // Computation only happens during iteration
    long long sum = 0;
    for (auto n : first_10_squares) {
        sum += n;
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

    std::cout << "Lazy evaluation result: " << sum << std::endl;
    std::cout << "Time: " << duration.count() << " microseconds" << std::endl;
}
```

### Eliminating Intermediate Containers

```cpp
#include <ranges>
#include <vector>
#include <algorithm>
#include <numeric>

void performance_no_intermediate() {
    std::vector<int> data(100000);
    std::iota(data.begin(), data.end(), 1);

    // Traditional: O(n) extra space for intermediate containers
    std::vector<int> temp1, temp2;
    std::copy_if(data.begin(), data.end(), std::back_inserter(temp1),
                 [](int n) { return n % 2 == 0; });
    std::transform(temp1.begin(), temp1.end(), std::back_inserter(temp2),
                   [](int n) { return n * 2; });
    int result1 = std::accumulate(temp2.begin(), temp2.end(), 0);

    // Ranges: O(1) extra space
    auto view = data
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * 2; });
    int result2 = 0;
    for (int n : view) {
        result2 += n;
    }

    // Same results, better memory efficiency
}
```

### Composition Overhead

```cpp
#include <ranges>
#include <vector>
#include <iostream>

void performance_composition_overhead() {
    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Each view adapter has some overhead, but typically constant
    auto deep_view = data
        | std::views::filter([](int n) { return true; })
        | std::views::filter([](int n) { return true; })
        | std::views::filter([](int n) { return true; })
        | std::views::transform([](int n) { return n; })
        | std::views::transform([](int n) { return n; });

    // For performance-critical code, consider merging operations
    auto optimized_view = data
        | std::views::filter([](int n) { return true && true && true; })
        | std::views::transform([](int n) { return n; });
}
```

### Choosing Appropriate Underlying Containers

```cpp
#include <ranges>
#include <vector>
#include <list>
#include <deque>

void performance_underlying_container() {
    // vector: contiguous, cache-friendly
    std::vector<int> vec(10000);
    auto vec_view = vec | std::views::reverse;  // O(1) view creation

    // list: non-contiguous, same O(1) view creation
    std::list<int> lst(10000);
    auto lst_view = lst | std::views::reverse;

    // But iterating vec is usually faster (better cache locality)

    // For random_access_range, some operations more efficient
    // drop and take are O(1) on random_access_range
    // but potentially O(n) on forward_range
}
```

## Real-world Scenarios

### Scenario 1: Log Analysis

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <sstream>

struct LogEntry {
    std::string timestamp;
    std::string level;      // INFO, WARN, ERROR
    std::string message;
    std::string source;
};

LogEntry parse_log(const std::string& line) {
    // Simplified parsing: "timestamp|level|source|message"
    std::istringstream iss(line);
    LogEntry entry;
    std::getline(iss, entry.timestamp, '|');
    std::getline(iss, entry.level, '|');
    std::getline(iss, entry.source, '|');
    std::getline(iss, entry.message);
    return entry;
}

int main() {
    std::vector<std::string> raw_logs = {
        "2024-01-15 10:00:00|INFO|auth|User login successful",
        "2024-01-15 10:00:01|ERROR|database|Connection timeout",
        "2024-01-15 10:00:02|WARN|api|Rate limit approaching",
        "2024-01-15 10:00:03|ERROR|auth|Invalid token",
        "2024-01-15 10:00:04|INFO|api|Request processed",
        "2024-01-15 10:00:05|ERROR|database|Query failed",
    };

    // Parse and transform
    auto logs = raw_logs
        | std::views::transform(parse_log);

    // Only errors
    auto errors = logs
        | std::views::filter([](const LogEntry& e) {
            return e.level == "ERROR";
        });

    std::cout << "=== Errors ===" << std::endl;
    for (const auto& entry : errors) {
        std::cout << "[" << entry.timestamp << "] "
                  << entry.source << ": " << entry.message << std::endl;
    }

    return 0;
}
```

### Scenario 2: Data Cleaning Pipeline

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <algorithm>
#include <cctype>

struct RawRecord {
    std::string id;
    std::string name;
    std::string email;
};

struct CleanRecord {
    std::string id;
    std::string name;
    std::string email;
    bool is_valid;
};

std::string trim(const std::string& s) {
    auto start = s.find_first_not_of(" \t\n\r");
    auto end = s.find_last_not_of(" \t\n\r");
    return (start == std::string::npos) ? "" : s.substr(start, end - start + 1);
}

bool is_valid_email(const std::string& email) {
    return email.find('@') != std::string::npos &&
           email.find('.') != std::string::npos;
}

int main() {
    std::vector<RawRecord> raw_data = {
        {"001", "  John Doe  ", "john@example.com"},
        {"002", "Jane Smith", "invalid-email"},
        {"003", "  Bob Wilson ", "bob@test.org"},
        {"004", "", "empty@name.com"},
        {"005", "Alice Brown", "alice@company.com"},
    };

    // Data cleaning pipeline
    auto cleaned = raw_data
        | std::views::transform([](const RawRecord& r) {
            CleanRecord clean;
            clean.id = r.id;
            clean.name = trim(r.name);
            clean.email = trim(r.email);
            clean.is_valid = !clean.name.empty() &&
                            is_valid_email(clean.email);
            return clean;
        });

    // Keep only valid
    auto valid_records = cleaned
        | std::views::filter([](const CleanRecord& r) {
            return r.is_valid;
        });

    std::cout << "=== Valid Records ===" << std::endl;
    for (const auto& record : valid_records) {
        std::cout << "ID: " << record.id
                  << ", Name: " << record.name
                  << ", Email: " << record.email << std::endl;
    }

    return 0;
}
```

### Scenario 3: CSV Data Processing

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <sstream>
#include <map>
#include <numeric>

struct SalesRecord {
    std::string date;
    std::string product;
    std::string region;
    int quantity;
    double unit_price;

    double total() const { return quantity * unit_price; }
};

SalesRecord parse_csv_row(const std::string& row) {
    std::istringstream iss(row);
    SalesRecord record;
    std::string token;

    std::getline(iss, record.date, ',');
    std::getline(iss, record.product, ',');
    std::getline(iss, record.region, ',');
    std::getline(iss, token, ',');
    record.quantity = std::stoi(token);
    std::getline(iss, token, ',');
    record.unit_price = std::stod(token);

    return record;
}

int main() {
    std::vector<std::string> csv_data = {
        "2024-01-01,ProductA,North,10,100.0",
        "2024-01-01,ProductB,South,5,200.0",
        "2024-01-02,ProductA,South,8,100.0",
        "2024-01-02,ProductB,North,12,200.0",
        "2024-01-03,ProductA,North,15,100.0",
    };

    // Parse CSV data
    auto records = csv_data
        | std::views::transform(parse_csv_row);

    // Calculate total sales (materialize for multiple passes)
    std::vector<SalesRecord> all_records;
    for (const auto& row : csv_data) {
        all_records.push_back(parse_csv_row(row));
    }

    double total_sales = 0;
    for (const auto& r : all_records) {
        total_sales += r.total();
    }
    std::cout << "Total sales: $" << total_sales << std::endl;

    // By region
    std::map<std::string, double> region_sales;
    for (const auto& r : all_records) {
        region_sales[r.region] += r.total();
    }

    std::cout << "\n=== Sales by Region ===" << std::endl;
    for (const auto& [region, sales] : region_sales) {
        std::cout << region << ": $" << sales << std::endl;
    }

    return 0;
}
```

## Interview Points

### Common Interview Questions

#### What are the main advantages of Ranges over traditional STL?

**Key Points:**
- Safer: No mismatched iterator pairs
- Composable: Elegant pipeline syntax with `|` operator
- Lazy evaluation: Deferred computation with views
- Projections: Direct member access in algorithms
- Better diagnostics: Concept constraints provide clearer errors

#### Explain the difference between Range and View

**Key Points:**
- Range: General abstraction with `begin()` and `end()`
- View: Special range that is:
  - Non-owning (doesn't own data)
  - Lazily evaluated (computed on demand)
  - O(1) copyable
  - Composable via pipe operator

#### What is lazy evaluation and why is it important?

**Key Points:**
```cpp
auto view = data | filter(...) | transform(...);
// Nothing computed yet

for (auto x : view) {
    // Only computed during iteration
}
```
Benefits: Memory efficiency, avoids unnecessary computation, enables infinite sequences

#### How do projections work?

**Key Points:**
```cpp
struct Person { std::string name; int age; };
std::ranges::sort(people, {}, &Person::age);  // Sort by age member
std::ranges::max_element(people, {}, &Person::salary);  // Max by salary
```

#### What view lifetime issues should you be aware of?

**Key Points:**
- Views don't own data; reference underlying container
- Must ensure data lives longer than view
- Don't return views of temporaries
- Modifying underlying container may invalidate view

### Advanced Topics for Discussion

1. **Range Concepts Hierarchy**: Understand relationships between `input_range`, `forward_range`, `bidirectional_range`, `random_access_range`, `contiguous_range`

2. **View Implementation**: How views wrap underlying ranges and implement lazy evaluation

3. **Interoperability**: When to use range algorithms vs traditional STL iterators

4. **C++23 Enhancements**: `zip_view`, `chunk_view`, `ranges::to`

5. **Performance Analysis**: Analyzing time and space complexity of view pipelines

## Further Reading

### Official Resources

- [C++ Reference - Ranges Library](https://en.cppreference.com/w/cpp/ranges)
- [C++20 Ranges Proposal P0896](https://wg21.link/p0896)
- [C++ Standard Draft - Ranges Chapter](https://eel.is/c++draft/ranges)

### Deep Dives

- [Range-v3 Library](https://github.com/ericniebler/range-v3) - Reference implementation for C++20 Ranges
- [Eric Niebler's Ranges Blog Series](https://ericniebler.com/category/ranges/)
- [Barry Revzin's Ranges Blog](https://brevzin.github.io/)
- CppCon talks on Ranges and functional programming in C++

### Books

- "C++20 - The Complete Guide" by Nicolai M. Josuttis
- "Professional C++, 5th Edition" - C++20 Ranges chapter
- "A Tour of C++" by Bjarne Stroustrup

### Practice Projects

- Refactor existing data processing code using Ranges
- Implement custom view adapters
- Build streaming data pipelines
- Compare performance between Ranges and traditional STL

---

C++20 Ranges represent the future direction of C++, enabling more expressive, safer, and more efficient data processing. By mastering Ranges, you improve code quality and deepen your understanding of functional programming paradigms. As C++23 and beyond bring further enhancements, Ranges will become increasingly central to modern C++ development.
