---
title: Advanced bindgen Usage Guide
description: Complete guide to generating Rust FFI bindings from C/C++ headers using bindgen, including customization and best practices
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - FFI
  - bindgen
  - C
  - C++
  - Foreign Function Interface
status: imported
origin: old/src/content/docs/rust/bindgen.en.md
divergence: 0.223
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Rust
  subcategory: ""
  order: 12
  lastUpdated: 2026-01-21
---

bindgen automatically generates Rust FFI bindings to C (and some C++) libraries. It parses C/C++ header files and produces Rust code that allows safe interaction with native libraries.

## Concept Explanation

When interfacing Rust with C libraries, you need to declare the foreign functions, types, and constants in Rust. bindgen automates this tedious and error-prone process by reading C headers and generating corresponding Rust declarations.

```rust
// Instead of manually writing:
extern "C" {
    fn some_c_function(x: c_int) -> c_int;
}

#[repr(C)]
struct SomeCStruct {
    field1: c_int,
    field2: *mut c_char,
}

// bindgen generates these automatically from C headers:
// #include "some_library.h"
```

Basic usage in a build script:

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    // Tell cargo to invalidate the built crate whenever the wrapper changes
    println!("cargo:rerun-if-changed=wrapper.h");

    // Generate bindings
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    // Write the bindings to the $OUT_DIR/bindings.rs file
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

## Core Principles

### Builder Configuration

```rust
// build.rs with comprehensive configuration
use bindgen::Builder;

fn main() {
    let bindings = Builder::default()
        // Input header
        .header("wrapper.h")

        // Include paths
        .clang_arg("-I/usr/local/include")
        .clang_arg("-I./vendor/include")

        // Define macros
        .clang_arg("-DDEBUG=1")
        .clang_arg("-DPLATFORM_LINUX")

        // Allowlist specific items
        .allowlist_function("my_lib_.*")
        .allowlist_type("MyLib.*")
        .allowlist_var("MY_LIB_.*")

        // Blocklist items
        .blocklist_function("internal_.*")
        .blocklist_type("__.*")

        // Type settings
        .default_enum_style(bindgen::EnumVariation::Rust {
            non_exhaustive: true,
        })
        .bitfield_enum("MyFlags")
        .rustified_enum("MyEnum")

        // Layout tests
        .layout_tests(true)

        // Derive traits
        .derive_debug(true)
        .derive_default(true)
        .derive_eq(true)
        .derive_hash(true)
        .derive_partialeq(true)

        // Use core instead of std
        .use_core()

        // Generate inline functions
        .generate_inline_functions(true)

        // Callback handling
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))

        .generate()
        .expect("Unable to generate bindings");

    // Write to file
    let out_path = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

### Custom Parse Callbacks

```rust
use bindgen::callbacks::{ParseCallbacks, IntKind, EnumVariantValue};

#[derive(Debug)]
struct CustomCallbacks;

impl ParseCallbacks for CustomCallbacks {
    // Rename items
    fn item_name(&self, original_item_name: &str) -> Option<String> {
        // Remove common prefixes
        if let Some(stripped) = original_item_name.strip_prefix("mylib_") {
            Some(stripped.to_string())
        } else {
            None
        }
    }

    // Determine integer types for constants
    fn int_macro(&self, name: &str, _value: i64) -> Option<IntKind> {
        if name.starts_with("FLAG_") {
            Some(IntKind::U32)
        } else if name.starts_with("ERROR_") {
            Some(IntKind::I32)
        } else {
            None
        }
    }

    // Handle enum variants
    fn enum_variant_name(
        &self,
        enum_name: Option<&str>,
        original_variant_name: &str,
        _variant_value: EnumVariantValue,
    ) -> Option<String> {
        // Remove enum prefix from variant names
        if let Some(enum_name) = enum_name {
            let prefix = format!("{}_", enum_name.to_uppercase());
            if let Some(stripped) = original_variant_name.strip_prefix(&prefix) {
                return Some(stripped.to_string());
            }
        }
        None
    }

    // Add derives to specific types
    fn add_derives(&self, info: &bindgen::callbacks::DeriveInfo<'_>) -> Vec<String> {
        if info.name.starts_with("My") {
            vec!["serde::Serialize".to_string(), "serde::Deserialize".to_string()]
        } else {
            vec![]
        }
    }

    // Blocklist specific items programmatically
    fn blocklisted_type_implements_trait(
        &self,
        _name: &str,
        derive_trait: bindgen::callbacks::DeriveTrait,
    ) -> Option<bindgen::callbacks::ImplementsTrait> {
        // Assume blocklisted types implement Debug
        if derive_trait == bindgen::callbacks::DeriveTrait::Debug {
            Some(bindgen::callbacks::ImplementsTrait::Yes)
        } else {
            None
        }
    }
}

// Usage
fn main() {
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(CustomCallbacks))
        .generate()
        .expect("Unable to generate bindings");
}
```

## Key Concepts

### Handling Different C Types

```rust
// wrapper.h
/*
// Fixed-size arrays
typedef struct {
    int data[10];
    char name[256];
} ArrayStruct;

// Pointers and arrays
typedef struct {
    int* dynamic_array;
    size_t length;
    const char* name;
} PointerStruct;

// Unions
typedef union {
    int i;
    float f;
    char c[4];
} MyUnion;

// Bitfields
typedef struct {
    unsigned int flag1 : 1;
    unsigned int flag2 : 1;
    unsigned int value : 6;
} BitfieldStruct;

// Function pointers
typedef int (*callback_fn)(void* user_data, int value);

typedef struct {
    callback_fn on_event;
    void* user_data;
} CallbackStruct;
*/

// Generated Rust (simplified):
#[repr(C)]
pub struct ArrayStruct {
    pub data: [c_int; 10],
    pub name: [c_char; 256],
}

#[repr(C)]
pub struct PointerStruct {
    pub dynamic_array: *mut c_int,
    pub length: usize,
    pub name: *const c_char,
}

#[repr(C)]
pub union MyUnion {
    pub i: c_int,
    pub f: c_float,
    pub c: [c_char; 4],
}

// Bitfields become regular struct with accessor methods
#[repr(C)]
pub struct BitfieldStruct {
    _bitfield: u8,
}

impl BitfieldStruct {
    pub fn flag1(&self) -> u32 { /* ... */ }
    pub fn set_flag1(&mut self, val: u32) { /* ... */ }
    pub fn flag2(&self) -> u32 { /* ... */ }
    pub fn set_flag2(&mut self, val: u32) { /* ... */ }
    pub fn value(&self) -> u32 { /* ... */ }
    pub fn set_value(&mut self, val: u32) { /* ... */ }
}

pub type callback_fn = Option<unsafe extern "C" fn(
    user_data: *mut c_void,
    value: c_int,
) -> c_int>;

#[repr(C)]
pub struct CallbackStruct {
    pub on_event: callback_fn,
    pub user_data: *mut c_void,
}
```

### Enum Handling Strategies

```rust
// build.rs - Different enum strategies

// C header:
// typedef enum {
//     STATUS_OK = 0,
//     STATUS_ERROR = 1,
//     STATUS_PENDING = 2,
// } Status;
//
// typedef enum {
//     FLAG_READ = 1,
//     FLAG_WRITE = 2,
//     FLAG_EXEC = 4,
// } Flags;

let bindings = bindgen::Builder::default()
    .header("wrapper.h")

    // Default: generates consts
    // pub const STATUS_OK: Status = 0;
    // pub const STATUS_ERROR: Status = 1;
    // pub type Status = c_uint;

    // Rustified enum - safe, exhaustive
    .rustified_enum("Status")
    // #[repr(u32)]
    // pub enum Status {
    //     STATUS_OK = 0,
    //     STATUS_ERROR = 1,
    //     STATUS_PENDING = 2,
    // }

    // Rustified non-exhaustive enum
    .rustified_non_exhaustive_enum("ExtensibleStatus")
    // #[repr(u32)]
    // #[non_exhaustive]
    // pub enum ExtensibleStatus { ... }

    // Bitfield enum for flags
    .bitfield_enum("Flags")
    // impl Flags {
    //     pub const FLAG_READ: Self = Self(1);
    //     pub const FLAG_WRITE: Self = Self(2);
    //     pub const FLAG_EXEC: Self = Self(4);
    // }

    // Newtype enum (wraps the underlying integer)
    .newtype_enum("OpaqueEnum")
    // #[repr(transparent)]
    // pub struct OpaqueEnum(pub c_uint);

    // Constified enum module
    .constified_enum_module("ModuleEnum")
    // pub mod ModuleEnum {
    //     pub const VALUE_A: Type = 0;
    //     pub const VALUE_B: Type = 1;
    // }

    .generate()
    .unwrap();
```

### Opaque Types and Forward Declarations

```rust
// When you can't or don't want to expose struct internals

// C header:
// struct OpaqueHandle; // Forward declaration only
// typedef struct OpaqueHandle* handle_t;
//
// handle_t create_handle(void);
// void destroy_handle(handle_t h);
// int use_handle(handle_t h, int value);

// build.rs
let bindings = bindgen::Builder::default()
    .header("wrapper.h")
    .opaque_type("OpaqueHandle")
    .generate()
    .unwrap();

// Generated:
#[repr(C)]
pub struct OpaqueHandle {
    _unused: [u8; 0],
}

pub type handle_t = *mut OpaqueHandle;

extern "C" {
    pub fn create_handle() -> handle_t;
    pub fn destroy_handle(h: handle_t);
    pub fn use_handle(h: handle_t, value: c_int) -> c_int;
}

// Safe Rust wrapper:
pub struct Handle {
    ptr: handle_t,
}

impl Handle {
    pub fn new() -> Option<Self> {
        let ptr = unsafe { create_handle() };
        if ptr.is_null() {
            None
        } else {
            Some(Handle { ptr })
        }
    }

    pub fn use_value(&self, value: i32) -> i32 {
        unsafe { use_handle(self.ptr, value as c_int) as i32 }
    }
}

impl Drop for Handle {
    fn drop(&mut self) {
        unsafe { destroy_handle(self.ptr) };
    }
}
```

## Code Examples

### Complete Build Script with Library Linking

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    // Tell cargo to look for shared libraries in the specified directory
    println!("cargo:rustc-link-search=/usr/local/lib");
    println!("cargo:rustc-link-search=native=./lib");

    // Tell cargo to tell rustc to link the system library
    println!("cargo:rustc-link-lib=mylib");

    // For static linking:
    // println!("cargo:rustc-link-lib=static=mylib");

    // For dynamic linking (explicit):
    // println!("cargo:rustc-link-lib=dylib=mylib");

    // Rerun if these change
    println!("cargo:rerun-if-changed=wrapper.h");
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-env-changed=MYLIB_DIR");

    // Handle custom library location
    if let Ok(lib_dir) = env::var("MYLIB_DIR") {
        println!("cargo:rustc-link-search=native={}", lib_dir);
    }

    // pkg-config integration
    #[cfg(feature = "pkg-config")]
    {
        if let Ok(lib) = pkg_config::probe_library("mylib") {
            for path in lib.include_paths {
                println!("cargo:include={}", path.display());
            }
        }
    }

    // Generate bindings
    let mut builder = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()));

    // Add include paths from environment
    if let Ok(include_dir) = env::var("MYLIB_INCLUDE") {
        builder = builder.clang_arg(format!("-I{}", include_dir));
    }

    // Platform-specific configuration
    #[cfg(target_os = "macos")]
    {
        builder = builder.clang_arg("-I/opt/homebrew/include");
    }

    #[cfg(target_os = "linux")]
    {
        builder = builder.clang_arg("-I/usr/include");
    }

    let bindings = builder.generate().expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

### Safe Wrapper Pattern

```rust
// src/lib.rs
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]

// Include the generated bindings
mod ffi {
    include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
}

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// Error handling
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    NullPointer,
    InvalidArgument,
    LibraryError(i32),
    Utf8Error(std::str::Utf8Error),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::NullPointer => write!(f, "Null pointer"),
            Error::InvalidArgument => write!(f, "Invalid argument"),
            Error::LibraryError(code) => write!(f, "Library error: {}", code),
            Error::Utf8Error(e) => write!(f, "UTF-8 error: {}", e),
        }
    }
}

impl std::error::Error for Error {}

pub type Result<T> = std::result::Result<T, Error>;

// Safe wrapper for library context
pub struct Context {
    ptr: *mut ffi::context_t,
}

// Ensure the context can be sent between threads if the C library is thread-safe
unsafe impl Send for Context {}
// unsafe impl Sync for Context {}  // Only if truly thread-safe

impl Context {
    pub fn new(config: &str) -> Result<Self> {
        let c_config = CString::new(config).map_err(|_| Error::InvalidArgument)?;

        let ptr = unsafe { ffi::context_create(c_config.as_ptr()) };

        if ptr.is_null() {
            Err(Error::NullPointer)
        } else {
            Ok(Context { ptr })
        }
    }

    pub fn process(&self, data: &[u8]) -> Result<Vec<u8>> {
        let mut output_len: usize = 0;
        let output_ptr = unsafe {
            ffi::context_process(
                self.ptr,
                data.as_ptr() as *const c_char,
                data.len(),
                &mut output_len,
            )
        };

        if output_ptr.is_null() {
            let error_code = unsafe { ffi::context_get_error(self.ptr) };
            return Err(Error::LibraryError(error_code));
        }

        let output = unsafe {
            std::slice::from_raw_parts(output_ptr as *const u8, output_len).to_vec()
        };

        // Free the library-allocated memory
        unsafe { ffi::context_free_buffer(output_ptr) };

        Ok(output)
    }

    pub fn get_name(&self) -> Result<String> {
        let name_ptr = unsafe { ffi::context_get_name(self.ptr) };

        if name_ptr.is_null() {
            return Err(Error::NullPointer);
        }

        let name = unsafe { CStr::from_ptr(name_ptr) }
            .to_str()
            .map_err(Error::Utf8Error)?
            .to_owned();

        Ok(name)
    }
}

impl Drop for Context {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe { ffi::context_destroy(self.ptr) };
        }
    }
}

// Callback wrapper
pub struct CallbackHandler<F>
where
    F: FnMut(i32) -> i32,
{
    callback: F,
}

impl<F> CallbackHandler<F>
where
    F: FnMut(i32) -> i32,
{
    pub fn new(callback: F) -> Self {
        CallbackHandler { callback }
    }

    pub fn register(&mut self, ctx: &Context) {
        unsafe extern "C" fn trampoline<F>(
            user_data: *mut std::ffi::c_void,
            value: i32,
        ) -> i32
        where
            F: FnMut(i32) -> i32,
        {
            let callback = &mut *(user_data as *mut F);
            callback(value)
        }

        unsafe {
            ffi::context_set_callback(
                ctx.ptr,
                Some(trampoline::<F>),
                &mut self.callback as *mut F as *mut std::ffi::c_void,
            );
        }
    }
}
```

### C++ Bindings with cxx

```rust
// For C++ with complex types, consider using cxx alongside bindgen

// build.rs
fn main() {
    // bindgen for C-compatible parts
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .allowlist_function("c_api_.*")
        .generate()
        .unwrap();

    // cxx for C++ specific parts
    cxx_build::bridge("src/bridge.rs")
        .file("src/cpp_bridge.cc")
        .flag_if_supported("-std=c++17")
        .compile("cpp_bridge");
}

// src/bridge.rs
#[cxx::bridge]
mod ffi {
    unsafe extern "C++" {
        include!("mylib/cpp_types.h");

        type CppClass;

        fn create_instance() -> UniquePtr<CppClass>;
        fn process(self: &CppClass, input: &str) -> String;
    }
}
```

## Best Practices

### 1. Organize Bindings Properly

```rust
// src/ffi.rs - Raw bindings module
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]
#![allow(clippy::all)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

// src/safe_api.rs - Safe wrappers
use crate::ffi;

pub struct SafeWrapper { /* ... */ }

// src/lib.rs - Public API
mod ffi;
mod safe_api;

pub use safe_api::SafeWrapper;
// Don't re-export raw ffi unless necessary
```

### 2. Handle Memory Safely

```rust
// Wrapper that ensures proper cleanup
pub struct OwnedBuffer {
    ptr: *mut u8,
    len: usize,
    cap: usize,
}

impl OwnedBuffer {
    /// Creates a buffer from library-allocated memory
    ///
    /// # Safety
    /// The pointer must have been allocated by the library's allocator
    pub unsafe fn from_raw(ptr: *mut u8, len: usize) -> Self {
        OwnedBuffer { ptr, len, cap: len }
    }

    pub fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }

    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.ptr, self.len) }
    }
}

impl Drop for OwnedBuffer {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe { ffi::lib_free(self.ptr as *mut std::ffi::c_void) };
        }
    }
}

impl AsRef<[u8]> for OwnedBuffer {
    fn as_ref(&self) -> &[u8] {
        self.as_slice()
    }
}
```

### 3. Use Feature Flags for Optional Dependencies

```toml
# Cargo.toml
[features]
default = []
vendored = ["dep:cc"]
system = []

[build-dependencies]
bindgen = "0.69"
pkg-config = { version = "0.3", optional = true }
cc = { version = "1.0", optional = true }
```

```rust
// build.rs
fn main() {
    #[cfg(feature = "vendored")]
    {
        // Build the C library from source
        cc::Build::new()
            .file("vendor/mylib.c")
            .include("vendor/include")
            .compile("mylib");
    }

    #[cfg(feature = "system")]
    {
        // Use system library
        pkg_config::probe_library("mylib").unwrap();
    }

    // Generate bindings...
}
```

## Common Pitfalls

### 1. Missing Null Checks

```rust
// BAD: Assumes pointer is valid
pub fn get_string(ctx: &Context) -> String {
    let ptr = unsafe { ffi::get_string(ctx.ptr) };
    unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned()
}

// GOOD: Handle null pointers
pub fn get_string(ctx: &Context) -> Option<String> {
    let ptr = unsafe { ffi::get_string(ctx.ptr) };
    if ptr.is_null() {
        return None;
    }
    Some(unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned())
}
```

### 2. Memory Ownership Confusion

```rust
// The C library might:
// 1. Return a pointer to static memory (don't free)
// 2. Return a pointer that the caller must free
// 3. Return a pointer that's only valid until the next call

// Document ownership clearly!

/// Returns a string that must be freed with `lib_free_string`
pub fn get_owned_string(ctx: &Context) -> Result<String> {
    let ptr = unsafe { ffi::get_owned_string(ctx.ptr) };
    if ptr.is_null() {
        return Err(Error::NullPointer);
    }

    let string = unsafe { CStr::from_ptr(ptr) }
        .to_str()
        .map_err(Error::Utf8Error)?
        .to_owned();

    // Free after copying
    unsafe { ffi::lib_free_string(ptr) };

    Ok(string)
}

/// Returns a reference to an internal string (valid while ctx is valid)
pub fn get_static_string(ctx: &Context) -> Result<&str> {
    let ptr = unsafe { ffi::get_static_string(ctx.ptr) };
    if ptr.is_null() {
        return Err(Error::NullPointer);
    }

    unsafe { CStr::from_ptr(ptr) }
        .to_str()
        .map_err(Error::Utf8Error)
}
```

### 3. Thread Safety Assumptions

```rust
// Don't assume thread safety - check the C library documentation!

// If the library is NOT thread-safe, don't implement Sync
pub struct NotThreadSafe {
    ptr: *mut ffi::context_t,
    // Add PhantomData to prevent Sync auto-implementation
    _marker: std::marker::PhantomData<*mut ()>,
}

// Only implement Send/Sync if you've verified thread safety
unsafe impl Send for ThreadSafeHandle {}
unsafe impl Sync for ThreadSafeHandle {}
```

## Performance Considerations

### Minimize FFI Boundary Crossings

```rust
// BAD: Many small calls
pub fn sum_array(arr: &[i32]) -> i32 {
    let mut sum = 0;
    for &x in arr {
        sum = unsafe { ffi::add(sum, x) };  // FFI call per element!
    }
    sum
}

// GOOD: Single bulk call
pub fn sum_array(arr: &[i32]) -> i32 {
    unsafe { ffi::sum_array(arr.as_ptr(), arr.len()) }
}
```

### Batch Operations

```rust
// If the C library supports it, batch operations
pub fn process_batch(&self, items: &[Item]) -> Vec<Result<Output>> {
    // Prepare all inputs
    let c_items: Vec<ffi::item_t> = items.iter().map(|i| i.to_ffi()).collect();

    // Single FFI call for batch
    let mut results: Vec<ffi::result_t> = vec![Default::default(); items.len()];

    unsafe {
        ffi::process_batch(
            self.ptr,
            c_items.as_ptr(),
            results.as_mut_ptr(),
            items.len(),
        );
    }

    // Convert results
    results.into_iter().map(|r| Output::from_ffi(r)).collect()
}
```

## Interview Key Points

1. **bindgen purpose**:
   - Automatically generates Rust FFI bindings from C/C++ headers
   - Eliminates manual, error-prone extern declarations

2. **Build script integration**:
   - Use `build.rs` to generate bindings at compile time
   - `cargo:rerun-if-changed` for incremental builds
   - Link libraries with `cargo:rustc-link-lib`

3. **Safety considerations**:
   - Raw bindings are `unsafe`
   - Create safe wrappers that handle null checks
   - Manage memory ownership carefully
   - Consider thread safety implications

4. **Customization**:
   - Allowlist/blocklist functions and types
   - Enum handling strategies
   - Custom parse callbacks for naming

5. **Common patterns**:
   - Opaque types for forward declarations
   - RAII wrappers with `Drop`
   - Callback trampolines for closures

## Further Reading

- [bindgen User Guide](https://rust-lang.github.io/rust-bindgen/)
- [The Rustonomicon - FFI](https://doc.rust-lang.org/nomicon/ffi.html)
- [Rust FFI Omnibus](http://jakegoulding.com/rust-ffi-omnibus/)
- [cxx for C++ interop](https://cxx.rs/)
