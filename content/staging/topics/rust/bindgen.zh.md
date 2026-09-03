---
title: bindgen 高级使用指南
description: 使用 bindgen 从 C/C++ 头文件生成 Rust FFI 绑定的完整指南，包括自定义和最佳实践
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - FFI
  - bindgen
  - C
  - C++
  - 外部函数接口
status: imported
origin: old/src/content/docs/rust/bindgen.zh.md
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

bindgen 自动从 C（和部分 C++）库生成 Rust FFI 绑定。它解析 C/C++ 头文件并生成 Rust 代码，使得与原生库的安全交互成为可能。

## 概念解释

当 Rust 与 C 库交互时，需要在 Rust 中声明外部函数、类型和常量。bindgen 通过读取 C 头文件并生成对应的 Rust 声明来自动化这个繁琐且容易出错的过程。

```rust
// 而不是手动编写：
extern "C" {
    fn some_c_function(x: c_int) -> c_int;
}

#[repr(C)]
struct SomeCStruct {
    field1: c_int,
    field2: *mut c_char,
}

// bindgen 从 C 头文件自动生成这些：
// #include "some_library.h"
```

构建脚本中的基本用法：

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    // 告诉 cargo 当 wrapper 改变时使已构建的 crate 失效
    println!("cargo:rerun-if-changed=wrapper.h");

    // 生成绑定
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("无法生成绑定");

    // 将绑定写入 $OUT_DIR/bindings.rs 文件
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("无法写入绑定！");
}
```

## 核心原理

### Builder 配置

```rust
// build.rs 完整配置
use bindgen::Builder;

fn main() {
    let bindings = Builder::default()
        // 输入头文件
        .header("wrapper.h")

        // 包含路径
        .clang_arg("-I/usr/local/include")
        .clang_arg("-I./vendor/include")

        // 定义宏
        .clang_arg("-DDEBUG=1")
        .clang_arg("-DPLATFORM_LINUX")

        // 允许列表指定项目
        .allowlist_function("my_lib_.*")
        .allowlist_type("MyLib.*")
        .allowlist_var("MY_LIB_.*")

        // 阻止列表项目
        .blocklist_function("internal_.*")
        .blocklist_type("__.*")

        // 类型设置
        .default_enum_style(bindgen::EnumVariation::Rust {
            non_exhaustive: true,
        })
        .bitfield_enum("MyFlags")
        .rustified_enum("MyEnum")

        // 布局测试
        .layout_tests(true)

        // 派生 trait
        .derive_debug(true)
        .derive_default(true)
        .derive_eq(true)
        .derive_hash(true)
        .derive_partialeq(true)

        // 使用 core 而非 std
        .use_core()

        // 生成内联函数
        .generate_inline_functions(true)

        // 回调处理
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))

        .generate()
        .expect("无法生成绑定");

    // 写入文件
    let out_path = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("无法写入绑定！");
}
```

### 自定义解析回调

```rust
use bindgen::callbacks::{ParseCallbacks, IntKind, EnumVariantValue};

#[derive(Debug)]
struct CustomCallbacks;

impl ParseCallbacks for CustomCallbacks {
    // 重命名项目
    fn item_name(&self, original_item_name: &str) -> Option<String> {
        // 移除常见前缀
        if let Some(stripped) = original_item_name.strip_prefix("mylib_") {
            Some(stripped.to_string())
        } else {
            None
        }
    }

    // 确定常量的整数类型
    fn int_macro(&self, name: &str, _value: i64) -> Option<IntKind> {
        if name.starts_with("FLAG_") {
            Some(IntKind::U32)
        } else if name.starts_with("ERROR_") {
            Some(IntKind::I32)
        } else {
            None
        }
    }

    // 处理枚举变体
    fn enum_variant_name(
        &self,
        enum_name: Option<&str>,
        original_variant_name: &str,
        _variant_value: EnumVariantValue,
    ) -> Option<String> {
        // 从变体名称中移除枚举前缀
        if let Some(enum_name) = enum_name {
            let prefix = format!("{}_", enum_name.to_uppercase());
            if let Some(stripped) = original_variant_name.strip_prefix(&prefix) {
                return Some(stripped.to_string());
            }
        }
        None
    }

    // 为特定类型添加派生
    fn add_derives(&self, info: &bindgen::callbacks::DeriveInfo<'_>) -> Vec<String> {
        if info.name.starts_with("My") {
            vec!["serde::Serialize".to_string(), "serde::Deserialize".to_string()]
        } else {
            vec![]
        }
    }

    // 以编程方式阻止特定项目
    fn blocklisted_type_implements_trait(
        &self,
        _name: &str,
        derive_trait: bindgen::callbacks::DeriveTrait,
    ) -> Option<bindgen::callbacks::ImplementsTrait> {
        // 假设被阻止的类型实现了 Debug
        if derive_trait == bindgen::callbacks::DeriveTrait::Debug {
            Some(bindgen::callbacks::ImplementsTrait::Yes)
        } else {
            None
        }
    }
}

// 使用
fn main() {
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(CustomCallbacks))
        .generate()
        .expect("无法生成绑定");
}
```

## 核心要点

### 处理不同的 C 类型

```rust
// wrapper.h
/*
// 固定大小数组
typedef struct {
    int data[10];
    char name[256];
} ArrayStruct;

// 指针和数组
typedef struct {
    int* dynamic_array;
    size_t length;
    const char* name;
} PointerStruct;

// 联合体
typedef union {
    int i;
    float f;
    char c[4];
} MyUnion;

// 位字段
typedef struct {
    unsigned int flag1 : 1;
    unsigned int flag2 : 1;
    unsigned int value : 6;
} BitfieldStruct;

// 函数指针
typedef int (*callback_fn)(void* user_data, int value);

typedef struct {
    callback_fn on_event;
    void* user_data;
} CallbackStruct;
*/

// 生成的 Rust（简化版）：
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

// 位字段变成带有访问器方法的普通结构体
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

### 枚举处理策略

```rust
// build.rs - 不同的枚举策略

// C 头文件：
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

    // 默认：生成常量
    // pub const STATUS_OK: Status = 0;
    // pub const STATUS_ERROR: Status = 1;
    // pub type Status = c_uint;

    // Rust 化枚举 - 安全、穷尽
    .rustified_enum("Status")
    // #[repr(u32)]
    // pub enum Status {
    //     STATUS_OK = 0,
    //     STATUS_ERROR = 1,
    //     STATUS_PENDING = 2,
    // }

    // Rust 化非穷尽枚举
    .rustified_non_exhaustive_enum("ExtensibleStatus")
    // #[repr(u32)]
    // #[non_exhaustive]
    // pub enum ExtensibleStatus { ... }

    // 位字段枚举用于标志
    .bitfield_enum("Flags")
    // impl Flags {
    //     pub const FLAG_READ: Self = Self(1);
    //     pub const FLAG_WRITE: Self = Self(2);
    //     pub const FLAG_EXEC: Self = Self(4);
    // }

    // 新类型枚举（包装底层整数）
    .newtype_enum("OpaqueEnum")
    // #[repr(transparent)]
    // pub struct OpaqueEnum(pub c_uint);

    // 常量化枚举模块
    .constified_enum_module("ModuleEnum")
    // pub mod ModuleEnum {
    //     pub const VALUE_A: Type = 0;
    //     pub const VALUE_B: Type = 1;
    // }

    .generate()
    .unwrap();
```

### 不透明类型和前向声明

```rust
// 当你无法或不想暴露结构体内部时

// C 头文件：
// struct OpaqueHandle; // 仅前向声明
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

// 生成的代码：
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

// 安全的 Rust 包装器：
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

## 代码示例

### 完整的带库链接的构建脚本

```rust
// build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    // 告诉 cargo 在指定目录中查找共享库
    println!("cargo:rustc-link-search=/usr/local/lib");
    println!("cargo:rustc-link-search=native=./lib");

    // 告诉 cargo 告诉 rustc 链接系统库
    println!("cargo:rustc-link-lib=mylib");

    // 静态链接：
    // println!("cargo:rustc-link-lib=static=mylib");

    // 动态链接（显式）：
    // println!("cargo:rustc-link-lib=dylib=mylib");

    // 如果这些改变则重新运行
    println!("cargo:rerun-if-changed=wrapper.h");
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-env-changed=MYLIB_DIR");

    // 处理自定义库位置
    if let Ok(lib_dir) = env::var("MYLIB_DIR") {
        println!("cargo:rustc-link-search=native={}", lib_dir);
    }

    // pkg-config 集成
    #[cfg(feature = "pkg-config")]
    {
        if let Ok(lib) = pkg_config::probe_library("mylib") {
            for path in lib.include_paths {
                println!("cargo:include={}", path.display());
            }
        }
    }

    // 生成绑定
    let mut builder = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()));

    // 从环境变量添加包含路径
    if let Ok(include_dir) = env::var("MYLIB_INCLUDE") {
        builder = builder.clang_arg(format!("-I{}", include_dir));
    }

    // 平台特定配置
    #[cfg(target_os = "macos")]
    {
        builder = builder.clang_arg("-I/opt/homebrew/include");
    }

    #[cfg(target_os = "linux")]
    {
        builder = builder.clang_arg("-I/usr/include");
    }

    let bindings = builder.generate().expect("无法生成绑定");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("无法写入绑定！");
}
```

### 安全包装器模式

```rust
// src/lib.rs
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]

// 包含生成的绑定
mod ffi {
    include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
}

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// 错误处理
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
            Error::NullPointer => write!(f, "空指针"),
            Error::InvalidArgument => write!(f, "无效参数"),
            Error::LibraryError(code) => write!(f, "库错误：{}", code),
            Error::Utf8Error(e) => write!(f, "UTF-8 错误：{}", e),
        }
    }
}

impl std::error::Error for Error {}

pub type Result<T> = std::result::Result<T, Error>;

// 库上下文的安全包装器
pub struct Context {
    ptr: *mut ffi::context_t,
}

// 如果 C 库是线程安全的，确保上下文可以在线程间发送
unsafe impl Send for Context {}
// unsafe impl Sync for Context {}  // 仅当确实线程安全时

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

        // 释放库分配的内存
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

// 回调包装器
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

### 带 cxx 的 C++ 绑定

```rust
// 对于具有复杂类型的 C++，考虑与 bindgen 一起使用 cxx

// build.rs
fn main() {
    // bindgen 用于 C 兼容部分
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .allowlist_function("c_api_.*")
        .generate()
        .unwrap();

    // cxx 用于 C++ 特定部分
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

## 最佳实践

### 1. 正确组织绑定

```rust
// src/ffi.rs - 原始绑定模块
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]
#![allow(clippy::all)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

// src/safe_api.rs - 安全包装器
use crate::ffi;

pub struct SafeWrapper { /* ... */ }

// src/lib.rs - 公共 API
mod ffi;
mod safe_api;

pub use safe_api::SafeWrapper;
// 除非必要，不要重新导出原始 ffi
```

### 2. 安全处理内存

```rust
// 确保正确清理的包装器
pub struct OwnedBuffer {
    ptr: *mut u8,
    len: usize,
    cap: usize,
}

impl OwnedBuffer {
    /// 从库分配的内存创建缓冲区
    ///
    /// # Safety
    /// 指针必须是由库的分配器分配的
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

### 3. 使用功能标志处理可选依赖

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
        // 从源代码构建 C 库
        cc::Build::new()
            .file("vendor/mylib.c")
            .include("vendor/include")
            .compile("mylib");
    }

    #[cfg(feature = "system")]
    {
        // 使用系统库
        pkg_config::probe_library("mylib").unwrap();
    }

    // 生成绑定...
}
```

## 常见陷阱

### 1. 缺少空指针检查

```rust
// 错误：假设指针有效
pub fn get_string(ctx: &Context) -> String {
    let ptr = unsafe { ffi::get_string(ctx.ptr) };
    unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned()
}

// 正确：处理空指针
pub fn get_string(ctx: &Context) -> Option<String> {
    let ptr = unsafe { ffi::get_string(ctx.ptr) };
    if ptr.is_null() {
        return None;
    }
    Some(unsafe { CStr::from_ptr(ptr) }.to_string_lossy().into_owned())
}
```

### 2. 内存所有权混淆

```rust
// C 库可能：
// 1. 返回指向静态内存的指针（不要释放）
// 2. 返回调用者必须释放的指针
// 3. 返回只在下次调用前有效的指针

// 清楚地记录所有权！

/// 返回必须使用 `lib_free_string` 释放的字符串
pub fn get_owned_string(ctx: &Context) -> Result<String> {
    let ptr = unsafe { ffi::get_owned_string(ctx.ptr) };
    if ptr.is_null() {
        return Err(Error::NullPointer);
    }

    let string = unsafe { CStr::from_ptr(ptr) }
        .to_str()
        .map_err(Error::Utf8Error)?
        .to_owned();

    // 复制后释放
    unsafe { ffi::lib_free_string(ptr) };

    Ok(string)
}

/// 返回对内部字符串的引用（在 ctx 有效期间有效）
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

### 3. 线程安全假设

```rust
// 不要假设线程安全 - 检查 C 库文档！

// 如果库不是线程安全的，不要实现 Sync
pub struct NotThreadSafe {
    ptr: *mut ffi::context_t,
    // 添加 PhantomData 以防止 Sync 自动实现
    _marker: std::marker::PhantomData<*mut ()>,
}

// 只有在验证了线程安全后才实现 Send/Sync
unsafe impl Send for ThreadSafeHandle {}
unsafe impl Sync for ThreadSafeHandle {}
```

## 性能考量

### 最小化 FFI 边界跨越

```rust
// 错误：许多小调用
pub fn sum_array(arr: &[i32]) -> i32 {
    let mut sum = 0;
    for &x in arr {
        sum = unsafe { ffi::add(sum, x) };  // 每个元素一次 FFI 调用！
    }
    sum
}

// 正确：单次批量调用
pub fn sum_array(arr: &[i32]) -> i32 {
    unsafe { ffi::sum_array(arr.as_ptr(), arr.len()) }
}
```

### 批量操作

```rust
// 如果 C 库支持，批量操作
pub fn process_batch(&self, items: &[Item]) -> Vec<Result<Output>> {
    // 准备所有输入
    let c_items: Vec<ffi::item_t> = items.iter().map(|i| i.to_ffi()).collect();

    // 单次 FFI 调用进行批量处理
    let mut results: Vec<ffi::result_t> = vec![Default::default(); items.len()];

    unsafe {
        ffi::process_batch(
            self.ptr,
            c_items.as_ptr(),
            results.as_mut_ptr(),
            items.len(),
        );
    }

    // 转换结果
    results.into_iter().map(|r| Output::from_ffi(r)).collect()
}
```

## 面试要点

1. **bindgen 用途**：
   - 从 C/C++ 头文件自动生成 Rust FFI 绑定
   - 消除手动、易出错的 extern 声明

2. **构建脚本集成**：
   - 使用 `build.rs` 在编译时生成绑定
   - `cargo:rerun-if-changed` 用于增量构建
   - 使用 `cargo:rustc-link-lib` 链接库

3. **安全考虑**：
   - 原始绑定是 `unsafe` 的
   - 创建处理空指针检查的安全包装器
   - 仔细管理内存所有权
   - 考虑线程安全影响

4. **自定义**：
   - 允许/阻止列表函数和类型
   - 枚举处理策略
   - 用于命名的自定义解析回调

5. **常见模式**：
   - 前向声明的不透明类型
   - 带 `Drop` 的 RAII 包装器
   - 闭包的回调跳板

## 延伸阅读

- [bindgen 用户指南](https://rust-lang.github.io/rust-bindgen/)
- [Rustonomicon - FFI](https://doc.rust-lang.org/nomicon/ffi.html)
- [Rust FFI 全书](http://jakegoulding.com/rust-ffi-omnibus/)
- [cxx 用于 C++ 互操作](https://cxx.rs/)
