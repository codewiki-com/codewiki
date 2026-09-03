---
title: 并发编程
description: Rust并发编程完全指南，线程、消息传递与共享状态
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - 并发
  - 线程
  - Send
  - Sync
status: imported
origin: old/src/content/docs/rust/concurrency.zh.md
divergence: 0.223
issues: []
legacy:
  category: Rust
  subcategory: 并发
  order: 6
  lastUpdated: 2026-01-07
---

并发编程是现代软件开发中不可或缺的一部分。Rust 通过其独特的所有权系统和类型系统，在编译时就能防止数据竞争，让并发编程变得更加安全可靠。本文将深入探讨 Rust 中的并发编程技术，包括线程、消息传递、共享状态以及强大的 Rayon 库。

---

## 线程基础

### 创建线程

Rust 标准库提供了 `std::thread` 模块来创建和管理线程。使用 `thread::spawn` 函数可以创建一个新线程：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 创建一个新线程
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("子线程: 数字 {}", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    // 主线程的工作
    for i in 1..5 {
        println!("主线程: 数字 {}", i);
        thread::sleep(Duration::from_millis(1));
    }

    // 等待子线程完成
    handle.join().unwrap();
}
```

### move 闭包与线程

当需要在线程中使用外部变量时，必须使用 `move` 关键字将所有权转移到闭包中：

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    // 使用 move 将 data 的所有权转移到线程中
    let handle = thread::spawn(move || {
        println!("数据: {:?}", data);
        // data 的所有权现在属于这个线程
    });

    // 此处无法再使用 data，因为所有权已转移
    // println!("{:?}", data); // 编译错误！

    handle.join().unwrap();
}
```

### 线程构建器

使用 `thread::Builder` 可以自定义线程的属性，如名称和栈大小：

```rust
use std::thread;

fn main() {
    let builder = thread::Builder::new()
        .name("工作线程".to_string())
        .stack_size(32 * 1024); // 32KB 栈空间

    let handle = builder.spawn(|| {
        println!("线程名: {:?}", thread::current().name());
    }).unwrap();

    handle.join().unwrap();
}
```

### 获取线程数量

```rust
use std::thread;

fn main() {
    // 获取可用的并行度（通常等于 CPU 核心数）
    let num_cpus = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1);

    println!("可用并行度: {}", num_cpus);
}
```

### 线程返回值

线程可以返回计算结果，通过 `join()` 获取：

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // 计算斐波那契数
        let mut a = 0u64;
        let mut b = 1u64;
        for _ in 0..50 {
            let temp = a.saturating_add(b);
            a = b;
            b = temp;
        }
        b // 返回结果
    });

    let result = handle.join().unwrap();
    println!("线程返回值: {}", result);
}
```

### 作用域线程 (Scoped Threads)

Rust 1.63 引入了作用域线程，允许线程借用栈上的数据：

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3, 4, 5];

    thread::scope(|s| {
        // 可以借用 data，无需 move
        s.spawn(|| {
            println!("读取数据: {:?}", data);
        });

        // 甚至可以可变借用（只要不冲突）
        s.spawn(|| {
            println!("数据长度: {}", data.len());
        });
    });
    // 作用域结束时，所有线程都已完成

    // 可以继续使用 data
    data.push(6);
    println!("最终数据: {:?}", data);
}
```

---

## 消息传递与通道

Rust 推崇"通过通信来共享内存，而不是通过共享内存来通信"的并发哲学。通道（Channel）是实现这一理念的核心工具。

### 基本通道使用

`std::sync::mpsc` 提供了多生产者单消费者（Multiple Producer, Single Consumer）通道：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建通道，返回发送端和接收端
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let message = String::from("你好，主线程！");
        tx.send(message).unwrap();
        // message 的所有权已转移，此处无法再使用
    });

    // 阻塞等待接收消息
    let received = rx.recv().unwrap();
    println!("收到消息: {}", received);
}
```

### 发送多条消息

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec![
            String::from("消息1"),
            String::from("消息2"),
            String::from("消息3"),
            String::from("消息4"),
        ];

        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(Duration::from_millis(500));
        }
    });

    // 将接收端作为迭代器使用
    for received in rx {
        println!("收到: {}", received);
    }
}
```

### 多生产者模式

通过克隆发送端，可以实现多个生产者向同一个消费者发送消息：

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆发送端给第一个生产者
    let tx1 = tx.clone();
    thread::spawn(move || {
        let messages = vec!["生产者1: A", "生产者1: B", "生产者1: C"];
        for msg in messages {
            tx1.send(msg.to_string()).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });

    // 原始发送端给第二个生产者
    thread::spawn(move || {
        let messages = vec!["生产者2: X", "生产者2: Y", "生产者2: Z"];
        for msg in messages {
            tx.send(msg.to_string()).unwrap();
            thread::sleep(Duration::from_millis(150));
        }
    });

    // 接收所有消息
    for received in rx {
        println!("{}", received);
    }
}
```

### 同步通道

`mpsc::sync_channel` 创建有界通道，当缓冲区满时发送操作会阻塞：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建容量为 2 的同步通道
    let (tx, rx) = mpsc::sync_channel(2);

    thread::spawn(move || {
        for i in 0..5 {
            println!("发送: {}", i);
            tx.send(i).unwrap();
            println!("已发送: {}", i);
        }
    });

    thread::sleep(std::time::Duration::from_secs(2));

    for received in rx {
        println!("收到: {}", received);
    }
}
```

### 非阻塞接收

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        thread::sleep(Duration::from_secs(1));
        tx.send("延迟消息").unwrap();
    });

    // 非阻塞尝试接收
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("收到: {}", msg);
                break;
            }
            Err(mpsc::TryRecvError::Empty) => {
                println!("还没有消息，继续等待...");
                thread::sleep(Duration::from_millis(200));
            }
            Err(mpsc::TryRecvError::Disconnected) => {
                println!("通道已关闭");
                break;
            }
        }
    }
}
```

### 带超时的接收

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        thread::sleep(Duration::from_secs(2));
        let _ = tx.send("消息");
    });

    // 带超时的接收
    match rx.recv_timeout(Duration::from_secs(1)) {
        Ok(msg) => println!("收到: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("超时！"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("断开连接"),
    }
}
```

---

## 共享状态并发

虽然消息传递是一种优雅的并发方式，但有时共享状态更加直接和高效。Rust 提供了多种同步原语来安全地共享状态。

### Mutex（互斥锁）

`Mutex<T>` 确保同一时间只有一个线程可以访问数据：

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        // 获取锁，返回 MutexGuard 智能指针
        let mut num = m.lock().unwrap();
        *num = 6;
        // MutexGuard 离开作用域时自动释放锁
    }

    println!("m = {:?}", m);
}
```

### Arc 与 Mutex 配合使用

在多线程环境中，需要使用 `Arc`（原子引用计数）来共享 `Mutex`：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc 允许多个线程共享所有权
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    // 等待所有线程完成
    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终结果: {}", *counter.lock().unwrap());
}
```

### RwLock（读写锁）

`RwLock<T>` 允许多个读取者或一个写入者：

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 创建多个读取线程
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // 获取读锁（多个线程可同时持有）
            let read_guard = data.read().unwrap();
            println!("读取线程 {}: {:?}", i, *read_guard);
        }));
    }

    // 创建一个写入线程
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // 获取写锁（独占访问）
            let mut write_guard = data.write().unwrap();
            write_guard.push(4);
            println!("写入线程: 添加了元素 4");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终数据: {:?}", *data.read().unwrap());
}
```

### Mutex vs RwLock 选择指南

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Instant;

fn benchmark_mutex(iterations: usize) {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    let start = Instant::now();

    // 主要是读操作
    for _ in 0..8 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            for _ in 0..iterations {
                let _ = data.lock().unwrap();
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Mutex 耗时: {:?}", start.elapsed());
}

fn benchmark_rwlock(iterations: usize) {
    let data = Arc::new(RwLock::new(0));
    let mut handles = vec![];

    let start = Instant::now();

    // 主要是读操作
    for _ in 0..8 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            for _ in 0..iterations {
                let _ = data.read().unwrap();
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("RwLock 耗时: {:?}", start.elapsed());
}

// 选择指南：
// - 读多写少：使用 RwLock
// - 写操作频繁：使用 Mutex（RwLock 的写锁开销更大）
// - 锁持有时间短：使用 Mutex
// - 需要简单可靠：使用 Mutex
```

### 避免死锁

死锁是并发编程中常见的问题。以下是一些避免死锁的策略：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let resource_a = Arc::new(Mutex::new(0));
    let resource_b = Arc::new(Mutex::new(0));

    // 错误示例：可能导致死锁
    // 线程1: 先锁 A，再锁 B
    // 线程2: 先锁 B，再锁 A

    // 正确做法：始终按相同顺序获取锁
    let (ra1, rb1) = (Arc::clone(&resource_a), Arc::clone(&resource_b));
    let handle1 = thread::spawn(move || {
        let _a = ra1.lock().unwrap();
        let _b = rb1.lock().unwrap();
        println!("线程1: 获取了两个资源");
    });

    let (ra2, rb2) = (Arc::clone(&resource_a), Arc::clone(&resource_b));
    let handle2 = thread::spawn(move || {
        let _a = ra2.lock().unwrap();  // 相同顺序！
        let _b = rb2.lock().unwrap();
        println!("线程2: 获取了两个资源");
    });

    handle1.join().unwrap();
    handle2.join().unwrap();
}
```

### 使用 try_lock 避免阻塞

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let lock = Arc::new(Mutex::new(0));

    let lock1 = Arc::clone(&lock);
    let handle = thread::spawn(move || {
        let _guard = lock1.lock().unwrap();
        thread::sleep(Duration::from_secs(2));
    });

    thread::sleep(Duration::from_millis(100));

    // 尝试获取锁，不阻塞
    match lock.try_lock() {
        Ok(guard) => println!("获取到锁: {}", *guard),
        Err(_) => println!("锁被占用，无法获取"),
    }

    handle.join().unwrap();
}
```

### Condvar（条件变量）

条件变量允许线程等待特定条件：

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    let pair_clone = Arc::clone(&pair);
    thread::spawn(move || {
        let (lock, cvar) = &*pair_clone;
        thread::sleep(std::time::Duration::from_secs(1));

        let mut started = lock.lock().unwrap();
        *started = true;
        println!("工作线程: 任务完成，通知等待线程");
        cvar.notify_one();
    });

    let (lock, cvar) = &*pair;
    let mut started = lock.lock().unwrap();

    // 等待条件满足
    while !*started {
        println!("主线程: 等待通知...");
        started = cvar.wait(started).unwrap();
    }

    println!("主线程: 收到通知，继续执行");
}
```

### Barrier（屏障）

`Barrier` 确保多个线程在某个点同步：

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];

    for i in 0..3 {
        let barrier = Arc::clone(&barrier);
        handles.push(thread::spawn(move || {
            println!("线程 {} 开始工作", i);
            thread::sleep(std::time::Duration::from_millis(100 * i as u64));
            println!("线程 {} 到达屏障", i);

            barrier.wait();  // 等待所有线程到达

            println!("线程 {} 继续执行", i);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Once（一次性初始化）

`Once` 确保代码只执行一次，常用于全局初始化：

```rust
use std::sync::Once;

static INIT: Once = Once::new();
static mut CONFIG: Option<String> = None;

fn get_config() -> &'static str {
    unsafe {
        INIT.call_once(|| {
            println!("初始化配置（只执行一次）");
            CONFIG = Some(String::from("配置数据"));
        });
        CONFIG.as_ref().unwrap()
    }
}

fn main() {
    // 多次调用，但初始化只执行一次
    println!("{}", get_config());
    println!("{}", get_config());
    println!("{}", get_config());
}
```

### 原子类型

原子类型提供无锁的线程安全操作：

```rust
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));
    let running = Arc::new(AtomicBool::new(true));
    let mut handles = vec![];

    // 计数器线程
    for _ in 0..4 {
        let counter = Arc::clone(&counter);
        let running = Arc::clone(&running);
        handles.push(thread::spawn(move || {
            while running.load(Ordering::Relaxed) {
                counter.fetch_add(1, Ordering::SeqCst);
                thread::sleep(std::time::Duration::from_millis(10));
            }
        }));
    }

    // 运行一段时间后停止
    thread::sleep(std::time::Duration::from_millis(100));
    running.store(false, Ordering::Relaxed);

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", counter.load(Ordering::SeqCst));
}
```

### 内存顺序 (Memory Ordering)

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let counter = AtomicUsize::new(0);

    // Relaxed: 最弱的顺序保证，性能最好
    // 仅保证原子性，不保证顺序
    counter.store(1, Ordering::Relaxed);

    // Acquire: 读操作
    // 确保后续操作不会重排到此之前
    let _val = counter.load(Ordering::Acquire);

    // Release: 写操作
    // 确保之前的操作不会重排到此之后
    counter.store(2, Ordering::Release);

    // AcqRel: 读-修改-写操作
    // 结合 Acquire 和 Release
    counter.fetch_add(1, Ordering::AcqRel);

    // SeqCst: 最强的顺序保证
    // 提供全局一致性顺序
    counter.store(3, Ordering::SeqCst);

    println!("最终值: {}", counter.load(Ordering::SeqCst));
}
```

---

## Send 和 Sync trait

Rust 通过 `Send` 和 `Sync` 这两个标记 trait 来保证线程安全。

### Send trait

`Send` 标记类型的所有权可以在线程间安全转移：

```rust
// 几乎所有 Rust 类型都实现了 Send
// 例外：Rc<T>、裸指针等

use std::thread;

fn main() {
    let data = vec![1, 2, 3];  // Vec<T> 实现了 Send

    // 可以安全地移动到另一个线程
    let handle = thread::spawn(move || {
        println!("{:?}", data);
    });

    handle.join().unwrap();
}
```

### Sync trait

`Sync` 标记类型可以安全地在多个线程间共享引用：

```rust
// 如果 T 实现了 Sync，则 &T 实现了 Send
// Mutex<T>、RwLock<T>、AtomicXxx 等都实现了 Sync

use std::sync::Arc;
use std::thread;

fn main() {
    // Arc<T> 要求 T: Send + Sync
    let data = Arc::new(vec![1, 2, 3]);

    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        // 安全地访问共享数据
        println!("{:?}", data_clone);
    });

    println!("{:?}", data);
    handle.join().unwrap();
}
```

### Send 和 Sync 的规则

```rust
// 核心规则：
// 1. 如果 T: Send，则 &mut T: Send
// 2. 如果 T: Sync，则 &T: Send
// 3. 如果 T: Send + Sync，则 Arc<T>: Send + Sync

// 不实现 Send 的类型：
// - Rc<T>: 引用计数不是原子的
// - *const T, *mut T: 裸指针
// - MutexGuard: 必须在同一线程释放

// 不实现 Sync 的类型：
// - Cell<T>, RefCell<T>: 内部可变性不是线程安全的
// - Rc<T>: 同上
// - UnsafeCell<T>: 底层构建块，不提供同步
```

### 自定义类型的线程安全

```rust
use std::sync::Arc;
use std::thread;

// 如果所有字段都是 Send + Sync，
// 则结构体自动实现 Send + Sync
#[derive(Debug)]
struct ThreadSafeData {
    id: i32,
    name: String,
}

// 包含非线程安全字段的类型
struct NotThreadSafe {
    data: std::rc::Rc<i32>, // Rc 不是 Send
}

fn main() {
    let safe_data = Arc::new(ThreadSafeData {
        id: 1,
        name: String::from("测试"),
    });

    let data_clone = Arc::clone(&safe_data);
    let handle = thread::spawn(move || {
        println!("{:?}", data_clone);
    });

    handle.join().unwrap();

    // 下面的代码无法编译：
    // let not_safe = Arc::new(NotThreadSafe { data: Rc::new(1) });
    // thread::spawn(move || { ... }); // 错误！NotThreadSafe 不是 Send
}
```

### 手动实现（谨慎使用）

```rust
// 通常不需要手动实现这些 trait
// 如果确实需要，必须使用 unsafe

struct MyType {
    ptr: *mut i32,
}

// 警告：这是不安全的！
// 只有当你能保证安全性时才这样做
unsafe impl Send for MyType {}
unsafe impl Sync for MyType {}

// 实际上，应该使用安全的抽象
// 如 Mutex、Arc 等来处理共享数据
```

---

## Rayon 并行计算库

Rayon 是 Rust 生态中最流行的数据并行库，它让并行编程变得极其简单。Rayon 使用工作窃取算法来高效地分配任务。

### 添加依赖

```toml
# Cargo.toml
[dependencies]
rayon = "1.10"
```

### 并行迭代器

Rayon 的核心是并行迭代器，只需将 `iter()` 替换为 `par_iter()` 即可实现并行：

```rust
use rayon::prelude::*;

fn main() {
    let numbers: Vec<i32> = (1..=100).collect();

    // 串行计算平方和
    let sum_serial: i32 = numbers.iter()
        .map(|&x| x * x)
        .sum();

    // 并行计算 - 只需改为 par_iter()！
    let sum_parallel: i32 = numbers.par_iter()
        .map(|&x| x * x)
        .sum();

    println!("串行结果: {}", sum_serial);
    println!("并行结果: {}", sum_parallel);
}
```

### 常用并行迭代器方法

```rust
use rayon::prelude::*;

fn main() {
    let data: Vec<i32> = (1..=1000).collect();

    // par_iter(): 并行不可变迭代
    let sum: i32 = data.par_iter().sum();
    println!("求和: {}", sum);

    // par_iter_mut(): 并行可变迭代
    let mut mutable_data: Vec<i32> = (1..=100).collect();
    mutable_data.par_iter_mut().for_each(|x| *x *= 2);
    println!("翻倍后: {:?}", &mutable_data[..5]);

    // into_par_iter(): 消费集合的并行迭代
    let squared: Vec<i32> = (1..=10).into_par_iter()
        .map(|x| x * x)
        .collect();
    println!("平方: {:?}", squared);

    // par_chunks(): 并行处理分块
    let chunked_data: Vec<i32> = (1..=100).collect();
    let chunk_sums: Vec<i32> = chunked_data
        .par_chunks(10)
        .map(|chunk| chunk.iter().sum())
        .collect();
    println!("块和: {:?}", chunk_sums);

    // 并行过滤
    let evens: Vec<i32> = (1..=100).into_par_iter()
        .filter(|&x| x % 2 == 0)
        .collect();
    println!("偶数数量: {}", evens.len());
}
```

### 并行排序

```rust
use rayon::prelude::*;

fn main() {
    // 并行排序
    let mut data: Vec<i32> = (1..=10000).rev().collect();
    data.par_sort();
    assert!(data.windows(2).all(|w| w[0] <= w[1]));
    println!("排序完成（升序）");

    // 并行不稳定排序（更快）
    let mut data2: Vec<i32> = (1..=10000).rev().collect();
    data2.par_sort_unstable();

    // 自定义比较函数
    let mut data3: Vec<i32> = (1..=10000).collect();
    data3.par_sort_by(|a, b| b.cmp(a));  // 降序
    println!("前5个（降序）: {:?}", &data3[..5]);

    // 按键排序
    let mut strings = vec!["banana", "apple", "cherry", "date"];
    strings.par_sort_by_key(|s| s.len());
    println!("按长度排序: {:?}", strings);
}
```

### join 和 scope

`join` 用于并行执行两个任务，`scope` 用于更复杂的并行结构：

```rust
use rayon::prelude::*;

fn main() {
    // join: 并行执行两个任务
    let (result_a, result_b) = rayon::join(
        || {
            // 任务 A: 计算 1 到 1000 的和
            (1..=1000).sum::<i64>()
        },
        || {
            // 任务 B: 计算 1 到 1000 的平方和
            (1..=1000).map(|x: i64| x * x).sum::<i64>()
        }
    );

    println!("任务A结果（求和）: {}", result_a);
    println!("任务B结果（平方和）: {}", result_b);

    // scope: 创建并行作用域，可以借用外部数据
    let mut results = vec![0; 4];
    rayon::scope(|s| {
        for (i, result) in results.iter_mut().enumerate() {
            s.spawn(move |_| {
                *result = (i + 1) * 10;
                println!("任务 {} 完成", i);
            });
        }
    });
    // 所有子任务完成后才会继续
    println!("结果: {:?}", results);
}
```

### 自定义线程池

```rust
use rayon::prelude::*;
use rayon::ThreadPoolBuilder;

fn main() {
    // 创建自定义线程池
    let pool = ThreadPoolBuilder::new()
        .num_threads(4)
        .thread_name(|i| format!("rayon-worker-{}", i))
        .build()
        .unwrap();

    // 在自定义线程池中执行
    let result = pool.install(|| {
        let data: Vec<i32> = (1..=1000).collect();
        data.par_iter()
            .map(|&x| x * x)
            .sum::<i32>()
    });

    println!("在自定义线程池中计算结果: {}", result);

    // 全局配置（必须在使用 Rayon 之前调用）
    // ThreadPoolBuilder::new()
    //     .num_threads(8)
    //     .build_global()
    //     .unwrap();
}
```

### 并行字符串处理

```rust
use rayon::prelude::*;

fn main() {
    let texts = vec![
        "Hello World",
        "Rust Programming",
        "Parallel Computing",
        "Rayon Library",
        "Data Parallelism",
    ];

    // 并行转换为大写
    let uppercase: Vec<String> = texts.par_iter()
        .map(|s| s.to_uppercase())
        .collect();
    println!("大写: {:?}", uppercase);

    // 并行过滤
    let long_texts: Vec<&str> = texts.par_iter()
        .filter(|s| s.len() > 12)
        .copied()
        .collect();
    println!("长文本: {:?}", long_texts);

    // 并行查找
    let found = texts.par_iter()
        .find_any(|s| s.contains("Rust"));
    println!("包含 Rust: {:?}", found);

    // 并行统计
    let total_chars: usize = texts.par_iter()
        .map(|s| s.len())
        .sum();
    println!("总字符数: {}", total_chars);
}
```

### 并行链式操作

```rust
use rayon::prelude::*;

fn main() {
    let data: Vec<i32> = (1..=1000).collect();

    // 复杂的链式并行操作
    let result: Vec<i32> = data.par_iter()
        .filter(|&&x| x % 3 == 0)    // 过滤 3 的倍数
        .map(|&x| x * 2)              // 翻倍
        .filter(|&x| x > 100)         // 过滤大于 100
        .collect();

    println!("结果数量: {}", result.len());
    println!("前 10 个: {:?}", &result[..10.min(result.len())]);

    // 并行折叠
    let sum = data.par_iter()
        .fold(|| 0, |acc, &x| acc + x)
        .sum::<i32>();
    println!("折叠求和: {}", sum);

    // 并行归约
    let max = data.par_iter()
        .reduce(|| &0, |a, b| if a > b { a } else { b });
    println!("最大值: {}", max);
}
```

---

## 实战案例

### 案例1：并发 Web 爬虫

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::HashSet;
use std::time::Duration;

struct Crawler {
    visited: Arc<Mutex<HashSet<String>>>,
    results: Arc<Mutex<Vec<String>>>,
}

impl Crawler {
    fn new() -> Self {
        Crawler {
            visited: Arc::new(Mutex::new(HashSet::new())),
            results: Arc::new(Mutex::new(Vec::new())),
        }
    }

    fn crawl(&self, urls: Vec<String>) {
        let mut handles = vec![];

        for url in urls {
            let visited = Arc::clone(&self.visited);
            let results = Arc::clone(&self.results);

            let handle = thread::spawn(move || {
                // 检查是否已访问
                {
                    let mut visited_guard = visited.lock().unwrap();
                    if visited_guard.contains(&url) {
                        return;
                    }
                    visited_guard.insert(url.clone());
                }

                // 模拟抓取
                println!("正在抓取: {}", url);
                thread::sleep(Duration::from_millis(100));

                // 存储结果
                let mut results_guard = results.lock().unwrap();
                results_guard.push(format!("抓取完成: {}", url));
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }
    }

    fn get_results(&self) -> Vec<String> {
        self.results.lock().unwrap().clone()
    }
}

fn main() {
    let crawler = Crawler::new();

    let urls: Vec<String> = (1..=10)
        .map(|i| format!("https://example.com/page/{}", i))
        .collect();

    crawler.crawl(urls);

    println!("\n=== 抓取结果 ===");
    for result in crawler.get_results() {
        println!("{}", result);
    }
}
```

### 案例2：生产者-消费者模式

```rust
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;

#[derive(Debug)]
struct Task {
    id: usize,
    data: String,
}

fn main() {
    let (tx, rx) = mpsc::channel::<Task>();
    let rx = Arc::new(Mutex::new(rx));

    let num_producers = 3;
    let num_consumers = 2;

    // 创建生产者
    let mut producer_handles = vec![];
    for producer_id in 0..num_producers {
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            for i in 0..5 {
                let task = Task {
                    id: producer_id * 100 + i,
                    data: format!("来自生产者{}的数据", producer_id),
                };
                println!("[生产者{}] 发送任务 {}", producer_id, task.id);
                tx.send(task).unwrap();
                thread::sleep(Duration::from_millis(50));
            }
            println!("[生产者{}] 完成", producer_id);
        });
        producer_handles.push(handle);
    }

    // 关闭原始发送端
    drop(tx);

    // 创建消费者
    let mut consumer_handles = vec![];
    for consumer_id in 0..num_consumers {
        let rx = Arc::clone(&rx);
        let handle = thread::spawn(move || {
            loop {
                let task = {
                    let rx_guard = rx.lock().unwrap();
                    rx_guard.try_recv()
                };

                match task {
                    Ok(task) => {
                        println!("[消费者{}] 处理任务 {} - {}",
                                 consumer_id, task.id, task.data);
                        thread::sleep(Duration::from_millis(100));
                    }
                    Err(mpsc::TryRecvError::Empty) => {
                        thread::sleep(Duration::from_millis(10));
                    }
                    Err(mpsc::TryRecvError::Disconnected) => {
                        println!("[消费者{}] 通道关闭，退出", consumer_id);
                        break;
                    }
                }
            }
        });
        consumer_handles.push(handle);
    }

    // 等待所有线程完成
    for handle in producer_handles {
        handle.join().unwrap();
    }
    for handle in consumer_handles {
        handle.join().unwrap();
    }

    println!("\n所有任务处理完成！");
}
```

### 案例3：使用 Rayon 进行图像处理

```rust
use rayon::prelude::*;

// 模拟像素结构
#[derive(Clone, Debug)]
struct Pixel {
    r: u8,
    g: u8,
    b: u8,
}

impl Pixel {
    fn grayscale(&self) -> Pixel {
        let gray = ((self.r as f32 * 0.299) +
                    (self.g as f32 * 0.587) +
                    (self.b as f32 * 0.114)) as u8;
        Pixel { r: gray, g: gray, b: gray }
    }

    fn invert(&self) -> Pixel {
        Pixel {
            r: 255 - self.r,
            g: 255 - self.g,
            b: 255 - self.b,
        }
    }

    fn brightness(&self, factor: f32) -> Pixel {
        Pixel {
            r: ((self.r as f32 * factor).min(255.0)) as u8,
            g: ((self.g as f32 * factor).min(255.0)) as u8,
            b: ((self.b as f32 * factor).min(255.0)) as u8,
        }
    }
}

struct Image {
    width: usize,
    height: usize,
    pixels: Vec<Pixel>,
}

impl Image {
    fn new(width: usize, height: usize) -> Self {
        let pixels: Vec<Pixel> = (0..width * height)
            .map(|i| Pixel {
                r: (i % 256) as u8,
                g: ((i * 2) % 256) as u8,
                b: ((i * 3) % 256) as u8,
            })
            .collect();
        Image { width, height, pixels }
    }

    // 并行转换为灰度图
    fn to_grayscale_parallel(&self) -> Image {
        let pixels: Vec<Pixel> = self.pixels
            .par_iter()
            .map(|p| p.grayscale())
            .collect();
        Image {
            width: self.width,
            height: self.height,
            pixels,
        }
    }

    // 并行反色处理
    fn invert_parallel(&self) -> Image {
        let pixels: Vec<Pixel> = self.pixels
            .par_iter()
            .map(|p| p.invert())
            .collect();
        Image {
            width: self.width,
            height: self.height,
            pixels,
        }
    }

    // 并行亮度调整
    fn adjust_brightness_parallel(&self, factor: f32) -> Image {
        let pixels: Vec<Pixel> = self.pixels
            .par_iter()
            .map(|p| p.brightness(factor))
            .collect();
        Image {
            width: self.width,
            height: self.height,
            pixels,
        }
    }

    // 并行处理图像块（按行）
    fn process_rows_parallel(&mut self) {
        let width = self.width;
        self.pixels
            .par_chunks_mut(width)
            .for_each(|row| {
                for pixel in row.iter_mut() {
                    *pixel = pixel.grayscale();
                }
            });
    }
}

fn main() {
    let image = Image::new(1920, 1080);
    println!("原始图像: {}x{} ({} 像素)",
             image.width, image.height, image.width * image.height);

    // 并行处理性能测试
    let start = std::time::Instant::now();
    let _grayscale = image.to_grayscale_parallel();
    println!("灰度转换耗时: {:?}", start.elapsed());

    let start = std::time::Instant::now();
    let _inverted = image.invert_parallel();
    println!("反色处理耗时: {:?}", start.elapsed());

    let start = std::time::Instant::now();
    let _brightened = image.adjust_brightness_parallel(1.2);
    println!("亮度调整耗时: {:?}", start.elapsed());

    println!("图像处理完成！");
}
```

### 案例4：线程池实现

```rust
use std::sync::{Arc, Mutex, mpsc};
use std::thread;

type Job = Box<dyn FnOnce() + Send + 'static>;

enum Message {
    NewJob(Job),
    Terminate,
}

struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Message>>,
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl ThreadPool {
    fn new(size: usize) -> ThreadPool {
        assert!(size > 0, "线程池大小必须大于 0");

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender
            .as_ref()
            .unwrap()
            .send(Message::NewJob(job))
            .unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        println!("发送终止信号给所有工作线程...");

        for _ in &self.workers {
            self.sender
                .as_ref()
                .unwrap()
                .send(Message::Terminate)
                .unwrap();
        }

        println!("关闭所有工作线程...");

        for worker in &mut self.workers {
            println!("关闭工作线程 {}", worker.id);
            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Message>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            let message = receiver.lock().unwrap().recv().unwrap();

            match message {
                Message::NewJob(job) => {
                    println!("工作线程 {} 收到任务", id);
                    job();
                }
                Message::Terminate => {
                    println!("工作线程 {} 收到终止信号", id);
                    break;
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}

fn main() {
    let pool = ThreadPool::new(4);

    for i in 0..8 {
        pool.execute(move || {
            println!("执行任务 {}", i);
            thread::sleep(std::time::Duration::from_millis(100));
            println!("任务 {} 完成", i);
        });
    }

    // 等待任务执行
    thread::sleep(std::time::Duration::from_secs(1));
    println!("\n所有任务已提交，线程池即将关闭...");

    // ThreadPool 被 drop 时会优雅地关闭所有工作线程
}
```

### 案例5：并行文件处理

```rust
use rayon::prelude::*;
use std::collections::HashMap;

fn main() {
    // 模拟文件内容
    let files: Vec<(&str, &str)> = vec![
        ("file1.txt", "hello world rust programming"),
        ("file2.txt", "rust is fast and safe"),
        ("file3.txt", "concurrent programming in rust"),
        ("file4.txt", "hello rust hello world"),
        ("file5.txt", "safe concurrent rust code"),
    ];

    // 并行统计每个文件的词频
    let word_counts: Vec<(&str, HashMap<&str, usize>)> = files
        .par_iter()
        .map(|(name, content)| {
            let mut counts = HashMap::new();
            for word in content.split_whitespace() {
                *counts.entry(word).or_insert(0) += 1;
            }
            (*name, counts)
        })
        .collect();

    // 打印结果
    for (name, counts) in &word_counts {
        println!("\n{} 词频:", name);
        for (word, count) in counts {
            println!("  {}: {}", word, count);
        }
    }

    // 并行合并所有文件的词频
    let total_counts: HashMap<&str, usize> = files
        .par_iter()
        .flat_map(|(_, content)| content.split_whitespace())
        .fold(HashMap::new, |mut acc, word| {
            *acc.entry(word).or_insert(0) += 1;
            acc
        })
        .reduce(HashMap::new, |mut a, b| {
            for (word, count) in b {
                *a.entry(word).or_insert(0) += count;
            }
            a
        });

    println!("\n=== 总词频统计 ===");
    let mut sorted: Vec<_> = total_counts.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));
    for (word, count) in sorted {
        println!("{}: {}", word, count);
    }
}
```

---

## 最佳实践

### 选择合适的并发模型

```rust
// 场景选择指南：

// 独立任务，无共享状态 -> 消息传递（mpsc）
// 简单数据共享 -> Arc<T>（不可变）
// 需要修改共享数据 -> Arc<Mutex<T>> 或 Arc<RwLock<T>>
// 数据并行处理 -> Rayon
// 简单计数器/标志 -> 原子类型
// 大量 I/O 操作 -> 考虑异步编程（async/await）
```

### 最小化锁的持有时间

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

// 好的做法：只在必要时持有锁
fn good_practice(data: Arc<Mutex<Vec<i32>>>) {
    let item = {
        let guard = data.lock().unwrap();
        guard.get(0).copied()
    };  // 锁在这里释放

    // 在锁外进行耗时操作
    if let Some(value) = item {
        println!("处理: {}", value);
        thread::sleep(Duration::from_secs(1));
    }
}

// 不好的做法：在持有锁时进行耗时操作
fn bad_practice(data: Arc<Mutex<Vec<i32>>>) {
    let guard = data.lock().unwrap();
    if let Some(&value) = guard.get(0) {
        println!("处理: {}", value);
        thread::sleep(Duration::from_secs(1)); // 其他线程必须等待！
    }
}
```

### 避免不必要的克隆

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    // 好：使用 Arc 共享不可变数据
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let handles: Vec<_> = (0..4).map(|i| {
        let data = Arc::clone(&data);  // 只增加引用计数，O(1)
        thread::spawn(move || {
            println!("线程 {}: {:?}", i, data);
        })
    }).collect();

    for handle in handles {
        handle.join().unwrap();
    }

    // 不好：每次都克隆整个数据
    // let handles: Vec<_> = (0..4).map(|i| {
    //     let data = data.clone();  // 克隆整个 Vec，O(n)
    //     thread::spawn(move || { ... })
    // }).collect();
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

fn main() {
    // parking_lot 的 Mutex 不返回 Result
    let data = Arc::new(Mutex::new(0));

    let mut num = data.lock();  // 直接获取 MutexGuard
    *num += 1;
    drop(num);

    // parking_lot 的优势：
    // - 更小的内存占用
    // - 更快的锁获取
    // - 不会中毒（poison）
    // - 支持公平锁

    let rw_data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let read_guard = rw_data.read();
    println!("{:?}", *read_guard);
}
```

### 原子操作用于简单计数

```rust
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    // 对于简单的计数器，原子类型比 Mutex 更高效
    let counter = Arc::new(AtomicUsize::new(0));
    let running = Arc::new(AtomicBool::new(true));
    let mut handles = vec![];

    for _ in 0..4 {
        let counter = Arc::clone(&counter);
        let running = Arc::clone(&running);
        handles.push(thread::spawn(move || {
            while running.load(Ordering::Relaxed) {
                counter.fetch_add(1, Ordering::Relaxed);
                thread::sleep(std::time::Duration::from_millis(1));
            }
        }));
    }

    thread::sleep(std::time::Duration::from_millis(100));
    running.store(false, Ordering::Relaxed);

    for handle in handles {
        handle.join().unwrap();
    }

    println!("计数: {}", counter.load(Ordering::Relaxed));
}
```

### 错误处理与锁中毒

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    let data_clone = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let guard = data_clone.lock();

        match guard {
            Ok(mut data) => {
                data.push(4);
                Ok(())
            }
            Err(poisoned) => {
                // 锁被污染（之前持有锁的线程 panic 了）
                // 可以选择恢复数据
                eprintln!("锁被污染，尝试恢复...");
                let mut data = poisoned.into_inner();
                data.clear();  // 重置状态
                Err("锁被污染，已重置")
            }
        }
    });

    match handle.join() {
        Ok(result) => println!("线程完成: {:?}", result),
        Err(_) => println!("线程 panic"),
    }
}
```

### 避免常见陷阱

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // 陷阱1：忘记释放锁
    let data = Arc::new(Mutex::new(0));
    {
        let _guard = data.lock().unwrap();
        // 忘记释放锁会导致其他线程阻塞
        // 使用作用域或显式 drop
    } // 自动释放

    // 陷阱2：在异步代码中持有锁跨 await
    // 应该使用 tokio::sync::Mutex 代替

    // 陷阱3：过度使用 unwrap
    let guard = match data.lock() {
        Ok(g) => g,
        Err(poisoned) => {
            eprintln!("警告：锁被污染");
            poisoned.into_inner()
        }
    };
    drop(guard);

    // 陷阱4：Arc 克隆位置错误
    let data = Arc::new(Mutex::new(0));
    for _ in 0..4 {
        let data = Arc::clone(&data); // 正确：在循环内克隆
        thread::spawn(move || {
            let _guard = data.lock().unwrap();
        });
    }

    thread::sleep(std::time::Duration::from_millis(100));
}
```

---

## 总结

Rust 的并发编程模型通过以下特性确保了安全性：

1. **所有权系统**：防止数据竞争，在编译时检测问题
2. **Send/Sync trait**：标记类型的线程安全性
3. **强类型通道**：类型安全的消息传递
4. **智能指针**：Arc、Mutex、RwLock 等提供线程安全的共享

### 并发策略选择指南

| 场景 | 推荐方案 |
|------|----------|
| 独立任务通信 | `mpsc` 通道 |
| 共享只读数据 | `Arc<T>` |
| 共享可变数据（写多） | `Arc<Mutex<T>>` |
| 共享可变数据（读多写少） | `Arc<RwLock<T>>` |
| 数据并行处理 | Rayon |
| 简单计数器/标志 | `AtomicUsize` / `AtomicBool` |
| 高性能场景 | `parking_lot` crate |
| 一次性初始化 | `Once` 或 `OnceLock` |

### 性能考虑

- **Rayon** 适合 CPU 密集型的数据并行任务
- **原子类型** 适合简单的无锁操作
- **Mutex** 适合锁持有时间短的场景
- **RwLock** 适合读多写少的场景
- **通道** 适合解耦生产者和消费者

### 核心理念

> "如果代码能编译通过，那么它就不会有数据竞争。" - Rust 并发安全保证

掌握这些并发工具，你就能编写出既安全又高效的并发 Rust 程序。Rust 的编译器是你最好的朋友，它会在编译时捕获大多数并发错误，让你专注于业务逻辑而不是调试难以复现的并发 bug。
