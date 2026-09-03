---
title: Rust Raw Pointers and Unsafe
description: Deep understanding of Rust raw pointers *const T and *mut T, unsafe block use cases and best practices
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
origin: old/src/content/docs/rust/raw-pointers.en.md
divergence: 0.219
issues: []
legacy:
  category: Rust
  subcategory: 高级特性
  order: 11
  lastUpdated: 2026-01-07
---

Rust is renowned for its strict memory safety guarantees, but sometimes we need to break through these restrictions for low-level operations, performance optimization, or interaction with other languages. Raw Pointers and the `unsafe` keyword provide us with this capability, while also bringing additional responsibility.

## Concept Explanation

### What Are Raw Pointers

Raw pointers are the types in Rust closest to C/C++ pointers. They directly represent memory addresses and are not constrained by Rust's borrow checker. Rust provides two raw pointer types:

- **`*const T`**: Immutable raw pointer, similar to `const T*` in C
- **`*mut T`**: Mutable raw pointer, similar to `T*` in C

Unlike references (`&T` and `&mut T`), raw pointers have the following characteristics:

| Feature | References | Raw Pointers |
|---------|------------|--------------|
| Borrowing rules | Enforced at compile time | No restrictions |
| Null value | Not allowed | Allowed |
| Validity guarantee | Guaranteed by compiler | Programmer's responsibility |
| Auto-dereference | Supported | Not supported |
| Auto-cleanup | Scope-based | None |

### What Is Unsafe

The `unsafe` keyword marks a code region where operations that the compiler cannot verify for safety can be performed. Using `unsafe` does not mean the code is definitely unsafe, but rather transfers the responsibility for safety verification from the compiler to the programmer.

```rust
// unsafe block: marks the boundary of unsafe operations
unsafe {
    // Can perform unsafe operations
}

// unsafe function: caller must ensure preconditions are met
unsafe fn dangerous_operation() {
    // The entire function body is an unsafe context
}

// unsafe trait: implementer must ensure specific invariants are met
unsafe trait UnsafeTrait {
    // trait definition
}
```

### Historical Background

Rust's design philosophy is "zero-cost abstractions" and "fearless concurrency". To achieve these goals, Rust enforces strict memory safety rules at compile time. However, certain low-level operations inherently cannot be verified at compile time:

1. **Operating system interaction**: Direct hardware manipulation or system calls
2. **FFI boundaries**: Interaction with other languages like C
3. **Performance optimization**: Bypassing certain runtime checks
4. **Data structure implementation**: Such as intrusive linked lists, self-referential structures

The introduction of `unsafe` resolves this contradiction: it allows breaking through restrictions when necessary while keeping most code safe.

## Core Principles

### Memory Model of Raw Pointers

Raw pointers are essentially memory addresses, occupying 8 bytes on 64-bit systems:

```rust
use std::mem::size_of;

fn main() {
    println!("*const i32 size: {} bytes", size_of::<*const i32>());
    println!("*mut i32 size: {} bytes", size_of::<*mut i32>());
    println!("&i32 size: {} bytes", size_of::<&i32>());

    // Fat pointers contain extra metadata
    println!("*const [i32] size: {} bytes", size_of::<*const [i32]>());
    println!("&[i32] size: {} bytes", size_of::<&[i32]>());
}
```

Output:
```
*const i32 size: 8 bytes
*mut i32 size: 8 bytes
&i32 size: 8 bytes
*const [i32] size: 16 bytes
&[i32] size: 16 bytes
```

### Conversion Between Pointers and References

```rust
fn main() {
    let x = 42;
    let r = &x;                    // Immutable reference

    // Reference to raw pointer (safe)
    let ptr: *const i32 = r;       // Implicit conversion
    let ptr2: *const i32 = &x as *const i32;  // Explicit conversion

    // Raw pointer to reference (unsafe)
    unsafe {
        let r2: &i32 = &*ptr;      // Requires unsafe
        println!("Value: {}", *r2);
    }
}
```

### The Five Superpowers of Unsafe

In an `unsafe` block or function, you can perform the following five operations that are otherwise forbidden:

```rust
// 1. Dereference raw pointers
unsafe {
    let ptr = &42 as *const i32;
    let value = *ptr;  // Dereference
}

// 2. Call unsafe functions or methods
unsafe fn dangerous() {}
unsafe {
    dangerous();
}

// 3. Access or modify mutable static variables
static mut COUNTER: u32 = 0;
unsafe {
    COUNTER += 1;
}

// 4. Implement unsafe traits
unsafe trait Scary {}
unsafe impl Scary for i32 {}

// 5. Access union fields
union MyUnion {
    i: i32,
    f: f32,
}
let u = MyUnion { i: 42 };
unsafe {
    println!("{}", u.i);
}
```

### Creating and Converting Raw Pointers

Creating raw pointers is safe; only dereferencing requires `unsafe`:

```rust
fn main() {
    // Method 1: Convert from reference
    let x = 10;
    let ptr1 = &x as *const i32;

    // Method 2: Convert from mutable reference
    let mut y = 20;
    let ptr2 = &mut y as *mut i32;

    // Method 3: Using std::ptr module
    let ptr3: *const i32 = std::ptr::null();
    let ptr4: *mut i32 = std::ptr::null_mut();

    // Method 4: Create from integer address (dangerous!)
    let addr: usize = 0x7fff_0000;
    let ptr5 = addr as *const i32;

    // Method 5: Get from Box
    let boxed = Box::new(30);
    let ptr6 = Box::into_raw(boxed);  // Note: requires manual deallocation

    unsafe {
        // Convert pointer back to Box to properly deallocate memory
        let _ = Box::from_raw(ptr6);
    }
}
```

## Key Points

### Raw Pointer Types in Detail

#### `*const T` - Immutable Raw Pointer

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let ptr: *const i32 = arr.as_ptr();

    unsafe {
        // Read value
        println!("First element: {}", *ptr);

        // Pointer arithmetic
        let second = ptr.add(1);
        println!("Second element: {}", *second);

        // Offset access
        for i in 0..arr.len() {
            println!("arr[{}] = {}", i, *ptr.add(i));
        }
    }
}
```

#### `*mut T` - Mutable Raw Pointer

```rust
fn main() {
    let mut arr = [1, 2, 3, 4, 5];
    let ptr: *mut i32 = arr.as_mut_ptr();

    unsafe {
        // Modify value
        *ptr = 10;
        *ptr.add(2) = 30;

        // Using write method
        ptr.add(4).write(50);
    }

    println!("After modification: {:?}", arr);  // [10, 2, 30, 4, 50]
}
```

### Pointer Arithmetic Methods

```rust
fn main() {
    let arr = [10, 20, 30, 40, 50];
    let ptr = arr.as_ptr();

    unsafe {
        // add: offset forward by n elements
        let p1 = ptr.add(2);
        println!("ptr.add(2) = {}", *p1);  // 30

        // sub: offset backward by n elements
        let p2 = p1.sub(1);
        println!("p1.sub(1) = {}", *p2);   // 20

        // offset: can be positive or negative
        let p3 = ptr.offset(3);
        println!("ptr.offset(3) = {}", *p3);  // 40

        // wrapping_add: wrapping arithmetic offset
        let p4 = ptr.wrapping_add(1);
        println!("ptr.wrapping_add(1) = {}", *p4);  // 20
    }
}
```

### Pointer Comparison and Checking

```rust
fn main() {
    let x = 42;
    let ptr1 = &x as *const i32;
    let ptr2 = &x as *const i32;
    let null_ptr: *const i32 = std::ptr::null();

    // Pointer equality comparison (safe operation)
    println!("ptr1 == ptr2: {}", ptr1 == ptr2);  // true
    println!("ptr1 == null: {}", ptr1 == null_ptr);  // false

    // Check if null
    println!("ptr1 is null: {}", ptr1.is_null());   // false
    println!("null_ptr is null: {}", null_ptr.is_null());  // true

    // Alignment check
    println!("ptr1 aligned to 4: {}", ptr1.is_aligned_to(4));
}
```

### Safe Pointer Operation Methods

```rust
fn main() {
    let x = 42;
    let ptr = &x as *const i32;

    unsafe {
        // read: read value (may be unaligned)
        let value = std::ptr::read(ptr);
        println!("read: {}", value);

        // read_unaligned: read unaligned value
        let value2 = std::ptr::read_unaligned(ptr);
        println!("read_unaligned: {}", value2);
    }

    let mut y = 0;
    let ptr_mut = &mut y as *mut i32;

    unsafe {
        // write: write value
        std::ptr::write(ptr_mut, 100);
        println!("after write: {}", y);  // 100

        // write_volatile: write that prevents optimization
        std::ptr::write_volatile(ptr_mut, 200);
        println!("after write_volatile: {}", y);  // 200
    }
}
```

### Memory Copy Operations

```rust
fn main() {
    let src = [1, 2, 3, 4, 5];
    let mut dst = [0; 5];

    unsafe {
        // copy_nonoverlapping: non-overlapping memory copy (like memcpy)
        std::ptr::copy_nonoverlapping(
            src.as_ptr(),
            dst.as_mut_ptr(),
            src.len()
        );
    }
    println!("After copy: {:?}", dst);  // [1, 2, 3, 4, 5]

    let mut arr = [1, 2, 3, 4, 5];
    unsafe {
        // copy: possibly overlapping memory copy (like memmove)
        std::ptr::copy(
            arr.as_ptr().add(1),
            arr.as_mut_ptr(),
            3
        );
    }
    println!("After overlapping copy: {:?}", arr);  // [2, 3, 4, 4, 5]
}
```

## Code Examples

### Example 1: Safe Slice Splitting Using Raw Pointers

```rust
use std::slice;

/// Split a slice at the specified position into two mutable slices
///
/// This is a simplified implementation of the standard library's `split_at_mut`
fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    // Runtime check ensures safety
    assert!(mid <= len, "Index {} out of range (length is {})", mid, len);

    unsafe {
        // Safety explanation:
        // 1. mid <= len, so both slices are within valid range
        // 2. The two slices do not overlap
        // 3. The original slice remains valid during the lifetime of returned slices
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

    println!("After split: {:?}", arr);  // [10, 2, 3, 40, 5, 6]
}
```

### Example 2: Efficient Element Swap Using Raw Pointers

```rust
/// Swap two values using raw pointers, avoiding temporary variables
///
/// # Safety
///
/// Caller must ensure:
/// - Both `a` and `b` are valid, writable pointers
/// - Memory pointed to by `a` and `b` does not overlap
unsafe fn swap_raw<T>(a: *mut T, b: *mut T) {
    // Use std::ptr::swap for safe swapping
    std::ptr::swap(a, b);
}

/// Safe wrapper function
fn swap<T>(a: &mut T, b: &mut T) {
    unsafe {
        swap_raw(a as *mut T, b as *mut T);
    }
}

fn main() {
    let mut x = 10;
    let mut y = 20;

    println!("Before swap: x = {}, y = {}", x, y);
    swap(&mut x, &mut y);
    println!("After swap: x = {}, y = {}", x, y);

    // Swap array elements
    let mut arr = [1, 2, 3, 4, 5];
    unsafe {
        swap_raw(
            arr.as_mut_ptr().add(0),
            arr.as_mut_ptr().add(4)
        );
    }
    println!("After array swap: {:?}", arr);  // [5, 2, 3, 4, 1]
}
```

### Example 3: NonNull Smart Pointer Wrapper

```rust
use std::ptr::NonNull;

/// Linked list node using NonNull
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
        // Box::into_raw returns *mut T, convert to NonNull
        // Safety: Box::into_raw returns a never-null pointer
        unsafe { NonNull::new_unchecked(Box::into_raw(boxed)) }
    }
}

/// Simple singly linked list
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
                // Convert NonNull back to Box to properly deallocate memory
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

    println!("List length: {}", list.len());

    while let Some(value) = list.pop_front() {
        println!("Popped: {}", value);
    }

    println!("Is list empty: {}", list.is_empty());

    // NonNull memory optimization
    println!("
=== Memory Optimization Demo ===");
    println!("Option<NonNull<i32>> size: {} bytes",
             std::mem::size_of::<Option<NonNull<i32>>>());
    println!("Option<*mut i32> size: {} bytes",
             std::mem::size_of::<Option<*mut i32>>());
    println!("*mut i32 size: {} bytes",
             std::mem::size_of::<*mut i32>());
    // Option<NonNull<T>> is the same size as *mut T (null pointer optimization)
}
```

### Example 4: Implementing Custom Memory Allocation

```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

/// Simple fixed-size memory pool
struct MemoryPool {
    buffer: *mut u8,
    layout: Layout,
    size: usize,
    used: usize,
}

impl MemoryPool {
    /// Create a memory pool of specified size
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

    /// Allocate memory from the pool
    fn allocate(&mut self, size: usize, align: usize) -> Option<*mut u8> {
        // Calculate aligned offset
        let current = self.buffer as usize + self.used;
        let aligned = (current + align - 1) & !(align - 1);
        let offset = aligned - self.buffer as usize;

        if offset + size > self.size {
            return None;  // Insufficient space
        }

        self.used = offset + size;

        Some(unsafe { self.buffer.add(offset) })
    }

    /// Allocate and initialize a specific type
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

    /// Get the used memory size
    fn used(&self) -> usize {
        self.used
    }

    /// Reset the memory pool (does not deallocate memory, only resets usage count)
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
    let mut pool = MemoryPool::new(1024).expect("Allocation failed");

    // Allocate some values
    let int_ptr = pool.allocate_value(42i32).expect("Failed to allocate i32");
    let float_ptr = pool.allocate_value(3.14f64).expect("Failed to allocate f64");
    let str_ptr = pool.allocate_value("Hello").expect("Failed to allocate &str");

    unsafe {
        println!("int: {}", *int_ptr);
        println!("float: {}", *float_ptr);
        println!("str: {}", *str_ptr);
    }

    println!("Memory used: {} bytes", pool.used());

    // Reset pool
    pool.reset();
    println!("Used after reset: {} bytes", pool.used());
}
```

### Example 5: FFI and C Language Interaction

```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// Declare C standard library functions
extern "C" {
    fn strlen(s: *const c_char) -> usize;
    fn strcmp(s1: *const c_char, s2: *const c_char) -> c_int;
    fn memcpy(dest: *mut u8, src: *const u8, n: usize) -> *mut u8;
}

/// Safe string length calculation
fn safe_strlen(s: &str) -> usize {
    let c_string = CString::new(s).expect("String contains null byte");
    unsafe {
        strlen(c_string.as_ptr())
    }
}

/// Safe string comparison
fn safe_strcmp(s1: &str, s2: &str) -> i32 {
    let c_str1 = CString::new(s1).expect("s1 contains null byte");
    let c_str2 = CString::new(s2).expect("s2 contains null byte");

    unsafe {
        strcmp(c_str1.as_ptr(), c_str2.as_ptr())
    }
}

/// Function exported for C use
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
            // Convert C string back to CString to properly deallocate memory
            drop(CString::from_raw(s));
        }
    }
}

fn main() {
    // Using C functions
    println!("strlen("hello"): {}", safe_strlen("hello"));

    let cmp_result = safe_strcmp("apple", "banana");
    println!("strcmp("apple", "banana"): {}", cmp_result);

    // Test exported functions
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

## Best Practices

### Minimize the Scope of unsafe Blocks

```rust
// Not recommended: marking entire function as unsafe
unsafe fn bad_example(data: &[u8], index: usize) -> u8 {
    // Lots of safe code...
    let len = data.len();
    // More safe code...
    *data.as_ptr().add(index)
}

// Recommended: only use unsafe when necessary
fn good_example(data: &[u8], index: usize) -> Option<u8> {
    if index >= data.len() {
        return None;
    }

    // Keep unsafe block as small as possible
    Some(unsafe { *data.as_ptr().add(index) })
}
```

### Write Detailed Safety Documentation

```rust
/// Create a slice from raw pointer and length
///
/// # Safety
///
/// Caller must ensure the following conditions:
///
/// * `ptr` must be a valid, initialized pointer
/// * Memory pointed to by `ptr` must contain at least `len` consecutive elements of type `T`
/// * Memory must remain valid during the lifetime of the returned slice
/// * Memory cannot be simultaneously modified by other code (unless `T` is `Sync`)
/// * `len * size_of::<T>()` must not exceed `isize::MAX`
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

### Use the Type System to Provide Extra Protection

```rust
use std::marker::PhantomData;

/// Wrap raw pointer, providing lifetime tracking
pub struct Ptr<'a, T> {
    ptr: *const T,
    _marker: PhantomData<&'a T>,
}

impl<'a, T> Ptr<'a, T> {
    /// Create from reference, guaranteeing pointer validity
    pub fn new(reference: &'a T) -> Self {
        Ptr {
            ptr: reference as *const T,
            _marker: PhantomData,
        }
    }

    /// Safely get reference, because lifetime is tracked
    pub fn as_ref(&self) -> &'a T {
        // Safety: pointer comes from valid reference, lifetime is correctly tracked
        unsafe { &*self.ptr }
    }

    /// Get underlying pointer
    pub fn as_ptr(&self) -> *const T {
        self.ptr
    }
}

fn main() {
    let value = 42;
    let ptr = Ptr::new(&value);

    println!("Access through safe wrapper: {}", ptr.as_ref());
}
```

### Use Assertions to Verify Assumptions

```rust
/// Copy source slice to destination slice
fn copy_slice<T: Copy>(src: &[T], dst: &mut [T]) {
    // Use assertions to verify preconditions
    assert!(
        src.len() <= dst.len(),
        "Source slice length ({}) exceeds destination slice length ({})",
        src.len(),
        dst.len()
    );

    // Extra checks in debug mode
    debug_assert!(
        !std::ptr::eq(src.as_ptr(), dst.as_ptr()),
        "Source and destination should not overlap"
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
    println!("After copy: {:?}", dst);  // [1, 2, 3, 0, 0]
}
```

### Encapsulate unsafe Code to Provide Safe API

```rust
/// High-performance ring buffer
pub struct RingBuffer<T> {
    buffer: *mut T,
    capacity: usize,
    head: usize,
    tail: usize,
    len: usize,
}

impl<T> RingBuffer<T> {
    /// Create a ring buffer with specified capacity
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "Capacity must be greater than 0");

        let layout = std::alloc::Layout::array::<T>(capacity)
            .expect("Layout calculation failed");

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

    /// Push element
    pub fn push(&mut self, value: T) -> bool {
        if self.len == self.capacity {
            return false;  // Buffer is full
        }

        unsafe {
            self.buffer.add(self.tail).write(value);
        }

        self.tail = (self.tail + 1) % self.capacity;
        self.len += 1;
        true
    }

    /// Pop element
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

    /// Get length
    pub fn len(&self) -> usize {
        self.len
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
}

impl<T> Drop for RingBuffer<T> {
    fn drop(&mut self) {
        // First drop all elements
        while self.pop().is_some() {}

        // Then deallocate memory
        let layout = std::alloc::Layout::array::<T>(self.capacity)
            .expect("Layout calculation failed");

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

    println!("Buffer full: {}", !buffer.push(4));  // true

    println!("Popped: {:?}", buffer.pop());  // Some(1)

    buffer.push(4);  // Now we can push

    while let Some(v) = buffer.pop() {
        println!("Popped: {}", v);  // 2, 3, 4
    }
}
```

## Common Pitfalls

### Dangling Pointers

```rust
// Error: returning pointer to local variable
fn dangling_pointer() -> *const i32 {
    let x = 42;
    &x as *const i32  // x is deallocated after function returns
}

// Correct: use Box for heap allocation
fn valid_pointer() -> *mut i32 {
    Box::into_raw(Box::new(42))
}

fn main() {
    // Dangerous! ptr points to deallocated memory
    // let ptr = dangling_pointer();
    // unsafe { println!("{}", *ptr); }  // Undefined behavior

    // Correct usage
    let ptr = valid_pointer();
    unsafe {
        println!("Value: {}", *ptr);
        // Remember to deallocate memory
        drop(Box::from_raw(ptr));
    }
}
```

### Data Races

```rust
use std::thread;

static mut COUNTER: i32 = 0;

// Dangerous: multi-threaded access to mutable static variable
fn data_race_example() {
    let handles: Vec<_> = (0..10)
        .map(|_| {
            thread::spawn(|| {
                unsafe {
                    COUNTER += 1;  // Data race!
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
}

// Correct: use atomic operations
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

    println!("Safe counter: {}", SAFE_COUNTER.load(Ordering::SeqCst));
}

fn main() {
    safe_example();
}
```

### Type Punning

```rust
fn main() {
    // Dangerous: conversion between types of different sizes
    let x: u32 = 42;
    // let y: u64 = unsafe { std::mem::transmute(x) };  // Compile error or UB

    // Correct: use explicit type conversion
    let y: u64 = x as u64;
    println!("After conversion: {}", y);

    // transmute between types of same size
    let f: f32 = 3.14;
    let bits: u32 = unsafe { std::mem::transmute(f) };
    println!("f32 bit representation: 0x{:08X}", bits);

    // Safer alternative
    let bits2 = f.to_bits();
    println!("Using to_bits: 0x{:08X}", bits2);
}
```

### Violating Borrowing Rules

```rust
fn main() {
    let mut data = vec![1, 2, 3];
    let ptr = data.as_mut_ptr();

    // Dangerous: mutable reference and raw pointer access exist simultaneously
    unsafe {
        *ptr = 10;
        data.push(4);  // May cause reallocation
        // *ptr = 20;  // Undefined behavior! ptr may be invalidated
    }

    // Correct approach: avoid mixed use
    let mut data2 = vec![1, 2, 3];

    unsafe {
        let ptr = data2.as_mut_ptr();
        *ptr = 10;
        *ptr.add(1) = 20;
    }

    data2.push(4);  // Now safe to use
    println!("{:?}", data2);
}
```

### Forgetting to Deallocate Memory

```rust
fn main() {
    // Error: memory leak
    let ptr = Box::into_raw(Box::new(vec![1, 2, 3]));
    // Forgot to call Box::from_raw(ptr)

    // Correct: ensure memory is deallocated
    let ptr = Box::into_raw(Box::new(vec![1, 2, 3]));
    unsafe {
        let _boxed = Box::from_raw(ptr);
        // _boxed is automatically deallocated at end of scope
    }

    // Use scopeguard to ensure cleanup
    // let _guard = scopeguard::guard(ptr, |p| unsafe {
    //     Box::from_raw(p);
    // });
}
```

### Uninitialized Memory

```rust
use std::mem::MaybeUninit;

fn main() {
    // Dangerous: reading uninitialized memory
    // let x: i32;
    // unsafe { println!("{}", x); }  // Undefined behavior

    // Correct: use MaybeUninit
    let mut uninit: MaybeUninit<[i32; 5]> = MaybeUninit::uninit();

    unsafe {
        let ptr = uninit.as_mut_ptr() as *mut i32;
        for i in 0..5 {
            ptr.add(i).write(i as i32);
        }

        let initialized = uninit.assume_init();
        println!("After initialization: {:?}", initialized);
    }
}
```

## Performance Considerations

### Bounds Check Elimination

```rust
fn sum_with_bounds_check(arr: &[i32]) -> i32 {
    let mut sum = 0;
    for i in 0..arr.len() {
        sum += arr[i];  // Bounds check on every access
    }
    sum
}

fn sum_with_iterator(arr: &[i32]) -> i32 {
    arr.iter().sum()  // Iterator avoids bounds checks
}

fn sum_with_unsafe(arr: &[i32]) -> i32 {
    let mut sum = 0;
    let ptr = arr.as_ptr();
    let len = arr.len();

    unsafe {
        for i in 0..len {
            sum += *ptr.add(i);  // No bounds check
        }
    }
    sum
}

// Benchmark example
fn main() {
    let arr: Vec<i32> = (0..10000).collect();

    // In real scenarios, the compiler can often optimize away bounds checks
    // Only use unsafe when benchmarks show actual performance issues

    let sum1 = sum_with_bounds_check(&arr);
    let sum2 = sum_with_iterator(&arr);
    let sum3 = sum_with_unsafe(&arr);

    assert_eq!(sum1, sum2);
    assert_eq!(sum2, sum3);

    println!("All methods produce consistent results: {}", sum1);
}
```

### Avoiding Unnecessary Copies

```rust
use std::mem::ManuallyDrop;

/// Get Vec's internal buffer without copying
fn take_buffer<T>(vec: Vec<T>) -> (*mut T, usize, usize) {
    let mut vec = ManuallyDrop::new(vec);
    (vec.as_mut_ptr(), vec.len(), vec.capacity())
}

/// Rebuild Vec from raw parts
unsafe fn rebuild_vec<T>(ptr: *mut T, len: usize, cap: usize) -> Vec<T> {
    Vec::from_raw_parts(ptr, len, cap)
}

fn main() {
    let original = vec![1, 2, 3, 4, 5];
    let original_ptr = original.as_ptr();

    let (ptr, len, cap) = take_buffer(original);

    // Verify pointers are the same (no copy)
    assert_eq!(original_ptr, ptr as *const i32);

    unsafe {
        let recovered = rebuild_vec(ptr, len, cap);
        println!("Recovered Vec: {:?}", recovered);
    }
}
```

### SIMD Optimization

```rust
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

/// Use SIMD to accelerate array summation (example only)
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

        // Horizontal sum
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
    println!("SIMD sum result: {}", sum);
}
```

### When to Use unsafe for Performance Optimization

```rust
// Cases where unsafe is usually not needed:
// - Compiler already optimizes well
// - Using iterators and functional methods
// - Using provided safe wrappers like get_unchecked

// Cases where unsafe might be needed:
// - Benchmarks confirm performance bottleneck
// - Implementing low-level data structures
// - FFI boundaries
// - Precise memory layout control

fn main() {
    let arr = [1, 2, 3, 4, 5];

    // Prefer safe APIs
    let sum: i32 = arr.iter().sum();

    // If you really need to skip bounds checking
    let first = unsafe { *arr.get_unchecked(0) };

    println!("Sum: {}, First: {}", sum, first);
}
```

## Practical Scenarios

### Scenario 1: Implementing Custom Smart Pointer

```rust
use std::ops::{Deref, DerefMut};
use std::ptr::NonNull;
use std::alloc::{alloc, dealloc, Layout};

/// Simple smart pointer similar to Box
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

        // Prevent Drop from deallocating again
        std::mem::forget(self);

        // Deallocate memory without calling destructor
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
            // First call value's destructor
            std::ptr::drop_in_place(self.ptr.as_ptr());

            // Then deallocate memory
            let layout = Layout::new::<T>();
            dealloc(self.ptr.as_ptr() as *mut u8, layout);
        }
    }
}

fn main() {
    let boxed = SimpleBox::new(String::from("Hello, SimpleBox!"));
    println!("Content: {}", *boxed);

    let mut boxed_num = SimpleBox::new(42);
    *boxed_num += 8;
    println!("After modification: {}", *boxed_num);
}
```

### Scenario 2: High-Performance Parser

```rust
/// Zero-copy string parser
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

    /// Fast whitespace skipping
    pub fn skip_whitespace(&mut self) {
        let ptr = self.input.as_ptr();
        let len = self.input.len();

        unsafe {
            while self.pos < len {
                let byte = *ptr.add(self.pos);
                if byte != b' ' && byte != b'	' && byte != b'
' && byte != b'' {
                    break;
                }
                self.pos += 1;
            }
        }
    }

    /// Parse integer (version without bounds checking)
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
            // Handle sign
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

    /// Get remaining input
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
        println!("Parsed number: {}", num);
    }

    println!("Remaining input: '{}'", parser.remaining());
}
```

### Scenario 3: Memory-Mapped File

```rust
use std::fs::File;
use std::io;
use std::ptr;

/// Simplified memory mapping (for demonstration purposes only)
pub struct MemoryMappedFile {
    ptr: *mut u8,
    len: usize,
}

impl MemoryMappedFile {
    /// Create memory mapping (simplified version, just allocates memory to simulate)
    pub fn new(size: usize) -> io::Result<Self> {
        let layout = std::alloc::Layout::from_size_align(size, 4096)
            .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "Layout error"))?;

        let ptr = unsafe { std::alloc::alloc_zeroed(layout) };

        if ptr.is_null() {
            return Err(io::Error::new(io::ErrorKind::OutOfMemory, "Allocation failed"));
        }

        Ok(MemoryMappedFile { ptr, len: size })
    }

    /// Get read-only view
    pub fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }

    /// Get mutable view
    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.ptr, self.len) }
    }

    /// Direct write at specified position
    pub fn write_at(&mut self, offset: usize, data: &[u8]) -> io::Result<()> {
        if offset + data.len() > self.len {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "Out of bounds write"));
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

    /// Direct read at specified position
    pub fn read_at(&self, offset: usize, len: usize) -> io::Result<&[u8]> {
        if offset + len > self.len {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "Out of bounds read"));
        }

        unsafe {
            Ok(std::slice::from_raw_parts(self.ptr.add(offset), len))
        }
    }
}

impl Drop for MemoryMappedFile {
    fn drop(&mut self) {
        let layout = std::alloc::Layout::from_size_align(self.len, 4096)
            .expect("Layout error");

        unsafe {
            std::alloc::dealloc(self.ptr, layout);
        }
    }
}

fn main() -> io::Result<()> {
    let mut mmap = MemoryMappedFile::new(4096)?;

    // Write data
    mmap.write_at(0, b"Hello, ")?;
    mmap.write_at(7, b"Memory Mapped File!")?;

    // Read data
    let data = mmap.read_at(0, 26)?;
    println!("Read content: {}", std::str::from_utf8(data).unwrap());

    Ok(())
}
```

## Interview Key Points

### Basic Concept Questions

**Q: What is the difference between `*const T` and `*mut T` in Rust?**

A:
- `*const T` is an immutable raw pointer, indicating that data should not be modified through this pointer
- `*mut T` is a mutable raw pointer, allowing data modification through this pointer
- This distinction is mainly semantic; in unsafe blocks, `*const T` can be converted to `*mut T`
- Raw pointers are not constrained by the borrow checker; multiple `*mut T` can exist simultaneously

**Q: Why is creating raw pointers safe, but dereferencing requires unsafe?**

A:
- Creating a pointer just obtains a memory address, without actual memory access
- Dereferencing involves reading/writing memory, and the compiler cannot guarantee:
  - The pointer points to valid memory
  - Memory is properly initialized
  - No data races
  - Alignment is correct

### Practical Application Questions

**Q: How to safely encapsulate unsafe code?**

A:
```rust
// 1. Use assertions to verify preconditions
// 2. Use the type system in function signatures to express constraints
// 3. Write Safety documentation
// 4. Minimize unsafe block scope
// 5. Return safe abstractions

pub fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    assert!(mid <= slice.len());  // Precondition check

    let ptr = slice.as_mut_ptr();

    unsafe {
        // Minimal unsafe block
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), slice.len() - mid),
        )
    }
}
```

**Q: How to interact with C libraries in Rust?**

A:
```rust
// 1. Use extern "C" to declare external functions
extern "C" {
    fn c_function(arg: i32) -> i32;
}

// 2. Use CString/CStr for string handling
use std::ffi::{CString, CStr};

// 3. Use #[no_mangle] to export for C use
#[no_mangle]
pub extern "C" fn exported_function() { }

// 4. Handle possibly null pointers
fn handle_c_string(ptr: *const c_char) -> Option<&str> {
    if ptr.is_null() {
        return None;
    }
    unsafe {
        CStr::from_ptr(ptr).to_str().ok()
    }
}
```

### Deep Understanding Questions

**Q: Why are Send and Sync unsafe traits?**

A:
- `Send` indicates a type can safely transfer ownership between threads
- `Sync` indicates a type can safely share references between threads
- The compiler cannot verify these semantic guarantees; programmers must manually ensure:
  - No hidden interior mutability
  - No thread-local state
  - All internal pointers are properly synchronized

```rust
// Incorrectly implementing Send/Sync can cause data races
struct NotActuallySend {
    ptr: *mut i32,  // Raw pointers are not Send by default
}

// If Send is incorrectly implemented, it may cause UB
// unsafe impl Send for NotActuallySend {}  // Dangerous!
```

**Q: What is Undefined Behavior (UB)? How to avoid it?**

A:
Undefined behavior includes:
1. Dereferencing dangling or unaligned pointers
2. Data races
3. Violating borrowing rules (creating multiple mutable references through unsafe)
4. Reading uninitialized memory
5. Creating invalid primitive type values

Avoidance methods:
1. Use Miri for detection
2. Write detailed Safety documentation
3. Use `MaybeUninit` for uninitialized memory
4. Use atomic operations or locks to protect shared state
5. Minimize unsafe code scope

## Further Reading

### Official Resources

- [The Rustonomicon](https://doc.rust-lang.org/nomicon/) - The authoritative guide to Unsafe Rust
- [Rust Reference - Unsafe](https://doc.rust-lang.org/reference/unsafe-keyword.html) - Official reference manual
- [std::ptr Module Documentation](https://doc.rust-lang.org/std/ptr/index.html) - Pointer operation API

### Tools

- [Miri](https://github.com/rust-lang/miri) - Rust undefined behavior detector
- [cargo-careful](https://github.com/RalfJung/cargo-careful) - Extra runtime checks
- [Kani](https://github.com/model-checking/kani) - Formal verification for Rust code

### Advanced Reading

- [Learn Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/) - Learn unsafe by implementing linked lists
- [Rust for Rustaceans](https://nostarch.com/rust-rustaceans) - Jon Gjengset's advanced Rust book

### Related Standard Library Types

- `std::ptr::NonNull<T>` - Non-null pointer wrapper
- `std::mem::MaybeUninit<T>` - Safe handling of uninitialized memory
- `std::cell::UnsafeCell<T>` - Foundation for interior mutability
- `std::marker::PhantomData<T>` - Type system marker
