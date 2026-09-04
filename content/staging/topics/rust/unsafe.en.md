---
title: Unsafe Rust
description: Complete guide to unsafe Rust, raw pointers, FFI and memory safety boundaries
track: rust
section: unsafe-ffi
difficulty: advanced
tags:
  - Rust
  - unsafe
  - Raw Pointers
  - FFI
status: imported
origin: old/src/content/docs/rust/unsafe.en.md
divergence: 0.259
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Rust
  subcategory: Advanced Features
  order: 10
  lastUpdated: 2026-01-07
---

Rust's safety guarantees are one of its most powerful features, but sometimes you need to step outside those boundaries. The `unsafe` keyword allows you to perform operations that the compiler cannot verify as safe, giving you the power to do things that would otherwise be impossible while clearly marking where safety invariants must be manually upheld.

## Understanding Unsafe Rust

Safe Rust provides memory safety guarantees through its ownership system, borrow checker, and type system. However, there are legitimate scenarios where these checks are too restrictive:

- Interfacing with hardware or operating system APIs
- Calling functions written in other languages (FFI)
- Implementing low-level data structures
- Optimizing performance-critical code

The `unsafe` keyword does not disable Rust's safety checks entirely. Instead, it unlocks five specific capabilities that the compiler cannot verify:

1. Dereferencing raw pointers
2. Calling unsafe functions or methods
3. Accessing or modifying mutable static variables
4. Implementing unsafe traits
5. Accessing fields of unions

## Unsafe Blocks

An `unsafe` block tells the compiler "I have verified that this code upholds all necessary safety invariants." The block creates a boundary where unsafe operations are permitted.

```rust
fn main() {
    let x = 42;
    let r = &x as *const i32;  // Creating a raw pointer is safe

    unsafe {
        // Dereferencing the raw pointer requires unsafe
        println!("Value: {}", *r);
    }
}
```

Keep unsafe blocks as small as possible. This practice:
- Makes it easier to audit unsafe code
- Limits the scope where bugs can occur
- Documents exactly which operations require manual verification

```rust
// Good: Minimal unsafe block
fn get_value(ptr: *const i32) -> Option<i32> {
    if ptr.is_null() {
        return None;
    }
    // Only the dereference is unsafe
    Some(unsafe { *ptr })
}

// Avoid: Overly broad unsafe block
fn get_value_broad(ptr: *const i32) -> Option<i32> {
    unsafe {
        // All this code is marked unsafe, but only *ptr needs it
        if ptr.is_null() {
            return None;
        }
        let value = *ptr;
        Some(value)
    }
}
```

## Raw Pointers

Raw pointers (`*const T` and `*mut T`) are similar to references but without Rust's safety guarantees. They:

- Are allowed to be null
- Can point to invalid memory
- Can have multiple mutable pointers to the same location
- Do not implement automatic cleanup (no Drop)
- Are not guaranteed to point to valid data

### Creating Raw Pointers

Creating raw pointers is safe; only dereferencing them requires `unsafe`.

```rust
fn main() {
    let x = 10;
    let y = Box::new(20);

    // From references (always valid while reference is valid)
    let ptr1: *const i32 = &x;
    let ptr2: *const i32 = &*y;

    // From mutable references
    let mut z = 30;
    let ptr3: *mut i32 = &mut z;

    // From raw addresses (potentially dangerous)
    let ptr4 = 0x12345usize as *const i32;

    // Using pointer methods
    let vec = vec![1, 2, 3, 4, 5];
    let ptr5: *const i32 = vec.as_ptr();
}
```

### Dereferencing Raw Pointers

Dereferencing requires `unsafe` because the compiler cannot guarantee the pointer is valid.

```rust
fn main() {
    let x = 42;
    let ptr = &x as *const i32;

    unsafe {
        println!("x = {}", *ptr);
    }

    // Mutable raw pointers
    let mut value = 100;
    let ptr_mut = &mut value as *mut i32;

    unsafe {
        *ptr_mut = 200;
        println!("Modified value: {}", *ptr_mut);
    }
}
```

### Pointer Arithmetic

Raw pointers support arithmetic operations for traversing memory.

```rust
fn main() {
    let numbers = [10, 20, 30, 40, 50];
    let ptr = numbers.as_ptr();

    unsafe {
        // Offset by element count, not bytes
        println!("First: {}", *ptr);
        println!("Third: {}", *ptr.add(2));
        println!("Fifth: {}", *ptr.offset(4));

        // Iterate using pointer arithmetic
        for i in 0..numbers.len() {
            println!("Element {}: {}", i, *ptr.add(i));
        }
    }
}
```

### Pointer Safety Utilities

Rust provides methods to work with pointers more safely.

```rust
fn safe_deref<T: Copy>(ptr: *const T) -> Option<T> {
    if ptr.is_null() {
        return None;
    }

    // Check alignment
    if (ptr as usize) % std::mem::align_of::<T>() != 0 {
        return None;
    }

    // Still unsafe - we cannot verify the memory is valid
    Some(unsafe { *ptr })
}

fn main() {
    let x = 42;
    let valid_ptr = &x as *const i32;
    let null_ptr: *const i32 = std::ptr::null();

    println!("Valid: {:?}", safe_deref(valid_ptr));   // Some(42)
    println!("Null: {:?}", safe_deref(null_ptr));     // None
}
```

## Unsafe Functions

Functions that require callers to uphold certain invariants should be marked `unsafe`. The entire function body becomes an unsafe context.

```rust
/// Swaps the values at two memory locations.
///
/// # Safety
///
/// - Both pointers must be valid and properly aligned.
/// - Both pointers must point to initialized values of type T.
/// - The memory regions must not overlap.
unsafe fn swap_raw<T>(a: *mut T, b: *mut T) {
    let temp = std::ptr::read(a);
    std::ptr::copy_nonoverlapping(b, a, 1);
    std::ptr::write(b, temp);
}

fn main() {
    let mut x = 1;
    let mut y = 2;

    unsafe {
        swap_raw(&mut x, &mut y);
    }

    println!("x = {}, y = {}", x, y);  // x = 2, y = 1
}
```

### Documenting Safety Requirements

Always document what callers must ensure when writing unsafe functions.

```rust
/// Returns a slice from a raw pointer and length.
///
/// # Safety
///
/// Callers must ensure:
/// - `ptr` is valid for reads of `len * size_of::<T>()` bytes
/// - `ptr` is properly aligned for type T
/// - The memory referenced must not be mutated during the lifetime 'a
/// - The total size must not exceed isize::MAX bytes
pub unsafe fn slice_from_raw_parts<'a, T>(ptr: *const T, len: usize) -> &'a [T] {
    std::slice::from_raw_parts(ptr, len)
}
```

## Unsafe Traits

A trait is marked `unsafe` when implementing it requires upholding invariants that the compiler cannot verify.

```rust
/// A trait for types that can be safely zeroed.
///
/// # Safety
///
/// Implementors must ensure that an all-zeros bit pattern
/// represents a valid value of this type.
unsafe trait Zeroable {
    fn zeroed() -> Self;
}

// Safe to implement for primitive integers
unsafe impl Zeroable for i32 {
    fn zeroed() -> Self {
        0
    }
}

unsafe impl Zeroable for u64 {
    fn zeroed() -> Self {
        0
    }
}

// NOT safe for types where zero bits are invalid
// unsafe impl Zeroable for &i32 { }  // null references are undefined behavior!
// unsafe impl Zeroable for bool { }   // only 0 and 1 are valid

fn create_zeroed<T: Zeroable>() -> T {
    T::zeroed()
}

fn main() {
    let x: i32 = create_zeroed();
    let y: u64 = create_zeroed();
    println!("Zeroed values: {}, {}", x, y);
}
```

### The Send and Sync Traits

The most common unsafe traits in Rust's standard library are `Send` and `Sync`.

```rust
use std::cell::UnsafeCell;

// A simple thread-safe cell using atomics
struct AtomicCell<T> {
    value: UnsafeCell<T>,
}

impl<T> AtomicCell<T> {
    fn new(value: T) -> Self {
        AtomicCell {
            value: UnsafeCell::new(value),
        }
    }
}

// We guarantee thread safety through our implementation
unsafe impl<T: Send> Send for AtomicCell<T> {}
unsafe impl<T: Send> Sync for AtomicCell<T> {}
```

## Foreign Function Interface (FFI)

FFI allows Rust to call functions written in other languages and vice versa. All FFI calls are inherently unsafe because Rust cannot verify the safety of foreign code.

### Calling C Functions

```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int, c_double};

// Declare external C functions
extern "C" {
    fn abs(n: c_int) -> c_int;
    fn sqrt(x: c_double) -> c_double;
    fn strlen(s: *const c_char) -> usize;
    fn puts(s: *const c_char) -> c_int;
}

fn main() {
    unsafe {
        // Calling simple C functions
        println!("abs(-5) = {}", abs(-5));
        println!("sqrt(2.0) = {}", sqrt(2.0));

        // Working with C strings
        let message = CString::new("Hello from Rust!").unwrap();
        puts(message.as_ptr());

        let c_str = CString::new("test").unwrap();
        println!("strlen = {}", strlen(c_str.as_ptr()));
    }
}
```

### Linking to C Libraries

```rust
// Link to a specific library
#[link(name = "m")]  // libm for math functions
extern "C" {
    fn sin(x: c_double) -> c_double;
    fn cos(x: c_double) -> c_double;
}

// Static linking
#[link(name = "mylib", kind = "static")]
extern "C" {
    fn my_function();
}
```

### Creating Safe Wrappers

The best practice is to wrap unsafe FFI calls in safe Rust APIs.

```rust
use std::ffi::CString;
use std::os::raw::c_char;

extern "C" {
    fn setenv(name: *const c_char, value: *const c_char, overwrite: i32) -> i32;
    fn getenv(name: *const c_char) -> *const c_char;
}

/// A safe wrapper for setting environment variables.
pub fn set_env(name: &str, value: &str, overwrite: bool) -> Result<(), String> {
    let c_name = CString::new(name)
        .map_err(|_| "Name contains null byte")?;
    let c_value = CString::new(value)
        .map_err(|_| "Value contains null byte")?;

    let result = unsafe {
        setenv(c_name.as_ptr(), c_value.as_ptr(), overwrite as i32)
    };

    if result == 0 {
        Ok(())
    } else {
        Err("Failed to set environment variable".into())
    }
}

/// A safe wrapper for getting environment variables.
pub fn get_env(name: &str) -> Option<String> {
    let c_name = CString::new(name).ok()?;

    let ptr = unsafe { getenv(c_name.as_ptr()) };

    if ptr.is_null() {
        return None;
    }

    let c_str = unsafe { std::ffi::CStr::from_ptr(ptr) };
    c_str.to_str().ok().map(String::from)
}
```

### Exposing Rust Functions to C

```rust
use std::ffi::{c_char, CStr};

/// A function callable from C code.
///
/// # Safety
///
/// The `name` pointer must be a valid null-terminated C string.
#[no_mangle]
pub extern "C" fn greet(name: *const c_char) -> i32 {
    if name.is_null() {
        return -1;
    }

    let c_str = unsafe { CStr::from_ptr(name) };

    match c_str.to_str() {
        Ok(name) => {
            println!("Hello, {}!", name);
            0
        }
        Err(_) => -1,
    }
}

/// Returns a heap-allocated C string. Caller must free with `free_string`.
#[no_mangle]
pub extern "C" fn create_greeting(name: *const c_char) -> *mut c_char {
    if name.is_null() {
        return std::ptr::null_mut();
    }

    let c_str = unsafe { CStr::from_ptr(name) };
    let name = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };

    let greeting = format!("Hello, {}!", name);

    match std::ffi::CString::new(greeting) {
        Ok(c_string) => c_string.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

/// Frees a string allocated by `create_greeting`.
#[no_mangle]
pub extern "C" fn free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            drop(std::ffi::CString::from_raw(s));
        }
    }
}
```

### Working with C Structs

```rust
use std::os::raw::{c_int, c_char};

// C-compatible struct layout
#[repr(C)]
pub struct Point {
    pub x: c_int,
    pub y: c_int,
}

#[repr(C)]
pub struct Person {
    pub name: *const c_char,
    pub age: c_int,
}

extern "C" {
    fn process_point(p: *const Point) -> c_int;
    fn create_person(name: *const c_char, age: c_int) -> Person;
}

fn main() {
    let point = Point { x: 10, y: 20 };

    unsafe {
        let result = process_point(&point);
        println!("Result: {}", result);
    }
}
```

## Practical Examples

### Implementing a Simple Vec

A simplified vector implementation demonstrating unsafe memory management.

```rust
use std::alloc::{alloc, dealloc, realloc, Layout};
use std::ptr;

pub struct SimpleVec<T> {
    ptr: *mut T,
    len: usize,
    capacity: usize,
}

impl<T> SimpleVec<T> {
    pub fn new() -> Self {
        SimpleVec {
            ptr: ptr::null_mut(),
            len: 0,
            capacity: 0,
        }
    }

    pub fn len(&self) -> usize {
        self.len
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }

    pub fn push(&mut self, value: T) {
        if self.len == self.capacity {
            self.grow();
        }

        unsafe {
            ptr::write(self.ptr.add(self.len), value);
        }
        self.len += 1;
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }

        self.len -= 1;
        unsafe {
            Some(ptr::read(self.ptr.add(self.len)))
        }
    }

    pub fn get(&self, index: usize) -> Option<&T> {
        if index >= self.len {
            return None;
        }

        unsafe {
            Some(&*self.ptr.add(index))
        }
    }

    fn grow(&mut self) {
        let new_capacity = if self.capacity == 0 { 4 } else { self.capacity * 2 };
        let new_layout = Layout::array::<T>(new_capacity).unwrap();

        let new_ptr = if self.capacity == 0 {
            unsafe { alloc(new_layout) as *mut T }
        } else {
            let old_layout = Layout::array::<T>(self.capacity).unwrap();
            unsafe {
                realloc(self.ptr as *mut u8, old_layout, new_layout.size()) as *mut T
            }
        };

        if new_ptr.is_null() {
            panic!("Allocation failed");
        }

        self.ptr = new_ptr;
        self.capacity = new_capacity;
    }
}

impl<T> Drop for SimpleVec<T> {
    fn drop(&mut self) {
        if self.capacity > 0 {
            // Drop all elements
            for i in 0..self.len {
                unsafe {
                    ptr::drop_in_place(self.ptr.add(i));
                }
            }

            // Deallocate memory
            let layout = Layout::array::<T>(self.capacity).unwrap();
            unsafe {
                dealloc(self.ptr as *mut u8, layout);
            }
        }
    }
}

fn main() {
    let mut vec = SimpleVec::new();
    vec.push(1);
    vec.push(2);
    vec.push(3);

    println!("Length: {}, Capacity: {}", vec.len(), vec.capacity());
    println!("Element at 1: {:?}", vec.get(1));
    println!("Popped: {:?}", vec.pop());
}
```

### Split at Mutable

Implementing the standard library's `split_at_mut` function.

```rust
fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    assert!(mid <= len, "mid > len");

    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut data = [1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut data, 3);

    left[0] = 10;
    right[0] = 40;

    println!("Left: {:?}", left);   // [10, 2, 3]
    println!("Right: {:?}", right); // [40, 5, 6]
}
```

### Intrusive Linked List

An example of an intrusive data structure using raw pointers.

```rust
use std::ptr;

struct Node<T> {
    value: T,
    next: *mut Node<T>,
    prev: *mut Node<T>,
}

pub struct LinkedList<T> {
    head: *mut Node<T>,
    tail: *mut Node<T>,
    len: usize,
}

impl<T> LinkedList<T> {
    pub fn new() -> Self {
        LinkedList {
            head: ptr::null_mut(),
            tail: ptr::null_mut(),
            len: 0,
        }
    }

    pub fn push_front(&mut self, value: T) {
        let node = Box::into_raw(Box::new(Node {
            value,
            next: self.head,
            prev: ptr::null_mut(),
        }));

        if self.head.is_null() {
            self.tail = node;
        } else {
            unsafe {
                (*self.head).prev = node;
            }
        }

        self.head = node;
        self.len += 1;
    }

    pub fn push_back(&mut self, value: T) {
        let node = Box::into_raw(Box::new(Node {
            value,
            next: ptr::null_mut(),
            prev: self.tail,
        }));

        if self.tail.is_null() {
            self.head = node;
        } else {
            unsafe {
                (*self.tail).next = node;
            }
        }

        self.tail = node;
        self.len += 1;
    }

    pub fn pop_front(&mut self) -> Option<T> {
        if self.head.is_null() {
            return None;
        }

        let node = unsafe { Box::from_raw(self.head) };
        self.head = node.next;

        if self.head.is_null() {
            self.tail = ptr::null_mut();
        } else {
            unsafe {
                (*self.head).prev = ptr::null_mut();
            }
        }

        self.len -= 1;
        Some(node.value)
    }

    pub fn len(&self) -> usize {
        self.len
    }
}

impl<T> Drop for LinkedList<T> {
    fn drop(&mut self) {
        while self.pop_front().is_some() {}
    }
}

fn main() {
    let mut list = LinkedList::new();
    list.push_back(1);
    list.push_back(2);
    list.push_front(0);

    println!("Length: {}", list.len());

    while let Some(value) = list.pop_front() {
        println!("Value: {}", value);
    }
}
```

## When to Use Unsafe

### Legitimate Use Cases

1. **FFI**: Interfacing with C libraries or system calls
2. **Performance**: When profiling shows safe abstractions are a bottleneck
3. **Low-level primitives**: Implementing synchronization primitives, allocators
4. **Hardware access**: Memory-mapped I/O, device drivers
5. **Existing invariants**: When you have knowledge the compiler does not

### When to Avoid Unsafe

1. **Premature optimization**: Profile first, optimize later
2. **Convenience**: If safe code is slightly more verbose, prefer it
3. **Unfamiliar territory**: If you are not certain about the invariants
4. **Available safe alternatives**: Check if a crate provides a safe API

## Best Practices

### Minimize Unsafe Surface Area

```rust
// Good: Safe public API with internal unsafe implementation
pub struct SafeBuffer {
    data: Vec<u8>,
}

impl SafeBuffer {
    pub fn new(size: usize) -> Self {
        SafeBuffer {
            data: vec![0; size],
        }
    }

    pub fn get(&self, index: usize) -> Option<u8> {
        self.data.get(index).copied()
    }

    // Internal unsafe optimization, not exposed
    fn get_unchecked(&self, index: usize) -> u8 {
        debug_assert!(index < self.data.len());
        unsafe { *self.data.get_unchecked(index) }
    }
}
```

### Use Type System to Enforce Invariants

```rust
// A pointer that is guaranteed non-null at the type level
pub struct NonNullPtr<T> {
    ptr: *mut T,
}

impl<T> NonNullPtr<T> {
    /// Creates a new NonNullPtr.
    ///
    /// # Safety
    ///
    /// `ptr` must not be null.
    pub unsafe fn new_unchecked(ptr: *mut T) -> Self {
        debug_assert!(!ptr.is_null());
        NonNullPtr { ptr }
    }

    pub fn new(ptr: *mut T) -> Option<Self> {
        if ptr.is_null() {
            None
        } else {
            Some(NonNullPtr { ptr })
        }
    }

    pub fn as_ptr(&self) -> *mut T {
        self.ptr
    }
}
```

### Document Everything

```rust
/// Copies memory between non-overlapping regions.
///
/// # Safety
///
/// Behavior is undefined if any of the following conditions are violated:
///
/// * `src` must be valid for reads of `count * size_of::<T>()` bytes
/// * `dst` must be valid for writes of `count * size_of::<T>()` bytes
/// * Both `src` and `dst` must be properly aligned
/// * The region of memory beginning at `src` must not overlap with the
///   region beginning at `dst`
///
/// # Examples
///
/// ```
/// let src = [1, 2, 3, 4];
/// let mut dst = [0; 4];
///
/// unsafe {
///     copy_nonoverlapping(src.as_ptr(), dst.as_mut_ptr(), 4);
/// }
///
/// assert_eq!(dst, [1, 2, 3, 4]);
/// ```
pub unsafe fn copy_nonoverlapping<T>(src: *const T, dst: *mut T, count: usize) {
    std::ptr::copy_nonoverlapping(src, dst, count);
}
```

### Use Debug Assertions

```rust
unsafe fn get_unchecked<T>(slice: &[T], index: usize) -> &T {
    // Catches bugs in debug builds
    debug_assert!(index < slice.len(), "index out of bounds");

    &*slice.as_ptr().add(index)
}
```

## Common Pitfalls

### Dangling Pointers

```rust
fn dangling() -> *const i32 {
    let x = 42;
    &x as *const i32  // x is dropped, pointer is dangling!
}

// Correct approach
fn not_dangling() -> *const i32 {
    let x = Box::new(42);
    Box::into_raw(x)  // Caller must eventually call Box::from_raw
}
```

### Aliasing Violations

```rust
fn aliasing_violation() {
    let mut data = vec![1, 2, 3];
    let ptr1 = data.as_mut_ptr();
    let ptr2 = data.as_mut_ptr();

    // Undefined behavior: two mutable pointers to the same data
    // being used simultaneously
    unsafe {
        *ptr1 = 10;
        *ptr2 = 20;  // Which value wins? Undefined!
    }
}
```

### Uninitialized Memory

```rust
use std::mem::MaybeUninit;

fn safe_uninit() {
    // Correct: Use MaybeUninit for uninitialized memory
    let mut uninit: MaybeUninit<i32> = MaybeUninit::uninit();

    unsafe {
        uninit.as_mut_ptr().write(42);
        let value = uninit.assume_init();
        println!("Value: {}", value);
    }
}

fn unsafe_uninit() {
    // WRONG: Reading uninitialized memory is undefined behavior
    // let x: i32 = unsafe { std::mem::uninitialized() };
}
```

## Testing Unsafe Code

Use tools like Miri to detect undefined behavior.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_vec() {
        let mut vec = SimpleVec::new();

        for i in 0..100 {
            vec.push(i);
        }

        assert_eq!(vec.len(), 100);

        for i in (0..100).rev() {
            assert_eq!(vec.pop(), Some(i));
        }

        assert_eq!(vec.pop(), None);
    }

    #[test]
    fn test_with_drop_types() {
        let mut vec = SimpleVec::new();
        vec.push(String::from("hello"));
        vec.push(String::from("world"));

        // Ensure Drop is called correctly
        drop(vec);
    }
}
```

Run with Miri:

```bash
cargo +nightly miri test
```

## Summary

Unsafe Rust is a powerful tool that should be used judiciously. Remember:

- **Unsafe does not mean incorrect** - it means the programmer takes responsibility for safety
- **Keep unsafe blocks small** - minimize the code that needs manual verification
- **Document safety requirements** - future maintainers need to understand the invariants
- **Wrap unsafe in safe APIs** - provide safe abstractions for users of your code
- **Test thoroughly** - use tools like Miri to catch undefined behavior
- **When in doubt, use safe Rust** - the performance cost is usually negligible

The `unsafe` keyword is not an escape hatch to avoid thinking about safety. Instead, it is a marker that says "here be dragons" and demands extra care and attention from the programmer. Used responsibly, it enables Rust to be both safe and capable of low-level systems programming.
