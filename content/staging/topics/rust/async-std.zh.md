---
title: async-std 异步运行时框架
description: async-std 综合指南，Rust 的异步运行时库，提供标准库组件的异步版本和熟悉的 API
track: rust
section: concurrency-async
difficulty: intermediate
tags:
  - Rust
  - async-std
  - async
  - concurrency
  - runtime
status: imported
origin: old/src/content/docs/rust/async-std.zh.md
divergence: 0.204
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Rust
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

## 概念解释

async-std 是 Rust 的异步运行时，它镜像了标准库的 API，同时提供 async/await 支持。它的设计目标是让 Rust 中的异步编程感觉像同步编程一样自然，通过提供熟悉的 std 类型（如 `File`、`TcpStream` 和 `Mutex`）的异步版本来实现这一点。

该库是 tokio 的替代方案，专注于简单性和温和的学习曲线。它提供：

- 异步 I/O 原语（文件、网络、定时器）
- 任务生成和调度
- 同步原语（Mutex、RwLock、通道）
- 流处理工具
- 工作窃取任务调度器

async-std 遵循 Rust 的零成本抽象理念，这意味着你只为你使用的功能付出代价，并且在正确优化时异步开销是最小的。

## 核心原理

### async-std 运行时模型

async-std 默认使用多线程工作窃取调度器。当你调用 `async_std::task::block_on()` 或生成任务时，运行时在线程池中管理它们的执行。

```rust
use async_std::task;

fn main() {
    task::block_on(async {
        println!("来自 async-std 的问候！");
    });
}
```

### Future 和任务执行

在 async-std 中，future 是惰性的 - 它们在被轮询之前不会执行。运行时将 future 轮询到完成，在底层处理复杂的状态机。

```rust
use async_std::task;
use std::time::Duration;

async fn delayed_greeting(name: &str, delay: u64) -> String {
    task::sleep(Duration::from_secs(delay)).await;
    format!("你好，{}！", name)
}

fn main() {
    task::block_on(async {
        let greeting = delayed_greeting("World", 1).await;
        println!("{}", greeting);
    });
}
```

### 协作式调度

async-std 使用协作式调度，意味着任务在 await 点自愿让出控制权。长时间运行的同步代码可能会阻塞执行器，因此使用阻塞操作的异步版本很重要。

## 关键概念

### 1. 任务生成

任务是 async-std 中并发执行的基本单位。

```rust
use async_std::task;

async fn compute(id: u32) -> u32 {
    task::sleep(std::time::Duration::from_millis(100)).await;
    id * 2
}

fn main() {
    task::block_on(async {
        // 生成并发任务
        let handle1 = task::spawn(compute(1));
        let handle2 = task::spawn(compute(2));
        let handle3 = task::spawn(compute(3));

        // 等待结果
        let results = (handle1.await, handle2.await, handle3.await);
        println!("结果: {:?}", results); // (2, 4, 6)
    });
}
```

### 2. 异步 I/O

async-std 提供标准 I/O 操作的异步版本。

```rust
use async_std::fs::File;
use async_std::io::{ReadExt, WriteExt};
use async_std::prelude::*;

async fn file_operations() -> std::io::Result<()> {
    // 写入文件
    let mut file = File::create("example.txt").await?;
    file.write_all(b"Hello, async-std!").await?;

    // 读取文件
    let mut file = File::open("example.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    println!("文件内容: {}", contents);

    Ok(())
}
```

### 3. 网络

带有异步操作的 TCP 和 UDP 网络。

```rust
use async_std::net::{TcpListener, TcpStream};
use async_std::io::{ReadExt, WriteExt};
use async_std::task;

async fn handle_client(mut stream: TcpStream) -> std::io::Result<()> {
    let mut buffer = [0u8; 1024];
    loop {
        let n = stream.read(&mut buffer).await?;
        if n == 0 {
            break;
        }
        stream.write_all(&buffer[..n]).await?;
    }
    Ok(())
}

async fn run_server() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("服务器在端口 8080 监听");

    while let Ok((stream, addr)) = listener.accept().await {
        println!("来自 {} 的新连接", addr);
        task::spawn(handle_client(stream));
    }
    Ok(())
}
```

### 4. 同步原语

async-std 提供异步感知的同步类型。

```rust
use async_std::sync::{Arc, Mutex, RwLock};
use async_std::task;

async fn shared_state_example() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = task::spawn(async move {
            let mut num = counter.lock().await;
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.await;
    }

    println!("计数器: {}", *counter.lock().await);
}
```

### 5. 通道

async-std 提供有界和无界通道用于通信。

```rust
use async_std::channel;
use async_std::task;

async fn channel_example() {
    let (sender, receiver) = channel::bounded::<i32>(10);

    // 生产者
    let producer = task::spawn(async move {
        for i in 0..5 {
            sender.send(i).await.unwrap();
            println!("发送: {}", i);
        }
    });

    // 消费者
    let consumer = task::spawn(async move {
        while let Ok(value) = receiver.recv().await {
            println!("接收: {}", value);
        }
    });

    producer.await;
    consumer.await;
}
```

## 代码示例

### 示例 1：并发 HTTP 请求

```rust
use async_std::task;
use std::time::Instant;

// 模拟的 HTTP 请求
async fn fetch_url(url: &str) -> Result<String, String> {
    task::sleep(std::time::Duration::from_millis(100)).await;
    Ok(format!("来自 {} 的响应", url))
}

async fn fetch_all_concurrent() {
    let urls = vec![
        "https://api.example.com/users",
        "https://api.example.com/posts",
        "https://api.example.com/comments",
    ];

    let start = Instant::now();

    let handles: Vec<_> = urls
        .iter()
        .map(|url| {
            let url = url.to_string();
            task::spawn(async move { fetch_url(&url).await })
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await);
    }

    println!("在 {:?} 内获取了 {} 个 URL", results.len(), start.elapsed());
    for result in results {
        println!("  {:?}", result);
    }
}

fn main() {
    task::block_on(fetch_all_concurrent());
}
```

### 示例 2：超时处理

```rust
use async_std::task;
use async_std::future::timeout;
use std::time::Duration;

async fn slow_operation() -> &'static str {
    task::sleep(Duration::from_secs(5)).await;
    "操作完成"
}

async fn with_timeout() {
    match timeout(Duration::from_secs(2), slow_operation()).await {
        Ok(result) => println!("成功: {}", result),
        Err(_) => println!("操作超时"),
    }
}

fn main() {
    task::block_on(with_timeout());
}
```

### 示例 3：流处理

```rust
use async_std::prelude::*;
use async_std::stream;
use async_std::task;
use std::time::Duration;

async fn stream_example() {
    // 创建间隔流
    let mut interval = stream::interval(Duration::from_millis(100));
    let mut count = 0;

    while let Some(_) = interval.next().await {
        count += 1;
        println!("滴答 {}", count);
        if count >= 5 {
            break;
        }
    }

    // 使用 map 和 filter 处理流
    let numbers = stream::from_iter(1..=10);
    let sum: i32 = numbers
        .filter(|n| futures::future::ready(n % 2 == 0))
        .map(|n| n * 2)
        .fold(0, |acc, n| futures::future::ready(acc + n))
        .await;

    println!("双倍偶数之和: {}", sum);
}

fn main() {
    task::block_on(stream_example());
}
```

### 示例 4：带连接池的 TCP 回显服务器

```rust
use async_std::net::{TcpListener, TcpStream};
use async_std::io::{BufReader, BufWriter, ReadExt, WriteExt};
use async_std::prelude::*;
use async_std::sync::Arc;
use async_std::task;
use std::sync::atomic::{AtomicUsize, Ordering};

struct Server {
    active_connections: AtomicUsize,
    max_connections: usize,
}

impl Server {
    fn new(max_connections: usize) -> Self {
        Server {
            active_connections: AtomicUsize::new(0),
            max_connections,
        }
    }

    fn try_acquire(&self) -> bool {
        let current = self.active_connections.load(Ordering::SeqCst);
        if current >= self.max_connections {
            return false;
        }
        self.active_connections
            .compare_exchange(current, current + 1, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }

    fn release(&self) {
        self.active_connections.fetch_sub(1, Ordering::SeqCst);
    }
}

async fn handle_connection(stream: TcpStream, server: Arc<Server>) -> std::io::Result<()> {
    let mut reader = BufReader::new(&stream);
    let mut writer = BufWriter::new(&stream);
    let mut line = String::new();

    loop {
        line.clear();
        let bytes_read = reader.read_line(&mut line).await?;
        if bytes_read == 0 {
            break;
        }
        writer.write_all(line.as_bytes()).await?;
        writer.flush().await?;
    }

    server.release();
    Ok(())
}

async fn run_limited_server() -> std::io::Result<()> {
    let server = Arc::new(Server::new(100));
    let listener = TcpListener::bind("127.0.0.1:8080").await?;

    while let Ok((stream, addr)) = listener.accept().await {
        if server.try_acquire() {
            println!("接受来自 {} 的连接", addr);
            let server = Arc::clone(&server);
            task::spawn(async move {
                if let Err(e) = handle_connection(stream, server).await {
                    eprintln!("连接错误: {}", e);
                }
            });
        } else {
            println!("拒绝来自 {} 的连接（达到限制）", addr);
        }
    }

    Ok(())
}
```

## 最佳实践

### 1. 使用 Prelude 以方便使用

```rust
// 导入常用的 trait 和类型
use async_std::prelude::*;

// 现在你可以直接使用扩展方法
async fn example() {
    let mut file = async_std::fs::File::open("test.txt").await.unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).await.unwrap();
}
```

### 2. 对 CPU 密集型工作使用 spawn_blocking

```rust
use async_std::task;

async fn cpu_intensive() {
    // 不要用 CPU 密集型工作阻塞异步运行时
    let result = task::spawn_blocking(|| {
        // 繁重的计算
        (0..1000000).sum::<u64>()
    })
    .await;

    println!("结果: {}", result);
}
```

### 3. 使用结构化并发

```rust
use async_std::task;
use futures::future::join_all;

async fn structured_concurrency() {
    let tasks: Vec<_> = (0..5)
        .map(|i| {
            task::spawn(async move {
                task::sleep(std::time::Duration::from_millis(100)).await;
                i * 2
            })
        })
        .collect();

    // 等待所有任务完成
    let results: Vec<_> = join_all(tasks).await;
    println!("结果: {:?}", results);
}
```

### 4. 优雅处理错误

```rust
use async_std::fs::File;
use async_std::io::ReadExt;

async fn read_config() -> Result<String, Box<dyn std::error::Error>> {
    let mut file = File::open("config.toml").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    Ok(contents)
}

async fn with_fallback() -> String {
    match read_config().await {
        Ok(config) => config,
        Err(e) => {
            eprintln!("读取配置失败: {}", e);
            String::from("default_config")
        }
    }
}
```

### 5. 对外部操作使用超时

```rust
use async_std::future::timeout;
use async_std::net::TcpStream;
use std::time::Duration;

async fn connect_with_timeout(addr: &str) -> std::io::Result<TcpStream> {
    timeout(Duration::from_secs(5), TcpStream::connect(addr))
        .await
        .map_err(|_| std::io::Error::new(
            std::io::ErrorKind::TimedOut,
            "连接超时"
        ))?
}
```

## 常见陷阱

### 1. 阻塞运行时

```rust
use async_std::task;

// 错误：阻塞异步运行时
async fn bad_example() {
    std::thread::sleep(std::time::Duration::from_secs(1)); // 阻塞！
    println!("完成");
}

// 正确：使用异步 sleep
async fn good_example() {
    task::sleep(std::time::Duration::from_secs(1)).await;
    println!("完成");
}

// 正确：对必要的阻塞操作使用 spawn_blocking
async fn blocking_io() {
    task::spawn_blocking(|| {
        std::fs::read_to_string("large_file.txt")
    })
    .await
    .unwrap();
}
```

### 2. 忘记 Await

```rust
use async_std::task;

async fn example() {
    // 错误：Future 创建但从未执行
    let _ = task::sleep(std::time::Duration::from_secs(1));

    // 正确：Await future
    task::sleep(std::time::Duration::from_secs(1)).await;
}
```

### 3. 在 Await 点持有锁

```rust
use async_std::sync::Mutex;
use async_std::task;

// 错误：锁跨越 await 持有
async fn bad_lock_usage(mutex: &Mutex<i32>) {
    let mut guard = mutex.lock().await;
    task::sleep(std::time::Duration::from_secs(1)).await; // 锁被持有！
    *guard += 1;
}

// 正确：最小化锁范围
async fn good_lock_usage(mutex: &Mutex<i32>) {
    {
        let mut guard = mutex.lock().await;
        *guard += 1;
    } // 锁在这里释放
    task::sleep(std::time::Duration::from_secs(1)).await;
}
```

### 4. 未处理任务 Panic

```rust
use async_std::task;

async fn may_panic() {
    panic!("糟糕！");
}

async fn handle_panics() {
    let handle = task::spawn(may_panic());

    // panic 在 await 时传播
    match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        task::block_on(async { handle.await })
    })) {
        Ok(_) => println!("任务完成"),
        Err(_) => println!("任务 panic"),
    }
}
```

### 5. 无界通道增长

```rust
use async_std::channel;
use async_std::task;

// 错误：无界通道可以无限增长
async fn unbounded_danger() {
    let (sender, receiver) = channel::unbounded::<i32>();
    // 如果消费者慢，内存使用会无限增长
}

// 正确：使用带背压的有界通道
async fn bounded_safe() {
    let (sender, receiver) = channel::bounded::<i32>(100);
    // 缓冲区满时发送者会阻塞
}
```

## 性能考虑

### 1. 任务粒度

生成太多细粒度任务可能由于调度开销而影响性能。

```rust
use async_std::task;

// 错误：太多小任务
async fn too_fine_grained(data: Vec<i32>) -> Vec<i32> {
    let handles: Vec<_> = data
        .into_iter()
        .map(|x| task::spawn(async move { x * 2 }))
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await);
    }
    results
}

// 正确：批处理
async fn batched(data: Vec<i32>) -> Vec<i32> {
    let chunk_size = 1000;
    let handles: Vec<_> = data
        .chunks(chunk_size)
        .map(|chunk| {
            let chunk = chunk.to_vec();
            task::spawn(async move {
                chunk.into_iter().map(|x| x * 2).collect::<Vec<_>>()
            })
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        results.extend(handle.await);
    }
    results
}
```

### 2. 缓冲区大小

为 I/O 操作选择适当的缓冲区大小。

```rust
use async_std::fs::File;
use async_std::io::{BufReader, BufWriter, ReadExt, WriteExt};

async fn buffered_io() -> std::io::Result<()> {
    // 使用缓冲 I/O 以获得更好的性能
    let file = File::open("large_file.txt").await?;
    let mut reader = BufReader::with_capacity(64 * 1024, file); // 64KB 缓冲区

    let output = File::create("output.txt").await?;
    let mut writer = BufWriter::with_capacity(64 * 1024, output);

    let mut buffer = vec![0u8; 8192];
    loop {
        let n = reader.read(&mut buffer).await?;
        if n == 0 {
            break;
        }
        writer.write_all(&buffer[..n]).await?;
    }
    writer.flush().await?;

    Ok(())
}
```

### 3. 通道选择

```rust
use async_std::channel;

// 对于高吞吐量场景，有界通道提供背压
async fn high_throughput() {
    // 小缓冲区用于低延迟
    let (tx, rx) = channel::bounded::<Message>(16);

    // 大缓冲区用于吞吐量
    let (tx, rx) = channel::bounded::<Message>(1024);
}

struct Message {
    data: Vec<u8>,
}
```

### 4. 避免不必要的分配

```rust
use async_std::io::{ReadExt, WriteExt};
use async_std::net::TcpStream;

// 错误：每次都分配新缓冲区
async fn allocating_read(stream: &mut TcpStream) -> std::io::Result<Vec<u8>> {
    let mut buffer = vec![0u8; 1024];
    let n = stream.read(&mut buffer).await?;
    buffer.truncate(n);
    Ok(buffer)
}

// 正确：重用缓冲区
async fn reusing_read(stream: &mut TcpStream, buffer: &mut Vec<u8>) -> std::io::Result<usize> {
    buffer.clear();
    buffer.resize(1024, 0);
    stream.read(buffer).await
}
```

## 实际场景

### 场景 1：网页爬虫

```rust
use async_std::task;
use async_std::sync::Mutex;
use std::collections::HashSet;
use std::sync::Arc;

struct Scraper {
    visited: Arc<Mutex<HashSet<String>>>,
    max_depth: usize,
}

impl Scraper {
    fn new(max_depth: usize) -> Self {
        Scraper {
            visited: Arc::new(Mutex::new(HashSet::new())),
            max_depth,
        }
    }

    async fn scrape(&self, url: String, depth: usize) -> Vec<String> {
        if depth > self.max_depth {
            return vec![];
        }

        // 检查是否已访问
        {
            let mut visited = self.visited.lock().await;
            if visited.contains(&url) {
                return vec![];
            }
            visited.insert(url.clone());
        }

        // 模拟获取页面
        task::sleep(std::time::Duration::from_millis(50)).await;
        println!("爬取: {} (深度: {})", url, depth);

        // 模拟提取链接
        let links: Vec<String> = (0..3)
            .map(|i| format!("{}/page{}", url, i))
            .collect();

        // 递归爬取链接的页面
        let mut handles = vec![];
        for link in links {
            let scraper = self.clone();
            handles.push(task::spawn(async move {
                scraper.scrape(link, depth + 1).await
            }));
        }

        let mut all_urls = vec![url];
        for handle in handles {
            all_urls.extend(handle.await);
        }

        all_urls
    }
}

impl Clone for Scraper {
    fn clone(&self) -> Self {
        Scraper {
            visited: Arc::clone(&self.visited),
            max_depth: self.max_depth,
        }
    }
}
```

### 场景 2：限流 API 客户端

```rust
use async_std::channel;
use async_std::task;
use std::time::{Duration, Instant};

struct RateLimiter {
    requests_per_second: u32,
    sender: channel::Sender<()>,
}

impl RateLimiter {
    fn new(requests_per_second: u32) -> Self {
        let (sender, receiver) = channel::bounded(1);

        // 令牌桶填充器
        task::spawn(async move {
            let interval = Duration::from_secs(1) / requests_per_second;
            loop {
                task::sleep(interval).await;
                let _ = receiver.try_recv();
            }
        });

        RateLimiter {
            requests_per_second,
            sender,
        }
    }

    async fn acquire(&self) {
        self.sender.send(()).await.unwrap();
    }
}

struct ApiClient {
    rate_limiter: RateLimiter,
    base_url: String,
}

impl ApiClient {
    fn new(base_url: &str, requests_per_second: u32) -> Self {
        ApiClient {
            rate_limiter: RateLimiter::new(requests_per_second),
            base_url: base_url.to_string(),
        }
    }

    async fn get(&self, endpoint: &str) -> Result<String, String> {
        self.rate_limiter.acquire().await;

        // 模拟 HTTP 请求
        task::sleep(Duration::from_millis(50)).await;
        Ok(format!("来自 {}{} 的响应", self.base_url, endpoint))
    }
}
```

### 场景 3：异步任务队列

```rust
use async_std::channel;
use async_std::sync::Arc;
use async_std::task;
use std::future::Future;
use std::pin::Pin;

type BoxFuture<T> = Pin<Box<dyn Future<Output = T> + Send>>;

struct TaskQueue {
    sender: channel::Sender<BoxFuture<()>>,
}

impl TaskQueue {
    fn new(workers: usize) -> Self {
        let (sender, receiver) = channel::bounded::<BoxFuture<()>>(100);
        let receiver = Arc::new(receiver);

        for _ in 0..workers {
            let receiver = Arc::clone(&receiver);
            task::spawn(async move {
                while let Ok(task) = receiver.recv().await {
                    task.await;
                }
            });
        }

        TaskQueue { sender }
    }

    async fn submit<F>(&self, task: F)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        self.sender.send(Box::pin(task)).await.unwrap();
    }
}

async fn task_queue_example() {
    let queue = TaskQueue::new(4);

    for i in 0..10 {
        queue.submit(async move {
            println!("处理任务 {}", i);
            task::sleep(std::time::Duration::from_millis(100)).await;
            println!("完成任务 {}", i);
        }).await;
    }

    // 等待任务完成
    task::sleep(std::time::Duration::from_secs(2)).await;
}
```

## 面试要点

### Q1：async-std 与 tokio 有何不同？

**答案**：两者都是 Rust 的异步运行时，但它们有不同的设计理念：

- **API 设计**：async-std 镜像标准库 API，使其更容易学习。tokio 有自己的 API 设计。
- **功能**：tokio 内置更多功能，如 `select!` 宏和 tracing 集成。
- **生态系统**：tokio 拥有更大的生态系统，在生产中使用更广泛。
- **性能**：两者都非常高性能；基准测试因用例而异。
- **兼容性**：它们使用不同的 reactor 实现，不能直接互操作。

### Q2：解释 `task::spawn` 和 `task::spawn_blocking` 的区别。

**答案**：
- `task::spawn` 创建在异步执行器上运行的异步任务。适用于 I/O 密集型工作。
- `task::spawn_blocking` 在专用线程池上运行闭包用于阻塞操作。用于 CPU 密集型工作或无法异步化的同步 I/O。

```rust
// I/O 的异步任务
task::spawn(async { /* 异步 I/O 操作 */ });

// CPU 密集型工作的阻塞任务
task::spawn_blocking(|| { /* 同步计算 */ });
```

### Q3：`async_std::prelude::*` 的目的是什么？

**答案**：prelude 模块重新导出常用的 trait 和类型，特别是在标准类型上提供异步方法的扩展 trait。导入它可以让你访问 `read_to_string()`、`write_all()` 和流组合器等方法，而无需单独导入每个 trait。

### Q4：如何在 async-std 中处理取消？

**答案**：async-std 没有内置的取消令牌，但你可以实现取消模式：

```rust
use async_std::channel;
use async_std::task;
use futures::future::{select, Either};
use std::pin::pin;

async fn cancellable_task(cancel: channel::Receiver<()>) {
    let work = async {
        // 长时间运行的工作
        task::sleep(std::time::Duration::from_secs(10)).await;
    };

    let cancel = async {
        let _ = cancel.recv().await;
    };

    let work = pin!(work);
    let cancel = pin!(cancel);

    match select(work, cancel).await {
        Either::Left(_) => println!("工作完成"),
        Either::Right(_) => println!("已取消"),
    }
}
```

### Q5：什么时候应该使用有界通道 vs 无界通道？

**答案**：
- **有界通道**：提供背压，防止内存耗尽。当生产者可能超过消费者时使用。
- **无界通道**：没有背压，可以无限增长。仅当你确定消费者能跟上或通道是短暂的时使用。

## 进一步阅读

- [async-std 官方文档](https://docs.rs/async-std)
- [async-std 书籍](https://book.async.rs/)
- [Rust 中的异步编程](https://rust-lang.github.io/async-book/)
- [Futures Crate 文档](https://docs.rs/futures)
- [Rust 异步运行时比较](https://www.reddit.com/r/rust/comments/lg0a7b/tokio_vs_asyncstd/)
- [async-std GitHub 仓库](https://github.com/async-rs/async-std)
