---
title: CMake Build System
description: Complete guide to CMake, modern C++ project building and cross-platform compilation
track: cpp
section: tooling
difficulty: intermediate
tags:
  - C++
  - CMake
  - Build System
  - Cross-platform
status: imported
origin: old/src/content/docs/cpp/cmake.en.md
divergence: 0.236
issues: []
legacy:
  category: Cpp
  subcategory: Toolchain
  order: 11
  lastUpdated: 2026-01-07
---

CMake is a cross-platform, open-source build system generator that has become the de facto standard for C++ projects. Rather than building your project directly, CMake generates native build files for your platform, whether that's Makefiles on Linux, Visual Studio projects on Windows, or Xcode projects on macOS.

## Why CMake?

Before diving into the technical details, let's understand why CMake has become so widely adopted:

- **Cross-platform compatibility**: Write your build configuration once and generate builds for any platform
- **IDE integration**: Most modern IDEs (CLion, Visual Studio, VS Code) natively support CMake
- **Ecosystem support**: Most C++ libraries provide CMake configurations
- **Modern features**: Support for C++ modules, package management integration, and more
- **Scalability**: Works equally well for small projects and massive codebases

## Getting Started

### Installation

On most systems, CMake can be installed via the package manager:

```bash
# Ubuntu/Debian
sudo apt install cmake

# macOS with Homebrew
brew install cmake

# Windows with Chocolatey
choco install cmake

# Or download from https://cmake.org/download/
```

Verify your installation:

```bash
cmake --version
```

### Your First CMake Project

Let's create a minimal C++ project with CMake. Create the following directory structure:

```
my_project/
├── CMakeLists.txt
└── src/
    └── main.cpp
```

**src/main.cpp**:
```cpp
#include <iostream>

int main() {
    std::cout << "Hello, CMake!" << std::endl;
    return 0;
}
```

**CMakeLists.txt**:
```cmake
cmake_minimum_required(VERSION 3.16)
project(MyProject VERSION 1.0.0 LANGUAGES CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Create executable
add_executable(my_app src/main.cpp)
```

### Building the Project

CMake uses an out-of-source build approach, keeping build files separate from source code:

```bash
# Create and enter build directory
mkdir build && cd build

# Generate build files
cmake ..

# Build the project
cmake --build .

# Run the executable
./my_app
```

## Understanding CMakeLists.txt

The `CMakeLists.txt` file is the heart of your CMake configuration. Let's break down its components.

### Essential Commands

```cmake
# Minimum CMake version required
cmake_minimum_required(VERSION 3.16)

# Project definition with metadata
project(MyProject
    VERSION 1.0.0
    DESCRIPTION "A sample C++ project"
    LANGUAGES CXX
)

# Variables can be set and accessed
set(MY_VARIABLE "some_value")
message(STATUS "Variable value: ${MY_VARIABLE}")

# Conditional logic
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    message(STATUS "Building in Debug mode")
endif()
```

### Setting C++ Standards

There are multiple ways to specify the C++ standard:

```cmake
# Method 1: Global setting (applies to all targets)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)  # Disable compiler-specific extensions

# Method 2: Per-target setting (preferred for libraries)
target_compile_features(my_target PUBLIC cxx_std_20)
```

### Compiler Flags

```cmake
# Add compile options globally
add_compile_options(-Wall -Wextra -Wpedantic)

# Or per-target (preferred)
target_compile_options(my_target PRIVATE
    -Wall
    -Wextra
    -Wpedantic
    $<$<CONFIG:Debug>:-g -O0>
    $<$<CONFIG:Release>:-O3>
)
```

## Working with Targets

Targets are the fundamental units in CMake. They can be executables, libraries, or custom commands.

### Executables

```cmake
# Basic executable
add_executable(my_app src/main.cpp)

# Executable with multiple source files
add_executable(my_app
    src/main.cpp
    src/utils.cpp
    src/config.cpp
)

# Using file globbing (use with caution)
file(GLOB_RECURSE SOURCES "src/*.cpp")
add_executable(my_app ${SOURCES})
```

### Libraries

CMake supports several library types:

```cmake
# Static library (.a on Linux, .lib on Windows)
add_library(my_lib STATIC
    src/library.cpp
    src/helper.cpp
)

# Shared library (.so on Linux, .dll on Windows)
add_library(my_shared_lib SHARED
    src/library.cpp
)

# Header-only library (interface library)
add_library(my_header_lib INTERFACE)
target_include_directories(my_header_lib INTERFACE include/)

# Object library (compile once, link multiple times)
add_library(my_objects OBJECT
    src/common.cpp
)
```

### Target Properties

Use `target_*` commands to set properties on targets:

```cmake
add_library(my_lib STATIC src/library.cpp)

# Include directories
target_include_directories(my_lib
    PUBLIC include/           # Available to this target and dependents
    PRIVATE src/internal/     # Only available to this target
)

# Preprocessor definitions
target_compile_definitions(my_lib
    PUBLIC MY_LIB_EXPORTS
    PRIVATE INTERNAL_DEBUG
)

# Link libraries
target_link_libraries(my_lib
    PUBLIC some_dependency
    PRIVATE internal_lib
)
```

### Understanding PUBLIC, PRIVATE, and INTERFACE

These keywords control how properties propagate:

- **PRIVATE**: Only affects the current target
- **PUBLIC**: Affects both the current target and any target that links to it
- **INTERFACE**: Only affects targets that link to this target (not the target itself)

```cmake
add_library(math_lib STATIC src/math.cpp)

# Include paths:
# - 'include/' is PUBLIC: both math_lib and its consumers can use it
# - 'src/' is PRIVATE: only math_lib can use it
target_include_directories(math_lib
    PUBLIC include/
    PRIVATE src/
)

add_executable(calculator src/main.cpp)
target_link_libraries(calculator PRIVATE math_lib)
# calculator automatically gets access to math_lib's PUBLIC include directories
```

## Managing Dependencies

### Finding System Packages with find_package

The `find_package` command locates and configures external dependencies:

```cmake
# Find required package
find_package(OpenSSL REQUIRED)

# Find optional package
find_package(Boost 1.70 COMPONENTS filesystem system)
if(Boost_FOUND)
    message(STATUS "Boost found: ${Boost_VERSION}")
endif()

# Use the found package
add_executable(secure_app src/main.cpp)
target_link_libraries(secure_app PRIVATE OpenSSL::SSL OpenSSL::Crypto)
```

### Common Packages and Their Usage

```cmake
# Threads
find_package(Threads REQUIRED)
target_link_libraries(my_app PRIVATE Threads::Threads)

# CURL
find_package(CURL REQUIRED)
target_link_libraries(my_app PRIVATE CURL::libcurl)

# nlohmann_json
find_package(nlohmann_json REQUIRED)
target_link_libraries(my_app PRIVATE nlohmann_json::nlohmann_json)

# fmt
find_package(fmt REQUIRED)
target_link_libraries(my_app PRIVATE fmt::fmt)

# spdlog
find_package(spdlog REQUIRED)
target_link_libraries(my_app PRIVATE spdlog::spdlog)
```

### FetchContent: Downloading Dependencies

CMake 3.11+ provides `FetchContent` for downloading dependencies at configure time:

```cmake
include(FetchContent)

# Declare dependencies
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)

FetchContent_Declare(
    fmt
    GIT_REPOSITORY https://github.com/fmtlib/fmt.git
    GIT_TAG 10.2.1
)

# Make available (downloads and configures)
FetchContent_MakeAvailable(googletest fmt)

# Use the fetched libraries
add_executable(my_app src/main.cpp)
target_link_libraries(my_app PRIVATE fmt::fmt)
```

### Adding Subdirectories

For local dependencies or project structure:

```cmake
# Project structure:
# my_project/
# ├── CMakeLists.txt
# ├── src/
# ├── libs/
# │   └── my_lib/
# │       ├── CMakeLists.txt
# │       └── src/

# Root CMakeLists.txt
add_subdirectory(libs/my_lib)
add_executable(my_app src/main.cpp)
target_link_libraries(my_app PRIVATE my_lib)
```

## A Complete Project Example

Let's build a more realistic project structure:

```
calculator/
├── CMakeLists.txt
├── cmake/
│   └── CompilerWarnings.cmake
├── include/
│   └── calculator/
│       ├── calculator.hpp
│       └── operations.hpp
├── src/
│   ├── CMakeLists.txt
│   ├── calculator.cpp
│   ├── operations.cpp
│   └── main.cpp
├── tests/
│   ├── CMakeLists.txt
│   └── test_calculator.cpp
└── apps/
    ├── CMakeLists.txt
    └── cli.cpp
```

**Root CMakeLists.txt**:
```cmake
cmake_minimum_required(VERSION 3.16)
project(Calculator
    VERSION 2.0.0
    DESCRIPTION "A modular calculator library"
    LANGUAGES CXX
)

# Only set standards if this is the main project
if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME)
    set(CMAKE_CXX_STANDARD 17)
    set(CMAKE_CXX_STANDARD_REQUIRED ON)
    set(CMAKE_CXX_EXTENSIONS OFF)

    # Enable folder organization in IDEs
    set_property(GLOBAL PROPERTY USE_FOLDERS ON)

    # Enable testing
    include(CTest)
endif()

# Include custom modules
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake")
include(CompilerWarnings)

# Add subdirectories
add_subdirectory(src)
add_subdirectory(apps)

# Only build tests if this is the main project and testing is enabled
if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME AND BUILD_TESTING)
    add_subdirectory(tests)
endif()
```

**cmake/CompilerWarnings.cmake**:
```cmake
function(set_project_warnings target_name)
    set(MSVC_WARNINGS
        /W4
        /w14640  # thread unsafe static member initialization
        /permissive-
    )

    set(CLANG_WARNINGS
        -Wall
        -Wextra
        -Wpedantic
        -Wshadow
        -Wnon-virtual-dtor
        -Wold-style-cast
        -Wcast-align
        -Wunused
        -Woverloaded-virtual
        -Wconversion
        -Wsign-conversion
        -Wnull-dereference
    )

    set(GCC_WARNINGS
        ${CLANG_WARNINGS}
        -Wmisleading-indentation
        -Wduplicated-cond
        -Wduplicated-branches
        -Wlogical-op
    )

    if(MSVC)
        set(PROJECT_WARNINGS ${MSVC_WARNINGS})
    elseif(CMAKE_CXX_COMPILER_ID MATCHES ".*Clang")
        set(PROJECT_WARNINGS ${CLANG_WARNINGS})
    elseif(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
        set(PROJECT_WARNINGS ${GCC_WARNINGS})
    endif()

    target_compile_options(${target_name} PRIVATE ${PROJECT_WARNINGS})
endfunction()
```

**src/CMakeLists.txt**:
```cmake
# Create the library
add_library(calculator_lib
    calculator.cpp
    operations.cpp
)

# Add include directories
target_include_directories(calculator_lib
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
)

# Apply compiler warnings
set_project_warnings(calculator_lib)

# Create an alias for use with FetchContent
add_library(Calculator::calculator ALIAS calculator_lib)
```

**apps/CMakeLists.txt**:
```cmake
add_executable(calc_cli cli.cpp)
target_link_libraries(calc_cli PRIVATE calculator_lib)
set_project_warnings(calc_cli)
```

**tests/CMakeLists.txt**:
```cmake
include(FetchContent)

FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)

# Prevent GoogleTest from overriding compiler/linker options
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Create test executable
add_executable(calculator_tests
    test_calculator.cpp
)

target_link_libraries(calculator_tests
    PRIVATE
        calculator_lib
        GTest::gtest_main
)

# Register tests with CTest
include(GoogleTest)
gtest_discover_tests(calculator_tests)
```

## Testing with CTest

CTest is CMake's testing framework that integrates seamlessly with your build.

### Basic Test Configuration

```cmake
# Enable testing (usually in root CMakeLists.txt)
enable_testing()

# Or use include(CTest) for more features like CDash integration
include(CTest)

# Add a simple test
add_test(
    NAME my_test
    COMMAND my_test_executable --arg1 value1
)

# Set test properties
set_tests_properties(my_test PROPERTIES
    TIMEOUT 30
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
```

### Running Tests

```bash
# Build and run all tests
cd build
cmake --build .
ctest

# Run with verbose output
ctest -V

# Run specific tests by name pattern
ctest -R "unit_*"

# Run tests in parallel
ctest -j4

# Show test output on failure
ctest --output-on-failure
```

### Integration with Google Test

```cmake
include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)
FetchContent_MakeAvailable(googletest)

add_executable(my_tests
    test_main.cpp
    test_feature1.cpp
    test_feature2.cpp
)

target_link_libraries(my_tests
    PRIVATE
        my_lib
        GTest::gtest_main
        GTest::gmock
)

# Automatically discover and register tests
include(GoogleTest)
gtest_discover_tests(my_tests)
```

### Test Fixtures and Labels

```cmake
# Group tests with labels
set_tests_properties(unit_test1 unit_test2 PROPERTIES LABELS "unit")
set_tests_properties(integration_test1 PROPERTIES LABELS "integration")

# Run only unit tests
# ctest -L unit

# Create test fixtures for setup/teardown
add_test(NAME setup_database COMMAND setup_db_script)
add_test(NAME teardown_database COMMAND teardown_db_script)
add_test(NAME test_with_database COMMAND db_tests)

set_tests_properties(setup_database PROPERTIES FIXTURES_SETUP Database)
set_tests_properties(teardown_database PROPERTIES FIXTURES_CLEANUP Database)
set_tests_properties(test_with_database PROPERTIES FIXTURES_REQUIRED Database)
```

## Installing Your Project

CMake provides powerful installation capabilities for distributing your project.

### Basic Installation

```cmake
# Install the executable
install(TARGETS my_app
    RUNTIME DESTINATION bin
)

# Install the library
install(TARGETS my_lib
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin  # For Windows DLLs
)

# Install headers
install(DIRECTORY include/
    DESTINATION include
)

# Install specific files
install(FILES
    README.md
    LICENSE
    DESTINATION share/doc/my_project
)
```

### Creating a Package Config

For others to use `find_package(MyProject)`:

```cmake
include(GNUInstallDirs)
include(CMakePackageConfigHelpers)

# Install targets with export
install(TARGETS calculator_lib
    EXPORT CalculatorTargets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

# Install headers
install(DIRECTORY include/
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

# Create and install export file
install(EXPORT CalculatorTargets
    FILE CalculatorTargets.cmake
    NAMESPACE Calculator::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/Calculator
)

# Create version file
write_basic_package_version_file(
    "${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfigVersion.cmake"
    VERSION ${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion
)

# Create config file
configure_package_config_file(
    "${CMAKE_SOURCE_DIR}/cmake/CalculatorConfig.cmake.in"
    "${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfig.cmake"
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/Calculator
)

# Install config files
install(FILES
    "${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfig.cmake"
    "${CMAKE_CURRENT_BINARY_DIR}/CalculatorConfigVersion.cmake"
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/Calculator
)
```

**cmake/CalculatorConfig.cmake.in**:
```cmake
@PACKAGE_INIT@

include("${CMAKE_CURRENT_LIST_DIR}/CalculatorTargets.cmake")

check_required_components(Calculator)
```

### Running Installation

```bash
# Configure with install prefix
cmake -B build -DCMAKE_INSTALL_PREFIX=/usr/local

# Build
cmake --build build

# Install (may require sudo for system directories)
cmake --install build

# Or install to a staging directory
cmake --install build --prefix /path/to/staging
```

## Build Types and Configurations

### Standard Build Types

```cmake
# Set default build type if not specified
if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE "Release" CACHE STRING "Build type" FORCE)
    set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS
        "Debug" "Release" "MinSizeRel" "RelWithDebInfo")
endif()

# Configure based on build type
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_definitions(my_app PRIVATE DEBUG_MODE)
endif()
```

### Generator Expressions

Generator expressions allow configuration-specific settings:

```cmake
target_compile_definitions(my_app PRIVATE
    $<$<CONFIG:Debug>:DEBUG_MODE>
    $<$<CONFIG:Release>:NDEBUG>
)

target_compile_options(my_app PRIVATE
    $<$<CONFIG:Debug>:-g -O0 -fsanitize=address>
    $<$<CONFIG:Release>:-O3>
)

# Link different libraries based on config
target_link_libraries(my_app PRIVATE
    $<$<CONFIG:Debug>:debug_lib>
    $<$<CONFIG:Release>:optimized_lib>
)
```

## Cross-Compilation

CMake supports cross-compilation through toolchain files.

### Example Toolchain File

**toolchains/arm-linux-gnueabihf.cmake**:
```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)

# Specify the cross compiler
set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_CXX_COMPILER arm-linux-gnueabihf-g++)

# Target environment
set(CMAKE_FIND_ROOT_PATH /usr/arm-linux-gnueabihf)

# Search for programs in the host environment
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)

# Search for libraries and headers in the target environment
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

### Using a Toolchain File

```bash
cmake -B build \
    -DCMAKE_TOOLCHAIN_FILE=toolchains/arm-linux-gnueabihf.cmake \
    -DCMAKE_BUILD_TYPE=Release
```

## CMake Presets

CMake 3.19+ supports presets for standardized configuration. Create a `CMakePresets.json`:

```json
{
    "version": 6,
    "cmakeMinimumRequired": {
        "major": 3,
        "minor": 21,
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
            "displayName": "Debug Build",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug"
            }
        },
        {
            "name": "release",
            "inherits": "base",
            "displayName": "Release Build",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Release"
            }
        },
        {
            "name": "ci",
            "inherits": "release",
            "displayName": "CI Build",
            "cacheVariables": {
                "BUILD_TESTING": "ON"
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
            "name": "test",
            "configurePreset": "ci",
            "output": {
                "outputOnFailure": true
            }
        }
    ]
}
```

### Using Presets

```bash
# List available presets
cmake --list-presets

# Configure with a preset
cmake --preset debug

# Build with a preset
cmake --build --preset debug

# Test with a preset
ctest --preset test
```

## Best Practices

### Modern CMake Guidelines

1. **Use targets, not variables**: Prefer `target_*` commands over global `set()` and `add_*` commands

```cmake
# Prefer this:
target_include_directories(my_lib PUBLIC include/)

# Over this:
include_directories(include/)  # Affects all targets
```

2. **Treat CMake as code**: Use consistent formatting, meaningful variable names, and comments

3. **Use namespaced targets**: Create aliases for your libraries

```cmake
add_library(myproject_lib src/lib.cpp)
add_library(MyProject::lib ALIAS myproject_lib)
```

4. **Specify minimum CMake version thoughtfully**: Balance feature availability with user accessibility

5. **Use generator expressions for configuration-specific settings**: They're evaluated at build time, not configure time

6. **Keep CMakeLists.txt files focused**: Use `add_subdirectory()` to organize large projects

7. **Document your build options**: Use `option()` with clear descriptions

```cmake
option(MYPROJECT_BUILD_TESTS "Build the test suite" ON)
option(MYPROJECT_ENABLE_COVERAGE "Enable code coverage" OFF)
```

### Common Pitfalls to Avoid

1. **Don't use `file(GLOB)` for source files** without understanding the implications - CMake won't detect new files automatically

2. **Don't hardcode paths** - Use CMake variables like `CMAKE_SOURCE_DIR`, `CMAKE_CURRENT_SOURCE_DIR`

3. **Don't modify `CMAKE_CXX_FLAGS` directly** - Use `target_compile_options()` instead

4. **Don't forget to use `PRIVATE`/`PUBLIC`/`INTERFACE`** - They're essential for proper dependency management

5. **Don't put build logic in subdirectory CMakeLists.txt** - Keep configuration in the root, only target definitions in subdirectories

## Useful Variables Reference

| Variable | Description |
|----------|-------------|
| `CMAKE_SOURCE_DIR` | Top-level source directory |
| `CMAKE_CURRENT_SOURCE_DIR` | Current CMakeLists.txt directory |
| `CMAKE_BINARY_DIR` | Top-level build directory |
| `CMAKE_CURRENT_BINARY_DIR` | Current build directory |
| `PROJECT_SOURCE_DIR` | Source directory of the current project |
| `PROJECT_BINARY_DIR` | Binary directory of the current project |
| `CMAKE_CXX_COMPILER` | Path to the C++ compiler |
| `CMAKE_BUILD_TYPE` | Current build type (Debug, Release, etc.) |
| `CMAKE_INSTALL_PREFIX` | Installation prefix |
| `BUILD_SHARED_LIBS` | Whether to build shared libraries by default |

## Conclusion

CMake is a powerful and flexible build system that scales from simple projects to complex multi-platform applications. By following modern CMake practices and understanding its target-based architecture, you can create maintainable, portable build configurations that work seamlessly across different platforms and development environments.

Key takeaways:

- Always use target-based commands (`target_*`) over directory-based commands
- Understand and properly use `PUBLIC`, `PRIVATE`, and `INTERFACE` keywords
- Leverage `FetchContent` or package managers for dependency management
- Use `CTest` for testing integration
- Consider using CMake Presets for standardized builds
- Keep your CMakeLists.txt files clean, organized, and well-documented

The CMake ecosystem continues to evolve, so stay updated with new features and best practices by following the official CMake documentation and community resources.
