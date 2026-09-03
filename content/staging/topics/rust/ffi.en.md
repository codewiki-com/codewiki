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
origin: old/src/content/docs/rust/ffi.en.md
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

The Foreign Function Interface (FFI) is the bridge for Rust to interoperate with other programming languages. Through FFI, Rust can call libraries written in C and can also expose Rust code for use by C or other languages. This article will deeply explore various aspects of Rust FFI, including core concepts, practical techniques, and safety considerations.

## Why Do We Need FFI

In real-world development, FFI has various applications:

1. **Reusing existing code libraries**: A large number of mature C/C++ libraries have existed for many years, such as OpenSSL, SQLite, zlib, etc.
2. **System-level programming**: Interacting with operating system APIs to access low-level system functionality
3. **Performance optimization**: Calling optimized C libraries in certain scenarios
4. **Gradual migration**: Incrementally migrating large C/C++ projects to Rust
5. **Cross-language integration**: Allowing other languages (Python, Ruby, Node.js) to call Rust code

## Core Concepts

### extern "C" and ABI

ABI (Application Binary Interface) defines the calling conventions at the binary level, including parameter passing methods, return value handling, stack management, etc. Rust uses its own ABI by default, but you can specify other ABIs using the `extern` keyword.

```rust
// Declare a function using C ABI
extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Declare external C functions
extern "C" {
    fn printf(format: *const i8, ...) -> i32;
}
```

Common ABI types:

| ABI | Description |
|-----|-------------|
| `"C"` | Standard C ABI, most commonly used |
| `"system"` | System default ABI, stdcall on Windows |
| `"stdcall"` | Calling convention used by Windows API |
| `"fastcall"` | Fast calling convention |
| `"Rust"` | Rust default ABI (unstable) |

### #[no_mangle] Attribute

The Rust compiler performs "name mangling" on function names by default, converting function names into complex strings containing type information. Using `#[no_mangle]` disables this behavior and preserves the original function name.

```rust
// Without no_mangle, the compiled symbol might be _ZN7example3addE
// With no_mangle, the compiled symbol is simply add
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

### #[repr(C)] Attribute

Rust's struct memory layout is undefined by default, and the compiler may reorder fields to optimize memory. Using `#[repr(C)]` forces the use of C language memory layout rules.

```rust
// Use C memory layout
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

// Specify alignment
#[repr(C, align(16))]
pub struct AlignedData {
    pub data: [u8; 32],
}

// Packed layout, no padding
#[repr(C, packed)]
pub struct PackedStruct {
    pub a: u8,
    pub b: u32,
}
```

## Calling C from Rust

### Basic Example

Let's start with a simple example of calling C standard library math functions.

```rust
use std::os::raw::c_double;

// Declare C standard library math functions
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

### Using the libc crate

The `libc` crate provides complete bindings to C standard library types and functions.

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

### Linking External Libraries

Use the `#[link]` attribute to specify libraries to link.

```rust
// Link system library
#[link(name = "m")]  // Math library libm
extern "C" {
    fn cbrt(x: f64) -> f64;  // Cube root
}

// Link static library
#[link(name = "mylib", kind = "static")]
extern "C" {
    fn my_function() -> i32;
}

// Link dynamic library
#[link(name = "mylib", kind = "dylib")]
extern "C" {
    fn another_function() -> i32;
}

// Link framework (macOS)
#[cfg(target_os = "macos")]
#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    // ...
}
```

### Using build.rs for Complex Linking

For more complex linking requirements, you can use build scripts.

```rust
// build.rs
fn main() {
    // Add library search path
    println!("cargo:rustc-link-search=native=/usr/local/lib");

    // Link library
    println!("cargo:rustc-link-lib=static=mylib");

    // Set environment variable
    println!("cargo:rustc-env=MY_VAR=value");

    // Rerun condition
    println!("cargo:rerun-if-changed=wrapper.h");
}
```

## Calling Rust from C

### Creating a C-Compatible Library

First, configure Cargo.toml to generate a C-compatible library.

```toml
# Cargo.toml
[package]
name = "myrust"
version = "0.1.0"

[lib]
name = "myrust"
crate-type = ["cdylib", "staticlib"]  # Generate dynamic and static libraries
```

### Exporting Functions

```rust
// src/lib.rs
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};
use std::ptr;

/// Simple addition function
#[no_mangle]
pub extern "C" fn rust_add(a: c_int, b: c_int) -> c_int {
    a + b
}

/// Receive string parameter
///
/// # Safety
/// The caller must ensure that name is a valid C string pointer
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

/// Free a string allocated by Rust
///
/// # Safety
/// s must be a pointer returned by rust_greet
#[no_mangle]
pub unsafe extern "C" fn rust_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            drop(CString::from_raw(s));
        }
    }
}
```

### Corresponding C Code

```c
// main.c
#include <stdio.h>
#include <stdlib.h>

// Declare Rust functions
extern int rust_add(int a, int b);
extern char* rust_greet(const char* name);
extern void rust_free_string(char* s);

int main() {
    // Call simple function
    int sum = rust_add(3, 4);
    printf("3 + 4 = %d\n", sum);

    // Call string function
    char* greeting = rust_greet("World");
    if (greeting != NULL) {
        printf("%s\n", greeting);
        rust_free_string(greeting);  // Must free!
    }

    return 0;
}
```

Compile and link:

```bash
# Compile Rust library
cargo build --release

# Compile C program and link Rust library
gcc main.c -L./target/release -lmyrust -o main

# Run (may need to set library path)
LD_LIBRARY_PATH=./target/release ./main
```

### Exporting Structs

```rust
use std::os::raw::c_int;

/// C-compatible point struct
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// C-compatible rectangle struct
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

### Opaque Types

For complex Rust types, you can use opaque pointers to hide internal implementations.

```rust
use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;

/// Opaque dictionary type
pub struct Dictionary {
    inner: HashMap<String, String>,
}

/// Create a new dictionary
#[no_mangle]
pub extern "C" fn dict_new() -> *mut Dictionary {
    let dict = Box::new(Dictionary {
        inner: HashMap::new(),
    });
    Box::into_raw(dict)
}

/// Destroy a dictionary
///
/// # Safety
/// dict must be a valid pointer created by dict_new
#[no_mangle]
pub unsafe extern "C" fn dict_free(dict: *mut Dictionary) {
    if !dict.is_null() {
        unsafe {
            drop(Box::from_raw(dict));
        }
    }
}

/// Insert a key-value pair
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

/// Get a value
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

## Type Mapping

### Basic Type Correspondence

| C Type | Rust Type | std::os::raw |
|--------|-----------|--------------|
| `char` | `i8` or `u8` | `c_char` |
| `signed char` | `i8` | `c_schar` |
| `unsigned char` | `u8` | `c_uchar` |
| `short` | `i16` | `c_short` |
| `unsigned short` | `u16` | `c_ushort` |
| `int` | `i32` | `c_int` |
| `unsigned int` | `u32` | `c_uint` |
| `long` | `i32` or `i64` | `c_long` |
| `unsigned long` | `u32` or `u64` | `c_ulong` |
| `long long` | `i64` | `c_longlong` |
| `unsigned long long` | `u64` | `c_ulonglong` |
| `float` | `f32` | `c_float` |
| `double` | `f64` | `c_double` |
| `void*` | `*mut c_void` | `c_void` |
| `const void*` | `*const c_void` | `c_void` |
| `size_t` | `usize` | - |
| `ssize_t` | `isize` | - |

### String Handling

C strings and Rust strings have fundamental differences:

- C strings: null-terminated byte sequences
- Rust `String`/`&str`: UTF-8 encoded, not null-terminated

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// Rust string -> C string
fn rust_to_c(s: &str) -> CString {
    CString::new(s).expect("String contains null byte")
}

// C string -> Rust string (borrowed)
unsafe fn c_to_rust<'a>(s: *const c_char) -> &'a str {
    CStr::from_ptr(s).to_str().expect("Invalid UTF-8")
}

// C string -> Rust string (owned)
unsafe fn c_to_rust_owned(s: *const c_char) -> String {
    CStr::from_ptr(s).to_string_lossy().into_owned()
}

// Example: Safe string wrapper
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

### Arrays and Slices

```rust
use std::os::raw::c_int;
use std::slice;

/// Process C array
///
/// # Safety
/// - arr must point to a valid c_int array
/// - len must be the actual length of the array
#[no_mangle]
pub unsafe extern "C" fn sum_array(arr: *const c_int, len: usize) -> c_int {
    if arr.is_null() || len == 0 {
        return 0;
    }

    let slice = unsafe { slice::from_raw_parts(arr, len) };
    slice.iter().sum()
}

/// Modify C array
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

/// Return array (via output parameter)
#[no_mangle]
pub extern "C" fn create_array(out_arr: *mut *mut c_int, out_len: *mut usize) -> bool {
    if out_arr.is_null() || out_len.is_null() {
        return false;
    }

    let mut vec: Vec<c_int> = vec![1, 2, 3, 4, 5];
    let len = vec.len();
    let ptr = vec.as_mut_ptr();

    std::mem::forget(vec);  // Prevent Rust from freeing memory

    unsafe {
        *out_arr = ptr;
        *out_len = len;
    }

    true
}

/// Free array
#[no_mangle]
pub unsafe extern "C" fn free_array(arr: *mut c_int, len: usize) {
    if !arr.is_null() && len > 0 {
        unsafe {
            drop(Vec::from_raw_parts(arr, len, len));
        }
    }
}
```

### Enums

```rust
/// C-compatible enum
#[repr(C)]
pub enum Status {
    Ok = 0,
    Error = 1,
    NotFound = 2,
    InvalidInput = 3,
}

/// Enums with data require special handling
/// Use tag + union pattern
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

## Callback Functions

### Calling Rust Callbacks from C

```rust
use std::os::raw::c_int;

/// Define callback function type
pub type Callback = extern "C" fn(c_int) -> c_int;

/// Function that accepts a callback
#[no_mangle]
pub extern "C" fn process_with_callback(
    value: c_int,
    callback: Callback,
) -> c_int {
    callback(value * 2)
}

/// Callback with user data
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

### Calling C Callbacks from Rust

```rust
use std::os::raw::{c_int, c_void};

// Assume C library defines this function
extern "C" {
    fn c_sort(
        arr: *mut c_int,
        len: usize,
        compare: extern "C" fn(*const c_int, *const c_int) -> c_int,
    );
}

// Rust implementation of comparison function
extern "C" fn compare_ints(a: *const c_int, b: *const c_int) -> c_int {
    unsafe { *a - *b }
}

fn sort_array(arr: &mut [i32]) {
    unsafe {
        c_sort(arr.as_mut_ptr(), arr.len(), compare_ints);
    }
}
```

### Closures as Callbacks

Rust closures cannot be directly used as C callbacks; you need to use a trampoline function.

```rust
use std::os::raw::c_void;

/// Generic closure wrapper
pub struct CallbackWrapper<F> {
    callback: F,
}

/// Trampoline function
extern "C" fn trampoline<F>(data: *mut c_void)
where
    F: FnMut(),
{
    let wrapper = unsafe { &mut *(data as *mut CallbackWrapper<F>) };
    (wrapper.callback)();
}

/// Example using closure
pub fn with_callback<F>(mut callback: F)
where
    F: FnMut(),
{
    let mut wrapper = CallbackWrapper { callback };

    // Call function that accepts C callback
    unsafe {
        // Hypothetical C function
        // c_function(trampoline::<F>, &mut wrapper as *mut _ as *mut c_void);
    }
}

// Safer implementation
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

## bindgen: Automatically Generate Rust Bindings

bindgen can automatically generate Rust FFI bindings from C/C++ header files.

### Installation and Basic Usage

```bash
# Install bindgen CLI
cargo install bindgen-cli

# Generate bindings
bindgen wrapper.h -o bindings.rs
```

### Using in Build Scripts

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
    // Link library
    println!("cargo:rustc-link-lib=mylib");
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        // Only generate bindings for specified functions
        .allowlist_function("my_.*")
        // Only generate bindings for specified types
        .allowlist_type("my_.*")
        // Generate Debug trait
        .derive_debug(true)
        // Generate Default trait
        .derive_default(true)
        // Use core instead of std (for no_std)
        // .use_core()
        // Parse inline functions
        .generate_inline_functions(true)
        // Set clang arguments
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

### Complete Example: Binding zlib

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

/// Compress data
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

/// Decompress data
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

## cbindgen: Generate C Header Files

cbindgen can automatically generate C/C++ header files from Rust code.

### Installation and Configuration

```bash
# Install cbindgen
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

### Using Build Scripts

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

### Generating C++ Header Files

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

### Documentation Comments

cbindgen converts Rust documentation comments into C comments.

```rust
/// Represents a point in 2D space
///
/// # Example
/// ```c
/// Point p = point_new(1.0, 2.0);
/// ```
#[repr(C)]
pub struct Point {
    /// X coordinate
    pub x: f64,
    /// Y coordinate
    pub y: f64,
}

/// Create a new point
///
/// @param x X coordinate
/// @param y Y coordinate
/// @return The newly created point
#[no_mangle]
pub extern "C" fn point_new(x: f64, y: f64) -> Point {
    Point { x, y }
}
```

Generated header file:

```c
/* Generated by cbindgen */

#ifndef MY_RUST_LIB_H
#define MY_RUST_LIB_H

#include <stdint.h>

/**
 * Represents a point in 2D space
 *
 * # Example
 * ```c
 * Point p = point_new(1.0, 2.0);
 * ```
 */
typedef struct Point {
    /** X coordinate */
    double x;
    /** Y coordinate */
    double y;
} Point;

/**
 * Create a new point
 *
 * @param x X coordinate
 * @param y Y coordinate
 * @return The newly created point
 */
struct Point point_new(double x, double y);

#endif /* MY_RUST_LIB_H */
```

## Safety Considerations

### Common Pitfalls

#### Null Pointers

```rust
// Wrong: Not checking null pointer
#[no_mangle]
pub unsafe extern "C" fn bad_function(ptr: *const i32) -> i32 {
    *ptr  // Undefined behavior if ptr is null
}

// Correct: Check null pointer
#[no_mangle]
pub extern "C" fn good_function(ptr: *const i32) -> i32 {
    if ptr.is_null() {
        return -1;  // Or other error handling
    }
    unsafe { *ptr }
}
```

#### Dangling Pointers

```rust
// Wrong: Returning pointer to local variable
#[no_mangle]
pub extern "C" fn bad_string() -> *const u8 {
    let s = String::from("hello");
    s.as_ptr()  // s is freed when function ends!
}

// Correct: Use CString and transfer ownership
#[no_mangle]
pub extern "C" fn good_string() -> *mut std::os::raw::c_char {
    let s = std::ffi::CString::new("hello").unwrap();
    s.into_raw()  // Caller is responsible for freeing
}
```

#### Memory Leaks

```rust
use std::ffi::CString;

// Ensure corresponding free functions are provided
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

#### Buffer Overflow

```rust
use std::slice;

// Wrong: Trusting caller-provided length
#[no_mangle]
pub unsafe extern "C" fn bad_copy(src: *const u8, dst: *mut u8, len: usize) {
    let src_slice = slice::from_raw_parts(src, len);
    let dst_slice = slice::from_raw_parts_mut(dst, len);
    dst_slice.copy_from_slice(src_slice);
}

// Correct: Validate and limit length
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

#### Thread Safety

```rust
use std::sync::Mutex;

// Global state requires synchronization
static GLOBAL_STATE: Mutex<Vec<i32>> = Mutex::new(Vec::new());

#[no_mangle]
pub extern "C" fn add_to_global(value: i32) -> bool {
    match GLOBAL_STATE.lock() {
        Ok(mut guard) => {
            guard.push(value);
            true
        }
        Err(_) => false,  // Lock poisoned
    }
}
```

### Panic Handling

Rust panics crossing FFI boundaries is undefined behavior and must be caught.

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
            // Log error, return error code
            eprintln!("Panic occurred in safe_function");
            -1
        }
    }
}

// Simplify with macro
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
        // Code that might panic
        value.checked_mul(2).expect("Overflow")
    })
}
```

### Error Handling Patterns

```rust
use std::os::raw::{c_char, c_int};
use std::ffi::CString;
use std::ptr;
use std::cell::RefCell;

thread_local! {
    static LAST_ERROR: RefCell<Option<CString>> = RefCell::new(None);
}

/// Set thread-local error message
fn set_error(msg: &str) {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = CString::new(msg).ok();
    });
}

/// Get last error message
#[no_mangle]
pub extern "C" fn get_last_error() -> *const c_char {
    LAST_ERROR.with(|e| {
        match &*e.borrow() {
            Some(s) => s.as_ptr(),
            None => ptr::null(),
        }
    })
}

/// Clear error message
#[no_mangle]
pub extern "C" fn clear_error() {
    LAST_ERROR.with(|e| {
        *e.borrow_mut() = None;
    });
}

/// Function returning error code
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
    0  // Success
}
```

C-side usage:

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

## Practical Project: Wrapping SQLite

Let's comprehensively apply what we've learned through a complete example: creating a safe Rust wrapper for SQLite.

### Project Structure

```
sqlite-rs/
├── Cargo.toml
├── build.rs
├── wrapper.h
└── src/
    ├── lib.rs
    ├── raw.rs      # Raw bindings
    ├── database.rs # Database wrapper
    └── statement.rs # Statement wrapper
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

/// SQLite error
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

/// SQLite database connection
pub struct Database {
    handle: *mut sqlite3,
}

// Database can be transferred between threads but cannot be shared
unsafe impl Send for Database {}

impl Database {
    /// Open database
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

    /// Open in-memory database
    pub fn open_in_memory() -> Result<Self> {
        Self::open(":memory:")
    }

    /// Execute SQL statement
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

    /// Prepare SQL statement
    pub fn prepare(&self, sql: &str) -> Result<Statement> {
        Statement::new(self.handle, sql)
    }

    /// Get last insert row ID
    pub fn last_insert_rowid(&self) -> i64 {
        unsafe { sqlite3_last_insert_rowid(self.handle) }
    }

    /// Get number of rows affected by last operation
    pub fn changes(&self) -> i32 {
        unsafe { sqlite3_changes(self.handle) }
    }

    /// Get error message
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

    /// Get raw handle (for advanced usage)
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

/// Prepared SQL statement
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

    /// Bind integer parameter
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

    /// Bind text parameter
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
                // SQLITE_TRANSIENT means SQLite should copy this string
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

    /// Execute statement and return whether there are more rows
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

    /// Get integer column
    pub fn column_int(&self, index: i32) -> i32 {
        unsafe { sqlite3_column_int(self.handle, index) }
    }

    /// Get text column
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

    /// Get column count
    pub fn column_count(&self) -> i32 {
        self.column_count
    }

    /// Reset statement for re-execution
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

        // Create table
        db.execute(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER
            )"
        )?;

        // Insert data
        db.execute("INSERT INTO users (name, age) VALUES ('Alice', 30)")?;
        db.execute("INSERT INTO users (name, age) VALUES ('Bob', 25)")?;

        assert_eq!(db.changes(), 1);

        // Query data
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

## Summary

FFI is an important part of the Rust ecosystem, enabling Rust to interoperate with the vast C/C++ codebase. Key takeaways include:

### Core Concepts
- Use `extern "C"` and `#[no_mangle]` to ensure ABI compatibility
- Use `#[repr(C)]` to ensure struct memory layout matches C
- Handle type conversions correctly, especially strings and pointers

### Toolchain
- **bindgen**: Generate Rust bindings from C header files
- **cbindgen**: Generate C header files from Rust code
- **libc**: Provides C standard library type bindings

### Safety Practices
- Always check null pointers
- Properly manage memory lifetimes
- Use `catch_unwind` to prevent panics from crossing FFI boundaries
- Implement comprehensive error handling mechanisms
- Pay attention to thread safety issues

### Design Patterns
- Use opaque pointer pattern for complex types
- Provide corresponding create and destroy functions
- Use RAII to wrap unsafe FFI calls
- Isolate unsafe code at the bottom layer of safe abstractions

By following these principles and best practices, you can safely and efficiently interoperate between Rust and C, fully leveraging the strengths of both languages.
