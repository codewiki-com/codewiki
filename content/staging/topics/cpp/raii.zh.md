---
title: RAII模式
description: C++ RAII资源获取即初始化完全指南，资源管理与异常安全
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - RAII
  - 资源管理
  - 异常安全
status: imported
origin: old/src/content/docs/cpp/raii.zh.md
divergence: 0.129
issues: []
legacy:
  category: Cpp
  subcategory: 核心概念
  order: 9
  lastUpdated: 2026-01-07
---

RAII（Resource Acquisition Is Initialization，资源获取即初始化）是C++中最重要的编程范式之一。它将资源的生命周期与对象的生命周期绑定，通过构造函数获取资源、析构函数释放资源，从而实现自动化的资源管理。

## 什么是RAII

### 核心思想

RAII的核心思想非常简单：

1. **资源获取即初始化**：在对象构造时获取资源
2. **资源释放即销毁**：在对象析构时释放资源
3. **利用栈语义**：借助C++的确定性析构保证资源释放

```cpp
class FileHandler {
private:
    FILE* file_;

public:
    // 构造函数：获取资源
    explicit FileHandler(const char* filename)
        : file_(fopen(filename, "r")) {
        if (!file_) {
            throw std::runtime_error("无法打开文件");
        }
    }

    // 析构函数：释放资源
    ~FileHandler() {
        if (file_) {
            fclose(file_);
        }
    }

    // 禁止拷贝
    FileHandler(const FileHandler&) = delete;
    FileHandler& operator=(const FileHandler&) = delete;

    // 允许移动
    FileHandler(FileHandler&& other) noexcept
        : file_(other.file_) {
        other.file_ = nullptr;
    }

    FileHandler& operator=(FileHandler&& other) noexcept {
        if (this != &other) {
            if (file_) fclose(file_);
            file_ = other.file_;
            other.file_ = nullptr;
        }
        return *this;
    }

    FILE* get() const { return file_; }
};
```

### 为什么需要RAII

在没有RAII的情况下，资源管理容易出错：

```cpp
// 不使用RAII的危险代码
void processFile(const char* filename) {
    FILE* file = fopen(filename, "r");
    if (!file) return;

    char* buffer = new char[1024];

    // 如果这里抛出异常，资源将泄漏！
    processData(file, buffer);

    delete[] buffer;  // 可能永远执行不到
    fclose(file);     // 可能永远执行不到
}
```

使用RAII后：

```cpp
// 使用RAII的安全代码
void processFile(const char* filename) {
    FileHandler file(filename);
    std::unique_ptr<char[]> buffer(new char[1024]);

    // 即使抛出异常，资源也会被正确释放
    processData(file.get(), buffer.get());

    // 无需手动释放，析构函数自动处理
}
```

## 标准库中的RAII

### 智能指针

C++标准库提供了多种智能指针实现RAII：

```cpp
#include <memory>

// unique_ptr：独占所有权
void uniquePtrExample() {
    // 创建unique_ptr
    auto ptr = std::make_unique<int>(42);

    // 自定义删除器
    auto filePtr = std::unique_ptr<FILE, decltype(&fclose)>(
        fopen("test.txt", "r"),
        &fclose
    );

    // 管理数组
    auto arr = std::make_unique<int[]>(100);
}

// shared_ptr：共享所有权
void sharedPtrExample() {
    auto ptr1 = std::make_shared<std::string>("Hello");
    auto ptr2 = ptr1;  // 引用计数增加

    std::cout << "引用计数: " << ptr1.use_count() << std::endl;  // 2

    // 自定义删除器
    auto customPtr = std::shared_ptr<int>(
        new int(10),
        [](int* p) {
            std::cout << "自定义删除" << std::endl;
            delete p;
        }
    );
}

// weak_ptr：弱引用，不增加引用计数
void weakPtrExample() {
    auto shared = std::make_shared<int>(42);
    std::weak_ptr<int> weak = shared;

    if (auto locked = weak.lock()) {
        std::cout << "值: " << *locked << std::endl;
    }

    shared.reset();  // 释放资源

    if (weak.expired()) {
        std::cout << "资源已释放" << std::endl;
    }
}
```

### 锁管理

```cpp
#include <mutex>
#include <shared_mutex>

std::mutex mtx;
std::shared_mutex sharedMtx;

void lockGuardExample() {
    // lock_guard：基本的作用域锁
    std::lock_guard<std::mutex> lock(mtx);
    // 临界区代码
}  // 自动解锁

void uniqueLockExample() {
    // unique_lock：更灵活的锁管理
    std::unique_lock<std::mutex> lock(mtx);

    // 可以手动解锁和重新加锁
    lock.unlock();
    // 做一些不需要锁的操作
    lock.lock();

    // 可以延迟加锁
    std::unique_lock<std::mutex> deferredLock(mtx, std::defer_lock);
    // ... 稍后 ...
    deferredLock.lock();
}

void sharedLockExample() {
    // shared_lock：读锁（C++14）
    std::shared_lock<std::shared_mutex> readLock(sharedMtx);
    // 多个读者可以同时访问

    // unique_lock用于写锁
    // std::unique_lock<std::shared_mutex> writeLock(sharedMtx);
}

void scopedLockExample() {
    std::mutex mtx1, mtx2;

    // scoped_lock：同时锁定多个互斥量（C++17）
    std::scoped_lock lock(mtx1, mtx2);
    // 避免死锁
}
```

### 其他RAII包装器

```cpp
#include <fstream>
#include <vector>
#include <string>

void standardRaiiExamples() {
    // fstream：文件流
    {
        std::ifstream file("input.txt");
        std::string line;
        while (std::getline(file, line)) {
            std::cout << line << std::endl;
        }
    }  // 自动关闭

    // vector：动态数组
    {
        std::vector<int> vec = {1, 2, 3, 4, 5};
        // 内存自动管理
    }  // 自动释放

    // string：字符串
    {
        std::string str = "Hello, RAII!";
        // 内存自动管理
    }  // 自动释放
}
```

## 自定义RAII类

### 基本模式

```cpp
template<typename Resource, typename Deleter>
class RAIIWrapper {
private:
    Resource resource_;
    Deleter deleter_;
    bool valid_;

public:
    explicit RAIIWrapper(Resource resource, Deleter deleter = Deleter())
        : resource_(resource)
        , deleter_(deleter)
        , valid_(true) {}

    ~RAIIWrapper() {
        if (valid_) {
            deleter_(resource_);
        }
    }

    // 禁止拷贝
    RAIIWrapper(const RAIIWrapper&) = delete;
    RAIIWrapper& operator=(const RAIIWrapper&) = delete;

    // 允许移动
    RAIIWrapper(RAIIWrapper&& other) noexcept
        : resource_(other.resource_)
        , deleter_(std::move(other.deleter_))
        , valid_(other.valid_) {
        other.valid_ = false;
    }

    RAIIWrapper& operator=(RAIIWrapper&& other) noexcept {
        if (this != &other) {
            if (valid_) {
                deleter_(resource_);
            }
            resource_ = other.resource_;
            deleter_ = std::move(other.deleter_);
            valid_ = other.valid_;
            other.valid_ = false;
        }
        return *this;
    }

    Resource get() const { return resource_; }
    explicit operator bool() const { return valid_; }

    Resource release() {
        valid_ = false;
        return resource_;
    }
};
```

### 实用示例

#### 数据库连接管理

```cpp
class DatabaseConnection {
private:
    MYSQL* connection_;

public:
    explicit DatabaseConnection(const std::string& host,
                                const std::string& user,
                                const std::string& password,
                                const std::string& database) {
        connection_ = mysql_init(nullptr);
        if (!connection_) {
            throw std::runtime_error("MySQL初始化失败");
        }

        if (!mysql_real_connect(connection_,
                                host.c_str(),
                                user.c_str(),
                                password.c_str(),
                                database.c_str(),
                                0, nullptr, 0)) {
            mysql_close(connection_);
            throw std::runtime_error("连接数据库失败");
        }
    }

    ~DatabaseConnection() {
        if (connection_) {
            mysql_close(connection_);
        }
    }

    // 移动语义
    DatabaseConnection(DatabaseConnection&& other) noexcept
        : connection_(other.connection_) {
        other.connection_ = nullptr;
    }

    DatabaseConnection& operator=(DatabaseConnection&& other) noexcept {
        if (this != &other) {
            if (connection_) mysql_close(connection_);
            connection_ = other.connection_;
            other.connection_ = nullptr;
        }
        return *this;
    }

    // 禁止拷贝
    DatabaseConnection(const DatabaseConnection&) = delete;
    DatabaseConnection& operator=(const DatabaseConnection&) = delete;

    MYSQL* get() const { return connection_; }
};
```

#### 作用域退出守卫

```cpp
#include <functional>

class ScopeGuard {
private:
    std::function<void()> cleanup_;
    bool active_;

public:
    explicit ScopeGuard(std::function<void()> cleanup)
        : cleanup_(std::move(cleanup))
        , active_(true) {}

    ~ScopeGuard() {
        if (active_) {
            cleanup_();
        }
    }

    void dismiss() { active_ = false; }

    ScopeGuard(ScopeGuard&& other) noexcept
        : cleanup_(std::move(other.cleanup_))
        , active_(other.active_) {
        other.active_ = false;
    }

    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;
    ScopeGuard& operator=(ScopeGuard&&) = delete;
};

// 宏简化使用
#define CONCATENATE_IMPL(x, y) x##y
#define CONCATENATE(x, y) CONCATENATE_IMPL(x, y)
#define SCOPE_EXIT(code) \
    ScopeGuard CONCATENATE(scopeGuard_, __LINE__)([&]() { code; })

void scopeGuardExample() {
    FILE* file = fopen("test.txt", "w");
    SCOPE_EXIT(fclose(file));

    // 使用file...
    fprintf(file, "Hello, World!");

    // 文件自动关闭
}
```

#### 计时器RAII

```cpp
#include <chrono>
#include <iostream>

class Timer {
private:
    std::string name_;
    std::chrono::high_resolution_clock::time_point start_;

public:
    explicit Timer(std::string name = "Timer")
        : name_(std::move(name))
        , start_(std::chrono::high_resolution_clock::now()) {}

    ~Timer() {
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - start_
        ).count();
        std::cout << name_ << ": " << duration << " 微秒" << std::endl;
    }

    Timer(const Timer&) = delete;
    Timer& operator=(const Timer&) = delete;
};

void timerExample() {
    Timer t("排序操作");

    std::vector<int> vec(100000);
    std::iota(vec.begin(), vec.end(), 0);
    std::random_shuffle(vec.begin(), vec.end());
    std::sort(vec.begin(), vec.end());

    // 析构时自动输出耗时
}
```

## 异常安全

### 异常安全级别

RAII是实现异常安全的关键工具。C++定义了三个异常安全级别：

```cpp
// 1. 基本保证（Basic Guarantee）
// 如果异常发生，对象保持有效状态，但可能与原始状态不同
class BasicGuarantee {
    std::vector<int> data_;

public:
    void add(int value) {
        data_.push_back(value);  // 可能抛出异常
        // 如果抛出异常，data_仍然有效，但内容可能已改变
    }
};

// 2. 强保证（Strong Guarantee）
// 如果异常发生，对象状态回滚到操作前
class StrongGuarantee {
    std::vector<int> data_;

public:
    void replace(const std::vector<int>& newData) {
        std::vector<int> temp = newData;  // 先在临时对象上操作
        // 如果上面抛出异常，data_不受影响

        std::swap(data_, temp);  // noexcept操作
    }
};

// 3. 不抛出保证（Nothrow Guarantee）
// 操作保证不抛出任何异常
class NothrowGuarantee {
    int* data_;

public:
    void swap(NothrowGuarantee& other) noexcept {
        std::swap(data_, other.data_);  // 指针交换不会失败
    }

    ~NothrowGuarantee() noexcept {
        delete data_;  // 析构函数不应抛出异常
    }
};
```

### Copy-and-Swap惯用法

实现强异常保证的经典方法：

```cpp
class String {
private:
    char* data_;
    size_t size_;

public:
    String(const char* str = "")
        : size_(strlen(str))
        , data_(new char[size_ + 1]) {
        strcpy(data_, str);
    }

    ~String() {
        delete[] data_;
    }

    String(const String& other)
        : size_(other.size_)
        , data_(new char[size_ + 1]) {
        strcpy(data_, other.data_);
    }

    String(String&& other) noexcept
        : data_(other.data_)
        , size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    // Copy-and-Swap实现赋值操作
    String& operator=(String other) {  // 按值传递，触发拷贝/移动构造
        swap(*this, other);
        return *this;
    }  // other在这里析构，释放旧资源

    friend void swap(String& first, String& second) noexcept {
        using std::swap;
        swap(first.data_, second.data_);
        swap(first.size_, second.size_);
    }

    const char* c_str() const { return data_; }
    size_t size() const { return size_; }
};
```

## Rule of 3/5/0

### Rule of Three（三法则）

如果类需要自定义以下任一函数，通常需要自定义全部三个：

```cpp
class RuleOfThree {
private:
    int* data_;

public:
    // 1. 析构函数
    ~RuleOfThree() {
        delete data_;
    }

    // 2. 拷贝构造函数
    RuleOfThree(const RuleOfThree& other)
        : data_(new int(*other.data_)) {}

    // 3. 拷贝赋值运算符
    RuleOfThree& operator=(const RuleOfThree& other) {
        if (this != &other) {
            delete data_;
            data_ = new int(*other.data_);
        }
        return *this;
    }

    explicit RuleOfThree(int value) : data_(new int(value)) {}
};
```

### Rule of Five（五法则）

C++11引入移动语义后，扩展为五法则：

```cpp
class RuleOfFive {
private:
    int* data_;
    size_t size_;

public:
    // 1. 析构函数
    ~RuleOfFive() {
        delete[] data_;
    }

    // 2. 拷贝构造函数
    RuleOfFive(const RuleOfFive& other)
        : size_(other.size_)
        , data_(new int[other.size_]) {
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // 3. 拷贝赋值运算符
    RuleOfFive& operator=(const RuleOfFive& other) {
        if (this != &other) {
            RuleOfFive temp(other);
            swap(*this, temp);
        }
        return *this;
    }

    // 4. 移动构造函数
    RuleOfFive(RuleOfFive&& other) noexcept
        : data_(other.data_)
        , size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    // 5. 移动赋值运算符
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

    explicit RuleOfFive(size_t size)
        : size_(size)
        , data_(new int[size]) {}

    friend void swap(RuleOfFive& a, RuleOfFive& b) noexcept {
        using std::swap;
        swap(a.data_, b.data_);
        swap(a.size_, b.size_);
    }
};
```

### Rule of Zero（零法则）

最佳实践：尽量使用RAII包装器，避免手动资源管理：

```cpp
// 推荐：使用智能指针，无需自定义特殊成员函数
class RuleOfZero {
private:
    std::unique_ptr<int[]> data_;
    size_t size_;

public:
    explicit RuleOfZero(size_t size)
        : data_(std::make_unique<int[]>(size))
        , size_(size) {}

    // 编译器自动生成的特殊成员函数已经正确！
    // 默认移动构造/赋值可用
    // 默认拷贝构造/赋值被删除（unique_ptr不可拷贝）
};

// 如果需要拷贝语义，使用shared_ptr或自定义
class RuleOfZeroCopyable {
private:
    std::shared_ptr<std::vector<int>> data_;

public:
    explicit RuleOfZeroCopyable(std::initializer_list<int> init)
        : data_(std::make_shared<std::vector<int>>(init)) {}

    // 所有特殊成员函数都可以默认生成
};
```

## RAII最佳实践

### 优先使用标准库设施

```cpp
// 好：使用标准库
void goodPractice() {
    auto ptr = std::make_unique<Resource>();
    std::vector<int> vec;
    std::lock_guard<std::mutex> lock(mtx);
}

// 避免：手动管理
void avoidThis() {
    Resource* ptr = new Resource();
    int* arr = new int[100];
    mtx.lock();
    // ... 容易忘记释放
}
```

### 使用make函数

```cpp
// 推荐
auto ptr1 = std::make_unique<Widget>(arg1, arg2);
auto ptr2 = std::make_shared<Widget>(arg1, arg2);

// 不推荐
std::unique_ptr<Widget> ptr3(new Widget(arg1, arg2));
std::shared_ptr<Widget> ptr4(new Widget(arg1, arg2));
```

### 析构函数不应抛出异常

```cpp
class SafeDestructor {
    Resource* resource_;

public:
    ~SafeDestructor() noexcept {
        try {
            if (resource_) {
                resource_->cleanup();
            }
        } catch (...) {
            // 记录日志，但不重新抛出
            std::cerr << "清理时发生错误" << std::endl;
        }
        delete resource_;
    }
};
```

### 使用noexcept标记移动操作

```cpp
class OptimizedMove {
public:
    OptimizedMove(OptimizedMove&& other) noexcept;      // 标记noexcept
    OptimizedMove& operator=(OptimizedMove&& other) noexcept;
};

// std::vector等容器会利用noexcept进行优化
// 如果移动操作是noexcept的，容器重新分配时会使用移动而非拷贝
```

### 正确处理自赋值

```cpp
class SelfAssignmentSafe {
    int* data_;

public:
    SelfAssignmentSafe& operator=(const SelfAssignmentSafe& other) {
        if (this != &other) {  // 检查自赋值
            int* newData = new int(*other.data_);
            delete data_;
            data_ = newData;
        }
        return *this;
    }

    // 或使用copy-and-swap，自动处理自赋值
    SelfAssignmentSafe& operator=(SelfAssignmentSafe other) {
        swap(*this, other);
        return *this;
    }
};
```

## 高级RAII模式

### 延迟初始化

```cpp
template<typename T>
class LazyInit {
private:
    mutable std::unique_ptr<T> value_;
    mutable std::once_flag initFlag_;
    std::function<T()> initializer_;

public:
    explicit LazyInit(std::function<T()> init)
        : initializer_(std::move(init)) {}

    const T& get() const {
        std::call_once(initFlag_, [this]() {
            value_ = std::make_unique<T>(initializer_());
        });
        return *value_;
    }
};

// 使用示例
LazyInit<ExpensiveResource> resource([]() {
    return ExpensiveResource::create();
});

// 只有在第一次调用get()时才初始化
const auto& res = resource.get();
```

### RAII与工厂模式

```cpp
class Connection {
public:
    virtual ~Connection() = default;
    virtual void execute(const std::string& query) = 0;
};

class ConnectionFactory {
public:
    static std::unique_ptr<Connection> create(const std::string& type) {
        if (type == "mysql") {
            return std::make_unique<MySQLConnection>();
        } else if (type == "postgresql") {
            return std::make_unique<PostgreSQLConnection>();
        }
        throw std::invalid_argument("未知连接类型");
    }
};

void useConnection() {
    auto conn = ConnectionFactory::create("mysql");
    conn->execute("SELECT * FROM users");
    // 自动释放连接
}
```

### 资源池

```cpp
template<typename T>
class ResourcePool {
private:
    std::vector<std::unique_ptr<T>> pool_;
    std::vector<T*> available_;
    std::mutex mutex_;

public:
    class Handle {
    private:
        ResourcePool* pool_;
        T* resource_;

    public:
        Handle(ResourcePool* pool, T* resource)
            : pool_(pool), resource_(resource) {}

        ~Handle() {
            if (resource_) {
                pool_->release(resource_);
            }
        }

        Handle(Handle&& other) noexcept
            : pool_(other.pool_), resource_(other.resource_) {
            other.resource_ = nullptr;
        }

        Handle(const Handle&) = delete;
        Handle& operator=(const Handle&) = delete;

        T* operator->() { return resource_; }
        T& operator*() { return *resource_; }
    };

    explicit ResourcePool(size_t size) {
        for (size_t i = 0; i < size; ++i) {
            pool_.push_back(std::make_unique<T>());
            available_.push_back(pool_.back().get());
        }
    }

    Handle acquire() {
        std::lock_guard<std::mutex> lock(mutex_);
        if (available_.empty()) {
            throw std::runtime_error("资源池已耗尽");
        }
        T* resource = available_.back();
        available_.pop_back();
        return Handle(this, resource);
    }

private:
    void release(T* resource) {
        std::lock_guard<std::mutex> lock(mutex_);
        available_.push_back(resource);
    }
};
```

## 总结

RAII是C++中最强大和最重要的编程范式之一：

| 特性 | 说明 |
|------|------|
| **自动资源管理** | 资源随对象自动获取和释放 |
| **异常安全** | 即使发生异常，资源也能正确释放 |
| **代码简洁** | 消除显式的资源释放代码 |
| **可组合性** | RAII对象可以作为其他对象的成员 |

### 关键要点

1. **始终使用RAII管理资源**：文件、内存、锁、网络连接等
2. **优先使用标准库设施**：智能指针、容器、锁守卫
3. **遵循Rule of 0/3/5**：根据需要选择合适的规则
4. **析构函数不抛异常**：使用noexcept保证
5. **移动操作标记noexcept**：获得更好的性能优化

RAII不仅仅是一种技术，更是一种编程哲学。掌握RAII是成为优秀C++程序员的必经之路，它能帮助你编写更安全、更简洁、更高效的代码。
