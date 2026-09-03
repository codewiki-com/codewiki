---
title: Rust 消息传递与通道
description: 深入理解 Rust 消息传递机制，mpsc 通道、Sender/Receiver、多生产者模式、crossbeam 高级通道
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - Channel
  - mpsc
  - Sender
  - Receiver
  - crossbeam
  - 并发
  - 消息传递
status: imported
origin: old/src/content/docs/rust/channels.zh.md
divergence: 0.212
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 并发
  order: 7
  lastUpdated: 2026-01-07
---

Rust 推崇"通过通信来共享内存，而不是通过共享内存来通信"的并发哲学。通道（Channel）是实现这一理念的核心工具，它提供了一种类型安全、所有权友好的线程间通信方式。本文将深入探讨 Rust 标准库的 `mpsc` 通道以及功能更强大的 `crossbeam` 通道。

## 概念解释

### 什么是消息传递？

消息传递是一种并发编程模型，线程或任务之间通过发送和接收消息来协调工作，而不是直接共享内存。这种模型源自 CSP（Communicating Sequential Processes）和 Actor 模型的思想。

在 Rust 中，通道是消息传递的主要载体：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建一个通道，获得发送端和接收端
    let (sender, receiver) = mpsc::channel();

    // 在新线程中发送消息
    thread::spawn(move || {
        sender.send("Hello from another thread!").unwrap();
    });

    // 在主线程中接收消息
    let message = receiver.recv().unwrap();
    println!("收到: {}", message);
}
```

### 为什么使用消息传递？

1. **避免数据竞争**：消息的所有权在发送时转移，天然避免了并发访问问题
2. **解耦合**：发送方和接收方只通过消息交互，降低了模块间的依赖
3. **易于推理**：代码逻辑更清晰，数据流动方向明确
4. **与所有权系统契合**：Rust 的所有权机制与消息传递完美结合

### mpsc 的含义

`mpsc` 是 **Multiple Producer, Single Consumer**（多生产者，单消费者）的缩写。这意味着：

- 可以有多个发送端（`Sender`）向同一个通道发送消息
- 只有一个接收端（`Receiver`）从通道接收消息

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel::<i32>();

    // tx: Sender<i32> - 可以克隆，支持多个生产者
    // rx: Receiver<i32> - 不可克隆，只有一个消费者

    let tx2 = tx.clone();  // 创建第二个发送端
    // let rx2 = rx.clone(); // 编译错误！Receiver 不能克隆
}
```

---

## 核心原理

### 通道的内部结构

标准库的 `mpsc` 通道内部使用了两种不同的实现：

1. **无界通道（unbounded channel）**：基于无锁队列实现，发送操作永不阻塞
2. **有界通道（bounded channel）**：使用 `sync_channel` 创建，当缓冲区满时发送会阻塞

```rust
use std::sync::mpsc;

fn main() {
    // 无界通道 - 内部使用无锁队列
    let (tx_unbounded, rx_unbounded) = mpsc::channel::<i32>();

    // 有界通道 - 容量为 5
    let (tx_bounded, rx_bounded) = mpsc::sync_channel::<i32>(5);
}
```

### Sender 的工作原理

`Sender<T>` 是通道的发送端，具有以下特性：

- 实现了 `Clone` trait，可以创建多个发送端
- 实现了 `Send` trait，可以安全地跨线程传递
- 发送时转移值的所有权

```rust
use std::sync::mpsc::{self, Sender};
use std::thread;

fn producer(tx: Sender<String>, id: usize) {
    for i in 0..3 {
        let msg = format!("生产者 {} 的消息 {}", id, i);
        tx.send(msg).unwrap();
        // msg 的所有权已转移，此处无法使用
    }
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆发送端给多个生产者
    for id in 0..3 {
        let tx_clone = tx.clone();
        thread::spawn(move || producer(tx_clone, id));
    }

    // 丢弃原始发送端，确保通道能正确关闭
    drop(tx);

    // 接收所有消息
    for msg in rx {
        println!("{}", msg);
    }
}
```

### Receiver 的工作原理

`Receiver<T>` 是通道的接收端：

- 不实现 `Clone`，确保单消费者语义
- 实现了 `IntoIterator`，可以用 for 循环遍历
- 当所有发送端都被丢弃时，迭代自动结束

```rust
use std::sync::mpsc::{self, Receiver};

fn consumer(rx: Receiver<i32>) {
    // 方式1：阻塞接收
    match rx.recv() {
        Ok(val) => println!("收到: {}", val),
        Err(_) => println!("通道已关闭"),
    }

    // 方式2：非阻塞尝试接收
    match rx.try_recv() {
        Ok(val) => println!("收到: {}", val),
        Err(mpsc::TryRecvError::Empty) => println!("暂无消息"),
        Err(mpsc::TryRecvError::Disconnected) => println!("通道已关闭"),
    }

    // 方式3：迭代器模式
    for val in rx {
        println!("收到: {}", val);
    }
}
```

### 所有权转移语义

消息传递的核心是所有权转移。当调用 `send()` 时，值的所有权从发送方转移到通道内部，然后在 `recv()` 时转移给接收方：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    let data = vec![1, 2, 3, 4, 5];

    thread::spawn(move || {
        tx.send(data).unwrap();
        // 此处无法使用 data，所有权已转移
        // println!("{:?}", data); // 编译错误！
    });

    let received = rx.recv().unwrap();
    println!("收到: {:?}", received);  // [1, 2, 3, 4, 5]
}
```

---

## 核心要点

### 通道类型

| 通道类型 | 创建方式 | 特点 |
|---------|---------|------|
| 异步通道 | `mpsc::channel()` | 无界，发送不阻塞 |
| 同步通道 | `mpsc::sync_channel(n)` | 有界，缓冲区满时阻塞 |

### Sender 方法

| 方法 | 描述 |
|-----|------|
| `send(value)` | 发送消息，转移所有权 |
| `clone()` | 克隆发送端，创建新的生产者 |

### Receiver 方法

| 方法 | 描述 |
|-----|------|
| `recv()` | 阻塞等待消息 |
| `try_recv()` | 非阻塞尝试接收 |
| `recv_timeout(duration)` | 带超时的阻塞接收 |
| `iter()` | 获取阻塞迭代器 |
| `try_iter()` | 获取非阻塞迭代器 |

### 错误类型

| 错误 | 含义 |
|-----|------|
| `SendError<T>` | 接收端已被丢弃，无法发送 |
| `RecvError` | 所有发送端已被丢弃，通道关闭 |
| `TryRecvError::Empty` | 通道为空（非阻塞接收） |
| `TryRecvError::Disconnected` | 通道已断开 |
| `RecvTimeoutError::Timeout` | 超时 |
| `RecvTimeoutError::Disconnected` | 通道已断开 |

---

## 代码示例

### 基本通道使用

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建异步通道
    let (tx, rx) = mpsc::channel();

    // 生产者线程
    thread::spawn(move || {
        let messages = vec!["消息1", "消息2", "消息3"];
        for msg in messages {
            println!("发送: {}", msg);
            tx.send(msg).unwrap();
        }
        println!("生产者完成");
    });

    // 消费者（主线程）
    for received in rx {
        println!("收到: {}", received);
    }
    println!("接收完成");
}
```

### 多生产者模式

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();
    let mut handles = vec![];

    // 创建 4 个生产者
    for id in 0..4 {
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            for i in 0..3 {
                let msg = format!("生产者{}: 消息{}", id, i);
                tx.send(msg).unwrap();
                thread::sleep(Duration::from_millis(10 * id as u64));
            }
        });
        handles.push(handle);
    }

    // 丢弃原始发送端
    drop(tx);

    // 接收所有消息
    let mut count = 0;
    for msg in rx {
        count += 1;
        println!("[{}] {}", count, msg);
    }

    // 等待所有生产者完成
    for handle in handles {
        handle.join().unwrap();
    }

    println!("总共收到 {} 条消息", count);
}
```

### 同步通道（有界通道）

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    // 创建容量为 2 的同步通道
    let (tx, rx) = mpsc::sync_channel(2);

    // 生产者线程
    let producer = thread::spawn(move || {
        for i in 0..5 {
            println!("[生产者] 尝试发送 {}...", i);
            tx.send(i).unwrap();
            println!("[生产者] 已发送 {}", i);
        }
    });

    // 消费者延迟启动，观察阻塞效果
    thread::sleep(Duration::from_secs(1));

    println!("\n[消费者] 开始接收...\n");
    for val in rx {
        println!("[消费者] 收到: {}", val);
        thread::sleep(Duration::from_millis(200));
    }

    producer.join().unwrap();
}
```

### 非阻塞接收

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 延迟发送消息
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(2));
        tx.send("延迟消息").unwrap();
    });

    // 轮询模式
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("收到: {}", msg);
                break;
            }
            Err(mpsc::TryRecvError::Empty) => {
                println!("等待中...");
                thread::sleep(Duration::from_millis(500));
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
    let (tx, rx) = mpsc::channel::<&str>();

    // 场景1：消息在超时前到达
    let tx1 = tx.clone();
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(500));
        let _ = tx1.send("快速响应");
    });

    match rx.recv_timeout(Duration::from_secs(1)) {
        Ok(msg) => println!("场景1 - 收到: {}", msg),
        Err(e) => println!("场景1 - 错误: {:?}", e),
    }

    // 场景2：超时
    match rx.recv_timeout(Duration::from_millis(100)) {
        Ok(msg) => println!("场景2 - 收到: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("场景2 - 超时！"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("场景2 - 通道断开"),
    }

    // 场景3：通道关闭
    drop(tx);
    match rx.recv_timeout(Duration::from_secs(1)) {
        Ok(msg) => println!("场景3 - 收到: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("场景3 - 超时"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("场景3 - 通道已断开"),
    }
}
```

### 结构化消息传递

```rust
use std::sync::mpsc;
use std::thread;

// 定义消息类型
#[derive(Debug)]
enum Message {
    Task { id: u32, payload: String },
    Status { worker_id: u32, completed: u32 },
    Shutdown,
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // 启动工作线程
    let tx_worker = tx.clone();
    let worker = thread::spawn(move || {
        for i in 0..5 {
            tx_worker.send(Message::Task {
                id: i,
                payload: format!("任务数据 {}", i),
            }).unwrap();
        }
        tx_worker.send(Message::Status {
            worker_id: 1,
            completed: 5,
        }).unwrap();
        tx_worker.send(Message::Shutdown).unwrap();
    });

    drop(tx);

    // 处理消息
    for msg in rx {
        match msg {
            Message::Task { id, payload } => {
                println!("处理任务 {}: {}", id, payload);
            }
            Message::Status { worker_id, completed } => {
                println!("工作者 {} 已完成 {} 个任务", worker_id, completed);
            }
            Message::Shutdown => {
                println!("收到关闭信号");
                break;
            }
        }
    }

    worker.join().unwrap();
}
```

---

## Crossbeam 通道

标准库的 `mpsc` 通道功能有限，`crossbeam-channel` 提供了更强大的功能：

- **多消费者**：支持 MPMC（多生产者多消费者）
- **select 宏**：同时等待多个通道
- **更好的性能**：优化的无锁实现
- **更丰富的 API**：更多的通道操作方法

### 添加依赖

```toml
[dependencies]
crossbeam-channel = "0.5"
```

### 基本使用

```rust
use crossbeam_channel::{unbounded, bounded};
use std::thread;

fn main() {
    // 无界通道
    let (tx, rx) = unbounded();

    // 有界通道
    let (tx_bounded, rx_bounded) = bounded(10);

    thread::spawn(move || {
        tx.send("Hello").unwrap();
        tx.send("World").unwrap();
    });

    println!("{}", rx.recv().unwrap());
    println!("{}", rx.recv().unwrap());
}
```

### 多消费者模式（MPMC）

crossbeam 的最大优势之一是支持多消费者：

```rust
use crossbeam_channel::unbounded;
use std::thread;

fn main() {
    let (tx, rx) = unbounded();
    let mut handles = vec![];

    // 创建多个生产者
    for i in 0..3 {
        let tx = tx.clone();
        handles.push(thread::spawn(move || {
            for j in 0..5 {
                tx.send(format!("生产者{}: 消息{}", i, j)).unwrap();
            }
        }));
    }

    // 创建多个消费者（这在标准库中不可能！）
    for i in 0..2 {
        let rx = rx.clone();  // crossbeam 的 Receiver 可以克隆
        handles.push(thread::spawn(move || {
            while let Ok(msg) = rx.recv() {
                println!("[消费者{}] {}", i, msg);
            }
        }));
    }

    drop(tx);  // 关闭发送端

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### select! 宏 - 同时等待多个通道

```rust
use crossbeam_channel::{unbounded, select, after, never, tick};
use std::time::Duration;
use std::thread;

fn main() {
    let (tx1, rx1) = unbounded();
    let (tx2, rx2) = unbounded();

    // 生产者1：慢速发送
    thread::spawn(move || {
        for i in 0..3 {
            thread::sleep(Duration::from_millis(500));
            tx1.send(format!("通道1: {}", i)).unwrap();
        }
    });

    // 生产者2：快速发送
    thread::spawn(move || {
        for i in 0..5 {
            thread::sleep(Duration::from_millis(200));
            tx2.send(format!("通道2: {}", i)).unwrap();
        }
    });

    // 使用 select! 同时等待多个通道
    let timeout = after(Duration::from_secs(2));

    loop {
        select! {
            recv(rx1) -> msg => {
                match msg {
                    Ok(m) => println!("[RX1] {}", m),
                    Err(_) => println!("[RX1] 通道关闭"),
                }
            }
            recv(rx2) -> msg => {
                match msg {
                    Ok(m) => println!("[RX2] {}", m),
                    Err(_) => println!("[RX2] 通道关闭"),
                }
            }
            recv(timeout) -> _ => {
                println!("超时，退出");
                break;
            }
        }
    }
}
```

### 定时器和超时

crossbeam 提供了便捷的定时器通道：

```rust
use crossbeam_channel::{unbounded, after, tick, select};
use std::time::Duration;

fn main() {
    let (tx, rx) = unbounded();

    // 定时器：在指定时间后发送一个信号
    let timeout = after(Duration::from_secs(5));

    // 周期性定时器：每隔一段时间发送信号
    let ticker = tick(Duration::from_secs(1));

    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(3));
        tx.send("消息到达").unwrap();
    });

    loop {
        select! {
            recv(rx) -> msg => {
                println!("收到: {:?}", msg);
            }
            recv(ticker) -> _ => {
                println!("滴答...");
            }
            recv(timeout) -> _ => {
                println!("超时！");
                break;
            }
        }
    }
}
```

### 零容量通道（Rendezvous Channel）

零容量通道实现同步握手：

```rust
use crossbeam_channel::bounded;
use std::thread;

fn main() {
    // 零容量通道：发送方必须等待接收方
    let (tx, rx) = bounded(0);

    let sender = thread::spawn(move || {
        println!("[发送方] 准备发送...");
        tx.send("同步消息").unwrap();
        println!("[发送方] 发送完成（接收方已接收）");
    });

    thread::sleep(std::time::Duration::from_secs(1));

    println!("[接收方] 准备接收...");
    let msg = rx.recv().unwrap();
    println!("[接收方] 收到: {}", msg);

    sender.join().unwrap();
}
```

### 通道迭代器

```rust
use crossbeam_channel::unbounded;
use std::thread;

fn main() {
    let (tx, rx) = unbounded();

    thread::spawn(move || {
        for i in 0..5 {
            tx.send(i * 10).unwrap();
        }
    });

    // 阻塞迭代器
    for val in rx.iter() {
        println!("收到: {}", val);
    }

    // 非阻塞迭代器
    let (tx2, rx2) = unbounded();
    tx2.send(1).unwrap();
    tx2.send(2).unwrap();

    for val in rx2.try_iter() {
        println!("立即收到: {}", val);
    }
}
```

---

## 最佳实践

### 及时丢弃发送端

确保所有发送端都被丢弃，以便接收端的迭代能正确结束：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆发送端
    let tx1 = tx.clone();
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx1.send("from tx1").unwrap();
    });

    thread::spawn(move || {
        tx2.send("from tx2").unwrap();
    });

    // 重要：丢弃原始发送端！
    drop(tx);

    // 现在迭代器会在收到所有消息后正确结束
    for msg in rx {
        println!("{}", msg);
    }
}
```

### 使用结构化消息类型

定义清晰的消息枚举，而不是发送原始数据：

```rust
use std::sync::mpsc;

// 好的做法：使用枚举定义消息类型
enum Command {
    Process { id: u64, data: Vec<u8> },
    Pause,
    Resume,
    Shutdown,
}

// 避免：直接发送原始数据
// let (tx, rx) = mpsc::channel::<(u64, Vec<u8>, bool, bool)>();  // 不清晰

fn main() {
    let (tx, rx) = mpsc::channel::<Command>();

    tx.send(Command::Process { id: 1, data: vec![1, 2, 3] }).unwrap();
    tx.send(Command::Shutdown).unwrap();
}
```

### 处理发送失败

当接收端被丢弃时，发送会失败：

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 丢弃接收端
    drop(rx);

    // 发送失败，但可以恢复数据
    match tx.send("important data".to_string()) {
        Ok(_) => println!("发送成功"),
        Err(e) => {
            // e.0 包含未能发送的数据
            println!("发送失败，数据: {}", e.0);
        }
    }
}
```

### 选择合适的通道类型

| 场景 | 推荐通道 |
|------|---------|
| 简单的生产者-消费者 | `mpsc::channel()` |
| 需要背压控制 | `mpsc::sync_channel(n)` |
| 多消费者 | `crossbeam_channel` |
| 需要 select | `crossbeam_channel` |
| 高性能要求 | `crossbeam_channel` |
| 异步编程 | `tokio::sync::mpsc` |

### 避免在循环中创建通道

```rust
use std::sync::mpsc;
use std::thread;

// 不好的做法
fn bad_pattern() {
    for i in 0..100 {
        let (tx, rx) = mpsc::channel();  // 每次循环都创建新通道
        thread::spawn(move || {
            tx.send(i).unwrap();
        });
        println!("{}", rx.recv().unwrap());
    }
}

// 好的做法
fn good_pattern() {
    let (tx, rx) = mpsc::channel();  // 只创建一次

    for i in 0..100 {
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send(i).unwrap();
        });
    }

    drop(tx);

    for val in rx {
        println!("{}", val);
    }
}
```

---

## 常见陷阱

### 忘记丢弃发送端导致死锁

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    let tx_clone = tx.clone();
    thread::spawn(move || {
        tx_clone.send("message").unwrap();
    });

    // 错误：忘记 drop(tx)
    // 下面的循环会永远等待，因为 tx 还存在

    // 正确做法：
    drop(tx);

    for msg in rx {
        println!("{}", msg);
    }
}
```

### 在通道关闭后发送

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    drop(rx);  // 接收端已丢弃

    // 这会 panic（如果使用 unwrap）
    // tx.send("data").unwrap();

    // 正确做法：处理错误
    if tx.send("data").is_err() {
        println!("接收端已关闭，无法发送");
    }
}
```

### 同步通道死锁

```rust
use std::sync::mpsc;

fn main() {
    // 零容量同步通道
    let (tx, rx) = mpsc::sync_channel(0);

    // 错误：在同一线程中发送和接收零容量通道
    // tx.send("data").unwrap();  // 会永远阻塞！
    // let _ = rx.recv();

    // 正确做法：在不同线程中操作
    std::thread::spawn(move || {
        tx.send("data").unwrap();
    });

    println!("{}", rx.recv().unwrap());
}
```

### 消息顺序假设

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 多个发送者时，消息顺序不确定
    for i in 0..10 {
        let tx = tx.clone();
        thread::spawn(move || {
            tx.send(i).unwrap();
        });
    }

    drop(tx);

    // 不要假设收到的顺序是 0, 1, 2, ...
    // 顺序取决于线程调度
    for val in rx {
        println!("{}", val);  // 顺序可能是随机的
    }
}
```

### 过大的消息

```rust
use std::sync::mpsc;

// 避免发送大型数据结构
fn avoid_large_messages() {
    let (tx, rx) = mpsc::channel::<Vec<u8>>();

    // 不好：发送大量数据的副本
    let large_data = vec![0u8; 100_000_000];
    // tx.send(large_data).unwrap();  // 复制 100MB 数据

    // 好：发送 Box 或 Arc
    use std::sync::Arc;
    let (tx_arc, rx_arc) = mpsc::channel::<Arc<Vec<u8>>>();
    let large_data = Arc::new(vec![0u8; 100_000_000]);
    tx_arc.send(large_data).unwrap();  // 只复制 Arc（几个字节）
}
```

---

## 性能考量

### 通道类型选择

| 类型 | 吞吐量 | 内存使用 | 适用场景 |
|------|--------|----------|---------|
| 无界通道 | 高 | 无限增长 | 生产者速度 <= 消费者速度 |
| 有界通道 | 中 | 可控 | 需要背压，防止内存溢出 |
| crossbeam | 最高 | 优化 | 高性能要求 |

### 批量发送

减少通道操作次数以提高性能：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel::<Vec<i32>>();

    // 好：批量发送
    thread::spawn(move || {
        let mut batch = Vec::with_capacity(100);
        for i in 0..1000 {
            batch.push(i);
            if batch.len() >= 100 {
                tx.send(std::mem::take(&mut batch)).unwrap();
                batch = Vec::with_capacity(100);
            }
        }
        if !batch.is_empty() {
            tx.send(batch).unwrap();
        }
    });

    for batch in rx {
        println!("收到批次，大小: {}", batch.len());
    }
}
```

### 避免频繁克隆发送端

```rust
use std::sync::mpsc;
use std::thread;
use std::sync::Arc;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 使用 Arc<Mutex<Sender>> 在某些场景下可以避免克隆
    // 但通常直接克隆 Sender 更简单且性能足够

    // 标准做法：每个线程一个克隆
    for i in 0..4 {
        let tx = tx.clone();  // 轻量级操作
        thread::spawn(move || {
            tx.send(i).unwrap();
        });
    }

    drop(tx);
    for val in rx {
        println!("{}", val);
    }
}
```

### crossbeam vs mpsc 性能对比

```rust
use std::time::Instant;

fn benchmark_mpsc(iterations: usize) {
    let (tx, rx) = std::sync::mpsc::channel();

    let start = Instant::now();

    std::thread::spawn(move || {
        for i in 0..iterations {
            tx.send(i).unwrap();
        }
    });

    for _ in 0..iterations {
        rx.recv().unwrap();
    }

    println!("mpsc: {:?}", start.elapsed());
}

fn benchmark_crossbeam(iterations: usize) {
    let (tx, rx) = crossbeam_channel::unbounded();

    let start = Instant::now();

    std::thread::spawn(move || {
        for i in 0..iterations {
            tx.send(i).unwrap();
        }
    });

    for _ in 0..iterations {
        rx.recv().unwrap();
    }

    println!("crossbeam: {:?}", start.elapsed());
}

// crossbeam 通常比 mpsc 快 2-5 倍
```

---

## 实战场景

### 场景1：任务分发系统

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[derive(Debug)]
struct Task {
    id: u32,
    workload: u32,
}

#[derive(Debug)]
struct Result {
    task_id: u32,
    output: String,
}

fn main() {
    let (task_tx, task_rx) = mpsc::channel::<Task>();
    let (result_tx, result_rx) = mpsc::channel::<Result>();

    // 创建工作线程池
    let num_workers = 4;
    for worker_id in 0..num_workers {
        let task_rx = task_rx.clone();
        let result_tx = result_tx.clone();

        thread::spawn(move || {
            // 错误：mpsc::Receiver 不能克隆
            // 需要使用 Arc<Mutex<Receiver>> 或 crossbeam
        });
    }

    // 使用 crossbeam 的正确实现
    use crossbeam_channel::unbounded;

    let (task_tx, task_rx) = unbounded::<Task>();
    let (result_tx, result_rx) = unbounded::<Result>();

    for worker_id in 0..num_workers {
        let task_rx = task_rx.clone();
        let result_tx = result_tx.clone();

        thread::spawn(move || {
            while let Ok(task) = task_rx.recv() {
                // 模拟工作
                thread::sleep(Duration::from_millis(task.workload as u64));

                result_tx.send(Result {
                    task_id: task.id,
                    output: format!("工作者{} 完成任务{}", worker_id, task.id),
                }).unwrap();
            }
        });
    }

    // 分发任务
    for id in 0..20 {
        task_tx.send(Task { id, workload: 100 }).unwrap();
    }
    drop(task_tx);  // 关闭任务通道

    // 收集结果
    drop(result_tx);
    for result in result_rx {
        println!("{:?}", result);
    }
}
```

### 场景2：日志聚合器

```rust
use std::sync::mpsc;
use std::thread;
use std::time::{Instant, Duration};

#[derive(Debug)]
enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

#[derive(Debug)]
struct LogEntry {
    timestamp: Instant,
    level: LogLevel,
    source: String,
    message: String,
}

struct Logger {
    tx: mpsc::Sender<LogEntry>,
}

impl Logger {
    fn log(&self, level: LogLevel, source: &str, message: &str) {
        let _ = self.tx.send(LogEntry {
            timestamp: Instant::now(),
            level,
            source: source.to_string(),
            message: message.to_string(),
        });
    }

    fn info(&self, source: &str, message: &str) {
        self.log(LogLevel::Info, source, message);
    }

    fn error(&self, source: &str, message: &str) {
        self.log(LogLevel::Error, source, message);
    }
}

impl Clone for Logger {
    fn clone(&self) -> Self {
        Logger { tx: self.tx.clone() }
    }
}

fn main() {
    let (tx, rx) = mpsc::channel();
    let start = Instant::now();

    // 日志聚合线程
    let aggregator = thread::spawn(move || {
        for entry in rx {
            let elapsed = entry.timestamp.duration_since(start);
            println!(
                "[{:?}] [{:?}] [{}] {}",
                elapsed, entry.level, entry.source, entry.message
            );
        }
        println!("日志聚合器已关闭");
    });

    let logger = Logger { tx };

    // 模拟多个模块的日志
    let modules = vec!["auth", "database", "api", "cache"];
    let mut handles = vec![];

    for module in modules {
        let logger = logger.clone();
        let module = module.to_string();
        handles.push(thread::spawn(move || {
            for i in 0..3 {
                logger.info(&module, &format!("操作 {} 开始", i));
                thread::sleep(Duration::from_millis(50));
                logger.info(&module, &format!("操作 {} 完成", i));
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    drop(logger);
    aggregator.join().unwrap();
}
```

### 场景3：请求-响应模式

```rust
use std::sync::mpsc;
use std::thread;
use std::collections::HashMap;

type RequestId = u64;

struct Request {
    id: RequestId,
    query: String,
    response_channel: mpsc::Sender<Response>,
}

struct Response {
    id: RequestId,
    result: String,
}

fn main() {
    let (request_tx, request_rx) = mpsc::channel::<Request>();

    // 服务器线程
    let server = thread::spawn(move || {
        let mut database: HashMap<String, String> = HashMap::new();
        database.insert("user:1".to_string(), "Alice".to_string());
        database.insert("user:2".to_string(), "Bob".to_string());

        for request in request_rx {
            let result = database
                .get(&request.query)
                .cloned()
                .unwrap_or_else(|| "Not found".to_string());

            let _ = request.response_channel.send(Response {
                id: request.id,
                result,
            });
        }
    });

    // 客户端发送请求
    let queries = vec!["user:1", "user:2", "user:3"];

    for (id, query) in queries.iter().enumerate() {
        let (response_tx, response_rx) = mpsc::channel();

        request_tx.send(Request {
            id: id as u64,
            query: query.to_string(),
            response_channel: response_tx,
        }).unwrap();

        // 等待响应
        if let Ok(response) = response_rx.recv() {
            println!("请求 {} ({}): {}", response.id, query, response.result);
        }
    }

    drop(request_tx);
    server.join().unwrap();
}
```

### 场景4：管道模式

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建管道：输入 -> 过滤 -> 转换 -> 输出
    let (input_tx, input_rx) = mpsc::channel::<i32>();
    let (filter_tx, filter_rx) = mpsc::channel::<i32>();
    let (transform_tx, transform_rx) = mpsc::channel::<String>();

    // 阶段1：过滤偶数
    thread::spawn(move || {
        for val in input_rx {
            if val % 2 == 0 {
                filter_tx.send(val).unwrap();
            }
        }
    });

    // 阶段2：平方
    thread::spawn(move || {
        for val in filter_rx {
            transform_tx.send(format!("{}^2 = {}", val, val * val)).unwrap();
        }
    });

    // 阶段3：输出
    let output = thread::spawn(move || {
        for result in transform_rx {
            println!("{}", result);
        }
    });

    // 输入数据
    for i in 1..=10 {
        input_tx.send(i).unwrap();
    }

    drop(input_tx);
    output.join().unwrap();
}
```

---

## 面试要点

### mpsc 和 crossbeam 通道有什么区别？

**答案要点**：
- mpsc 是标准库提供的多生产者单消费者通道
- crossbeam 支持多消费者（MPMC）
- crossbeam 提供 select! 宏
- crossbeam 性能更好（无锁实现优化）
- crossbeam 有更丰富的 API（tick、after 等）

### 为什么 Receiver 不能 Clone？

**答案要点**：
- 保证单消费者语义
- 防止消息被多个接收者竞争
- 如果需要多消费者，使用 crossbeam 或 `Arc<Mutex<Receiver>>`

### 什么情况下使用同步通道？

**答案要点**：
- 需要背压控制，防止生产者过快
- 限制内存使用
- 需要生产者等待消费者处理
- 实现同步握手（零容量通道）

### 如何避免通道死锁？

**答案要点**：
- 确保所有发送端都被丢弃
- 避免在同一线程使用零容量同步通道
- 使用 try_recv 或 recv_timeout 而不是 recv
- 正确处理 SendError 和 RecvError

### 消息传递 vs 共享状态，如何选择？

**答案要点**：
- 消息传递：解耦合、清晰的数据流、避免锁
- 共享状态：低延迟、共享大量数据、简单计数器
- 消息传递适合任务分发、日志聚合、管道模式
- 共享状态适合缓存、配置、简单状态同步

### 发送大型数据时如何优化？

**答案要点**：
- 使用 `Arc<T>` 共享不可变数据
- 使用 `Box<T>` 避免栈上大对象
- 考虑发送引用（需要作用域线程或 crossbeam-scope）
- 批量发送减少通道操作

---

## 延伸阅读

### 官方文档
- [std::sync::mpsc 模块文档](https://doc.rust-lang.org/std/sync/mpsc/)
- [Rust Book - Message Passing](https://doc.rust-lang.org/book/ch16-02-message-passing.html)

### 第三方库
- [crossbeam-channel](https://docs.rs/crossbeam-channel) - 高性能 MPMC 通道
- [flume](https://docs.rs/flume) - 另一个高性能通道实现
- [tokio::sync::mpsc](https://docs.rs/tokio/latest/tokio/sync/mpsc/) - 异步通道

### 进阶阅读
- [Fearless Concurrency with Rust](https://blog.rust-lang.org/2015/04/10/Fearless-Concurrency.html)
- [Lock-free Programming in Rust](https://www.youtube.com/watch?v=s19G6n0UjsM)
- [Rust Atomics and Locks](https://marabos.nl/atomics/) - Mara Bos 的在线书籍

### 相关概念
- CSP (Communicating Sequential Processes)
- Actor 模型
- Go channels（Rust 通道的灵感来源之一）
