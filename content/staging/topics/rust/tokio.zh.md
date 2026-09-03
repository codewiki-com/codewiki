---
title: Rust Tokio 异步运行时
description: 深入理解 Tokio 异步运行时的核心概念、工作原理和最佳实践，掌握任务调度、通道通信、异步 I/O 等关键技术
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - Tokio
  - 异步
  - 并发
  - 运行时
status: imported
origin: old/src/content/docs/rust/tokio.zh.md
divergence: 0.348
issues:
  - order-mismatch
legacy:
  category: Rust
  subcategory: 异步编程
  order: 42
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Tokio

Tokio 是 Rust 生态系统中最成熟、最广泛使用的异步运行时（async runtime）。它为 Rust 的 `async/await` 语法提供了执行环境，使开发者能够编写高性能、可扩展的网络应用程序。

Tokio 的核心作用是**执行异步任务**。Rust 的 `async fn` 返回的是一个 `Future`，而 `Future` 本身不会自动执行——它需要一个运行时来驱动（poll）。Tokio 正是扮演这个驱动者的角色。

### 历史背景

Tokio 项目始于 2016 年，由 Carl Lerche 创建。在 Rust 异步生态系统演进的过程中，Tokio 经历了多次重大重构：

- **Tokio 0.1**（2018）：基于 `futures 0.1`，使用组合子风格
- **Tokio 0.2**（2019）：引入 `async/await` 支持
- **Tokio 1.0**（2020）：稳定版本，承诺长期 API 兼容性

如今，Tokio 已成为 Rust 异步编程的事实标准，被 AWS、Discord、Cloudflare 等公司广泛采用。

### 解决什么问题

传统的同步 I/O 模型在处理大量并发连接时面临挑战：每个连接需要一个线程，而线程是昂贵的资源。Tokio 通过异步 I/O 和协作式调度解决这一问题：

```
传统模型（每连接一线程）:
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Thread 1 │  │ Thread 2 │  │ Thread 3 │
│ (阻塞等待)│  │ (阻塞等待)│  │ (阻塞等待)│
└──────────┘  └──────────┘  └──────────┘
    │              │              │
    ↓              ↓              ↓
[Connection 1] [Connection 2] [Connection 3]

Tokio 模型（异步多路复用）:
┌─────────────────────────────────────────┐
│           Tokio Runtime                 │
│  ┌──────────────────────────────────┐   │
│  │     工作线程池 (默认 CPU 核数)      │   │
│  └──────────────────────────────────┘   │
│          ↓         ↓         ↓          │
│     [Task 1]  [Task 2]  [Task N]       │
│          ↓         ↓         ↓          │
│    (Connection 1, 2, 3, ..., 10000+)   │
└─────────────────────────────────────────┘
```

### Tokio 的组成部分

Tokio 提供了完整的异步编程工具箱：

| 组件 | 功能 | 模块 |
|------|------|------|
| 运行时 | 任务调度和执行 | `tokio::runtime` |
| 任务 | 轻量级异步任务 | `tokio::task` |
| 网络 I/O | TCP、UDP、Unix 套接字 | `tokio::net` |
| 文件 I/O | 异步文件操作 | `tokio::fs` |
| 同步原语 | Mutex、通道、信号量 | `tokio::sync` |
| 定时器 | 延迟、超时、周期任务 | `tokio::time` |
| I/O 工具 | 读写扩展 trait | `tokio::io` |

## 核心原理

### 运行时架构

Tokio 运行时由以下核心组件构成：

```
┌────────────────────────────────────────────────────┐
│                  Tokio Runtime                      │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Worker    │  │   Worker    │  │   Worker    │ │
│  │   Thread    │  │   Thread    │  │   Thread    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │        │
│         ▼                ▼                ▼        │
│  ┌─────────────────────────────────────────────┐  │
│  │              Task Scheduler                  │  │
│  │         (工作窃取调度器)                       │  │
│  └─────────────────────────────────────────────┘  │
│                        │                           │
│         ┌──────────────┼──────────────┐           │
│         ▼              ▼              ▼           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │   I/O     │  │   Timer   │  │  Blocking │     │
│  │  Driver   │  │   Driver  │  │   Pool    │     │
│  │  (epoll)  │  │           │  │           │     │
│  └───────────┘  └───────────┘  └───────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 任务调度机制

Tokio 使用**工作窃取（work-stealing）**调度算法：

1. **本地队列**：每个工作线程有自己的任务队列
2. **全局队列**：新生成的任务首先进入全局队列
3. **工作窃取**：空闲线程从其他线程的队列"窃取"任务

```rust
// 任务调度示意（伪代码）
loop {
    // 1. 优先执行本地队列的任务
    if let Some(task) = local_queue.pop() {
        task.poll();
        continue;
    }

    // 2. 从全局队列获取任务
    if let Some(task) = global_queue.pop() {
        task.poll();
        continue;
    }

    // 3. 从其他线程窃取任务
    if let Some(task) = steal_from_others() {
        task.poll();
        continue;
    }

    // 4. 没有任务，进入休眠等待 I/O 事件
    park();
}
```

### I/O 驱动原理

Tokio 的 I/O 驱动基于操作系统的事件通知机制：

- **Linux**：epoll
- **macOS/BSD**：kqueue
- **Windows**：IOCP

当异步 I/O 操作（如 `TcpStream::read`）无法立即完成时：

1. 任务注册对 I/O 事件的兴趣
2. 任务让出控制权（返回 `Poll::Pending`）
3. 调度器执行其他就绪任务
4. I/O 事件发生时，任务被重新调度

```rust
// AsyncRead trait 的核心方法（简化）
fn poll_read(
    self: Pin<&mut Self>,
    cx: &mut Context<'_>,
    buf: &mut ReadBuf<'_>,
) -> Poll<io::Result<()>> {
    match self.try_read(buf) {
        Ok(n) => Poll::Ready(Ok(())),
        Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
            // 注册 waker，等待可读事件
            self.register_waker(cx.waker());
            Poll::Pending
        }
        Err(e) => Poll::Ready(Err(e)),
    }
}
```

### Future 的执行流程

```rust
async fn example() -> i32 {
    let a = async_op_1().await;  // await 点 1
    let b = async_op_2().await;  // await 点 2
    a + b
}

// 编译器生成的状态机（概念简化）
enum ExampleFuture {
    State0 { future: AsyncOp1Future },
    State1 { a: i32, future: AsyncOp2Future },
    Completed,
}

impl Future for ExampleFuture {
    type Output = i32;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<i32> {
        loop {
            match self.state {
                State0 { future } => {
                    match future.poll(cx) {
                        Poll::Ready(a) => self.state = State1 { a, future: async_op_2() },
                        Poll::Pending => return Poll::Pending,
                    }
                }
                State1 { a, future } => {
                    match future.poll(cx) {
                        Poll::Ready(b) => return Poll::Ready(a + b),
                        Poll::Pending => return Poll::Pending,
                    }
                }
                Completed => panic!("polled after completion"),
            }
        }
    }
}
```

### 运行时类型对比

| 特性 | 多线程运行时 | 单线程运行时 |
|------|------------|------------|
| 创建方式 | `Builder::new_multi_thread()` | `Builder::new_current_thread()` |
| 工作线程 | 默认等于 CPU 核数 | 1 |
| 适用场景 | 生产服务、高并发 | 测试、嵌入式、资源受限 |
| 任务调度 | 工作窃取 | 单线程队列 |
| `Send` 要求 | 任务必须 `Send` | 可以是 `!Send` |

## 核心要点

### #[tokio::main] 宏

`#[tokio::main]` 是启动 Tokio 运行时最简单的方式：

```rust
// 默认配置：多线程运行时
#[tokio::main]
async fn main() {
    println!("Hello, Tokio!");
}

// 等价于手动构建运行时
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            println!("Hello, Tokio!");
        })
}
```

宏的配置选项：

```rust
// 指定工作线程数
#[tokio::main(worker_threads = 2)]
async fn main() {}

// 单线程运行时（适合测试）
#[tokio::main(flavor = "current_thread")]
async fn main() {}

// 测试宏
#[tokio::test]
async fn test_async_function() {
    assert_eq!(2 + 2, 4);
}
```

### 任务生成（Spawning Tasks）

`tokio::spawn` 是创建并发任务的核心函数：

```rust
use tokio::task::JoinHandle;

#[tokio::main]
async fn main() {
    // spawn 返回 JoinHandle，可用于等待结果
    let handle: JoinHandle<i32> = tokio::spawn(async {
        // 异步任务体
        expensive_computation().await
    });

    // 等待任务完成
    let result = handle.await.unwrap();
    println!("结果: {}", result);
}
```

**关键约束**：任务必须是 `'static`：

```rust
// 错误：借用了局部变量
let data = vec![1, 2, 3];
tokio::spawn(async {
    println!("{:?}", data);  // 编译错误！
});

// 正确：使用 move 转移所有权
let data = vec![1, 2, 3];
tokio::spawn(async move {
    println!("{:?}", data);  // OK
});

// 正确：共享数据使用 Arc
let data = Arc::new(vec![1, 2, 3]);
let data_clone = data.clone();
tokio::spawn(async move {
    println!("{:?}", data_clone);
});
```

### 通道（Channels）

Tokio 提供多种异步通道类型：

#### mpsc（多生产者单消费者）

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    // 有界通道
    let (tx, mut rx) = mpsc::channel::<String>(32);

    // 生产者
    let tx2 = tx.clone();
    tokio::spawn(async move {
        tx.send("消息 1".into()).await.unwrap();
    });
    tokio::spawn(async move {
        tx2.send("消息 2".into()).await.unwrap();
    });

    // 消费者
    while let Some(msg) = rx.recv().await {
        println!("收到: {}", msg);
    }
}
```

#### oneshot（一次性通道）

```rust
use tokio::sync::oneshot;

async fn compute() -> i32 {
    42
}

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        let result = compute().await;
        tx.send(result).unwrap();
    });

    let value = rx.await.unwrap();
    println!("结果: {}", value);
}
```

#### broadcast（广播通道）

```rust
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<String>(16);

    let mut rx1 = tx.subscribe();
    let mut rx2 = tx.subscribe();

    tx.send("广播消息".into()).unwrap();

    // 两个接收者都会收到
    println!("rx1: {}", rx1.recv().await.unwrap());
    println!("rx2: {}", rx2.recv().await.unwrap());
}
```

#### watch（监视通道）

```rust
use tokio::sync::watch;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = watch::channel("初始配置");

    tokio::spawn(async move {
        loop {
            // 等待值变化
            rx.changed().await.unwrap();
            println!("配置更新为: {}", *rx.borrow());
        }
    });

    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    tx.send("新配置").unwrap();
}
```

### select! 宏

`select!` 用于同时等待多个异步操作，执行最先完成的分支：

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    tokio::select! {
        _ = sleep(Duration::from_secs(1)) => {
            println!("1 秒超时");
        }
        _ = sleep(Duration::from_secs(2)) => {
            println!("2 秒超时");
        }
    }
    // 输出: 1 秒超时
}
```

循环模式：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<i32>(32);
    let mut interval = tokio::time::interval(Duration::from_secs(1));

    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).await.unwrap();
            sleep(Duration::from_millis(500)).await;
        }
    });

    loop {
        tokio::select! {
            Some(value) = rx.recv() => {
                println!("收到值: {}", value);
            }
            _ = interval.tick() => {
                println!("定时任务触发");
            }
            else => {
                println!("所有通道已关闭");
                break;
            }
        }
    }
}
```

### 异步 I/O

#### TCP 服务器

```rust
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn handle_connection(mut socket: TcpStream) {
    let mut buffer = [0; 1024];

    loop {
        match socket.read(&mut buffer).await {
            Ok(0) => return,  // 连接关闭
            Ok(n) => {
                // Echo 回去
                socket.write_all(&buffer[..n]).await.unwrap();
            }
            Err(e) => {
                eprintln!("读取错误: {}", e);
                return;
            }
        }
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("服务器监听 127.0.0.1:8080");

    loop {
        let (socket, addr) = listener.accept().await?;
        println!("新连接: {}", addr);
        tokio::spawn(handle_connection(socket));
    }
}
```

#### 异步文件操作

```rust
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> std::io::Result<()> {
    // 写入文件
    fs::write("hello.txt", b"Hello, Tokio!").await?;

    // 读取文件
    let content = fs::read_to_string("hello.txt").await?;
    println!("内容: {}", content);

    // 追加内容
    let mut file = fs::OpenOptions::new()
        .append(true)
        .open("hello.txt")
        .await?;
    file.write_all(b"\nAppended").await?;

    Ok(())
}
```

## 代码示例

### 示例 1：并发 HTTP 请求

```rust
use std::time::Instant;

#[tokio::main]
async fn main() {
    let urls = vec![
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
        "https://httpbin.org/delay/1",
    ];

    let start = Instant::now();

    // 并发执行所有请求
    let handles: Vec<_> = urls
        .into_iter()
        .map(|url| {
            tokio::spawn(async move {
                let resp = reqwest::get(url).await;
                (url, resp.is_ok())
            })
        })
        .collect();

    // 等待所有请求完成
    for handle in handles {
        let (url, success) = handle.await.unwrap();
        println!("{}: {}", url, if success { "成功" } else { "失败" });
    }

    println!("总耗时: {:?}", start.elapsed());
    // 约 2 秒（而非串行的 4 秒）
}
```

### 示例 2：带超时的任务

```rust
use tokio::time::{timeout, Duration};

async fn slow_operation() -> String {
    tokio::time::sleep(Duration::from_secs(5)).await;
    "完成".to_string()
}

#[tokio::main]
async fn main() {
    match timeout(Duration::from_secs(2), slow_operation()).await {
        Ok(result) => println!("结果: {}", result),
        Err(_) => println!("操作超时"),
    }
}
```

### 示例 3：生产者-消费者模式

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[derive(Debug)]
struct Job {
    id: u32,
    payload: String,
}

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<Job>(100);

    // 生产者
    let producer = tokio::spawn(async move {
        for i in 0..10 {
            let job = Job {
                id: i,
                payload: format!("任务 {}", i),
            };
            println!("生产: {:?}", job);
            tx.send(job).await.unwrap();
            sleep(Duration::from_millis(100)).await;
        }
    });

    // 消费者
    let consumer = tokio::spawn(async move {
        while let Some(job) = rx.recv().await {
            println!("消费: {:?}", job);
            // 模拟处理时间
            sleep(Duration::from_millis(200)).await;
        }
    });

    let _ = tokio::join!(producer, consumer);
    println!("所有任务处理完毕");
}
```

### 示例 4：使用 JoinSet 管理任务组

```rust
use tokio::task::JoinSet;
use tokio::time::{sleep, Duration};

async fn process_item(id: u32) -> (u32, String) {
    sleep(Duration::from_millis(id as u64 * 100)).await;
    (id, format!("结果 {}", id))
}

#[tokio::main]
async fn main() {
    let mut set = JoinSet::new();

    // 添加任务
    for i in 0..5 {
        set.spawn(process_item(i));
    }

    // 按完成顺序获取结果
    while let Some(result) = set.join_next().await {
        match result {
            Ok((id, msg)) => println!("任务 {} 完成: {}", id, msg),
            Err(e) => println!("任务失败: {}", e),
        }
    }
}
```

### 示例 5：优雅关闭

```rust
use tokio::sync::broadcast;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let (shutdown_tx, _) = broadcast::channel::<()>(1);

    // 启动工作任务
    let mut rx = shutdown_tx.subscribe();
    let worker = tokio::spawn(async move {
        let mut counter = 0;
        loop {
            tokio::select! {
                _ = rx.recv() => {
                    println!("收到关闭信号，正在清理...");
                    break;
                }
                _ = sleep(Duration::from_secs(1)) => {
                    counter += 1;
                    println!("工作中... ({})", counter);
                }
            }
        }
        println!("工作任务已优雅关闭");
    });

    // 模拟运行一段时间后关闭
    sleep(Duration::from_secs(3)).await;
    println!("发送关闭信号...");
    let _ = shutdown_tx.send(());

    // 等待任务完成
    worker.await.unwrap();
    println!("程序退出");
}
```

## 最佳实践

### Cargo.toml 依赖配置

```toml
[dependencies]
# 完整功能（开发阶段）
tokio = { version = "1", features = ["full"] }

# 生产环境：按需启用
tokio = { version = "1", features = [
    "rt-multi-thread",  # 多线程运行时
    "macros",           # #[tokio::main] 等宏
    "net",              # TCP/UDP
    "time",             # 定时器
    "sync",             # 通道、锁
    "io-util",          # AsyncReadExt 等
    "fs",               # 异步文件系统
] }
```

### 运行时配置

```rust
use tokio::runtime::Builder;

fn create_optimized_runtime() -> tokio::runtime::Runtime {
    Builder::new_multi_thread()
        .worker_threads(num_cpus::get())     // 根据 CPU 核数设置
        .thread_name("tokio-worker")          // 便于调试
        .thread_stack_size(3 * 1024 * 1024)   // 3MB 栈大小
        .enable_all()
        .build()
        .expect("创建运行时失败")
}
```

### 正确处理阻塞操作

```rust
// 错误：在异步上下文中阻塞
async fn bad() {
    std::thread::sleep(std::time::Duration::from_secs(1));  // 阻塞整个线程！
}

// 正确：使用异步版本
async fn good_async() {
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
}

// 正确：CPU 密集型任务使用 spawn_blocking
async fn good_blocking() {
    let result = tokio::task::spawn_blocking(|| {
        // CPU 密集型计算
        heavy_computation()
    }).await.unwrap();
}
```

### 选择正确的同步原语

```rust
use std::sync::Mutex as StdMutex;
use tokio::sync::Mutex as TokioMutex;

// 使用 std::sync::Mutex：锁持有时间短，不跨越 await
let data = Arc::new(StdMutex::new(0));
{
    let mut guard = data.lock().unwrap();
    *guard += 1;
}  // 立即释放

// 使用 tokio::sync::Mutex：需要跨越 await 持有锁
let data = Arc::new(TokioMutex::new(0));
{
    let mut guard = data.lock().await;
    *guard += 1;
    some_async_operation().await;  // 可以跨越 await
}
```

### 资源清理

```rust
use tokio::signal;

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();

    loop {
        tokio::select! {
            Ok((socket, _)) = listener.accept() => {
                tokio::spawn(handle_connection(socket));
            }
            _ = signal::ctrl_c() => {
                println!("收到 Ctrl+C，正在关闭...");
                break;
            }
        }
    }

    // 清理资源
    println!("服务器已关闭");
}
```

## 常见陷阱

### 在异步代码中使用同步阻塞调用

```rust
// 错误：这会阻塞 Tokio 工作线程
async fn fetch_data() -> String {
    let resp = reqwest::blocking::get("https://api.example.com").unwrap();  // 阻塞！
    resp.text().unwrap()
}

// 正确：使用异步版本
async fn fetch_data() -> String {
    let resp = reqwest::get("https://api.example.com").await.unwrap();
    resp.text().await.unwrap()
}
```

### 忘记 .await

```rust
// 错误：Future 不会执行
async fn example() {
    tokio::time::sleep(Duration::from_secs(1));  // 没有 .await，不会等待
    println!("立即执行");
}

// 正确
async fn example() {
    tokio::time::sleep(Duration::from_secs(1)).await;
    println!("1 秒后执行");
}
```

### select! 中的取消安全问题

```rust
use tokio::io::AsyncReadExt;

// 危险：读取可能在中途被取消，导致数据丢失
async fn unsafe_read(stream: &mut TcpStream) {
    loop {
        tokio::select! {
            result = stream.read(&mut buffer) => {
                // 处理数据
            }
            _ = shutdown_signal() => {
                break;  // 如果 read 正在进行中，数据可能丢失
            }
        }
    }
}

// 安全：使用取消安全的操作或保护状态
async fn safe_read(stream: &mut TcpStream) {
    let mut read_future = stream.read(&mut buffer);
    loop {
        tokio::select! {
            result = &mut read_future => {
                // 处理完成的读取
                read_future = stream.read(&mut buffer);
            }
            _ = shutdown_signal() => {
                break;
            }
        }
    }
}
```

### 忽略 JoinHandle

```rust
// 警告：任务可能在后台失败而不被察觉
tokio::spawn(async {
    risky_operation().await;  // 如果 panic，不会被通知
});

// 推荐：显式处理结果
let handle = tokio::spawn(async {
    risky_operation().await
});

match handle.await {
    Ok(result) => println!("成功: {:?}", result),
    Err(e) => eprintln!("任务失败: {}", e),
}
```

### 无界通道导致内存溢出

```rust
// 危险：无界通道可能导致内存耗尽
let (tx, rx) = mpsc::unbounded_channel();

// 生产速度 > 消费速度时，内存会无限增长
for i in 0..1_000_000 {
    tx.send(large_data()).unwrap();
}

// 推荐：使用有界通道
let (tx, rx) = mpsc::channel(100);  // 缓冲区满时 send 会等待
```

### 跨 .await 持有 MutexGuard

```rust
// 错误：std::sync::MutexGuard 跨越 await 会导致问题
async fn bad(data: Arc<std::sync::Mutex<i32>>) {
    let guard = data.lock().unwrap();
    some_async_op().await;  // 编译可能通过，但会阻塞其他线程
    *guard += 1;
}

// 正确：使用 tokio::sync::Mutex
async fn good(data: Arc<tokio::sync::Mutex<i32>>) {
    let mut guard = data.lock().await;
    some_async_op().await;
    *guard += 1;
}

// 或者：在 await 前释放锁
async fn also_good(data: Arc<std::sync::Mutex<i32>>) {
    {
        let mut guard = data.lock().unwrap();
        *guard += 1;
    }  // guard 在这里释放
    some_async_op().await;
}
```

## 性能考量

### 任务粒度

```rust
// 不推荐：过细粒度，spawn 开销过大
for i in 0..10000 {
    tokio::spawn(async move {
        simple_operation(i);
    });
}

// 推荐：批量处理
const BATCH_SIZE: usize = 100;
for chunk in (0..10000).collect::<Vec<_>>().chunks(BATCH_SIZE) {
    let chunk = chunk.to_vec();
    tokio::spawn(async move {
        for i in chunk {
            simple_operation(i);
        }
    });
}
```

### 减少内存分配

```rust
// 复用 buffer
let mut buffer = vec![0u8; 4096];
loop {
    let n = socket.read(&mut buffer).await?;
    process(&buffer[..n]);
}

// 使用 bytes crate 进行零拷贝
use bytes::BytesMut;
let mut buf = BytesMut::with_capacity(4096);
socket.read_buf(&mut buf).await?;
```

### 使用 tower 进行背压控制

```rust
use tower::limit::ConcurrencyLimit;

// 限制同时处理的请求数
let service = ConcurrencyLimit::new(my_service, 100);
```

### 调整运行时参数

```rust
// 根据工作负载调整线程数
let rt = Builder::new_multi_thread()
    .worker_threads(4)  // I/O 密集型可以少于 CPU 核数
    .max_blocking_threads(32)  // 阻塞线程池大小
    .build()
    .unwrap();
```

### 监控和追踪

```rust
// 使用 tokio-console 进行运行时诊断
// Cargo.toml:
// tokio = { version = "1", features = ["tracing"] }
// console-subscriber = "0.2"

#[tokio::main]
async fn main() {
    console_subscriber::init();
    // ...
}
```

### 性能对比表

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| 高并发 TCP | 多线程运行时 + spawn | 充分利用多核 |
| 简单 CLI 工具 | 单线程运行时 | 减少开销 |
| CPU 密集计算 | spawn_blocking | 不阻塞异步线程 |
| 大量小任务 | 批量处理 | 减少调度开销 |
| 共享状态 | `Arc<Mutex>` | 选择合适的 Mutex 类型 |

## 实战场景

### 场景 1：高性能 Web 服务器

```rust
use axum::{routing::get, Router, extract::State, Json};
use std::sync::Arc;
use tokio::sync::RwLock;

struct AppState {
    counter: RwLock<u64>,
}

async fn get_count(State(state): State<Arc<AppState>>) -> Json<u64> {
    Json(*state.counter.read().await)
}

async fn increment(State(state): State<Arc<AppState>>) -> Json<u64> {
    let mut counter = state.counter.write().await;
    *counter += 1;
    Json(*counter)
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        counter: RwLock::new(0),
    });

    let app = Router::new()
        .route("/count", get(get_count))
        .route("/increment", get(increment))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### 场景 2：并发爬虫

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

async fn crawl(url: &str, semaphore: Arc<Semaphore>) -> Result<String, reqwest::Error> {
    let _permit = semaphore.acquire().await.unwrap();
    println!("爬取: {}", url);
    let resp = reqwest::get(url).await?;
    resp.text().await
}

#[tokio::main]
async fn main() {
    let urls = vec![
        "https://example.com/page1",
        "https://example.com/page2",
        "https://example.com/page3",
        // ...
    ];

    // 限制并发数为 10
    let semaphore = Arc::new(Semaphore::new(10));

    let mut handles = vec![];
    for url in urls {
        let sem = semaphore.clone();
        handles.push(tokio::spawn(async move {
            crawl(url, sem).await
        }));
    }

    for handle in handles {
        match handle.await.unwrap() {
            Ok(content) => println!("获取 {} 字节", content.len()),
            Err(e) => eprintln!("错误: {}", e),
        }
    }
}
```

### 场景 3：实时消息推送

```rust
use tokio::sync::broadcast;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

type Tx = broadcast::Sender<String>;

async fn handle_client(stream: TcpStream, tx: Tx) {
    let (reader, mut writer) = stream.into_split();
    let mut reader = BufReader::new(reader);
    let mut rx = tx.subscribe();

    // 接收广播消息并发送给客户端
    let write_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if writer.write_all(msg.as_bytes()).await.is_err() {
                break;
            }
        }
    });

    // 读取客户端消息并广播
    let mut line = String::new();
    loop {
        line.clear();
        if reader.read_line(&mut line).await.unwrap() == 0 {
            break;
        }
        let _ = tx.send(line.clone());
    }

    write_task.abort();
}

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();
    let (tx, _) = broadcast::channel::<String>(100);

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        let tx = tx.clone();
        tokio::spawn(handle_client(socket, tx));
    }
}
```

### 场景 4：定时任务调度器

```rust
use tokio::time::{interval, Duration, Instant};
use std::collections::BinaryHeap;
use std::cmp::Reverse;

struct ScheduledTask {
    run_at: Instant,
    task: Box<dyn FnOnce() + Send + 'static>,
}

#[tokio::main]
async fn main() {
    let mut interval = interval(Duration::from_secs(60));

    // 每分钟执行的任务
    let minute_task = tokio::spawn(async move {
        loop {
            interval.tick().await;
            println!("[{}] 每分钟任务执行", chrono::Local::now());
        }
    });

    // 每小时执行的任务
    let mut hourly_interval = interval(Duration::from_secs(3600));
    let hourly_task = tokio::spawn(async move {
        loop {
            hourly_interval.tick().await;
            println!("[{}] 每小时任务执行", chrono::Local::now());
        }
    });

    let _ = tokio::join!(minute_task, hourly_task);
}
```

## 面试要点

### 问题 1：Tokio 运行时是如何工作的？

**答**：Tokio 运行时包含以下核心组件：

1. **多线程调度器**：使用工作窃取算法在多个工作线程间分配任务
2. **I/O 驱动**：基于 epoll/kqueue/IOCP 的事件驱动 I/O
3. **定时器**：管理 sleep、timeout 等时间相关操作
4. **任务队列**：每个线程有本地队列，还有全局队列

当异步任务在 await 点暂停时，调度器会执行其他就绪任务，实现高效的协作式多任务。

### 问题 2：tokio::spawn 的任务为什么必须是 'static？

**答**：因为 spawn 的任务可能被调度到任意工作线程执行，且执行时机不确定。如果任务借用了栈上的数据，而该数据在任务执行前被销毁，就会导致悬垂引用。`'static` 约束确保任务拥有其所有数据的所有权，或者引用的是全局生命周期的数据。

```rust
// 使用 move 闭包转移所有权来满足 'static 要求
let data = String::from("hello");
tokio::spawn(async move {
    println!("{}", data);
});
```

### 问题 3：select! 宏的取消安全是什么意思？

**答**：当 `select!` 的某个分支完成时，其他分支的 Future 会被丢弃（取消）。如果一个 Future 在中间状态被取消，可能导致数据丢失或状态不一致。

例如，`AsyncReadExt::read` 不是取消安全的——如果读取了一些字节但 Future 在返回前被取消，这些字节就丢失了。

取消安全的操作例子：
- `tokio::sync::mpsc::Receiver::recv`
- `tokio::time::sleep`

### 问题 4：什么时候用 std::sync::Mutex，什么时候用 tokio::sync::Mutex？

**答**：

| 场景 | 选择 | 原因 |
|------|------|------|
| 锁内无 await，持锁时间短 | `std::sync::Mutex` | 开销更低 |
| 锁内有 await | `tokio::sync::Mutex` | 不阻塞异步线程 |
| 读多写少 | `tokio::sync::RwLock` | 允许并发读 |

关键规则：如果需要在持锁期间调用 `.await`，必须使用 Tokio 的异步锁。

### 问题 5：如何避免在异步代码中阻塞？

**答**：

1. **使用异步版本的 API**（如 `tokio::fs` 而非 `std::fs`）
2. **CPU 密集型任务使用 `spawn_blocking`**
3. **第三方库确保使用其异步版本**（如 `reqwest` 而非 `reqwest::blocking`）
4. **避免 `std::thread::sleep`**，使用 `tokio::time::sleep`
5. **大型同步计算拆分或移至阻塞线程池**

### 问题 6：Tokio 通道类型如何选择？

**答**：

| 通道类型 | 使用场景 |
|---------|---------|
| `mpsc` | 任务队列，多生产者发送到单消费者 |
| `oneshot` | 请求-响应模式，一次性结果返回 |
| `broadcast` | 事件通知，所有订阅者都收到每条消息 |
| `watch` | 配置更新，只关心最新值 |

## 延伸阅读

### 官方资源

- [Tokio 官方文档](https://tokio.rs) - 完整的 API 参考和教程
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial) - 官方入门教程
- [Tokio API 文档](https://docs.rs/tokio) - Rust docs.rs 上的 API 文档
- [Tokio GitHub](https://github.com/tokio-rs/tokio) - 源码和示例

### 相关框架

- [Axum](https://github.com/tokio-rs/axum) - Tokio 团队开发的 Web 框架
- [Hyper](https://hyper.rs) - 底层 HTTP 库
- [Tonic](https://github.com/hyperium/tonic) - gRPC 框架
- [Tower](https://github.com/tower-rs/tower) - 服务抽象层

### 进阶主题

- [Rust 异步编程](https://rust-lang.github.io/async-book/) - Rust 官方异步书籍
- [tokio-console](https://github.com/tokio-rs/console) - 运行时诊断工具
- [tracing](https://github.com/tokio-rs/tracing) - 结构化日志和追踪

### 性能与调试

- [性能调优指南](https://tokio.rs/tokio/topics/bridging) - 同步与异步代码桥接
- [mini-redis](https://github.com/tokio-rs/mini-redis) - 教学用 Redis 实现
- [Tokio 内部原理](https://tokio.rs/tokio/tutorial/async) - 深入理解运行时

---

> 本文全面介绍了 Tokio 异步运行时的核心概念、工作原理和最佳实践。掌握 Tokio 是编写高性能 Rust 网络应用的关键。建议读者在理解原理的基础上，通过实际项目练习来加深理解，并关注 Tokio 生态系统的持续发展。
