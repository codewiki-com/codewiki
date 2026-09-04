---
title: CMake构建系统
description: CMake完全指南，现代C++项目构建与跨平台编译
track: cpp
section: tooling
difficulty: intermediate
tags:
  - C++
  - CMake
  - 构建系统
  - 跨平台
status: imported
origin: old/src/content/docs/cpp/cmake.zh.md
divergence: 0.236
issues: []
legacy:
  category: Cpp
  subcategory: 工具链
  order: 11
  lastUpdated: 2026-01-07
---

CMake是一个开源的跨平台构建系统生成器。它不直接构建项目，而是生成原生构建系统（如Makefile、Ninja、Visual Studio项目文件等），然后由这些构建系统完成实际的编译工作。CMake已经成为现代C++项目的事实标准构建工具。

## 为什么选择CMake

### 跨平台支持

CMake的核心优势在于其跨平台能力：

- **Windows**: 生成Visual Studio解决方案、NMake Makefile
- **Linux**: 生成Unix Makefile、Ninja构建文件
- **macOS**: 生成Xcode项目、Unix Makefile
- **嵌入式平台**: 支持交叉编译

### 现代C++生态集成

CMake与现代C++工具链无缝集成：

- 包管理器（vcpkg、Conan）
- IDE支持（CLion、VS Code、Visual Studio）
- 持续集成系统（GitHub Actions、GitLab CI）

## CMake基础

### 安装CMake

```bash
# Ubuntu/Debian
sudo apt install cmake

# macOS (Homebrew)
brew install cmake

# Windows (winget)
winget install Kitware.CMake

# 验证安装
cmake --version
```

### 最小CMakeLists.txt

每个CMake项目的根目录都需要一个`CMakeLists.txt`文件：

```cmake
# 指定CMake最低版本要求
cmake_minimum_required(VERSION 3.20)

# 定义项目名称和版本
project(MyProject VERSION 1.0.0 LANGUAGES CXX)

# 设置C++标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 添加可执行文件目标
add_executable(myapp main.cpp)
```

### 构建流程

CMake采用"配置-生成-构建"的三步流程：

```bash
# 创建构建目录（推荐外部构建）
mkdir build && cd build

# 配置项目（生成构建系统）
cmake ..

# 构建项目
cmake --build .

# 或者使用Ninja生成器（更快）
cmake -G Ninja ..
cmake --build .
```

### 常用构建类型

```bash
# Debug构建（包含调试信息）
cmake -DCMAKE_BUILD_TYPE=Debug ..

# Release构建（优化代码）
cmake -DCMAKE_BUILD_TYPE=Release ..

# RelWithDebInfo（优化+调试信息）
cmake -DCMAKE_BUILD_TYPE=RelWithDebInfo ..

# MinSizeRel（最小体积）
cmake -DCMAKE_BUILD_TYPE=MinSizeRel ..
```

## 目标（Targets）

CMake的核心概念是"目标"。目标可以是可执行文件、库或自定义命令。

### 可执行文件目标

```cmake
# 基本可执行文件
add_executable(myapp main.cpp)

# 多源文件
add_executable(myapp
    main.cpp
    utils.cpp
    config.cpp
)

# 使用变量管理源文件
set(SOURCES
    src/main.cpp
    src/utils.cpp
    src/config.cpp
)
add_executable(myapp ${SOURCES})
```

### 库目标

```cmake
# 静态库
add_library(mylib STATIC
    src/mylib.cpp
    src/helper.cpp
)

# 动态库（共享库）
add_library(mylib SHARED
    src/mylib.cpp
    src/helper.cpp
)

# 接口库（仅头文件库）
add_library(mylib INTERFACE)

# 对象库（编译但不链接）
add_library(mylib OBJECT
    src/mylib.cpp
)
```

### 目标属性

```cmake
# 设置目标属性
set_target_properties(myapp PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    OUTPUT_NAME "my_application"
    VERSION 1.0.0
)

# 单独设置属性
set_property(TARGET myapp PROPERTY CXX_STANDARD 20)

# 获取目标属性
get_target_property(APP_STD myapp CXX_STANDARD)
message(STATUS "C++ Standard: ${APP_STD}")
```

## 包含目录与链接

### 包含目录

```cmake
# 为目标添加包含目录
target_include_directories(mylib
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)
```

**作用域说明**：

- `PUBLIC`: 当前目标和依赖它的目标都能使用
- `PRIVATE`: 仅当前目标使用
- `INTERFACE`: 仅依赖当前目标的其他目标使用

### 链接库

```cmake
# 链接其他目标
target_link_libraries(myapp
    PRIVATE
        mylib
        otherlib
)

# 链接系统库
target_link_libraries(myapp
    PRIVATE
        pthread
        dl
)
```

### 完整示例：项目结构

```
my_project/
├── CMakeLists.txt
├── include/
│   └── mylib/
│       └── mylib.h
├── src/
│   ├── mylib.cpp
│   └── main.cpp
└── tests/
    └── test_mylib.cpp
```

```cmake
# 根CMakeLists.txt
cmake_minimum_required(VERSION 3.20)
project(MyProject VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 创建库
add_library(mylib
    src/mylib.cpp
)

target_include_directories(mylib
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
)

# 创建可执行文件
add_executable(myapp src/main.cpp)
target_link_libraries(myapp PRIVATE mylib)
```

## 依赖管理

### find_package

`find_package`是CMake查找外部依赖的主要方式：

```cmake
# 查找必需的包
find_package(OpenSSL REQUIRED)

# 查找可选的包
find_package(Boost COMPONENTS filesystem system)

# 检查是否找到
if(Boost_FOUND)
    message(STATUS "Boost found: ${Boost_VERSION}")
    target_link_libraries(myapp PRIVATE Boost::filesystem)
endif()
```

### 常见包的使用

```cmake
# OpenSSL
find_package(OpenSSL REQUIRED)
target_link_libraries(myapp PRIVATE OpenSSL::SSL OpenSSL::Crypto)

# Threads
find_package(Threads REQUIRED)
target_link_libraries(myapp PRIVATE Threads::Threads)

# fmt库
find_package(fmt REQUIRED)
target_link_libraries(myapp PRIVATE fmt::fmt)

# nlohmann_json
find_package(nlohmann_json REQUIRED)
target_link_libraries(myapp PRIVATE nlohmann_json::nlohmann_json)

# spdlog
find_package(spdlog REQUIRED)
target_link_libraries(myapp PRIVATE spdlog::spdlog)
```

### FetchContent

CMake 3.11+提供了`FetchContent`模块，可以在配置时下载依赖：

```cmake
include(FetchContent)

# 声明依赖
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)

FetchContent_Declare(
    fmt
    GIT_REPOSITORY https://github.com/fmtlib/fmt.git
    GIT_TAG 10.1.1
)

# 获取并使用
FetchContent_MakeAvailable(googletest fmt)

# 现在可以直接链接
target_link_libraries(myapp PRIVATE fmt::fmt)
```

### 自定义Find模块

对于没有CMake支持的库，可以编写自定义Find模块：

```cmake
# cmake/FindMyLib.cmake
find_path(MYLIB_INCLUDE_DIR
    NAMES mylib.h
    PATHS /usr/local/include /opt/mylib/include
)

find_library(MYLIB_LIBRARY
    NAMES mylib
    PATHS /usr/local/lib /opt/mylib/lib
)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(MyLib
    REQUIRED_VARS MYLIB_LIBRARY MYLIB_INCLUDE_DIR
)

if(MyLib_FOUND AND NOT TARGET MyLib::MyLib)
    add_library(MyLib::MyLib UNKNOWN IMPORTED)
    set_target_properties(MyLib::MyLib PROPERTIES
        IMPORTED_LOCATION "${MYLIB_LIBRARY}"
        INTERFACE_INCLUDE_DIRECTORIES "${MYLIB_INCLUDE_DIR}"
    )
endif()
```

使用自定义模块：

```cmake
# 添加模块搜索路径
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

find_package(MyLib REQUIRED)
target_link_libraries(myapp PRIVATE MyLib::MyLib)
```

## 编译选项与定义

### 编译选项

```cmake
# 为目标添加编译选项
target_compile_options(myapp
    PRIVATE
        -Wall
        -Wextra
        -Wpedantic
        $<$<CONFIG:Debug>:-g -O0>
        $<$<CONFIG:Release>:-O3>
)

# 跨平台编译选项
target_compile_options(myapp PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)
```

### 预处理器定义

```cmake
# 添加预处理器定义
target_compile_definitions(myapp
    PRIVATE
        APP_VERSION="${PROJECT_VERSION}"
        $<$<CONFIG:Debug>:DEBUG_MODE>
        $<$<BOOL:${ENABLE_FEATURE}>:FEATURE_ENABLED>
)
```

### 生成器表达式

生成器表达式在构建时求值，提供条件配置能力：

```cmake
# 条件包含目录
target_include_directories(mylib
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
)

# 条件链接
target_link_libraries(myapp
    PRIVATE
        $<$<PLATFORM_ID:Linux>:pthread>
        $<$<PLATFORM_ID:Windows>:ws2_32>
)

# 配置相关选项
target_compile_options(myapp PRIVATE
    $<$<CONFIG:Debug>:-fsanitize=address>
)
```

常用生成器表达式：

| 表达式 | 说明 |
|--------|------|
| `$<CONFIG:cfg>` | 当前配置是否为cfg |
| `$<PLATFORM_ID:id>` | 当前平台是否为id |
| `$<CXX_COMPILER_ID:id>` | 编译器是否为id |
| `$<TARGET_FILE:tgt>` | 目标的完整路径 |
| `$<TARGET_PROPERTY:tgt,prop>` | 获取目标属性 |

## 子目录与模块化

### 子目录

对于大型项目，使用子目录组织代码：

```
project/
├── CMakeLists.txt
├── lib/
│   ├── CMakeLists.txt
│   └── ...
├── app/
│   ├── CMakeLists.txt
│   └── ...
└── tests/
    ├── CMakeLists.txt
    └── ...
```

```cmake
# 根CMakeLists.txt
cmake_minimum_required(VERSION 3.20)
project(MyProject VERSION 1.0.0)

# 添加子目录
add_subdirectory(lib)
add_subdirectory(app)

# 可选的测试
option(BUILD_TESTS "Build tests" ON)
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()
```

```cmake
# lib/CMakeLists.txt
add_library(mylib
    src/mylib.cpp
)

target_include_directories(mylib
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)
```

```cmake
# app/CMakeLists.txt
add_executable(myapp main.cpp)
target_link_libraries(myapp PRIVATE mylib)
```

### 接口库

接口库适合仅头文件的库或配置集合：

```cmake
# 仅头文件库
add_library(header_only INTERFACE)
target_include_directories(header_only
    INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)
target_compile_features(header_only INTERFACE cxx_std_17)

# 配置集合
add_library(common_settings INTERFACE)
target_compile_options(common_settings INTERFACE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)
target_compile_definitions(common_settings INTERFACE
    $<$<CONFIG:Debug>:DEBUG>
)

# 应用配置
target_link_libraries(myapp PRIVATE common_settings)
```

## 选项与缓存变量

### 用户选项

```cmake
# 布尔选项
option(BUILD_SHARED_LIBS "Build shared libraries" ON)
option(ENABLE_TESTS "Enable testing" ON)
option(ENABLE_DOCS "Build documentation" OFF)

# 使用选项
if(ENABLE_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()
```

### 缓存变量

```cmake
# 设置缓存变量
set(MY_OPTION "default" CACHE STRING "Description of option")
set(MY_PATH "/usr/local" CACHE PATH "Installation path")
set(MY_FLAG OFF CACHE BOOL "Enable feature")

# 带选项列表的变量
set(LOG_LEVEL "INFO" CACHE STRING "Logging level")
set_property(CACHE LOG_LEVEL PROPERTY STRINGS
    "DEBUG" "INFO" "WARNING" "ERROR"
)
```

### 条件逻辑

```cmake
# if-else语句
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    message(STATUS "Debug build")
elseif(CMAKE_BUILD_TYPE STREQUAL "Release")
    message(STATUS "Release build")
else()
    message(STATUS "Other build type")
endif()

# 逻辑运算
if(UNIX AND NOT APPLE)
    message(STATUS "Linux")
endif()

if(MSVC OR MINGW)
    message(STATUS "Windows compiler")
endif()

# 变量检查
if(DEFINED MY_VAR)
    message(STATUS "MY_VAR is defined")
endif()

if(TARGET mylib)
    message(STATUS "mylib target exists")
endif()
```

## 安装与导出

### 安装规则

```cmake
# 安装可执行文件
install(TARGETS myapp
    RUNTIME DESTINATION bin
)

# 安装库
install(TARGETS mylib
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)

# 安装头文件
install(DIRECTORY include/
    DESTINATION include
)

# 安装单个文件
install(FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/config.txt
    DESTINATION etc/myapp
)

# 安装带权限的文件
install(FILES scripts/run.sh
    DESTINATION bin
    PERMISSIONS OWNER_EXECUTE OWNER_READ GROUP_EXECUTE GROUP_READ
)
```

### 导出目标

让其他项目能通过`find_package`使用你的库：

```cmake
# 安装并导出目标
install(TARGETS mylib
    EXPORT MyLibTargets
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
    INCLUDES DESTINATION include
)

# 安装导出文件
install(EXPORT MyLibTargets
    FILE MyLibTargets.cmake
    NAMESPACE MyLib::
    DESTINATION lib/cmake/MyLib
)

# 创建配置文件
include(CMakePackageConfigHelpers)

configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/MyLibConfig.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/MyLibConfig.cmake
    INSTALL_DESTINATION lib/cmake/MyLib
)

write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/MyLibConfigVersion.cmake
    VERSION ${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/MyLibConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/MyLibConfigVersion.cmake
    DESTINATION lib/cmake/MyLib
)
```

配置模板文件 `cmake/MyLibConfig.cmake.in`：

```cmake
@PACKAGE_INIT@

include("${CMAKE_CURRENT_LIST_DIR}/MyLibTargets.cmake")

check_required_components(MyLib)
```

### 使用安装的包

```cmake
find_package(MyLib 1.0 REQUIRED)
target_link_libraries(myapp PRIVATE MyLib::mylib)
```

## CTest测试

### 基本测试

```cmake
# 启用测试
enable_testing()

# 添加测试
add_executable(test_mylib tests/test_mylib.cpp)
target_link_libraries(test_mylib PRIVATE mylib)

add_test(NAME TestMyLib COMMAND test_mylib)
```

### 使用Google Test

```cmake
include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)
FetchContent_MakeAvailable(googletest)

enable_testing()
include(GoogleTest)

add_executable(test_mylib
    tests/test_mylib.cpp
    tests/test_utils.cpp
)

target_link_libraries(test_mylib
    PRIVATE
        mylib
        GTest::gtest_main
)

# 自动发现测试
gtest_discover_tests(test_mylib)
```

### 测试属性

```cmake
add_test(NAME SlowTest COMMAND slow_test)
set_tests_properties(SlowTest PROPERTIES
    TIMEOUT 300
    LABELS "slow"
)

add_test(NAME MemoryTest COMMAND memory_test)
set_tests_properties(MemoryTest PROPERTIES
    ENVIRONMENT "MALLOC_CHECK_=3"
)

# 预期失败的测试
add_test(NAME ExpectedFail COMMAND will_fail)
set_tests_properties(ExpectedFail PROPERTIES
    WILL_FAIL TRUE
)
```

### 运行测试

```bash
# 运行所有测试
ctest

# 详细输出
ctest -V

# 并行测试
ctest -j4

# 运行特定标签的测试
ctest -L slow

# 运行名称匹配的测试
ctest -R "Unit.*"

# 失败时显示输出
ctest --output-on-failure
```

## 自定义命令与目标

### 自定义命令

```cmake
# 生成文件的自定义命令
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/generated.cpp
    COMMAND python3 ${CMAKE_CURRENT_SOURCE_DIR}/generate.py
            -o ${CMAKE_CURRENT_BINARY_DIR}/generated.cpp
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/generate.py
    COMMENT "Generating source file"
)

# 使用生成的文件
add_executable(myapp
    main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/generated.cpp
)

# 构建后命令
add_custom_command(
    TARGET myapp POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
            $<TARGET_FILE:myapp>
            ${CMAKE_CURRENT_SOURCE_DIR}/bin/
    COMMENT "Copying executable to bin/"
)
```

### 自定义目标

```cmake
# 自定义目标（总是执行）
add_custom_target(format
    COMMAND clang-format -i ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp
    COMMAND clang-format -i ${CMAKE_CURRENT_SOURCE_DIR}/include/*.h
    COMMENT "Formatting source files"
)

# 带依赖的自定义目标
add_custom_target(docs
    COMMAND doxygen ${CMAKE_CURRENT_SOURCE_DIR}/Doxyfile
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Generating documentation"
)

# 添加依赖关系
add_dependencies(docs generate_config)
```

## 实战示例：完整项目

### 项目结构

```
calculator/
├── CMakeLists.txt
├── cmake/
│   └── CalculatorConfig.cmake.in
├── include/
│   └── calculator/
│       ├── calculator.h
│       └── operations.h
├── src/
│   ├── calculator.cpp
│   └── operations.cpp
├── app/
│   └── main.cpp
└── tests/
    ├── CMakeLists.txt
    └── test_calculator.cpp
```

### 根CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.20)

project(Calculator
    VERSION 1.0.0
    DESCRIPTION "A simple calculator library"
    LANGUAGES CXX
)

# 设置C++标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 选项
option(BUILD_SHARED_LIBS "Build shared libraries" ON)
option(BUILD_TESTS "Build tests" ON)
option(BUILD_EXAMPLES "Build examples" ON)

# 默认构建类型
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

# 库
add_library(calculator
    src/calculator.cpp
    src/operations.cpp
)

target_include_directories(calculator
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
)

target_compile_options(calculator PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)

# 版本信息
set_target_properties(calculator PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION ${PROJECT_VERSION_MAJOR}
)

# 示例应用
if(BUILD_EXAMPLES)
    add_executable(calc_app app/main.cpp)
    target_link_libraries(calc_app PRIVATE calculator)
endif()

# 测试
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# 安装
include(GNUInstallDirs)

install(TARGETS calculator
    EXPORT CalculatorTargets
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

install(DIRECTORY include/
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

# 导出配置
install(EXPORT CalculatorTargets
    FILE CalculatorTargets.cmake
    NAMESPACE Calculator::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/Calculator
)

include(CMakePackageConfigHelpers)

configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/CalculatorConfig.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfig.cmake
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/Calculator
)

write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfigVersion.cmake
    VERSION ${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfigVersion.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/Calculator
)
```

### tests/CMakeLists.txt

```cmake
include(FetchContent)

FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)

# Windows: 防止覆盖父项目的编译器/链接器设置
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

FetchContent_MakeAvailable(googletest)

include(GoogleTest)

add_executable(test_calculator
    test_calculator.cpp
)

target_link_libraries(test_calculator
    PRIVATE
        calculator
        GTest::gtest_main
)

gtest_discover_tests(test_calculator)
```

### cmake/CalculatorConfig.cmake.in

```cmake
@PACKAGE_INIT@

include("${CMAKE_CURRENT_LIST_DIR}/CalculatorTargets.cmake")

check_required_components(Calculator)
```

## CMake预设

CMake 3.19+支持预设配置，简化构建选项管理。

### CMakePresets.json

```json
{
    "version": 6,
    "cmakeMinimumRequired": {
        "major": 3,
        "minor": 20,
        "patch": 0
    },
    "configurePresets": [
        {
            "name": "base",
            "hidden": true,
            "binaryDir": "${sourceDir}/build/${presetName}",
            "cacheVariables": {
                "CMAKE_CXX_STANDARD": "17"
            }
        },
        {
            "name": "debug",
            "inherits": "base",
            "displayName": "Debug",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "BUILD_TESTS": "ON"
            }
        },
        {
            "name": "release",
            "inherits": "base",
            "displayName": "Release",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Release",
                "BUILD_TESTS": "OFF"
            }
        },
        {
            "name": "ci",
            "inherits": "debug",
            "displayName": "CI Build",
            "cacheVariables": {
                "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
            }
        }
    ],
    "buildPresets": [
        {
            "name": "debug",
            "configurePreset": "debug"
        },
        {
            "name": "release",
            "configurePreset": "release"
        }
    ],
    "testPresets": [
        {
            "name": "debug",
            "configurePreset": "debug",
            "output": {
                "outputOnFailure": true
            }
        }
    ]
}
```

### 使用预设

```bash
# 列出可用预设
cmake --list-presets

# 使用预设配置
cmake --preset debug

# 使用预设构建
cmake --build --preset debug

# 使用预设测试
ctest --preset debug
```

## 常见问题与最佳实践

### 避免的做法

```cmake
# 不要使用全局包含目录
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)  # 避免

# 应该使用target_include_directories
target_include_directories(mylib PUBLIC include)  # 推荐

# 不要使用file(GLOB)获取源文件
file(GLOB SOURCES "src/*.cpp")  # 避免

# 应该显式列出源文件
set(SOURCES src/main.cpp src/utils.cpp)  # 推荐

# 不要使用add_definitions
add_definitions(-DDEBUG)  # 避免

# 应该使用target_compile_definitions
target_compile_definitions(myapp PRIVATE DEBUG)  # 推荐
```

### 最佳实践

```cmake
# 使用现代CMake（3.0+目标为中心的方式）
target_include_directories(mylib PUBLIC include)
target_link_libraries(myapp PRIVATE mylib)

# 使用命名空间别名
add_library(MyProject::mylib ALIAS mylib)

# 使用生成器表达式处理构建/安装差异
target_include_directories(mylib PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# 设置合理的默认值
if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

# 使用GNUInstallDirs标准化安装路径
include(GNUInstallDirs)
install(TARGETS mylib
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
)

# 导出编译命令供工具使用
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
```

### 调试CMake

```cmake
# 打印变量
message(STATUS "CMAKE_CXX_COMPILER: ${CMAKE_CXX_COMPILER}")
message(STATUS "PROJECT_SOURCE_DIR: ${PROJECT_SOURCE_DIR}")

# 打印目标属性
get_target_property(LIBS myapp LINK_LIBRARIES)
message(STATUS "myapp links: ${LIBS}")

# 打印所有变量
get_cmake_property(_vars VARIABLES)
foreach(_var ${_vars})
    message(STATUS "${_var}=${${_var}}")
endforeach()
```

```bash
# 详细构建输出
cmake --build . --verbose

# 调试find_package
cmake -DCMAKE_FIND_DEBUG_MODE=ON ..

# 跟踪变量
cmake --trace-expand ..
```

## 总结

CMake是现代C++项目不可或缺的构建工具。本文涵盖了从基础到进阶的核心概念：

1. **基础配置**: CMakeLists.txt结构、项目定义、C++标准设置
2. **目标管理**: 可执行文件、静态库、动态库、接口库
3. **依赖处理**: find_package、FetchContent、自定义Find模块
4. **编译控制**: 编译选项、预处理器定义、生成器表达式
5. **项目组织**: 子目录、模块化设计
6. **安装导出**: 安装规则、包导出、供其他项目使用
7. **测试集成**: CTest、Google Test集成
8. **高级特性**: 自定义命令、预设配置

掌握CMake不仅能提升开发效率，还能让你的项目更易于维护、分发和跨平台部署。建议在实践中逐步应用这些概念，从简单项目开始，逐渐过渡到更复杂的构建需求。
