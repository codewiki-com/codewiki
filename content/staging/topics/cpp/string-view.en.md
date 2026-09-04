---
title: "C++17 string_view: Non-owning String References"
description: Comprehensive guide to std::string_view in C++17, covering zero-copy string handling, memory efficiency, and practical implementation patterns for non-owning string references.
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++17
  - string_view
  - memory-efficiency
  - zero-copy
  - performance
status: imported
origin: old/src/content/docs/cpp/string-view.en.md
divergence: 0.179
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Cpp
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

## Concept Explanation

`std::string_view` is a lightweight, non-owning view of a contiguous sequence of characters introduced in C++17. It provides a way to reference string data without taking ownership, copying the data, or requiring null-termination guarantees beyond what's needed.

### Historical Context

Before C++17, developers had three main approaches to handle strings:

1. **Pass by const reference**: `const std::string&` - Safe but may require unnecessary allocations
2. **Pass by pointer**: `const char*` - Efficient but error-prone without null-termination guarantees
3. **Pass by value**: `std::string` - Ownership transfer with potential copies

Each approach had limitations. C++ needed a way to represent a non-owning, lightweight view of character sequences that could reference different string storage types uniformly.

### The Problem It Solves

String operations often don't need to own data. Consider:

```cpp
// Without string_view - requires copying or error-prone raw pointers
void processString(const std::string& str) {
    // Function doesn't own the string
    // But const std::string& requires a complete string object
}

// With string_view - zero-copy, type-safe
void processString(std::string_view str) {
    // Can accept std::string, string literals, std::array<char>, etc.
    // No copying or ownership transfer needed
}
```

## Core Principles

### Non-ownership and Lifetime Management

`string_view` holds a pointer to character data and a size, but does not own the data. This is critical:

```cpp
std::string str = "Hello";
std::string_view view = str;  // view references str's data

// Safe: view is used while str exists
std::cout << view;

// UNSAFE: dangling view after str is destroyed
std::string_view createDanglingView() {
    std::string temp = "Danger";
    return std::string_view(temp);  // Undefined behavior!
}
```

### Zero-Copy Semantics

`string_view` never copies character data. It always references existing data:

```cpp
std::string str = "Hello World";
std::string_view view1 = str;           // View of str
std::string_view view2 = view1.substr(0, 5);  // View of a substring, no copy!
std::string_view view3 = "Hello";       // View of string literal
std::string_view view4 = {'H', 'e', 'l', 'l', 'o'};  // C++20: from char array

// All are views - no allocations occurred
```

### Type Erasure and Uniformity

`string_view` provides a uniform interface regardless of the underlying storage:

```cpp
void display(std::string_view sv) {
    std::cout << sv << std::endl;
}

std::string stdStr = "From std::string";
const char* cStr = "From C string";
std::string_view view = "From string_view";
std::array<char, 5> charArr = {'A', 'r', 'r', 'a', 'y'};

display(stdStr);      // Works
display(cStr);        // Works
display(view);        // Works
display(charArr);     // Works (C++20)
```

## Key Points

### Size and Data Access

- `string_view` stores only a pointer and size
- Supports all const operations of `std::string`
- No null-termination guarantee (unlike C strings)
- Data may not be null-terminated

```cpp
std::string_view sv = "Hello";
std::cout << sv.size();        // 5
std::cout << sv.length();      // 5 (same as size())
std::cout << sv.data();        // Pointer to 'H'
std::cout << sv[0];            // 'H'
std::cout << sv.front();       // 'H'
std::cout << sv.back();        // 'o'
```

### Constness

All `string_view` objects are essentially const. You cannot modify data through a `string_view`:

```cpp
std::string_view sv = "Hello";
// sv[0] = 'J';  // Compile error: no operator[]=

// string_view itself can be reassigned
std::string str1 = "First";
std::string str2 = "Second";
sv = str1;  // OK: sv now views str1
sv = str2;  // OK: sv now views str2
```

### Iteration and Algorithms

`string_view` supports full iterator interface:

```cpp
std::string_view sv = "Hello";

// Range-based for loop
for (char c : sv) {
    std::cout << c;
}

// Algorithm support
std::find(sv.begin(), sv.end(), 'l');
std::reverse_iterator it = sv.rbegin();
```

### Substring Operations

The `substr()` function returns another `string_view` with no copying:

```cpp
std::string_view original = "Hello World";
std::string_view sub = original.substr(0, 5);  // Views "Hello"
std::string_view sub2 = original.substr(6);    // Views "World"

// Substring is a view of the same data
assert(sub.data() != original.data() + 1);  // Different starting pointers
assert(sub2.data() == original.data() + 6); // Same underlying data
```

### Conversion Considerations

- `string_view` converts implicitly from compatible types
- Conversion to `std::string` requires explicit construction
- C++17 implicit conversion from `string_view` to `const char*` not available by default

```cpp
std::string_view sv = "Hello";
std::string str = sv;  // Requires copy construction

// To get C string, must ensure null-termination explicitly
std::string nullTermStr(sv.data(), sv.size());
```

## Code Examples

### Basic Usage Pattern

```cpp
#include <string_view>
#include <iostream>
#include <vector>

// Function accepting string_view instead of const std::string&
void printInfo(std::string_view sv) {
    std::cout << "View: " << sv << '\n';
    std::cout << "Size: " << sv.size() << '\n';
    std::cout << "Empty: " << sv.empty() << '\n';
}

int main() {
    // From std::string
    std::string stdStr = "Hello from std::string";
    printInfo(stdStr);

    // From string literal
    printInfo("Hello from literal");

    // From another string_view
    std::string_view view = "Hello from view";
    printInfo(view);

    // From char pointer (if null-terminated)
    const char* cStr = "Hello from C string";
    printInfo(cStr);

    return 0;
}
```

### Substring Without Copying

```cpp
#include <string_view>
#include <iostream>

std::string_view extractWord(std::string_view sentence, size_t index) {
    auto start = sentence.find(' ', 0);
    for (size_t i = 0; i < index; ++i) {
        start = sentence.find(' ', start + 1);
        if (start == std::string_view::npos) return {};
    }

    size_t end = sentence.find(' ', start + 1);
    if (end == std::string_view::npos) end = sentence.size();

    return sentence.substr(start + 1, end - start - 1);
}

int main() {
    std::string sentence = "The quick brown fox jumps over lazy dog";

    // No copies of the sentence occur
    std::string_view word0 = extractWord(sentence, 0);  // "quick"
    std::string_view word1 = extractWord(sentence, 1);  // "brown"

    std::cout << "Word 0: " << word0 << '\n';
    std::cout << "Word 1: " << word1 << '\n';

    return 0;
}
```

### String Processing Without Allocation

```cpp
#include <string_view>
#include <string>
#include <vector>

class StringProcessor {
public:
    // Process returns number of matches (no string allocation)
    int countOccurrences(std::string_view text, std::string_view pattern) {
        int count = 0;
        size_t pos = 0;

        while ((pos = text.find(pattern, pos)) != std::string_view::npos) {
            ++count;
            pos += pattern.length();
        }

        return count;
    }

    // Split without allocating intermediate strings
    std::vector<std::string_view> split(std::string_view text, char delimiter) {
        std::vector<std::string_view> parts;
        size_t start = 0;

        while (true) {
            size_t end = text.find(delimiter, start);

            if (end == std::string_view::npos) {
                parts.push_back(text.substr(start));
                break;
            }

            parts.push_back(text.substr(start, end - start));
            start = end + 1;
        }

        return parts;
    }

    // Trim and strip operations without copies
    std::string_view trim(std::string_view text) {
        const auto start = text.find_first_not_of(" \t\n\r\f\v");
        if (start == std::string_view::npos) return std::string_view();

        const auto end = text.find_last_not_of(" \t\n\r\f\v");
        return text.substr(start, end - start + 1);
    }
};

int main() {
    StringProcessor processor;

    std::string data = "  Hello  World  How  Are  You  ";

    // All operations use views, no allocations for text processing
    std::string_view trimmed = processor.trim(data);
    std::cout << "Trimmed: [" << trimmed << "]\n";

    int count = processor.countOccurrences(data, " ");
    std::cout << "Spaces: " << count << '\n';

    auto parts = processor.split(trimmed, ' ');
    for (auto part : parts) {
        std::cout << "Part: " << part << '\n';
    }

    return 0;
}
```

### Function Overloading Benefit

```cpp
#include <string_view>
#include <string>
#include <iostream>

// Single function accepts multiple string types
class Logger {
public:
    void log(std::string_view message) {
        std::cout << "[LOG] " << message << '\n';
        // Implementation doesn't care about the source
        processMessage(message);
    }

private:
    void processMessage(std::string_view msg) {
        // Process without caring if it came from:
        // - std::string
        // - const char*
        // - string literal
        // - another string_view
    }
};

int main() {
    Logger logger;

    // All call the same function, no overloads needed
    logger.log("String literal");

    std::string stdString = "From std::string";
    logger.log(stdString);

    std::string_view view = "From view";
    logger.log(view);

    const char* cStr = "From C string";
    logger.log(cStr);

    return 0;
}
```

### Creating Views from Different Sources

```cpp
#include <string_view>
#include <string>
#include <array>
#include <iostream>

int main() {
    // From std::string
    std::string str = "Hello";
    std::string_view sv1 = str;

    // From string literal
    std::string_view sv2 = "Hello";

    // From const char* with explicit size
    const char* cstr = "Hello";
    std::string_view sv3(cstr, 5);

    // From char array
    std::array<char, 5> arr = {'H', 'e', 'l', 'l', 'o'};
    std::string_view sv4(arr.data(), arr.size());

    // Substring views
    std::string_view sv5 = sv1.substr(1, 3);  // "ell"

    // Empty view
    std::string_view sv6;

    // All views reference different sources, all are valid
    std::cout << sv1 << ", " << sv2 << ", " << sv3 << ", "
              << sv4 << ", " << sv5 << ", " << sv6 << '\n';

    return 0;
}
```

## Best Practices

### Use as Function Parameters

Replace `const std::string&` with `std::string_view` for read-only string parameters:

```cpp
// Before (C++11/14)
void processData(const std::string& data);
void findPattern(const std::string& text, const std::string& pattern);

// After (C++17+)
void processData(std::string_view data);
void findPattern(std::string_view text, std::string_view pattern);
```

**Benefits:**
- Accepts more types without overloading
- No unnecessary allocations
- Clearer intent (function won't modify string)

### Consider Lifetime Carefully

Always ensure the referenced data outlives the `string_view`:

```cpp
// Good: string_view scope doesn't exceed data lifetime
std::string str = "Hello";
std::string_view sv = str;
useStringView(sv);  // str still exists

// Bad: dangling string_view
std::string_view getDangling() {
    std::string temp = "Danger";
    return temp;  // Undefined behavior!
}

// Good: store the actual string if needed
std::string createSafe() {
    std::string temp = "Safe";
    return temp;  // Caller owns the string
}
```

### Prefer string_view for Library Interfaces

Library functions should accept `string_view`:

```cpp
// Library code (good for clients)
class FileProcessor {
public:
    bool processFile(std::string_view filename);
    bool parseData(std::string_view data);

    std::string_view getLastError() const;
};

// Client can pass different types
FileProcessor processor;
processor.processFile("config.txt");           // Literal
processor.processFile(std::string("data.txt")); // std::string
```

### Create Views Explicitly When Needed

```cpp
// Implicit conversion (preferred in most cases)
void process(std::string_view sv) {}
process("Hello");
process(std::string("Hello"));

// Explicit creation when you need to specify size
const char* data = "Hello";
std::string_view explicit_view(data, 5);  // Must provide size for non-null-terminated data

// View from vector-like structures
std::vector<char> vec = {'H', 'e', 'l', 'l', 'o'};
std::string_view vec_view(vec.data(), vec.size());
```

### Use for Internal Implementation

Use `string_view` internally to avoid unnecessary copies:

```cpp
class TextAnalyzer {
public:
    int analyzeText(std::string_view text) {
        return countWords(text) + countSentences(text);
    }

private:
    // Internal functions also use string_view
    int countWords(std::string_view text) {
        int count = 0;
        // Process without copying
        for (char c : text) {
            if (c == ' ') ++count;
        }
        return count + 1;
    }

    int countSentences(std::string_view text) {
        int count = 0;
        for (char c : text) {
            if (c == '.' || c == '!' || c == '?') ++count;
        }
        return count;
    }
};
```

### Document Lifetime Requirements

When returning `string_view`, document lifetime requirements:

```cpp
class TextBuffer {
public:
    // Returns a view valid only while this object exists
    std::string_view currentLine() const;

    // Safe: returns owned string
    std::string extractLine();

private:
    std::string buffer_;
};
```

## Common Pitfalls

### Dangling Views

The most critical pitfall - using a `string_view` after the referenced data is destroyed:

```cpp
// Dangerous!
std::string_view createView() {
    std::string temp = "Temporary";
    return std::string_view(temp);  // Undefined behavior!
}

std::string_view view = createView();
std::cout << view;  // Undefined behavior - temp was destroyed

// Correct
std::string createString() {
    return std::string("Safe");  // Caller takes ownership
}
```

### Assuming Null-Termination

`string_view` doesn't guarantee null-termination:

```cpp
std::string_view sv = "Hello";
const char* cstr = sv.data();
strlen(cstr);  // May crash - sv.data() not necessarily null-terminated!

// Safe way
std::string null_term(sv.begin(), sv.end());
strlen(null_term.c_str());  // Safe

// Or explicitly ensure it
std::string_view sub = sv.substr(0, 3);  // "Hel"
// sub.data()[3] could be anything
```

### Unintended Copies

Forgetting the implicit conversion to `std::string`:

```cpp
// Creates a copy
std::string copy = processString(view);  // Implicitly converts string_view to std::string

// Stays as view (preferred)
std::string_view view = processString(view);  // Still a view, no copy
```

### Modifying Source After View Creation

Modifying the underlying string while views exist can invalidate views:

```cpp
std::string str = "Hello";
std::string_view view = str;

str.push_back('!');  // Might reallocate, invalidating view if capacity exceeded

// Problem if reallocation occurred:
// view might now point to deallocated memory
std::cout << view;  // Undefined behavior
```

### Lifetime Issues with Temporary Strings

```cpp
// Dangerous
std::string_view view = std::string("Temporary");  // Temporary destroyed immediately!
std::cout << view;  // Undefined behavior

// Safe
std::string str = "Permanent";
std::string_view view = str;
std::cout << view;  // OK
```

### Not Converting to std::string When Needed

If you need ownership, convert explicitly:

```cpp
// Returns string_view from function
std::string_view getData();

// Store as view (dangerous - ownership is unclear)
std::string_view view = getData();  // May dangle

// Store as string (safe)
std::string owned = getData();  // Creates a copy, but safe ownership
```

## Performance Considerations

### Memory Overhead

`std::string_view` is minimal:

```cpp
// Typical implementation
class string_view {
    const char* ptr_;      // 8 bytes on 64-bit
    size_t size_;          // 8 bytes
};
// Total: 16 bytes (compare to std::string with SSO)
```

### Zero-Copy Operations

All operations on `string_view` avoid copying:

```cpp
std::string huge = "Very long string" /* ... millions of chars ... */;
std::string_view view = huge;              // No copy
view.substr(0, 10);                        // No copy
view.find("pattern");                      // Searches without copying
```

### Compiler Optimization

With `string_view`, compilers optimize better:

```cpp
// Before string_view (might create temporary strings)
void process(const std::string& s);
process(std::string(data, size));  // Temporary allocation

// After (optimized)
void process(std::string_view sv);
process(std::string_view(data, size));  // No allocation
```

### Benchmark Results

Typical performance improvements with `string_view`:

```
Operation: Process 1000 different substrings

With const std::string&:
- String copies: Yes
- Allocations: ~1000
- Time: ~5ms

With string_view:
- String copies: No
- Allocations: 0
- Time: ~0.5ms
```

### When Performance Matters Most

`string_view` shines in:

1. **String splitting** - no intermediate allocations
2. **Substring extraction** - views instead of copies
3. **Multiple passes** - reuse same view
4. **Low-level parsing** - minimal overhead

```cpp
// High-performance parsing without allocations
void parseCSV(std::string_view csv) {
    size_t start = 0;
    while (start < csv.size()) {
        auto comma = csv.find(',', start);
        if (comma == std::string_view::npos) comma = csv.size();

        std::string_view field = csv.substr(start, comma - start);
        // Process field view, no allocation

        start = comma + 1;
    }
}
```

## Real-world Scenarios

### Web Framework Request Handler

```cpp
#include <string_view>
#include <map>
#include <string>

class HttpRequest {
public:
    HttpRequest(std::string_view method, std::string_view path,
                std::string_view body)
        : method_(method), path_(path), body_(body) {}

    std::string_view method() const { return method_; }
    std::string_view path() const { return path_; }
    std::string_view body() const { return body_; }

private:
    std::string_view method_;
    std::string_view path_;
    std::string_view body_;
};

class Router {
public:
    void handle(const HttpRequest& req) {
        if (req.method() == "GET") {
            handleGet(req.path());
        } else if (req.method() == "POST") {
            handlePost(req.path(), req.body());
        }
    }

private:
    void handleGet(std::string_view path) {
        // Process GET request
    }

    void handlePost(std::string_view path, std::string_view body) {
        // Process POST request
    }
};
```

### Configuration File Parser

```cpp
#include <string_view>
#include <map>
#include <string>

class ConfigParser {
public:
    std::map<std::string, std::string> parse(std::string_view configText) {
        std::map<std::string, std::string> result;

        size_t pos = 0;
        while (pos < configText.size()) {
            // Skip whitespace and comments
            while (pos < configText.size() &&
                   (configText[pos] == '\n' || configText[pos] == ' ')) {
                ++pos;
            }

            if (pos >= configText.size()) break;

            // Parse key=value
            auto equals = configText.find('=', pos);
            if (equals == std::string_view::npos) break;

            std::string_view key = configText.substr(pos, equals - pos);
            auto eol = configText.find('\n', equals);
            if (eol == std::string_view::npos) eol = configText.size();

            std::string_view value = configText.substr(equals + 1, eol - equals - 1);

            // Convert views to owned strings for storage
            result[std::string(key)] = std::string(value);

            pos = eol + 1;
        }

        return result;
    }
};
```

### Database Query Builder

```cpp
#include <string_view>
#include <string>
#include <vector>
#include <sstream>

class QueryBuilder {
public:
    QueryBuilder& select(std::string_view columns) {
        select_ = columns;
        return *this;
    }

    QueryBuilder& from(std::string_view table) {
        table_ = table;
        return *this;
    }

    QueryBuilder& where(std::string_view condition) {
        conditions_.push_back(condition);
        return *this;
    }

    std::string build() const {
        std::ostringstream oss;
        oss << "SELECT " << select_ << " FROM " << table_;

        if (!conditions_.empty()) {
            oss << " WHERE ";
            for (size_t i = 0; i < conditions_.size(); ++i) {
                if (i > 0) oss << " AND ";
                oss << conditions_[i];
            }
        }

        return oss.str();
    }

private:
    std::string_view select_;
    std::string_view table_;
    std::vector<std::string_view> conditions_;
};

int main() {
    QueryBuilder qb;
    std::string query = qb
        .select("id, name, email")
        .from("users")
        .where("age > 18")
        .where("status = 'active'")
        .build();

    return 0;
}
```

## Interview Points

### What is string_view and why was it introduced?

**Answer:** `std::string_view` is a non-owning, lightweight view of a character sequence introduced in C++17. It was introduced to:
- Eliminate unnecessary string copies
- Provide a uniform interface for different string types
- Reduce memory allocations in high-performance code
- Avoid the ambiguity of raw pointers for string data

### How does string_view differ from const std::string&?

**Answer:**
- `string_view` is non-owning; `const std::string&` requires the actual string object
- `string_view` accepts multiple types (literals, char arrays) without overloading
- `string_view` has zero copy overhead
- `const std::string&` can always be null-terminated; `string_view` may not be
- `string_view` is typically passed by value (very small); `const std::string&` passed by reference

### What are the lifetime requirements for string_view?

**Answer:** The character data that a `string_view` references must remain valid for as long as the view is used. The view does not own the data, so:
- If the underlying string is destroyed, the view becomes dangling
- The view must be created and used within the lifetime of the data source
- Returning a view from a function where the source is local causes undefined behavior

### Why doesn't string_view guarantee null-termination?

**Answer:** `string_view` is meant to be a flexible view of any contiguous character sequence, including:
- Substrings of larger strings
- Arrays of characters
- Non-null-terminated data

Requiring null-termination would force unnecessary allocations or limit use cases. Callers who need null-termination must explicitly convert to `std::string`.

### When should you use string_view vs std::string?

**Answer:**
- Use `string_view` for: function parameters, read-only operations, temporary views, avoiding copies
- Use `std::string` for: owning data, modifying strings, when lifetime is unclear, API return values

### Can you pass string_view to functions expecting const char*?

**Answer:** Not directly. You would need:
```cpp
void oldAPI(const char* str);
std::string_view sv = "Hello";

// Option 1: Create temporary string (allocates)
oldAPI(std::string(sv).c_str());

// Option 2: Accept non-null-terminated data
oldAPI(sv.data());  // Danger if not null-terminated!
```

### What performance benefits does string_view provide?

**Answer:**
- Eliminates unnecessary string allocations and copies
- Enables zero-copy substring operations
- Reduces memory fragmentation
- Allows compiler optimizations
- Particularly beneficial for high-frequency operations like parsing, splitting, searching

### How do you handle string_view with C APIs that require null-terminated strings?

**Answer:**
```cpp
void cAPI(const char* str);
std::string_view sv = "Hello";

// Ensure null-termination
std::string temp(sv);
cAPI(temp.c_str());

// Or explicitly null-terminate
std::string nullTerm(sv.data(), sv.size());
cAPI(nullTerm.c_str());
```

## Further Reading

### Official Documentation
- [C++ Reference: std::basic_string_view](https://en.cppreference.com/w/cpp/string/basic_string_view)
- [C++17 Standard Library Features](https://en.cppreference.com/w/cpp/17)
- [ISO C++ String View Proposal (P0254)](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0254r2.pdf)

### Key References
- Meyers, Scott. "Effective Modern C++: 42 Specific Ways to Improve Your Use of C++11 and C++14" (covers principles applicable to string_view)
- [CppCon Talks on String Handling](https://cppcon.org)
- [Herb Sutter's Blog on Modern C++](https://herbsutter.com)

### Related Topics
- `std::span` (C++20) - similar concept for general arrays
- `std::string` - the owning counterpart
- Move semantics and RVO for string optimization
- RAII principles for lifetime management

### Practical Resources
- [Compiler Explorer (godbolt.org)](https://godbolt.org) - see generated code for string_view operations
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) - best practices
- Performance testing frameworks (Google Benchmark) for measuring string_view benefits

### Articles and Tutorials
- "Understanding std::string_view" - various C++ blogs
- "Zero-Copy String Handling in C++" - performance-focused articles
- Migration guides for replacing `const std::string&` with `string_view`

