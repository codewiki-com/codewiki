---
title: Exception Handling
description: Complete guide to C++ exception handling, try-catch, exception safety and best practices
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - Exceptions
  - Error Handling
  - RAII
status: imported
origin: old/src/content/docs/cpp/exceptions.en.md
divergence: 0.216
issues: []
legacy:
  category: Cpp
  subcategory: Core Concepts
  order: 13
  lastUpdated: 2026-01-07
---

Exception handling is a mechanism in C++ that allows programs to deal with unexpected situations (errors) in a structured and maintainable way. Instead of using error codes that can be ignored, exceptions provide a way to transfer control from the point where an error occurs to a handler that can deal with it.

## The Basics: try, throw, and catch

C++ exception handling revolves around three keywords:

- **`throw`**: Signals that an exception has occurred
- **`try`**: Defines a block of code where exceptions might be thrown
- **`catch`**: Handles exceptions thrown in the associated try block

### Basic Syntax

```cpp
#include <iostream>
#include <stdexcept>

double divide(double numerator, double denominator) {
    if (denominator == 0) {
        throw std::runtime_error("Division by zero");
    }
    return numerator / denominator;
}

int main() {
    try {
        double result = divide(10.0, 0.0);
        std::cout << "Result: " << result << std::endl;
    }
    catch (const std::runtime_error& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
    return 0;
}
```

### Throwing Exceptions

You can throw any type in C++, but it is strongly recommended to throw objects derived from `std::exception`:

```cpp
#include <stdexcept>
#include <string>

void validateAge(int age) {
    if (age < 0) {
        throw std::invalid_argument("Age cannot be negative");
    }
    if (age > 150) {
        throw std::out_of_range("Age exceeds maximum allowed value");
    }
}

void processFile(const std::string& filename) {
    if (filename.empty()) {
        throw std::invalid_argument("Filename cannot be empty");
    }
    // Process file...
}
```

### Catching Exceptions

Exceptions are caught by type, and you can have multiple catch blocks to handle different exception types:

```cpp
#include <iostream>
#include <stdexcept>
#include <new>

void processData(int* data, size_t size) {
    try {
        if (data == nullptr) {
            throw std::invalid_argument("Null pointer provided");
        }
        if (size == 0) {
            throw std::length_error("Size cannot be zero");
        }

        int* buffer = new int[size * 1000000];  // Might throw std::bad_alloc
        // Process data...
        delete[] buffer;
    }
    catch (const std::invalid_argument& e) {
        std::cerr << "Invalid argument: " << e.what() << std::endl;
    }
    catch (const std::length_error& e) {
        std::cerr << "Length error: " << e.what() << std::endl;
    }
    catch (const std::bad_alloc& e) {
        std::cerr << "Memory allocation failed: " << e.what() << std::endl;
    }
    catch (const std::exception& e) {
        // Catches any std::exception not caught above
        std::cerr << "Standard exception: " << e.what() << std::endl;
    }
    catch (...) {
        // Catches any exception not caught above
        std::cerr << "Unknown exception occurred" << std::endl;
    }
}
```

### Catch Block Order

Catch blocks are evaluated in order, so more specific exceptions should be caught before more general ones:

```cpp
// CORRECT: Specific to general
try {
    // code
}
catch (const std::out_of_range& e) { /* ... */ }
catch (const std::logic_error& e) { /* ... */ }
catch (const std::exception& e) { /* ... */ }
catch (...) { /* ... */ }

// WRONG: General catch hides specific ones
try {
    // code
}
catch (const std::exception& e) { /* catches everything */ }
catch (const std::out_of_range& e) { /* never reached! */ }
```

## The Standard Exception Hierarchy

C++ provides a hierarchy of exception classes in `<stdexcept>`:

```
std::exception
├── std::logic_error
│   ├── std::invalid_argument
│   ├── std::domain_error
│   ├── std::length_error
│   ├── std::out_of_range
│   └── std::future_error (C++11)
├── std::runtime_error
│   ├── std::range_error
│   ├── std::overflow_error
│   ├── std::underflow_error
│   └── std::system_error (C++11)
├── std::bad_alloc
├── std::bad_cast
├── std::bad_typeid
├── std::bad_exception
└── std::bad_function_call (C++11)
```

### Logic Errors vs Runtime Errors

- **Logic errors** (`std::logic_error`): Errors that could theoretically be detected before the program runs, such as violating preconditions
- **Runtime errors** (`std::runtime_error`): Errors that can only be detected during program execution

```cpp
#include <stdexcept>
#include <vector>
#include <cmath>

class Matrix {
public:
    Matrix(size_t rows, size_t cols) {
        if (rows == 0 || cols == 0) {
            // Logic error: could be prevented by checking input
            throw std::invalid_argument("Matrix dimensions must be positive");
        }
        // ...
    }
};

double safeSqrt(double x) {
    if (x < 0) {
        // Runtime error: input might be from user/file
        throw std::domain_error("Cannot compute square root of negative number");
    }
    return std::sqrt(x);
}
```

## Creating Custom Exceptions

For complex applications, creating custom exception classes provides more context and allows for exception-specific handling:

```cpp
#include <exception>
#include <string>
#include <sstream>

// Basic custom exception
class DatabaseException : public std::exception {
private:
    std::string message;
    int errorCode;

public:
    DatabaseException(const std::string& msg, int code)
        : message(msg), errorCode(code) {}

    const char* what() const noexcept override {
        return message.c_str();
    }

    int getErrorCode() const noexcept {
        return errorCode;
    }
};

// Exception with detailed context
class FileOperationException : public std::runtime_error {
private:
    std::string filename;
    int lineNumber;

public:
    FileOperationException(const std::string& msg,
                           const std::string& file,
                           int line)
        : std::runtime_error(buildMessage(msg, file, line)),
          filename(file), lineNumber(line) {}

    const std::string& getFilename() const noexcept { return filename; }
    int getLineNumber() const noexcept { return lineNumber; }

private:
    static std::string buildMessage(const std::string& msg,
                                    const std::string& file,
                                    int line) {
        std::ostringstream oss;
        oss << msg << " (file: " << file << ", line: " << line << ")";
        return oss.str();
    }
};

// Exception hierarchy for an application
class NetworkException : public std::runtime_error {
public:
    explicit NetworkException(const std::string& msg)
        : std::runtime_error(msg) {}
};

class ConnectionException : public NetworkException {
public:
    explicit ConnectionException(const std::string& host)
        : NetworkException("Failed to connect to: " + host) {}
};

class TimeoutException : public NetworkException {
public:
    TimeoutException(const std::string& operation, int timeoutMs)
        : NetworkException(operation + " timed out after " +
                          std::to_string(timeoutMs) + "ms") {}
};
```

### Using Custom Exceptions

```cpp
#include <iostream>

void connectToDatabase(const std::string& connectionString) {
    if (connectionString.empty()) {
        throw DatabaseException("Empty connection string", 1001);
    }
    // Attempt connection...
    throw DatabaseException("Connection refused", 1002);
}

int main() {
    try {
        connectToDatabase("server=localhost;db=test");
    }
    catch (const DatabaseException& e) {
        std::cerr << "Database error [" << e.getErrorCode() << "]: "
                  << e.what() << std::endl;
    }
    return 0;
}
```

## Stack Unwinding

When an exception is thrown, C++ performs **stack unwinding**: it destroys all local objects in the reverse order of their construction, from the throw point back to the matching catch handler.

```cpp
#include <iostream>
#include <string>

class Resource {
private:
    std::string name;

public:
    explicit Resource(const std::string& n) : name(n) {
        std::cout << "Resource " << name << " acquired" << std::endl;
    }

    ~Resource() {
        std::cout << "Resource " << name << " released" << std::endl;
    }
};

void innerFunction() {
    Resource r3("C");
    std::cout << "About to throw..." << std::endl;
    throw std::runtime_error("Something went wrong");
    std::cout << "This line never executes" << std::endl;
}

void middleFunction() {
    Resource r2("B");
    innerFunction();
}

void outerFunction() {
    Resource r1("A");
    middleFunction();
}

int main() {
    try {
        outerFunction();
    }
    catch (const std::exception& e) {
        std::cout << "Caught: " << e.what() << std::endl;
    }
    return 0;
}
```

Output:
```
Resource A acquired
Resource B acquired
Resource C acquired
About to throw...
Resource C released
Resource B released
Resource A released
Caught: Something went wrong
```

### The Importance of RAII

Stack unwinding makes **RAII (Resource Acquisition Is Initialization)** essential for exception safety. Resources managed by RAII objects are automatically cleaned up during stack unwinding:

```cpp
#include <memory>
#include <mutex>
#include <fstream>

void unsafeFunction() {
    int* data = new int[1000];
    // If an exception is thrown here, memory leaks!
    processData(data);
    delete[] data;  // Might never be reached
}

void safeFunction() {
    auto data = std::make_unique<int[]>(1000);
    // Even if an exception is thrown, unique_ptr cleans up
    processData(data.get());
}  // Automatic cleanup

void threadSafeOperation(std::mutex& mtx) {
    std::lock_guard<std::mutex> lock(mtx);
    // Even if an exception is thrown, mutex is released
    riskyOperation();
}  // Mutex automatically unlocked

void fileOperation(const std::string& filename) {
    std::ofstream file(filename);
    // Even if an exception is thrown, file is closed
    writeData(file);
}  // File automatically closed
```

## Exception Specifications and noexcept

### The noexcept Specifier (C++11)

The `noexcept` specifier indicates that a function does not throw exceptions:

```cpp
#include <vector>
#include <utility>

// Function that never throws
int add(int a, int b) noexcept {
    return a + b;
}

// Conditional noexcept based on expression
template<typename T>
void swap(T& a, T& b) noexcept(noexcept(T(std::move(a)))) {
    T temp = std::move(a);
    a = std::move(b);
    b = std::move(temp);
}

// Conditional noexcept using type traits
template<typename T>
class Container {
public:
    void push_back(const T& value)
        noexcept(std::is_nothrow_copy_constructible<T>::value) {
        // ...
    }

    void push_back(T&& value)
        noexcept(std::is_nothrow_move_constructible<T>::value) {
        // ...
    }
};
```

### Why noexcept Matters

1. **Optimization**: The compiler can optimize code when it knows exceptions won't be thrown
2. **Move operations**: `std::vector` and other containers use `noexcept` to decide whether to move or copy elements
3. **Documentation**: Clearly communicates the exception guarantee

```cpp
#include <vector>
#include <iostream>

class MyClass {
public:
    MyClass() = default;
    MyClass(const MyClass&) {
        std::cout << "Copy constructor" << std::endl;
    }
    MyClass(MyClass&&) noexcept {
        std::cout << "Move constructor" << std::endl;
    }
};

class MyClassThrowingMove {
public:
    MyClassThrowingMove() = default;
    MyClassThrowingMove(const MyClassThrowingMove&) {
        std::cout << "Copy constructor" << std::endl;
    }
    MyClassThrowingMove(MyClassThrowingMove&&) {  // Not noexcept!
        std::cout << "Move constructor" << std::endl;
    }
};

int main() {
    // With noexcept move: vector uses move operations
    std::vector<MyClass> v1;
    v1.reserve(1);
    v1.emplace_back();
    v1.emplace_back();  // Triggers reallocation, uses move

    std::cout << "---" << std::endl;

    // Without noexcept move: vector uses copy for safety
    std::vector<MyClassThrowingMove> v2;
    v2.reserve(1);
    v2.emplace_back();
    v2.emplace_back();  // Triggers reallocation, uses copy

    return 0;
}
```

### What Happens When noexcept Functions Throw?

If a function marked `noexcept` throws an exception, `std::terminate()` is called:

```cpp
void dangerous() noexcept {
    throw std::runtime_error("Oops!");  // Calls std::terminate()
}
```

### The noexcept Operator

The `noexcept` operator checks at compile time whether an expression can throw:

```cpp
#include <iostream>
#include <type_traits>

void mayThrow() { }
void noThrow() noexcept { }

int main() {
    std::cout << std::boolalpha;
    std::cout << "mayThrow(): " << noexcept(mayThrow()) << std::endl;  // false
    std::cout << "noThrow(): " << noexcept(noThrow()) << std::endl;    // true
    std::cout << "1 + 2: " << noexcept(1 + 2) << std::endl;            // true
    return 0;
}
```

## Exception Safety Levels

Exception safety refers to the guarantees a function provides when an exception is thrown. There are four levels:

### No-throw Guarantee (Nofail)

The function never throws exceptions and always succeeds.

```cpp
class SafeCounter {
    int count = 0;
public:
    int get() const noexcept {
        return count;
    }

    void increment() noexcept {
        ++count;
    }
};

// Destructors should always be no-throw
class Resource {
public:
    ~Resource() noexcept {
        // Cleanup that cannot fail
    }
};
```

### Strong Exception Guarantee (Commit or Rollback)

If an exception is thrown, the program state is unchanged (as if the operation never happened).

```cpp
#include <vector>
#include <algorithm>

class Document {
    std::vector<std::string> pages;

public:
    // Strong guarantee: either all pages are added, or none are
    void addPages(const std::vector<std::string>& newPages) {
        // Create a copy of current state
        std::vector<std::string> backup = pages;

        try {
            for (const auto& page : newPages) {
                pages.push_back(page);  // Might throw
            }
        }
        catch (...) {
            pages = std::move(backup);  // Restore original state
            throw;  // Re-throw the exception
        }
    }

    // Better implementation using copy-and-swap idiom
    void addPagesSafe(const std::vector<std::string>& newPages) {
        std::vector<std::string> temp = pages;  // Copy (might throw)
        for (const auto& page : newPages) {
            temp.push_back(page);  // Might throw
        }
        // If we get here, all operations succeeded
        std::swap(pages, temp);  // noexcept swap
    }
};
```

### Basic Exception Guarantee

If an exception is thrown, the object remains in a valid but unspecified state. No resources are leaked.

```cpp
#include <vector>

class DataProcessor {
    std::vector<int> data;
    size_t processedCount = 0;

public:
    // Basic guarantee: data might be partially processed,
    // but object is still valid (no leaks, can be destroyed)
    void processAll() {
        for (size_t i = 0; i < data.size(); ++i) {
            processItem(data[i]);  // Might throw
            ++processedCount;
        }
    }

private:
    void processItem(int& item) {
        // Processing that might throw
    }
};
```

### No Exception Safety

The function provides no guarantees. Resources may leak, and the object may be left in an invalid state. **Avoid this!**

```cpp
// BAD: No exception safety
class LeakyClass {
    int* data1 = nullptr;
    int* data2 = nullptr;

public:
    void allocate(size_t size) {
        data1 = new int[size];      // OK
        data2 = new int[size * 2];  // If this throws, data1 leaks!
    }
};

// GOOD: Exception safe version
class SafeClass {
    std::unique_ptr<int[]> data1;
    std::unique_ptr<int[]> data2;

public:
    void allocate(size_t size) {
        auto temp1 = std::make_unique<int[]>(size);
        auto temp2 = std::make_unique<int[]>(size * 2);
        // If we get here, both allocations succeeded
        data1 = std::move(temp1);
        data2 = std::move(temp2);
    }
};
```

## Re-throwing Exceptions

Sometimes you need to catch an exception, perform some action, and then re-throw it:

```cpp
#include <iostream>
#include <stdexcept>

void logAndRethrow() {
    try {
        riskyOperation();
    }
    catch (const std::exception& e) {
        std::cerr << "Logging error: " << e.what() << std::endl;
        throw;  // Re-throw the current exception
    }
}

// WRONG: This slices derived exceptions
void badRethrow() {
    try {
        riskyOperation();
    }
    catch (const std::exception& e) {
        std::cerr << "Logging error: " << e.what() << std::endl;
        throw e;  // Creates a new std::exception, loses derived type!
    }
}
```

### Exception Translation

Convert low-level exceptions to higher-level ones while preserving context:

```cpp
#include <stdexcept>
#include <system_error>

class ApplicationException : public std::runtime_error {
public:
    ApplicationException(const std::string& msg, std::exception_ptr cause)
        : std::runtime_error(msg), originalCause(cause) {}

    std::exception_ptr getCause() const { return originalCause; }

private:
    std::exception_ptr originalCause;
};

void highLevelOperation() {
    try {
        lowLevelFileOperation();
    }
    catch (const std::system_error& e) {
        // Translate to application-level exception
        throw ApplicationException(
            "Failed to complete operation",
            std::current_exception()
        );
    }
}
```

## Exception Handling in Constructors

Constructors require special care because an object isn't fully constructed until the constructor completes:

### Member Initializer Lists

If an exception is thrown in a member initializer list, already-constructed members are destroyed:

```cpp
#include <memory>
#include <string>
#include <stdexcept>

class Widget {
public:
    Widget(int id) {
        if (id < 0) throw std::invalid_argument("Invalid ID");
    }
};

class Gadget {
    std::string name;
    std::unique_ptr<Widget> widget;

public:
    // If Widget constructor throws, name is properly destroyed
    Gadget(const std::string& n, int widgetId)
        : name(n),                          // Constructed first
          widget(std::make_unique<Widget>(widgetId))  // Might throw
    {}
};
```

### Function Try Blocks

For handling exceptions in member initializer lists:

```cpp
class Database {
    Connection conn;

public:
    Database(const std::string& connStr)
    try : conn(connStr) {  // Function try block
        // Constructor body
    }
    catch (const ConnectionException& e) {
        // Log the error
        logError("Database connection failed: " + std::string(e.what()));
        // Note: Exception is automatically re-thrown for constructors
        // You can throw a different exception:
        throw DatabaseException("Failed to initialize database", e);
    }
};
```

## Exception Handling in Destructors

**Destructors should never throw exceptions.** If an exception escapes a destructor during stack unwinding (while handling another exception), `std::terminate()` is called.

```cpp
#include <iostream>
#include <exception>

class SafeResource {
public:
    ~SafeResource() noexcept {
        try {
            cleanup();  // Might throw internally
        }
        catch (const std::exception& e) {
            // Log but don't propagate
            std::cerr << "Cleanup error (suppressed): " << e.what() << std::endl;
        }
        catch (...) {
            std::cerr << "Unknown cleanup error (suppressed)" << std::endl;
        }
    }

private:
    void cleanup() {
        // Potentially throwing cleanup code
    }
};
```

### Checking for Active Exceptions

C++17 introduced `std::uncaught_exceptions()` to detect if stack unwinding is in progress:

```cpp
#include <exception>
#include <iostream>

class Transaction {
    int uncaughtOnEntry;
    bool committed = false;

public:
    Transaction() : uncaughtOnEntry(std::uncaught_exceptions()) {}

    void commit() { committed = true; }

    ~Transaction() noexcept {
        if (!committed) {
            // Check if we're being destroyed due to an exception
            if (std::uncaught_exceptions() > uncaughtOnEntry) {
                // Stack unwinding in progress, just rollback quietly
                silentRollback();
            } else {
                // Normal destruction without commit, might want to warn
                rollbackWithWarning();
            }
        }
    }

private:
    void silentRollback() noexcept { /* ... */ }
    void rollbackWithWarning() noexcept { /* ... */ }
};
```

## Best Practices

### Use Exceptions for Exceptional Conditions

```cpp
// GOOD: Exception for truly exceptional condition
std::vector<int> readConfigFile(const std::string& filename) {
    std::ifstream file(filename);
    if (!file) {
        throw std::runtime_error("Cannot open config file: " + filename);
    }
    // Read file...
}

// BAD: Using exceptions for normal control flow
bool containsValue(const std::vector<int>& vec, int value) {
    try {
        for (size_t i = 0; ; ++i) {
            if (vec.at(i) == value) return true;
        }
    }
    catch (const std::out_of_range&) {
        return false;  // Using exception as end-of-loop signal!
    }
}

// GOOD: Normal control flow
bool containsValue(const std::vector<int>& vec, int value) {
    return std::find(vec.begin(), vec.end(), value) != vec.end();
}
```

### Catch by Reference

```cpp
// GOOD: Catch by const reference
catch (const std::exception& e) { }

// ACCEPTABLE: Catch by reference if you need to modify
catch (std::exception& e) { }

// BAD: Catch by value (causes slicing)
catch (std::exception e) { }

// BAD: Catch by pointer (ownership issues)
catch (std::exception* e) { }
```

### Throw by Value, Catch by Reference

```cpp
void example() {
    // GOOD: Throw temporary objects
    throw std::runtime_error("Error message");

    // BAD: Throw pointer (who owns it?)
    throw new std::runtime_error("Error message");
}

void handler() {
    try {
        example();
    }
    catch (const std::runtime_error& e) {  // Catch by reference
        std::cerr << e.what() << std::endl;
    }
}
```

### Use noexcept Appropriately

```cpp
class MyClass {
public:
    // Destructors are implicitly noexcept
    ~MyClass() = default;

    // Move operations should be noexcept when possible
    MyClass(MyClass&& other) noexcept;
    MyClass& operator=(MyClass&& other) noexcept;

    // Swap should be noexcept
    void swap(MyClass& other) noexcept;

    // Simple getters
    int getValue() const noexcept { return value; }

private:
    int value;
};
```

### Prefer RAII Over Try-Catch for Cleanup

```cpp
// BAD: Manual cleanup with try-catch
void processFile(const std::string& filename) {
    FILE* file = fopen(filename.c_str(), "r");
    if (!file) throw std::runtime_error("Cannot open file");

    try {
        processContents(file);
    }
    catch (...) {
        fclose(file);
        throw;
    }
    fclose(file);
}

// GOOD: RAII handles cleanup automatically
void processFile(const std::string& filename) {
    std::ifstream file(filename);
    if (!file) throw std::runtime_error("Cannot open file");
    processContents(file);
}  // file automatically closed
```

### Document Exception Behavior

```cpp
/**
 * Reads data from the specified file.
 *
 * @param filename Path to the file to read
 * @return Vector containing the file data
 *
 * @throws std::invalid_argument if filename is empty
 * @throws std::runtime_error if file cannot be opened
 * @throws std::bad_alloc if memory allocation fails
 *
 * Exception safety: Strong guarantee
 */
std::vector<char> readFile(const std::string& filename);
```

### Consider Error Codes for Performance-Critical Code

In hot paths where exceptions would be thrown frequently, consider alternatives:

```cpp
#include <optional>
#include <variant>
#include <expected>  // C++23

// Using std::optional
std::optional<int> parseInt(const std::string& str) {
    try {
        return std::stoi(str);
    }
    catch (...) {
        return std::nullopt;
    }
}

// Using std::expected (C++23)
std::expected<int, std::string> parseIntExpected(const std::string& str) {
    try {
        return std::stoi(str);
    }
    catch (const std::exception& e) {
        return std::unexpected(e.what());
    }
}

// Using error codes
enum class ParseError { None, Empty, InvalidFormat, OutOfRange };

struct ParseResult {
    int value;
    ParseError error;
};

ParseResult parseIntWithError(const std::string& str);
```

## Complete Example: File Processing with Exception Safety

```cpp
#include <fstream>
#include <vector>
#include <string>
#include <stdexcept>
#include <memory>
#include <iostream>

// Custom exception hierarchy
class FileException : public std::runtime_error {
public:
    explicit FileException(const std::string& msg)
        : std::runtime_error(msg) {}
};

class FileNotFoundException : public FileException {
public:
    explicit FileNotFoundException(const std::string& filename)
        : FileException("File not found: " + filename) {}
};

class FileParseException : public FileException {
public:
    FileParseException(const std::string& filename, int line,
                       const std::string& reason)
        : FileException("Parse error in " + filename + " at line " +
                       std::to_string(line) + ": " + reason),
          lineNumber(line) {}

    int getLineNumber() const noexcept { return lineNumber; }

private:
    int lineNumber;
};

// RAII wrapper for resources
class FileProcessor {
public:
    explicit FileProcessor(const std::string& filename)
        : filename_(filename) {
        file_.open(filename);
        if (!file_) {
            throw FileNotFoundException(filename);
        }
    }

    // Strong exception guarantee
    std::vector<std::string> readAllLines() {
        std::vector<std::string> lines;
        std::string line;
        int lineNum = 0;

        while (std::getline(file_, line)) {
            ++lineNum;
            if (!validateLine(line)) {
                throw FileParseException(filename_, lineNum,
                                        "Invalid line format");
            }
            lines.push_back(std::move(line));
        }

        if (file_.bad()) {
            throw FileException("I/O error while reading " + filename_);
        }

        return lines;
    }

    // Destructor is noexcept by default
    ~FileProcessor() = default;

private:
    bool validateLine(const std::string& line) const noexcept {
        return !line.empty() && line[0] != '#';
    }

    std::string filename_;
    std::ifstream file_;
};

// High-level function with proper exception handling
void processConfigFiles(const std::vector<std::string>& filenames) {
    std::vector<std::string> allLines;
    std::vector<std::string> errors;

    for (const auto& filename : filenames) {
        try {
            FileProcessor processor(filename);
            auto lines = processor.readAllLines();

            // Strong guarantee: only add if all processing succeeded
            allLines.insert(allLines.end(),
                           std::make_move_iterator(lines.begin()),
                           std::make_move_iterator(lines.end()));
        }
        catch (const FileNotFoundException& e) {
            errors.push_back(e.what());
            // Continue processing other files
        }
        catch (const FileParseException& e) {
            errors.push_back(e.what());
            // Continue processing other files
        }
        catch (const FileException& e) {
            // More serious error, stop processing
            throw;
        }
    }

    // Report non-fatal errors
    for (const auto& error : errors) {
        std::cerr << "Warning: " << error << std::endl;
    }
}

int main() {
    try {
        processConfigFiles({"config1.txt", "config2.txt", "config3.txt"});
        std::cout << "Processing complete" << std::endl;
    }
    catch (const FileException& e) {
        std::cerr << "Fatal file error: " << e.what() << std::endl;
        return 1;
    }
    catch (const std::exception& e) {
        std::cerr << "Unexpected error: " << e.what() << std::endl;
        return 2;
    }

    return 0;
}
```

## Summary

Exception handling in C++ provides a powerful mechanism for dealing with errors:

1. **Use try-catch-throw** to separate error handling from normal logic
2. **Throw exceptions derived from std::exception** for consistency
3. **Understand stack unwinding** and rely on RAII for automatic cleanup
4. **Use noexcept** to indicate functions that don't throw and enable optimizations
5. **Know the exception safety levels** and design functions accordingly
6. **Never let exceptions escape destructors**
7. **Catch by reference, throw by value**
8. **Document exception behavior** in function interfaces

Proper exception handling leads to more robust, maintainable, and readable code by clearly separating the happy path from error handling logic while ensuring resources are properly managed even in the face of errors.
