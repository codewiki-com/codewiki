---
title: Rust 异步编程
description: 掌握 Rust 异步：async/await、Future、Tokio 运行时
track: rust
section: concurrency-async
difficulty: advanced
tags:
  - Rust
  - async
  - await
  - Tokio
status: imported
origin: old/src/content/docs/rust/async.zh.md
divergence: 0.299
issues: []
legacy:
  category: Rust
  subcategory: 异步编程
  order: 4
  lastUpdated: 2026-01-07
---

异步编程是 Rust 中处理并发任务的重要方式，特别适合 I/O 密集型应用。本文将深入探讨 Rust 的异步编程模型，包括 `async/await` 语法、Future trait、Tokio 运行时以及常见的异步模式。

## 异步编程基础

### 什么是异步编程？

异步编程允许程序在等待 I/O 操作（如网络请求、文件读取）完成时执行其他任务，而不是阻塞当前线程。这种方式可以用较少的线程处理大量并发任务。

### 同步 vs 异步

```rust
// 同步代码 - 阻塞线程
use std::fs;

fn read_file_sync() -> String {
    fs::read_to_string("data.txt").unwrap()
}

// 异步代码 - 不阻塞线程
use tokio::fs;

async fn read_file_async() -> Result<String, std::io::Error> {
    fs::read_to_string("data.txt").await
}
```

### Rust 异步模型的特点

1. **零成本抽象**：异步代码编译后性能接近手写的状态机
2. **无运行时依赖**：核心语言特性不绑定特定运行时
3. **类型安全**：编译期检查确保内存安全
4. **组合性强**：可以轻松组合异步操作

## async/await 语法

### 基本用法

`async` 关键字将函数转换为异步函数，返回一个 `Future`。`await` 关键字用于等待 Future 完成。

```rust
use tokio;

// 异步函数
async fn say_hello() {
    println!("Hello, async world!");
}

// 带返回值的异步函数
async fn get_number() -> i32 {
    42
}

// 使用 await
async fn main_async() {
    say_hello().await;
    let number = get_number().await;
    println!("Got number: {}", number);
}

#[tokio::main]
async fn main() {
    main_async().await;
}
```

### 异步块

除了异步函数，还可以使用异步块创建 Future：

```rust
use tokio;

#[tokio::main]
async fn main() {
    let future = async {
        println!("Inside async block");
        42
    };

    let result = future.await;
    println!("Result: {}", result);
}
```

### 并发执行多个 Future

```rust
use tokio;

async fn task_one() -> String {
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    "Task 1 complete".to_string()
}

async fn task_two() -> String {
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    "Task 2 complete".to_string()
}

#[tokio::main]
async fn main() {
    // 顺序执行 - 总共需要 3 秒
    let result1 = task_one().await;
    let result2 = task_two().await;

    // 并发执行 - 只需要 2 秒（最长任务的时间）
    let (result1, result2) = tokio::join!(task_one(), task_two());
    println!("{}, {}", result1, result2);
}
```

### tokio::select! 宏

处理多个 Future，哪个先完成就处理哪个：

```rust
use tokio;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let task1 = async {
        sleep(Duration::from_secs(1)).await;
        "Task 1"
    };

    let task2 = async {
        sleep(Duration::from_secs(2)).await;
        "Task 2"
    };

    tokio::select! {
        result = task1 => {
            println!("{} completed first", result);
        }
        result = task2 => {
            println!("{} completed first", result);
        }
    }
}
```

## Future Trait

### Future 的本质

`Future` 是 Rust 异步编程的核心 trait，定义如下：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

### 手动实现 Future

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

struct Delay {
    when: Instant,
}

impl Delay {
    fn new(duration: Duration) -> Self {
        Delay {
            when: Instant::now() + duration,
        }
    }
}

impl Future for Delay {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if Instant::now() >= self.when {
            Poll::Ready(())
        } else {
            // 在实际实现中，这里应该注册唤醒器
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

// 使用自定义 Future
#[tokio::main]
async fn main() {
    let delay = Delay::new(Duration::from_secs(2));
    delay.await;
    println!("2 seconds have passed");
}
```

### Pin 和 Unpin

`Pin` 用于确保 Future 在内存中的位置不会改变，这对于自引用结构至关重要：

```rust
use std::pin::Pin;

// 大多数类型自动实现 Unpin
struct SafeStruct {
    data: i32,
}

// 自引用结构需要 !Unpin
use std::marker::PhantomPinned;

struct SelfReferential {
    data: String,
    pointer: *const String,
    _pin: PhantomPinned,
}

impl SelfReferential {
    fn new(data: String) -> Pin<Box<Self>> {
        let mut boxed = Box::pin(SelfReferential {
            data,
            pointer: std::ptr::null(),
            _pin: PhantomPinned,
        });

        // 设置自引用指针
        let ptr = &boxed.data as *const String;
        unsafe {
            let mut_ref = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).pointer = ptr;
        }

        boxed
    }
}
```

## Tokio 运行时

### Tokio 简介

Tokio 是 Rust 最流行的异步运行时，提供了异步任务调度、I/O 操作、定时器等功能。

### 创建运行时

```rust
use tokio::runtime::Runtime;

fn main() {
    // 方式 1: 使用 #[tokio::main] 宏
    // 这是最简单的方式
}

#[tokio::main]
async fn main_macro() {
    println!("Using tokio::main macro");
}

// 方式 2: 手动创建运行时
fn main_manual() {
    let rt = Runtime::new().unwrap();

    rt.block_on(async {
        println!("Running in Tokio runtime");
    });
}

// 方式 3: 自定义运行时配置
fn main_custom() {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .thread_name("my-custom-runtime")
        .thread_stack_size(3 * 1024 * 1024)
        .enable_all()
        .build()
        .unwrap();

    rt.block_on(async {
        println!("Custom runtime");
    });
}
```

### 任务生成（Spawning）

```rust
use tokio;

#[tokio::main]
async fn main() {
    // 生成一个新任务
    let handle = tokio::spawn(async {
        println!("Task running in background");
        42
    });

    // 等待任务完成
    let result = handle.await.unwrap();
    println!("Task returned: {}", result);

    // 生成多个任务
    let mut handles = vec![];

    for i in 0..5 {
        let handle = tokio::spawn(async move {
            println!("Task {} starting", i);
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            println!("Task {} completed", i);
            i * 2
        });
        handles.push(handle);
    }

    // 等待所有任务完成
    for handle in handles {
        let result = handle.await.unwrap();
        println!("Result: {}", result);
    }
}
```

### 通道（Channels）

Tokio 提供了多种异步通道用于任务间通信：

```rust
use tokio::sync::{mpsc, oneshot};

#[tokio::main]
async fn main() {
    // mpsc: 多生产者单消费者通道
    let (tx, mut rx) = mpsc::channel(32);

    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).await.unwrap();
        }
    });

    while let Some(value) = rx.recv().await {
        println!("Received: {}", value);
    }

    // oneshot: 一次性通道
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        tx.send("Hello from oneshot").unwrap();
    });

    let message = rx.await.unwrap();
    println!("{}", message);
}
```

### 广播通道

```rust
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    let (tx, mut rx1) = broadcast::channel(16);
    let mut rx2 = tx.subscribe();

    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).unwrap();
        }
    });

    let handle1 = tokio::spawn(async move {
        while let Ok(value) = rx1.recv().await {
            println!("Receiver 1 got: {}", value);
        }
    });

    let handle2 = tokio::spawn(async move {
        while let Ok(value) = rx2.recv().await {
            println!("Receiver 2 got: {}", value);
        }
    });

    handle1.await.unwrap();
    handle2.await.unwrap();
}
```

### 互斥锁（Mutex）

```rust
use tokio::sync::Mutex;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = tokio::spawn(async move {
            let mut num = counter.lock().await;
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }

    println!("Result: {}", *counter.lock().await);
}
```

## 异步模式与最佳实践

### 异步 Web 服务器示例

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server listening on 127.0.0.1:8080");

    loop {
        let (mut socket, addr) = listener.accept().await?;
        println!("New connection from: {}", addr);

        tokio::spawn(async move {
            let mut buffer = [0; 1024];

            loop {
                let n = match socket.read(&mut buffer).await {
                    Ok(n) if n == 0 => return,
                    Ok(n) => n,
                    Err(e) => {
                        eprintln!("Failed to read from socket: {}", e);
                        return;
                    }
                };

                if socket.write_all(&buffer[0..n]).await.is_err() {
                    eprintln!("Failed to write to socket");
                    return;
                }
            }
        });
    }
}
```

### 超时处理

```rust
use tokio::time::{timeout, Duration};

async fn long_running_task() -> Result<String, &'static str> {
    tokio::time::sleep(Duration::from_secs(5)).await;
    Ok("Task completed".to_string())
}

#[tokio::main]
async fn main() {
    match timeout(Duration::from_secs(2), long_running_task()).await {
        Ok(Ok(result)) => println!("Success: {}", result),
        Ok(Err(e)) => println!("Task failed: {}", e),
        Err(_) => println!("Task timed out"),
    }
}
```

### 重试机制

```rust
use tokio::time::{sleep, Duration};

async fn unreliable_operation() -> Result<String, &'static str> {
    // 模拟可能失败的操作
    if rand::random::<bool>() {
        Ok("Success".to_string())
    } else {
        Err("Operation failed")
    }
}

async fn retry_with_backoff<F, Fut, T, E>(
    mut f: F,
    max_retries: u32,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
{
    let mut retries = 0;

    loop {
        match f().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                retries += 1;
                if retries >= max_retries {
                    return Err(e);
                }
                let delay = Duration::from_millis(100 * 2_u64.pow(retries));
                sleep(delay).await;
            }
        }
    }
}

#[tokio::main]
async fn main() {
    match retry_with_backoff(unreliable_operation, 5).await {
        Ok(result) => println!("Operation succeeded: {}", result),
        Err(e) => println!("Operation failed after retries: {}", e),
    }
}
```

### 异步生命周期管理

```rust
use tokio::sync::Mutex;
use std::sync::Arc;

struct Database {
    connection: String,
}

impl Database {
    async fn query(&self, sql: &str) -> String {
        // 模拟数据库查询
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        format!("Result of: {}", sql)
    }
}

struct Service {
    db: Arc<Mutex<Database>>,
}

impl Service {
    fn new(db: Database) -> Self {
        Service {
            db: Arc::new(Mutex::new(db)),
        }
    }

    async fn get_user(&self, id: i32) -> String {
        let db = self.db.lock().await;
        db.query(&format!("SELECT * FROM users WHERE id = {}", id)).await
    }
}

#[tokio::main]
async fn main() {
    let db = Database {
        connection: "localhost:5432".to_string(),
    };

    let service = Service::new(db);
    let result = service.get_user(1).await;
    println!("{}", result);
}
```

## Stream 与异步迭代

### Stream Trait

`Stream` 是异步版本的迭代器，用于处理异步数据序列：

```rust
use tokio_stream::{Stream, StreamExt};
use std::pin::Pin;
use std::task::{Context, Poll};

// 手动实现 Stream
struct Counter {
    count: u32,
    max: u32,
}

impl Stream for Counter {
    type Item = u32;

    fn poll_next(mut self: Pin<&mut Self>, _cx: &mut Context<'_>)
        -> Poll<Option<Self::Item>>
    {
        if self.count < self.max {
            let current = self.count;
            self.count += 1;
            Poll::Ready(Some(current))
        } else {
            Poll::Ready(None)
        }
    }
}

#[tokio::main]
async fn main() {
    let counter = Counter { count: 0, max: 5 };
    tokio::pin!(counter);

    while let Some(value) = counter.next().await {
        println!("Count: {}", value);
    }
}
```

### 使用 tokio-stream

```rust
use tokio_stream::{self as stream, StreamExt};
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    // 从迭代器创建 Stream
    let numbers = stream::iter(vec![1, 2, 3, 4, 5]);
    tokio::pin!(numbers);

    while let Some(num) = numbers.next().await {
        println!("Number: {}", num);
    }

    // 周期性 Stream
    let mut interval_stream = interval(Duration::from_secs(1));

    for _ in 0..5 {
        interval_stream.tick().await;
        println!("Tick!");
    }
}
```

### Stream 操作

```rust
use tokio_stream::{self as stream, StreamExt};

#[tokio::main]
async fn main() {
    let numbers = stream::iter(1..=10);

    // map: 转换每个元素
    let doubled = numbers
        .map(|x| x * 2)
        .collect::<Vec<_>>()
        .await;
    println!("Doubled: {:?}", doubled);

    // filter: 过滤元素
    let numbers = stream::iter(1..=10);
    let evens = numbers
        .filter(|x| x % 2 == 0)
        .collect::<Vec<_>>()
        .await;
    println!("Evens: {:?}", evens);

    // take: 获取前 N 个元素
    let numbers = stream::iter(1..=10);
    let first_five = numbers
        .take(5)
        .collect::<Vec<_>>()
        .await;
    println!("First five: {:?}", first_five);

    // fold: 累积操作
    let numbers = stream::iter(1..=5);
    let sum = numbers.fold(0, |acc, x| acc + x).await;
    println!("Sum: {}", sum);
}
```

### 合并多个 Stream

```rust
use tokio_stream::{self as stream, StreamExt};
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let stream1 = stream::iter(vec![1, 2, 3]);
    let stream2 = stream::iter(vec![4, 5, 6]);

    // 合并两个 Stream
    let merged = stream1.chain(stream2);
    let result = merged.collect::<Vec<_>>().await;
    println!("Merged: {:?}", result);

    // zip: 将两个 Stream 配对
    let letters = stream::iter(vec!['a', 'b', 'c']);
    let numbers = stream::iter(vec![1, 2, 3]);

    let zipped = letters.zip(numbers);
    let pairs = zipped.collect::<Vec<_>>().await;
    println!("Zipped: {:?}", pairs);
}
```

## 错误处理

### Result 与 Option

```rust
use tokio;

async fn might_fail() -> Result<String, &'static str> {
    if rand::random() {
        Ok("Success".to_string())
    } else {
        Err("Something went wrong")
    }
}

#[tokio::main]
async fn main() {
    match might_fail().await {
        Ok(value) => println!("Got: {}", value),
        Err(e) => eprintln!("Error: {}", e),
    }

    // 使用 ? 操作符
    async fn process() -> Result<(), Box<dyn std::error::Error>> {
        let result = might_fail().await?;
        println!("Processed: {}", result);
        Ok(())
    }

    if let Err(e) = process().await {
        eprintln!("Process failed: {}", e);
    }
}
```

### 自定义错误类型

```rust
use std::fmt;

#[derive(Debug)]
enum MyError {
    IoError(std::io::Error),
    ParseError(String),
    TimeoutError,
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::IoError(e) => write!(f, "IO error: {}", e),
            MyError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            MyError::TimeoutError => write!(f, "Operation timed out"),
        }
    }
}

impl std::error::Error for MyError {}

impl From<std::io::Error> for MyError {
    fn from(error: std::io::Error) -> Self {
        MyError::IoError(error)
    }
}

async fn complex_operation() -> Result<String, MyError> {
    // 操作可能返回不同类型的错误
    Ok("Success".to_string())
}

#[tokio::main]
async fn main() {
    match complex_operation().await {
        Ok(result) => println!("Result: {}", result),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

### 使用 anyhow 简化错误处理

```rust
use anyhow::{Context, Result};
use tokio;

async fn read_config() -> Result<String> {
    tokio::fs::read_to_string("config.toml")
        .await
        .context("Failed to read config file")?;

    Ok("config content".to_string())
}

async fn parse_config(content: &str) -> Result<i32> {
    content
        .parse()
        .context("Failed to parse config as integer")
}

#[tokio::main]
async fn main() -> Result<()> {
    let config = read_config().await?;
    let value = parse_config(&config).await?;
    println!("Parsed value: {}", value);
    Ok(())
}
```

## 性能优化

### 避免过度生成任务

```rust
use tokio;

#[tokio::main]
async fn main() {
    // 不好的做法：为每个小操作生成任务
    let mut handles = vec![];
    for i in 0..1000 {
        let handle = tokio::spawn(async move {
            i * 2
        });
        handles.push(handle);
    }

    // 更好的做法：批量处理
    let numbers: Vec<i32> = (0..1000).collect();
    let result: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
}
```

### 使用缓冲

```rust
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::fs::File;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 使用缓冲读取
    let file = File::open("input.txt").await?;
    let mut reader = BufReader::new(file);
    let mut contents = String::new();
    reader.read_to_string(&mut contents).await?;

    // 使用缓冲写入
    let file = File::create("output.txt").await?;
    let mut writer = BufWriter::new(file);
    writer.write_all(b"Hello, buffered world!").await?;
    writer.flush().await?;

    Ok(())
}
```

### 选择合适的通道大小

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    // 小缓冲区：适合低频消息
    let (tx1, mut rx1) = mpsc::channel(1);

    // 大缓冲区：适合高频消息，避免发送者阻塞
    let (tx2, mut rx2) = mpsc::channel(1000);

    // 无界通道：小心使用，可能导致内存问题
    let (tx3, mut rx3) = mpsc::unbounded_channel();
}
```

### 并行处理

```rust
use tokio;
use futures::future;

#[tokio::main]
async fn main() {
    let urls = vec![
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
    ];

    // 并行发送多个请求
    let futures: Vec<_> = urls.iter()
        .map(|url| fetch_url(url))
        .collect();

    let results = future::join_all(futures).await;

    for result in results {
        match result {
            Ok(content) => println!("Fetched: {}", content),
            Err(e) => eprintln!("Error: {}", e),
        }
    }
}

async fn fetch_url(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    // 模拟网络请求
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    Ok(format!("Content from {}", url))
}
```

### 使用 rayon 处理 CPU 密集型任务

```rust
use tokio;
use rayon::prelude::*;

#[tokio::main]
async fn main() {
    let numbers: Vec<i32> = (0..1_000_000).collect();

    // 在单独的线程中运行 CPU 密集型计算
    let result = tokio::task::spawn_blocking(move || {
        numbers.par_iter()
            .map(|&x| expensive_computation(x))
            .sum::<i32>()
    }).await.unwrap();

    println!("Result: {}", result);
}

fn expensive_computation(n: i32) -> i32 {
    // 模拟 CPU 密集型计算
    (0..100).fold(n, |acc, _| acc.wrapping_mul(2))
}
```

## 总结

Rust 的异步编程提供了高性能、类型安全的并发解决方案。关键要点：

1. **async/await** 提供了简洁的异步代码编写方式
2. **Future trait** 是异步编程的核心抽象
3. **Tokio** 提供了完整的异步运行时和工具
4. **Stream** 用于处理异步数据序列
5. **正确的错误处理**对于健壮的异步代码至关重要
6. **性能优化**需要权衡任务粒度、缓冲策略和并行度

掌握这些概念和模式，你就能编写出高效、可靠的异步 Rust 应用程序。

## 参考资源

- [Rust 异步编程官方书籍](https://rust-lang.github.io/async-book/)
- [Tokio 官方文档](https://tokio.rs)
- [futures-rs 文档](https://docs.rs/futures/)
- [tokio-stream 文档](https://docs.rs/tokio-stream/)
