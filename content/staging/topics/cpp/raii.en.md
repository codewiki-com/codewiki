---
title: RAII Pattern
description: Complete guide to C++ RAII (Resource Acquisition Is Initialization), resource management and exception safety
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - RAII
  - Resource Management
  - Exception Safety
status: imported
origin: old/src/content/docs/cpp/raii.en.md
divergence: 0.129
issues: []
legacy:
  category: Cpp
  subcategory: Core Concepts
  order: 9
  lastUpdated: 2026-01-07
---

RAII (Resource Acquisition Is Initialization) is one of the most fundamental and powerful idioms in C++ programming. It provides a deterministic approach to resource management that eliminates entire categories of bugs, including resource leaks and exception-safety issues.

## What is RAII?

RAII ties the lifecycle of a resource to the lifetime of an object. When an object is created, it acquires the resource; when the object is destroyed, it releases the resource. This simple principle leverages C++'s deterministic destruction to guarantee proper cleanup.

The name "Resource Acquisition Is Initialization" can be misleading. A more descriptive name might be "Scope-Bound Resource Management" (SBRM), as the key insight is that resources are automatically released when their managing object goes out of scope.

### The Core Principle

```cpp
class Resource {
public:
    Resource() {
        // Acquire resource in constructor
        handle_ = acquire_resource();
    }

    ~Resource() {
        // Release resource in destructor
        release_resource(handle_);
    }

private:
    Handle handle_;
};

void example() {
    Resource r;          // Resource acquired
    // ... use resource
}                        // Resource automatically released
```

## Why RAII Matters

### The Problem with Manual Resource Management

Without RAII, code becomes riddled with cleanup logic that is error-prone and difficult to maintain:

```cpp
// Without RAII - error-prone approach
void process_file_manual(const std::string& filename) {
    FILE* file = fopen(filename.c_str(), "r");
    if (!file) {
        throw std::runtime_error("Cannot open file");
    }

    char* buffer = new char[1024];

    // What if this throws? file and buffer leak!
    process_data(file, buffer);

    // Easy to forget these cleanup steps
    delete[] buffer;
    fclose(file);
}
```

This code has several problems:
1. If `process_data` throws an exception, neither `buffer` nor `file` gets cleaned up
2. If we add an early return, we must remember to add cleanup before it
3. The cleanup code can easily be forgotten or incorrectly ordered

### The RAII Solution

```cpp
// With RAII - safe and clean
void process_file_raii(const std::string& filename) {
    std::ifstream file(filename);
    if (!file) {
        throw std::runtime_error("Cannot open file");
    }

    std::vector<char> buffer(1024);

    // If this throws, file and buffer are automatically cleaned up
    process_data(file, buffer);

    // No manual cleanup needed - destructors handle everything
}
```

## Standard Library RAII Types

C++ provides several RAII wrappers in the standard library:

### Smart Pointers

```cpp
#include <memory>

// unique_ptr - exclusive ownership
void unique_example() {
    auto ptr = std::make_unique<Widget>(42);
    ptr->do_something();
    // Widget automatically deleted when ptr goes out of scope
}

// shared_ptr - shared ownership with reference counting
void shared_example() {
    auto ptr1 = std::make_shared<Widget>(42);
    {
        auto ptr2 = ptr1;  // Reference count: 2
        ptr2->do_something();
    }  // ptr2 destroyed, reference count: 1
    ptr1->do_something();
}  // ptr1 destroyed, Widget deleted

// weak_ptr - non-owning observer
void weak_example() {
    std::weak_ptr<Widget> weak;
    {
        auto shared = std::make_shared<Widget>(42);
        weak = shared;

        if (auto locked = weak.lock()) {
            locked->do_something();
        }
    }  // Widget deleted

    // weak.lock() now returns nullptr
    if (auto locked = weak.lock()) {
        // This won't execute
    }
}
```

### Containers

All standard containers manage their memory automatically:

```cpp
void container_example() {
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::map<std::string, int> map = {{"one", 1}, {"two", 2}};
    std::string str = "Hello, RAII!";

    // All memory automatically freed when these go out of scope
}
```

### Lock Guards

```cpp
#include <mutex>

std::mutex mtx;

void thread_safe_operation() {
    std::lock_guard<std::mutex> lock(mtx);
    // Mutex is locked

    perform_critical_operation();  // Even if this throws...

}  // Mutex is automatically unlocked

// C++17 with CTAD (Class Template Argument Deduction)
void modern_locking() {
    std::scoped_lock lock(mtx);  // Deduces std::scoped_lock<std::mutex>
    // Can also lock multiple mutexes atomically
}
```

### File Streams

```cpp
#include <fstream>

void file_operations() {
    std::ofstream out("output.txt");
    out << "Hello, World!";
    // File automatically closed and flushed

    std::ifstream in("input.txt");
    std::string content;
    in >> content;
    // File automatically closed
}
```

## Exception Safety

RAII is the foundation of exception safety in C++. There are three levels of exception safety guarantees:

### Basic Guarantee

No resources are leaked, and objects remain in a valid (but possibly modified) state:

```cpp
class BasicSafe {
    std::vector<int> data_;

public:
    void add(int value) {
        data_.push_back(value);  // May throw, but vector handles cleanup
    }
};
```

### Strong Guarantee

Operations either complete successfully or have no effect (commit-or-rollback semantics):

```cpp
class StrongSafe {
    std::vector<int> data_;

public:
    void replace(const std::vector<int>& new_data) {
        std::vector<int> temp = new_data;  // Copy first (may throw)
        std::swap(data_, temp);            // noexcept swap
        // If copy throws, data_ is unchanged
    }
};
```

### No-throw Guarantee

Operations are guaranteed not to throw exceptions:

```cpp
class NoThrow {
    int value_;

public:
    int get() const noexcept {
        return value_;
    }

    void set(int v) noexcept {
        value_ = v;
    }
};
```

### RAII and Stack Unwinding

When an exception is thrown, the stack is unwound and all local objects are destroyed in reverse order of construction:

```cpp
void demonstrate_unwinding() {
    std::unique_ptr<A> a = std::make_unique<A>();
    std::unique_ptr<B> b = std::make_unique<B>();
    std::unique_ptr<C> c = std::make_unique<C>();

    throw std::runtime_error("Oops!");

    // Destructors called in order: ~C, ~B, ~A
    // All resources properly released
}
```

## Writing Custom RAII Classes

### Basic Structure

```cpp
class FileHandle {
public:
    explicit FileHandle(const char* filename, const char* mode)
        : handle_(fopen(filename, mode)) {
        if (!handle_) {
            throw std::runtime_error("Failed to open file");
        }
    }

    ~FileHandle() {
        if (handle_) {
            fclose(handle_);
        }
    }

    // Prevent copying
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    // Allow moving
    FileHandle(FileHandle&& other) noexcept
        : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    FileHandle& operator=(FileHandle&& other) noexcept {
        if (this != &other) {
            if (handle_) {
                fclose(handle_);
            }
            handle_ = other.handle_;
            other.handle_ = nullptr;
        }
        return *this;
    }

    FILE* get() const { return handle_; }

private:
    FILE* handle_;
};
```

### Generic RAII Wrapper

For ad-hoc resource management, you can create a generic wrapper:

```cpp
template<typename Resource, typename Deleter>
class ScopeGuard {
public:
    explicit ScopeGuard(Resource resource, Deleter deleter)
        : resource_(resource)
        , deleter_(std::move(deleter))
        , active_(true) {}

    ~ScopeGuard() {
        if (active_) {
            deleter_(resource_);
        }
    }

    // Non-copyable, non-movable
    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;

    void dismiss() { active_ = false; }

    Resource get() const { return resource_; }

private:
    Resource resource_;
    Deleter deleter_;
    bool active_;
};

// Usage
void example() {
    auto handle = acquire_handle();
    ScopeGuard guard(handle, [](Handle h) { release_handle(h); });

    // Use handle...
    // Automatically released at scope exit
}
```

### C++11 Scope Exit Pattern

```cpp
template<typename F>
class ScopeExit {
public:
    explicit ScopeExit(F&& func)
        : func_(std::forward<F>(func))
        , active_(true) {}

    ~ScopeExit() {
        if (active_) {
            func_();
        }
    }

    ScopeExit(ScopeExit&& other) noexcept
        : func_(std::move(other.func_))
        , active_(other.active_) {
        other.active_ = false;
    }

    ScopeExit(const ScopeExit&) = delete;
    ScopeExit& operator=(const ScopeExit&) = delete;

    void dismiss() { active_ = false; }

private:
    F func_;
    bool active_;
};

template<typename F>
ScopeExit<F> make_scope_exit(F&& func) {
    return ScopeExit<F>(std::forward<F>(func));
}

// Usage
void transaction() {
    begin_transaction();
    auto rollback = make_scope_exit([]{ rollback_transaction(); });

    perform_operations();  // May throw

    commit_transaction();
    rollback.dismiss();  // Don't rollback on success
}
```

## The Rule of Three/Five/Zero

These rules guide how to properly manage resources in classes.

### Rule of Three (C++98/03)

If a class defines any of these, it should define all three:
- Destructor
- Copy constructor
- Copy assignment operator

```cpp
class RuleOfThree {
    int* data_;
    size_t size_;

public:
    RuleOfThree(size_t size)
        : data_(new int[size])
        , size_(size) {}

    // Destructor
    ~RuleOfThree() {
        delete[] data_;
    }

    // Copy constructor
    RuleOfThree(const RuleOfThree& other)
        : data_(new int[other.size_])
        , size_(other.size_) {
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // Copy assignment operator
    RuleOfThree& operator=(const RuleOfThree& other) {
        if (this != &other) {
            delete[] data_;
            size_ = other.size_;
            data_ = new int[size_];
            std::copy(other.data_, other.data_ + size_, data_);
        }
        return *this;
    }
};
```

### Rule of Five (C++11)

Adds move semantics to the Rule of Three:
- Destructor
- Copy constructor
- Copy assignment operator
- Move constructor
- Move assignment operator

```cpp
class RuleOfFive {
    int* data_;
    size_t size_;

public:
    RuleOfFive(size_t size)
        : data_(new int[size])
        , size_(size) {}

    // Destructor
    ~RuleOfFive() {
        delete[] data_;
    }

    // Copy constructor
    RuleOfFive(const RuleOfFive& other)
        : data_(new int[other.size_])
        , size_(other.size_) {
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // Copy assignment operator (copy-and-swap idiom)
    RuleOfFive& operator=(RuleOfFive other) {
        swap(*this, other);
        return *this;
    }

    // Move constructor
    RuleOfFive(RuleOfFive&& other) noexcept
        : data_(other.data_)
        , size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    // Move assignment operator
    RuleOfFive& operator=(RuleOfFive&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    friend void swap(RuleOfFive& a, RuleOfFive& b) noexcept {
        using std::swap;
        swap(a.data_, b.data_);
        swap(a.size_, b.size_);
    }
};
```

### Rule of Zero (Modern C++)

Prefer using RAII types so your class doesn't need to manage resources directly:

```cpp
class RuleOfZero {
    std::vector<int> data_;  // Handles its own memory
    std::string name_;       // Handles its own memory

public:
    RuleOfZero(size_t size, std::string name)
        : data_(size)
        , name_(std::move(name)) {}

    // No destructor, copy, or move operations needed!
    // The compiler generates correct defaults automatically.
};
```

The Rule of Zero is the preferred approach in modern C++. It leads to simpler, more maintainable code with fewer bugs.

## Practical Examples

### Database Connection Pool

```cpp
class Connection {
public:
    void execute(const std::string& query);
    // ...
};

class ConnectionPool {
    std::vector<std::unique_ptr<Connection>> available_;
    std::mutex mutex_;

public:
    class PooledConnection {
        ConnectionPool& pool_;
        std::unique_ptr<Connection> conn_;

    public:
        PooledConnection(ConnectionPool& pool, std::unique_ptr<Connection> conn)
            : pool_(pool)
            , conn_(std::move(conn)) {}

        ~PooledConnection() {
            if (conn_) {
                pool_.return_connection(std::move(conn_));
            }
        }

        PooledConnection(PooledConnection&&) = default;
        PooledConnection& operator=(PooledConnection&&) = default;

        Connection* operator->() { return conn_.get(); }
        Connection& operator*() { return *conn_; }
    };

    PooledConnection acquire() {
        std::lock_guard<std::mutex> lock(mutex_);
        if (available_.empty()) {
            return PooledConnection(*this, std::make_unique<Connection>());
        }
        auto conn = std::move(available_.back());
        available_.pop_back();
        return PooledConnection(*this, std::move(conn));
    }

private:
    void return_connection(std::unique_ptr<Connection> conn) {
        std::lock_guard<std::mutex> lock(mutex_);
        available_.push_back(std::move(conn));
    }
};

// Usage
void database_operation(ConnectionPool& pool) {
    auto conn = pool.acquire();
    conn->execute("SELECT * FROM users");
    // Connection automatically returned to pool
}
```

### Timer/Profiler

```cpp
class ScopedTimer {
    std::string name_;
    std::chrono::high_resolution_clock::time_point start_;

public:
    explicit ScopedTimer(std::string name)
        : name_(std::move(name))
        , start_(std::chrono::high_resolution_clock::now()) {}

    ~ScopedTimer() {
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - start_
        );
        std::cout << name_ << " took " << duration.count() << " us\n";
    }

    ScopedTimer(const ScopedTimer&) = delete;
    ScopedTimer& operator=(const ScopedTimer&) = delete;
};

// Usage
void expensive_operation() {
    ScopedTimer timer("expensive_operation");

    // Do work...

}  // Prints: "expensive_operation took 1234 us"
```

### OpenGL Resource Management

```cpp
class Texture {
    GLuint id_ = 0;

public:
    Texture() {
        glGenTextures(1, &id_);
    }

    ~Texture() {
        if (id_) {
            glDeleteTextures(1, &id_);
        }
    }

    Texture(Texture&& other) noexcept : id_(other.id_) {
        other.id_ = 0;
    }

    Texture& operator=(Texture&& other) noexcept {
        if (this != &other) {
            if (id_) {
                glDeleteTextures(1, &id_);
            }
            id_ = other.id_;
            other.id_ = 0;
        }
        return *this;
    }

    Texture(const Texture&) = delete;
    Texture& operator=(const Texture&) = delete;

    void bind() const {
        glBindTexture(GL_TEXTURE_2D, id_);
    }

    GLuint get() const { return id_; }
};
```

### Temporary Directory

```cpp
class TempDirectory {
    std::filesystem::path path_;

public:
    TempDirectory() {
        path_ = std::filesystem::temp_directory_path() /
                ("temp_" + std::to_string(std::random_device{}()));
        std::filesystem::create_directories(path_);
    }

    ~TempDirectory() {
        std::error_code ec;  // Don't throw in destructor
        std::filesystem::remove_all(path_, ec);
    }

    TempDirectory(const TempDirectory&) = delete;
    TempDirectory& operator=(const TempDirectory&) = delete;

    const std::filesystem::path& path() const { return path_; }
};

// Usage
void test_with_temp_files() {
    TempDirectory temp;

    auto file = temp.path() / "test.txt";
    std::ofstream(file) << "test data";

    // Process file...

}  // Entire directory automatically cleaned up
```

## Common Pitfalls and Best Practices

### Avoid Raw `new` and `delete`

```cpp
// Bad
void bad_example() {
    Widget* w = new Widget();
    process(w);  // If this throws, w leaks
    delete w;
}

// Good
void good_example() {
    auto w = std::make_unique<Widget>();
    process(w.get());
    // Automatically cleaned up
}
```

### Be Careful with Arrays

```cpp
// Bad - undefined behavior!
std::unique_ptr<int> arr(new int[100]);  // Will call delete, not delete[]

// Good
std::unique_ptr<int[]> arr(new int[100]);  // Correct array deletion

// Better
std::vector<int> arr(100);  // Preferred approach
```

### Don't Let Exceptions Escape Destructors

```cpp
// Bad
~Resource() {
    cleanup();  // If this throws, std::terminate is called
}

// Good
~Resource() noexcept {
    try {
        cleanup();
    } catch (...) {
        // Log error, but don't propagate
    }
}
```

### Avoid Circular References with `shared_ptr`

```cpp
class Node {
    std::shared_ptr<Node> next_;  // Can cause cycles!
    std::weak_ptr<Node> prev_;    // Use weak_ptr to break cycles
};
```

### Initialize Resources in Member Initializer Lists

```cpp
// Preferred - uses initialization
class Good {
    std::unique_ptr<Resource> resource_;

public:
    Good() : resource_(std::make_unique<Resource>()) {}
};

// Less preferred - uses assignment
class LessGood {
    std::unique_ptr<Resource> resource_;

public:
    LessGood() {
        resource_ = std::make_unique<Resource>();  // Assignment, not initialization
    }
};
```

## Summary

RAII is a cornerstone of C++ programming that provides:

1. **Automatic resource cleanup**: Resources are released when objects go out of scope
2. **Exception safety**: Stack unwinding guarantees cleanup even when exceptions are thrown
3. **Cleaner code**: No need for manual cleanup logic or try/finally blocks
4. **Composability**: RAII objects can be freely composed without leaking resources

To effectively use RAII:
- Prefer the Rule of Zero: use RAII types so you don't need custom resource management
- When you must manage resources, follow the Rule of Five
- Use standard library RAII types: smart pointers, containers, lock guards
- Write custom RAII wrappers for resources not covered by the standard library
- Never let exceptions escape destructors

By embracing RAII, you write C++ code that is safer, cleaner, and easier to maintain. It transforms resource management from a source of bugs into a non-issue handled automatically by the language.
