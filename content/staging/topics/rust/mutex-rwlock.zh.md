---
title: Mutex与RwLock
description: Rust互斥锁与读写锁完全指南，深入理解Mutex<T>、RwLock<T>、锁中毒与死锁预防
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - Mutex
  - RwLock
  - 并发
  - 线程安全
  - 锁
status: imported
origin: old/src/content/docs/rust/mutex-rwlock.zh.md
divergence: 0.183
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 并发
  order: 7
  lastUpdated: 2026-01-07
---

在多线程编程中，当多个线程需要访问和修改共享数据时，我们需要同步机制来确保数据的一致性和线程安全。Rust 标准库提供了两种主要的锁类型：`Mutex<T>`（互斥锁）和 `RwLock<T>`（读写锁）。本文将深入探讨这两种锁的工作原理、使用方法以及最佳实践。

## 概念解释

### 什么是互斥锁（Mutex）

Mutex 是 "Mutual Exclusion"（互斥）的缩写。`Mutex<T>` 保证在任意时刻，只有一个线程能够访问被保护的数据。当一个线程持有锁时，其他试图获取锁的线程必须等待，直到锁被释放。

### 什么是读写锁（RwLock）

`RwLock<T>` 是一种更细粒度的锁，它区分读取操作和写入操作：
- **多个读取者**：允许任意数量的线程同时持有读锁
- **单个写入者**：写锁是独占的，持有写锁时不允许其他任何读锁或写锁

### 历史背景

Mutex 和 RwLock 的概念源自操作系统和并发编程理论，已有数十年的历史。Rust 的创新在于将这些同步原语与所有权系统深度集成，使得：

1. 锁保护的数据与锁本身绑定，无法在不获取锁的情况下访问数据
2. 锁的释放是自动的，通过 RAII（资源获取即初始化）模式确保
3. 编译时类型检查防止了许多常见的并发错误

### 解决什么问题

锁机制主要解决以下问题：

- **数据竞争（Data Race）**：多个线程同时访问同一数据，且至少一个是写操作
- **原子性问题**：确保复合操作的原子执行
- **可见性问题**：确保一个线程的修改对其他线程可见

---

## 核心原理

### Mutex 的内部结构

`Mutex<T>` 在 Rust 中的定义简化如下：

```rust
pub struct Mutex<T: ?Sized> {
    inner: sys::Mutex,     // 操作系统原生互斥锁
    poison: poison::Flag,  // 中毒标志
    data: UnsafeCell<T>,   // 被保护的数据
}
```

核心组件：

1. **inner**：底层操作系统互斥锁（如 pthread_mutex 或 Windows CRITICAL_SECTION）
2. **poison**：记录锁是否被"中毒"（持有锁的线程 panic 了）
3. **data**：使用 `UnsafeCell` 包装的数据，实现内部可变性

### RwLock 的内部结构

```rust
pub struct RwLock<T: ?Sized> {
    inner: sys::RwLock,    // 操作系统原生读写锁
    poison: poison::Flag,  // 中毒标志
    data: UnsafeCell<T>,   // 被保护的数据
}
```

### MutexGuard 与 RAII

当调用 `lock()` 方法时，返回的是 `MutexGuard<T>` 智能指针：

```rust
pub struct MutexGuard<'a, T: ?Sized + 'a> {
    lock: &'a Mutex<T>,
    // 实现了 Deref 和 DerefMut trait
}

impl<T: ?Sized> Drop for MutexGuard<'_, T> {
    fn drop(&mut self) {
        // 自动释放锁
        unsafe { self.lock.inner.unlock(); }
    }
}
```

这种设计确保了：
- 锁的生命周期与 Guard 绑定
- Guard 离开作用域时自动释放锁
- 无需手动调用 unlock

### 锁中毒机制（Poisoning）

当持有锁的线程发生 panic 时，锁会被标记为"中毒"：

```rust
// 简化的中毒检测逻辑
pub fn lock(&self) -> LockResult<MutexGuard<'_, T>> {
    unsafe {
        self.inner.lock();
        // 检查中毒状态
        if self.poison.get() {
            Err(PoisonError::new(MutexGuard::new(self)))
        } else {
            Ok(MutexGuard::new(self))
        }
    }
}
```

中毒的目的是提醒后续获取锁的线程：数据可能处于不一致状态。

### 内存顺序保证

Rust 的 Mutex 和 RwLock 提供以下内存顺序保证：

- **acquire 语义**：获取锁时，确保能看到之前释放锁时的所有写入
- **release 语义**：释放锁时，确保所有之前的写入对后续获取锁的线程可见

---

## 核心要点

### Mutex 核心 API

| 方法 | 描述 | 阻塞 | 返回类型 |
|------|------|------|----------|
| `lock()` | 获取锁，阻塞等待 | 是 | `LockResult<MutexGuard<T>>` |
| `try_lock()` | 尝试获取锁，立即返回 | 否 | `TryLockResult<MutexGuard<T>>` |
| `is_poisoned()` | 检查锁是否中毒 | 否 | `bool` |
| `into_inner()` | 消费锁，返回内部数据 | 否 | `LockResult<T>` |
| `get_mut()` | 获取可变引用（需要 &mut self） | 否 | `LockResult<&mut T>` |

### RwLock 核心 API

| 方法 | 描述 | 阻塞 | 返回类型 |
|------|------|------|----------|
| `read()` | 获取读锁 | 是 | `LockResult<RwLockReadGuard<T>>` |
| `write()` | 获取写锁 | 是 | `LockResult<RwLockWriteGuard<T>>` |
| `try_read()` | 尝试获取读锁 | 否 | `TryLockResult<RwLockReadGuard<T>>` |
| `try_write()` | 尝试获取写锁 | 否 | `TryLockResult<RwLockWriteGuard<T>>` |

### 关键特性对比

| 特性 | Mutex | RwLock |
|------|-------|--------|
| 并发读取 | 不支持 | 支持 |
| 写入独占 | 是 | 是 |
| 实现复杂度 | 简单 | 复杂 |
| 锁获取开销 | 较低 | 较高 |
| 适用场景 | 写多读少或读写均衡 | 读多写少 |
| 写入饥饿风险 | 无 | 有（取决于实现） |

---

## 代码示例

### 基础 Mutex 使用

```rust
use std::sync::Mutex;

fn main() {
    // 创建一个被 Mutex 保护的值
    let counter = Mutex::new(0);

    {
        // 获取锁，返回 MutexGuard
        let mut guard = counter.lock().unwrap();
        // 通过解引用修改值
        *guard += 1;
        println!("计数器值: {}", *guard);
        // guard 离开作用域时自动释放锁
    }

    // 再次获取锁
    let value = counter.lock().unwrap();
    println!("最终值: {}", *value);
}
```

### 多线程共享 Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc 用于在多线程间共享 Mutex
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            // 获取锁并增加计数
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("线程 {} 增加计数，当前值: {}", i, *num);
        });
        handles.push(handle);
    }

    // 等待所有线程完成
    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", *counter.lock().unwrap());
}
```

### try_lock 非阻塞获取

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(Mutex::new(0));

    // 第一个线程持有锁较长时间
    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let _guard = data_clone.lock().unwrap();
        println!("线程1: 持有锁");
        thread::sleep(Duration::from_secs(2));
        println!("线程1: 释放锁");
    });

    // 等待第一个线程获取锁
    thread::sleep(Duration::from_millis(100));

    // 第二个线程尝试非阻塞获取
    match data.try_lock() {
        Ok(guard) => {
            println!("成功获取锁: {}", *guard);
        }
        Err(_) => {
            println!("锁被占用，无法获取");
        }
    }

    // 使用循环尝试
    let mut attempts = 0;
    loop {
        match data.try_lock() {
            Ok(guard) => {
                println!("第 {} 次尝试成功获取锁: {}", attempts + 1, *guard);
                break;
            }
            Err(_) => {
                attempts += 1;
                if attempts > 10 {
                    println!("尝试次数过多，放弃");
                    break;
                }
                println!("第 {} 次尝试失败，稍后重试...", attempts);
                thread::sleep(Duration::from_millis(300));
            }
        }
    }

    handle.join().unwrap();
}
```

### RwLock 基础使用

```rust
use std::sync::RwLock;

fn main() {
    let data = RwLock::new(vec![1, 2, 3]);

    // 多个读取者可以同时持有读锁
    {
        let read1 = data.read().unwrap();
        let read2 = data.read().unwrap();
        println!("读取1: {:?}", *read1);
        println!("读取2: {:?}", *read2);
        // 两个读锁可以同时存在
    }

    // 写入需要独占锁
    {
        let mut write = data.write().unwrap();
        write.push(4);
        println!("写入后: {:?}", *write);
    }

    // 写锁释放后可以继续读取
    {
        let read = data.read().unwrap();
        println!("最终数据: {:?}", *read);
    }
}
```

### 多线程 RwLock

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 创建多个读取线程
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            for j in 0..3 {
                let read_guard = data.read().unwrap();
                println!("读取线程 {} 第 {} 次读取: {:?}", i, j, *read_guard);
                drop(read_guard);
                thread::sleep(Duration::from_millis(50));
            }
        }));
    }

    // 创建一个写入线程
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            for i in 4..7 {
                thread::sleep(Duration::from_millis(100));
                let mut write_guard = data.write().unwrap();
                write_guard.push(i);
                println!("写入线程添加元素: {}", i);
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终数据: {:?}", *data.read().unwrap());
}
```

### 处理锁中毒

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    // 在一个线程中 panic
    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let _guard = data_clone.lock().unwrap();
        panic!("线程发生 panic！");
    });

    // 忽略 panic
    let _ = handle.join();

    // 检查锁是否中毒
    println!("锁是否中毒: {}", data.is_poisoned());

    // 处理中毒的锁
    match data.lock() {
        Ok(guard) => {
            println!("正常获取锁: {:?}", *guard);
        }
        Err(poisoned) => {
            println!("锁已中毒，但仍可访问数据");
            // 选择1：忽略中毒，获取数据
            let guard = poisoned.into_inner();
            println!("恢复的数据: {:?}", *guard);
        }
    }

    // 使用 unwrap_or_else 简洁处理
    let guard = data.lock().unwrap_or_else(|poisoned| {
        println!("警告：锁已中毒，正在恢复...");
        poisoned.into_inner()
    });
    println!("数据: {:?}", *guard);
}
```

### 清除锁中毒

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(100));

    // 导致中毒
    let data_clone = Arc::clone(&data);
    let _ = thread::spawn(move || {
        let _guard = data_clone.lock().unwrap();
        panic!("故意 panic");
    }).join();

    println!("中毒状态: {}", data.is_poisoned());

    // 使用 clear_poison() 清除中毒状态 (Rust 1.77+)
    data.clear_poison();
    println!("清除后中毒状态: {}", data.is_poisoned());

    // 现在可以正常使用
    let guard = data.lock().unwrap();
    println!("值: {}", *guard);
}
```

### 条件变量配合 Mutex

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::Duration;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    // 等待线程
    let pair_clone = Arc::clone(&pair);
    let waiter = thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        let mut started = lock.lock().unwrap();

        println!("等待线程: 等待条件...");
        while !*started {
            // wait 会自动释放锁并阻塞
            // 被唤醒时会重新获取锁
            started = cvar.wait(started).unwrap();
        }
        println!("等待线程: 条件满足，继续执行");
    });

    // 通知线程
    thread::sleep(Duration::from_secs(1));
    let (lock, cvar) = &*pair;
    {
        let mut started = lock.lock().unwrap();
        *started = true;
        println!("通知线程: 设置条件为 true");
    }
    cvar.notify_one();

    waiter.join().unwrap();
}
```

### 带超时的条件等待

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::Duration;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    let pair_clone = Arc::clone(&pair);
    let waiter = thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        let mut guard = lock.lock().unwrap();

        println!("等待最多 2 秒...");
        let result = cvar.wait_timeout_while(
            guard,
            Duration::from_secs(2),
            |pending| !*pending
        ).unwrap();

        if result.1.timed_out() {
            println!("等待超时！");
        } else {
            println!("条件在超时前满足");
        }
    });

    // 3 秒后才设置条件（会导致超时）
    thread::sleep(Duration::from_secs(3));
    let (lock, cvar) = &*pair;
    *lock.lock().unwrap() = true;
    cvar.notify_one();

    waiter.join().unwrap();
}
```

---

## 最佳实践

### 最小化锁持有时间

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

struct DataProcessor {
    data: Arc<Mutex<Vec<i32>>>,
}

impl DataProcessor {
    // 好的做法：快速获取数据后释放锁
    fn process_good(&self) {
        // 快速复制数据
        let data_copy = {
            let guard = self.data.lock().unwrap();
            guard.clone()
        }; // 锁在这里释放

        // 在锁外进行耗时处理
        let result: i32 = data_copy.iter().sum();
        thread::sleep(Duration::from_millis(100)); // 模拟耗时操作
        println!("处理结果: {}", result);
    }

    // 不好的做法：长时间持有锁
    fn process_bad(&self) {
        let guard = self.data.lock().unwrap();
        let result: i32 = guard.iter().sum();
        thread::sleep(Duration::from_millis(100)); // 锁仍被持有！
        println!("处理结果: {}", result);
    }
}
```

### 使用作用域控制锁生命周期

```rust
use std::sync::Mutex;

fn main() {
    let data = Mutex::new(vec![1, 2, 3]);

    // 使用显式作用域
    {
        let mut guard = data.lock().unwrap();
        guard.push(4);
    } // 锁在这里释放

    // 使用 drop 显式释放
    let mut guard = data.lock().unwrap();
    guard.push(5);
    drop(guard); // 显式释放锁

    // 继续其他操作
    println!("数据: {:?}", *data.lock().unwrap());
}
```

### 避免在锁内调用可能阻塞的操作

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

// 不好的做法
fn bad_example(data: &Mutex<String>) {
    let guard = data.lock().unwrap();
    // 在持有锁时进行 I/O 操作
    // std::fs::write("output.txt", &*guard).unwrap();
    println!("持有锁时的操作: {}", guard);
    thread::sleep(Duration::from_secs(1)); // 模拟 I/O
}

// 好的做法
fn good_example(data: &Mutex<String>) {
    let content = {
        let guard = data.lock().unwrap();
        guard.clone()
    }; // 锁已释放

    // 在锁外进行 I/O 操作
    // std::fs::write("output.txt", &content).unwrap();
    println!("锁外操作: {}", content);
    thread::sleep(Duration::from_secs(1));
}
```

### 使用 parking_lot 替代标准库

对于高性能场景，考虑使用 `parking_lot` crate：

```toml
[dependencies]
parking_lot = "0.12"
```

```rust
use parking_lot::{Mutex, RwLock};
use std::sync::Arc;
use std::thread;

fn main() {
    // parking_lot 的优势：
    // 1. 不会中毒（无需处理 Result）
    // 2. 更小的内存占用
    // 3. 更好的性能

    let data = Arc::new(Mutex::new(0));

    let mut handles = vec![];
    for _ in 0..10 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut guard = data.lock(); // 直接返回 Guard，无需 unwrap
            *guard += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("结果: {}", *data.lock());

    // RwLock 使用
    let rw_data = Arc::new(RwLock::new(vec![1, 2, 3]));

    // 可升级的读锁
    let upgradable = rw_data.upgradable_read();
    println!("读取: {:?}", *upgradable);

    // 升级为写锁
    let mut write_guard = parking_lot::RwLockUpgradableReadGuard::upgrade(upgradable);
    write_guard.push(4);
    println!("写入后: {:?}", *write_guard);
}
```

### 锁的粒度选择

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::collections::HashMap;

// 粗粒度锁：整个结构一把锁
struct CoarseGrained {
    data: Mutex<HashMap<String, Vec<i32>>>,
}

// 细粒度锁：每个值一把锁
struct FineGrained {
    data: RwLock<HashMap<String, Arc<Mutex<Vec<i32>>>>>,
}

impl FineGrained {
    fn new() -> Self {
        FineGrained {
            data: RwLock::new(HashMap::new()),
        }
    }

    fn get_or_create(&self, key: &str) -> Arc<Mutex<Vec<i32>>> {
        // 先尝试读取
        {
            let read_guard = self.data.read().unwrap();
            if let Some(value) = read_guard.get(key) {
                return Arc::clone(value);
            }
        }

        // 需要写入
        let mut write_guard = self.data.write().unwrap();
        // 双重检查
        if let Some(value) = write_guard.get(key) {
            return Arc::clone(value);
        }

        let value = Arc::new(Mutex::new(Vec::new()));
        write_guard.insert(key.to_string(), Arc::clone(&value));
        value
    }

    fn update(&self, key: &str, item: i32) {
        let bucket = self.get_or_create(key);
        let mut guard = bucket.lock().unwrap();
        guard.push(item);
    }
}
```

### 使用类型状态模式

```rust
use std::sync::Mutex;

// 使用类型来编码锁的状态
struct Unlocked;
struct Locked<'a, T>(&'a Mutex<T>);

struct SafeCounter {
    inner: Mutex<i32>,
}

impl SafeCounter {
    fn new(initial: i32) -> Self {
        SafeCounter {
            inner: Mutex::new(initial),
        }
    }

    fn lock(&self) -> LockedCounter<'_> {
        LockedCounter {
            guard: self.inner.lock().unwrap(),
        }
    }
}

struct LockedCounter<'a> {
    guard: std::sync::MutexGuard<'a, i32>,
}

impl LockedCounter<'_> {
    fn increment(&mut self) {
        *self.guard += 1;
    }

    fn decrement(&mut self) {
        *self.guard -= 1;
    }

    fn get(&self) -> i32 {
        *self.guard
    }
}

fn main() {
    let counter = SafeCounter::new(0);

    let mut locked = counter.lock();
    locked.increment();
    locked.increment();
    println!("值: {}", locked.get());
    // locked 离开作用域，自动解锁
}
```

---

## 常见陷阱

### 死锁

死锁发生在多个线程相互等待对方持有的锁时：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn deadlock_example() {
    let lock_a = Arc::new(Mutex::new(0));
    let lock_b = Arc::new(Mutex::new(0));

    let a1 = Arc::clone(&lock_a);
    let b1 = Arc::clone(&lock_b);
    let handle1 = thread::spawn(move || {
        let _guard_a = a1.lock().unwrap();
        println!("线程1: 持有锁A");
        thread::sleep(std::time::Duration::from_millis(100));
        println!("线程1: 尝试获取锁B...");
        let _guard_b = b1.lock().unwrap(); // 可能死锁
        println!("线程1: 持有锁A和锁B");
    });

    let a2 = Arc::clone(&lock_a);
    let b2 = Arc::clone(&lock_b);
    let handle2 = thread::spawn(move || {
        let _guard_b = b2.lock().unwrap();
        println!("线程2: 持有锁B");
        thread::sleep(std::time::Duration::from_millis(100));
        println!("线程2: 尝试获取锁A...");
        let _guard_a = a2.lock().unwrap(); // 可能死锁
        println!("线程2: 持有锁B和锁A");
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}

// 解决方案：始终按相同顺序获取锁
fn no_deadlock_example() {
    let lock_a = Arc::new(Mutex::new(0));
    let lock_b = Arc::new(Mutex::new(0));

    let a1 = Arc::clone(&lock_a);
    let b1 = Arc::clone(&lock_b);
    let handle1 = thread::spawn(move || {
        let _guard_a = a1.lock().unwrap(); // 先 A
        let _guard_b = b1.lock().unwrap(); // 后 B
        println!("线程1: 安全持有两个锁");
    });

    let a2 = Arc::clone(&lock_a);
    let b2 = Arc::clone(&lock_b);
    let handle2 = thread::spawn(move || {
        let _guard_a = a2.lock().unwrap(); // 先 A（相同顺序）
        let _guard_b = b2.lock().unwrap(); // 后 B
        println!("线程2: 安全持有两个锁");
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

### 在同一线程重复获取非递归锁

```rust
use std::sync::Mutex;

fn recursive_lock_issue() {
    let data = Mutex::new(0);

    let _guard = data.lock().unwrap();
    // 下面这行会导致死锁！Rust 标准库的 Mutex 不是递归的
    // let _guard2 = data.lock().unwrap();

    println!("这行永远不会执行");
}

// 解决方案：重构代码避免递归锁定
fn avoid_recursive_lock() {
    let data = Mutex::new(0);

    // 将需要锁的操作集中在一次获取锁的过程中
    {
        let mut guard = data.lock().unwrap();
        *guard += 1;
        *guard *= 2;
        // 所有操作完成后再释放锁
    }
}

// 或者使用 parking_lot 的 ReentrantMutex
// use parking_lot::ReentrantMutex;
```

### 忘记释放锁

```rust
use std::sync::Mutex;

fn forgotten_lock() {
    let data = Mutex::new(vec![1, 2, 3]);

    // 问题代码：锁没有及时释放
    let result = {
        let guard = data.lock().unwrap();
        guard.len()
    }; // guard 在这里被释放

    // 或者使用 drop
    let guard = data.lock().unwrap();
    let len = guard.len();
    drop(guard); // 显式释放

    // 常见错误：在 match/if 中持有锁太久
    let data2 = Mutex::new(Some(42));
    match *data2.lock().unwrap() {
        Some(v) => {
            // 锁仍被持有
            println!("值: {}", v);
        }
        None => {}
    } // 锁在这里释放
}
```

### RwLock 写入饥饿

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn writer_starvation() {
    let data = Arc::new(RwLock::new(0));

    // 大量读取者
    for i in 0..100 {
        let data = Arc::clone(&data);
        thread::spawn(move || {
            loop {
                let _read = data.read().unwrap();
                thread::sleep(Duration::from_millis(1));
            }
        });
    }

    // 写入者可能永远等不到机会
    let data = Arc::clone(&data);
    thread::spawn(move || {
        loop {
            // 在读取密集的情况下，写入可能很难获取锁
            let mut write = data.write().unwrap();
            *write += 1;
            println!("成功写入: {}", *write);
            thread::sleep(Duration::from_millis(100));
        }
    });

    thread::sleep(Duration::from_secs(5));
}
```

### 锁粒度不当

```rust
use std::sync::Mutex;
use std::collections::HashMap;

// 问题：整个 HashMap 用一把锁，并发性能差
struct BadCache {
    data: Mutex<HashMap<String, String>>,
}

// 改进：分片锁
struct ShardedCache {
    shards: Vec<Mutex<HashMap<String, String>>>,
}

impl ShardedCache {
    fn new(shard_count: usize) -> Self {
        let shards = (0..shard_count)
            .map(|_| Mutex::new(HashMap::new()))
            .collect();
        ShardedCache { shards }
    }

    fn get_shard(&self, key: &str) -> &Mutex<HashMap<String, String>> {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        let index = (hasher.finish() as usize) % self.shards.len();
        &self.shards[index]
    }

    fn get(&self, key: &str) -> Option<String> {
        let shard = self.get_shard(key);
        let guard = shard.lock().unwrap();
        guard.get(key).cloned()
    }

    fn set(&self, key: String, value: String) {
        let shard = self.get_shard(&key);
        let mut guard = shard.lock().unwrap();
        guard.insert(key, value);
    }
}
```

---

## 性能考量

### Mutex vs RwLock 性能对比

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Instant;

fn benchmark_mutex_vs_rwlock() {
    const THREADS: usize = 8;
    const ITERATIONS: usize = 100_000;

    // Mutex 基准测试（全部是读操作）
    let mutex_data = Arc::new(Mutex::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let data = Arc::clone(&mutex_data);
            thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    let _value = *data.lock().unwrap();
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("Mutex (读): {:?}", start.elapsed());

    // RwLock 基准测试（全部是读操作）
    let rwlock_data = Arc::new(RwLock::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|_| {
            let data = Arc::clone(&rwlock_data);
            thread::spawn(move || {
                for _ in 0..ITERATIONS {
                    let _value = *data.read().unwrap();
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("RwLock (读): {:?}", start.elapsed());

    // 混合读写场景
    let mutex_data = Arc::new(Mutex::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|i| {
            let data = Arc::clone(&mutex_data);
            thread::spawn(move || {
                for j in 0..ITERATIONS {
                    if i == 0 && j % 100 == 0 {
                        // 1% 写操作
                        *data.lock().unwrap() += 1;
                    } else {
                        let _value = *data.lock().unwrap();
                    }
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("Mutex (99%读 1%写): {:?}", start.elapsed());

    let rwlock_data = Arc::new(RwLock::new(0i32));
    let start = Instant::now();

    let handles: Vec<_> = (0..THREADS)
        .map(|i| {
            let data = Arc::clone(&rwlock_data);
            thread::spawn(move || {
                for j in 0..ITERATIONS {
                    if i == 0 && j % 100 == 0 {
                        *data.write().unwrap() += 1;
                    } else {
                        let _value = *data.read().unwrap();
                    }
                }
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }
    println!("RwLock (99%读 1%写): {:?}", start.elapsed());
}
```

### 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 读写均衡 | Mutex | 更简单，开销更低 |
| 读远多于写（>10:1） | RwLock | 读操作可以并发 |
| 写多于读 | Mutex | RwLock 写锁开销更大 |
| 锁持有时间很短 | Mutex | 简单高效 |
| 锁持有时间较长且读多 | RwLock | 减少读阻塞 |
| 高竞争场景 | 考虑无锁结构 | 原子操作或分片 |

### 减少锁竞争的策略

```rust
use std::sync::{Arc, Mutex};
use std::thread;

// 策略1：减少锁的范围
fn minimize_critical_section() {
    let data = Arc::new(Mutex::new(Vec::new()));

    // 不好：在锁内做所有事情
    // let mut guard = data.lock().unwrap();
    // let processed = expensive_computation();
    // guard.push(processed);

    // 好：只在必要时持有锁
    let processed = expensive_computation(); // 锁外计算
    data.lock().unwrap().push(processed);    // 快速获取锁并更新
}

fn expensive_computation() -> i32 {
    // 模拟耗时计算
    42
}

// 策略2：批量操作
fn batch_operations() {
    let data = Arc::new(Mutex::new(Vec::new()));
    let items_to_add = vec![1, 2, 3, 4, 5];

    // 不好：每个元素获取一次锁
    // for item in &items_to_add {
    //     data.lock().unwrap().push(*item);
    // }

    // 好：一次获取锁，批量添加
    let mut guard = data.lock().unwrap();
    for item in items_to_add {
        guard.push(item);
    }
}

// 策略3：使用线程本地缓存
use std::cell::RefCell;

thread_local! {
    static LOCAL_CACHE: RefCell<Vec<i32>> = RefCell::new(Vec::new());
}

fn use_thread_local() {
    let global_data = Arc::new(Mutex::new(Vec::new()));

    let handles: Vec<_> = (0..4)
        .map(|_| {
            let global = Arc::clone(&global_data);
            thread::spawn(move || {
                // 在本地累积结果
                LOCAL_CACHE.with(|cache| {
                    for i in 0..1000 {
                        cache.borrow_mut().push(i);
                    }

                    // 批量提交到全局
                    let local_data: Vec<_> = cache.borrow_mut().drain(..).collect();
                    global.lock().unwrap().extend(local_data);
                });
            })
        })
        .collect();

    for h in handles {
        h.join().unwrap();
    }

    println!("总元素: {}", global_data.lock().unwrap().len());
}
```

---

## 实战场景

### 场景1：线程安全的单例模式

```rust
use std::sync::{Mutex, OnceLock};

struct Config {
    database_url: String,
    max_connections: u32,
}

static CONFIG: OnceLock<Mutex<Config>> = OnceLock::new();

fn get_config() -> &'static Mutex<Config> {
    CONFIG.get_or_init(|| {
        println!("初始化配置...");
        Mutex::new(Config {
            database_url: String::from("postgres://localhost/db"),
            max_connections: 10,
        })
    })
}

fn main() {
    // 读取配置
    {
        let config = get_config().lock().unwrap();
        println!("数据库 URL: {}", config.database_url);
    }

    // 更新配置
    {
        let mut config = get_config().lock().unwrap();
        config.max_connections = 20;
    }

    // 再次读取
    {
        let config = get_config().lock().unwrap();
        println!("最大连接数: {}", config.max_connections);
    }
}
```

### 场景2：线程安全的缓存

```rust
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct CacheEntry<V> {
    value: V,
    expires_at: Instant,
}

struct Cache<K, V> {
    data: RwLock<HashMap<K, CacheEntry<V>>>,
    default_ttl: Duration,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    fn new(default_ttl: Duration) -> Self {
        Cache {
            data: RwLock::new(HashMap::new()),
            default_ttl,
        }
    }

    fn get(&self, key: &K) -> Option<V> {
        let data = self.data.read().unwrap();
        data.get(key).and_then(|entry| {
            if entry.expires_at > Instant::now() {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    fn set(&self, key: K, value: V) {
        self.set_with_ttl(key, value, self.default_ttl);
    }

    fn set_with_ttl(&self, key: K, value: V, ttl: Duration) {
        let entry = CacheEntry {
            value,
            expires_at: Instant::now() + ttl,
        };
        self.data.write().unwrap().insert(key, entry);
    }

    fn remove(&self, key: &K) -> Option<V> {
        self.data.write().unwrap().remove(key).map(|e| e.value)
    }

    fn cleanup_expired(&self) {
        let now = Instant::now();
        self.data.write().unwrap().retain(|_, entry| {
            entry.expires_at > now
        });
    }

    fn len(&self) -> usize {
        self.data.read().unwrap().len()
    }
}

fn main() {
    let cache = Arc::new(Cache::new(Duration::from_secs(60)));

    // 设置缓存
    cache.set("user:1", "Alice".to_string());
    cache.set("user:2", "Bob".to_string());

    // 读取缓存
    if let Some(user) = cache.get(&"user:1") {
        println!("找到用户: {}", user);
    }

    // 设置短期缓存
    cache.set_with_ttl("session:abc", "data".to_string(), Duration::from_secs(5));

    println!("缓存条目数: {}", cache.len());

    // 清理过期条目
    cache.cleanup_expired();
}
```

### 场景3：工作队列

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::collections::VecDeque;

struct WorkQueue<T> {
    queue: Mutex<VecDeque<T>>,
    condvar: Condvar,
    shutdown: Mutex<bool>,
}

impl<T> WorkQueue<T> {
    fn new() -> Self {
        WorkQueue {
            queue: Mutex::new(VecDeque::new()),
            condvar: Condvar::new(),
            shutdown: Mutex::new(false),
        }
    }

    fn push(&self, item: T) {
        let mut queue = self.queue.lock().unwrap();
        queue.push_back(item);
        self.condvar.notify_one();
    }

    fn pop(&self) -> Option<T> {
        let mut queue = self.queue.lock().unwrap();
        loop {
            if let Some(item) = queue.pop_front() {
                return Some(item);
            }

            if *self.shutdown.lock().unwrap() {
                return None;
            }

            queue = self.condvar.wait(queue).unwrap();
        }
    }

    fn try_pop(&self) -> Option<T> {
        self.queue.lock().unwrap().pop_front()
    }

    fn shutdown(&self) {
        *self.shutdown.lock().unwrap() = true;
        self.condvar.notify_all();
    }

    fn len(&self) -> usize {
        self.queue.lock().unwrap().len()
    }
}

fn main() {
    let queue = Arc::new(WorkQueue::new());

    // 生产者线程
    let producer_queue = Arc::clone(&queue);
    let producer = thread::spawn(move || {
        for i in 0..10 {
            producer_queue.push(format!("任务 {}", i));
            println!("生产者: 添加任务 {}", i);
            thread::sleep(std::time::Duration::from_millis(100));
        }
        producer_queue.shutdown();
        println!("生产者: 完成");
    });

    // 消费者线程
    let mut consumers = vec![];
    for id in 0..3 {
        let consumer_queue = Arc::clone(&queue);
        consumers.push(thread::spawn(move || {
            while let Some(task) = consumer_queue.pop() {
                println!("消费者 {}: 处理 {}", id, task);
                thread::sleep(std::time::Duration::from_millis(150));
            }
            println!("消费者 {}: 退出", id);
        }));
    }

    producer.join().unwrap();
    for c in consumers {
        c.join().unwrap();
    }
}
```

### 场景4：读写分离的状态管理

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

#[derive(Clone, Debug)]
struct AppState {
    counter: i64,
    last_update: String,
    data: Vec<String>,
}

struct StateManager {
    state: RwLock<AppState>,
}

impl StateManager {
    fn new() -> Self {
        StateManager {
            state: RwLock::new(AppState {
                counter: 0,
                last_update: String::new(),
                data: Vec::new(),
            }),
        }
    }

    fn get_snapshot(&self) -> AppState {
        self.state.read().unwrap().clone()
    }

    fn get_counter(&self) -> i64 {
        self.state.read().unwrap().counter
    }

    fn increment_counter(&self) -> i64 {
        let mut state = self.state.write().unwrap();
        state.counter += 1;
        state.last_update = format!("{:?}", std::time::SystemTime::now());
        state.counter
    }

    fn add_data(&self, item: String) {
        let mut state = self.state.write().unwrap();
        state.data.push(item);
        state.last_update = format!("{:?}", std::time::SystemTime::now());
    }

    fn get_data_count(&self) -> usize {
        self.state.read().unwrap().data.len()
    }
}

fn main() {
    let manager = Arc::new(StateManager::new());

    // 多个读取线程
    let readers: Vec<_> = (0..5)
        .map(|id| {
            let manager = Arc::clone(&manager);
            thread::spawn(move || {
                for _ in 0..10 {
                    let count = manager.get_counter();
                    println!("读取者 {}: 计数器 = {}", id, count);
                    thread::sleep(Duration::from_millis(50));
                }
            })
        })
        .collect();

    // 一个写入线程
    let writer_manager = Arc::clone(&manager);
    let writer = thread::spawn(move || {
        for i in 0..20 {
            let new_value = writer_manager.increment_counter();
            println!("写入者: 增加计数器到 {}", new_value);
            if i % 5 == 0 {
                writer_manager.add_data(format!("数据项 {}", i));
            }
            thread::sleep(Duration::from_millis(100));
        }
    });

    for r in readers {
        r.join().unwrap();
    }
    writer.join().unwrap();

    let final_state = manager.get_snapshot();
    println!("最终状态: {:?}", final_state);
}
```

---

## 面试要点

### Mutex 和 RwLock 的区别是什么？

**答案**：
- **Mutex** 是互斥锁，任何时候只允许一个线程访问数据，无论读还是写
- **RwLock** 是读写锁，允许多个读取者同时访问，但写入者需要独占访问
- Mutex 实现更简单，开销更低；RwLock 在读多写少场景下性能更好
- RwLock 有写入饥饿的风险，Mutex 没有

### 什么是锁中毒（Poisoning）？如何处理？

**答案**：
当持有锁的线程 panic 时，锁会被标记为"中毒"。这是为了提醒其他线程，被保护的数据可能处于不一致状态。

处理方式：
```rust
// 方式1：使用 unwrap_or_else 恢复
let guard = mutex.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

// 方式2：检查并处理
match mutex.lock() {
    Ok(guard) => { /* 正常处理 */ }
    Err(poisoned) => {
        // 根据业务需求决定是恢复还是传播错误
        let guard = poisoned.into_inner();
    }
}

// 方式3：清除中毒状态 (Rust 1.77+)
mutex.clear_poison();
```

### 如何避免死锁？

**答案**：
1. **按固定顺序获取锁**：所有线程以相同顺序获取多个锁
2. **使用 try_lock**：非阻塞尝试，失败时释放已持有的锁并重试
3. **最小化锁持有时间**：减少死锁窗口
4. **使用单一锁**：如果可能，用一个粗粒度锁代替多个细粒度锁
5. **使用层次锁**：建立锁的层次结构，只允许从高层向低层获取

### lock() 和 try_lock() 有什么区别？

**答案**：
- `lock()` 是阻塞的，如果锁被占用，当前线程会等待直到锁可用
- `try_lock()` 是非阻塞的，立即返回结果：成功获取锁或失败
- `try_lock()` 适用于需要避免阻塞或实现超时逻辑的场景

### 为什么需要 Arc<Mutex<T>> 而不是直接 Mutex<T>？

**答案**：
- `Mutex<T>` 没有实现 `Clone`，无法在多个线程间共享所有权
- `Arc<T>` (Atomic Reference Counted) 提供线程安全的引用计数共享
- `Arc<Mutex<T>>` 组合允许多个线程共享一个 Mutex 的所有权
- 每个线程获取 `Arc` 的克隆（只增加引用计数），然后通过 `lock()` 获取内部数据的访问权

### RwLock 的读写锁是如何工作的？

**答案**：
- 读锁（`read()`）是共享的，多个线程可以同时持有
- 写锁（`write()`）是独占的，持有时不允许其他任何锁
- 当有写锁请求时，新的读锁请求通常会被阻塞（防止写入饥饿）
- 具体行为取决于实现（标准库可能因平台而异）

### parking_lot 相比标准库有什么优势？

**答案**：
1. 不会中毒，API 更简洁
2. 内存占用更小（1 字节 vs 标准库的 40+ 字节）
3. 性能通常更好，特别是在高竞争场景
4. 提供更多功能：公平锁、可升级读锁、`ReentrantMutex` 等
5. 跨平台一致的行为

### 什么时候应该选择 Mutex 而不是 RwLock？

**答案**：
- 写操作频繁（读写比例接近或写更多）
- 锁持有时间很短
- 需要简单可靠的实现
- 内存使用敏感（Mutex 更小）
- 需要避免写入饥饿问题

---

## 延伸阅读

### 官方文档
- [std::sync::Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html)
- [std::sync::RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html)
- [The Rust Book - Shared-State Concurrency](https://doc.rust-lang.org/book/ch16-03-shared-state.html)

### 推荐 Crate
- [parking_lot](https://crates.io/crates/parking_lot) - 更快的同步原语
- [tokio::sync](https://docs.rs/tokio/latest/tokio/sync/) - 异步锁
- [crossbeam](https://crates.io/crates/crossbeam) - 高级并发工具

### 相关文章
- Rust Atomics and Locks by Mara Bos (O'Reilly)
- [Rust 并发编程实战](https://course.rs/advance/concurrency-with-threads/thread.html)
- [Lock-free Programming](https://www.infoq.com/presentations/Lock-Free-Algorithms/)

### 进阶主题
- 无锁数据结构
- 内存顺序（Memory Ordering）
- 原子操作与 CAS
- 异步锁与同步锁的选择
