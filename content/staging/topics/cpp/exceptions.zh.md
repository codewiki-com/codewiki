---
title: 异常处理
description: C++异常处理完全指南，try-catch、异常安全与最佳实践
track: cpp
section: basics
difficulty: intermediate
tags:
  - C++
  - 异常
  - 错误处理
  - RAII
status: imported
origin: old/src/content/docs/cpp/exceptions.zh.md
divergence: 0.216
issues: []
legacy:
  category: Cpp
  subcategory: 核心概念
  order: 13
  lastUpdated: 2026-01-07
---

异常处理是C++中处理运行时错误的核心机制。它提供了一种将错误检测与错误处理分离的方法，使代码更加清晰、健壮和可维护。

## 异常处理基础

### try-catch-throw 机制

C++异常处理的三个核心关键字：

- **throw**：抛出异常
- **try**：标记可能抛出异常的代码块
- **catch**：捕获并处理异常

```cpp
#include <iostream>
#include <stdexcept>

double divide(double numerator, double denominator) {
    if (denominator == 0) {
        throw std::invalid_argument("除数不能为零");
    }
    return numerator / denominator;
}

int main() {
    try {
        double result = divide(10.0, 0.0);
        std::cout << "结果: " << result << std::endl;
    } catch (const std::invalid_argument& e) {
        std::cerr << "捕获异常: " << e.what() << std::endl;
    }

    return 0;
}
```

### 多重 catch 块

可以使用多个catch块处理不同类型的异常：

```cpp
#include <iostream>
#include <stdexcept>
#include <string>

void processValue(int value) {
    if (value < 0) {
        throw std::out_of_range("值不能为负数");
    } else if (value == 0) {
        throw std::invalid_argument("值不能为零");
    } else if (value > 100) {
        throw std::overflow_error("值超出有效范围");
    }
}

int main() {
    try {
        processValue(-5);
    } catch (const std::out_of_range& e) {
        std::cerr << "范围错误: " << e.what() << std::endl;
    } catch (const std::invalid_argument& e) {
        std::cerr << "参数错误: " << e.what() << std::endl;
    } catch (const std::exception& e) {
        // 捕获所有标准异常
        std::cerr << "标准异常: " << e.what() << std::endl;
    } catch (...) {
        // 捕获所有其他类型的异常
        std::cerr << "未知异常" << std::endl;
    }

    return 0;
}
```

**注意**：catch块的顺序很重要，应该从最具体的异常类型到最通用的类型排列。

### 重新抛出异常

在catch块中可以使用`throw;`重新抛出当前异常：

```cpp
#include <iostream>
#include <stdexcept>

void innerFunction() {
    throw std::runtime_error("内部错误");
}

void middleFunction() {
    try {
        innerFunction();
    } catch (const std::exception& e) {
        std::cerr << "中间层记录: " << e.what() << std::endl;
        throw;  // 重新抛出，保持原始异常类型
    }
}

int main() {
    try {
        middleFunction();
    } catch (const std::runtime_error& e) {
        std::cerr << "外层捕获: " << e.what() << std::endl;
    }

    return 0;
}
```

## 栈展开 (Stack Unwinding)

当异常被抛出时，程序会从throw点开始向上搜索匹配的catch块。在此过程中，所有在throw和catch之间的栈帧上的局部对象都会被销毁，这个过程称为**栈展开**。

```cpp
#include <iostream>
#include <string>

class Resource {
public:
    Resource(const std::string& name) : name_(name) {
        std::cout << "构造: " << name_ << std::endl;
    }

    ~Resource() {
        std::cout << "析构: " << name_ << std::endl;
    }

private:
    std::string name_;
};

void functionC() {
    Resource c("资源C");
    throw std::runtime_error("函数C中发生错误");
}

void functionB() {
    Resource b("资源B");
    functionC();
}

void functionA() {
    Resource a("资源A");
    functionB();
}

int main() {
    try {
        functionA();
    } catch (const std::exception& e) {
        std::cout << "捕获异常: " << e.what() << std::endl;
    }

    return 0;
}
```

输出：
```
构造: 资源A
构造: 资源B
构造: 资源C
析构: 资源C
析构: 资源B
析构: 资源A
捕获异常: 函数C中发生错误
```

**关键点**：栈展开保证了即使发生异常，局部对象的析构函数也会被调用，这是RAII模式的基础。

## 标准异常类层次

C++标准库提供了一套完整的异常类层次结构：

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
├── std::bad_function_call (C++11)
└── std::bad_weak_ptr (C++11)
```

### 使用标准异常

```cpp
#include <iostream>
#include <vector>
#include <stdexcept>
#include <new>

void demonstrateExceptions() {
    // std::out_of_range
    try {
        std::vector<int> vec = {1, 2, 3};
        int val = vec.at(10);  // 越界访问
    } catch (const std::out_of_range& e) {
        std::cerr << "out_of_range: " << e.what() << std::endl;
    }

    // std::bad_alloc
    try {
        // 尝试分配超大内存
        std::vector<int> huge(1000000000000);
    } catch (const std::bad_alloc& e) {
        std::cerr << "bad_alloc: " << e.what() << std::endl;
    }

    // std::invalid_argument
    try {
        std::stoi("not_a_number");
    } catch (const std::invalid_argument& e) {
        std::cerr << "invalid_argument: " << e.what() << std::endl;
    }
}
```

## 自定义异常类

### 基本自定义异常

```cpp
#include <iostream>
#include <exception>
#include <string>

class DatabaseException : public std::exception {
public:
    explicit DatabaseException(const std::string& message)
        : message_(message) {}

    const char* what() const noexcept override {
        return message_.c_str();
    }

private:
    std::string message_;
};

class ConnectionException : public DatabaseException {
public:
    ConnectionException(const std::string& host, int port)
        : DatabaseException("无法连接到数据库: " + host + ":" + std::to_string(port)),
          host_(host), port_(port) {}

    const std::string& getHost() const { return host_; }
    int getPort() const { return port_; }

private:
    std::string host_;
    int port_;
};

void connectToDatabase(const std::string& host, int port) {
    // 模拟连接失败
    throw ConnectionException(host, port);
}

int main() {
    try {
        connectToDatabase("localhost", 5432);
    } catch (const ConnectionException& e) {
        std::cerr << "连接异常: " << e.what() << std::endl;
        std::cerr << "主机: " << e.getHost() << ", 端口: " << e.getPort() << std::endl;
    }

    return 0;
}
```

### 带错误码的异常

```cpp
#include <iostream>
#include <exception>
#include <string>
#include <map>

enum class ErrorCode {
    SUCCESS = 0,
    FILE_NOT_FOUND = 1001,
    PERMISSION_DENIED = 1002,
    INVALID_FORMAT = 1003,
    NETWORK_ERROR = 2001,
    TIMEOUT = 2002
};

class ApplicationException : public std::exception {
public:
    ApplicationException(ErrorCode code, const std::string& message)
        : code_(code), message_(message) {
        fullMessage_ = "[错误 " + std::to_string(static_cast<int>(code)) + "] " + message;
    }

    const char* what() const noexcept override {
        return fullMessage_.c_str();
    }

    ErrorCode getErrorCode() const { return code_; }

    static std::string getErrorDescription(ErrorCode code) {
        static const std::map<ErrorCode, std::string> descriptions = {
            {ErrorCode::FILE_NOT_FOUND, "文件未找到"},
            {ErrorCode::PERMISSION_DENIED, "权限被拒绝"},
            {ErrorCode::INVALID_FORMAT, "格式无效"},
            {ErrorCode::NETWORK_ERROR, "网络错误"},
            {ErrorCode::TIMEOUT, "操作超时"}
        };

        auto it = descriptions.find(code);
        return it != descriptions.end() ? it->second : "未知错误";
    }

private:
    ErrorCode code_;
    std::string message_;
    std::string fullMessage_;
};

void processFile(const std::string& filename) {
    throw ApplicationException(ErrorCode::FILE_NOT_FOUND,
                               "无法打开文件: " + filename);
}

int main() {
    try {
        processFile("config.txt");
    } catch (const ApplicationException& e) {
        std::cerr << e.what() << std::endl;
        std::cerr << "错误描述: "
                  << ApplicationException::getErrorDescription(e.getErrorCode())
                  << std::endl;
    }

    return 0;
}
```

## 异常规范与 noexcept

### noexcept 说明符 (C++11)

`noexcept`用于指示函数是否可能抛出异常：

```cpp
#include <iostream>
#include <vector>

// 保证不抛出异常
void safeFunction() noexcept {
    // 如果此函数内部抛出异常，程序将调用 std::terminate()
}

// 条件性 noexcept
template <typename T>
void swap(T& a, T& b) noexcept(noexcept(T(std::move(a))) &&
                                noexcept(a = std::move(b))) {
    T temp = std::move(a);
    a = std::move(b);
    b = std::move(temp);
}

// 检查函数是否为 noexcept
void checkNoexcept() {
    std::cout << std::boolalpha;
    std::cout << "safeFunction 是 noexcept: "
              << noexcept(safeFunction()) << std::endl;
}

class MyClass {
public:
    // 移动构造函数应该是 noexcept
    MyClass(MyClass&& other) noexcept
        : data_(std::move(other.data_)) {}

    // 移动赋值也应该是 noexcept
    MyClass& operator=(MyClass&& other) noexcept {
        data_ = std::move(other.data_);
        return *this;
    }

private:
    std::vector<int> data_;
};
```

### noexcept 的重要性

`noexcept`对性能和正确性都很重要：

```cpp
#include <iostream>
#include <vector>
#include <type_traits>

class Widget {
public:
    Widget() = default;

    // 如果移动构造函数是 noexcept，
    // std::vector 在重新分配时会使用移动而不是复制
    Widget(Widget&&) noexcept {
        std::cout << "移动构造" << std::endl;
    }

    Widget(const Widget&) {
        std::cout << "复制构造" << std::endl;
    }
};

class WidgetThrows {
public:
    WidgetThrows() = default;

    // 没有 noexcept，vector 可能选择复制以保证异常安全
    WidgetThrows(WidgetThrows&&) {
        std::cout << "移动构造(可能抛异常)" << std::endl;
    }

    WidgetThrows(const WidgetThrows&) {
        std::cout << "复制构造" << std::endl;
    }
};

int main() {
    std::cout << "--- Widget (noexcept 移动) ---" << std::endl;
    std::vector<Widget> v1;
    v1.reserve(1);
    v1.emplace_back();
    v1.emplace_back();  // 触发重新分配

    std::cout << "\n--- WidgetThrows (非 noexcept 移动) ---" << std::endl;
    std::vector<WidgetThrows> v2;
    v2.reserve(1);
    v2.emplace_back();
    v2.emplace_back();  // 触发重新分配，可能使用复制

    return 0;
}
```

### 已弃用的动态异常规范

C++11之前的动态异常规范（如`throw()`）在C++11中被弃用，C++17中被移除：

```cpp
// 旧式异常规范（已弃用）
// void oldStyle() throw(std::runtime_error);  // C++17 中移除
// void noThrowOld() throw();                  // 等价于 noexcept

// 现代写法
void modernStyle();                    // 可能抛出任何异常
void noThrowModern() noexcept;        // 保证不抛出异常
```

## 异常安全性

异常安全性是指当异常发生时，程序能够保持正确的状态。有三个级别的异常安全保证：

### 三种异常安全级别

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <algorithm>

// 1. 基本保证（Basic Guarantee）
// 异常发生后，对象处于有效但未指定的状态，没有资源泄漏
class BasicGuarantee {
public:
    void addItems(const std::vector<int>& items) {
        for (const auto& item : items) {
            data_.push_back(item);  // 可能在中途抛出异常
            // 异常后，data_ 可能包含部分添加的元素
        }
    }

private:
    std::vector<int> data_;
};

// 2. 强保证（Strong Guarantee）
// 操作要么完全成功，要么状态回滚到操作前
class StrongGuarantee {
public:
    void addItems(const std::vector<int>& items) {
        // 先在临时容器中操作
        std::vector<int> temp = data_;
        for (const auto& item : items) {
            temp.push_back(item);
        }
        // 所有操作成功后，使用 noexcept 交换
        data_.swap(temp);  // swap 通常是 noexcept
    }

    // copy-and-swap 惯用法
    StrongGuarantee& operator=(StrongGuarantee other) noexcept {
        swap(*this, other);
        return *this;
    }

    friend void swap(StrongGuarantee& a, StrongGuarantee& b) noexcept {
        using std::swap;
        swap(a.data_, b.data_);
    }

private:
    std::vector<int> data_;
};

// 3. 不抛出保证（Nothrow Guarantee）
// 操作保证不会抛出异常
class NothrowGuarantee {
public:
    void clear() noexcept {
        data_.clear();
    }

    int size() const noexcept {
        return static_cast<int>(data_.size());
    }

    void swap(NothrowGuarantee& other) noexcept {
        data_.swap(other.data_);
    }

private:
    std::vector<int> data_;
};
```

### RAII 与异常安全

RAII（资源获取即初始化）是实现异常安全的关键技术：

```cpp
#include <iostream>
#include <fstream>
#include <memory>
#include <mutex>

// 使用智能指针实现异常安全的资源管理
class ResourceManager {
public:
    void processData() {
        // 使用 unique_ptr 自动管理内存
        auto buffer = std::make_unique<char[]>(1024);

        // 使用 lock_guard 自动管理互斥锁
        std::lock_guard<std::mutex> lock(mutex_);

        // 即使下面的操作抛出异常，
        // buffer 和 lock 也会被正确释放
        doRiskyOperation();
    }

private:
    std::mutex mutex_;

    void doRiskyOperation() {
        throw std::runtime_error("操作失败");
    }
};

// 自定义 RAII 包装器
class FileHandle {
public:
    explicit FileHandle(const std::string& filename)
        : file_(filename) {
        if (!file_.is_open()) {
            throw std::runtime_error("无法打开文件: " + filename);
        }
        std::cout << "文件已打开" << std::endl;
    }

    ~FileHandle() {
        if (file_.is_open()) {
            file_.close();
            std::cout << "文件已关闭" << std::endl;
        }
    }

    // 禁止复制
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    // 允许移动
    FileHandle(FileHandle&& other) noexcept
        : file_(std::move(other.file_)) {}

    std::fstream& get() { return file_; }

private:
    std::fstream file_;
};

// 作用域守卫（Scope Guard）
template <typename Func>
class ScopeGuard {
public:
    explicit ScopeGuard(Func&& func)
        : func_(std::forward<Func>(func)), active_(true) {}

    ~ScopeGuard() {
        if (active_) {
            func_();
        }
    }

    void dismiss() noexcept {
        active_ = false;
    }

    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;

private:
    Func func_;
    bool active_;
};

template <typename Func>
ScopeGuard<Func> makeScopeGuard(Func&& func) {
    return ScopeGuard<Func>(std::forward<Func>(func));
}

void demonstrateScopeGuard() {
    int* rawPtr = new int(42);
    auto guard = makeScopeGuard([&]() {
        delete rawPtr;
        std::cout << "资源已清理" << std::endl;
    });

    // 如果这里抛出异常，guard 的析构函数会清理资源
    throw std::runtime_error("模拟错误");

    // 如果正常执行完毕，可以取消清理
    // guard.dismiss();
}
```

## 构造函数与析构函数中的异常

### 构造函数中的异常

```cpp
#include <iostream>
#include <memory>
#include <stdexcept>

class DatabaseConnection {
public:
    DatabaseConnection() {
        std::cout << "建立数据库连接" << std::endl;
    }
    ~DatabaseConnection() {
        std::cout << "关闭数据库连接" << std::endl;
    }
};

class FileLogger {
public:
    FileLogger() {
        std::cout << "初始化日志系统" << std::endl;
    }
    ~FileLogger() {
        std::cout << "关闭日志系统" << std::endl;
    }
};

class Application {
public:
    Application()
        : db_(std::make_unique<DatabaseConnection>()),
          logger_(std::make_unique<FileLogger>()) {
        // 如果这里抛出异常，已构造的成员会被正确销毁
        throw std::runtime_error("应用初始化失败");
    }

private:
    std::unique_ptr<DatabaseConnection> db_;
    std::unique_ptr<FileLogger> logger_;
};

// 使用函数 try 块处理成员初始化异常
class Widget {
public:
    Widget(int size) try
        : data_(size) {
        // 构造函数体
    } catch (const std::bad_alloc& e) {
        std::cerr << "内存分配失败: " << e.what() << std::endl;
        throw;  // 必须重新抛出或抛出新异常
    }

private:
    std::vector<int> data_;
};
```

### 析构函数中的异常

**关键规则**：析构函数永远不应该让异常逃逸！

```cpp
#include <iostream>
#include <exception>

class SafeResource {
public:
    ~SafeResource() noexcept {
        try {
            cleanup();
        } catch (const std::exception& e) {
            // 记录错误但不让异常传播
            std::cerr << "清理时发生错误: " << e.what() << std::endl;
        } catch (...) {
            std::cerr << "清理时发生未知错误" << std::endl;
        }
    }

private:
    void cleanup() {
        // 可能抛出异常的清理操作
    }
};

// 提供非抛出和可抛出两种关闭方法
class DatabaseConnection2 {
public:
    // 正常使用时调用，可以处理异常
    void close() {
        if (connected_) {
            // 可能抛出异常
            performClose();
            connected_ = false;
        }
    }

    // 析构函数使用安全版本
    ~DatabaseConnection2() noexcept {
        try {
            close();
        } catch (...) {
            // 吞掉异常，避免析构函数抛出
        }
    }

private:
    bool connected_ = true;

    void performClose() {
        // 实际关闭操作
    }
};
```

## 异常处理最佳实践

### 何时使用异常

```cpp
// 适合使用异常的场景：
// - 构造函数失败（无法返回错误码）
// - 运算符重载（无法返回错误信息）
// - 无法在局部处理的错误
// - 错误应该由调用者处理的情况

class Matrix {
public:
    Matrix(int rows, int cols) {
        if (rows <= 0 || cols <= 0) {
            throw std::invalid_argument("矩阵维度必须为正数");
        }
        // ... 初始化
    }

    Matrix operator*(const Matrix& other) const {
        if (cols_ != other.rows_) {
            throw std::invalid_argument("矩阵维度不匹配");
        }
        // ... 矩阵乘法
        return Matrix(rows_, other.cols_);
    }

private:
    int rows_, cols_;
};

// 不适合使用异常的场景：
// - 可预期的条件（使用条件判断）
// - 高性能关键路径
// - 可以通过返回值处理的错误

// 使用 std::optional 处理可能失败的查找
#include <optional>

template <typename Container, typename T>
std::optional<typename Container::size_type>
findIndex(const Container& container, const T& value) {
    for (typename Container::size_type i = 0; i < container.size(); ++i) {
        if (container[i] == value) {
            return i;
        }
    }
    return std::nullopt;  // 而不是抛出异常
}
```

### 通过常量引用捕获异常

```cpp
#include <iostream>
#include <stdexcept>

void demonstrateCatching() {
    try {
        throw std::runtime_error("测试异常");
    }
    // 好的做法：通过 const 引用捕获
    catch (const std::exception& e) {
        std::cerr << e.what() << std::endl;
    }

    // 避免：按值捕获（可能导致对象切片）
    // catch (std::exception e) { ... }

    // 避免：非 const 引用（除非需要修改异常）
    // catch (std::exception& e) { ... }
}
```

### 使用嵌套异常保留异常链

```cpp
#include <iostream>
#include <exception>
#include <stdexcept>

void lowLevelFunction() {
    throw std::runtime_error("底层IO错误");
}

void midLevelFunction() {
    try {
        lowLevelFunction();
    } catch (...) {
        std::throw_with_nested(
            std::runtime_error("中间层处理失败")
        );
    }
}

void highLevelFunction() {
    try {
        midLevelFunction();
    } catch (...) {
        std::throw_with_nested(
            std::runtime_error("高层操作失败")
        );
    }
}

void printExceptionChain(const std::exception& e, int level = 0) {
    std::cerr << std::string(level * 2, ' ') << "异常: " << e.what() << std::endl;
    try {
        std::rethrow_if_nested(e);
    } catch (const std::exception& nested) {
        printExceptionChain(nested, level + 1);
    } catch (...) {
        std::cerr << std::string((level + 1) * 2, ' ') << "未知嵌套异常" << std::endl;
    }
}

int main() {
    try {
        highLevelFunction();
    } catch (const std::exception& e) {
        std::cerr << "完整异常链:" << std::endl;
        printExceptionChain(e);
    }

    return 0;
}
```

输出：
```
完整异常链:
异常: 高层操作失败
  异常: 中间层处理失败
    异常: 底层IO错误
```

### 异常与错误码的选择

```cpp
#include <iostream>
#include <system_error>
#include <expected>  // C++23

// 方法1: 使用 std::error_code（适合需要错误码的场景）
std::error_code readFile(const std::string& path, std::string& content) {
    // 返回错误码而不是抛出异常
    return std::make_error_code(std::errc::no_such_file_or_directory);
}

// 方法2: 使用 std::expected (C++23)
// std::expected<std::string, std::error_code> readFileExpected(const std::string& path) {
//     return std::unexpected(std::make_error_code(std::errc::no_such_file_or_directory));
// }

// 方法3: 结合使用（提供两种接口）
class FileReader {
public:
    // 异常版本
    std::string read(const std::string& path) {
        std::string content;
        auto ec = tryRead(path, content);
        if (ec) {
            throw std::system_error(ec, "读取文件失败: " + path);
        }
        return content;
    }

    // 错误码版本
    std::error_code tryRead(const std::string& path, std::string& content) {
        // 实际实现
        return {};
    }
};
```

### 异常安全的代码组织

```cpp
#include <iostream>
#include <memory>
#include <vector>

class Transaction {
public:
    void begin() {
        std::cout << "开始事务" << std::endl;
    }

    void commit() {
        std::cout << "提交事务" << std::endl;
    }

    void rollback() noexcept {
        std::cout << "回滚事务" << std::endl;
    }
};

class TransactionGuard {
public:
    explicit TransactionGuard(Transaction& tx) : tx_(tx), committed_(false) {
        tx_.begin();
    }

    ~TransactionGuard() {
        if (!committed_) {
            tx_.rollback();
        }
    }

    void commit() {
        tx_.commit();
        committed_ = true;
    }

private:
    Transaction& tx_;
    bool committed_;
};

void performDatabaseOperation() {
    Transaction tx;
    TransactionGuard guard(tx);

    // 执行各种数据库操作
    // 如果任何操作抛出异常，guard 析构时会自动回滚

    // 所有操作成功后提交
    guard.commit();
}
```

## 现代 C++ 异常处理技巧

### std::exception_ptr (C++11)

用于在线程间传递异常：

```cpp
#include <iostream>
#include <exception>
#include <thread>
#include <future>

std::exception_ptr threadException = nullptr;

void workerThread() {
    try {
        // 执行可能抛出异常的操作
        throw std::runtime_error("工作线程中的错误");
    } catch (...) {
        threadException = std::current_exception();
    }
}

void handleThreadException() {
    std::thread worker(workerThread);
    worker.join();

    if (threadException) {
        try {
            std::rethrow_exception(threadException);
        } catch (const std::exception& e) {
            std::cerr << "来自工作线程的异常: " << e.what() << std::endl;
        }
    }
}

// 使用 std::future 自动传播异常
void futureExample() {
    auto future = std::async(std::launch::async, []() {
        throw std::runtime_error("异步任务中的错误");
        return 42;
    });

    try {
        int result = future.get();  // 会重新抛出异常
    } catch (const std::exception& e) {
        std::cerr << "捕获到异步异常: " << e.what() << std::endl;
    }
}
```

### 使用 std::variant 作为异常替代

```cpp
#include <iostream>
#include <variant>
#include <string>

// 定义可能的错误类型
struct FileNotFound {
    std::string filename;
};

struct PermissionDenied {
    std::string filename;
};

struct ParseError {
    int line;
    std::string message;
};

using FileError = std::variant<FileNotFound, PermissionDenied, ParseError>;
using FileResult = std::variant<std::string, FileError>;

FileResult readAndParse(const std::string& filename) {
    // 模拟错误
    return FileError{FileNotFound{filename}};
}

void processResult() {
    auto result = readAndParse("config.txt");

    std::visit([](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, std::string>) {
            std::cout << "成功: " << arg << std::endl;
        } else if constexpr (std::is_same_v<T, FileError>) {
            std::visit([](auto&& err) {
                using E = std::decay_t<decltype(err)>;
                if constexpr (std::is_same_v<E, FileNotFound>) {
                    std::cerr << "文件未找到: " << err.filename << std::endl;
                } else if constexpr (std::is_same_v<E, PermissionDenied>) {
                    std::cerr << "权限拒绝: " << err.filename << std::endl;
                } else if constexpr (std::is_same_v<E, ParseError>) {
                    std::cerr << "解析错误(行 " << err.line << "): "
                              << err.message << std::endl;
                }
            }, arg);
        }
    }, result);
}
```

## 总结

### 异常处理核心要点

| 概念 | 说明 |
|------|------|
| try-catch-throw | 基本异常处理机制 |
| noexcept | 声明函数不抛出异常，对性能有帮助 |
| 栈展开 | 异常传播时自动销毁局部对象 |
| RAII | 使用对象生命周期管理资源 |
| 基本保证 | 异常后对象有效，无资源泄漏 |
| 强保证 | 操作成功或状态回滚 |
| 不抛出保证 | 操作保证不抛异常 |

### 最佳实践清单

1. **使用RAII管理资源**：利用智能指针、lock_guard等RAII类型
2. **析构函数永不抛异常**：使用noexcept并内部处理所有异常
3. **通过const引用捕获**：避免对象切片和不必要的复制
4. **提供异常安全保证**：至少提供基本保证
5. **合理使用noexcept**：移动操作和析构函数应该是noexcept
6. **使用标准异常类**：或从标准异常类派生自定义异常
7. **异常用于异常情况**：不要用异常控制正常流程
8. **保留异常链信息**：使用std::nested_exception保留原始错误信息

掌握C++异常处理机制，配合RAII技术，能够编写出健壮、可维护的代码。在设计API时，要明确异常安全保证级别，并在文档中说明可能抛出的异常类型。
