---
title: Rust 原始指针与 Unsafe
description: 深入理解 Rust 原始指针 *const T 和 *mut T，unsafe 块的使用场景与最佳实践
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - 原始指针
  - unsafe
  - 内存安全
  - FFI
status: imported
origin: old/src/content/docs/rust/raw-pointers.zh.md
divergence: 0.219
issues: []
legacy:
  category: Rust
  subcategory: 高级特性
  order: 11
  lastUpdated: 2026-01-07
---

Rust 以其严格的内存安全保证著称，但有时我们需要突破这些限制来实现底层操作、性能优化或与其他语言交互。原始指针（Raw Pointers）和 `unsafe` 关键字为我们提供了这种能力，同时也带来了额外的责任。

## 概念解释

### 什么是原始指针

原始指针是 Rust 中最接近 C/C++ 指针的类型，它们直接表示内存地址，不受 Rust 借用检查器的约束。Rust 提供两种原始指针类型：

- **`*const T`**：不可变原始指针，类似于 C 中的 `const T*`
- **`*mut T`**：可变原始指针，类似于 C 中的 `T*`

与引用（`&T` 和 `&mut T`）不同，原始指针具有以下特性：

| 特性 | 引用 | 原始指针 |
|------|------|----------|
| 借用规则 | 编译时强制执行 | 无限制 |
| 空值 | 不允许 | 允许 |
| 有效性保证 | 编译器保证 | 程序员负责 |
| 自动解引用 | 支持 | 不支持 |
| 自动清理 | 基于作用域 | 无 |

### 什么是 Unsafe

`unsafe` 关键字标记了一段代码区域，在其中可以执行编译器无法验证安全性的操作。使用 `unsafe` 并不意味着代码一定不安全，而是将安全性验证的责任从编译器转移到程序员身上。

```rust
// unsafe 块：标记不安全操作的边界
unsafe {
    // 可以执行不安全操作
}

// unsafe 函数：调用者必须确保前置条件满足
unsafe fn dangerous_operation() {
    // 整个函数体都是 unsafe 上下文
}

// unsafe trait：实现者必须确保满足特定不变量
unsafe trait UnsafeTrait {
    // trait 定义
}
```

### 历史背景

Rust 的设计哲学是"零成本抽象"和"无畏并发"。为了实现这些目标，Rust 在编译时强制执行严格的内存安全规则。然而，某些底层操作本质上无法在编译时验证：

1. **操作系统交互**：直接操作硬件或系统调用
2. **FFI 边界**：与 C 等其他语言交互
3. **性能优化**：绕过某些运行时检查
4. **数据结构实现**：如侵入式链表、自引用结构

`unsafe` 的引入解决了这个矛盾：在保持大部分代码安全的同时，允许在必要时突破限制。

## 核心原理

### 原始指针的内存模型

原始指针本质上就是一个内存地址，在 64 位系统上占用 8 字节：

```rust
use std::mem::size_of;

fn main() {
    println!("*const i32 大小: {} 字节", size_of::<*const i32>());
    println!("*mut i32 大小: {} 字节", size_of::<*mut i32>());
    println!("&i32 大小: {} 字节", size_of::<&i32>());

    // 胖指针包含额外元数据
    println!("*const [i32] 大小: {} 字节", size_of::<*const [i32]>());
    println!("&[i32] 大小: {} 字节", size_of::<&[i32]>());
}
```

输出：
```
*const i32 大小: 8 字节
*mut i32 大小: 8 字节
&i32 大小: 8 字节
*const [i32] 大小: 16 字节
&[i32] 大小: 16 字节
```

### 指针与引用的转换

```rust
fn main() {
    let x = 42;
    let r = &x;                    // 不可变引用

    // 引用转原始指针（安全）
    let ptr: *const i32 = r;       // 隐式转换
    let ptr2: *const i32 = &x as *const i32;  // 显式转换

    // 原始指针转引用（不安全）
    unsafe {
        let r2: &i32 = &*ptr;      // 需要 unsafe
        println!("值: {}", *r2);
    }
}
```

### Unsafe 的五种超能力

在 `unsafe` 块或函数中，你可以执行以下五种原本被禁止的操作：

```rust
// 1. 解引用原始指针
unsafe {
    let ptr = &42 as *const i32;
    let value = *ptr;  // 解引用
}

// 2. 调用 unsafe 函数或方法
unsafe fn dangerous() {}
unsafe {
    dangerous();
}

// 3. 访问或修改可变静态变量
static mut COUNTER: u32 = 0;
unsafe {
    COUNTER += 1;
}

// 4. 实现 unsafe trait
unsafe trait Scary {}
unsafe impl Scary for i32 {}

// 5. 访问 union 的字段
union MyUnion {
    i: i32,
    f: f32,
}
let u = MyUnion { i: 42 };
unsafe {
    println!("{}", u.i);
}
```

### 原始指针的创建与转换

创建原始指针本身是安全的，只有解引用才需要 `unsafe`：

```rust
fn main() {
    // 方式1：从引用转换
    let x = 10;
    let ptr1 = &x as *const i32;

    // 方式2：从可变引用转换
    let mut y = 20;
    let ptr2 = &mut y as *mut i32;

    // 方式3：使用 std::ptr 模块
    let ptr3: *const i32 = std::ptr::null();
    let ptr4: *mut i32 = std::ptr::null_mut();

    // 方式4：从整数地址创建（危险！）
    let addr: usize = 0x7fff_0000;
    let ptr5 = addr as *const i32;

    // 方式5：从 Box 获取
    let boxed = Box::new(30);
    let ptr6 = Box::into_raw(boxed);  // 注意：需要手动释放

    unsafe {
        // 将指针转回 Box 以正确释放内存
        let _ = Box::from_raw(ptr6);
    }
}
```

## 核心要点

### 原始指针类型详解

#### `*const T` - 不可变原始指针

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let ptr: *const i32 = arr.as_ptr();

    unsafe {
        // 读取值
        println!("第一个元素: {}", *ptr);

        // 指针运算
        let second = ptr.add(1);
        println!("第二个元素: {}", *second);

        // 偏移访问
        for i in 0..arr.len() {
            println!("arr[{}] = {}", i, *ptr.add(i));
        }
    }
}
```

#### `*mut T` - 可变原始指针

```rust
fn main() {
    let mut arr = [1, 2, 3, 4, 5];
    let ptr: *mut i32 = arr.as_mut_ptr();

    unsafe {
        // 修改值
        *ptr = 10;
        *ptr.add(2) = 30;

        // 使用 write 方法
        ptr.add(4).write(50);
    }

    println!("修改后: {:?}", arr);  // [10, 2, 30, 4, 50]
}
```

### 指针运算方法

```rust
fn main() {
    let arr = [10, 20, 30, 40, 50];
    let ptr = arr.as_ptr();

    unsafe {
        // add: 向前偏移 n 个元素
        let p1 = ptr.add(2);
        println!("ptr.add(2) = {}", *p1);  // 30

        // sub: 向后偏移 n 个元素
        let p2 = p1.sub(1);
        println!("p1.sub(1) = {}", *p2);   // 20

        // offset: 可正可负的偏移
        let p3 = ptr.offset(3);
        println!("ptr.offset(3) = {}", *p3);  // 40

        // wrapping_add: 环绕算术偏移
        let p4 = ptr.wrapping_add(1);
        println!("ptr.wrapping_add(1) = {}", *p4);  // 20
    }
}
```

### 指针比较与检查

```rust
fn main() {
    let x = 42;
    let ptr1 = &x as *const i32;
    let ptr2 = &x as *const i32;
    let null_ptr: *const i32 = std::ptr::null();

    // 指针相等性比较（安全操作）
    println!("ptr1 == ptr2: {}", ptr1 == ptr2);  // true
    println!("ptr1 == null: {}", ptr1 == null_ptr);  // false

    // 检查是否为空
    println!("ptr1 is null: {}", ptr1.is_null());   // false
    println!("null_ptr is null: {}", null_ptr.is_null());  // true

    // 对齐检查
    println!("ptr1 对齐到 4: {}", ptr1.is_aligned_to(4));
}
```

### 安全的指针操作方法

```rust
fn main() {
    let x = 42;
    let ptr = &x as *const i32;

    unsafe {
        // read: 读取值（可能是未对齐的）
        let value = std::ptr::read(ptr);
        println!("read: {}", value);

        // read_unaligned: 读取未对齐的值
        let value2 = std::ptr::read_unaligned(ptr);
        println!("read_unaligned: {}", value2);
    }

    let mut y = 0;
    let ptr_mut = &mut y as *mut i32;

    unsafe {
        // write: 写入值
        std::ptr::write(ptr_mut, 100);
        println!("after write: {}", y);  // 100

        // write_volatile: 防止优化的写入
        std::ptr::write_volatile(ptr_mut, 200);
        println!("after write_volatile: {}", y);  // 200
    }
}
```

### 内存复制操作

```rust
fn main() {
    let src = [1, 2, 3, 4, 5];
    let mut dst = [0; 5];

    unsafe {
        // copy_nonoverlapping: 非重叠内存复制（类似 memcpy）
        std::ptr::copy_nonoverlapping(
            src.as_ptr(),
            dst.as_mut_ptr(),
            src.len()
        );
    }
    println!("复制后: {:?}", dst);  // [1, 2, 3, 4, 5]

    let mut arr = [1, 2, 3, 4, 5];
    unsafe {
        // copy: 可能重叠的内存复制（类似 memmove）
        std::ptr::copy(
            arr.as_ptr().add(1),
            arr.as_mut_ptr(),
            3
        );
    }
    println!("重叠复制后: {:?}", arr);  // [2, 3, 4, 4, 5]
}
```

## 代码示例

### 示例1：使用原始指针实现安全的切片分割

```rust
use std::slice;

/// 将切片在指定位置分割成两个可变切片
///
/// 这是标准库 `split_at_mut` 的简化实现
fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    // 运行时检查确保安全
    assert!(mid <= len, "索引 {} 超出范围 (长度为 {})", mid, len);

    unsafe {
        // 安全性说明：
        // 1. mid <= len，所以两个切片都在有效范围内
        // 2. 两个切片不重叠
        // 3. 原始切片在返回的切片生命周期内保持有效
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

    println!("分割后: {:?}", arr);  // [10, 2, 3, 40, 5, 6]
}
```

### 示例2：使用原始指针实现高效的元素交换

```rust
/// 使用原始指针交换两个值，避免临时变量
///
/// # Safety
///
/// 调用者必须确保：
/// - `a` 和 `b` 都是有效的、可写的指针
/// - `a` 和 `b` 指向的内存不重叠
unsafe fn swap_raw<T>(a: *mut T, b: *mut T) {
    // 使用 std::ptr::swap 进行安全的交换
    std::ptr::swap(a, b);
}

/// 安全的包装函数
fn swap<T>(a: &mut T, b: &mut T) {
    unsafe {
        swap_raw(a as *mut T, b as *mut T);
    }
}

fn main() {
    let mut x = 10;
    let mut y = 20;

    println!("交换前: x = {}, y = {}", x, y);
    swap(&mut x, &mut y);
    println!("交换后: x = {}, y = {}", x, y);

    // 交换数组元素
    let mut arr = [1, 2, 3, 4, 5];
    unsafe {
        swap_raw(
            arr.as_mut_ptr().add(0),
            arr.as_mut_ptr().add(4)
        );
    }
    println!("数组交换后: {:?}", arr);  // [5, 2, 3, 4, 1]
}
```

### 示例3：NonNull 智能指针包装

```rust
use std::ptr::NonNull;

/// 使用 NonNull 的链表节点
struct Node<T> {
    value: T,
    next: Option<NonNull<Node<T>>>,
}

impl<T> Node<T> {
    fn new(value: T) -> Self {
        Node { value, next: None }
    }

    fn boxed(value: T) -> NonNull<Self> {
        let boxed = Box::new(Node::new(value));
        // Box::into_raw 返回 *mut T，转换为 NonNull
        // Safety: Box::into_raw 返回的指针永远非空
        unsafe { NonNull::new_unchecked(Box::into_raw(boxed)) }
    }
}

/// 简单的单向链表
struct LinkedList<T> {
    head: Option<NonNull<Node<T>>>,
    len: usize,
}

impl<T> LinkedList<T> {
    fn new() -> Self {
        LinkedList { head: None, len: 0 }
    }

    fn push_front(&mut self, value: T) {
        let mut new_node = Node::boxed(value);

        unsafe {
            new_node.as_mut().next = self.head;
        }

        self.head = Some(new_node);
        self.len += 1;
    }

    fn pop_front(&mut self) -> Option<T> {
        self.head.map(|node| {
            unsafe {
                // 将 NonNull 转换回 Box 以正确释放内存
                let boxed = Box::from_raw(node.as_ptr());
                self.head = boxed.next;
                self.len -= 1;
                boxed.value
            }
        })
    }

    fn len(&self) -> usize {
        self.len
    }

    fn is_empty(&self) -> bool {
        self.head.is_none()
    }
}

impl<T> Drop for LinkedList<T> {
    fn drop(&mut self) {
        while self.pop_front().is_some() {}
    }
}

fn main() {
    let mut list = LinkedList::new();

    list.push_front(3);
    list.push_front(2);
    list.push_front(1);

    println!("链表长度: {}", list.len());

    while let Some(value) = list.pop_front() {
        println!("弹出: {}", value);
    }

    println!("链表是否为空: {}", list.is_empty());

    // NonNull 的内存优化
    println!("\n=== 内存优化演示 ===");
    println!("Option<NonNull<i32>> 大小: {} 字节",
             std::mem::size_of::<Option<NonNull<i32>>>());
    println!("Option<*mut i32> 大小: {} 字节",
             std::mem::size_of::<Option<*mut i32>>());
    println!("*mut i32 大小: {} 字节",
             std::mem::size_of::<*mut i32>());
    // Option<NonNull<T>> 与 *mut T 大小相同（空指针优化）
}
```

### 示例4：实现自定义的内存分配

```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

/// 简单的固定大小内存池
struct MemoryPool {
    buffer: *mut u8,
    layout: Layout,
    size: usize,
    used: usize,
}

impl MemoryPool {
    /// 创建指定大小的内存池
    fn new(size: usize) -> Option<Self> {
        let layout = Layout::from_size_align(size, 8).ok()?;

        let buffer = unsafe { alloc(layout) };

        if buffer.is_null() {
            return None;
        }

        Some(MemoryPool {
            buffer,
            layout,
            size,
            used: 0,
        })
    }

    /// 从池中分配内存
    fn allocate(&mut self, size: usize, align: usize) -> Option<*mut u8> {
        // 计算对齐后的偏移
        let current = self.buffer as usize + self.used;
        let aligned = (current + align - 1) & !(align - 1);
        let offset = aligned - self.buffer as usize;

        if offset + size > self.size {
            return None;  // 空间不足
        }

        self.used = offset + size;

        Some(unsafe { self.buffer.add(offset) })
    }

    /// 分配并初始化特定类型
    fn allocate_value<T>(&mut self, value: T) -> Option<*mut T> {
        let ptr = self.allocate(
            std::mem::size_of::<T>(),
            std::mem::align_of::<T>()
        )? as *mut T;

        unsafe {
            ptr::write(ptr, value);
        }

        Some(ptr)
    }

    /// 获取已使用的内存大小
    fn used(&self) -> usize {
        self.used
    }

    /// 重置内存池（不释放内存，仅重置使用计数）
    fn reset(&mut self) {
        self.used = 0;
    }
}

impl Drop for MemoryPool {
    fn drop(&mut self) {
        unsafe {
            dealloc(self.buffer, self.layout);
        }
    }
}

fn main() {
    let mut pool = MemoryPool::new(1024).expect("分配失败");

    // 分配一些值
    let int_ptr = pool.allocate_value(42i32).expect("分配 i32 失败");
    let float_ptr = pool.allocate_value(3.14f64).expect("分配 f64 失败");
    let str_ptr = pool.allocate_value("Hello").expect("分配 &str 失败");

    unsafe {
        println!("int: {}", *int_ptr);
        println!("float: {}", *float_ptr);
        println!("str: {}", *str_ptr);
    }

    println!("已使用内存: {} 字节", pool.used());

    // 重置池
    pool.reset();
    println!("重置后已使用: {} 字节", pool.used());
}
```

### 示例5：FFI 与 C 语言交互

```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// 声明 C 标准库函数
extern "C" {
    fn strlen(s: *const c_char) -> usize;
    fn strcmp(s1: *const c_char, s2: *const c_char) -> c_int;
    fn memcpy(dest: *mut u8, src: *const u8, n: usize) -> *mut u8;
}

/// 安全的字符串长度计算
fn safe_strlen(s: &str) -> usize {
    let c_string = CString::new(s).expect("字符串包含空字节");
    unsafe {
        strlen(c_string.as_ptr())
    }
}

/// 安全的字符串比较
fn safe_strcmp(s1: &str, s2: &str) -> i32 {
    let c_str1 = CString::new(s1).expect("s1 包含空字节");
    let c_str2 = CString::new(s2).expect("s2 包含空字节");

    unsafe {
        strcmp(c_str1.as_ptr(), c_str2.as_ptr())
    }
}

/// 导出给 C 使用的函数
#[no_mangle]
pub extern "C" fn rust_add(a: c_int, b: c_int) -> c_int {
    a.saturating_add(b)
}

#[no_mangle]
pub extern "C" fn rust_create_greeting(name: *const c_char) -> *mut c_char {
    if name.is_null() {
        return std::ptr::null_mut();
    }

    let name_str = unsafe {
        match CStr::from_ptr(name).to_str() {
            Ok(s) => s,
            Err(_) => return std::ptr::null_mut(),
        }
    };

    let greeting = format!("Hello, {}!", name_str);

    match CString::new(greeting) {
        Ok(c_string) => c_string.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn rust_free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            // 将 C 字符串转回 CString 以正确释放内存
            drop(CString::from_raw(s));
        }
    }
}

fn main() {
    // 使用 C 函数
    println!("strlen(\"hello\"): {}", safe_strlen("hello"));

    let cmp_result = safe_strcmp("apple", "banana");
    println!("strcmp(\"apple\", \"banana\"): {}", cmp_result);

    // 测试导出的函数
    println!("rust_add(10, 20): {}", rust_add(10, 20));

    let name = CString::new("Rust").unwrap();
    let greeting = rust_create_greeting(name.as_ptr());

    if !greeting.is_null() {
        unsafe {
            let greeting_str = CStr::from_ptr(greeting);
            println!("greeting: {}", greeting_str.to_string_lossy());
        }
        rust_free_string(greeting);
    }
}
```

## 最佳实践

### 最小化 unsafe 块的范围

```rust
// 不推荐：整个函数标记为 unsafe
unsafe fn bad_example(data: &[u8], index: usize) -> u8 {
    // 大量安全代码...
    let len = data.len();
    // 更多安全代码...
    *data.as_ptr().add(index)
}

// 推荐：只在必要时使用 unsafe
fn good_example(data: &[u8], index: usize) -> Option<u8> {
    if index >= data.len() {
        return None;
    }

    // unsafe 块尽可能小
    Some(unsafe { *data.as_ptr().add(index) })
}
```

### 编写详细的 Safety 文档

```rust
/// 从原始指针和长度创建切片
///
/// # Safety
///
/// 调用者必须确保以下条件：
///
/// * `ptr` 必须是有效的、已初始化的指针
/// * `ptr` 指向的内存必须包含至少 `len` 个连续的 `T` 类型元素
/// * 内存在返回的切片生命周期内必须保持有效
/// * 内存不能被其他代码同时修改（除非 `T` 是 `Sync`）
/// * `len * size_of::<T>()` 不能超过 `isize::MAX`
///
/// # Examples
///
/// ```
/// let arr = [1, 2, 3, 4, 5];
/// let slice = unsafe {
///     slice_from_raw(arr.as_ptr(), arr.len())
/// };
/// assert_eq!(slice, &[1, 2, 3, 4, 5]);
/// ```
pub unsafe fn slice_from_raw<'a, T>(ptr: *const T, len: usize) -> &'a [T] {
    std::slice::from_raw_parts(ptr, len)
}
```

### 使用类型系统提供额外保护

```rust
use std::marker::PhantomData;

/// 包装原始指针，提供生命周期追踪
pub struct Ptr<'a, T> {
    ptr: *const T,
    _marker: PhantomData<&'a T>,
}

impl<'a, T> Ptr<'a, T> {
    /// 从引用创建，保证指针有效性
    pub fn new(reference: &'a T) -> Self {
        Ptr {
            ptr: reference as *const T,
            _marker: PhantomData,
        }
    }

    /// 安全地获取引用，因为生命周期被追踪
    pub fn as_ref(&self) -> &'a T {
        // Safety: 指针来自有效的引用，生命周期被正确追踪
        unsafe { &*self.ptr }
    }

    /// 获取底层指针
    pub fn as_ptr(&self) -> *const T {
        self.ptr
    }
}

fn main() {
    let value = 42;
    let ptr = Ptr::new(&value);

    println!("通过安全包装访问: {}", ptr.as_ref());
}
```

### 使用断言验证假设

```rust
/// 将源切片复制到目标切片
fn copy_slice<T: Copy>(src: &[T], dst: &mut [T]) {
    // 使用断言验证前置条件
    assert!(
        src.len() <= dst.len(),
        "源切片长度 ({}) 超过目标切片长度 ({})",
        src.len(),
        dst.len()
    );

    // debug 模式下的额外检查
    debug_assert!(
        !std::ptr::eq(src.as_ptr(), dst.as_ptr()),
        "源和目标不应该重叠"
    );

    unsafe {
        std::ptr::copy_nonoverlapping(
            src.as_ptr(),
            dst.as_mut_ptr(),
            src.len(),
        );
    }
}

fn main() {
    let src = [1, 2, 3];
    let mut dst = [0; 5];

    copy_slice(&src, &mut dst);
    println!("复制后: {:?}", dst);  // [1, 2, 3, 0, 0]
}
```

### 封装 unsafe 代码提供安全 API

```rust
/// 高性能的环形缓冲区
pub struct RingBuffer<T> {
    buffer: *mut T,
    capacity: usize,
    head: usize,
    tail: usize,
    len: usize,
}

impl<T> RingBuffer<T> {
    /// 创建指定容量的环形缓冲区
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "容量必须大于 0");

        let layout = std::alloc::Layout::array::<T>(capacity)
            .expect("布局计算失败");

        let buffer = unsafe {
            std::alloc::alloc(layout) as *mut T
        };

        if buffer.is_null() {
            std::alloc::handle_alloc_error(layout);
        }

        RingBuffer {
            buffer,
            capacity,
            head: 0,
            tail: 0,
            len: 0,
        }
    }

    /// 推入元素
    pub fn push(&mut self, value: T) -> bool {
        if self.len == self.capacity {
            return false;  // 缓冲区已满
        }

        unsafe {
            self.buffer.add(self.tail).write(value);
        }

        self.tail = (self.tail + 1) % self.capacity;
        self.len += 1;
        true
    }

    /// 弹出元素
    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }

        let value = unsafe {
            self.buffer.add(self.head).read()
        };

        self.head = (self.head + 1) % self.capacity;
        self.len -= 1;
        Some(value)
    }

    /// 获取长度
    pub fn len(&self) -> usize {
        self.len
    }

    /// 检查是否为空
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
}

impl<T> Drop for RingBuffer<T> {
    fn drop(&mut self) {
        // 先丢弃所有元素
        while self.pop().is_some() {}

        // 然后释放内存
        let layout = std::alloc::Layout::array::<T>(self.capacity)
            .expect("布局计算失败");

        unsafe {
            std::alloc::dealloc(self.buffer as *mut u8, layout);
        }
    }
}

fn main() {
    let mut buffer = RingBuffer::new(3);

    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    println!("缓冲区满: {}", !buffer.push(4));  // true

    println!("弹出: {:?}", buffer.pop());  // Some(1)

    buffer.push(4);  // 现在可以推入了

    while let Some(v) = buffer.pop() {
        println!("弹出: {}", v);  // 2, 3, 4
    }
}
```

## 常见陷阱

### 悬垂指针

```rust
// 错误：返回指向局部变量的指针
fn dangling_pointer() -> *const i32 {
    let x = 42;
    &x as *const i32  // x 在函数返回后被释放
}

// 正确：使用 Box 进行堆分配
fn valid_pointer() -> *mut i32 {
    Box::into_raw(Box::new(42))
}

fn main() {
    // 危险！ptr 指向已释放的内存
    // let ptr = dangling_pointer();
    // unsafe { println!("{}", *ptr); }  // 未定义行为

    // 正确用法
    let ptr = valid_pointer();
    unsafe {
        println!("值: {}", *ptr);
        // 记得释放内存
        drop(Box::from_raw(ptr));
    }
}
```

### 数据竞争

```rust
use std::thread;

static mut COUNTER: i32 = 0;

// 危险：多线程访问可变静态变量
fn data_race_example() {
    let handles: Vec<_> = (0..10)
        .map(|_| {
            thread::spawn(|| {
                unsafe {
                    COUNTER += 1;  // 数据竞争！
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}

// 正确：使用原子操作
use std::sync::atomic::{AtomicI32, Ordering};

static SAFE_COUNTER: AtomicI32 = AtomicI32::new(0);

fn safe_example() {
    let handles: Vec<_> = (0..10)
        .map(|_| {
            thread::spawn(|| {
                SAFE_COUNTER.fetch_add(1, Ordering::SeqCst);
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    println!("安全计数器: {}", SAFE_COUNTER.load(Ordering::SeqCst));
}

fn main() {
    safe_example();
}
```

### 类型混淆（Type Punning）

```rust
fn main() {
    // 危险：不同大小类型之间的转换
    let x: u32 = 42;
    // let y: u64 = unsafe { std::mem::transmute(x) };  // 编译错误或 UB

    // 正确：使用显式类型转换
    let y: u64 = x as u64;
    println!("转换后: {}", y);

    // 相同大小类型之间的 transmute
    let f: f32 = 3.14;
    let bits: u32 = unsafe { std::mem::transmute(f) };
    println!("f32 的位表示: 0x{:08X}", bits);

    // 更安全的替代方案
    let bits2 = f.to_bits();
    println!("使用 to_bits: 0x{:08X}", bits2);
}
```

### 违反借用规则

```rust
fn main() {
    let mut data = vec![1, 2, 3];
    let ptr = data.as_mut_ptr();

    // 危险：同时存在可变引用和原始指针访问
    unsafe {
        *ptr = 10;
        data.push(4);  // 可能导致重新分配
        // *ptr = 20;  // 未定义行为！ptr 可能已失效
    }

    // 正确做法：避免混合使用
    let mut data2 = vec![1, 2, 3];

    unsafe {
        let ptr = data2.as_mut_ptr();
        *ptr = 10;
        *ptr.add(1) = 20;
    }

    data2.push(4);  // 现在可以安全地使用
    println!("{:?}", data2);
}
```

### 忘记释放内存

```rust
fn main() {
    // 错误：内存泄漏
    let ptr = Box::into_raw(Box::new(vec![1, 2, 3]));
    // 忘记调用 Box::from_raw(ptr)

    // 正确：确保内存被释放
    let ptr = Box::into_raw(Box::new(vec![1, 2, 3]));
    unsafe {
        let _boxed = Box::from_raw(ptr);
        // _boxed 在作用域结束时自动释放
    }

    // 使用 scopeguard 确保清理
    // let _guard = scopeguard::guard(ptr, |p| unsafe {
    //     Box::from_raw(p);
    // });
}
```

### 未初始化内存

```rust
use std::mem::MaybeUninit;

fn main() {
    // 危险：读取未初始化的内存
    // let x: i32;
    // unsafe { println!("{}", x); }  // 未定义行为

    // 正确：使用 MaybeUninit
    let mut uninit: MaybeUninit<[i32; 5]> = MaybeUninit::uninit();

    unsafe {
        let ptr = uninit.as_mut_ptr() as *mut i32;
        for i in 0..5 {
            ptr.add(i).write(i as i32);
        }

        let initialized = uninit.assume_init();
        println!("初始化后: {:?}", initialized);
    }
}
```

## 性能考量

### 边界检查消除

```rust
fn sum_with_bounds_check(arr: &[i32]) -> i32 {
    let mut sum = 0;
    for i in 0..arr.len() {
        sum += arr[i];  // 每次访问都有边界检查
    }
    sum
}

fn sum_with_iterator(arr: &[i32]) -> i32 {
    arr.iter().sum()  // 迭代器避免边界检查
}

fn sum_with_unsafe(arr: &[i32]) -> i32 {
    let mut sum = 0;
    let ptr = arr.as_ptr();
    let len = arr.len();

    unsafe {
        for i in 0..len {
            sum += *ptr.add(i);  // 无边界检查
        }
    }
    sum
}

// 基准测试示例
fn main() {
    let arr: Vec<i32> = (0..10000).collect();

    // 在实际场景中，编译器通常能优化掉边界检查
    // 只有在基准测试显示确实存在性能问题时才使用 unsafe

    let sum1 = sum_with_bounds_check(&arr);
    let sum2 = sum_with_iterator(&arr);
    let sum3 = sum_with_unsafe(&arr);

    assert_eq!(sum1, sum2);
    assert_eq!(sum2, sum3);

    println!("所有方法结果一致: {}", sum1);
}
```

### 避免不必要的复制

```rust
use std::mem::ManuallyDrop;

/// 获取 Vec 的内部缓冲区而不复制
fn take_buffer<T>(vec: Vec<T>) -> (*mut T, usize, usize) {
    let mut vec = ManuallyDrop::new(vec);
    (vec.as_mut_ptr(), vec.len(), vec.capacity())
}

/// 从原始部件重建 Vec
unsafe fn rebuild_vec<T>(ptr: *mut T, len: usize, cap: usize) -> Vec<T> {
    Vec::from_raw_parts(ptr, len, cap)
}

fn main() {
    let original = vec![1, 2, 3, 4, 5];
    let original_ptr = original.as_ptr();

    let (ptr, len, cap) = take_buffer(original);

    // 验证指针相同（没有复制）
    assert_eq!(original_ptr, ptr as *const i32);

    unsafe {
        let recovered = rebuild_vec(ptr, len, cap);
        println!("恢复的 Vec: {:?}", recovered);
    }
}
```

### SIMD 优化

```rust
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

/// 使用 SIMD 加速数组求和（仅作示例）
#[cfg(target_arch = "x86_64")]
fn simd_sum(arr: &[f32]) -> f32 {
    if !is_x86_feature_detected!("sse") {
        return arr.iter().sum();
    }

    let mut sum = 0.0f32;
    let chunks = arr.chunks_exact(4);
    let remainder = chunks.remainder();

    unsafe {
        let mut acc = _mm_setzero_ps();

        for chunk in chunks {
            let v = _mm_loadu_ps(chunk.as_ptr());
            acc = _mm_add_ps(acc, v);
        }

        // 水平求和
        let mut result = [0.0f32; 4];
        _mm_storeu_ps(result.as_mut_ptr(), acc);
        sum = result.iter().sum();
    }

    sum + remainder.iter().sum::<f32>()
}

#[cfg(not(target_arch = "x86_64"))]
fn simd_sum(arr: &[f32]) -> f32 {
    arr.iter().sum()
}

fn main() {
    let data: Vec<f32> = (0..1000).map(|x| x as f32).collect();

    let sum = simd_sum(&data);
    println!("SIMD 求和结果: {}", sum);
}
```

### 何时使用 unsafe 进行性能优化

```rust
// 通常不需要 unsafe 的情况：
// - 编译器已经优化得很好
// - 使用迭代器和函数式方法
// - 使用 get_unchecked 等提供的安全包装

// 可能需要 unsafe 的情况：
// - 基准测试确认存在性能瓶颈
// - 实现底层数据结构
// - FFI 边界
// - 内存布局精确控制

fn main() {
    let arr = [1, 2, 3, 4, 5];

    // 优先使用安全的 API
    let sum: i32 = arr.iter().sum();

    // 如果确实需要跳过边界检查
    let first = unsafe { *arr.get_unchecked(0) };

    println!("Sum: {}, First: {}", sum, first);
}
```

## 实战场景

### 场景1：实现自定义智能指针

```rust
use std::ops::{Deref, DerefMut};
use std::ptr::NonNull;
use std::alloc::{alloc, dealloc, Layout};

/// 类似 Box 的简单智能指针
pub struct SimpleBox<T> {
    ptr: NonNull<T>,
}

impl<T> SimpleBox<T> {
    pub fn new(value: T) -> Self {
        let layout = Layout::new::<T>();

        let ptr = unsafe {
            let raw_ptr = alloc(layout) as *mut T;
            if raw_ptr.is_null() {
                std::alloc::handle_alloc_error(layout);
            }
            std::ptr::write(raw_ptr, value);
            NonNull::new_unchecked(raw_ptr)
        };

        SimpleBox { ptr }
    }

    pub fn into_inner(self) -> T {
        let value = unsafe { std::ptr::read(self.ptr.as_ptr()) };

        // 防止 Drop 再次释放
        std::mem::forget(self);

        // 释放内存但不调用析构函数
        let layout = Layout::new::<T>();
        unsafe {
            dealloc(self.ptr.as_ptr() as *mut u8, layout);
        }

        value
    }
}

impl<T> Deref for SimpleBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        unsafe { self.ptr.as_ref() }
    }
}

impl<T> DerefMut for SimpleBox<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        unsafe { self.ptr.as_mut() }
    }
}

impl<T> Drop for SimpleBox<T> {
    fn drop(&mut self) {
        unsafe {
            // 先调用值的析构函数
            std::ptr::drop_in_place(self.ptr.as_ptr());

            // 然后释放内存
            let layout = Layout::new::<T>();
            dealloc(self.ptr.as_ptr() as *mut u8, layout);
        }
    }
}

fn main() {
    let boxed = SimpleBox::new(String::from("Hello, SimpleBox!"));
    println!("内容: {}", *boxed);

    let mut boxed_num = SimpleBox::new(42);
    *boxed_num += 8;
    println!("修改后: {}", *boxed_num);
}
```

### 场景2：高性能解析器

```rust
/// 零拷贝字符串解析器
pub struct Parser<'a> {
    input: &'a [u8],
    pos: usize,
}

impl<'a> Parser<'a> {
    pub fn new(input: &'a str) -> Self {
        Parser {
            input: input.as_bytes(),
            pos: 0,
        }
    }

    /// 快速跳过空白字符
    pub fn skip_whitespace(&mut self) {
        let ptr = self.input.as_ptr();
        let len = self.input.len();

        unsafe {
            while self.pos < len {
                let byte = *ptr.add(self.pos);
                if byte != b' ' && byte != b'\t' && byte != b'\n' && byte != b'\r' {
                    break;
                }
                self.pos += 1;
            }
        }
    }

    /// 解析整数（无边界检查版本）
    pub fn parse_int(&mut self) -> Option<i64> {
        self.skip_whitespace();

        if self.pos >= self.input.len() {
            return None;
        }

        let ptr = self.input.as_ptr();
        let len = self.input.len();
        let mut result: i64 = 0;
        let mut negative = false;

        unsafe {
            // 处理符号
            if self.pos < len && *ptr.add(self.pos) == b'-' {
                negative = true;
                self.pos += 1;
            }

            let start = self.pos;

            while self.pos < len {
                let byte = *ptr.add(self.pos);
                if byte < b'0' || byte > b'9' {
                    break;
                }
                result = result * 10 + (byte - b'0') as i64;
                self.pos += 1;
            }

            if self.pos == start {
                return None;
            }
        }

        Some(if negative { -result } else { result })
    }

    /// 获取剩余输入
    pub fn remaining(&self) -> &str {
        unsafe {
            std::str::from_utf8_unchecked(&self.input[self.pos..])
        }
    }
}

fn main() {
    let input = "  42  -100  999  ";
    let mut parser = Parser::new(input);

    while let Some(num) = parser.parse_int() {
        println!("解析到数字: {}", num);
    }

    println!("剩余输入: '{}'", parser.remaining());
}
```

### 场景3：内存映射文件

```rust
use std::fs::File;
use std::io;
use std::ptr;

/// 简化的内存映射（仅用于演示概念）
pub struct MemoryMappedFile {
    ptr: *mut u8,
    len: usize,
}

impl MemoryMappedFile {
    /// 创建内存映射（简化版，仅分配内存模拟）
    pub fn new(size: usize) -> io::Result<Self> {
        let layout = std::alloc::Layout::from_size_align(size, 4096)
            .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "布局错误"))?;

        let ptr = unsafe { std::alloc::alloc_zeroed(layout) };

        if ptr.is_null() {
            return Err(io::Error::new(io::ErrorKind::OutOfMemory, "分配失败"));
        }

        Ok(MemoryMappedFile { ptr, len: size })
    }

    /// 获取只读视图
    pub fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }

    /// 获取可变视图
    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.ptr, self.len) }
    }

    /// 直接写入指定位置
    pub fn write_at(&mut self, offset: usize, data: &[u8]) -> io::Result<()> {
        if offset + data.len() > self.len {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "越界写入"));
        }

        unsafe {
            ptr::copy_nonoverlapping(
                data.as_ptr(),
                self.ptr.add(offset),
                data.len()
            );
        }

        Ok(())
    }

    /// 直接读取指定位置
    pub fn read_at(&self, offset: usize, len: usize) -> io::Result<&[u8]> {
        if offset + len > self.len {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "越界读取"));
        }

        unsafe {
            Ok(std::slice::from_raw_parts(self.ptr.add(offset), len))
        }
    }
}

impl Drop for MemoryMappedFile {
    fn drop(&mut self) {
        let layout = std::alloc::Layout::from_size_align(self.len, 4096)
            .expect("布局错误");

        unsafe {
            std::alloc::dealloc(self.ptr, layout);
        }
    }
}

fn main() -> io::Result<()> {
    let mut mmap = MemoryMappedFile::new(4096)?;

    // 写入数据
    mmap.write_at(0, b"Hello, ")?;
    mmap.write_at(7, b"Memory Mapped File!")?;

    // 读取数据
    let data = mmap.read_at(0, 26)?;
    println!("读取内容: {}", std::str::from_utf8(data).unwrap());

    Ok(())
}
```

## 面试要点

### 基础概念题

**Q: Rust 中 `*const T` 和 `*mut T` 有什么区别？**

A:
- `*const T` 是不可变原始指针，表示指向的数据不应该通过该指针修改
- `*mut T` 是可变原始指针，允许通过该指针修改数据
- 但这种区分主要是语义上的，在 unsafe 块中可以将 `*const T` 转换为 `*mut T`
- 原始指针不受借用检查器约束，多个 `*mut T` 可以同时存在

**Q: 为什么创建原始指针是安全的，但解引用需要 unsafe？**

A:
- 创建指针只是获取内存地址，不涉及实际的内存访问
- 解引用涉及读写内存，编译器无法保证：
  - 指针指向有效内存
  - 内存已正确初始化
  - 没有数据竞争
  - 对齐正确

### 实践应用题

**Q: 如何安全地封装 unsafe 代码？**

A:
```rust
// 1. 使用断言验证前置条件
// 2. 在函数签名中使用类型系统表达约束
// 3. 编写 Safety 文档
// 4. 最小化 unsafe 块范围
// 5. 返回安全的抽象

pub fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    assert!(mid <= slice.len());  // 前置条件检查

    let ptr = slice.as_mut_ptr();

    unsafe {
        // 最小 unsafe 块
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), slice.len() - mid),
        )
    }
}
```

**Q: Rust 中如何与 C 库交互？**

A:
```rust
// 1. 使用 extern "C" 声明外部函数
extern "C" {
    fn c_function(arg: i32) -> i32;
}

// 2. 使用 CString/CStr 处理字符串
use std::ffi::{CString, CStr};

// 3. 使用 #[no_mangle] 导出给 C 使用
#[no_mangle]
pub extern "C" fn exported_function() { }

// 4. 处理可能为 null 的指针
fn handle_c_string(ptr: *const c_char) -> Option<&str> {
    if ptr.is_null() {
        return None;
    }
    unsafe {
        CStr::from_ptr(ptr).to_str().ok()
    }
}
```

### 深度理解题

**Q: Send 和 Sync 为什么是 unsafe trait？**

A:
- `Send` 表示类型可以安全地在线程间转移所有权
- `Sync` 表示类型可以安全地在线程间共享引用
- 编译器无法验证这些语义保证，需要程序员手动保证：
  - 没有隐藏的内部可变性
  - 没有线程局部状态
  - 所有内部指针都正确同步

```rust
// 错误地实现 Send/Sync 会导致数据竞争
struct NotActuallySend {
    ptr: *mut i32,  // 原始指针默认不是 Send
}

// 如果错误地实现了 unsafe impl Send，可能导致 UB
// unsafe impl Send for NotActuallySend {}  // 危险！
```

**Q: 什么是未定义行为(UB)？如何避免？**

A:
未定义行为包括：
1. 解引用悬垂或未对齐的指针
2. 数据竞争
3. 违反借用规则（通过 unsafe 创建多个可变引用）
4. 读取未初始化内存
5. 创建无效的基本类型值

避免方法：
1. 使用 Miri 检测
2. 编写详细的 Safety 文档
3. 使用 `MaybeUninit` 处理未初始化内存
4. 使用原子操作或锁保护共享状态
5. 最小化 unsafe 代码范围

## 延伸阅读

### 官方资源

- [The Rustonomicon](https://doc.rust-lang.org/nomicon/) - Unsafe Rust 的权威指南
- [Rust Reference - Unsafe](https://doc.rust-lang.org/reference/unsafe-keyword.html) - 官方参考手册
- [std::ptr 模块文档](https://doc.rust-lang.org/std/ptr/index.html) - 指针操作 API

### 工具

- [Miri](https://github.com/rust-lang/miri) - Rust 未定义行为检测器
- [cargo-careful](https://github.com/RalfJung/cargo-careful) - 额外的运行时检查
- [Kani](https://github.com/model-checking/kani) - Rust 代码的形式化验证

### 进阶阅读

- [Learn Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/) - 通过实现链表学习 unsafe
- [Rustonomicon 中文版](https://learnku.com/docs/nomicon/2018) - Rustonomicon 的中文翻译
- [Rust for Rustaceans](https://nostarch.com/rust-rustaceans) - Jon Gjengset 的进阶 Rust 书籍

### 相关标准库类型

- `std::ptr::NonNull<T>` - 非空指针包装
- `std::mem::MaybeUninit<T>` - 未初始化内存的安全处理
- `std::cell::UnsafeCell<T>` - 内部可变性的基础
- `std::marker::PhantomData<T>` - 类型系统标记
