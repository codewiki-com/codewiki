---
title: C++17 文件系统库
description: 深入理解 C++17 filesystem：路径操作、目录遍历、文件属性、符号链接、权限管理与跨平台文件系统操作
track: cpp
section: modern-cpp
difficulty: intermediate
tags:
  - C++17
  - 文件系统
  - 路径操作
  - 目录遍历
  - 跨平台
status: imported
origin: old/src/content/docs/cpp/filesystem.zh.md
divergence: 0.212
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 标准库
  order: 25
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是文件系统库

C++17 引入的文件系统库（`<filesystem>`）是一个强大的、跨平台的文件和目录操作库。它提供了统一的接口来处理文件系统操作，抽象了不同操作系统（Windows、Linux、macOS）之间的差异。

在 C++17 之前，开发者需要使用平台特定的 API（POSIX 的 `opendir`/`readdir` 或 Windows 的 `FindFirstFile`/`FindNextFile`）来处理文件系统操作。文件系统库的出现极大地简化了这一过程。

### 核心概念

**路径（Path）**：表示文件或目录的位置，可以是绝对路径或相对路径。

**文件类型**：包括普通文件、目录、符号链接、块设备、字符设备、FIFO、套接字等。

**文件属性**：包括大小、修改时间、权限、所有者等元数据。

**目录项（Directory Entry）**：表示一个目录中的单个条目，包含文件名和类型。

### 文件系统库的优势

| 优势 | 说明 |
|------|------|
| 跨平台 | 统一 Windows、Linux、macOS 等不同系统的 API |
| 类型安全 | 使用强类型而非 C 风格的原始指针 |
| 易用性 | 提供高级抽象，简化常见操作 |
| 性能 | 避免多次系统调用，缓存文件属性信息 |
| 现代 C++ | 支持 RAII、异常处理、移动语义等 |

## 核心原理

### 路径表示与规范化

文件系统库内部维护了路径的标准表示：

```
原始路径: "C:\Users\.\Documents\..\Desktop\file.txt"
规范化后: "C:\Users\Desktop\file.txt"

原始路径: "./folder/../file.txt"
规范化后: "file.txt"

原始路径: "/home/user/./documents/../downloads"
规范化后: "/home/user/downloads"
```

路径规范化包括：
1. 移除冗余的 `.` 和 `..` 组件
2. 统一路径分隔符（跨平台处理）
3. 解析符号链接（可选）

### 文件系统操作的系统调用映射

```cpp
// C++ 文件系统库          系统调用映射
fs::exists(path)          stat() / _stat64()
fs::file_size(path)       stat() / GetFileSize()
fs::is_directory(path)    stat() / GetFileAttributes()
fs::directory_iterator    opendir() / FindFirstFile()
fs::rename(from, to)      rename() / MoveFile()
fs::remove(path)          unlink() / DeleteFile()
fs::permissions()         chmod() / SetFileAttributes()
```

### 文件状态缓存

`std::filesystem::file_status` 缓存了文件的属性信息，避免多次系统调用：

```
第一次调用 fs::status(path)
    ↓
执行系统调用 stat()
    ↓
返回 file_status 对象（包含所有属性）
    ↓
后续调用 status.type()、status.permissions() 无需再次系统调用
```

## 核心要点

### 主要类和函数

**std::filesystem::path**
- 表示文件或目录路径
- 支持路径操作：append、parent、stem、extension 等
- 自动处理路径分隔符差异

**std::filesystem::file_status**
- 存储文件的状态信息（类型、权限）
- 通过 `type()` 获取文件类型
- 通过 `permissions()` 获取权限信息

**std::filesystem::directory_entry**
- 代表目录中的一个条目
- 缓存文件属性，提高迭代效率
- 可直接比较和排序

**std::filesystem::directory_iterator**
- 非递归目录遍历
- 支持范围 for 循环

**std::filesystem::recursive_directory_iterator**
- 递归遍历目录树
- 支持深度控制

**std::filesystem::file_type**
- 枚举类型：regular, directory, symlink, block, character 等

### 关键操作

| 操作 | 函数 |
|------|------|
| 检查存在 | `exists()` |
| 获取大小 | `file_size()` |
| 获取类型 | `is_regular_file()`, `is_directory()`, `is_symlink()` |
| 获取路径部分 | `filename()`, `stem()`, `extension()`, `parent_path()` |
| 创建文件 | `create_directories()` |
| 删除文件 | `remove()`, `remove_all()` |
| 重命名移动 | `rename()` |
| 权限管理 | `permissions()` |
| 符号链接 | `read_symlink()`, `create_symlink()` |
| 目录遍历 | `directory_iterator`, `recursive_directory_iterator` |

## 代码示例

### 基础路径操作

```cpp
#include <filesystem>
#include <iostream>

namespace fs = std::filesystem;

int main() {
    // 创建路径对象
    fs::path file_path = "/home/user/documents/file.txt";

    // 获取路径组件
    std::cout << "路径: " << file_path << std::endl;
    std::cout << "文件名: " << file_path.filename() << std::endl;      // "file.txt"
    std::cout << "父目录: " << file_path.parent_path() << std::endl;    // "/home/user/documents"
    std::cout << "文件名(无扩展): " << file_path.stem() << std::endl;   // "file"
    std::cout << "扩展名: " << file_path.extension() << std::endl;      // ".txt"

    // 路径操作
    fs::path dir = "/home/user";
    fs::path new_path = dir / "documents" / "subfolder" / "file.txt";
    std::cout << "拼接路径: " << new_path << std::endl;

    // 规范化路径
    fs::path relative = "folder/../file.txt";
    std::cout << "相对路径: " << relative << std::endl;
    std::cout << "绝对路径: " << fs::absolute(relative) << std::endl;

    return 0;
}
```

### 检查文件属性

```cpp
#include <filesystem>
#include <iostream>
#include <chrono>

namespace fs = std::filesystem;

int main() {
    fs::path file = "example.txt";

    // 检查存在性
    if (fs::exists(file)) {
        std::cout << "文件存在" << std::endl;
    }

    // 获取文件大小
    try {
        auto size = fs::file_size(file);
        std::cout << "文件大小: " << size << " 字节" << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "错误: " << e.what() << std::endl;
    }

    // 检查文件类型
    if (fs::is_regular_file(file)) {
        std::cout << "是普通文件" << std::endl;
    } else if (fs::is_directory(file)) {
        std::cout << "是目录" << std::endl;
    } else if (fs::is_symlink(file)) {
        std::cout << "是符号链接" << std::endl;
    }

    // 获取最后修改时间
    auto last_write = fs::last_write_time(file);
    auto sctp = std::chrono::time_point_cast<std::chrono::system_clock::duration>(
        last_write - fs::file_time_type::clock::now() + std::chrono::system_clock::now()
    );
    auto time = std::chrono::system_clock::to_time_t(sctp);
    std::cout << "最后修改时间: " << std::ctime(&time) << std::endl;

    // 获取权限
    auto perm = fs::status(file).permissions();
    std::cout << "权限: " << std::oct << static_cast<int>(perm) << std::dec << std::endl;

    return 0;
}
```

### 目录遍历

```cpp
#include <filesystem>
#include <iostream>
#include <vector>
#include <algorithm>

namespace fs = std::filesystem;

// 非递归遍历目录
void list_directory(const fs::path& dir) {
    if (!fs::is_directory(dir)) {
        std::cout << "不是有效的目录" << std::endl;
        return;
    }

    std::cout << "目录 " << dir << " 中的文件:" << std::endl;
    for (const auto& entry : fs::directory_iterator(dir)) {
        std::cout << entry.path().filename().string();
        if (entry.is_directory()) {
            std::cout << " [目录]";
        } else if (entry.is_symlink()) {
            std::cout << " [符号链接]";
        } else {
            std::cout << " (" << entry.file_size() << " 字节)";
        }
        std::cout << std::endl;
    }
}

// 递归遍历目录
void list_directory_recursive(const fs::path& dir, int depth = 0) {
    if (!fs::is_directory(dir)) return;

    for (const auto& entry : fs::recursive_directory_iterator(dir)) {
        std::string indent(entry.depth() * 2, ' ');
        std::cout << indent << entry.path().filename().string();
        if (entry.is_directory()) {
            std::cout << "/";
        }
        std::cout << std::endl;
    }
}

// 查找特定扩展名的文件
std::vector<fs::path> find_files_with_extension(
    const fs::path& dir,
    const std::string& extension
) {
    std::vector<fs::path> result;

    for (const auto& entry : fs::recursive_directory_iterator(dir)) {
        if (entry.is_regular_file() && entry.path().extension() == extension) {
            result.push_back(entry.path());
        }
    }

    return result;
}

int main() {
    // 非递归遍历
    list_directory(".");

    std::cout << "\n===== 递归遍历 =====" << std::endl;
    list_directory_recursive(".");

    // 查找所有 .cpp 文件
    auto cpp_files = find_files_with_extension(".", ".cpp");
    std::cout << "\n找到 " << cpp_files.size() << " 个 .cpp 文件" << std::endl;

    return 0;
}
```

### 文件操作

```cpp
#include <filesystem>
#include <iostream>
#include <fstream>

namespace fs = std::filesystem;

int main() {
    // 创建目录
    fs::path dir = "test_directory";
    if (!fs::exists(dir)) {
        fs::create_directory(dir);
        std::cout << "目录创建成功" << std::endl;
    }

    // 创建嵌套目录
    fs::path nested_dir = "test_directory/sub1/sub2/sub3";
    fs::create_directories(nested_dir);
    std::cout << "嵌套目录创建成功" << std::endl;

    // 创建文件
    fs::path file = dir / "example.txt";
    {
        std::ofstream ofs(file);
        ofs << "Hello, Filesystem!";
    }

    // 复制文件
    fs::path file_copy = dir / "example_copy.txt";
    fs::copy_file(file, file_copy);
    std::cout << "文件复制成功" << std::endl;

    // 重命名文件
    fs::path renamed = dir / "renamed.txt";
    fs::rename(file_copy, renamed);
    std::cout << "文件重命名成功" << std::endl;

    // 删除文件
    if (fs::exists(renamed)) {
        fs::remove(renamed);
        std::cout << "文件删除成功" << std::endl;
    }

    // 删除整个目录树
    auto removed_count = fs::remove_all(dir);
    std::cout << "删除了 " << removed_count << " 个文件/目录" << std::endl;

    return 0;
}
```

### 权限管理

```cpp
#include <filesystem>
#include <iostream>
#include <fstream>

namespace fs = std::filesystem;

int main() {
    // 创建测试文件
    fs::path file = "permissions_test.txt";
    {
        std::ofstream ofs(file);
        ofs << "Test content";
    }

    // 获取当前权限
    auto perms = fs::status(file).permissions();
    std::cout << "原始权限: ";
    for (int i = 8; i >= 0; --i) {
        std::cout << ((static_cast<int>(perms) >> i) & 1);
    }
    std::cout << std::endl;

    // 设置权限
    // 只有所有者可读写
    fs::permissions(file,
        fs::perms::owner_read | fs::perms::owner_write,
        fs::perm_options::replace);
    std::cout << "权限修改为: owner_read|owner_write" << std::endl;

    // 添加权限
    fs::permissions(file,
        fs::perms::group_read | fs::perms::others_read,
        fs::perm_options::add);
    std::cout << "添加了 group_read|others_read" << std::endl;

    // 移除权限
    fs::permissions(file,
        fs::perms::others_write | fs::perms::others_exec,
        fs::perm_options::remove);
    std::cout << "移除了 others_write|others_exec" << std::endl;

    // 清理
    fs::remove(file);

    return 0;
}
```

### 符号链接处理

```cpp
#include <filesystem>
#include <iostream>
#include <fstream>

namespace fs = std::filesystem;

int main() {
    // 创建源文件
    fs::path source = "original.txt";
    {
        std::ofstream ofs(source);
        ofs << "Original content";
    }

    // 创建符号链接（POSIX 和 Windows 都支持）
    fs::path symlink_path = "link_to_original.txt";

    try {
        fs::create_symlink(source, symlink_path);
        std::cout << "符号链接创建成功" << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "创建符号链接失败: " << e.what() << std::endl;
    }

    // 检查是否是符号链接
    if (fs::is_symlink(symlink_path)) {
        std::cout << "这是一个符号链接" << std::endl;

        // 读取符号链接的目标
        fs::path target = fs::read_symlink(symlink_path);
        std::cout << "符号链接指向: " << target << std::endl;
    }

    // 创建目录符号链接
    fs::path source_dir = "original_dir";
    fs::create_directory(source_dir);

    fs::path dir_symlink = "link_to_dir";
    try {
        fs::create_directory_symlink(source_dir, dir_symlink);
        std::cout << "目录符号链接创建成功" << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "创建目录符号链接失败: " << e.what() << std::endl;
    }

    // 获取绝对路径（不解析符号链接）
    auto abs_path = fs::absolute(symlink_path);
    std::cout << "绝对路径: " << abs_path << std::endl;

    // 清理
    fs::remove(symlink_path);
    fs::remove(source);
    fs::remove(dir_symlink);
    fs::remove(source_dir);

    return 0;
}
```

### 错误处理

```cpp
#include <filesystem>
#include <iostream>

namespace fs = std::filesystem;

int main() {
    // 方法 1: 使用异常
    try {
        fs::path non_existent = "/path/to/non/existent/file.txt";
        auto size = fs::file_size(non_existent);
        std::cout << "文件大小: " << size << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "错误类型: " << typeid(e).name() << std::endl;
        std::cout << "错误信息: " << e.what() << std::endl;
        std::cout << "错误码: " << e.code() << std::endl;
        std::cout << "路径1: " << e.path1() << std::endl;
        std::cout << "路径2: " << e.path2() << std::endl;
    }

    std::cout << "\n--- 使用错误码版本 ---" << std::endl;

    // 方法 2: 使用错误码（不抛出异常）
    fs::path file = "example.txt";
    std::error_code ec;

    if (!fs::exists(file, ec)) {
        std::cout << "文件不存在" << std::endl;
        std::cout << "错误信息: " << ec.message() << std::endl;
    }

    auto size = fs::file_size(file, ec);
    if (ec) {
        std::cout << "获取文件大小失败: " << ec.message() << std::endl;
    }

    // 方法 3: 使用 exists 检查
    if (fs::exists(file) && fs::is_regular_file(file)) {
        try {
            auto sz = fs::file_size(file);
            std::cout << "文件大小: " << sz << std::endl;
        } catch (const fs::filesystem_error& e) {
            std::cout << "获取大小时出错: " << e.what() << std::endl;
        }
    }

    return 0;
}
```

## 最佳实践

### 优先使用相对路径和路径组合

```cpp
// 不推荐：硬编码路径
fs::path config = "C:\\Users\\John\\AppData\\Local\\MyApp\\config.ini";

// 推荐：使用路径组合
fs::path home = std::getenv("HOME"); // or "USERPROFILE" on Windows
fs::path config = home / ".config" / "myapp" / "config.ini";

// 或使用相对路径和 / 操作符
fs::path data_file = "data" / "input" / "file.csv";
```

### 检查文件存在性后再操作

```cpp
// 不推荐：直接调用可能失败的函数
auto size = fs::file_size("important.txt");

// 推荐：先检查存在性
if (fs::exists("important.txt") && fs::is_regular_file("important.txt")) {
    try {
        auto size = fs::file_size("important.txt");
        // 使用 size
    } catch (const fs::filesystem_error& e) {
        // 处理错误
    }
}
```

### 使用错误码替代异常处理高频调用

```cpp
// 不推荐：每次调用都可能抛异常
for (const auto& entry : fs::recursive_directory_iterator(".")) {
    try {
        auto size = fs::file_size(entry.path());
        // 处理
    } catch (const fs::filesystem_error& e) {
        // 处理
    }
}

// 推荐：使用 directory_entry 的缓存
for (const auto& entry : fs::recursive_directory_iterator(".")) {
    if (entry.is_regular_file()) {
        // directory_entry 已缓存大小信息
        auto size = entry.file_size();
    }
}
```

### 使用路径的规范化避免重复

```cpp
// 不推荐：可能产生重复代码
if (fs::exists("./output/results")) { }
if (fs::exists("output/results")) { }
if (fs::exists("output/../output/results")) { }

// 推荐：规范化路径
fs::path canonical = fs::canonical("./output/results");
if (fs::exists(canonical)) { }
```

### 使用 RAII 管理临时文件

```cpp
class TempFile {
private:
    fs::path path_;

public:
    TempFile(const fs::path& base = fs::temp_directory_path()) {
        path_ = base / "temp_XXXXXX";
        // 创建临时文件
    }

    ~TempFile() {
        if (fs::exists(path_)) {
            fs::remove(path_);
        }
    }

    const fs::path& get() const { return path_; }
};

int main() {
    {
        TempFile temp;
        // 使用 temp
    } // 自动清理

    return 0;
}
```

### 权限检查在尝试操作前

```cpp
// 不推荐：盲目尝试
try {
    std::ofstream ofs("file.txt");
    ofs << "content";
} catch (...) {
    // 处理失败
}

// 推荐：检查权限
auto perms = fs::status("file.txt").permissions();
if ((perms & fs::perms::owner_write) != fs::perms::none) {
    std::ofstream ofs("file.txt");
    ofs << "content";
} else {
    std::cout << "没有写权限" << std::endl;
}
```

### 避免符号链接陷阱

```cpp
// 获取真实路径（解析符号链接）
fs::path real_path = fs::canonical(file);

// 检查是否是符号链接
if (fs::is_symlink(file)) {
    fs::path target = fs::read_symlink(file);
    std::cout << "符号链接指向: " << target << std::endl;
}

// 避免无限循环（符号链接循环引用）
try {
    fs::recursive_directory_iterator iter(dir);
    for (const auto& entry : iter) {
        // 处理条目
    }
} catch (const fs::filesystem_error& e) {
    // 捕获循环引用错误
}
```

## 常见陷阱

### 忽视文件不存在的异常

```cpp
// 陷阱：假设文件一定存在
auto size = fs::file_size("file.txt"); // 如果文件不存在会抛异常

// 解决：检查或捕获异常
try {
    auto size = fs::file_size("file.txt");
} catch (const fs::filesystem_error& e) {
    std::cerr << "文件错误: " << e.what() << std::endl;
}
```

### 权限问题导致操作失败

```cpp
// 陷阱：没有适当权限的文件操作
fs::permissions(protected_file, fs::perms::owner_write);

// 解决：检查并捕获权限错误
std::error_code ec;
fs::permissions(protected_file, fs::perms::owner_write, ec);
if (ec) {
    std::cout << "权限修改失败: " << ec.message() << std::endl;
}
```

### 路径分隔符不一致

```cpp
// 陷阱：硬编码 Windows 风格路径分隔符
fs::path bad = "C:\\Users\\Documents\\file.txt"; // Windows 上可能有问题

// 解决：使用 / 操作符，自动处理分隔符
fs::path good = "C:" / "Users" / "Documents" / "file.txt";

// 或者使用原始字符串
fs::path also_good = R"(C:\Users\Documents\file.txt)";
```

### 符号链接循环引用

```cpp
// 陷阱：递归遍历可能遇到符号链接循环
for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    // 如果存在循环符号链接会陷入死循环
}

// 解决：禁用符号链接跟随
for (const auto& entry : fs::recursive_directory_iterator(
    dir,
    fs::directory_options::skip_permission_denied)) {
    // 处理
}
```

### 大量文件时性能问题

```cpp
// 陷阱：对每个文件都重新查询属性
for (const auto& entry : fs::directory_iterator(dir)) {
    auto size = fs::file_size(entry.path()); // 额外系统调用
    auto type = fs::is_regular_file(entry.path()); // 额外系统调用
}

// 解决：利用 directory_entry 的缓存
for (const auto& entry : fs::directory_iterator(dir)) {
    auto size = entry.file_size(); // 已缓存
    auto is_regular = entry.is_regular_file(); // 已缓存
}
```

### 跨平台路径问题

```cpp
// 陷阱：假设 "/" 在 Windows 上总是有效
fs::path path = "C:/Users/file.txt"; // Windows 上可能失败

// 解决：使用 / 操作符或原始字符串字面量
fs::path better = fs::path("C:") / "Users" / "file.txt";

// 或获取临时目录
fs::path temp = fs::temp_directory_path() / "file.txt";
```

### 异常安全性

```cpp
// 陷阱：部分操作可能失败导致不一致状态
fs::remove_all(dir); // 如果在中途失败，目录可能被部分删除

// 解决：检查返回值并考虑备份
auto removed = fs::remove_all(dir);
std::cout << "删除了 " << removed << " 项" << std::endl;

// 或使用事务性方法（备份后删除）
if (fs::exists(dir)) {
    fs::rename(dir, dir.string() + ".bak");
    // 确认成功后再删除
    fs::remove_all(dir.string() + ".bak");
}
```

## 性能考量

### 系统调用的开销

```cpp
// 性能问题：每次调用都产生系统调用
std::vector<fs::path> large_files;
for (const auto& entry : fs::directory_iterator(dir)) {
    if (fs::file_size(entry.path()) > 1000000) { // 额外系统调用
        large_files.push_back(entry.path());
    }
}

// 优化：使用缓存的信息
std::vector<fs::path> large_files;
for (const auto& entry : fs::directory_iterator(dir)) {
    if (entry.file_size() > 1000000) { // 使用缓存
        large_files.push_back(entry.path());
    }
}
```

### 递归遍历优化

```cpp
// 低效：递归函数调用
void traverse(const fs::path& dir) {
    for (const auto& entry : fs::directory_iterator(dir)) {
        if (entry.is_directory()) {
            traverse(entry.path()); // 函数调用开销
        }
    }
}

// 优化：使用 recursive_directory_iterator
void traverse(const fs::path& dir) {
    for (const auto& entry : fs::recursive_directory_iterator(dir)) {
        // 迭代器内部优化
    }
}
```

### 缓存文件属性

```cpp
struct FileInfo {
    fs::path path;
    fs::file_time_type mtime;
    uintmax_t size;
};

// 建立缓存
std::vector<FileInfo> cache;
for (const auto& entry : fs::directory_iterator(dir)) {
    cache.push_back({
        entry.path(),
        entry.last_write_time(),
        entry.file_size()
    });
}

// 使用缓存避免重复查询
for (const auto& info : cache) {
    if (info.mtime > some_time && info.size > threshold) {
        // 处理
    }
}
```

### 异常的性能代价

```cpp
// 低效：频繁异常
for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    try {
        auto size = fs::file_size(entry.path());
    } catch (const fs::filesystem_error&) {
        // 异常处理有性能开销
    }
}

// 优化：预防式检查
for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    if (entry.is_regular_file()) {
        auto size = entry.file_size(); // 不会异常
    }
}
```

## 实战场景

### 场景 1: 日志文件清理工具

```cpp
#include <filesystem>
#include <iostream>
#include <chrono>

namespace fs = std::filesystem;

class LogCleaner {
private:
    fs::path log_dir;
    std::chrono::hours retention_period;
    uintmax_t max_size;

public:
    LogCleaner(const fs::path& dir,
               std::chrono::hours retention,
               uintmax_t max_bytes)
        : log_dir(dir), retention_period(retention), max_size(max_bytes) {}

    void cleanup() {
        if (!fs::exists(log_dir) || !fs::is_directory(log_dir)) {
            std::cout << "日志目录不存在" << std::endl;
            return;
        }

        auto now = fs::file_time_type::clock::now();
        uintmax_t total_size = 0;
        uintmax_t deleted_size = 0;
        int deleted_count = 0;

        // 收集所有日志文件
        std::vector<fs::path> log_files;
        for (const auto& entry : fs::directory_iterator(log_dir)) {
            if (entry.is_regular_file() &&
                entry.path().extension() == ".log") {
                log_files.push_back(entry.path());
                total_size += entry.file_size();
            }
        }

        // 按修改时间排序
        std::sort(log_files.begin(), log_files.end(),
                  [](const fs::path& a, const fs::path& b) {
                      return fs::last_write_time(a) <
                             fs::last_write_time(b);
                  });

        // 删除过期文件
        for (const auto& file : log_files) {
            auto last_write = fs::last_write_time(file);
            auto age = now - last_write;

            if (age > std::chrono::duration_cast<fs::file_time_type::duration>(
                    retention_period)) {
                try {
                    deleted_size += fs::file_size(file);
                    fs::remove(file);
                    deleted_count++;
                    std::cout << "删除过期文件: " << file.filename() << std::endl;
                } catch (const fs::filesystem_error& e) {
                    std::cout << "删除文件失败: " << e.what() << std::endl;
                }
            }
        }

        // 按大小限制清理
        if (total_size - deleted_size > max_size) {
            for (const auto& file : log_files) {
                if (total_size - deleted_size <= max_size) break;

                try {
                    auto file_size = fs::file_size(file);
                    fs::remove(file);
                    deleted_size += file_size;
                    deleted_count++;
                    std::cout << "删除大小超限文件: " << file.filename() << std::endl;
                } catch (const fs::filesystem_error& e) {
                    std::cout << "删除文件失败: " << e.what() << std::endl;
                }
            }
        }

        std::cout << "清理完成: 删除 " << deleted_count
                  << " 个文件，释放 " << deleted_size << " 字节" << std::endl;
    }
};

int main() {
    LogCleaner cleaner("./logs", std::chrono::hours(24 * 7), 1000000000); // 7天或1GB
    cleaner.cleanup();
    return 0;
}
```

### 场景 2: 文件同步工具

```cpp
#include <filesystem>
#include <iostream>
#include <map>

namespace fs = std::filesystem;

class FileSync {
private:
    fs::path source, destination;
    std::map<fs::path, fs::file_time_type> source_files;

public:
    FileSync(const fs::path& src, const fs::path& dst)
        : source(src), destination(dst) {
        if (!fs::exists(destination)) {
            fs::create_directories(destination);
        }
    }

    void scan_source() {
        source_files.clear();

        for (const auto& entry : fs::recursive_directory_iterator(source)) {
            if (entry.is_regular_file()) {
                auto rel_path = fs::relative(entry.path(), source);
                source_files[rel_path] = entry.last_write_time();
            }
        }

        std::cout << "扫描到 " << source_files.size() << " 个源文件" << std::endl;
    }

    void sync() {
        scan_source();

        for (const auto& [rel_path, mtime] : source_files) {
            fs::path src_file = source / rel_path;
            fs::path dst_file = destination / rel_path;

            // 创建目标目录
            if (!fs::exists(dst_file.parent_path())) {
                fs::create_directories(dst_file.parent_path());
            }

            // 判断是否需要同步
            bool need_sync = false;
            if (!fs::exists(dst_file)) {
                need_sync = true;
                std::cout << "新文件: " << rel_path << std::endl;
            } else {
                auto dst_mtime = fs::last_write_time(dst_file);
                if (mtime > dst_mtime) {
                    need_sync = true;
                    std::cout << "更新文件: " << rel_path << std::endl;
                }
            }

            // 复制或更新文件
            if (need_sync) {
                try {
                    fs::copy_file(src_file, dst_file,
                                  fs::copy_options::overwrite_existing);
                } catch (const fs::filesystem_error& e) {
                    std::cout << "复制失败: " << e.what() << std::endl;
                }
            }
        }

        std::cout << "同步完成" << std::endl;
    }
};

int main() {
    FileSync sync("./source", "./backup");
    sync.sync();
    return 0;
}
```

### 场景 3: 文件搜索工具

```cpp
#include <filesystem>
#include <iostream>
#include <regex>
#include <vector>

namespace fs = std::filesystem;

class FileSearcher {
public:
    enum class SearchType {
        NAME,
        REGEX,
        SIZE,
        EXTENSION
    };

    std::vector<fs::path> search_by_name(
        const fs::path& dir,
        const std::string& pattern) {
        std::vector<fs::path> results;

        for (const auto& entry : fs::recursive_directory_iterator(dir)) {
            if (entry.is_regular_file()) {
                if (entry.path().filename().string().find(pattern) != std::string::npos) {
                    results.push_back(entry.path());
                }
            }
        }

        return results;
    }

    std::vector<fs::path> search_by_regex(
        const fs::path& dir,
        const std::regex& pattern) {
        std::vector<fs::path> results;

        for (const auto& entry : fs::recursive_directory_iterator(dir)) {
            if (entry.is_regular_file()) {
                if (std::regex_match(entry.path().filename().string(), pattern)) {
                    results.push_back(entry.path());
                }
            }
        }

        return results;
    }

    std::vector<fs::path> search_by_size(
        const fs::path& dir,
        uintmax_t min_size,
        uintmax_t max_size = std::numeric_limits<uintmax_t>::max()) {
        std::vector<fs::path> results;

        for (const auto& entry : fs::recursive_directory_iterator(dir)) {
            if (entry.is_regular_file()) {
                auto size = entry.file_size();
                if (size >= min_size && size <= max_size) {
                    results.push_back(entry.path());
                }
            }
        }

        return results;
    }

    std::vector<fs::path> search_by_extension(
        const fs::path& dir,
        const std::string& ext) {
        std::vector<fs::path> results;
        std::string normalized_ext = ext;
        if (normalized_ext[0] != '.') {
            normalized_ext = "." + normalized_ext;
        }

        for (const auto& entry : fs::recursive_directory_iterator(dir)) {
            if (entry.is_regular_file() &&
                entry.path().extension() == normalized_ext) {
                results.push_back(entry.path());
            }
        }

        return results;
    }
};

int main() {
    FileSearcher searcher;

    // 按名称搜索
    auto by_name = searcher.search_by_name(".", "test");
    std::cout << "按名称找到 " << by_name.size() << " 个文件" << std::endl;

    // 按正则搜索
    std::regex pattern(R"(.*\.(cpp|h)$)");
    auto by_regex = searcher.search_by_regex(".", pattern);
    std::cout << "按正则找到 " << by_regex.size() << " 个源文件" << std::endl;

    // 按大小搜索（大于 1MB 的文件）
    auto large = searcher.search_by_size(".", 1000000);
    std::cout << "找到 " << large.size() << " 个大于 1MB 的文件" << std::endl;

    // 按扩展名搜索
    auto cpp_files = searcher.search_by_extension(".", "cpp");
    std::cout << "找到 " << cpp_files.size() << " 个 .cpp 文件" << std::endl;

    return 0;
}
```

## 面试要点

### filesystem 库与传统 C API 的区别

**C API（POSIX）**
```cpp
DIR* dir = opendir(".");
struct dirent* entry;
while ((entry = readdir(dir)) != NULL) {
    struct stat st;
    stat(entry->d_name, &st);
}
closedir(dir);
```

**C++17 filesystem**
```cpp
for (const auto& entry : fs::directory_iterator(".")) {
    auto size = entry.file_size();
}
```

关键差异：
- 类型安全：`std::filesystem::path` vs `char*`
- 资源管理：自动 vs 手动 `opendir`/`closedir`
- 跨平台：自动处理 vs 需要条件编译
- 异常安全：异常 vs 错误码

### path 对象的构造和操作

```cpp
// 构造方式
fs::path p1("file.txt");
fs::path p2 = "file.txt";
fs::path p3 = fs::current_path() / "file.txt";

// 关键操作
p1.parent_path()      // 父目录
p1.filename()         // 文件名
p1.stem()             // 文件名（无扩展）
p1.extension()        // 扩展名
p1.is_absolute()      // 是否绝对路径
p1.lexically_normal() // 规范化
```

### 文件类型检查

```cpp
fs::is_regular_file(p)     // 普通文件
fs::is_directory(p)        // 目录
fs::is_symlink(p)          // 符号链接
fs::is_block_file(p)       // 块设备
fs::is_character_file(p)   // 字符设备
fs::is_fifo(p)             // FIFO/命名管道
fs::is_socket(p)           // Unix 套接字
```

### directory_iterator 的效率

问：为什么 `directory_iterator` 比多次调用 `fs::file_size()` 快？

答：`directory_iterator` 返回的 `directory_entry` 缓存了文件属性信息。一次 `readdir()` 调用会返回多个条目的信息，避免多次系统调用。

### 异常 vs 错误码

```cpp
// 异常方式：调用失败时抛异常
auto size = fs::file_size("file.txt"); // 抛 filesystem_error

// 错误码方式：返回错误码
std::error_code ec;
auto size = fs::file_size("file.txt", ec); // 不抛异常，错误在 ec
```

### 权限管理

```cpp
fs::perms p = fs::status(file).permissions();

// 权限位
fs::perms::owner_read      // 所有者读
fs::perms::owner_write     // 所有者写
fs::perms::owner_exec      // 所有者执行
fs::perms::group_read      // 组读
fs::perms::group_write     // 组写
// ...

// 权限操作
fs::permissions(file, fs::perms::owner_read, fs::perm_options::replace);
```

### 符号链接的陷阱

问：`fs::exists()` 和 `fs::is_symlink()` 的关系？

答：
- `fs::exists(symlink_to_missing_file)` 返回 `false`（检查目标）
- `fs::is_symlink(symlink_to_missing_file)` 返回 `true`（检查符号链接本身）

### 递归遍历的深度控制

```cpp
for (const auto& entry : fs::recursive_directory_iterator(".")) {
    if (entry.depth() > 3) {
        entry.disable_recursion_pending(); // 不进入更深的目录
    }
}
```

### 相对路径和绝对路径

```cpp
fs::path rel("folder/file.txt");
fs::path abs = fs::absolute(rel);           // 相对变绝对（基于当前目录）
fs::path canonical = fs::canonical(abs);    // 规范化并解析符号链接
fs::path relative = fs::relative(abs);      // 转为相对路径
```

## 延伸阅读

### 相关标准库组件

1. **`<chrono>`** - 文件时间戳处理
   - `fs::last_write_time()` 返回 `fs::file_time_type`
   - 需要转换为 `std::chrono::system_clock::time_point`

2. **`<system_error>`** - 错误处理
   - `std::filesystem_error` 继承自 `std::system_error`
   - `std::error_code` 用于无异常操作

3. **`<fstream>`** - 文件 I/O
   - 与 `filesystem` 库配合打开和操作文件

### 常见库和框架

1. **Boost.Filesystem** - C++17 前的替代品
2. **ghc::filesystem** - 轻量级跨平台实现
3. **fmt 库** - 更优雅的路径输出格式化

### 深入学习主题

1. **文件系统权限模型** - Unix/Windows 权限差异
2. **符号链接和硬链接** - 底层机制
3. **文件系统特性检测** - 支持大文件、长文件名、权限等
4. **POSIX 标准** - C++17 filesystem 的基础
5. **Windows 文件系统 API** - 了解底层实现

### 参考资源

- C++ 标准文档：[cppreference.com - std::filesystem](https://en.cppreference.com/w/cpp/filesystem)
- ISO/IEC 14882:2017 标准中的 30.10 文件系统库章节
- Filesystem TS (Technical Specification) - 标准的演进过程

