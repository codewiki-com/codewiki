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
origin: old/src/content/docs/cpp/filesystem.en.md
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

## Concept Explanation

### What is the Filesystem Library

The filesystem library (`<filesystem>`) introduced in C++17 is a powerful, cross-platform library for file and directory operations. It provides a unified interface for handling filesystem operations, abstracting away the differences between operating systems (Windows, Linux, macOS).

Before C++17, developers needed to use platform-specific APIs (POSIX's `opendir`/`readdir` or Windows's `FindFirstFile`/`FindNextFile`) to handle filesystem operations. The introduction of the filesystem library greatly simplified this process.

### Core Concepts

**Path**: Represents the location of a file or directory, which can be absolute or relative.

**File Types**: Include regular files, directories, symbolic links, block devices, character devices, FIFOs, sockets, etc.

**File Attributes**: Include metadata such as size, modification time, permissions, owner, etc.

**Directory Entry**: Represents a single entry in a directory, containing the filename and type.

### Advantages of the Filesystem Library

| Advantage | Description |
|-----------|-------------|
| Cross-platform | Unifies APIs across Windows, Linux, macOS, and other systems |
| Type Safety | Uses strong types instead of C-style raw pointers |
| Ease of Use | Provides high-level abstractions that simplify common operations |
| Performance | Avoids multiple system calls by caching file attribute information |
| Modern C++ | Supports RAII, exception handling, move semantics, etc. |

## Core Principles

### Path Representation and Normalization

The filesystem library internally maintains a standard representation of paths:

```
Original path: "C:\Users\.\Documents\..\Desktop\file.txt"
After normalization: "C:\Users\Desktop\file.txt"

Original path: "./folder/../file.txt"
After normalization: "file.txt"

Original path: "/home/user/./documents/../downloads"
After normalization: "/home/user/downloads"
```

Path normalization includes:
1. Removing redundant `.` and `..` components
2. Unifying path separators (cross-platform handling)
3. Resolving symbolic links (optional)

### System Call Mapping for Filesystem Operations

```cpp
// C++ filesystem library          System call mapping
fs::exists(path)          stat() / _stat64()
fs::file_size(path)       stat() / GetFileSize()
fs::is_directory(path)    stat() / GetFileAttributes()
fs::directory_iterator    opendir() / FindFirstFile()
fs::rename(from, to)      rename() / MoveFile()
fs::remove(path)          unlink() / DeleteFile()
fs::permissions()         chmod() / SetFileAttributes()
```

### File Status Caching

`std::filesystem::file_status` caches file attribute information to avoid multiple system calls:

```
First call to fs::status(path)
    |
Execute system call stat()
    |
Return file_status object (containing all attributes)
    |
Subsequent calls to status.type(), status.permissions() require no additional system calls
```

## Key Points

### Main Classes and Functions

**std::filesystem::path**
- Represents a file or directory path
- Supports path operations: append, parent, stem, extension, etc.
- Automatically handles path separator differences

**std::filesystem::file_status**
- Stores file status information (type, permissions)
- Get file type via `type()`
- Get permission information via `permissions()`

**std::filesystem::directory_entry**
- Represents an entry in a directory
- Caches file attributes for improved iteration efficiency
- Can be directly compared and sorted

**std::filesystem::directory_iterator**
- Non-recursive directory traversal
- Supports range-based for loops

**std::filesystem::recursive_directory_iterator**
- Recursively traverses directory trees
- Supports depth control

**std::filesystem::file_type**
- Enumeration type: regular, directory, symlink, block, character, etc.

### Key Operations

| Operation | Function |
|-----------|----------|
| Check existence | `exists()` |
| Get size | `file_size()` |
| Get type | `is_regular_file()`, `is_directory()`, `is_symlink()` |
| Get path components | `filename()`, `stem()`, `extension()`, `parent_path()` |
| Create files | `create_directories()` |
| Delete files | `remove()`, `remove_all()` |
| Rename/move | `rename()` |
| Permission management | `permissions()` |
| Symbolic links | `read_symlink()`, `create_symlink()` |
| Directory traversal | `directory_iterator`, `recursive_directory_iterator` |

## Code Examples

### Basic Path Operations

```cpp
#include <filesystem>
#include <iostream>

namespace fs = std::filesystem;

int main() {
    // Create path object
    fs::path file_path = "/home/user/documents/file.txt";

    // Get path components
    std::cout << "Path: " << file_path << std::endl;
    std::cout << "Filename: " << file_path.filename() << std::endl;      // "file.txt"
    std::cout << "Parent directory: " << file_path.parent_path() << std::endl;    // "/home/user/documents"
    std::cout << "Stem (no extension): " << file_path.stem() << std::endl;   // "file"
    std::cout << "Extension: " << file_path.extension() << std::endl;      // ".txt"

    // Path operations
    fs::path dir = "/home/user";
    fs::path new_path = dir / "documents" / "subfolder" / "file.txt";
    std::cout << "Concatenated path: " << new_path << std::endl;

    // Normalize path
    fs::path relative = "folder/../file.txt";
    std::cout << "Relative path: " << relative << std::endl;
    std::cout << "Absolute path: " << fs::absolute(relative) << std::endl;

    return 0;
}
```

### Checking File Attributes

```cpp
#include <filesystem>
#include <iostream>
#include <chrono>

namespace fs = std::filesystem;

int main() {
    fs::path file = "example.txt";

    // Check existence
    if (fs::exists(file)) {
        std::cout << "File exists" << std::endl;
    }

    // Get file size
    try {
        auto size = fs::file_size(file);
        std::cout << "File size: " << size << " bytes" << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "Error: " << e.what() << std::endl;
    }

    // Check file type
    if (fs::is_regular_file(file)) {
        std::cout << "Is a regular file" << std::endl;
    } else if (fs::is_directory(file)) {
        std::cout << "Is a directory" << std::endl;
    } else if (fs::is_symlink(file)) {
        std::cout << "Is a symbolic link" << std::endl;
    }

    // Get last modification time
    auto last_write = fs::last_write_time(file);
    auto sctp = std::chrono::time_point_cast<std::chrono::system_clock::duration>(
        last_write - fs::file_time_type::clock::now() + std::chrono::system_clock::now()
    );
    auto time = std::chrono::system_clock::to_time_t(sctp);
    std::cout << "Last modification time: " << std::ctime(&time) << std::endl;

    // Get permissions
    auto perm = fs::status(file).permissions();
    std::cout << "Permissions: " << std::oct << static_cast<int>(perm) << std::dec << std::endl;

    return 0;
}
```

### Directory Traversal

```cpp
#include <filesystem>
#include <iostream>
#include <vector>
#include <algorithm>

namespace fs = std::filesystem;

// Non-recursive directory traversal
void list_directory(const fs::path& dir) {
    if (!fs::is_directory(dir)) {
        std::cout << "Not a valid directory" << std::endl;
        return;
    }

    std::cout << "Files in directory " << dir << ":" << std::endl;
    for (const auto& entry : fs::directory_iterator(dir)) {
        std::cout << entry.path().filename().string();
        if (entry.is_directory()) {
            std::cout << " [Directory]";
        } else if (entry.is_symlink()) {
            std::cout << " [Symbolic link]";
        } else {
            std::cout << " (" << entry.file_size() << " bytes)";
        }
        std::cout << std::endl;
    }
}

// Recursive directory traversal
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

// Find files with specific extension
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
    // Non-recursive traversal
    list_directory(".");

    std::cout << "\n===== Recursive Traversal =====" << std::endl;
    list_directory_recursive(".");

    // Find all .cpp files
    auto cpp_files = find_files_with_extension(".", ".cpp");
    std::cout << "\nFound " << cpp_files.size() << " .cpp files" << std::endl;

    return 0;
}
```

### File Operations

```cpp
#include <filesystem>
#include <iostream>
#include <fstream>

namespace fs = std::filesystem;

int main() {
    // Create directory
    fs::path dir = "test_directory";
    if (!fs::exists(dir)) {
        fs::create_directory(dir);
        std::cout << "Directory created successfully" << std::endl;
    }

    // Create nested directories
    fs::path nested_dir = "test_directory/sub1/sub2/sub3";
    fs::create_directories(nested_dir);
    std::cout << "Nested directories created successfully" << std::endl;

    // Create file
    fs::path file = dir / "example.txt";
    {
        std::ofstream ofs(file);
        ofs << "Hello, Filesystem!";
    }

    // Copy file
    fs::path file_copy = dir / "example_copy.txt";
    fs::copy_file(file, file_copy);
    std::cout << "File copied successfully" << std::endl;

    // Rename file
    fs::path renamed = dir / "renamed.txt";
    fs::rename(file_copy, renamed);
    std::cout << "File renamed successfully" << std::endl;

    // Delete file
    if (fs::exists(renamed)) {
        fs::remove(renamed);
        std::cout << "File deleted successfully" << std::endl;
    }

    // Delete entire directory tree
    auto removed_count = fs::remove_all(dir);
    std::cout << "Deleted " << removed_count << " files/directories" << std::endl;

    return 0;
}
```

### Permission Management

```cpp
#include <filesystem>
#include <iostream>
#include <fstream>

namespace fs = std::filesystem;

int main() {
    // Create test file
    fs::path file = "permissions_test.txt";
    {
        std::ofstream ofs(file);
        ofs << "Test content";
    }

    // Get current permissions
    auto perms = fs::status(file).permissions();
    std::cout << "Original permissions: ";
    for (int i = 8; i >= 0; --i) {
        std::cout << ((static_cast<int>(perms) >> i) & 1);
    }
    std::cout << std::endl;

    // Set permissions
    // Only owner can read and write
    fs::permissions(file,
        fs::perms::owner_read | fs::perms::owner_write,
        fs::perm_options::replace);
    std::cout << "Permissions changed to: owner_read|owner_write" << std::endl;

    // Add permissions
    fs::permissions(file,
        fs::perms::group_read | fs::perms::others_read,
        fs::perm_options::add);
    std::cout << "Added group_read|others_read" << std::endl;

    // Remove permissions
    fs::permissions(file,
        fs::perms::others_write | fs::perms::others_exec,
        fs::perm_options::remove);
    std::cout << "Removed others_write|others_exec" << std::endl;

    // Cleanup
    fs::remove(file);

    return 0;
}
```

### Symbolic Link Handling

```cpp
#include <filesystem>
#include <iostream>
#include <fstream>

namespace fs = std::filesystem;

int main() {
    // Create source file
    fs::path source = "original.txt";
    {
        std::ofstream ofs(source);
        ofs << "Original content";
    }

    // Create symbolic link (supported on both POSIX and Windows)
    fs::path symlink_path = "link_to_original.txt";

    try {
        fs::create_symlink(source, symlink_path);
        std::cout << "Symbolic link created successfully" << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "Failed to create symbolic link: " << e.what() << std::endl;
    }

    // Check if it's a symbolic link
    if (fs::is_symlink(symlink_path)) {
        std::cout << "This is a symbolic link" << std::endl;

        // Read symbolic link target
        fs::path target = fs::read_symlink(symlink_path);
        std::cout << "Symbolic link points to: " << target << std::endl;
    }

    // Create directory symbolic link
    fs::path source_dir = "original_dir";
    fs::create_directory(source_dir);

    fs::path dir_symlink = "link_to_dir";
    try {
        fs::create_directory_symlink(source_dir, dir_symlink);
        std::cout << "Directory symbolic link created successfully" << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "Failed to create directory symbolic link: " << e.what() << std::endl;
    }

    // Get absolute path (without resolving symbolic links)
    auto abs_path = fs::absolute(symlink_path);
    std::cout << "Absolute path: " << abs_path << std::endl;

    // Cleanup
    fs::remove(symlink_path);
    fs::remove(source);
    fs::remove(dir_symlink);
    fs::remove(source_dir);

    return 0;
}
```

### Error Handling

```cpp
#include <filesystem>
#include <iostream>

namespace fs = std::filesystem;

int main() {
    // Method 1: Using exceptions
    try {
        fs::path non_existent = "/path/to/non/existent/file.txt";
        auto size = fs::file_size(non_existent);
        std::cout << "File size: " << size << std::endl;
    } catch (const fs::filesystem_error& e) {
        std::cout << "Error type: " << typeid(e).name() << std::endl;
        std::cout << "Error message: " << e.what() << std::endl;
        std::cout << "Error code: " << e.code() << std::endl;
        std::cout << "Path1: " << e.path1() << std::endl;
        std::cout << "Path2: " << e.path2() << std::endl;
    }

    std::cout << "\n--- Using error code version ---" << std::endl;

    // Method 2: Using error codes (no exceptions)
    fs::path file = "example.txt";
    std::error_code ec;

    if (!fs::exists(file, ec)) {
        std::cout << "File does not exist" << std::endl;
        std::cout << "Error message: " << ec.message() << std::endl;
    }

    auto size = fs::file_size(file, ec);
    if (ec) {
        std::cout << "Failed to get file size: " << ec.message() << std::endl;
    }

    // Method 3: Using exists check
    if (fs::exists(file) && fs::is_regular_file(file)) {
        try {
            auto sz = fs::file_size(file);
            std::cout << "File size: " << sz << std::endl;
        } catch (const fs::filesystem_error& e) {
            std::cout << "Error getting size: " << e.what() << std::endl;
        }
    }

    return 0;
}
```

## Best Practices

### Prefer Relative Paths and Path Composition

```cpp
// Not recommended: hardcoded paths
fs::path config = "C:\\Users\\John\\AppData\\Local\\MyApp\\config.ini";

// Recommended: use path composition
fs::path home = std::getenv("HOME"); // or "USERPROFILE" on Windows
fs::path config = home / ".config" / "myapp" / "config.ini";

// Or use relative paths with the / operator
fs::path data_file = "data" / "input" / "file.csv";
```

### Check File Existence Before Operations

```cpp
// Not recommended: directly call functions that may fail
auto size = fs::file_size("important.txt");

// Recommended: check existence first
if (fs::exists("important.txt") && fs::is_regular_file("important.txt")) {
    try {
        auto size = fs::file_size("important.txt");
        // use size
    } catch (const fs::filesystem_error& e) {
        // handle error
    }
}
```

### Use Error Codes Instead of Exceptions for High-Frequency Calls

```cpp
// Not recommended: each call may throw an exception
for (const auto& entry : fs::recursive_directory_iterator(".")) {
    try {
        auto size = fs::file_size(entry.path());
        // process
    } catch (const fs::filesystem_error& e) {
        // handle
    }
}

// Recommended: use directory_entry's cache
for (const auto& entry : fs::recursive_directory_iterator(".")) {
    if (entry.is_regular_file()) {
        // directory_entry has cached size information
        auto size = entry.file_size();
    }
}
```

### Use Path Normalization to Avoid Duplicates

```cpp
// Not recommended: may produce duplicate code
if (fs::exists("./output/results")) { }
if (fs::exists("output/results")) { }
if (fs::exists("output/../output/results")) { }

// Recommended: normalize paths
fs::path canonical = fs::canonical("./output/results");
if (fs::exists(canonical)) { }
```

### Use RAII to Manage Temporary Files

```cpp
class TempFile {
private:
    fs::path path_;

public:
    TempFile(const fs::path& base = fs::temp_directory_path()) {
        path_ = base / "temp_XXXXXX";
        // Create temporary file
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
        // use temp
    } // automatically cleaned up

    return 0;
}
```

### Check Permissions Before Attempting Operations

```cpp
// Not recommended: blindly attempt
try {
    std::ofstream ofs("file.txt");
    ofs << "content";
} catch (...) {
    // handle failure
}

// Recommended: check permissions
auto perms = fs::status("file.txt").permissions();
if ((perms & fs::perms::owner_write) != fs::perms::none) {
    std::ofstream ofs("file.txt");
    ofs << "content";
} else {
    std::cout << "No write permission" << std::endl;
}
```

### Avoid Symbolic Link Pitfalls

```cpp
// Get real path (resolve symbolic links)
fs::path real_path = fs::canonical(file);

// Check if it's a symbolic link
if (fs::is_symlink(file)) {
    fs::path target = fs::read_symlink(file);
    std::cout << "Symbolic link points to: " << target << std::endl;
}

// Avoid infinite loops (symbolic link circular references)
try {
    fs::recursive_directory_iterator iter(dir);
    for (const auto& entry : iter) {
        // process entry
    }
} catch (const fs::filesystem_error& e) {
    // catch circular reference error
}
```

## Common Pitfalls

### Ignoring File Not Found Exceptions

```cpp
// Pitfall: assuming file always exists
auto size = fs::file_size("file.txt"); // throws exception if file doesn't exist

// Solution: check or catch exception
try {
    auto size = fs::file_size("file.txt");
} catch (const fs::filesystem_error& e) {
    std::cerr << "File error: " << e.what() << std::endl;
}
```

### Permission Issues Causing Operation Failures

```cpp
// Pitfall: file operations without appropriate permissions
fs::permissions(protected_file, fs::perms::owner_write);

// Solution: check and catch permission errors
std::error_code ec;
fs::permissions(protected_file, fs::perms::owner_write, ec);
if (ec) {
    std::cout << "Failed to modify permissions: " << ec.message() << std::endl;
}
```

### Inconsistent Path Separators

```cpp
// Pitfall: hardcoded Windows-style path separators
fs::path bad = "C:\\Users\\Documents\\file.txt"; // may have issues on Windows

// Solution: use the / operator, which automatically handles separators
fs::path good = "C:" / "Users" / "Documents" / "file.txt";

// Or use raw string literals
fs::path also_good = R"(C:\Users\Documents\file.txt)";
```

### Symbolic Link Circular References

```cpp
// Pitfall: recursive traversal may encounter symbolic link cycles
for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    // may get stuck in infinite loop if circular symbolic links exist
}

// Solution: disable symbolic link following
for (const auto& entry : fs::recursive_directory_iterator(
    dir,
    fs::directory_options::skip_permission_denied)) {
    // process
}
```

### Performance Issues with Large Numbers of Files

```cpp
// Pitfall: querying attributes for each file separately
for (const auto& entry : fs::directory_iterator(dir)) {
    auto size = fs::file_size(entry.path()); // extra system call
    auto type = fs::is_regular_file(entry.path()); // extra system call
}

// Solution: use directory_entry's cache
for (const auto& entry : fs::directory_iterator(dir)) {
    auto size = entry.file_size(); // cached
    auto is_regular = entry.is_regular_file(); // cached
}
```

### Cross-Platform Path Issues

```cpp
// Pitfall: assuming "/" is always valid on Windows
fs::path path = "C:/Users/file.txt"; // may fail on Windows

// Solution: use the / operator or raw string literals
fs::path better = fs::path("C:") / "Users" / "file.txt";

// Or get temporary directory
fs::path temp = fs::temp_directory_path() / "file.txt";
```

### Exception Safety

```cpp
// Pitfall: partial operations may fail leaving inconsistent state
fs::remove_all(dir); // if it fails midway, directory may be partially deleted

// Solution: check return value and consider backup
auto removed = fs::remove_all(dir);
std::cout << "Deleted " << removed << " items" << std::endl;

// Or use transactional approach (backup before delete)
if (fs::exists(dir)) {
    fs::rename(dir, dir.string() + ".bak");
    // after confirming success, delete backup
    fs::remove_all(dir.string() + ".bak");
}
```

## Performance Considerations

### System Call Overhead

```cpp
// Performance issue: each call makes a system call
std::vector<fs::path> large_files;
for (const auto& entry : fs::directory_iterator(dir)) {
    if (fs::file_size(entry.path()) > 1000000) { // extra system call
        large_files.push_back(entry.path());
    }
}

// Optimization: use cached information
std::vector<fs::path> large_files;
for (const auto& entry : fs::directory_iterator(dir)) {
    if (entry.file_size() > 1000000) { // uses cache
        large_files.push_back(entry.path());
    }
}
```

### Recursive Traversal Optimization

```cpp
// Inefficient: recursive function calls
void traverse(const fs::path& dir) {
    for (const auto& entry : fs::directory_iterator(dir)) {
        if (entry.is_directory()) {
            traverse(entry.path()); // function call overhead
        }
    }
}

// Optimization: use recursive_directory_iterator
void traverse(const fs::path& dir) {
    for (const auto& entry : fs::recursive_directory_iterator(dir)) {
        // iterator internally optimized
    }
}
```

### Caching File Attributes

```cpp
struct FileInfo {
    fs::path path;
    fs::file_time_type mtime;
    uintmax_t size;
};

// Build cache
std::vector<FileInfo> cache;
for (const auto& entry : fs::directory_iterator(dir)) {
    cache.push_back({
        entry.path(),
        entry.last_write_time(),
        entry.file_size()
    });
}

// Use cache to avoid repeated queries
for (const auto& info : cache) {
    if (info.mtime > some_time && info.size > threshold) {
        // process
    }
}
```

### Performance Cost of Exceptions

```cpp
// Inefficient: frequent exceptions
for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    try {
        auto size = fs::file_size(entry.path());
    } catch (const fs::filesystem_error&) {
        // exception handling has performance overhead
    }
}

// Optimization: preventive checking
for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    if (entry.is_regular_file()) {
        auto size = entry.file_size(); // won't throw exception
    }
}
```

## Practical Scenarios

### Scenario 1: Log File Cleanup Tool

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
            std::cout << "Log directory does not exist" << std::endl;
            return;
        }

        auto now = fs::file_time_type::clock::now();
        uintmax_t total_size = 0;
        uintmax_t deleted_size = 0;
        int deleted_count = 0;

        // Collect all log files
        std::vector<fs::path> log_files;
        for (const auto& entry : fs::directory_iterator(log_dir)) {
            if (entry.is_regular_file() &&
                entry.path().extension() == ".log") {
                log_files.push_back(entry.path());
                total_size += entry.file_size();
            }
        }

        // Sort by modification time
        std::sort(log_files.begin(), log_files.end(),
                  [](const fs::path& a, const fs::path& b) {
                      return fs::last_write_time(a) <
                             fs::last_write_time(b);
                  });

        // Delete expired files
        for (const auto& file : log_files) {
            auto last_write = fs::last_write_time(file);
            auto age = now - last_write;

            if (age > std::chrono::duration_cast<fs::file_time_type::duration>(
                    retention_period)) {
                try {
                    deleted_size += fs::file_size(file);
                    fs::remove(file);
                    deleted_count++;
                    std::cout << "Deleted expired file: " << file.filename() << std::endl;
                } catch (const fs::filesystem_error& e) {
                    std::cout << "Failed to delete file: " << e.what() << std::endl;
                }
            }
        }

        // Clean up by size limit
        if (total_size - deleted_size > max_size) {
            for (const auto& file : log_files) {
                if (total_size - deleted_size <= max_size) break;

                try {
                    auto file_size = fs::file_size(file);
                    fs::remove(file);
                    deleted_size += file_size;
                    deleted_count++;
                    std::cout << "Deleted file exceeding size limit: " << file.filename() << std::endl;
                } catch (const fs::filesystem_error& e) {
                    std::cout << "Failed to delete file: " << e.what() << std::endl;
                }
            }
        }

        std::cout << "Cleanup complete: deleted " << deleted_count
                  << " files, freed " << deleted_size << " bytes" << std::endl;
    }
};

int main() {
    LogCleaner cleaner("./logs", std::chrono::hours(24 * 7), 1000000000); // 7 days or 1GB
    cleaner.cleanup();
    return 0;
}
```

### Scenario 2: File Synchronization Tool

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

        std::cout << "Scanned " << source_files.size() << " source files" << std::endl;
    }

    void sync() {
        scan_source();

        for (const auto& [rel_path, mtime] : source_files) {
            fs::path src_file = source / rel_path;
            fs::path dst_file = destination / rel_path;

            // Create destination directory
            if (!fs::exists(dst_file.parent_path())) {
                fs::create_directories(dst_file.parent_path());
            }

            // Determine if sync is needed
            bool need_sync = false;
            if (!fs::exists(dst_file)) {
                need_sync = true;
                std::cout << "New file: " << rel_path << std::endl;
            } else {
                auto dst_mtime = fs::last_write_time(dst_file);
                if (mtime > dst_mtime) {
                    need_sync = true;
                    std::cout << "Updated file: " << rel_path << std::endl;
                }
            }

            // Copy or update file
            if (need_sync) {
                try {
                    fs::copy_file(src_file, dst_file,
                                  fs::copy_options::overwrite_existing);
                } catch (const fs::filesystem_error& e) {
                    std::cout << "Copy failed: " << e.what() << std::endl;
                }
            }
        }

        std::cout << "Synchronization complete" << std::endl;
    }
};

int main() {
    FileSync sync("./source", "./backup");
    sync.sync();
    return 0;
}
```

### Scenario 3: File Search Tool

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

    // Search by name
    auto by_name = searcher.search_by_name(".", "test");
    std::cout << "Found " << by_name.size() << " files by name" << std::endl;

    // Search by regex
    std::regex pattern(R"(.*\.(cpp|h)$)");
    auto by_regex = searcher.search_by_regex(".", pattern);
    std::cout << "Found " << by_regex.size() << " source files by regex" << std::endl;

    // Search by size (files larger than 1MB)
    auto large = searcher.search_by_size(".", 1000000);
    std::cout << "Found " << large.size() << " files larger than 1MB" << std::endl;

    // Search by extension
    auto cpp_files = searcher.search_by_extension(".", "cpp");
    std::cout << "Found " << cpp_files.size() << " .cpp files" << std::endl;

    return 0;
}
```

## Interview Key Points

### Differences Between filesystem Library and Traditional C API

**C API (POSIX)**
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

Key differences:
- Type safety: `std::filesystem::path` vs `char*`
- Resource management: automatic vs manual `opendir`/`closedir`
- Cross-platform: automatic handling vs conditional compilation
- Exception safety: exceptions vs error codes

### Path Object Construction and Operations

```cpp
// Construction methods
fs::path p1("file.txt");
fs::path p2 = "file.txt";
fs::path p3 = fs::current_path() / "file.txt";

// Key operations
p1.parent_path()      // parent directory
p1.filename()         // filename
p1.stem()             // filename (without extension)
p1.extension()        // extension
p1.is_absolute()      // is absolute path
p1.lexically_normal() // normalize
```

### File Type Checking

```cpp
fs::is_regular_file(p)     // regular file
fs::is_directory(p)        // directory
fs::is_symlink(p)          // symbolic link
fs::is_block_file(p)       // block device
fs::is_character_file(p)   // character device
fs::is_fifo(p)             // FIFO/named pipe
fs::is_socket(p)           // Unix socket
```

### Efficiency of directory_iterator

Q: Why is `directory_iterator` faster than multiple calls to `fs::file_size()`?

A: The `directory_entry` returned by `directory_iterator` caches file attribute information. A single `readdir()` call returns information for multiple entries, avoiding multiple system calls.

### Exceptions vs Error Codes

```cpp
// Exception method: throws exception on failure
auto size = fs::file_size("file.txt"); // throws filesystem_error

// Error code method: returns error code
std::error_code ec;
auto size = fs::file_size("file.txt", ec); // no exception, error in ec
```

### Permission Management

```cpp
fs::perms p = fs::status(file).permissions();

// Permission bits
fs::perms::owner_read      // owner read
fs::perms::owner_write     // owner write
fs::perms::owner_exec      // owner execute
fs::perms::group_read      // group read
fs::perms::group_write     // group write
// ...

// Permission operations
fs::permissions(file, fs::perms::owner_read, fs::perm_options::replace);
```

### Symbolic Link Pitfalls

Q: What's the relationship between `fs::exists()` and `fs::is_symlink()`?

A:
- `fs::exists(symlink_to_missing_file)` returns `false` (checks target)
- `fs::is_symlink(symlink_to_missing_file)` returns `true` (checks the symbolic link itself)

### Depth Control in Recursive Traversal

```cpp
for (const auto& entry : fs::recursive_directory_iterator(".")) {
    if (entry.depth() > 3) {
        entry.disable_recursion_pending(); // don't enter deeper directories
    }
}
```

### Relative and Absolute Paths

```cpp
fs::path rel("folder/file.txt");
fs::path abs = fs::absolute(rel);           // relative to absolute (based on current directory)
fs::path canonical = fs::canonical(abs);    // normalize and resolve symbolic links
fs::path relative = fs::relative(abs);      // convert to relative path
```

## Further Reading

### Related Standard Library Components

1. **`<chrono>`** - File timestamp handling
   - `fs::last_write_time()` returns `fs::file_time_type`
   - Needs conversion to `std::chrono::system_clock::time_point`

2. **`<system_error>`** - Error handling
   - `std::filesystem_error` inherits from `std::system_error`
   - `std::error_code` for exception-free operations

3. **`<fstream>`** - File I/O
   - Works with the `filesystem` library to open and manipulate files

### Common Libraries and Frameworks

1. **Boost.Filesystem** - Alternative before C++17
2. **ghc::filesystem** - Lightweight cross-platform implementation
3. **fmt library** - More elegant path output formatting

### Advanced Learning Topics

1. **Filesystem permission models** - Unix/Windows permission differences
2. **Symbolic links and hard links** - Underlying mechanisms
3. **Filesystem feature detection** - Support for large files, long filenames, permissions, etc.
4. **POSIX standard** - Foundation of C++17 filesystem
5. **Windows filesystem API** - Understanding the underlying implementation

### Reference Resources

- C++ Standard Documentation: [cppreference.com - std::filesystem](https://en.cppreference.com/w/cpp/filesystem)
- ISO/IEC 14882:2017 Standard, Section 30.10 Filesystem Library
- Filesystem TS (Technical Specification) - Evolution of the standard
