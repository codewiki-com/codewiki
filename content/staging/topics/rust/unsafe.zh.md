---
title: Unsafe Rust
description: Rust unsafe完全指南，原始指针、FFI与内存安全边界
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - unsafe
  - 原始指针
  - FFI
status: imported
origin: old/src/content/docs/rust/unsafe.zh.md
divergence: 0.259
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Rust
  subcategory: 高级特性
  order: 10
  lastUpdated: 2026-01-07
---

Rust 以其强大的内存安全保证而闻名，但有时候我们需要突破这些限制。`unsafe` 关键字允许我们进入一个编译器无法保证安全性的领域，在这里我们需要自己承担确保代码正确性的责任。

## 为什么需要 Unsafe Rust

Rust 编译器非常保守。当它无法确定代码是否安全时，宁可拒绝编译也不冒险。但某些操作本质上是安全的，只是编译器无法证明：

1. **底层系统编程**：直接操作硬件、实现操作系统内核
2. **性能优化**：绕过某些运行时检查以获得极致性能
3. **与其他语言交互**：调用 C 语言库（FFI）
4. **实现安全抽象**：很多安全的 API 底层依赖 unsafe 实现

## Unsafe 的五种超能力

在 `unsafe` 块或函数中，你可以执行以下五种操作：

```rust
// unsafe 赋予的五种能力
// 1. 解引用原始指针
// 2. 调用 unsafe 函数或方法
// 3. 访问或修改可变静态变量
// 4. 实现 unsafe trait
// 5. 访问 union 的字段
```

让我们逐一深入探讨。

## 原始指针（Raw Pointers）

### 原始指针基础

Rust 有两种原始指针类型：

- `*const T`：不可变原始指针
- `*mut T`：可变原始指针

与引用不同，原始指针：
- 可以忽略借用规则，同时拥有可变和不可变指针
- 不保证指向有效内存
- 允许为空
- 不会自动清理

```rust
fn main() {
    let mut num = 42;

    // 创建原始指针是安全的
    let r1 = &num as *const i32;        // 不可变原始指针
    let r2 = &mut num as *mut i32;      // 可变原始指针

    // 解引用原始指针需要 unsafe
    unsafe {
        println!("r1 指向的值: {}", *r1);
        println!("r2 指向的值: {}", *r2);
    }
}
```

### 创建指向任意地址的指针

```rust
fn main() {
    // 创建指向任意地址的指针（非常危险！）
    let address = 0x012345usize;
    let r = address as *const i32;

    // 解引用这样的指针几乎肯定会导致未定义行为
    // unsafe {
    //     println!("值: {}", *r);  // 危险！不要这样做
    // }
}
```

### 原始指针的实际应用

```rust
/// 使用原始指针交换两个值
fn swap_raw<T>(a: *mut T, b: *mut T) {
    unsafe {
        let temp = std::ptr::read(a);
        std::ptr::copy_nonoverlapping(b, a, 1);
        std::ptr::write(b, temp);
    }
}

fn main() {
    let mut x = 10;
    let mut y = 20;

    println!("交换前: x = {}, y = {}", x, y);

    swap_raw(&mut x as *mut i32, &mut y as *mut i32);

    println!("交换后: x = {}, y = {}", x, y);
}
```

### 指针运算

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let ptr = arr.as_ptr();

    unsafe {
        // 使用 offset 进行指针运算
        for i in 0..arr.len() {
            let value = *ptr.offset(i as isize);
            println!("arr[{}] = {}", i, value);
        }

        // 或使用 add（无符号偏移）
        let third = *ptr.add(2);
        println!("第三个元素: {}", third);
    }
}
```

### NonNull 和 Option 优化

```rust
use std::ptr::NonNull;

struct Node<T> {
    value: T,
    next: Option<NonNull<Node<T>>>,
}

impl<T> Node<T> {
    fn new(value: T) -> Self {
        Node { value, next: None }
    }

    fn append(&mut self, value: T) {
        let new_node = Box::new(Node::new(value));
        // Box::into_raw 转换为原始指针，防止自动释放
        let ptr = NonNull::new(Box::into_raw(new_node));
        self.next = ptr;
    }
}

fn main() {
    let mut head = Node::new(1);
    head.append(2);

    // NonNull 保证指针非空，且与 Option 结合时有空指针优化
    // Option<NonNull<T>> 与 *mut T 大小相同
    println!("NonNull 大小: {}", std::mem::size_of::<Option<NonNull<i32>>>());
    println!("*mut i32 大小: {}", std::mem::size_of::<*mut i32>());
}
```

## Unsafe 函数和方法

### 定义和调用 unsafe 函数

```rust
/// 从切片获取指定索引的元素，不进行边界检查
///
/// # Safety
///
/// 调用者必须确保 `index < slice.len()`
unsafe fn get_unchecked<T>(slice: &[T], index: usize) -> &T {
    &*slice.as_ptr().add(index)
}

fn main() {
    let numbers = [1, 2, 3, 4, 5];

    // 调用 unsafe 函数必须在 unsafe 块中
    unsafe {
        let third = get_unchecked(&numbers, 2);
        println!("第三个元素: {}", third);
    }

    // 安全的替代方案
    if let Some(third) = numbers.get(2) {
        println!("第三个元素（安全版）: {}", third);
    }
}
```

### 在 unsafe 函数中创建安全抽象

```rust
use std::slice;

/// 将切片分割成两部分
fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    assert!(mid <= len);  // 运行时检查确保安全

    unsafe {
        // 这里的 unsafe 是安全的，因为：
        // 1. 我们已经检查了 mid <= len
        // 2. 两个切片不重叠
        // 3. 原始切片在整个生命周期内有效
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut arr = [1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut arr, 3);

    left[0] = 10;
    right[0] = 40;

    println!("数组: {:?}", arr);
}
```

## 访问和修改可变静态变量

静态变量在 Rust 中有固定的内存地址，并且在程序整个生命周期内存在。访问可变静态变量是 unsafe 的，因为可能存在数据竞争。

```rust
static mut COUNTER: u32 = 0;

fn increment_counter() {
    unsafe {
        COUNTER += 1;
    }
}

fn get_counter() -> u32 {
    unsafe { COUNTER }
}

fn main() {
    increment_counter();
    increment_counter();
    increment_counter();

    println!("计数器值: {}", get_counter());
}
```

### 更安全的替代方案

```rust
use std::sync::atomic::{AtomicU32, Ordering};

// 使用原子类型是线程安全的
static COUNTER: AtomicU32 = AtomicU32::new(0);

fn increment_counter() {
    COUNTER.fetch_add(1, Ordering::SeqCst);
}

fn get_counter() -> u32 {
    COUNTER.load(Ordering::SeqCst)
}

fn main() {
    increment_counter();
    increment_counter();
    increment_counter();

    println!("计数器值: {}", get_counter());
}
```

## Unsafe Trait

当 trait 的实现涉及编译器无法验证的不变量时，该 trait 应该标记为 `unsafe`。

### Send 和 Sync

最著名的 unsafe trait 是 `Send` 和 `Sync`：

```rust
// 标准库中的定义
// unsafe trait Send {}
// unsafe trait Sync {}

use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicBool, Ordering};

/// 一个简单的自旋锁实现
struct SpinLock<T> {
    locked: AtomicBool,
    data: UnsafeCell<T>,
}

// 实现 unsafe trait 需要 unsafe impl
// 我们保证：只有持有锁时才能访问数据
unsafe impl<T: Send> Send for SpinLock<T> {}
unsafe impl<T: Send> Sync for SpinLock<T> {}

impl<T> SpinLock<T> {
    pub fn new(data: T) -> Self {
        SpinLock {
            locked: AtomicBool::new(false),
            data: UnsafeCell::new(data),
        }
    }

    pub fn lock(&self) -> SpinLockGuard<T> {
        while self.locked.compare_exchange_weak(
            false, true, Ordering::Acquire, Ordering::Relaxed
        ).is_err() {
            std::hint::spin_loop();
        }
        SpinLockGuard { lock: self }
    }
}

struct SpinLockGuard<'a, T> {
    lock: &'a SpinLock<T>,
}

impl<T> std::ops::Deref for SpinLockGuard<'_, T> {
    type Target = T;
    fn deref(&self) -> &T {
        unsafe { &*self.lock.data.get() }
    }
}

impl<T> std::ops::DerefMut for SpinLockGuard<'_, T> {
    fn deref_mut(&mut self) -> &mut T {
        unsafe { &mut *self.lock.data.get() }
    }
}

impl<T> Drop for SpinLockGuard<'_, T> {
    fn drop(&mut self) {
        self.lock.locked.store(false, Ordering::Release);
    }
}
```

### 自定义 Unsafe Trait

```rust
/// 保证类型可以安全地进行字节拷贝
///
/// # Safety
///
/// 实现此 trait 的类型必须：
/// 1. 不包含任何指针或引用
/// 2. 所有字段都实现了 Pod
/// 3. 没有填充字节或填充字节可以是任意值
unsafe trait Pod: Copy + 'static {
    fn zeroed() -> Self {
        unsafe { std::mem::zeroed() }
    }
}

// 为基本类型实现 Pod
unsafe impl Pod for u8 {}
unsafe impl Pod for u16 {}
unsafe impl Pod for u32 {}
unsafe impl Pod for u64 {}
unsafe impl Pod for i8 {}
unsafe impl Pod for i16 {}
unsafe impl Pod for i32 {}
unsafe impl Pod for i64 {}
unsafe impl Pod for f32 {}
unsafe impl Pod for f64 {}

// 为数组实现 Pod
unsafe impl<T: Pod, const N: usize> Pod for [T; N] {}

fn safe_transmute<T: Pod, U: Pod>(value: T) -> U {
    assert_eq!(std::mem::size_of::<T>(), std::mem::size_of::<U>());
    unsafe { std::mem::transmute_copy(&value) }
}

fn main() {
    let bytes: [u8; 4] = [0x12, 0x34, 0x56, 0x78];
    let num: u32 = safe_transmute(bytes);
    println!("转换后的数字: 0x{:08X}", num);
}
```

## 访问 Union 字段

Union 允许多个字段共享同一块内存，类似于 C 语言的 union。

```rust
#[repr(C)]
union IntOrFloat {
    i: i32,
    f: f32,
}

fn main() {
    let mut u = IntOrFloat { i: 42 };

    // 读取 union 字段是 unsafe 的
    unsafe {
        println!("作为整数: {}", u.i);
        println!("作为浮点数: {}", u.f);
    }

    // 写入字段是安全的
    u.f = 3.14;

    unsafe {
        println!("新的浮点值: {}", u.f);
        println!("作为整数解释: {}", u.i);
    }
}
```

### Union 的实际应用：IP 地址

```rust
#[repr(C)]
union IpAddress {
    v4: [u8; 4],
    v6: [u16; 8],
    raw: u128,
}

impl IpAddress {
    fn new_v4(a: u8, b: u8, c: u8, d: u8) -> Self {
        IpAddress { v4: [a, b, c, d] }
    }

    fn as_v4(&self) -> [u8; 4] {
        unsafe { self.v4 }
    }
}

fn main() {
    let ip = IpAddress::new_v4(192, 168, 1, 1);
    let bytes = ip.as_v4();
    println!("IP 地址: {}.{}.{}.{}", bytes[0], bytes[1], bytes[2], bytes[3]);
}
```

## FFI（外部函数接口）

FFI 允许 Rust 与其他语言（主要是 C）进行交互。

### 调用 C 函数

```rust
// 声明外部 C 函数
extern "C" {
    fn abs(input: i32) -> i32;
    fn sqrt(input: f64) -> f64;
    fn strlen(s: *const std::ffi::c_char) -> usize;
}

fn main() {
    unsafe {
        println!("abs(-5) = {}", abs(-5));
        println!("sqrt(2.0) = {}", sqrt(2.0));

        let s = std::ffi::CString::new("Hello, FFI!").unwrap();
        println!("strlen = {}", strlen(s.as_ptr()));
    }
}
```

### 调用系统库

```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// 链接到 C 标准库
#[link(name = "c")]
extern "C" {
    fn getenv(name: *const c_char) -> *mut c_char;
    fn setenv(name: *const c_char, value: *const c_char, overwrite: c_int) -> c_int;
}

fn get_env(name: &str) -> Option<String> {
    let name = CString::new(name).ok()?;
    unsafe {
        let value = getenv(name.as_ptr());
        if value.is_null() {
            None
        } else {
            Some(CStr::from_ptr(value).to_string_lossy().into_owned())
        }
    }
}

fn main() {
    if let Some(path) = get_env("PATH") {
        println!("PATH 的前100个字符: {}...", &path[..path.len().min(100)]);
    }
}
```

### 从 C 调用 Rust

```rust
// 导出给 C 使用的函数
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn rust_greeting(name: *const std::ffi::c_char) -> *mut std::ffi::c_char {
    use std::ffi::{CStr, CString};

    let name = unsafe {
        if name.is_null() {
            return std::ptr::null_mut();
        }
        CStr::from_ptr(name)
    };

    let greeting = format!("Hello, {}!", name.to_string_lossy());

    match CString::new(greeting) {
        Ok(s) => s.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn rust_free_string(s: *mut std::ffi::c_char) {
    if !s.is_null() {
        unsafe {
            drop(std::ffi::CString::from_raw(s));
        }
    }
}
```

### 对应的 C 头文件

```c
// rust_lib.h
#ifndef RUST_LIB_H
#define RUST_LIB_H

#include <stdint.h>

int32_t rust_add(int32_t a, int32_t b);
char* rust_greeting(const char* name);
void rust_free_string(char* s);

#endif
```

### 封装 C 结构体

```rust
use std::ffi::c_void;

// 对应 C 的 FILE 结构（不透明类型）
#[repr(C)]
pub struct FILE {
    _private: [u8; 0],
}

#[link(name = "c")]
extern "C" {
    fn fopen(filename: *const i8, mode: *const i8) -> *mut FILE;
    fn fclose(file: *mut FILE) -> i32;
    fn fread(ptr: *mut c_void, size: usize, count: usize, stream: *mut FILE) -> usize;
    fn fwrite(ptr: *const c_void, size: usize, count: usize, stream: *mut FILE) -> usize;
}

/// 安全的文件包装器
pub struct SafeFile {
    handle: *mut FILE,
}

impl SafeFile {
    pub fn open(path: &str, mode: &str) -> Option<Self> {
        use std::ffi::CString;

        let path = CString::new(path).ok()?;
        let mode = CString::new(mode).ok()?;

        let handle = unsafe { fopen(path.as_ptr(), mode.as_ptr()) };

        if handle.is_null() {
            None
        } else {
            Some(SafeFile { handle })
        }
    }

    pub fn write(&mut self, data: &[u8]) -> usize {
        unsafe {
            fwrite(
                data.as_ptr() as *const c_void,
                1,
                data.len(),
                self.handle,
            )
        }
    }

    pub fn read(&mut self, buffer: &mut [u8]) -> usize {
        unsafe {
            fread(
                buffer.as_mut_ptr() as *mut c_void,
                1,
                buffer.len(),
                self.handle,
            )
        }
    }
}

impl Drop for SafeFile {
    fn drop(&mut self) {
        unsafe {
            fclose(self.handle);
        }
    }
}
```

## 使用 libc crate

实际项目中，通常使用 `libc` crate 来获取跨平台的 C 类型定义：

```rust
// Cargo.toml 中添加: libc = "0.2"

use libc::{c_int, c_char, size_t};

extern "C" {
    fn printf(format: *const c_char, ...) -> c_int;
}

fn main() {
    use std::ffi::CString;

    let format = CString::new("Hello from Rust! Number: %d\n").unwrap();
    unsafe {
        printf(format.as_ptr(), 42 as c_int);
    }
}
```

## 内联汇编

Rust 支持使用 `asm!` 宏嵌入汇编代码：

```rust
use std::arch::asm;

fn add_with_asm(a: u64, b: u64) -> u64 {
    let result: u64;
    unsafe {
        asm!(
            "add {0}, {1}",
            inout(reg) a => result,
            in(reg) b,
        );
    }
    result
}

fn cpuid() -> (u32, u32, u32, u32) {
    let (eax, ebx, ecx, edx): (u32, u32, u32, u32);
    unsafe {
        asm!(
            "cpuid",
            inout("eax") 0u32 => eax,
            out("ebx") ebx,
            out("ecx") ecx,
            out("edx") edx,
        );
    }
    (eax, ebx, ecx, edx)
}

fn main() {
    println!("3 + 5 = {}", add_with_asm(3, 5));

    let (eax, ebx, ecx, edx) = cpuid();
    println!("CPUID: eax={:08X}, ebx={:08X}, ecx={:08X}, edx={:08X}",
             eax, ebx, ecx, edx);
}
```

## Unsafe 最佳实践

### 最小化 unsafe 范围

```rust
// 不好：整个函数是 unsafe 的
unsafe fn bad_example(data: &[u8], index: usize) -> u8 {
    // 很多安全代码...
    let len = data.len();
    let ptr = data.as_ptr();
    // ...
    *ptr.add(index)
}

// 好：只在必要时使用 unsafe
fn good_example(data: &[u8], index: usize) -> Option<u8> {
    if index >= data.len() {
        return None;
    }

    // unsafe 块尽可能小
    Some(unsafe { *data.as_ptr().add(index) })
}
```

### 编写 Safety 文档

```rust
/// 从原始指针创建切片
///
/// # Safety
///
/// 调用者必须确保：
/// * `ptr` 指向有效的、已初始化的内存
/// * 内存区域包含至少 `len` 个连续的 `T` 类型元素
/// * 内存在返回的切片生命周期内保持有效
/// * 内存不会被其他代码同时修改
pub unsafe fn slice_from_raw<'a, T>(ptr: *const T, len: usize) -> &'a [T] {
    std::slice::from_raw_parts(ptr, len)
}
```

### 使用类型系统提供保护

```rust
use std::marker::PhantomData;

/// 保证指针有效的包装类型
pub struct ValidPtr<'a, T> {
    ptr: *const T,
    _marker: PhantomData<&'a T>,
}

impl<'a, T> ValidPtr<'a, T> {
    /// 从引用创建有效指针
    pub fn new(reference: &'a T) -> Self {
        ValidPtr {
            ptr: reference as *const T,
            _marker: PhantomData,
        }
    }

    /// 安全地解引用，因为我们知道指针来自有效引用
    pub fn get(&self) -> &'a T {
        unsafe { &*self.ptr }
    }
}
```

### 使用断言验证假设

```rust
fn copy_slice<T: Copy>(src: &[T], dst: &mut [T]) {
    assert!(src.len() <= dst.len(), "目标切片太小");

    unsafe {
        std::ptr::copy_nonoverlapping(
            src.as_ptr(),
            dst.as_mut_ptr(),
            src.len(),
        );
    }
}
```

### 考虑使用 Miri 检测未定义行为

Miri 是 Rust 的解释器，可以检测许多未定义行为：

```bash
# 安装 Miri
rustup +nightly component add miri

# 运行 Miri 检查
cargo +nightly miri test
cargo +nightly miri run
```

## 常见的 Unsafe 陷阱

### 数据竞争

```rust
use std::thread;

static mut DATA: i32 = 0;

// 危险：多线程访问可变静态变量导致数据竞争
fn dangerous() {
    let handles: Vec<_> = (0..10).map(|_| {
        thread::spawn(|| {
            unsafe {
                DATA += 1;  // 数据竞争！
            }
        })
    }).collect();

    for h in handles {
        h.join().unwrap();
    }
}

// 安全版本
use std::sync::atomic::{AtomicI32, Ordering};

static SAFE_DATA: AtomicI32 = AtomicI32::new(0);

fn safe_version() {
    let handles: Vec<_> = (0..10).map(|_| {
        thread::spawn(|| {
            SAFE_DATA.fetch_add(1, Ordering::SeqCst);
        })
    }).collect();

    for h in handles {
        h.join().unwrap();
    }
}
```

### 悬垂指针

```rust
fn create_dangling() -> *const i32 {
    let x = 42;
    &x as *const i32  // x 在函数返回后被释放
}

// 正确做法
fn create_valid() -> Box<i32> {
    Box::new(42)  // 堆分配，返回所有权
}
```

### 类型双关（Type Punning）错误

```rust
// 危险：不同大小的类型转换
fn wrong_transmute() {
    let x: u32 = 42;
    // 这会导致未定义行为
    // let y: u64 = unsafe { std::mem::transmute(x) };
}

// 正确做法
fn correct_conversion() {
    let x: u32 = 42;
    let y: u64 = x as u64;  // 使用 as 进行安全转换
}
```

### 违反借用规则

```rust
fn aliasing_violation() {
    let mut data = vec![1, 2, 3];
    let ptr = data.as_mut_ptr();

    // 危险：同时存在可变引用和原始指针访问
    unsafe {
        *ptr = 10;
        data.push(4);  // 可能导致重新分配，使 ptr 失效
        *ptr = 20;     // 未定义行为！
    }
}
```

## 何时使用 Unsafe

### 适合使用 Unsafe 的场景

1. **性能关键代码**：经过分析确认是瓶颈，且安全版本无法满足需求
2. **FFI 边界**：与 C 库交互
3. **实现底层抽象**：如智能指针、并发原语
4. **访问硬件**：嵌入式编程、驱动开发
5. **绕过编译器限制**：当你确信代码是安全的，但编译器无法证明

### 不应使用 Unsafe 的场景

1. **仅仅为了让代码编译通过**
2. **不理解为什么需要 unsafe**
3. **存在安全的替代方案且性能可接受**
4. **没有充分测试和验证**

## 总结

Unsafe Rust 是一把双刃剑。它赋予我们突破安全边界的能力，但同时也要求我们承担更多责任。正确使用 unsafe 需要：

1. **深入理解 Rust 的内存模型和借用规则**
2. **清楚 unsafe 操作的前置条件和不变量**
3. **编写详细的 Safety 文档**
4. **尽量减小 unsafe 块的范围**
5. **在 unsafe 代码外层提供安全抽象**
6. **使用 Miri 等工具进行验证**
7. **充分测试边界情况**

记住：unsafe 不是逃避编译器检查的捷径，而是告诉编译器"我比你更了解这段代码的安全性"。这是一种承诺，需要我们用专业知识和谨慎态度来兑现。

## 延伸阅读

- [The Rustonomicon](https://doc.rust-lang.org/nomicon/) - Unsafe Rust 的官方深入指南
- [Rust 参考手册 - Unsafe](https://doc.rust-lang.org/reference/unsafe-keyword.html)
- [Miri - Rust 未定义行为检测器](https://github.com/rust-lang/miri)
