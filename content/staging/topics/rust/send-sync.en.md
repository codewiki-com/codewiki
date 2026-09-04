---
title: Send 与 Sync
description: 深入理解 Rust 线程安全的基石：Send 与 Sync trait，掌握标记 trait、自动实现机制与 unsafe impl
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - Send
  - Sync
  - 并发
  - 线程安全
  - marker trait
status: imported
origin: old/src/content/docs/rust/send-sync.en.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 并发
  order: 7
  lastUpdated: 2026-01-07
---

In concurrent programming, data races are among the most difficult bugs to debug. Rust prevents data races at compile time through its unique type system, and at the core of this capability are the `Send` and `Sync` marker traits. Understanding them is key to mastering Rust concurrent programming.

## Concept Explanation

### What are Send and Sync

`Send` and `Sync` are two special traits defined in the Rust standard library. They are **marker traits** that contain no methods and are used solely to express certain properties of types to the compiler.

```rust
// Simplified definition from the standard library
pub unsafe auto trait Send {
    // no methods
}

pub unsafe auto trait Sync {
    // no methods
}
```

**Send**: Indicates that ownership of a type can be safely transferred between threads. If type `T` implements `Send`, it means values of type `T` can be safely moved from one thread to another.

**Sync**: Indicates that a type can be safely shared by reference across multiple threads. If type `T` implements `Sync`, it means `&T` (immutable reference) can be safely shared among multiple threads.

### Why Do We Need These Two Traits

In languages without these protection mechanisms, concurrent programming is fraught with pitfalls:

```rust
// If Rust didn't have Send/Sync checks, code like this would be dangerous

// Rc<T> uses non-atomic reference counting
use std::rc::Rc;
use std::thread;

fn dangerous_without_check() {
    let data = Rc::new(vec![1, 2, 3]);
    let data_clone = Rc::clone(&data);

    // If this were allowed:
    // thread::spawn(move || {
    //     // Two threads modifying reference count simultaneously
    //     // leads to incorrect count, potentially causing memory leaks or use-after-free
    //     println!("{:?}", data_clone);
    // });

    // Rust prevents this at compile time!
}
```

`Send` and `Sync` enable the compiler to:
1. Detect potential data races at compile time
2. Force developers to use thread-safe types
3. Provide zero-cost thread safety abstractions

### Historical Background

The design philosophy of these two traits stems from a deep understanding of concurrency safety. During Rust's early design, the team realized that:

- Many types are naturally thread-safe (like `i32`, `String`)
- Certain types' design decisions mean they cannot be used across threads (like `Rc<T>`)
- A mechanism was needed to let the compiler understand these distinctions

Thus, `Send` and `Sync` came into being, becoming the cornerstone of Rust's "fearless concurrency."

## Core Principles

### The Nature of Marker Traits

`Send` and `Sync` are **marker traits**. Their characteristics are:

1. **Contain no methods**: Purely used for type marking
2. **auto trait**: Most types implement them automatically
3. **unsafe trait**: Manual implementation requires unsafe

```rust
// Marker traits add no runtime overhead
// They exist only for compile-time type checking

fn require_send<T: Send>(value: T) {
    // Compiler ensures T can be safely transferred across threads
    // No additional runtime overhead
}

fn require_sync<T: Sync>(value: &T) {
    // Compiler ensures &T can be safely shared
}
```

### Auto Implementation Mechanism

`Send` and `Sync` in Rust are **auto traits**, meaning the compiler automatically implements them for qualifying types:

```rust
// Rule 1: If all fields are Send, the type automatically implements Send
struct AllSend {
    a: i32,      // i32: Send
    b: String,   // String: Send
    c: Vec<u8>,  // Vec<u8>: Send
}
// AllSend automatically implements Send

// Rule 2: If any field is not Send, the type doesn't implement Send
struct NotSend {
    a: i32,
    b: std::rc::Rc<i32>,  // Rc<T> is not Send
}
// NotSend doesn't implement Send

// Rule 3: Sync follows the same rules
struct AllSync {
    a: i32,
    b: String,
}
// AllSync automatically implements Sync

struct NotSync {
    a: std::cell::Cell<i32>,  // Cell<T> is not Sync
}
// NotSync doesn't implement Sync
```

### The Relationship Between Send and Sync

There is an important relationship between these two traits:

```rust
// Core relationship: If T: Sync, then &T: Send
// This is because:
// - Sync means &T can be safely shared among multiple threads
// - Since it can be shared, it can certainly be sent to other threads

// Formal expression:
// T: Sync  <=>  &T: Send
// T: Send  =>   &mut T: Send

use std::sync::Arc;
use std::thread;

fn demonstrate_relationship() {
    // Arc<T> requires T: Send + Sync
    // This is because Arc can be held by multiple threads (needs Sync)
    // and Arc can be transferred between threads (needs Send)

    let data = Arc::new(42);  // i32: Send + Sync

    let data_clone = Arc::clone(&data);
    thread::spawn(move || {
        println!("Value: {}", *data_clone);
    });
}
```

### How the Compiler Uses These Traits

The compiler checks `Send` and `Sync` in multiple places:

```rust
use std::thread;
use std::sync::Arc;
use std::rc::Rc;

fn compiler_checks() {
    // 1. thread::spawn requires the closure to be Send
    // pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    // where
    //     F: FnOnce() -> T + Send + 'static,
    //     T: Send + 'static,

    let send_data = String::from("hello");
    thread::spawn(move || {
        println!("{}", send_data);  // OK: String is Send
    });

    // 2. Arc<T> requires T: Send + Sync
    let arc_data = Arc::new(42);  // OK: i32 is Send + Sync

    // 3. The following code won't compile
    // let rc_data = Rc::new(42);
    // thread::spawn(move || {
    //     println!("{}", rc_data);  // Error! Rc is not Send
    // });
}
```

### Underlying Memory Model

Understanding `Send` and `Sync` requires understanding the underlying memory model:

```rust
use std::cell::UnsafeCell;

// UnsafeCell<T> is the foundation of all interior mutability
// It is neither Send nor Sync (unless T meets specific conditions)

// Cell<T> is based on UnsafeCell
// - Modifies values through copying/moving
// - Not Sync (concurrent access could cause data races)
// - If T: Send, then Cell<T>: Send

// RefCell<T> is based on UnsafeCell
// - Runtime borrow checking
// - Not Sync (borrow state is not thread-safe)
// - If T: Send, then RefCell<T>: Send

// Mutex<T> is based on UnsafeCell
// - Uses OS mutex for protection
// - If T: Send, then Mutex<T>: Send + Sync
// - Because the lock mechanism ensures exclusive access
```

## Key Points

### Core Rules for Send

| Type | Is Send | Reason |
|------|---------|--------|
| `i32`, `f64`, `bool` and other primitive types | Yes | Value types, can be copied |
| `String`, `Vec<T>` (T: Send) | Yes | Owns heap data |
| `Box<T>` (T: Send) | Yes | Heap-allocated single owner |
| `Arc<T>` (T: Send + Sync) | Yes | Atomic reference counting |
| `Mutex<T>` (T: Send) | Yes | Lock-protected data |
| `Rc<T>` | No | Non-atomic reference counting |
| `*const T`, `*mut T` | No | Raw pointers |
| `MutexGuard<T>` | No | Must be released in the same thread |

### Core Rules for Sync

| Type | Is Sync | Reason |
|------|---------|--------|
| `i32`, `f64`, `bool` and other primitive types | Yes | Immutable reads are naturally safe |
| `&T` (T: Sync) | Yes | Immutable references can be shared |
| `Arc<T>` (T: Send + Sync) | Yes | Atomic operations + immutable access |
| `Mutex<T>` (T: Send) | Yes | Lock protection |
| `RwLock<T>` (T: Send + Sync) | Yes | Read-write lock protection |
| `Cell<T>`, `RefCell<T>` | No | Interior mutability is not thread-safe |
| `Rc<T>` | No | Non-atomic reference counting |
| `UnsafeCell<T>` | No | Foundation type for interior mutability |

### Memory Aids

```rust
// Send: Can be sent
// - "I can send data to you"
// - Data moves from one thread to another

// Sync: Can be synchronized
// - "We can look together"
// - Multiple threads can read the same reference simultaneously

// Quick judgment:
// 1. Involves non-atomic reference counting -> Not Send/Sync (e.g., Rc)
// 2. Involves interior mutability without locks -> Not Sync (e.g., Cell, RefCell)
// 3. Involves resources that must be released locally -> Not Send (e.g., MutexGuard)
// 4. Raw pointers -> Neither Send nor Sync
```

### Rules for Composite Types

```rust
// Composite types follow the "weakest link" principle:
// - If any field is not Send, the entire type is not Send
// - If any field is not Sync, the entire type is not Sync

struct Mixed {
    safe: i32,           // Send + Sync
    also_safe: String,   // Send + Sync
    not_sync: std::cell::Cell<i32>,  // Send, but not Sync
}
// Mixed: Send, but not Sync

struct Problematic {
    safe: i32,
    not_send: std::rc::Rc<i32>,  // Neither Send nor Sync
}
// Problematic: Neither Send nor Sync
```

## Code Examples

### Basic Usage Examples

```rust
use std::thread;
use std::sync::Arc;

fn basic_send_example() {
    // String implements Send, can be moved to another thread
    let message = String::from("Hello from main thread!");

    let handle = thread::spawn(move || {
        // Ownership of message is transferred to this thread
        println!("Received: {}", message);

        // Can return data because String is also Send
        message.to_uppercase()
    });

    // Get return value from child thread
    let result = handle.join().unwrap();
    println!("Modified: {}", result);
}

fn basic_sync_example() {
    // Arc<T> allows multiple threads to share immutable references
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data_ref = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // Multiple threads can read data simultaneously
            let sum: i32 = data_ref.iter().sum();
            println!("Thread {} calculated sum: {}", i, sum);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}

fn main() {
    basic_send_example();
    println!("---");
    basic_sync_example();
}
```

### Compilation Error Examples

```rust
use std::rc::Rc;
use std::cell::RefCell;
use std::thread;

fn demonstrate_send_error() {
    let rc_data = Rc::new(42);

    // Compilation error! Rc<i32> is not Send
    // thread::spawn(move || {
    //     println!("{}", rc_data);
    // });
    // Error message:
    // `Rc<i32>` cannot be sent between threads safely
    // the trait `Send` is not implemented for `Rc<i32>`
}

fn demonstrate_sync_error() {
    let cell = RefCell::new(42);

    // Even if we only want to read, RefCell is not Sync
    // let cell_ref = &cell;
    // thread::spawn(move || {
    //     println!("{}", cell_ref.borrow());
    // });
    // Error message:
    // `RefCell<i32>` cannot be shared between threads safely
    // the trait `Sync` is not implemented for `RefCell<i32>`
}
```

### Correct Thread-Safe Alternatives

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicI32, Ordering};
use std::thread;

fn use_arc_mutex() {
    // Rc -> Arc
    // RefCell -> Mutex
    let data = Arc::new(Mutex::new(42));
    let mut handles = vec![];

    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut guard = data.lock().unwrap();
            *guard += 1;
            println!("Thread {} incremented to {}", i, *guard);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final value: {}", *data.lock().unwrap());
}

fn use_rwlock() {
    // Use RwLock for read-heavy scenarios
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // Multiple readers
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let read_guard = data.read().unwrap();
            println!("Reader {}: {:?}", i, *read_guard);
        }));
    }

    // One writer
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut write_guard = data.write().unwrap();
            write_guard.push(4);
            println!("Writer added element");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}

fn use_atomic() {
    // Use atomic types for simple counters
    let counter = Arc::new(AtomicI32::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::SeqCst);
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Counter: {}", counter.load(Ordering::SeqCst));
}

fn main() {
    println!("=== Arc + Mutex ===");
    use_arc_mutex();

    println!("\n=== RwLock ===");
    use_rwlock();

    println!("\n=== Atomic ===");
    use_atomic();
}
```

### Thread Safety for Custom Types

```rust
use std::sync::Arc;
use std::thread;

// All fields are Send + Sync, automatically implements Send + Sync
#[derive(Debug, Clone)]
struct ThreadSafeConfig {
    name: String,
    max_connections: u32,
    timeout_ms: u64,
}

// Usage example
fn custom_type_example() {
    let config = Arc::new(ThreadSafeConfig {
        name: String::from("MyApp"),
        max_connections: 100,
        timeout_ms: 5000,
    });

    let mut handles = vec![];

    for i in 0..3 {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            println!(
                "Thread {}: Config = {} with {} connections",
                i, config.name, config.max_connections
            );
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}

fn main() {
    custom_type_example();
}
```

### unsafe impl Send and Sync

```rust
use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicBool, Ordering};

/// A simple spinlock implementation
///
/// Thread safety is ensured through the lock mechanism, so we can manually implement Send and Sync
pub struct SpinLock<T> {
    locked: AtomicBool,
    data: UnsafeCell<T>,
}

// Safety: As long as T is Send, SpinLock<T> can be transferred between threads
// Because the data is protected by the lock, only one thread can access it at a time
unsafe impl<T: Send> Send for SpinLock<T> {}

// Safety: As long as T is Send, &SpinLock<T> can be shared among multiple threads
// Because acquiring data requires first acquiring the lock, ensuring exclusive access
unsafe impl<T: Send> Sync for SpinLock<T> {}

impl<T> SpinLock<T> {
    pub fn new(data: T) -> Self {
        SpinLock {
            locked: AtomicBool::new(false),
            data: UnsafeCell::new(data),
        }
    }

    pub fn lock(&self) -> SpinLockGuard<'_, T> {
        // Spin waiting to acquire the lock
        while self
            .locked
            .compare_exchange_weak(false, true, Ordering::Acquire, Ordering::Relaxed)
            .is_err()
        {
            // Give the CPU a hint that we're spin-waiting
            std::hint::spin_loop();
        }

        SpinLockGuard { lock: self }
    }
}

pub struct SpinLockGuard<'a, T> {
    lock: &'a SpinLock<T>,
}

impl<T> std::ops::Deref for SpinLockGuard<'_, T> {
    type Target = T;

    fn deref(&self) -> &T {
        // Safety: We hold the lock, we have exclusive access
        unsafe { &*self.lock.data.get() }
    }
}

impl<T> std::ops::DerefMut for SpinLockGuard<'_, T> {
    fn deref_mut(&mut self) -> &mut T {
        // Safety: We hold the lock, we have exclusive access
        unsafe { &mut *self.lock.data.get() }
    }
}

impl<T> Drop for SpinLockGuard<'_, T> {
    fn drop(&mut self) {
        self.lock.locked.store(false, Ordering::Release);
    }
}

// Usage example
fn spinlock_example() {
    use std::sync::Arc;
    use std::thread;

    let counter = Arc::new(SpinLock::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                let mut guard = counter.lock();
                *guard += 1;
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock());
}

fn main() {
    spinlock_example();
}
```

### Negative Implementation

```rust
use std::marker::PhantomData;
use std::cell::UnsafeCell;

/// A type that is explicitly not Send
///
/// Uses PhantomData to "carry" a type that is not Send
struct NotSendType {
    _marker: PhantomData<*const ()>,  // *const () is not Send
}

impl NotSendType {
    fn new() -> Self {
        NotSendType {
            _marker: PhantomData,
        }
    }
}

/// Another approach: use !Send syntax (requires nightly)
/// In stable Rust, we achieve this by including a non-Send field
struct ExplicitlyNotSend {
    _not_send: PhantomData<*mut ()>,
}

/// Prevent both Send and Sync
struct NotSendOrSync {
    _marker: PhantomData<UnsafeCell<()>>,  // UnsafeCell is not Sync
}

fn demonstrate() {
    use std::thread;

    let not_send = NotSendType::new();

    // Compilation error: NotSendType is not Send
    // thread::spawn(move || {
    //     let _ = not_send;
    // });

    // Using it in the current thread is perfectly fine
    println!("NotSendType created successfully");
}

fn main() {
    demonstrate();
}
```

### Utility Functions

```rust
use std::fmt::Debug;

/// Static assertion that a type is Send
fn assert_send<T: Send>() {}

/// Static assertion that a type is Sync
fn assert_sync<T: Sync>() {}

/// Static assertion that a type is Send + Sync
fn assert_send_sync<T: Send + Sync>() {}

/// Check several common types
fn check_types() {
    // Primitive types
    assert_send::<i32>();
    assert_sync::<i32>();
    assert_send_sync::<i32>();

    // String and Vec
    assert_send::<String>();
    assert_sync::<String>();
    assert_send::<Vec<i32>>();
    assert_sync::<Vec<i32>>();

    // Smart pointers
    assert_send::<Box<i32>>();
    assert_sync::<Box<i32>>();

    use std::sync::{Arc, Mutex, RwLock};
    assert_send::<Arc<i32>>();
    assert_sync::<Arc<i32>>();
    assert_send::<Mutex<i32>>();
    assert_sync::<Mutex<i32>>();
    assert_send::<RwLock<i32>>();
    assert_sync::<RwLock<i32>>();

    // The following types don't satisfy the conditions, uncommenting will cause compilation errors
    // use std::rc::Rc;
    // assert_send::<Rc<i32>>();  // Error!

    // use std::cell::RefCell;
    // assert_sync::<RefCell<i32>>();  // Error!

    println!("All type checks passed!");
}

/// Print whether a type implements Send/Sync at runtime
fn print_type_info<T>(_name: &str) {
    // Note: This is just a conceptual demonstration
    // In reality, Rust doesn't have runtime reflection to check trait implementations
    // Compile-time checking is the only reliable way
}

fn main() {
    check_types();
}
```

## Best Practices

### Prefer Thread-Safe Types from the Standard Library

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicUsize, Ordering};

// Good: Use thread-safe types provided by the standard library
fn good_practice() {
    // Need shared ownership -> Arc
    let shared = Arc::new(42);

    // Need mutable sharing -> Arc<Mutex<T>>
    let mutable_shared = Arc::new(Mutex::new(vec![1, 2, 3]));

    // Read-heavy scenarios -> Arc<RwLock<T>>
    let read_heavy = Arc::new(RwLock::new(HashMap::new()));

    // Simple counters -> Arc<AtomicUsize>
    let counter = Arc::new(AtomicUsize::new(0));
}

use std::collections::HashMap;

// Bad: Trying to manage thread safety manually
// fn bad_practice() {
//     // Using Rc then manually synchronizing -> error-prone
//     // Using unsafe to bypass checks -> dangerous
// }
```

### Understand the Send/Sync Status of Types

```rust
/// Consider thread safety when designing types
///
/// All fields in this type are Send + Sync
/// so it automatically implements Send + Sync
#[derive(Debug)]
pub struct ThreadSafeCache<K, V>
where
    K: std::hash::Hash + Eq + Send + Sync,
    V: Send + Sync,
{
    data: std::sync::RwLock<std::collections::HashMap<K, V>>,
    hits: std::sync::atomic::AtomicUsize,
    misses: std::sync::atomic::AtomicUsize,
}

impl<K, V> ThreadSafeCache<K, V>
where
    K: std::hash::Hash + Eq + Send + Sync,
    V: Clone + Send + Sync,
{
    pub fn new() -> Self {
        ThreadSafeCache {
            data: std::sync::RwLock::new(std::collections::HashMap::new()),
            hits: std::sync::atomic::AtomicUsize::new(0),
            misses: std::sync::atomic::AtomicUsize::new(0),
        }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let guard = self.data.read().unwrap();
        match guard.get(key) {
            Some(v) => {
                self.hits.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                Some(v.clone())
            }
            None => {
                self.misses.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                None
            }
        }
    }

    pub fn insert(&self, key: K, value: V) {
        let mut guard = self.data.write().unwrap();
        guard.insert(key, value);
    }
}
```

### Avoid Unnecessary unsafe impl

```rust
// Bad: Using unsafe impl without sufficient reason
// unsafe impl Send for MyType {}  // Why is this needed?
// unsafe impl Sync for MyType {}  // Can you guarantee safety?

// Good: Only use when you have sufficient reason and can guarantee safety
use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicBool, Ordering};

/// Document why this unsafe impl is safe
///
/// # Safety
///
/// This type guarantees the following invariants through atomic operations:
/// 1. Only one thread can get mutable access at a time
/// 2. Data modifications always happen under lock protection
pub struct SafeWrapper<T> {
    locked: AtomicBool,
    data: UnsafeCell<T>,
}

// Safety: T: Send guarantees data can be transferred across threads
// The lock mechanism guarantees no concurrent access
unsafe impl<T: Send> Send for SafeWrapper<T> {}

// Safety: Shared references can only get mutable access through lock()
// The lock guarantees exclusive access
unsafe impl<T: Send> Sync for SafeWrapper<T> {}
```

### Use the Type System to Express Intent

```rust
use std::marker::PhantomData;

/// Indicates that this handle can only be used in the thread that created it
pub struct ThreadLocalHandle<T> {
    inner: T,
    // Use PhantomData carrying *const () to prevent Send
    _not_send: PhantomData<*const ()>,
}

impl<T> ThreadLocalHandle<T> {
    pub fn new(value: T) -> Self {
        ThreadLocalHandle {
            inner: value,
            _not_send: PhantomData,
        }
    }

    pub fn get(&self) -> &T {
        &self.inner
    }

    pub fn get_mut(&mut self) -> &mut T {
        &mut self.inner
    }
}

// Compiler automatically prevents cross-thread transfer
fn test_thread_local() {
    let handle = ThreadLocalHandle::new(42);

    // Compilation error: ThreadLocalHandle is not Send
    // std::thread::spawn(move || {
    //     println!("{}", handle.get());
    // });

    // Using it in the current thread is fine
    println!("Value: {}", handle.get());
}
```

### Document Thread Safety Guarantees

```rust
/// A thread-safe counter
///
/// # Thread Safety
///
/// This type implements `Send` and `Sync`, and can safely:
/// - Be transferred between threads (`Send`)
/// - Share references from multiple threads (`Sync`)
///
/// # Example
///
/// ```
/// use std::sync::Arc;
/// use std::thread;
///
/// let counter = Arc::new(SafeCounter::new());
///
/// let handles: Vec<_> = (0..4).map(|_| {
///     let counter = Arc::clone(&counter);
///     thread::spawn(move || {
///         counter.increment();
///     })
/// }).collect();
///
/// for h in handles {
///     h.join().unwrap();
/// }
///
/// assert_eq!(counter.get(), 4);
/// ```
pub struct SafeCounter {
    value: std::sync::atomic::AtomicUsize,
}

impl SafeCounter {
    pub fn new() -> Self {
        SafeCounter {
            value: std::sync::atomic::AtomicUsize::new(0),
        }
    }

    pub fn increment(&self) {
        self.value.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    }

    pub fn get(&self) -> usize {
        self.value.load(std::sync::atomic::Ordering::SeqCst)
    }
}
```

## Common Pitfalls

### Misunderstanding the Meaning of Send and Sync

```rust
use std::sync::{Arc, Mutex};

// Pitfall: Thinking Send means "can be accessed from multiple threads"
// Reality: Send only means "can be moved to another thread"

fn misunderstanding_send() {
    let data = String::from("hello");

    // Move to thread 1
    std::thread::spawn(move || {
        // data now belongs to this thread
        println!("{}", data);
        // Ownership is here, other threads cannot access it
    });

    // data has been moved, main thread can no longer access it
}

// Pitfall: Thinking Sync means "can be modified"
// Reality: Sync only means "immutable references can be shared"

fn misunderstanding_sync() {
    let data = Arc::new(42);  // Immutable Arc

    let handles: Vec<_> = (0..3)
        .map(|i| {
            let data = Arc::clone(&data);
            std::thread::spawn(move || {
                // Can only read, cannot modify
                println!("Thread {}: {}", i, *data);
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    // If modification is needed, Mutex or other synchronization primitives are required
    let mutable_data = Arc::new(Mutex::new(42));
}
```

### Forgetting That T in Arc<Mutex<T>> Also Needs to Be Send

```rust
use std::sync::{Arc, Mutex};
use std::rc::Rc;

// Pitfall: Trying to put a non-Send type in a Mutex
fn wrong_mutex_usage() {
    // Compilation error! Rc is not Send
    // let data = Arc::new(Mutex::new(Rc::new(42)));

    // Correct: Use Arc instead of Rc
    let data = Arc::new(Mutex::new(Arc::new(42)));
}

// Remember Mutex<T>'s thread safety constraints:
// - Mutex<T>: Send if and only if T: Send
// - Mutex<T>: Sync if and only if T: Send
// Note: Mutex<T>: Sync doesn't require T: Sync
```

### MutexGuard Cannot Be Held Across await Points

```rust
use std::sync::Mutex;

// Pitfall in async code
async fn async_mistake() {
    let data = Mutex::new(42);

    // Pitfall: Holding a lock across an await point
    // let guard = data.lock().unwrap();
    // some_async_operation().await;  // MutexGuard spans the await
    // *guard += 1;  // Compilation error!

    // Correct approach 1: Release the lock before await
    {
        let mut guard = data.lock().unwrap();
        *guard += 1;
    }  // Lock is released here
    some_async_operation().await;

    // Correct approach 2: Use tokio::sync::Mutex
    // let data = tokio::sync::Mutex::new(42);
    // let mut guard = data.lock().await;
    // some_async_operation().await;
    // *guard += 1;  // OK!
}

async fn some_async_operation() {
    // Simulate async operation
}
```

### Unnecessary unsafe impl

```rust
// Pitfall: Blindly adding unsafe impl to make code compile

struct MyWrapper {
    data: std::cell::RefCell<i32>,
}

// Dangerous! RefCell's borrow checking is not thread-safe
// unsafe impl Sync for MyWrapper {}  // This will cause data races!

// Correct approach: Use thread-safe alternatives
struct SafeWrapper {
    data: std::sync::Mutex<i32>,
}
// Automatically implements Sync, no manual impl needed
```

### Confusing Ownership Transfer and Sharing

```rust
use std::sync::Arc;
use std::thread;

fn ownership_confusion() {
    let data = vec![1, 2, 3];

    // Pitfall: Trying to move the same value multiple times
    // thread::spawn(move || { println!("{:?}", data); });
    // thread::spawn(move || { println!("{:?}", data); });  // Error: data already moved

    // Correct: Use Arc to share ownership
    let shared = Arc::new(vec![1, 2, 3]);
    let shared1 = Arc::clone(&shared);
    let shared2 = Arc::clone(&shared);

    thread::spawn(move || { println!("{:?}", shared1); });
    thread::spawn(move || { println!("{:?}", shared2); });
}

fn main() {
    ownership_confusion();
    std::thread::sleep(std::time::Duration::from_millis(100));
}
```

### Ignoring Memory Ordering in Atomic Operations

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;

static READY: AtomicBool = AtomicBool::new(false);
static DATA: AtomicUsize = AtomicUsize::new(0);

// Pitfall: Using Relaxed ordering for synchronization
fn wrong_ordering() {
    // Producer
    thread::spawn(|| {
        DATA.store(42, Ordering::Relaxed);  // Dangerous!
        READY.store(true, Ordering::Relaxed);  // Might be reordered before DATA
    });

    // Consumer
    thread::spawn(|| {
        // Even if READY = true is seen, DATA might not be updated yet
        while !READY.load(Ordering::Relaxed) {}
        let value = DATA.load(Ordering::Relaxed);
        // value might be 0 instead of 42!
    });
}

// Correct: Use appropriate memory ordering
fn correct_ordering() {
    thread::spawn(|| {
        DATA.store(42, Ordering::Relaxed);
        READY.store(true, Ordering::Release);  // Release ensures previous writes are visible
    });

    thread::spawn(|| {
        while !READY.load(Ordering::Acquire) {}  // Acquire pairs with Release
        let value = DATA.load(Ordering::Relaxed);
        // Guaranteed value == 42
    });
}
```

## Performance Considerations

### Send/Sync is a Zero-Cost Abstraction

```rust
use std::mem::size_of;

struct WithMarker {
    data: i32,
}

struct WithoutMarker {
    data: i32,
}

fn demonstrate_zero_cost() {
    // Send and Sync are compile-time checks, no runtime overhead
    assert_eq!(size_of::<WithMarker>(), size_of::<WithoutMarker>());
    assert_eq!(size_of::<WithMarker>(), size_of::<i32>());

    println!("Size of WithMarker: {} bytes", size_of::<WithMarker>());
    println!("Size of i32: {} bytes", size_of::<i32>());
}

fn main() {
    demonstrate_zero_cost();
}
```

### Choosing the Right Synchronization Primitive

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

fn benchmark_primitives() {
    const ITERATIONS: usize = 1_000_000;
    const THREADS: usize = 4;

    // Atomic - Fastest, suitable for simple counters
    let start = Instant::now();
    let counter = Arc::new(AtomicUsize::new(0));
    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let counter = Arc::clone(&counter);
            std::thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    counter.fetch_add(1, Ordering::Relaxed);
                }
            })
        })
        .collect();
    for h in handles { h.join().unwrap(); }
    println!("Atomic: {:?}", start.elapsed());

    // Mutex - Medium speed, suitable for complex operations
    let start = Instant::now();
    let counter = Arc::new(Mutex::new(0usize));
    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let counter = Arc::clone(&counter);
            std::thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    let mut guard = counter.lock().unwrap();
                    *guard += 1;
                }
            })
        })
        .collect();
    for h in handles { h.join().unwrap(); }
    println!("Mutex: {:?}", start.elapsed());

    // RwLock - Optimal for read-heavy scenarios
    let start = Instant::now();
    let data = Arc::new(RwLock::new(0usize));
    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let data = Arc::clone(&data);
            std::thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    // Simulate read-heavy workload
                    for _ in 0..10 {
                        let _ = data.read().unwrap();
                    }
                    let mut guard = data.write().unwrap();
                    *guard += 1;
                }
            })
        })
        .collect();
    for h in handles { h.join().unwrap(); }
    println!("RwLock (read-heavy): {:?}", start.elapsed());
}

fn main() {
    benchmark_primitives();
}
```

### parking_lot as a High-Performance Alternative

```rust
// Add to Cargo.toml: parking_lot = "0.12"

/*
use parking_lot::{Mutex, RwLock};
use std::sync::Arc;

fn use_parking_lot() {
    // Advantages of parking_lot:
    // 1. Doesn't return Result, no panic poisoning
    // 2. Smaller memory footprint
    // 3. Better performance in some scenarios

    let data = Arc::new(Mutex::new(0));
    let guard = data.lock();  // Returns MutexGuard directly, no unwrap needed

    // Performance comparison (for reference):
    // - Uncontended: parking_lot slightly faster
    // - High contention: Similar performance
    // - Memory usage: parking_lot is smaller
}
*/
```

### Reducing Lock Contention

```rust
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

/// Sharded lock: A common technique to reduce contention
struct ShardedMap<K, V> {
    shards: Vec<Mutex<HashMap<K, V>>>,
}

impl<K: Hash + Eq, V> ShardedMap<K, V> {
    fn new(num_shards: usize) -> Self {
        let mut shards = Vec::with_capacity(num_shards);
        for _ in 0..num_shards {
            shards.push(Mutex::new(HashMap::new()));
        }
        ShardedMap { shards }
    }

    fn shard_index(&self, key: &K) -> usize {
        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        (hasher.finish() as usize) % self.shards.len()
    }

    fn insert(&self, key: K, value: V) -> Option<V> {
        let idx = self.shard_index(&key);
        let mut shard = self.shards[idx].lock().unwrap();
        shard.insert(key, value)
    }

    fn get(&self, key: &K) -> Option<V>
    where
        V: Clone,
    {
        let idx = self.shard_index(key);
        let shard = self.shards[idx].lock().unwrap();
        shard.get(key).cloned()
    }
}

fn demonstrate_sharded_map() {
    let map = Arc::new(ShardedMap::<String, i32>::new(16));
    let mut handles = vec![];

    for i in 0..4 {
        let map = Arc::clone(&map);
        handles.push(std::thread::spawn(move || {
            for j in 0..1000 {
                let key = format!("key_{}_{}", i, j);
                map.insert(key, i * 1000 + j);
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("Inserted items successfully");
}

fn main() {
    demonstrate_sharded_map();
}
```

## Real-World Scenarios

### Scenario 1: Concurrent Web Crawler

```rust
use std::sync::{Arc, Mutex};
use std::collections::HashSet;
use std::thread;

/// Thread-safe URL queue
struct UrlQueue {
    pending: Mutex<Vec<String>>,
    visited: Mutex<HashSet<String>>,
}

impl UrlQueue {
    fn new() -> Self {
        UrlQueue {
            pending: Mutex::new(Vec::new()),
            visited: Mutex::new(HashSet::new()),
        }
    }

    fn add(&self, url: String) -> bool {
        let mut visited = self.visited.lock().unwrap();
        if visited.contains(&url) {
            return false;
        }
        visited.insert(url.clone());
        drop(visited);  // Release lock early

        self.pending.lock().unwrap().push(url);
        true
    }

    fn pop(&self) -> Option<String> {
        self.pending.lock().unwrap().pop()
    }
}

/// Thread-safe crawl results
struct CrawlResults {
    data: Mutex<Vec<(String, String)>>,  // (url, content)
}

impl CrawlResults {
    fn new() -> Self {
        CrawlResults {
            data: Mutex::new(Vec::new()),
        }
    }

    fn add(&self, url: String, content: String) {
        self.data.lock().unwrap().push((url, content));
    }

    fn get_all(&self) -> Vec<(String, String)> {
        self.data.lock().unwrap().clone()
    }
}

fn crawl_simulation() {
    let queue = Arc::new(UrlQueue::new());
    let results = Arc::new(CrawlResults::new());

    // Add initial URLs
    for i in 0..20 {
        queue.add(format!("https://example.com/page{}", i));
    }

    let mut handles = vec![];

    // Create worker threads
    for worker_id in 0..4 {
        let queue = Arc::clone(&queue);
        let results = Arc::clone(&results);

        handles.push(thread::spawn(move || {
            while let Some(url) = queue.pop() {
                // Simulate network request
                thread::sleep(std::time::Duration::from_millis(10));

                let content = format!("Content of {}", url);
                println!("Worker {}: Crawled {}", worker_id, url);

                results.add(url, content);
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("\n=== Results ===");
    println!("Total pages crawled: {}", results.get_all().len());
}

fn main() {
    crawl_simulation();
}
```

### Scenario 2: Thread-Safe Configuration Management

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::thread;

/// Thread-safe configuration manager
///
/// Uses RwLock because reads are far more frequent than writes
#[derive(Clone)]
pub struct ConfigManager {
    config: Arc<RwLock<HashMap<String, String>>>,
}

impl ConfigManager {
    pub fn new() -> Self {
        ConfigManager {
            config: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn get(&self, key: &str) -> Option<String> {
        let guard = self.config.read().unwrap();
        guard.get(key).cloned()
    }

    pub fn set(&self, key: String, value: String) {
        let mut guard = self.config.write().unwrap();
        guard.insert(key, value);
    }

    pub fn get_or_default(&self, key: &str, default: &str) -> String {
        self.get(key).unwrap_or_else(|| default.to_string())
    }

    pub fn reload(&self, new_config: HashMap<String, String>) {
        let mut guard = self.config.write().unwrap();
        *guard = new_config;
    }
}

fn config_example() {
    let config = ConfigManager::new();

    // Initialize configuration
    config.set("database.host".to_string(), "localhost".to_string());
    config.set("database.port".to_string(), "5432".to_string());
    config.set("cache.enabled".to_string(), "true".to_string());

    let mut handles = vec![];

    // Multiple reader threads
    for i in 0..5 {
        let config = config.clone();
        handles.push(thread::spawn(move || {
            for _ in 0..100 {
                let host = config.get_or_default("database.host", "unknown");
                let port = config.get_or_default("database.port", "0");
                println!("Reader {}: {}:{}", i, host, port);
                thread::sleep(std::time::Duration::from_millis(1));
            }
        }));
    }

    // One writer thread
    {
        let config = config.clone();
        handles.push(thread::spawn(move || {
            thread::sleep(std::time::Duration::from_millis(50));
            config.set("database.host".to_string(), "db.example.com".to_string());
            println!("Writer: Updated database.host");
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
}

fn main() {
    config_example();
}
```

### Scenario 3: Producer-Consumer Pattern

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::collections::VecDeque;
use std::thread;

/// Thread-safe bounded queue
pub struct BoundedQueue<T> {
    queue: Mutex<VecDeque<T>>,
    not_empty: Condvar,
    not_full: Condvar,
    capacity: usize,
}

impl<T> BoundedQueue<T> {
    pub fn new(capacity: usize) -> Self {
        BoundedQueue {
            queue: Mutex::new(VecDeque::with_capacity(capacity)),
            not_empty: Condvar::new(),
            not_full: Condvar::new(),
            capacity,
        }
    }

    pub fn push(&self, item: T) {
        let mut queue = self.queue.lock().unwrap();

        // Wait for space in the queue
        while queue.len() >= self.capacity {
            queue = self.not_full.wait(queue).unwrap();
        }

        queue.push_back(item);
        self.not_empty.notify_one();
    }

    pub fn pop(&self) -> T {
        let mut queue = self.queue.lock().unwrap();

        // Wait for queue to be non-empty
        while queue.is_empty() {
            queue = self.not_empty.wait(queue).unwrap();
        }

        let item = queue.pop_front().unwrap();
        self.not_full.notify_one();
        item
    }

    pub fn try_pop(&self) -> Option<T> {
        let mut queue = self.queue.lock().unwrap();
        let item = queue.pop_front();
        if item.is_some() {
            self.not_full.notify_one();
        }
        item
    }
}

fn producer_consumer_example() {
    let queue = Arc::new(BoundedQueue::new(10));
    let mut handles = vec![];

    // Producers
    for producer_id in 0..2 {
        let queue = Arc::clone(&queue);
        handles.push(thread::spawn(move || {
            for i in 0..20 {
                let item = format!("P{}-Item{}", producer_id, i);
                println!("Producer {}: Pushing {}", producer_id, item);
                queue.push(item);
                thread::sleep(std::time::Duration::from_millis(10));
            }
        }));
    }

    // Consumers
    for consumer_id in 0..3 {
        let queue = Arc::clone(&queue);
        handles.push(thread::spawn(move || {
            for _ in 0..13 {
                let item = queue.pop();
                println!("Consumer {}: Got {}", consumer_id, item);
                thread::sleep(std::time::Duration::from_millis(20));
            }
        }));
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("All done!");
}

fn main() {
    producer_consumer_example();
}
```

### Scenario 4: Concurrent Data Processing Pipeline

```rust
use std::sync::{Arc, Mutex};
use std::sync::mpsc::{channel, Sender, Receiver};
use std::thread;

/// Data processing stage
trait Stage: Send + Sync {
    type Input: Send;
    type Output: Send;

    fn process(&self, input: Self::Input) -> Self::Output;
}

/// Simple data pipeline
struct Pipeline<I, O> {
    stages: Vec<Box<dyn Fn(I) -> O + Send + Sync>>,
    num_workers: usize,
}

// Simplified version: Using closures directly
fn pipeline_example() {
    let (tx, rx) = channel::<i32>();
    let (tx2, rx2) = channel::<i32>();
    let (tx3, rx3) = channel::<String>();

    let rx = Arc::new(Mutex::new(rx));
    let rx2 = Arc::new(Mutex::new(rx2));

    // Stage 1: Multiply by 2
    let rx1 = Arc::clone(&rx);
    let handle1 = thread::spawn(move || {
        loop {
            let item = {
                let rx = rx1.lock().unwrap();
                match rx.recv() {
                    Ok(i) => i,
                    Err(_) => break,
                }
            };
            let result = item * 2;
            println!("Stage 1: {} -> {}", item, result);
            if tx2.send(result).is_err() {
                break;
            }
        }
    });

    // Stage 2: Convert to string
    let rx2_clone = Arc::clone(&rx2);
    let handle2 = thread::spawn(move || {
        loop {
            let item = {
                let rx = rx2_clone.lock().unwrap();
                match rx.recv() {
                    Ok(i) => i,
                    Err(_) => break,
                }
            };
            let result = format!("Value: {}", item);
            println!("Stage 2: {} -> {}", item, result);
            if tx3.send(result).is_err() {
                break;
            }
        }
    });

    // Send data
    for i in 1..=5 {
        tx.send(i).unwrap();
    }
    drop(tx);

    // Collect results
    let results: Vec<String> = rx3.iter().collect();

    handle1.join().unwrap();
    handle2.join().unwrap();

    println!("\n=== Final Results ===");
    for r in results {
        println!("{}", r);
    }
}

fn main() {
    pipeline_example();
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the Send and Sync traits? What's the difference between them?**

```text
A: Send and Sync are two marker traits in Rust:

Send:
- Indicates that ownership of a type can be safely transferred between threads
- If T: Send, values of T can be moved from one thread to another
- Examples: String, Vec<T>, Box<T> are all Send

Sync:
- Indicates that a type can be safely shared by reference across multiple threads
- If T: Sync, &T can be safely shared among multiple threads
- Equivalent to saying: &T is Send
- Examples: i32, &str, Arc<T> are all Sync

Key difference:
- Send concerns ownership transfer (move)
- Sync concerns shared references (borrow)
```

**Q2: Why is Rc not Send while Arc is Send?**

```text
A: The core difference lies in the reference counting implementation:

Rc (Reference Counted):
- Uses non-atomic operations to update reference count
- Multiple threads modifying the count simultaneously causes data races
- Could lead to: memory leaks (count too high) or use-after-free (count too low)
- Therefore Rc is neither Send nor Sync

Arc (Atomic Reference Counted):
- Uses atomic operations to update reference count
- Atomic operations guarantee thread-safe count updates
- Arc<T> is Send + Sync (when T: Send + Sync)
- The cost is that atomic operations are slower than regular operations

Selection advice:
- Single-threaded: Use Rc (better performance)
- Multi-threaded: Use Arc
```

**Q3: How do you make a custom type implement Send and Sync?**

```text
A: Two approaches:

1. Automatic implementation (recommended):
   - Ensure all fields are Send/Sync
   - The compiler will automatically implement Send/Sync for the type

2. Manual implementation (requires unsafe):
   unsafe impl Send for MyType {}
   unsafe impl Sync for MyType {}

   - Only do this when you can guarantee the type is thread-safe
   - Requires careful analysis and documentation of safety guarantees

Common scenarios:
- Using raw pointers but guaranteeing safety
- Using UnsafeCell but protecting access with locks
- Wrapping non-Rust code that is thread-safe
```

**Q4: Why aren't Cell and RefCell Sync?**

```text
A: Because their interior mutability is not thread-safe:

Cell<T>:
- Modifies values through copying/moving
- Has no synchronization mechanism
- Concurrent reads and writes cause data races

RefCell<T>:
- Uses runtime borrow checking
- Borrow state is stored in non-atomic variables
- Concurrent operations break borrow state consistency

Thread-safe alternatives:
- Cell<T> -> Atomic* types
- RefCell<T> -> Mutex<T> or RwLock<T>
```

**Q5: When do you need to manually implement Send/Sync?**

```text
A: The following situations may require it:

1. Wrapping FFI types:
   - Pointers returned from C libraries that you know are thread-safe

2. Custom synchronization primitives:
   - Implementing your own locks or lock-free data structures

3. Types using UnsafeCell:
   - You guarantee thread safety through other means

Safety guidelines:
- Must use unsafe impl
- Must write detailed Safety documentation
- Must ensure the type is actually thread-safe
- Test thoroughly, use Miri to detect issues
```

**Q6: Why does thread::spawn require F: Send + 'static?**

```text
A: Reasons for both requirements:

Send:
- The closure is moved to a new thread for execution
- All values captured by the closure must be safely transferable across threads
- Compilation fails if a non-Send type is captured

'static:
- The new thread may outlive the scope that created it
- The closure cannot reference data that might be deallocated
- Guarantees data inside the closure is valid for the entire thread lifetime

Solutions:
- Use move closures to take ownership
- Use Arc to share data
- Use scoped threads (thread::scope) to borrow stack data
```

### Code Challenges

```rust
// Challenge: Fix the following code to compile and run correctly

use std::thread;

fn challenge_1() {
    // Problem: Rc is not Send
    // let data = std::rc::Rc::new(42);
    // let data_clone = data.clone();
    // thread::spawn(move || {
    //     println!("{}", data_clone);
    // });

    // Solution: Use Arc
    let data = std::sync::Arc::new(42);
    let data_clone = data.clone();
    thread::spawn(move || {
        println!("{}", data_clone);
    });
}

fn challenge_2() {
    // Problem: RefCell is not Sync
    // let data = std::sync::Arc::new(std::cell::RefCell::new(42));
    // let data_clone = data.clone();
    // thread::spawn(move || {
    //     *data_clone.borrow_mut() += 1;
    // });

    // Solution: Use Mutex
    let data = std::sync::Arc::new(std::sync::Mutex::new(42));
    let data_clone = data.clone();
    thread::spawn(move || {
        *data_clone.lock().unwrap() += 1;
    });
}

fn main() {
    challenge_1();
    challenge_2();
    thread::sleep(std::time::Duration::from_millis(100));
}
```

## Further Reading

### Official Resources

- [The Rust Programming Language - Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html)
- [The Rustonomicon - Send and Sync](https://doc.rust-lang.org/nomicon/send-and-sync.html)
- [std::marker::Send](https://doc.rust-lang.org/std/marker/trait.Send.html)
- [std::marker::Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html)

### In-Depth Articles

- [Rust Atomics and Locks](https://marabos.nl/atomics/) - Mara Bos's book on atomic operations and locks
- [Lock-free Rust: Crossbeam in Practice](https://aturon.github.io/blog/2015/08/27/epoch/) - Lock-free programming in practice

### Related Crates

- [crossbeam](https://crates.io/crates/crossbeam) - Concurrency toolkit
- [rayon](https://crates.io/crates/rayon) - Data parallelism library
- [parking_lot](https://crates.io/crates/parking_lot) - High-performance synchronization primitives
- [tokio](https://crates.io/crates/tokio) - Async runtime

### Tools

- [Miri](https://github.com/rust-lang/miri) - Undefined behavior detector
- [ThreadSanitizer](https://doc.rust-lang.org/nightly/unstable-book/compiler-flags/sanitizer.html) - Data race detection
- [loom](https://crates.io/crates/loom) - Concurrency testing tool
