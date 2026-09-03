---
title: C++ STL Algorithms
description: Complete guide to C++ STL algorithm library including sorting, searching, transformation and numeric algorithms
track: cpp
section: templates-generic
difficulty: intermediate
tags:
  - C++
  - STL
  - algorithms
  - standard library
status: imported
origin: old/src/content/docs/cpp/algorithms.en.md
divergence: 0.068
issues: []
legacy:
  category: Cpp
  subcategory: STL
  order: 19
  lastUpdated: 2026-01-07
---

The C++ Standard Template Library (STL) provides a rich collection of algorithms that work with iterators to perform common operations on containers. These algorithms are generic, efficient, and designed to be used with any container that provides the appropriate iterator interface.

## Introduction

STL algorithms are function templates that operate on ranges defined by iterators. They provide a consistent, reusable interface for common operations, allowing you to write expressive and maintainable code.

### Key Benefits

- **Generic**: Work with any container that provides iterators
- **Efficient**: Optimized implementations with well-defined complexity guarantees
- **Composable**: Can be combined to build complex operations
- **Type-Safe**: Compile-time type checking prevents errors
- **Expressive**: Code intent is clear from algorithm names

### Header Files

Most algorithms are declared in the `<algorithm>` header:

```cpp
#include <algorithm>
#include <numeric>     // For numeric algorithms
#include <execution>   // For parallel execution policies (C++17)
#include <ranges>      // For ranges algorithms (C++20)
```

### Basic Usage Pattern

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Sort the vector
    std::sort(vec.begin(), vec.end());

    // Find an element
    auto it = std::find(vec.begin(), vec.end(), 5);
    if (it != vec.end()) {
        std::cout << "Found: " << *it << std::endl;
    }

    // Count elements satisfying a condition
    int count = std::count_if(vec.begin(), vec.end(),
        [](int x) { return x > 5; });
    std::cout << "Elements > 5: " << count << std::endl;

    return 0;
}
```

## Algorithm Categories

STL algorithms can be categorized based on their behavior:

| Category | Description | Examples |
|----------|-------------|----------|
| Non-modifying | Read data without changing it | `find`, `count`, `search` |
| Modifying | Change container contents | `copy`, `transform`, `fill` |
| Sorting | Reorder elements | `sort`, `partial_sort`, `nth_element` |
| Binary Search | Search in sorted ranges | `binary_search`, `lower_bound` |
| Set Operations | Operations on sorted ranges | `set_union`, `set_intersection` |
| Heap Operations | Build and manipulate heaps | `make_heap`, `push_heap` |
| Min/Max | Find extreme values | `min`, `max`, `minmax_element` |
| Numeric | Mathematical operations | `accumulate`, `inner_product` |

## Non-Modifying Sequence Algorithms

These algorithms examine elements without modifying them.

### find and find_if

Find elements in a range.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // Find specific value
    auto it = std::find(vec.begin(), vec.end(), 5);
    if (it != vec.end()) {
        std::cout << "Found 5 at position: "
                  << std::distance(vec.begin(), it) << std::endl;
    }

    // Find with predicate
    auto it2 = std::find_if(vec.begin(), vec.end(),
        [](int x) { return x > 5 && x % 2 == 0; });
    if (it2 != vec.end()) {
        std::cout << "First even number > 5: " << *it2 << std::endl;
    }

    // Find if not (C++11)
    auto it3 = std::find_if_not(vec.begin(), vec.end(),
        [](int x) { return x < 5; });
    if (it3 != vec.end()) {
        std::cout << "First element >= 5: " << *it3 << std::endl;
    }

    return 0;
}
```

### count and count_if

Count elements matching a criterion.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5, 2, 6};

    // Count specific value
    auto count = std::count(vec.begin(), vec.end(), 2);
    std::cout << "Count of 2: " << count << std::endl;  // 4

    // Count with predicate
    auto evenCount = std::count_if(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; });
    std::cout << "Even numbers: " << evenCount << std::endl;

    return 0;
}
```

### all_of, any_of, none_of

Check if elements satisfy a condition.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {2, 4, 6, 8, 10};

    // Check if all elements are even
    bool allEven = std::all_of(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; });
    std::cout << "All even: " << std::boolalpha << allEven << std::endl;

    // Check if any element is greater than 5
    bool anyGreater = std::any_of(vec.begin(), vec.end(),
        [](int x) { return x > 5; });
    std::cout << "Any > 5: " << anyGreater << std::endl;

    // Check if no element is negative
    bool noneNegative = std::none_of(vec.begin(), vec.end(),
        [](int x) { return x < 0; });
    std::cout << "None negative: " << noneNegative << std::endl;

    return 0;
}
```

### for_each

Apply a function to each element.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Print each element
    std::for_each(vec.begin(), vec.end(),
        [](int x) { std::cout << x << " "; });
    std::cout << std::endl;

    // Modify through reference
    std::for_each(vec.begin(), vec.end(),
        [](int& x) { x *= 2; });

    // for_each returns the function object (can have state)
    struct Sum {
        int total = 0;
        void operator()(int x) { total += x; }
    };

    Sum result = std::for_each(vec.begin(), vec.end(), Sum());
    std::cout << "Sum: " << result.total << std::endl;

    return 0;
}
```

### search and find_end

Search for subsequences.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> haystack = {1, 2, 3, 4, 5, 1, 2, 3, 6, 7};
    std::vector<int> needle = {1, 2, 3};

    // Find first occurrence of subsequence
    auto it = std::search(haystack.begin(), haystack.end(),
                          needle.begin(), needle.end());
    if (it != haystack.end()) {
        std::cout << "Found at position: "
                  << std::distance(haystack.begin(), it) << std::endl;
    }

    // Find last occurrence
    auto it2 = std::find_end(haystack.begin(), haystack.end(),
                             needle.begin(), needle.end());
    if (it2 != haystack.end()) {
        std::cout << "Last occurrence at: "
                  << std::distance(haystack.begin(), it2) << std::endl;
    }

    // Search with predicate
    auto it3 = std::search(haystack.begin(), haystack.end(),
                           needle.begin(), needle.end(),
                           [](int a, int b) { return a == b; });

    return 0;
}
```

### adjacent_find

Find adjacent duplicates or pairs matching a predicate.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 3, 4, 5, 5, 5, 6};

    // Find first adjacent duplicate
    auto it = std::adjacent_find(vec.begin(), vec.end());
    if (it != vec.end()) {
        std::cout << "Adjacent duplicate: " << *it << std::endl;  // 3
    }

    // Find adjacent elements where second is greater
    auto it2 = std::adjacent_find(vec.begin(), vec.end(),
        [](int a, int b) { return b > a + 1; });
    if (it2 != vec.end()) {
        std::cout << "Gap found between " << *it2
                  << " and " << *(it2 + 1) << std::endl;
    }

    return 0;
}
```

### equal and mismatch

Compare ranges.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v1 = {1, 2, 3, 4, 5};
    std::vector<int> v2 = {1, 2, 3, 4, 5};
    std::vector<int> v3 = {1, 2, 3, 4, 6};

    // Check equality
    bool equal = std::equal(v1.begin(), v1.end(), v2.begin());
    std::cout << "v1 == v2: " << std::boolalpha << equal << std::endl;

    // Find first mismatch
    auto [m1, m2] = std::mismatch(v1.begin(), v1.end(), v3.begin());
    if (m1 != v1.end()) {
        std::cout << "First mismatch: " << *m1 << " vs " << *m2 << std::endl;
    }

    // Compare with predicate
    bool almostEqual = std::equal(v1.begin(), v1.end(), v3.begin(),
        [](int a, int b) { return std::abs(a - b) <= 1; });
    std::cout << "Almost equal: " << almostEqual << std::endl;

    return 0;
}
```

## Modifying Sequence Algorithms

These algorithms modify the elements in a range.

### copy and copy_if

Copy elements to another range.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> source = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    std::vector<int> dest(source.size());

    // Copy all elements
    std::copy(source.begin(), source.end(), dest.begin());

    // Copy with back_inserter
    std::vector<int> dest2;
    std::copy(source.begin(), source.end(), std::back_inserter(dest2));

    // Copy conditionally
    std::vector<int> evens;
    std::copy_if(source.begin(), source.end(), std::back_inserter(evens),
        [](int x) { return x % 2 == 0; });

    std::cout << "Evens: ";
    for (int x : evens) std::cout << x << " ";  // 2 4 6 8
    std::cout << std::endl;

    // Copy first N elements
    std::vector<int> first5(5);
    std::copy_n(source.begin(), 5, first5.begin());

    // Copy backward (for overlapping ranges)
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::copy_backward(vec.begin(), vec.end() - 1, vec.end());
    // Result: {1, 1, 2, 3, 4}

    return 0;
}
```

### move

Move elements instead of copying.

```cpp
#include <algorithm>
#include <vector>
#include <string>
#include <iostream>

int main() {
    std::vector<std::string> source = {"hello", "world", "foo", "bar"};
    std::vector<std::string> dest(source.size());

    // Move elements (source strings become empty)
    std::move(source.begin(), source.end(), dest.begin());

    std::cout << "Dest: ";
    for (const auto& s : dest) std::cout << s << " ";
    std::cout << std::endl;

    // Source strings are now in moved-from state
    std::cout << "Source sizes: ";
    for (const auto& s : source) std::cout << s.size() << " ";
    std::cout << std::endl;

    return 0;
}
```

### transform

Apply a function and store results.

```cpp
#include <algorithm>
#include <vector>
#include <string>
#include <iostream>
#include <cctype>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::vector<int> result(vec.size());

    // Unary transform: square each element
    std::transform(vec.begin(), vec.end(), result.begin(),
        [](int x) { return x * x; });

    std::cout << "Squared: ";
    for (int x : result) std::cout << x << " ";  // 1 4 9 16 25
    std::cout << std::endl;

    // Binary transform: add two ranges
    std::vector<int> v1 = {1, 2, 3, 4, 5};
    std::vector<int> v2 = {10, 20, 30, 40, 50};
    std::vector<int> sum(5);

    std::transform(v1.begin(), v1.end(), v2.begin(), sum.begin(),
        [](int a, int b) { return a + b; });

    std::cout << "Sum: ";
    for (int x : sum) std::cout << x << " ";  // 11 22 33 44 55
    std::cout << std::endl;

    // Transform in-place
    std::string str = "Hello World";
    std::transform(str.begin(), str.end(), str.begin(),
        [](unsigned char c) { return std::toupper(c); });
    std::cout << str << std::endl;  // HELLO WORLD

    return 0;
}
```

### fill and generate

Fill ranges with values.

```cpp
#include <algorithm>
#include <vector>
#include <random>
#include <iostream>

int main() {
    std::vector<int> vec(10);

    // Fill with constant value
    std::fill(vec.begin(), vec.end(), 42);

    // Fill first 5 elements
    std::fill_n(vec.begin(), 5, 0);

    // Generate values using a function
    int counter = 0;
    std::generate(vec.begin(), vec.end(),
        [&counter]() { return counter++; });

    std::cout << "Generated: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    // Generate with random values
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1, 100);

    std::generate(vec.begin(), vec.end(),
        [&]() { return dis(gen); });

    // Generate first N values
    std::generate_n(vec.begin(), 5,
        []() { static int n = 0; return n++; });

    return 0;
}
```

### replace and replace_if

Replace elements matching a criterion.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // Replace specific value
    std::replace(vec.begin(), vec.end(), 2, 99);
    // Result: {1, 99, 3, 99, 4, 99, 5}

    // Replace conditionally
    std::vector<int> vec2 = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    std::replace_if(vec2.begin(), vec2.end(),
        [](int x) { return x % 2 == 0; }, 0);
    // Result: {1, 0, 3, 0, 5, 0, 7, 0, 9}

    // Replace and copy
    std::vector<int> src = {1, 2, 3, 2, 4};
    std::vector<int> dest(src.size());
    std::replace_copy(src.begin(), src.end(), dest.begin(), 2, 99);
    // src unchanged, dest = {1, 99, 3, 99, 4}

    return 0;
}
```

### remove and remove_if

Remove elements (moves them to the end).

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // Remove specific value
    // Note: remove doesn't actually erase elements, just moves them
    auto newEnd = std::remove(vec.begin(), vec.end(), 2);

    // Erase the "removed" elements
    vec.erase(newEnd, vec.end());

    std::cout << "After removing 2s: ";
    for (int x : vec) std::cout << x << " ";  // 1 3 4 5
    std::cout << std::endl;

    // Remove conditionally (erase-remove idiom)
    std::vector<int> vec2 = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    vec2.erase(
        std::remove_if(vec2.begin(), vec2.end(),
            [](int x) { return x % 2 == 0; }),
        vec2.end()
    );

    std::cout << "Odd numbers only: ";
    for (int x : vec2) std::cout << x << " ";  // 1 3 5 7 9
    std::cout << std::endl;

    // C++20: std::erase and std::erase_if
    std::vector<int> vec3 = {1, 2, 3, 4, 5};
    std::erase(vec3, 3);  // Remove all 3s
    std::erase_if(vec3, [](int x) { return x > 3; });

    return 0;
}
```

### unique

Remove consecutive duplicates.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 1, 2, 2, 2, 3, 3, 4, 5, 5};

    // Remove consecutive duplicates
    auto newEnd = std::unique(vec.begin(), vec.end());
    vec.erase(newEnd, vec.end());

    std::cout << "Unique: ";
    for (int x : vec) std::cout << x << " ";  // 1 2 3 4 5
    std::cout << std::endl;

    // Remove all duplicates (sort first)
    std::vector<int> vec2 = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3};
    std::sort(vec2.begin(), vec2.end());
    vec2.erase(std::unique(vec2.begin(), vec2.end()), vec2.end());

    std::cout << "All unique: ";
    for (int x : vec2) std::cout << x << " ";  // 1 2 3 4 5 6 9
    std::cout << std::endl;

    // Unique with predicate
    std::vector<int> vec3 = {1, 2, 2, 3, 3, 3, 4, 4, 4, 4};
    auto end = std::unique(vec3.begin(), vec3.end(),
        [](int a, int b) { return std::abs(a - b) <= 1; });
    vec3.erase(end, vec3.end());

    return 0;
}
```

### reverse and rotate

Rearrange element order.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Reverse in place
    std::reverse(vec.begin(), vec.end());
    // Result: {5, 4, 3, 2, 1}

    // Reverse copy
    std::vector<int> reversed(vec.size());
    std::reverse_copy(vec.begin(), vec.end(), reversed.begin());

    // Rotate: move elements to make middle the new first
    std::vector<int> vec2 = {1, 2, 3, 4, 5};
    std::rotate(vec2.begin(), vec2.begin() + 2, vec2.end());
    // Result: {3, 4, 5, 1, 2}

    std::cout << "Rotated: ";
    for (int x : vec2) std::cout << x << " ";
    std::cout << std::endl;

    // Rotate copy
    std::vector<int> rotated(vec2.size());
    std::rotate_copy(vec2.begin(), vec2.begin() + 2, vec2.end(),
                     rotated.begin());

    return 0;
}
```

### shuffle

Randomly shuffle elements.

```cpp
#include <algorithm>
#include <vector>
#include <random>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Create random number generator
    std::random_device rd;
    std::mt19937 gen(rd());

    // Shuffle
    std::shuffle(vec.begin(), vec.end(), gen);

    std::cout << "Shuffled: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    // Shuffle again with different seed
    gen.seed(42);  // Reproducible shuffle
    std::shuffle(vec.begin(), vec.end(), gen);

    return 0;
}
```

### sample (C++17)

Select random samples from a range.

```cpp
#include <algorithm>
#include <vector>
#include <random>
#include <iostream>

int main() {
    std::vector<int> population = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    std::vector<int> sample(5);

    std::random_device rd;
    std::mt19937 gen(rd());

    // Select 5 random elements
    std::sample(population.begin(), population.end(),
                sample.begin(), 5, gen);

    std::cout << "Sample: ";
    for (int x : sample) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

## Sorting and Related Algorithms

### sort

Sort elements in ascending order.

```cpp
#include <algorithm>
#include <vector>
#include <string>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Sort ascending (default)
    std::sort(vec.begin(), vec.end());

    // Sort descending
    std::sort(vec.begin(), vec.end(), std::greater<int>());

    // Sort with custom comparator
    std::vector<std::string> words = {"apple", "Banana", "cherry", "Date"};
    std::sort(words.begin(), words.end(),
        [](const std::string& a, const std::string& b) {
            return std::lexicographical_compare(
                a.begin(), a.end(),
                b.begin(), b.end(),
                [](char c1, char c2) {
                    return std::tolower(c1) < std::tolower(c2);
                });
        });

    std::cout << "Case-insensitive sort: ";
    for (const auto& w : words) std::cout << w << " ";
    std::cout << std::endl;

    // Sort by length
    std::sort(words.begin(), words.end(),
        [](const std::string& a, const std::string& b) {
            return a.length() < b.length();
        });

    return 0;
}
```

### stable_sort

Sort while preserving relative order of equal elements.

```cpp
#include <algorithm>
#include <vector>
#include <string>
#include <iostream>

struct Person {
    std::string name;
    int age;
};

int main() {
    std::vector<Person> people = {
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 30},
        {"David", 25},
        {"Eve", 30}
    };

    // Stable sort by age (preserves original order for equal ages)
    std::stable_sort(people.begin(), people.end(),
        [](const Person& a, const Person& b) {
            return a.age < b.age;
        });

    std::cout << "Sorted by age (stable):\n";
    for (const auto& p : people) {
        std::cout << p.name << " (" << p.age << ")\n";
    }
    // Bob and David (both 25) appear in their original order
    // Alice, Charlie, Eve (all 30) appear in their original order

    return 0;
}
```

### partial_sort

Sort only the first N elements.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Sort first 3 elements (get 3 smallest)
    std::partial_sort(vec.begin(), vec.begin() + 3, vec.end());

    std::cout << "Partial sort (first 3): ";
    for (int x : vec) std::cout << x << " ";
    // First 3 elements are smallest, sorted: {1, 2, 3, ...}
    std::cout << std::endl;

    // Get 3 largest with descending comparison
    std::vector<int> vec2 = {5, 2, 8, 1, 9, 3, 7, 4, 6};
    std::partial_sort(vec2.begin(), vec2.begin() + 3, vec2.end(),
                      std::greater<int>());
    // First 3 are largest: {9, 8, 7, ...}

    // Copy to separate container
    std::vector<int> source = {5, 2, 8, 1, 9};
    std::vector<int> smallest3(3);
    std::partial_sort_copy(source.begin(), source.end(),
                           smallest3.begin(), smallest3.end());
    // smallest3 = {1, 2, 5}

    return 0;
}
```

### nth_element

Partition so the nth element is in its sorted position.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Find median (element at middle position in sorted array)
    size_t n = vec.size() / 2;
    std::nth_element(vec.begin(), vec.begin() + n, vec.end());

    std::cout << "Median: " << vec[n] << std::endl;

    // All elements before nth are <= nth
    // All elements after nth are >= nth
    // But they are not sorted

    // Find kth smallest element
    int k = 3;  // 3rd smallest (0-indexed)
    std::vector<int> vec2 = {5, 2, 8, 1, 9, 3, 7, 4, 6};
    std::nth_element(vec2.begin(), vec2.begin() + k, vec2.end());
    std::cout << "3rd smallest: " << vec2[k] << std::endl;  // 4

    return 0;
}
```

### partition

Partition elements based on a predicate.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // Partition: evens first, then odds
    auto partitionPoint = std::partition(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; });

    std::cout << "Partitioned: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    std::cout << "First odd element: " << *partitionPoint << std::endl;

    // Stable partition (maintains relative order within groups)
    std::vector<int> vec2 = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    std::stable_partition(vec2.begin(), vec2.end(),
        [](int x) { return x % 2 == 0; });

    std::cout << "Stable partitioned: ";
    for (int x : vec2) std::cout << x << " ";  // 2 4 6 8 1 3 5 7 9
    std::cout << std::endl;

    // Check if partitioned
    bool isPartitioned = std::is_partitioned(vec2.begin(), vec2.end(),
        [](int x) { return x % 2 == 0; });
    std::cout << "Is partitioned: " << std::boolalpha << isPartitioned << std::endl;

    // Partition copy
    std::vector<int> evens, odds;
    std::partition_copy(vec.begin(), vec.end(),
                        std::back_inserter(evens),
                        std::back_inserter(odds),
                        [](int x) { return x % 2 == 0; });

    return 0;
}
```

### is_sorted and is_sorted_until

Check if a range is sorted.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> sorted = {1, 2, 3, 4, 5};
    std::vector<int> unsorted = {1, 3, 2, 4, 5};

    std::cout << "sorted is sorted: "
              << std::boolalpha << std::is_sorted(sorted.begin(), sorted.end())
              << std::endl;  // true

    std::cout << "unsorted is sorted: "
              << std::is_sorted(unsorted.begin(), unsorted.end())
              << std::endl;  // false

    // Find where sorting breaks
    auto it = std::is_sorted_until(unsorted.begin(), unsorted.end());
    if (it != unsorted.end()) {
        std::cout << "Sorted until position: "
                  << std::distance(unsorted.begin(), it)
                  << " (value: " << *it << ")" << std::endl;
    }

    return 0;
}
```

## Binary Search Algorithms

These algorithms work on sorted ranges.

### binary_search

Check if an element exists.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    // Must be sorted!

    bool found = std::binary_search(vec.begin(), vec.end(), 5);
    std::cout << "5 found: " << std::boolalpha << found << std::endl;

    found = std::binary_search(vec.begin(), vec.end(), 10);
    std::cout << "10 found: " << found << std::endl;

    // With custom comparator (descending sorted)
    std::vector<int> descVec = {9, 8, 7, 6, 5, 4, 3, 2, 1};
    found = std::binary_search(descVec.begin(), descVec.end(), 5,
                               std::greater<int>());

    return 0;
}
```

### lower_bound and upper_bound

Find insertion points.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 3, 3, 4, 5, 6};

    // lower_bound: first element >= value
    auto lb = std::lower_bound(vec.begin(), vec.end(), 3);
    std::cout << "Lower bound of 3 at index: "
              << std::distance(vec.begin(), lb) << std::endl;  // 2

    // upper_bound: first element > value
    auto ub = std::upper_bound(vec.begin(), vec.end(), 3);
    std::cout << "Upper bound of 3 at index: "
              << std::distance(vec.begin(), ub) << std::endl;  // 5

    // Count of 3s = upper_bound - lower_bound
    std::cout << "Count of 3s: " << std::distance(lb, ub) << std::endl;

    // Insert while maintaining sorted order
    int newValue = 4;
    auto insertPos = std::lower_bound(vec.begin(), vec.end(), newValue);
    vec.insert(insertPos, newValue);

    return 0;
}
```

### equal_range

Find all elements equal to a value.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 3, 3, 4, 5, 6};

    // Get range of elements equal to 3
    auto [first, last] = std::equal_range(vec.begin(), vec.end(), 3);

    std::cout << "Elements equal to 3: ";
    for (auto it = first; it != last; ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    std::cout << "Count: " << std::distance(first, last) << std::endl;

    // Check if not found
    auto [f2, l2] = std::equal_range(vec.begin(), vec.end(), 10);
    if (f2 == l2) {
        std::cout << "10 not found" << std::endl;
    }

    return 0;
}
```

## Set Algorithms

These algorithms work on sorted ranges and perform set operations.

### set_union and set_intersection

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> v1 = {1, 2, 3, 4, 5};
    std::vector<int> v2 = {3, 4, 5, 6, 7};

    // Set union
    std::vector<int> unionResult;
    std::set_union(v1.begin(), v1.end(),
                   v2.begin(), v2.end(),
                   std::back_inserter(unionResult));

    std::cout << "Union: ";
    for (int x : unionResult) std::cout << x << " ";  // 1 2 3 4 5 6 7
    std::cout << std::endl;

    // Set intersection
    std::vector<int> intersectionResult;
    std::set_intersection(v1.begin(), v1.end(),
                          v2.begin(), v2.end(),
                          std::back_inserter(intersectionResult));

    std::cout << "Intersection: ";
    for (int x : intersectionResult) std::cout << x << " ";  // 3 4 5
    std::cout << std::endl;

    return 0;
}
```

### set_difference and set_symmetric_difference

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> v1 = {1, 2, 3, 4, 5};
    std::vector<int> v2 = {3, 4, 5, 6, 7};

    // Set difference (elements in v1 but not in v2)
    std::vector<int> diffResult;
    std::set_difference(v1.begin(), v1.end(),
                        v2.begin(), v2.end(),
                        std::back_inserter(diffResult));

    std::cout << "Difference (v1 - v2): ";
    for (int x : diffResult) std::cout << x << " ";  // 1 2
    std::cout << std::endl;

    // Symmetric difference (elements in either but not both)
    std::vector<int> symDiffResult;
    std::set_symmetric_difference(v1.begin(), v1.end(),
                                  v2.begin(), v2.end(),
                                  std::back_inserter(symDiffResult));

    std::cout << "Symmetric difference: ";
    for (int x : symDiffResult) std::cout << x << " ";  // 1 2 6 7
    std::cout << std::endl;

    return 0;
}
```

### merge and inplace_merge

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> v1 = {1, 3, 5, 7, 9};
    std::vector<int> v2 = {2, 4, 6, 8, 10};

    // Merge two sorted ranges
    std::vector<int> merged;
    std::merge(v1.begin(), v1.end(),
               v2.begin(), v2.end(),
               std::back_inserter(merged));

    std::cout << "Merged: ";
    for (int x : merged) std::cout << x << " ";
    std::cout << std::endl;

    // In-place merge
    std::vector<int> vec = {1, 3, 5, 7, 2, 4, 6, 8};
    // First half [0,4) and second half [4,8) are each sorted
    std::inplace_merge(vec.begin(), vec.begin() + 4, vec.end());

    std::cout << "Inplace merged: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### includes

Check if one set is a subset of another.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> superset = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    std::vector<int> subset1 = {2, 4, 6};
    std::vector<int> subset2 = {2, 4, 10};

    bool isSubset1 = std::includes(superset.begin(), superset.end(),
                                   subset1.begin(), subset1.end());
    std::cout << "{2,4,6} is subset: " << std::boolalpha << isSubset1 << std::endl;

    bool isSubset2 = std::includes(superset.begin(), superset.end(),
                                   subset2.begin(), subset2.end());
    std::cout << "{2,4,10} is subset: " << isSubset2 << std::endl;

    return 0;
}
```

## Heap Algorithms

Algorithms for working with heap data structures.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {3, 1, 4, 1, 5, 9, 2, 6};

    // Make a max-heap
    std::make_heap(vec.begin(), vec.end());

    std::cout << "Max heap: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    std::cout << "Max element: " << vec.front() << std::endl;  // 9

    // Pop the maximum element
    std::pop_heap(vec.begin(), vec.end());  // Moves max to end
    int maxVal = vec.back();
    vec.pop_back();
    std::cout << "Popped: " << maxVal << std::endl;

    // Push a new element
    vec.push_back(8);
    std::push_heap(vec.begin(), vec.end());  // Restores heap property

    // Sort the heap (heap sort)
    std::sort_heap(vec.begin(), vec.end());
    std::cout << "Sorted: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    // Check if it's a heap
    vec = {9, 5, 8, 3, 4, 7, 2, 1};
    bool isHeap = std::is_heap(vec.begin(), vec.end());
    std::cout << "Is heap: " << std::boolalpha << isHeap << std::endl;

    // Find where heap property breaks
    auto heapEnd = std::is_heap_until(vec.begin(), vec.end());
    std::cout << "Heap until position: "
              << std::distance(vec.begin(), heapEnd) << std::endl;

    return 0;
}
```

## Min/Max Algorithms

### min, max, minmax

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
#include <string>

int main() {
    // Single values
    int a = 5, b = 3;
    std::cout << "min: " << std::min(a, b) << std::endl;
    std::cout << "max: " << std::max(a, b) << std::endl;

    auto [minVal, maxVal] = std::minmax(a, b);
    std::cout << "minmax: " << minVal << ", " << maxVal << std::endl;

    // Initializer list
    int smallest = std::min({5, 2, 8, 1, 9});
    int largest = std::max({5, 2, 8, 1, 9});
    std::cout << "min of list: " << smallest << std::endl;
    std::cout << "max of list: " << largest << std::endl;

    // With custom comparator
    std::string s1 = "apple", s2 = "banana";
    const std::string& shorter = std::min(s1, s2,
        [](const std::string& a, const std::string& b) {
            return a.length() < b.length();
        });
    std::cout << "Shorter: " << shorter << std::endl;

    return 0;
}
```

### min_element and max_element

Find extreme elements in a range.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7};

    auto minIt = std::min_element(vec.begin(), vec.end());
    auto maxIt = std::max_element(vec.begin(), vec.end());

    std::cout << "Min: " << *minIt << " at index "
              << std::distance(vec.begin(), minIt) << std::endl;
    std::cout << "Max: " << *maxIt << " at index "
              << std::distance(vec.begin(), maxIt) << std::endl;

    // Get both in one pass
    auto [minIt2, maxIt2] = std::minmax_element(vec.begin(), vec.end());
    std::cout << "Minmax: " << *minIt2 << ", " << *maxIt2 << std::endl;

    // With custom comparator
    std::vector<std::string> words = {"cat", "elephant", "dog", "hippopotamus"};
    auto longest = std::max_element(words.begin(), words.end(),
        [](const std::string& a, const std::string& b) {
            return a.length() < b.length();
        });
    std::cout << "Longest word: " << *longest << std::endl;

    return 0;
}
```

### clamp (C++17)

Clamp a value within a range.

```cpp
#include <algorithm>
#include <iostream>

int main() {
    int low = 0, high = 100;

    std::cout << std::clamp(-10, low, high) << std::endl;  // 0
    std::cout << std::clamp(50, low, high) << std::endl;   // 50
    std::cout << std::clamp(150, low, high) << std::endl;  // 100

    // Useful for bounds checking
    double value = 3.5;
    double clamped = std::clamp(value, 0.0, 1.0);
    std::cout << "Clamped: " << clamped << std::endl;  // 1.0

    return 0;
}
```

## Numeric Algorithms

These are defined in the `<numeric>` header.

### accumulate

Sum or fold elements.

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Sum all elements
    int sum = std::accumulate(vec.begin(), vec.end(), 0);
    std::cout << "Sum: " << sum << std::endl;  // 15

    // Product
    int product = std::accumulate(vec.begin(), vec.end(), 1,
        std::multiplies<int>());
    std::cout << "Product: " << product << std::endl;  // 120

    // Custom accumulation
    std::vector<std::string> words = {"Hello", " ", "World", "!"};
    std::string sentence = std::accumulate(words.begin(), words.end(),
        std::string(""));
    std::cout << "Sentence: " << sentence << std::endl;

    // Calculate running average
    std::vector<double> values = {1.0, 2.0, 3.0, 4.0, 5.0};
    double avg = std::accumulate(values.begin(), values.end(), 0.0) /
                 values.size();
    std::cout << "Average: " << avg << std::endl;

    return 0;
}
```

### reduce (C++17)

Parallel-friendly reduction.

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <execution>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Simple reduction (order-independent)
    int sum = std::reduce(vec.begin(), vec.end());
    std::cout << "Sum: " << sum << std::endl;

    // With initial value
    int sum2 = std::reduce(vec.begin(), vec.end(), 0);

    // With custom operation
    int product = std::reduce(vec.begin(), vec.end(), 1,
                              std::multiplies<int>());

    // Parallel reduction
    int parallelSum = std::reduce(std::execution::par,
                                  vec.begin(), vec.end());

    return 0;
}
```

### inner_product

Compute inner (dot) product of two ranges.

```cpp
#include <numeric>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v1 = {1, 2, 3, 4, 5};
    std::vector<int> v2 = {10, 20, 30, 40, 50};

    // Dot product: 1*10 + 2*20 + 3*30 + 4*40 + 5*50
    int dotProduct = std::inner_product(v1.begin(), v1.end(),
                                        v2.begin(), 0);
    std::cout << "Dot product: " << dotProduct << std::endl;  // 550

    // Custom operations
    // Count matching elements
    int matches = std::inner_product(v1.begin(), v1.end(), v2.begin(), 0,
        std::plus<>(),
        [](int a, int b) { return a == b ? 1 : 0; });

    // Sum of absolute differences
    std::vector<int> a = {1, 2, 3, 4, 5};
    std::vector<int> b = {2, 3, 4, 5, 6};
    int diff = std::inner_product(a.begin(), a.end(), b.begin(), 0,
        std::plus<>(),
        [](int x, int y) { return std::abs(x - y); });
    std::cout << "Sum of differences: " << diff << std::endl;  // 5

    return 0;
}
```

### partial_sum

Compute running totals.

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::vector<int> result(vec.size());

    // Running sum: {1, 3, 6, 10, 15}
    std::partial_sum(vec.begin(), vec.end(), result.begin());

    std::cout << "Partial sums: ";
    for (int x : result) std::cout << x << " ";
    std::cout << std::endl;

    // Running product: {1, 2, 6, 24, 120}
    std::partial_sum(vec.begin(), vec.end(), result.begin(),
                     std::multiplies<int>());

    std::cout << "Partial products: ";
    for (int x : result) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### adjacent_difference

Compute differences between adjacent elements.

```cpp
#include <numeric>
#include <vector>
#include <iostream>
#include <iterator>

int main() {
    std::vector<int> vec = {1, 3, 6, 10, 15};
    std::vector<int> result(vec.size());

    // Differences: {1, 2, 3, 4, 5}
    std::adjacent_difference(vec.begin(), vec.end(), result.begin());

    std::cout << "Adjacent differences: ";
    for (int x : result) std::cout << x << " ";
    std::cout << std::endl;

    // Inverse of partial_sum
    std::vector<int> running = {1, 3, 6, 10, 15};
    std::vector<int> original(running.size());
    std::adjacent_difference(running.begin(), running.end(), original.begin());
    // original = {1, 2, 3, 4, 5}

    // Custom operation: ratios
    std::vector<double> values = {1.0, 2.0, 4.0, 8.0, 16.0};
    std::vector<double> ratios(values.size());
    std::adjacent_difference(values.begin(), values.end(), ratios.begin(),
        std::divides<double>());
    // ratios[0] = 1.0, rest are 2.0

    return 0;
}
```

### iota

Fill with incrementing values.

```cpp
#include <numeric>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec(10);

    // Fill with 0, 1, 2, 3, ...
    std::iota(vec.begin(), vec.end(), 0);

    std::cout << "Iota from 0: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    // Fill with 10, 11, 12, ...
    std::iota(vec.begin(), vec.end(), 10);

    std::cout << "Iota from 10: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    return 0;
}
```

### gcd and lcm (C++17)

Greatest common divisor and least common multiple.

```cpp
#include <numeric>
#include <iostream>

int main() {
    std::cout << "GCD(24, 36) = " << std::gcd(24, 36) << std::endl;  // 12
    std::cout << "LCM(4, 6) = " << std::lcm(4, 6) << std::endl;      // 12

    // Works with negative numbers
    std::cout << "GCD(-24, 36) = " << std::gcd(-24, 36) << std::endl;  // 12

    // GCD of multiple numbers
    int result = std::gcd(std::gcd(12, 18), 24);
    std::cout << "GCD(12, 18, 24) = " << result << std::endl;  // 6

    return 0;
}
```

## C++17 Parallel Algorithms

C++17 introduced execution policies for parallel algorithm execution.

```cpp
#include <algorithm>
#include <numeric>
#include <vector>
#include <execution>
#include <iostream>
#include <chrono>

int main() {
    std::vector<int> vec(10'000'000);
    std::iota(vec.begin(), vec.end(), 0);

    // Sequential execution (default)
    auto start = std::chrono::high_resolution_clock::now();
    std::sort(std::execution::seq, vec.begin(), vec.end());
    auto end = std::chrono::high_resolution_clock::now();
    std::cout << "Sequential: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count()
              << "ms\n";

    // Parallel execution
    std::shuffle(vec.begin(), vec.end(), std::mt19937{});
    start = std::chrono::high_resolution_clock::now();
    std::sort(std::execution::par, vec.begin(), vec.end());
    end = std::chrono::high_resolution_clock::now();
    std::cout << "Parallel: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count()
              << "ms\n";

    // Parallel unsequenced (vectorized)
    std::shuffle(vec.begin(), vec.end(), std::mt19937{});
    start = std::chrono::high_resolution_clock::now();
    std::sort(std::execution::par_unseq, vec.begin(), vec.end());
    end = std::chrono::high_resolution_clock::now();
    std::cout << "Parallel unsequenced: "
              << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count()
              << "ms\n";

    // Parallel algorithms
    long long sum = std::reduce(std::execution::par, vec.begin(), vec.end(), 0LL);

    std::vector<int> result(vec.size());
    std::transform(std::execution::par, vec.begin(), vec.end(), result.begin(),
        [](int x) { return x * 2; });

    auto it = std::find(std::execution::par, vec.begin(), vec.end(), 42);

    return 0;
}
```

### Execution Policies

| Policy | Description |
|--------|-------------|
| `std::execution::seq` | Sequential execution (no parallelism) |
| `std::execution::par` | Parallel execution (multithreaded) |
| `std::execution::par_unseq` | Parallel and vectorized execution |
| `std::execution::unseq` (C++20) | Vectorized execution on single thread |

## C++20 Ranges Algorithms

C++20 introduces ranges, providing a more modern and composable approach to algorithms.

### Basic Ranges

```cpp
#include <algorithm>
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3, 7, 4, 6};

    // Ranges version - pass container directly
    std::ranges::sort(vec);

    std::cout << "Sorted: ";
    for (int x : vec) std::cout << x << " ";
    std::cout << std::endl;

    // Find with ranges
    auto it = std::ranges::find(vec, 5);
    if (it != vec.end()) {
        std::cout << "Found 5" << std::endl;
    }

    // Projections - apply function before comparison
    std::vector<std::string> words = {"apple", "Banana", "cherry"};
    std::ranges::sort(words, {}, [](const std::string& s) {
        std::string lower = s;
        std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
        return lower;
    });

    return 0;
}
```

### Range Views

Views are lazy, composable transformations.

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Filter and transform
    auto result = vec
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; });

    std::cout << "Even squares: ";
    for (int x : result) std::cout << x << " ";  // 4 16 36 64 100
    std::cout << std::endl;

    // Take first N elements
    for (int x : vec | std::views::take(5)) {
        std::cout << x << " ";
    }
    std::cout << std::endl;

    // Drop first N elements
    for (int x : vec | std::views::drop(5)) {
        std::cout << x << " ";
    }
    std::cout << std::endl;

    // Reverse view
    for (int x : vec | std::views::reverse) {
        std::cout << x << " ";
    }
    std::cout << std::endl;

    // Generate a range of numbers
    for (int x : std::views::iota(1, 11)) {
        std::cout << x << " ";  // 1 2 3 4 5 6 7 8 9 10
    }
    std::cout << std::endl;

    return 0;
}
```

### Complex Range Pipelines

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <iostream>
#include <algorithm>

struct Person {
    std::string name;
    int age;
};

int main() {
    std::vector<Person> people = {
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 35},
        {"Diana", 28},
        {"Eve", 22}
    };

    // Get names of people over 25, sorted alphabetically
    auto names = people
        | std::views::filter([](const Person& p) { return p.age > 25; })
        | std::views::transform([](const Person& p) { return p.name; });

    std::vector<std::string> result(names.begin(), names.end());
    std::ranges::sort(result);

    std::cout << "Adults over 25: ";
    for (const auto& name : result) {
        std::cout << name << " ";
    }
    std::cout << std::endl;

    // Sum of ages of people whose names start with vowels
    auto vowelAges = people
        | std::views::filter([](const Person& p) {
            char c = std::tolower(p.name[0]);
            return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
        })
        | std::views::transform([](const Person& p) { return p.age; });

    int totalAge = 0;
    for (int age : vowelAges) {
        totalAge += age;
    }
    std::cout << "Total age (vowel names): " << totalAge << std::endl;

    return 0;
}
```

## Best Practices

### Prefer Algorithms Over Raw Loops

```cpp
// Bad: Manual loop
int count = 0;
for (auto it = vec.begin(); it != vec.end(); ++it) {
    if (*it > 5) count++;
}

// Good: Algorithm
int count = std::count_if(vec.begin(), vec.end(),
    [](int x) { return x > 5; });
```

### Use the Right Algorithm for the Task

```cpp
// Looking for existence? Use find, not count
auto it = std::find(vec.begin(), vec.end(), target);
bool found = (it != vec.end());

// Need sorted order? Use sort, not selection sort
std::sort(vec.begin(), vec.end());

// Need only top K elements? Use partial_sort
std::partial_sort(vec.begin(), vec.begin() + k, vec.end());

// Need the kth element? Use nth_element
std::nth_element(vec.begin(), vec.begin() + k, vec.end());
```

### Understand Time Complexity

| Algorithm | Average Case | Worst Case |
|-----------|--------------|------------|
| `find` | O(n) | O(n) |
| `binary_search` | O(log n) | O(log n) |
| `sort` | O(n log n) | O(n log n) |
| `partial_sort` | O(n log k) | O(n log k) |
| `nth_element` | O(n) | O(n^2) |
| `count` | O(n) | O(n) |

### Use Ranges for Cleaner Code (C++20)

```cpp
// Traditional
std::sort(vec.begin(), vec.end());
auto it = std::find(vec.begin(), vec.end(), target);

// Ranges (C++20)
std::ranges::sort(vec);
auto it = std::ranges::find(vec, target);
```

### Consider Parallel Execution for Large Data (C++17)

```cpp
// Only use parallel execution for large datasets
if (vec.size() > 10000) {
    std::sort(std::execution::par, vec.begin(), vec.end());
} else {
    std::sort(vec.begin(), vec.end());
}
```

### Use Projections for Complex Comparisons (C++20)

```cpp
struct Person { std::string name; int age; };

// Sort by age using projection
std::ranges::sort(people, {}, &Person::age);

// Sort by name length
std::ranges::sort(people, {},
    [](const Person& p) { return p.name.length(); });
```

### Avoid Iterator Invalidation

```cpp
// Bad: Iterator invalidation
for (auto it = vec.begin(); it != vec.end(); ++it) {
    if (*it % 2 == 0) {
        vec.erase(it);  // Invalidates iterator!
    }
}

// Good: Erase-remove idiom
vec.erase(
    std::remove_if(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; }),
    vec.end()
);

// C++20: Even simpler
std::erase_if(vec, [](int x) { return x % 2 == 0; });
```

## Summary

The C++ STL algorithms library provides a comprehensive set of tools for:

- **Searching**: `find`, `binary_search`, `search`
- **Sorting**: `sort`, `stable_sort`, `partial_sort`, `nth_element`
- **Modifying**: `copy`, `transform`, `remove`, `replace`
- **Numeric Operations**: `accumulate`, `reduce`, `inner_product`
- **Set Operations**: `set_union`, `set_intersection`, `merge`

Key takeaways:

1. **Use algorithms over raw loops** for clarity, correctness, and performance
2. **Choose the right algorithm** based on your specific needs and data characteristics
3. **Understand time complexity** to make informed decisions
4. **Leverage C++17 parallel algorithms** for large datasets
5. **Use C++20 ranges** for more expressive and composable code

Mastering STL algorithms enables you to write more efficient, maintainable, and expressive C++ code while leveraging decades of optimization work by the standard library implementers.
