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
origin: old/src/content/docs/rust/send-sync.zh.md
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

在并发编程中，数据竞争是最难调试的 bug 之一。Rust 通过独特的类型系统，在编译时就能防止数据竞争，而这一切的核心就是 `Send` 和 `Sync` 这两个标记 trait（marker trait）。理解它们是掌握 Rust 并发编程的关键。

## 概念解释

### 什么是 Send 和 Sync

`Send` 和 `Sync` 是 Rust 标准库中定义的两个特殊 trait，它们是 **标记 trait（marker trait）**，不包含任何方法，仅用于向编译器表达类型的某种特性。

```rust
// 标准库中的定义（简化版）
pub unsafe auto trait Send {
    // 没有方法
}

pub unsafe auto trait Sync {
    // 没有方法
}
```

**Send**：表示类型的所有权可以在线程间安全转移。如果类型 `T` 实现了 `Send`，意味着 `T` 类型的值可以安全地从一个线程移动到另一个线程。

**Sync**：表示类型可以在多个线程间安全地共享引用。如果类型 `T` 实现了 `Sync`，意味着 `&T`（不可变引用）可以安全地在多个线程间共享。

### 为什么需要这两个 trait

在没有这些保护机制的语言中，并发编程充满陷阱：

```rust
// 假设 Rust 没有 Send/Sync 检查，这样的代码会很危险

// Rc<T> 使用非原子操作的引用计数
use std::rc::Rc;
use std::thread;

fn dangerous_without_check() {
    let data = Rc::new(vec![1, 2, 3]);
    let data_clone = Rc::clone(&data);

    // 如果允许这样做：
    // thread::spawn(move || {
    //     // 两个线程同时修改引用计数
    //     // 导致计数错误，可能造成内存泄漏或 use-after-free
    //     println!("{:?}", data_clone);
    // });

    // Rust 会在编译时阻止这种情况！
}
```

`Send` 和 `Sync` 让编译器能够：
1. 在编译时检测潜在的数据竞争
2. 强制开发者使用线程安全的类型
3. 提供零成本的线程安全抽象

### 历史背景

这两个 trait 的设计理念源于对并发安全的深刻理解。在 Rust 早期设计中，团队意识到：

- 许多类型天然是线程安全的（如 `i32`、`String`）
- 某些类型的设计决定了它们不能跨线程使用（如 `Rc<T>`）
- 需要一种机制让编译器理解这些区别

于是，`Send` 和 `Sync` 应运而生，成为 Rust "无畏并发"（fearless concurrency）的基石。

## 核心原理

### 标记 trait 的本质

`Send` 和 `Sync` 是 **标记 trait**，也称为 **marker trait**。它们的特点是：

1. **不包含任何方法**：纯粹用于类型标记
2. **auto trait**：大多数类型自动实现
3. **unsafe trait**：手动实现需要 unsafe

```rust
// 标记 trait 不增加任何运行时开销
// 它们只存在于编译时的类型检查中

fn require_send<T: Send>(value: T) {
    // 编译器确保 T 可以安全跨线程传递
    // 运行时没有任何额外开销
}

fn require_sync<T: Sync>(value: &T) {
    // 编译器确保 &T 可以安全共享
}
```

### 自动实现机制（Auto Implementation）

Rust 中的 `Send` 和 `Sync` 是 **auto trait**，这意味着编译器会自动为符合条件的类型实现它们：

```rust
// 规则1：如果所有字段都是 Send，则类型自动实现 Send
struct AllSend {
    a: i32,      // i32: Send
    b: String,   // String: Send
    c: Vec<u8>,  // Vec<u8>: Send
}
// AllSend 自动实现 Send

// 规则2：如果任何字段不是 Send，则类型不实现 Send
struct NotSend {
    a: i32,
    b: std::rc::Rc<i32>,  // Rc<T> 不是 Send
}
// NotSend 不实现 Send

// 规则3：Sync 也遵循相同的规则
struct AllSync {
    a: i32,
    b: String,
}
// AllSync 自动实现 Sync

struct NotSync {
    a: std::cell::Cell<i32>,  // Cell<T> 不是 Sync
}
// NotSync 不实现 Sync
```

### Send 与 Sync 的关系

这两个 trait 之间存在重要的关系：

```rust
// 核心关系：如果 T: Sync，则 &T: Send
// 这是因为：
// - Sync 表示 &T 可以安全地被多个线程共享
// - 既然可以共享，当然可以发送给其他线程

// 形式化表达：
// T: Sync  <=>  &T: Send
// T: Send  =>   &mut T: Send

use std::sync::Arc;
use std::thread;

fn demonstrate_relationship() {
    // Arc<T> 要求 T: Send + Sync
    // 这是因为 Arc 可以被多个线程持有（需要 Sync）
    // 同时 Arc 可以在线程间传递（需要 Send）

    let data = Arc::new(42);  // i32: Send + Sync

    let data_clone = Arc::clone(&data);
    thread::spawn(move || {
        println!("Value: {}", *data_clone);
    });
}
```

### 编译器如何使用这些 trait

编译器在多个地方检查 `Send` 和 `Sync`：

```rust
use std::thread;
use std::sync::Arc;
use std::rc::Rc;

fn compiler_checks() {
    // 1. thread::spawn 要求闭包是 Send
    // pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    // where
    //     F: FnOnce() -> T + Send + 'static,
    //     T: Send + 'static,

    let send_data = String::from("hello");
    thread::spawn(move || {
        println!("{}", send_data);  // OK: String 是 Send
    });

    // 2. Arc<T> 要求 T: Send + Sync
    let arc_data = Arc::new(42);  // OK: i32 是 Send + Sync

    // 3. 以下代码无法编译
    // let rc_data = Rc::new(42);
    // thread::spawn(move || {
    //     println!("{}", rc_data);  // 错误！Rc 不是 Send
    // });
}
```

### 底层内存模型

理解 `Send` 和 `Sync` 需要理解底层内存模型：

```rust
use std::cell::UnsafeCell;

// UnsafeCell<T> 是所有内部可变性的基础
// 它既不是 Send 也不是 Sync（除非 T 满足特定条件）

// Cell<T> 基于 UnsafeCell
// - 通过复制/移动来修改值
// - 不是 Sync（因为并发访问可能导致数据竞争）
// - 如果 T: Send，则 Cell<T>: Send

// RefCell<T> 基于 UnsafeCell
// - 运行时借用检查
// - 不是 Sync（借用状态不是线程安全的）
// - 如果 T: Send，则 RefCell<T>: Send

// Mutex<T> 基于 UnsafeCell
// - 使用操作系统互斥锁保护
// - 如果 T: Send，则 Mutex<T>: Send + Sync
// - 因为锁机制确保了独占访问
```

## 核心要点

### Send 的核心规则

| 类型 | 是否 Send | 原因 |
|------|-----------|------|
| `i32`, `f64`, `bool` 等基本类型 | Yes | 值类型，复制即可 |
| `String`, `Vec<T>` (T: Send) | Yes | 拥有堆数据的所有权 |
| `Box<T>` (T: Send) | Yes | 堆分配的单一所有者 |
| `Arc<T>` (T: Send + Sync) | Yes | 原子引用计数 |
| `Mutex<T>` (T: Send) | Yes | 锁保护的数据 |
| `Rc<T>` | No | 非原子引用计数 |
| `*const T`, `*mut T` | No | 原始指针 |
| `MutexGuard<T>` | No | 必须在同一线程释放 |

### Sync 的核心规则

| 类型 | 是否 Sync | 原因 |
|------|-----------|------|
| `i32`, `f64`, `bool` 等基本类型 | Yes | 不可变读取天然安全 |
| `&T` (T: Sync) | Yes | 不可变引用可以共享 |
| `Arc<T>` (T: Send + Sync) | Yes | 原子操作 + 不可变访问 |
| `Mutex<T>` (T: Send) | Yes | 锁保护 |
| `RwLock<T>` (T: Send + Sync) | Yes | 读写锁保护 |
| `Cell<T>`, `RefCell<T>` | No | 内部可变性不是线程安全的 |
| `Rc<T>` | No | 非原子引用计数 |
| `UnsafeCell<T>` | No | 内部可变性的基础类型 |

### 记忆口诀

```rust
// Send: 能发送
// - "我可以把数据发给你"
// - 数据从一个线程移动到另一个线程

// Sync: 能同步
// - "我们可以一起看"
// - 多个线程可以同时读取同一个引用

// 快速判断：
// 1. 涉及非原子引用计数 -> 不是 Send/Sync（如 Rc）
// 2. 涉及内部可变性且无锁 -> 不是 Sync（如 Cell, RefCell）
// 3. 涉及必须本地释放的资源 -> 不是 Send（如 MutexGuard）
// 4. 原始指针 -> 既不是 Send 也不是 Sync
```

### 组合类型的规则

```rust
// 复合类型遵循"木桶原则"：
// - 只要有一个字段不是 Send，整个类型就不是 Send
// - 只要有一个字段不是 Sync，整个类型就不是 Sync

struct Mixed {
    safe: i32,           // Send + Sync
    also_safe: String,   // Send + Sync
    not_sync: std::cell::Cell<i32>,  // Send, 但不是 Sync
}
// Mixed: Send, 但不是 Sync

struct Problematic {
    safe: i32,
    not_send: std::rc::Rc<i32>,  // 既不是 Send 也不是 Sync
}
// Problematic: 既不是 Send 也不是 Sync
```

## 代码示例

### 基本使用示例

```rust
use std::thread;
use std::sync::Arc;

fn basic_send_example() {
    // String 实现了 Send，可以移动到另一个线程
    let message = String::from("Hello from main thread!");

    let handle = thread::spawn(move || {
        // message 的所有权转移到了这个线程
        println!("Received: {}", message);

        // 可以返回数据，因为 String 也是 Send
        message.to_uppercase()
    });

    // 从子线程获取返回值
    let result = handle.join().unwrap();
    println!("Modified: {}", result);
}

fn basic_sync_example() {
    // Arc<T> 允许多个线程共享不可变引用
    let data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];

    for i in 0..3 {
        let data_ref = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // 多个线程可以同时读取 data
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

### 编译错误示例

```rust
use std::rc::Rc;
use std::cell::RefCell;
use std::thread;

fn demonstrate_send_error() {
    let rc_data = Rc::new(42);

    // 编译错误！Rc<i32> 不是 Send
    // thread::spawn(move || {
    //     println!("{}", rc_data);
    // });
    // 错误信息：
    // `Rc<i32>` cannot be sent between threads safely
    // the trait `Send` is not implemented for `Rc<i32>`
}

fn demonstrate_sync_error() {
    let cell = RefCell::new(42);

    // 即使我们只想读取，RefCell 也不是 Sync
    // let cell_ref = &cell;
    // thread::spawn(move || {
    //     println!("{}", cell_ref.borrow());
    // });
    // 错误信息：
    // `RefCell<i32>` cannot be shared between threads safely
    // the trait `Sync` is not implemented for `RefCell<i32>`
}
```

### 正确的线程安全替代方案

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
    // 读多写少的场景使用 RwLock
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 多个读取者
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let read_guard = data.read().unwrap();
            println!("Reader {}: {:?}", i, *read_guard);
        }));
    }

    // 一个写入者
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
    // 简单计数器使用原子类型
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

### 自定义类型的线程安全

```rust
use std::sync::Arc;
use std::thread;

// 所有字段都是 Send + Sync，自动实现 Send + Sync
#[derive(Debug, Clone)]
struct ThreadSafeConfig {
    name: String,
    max_connections: u32,
    timeout_ms: u64,
}

// 使用示例
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

### unsafe impl Send 和 Sync

```rust
use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicBool, Ordering};

/// 一个简单的自旋锁实现
///
/// 通过锁机制确保线程安全，所以我们可以手动实现 Send 和 Sync
pub struct SpinLock<T> {
    locked: AtomicBool,
    data: UnsafeCell<T>,
}

// Safety: 只要 T 是 Send，SpinLock<T> 就可以在线程间传递
// 因为数据被锁保护，同一时间只有一个线程能访问
unsafe impl<T: Send> Send for SpinLock<T> {}

// Safety: 只要 T 是 Send，&SpinLock<T> 就可以在多个线程间共享
// 因为获取数据需要先获取锁，保证了独占访问
unsafe impl<T: Send> Sync for SpinLock<T> {}

impl<T> SpinLock<T> {
    pub fn new(data: T) -> Self {
        SpinLock {
            locked: AtomicBool::new(false),
            data: UnsafeCell::new(data),
        }
    }

    pub fn lock(&self) -> SpinLockGuard<'_, T> {
        // 自旋等待获取锁
        while self
            .locked
            .compare_exchange_weak(false, true, Ordering::Acquire, Ordering::Relaxed)
            .is_err()
        {
            // 给 CPU 一个提示，我们在自旋等待
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
        // Safety: 我们持有锁，有独占访问权
        unsafe { &*self.lock.data.get() }
    }
}

impl<T> std::ops::DerefMut for SpinLockGuard<'_, T> {
    fn deref_mut(&mut self) -> &mut T {
        // Safety: 我们持有锁，有独占访问权
        unsafe { &mut *self.lock.data.get() }
    }
}

impl<T> Drop for SpinLockGuard<'_, T> {
    fn drop(&mut self) {
        self.lock.locked.store(false, Ordering::Release);
    }
}

// 使用示例
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

### 负向实现（Negative Implementation）

```rust
use std::marker::PhantomData;
use std::cell::UnsafeCell;

/// 一个明确不是 Send 的类型
///
/// 使用 PhantomData 来"携带"一个不是 Send 的类型
struct NotSendType {
    _marker: PhantomData<*const ()>,  // *const () 不是 Send
}

impl NotSendType {
    fn new() -> Self {
        NotSendType {
            _marker: PhantomData,
        }
    }
}

/// 另一种方式：使用 !Send 语法（需要 nightly）
/// 在 stable Rust 中，我们通过包含非 Send 字段来实现
struct ExplicitlyNotSend {
    _not_send: PhantomData<*mut ()>,
}

/// 同时阻止 Send 和 Sync
struct NotSendOrSync {
    _marker: PhantomData<UnsafeCell<()>>,  // UnsafeCell 不是 Sync
}

fn demonstrate() {
    use std::thread;

    let not_send = NotSendType::new();

    // 编译错误：NotSendType 不是 Send
    // thread::spawn(move || {
    //     let _ = not_send;
    // });

    // 在当前线程使用是完全可以的
    println!("NotSendType created successfully");
}

fn main() {
    demonstrate();
}
```

### 实用工具函数

```rust
use std::fmt::Debug;

/// 静态断言类型是 Send
fn assert_send<T: Send>() {}

/// 静态断言类型是 Sync
fn assert_sync<T: Sync>() {}

/// 静态断言类型是 Send + Sync
fn assert_send_sync<T: Send + Sync>() {}

/// 检查多个常见类型
fn check_types() {
    // 基本类型
    assert_send::<i32>();
    assert_sync::<i32>();
    assert_send_sync::<i32>();

    // String 和 Vec
    assert_send::<String>();
    assert_sync::<String>();
    assert_send::<Vec<i32>>();
    assert_sync::<Vec<i32>>();

    // 智能指针
    assert_send::<Box<i32>>();
    assert_sync::<Box<i32>>();

    use std::sync::{Arc, Mutex, RwLock};
    assert_send::<Arc<i32>>();
    assert_sync::<Arc<i32>>();
    assert_send::<Mutex<i32>>();
    assert_sync::<Mutex<i32>>();
    assert_send::<RwLock<i32>>();
    assert_sync::<RwLock<i32>>();

    // 以下类型不满足条件，取消注释会导致编译错误
    // use std::rc::Rc;
    // assert_send::<Rc<i32>>();  // 错误！

    // use std::cell::RefCell;
    // assert_sync::<RefCell<i32>>();  // 错误！

    println!("All type checks passed!");
}

/// 运行时打印类型是否实现 Send/Sync
fn print_type_info<T>(_name: &str) {
    // 注意：这只是概念演示
    // 实际上 Rust 没有运行时反射来检查 trait 实现
    // 编译时检查是唯一可靠的方式
}

fn main() {
    check_types();
}
```

## 最佳实践

### 优先使用标准库的线程安全类型

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicUsize, Ordering};

// 好：使用标准库提供的线程安全类型
fn good_practice() {
    // 需要共享所有权 -> Arc
    let shared = Arc::new(42);

    // 需要可变共享 -> Arc<Mutex<T>>
    let mutable_shared = Arc::new(Mutex::new(vec![1, 2, 3]));

    // 读多写少 -> Arc<RwLock<T>>
    let read_heavy = Arc::new(RwLock::new(HashMap::new()));

    // 简单计数器 -> Arc<AtomicUsize>
    let counter = Arc::new(AtomicUsize::new(0));
}

use std::collections::HashMap;

// 不好：尝试手动管理线程安全
// fn bad_practice() {
//     // 使用 Rc 然后手动同步 -> 容易出错
//     // 使用 unsafe 绕过检查 -> 危险
// }
```

### 理解类型的 Send/Sync 状态

```rust
/// 设计类型时考虑线程安全
///
/// 这个类型的所有字段都是 Send + Sync
/// 所以它自动实现 Send + Sync
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

### 避免不必要的 unsafe impl

```rust
// 不好：没有充分理由就使用 unsafe impl
// unsafe impl Send for MyType {}  // 为什么需要？
// unsafe impl Sync for MyType {}  // 能保证安全吗？

// 好：只在有充分理由且能保证安全时使用
use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicBool, Ordering};

/// 文档说明为什么这个 unsafe impl 是安全的
///
/// # Safety
///
/// 这个类型通过原子操作保证了以下不变量：
/// 1. 同一时间只有一个线程能获取可变访问
/// 2. 数据修改总是在锁保护下进行
pub struct SafeWrapper<T> {
    locked: AtomicBool,
    data: UnsafeCell<T>,
}

// Safety: T: Send 保证了数据可以跨线程传递
// 锁机制保证了不会有并发访问
unsafe impl<T: Send> Send for SafeWrapper<T> {}

// Safety: 共享引用只能通过 lock() 获取可变访问
// 锁保证了独占访问
unsafe impl<T: Send> Sync for SafeWrapper<T> {}
```

### 使用类型系统表达意图

```rust
use std::marker::PhantomData;

/// 表示这个句柄只能在创建它的线程使用
pub struct ThreadLocalHandle<T> {
    inner: T,
    // 使用 PhantomData 携带 *const () 来阻止 Send
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

// 编译器自动阻止跨线程传递
fn test_thread_local() {
    let handle = ThreadLocalHandle::new(42);

    // 编译错误：ThreadLocalHandle 不是 Send
    // std::thread::spawn(move || {
    //     println!("{}", handle.get());
    // });

    // 在当前线程使用是可以的
    println!("Value: {}", handle.get());
}
```

### 文档化线程安全保证

```rust
/// 一个线程安全的计数器
///
/// # Thread Safety
///
/// 这个类型实现了 `Send` 和 `Sync`，可以安全地：
/// - 在线程间传递 (`Send`)
/// - 从多个线程共享引用 (`Sync`)
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

## 常见陷阱

### 误解 Send 和 Sync 的含义

```rust
use std::sync::{Arc, Mutex};

// 陷阱：认为 Send 意味着"可以从多个线程访问"
// 实际上：Send 只意味着"可以移动到另一个线程"

fn misunderstanding_send() {
    let data = String::from("hello");

    // 移动到线程1
    std::thread::spawn(move || {
        // data 现在属于这个线程
        println!("{}", data);
        // 所有权在这里，其他线程无法访问
    });

    // data 已经移动，主线程无法再访问
}

// 陷阱：认为 Sync 意味着"可以修改"
// 实际上：Sync 只意味着"不可变引用可以共享"

fn misunderstanding_sync() {
    let data = Arc::new(42);  // 不可变的 Arc

    let handles: Vec<_> = (0..3)
        .map(|i| {
            let data = Arc::clone(&data);
            std::thread::spawn(move || {
                // 只能读取，不能修改
                println!("Thread {}: {}", i, *data);
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    // 如果需要修改，需要 Mutex 或其他同步原语
    let mutable_data = Arc::new(Mutex::new(42));
}
```

### 忘记 Arc<Mutex<T>> 的 T 也需要是 Send

```rust
use std::sync::{Arc, Mutex};
use std::rc::Rc;

// 陷阱：试图在 Mutex 中放入非 Send 类型
fn wrong_mutex_usage() {
    // 编译错误！Rc 不是 Send
    // let data = Arc::new(Mutex::new(Rc::new(42)));

    // 正确：使用 Arc 代替 Rc
    let data = Arc::new(Mutex::new(Arc::new(42)));
}

// 记住 Mutex<T> 的线程安全约束：
// - Mutex<T>: Send 当且仅当 T: Send
// - Mutex<T>: Sync 当且仅当 T: Send
// 注意：Mutex<T>: Sync 不要求 T: Sync
```

### MutexGuard 不能跨 await 点持有

```rust
use std::sync::Mutex;

// 在异步代码中的陷阱
async fn async_mistake() {
    let data = Mutex::new(42);

    // 陷阱：跨 await 点持有锁
    // let guard = data.lock().unwrap();
    // some_async_operation().await;  // MutexGuard 跨越了 await
    // *guard += 1;  // 编译错误！

    // 正确做法1：在 await 之前释放锁
    {
        let mut guard = data.lock().unwrap();
        *guard += 1;
    }  // 锁在这里释放
    some_async_operation().await;

    // 正确做法2：使用 tokio::sync::Mutex
    // let data = tokio::sync::Mutex::new(42);
    // let mut guard = data.lock().await;
    // some_async_operation().await;
    // *guard += 1;  // OK!
}

async fn some_async_operation() {
    // 模拟异步操作
}
```

### 不必要的 unsafe impl

```rust
// 陷阱：为了让代码编译通过而盲目添加 unsafe impl

struct MyWrapper {
    data: std::cell::RefCell<i32>,
}

// 危险！RefCell 的借用检查不是线程安全的
// unsafe impl Sync for MyWrapper {}  // 这会导致数据竞争！

// 正确做法：使用线程安全的替代品
struct SafeWrapper {
    data: std::sync::Mutex<i32>,
}
// 自动实现 Sync，无需手动 impl
```

### 混淆所有权转移和共享

```rust
use std::sync::Arc;
use std::thread;

fn ownership_confusion() {
    let data = vec![1, 2, 3];

    // 陷阱：尝试多次 move 同一个值
    // thread::spawn(move || { println!("{:?}", data); });
    // thread::spawn(move || { println!("{:?}", data); });  // 错误：data 已经移动

    // 正确：使用 Arc 共享所有权
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

### 忽视原子操作的内存顺序

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;

static READY: AtomicBool = AtomicBool::new(false);
static DATA: AtomicUsize = AtomicUsize::new(0);

// 陷阱：使用 Relaxed 顺序进行同步
fn wrong_ordering() {
    // 生产者
    thread::spawn(|| {
        DATA.store(42, Ordering::Relaxed);  // 危险！
        READY.store(true, Ordering::Relaxed);  // 可能重排到 DATA 之前
    });

    // 消费者
    thread::spawn(|| {
        // 即使看到 READY = true，DATA 可能还没有更新
        while !READY.load(Ordering::Relaxed) {}
        let value = DATA.load(Ordering::Relaxed);
        // value 可能是 0 而不是 42！
    });
}

// 正确：使用适当的内存顺序
fn correct_ordering() {
    thread::spawn(|| {
        DATA.store(42, Ordering::Relaxed);
        READY.store(true, Ordering::Release);  // Release 确保之前的写入可见
    });

    thread::spawn(|| {
        while !READY.load(Ordering::Acquire) {}  // Acquire 与 Release 配对
        let value = DATA.load(Ordering::Relaxed);
        // 保证 value == 42
    });
}
```

## 性能考量

### Send/Sync 是零成本抽象

```rust
use std::mem::size_of;

struct WithMarker {
    data: i32,
}

struct WithoutMarker {
    data: i32,
}

fn demonstrate_zero_cost() {
    // Send 和 Sync 是编译时检查，不增加运行时开销
    assert_eq!(size_of::<WithMarker>(), size_of::<WithoutMarker>());
    assert_eq!(size_of::<WithMarker>(), size_of::<i32>());

    println!("Size of WithMarker: {} bytes", size_of::<WithMarker>());
    println!("Size of i32: {} bytes", size_of::<i32>());
}

fn main() {
    demonstrate_zero_cost();
}
```

### 选择合适的同步原语

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

fn benchmark_primitives() {
    const ITERATIONS: usize = 1_000_000;
    const THREADS: usize = 4;

    // Atomic - 最快，适合简单计数器
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

    // Mutex - 中等速度，适合复杂操作
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

    // RwLock - 读多写少时最优
    let start = Instant::now();
    let data = Arc::new(RwLock::new(0usize));
    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let data = Arc::clone(&data);
            std::thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    // 模拟读多写少
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

### parking_lot 作为高性能替代

```rust
// Cargo.toml 中添加: parking_lot = "0.12"

/*
use parking_lot::{Mutex, RwLock};
use std::sync::Arc;

fn use_parking_lot() {
    // parking_lot 的优势：
    // 1. 不返回 Result，不会 panic 中毒
    // 2. 更小的内存占用
    // 3. 某些场景下性能更好

    let data = Arc::new(Mutex::new(0));
    let guard = data.lock();  // 直接返回 MutexGuard，无需 unwrap

    // 性能对比（仅供参考）：
    // - 无竞争时：parking_lot 略快
    // - 高竞争时：差异不大
    // - 内存占用：parking_lot 更小
}
*/
```

### 减少锁竞争

```rust
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

/// 分片锁：减少竞争的常用技术
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

## 实战场景

### 场景1：并发 Web 爬虫

```rust
use std::sync::{Arc, Mutex};
use std::collections::HashSet;
use std::thread;

/// 线程安全的 URL 队列
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
        drop(visited);  // 尽早释放锁

        self.pending.lock().unwrap().push(url);
        true
    }

    fn pop(&self) -> Option<String> {
        self.pending.lock().unwrap().pop()
    }
}

/// 线程安全的爬取结果
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

    // 添加初始 URLs
    for i in 0..20 {
        queue.add(format!("https://example.com/page{}", i));
    }

    let mut handles = vec![];

    // 创建工作线程
    for worker_id in 0..4 {
        let queue = Arc::clone(&queue);
        let results = Arc::clone(&results);

        handles.push(thread::spawn(move || {
            while let Some(url) = queue.pop() {
                // 模拟网络请求
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

### 场景2：线程安全的配置管理

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::thread;

/// 线程安全的配置管理器
///
/// 使用 RwLock 因为读取远多于写入
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

    // 初始化配置
    config.set("database.host".to_string(), "localhost".to_string());
    config.set("database.port".to_string(), "5432".to_string());
    config.set("cache.enabled".to_string(), "true".to_string());

    let mut handles = vec![];

    // 多个读取线程
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

    // 一个写入线程
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

### 场景3：生产者-消费者模式

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::collections::VecDeque;
use std::thread;

/// 线程安全的有界队列
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

        // 等待队列有空间
        while queue.len() >= self.capacity {
            queue = self.not_full.wait(queue).unwrap();
        }

        queue.push_back(item);
        self.not_empty.notify_one();
    }

    pub fn pop(&self) -> T {
        let mut queue = self.queue.lock().unwrap();

        // 等待队列非空
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

    // 生产者
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

    // 消费者
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

### 场景4：并发数据处理管道

```rust
use std::sync::{Arc, Mutex};
use std::sync::mpsc::{channel, Sender, Receiver};
use std::thread;

/// 数据处理阶段
trait Stage: Send + Sync {
    type Input: Send;
    type Output: Send;

    fn process(&self, input: Self::Input) -> Self::Output;
}

/// 简单的数据管道
struct Pipeline<I, O> {
    stages: Vec<Box<dyn Fn(I) -> O + Send + Sync>>,
    num_workers: usize,
}

// 简化版：直接使用闭包
fn pipeline_example() {
    let (tx, rx) = channel::<i32>();
    let (tx2, rx2) = channel::<i32>();
    let (tx3, rx3) = channel::<String>();

    let rx = Arc::new(Mutex::new(rx));
    let rx2 = Arc::new(Mutex::new(rx2));

    // 阶段1：乘以2
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

    // 阶段2：转换为字符串
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

    // 发送数据
    for i in 1..=5 {
        tx.send(i).unwrap();
    }
    drop(tx);

    // 收集结果
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

## 面试要点

### 常见面试问题

**Q1: 什么是 Send 和 Sync trait？它们有什么区别？**

```text
A: Send 和 Sync 是 Rust 的两个标记 trait：

Send：
- 表示类型的所有权可以在线程间安全转移
- 如果 T: Send，则可以将 T 的值从一个线程移动到另一个线程
- 例如：String, Vec<T>, Box<T> 都是 Send

Sync：
- 表示类型可以在多个线程间安全地共享引用
- 如果 T: Sync，则 &T 可以安全地在多个线程间共享
- 等价于说：&T 是 Send
- 例如：i32, &str, Arc<T> 都是 Sync

关键区别：
- Send 关注所有权转移（move）
- Sync 关注共享引用（borrow）
```

**Q2: 为什么 Rc 不是 Send，而 Arc 是 Send？**

```text
A: 核心区别在于引用计数的实现：

Rc（Reference Counted）：
- 使用非原子操作更新引用计数
- 多线程同时修改计数会导致数据竞争
- 可能导致：内存泄漏（计数过高）或 use-after-free（计数过低）
- 因此 Rc 既不是 Send 也不是 Sync

Arc（Atomic Reference Counted）：
- 使用原子操作更新引用计数
- 原子操作保证了计数更新的线程安全性
- Arc<T> 是 Send + Sync（当 T: Send + Sync 时）
- 代价是原子操作比普通操作慢

选择建议：
- 单线程：使用 Rc（性能更好）
- 多线程：使用 Arc
```

**Q3: 如何让自定义类型实现 Send 和 Sync？**

```text
A: 两种方式：

1. 自动实现（推荐）：
   - 确保所有字段都是 Send/Sync
   - 编译器会自动为类型实现 Send/Sync

2. 手动实现（需要 unsafe）：
   unsafe impl Send for MyType {}
   unsafe impl Sync for MyType {}

   - 只有当你能保证类型是线程安全的才能这样做
   - 需要仔细分析并记录安全性保证

常见场景：
- 使用原始指针但保证了安全性
- 使用 UnsafeCell 但通过锁保护了访问
- 封装了非 Rust 代码的线程安全类型
```

**Q4: Cell 和 RefCell 为什么不是 Sync？**

```text
A: 因为它们的内部可变性不是线程安全的：

Cell<T>：
- 通过复制/移动来修改值
- 没有任何同步机制
- 并发读写会导致数据竞争

RefCell<T>：
- 使用运行时借用检查
- 借用状态存储在非原子变量中
- 并发操作会破坏借用状态的一致性

线程安全替代：
- Cell<T> -> Atomic* 类型
- RefCell<T> -> Mutex<T> 或 RwLock<T>
```

**Q5: 什么情况下需要手动实现 Send/Sync？**

```text
A: 以下情况可能需要：

1. 封装 FFI 类型：
   - C 库返回的指针，你知道它是线程安全的

2. 自定义同步原语：
   - 实现自己的锁或无锁数据结构

3. 使用 UnsafeCell 的类型：
   - 你通过其他方式保证了线程安全

安全准则：
- 必须使用 unsafe impl
- 必须编写详细的 Safety 文档
- 必须确保类型确实是线程安全的
- 充分测试，使用 Miri 检测问题
```

**Q6: thread::spawn 为什么要求 F: Send + 'static？**

```text
A: 两个要求的原因：

Send：
- 闭包会被移动到新线程执行
- 闭包捕获的所有值都必须能安全跨线程传递
- 如果捕获了非 Send 类型，编译失败

'static：
- 新线程可能比创建它的作用域活得更久
- 闭包不能引用可能被释放的数据
- 保证闭包内的数据在整个线程生命周期内有效

解决方案：
- 使用 move 闭包获取所有权
- 使用 Arc 共享数据
- 使用 scoped threads（thread::scope）借用栈上数据
```

### 代码挑战

```rust
// 挑战：修复以下代码使其能够编译和正确运行

use std::thread;

fn challenge_1() {
    // 问题：Rc 不是 Send
    // let data = std::rc::Rc::new(42);
    // let data_clone = data.clone();
    // thread::spawn(move || {
    //     println!("{}", data_clone);
    // });

    // 解答：使用 Arc
    let data = std::sync::Arc::new(42);
    let data_clone = data.clone();
    thread::spawn(move || {
        println!("{}", data_clone);
    });
}

fn challenge_2() {
    // 问题：RefCell 不是 Sync
    // let data = std::sync::Arc::new(std::cell::RefCell::new(42));
    // let data_clone = data.clone();
    // thread::spawn(move || {
    //     *data_clone.borrow_mut() += 1;
    // });

    // 解答：使用 Mutex
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

## 延伸阅读

### 官方资源

- [The Rust Programming Language - Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html)
- [The Rustonomicon - Send and Sync](https://doc.rust-lang.org/nomicon/send-and-sync.html)
- [std::marker::Send](https://doc.rust-lang.org/std/marker/trait.Send.html)
- [std::marker::Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html)

### 深入文章

- [Rust Atomics and Locks](https://marabos.nl/atomics/) - Mara Bos 的原子操作与锁书籍
- [Lock-free Rust: Crossbeam in Practice](https://aturon.github.io/blog/2015/08/27/epoch/) - 无锁编程实践

### 相关 Crate

- [crossbeam](https://crates.io/crates/crossbeam) - 并发工具集
- [rayon](https://crates.io/crates/rayon) - 数据并行库
- [parking_lot](https://crates.io/crates/parking_lot) - 高性能同步原语
- [tokio](https://crates.io/crates/tokio) - 异步运行时

### 工具

- [Miri](https://github.com/rust-lang/miri) - 未定义行为检测器
- [ThreadSanitizer](https://doc.rust-lang.org/nightly/unstable-book/compiler-flags/sanitizer.html) - 数据竞争检测
- [loom](https://crates.io/crates/loom) - 并发测试工具
