---
title: 外部函数接口(FFI)
description: Rust FFI完全指南，与C语言互操作、bindgen与cbindgen
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - FFI
  - C
  - 互操作
status: imported
origin: old/src/content/docs/rust/ffi.zh.md
divergence: 0.199
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 互操作
  order: 11
  lastUpdated: 2026-01-07
---

外部函数接口（Foreign Function Interface，FFI）是 Rust 与其他编程语言进行互操作的桥梁。通过 FFI，Rust 可以调用 C 语言编写的库，也可以将 Rust 代码暴露给 C 或其他语言使用。本文将深入探讨 Rust FFI 的各个方面，包括核心概念、实践技巧和安全注意事项。

## 为什么需要 FFI

在实际开发中，FFI 有着广泛的应用场景：

1. **复用现有代码库**：大量成熟的 C/C++ 库已经存在多年，如 OpenSSL、SQLite、zlib 等
2. **系统级编程**：与操作系统 API 交互，访问底层系统功能
3. **性能优化**：在某些场景下调用优化过的 C 库
4. **渐进式迁移**：将大型 C/C++ 项目逐步迁移到 Rust
5. **跨语言集成**：让其他语言（Python、Ruby、Node.js）调用 Rust 代码

## 核心概念

### extern "C" 与 ABI

ABI（Application Binary Interface）定义了函数在二进制层面的调用约定，包括参数传递方式、返回值处理、栈管理等。Rust 默认使用自己的 ABI，但可以通过 `extern` 关键字指定其他 ABI。

```rust
// 使用 C ABI 声明函数
extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 声明外部 C 函数
extern "C" {
    fn printf(format: *const i8, ...) -> i32;
}
```

常见的 ABI 类型：

| ABI | 说明 |
|-----|------|
| `"C"` | C 语言标准 ABI，最常用 |
| `"system"` | 系统默认 ABI，Windows 上为 stdcall |
| `"stdcall"` | Windows API 使用的调用约定 |
| `"fastcall"` | 快速调用约定 |
| `"Rust"` | Rust 默认 ABI（不稳定） |

### #[no_mangle] 属性

Rust 编译器默认会对函数名进行"名称修饰"（name mangling），将函数名转换为包含类型信息的复杂字符串。使用 `#[no_mangle]` 可以禁用这一行为，保持原始函数名。

```rust
// 没有 no_mangle，编译后的符号可能是 _ZN7example3addE
// 有 no_mangle，编译后的符号就是 add
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

### #[repr(C)] 属性

Rust 的结构体内存布局默认是未定义的，编译器可能会重排字段顺序以优化内存。使用 `#[repr(C)]` 可以强制使用 C 语言的内存布局规则。

```rust
// 使用 C 内存布局
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

// 指定对齐方式
#[repr(C, align(16))]
pub struct AlignedData {
    pub data: [u8; 32],
}

// 紧凑布局，无填充
#[repr(C, packed)]
pub struct PackedStruct {
    pub a: u8,
    pub b: u32,
}
```

## 从 Rust 调用 C

### 基本示例

让我们从一个简单的例子开始，调用 C 标准库的数学函数。

```rust
use std::os::raw::c_double;

// 声明 C 标准库的数学函数
extern "C" {
    fn sqrt(x: c_double) -> c_double;
    fn pow(base: c_double, exp: c_double) -> c_double;
    fn sin(x: c_double) -> c_double;
    fn cos(x: c_double) -> c_double;
}

fn main() {
    unsafe {
        let result = sqrt(16.0);
        println!("sqrt(16) = {}", result);

        let power = pow(2.0, 10.0);
        println!("2^10 = {}", power);
    }
}
```

### 使用 libc crate

`libc` crate 提供了对 C 标准库类型和函数的完整绑定。

```toml
# Cargo.toml
[dependencies]
libc = "0.2"
```

```rust
use libc::{c_char, c_int, size_t};
use std::ffi::CString;

extern "C" {
    fn strlen(s: *const c_char) -> size_t;
    fn strcmp(s1: *const c_char, s2: *const c_char) -> c_int;
}

fn safe_strlen(s: &str) -> usize {
    let c_str = CString::new(s).expect("CString creation failed");
    unsafe { strlen(c_str.as_ptr()) }
}

fn main() {
    let len = safe_strlen("Hello, FFI!");
    println!("String length: {}", len);
}
```

### 链接外部库

使用 `#[link]` 属性指定要链接的库。

```rust
// 链接系统库
#[link(name = "m")]  // 数学库 libm
extern "C" {
    fn cbrt(x: f64) -> f64;  // 立方根
}

// 链接静态库
#[link(name = "mylib", kind = "static")]
extern "C" {
    fn my_function() -> i32;
}

// 链接动态库
#[link(name = "mylib", kind = "dylib")]
extern "C" {
    fn another_function() -> i32;
}

// 链接框架（macOS）
#[cfg(target_os = "macos")]
#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    // ...
}
```

### 使用 build.rs 进行复杂链接

对于更复杂的链接需求，可以使用构建脚本。

```rust
// build.rs
fn main() {
    // 添加库搜索路径
    println!("cargo:rustc-link-search=native=/usr/local/lib");

    // 链接库
    println!("cargo:rustc-link-lib=static=mylib");

    // 设置环境变量
    println!("cargo:rustc-env=MY_VAR=value");

    // 重新运行条件
    println!("cargo:rerun-if-changed=wrapper.h");
}
```

## 从 C 调用 Rust

### 创建 C 兼容的库

首先配置 Cargo.toml 生成 C 兼容的库。

```toml
# Cargo.toml
[package]
name = "myrust"
version = "0.1.0"

[lib]
name = "myrust"
crate-type = ["cdylib", "staticlib"]  # 生成动态库和静态库
```

### 导出函数

```rust
// src/lib.rs
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};
use std::ptr;

/// 简单的加法函数
#[no_mangle]
pub extern "C" fn rust_add(a: c_int, b: c_int) -> c_int {
    a + b
}

/// 接收字符串参数
///
/// # Safety
/// 调用者必须确保 name 是有效的 C 字符串指针
#[no_mangle]
pub unsafe extern "C" fn rust_greet(name: *const c_char) -> *mut c_char {
    if name.is_null() {
        return ptr::null_mut();
    }

    let c_str = unsafe { CStr::from_ptr(name) };
    let name_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return ptr::null_mut(),
    };

    let greeting = format!("Hello, {}!", name_str);

    match CString::new(greeting) {
        Ok(c_string) => c_string.into_raw(),
        Err(_) => ptr::null_mut(),
    }
}

/// 释放 Rust 分配的字符串
///
/// # Safety
/// s 必须是由 rust_greet 返回的指针
#[no_mangle]
pub unsafe extern "C" fn rust_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            drop(CString::from_raw(s));
        }
    }
}
```

### 对应的 C 代码

```c
// main.c
#include <stdio.h>
#include <stdlib.h>

// 声明 Rust 函数
extern int rust_add(int a, int b);
extern char* rust_greet(const char* name);
extern void rust_free_string(char* s);

int main() {
    // 调用简单函数
    int sum = rust_add(3, 4);
    printf("3 + 4 = %d\n", sum);

    // 调用字符串函数
    char* greeting = rust_greet("World");
    if (greeting != NULL) {
        printf("%s\n", greeting);
        rust_free_string(greeting);  // 必须释放！
    }

    return 0;
}
```

编译和链接：

```bash
# 编译 Rust 库
cargo build --release

# 编译 C 程序并链接 Rust 库
gcc main.c -L./target/release -lmyrust -o main

# 运行（可能需要设置库路径）
LD_LIBRARY_PATH=./target/release ./main
```

### 导出结构体

```rust
use std::os::raw::c_int;

/// C 兼容的点结构体
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// C 兼容的矩形结构体
#[repr(C)]
pub struct Rectangle {
    pub origin: Point,
    pub width: f64,
    pub height: f64,
}

#[no_mangle]
pub extern "C" fn point_new(x: f64, y: f64) -> Point {
    Point { x, y }
}

#[no_mangle]
pub extern "C" fn point_distance(p1: *const Point, p2: *const Point) -> f64 {
    if p1.is_null() || p2.is_null() {
        return -1.0;
    }

    unsafe {
        let dx = (*p1).x - (*p2).x;
        let dy = (*p1).y - (*p2).y;
        (dx * dx + dy * dy).sqrt()
    }
}

#[no_mangle]
pub extern "C" fn rectangle_area(rect: *const Rectangle) -> f64 {
    if rect.is_null() {
        return -1.0;
    }

    unsafe { (*rect).width * (*rect).height }
}
```

### 不透明类型（Opaque Types）

对于复杂的 Rust 类型，可以使用不透明指针隐藏内部实现。

```rust
use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;

/// 不透明的字典类型
pub struct Dictionary {
    inner: HashMap<String, String>,
}

/// 创建新字典
#[no_mangle]
pub extern "C" fn dict_new() -> *mut Dictionary {
    let dict = Box::new(Dictionary {
        inner: HashMap::new(),
    });
    Box::into_raw(dict)
}

/// 销毁字典
///
/// # Safety
/// dict 必须是由 dict_new 创建的有效指针
#[no_mangle]
pub unsafe extern "C" fn dict_free(dict: *mut Dictionary) {
    if !dict.is_null() {
        unsafe {
            drop(Box::from_raw(dict));
        }
    }
}

/// 插入键值对
#[no_mangle]
pub unsafe extern "C" fn dict_insert(
    dict: *mut Dictionary,
    key: *const c_char,
    value: *const c_char,
) -> bool {
    if dict.is_null() || key.is_null() || value.is_null() {
        return false;
    }

    let key_str = match CStr::from_ptr(key).to_str() {
        Ok(s) => s.to_owned(),
        Err(_) => return false,
    };

    let value_str = match CStr::from_ptr(value).to_str() {
        Ok(s) => s.to_owned(),
        Err(_) => return false,
    };

    (*dict).inner.insert(key_str, value_str);
    true
}

/// 获取值
#[no_mangle]
pub unsafe extern "C" fn dict_get(
    dict: *const Dictionary,
    key: *const c_char,
) -> *mut c_char {
    if dict.is_null() || key.is_null() {
        return ptr::null_mut();
    }

    let key_str = match CStr::from_ptr(key).to_str() {
        Ok(s) => s,
        Err(_) => return ptr::null_mut(),
    };

    match (*dict).inner.get(key_str) {
        Some(value) => {
            CString::new(value.as_str())
                .map(|s| s.into_raw())
                .unwrap_or(ptr::null_mut())
        }
        None => ptr::null_mut(),
    }
}
```

## 类型映射

### 基本类型对应关系

| C 类型 | Rust 类型 | std::os::raw |
|--------|-----------|--------------|
| `char` | `i8` 或 `u8` | `c_char` |
| `signed char` | `i8` | `c_schar` |
| `unsigned char` | `u8` | `c_uchar` |
| `short` | `i16` | `c_short` |
| `unsigned short` | `u16` | `c_ushort` |
| `int` | `i32` | `c_int` |
| `unsigned int` | `u32` | `c_uint` |
| `long` | `i32` 或 `i64` | `c_long` |
| `unsigned long` | `u32` 或 `u64` | `c_ulong` |
| `long long` | `i64` | `c_longlong` |
| `unsigned long long` | `u64` | `c_ulonglong` |
| `float` | `f32` | `c_float` |
| `double` | `f64` | `c_double` |
| `void*` | `*mut c_void` | `c_void` |
| `const void*` | `*const c_void` | `c_void` |
| `size_t` | `usize` | - |
| `ssize_t` | `isize` | - |

### 字符串处理

C 字符串和 Rust 字符串有本质区别：

- C 字符串：以 null 结尾的字节序列
- Rust `String`/`&str`：UTF-8 编码，不以 null 结尾

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// Rust 字符串 -> C 字符串
fn rust_to_c(s: &str) -> CString {
    CString::new(s).expect("String contains null byte")
}

// C 字符串 -> Rust 字符串（借用）
unsafe fn c_to_rust<'a>(s: *const c_char) -> &'a str {
    CStr::from_ptr(s).to_str().expect("Invalid UTF-8")
}

// C 字符串 -> Rust 字符串（拥有所有权）
unsafe fn c_to_rust_owned(s: *const c_char) -> String {
    CStr::from_ptr(s).to_string_lossy().into_owned()
}

// 示例：安全的字符串包装
pub struct SafeString {
    inner: CString,
}

impl SafeString {
    pub fn new(s: &str) -> Result<Self, std::ffi::NulError> {
        Ok(Self {
            inner: CString::new(s)?,
        })
    }

    pub fn as_ptr(&self) -> *const c_char {
        self.inner.as_ptr()
    }
}
```

### 数组和切片

```rust
use std::os::raw::c_int;
use std::slice;

/// 处理 C 数组
///
/// # Safety
/// - arr 必须指向有效的 c_int 数组
/// - len 必须是数组的实际长度
#[no_mangle]
pub unsafe extern "C" fn sum_array(arr: *const c_int, len: usize) -> c_int {
    if arr.is_null() || len == 0 {
        return 0;
    }

    let slice = unsafe { slice::from_raw_parts(arr, len) };
    slice.iter().sum()
}

/// 修改 C 数组
#[no_mangle]
pub unsafe extern "C" fn double_array(arr: *mut c_int, len: usize) {
    if arr.is_null() || len == 0 {
        return;
    }

    let slice = unsafe { slice::from_raw_parts_mut(arr, len) };
    for item in slice.iter_mut() {
        *item *= 2;
    }
}

/// 返回数组（通过输出参数）
#[no_mangle]
pub extern "C" fn create_array(out_arr: *mut *mut c_int, out_len: *mut usize) -> bool {
    if out_arr.is_null() || out_len.is_null() {
        return false;
    }

    let mut vec: Vec<c_int> = vec![1, 2, 3, 4, 5];
    let len = vec.len();
    let ptr = vec.as_mut_ptr();

    std::mem::forget(vec);  // 防止 Rust 释放内存

    unsafe {
        *out_arr = ptr;
        *out_len = len;
    }

    true
}

/// 释放数组
#[no_mangle]
pub unsafe extern "C" fn free_array(arr: *mut c_int, len: usize) {
    if !arr.is_null() && len > 0 {
        unsafe {
            drop(Vec::from_raw_parts(arr, len, len));
        }
    }
}
```

### 枚举

```rust
/// C 兼容的枚举
#[repr(C)]
pub enum Status {
    Ok = 0,
    Error = 1,
    NotFound = 2,
    InvalidInput = 3,
}

/// 带数据的枚举需要特殊处理
/// 使用标签 + 联合体模式
#[repr(C)]
pub struct Result {
    pub tag: ResultTag,
    pub data: ResultData,
}

#[repr(C)]
pub enum ResultTag {
    Success = 0,
    Failure = 1,
}

#[repr(C)]
pub union ResultData {
    pub value: i32,
    pub error_code: u32,
}

#[no_mangle]
pub extern "C" fn create_success(value: i32) -> Result {
    Result {
        tag: ResultTag::Success,
        data: ResultData { value },
    }
}

#[no_mangle]
pub extern "C" fn create_failure(error_code: u32) -> Result {
    Result {
        tag: ResultTag::Failure,
        data: ResultData { error_code },
    }
}
```

## 回调函数

### 从 C 调用 Rust 回调

```rust
use std::os::raw::c_int;

/// 定义回调函数类型
pub type Callback = extern "C" fn(c_int) -> c_int;

/// 接受回调的函数
#[no_mangle]
pub extern "C" fn process_with_callback(
    value: c_int,
    callback: Callback,
) -> c_int {
    callback(value * 2)
}

/// 带用户数据的回调
pub type CallbackWithData = extern "C" fn(c_int, *mut std::ffi::c_void) -> c_int;

#[no_mangle]
pub extern "C" fn process_with_userdata(
    value: c_int,
    callback: CallbackWithData,
    userdata: *mut std::ffi::c_void,
) -> c_int {
    callback(value, userdata)
}
```

### 从 Rust 调用 C 回调

```rust
use std::os::raw::{c_int, c_void};

// 假设 C 库定义了这个函数
extern "C" {
    fn c_sort(
        arr: *mut c_int,
        len: usize,
        compare: extern "C" fn(*const c_int, *const c_int) -> c_int,
    );
}

// Rust 实现的比较函数
extern "C" fn compare_ints(a: *const c_int, b: *const c_int) -> c_int {
    unsafe { *a - *b }
}

fn sort_array(arr: &mut [i32]) {
    unsafe {
        c_sort(arr.as_mut_ptr(), arr.len(), compare_ints);
    }
}
```

### 闭包作为回调

Rust 闭包不能直接作为 C 回调，需要使用蹦床函数（trampoline）。

```rust
use std::os::raw::c_void;

/// 通用的闭包包装器
pub struct CallbackWrapper<F> {
    callback: F,
}

/// 蹦床函数
extern "C" fn trampoline<F>(data: *mut c_void)
where
    F: FnMut(),
{
    let wrapper = unsafe { &mut *(data as *mut CallbackWrapper<F>) };
    (wrapper.callback)();
}

/// 使用闭包的示例
pub fn with_callback<F>(mut callback: F)
where
    F: FnMut(),
{
    let mut wrapper = CallbackWrapper { callback };

    // 调用接受 C 回调的函数
    unsafe {
        // 假设的 C 函数
        // c_function(trampoline::<F>, &mut wrapper as *mut _ as *mut c_void);
    }
}

// 更安全的实现
use std::panic::{catch_unwind, AssertUnwindSafe};

extern "C" fn safe_trampoline<F>(data: *mut c_void)
where
    F: FnMut(),
{
    let result = catch_unwind(AssertUnwindSafe(|| {
        let wrapper = unsafe { &mut *(data as *mut CallbackWrapper<F>) };
        (wrapper.callback)();
    }));

    if result.is_err() {
        eprintln!("Panic in callback!");
        std::process::abort();
    }
}
```

## bindgen：自动生成 Rust 绑定

bindgen 可以从 C/C++ 头文件自动生成 Rust FFI 绑定。

### 安装和基本使用

```bash
# 安装 bindgen CLI
cargo install bindgen-cli

# 生成绑定
bindgen wrapper.h -o bindings.rs
```

### 在构建脚本中使用

```toml
# Cargo.toml
[build-dependencies]
bindgen = "0.69"
```

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    // 链接库
    println!("cargo:rustc-link-lib=mylib");
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        // 只生成指定函数的绑定
        .allowlist_function("my_.*")
        // 只生成指定类型的绑定
        .allowlist_type("my_.*")
        // 生成 Debug trait
        .derive_debug(true)
        // 生成 Default trait
        .derive_default(true)
        // 使用 core 而非 std（用于 no_std）
        // .use_core()
        // 解析内联函数
        .generate_inline_functions(true)
        // 设置 clang 参数
        .clang_arg("-I/usr/local/include")
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

```rust
// src/lib.rs
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
```

### 完整示例：绑定 zlib

```c
// wrapper.h
#include <zlib.h>
```

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    println!("cargo:rustc-link-lib=z");
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .allowlist_function("compress")
        .allowlist_function("uncompress")
        .allowlist_function("compressBound")
        .allowlist_type("z_stream")
        .allowlist_var("Z_OK")
        .allowlist_var("Z_STREAM_END")
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

```rust
// src/lib.rs
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

use std::ptr;

/// 压缩数据
pub fn compress_data(input: &[u8]) -> Result<Vec<u8>, i32> {
    unsafe {
        let mut dest_len = compressBound(input.len() as _) as usize;
        let mut dest = vec![0u8; dest_len];

        let result = compress(
            dest.as_mut_ptr(),
            &mut dest_len as *mut _ as *mut _,
            input.as_ptr(),
            input.len() as _,
        );

        if result == Z_OK as i32 {
            dest.truncate(dest_len);
            Ok(dest)
        } else {
            Err(result)
        }
    }
}

/// 解压数据
pub fn decompress_data(input: &[u8], max_output: usize) -> Result<Vec<u8>, i32> {
    unsafe {
        let mut dest_len = max_output;
        let mut dest = vec![0u8; dest_len];

        let result = uncompress(
            dest.as_mut_ptr(),
            &mut dest_len as *mut _ as *mut _,
            input.as_ptr(),
            input.len() as _,
        );

        if result == Z_OK as i32 {
            dest.truncate(dest_len);
            Ok(dest)
        } else {
            Err(result)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compress_decompress() {
        let original = b"Hello, World! This is a test of zlib compression.";
        let compressed = compress_data(original).unwrap();
        let decompressed = decompress_data(&compressed, 1024).unwrap();

        assert_eq!(original.as_slice(), decompressed.as_slice());
    }
}
```

## cbindgen：生成 C 头文件

cbindgen 可以从 Rust 代码自动生成 C/C++ 头文件。

### 安装和配置

```bash
# 安装 cbindgen
cargo install cbindgen
```

```toml
# cbindgen.toml
language = "C"
header = "/* Generated by cbindgen */"
include_guard = "MY_LIB_H"
autogen_warning = "/* Warning: this file is autogenerated. Do not modify. */"
include_version = true

[defines]
"target_os = linux" = "LINUX"
"target_os = macos" = "MACOS"
"target_os = windows" = "WINDOWS"

[export]
include = ["Point", "Rectangle"]
exclude = ["InternalStruct"]

[fn]
rename_args = "CamelCase"

[struct]
rename_fields = "CamelCase"

[enum]
rename_variants = "ScreamingSnakeCase"
```

### 使用构建脚本

```rust
// build.rs
use std::env;

fn main() {
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();

    cbindgen::Builder::new()
        .with_crate(&crate_dir)
        .with_language(cbindgen::Language::C)
        .with_include_guard("MY_RUST_LIB_H")
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file("include/mylib.h");
}
```

### 生成 C++ 头文件

```toml
# cbindgen.toml
language = "C++"
namespace = "myrust"
namespaces = ["myrust", "ffi"]

[export]
include = []
exclude = []

[fn]
args = "CamelCase"

[struct]
rename_fields = "CamelCase"
derive_constructor = true
derive_eq = true
```

### 文档注释

cbindgen 会将 Rust 文档注释转换为 C 注释。

```rust
/// 表示二维空间中的点
///
/// # Example
/// ```c
/// Point p = point_new(1.0, 2.0);
/// ```
#[repr(C)]
pub struct Point {
    /// X 坐标
    pub x: f64,
    /// Y 坐标
    pub y: f64,
}

/// 创建新的点
///
/// @param x X 坐标
/// @param y Y 坐标
/// @return 新创建的点
#[no_mangle]
pub extern "C" fn point_new(x: f64, y: f64) -> Point {
    Point { x, y }
}
```

生成的头文件：

```c
/* Generated by cbindgen */

#ifndef MY_RUST_LIB_H
#define MY_RUST_LIB_H

#include <stdint.h>

/**
 * 表示二维空间中的点
 *
 * # Example
 * ```c
 * Point p = point_new(1.0, 2.0);
 * ```
 */
typedef struct Point {
    /** X 坐标 */
    double x;
    /** Y 坐标 */
    double y;
} Point;

/**
 * 创建新的点
 *
 * @param x X 坐标
 * @param y Y 坐标
 * @return 新创建的点
 */
struct Point point_new(double x, double y);

#endif /* MY_RUST_LIB_H */
```

## 安全注意事项

### 常见陷阱

#### 空指针

```rust
// 错误：未检查空指针
#[no_mangle]
pub unsafe extern "C" fn bad_function(ptr: *const i32) -> i32 {
    *ptr  // 如果 ptr 为 null，会导致未定义行为
}

// 正确：检查空指针
#[no_mangle]
pub extern "C" fn good_function(ptr: *const i32) -> i32 {
    if ptr.is_null() {
        return -1;  // 或其他错误处理
    }
    unsafe { *ptr }
}
```

#### 悬垂指针

```rust
// 错误：返回局部变量的指针
#[no_mangle]
pub extern "C" fn bad_string() -> *const u8 {
    let s = String::from("hello");
    s.as_ptr()  // s 在函数结束时被释放！
}

// 正确：使用 CString 并转移所有权
#[no_mangle]
pub extern "C" fn good_string() -> *mut std::os::raw::c_char {
    let s = std::ffi::CString::new("hello").unwrap();
    s.into_raw()  // 调用者负责释放
}
```

#### 内存泄漏

```rust
use std::ffi::CString;

// 确保提供配套的释放函数
#[no_mangle]
pub extern "C" fn create_resource() -> *mut Resource {
    Box::into_raw(Box::new(Resource::new()))
}

#[no_mangle]
pub unsafe extern "C" fn free_resource(ptr: *mut Resource) {
    if !ptr.is_null() {
        drop(Box::from_raw(ptr));
    }
}
```

#### 缓冲区溢出

```rust
use std::slice;

// 错误：信任调用者提供的长度
#[no_mangle]
pub unsafe extern "C" fn bad_copy(src: *const u8, dst: *mut u8, len: usize) {
    let src_slice = slice::from_raw_parts(src, len);
    let dst_slice = slice::from_raw_parts_mut(dst, len);
    dst_slice.copy_from_slice(src_slice);
}

// 正确：验证并限制长度
#[no_mangle]
pub unsafe extern "C" fn good_copy(
    src: *const u8,
    src_len: usize,
    dst: *mut u8,
    dst_len: usize,
) -> usize {
    if src.is_null() || dst.is_null() {
        return 0;
    }

    let copy_len = src_len.min(dst_len);
    let src_slice = slice::from_raw_parts(src, copy_len);
    let dst_slice = slice::from_raw_parts_mut(dst, copy_len);
    dst_slice.copy_from_slice(src_slice);

    copy_len
}
```

#### 线程安全

```rust
use std::sync::Mutex;

// 全局状态需要同步
static GLOBAL_STATE: Mutex<Vec<i32>> = Mutex::new(Vec::new());

#[no_mangle]
pub extern "C" fn add_to_global(value: i32) -> bool {
    match GLOBAL_STATE.lock() {
        Ok(mut guard) => {
            guard.push(value);
            true
        }
        Err(_) => false,  // 锁中毒
    }
}
```

### Panic 处理

Rust panic 跨越 FFI 边界是未定义行为，必须捕获。

```rust
use std::panic::{catch_unwind, AssertUnwindSafe};

#[no_mangle]
pub extern "C" fn safe_function(value: i32) -> i32 {
    let result = catch_unwind(AssertUnwindSafe(|| {
        if value < 0 {
            panic!("Negative value not allowed");
        }
        value * 2
    }));

    match result {
        Ok(v) => v,
        Err(_) => {
            // 记录错误，返回错误码
            eprintln!("Panic occurred in safe_function");
            -1
        }
    }
}

// 使用宏简化
macro_rules! ffi_try {
    ($expr:expr) => {
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| $expr)) {
            Ok(result) => result,
            Err(_) => {
                eprintln!("Panic caught at FFI boundary");
                return Default::default();
            }
        }
    };
}

#[no_mangle]
pub extern "C" fn another_safe_function(value: i32) -> i32 {
    ffi_try!({
        // 可能 panic 的代码
        value.checked_mul(2).expect("Overflow")
    })
}
```

### 错误处理模式

```rust
use std::os::raw::{c_char, c_int};
use std::ffi::CString;
use std::ptr;
use std::cell::RefCell;

thread_local! {
    static LAST_ERROR: RefCell<Option<CString>> = RefCell::new(None);
}

/// 设置线程本地错误信息
fn set_error(msg: &str) {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = CString::new(msg).ok();
    });
}

/// 获取最后一次错误信息
#[no_mangle]
pub extern "C" fn get_last_error() -> *const c_char {
    LAST_ERROR.with(|e| {
        match &*e.borrow() {
            Some(s) => s.as_ptr(),
            None => ptr::null(),
        }
    })
}

/// 清除错误信息
#[no_mangle]
pub extern "C" fn clear_error() {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = None;
    });
}

/// 返回错误码的函数
#[no_mangle]
pub extern "C" fn divide(a: c_int, b: c_int, result: *mut c_int) -> c_int {
    if result.is_null() {
        set_error("Result pointer is null");
        return -1;
    }

    if b == 0 {
        set_error("Division by zero");
        return -2;
    }

    unsafe {
        *result = a / b;
    }
    0  // 成功
}
```

C 端使用：

```c
#include <stdio.h>

extern int divide(int a, int b, int* result);
extern const char* get_last_error(void);
extern void clear_error(void);

int main() {
    int result;
    int status = divide(10, 0, &result);

    if (status != 0) {
        const char* error = get_last_error();
        printf("Error: %s\n", error);
        clear_error();
    }

    return 0;
}
```

## 实战项目：封装 SQLite

让我们通过一个完整的例子来综合运用所学知识：为 SQLite 创建安全的 Rust 封装。

### 项目结构

```
sqlite-rs/
├── Cargo.toml
├── build.rs
├── wrapper.h
└── src/
    ├── lib.rs
    ├── raw.rs      # 原始绑定
    ├── database.rs # 数据库封装
    └── statement.rs # 语句封装
```

### Cargo.toml

```toml
[package]
name = "sqlite-rs"
version = "0.1.0"
edition = "2021"

[dependencies]

[build-dependencies]
bindgen = "0.69"
```

### build.rs

```rust
use std::env;
use std::path::PathBuf;

fn main() {
    println!("cargo:rustc-link-lib=sqlite3");
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .allowlist_function("sqlite3_.*")
        .allowlist_type("sqlite3.*")
        .allowlist_var("SQLITE_.*")
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

### wrapper.h

```c
#include <sqlite3.h>
```

### src/raw.rs

```rust
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
```

### src/database.rs

```rust
use crate::raw::*;
use crate::statement::Statement;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};
use std::ptr;

/// SQLite 错误
#[derive(Debug)]
pub struct SqliteError {
    pub code: i32,
    pub message: String,
}

impl std::fmt::Display for SqliteError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SQLite error {}: {}", self.code, self.message)
    }
}

impl std::error::Error for SqliteError {}

pub type Result<T> = std::result::Result<T, SqliteError>;

/// SQLite 数据库连接
pub struct Database {
    handle: *mut sqlite3,
}

// Database 可以在线程间转移，但不能共享
unsafe impl Send for Database {}

impl Database {
    /// 打开数据库
    pub fn open(path: &str) -> Result<Self> {
        let path = CString::new(path).map_err(|_| SqliteError {
            code: -1,
            message: "Invalid path".to_string(),
        })?;

        let mut handle: *mut sqlite3 = ptr::null_mut();

        let result = unsafe {
            sqlite3_open(path.as_ptr(), &mut handle)
        };

        if result != SQLITE_OK as c_int {
            let message = Self::error_message_from_ptr(handle);
            unsafe {
                sqlite3_close(handle);
            }
            return Err(SqliteError {
                code: result,
                message,
            });
        }

        Ok(Database { handle })
    }

    /// 打开内存数据库
    pub fn open_in_memory() -> Result<Self> {
        Self::open(":memory:")
    }

    /// 执行 SQL 语句
    pub fn execute(&self, sql: &str) -> Result<()> {
        let sql = CString::new(sql).map_err(|_| SqliteError {
            code: -1,
            message: "Invalid SQL".to_string(),
        })?;

        let mut err_msg: *mut c_char = ptr::null_mut();

        let result = unsafe {
            sqlite3_exec(
                self.handle,
                sql.as_ptr(),
                None,
                ptr::null_mut(),
                &mut err_msg,
            )
        };

        if result != SQLITE_OK as c_int {
            let message = if !err_msg.is_null() {
                let msg = unsafe { CStr::from_ptr(err_msg) }
                    .to_string_lossy()
                    .into_owned();
                unsafe {
                    sqlite3_free(err_msg as *mut _);
                }
                msg
            } else {
                self.error_message()
            };

            return Err(SqliteError {
                code: result,
                message,
            });
        }

        Ok(())
    }

    /// 准备 SQL 语句
    pub fn prepare(&self, sql: &str) -> Result<Statement> {
        Statement::new(self.handle, sql)
    }

    /// 获取最后插入的行 ID
    pub fn last_insert_rowid(&self) -> i64 {
        unsafe { sqlite3_last_insert_rowid(self.handle) }
    }

    /// 获取最后一次操作影响的行数
    pub fn changes(&self) -> i32 {
        unsafe { sqlite3_changes(self.handle) }
    }

    /// 获取错误信息
    fn error_message(&self) -> String {
        Self::error_message_from_ptr(self.handle)
    }

    fn error_message_from_ptr(handle: *mut sqlite3) -> String {
        if handle.is_null() {
            return "Unknown error".to_string();
        }

        unsafe {
            let msg = sqlite3_errmsg(handle);
            if msg.is_null() {
                "Unknown error".to_string()
            } else {
                CStr::from_ptr(msg).to_string_lossy().into_owned()
            }
        }
    }

    /// 获取原始句柄（用于高级用法）
    pub fn handle(&self) -> *mut sqlite3 {
        self.handle
    }
}

impl Drop for Database {
    fn drop(&mut self) {
        unsafe {
            sqlite3_close(self.handle);
        }
    }
}
```

### src/statement.rs

```rust
use crate::raw::*;
use crate::database::{Result, SqliteError};
use std::ffi::CString;
use std::os::raw::c_int;
use std::ptr;

/// 预编译的 SQL 语句
pub struct Statement {
    handle: *mut sqlite3_stmt,
    column_count: i32,
}

impl Statement {
    pub(crate) fn new(db: *mut sqlite3, sql: &str) -> Result<Self> {
        let sql = CString::new(sql).map_err(|_| SqliteError {
            code: -1,
            message: "Invalid SQL".to_string(),
        })?;

        let mut handle: *mut sqlite3_stmt = ptr::null_mut();

        let result = unsafe {
            sqlite3_prepare_v2(
                db,
                sql.as_ptr(),
                -1,
                &mut handle,
                ptr::null_mut(),
            )
        };

        if result != SQLITE_OK as c_int {
            return Err(SqliteError {
                code: result,
                message: "Failed to prepare statement".to_string(),
            });
        }

        let column_count = unsafe { sqlite3_column_count(handle) };

        Ok(Statement {
            handle,
            column_count,
        })
    }

    /// 绑定整数参数
    pub fn bind_int(&mut self, index: i32, value: i32) -> Result<()> {
        let result = unsafe {
            sqlite3_bind_int(self.handle, index, value)
        };

        if result != SQLITE_OK as c_int {
            return Err(SqliteError {
                code: result,
                message: "Failed to bind parameter".to_string(),
            });
        }

        Ok(())
    }

    /// 绑定文本参数
    pub fn bind_text(&mut self, index: i32, value: &str) -> Result<()> {
        let value = CString::new(value).map_err(|_| SqliteError {
            code: -1,
            message: "Invalid text".to_string(),
        })?;

        let result = unsafe {
            sqlite3_bind_text(
                self.handle,
                index,
                value.as_ptr(),
                -1,
                // SQLITE_TRANSIENT 表示 SQLite 应该复制这个字符串
                Some(std::mem::transmute::<usize, unsafe extern "C" fn(*mut std::ffi::c_void)>(!0usize)),
            )
        };

        if result != SQLITE_OK as c_int {
            return Err(SqliteError {
                code: result,
                message: "Failed to bind parameter".to_string(),
            });
        }

        Ok(())
    }

    /// 执行语句并返回是否有更多行
    pub fn step(&mut self) -> Result<bool> {
        let result = unsafe { sqlite3_step(self.handle) };

        match result as u32 {
            SQLITE_ROW => Ok(true),
            SQLITE_DONE => Ok(false),
            _ => Err(SqliteError {
                code: result,
                message: "Step failed".to_string(),
            }),
        }
    }

    /// 获取整数列
    pub fn column_int(&self, index: i32) -> i32 {
        unsafe { sqlite3_column_int(self.handle, index) }
    }

    /// 获取文本列
    pub fn column_text(&self, index: i32) -> Option<String> {
        let ptr = unsafe { sqlite3_column_text(self.handle, index) };

        if ptr.is_null() {
            return None;
        }

        unsafe {
            Some(std::ffi::CStr::from_ptr(ptr as *const _)
                .to_string_lossy()
                .into_owned())
        }
    }

    /// 获取列数
    pub fn column_count(&self) -> i32 {
        self.column_count
    }

    /// 重置语句以便重新执行
    pub fn reset(&mut self) -> Result<()> {
        let result = unsafe { sqlite3_reset(self.handle) };

        if result != SQLITE_OK as c_int {
            return Err(SqliteError {
                code: result,
                message: "Reset failed".to_string(),
            });
        }

        Ok(())
    }
}

impl Drop for Statement {
    fn drop(&mut self) {
        unsafe {
            sqlite3_finalize(self.handle);
        }
    }
}
```

### src/lib.rs

```rust
mod raw;
mod database;
mod statement;

pub use database::{Database, Result, SqliteError};
pub use statement::Statement;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_operations() -> Result<()> {
        let db = Database::open_in_memory()?;

        // 创建表
        db.execute(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER
            )"
        )?;

        // 插入数据
        db.execute("INSERT INTO users (name, age) VALUES ('Alice', 30)")?;
        db.execute("INSERT INTO users (name, age) VALUES ('Bob', 25)")?;

        assert_eq!(db.changes(), 1);

        // 查询数据
        let mut stmt = db.prepare("SELECT id, name, age FROM users ORDER BY id")?;

        let mut users = Vec::new();
        while stmt.step()? {
            users.push((
                stmt.column_int(0),
                stmt.column_text(1).unwrap_or_default(),
                stmt.column_int(2),
            ));
        }

        assert_eq!(users.len(), 2);
        assert_eq!(users[0], (1, "Alice".to_string(), 30));
        assert_eq!(users[1], (2, "Bob".to_string(), 25));

        Ok(())
    }

    #[test]
    fn test_prepared_statement_with_params() -> Result<()> {
        let db = Database::open_in_memory()?;

        db.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)")?;

        let mut insert_stmt = db.prepare("INSERT INTO items (value) VALUES (?1)")?;

        for i in 0..5 {
            insert_stmt.bind_text(1, &format!("Item {}", i))?;
            insert_stmt.step()?;
            insert_stmt.reset()?;
        }

        let mut select_stmt = db.prepare("SELECT COUNT(*) FROM items")?;
        select_stmt.step()?;

        assert_eq!(select_stmt.column_int(0), 5);

        Ok(())
    }
}
```

## 总结

FFI 是 Rust 生态系统的重要组成部分，它使 Rust 能够与庞大的 C/C++ 代码库互操作。关键要点包括：

### 核心概念
- 使用 `extern "C"` 和 `#[no_mangle]` 确保 ABI 兼容性
- 使用 `#[repr(C)]` 确保结构体内存布局与 C 一致
- 正确处理类型转换，特别是字符串和指针

### 工具链
- **bindgen**：从 C 头文件生成 Rust 绑定
- **cbindgen**：从 Rust 代码生成 C 头文件
- **libc**：提供 C 标准库类型绑定

### 安全实践
- 始终检查空指针
- 正确管理内存生命周期
- 使用 `catch_unwind` 防止 panic 跨越 FFI 边界
- 实现完善的错误处理机制
- 注意线程安全问题

### 设计模式
- 对复杂类型使用不透明指针模式
- 提供配套的创建和销毁函数
- 使用 RAII 封装不安全的 FFI 调用
- 将 unsafe 代码隔离在安全抽象的底层

通过遵循这些原则和最佳实践，你可以安全高效地在 Rust 和 C 之间进行互操作，充分利用两种语言的优势。
