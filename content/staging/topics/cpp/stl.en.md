---
title: C++ STL Standard Template Library
description: "Master C++ STL: containers, iterators, algorithms and function objects"
track: cpp
section: templates-generic
difficulty: intermediate
tags:
  - C++
  - STL
  - Containers
  - Algorithms
status: imported
origin: old/src/content/docs/cpp/stl.en.md
divergence: 0.229
issues: []
legacy:
  category: Cpp
  subcategory: STL
  order: 6
  lastUpdated: 2026-01-07
---

The Standard Template Library (STL) is a powerful collection of C++ template classes and functions that provides general-purpose data structures and algorithms. It is one of the most important features of modern C++ programming, enabling developers to write efficient, reusable, and type-safe code.

## Overview

The STL consists of four main components:

1. **Containers** - Data structures for storing collections of objects
2. **Iterators** - Objects that traverse through containers
3. **Algorithms** - Functions for processing container elements
4. **Function Objects (Functors)** - Objects that can be called as functions

## Containers

Containers are objects that store collections of other objects. The STL provides several types of containers, each optimized for different use cases.

### Sequence Containers

Sequence containers maintain elements in a linear sequence, where the order is determined by insertion.

#### vector

A dynamic array that provides fast random access and efficient insertion/deletion at the end.

```cpp
#include <iostream>
#include <vector>

int main() {
    // Creating and initializing vectors
    std::vector<int> vec1;                    // Empty vector
    std::vector<int> vec2(5);                 // 5 elements, default-initialized to 0
    std::vector<int> vec3(5, 10);             // 5 elements, all initialized to 10
    std::vector<int> vec4 = {1, 2, 3, 4, 5};  // Initializer list

    // Adding elements
    vec1.push_back(10);
    vec1.push_back(20);
    vec1.push_back(30);

    // Accessing elements
    std::cout << "First element: " << vec1[0] << std::endl;
    std::cout << "Second element: " << vec1.at(1) << std::endl;
    std::cout << "Last element: " << vec1.back() << std::endl;

    // Size and capacity
    std::cout << "Size: " << vec1.size() << std::endl;
    std::cout << "Capacity: " << vec1.capacity() << std::endl;

    // Iterating through vector
    for (const auto& val : vec1) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    // Removing elements
    vec1.pop_back();  // Remove last element

    // Inserting at specific position
    vec1.insert(vec1.begin() + 1, 15);  // Insert 15 at index 1

    // Erasing elements
    vec1.erase(vec1.begin());  // Remove first element

    // Clearing all elements
    vec1.clear();

    return 0;
}
```

**Time Complexity:**
- Access: O(1)
- Insertion/Deletion at end: O(1) amortized
- Insertion/Deletion at beginning or middle: O(n)

#### deque

A double-ended queue that allows fast insertion and deletion at both ends.

```cpp
#include <iostream>
#include <deque>

int main() {
    std::deque<int> dq = {3, 4, 5};

    // Adding elements at both ends
    dq.push_front(2);   // Add at front
    dq.push_back(6);    // Add at back

    // Accessing elements
    std::cout << "First: " << dq.front() << std::endl;  // 2
    std::cout << "Last: " << dq.back() << std::endl;    // 6

    // Random access
    std::cout << "Element at index 2: " << dq[2] << std::endl;

    // Removing elements
    dq.pop_front();  // Remove from front
    dq.pop_back();   // Remove from back

    // Display all elements
    for (const auto& val : dq) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

**Time Complexity:**
- Access: O(1)
- Insertion/Deletion at ends: O(1)
- Insertion/Deletion in middle: O(n)

#### list

A doubly-linked list that allows efficient insertion and deletion at any position.

```cpp
#include <iostream>
#include <list>

int main() {
    std::list<int> lst = {1, 2, 3, 4, 5};

    // Adding elements
    lst.push_front(0);
    lst.push_back(6);

    // Inserting at specific position
    auto it = lst.begin();
    std::advance(it, 3);  // Move iterator to position 3
    lst.insert(it, 99);

    // Removing elements
    lst.remove(99);  // Remove all elements with value 99

    // Reversing the list
    lst.reverse();

    // Sorting the list
    lst.sort();

    // Removing duplicates
    lst.unique();

    // Display elements
    for (const auto& val : lst) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

**Time Complexity:**
- Access: O(n)
- Insertion/Deletion: O(1) if position is known

#### forward_list

A singly-linked list (C++11) that uses less memory than list.

```cpp
#include <iostream>
#include <forward_list>

int main() {
    std::forward_list<int> flst = {1, 2, 3, 4, 5};

    // Adding elements at front
    flst.push_front(0);

    // Inserting after a position
    auto it = flst.begin();
    flst.insert_after(it, 10);

    // Removing elements
    flst.remove(10);

    // Display elements
    for (const auto& val : flst) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

#### array

A fixed-size array container (C++11) that wraps standard arrays with STL interface.

```cpp
#include <iostream>
#include <array>

int main() {
    std::array<int, 5> arr = {1, 2, 3, 4, 5};

    // Size is fixed
    std::cout << "Size: " << arr.size() << std::endl;

    // Accessing elements
    std::cout << "First: " << arr.front() << std::endl;
    std::cout << "Last: " << arr.back() << std::endl;
    std::cout << "At index 2: " << arr[2] << std::endl;

    // Filling with value
    arr.fill(0);

    // Swapping arrays
    std::array<int, 5> arr2 = {10, 20, 30, 40, 50};
    arr.swap(arr2);

    return 0;
}
```

### Associative Containers

Associative containers store elements in a sorted order and provide fast lookup based on keys.

#### set

A sorted collection of unique elements.

```cpp
#include <iostream>
#include <set>

int main() {
    std::set<int> s = {5, 2, 8, 1, 9};

    // Elements are automatically sorted: 1, 2, 5, 8, 9
    // Duplicates are automatically removed

    // Inserting elements
    s.insert(3);
    s.insert(2);  // Duplicate, won't be inserted

    // Finding elements
    auto it = s.find(5);
    if (it != s.end()) {
        std::cout << "Found: " << *it << std::endl;
    }

    // Checking if element exists
    if (s.count(8) > 0) {
        std::cout << "8 exists in set" << std::endl;
    }

    // Removing elements
    s.erase(1);

    // Lower and upper bound
    auto lb = s.lower_bound(5);  // Iterator to first element >= 5
    auto ub = s.upper_bound(5);  // Iterator to first element > 5

    // Display elements (always in sorted order)
    for (const auto& val : s) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

**Time Complexity:**
- Search, Insert, Delete: O(log n)

#### multiset

Similar to set, but allows duplicate elements.

```cpp
#include <iostream>
#include <set>

int main() {
    std::multiset<int> ms = {5, 2, 8, 2, 9, 2};

    // Duplicates are allowed and maintained
    ms.insert(2);

    // Count occurrences
    std::cout << "Count of 2: " << ms.count(2) << std::endl;

    // Erase all occurrences of a value
    ms.erase(2);

    // Erase single occurrence
    auto it = ms.find(5);
    if (it != ms.end()) {
        ms.erase(it);
    }

    return 0;
}
```

#### map

A sorted collection of key-value pairs with unique keys.

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> ages;

    // Inserting elements
    ages["Alice"] = 25;
    ages["Bob"] = 30;
    ages["Charlie"] = 35;

    // Alternative insertion methods
    ages.insert({"David", 28});
    ages.insert(std::make_pair("Eve", 32));

    // Accessing elements
    std::cout << "Alice's age: " << ages["Alice"] << std::endl;

    // Safe access with at() (throws exception if key doesn't exist)
    try {
        std::cout << "Bob's age: " << ages.at("Bob") << std::endl;
    } catch (const std::out_of_range& e) {
        std::cout << "Key not found" << std::endl;
    }

    // Checking if key exists
    if (ages.find("Charlie") != ages.end()) {
        std::cout << "Charlie exists in map" << std::endl;
    }

    // Using count
    if (ages.count("David") > 0) {
        std::cout << "David exists in map" << std::endl;
    }

    // Iterating through map
    for (const auto& pair : ages) {
        std::cout << pair.first << ": " << pair.second << std::endl;
    }

    // Removing elements
    ages.erase("Eve");

    return 0;
}
```

**Time Complexity:**
- Search, Insert, Delete: O(log n)

#### multimap

Similar to map, but allows duplicate keys.

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::multimap<std::string, int> scores;

    // Inserting multiple values for same key
    scores.insert({"Math", 85});
    scores.insert({"Math", 90});
    scores.insert({"Math", 78});
    scores.insert({"English", 92});

    // Count entries for a key
    std::cout << "Math scores count: " << scores.count("Math") << std::endl;

    // Finding all values for a key
    auto range = scores.equal_range("Math");
    std::cout << "Math scores: ";
    for (auto it = range.first; it != range.second; ++it) {
        std::cout << it->second << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### Unordered Containers (Hash Tables)

Unordered containers (C++11) use hash tables for fast average-case lookup.

#### unordered_set

```cpp
#include <iostream>
#include <unordered_set>

int main() {
    std::unordered_set<int> us = {5, 2, 8, 1, 9};

    // Inserting elements
    us.insert(3);
    us.insert(2);  // Duplicate, won't be inserted

    // Finding elements - O(1) average
    auto it = us.find(5);
    if (it != us.end()) {
        std::cout << "Found: " << *it << std::endl;
    }

    // Checking existence
    if (us.count(8) > 0) {
        std::cout << "8 exists" << std::endl;
    }

    // Elements are NOT in sorted order
    for (const auto& val : us) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

**Time Complexity:**
- Search, Insert, Delete: O(1) average, O(n) worst case

#### unordered_map

```cpp
#include <iostream>
#include <unordered_map>
#include <string>

int main() {
    std::unordered_map<std::string, int> umap;

    // Inserting elements
    umap["Apple"] = 5;
    umap["Banana"] = 3;
    umap["Orange"] = 7;

    // Fast lookup - O(1) average
    std::cout << "Apple count: " << umap["Apple"] << std::endl;

    // Finding elements
    auto it = umap.find("Banana");
    if (it != umap.end()) {
        std::cout << it->first << ": " << it->second << std::endl;
    }

    // Bucket information
    std::cout << "Bucket count: " << umap.bucket_count() << std::endl;
    std::cout << "Load factor: " << umap.load_factor() << std::endl;

    return 0;
}
```

### Container Adapters

Container adapters provide different interfaces to underlying containers.

#### stack

LIFO (Last-In-First-Out) data structure.

```cpp
#include <iostream>
#include <stack>

int main() {
    std::stack<int> stk;

    // Pushing elements
    stk.push(10);
    stk.push(20);
    stk.push(30);

    // Accessing top element
    std::cout << "Top: " << stk.top() << std::endl;

    // Size
    std::cout << "Size: " << stk.size() << std::endl;

    // Popping elements
    while (!stk.empty()) {
        std::cout << stk.top() << " ";
        stk.pop();
    }
    std::cout << std::endl;

    return 0;
}
```

#### queue

FIFO (First-In-First-Out) data structure.

```cpp
#include <iostream>
#include <queue>

int main() {
    std::queue<int> q;

    // Enqueuing elements
    q.push(10);
    q.push(20);
    q.push(30);

    // Accessing front and back
    std::cout << "Front: " << q.front() << std::endl;
    std::cout << "Back: " << q.back() << std::endl;

    // Dequeuing elements
    while (!q.empty()) {
        std::cout << q.front() << " ";
        q.pop();
    }
    std::cout << std::endl;

    return 0;
}
```

#### priority_queue

A queue where elements are ordered by priority (max-heap by default).

```cpp
#include <iostream>
#include <queue>
#include <vector>

int main() {
    // Max-heap (default)
    std::priority_queue<int> maxHeap;
    maxHeap.push(30);
    maxHeap.push(10);
    maxHeap.push(50);
    maxHeap.push(20);

    std::cout << "Max-heap: ";
    while (!maxHeap.empty()) {
        std::cout << maxHeap.top() << " ";  // 50 30 20 10
        maxHeap.pop();
    }
    std::cout << std::endl;

    // Min-heap
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    minHeap.push(30);
    minHeap.push(10);
    minHeap.push(50);
    minHeap.push(20);

    std::cout << "Min-heap: ";
    while (!minHeap.empty()) {
        std::cout << minHeap.top() << " ";  // 10 20 30 50
        minHeap.pop();
    }
    std::cout << std::endl;

    return 0;
}
```

## Iterators

Iterators are objects that point to elements in containers and allow traversal through container elements.

### Iterator Categories

1. **Input Iterator** - Read only, forward movement
2. **Output Iterator** - Write only, forward movement
3. **Forward Iterator** - Read/Write, forward movement
4. **Bidirectional Iterator** - Read/Write, forward and backward movement
5. **Random Access Iterator** - Read/Write, can jump to any position

### Iterator Operations

```cpp
#include <iostream>
#include <vector>
#include <list>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Basic iterator operations
    auto it = vec.begin();        // Iterator to first element
    auto end_it = vec.end();      // Iterator past last element

    // Dereferencing
    std::cout << "First element: " << *it << std::endl;

    // Incrementing
    ++it;  // Move to next element
    std::cout << "Second element: " << *it << std::endl;

    // Random access (only for random access iterators)
    it += 2;  // Jump 2 positions
    std::cout << "Fourth element: " << *it << std::endl;

    // Reverse iterators
    auto rit = vec.rbegin();
    std::cout << "Last element: " << *rit << std::endl;

    // Const iterators
    std::vector<int>::const_iterator cit = vec.cbegin();

    // Distance between iterators
    auto dist = std::distance(vec.begin(), vec.end());
    std::cout << "Distance: " << dist << std::endl;

    // Advance iterator
    auto it2 = vec.begin();
    std::advance(it2, 3);
    std::cout << "Element at position 3: " << *it2 << std::endl;

    return 0;
}
```

### Iterator Invalidation

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Safe iteration
    for (auto it = vec.begin(); it != vec.end(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;

    // Unsafe: modifying container while iterating
    // This can invalidate iterators
    for (auto it = vec.begin(); it != vec.end(); ) {
        if (*it % 2 == 0) {
            it = vec.erase(it);  // erase returns next valid iterator
        } else {
            ++it;
        }
    }

    return 0;
}
```

## Algorithms

The STL provides a rich set of algorithms for common operations on containers.

### Non-modifying Algorithms

#### find and find_if

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // Find specific value
    auto it = std::find(vec.begin(), vec.end(), 5);
    if (it != vec.end()) {
        std::cout << "Found: " << *it << std::endl;
    }

    // Find with predicate
    auto it2 = std::find_if(vec.begin(), vec.end(),
        [](int x) { return x > 5; });
    if (it2 != vec.end()) {
        std::cout << "First element > 5: " << *it2 << std::endl;
    }

    return 0;
}
```

#### count and count_if

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // Count specific value
    int count = std::count(vec.begin(), vec.end(), 2);
    std::cout << "Count of 2: " << count << std::endl;

    // Count with predicate
    int even_count = std::count_if(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; });
    std::cout << "Count of even numbers: " << even_count << std::endl;

    return 0;
}
```

#### all_of, any_of, none_of

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {2, 4, 6, 8, 10};

    // Check if all elements satisfy condition
    bool all_even = std::all_of(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; });
    std::cout << "All even: " << all_even << std::endl;

    // Check if any element satisfies condition
    bool any_greater_5 = std::any_of(vec.begin(), vec.end(),
        [](int x) { return x > 5; });
    std::cout << "Any > 5: " << any_greater_5 << std::endl;

    // Check if no element satisfies condition
    bool none_odd = std::none_of(vec.begin(), vec.end(),
        [](int x) { return x % 2 != 0; });
    std::cout << "None odd: " << none_odd << std::endl;

    return 0;
}
```

### Modifying Algorithms

#### transform

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::vector<int> result(vec.size());

    // Transform each element
    std::transform(vec.begin(), vec.end(), result.begin(),
        [](int x) { return x * 2; });

    std::cout << "Transformed: ";
    for (int val : result) {
        std::cout << val << " ";  // 2 4 6 8 10
    }
    std::cout << std::endl;

    return 0;
}
```

#### copy and copy_if

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6};
    std::vector<int> dest(6);
    std::vector<int> even_dest;

    // Copy all elements
    std::copy(vec.begin(), vec.end(), dest.begin());

    // Copy with condition
    std::copy_if(vec.begin(), vec.end(), std::back_inserter(even_dest),
        [](int x) { return x % 2 == 0; });

    std::cout << "Even numbers: ";
    for (int val : even_dest) {
        std::cout << val << " ";  // 2 4 6
    }
    std::cout << std::endl;

    return 0;
}
```

#### fill and generate

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec(5);

    // Fill with same value
    std::fill(vec.begin(), vec.end(), 10);

    // Generate with function
    int n = 0;
    std::generate(vec.begin(), vec.end(), [&n]() { return n++; });

    for (int val : vec) {
        std::cout << val << " ";  // 0 1 2 3 4
    }
    std::cout << std::endl;

    return 0;
}
```

#### remove and remove_if

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // Remove specific value (doesn't actually remove, just moves to end)
    auto new_end = std::remove(vec.begin(), vec.end(), 2);
    vec.erase(new_end, vec.end());  // Actually remove

    // Remove with condition
    std::vector<int> vec2 = {1, 2, 3, 4, 5, 6};
    auto new_end2 = std::remove_if(vec2.begin(), vec2.end(),
        [](int x) { return x % 2 == 0; });
    vec2.erase(new_end2, vec2.end());

    std::cout << "After removing even: ";
    for (int val : vec2) {
        std::cout << val << " ";  // 1 3 5
    }
    std::cout << std::endl;

    return 0;
}
```

#### replace and replace_if

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 2, 4, 2, 5};

    // Replace specific value
    std::replace(vec.begin(), vec.end(), 2, 99);

    // Replace with condition
    std::vector<int> vec2 = {1, 2, 3, 4, 5, 6};
    std::replace_if(vec2.begin(), vec2.end(),
        [](int x) { return x % 2 == 0; }, 0);

    std::cout << "After replace_if: ";
    for (int val : vec2) {
        std::cout << val << " ";  // 1 0 3 0 5 0
    }
    std::cout << std::endl;

    return 0;
}
```

### Sorting and Partitioning

#### sort

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9, 3};

    // Sort ascending (default)
    std::sort(vec.begin(), vec.end());

    // Sort descending
    std::sort(vec.begin(), vec.end(), std::greater<int>());

    // Sort with custom comparator
    std::sort(vec.begin(), vec.end(),
        [](int a, int b) { return a > b; });

    // Partial sort
    std::vector<int> vec2 = {5, 2, 8, 1, 9, 3};
    std::partial_sort(vec2.begin(), vec2.begin() + 3, vec2.end());
    // First 3 elements are smallest in sorted order

    return 0;
}
```

#### stable_sort

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
    std::vector<Person> people = {
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 30},
        {"David", 25}
    };

    // Stable sort maintains relative order of equal elements
    std::stable_sort(people.begin(), people.end(),
        [](const Person& a, const Person& b) {
            return a.age < b.age;
        });

    for (const auto& p : people) {
        std::cout << p.name << " (" << p.age << ")" << std::endl;
    }

    return 0;
}
```

#### partition

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // Partition: even numbers before odd numbers
    auto partition_point = std::partition(vec.begin(), vec.end(),
        [](int x) { return x % 2 == 0; });

    std::cout << "After partition: ";
    for (int val : vec) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### Binary Search Algorithms (on sorted ranges)

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // Binary search - returns true if found
    bool found = std::binary_search(vec.begin(), vec.end(), 5);
    std::cout << "5 found: " << found << std::endl;

    // Lower bound - first element >= value
    auto lb = std::lower_bound(vec.begin(), vec.end(), 5);
    std::cout << "Lower bound of 5: " << *lb << std::endl;

    // Upper bound - first element > value
    auto ub = std::upper_bound(vec.begin(), vec.end(), 5);
    std::cout << "Upper bound of 5: " << *ub << std::endl;

    // Equal range - returns pair of lower and upper bound
    auto range = std::equal_range(vec.begin(), vec.end(), 5);
    std::cout << "Equal range: [" << *range.first << ", "
              << *range.second << ")" << std::endl;

    return 0;
}
```

### Set Operations (on sorted ranges)

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v1 = {1, 2, 3, 4, 5};
    std::vector<int> v2 = {3, 4, 5, 6, 7};
    std::vector<int> result;

    // Set union
    std::set_union(v1.begin(), v1.end(), v2.begin(), v2.end(),
        std::back_inserter(result));
    std::cout << "Union: ";
    for (int val : result) {
        std::cout << val << " ";  // 1 2 3 4 5 6 7
    }
    std::cout << std::endl;

    // Set intersection
    result.clear();
    std::set_intersection(v1.begin(), v1.end(), v2.begin(), v2.end(),
        std::back_inserter(result));
    std::cout << "Intersection: ";
    for (int val : result) {
        std::cout << val << " ";  // 3 4 5
    }
    std::cout << std::endl;

    // Set difference
    result.clear();
    std::set_difference(v1.begin(), v1.end(), v2.begin(), v2.end(),
        std::back_inserter(result));
    std::cout << "Difference: ";
    for (int val : result) {
        std::cout << val << " ";  // 1 2
    }
    std::cout << std::endl;

    return 0;
}
```

### Min/Max Algorithms

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {3, 1, 4, 1, 5, 9, 2, 6};

    // Min and max of two values
    int min_val = std::min(10, 20);
    int max_val = std::max(10, 20);

    // Min and max element in container
    auto min_it = std::min_element(vec.begin(), vec.end());
    auto max_it = std::max_element(vec.begin(), vec.end());
    std::cout << "Min: " << *min_it << ", Max: " << *max_it << std::endl;

    // Min-max element (returns pair)
    auto minmax = std::minmax_element(vec.begin(), vec.end());
    std::cout << "Min: " << *minmax.first
              << ", Max: " << *minmax.second << std::endl;

    return 0;
}
```

### Numeric Algorithms

```cpp
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};

    // Accumulate (sum)
    int sum = std::accumulate(vec.begin(), vec.end(), 0);
    std::cout << "Sum: " << sum << std::endl;

    // Accumulate with custom operation
    int product = std::accumulate(vec.begin(), vec.end(), 1,
        [](int a, int b) { return a * b; });
    std::cout << "Product: " << product << std::endl;

    // Partial sum
    std::vector<int> partial_sums(vec.size());
    std::partial_sum(vec.begin(), vec.end(), partial_sums.begin());
    std::cout << "Partial sums: ";
    for (int val : partial_sums) {
        std::cout << val << " ";  // 1 3 6 10 15
    }
    std::cout << std::endl;

    // Adjacent difference
    std::vector<int> diffs(vec.size());
    std::adjacent_difference(vec.begin(), vec.end(), diffs.begin());
    std::cout << "Adjacent differences: ";
    for (int val : diffs) {
        std::cout << val << " ";  // 1 1 1 1 1
    }
    std::cout << std::endl;

    // Inner product (dot product)
    std::vector<int> vec2 = {1, 2, 3, 4, 5};
    int dot = std::inner_product(vec.begin(), vec.end(), vec2.begin(), 0);
    std::cout << "Dot product: " << dot << std::endl;  // 55

    // Iota (fill with incrementing values)
    std::vector<int> iota_vec(5);
    std::iota(iota_vec.begin(), iota_vec.end(), 10);
    std::cout << "Iota: ";
    for (int val : iota_vec) {
        std::cout << val << " ";  // 10 11 12 13 14
    }
    std::cout << std::endl;

    return 0;
}
```

## Function Objects (Functors)

Function objects are objects that can be called like functions. They are useful for customizing algorithm behavior.

### Built-in Function Objects

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

int main() {
    std::vector<int> vec = {5, 2, 8, 1, 9};

    // Arithmetic operations
    std::plus<int> add;
    std::cout << "5 + 3 = " << add(5, 3) << std::endl;

    std::minus<int> subtract;
    std::multiplies<int> multiply;
    std::divides<int> divide;
    std::modulus<int> mod;
    std::negate<int> negate;

    // Comparison operations
    std::sort(vec.begin(), vec.end(), std::greater<int>());
    // Other comparisons: less, less_equal, greater_equal, equal_to, not_equal_to

    // Logical operations
    std::logical_and<bool> and_op;
    std::logical_or<bool> or_op;
    std::logical_not<bool> not_op;

    return 0;
}
```

### Custom Function Objects

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// Custom functor
class MultiplyBy {
private:
    int factor;
public:
    MultiplyBy(int f) : factor(f) {}

    int operator()(int x) const {
        return x * factor;
    }
};

// Functor with state
class Counter {
private:
    int count;
public:
    Counter() : count(0) {}

    int operator()() {
        return ++count;
    }

    int getCount() const { return count; }
};

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::vector<int> result(vec.size());

    // Use custom functor
    std::transform(vec.begin(), vec.end(), result.begin(),
        MultiplyBy(3));

    std::cout << "Multiplied by 3: ";
    for (int val : result) {
        std::cout << val << " ";  // 3 6 9 12 15
    }
    std::cout << std::endl;

    // Functor with state
    Counter counter;
    std::generate(vec.begin(), vec.end(), counter);

    std::cout << "Generated: ";
    for (int val : vec) {
        std::cout << val << " ";  // 1 2 3 4 5
    }
    std::cout << std::endl;

    return 0;
}
```

### Lambda Expressions (C++11)

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9};

    // Basic lambda
    auto is_even = [](int x) { return x % 2 == 0; };

    int even_count = std::count_if(vec.begin(), vec.end(), is_even);
    std::cout << "Even count: " << even_count << std::endl;

    // Lambda with capture
    int threshold = 5;
    auto greater_than_threshold = [threshold](int x) {
        return x > threshold;
    };

    // Capture by reference
    int sum = 0;
    std::for_each(vec.begin(), vec.end(), [&sum](int x) {
        sum += x;
    });
    std::cout << "Sum: " << sum << std::endl;

    // Capture all by value
    auto lambda1 = [=]() { return threshold; };

    // Capture all by reference
    auto lambda2 = [&]() { sum++; };

    // Mixed capture
    int multiplier = 2;
    auto lambda3 = [threshold, &sum, multiplier](int x) {
        sum += x;
        return x * multiplier > threshold;
    };

    // Mutable lambda (can modify captured values)
    int counter = 0;
    auto increment = [counter]() mutable {
        return ++counter;
    };

    std::cout << increment() << std::endl;  // 1
    std::cout << increment() << std::endl;  // 2
    std::cout << "Original counter: " << counter << std::endl;  // 0

    return 0;
}
```

### std::function and std::bind

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <algorithm>

int add(int a, int b) {
    return a + b;
}

class Calculator {
public:
    int multiply(int a, int b) {
        return a * b;
    }
};

int main() {
    // std::function - type-erased wrapper for callable objects
    std::function<int(int, int)> func1 = add;
    std::cout << "Function: " << func1(3, 4) << std::endl;

    // Store lambda
    std::function<int(int, int)> func2 = [](int a, int b) {
        return a - b;
    };
    std::cout << "Lambda: " << func2(10, 3) << std::endl;

    // Store member function
    Calculator calc;
    std::function<int(Calculator&, int, int)> func3 = &Calculator::multiply;
    std::cout << "Member function: " << func3(calc, 5, 6) << std::endl;

    // std::bind - create function objects with bound arguments
    auto add_5 = std::bind(add, std::placeholders::_1, 5);
    std::cout << "Bound function: " << add_5(10) << std::endl;  // 15

    // Bind member function
    auto bound_multiply = std::bind(&Calculator::multiply, &calc,
        std::placeholders::_1, std::placeholders::_2);
    std::cout << "Bound member: " << bound_multiply(3, 4) << std::endl;

    // Use with algorithms
    std::vector<int> vec = {1, 2, 3, 4, 5};
    auto greater_than = std::bind(std::greater<int>(),
        std::placeholders::_1, 3);

    int count = std::count_if(vec.begin(), vec.end(), greater_than);
    std::cout << "Count > 3: " << count << std::endl;

    return 0;
}
```

## Practical Examples

### Example 1: Word Frequency Counter

```cpp
#include <iostream>
#include <string>
#include <map>
#include <sstream>
#include <algorithm>

int main() {
    std::string text = "the quick brown fox jumps over the lazy dog the fox";
    std::map<std::string, int> word_count;

    // Tokenize and count
    std::istringstream iss(text);
    std::string word;
    while (iss >> word) {
        word_count[word]++;
    }

    // Display results
    std::cout << "Word frequencies:\n";
    for (const auto& pair : word_count) {
        std::cout << pair.first << ": " << pair.second << std::endl;
    }

    return 0;
}
```

### Example 2: Remove Duplicates

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 2, 3, 3, 3, 4, 5, 5};

    // Method 1: Using set
    std::set<int> unique_set(vec.begin(), vec.end());
    std::vector<int> result1(unique_set.begin(), unique_set.end());

    // Method 2: Sort and unique
    std::vector<int> result2 = vec;
    std::sort(result2.begin(), result2.end());
    auto last = std::unique(result2.begin(), result2.end());
    result2.erase(last, result2.end());

    std::cout << "Unique elements: ";
    for (int val : result2) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### Example 3: Finding Top K Elements

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>

std::vector<int> topKElements(std::vector<int>& nums, int k) {
    // Using priority queue (min-heap)
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;

    for (int num : nums) {
        minHeap.push(num);
        if (minHeap.size() > k) {
            minHeap.pop();
        }
    }

    std::vector<int> result;
    while (!minHeap.empty()) {
        result.push_back(minHeap.top());
        minHeap.pop();
    }

    return result;
}

int main() {
    std::vector<int> nums = {3, 2, 1, 5, 6, 4, 8, 7};
    int k = 3;

    std::vector<int> top_k = topKElements(nums, k);

    std::cout << "Top " << k << " elements: ";
    for (int val : top_k) {
        std::cout << val << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

### Example 4: Custom Sort with Multiple Criteria

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

struct Student {
    std::string name;
    int age;
    double gpa;
};

int main() {
    std::vector<Student> students = {
        {"Alice", 20, 3.8},
        {"Bob", 22, 3.5},
        {"Charlie", 20, 3.9},
        {"David", 21, 3.5}
    };

    // Sort by GPA descending, then by age ascending
    std::sort(students.begin(), students.end(),
        [](const Student& a, const Student& b) {
            if (a.gpa != b.gpa)
                return a.gpa > b.gpa;
            return a.age < b.age;
        });

    std::cout << "Sorted students:\n";
    for (const auto& s : students) {
        std::cout << s.name << " (Age: " << s.age
                  << ", GPA: " << s.gpa << ")\n";
    }

    return 0;
}
```

### Example 5: Data Processing Pipeline

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Pipeline: filter even numbers, square them, sum the result
    std::vector<int> even_nums;
    std::copy_if(data.begin(), data.end(), std::back_inserter(even_nums),
        [](int x) { return x % 2 == 0; });

    std::vector<int> squared;
    std::transform(even_nums.begin(), even_nums.end(),
        std::back_inserter(squared),
        [](int x) { return x * x; });

    int sum = std::accumulate(squared.begin(), squared.end(), 0);

    std::cout << "Sum of squares of even numbers: " << sum << std::endl;

    return 0;
}
```

## Best Practices

### Container Selection

- **vector**: Default choice for sequence containers
- **deque**: When you need efficient insertion/deletion at both ends
- **list**: When you need frequent insertion/deletion in the middle
- **set/map**: When you need sorted unique elements with fast lookup
- **unordered_set/unordered_map**: When you need fast lookup but don't need sorting

### Performance Tips

1. **Reserve capacity** for vectors when size is known:
```cpp
std::vector<int> vec;
vec.reserve(1000);  // Avoid multiple reallocations
```

2. **Use emplace instead of push** to construct in-place:
```cpp
vec.emplace_back(args);  // Constructs in-place
vec.push_back(T(args));  // Constructs temporary then copies
```

3. **Use const references** in range-based for loops:
```cpp
for (const auto& elem : container) {  // Avoid copying
    // ...
}
```

4. **Choose appropriate container** based on access patterns

5. **Use algorithms instead of raw loops** when possible

### Safety Guidelines

1. **Check container bounds** before accessing:
```cpp
if (index < vec.size()) {
    // Safe to access vec[index]
}
```

2. **Be aware of iterator invalidation**

3. **Use const iterators** when not modifying:
```cpp
for (auto it = vec.cbegin(); it != vec.cend(); ++it) {
    // Read-only access
}
```

4. **Prefer algorithms to handwritten loops** for clarity and safety

## Summary

The C++ STL provides a comprehensive set of tools for efficient programming:

- **Containers** organize data with different performance characteristics
- **Iterators** provide uniform access to container elements
- **Algorithms** perform common operations efficiently
- **Function objects** customize algorithm behavior

By mastering the STL, you can write more expressive, efficient, and maintainable C++ code. The library's generic design allows you to combine containers, algorithms, and function objects in flexible ways to solve complex problems with minimal code.
